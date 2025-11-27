const { dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const {
  getChurchById,
  getAreasByChurch,
  getAllFamilies,
  getAllMembers
} = require('./database');

/**
 * Create congregation backup CSV
 */
async function createCongregationBackup(churchId) {
  try {
    // Get church data
    const church = await getChurchById(churchId);
    if (!church) {
      return { success: false, message: 'Church not found' };
    }

    // Get all areas for this church
    const areas = await getAreasByChurch(churchId);
    
    // Get all families
    const allFamilies = await getAllFamilies();
    
    // Get all members
    const allMembers = await getAllMembers();

    // Build the data structure
    const backupData = [];

    for (const area of areas) {
      // Get families in this area
      const areaFamilies = allFamilies.filter(f => f.areaId === area.id);

      for (const family of areaFamilies) {
        // Get members in this family
        const familyMembers = allMembers.filter(m => m.familyId === family.id);

        for (const member of familyMembers) {
          // Find spouse name if spouseId exists
          let spouseName = '';
          if (member.spouseId) {
            const spouse = familyMembers.find(m => m.id === member.spouseId);
            if (spouse) {
              spouseName = spouse.name;
            }
          }

          backupData.push({
            // Church/Pastorate Info
            pastorateName: church.pastorateName || '',
            pastorateShortName: church.pastorateShortName || '',
            pastorateNameTamil: church.pastorateNameTamil || '',
            churchName: church.churchName || '',
            churchShortName: church.churchShortName || '',
            churchNameTamil: church.churchNameTamil || '',
            
            // Area Info
            areaName: area.areaName || '',
            areaId: area.areaId || '',
            
            // Family Info
            familyRespect: family.respect || '',
            familyName: family.familyName || '',
            familyNumber: family.familyNumber || '',
            layoutNumber: family.layoutNumber || '',
            familyPhone: family.familyPhone || '',
            familyEmail: family.familyEmail || '',
            familyAddress: family.familyAddress || '',
            familyNotes: family.notes || '',
            familyPrayerPoints: family.prayerPoints || '',
            
            // Member Info
            memberNumber: member.memberNumber || '',
            memberId: member.memberId || '',
            memberRespect: member.respect || '',
            memberName: member.name || '',
            relation: member.relation || '',
            sex: member.sex || '',
            dob: member.dob || '',
            age: member.age || '',
            mobile: member.mobile || '',
            aadharNumber: member.aadharNumber || '',
            occupation: member.occupation || '',
            workingPlace: member.workingPlace || '',
            isAlive: member.isAlive !== undefined ? member.isAlive : true,
            isMarried: member.isMarried || false,
            spouseName: spouseName,
            dateOfMarriage: member.dateOfMarriage || '',
            isBaptised: member.isBaptised || false,
            dateOfBaptism: member.dateOfBaptism || '',
            isConfirmed: member.isConfirmed || false,
            dateOfConfirmation: member.dateOfConfirmation || '',
            congregationParticipation: member.congregationParticipation || false,
            memberCreatedAt: member.createdAt || '',
            memberUpdatedAt: member.updatedAt || ''
          });
        }
      }
    }

    if (backupData.length === 0) {
      return { success: false, message: 'No data to backup for this church' };
    }

    // Convert to CSV
    const csv = convertToCSV(backupData);

    // Show save dialog
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const defaultFileName = `congregation_backup_${church.churchShortName || church.churchName}_${timestamp}.csv`;

    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Congregation Backup',
      defaultPath: defaultFileName,
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Backup canceled' };
    }

    // Write CSV file with UTF-8 BOM for proper Tamil character display
    const BOM = '\uFEFF';
    await fs.writeFile(filePath, BOM + csv, 'utf8');

    return {
      success: true,
      message: 'Backup created successfully',
      filePath,
      recordCount: backupData.length
    };

  } catch (error) {
    console.error('Error creating congregation backup:', error);
    return {
      success: false,
      message: error.message || 'Failed to create backup'
    };
  }
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data) {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return escapeCSVValue(value);
    }).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

module.exports = {
  createCongregationBackup
};

/**
 * Select restore file using dialog
 */
