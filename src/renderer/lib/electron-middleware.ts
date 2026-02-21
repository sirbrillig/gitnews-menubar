import { Middleware } from 'redux';
import { AppReduxState, IconType } from '../types';
import { isAction } from './helpers';

function openUrl(url: string) {
	window.electronApi.openUrl(url);
}

function setIcon(nextIcon: IconType) {
	window.electronApi.setIcon(nextIcon);
}

function scrollToTopNotification() {
	window.scrollTo(0, 0);
}

export const electronMiddleware: Middleware<unknown, AppReduxState> =
	() => (next) => (action) => {
		if (!isAction(action)) {
			throw new Error(
				'Invalid action dispatched in electron: ' + JSON.stringify(action)
			);
		}
		switch (action.type) {
			case 'OPEN_URL':
				return openUrl(action.url);
			case 'SET_ICON':
				return setIcon(action.icon);
			case 'SCROLL_TO_TOP':
				return scrollToTopNotification();
		}
		next(action);
	};
