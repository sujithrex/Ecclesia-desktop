const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const googleDriveSync = require('./googleDriveSync');
const { getMetadata } = require('./database');

class AutoSyncService {
  constructor() {
    this.syncInterval = null;
    this.fileWatcher = null;
    this.debounceTimer = null;
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.lastCheckTime = null;
    this.driveFileModifiedTime = null;
    this.driveFileId = null;
    this.syncState = 'idle'; // idle, checking, syncing_up, syncing_down, conflict, error
    this.lastError = null;
    this.stateCallbacks = [];
  }

  // Initialize auto-sync
  initialize(mainWindow) {
    this.mainWindow = mainWindow;
    
    // Perform initial sync check immediately
    setTimeout(() => {
      this.performSync();
    }, 5000); // Wait 5 seconds after startup
    
    // Start periodic check (every 3 minutes)
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 3 * 60 * 1000);

    // Watch database file for changes
    this.startFileWatcher();

    console.log('Auto-sync initialized');
  }

  // Stop auto-sync
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    console.log('Auto-sync stopped');
  }

  // Update sync state
  updateState(state, error = null) {
    this.syncState = state;
    this.lastError = error;
    
    // Notify renderer process
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('sync-state-changed', {
        state,
        error,
        lastSyncTime: this.lastSyncTime,
      });
    }

    // Call registered callbacks
    this.stateCallbacks.forEach(callback => callback(state, error));
  }

  // Register state change callback
  onStateChange(callback) {
    this.stateCallbacks.push(callback);
  }

  // Start watching database file
  startFileWatcher() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'auth.json');

    if (!fs.existsSync(dbPath)) {
      console.log('Database file not found, skipping file watcher');
      return;
    }

    try {
      this.fileWatcher = fs.watch(dbPath, (eventType) => {
        if (eventType === 'change') {
          console.log('Database file changed, triggering sync...');
          this.triggerSyncAfterChange();
        }
      });
    } catch (error) {
      console.error('Error starting file watcher:', error);
    }
  }

  // Trigger sync after local changes (with debounce)
  triggerSyncAfterChange() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.performSync();
    }, 30000); // 30 seconds
  }

  // Check if sync is needed
  async checkSyncDirection() {
    try {
      // Get latest file from Drive
      const latestFile = await googleDriveSync.getLatestVersion();
      
      if (!latestFile) {
        // No file on Drive, upload if we have data
        return 'upload';
      }

      const driveModifiedTime = latestFile.createdTime; // Using createdTime as proxy for modified
      
      // Save Drive file info
      this.driveFileId = latestFile.id;
      this.driveFileModifiedTime = driveModifiedTime;

      // Check if Drive file is newer than what we have
      const driveIsNewer = !this.lastSyncTime || 
                           new Date(driveModifiedTime) > new Date(this.lastSyncTime);

      // Check if local file was modified
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'auth.json');
      
      let localModified = false;
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        localModified = !this.lastSyncTime || 
                       stats.mtime > new Date(this.lastSyncTime);
      }

      if (driveIsNewer && localModified) {
        return 'conflict'; // Both changed
      } else if (driveIsNewer) {
        return 'download'; // Drive is newer
      } else if (localModified) {
        return 'upload'; // Local has changes
      }
      
      return 'none'; // No sync needed
    } catch (error) {
      console.error('Error checking sync direction:', error);
      throw error;
    }
  }

  // Perform sync
  async performSync() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    try {
      this.isSyncing = true;
      this.updateState('checking');

      // Check if authenticated
      if (!googleDriveSync.drive) {
        this.updateState('error', 'Not authenticated with Google Drive');
        return false;
      }

      // Determine sync direction
      const direction = await this.checkSyncDirection();
      console.log('Sync direction:', direction);

      let success = false;
      switch (direction) {
        case 'upload':
          success = await this.syncUp();
          break;
        case 'download':
          success = await this.syncDown();
          break;
        case 'conflict':
          this.updateState('conflict');
          // For now, use last-write-wins (download from Drive)
          success = await this.syncDown();
          break;
        case 'none':
          this.updateState('idle');
          this.lastCheckTime = new Date().toISOString();
          success = true;
          break;
        default:
          this.updateState('idle');
          success = true;
      }

      return success;
    } catch (error) {
      console.error('Sync error:', error);
      this.updateState('error', error.message);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync up (upload to Drive)
  async syncUp() {
    try {
      this.updateState('syncing_up');
      
      const metadata = await getMetadata();
      const versionString = `ecclesia_win_V${metadata.windowsVersion}_android_V${metadata.androidVersion}.json`;

      const result = await googleDriveSync.uploadDatabase(versionString);
      
      if (result.success) {
        this.lastSyncTime = new Date().toISOString();
        this.lastCheckTime = this.lastSyncTime;
        this.updateState('idle');
        console.log('Sync up completed');
        return true;
      } else {
        this.updateState('error', 'Upload failed');
        return false;
      }
    } catch (error) {
      this.updateState('error', error.message);
      return false;
    }
  }

  // Sync down (download from Drive)
  async syncDown() {
    try {
      this.updateState('syncing_down');
      
      const latestFile = await googleDriveSync.getLatestVersion();
      if (!latestFile) {
        this.updateState('error', 'No file on Drive');
        return false;
      }

      const result = await googleDriveSync.downloadDatabase(latestFile.id);
      
      if (result.success) {
        // Replace local database with downloaded data
        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron');
        
        const userDataPath = app.getPath('userData');
        const dbPath = path.join(userDataPath, 'auth.json');
        
        // Write the downloaded data to the database file
        fs.writeFileSync(dbPath, JSON.stringify(result.data, null, 2));
        
        this.lastSyncTime = new Date().toISOString();
        this.lastCheckTime = this.lastSyncTime;
        this.driveFileModifiedTime = latestFile.createdTime;
        this.updateState('idle');
        console.log('Sync down completed');
        return true;
      } else {
        this.updateState('error', 'Download failed');
        return false;
      }
    } catch (error) {
      this.updateState('error', error.message);
      return false;
    }
  }

  // Manual sync (immediate)
  async manualSync() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return await this.performSync();
  }

  // Get sync status
  getSyncStatus() {
    return {
      state: this.syncState,
      lastSyncTime: this.lastSyncTime,
      lastCheckTime: this.lastCheckTime,
      lastError: this.lastError,
      isSyncing: this.isSyncing,
    };
  }

  // Get sync status text
  getSyncStatusText() {
    if (!this.lastSyncTime) return 'Never synced';
    
    const diff = Date.now() - new Date(this.lastSyncTime).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  }
}

module.exports = new AutoSyncService();
