# Changelog

Alle nennenswerten Änderungen am Alleskonverter, neueste zuerst.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/).

## 2026-08-26 (Markdown ↔ HTML: großer Editor öffnete nicht mit geladener Datei)

### Behoben
- Der Knopf „Großer Editor“ tat nach dem Einlesen einer .md-Datei nichts mehr: `window.open` stand hinter dem `await` der Dateiübergabe — damit gilt die Klick-Geste für den Browser als verbraucht und der Popup-Blocker schluckt das Fenster. Bei leerem Eingabefeld gab es kein `await`, deshalb ging es nur dort. Jetzt wird das Fenster synchron im Klick geöffnet und erst danach auf `editor.html` navigiert. Der Testlauf hatte das nicht bemerkt, weil Puppeteer Popups nicht blockt — der Testfall prüft jetzt ausdrücklich, dass der `window.open`-Aufruf synchron im Klick fällt.

## 2026-08-26 (Markdown ↔ HTML: großer Editor, mehr Ausgabeformate, Vorschau ohne Deckel)

### Hinzugefügt
- **Großer Editor** (`tools/markdown-html/editor.html`, über den Knopf „Großer Editor (geteilte Ansicht)“): eigenes Fenster über die volle Breite, links Markdown, rechts live die fertige HTML-Seite, dazwischen ein verschiebbarer Griff (Maus/Finger, Pfeiltasten zum Feinjustieren, Doppelklick = Mitte). Bewusst ohne Schnickschnack — eine schmale Leiste mit „.md speichern“, „.html speichern“ und „Drucken / PDF“ (druckt nur die gerenderte Seite, der Browser-Dialog kann sie als PDF sichern). Der aktuelle Text wandert über die vorhandene lokale Übergabe (IndexedDB) hin und über „Zurück zum Werkzeug“ auch wieder zurück. Die Vorschau ist die echte Ausgabeseite in einem Rahmen — einmal aufgesetzt, danach wird nur der Seiteninhalt getauscht, damit die Scroll-Position beim Tippen bleibt; darum gibt es keine doppelte Stilpflege zwischen Vorschau und Download. Die Seite steht mit `noindex` nicht in der Sitemap, deshalb ist sie im Service Worker von Hand eingetragen.
- **Mehr Ausgabeformate** bei Markdown → HTML: statt der Checkbox „Komplette HTML-Datei“ jetzt eine Formatwahl — komplette HTML-Datei, HTML-Fragment (nur Inhalt) oder **reiner Text (.txt)**. Der reine Text entsteht über einen unsichtbaren, stilfreien Rahmen (innerText liefert dort die Zeilenumbrüche der Blockelemente; Listenzeichen werden vorher eingesetzt). Erster Anlauf über ein verstecktes Element in der Seite selbst schlug fehl: Die Seitenstyles färbten hinein und machten aus jeder Überschrift GROSSBUCHSTABEN. Word (DOCX) bleibt beim Werkzeug „Word-Datei erstellen“, das nach dem Umwandeln ohnehin unter „Weiter zu …“ verlinkt ist — kein zweiter DOCX-Erzeuger.
- **Vorschau ohne Deckel**: Die eingebettete Vorschau hat keine feste Höchsthöhe mehr und lässt sich an der Ecke in beide Richtungen aufziehen; daneben ein Knopf **„In neuem Tab öffnen“**, der die fertige Seite ungebremst im eigenen Tab zeigt.

### Geändert
- Die erzeugte HTML-Datei ist **nicht mehr auf 72 Zeichen Breite begrenzt**, sondern nutzt die volle Fensterbreite (Wunsch des Users). Die Seitenvorlage liegt jetzt einmal in `tools/markdown-html/gemeinsam.js` und wird von Werkzeugseite, Neuer-Tab-Ansicht und Editor gemeinsam benutzt.
- Testfall erweitert: Ausgabeformat reiner Text (inklusive der Großbuchstaben-Falle) und die Live-Vorschau des großen Editors; weiterhin 66 Prüfungen.

## 2026-08-18 (Text-Werkzeuge: Suchen & Ersetzen)

### Hinzugefügt
- **Text-Werkzeuge** haben jetzt als ersten Reiter **Suchen & Ersetzen** für beliebigen Text: einfügen (oder eine Textdatei aufs Eingabefeld ziehen), mehrere Regeln „Suchen → Ersetzen durch“ nacheinander, Trefferzahl je Regel, Optionen Groß-/Kleinschreibung, nur ganze Wörter (Unicode-bewusst, Umlaute zählen zum Wort) und regulärer Ausdruck mit `$1`, `$2`, `$&` im Ersatz; ungültige Ausdrücke werden an der Regel gemeldet statt still ignoriert. Ergebnis wie gewohnt live, kopierbar, als .txt speicherbar. Anlass: Das PDF-Werkzeug ersetzt nur in PDFs — die gleiche Bedienung sollte es auch für normalen Text geben; die beiden Seiten verweisen aufeinander.
  - Nebenbei nimmt die Seite jetzt Dateien entgegen (`addFiles`), damit die Übergabe von der Startseite und „Weiter zu …“ (etwa aus der Transkription) tatsächlich den Text einfüllt — bisher lief sie hier ins Leere.
- Testfall erweitert: zwei Regeln, ganze Wörter („Welt“ trifft nicht „Weltall“), Regex-Gruppe (`(W)elt` → `$1ald`), Zähler; Base64 wird weiterhin über den Reiter geprüft.

## 2026-08-18 (Werkzeug 52: Transkription)

### Hinzugefügt
- Werkzeug **Transkription (Audio → Text)** (`tools/transkription/`) — Interviews, Diktate, Podcasts, Sitzungsmitschnitte mit **Whisper** komplett im Browser verschriftlichen. Aufnahme (MP3, WAV, M4A, OGG, FLAC, MP4, WebM …) hineinziehen, Modell (Klein/Mittel/Groß = whisper-tiny/base/small) und Sprache wählen (Deutsch voreingestellt, zwölf weitere oder automatisch), Text kommt abschnittsweise mit Zeitmarken; Fortschritt, Tempo in „× Echtzeit“ und Restzeitschätzung nach jedem 30-s-Abschnitt, laufender Text als Vorschau, Abbrechen möglich (der bis dahin erkannte Text bleibt). Darunter der **Editor**: je Abschnitt Zeitmarke (Klick spielt die Stelle im eingebauten Player ab, laufender Abschnitt wird hervorgehoben) und Textfeld zum Korrigieren. Export als Text, Text mit Zeitmarken, SRT, VTT oder Word (DOCX, mit Titel und Zeitmarken), dazu Zwischenablage. Vierte KI-Karte mit Stempel „KI nur lokal“.
  - **Warum das die Kaufentscheidung ist:** Für Transkription zahlen Leute Abos oder pro Aufnahmestunde — und laden dafür Arztgespräche, Interviews und Vereinsinterna auf fremde Server. Hier verlässt die Aufnahme das Gerät nicht; das steht in Hinweisbox, FAQ und Datenschutzerklärung (jetzt „vier Werkzeuge mit neuronalen Netzen“).
  - **Technik:** transformers.js 4.2.0 (Standalone-Bundle mit eingebauter ONNX-Laufzeit, per `import()` geladen — deshalb Webserver nötig) mit onnxruntime-web 1.26.0-dev, alles selbst gehostet unter `vendor/transformers/`. Die Pipeline von transformers.js wird nicht benutzt, sondern die Schleife selbst geführt (Prozessor → `generate` je Abschnitt mit 5 s Überlappung → `_decode_asr`), weil nur so Fortschritt, Zwischenstand und Abbruch möglich sind. Audio wird per `OfflineAudioContext` (16 kHz) dekodiert und auf mono gemischt; Safari-Rückweg über ein zweites Rendering.
  - **Rechenweg:** WebGPU, wenn ein Adapter da ist (Chrome/Edge; Safari ausgenommen, weil die Laufzeit dort nur den Prozessor kann), sonst Prozessor. Auf dem Prozessor mehrkernig — dafür liefert `tools/transkription/.htaccess` die Seite mit COOP/COEP („cross-origin isolated“) aus, so dass `SharedArrayBuffer` und damit ORT-Threads verfügbar sind (Strato führt `Header set` in `.htaccess` aus, geprüft). Gemessen an 13 s Sprache auf einem M-Series-Mac, warm: base auf WebGPU 0,5 s, auf 8 Kernen 1,4 s; small 1,0 s bzw. 4,7 s. Schlägt WebGPU beim Laden fehl, fällt das Werkzeug still auf den Prozessor zurück.
  - **Modelle** (onnx-community/whisper-tiny/base/small) liegen **nicht im Repository** (~1 GB), sondern werden mit `vendor/whisper/holen.sh` geladen und von `deploy.sh` mitgespiegelt; `.gitignore` kennt die Ordner. Welche Fassungen und warum, steht im Kopf des Skripts — drei Fehlversuche stecken drin: der q8-Decoder lädt in ORT 1.26 nicht (QDQ-Fehler „Missing required scale“), der fp16-Encoder liefert auf WebGPU nur „und“, und der q8-Encoder ist auf WebGPU nicht schneller als auf dem Prozessor. Genommen: Prozessor q8-Encoder + q4-Decoder, WebGPU fp32-Encoder + q4-Decoder; die Größen (100/150/330 MB bzw. 120/210/590 MB) stehen je nach Rechenweg im Auswahlfeld.
  - Zwei Stolpersteine mit transformers.js, damit sie niemand noch einmal sucht: `env.localModelPath` muss **relativ** sein (eine absolute http-Adresse gilt als „fern“ und wird bei `allowRemoteModels=false` verweigert), und `dtype` je Datei muss unter Sitzungs- **und** Dateinamen stehen (`model` und `encoder_model`), weil 4.2.0 an zwei Stellen unterschiedlich nachschlägt.
  - Service Worker fasst `/vendor/whisper/` nicht an — transformers.js hält die Modelle selbst im Cache-Speicher, sonst lägen bis zu 600 MB doppelt auf der Platte. `.htaccess`: `.mjs` als JavaScript, `.onnx`/`.mjs` ein Jahr unveränderlich, eigene `tools/*/…js` (Textstrom, Worker) wie `js/` mit `no-cache`.
- Testfall: Ladetest immer; liegen die Modelle lokal und gibt es macOS-Sprachausgabe (`say`), wird eine echte Probe („Dies ist ein Test der Transkription im Browser“) mit dem kleinen Modell erkannt, der Text muss „Test“ enthalten und der SRT-Export gültig sein. Jetzt 66 Prüfungen.

### Geändert
- Startseite: „Audio & Video“ zählt jetzt 6 Karten; die Datei-Erkennung schlägt Transkription (und Ton verbessern) für Audio- und Videodateien vor; „Weiter zu …“ führt von Medien, Schneiden und Ton verbessern zur Transkription und von dort zu Text-Werkzeugen, Untertiteln und Word.
- FAQ und Datenschutz: vier statt drei KI-Werkzeuge, Werkzeugzahl 52 (JSON-LD neu erzeugt).

## 2026-08-18 (Werkzeug 51: Bild vektorisieren)

