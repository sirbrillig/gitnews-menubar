// require('dotenv').config();

const { createNoteMarkRead } = require('gitnews');

export function createGitHubMiddleware(isDemoMode) {
	const markNotificationRead = createNoteMarkRead({
		fetch: (url, options) => fetch(url, options),
		log: (message) => console.log("Gitnews: " + message),
	});

	// eslint-disable-next-line no-unused-vars,no-undef
	return store => next => action => {
		switch (action.type) {
			case 'MARK_NOTE_READ':
				isDemoMode || markNoteRead(action.token, action.note);
		}
		next(action);
	};

	function markNoteRead(token, note) {
		markNotificationRead(token, note);
	}
}
