import {
	ipcMain,
	nativeTheme,
	app,
	dialog,
	Menu,
	shell,
	systemPreferences,
} from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { menubar } from 'menubar';
import isDev from 'electron-is-dev';
import electronDebug from 'electron-debug';
import {
	getToken,
	toggleLogging,
	getAccounts,
	setAccounts,
	getAppStateItem,
	setAppStateItem,
	removeAppStateItem,
} from './lib/main-store';
import { getIconForState } from './lib/icon-path';
import { version } from '../../package.json';
import unhandled from 'electron-unhandled';
import debugFactory from 'debug';
import AutoLaunch from 'easy-auto-launch';
import dotEnv from 'dotenv';
import {
	listBasicNotificationsForAccount,
	enrichNotificationsForAccount,
	markNotficationAsRead,
	unsubscribeFromNotification,
	resubscribeToNotification,
} from './lib/github-interface';
import { logMessage } from './lib/logging';
import type {
	AccountInfo,
	BasicNote,
	ContextMenuItem,
	FetchErrorObject,
	Note,
} from '../shared-types';

// These are provided by electron forge
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

dotEnv.config();

const debug = debugFactory('gitnews-menubar');

debug('initializing version', version);

// Catch unhandled Promise rejections
unhandled();

// Allow devtools and reload in production
electronDebug();

let lastIconState = 'loading';

// A file dialog takes focus from the window, which would otherwise hide it.
let isFileDialogOpen = false;

const bar = menubar({
	preloadWindow: true,
	index: MAIN_WINDOW_WEBPACK_ENTRY,
	icon: getIconForState('loading'),
	browserWindow: {
		width: 430,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
	},
});

bar.on('ready', () => {
	app.dock?.hide(); // Buggy behavior with showDockIcon: https://github.com/maxogden/menubar/issues/306
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
	if (isFileDialogOpen) {
		return;
	}
	bar.hideWindow();
});

async function withFileDialog<T>(showDialog: () => Promise<T>): Promise<T> {
	isFileDialogOpen = true;
	try {
		return await showDialog();
	} finally {
		isFileDialogOpen = false;
		bar.window?.focus();
	}
}

systemPreferences.subscribeNotification(
	'AppleInterfaceThemeChangedNotification',
	() => {
		setIcon();
	}
);

ipcMain.on(
	'log-message',
	(_event, message: string, level: 'info' | 'warn' | 'error') => {
		logMessage(message, level);
	}
);

ipcMain.on('toggle-logging', (_event, isLogging: boolean) => {
	toggleLogging(isLogging);
});

ipcMain.on('accounts:set', (_event, accounts: AccountInfo[]) => {
	setAccounts(accounts);
});

ipcMain.handle('accounts:get', async () => {
	return getAccounts();
});

ipcMain.handle('app-state:get', async (_event, key: unknown) => {
	if (typeof key !== 'string') {
		logMessage('Failed to get app state: key is invalid', 'error');
		return null;
	}
	return getAppStateItem(key);
});

ipcMain.handle(
	'app-state:set',
	async (_event, key: unknown, value: unknown) => {
		if (typeof key !== 'string' || typeof value !== 'string') {
			logMessage('Failed to set app state: key or value is invalid', 'error');
			return;
		}
		setAppStateItem(key, value);
	}
);

ipcMain.handle('app-state:remove', async (_event, key: unknown) => {
	if (typeof key !== 'string') {
		logMessage('Failed to remove app state: key is invalid', 'error');
		return;
	}
	removeAppStateItem(key);
});

ipcMain.handle('context-menu:show', async (_event, items: unknown) => {
	if (!Array.isArray(items)) {
		logMessage('Failed to show context menu: items are invalid', 'error');
		return null;
	}
	return new Promise<string | null>((resolve) => {
		const template: Electron.MenuItemConstructorOptions[] = (
			items as ContextMenuItem[]
		).map((item) =>
			'type' in item
				? { type: 'separator' }
				: {
						label: item.label,
						enabled: item.enabled ?? true,
						click: () => resolve(item.id),
					}
		);
		Menu.buildFromTemplate(template).popup({
			window: bar.window,
			// On macOS the menu can close before an item's click handler runs, so
			// wait a moment before deciding that nothing was chosen.
			callback: () => setTimeout(() => resolve(null), 100),
		});
	});
});

