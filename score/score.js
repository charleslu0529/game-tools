// Pure logic for the score keeper. score/index.html and tests/score.test.mjs both import it.
// State: { players: [names], rounds: [[score per player]] }. A round is a row; blank cells are 0.

export const MAX_ROUNDS = 99;

export function newGame(players) {
  return { players: [...players], rounds: [players.map(() => 0)] };
}

/** Parses a typed score. Allows negatives and decimals; anything else counts as 0. Caps the size. */
export function parseScore(text) {
  const n = Number(String(text).trim());
  if (!Number.isFinite(n)) return 0;
  return Math.max(-1e6, Math.min(1e6, Math.round(n * 100) / 100));
}

export function setScore(game, round, player, value) {
  const rounds = game.rounds.map(r => [...r]);
  rounds[round][player] = parseScore(value);
  return { ...game, rounds };
}

export function addRound(game) {
  if (game.rounds.length >= MAX_ROUNDS) return game;
  return { ...game, rounds: [...game.rounds, game.players.map(() => 0)] };
}

export function removeLastRound(game) {
  if (game.rounds.length <= 1) return game;
  return { ...game, rounds: game.rounds.slice(0, -1) };
}

export function totals(game) {
  return game.players.map((_, p) => Math.round(game.rounds.reduce((s, r) => s + (r[p] || 0), 0) * 100) / 100);
}

/**
 * Standings sorted by total (highest first, or lowest when lowWins), with shared ranks for ties ("1, 1, 3").
 * Returns [{ name, total, rank }].
 */
export function standings(game, lowWins = false) {
  const t = totals(game);
  const rows = game.players.map((name, i) => ({ name, total: t[i], i }));
  rows.sort((a, b) => (lowWins ? a.total - b.total : b.total - a.total) || a.i - b.i);
  let rank = 0;
  return rows.map((r, k) => {
    if (k === 0 || r.total !== rows[k - 1].total) rank = k + 1;
    return { name: r.name, total: r.total, rank };
  });
}

/** Checks saved state from storage before trusting it. */
export function validGame(g) {
  return !!g && Array.isArray(g.players) && g.players.length >= 1 && g.players.length <= 64
    && g.players.every(p => typeof p === 'string')
    && Array.isArray(g.rounds) && g.rounds.length >= 1 && g.rounds.length <= MAX_ROUNDS
    && g.rounds.every(r => Array.isArray(r) && r.length === g.players.length && r.every(Number.isFinite));
}

export function standingsText(game, lowWins) {
  return standings(game, lowWins).map(s => `${s.rank}. ${s.name}: ${s.total}`).join('\n');
}
