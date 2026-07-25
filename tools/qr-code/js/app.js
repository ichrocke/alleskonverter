import { TYPES, typeById } from './payloads.js';
import { PRESETS, BUILT_IN_ICONS, iconToDataUrl } from './presets.js';
import { FRAMES, frameById, composeFrame } from './frames.js';
import { loadHistory, addHistoryEntry, removeHistoryEntry, clearHistory } from './history.js';
import { renderArtQr } from './artqr.js';

const $ = (sel) => document.querySelector(sel);
const PREVIEW_SIZE = 300;

// ---------- State ----------

const defaultDesign = () => ({
  dotsType: 'rounded',
  cornersSquareType: 'extra-rounded',
  cornersDotType: 'dot',
  dotsColorMode: 'single',
  dotsColor: '#1a1a2e',
  dotsGradType: 'linear',
  dotsGradRot: 45,
  dotsGradA: '#6366f1',
  dotsGradB: '#22d3ee',
  cornersCustom: false,
  cornersSquareColor: '#1a1a2e',
  cornersDotColor: '#1a1a2e',
  bgMode: 'color',
  bgColor: '#ffffff',
  bgGradA: '#fdfbfb',
  bgGradB: '#ebedee',
  logo: null,
  logoSize: 35,
  logoMargin: 4,
  hideBgDots: true,
  imageMode: 'logo',
  artDotSize: 60,
  artWash: 25,
  artColorMode: 'image',
  frame: 'none',
  frameText: 'SCAN MICH',
  frameColor: '#6366f1',
  frameTextColor: '#ffffff',
  qrMargin: 12,
  ecLevel: 'M',
});

const state = {
  type: 'url',
  dataByType: {},
  design: defaultDesign(),
  valid: false,
  payload: '',
};

const dataFor = (typeId) => {
  if (!state.dataByType[typeId]) {
    const d = {};
    typeById(typeId).fields.forEach((f) => { d[f.key] = f.default ?? (f.type === 'checkbox' ? false : ''); });
    state.dataByType[typeId] = d;
  }
  return state.dataByType[typeId];
};

// ---------- QR-Rendering ----------

const qr = new QRCodeStyling({ width: PREVIEW_SIZE, height: PREVIEW_SIZE, type: 'canvas', data: ' ' });
qr.append($('#qrPreview'));

// Zweites Canvas für den Halftone-Modus („Bild im Code“).
// Wichtig: als Geschwister NEBEN #qrPreview — qr.update() leert dessen
// Inhalt per innerHTML='' und würde das Canvas sonst aus dem DOM werfen.
const artWrap = document.createElement('div');
artWrap.className = 'qr-canvas';
artWrap.id = 'artWrap';
const artCanvas = document.createElement('canvas');
artCanvas.id = 'artCanvas';
artWrap.appendChild(artCanvas);
$('#qrPreview').after(artWrap);

const artActive = () => state.design.imageMode === 'art' && !!state.design.logo;

function gradient(type, rotation, a, b) {
  return {
    type,
    rotation: (rotation * Math.PI) / 180,
    colorStops: [{ offset: 0, color: a }, { offset: 1, color: b }],
  };
}

