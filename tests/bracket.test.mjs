// Run with: node tests/bracket.test.mjs
import assert from 'node:assert/strict';
import { bracketSize, seedOrder, buildBracket, cleanPicks, bracketText, roundName } from '../bracket/bracket.js';

assert.equal(bracketSize(2), 2);
assert.equal(bracketSize(3), 4);
assert.equal(bracketSize(8), 8);
assert.equal(bracketSize(9), 16);
assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);

for (const size of [2, 4, 8, 16, 32, 64]) {
  const o = seedOrder(size);
  assert.deepEqual([...o].sort((x, y) => x - y), Array.from({ length: size }, (_, i) => i + 1), 'every seed once');
  for (let i = 0; i < size; i += 2) assert.equal(o[i] + o[i + 1], size + 1, 'first-round pairs add up');
  // Seeds 1 and 2 sit in opposite halves, so they only meet in the final.
  assert.ok(o.indexOf(1) < size / 2 && o.indexOf(2) >= size / 2);
}

const names = n => Array.from({ length: n }, (_, i) => 'p' + (i + 1));

// Byes never meet each other, and top seeds get them.
for (let n = 2; n <= 64; n++) {
  const { rounds } = buildBracket(names(n));
  const first = rounds[0];
  assert.ok(first.every(m => m.a !== null || m.b !== null), `no empty first-round match (n=${n})`);
  const byes = first.filter(m => m.bye).map(m => m.winner);
  assert.equal(byes.length, bracketSize(n) - n);
  assert.deepEqual(byes.sort(), names(bracketSize(n) - n).sort(), 'top seeds get the byes');
  assert.equal(rounds.length, Math.log2(bracketSize(n)));
}

// Play a 5-player bracket all the way through: higher seed always wins.
const five = names(5);
let picks = {};
for (let guard = 0; guard < 20; guard++) {
  const { rounds, champion } = buildBracket(five, picks);
  if (champion) break;
  const open = rounds.flatMap((ms, r) => ms.map((m, i) => ({ m, key: `${r}:${i}` })))
    .find(({ m }) => !m.bye && m.a !== null && m.b !== null && m.winner === null);
  picks[open.key] = Number(open.m.a.slice(1)) < Number(open.m.b.slice(1)) ? open.m.a : open.m.b;
}
assert.equal(buildBracket(five, picks).champion, 'p1');

// Changing an early result drops the later results that depended on it.
const four = names(4); // round 1: p1 v p4, p2 v p3
picks = { '0:0': 'p1', '0:1': 'p2', '1:0': 'p1' };
assert.equal(buildBracket(four, picks).champion, 'p1');
picks['0:0'] = 'p4';
const after = buildBracket(four, picks);
assert.equal(after.champion, null, 'final cleared because p1 is no longer in it');
assert.deepEqual(cleanPicks(four, picks), { '0:0': 'p4', '0:1': 'p2' });

// Picks for names not in the match are ignored (stale saved state).
assert.equal(buildBracket(four, { '0:0': 'zed' }).rounds[0][0].winner, null);

assert.equal(roundName(0, 3), 'Quarterfinals');
assert.equal(roundName(2, 3), 'Final');
assert.equal(roundName(0, 5), 'Round 1');
const text = bracketText(names(3), { '0:1': 'p2' });
assert.match(text, /p1 \(bye\)/);
assert.match(text, /p2 ✓ vs p3/);
assert.match(text, /Final\n  p1 vs p2/);

console.log('bracket tests passed');
