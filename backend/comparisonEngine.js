// Comparison Engine for Database Sync
// Provides field-level comparison between local and cloud databases

/**
 * Compare two database objects and return detailed differences
 * @param {Object} localData - Local database data
 * @param {Object} cloudData - Cloud database data
 * @returns {Object} Detailed comparison report
 */
function compareData(localData, cloudData) {
  const comparison = {
    metadata: compareMetadata(localData.metadata, cloudData.metadata),
    churches: compareArray(localData.churches || [], cloudData.churches || [], 'churches'),
    areas: compareArray(localData.areas || [], cloudData.areas || [], 'areas'),
    families: compareArray(localData.families || [], cloudData.families || [], 'families'),
    members: compareArray(localData.members || [], cloudData.members || [], 'members'),
    infantBaptismCertificates: compareArray(
      localData.infantBaptismCertificates || [], 
      cloudData.infantBaptismCertificates || [], 
      'infantBaptismCertificates'
    ),
    adultBaptismCertificates: compareArray(
      localData.adultBaptismCertificates || [], 
      cloudData.adultBaptismCertificates || [], 
      'adultBaptismCertificates'
    ),
    burialRegisters: compareArray(
      localData.burialRegisters || [], 
      cloudData.burialRegisters || [], 
      'burialRegisters'
    ),
    marriageRecords: compareArray(
      localData.marriageRecords || [], 
      cloudData.marriageRecords || [], 
      'marriageRecords'
    ),
    marriageBans: compareArray(
      localData.marriageBans || [], 
      cloudData.marriageBans || [], 
      'marriageBans'
    ),
    letterheads: compareArray(
      localData.letterheads || [], 
      cloudData.letterheads || [], 
      'letterheads'
    )
  };

  // Calculate summary
  comparison.summary = generateSummary(comparison);
  
  return comparison;
}

/**
 * Compare metadata objects
 */
function compareMetadata(local, cloud) {
  return {
    local: local || { windowsVersion: 0, androidVersion: 0 },
    cloud: cloud || { windowsVersion: 0, androidVersion: 0 },
    hasConflict: detectVersionConflict(local, cloud)
  };
}

/**
 * Detect if there's a version conflict
 */
function detectVersionConflict(local, cloud) {
  if (!local || !cloud) return false;
  
  // Conflict if both platforms have changes
  const localWinNewer = local.windowsVersion > cloud.windowsVersion;
  const cloudWinNewer = cloud.windowsVersion > local.windowsVersion;
  const localAndroidNewer = local.androidVersion > cloud.androidVersion;
  const cloudAndroidNewer = cloud.androidVersion > local.androidVersion;
  
  return (localWinNewer && cloudAndroidNewer) || (cloudWinNewer && localAndroidNewer);
}

/**
 * Compare two arrays of objects
 */
function compareArray(localArray, cloudArray, collectionName) {
  const localMap = new Map(localArray.map(item => [item.id, item]));
  const cloudMap = new Map(cloudArray.map(item => [item.id, item]));
  
  const added = [];
  const removed = [];
  const modified = [];
  const unchanged = [];
  
  // Find added and modified items
  cloudMap.forEach((cloudItem, id) => {
    const localItem = localMap.get(id);
    
    if (!localItem) {
      added.push({
        id: cloudItem.id,
        item: cloudItem,
        displayName: getDisplayName(cloudItem, collectionName)
      });
    } else {
      const changes = compareObjects(localItem, cloudItem);
      if (changes.length > 0) {
        modified.push({
          id: cloudItem.id,
          item: cloudItem,
          displayName: getDisplayName(cloudItem, collectionName),
          changes: changes
        });
      } else {
        unchanged.push({
          id: cloudItem.id,
          displayName: getDisplayName(cloudItem, collectionName)
        });
      }
    }
  });
  
  // Find removed items
  localMap.forEach((localItem, id) => {
    if (!cloudMap.has(id)) {
      removed.push({
        id: localItem.id,
        item: localItem,
        displayName: getDisplayName(localItem, collectionName)
      });
    }
  });
  
  return {
    added,
    removed,
    modified,
    unchanged,
    counts: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      unchanged: unchanged.length,
      total: cloudArray.length
    }
  };
}

