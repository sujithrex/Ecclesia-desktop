const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let updateCheckInProgress = false;

function setupAutoUpdater(mainWindow) {
  // Check for updates on app start (after 3 seconds)
  setTimeout(() => {
    checkForUpdates(mainWindow, false);
  }, 3000);

  // Check for updates every 4 hours
  setInterval(() => {
    checkForUpdates(mainWindow, false);
  }, 4 * 60 * 60 * 1000);

  // Update available
  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download it now?',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
          
          // Show download progress
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Downloading Update',
            message: 'The update is being downloaded in the background.',
            detail: 'You will be notified when it\'s ready to install.',
            buttons: ['OK']
          });
        }
      });
    }
  });

  // Update not available
  autoUpdater.on('update-not-available', () => {
    updateCheckInProgress = false;
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail: 'The application will restart to install the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
    }
  });

  // Error handling
  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    updateCheckInProgress = false;
  });
}

function checkForUpdates(mainWindow, showNoUpdateDialog = true) {
  if (updateCheckInProgress) {
    return;
  }

  updateCheckInProgress = true;

  autoUpdater.checkForUpdates().then((result) => {
    if (!result || !result.updateInfo) {
      updateCheckInProgress = false;
      if (showNoUpdateDialog && mainWindow && !mainWindow.isDestroyed()) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'No Updates',
          message: 'You are running the latest version.',
          buttons: ['OK']
        });
      }
    }
  }).catch((error) => {
    console.error('Update check failed:', error);
    updateCheckInProgress = false;
    if (showNoUpdateDialog && mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Update Check Failed',
        message: 'Failed to check for updates.',
        detail: error.message,
        buttons: ['OK']
      });
    }
  });
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates
};