async function selectRestoreFile() {
  try {
    console.log('Backend: selectRestoreFile called');
    
    const result = await dialog.showOpenDialog({
      title: 'Select Congregation Backup CSV',
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    console.log('Backend: dialog result:', result);

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      console.log('Backend: File selection was canceled');
      return { success: false, message: 'File selection canceled' };
    }

    const selectedPath = result.filePaths[0];
    const fileName = path.basename(selectedPath);

    console.log('Backend: File selected:', selectedPath);

    return {
      success: true,
      filePath: selectedPath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Backend: Error selecting file:', error);
    return {
      success: false,
      message: error.message || 'Failed to select file'
    };
  }
}

/**
 * Preview congregation restore from CSV
 */
async function previewCongregationRestore(filePath, churchId) {
  try {
    console.log('Preview restore - filePath:', filePath, 'churchId:', churchId);
    
    const {
      getChurchById,
      getAreasByChurch,
      getAllFamilies,
      getAllMembers
    } = require('./database');

    // Read and parse CSV
    const csvContent = await fs.readFile(filePath, 'utf8');
    const rows = parseCSV(csvContent);

    console.log('Parsed rows:', rows.length);

    if (rows.length === 0) {
      return { success: false, message: 'CSV file is empty' };
    }

    // Validate headers
    const requiredHeaders = ['areaName', 'familyName', 'familyNumber', 'memberName', 'memberNumber', 'relation', 'sex'];
    const headers = Object.keys(rows[0]);
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return {
        success: false,
        message: `Missing required columns: ${missingHeaders.join(', ')}`
      };
    }

    // Analyze data
    const areas = new Set();
    const families = new Set();
    const errors = [];
    const warnings = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 because index starts at 0 and row 1 is header

      // Validate required fields
      if (!row.areaName || !row.areaName.trim()) {
        errors.push({ row: rowNum, message: 'Area name is required' });
      }
      if (!row.familyName || !row.familyName.trim()) {
        errors.push({ row: rowNum, message: 'Family name is required' });
      }
      if (!row.familyNumber || !row.familyNumber.trim()) {
        errors.push({ row: rowNum, message: 'Family number is required' });
      }
      if (!row.memberName || !row.memberName.trim()) {
        errors.push({ row: rowNum, message: 'Member name is required' });
      }
      if (!row.memberNumber || !row.memberNumber.trim()) {
        errors.push({ row: rowNum, message: 'Member number is required' });
      }
      if (!row.relation || !row.relation.trim()) {
        errors.push({ row: rowNum, message: 'Relation is required' });
      }
      if (!row.sex || !row.sex.trim()) {
        errors.push({ row: rowNum, message: 'Sex is required' });
      }

      // Validate member number format (2 digits)
      if (row.memberNumber && !/^\d{2}$/.test(row.memberNumber)) {
        errors.push({ row: rowNum, message: 'Member number must be exactly 2 digits' });
      }

      // Validate family number format (3 digits)
      if (row.familyNumber && !/^\d{3}$/.test(row.familyNumber)) {
        errors.push({ row: rowNum, message: 'Family number must be exactly 3 digits' });
      }

      // Check for spouse name without finding spouse
      if (row.spouseName && row.spouseName.trim()) {
        warnings.push({ row: rowNum, message: `Spouse "${row.spouseName}" will be linked if found in same family` });
      }

      // Collect unique areas and families
      if (row.areaName) areas.add(row.areaName);
      if (row.areaName && row.familyNumber) families.add(`${row.areaName}|${row.familyNumber}`);
    });

    return {
      success: true,
      preview: {
        totalRows: rows.length,
        areas: areas.size,
        families: families.size,
        members: rows.length,
        errors: errors,
        warnings: warnings
      }
    };

  } catch (error) {
    console.error('Error previewing restore:', error);
    return {
      success: false,
      message: error.message || 'Failed to preview file'
    };
  }
}

/**
 * Restore congregation from CSV backup
 */
