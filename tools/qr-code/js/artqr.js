// „Bild im Code“ (Halftone-QR): Das Bild füllt den ganzen Code, Datenmodule
// werden als kleine Punkte darüber gerastert (dunkle Module → dunkler Punkt,
// helle Module → heller Punkt), Finder- und Alignment-Muster als gestylte
// Ringe. Fehlerkorrektur ist immer H, Scanner lesen die Modulzentren.

import qrcode from '../vendor/qrcode-core.js';
import { stringToBytes } from '../vendor/qrcode-utf8.js';

qrcode.stringToBytes = stringToBytes;

const imageCache = new Map();

function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }));
  }
  return imageCache.get(src);
}

// Alignment-Pattern-Zentren nach Nayuki-Algorithmus
function alignmentCenters(version, moduleCount) {
  if (version === 1) return [];
  const num = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (num * 2 - 2)) * 2;
  const positions = [6];
  for (let pos = moduleCount - 7; positions.length < num; pos -= step) positions.splice(1, 0, pos);
  const centers = [];
  for (const r of positions) {
    for (const c of positions) {
      // Zentren, die mit den drei Findern kollidieren, überspringen
      const inFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= moduleCount - 9) || (r >= moduleCount - 9 && c <= 8);
      if (!inFinder) centers.push([r, c]);
    }
  }
  return centers;
}

const lum = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

// Farbe abdunkeln, bis Luminanz <= target
function darken([r, g, b], target) {
  const l = lum(r, g, b);
  if (l <= target) return [r, g, b];
  const f = l === 0 ? 0 : target / l;
  return [r * f, g * f, b * f].map(Math.round);
}

// Farbe aufhellen (Richtung Weiß), bis Luminanz >= target
function lighten([r, g, b], target) {
  const l = lum(r, g, b);
  if (l >= target) return [r, g, b];
  const t = (target - l) / (1 - l);
  return [r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t].map(Math.round);
}

