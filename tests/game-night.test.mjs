// Run with: node tests/game-night.test.mjs
import assert from 'node:assert/strict';
import { parsePlayers, makeTeams, roundRobin, shuffle, makePicker, randomInt, MAX_PLAYERS } from '../game-night/lib.js';

assert.deepEqual(parsePlayers(' Ana\nben, ANA \n\n Cy ,'), ['Ana', 'ben', 'Cy']);
assert.equal(parsePlayers(Array.from({ length: 100 }, (_, i) => 'p' + i).join('\n')).length, MAX_PLAYERS);

const ten = Array.from({ length: 10 }, (_, i) => 'p' + i);
for (let k = 0; k < 200; k++) {
  const s = shuffle(ten);
  assert.deepEqual([...s].sort(), [...ten].sort());
  const teams = makeTeams(ten, 3);
  assert.deepEqual(teams.map(t => t.length).sort(), [3, 3, 4]);
  assert.deepEqual(teams.flat().sort(), [...ten].sort());
}
assert.equal(makeTeams(['a', 'b'], 5).length, 2, 'never more teams than players');
assert.equal(makeTeams(['a', 'b'], 0).length, 1);

for (const n of [2, 3, 4, 5, 8, 9]) {
  const names = Array.from({ length: n }, (_, i) => 'p' + i);
  const rounds = roundRobin(names);
  const met = new Set();
  for (const round of rounds) {
    const inRound = round.flat().filter(Boolean);
    assert.equal(new Set(inRound).size, inRound.length, 'nobody plays twice in a round');
    for (const [a, b] of round) if (b !== null) met.add([a, b].sort().join('|'));
  }
  assert.equal(met.size, (n * (n - 1)) / 2, `everyone meets everyone once (n=${n})`);
  assert.equal(rounds.length, n % 2 ? n : n - 1);
}
assert.deepEqual(roundRobin(['solo']), []);

const pick = makePicker();
const seen = new Set(Array.from({ length: 5 }, () => pick(['a', 'b', 'c', 'd', 'e'])));
assert.equal(seen.size, 5, 'no repeats until everyone picked');
assert.equal(pick(['x']), 'x', 'removed names leave the bag');

const counts = [0, 0, 0];
for (let i = 0; i < 30000; i++) counts[randomInt(3)]++;
assert.ok(counts.every(c => c > 9000 && c < 11000), 'randomInt is roughly uniform: ' + counts);

console.log('game-night: all tests passed');
