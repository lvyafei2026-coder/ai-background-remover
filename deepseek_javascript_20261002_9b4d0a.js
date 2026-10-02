const fs = require('fs');
const path = require('path');

// ============================================================
// src/index.js
// ============================================================
const SRC_INDEX = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.includes('/api/') && request.method === 'POST') {
      return handleApi(request, env, url);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\\/$/, '');

  if (!path.endsWith('/api/remove-bg')) {
    return json({ error: 'Not found' }, 404);
  }

  return handleRemoveBg(request, env);
}

async function handleRemoveBg(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return json({ error: 'No image provided.' }, 400);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return json({ error: 'Only JPEG, PNG, and WebP are supported.' }, 400);
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return json({ error: 'Image must be under 10MB.' }, 400);
    }

    const bytes = await file.arrayBuffer();

    // 使用 Images binding 进行背景移除
    const response = await env.IMAGES
      .input(bytes)
      .transform({
        segment: 'foreground'
      })
      .output({ format: 'image/png' })
      .response();

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="no-background.png"'
      }
    });
  } catch (err) {
    console.error('Background removal error:', err);
    return json({ error: 'Processing failed. Please try again.' }, 500);
  }
}
`;

// ============================================================
// public/index.html
// ============================================================
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Background Remover — Remove Image Backgrounds in Seconds (Free)</title>
<meta name="description" content="Free AI background remover. Upload any image and get a transparent PNG in seconds. No sign-up, no upload to third-party servers. Powered by Cloudflare Images.">
<meta name="keywords" content="remove background, background remover, transparent background, remove bg, ai background remover">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="theme-color" content="#0891b2">

<link rel="canonical" href="https://toolara.dev/ai-background-remover/">
<link rel="alternate" hreflang="en" href="https://toolara.dev/ai-background-remover/">
<link rel="alternate" hreflang="zh-Hans" href="https://toolara.dev/ai-background-remover/zh/">
<link rel="alternate" hreflang="x-default" href="https://toolara.dev/ai-background-remover/">

<meta property="og:type" content="website">
<meta property="og:title" content="AI Background Remover — Remove Image Backgrounds">
<meta property="og:description" content="Upload any image, get a transparent PNG in seconds.">
<meta property="og:url" content="https://toolara.dev/ai-background-remover/">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "AI Background Remover",
  "url": "https://toolara.dev/ai-background-remover/",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Any",
  "description": "Free AI tool that removes image backgrounds and returns transparent PNG files.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
<\/script>

<link rel="stylesheet" href="css/style.css">
</head>
<body>

<header class="hero">
  <div class="lang-switch">
    <select id="langSelect" onchange="setLang(this.value)" aria-label="Language">
      <option value="en">English</option>
      <option value="zh">简体中文</option>
    </select>
  </div>
  <div class="hero-inner">
    <div class="hero-badge">🖼️ AI-powered</div>
    <h1 data-i18n="title">AI Background Remover</h1>
    <p data-i18n="subtitle">Upload any image. Get a transparent PNG in seconds. No sign-up required.</p>
  </div>
</header>

<main class="wrap">
  <section class="card">
    <h2 class="visually-hidden" data-i18n="calcHeading">Background remover</h2>

    <div class="upload-zone" id="uploadZone">
      <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" style="display:none;">
      <div class="upload-content" id="uploadContent">
        <div class="upload-icon">📁</div>
        <div class="upload-text" data-i18n="uploadText">Click to upload or drag an image here</div>
        <div class="upload-hint" data-i18n="uploadHint">JPEG, PNG, or WebP · Max 10MB</div>
      </div>
    </div>

    <div id="preview" class="preview" style="display:none;">
      <div class="preview-label" data-i18n="previewLabel">Original image</div>
      <img id="previewImg" class="preview-img" alt="Preview">
    </div>

    <button class="calc" type="button" id="removeBtn" onclick="removeBackground()" data-i18n="calcBtn" disabled>Remove background</button>

    <div id="loading" class="loading" style="display:none;">
      <div class="spinner"></div>
      <div data-i18n="loadingText">Removing background...</div>
    </div>

    <div id="error" class="error" style="display:none;"></div>

    <div id="result" role="region" aria-live="polite">
      <div class="result-header">
        <div class="result-label" data-i18n="resultLabel">Result (transparent PNG)</div>
        <button class="copy-btn" type="button" onclick="downloadResult()" data-i18n="downloadBtn">Download</button>
      </div>
      <div class="result-preview">
        <img id="resultImg" class="result-img" alt="Result">
      </div>
      <div class="result-meta" id="resultMeta"></div>
      <div class="result-disclaimer" data-i18n="resultDisclaimer">Your image is processed in memory and not stored. The result is a transparent PNG.</div>
    </div>
  </section>

  <section>
    <h2 data-i18n="whatIsTitle">What does this tool do?</h2>
    <p data-i18n="whatIsText">This tool uses AI to automatically detect the main subject in your image and remove the background. It works on product photos, portraits, logos, and any image where you want a clean cutout. The result is a transparent PNG you can place on any background.</p>
  </section>

  <section>
    <h2 data-i18n="useCasesTitle">Common use cases</h2>
    <ul>
      <li data-i18n="use1"><strong>E-commerce product photos</strong> — Get clean cutouts for Amazon, Etsy, or Shopify listings.</li>
      <li data-i18n="use2"><strong>Presentations and slides</strong> — Drop subjects onto custom backgrounds without a designer.</li>
      <li data-i18n="use3"><strong>Social media graphics</strong> — Create transparent stickers and overlays.</li>
      <li data-i18n="use4"><strong>Design mockups</strong> — Place people or objects into new scenes.</li>
    </ul>
  </section>

  <section>
    <h2 data-i18n="faqTitle">Frequently asked questions</h2>
    <h3 data-i18n="faq1q">Is this tool free?</h3>
    <p data-i18n="faq1a">Yes. The tool uses Cloudflare Images, which includes 5,000 free background removal transformations per month. For normal personal use, you won't hit the limit.</p>

    <h3 data-i18n="faq2q">Is my image stored?</h3>
    <p data-i18n="faq2a">No. Your image is processed in memory and discarded immediately after the result is returned. Nothing is stored, logged, or used for training.</p>

    <h3 data-i18n="faq3q">What image formats are supported?</h3>
    <p data-i18n="faq3a">JPEG, PNG, and WebP. Maximum file size is 10MB. The output is always a transparent PNG.</p>

    <h3 data-i18n="faq4q">How accurate is the background removal?</h3>
    <p data-i18n="faq4a">The AI works best on images with a clear, distinct subject — product photos, portraits, and graphics. Complex scenes with multiple objects or very fine details (like hair) may have imperfect edges. Review the result before using it in production.</p>

    <h3 data-i18n="faq5q">Can I use the result commercially?</h3>
    <p data-i18n="faq5a">Yes. The tool doesn't add watermarks or restrict usage. You own the result. However, make sure you have the rights to the original image.</p>

    <div class="disclaimer" data-i18n="disclaimer"><strong>Note:</strong> This tool processes images in memory and returns a transparent PNG. Review the result before using it in production.</div>
  </section>
</main>

<footer class="footer" data-i18n="footer">Runs on Cloudflare Images. Your image is not stored.</footer>

<script src="js/i18n.js"><\/script>
<script src="js/app.js"><\/script>
</body>
</html>`;

