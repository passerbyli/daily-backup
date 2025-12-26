const { app, BrowserWindow ,ipcMain} = require('electron');
const { initLogger } = require('./electron/logger');
const log = initLogger({ level: 'info' });
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 让 electron-updater 也写进同一份日志
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

console.log(path.join(app.getPath('userData'), 'logs'));
ipcMain.handle('log:openDir', () => {
  const dir = path.join(app.getPath('userData'), 'logs');
  shell.openPath(dir);
  return true;
});

// renderer 写日志入口（contextIsolation 下必须走 IPC）
ipcMain.handle('log:write', (_e, payload) => {
  try {
    const { level = 'info', message = '', meta } = payload || {};
    const fn = log[level] || log.info;
    if (meta !== undefined) fn.call(log, message, meta);
    else fn.call(log, message);
    return true;
  } catch (err) {
    log.error('[log:write] failed', { message: err?.message, stack: err?.stack });
    return false;
  }
});
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  if (isDev) {
    win.loadURL('http://localhost:5173'); // Vite 默认端口
  } else {
    win.loadFile(path.join(__dirname, '/pages/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();
});
