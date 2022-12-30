import { Middleware } from 'redux';
import { AppReduxState, AppReduxAction } from '../types';

export const configMiddleware: Middleware<object, AppReduxState> =
	(store) => (next) => (action: AppReduxAction) => {
		switch (action.type) {
			case 'SET_INITIAL_TOKEN':
				window.electronApi.saveToken(action.token);
				break;
			case 'CHANGE_TOKEN':
				window.electronApi.saveToken(action.token);
				break;
			case 'CHANGE_AUTO_LOAD':
				window.electronApi.toggleAutoLaunch(action.isEnabled);
				break;
			case 'TOGGLE_LOGGING':
				window.electronApi.toggleLogging(action.isLogging);
				break;
		}
		next(action);
	};
