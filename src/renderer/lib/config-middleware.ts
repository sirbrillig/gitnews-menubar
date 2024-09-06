import { Middleware } from 'redux';
import { AppReduxState } from '../types.ts';
import { isAction } from './helpers.ts';

export const configMiddleware: Middleware<{}, AppReduxState> =
	(_store) => (next) => (action) => {
		if (!isAction(action)) {
			throw new Error('Invalid action dispatched');
		}
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
