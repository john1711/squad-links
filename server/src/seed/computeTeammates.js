// Derives TEAMMATE_OF edges from overlapping PLAYED_FOR spells at the same
// club. Two players are teammates if their time at a club overlapped at
// all; the edge stores which club and the overlapping date window.
//
// This is computed in JS at seed time (not in Cypher) because it's a
// one-off bulk derivation over the whole dataset - once written, the
// TEAMMATE_OF edges make the app's flagship "shortest path between two
// players" query a single-line, indexable graph traversal instead of a
// runtime date-overlap join.

const TODAY = new Date().toISOString().slice(0, 10);

function overlaps(aFrom, aTo, bFrom, bTo) {
  const aEnd = aTo || TODAY;
  const bEnd = bTo || TODAY;
  // Strict inequality: a same-day handover (one spell ending the exact
  // date the next begins) is a transfer, not shared time as teammates.
  return aFrom < bEnd && bFrom < aEnd;
}

function overlapWindow(aFrom, aTo, bFrom, bTo) {
  const aEnd = aTo || TODAY;
  const bEnd = bTo || TODAY;
  const start = aFrom > bFrom ? aFrom : bFrom;
  const end = aEnd < bEnd ? aEnd : bEnd;
  return { from: start, to: end };
}

/**
 * @param {Array<{playerId,clubId,from,to}>} playerSpells
 * @returns {Array<{playerAId,playerBId,clubId,from,to}>}
 */
export function computeTeammateEdges(playerSpells) {
  const spellsByClub = new Map();
  for (const spell of playerSpells) {
    if (!spellsByClub.has(spell.clubId)) spellsByClub.set(spell.clubId, []);
    spellsByClub.get(spell.clubId).push(spell);
  }

  const edges = [];
  for (const [clubId, spells] of spellsByClub) {
    for (let i = 0; i < spells.length; i++) {
      for (let j = i + 1; j < spells.length; j++) {
        const a = spells[i];
        const b = spells[j];
        if (a.playerId === b.playerId) continue;
        if (!overlaps(a.from, a.to, b.from, b.to)) continue;

        const { from, to } = overlapWindow(a.from, a.to, b.from, b.to);
        // Canonical ordering so we don't create the same pair twice for
        // the same club (undirected relationship, stored once).
        const [playerAId, playerBId] =
          a.playerId < b.playerId ? [a.playerId, b.playerId] : [b.playerId, a.playerId];
        edges.push({ playerAId, playerBId, clubId, from, to });
      }
    }
  }
  return edges;
}
