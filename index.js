const { ipcMain } = require( 'electron' );
const menubar = require( 'menubar' );
const bar = menubar();

bar.on( 'after-create-window', () => {
	//bar.window.openDevTools();
} );

ipcMain.on( 'unread-notifications-count', ( event, arg ) => {
	const image = arg > 0 ? './IconTemplateAlert.png' : './IconTemplate.png';
	bar.tray.setImage( image );
} );
