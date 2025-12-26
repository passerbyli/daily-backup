const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const { initLogger } = require('./electron/logger');
const log = initLogger({ level: 'info' });
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const http = require('http');
const https = require('https');

// 让 electron-updater 也写进同一份日志
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

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

let win = null;
let progressWin = null;
/****************************** AutoUpdate Start ***********************************************/

const UPDATE_SERVER_BASE = 'http://127.0.0.1:3000'; // 改成你的 Express 服务器 IP

function getFeedURL() {
  if (process.platform === 'win32') return `${UPDATE_SERVER_BASE}/win/`;
  if (process.platform === 'darwin') return `${UPDATE_SERVER_BASE}/mac/`;
  return UPDATE_SERVER_BASE;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function createProgressWindow() {
  if (progressWin && !progressWin.isDestroyed()) return progressWin;

  progressWin = new BrowserWindow({
    width: 420,
    height: 180,
    resizable: false,
    minimizable: false,
    maximizable: false,
    modal: false,
    show: false,
    title: '正在下载更新…',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial; margin:16px;}
  .title{font-size:14px; margin-bottom:10px;}
  .bar{width:100%; height:12px; border-radius:999px; background:#e6e6e6; overflow:hidden;}
  .fill{height:100%; width:0%; background:#3b82f6;}
  .meta{margin-top:10px; font-size:12px; color:#444; display:flex; justify-content:space-between;}
  .small{margin-top:6px; font-size:12px; color:#666;}
</style>
</head>
<body>
  <div class="title" id="t">正在下载更新…</div>
  <div class="bar"><div class="fill" id="f"></div></div>
  <div class="meta"><span id="p">0%</span><span id="s">0 MB / 0 MB</span></div>
  <div class="small" id="v"></div>

<script>
  // 主进程通过 executeJavaScript 注入 window.__setProgress(...)
  window.__setProgress = (percent, transferredMB, totalMB, speedMBps, text) => {
    const f = document.getElementById('f');
    const p = document.getElementById('p');
    const s = document.getElementById('s');
    const v = document.getElementById('v');
    f.style.width = percent.toFixed(1) + '%';
    p.textContent = percent.toFixed(1) + '%';
    s.textContent = transferredMB.toFixed(1) + ' MB / ' + totalMB.toFixed(1) + ' MB' + '  (' + speedMBps.toFixed(1) + ' MB/s)';
    v.textContent = text || '';
  };
</script>
</body>
</html>
`;
  progressWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  progressWin.on('closed', () => (progressWin = null));
  return progressWin;
}

function setProgressUI({ percent, transferred, total, speed, text }) {
  if (!progressWin || progressWin.isDestroyed()) return;
  const transferredMB = transferred / 1024 / 1024;
  const totalMB = total / 1024 / 1024;
  const speedMBps = speed / 1024 / 1024;

  progressWin.setProgressBar(Math.max(0, Math.min(1, percent / 100)));

  progressWin.webContents
    .executeJavaScript(
      `window.__setProgress(${percent}, ${transferredMB}, ${totalMB}, ${speedMBps}, ${JSON.stringify(text || '')});`,
      true,
    )
    .catch(() => {});
}

function downloadFileWithProgress(url, outFile, onProgress) {
  log.info(url);
  log.info(outFile);
  log.info(onProgress);
  // log.info('[manual-update] progress', {
  //   percent: p.percent.toFixed(1),
  //   transferred: p.transferred,
  //   total: p.total,
  //   speed: p.speed,
  // });
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;

    const req = client.get(u, (res) => {
      // 处理 302/301
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(downloadFileWithProgress(new URL(res.headers.location, u).toString(), outFile, onProgress));
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
      }

      const total = Number(res.headers['content-length'] || 0);
      let transferred = 0;

      ensureDir(path.dirname(outFile));
      const file = fs.createWriteStream(outFile);

      const start = Date.now();
      let lastTick = Date.now();
      let lastBytes = 0;

      res.on('data', (chunk) => {
        transferred += chunk.length;

        const now = Date.now();
        if (now - lastTick >= 300) {
          const elapsedSec = (now - start) / 1000;
          const deltaBytes = transferred - lastBytes;
          const deltaSec = (now - lastTick) / 1000;
          const speed = deltaSec > 0 ? deltaBytes / deltaSec : 0;

          const percent = total > 0 ? (transferred / total) * 100 : 0;
          onProgress?.({ percent, transferred, total: total || transferred, speed, elapsedSec });

          lastTick = now;
          lastBytes = transferred;
        }
      });

      res.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          const percent = 100;
          onProgress?.({
            percent,
            transferred,
            total: total || transferred,
            speed: 0,
            elapsedSec: (Date.now() - start) / 1000,
          });
          resolve(outFile);
        });
      });

      file.on('error', (err) => {
        fs.unlink(outFile, () => reject(err));
      });
    });

    req.on('error', reject);
  });
}

function resolveDownloadUrl(updateInfo) {
  // electron-updater 的 updateInfo 里一般会带 files[0].url（generic provider 常见）
  const feed = getFeedURL();
  const fileUrl = updateInfo?.files?.[0]?.url || updateInfo?.path || updateInfo?.url;
  if (!fileUrl) return null;
  return new URL(fileUrl, feed).toString();
}

async function startManualUpdateFlow(updateInfo) {
  const downloadUrl = resolveDownloadUrl(updateInfo);
  log.info('[updater] manual update flow start', { downloadUrl });
  if (!downloadUrl) {
    await dialog.showMessageBox({
      type: 'error',
      title: '更新失败',
      message: '无法解析更新下载地址（updateInfo.files[0].url 不存在）。',
    });
    return;
  }

  // 你可以改成 app.getPath("downloads")，这里用 userData 下的 updates 更可控
  const saveDir = path.join(app.getPath('userData'), 'updates');
  const fileName = decodeURIComponent(new URL(downloadUrl).pathname.split('/').pop() || 'update.exe');
  const outFile = path.join(saveDir, fileName);

  const win2 = createProgressWindow();
  win2.show();
  let lastText = `来源：${downloadUrl}`;
  await downloadFileWithProgress(downloadUrl, outFile, ({ percent, transferred, total, speed }) => {
    setProgressUI({
      percent,
      transferred,
      total,
      speed,
      text: lastText,
    });
  });

  if (progressWin && !progressWin.isDestroyed()) {
    progressWin.setProgressBar(-1);
    progressWin.close();
  }

  const r = await dialog.showMessageBox({
    type: 'info',
    title: '下载完成',
    message: '新版本已下载完成。',
    detail: `文件：${outFile}`,
    buttons: ['打开下载目录', '运行安装包', '稍后'],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  });

  if (r.response === 0) {
    shell.showItemInFolder(outFile); // 打开并选中文件
  } else if (r.response === 1) {
    shell.openPath(outFile); // 直接运行安装包
  }
}

function setupAutoUpdate() {
  log.info('[updater] setup start');
  // 只用来“检查更新拿信息”，不走下载/安装（避免签名校验卡住）
  autoUpdater.autoDownload = false;

  if (isDev) {
    autoUpdater.forceDevUpdateConfig = true;
    console.log('xxxx');
  }

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: getFeedURL(),
  });
  log.info('[updater] feed url:', getFeedURL());

  autoUpdater.on('checking-for-update', () => {
    log.info('[updater] checking for update');
  });

  autoUpdater.on('update-available', async (info) => {
    log.info('[updater] update available', {
      version: info.version,
      files: info.files,
    });
    const r = await dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}，是否下载？`,
      buttons: ['下载', '稍后'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (r.response === 0) {
      // autoUpdater.downloadUpdate();
      await startManualUpdateFlow(info);
    }
  });

  autoUpdater.on('update-not-available', () => {
    log.info('[updater] no update available');
  });

  autoUpdater.on('download-progress', (p) => {
    log.info(`[updater] download ${Math.round(p.percent)}% (${p.transferred}/${p.total})`);
  });

  autoUpdater.on('update-downloaded', async () => {
    log.info('[updater] update downloaded');

    // mac 无签名：不保证一定成功，但允许尝试
    const isMac = process.platform === 'darwin';

    const r = await dialog.showMessageBox({
      type: 'info',
      title: '更新已下载',
      message: isMac
        ? '更新已下载完成，重启应用以尝试完成更新。\n\n如果更新失败，请退出应用后重新打开。'
        : '更新已下载完成，是否立即安装并重启？',
      buttons: isMac ? ['立即重启', '稍后'] : ['安装并重启', '稍后'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (r.response === 0) {
      autoUpdater.quitAndInstall(true, true);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err);
    // mac 无签名时这里偶尔会报错，建议只打日志
  });
}

function checkForUpdates() {
  try {
    autoUpdater.checkForUpdates();
  } catch (e) {
    console.error('[updater] check failed:', e);
  }
}
function initUpdater() {
  if (isDev) {
    log.info('[updater] skip in dev mode');
    return;
  }
  setupAutoUpdate();
  // autoUpdater.checkForUpdates();
}
/****************************** AutoUpdate End ***********************************************/

function createMenu() {
  const template = [
    {
      label: '菜单一',
      submenu: [
        { label: '功能一', click: () => log.info('功能一') },
        { label: '功能二', click: () => log.info('功能二') },
        { label: '检查更新', click: () => checkForUpdates() },

        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  // 应用级菜单（macOS 显示在系统菜单栏，Windows 显示在窗口上方）
  Menu.setApplicationMenu(menu);
  // 保险起见，也绑到当前窗口（Windows 上更稳）
  win.setMenu(menu);
  win.setAutoHideMenuBar(false);
  win.setMenuBarVisibility(true);
}
function createWindow() {
  win = new BrowserWindow({
    width: 200,
    height: 200,
    x: 10,
    y: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  if (isDev) {
    win.loadURL('http://localhost:5173'); // Vite 默认端口
  } else {
    win.loadFile(path.join(__dirname, '/pages/index.html'));
  }
  log.info('===== window created =====');
  createMenu();
}

app.whenReady().then(() => {
  initUpdater();
  createWindow();
});
