'use strict';

const {
  playLineup, reverseDigits, rate, percentBeaten, ANIMALS,
} = require('../game.js');

let failures = 0;

function eq(actual, expected, msg) {
  if (actual !== expected) {
    failures++;
    console.error(`FAIL ${msg}: expected ${expected}, got ${actual}`);
  }
}

function fail(msg) {
  failures++;
  console.error(`FAIL ${msg}`);
}

function total(ids, start) {
  return playLineup(ids, start).total;
}

/* digits */
eq(reverseDigits(120), 21, 'reverse 120');
eq(reverseDigits(5), 5, 'reverse single digit');
eq(reverseDigits(470), 74, 'reverse trailing zero');

/* flat effects */
eq(total(['elephant'], 10), 40, 'elephant adds 30');
eq(total(['rabbit'], 10), 20, 'rabbit doubles');
eq(total(['snake'], 120), 21, 'snake reverses');
eq(total(['frog'], 10), 35, 'frog on even');
eq(total(['frog'], 11), 16, 'frog on odd');
eq(total(['bee'], 47), 54, 'bee adds last digit');

/* position effects */
eq(total(['mouse', 'elephant'], 10), 85, 'mouse leading adds 45');
eq(total(['elephant', 'mouse'], 10), 45, 'mouse not leading adds 5');
eq(total(['owl', 'elephant'], 10), 50, 'owl counts animals after it');
eq(total(['elephant', 'owl'], 10), 40, 'owl at the back adds nothing');
eq(total(['elephant', 'wolf'], 10), 52, 'wolf counts animals before it');
eq(total(['wolf', 'elephant'], 10), 40, 'wolf leading adds nothing');
eq(total(['tortoise', 'elephant'], 10), 48, 'tortoise mid-line adds 8');
eq(total(['elephant', 'tortoise'], 10), 80, 'tortoise ending doubles');

/* fox doubles the next animal */
eq(total(['fox', 'rabbit'], 10), 40, 'fox makes rabbit double twice');
eq(total(['fox', 'fox', 'rabbit'], 5), 40, 'chained foxes stack the trigger');
eq(total(['fox', 'elephant'], 10), 70, 'fox makes elephant add twice');
eq(total(['fox', 'snake'], 47), 47, 'fox makes snake undo itself');
eq(total(['fox', 'snake'], 120), 12, 'double reverse is not always identity');
eq(total(['rabbit', 'fox'], 10), 20, 'fox at the back does nothing');

/* parrot repeats the previous animal */
eq(total(['rabbit', 'parrot'], 7), 28, 'parrot repeats rabbit');
eq(total(['parrot', 'elephant'], 10), 40, 'parrot leading has nothing to repeat');
eq(total(['fox', 'parrot', 'rabbit'], 10), 80,
  'parrot doubled by fox repeats fox, tripling rabbit');
eq(total(['elephant', 'parrot', 'rabbit'], 10), 140, 'parrot uses its own position');
eq(total(['elephant', 'tortoise', 'parrot'], 10), 96,
  'parrot repeating tortoise at the back doubles');

/* squirrel stash */
{
  const r = playLineup(['squirrel'], 15);
  eq(r.steps[0].after, 8, 'squirrel halves the score');
  eq(r.stash, 7, 'squirrel stashes the difference');
  eq(r.total, 15, 'stash returns after the run');
}
eq(total(['squirrel', 'rabbit'], 15), 23, 'rabbit doubles the unstashed half');
eq(total(['rabbit', 'squirrel'], 15), 30, 'stash is safe after the double');
eq(total(['fox', 'squirrel', 'rabbit'], 20), 25, 'fox makes squirrel stash twice');
eq(total(['squirrel', 'tortoise'], 15), 23, 'the stash is never doubled');

/* every animal declares its make */
for (const a of ANIMALS) {
  if (!Number.isInteger(a.legs)) fail(`${a.id} has no leg count`);
  if (!Number.isInteger(a.eyes)) fail(`${a.id} has no eye count`);
}

/* synergies: counting the line */
eq(total(['duck'], 10), 30, 'duck counts itself among the winged');
eq(total(['duck', 'owl'], 10), 50, 'duck counts a second winged animal');
eq(total(['penguin'], 10), 28, 'penguin counts itself as a swimmer');
eq(total(['penguin', 'frog'], 10), 71, 'penguin counts a second swimmer');
eq(total(['whale'], 10), 80, 'whale alone in the water adds 70');
eq(total(['whale', 'frog'], 10), 55, 'whale in company adds only 20');
eq(total(['crab'], 10), 34, 'crab counts its own eight legs');
eq(total(['elephant', 'crab'], 10), 76, 'crab counts the whole line of legs');
eq(total(['stag'], 10), 24, 'stag counts itself among the four-legged');
eq(total(['stag', 'elephant'], 10), 68, 'stag counts a second four-legged animal');
eq(total(['spider'], 10), 50, 'spider counts its own eight eyes');
eq(total(['spider', 'bee'], 10), 80, "spider counts the bee's five eyes");

/* synergies: counting one side of the line */
eq(total(['ant'], 10), 10, 'ant leading has no legs ahead of it');
eq(total(['crab', 'ant'], 10), 76, 'ant counts the legs ahead of it');
eq(total(['peacock'], 10), 10, 'peacock at the back has no eyes behind it');
eq(total(['peacock', 'spider'], 10), 124, 'peacock counts the eyes behind it');

/* bat reads the animal before it */
eq(total(['bat'], 10), 20, 'bat leading adds 10');
eq(total(['owl', 'bat'], 10), 40, 'bat behind a winged animal doubles');
eq(total(['elephant', 'bat'], 10), 50, 'bat behind a walker adds 10');

/* octopus repeats two places back */
eq(total(['elephant', 'rabbit', 'octopus'], 10), 110, 'octopus repeats the elephant');
eq(total(['rabbit', 'octopus'], 10), 20, 'octopus with nothing two back does nothing');
eq(total(['owl', 'elephant', 'octopus'], 10), 60, 'octopus repeats the owl from its own slot');

/* step bookkeeping */
{
  const r = playLineup(['fox', 'rabbit'], 10);
  eq(r.steps[1].times, 2, 'fox target records its trigger count');
  eq(r.steps[0].before, 10, 'step records score before');
  eq(r.steps[1].after, 40, 'step records score after');
}

/* determinism */
eq(total(['mouse', 'elephant', 'wolf', 'rabbit', 'tortoise'], 10),
  total(['mouse', 'elephant', 'wolf', 'rabbit', 'tortoise'], 10),
  'same line, same score');

/* ratings */
eq(rate(340, 340).paws, 5, 'perfect run is five paws');
eq(rate(310, 340).paws, 4, '91% is four paws');
eq(rate(260, 340).paws, 3, '76% is three paws');
eq(rate(190, 340).paws, 2, '55% is two paws');
eq(rate(100, 340).paws, 1, 'anything less is one paw');

/* percentile */
eq(percentBeaten(5, [1, 2, 3, 4, 10]), 80, 'beats four of five');
eq(percentBeaten(1, [1, 2, 3, 4, 10]), 0, 'beats nothing at the bottom');
eq(percentBeaten(11, [1, 2, 3, 4, 10]), 100, 'beats everything at the top');

if (failures) {
  console.error(`engine: ${failures} failure(s)`);
  process.exit(1);
}
console.log('engine: all tests passed');
