import { Middleware } from 'redux';
import { AppReduxAction, AppReduxState } from '../types';

function openUrl(url: string, options = {}) {
	window.electronApi.openUrl(url, options);
}

function setIcon(nextIcon: string) {
	window.electronApi.setIcon(nextIcon);
}

function scrollToTopNotification() {
	window.scrollTo(0, 0);
}

export const electronMiddleware: Middleware<object, AppReduxState> =
	(store) => (next) => (action: AppReduxAction) => {
		switch (action.type) {
			case 'OPEN_URL':
				return openUrl(action.url, action.options);
			case 'SET_ICON':
				return setIcon(action.icon);
			case 'SCROLL_TO_TOP':
				return scrollToTopNotification();
		}
		next(action);
	};
