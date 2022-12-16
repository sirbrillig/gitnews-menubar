function openUrl(url, options = {}) {
	window.electronApi.openUrl(url, options);
}

function updateCheck() {
	window.electronApi.checkForUpdate();
}

function setIcon(nextIcon) {
	window.electronApi.setIcon(nextIcon);
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
