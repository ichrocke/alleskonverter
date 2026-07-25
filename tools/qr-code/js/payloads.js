// QR-Typ-Definitionen: Formularfelder, Payload-Erzeugung, Validierung.

const escWifi = (s) => s.replace(/([\\;,:"])/g, '\\$1');
const escVcard = (s) => s.replace(/\\/g, '\\\\').replace(/([;,])/g, '\\$1').replace(/\r?\n/g, '\\n');
const escIcal = escVcard;

function toIcalUtc(localValue) {
  // datetime-local ("2026-07-21T14:30") → "20260721T123000Z"
  const d = new Date(localValue);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function validIban(raw) {
  const iban = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (let i = 0; i < digits.length; i += 7) {
    rem = Number(String(rem) + digits.slice(i, i + 7)) % 97;
  }
  return rem === 1;
}

const req = (v) => v != null && String(v).trim() !== '';

export const TYPES = [
  {
    id: 'url',
    label: 'Link',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    fields: [
      { key: 'url', label: 'Webadresse', type: 'url', placeholder: 'https://beispiel.de', required: true },
    ],
    validate(d) {
      const e = {};
      if (!req(d.url)) e.url = 'Bitte eine Webadresse eingeben.';
      else if (!/^(https?:\/\/|www\.)?[^\s]+\.[^\s]{2,}/i.test(d.url.trim())) e.url = 'Das sieht nicht nach einer gültigen Adresse aus.';
      return e;
    },
    build(d) {
      let u = d.url.trim();
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
      return u;
    },
    summary: (d) => d.url.trim(),
  },
  {
    id: 'text',
    label: 'Text',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2M12 5v14m-3 0h6"/></svg>',
    fields: [
      { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Beliebiger Text …', required: true, rows: 4 },
    ],
    validate: (d) => (req(d.text) ? {} : { text: 'Bitte einen Text eingeben.' }),
    build: (d) => d.text,
    summary: (d) => d.text.slice(0, 40),
  },
  {
    id: 'wifi',
    label: 'WLAN',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5a10 10 0 0 1 14 0M8.5 15.5a5.5 5.5 0 0 1 7 0M2 9.5a14.5 14.5 0 0 1 20 0"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>',
    fields: [
      { key: 'ssid', label: 'Netzwerkname (SSID)', type: 'text', placeholder: 'MeinWLAN', required: true },
      { key: 'password', label: 'Passwort', type: 'text', placeholder: '' },
      { key: 'security', label: 'Verschlüsselung', type: 'select', default: 'WPA', options: [
        { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
        { value: 'WEP', label: 'WEP' },
        { value: 'nopass', label: 'Offen (kein Passwort)' },
      ]},
      { key: 'hidden', label: 'Verstecktes Netzwerk', type: 'checkbox' },
    ],
    validate(d) {
      const e = {};
      if (!req(d.ssid)) e.ssid = 'Bitte den Netzwerknamen eingeben.';
      if (d.security !== 'nopass' && !req(d.password)) e.password = 'Passwort fehlt (oder „Offen“ wählen).';
      return e;
    },
    build(d) {
      const t = d.security === 'nopass' ? 'nopass' : d.security;
      let s = `WIFI:T:${t};S:${escWifi(d.ssid)};`;
      if (t !== 'nopass') s += `P:${escWifi(d.password)};`;
      if (d.hidden) s += 'H:true;';
      return s + ';';
    },
    summary: (d) => `WLAN „${d.ssid}“`,
  },
  {
    id: 'vcard',
    label: 'Kontakt',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
    fields: [
      { key: 'firstName', label: 'Vorname', type: 'text', required: true, half: true },
      { key: 'lastName', label: 'Nachname', type: 'text', half: true },
      { key: 'org', label: 'Firma', type: 'text', half: true },
      { key: 'title', label: 'Position', type: 'text', half: true },
      { key: 'phone', label: 'Telefon (mobil)', type: 'tel', half: true },
      { key: 'phoneWork', label: 'Telefon (Arbeit)', type: 'tel', half: true },
      { key: 'email', label: 'E-Mail', type: 'email' },
      { key: 'website', label: 'Website', type: 'url' },
      { key: 'street', label: 'Straße & Nr.', type: 'text' },
      { key: 'zip', label: 'PLZ', type: 'text', half: true },
      { key: 'city', label: 'Ort', type: 'text', half: true },
      { key: 'country', label: 'Land', type: 'text' },
    ],
    validate: (d) => (req(d.firstName) || req(d.lastName) ? {} : { firstName: 'Mindestens einen Namen angeben.' }),
    build(d) {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      lines.push(`N:${escVcard(d.lastName || '')};${escVcard(d.firstName || '')};;;`);
      lines.push(`FN:${escVcard([d.firstName, d.lastName].filter(req).join(' '))}`);
      if (req(d.org)) lines.push(`ORG:${escVcard(d.org)}`);
      if (req(d.title)) lines.push(`TITLE:${escVcard(d.title)}`);
      if (req(d.phone)) lines.push(`TEL;TYPE=CELL:${d.phone.trim()}`);
      if (req(d.phoneWork)) lines.push(`TEL;TYPE=WORK:${d.phoneWork.trim()}`);
      if (req(d.email)) lines.push(`EMAIL:${d.email.trim()}`);
      if (req(d.website)) lines.push(`URL:${d.website.trim()}`);
      if ([d.street, d.zip, d.city, d.country].some(req)) {
        lines.push(`ADR;TYPE=HOME:;;${escVcard(d.street || '')};${escVcard(d.city || '')};;${escVcard(d.zip || '')};${escVcard(d.country || '')}`);
      }
      lines.push('END:VCARD');
      return lines.join('\n');
    },
    summary: (d) => `Kontakt ${[d.firstName, d.lastName].filter(req).join(' ')}`,
  },
  {
    id: 'email',
    label: 'E-Mail',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    fields: [
      { key: 'to', label: 'Empfänger', type: 'email', placeholder: 'name@beispiel.de', required: true },
      { key: 'subject', label: 'Betreff', type: 'text' },
      { key: 'body', label: 'Nachricht', type: 'textarea', rows: 3 },
    ],
    validate(d) {
      const e = {};
      if (!req(d.to)) e.to = 'Bitte eine Empfänger-Adresse eingeben.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.to.trim())) e.to = 'Ungültige E-Mail-Adresse.';
      return e;
    },
    build(d) {
      const p = new URLSearchParams();
      if (req(d.subject)) p.set('subject', d.subject);
      if (req(d.body)) p.set('body', d.body);
      const q = p.toString().replace(/\+/g, '%20');
      return `mailto:${d.to.trim()}${q ? '?' + q : ''}`;
    },
    summary: (d) => `E-Mail an ${d.to.trim()}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2.5-2.7A8 8 0 1 1 21 12Z"/></svg>',
    fields: [
      { key: 'phone', label: 'Telefonnummer', type: 'tel', placeholder: '+49 170 1234567', required: true },
      { key: 'message', label: 'Nachricht', type: 'textarea', rows: 3 },
    ],
    validate: (d) => (req(d.phone) ? {} : { phone: 'Bitte eine Telefonnummer eingeben.' }),
    build(d) {
      const num = d.phone.replace(/[^\d+]/g, '');
      return `SMSTO:${num}:${d.message || ''}`;
    },
    summary: (d) => `SMS an ${d.phone.trim()}`,
  },
  {
    id: 'tel',
    label: 'Anruf',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z"/></svg>',
    fields: [
      { key: 'phone', label: 'Telefonnummer', type: 'tel', placeholder: '+49 30 1234567', required: true },
    ],
    validate: (d) => (req(d.phone) ? {} : { phone: 'Bitte eine Telefonnummer eingeben.' }),
    build: (d) => `tel:${d.phone.replace(/[^\d+]/g, '')}`,
    summary: (d) => `Anruf ${d.phone.trim()}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.4-4.1A8.5 8.5 0 1 1 8 19.6L3 21Z"/><path d="M9 9.5c.5 2.5 3 5 5.5 5.5l1-1.5 2 1c-.5 1.5-1.5 2-3 1.5-3-1-6-4-7-7-.5-1.5 0-2.5 1.5-3l1 2-1 1.5Z" fill="currentColor" stroke="none" opacity=".9"/></svg>',
    fields: [
      { key: 'phone', label: 'Nummer (mit Ländervorwahl)', type: 'tel', placeholder: '+49 170 1234567', required: true },
      { key: 'message', label: 'Vorausgefüllte Nachricht', type: 'textarea', rows: 3 },
    ],
    validate(d) {
      const e = {};
      if (!req(d.phone)) e.phone = 'Bitte eine Nummer eingeben.';
      else if (!/^\+?\d[\d\s\-()]{5,}$/.test(d.phone.trim())) e.phone = 'Ungültige Nummer.';
      return e;
    },
    build(d) {
      const num = d.phone.replace(/\D/g, '');
      const msg = req(d.message) ? `?text=${encodeURIComponent(d.message)}` : '';
      return `https://wa.me/${num}${msg}`;
    },
    summary: (d) => `WhatsApp ${d.phone.trim()}`,
  },
  {
    id: 'geo',
    label: 'Standort',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    fields: [
      { key: 'lat', label: 'Breitengrad', type: 'text', placeholder: '52.520008', required: true, half: true },
      { key: 'lng', label: 'Längengrad', type: 'text', placeholder: '13.404954', required: true, half: true },
      { key: 'mode', label: 'Format', type: 'select', default: 'geo', options: [
        { value: 'geo', label: 'geo:-Link (öffnet Karten-App)' },
        { value: 'gmaps', label: 'Google-Maps-Link' },
      ]},
    ],
    validate(d) {
      const e = {};
      const lat = parseFloat(String(d.lat).replace(',', '.'));
      const lng = parseFloat(String(d.lng).replace(',', '.'));
      if (isNaN(lat) || lat < -90 || lat > 90) e.lat = 'Breitengrad zwischen -90 und 90.';
      if (isNaN(lng) || lng < -180 || lng > 180) e.lng = 'Längengrad zwischen -180 und 180.';
      return e;
    },
    build(d) {
      const lat = parseFloat(String(d.lat).replace(',', '.'));
      const lng = parseFloat(String(d.lng).replace(',', '.'));
      return d.mode === 'gmaps'
        ? `https://maps.google.com/?q=${lat},${lng}`
        : `geo:${lat},${lng}`;
    },
    summary: (d) => `Standort ${d.lat}, ${d.lng}`,
  },
  {
    id: 'event',
    label: 'Termin',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4m8-4v4M3 9h18"/></svg>',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'Sommerfest', required: true },
      { key: 'location', label: 'Ort', type: 'text' },
      { key: 'start', label: 'Beginn', type: 'datetime-local', required: true, half: true },
      { key: 'end', label: 'Ende', type: 'datetime-local', half: true },
      { key: 'description', label: 'Beschreibung', type: 'textarea', rows: 2 },
    ],
    validate(d) {
      const e = {};
      if (!req(d.title)) e.title = 'Bitte einen Titel eingeben.';
      if (!req(d.start)) e.start = 'Bitte einen Beginn wählen.';
      if (req(d.start) && req(d.end) && new Date(d.end) <= new Date(d.start)) e.end = 'Ende muss nach dem Beginn liegen.';
      return e;
    },
    build(d) {
      const lines = ['BEGIN:VEVENT'];
      lines.push(`SUMMARY:${escIcal(d.title)}`);
      if (req(d.location)) lines.push(`LOCATION:${escIcal(d.location)}`);
      lines.push(`DTSTART:${toIcalUtc(d.start)}`);
      if (req(d.end)) lines.push(`DTEND:${toIcalUtc(d.end)}`);
      if (req(d.description)) lines.push(`DESCRIPTION:${escIcal(d.description)}`);
      lines.push('END:VEVENT');
      return lines.join('\n');
    },
    summary: (d) => `Termin „${d.title}“`,
  },
  {
    id: 'girocode',
    label: 'GiroCode',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.5 6.5A7.5 7.5 0 1 0 18.5 17.5M4 10.5h9M4 13.5h9"/></svg>',
    fields: [
      { key: 'name', label: 'Empfänger', type: 'text', placeholder: 'Max Mustermann', required: true },
      { key: 'iban', label: 'IBAN', type: 'text', placeholder: 'DE89 3704 0044 0532 0130 00', required: true },
      { key: 'bic', label: 'BIC (optional)', type: 'text' },
      { key: 'amount', label: 'Betrag in € (optional)', type: 'text', placeholder: '12,50', half: true },
      { key: 'reference', label: 'Verwendungszweck', type: 'text', half: true },
    ],
    validate(d) {
      const e = {};
      if (!req(d.name)) e.name = 'Bitte den Empfänger eingeben.';
      if (!req(d.iban)) e.iban = 'Bitte die IBAN eingeben.';
      else if (!validIban(d.iban)) e.iban = 'IBAN-Prüfung fehlgeschlagen — bitte kontrollieren.';
      if (req(d.amount)) {
        const a = parseFloat(String(d.amount).replace(',', '.'));
        if (isNaN(a) || a < 0.01 || a > 999999999.99) e.amount = 'Betrag zwischen 0,01 und 999.999.999,99.';
      }
      return e;
    },
    build(d) {
      const amount = req(d.amount)
        ? 'EUR' + parseFloat(String(d.amount).replace(',', '.')).toFixed(2)
        : '';
      return [
        'BCD', '002', '1', 'SCT',
        (d.bic || '').replace(/\s+/g, '').toUpperCase(),
        d.name.trim().slice(0, 70),
        d.iban.replace(/\s+/g, '').toUpperCase(),
        amount,
        '', '',
        (d.reference || '').trim().slice(0, 140),
      ].join('\n');
    },
    summary: (d) => `GiroCode an ${d.name}${req(d.amount) ? ` (${d.amount} €)` : ''}`,
  },
  {
    id: 'crypto',
    label: 'Bitcoin',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 7.5h4a2 2 0 0 1 0 4h-4Zm0 4h4.5a2 2 0 0 1 0 4H9.5ZM10.5 6v1.5m3-1.5v1.5m-3 10V19m3-1.5V19"/></svg>',
    fields: [
      { key: 'address', label: 'Bitcoin-Adresse', type: 'text', placeholder: 'bc1q…', required: true },
      { key: 'amount', label: 'Betrag in BTC (optional)', type: 'text', placeholder: '0.001', half: true },
      { key: 'label', label: 'Label (optional)', type: 'text', half: true },
    ],
    validate(d) {
      const e = {};
      if (!req(d.address)) e.address = 'Bitte eine Adresse eingeben.';
      else if (!/^[a-zA-Z0-9]{25,90}$/.test(d.address.trim())) e.address = 'Ungültige Adresse.';
      if (req(d.amount) && isNaN(parseFloat(String(d.amount).replace(',', '.')))) e.amount = 'Ungültiger Betrag.';
      return e;
    },
    build(d) {
      const p = new URLSearchParams();
      if (req(d.amount)) p.set('amount', String(d.amount).replace(',', '.'));
      if (req(d.label)) p.set('label', d.label);
      const q = p.toString();
      return `bitcoin:${d.address.trim()}${q ? '?' + q : ''}`;
    },
    summary: (d) => `Bitcoin ${d.address.trim().slice(0, 14)}…`,
  },
];

export const typeById = (id) => TYPES.find((t) => t.id === id);
