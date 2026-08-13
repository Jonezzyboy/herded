'use strict';

/* ============================================================
   Herded — seven in the pen, five through the gate.
   Every animal bends the score its own way; the order you send
   them through decides everything.
   ============================================================ */

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function reverseDigits(n) {
  return parseInt(String(n).split('').reverse().join(''), 10);
}

/* ---------- the roster ----------
   Effects run against { score, stash, nextTimes } plus a context
   { pos, len, prev }. An animal sent through with times > 1 has its
   effect executed that many times back to back, so doublers compound.

   Every power reads the score or the shape of the line — where a creature
   stands, what stands beside it, how many follow. None of them read what
   the other creatures *are*, which is what keeps the puzzle about order.

   Creatures are grouped into packs and each day draws its pen from one
   pack, so a day has a single flavour. Packs share the same family of
   powers at different strengths: the shapes are familiar, the numbers
   are not, so a Myth day plays differently from a Farmyard one. */

const LINE_SIZE = 5;
const PEN_SIZE = 7;
const RUNS = 3;

const FARMYARD = [
  { id: 'elephant', emoji: '\u{1F418}', name: 'Elephant',
    power: 'Adds 30 to the score.',
    act(s) { s.score += 30; } },
  { id: 'rabbit', emoji: '\u{1F407}', name: 'Rabbit',
    power: 'Doubles the score.',
    act(s) { s.score *= 2; } },
  { id: 'fox', emoji: '\u{1F98A}', name: 'Fox',
    power: 'The next animal in line acts twice.',
    act(s) { s.nextTimes += 1; } },
  { id: 'parrot', emoji: '\u{1F99C}', name: 'Parrot',
    power: 'Repeats the power of the animal before it.',
    act(s, ctx) { if (ctx.prev) ctx.prev.act(s, ctx); } },
  { id: 'owl', emoji: '\u{1F989}', name: 'Owl',
    power: 'Adds 10 for every animal after it in line.',
    act(s, ctx) { s.score += 10 * (ctx.len - 1 - ctx.pos); } },
  { id: 'snake', emoji: '\u{1F40D}', name: 'Snake',
    power: 'Reverses the digits of the score.',
    act(s) { s.score = reverseDigits(s.score); } },
  { id: 'frog', emoji: '\u{1F438}', name: 'Frog',
    power: 'Adds 25 if the score is even, 5 if odd.',
    act(s) { s.score += s.score % 2 === 0 ? 25 : 5; } },
  { id: 'mouse', emoji: '\u{1F42D}', name: 'Mouse',
    power: 'Adds 45 if it leads the line, otherwise 5.',
    act(s, ctx) { s.score += ctx.pos === 0 ? 45 : 5; } },
  { id: 'tortoise', emoji: '\u{1F422}', name: 'Tortoise',
    power: 'Doubles the score if it ends the line, otherwise adds 8.',
    act(s, ctx) { if (ctx.pos === ctx.len - 1) s.score *= 2; else s.score += 8; } },
  { id: 'bee', emoji: '\u{1F41D}', name: 'Bee',
    power: "Adds the score's last digit to the score.",
    act(s) { s.score += s.score % 10; } },
  { id: 'squirrel', emoji: '\u{1F43F}\u{FE0F}', name: 'Squirrel',
    power: 'Stashes half the score; the stash comes back after the run.',
    act(s) { const h = Math.round(s.score / 2); s.stash += h; s.score -= h; } },
  { id: 'wolf', emoji: '\u{1F43A}', name: 'Wolf',
    power: 'Adds 12 for every animal before it in line.',
    act(s, ctx) { s.score += 12 * ctx.pos; } },
];

const MYTH = [
  { id: 'dragon', emoji: '\u{1F409}', name: 'Dragon',
    power: 'Adds 35 to the score.',
    act(s) { s.score += 35; } },
  { id: 'hydra', emoji: '\u{1F40D}', name: 'Hydra',
    power: 'Doubles the score.',
    act(s) { s.score *= 2; } },
  { id: 'phoenix', emoji: '\u{1F525}', name: 'Phoenix',
    power: 'Doubles the score, or trebles it if it leads the line.',
    act(s, ctx) { s.score *= ctx.pos === 0 ? 3 : 2; } },
  { id: 'griffin', emoji: '\u{1F985}', name: 'Griffin',
    power: 'The next creature in line acts twice.',
    act(s) { s.nextTimes += 1; } },
  { id: 'chimera', emoji: '\u{1F410}', name: 'Chimera',
    power: 'Repeats the power of the creature before it.',
    act(s, ctx) { if (ctx.prev) ctx.prev.act(s, ctx); } },
  { id: 'sphinx', emoji: '\u{1F981}', name: 'Sphinx',
    power: 'Adds 12 for every creature after it in line.',
    act(s, ctx) { s.score += 12 * (ctx.len - 1 - ctx.pos); } },
  { id: 'ouroboros', emoji: '\u{1F300}', name: 'Ouroboros',
    power: 'Reverses the digits of the score.',
    act(s) { s.score = reverseDigits(s.score); } },
  { id: 'cockatrice', emoji: '\u{1F413}', name: 'Cockatrice',
    power: 'Adds 30 if the score is even, 6 if odd.',
    act(s) { s.score += s.score % 2 === 0 ? 30 : 6; } },
  { id: 'pegasus', emoji: '\u{1F40E}', name: 'Pegasus',
    power: 'Adds 50 if it leads the line, otherwise 6.',
    act(s, ctx) { s.score += ctx.pos === 0 ? 50 : 6; } },
  { id: 'kraken', emoji: '\u{1F419}', name: 'Kraken',
    power: 'Doubles the score if it ends the line, otherwise adds 10.',
    act(s, ctx) { if (ctx.pos === ctx.len - 1) s.score *= 2; else s.score += 10; } },
  { id: 'harpy', emoji: '\u{1F987}', name: 'Harpy',
    power: "Adds the score's last digit to the score.",
    act(s) { s.score += s.score % 10; } },
  { id: 'cerberus', emoji: '\u{1F415}', name: 'Cerberus',
    power: 'Guards half the score; the guarded half returns after the run.',
    act(s) { const h = Math.round(s.score / 2); s.stash += h; s.score -= h; } },
  { id: 'minotaur', emoji: '\u{1F402}', name: 'Minotaur',
    power: 'Adds 14 for every creature before it in line.',
    act(s, ctx) { s.score += 14 * ctx.pos; } },
];

