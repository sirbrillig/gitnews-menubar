import Store from 'electron-store';
import type { AccountInfo } from '../../shared-types';

/**
 * The data here will be saved in the OS so it will be available after an
 * upgrade or any other situation where the electron context (localStorage
 * where the in-app settings are saved) is lost.
 */
interface StoreSchema {
	accounts: AccountInfo[];
	'gitnews-token': string;
	'is-logging-enabled': boolean;
}

const store = new Store<StoreSchema>({
	defaults: {
		accounts: [],
		'gitnews-token': '',
		'is-logging-enabled': false,
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

export function getAccounts(): AccountInfo[] {
	return store.get('accounts');
}

export function setAccounts(accounts: AccountInfo[]): void {
	store.set('accounts', accounts);
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
