/* globals describe, it, expect */
const {
	encodeAccounts,
	decodeAccounts,
} = require('../src/main/lib/account-encryption');

function createMockEncryptor({ isAvailable = true } = {}) {
	return {
		isAvailable: () => isAvailable,
		encrypt: (plainText) => `encrypted:${plainText}`,
		decrypt: (encrypted) => {
			if (!encrypted.startsWith('encrypted:')) {
				throw new Error('Unable to decrypt');
			}
			return encrypted.slice('encrypted:'.length);
		},
	};
}

const account = {
	id: 'account-1',
	name: 'GitHub',
	apiKey: 'secret-token',
	serverUrl: 'https://api.github.com',
};

describe('encodeAccounts', () => {
	it('replaces the token with an encrypted copy when encryption is available', () => {
		const [stored] = encodeAccounts([account], [], createMockEncryptor());
		expect(stored.apiKey).toBeUndefined();
		expect(stored.encryptedApiKey).toBe('encrypted:secret-token');
		expect(stored.name).toBe('GitHub');
	});

	it('keeps the token as plain text when encryption is unavailable', () => {
		const [stored] = encodeAccounts(
			[account],
			[],
			createMockEncryptor({ isAvailable: false })
		);
		expect(stored.apiKey).toBe('secret-token');
		expect(stored.encryptedApiKey).toBeUndefined();
	});

	it('does not encrypt an empty token', () => {
		const [stored] = encodeAccounts(
			[{ ...account, apiKey: '' }],
			[],
			createMockEncryptor()
		);
		expect(stored.apiKey).toBe('');
		expect(stored.encryptedApiKey).toBeUndefined();
	});

	it('keeps the previous encrypted token for an unreadable account', () => {
		const [stored] = encodeAccounts(
			[{ ...account, name: 'Renamed', apiKey: '', isTokenUnreadable: true }],
			[{ ...account, apiKey: undefined, encryptedApiKey: 'old-encrypted' }],
			createMockEncryptor()
		);
		expect(stored.name).toBe('Renamed');
		expect(stored.encryptedApiKey).toBe('old-encrypted');
		expect(stored.apiKey).toBeUndefined();
		expect(stored.isTokenUnreadable).toBeUndefined();
	});

	it('encrypts a replacement token for a previously unreadable account', () => {
		const [stored] = encodeAccounts(
			[{ ...account, apiKey: 'new-token', isTokenUnreadable: true }],
			[{ ...account, apiKey: undefined, encryptedApiKey: 'old-encrypted' }],
			createMockEncryptor()
		);
		expect(stored.encryptedApiKey).toBe('encrypted:new-token');
		expect(stored.isTokenUnreadable).toBeUndefined();
	});
});

describe('decodeAccounts', () => {
	it('round-trips accounts through encodeAccounts', () => {
		const encryptor = createMockEncryptor();
		const { accounts, hasPlainTextTokens } = decodeAccounts(
			encodeAccounts([account], [], encryptor),
			encryptor,
			() => {}
		);
		expect(accounts).toEqual([account]);
		expect(hasPlainTextTokens).toBe(false);
	});

	it('reports plain-text tokens so they can be migrated', () => {
		const { accounts, hasPlainTextTokens } = decodeAccounts(
			[account],
			createMockEncryptor(),
			() => {}
		);
		expect(accounts).toEqual([account]);
		expect(hasPlainTextTokens).toBe(true);
	});

	it('does not report plain-text tokens when encryption is unavailable', () => {
		const { hasPlainTextTokens } = decodeAccounts(
			[account],
			createMockEncryptor({ isAvailable: false }),
			() => {}
		);
		expect(hasPlainTextTokens).toBe(false);
	});

	it('marks the token unreadable when it cannot be decrypted', () => {
		const errors = [];
		const rest = { ...account };
		delete rest.apiKey;
		const { accounts } = decodeAccounts(
			[{ ...rest, encryptedApiKey: 'garbage' }],
			createMockEncryptor(),
			(failedAccount) => errors.push(failedAccount.id)
		);
		expect(accounts).toEqual([
			{ ...rest, apiKey: '', isTokenUnreadable: true },
		]);
		expect(errors).toEqual(['account-1']);
	});
});