// ============================================================
// public/css/style.css
// ============================================================
const STYLE_CSS = `:root {
  --bg: #f0f9fc; --card: #ffffff; --text: #0f1c2e; --muted: #64748b;
  --accent: #0891b2; --accent-dark: #0e7490; --navy: #164e63;
  --border: #d5eaf0; --radius: 14px;
  --shadow: 0 1px 3px rgba(15,28,46,0.05), 0 8px 24px rgba(8,145,178,0.08);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; -webkit-font-smoothing: antialiased; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  padding: 64px 20px 96px;
  background:
    radial-gradient(circle at 20% 20%, rgba(6,182,212,0.35) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(8,145,178,0.40) 0%, transparent 55%),
    linear-gradient(135deg, #082f49 0%, #0e7490 50%, #0891b2 100%);
}
.hero::before {
  content: "";
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px);
  background-size: 30px 30px;
  opacity: 0.6;
  pointer-events: none;
}
.hero-inner { max-width: 720px; margin: 0 auto; position: relative; z-index: 2; text-align: center; }
.hero-badge {
  display: inline-block;
  background: rgba(6,182,212,0.20);
  border: 1px solid rgba(6,182,212,0.45);
  color: #67e8f9;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 18px;
}
.hero h1 { font-size: 2.1rem; margin: 0 0 12px; font-weight: 800; letter-spacing: -0.02em; }
.hero p { margin: 0 auto; opacity: 0.92; font-size: 1rem; max-width: 560px; }

.lang-switch { position: absolute; top: 16px; right: 16px; z-index: 3; }
.lang-switch select {
  appearance: none; -webkit-appearance: none;
  background-color: rgba(255,255,255,0.15);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat; background-position: right 10px center; background-size: 14px;
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff; padding: 7px 32px 7px 12px; border-radius: 8px;
  font-size: 0.85rem; font-family: inherit; cursor: pointer;
}
.lang-switch select:hover { background-color: rgba(255,255,255,0.28); }
.lang-switch select option { color: #0f1c2e; background: #fff; }

.wrap { max-width: 720px; margin: -56px auto 0; padding: 0 20px 64px; position: relative; z-index: 2; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; margin-bottom: 22px; box-shadow: var(--shadow); }

/* Upload zone */
.upload-zone {
  border: 2px dashed #a5d8e6;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: #f8fdff;
  margin-bottom: 18px;
}
.upload-zone:hover, .upload-zone.dragover {
  border-color: var(--accent);
  background: #ecf9fd;
}
.upload-icon { font-size: 2rem; margin-bottom: 8px; }
.upload-text { font-weight: 600; color: var(--navy); margin-bottom: 4px; }
.upload-hint { font-size: 0.82rem; color: var(--muted); }

/* Preview */
.preview { margin-bottom: 18px; }
.preview-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--accent); margin-bottom: 8px; }
.preview-img { width: 100%; max-height: 300px; object-fit: contain; border-radius: 10px; border: 1px solid var(--border); background: #f8fafc; }

button.calc { width: 100%; padding: 15px; background: var(--accent); color: #fff; border: none; border-radius: 9px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit; }
button.calc:hover:not(:disabled) { background: var(--accent-dark); }
button.calc:disabled { opacity: 0.5; cursor: not-allowed; }

.loading { display: flex; align-items: center; gap: 12px; padding: 16px; margin-top: 20px; font-size: 0.9rem; color: var(--accent); font-weight: 500; }
.spinner { width: 20px; height: 20px; border: 2.5px solid rgba(8,145,178,0.2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error { margin-top: 20px; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #b91c1c; font-size: 0.9rem; }

#result { margin-top: 24px; padding: 24px; border-radius: 14px; background: linear-gradient(135deg, #ecf9fd 0%, #f0f9fc 100%); border: 2px solid var(--accent); display: none; animation: fadeIn 0.35s ease; }
#result.show { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.result-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.result-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--accent); }
.copy-btn { padding: 8px 16px; background: var(--accent); border: none; color: #fff; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit; }
.copy-btn:hover { background: var(--accent-dark); }

.result-preview { background: repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px; border-radius: 10px; padding: 16px; display: flex; justify-content: center; align-items: center; min-height: 200px; }
.result-img { max-width: 100%; max-height: 300px; object-fit: contain; }
.result-meta { font-size: 0.78rem; color: var(--muted); margin-top: 10px; }
.result-disclaimer { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(8,145,178,0.15); font-size: 0.78rem; color: var(--muted); }

h2 { font-size: 1.25rem; margin: 36px 0 12px; letter-spacing: -0.01em; }
h3 { font-size: 1rem; margin: 22px 0 6px; }
p { margin: 0 0 14px; }
ul, ol { margin: 0 0 16px; padding-left: 22px; }
li { margin-bottom: 8px; line-height: 1.65; }
.disclaimer { font-size: 0.85rem; color: var(--muted); border-left: 3px solid var(--accent); padding: 4px 0 4px 14px; margin-top: 18px; }
.footer { text-align: center; font-size: 0.8rem; color: var(--muted); padding: 24px 20px 48px; }

@media (max-width: 560px) {
  .hero { padding: 48px 16px 80px; }
  .hero h1 { font-size: 1.5rem; }
  .lang-switch { position: static; display: flex; justify-content: center; margin-bottom: 16px; }
  .wrap { padding: 0 14px 48px; }
  .card { padding: 20px; }
}`;

