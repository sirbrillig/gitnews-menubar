const { PANE_NOTIFICATIONS, PANE_CONFIG, PANE_TOKEN } = require( '../lib/constants' );
const { getToken, secsToMs, getNoteId, mergeNotifications } = require( '../lib/helpers' );

const defaultFetchInterval = secsToMs( 120 );

const initialState = {
	token: getToken(),
	notes: [],
	errors: [],
	lastChecked: false,
	lastSuccessfulCheck: false,
	fetchInterval: defaultFetchInterval,
	offline: false,
	currentPane: PANE_NOTIFICATIONS,
};

function reducer( state, action ) {
	if ( ! state ) {
		state = initialState;
	}
	switch ( action.type ) {
		case 'ADD_CONNECTION_ERROR':
			return Object.assign( {}, state, { errors: [ ...this.state.errors, action.error ], lastChecked: Date.now() } );
		case 'CLEAR_ERRORS':
			return Object.assign( {}, state, { errors: [] } );
		case 'SET_CURRENT_PANE':
			return Object.assign( {}, state, { currentPane: action.pane } );
		case 'MARK_NOTE_READ': {
			const notes = state.notes.map( note => {
				if ( getNoteId( note ) === getNoteId( action.note ) ) {
					note.unread = false;
				}
				return note;
			} );
			return Object.assign( {}, state, { notes } );
		}
		case 'MARK_ALL_NOTES_READ': {
			const notes = state.notes.map( note => Object.assign( note, { gitnewsSeen: true } ) );
			return Object.assign( {}, state, { notes } );
		}
		case 'CHANGE_TOKEN':
			return Object.assign( {}, state, { token: action.token } );
		case 'OFFLINE':
			// TODO: incrementally increase the fetchInterval if this is triggered more than once
			return Object.assign( {}, state, { offline: true, lastChecked: Date.now(), fetchInterval: secsToMs( 65 ) } );
		case 'NOTES_RETRIEVED':
			return Object.assign( {}, state, { offline: false, lastChecked: Date.now(), lastSuccessfulCheck: Date.now(), errors: [], fetchInterval: defaultFetchInterval, notes: mergeNotifications( state.notes, action.notes ) } );
	}
	return state;
}

function hideEditToken() {
	return { type: 'SET_CURRENT_PANE', pane: PANE_CONFIG };
}

function showEditToken() {
	return { type: 'SET_CURRENT_PANE', pane: PANE_TOKEN };
}

function hideConfig() {
	return { type: 'SET_CURRENT_PANE', pane: PANE_NOTIFICATIONS };
}

function showConfig() {
	return { type: 'SET_CURRENT_PANE', pane: PANE_CONFIG };
}

function markRead( note ) {
	return { type: 'MARK_NOTE_READ', note };
}

function clearErrors() {
	return { type: 'CLEAR_ERRORS' };
}

function markAllNotesSeen() {
	return { type: 'MARK_ALL_NOTES_READ' };
}

function changeToken( token ) {
	return { type: 'CHANGE_TOKEN', token };
}

function changeToOffline() {
	return { type: 'OFFLINE' };
}

function gotNotes( notes ) {
	return { type: 'NOTES_RETRIEVED', notes };
}

function addConnectionError( error ) {
	return { type: 'ADD_CONNECTION_ERROR', error };
}

module.exports = {
	reducer,
	hideEditToken,
	showEditToken,
	hideConfig,
	showConfig,
	markRead,
	markAllNotesSeen,
	clearErrors,
	changeToken,
	changeToOffline,
	gotNotes,
	addConnectionError,
};
