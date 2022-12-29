import { Middleware } from 'redux';
import { AppReduxAction, AppReduxState, IconType } from '../types';

function openUrl(url: string) {
	window.electronApi.openUrl(url);
}

function setIcon(nextIcon: IconType) {
	window.electronApi.setIcon(nextIcon);
}

function scrollToTopNotification() {
	window.scrollTo(0, 0);
}

export const electronMiddleware: Middleware<object, AppReduxState> =
	(store) => (next) => (action: AppReduxAction) => {
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