function qrOptions(data, size) {
  const d = state.design;
  const scale = size / PREVIEW_SIZE;
  // gradient/color immer BEIDE setzen: qr.update() merged tief, sonst bleibt
  // ein früher gesetzter Verlauf für immer aktiv (gradient gewinnt über color).
  const dotsColor = d.dotsColorMode === 'gradient'
    ? { color: undefined, gradient: gradient(d.dotsGradType, d.dotsGradRot, d.dotsGradA, d.dotsGradB) }
    : { color: d.dotsColor, gradient: undefined };
  const cornersSquare = d.cornersCustom ? { color: d.cornersSquareColor, gradient: undefined } : { ...dotsColor };
  const cornersDot = d.cornersCustom ? { color: d.cornersDotColor, gradient: undefined } : { ...dotsColor };
  const background = d.bgMode === 'transparent'
    ? { color: 'rgba(255,255,255,0)', gradient: undefined }
    : d.bgMode === 'gradient'
      ? { color: undefined, gradient: gradient('linear', 90, d.bgGradA, d.bgGradB) }
      : { color: d.bgColor, gradient: undefined };

  return {
    width: size,
    height: size,
    type: 'canvas',
    data,
    margin: Math.round(d.qrMargin * scale),
    qrOptions: { errorCorrectionLevel: d.ecLevel },
    image: d.logo || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      hideBackgroundDots: d.hideBgDots,
      imageSize: d.logoSize / 100,
      margin: Math.round(d.logoMargin * scale),
    },
    dotsOptions: { type: d.dotsType, ...dotsColor },
    cornersSquareOptions: { type: d.cornersSquareType, ...cornersSquare },
    cornersDotOptions: { type: d.cornersDotType, ...cornersDot },
    backgroundOptions: background,
  };
}

let previewInView = true;
function updateFab() {
  $('#fabPreview').hidden = previewInView || !state.valid;
}

let renderTimer;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPreview, 150);
}

function renderPreview() {
  const type = typeById(state.type);
  const data = dataFor(state.type);
  const errors = type.validate(data);
  const touchedErrors = Object.fromEntries(Object.entries(errors).filter(([k]) => touched.has(k)));
  showFieldErrors(touchedErrors);

  const requiredFilled = type.fields.filter((f) => f.required).every((f) => String(data[f.key] ?? '').trim() !== '');
  state.valid = requiredFilled && Object.keys(errors).length === 0;

  $('#previewEmpty').hidden = state.valid;
  $('#previewStage').classList.toggle('is-empty', !state.valid);
  updateFab();

  if (!state.valid) return;
  state.payload = type.build(data);
  $('#previewFrame').classList.toggle('art-active', artActive());
  if (artActive()) {
    renderArtQr(artCanvas, state.payload, state.design, PREVIEW_SIZE * 2)
      .catch((err) => { console.error(err); toast('Bild konnte nicht geladen werden'); });
  } else {
    qr.update(qrOptions(state.payload, PREVIEW_SIZE));
  }
  updateContrastHint();
  updateFramePreview();
}

// ---------- Formular ----------

let touched = new Set();

function renderTypeChips() {
  const wrap = $('#typeChips');
  wrap.innerHTML = '';
  TYPES.forEach((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (t.id === state.type ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', t.id === state.type);
    btn.innerHTML = `<span class="chip-icon">${t.icon}</span><span>${t.label}</span>`;
    btn.addEventListener('click', () => {
      state.type = t.id;
      touched = new Set();
      renderTypeChips();
      renderForm();
      renderPreview();
    });
    wrap.appendChild(btn);
  });
}

function renderForm() {
  const type = typeById(state.type);
  const data = dataFor(state.type);
  const form = $('#typeForm');
  form.innerHTML = '';

  type.fields.forEach((f) => {
    const field = document.createElement('div');
    field.className = 'field' + (f.half ? ' half' : '');
    field.dataset.key = f.key;

    if (f.type === 'checkbox') {
      field.innerHTML = `<label class="check"><input type="checkbox" id="f_${f.key}"> ${f.label}</label>`;
      const input = field.querySelector('input');
      input.checked = !!data[f.key];
      input.addEventListener('change', () => { data[f.key] = input.checked; touched.add(f.key); scheduleRender(); });
    } else if (f.type === 'select') {
      field.innerHTML = `<label for="f_${f.key}">${f.label}</label><select id="f_${f.key}"></select>`;
      const sel = field.querySelector('select');
      f.options.forEach((o) => {
        const opt = document.createElement('option');
        opt.value = o.value; opt.textContent = o.label;
        sel.appendChild(opt);
      });
      sel.value = data[f.key] || f.default || f.options[0].value;
      data[f.key] = sel.value;
      sel.addEventListener('change', () => { data[f.key] = sel.value; touched.add(f.key); scheduleRender(); });
    } else if (f.type === 'textarea') {
      field.innerHTML = `<label for="f_${f.key}">${f.label}${f.required ? ' *' : ''}</label><textarea id="f_${f.key}" rows="${f.rows || 3}" placeholder="${f.placeholder || ''}"></textarea>`;
      const ta = field.querySelector('textarea');
      ta.value = data[f.key] || '';
      ta.addEventListener('input', () => { data[f.key] = ta.value; touched.add(f.key); scheduleRender(); });
    } else {
      field.innerHTML = `<label for="f_${f.key}">${f.label}${f.required ? ' *' : ''}</label><input type="${f.type}" id="f_${f.key}" placeholder="${f.placeholder || ''}" ${f.type === 'datetime-local' ? '' : 'inputmode="' + inputmodeFor(f.type) + '"'}>`;
      const input = field.querySelector('input');
      input.value = data[f.key] || '';
      input.addEventListener('input', () => { data[f.key] = input.value; touched.add(f.key); scheduleRender(); });
    }
    form.appendChild(field);
  });
}

function inputmodeFor(type) {
  return { tel: 'tel', email: 'email', url: 'url', number: 'decimal' }[type] || 'text';
}

function showFieldErrors(errors) {
  document.querySelectorAll('#typeForm .field').forEach((fieldEl) => {
    const key = fieldEl.dataset.key;
    fieldEl.classList.toggle('has-error', !!errors[key]);
    let msg = fieldEl.querySelector('.field-error');
    if (errors[key]) {
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'field-error';
        fieldEl.appendChild(msg);
      }
      msg.textContent = errors[key];
    } else if (msg) {
      msg.remove();
    }
  });
}

