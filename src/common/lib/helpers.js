const Conf = require( 'conf' );
const config = new Conf();

const maxFetchInterval = secsToMs( 300 ); // 5 minutes

function getNoteId( note ) {
	return note.id;
}

function getToken() {
	return config.get( 'gitnews-token' ) || process.env.GITNEWS_TOKEN;
}

function setToken( token ) {
	config.set( 'gitnews-token', token );
}

function mergeNotifications( prevNotes, nextNotes ) {
	const getMatchingPrevNote = note => {
		const found = prevNotes.filter( prevNote => getNoteId( prevNote ) === getNoteId( note ) );
		return found.length ? found[ 0 ] : null;
	};
	const hasNoteUpdated = ( note, prevNote ) => ( note.updatedAt > prevNote.gitnewsSeenAt );
	return nextNotes.map( note => {
		const previousNote = getMatchingPrevNote( note );
		if ( previousNote && ! hasNoteUpdated( note, previousNote ) ) {
			return Object.assign( {}, note, { gitnewsSeen: previousNote.gitnewsSeen, gitnewsMarkedUnread: previousNote.gitnewsMarkedUnread } );
		}
		return note;
	} );
}

function msToSecs( ms ) {
	return parseInt( ms * 0.001, 10 );
}

function secsToMs( secs ) {
	return secs * 1000;
}

function isOfflineCode( code ) {
	const offlineCodes = [
		'ENETDOWN',
		'ENOTFOUND',
		'ETIMEDOUT',
		'ECONNABORTED',
		'ECONNRESET',
		'ENETUNREACH',
		'Z_BUF_ERROR',
	];
	return ( offlineCodes.includes( code ) );
}

function getFetchInterval( interval, retryCount ) {
	const fetchInterval = interval * ( retryCount + 1 );
	if ( fetchInterval > maxFetchInterval ) {
		return maxFetchInterval;
	}
	return fetchInterval;
}

function getErrorMessage( error ) {
	error = error || {};
	return [
		error.status,
		error.code,
		error.statusText,
		error.message,
		( typeof error === 'string' ) ? error : null,
		error.url ? `for url ${ error.url }` : '',
	].filter( Boolean ).join( '; ' );
}

function isGitHubOffline( error ) {
	return ( error.status && error.status.toString().startsWith( '5' ) );
}

function isInvalidJson( error ) {
	return error.type === 'invalid-json';
}

function getSecondsUntilNextFetch( lastChecked, fetchInterval ) {
	const interval = ( fetchInterval - ( Date.now() - ( lastChecked || 0 ) ) );
	return ( interval < 0 ) ? 0 : msToSecs( interval );
}

module.exports = {
	getNoteId,
	getToken,
	setToken,
	mergeNotifications,
	msToSecs,
	secsToMs,
	isOfflineCode,
	getErrorMessage,
	getFetchInterval,
	isGitHubOffline,
	isInvalidJson,
	getSecondsUntilNextFetch,
};
