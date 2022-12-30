import Store from 'electron-store';

interface StoreSchema {
	'gitnews-token': string;
	'is-logging-enabled': boolean;
}

const store = new Store<StoreSchema>({
	defaults: {
		'gitnews-token': '',
		'is-logging-enabled': false,
	},
});

export function getToken(): string {
	return store.get('gitnews-token');
}

export function setToken(token: string): void {
	store.set('gitnews-token', token);
}

export function isLoggingEnabled(): boolean {
	return store.get('is-logging-enabled');
}

export function toggleLogging(isEnabled: boolean): void {
	store.set('is-logging-enabled', isEnabled);
}
