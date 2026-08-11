'use strict';

const {
  playLineup, reverseDigits, rate, percentBeaten,
  PACKS, ANIMALS, PEN_SIZE, packForDay,
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

/* packs are well formed and never overlap */
{
  const seen = new Set();
  for (const p of PACKS) {
    if (p.animals.length < PEN_SIZE) fail(`pack ${p.id} cannot fill a pen of ${PEN_SIZE}`);
    for (const a of p.animals) {
      if (seen.has(a.id)) fail(`${a.id} appears in more than one pack`);
      seen.add(a.id);
      if (typeof a.act !== 'function') fail(`${a.id} has no effect`);
      if (!a.name || !a.emoji || !a.power) fail(`${a.id} is missing its card copy`);
    }
  }
  eq(seen.size, ANIMALS.length, 'every creature is reachable from a pack');
}

/* one pack a day, in rotation */
eq(packForDay(0).id, PACKS[0].id, 'day one draws the first pack');
eq(packForDay(PACKS.length).id, PACKS[0].id, 'the rotation comes back round');
{
  let repeats = 0;
  for (let d = 1; d < 200; d++) if (packForDay(d).id === packForDay(d - 1).id) repeats++;
  eq(repeats, 0, 'no pack follows itself');
}

/* myth */
eq(total(['dragon'], 10), 45, 'dragon adds 35');
eq(total(['phoenix'], 10), 30, 'phoenix leading trebles');
eq(total(['dragon', 'phoenix'], 10), 90, 'phoenix elsewhere only doubles');
eq(total(['sphinx', 'dragon'], 10), 57, 'sphinx counts creatures after it');
eq(total(['ouroboros'], 120), 21, 'ouroboros reverses');
eq(total(['atlas'], 10), 60, 'atlas leading adds 50');
eq(total(['dragon', 'atlas'], 10), 51, 'atlas elsewhere adds 6');
eq(total(['dragon', 'kraken'], 10), 90, 'kraken ending doubles');
eq(total(['dragon', 'minotaur'], 10), 59, 'minotaur counts creatures before it');
eq(total(['griffin', 'hydra'], 10), 40, 'griffin makes the hydra double twice');
eq(total(['hydra', 'echo'], 10), 40, 'echo repeats the hydra');
{
  const r = playLineup(['cerberus'], 15);
  eq(r.steps[0].after, 8, 'cerberus guards half the score');
  eq(r.total, 15, 'the guarded half comes back');
}

/* eldritch */
eq(total(['star-spawn'], 10), 50, 'star-spawn adds 40');
eq(total(['the-hollow'], 40), 110, 'the hollow halves then adds 90');
eq(total(['the-hollow'], 300), 240, 'the hollow drags a big score down');
eq(total(['herald'], 10), 65, 'herald leading adds 55');
eq(total(['watcher', 'star-spawn'], 10), 64, 'watcher counts creatures after it');
eq(total(['star-spawn', 'crawling-mass'], 10), 66, 'crawling mass counts creatures before it');
eq(total(['tide-thing'], 10), 45, 'tide-thing on an even score');
eq(total(['tide-thing'], 11), 16, 'tide-thing on an odd score');
eq(total(['whisperer'], 47), 54, 'whisperer adds the last digit');

/* cryptids */
eq(total(['bigfoot'], 10), 42, 'bigfoot adds 32');
eq(total(['bigfoot', 'mothman'], 10), 84, 'mothman doubles from second place');
eq(total(['mothman'], 10), 25, 'mothman anywhere else adds 15');
eq(total(['bigfoot', 'jackalope', 'mothman'], 10), 99, 'mothman only doubles in second');
eq(total(['thunderbird'], 10), 58, 'thunderbird leading adds 48');
eq(total(['yeti', 'bigfoot'], 10), 53, 'yeti counts creatures after it');
eq(total(['nessie'], 120), 21, 'nessie reverses');
eq(total(['wendigo'], 10), 38, 'wendigo on an even score');
eq(total(['bigfoot', 'ogopogo'], 10), 84, 'ogopogo ending doubles');
eq(total(['bigfoot', 'death-worm'], 10), 55, 'death worm counts creatures before it');

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
