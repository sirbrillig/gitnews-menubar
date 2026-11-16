import type { AccountInfo } from '../../shared-types';

/**
 * An account as it is written to disk. When encryption is available the token
 * is kept only in `encryptedApiKey`; `apiKey` is the plain-text fallback (and
 * the format used before encryption was added).
 */
export type StoredAccount = Omit<
	AccountInfo,
	'apiKey' | 'isTokenUnreadable'
> & {
	apiKey?: string;
	encryptedApiKey?: string;
};

export interface Encryptor {
	isAvailable: () => boolean;
	encrypt: (plainText: string) => string;
	decrypt: (encrypted: string) => string;
}

/**
 * `previousAccounts` is what is currently on disk. If an account's token could
 * not be decrypted and hasn't been replaced, its encrypted token is kept from
 * there so that it can still be read once access to the keychain is allowed.
 */
export function encodeAccounts(
	accounts: AccountInfo[],
	previousAccounts: StoredAccount[],
	encryptor: Encryptor
): StoredAccount[] {
	const canEncrypt = encryptor.isAvailable();
	return accounts.map(({ apiKey, isTokenUnreadable, ...account }) => {
		if (isTokenUnreadable && !apiKey) {
			const previous = previousAccounts.find((acc) => acc.id === account.id);
			if (previous?.encryptedApiKey) {
				return { ...account, encryptedApiKey: previous.encryptedApiKey };
			}
		}
		if (canEncrypt && apiKey) {
			return { ...account, encryptedApiKey: encryptor.encrypt(apiKey) };
		}
		return { ...account, apiKey };
	});
}

export function decodeAccounts(
	storedAccounts: StoredAccount[],
	encryptor: Encryptor,
	onError: (account: StoredAccount, error: unknown) => void
): { accounts: AccountInfo[]; hasPlainTextTokens: boolean } {
	let hasPlainTextTokens = false;
	const accounts = storedAccounts.map(
		({ apiKey, encryptedApiKey, ...account }) => {
			if (!encryptedApiKey) {
				if (apiKey) {
					hasPlainTextTokens = true;
				}
				return { ...account, apiKey: apiKey ?? '' };
			}
			try {
				return { ...account, apiKey: encryptor.decrypt(encryptedApiKey) };
			} catch (error) {
				onError({ ...account, encryptedApiKey }, error);
				return { ...account, apiKey: '', isTokenUnreadable: true };
			}
		}
	);
	return {
		accounts,
		hasPlainTextTokens: hasPlainTextTokens && encryptor.isAvailable(),
	};
}
