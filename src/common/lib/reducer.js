const {
	getToken,
	secsToMs,
	getNoteId,
	mergeNotifications,
	getFetchInterval,
} = require('common/lib/helpers');

const defaultFetchInterval = secsToMs(120);

const initialState = {
	token: getToken(),
	notes: [],
	errors: [],
	fetchingInProgress: false,
	lastChecked: false,
	lastSuccessfulCheck: false,
	fetchingStartedAt: false,
	fetchInterval: defaultFetchInterval,
	fetchRetryCount: 0,
	offline: false,
	isAutoLoadEnabled: false,
};

function reducer(state, action) {
	if (!state) {
		state = initialState;
	}
	// TODO: split these into sub-reducers
	switch (action.type) {
		case 'FETCH_BEGIN':
			return Object.assign({}, state, {
				fetchingInProgress: true,
				fetchingStartedAt: Date.now(),
			});
		case 'FETCH_END':
			return Object.assign({}, state, { fetchingInProgress: false });
		case 'ADD_CONNECTION_ERROR':
			return Object.assign({}, state, {
				errors: [...state.errors, action.error],
				lastChecked: Date.now(),
			});
		case 'CLEAR_ERRORS':
			return Object.assign({}, state, { errors: [] });
		case 'MARK_NOTE_UNREAD':
			return Object.assign({}, state, {
				notes: state.notes.map(note => {
					if (getNoteId(note) === getNoteId(action.note)) {
						return Object.assign({}, note, { gitnewsMarkedUnread: true });
					}
					return note;
				}),
			});
		case 'MARK_NOTE_READ':
			return Object.assign({}, state, {
				notes: state.notes.map(note => {
					if (getNoteId(note) === getNoteId(action.note)) {
						return Object.assign({}, note, {
							unread: false,
							gitnewsMarkedUnread: false,
						});
					}
					return note;
				}),
			});
		case 'MARK_ALL_NOTES_SEEN': {
			const notes = state.notes.map(note =>
				Object.assign(note, { gitnewsSeen: true, gitnewsSeenAt: Date.now() })
			);
			return Object.assign({}, state, { notes });
		}
		case 'CHANGE_TOKEN':
			return Object.assign({}, state, { token: action.token });
		case 'OFFLINE':
			return Object.assign({}, state, {
				offline: true,
				lastChecked: Date.now(),
				fetchInterval: getFetchInterval(secsToMs(60), state.fetchRetryCount),
				fetchRetryCount: state.fetchRetryCount + 1,
			});
		case 'NOTES_RETRIEVED':
			return Object.assign({}, state, {
				offline: false,
				lastChecked: Date.now(),
				lastSuccessfulCheck: Date.now(),
				fetchRetryCount: 0,
				errors: [],
				fetchInterval: defaultFetchInterval,
				notes: mergeNotifications(state.notes, action.notes),
			});
		case 'CHANGE_AUTO_LOAD':
			return Object.assign({}, state, { isAutoLoadEnabled: action.isEnabled });
	}
	return state;
}

function markRead(token, note) {
	return { type: 'MARK_NOTE_READ', token, note };
}

function markUnread(note) {
	return { type: 'MARK_NOTE_UNREAD', note };
}

function clearErrors() {
	return { type: 'CLEAR_ERRORS' };
}

function markAllNotesSeen() {
	return { type: 'MARK_ALL_NOTES_SEEN' };
}

function changeToken(token) {
	return { type: 'CHANGE_TOKEN', token };
}

function changeToOffline() {
	return { type: 'OFFLINE' };
}

function gotNotes(notes) {
	return { type: 'NOTES_RETRIEVED', notes };
}

function addConnectionError(error) {
	return { type: 'ADD_CONNECTION_ERROR', error };
}

function fetchBegin() {
	return { type: 'FETCH_BEGIN' };
}

function fetchDone() {
	return { type: 'FETCH_END' };
}

function fetchNotifications() {
	return { type: 'GITNEWS_FETCH_NOTIFICATIONS' };
}

function checkForUpdates() {
	return { type: 'CHECK_FOR_UPDATES' };
}

function openUrl(url, options) {
	return { type: 'OPEN_URL', url, options };
}

function setIcon(icon) {
	return { type: 'SET_ICON', icon };
}

function changeAutoLoad(isEnabled) {
	return { type: 'CHANGE_AUTO_LOAD', isEnabled };
}

function scrollToTop() {
	return { type: 'SCROLL_TO_TOP' };
}

module.exports = {
	reducer,
	markRead,
	markUnread,
	markAllNotesSeen,
	clearErrors,
	changeToken,
	changeToOffline,
	gotNotes,
	addConnectionError,
	fetchBegin,
	fetchDone,
	fetchNotifications,
	openUrl,
	checkForUpdates,
	setIcon,
	changeAutoLoad,
	scrollToTop,
};