const ELDRITCH = [
  { id: 'star-spawn', emoji: '\u{1F30C}', name: 'Star-Spawn',
    power: 'Adds 40 to the score.',
    act(s) { s.score += 40; } },
  { id: 'shoggoth', emoji: '\u{1FAE7}', name: 'Shoggoth',
    power: 'Doubles the score.',
    act(s) { s.score *= 2; } },
  { id: 'the-hollow', emoji: '\u{1F573}\u{FE0F}', name: 'The Hollow',
    power: 'Halves the score, then adds 90.',
    act(s) { s.score = Math.round(s.score / 2) + 90; } },
  { id: 'beckoner', emoji: '\u{1F441}\u{FE0F}', name: 'The Beckoner',
    power: 'The next creature in line acts twice.',
    act(s) { s.nextTimes += 1; } },
  { id: 'mimic', emoji: '\u{1F3AD}', name: 'Mimic',
    power: 'Repeats the power of the creature before it.',
    act(s, ctx) { if (ctx.prev) ctx.prev.act(s, ctx); } },
  { id: 'watcher', emoji: '\u{1F311}', name: 'Watcher in the Dark',
    power: 'Adds 14 for every creature after it in line.',
    act(s, ctx) { s.score += 14 * (ctx.len - 1 - ctx.pos); } },
  { id: 'the-inverted', emoji: '\u{1F53B}', name: 'The Inverted',
    power: 'Reverses the digits of the score.',
    act(s) { s.score = reverseDigits(s.score); } },
  { id: 'tide-thing', emoji: '\u{1F30A}', name: 'Tide-Thing',
    power: 'Adds 35 if the score is even, 5 if odd.',
    act(s) { s.score += s.score % 2 === 0 ? 35 : 5; } },
  { id: 'herald', emoji: '\u{1F4EF}', name: 'The Herald',
    power: 'Adds 55 if it leads the line, otherwise 5.',
    act(s, ctx) { s.score += ctx.pos === 0 ? 55 : 5; } },
  { id: 'leviathan', emoji: '\u{1F40B}', name: 'Leviathan',
    power: 'Doubles the score if it ends the line, otherwise adds 12.',
    act(s, ctx) { if (ctx.pos === ctx.len - 1) s.score *= 2; else s.score += 12; } },
  { id: 'whisperer', emoji: '\u{1F32B}\u{FE0F}', name: 'The Whisperer',
    power: "Adds the score's last digit to the score.",
    act(s) { s.score += s.score % 10; } },
  { id: 'keeper', emoji: '\u{1F5DD}\u{FE0F}', name: 'The Keeper',
    power: 'Takes half the score into the dark; it returns after the run.',
    act(s) { const h = Math.round(s.score / 2); s.stash += h; s.score -= h; } },
  { id: 'crawling-mass', emoji: '\u{1F9A0}', name: 'Crawling Mass',
    power: 'Adds 16 for every creature before it in line.',
    act(s, ctx) { s.score += 16 * ctx.pos; } },
];

