/* Liedblatt-Maschine: liest Liedblätter in beiden üblichen Schreibweisen
   („Akkordzeile über Textzeile“ und „[Akkord] im Text“ wie bei ChordPro) in ein
   gemeinsames Modell und schreibt sie in der gewünschten Form wieder heraus —
   dabei transponiert und wahlweise in deutscher Schreibweise (H, B).

   Ohne DOM, damit sich das Rechnen getrennt von der Seite prüfen lässt. */
(function(){
  const TON = { C:0, D:2, E:4, F:5, G:7, A:9, B:11, H:11 };
  const NAMEN = {
    gemischt: ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'],   // die jeweils geläufigere Schreibung
    kreuze:   ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
    bes:      ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'],
  };
  /* Was nach dem Grundton stehen darf: m, maj7, sus4, add9, 7b5, 6/9, (b9) … */
  const ZUSATZ = /^(?:maj|min|dim|aug|sus|add|omit|no|m|M|j|\d|[#b♯♭+\-°ø∆Δ()]|\/(?=\d))*$/;
  /* Kein Akkord, gehört aber in Akkordzeilen: Wiederholungen, Taktstriche, „kein Akkord“ */
  const BEIWERK = /^(\(?\d+x\)?|\(?x\d+\)?|\|+:?|:?\|+|:\|+:|%|-+|\/+|\.{2,}|N\.?C\.?)$/i;

  /* Grundton am Anfang von s. Liefert alle Lesarten, die längste zuerst — „Asus4“
     ist A mit sus4 und nicht As mit „us4“, das entscheidet erst der Rest. */
  function grundtoene(s, deutsch){
    const buchstabe = s[0];
    if(!buchstabe || !/[A-Ha-h]/.test(buchstabe)) return [];
    const gross = buchstabe.toUpperCase(), klein = buchstabe !== gross;
    if(klein && !deutsch) return [];                 // kleine Buchstaben sind nur deutsch ein Akkord (a = a-Moll)
    const lesarten = [];
    const dazu = (laenge, schritt) => {
      let ton = TON[gross] + schritt;
      if(deutsch && gross === 'B' && schritt === 0) ton = 10;   // deutsches B ist das internationale Bb
      lesarten.push({ ton:((ton % 12) + 12) % 12, vorz: schritt > 0 ? '#' : schritt < 0 ? 'b' : '', klein, laenge });
    };
    const rest = s.slice(1);
    if(deutsch){
      if(rest.startsWith('is')) dazu(3, 1);                                  // Fis, Cis, Gis …
      if(rest.startsWith('es') && /[CDFG]/.test(gross)) dazu(3, -1);         // Des, Ges, Ces
      if(rest.startsWith('s') && /[AE]/.test(gross)) dazu(2, -1);            // As, Es
    }
    if(/^[#♯]/.test(rest)) dazu(2, 1);
    if(/^[b♭]/.test(rest)) dazu(2, -1);
    dazu(1, 0);
    return lesarten;
  }

  /* „Am7/G“ → { grund, vorz, zusatz, bass, klammer } oder null, wenn es kein Akkord ist */
  function liesAkkord(wort, deutsch){
    let s = wort, klammer = false;
    if(/^\(.+\)$/.test(s) && !/^\([^)]*\).+/.test(s)){ s = s.slice(1, -1); klammer = true; }   // (C) = Akkord nach Belieben
    for(const g of grundtoene(s, deutsch)){
      let rest = s.slice(g.laenge), bass = null;
      const strich = rest.lastIndexOf('/');
      if(strich >= 0 && !/^\d/.test(rest.slice(strich + 1))){
        const hinten = rest.slice(strich + 1);
        bass = grundtoene(hinten, deutsch).find(b => b.laenge === hinten.length) || null;
        if(!bass) continue;
        rest = rest.slice(0, strich);
      }
      if(!ZUSATZ.test(rest)) continue;
      // Deutsch klein geschrieben heißt Moll: a → Am, fis7 → F#m7
      if(g.klein && !/^(m(?!aj)|dim|°)/.test(rest)) rest = 'm' + rest;
      return { grund:g.ton, vorz:g.vorz, zusatz:rest, bass: bass ? { ton:bass.ton, vorz:bass.vorz } : null, klammer };
    }
    return null;
  }

  function woerter(zeile){
    const liste = [], muster = /\S+/g;
    let m;
    while((m = muster.exec(zeile))) liste.push({ wort:m[0], pos:m.index });
    return liste;
  }

  /* Besteht die Zeile nur aus Akkorden (und Beiwerk)? Dann die Teile, sonst null. */
  function akkordzeile(zeile, deutsch){
    const teile = [];
    let akkorde = 0;
    for(const w of woerter(zeile)){
      if(BEIWERK.test(w.wort)){ teile.push({ pos:w.pos, roh:w.wort }); continue; }
      const a = liesAkkord(w.wort, deutsch);
      if(!a) return null;
      teile.push({ pos:w.pos, roh:w.wort, a });
      akkorde++;
    }
    return akkorde ? teile : null;
  }

  /* „[Am]Text [C]mehr“ → Text ohne Klammern und die Akkorde mit ihrer Stelle.
     Eckige Klammern ohne Akkord darin („[Refrain]“) bleiben stehen. */
  function imText(zeile, deutsch){
    const akkorde = [];
    let text = '', zuletzt = 0, m;
    const muster = /\[([^\[\]]*)\]/g;
    while((m = muster.exec(zeile))){
      const a = liesAkkord(m[1].trim(), deutsch);
      if(!a) continue;
      text += zeile.slice(zuletzt, m.index);
      akkorde.push({ pos:text.length, roh:m[1].trim(), a });
      zuletzt = m.index + m[0].length;
    }
    if(!akkorde.length) return null;
    return { text: text + zeile.slice(zuletzt), akkorde };
  }

  const DIREKTIVE = /^\s*\{\s*([^:{}]+?)\s*(?::\s*(.*?)\s*)?\}\s*$/;
  const VORSPANN = /^(\s*[^\s\[\]{}|:]+(?: \d+)?:)(\s+)(\S.*)$/;     // „Intro: C G Am“, „Strophe 2: …“

  function zerlege(text, deutsch){
    const roh = String(text).replace(/\r\n?/g, '\n').split('\n').map(z => z.replace(/\t/g, '    ').replace(/\s+$/, ''));
    const zeilen = [];
    const zahl = { ueber:0, imtext:0, allein:0 };
    for(let n = 0; n < roh.length; n++){
      const zeile = roh[n];
      const d = DIREKTIVE.exec(zeile);
      if(d){ zeilen.push({ art:'direktive', name:d[1].toLowerCase(), wert:d[2] || '', roh:zeile }); continue; }
      if(/^\s*capo\b/i.test(zeile)){ zeilen.push({ art:'capo', text:zeile }); continue; }

      const innen = imText(zeile, deutsch);
      if(innen){ zeilen.push({ art:'text', text:innen.text, akkorde:innen.akkorde }); zahl.imtext++; continue; }

      const teile = akkordzeile(zeile, deutsch);
      if(teile){
        const danach = roh[n + 1];
        const hatText = danach !== undefined && danach.trim() !== '' && !DIREKTIVE.test(danach) &&
                        !akkordzeile(danach, deutsch) && !imText(danach, deutsch) && !mitVorspann(danach, deutsch);
        if(hatText){
          zeilen.push({ art:'text', text:danach, akkorde:teile });
          zahl.ueber++; n++;
        }else{
          zeilen.push({ art:'akkorde', vor:'', teile });
          zahl.allein++;
        }
        continue;
      }
      const v = mitVorspann(zeile, deutsch);
      if(v){ zeilen.push(v); zahl.allein++; continue; }
      zeilen.push({ art:'text', text:zeile, akkorde:[] });
    }
    return { zeilen, zahl };
  }

  function mitVorspann(zeile, deutsch){
    const m = VORSPANN.exec(zeile);
    if(!m) return null;
    const teile = akkordzeile(m[3], deutsch);
    if(!teile) return null;
    const versatz = m[1].length + m[2].length;
    return { art:'akkorde', vor:m[1], teile: teile.map(t => Object.assign({}, t, { pos:t.pos + versatz })) };
  }

  /* Deutsche Schreibweise erkennt man an H, an klein geschriebenen Moll-Akkorden
     oder an Fis/Es. Fehlt all das, gilt die internationale. */
  function klingtDeutsch(text){
    const { zeilen } = zerlege(text, true);
    for(const z of zeilen){
      const liste = z.art === 'text' ? z.akkorde : z.art === 'akkorde' ? z.teile : [];
      for(const t of liste){
        if(!t.a) continue;
        if(/^\(?[Hh]/.test(t.roh) || /^\(?[a-h]/.test(t.roh) || /^\(?[A-Ha-h](is|es|s)(?!us)/.test(t.roh) || /\/[Hh]/.test(t.roh)) return true;
      }
    }
    return false;
  }

  /* lesen: 'auto' | 'deutsch' | 'international' */
  function lies(text, lesen){
    const deutsch = lesen === 'deutsch' || (lesen !== 'international' && klingtDeutsch(text));
    const ergebnis = zerlege(text, deutsch);
    ergebnis.deutsch = deutsch;
    // Die klassische Falle: ein einzelnes „B“ ohne weiteren Anhaltspunkt
    ergebnis.bFraglich = lesen === 'auto' && !deutsch && ergebnis.zeilen.some(z =>
      (z.art === 'text' ? z.akkorde : z.art === 'akkorde' ? z.teile : []).some(t => t.a && /^\(?B(?![b♭])/.test(t.roh)));
    return ergebnis;
  }

  /* ---------- Schreiben ---------- */
  function tonName(ton, vorz, o){
    const t = ((ton + o.halbtoene) % 12 + 12) % 12;
    let tabelle = NAMEN[o.vorzeichen];
    // Ohne Transponieren bleibt jede Note, wie sie im Blatt stand (C# wird nicht zu Db)
    if(!tabelle) tabelle = o.halbtoene === 0 && vorz ? (vorz === '#' ? NAMEN.kreuze : NAMEN.bes) : NAMEN.gemischt;
    const name = tabelle[t];
    if(!o.deutsch) return name;
    return name === 'B' ? 'H' : name === 'Bb' ? 'B' : name;
  }
  function akkordName(a, o){
    const name = tonName(a.grund, a.vorz, o) + a.zusatz + (a.bass ? '/' + tonName(a.bass.ton, a.bass.vorz, o) : '');
    return a.klammer ? '(' + name + ')' : name;
  }

  /* ChordPro-Angaben als gewöhnliche Zeile, wenn das Ziel keine eckigen Klammern kennt */
  function direktiveKlar(z, o){
    const n = z.name, w = z.wert;
    if(/^(title|t|subtitle|st|artist|composer|lyricist|comment|c|ci|cb|comment_italic|comment_box)$/.test(n)) return w;
    if(/^(start_of_chorus|soc)$/.test(n)) return (w || 'Refrain') + ':';
    if(/^(start_of_bridge|sob)$/.test(n)) return (w || 'Bridge') + ':';
    if(/^(start_of_verse|sov)$/.test(n)) return w ? w + ':' : null;
    if(/^(end_of_\w+|eoc|eov|eob|eot|start_of_tab|sot|chorus)$/.test(n)) return null;
    if(n === 'key'){ const a = liesAkkord(w, o.gelesenDeutsch); return 'Tonart: ' + (a ? akkordName(a, o) : w); }
    if(n === 'capo') return 'Capo: ' + w;
    return z.roh;
  }

  function schreibe(modell, wahl){
    const o = Object.assign({ format:'imtext', halbtoene:0, vorzeichen:'auto', deutsch:false, capoWeg:true }, wahl, { gelesenDeutsch:modell.deutsch });
    const aus = [], zuordnung = new Map();
    let capoEntfernt = 0;
    const name = t => { const neu = akkordName(t.a, o); zuordnung.set(t.roh, neu); return neu; };
    const marke = t => t.a ? '[' + name(t) + ']' : t.roh;      // Beiwerk wie „|“ oder „2x“ bleibt, wie es ist

    for(const z of modell.zeilen){
      const capo = z.art === 'capo' || (z.art === 'direktive' && z.name === 'capo');
      if(capo && o.halbtoene !== 0 && o.capoWeg){ capoEntfernt++; continue; }

      if(z.art === 'capo'){ aus.push(z.text); continue; }

      if(z.art === 'direktive'){
        if(o.format === 'imtext'){
          const a = z.name === 'key' ? liesAkkord(z.wert, modell.deutsch) : null;
          aus.push(a ? `{key: ${akkordName(a, o)}}` : z.roh);
        }else{
          const klar = direktiveKlar(z, o);
          if(klar !== null) aus.push(klar);
        }
        continue;
      }

      if(z.art === 'akkorde'){
        if(o.format === 'text') continue;
        if(o.format === 'imtext'){
          aus.push((z.vor ? z.vor + ' ' : '') + z.teile.map(marke).join(' '));
        }else{
          // Spalten des Originals halten, aber nie zwei Akkorde aneinanderkleben
          let s = z.vor;
          for(const t of z.teile){
            const wort = t.a ? name(t) : t.roh;
            const spalte = Math.max(t.pos, s.length + (s.length ? 1 : 0));
            s = s.padEnd(spalte) + wort;
          }
          aus.push(s);
        }
        continue;
      }

      // Textzeile, mit oder ohne Akkorde
      if(!z.akkorde.length || o.format === 'text'){
        if(o.format === 'text' && z.akkorde.length && z.text.trim() === '') continue;   // „[C] [G]“ ohne Worte
        aus.push(z.text);
        continue;
      }
      const leer = z.text.trim() === '';
      if(o.format === 'imtext'){
        if(leer){ aus.push(z.akkorde.map(marke).join(' ')); continue; }
        // Von hinten einsetzen, damit die vorderen Stellen gültig bleiben
        const marken = z.akkorde.map(marke);
        let text = z.text, hinten = '';
        for(let k = z.akkorde.length - 1; k >= 0; k--){
          const t = z.akkorde[k];
          if(t.pos >= z.text.length) hinten = ' ' + marken[k] + hinten;
          else text = text.slice(0, t.pos) + marken[k] + text.slice(t.pos);
        }
        aus.push(text + hinten);
      }else{
        // Akkorde über dem Text: Reicht der Platz bis zum nächsten Akkord nicht,
        // wird der Text gestreckt — im Wort mit Bindestrichen, sonst mit Leerzeichen
        let oben = '', text = z.text, schub = 0;
        for(const t of z.akkorde){
          let spalte = t.pos + schub;
          const frei = oben.length + (oben.length ? 1 : 0);
          if(spalte < frei){
            const fehlt = frei - spalte;
            if(spalte < text.length){
              const imWort = spalte > 0 && /\S/.test(text[spalte - 1]) && /\S/.test(text[spalte]);
              text = text.slice(0, spalte) + (imWort ? '-' : ' ').repeat(fehlt) + text.slice(spalte);
            }
            schub += fehlt; spalte = frei;
          }
          oben = oben.padEnd(spalte) + (t.a ? name(t) : t.roh);
        }
        aus.push(oben);
        if(!leer) aus.push(text);
      }
    }

    let text = aus.join('\n');
    // Wo Akkordzeilen wegfallen, bleiben sonst Lücken aus mehreren Leerzeilen
    if(o.format === 'text') text = text.replace(/\n{3,}/g, '\n\n');
    return { text: text.replace(/^\n+/, '').replace(/\s+$/, ''), zuordnung:[...zuordnung], capoEntfernt };
  }

  const liedblatt = { lies, schreibe, liesAkkord, akkordName };
  if(typeof window !== 'undefined'){ window.AK = window.AK || {}; window.AK.liedblatt = liedblatt; }
  if(typeof module !== 'undefined') module.exports = liedblatt;
})();
