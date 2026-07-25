/* Automatische Prüfung aller Werkzeuge.

   Startet einen kleinen Webserver für das Projekt, öffnet jede Werkzeugseite
   in einem echten Browser, schiebt eine Testdatei hinein und prüft, ob am Ende
   ein Download entsteht. Läuft lokal mit `npm test` und bei jedem Push über
   GitHub Actions.

   Werkzeuge, die erst eine große Bibliothek nachladen (ffmpeg, Texterkennung,
   Freistellen), werden nur auf Ladefähigkeit und Konsolenfehler geprüft —
   ihre Modelle wären für jeden Durchlauf zu schwer.
*/
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WURZEL = path.resolve(__dirname, '..');
const PORT = 8099;

const TYPEN = {
  '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json',
  '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.woff2':'font/woff2', '.wasm':'application/wasm',
  '.xml':'application/xml', '.txt':'text/plain', '.onnx':'application/octet-stream',
  '.gz':'application/gzip', '.traineddata':'application/octet-stream',
};

function server(){
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if(p.endsWith('/')) p += 'index.html';
    const datei = path.join(WURZEL, p);
    if(!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()){
      res.writeHead(404); return res.end('nicht gefunden');
    }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
    fs.createReadStream(datei).pipe(res);
  }).listen(PORT);
}

/* ---------- Testdateien ---------- */
const B = s => Buffer.from(s, 'latin1').toString('base64');

function pdf(seiten, beschriftung){
  const objs = [];
  const kids = Array.from({length:seiten}, (_,i) => `${3+i*2} 0 R`).join(' ');
  const schrift = 3 + seiten*2;
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${seiten} >>`);
  for(let i = 0; i < seiten; i++){
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${4+i*2} 0 R /Resources << /Font << /F1 ${schrift} 0 R >> >> >>`);
    const t = `BT /F1 36 Tf 72 750 Td (${beschriftung} ${i+1}) Tj ET`;
    objs.push(`<< /Length ${t.length} >>\nstream\n${t}\nendstream`);
  }
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let body = '%PDF-1.4\n';
  const pos = [];
  objs.forEach((o, n) => { pos.push(body.length); body += `${n+1} 0 obj\n${o}\nendobj\n`; });
  const xref = body.length;
  body += `xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;
  pos.forEach(o => { body += `${String(o).padStart(10,'0')} 00000 n \n`; });
  body += `trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return B(body);
}

/* 2×2-PNG, von Hand zusammengesetzt (keine Abhängigkeit nötig) */
function png(){
  const zlib = require('zlib');
  const b = Buffer.alloc(4);
  const chunk = (typ, daten) => {
    const c = Buffer.concat([Buffer.from(typ), daten]);
    b.writeUInt32BE(daten.length, 0);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(c) : crc32(c), 0);
    return Buffer.concat([Buffer.from(b), c, crc]);
  };
  function crc32(buf){
    let c, tabelle = [];
    for(let n = 0; n < 256; n++){ c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; tabelle[n] = c >>> 0; }
    let crc = 0xFFFFFFFF;
    for(const x of buf) crc = tabelle[(crc ^ x) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  const b32 = n => { const x = Buffer.alloc(4); x.writeUInt32BE(n, 0); return x; };
  const ihdr = Buffer.concat([b32(60), b32(60), Buffer.from([8,2,0,0,0])]);
  let roh = Buffer.alloc(0);
  for(let y = 0; y < 60; y++){
    const zeile = Buffer.alloc(1 + 60*3);
    for(let x = 0; x < 60; x++){
      const mitte = (x-30)**2 + (y-30)**2 < 400;
      zeile[1+x*3] = mitte ? 220 : 40; zeile[2+x*3] = mitte ? 80 : 120; zeile[3+x*3] = mitte ? 60 : 200;
    }
    roh = Buffer.concat([roh, zeile]);
  }
  const daten = Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(roh)), chunk('IEND', Buffer.alloc(0)),
  ]);
  return daten.toString('base64');
}

const CSV  = Buffer.from('Name;Stadt;Alter\nMüller;Köln;34\nSchäfer;München;28\n', 'utf8').toString('base64');
const MD   = Buffer.from('# Überschrift\n\nEin **Test**.\n', 'utf8').toString('base64');
const SRT  = Buffer.from('1\n00:00:01,000 --> 00:00:03,500\nErster Untertitel\n', 'utf8').toString('base64');
const TXT  = Buffer.from('Hallo Welt mit Umlauten: äöü\n', 'utf8').toString('base64');

