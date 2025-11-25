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
