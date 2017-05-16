const { ipcMain, nativeImage, app } = require( 'electron' );
const path = require( 'path' );
const menubar = require( 'menubar' );

const unhandled = require( 'electron-unhandled' );

// Catch unhandled Promise rejections
unhandled();

const appDir = app.getAppPath();
const alertIconPath = path.join( appDir, 'IconTemplateAlert.png' );
const normalIconPath = path.join( appDir, 'IconTemplate.png' );
const alertIcon = nativeImage.createFromPath( alertIconPath );
const normalIcon = nativeImage.createFromPath( normalIconPath );

// Create menubar
const bar = menubar( {
	preloadWindow: true,
	width: 400,
	height: 435,
} );

ipcMain.on( 'unread-notifications-count', ( event, arg ) => {
	const image = arg > 0 ? alertIcon : normalIcon;
	bar.tray.setImage( image );
} );