// ---------- Design-Controls ----------

function makeDotIcon(type) {
  const shapes = {
    'square': '<rect x="2" y="2" width="8" height="8"/><rect x="12" y="2" width="8" height="8"/><rect x="2" y="12" width="8" height="8"/><rect x="12" y="12" width="8" height="8"/>',
    'dots': '<circle cx="6" cy="6" r="4"/><circle cx="16" cy="6" r="4"/><circle cx="6" cy="16" r="4"/><circle cx="16" cy="16" r="4"/>',
    'rounded': '<rect x="2" y="2" width="8" height="8" rx="2.5"/><rect x="12" y="2" width="8" height="8" rx="2.5"/><rect x="2" y="12" width="8" height="8" rx="2.5"/><rect x="12" y="12" width="8" height="8" rx="2.5"/>',
    'extra-rounded': '<rect x="2" y="2" width="8" height="8" rx="4"/><rect x="12" y="2" width="8" height="8" rx="4"/><rect x="2" y="12" width="8" height="8" rx="4"/><rect x="12" y="12" width="8" height="8" rx="4"/>',
    'classy': '<path d="M2 6a4 4 0 0 1 4-4h4v8H2zM12 2h4a4 4 0 0 1 4 4v4h-8zM2 12h8v8H6a4 4 0 0 1-4-4zM12 12h8v4a4 4 0 0 1-4 4h-4z"/>',
    'classy-rounded': '<path d="M2 7a5 5 0 0 1 5-5h3v8H2zM12 2h3a5 5 0 0 1 5 5v3h-8zM2 12h8v8H7a5 5 0 0 1-5-5zM12 12h8v3a5 5 0 0 1-5 5h-3z"/>',
  };
  return `<svg viewBox="0 0 22 22" fill="currentColor">${shapes[type]}</svg>`;
}

function makeCornerIcon(type) {
  const shapes = {
    'square': '<path d="M2 2h18v18H2zm4 4v10h10V6z"/><rect x="8" y="8" width="6" height="6"/>',
    'extra-rounded': '<path d="M8 2h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6zm0 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/><rect x="8" y="8" width="6" height="6" rx="2"/>',
    'dot': '<path d="M11 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/><circle cx="11" cy="11" r="3"/>',
  };
  return `<svg viewBox="0 0 22 22" fill="currentColor">${shapes[type]}</svg>`;
}

