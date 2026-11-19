// View rendering for tracker, roadmap and missables.
// The checkbox rule that matters: a row click toggles by calling the checkbox's
// own click(), and the change handler updates the row in place — the list is
// never re-rendered by a toggle, so the tick cannot be lost.
import { STAGES, stageTrophies, missables } from './data.js';
import { applyFilters, nextUp } from './filters.js';
import { isEarned, setNote, setSpoiler, exportState, importState, saveState } from './store.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function gradeBadge(t) {
  return `<span class="grade ${t.grade}">${t.grade}</span>`;
}

function isMasked(t, state) {
  return state.spoiler && !isEarned(state, t.id) && (t.kind === 'story' || t.grade === 'platinum');
}

export function updateProgress(state, trophies) {
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  if (!fill || !text) return;
  const n = state.earned.length;
  fill.style.width = `${Math.round((n / trophies.length) * 100)}%`;
  text.textContent = `${n} of ${trophies.length} earned`;
}

function trophyCard(t, state) {
  const earned = isEarned(state, t.id);
  const hide = isMasked(t, state);
  const name = hide ? 'Hidden story trophy' : esc(t.name);
  const desc = hide
    ? '<span class="masked">Hidden until earned — spoiler setting is on.</span>'
    : esc(t.description);
  const guide = hide ? '' : `<p class="guide">${esc(t.guide)}</p>`;
  const note = esc(state.notes[t.id] || '');
  return `<article class="trophy${earned ? ' earned' : ''}" data-id="${t.id}">
    <div class="row" data-action="toggle">
      <input type="checkbox"${earned ? ' checked' : ''} aria-label="Earned: ${esc(t.name)}">
      <div class="body">
        <h3>${name}${gradeBadge(t)}</h3>
        <p class="desc">${desc}</p>
        ${guide}
        <p class="meta"><span>Kind: ${t.kind}</span><span>Stage ${t.stage}</span>${t.missable ? '<span class="missable-flag">⚠ Missable</span>' : ''}</p>
        <details><summary>Your note</summary>
          <textarea data-note="${t.id}" placeholder="Your own note for this trophy…" aria-label="Note for ${esc(t.name)}">${note}</textarea>
        </details>
      </div>
    </div>
  </article>`;
}

function controlsHtml(ui, state) {
  const chip = (value, label) =>
    `<button type="button" class="chip" data-kind="${value}" aria-pressed="${ui.kind === value}">${label}</button>`;
  return `<div class="controls">
    <input type="search" id="search" placeholder="Search name, description or guide…" value="${esc(ui.query)}" aria-label="Search trophies">
    ${chip('all', 'All')}
    ${chip('story', 'Story')}
    ${chip('missable', 'Missable')}
    ${chip('collectibles', 'Collectibles')}
    ${chip('activities', 'Activities')}
    <label>Grade <select id="gradeFilter" aria-label="Filter by grade">
      <option value="all"${ui.grade === 'all' ? ' selected' : ''}>All grades</option>
      <option value="platinum"${ui.grade === 'platinum' ? ' selected' : ''}>Platinum</option>
      <option value="gold"${ui.grade === 'gold' ? ' selected' : ''}>Gold</option>
      <option value="silver"${ui.grade === 'silver' ? ' selected' : ''}>Silver</option>
      <option value="bronze"${ui.grade === 'bronze' ? ' selected' : ''}>Bronze</option>
    </select></label>
    <label class="check"><input type="checkbox" id="hideEarned"${ui.hideEarned ? ' checked' : ''}> Hide earned</label>
    <label class="check"><input type="checkbox" id="spoilerToggle"${state.spoiler ? ' checked' : ''}> Spoiler-free</label>
    <button type="button" class="btn" id="exportBtn">Export progress</button>
    <label class="btn">Import progress <input type="file" id="importFile" accept="application/json" hidden></label>
  </div>`;
}

function nextUpHtml(trophies, state) {
  const up = nextUp(trophies, state, 5);
  if (up.length === 0) return `<section class="nextup"><h2>Next up</h2><p>All 55 earned — platinum is yours.</p></section>`;
  return `<section class="nextup"><h2>Next up</h2><ol>${up.map((t) => {
    if (state.spoiler && (t.kind === 'story' || t.grade === 'platinum')) {
      return `<li><strong>Hidden story trophy</strong> <span class="meta">(Stage ${t.stage})</span></li>`;
    }
    return `<li><strong>${esc(t.name)}</strong> — ${esc(t.description)} <span class="meta">(Stage ${t.stage})</span></li>`;
  }).join('')}</ol></section>`;
}