// ============================================================
// public/js/i18n.js
// ============================================================
const I18N_JS = `const SUPPORTED_LANGS = ['en','zh'];
const DEFAULT_LANG = 'en';
const MARKER = '/ai-background-remover';

const LANG_TO_PATH = { 'en':'/', 'zh':'/zh/' };
const SEG_TO_LANG = { 'zh':'zh' };

let currentLang = DEFAULT_LANG;
let translations = {};
const cache = {};

function getBase() {
  const p = window.location.pathname;
  const idx = p.indexOf(MARKER);
  if (idx !== -1) return p.slice(0, idx + MARKER.length);
  return '';
}

function detectPageLang() {
  if (window.__FORCE_LANG__ && SUPPORTED_LANGS.includes(window.__FORCE_LANG__)) return window.__FORCE_LANG__;
  const p = window.location.pathname;
  const base = getBase();
  const rest = base ? p.slice(base.length) : p;
  const segs = rest.split('/').filter(Boolean);
  if (segs.length > 0) {
    const first = segs[0].toLowerCase();
    if (SEG_TO_LANG[first]) return SEG_TO_LANG[first];
  }
  return DEFAULT_LANG;
}

async function loadLocale(lang) {
  if (cache[lang]) return cache[lang];
  const base = getBase();
  const res = await fetch(base + '/locales/' + lang + '.json');
  if (!res.ok) throw new Error('Failed to load locale: ' + lang);
  const data = await res.json();
  cache[lang] = data;
  return data;
}

function applyTranslations(t) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] === undefined) return;
    if (key === 'disclaimer') el.innerHTML = t[key];
    else el.textContent = t[key];
  });
}

async function initPage() {
  const lang = detectPageLang();
  try { translations = await loadLocale(lang); }
  catch (err) { console.error(err); return; }
  currentLang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
  applyTranslations(translations);
  const select = document.getElementById('langSelect');
  if (select) select.value = lang;
  window.__i18n = { t: translations, lang: currentLang, base: getBase() };
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
  const base = getBase();
  window.location.href = base + (LANG_TO_PATH[lang] || '/');
}

document.addEventListener('DOMContentLoaded', initPage);`;