### Hinzugefügt
- Werkzeug **Bild vektorisieren** (`tools/vektorisieren/`) — PNG, JPG, WebP, GIF, BMP oder HEIC in eine SVG-Vektorgrafik verwandeln, mit VTracer (visioncortex) als WebAssembly, komplett lokal. Vorschau Original neben Ergebnis, jede Reglerbewegung rechnet neu (250 ms entprellt, ein laufender Durchlauf wird abgebrochen). Regler: Modus Farbig/Schwarz-Weiß, Vorlage Logo/Foto, Farbanzahl (automatisch, 2–32), Detailgrad, Flecken filtern, Kurven (Spline/Polygon/Pixel); unter „Feineinstellungen“ Flächenaufbau (gestapelt/ausgeschnitten), Eckenwinkel, Glättung, Größenbegrenzung (600/1200/2000 px/Original) und „unterste Fläche weglassen“. Ausgabe als `.svg`, dazu Flächenzahl, Größe und Rechendauer.
  - **Warum VTracer und nicht imagetracerjs/Potrace:** VTracer liefert die saubersten Kurven (Spline-Fit mit Eckenerkennung, hierarchisches Farbclustern) — das ist genau der Unterschied zu den Gratis-Uploadseiten. Es gibt aber keine fertige Browser-Ausgabe; das npm-Paket `@visioncortex/vtracer` ist ein wasm-bindgen-Build fürs Node-Ziel. `vendor/vtracer/vtracer.js` ist diese Bindung mit ausgetauschtem Ladeteil (fetch statt `readFileSync`), Rest unverändert, ohne Rust-Werkzeugkette nachbaubar. Details in `vendor/VERSIONEN.md`.
  - **Worker:** VTracer rechnet in `tools/vektorisieren/worker.js` in einem eigenen Strang — ein Foto mit 1200 px Kante braucht ~2–3 s, mit 2000 px deutlich mehr; die Seite bleibt bedienbar. Abbrechen = Worker beenden und neu starten (Modul kommt aus dem Cache).
  - **Transparenz:** VTracer kennt keine Deckkraft. Durchsichtige Bereiche werden gegen Weiß gerechnet; hat das Bild mehr als 1 % transparente Pixel, wird „unterste Fläche weglassen“ automatisch gesetzt, damit ein freigestelltes Logo auch im SVG freigestellt bleibt.
  - Detailgrad und Vorlage werden auf VTracers `colorPrecision`/`layerDifference` abgebildet (Foto: feinere Präzision, kleinere Schichtdifferenz), damit man nicht zwei abstrakte Zahlen einstellen muss. Schwarz-Weiß hat stattdessen Schwellwert und die adaptive Bradley-Roth-Schwelle für ungleich belichtete Scans.
  - Braucht wie das Freistellen einen Webserver (WASM per fetch); über `file://` gibt es eine Meldung.
- Testfall: 60-px-Testbild → SVG in Bildgröße mit mindestens zwei Flächen; Wechsel auf Schwarz-Weiß muss eine neue Vorschau rechnen. Jetzt 65 Prüfungen.

### Geändert
- Startseite: „Bilder“ zählt jetzt 7 Karten; Datei-Erkennung schlägt das Vektorisieren für Bilder und HEIC vor; „Weiter zu …“ führt zu Bilder konvertieren und Favicon.
- FAQ: Werkzeugzahl 51 (JSON-LD neu erzeugt).

## 2026-08-18 (Werkzeug 50: PDF-Text ersetzen)

### Hinzugefügt
- Werkzeug **PDF-Text ersetzen** (`tools/pdf-text-ersetzen/`) — das „härteste Brett“ der Ideenliste, als ehrliche Teillösung: Wörter, Namen, Daten und Beträge in einer fertigen PDF suchen und ersetzen, direkt im Inhaltsstrom der Seite. Mehrere Regeln gleichzeitig (Suchen → Ersetzen), Groß-/Kleinschreibung wählbar, jede Fundstelle gelb auf der Seitenvorschau markiert; ein Klick auf eine Textstelle übernimmt sie ins Suchfeld, ein Klick auf eine Markierung nimmt genau diese Stelle aus. Leeres Ersatzfeld löscht den Text. Nach dem Speichern werden die geänderten Seiten aus dem Ergebnis neu gezeichnet, ersetzte Stellen grün.
  - **Warum nicht überdecken:** Fast alle „PDF-Editoren“ ohne Acrobat legen ein weißes Kästchen über den alten Text — der bleibt kopierbar und durchsuchbar in der Datei. Hier werden genau die Bytes ausgetauscht, die den Text zeichnen; alles Übrige bleibt bytegleich, unveränderte Seiten sowieso.
  - **Arbeitsteilung** (`textstrom.js`, ~600 Zeilen, klassisches Skript): pdf.js liefert per `getOperatorList` je Textoperator die Glyphen samt Unicode, Code und Breite (Schriften entschlüsseln will man nicht selbst schreiben). Ein eigener Tokenizer zerlegt den rohen Inhaltsstrom mit Byte-Offsets (Literal-/Hex-Strings, verschachtelte Arrays und Wörterbücher, Inline-Bilder mit Längenberechnung bzw. EI-Suche), verfolgt Textmatrix, Grafikzustand und `Do`-Aufrufe von Formular-XObjects genau so, wie pdf.js sie inline ausführt — die n-te Textstelle im Strom gehört dann zur n-ten Glyphenliste. Stimmen die Zahlen nicht überein, wird die Seite als „ungewöhnliche Struktur“ gemeldet statt falsch bearbeitet. pdf-lib schreibt die geänderten Ströme zurück (Seiteninhalt als neuer Flate-Strom, XObjects an Ort und Stelle).
  - **Schrift:** Ein neuer Text wird in der **Originalschrift** gesetzt, wenn jedes seiner Zeichen in dieser Schrift irgendwo im Dokument schon vorkam — dann sind Glyphe und Code bekannt, auch bei Subset-Schriften mit 2-Byte-CIDs (Chrome, Word, LibreOffice). Ligaturen werden dabei als Ganzes gefunden, ein fehlendes Leerzeichen (pdfTeX!) wird als Vorschub im TJ-Array geschrieben. Fehlt ein Zeichen, springt eine **Ersatzschrift** ein: Helvetica/Times/Courier nach den pdf.js-Merkmalen der Originalschrift (Serifen, Festbreite, fett, kursiv), eingebettet als Standardschrift und in die Ressourcen des betroffenen Stroms eingetragen. Das Protokoll sagt für jeden Durchlauf, wie viele Stellen welchen Weg gingen.
  - **Textfluss, so weit PDF ihn hergibt:** Text, der zum selben Operator gehört, rückt nach. Stößt der neue Text an separat gesetzten Nachbartext (nächster Lauf derselben Zeile mit eigener Positionierung), wird er per `Tz` schmaler gesetzt, bis er in die Lücke passt — nie unter 50 %, dann warnt das Protokoll. Zeilenumbruch gibt es nicht; das steht so auch auf der Seite.
  - **Zeilen** entstehen aus aufeinanderfolgenden Läufen mit gleicher Grundlinie und kleinem Abstand; Lücken über 0,13 em (und große negative TJ-Zahlen) zählen als Leerzeichen. So findet die Suche „Angebot Nr. 4711“ auch in einem Chrome-PDF, das jeden Buchstaben als eigenen Operator schreibt.
  - **Geteilte XObjects** (Briefkopf auf allen Seiten): Änderungen werden je XObject gesammelt und einmal geschrieben, Duplikate über den Byte-Offset erkannt; das Protokoll weist darauf hin, dass die Änderung auf allen betroffenen Seiten gilt.
  - **Grenzen, ausdrücklich:** verschlüsselte PDFs (auch nur mit Besitzerpasswort) werden abgewiesen → PDF-Passwort; Formularfelder und Kommentare bleiben unberührt (Annotationen sind für die Analyse abgeschaltet); Type-3- und vertikale Schriften sowie Text über ExtGState-Schriftwechsel gelten als nicht ersetzbar; Scans liefern „kein Text gefunden“.
  - Geprüft an pdf-lib-Standardschriften, an einem Chrome-Druck-PDF (Georgia/Arial/Courier New, 2-Byte-CIDs, ein Operator je Glyphe), an einem LibreOffice-PDF (23 Seiten), einem 412-Seiten-Dokument mit zwölf Subset-Schriften und Kopfzeilen-XObject (Analyse 1,6 s) und an einem reinen Bild-PDF.
- Testfall: 3-Seiten-PDF, zwei Regeln („Seite“ → „Blatt“ erzwingt Ersatzschrift, „1“ → „2“ geht in Originalschrift), Ausnehmen und Wiederaufnehmen per Klick auf die Markierung; das Ergebnis wird erneut gelesen und muss „Blatt 2 / Blatt 2 / Blatt 3“ ergeben. Jetzt 64 Prüfungen.

### Geändert
- Startseite: PDF zählt jetzt 14 Karten; die Datei-Erkennung schlägt das Werkzeug für PDFs vor; „Weiter zu …“ führt zu Komprimieren, Stempeln und Passwort.
- Service Worker: eigener Code unter `tools/*/…js` wird jetzt wie `js/` „Netz zuerst“ geladen (bisher galt das nur für den QR-Code-Ordner); Cache-Version 2026-08-18a.
- FAQ: Werkzeugzahl auf 50 aktualisiert (JSON-LD neu erzeugt).

## 2026-08-17 (Werkzeug 49: Bild als ASCII-Art)

### Hinzugefügt
- Werkzeug **Bild als ASCII-Art** (`tools/bild-ascii/`) — Fotos und Grafiken in Bilder aus Textzeichen verwandeln, mit Live-Vorschau: Breite (20–240 Zeichen), Zeichensatz (10 Stufen, 70 Stufen, Blockzeichen ░▒▓█ oder eigene Zeichen) und Invertieren für dunkle Hintergründe. Ergebnis als .txt oder in die Zwischenablage.
  - Die Helligkeit je Zeichenzelle kommt aus einem einzigen `getImageData` auf einem auf Zielgröße verkleinerten Canvas — der Browser übernimmt das saubere Herunterrechnen. Gerechnet wird mit der Luminanz nach Rec. 709; transparente Stellen werden gegen Weiß gerechnet, gelten also als hell.
  - Die Zeilenzahl ist halbiert (Faktor 0,5), weil Monospace-Zeichen etwa doppelt so hoch wie breit sind — ohne die Korrektur käme jedes Bild in die Länge gezogen heraus.
  - „Invertieren“ dreht nicht nur die Zeichenzuordnung um, sondern stellt auch die Vorschau auf dunklen Grund — man sieht also genau das, was am Zielort (etwa im Terminal) ankommt.
  - Eigene Zeichensätze werden mit `[...str]` zerlegt, damit auch Emoji und Blockzeichen als ganze Zeichen behandelt werden statt in Surrogat-Hälften zu zerfallen.
- Testfall: Das 60×60-Testbild muss bei Breite 100 exakt 100 Zeichen je Zeile und ~50 Zeilen ergeben (Seitenverhältnis-Korrektur), und Invertieren muss die Ausgabe tatsächlich ändern. Jetzt 63 Prüfungen.

