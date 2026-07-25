# Changelog

Alle nennenswerten Änderungen am Alleskonverter, neueste zuerst.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/).

## 2026-07-25 (vierter Wurf: Livegang-Vorbereitung)

### Geändert
- ffmpeg wird jetzt selbst gehostet (`vendor/ffmpeg/`, ~32 MB) statt von jsDelivr geladen — die Website kontaktiert damit gar keine Drittserver mehr; Datenschutzerklärung (§ 5), README, Startseite und Medien-Werkzeug entsprechend angepasst. Das Medien-Werkzeug braucht dafür einen Webserver und zeigt bei `file://` einen Hinweis.

### Hinzugefügt
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