async function restoreCongregationBackup(filePath, churchId, mode) {
  try {
    const {
      getChurchById,
      getAreasByChurch,
      createArea,
      updateArea,
      getAllFamilies,
      createFamily,
      updateFamily,
      getAllMembers,
      createMember,
      updateMember,
      deleteArea
    } = require('./database');

    // Get church
    const church = await getChurchById(churchId);
    if (!church) {
      return { success: false, message: 'Church not found' };
    }

    // If replace mode, delete all existing data
    if (mode === 'replace') {
      const existingAreas = await getAreasByChurch(churchId);
      for (const area of existingAreas) {
        await deleteArea(area.id);
      }
    }

    // Read and parse CSV
    const csvContent = await fs.readFile(filePath, 'utf8');
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      return { success: false, message: 'CSV file is empty' };
    }

    // Get existing data
    const existingAreas = await getAreasByChurch(churchId);
    const allFamilies = await getAllFamilies();
    const allMembers = await getAllMembers();

    // Track statistics
    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0
    };

    // Track created entities for ID mapping
    const areaMap = new Map(); // areaName -> area object
    const familyMap = new Map(); // areaName|familyNumber -> family object
    const memberMap = new Map(); // familyId|memberNumber -> member object
    const spouseLinkQueue = []; // Queue for linking spouses after all members created

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        // Validate required fields
        if (!row.areaName || !row.familyName || !row.familyNumber || !row.memberName || !row.memberNumber || !row.relation || !row.sex) {
          stats.failed++;
          continue;
        }

        // Validate formats
        if (!/^\d{2}$/.test(row.memberNumber) || !/^\d{3}$/.test(row.familyNumber)) {
          stats.failed++;
          continue;
        }

        // 1. Handle Area
        let area = areaMap.get(row.areaName);
        if (!area) {
          // Check if area exists
          area = existingAreas.find(a => a.areaName === row.areaName);
          if (!area) {
            // Create new area
            area = await createArea({
              churchId: churchId,
              areaName: row.areaName,
              areaId: row.areaId || row.areaName.substring(0, 3).toUpperCase()
            });
          }
          areaMap.set(row.areaName, area);
        }

        // 2. Handle Family
        const familyKey = `${row.areaName}|${row.familyNumber}`;
        let family = familyMap.get(familyKey);
        if (!family) {
          // Check if family exists
          family = allFamilies.find(f => f.areaId === area.id && f.familyNumber === row.familyNumber);
          if (family) {
            // Update existing family
            if (mode === 'merge') {
              await updateFamily(family.id, {
                respect: row.familyRespect || family.respect,
                familyName: row.familyName || family.familyName,
                familyPhone: row.familyPhone || family.familyPhone,
                familyEmail: row.familyEmail || family.familyEmail,
                familyAddress: row.familyAddress || family.familyAddress,
                notes: row.familyNotes || family.notes,
                prayerPoints: row.familyPrayerPoints || family.prayerPoints
              });
              stats.updated++;
            }
          } else {
            // Create new family
            family = await createFamily({
              areaId: area.id,
              respect: row.familyRespect || 'Mr',
              familyName: row.familyName,
              familyNumber: row.familyNumber,
              layoutNumber: row.layoutNumber || row.familyNumber,
              familyPhone: row.familyPhone || '',
              familyEmail: row.familyEmail || '',
              familyAddress: row.familyAddress || '',
              notes: row.familyNotes || '',
              prayerPoints: row.familyPrayerPoints || ''
            });
            stats.imported++;
          }
          familyMap.set(familyKey, family);
        }

        // 3. Handle Member
        const memberKey = `${family.id}|${row.memberNumber}`;
        let member = memberMap.get(memberKey);
        if (!member) {
          // Check if member exists
          member = allMembers.find(m => m.familyId === family.id && m.memberNumber === row.memberNumber);
          if (member) {
            // Update existing member
            if (mode === 'merge') {
              await updateMember(member.id, {
                respect: row.memberRespect || member.respect,
                name: row.memberName || member.name,
                relation: row.relation || member.relation,
                sex: row.sex || member.sex,
                dob: row.dob || member.dob,
                mobile: row.mobile || member.mobile,
                aadharNumber: row.aadharNumber || member.aadharNumber,
                occupation: row.occupation || member.occupation,
                workingPlace: row.workingPlace || member.workingPlace,
                isAlive: row.isAlive !== undefined ? parseBool(row.isAlive) : member.isAlive,
                isMarried: row.isMarried !== undefined ? parseBool(row.isMarried) : member.isMarried,
                dateOfMarriage: row.dateOfMarriage || member.dateOfMarriage,
                isBaptised: row.isBaptised !== undefined ? parseBool(row.isBaptised) : member.isBaptised,
                dateOfBaptism: row.dateOfBaptism || member.dateOfBaptism,
                isConfirmed: row.isConfirmed !== undefined ? parseBool(row.isConfirmed) : member.isConfirmed,
                dateOfConfirmation: row.dateOfConfirmation || member.dateOfConfirmation,
                congregationParticipation: row.congregationParticipation !== undefined ? parseBool(row.congregationParticipation) : member.congregationParticipation
              });
              stats.updated++;
            } else {
              stats.skipped++;
            }
          } else {
            // Create new member
            member = await createMember({
              familyId: family.id,
              respect: row.memberRespect || 'Mr',
              name: row.memberName,
              relation: row.relation,
              sex: row.sex,
              memberNumber: row.memberNumber,
              dob: row.dob || '',
              mobile: row.mobile || '',
              aadharNumber: row.aadharNumber || '',
              occupation: row.occupation || '',
              workingPlace: row.workingPlace || '',
              isAlive: row.isAlive !== undefined ? parseBool(row.isAlive) : true,
              isMarried: row.isMarried !== undefined ? parseBool(row.isMarried) : false,
              dateOfMarriage: row.dateOfMarriage || '',
              isBaptised: row.isBaptised !== undefined ? parseBool(row.isBaptised) : false,
              dateOfBaptism: row.dateOfBaptism || '',
              isConfirmed: row.isConfirmed !== undefined ? parseBool(row.isConfirmed) : false,
              dateOfConfirmation: row.dateOfConfirmation || '',
              congregationParticipation: row.congregationParticipation !== undefined ? parseBool(row.congregationParticipation) : false
            });
            stats.imported++;
          }
          memberMap.set(memberKey, member);
        }

        // Queue spouse linking if spouseName exists
        if (row.spouseName && row.spouseName.trim()) {
          spouseLinkQueue.push({
            member: member,
            spouseName: row.spouseName.trim(),
            familyId: family.id
          });
        }

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        stats.failed++;
      }
    }

    // Link spouses
    const updatedAllMembers = await getAllMembers();
    for (const link of spouseLinkQueue) {
      try {
        const spouse = updatedAllMembers.find(m => 
          m.familyId === link.familyId && 
          m.name === link.spouseName &&
          m.id !== link.member.id
        );
        
        if (spouse) {
          await updateMember(link.member.id, { spouseId: spouse.id, isMarried: true });
          await updateMember(spouse.id, { spouseId: link.member.id, isMarried: true });
        }
      } catch (error) {
        console.error('Error linking spouse:', error);
      }
    }

    return {
      success: true,
      message: 'Restore completed successfully',
      stats: stats
    };

  } catch (error) {
    console.error('Error restoring congregation:', error);
    return {
      success: false,
      message: error.message || 'Failed to restore data'
    };
  }
}

