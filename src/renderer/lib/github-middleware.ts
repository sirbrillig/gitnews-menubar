// require('dotenv').config();

import { Middleware } from 'redux';
import type { AccountInfo, AppReduxState, Note } from '../types';
import { isAction } from './helpers';

export function createGitHubMiddleware(): Middleware<unknown, AppReduxState> {
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
				const account = store
					.getState()
					.accounts.find(
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
				break;
			}
			case 'UNSUBSCRIBE_NOTE': {
				if (store.getState().isDemoMode) {
					break;
				}
				const account = store
					.getState()
					.accounts.find(
						(account) => account.id === action.note.gitnewsAccountId
					);
				if (!account) {
					console.error(
						'Cannot find account for notification to unsubscribe',
						action.note
					);
					return;
				}
				markNoteRead(action.note, account);
				unsubscribeNote(action.note, account);
				break;
			}
		}
		next(action);
	};

	function markNoteRead(note: Note, account: AccountInfo) {
		window.electronApi.markNotificationRead(note, account);
	}

	function unsubscribeNote(note: Note, account: AccountInfo) {
		window.electronApi.unsubscribeNotification(note, account);
	}
}