function makeCornerDotIcon(type) {
  const shapes = {
    'square': '<rect x="5" y="5" width="12" height="12"/>',
    'dot': '<circle cx="11" cy="11" r="6.5"/>',
    'extra-rounded': '<rect x="5" y="5" width="12" height="12" rx="5"/>',
  };
  return `<svg viewBox="0 0 22 22" fill="currentColor">${shapes[type]}</svg>`;
}

const STYLE_PICKERS = [
  { el: '#dotsTypePicker', key: 'dotsType', options: ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'], icon: makeDotIcon,
    labels: { 'square': 'Eckig', 'rounded': 'Rund', 'dots': 'Punkte', 'classy': 'Classy', 'classy-rounded': 'Classy+', 'extra-rounded': 'Extra rund' } },
  { el: '#cornerSquarePicker', key: 'cornersSquareType', options: ['square', 'extra-rounded', 'dot'], icon: makeCornerIcon,
    labels: { 'square': 'Eckig', 'extra-rounded': 'Rund', 'dot': 'Kreis' } },
  { el: '#cornerDotPicker', key: 'cornersDotType', options: ['square', 'dot', 'extra-rounded'], icon: makeCornerDotIcon,
    labels: { 'square': 'Eckig', 'dot': 'Kreis', 'extra-rounded': 'Rund' } },
];

function renderStylePickers() {
  STYLE_PICKERS.forEach((p) => {
    const wrap = $(p.el);
    wrap.innerHTML = '';
    p.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'style-opt' + (state.design[p.key] === opt ? ' active' : '');
      btn.title = p.labels[opt];
      btn.innerHTML = `${p.icon(opt)}<span>${p.labels[opt]}</span>`;
      btn.addEventListener('click', () => {
        state.design[p.key] = opt;
        wrap.querySelectorAll('.style-opt').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        scheduleRender();
      });
      wrap.appendChild(btn);
    });
  });
}

function renderPresets() {
  const wrap = $('#presetGrid');
  wrap.innerHTML = '';
  PRESETS.forEach((p) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset';
    const d = p.design;
    const fg = d.dotsColorMode === 'gradient'
      ? `linear-gradient(${d.dotsGradRot ?? 45}deg, ${d.dotsGradA}, ${d.dotsGradB})`
      : d.dotsColor;
    const bg = d.bgMode === 'gradient' ? `linear-gradient(90deg, ${d.bgGradA}, ${d.bgGradB})` : d.bgColor;
    btn.innerHTML = `<span class="preset-swatch" style="background:${bg}"><span class="preset-dot" style="background:${fg}"></span></span><span>${p.label}</span>`;
    btn.addEventListener('click', () => {
      Object.assign(state.design, p.design);
      syncControlsFromDesign();
      scheduleRender();
      toast(`Vorlage „${p.label}“ angewendet`);
    });
    wrap.appendChild(btn);
  });
}

function renderIconGrid() {
  const wrap = $('#iconGrid');
  wrap.innerHTML = '';
  BUILT_IN_ICONS.forEach((ic) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-opt';
    btn.title = ic.label;
    btn.innerHTML = ic.svg;
    btn.addEventListener('click', () => {
      const url = iconToDataUrl(ic.svg);
      const isActive = state.design.logo === url;
      state.design.logo = isActive ? null : url;
      wrap.querySelectorAll('.icon-opt').forEach((b) => b.classList.remove('active'));
      if (!isActive) btn.classList.add('active');
      onLogoChanged();
    });
    wrap.appendChild(btn);
  });
}

function renderFramePicker() {
  const wrap = $('#framePicker');
  wrap.innerHTML = '';
  FRAMES.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frame-opt' + (state.design.frame === f.id ? ' active' : '');
    btn.dataset.frame = f.id;
    btn.innerHTML = `<span class="frame-mini" data-frame="${f.id}"><i></i></span><span>${f.label}</span>`;
    btn.addEventListener('click', () => {
      state.design.frame = f.id;
      wrap.querySelectorAll('.frame-opt').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyVisibility();
      updateFramePreview();
    });
    wrap.appendChild(btn);
  });
}

