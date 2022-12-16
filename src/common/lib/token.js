const Store = require('electron-store');
const store = new Store();

function getToken() {
  // TODO: fix process and store
	return store.get( 'gitnews-token' ) || process.env.GITNEWS_TOKEN;
}

function setToken( token ) {
	store.set( 'gitnews-token', token );
}

module.exports = {
	getToken,
	setToken,
};
