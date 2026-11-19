// Boot + hash routing for Leonida Platinum. Routes: #/tracker (default),
// #/roadmap, #/missables. Filter state lives in `ui` and survives route
// changes; progress state lives in localStorage via store.js.
import { loadTrophies } from './data.js';
import { loadState } from './store.js';
import { renderTracker, renderRoadmap, renderMissables, updateProgress } from './views.js';

const view = document.getElementById('view');
const ui = { query: '', kind: 'all', grade: 'all', hideEarned: false };
const state = loadState();
let trophies = [];

function route() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return ['tracker', 'roadmap', 'missables'].includes(hash) ? hash : 'tracker';
}

function render() {
  const current = route();
  document.querySelectorAll('.tab').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === current);
  });
  if (current === 'roadmap') renderRoadmap(view, trophies, state);
  else if (current === 'missables') renderMissables(view, trophies, state);
  else renderTracker(view, trophies, state, ui);
  updateProgress(state, trophies);
}

async function boot() {
  trophies = await loadTrophies();
  const pill = document.getElementById('missableCount');
  if (pill) pill.textContent = String(trophies.filter((t) => t.missable).length);
  render();
  window.addEventListener('hashchange', render);
}

boot().catch((err) => {
  view.innerHTML = `<p class="empty">The trophy list failed to load: ${err.message}</p>`;
});
