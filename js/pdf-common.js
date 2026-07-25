/* Alleskonverter — gemeinsame PDF-Helfer (pdf.js + pdf-lib).
   Seiten laden vendor/pdf.min.js und vendor/pdf-lib.min.js vor diesem Skript. */
window.AK = window.AK || {};

if(window.pdfjsLib){
  pdfjsLib.GlobalWorkerOptions.workerSrc = AK.base + 'vendor/pdf.worker.min.js';
}

/* „1-3, 8“ → [0,1,2,7]; leer → alle Seiten */
AK.parseRanges = function(str, max){
  if(!str || !str.trim()) return Array.from({length:max},(_,i)=>i);
  const out = [];
  for(const part of str.split(',')){
    const m = part.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if(!m) continue;
    let a = +m[1], b = m[2] ? +m[2] : a;
    if(a > b) [a,b] = [b,a];
    for(let p = Math.max(1,a); p <= Math.min(max,b); p++) if(!out.includes(p-1)) out.push(p-1);
  }
  return out.length ? out : Array.from({length:max},(_,i)=>i);
};

/* pdf.js-Seite auf Canvas rendern (scale = dpi/72) */
AK.renderPage = async function(pdfjsDoc, pageIndex, scale){
  const page = await pdfjsDoc.getPage(pageIndex + 1);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  const size = page.getViewport({ scale: 1 });
  page.cleanup();
  return { canvas, width: size.width, height: size.height };
};

/* Canvas freigeben (Speicher) */
AK.freeCanvas = function(canvas){
  canvas.width = canvas.height = 0;
};

/* Datei einlesen und mit pdf.js öffnen; wirft PasswordException weiter */
AK.openWithPdfjs = function(bytes, password){
  return pdfjsLib.getDocument({ data: bytes.slice(), password: password || '' }).promise;
};
