import {
	ipcMain,
	nativeTheme,
	app,
	Menu,
	shell,
	systemPreferences,
} from 'electron';
import { menubar } from 'menubar';
import isDev from 'electron-is-dev';
import electronDebug from 'electron-debug';
import { setToken, getToken } from '../common/lib/token';
import { version } from '../../package.json';
import { getIconForState } from '../common/lib/icon-path';
import unhandled from 'electron-unhandled';
import debugFactory from 'debug';
import AutoLaunch from 'easy-auto-launch';
import dotEnv from 'dotenv';

// These are provided by electron forge
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

dotEnv.config();

const debug = debugFactory('gitnews-menubar:main');

debug('initializing version', version);

// Catch unhandled Promise rejections
unhandled();

// Allow devtools and reload in production
electronDebug();

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
	bar.window.loadURL(getAppUrl());

	nativeTheme.on('updated', () => {
		setIcon();
	});
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

systemPreferences.subscribeNotification(
	'AppleInterfaceThemeChangedNotification',
	() => {
		setIcon();
	}
);

ipcMain.on('set-icon', (event, arg) => {
	setIcon(arg);
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

const autoLauncher = new AutoLaunch({
	name: 'Gitnews',
});

ipcMain.on('toggle-auto-launch', (event, isEnabled) => {
	if (isEnabled) {
		autoLauncher.enable();
	} else {
		autoLauncher.disable();
	}
});

ipcMain.handle('token:get', async () => {
	return getToken();
});

ipcMain.handle('is-auto-launch:get', async () => {
	return autoLauncher.isEnabled();
});

ipcMain.handle('version:get', async () => {
	return version;
});

ipcMain.handle('is-demo-mode:get', async () => {
	return Boolean(process.env.GITNEWS_DEMO_MODE);
});

function setIcon(type?: string) {
	if (!type) {
		type = lastIconState;
	}
	debug('setting icon to', type);
	const image = getIcon(type);
	lastIconState = type;
	bar.tray.setImage(image);
}

function getIcon(type: string) {
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
	const template: Electron.MenuItemConstructorOptions[] = [
		{
			label: 'Application',
			submenu: [
				{ label: 'About Gitnews' },
				{ type: 'separator' },
				{ label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() },
			],
		},
		{
			label: 'Edit',
			submenu: [
				{ label: 'Undo', accelerator: 'CmdOrCtrl+Z' },
				{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z' },
				{ type: 'separator' },
				{ label: 'Cut', accelerator: 'CmdOrCtrl+X' },
				{ label: 'Copy', accelerator: 'CmdOrCtrl+C' },
				{ label: 'Paste', accelerator: 'CmdOrCtrl+V' },
				{
					label: 'Select All',
					accelerator: 'CmdOrCtrl+A',
				},
			],
		},
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
