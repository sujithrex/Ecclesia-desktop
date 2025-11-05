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
  church: {
    getAll: () => ipcRenderer.invoke('church:getAll'),
    getById: (id) => ipcRenderer.invoke('church:getById', { id }),
    create: (churchData) => ipcRenderer.invoke('church:create', churchData),
    update: (id, updates) => ipcRenderer.invoke('church:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('church:delete', { id })
  },
  infantBaptism: {
    getAll: () => ipcRenderer.invoke('infantBaptism:getAll'),
    getById: (id) => ipcRenderer.invoke('infantBaptism:getById', { id }),
    getByChurch: (churchId) => ipcRenderer.invoke('infantBaptism:getByChurch', { churchId }),
    create: (certificateData) => ipcRenderer.invoke('infantBaptism:create', certificateData),
    update: (id, updates) => ipcRenderer.invoke('infantBaptism:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('infantBaptism:delete', { id }),
    getNextNumber: (churchId) => ipcRenderer.invoke('infantBaptism:getNextNumber', { churchId }),
    generatePDF: (certificateId) => ipcRenderer.invoke('infantBaptism:generatePDF', { certificateId })
  },
  adultBaptism: {
    getAll: () => ipcRenderer.invoke('adultBaptism:getAll'),
    getById: (id) => ipcRenderer.invoke('adultBaptism:getById', { id }),
    getByChurch: (churchId) => ipcRenderer.invoke('adultBaptism:getByChurch', { churchId }),
    create: (certificateData) => ipcRenderer.invoke('adultBaptism:create', certificateData),
    update: (id, updates) => ipcRenderer.invoke('adultBaptism:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('adultBaptism:delete', { id }),
    getNextNumber: (churchId) => ipcRenderer.invoke('adultBaptism:getNextNumber', { churchId }),
    generatePDF: (certificateId) => ipcRenderer.invoke('adultBaptism:generatePDF', { certificateId })
  },
  burialRegister: {
    getAll: () => ipcRenderer.invoke('burialRegister:getAll'),
    getById: (id) => ipcRenderer.invoke('burialRegister:getById', { id }),
    getByChurch: (churchId) => ipcRenderer.invoke('burialRegister:getByChurch', { churchId }),
    create: (registerData) => ipcRenderer.invoke('burialRegister:create', registerData),
    update: (id, updates) => ipcRenderer.invoke('burialRegister:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('burialRegister:delete', { id }),
    getNextNumber: (churchId) => ipcRenderer.invoke('burialRegister:getNextNumber', { churchId }),
    generatePDF: (certificateId) => ipcRenderer.invoke('burialRegister:generatePDF', { certificateId })
  },
  letterhead: {
    getAll: () => ipcRenderer.invoke('letterhead:getAll'),
    getById: (id) => ipcRenderer.invoke('letterhead:getById', { id }),
    getByChurch: (churchId) => ipcRenderer.invoke('letterhead:getByChurch', { churchId }),
    create: (letterheadData) => ipcRenderer.invoke('letterhead:create', letterheadData),
    update: (id, updates) => ipcRenderer.invoke('letterhead:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('letterhead:delete', { id }),
    getNextNumber: (churchId) => ipcRenderer.invoke('letterhead:getNextNumber', { churchId }),
    generatePDF: (letterheadId) => ipcRenderer.invoke('letterhead:generatePDF', { letterheadId })
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  }
});

