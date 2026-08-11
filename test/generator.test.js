'use strict';

const {
  generatePuzzle, playLineup, BY_ID, PEN_SIZE, LINE_SIZE,
} = require('../game.js');

const DAYS = 365 * 3;
let failures = 0;

function fail(day, msg) {
  failures++;
  console.error(`day ${day}: ${msg}`);
}

for (let day = 0; day < DAYS; day++) {
  let p;
  try {
    p = generatePuzzle(day);
  } catch (e) {
    fail(day, e.message);
    continue;
  }

  if (p.start < 5 || p.start > 29) fail(day, `start ${p.start} out of range`);
  if (p.pen.length !== PEN_SIZE) fail(day, `pen has ${p.pen.length} animals`);
  if (new Set(p.pen).size !== p.pen.length) fail(day, 'duplicate animal in the pen');
  for (const id of p.pen) {
    if (!BY_ID[id]) fail(day, `unknown animal ${id}`);
  }

  const sol = p.solution;
  if (sol.scores.length !== 2520) fail(day, `expected 2520 lines, got ${sol.scores.length}`);
  if (sol.best < 150) fail(day, `best ${sol.best} is too flat`);
  if (sol.bestCount > 40) fail(day, `${sol.bestCount} perfect lines is a giveaway`);
  const median = sol.scores[sol.scores.length >> 1];
  if (sol.best < median * 1.5) fail(day, `best ${sol.best} barely beats median ${median}`);

  if (new Set(sol.scores).size < 30) fail(day, 'too few distinct outcomes — no real branching');
  if (sol.bestLineup.length !== LINE_SIZE) fail(day, 'best line is not five animals');
  if (playLineup(sol.bestLineup, p.start).total !== sol.best) {
    fail(day, 'best line does not replay to the best score');
  }

  const again = generatePuzzle(day);
  if (again.start !== p.start || again.pen.join(',') !== p.pen.join(',')) {
    fail(day, 'not deterministic');
  }
}

if (failures) {
  console.error(`generator: ${failures} failure(s) across ${DAYS} days`);
  process.exit(1);
}
console.log(`generator: ${DAYS} days pass`);
