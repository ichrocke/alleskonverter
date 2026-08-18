/* PDF-Text ersetzen — die Maschine unter der Oberfläche.

   Was hier passiert, in einem Satz: Der Inhaltsstrom jeder Seite wird in
   Operatoren zerlegt, jede Textstelle bekommt ihre Position, und beim
   Ersetzen werden genau die betroffenen Bytes ausgetauscht — nichts wird
   gerastert, nichts überdeckt, der Rest der Seite bleibt bytegleich.

   Arbeitsteilung:
   • pdf.js liefert je Textoperator die Glyphen (Unicode, Code, Breite) —
     Schriften zu entschlüsseln ist die eine Sache, die man nicht selbst
     schreiben will.
   • Dieser Code zerlegt den rohen Strom (mit Byte-Offsets), verfolgt die
     Textmatrix und rechnet Positionen, damit die n-te Textstelle im Strom der
     n-ten Glyphenliste von pdf.js zugeordnet werden kann.
   • pdf-lib schreibt am Ende die geänderten Ströme zurück.

   Bewusst klassisches Skript (globaler AK-Namensraum), siehe js/ui.js. */
window.AK = window.AK || {};

AK.textstrom = (function(){
  'use strict';

  /* ================================================================
     1. Tokenizer: Bytes → Operatoren mit Operanden und Byte-Bereichen
     ================================================================ */
  class Nm { constructor(s){ this.s = s; } }            // /Name
  class Str { constructor(b){ this.b = b; } }           // (…) oder <…> als Bytes
  class Op  { constructor(op, args, start, end){ this.op = op; this.args = args; this.start = start; this.end = end; } }

  const WS = new Uint8Array(256); [0, 9, 10, 12, 13, 32].forEach(c => WS[c] = 1);
  const DELIM = new Uint8Array(256); '()<>[]{}/%'.split('').forEach(c => DELIM[c.charCodeAt(0)] = 1);
  const isRegular = c => !WS[c] && !DELIM[c];
  const isHex = c => (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102);
  const hexVal = c => c <= 57 ? c - 48 : (c | 32) - 87;
  const NUMRE = /^[+-]?(\d+\.?\d*|\.\d+)$/;

  function parse(bytes){
    const n = bytes.length;
    let i = 0;
    const ops = [];
    let stack = [];          // aktuelle Operanden
    let stackStart = -1;     // Byte-Offset des ersten Operanden

    const skipWs = () => {
      for(;;){
        while(i < n && WS[bytes[i]]) i++;
        if(i < n && bytes[i] === 37){ while(i < n && bytes[i] !== 10 && bytes[i] !== 13) i++; continue; }
        return;
      }
    };

    function readToken(){
      // liefert {v, kind, start} — kind: 'obj' (Operand) oder 'op' (Operator) oder null bei Ende
      skipWs();
      if(i >= n) return null;
      const start = i;
      const t = readToken0();
      if(t) t.start = start;
      return t;
    }
    function readToken0(){
      skipWs();
      if(i >= n) return null;
      const c = bytes[i];
      if(c === 40){ return { v: new Str(readLiteral()), kind:'obj' }; }
      if(c === 60){
        if(bytes[i+1] === 60){ i += 2; return { v: readDict(), kind:'obj' }; }
        return { v: new Str(readHex()), kind:'obj' };
      }
      if(c === 47){ i++; return { v: new Nm(readName()), kind:'obj' }; }
      if(c === 91){ i++; return { v: readArray(), kind:'obj' }; }
      if(c === 93){ i++; return { v: undefined, kind:'arrend' }; }
      if(c === 62){ // '>' oder '>>'
        if(bytes[i+1] === 62){ i += 2; return { v: undefined, kind:'dictend' }; }
        i++; return readToken();   // verirrtes '>' — überspringen
      }
      if(c === 123 || c === 125){ i++; return readToken(); }   // { } (nur in Funktionen)
      if(c === 41){ i++; return readToken(); }                 // verirrtes ')'
      // reguläres Wort
      const s = i;
      while(i < n && isRegular(bytes[i])) i++;
      const w = latin(bytes, s, i);
      if(NUMRE.test(w)) return { v: parseFloat(w), kind:'obj' };
      if(w === 'true') return { v: true, kind:'obj' };
      if(w === 'false') return { v: false, kind:'obj' };
      if(w === 'null') return { v: null, kind:'obj' };
      return { v: w, kind:'op' };
    }

    function readName(){
      const s = i;
      while(i < n && isRegular(bytes[i])) i++;
      let raw = latin(bytes, s, i);
      if(raw.includes('#')) raw = raw.replace(/#([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      return raw;
    }

    function readLiteral(){
      i++; // '('
      let depth = 1;
      const out = [];
      while(i < n){
        let c = bytes[i++];
        if(c === 92){ // Backslash
          if(i >= n) break;
          c = bytes[i++];
          switch(c){
            case 110: out.push(10); break;   // n
            case 114: out.push(13); break;   // r
            case 116: out.push(9); break;    // t
            case 98:  out.push(8); break;    // b
            case 102: out.push(12); break;   // f
            case 40: case 41: case 92: out.push(c); break;
            case 13: if(bytes[i] === 10) i++; break;   // Zeilenfortsetzung
            case 10: break;
            default:
              if(c >= 48 && c <= 55){
                let v = c - 48, k = 1;
                while(k < 3 && i < n && bytes[i] >= 48 && bytes[i] <= 55){ v = v*8 + (bytes[i++] - 48); k++; }
                out.push(v & 255);
              }else out.push(c);
          }
        }else if(c === 40){ depth++; out.push(c); }
        else if(c === 41){ depth--; if(depth === 0) break; out.push(c); }
        else if(c === 13){ if(bytes[i] === 10) i++; out.push(10); }
        else out.push(c);
      }
      return Uint8Array.from(out);
    }

    function readHex(){
      i++; // '<'
      const out = [];
      let hi = -1;
      while(i < n){
        const c = bytes[i++];
        if(c === 62) break;
        if(!isHex(c)) continue;
        if(hi < 0) hi = hexVal(c);
        else { out.push(hi*16 + hexVal(c)); hi = -1; }
      }
      if(hi >= 0) out.push(hi*16);
      return Uint8Array.from(out);
    }

    function readArray(){
      const arr = [];
      for(;;){
        const t = readToken();
        if(!t || t.kind === 'arrend') return arr;
        if(t.kind === 'dictend') continue;
        if(t.kind === 'op'){ arr.push(new Nm('?' + t.v)); continue; }   // Unsinn im Array — tolerieren
        arr.push(t.v);
      }
    }

    function readDict(){
      const d = new Map();
      for(;;){
        const k = readToken();
        if(!k || k.kind === 'dictend') return d;
        if(!(k.v instanceof Nm)) continue;
        const v = readToken();
        if(!v || v.kind === 'dictend') return d;
        d.set(k.v.s, v.v);
      }
    }

    // Inline-Bild: nach ID folgt Binärmaterial bis EI
    function skipInlineImage(dict){
      // genau ein Weißraum nach ID
      if(i < n && WS[bytes[i]]) i++;
      const filter = dict.get('F') || dict.get('Filter');
      if(!filter || (Array.isArray(filter) && !filter.length)){
        const w = +dict.get('W') || +dict.get('Width') || 0;
        const h = +dict.get('H') || +dict.get('Height') || 0;
        let bpc = +dict.get('BPC') || +dict.get('BitsPerComponent') || 8;
        const im = dict.get('IM') ?? dict.get('ImageMask');
        let cs = dict.get('CS') ?? dict.get('ColorSpace');
        let nc = 1;
        if(im === true){ bpc = 1; nc = 1; }
        else if(cs instanceof Nm){
          const s = cs.s;
          nc = /^(RGB|DeviceRGB|CalRGB|Lab)$/.test(s) ? 3 : /^(CMYK|DeviceCMYK)$/.test(s) ? 4 : /^(G|DeviceGray|CalGray|I|Indexed)$/.test(s) ? 1 : -1;
        }else if(Array.isArray(cs)) nc = 1;   // [/Indexed …]
        if(w > 0 && h > 0 && nc > 0){
          const len = Math.ceil(w * nc * bpc / 8) * h;
          let p = i + len;
          // danach Weißraum + EI
          while(p < n && WS[bytes[p]]) p++;
          if(bytes[p] === 69 && bytes[p+1] === 73 && (p+2 >= n || WS[bytes[p+2]] || DELIM[bytes[p+2]])){ i = p + 2; return; }
          // Länge stimmt nicht — auf Suche zurückfallen
        }
      }
      // heuristische Suche nach „<ws>EI<ws|Ende>“
      let p = i;
      while(p < n){
        if(bytes[p] === 69 && bytes[p+1] === 73 && (p === 0 || WS[bytes[p-1]]) && (p+2 >= n || WS[bytes[p+2]])){
          // die nächsten Bytes sollten wie Text aussehen
          let ok = true;
          for(let k = p+2; k < Math.min(n, p+24); k++){ const c = bytes[k]; if(c > 127 || (c < 32 && !WS[c])){ ok = false; break; } }
          if(ok){ i = p + 2; return; }
        }
        p++;
      }
      i = n;
    }

    for(;;){
      const t = readToken();
      if(!t) break;
      const hier = t.start;
      if(t.kind === 'obj'){
        if(stackStart < 0) stackStart = hier;
        stack.push(t.v);
        continue;
      }
      if(t.kind !== 'op'){ continue; }   // verirrte Klammern
      const opStart = stackStart >= 0 ? stackStart : hier;
      if(t.v === 'BI'){
        // Bild-Wörterbuch bis ID einlesen
        const d = new Map();
        for(;;){
          const k = readToken();
          if(!k) break;
          if(k.kind === 'op' && k.v === 'ID') break;
          if(k.kind === 'obj' && k.v instanceof Nm){
            const v = readToken(); if(!v) break;
            if(v.kind === 'op' && v.v === 'ID') break;
            d.set(k.v.s, v.v);
          }
        }
        skipInlineImage(d);
        ops.push(new Op('BI', [d], opStart, i));
      }else{
        ops.push(new Op(t.v, stack, opStart, i));
      }
      stack = []; stackStart = -1;
    }
    return ops;
  }

  function latin(bytes, s, e){
    let out = '';
    for(let k = s; k < e; k++) out += String.fromCharCode(bytes[k]);
    return out;
  }

  /* ================================================================
     2. Serialisierung einzelner Operanden (für die geänderten Stücke)
     ================================================================ */
  function fmtNum(v){
    if(Number.isInteger(v)) return String(v);
    let s = v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    if(s === '-0') s = '0';
    return s;
  }
  function fmtName(s){
    let out = '/';
    for(const ch of s){
      const c = ch.charCodeAt(0);
      if(c < 33 || c > 126 || ch === '#' || DELIM[c]) out += '#' + c.toString(16).padStart(2, '0');
      else out += ch;
    }
    return out;
  }
  function fmtHex(bytes){
    let s = '<';
    for(const b of bytes) s += b.toString(16).padStart(2, '0');
    return s + '>';
  }
  function fmt(v){
    if(typeof v === 'number') return fmtNum(v);
    if(v instanceof Nm) return fmtName(v.s);
    if(v instanceof Str) return fmtHex(v.b);
    if(Array.isArray(v)) return '[' + v.map(fmt).join(' ') + ']';
    if(v === true) return 'true';
    if(v === false) return 'false';
    if(v === null) return 'null';
    if(v instanceof Map){ let s = '<<'; for(const [k, x] of v) s += fmtName(k) + ' ' + fmt(x) + ' '; return s + '>>'; }
    return '';
  }

  /* ================================================================
     3. Matrizen (PDF-Konvention: [a b c d e f], Zeilenvektoren)
     ================================================================ */
  const mul = (m, n) => [
    m[0]*n[0] + m[1]*n[2],        m[0]*n[1] + m[1]*n[3],
    m[2]*n[0] + m[3]*n[2],        m[2]*n[1] + m[3]*n[3],
    m[4]*n[0] + m[5]*n[2] + n[4], m[4]*n[1] + m[5]*n[3] + n[5],
  ];
  const apply = (m, x, y) => [m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5]];
  function invert(m){
    const det = m[0]*m[3] - m[1]*m[2];
    if(!det) return null;
    return [ m[3]/det, -m[1]/det, -m[2]/det, m[0]/det,
             (m[2]*m[5] - m[3]*m[4])/det, (m[1]*m[4] - m[0]*m[5])/det ];
  }
  const ID = [1, 0, 0, 1, 0, 0];

  /* ================================================================
     4. Seite analysieren: rohe Operatoren + pdf.js-Glyphen → Textläufe
     ================================================================
     Eingaben:
       kontext = { doc (pdf-lib), page (pdf-lib PDFPage), fonts (gemeinsames Schriftregister),
                   glyphenListe: [{loaded, size, glyphs}] aus pdf.js in Reihenfolge,
                   fontObj: loadedName → pdf.js-Schriftobjekt }
     Ergebnis: { streams, runs, lines, fehler }                                    */

  function ladeStrom(doc, stream){
    // PDFRawStream (oder bereits von uns geschrieben) → Bytes
    try{
      if(stream instanceof PDFLib.PDFRawStream) return PDFLib.decodePDFRawStream(stream).decode();
      if(stream && stream.contents instanceof Uint8Array) return stream.contents;
      if(stream && typeof stream.getContents === 'function') return stream.getContents();
    }catch(_){ /* unten */ }
    return null;
  }

  function seiteninhalt(doc, page){
    // Alle Content-Streams der Seite als ein Byte-Puffer, per Zeilenumbruch getrennt
    const ctx = doc.context;
    const raw = page.node.get(PDFLib.PDFName.of('Contents'));
    const obj = ctx.lookup(raw);
    const teile = [];
    if(obj instanceof PDFLib.PDFArray){
      for(let k = 0; k < obj.size(); k++){
        const s = ctx.lookup(obj.get(k));
        const b = s ? ladeStrom(doc, s) : null;
        if(!b) return null;
        teile.push(b);
      }
    }else if(obj){
      const b = ladeStrom(doc, obj);
      if(!b) return null;
      teile.push(b);
    }
    let len = 0; for(const t of teile) len += t.length + 1;
    const out = new Uint8Array(len);
    let p = 0;
    for(const t of teile){ out.set(t, p); p += t.length; out[p++] = 10; }
    return out;
  }

  function analysiere(kontext){
    const { doc, page, glyphenListe, fontObj } = kontext;
    const ctx = doc.context;
    const streams = [];      // { art:'seite'|'xobj', ref, bytes, ops, res }
    const runs = [];
    let gi = 0;              // Zeiger in glyphenListe
    const fehler = [];

    const pageRes = page.node.Resources ? page.node.Resources() : null;
    const pageBytes = seiteninhalt(doc, page);
    if(!pageBytes) return { streams, runs, lines: [], fehler: ['Seiteninhalt lässt sich nicht lesen'] };
    streams.push({ art:'seite', ref:null, bytes: pageBytes, ops: parse(pageBytes), res: pageRes });

    // Grafikzustand
    let gs = { ctm: ID.slice(), font: null, size: 0, Tc: 0, Tw: 0, Th: 1, TL: 0, Ts: 0 };
    const stapel = [];
    let Tm = ID.slice(), Tlm = ID.slice();
    let inBT = false;
    let flowsFromPrev = false;   // seit dem letzten Textoperator keine Positionierung?
    let btId = 0;

    const lookupRes = (res, kat, name) => {
      if(!res) return null;
      const d = ctx.lookupMaybe(res.get(PDFLib.PDFName.of(kat)), PDFLib.PDFDict);
      if(!d) return null;
      const r = d.get(PDFLib.PDFName.of(name));
      return r ? { obj: ctx.lookup(r), ref: r instanceof PDFLib.PDFRef ? r : null } : null;
    };

    function walk(sIdx, tiefe, besucht){
      const st = streams[sIdx];
      for(let oi = 0; oi < st.ops.length; oi++){
        const o = st.ops[oi];
        const a = o.args;
        switch(o.op){
          case 'q': stapel.push({ gs: { ...gs, ctm: gs.ctm.slice() } }); break;
          case 'Q': if(stapel.length){ gs = stapel.pop().gs; } break;
          case 'cm': if(a.length >= 6 && a.slice(0,6).every(x => typeof x === 'number')) gs.ctm = mul(a.slice(0, 6), gs.ctm); break;
          case 'BT': Tm = ID.slice(); Tlm = ID.slice(); inBT = true; flowsFromPrev = false; btId++; break;
          case 'ET': inBT = false; break;
          case 'Tf':
            if(a.length >= 2 && a[0] instanceof Nm && typeof a[1] === 'number'){ gs.font = a[0].s; gs.size = a[1]; }
            break;
          case 'Tc': if(typeof a[0] === 'number') gs.Tc = a[0]; break;
          case 'Tw': if(typeof a[0] === 'number') gs.Tw = a[0]; break;
          case 'Tz': if(typeof a[0] === 'number') gs.Th = a[0] / 100; break;
          case 'TL': if(typeof a[0] === 'number') gs.TL = a[0]; break;
          case 'Ts': if(typeof a[0] === 'number') gs.Ts = a[0]; break;
          case 'Td':
            if(typeof a[0] === 'number' && typeof a[1] === 'number'){ Tlm = mul([1,0,0,1,a[0],a[1]], Tlm); Tm = Tlm.slice(); flowsFromPrev = false; }
            break;
          case 'TD':
            if(typeof a[0] === 'number' && typeof a[1] === 'number'){ gs.TL = -a[1]; Tlm = mul([1,0,0,1,a[0],a[1]], Tlm); Tm = Tlm.slice(); flowsFromPrev = false; }
            break;
          case 'Tm':
            if(a.length >= 6 && a.slice(0,6).every(x => typeof x === 'number')){ Tlm = a.slice(0, 6); Tm = Tlm.slice(); flowsFromPrev = false; }
            break;
          case 'T*': Tlm = mul([1,0,0,1,0,-gs.TL], Tlm); Tm = Tlm.slice(); flowsFromPrev = false; break;
          case 'gs': {
            // ExtGState darf eine Schrift setzen — das können wir nicht nachbilden
            const g = a[0] instanceof Nm ? lookupRes(st.res, 'ExtGState', a[0].s) : null;
            if(g && g.obj instanceof PDFLib.PDFDict && g.obj.has(PDFLib.PDFName.of('Font'))){
              fehler.push('Schriftwechsel über ExtGState'); return false;
            }
            break;
          }
          case 'Do': {
            if(!(a[0] instanceof Nm)) break;
            const x = lookupRes(st.res, 'XObject', a[0].s);
            if(!x || !(x.obj instanceof PDFLib.PDFStream)) break;
            const sub = x.obj.dict.get(PDFLib.PDFName.of('Subtype'));
            if(!sub || sub.asString() !== '/Form') break;
            if(tiefe > 24) break;
            const key = x.ref ? x.ref.toString() : null;
            if(key && besucht.has(key)) break;   // Selbstbezug
            const bytes = ladeStrom(doc, x.obj);
            if(!bytes){ fehler.push('Formular-XObject nicht lesbar'); return false; }
            let idx = streams.findIndex(s => s.ref && key && s.ref.toString() === key);
            if(idx < 0){
              const res = ctx.lookupMaybe(x.obj.dict.get(PDFLib.PDFName.of('Resources')), PDFLib.PDFDict) || st.res;
              streams.push({ art:'xobj', ref: x.ref, bytes, ops: parse(bytes), res, obj: x.obj });
              idx = streams.length - 1;
            }
            // wie pdf.js: Zustand sichern, Matrix anwenden, Inhalt inline ausführen
            const gespeichert = { gs: { ...gs, ctm: gs.ctm.slice() }, Tm: Tm.slice(), Tlm: Tlm.slice(), inBT, flows: flowsFromPrev, stapelTiefe: stapel.length };
            const m = x.obj.dict.get(PDFLib.PDFName.of('Matrix'));
            const mm = m ? ctx.lookup(m) : null;
            if(mm instanceof PDFLib.PDFArray && mm.size() === 6){
              const arr = []; for(let k = 0; k < 6; k++){ const v = ctx.lookup(mm.get(k)); arr.push(v instanceof PDFLib.PDFNumber ? v.asNumber() : 0); }
              gs.ctm = mul(arr, gs.ctm);
            }
            const neu = new Set(besucht); if(key) neu.add(key);
            const ok = walk(idx, tiefe + 1, neu);
            stapel.length = gespeichert.stapelTiefe;
            gs = gespeichert.gs; Tm = gespeichert.Tm; Tlm = gespeichert.Tlm; inBT = gespeichert.inBT; flowsFromPrev = gespeichert.flows;
            if(!ok) return false;
            break;
          }
          case 'Tj': case 'TJ': case "'": case '"': {
            if(o.op === "'"){ Tlm = mul([1,0,0,1,0,-gs.TL], Tlm); Tm = Tlm.slice(); flowsFromPrev = false; }
            if(o.op === '"'){
              if(typeof a[0] === 'number') gs.Tw = a[0];
              if(typeof a[1] === 'number') gs.Tc = a[1];
              Tlm = mul([1,0,0,1,0,-gs.TL], Tlm); Tm = Tlm.slice(); flowsFromPrev = false;
            }
            if(!gs.font) break;   // pdf.js überspringt Text ohne gesetzte Schrift ebenfalls
            const eintrag = glyphenListe[gi++];
            if(!eintrag){ fehler.push('mehr Textoperatoren als pdf.js meldet'); return false; }
            const run = baueRun(st, sIdx, oi, o, eintrag);
            if(run){ run.btId = btId; run.flowsFromPrev = flowsFromPrev; runs.push(run); }
            flowsFromPrev = true;
            break;
          }
          default: break;
        }
      }
      return true;
    }

    /* Ein Textoperator wird zu einem „Lauf“: Glyphen mit Positionen im
       Em-Rahmen (1 = Schriftgröße), plus Rahmen-Matrix E ins Seitensystem. */
    function baueRun(st, sIdx, oi, o, eintrag){
      const a = o.args;
      const strArg = o.op === 'TJ' ? a[0] : o.op === '"' ? a[2] : a[0];
      const items = [];   // rohe Elemente: {str:Uint8Array} | {num}
      if(o.op === 'TJ'){
        if(!Array.isArray(strArg)) return null;
        for(const el of strArg){
          if(el instanceof Str) items.push({ str: el.b });
          else if(typeof el === 'number') items.push({ num: el });
        }
      }else{
        if(!(strArg instanceof Str)) return null;
        items.push({ str: strArg.b });
      }
      const font = fontObj[eintrag.loaded] || null;
      const glyphs = eintrag.glyphs || [];
      const nG = glyphs.filter(g => typeof g !== 'number').length;
      const nN = glyphs.length - nG;
      const bytesGesamt = items.reduce((s, it) => s + (it.str ? it.str.length : 0), 0);
      const numsGesamt = items.filter(it => 'num' in it).length;

      const size = gs.size, Th = gs.Th, Tc = gs.Tc, Tw = gs.Tw;
      const E = mul(mul([size*Th, 0, 0, size, 0, gs.Ts], Tm), gs.ctm);
      const run = {
        sIdx, oi, op: o.op, items, glyphs: [], E, size, Th, Tc, Tw, Ts: gs.Ts,
        fontRes: gs.font, loaded: eintrag.loaded, font, editable: true, grund: '',
        text: '', charMap: [], breite: 0,
      };
      if(!size){ run.editable = false; run.grund = 'Schriftgröße 0'; }
      let bpc = 0;
      if(nG > 0){
        if(bytesGesamt === nG) bpc = 1;
        else if(bytesGesamt === 2*nG) bpc = 2;
      }
      if(nG > 0 && (bpc === 0 || nN !== numsGesamt)){ run.editable = false; run.grund = 'Zeichenkodierung nicht nachvollziehbar'; }
      if(font && (font.isType3Font || font.vertical)){ run.editable = false; run.grund = font.vertical ? 'vertikale Schrift' : 'Type-3-Schrift'; }
      run.bpc = bpc;

      // Glyphen den Bytes zuordnen und Positionen rechnen (Em-Einheiten, ohne Th)
      let x = 0, gIdx = 0, text = '';
      const charMap = [];
      let seen = kontext.fonts.get(eintrag.loaded);
      if(!seen){ seen = { map: new Map(), bpc }; kontext.fonts.set(eintrag.loaded, seen); }
      if(bpc && seen.bpc && seen.bpc !== bpc){ run.editable = false; run.grund = 'uneinheitliche Zeichenkodierung'; }
      if(bpc && !seen.bpc) seen.bpc = bpc;
      for(let ii = 0; ii < items.length; ii++){
        const it = items[ii];
        if('num' in it){
          const adv = -it.num / 1000;
          if(bpc){ /* Zahl gehört zwischen Glyphen */ }
          // großer Sprung nach rechts = Wortzwischenraum, den keine Glyphe darstellt
          if(adv > 0.13){ charMap.push({ gap: true, x, w: adv }); text += ' '; }
          x += adv;
          // in run.glyphs als Zahl merken (Position im Item-Strom)
          run.glyphs.push({ num: it.num, ii });
          continue;
        }
        const anzahl = bpc ? it.str.length / bpc : 0;
        for(let k = 0; k < anzahl; k++){
          // nächste pdf.js-Glyphe (Zahlen überspringen)
          while(gIdx < glyphs.length && typeof glyphs[gIdx] === 'number') gIdx++;
          const g = glyphs[gIdx++];
          if(!g) break;
          const code = bpc === 1 ? it.str[k] : (it.str[2*k] << 8) | it.str[2*k+1];
          const w0 = (typeof g.width === 'number' ? g.width : 0) / 1000;
          const sp = !!g.isSpace;
          const adv = w0 + (Tc + (sp ? Tw : 0)) / (size || 1);
          const u = typeof g.unicode === 'string' && g.unicode.length ? g.unicode : '';
          const eintragG = { u, code, w0, sp, x, adv, ii, k, gi: run.glyphs.length };
          run.glyphs.push(eintragG);
          for(let c = 0; c < u.length; c++) charMap.push({ g: eintragG, teil: c, x, w: adv, letzter: c === u.length - 1 });
          text += u;
          x += adv;
          if(run.editable && u && !seen.map.has(u)) seen.map.set(u, { code, w0, sp });
        }
      }
      run.text = text; run.charMap = charMap; run.breite = x;
      // Bezugspunkt und Ausdehnung im Seitensystem (für Anzeige/Zeilenbildung)
      const asc = font && typeof font.ascent === 'number' && font.ascent > 0 ? Math.min(font.ascent, 1.2) : 0.8;
      const desc = font && typeof font.descent === 'number' && font.descent < 0 ? Math.max(font.descent, -0.5) : -0.2;
      run.asc = asc; run.desc = desc;
      return run;
    }

    const ok = walk(0, 0, new Set());
    if(ok && gi !== glyphenListe.length) fehler.push('weniger Textoperatoren als pdf.js meldet');
    const lines = ok && !fehler.length ? bildeZeilen(runs) : [];
    return { streams, runs, lines, fehler };
  }

  /* Läufe zu Zeilen gruppieren: gleicher Grundlinienverlauf, dicht beieinander */
  function bildeZeilen(runs){
    const lines = [];
    let cur = null;
    for(const r of runs){
      if(cur){
        const inv = invert(cur.E);
        const p = inv ? apply(inv, r.E[4], r.E[5]) : null;   // Start von r im Rahmen der Zeile
        // gleiche Richtung? (Basisvektoren vergleichen)
        const lenA = Math.hypot(cur.E[0], cur.E[1]), lenB = Math.hypot(r.E[0], r.E[1]);
        const dirOk = lenA > 0 && lenB > 0 &&
          Math.abs(cur.E[0]/lenA - r.E[0]/lenB) < 0.02 && Math.abs(cur.E[1]/lenA - r.E[1]/lenB) < 0.02;
        const scale = lenA > 0 ? lenB / lenA : 1;
        if(p && dirOk && Math.abs(p[1]) < 0.25 && p[0] >= cur.ende - 0.15 && p[0] <= cur.ende + 1.6){
          const gap = p[0] - cur.ende;
          if(gap > 0.13){ cur.charMap.push({ gap: true, x: cur.ende, w: gap }); cur.text += ' '; }
          r.lx = p[0]; r.scale = scale;
          for(const c of r.charMap) cur.charMap.push(c.gap ? { gap: true, x: r.lx + c.x*scale, w: c.w*scale }
                                                            : { ...c, x: r.lx + c.x*scale, w: c.w*scale, run: r });
          cur.text += r.text;
          cur.runs.push(r);
          cur.ende = r.lx + r.breite * scale;
          continue;
        }
      }
      r.lx = 0; r.scale = 1;
      cur = { E: r.E, runs: [r], text: r.text, ende: r.breite,
              charMap: r.charMap.map(c => c.gap ? { ...c } : { ...c, run: r }) };
      lines.push(cur);
    }
    return lines;
  }

  /* ================================================================
     5. Suchen: Treffer in den Zeilen einer Seite
     ================================================================ */
  function suche(lines, suchtext, gross){
    const treffer = [];
    const q = suchtext.replace(/\s+/g, ' ').trim();
    if(!q) return treffer;
    for(let li = 0; li < lines.length; li++){
      const L = lines[li];
      const hay = gross ? L.text : L.text.toLowerCase();
      const needle = gross ? q : q.toLowerCase();
      let from = 0;
      for(;;){
        const at = hay.indexOf(needle, from);
        if(at < 0) break;
        from = at + 1;
        const a = L.charMap[at], b = L.charMap[at + needle.length - 1];
        if(!a || !b || a.gap || b.gap) continue;
        if(a.teil !== 0 || !b.letzter) continue;         // mitten in einer Ligatur
        if(!a.run.editable || !b.run.editable) { treffer.push({ li, at, len: needle.length, kaputt: a.run.grund || b.run.grund }); continue; }
        treffer.push({ li, at, len: needle.length, kaputt: '' });
      }
    }
    return treffer;
  }

  /* Anzeige-Rechteck eines Treffers im Seitensystem (vier Ecken) */
  function trefferQuad(line, t){
    const a = line.charMap[t.at], b = line.charMap[t.at + t.len - 1];
    const x0 = a.x, x1 = b.x + b.w;
    const asc = Math.max(...line.runs.map(r => r.asc)), desc = Math.min(...line.runs.map(r => r.desc));
    const E = line.E;
    return [apply(E, x0, desc), apply(E, x1, desc), apply(E, x1, asc), apply(E, x0, asc)];
  }
  function runQuad(run){
    const E = run.E;
    return [apply(E, 0, run.desc), apply(E, run.breite, run.desc), apply(E, run.breite, run.asc), apply(E, 0, run.asc)];
  }

  /* ================================================================
     6. Ersetzen: aus Treffern werden Byte-Änderungen in den Strömen
     ================================================================
     ersetzungen: [{ line, at, len, neu }]  (pro Seite)
     schriften: { hole(run, text) → { art:'original'|'ersatz', bytes(hex-Segmente), breite(em), tfName, ... } } */

  function ersetzeAufSeite(analyse, ersetzungen, ersatz){
    const { streams } = analyse;
    // Splices je Lauf sammeln
    const proRun = new Map();
    const berichte = [];
    for(const e of ersetzungen){
      const L = e.line;
      const a = L.charMap[e.at], b = L.charMap[e.at + e.len - 1];
      const r1 = a.run, r2 = b.run;
      const g1 = a.g.gi, g2 = b.g.gi;                     // Indizes in run.glyphs
      const i1 = L.runs.indexOf(r1), i2 = L.runs.indexOf(r2);
      // alte Breite (Zeilenrahmen) und Spielraum bis zum nächsten unabhängig platzierten Lauf
      const altBreite = (b.x + b.w) - a.x;
      let ende = b.x + b.w;
      let kette = i2;
      while(kette + 1 < L.runs.length && L.runs[kette+1].flowsFromPrev && L.runs[kette+1].btId === r1.btId){ kette++; ende = L.runs[kette].lx + L.runs[kette].breite * L.runs[kette].scale; }
      // fließender Rest hinter dem Treffer (gleicher Lauf oder Kette)
      const restBreite = ende - (b.x + b.w);
      const naechster = L.runs[kette + 1];
      const spielraum = naechster ? Math.max(0, naechster.lx - ende) : Infinity;

      const enc = ersatz.kodiere(r1, e.neu);            // {art, teile:[{hex}|{num}], breiteEm, tf?}
      if(!enc){ berichte.push({ e, ok: false, warum: 'Zeichen lassen sich in keiner verfügbaren Schrift setzen' }); continue; }
      const neuBreite = enc.breiteEm * r1.scale;        // im Zeilenrahmen
      let s = 1;
      if(neuBreite > altBreite + spielraum + 0.02){
        s = Math.max(0.5, (altBreite + spielraum) / neuBreite);
      }
      const eintrag = { g1, g2, enc, s, r1, r2 };
      const push = (r, sp) => { if(!proRun.has(r)) proRun.set(r, []); proRun.get(r).push(sp); };
      if(r1 === r2){
        push(r1, { von: g1, bis: g2, enc, s });
      }else{
        push(r1, { von: g1, bis: Infinity, enc, s });
        for(let k = i1 + 1; k < i2; k++) push(L.runs[k], { von: 0, bis: Infinity, enc: null, s: 1 });
        push(r2, { von: 0, bis: g2, enc: null, s: 1 });
      }
      berichte.push({ e, ok: true, art: enc.art, skaliert: s < 1 ? s : 0, eng: s <= 0.5, ueberlauf: neuBreite > altBreite + spielraum + 0.02 && s <= 0.5 });
    }

    // Byte-Änderungen je Strom — noch nicht angewendet, damit ein XObject, das auf
    // mehreren Seiten liegt, am Ende nur einmal und mit allen Änderungen geschrieben wird
    const aenderungen = [];
    for(const [run, splices] of proRun){
      splices.sort((p, q) => p.von - q.von);
      const neu = baueOp(run, splices);
      const op = streams[run.sIdx].ops[run.oi];
      aenderungen.push({ stream: streams[run.sIdx], start: op.start, end: op.end, text: neu });
    }
    return { aenderungen, berichte };
  }

  /* Änderungen [{start,end,text}] in die Bytes eines Stroms einsetzen */
  function baueBytes(bytes, liste){
    liste = liste.slice().sort((p, q) => p.start - q.start);
    const teile = []; let pos = 0;
    const enc = new TextEncoder();
    for(const ch of liste){
      if(ch.start < pos) continue;   // Überschneidung (Duplikat) — erste gewinnt
      teile.push(bytes.subarray(pos, ch.start));
      teile.push(enc.encode(ch.text));
      pos = ch.end;
    }
    teile.push(bytes.subarray(pos));
    let len = 0; for(const t of teile) len += t.length;
    const out = new Uint8Array(len); let p = 0;
    for(const t of teile){ out.set(t, p); p += t.length; }
    return out;
  }

  /* Einen Textoperator mit Splices neu schreiben.
     splices: [{von, bis (inklusive; Infinity = bis Ende), enc|null, s}] nach von sortiert */
  function baueOp(run, splices){
    const out = [];
    // Vorspann für ' und " (Zeilenvorschub bzw. Abstände) beibehalten
    if(run.op === "'") out.push('T*');
    if(run.op === '"'){ out.push(fmtNum(run.Tw) + ' Tw ' + fmtNum(run.Tc) + ' Tc T*'); }

    const n = run.glyphs.length;
    const owner = new Array(n).fill(-1);
    splices.forEach((sp, idx) => {
      for(let g = sp.von; g <= Math.min(sp.bis, n - 1); g++) if(owner[g] < 0) owner[g] = idx;
    });

    let arr = [];        // laufende TJ-Elemente (Hex-Strings, Zahlen)
    let buf = [];        // Bytes des aktuellen Strings
    const flushStr = () => { if(buf.length){ arr.push(fmtHex(buf)); buf = []; } };
    const flushArr = () => { flushStr(); if(arr.length){ out.push('[' + arr.join(' ') + '] TJ'); arr = []; } };

    for(let gi = 0; gi < n; gi++){
      const g = run.glyphs[gi];
      const o = owner[gi];
      if(o >= 0){
        const sp = splices[o];
        if(gi === sp.von || (gi > 0 && owner[gi-1] !== o)){
          flushArr();
          if(sp.enc) out.push(ersatzOps(run, sp));
        }
        continue;   // Glyphe/Zahl innerhalb des Splices fällt weg
      }
      if('num' in g){ flushStr(); arr.push(fmtNum(g.num)); continue; }
      if(run.bpc === 1) buf.push(g.code); else { buf.push((g.code >> 8) & 255, g.code & 255); }
    }
    flushArr();
    return out.join(' ');
  }

  function ersatzOps(run, sp){
    const { enc, s } = sp;
    if(!enc.teile.length) return '';
    const teile = [];
    if(enc.art === 'ersatz') teile.push(fmtName(enc.tfName) + ' ' + fmtNum(run.size) + ' Tf');
    if(s < 1) teile.push(fmtNum(run.Th * 100 * s) + ' Tz');
    const arr = enc.teile.map(t => 'num' in t ? fmtNum(t.num) : fmtHex(t.bytes));
    teile.push('[' + arr.join(' ') + '] TJ');
    if(s < 1) teile.push(fmtNum(run.Th * 100) + ' Tz');
    if(enc.art === 'ersatz') teile.push(fmtName(run.fontRes) + ' ' + fmtNum(run.size) + ' Tf');
    return teile.join(' ');
  }

  /* ================================================================
     7. Kodierer: neuer Text → Bytes in Originalschrift oder Ersatzschrift
     ================================================================
     fonts: Map loadedName → { map: Map(unicode → {code,w0,sp}), bpc }
     ersatzSchrift(run) → { pdfFont (pdf-lib), tfName } — wird von der Seite bereitgestellt */
  function kodierer(fonts, ersatzSchrift){
    return {
      kodiere(run, text){
        if(text === '') return { art:'leer', teile: [], breiteEm: 0 };
        // 1) Originalschrift, wenn jede Stelle des neuen Textes im Dokument schon vorkam
        const f = fonts.get(run.loaded);
        if(run.editable && f && f.map.size && run.bpc){
          const teile = []; let bytes = []; let breite = 0; let ok = true;
          const flush = () => { if(bytes.length){ teile.push({ bytes }); bytes = []; } };
          let i = 0;
          while(i < text.length){
            let hit = null, len = 0;
            for(let l = Math.min(3, text.length - i); l >= 1; l--){
              const cand = f.map.get(text.substr(i, l));
              if(cand){ hit = cand; len = l; break; }
            }
            if(!hit && text[i] === ' '){
              // Leerzeichen ohne Glyphe: als Vorschub im TJ-Array
              flush(); teile.push({ num: -280 }); breite += 0.28; i++; continue;
            }
            if(!hit){ ok = false; break; }
            if(run.bpc === 1) bytes.push(hit.code & 255); else bytes.push((hit.code >> 8) & 255, hit.code & 255);
            breite += hit.w0 + (run.Tc + (hit.sp ? run.Tw : 0)) / run.size;
            i += len;
          }
          flush();
          if(ok && teile.length) return { art:'original', teile, breiteEm: breite };
        }
        // 2) Ersatzschrift (Standardschrift, WinAnsi)
        const e = ersatzSchrift(run);
        if(!e) return null;
        let hex;
        try{ hex = e.pdfFont.encodeText(text); }
        catch(_){
          // Zeichen außerhalb von WinAnsi: durch „?“ ersetzen, aber melden
          try{ hex = e.pdfFont.encodeText(text.replace(/[^ -ÿ€–—‘’‚“”„•…‰‹›ŒœŠšŸŽžƒˆ˜™]/g, '?')); }
          catch(__){ return null; }
        }
        const bytes = Array.from(hex.asBytes());
        let breite = e.pdfFont.widthOfTextAtSize(text, 1000) / 1000;
        let sp = 0; for(const c of text) if(c === ' ') sp++;
        breite += (text.length * run.Tc + sp * run.Tw) / run.size;
        return { art:'ersatz', teile: [{ bytes }], breiteEm: breite, tfName: e.tfName };
      },
    };
  }

  return { parse, fmt, fmtNum, fmtName, fmtHex, Nm, Str, Op, analysiere, suche, trefferQuad, runQuad, ersetzeAufSeite, baueBytes, kodierer, mul, apply, invert };
})();
