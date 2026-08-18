# Mitgelieferte Bibliotheken

Alle Fremdbibliotheken liegen im Projekt statt an einem CDN — so entstehen beim
Benutzen keinerlei Verbindungen zu Dritten. Diese Liste dokumentiert, was in
welcher Fassung eingebunden ist, damit sich Aktualisierungen nachvollziehen
lassen. **Etwa einmal im Jahr prüfen** — vor allem pdf.js, weil dort
regelmäßig Sicherheitskorrekturen erscheinen.

Stand: 26.07.2026 (Bibliotheken geprüft und teilweise aktualisiert)

| Datei | Bibliothek | Version | Lizenz | Wofür |
|---|---|---|---|---|
| `pdf-lib.min.js` | pdf-lib | 1.17.1 | MIT | PDFs erzeugen und verändern |
| `pdf-lib-crypt.min.js` | @cantoo/pdf-lib | 2.7.4 | MIT | wie oben, zusätzlich Verschlüsselung |
| `pdf.min.js`, `pdf.worker.min.js` | pdf.js | 3.11.174 | Apache-2.0 | PDFs anzeigen und Text auslesen |
| `jszip.min.js` | JSZip | 3.10.1 | MIT | ZIP-Archive lesen und schreiben |
| `heic2any.min.js` | heic2any | 0.0.4 | MIT | iPhone-Fotos (HEIC) dekodieren |
| `mammoth.browser.min.js` | mammoth | 1.12.0 | BSD-2-Clause | Word-Dokumente lesen |
| `marked.min.js` | marked | 12.0.2 | MIT | Markdown zu HTML |
| `turndown.min.js` | turndown | 7.2.4 | MIT | HTML zu Markdown |
| `docx.min.js` | docx | 9.7.1 | MIT | Word-Dokumente schreiben |
| `xlsx.full.min.js` | SheetJS | 0.20.3 | Apache-2.0 | Tabellen (CSV, XLSX, JSON) |
| `ffmpeg/ffmpeg.js`, `util.js` | @ffmpeg/ffmpeg, @ffmpeg/util | 0.12.10 / 0.12.1 | MIT | Ansteuerung des Konverters |
| `ffmpeg/ffmpeg-core.*` | @ffmpeg/core (ffmpeg als WebAssembly) | 0.12.6 | LGPL-2.1 | Audio und Video umwandeln |
| `tesseract/tesseract.min.js`, `worker.min.js` | tesseract.js | 6.0.1 | Apache-2.0 | Texterkennung |
| `tesseract/tesseract-core-*lstm.wasm.js` | tesseract.js-core | 6.0.0 | Apache-2.0 | Erkennungsmaschine (nur LSTM-Fassungen) |
| `tesseract/deu.traineddata.gz`, `eng…` | tessdata (schnelle Modelle) | 4.0.0 | Apache-2.0 | Sprachdaten |
| `exifr.min.js` | exifr | 7.1.3 | MIT | EXIF-Daten von Fotos lesen |
| `js-yaml.min.js` | js-yaml | 4.1.0 | MIT | YAML lesen und schreiben |
| `onnx/ort.wasm.min.js`, `ort-wasm-*` | onnxruntime-web | 1.22.0 | MIT | Modelle ausführen |
| `onnx/u2netp.onnx` | U²-Net (kleine Fassung) | — | Apache-2.0 | Motiv freistellen |
| `vtracer/vtracer.js`, `vtracer_bg.wasm` | VTracer (visioncortex, npm @visioncortex/vtracer) | 1.0.0-alpha.3 | MIT OR Apache-2.0 | Bilder vektorisieren |
| `tools/qr-code/vendor/qr-code-styling.js` | qr-code-styling | gevendort | MIT | QR-Codes gestalten |
| `tools/qr-code/vendor/qrcode-*.js` | qrcode-generator | gevendort | MIT | QR-Codes berechnen |
| `fonts/anton-*`, `archivo-*`, `ibm-plex-mono-*` | Anton, Archivo, IBM Plex Mono | — | SIL Open Font License 1.1 | Schriften |

## Neu hinzugekommen (18.08.2026)

