const AutoLaunch = require( 'auto-launch' );
const { setToken } = require( 'common/lib/helpers' );
const debugFactory = require( 'debug' );

const debug = debugFactory( 'gitnews-menubar' );

const configMiddleware = store => next => action => { // eslint-disable-line no-unused-vars
	switch ( action.type ) {
		case 'CHANGE_TOKEN':
			setToken( action.token );
			break;
		case 'CHANGE_AUTO_LOAD':
			changeAutoLoad( action.isEnabled );
	}
	next( action );
};

function changeAutoLoad( shouldEnable ) {
	debug( 'changing auto load to', shouldEnable );
	const autoLauncher = new AutoLaunch( { name: 'Gitnews' } );
	autoLauncher.isEnabled()
		.then( function( isEnabled ) {
			if ( shouldEnable && ! isEnabled ) {
				debug( 'enabling autoLauncher' );
				return autoLauncher.enable();
			}
			if ( ! shouldEnable && isEnabled ) {
				debug( 'disabling autoLauncher' );
				return autoLauncher.disable();
			}
		} )
		.then( function() {
			debug( 'autoload changed to', shouldEnable );
		} )
		.catch( function( err ) {
			console.error( 'failed to change autoload to', shouldEnable, err );
		} );
}

module.exports = {
	configMiddleware,
};

