const { markNotificationRead } = require( 'gitnews' );

const githubMiddleware = store => next => action => { // eslint-disable-line no-unused-vars
	switch ( action.type ) {
		case 'MARK_NOTE_READ':
			markNoteRead( action.token, action.note );
	}
	next( action );
};

function markNoteRead( token, note ) {
	markNotificationRead( token, note );
}

module.exports = {
	githubMiddleware,
};
