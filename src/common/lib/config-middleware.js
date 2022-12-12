const { ipcRenderer, app } = require('electron');
const { setToken } = require('common/lib/helpers');
const { setAutoLoadState } = require('common/lib/reducer');
const debugFactory = require('debug');

const debug = debugFactory('gitnews-menubar');

// eslint-disable-next-line no-unused-vars
const configMiddleware = store => next => action => {
	switch (action.type) {
		case 'CHANGE_TOKEN':
			setToken(action.token);
			break;
		case 'CHANGE_AUTO_LOAD': {
			changeAutoLoad(action.isEnabled);
			const settings = app.getLoginItemSettings();
			return next(setAutoLoadState(settings.openAtLogin));
		}
	}
	next(action);
};

function changeAutoLoad(shouldEnable) {
	debug('changing auto load to', shouldEnable);
	ipcRenderer.send('set-open-at-login', shouldEnable);
}

module.exports = {
	configMiddleware,
};