- **VTracer 1.0.0-alpha.3** für „Bild vektorisieren“. Das npm-Paket `@visioncortex/vtracer`
  ist ein wasm-bindgen-Build für Node (`--target nodejs`); es gibt keine fertige
  Browser-Fassung. `vendor/vtracer/vtracer.js` ist deshalb die Node-Bindung mit
  ausgetauschtem Ladeteil (fetch + `WebAssembly.instantiate` statt `readFileSync`),
  sonst unverändert — als klassisches Skript, das auch in einem Worker per
  `importScripts` läuft. Beim Aktualisieren: neue `pkg/vtracer_wasm.js` nehmen und
  nur die letzten Zeilen (Laden) wieder ersetzen; die `.wasm` heißt hier `vtracer_bg.wasm`.

## Neu hinzugekommen (26.07.2026)

- **docx 9.7.1** für das Werkzeug „Word-Datei erstellen“. Der Anbieter liefert
  keine minimierte Fassung aus; eingebunden ist deshalb `dist/index.iife.js`
  mit 1,1 MB. Das ist viel für das, was es tut, aber es ist die einzige
  gepflegte Bibliothek, die DOCX im Browser *schreiben* kann — alles andere
  wäre gewesen, das Office-Open-XML-Format von Hand zu bauen.

## Stand der Aktualisierung (26.07.2026)

Alle Bibliotheken wurden gegen die npm-Registry geprüft. Ergebnis:

- **Aktualisiert:** mammoth 1.8.0 → 1.12.0, turndown 7.2.0 → 7.2.4. Beide unauffällig,
  Testlauf danach vollständig grün.
- **Bewusst nicht aktualisiert — pdf.js:** Wir sind bereits auf der letzten Fassung der
  3er-Reihe (3.11.174). Ab 4.0 liefert das Projekt ausschließlich ES-Module und keine
  UMD-Fassung mehr. Ein Umstieg würde alle PDF-Werkzeuge auf Module zwingen und damit
  den Betrieb per Doppelklick über `file://` beenden. Das ist eine bewusste Entscheidung
  und keine Nachlässigkeit — sie sollte aber jährlich überprüft werden, denn pdf.js ist
  die sicherheitsrelevanteste Abhängigkeit hier.
- **Zurückgerollt — ffmpeg:** Der Sprung auf @ffmpeg/ffmpeg 0.12.15 mit Kern 0.12.10
  ließ sich im Browser nicht mehr laden. Wieder auf der geprüften Kombination
  0.12.10 mit Kern 0.12.6. Vor dem nächsten Versuch lohnt ein Blick in die
  Veröffentlichungshinweise des Projekts.
- **Nicht aktualisiert (größere Sprünge, ungeprüft):** marked 12 → 18, tesseract.js 6 → 7,
  onnxruntime-web 1.22 → 1.27. Alle drei laufen einwandfrei; ein Umstieg lohnt erst,
  wenn es einen Anlass gibt, und braucht jeweils einen eigenen Testlauf.
- **SheetJS** wird nicht mehr über npm verteilt; die eingebundene 0.20.3 stammt vom
  Projekt selbst und ist neuer als die dort verbliebene 0.18.5.
- **Entfernt:** Die beiden Tesseract-Kernfassungen ohne LSTM (zusammen 9,5 MB). Die
  verwendeten schnellen Sprachmodelle sind LSTM-only, die Dateien wurden also nie
  angefordert. Nach dem Entfernen weiterhin fehlerfreie Erkennung.

## Hinweise

- **ffmpeg** steht unter der LGPL-2.1. Es wird unverändert und als eigenständige
  Datei ausgeliefert, nicht in eigenen Code hineinkompiliert — genau so, wie es
  die Lizenz vorsieht. Der Quelltext ist über das
  [ffmpeg.wasm-Projekt](https://github.com/ffmpegwasm/ffmpeg.wasm) erhältlich.
- **Bewusst nicht verwendet:** `@imgly/background-removal` steht unter AGPL-3.0
  und hätte diese Lizenz auf die gesamte Website übertragen. Stattdessen kommen
  U²-Net (Apache-2.0) und onnxruntime-web (MIT) zum Einsatz.
- **Aktualisieren:** neue Fassung herunterladen, in `vendor/` ersetzen, diese
  Tabelle nachziehen und `npm test` in `tests/` laufen lassen. Ändert sich ein
  Dateiname, muss er auch in der `SHELL`-Liste in `sw.js` angepasst werden.
