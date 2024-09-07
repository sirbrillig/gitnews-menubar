// require('dotenv').config();

import { Middleware } from 'redux';
import { AppReduxState } from '../types';
import { isAction } from './helpers';
import { createNoteMarkRead, Note } from 'gitnews';

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
