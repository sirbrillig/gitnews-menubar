/* globals window */

// TODO: is there something that's supposed to use this file?

export function createSerializeMiddleware(isDemoMode) {
	return store => next => action => {
		switch (action.type) {
			case 'MARK_NOTE_UNREAD':
			case 'MARK_NOTE_READ':
			case 'MARK_ALL_NOTES_SEEN':
				isDemoMode || writeState({ notes: store.getState().notes });
		}
		next(action);
	};
}

function writeState(state) {
	window.localStorage.setItem('gitnews-state', JSON.stringify(state));
}

export function getState() {
	const stateSting = window.localStorage.getItem('gitnews-state');
	if (!stateSting) {
		return {};
	}
	try {
		return JSON.parse(stateSting);
	} catch (error) {
		return {};
	}
}
