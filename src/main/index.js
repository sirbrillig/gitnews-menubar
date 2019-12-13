import { ipcMain, app, Menu, dialog, shell, systemPreferences } from 'electron';
import createMenubar from 'menubar';
import isDev from 'electron-is-dev';
import semver from 'semver';
import electronDebug from 'electron-debug';
import { version } from '../../package.json';
import { checkForUpdates } from 'common/lib/updates';
import { getIconPathForState, getIconForState } from 'common/lib/icon-path';
import Raven from 'raven';
import unhandled from 'electron-unhandled';
import * as path from 'path';
import { format as formatUrl } from 'url';

// https://sentry.io/ Error reporting
Raven.config(
	'https://d8eec1c8e2f846ac951aff7b04cfb4fe@sentry.io/201433'
).install();

// Catch unhandled Promise rejections
unhandled();

// Allow devtools and reload in production
electronDebug({
	enabled: true,
	showDevTools: false,
});

let lastIconState = 'normal';

const bar = createMenubar({
	preloadWindow: true,
	width: 390,
	height: 440,
	icon: getIconPathForState('normal'),
	webPreferences: {
		nodeIntegration: true,
	},
});

bar.on('ready', () => {
	isDev || bar.window.setResizable(false);
	isDev || attachAppMenu();
	checkForUpdates({ version, semver, dialog, openUrl: shell.openExternal });
	bar.window.webContents.on('crashed', event => {
		Raven.captureException(event);
	});
	bar.window.on('unresponsive', () => {
		Raven.captureException(new Error('Window was unresponsive.'));
	});

	if (process.env.NODE_ENV !== 'production') {
		bar.window.loadURL(
			`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
		);
	} else {
		bar.window.loadURL(
			formatUrl({
				pathname: path.join(__dirname, 'index.html'),
				protocol: 'file',
				slashes: true,
			})
		);
	}
});

bar.on('hide', () => {
	bar.window.webContents.send('menubar-click', true);
});
bar.on('show', () => {
	bar.window.webContents.send('menubar-click', true);
});

app.on('platform-theme-changed', () => {
	const image = getIcon(lastIconState);
	bar.tray.setImage(image);
});

systemPreferences.subscribeNotification(
	'AppleInterfaceThemeChangedNotification',
	() => {
		const image = getIcon(lastIconState);
		bar.tray.setImage(image);
	}
);

ipcMain.on('set-icon', (event, arg) => {
	const image = getIcon(arg);
	lastIconState = arg;
	bar.tray.setImage(image);
});

ipcMain.on('check-for-updates', () => {
	checkForUpdates({
		version,
		semver,
		dialog,
		openUrl: shell.openExternal,
		showCurrentVersion: true,
	});
});

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
