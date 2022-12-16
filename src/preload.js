const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApi', {
		quitApp: () => ipcRenderer.send('quit-app'),
});
