import { safeStorage } from 'electron';
import Store from 'electron-store';
import type { AccountInfo } from '../../shared-types';
import {
	decodeAccounts,
	encodeAccounts,
	type Encryptor,
	type StoredAccount,
} from './account-encryption';
import { logMessage } from './logging';

/**
 * The data here will be saved in the OS so it will be available after an
 * upgrade or any other situation where the electron context (localStorage
 * where the in-app settings are saved) is lost.
 */
interface StoreSchema {
	accounts: StoredAccount[];
	'gitnews-token': string;
	'is-logging-enabled': boolean;
	'is-beta-updates-enabled': boolean;
	'is-public-avatar-match-enabled': boolean;
}

const store = new Store<StoreSchema>({
	defaults: {
		accounts: [],
		'gitnews-token': '',
		'is-logging-enabled': false,
		'is-beta-updates-enabled': false,
		'is-public-avatar-match-enabled': true,
	},
});

export function getToken(): string {
	return store.get('gitnews-token');
}

export function isLoggingEnabled(): boolean {
	return store.get('is-logging-enabled');
}

export function toggleLogging(isEnabled: boolean): void {
	store.set('is-logging-enabled', isEnabled);
}

export function isBetaUpdatesEnabled(): boolean {
	return store.get('is-beta-updates-enabled');
}

export function setBetaUpdatesEnabled(isEnabled: boolean): void {
	store.set('is-beta-updates-enabled', isEnabled);
}

export function isPublicAvatarMatchEnabled(): boolean {
	return store.get('is-public-avatar-match-enabled');
}

export function setPublicAvatarMatchEnabled(isEnabled: boolean): void {
	store.set('is-public-avatar-match-enabled', isEnabled);
}

// Tokens are encrypted with a key kept in the OS keychain. This must only be
// used after the app's `ready` event.
const encryptor: Encryptor = {
	isAvailable: () => safeStorage.isEncryptionAvailable(),
	encrypt: (plainText) =>
		safeStorage.encryptString(plainText).toString('base64'),
	decrypt: (encrypted) =>
		safeStorage.decryptString(Buffer.from(encrypted, 'base64')),
};

export function getAccounts(): AccountInfo[] {
	const { accounts, hasPlainTextTokens } = decodeAccounts(
		store.get('accounts'),
		encryptor,
		(account, error) => {
			logMessage(
				`Failed to decrypt token for account ${account.name} (${account.serverUrl}): ${error}`,
				'error'
			);
		}
	);
	if (hasPlainTextTokens) {
		logMessage('Encrypting plain-text account tokens', 'info');
		setAccounts(accounts);
	}
	return accounts;
}

export function setAccounts(accounts: AccountInfo[]): void {
	if (!encryptor.isAvailable()) {
		logMessage(
			'Encryption is unavailable; saving tokens as plain text',
			'warn'
		);
	}
	store.set(
		'accounts',
		encodeAccounts(accounts, store.get('accounts'), encryptor)
	);
	// The legacy single token is migrated into an account by the renderer, so
	// once accounts exist there's no reason to keep it around in plain text.
	if (accounts.length > 0) {
		store.delete('gitnews-token');
	}
}

/**
 * Serialized renderer (redux-persist) state. This is kept in its own file,
 * separate from the Electron context, so that it survives anything that
 * clears localStorage and so that it can be read by other frameworks.
 */
const appStateStore = new Store<Record<string, string>>({
	name: 'app-state',
	// redux-persist keys are opaque strings; don't treat dots as paths.
	accessPropertiesByDotNotation: false,
});

export function getAppStateItem(key: string): string | null {
	return appStateStore.get(key) ?? null;
}

export function setAppStateItem(key: string, value: string): void {
	appStateStore.set(key, value);
}

export function removeAppStateItem(key: string): void {
	appStateStore.delete(key);
}
