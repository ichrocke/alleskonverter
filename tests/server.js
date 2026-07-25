/* Kleiner Webserver für Testläufe — mit gzip, damit die Lighthouse-Messung
   im CI der Auslieferung durch den echten Server entspricht. Ohne Kompression
   wirken die Werkzeugseiten dort viel langsamer, als sie tatsächlich sind. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const WURZEL = path.resolve(__dirname, '..');
const PORT = +(process.argv[2] || 8080);

const TYPEN = {
  '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json',
  '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.woff2':'font/woff2', '.wasm':'application/wasm',
  '.xml':'application/xml', '.txt':'text/plain', '.onnx':'application/octet-stream',
  '.gz':'application/gzip', '.traineddata':'application/octet-stream',
};
/* Dasselbe Muster wie in der .htaccess */
const KOMPRIMIERBAR = /^(text\/|application\/(javascript|json|xml|manifest|wasm)|image\/svg)/;

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if(p.endsWith('/')) p += 'index.html';
  const datei = path.join(WURZEL, p);
  if(!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()){
    res.writeHead(404); return res.end('nicht gefunden');
  }
  const typ = TYPEN[path.extname(datei)] || 'application/octet-stream';
  const inhalt = fs.readFileSync(datei);
  const willGzip = /gzip/.test(req.headers['accept-encoding'] || '') && KOMPRIMIERBAR.test(typ);
  if(willGzip){
    const gz = zlib.gzipSync(inhalt);
    res.writeHead(200, { 'Content-Type':typ, 'Content-Encoding':'gzip', 'Content-Length':gz.length });
    return res.end(gz);
  }
  res.writeHead(200, { 'Content-Type':typ, 'Content-Length':inhalt.length });
  res.end(inhalt);
}).listen(PORT, () => console.log('Testserver auf Port ' + PORT));
