/* Alleskonverter — Ablagefläche: Drag & Drop, Klick, Tastatur */
window.AK = window.AK || {};

/* Passt die Datei zu dem, was das Werkzeug laut Auswahlfeld annimmt?
   Verhindert, dass eine versehentlich hineingezogene Datei kommentarlos
   verschwindet — das ist die häufigste Verwirrung bei solchen Werkzeugen. */
function passt(datei, accept){
  if(!accept || accept.trim() === '') return true;
  const regeln = accept.split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
  const name = datei.name.toLowerCase();
  const typ = (datei.type || '').toLowerCase();
  return regeln.some(regel => {
    if(regel.startsWith('.')) return name.endsWith(regel);
    if(regel.endsWith('/*'))  return typ.startsWith(regel.slice(0, -1));
    return typ === regel;
  });
}

/* AK.dropzone('#drop', '#picker', files => …) */
AK.dropzone = function(dropSel, pickerSel, onFiles){
  const drop = document.querySelector(dropSel);
  const picker = document.querySelector(pickerSel);

  /* Nimmt die Dateien entgegen und sagt Bescheid, wenn keine davon passt */
  function annehmen(dateien){
    const accept = picker.getAttribute('accept') || '';
    const brauchbar = dateien.filter(d => passt(d, accept));
    if(!brauchbar.length){
      const namen = dateien.map(d => d.name).join(', ');
      if(AK.log) AK.log(dateien.length === 1
        ? `„${namen}“ passt nicht zu diesem Werkzeug. Erwartet wird: ${lesbar(accept)}.`
        : `Keine der Dateien passt zu diesem Werkzeug. Erwartet wird: ${lesbar(accept)}.`, true);
      return;
    }
    if(brauchbar.length < dateien.length && AK.log){
      AK.log(`${dateien.length - brauchbar.length} Datei(en) übersprungen — passen nicht zu diesem Werkzeug.`);
    }
    onFiles(brauchbar);
  }

  function lesbar(accept){
    const teile = accept.split(',').map(r => r.trim()).filter(Boolean).map(r =>
      r === 'image/*' ? 'Bilder' : r === 'audio/*' ? 'Audiodateien' : r === 'video/*' ? 'Videodateien'
      : r.startsWith('.') ? r.slice(1).toUpperCase() : r);
    const einmalig = [...new Set(teile)];
    return einmalig.length > 6 ? einmalig.slice(0,6).join(', ') + ' u. a.' : einmalig.join(', ');
  }

  drop.addEventListener('click', () => picker.click());
  drop.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); picker.click(); }
  });
  picker.addEventListener('change', e => {
    if(e.target.files.length) annehmen(Array.from(e.target.files));
    e.target.value = '';
  });

  ['dragenter','dragover'].forEach(t => drop.addEventListener(t, e => {
    e.preventDefault(); drop.classList.add('over');
  }));
  ['dragleave','drop'].forEach(t => drop.addEventListener(t, e => {
    e.preventDefault(); drop.classList.remove('over');
  }));
  drop.addEventListener('drop', e => {
    if(e.dataTransfer.files.length) annehmen(Array.from(e.dataTransfer.files));
  });

  // Verhindern, dass der Browser fallengelassene Dateien selbst öffnet
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());
};
