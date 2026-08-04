/* Erzeugt das JSON-LD der FAQ-Seite aus dem sichtbaren Seitentext neu.
   Damit können Markup und Anzeige nicht auseinanderlaufen — nach jeder
   Textänderung an faq.html einmal ausführen: node tests/faq-jsonld.js */
const fs = require('fs');
const path = require('path');

const DATEI = path.resolve(__dirname, '..', 'faq.html');
let html = fs.readFileSync(DATEI, 'utf8');

function textAus(schnipsel){
  return schnipsel
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const fragen = [];
const muster = /<details class="frage">\s*<summary>([\s\S]*?)<\/summary>\s*<div class="antwort">([\s\S]*?)<\/div>\s*<\/details>/g;
let m;
while((m = muster.exec(html))){
  fragen.push({
    '@type': 'Question',
    name: textAus(m[1]),
    acceptedAnswer: { '@type': 'Answer', text: textAus(m[2]) },
  });
}
if(!fragen.length){ console.error('Keine Fragen gefunden — Aufbau der Seite geändert?'); process.exit(1); }

const ldMuster = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const alt = html.match(ldMuster);
if(!alt){ console.error('Kein JSON-LD-Block gefunden.'); process.exit(1); }

const daten = JSON.parse(alt[1]);
const faqKnoten = (daten['@graph'] || [daten]).find(k => k['@type'] === 'FAQPage');
if(!faqKnoten){ console.error('Kein FAQPage-Knoten im JSON-LD.'); process.exit(1); }
faqKnoten.mainEntity = fragen;

html = html.replace(ldMuster, '<script type="application/ld+json">' + JSON.stringify(daten) + '</script>');
fs.writeFileSync(DATEI, html);
console.log(`JSON-LD neu erzeugt: ${fragen.length} Fragen.`);
