/* Markdown ↔ HTML — gemeinsamer Baustein von Werkzeugseite und großem Editor:
   die eigenständige HTML-Datei, die beim Herunterladen, im neuen Tab und in der
   Editor-Vorschau entsteht. Bewusst ohne Breitenbegrenzung — der Text nutzt die
   volle Fensterbreite. */
window.MDH = window.MDH || {};

MDH.vollHtml = function(inhalt, titel){
  return `<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${AK.esc(titel)}</title>\n<style>body{margin:0;padding:1.5rem 2rem;font-family:system-ui,sans-serif;line-height:1.6}img{max-width:100%;height:auto}pre{background:#f4f4f4;padding:12px;overflow:auto}code{font-family:ui-monospace,monospace}table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px 8px}blockquote{border-left:3px solid #ccc;margin-left:0;padding-left:1em;color:#555}</style>\n</head>\n<body>\n${inhalt}\n</body>\n</html>\n`;
};