### Geändert
- Startseite: „Web & Entwicklung“ zählt jetzt 8 Karten; die Datei-Erkennung schlägt ASCII-Art für Bilder mit vor; „Weiter zu …“ führt zum Text-Werkzeug. Der Daten-URI-Konverter verweist im Fußtext auf das neue Schwesterwerkzeug.
- FAQ: Werkzeugzahl auf 49 aktualisiert (JSON-LD neu erzeugt).

## 2026-08-17 (Werkzeug 48: XML lesen)

### Hinzugefügt
- Werkzeug **XML lesen** (`tools/xml-lesen/`) — das erste XML-Werkzeug der Seite: Baumansicht mit Elementen, Attributen, Kommentaren und CDATA, Suche über Namen, Attribute und Inhalte, XPath-artige Pfad-Anzeige (`/kunden/kunde[2]/name`, Klick auf ein Attribut hängt `/@id` an). Kaputtes XML wird mit Zeile und Spalte gemeldet — die stecken je nach Browser in ganz unterschiedlich formulierten `parsererror`-Meldungen, deshalb liest eine kleine Muster-Kaskade beide Formate. XML steckt in mehr Dateien, als man denkt: RSS, Atom, SVG, Rechnungsformate, Sitemaps — alles davon lässt sich hineinziehen.
  - Der Download liefert die Datei **sauber eingerückt oder minimiert** — mit einem eigenen Serializer, weil der eingebaute `XMLSerializer` nicht einrücken kann. Wichtigste Regel darin: Abschnitte mit gemischtem Inhalt (Text neben Elementen) werden unverändert übernommen, denn dort gehört jedes Leerzeichen zum Inhalt; Einrücken würde die Bedeutung verändern.
  - Elemente, die nur Text enthalten, stehen kompakt in einer Zeile (`<name id="1"> Anna`) statt als aufklappbarer Ast mit einem einzigen Kind — sonst bestünde ein Adressbuch fast nur aus Klapp-Pfeilen. Namensräume werden nur dort angezeigt, wo sie sich vom Elternelement unterscheiden.
  - Baum, Suche und blockweises Nachladen übernehmen das Muster von „JSON lesen“ aus dem vorigen Eintrag.
- Zwei Testfälle: Baum samt Statistik (5 Elemente, 2 Attribute, 1 Kommentar) und Pfad-Klick (`/kunden/kunde[2]/name`); der heruntergeladene formatierte Export wird zur Gegenprobe erneut geparst und muss fehlerfrei dieselben 5 Elemente ergeben — das sichert den handgeschriebenen Serializer ab. Dazu kaputtes XML, das eine Meldung mit Zeilenangabe zeigen muss. Jetzt 62 Prüfungen.

### Geändert
- Startseite: „Tabellen & Daten“ zählt jetzt 5 Karten; die Datei-Erkennung kennt erstmals `.xml`, `.rss`, `.atom`, `.xsd` und `.xsl`; „Weiter zu …“ führt vom XML-Reader zum Vergleichen und zu den Text-Werkzeugen.
- FAQ: Werkzeugzahl auf 48, XML in der Formatliste ergänzt (JSON-LD neu erzeugt).

## 2026-08-17 (Werkzeug 47: JSON lesen)

### Hinzugefügt
- Werkzeug **JSON lesen** (`tools/json-lesen/`) — JSON als aufklappbaren Baum ansehen, durchsuchen und zu jedem Eintrag den Zugriffspfad kopieren (etwa `kunden[2].adresse.ort`). Das bestehende „JSON & YAML“ verändert Daten (formatieren, minimieren, umwandeln); der Reader beantwortet die andere, mindestens so häufige Frage: „Wo steht hier eigentlich was?“
  - Der Baum entsteht **faul**: Jede Ebene wird erst beim Aufklappen gebaut, Listen mit über 500 Einträgen erscheinen blockweise („Weitere 500 anzeigen“), sehr lange Texte gekürzt mit „mehr anzeigen“. So bleibt der Tab auch bei API-Antworten mit hunderttausenden Einträgen flüssig. Ein „Alles aufklappen“ gibt es bewusst nicht — genau das würde bei solchen Dateien einfrieren; die Suche ersetzt den Anwendungsfall.
  - Die **Suche läuft über die Daten, nicht über die Anzeige** — sie findet also auch Treffer in zugeklappten Ästen und klappt beim Hinspringen den Weg dorthin auf. Gesucht wird in Schlüsseln und Werten, mit Treffer-Navigation (‹ ›, Enter, Umschalt+Enter).
  - Gebaut als `<details>`-Verschachtelung: nativ faltbar und tastaturbedienbar, ohne eigenen Klapp-Zustand im Skript. Fehler werden wie beim Schwesterwerkzeug mit Zeile und Spalte gemeldet; ein vorangestelltes BOM wird vor dem Parsen entfernt (der klassische „Fehler in Zeile 1 ohne sichtbaren Grund“).
- Zwei Testfälle: Baum samt Statistik und Pfad-Anzeige (Klick auf einen Knoten muss `a.z` liefern) und ein kaputtes JSON, das eine Fehlermeldung mit Zeilenangabe zeigen muss. Jetzt 60 Prüfungen.

### Geändert
- Startseite: „Tabellen & Daten“ zählt jetzt 4 Karten; die Datei-Erkennung schlägt für `.json` jetzt auch den Reader und „JSON & YAML“ vor (letzteres fehlte dort schlicht — behoben); „Weiter zu …“ verbindet beide JSON-Werkzeuge in beide Richtungen.
- FAQ: Werkzeugzahl auf 47 aktualisiert (JSON-LD neu erzeugt). Dabei eine alte Inkonsistenz behoben: Die Stempel-Antwort sprach von „42 von 45“ Werkzeugen, obwohl es längst 46 waren.

## 2026-08-04 (Bild-Metadaten: jetzt auch entfernen)

### Hinzugefügt
- **„Ohne Metadaten speichern“** im Werkzeug Bild-Metadaten — bisher konnte es nur anzeigen und verwies zum Entfernen auf „Bilder konvertieren“. Jetzt schneidet es EXIF, XMP, IPTC und Kommentare **verlustfrei** direkt aus der Datei (JPG, PNG, WebP): Es werden nur die Metadaten-Blöcke entfernt, kein einziger Bildpunkt wird neu berechnet.
  - Bei JPG wird als Positivliste gearbeitet: Behalten wird nur, was zum Bild gehört (JFIF, ICC-Farbprofil, Adobe-Farbkennung) — alles andere fliegt raus, auch **versteckt hinter dem Bildende angehängte Daten** wie das Kurzvideo von „bewegten Fotos“ mancher Handys.
  - Die **Ausrichtung bleibt als winziges Ersatz-EXIF erhalten** (ein handgebautes 36-Byte-Segment, nur der Orientation-Eintrag) — sonst lägen gedreht aufgenommene Fotos nach dem Entfernen auf der Seite. Sie verrät nichts Persönliches.
  - **Gegenprobe eingebaut:** Die bereinigte Datei wird vor dem Anbieten noch einmal eingelesen; findet sich außer der Ausrichtung noch irgendetwas, wird nichts gespeichert und stattdessen gewarnt. Lieber kein Ergebnis als ein falsches Sicherheitsgefühl.
  - Bei ungewöhnlich aufgebauten Dateien bricht das Werkzeug bewusst ab, statt zu raten; für HEIC und andere Formate verweist es weiter auf „Bilder konvertieren“.
- Testfall dazu: Ein JPEG mit handgebautem EXIF-Segment (Kameraname, Ausrichtung 6, GPS-Position) wird bereinigt und wieder eingelesen — GPS und Kamera müssen weg sein, die Ausrichtung muss bleiben. Jetzt 58 Prüfungen.

### Geändert
- Die Standortwarnung im Werkzeug bietet „Metadaten jetzt entfernen“ als direkten Klick an, statt zum Konvertierer zu schicken.
- Startseite und FAQ: Das Werkzeug heißt jetzt „Bild-Metadaten anzeigen & entfernen“; die Datei-Erkennung schlägt es für Bilder und HEIC-Fotos mit vor (FAQ-JSON-LD neu erzeugt).

## 2026-08-04 (Werkzeug 46: Schwärzen)

### Hinzugefügt
- Werkzeug **Schwärzen (PDF & Bild)** (`tools/schwaerzen/`) — Bereiche direkt auf der Seite mit der Maus aufziehen, beim Speichern wird der Inhalt **wirklich entfernt**, nicht nur überdeckt. Genau die Aufgabe, für die sonst gern dubiose Onlinedienste mit den heikelsten Dokumenten gefüttert werden.
  - Warum nicht einfach ein schwarzes Rechteck ins PDF zeichnen? Weil der Text darunter erhalten bliebe — markieren, kopieren, Balken verschieben, alles lesbar. Stattdessen werden **geschwärzte Seiten gerastert** (Auflösung wählbar, 100–300 dpi) und als Bild neu ins PDF gelegt; unmarkierte Seiten werden verlustfrei aus dem Original übernommen und behalten ihren durchsuchbaren Text. Der Nachteil (geschwärzte Seiten nicht mehr durchsuchbar, Datei ggf. größer) steht ehrlich auf der Seite.
  - Bilder (JPG, PNG, WebP, HEIC) werden pixelweise geschwärzt und neu kodiert — dabei fallen nebenbei sämtliche Metadaten weg, auch der GPS-Standort.
  - Bewusst nur volles Schwarz, kein Verpixeln oder Weichzeichnen: solche Effekte lassen sich teils zurückrechnen.
  - Passwortgeschützte PDFs gehen mit Öffnungspasswort; dann werden alle Seiten neu aufgebaut, weil pdf-lib die verschlüsselte Vorlage nicht kopieren kann.
- Die Testsuite prüft beim Schwärzen nicht nur, ob ein Download entsteht, sondern **zieht das Rechteck per Mausereignissen auf und liest das Ergebnis-PDF wieder ein**: Seite 1 darf keinen Text mehr enthalten, Seite 3 muss ihren behalten. Beim Bild wird nachgemessen, dass die Mitte tatsächlich schwarz ist. Dazu ein Randfall (beschädigtes PDF) — jetzt 57 Prüfungen.
- Neues Hilfsskript `tests/faq-jsonld.js`: erzeugt das JSON-LD der FAQ-Seite aus dem sichtbaren Seitentext neu, damit das nicht mehr von Hand passieren muss.

### Geändert
- Startseite: PDF-Kategorie zählt jetzt 13 Karten; die Datei-Erkennung schlägt Schwärzen für PDFs und Bilder mit vor; „Weiter zu …“ führt vom Schwärzen zu PDF komprimieren bzw. Bilder konvertieren.
- FAQ: Werkzeugzahl auf 46 aktualisiert (JSON-LD neu erzeugt).

## 2026-07-26 (Planungsnotizen privat)

### Geändert
- **`ideen.txt` wird nicht mehr mitversioniert** und ist in `.gitignore` eingetragen — die Datei ist eine persönliche Planungsnotiz und bleibt lokal. Auf der Website war sie ohnehin nie: `deploy.sh` schließt sie seit dem ersten Deploy aus.
- Der Verweis auf die Datei ist aus dem FAQ verschwunden. Die Aussage, dass die Seite weiterentwickelt wird, steht weiterhin dort — jetzt mit dem Hinweis auf die Änderungsliste als nachvollziehbare Quelle und der Einladung, sich Werkzeuge zu wünschen.
- Ältere Changelog-Einträge nennen den Dateinamen nicht mehr; auf eine Datei zu verweisen, die es öffentlich nicht gibt, wäre nur verwirrend. Der Inhalt der Einträge bleibt unverändert.

