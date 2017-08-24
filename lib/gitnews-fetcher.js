/* globals window */
const debugFactory = require( 'debug' );
const { isOfflineCode, getErrorMessage, isGitHubOffline } = require( '../lib/helpers' );
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
	try {
		getNotifications( token )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				next( fetchDone() );
				next( gotNotes( notes ) );
			} )
			.catch( err => {
				debug( 'fetching notifications failed with the error', err );
				next( fetchDone() );
				getErrorHandler( next )( err );
			} );
	} catch ( err ) {
		debug( 'fetching notifications threw an error', err );
		next( fetchDone() );
		getErrorHandler( next )( err );
	}
}

function getErrorHandler( dispatch ) {
	return function handleFetchError( err ) {
		if ( err.code === 'GitHubTokenNotFound' ) {
			debug( 'notifications check failed because there is no token' );
			// Do nothing. The case of having no token is handled in the App component.
			return;
		}
		if ( isOfflineCode( err.code ) ) {
			debug( 'notifications check failed because we are offline' );
			dispatch( changeToOffline() );
			return;
		}
		if ( isGitHubOffline( err ) ) {
			debug( 'notifications check failed because GitHub is offline' );
			dispatch( changeToOffline() );
			return;
		}
		const errorString = 'Error fetching notifications: ' + getErrorMessage( err );
		console.error( errorString );
		dispatch( addConnectionError( errorString ) );
	};
}

module.exports = {
	fetcher,
	getErrorHandler,
};
