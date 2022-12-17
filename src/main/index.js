const {
	ipcMain,
	app,
	Menu,
	// dialog,
	shell,
	systemPreferences,
} = require('electron');
const { menubar } = require('menubar');
const isDev = require('electron-is-dev');
// const semver = require('semver');
const electronDebug = require('electron-debug');
const { setToken } = require( 'common/lib/token' );
const { version } = require('../../package.json');
// TODO: fix checkForUpdates
// const { checkForUpdates } = require('../common/lib/updates');
const { getIconForState } = require('../common/lib/icon-path');
// TODO: do we need unhandled?
// const unhandled = require('electron-unhandled');
const debugFactory = require('debug');

const debug = debugFactory('gitnews-menubar:main');

debug('initializing version', version);

// Catch unhandled Promise rejections
// TODO: do we need unhandled?
// unhandled();

// Allow devtools and reload in production
electronDebug({
	enabled: true,
});

let lastIconState = 'normal';

const bar = menubar({
	preloadWindow: true,
	index: getAppUrl(),
	icon: getIconForState('normal'),
	browserWindow: {
		width: 390,
		height: 500,
		webPreferences: {
			nodeIntegration: true,
			// eslint-disable-next-line no-undef
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
	},
});
debug('menubar created');

bar.on('ready', () => {
	debug('app is ready');
	app.dock.hide(); // Buggy behavior with showDockIcon: https://github.com/maxogden/menubar/issues/306
	isDev || bar.window.setResizable(false);
	isDev || attachAppMenu();
	// TODO: fix checking for updates
	// checkForUpdates({ version, semver, dialog, openUrl: shell.openExternal });
	bar.window.loadURL(getAppUrl());
});

function getAppUrl() {
	// eslint-disable-next-line no-undef
	return MAIN_WINDOW_WEBPACK_ENTRY;
}

bar.on('hide', () => {
	bar.window.webContents.send('menubar-click', true);
	bar.window.webContents.send('hide-app', true);
});
bar.on('show', () => {
	bar.window.webContents.send('menubar-click', true);
	bar.window.webContents.send('show-app', true);
});
bar.on('focus-lost', () => {
	debug('focus was lost');
	bar.hideWindow();
});

app.on('platform-theme-changed', () => {
	setIcon();
});

systemPreferences.subscribeNotification(
	'AppleInterfaceThemeChangedNotification',
	() => {
		setIcon();
	}
);

ipcMain.on('set-icon', (event, arg) => {
	setIcon(arg);
});

ipcMain.on('check-for-updates', () => {
	// TODO: fix checking for updates
	// checkForUpdates({
	// 	version,
	// 	semver,
	// 	dialog,
	// 	openUrl: shell.openExternal,
	// 	showCurrentVersion: true,
	// });
});

ipcMain.on('open-url', (event, url, options) => {
	shell.openExternal(url, options);
});

ipcMain.on('quit-app', () => {
	debug('Quit requested');
	app.quit();
});

ipcMain.on('save-token', (event, token) => {
	debug('Saving token');
	setToken(token);
});

ipcMain.handle('version:get', async () => {
	return version;
})

function setIcon(type) {
	if (!type) {
		type = lastIconState;
	}
	debug('setting icon to', type);
	const image = getIcon(type);
	lastIconState = type;
	bar.tray.setImage(image);
}

function getIcon(type) {
	switch (type) {
		case 'error':
			return getIconForState('error');
		case 'unseen':
			return getIconForState('unseen');
		case 'unread':
			return getIconForState('unread');
		case 'offline':
			return getIconForState('offline');
	}
	return getIconForState('normal');
}

// Create the Application's main menu so it gets copy/paste
// see: https://pracucci.com/atom-electron-enable-copy-and-paste.html
function attachAppMenu() {
	const template = [
		{
			label: 'Application',
			submenu: [
				{ label: 'About Gitnews', selector: 'orderFrontStandardAboutPanel:' },
				{ type: 'separator' },
				{ label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() },
			],
		},
		{
			label: 'Edit',
			submenu: [
				{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
				{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
				{ type: 'separator' },
				{ label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
				{ label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
				{ label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
				{
					label: 'Select All',
					accelerator: 'CmdOrCtrl+A',
					selector: 'selectAll:',
				},
			],
		},
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
