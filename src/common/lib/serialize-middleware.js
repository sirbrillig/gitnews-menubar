/* globals window */
// TODO: fix demo mode
// require('dotenv').config();

// TODO: fix demo mode
const isDemoMode = true;
// const isDemoMode = process.env.GITNEWS_DEMO_MODE ? true : false;

const serializeMiddleware = store => next => action => {
	switch (action.type) {
		case 'MARK_NOTE_UNREAD':
		case 'MARK_NOTE_READ':
		case 'MARK_ALL_NOTES_SEEN':
			isDemoMode || writeState({ notes: store.getState().notes });
	}
	next(action);
};

function writeState(state) {
	window.localStorage.setItem('gitnews-state', JSON.stringify(state));
}

function getState() {
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

module.exports = { serializeMiddleware, getState };