ipcMain.handle(
	'low-priority-patterns:export',
	async (_event, contents: unknown) => {
		if (typeof contents !== 'string' || !bar.window) {
			logMessage('Failed to export patterns: contents are invalid', 'error');
			return false;
		}
		const window = bar.window;
		const result = await withFileDialog(() =>
			dialog.showSaveDialog(window, {
				title: 'Export Low Priority Patterns',
				defaultPath: 'gitnews-low-priority-patterns.json',
				filters: [{ name: 'JSON', extensions: ['json'] }],
			})
		);
		if (result.canceled || !result.filePath) {
			return false;
		}
		await writeFile(result.filePath, contents, 'utf8');
		logMessage(`Exported low priority patterns to ${result.filePath}`, 'info');
		return true;
	}
);

ipcMain.handle('low-priority-patterns:import', async () => {
	if (!bar.window) {
		return null;
	}
	const window = bar.window;
	const result = await withFileDialog(() =>
		dialog.showOpenDialog(window, {
			title: 'Import Low Priority Patterns',
			filters: [{ name: 'JSON', extensions: ['json'] }],
			properties: ['openFile'],
		})
	);
	const [filePath] = result.filePaths;
	if (result.canceled || !filePath) {
		return null;
	}
	logMessage(`Importing low priority patterns from ${filePath}`, 'info');
	return readFile(filePath, 'utf8');
});

ipcMain.on('set-icon', (_event, arg: unknown) => {
	if (typeof arg !== 'string') {
		logMessage('Failed to set icon: it is invalid', 'error');
		return;
	}
	setIcon(arg);
});

ipcMain.handle('open-url', async (_event, url: unknown, options) => {
	logMessage(`Opening url: ${url}`, 'info');
	if (typeof url !== 'string' || !url) {
		logMessage('Failed to open URL: it is invalid', 'error');
		return { error: 'Failed to open URL: it is invalid' };
	}
	try {
		await shell.openExternal(url, options);
		return;
	} catch (error) {
		const message = `Failed to open URL: ${error}`;
		logMessage(message, 'error');
		return { error: message };
	}
});

ipcMain.on('quit-app', () => {
	app.quit();
});

const autoLauncher = new AutoLaunch({
	name: 'Gitnews',
});

ipcMain.on('toggle-auto-launch', (_event, isEnabled) => {
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

ipcMain.handle(
	'basic-notifications-for-account:list',
	async (_event, account: AccountInfo) => {
		try {
			return await listBasicNotificationsForAccount(account);
		} catch (error) {
			// Electron IPC does not preserve Error objects so we must serialize what
			// data we actually want. See
			// https://github.com/electron/electron/issues/24427

			logMessage(
				`Failure while listing notifications for account ${account.name} (${account.serverUrl})`,
				'error'
			);
			return { error: encodeError(account.id, error as Error) };
		}
	}
);

ipcMain.handle(
	'notifications-for-account:enrich',
	async (_event, account: AccountInfo, basicNotes: BasicNote[]) => {
		try {
			return await enrichNotificationsForAccount(account, basicNotes);
		} catch (error) {
			logMessage(
				`Failure while enriching notifications for account ${account.name} (${account.serverUrl})`,
				'error'
			);
			return { error: encodeError(account.id, error as Error) };
		}
	}
);

ipcMain.handle(
	'mark-note-as-read',
	async (_event, note: Note, account: AccountInfo) => {
		return markNotficationAsRead(note, account);
	}
);

ipcMain.handle(
	'unsubscribe-notification',
	async (_event, note: Note, account: AccountInfo) => {
		return unsubscribeFromNotification(note, account);
	}
);

ipcMain.handle(
	'resubscribe-notification',
	async (_event, note: Note, account: AccountInfo) => {
		return resubscribeToNotification(note, account);
	}
);

// Errors must be JS objects to go through IPC. See
// https://github.com/electron/electron/issues/26338
function encodeError(
	accountId: string,
	error: {
		name?: string;
		message?: string;
		statusText?: string;
		status?: number;
		url?: string;
		type?: string;
		code?: string;
	}
): FetchErrorObject {
	return {
		name: error.name,
		message: error.message,
		code: error.code,
		statusText: error.statusText,
		status: error.status,
		url: error.url,
		type: error.type,
		accountId,
	};
}

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
		case 'loading':
			return getIconForState('loading');
		case 'normal':
			return getIconForState('normal');
	}
	return getIconForState('loading');
}

// Create the Application's main menu so it gets copy/paste
// See: https://stackoverflow.com/questions/43584851/is-it-possible-to-copy-paste-with-electron
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
				{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
				{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
				{ type: 'separator' },
				{ label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
				{ label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
				{ label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
				{
					label: 'Select All',
					accelerator: 'CmdOrCtrl+A',
					role: 'selectAll',
				},
			],
		},
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
