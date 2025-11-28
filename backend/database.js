const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const bcrypt = require('bcryptjs');
const path = require('path');
const { app } = require('electron');

let db = null;

async function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'auth.json');

  const adapter = new JSONFile(dbPath);
  db = new Low(adapter, { users: [], settings: {}, churches: [], infantBaptismCertificates: [], adultBaptismCertificates: [], burialRegisters: [], marriageRecords: [], marriageBans: [], letterheads: [], areas: [], families: [], members: [], rememberTokens: [], googleCredentials: null });

  await db.read();

  // Initialize default user if not exists
  if (db.data.users.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.data.users.push({
      id: 1,
      username: 'admin',
      name: 'Administrator',
      email: '',
      phone: '',
      password: hashedPassword,
      recoveryPin: await bcrypt.hash('1221', 10)
    });
    await db.write();
  }

  // Initialize churches array if not exists
  if (!db.data.churches) {
    db.data.churches = [];
    await db.write();
  }

  // Initialize infant baptism certificates array if not exists
  if (!db.data.infantBaptismCertificates) {
    db.data.infantBaptismCertificates = [];
    await db.write();
  }

  // Initialize adult baptism certificates array if not exists
  if (!db.data.adultBaptismCertificates) {
    db.data.adultBaptismCertificates = [];
    await db.write();
  }

  // Initialize burial registers array if not exists
  if (!db.data.burialRegisters) {
    db.data.burialRegisters = [];
    await db.write();
  }

  // Initialize marriage records array if not exists
  if (!db.data.marriageRecords) {
    db.data.marriageRecords = [];
    await db.write();
  }

  // Initialize marriage bans array if not exists
  if (!db.data.marriageBans) {
    db.data.marriageBans = [];
    await db.write();
  }

  // Add demo marriage record if none exists
  if (db.data.marriageRecords.length === 0) {
    const demoMarriageRecord = {
      id: 1,
      groomName: 'Sujith S.',
      groomNameTamil: 'சூஜித் எஸ்.',
      brideName: 'S. Remina',
      brideNameTamil: 'எஸ். ரெமினா',
      congregation: 'Bride',
      groomFatherName: 'Selvaraj',
      groomMotherName: 'Rajini',
      brideFatherName: 'Thomas',
      brideMotherName: 'Megala',
      groomDOB: '1997-10-13',
      brideDOB: '2000-04-17',
      isGroomBachelor: 'Yes',
      isBrideSpinster: 'Yes',
      groomProfession: 'Software Engineer',
      brideProfession: 'Teacher',
      groomMobile: '9876543210',
      brideMobile: '9876543211',
      groomChurchName: 'C.S.I. St. Peter\'s Church',
      groomPastorateName: 'Tenkasi North Zion Nagar Pastorate',
      brideChurchName: 'C.S.I. St. Paul\'s Church',
      bridePastorateName: 'Nallur Pastorate',
      marriageDate: '2025-12-20',
      weddingPlace: 'C.S.I. St. Peter\'s Church, Tenkasi',
      firstBansDate: '2025-12-13',
      secondBansDate: '2025-12-15',
      thirdBansDate: '2025-12-18',
      serialNumber: '1',
      solemnizedBy: 'Rev. Samuel',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.marriageRecords.push(demoMarriageRecord);
    await db.write();
  }

  // Initialize letterheads array if not exists
  if (!db.data.letterheads) {
    db.data.letterheads = [];
    await db.write();
  }

  // Initialize areas array if not exists
  if (!db.data.areas) {
    db.data.areas = [];
    await db.write();
  }

  // Initialize families array if not exists
  if (!db.data.families) {
    db.data.families = [];
    await db.write();
  }

  // Initialize members array if not exists
  if (!db.data.members) {
    db.data.members = [];
    await db.write();
  }

  // Initialize rememberTokens array if not exists
  if (!db.data.rememberTokens) {
    db.data.rememberTokens = [];
    await db.write();
  }

  return db;
}

async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

async function findUserByUsername(username) {
  const database = await getDatabase();
  return database.data.users.find(u => u.username === username);
}

async function updateUser(username, updates) {
  const database = await getDatabase();
  const userIndex = database.data.users.findIndex(u => u.username === username);

  if (userIndex !== -1) {
    database.data.users[userIndex] = {
      ...database.data.users[userIndex],
      ...updates
    };
    await database.write();
    return true;
  }
  return false;
}

// Church CRUD operations
async function getAllChurches() {
  const database = await getDatabase();
  return database.data.churches || [];
}

async function getChurchById(id) {
  const database = await getDatabase();
  return database.data.churches.find(c => c.id === id);
}

