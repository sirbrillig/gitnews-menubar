import { Middleware } from 'redux';
import { AppReduxState } from '../types';
import { isAction } from './helpers';

export const configMiddleware: Middleware<{}, AppReduxState> =
	(_store) => (next) => (action) => {
		if (!isAction(action)) {
			throw new Error(
				'Invalid action dispatched in config: ' + JSON.stringify(action)
			);
		}
		switch (action.type) {
			case 'CHANGE_AUTO_LOAD':
				window.electronApi.toggleAutoLaunch(action.isEnabled);
				break;
			case 'TOGGLE_LOGGING':
				window.electronApi.toggleLogging(action.isLogging);
				break;
			case 'SET_ACCOUNTS':
				window.electronApi.saveAccounts(action.accounts);
				break;
		}
		next(action);
	};
