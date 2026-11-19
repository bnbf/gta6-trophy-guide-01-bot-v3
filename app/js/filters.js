// Filtering and Next-up ordering for the tracker.
export function applyFilters(trophies, opts) {
  const q = (opts.query || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (opts.kind && opts.kind !== 'all' && opts.kind !== 'missable' && t.kind !== opts.kind) return false;
    if (opts.kind === 'missable' && !t.missable) return false;
    if (opts.grade && opts.grade !== 'all' && t.grade !== opts.grade) return false;
    if (opts.hideEarned && opts.earned.includes(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// Next up: earliest unearned trophies in roadmap order (stage, then id).
export function nextUp(trophies, state, count = 5) {
  return trophies
    .filter((t) => !state.earned.includes(t.id))
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id))
    .slice(0, count);
}
