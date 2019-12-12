/* globals window */

const serializeMiddleware = store => next => action => {
	switch ( action.type ) {
		case 'MARK_NOTE_UNREAD':
		case 'MARK_NOTE_READ':
		case 'MARK_ALL_NOTES_SEEN':
			// TODO: this needs to happen AFTER the reducer changes the state
			writeState( { notes: store.getState().notes } );
	}
	next( action );
};

function writeState( state ) {
	window.localStorage.setItem( 'gitnews-state', JSON.stringify( state ) );
}

function getState() {
	const stateSting = window.localStorage.getItem( 'gitnews-state' );
	if ( ! stateSting ) {
		return {};
	}
	try {
		return JSON.parse( stateSting );
	} catch ( error ) {
		return {};
	}
}

module.exports = { serializeMiddleware, getState };
