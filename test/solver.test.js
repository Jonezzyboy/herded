'use strict';

const { solve, playLineup, LINE_SIZE } = require('../game.js');

let failures = 0;

function fail(msg) {
  failures++;
  console.error(`FAIL ${msg}`);
}

/* a pen of exactly five: 120 orderings, optimum checkable by hand */
{
  const pen = ['mouse', 'elephant', 'rabbit', 'tortoise', 'wolf'];
  const sol = solve(pen, 10);

  if (sol.scores.length !== 120) fail(`expected 120 lines, got ${sol.scores.length}`);
  if (sol.best !== 436) fail(`expected best 436, got ${sol.best}`);
  if (sol.bestLineup.join(',') !== 'mouse,elephant,wolf,rabbit,tortoise') {
    fail(`unexpected best line: ${sol.bestLineup.join(',')}`);
  }
  if (playLineup(sol.bestLineup, 10).total !== sol.best) {
    fail('best line does not replay to the best score');
  }

  for (let i = 1; i < sol.scores.length; i++) {
    if (sol.scores[i] < sol.scores[i - 1]) { fail('scores are not sorted'); break; }
  }
  if (sol.scores[sol.scores.length - 1] !== sol.best) fail('best is not the top of the distribution');
}

/* a pen of seven: 2,520 orderings, best must dominate a sample */
{
  const pen = ['fox', 'parrot', 'rabbit', 'snake', 'squirrel', 'bee', 'owl'];
  const sol = solve(pen, 19);

  if (sol.scores.length !== 2520) fail(`expected 2520 lines, got ${sol.scores.length}`);
  if (sol.bestLineup.length !== LINE_SIZE) fail('best line is not five animals');
  if (new Set(sol.bestLineup).size !== LINE_SIZE) fail('best line repeats an animal');
  for (const id of sol.bestLineup) {
    if (!pen.includes(id)) fail(`best line uses ${id}, not in the pen`);
  }

  const samples = [
    ['fox', 'parrot', 'rabbit', 'snake', 'squirrel'],
    ['owl', 'bee', 'rabbit', 'parrot', 'fox'],
    ['snake', 'squirrel', 'owl', 'fox', 'bee'],
  ];
  for (const line of samples) {
    if (playLineup(line, 19).total > sol.best) fail(`sample line beats the solver: ${line.join(',')}`);
  }

  let count = 0;
  for (const s of sol.scores) if (s === sol.best) count++;
  if (count !== sol.bestCount) fail(`bestCount ${sol.bestCount} disagrees with distribution ${count}`);
}

if (failures) {
  console.error(`solver: ${failures} failure(s)`);
  process.exit(1);
}
console.log('solver: all tests passed');
