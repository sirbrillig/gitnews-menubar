import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronApi', {
	quitApp: () => ipcRenderer.send('quit-app'),
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
});
