import { Middleware } from 'redux';
import { AppReduxState, IconType } from '../types';
import { isAction } from './helpers';

function setIcon(nextIcon: IconType) {
	window.electronApi.setIcon(nextIcon);
}

function scrollToTopNotification() {
	window.scrollTo(0, 0);
}

export const electronMiddleware: Middleware<unknown, AppReduxState> =
	(store) => (next) => (action) => {
		if (!isAction(action)) {
			throw new Error(
				'Invalid action dispatched in electron: ' + JSON.stringify(action)
			);
		}
		switch (action.type) {
			case 'OPEN_URL':
				window.electronApi.openUrl(action.url).then((result) => {
					if (result?.error) {
						store.dispatch({
							type: 'ADD_CONNECTION_ERROR',
							error: result.error,
						});
					} else if (action.noteToMarkRead) {
						const { token, note } = action.noteToMarkRead;
						store.dispatch({ type: 'MARK_NOTE_READ', token, note });
					}
				});
				return;
			case 'SET_ICON':
				return setIcon(action.icon);
			case 'SCROLL_TO_TOP':
				return scrollToTopNotification();
		}
		next(action);
	};
