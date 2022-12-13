const Store = require('electron-store');
const store = new Store();

function getToken() {
	return store.get( 'gitnews-token' ) || process.env.GITNEWS_TOKEN;
}

function setToken( token ) {
	store.set( 'gitnews-token', token );
}

module.exports = {
	getToken,
	setToken,
};