## 2026-07-26 (Werkzeug 45: Subnetzrechner)

### Hinzugefügt
- Werkzeug **Subnetzrechner** (`tools/subnetz/`) — die Kernlogik stammt aus dem eigenen Projekt `work-subnetcalc`, Oberfläche und Speicherwege sind neu gebaut. Drei Betriebsarten:
  - **Übersicht:** Netzmaske, Wildcard-Maske, Netz- und Broadcast-Adresse, Hostbereich, Adressenzahl — dazu die Bitdarstellung mit farblich abgesetztem Netzanteil und eine Einordnung der Adresse (privat nach RFC 1918, Loopback, APIPA, Carrier-NAT, Multicast, Dokumentationsbereich oder öffentlich).
  - **Unterteilen:** Ein Netz in gleich große Teilnetze zerlegen, jeden Block einzeln weiter — so entsteht auch ein ungleichmäßiger Plan (VLSM). Die Verschachtelungstiefe ist an der Farbe der linken Kante ablesbar.
  - **Netz ausschließen:** Belegte Teilnetze eintragen, heraus kommt die kürzestmögliche Liste von CIDR-Blöcken, die den Rest lückenlos abdeckt — die Liste, die man für Firewall-Regeln und Routen braucht.
- Export als CSV (mit Kopfzeilen zum Basisnetz), CSV mit Komma, reine CIDR-Liste oder JSON. Präfixlängen von /0 bis /32, mit korrekter Behandlung von /31 (RFC 3021: beide Adressen nutzbar) und /32.
- Ein CIDR lässt sich direkt ins Adressfeld einfügen — die Präfixlänge wird dann übernommen. Adressen, die nicht auf der Netzgrenze liegen, werden gerundet und das wird gesagt statt still gemacht.
- **Neue Dauerprüfung „Seitenbreite bei 390 px“** in der Testsuite: Jede Seite wird in Handybreite geladen und nachgemessen, ob sie waagerecht überläuft. Die Suite umfasst jetzt 54 Prüfungen.

### Behoben
- **Gitterzellen konnten nicht schmaler werden als ihr Inhalt** (`css/tools.css`). Ohne `min-width:0` zieht eine breite Tabelle oder eine lange Zeile ohne Umbruch die ganze Seite auseinander, statt im eigenen Kasten zu scrollen. Aufgefallen ist das beim Subnetzrechner, dessen Bitdarstellung nicht umbrechen darf — betroffen waren latent aber alle Werkzeuge mit breiten Tabellen. Auf dem Rechner ist davon nichts zu sehen, deshalb die neue Dauerprüfung.

### Geändert
- Die Zählungen im FAQ auf 45 Werkzeuge angepasst (42 davon ohne KI).

## 2026-07-26 (FAQ-Seite und KI-Stempel)

### Hinzugefügt
- **Eigene FAQ-Seite** (`faq.html`) mit 43 Fragen in acht Bereichen: Grundsätzliches, Datenschutz, Beruflich & DSGVO, Künstliche Intelligenz, Technik & Offline, Dateien & Formate, Wenn etwas klemmt, Über das Projekt. Bisher standen die Antworten verstreut in 44 Erklärtexten und in der Datenschutzerklärung — Letztere ist juristisch formuliert und beantwortet damit genau die Fragen nicht, die Leute wirklich haben. Neu und vorher nirgends beantwortet sind unter anderem: „Wie kann ich das selbst überprüfen?“ (Flugmodus-Test, Netzwerk-Reiter, Quellcode), „Brauche ich einen Auftragsverarbeitungsvertrag?“ (nein — es gibt keinen Auftragsverarbeiter), „Kann ich damit Patientendaten bearbeiten?“ und „Wo ist der Haken?“.
- Filterfeld mit Sofortsuche wie auf der Startseite, Sprungmarken zu jedem Bereich, und jede Frage ist über `#frage-N` direkt verlinkbar. Der Bereichsname zählt beim Suchen mit — wer „dsgvo“ tippt, findet auch die Fragen darunter, in denen das Wort selbst nicht vorkommt.
- Das FAQ-Markup (JSON-LD) wird beim Bauen aus den tatsächlich auf der Seite stehenden Fragen erzeugt, damit Markup und sichtbarer Text nicht auseinanderlaufen können.
- **Stempel „KI nur lokal“ auf den drei betroffenen Karten der Startseite.** Ein roter Gummistempel-Abdruck über der unteren Kante zeigt auf einen Blick, wo ein neuronales Netz arbeitet — und beantwortet die entscheidende Frage gleich mit. Wo kein Stempel ist, ist auch keine KI: 41 von 44 Werkzeugen. Der Stempel ist im FAQ eigens erklärt.
- Die FAQ-Seite ist aus der Fußzeile aller 44 Werkzeugseiten, der Startseite, dem Impressum und der Datenschutzerklärung erreichbar und in Sitemap und Service-Worker eingetragen.

### Geändert
- Die Stempelvorlage aus `assets/` wurde für den Einsatz aufbereitet: „AI-Generated“-Etikett entfernt, leerer Rand weggeschnitten, auf 300 px skaliert und zusätzlich als WebP abgelegt (32 statt 573 KB).

## 2026-07-26 (KI-Aussage klargestellt)

### Hinzugefügt
- **Neues Argument auf der Startseite: „Deine Dateien trainieren keine KI.“** Anlass war die Nachfrage, ob die Seite ganz ohne KI auskommt. Das tut sie nicht — Hintergrund entfernen (U²-Net), Texterkennung und PDF durchsuchbar machen (Tesseract) arbeiten mit neuronalen Netzen. Ein Werbeversprechen „keine KI“ wäre also falsch gewesen, und ausgerechnet auf einer Seite, die mit Nachprüfbarkeit wirbt, wäre das der teuerste denkbare Fehler. Die zutreffende und für Besucher wichtigere Aussage ist: Es wird kein KI-Dienst angefragt, die Modelle liegen als Datei auf dieser Website und rechnen im Browser, und nichts fließt in ein Training ein.
- **Datenschutzerklärung, neuer Abschnitt 6** („Künstliche Intelligenz: kein Dienst, kein Training“) — nennt die drei betroffenen Werkzeuge samt Modell beim Namen und hält fest, dass alle übrigen ganz ohne KI rechnen. Die folgenden Abschnitte wurden weitergezählt.
- Die drei KI-Werkzeuge beantworten die Frage jetzt auch auf der eigenen Seite. Bisher stand dort nur „wird nicht hochgeladen“ — bei KI ist „wird nicht zum Training benutzt“ aber die Frage, die zuerst kommt. Bei Freistellen und Texterkennung wandert sie zusätzlich ins FAQ-Markup.
- **Deutlich sichtbarer Hinweis auf den drei KI-Werkzeugen** (`.ki-hinweis` in `css/tools.css`), direkt unter der Überschrift statt versteckt im Erklärtext: „Hier arbeitet KI — und zwar auf deinem Gerät.“ Genannt werden das jeweilige Modell, dass kein KI-Dienst angefragt wird und dass nichts in ein Training fließt; ein Link springt zum passenden Abschnitt der Datenschutzerklärung. Umrandet in der Hausfarbe statt in Alarmrot — die Aussage ist eine Entwarnung, keine Warnung.

## 2026-07-26 (Acht Werkzeuge, LICENSE, neue Gliederung)

### Hinzugefügt
- **LICENSE** (MIT). Ohne Lizenzdatei galt beim öffentlichen Repo formal „alle Rechte vorbehalten“, was schlecht zum Vertrauensargument der Seite passt. MIT statt Apache-2.0, weil es kürzer ist und für eine Sammlung von HTML-Seiten die Patentklausel keinen Nutzen bringt. Die mitgelieferten Bibliotheken unter `vendor/` behalten ihre eigenen Lizenzen; das steht in der Datei und in `vendor/VERSIONEN.md`.
- Werkzeug **Word-Datei erstellen** (`tools/word-erstellen/`) — der lange als „schwer, eher lassen“ eingestufte Punkt, jetzt doch gebaut: Aus Markdown, reinem Text oder HTML entsteht eine echte DOCX-Datei mit Überschriften-Formatvorlagen, Listen, Tabellen, Zitaten, Codeblöcken, wahlweise Titelseite, Inhaltsverzeichnis, Kopfzeile und Seitenzahlen. Schriftart, Größe, Zeilenabstand, Ränder und Seitenformat sind einstellbar, daneben steht eine Seitenvorschau. Geprüft wurde nicht nur, dass eine Datei entsteht, sondern dass der macOS-Word-Parser sie liest und die nummerierten Listen tatsächlich als `decimal` und nicht als Aufzählung ankommen.
- Werkzeug **EPUB lesen & umwandeln** (`tools/epub/`): E-Books werden im Browser entpackt und mit Inhaltsverzeichnis, Kapitelnavigation und Titelbild angezeigt; Export als HTML (Bilder eingebettet), reiner Text, Markdown oder ZIP mit einer Datei je Kapitel. EPUB 2 und 3, Inhaltsverzeichnis aus `nav.xhtml` oder `toc.ncx`. Ohne zusätzliche Bibliothek — das vorhandene JSZip genügt, epub.js wäre 400 KB für Funktionen gewesen, die diese Seite nicht braucht. Dateien mit Kopierschutz werden erkannt und klar abgelehnt.
- Werkzeug **Texte & Tabellen vergleichen** (`tools/vergleichen/`): Diff nach Myers — dasselbe Verfahren wie in Git — mit wortgenauer Hervorhebung innerhalb geänderter Zeilen, wahlweise neben- oder untereinander. Im Tabellenmodus wird zellengenau verglichen, Zeilen können über eine Schlüsselspalte statt über die Position zugeordnet werden. Ergebnis als Unified-Diff oder als CSV der Änderungen.
- Werkzeug **CSV bereinigen** (`tools/csv-bereinigen/`): Spalten abwählen und per Ziehen sortieren, Duplikate über die ganze Zeile oder eine Schlüsselspalte entfernen, Zeilen über beliebig viele Filter (elf Bedingungen, UND/ODER) einschränken, Leerraum trimmen. Mit Bilanz, was jeder Schritt weggenommen hat. Ausgabe als CSV, TSV, Excel oder JSON.
- Werkzeug **Bildergalerie als HTML** (`tools/bildergalerie/`): mehrere Bilder hineinziehen, sortieren, beschriften — heraus kommt ein fertiger Schnipsel mit Raster, Mauerwerk oder Scrollreihe, Bildunterschriften, alt-Texten und optionaler Großansicht. Die Bilder werden dabei auf eine wählbare Breite verkleinert; wahlweise eingebettet als eine einzige Datei oder als ZIP mit Ordner `bilder/`.
- Werkzeug **Testdaten & Blindtext** (`tools/testdaten/`): Lorem Ipsum, deutscher Blindtext und Behördenton nach Absätzen, Sätzen, Wörtern oder Zeichen; dazu Datensätze mit deutschen Namen, Adressen, E-Mails, Telefonnummern, Geburtsdaten und **IBANs mit korrekt gerechneter Prüfziffer** nach ISO 13616 (Bankleitzahlen aus einem Bereich ohne echtes Institut). PLZ passt zum Ort, die E-Mail zum Namen. Mit Startwert für reproduzierbare Läufe, Ausgabe als CSV, JSON oder SQL.
- Werkzeug **Termin als ICS** (`tools/termin/`): Kalender-Einladungen nach RFC 5545 mit Zeitzone samt Sommerzeitregel, Wiederholung, Erinnerung, Organisator und Teilnehmern — mit Organisator und Teilnehmern wird daraus eine echte Einladung (`METHOD:REQUEST`). Zeilenfaltung nach 75 Oktetten wird in UTF-8-Bytes gerechnet, damit sie keine Umlaute zerreißt.
- Werkzeug **Regex ausprobieren** (`tools/regex/`): Treffer werden live im Text hervorgehoben, jede Gruppe einzeln aufgelistet, der Ausdruck in verständlichem Deutsch erklärt. Mit zehn fertigen Beispielen, Bausteinen zum Einsetzen und Ersetzen-Funktion. Die Auswertung bricht nach 1,5 Sekunden ab, damit verschachtelte Wiederholungen wie `(a+)+b` den Tab nicht einfrieren.
- Testfälle für alle acht neuen Werkzeuge; die Suite umfasst jetzt 52 Prüfungen. Neu darunter: Die erzeugten IBANs werden im Test gegen die Modulo-97-Regel nachgerechnet, und die ICS-Zeilen auf die 75-Oktette-Grenze geprüft.

