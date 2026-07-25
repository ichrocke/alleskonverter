/* Einstellungen eines Werkzeugs merken.

   Beim nächsten Besuch stehen Auswahlfelder, Schieberegler und Häkchen wieder
   so, wie man sie zuletzt hatte. Gespeichert wird ausschließlich lokal im
   Browser (localStorage) und nur, was zur Bedienung gehört — niemals Inhalte,
   Dateinamen oder Passwörter. */
window.AK = window.AK || {};

(function(){
  const PRAEFIX = 'ak.einst.';
  /* Nichts merken, was persönlich ist oder beim nächsten Mal stören würde */
  const TABU = /passwort|pw|password|outname|dateiname|ranges|seiten|text|input|suche/i;

  function schluessel(){
    const teile = location.pathname.replace(/\/index\.html$/, '').split('/').filter(Boolean);
    return PRAEFIX + (teile[teile.length - 1] || 'start');
  }

  function merkenswert(el){
    if(!el.id || TABU.test(el.id)) return false;
    if(el.type === 'password' || el.type === 'file' || el.type === 'search') return false;
    if(el.tagName === 'TEXTAREA') return false;
    if(el.tagName === 'SELECT') return true;
    return ['checkbox','radio','range','number','color'].includes(el.type);
  }

  AK.einstellungenMerken = function(){
    const felder = Array.from(document.querySelectorAll('select[id], input[id]')).filter(merkenswert);
    if(!felder.length) return;
    const k = schluessel();

    // Gespeicherten Stand einspielen
    try{
      const stand = JSON.parse(localStorage.getItem(k) || '{}');
      for(const el of felder){
        if(!(el.id in stand)) continue;
        const wert = stand[el.id];
        if(el.type === 'checkbox' || el.type === 'radio') el.checked = !!wert;
        else el.value = wert;
        // Werkzeuge reagieren auf change/input — beides auslösen, damit die
        // abhängigen Anzeigen (Regler-Beschriftung, ein-/ausblenden) stimmen
        el.dispatchEvent(new Event('input', { bubbles:true }));
        el.dispatchEvent(new Event('change', { bubbles:true }));
      }
    }catch(_){ /* beschädigter Eintrag — einfach ignorieren */ }

    // Änderungen sichern
    const sichern = () => {
      const stand = {};
      for(const el of felder){
        stand[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value;
      }
      try{ localStorage.setItem(k, JSON.stringify(stand)); }catch(_){ /* Speicher voll oder gesperrt */ }
    };
    felder.forEach(el => el.addEventListener('change', sichern));
  };

  AK.einstellungenVergessen = function(){
    Object.keys(localStorage).filter(k => k.startsWith(PRAEFIX)).forEach(k => localStorage.removeItem(k));
  };

  /* Automatisch nach dem Laden anwenden — das Seitenskript ist dann fertig */
  addEventListener('load', () => AK.einstellungenMerken());
})();