// ============================================================
// public/js/app.js
// ============================================================
const APP_JS = `let selectedFile = null;
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
window.downloadResult = downloadResult;`;

// ============================================================
// public/locales/*.json
// ============================================================
const LOCALES = {
  'en': {
    title: "AI Background Remover",
    subtitle: "Upload any image. Get a transparent PNG in seconds. No sign-up required.",
    calcHeading: "Background remover",
    uploadText: "Click to upload or drag an image here",
    uploadHint: "JPEG, PNG, or WebP · Max 10MB",
    previewLabel: "Original image",
    calcBtn: "Remove background",
    loadingText: "Removing background...",
    resultLabel: "Result (transparent PNG)",
    downloadBtn: "Download",
    metaSize: "Result size:",
    resultDisclaimer: "Your image is processed in memory and not stored. The result is a transparent PNG.",
    whatIsTitle: "What does this tool do?",
    whatIsText: "This tool uses AI to automatically detect the main subject in your image and remove the background. It works on product photos, portraits, logos, and any image where you want a clean cutout. The result is a transparent PNG you can place on any background.",
    useCasesTitle: "Common use cases",
    use1: "E-commerce product photos — Get clean cutouts for Amazon, Etsy, or Shopify listings.",
    use2: "Presentations and slides — Drop subjects onto custom backgrounds without a designer.",
    use3: "Social media graphics — Create transparent stickers and overlays.",
    use4: "Design mockups — Place people or objects into new scenes.",
    faqTitle: "Frequently asked questions",
    faq1q: "Is this tool free?",
    faq1a: "Yes. The tool uses Cloudflare Images, which includes 5,000 free background removal transformations per month. For normal personal use, you won't hit the limit.",
    faq2q: "Is my image stored?",
    faq2a: "No. Your image is processed in memory and discarded immediately after the result is returned. Nothing is stored, logged, or used for training.",
    faq3q: "What image formats are supported?",
    faq3a: "JPEG, PNG, and WebP. Maximum file size is 10MB. The output is always a transparent PNG.",
    faq4q: "How accurate is the background removal?",
    faq4a: "The AI works best on images with a clear, distinct subject — product photos, portraits, and graphics. Complex scenes with multiple objects or very fine details (like hair) may have imperfect edges. Review the result before using it in production.",
    faq5q: "Can I use the result commercially?",
    faq5a: "Yes. The tool doesn't add watermarks or restrict usage. You own the result. However, make sure you have the rights to the original image.",
    disclaimer: "<strong>Note:</strong> This tool processes images in memory and returns a transparent PNG. Review the result before using it in production.",
    footer: "Runs on Cloudflare Images. Your image is not stored.",
    errType: "Please upload a JPEG, PNG, or WebP image.",
    errSize: "Image must be under 10MB.",
    errNoFile: "Please select an image first.",
    errGeneric: "Processing failed. Please try again.",
    errNetwork: "Network error. Please try again."
  },
  'zh': {
    title: "AI 一键抠图工具",
    subtitle: "上传任意图片，几秒内获得透明背景的 PNG。无需注册。",
    calcHeading: "背景移除",
    uploadText: "点击上传或将图片拖到此处",
    uploadHint: "支持 JPEG、PNG、WebP · 最大 10MB",
    previewLabel: "原始图片",
    calcBtn: "去除背景",
    loadingText: "正在移除背景…",
    resultLabel: "结果（透明 PNG）",
    downloadBtn: "下载",
    metaSize: "结果大小：",
    resultDisclaimer: "图片在内存中处理，不会存储。结果为透明 PNG。",
    whatIsTitle: "这个工具做什么？",
    whatIsText: "本工具使用 AI 自动识别图片中的主体并移除背景。适用于产品图、人像、Logo，以及任何需要干净抠图的场景。结果是一个透明 PNG，可以放置到任意背景上。",
    useCasesTitle: "常见使用场景",
    use1: "电商产品图——为 Amazon、Etsy 或 Shopify 商品生成干净的白底图。",
    use2: "演示文稿和幻灯片——无需设计师，把主体放到自定义背景上。",
    use3: "社交媒体素材——制作透明贴纸和叠加元素。",
    use4: "设计样机——把人物或物体放入新场景。",
    faqTitle: "常见问题",
    faq1q: "这个工具免费吗？",
    faq1a: "免费。工具使用 Cloudflare Images，每月包含 5000 次免费背景移除转换。正常个人使用不会触达限制。",
    faq2q: "我的图片会被存储吗？",
    faq2a: "不会。图片在内存中处理，返回结果后立即丢弃。不存储、不记录、不用于训练。",
    faq3q: "支持哪些图片格式？",
    faq3a: "JPEG、PNG 和 WebP。最大文件大小 10MB。输出始终为透明 PNG。",
    faq4q: "抠图准确度如何？",
    faq4a: "AI 在主体清晰、轮廓分明的图片上效果最好——产品图、人像和图形。复杂场景（多个物体）或精细细节（如头发）可能边缘不够完美。在生产环境使用前请检查结果。",
    faq5q: "结果可以商用吗？",
    faq5a: "可以。工具不会添加水印或限制用途。结果归你所有。但请确保你对原图拥有权利。",
    disclaimer: "<strong>注意：</strong>本工具在内存中处理图片并返回透明 PNG。生产环境使用前请检查结果。",
    footer: "运行在 Cloudflare Images 上。你的图片不会被存储。",
    errType: "请上传 JPEG、PNG 或 WebP 格式的图片。",
    errSize: "图片必须小于 10MB。",
    errNoFile: "请先选择一张图片。",
    errGeneric: "处理失败，请重试。",
    errNetwork: "网络错误，请重试。"
  }
};

