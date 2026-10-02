let selectedFile = null;
let resultBlob = null;

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewImg = document.getElementById('previewImg');
const removeBtn = document.getElementById('removeBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const resultEl = document.getElementById('result');
const resultImg = document.getElementById('resultImg');
const resultMeta = document.getElementById('resultMeta');

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  const tr = (window.__i18n && window.__i18n.t) || {};

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    showError(tr.errType || 'Please upload a JPEG, PNG, or WebP image.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError(tr.errSize || 'Image must be under 10MB.');
    return;
  }

  selectedFile = file;
  resultBlob = null;
  errorEl.style.display = 'none';
  resultEl.classList.remove('show');

  const url = URL.createObjectURL(file);
  previewImg.src = url;
  preview.style.display = 'block';
  removeBtn.disabled = false;
}

async function removeBackground() {
  const tr = (window.__i18n && window.__i18n.t) || {};
  const base = (window.__i18n && window.__i18n.base) || '';

  if (!selectedFile) {
    showError(tr.errNoFile || 'Please select an image first.');
    return;
  }

  errorEl.style.display = 'none';
  resultEl.classList.remove('show');
  removeBtn.disabled = true;
  loadingEl.style.display = 'flex';

  try {
    const formData = new FormData();
    formData.append('image', selectedFile);

    const res = await fetch(base + '/api/remove-bg', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError(data.error || (tr.errGeneric || 'Processing failed.'));
      return;
    }

    resultBlob = await res.blob();
    const url = URL.createObjectURL(resultBlob);
    resultImg.src = url;
    resultMeta.textContent = (tr.metaSize || 'Result size:') + ' ' + (resultBlob.size / 1024).toFixed(1) + ' KB';
    resultEl.classList.add('show');
  } catch (err) {
    console.error(err);
    showError(tr.errNetwork || 'Network error. Please try again.');
  } finally {
    removeBtn.disabled = false;
    loadingEl.style.display = 'none';
  }
}

function downloadResult() {
  if (!resultBlob) return;
  const url = URL.createObjectURL(resultBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'no-background.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

window.removeBackground = removeBackground;
window.downloadResult = downloadResult;