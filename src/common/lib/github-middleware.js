// require('dotenv').config();

// const { markNotificationRead } = require('gitnews');

export function createGitHubMiddleware(isDemoMode) {
	// eslint-disable-next-line no-unused-vars,no-undef
	return store => next => action => {
		switch (action.type) {
			case 'MARK_NOTE_READ':
				isDemoMode || markNoteRead(action.token, action.note);
		}
		next(action);
	};
}

function markNoteRead(token, note) {
	note;
	// TODO: fix marking notifications read
	// markNotificationRead(token, note);
}