function onLogoChanged() {
  const d = state.design;
  $('#logoRemove').hidden = !d.logo;
  const hint = $('#logoEcHint');
  if (d.logo && d.imageMode === 'logo' && (d.ecLevel === 'L' || d.ecLevel === 'M')) {
    d.ecLevel = 'H';
    syncSegButtons();
    hint.hidden = false;
  } else if (!d.logo) {
    hint.hidden = true;
  }
  scheduleRender();
}

// Segmented Buttons (dotsColorMode, bgMode, ecLevel)
function bindSegButtons() {
  document.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { group, value } = btn.dataset;
      state.design[group] = group === 'ecLevel' ? value : value;
      document.querySelectorAll(`.seg-btn[data-group="${group}"]`).forEach((b) => b.classList.toggle('active', b === btn));
      applyVisibility();
      scheduleRender();
    });
  });
}

function syncSegButtons() {
  document.querySelectorAll('.seg-btn').forEach((btn) => {
    const { group, value } = btn.dataset;
    btn.classList.toggle('active', String(state.design[group]) === value);
  });
}

// Direkte Controls: id → design-key (+ Anzeige-Formatter für Ranges)
const CONTROL_BINDINGS = [
  { id: 'dotsColor', key: 'dotsColor' },
  { id: 'dotsGradA', key: 'dotsGradA' },
  { id: 'dotsGradB', key: 'dotsGradB' },
  { id: 'dotsGradType', key: 'dotsGradType' },
  { id: 'dotsGradRot', key: 'dotsGradRot', val: 'dotsGradRotVal', fmt: (v) => `${v}°`, num: true },
  { id: 'cornersSquareColor', key: 'cornersSquareColor' },
  { id: 'cornersDotColor', key: 'cornersDotColor' },
  { id: 'bgColor', key: 'bgColor' },
  { id: 'bgGradA', key: 'bgGradA' },
  { id: 'bgGradB', key: 'bgGradB' },
  { id: 'logoSize', key: 'logoSize', val: 'logoSizeVal', fmt: (v) => `${v} %`, num: true },
  { id: 'logoMargin', key: 'logoMargin', val: 'logoMarginVal', fmt: (v) => `${v} px`, num: true },
  { id: 'artDotSize', key: 'artDotSize', val: 'artDotSizeVal', fmt: (v) => `${v} %`, num: true },
  { id: 'artWash', key: 'artWash', val: 'artWashVal', fmt: (v) => `${v} %`, num: true },
  { id: 'qrMargin', key: 'qrMargin', val: 'qrMarginVal', fmt: (v) => `${v} px`, num: true },
  { id: 'frameText', key: 'frameText' },
  { id: 'frameColor', key: 'frameColor' },
  { id: 'frameTextColor', key: 'frameTextColor' },
];

