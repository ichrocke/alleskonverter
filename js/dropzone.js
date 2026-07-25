/* Alleskonverter — Ablagefläche: Drag & Drop, Klick, Tastatur */
window.AK = window.AK || {};

/* AK.dropzone('#drop', '#picker', files => …) */
AK.dropzone = function(dropSel, pickerSel, onFiles){
  const drop = document.querySelector(dropSel);
  const picker = document.querySelector(pickerSel);

  drop.addEventListener('click', () => picker.click());
  drop.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); picker.click(); }
  });
  picker.addEventListener('change', e => {
    if(e.target.files.length) onFiles(Array.from(e.target.files));
    e.target.value = '';
  });

  ['dragenter','dragover'].forEach(t => drop.addEventListener(t, e => {
    e.preventDefault(); drop.classList.add('over');
  }));
  ['dragleave','drop'].forEach(t => drop.addEventListener(t, e => {
    e.preventDefault(); drop.classList.remove('over');
  }));
  drop.addEventListener('drop', e => {
    if(e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
  });

  // Verhindern, dass der Browser fallengelassene Dateien selbst öffnet
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());
};
