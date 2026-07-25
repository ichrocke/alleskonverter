/* Alleskonverter — sortierbare Dateiliste („Stapel“).
   Reihenfolge per Ziehen am Nummern-Reiter oder über ↑/↓, Entfernen mit ✕.
   Inhalt der Zeile liefern die Callbacks des jeweiligen Werkzeugs. */
window.AK = window.AK || {};

/* AK.filelist({
     container: '#stack', empty: '#empty',
     entries: [],                       // Array wird in-place verwaltet
     rowClass: e => '',                 // Zusatzklassen je Eintrag
     meta: e => 'HTML für .meta',
     extra: (e, li) => void|HTML,       // optionale Zusatzzeile (.rowextra)
     wire: (e, li) => void,             // Events an Zeilenelemente hängen
     onChange: () => void               // nach jeder Änderung (auch Reorder/Delete)
   }) → { render } */
AK.filelist = function(cfg){
  const container = document.querySelector(cfg.container);
  const empty = cfg.empty ? document.querySelector(cfg.empty) : null;
  const entries = cfg.entries;

  function render(){
    if(empty) empty.style.display = entries.length ? 'none' : '';
    container.innerHTML = '';

    entries.forEach((e, i) => {
      const li = document.createElement('li');
      li.className = ('row ' + (cfg.rowClass ? cfg.rowClass(e) : '')).trim();
      li.dataset.id = e.id;

      li.innerHTML = `
        <div class="tab" draggable="true" title="Zum Verschieben ziehen">${String(i+1).padStart(2,'0')}</div>
        <div class="meta">${cfg.meta(e)}</div>
        <div class="tools">
          <button class="icon up" title="Nach oben" ${i===0?'disabled':''}>↑</button>
          <button class="icon down" title="Nach unten" ${i===entries.length-1?'disabled':''}>↓</button>
          <button class="icon del" title="Entfernen">✕</button>
        </div>`;

      if(cfg.extra){
        const html = cfg.extra(e, li);
        if(html){
          const div = document.createElement('div');
          div.className = 'rowextra';
          div.innerHTML = html;
          li.appendChild(div);
        }
      }

      li.querySelector('.up').onclick = () => { [entries[i-1],entries[i]]=[entries[i],entries[i-1]]; render(); cfg.onChange && cfg.onChange(); };
      li.querySelector('.down').onclick = () => { [entries[i+1],entries[i]]=[entries[i],entries[i+1]]; render(); cfg.onChange && cfg.onChange(); };
      li.querySelector('.del').onclick = () => { entries.splice(i,1); render(); cfg.onChange && cfg.onChange(); };

      const tab = li.querySelector('.tab');
      tab.addEventListener('dragstart', ev => {
        ev.dataTransfer.setData('text/plain', String(e.id));
        ev.dataTransfer.effectAllowed = 'move';
        li.classList.add('dragging');
      });
      tab.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', ev => { ev.preventDefault(); li.classList.add('drop-target'); });
      li.addEventListener('dragleave', () => li.classList.remove('drop-target'));
      li.addEventListener('drop', ev => {
        ev.preventDefault(); li.classList.remove('drop-target');
        const from = entries.findIndex(x => x.id === +ev.dataTransfer.getData('text/plain'));
        const to = entries.findIndex(x => x.id === e.id);
        if(from < 0 || from === to) return;
        entries.splice(to, 0, entries.splice(from,1)[0]);
        render(); cfg.onChange && cfg.onChange();
      });

      if(cfg.wire) cfg.wire(e, li);
      container.appendChild(li);
    });

    if(cfg.onChange) cfg.onChange();
  }

  return { render };
};
