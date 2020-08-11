/* globals window */
const { ipcRenderer } = require('electron');

function openUrl(url, options = {}) {
	ipcRenderer.send('open-url', url, options);
}

function updateCheck() {
	ipcRenderer.send('check-for-updates');
}

function setIcon(nextIcon) {
	ipcRenderer.send('set-icon', nextIcon);
}

function scrollToTopNotification() {
	window.scrollTo(0, 0);
}

// eslint-disable-next-line no-unused-vars
const electronMiddleware = store => next => action => {
	switch (action.type) {
		case 'OPEN_URL':
			return openUrl(action.url, action.options);
		case 'CHECK_FOR_UPDATES':
			return updateCheck(next);
		case 'SET_ICON':
			return setIcon(action.icon);
		case 'SCROLL_TO_TOP':
			return scrollToTopNotification();
	}
	next(action);
};

module.exports = {
	electronMiddleware,
};
