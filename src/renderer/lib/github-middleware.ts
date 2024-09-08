// require('dotenv').config();

import { Middleware } from 'redux';
import type { AccountInfo, AppReduxState, Note } from '../types';
import { isAction } from './helpers';
import { getAllAccounts } from './accounts';

export function createGitHubMiddleware(): Middleware<{}, AppReduxState> {
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
				const accounts = getAllAccounts(store.getState());
				const account = accounts.find(
					(account) => account.id === action.note.gitnewsAccountId
				);
				if (!account) {
					console.error(
						'Cannot find account for notification to mark as read',
						action.note
					);

					return;
				}
				markNoteRead(action.note, account);
			}
		}
		next(action);
	};

	function markNoteRead(note: Note, account: AccountInfo) {
		window.electronApi.markNotificationRead(note, account);
	}
}
