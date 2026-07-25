# Alleskonverter

Ein kostenloser Alles-in-einem-Konverter, der **vollständig lokal im Browser** läuft. Keine Uploads, keine Server, keine Konten — Dateien verlassen das Gerät zu keinem Zeitpunkt.

## Werkzeuge

**PDF**
| Werkzeug | Kann |
|---|---|
| [PDF zusammenfügen](tools/pdf-zusammenfuegen/index.html) | Mehrere PDFs stapeln, auch schreibgeschützte/passwortgeschützte; Seitenbereiche je Datei |
| [PDF aufteilen](tools/pdf-aufteilen/index.html) | Bereich extrahieren, Einzelseiten oder N-Seiten-Blöcke (ZIP) |
| [PDF bearbeiten](tools/pdf-bearbeiten/index.html) | Miniaturen: drehen, löschen, umsortieren, speichern |
| [PDF → Bild](tools/pdf-zu-bild/index.html) | Seiten als PNG/JPEG, 96–300 dpi, einzeln oder ZIP |
| [Bilder → PDF](tools/bild-zu-pdf/index.html) | JPG/PNG/WebP/HEIC/GIF → ein PDF, A4 oder randlos |
| [PDF komprimieren](tools/pdf-komprimieren/index.html) | Neuaufbau mit dpi/Qualität, Vorher-/Nachher-Größe |
| [PDF stempeln](tools/pdf-stempeln/index.html) | Wasserzeichen und Seitenzahlen einfügen, mit Live-Vorschau |
| [Text auslesen](tools/pdf-text/index.html) | Textextraktion, Zwischenablage oder .txt |

| [PDF-Passwort](tools/pdf-passwort/index.html) | PDF mit AES-128 verschlüsseln oder bekannten Schutz entfernen, Rechte einstellen |
**Bilder**
| Werkzeug | Kann |
|---|---|
| [Bild zuschneiden](tools/bild-zuschneiden/index.html) | Ausschnitt frei oder mit festem Seitenverhältnis, drehen, spiegeln |
| [Bilder zusammenfügen](tools/bilder-zusammenfuegen/index.html) | Collage: nebeneinander, untereinander oder Raster, mit Abstand und Hintergrund |
| [Bilder konvertieren](tools/bild-konvertieren/index.html) | Batch: JPEG/PNG/WebP/AVIF, HEIC-Eingabe, Größe begrenzen, Qualität, EXIF/GPS wird entfernt |

**Dokumente & Daten**
| Werkzeug | Kann |
|---|---|
| [Word → HTML](tools/word-zu-html/index.html) | DOCX → HTML (komplett/Fragment) oder Text, mit Vorschau |
| [Markdown ↔ HTML](tools/markdown-html/index.html) | Beide Richtungen, Live-Vorschau |
| [Tabellen-Konverter](tools/tabellen/index.html) | CSV/TSV/JSON/XLSX/XLS ↔ CSV/JSON/XLSX, Vorschau |

**Extras**
| Werkzeug | Kann |
|---|---|
| [QR-Code erstellen](tools/qr-code/index.html) | 12 QR-Typen (Link, WLAN, vCard, GiroCode …), Farben/Logos/Rahmen, Bild-im-Code, PNG/SVG-Export |
| [ZIP entpacken & packen](tools/zip/index.html) | Archive öffnen, Dateien einzeln oder gebündelt herausholen; Dateien zu ZIP packen |

| [Text-Werkzeuge](tools/text-werkzeuge/index.html) | Base64, URL-Encode, SHA-Prüfsummen, Zeichen-/Wortzähler, Zeilen aufräumen |
| [Untertitel SRT ↔ VTT](tools/untertitel/index.html) | Untertitel umwandeln, reinen Text extrahieren, Zeiten verschieben |
| [Favicon-Generator](tools/favicon/index.html) | Alle Symbolgrößen, favicon.ico, Apple-Touch-Icon, Manifest und HTML-Schnipsel als ZIP |
**Medien**
| Werkzeug | Kann |
|---|---|
| [Audio & Video](tools/medien/index.html) | MP3/WAV/OGG/M4A/FLAC/MP4/WebM/GIF via ffmpeg.wasm, Tonspur extrahieren |