/**
 * Compare two objects field by field
 */
function compareObjects(localObj, cloudObj) {
  const changes = [];
  const allKeys = new Set([...Object.keys(localObj), ...Object.keys(cloudObj)]);
  
  // Skip system fields
  const skipFields = ['createdAt', 'updatedAt', 'created_at', 'updated_at'];
  
  allKeys.forEach(key => {
    if (skipFields.includes(key)) return;
    
    const localValue = localObj[key];
    const cloudValue = cloudObj[key];
    
    if (JSON.stringify(localValue) !== JSON.stringify(cloudValue)) {
      changes.push({
        field: key,
        fieldLabel: formatFieldName(key),
        oldValue: localValue,
        newValue: cloudValue,
        displayOld: formatValue(localValue),
        displayNew: formatValue(cloudValue)
      });
    }
  });
  
  return changes;
}

/**
 * Get display name for an item
 */
function getDisplayName(item, collectionName) {
  switch (collectionName) {
    case 'churches':
      return item.churchName || item.name || `Church #${item.id}`;
    case 'areas':
      return item.areaName || `Area #${item.id}`;
    case 'families':
      return item.familyName || `Family #${item.id}`;
    case 'members':
      return item.memberName || item.name || `Member #${item.id}`;
    case 'infantBaptismCertificates':
      return item.childName || `Infant Baptism #${item.id}`;
    case 'adultBaptismCertificates':
      return item.candidateName || `Adult Baptism #${item.id}`;
    case 'burialRegisters':
      return item.deceasedName || `Burial #${item.id}`;
    case 'marriageRecords':
      return `${item.groomName || 'Groom'} & ${item.brideName || 'Bride'}`;
    case 'marriageBans':
      return `Marriage Bans #${item.id}`;
    case 'letterheads':
      return item.letterhead_number || `Letterhead #${item.id}`;
    default:
      return `Item #${item.id}`;
  }
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format value for display
 */
function formatValue(value) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && value.length > 50) return value.substring(0, 47) + '...';
  return String(value);
}

/**
 * Generate summary of all changes
 */
function generateSummary(comparison) {
  const summary = {
    totalChanges: 0,
    byCategory: {}
  };
  
  const categories = [
    'churches', 'areas', 'families', 'members',
    'infantBaptismCertificates', 'adultBaptismCertificates',
    'burialRegisters', 'marriageRecords', 'marriageBans', 'letterheads'
  ];
  
  categories.forEach(category => {
    const data = comparison[category];
    if (data && data.counts) {
      const changes = data.counts.added + data.counts.removed + data.counts.modified;
      summary.byCategory[category] = {
        label: formatCategoryName(category),
        added: data.counts.added,
        removed: data.counts.removed,
        modified: data.counts.modified,
        unchanged: data.counts.unchanged,
        total: data.counts.total,
        hasChanges: changes > 0
      };
      summary.totalChanges += changes;
    }
  });
  
  return summary;
}

/**
 * Format category name for display
 */
function formatCategoryName(category) {
  const labels = {
    churches: 'Churches',
    areas: 'Areas',
    families: 'Families',
    members: 'Members',
    infantBaptismCertificates: 'Infant Baptism Certificates',
    adultBaptismCertificates: 'Adult Baptism Certificates',
    burialRegisters: 'Burial Registers',
    marriageRecords: 'Marriage Records',
    marriageBans: 'Marriage Bans',
    letterheads: 'Letterheads'
  };
  return labels[category] || category;
}

module.exports = {
  compareData,
  compareMetadata,
  detectVersionConflict,
  compareArray,
  compareObjects,
  getDisplayName,
  formatFieldName,
  formatValue,
  generateSummary
};
