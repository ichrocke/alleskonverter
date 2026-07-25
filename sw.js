/* Alleskonverter — Service Worker.
   Ziel: die Website funktioniert nach dem ersten Besuch vollständig offline.

   Strategien:
   • HTML, eigenes CSS/JS  → Netz zuerst (Änderungen kommen sofort an, Cache als Rückfall)
   • Bibliotheken, Schriften, Bilder → Cache zuerst (unveränderlich, spart Ladezeit)
   • ffmpeg (~32 MB), Texterkennung (~19 MB)
                           → nur bei Bedarf, werden nach dem ersten Einsatz behalten
*/
const VERSION = '2026-07-26b';
const CACHE = 'alleskonverter-' + VERSION;

/* Beim Installieren: Grundgerüst und alle Bibliotheken mitnehmen (~5 MB).
   Die Seitenliste kommt aus der sitemap.xml, damit sie nicht doppelt gepflegt wird. */
const SHELL = [
  '/',
  '/css/base.css',
  '/css/tools.css',
  '/js/ui.js',
  '/js/dropzone.js',
  '/js/filelist.js',
  '/js/pdf-common.js',
  '/js/hub.js',
  '/js/uebergabe.js',
  '/js/einstellungen.js',
  '/js/weiter.js',
  '/manifest.webmanifest',
  '/assets/favicon.png',
  '/assets/apple-touch-icon.png',
  '/assets/icon-192.png',
  '/assets/logo-header.webp',
  '/assets/logo-header.png',
  '/vendor/fonts/anton-v27-latin-regular.woff2',
  '/vendor/fonts/archivo-v25-latin-regular.woff2',
  '/vendor/fonts/archivo-v25-latin-500.woff2',
  '/vendor/fonts/archivo-v25-latin-600.woff2',
  '/vendor/fonts/archivo-v25-latin-700.woff2',
  '/vendor/fonts/ibm-plex-mono-v20-latin-regular.woff2',
  '/vendor/fonts/ibm-plex-mono-v20-latin-500.woff2',
  '/vendor/pdf-lib.min.js',
  '/vendor/pdf.min.js',
  '/vendor/pdf.worker.min.js',
  '/vendor/jszip.min.js',
  '/vendor/heic2any.min.js',
  '/vendor/mammoth.browser.min.js',
  '/vendor/marked.min.js',
  '/vendor/turndown.min.js',
  '/vendor/xlsx.full.min.js',
  '/tools/qr-code/css/style.css',
  '/tools/qr-code/css/paper-theme.css',
  '/tools/qr-code/vendor/qr-code-styling.js',
  '/tools/qr-code/js/app.js',
  '/tools/qr-code/js/payloads.js',
  '/tools/qr-code/js/presets.js',
  '/tools/qr-code/js/frames.js',
  '/tools/qr-code/js/history.js',
  '/tools/qr-code/js/artqr.js',
  '/vendor/js-yaml.min.js',
  '/vendor/pdf-lib-crypt.min.js',
];

/* Werkzeugseiten aus der sitemap.xml lesen — so wächst der Cache automatisch mit. */
async function seitenAusSitemap(){
  try{
    const res = await fetch('/sitemap.xml', { cache:'no-store' });
    const text = await res.text();
    return [...text.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(m => new URL(m[1]).pathname);
  }catch(_){
    return [];
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const seiten = await seitenAusSitemap();
    const alle = [...new Set([...SHELL, ...seiten])];
    // Einzeln ablegen: eine fehlende Datei soll nicht die ganze Installation kippen
    await Promise.all(alle.map(url =>
      cache.add(new Request(url, { cache:'reload' })).catch(() => {})
    ));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.filter(n => n.startsWith('alleskonverter-') && n !== CACHE)
                           .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* Beim Suchen im Cache die Versionskennung (?v=…) ignorieren —
   sonst gilt base.css?v=1 als andere Datei als base.css. */
const SUCHE = { ignoreSearch: true };

async function netzZuerst(request, cache){
  try{
    // 'no-cache' erzwingt eine Rückfrage beim Server, selbst wenn der
    // Browser-Cache die Datei noch für frisch hält.
    const res = await fetch(request, { cache: 'no-cache' });
    if(res && res.ok) cache.put(request, res.clone());
    return res;
  }catch(err){
    const treffer = await cache.match(request, SUCHE);
    if(treffer) return treffer;
    // Bei Seitenaufrufen ohne Netz und ohne Cache: Startseite anbieten
    if(request.mode === 'navigate'){
      const start = await cache.match('/', SUCHE);
      if(start) return start;
    }
    throw err;
  }
}

async function cacheZuerst(request, cache){
  const treffer = await cache.match(request, SUCHE);
  if(treffer) return treffer;
  const res = await fetch(request);
  if(res && res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if(request.method !== 'GET') return;

  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;   // nichts Fremdes anfassen

  const pfad = url.pathname;
  const eigenerCode = pfad.startsWith('/css/') || pfad.startsWith('/js/') ||
                      pfad.startsWith('/tools/qr-code/js/') || pfad.startsWith('/tools/qr-code/css/');
  const istSeite = request.mode === 'navigate' || pfad.endsWith('.html') || pfad.endsWith('/');

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return (istSeite || eigenerCode)
      ? netzZuerst(request, cache)
      : cacheZuerst(request, cache);
  })());
});
