// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  database: {
    connect: (config) => ipcRenderer.invoke('db:connect', config),
    disconnect: () => ipcRenderer.invoke('db:disconnect'),
    query: (text, params) => ipcRenderer.invoke('db:query', text, params),
    testConnection: (config) => ipcRenderer.invoke('db:testConnection', config),
    isConnected: () => ipcRenderer.invoke('db:isConnected'),
  },
  migrations: {
    status: () => ipcRenderer.invoke('db:migrations:status'),
    apply: () => ipcRenderer.invoke('db:migrations:apply'),
  },
  navigation: {
    onNavigate: (callback) => {
      const subscription = (_event, path) => callback(path);
      ipcRenderer.on('navigate', subscription);
      return () => ipcRenderer.removeListener('navigate', subscription);
    },
  },
});
