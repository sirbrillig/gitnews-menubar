const { ipcMain, nativeImage, app, Menu, dialog, shell } = require( 'electron' );
const path = require( 'path' );
const menubar = require( 'menubar' );
const isDev = require( 'electron-is-dev' );
const fetch = require( 'electron-fetch' );
const semver = require( 'semver' );
const config = require( './package.json' );

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
	width: 390,
	height: 410,
} );

bar.on( 'ready', () => {
	isDev || bar.window.setResizable( false );
	isDev || attachAppMenu();
	autoUpdater();
} );

bar.on( 'hide', () => {
	bar.window.webContents.send( 'menubar-click', true );
} );

ipcMain.on( 'unread-notifications-count', ( event, arg ) => {
	const image = arg > 0 ? alertIcon : normalIcon;
	bar.tray.setImage( image );
} );

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

// Actual auto updating requires a signed application, so this is the next best thing
// Modified from: https://github.com/jackd248/temps
function autoUpdater() {
	console.log( 'Checking for new version...' );
	fetch( 'https://raw.githubusercontent.com/sirbrillig/gitnews-menubar/master/package.json' )
		.then( response => {
			if ( ! response.ok ) {
				return Promise.reject( response );
			}
			return response;
		} )
		.then( response => response.json() )
		.then( response => {
			try {
				const newVersion = response.version;
				const oldVersion = config.version;
				console.log( `Comparing old version ${ oldVersion } and new version ${ newVersion }` );
				if ( ! semver.gt( newVersion, oldVersion ) ) {
					return;
				}
				const confirm = dialog.showMessageBox( {
					type: 'info',
					message: 'A new version ' + newVersion + ' of Gitnews is available.',
					detail: 'Do you want to download it now?',
					buttons: [ 'Yes', 'No' ]
				} );
				if ( confirm === 0 ) {
					shell.openExternal( 'https://github.com/sirbrillig/gitnews-menubar/releases' );
				}
			} catch ( err ) {
				console.error( 'Error while checking for updates:', err );
			}
		} )
		.catch( err => {
			console.error( 'Error (caught) while checking for updates:', err );
		} );
}
