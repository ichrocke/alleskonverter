# Changelog

Alle nennenswerten Änderungen am Alleskonverter, neueste zuerst.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/).

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
- `ideen.txt` und README auf den aktuellen Stand gebracht (Erledigtes gestrichen, Anleitung zum Hinzufügen neuer Werkzeuge ergänzt)

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
- `deploy.sh`: lädt die Website per SFTP (lftp mirror, mit Löschabgleich) auf den Strato-Webspace; Zugangsdaten liegen in der git-ignorierten `.env`. Interne Dateien (README, CHANGELOG, ideen.txt, deploy.sh, .git) werden nicht mit hochgeladen. Erster Deploy ist erfolgt — Arbeitsablauf ist ab jetzt: Änderung → Changelog → Commit → Push → `./deploy.sh`

### Geändert (QR-Werkzeug)
- QR-Seite neu aufgebaut: nur noch die Engine (js/, vendor/) aus QR Studio übernommen — die Seite selbst nutzt jetzt das Standard-Gerüst der Site (base.css-Kopf mit Zurück-Schaltfläche, Anton-Überschrift, Site-Footer, „Gut zu wissen“-FAQ wie bei allen Werkzeugen). Eigener App-Header, Theme-Umschalter und App-Footer entfernt, helles Papier-Theme fest eingestellt, Bedienelemente kantig statt rund. Das Ursprungsprojekt `sonstiges-qr` blieb unverändert (war nur kopiert worden).

### Geändert (Roadmap)
- `ideen.txt` aktualisiert: erledigte Punkte (Livegang-Dateien, SEO-Ausbau, ffmpeg-Selbsthosting, QR-Code-Werkzeug) gestrichen, Search-Console-Punkt ergänzt

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
- `ideen.txt`: Roadmap mit Ideen für Livegang, SEO, neue Werkzeuge, PWA/Offline, Reichweite und Wartung

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
