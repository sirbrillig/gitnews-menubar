/* globals window */
const debugFactory = require( 'debug' );
const { isOfflineCode, getErrorMessage } = require( '../lib/helpers' );
const { getNotifications } = require( 'gitnews' );
const {
	changeToOffline,
	fetchBegin,
	fetchDone,
	gotNotes,
	addConnectionError,
} = require( '../lib/reducer' );

const debug = debugFactory( 'gitnews-menubar' );

const fetcher = store => next => action => { // eslint-disable-line no-unused-vars
	if ( action.type === 'CHANGE_TOKEN' ) {
		performFetch( Object.assign( {}, store.getState(), { token: action.token } ), next );
		return next( action );
	}

	if ( action.type !== 'GITNEWS_FETCH_NOTIFICATIONS' ) {
		return next( action );
	}

	performFetch( store.getState(), next );
};

function performFetch( { fetchingInProgress, token }, next ) {
	if ( fetchingInProgress ) {
		debug( 'skipping notifications check because we are already fetching' );
		return;
	}
	if ( ! window.navigator.onLine ) {
		debug( 'skipping notifications check because we are offline' );
		next( changeToOffline() );
		return;
	}
	debug( 'fetching notifications in middleware' );
	// NOTE: After this point, any return action MUST disable fetchingInProgress
	// or the app will get stuck never updating again.
	next( fetchBegin() );
	getNotifications( token )
		.then( notes => {
			debug( 'notifications retrieved', notes );
			next( gotNotes( notes ) );
		} )
		.catch( err => {
			debug( 'fetching notifications failed with the error', err );
			if ( err.code === 'GitHubTokenNotFound' ) {
				next( fetchDone() );
				return; // Do nothing. The case of having no token is handled in the App component.
			}
			if ( isOfflineCode( err.code ) ) {
				debug( 'notifications check failed because we are offline' );
				next( changeToOffline() );
				return;
			}
			// TODO: add class of errors like offline which are any 500 error from GitHub
			const errorString = 'Error fetching notifications: ' + getErrorMessage( err );
			console.error( errorString );
			next( addConnectionError( errorString ) );
		} );
}

module.exports = {
	fetcher,
};