function bindControls() {
  CONTROL_BINDINGS.forEach((b) => {
    const el = document.getElementById(b.id);
    el.addEventListener('input', () => {
      state.design[b.key] = b.num ? Number(el.value) : el.value;
      if (b.val) document.getElementById(b.val).textContent = b.fmt(el.value);
      if (b.key.startsWith('frame')) updateFramePreview();
      scheduleRender();
    });
  });

  $('#cornersCustom').addEventListener('change', (e) => {
    state.design.cornersCustom = e.target.checked;
    applyVisibility();
    scheduleRender();
  });
  $('#hideBgDots').addEventListener('change', (e) => {
    state.design.hideBgDots = e.target.checked;
    scheduleRender();
  });

  $('#logoUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('Bild ist zu groß (max. 2 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      state.design.logo = reader.result;
      document.querySelectorAll('#iconGrid .icon-opt').forEach((b) => b.classList.remove('active'));
      onLogoChanged();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  $('#logoRemove').addEventListener('click', () => {
    state.design.logo = null;
    document.querySelectorAll('#iconGrid .icon-opt').forEach((b) => b.classList.remove('active'));
    onLogoChanged();
  });
}

function syncControlsFromDesign() {
  const d = state.design;
  CONTROL_BINDINGS.forEach((b) => {
    const el = document.getElementById(b.id);
    el.value = d[b.key];
    if (b.val) document.getElementById(b.val).textContent = b.fmt(d[b.key]);
  });
  $('#cornersCustom').checked = d.cornersCustom;
  $('#hideBgDots').checked = d.hideBgDots;
  syncSegButtons();
  renderStylePickers();
  renderFramePicker();
  $('#logoRemove').hidden = !d.logo;
  applyVisibility();
  updateFramePreview();
}

function applyVisibility() {
  const d = state.design;
  const values = {
    dotsColorMode: d.dotsColorMode,
    bgMode: d.bgMode,
    cornersCustom: String(d.cornersCustom),
    frameHasText: String(frameById(d.frame).hasText),
    imageMode: d.imageMode,
  };
  document.querySelectorAll('[data-show]').forEach((el) => {
    const [key, expected] = el.dataset.show.split(':');
    el.hidden = values[key] !== expected;
  });
}

function updateContrastHint() {
  const d = state.design;
  const hint = $('#contrastHint');
  if (d.bgMode === 'transparent' || artActive()) { hint.hidden = true; return; }
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const conv = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * conv(n >> 16) + 0.7152 * conv((n >> 8) & 255) + 0.0722 * conv(n & 255);
  };
  const fg = d.dotsColorMode === 'gradient' ? d.dotsGradA : d.dotsColor;
  const bg = d.bgMode === 'gradient' ? d.bgGradA : d.bgColor;
  const l1 = Math.max(lum(fg), lum(bg));
  const l2 = Math.min(lum(fg), lum(bg));
  hint.hidden = (l1 + 0.05) / (l2 + 0.05) >= 2;
}

function updateFramePreview() {
  const d = state.design;
  const frame = frameById(d.frame);
  const el = $('#previewFrame');
  el.dataset.frame = d.frame;
  el.style.setProperty('--frame-color', d.frameColor);
  el.style.setProperty('--frame-text-color', d.frameTextColor);
  const label = $('#previewFrameLabel');
  label.hidden = !frame.hasText;
  label.textContent = (d.frameText || '').trim() || 'SCAN MICH';
}

// ---------- Export ----------

async function makeExportBlob(format, size) {
  const d = state.design;

  if (format === 'svg' && artActive()) {
    toast('SVG geht im Modus „Bild im Code“ nicht — PNG wird verwendet');
    format = 'png';
  }

  let qrSource;
  if (artActive()) {
    qrSource = await renderArtQr(document.createElement('canvas'), state.payload, d, size);
  } else {
    const exportQr = new QRCodeStyling(qrOptions(state.payload, size));
    if (format === 'svg') {
      return { blob: await exportQr.getRawData('svg'), ext: 'svg' };
    }
    const pngBlob = await exportQr.getRawData('png');
    const img = new Image();
    const url = URL.createObjectURL(pngBlob);
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    URL.revokeObjectURL(url);
    qrSource = img;
  }

  let canvas = composeFrame(qrSource, size, {
    frame: d.frame, frameText: d.frameText, frameColor: d.frameColor, frameTextColor: d.frameTextColor,
  });

  if (format === 'jpeg') {
    const flat = document.createElement('canvas');
    flat.width = canvas.width; flat.height = canvas.height;
    const ctx = flat.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    canvas = flat;
  }

  const mime = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }[format];
  const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
  return { blob, ext: format === 'jpeg' ? 'jpg' : format };
}

function ensureValid() {
  if (!state.valid) {
    toast('Bitte zuerst die Pflichtfelder ausfüllen');
    return false;
  }
  return true;
}

