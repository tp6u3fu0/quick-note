const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  saveNote: (content) => ipcRenderer.invoke('save-note', content),
  hideWindow: () => ipcRenderer.send('hide-window'),
  openSettings: () => ipcRenderer.send('open-settings'),
  onWindowShown: (cb) => {
    ipcRenderer.on('window-shown', cb);
    return () => ipcRenderer.removeListener('window-shown', cb);
  }
});
