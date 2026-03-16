import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIPC } from './ipc';
import { configStore } from '../services/ConfigStore';
import { Logger } from '../utils/Logger';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup IPC handlers
  if (mainWindow) {
    setupIPC(mainWindow);
  }
}

app.whenReady().then(() => {
  // Load existing configurations
  configStore.load();
  Logger.info('App ready');
  
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

app.on('before-quit', () => {
  Logger.info('App quitting');
  // Cleanup will happen automatically via Node.js GC
});
