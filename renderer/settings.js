const tokenInput = document.getElementById('notion-token');
const targetInput = document.getElementById('notion-target');
const saveModeSelect = document.getElementById('save-mode');
const addTimestampCheck = document.getElementById('add-timestamp');
const shortcutDisplay = document.getElementById('shortcut-display');
const btnSave = document.getElementById('btn-save');
const statusEl = document.getElementById('status');

let currentShortcut = 'Ctrl+Shift+N';
let isRecording = false;

function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + type;
}

async function loadSettings() {
  const s = await window.api.getSettings();
  tokenInput.value = s.notionToken || '';
  targetInput.value = s.notionTarget || '';
  saveModeSelect.value = s.saveMode || 'page';
  addTimestampCheck.checked = s.addTimestamp !== false;
  currentShortcut = s.shortcut || 'Ctrl+Shift+N';
  shortcutDisplay.textContent = currentShortcut;
}

btnSave.addEventListener('click', async () => {
  const settings = {
    notionToken: tokenInput.value.trim(),
    notionTarget: targetInput.value.trim(),
    saveMode: saveModeSelect.value,
    addTimestamp: addTimestampCheck.checked,
    shortcut: currentShortcut
  };

  const result = await window.api.saveSettings(settings);
  if (result.success) {
    setStatus('✓ 設定已儲存', 'success');
    setTimeout(() => setStatus(''), 2000);
  } else {
    setStatus('✗ 儲存失敗', 'error');
  }
});

// 快捷鍵錄製
shortcutDisplay.addEventListener('click', () => {
  isRecording = true;
  shortcutDisplay.textContent = '請按下組合鍵...';
  shortcutDisplay.classList.add('recording');
  shortcutDisplay.focus();
});

shortcutDisplay.addEventListener('keydown', (e) => {
  if (!isRecording) return;
  e.preventDefault();
  e.stopPropagation();

  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.metaKey) parts.push('Meta');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  const key = e.key;
  const skipKeys = ['Control', 'Meta', 'Alt', 'Shift', 'Escape'];

  if (key === 'Escape') {
    isRecording = false;
    shortcutDisplay.textContent = currentShortcut;
    shortcutDisplay.classList.remove('recording');
    return;
  }

  if (!skipKeys.includes(key) && parts.length > 0) {
    const keyName = key.length === 1 ? key.toUpperCase() : key;
    parts.push(keyName);
    currentShortcut = parts.join('+');
    shortcutDisplay.textContent = currentShortcut;
    shortcutDisplay.classList.remove('recording');
    isRecording = false;
  }
});

shortcutDisplay.addEventListener('blur', () => {
  if (isRecording) {
    isRecording = false;
    shortcutDisplay.textContent = currentShortcut;
    shortcutDisplay.classList.remove('recording');
  }
});

document.getElementById('link-integrations').addEventListener('click', (e) => {
  e.preventDefault();
  // 在預設瀏覽器開啟
  require && require('electron') ? null : null;
  window.open('https://www.notion.so/my-integrations');
});

loadSettings();
