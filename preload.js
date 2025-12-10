const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  auth: {
    login: (username, password, rememberMe) => ipcRenderer.invoke('auth:login', { username, password, rememberMe }),
    loginWithToken: (token) => ipcRenderer.invoke('auth:loginWithToken', { token }),
    logout: (token) => ipcRenderer.invoke('auth:logout', { token }),
    verifyPin: (username, pin) => ipcRenderer.invoke('auth:verifyPin', { username, pin }),
    resetPassword: (username, newPassword) => ipcRenderer.invoke('auth:resetPassword', { username, newPassword }),
    changePassword: (username, currentPassword, newPassword) =>
      ipcRenderer.invoke('auth:changePassword', { username, currentPassword, newPassword }),
    changePin: (username, currentPassword, newPin) =>
      ipcRenderer.invoke('auth:changePin', { username, currentPassword, newPin }),
    updateProfile: (username, profileData) =>
      ipcRenderer.invoke('auth:updateProfile', { username, profileData }),
    getProfile: (username) =>
      ipcRenderer.invoke('auth:getProfile', { username })
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
  sabaiJabitha: {
    generatePDF: (params) => ipcRenderer.invoke('sabaiJabitha:generatePDF', params)
  },
  backup: {
    createCongregationBackup: (params) => ipcRenderer.invoke('backup:createCongregationBackup', params),
    selectRestoreFile: () => ipcRenderer.invoke('backup:selectRestoreFile'),
    previewCongregationRestore: (params) => ipcRenderer.invoke('backup:previewCongregationRestore', params),
    restoreCongregationBackup: (params) => ipcRenderer.invoke('backup:restoreCongregationBackup', params),
    createFullDatabase: () => ipcRenderer.invoke('backup:createFullDatabase'),
    selectFullDatabaseRestoreFile: () => ipcRenderer.invoke('backup:selectFullDatabaseRestoreFile'),
    previewFullDatabaseRestore: (params) => ipcRenderer.invoke('backup:previewFullDatabaseRestore', params),
    restoreFullDatabase: (params) => ipcRenderer.invoke('backup:restoreFullDatabase', params)
  },
  app: {
    checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    restart: () => ipcRenderer.invoke('app:restart')
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
    generateSchedule4: (recordId, additionalData) => ipcRenderer.invoke('marriage:generateSchedule4', { recordId, additionalData }),
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
  },
  google: {
    authenticate: () => ipcRenderer.invoke('google:authenticate'),
    checkAuth: () => ipcRenderer.invoke('google:checkAuth'),
    uploadDatabase: () => ipcRenderer.invoke('google:uploadDatabase'),
    getVersions: () => ipcRenderer.invoke('google:getVersions'),
    compareVersions: () => ipcRenderer.invoke('google:compareVersions'),
    syncDown: (params) => ipcRenderer.invoke('google:syncDown', params),
    disconnect: () => ipcRenderer.invoke('google:disconnect')
  },
  sync: {
    manual: () => ipcRenderer.invoke('sync:manual'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    enable: () => ipcRenderer.invoke('sync:enable'),
    disable: () => ipcRenderer.invoke('sync:disable'),
    onStateChange: (callback) => {
      ipcRenderer.on('sync-state-changed', (event, data) => callback(data));
    }
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },
  receipt: {
    getAll: () => ipcRenderer.invoke('receipt:getAll'),
    getById: (id) => ipcRenderer.invoke('receipt:getById', { id }),
    getByPastorateYearMonth: (pastorateName, year, month) => 
      ipcRenderer.invoke('receipt:getByPastorateYearMonth', { pastorateName, year, month }),
    create: (receiptData) => ipcRenderer.invoke('receipt:create', receiptData),
    update: (id, updates) => ipcRenderer.invoke('receipt:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('receipt:delete', { id }),
    getNextNumber: (pastorateName, year, month) => 
      ipcRenderer.invoke('receipt:getNextNumber', { pastorateName, year, month })
  },
  churchOffertory: {
    getAll: () => ipcRenderer.invoke('churchOffertory:getAll'),
    getById: (id) => ipcRenderer.invoke('churchOffertory:getById', { id }),
    getByPastorateYearMonth: (pastorateName, year, month) => 
      ipcRenderer.invoke('churchOffertory:getByPastorateYearMonth', { pastorateName, year, month }),
    create: (offertoryData) => ipcRenderer.invoke('churchOffertory:create', offertoryData),
    update: (id, updates) => ipcRenderer.invoke('churchOffertory:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('churchOffertory:delete', { id })
  },
  harvestFestival: {
    getBaseEntries: (pastorateName, year) => 
      ipcRenderer.invoke('harvestFestival:getBaseEntries', { pastorateName, year }),
    createBaseEntry: (entryData) => ipcRenderer.invoke('harvestFestival:createBaseEntry', entryData),
    updateBaseEntry: (id, updates) => ipcRenderer.invoke('harvestFestival:updateBaseEntry', { id, updates }),
    deleteBaseEntry: (id) => ipcRenderer.invoke('harvestFestival:deleteBaseEntry', { id }),
    getPayments: (pastorateName, year, month) => 
      ipcRenderer.invoke('harvestFestival:getPayments', { pastorateName, year, month }),
    getPaymentsByBaseEntry: (baseEntryId) => 
      ipcRenderer.invoke('harvestFestival:getPaymentsByBaseEntry', { baseEntryId }),
    createPayment: (paymentData) => ipcRenderer.invoke('harvestFestival:createPayment', paymentData),
    updatePayment: (id, updates) => ipcRenderer.invoke('harvestFestival:updatePayment', { id, updates }),
    deletePayment: (id) => ipcRenderer.invoke('harvestFestival:deletePayment', { id })
  },
  sangam: {
    getPayments: (pastorateName, year, month) => 
      ipcRenderer.invoke('sangam:getPayments', { pastorateName, year, month }),
    getPaymentsByYear: (pastorateName, year) => 
      ipcRenderer.invoke('sangam:getPaymentsByYear', { pastorateName, year }),
    getNextReceiptNumber: (pastorateName, year, month) => 
      ipcRenderer.invoke('sangam:getNextReceiptNumber', { pastorateName, year, month }),
    createPayment: (paymentData) => ipcRenderer.invoke('sangam:createPayment', paymentData),
    updatePayment: (id, updates) => ipcRenderer.invoke('sangam:updatePayment', { id, updates }),
    deletePayment: (id) => ipcRenderer.invoke('sangam:deletePayment', { id })
  },
  yearBooks: {
    deleteEntries: (pastorateName, year) => ipcRenderer.invoke('yearBooks:deleteEntries', { pastorateName, year })
  },
  pcCashBook: {
    getExpenses: (pastorateName, year, month) => 
      ipcRenderer.invoke('pcCashBook:getExpenses', { pastorateName, year, month }),
    getNextVNo: (pastorateName, year, month) => 
      ipcRenderer.invoke('pcCashBook:getNextVNo', { pastorateName, year, month }),
    createExpense: (expenseData) => ipcRenderer.invoke('pcCashBook:createExpense', expenseData),
    updateExpense: (id, updates) => ipcRenderer.invoke('pcCashBook:updateExpense', { id, updates }),
    deleteExpense: (id) => ipcRenderer.invoke('pcCashBook:deleteExpense', { id }),
    getOpeningBalance: (pastorateName, year) => 
      ipcRenderer.invoke('pcCashBook:getOpeningBalance', { pastorateName, year }),
    saveOpeningBalance: (pastorateName, year, amount) => 
      ipcRenderer.invoke('pcCashBook:saveOpeningBalance', { pastorateName, year, amount }),
    generatePDF: (reportData) => ipcRenderer.invoke('pcCashBook:generatePDF', { reportData })
  }
});

