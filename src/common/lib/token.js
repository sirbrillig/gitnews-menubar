import Store from 'electron-store';

const store = new Store();

export function getToken() {
	return store.get( 'gitnews-token' );
}

export function setToken( token ) {
	store.set( 'gitnews-token', token );
}