/* docx: kleinstmögliches gültiges Dokument */
function docx(){
  const zlib = require('zlib');
  const dateien = [
    ['[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Testdokument mit Umlauten äöü</w:t></w:r></w:p></w:body></w:document>'],
  ];
  // ZIP ohne Kompression von Hand
  const lokale = [], zentrale = []; let offset = 0;
  function crc32(buf){
    let c, t = [];
    for(let n = 0; n < 256; n++){ c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    let crc = 0xFFFFFFFF;
    for(const x of buf) crc = t[(crc ^ x) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  for(const [name, inhalt] of dateien){
    const n = Buffer.from(name), d = Buffer.from(inhalt, 'utf8'), c = crc32(d);
    const lok = Buffer.alloc(30);
    lok.writeUInt32LE(0x04034b50,0); lok.writeUInt16LE(20,4); lok.writeUInt32LE(c,14);
    lok.writeUInt32LE(d.length,18); lok.writeUInt32LE(d.length,22); lok.writeUInt16LE(n.length,26);
    lokale.push(Buffer.concat([lok, n, d]));
    const zen = Buffer.alloc(46);
    zen.writeUInt32LE(0x02014b50,0); zen.writeUInt16LE(20,4); zen.writeUInt16LE(20,6);
    zen.writeUInt32LE(c,16); zen.writeUInt32LE(d.length,20); zen.writeUInt32LE(d.length,24);
    zen.writeUInt16LE(n.length,28); zen.writeUInt32LE(offset,42);
    zentrale.push(Buffer.concat([zen, n]));
    offset += 30 + n.length + d.length;
  }
  const zBuf = Buffer.concat(zentrale), lBuf = Buffer.concat(lokale);
  const ende = Buffer.alloc(22);
  ende.writeUInt32LE(0x06054b50,0); ende.writeUInt16LE(dateien.length,8); ende.writeUInt16LE(dateien.length,10);
  ende.writeUInt32LE(zBuf.length,12); ende.writeUInt32LE(lBuf.length,16);
  return Buffer.concat([lBuf, zBuf, ende]).toString('base64');
}

/* ---------- Was wird geprüft ---------- */
const PDF3 = pdf(3, 'Seite');
const PNG  = png();

const FAELLE = [
  { werkzeug:'pdf-zusammenfuegen', dateien:[['a.pdf', PDF3, 'application/pdf'], ['b.pdf', PDF3, 'application/pdf']] },
  { werkzeug:'pdf-aufteilen',      dateien:[['a.pdf', PDF3, 'application/pdf']] },
  { werkzeug:'pdf-bearbeiten',     dateien:[['a.pdf', PDF3, 'application/pdf']],
    vorher: p => p.waitForFunction(() => document.querySelectorAll('.tile').length > 0, {timeout:20000}) },
  { werkzeug:'pdf-zu-bild',        dateien:[['a.pdf', PDF3, 'application/pdf']] },
  // Bei einem winzigen Test-PDF ist der Hinweis „kaum kleiner“ korrekt, kein Fehler
  { werkzeug:'pdf-komprimieren',   dateien:[['a.pdf', PDF3, 'application/pdf']], hinweis_ok:true },
  { werkzeug:'pdf-stempeln',       dateien:[['a.pdf', PDF3, 'application/pdf']] },
  { werkzeug:'pdf-passwort',       dateien:[['a.pdf', PDF3, 'application/pdf']],
    vorher: async p => { await p.type('#pwUser', 'TestPasswort123'); } },
  { werkzeug:'pdf-text',           dateien:[['a.pdf', PDF3, 'application/pdf']] },
  { werkzeug:'bild-zu-pdf',        dateien:[['b.png', PNG, 'image/png']] },
  { werkzeug:'bild-konvertieren',  dateien:[['b.png', PNG, 'image/png']] },
  { werkzeug:'bild-zuschneiden',   dateien:[['b.png', PNG, 'image/png']] },
  { werkzeug:'bilder-zusammenfuegen', dateien:[['b.png', PNG, 'image/png'], ['c.png', PNG, 'image/png']] },
  { werkzeug:'favicon',            dateien:[['b.png', PNG, 'image/png']] },
  { werkzeug:'zip',                dateien:[['a.txt', TXT, 'text/plain'], ['b.txt', TXT, 'text/plain']] },
  { werkzeug:'tabellen',           dateien:[['t.csv', CSV, 'text/csv']] },
  { werkzeug:'word-zu-html',       dateien:[['d.docx', docx(), '']] },
  { werkzeug:'untertitel',         dateien:[['u.srt', SRT, 'text/plain']] },
  { werkzeug:'markdown-html',      dateien:[['t.md', MD, 'text/markdown']] },
  { werkzeug:'text-werkzeuge',     kein_download:true,
    vorher: async p => { await p.type('#input', 'Hallo Welt'); },
    pruefen: async p => {
      const v = await p.$eval('#output', e => e.value);
      if(v !== 'SGFsbG8gV2VsdA==') throw new Error('Base64 falsch: ' + v);
    } },
  // Schwergewichte: nur laden und auf Fehler prüfen
  { werkzeug:'medien',             nur_laden:true },
  { werkzeug:'medien-schneiden',   nur_laden:true },
  { werkzeug:'texterkennung',      nur_laden:true },
  { werkzeug:'hintergrund-entfernen', nur_laden:true },
  { werkzeug:'qr-code',            nur_laden:true,
    pruefen: async p => {
      await p.waitForSelector('#typeForm input', {timeout:15000});
      await p.type('#typeForm input', 'https://alleskonverter.de');
      await p.waitForFunction(() => !!document.querySelector('#qrPreview canvas, #qrPreview svg'), {timeout:15000});
    } },
];

/* ---------- Bleibt die Oberfläche bedienbar? ----------
   Gemessen wird, ob der Hauptstrang blockiert: Ein Zeitgeber im Sekundentakt
   müsste bei einer eingefrorenen Seite große Lücken zeigen. Solange die
   schwere Arbeit in eigenen Strängen läuft (pdf.js, canvas.toBlob, ffmpeg,
   Texterkennung) und zwischen den Schritten pausiert wird, bleibt alles flüssig. */
async function bedienbarkeit(browser){
  const page = await browser.newPage();
  const grenze = 600;   // ab hier merkt man ein Ruckeln deutlich
  try{
    await page.goto(`http://localhost:${PORT}/tools/pdf-komprimieren/`, { waitUntil:'load' });
    await page.waitForFunction(() => typeof window.addFiles === 'function', { timeout:20000 });
    const grossesPdf = pdf(120, 'Kapitel');
    await page.evaluate(async d => {
      const b = atob(d); const a = new Uint8Array(b.length);
      for(let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      await window.addFiles([new File([a], 'gross.pdf', { type:'application/pdf' })]);
    }, grossesPdf);
    await page.waitForFunction(() => !document.querySelector('#go').disabled, { timeout:20000 });
    await page.evaluate(() => { window.__t = []; window.__i = setInterval(() => window.__t.push(performance.now()), 100); });
    await page.click('#go');
    await page.waitForSelector('a.download', { timeout:180000 });
    const max = await page.evaluate(() => {
      clearInterval(window.__i);
      const t = window.__t; let m = 0;
      for(let i = 1; i < t.length; i++) m = Math.max(m, t[i] - t[i-1]);
      return Math.round(m);
    });
    if(max > grenze) throw new Error(`Oberfläche war ${max} ms blockiert (erlaubt: ${grenze} ms)`);
    console.log(`  ok    Bedienbarkeit bei 120 Seiten (längste Blockade ${max} ms)`);
    await page.close();
    return true;
  }catch(err){
    console.log(`  FEHLT Bedienbarkeit — ${err.message.slice(0,120)}`);
    await page.close();
    return false;
  }
}

/* ---------- Durchlauf ---------- */
(async () => {
  const srv = server();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  let fehler = 0;
  for(const fall of FAELLE){
    const page = await browser.newPage();
    const meldungen = [];
    page.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message.split('\n')[0]));
    page.on('console', m => { if(m.type() === 'error') meldungen.push('Konsole: ' + m.text().slice(0, 120)); });

    try{
      await page.goto(`http://localhost:${PORT}/tools/${fall.werkzeug}/`, { waitUntil:'load', timeout:45000 });

      if(fall.dateien){
        await page.evaluate(async specs => {
          const dateien = specs.map(([name, daten, typ]) => {
            const bin = atob(daten);
            const arr = new Uint8Array(bin.length);
            for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            return new File([arr], name, { type: typ });
          });
          await window.addFiles(dateien);
        }, fall.dateien);
      }

      if(fall.vorher) await fall.vorher(page);

      if(!fall.nur_laden && !fall.kein_download){
        await page.waitForFunction(() => { const b = document.querySelector('#go'); return b && !b.disabled; }, { timeout:25000 });
        await page.click('#go');
        await page.waitForSelector('a.download', { timeout:40000 });
      }
      if(fall.pruefen) await fall.pruefen(page);

      // Sichtbare Fehlermeldung im Protokoll gilt als Fehlschlag
      const protokoll = await page.$eval('#log', e => e.innerHTML).catch(() => '');
      if(/<b>/.test(protokoll) && !fall.nur_laden && !fall.hinweis_ok){
        throw new Error('Fehlermeldung im Protokoll: ' + protokoll.replace(/<[^>]+>/g,'').trim().slice(0,90));
      }
      if(meldungen.length) throw new Error(meldungen[0]);

      console.log(`  ok    ${fall.werkzeug}`);
    }catch(err){
      fehler++;
      console.log(`  FEHLT ${fall.werkzeug} — ${err.message.split('\n')[0].slice(0,140)}`);
    }
    await page.close();
  }

  if(!await bedienbarkeit(browser)) fehler++;

  await browser.close();
  srv.close();
  console.log(`\n${FAELLE.length + 1 - fehler} von ${FAELLE.length + 1} Prüfungen in Ordnung.`);
  process.exit(fehler ? 1 : 0);
})();
