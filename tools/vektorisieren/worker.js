/* Vektorisieren — Rechenknecht.
   VTracer läuft hier in einem eigenen Strang, damit die Seite bedienbar bleibt;
   ein Foto mit 1200 px Kante braucht auch mal einige Sekunden. Abbrechen heißt:
   Der Worker wird beendet und beim nächsten Lauf neu gestartet (das Modul kommt
   dann aus dem Browser-Cache, das kostet fast nichts). */
importScripts('../../vendor/vtracer/vtracer.js');
let bereit = null;

onmessage = async e => {
  const { rgba, w, h, opts } = e.data;
  try{
    if(!bereit) bereit = VTracer.init('../../vendor/vtracer/vtracer_bg.wasm');
    await bereit;
    const t = performance.now();
    const svg = VTracer.vectorize_rgba(rgba, w, h, opts);
    postMessage({ ok: true, svg, ms: performance.now() - t });
  }catch(err){
    postMessage({ ok: false, fehler: String(err && err.message || err) });
  }
};
