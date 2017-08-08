const { shell } = require( 'electron' );

function openUrl( url ) {
	shell.openExternal( url );
}

const electronMiddleware = store => next => action => { // eslint-disable-line no-unused-vars
	if ( action.type !== 'OPEN_URL' ) {
		return next( action );
	}
	openUrl( action.url );
};

module.exports = {
	openUrl,
	electronMiddleware,
};
