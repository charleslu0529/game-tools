// Pure logic for the bracket maker. bracket/index.html and tests/bracket.test.mjs both import it.

/** Smallest power of two that fits n entries (at least 2). */
export function bracketSize(n) {
  let s = 2;
  while (s < n) s *= 2;
  return s;
}

/** Standard seed order for a bracket of `size` slots: 1 v size, and seeds 1 and 2 can only meet in the final. */
export function seedOrder(size) {
  let order = [1];
  while (order.length < size) {
    const len = order.length * 2;
    order = order.flatMap(s => [s, len + 1 - s]);
  }
  return order;
}

/**
 * Builds the whole bracket from seeded entries (first = top seed) and the winners picked so far.
 * picks maps "round:match" to a winner's name; a pick that doesn't match either side is ignored,
 * so changing an early result clears the later ones that depended on it.
 * In round 1 a missing opponent is a bye and the other side goes through automatically.
 * Returns { rounds: [[{ a, b, winner, bye }]], champion }.
 */
export function buildBracket(entries, picks = {}) {
  const size = bracketSize(entries.length);
  let slots = seedOrder(size).map(s => entries[s - 1] ?? null);
  const rounds = [];
  for (let r = 0; slots.length > 1; r++) {
    const matches = [];
    for (let i = 0; i < slots.length; i += 2) {
      const a = slots[i], b = slots[i + 1];
      const bye = r === 0 && (a === null) !== (b === null);
      const pick = picks[`${r}:${i / 2}`];
      const winner = bye ? (a ?? b) : (a !== null && b !== null && (pick === a || pick === b) ? pick : null);
      matches.push({ a, b, winner, bye });
    }
    rounds.push(matches);
    slots = matches.map(m => m.winner);
  }
  return { rounds, champion: slots[0] ?? null };
}

/** Drops picks that no longer apply, so saved state stays small and honest. */
export function cleanPicks(entries, picks) {
  const { rounds } = buildBracket(entries, picks);
  const out = {};
  rounds.forEach((ms, r) => ms.forEach((m, i) => { if (!m.bye && m.winner !== null) out[`${r}:${i}`] = m.winner; }));
  return out;
}

export function roundName(r, total) {
  const left = total - r;
  if (left === 1) return 'Final';
  if (left === 2) return 'Semifinals';
  if (left === 3) return 'Quarterfinals';
  return `Round ${r + 1}`;
}

/** Plain-text version for pasting into a group chat. */
export function bracketText(entries, picks) {
  const { rounds, champion } = buildBracket(entries, picks);
  const lines = [];
  rounds.forEach((ms, r) => {
    lines.push(roundName(r, rounds.length));
    for (const m of ms) {
      if (m.bye) { lines.push(`  ${m.winner} (bye)`); continue; }
      const side = x => x === null ? 'TBD' : (m.winner === x ? `${x} ✓` : x);
      lines.push(`  ${side(m.a)} vs ${side(m.b)}`);
    }
  });
  if (champion) lines.push(`Champion: ${champion}`);
  return lines.join('\n');
}
