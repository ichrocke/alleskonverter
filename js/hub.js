/* Startseite: Werkzeug-Suche, ausklappbare Kategorien und Datei-Erkennung. */
(function(){
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const suche   = $('#suche');
  const hinweis = $('#findhint');
  const treffer = $('#treffer');
  const alleauf = $('#alleauf');
  const karten  = $$('li[data-tool]');
  const kats    = $$('details.cat');

  /* Anfangszustand: auf schmalen Bildschirmen alles zu, damit die Liste überschaubar bleibt */
  const schmal = matchMedia('(max-width: 760px)').matches;
  if(schmal) kats.forEach((k, i) => k.open = i === 0);

  /* ---------- Suche ---------- */
  const normal = t => t.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');

  const text = li => normal(
    li.querySelector('.name').textContent + ' ' +
    li.querySelector('.desc').textContent + ' ' +
    (li.dataset.tags || '')
  );
  karten.forEach(li => li.dataset.such = text(li));

  function filtern(){
    const q = normal(suche.value.trim());
    if(!q){
      karten.forEach(li => li.hidden = false);
      kats.forEach(k => { k.hidden = false; k.open = schmal ? k === kats[0] : true; });
      hinweis.textContent = 'Oder zieh eine Datei irgendwo auf diese Seite — passende Werkzeuge werden dann angezeigt.';
      return;
    }
    const worte = q.split(/\s+/);
    let anzahl = 0;
    karten.forEach(li => {
      const passt = worte.every(w => li.dataset.such.includes(w));
      li.hidden = !passt;
      if(passt) anzahl++;
    });
    kats.forEach(k => {
      const sichtbar = Array.from(k.querySelectorAll('li[data-tool]')).some(li => !li.hidden);
      k.hidden = !sichtbar;
      if(sichtbar) k.open = true;
    });
    hinweis.textContent = anzahl === 0
      ? 'Kein Werkzeug gefunden — versuch es mit einem anderen Wort, etwa „pdf“, „bild“ oder „csv“.'
      : anzahl === 1 ? '1 Werkzeug gefunden.' : anzahl + ' Werkzeuge gefunden.';
  }

  suche.addEventListener('input', filtern);
  suche.addEventListener('keydown', e => { if(e.key === 'Escape'){ suche.value=''; filtern(); } });

  /* Mit „/“ direkt ins Suchfeld springen */
  addEventListener('keydown', e => {
    if(e.key === '/' && document.activeElement !== suche && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)){
      e.preventDefault(); suche.focus();
    }
  });

  function alleAufklappen(){
    const zu = kats.some(k => !k.open && !k.hidden);
    kats.forEach(k => k.open = zu);
    alleauf.textContent = zu ? 'Alle zuklappen' : 'Alle aufklappen';
  }
  alleauf.addEventListener('click', alleAufklappen);
  alleauf.textContent = kats.every(k => k.open) ? 'Alle zuklappen' : 'Alle aufklappen';

  /* ---------- Datei hineinziehen → passende Werkzeuge ---------- */
  const REGELN = [
    { test: n => /\.pdf$/i.test(n), art: 'PDF-Dokument',
      tools: ['pdf-zusammenfuegen','pdf-aufteilen','pdf-bearbeiten','pdf-komprimieren','pdf-zu-bild','pdf-stempeln','pdf-text','pdf-text-ersetzen','pdf-passwort','schwaerzen','texterkennung'] },
    { test: n => /\.(hei[cf])$/i.test(n), art: 'iPhone-Foto (HEIC)',
      tools: ['bild-konvertieren','bild-zuschneiden','hintergrund-entfernen','bilder-zusammenfuegen','bild-zu-pdf','schwaerzen','bild-metadaten','texterkennung'] },
    { test: n => /\.(jpe?g|png|webp|gif|bmp|avif|tiff?)$/i.test(n), art: 'Bild',
      tools: ['bild-konvertieren','bild-zuschneiden','hintergrund-entfernen','bilder-zusammenfuegen','bild-zu-pdf','schwaerzen','bild-metadaten','bildergalerie','texterkennung','favicon','qr-code','bild-ascii'] },
    { test: n => /\.(csv|tsv|xlsx?|ods)$/i.test(n), art: 'Tabelle',
      tools: ['tabellen','csv-bereinigen','vergleichen'] },
    { test: n => /\.json$/i.test(n), art: 'JSON-Datei',
      tools: ['json-lesen','json-yaml','tabellen','text-werkzeuge'] },
    { test: n => /\.(xml|rss|atom|xsd|xslt?)$/i.test(n), art: 'XML-Datei',
      tools: ['xml-lesen','vergleichen'] },
    { test: n => /\.docx?$/i.test(n), art: 'Word-Dokument',
      tools: ['word-zu-html'] },
    { test: n => /\.epub$/i.test(n), art: 'E-Book',
      tools: ['epub'] },
    { test: n => /\.(md|markdown)$/i.test(n), art: 'Markdown-Datei',
      tools: ['markdown-html','word-erstellen','vergleichen'] },
    { test: n => /\.html?$/i.test(n), art: 'HTML-Datei',
      tools: ['markdown-html','word-erstellen'] },
    { test: n => /\.(srt|vtt)$/i.test(n), art: 'Untertiteldatei',
      tools: ['untertitel'] },
    { test: n => /\.zip$/i.test(n), art: 'ZIP-Archiv',
      tools: ['zip'] },
    { test: n => /\.(mp3|wav|ogg|m4a|flac|aac|opus|wma|aiff?)$/i.test(n), art: 'Audiodatei',
      tools: ['medien','medien-schneiden'] },
    { test: n => /\.(mp4|webm|mkv|avi|mov|wmv|flv|m4v)$/i.test(n), art: 'Videodatei',
      tools: ['medien','medien-schneiden'] },
    { test: n => /\.txt$/i.test(n), art: 'Textdatei',
      tools: ['text-werkzeuge','vergleichen','word-erstellen','untertitel','tabellen'] },
  ];

  /* Werkzeuge, die eine Datei entgegennehmen können (das QR-Werkzeug erzeugt nur) */
  const NIMMT_DATEI = t => t !== 'qr-code';

  function vorschlagen(namen, dateien){
    const arten = new Map();
    for(const name of namen){
      const regel = REGELN.find(r => r.test(name));
      if(!regel) continue;
      if(!arten.has(regel.art)) arten.set(regel.art, { regel, dateien: [] });
      arten.get(regel.art).dateien.push(name);
    }

    if(!arten.size){
      treffer.hidden = false;
      treffer.innerHTML = '<h3>Dateityp unbekannt</h3><p>Zu dieser Datei gibt es hier (noch) kein passendes Werkzeug. Sieh dich unten in der Liste um.</p>';
      if(AK.uebergabeHolen) AK.uebergabeHolen();   // nichts liegen lassen
      treffer.scrollIntoView({ behavior:'smooth', block:'nearest' });
      return;
    }

    const bloecke = [];
    for(const [art, { regel, dateien }] of arten){
      const liste = regel.tools.map(t => {
        const li = karten.find(k => k.dataset.tool === t);
        if(!li) return '';
        const name = li.querySelector('.name').textContent;
        let href = li.querySelector('a').getAttribute('href');
        // Kennzeichnung, damit das Werkzeug die hinterlegte Datei abholt
        if(dateien && NIMMT_DATEI(t)) href += '?datei=1';
        return `<li><a href="${href}">${name}</a></li>`;
      }).join('');
      const wieviele = dateien.length === 1 ? `„${dateien[0]}“` : `${dateien.length} Dateien`;
      bloecke.push(`<h3>${art} erkannt</h3><p>Für ${wieviele} passen diese Werkzeuge — die Datei wird beim Klick gleich mitgenommen:</p><ul>${liste}</ul>`);
    }
    treffer.hidden = false;
    treffer.innerHTML = bloecke.join('<div style="height:14px"></div>');
    treffer.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  let tiefe = 0;
  addEventListener('dragenter', e => {
    if(!e.dataTransfer || !Array.from(e.dataTransfer.types||[]).includes('Files')) return;
    e.preventDefault(); tiefe++; document.body.classList.add('ablage');
  });
  addEventListener('dragover', e => {
    if(Array.from(e.dataTransfer?.types||[]).includes('Files')) e.preventDefault();
  });
  addEventListener('dragleave', () => { if(--tiefe <= 0){ tiefe = 0; document.body.classList.remove('ablage'); } });
  addEventListener('drop', async e => {
    if(!e.dataTransfer?.files?.length) return;
    e.preventDefault(); tiefe = 0; document.body.classList.remove('ablage');
    const dateien = Array.from(e.dataTransfer.files);
    // Datei kurz lokal hinterlegen, damit das Werkzeug sie direkt übernehmen kann
    const gemerkt = AK.uebergabeSetzen ? await AK.uebergabeSetzen(dateien) : false;
    vorschlagen(dateien.map(f => f.name), gemerkt);
  });
})();
