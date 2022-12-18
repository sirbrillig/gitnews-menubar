const maxFetchInterval = secsToMs( 300 ); // 5 minutes

export function getNoteId( note ) {
	return note.id;
}

export function mergeNotifications( prevNotes, nextNotes ) {
	const getMatchingPrevNote = note => {
		const found = prevNotes.filter( prevNote => getNoteId( prevNote ) === getNoteId( note ) );
		return found.length ? found[ 0 ] : null;
	};
	const hasNoteUpdated = ( note, prevNote ) => ( note.updatedAt > prevNote.gitnewsSeenAt );
	return nextNotes.filter(x => x.api).map( note => {
		const previousNote = getMatchingPrevNote( note );
		if ( previousNote && ! hasNoteUpdated( note, previousNote ) ) {
			return Object.assign( {}, note, { gitnewsSeen: previousNote.gitnewsSeen, gitnewsMarkedUnread: previousNote.gitnewsMarkedUnread } );
		}
		return note;
	} );
}

export function msToSecs( ms ) {
	return parseInt( ms * 0.001, 10 );
}

export function secsToMs( secs ) {
	return secs * 1000;
}

export function isOfflineCode( code ) {
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

export function getFetchInterval( interval, retryCount ) {
	const fetchInterval = interval * ( retryCount + 1 );
	if ( fetchInterval > maxFetchInterval ) {
		return maxFetchInterval;
	}
	return fetchInterval;
}

export function getErrorMessage( error ) {
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

export function isGitHubOffline( error ) {
	return ( error.status && error.status.toString().startsWith( '5' ) );
}

export function isInvalidJson( error ) {
	return error.type === 'invalid-json';
}

export function getSecondsUntilNextFetch( lastChecked, fetchInterval ) {
	const interval = ( fetchInterval - ( Date.now() - ( lastChecked || 0 ) ) );
	return ( interval < 0 ) ? 0 : msToSecs( interval );
}