const CRYPTIDS = [
  { id: 'bigfoot', emoji: '\u{1F9B6}', name: 'Bigfoot',
    power: 'Adds 32 to the score.',
    act(s) { s.score += 32; } },
  { id: 'jackalope', emoji: '\u{1F430}', name: 'Jackalope',
    power: 'Doubles the score.',
    act(s) { s.score *= 2; } },
  { id: 'mothman', emoji: '\u{1F98B}', name: 'Mothman',
    power: 'Doubles the score if it goes second in line, otherwise adds 15.',
    act(s, ctx) { if (ctx.pos === 1) s.score *= 2; else s.score += 15; } },
  { id: 'chupacabra', emoji: '\u{1F987}', name: 'Chupacabra',
    power: 'The next creature in line acts twice.',
    act(s) { s.nextTimes += 1; } },
  { id: 'doppelganger', emoji: '\u{1F465}', name: 'Doppelgänger',
    power: 'Repeats the power of the creature before it.',
    act(s, ctx) { if (ctx.prev) ctx.prev.act(s, ctx); } },
  { id: 'yeti', emoji: '\u{1F3D4}\u{FE0F}', name: 'Yeti',
    power: 'Adds 11 for every creature after it in line.',
    act(s, ctx) { s.score += 11 * (ctx.len - 1 - ctx.pos); } },
  { id: 'nessie', emoji: '\u{1F995}', name: 'Nessie',
    power: 'Reverses the digits of the score.',
    act(s) { s.score = reverseDigits(s.score); } },
  { id: 'wendigo', emoji: '\u{1F98C}', name: 'Wendigo',
    power: 'Adds 28 if the score is even, 8 if odd.',
    act(s) { s.score += s.score % 2 === 0 ? 28 : 8; } },
  { id: 'thunderbird', emoji: '\u{1F985}', name: 'Thunderbird',
    power: 'Adds 48 if it leads the line, otherwise 8.',
    act(s, ctx) { s.score += ctx.pos === 0 ? 48 : 8; } },
  { id: 'ogopogo', emoji: '\u{1F40A}', name: 'Ogopogo',
    power: 'Doubles the score if it ends the line, otherwise adds 9.',
    act(s, ctx) { if (ctx.pos === ctx.len - 1) s.score *= 2; else s.score += 9; } },
  { id: 'will-o-wisp', emoji: '\u{2728}', name: "Will-o'-the-Wisp",
    power: "Adds the score's last digit to the score.",
    act(s) { s.score += s.score % 10; } },
  { id: 'hobgoblin', emoji: '\u{1F47A}', name: 'Hobgoblin',
    power: 'Hoards half the score; the hoard comes back after the run.',
    act(s) { const h = Math.round(s.score / 2); s.stash += h; s.score -= h; } },
  { id: 'death-worm', emoji: '\u{1FAB1}', name: 'Death Worm',
    power: 'Adds 13 for every creature before it in line.',
    act(s, ctx) { s.score += 13 * ctx.pos; } },
];

/* ---------- the packs ----------
   One pack a day, in rotation, so every pack comes round as often as
   every other and tomorrow is never today's again. */

const PACKS = [
  { id: 'farmyard', name: 'The Farmyard', animals: FARMYARD },
  { id: 'myth', name: 'The Myth', animals: MYTH },
  { id: 'eldritch', name: 'The Eldritch', animals: ELDRITCH },
  { id: 'cryptids', name: 'The Cryptids', animals: CRYPTIDS },
];

const ANIMALS = PACKS.flatMap((p) => p.animals);

const BY_ID = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

const PACK_BY_ID = Object.fromEntries(PACKS.map((p) => [p.id, p]));

function packForDay(dayIndex) {
  return PACKS[dayIndex % PACKS.length];
}

/* ---------- running the line ---------- */

function playLineup(ids, start) {
  const s = { score: start, stash: 0, nextTimes: 1 };
  const steps = [];
  ids.forEach((id, pos) => {
    const a = BY_ID[id];
    const times = s.nextTimes;
    s.nextTimes = 1;
    const before = s.score;
    const stashBefore = s.stash;
    const ctx = { pos, len: ids.length, prev: pos > 0 ? BY_ID[ids[pos - 1]] : null };
    for (let t = 0; t < times; t++) a.act(s, ctx);
    steps.push({ id, times, before, after: s.score, stashed: s.stash - stashBefore });
  });
  const beforeStash = s.score;
  return { total: s.score + s.stash, stash: s.stash, beforeStash, steps };
}

/* ---------- the perfect run ----------
   Brute force over every ordered five-of-seven: 2,520 lines. */

function solve(pen, start) {
  let best = -Infinity;
  let bestLineup = null;
  let bestCount = 0;
  const scores = [];
  const used = new Array(pen.length).fill(false);
  const cur = [];
  (function rec() {
    if (cur.length === LINE_SIZE) {
      const t = playLineup(cur, start).total;
      scores.push(t);
      if (t > best) { best = t; bestLineup = cur.slice(); bestCount = 1; }
      else if (t === best) bestCount++;
      return;
    }
    for (let i = 0; i < pen.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(pen[i]);
      rec();
      cur.pop();
      used[i] = false;
    }
  })();
  scores.sort((a, b) => a - b);
  return { best, bestLineup, bestCount, scores };
}

function percentBeaten(score, scores) {
  let lo = 0;
  let hi = scores.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (scores[mid] < score) lo = mid + 1;
    else hi = mid;
  }
  return Math.round((lo / scores.length) * 100);
}

/* ---------- deterministic daily pen ----------
   Rejects flat or giveaway days: the perfect run has to be worth
   hunting for and rare enough that order genuinely matters. */

