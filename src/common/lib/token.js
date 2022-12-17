import Store from 'electron-store';

const store = new Store();

export function getToken() {
  // TODO: fix process and store
	return store.get( 'gitnews-token' ) || process.env.GITNEWS_TOKEN;
}

export function setToken( token ) {
	store.set( 'gitnews-token', token );
}
