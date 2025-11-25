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
  getWeddingReportData
} = require('./backend/database');
const {
  login,
  loginWithToken,
  logout,
  verifyRecoveryPin,
  resetPassword,
  changePassword,
  changeRecoveryPin
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
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }
}

app.whenReady().then(async () => {
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

