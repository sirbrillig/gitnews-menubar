import { contextBridge, ipcRenderer } from 'electron';
import {
	AccountInfo,
	BasicNote,
	IconType,
	MainBridge,
	Note,
} from './renderer/types';

const bridge: MainBridge = {
	quitApp: () => ipcRenderer.send('quit-app'),
	toggleLogging: (isLogging: boolean) =>
		ipcRenderer.send('toggle-logging', isLogging),
	logMessage: (message: string, level: 'info' | 'warn' | 'error') =>
		ipcRenderer.send('log-message', message, level),
	toggleAutoLaunch: (isEnabled: boolean) =>
		ipcRenderer.send('toggle-auto-launch', isEnabled),
	openUrl: (url: string) => ipcRenderer.send('open-url', url),
	setIcon: (nextIcon: IconType) => ipcRenderer.send('set-icon', nextIcon),
	onHide: (callback: () => void) => ipcRenderer.on('hide-app', callback),
	onShow: (callback: () => void) => ipcRenderer.on('show-app', callback),
	onClick: (callback: () => void) => ipcRenderer.on('menubar-click', callback),
	getToken: () => ipcRenderer.invoke('token:get'),
	getVersion: () => ipcRenderer.invoke('version:get'),
	isDemoMode: () => ipcRenderer.invoke('is-demo-mode:get'),
	isAutoLaunchEnabled: () => ipcRenderer.invoke('is-auto-launch:get'),
	listBasicNotificationsForAccount: (account: AccountInfo) =>
		ipcRenderer.invoke('basic-notifications-for-account:list', account),
	enrichNotificationsForAccount: (
		account: AccountInfo,
		basicNotes: BasicNote[]
	) =>
		ipcRenderer.invoke('notifications-for-account:enrich', account, basicNotes),
	markNotificationRead: (note: Note, account: AccountInfo) =>
		ipcRenderer.invoke('mark-note-as-read', note, account),
	unsubscribeNotification: (note: Note, account: AccountInfo) =>
		ipcRenderer.invoke('unsubscribe-notification', note, account),
	saveAccounts: (accounts: AccountInfo[]) =>
		ipcRenderer.send('accounts:set', accounts),
	getAccounts: () => ipcRenderer.invoke('accounts:get'),
};

contextBridge.exposeInMainWorld('electronApi', bridge);
