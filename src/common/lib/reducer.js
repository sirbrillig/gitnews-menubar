import {
	secsToMs,
	getNoteId,
	mergeNotifications,
	getFetchInterval,
} from 'common/lib/helpers';

const defaultFetchInterval = secsToMs(120);

const initialState = {
	token: undefined,
	notes: [],
	errors: [],
	mutedRepos: [],
	fetchingInProgress: false,
	lastChecked: false,
	lastSuccessfulCheck: false,
	fetchingStartedAt: false,
	fetchInterval: defaultFetchInterval,
	fetchRetryCount: 0,
	offline: false,
	isAutoLoadEnabled: false,
	filterType: 'all',
	appVisible: false,
};

export function reducer(state, action) {
	if (!state) {
		state = initialState;
	}
	switch (action.type) {
		case 'NOTE_APP_VISIBLE':
			return { ...state, appVisible: action.visible };
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
		case 'MUTE_REPO':
			return { ...state, mutedRepos: [...state.mutedRepos, action.repo] };
		case 'UNMUTE_REPO':
			return {
				...state,
				mutedRepos: state.mutedRepos.filter(
					repoName => repoName !== action.repo
				),
			};
		case 'SET_FILTER_TYPE':
			return { ...state, filterType: action.filterType };
	}
	return state;
}

export function muteRepo(repo) {
	return { type: 'MUTE_REPO', repo };
}

export function unmuteRepo(repo) {
	return { type: 'UNMUTE_REPO', repo };
}

export function markRead(token, note) {
	return { type: 'MARK_NOTE_READ', token, note };
}

export function markUnread(note) {
	return { type: 'MARK_NOTE_UNREAD', note };
}

export function clearErrors() {
	return { type: 'CLEAR_ERRORS' };
}

export function markAllNotesSeen() {
	return { type: 'MARK_ALL_NOTES_SEEN' };
}

export function changeToken(token) {
	return { type: 'CHANGE_TOKEN', token };
}

export function changeToOffline() {
	return { type: 'OFFLINE' };
}

export function gotNotes(notes) {
	return { type: 'NOTES_RETRIEVED', notes };
}

export function addConnectionError(error) {
	return { type: 'ADD_CONNECTION_ERROR', error };
}

export function fetchBegin() {
	return { type: 'FETCH_BEGIN' };
}

export function fetchDone() {
	return { type: 'FETCH_END' };
}

export function fetchNotifications() {
	return { type: 'GITNEWS_FETCH_NOTIFICATIONS' };
}

export function checkForUpdates() {
	return { type: 'CHECK_FOR_UPDATES' };
}

export function openUrl(url, options) {
	return { type: 'OPEN_URL', url, options };
}

export function setIcon(icon) {
	return { type: 'SET_ICON', icon };
}

export function changeAutoLoad(isEnabled) {
	return { type: 'CHANGE_AUTO_LOAD', isEnabled };
}

export function scrollToTop() {
	return { type: 'SCROLL_TO_TOP' };
}

export function setFilterType(filterType) {
	return { type: 'SET_FILTER_TYPE', filterType };
}

export function markAppHidden() {
	return { type: 'NOTE_APP_VISIBLE', visible: false };
}

export function markAppShown() {
	return { type: 'NOTE_APP_VISIBLE', visible: true };
}
