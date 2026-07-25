// Rahmen-Vorlagen: Live-Vorschau via CSS-Klassen, Export via Canvas-Komposition.

export const FRAMES = [
  { id: 'none', label: 'Ohne', hasText: false },
  { id: 'label-bottom', label: 'Label unten', hasText: true },
  { id: 'card', label: 'Karte', hasText: true },
  { id: 'badge-top', label: 'Badge oben', hasText: true },
];

export const frameById = (id) => FRAMES.find((f) => f.id === id) || FRAMES[0];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Komponiert das QR-Bild in einen Rahmen.
 * @param {HTMLImageElement} qrImg gerendertes QR-Bild
 * @param {number} size QR-Kantenlänge in px
 * @param {{frame:string, frameText:string, frameColor:string, frameTextColor:string, bg:string|null}} opts
 * @returns {HTMLCanvasElement}
 */
export function composeFrame(qrImg, size, opts) {
  const { frame, frameText, frameColor, frameTextColor } = opts;
  const pad = Math.round(size * 0.06);
  const labelH = Math.round(size * 0.16);
  const radius = Math.round(size * 0.06);
  const font = (px) => `700 ${px}px -apple-system, "Segoe UI", Roboto, sans-serif`;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const text = (frameText || '').trim() || 'SCAN MICH';

  if (frame === 'label-bottom') {
    canvas.width = size + pad * 2;
    canvas.height = size + pad * 2 + labelH + pad;
    ctx.fillStyle = frameColor;
    roundRect(ctx, 0, 0, canvas.width, canvas.height, radius);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, pad, pad, size, size, Math.round(radius * 0.7));
    ctx.fill();
    ctx.drawImage(qrImg, pad, pad, size, size);
    ctx.fillStyle = frameTextColor;
    ctx.font = font(Math.round(labelH * 0.52));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, size + pad * 2 + labelH / 2);
  } else if (frame === 'card') {
    const cardPad = Math.round(size * 0.09);
    canvas.width = size + cardPad * 2;
    canvas.height = size + cardPad * 2 + labelH;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 0, 0, canvas.width, canvas.height, radius);
    ctx.fill();
    ctx.lineWidth = Math.max(2, Math.round(size * 0.012));
    ctx.strokeStyle = frameColor;
    roundRect(ctx, ctx.lineWidth / 2, ctx.lineWidth / 2, canvas.width - ctx.lineWidth, canvas.height - ctx.lineWidth, radius);
    ctx.stroke();
    ctx.drawImage(qrImg, cardPad, cardPad, size, size);
    ctx.fillStyle = frameColor;
    ctx.font = font(Math.round(labelH * 0.48));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, size + cardPad + labelH / 2 + cardPad / 2);
  } else if (frame === 'badge-top') {
    canvas.width = size + pad * 2;
    canvas.height = size + pad * 2 + labelH + pad;
    // Badge-Pill oben
    const badgeW = Math.min(canvas.width * 0.8, Math.max(size * 0.5, text.length * labelH * 0.34));
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 0, labelH / 2, canvas.width, canvas.height - labelH / 2, radius);
    ctx.fill();
    ctx.lineWidth = Math.max(2, Math.round(size * 0.012));
    ctx.strokeStyle = frameColor;
    roundRect(ctx, ctx.lineWidth / 2, labelH / 2 + ctx.lineWidth / 2, canvas.width - ctx.lineWidth, canvas.height - labelH / 2 - ctx.lineWidth, radius);
    ctx.stroke();
    ctx.fillStyle = frameColor;
    roundRect(ctx, (canvas.width - badgeW) / 2, 0, badgeW, labelH, labelH / 2);
    ctx.fill();
    ctx.fillStyle = frameTextColor;
    ctx.font = font(Math.round(labelH * 0.5));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, labelH / 2);
    ctx.drawImage(qrImg, pad, labelH / 2 + pad, size, size);
  } else {
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(qrImg, 0, 0, size, size);
  }
  return canvas;
}
