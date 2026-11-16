// Pure logic for the game-night tools. index.html and tests/game-night.test.mjs both import it.

export const MAX_PLAYERS = 64;

/** Unbiased random integer in [0, n), from the browser's crypto source. */
export function randomInt(n) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(2 ** 32 / n) * n; // reject the tail so every value is equally likely
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % n;
}

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle(list, rand = randomInt) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One name per line or comma. Trims, drops blanks and case-insensitive duplicates, caps the count. */
export function parsePlayers(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text).split(/[\n,]/)) {
    const name = raw.trim().slice(0, 40);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length === MAX_PLAYERS) break;
  }
  return out;
}

/** Random teams whose sizes differ by at most one. */
export function makeTeams(players, count, rand = randomInt) {
  const n = Math.max(1, Math.min(Math.floor(count) || 1, players.length));
  const teams = Array.from({ length: n }, () => []);
  shuffle(players, rand).forEach((p, i) => teams[i % n].push(p));
  return teams;
}

/**
 * Round-robin schedule (circle method): everyone meets everyone once.
 * Returns rounds of [a, b] pairs; with an odd count one pair per round is [name, null], meaning that entry sits out.
 */
export function roundRobin(entries) {
  const list = [...entries];
  if (list.length < 2) return [];
  if (list.length % 2) list.push(null);
  const n = list.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      pairs.push(a === null ? [b, null] : [a, b]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop()); // keep the first fixed, rotate the rest
  }
  return rounds;
}

/** Picks without repeats until everyone has had a turn, then starts over. */
export function makePicker(rand = randomInt) {
  let bag = [];
  return players => {
    bag = bag.filter(p => players.includes(p)); // forget names that were removed from the list
    if (!bag.length) bag = shuffle(players, rand);
    return bag.pop();
  };
}
