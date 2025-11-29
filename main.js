const { app, BrowserWindow, ipcMain, shell } = require('electron');
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
  getNextBurialRegisterNumber,
  getAllMarriageRecords,
  getMarriageRecordById,
  getMarriageRecordsByChurch,
  createMarriageRecord,
  updateMarriageRecord,
  deleteMarriageRecord,
  getNextMarriageRecordNumber,
  getAllMarriageBans,
  getMarriageBansById,
  getMarriageBansByChurch,
  createMarriageBans,
  updateMarriageBans,
  deleteMarriageBans,
  getNextMarriageBansNumber,
  getAllLetterheads,
  getLetterheadById,
  getLetterheadsByChurch,
  createLetterhead,
  updateLetterhead,
  deleteLetterhead,
  getNextLetterheadNumber,
  getAllAreas,
  getAreaById,
  getAreasByChurch,
  createArea,
  updateArea,
  deleteArea,
  getAllFamilies,
  getFamilyById,
  getFamiliesByArea,
  createFamily,
  updateFamily,
  deleteFamily,
  getNextFamilyNumber,
  getNextLayoutNumber,
  getFamilyByAreaAndNumber,
  getFamilyByAreaAndLayoutNumber,
  getAllMembers,
  getMemberById,
  getMembersByFamily,
  createMember,
  updateMember,
  deleteMember,
  getNextMemberNumber,
  getNextMemberId,
  getMemberByFamilyAndNumber,
  getBirthdaysByDateRange,
  getBirthdayReportData,
  getWeddingsByDateRange,
  getWeddingReportData,
  saveGoogleCredentials,
  getGoogleCredentials,
  deleteGoogleCredentials,
  getMetadata,
  updateMetadata,
  incrementWindowsVersion,
  incrementAndroidVersion,
  getVersionString,
  getAllDatabaseData,
  mergeDatabaseData
} = require('./backend/database');

const googleDriveSync = require('./backend/googleDriveSync');
const autoSync = require('./backend/autoSync');
const comparisonEngine = require('./backend/comparisonEngine');

const {
  login,
  loginWithToken,
  logout,
  verifyRecoveryPin,
  resetPassword,
  changePassword,
  changeRecoveryPin,
  updateProfile,
  getProfile
} = require('./backend/auth');
const {
  generateInfantBaptismPDF,
  generateAdultBaptismPDF,
  generateBurialRegisterPDF,
  generateMarriageBansPDF,
  generateMarriageCertificatePDF,
  generateLetterheadPDF,
  generateBirthdayListPDF,
  generateWeddingListPDF,
  generateSabaiJabithaPDF,
  generateMarriageSchedule4PDF,
  openPDF
} = require('./backend/pdfGenerator');
const {
  createCongregationBackup,
  selectRestoreFile,
  previewCongregationRestore,
  restoreCongregationBackup,
  createFullDatabaseBackup,
  selectFullDatabaseRestoreFile,
  previewFullDatabaseRestore,
  restoreFullDatabase
} = require('./backend/csvGenerator');
const {
  setupAutoUpdater,
  checkForUpdates
} = require('./backend/updater');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const isDev = process.env.NODE_ENV === 'development';

let splashWindow;
let mainWindow;

// Helper to get the correct path for resources
function getResourcePath(relativePath) {
  // __dirname works correctly with asar archives
  return path.join(__dirname, relativePath);
}

function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'icon.png'),
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Open dev tools in development
  } else {
    const indexPath = getResourcePath('frontend/dist/index.html');
    console.log('Loading index from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Show main window when ready and close splash
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
      }
      mainWindow.setFullScreen(true);
      mainWindow.show();
      
      // Setup auto-updater (only in production)
      if (!isDev) {
        setupAutoUpdater(mainWindow);
      }
      
      // Initialize auto-sync after Google Drive is authenticated
      // (will be started when user connects to Drive)
    }, 500); // Small delay for smooth transition
  });
}

