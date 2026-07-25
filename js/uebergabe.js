/* Dateiübergabe zwischen Startseite und Werkzeug.

   Zieht jemand eine Datei auf die Startseite, wird sie kurz in der lokalen
   Datenbank des Browsers (IndexedDB) abgelegt und vom aufgerufenen Werkzeug
   sofort wieder abgeholt und gelöscht. So muss man die Datei nicht ein
   zweites Mal auswählen. Alles bleibt dabei auf dem Gerät — es wird nichts
   übertragen, und mehr als einen Sprung überlebt der Eintrag nicht. */
window.AK = window.AK || {};

(function(){
  const DB = 'alleskonverter', SPEICHER = 'uebergabe', SCHLUESSEL = 'dateien';

  function oeffne(){
    return new Promise((res, rej) => {
      const anfrage = indexedDB.open(DB, 1);
      anfrage.onupgradeneeded = () => {
        const db = anfrage.result;
        if(!db.objectStoreNames.contains(SPEICHER)) db.createObjectStore(SPEICHER);
      };
      anfrage.onsuccess = () => res(anfrage.result);
      anfrage.onerror = () => rej(anfrage.error);
    });
  }

  function mitSpeicher(modus, arbeit){
    return oeffne().then(db => new Promise((res, rej) => {
      const t = db.transaction(SPEICHER, modus);
      const anfrage = arbeit(t.objectStore(SPEICHER));
      t.oncomplete = () => { db.close(); res(anfrage && anfrage.result); };
      t.onerror = () => { db.close(); rej(t.error); };
    }));
  }

  /* Dateien für den nächsten Seitenaufruf hinterlegen */
  AK.uebergabeSetzen = async function(dateien){
    try{
      await mitSpeicher('readwrite', s => s.put(Array.from(dateien), SCHLUESSEL));
      return true;
    }catch(err){
      console.warn('Dateiübergabe nicht möglich:', err);
      return false;
    }
  };

  /* Einmalig abholen — der Eintrag wird dabei gelöscht */
  AK.uebergabeHolen = async function(){
    try{
      const dateien = await mitSpeicher('readonly', s => s.get(SCHLUESSEL));
      await mitSpeicher('readwrite', s => s.delete(SCHLUESSEL));
      return Array.isArray(dateien) && dateien.length ? dateien : null;
    }catch(err){
      return null;
    }
  };

  /* Auf Werkzeugseiten: nach dem Laden die übergebene Datei einspeisen.
     Läuft im load-Ereignis, damit das Seitenskript addFiles() bereits kennt. */
  if(new URLSearchParams(location.search).has('datei')){
    addEventListener('load', async () => {
      const dateien = await AK.uebergabeHolen();
      // Adresszeile wieder aufräumen, damit ein Neuladen nichts Altes zeigt
      history.replaceState(null, '', location.pathname);
      if(!dateien || typeof window.addFiles !== 'function') return;
      try{
        await window.addFiles(dateien);
        if(AK.log) AK.log(dateien.length === 1
          ? `„${dateien[0].name}“ von der Startseite übernommen.`
          : `${dateien.length} Dateien von der Startseite übernommen.`);
      }catch(err){
        console.warn('Übergebene Datei konnte nicht geladen werden:', err);
      }
    });
  }
})();