| [Medien schneiden](tools/medien-schneiden/index.html) | Video/Audio auf einen Ausschnitt kürzen, wahlweise ohne Neuberechnung |
## Nutzung

Live unter <https://alleskonverter.de>. Die Seite lässt sich über den Browser als App
installieren („Zum Startbildschirm hinzufügen“) und funktioniert danach vollständig offline.

Lokal genügt es, `index.html` im Browser zu öffnen. Ausnahmen: Audio &amp; Video und der
QR-Code-Generator brauchen einen Webserver (siehe unten).

Optional mit lokalem Server (z. B. für sauberere Browser-Umgebung):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Datenschutz

- Alle Konvertierungen laufen per JavaScript/WebAssembly **im Browser-Tab**; es existiert kein Backend.
- Bibliotheken (pdf-lib, pdf.js, mammoth, SheetJS, marked, turndown, heic2any, JSZip) und Schriften liegen lokal unter `vendor/` — beim Öffnen werden keine Drittserver kontaktiert.
- Auch die ffmpeg-Bibliothek des Werkzeugs **Audio & Video** (~31 MB, wird erst auf Klick geladen) liegt lokal unter `vendor/ffmpeg/` — es gibt keinerlei CDN- oder Drittserver-Kontakte. Hinweis: Dieses eine Werkzeug braucht einen Webserver (`file://` reicht dafür nicht).
- Beim Neukodieren von Bildern gehen EXIF-Metadaten (Kameramodell, Aufnahmezeit, GPS) verloren — gewollt.

## Technik

- Vanilla HTML/CSS/JS, kein Build-Schritt, kein Framework
- Klassische Skripte statt ES-Module, damit alles auch über `file://` (Doppelklick) funktioniert
- Gemeinsames Designsystem in `css/base.css` / `css/tools.css`, geteilte Helfer unter `js/` (`AK`-Namespace)
- Jedes Werkzeug ist eine eigenständige Seite unter `tools/<name>/index.html`
- Dunkelmodus folgt der Systemeinstellung (`prefers-color-scheme`), ohne Schalter und ohne gespeicherten Zustand
- PWA: `manifest.webmanifest` und `sw.js`. Der Service Worker legt beim Installieren das Grundgerüst,
  alle Bibliotheken und (über die `sitemap.xml`) sämtliche Werkzeugseiten ab. Seiten und eigener Code
  werden „Netz zuerst“ geladen, Bibliotheken und Schriften „Cache zuerst“; ffmpeg (~32 MB) landet erst
  im Cache, wenn das Medien-Werkzeug tatsächlich benutzt wurde.
- `.htaccess` regelt Kompression, Cache-Zeiten, 404-Seite, www-Weiterleitung und Sicherheitskopfzeilen

### Neues Werkzeug hinzufügen

1. `tools/<name>/index.html` anlegen (eine bestehende Seite als Vorlage nehmen — Kopf, `<main>`, „Gut zu wissen“-Block, Footer)
2. Karte auf der Startseite ergänzen, Eintrag in `sitemap.xml` und in dieser README
3. Neue Bibliotheken zusätzlich in die `SHELL`-Liste in `sw.js` aufnehmen (Seiten selbst kommen automatisch über die Sitemap)

## Deployment

Nach jeder Änderung: `CHANGELOG.md` ergänzen → Commit → Push → `./deploy.sh`
(SFTP-Upload auf den Strato-Webspace; Zugangsdaten in `.env`, nicht im Repo).

## Changelog

Siehe [CHANGELOG.md](CHANGELOG.md).
