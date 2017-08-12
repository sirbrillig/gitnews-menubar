const { ipcMain, nativeImage, app, Menu, dialog, shell } = require( 'electron' );
const path = require( 'path' );
const menubar = require( 'menubar' );
const isDev = require( 'electron-is-dev' );
const semver = require( 'semver' );
const electronDebug = require( 'electron-debug' );
const { version } = require( './package.json' );
const { checkForUpdates } = require( './lib/updates' );

const unhandled = require( 'electron-unhandled' );

// Catch unhandled Promise rejections
unhandled();

// Allow devtools and reload in production
electronDebug( { enabled: true } );

const appDir = app.getAppPath();
const warnIconPath = path.join( appDir, 'images', 'IconTemplateWarn.png' );
const alertIconPath = path.join( appDir, 'images', 'IconTemplateAlert.png' );
const errorIconPath = path.join( appDir, 'images', 'IconTemplateError.png' );
const offlineIconPath = path.join( appDir, 'images', 'IconTemplateOffline.png' );
const normalIconPath = path.join( appDir, 'images', 'IconTemplateNormal.png' );
const warnIcon = nativeImage.createFromPath( warnIconPath );
const alertIcon = nativeImage.createFromPath( alertIconPath );
const errorIcon = nativeImage.createFromPath( errorIconPath );
const offlineIcon = nativeImage.createFromPath( offlineIconPath );
const normalIcon = nativeImage.createFromPath( normalIconPath );

// Create menubar
const bar = menubar( {
	preloadWindow: true,
	width: 390,
	height: 440,
	icon: normalIconPath,
} );

bar.on( 'ready', () => {
	isDev || bar.window.setResizable( false );
	isDev || attachAppMenu();
	checkForUpdates( { version, semver } )
		.then( response => {
			if ( response.updateAvailable !== true ) {
				return;
			}
			const confirm = dialog.showMessageBox( {
				type: 'question',
				message: 'A new version ' + response.newVersion + ' of Gitnews is available.',
				detail: 'Do you want to download it now?',
				buttons: [ 'Yes', 'No' ]
			} );
			if ( confirm === 0 ) {
				shell.openExternal( response.newVersionUrl );
			}
		} )
		.catch( err => {
			console.error( 'Error while checking for updates:', err );
		} );
} );

bar.on( 'hide', () => {
	bar.window.webContents.send( 'menubar-click', true );
} );
bar.on( 'show', () => {
	bar.window.webContents.send( 'menubar-click', true );
} );

ipcMain.on( 'set-icon', ( event, arg ) => {
	const image = getIcon( arg );
	bar.tray.setImage( image );
} );

function getIcon( type ) {
	switch ( type ) {
		case 'error':
			return errorIcon;
		case 'unseen':
			return alertIcon;
		case 'unread':
			return warnIcon;
		case 'offline':
			return offlineIcon;
	}
	return normalIcon;
}

// Create the Application's main menu so it gets copy/paste
// see: https://pracucci.com/atom-electron-enable-copy-and-paste.html
function attachAppMenu() {
	const template = [ {
		label: 'Application',
		submenu: [
			{ label: 'About Gitnews', selector: 'orderFrontStandardAboutPanel:' },
			{ type: 'separator' },
			{ label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
		] }, {
			label: 'Edit',
			submenu: [
				{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
				{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
				{ type: 'separator' },
				{ label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
				{ label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
				{ label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
				{ label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
			] }
	];
	Menu.setApplicationMenu( Menu.buildFromTemplate( template ) );
}
