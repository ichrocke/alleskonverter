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
const JSON_B64 = Buffer.from('{"b":2,"a":{"z":1,"y":[3,4]}}', 'utf8').toString('base64');

/* ZIP ohne Kompression von Hand — Grundlage für die DOCX- und EPUB-Testdateien */
function zipBauen(dateien){
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

/* docx: kleinstmögliches gültiges Dokument */
function docx(){
  return zipBauen([
    ['[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Testdokument mit Umlauten äöü</w:t></w:r></w:p></w:body></w:document>'],
  ]);
}

/* epub: EPUB 3 mit zwei Kapiteln und Navigationsdatei */
function epub(){
  const kapitel = n => `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Kapitel ${n}</title></head>
<body><h1>Kapitel ${n}</h1><p>Text des ${n}. Kapitels mit Umlauten: Größe, Straße.</p></body></html>`;
  return zipBauen([
    ['mimetype', 'application/epub+zip'],
    ['META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/inhalt.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'],
    ['OEBPS/inhalt.opf', `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="id">urn:uuid:test-1234</dc:identifier>
<dc:title>Testbuch mit Umlauten</dc:title>
<dc:creator>Marc Schüßler</dc:creator>
<dc:language>de</dc:language>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="k1" href="k1.xhtml" media-type="application/xhtml+xml"/>
<item id="k2" href="k2.xhtml" media-type="application/xhtml+xml"/>
</manifest>
<spine><itemref idref="k1"/><itemref idref="k2"/></spine>
</package>`],
    ['OEBPS/nav.xhtml', `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Inhalt</title></head>
<body><nav epub:type="toc"><ol><li><a href="k1.xhtml">Kapitel 1</a></li><li><a href="k2.xhtml">Kapitel 2</a></li></ol></nav></body></html>`],
    ['OEBPS/k1.xhtml', kapitel(1)],
    ['OEBPS/k2.xhtml', kapitel(2)],
  ]);
}

/* ---------- Was wird geprüft ---------- */
const PDF3 = pdf(3, 'Seite');
/* PDF mit Formularfeldern — mit pdf-lib aus dem Projekt erzeugt */
function formularPdf(){
  global.window = global; global.self = global;
  const mod = { exports:{} };
  new Function('exports','module', fs.readFileSync(path.join(WURZEL,'vendor/pdf-lib.min.js'),'utf8'))(mod.exports, mod);
  const L = mod.exports;
  return (async () => {
    const doc = await L.PDFDocument.create();
    const seite = doc.addPage([595, 842]);
    const f = doc.getForm();
    f.createTextField('name').addToPage(seite, { x:60, y:700, width:300, height:24 });
    f.createCheckBox('haken').addToPage(seite, { x:60, y:650, width:18, height:18 });
    return Buffer.from(await doc.save()).toString('base64');
  })();
}
const PNG  = png();
const EPUB = epub();

/* JPEG-EXIF-Segment (APP1) mit Kameraname, Ausrichtung 6 und GPS-Position —
   von Hand gebaut, um den Metadaten-Entferner mit echtem Inhalt zu prüfen */
function exifApp1(){
  const t = [];
  const p = (...b) => t.push(...b);
  const rat = (z, n) => p(z & 255, (z >> 8) & 255, (z >> 16) & 255, (z >> 24) & 255,
                          n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255);
  p(0x49, 0x49, 0x2A, 0, 8, 0, 0, 0);              // TIFF, little-endian, IFD0 ab Byte 8
  p(3, 0);                                          // IFD0: drei Einträge
  p(0x0F, 0x01, 2, 0, 8, 0, 0, 0, 50, 0, 0, 0);    //   Make → "TestCam" bei Byte 50
  p(0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0);     //   Orientation = 6 (90° gedreht)
  p(0x25, 0x88, 4, 0, 1, 0, 0, 0, 58, 0, 0, 0);    //   GPS-IFD bei Byte 58
  p(0, 0, 0, 0);
  p(...Buffer.from('TestCam\0'));
  p(4, 0);                                          // GPS-IFD: vier Einträge
  p(1, 0, 2, 0, 2, 0, 0, 0, 0x4E, 0, 0, 0);        //   LatRef "N"
  p(2, 0, 5, 0, 3, 0, 0, 0, 112, 0, 0, 0);         //   Lat: 3 Brüche bei Byte 112
  p(3, 0, 2, 0, 2, 0, 0, 0, 0x45, 0, 0, 0);        //   LonRef "E"
  p(4, 0, 5, 0, 3, 0, 0, 0, 136, 0, 0, 0);         //   Lon: 3 Brüche bei Byte 136
  p(0, 0, 0, 0);
  rat(50, 1); rat(6, 1); rat(3000, 100);            // 50° 6′ 30,00″ N
  rat(7, 1);  rat(37, 1); rat(1200, 100);           //  7° 37′ 12,00″ O
  const len = 2 + 6 + t.length;
  return Buffer.from([0xFF, 0xE1, len >> 8, len & 255,
    0x45, 0x78, 0x69, 0x66, 0, 0, ...t]).toString('base64');
}
const EXIF_APP1 = exifApp1();

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
  { werkzeug:'bild-metadaten',     dateien:[['b.png', PNG, 'image/png']], kein_download:true,
    pruefen: async p => { await p.waitForSelector('table.daten', {timeout:15000}); } },
  { werkzeug:'bild-metadaten',     kein_download:true,
    vorher: async p => {
      // JPEG mit EXIF (Kamera, Ausrichtung, GPS) direkt im Browser zusammensetzen
      await p.evaluate(async app1b64 => {
        const c = document.createElement('canvas'); c.width = 40; c.height = 40;
        const g = c.getContext('2d'); g.fillStyle = '#a04030'; g.fillRect(0, 0, 40, 40);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
        const jpg = new Uint8Array(await blob.arrayBuffer());
        const app1 = Uint8Array.from(atob(app1b64), ch => ch.charCodeAt(0));
        const mit = new Uint8Array(jpg.length + app1.length);
        mit.set(jpg.subarray(0, 2), 0);
        mit.set(app1, 2);
        mit.set(jpg.subarray(2), 2 + app1.length);
        await window.addFiles([new File([mit], 'foto.jpg', { type:'image/jpeg' })]);
      }, EXIF_APP1);
      await p.waitForSelector('.warnung', { timeout:15000 });   // Standortwarnung muss erscheinen
      await p.click('#clean');
      await p.waitForSelector('a.download', { timeout:15000 });
    },
    pruefen: async p => {
      // Bereinigte Datei erneut einlesen: GPS und Kamera weg, Ausrichtung bleibt
      const rest = await p.evaluate(async () => {
        const a = document.querySelector('a.download');
        const blob = await (await fetch(a.href)).blob();
        return await exifr.parse(blob, { tiff:true, exif:true, gps:true, ifd0:true, xmp:true, iptc:true }) || {};
      });
      if(rest.latitude !== undefined) throw new Error('GPS überlebt die Bereinigung');
      if(rest.Make) throw new Error('Kameraname überlebt die Bereinigung');
      if(rest.Orientation === undefined) throw new Error('Ausrichtung ging verloren');
    } },
  { werkzeug:'bild-base64',        dateien:[['b.png', PNG, 'image/png']], kein_download:true,
    pruefen: async p => {
      const v = await p.$eval('#ausgabe', e => e.value);
      if(!v.startsWith('data:image/png;base64,')) throw new Error('kein Daten-URI: ' + v.slice(0,40));
    } },
  { werkzeug:'bilder-umbenennen',  dateien:[['a.txt', TXT, 'text/plain'], ['b.txt', TXT, 'text/plain']] },
  { werkzeug:'pdf-kontaktabzug',   dateien:[['a.pdf', PDF3, 'application/pdf']] },
  { werkzeug:'pdf-formular',       formular:true },
  { werkzeug:'schwaerzen',         dateien:[['a.pdf', PDF3, 'application/pdf']],
    vorher: async p => {
      await p.waitForFunction(() => document.querySelectorAll('.flaeche canvas').length === 3, {timeout:20000});
      // Bereich über dem Text der ersten Seite mit der Maus aufziehen
      await p.$eval('.flaeche canvas', e => e.scrollIntoView());
      const r = await p.$eval('.flaeche canvas', e => {
        const b = e.getBoundingClientRect();
        return { x:b.x, y:b.y, w:b.width, h:b.height };
      });
      await p.mouse.move(r.x + r.w*0.05, r.y + r.h*0.02);
      await p.mouse.down();
      await p.mouse.move(r.x + r.w*0.95, r.y + r.h*0.3, { steps:5 });
      await p.mouse.up();
      await p.waitForFunction(() => document.querySelectorAll('.rx').length === 1, {timeout:5000});
    },
    pruefen: async p => {
      // „Wirklich entfernt“: Seite 1 darf im Ergebnis keinen Text mehr enthalten,
      // die unmarkierten Seiten behalten ihren durchsuchbaren Text verlustfrei
      const texte = await p.evaluate(async () => {
        const a = document.querySelector('a.download');
        const buf = await (await fetch(a.href)).arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        const out = [];
        for(let i = 1; i <= doc.numPages; i++){
          const inhalt = await (await doc.getPage(i)).getTextContent();
          out.push(inhalt.items.map(x => x.str).join(''));
        }
        await doc.destroy();
        return out;
      });
      if(texte.length !== 3) throw new Error('Seitenzahl: ' + texte.length);
      if(texte[0].trim()) throw new Error('Seite 1 enthält noch Text: ' + texte[0].slice(0,40));
      if(!texte[2].includes('Seite 3')) throw new Error('unmarkierte Seite verlor ihren Text');
    } },
  { werkzeug:'schwaerzen',         dateien:[['b.png', PNG, 'image/png']],
    vorher: async p => {
      await p.waitForSelector('.flaeche canvas', {timeout:15000});
      await p.$eval('.flaeche canvas', e => e.scrollIntoView());
      const r = await p.$eval('.flaeche canvas', e => {
        const b = e.getBoundingClientRect();
        return { x:b.x, y:b.y, w:b.width, h:b.height };
      });
      await p.mouse.move(r.x + r.w*0.3, r.y + r.h*0.3);
      await p.mouse.down();
      await p.mouse.move(r.x + r.w*0.7, r.y + r.h*0.7, { steps:3 });
      await p.mouse.up();
      await p.waitForFunction(() => document.querySelectorAll('.rx').length === 1, {timeout:5000});
    },
    pruefen: async p => {
      // Der geschwärzte Bereich muss im Ergebnis aus schwarzen Pixeln bestehen
      const px = await p.evaluate(async () => {
        const a = document.querySelector('a.download');
        const bmp = await createImageBitmap(await (await fetch(a.href)).blob());
        const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
        const g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
        return Array.from(g.getImageData(Math.floor(bmp.width/2), Math.floor(bmp.height/2), 1, 1).data);
      });
      if(px[0] > 24 || px[1] > 24 || px[2] > 24) throw new Error('Mitte nicht geschwärzt: rgb(' + px.slice(0,3).join(',') + ')');
    } },
  { werkzeug:'farben',             kein_download:true,
    pruefen: async p => {
      await p.evaluate(() => { const h=document.querySelector('#hex'); h.value='#FF8800'; h.dispatchEvent(new Event('input')); });
      const rgb = await p.$eval('#rgb', e => e.value);
      if(rgb !== 'rgb(255, 136, 0)') throw new Error('Umrechnung falsch: ' + rgb);
    } },
  { werkzeug:'passwort',           kein_download:true,
    pruefen: async p => {
      const a = await p.$eval('#ausgabe', e => e.textContent);
      await p.click('#neu');
      const b = await p.$eval('#ausgabe', e => e.textContent);
      if(a === b || a.length < 8) throw new Error('Zufall wirkt nicht: ' + a);
    } },
  { werkzeug:'einheiten',          kein_download:true,
    pruefen: async p => {
      await p.evaluate(() => {
        const k=document.querySelector('#kategorie'); k.value='Länge'; k.dispatchEvent(new Event('change'));
        document.querySelector('#von').value='Zoll (inch)'; document.querySelector('#nach').value='Millimeter';
        const w=document.querySelector('#wert'); w.value='1'; w.dispatchEvent(new Event('input'));
      });
      const e = await p.$eval('#ergebnis', x => x.value);
      if(e !== '25,4') throw new Error('1 Zoll ≠ 25,4 mm, sondern ' + e);
    } },
  { werkzeug:'json-yaml',          dateien:[['d.json', JSON_B64, 'application/json']] },
  { werkzeug:'gif-erstellen',      nur_laden:true },
  { werkzeug:'ton-verbessern',     nur_laden:true },
  { werkzeug:'pdf-durchsuchbar',   nur_laden:true },
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

  { werkzeug:'epub',               dateien:[['buch.epub', EPUB, 'application/epub+zip']],
    pruefen: async p => {
      const titel = await p.$eval('#kopfzeile h3', e => e.textContent);
      if(!titel.includes('Testbuch')) throw new Error('Titel nicht gelesen: ' + titel);
      const kapitel = await p.$$eval('#inhalt button', els => els.length);
      if(kapitel !== 2) throw new Error('Inhaltsverzeichnis hat ' + kapitel + ' statt 2 Einträge');
    } },
  { werkzeug:'csv-bereinigen',     dateien:[['t.csv', CSV, 'text/csv']],
    vorher: async p => {
      // Umlaute müssen die CSV-Erkennung überleben
      const zellen = await p.$$eval('#vorschau td', els => els.map(e => e.textContent));
      if(!zellen.includes('Müller')) throw new Error('Umlaute zerlegt: ' + zellen.join('|'));
    } },
  { werkzeug:'word-erstellen',     kein_download:false,
    vorher: async p => {
      await p.$eval('#quelle', e => { e.value = '# Titel\n\nEin **Test** mit Umlauten: Größe.\n\n- eins\n- zwei\n'; e.dispatchEvent(new Event('input')); });
    } },
  { werkzeug:'bildergalerie',      dateien:[['b.png', PNG, 'image/png'], ['c.png', PNG, 'image/png']],
    pruefen: async p => {
      const quelle = await p.$eval('#quelle', e => e.textContent);
      if(!/ak-galerie/.test(quelle)) throw new Error('kein Galerie-HTML erzeugt');
    } },
  { werkzeug:'termin',
    pruefen: async p => {
      const ics = await p.$eval('#quelle', e => e.textContent);
      if(!/^BEGIN:VCALENDAR/.test(ics)) throw new Error('kein VCALENDAR');
      if(!/DTSTART;TZID=Europe\/Berlin:\d{8}T\d{6}/.test(ics)) throw new Error('DTSTART fehlt oder falsch');
      // Zeilen dürfen 75 Oktette nicht überschreiten (RFC 5545)
      const zulang = ics.split('\r\n').find(z => Buffer.byteLength(z, 'utf8') > 75);
      if(zulang) throw new Error('Zeile zu lang: ' + zulang.slice(0, 40));
    } },
  { werkzeug:'testdaten',
    vorher: async p => {
      await p.$eval('#seed', e => { e.value = 'test'; e.dispatchEvent(new Event('input')); });
      await p.click('#tab-daten');
      await p.$eval('#f-iban', e => { if(!e.checked) e.click(); });
    },
    pruefen: async p => {
      const ibans = await p.$$eval('#tabellenvorschau tbody tr td:last-child', els => els.map(e => e.textContent));
      const mod97 = t => { let r = 0; for(const c of t) r = (r * 10 + parseInt(c, 10)) % 97; return r; };
      for(const roh of ibans){
        const s = roh.replace(/ /g, '');
        if(!/^DE\d{20}$/.test(s)) throw new Error('keine IBAN: ' + roh);
        if(mod97(s.slice(4) + '1314' + s.slice(2, 4)) !== 1) throw new Error('Prüfziffer falsch: ' + roh);
      }
      if(!ibans.length) throw new Error('keine Datensätze erzeugt');
    } },
  { werkzeug:'regex',              kein_download:true,
    pruefen: async p => {
      await p.$eval('#muster', e => { e.value = '\\d{2}\\.\\d{2}\\.(\\d{4})'; e.dispatchEvent(new Event('input')); });
      await p.$eval('#text', e => { e.value = 'am 15.08.2026 und am 01.09.2027'; e.dispatchEvent(new Event('input')); });
      const treffer = await p.$$eval('#hervorgehoben mark', els => els.map(e => e.textContent));
      if(treffer.length !== 2) throw new Error('Treffer: ' + JSON.stringify(treffer));
      const gruppen = await p.$$eval('#liste small', els => els.map(e => e.textContent));
      if(!gruppen.some(g => g.includes('2026'))) throw new Error('Gruppe fehlt: ' + gruppen.join('|'));
    } },
  { werkzeug:'subnetz',
    vorher: async p => {
      await p.$eval('#ip', e => { e.value = '192.168.10.0/22'; e.dispatchEvent(new Event('input')); });
      // Aus dem CIDR im Adressfeld muss die Präfixlänge übernommen werden
      const pfx = await p.$eval('#praefix', e => e.value);
      if(pfx !== '22') throw new Error('Präfix aus CIDR nicht übernommen: ' + pfx);
      const werte = await p.$$eval('#werte .wert', els => els.map(e => e.textContent));
      if(!werte.some(w => w.includes('255.255.252.0'))) throw new Error('Netzmaske falsch: ' + werte.join('|'));
      if(!werte.some(w => w.includes('192.168.8.0/22'))) throw new Error('nicht auf Netzadresse gerundet: ' + werte.join('|'));
      // Ausschluss rechnen lassen und gegen die erwartete Blockzahl prüfen
      await p.click('#tab-ausschluss');
      await p.$eval('#exeingabe', e => { e.value = '192.168.9.0/24'; });
      await p.click('#exhinzu');
      const rest = await p.$$eval('#exergebnis .netzkarte:not(.raus) .cidr', els => els.map(e => e.textContent));
      // /24 aus /22 herausgeschnitten ergibt genau 2 Blöcke
      if(rest.length !== 2) throw new Error('Rest: ' + JSON.stringify(rest));
      if(!rest.includes('192.168.8.0/24') || !rest.includes('192.168.10.0/23'))
        throw new Error('falsche Restblöcke: ' + JSON.stringify(rest));
    },
    pruefen: async p => {
      const name = await p.$eval('a.download', e => e.getAttribute('download'));
      if(!/^subnetze-192-168-8-0-22\.csv$/.test(name)) throw new Error('Dateiname: ' + name);
    } },
  { werkzeug:'vergleichen',        kein_download:true,
    pruefen: async p => {
      await p.$eval('#a', e => { e.value = 'eins\nzwei\ndrei\n'; e.dispatchEvent(new Event('input')); });
      await p.$eval('#b', e => { e.value = 'eins\nZWEI\ndrei\nvier\n'; e.dispatchEvent(new Event('input')); });
      const weg = await p.$$eval('#ausgabe td.weg', els => els.map(e => e.textContent));
      const neu = await p.$$eval('#ausgabe td.neu', els => els.map(e => e.textContent));
      if(!weg.includes('zwei')) throw new Error('entfernte Zeile fehlt: ' + weg.join('|'));
      if(!neu.includes('vier')) throw new Error('neue Zeile fehlt: ' + neu.join('|'));
    } },
];

