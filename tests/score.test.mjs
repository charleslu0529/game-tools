// Run with: node tests/score.test.mjs
import assert from 'node:assert/strict';
import { newGame, parseScore, setScore, addRound, removeLastRound, totals, standings, validGame, standingsText, MAX_ROUNDS } from '../score/score.js';

assert.equal(parseScore('12'), 12);
assert.equal(parseScore(' -3 '), -3);
assert.equal(parseScore('2.5'), 2.5);
assert.equal(parseScore('abc'), 0);
assert.equal(parseScore(''), 0);
assert.equal(parseScore('1e9'), 1e6);
assert.equal(parseScore('0.1') + parseScore('0.2'), 0.30000000000000004); // raw add, but totals round:

let g = newGame(['Ana', 'Ben', 'Cy']);
assert.deepEqual(g.rounds, [[0, 0, 0]]);
g = setScore(g, 0, 0, '0.1');
g = addRound(g);
g = setScore(g, 1, 0, '0.2');
assert.deepEqual(totals(g), [0.3, 0, 0]);

const before = g;
g = setScore(g, 1, 2, '5');
assert.equal(before.rounds[1][2], 0, 'setScore does not mutate');

g = setScore(g, 0, 1, '5');
// Ana 0.3, Ben 5, Cy 5 → Ben and Cy tie for first.
assert.deepEqual(standings(g).map(s => [s.name, s.rank]), [['Ben', 1], ['Cy', 1], ['Ana', 3]]);
assert.deepEqual(standings(g, true).map(s => [s.name, s.rank]), [['Ana', 1], ['Ben', 2], ['Cy', 2]]);
assert.equal(standingsText(g), '1. Ben: 5\n1. Cy: 5\n3. Ana: 0.3');

assert.equal(removeLastRound(g).rounds.length, 1);
assert.equal(removeLastRound(newGame(['a'])).rounds.length, 1, 'always keeps one round');
let big = newGame(['a']);
for (let i = 0; i < 200; i++) big = addRound(big);
assert.equal(big.rounds.length, MAX_ROUNDS);

assert.ok(validGame(g));
assert.ok(!validGame(null));
assert.ok(!validGame({ players: ['a'], rounds: [[1, 2]] }), 'row length must match players');
assert.ok(!validGame({ players: ['a'], rounds: [['x']] }));
assert.ok(!validGame({ players: [{}], rounds: [[1]] }));

console.log('score tests passed');
