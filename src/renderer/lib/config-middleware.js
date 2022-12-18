export const configMiddleware = store => next => action => { // eslint-disable-line no-unused-vars
	switch ( action.type ) {
		case 'CHANGE_TOKEN':
			window.electronApi.saveToken( action.token );
			break;
		case 'CHANGE_AUTO_LOAD':
			window.electronApi.toggleAutoLaunch( action.isEnabled );
	}
	next( action );
};