/**
 * Parse CSV content to array of objects
 */
function parseCSV(csvContent) {
  // Remove BOM if present
  const content = csvContent.replace(/^\uFEFF/, '');
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim());

  return values;
}

/**
 * Parse boolean value from string
 */
function parseBool(value) {
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  return str === 'true' || str === '1' || str === 'yes';
}

/**
 * Create Full Database Backup
 * Exports the entire auth.json database
 */
async function createFullDatabaseBackup() {
  try {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'auth.json');

    // Check if database exists
    try {
      await fs.access(dbPath);
    } catch (error) {
      return { success: false, message: 'Database file not found' };
    }

    // Read the database file
    const dbContent = await fs.readFile(dbPath, 'utf-8');

    // Show save dialog
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Full Database Backup',
      defaultPath: `ecclesia-full-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Backup canceled' };
    }

    // Write backup file
    await fs.writeFile(filePath, dbContent, 'utf-8');

    return {
      success: true,
      message: 'Full database backup created successfully',
      filePath: filePath
    };
  } catch (error) {
    console.error('Full database backup error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create full database backup'
    };
  }
}

/**
 * Select Full Database Backup File for Restore
 */
async function selectFullDatabaseRestoreFile() {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Select Full Database Backup File',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, message: 'File selection canceled' };
    }

    const filePath = filePaths[0];
    const fileName = path.basename(filePath);

    return {
      success: true,
      filePath: filePath,
      fileName: fileName
    };
  } catch (error) {
    console.error('File selection error:', error);
    return {
      success: false,
      message: error.message || 'Failed to select file'
    };
  }
}

/**
 * Preview Full Database Restore
 * Validates the JSON structure and shows statistics
 */
async function previewFullDatabaseRestore(filePath) {
  try {
    // Read the backup file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse JSON
    let backupData;
    try {
      backupData = JSON.parse(fileContent);
    } catch (error) {
      return {
        success: false,
        message: 'Invalid JSON file format'
      };
    }

    // Validate structure
    const requiredKeys = ['users', 'churches', 'areas', 'families', 'members'];
    const missingKeys = requiredKeys.filter(key => !backupData.hasOwnProperty(key));
    
    if (missingKeys.length > 0) {
      return {
        success: false,
        message: `Invalid database backup. Missing keys: ${missingKeys.join(', ')}`
      };
    }

    // Calculate statistics
    const stats = {
      users: Array.isArray(backupData.users) ? backupData.users.length : 0,
      churches: Array.isArray(backupData.churches) ? backupData.churches.length : 0,
      areas: Array.isArray(backupData.areas) ? backupData.areas.length : 0,
      families: Array.isArray(backupData.families) ? backupData.families.length : 0,
      members: Array.isArray(backupData.members) ? backupData.members.length : 0,
      infantBaptismCertificates: Array.isArray(backupData.infantBaptismCertificates) ? backupData.infantBaptismCertificates.length : 0,
      adultBaptismCertificates: Array.isArray(backupData.adultBaptismCertificates) ? backupData.adultBaptismCertificates.length : 0,
      marriageRecords: Array.isArray(backupData.marriageRecords) ? backupData.marriageRecords.length : 0,
      burialRegisters: Array.isArray(backupData.burialRegisters) ? backupData.burialRegisters.length : 0,
      letterheads: Array.isArray(backupData.letterheads) ? backupData.letterheads.length : 0
    };

    return {
      success: true,
      stats: stats
    };
  } catch (error) {
    console.error('Preview error:', error);
    return {
      success: false,
      message: error.message || 'Failed to preview backup file'
    };
  }
}

/**
 * Restore Full Database
 * Replaces the entire auth.json with the backup
 */
async function restoreFullDatabase(filePath) {
  try {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'auth.json');

    // Read the backup file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Validate JSON
    let backupData;
    try {
      backupData = JSON.parse(fileContent);
    } catch (error) {
      return {
        success: false,
        message: 'Invalid JSON file format'
      };
    }

    // Create backup of current database before replacing
    const backupPath = path.join(userDataPath, `auth-backup-${Date.now()}.json`);
    try {
      const currentDb = await fs.readFile(dbPath, 'utf-8');
      await fs.writeFile(backupPath, currentDb, 'utf-8');
    } catch (error) {
      console.warn('Could not create safety backup:', error);
    }

    // Replace the database file
    await fs.writeFile(dbPath, fileContent, 'utf-8');

    return {
      success: true,
      message: 'Database restored successfully. Please restart the application.',
      backupPath: backupPath
    };
  } catch (error) {
    console.error('Restore error:', error);
    return {
      success: false,
      message: error.message || 'Failed to restore database'
    };
  }
}

module.exports = {
  createCongregationBackup,
  selectRestoreFile,
  previewCongregationRestore,
  restoreCongregationBackup,
  createFullDatabaseBackup,
  selectFullDatabaseRestoreFile,
  previewFullDatabaseRestore,
  restoreFullDatabase
};
