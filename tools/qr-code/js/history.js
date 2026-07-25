// Verlauf der erstellten Codes in localStorage.

const KEY = 'qrstudio.history.v1';
const MAX_ENTRIES = 20;
const MAX_LOGO_BYTES = 150_000;

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Speicher voll → älteste Einträge opfern
    if (list.length > 1) persist(list.slice(0, Math.floor(list.length / 2)));
  }
}

export function addHistoryEntry({ typeId, label, data, design }) {
  const list = loadHistory();
  const slimDesign = { ...design };
  if (slimDesign.logo && slimDesign.logo.length > MAX_LOGO_BYTES) slimDesign.logo = null;
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    typeId,
    label,
    data,
    design: slimDesign,
  };
  // Duplikate (gleicher Typ + gleiche Daten) ersetzen statt stapeln
  const filtered = list.filter((e) => !(e.typeId === typeId && JSON.stringify(e.data) === JSON.stringify(data)));
  filtered.unshift(entry);
  persist(filtered.slice(0, MAX_ENTRIES));
  return entry;
}

export function removeHistoryEntry(id) {
  persist(loadHistory().filter((e) => e.id !== id));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
