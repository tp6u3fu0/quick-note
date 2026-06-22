const noteInput = document.getElementById('note-input');
const btnSubmit = document.getElementById('btn-submit');
const btnMinimize = document.getElementById('btn-minimize');
const btnSettings = document.getElementById('btn-settings');
const statusEl = document.getElementById('status');

function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + type;
}

function clearStatus() {
  statusEl.textContent = '';
  statusEl.className = 'status';
}

async function submitNote() {
  const content = noteInput.value.trim();
  if (!content) {
    setStatus('請輸入內容', 'error');
    return;
  }

  btnSubmit.disabled = true;
  setStatus('儲存中...', 'sending');

  const result = await window.api.saveNote(content);

  if (result.success) {
    setStatus('✓ 已儲存到 Notion', 'success');
    noteInput.value = '';
    setTimeout(() => {
      clearStatus();
      window.api.hideWindow();
    }, 1200);
  } else {
    setStatus('✗ ' + (result.error || '儲存失敗'), 'error');
    btnSubmit.disabled = false;
  }
}

btnSubmit.addEventListener('click', submitNote);

btnMinimize.addEventListener('click', () => {
  window.api.hideWindow();
});

btnSettings.addEventListener('click', () => {
  window.api.openSettings();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.api.hideWindow();
  }
  if (e.ctrlKey && e.key === 'Enter') {
    submitNote();
  }
});

// 每次視窗顯示時聚焦輸入框
window.api.onWindowShown(() => {
  noteInput.focus();
  clearStatus();
  btnSubmit.disabled = false;
});

// 初始聚焦
window.addEventListener('DOMContentLoaded', () => {
  noteInput.focus();
});