/* ---------- Randfälle ----------
   Kaputte Dateien, falsche Formate und geschützte PDFs dürfen nicht in einem
   stillen Absturz enden, sondern müssen eine verständliche Meldung zeigen. */
async function randfaelle(browser){
  const KAPUTT = Buffer.from('%PDF-1.4\nDas ist gar kein gueltiges PDF, nur Text.\n').toString('base64');
  const LEER   = Buffer.from('').toString('base64');

  const faelle = [
    { werkzeug:'pdf-zusammenfuegen', datei:['kaputt.pdf', KAPUTT, 'application/pdf'],
      erwartet:/kann nicht|nicht lesbar|Fehler/i, was:'beschädigtes PDF' },
    { werkzeug:'pdf-aufteilen', datei:['kaputt.pdf', KAPUTT, 'application/pdf'],
      erwartet:/kann nicht gelesen|verschlüsselt|beschädigt/i, was:'beschädigtes PDF' },
    { werkzeug:'tabellen', datei:['kaputt.json', Buffer.from('{das ist kein json').toString('base64'), 'application/json'],
      erwartet:/kann nicht gelesen|unbekannt/i, was:'kaputtes JSON' },
    { werkzeug:'zip', datei:['kaputt.zip', KAPUTT, 'application/zip'],
      erwartet:/kann nicht gelesen|beschädigt|passwortgeschützt|kein ZIP/i, was:'kaputtes ZIP' },
    { werkzeug:'word-zu-html', datei:['leer.docx', LEER, ''],
      erwartet:/Abgebrochen|kann nicht gelesen/i, was:'leere DOCX' },
    { werkzeug:'bild-konvertieren', datei:['kaputt.png', KAPUTT, 'image/png'],
      erwartet:/kann nicht gelesen/i, was:'kaputtes Bild' },
    { werkzeug:'schwaerzen', datei:['kaputt.pdf', KAPUTT, 'application/pdf'],
      erwartet:/kann nicht gelesen|beschädigt/i, was:'beschädigtes PDF' },
    { werkzeug:'bild-konvertieren', datei:['tabelle.csv', Buffer.from('a;b').toString('base64'), 'text/csv'],
      erwartet:/passt nicht zu diesem Werkzeug/i, was:'falscher Dateityp', ueber_ablage:true },
  ];

  let fehler = 0;
  for(const fall of faelle){
    const page = await browser.newPage();
    const abstuerze = [];
    page.on('pageerror', e => abstuerze.push(e.message.split('\n')[0]));
    try{
      await page.goto(`http://localhost:${PORT}/tools/${fall.werkzeug}/`, { waitUntil:'load', timeout:30000 });
      await page.waitForFunction(() => typeof window.addFiles === 'function', { timeout:20000 });
      await page.evaluate(async ([name, daten, typ, echteAblage]) => {
        const bin = atob(daten);
        const arr = new Uint8Array(bin.length);
        for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const datei = new File([arr], name, { type: typ });
        if(echteAblage){
          // Über die Ablagefläche, damit auch die Typprüfung dort mitgetestet wird
          const dt = new DataTransfer();
          dt.items.add(datei);
          document.querySelector('#drop').dispatchEvent(
            new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
        }else{
          await window.addFiles([datei]);
        }
      }, [...fall.datei, !!fall.ueber_ablage]);
      await new Promise(r => setTimeout(r, 1200));

      // Die Meldung darf im Protokoll oder in der Dateiliste stehen — beides ist gut
      const sichtbar = await page.$eval('main', e => e.textContent).catch(() => '');
      if(abstuerze.length) throw new Error('Skriptfehler statt Meldung: ' + abstuerze[0].slice(0,80));
      if(!fall.erwartet.test(sichtbar)){
        const protokoll = await page.$eval('#log', e => e.textContent).catch(() => '');
        throw new Error('keine verständliche Meldung, sondern: ' + (protokoll.trim().slice(0,70) || '(nichts)'));
      }
      console.log(`  ok    Randfall ${fall.was} in ${fall.werkzeug}`);
    }catch(err){
      fehler++;
      console.log(`  FEHLT Randfall ${fall.was} in ${fall.werkzeug} — ${err.message.slice(0,110)}`);
    }
    await page.close();
  }
  return fehler;
}

/* ---------- Bleibt die Oberfläche bedienbar? ----------
   Gemessen wird, ob der Hauptstrang blockiert: Ein Zeitgeber im Sekundentakt
   müsste bei einer eingefrorenen Seite große Lücken zeigen. Solange die
   schwere Arbeit in eigenen Strängen läuft (pdf.js, canvas.toBlob, ffmpeg,
   Texterkennung) und zwischen den Schritten pausiert wird, bleibt alles flüssig. */
/* ---------- Seitenbreite auf dem Handy ----------
   Eine Gitterzelle, die nicht schrumpfen kann (breite Tabelle, lange Zeile
   ohne Umbruch), zieht die ganze Seite auseinander. Auf dem Rechner sieht man
   davon nichts — deshalb wird jede Werkzeugseite bei 390 px nachgemessen. */
async function handybreite(browser){
  const seiten = fs.readdirSync(path.join(WURZEL, 'tools'))
    .filter(n => fs.existsSync(path.join(WURZEL, 'tools', n, 'index.html')));
  const page = await browser.newPage();
  await page.setViewport({ width:390, height:840 });
  const zuBreit = [];
  for(const seite of ['', ...seiten.map(n => 'tools/' + n + '/')]){
    try{
      await page.goto(`http://localhost:${PORT}/${seite}`, { waitUntil:'load', timeout:45000 });
      const mass = await page.evaluate(() => ({
        dok: document.documentElement.scrollWidth, fenster: window.innerWidth }));
      if(mass.dok > mass.fenster + 1) zuBreit.push(`${seite || '/'} (${mass.dok} px)`);
    }catch(err){ zuBreit.push(`${seite} — ${err.message.slice(0,40)}`); }
  }
  await page.close();
  if(zuBreit.length){
    console.log(`  FEHLT Seitenbreite bei 390 px — läuft über: ${zuBreit.join(', ').slice(0,160)}`);
    return false;
  }
  console.log(`  ok    Seitenbreite bei 390 px (${seiten.length + 1} Seiten, kein Überlauf)`);
  return true;
}

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
  const FORMULAR = await formularPdf();
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

      if(fall.formular) fall.dateien = [['f.pdf', FORMULAR, 'application/pdf']];
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

  fehler += await randfaelle(browser);
  if(!await bedienbarkeit(browser)) fehler++;
  if(!await handybreite(browser)) fehler++;

  await browser.close();
  srv.close();
  const gesamt = FAELLE.length + 10;
  console.log(`\n${gesamt - fehler} von ${gesamt} Prüfungen in Ordnung.`);
  process.exit(fehler ? 1 : 0);
})();
