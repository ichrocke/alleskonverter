/* Alleskonverter — gemeinsame Helfer.
   Bewusst klassische Skripte (kein ES-Modul), damit alles auch direkt
   über file:// per Doppelklick funktioniert. */
window.AK = window.AK || {};

/* Basis-Pfad des Projekts, abgeleitet vom Pfad dieses Skripts (js/ui.js) */
AK.base = (function(){
  const src = document.currentScript && document.currentScript.src || '';
  return src.replace(/js\/ui\.js.*$/, '');
})();

AK.$ = s => document.querySelector(s);
AK.$$ = s => Array.from(document.querySelectorAll(s));

AK.fmtBytes = n => n < 1024*1024 ? (n/1024).toFixed(0)+' KB' : (n/1048576).toFixed(1)+' MB';

AK.esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

AK.log = function(msg, bad){
  const el = document.getElementById('log');
  if(!el) return;
  el.innerHTML += (bad ? `<b>${AK.esc(msg)}</b>` : AK.esc(msg)) + '\n';
  el.scrollTop = el.scrollHeight;
};
AK.logClear = function(){
  const el = document.getElementById('log');
  if(el) el.textContent = '';
};

AK.bar = function(fraction){
  const el = document.getElementById('bar');
  if(el) el.style.width = (Math.max(0, Math.min(1, fraction)) * 100) + '%';
};

AK.stamp = function(on){
  const el = document.getElementById('stamp');
  if(el) el.classList.toggle('on', !!on);
};

/* Download-Link unter der Aktionsfläche anbieten; alter Link/Blob wird ersetzt */
AK._blobUrls = [];
AK.offerDownload = function(blob, filename, label){
  AK.clearDownloads();
  const url = URL.createObjectURL(blob);
  AK._blobUrls.push(url);
  const a = document.createElement('a');
  a.className = 'download';
  a.href = url; a.download = filename;
  a.textContent = label || 'Herunterladen';
  const anchor = document.getElementById('stamp') || document.getElementById('log');
  anchor.before(a);
  return a;
};
AK.clearDownloads = function(){
  AK._blobUrls.forEach(u => URL.revokeObjectURL(u));
  AK._blobUrls = [];
  AK.$$('a.download').forEach(a => a.remove());
};

/* Mehrere Dateien als ZIP anbieten (braucht vendor/jszip.min.js) */
AK.offerZip = async function(files, zipName, label){
  const zip = new JSZip();
  for(const f of files) zip.file(f.name, f.data);
  const blob = await zip.generateAsync({ type:'blob' });
  return AK.offerDownload(blob, zipName, label || 'ZIP herunterladen');
};

/* Kann der Browser dieses Format über Canvas erzeugen? (z. B. image/webp, image/avif) */
AK.canEncode = function(mime){
  return new Promise(resolve => {
    const c = document.createElement('canvas');
    c.width = c.height = 2;
    c.toBlob(b => resolve(!!b && b.type === mime), mime, 0.8);
  });
};

/* Dateiname: Endung tauschen bzw. anhängen */
AK.withExt = function(name, ext){
  return name.replace(/\.[^.\/]+$/, '') + '.' + ext;
};
AK.ensureExt = function(name, ext){
  const re = new RegExp('\\.' + ext + '$', 'i');
  name = (name || '').trim();
  return re.test(name) ? name : name + '.' + ext;
};