app.whenReady().then(async () => {
  // Show splash screen first
  createSplashScreen();
  
  await initDatabase();

  ipcMain.handle('auth:login', async (event, { username, password, rememberMe }) => {
    return await login(username, password, rememberMe);
  });

  ipcMain.handle('auth:loginWithToken', async (event, { token }) => {
    return await loginWithToken(token);
  });

  ipcMain.handle('auth:logout', async (event, { token }) => {
    return await logout(token);
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

  ipcMain.handle('auth:updateProfile', async (event, { username, profileData }) => {
    return await updateProfile(username, profileData);
  });

  ipcMain.handle('auth:getProfile', async (event, { username }) => {
    return await getProfile(username);
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

  // Marriage Record handlers
  ipcMain.handle('marriage:getAll', async () => {
    try {
      const records = await getAllMarriageRecords();
      return { success: true, data: records };
    } catch (error) {
      return { success: false, message: 'Failed to fetch records' };
    }
  });

  ipcMain.handle('marriage:getById', async (event, { id }) => {
    try {
      const record = await getMarriageRecordById(id);
      if (record) {
        return { success: true, data: record };
      }
      return { success: false, message: 'Record not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch record' };
    }
  });

  ipcMain.handle('marriage:getByChurch', async (event, { churchId }) => {
    try {
      const records = await getMarriageRecordsByChurch(churchId);
      return { success: true, data: records };
    } catch (error) {
      return { success: false, message: 'Failed to fetch records' };
    }
  });

  ipcMain.handle('marriage:create', async (event, recordData) => {
    try {
      const newRecord = await createMarriageRecord(recordData);
      return { success: true, data: newRecord };
    } catch (error) {
      return { success: false, message: 'Failed to create record' };
    }
  });

  ipcMain.handle('marriage:update', async (event, { id, updates }) => {
    try {
      const updatedRecord = await updateMarriageRecord(id, updates);
      if (updatedRecord) {
        return { success: true, data: updatedRecord };
      }
      return { success: false, message: 'Record not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update record' };
    }
  });

  ipcMain.handle('marriage:delete', async (event, { id }) => {
    try {
      const deleted = await deleteMarriageRecord(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Record not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete record' };
    }
  });

  ipcMain.handle('marriage:getNextNumber', async (event, { churchId }) => {
    try {
      const nextNumber = await getNextMarriageRecordNumber(churchId);
      return { success: true, data: nextNumber };
    } catch (error) {
      return { success: false, message: 'Failed to get next record number' };
    }
  });

  // Marriage Bans handlers
  ipcMain.handle('marriageBans:getAll', async () => {
    try {
      const bans = await getAllMarriageBans();
      return { success: true, data: bans };
    } catch (error) {
      return { success: false, message: 'Failed to fetch marriage bans' };
    }
  });

  ipcMain.handle('marriageBans:getById', async (event, { id }) => {
    try {
      const bans = await getMarriageBansById(id);
      if (bans) {
        return { success: true, data: bans };
      }
      return { success: false, message: 'Marriage bans not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch marriage bans' };
    }
  });

  ipcMain.handle('marriageBans:getByChurch', async (event, { churchId }) => {
    try {
      const bans = await getMarriageBansByChurch(churchId);
      return { success: true, data: bans };
    } catch (error) {
      return { success: false, message: 'Failed to fetch marriage bans' };
    }
  });

  ipcMain.handle('marriageBans:create', async (event, bansData) => {
    try {
      const newBans = await createMarriageBans(bansData);
      return { success: true, data: newBans };
    } catch (error) {
      return { success: false, message: 'Failed to create marriage bans' };
    }
  });

  ipcMain.handle('marriageBans:update', async (event, { id, updates }) => {
    try {
      const updatedBans = await updateMarriageBans(id, updates);
      if (updatedBans) {
        return { success: true, data: updatedBans };
      }
      return { success: false, message: 'Marriage bans not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update marriage bans' };
    }
  });

  ipcMain.handle('marriageBans:delete', async (event, { id }) => {
    try {
      const deleted = await deleteMarriageBans(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Marriage bans not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete marriage bans' };
    }
  });

  ipcMain.handle('marriageBans:getNextNumber', async (event, { churchId }) => {
    try {
      const nextNumber = await getNextMarriageBansNumber(churchId);
      return { success: true, data: nextNumber };
    } catch (error) {
      return { success: false, message: 'Failed to get next marriage bans number' };
    }
  });

  ipcMain.handle('marriageBans:generatePDF', async (event, { bansId, additionalData }) => {
    try {
      // Get marriage bans data
      const bans = await getMarriageBansById(bansId);
      if (!bans) {
        return { success: false, message: 'Marriage bans not found' };
      }

      // Get church data if available
      let church = null;
      if (bans.church_id) {
        church = await getChurchById(bans.church_id);
        console.log('Church data for bans:', church); // Debug log
      }

      // Generate PDF using existing marriage bans template
      const pdfPath = await generateMarriageBansPDF(bans, church, additionalData);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, data: { pdfPath } };
    } catch (error) {
      console.error('Marriage Bans PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  ipcMain.handle('marriage:generateCertificate', async (event, { recordId, additionalData }) => {
    try {
      // Get record data
      const record = await getMarriageRecordById(recordId);
      if (!record) {
        return { success: false, message: 'Record not found' };
      }

      // Get church data if available (same pattern as marriage bans)
      let church = null;
      if (additionalData.church_id) {
        church = await getChurchById(additionalData.church_id);
        console.log('Church data for certificate:', church); // Debug log
      }

      // Generate PDF
      const pdfPath = await generateMarriageCertificatePDF(record, church, additionalData);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, data: { pdfPath } };
    } catch (error) {
      console.error('Certificate generation error:', error);
      return { success: false, message: error.message || 'Failed to generate certificate' };
    }
  });

  ipcMain.handle('marriage:generatePDF', async (event, { churchId, fromDate, toDate }) => {
    try {
      // TODO: Implement marriage PDF generation
      // For now, just return success
      return { success: true, data: { message: 'Marriage PDF generation not implemented yet' } };
    } catch (error) {
      console.error('Marriage PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  ipcMain.handle('marriage:generateSchedule4', async (event, { recordId, additionalData }) => {
    try {
      // Get record data
      const record = await getMarriageRecordById(recordId);
      if (!record) {
        return { success: false, message: 'Record not found' };
      }

      // Generate Schedule 4 PDF
      const pdfPath = await generateMarriageSchedule4PDF(record, additionalData);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, data: { pdfPath } };
    } catch (error) {
      console.error('Schedule 4 generation error:', error);
      return { success: false, message: error.message || 'Failed to generate Schedule 4' };
    }
  });

  // Letterhead handlers
  ipcMain.handle('letterhead:getAll', async () => {
    try {
      const letterheads = await getAllLetterheads();
      return { success: true, data: letterheads };
    } catch (error) {
      return { success: false, message: 'Failed to fetch letterheads' };
    }
  });

  ipcMain.handle('letterhead:getById', async (event, { id }) => {
    try {
      const letterhead = await getLetterheadById(id);
      if (letterhead) {
        return { success: true, data: letterhead };
      }
      return { success: false, message: 'Letterhead not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch letterhead' };
    }
  });

  ipcMain.handle('letterhead:getByChurch', async (event, { churchId }) => {
    try {
      const letterheads = await getLetterheadsByChurch(churchId);
      return { success: true, data: letterheads };
    } catch (error) {
      return { success: false, message: 'Failed to fetch letterheads' };
    }
  });

  ipcMain.handle('letterhead:create', async (event, letterheadData) => {
    try {
      const newLetterhead = await createLetterhead(letterheadData);
      return { success: true, data: newLetterhead };
    } catch (error) {
      return { success: false, message: 'Failed to create letterhead' };
    }
  });

  ipcMain.handle('letterhead:update', async (event, { id, updates }) => {
    try {
      const updatedLetterhead = await updateLetterhead(id, updates);
      if (updatedLetterhead) {
        return { success: true, data: updatedLetterhead };
      }
      return { success: false, message: 'Letterhead not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update letterhead' };
    }
  });

  ipcMain.handle('letterhead:delete', async (event, { id }) => {
    try {
      const deleted = await deleteLetterhead(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Letterhead not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete letterhead' };
    }
  });

  ipcMain.handle('letterhead:getNextNumber', async (event, { churchId }) => {
    try {
      const nextNumber = await getNextLetterheadNumber(churchId);
      return { success: true, data: nextNumber };
    } catch (error) {
      return { success: false, message: 'Failed to get next letterhead number' };
    }
  });

  ipcMain.handle('letterhead:generatePDF', async (event, { letterheadId }) => {
    try {
      // Get letterhead data
      const letterhead = await getLetterheadById(letterheadId);
      if (!letterhead) {
        return { success: false, message: 'Letterhead not found' };
      }

      // Get church data if available
      let church = null;
      if (letterhead.church_id) {
        church = await getChurchById(letterhead.church_id);
      }

      // Generate PDF
      const pdfPath = await generateLetterheadPDF(letterhead, church);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, data: { pdfPath } };
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  // Area handlers
  ipcMain.handle('area:getAll', async () => {
    try {
      const areas = await getAllAreas();
      return { success: true, data: areas };
    } catch (error) {
      return { success: false, message: 'Failed to fetch areas' };
    }
  });

  ipcMain.handle('area:getById', async (event, { id }) => {
    try {
      const area = await getAreaById(id);
      if (area) {
        return { success: true, data: area };
      }
      return { success: false, message: 'Area not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch area' };
    }
  });

  ipcMain.handle('area:getByChurch', async (event, { churchId }) => {
    try {
      const areas = await getAreasByChurch(churchId);
      return { success: true, data: areas };
    } catch (error) {
      return { success: false, message: 'Failed to fetch areas' };
    }
  });

  ipcMain.handle('area:create', async (event, areaData) => {
    try {
      const newArea = await createArea(areaData);
      return { success: true, data: newArea };
    } catch (error) {
      return { success: false, message: 'Failed to create area' };
    }
  });

  ipcMain.handle('area:update', async (event, { id, updates }) => {
    try {
      const updatedArea = await updateArea(id, updates);
      if (updatedArea) {
        return { success: true, data: updatedArea };
      }
      return { success: false, message: 'Area not found' };
    } catch (error) {
      return { success: false, message: 'Failed to update area' };
    }
  });

  ipcMain.handle('area:delete', async (event, { id }) => {
    try {
      const deleted = await deleteArea(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Area not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete area' };
    }
  });

  // Family handlers
  ipcMain.handle('family:getAll', async () => {
    try {
      const families = await getAllFamilies();
      return { success: true, data: families };
    } catch (error) {
      return { success: false, message: 'Failed to fetch families' };
    }
  });

  ipcMain.handle('family:getById', async (event, { id }) => {
    try {
      const family = await getFamilyById(id);
      if (family) {
        return { success: true, data: family };
      }
      return { success: false, message: 'Family not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch family' };
    }
  });

  ipcMain.handle('family:getByArea', async (event, { areaId }) => {
    try {
      const families = await getFamiliesByArea(areaId);
      return { success: true, data: families };
    } catch (error) {
      return { success: false, message: 'Failed to fetch families' };
    }
  });

  ipcMain.handle('family:create', async (event, familyData) => {
    try {
      const newFamily = await createFamily(familyData);
      return { success: true, data: newFamily };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to create family' };
    }
  });

  ipcMain.handle('family:update', async (event, { id, updates }) => {
    try {
      const updatedFamily = await updateFamily(id, updates);
      if (updatedFamily) {
        return { success: true, data: updatedFamily };
      }
      return { success: false, message: 'Family not found' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update family' };
    }
  });

  ipcMain.handle('family:delete', async (event, { id }) => {
    try {
      const deleted = await deleteFamily(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Family not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete family' };
    }
  });

  ipcMain.handle('family:getAutoNumbers', async (event, { areaId }) => {
    try {
      const familyNumber = await getNextFamilyNumber(areaId);
      const layoutNumber = await getNextLayoutNumber(areaId);
      return { success: true, data: { familyNumber, layoutNumber } };
    } catch (error) {
      return { success: false, message: 'Failed to get auto numbers' };
    }
  });

  // Member handlers
  ipcMain.handle('member:getAll', async () => {
    try {
      const members = await getAllMembers();
      return { success: true, data: members };
    } catch (error) {
      return { success: false, message: 'Failed to fetch members' };
    }
  });

  ipcMain.handle('member:getById', async (event, { id }) => {
    try {
      const member = await getMemberById(id);
      if (member) {
        return { success: true, data: member };
      }
      return { success: false, message: 'Member not found' };
    } catch (error) {
      return { success: false, message: 'Failed to fetch member' };
    }
  });

  ipcMain.handle('member:getByFamily', async (event, { familyId }) => {
    try {
      const members = await getMembersByFamily(familyId);
      return { success: true, data: members };
    } catch (error) {
      return { success: false, message: 'Failed to fetch members' };
    }
  });

  ipcMain.handle('member:create', async (event, memberData) => {
    try {
      const newMember = await createMember(memberData);
      return { success: true, data: newMember };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to create member' };
    }
  });

  ipcMain.handle('member:update', async (event, { id, updates }) => {
    try {
      const updatedMember = await updateMember(id, updates);
      if (updatedMember) {
        return { success: true, data: updatedMember };
      }
      return { success: false, message: 'Member not found' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update member' };
    }
  });

  ipcMain.handle('member:delete', async (event, { id }) => {
    try {
      const deleted = await deleteMember(id);
      if (deleted) {
        return { success: true };
      }
      return { success: false, message: 'Member not found' };
    } catch (error) {
      return { success: false, message: 'Failed to delete member' };
    }
  });

  ipcMain.handle('member:getAutoNumbers', async (event, { familyId }) => {
    try {
      const memberNumber = await getNextMemberNumber(familyId);
      const memberId = await getNextMemberId();
      return { success: true, data: { memberNumber, memberId } };
    } catch (error) {
      return { success: false, message: 'Failed to get auto numbers' };
    }
  });

  ipcMain.handle('member:getBirthdaysByDateRange', async (event, { churchId, fromDate, toDate }) => {
    try {
      const birthdays = await getBirthdaysByDateRange(churchId, fromDate, toDate);
      return { success: true, data: birthdays };
    } catch (error) {
      return { success: false, message: 'Failed to fetch birthdays' };
    }
  });

  ipcMain.handle('birthday:generatePDF', async (event, { churchId, fromDate, toDate }) => {
    try {
      // Get church data
      const church = await getChurchById(churchId);
      if (!church) {
        return { success: false, message: 'Church not found' };
      }

      // Get birthday report data
      const birthdayData = await getBirthdayReportData(churchId, fromDate, toDate);

      // Generate PDF
      const pdfPath = await generateBirthdayListPDF({
        churchData: church,
        birthdayData: birthdayData,
        dateRange: { fromDate, toDate }
      });

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, pdfPath };
    } catch (error) {
      console.error('Birthday PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  // Wedding List handlers
  ipcMain.handle('member:getWeddingsByDateRange', async (event, { churchId, fromDate, toDate }) => {
    try {
      const weddings = await getWeddingsByDateRange(churchId, fromDate, toDate);
      return { success: true, data: weddings };
    } catch (error) {
      return { success: false, message: 'Failed to fetch weddings' };
    }
  });

  ipcMain.handle('wedding:generatePDF', async (event, { churchId, fromDate, toDate }) => {
    try {
      // Get church data
      const church = await getChurchById(churchId);
      if (!church) {
        return { success: false, message: 'Church not found' };
      }

      // Get wedding report data
      const weddingData = await getWeddingReportData(churchId, fromDate, toDate);

      // Generate PDF
      const pdfPath = await generateWeddingListPDF({
        churchData: church,
        weddingData: weddingData,
        dateRange: { fromDate, toDate }
      });

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, pdfPath };
    } catch (error) {
      console.error('Wedding PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  // Sabai Jabitha handler
  ipcMain.handle('sabaiJabitha:generatePDF', async (event, { churchId, year }) => {
    try {
      // Get church data
      const church = await getChurchById(churchId);
      if (!church) {
        return { success: false, message: 'Church not found' };
      }

      // Generate PDF
      const pdfPath = await generateSabaiJabithaPDF(churchId, year, church);

      // Open PDF
      await openPDF(pdfPath);

      return { success: true, pdfPath };
    } catch (error) {
      console.error('Sabai Jabitha PDF generation error:', error);
      return { success: false, message: error.message || 'Failed to generate PDF' };
    }
  });

  // Backup handlers
  ipcMain.handle('backup:createCongregationBackup', async (event, { churchId }) => {
    try {
      const result = await createCongregationBackup(churchId);
      return result;
    } catch (error) {
      console.error('Congregation backup error:', error);
      return { success: false, message: error.message || 'Failed to create backup' };
    }
  });

  ipcMain.handle('backup:selectRestoreFile', async (event) => {
    try {
      console.log('IPC: backup:selectRestoreFile called');
      const result = await selectRestoreFile();
      console.log('IPC: selectRestoreFile result:', result);
      return result;
    } catch (error) {
      console.error('IPC: File selection error:', error);
      return { success: false, message: error.message || 'Failed to select file' };
    }
  });

  ipcMain.handle('backup:previewCongregationRestore', async (event, { filePath, churchId }) => {
    try {
      const result = await previewCongregationRestore(filePath, churchId);
      return result;
    } catch (error) {
      console.error('Congregation restore preview error:', error);
      return { success: false, message: error.message || 'Failed to preview restore' };
    }
  });

  ipcMain.handle('backup:restoreCongregationBackup', async (event, { filePath, churchId, mode }) => {
    try {
      const result = await restoreCongregationBackup(filePath, churchId, mode);
      return result;
    } catch (error) {
      console.error('Congregation restore error:', error);
      return { success: false, message: error.message || 'Failed to restore data' };
    }
  });

  // Full Database Backup handlers
  ipcMain.handle('backup:createFullDatabase', async () => {
    try {
      const result = await createFullDatabaseBackup();
      return result;
    } catch (error) {
      console.error('Full database backup error:', error);
      return { success: false, message: error.message || 'Failed to create full database backup' };
    }
  });

  ipcMain.handle('backup:selectFullDatabaseRestoreFile', async () => {
    try {
      const result = await selectFullDatabaseRestoreFile();
      return result;
    } catch (error) {
      console.error('File selection error:', error);
      return { success: false, message: error.message || 'Failed to select file' };
    }
  });

  ipcMain.handle('backup:previewFullDatabaseRestore', async (event, { filePath }) => {
    try {
      const result = await previewFullDatabaseRestore(filePath);
      return result;
    } catch (error) {
      console.error('Preview error:', error);
      return { success: false, message: error.message || 'Failed to preview backup' };
    }
  });

  ipcMain.handle('backup:restoreFullDatabase', async (event, { filePath }) => {
    try {
      const result = await restoreFullDatabase(filePath);
      return result;
    } catch (error) {
      console.error('Full database restore error:', error);
      return { success: false, message: error.message || 'Failed to restore database' };
    }
  });

  // App restart handler
  ipcMain.handle('app:restart', () => {
    app.relaunch();
    app.exit(0);
  });

  // Update handler
  ipcMain.handle('app:checkForUpdates', async () => {
    try {
      if (!isDev) {
        checkForUpdates(mainWindow, true);
      }
      return { success: true };
    } catch (error) {
      console.error('Update check error:', error);
      return { success: false, message: error.message || 'Failed to check for updates' };
    }
  });

  // Version handler
  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion();
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

// Auto-sync IPC handlers
ipcMain.handle('sync:manual', async () => {
  try {
    const success = await autoSync.manualSync();
    return { success };
  } catch (error) {
    console.error('Manual sync error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('sync:getStatus', async () => {
  try {
    const status = autoSync.getSyncStatus();
    return { success: true, ...status };
  } catch (error) {
    console.error('Get sync status error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('sync:enable', async () => {
  try {
    const credentials = await getGoogleCredentials();
    if (!credentials) {
      return { success: false, message: 'Not authenticated with Google Drive' };
    }
    
    googleDriveSync.setCredentials(credentials);
    autoSync.initialize(mainWindow);
    
    return { success: true };
  } catch (error) {
    console.error('Enable sync error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('sync:disable', async () => {
  try {
    autoSync.stop();
    return { success: true };
  } catch (error) {
    console.error('Disable sync error:', error);
    return { success: false, message: error.message };
  }
});

app.on('window-all-closed', () => {
  // Stop auto-sync before quitting
  autoSync.stop();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Ensure auto-sync is stopped
  autoSync.stop();
});


// ==================== Google Drive Sync Handlers ====================

ipcMain.handle('google:authenticate', async () => {
  try {
    // Start OAuth server to capture callback
    const serverPromise = googleDriveSync.startOAuthServer();
    
    // Get auth URL and open in browser
    const authUrl = googleDriveSync.getAuthUrl();
    await shell.openExternal(authUrl);
    
    // Wait for OAuth callback
    const code = await serverPromise;
    
    // Exchange code for tokens
    const tokens = await googleDriveSync.getTokens(code);
    await saveGoogleCredentials(tokens);
    googleDriveSync.setCredentials(tokens);
    
    // Initialize auto-sync after successful authentication
    autoSync.initialize(mainWindow);
    
    return { success: true };
  } catch (error) {
    console.error('Google authentication error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google:checkAuth', async () => {
  try {
    const credentials = await getGoogleCredentials();
    if (credentials) {
      googleDriveSync.setCredentials(credentials);
      
      // Initialize auto-sync if authenticated
      autoSync.initialize(mainWindow);
      
      return { success: true, isAuthenticated: true };
    }
    return { success: true, isAuthenticated: false };
  } catch (error) {
    console.error('Check auth error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google:uploadDatabase', async () => {
  try {
    const credentials = await getGoogleCredentials();
    if (!credentials) {
      return { success: false, message: 'Not authenticated with Google' };
    }
    
    // Increment Windows version
    await incrementWindowsVersion();
    const versionString = await getVersionString();
    
    googleDriveSync.setCredentials(credentials);
    const result = await googleDriveSync.uploadDatabase(versionString);
    return { success: true, ...result, version: versionString };
  } catch (error) {
    console.error('Upload database error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google:getVersions', async () => {
  try {
    const credentials = await getGoogleCredentials();
    if (!credentials) {
      return { success: false, message: 'Not authenticated with Google' };
    }
    
    googleDriveSync.setCredentials(credentials);
    
    // Get local version
    const localMetadata = await getMetadata();
    const localVersion = await getVersionString();
    
    // Get cloud version
    const latestFile = await googleDriveSync.getLatestVersion();
    
    return {
      success: true,
      local: {
        version: localVersion,
        metadata: localMetadata
      },
      cloud: latestFile ? {
        version: latestFile.name,
        fileId: latestFile.id,
        createdTime: latestFile.createdTime,
        size: latestFile.size
      } : null
    };
  } catch (error) {
    console.error('Get versions error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google:compareVersions', async () => {
  try {
    const credentials = await getGoogleCredentials();
    if (!credentials) {
      return { success: false, message: 'Not authenticated with Google' };
    }
    
    googleDriveSync.setCredentials(credentials);
    
    // Get local data
    const localData = await getAllDatabaseData();
    
    // Get cloud data
    const latestFile = await googleDriveSync.getLatestVersion();
    if (!latestFile) {
      return { success: false, message: 'No cloud backup found' };
    }
    
    const cloudResult = await googleDriveSync.downloadDatabase(latestFile.id);
    if (!cloudResult.success) {
      return { success: false, message: 'Failed to download cloud data' };
    }
    
    // Compare data
    const comparison = comparisonEngine.compareData(localData, cloudResult.data);
    
    return {
      success: true,
      comparison,
      cloudFile: {
        id: latestFile.id,
        name: latestFile.name,
        createdTime: latestFile.createdTime
      }
    };
  } catch (error) {
    console.error('Compare versions error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google:syncDown', async (event, { selectedItems }) => {
  try {
    const credentials = await getGoogleCredentials();
    if (!credentials) {
      return { success: false, message: 'Not authenticated with Google' };
    }
    
    googleDriveSync.setCredentials(credentials);
    
    // Get cloud data
    const latestFile = await googleDriveSync.getLatestVersion();
    if (!latestFile) {
      return { success: false, message: 'No cloud backup found' };
    }
    
    const cloudResult = await googleDriveSync.downloadDatabase(latestFile.id);
    if (!cloudResult.success) {
      return { success: false, message: 'Failed to download cloud data' };
    }
    
    // Merge selected data
    await mergeDatabaseData(cloudResult.data, selectedItems);
    
    // Update metadata from cloud
    if (cloudResult.data.metadata) {
      await updateMetadata(cloudResult.data.metadata);
    }
    
    return { success: true, message: 'Data synced successfully' };
  } catch (error) {
    console.error('Sync down error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google:disconnect', async () => {
  try {
    await deleteGoogleCredentials();
    return { success: true };
  } catch (error) {
    console.error('Disconnect error:', error);
    return { success: false, message: error.message };
  }
});


// Shell handler
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Open external error:', error);
    return { success: false, message: error.message };
  }
});
