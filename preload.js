const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
    verifyPin: (username, pin) => ipcRenderer.invoke('auth:verifyPin', { username, pin }),
    resetPassword: (username, newPassword) => ipcRenderer.invoke('auth:resetPassword', { username, newPassword }),
    changePassword: (username, currentPassword, newPassword) =>
      ipcRenderer.invoke('auth:changePassword', { username, currentPassword, newPassword }),
    changePin: (username, currentPassword, newPin) =>
      ipcRenderer.invoke('auth:changePin', { username, currentPassword, newPin })
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  }
});

