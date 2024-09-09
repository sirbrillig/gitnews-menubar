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