export function renderTracker(el, trophies, state, ui) {
  el.innerHTML = `${controlsHtml(ui, state)}<div id="nextUp">${nextUpHtml(trophies, state)}</div><div id="trophyList"></div>`;

  function renderList() {
    const list = el.querySelector('#trophyList');
    if (!list) return;
    const shown = applyFilters(trophies, {
      query: ui.query, kind: ui.kind, grade: ui.grade,
      hideEarned: ui.hideEarned, earned: state.earned,
    });
    list.innerHTML = shown.length === 0
      ? '<p class="empty">No trophies match these filters.</p>'
      : shown.map((t) => trophyCard(t, state)).join('');
  }
  renderList();

  el.querySelector('#search').addEventListener('input', (e) => { ui.query = e.target.value; renderList(); });
  el.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
    ui.kind = b.dataset.kind;
    el.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    renderList();
  }));
  el.querySelector('#gradeFilter').addEventListener('change', (e) => { ui.grade = e.target.value; renderList(); });
  el.querySelector('#hideEarned').addEventListener('change', (e) => { ui.hideEarned = e.target.checked; renderList(); });
  el.querySelector('#spoilerToggle').addEventListener('change', (e) => {
    setSpoiler(state, e.target.checked);
    renderList();
    const next = el.querySelector('#nextUp');
    if (next) next.innerHTML = nextUpHtml(trophies, state);
  });
  el.querySelector('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-platinum-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  el.querySelector('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const nextState = importState(await file.text());
      state.earned = nextState.earned;
      state.notes = nextState.notes;
      state.spoiler = nextState.spoiler;
      el.querySelector('#spoilerToggle').checked = state.spoiler;
      renderList();
      const next = el.querySelector('#nextUp');
      if (next) next.innerHTML = nextUpHtml(trophies, state);
      updateProgress(state, trophies);
    } catch {
      alert('That file is not a Leonida Platinum export.');
    }
    e.target.value = '';
  });

  // Delegated handlers are attached ONCE to #view (it survives re-renders);
  // every handler re-queries the live DOM, so no stale closures. Row clicks
  // toggle by calling the checkbox's own click(); the change handler updates
  // state and the row in place (no list re-render, no lost tick).
  if (!el.dataset.trackerWired) {
    el.dataset.trackerWired = '1';
    el.addEventListener('click', (e) => {
      if (e.target.closest('input, button, a, textarea, summary, select, label')) return;
      const row = e.target.closest('.row');
      if (!row) return;
      const box = row.querySelector('input[type="checkbox"]');
      if (box) box.click();
    });
    el.addEventListener('change', (e) => {
      const box = e.target.closest('input[type="checkbox"]');
      if (!box) return;
      const card = box.closest('.trophy');
      if (!card) return;
      const id = Number(card.dataset.id);
      if (box.checked) {
        if (!state.earned.includes(id)) state.earned.push(id);
      } else {
        state.earned = state.earned.filter((n) => n !== id);
      }
      saveState(state);
      card.classList.toggle('earned', box.checked);
      updateProgress(state, trophies);
      const next = el.querySelector('#nextUp');
      if (next) next.innerHTML = nextUpHtml(trophies, state);
    });
    el.addEventListener('input', (e) => {
      const ta = e.target.closest('textarea[data-note]');
      if (!ta) return;
      setNote(state, Number(ta.dataset.note), ta.value);
    });
  }
}

export function renderRoadmap(el, trophies, state) {
  el.innerHTML = STAGES.map((s) => {
    const list = stageTrophies(trophies, s.n);
    const done = list.filter((t) => isEarned(state, t.id)).length;
    return `<section class="stage"><h2><span class="n">${s.n}</span>${esc(s.title)} <span class="meta">— ${done}/${list.length} earned</span></h2>
      <p>${esc(s.text)}</p>
      <ul>${list.map((t) => `<li class="${isEarned(state, t.id) ? 'done' : ''}">${isEarned(state, t.id) ? '✓' : '○'} ${esc(t.name)} ${gradeBadge(t)}</li>`).join('')}</ul>
    </section>`;
  }).join('');
}

export function renderMissables(el, trophies, state) {
  const list = missables(trophies);
  const done = list.filter((t) => isEarned(state, t.id)).length;
  el.innerHTML = `<div class="warnbox"><p><strong>7 missables — do these on your first pass.</strong> ${done} of 7 earned.</p>
    <p>Each flag below is our reading of the official description's wording. The game released 2026-11-19, so the exact trigger for each is unconfirmed — the guide says so on every card. When in doubt, do the thing the first time the chance appears.</p></div>`
    + list.map((t) => {
      const earned = isEarned(state, t.id);
      const hide = isMasked(t, state);
      return `<article class="miss-card" data-id="${t.id}"><h2>${hide ? 'Hidden story trophy' : esc(t.name)} ${gradeBadge(t)}</h2>
        <p>${hide ? '<span class="masked">Hidden until earned — spoiler setting is on.</span>' : esc(t.description)}</p>
        ${hide ? '' : `<p>${esc(t.guide)}</p>`}
        <p class="meta"><span>${earned ? '✓ Earned' : '○ Not earned yet'}</span><span>Stage ${t.stage}</span></p>
      </article>`;
    }).join('');
}