### Geändert
- **Startseite neu gegliedert**: aus fünf Kategorien wurden sieben. „Extras“ war mit neun Werkzeugen zur Resterampe geworden — von der Passwort-Erzeugung bis zum Untertitel-Konverter stand dort alles, was sonst nirgends passte. Jetzt: PDF (12), Bilder (6), Dokumente & Text (7), Tabellen & Daten (3), Audio & Video (5), Web & Entwicklung (6), Alltag (5). Damit heißt jede Überschrift wieder etwas, und mit 44 Werkzeugen reichen Suche und Ausklappen weiterhin — Unterkategorien wären eine Ebene zu viel.
- Verkettung und Dateierkennung um die neuen Werkzeuge erweitert: eine hineingezogene CSV schlägt jetzt auch „CSV bereinigen“ und „Vergleichen“ vor, eine EPUB das neue Lesewerkzeug, eine Markdown-Datei zusätzlich „Word-Datei erstellen“.
- Links in den Erklärtexten waren bisher browserblau statt in der Hausfarbe (`css/tools.css`), und mehrzeilige Eingabefelder in der Seitenspalte nutzten die Breite nicht aus.
- Ideenliste aufgeräumt und neu gefüllt

## 2026-07-26 (Verkettung, Tastatur, Wartung)

### Hinzugefügt
- **Werkzeuge verketten** (`js/weiter.js`): Nach jedem fertigen Ergebnis erscheint ein „Weiter zu …“ mit passenden nächsten Schritten — nach dem Freistellen etwa Zuschneiden, nach der Texterkennung die Text-Werkzeuge. Ein Klick nimmt das eben erzeugte Ergebnis direkt mit, ohne Umweg über die Festplatte. Angedockt an `AK.offerDownload`, deshalb ohne Änderung an den einzelnen Werkzeugen.
- **Tastaturbedienung in den Miniaturen-Ansichten**: In „PDF bearbeiten“ lassen sich Seiten jetzt auch ohne Maus umsortieren (Pfeiltasten oder neue ←/→-Schaltflächen), drehen (R, mit Umschalt rückwärts) und löschen (Entfernen). Im Zuschnitt-Werkzeug bewegen die Pfeiltasten den Rahmen, mit Umschalt ändert sich die Größe, mit Alt in Ein-Pixel-Schritten. Der Rahmen ist anspringbar und hat einen sichtbaren Fokusrahmen.
- **Randfall-Tests**: beschädigte PDFs, kaputtes JSON, defekte ZIPs, leere DOCX, unlesbare Bilder und falsche Dateitypen — geprüft wird, dass eine verständliche Meldung erscheint statt eines stillen Absturzes. Die Suite umfasst jetzt 44 Prüfungen.
- **Lighthouse in der GitHub Action** (`.github/workflows/lighthouse.yml`): misst Startseite und drei Werkzeugseiten bei jedem Push und schlägt an, wenn eine Wertung unter die festgelegte Schwelle fällt.

### Behoben
- **Der Bildkonverter verschluckte unpassende Dateien kommentarlos.** Zieht man etwa eine Tabelle hinein, passierte schlicht nichts. Jetzt prüft die Ablagefläche zentral gegen das, was das Werkzeug laut Auswahlfeld annimmt, und sagt in verständlichen Worten, was erwartet wird — für alle Werkzeuge auf einmal. Gefunden hat das die neue Randfall-Prüfung.

### Geändert (Wartung)
- Bibliotheken gegen die Registry geprüft: mammoth und turndown aktualisiert. **pdf.js bleibt bewusst auf der letzten 3er-Fassung** — ab 4.0 gibt es nur noch ES-Module, was den Betrieb über `file://` beenden würde; Begründung in `vendor/VERSIONEN.md`, jährlich neu zu bewerten. **ffmpeg wurde zurückgerollt**, weil die neuere Fassung sich im Browser nicht mehr laden ließ.
- **Texterkennung um 9,5 MB verschlankt**: Die beiden Kernfassungen ohne LSTM wurden entfernt — die verwendeten schnellen Sprachmodelle sind LSTM-only, die Dateien wurden also nie angefordert. Erkennung danach unverändert.
- Ideenliste aufgeräumt und neu gefüllt

## 2026-07-26 (Werkzeug 36)

### Hinzugefügt
- Werkzeug **PDF durchsuchbar machen** (`tools/pdf-durchsuchbar/`) — die große Ergänzung zur Texterkennung: Aus einem gescannten PDF (oder mehreren Fotos) entsteht ein PDF, das aussieht wie vorher, in dem sich aber suchen, markieren und kopieren lässt. Dafür wird jedes erkannte Wort mit passender Größe an seiner tatsächlichen Position vollständig durchsichtig über den Scan gelegt. Geprüft wurde nicht nur, dass eine Datei entsteht, sondern dass sich der Text aus dem Ergebnis auch wirklich wieder auslesen lässt.

### Behoben
- Bei der Entwicklung: Tesseract liefert Wortpositionen in dieser Fassung nur, wenn man die Blockstruktur ausdrücklich anfordert — anfangs kamen deshalb null Wörter. Der Auslesecode kommt jetzt mit beiden Rückgabeformen zurecht.

## 2026-07-26 (Werkzeuge 34 und 35)

### Hinzugefügt
- Werkzeug **PDF-Formular ausfüllen** (`tools/pdf-formular/`): liest die Formularfelder eines PDFs aus und zeigt sie als normale Eingabefelder — Text, Ankreuzfelder, Auswahllisten und Optionsfelder. Die Angaben werden ins PDF zurückgeschrieben, auf Wunsch festgeschrieben, sodass sie sich nicht mehr ändern lassen. Enthält ein PDF gar keine Felder, sagt das Werkzeug das klar statt still nichts zu tun.
- Werkzeug **Ton verbessern** (`tools/ton-verbessern/`): gleicht die Lautheit nach dem Rundfunkstandard EBU R128 an (drei Zielwerte für Podcast, Streaming und Rundfunk), schneidet Stille am Anfang und Ende ab, dämpft gleichmäßiges Rauschen und legt auf Wunsch auf Mono zusammen. Mit direktem Hörvergleich vorher/nachher.

### Behoben
- PDF-Formular: Die Feldart wurde zunächst über `constructor.name` bestimmt — in der minimierten pdf-lib sind die Klassennamen jedoch verkürzt, sodass kein einziges Feld gefüllt wurde. Jetzt über `instanceof` gegen die exportierten Klassen.

## 2026-07-26 (Werkzeuge 32 und 33)

### Hinzugefügt
- Werkzeug **Dateien umbenennen** (`tools/bilder-umbenennen/`): benennt einen ganzen Stapel nach einem Muster um — Bausteine für fortlaufende Nummer, Originalname, Datum und Uhrzeit, dazu Suchen-und-Ersetzen, Schreibweise und das Ersetzen von Umlauten. Live-Vorschau jedes alten und neuen Namens, Namensdubletten werden automatisch durchnummeriert, Ergebnis als ZIP (die Originale bleiben unangetastet).
- Werkzeug **GIF erstellen** (`tools/gif-erstellen/`): animiertes GIF aus mehreren Bildern, Reihenfolge sortierbar, Tempo und Breite einstellbar, wahlweise vor und zurück abspielend. Erzeugt mit ffmpeg in zwei Durchgängen samt eigener Farbtabelle — das sieht deutlich besser aus als die Standardumwandlung — und zeigt das Ergebnis direkt animiert an.

## 2026-07-26 (Werkzeuge 30 und 31)

### Hinzugefügt
- Werkzeug **Bild als Daten-URI** (`tools/bild-base64/`): wandelt ein Bild in Base64 und liefert es fertig als reinen URI, CSS-Regel, HTML- oder Markdown-Schnipsel. Mit ehrlicher Größeneinschätzung — bis 10 KB grün, darüber gelb, ab 100 KB die klare Ansage, dass eine normale Bilddatei besser wäre — und einer Verkleinerung direkt im Werkzeug.
- Werkzeug **PDF-Übersichtsblatt** (`tools/pdf-kontaktabzug/`): legt alle Seiten als Miniaturen auf wenige A4-Blätter (fünf Raster von 4 bis 30 Stück je Blatt, hoch oder quer, wahlweise mit Seitenzahlen und Rahmen). Mit Vorschau des ersten Blatts, bevor gerechnet wird.

## 2026-07-26 (Werkzeuge 28 und 29)

### Hinzugefügt
- Werkzeug **Einheiten & Zeitzonen** (`tools/einheiten/`): neun Größenarten (Länge, Fläche, Volumen, Gewicht, Temperatur, Geschwindigkeit, Datenmenge, Zeitspanne, Druck) mit allen Einheiten auf einen Blick, dazu eine Uhrzeit gleichzeitig in 20 Zeitzonen — Sommer-/Winterzeit wird für das eingegebene Datum korrekt eingerechnet. Bewusst **ohne Währungen**, weil Wechselkurse einen Serverabruf erfordern würden.
- Werkzeug **JSON & YAML** (`tools/json-yaml/`): JSON aufhübschen, minimieren, Schlüssel sortieren und in beide Richtungen mit YAML wandeln. Fehler werden mit Zeile und Spalte gemeldet; sieht die Eingabe nach YAML aus, kommt statt einer kryptischen Meldung ein passender Hinweis.

## 2026-07-26 (Werkzeuge 26 und 27)

