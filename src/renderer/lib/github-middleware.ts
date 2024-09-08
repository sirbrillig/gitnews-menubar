// require('dotenv').config();

import { Middleware } from 'redux';
import type { AppReduxState, Note } from '../types';
import { isAction } from './helpers';

// FIXME: find a new way to do this
function createNoteMarkRead(data: any) {
	return (token: string, note: Note) => {};
}

export function createGitHubMiddleware(): Middleware<{}, AppReduxState> {
	const markNotificationRead = createNoteMarkRead({
		fetch: (url, options) => fetch(url, options),
		log: (message) => console.log('Gitnews: ' + message),
	});

	return (store) => (next) => (action) => {
		if (!isAction(action)) {
			throw new Error(
				'Invalid action dispatched in github controls: ' +
					JSON.stringify(action)
			);
		}
		switch (action.type) {
			case 'MARK_NOTE_READ': {
				if (store.getState().isDemoMode) {
					next(action);
					return;
				}
				markNoteRead(action.token, action.note);
			}
		}
		next(action);
	};

	function markNoteRead(token: string, note: Note) {
		markNotificationRead(token, note);
	}
}
