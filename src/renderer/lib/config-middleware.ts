import { Middleware } from 'redux';
import { AppReduxState } from '../types';

export const configMiddleware: Middleware<
	object,
	AppReduxState
> = store => next => action => {
	switch (action.type) {
		case 'CHANGE_TOKEN':
			window.electronApi.saveToken(action.token);
			break;
		case 'CHANGE_AUTO_LOAD':
			window.electronApi.toggleAutoLaunch(action.isEnabled);
	}
	next(action);
};