function saveToHistory() {
  const type = typeById(state.type);
  const data = dataFor(state.type);
  addHistoryEntry({ typeId: state.type, label: type.summary(data), data: { ...data }, design: { ...state.design } });
  renderHistory();
}

async function doDownload() {
  if (!ensureValid()) return;
  const format = $('#exportFormat').value;
  const size = Number($('#exportSize').value);
  try {
    const { blob, ext } = await makeExportBlob(format, size);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${state.type}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    saveToHistory();
    toast('Download gestartet');
  } catch (err) {
    console.error(err);
    toast('Export fehlgeschlagen');
  }
}

async function doCopy() {
  if (!ensureValid()) return;
  try {
    const { blob } = await makeExportBlob('png', 1024);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    saveToHistory();
    toast('Als Bild kopiert');
  } catch (err) {
    console.error(err);
    toast('Kopieren wird von diesem Browser nicht unterstützt');
  }
}

async function doShare() {
  if (!ensureValid()) return;
  try {
    const { blob } = await makeExportBlob('png', 1024);
    const file = new File([blob], 'qr-code.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'QR-Code' });
      saveToHistory();
    } else {
      toast('Teilen wird hier nicht unterstützt');
    }
  } catch (err) {
    if (err.name !== 'AbortError') { console.error(err); toast('Teilen fehlgeschlagen'); }
  }
}

// ---------- Verlauf ----------

function renderHistory() {
  const list = loadHistory();
  const ul = $('#historyList');
  ul.innerHTML = '';
  $('#historyEmpty').hidden = list.length > 0;
  $('#historyClear').hidden = list.length === 0;

  list.forEach((entry) => {
    const type = typeById(entry.typeId);
    if (!type) return;
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <span class="history-icon">${type.icon}</span>
      <div class="history-info">
        <span class="history-label"></span>
        <span class="history-date">${new Date(entry.ts).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>
      <button type="button" class="icon-btn history-restore" title="Wiederherstellen">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
      <button type="button" class="icon-btn history-delete" title="Löschen">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 15H6L5 6m5 5v6m4-6v6"/></svg>
      </button>`;
    li.querySelector('.history-label').textContent = entry.label;
    li.querySelector('.history-restore').addEventListener('click', () => restoreEntry(entry));
    li.querySelector('.history-delete').addEventListener('click', () => {
      removeHistoryEntry(entry.id);
      renderHistory();
    });
    ul.appendChild(li);
  });
}

function restoreEntry(entry) {
  state.type = entry.typeId;
  state.dataByType[entry.typeId] = { ...entry.data };
  state.design = { ...defaultDesign(), ...entry.design };
  touched = new Set(Object.keys(entry.data));
  renderTypeChips();
  renderForm();
  syncControlsFromDesign();
  renderPreview();
  toast('Wiederhergestellt');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Theme & Toast ----------

function initTheme() {
  const stored = localStorage.getItem('qrstudio.theme');
  const preferred = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = preferred;
  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('qrstudio.theme', next);
  });
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------- Init ----------

initTheme();
renderTypeChips();
renderForm();
renderStylePickers();
renderPresets();
renderIconGrid();
renderFramePicker();
bindSegButtons();
bindControls();
syncControlsFromDesign();
renderHistory();
renderPreview();

$('#btnDownload').addEventListener('click', doDownload);
$('#btnCopy').addEventListener('click', doCopy);
$('#btnShare').addEventListener('click', doShare);
$('#historyClear').addEventListener('click', () => {
  if (confirm('Ganzen Verlauf löschen?')) {
    clearHistory();
    renderHistory();
  }
});
if (navigator.canShare) $('#btnShare').hidden = false;

// Mobil: FAB zeigen, solange die Vorschau nicht im Bild ist
const previewCard = document.querySelector('.preview-card');
new IntersectionObserver(([entry]) => {
  previewInView = entry.isIntersecting;
  updateFab();
}, { threshold: 0.2 }).observe(previewCard);
$('#fabPreview').addEventListener('click', () => previewCard.scrollIntoView({ behavior: 'smooth', block: 'start' }));
