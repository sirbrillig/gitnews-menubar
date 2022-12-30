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
import log from 'electron-log';
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

let isLoggingEnabled = false;

// Only use this function for logging!
function logMessage(message: string, level: 'info' | 'warn' | 'error'): void {
	debug(message);
	if (!isLoggingEnabled) {
		return;
	}
	switch (level) {
		case 'info':
			log.info(message);
			break;
		case 'warn':
			log.warn(message);
			break;
		case 'error':
			log.error(message);
			break;
		default:
			log.error(`Unknown log level '${level}': ${message}`);
	}
}

const bar = menubar({
	preloadWindow: true,
	index: MAIN_WINDOW_WEBPACK_ENTRY,
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

bar.on('ready', () => {
	app.dock.hide(); // Buggy behavior with showDockIcon: https://github.com/maxogden/menubar/issues/306
	isDev || bar.window?.setResizable(false);
	isDev || attachAppMenu();

	nativeTheme.on('updated', () => {
		setIcon();
	});

	logMessage('Starting', 'info');
});

bar.on('hide', () => {
	bar.window?.webContents.send('menubar-click', true);
	bar.window?.webContents.send('hide-app', true);
});
bar.on('show', () => {
	bar.window?.webContents.send('menubar-click', true);
	bar.window?.webContents.send('show-app', true);
});
bar.on('focus-lost', () => {
	bar.hideWindow();
});

systemPreferences.subscribeNotification(
	'AppleInterfaceThemeChangedNotification',
	() => {
		setIcon();
	}
);

ipcMain.on(
	'log-message',
	(event, message: string, level: 'info' | 'warn' | 'error') => {
		logMessage(message, level);
	}
);

ipcMain.on('toggle-logging', (event, isLogging: boolean) => {
	isLoggingEnabled = isLogging;
});

ipcMain.on('set-icon', (event, arg: unknown) => {
	if (typeof arg !== 'string') {
		logMessage('Failed to set icon: it is invalid', 'error');
		return;
	}
	setIcon(arg);
});

ipcMain.on('open-url', (event, url: unknown, options) => {
	logMessage(`Opening url: ${url}`, 'info');
	if (typeof url !== 'string') {
		logMessage('Failed to open URL: it is invalid', 'error');
		return;
	}
	shell.openExternal(url, options);
});

ipcMain.on('quit-app', () => {
	app.quit();
});

ipcMain.on('save-token', (event, token: unknown) => {
	if (typeof token !== 'string') {
		logMessage('Failed to save token: it is invalid', 'error');
		return;
	}
	setToken(token);
	logMessage('Token saved', 'info');
});

const autoLauncher = new AutoLaunch({
	name: 'Gitnews',
});

ipcMain.on('toggle-auto-launch', (event, isEnabled) => {
	logMessage(`AutoLaunch changed to ${isEnabled}`, 'info');
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
	if (lastIconState !== type) {
		logMessage(`Icon changed to ${type}`, 'info');
	}
	// Even if the icon type hasn't changed, still reset it because `getIcon()`
	// has other inputs than just the type (eg: dark mode or light mode).
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