// ============================================================
// wrangler.toml
// ============================================================
const WRANGLER_TOML = `name = "ai-background-remover"
main = "src/index.js"
compatibility_date = "2026-09-27"

[images]
binding = "IMAGES"

[assets]
directory = "./public"
binding = "ASSETS"
not_found_handling = "single-page-application"
html_handling = "none"
run_worker_first = ["/*"]
`;

const PACKAGE_JSON = `{
  "name": "ai-background-remover",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev"
  },
  "devDependencies": {
    "wrangler": "^4.0.0"
  }
}
`;

const GITIGNORE = `node_modules/
.wrangler/
.dev.vars
.DS_Store
*.log
.vscode/
.idea/
dist/
build/
`;

const README_MD = `# AI Background Remover

A Cloudflare Worker that removes image backgrounds using Cloudflare Images.

## Features

- Drag-and-drop or click to upload
- JPEG, PNG, WebP input (max 10MB)
- Transparent PNG output
- Runs on Cloudflare Images (5,000 free transformations/month)
- Image is not stored or logged
- Multi-language interface (EN + ZH)

## Architecture

- **Worker** handles POST /api/remove-bg
- **Cloudflare Images** binding via \`[images]\` in wrangler.toml
- **Static assets** in \`public/\`

## Setup

\`\`\`bash
npm install
npx wrangler login
npx wrangler deploy
\`\`\`

## Free tier

- Cloudflare Images: 5,000 unique transformations/month

## License

MIT
`;

