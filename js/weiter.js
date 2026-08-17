/* „Weiter zu …“ — Werkzeuge verketten.

   Sobald ein Werkzeug ein Ergebnis zum Herunterladen anbietet, erscheint darunter
   ein Vorschlag, was man damit als Nächstes tun könnte. Klickt man darauf, wird
   das eben erzeugte Ergebnis über die lokale Übergabe direkt ins nächste Werkzeug
   mitgenommen — ohne Umweg über Festplatte und erneutes Auswählen. */
window.AK = window.AK || {};

(function(){
  /* Was passt nach welchem Werkzeug? Bewusst kurz gehalten — höchstens drei
     Vorschläge, sonst ist es keine Hilfe mehr, sondern eine zweite Startseite. */
  const KETTEN = {
    'hintergrund-entfernen': ['bild-zuschneiden','bild-konvertieren','bild-zu-pdf'],
    'bild-zuschneiden':      ['bild-konvertieren','hintergrund-entfernen','bild-zu-pdf'],
    'bild-konvertieren':     ['bild-zuschneiden','bilder-zusammenfuegen','bild-zu-pdf'],
    'bilder-zusammenfuegen': ['bild-konvertieren','bild-zuschneiden'],
    'bild-metadaten':        ['bild-konvertieren','bild-zuschneiden'],
    'bild-base64':           ['text-werkzeuge'],
    'bild-ascii':            ['text-werkzeuge'],
    'bildergalerie':         ['zip'],
    'favicon':               ['zip'],

    'texterkennung':         ['text-werkzeuge','markdown-html'],
    'pdf-text':              ['text-werkzeuge','markdown-html'],
    'pdf-durchsuchbar':      ['pdf-komprimieren','pdf-stempeln','pdf-passwort'],

    'pdf-zusammenfuegen':    ['pdf-komprimieren','pdf-stempeln','pdf-passwort'],
    'pdf-aufteilen':         ['pdf-komprimieren','pdf-zusammenfuegen'],
    'pdf-bearbeiten':        ['pdf-komprimieren','pdf-stempeln'],
    'pdf-komprimieren':      ['pdf-passwort','pdf-stempeln'],
    'pdf-stempeln':          ['pdf-komprimieren','pdf-passwort'],
    'pdf-passwort':          ['pdf-komprimieren'],
    'pdf-formular':          ['pdf-passwort','pdf-komprimieren'],
    'pdf-zu-bild':           ['bild-konvertieren','bild-zuschneiden'],
    'schwaerzen':            ['pdf-komprimieren','bild-konvertieren'],
    'bild-zu-pdf':           ['pdf-komprimieren','pdf-stempeln','pdf-zusammenfuegen'],
    'pdf-kontaktabzug':      ['pdf-komprimieren'],

    'word-zu-html':          ['markdown-html','word-erstellen','text-werkzeuge'],
    'word-erstellen':        ['word-zu-html'],
    'markdown-html':         ['word-erstellen','text-werkzeuge'],
    'epub':                  ['word-erstellen','markdown-html','text-werkzeuge'],
    'tabellen':              ['csv-bereinigen','json-yaml'],
    'csv-bereinigen':        ['tabellen','vergleichen'],
    'testdaten':             ['csv-bereinigen','tabellen'],
    'json-yaml':             ['json-lesen','tabellen','text-werkzeuge'],
    'json-lesen':            ['json-yaml','tabellen'],
    'xml-lesen':             ['vergleichen','text-werkzeuge'],
    'untertitel':            ['text-werkzeuge','vergleichen'],
    'vergleichen':           ['text-werkzeuge'],

    'medien':                ['medien-schneiden','ton-verbessern'],
    'medien-schneiden':      ['medien','ton-verbessern'],
    'ton-verbessern':        ['medien-schneiden','medien'],
    'gif-erstellen':         ['medien'],
    'zip':                   ['bilder-umbenennen'],
    'bilder-umbenennen':     ['zip'],
  };

  const NAMEN = {
    'pdf-zusammenfuegen':'PDF zusammenfügen', 'pdf-aufteilen':'PDF aufteilen',
    'pdf-bearbeiten':'PDF bearbeiten', 'pdf-zu-bild':'PDF → Bild',
    'bild-zu-pdf':'Bilder → PDF', 'pdf-komprimieren':'PDF komprimieren',
    'pdf-text':'Text auslesen', 'pdf-stempeln':'PDF stempeln',
    'pdf-passwort':'PDF-Passwort', 'pdf-formular':'PDF-Formular ausfüllen',
    'pdf-kontaktabzug':'PDF-Übersichtsblatt', 'pdf-durchsuchbar':'PDF durchsuchbar machen',
    'bild-konvertieren':'Bilder konvertieren', 'bild-zuschneiden':'Bild zuschneiden',
    'hintergrund-entfernen':'Hintergrund entfernen', 'bilder-zusammenfuegen':'Bilder zusammenfügen',
    'bild-metadaten':'Bild-Metadaten', 'bild-base64':'Bild als Daten-URI',
    'word-zu-html':'Word → HTML', 'markdown-html':'Markdown ↔ HTML',
    'tabellen':'Tabellen-Konverter', 'json-yaml':'JSON & YAML',
    'json-lesen':'JSON lesen', 'xml-lesen':'XML lesen',
    'bild-ascii':'Bild als ASCII-Art',
    'texterkennung':'Texterkennung', 'untertitel':'Untertitel',
    'medien':'Audio & Video', 'medien-schneiden':'Medien schneiden',
    'ton-verbessern':'Ton verbessern', 'gif-erstellen':'GIF erstellen',
    'zip':'ZIP entpacken & packen', 'text-werkzeuge':'Text-Werkzeuge',
    'favicon':'Favicon-Generator', 'bilder-umbenennen':'Dateien umbenennen',
    'word-erstellen':'Word-Datei erstellen', 'epub':'EPUB lesen & umwandeln',
    'csv-bereinigen':'CSV bereinigen', 'vergleichen':'Texte & Tabellen vergleichen',
    'bildergalerie':'Bildergalerie als HTML', 'testdaten':'Testdaten & Blindtext',
    'termin':'Termin als ICS', 'regex':'Regex ausprobieren',
    'schwaerzen':'Schwärzen (PDF & Bild)',
  };

  const eigenes = () => {
    const teile = location.pathname.replace(/\/index\.html$/, '').split('/').filter(Boolean);
    return teile[teile.length - 1] || '';
  };

  function box(){
    let el = document.getElementById('weiterbox');
    if(el) return el;
    el = document.createElement('div');
    el.id = 'weiterbox';
    el.className = 'weiterbox';
    el.hidden = true;
    const anker = document.getElementById('stamp') || document.getElementById('log');
    if(anker) anker.after(el); else return null;
    return el;
  }

  /* Zeigt die Vorschläge an; `datei` ist das erzeugte Ergebnis (Blob + Name) */
  AK.weiterAnbieten = function(blob, dateiname){
    const ziele = KETTEN[eigenes()];
    if(!ziele || !ziele.length) return;
    const el = box();
    if(!el) return;

    el.innerHTML = '<b>Weiter zu …</b><ul></ul>';
    const ul = el.querySelector('ul');
    for(const ziel of ziele){
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `../${ziel}/index.html`;
      a.textContent = NAMEN[ziel] || ziel;
      a.addEventListener('click', async ev => {
        if(!blob || !AK.uebergabeSetzen) return;      // ohne Übergabe einfach normal folgen
        ev.preventDefault();
        const datei = new File([blob], dateiname, { type: blob.type || 'application/octet-stream' });
        const ok = await AK.uebergabeSetzen([datei]);
        location.href = a.getAttribute('href') + (ok ? '?datei=1' : '');
      });
      li.appendChild(a);
      ul.appendChild(li);
    }
    el.hidden = false;
  };

  /* An offerDownload andocken, damit kein Werkzeug einzeln angepasst werden muss */
  const urspruenglich = AK.offerDownload;
  if(typeof urspruenglich === 'function'){
    AK.offerDownload = function(blob, filename, label){
      const a = urspruenglich.call(AK, blob, filename, label);
      try{ AK.weiterAnbieten(blob, filename); }catch(_){ }
      return a;
    };
    const aufraeumen = AK.clearDownloads;
    AK.clearDownloads = function(){
      const el = document.getElementById('weiterbox');
      if(el){ el.hidden = true; el.innerHTML = ''; }
      return aufraeumen.call(AK);
    };
  }
})();
