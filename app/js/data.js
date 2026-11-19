// Trophy data: loads app/data/trophies.json (official names, descriptions and
// grades, guides in our own words) and exposes lookups plus the roadmap stages.
export const STAGES = [
  { n: 1, title: 'Play the story', text: 'Chapters 1–4, the opening mission Gone Fishing, the final mission, and the named story missions. These come from playing the main story — no grinding needed.' },
  { n: 2, title: 'Strangers & side strands', text: 'The character strands (Andy, Kenton, Billy, Randy, Tyrone), the 8 stranger strands, and the missable moments that happen along the way. Do the missables on your first pass — see the Missables tab.' },
  { n: 3, title: 'Activities & skills', text: 'Shooting Range golds (42), 250 stunts, drone races at 14 spots, races, fishing, the arcade, hunting, bowling, Combat Focus and the rest of the skill trophies.' },
  { n: 4, title: 'Collectibles & exploration', text: 'Card sets, WAiNK It at 100 spots, 100 vehicles, all 52 areas, 8 garages, Scooter Bros registrations, one illegal operation per gang, and the strange event.' },
  { n: 5, title: 'Partner play & heists', text: 'Everything that needs your partner beside you: losing a 4-star wanted level together, three shop robberies back-to-back, 5 bank vaults and an armored truck.' },
  { n: 6, title: 'Money & clean-up', text: 'Launder $250,000 of marked bills, spend $100,000 in shops, finish 50 challenges and 500 choices, reach 100% completion — and the platinum lands.' },
];

export const KINDS = ['story', 'activities', 'collectibles'];
export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

let cache = null;

export async function loadTrophies() {
  if (cache) return cache;
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('trophies.json failed to load');
  const doc = await res.json();
  cache = doc.trophies;
  return cache;
}

export function byId(trophies, id) {
  return trophies.find((t) => t.id === id) || null;
}

export function missables(trophies) {
  return trophies.filter((t) => t.missable);
}

export function stageTrophies(trophies, n) {
  return trophies.filter((t) => t.stage === n);
}
