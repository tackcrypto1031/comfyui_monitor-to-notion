import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIPC } from './ipc';
import { configStore } from '../services/ConfigStore';
import { notionClient } from '../services/NotionClient';
import { notionLogger } from '../services/NotionLogger';
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
  
  // Initialize Notion client if configured
  const notionConfig = configStore.getNotionConfig();
  if (notionConfig && notionConfig.token && notionConfig.databaseId) {
    notionClient.init({
      token: notionConfig.token,
      databaseId: notionConfig.databaseId,
    });
    notionLogger.init();
    Logger.info('Notion logger initialized');
  } else {
    Logger.info('Notion not configured, skipping initialization');
  }
  
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