### Hinzugefügt
- Werkzeug **Farbwerte umrechnen** (`tools/farben/`): HEX, RGB, HSL und CMYK ineinander (jedes Feld ist bearbeitbar und zieht die anderen nach), neun Helligkeitsabstufungen zum Anklicken, Pipette zum Aufnehmen einer Farbe aus einem Bild und eine Kontrastprüfung nach der WCAG-Formel mit Urteil für Fließtext, große Schrift und die strenge Stufe.
- Werkzeug **Passwort-Generator** (`tools/passwort/`): Zeichenfolgen, Passphrasen aus rund 1300 deutschen Wörtern und Zahlen-PINs — erzeugt mit `crypto.getRandomValues` und gleichverteilt ohne Rest-Verzerrung, aus jeder gewählten Zeichengruppe mindestens ein Zeichen. Mit Stärkeanzeige in Bit und einer Schätzung, wie lange Durchprobieren dauern würde. Nichts wird gespeichert oder übertragen.

## 2026-07-26 (Werkzeug 25)

### Hinzugefügt
- Werkzeug **Bild-Metadaten anzeigen** (`tools/bild-metadaten/`): liest die EXIF-Angaben eines Fotos aus und übersetzt sie in verständliche Begriffe — Kamera und Objektiv, Aufnahmezeitpunkt, Blende, Belichtungszeit, ISO. Ist ein GPS-Standort enthalten, steht er als deutlich abgesetzte Warnung ganz oben, mit Kartenlink und direktem Verweis aufs Entfernen. Rohwerte auf Wunsch einblendbar, Ergebnis als Textdatei speicherbar.

## 2026-07-26 (Messung statt Umbau, Doku)

### Behoben
- Acht Textfelder in vier Werkzeugen hatten keine Beschriftung für Vorleseprogramme — mit `aria-label` nachgezogen. Alle Seiten stehen damit wieder bei 100 Punkten für Barrierefreiheit.

### Geprüft
- **Web Worker waren nicht nötig.** Vor dem geplanten Umbau wurde gemessen, ob die Oberfläche überhaupt blockiert — sie tut es nicht: 120 Seiten komprimieren ergab als längste Blockade 103 ms, sechs 12-Megapixel-Fotos umwandeln 97 ms (spürbar wird es ab etwa 600 ms). Grund: pdf.js, ffmpeg, Texterkennung und Freistellen bringen jeweils eigene Stränge mit, `canvas.toBlob` kodiert nebenher, und die `await`-Punkte zwischen den Schritten geben die Oberfläche frei. Statt eines Umbaus ohne Nutzen sichert jetzt ein Testfall diesen Zustand dauerhaft ab.

### Hinzugefügt
- `vendor/VERSIONEN.md`: vollständige Übersicht aller mitgelieferten Bibliotheken mit Version, Lizenz und Verwendungszweck, dazu Hinweise zur jährlichen Aktualisierung und zur LGPL-Auslieferung von ffmpeg
- Ideenliste aufgeräumt und neu gefüllt (u. a. Werkzeuge verketten, durchsuchbares PDF aus Texterkennung, EXIF anzeigen, Web Share Target, Deploy per GitHub Action)

## 2026-07-26 (Tests, Einstellungen, wichtiger Fehler behoben)

### Behoben
- **Word → HTML und Markdown ↔ HTML waren seit dem PWA-Einbau kaputt.** Das Skript, das die Service-Worker-Registrierung auf allen Seiten ergänzt hat, setzte sie beim *ersten* `</body>` ein — und das steht in diesen beiden Werkzeugen mitten in einem Textbaustein. Dadurch riss der Browser das Seitenskript an dieser Stelle ab, und keine der Funktionen wurde geladen. Aufgefallen ist es erst durch die neue Testsuite. Beide Seiten sind repariert, die Registrierung sitzt jetzt an der richtigen Stelle.

### Hinzugefügt
- **Automatische Tests** (`tests/`, `npm test`) und eine GitHub Action, die bei jedem Push läuft: Ein kleiner Webserver liefert die Website aus, ein echter Browser öffnet jedes der 24 Werkzeuge, schiebt eine passende Testdatei hinein und prüft, ob ein Download entsteht — dazu werden Konsolenfehler und Fehlermeldungen im Protokoll überwacht. Die Testdateien (PDF, PNG, DOCX, CSV, SRT) erzeugt das Skript selbst, ganz ohne zusätzliche Abhängigkeiten. Werkzeuge mit großen Modellen (ffmpeg, Texterkennung, Freistellen) werden auf Ladefähigkeit geprüft, statt jedes Mal 30 MB zu ziehen.
- **Werkzeuge merken sich ihre Einstellungen** (`js/einstellungen.js`): Zielformat, Qualität, Auflösung und Häkchen stehen beim nächsten Besuch wieder so, wie man sie zuletzt hatte — gespeichert nur lokal im Browser. Ausdrücklich ausgenommen sind Passwortfelder, Dateinamen, Texteingaben und Seitenbereiche; das ist über eine Sperrliste geregelt und im Test abgesichert. Datenschutzerklärung entsprechend präzisiert.

## 2026-07-26 (Werkzeug 24)

### Hinzugefügt
- Werkzeug **Hintergrund entfernen** (`tools/hintergrund-entfernen/`): stellt das Motiv automatisch frei — als PNG mit Transparenz oder direkt vor einer neuen Hintergrundfarbe, mit Vorher-Nachher-Vorschau und regelbarer Kantenschärfe (weich für Haare, hart für Gegenstände). Rechnet mit dem Modell U²-Net über die ONNX-Laufzeitumgebung vollständig im Browser; Modell und Laufzeit (~15 MB) liegen auf diesem Server und werden erst auf Klick geladen.
- **Zur Lizenzwahl:** Die bekannte Bibliothek `@imgly/background-removal` steht unter AGPL-3.0 und hätte diese Lizenz auf die gesamte Website übertragen. Stattdessen kommt der klar permissive Stapel zum Einsatz: U²-Net (Apache-2.0) mit onnxruntime-web (MIT).

## 2026-07-26 (Werkzeug 23 & offener Quellcode)

### Geändert
- **Das Repository ist jetzt öffentlich**: <https://github.com/ichrocke/alleskonverter>. Bei Werkzeugen, die mit vertraulichen Dateien umgehen, sollte niemand einem Versprechen glauben müssen — jetzt lässt sich Zeile für Zeile nachlesen, dass nichts hochgeladen wird. Hinweis darauf in der Datenschutzerklärung (eigener Abschnitt), in der USP-Leiste der Startseite, in der Fußzeile und im README. Vorher wurde die gesamte Git-Historie auf Zugangsdaten geprüft: `.env` war von Beginn an ausgeschlossen, in keinem Commit stehen Passwörter oder Serverdaten.

### Hinzugefügt
- Werkzeug **Texterkennung (OCR)** (`tools/texterkennung/`): liest Text aus Fotos, Screenshots und gescannten PDFs — auf Deutsch, Englisch oder gemischt. Läuft mit Tesseract (Apache-2.0) vollständig im Browser; Programm und Sprachdaten (~19 MB) liegen auf diesem Server und werden erst auf Klick geladen. Mehrseitige PDFs werden Seite für Seite gerendert und einzeln erkannt, kleine Vorlagen automatisch hochskaliert, und eine optionale Aufbereitung (Graustufen, mehr Kontrast) verbessert Fotos. Ergebnis kopieren oder als .txt speichern.

## 2026-07-26 (Werkzeug 22)

### Hinzugefügt
- Werkzeug **Medien schneiden** (`tools/medien-schneiden/`): Anfang und Ende am Abspieler festlegen (Schieberegler, Zeitfelder oder „aktuelle Stelle übernehmen“), Ausschnitt vorab anhören und speichern. Standardmäßig ohne Neuberechnung — das dauert nur Sekunden und kostet keine Qualität, setzt den Schnitt dafür am nächsten Schlüsselbild an; alternativ bildgenau mit Neuberechnung. Bei Videos lässt sich wahlweise nur die Tonspur speichern.

## 2026-07-26 (Datei wird mitgenommen)

### Hinzugefügt
- **Dateiübergabe von der Startseite ans Werkzeug** (`js/uebergabe.js`): Wer eine Datei auf die Startseite zieht, bekommt nicht nur Vorschläge — die Datei wird beim Klick gleich mitgenommen und ist im Werkzeug sofort geladen. Dafür liegt sie kurz in der lokalen Datenbank des Browsers (IndexedDB) und wird beim Übernehmen sofort wieder gelöscht; die Adresszeile wird anschließend aufgeräumt, damit ein Neuladen nichts Altes zeigt. Übertragen wird selbstverständlich nichts. Datenschutzerklärung entsprechend ergänzt.

## 2026-07-26 (Werkzeug 21)

### Hinzugefügt
- Werkzeug **PDF-Passwort** (`tools/pdf-passwort/`): PDFs mit AES-128 verschlüsseln (Öffnungspasswort und/oder Rechte-Passwort, mit Schaltern für Drucken, Kopieren, Ändern und Kommentare) oder einen bekannten Schutz wieder entfernen. Beim Laden wird automatisch erkannt, ob eine Datei geschützt ist, und der passende Modus vorgewählt; das Öffnungspasswort bekommt eine Stärke-Einschätzung. Passwörter werden bewusst **nicht** durchprobiert — das Werkzeug entsperrt eigene Dokumente, es knackt keine fremden. Dafür ist `vendor/pdf-lib-crypt.min.js` (@cantoo/pdf-lib, MIT) dazugekommen.

## 2026-07-26 (Werkzeug 20)

### Hinzugefügt
- Werkzeug **Bilder zusammenfügen** (`tools/bilder-zusammenfuegen/`): mehrere Bilder nebeneinander, untereinander oder als Raster zu einem einzigen verbinden — mit sortierbarer Reihenfolge, einstellbarem Abstand, wählbarem Hintergrund und Live-Vorschau samt Maßangabe. Unterschiedlich große Bilder werden auf eine gemeinsame Kante gebracht, im Raster vollständig in gleich große Zellen eingepasst; HEIC wird beim Laden umgewandelt.

## 2026-07-26 (Werkzeug 19)

### Hinzugefügt
- Werkzeug **Favicon-Generator** (`tools/favicon/`): erzeugt aus einem Bild alle gängigen Symbolgrößen, eine echte `favicon.ico` mit 16/32/48 px (im Browser zusammengesetzt), Apple-Touch-Icon, App-Icons, eine `site.webmanifest` und den passenden HTML-Schnipsel — alles als ZIP. Mit Live-Vorschau inklusive Browser-Tab-Simulation, wählbarem Hintergrund und Rand für runde App-Symbole.

## 2026-07-26 (Startseite neu geordnet)

### Geändert
- **Startseite für viele Werkzeuge umgebaut**: Suchfeld ganz oben (filtert live über Name, Beschreibung und hinterlegte Suchwörter wie „heic“ oder „verkleinern“, Umlaute egal; mit `/` direkt anspringbar, `Esc` leert), Kategorien sind jetzt aufklappbar mit Anzahl-Anzeige und lassen sich gesammelt auf- und zuklappen. Auf schmalen Bildschirmen ist zunächst nur die erste Kategorie offen.
- **Datei auf die Startseite ziehen** schlägt passende Werkzeuge vor: Die ganze Seite ist Ablagefläche, erkannt werden PDF, Bilder, iPhone-Fotos, Tabellen, Word, Markdown, HTML, Untertitel, ZIP, Audio und Video — bei unbekannten Endungen kommt ein verständlicher Hinweis. Die Dateien werden dabei nur dem Namen nach betrachtet und selbstverständlich nirgends hingeschickt.
- Nummerierung auf den Karten entfernt — sie sagte nach dem Umbau nichts mehr aus

