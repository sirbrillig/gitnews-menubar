const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApi', {
	quitApp: () => ipcRenderer.send('quit-app'),
	toggleAutoLaunch: (isEnabled) => ipcRenderer.send('toggle-auto-launch', isEnabled),
	openUrl: (url, options) => ipcRenderer.send('open-url', url, options),
	saveToken: (token) => ipcRenderer.send('save-token', token),
	setIcon: (nextIcon) => ipcRenderer.send('set-icon', nextIcon),
	onHide: callback => ipcRenderer.on('hide-app', callback),
	onShow: callback => ipcRenderer.on('show-app', callback),
	onClick: callback => ipcRenderer.on('menubar-click', callback),
	getVersion: () => ipcRenderer.invoke('version:get'),
	isDemoMode: () => ipcRenderer.invoke('is-demo-mode:get'),
	isAutoLaunchEnabled: () => ipcRenderer.invoke('is-auto-launch:get'),
});