const css = ([r, g, b]) => `rgb(${r},${g},${b})`;
const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFinder(ctx, x, y, m, style, dotStyle, color, dotColor, bg) {
  // Untergrund (Separator + Quiet-Bereich des Finders) freistellen
  ctx.fillStyle = bg;
  roundRect(ctx, x - m * 0.6, y - m * 0.6, m * 8.2, m * 8.2, m * 1.6);
  ctx.fill();

  ctx.fillStyle = color;
  if (style === 'dot') {
    ctx.beginPath();
    ctx.arc(x + 3.5 * m, y + 3.5 * m, 3.5 * m, 0, Math.PI * 2);
    ctx.arc(x + 3.5 * m, y + 3.5 * m, 2.5 * m, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
  } else {
    const r = style === 'square' ? 0.0001 : 2.2 * m;
    roundRect(ctx, x, y, 7 * m, 7 * m, r);
    ctx.fill();
    ctx.fillStyle = bg;
    roundRect(ctx, x + m, y + m, 5 * m, 5 * m, style === 'square' ? 0.0001 : 1.5 * m);
    ctx.fill();
  }
  // Zentrum (3x3)
  ctx.fillStyle = dotColor;
  if (dotStyle === 'dot') {
    ctx.beginPath();
    ctx.arc(x + 3.5 * m, y + 3.5 * m, 1.5 * m, 0, Math.PI * 2);
    ctx.fill();
  } else {
    roundRect(ctx, x + 2 * m, y + 2 * m, 3 * m, 3 * m, dotStyle === 'square' ? 0.0001 : m);
    ctx.fill();
  }
}

function drawAlignmentTarget(ctx, cx, cy, m, color, bg) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5 * m, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, 1.6 * m, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 0.8 * m, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Rendert einen Halftone-QR in das übergebene Canvas.
 * design nutzt: logo (Bildquelle), artDotSize (% Modulgröße), artWash (% Aufhellung),
 * artColorMode ('image'|'mono'), dots-/corner-Farben, bgColor/bgMode, qrMargin.
 */
export async function renderArtQr(canvas, payload, design, sizePx) {
  const img = await loadImage(design.logo);

  const qr = qrcode(0, 'H');
  qr.addData(payload, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const version = (n - 17) / 4;

  const margin = Math.round(design.qrMargin * (sizePx / 300));
  const area = sizePx - margin * 2;
  const m = area / n;

  const bg = design.bgMode === 'color' ? design.bgColor : '#ffffff';
  const mono = design.artColorMode === 'mono';
  // Auch im Mono-Modus dunkel genug für Scanner-Binarisierung
  const darkBase = darken(hexToRgb(design.dotsColorMode === 'gradient' ? design.dotsGradA : design.dotsColor), 0.25);
  const cornerColor = design.cornersCustom ? design.cornersSquareColor
    : (design.dotsColorMode === 'gradient' ? design.dotsGradA : design.dotsColor);
  const cornerDotColor = design.cornersCustom ? design.cornersDotColor : cornerColor;

  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, sizePx, sizePx);

  // Bild cover-fit in den Code-Bereich
  const scale = Math.max(area / img.width, area / img.height);
  const iw = img.width * scale, ih = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(margin, margin, area, area);
  ctx.clip();
  ctx.drawImage(img, margin + (area - iw) / 2, margin + (area - ih) / 2, iw, ih);
  if (design.artWash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${design.artWash / 100})`;
    ctx.fillRect(margin, margin, area, area);
  }
  ctx.restore();

  // Bildfarben je Modul samplen (1 px pro Modul)
  const sampler = document.createElement('canvas');
  sampler.width = n; sampler.height = n;
  const sctx = sampler.getContext('2d', { willReadFrequently: true });
  const sscale = Math.max(n / img.width, n / img.height);
  sctx.fillStyle = '#ffffff';
  sctx.fillRect(0, 0, n, n);
  sctx.drawImage(img, (n - img.width * sscale) / 2, (n - img.height * sscale) / 2, img.width * sscale, img.height * sscale);
  if (design.artWash > 0) {
    sctx.fillStyle = `rgba(255,255,255,${design.artWash / 100})`;
    sctx.fillRect(0, 0, n, n);
  }
  const pixels = sctx.getImageData(0, 0, n, n).data;

  // Datenmodule als Halftone-Punkte. Bei dichten Codes (viele Module) wird
  // die Punktgröße automatisch angehoben, sonst reicht die Auflösung echter
  // Kameras nicht mehr zum Scannen (verifiziert per Kamera-Simulation).
  const minDot = n >= 45 ? 70 : n >= 33 ? 65 : 0;
  const dotR = (m * (Math.max(design.artDotSize, minDot) / 100)) / 2;
  const aligns = alignmentCenters(version, n);
  const skip = (r, c) => {
    if ((r <= 7 && c <= 7) || (r <= 7 && c >= n - 8) || (r >= n - 8 && c <= 7)) return true;
    return aligns.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2);
  };
  // Timing- und Formatinfo-Module sind für Scanner kritisch → größer zeichnen
  const boosted = (r, c) =>
    r === 6 || c === 6 ||
    (r === 8 && (c <= 8 || c >= n - 8)) ||
    (c === 8 && (r <= 8 || r >= n - 8));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (skip(r, c)) continue;
      const i = (r * n + c) * 4;
      const sample = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const dark = qr.isDark(r, c);
      const color = dark
        ? (mono ? darkBase : darken(sample, 0.18))
        : (mono ? [255, 255, 255] : lighten(sample, 0.95));
      // In sehr hellen Bildbereichen gibt es kein Bilddetail zu bewahren —
      // dunkle Module dort fast auf volle Modulgröße ziehen (Kontrast-Boost).
      const sampleLum = lum(sample[0], sample[1], sample[2]);
      let radius = boosted(r, c) ? Math.max(dotR, m * 0.42) : dotR;
      if (dark && sampleLum > 0.82) radius = Math.max(radius, m * 0.46);
      const cx = margin + (c + 0.5) * m, cy = margin + (r + 0.5) * m;
      ctx.fillStyle = css(color);
      ctx.beginPath();
      if (n >= 45) {
        // Dichte Codes: abgerundete Quadrate — mehr Fläche pro Punkt als Kreise
        roundRect(ctx, cx - radius, cy - radius, radius * 2, radius * 2, radius * 0.4);
      } else {
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  // Finder (3 Ecken) und Alignment-Targets
  const fx = [[0, 0], [n - 7, 0], [0, n - 7]];
  for (const [c, r] of fx) {
    drawFinder(ctx, margin + c * m, margin + r * m, m,
      design.cornersSquareType, design.cornersDotType, cornerColor, cornerDotColor, bg);
  }
  for (const [r, c] of aligns) {
    drawAlignmentTarget(ctx, margin + (c + 0.5) * m, margin + (r + 0.5) * m, m, cornerColor, bg);
  }

  return canvas;
}
