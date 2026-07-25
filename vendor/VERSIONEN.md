# Mitgelieferte Bibliotheken

Alle Fremdbibliotheken liegen im Projekt statt an einem CDN — so entstehen beim
Benutzen keinerlei Verbindungen zu Dritten. Diese Liste dokumentiert, was in
welcher Fassung eingebunden ist, damit sich Aktualisierungen nachvollziehen
lassen. **Etwa einmal im Jahr prüfen** — vor allem pdf.js, weil dort
regelmäßig Sicherheitskorrekturen erscheinen.

Stand: 26.07.2026

| Datei | Bibliothek | Version | Lizenz | Wofür |
|---|---|---|---|---|
| `pdf-lib.min.js` | pdf-lib | 1.17.1 | MIT | PDFs erzeugen und verändern |
| `pdf-lib-crypt.min.js` | @cantoo/pdf-lib | 2.7.4 | MIT | wie oben, zusätzlich Verschlüsselung |
| `pdf.min.js`, `pdf.worker.min.js` | pdf.js | 3.11.174 | Apache-2.0 | PDFs anzeigen und Text auslesen |
| `jszip.min.js` | JSZip | 3.10.1 | MIT | ZIP-Archive lesen und schreiben |
| `heic2any.min.js` | heic2any | 0.0.4 | MIT | iPhone-Fotos (HEIC) dekodieren |
| `mammoth.browser.min.js` | mammoth | 1.8.0 | BSD-2-Clause | Word-Dokumente lesen |
| `marked.min.js` | marked | 12.0.2 | MIT | Markdown zu HTML |
| `turndown.min.js` | turndown | 7.2.0 | MIT | HTML zu Markdown |
| `xlsx.full.min.js` | SheetJS | 0.20.3 | Apache-2.0 | Tabellen (CSV, XLSX, JSON) |
| `ffmpeg/ffmpeg.js`, `util.js` | @ffmpeg/ffmpeg, @ffmpeg/util | 0.12.10 / 0.12.1 | MIT | Ansteuerung des Konverters |
| `ffmpeg/ffmpeg-core.*` | @ffmpeg/core (ffmpeg als WebAssembly) | 0.12.6 | LGPL-2.1 | Audio und Video umwandeln |
| `tesseract/tesseract.min.js`, `worker.min.js` | tesseract.js | 6.0.1 | Apache-2.0 | Texterkennung |
| `tesseract/tesseract-core*.wasm.js` | tesseract.js-core | 6.0.0 | Apache-2.0 | Erkennungsmaschine |
| `tesseract/deu.traineddata.gz`, `eng…` | tessdata (schnelle Modelle) | 4.0.0 | Apache-2.0 | Sprachdaten |
| `onnx/ort.wasm.min.js`, `ort-wasm-*` | onnxruntime-web | 1.22.0 | MIT | Modelle ausführen |
| `onnx/u2netp.onnx` | U²-Net (kleine Fassung) | — | Apache-2.0 | Motiv freistellen |
| `tools/qr-code/vendor/qr-code-styling.js` | qr-code-styling | gevendort | MIT | QR-Codes gestalten |
| `tools/qr-code/vendor/qrcode-*.js` | qrcode-generator | gevendort | MIT | QR-Codes berechnen |
| `fonts/anton-*`, `archivo-*`, `ibm-plex-mono-*` | Anton, Archivo, IBM Plex Mono | — | SIL Open Font License 1.1 | Schriften |

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
