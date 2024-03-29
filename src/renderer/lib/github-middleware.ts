// require('dotenv').config();

import { Middleware } from 'redux';
import { AppReduxAction, AppReduxState } from '../types';
import { createNoteMarkRead, Note } from 'gitnews';

export function createGitHubMiddleware(): Middleware<object, AppReduxState> {
	const markNotificationRead = createNoteMarkRead({
		fetch: (url, options) => fetch(url, options),
		log: (message) => console.log('Gitnews: ' + message),
	});

	return (store) => (next) => (action: AppReduxAction) => {
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
