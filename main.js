const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase } = require('./backend/database');
const {
  login,
  verifyRecoveryPin,
  resetPassword,
  changePassword,
  changeRecoveryPin
} = require('./backend/auth');

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

