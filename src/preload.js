const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApi', {
	quitApp: () => ipcRenderer.send('quit-app'),
	onHide: callback => ipcRenderer.on('hide-app', callback),
	onShow: callback => ipcRenderer.on('show-app', callback),
	onClick: callback => ipcRenderer.on('menubar-click', callback),
});
