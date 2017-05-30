const Conf = require( 'conf' );
const config = new Conf();

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
		return found.length ? found[ 0 ] : {};
	};
	return nextNotes.map( note => {
		note.gitnewsSeen = getMatchingPrevNote( note ).gitnewsSeen;
		return note;
	} );
}

function msToSecs( ms ) {
	return parseInt( ms * 0.001, 10 );
}

function secsToMs( secs ) {
	return secs * 1000;
}

module.exports = {
	getNoteId,
	getToken,
	setToken,
	mergeNotifications,
	msToSecs,
	secsToMs,
};
