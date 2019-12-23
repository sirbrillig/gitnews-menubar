/* globals window */
const { shell, ipcRenderer } = require( 'electron' );

function openUrl( url ) {
	shell.openExternal( url );
}

function updateCheck() {
	ipcRenderer.send( 'check-for-updates' );
}

function setIcon( nextIcon ) {
	ipcRenderer.send( 'set-icon', nextIcon );
}

function scrollToTopNotification() {
	window.scrollTo( 0, 0 );
}

const electronMiddleware = store => next => action => { // eslint-disable-line no-unused-vars
	switch ( action.type ) {
		case 'OPEN_URL':
			return openUrl( action.url );
		case 'CHECK_FOR_UPDATES':
			return updateCheck( next );
		case 'SET_ICON':
			return setIcon( action.icon );
		case 'SCROLL_TO_TOP':
			return scrollToTopNotification();
	}
	next( action );
};

module.exports = {
	electronMiddleware,
};
