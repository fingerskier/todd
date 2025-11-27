import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import * as db from './services/database.js';
import { applyPendingMigrations, getMigrationStatus } from './services/migrations.js';
import Store from 'electron-store';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const store = new Store();

const DEFAULT_BOUNDS = {
  width: 800,
  height: 600,
};

const getWindowBounds = () => {
  const primaryDisplay = screen.getPrimaryDisplay().workArea;

  const width = Math.min(store.get('todd:windowWidth') ?? DEFAULT_BOUNDS.width, primaryDisplay.width);
  const height = Math.min(store.get('todd:windowHeight') ?? DEFAULT_BOUNDS.height, primaryDisplay.height);

  const centerX = primaryDisplay.x + (primaryDisplay.width - width) / 2;
  const centerY = primaryDisplay.y + (primaryDisplay.height - height) / 2;

  let x = store.get('todd:windowX');
  let y = store.get('todd:windowY');

  const withinHorizontal = typeof x === 'number' && x >= primaryDisplay.x && x + width <= primaryDisplay.x + primaryDisplay.width;
  const withinVertical = typeof y === 'number' && y >= primaryDisplay.y && y + height <= primaryDisplay.y + primaryDisplay.height;

  if (!withinHorizontal) {
    x = centerX;
  }

  if (!withinVertical) {
    y = centerY;
  }

  return {
    width,
    height,
    x,
    y,
  };
};

const setAppMenu = (mainWindow) => {
  const navigateTo = (path) => {
    mainWindow.webContents.send('navigate', path);
  };

  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          click: () => navigateTo('/dashboard'),
        },
        {
          label: 'Settings',
          click: () => navigateTo('/settings'),
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const createWindow = () => {
  const initialBounds = getWindowBounds();

  const mainWindow = new BrowserWindow({
    ...initialBounds,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const saveBounds = () => {
    const { x, y, width, height } = mainWindow.getBounds();
    store.set('todd:windowX', x);
    store.set('todd:windowY', y);
    store.set('todd:windowWidth', width);
    store.set('todd:windowHeight', height);
  };

  mainWindow.on('move', saveBounds);
  mainWindow.on('resize', saveBounds);
  mainWindow.on('close', saveBounds);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  setAppMenu(mainWindow);

  const shouldOpenDevTools =
    process.env.OPEN_DEVTOOLS === 'true' || process.env.NODE_ENV === 'development';

  if (shouldOpenDevTools) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Database IPC handlers
ipcMain.handle('db:connect', async (event, config) => {
  return await db.connect(config);
});

ipcMain.handle('db:disconnect', async () => {
  return await db.disconnect();
});

ipcMain.handle('db:query', async (event, text, params) => {
  return await db.query(text, params);
});

ipcMain.handle('db:testConnection', async (event, config) => {
  return await db.testConnection(config);
});

ipcMain.handle('db:isConnected', () => {
  return db.isConnected();
});

// Migration IPC handlers
ipcMain.handle('db:migrations:status', async () => {
  return await getMigrationStatus();
});

ipcMain.handle('db:migrations:apply', async () => {
  return await applyPendingMigrations();
});
