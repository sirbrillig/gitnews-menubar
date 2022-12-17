// require('dotenv').config();

// const { markNotificationRead } = require('gitnews');
const isDemoMode = true;
// TODO: fix demo mode
// const isDemoMode = process.env.GITNEWS_DEMO_MODE ? true : false;

// eslint-disable-next-line no-unused-vars
export const githubMiddleware = store => next => action => {
	switch (action.type) {
		case 'MARK_NOTE_READ':
			isDemoMode || markNoteRead(action.token, action.note);
	}
	next(action);
};

function markNoteRead(token, note) {
	note;
	// TODO: fix marking notifications read
	// markNotificationRead(token, note);
}
