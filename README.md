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
| [PDF-Übersichtsblatt](tools/pdf-kontaktabzug/index.html) | Kontaktabzug: alle Seiten als Miniaturen, Raster und Format wählbar |
| [Text auslesen](tools/pdf-text/index.html) | Textextraktion, Zwischenablage oder .txt |

| [PDF-Passwort](tools/pdf-passwort/index.html) | PDF mit AES-128 verschlüsseln oder bekannten Schutz entfernen, Rechte einstellen |
| [PDF-Formular ausfüllen](tools/pdf-formular/index.html) | Formularfelder auslesen, ausfüllen und speichern, optional festschreiben |
**Bilder**
| Werkzeug | Kann |
|---|---|
| [Bild zuschneiden](tools/bild-zuschneiden/index.html) | Ausschnitt frei oder mit festem Seitenverhältnis, drehen, spiegeln |
| [Bilder zusammenfügen](tools/bilder-zusammenfuegen/index.html) | Collage: nebeneinander, untereinander oder Raster, mit Abstand und Hintergrund |
| [Hintergrund entfernen](tools/hintergrund-entfernen/index.html) | Motiv freistellen (U²-Net im Browser), transparent oder mit neuer Farbe |
| [Bild-Metadaten anzeigen](tools/bild-metadaten/index.html) | EXIF lesen: Kamera, Zeit, Einstellungen, GPS-Standort mit Kartenlink |
| [Bild als Daten-URI](tools/bild-base64/index.html) | Base64-Schnipsel für CSS/HTML/Markdown, mit Größenwarnung |
| [Bilder konvertieren](tools/bild-konvertieren/index.html) | Batch: JPEG/PNG/WebP/AVIF, HEIC-Eingabe, Größe begrenzen, Qualität, EXIF/GPS wird entfernt |

**Dokumente & Daten**
| Werkzeug | Kann |
|---|---|
| [Word → HTML](tools/word-zu-html/index.html) | DOCX → HTML (komplett/Fragment) oder Text, mit Vorschau |
| [Markdown ↔ HTML](tools/markdown-html/index.html) | Beide Richtungen, Live-Vorschau |
| [Tabellen-Konverter](tools/tabellen/index.html) | CSV/TSV/JSON/XLSX/XLS ↔ CSV/JSON/XLSX, Vorschau |

| [Texterkennung (OCR)](tools/texterkennung/index.html) | Text aus Bildern und gescannten PDFs erkennen (Tesseract, deutsch/englisch) |
| [JSON &amp; YAML](tools/json-yaml/index.html) | JSON formatieren/prüfen/minimieren, YAML ↔ JSON, Fehler mit Zeilenangabe |
**Extras**
| Werkzeug | Kann |
|---|---|
| [QR-Code erstellen](tools/qr-code/index.html) | 12 QR-Typen (Link, WLAN, vCard, GiroCode …), Farben/Logos/Rahmen, Bild-im-Code, PNG/SVG-Export |
| [ZIP entpacken & packen](tools/zip/index.html) | Archive öffnen, Dateien einzeln oder gebündelt herausholen; Dateien zu ZIP packen |

| [Text-Werkzeuge](tools/text-werkzeuge/index.html) | Base64, URL-Encode, SHA-Prüfsummen, Zeichen-/Wortzähler, Zeilen aufräumen |
| [Untertitel SRT ↔ VTT](tools/untertitel/index.html) | Untertitel umwandeln, reinen Text extrahieren, Zeiten verschieben |
| [Favicon-Generator](tools/favicon/index.html) | Alle Symbolgrößen, favicon.ico, Apple-Touch-Icon, Manifest und HTML-Schnipsel als ZIP |
| [Farbwerte umrechnen](tools/farben/index.html) | HEX/RGB/HSL/CMYK, Pipette für Bilder, Abstufungen, WCAG-Kontrastprüfung |
| [Passwort-Generator](tools/passwort/index.html) | Zeichenfolgen, Passphrasen und PINs mit echtem Zufall, Stärke- und Zeitschätzung |
| [Einheiten &amp; Zeitzonen](tools/einheiten/index.html) | Neun Größenarten umrechnen, Uhrzeit in 20 Zeitzonen |
| [Dateien umbenennen](tools/bilder-umbenennen/index.html) | Stapelweise umbenennen mit Muster, Zähler und Datum, Ausgabe als ZIP |
**Medien**
| Werkzeug | Kann |
|---|---|
| [Audio & Video](tools/medien/index.html) | MP3/WAV/OGG/M4A/FLAC/MP4/WebM/GIF via ffmpeg.wasm, Tonspur extrahieren |

| [Medien schneiden](tools/medien-schneiden/index.html) | Video/Audio auf einen Ausschnitt kürzen, wahlweise ohne Neuberechnung |
| [GIF erstellen](tools/gif-erstellen/index.html) | Animiertes GIF aus Bildern, mit eigener Farbtabelle für bessere Farben |
| [Ton verbessern](tools/ton-verbessern/index.html) | Normalisieren nach EBU R128, Stille abschneiden, Rauschdämpfung |
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

## Bibliotheken

Welche Fremdbibliothek in welcher Fassung und unter welcher Lizenz eingebunden ist,
steht in [vendor/VERSIONEN.md](vendor/VERSIONEN.md) — inklusive Hinweis, wann eine
Aktualisierung ansteht.

## Tests

```sh
cd tests && npm install && npm test
```

Öffnet jedes Werkzeug in einem echten Browser, schiebt eine Testdatei hinein und
prüft das Ergebnis; zusätzlich wird gemessen, ob die Oberfläche bedienbar bleibt.
Läuft bei jedem Push auch über GitHub Actions.

## Mitmachen

Fehler gefunden oder ein Werkzeug vermisst? Gern als
[Issue](https://github.com/ichrocke/alleskonverter/issues) melden.

Der Quellcode ist bewusst offen: Bei Werkzeugen, die mit vertraulichen Dateien umgehen,
soll niemand einem Versprechen glauben müssen. Dass nichts hochgeladen wird, lässt sich
hier nachlesen — und im Browser unter „Netzwerk“ selbst nachmessen.

## Changelog

Siehe [CHANGELOG.md](CHANGELOG.md).