## 2026-07-26 (Werkzeug 18)

### Hinzugefügt
- Werkzeug **Untertitel SRT ↔ VTT** (`tools/untertitel/`): wandelt in beide Richtungen um, zieht auf Wunsch nur den reinen Text ohne Zeitmarken heraus und verschiebt alle Zeitmarken um einen festen Betrag (Zehntelsekunden möglich) — praktisch bei Untertiteln, die dem Bild hinterherlaufen. Liest auch VTT mit Kopfzeilen und Positionsangaben.

## 2026-07-26 (Werkzeug 17)

### Hinzugefügt
- Werkzeug **Text-Werkzeuge** (`tools/text-werkzeuge/`): Base64 und URL-Kodierung in beide Richtungen, Prüfsummen (SHA-256/SHA-1/SHA-512 über die Krypto-Schnittstelle des Browsers), Groß-/Kleinschreibung, Zeilen umkehren, doppelte Zeilen entfernen, Leerraum aufräumen — dazu eine Live-Zählung von Zeichen, Wörtern, Zeilen und UTF-8-Bytes. Ergebnis kopieren, zurück in die Eingabe übernehmen oder als .txt speichern.

## 2026-07-26 (Rückbau Dunkelmodus, verlässliche Updates)

### Entfernt
- **Dunkelmodus** wieder ausgebaut: keine `prefers-color-scheme`-Palette mehr, einheitliche theme-color-Angabe, QR-Werkzeug wieder fest auf die helle Papier-Darstellung gesetzt. Die dabei entstandenen Farbvariablen (`--stamp-text`, `--field`, `--grain`) bleiben — sie ersetzen fest verdrahtete Farbwerte und machen das CSS einheitlicher.

### Geprüft
- Fünf aufeinanderfolgende Deploy-Zyklen gegen die Live-Seite mit einem Browser, der Cache und aktiven Service Worker behält: jede CSS-Änderung und jede Rücknahme kam ohne harten Reload an. Die Rückfrage beim Server kostet dabei 0 Byte (Antwort „304 unverändert“).

### Behoben
- **Nach einem Deploy konnten Besucher altes CSS und JavaScript behalten**: `.htaccess` gab für alle Dateitypen ein Jahr Cache-Zeit vor, also auch für eigenen Code. Eigener Code (`/css/`, `/js/`, die Werkzeug-eigenen Dateien, `sw.js`, Manifest) wird jetzt bei jedem Aufruf beim Server rückgefragt — dank ETag antwortet der in aller Regel mit einem winzigen „304 unverändert“. Fremdbibliotheken und Schriften behalten die lange Cache-Zeit, da sie sich nie an Ort und Stelle ändern; eigene Bilder werden täglich geprüft.
- Einmalige Versionskennung (`?v=20260726`) an allen eigenen CSS- und JS-Verweisen — nötig, damit auch Besucher mit der bereits ein Jahr lang gespeicherten alten Fassung die neue Datei bekommen.
- `mod_expires` hängte an jede Antwort zusätzlich ein `Expires`-Datum ein Jahr in der Zukunft — zusammen mit dem neuen `no-cache` ein Widerspruch, an dem eine geänderte CSS-Datei in einem Test tatsächlich hängenblieb. Für eigenen Code wird `Expires` jetzt neutralisiert.
- Service Worker: Anfragen für eigenen Code laufen jetzt mit `cache: 'no-cache'`, damit ein veralteter Browser-Cache die „Netz zuerst“-Strategie nicht unterläuft; beim Nachschlagen im Cache wird die Versionskennung ignoriert.

## 2026-07-26 (PWA)

### Hinzugefügt
- **Installierbare App mit echtem Offline-Betrieb**: `manifest.webmanifest` (Name, App-Icons in 192/512 px inkl. maskierbarer Variante, Schnellzugriffe auf vier Werkzeuge) und `sw.js`. Beim ersten Besuch werden Grundgerüst, alle Bibliotheken und sämtliche Werkzeugseiten abgelegt — die Seitenliste kommt aus der `sitemap.xml` und pflegt sich damit selbst. Seiten und eigener Code werden „Netz zuerst“ geladen (Änderungen kommen sofort an), Bibliotheken und Schriften „Cache zuerst“; ffmpeg (~32 MB) wird erst nach tatsächlicher Nutzung behalten.
- `.htaccess`: `sw.js` vom Zwischenspeichern ausgenommen, damit Nutzer nie auf veralteter Logik festhängen

### Geändert
- Ideenliste und README auf den aktuellen Stand gebracht (Erledigtes gestrichen, Anleitung zum Hinzufügen neuer Werkzeuge ergänzt)

### Geprüft
- Offline-Test gegen die Live-Seite: Service Worker aktiv (54 Dateien im Cache), bei abgeschaltetem Netz laden Startseite und Werkzeugseiten samt Gestaltung und Bibliotheken — zwei PDFs wurden ohne Internetverbindung erfolgreich zusammengefügt
- Lighthouse nach allen Änderungen: Startseite und alle Werkzeugseiten weiterhin 100/100/100/100

## 2026-07-26 (Dunkelmodus)

### Hinzugefügt
- **Dunkelmodus** für die gesamte Website: folgt automatisch der Systemeinstellung (`prefers-color-scheme`), kein Schalter und kein gespeicherter Zustand nötig. Die Papier-Palette bekommt eine dunkle Entsprechung; Dokument- und Bildvorschauen (PDF-Seiten, Miniaturen, HTML- und Tabellenvorschau) bleiben bewusst hell, weil sie Papier darstellen. Das QR-Werkzeug folgt wieder dem System, statt fest hell zu sein.
- Passende `theme-color`-Angaben je Modus auf allen Seiten (Browserleiste auf dem Handy)

### Behoben
- **Tabellen-Konverter: Umlaute in CSV-Dateien waren kaputt** („MÃ¼ller“ statt „Müller“) — CSV/TSV wird jetzt selbst als UTF-8 dekodiert, mit automatischem Rückfall auf Windows-1252 für alte Exporte
- Dunkelmodus-Kontraste geprüft und nachgeschärft: Feldränder aufgehellt (jetzt 3,7:1), Schrift auf grünen Flächen von Weiß auf Dunkel umgestellt (2,7:1 → 7,0:1). Alle Text-Kontraste liegen über den WCAG-AA-Anforderungen.
- Startseiten-Logo wirkte im Dunkelmodus wie ein greller Kasten — bekommt jetzt Polsterung und liest sich als bewusst gesetztes Papier-Etikett

## 2026-07-26 (Werkzeug 16)

### Hinzugefügt
- Werkzeug **PDF stempeln** (`tools/pdf-stempeln/`): Wasserzeichen (freier Text, diagonal oder waagerecht, Größe/Deckkraft/Farbe wählbar) und Seitenzahlen (fünf Formate, sechs Positionen, Startnummer einstellbar) — mit seitenweiser Live-Vorschau, die dem Ergebnis entspricht. Die Seiten werden nicht gerastert, vorhandener Text bleibt durchsuchbar. Zu lange Wasserzeichen verkleinern sich automatisch, damit sie nicht über den Seitenrand laufen; Zeichen, die Helvetica nicht kennt, werden entfernt statt einen Fehler auszulösen. Karte auf der Startseite, Sitemap- und README-Eintrag.

## 2026-07-26 (Werkzeug 15)

### Hinzugefügt
- Werkzeug **Bild zuschneiden** (`tools/bild-zuschneiden/`): Ausschnitt direkt im Bild aufziehen, verschieben und an den Ecken skalieren (Maus und Touch), neun feste Seitenverhältnisse zum Einrasten (1:1, 4:3, 16:9, 9:16 …), 90°-Drehung in beide Richtungen, waagerechtes und senkrechtes Spiegeln. Zuschnitt in voller Originalauflösung, Ausgabe als JPEG/PNG/WebP mit Qualitätsregler; HEIC wird beim Laden umgewandelt. Karte auf der Startseite, Sitemap- und README-Eintrag.

## 2026-07-26 (Werkzeug 14)

### Hinzugefügt
- Werkzeug **ZIP entpacken & packen** (`tools/zip/`): Archiv hineinziehen zeigt den Inhalt mit Größen und Ordnerpfaden — einzelne Dateien oder alle auf einmal herausholen; umgekehrt beliebige Dateien zu einem ZIP schnüren (Kompression wählbar, Namensdubletten werden automatisch durchnummeriert). macOS-Beiwerk (`__MACOSX`, `.DS_Store`) wird beim Öffnen ausgeblendet. Karte auf der Startseite, Sitemap- und README-Eintrag.

### Geändert
- `AK.fmtBytes` zeigt Größen unter 1 KB jetzt in Byte statt „0 KB“ (wirkt in allen Werkzeugen)

## 2026-07-26 (Livegang: Lighthouse-Optimierung)

### Hinzugefügt
- `SEARCH-CONSOLE.md`: Schritt-für-Schritt-Anleitung zum Einrichten der Google Search Console (Domain-Property, TXT-Eintrag bei Strato, Sitemap einreichen) — interne Datei, wird nicht mit deployt
- `.htaccess` für den Strato-Server: eigene 404-Seite, Weiterleitung von www auf die Hauptdomain, gzip-Kompression (inkl. WASM), Cache-Regeln (Schriften/WASM ein Jahr, HTML immer frisch), Sicherheitskopfzeilen, MIME-Typen für `.wasm`/`.webmanifest`/`.webp`
- `<main>`-Landmark auf Startseite und allen Werkzeugseiten (Barrierefreiheit)

### Geändert
- Kopf-Logo drastisch verkleinert: 880 px statt 1170 px, zusätzlich als WebP über `<picture>` — 230 KB → 20 KB (PNG-Rückfallebene 38 KB)
- Schriftdefinitionen von `vendor/fonts/fonts.css` nach `css/base.css` verschoben; damit entfällt eine blockierende Anfrage pro Seitenaufruf
- Bibliotheken auf den Werkzeugseiten stehen jetzt am Seitenende statt im Kopf — die Seite rendert sofort, statt auf bis zu 1,3 MB JavaScript zu warten
- Startseite: Reihenfolge der Kategorien korrigiert (Medien vor Extras)

### Behoben
- `robots.txt`: Impressum und Datenschutz waren per `Disallow` gesperrt und trugen gleichzeitig ein `noindex` — dadurch hätte Google das `noindex` nie lesen können. Sperre entfernt, das Meta-Tag erledigt es korrekt.
- Ablagefläche: irreführendes `aria-label` entfernt, das die sichtbare Beschriftung überschrieb (Sprachsteuerung fand die Schaltfläche nicht)
- QR-Werkzeug: `role="img"` für die Vorschau (unzulässiges `aria-label` auf einem `div`), reservierte Höhen gegen Layout-Sprünge beim Aufbau

