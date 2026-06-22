const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  encryptionKey: 'quick-note-secret-key-2024'
});

let tray = null;
let mainWindow = null;
let settingsWindow = null;
let isQuitting = false;

const DEFAULT_SHORTCUT = 'Ctrl+Shift+N';

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 220,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (e) => {
    if (isQuitting) return;
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('blur', () => {
    // 不自動關閉，只在 Esc 時關閉
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 480,
    resizable: false,
    title: 'Quick Note 設定',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.setMenu(null);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function toggleMainWindow() {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showMainWindow();
  }
}

function showMainWindow() {
  if (!mainWindow) return;

  // 置中顯示
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const winWidth = 420;
  const winHeight = 220;
  mainWindow.setPosition(
    Math.round((width - winWidth) / 2),
    Math.round((height - winHeight) / 2)
  );

  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('window-shown');
}

function createTray() {
  // 使用內嵌 base64 圖示，避免找不到檔案
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error('empty');
  } catch {
    // fallback: 建立一個簡單的 16x16 圖示
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Quick Note');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '開啟 Quick Note',
      click: () => showMainWindow()
    },
    {
      label: '設定',
      click: () => createSettingsWindow()
    },
    { type: 'separator' },
    {
      label: '結束',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    toggleMainWindow();
  });
}

function registerShortcut() {
  const shortcut = store.get('shortcut', DEFAULT_SHORTCUT);
  globalShortcut.unregisterAll();
  try {
    const ok = globalShortcut.register(shortcut, () => {
      toggleMainWindow();
    });
    if (!ok) {
      console.error('快捷鍵註冊失敗:', shortcut);
    }
  } catch (e) {
    console.error('快捷鍵錯誤:', e.message);
  }
}

// IPC handlers
ipcMain.handle('get-settings', () => {
  return {
    notionToken: store.get('notionToken', ''),
    notionTarget: store.get('notionTarget', ''),
    saveMode: store.get('saveMode', 'page'),
    addTimestamp: store.get('addTimestamp', true),
    shortcut: store.get('shortcut', DEFAULT_SHORTCUT)
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  const oldShortcut = store.get('shortcut', DEFAULT_SHORTCUT);
  store.set('notionToken', settings.notionToken);
  store.set('notionTarget', settings.notionTarget);
  store.set('saveMode', settings.saveMode);
  store.set('addTimestamp', settings.addTimestamp);
  store.set('shortcut', settings.shortcut);

  if (settings.shortcut !== oldShortcut) {
    registerShortcut();
  }
  return { success: true };
});

ipcMain.handle('save-note', async (event, content) => {
  const token = store.get('notionToken', '');
  const target = store.get('notionTarget', '');
  const saveMode = store.get('saveMode', 'page');
  const addTimestamp = store.get('addTimestamp', true);

  if (!token || !target) {
    return { success: false, error: '請先完成設定（API Token 與目標 ID）' };
  }

  const now = new Date();
  const timestamp = now.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(/\//g, '-');

  const noteText = addTimestamp ? `[${timestamp}] ${content}` : content;

  try {
    if (saveMode === 'page') {
      const res = await fetch(`https://api.notion.com/v1/blocks/${target}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          children: [{
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: noteText } }]
            }
          }]
        })
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.message || `HTTP ${res.status}` };
      }
      return { success: true };
    } else {
      // database mode
      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: target },
          properties: {
            '名稱': {
              title: [{
                type: 'text',
                text: { content: content.slice(0, 50) }
              }]
            },
            '內容': {
              rich_text: [{
                type: 'text',
                text: { content }
              }]
            }
          }
        })
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.message || `HTTP ${res.status}` };
      }
      return { success: true };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.on('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerShortcut();
});

app.on('window-all-closed', (e) => {
  if (!isQuitting) e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
