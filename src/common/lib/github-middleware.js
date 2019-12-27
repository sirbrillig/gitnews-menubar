require('dotenv').config();

const { markNotificationRead } = require('gitnews');
const isDemoMode = process.env.GITNEWS_DEMO_MODE ? true : false;

// eslint-disable-next-line no-unused-vars
const githubMiddleware = store => next => action => {
	switch (action.type) {
		case 'MARK_NOTE_READ':
			isDemoMode || markNoteRead(action.token, action.note);
	}
	next(action);
};

function markNoteRead(token, note) {
	markNotificationRead(token, note);
}

module.exports = {
	githubMiddleware,
};