function generatePuzzle(dayIndex) {
  const pack = packForDay(dayIndex);
  for (let attempt = 0; attempt < 200; attempt++) {
    const rng = mulberry32(((dayIndex + 1) * 2654435761) ^ (attempt * 40503 + 17));
    const start = 5 + Math.floor(rng() * 25);
    const pen = shuffle(pack.animals.map((a) => a.id), rng).slice(0, PEN_SIZE);
    const sol = solve(pen, start);
    const median = sol.scores[sol.scores.length >> 1];
    if (sol.best < 150) continue;
    if (sol.bestCount > 40) continue;
    if (sol.best < median * 1.5) continue;
    return { day: dayIndex, pack: pack.id, start, pen, solution: sol };
  }
  throw new Error(`no worthy pen for day ${dayIndex}`);
}

/* ---------- the calendar ---------- */

// Herd No. 1 = 11 August 2026. Flips at local midnight.
const EPOCH = { y: 2026, m: 7, d: 11 };

function todayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const epoch = new Date(EPOCH.y, EPOCH.m, EPOCH.d);
  return Math.max(0, Math.round((start - epoch) / 864e5));
}

function msToMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
}

/* ---------- rosettes ---------- */

function rate(best, optimal) {
  const pct = Math.round((best / optimal) * 100);
  if (pct >= 100) return { paws: 5, pct, name: 'Best in show' };
  if (pct >= 90) return { paws: 4, pct, name: 'Prize herd' };
  if (pct >= 75) return { paws: 3, pct, name: 'Good dog' };
  if (pct >= 55) return { paws: 2, pct, name: 'Scattered flock' };
  return { paws: 1, pct, name: 'Lost sheep' };
}

/* ---------- commendations ----------
   Earnable badges, judged against a summary of a finished day:
   { played, streak, perfects, pct, paws, runs, beaten, climbing, menagerie,
     everyPack }. */

const BADGES = [
  { id: 'first-light', seal: 'No1', name: 'First Light',
    desc: 'Herd your first day.',
    test: (c) => c.played >= 1 },
  { id: 'good-dog', seal: '75', name: 'Good Dog',
    desc: 'Take three paws or better.',
    test: (c) => c.paws >= 3 },
  { id: 'prize-herd', seal: '90', name: 'Prize Herd',
    desc: 'Finish within a tenth of the perfect run.',
    test: (c) => c.pct >= 90 },
  { id: 'best-in-show', seal: 'MAX', name: 'Best in Show',
    desc: "Find the day's perfect run.",
    test: (c) => c.pct >= 100 },
  { id: 'straight-through', seal: '1st', name: 'Straight Through',
    desc: 'Find the perfect run on your very first run.',
    test: (c) => c.pct >= 100 && c.runs === 1 },
  { id: 'called-early', seal: '2/3', name: 'Called It Early',
    desc: 'Take four paws with a run still in hand.',
    test: (c) => c.paws >= 4 && c.runs < RUNS },
  { id: 'reading-the-field', seal: '↗', name: 'Reading the Field',
    desc: 'Score higher on every run of a full three.',
    test: (c) => c.climbing },
  { id: 'long-odds', seal: '99', name: 'Long Odds',
    desc: 'Beat 99% of all 2,520 possible line-ups.',
    test: (c) => c.beaten >= 99 },
  { id: 'regular-round', seal: '3d', name: 'Regular Round',
    desc: 'Herd three days running.',
    test: (c) => c.streak >= 3 },
  { id: 'drovers-week', seal: '7d', name: "Drover's Week",
    desc: 'Herd seven days running.',
    test: (c) => c.streak >= 7 },
  { id: 'shepherds-month', seal: '30', name: "Shepherd's Month",
    desc: 'Herd thirty days running.',
    test: (c) => c.streak >= 30 },
  { id: 'year-of-the-herd', seal: '1yr', name: 'Year of the Herd',
    desc: 'Herd a full year running.',
    test: (c) => c.streak >= 365 },
  { id: 'sharp-eye', seal: '5×', name: 'Sharp Eye',
    desc: 'Find five perfect runs in all.',
    test: (c) => c.perfects >= 5 },
  { id: 'well-travelled', seal: `${PACKS.length}p`, name: 'Well Travelled',
    desc: 'Herd a day from every pack.',
    test: (c) => c.everyPack },
  { id: 'whole-menagerie', seal: `${ANIMALS.length}`, name: 'The Whole Menagerie',
    desc: `Send all ${ANIMALS.length} creatures through the gate.`,
    test: (c) => c.menagerie },
  { id: 'hundred-herds', seal: '100', name: 'Hundred Herds',
    desc: 'Herd one hundred days in all.',
    test: (c) => c.played >= 100 },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ANIMALS, BY_ID, LINE_SIZE, PEN_SIZE, RUNS, BADGES,
    PACKS, PACK_BY_ID, packForDay,
    mulberry32, shuffle, reverseDigits,
    playLineup, solve, percentBeaten, generatePuzzle, rate,
    todayIndex, msToMidnight, EPOCH,
  };
}

/* ============================================================
   The field (browser only)
   ============================================================ */