### Geprüft
- Lighthouse über die Live-Seite: Startseite und alle Werkzeugseiten erreichen **100/100/100/100** (Performance, Barrierefreiheit, Best Practices, SEO) — vorher 97/97/100/100 bzw. 83 Performance auf Werkzeugseiten
- HTTPS und Weiterleitung von http aktiv

## 2026-07-25 (vierter Wurf: Livegang-Vorbereitung)

### Geändert
- ffmpeg wird jetzt selbst gehostet (`vendor/ffmpeg/`, ~32 MB) statt von jsDelivr geladen — die Website kontaktiert damit gar keine Drittserver mehr; Datenschutzerklärung (§ 5), README, Startseite und Medien-Werkzeug entsprechend angepasst. Das Medien-Werkzeug braucht dafür einen Webserver und zeigt bei `file://` einen Hinweis.

### Hinzugefügt (Deploy)
- `deploy.sh`: lädt die Website per SFTP (lftp mirror, mit Löschabgleich) auf den Strato-Webspace; Zugangsdaten liegen in der git-ignorierten `.env`. Interne Dateien (README, CHANGELOG, Notizen, deploy.sh, .git) werden nicht mit hochgeladen. Erster Deploy ist erfolgt — Arbeitsablauf ist ab jetzt: Änderung → Changelog → Commit → Push → `./deploy.sh`

### Geändert (QR-Werkzeug)
- QR-Seite neu aufgebaut: nur noch die Engine (js/, vendor/) aus QR Studio übernommen — die Seite selbst nutzt jetzt das Standard-Gerüst der Site (base.css-Kopf mit Zurück-Schaltfläche, Anton-Überschrift, Site-Footer, „Gut zu wissen“-FAQ wie bei allen Werkzeugen). Eigener App-Header, Theme-Umschalter und App-Footer entfernt, helles Papier-Theme fest eingestellt, Bedienelemente kantig statt rund. Das Ursprungsprojekt `sonstiges-qr` blieb unverändert (war nur kopiert worden).

### Geändert (Roadmap)
- Ideenliste aktualisiert: erledigte Punkte (Livegang-Dateien, SEO-Ausbau, ffmpeg-Selbsthosting, QR-Code-Werkzeug) gestrichen, Search-Console-Punkt ergänzt

### Hinzugefügt (Werkzeug 13)
- **QR-Code erstellen** (`tools/qr-code/`), portiert aus dem Projekt „QR Studio“: 12 QR-Typen (Link, WLAN, vCard, GiroCode …), Stile/Farben/Verläufe, Logos, Bild-im-Code (Halftone), Rahmen, PNG/SVG/JPEG/WebP-Export, Verlauf in localStorage. Design per `paper-theme.css` an den Papier-Look angepasst (hell und dunkel), Zurück-Schaltfläche und Rechtslinks ergänzt, SEO/OG-Metadaten gesetzt, Karte in neuer Hub-Kategorie „Extras“, Sitemap- und README-Eintrag; Datenschutzerklärung um localStorage-Hinweis ergänzt

### Geändert (Impressum)
- Kontakt-E-Mail auf marc@alleskonverter.de umgestellt

### Hinzugefügt
- SEO-Ausbau aller 12 Werkzeugseiten: suchwortbezogene Titel und Meta-Descriptions („PDF zusammenfügen kostenlos ohne Upload“, „HEIC in JPG umwandeln“ …), Canonical-Links, Open-Graph-/Twitter-Tags, Abschnitt „Gut zu wissen“ mit Einführungstext und FAQ je Werkzeug sowie strukturierte Daten (schema.org WebApplication + FAQPage als JSON-LD)
- `robots.txt` (Impressum/Datenschutz vom Indexieren ausgenommen) und `sitemap.xml` mit allen Werkzeugseiten
- `favicon.ico` (16/32/48 px) und `assets/apple-touch-icon.png` (180 px, Papier-Hintergrund); Theme-Color-Meta auf der Startseite
- `404.html` im Site-Design (Hoster muss sie als Fehlerseite eingerichtet haben)

## 2026-07-25 (dritter Wurf: Feinschliff)

### Hinzugefügt
- Ideenliste angelegt: Roadmap mit Ideen für Livegang, SEO, neue Werkzeuge, PWA/Offline, Reichweite und Wartung

### Behoben
- „← Alle Werkzeuge“ auf den Unterseiten ist jetzt eine echte Schaltfläche mit großer Trefferfläche (vorher winziger 11-px-Textlink)

### Geändert
- Startseite: großes Logo oben links ersetzt Domain-Zeile, „Läuft vollständig im Browser“-Zeile und den Textschriftzug „Alleskonverter“
- Impressum mit echten Angaben gefüllt (Marc Schüßler, Flurstr. 31, 33609 Bielefeld) — Punkt „Offen“ vom zweiten Wurf damit erledigt
- „AI-Generated“-Kennzeichnung oben rechts aus `assets/og.png` und `assets/logo.png` entfernt (Hintergrund retuschiert)

## 2026-07-25 (zweiter Wurf: Auftritt & Recht)

### Hinzugefügt
- Startseite: USP-Leiste („100 % lokal · kein Upload/datenschutzkonform · kein Konto · kostenlos & ohne Limits · keine Cookies/kein Tracking“) und PayPal-Spendenknopf (paypal.me/marc85444)
- Social-Media-/SEO-Metadaten auf der Startseite: Open-Graph- und Twitter-Card-Tags mit `assets/og.png`, Meta-Description, Canonical auf https://alleskonverter.de/
- Logo eingebunden: `assets/logo-header.png` (zugeschnittene Variante) im Kopf der Startseite, `assets/favicon.png` (aus dem Logo-Icon) als Favicon auf allen Seiten
- Seiten `impressum.html` und `datenschutz.html` im Site-Design; Fußzeilen-Links (Impressum · Datenschutz · Spenden) auf Startseite und allen 12 Werkzeugseiten

### Geändert
- Name ohne Bindestrich: Überschrift jetzt „Alleskonverter“ (Domain wird alleskonverter.de)
- Der bisherige Datenschutz-Absatz der Startseite ist inhaltlich in die Datenschutzerklärung umgezogen (dort ergänzt um Hoster-Logs, jsDelivr-Hinweis fürs Medien-Werkzeug, PayPal, Betroffenenrechte)

### Entfernt
- Offline-Hinweistext im Fuß der Startseite

### Offen
- Impressum: Name und Anschrift sind noch Platzhalter und müssen vor dem Livegang eingetragen werden

## 2026-07-25

### Behoben
- Hub-Karten: Nummer, Titel und Beschreibung stehen jetzt untereinander statt ineinander zu fließen

### Geprüft
- Alle 12 Werkzeuge automatisiert end-to-end getestet (headless Chrome über `file://`): Dateien laden, konvertieren, Download entsteht — inklusive ffmpeg-Ladevorgang und WAV → MP3
- Responsive Ansicht (390 px und 1440 px) ohne horizontales Überlaufen, Konsolen aller Seiten fehlerfrei

### Hinzugefügt (Doku)
- README mit Werkzeugübersicht, Nutzungs-, Datenschutz- und Technikabschnitt
- Audio & Video: ffmpeg-Core wird jetzt als ESM-Variante geladen — der Module-Worker importiert den Core per `import()`, mit dem UMD-Core schlug das Laden fehl

### Geändert
- PDF-Stapler (`tools/pdf-zusammenfuegen/`) auf gemeinsame Module umgestellt: geteilte CSS, `AK.filelist`/`AK.dropzone`/`AK.pdf`-Helfer, lokale Bibliotheken statt CDN, Rückweg-Navigation zum Hub — Funktionalität unverändert

### Hinzugefügt
- Werkzeug **Audio & Video** (`tools/medien/`): MP3/WAV/OGG/M4A/FLAC/MP4/WebM/GIF via ffmpeg.wasm; Bibliothek wird erst auf Klick (~31 MB, CDN) geladen, Dateien bleiben lokal; Bitrate und Videogröße wählbar, Tonspur-Extraktion aus Videos
- Werkzeug **Tabellen-Konverter** (`tools/tabellen/`): CSV/TSV/JSON/XLSX/XLS ineinander umwandeln (SheetJS), Tabellenvorschau, Arbeitsblatt-Auswahl, wählbares CSV-Trennzeichen, UTF-8-BOM für Excel
- Werkzeug **Markdown ↔ HTML** (`tools/markdown-html/`): beide Richtungen (marked/turndown), Live-Vorschau beim Tippen, wahlweise komplette HTML-Datei oder Fragment
- Werkzeug **Word → HTML** (`tools/word-zu-html/`): DOCX zu komplettem HTML, HTML-Fragment oder reinem Text (mammoth), mit Live-Vorschau und Wortzahl
- Werkzeug **Bilder konvertieren** (`tools/bild-konvertieren/`): Batch-Konvertierung nach JPEG/PNG/WebP/AVIF (mit Browser-Feature-Erkennung), HEIC-Eingabe, Größenbegrenzung, Qualitätsregler, EXIF-Entfernung, ZIP-Download
- Werkzeug **Text auslesen** (`tools/pdf-text/`): PDF-Textextraktion mit Seitenmarkierungen, Zwischenablage und .txt-Download
- Werkzeug **PDF komprimieren** (`tools/pdf-komprimieren/`): Neuaufbau mit wählbarer Auflösung/Qualität, Vorher/Nachher-Größe, Passwort-Unterstützung
- Werkzeug **Bilder → PDF** (`tools/bild-zu-pdf/`): JPG/PNG unverändert eingebettet, HEIC/WebP/GIF u. a. werden lokal umgewandelt; A4 (hoch/quer) oder randlos, sortierbarer Stapel
- Werkzeug **PDF → Bild** (`tools/pdf-zu-bild/`): Seiten als PNG/JPEG mit wählbarer Auflösung und Qualität, Einzeldownload oder ZIP, Passwort-Unterstützung
- Werkzeug **PDF bearbeiten** (`tools/pdf-bearbeiten/`): Seiten-Miniaturen, drehen, löschen/wiederherstellen, Reihenfolge per Ziehen, verlustfreies Speichern
- Werkzeug **PDF aufteilen** (`tools/pdf-aufteilen/`): Seitenbereich extrahieren, jede Seite einzeln oder in N-Seiten-Blöcken als ZIP
- Projektgerüst: Designsystem im Papier-Look (`css/base.css`, `css/tools.css`), gemeinsame Skripte (`js/ui.js`, `js/dropzone.js`, `js/filelist.js`, `js/pdf-common.js`)
- Hub-Seite (`index.html`) mit Karten-Übersicht aller zwölf Werkzeuge in vier Kategorien
- Bibliotheken lokal unter `/vendor` (pdf-lib, pdf.js inkl. Worker, JSZip, heic2any, mammoth, marked, turndown, SheetJS) — keine CDN-Abhängigkeit
- Schriften lokal unter `/vendor/fonts` (Anton, Archivo, IBM Plex Mono als woff2)
- Bestehender PDF-Stapler unverändert nach `tools/pdf-zusammenfuegen/` übernommen (Refactoring folgt)
- Privates GitHub-Repository `ichrocke/alleskonverter` angelegt