async function createChurch(churchData) {
  const database = await getDatabase();

  // Generate new ID
  const maxId = database.data.churches.length > 0
    ? Math.max(...database.data.churches.map(c => c.id))
    : 0;

  const newChurch = {
    id: maxId + 1,
    ...churchData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.churches.push(newChurch);
  await database.write();

  return newChurch;
}

async function updateChurch(id, updates) {
  const database = await getDatabase();
  const churchIndex = database.data.churches.findIndex(c => c.id === id);

  if (churchIndex !== -1) {
    database.data.churches[churchIndex] = {
      ...database.data.churches[churchIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await database.write();
    return database.data.churches[churchIndex];
  }
  return null;
}

async function deleteChurch(id) {
  const database = await getDatabase();
  const initialLength = database.data.churches.length;
  database.data.churches = database.data.churches.filter(c => c.id !== id);

  if (database.data.churches.length < initialLength) {
    await database.write();
    return true;
  }
  return false;
}

// Infant Baptism Certificate CRUD operations
async function getAllInfantBaptismCertificates() {
  const database = await getDatabase();
  return database.data.infantBaptismCertificates || [];
}

async function getInfantBaptismCertificateById(id) {
  const database = await getDatabase();
  return database.data.infantBaptismCertificates.find(c => c.id === id);
}

async function getInfantBaptismCertificatesByChurch(churchId) {
  const database = await getDatabase();
  return database.data.infantBaptismCertificates.filter(c => c.church_id === churchId);
}

async function createInfantBaptismCertificate(certificateData) {
  const database = await getDatabase();

  // Generate new ID
  const maxId = database.data.infantBaptismCertificates.length > 0
    ? Math.max(...database.data.infantBaptismCertificates.map(c => c.id))
    : 0;

  const newCertificate = {
    id: maxId + 1,
    ...certificateData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.infantBaptismCertificates.push(newCertificate);
  await database.write();

  return newCertificate;
}

async function updateInfantBaptismCertificate(id, updates) {
  const database = await getDatabase();
  const certIndex = database.data.infantBaptismCertificates.findIndex(c => c.id === id);

  if (certIndex !== -1) {
    database.data.infantBaptismCertificates[certIndex] = {
      ...database.data.infantBaptismCertificates[certIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await database.write();
    return database.data.infantBaptismCertificates[certIndex];
  }
  return null;
}

async function deleteInfantBaptismCertificate(id) {
  const database = await getDatabase();
  const initialLength = database.data.infantBaptismCertificates.length;
  database.data.infantBaptismCertificates = database.data.infantBaptismCertificates.filter(c => c.id !== id);

  if (database.data.infantBaptismCertificates.length < initialLength) {
    await database.write();
    return true;
  }
  return false;
}

async function getNextInfantBaptismCertificateNumber(churchId) {
  const database = await getDatabase();
  const churchCertificates = database.data.infantBaptismCertificates.filter(c => c.church_id === churchId);

  if (churchCertificates.length === 0) {
    return '1';
  }

  // Find the highest certificate number
  const numbers = churchCertificates
    .map(c => parseInt(c.certificate_number))
    .filter(n => !isNaN(n));

  if (numbers.length === 0) {
    return '1';
  }

  return String(Math.max(...numbers) + 1);
}

// Adult Baptism Certificate CRUD operations
async function getAllAdultBaptismCertificates() {
  const database = await getDatabase();
  return database.data.adultBaptismCertificates || [];
}

async function getAdultBaptismCertificateById(id) {
  const database = await getDatabase();
  return database.data.adultBaptismCertificates.find(c => c.id === id);
}

async function getAdultBaptismCertificatesByChurch(churchId) {
  const database = await getDatabase();
  return database.data.adultBaptismCertificates.filter(c => c.church_id === churchId);
}

async function createAdultBaptismCertificate(certificateData) {
  const database = await getDatabase();

  // Generate new ID
  const maxId = database.data.adultBaptismCertificates.length > 0
    ? Math.max(...database.data.adultBaptismCertificates.map(c => c.id))
    : 0;

  const newCertificate = {
    id: maxId + 1,
    ...certificateData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.adultBaptismCertificates.push(newCertificate);
  await database.write();

  return newCertificate;
}

async function updateAdultBaptismCertificate(id, updates) {
  const database = await getDatabase();
  const certIndex = database.data.adultBaptismCertificates.findIndex(c => c.id === id);

  if (certIndex !== -1) {
    database.data.adultBaptismCertificates[certIndex] = {
      ...database.data.adultBaptismCertificates[certIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await database.write();
    return database.data.adultBaptismCertificates[certIndex];
  }
  return null;
}

async function deleteAdultBaptismCertificate(id) {
  const database = await getDatabase();
  const initialLength = database.data.adultBaptismCertificates.length;
  database.data.adultBaptismCertificates = database.data.adultBaptismCertificates.filter(c => c.id !== id);

  if (database.data.adultBaptismCertificates.length < initialLength) {
    await database.write();
    return true;
  }
  return false;
}

async function getNextAdultBaptismCertificateNumber(churchId) {
  const database = await getDatabase();
  const churchCertificates = database.data.adultBaptismCertificates.filter(c => c.church_id === churchId);

  if (churchCertificates.length === 0) {
    return '1';
  }

  // Find the highest certificate number
  const numbers = churchCertificates
    .map(c => parseInt(c.certificate_number))
    .filter(n => !isNaN(n));

  if (numbers.length === 0) {
    return '1';
  }

  return String(Math.max(...numbers) + 1);
}

// Burial Register CRUD operations
async function getAllBurialRegisters() {
  const database = await getDatabase();
  return database.data.burialRegisters || [];
}

async function getBurialRegisterById(id) {
  const database = await getDatabase();
  return database.data.burialRegisters.find(r => r.id === id);
}

async function getBurialRegistersByChurch(churchId) {
  const database = await getDatabase();
  return database.data.burialRegisters.filter(r => r.church_id === churchId);
}

async function createBurialRegister(registerData) {
  const database = await getDatabase();

  // Generate new ID
  const maxId = database.data.burialRegisters.length > 0
    ? Math.max(...database.data.burialRegisters.map(r => r.id))
    : 0;

  const newRegister = {
    id: maxId + 1,
    ...registerData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.burialRegisters.push(newRegister);
  await database.write();

  return newRegister;
}

async function updateBurialRegister(id, updates) {
  const database = await getDatabase();
  const registerIndex = database.data.burialRegisters.findIndex(r => r.id === id);

  if (registerIndex !== -1) {
    database.data.burialRegisters[registerIndex] = {
      ...database.data.burialRegisters[registerIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await database.write();
    return database.data.burialRegisters[registerIndex];
  }
  return null;
}

async function deleteBurialRegister(id) {
  const database = await getDatabase();
  const initialLength = database.data.burialRegisters.length;
  database.data.burialRegisters = database.data.burialRegisters.filter(r => r.id !== id);

  if (database.data.burialRegisters.length < initialLength) {
    await database.write();
    return true;
  }
  return false;
}

async function getNextBurialRegisterNumber(churchId) {
  const database = await getDatabase();
  const churchRegisters = database.data.burialRegisters.filter(r => r.church_id === churchId);

  if (churchRegisters.length === 0) {
    return '1';
  }

  // Find the highest certificate number
  const numbers = churchRegisters
    .map(r => parseInt(r.certificate_number))
    .filter(n => !isNaN(n));

  if (numbers.length === 0) {
    return '1';
  }

  return String(Math.max(...numbers) + 1);
}

// Marriage Records CRUD operations
async function getAllMarriageRecords() {
  const database = await getDatabase();
  return database.data.marriageRecords || [];
}

async function getMarriageRecordById(id) {
  const database = await getDatabase();
  return database.data.marriageRecords.find(r => r.id === id);
}

async function getMarriageRecordsByChurch(churchId) {
  const database = await getDatabase();
  // This would need to be implemented based on how we want to associate marriage records with churches
  // For now, returning all marriage records
  return database.data.marriageRecords;
}

async function createMarriageRecord(recordData) {
  const database = await getDatabase();

  // Generate new ID
  const maxId = database.data.marriageRecords.length > 0
    ? Math.max(...database.data.marriageRecords.map(r => r.id))
    : 0;

  // Auto-generate serial number if not provided
  if (!recordData.serialNumber) {
    recordData.serialNumber = await getNextMarriageRecordNumber(recordData.congregation || 1);
  }

  const newRecord = {
    id: maxId + 1,
    // Basic info
    groomName: recordData.groomName || '',
    groomNameTamil: recordData.groomNameTamil || '',
    brideName: recordData.brideName || '',
    brideNameTamil: recordData.brideNameTamil || '',
    congregation: recordData.congregation || '',

    // Family info
    groomFatherName: recordData.groomFatherName || '',
    groomMotherName: recordData.groomMotherName || '',
    brideFatherName: recordData.brideFatherName || '',
    brideMotherName: recordData.brideMotherName || '',

    // Personal details
    groomDOB: recordData.groomDOB || '',
    brideDOB: recordData.brideDOB || '',
    isGroomBachelor: recordData.isGroomBachelor || '',
    isBrideSpinster: recordData.isBrideSpinster || '',
    groomProfession: recordData.groomProfession || '',
    brideProfession: recordData.brideProfession || '',

    // Contact info
    groomMobile: recordData.groomMobile || '',
    brideMobile: recordData.brideMobile || '',

    // Church info
    groomChurchName: recordData.groomChurchName || '',
    groomPastorateName: recordData.groomPastorateName || '',
    brideChurchName: recordData.brideChurchName || '',
    bridePastorateName: recordData.bridePastorateName || '',

    // Marriage details
    marriageDate: recordData.marriageDate || '',
    weddingPlace: recordData.weddingPlace || '',
    firstBansDate: recordData.firstBansDate || '',
    secondBansDate: recordData.secondBansDate || '',
    thirdBansDate: recordData.thirdBansDate || '',
    serialNumber: recordData.serialNumber || '',
    solemnizedBy: recordData.solemnizedBy || '',

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.marriageRecords.push(newRecord);
  await database.write();

  return newRecord;
}

async function updateMarriageRecord(id, updates) {
  const database = await getDatabase();
  const recordIndex = database.data.marriageRecords.findIndex(r => r.id === id);

  if (recordIndex !== -1) {
    database.data.marriageRecords[recordIndex] = {
      ...database.data.marriageRecords[recordIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await database.write();
    return database.data.marriageRecords[recordIndex];
  }
  return null;
}

async function deleteMarriageRecord(id) {
  const database = await getDatabase();
  const initialLength = database.data.marriageRecords.length;
  database.data.marriageRecords = database.data.marriageRecords.filter(r => r.id !== id);

  if (database.data.marriageRecords.length < initialLength) {
    await database.write();
    return true;
  }
  return false;
}

async function getNextMarriageRecordNumber(churchId) {
  const database = await getDatabase();
  const churchRecords = database.data.marriageRecords;

  if (churchRecords.length === 0) {
    return '1';
  }

  // Find the highest record number
  const numbers = churchRecords
    .map(r => parseInt(r.serialNumber))
    .filter(n => !isNaN(n));

  if (numbers.length === 0) {
    return '1';
  }

  return String(Math.max(...numbers) + 1);
}

// Marriage Bans CRUD operations
async function getAllMarriageBans() {
  const database = await getDatabase();
  return database.data.marriageBans || [];
}

async function getMarriageBansById(id) {
  const database = await getDatabase();
  return database.data.marriageBans.find(b => b.id === id);
}

async function getMarriageBansByChurch(churchId) {
  const database = await getDatabase();
  return database.data.marriageBans.filter(b => b.church_id === churchId);
}

async function createMarriageBans(bansData) {
  const database = await getDatabase();

  // Generate new ID
  const maxId = database.data.marriageBans.length > 0
    ? Math.max(...database.data.marriageBans.map(b => b.id))
    : 0;

  const newBans = {
    id: maxId + 1,
    ...bansData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.marriageBans.push(newBans);
  await database.write();

  return newBans;
}

async function updateMarriageBans(id, updates) {
  const database = await getDatabase();
  const bansIndex = database.data.marriageBans.findIndex(b => b.id === id);

  if (bansIndex !== -1) {
    database.data.marriageBans[bansIndex] = {
      ...database.data.marriageBans[bansIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await database.write();
    return database.data.marriageBans[bansIndex];
  }
  return null;
}

async function deleteMarriageBans(id) {
  const database = await getDatabase();
  const initialLength = database.data.marriageBans.length;
  database.data.marriageBans = database.data.marriageBans.filter(b => b.id !== id);

  if (database.data.marriageBans.length < initialLength) {
    await database.write();
    return true;
  }
  return false;
}

async function getNextMarriageBansNumber(churchId) {
  const database = await getDatabase();
  const churchBans = database.data.marriageBans.filter(b => b.church_id === churchId);

  if (churchBans.length === 0) {
    return '1';
  }

  // Find the highest bans number
  const numbers = churchBans
    .map(b => parseInt(b.bans_number))
    .filter(n => !isNaN(n));

  if (numbers.length === 0) {
    return '1';
  }

  return String(Math.max(...numbers) + 1);
}

// Area CRUD operations
async function getAllAreas() {
  const database = await getDatabase();
  return database.data.areas || [];
}

async function getAreaById(id) {
  const database = await getDatabase();
  return database.data.areas.find(a => a.id === id);
}

async function getAreasByChurch(churchId) {
  const database = await getDatabase();
  return database.data.areas.filter(a => a.churchId === churchId);
}

async function createArea(areaData) {
  const database = await getDatabase();

  // Generate new ID
  const maxId = database.data.areas.length > 0
    ? Math.max(...database.data.areas.map(a => a.id))
    : 0;

  const newArea = {
    id: maxId + 1,
    ...areaData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.areas.push(newArea);
  await database.write();

  return newArea;
}

async function updateArea(id, updates) {
  const database = await getDatabase();
  const areaIndex = database.data.areas.findIndex(a => a.id === id);

  if (areaIndex !== -1) {
    database.data.areas[areaIndex] = {
      ...database.data.areas[areaIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await database.write();
    return database.data.areas[areaIndex];
  }
  return null;
}

async function deleteArea(id) {
  const database = await getDatabase();
  const initialLength = database.data.areas.length;
  database.data.areas = database.data.areas.filter(a => a.id !== id);

  if (database.data.areas.length < initialLength) {
    await database.write();
    return true;
  }
  return false;
}

module.exports = {
  initDatabase,
  getDatabase,
  findUserByUsername,
  updateUser,
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
  getAllMarriageBans,
  getMarriageBansById,
  getMarriageBansByChurch,
  createMarriageBans,
  updateMarriageBans,
  deleteMarriageBans,
  getNextMarriageBansNumber,
  createRememberToken,
  validateRememberToken,
  deleteRememberToken,
  deleteUserRememberTokens,
  cleanupExpiredTokens,
  saveGoogleCredentials,
  getGoogleCredentials,
  deleteGoogleCredentials
};

// ==================== Letterhead Functions ====================

async function getAllLetterheads() {
  await db.read();
  return db.data.letterheads || [];
}

async function getLetterheadById(id) {
  await db.read();
  return db.data.letterheads.find(letterhead => letterhead.id === id);
}

async function getLetterheadsByChurch(churchId) {
  await db.read();
  return db.data.letterheads.filter(letterhead => letterhead.church_id === churchId);
}

async function createLetterhead(letterheadData) {
  await db.read();

  const newLetterhead = {
    id: Date.now(),
    ...letterheadData,
    created_at: new Date().toISOString()
  };

  db.data.letterheads.push(newLetterhead);
  await db.write();

  return newLetterhead;
}

async function updateLetterhead(id, updates) {
  await db.read();

  const index = db.data.letterheads.findIndex(letterhead => letterhead.id === id);
  if (index === -1) return null;

  db.data.letterheads[index] = {
    ...db.data.letterheads[index],
    ...updates,
    updated_at: new Date().toISOString()
  };

  await db.write();
  return db.data.letterheads[index];
}

async function deleteLetterhead(id) {
  await db.read();

  const index = db.data.letterheads.findIndex(letterhead => letterhead.id === id);
  if (index === -1) return false;

  db.data.letterheads.splice(index, 1);
  await db.write();

  return true;
}

async function getNextLetterheadNumber(churchId) {
  await db.read();

  const churchLetterheads = db.data.letterheads.filter(
    letterhead => letterhead.church_id === churchId
  );

  if (churchLetterheads.length === 0) {
    return 'LH-001';
  }

  // Sort by created_at to get the most recent letterhead
  const sortedLetterheads = churchLetterheads.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA; // Most recent first
  });

  // Get the most recent letterhead to extract its prefix
  const lastLetterhead = sortedLetterheads[0];
  const lastNumber = lastLetterhead.letterhead_number || 'LH-001';
  
  // Extract prefix and number from last letterhead
  const match = lastNumber.match(/^(.+?)(\d+)$/);
  let prefix = 'LH-';
  let maxNumber = 0;
  
  if (match) {
    prefix = match[1]; // Everything before the number
    maxNumber = parseInt(match[2]); // The number part
  }
  
  // Also check all letterheads with the same prefix to find max number
  const numbersWithSamePrefix = churchLetterheads
    .filter(letterhead => letterhead.letterhead_number?.startsWith(prefix))
    .map(letterhead => {
      const numMatch = letterhead.letterhead_number?.match(/(\d+)$/);
      return numMatch ? parseInt(numMatch[1]) : 0;
    })
    .filter(num => !isNaN(num));
  
  if (numbersWithSamePrefix.length > 0) {
    maxNumber = Math.max(...numbersWithSamePrefix);
  }
  
  const nextNumber = maxNumber + 1;
  const numberLength = match ? match[2].length : 3; // Preserve number length
  
  return `${prefix}${String(nextNumber).padStart(numberLength, '0')}`;
}

// ==================== Family Functions ====================

async function getAllFamilies() {
  await db.read();
  return db.data.families || [];
}

async function getFamilyById(id) {
  await db.read();
  return db.data.families.find(family => family.id === id);
}

async function getFamiliesByArea(areaId) {
  await db.read();
  return db.data.families.filter(family => family.areaId === areaId);
}

async function getNextFamilyNumber(areaId) {
  await db.read();
  const areaFamilies = db.data.families.filter(family => family.areaId === areaId);

  if (areaFamilies.length === 0) {
    return '001';
  }

  const numbers = areaFamilies
    .map(family => parseInt(family.familyNumber))
    .filter(num => !isNaN(num));

  const maxNumber = Math.max(...numbers, 0);
  const nextNumber = maxNumber + 1;

  return String(nextNumber).padStart(3, '0');
}

async function getNextLayoutNumber(areaId) {
  await db.read();
  const areaFamilies = db.data.families.filter(family => family.areaId === areaId);

  if (areaFamilies.length === 0) {
    return '001';
  }

  const numbers = areaFamilies
    .map(family => parseInt(family.layoutNumber))
    .filter(num => !isNaN(num));

  const maxNumber = Math.max(...numbers, 0);
  const nextNumber = maxNumber + 1;

  return String(nextNumber).padStart(3, '0');
}

async function getFamilyByAreaAndNumber(areaId, familyNumber) {
  await db.read();
  return db.data.families.find(
    family => family.areaId === areaId && family.familyNumber === familyNumber
  );
}

async function getFamilyByAreaAndLayoutNumber(areaId, layoutNumber) {
  await db.read();
  return db.data.families.find(
    family => family.areaId === areaId && family.layoutNumber === layoutNumber
  );
}

async function createFamily(familyData) {
  await db.read();

  // Validate required fields
  if (!familyData.familyName || !familyData.familyPhone) {
    throw new Error('Family name and phone are required');
  }

  // Auto-generate family number if not provided
  if (!familyData.familyNumber) {
    familyData.familyNumber = await getNextFamilyNumber(familyData.areaId);
  } else {
    // Validate family number format (3 digits)
    if (!/^\d{3}$/.test(familyData.familyNumber)) {
      throw new Error('Family number must be exactly 3 digits');
    }
    // Check for duplicate family number
    const existing = await getFamilyByAreaAndNumber(familyData.areaId, familyData.familyNumber);
    if (existing) {
      throw new Error('Family number already exists in this area');
    }
  }

  // Auto-generate layout number if not provided
  if (!familyData.layoutNumber) {
    familyData.layoutNumber = await getNextLayoutNumber(familyData.areaId);
  } else {
    // Validate layout number format (3 digits)
    if (!/^\d{3}$/.test(familyData.layoutNumber)) {
      throw new Error('Layout number must be exactly 3 digits');
    }
    // Check for duplicate layout number
    const existing = await getFamilyByAreaAndLayoutNumber(familyData.areaId, familyData.layoutNumber);
    if (existing) {
      throw new Error('Layout number already exists in this area');
    }
  }

  const newFamily = {
    id: Date.now(),
    ...familyData,
    createdAt: new Date().toISOString()
  };

  db.data.families.push(newFamily);
  await db.write();

  // Automatically create the family head as the first member
  const nextMemberId = await getNextMemberId();
  const familyHeadMember = {
    id: db.data.members.length + 1,
    familyId: newFamily.id,
    memberNumber: '01',
    memberId: nextMemberId,
    name: familyData.familyName,
    respect: familyData.respect || 'Mr',
    relation: 'Head',
    sex: 'Male',
    dob: null,
    isAlive: true,
    isMarried: false,
    isBaptised: true,
    isConfirmed: true,
    congregationParticipation: false,
    occupation: '',
    workingPlace: '',
    education: '',
    spouseId: null,
    dateOfMarriage: null,
    createdAt: new Date().toISOString()
  };

  db.data.members.push(familyHeadMember);
  await db.write();

  return newFamily;
}

async function updateFamily(id, updates) {
  await db.read();

  const index = db.data.families.findIndex(family => family.id === id);
  if (index === -1) return null;

  const family = db.data.families[index];

  // If updating family number, validate it
  if (updates.familyNumber && updates.familyNumber !== family.familyNumber) {
    if (!/^\d{3}$/.test(updates.familyNumber)) {
      throw new Error('Family number must be exactly 3 digits');
    }
    const existing = await getFamilyByAreaAndNumber(family.areaId, updates.familyNumber);
    if (existing && existing.id !== id) {
      throw new Error('Family number already exists in this area');
    }
  }

  // If updating layout number, validate it
  if (updates.layoutNumber && updates.layoutNumber !== family.layoutNumber) {
    if (!/^\d{3}$/.test(updates.layoutNumber)) {
      throw new Error('Layout number must be exactly 3 digits');
    }
    const existing = await getFamilyByAreaAndLayoutNumber(family.areaId, updates.layoutNumber);
    if (existing && existing.id !== id) {
      throw new Error('Layout number already exists in this area');
    }
  }

  db.data.families[index] = {
    ...family,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await db.write();
  return db.data.families[index];
}

async function deleteFamily(id) {
  await db.read();

  const index = db.data.families.findIndex(family => family.id === id);
  if (index === -1) return false;

  // Delete all members associated with this family
  db.data.members = db.data.members.filter(member => member.familyId !== id);

  db.data.families.splice(index, 1);
  await db.write();

  return true;
}

// ==================== Member Functions ====================

async function getAllMembers() {
  await db.read();
  return db.data.members || [];
}

async function getMemberById(id) {
  await db.read();
  return db.data.members.find(member => member.id === id);
}

async function getMembersByFamily(familyId) {
  await db.read();
  return db.data.members.filter(member => member.familyId === familyId);
}

async function getNextMemberNumber(familyId) {
  await db.read();
  const familyMembers = db.data.members.filter(member => member.familyId === familyId);

  if (familyMembers.length === 0) {
    return '01';
  }

  const numbers = familyMembers
    .map(member => parseInt(member.memberNumber))
    .filter(num => !isNaN(num));

  const maxNumber = Math.max(...numbers, 0);
  const nextNumber = maxNumber + 1;

  return String(nextNumber).padStart(2, '0');
}

async function getNextMemberId() {
  await db.read();

  if (db.data.members.length === 0) {
    return '01';
  }

  const numbers = db.data.members
    .map(member => {
      const num = parseInt(member.memberId);
      return isNaN(num) ? 0 : num;
    })
    .filter(num => !isNaN(num));

  const maxNumber = Math.max(...numbers, 0);
  const nextNumber = maxNumber + 1;

  return String(nextNumber).padStart(2, '0');
}

async function getMemberByFamilyAndNumber(familyId, memberNumber) {
  await db.read();
  return db.data.members.find(
    member => member.familyId === familyId && member.memberNumber === memberNumber
  );
}

function calculateAge(dob) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

async function createMember(memberData) {
  await db.read();

  // Validate required fields
  if (!memberData.name || !memberData.relation || !memberData.sex) {
    throw new Error('Name, relation, and sex are required');
  }

  // Auto-generate member number if not provided
  if (!memberData.memberNumber) {
    memberData.memberNumber = await getNextMemberNumber(memberData.familyId);
  } else {
    // Validate member number format (2 digits)
    if (!/^\d{2}$/.test(memberData.memberNumber)) {
      throw new Error('Member number must be exactly 2 digits');
    }
    // Check for duplicate member number
    const existing = await getMemberByFamilyAndNumber(memberData.familyId, memberData.memberNumber);
    if (existing) {
      throw new Error('Member number already exists in this family');
    }
  }

  // Auto-generate member ID
  memberData.memberId = await getNextMemberId();

  // Calculate age from DOB
  if (memberData.dob) {
    memberData.age = calculateAge(memberData.dob);
  }

  // Set default values
  if (memberData.isAlive === undefined) memberData.isAlive = true;
  if (memberData.isMarried === undefined) memberData.isMarried = false;
  if (memberData.isBaptised === undefined) memberData.isBaptised = false;
  if (memberData.isConfirmed === undefined) memberData.isConfirmed = false;
  if (memberData.congregationParticipation === undefined) memberData.congregationParticipation = false;

  const newMember = {
    id: Date.now(),
    ...memberData,
    createdAt: new Date().toISOString()
  };

  db.data.members.push(newMember);

  // If spouse is selected, update spouse's spouseId
  if (memberData.spouseId) {
    const spouseIndex = db.data.members.findIndex(m => m.id === memberData.spouseId);
    if (spouseIndex !== -1) {
      db.data.members[spouseIndex].spouseId = newMember.id;
      db.data.members[spouseIndex].isMarried = true;
      if (memberData.dateOfMarriage) {
        db.data.members[spouseIndex].dateOfMarriage = memberData.dateOfMarriage;
      }
    }
  }

  await db.write();

  return newMember;
}

async function updateMember(id, updates) {
  await db.read();

  const index = db.data.members.findIndex(member => member.id === id);
  if (index === -1) return null;

  const member = db.data.members[index];
  const oldSpouseId = member.spouseId;

  // If updating member number, validate it
  if (updates.memberNumber && updates.memberNumber !== member.memberNumber) {
    if (!/^\d{2}$/.test(updates.memberNumber)) {
      throw new Error('Member number must be exactly 2 digits');
    }
    const existing = await getMemberByFamilyAndNumber(member.familyId, updates.memberNumber);
    if (existing && existing.id !== id) {
      throw new Error('Member number already exists in this family');
    }
  }

  // Calculate age from DOB if DOB is updated
  if (updates.dob) {
    updates.age = calculateAge(updates.dob);
  }

  db.data.members[index] = {
    ...member,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Handle spouse synchronization
  const newSpouseId = updates.spouseId !== undefined ? updates.spouseId : member.spouseId;

  // If spouse changed, update old spouse
  if (oldSpouseId && oldSpouseId !== newSpouseId) {
    const oldSpouseIndex = db.data.members.findIndex(m => m.id === oldSpouseId);
    if (oldSpouseIndex !== -1) {
      db.data.members[oldSpouseIndex].spouseId = null;
      db.data.members[oldSpouseIndex].isMarried = false;
      db.data.members[oldSpouseIndex].dateOfMarriage = null;
    }
  }

  // If new spouse selected, update new spouse
  if (newSpouseId && newSpouseId !== oldSpouseId) {
    const newSpouseIndex = db.data.members.findIndex(m => m.id === newSpouseId);
    if (newSpouseIndex !== -1) {
      db.data.members[newSpouseIndex].spouseId = id;
      db.data.members[newSpouseIndex].isMarried = true;
      if (updates.dateOfMarriage) {
        db.data.members[newSpouseIndex].dateOfMarriage = updates.dateOfMarriage;
      }
    }
  }

  await db.write();
  return db.data.members[index];
}

async function deleteMember(id) {
  await db.read();

  const index = db.data.members.findIndex(member => member.id === id);
  if (index === -1) return false;

  const member = db.data.members[index];

  // If member has a spouse, remove spouse connection
  if (member.spouseId) {
    const spouseIndex = db.data.members.findIndex(m => m.id === member.spouseId);
    if (spouseIndex !== -1) {
      db.data.members[spouseIndex].spouseId = null;
      db.data.members[spouseIndex].isMarried = false;
      db.data.members[spouseIndex].dateOfMarriage = null;
    }
  }

  db.data.members.splice(index, 1);
  await db.write();

  return true;
}

// Get birthdays by date range (DD-MM format)
async function getBirthdaysByDateRange(churchId, fromDate, toDate) {
  await db.read();

  // Parse DD-MM format dates
  const parseDate = (dateStr) => {
    const [day, month] = dateStr.split('-').map(num => parseInt(num));
    return { day, month };
  };

  const from = parseDate(fromDate);
  const to = parseDate(toDate);

  // Get all members with DOB
  const allMembers = db.data.members.filter(m => m.dob && m.isAlive);

  // Filter members by church through family -> area -> church relationship
  const churchMembers = [];

  for (const member of allMembers) {
    const family = db.data.families.find(f => f.id === member.familyId);
    if (!family) continue;

    const area = db.data.areas.find(a => a.id === family.areaId);
    if (!area || area.churchId !== churchId) continue;

    // Parse member's DOB
    const dob = new Date(member.dob);
    const memberDay = dob.getDate();
    const memberMonth = dob.getMonth() + 1; // JavaScript months are 0-indexed

    // Check if birthday falls within range
    let inRange = false;

    if (from.month === to.month) {
      // Same month
      inRange = memberMonth === from.month && memberDay >= from.day && memberDay <= to.day;
    } else if (from.month < to.month) {
      // Range within same year
      inRange = (memberMonth === from.month && memberDay >= from.day) ||
                (memberMonth === to.month && memberDay <= to.day) ||
                (memberMonth > from.month && memberMonth < to.month);
    } else {
      // Range crosses year boundary (e.g., Dec to Jan)
      inRange = (memberMonth === from.month && memberDay >= from.day) ||
                (memberMonth === to.month && memberDay <= to.day) ||
                (memberMonth > from.month || memberMonth < to.month);
    }

    if (inRange) {
      churchMembers.push({
        ...member,
        familyName: family.familyName,
        familyNumber: family.familyNumber,
        familyPhone: family.familyPhone,
        areaName: area.areaName,
        areaId: area.areaId
      });
    }
  }

  // Sort by month and day
  churchMembers.sort((a, b) => {
    const dobA = new Date(a.dob);
    const dobB = new Date(b.dob);
    const monthA = dobA.getMonth();
    const monthB = dobB.getMonth();
    const dayA = dobA.getDate();
    const dayB = dobB.getDate();

    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });

  return churchMembers;
}

// Get birthday report data grouped by family
async function getBirthdayReportData(churchId, fromDate, toDate) {
  await db.read();

  // Get birthday members
  const birthdayMembers = await getBirthdaysByDateRange(churchId, fromDate, toDate);

  // Group by family
  const familiesMap = {};

  for (const member of birthdayMembers) {
    if (!familiesMap[member.familyId]) {
      const family = db.data.families.find(f => f.id === member.familyId);
      if (!family) continue;

      const area = db.data.areas.find(a => a.id === family.areaId);

      familiesMap[member.familyId] = {
        family: {
          id: family.id,
          family_number: family.familyNumber,
          family_phone: family.familyPhone,
          family_name: family.familyName,
          family_address: family.familyAddress,
          respect: family.respect,
          prayer_points: family.prayerPoints,
          area_name: area ? area.areaName : 'N/A'
        },
        members: [],
        celebrants: []
      };
    }

    familiesMap[member.familyId].celebrants.push(member);
  }

  // Get all family members for each family
  for (const familyId in familiesMap) {
    const allMembers = await getMembersByFamily(parseInt(familyId));
    familiesMap[familyId].members = allMembers.filter(m => m.isAlive);
  }

  // Convert to array
  return Object.values(familiesMap);
}

// Get weddings by date range (DD-MM format)
async function getWeddingsByDateRange(churchId, fromDate, toDate) {
  await db.read();

  // Parse DD-MM format dates
  const parseDate = (dateStr) => {
    const [day, month] = dateStr.split('-').map(num => parseInt(num));
    return { day, month };
  };

  const from = parseDate(fromDate);
  const to = parseDate(toDate);

  // Get all married members with dateOfMarriage
  const allMembers = db.data.members.filter(m => m.dateOfMarriage && m.isMarried && m.isAlive);

  // Filter members by church through family -> area -> church relationship
  const churchMembers = [];
  const processedCouples = new Set(); // Track processed couples to avoid duplicates

  for (const member of allMembers) {
    const family = db.data.families.find(f => f.id === member.familyId);
    if (!family) continue;

    const area = db.data.areas.find(a => a.id === family.areaId);
    if (!area || area.churchId !== churchId) continue;

    // Parse member's marriage date
    const marriageDate = new Date(member.dateOfMarriage);
    const memberDay = marriageDate.getDate();
    const memberMonth = marriageDate.getMonth() + 1; // JavaScript months are 0-indexed

    // Check if anniversary falls within range
    let inRange = false;

    if (from.month === to.month) {
      // Same month
      inRange = memberMonth === from.month && memberDay >= from.day && memberDay <= to.day;
    } else if (from.month < to.month) {
      // Range within same year
      inRange = (memberMonth === from.month && memberDay >= from.day) ||
                (memberMonth === to.month && memberDay <= to.day) ||
                (memberMonth > from.month && memberMonth < to.month);
    } else {
      // Range crosses year boundary (e.g., Dec to Jan)
      inRange = (memberMonth === from.month && memberDay >= from.day) ||
                (memberMonth === to.month && memberDay <= to.day) ||
                (memberMonth > from.month || memberMonth < to.month);
    }

    if (inRange) {
      // Create a unique key for the couple based on family and marriage date
      const coupleKey = `${member.familyId}_${member.dateOfMarriage}`;

      // Skip if we've already processed this couple
      if (processedCouples.has(coupleKey)) {
        continue;
      }

      // Mark this couple as processed
      processedCouples.add(coupleKey);

      churchMembers.push({
        ...member,
        familyName: family.familyName,
        familyNumber: family.familyNumber,
        familyPhone: family.familyPhone,
        areaName: area.areaName,
        areaId: area.areaId
      });
    }
  }

  // Sort by month and day
  churchMembers.sort((a, b) => {
    const dateA = new Date(a.dateOfMarriage);
    const dateB = new Date(b.dateOfMarriage);
    const monthA = dateA.getMonth();
    const monthB = dateB.getMonth();
    const dayA = dateA.getDate();
    const dayB = dateB.getDate();

    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });

  return churchMembers;
}

// Get wedding report data grouped by family
async function getWeddingReportData(churchId, fromDate, toDate) {
  await db.read();

  // Get wedding members
  const weddingMembers = await getWeddingsByDateRange(churchId, fromDate, toDate);

  // Group by family
  const familiesMap = {};

  for (const member of weddingMembers) {
    if (!familiesMap[member.familyId]) {
      const family = db.data.families.find(f => f.id === member.familyId);
      if (!family) continue;

      const area = db.data.areas.find(a => a.id === family.areaId);

      familiesMap[member.familyId] = {
        family: {
          id: family.id,
          family_number: family.familyNumber,
          family_phone: family.familyPhone,
          family_name: family.familyName,
          family_address: family.familyAddress,
          respect: family.respect,
          prayer_points: family.prayerPoints,
          area_name: area ? area.areaName : 'N/A'
        },
        members: [],
        celebrants: []
      };
    }

    familiesMap[member.familyId].celebrants.push(member);
  }

  // Get all family members for each family
  for (const familyId in familiesMap) {
    const allMembers = await getMembersByFamily(parseInt(familyId));
    familiesMap[familyId].members = allMembers.filter(m => m.isAlive);
  }

  // Convert to array
  return Object.values(familiesMap);
}



// ==================== Remember Me Token Functions ====================

async function createRememberToken(userId, username) {
  await db.read();
  
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
  
  const newToken = {
    id: Date.now(),
    userId,
    username,
    token,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  };
  
  db.data.rememberTokens.push(newToken);
  await db.write();
  
  return token;
}

async function validateRememberToken(token) {
  await db.read();
  
  const tokenData = db.data.rememberTokens.find(t => t.token === token);
  
  if (!tokenData) {
    return null;
  }
  
  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(tokenData.expiresAt);
  
  if (now > expiresAt) {
    // Token expired, remove it
    await deleteRememberToken(token);
    return null;
  }
  
  return {
    userId: tokenData.userId,
    username: tokenData.username
  };
}

async function deleteRememberToken(token) {
  await db.read();
  
  const initialLength = db.data.rememberTokens.length;
  db.data.rememberTokens = db.data.rememberTokens.filter(t => t.token !== token);
  
  if (db.data.rememberTokens.length < initialLength) {
    await db.write();
    return true;
  }
  return false;
}

async function deleteUserRememberTokens(userId) {
  await db.read();
  
  const initialLength = db.data.rememberTokens.length;
  db.data.rememberTokens = db.data.rememberTokens.filter(t => t.userId !== userId);
  
  if (db.data.rememberTokens.length < initialLength) {
    await db.write();
    return true;
  }
  return false;
}

async function cleanupExpiredTokens() {
  await db.read();
  
  const now = new Date();
  const initialLength = db.data.rememberTokens.length;
  
  db.data.rememberTokens = db.data.rememberTokens.filter(t => {
    const expiresAt = new Date(t.expiresAt);
    return now <= expiresAt;
  });
  
  if (db.data.rememberTokens.length < initialLength) {
    await db.write();
    return true;
  }
  return false;
}

// ==================== Google Drive Sync Functions ====================

async function saveGoogleCredentials(credentials) {
  await db.read();
  db.data.googleCredentials = {
    ...credentials,
    updatedAt: new Date().toISOString()
  };
  await db.write();
  return true;
}

async function getGoogleCredentials() {
  await db.read();
  return db.data.googleCredentials || null;
}

async function deleteGoogleCredentials() {
  await db.read();
  db.data.googleCredentials = null;
  await db.write();
  return true;
}
