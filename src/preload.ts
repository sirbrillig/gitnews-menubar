import { contextBridge, ipcRenderer } from 'electron';
import { MainBridge } from './renderer/types';

const bridge: MainBridge = {
	quitApp: () => ipcRenderer.send('quit-app'),
	logMessage: (message: string, level: 'info' | 'warn' | 'error') =>
		ipcRenderer.send('log-message', message, level),
	toggleAutoLaunch: (isEnabled: boolean) =>
		ipcRenderer.send('toggle-auto-launch', isEnabled),
	openUrl: (url: string, options: Electron.OpenExternalOptions) =>
		ipcRenderer.send('open-url', url, options),
	saveToken: (token: string) => ipcRenderer.send('save-token', token),
	setIcon: (nextIcon: string) => ipcRenderer.send('set-icon', nextIcon),
	onHide: (callback: () => void) => ipcRenderer.on('hide-app', callback),
	onShow: (callback: () => void) => ipcRenderer.on('show-app', callback),
	onClick: (callback: () => void) => ipcRenderer.on('menubar-click', callback),
	getToken: () => ipcRenderer.invoke('token:get'),
	getVersion: () => ipcRenderer.invoke('version:get'),
	isDemoMode: () => ipcRenderer.invoke('is-demo-mode:get'),
	isAutoLaunchEnabled: () => ipcRenderer.invoke('is-auto-launch:get'),
};

contextBridge.exposeInMainWorld('electronApi', bridge);
