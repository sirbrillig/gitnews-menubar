import Store from 'electron-store';

interface StoreSchema {
	'gitnews-token': string;
}

const store = new Store<StoreSchema>({
	defaults: {
		'gitnews-token': '',
	},
});

export function getToken(): string {
	return store.get('gitnews-token');
}

export function setToken(token: string): void {
	store.set('gitnews-token', token);
}