// ============================================================
// 生成文件
// ============================================================
const files = {
  'src/index.js': SRC_INDEX,
  'public/index.html': INDEX_HTML,
  'public/css/style.css': STYLE_CSS,
  'public/js/i18n.js': I18N_JS,
  'public/js/app.js': APP_JS,
  'public/locales/en.json': JSON.stringify(LOCALES.en, null, 2),
  'public/locales/zh.json': JSON.stringify(LOCALES.zh, null, 2),
  'wrangler.toml': WRANGLER_TOML,
  'package.json': PACKAGE_JSON,
  '.gitignore': GITIGNORE,
  'README.md': README_MD,
};

const root = '.';
let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(root, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created: ' + filePath);
  count++;
}

console.log(`\nDone. ${count} files generated.`);
console.log('\nNext steps:');
console.log('  1. npm install');
console.log('  2. npx wrangler login');
console.log('  3. npx wrangler deploy');
console.log('  4. In tool-proxy/src/index.js PROXY_MAP, add:');
console.log('     \'/ai-background-remover\': \'https://ai-background-remover.lvyafei2026.workers.dev\'');
console.log('  5. In tool-proxy/wrangler.toml run_worker_first, add:');
console.log('     "/ai-background-remover/*"');
console.log('  6. In Cloudflare tool-proxy Domains & Routes, add:');
console.log('     toolara.dev/ai-background-remover/*');
console.log('     www.toolara.dev/ai-background-remover/*');
console.log('  7. Update tool-proxy/public/sitemap.xml and index.html');