if (typeof document !== 'undefined') (function () {
  const $ = (sel) => document.querySelector(sel);

  /* Creature marks live in icons.js (game-icons.net, CC BY 3.0);
     the emoji on each animal stays as the fallback. */
  const ICONS = typeof CREATURE_ICONS !== 'undefined' ? CREATURE_ICONS : {};

  function iconMark(id, cls) {
    const paths = ICONS[id];
    if (!paths) return null;
    return `<svg class="${cls}" viewBox="0 0 512 512" aria-hidden="true">` +
      paths.map((d) => `<path fill="currentColor" d="${d}"/>`).join('') + '</svg>';
  }

  function faceMark(a, cls) {
    return iconMark(a.id, cls) || `<span class="${cls}">${a.emoji}</span>`;
  }

  const DAY_KEY = 'herded-day-v1';
  const STATS_KEY = 'herded-stats-v1';
  const BADGES_KEY = 'herded-badges-v1';
  const SEEN_KEY = 'herded-seen-v1';
  const PACKS_KEY = 'herded-packs-v1';
  const THEME_KEY = 'herded-theme-v1';

  const params = new URLSearchParams(location.search);
  const today = todayIndex();
  let day = today;
  let archive = false;
  if (params.has('day')) {
    const d = parseInt(params.get('day'), 10);
    if (Number.isFinite(d) && d >= 0 && d < today) { day = d; archive = true; }
  }

  const puzzle = generatePuzzle(day);
  const optimal = puzzle.solution.best;
  const pack = PACK_BY_ID[puzzle.pack];

  /* ---------- state ---------- */

  const state = {
    lineup: [],           // ids picked so far this run
    runs: [],             // { lineup, total }
    finished: false,
    revealing: false,
  };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }

  function saveDay() {
    if (archive) return;
    localStorage.setItem(DAY_KEY, JSON.stringify({
      day, runs: state.runs, finished: state.finished,
    }));
  }

  function bestRun() {
    return state.runs.reduce((m, r) => Math.max(m, r.total), 0);
  }

  /* ---------- stats ---------- */

  function loadStats() {
    return load(STATS_KEY) || {
      played: 0, perfects: 0, streak: 0, maxStreak: 0, lastDay: -2, totalPct: 0,
    };
  }

  function recordFinish(pct) {
    if (archive) return loadStats();
    markShelf();
    const stats = loadStats();
    if (stats.lastDay === day) return stats;
    stats.played++;
    stats.totalPct += pct;
    if (pct >= 100) stats.perfects++;
    stats.streak = stats.lastDay === day - 1 ? stats.streak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.lastDay = day;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return stats;
  }

  /* ---------- the daily shelf ----------
     All three dailies share this origin, so a tiny shared ledger of
     "finished today" dates lets each game tick off its siblings. */

  const SHELF_KEY = 'dailies-v1';
  const SHELF_SLUG = 'herded';

  function localDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function markShelf() {
    const shelf = load(SHELF_KEY) || {};
    shelf[SHELF_SLUG] = localDate();
    localStorage.setItem(SHELF_KEY, JSON.stringify(shelf));
  }

  function renderShelfTicks() {
    const shelf = load(SHELF_KEY) || {};
    const today = localDate();
    document.querySelectorAll('.also a[data-daily]').forEach((a) => {
      if (shelf[a.dataset.daily] === today) {
        const tick = document.createElement('span');
        tick.className = 'done-tick';
        tick.title = 'Played today';
        tick.textContent = ' ✓';
        a.after(tick);
      }
    });
  }

  /* ---------- commendations ---------- */

  function loadBadges() {
    return load(BADGES_KEY) || {};
  }

  function recordSeen() {
    const seen = new Set(load(SEEN_KEY) || []);
    for (const r of state.runs) for (const id of r.lineup) seen.add(id);
    const list = [...seen];
    localStorage.setItem(SEEN_KEY, JSON.stringify(list));
    return list;
  }

  function recordPack() {
    const packs = new Set(load(PACKS_KEY) || []);
    packs.add(pack.id);
    const list = [...packs];
    localStorage.setItem(PACKS_KEY, JSON.stringify(list));
    return list;
  }

  // Idempotent, so replaying a saved finished day awards nothing twice.
  function awardBadges(stats, rating, beaten) {
    if (archive) return;
    const totals = state.runs.map((r) => r.total);
    const ctx = {
      played: stats.played,
      streak: stats.streak,
      perfects: stats.perfects,
      pct: rating.pct,
      paws: rating.paws,
      runs: totals.length,
      beaten,
      climbing: totals.length === RUNS && totals.every((t, i) => i === 0 || t > totals[i - 1]),
      menagerie: recordSeen().length >= ANIMALS.length,
      everyPack: recordPack().length >= PACKS.length,
    };
    const earned = loadBadges();
    const fresh = [];
    for (const b of BADGES) {
      if (!(b.id in earned) && b.test(ctx)) {
        earned[b.id] = day;
        fresh.push(b);
      }
    }
    if (fresh.length) {
      localStorage.setItem(BADGES_KEY, JSON.stringify(earned));
      fresh.forEach(queueToast);
    }
  }

  /* ---------- toasts ---------- */

  const toastQueue = [];
  let toastShowing = false;

  function queueToast(badge) {
    toastQueue.push(badge);
    if (!toastShowing) nextToast();
  }

  function nextToast() {
    const b = toastQueue.shift();
    if (!b) { toastShowing = false; return; }
    toastShowing = true;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML =
      `<span class="seal">${b.seal}</span>` +
      '<span class="toast-text">' +
      '<span class="toast-eyebrow">Commendation earned</span>' +
      `<span class="toast-name">${b.name}</span></span>`;
    $('#toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { el.remove(); nextToast(); }, 300);
    }, 3800);
  }

  function renderBadges() {
    const earned = loadBadges();
    $('#badgeCount').textContent = `${Object.keys(earned).length} of ${BADGES.length}`;
    const ul = $('#badgeList');
    ul.innerHTML = '';
    for (const b of BADGES) {
      const got = b.id in earned;
      const li = document.createElement('li');
      li.className = 'badge' + (got ? ' earned' : '')
        + (!archive && earned[b.id] === day ? ' fresh' : '');
      li.innerHTML =
        `<span class="seal">${b.seal}</span>` +
        '<span class="badge-text">' +
        `<span class="badge-name">${b.name}</span>` +
        `<span class="badge-desc">${got ? `${b.desc} Earned No. ${earned[b.id] + 1}.` : b.desc}</span>` +
        '</span>';
      ul.appendChild(li);
    }
  }

  /* ---------- rendering ---------- */

  const penEl = $('#pen');
  const gatesEl = $('#gates');
  const ledgerEl = $('#ledger');
  const runBtn = $('#run');
  const clearBtn = $('#clear');
  const afterEl = $('#afterRun');
  const againBtn = $('#again');
  const doneBtn = $('#done');
  const resultsEl = $('#results');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderPen() {
    penEl.innerHTML = '';
    for (const id of puzzle.pen) {
      const a = BY_ID[id];
      const inLine = state.lineup.includes(id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'animal' + (inLine ? ' penned' : '');
      btn.disabled = state.revealing || state.finished ||
        inLine || state.lineup.length >= LINE_SIZE;
      btn.innerHTML =
        `<span class="animal-plate">${faceMark(a, 'animal-face')}</span>` +
        '<span class="animal-text">' +
        `<span class="animal-name">${a.name}</span>` +
        `<span class="animal-power">${a.power}</span></span>`;
      btn.addEventListener('click', () => {
        state.lineup.push(id);
        render();
      });
      penEl.appendChild(btn);
    }
  }

  function renderGates() {
    gatesEl.innerHTML = '';
    // The rail keeps count: the line so far is scored live, so every gate
    // shows what the score becomes after its creature acts.
    const preview = state.lineup.length ? playLineup(state.lineup, puzzle.start) : null;
    for (let i = 0; i < LINE_SIZE; i++) {
      const li = document.createElement('li');
      const id = state.lineup[i];
      if (id) {
        const a = BY_ID[id];
        const step = preview.steps[i];
        const times = step.times > 1 ? `<b class="gate-times">×${step.times}</b>` : '';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gate-pick';
        btn.disabled = state.revealing || state.finished;
        btn.title = `Send ${a.name} back to the pen`;
        btn.innerHTML = `${faceMark(a, 'gate-face')}<span class="gate-name">${a.name}</span>` +
          `<span class="gate-score">${times}${step.after}</span>`;
        btn.addEventListener('click', () => {
          state.lineup.splice(i, 1);
          render();
        });
        li.appendChild(btn);
      } else {
        li.className = 'gate-empty';
        li.textContent = i + 1;
      }
      gatesEl.appendChild(li);
    }
    const totalEl = $('#lineTotal');
    totalEl.hidden = !preview;
    if (preview) {
      totalEl.innerHTML = `the line stands at <b>${preview.total}</b>` +
        (preview.stash > 0 ? ` <span class="stash-note">(stash of ${preview.stash} back in)</span>` : '');
    }
  }

  function renderRuns() {
    const marks = [];
    for (let i = 0; i < RUNS; i++) {
      const r = state.runs[i];
      const masked = state.revealing && i === state.runs.length - 1;
      marks.push(r ? `<span class="run-mark used">${masked ? '…' : r.total}</span>`
                   : '<span class="run-mark"></span>');
    }
    $('#runMarks').innerHTML = marks.join('');
  }

  function render() {
    renderPen();
    renderGates();
    renderRuns();
    const picked = state.lineup.length;
    $('#penCount').textContent = state.finished ? 'closed for the day'
      : picked === 0 ? `pick ${LINE_SIZE} of ${PEN_SIZE}`
      : `${picked} of ${LINE_SIZE} in the line`;
    runBtn.disabled = picked !== LINE_SIZE || state.revealing || state.finished;
    clearBtn.hidden = picked === 0 || state.revealing || state.finished;
    $('#board').classList.toggle('closed', state.finished);
  }

  /* ---------- the reveal ---------- */

  function stepRow(step, animate) {
    const a = BY_ID[step.id];
    const row = document.createElement('div');
    row.className = 'ledger-row' + (animate ? ' drop' : '');
    const times = step.times > 1 ? `<span class="times">×${step.times}</span>` : '';
    const stashNote = step.stashed > 0 ? `<span class="stash-note">stashed ${step.stashed}</span>` : '';
    row.innerHTML =
      `<span class="ledger-animal">${faceMark(a, 'ledger-face')}${a.name}${times}</span>` +
      `${stashNote}<span class="ledger-score">${step.before} → <b>${step.after}</b></span>`;
    return row;
  }

  function stashRow(result, animate) {
    const row = document.createElement('div');
    row.className = 'ledger-row stash-return' + (animate ? ' drop' : '');
    row.innerHTML =
      `<span class="ledger-animal">${iconMark('stash', 'ledger-face') || '\u{1F43F}\u{FE0F} '}The stash comes back</span>` +
      `<span class="ledger-score">${result.beforeStash} + ${result.stash} → <b>${result.total}</b></span>`;
    return row;
  }

  function totalRow(total, animate) {
    const row = document.createElement('div');
    row.className = 'ledger-total' + (animate ? ' drop' : '');
    row.innerHTML = `<span>Run ${state.runs.length}</span><b>${total}</b>`;
    return row;
  }

  function showLedger(result, animate, done) {
    ledgerEl.innerHTML = '';
    ledgerEl.hidden = false;
    const rows = result.steps.map((s) => stepRow(s, animate));
    if (result.stash > 0) rows.push(stashRow(result, animate));
    rows.push(totalRow(result.total, animate));
    if (!animate) {
      rows.forEach((r) => ledgerEl.appendChild(r));
      done();
      return;
    }
    let i = 0;
    (function next() {
      if (i >= rows.length) { done(); return; }
      ledgerEl.appendChild(rows[i]);
      i++;
      setTimeout(next, i >= rows.length ? 350 : 620);
    })();
  }

  function releaseHerd() {
    if (state.lineup.length !== LINE_SIZE) return;
    const lineup = state.lineup.slice();
    const result = playLineup(lineup, puzzle.start);
    state.runs.push({ lineup, total: result.total });
    state.revealing = true;
    afterEl.hidden = true;
    render();
    saveDay();
    showLedger(result, !reducedMotion, () => {
      state.revealing = false;
      state.lineup = [];
      if (state.runs.length >= RUNS) {
        finish();
      } else {
        againBtn.textContent = `Herd again · ${RUNS - state.runs.length} run${RUNS - state.runs.length === 1 ? '' : 's'} left`;
        afterEl.hidden = false;
        render();
      }
    });
  }

  /* ---------- the result ---------- */

  function finish() {
    state.finished = true;
    afterEl.hidden = true;
    saveDay();
    render();

    const best = bestRun();
    const rating = rate(best, optimal);
    const beaten = percentBeaten(best, puzzle.solution.scores);
    const stats = recordFinish(rating.pct);

    $('#finalScore').textContent = best;
    $('#finalOptimal').textContent = optimal;
    const paw = iconMark('paw', 'paw-mark');
    if (paw) $('#rosette').innerHTML = paw.repeat(rating.paws);
    else $('#rosette').textContent = '\u{1F43E}'.repeat(rating.paws);
    $('#ratingName').textContent = rating.name;
    $('#ratingPct').textContent =
      rating.pct >= 100
        ? 'The perfect run. It gets no better than this.'
        : `${rating.pct}% of the perfect run · beats ${beaten}% of all 2,520 possible runs.`;

    $('#statPlayed').textContent = stats.played;
    $('#statStreak').textContent = stats.streak;
    $('#statPerfects').textContent = stats.perfects;
    $('#statAvg').textContent = stats.played ? Math.round(stats.totalPct / stats.played) + '%' : '—';
    $('#dayStats').hidden = archive;

    awardBadges(stats, rating, beaten);
    const earned = loadBadges();
    const fresh = archive ? [] : BADGES.filter((b) => earned[b.id] === day);
    $('#newBadges').hidden = fresh.length === 0;
    $('#newBadges').textContent = fresh.length
      ? `New commendation${fresh.length === 1 ? '' : 's'}: ${fresh.map((b) => b.name).join(' · ')}`
      : '';
    renderBadges();

    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  /* ---------- share ---------- */

  // Plain punctuation only — em dashes and middle dots garble in some
  // messaging apps, so the shared text sticks to ASCII plus emoji.
  function shareText() {
    const rating = rate(bestRun(), optimal);
    const runsUsed = state.runs.length;
    const lines = [`\u{1F43E} Herded No. ${day + 1}`];
    lines.push(rating.pct >= 100
      ? `The perfect run through ${pack.name}, in ${runsUsed} run${runsUsed === 1 ? '' : 's'}`
      : `${rating.pct}% of the perfect run through ${pack.name}, in ${runsUsed} run${runsUsed === 1 ? '' : 's'}`);
    lines.push('\u{1F43E}'.repeat(rating.paws));
    const s = loadStats();
    if (!archive && s.streak > 1) lines.push(`\u{1F4C8} ${s.streak} days running`);
    const earned = loadBadges();
    const fresh = archive ? [] : BADGES.filter((b) => earned[b.id] === day).map((b) => b.name);
    if (fresh.length) lines.push(`\u{1F3C5} ${fresh.join(', ')}`);
    lines.push('', 'https://jonezzyboy.github.io/herded/');
    return lines.join('\n');
  }

  const shareBtn = $('#share');
  const canShare = typeof navigator.share === 'function';
  const shareLabel = canShare ? 'Share result' : 'Copy result';
  shareBtn.textContent = shareLabel;

  function flashShare(msg) {
    shareBtn.textContent = msg;
    setTimeout(() => { shareBtn.textContent = shareLabel; }, 2000);
  }

  shareBtn.addEventListener('click', async () => {
    const text = shareText();
    if (canShare) {
      try { await navigator.share({ text }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(text);
      flashShare('Copied');
    } catch {
      flashShare('Could not copy');
    }
  });

  /* ---------- the field you play on ---------- */

  const THEMES = [
    { id: '', name: 'Dusk pasture', field: '#251c10', card: '#f4ecd7' },
    { id: 'meadow', name: 'Meadow', field: '#dbe6c6', card: '#fbf8ec' },
    { id: 'hayloft', name: 'Hayloft', field: '#e7d7a9', card: '#fdf9ee' },
    { id: 'moorland', name: 'Moorland', field: '#2a2434', card: '#f0ecf4' },
    { id: 'frostfield', name: 'Frostfield', field: '#dee7e9', card: '#fbfcfa' },
    { id: 'midnight', name: 'Midnight barn', field: '#0e1113', card: '#1b2124' },
  ];

  let themeId = localStorage.getItem(THEME_KEY) || '';
  if (!THEMES.some((t) => t.id === themeId)) themeId = '';

  const themeBtn = $('#theme');
  const themeMenu = $('#themeMenu');

  function themeChip(t) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = t.field;
    const leaf = document.createElement('span');
    leaf.className = 'chip-leaf';
    leaf.style.background = t.card;
    chip.appendChild(leaf);
    return chip;
  }

  function applyTheme() {
    if (themeId) document.documentElement.dataset.theme = themeId;
    else delete document.documentElement.dataset.theme;
    const label = document.createElement('span');
    label.className = 'theme-label';
    label.textContent = 'Field';
    themeBtn.innerHTML = '';
    themeBtn.append(themeChip(THEMES.find((t) => t.id === themeId)), label);
  }

  function closeThemeMenu() {
    themeMenu.hidden = true;
    themeBtn.setAttribute('aria-expanded', 'false');
  }

  function renderThemeMenu() {
    themeMenu.innerHTML = '';
    for (const t of THEMES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(t.id === themeId));
      if (t.id === themeId) b.classList.add('selected');
      const name = document.createElement('span');
      name.textContent = t.name;
      b.append(themeChip(t), name);
      b.addEventListener('click', () => {
        themeId = t.id;
        localStorage.setItem(THEME_KEY, themeId);
        applyTheme();
        closeThemeMenu();
      });
      themeMenu.appendChild(b);
    }
  }

  themeBtn.addEventListener('click', () => {
    if (themeMenu.hidden) {
      renderThemeMenu();
      themeMenu.hidden = false;
      themeBtn.setAttribute('aria-expanded', 'true');
    } else {
      closeThemeMenu();
    }
  });

  document.addEventListener('click', (e) => {
    if (!themeMenu.hidden && !themeMenu.contains(e.target) && !themeBtn.contains(e.target)) {
      closeThemeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeThemeMenu();
  });

  applyTheme();

  /* ---------- wiring ---------- */

  runBtn.addEventListener('click', releaseHerd);
  clearBtn.addEventListener('click', () => { state.lineup = []; render(); });
  againBtn.addEventListener('click', () => {
    afterEl.hidden = true;
    ledgerEl.hidden = true;
    render();
  });
  doneBtn.addEventListener('click', finish);

  /* ---------- boot ---------- */

  $('#issue').textContent = `No. ${day + 1}`;
  $('#pack').textContent = pack.name;
  const shownDate = archive ? new Date(EPOCH.y, EPOCH.m, EPOCH.d + day) : new Date();
  $('#date').textContent = shownDate.toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  $('#archiveNote').hidden = !archive;
  $('#startScore').textContent = puzzle.start;
  renderBadges();
  renderShelfTicks();

  function tickClock() {
    const ms = msToMidnight();
    const h = Math.floor(ms / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    $('#clock').textContent = `${h}h ${String(m).padStart(2, '0')}m`;
  }
  tickClock();
  setInterval(tickClock, 30e3);

  const saved = archive ? null : load(DAY_KEY);
  if (saved && saved.day === day) {
    state.runs = saved.runs || [];
    state.finished = !!saved.finished;
    if (state.finished) {
      const best = state.runs.slice().sort((a, b) => b.total - a.total)[0];
      if (best) showLedger(playLineup(best.lineup, puzzle.start), false, () => {});
      finish();
    } else if (state.runs.length >= RUNS) {
      finish();
    } else if (state.runs.length > 0) {
      const last = state.runs[state.runs.length - 1];
      showLedger(playLineup(last.lineup, puzzle.start), false, () => {});
      againBtn.textContent = `Herd again · ${RUNS - state.runs.length} run${RUNS - state.runs.length === 1 ? '' : 's'} left`;
      afterEl.hidden = false;
    }
  }
  render();
})();
