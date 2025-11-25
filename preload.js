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
  area: {
    getAll: () => ipcRenderer.invoke('area:getAll'),
    getById: (id) => ipcRenderer.invoke('area:getById', { id }),
    getByChurch: (churchId) => ipcRenderer.invoke('area:getByChurch', { churchId }),
    create: (areaData) => ipcRenderer.invoke('area:create', areaData),
    update: (id, updates) => ipcRenderer.invoke('area:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('area:delete', { id })
  },
  family: {
    getAll: () => ipcRenderer.invoke('family:getAll'),
    getById: (id) => ipcRenderer.invoke('family:getById', { id }),
    getByArea: (areaId) => ipcRenderer.invoke('family:getByArea', { areaId }),
    create: (familyData) => ipcRenderer.invoke('family:create', familyData),
    update: (id, updates) => ipcRenderer.invoke('family:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('family:delete', { id }),
    getAutoNumbers: (areaId) => ipcRenderer.invoke('family:getAutoNumbers', { areaId })
  },
  member: {
    getAll: () => ipcRenderer.invoke('member:getAll'),
    getById: (id) => ipcRenderer.invoke('member:getById', { id }),
    getByFamily: (familyId) => ipcRenderer.invoke('member:getByFamily', { familyId }),
    create: (memberData) => ipcRenderer.invoke('member:create', memberData),
    update: (id, updates) => ipcRenderer.invoke('member:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('member:delete', { id }),
    getAutoNumbers: (familyId) => ipcRenderer.invoke('member:getAutoNumbers', { familyId }),
    getBirthdaysByDateRange: (params) => ipcRenderer.invoke('member:getBirthdaysByDateRange', params),
    getWeddingsByDateRange: (params) => ipcRenderer.invoke('member:getWeddingsByDateRange', params)
  },
  birthday: {
    generatePDF: (params) => ipcRenderer.invoke('birthday:generatePDF', params)
  },
  wedding: {
    generatePDF: (params) => ipcRenderer.invoke('wedding:generatePDF', params)
  },
  marriage: {
    getAll: () => ipcRenderer.invoke('marriage:getAll'),
    getById: (id) => ipcRenderer.invoke('marriage:getById', { id }),
    getByChurch: (churchId) => ipcRenderer.invoke('marriage:getByChurch', { churchId }),
    create: (recordData) => ipcRenderer.invoke('marriage:create', recordData),
    update: (id, updates) => ipcRenderer.invoke('marriage:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('marriage:delete', { id }),
    getNextNumber: (churchId) => ipcRenderer.invoke('marriage:getNextNumber', { churchId }),
    generateCertificate: (recordId, additionalData) => ipcRenderer.invoke('marriage:generateCertificate', { recordId, additionalData }),
    generatePDF: (params) => ipcRenderer.invoke('marriage:generatePDF', params)
  },
  marriageBans: {
    getAll: () => ipcRenderer.invoke('marriageBans:getAll'),
    getById: (id) => ipcRenderer.invoke('marriageBans:getById', { id }),
    getByChurch: (churchId) => ipcRenderer.invoke('marriageBans:getByChurch', { churchId }),
    create: (bansData) => ipcRenderer.invoke('marriageBans:create', bansData),
    update: (id, updates) => ipcRenderer.invoke('marriageBans:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('marriageBans:delete', { id }),
    getNextNumber: (churchId) => ipcRenderer.invoke('marriageBans:getNextNumber', { churchId }),
    generatePDF: (bansId, additionalData) => ipcRenderer.invoke('marriageBans:generatePDF', { bansId, additionalData })
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  }
});

