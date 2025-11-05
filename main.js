const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {
  initDatabase,
  getAllChurches,
  getChurchById,
  createChurch,
  updateChurch,
  deleteChurch,
  getAllInfantBaptismCertificates,
  getInfantBaptismCertificateById,
  getInfantBaptismCertificatesByChurch,
  createInfantBaptismCertificate,
  updateInfantBaptismCertificate,
  deleteInfantBaptismCertificate,
  getNextInfantBaptismCertificateNumber,
  getAllAdultBaptismCertificates,
  getAdultBaptismCertificateById,
  getAdultBaptismCertificatesByChurch,
  createAdultBaptismCertificate,
  updateAdultBaptismCertificate,
  deleteAdultBaptismCertificate,
  getNextAdultBaptismCertificateNumber,
  getAllBurialRegisters,
  getBurialRegisterById,
  getBurialRegistersByChurch,
  createBurialRegister,
  updateBurialRegister,
  deleteBurialRegister,
  getNextBurialRegisterNumber
} = require('./backend/database');
const {
  login,
  verifyRecoveryPin,
  resetPassword,
  changePassword,
  changeRecoveryPin
} = require('./backend/auth');
const {
  generateInfantBaptismPDF,
  generateAdultBaptismPDF,
  generateBurialRegisterPDF,
  openPDF
} = require('./backend/pdfGenerator');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await initDatabase();

  ipcMain.handle('auth:login', async (event, { username, password }) => {
    return await login(username, password);
  });

  ipcMain.handle('auth:verifyPin', async (event, { username, pin }) => {
    return await verifyRecoveryPin(username, pin);
  });

  ipcMain.handle('auth:resetPassword', async (event, { username, newPassword }) => {
    return await resetPassword(username, newPassword);
  });

  ipcMain.handle('auth:changePassword', async (event, { username, currentPassword, newPassword }) => {
    return await changePassword(username, currentPassword, newPassword);
  });

  ipcMain.handle('auth:changePin', async (event, { username, currentPassword, newPin }) => {
    return await changeRecoveryPin(username, currentPassword, newPin);
  });

  // Church CRUD handlers
  ipcMain.handle('church:getAll', async () => {
    try {
      const churches = await getAllChurches();
      return { success: true, data: churches };
    } catch (error) {
      return { success: false, message: 'Failed to fetch churches' };
    }
  });

  ipcMain.handle('church:getById', async (event, { id }) => {
    try {
      const church = await getChurchById(id);
      if (church) {
        return { success: true, data: church };
      }
      return { success: false, message: 'Church not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch church' };
    }
  });

  ipcMain.handle('church:create', async (event, churchData) => {
    try {
      const newChurch = await createChurch(churchData);
      return { success: true, data: newChurch };
    } catch (error) {
      return { success: false, message: 'Failed to create church' };
    }
  });

  ipcMain.handle('church:update', async (event, { id, updates }) => {
    try {
      const updatedChurch = await updateChurch(id, updates);
      if (updatedChurch) {
        return { success: true, data: updatedChurch };
      }
      return { success: false, message: 'Church not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update church' };
    }
  });

  ipcMain.handle('church:delete', async (event, { id }) => {
    try {
      const deleted = await deleteChurch(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Church not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete church' };
    }
  });

  // Infant Baptism Certificate handlers
  ipcMain.handle('infantBaptism:getAll', async () => {
    try {
      const certificates = await getAllInfantBaptismCertificates();
      return { success: true, data: certificates };
    } catch (error) {
      return { success: false, message: 'Failed to fetch certificates' };
    }
  });

  ipcMain.handle('infantBaptism:getById', async (event, { id }) => {
    try {
      const certificate = await getInfantBaptismCertificateById(id);
      if (certificate) {
        return { success: true, data: certificate };
      }
      return { success: false, message: 'Certificate not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch certificate' };
    }
  });

  ipcMain.handle('infantBaptism:getByChurch', async (event, { churchId }) => {
    try {
      const certificates = await getInfantBaptismCertificatesByChurch(churchId);
      return { success: true, data: certificates };
    } catch (error) {
      return { success: false, message: 'Failed to fetch certificates' };
    }
  });

  ipcMain.handle('infantBaptism:create', async (event, certificateData) => {
    try {
      const newCertificate = await createInfantBaptismCertificate(certificateData);
      return { success: true, data: newCertificate };
    } catch (error) {
      return { success: false, message: 'Failed to create certificate' };
    }
  });

  ipcMain.handle('infantBaptism:update', async (event, { id, updates }) => {
    try {
      const updatedCertificate = await updateInfantBaptismCertificate(id, updates);
      if (updatedCertificate) {
        return { success: true, data: updatedCertificate };
      }
      return { success: false, message: 'Certificate not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update certificate' };
    }
  });

  ipcMain.handle('infantBaptism:delete', async (event, { id }) => {
    try {
      const deleted = await deleteInfantBaptismCertificate(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Certificate not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete certificate' };
    }
  });

  ipcMain.handle('infantBaptism:getNextNumber', async (event, { churchId }) => {
    try {
      const nextNumber = await getNextInfantBaptismCertificateNumber(churchId);
      return { success: true, data: nextNumber };
    } catch (error) {
      return { success: false, message: 'Failed to get next certificate number' };
    }
  });

  ipcMain.handle('infantBaptism:generatePDF', async (event, { certificateId }) => {
    try {
      // Get certificate data
      const certificate = await getInfantBaptismCertificateById(certificateId);
      if (!certificate) {
        return { success: false, message: 'Certificate not found' };
      }

      // Get church data if available
      let church = null;
      if (certificate.church_id) {
        church = await getChurchById(certificate.church_id);
      }

      // Generate PDF
      const pdfPath = await generateInfantBaptismPDF(certificate, church);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, data: { pdfPath } };
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  // Adult Baptism Certificate handlers
  ipcMain.handle('adultBaptism:getAll', async () => {
    try {
      const certificates = await getAllAdultBaptismCertificates();
      return { success: true, data: certificates };
    } catch (error) {
      return { success: false, message: 'Failed to fetch certificates' };
    }
  });

  ipcMain.handle('adultBaptism:getById', async (event, { id }) => {
    try {
      const certificate = await getAdultBaptismCertificateById(id);
      if (certificate) {
        return { success: true, data: certificate };
      }
      return { success: false, message: 'Certificate not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch certificate' };
    }
  });

  ipcMain.handle('adultBaptism:getByChurch', async (event, { churchId }) => {
    try {
      const certificates = await getAdultBaptismCertificatesByChurch(churchId);
      return { success: true, data: certificates };
    } catch (error) {
      return { success: false, message: 'Failed to fetch certificates' };
    }
  });

  ipcMain.handle('adultBaptism:create', async (event, certificateData) => {
    try {
      const newCertificate = await createAdultBaptismCertificate(certificateData);
      return { success: true, data: newCertificate };
    } catch (error) {
      return { success: false, message: 'Failed to create certificate' };
    }
  });

  ipcMain.handle('adultBaptism:update', async (event, { id, updates }) => {
    try {
      const updatedCertificate = await updateAdultBaptismCertificate(id, updates);
      if (updatedCertificate) {
        return { success: true, data: updatedCertificate };
      }
      return { success: false, message: 'Certificate not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update certificate' };
    }
  });

  ipcMain.handle('adultBaptism:delete', async (event, { id }) => {
    try {
      const deleted = await deleteAdultBaptismCertificate(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Certificate not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete certificate' };
    }
  });

  ipcMain.handle('adultBaptism:getNextNumber', async (event, { churchId }) => {
    try {
      const nextNumber = await getNextAdultBaptismCertificateNumber(churchId);
      return { success: true, data: nextNumber };
    } catch (error) {
      return { success: false, message: 'Failed to get next certificate number' };
    }
  });

  ipcMain.handle('adultBaptism:generatePDF', async (event, { certificateId }) => {
    try {
      // Get certificate data
      const certificate = await getAdultBaptismCertificateById(certificateId);
      if (!certificate) {
        return { success: false, message: 'Certificate not found' };
      }

      // Get church data if available
      let church = null;
      if (certificate.church_id) {
        church = await getChurchById(certificate.church_id);
      }

      // Generate PDF
      const pdfPath = await generateAdultBaptismPDF(certificate, church);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, data: { pdfPath } };
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  // Burial Register handlers
  ipcMain.handle('burialRegister:getAll', async () => {
    try {
      const registers = await getAllBurialRegisters();
      return { success: true, data: registers };
    } catch (error) {
      return { success: false, message: 'Failed to fetch registers' };
    }
  });

  ipcMain.handle('burialRegister:getById', async (event, { id }) => {
    try {
      const register = await getBurialRegisterById(id);
      if (register) {
        return { success: true, data: register };
      }
      return { success: false, message: 'Register not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch register' };
    }
  });

  ipcMain.handle('burialRegister:getByChurch', async (event, { churchId }) => {
    try {
      const registers = await getBurialRegistersByChurch(churchId);
      return { success: true, data: registers };
    } catch (error) {
      return { success: false, message: 'Failed to fetch registers' };
    }
  });

  ipcMain.handle('burialRegister:create', async (event, registerData) => {
    try {
      const newRegister = await createBurialRegister(registerData);
      return { success: true, data: newRegister };
    } catch (error) {
      return { success: false, message: 'Failed to create register' };
    }
  });

  ipcMain.handle('burialRegister:update', async (event, { id, updates }) => {
    try {
      const updatedRegister = await updateBurialRegister(id, updates);
      if (updatedRegister) {
        return { success: true, data: updatedRegister };
      }
      return { success: false, message: 'Register not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update register' };
    }
  });

  ipcMain.handle('burialRegister:delete', async (event, { id }) => {
    try {
      const deleted = await deleteBurialRegister(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Register not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete register' };
    }
  });

  ipcMain.handle('burialRegister:getNextNumber', async (event, { churchId }) => {
    try {
      const nextNumber = await getNextBurialRegisterNumber(churchId);
      return { success: true, data: nextNumber };
    } catch (error) {
      return { success: false, message: 'Failed to get next certificate number' };
    }
  });

  ipcMain.handle('burialRegister:generatePDF', async (event, { certificateId }) => {
    try {
      // Get register data
      const register = await getBurialRegisterById(certificateId);
      if (!register) {
        return { success: false, message: 'Register not found' };
      }

      // Get church data if available
      let church = null;
      if (register.church_id) {
        church = await getChurchById(register.church_id);
      }

      // Generate PDF
      const pdfPath = await generateBurialRegisterPDF(register, church);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, data: { pdfPath } };
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
  });

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

