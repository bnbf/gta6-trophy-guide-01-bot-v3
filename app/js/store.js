// Progress state in localStorage: earned trophy ids, per-trophy notes, spoiler
// setting. Export/import moves the whole state as one JSON file.
const KEY = 'leonida-platinum-v3';

function blank() {
  return { earned: [], notes: {}, spoiler: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blank();
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => Number.isInteger(n)) : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoiler: parsed.spoiler === true,
    };
  } catch {
    return blank();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable: progress lives only in memory this session
  }
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  const i = state.earned.indexOf(id);
  if (i === -1) state.earned.push(id);
  else state.earned.splice(i, 1);
  saveState(state);
  return state;
}

export function setNote(state, id, text) {
  if (text.trim() === '') delete state.notes[id];
  else state.notes[id] = text;
  saveState(state);
}

export function setSpoiler(state, on) {
  state.spoiler = on;
  saveState(state);
}

export function exportState(state) {
  return JSON.stringify({ app: 'leonida-platinum', version: 3, ...state }, null, 2);
}

export function importState(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
  if (!Array.isArray(parsed.earned)) throw new Error('no earned list');
  const next = blank();
  next.earned = parsed.earned.filter((n) => Number.isInteger(n));
  next.notes = parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};
  next.spoiler = parsed.spoiler === true;
  saveState(next);
  return next;
}
