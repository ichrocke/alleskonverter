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
| [Text auslesen](tools/pdf-text/index.html) | Textextraktion, Zwischenablage oder .txt |

**Bilder**
| Werkzeug | Kann |
|---|---|
| [Bilder konvertieren](tools/bild-konvertieren/index.html) | Batch: JPEG/PNG/WebP/AVIF, HEIC-Eingabe, Größe begrenzen, Qualität, EXIF/GPS wird entfernt |

**Dokumente & Daten**
| Werkzeug | Kann |
|---|---|
| [Word → HTML](tools/word-zu-html/index.html) | DOCX → HTML (komplett/Fragment) oder Text, mit Vorschau |
| [Markdown ↔ HTML](tools/markdown-html/index.html) | Beide Richtungen, Live-Vorschau |
| [Tabellen-Konverter](tools/tabellen/index.html) | CSV/TSV/JSON/XLSX/XLS ↔ CSV/JSON/XLSX, Vorschau |

**Medien**
| Werkzeug | Kann |
|---|---|
| [Audio & Video](tools/medien/index.html) | MP3/WAV/OGG/M4A/FLAC/MP4/WebM/GIF via ffmpeg.wasm, Tonspur extrahieren |

## Nutzung

`index.html` im Browser öffnen — das ist alles. Es braucht keinen Webserver und keine Installation.

Optional mit lokalem Server (z. B. für sauberere Browser-Umgebung):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Datenschutz

- Alle Konvertierungen laufen per JavaScript/WebAssembly **im Browser-Tab**; es existiert kein Backend.
- Bibliotheken (pdf-lib, pdf.js, mammoth, SheetJS, marked, turndown, heic2any, JSZip) und Schriften liegen lokal unter `vendor/` — beim Öffnen werden keine Drittserver kontaktiert.
- Einzige Ausnahme: das Werkzeug **Audio & Video** lädt die ffmpeg-Bibliothek (~31 MB) auf Klick vom CDN (jsdelivr) und der Browser cached sie. Auch dabei werden nur Programmdateien geladen — nie eigene Dateien hochgeladen.
- Beim Neukodieren von Bildern gehen EXIF-Metadaten (Kameramodell, Aufnahmezeit, GPS) verloren — gewollt.

## Technik

- Vanilla HTML/CSS/JS, kein Build-Schritt, kein Framework
- Klassische Skripte statt ES-Module, damit alles auch über `file://` (Doppelklick) funktioniert
- Gemeinsames Designsystem in `css/base.css` / `css/tools.css`, geteilte Helfer unter `js/` (`AK`-Namespace)
- Jedes Werkzeug ist eine eigenständige Seite unter `tools/<name>/index.html`

## Changelog

Siehe [CHANGELOG.md](CHANGELOG.md).
