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
   effect executed that many times back to back, so doublers compound. */

const LINE_SIZE = 5;
const PEN_SIZE = 7;
const RUNS = 3;

const ANIMALS = [
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
    act(s) { const h = Math.floor(s.score / 2); s.stash += h; s.score -= h; } },
  { id: 'wolf', emoji: '\u{1F43A}', name: 'Wolf',
    power: 'Adds 12 for every animal before it in line.',
    act(s, ctx) { s.score += 12 * ctx.pos; } },
];

const BY_ID = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

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
  for (let attempt = 0; attempt < 50; attempt++) {
    const rng = mulberry32(((dayIndex + 1) * 2654435761) ^ (attempt * 40503 + 17));
    const start = 5 + Math.floor(rng() * 25);
    const pen = shuffle(ANIMALS.map((a) => a.id), rng).slice(0, PEN_SIZE);
    const sol = solve(pen, start);
    const median = sol.scores[sol.scores.length >> 1];
    if (sol.best < 150) continue;
    if (sol.bestCount > 40) continue;
    if (sol.best < median * 1.5) continue;
    return { day: dayIndex, start, pen, solution: sol };
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
   { played, streak, perfects, pct, paws, runs, beaten, climbing, menagerie }. */

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
  { id: 'whole-menagerie', seal: `${ANIMALS.length}`, name: 'The Whole Menagerie',
    desc: `Send all ${ANIMALS.length} animals through the gate.`,
    test: (c) => c.menagerie },
  { id: 'hundred-herds', seal: '100', name: 'Hundred Herds',
    desc: 'Herd one hundred days in all.',
    test: (c) => c.played >= 100 },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ANIMALS, BY_ID, LINE_SIZE, PEN_SIZE, RUNS, BADGES,
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

  const DAY_KEY = 'herded-day-v1';
  const STATS_KEY = 'herded-stats-v1';
  const BADGES_KEY = 'herded-badges-v1';
  const SEEN_KEY = 'herded-seen-v1';
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
        `<span class="animal-face">${a.emoji}</span>` +
        `<span class="animal-name">${a.name}</span>` +
        `<span class="animal-power">${a.power}</span>`;
      btn.addEventListener('click', () => {
        state.lineup.push(id);
        render();
      });
      penEl.appendChild(btn);
    }
  }

  function renderGates() {
    gatesEl.innerHTML = '';
    for (let i = 0; i < LINE_SIZE; i++) {
      const li = document.createElement('li');
      const id = state.lineup[i];
      if (id) {
        const a = BY_ID[id];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gate-pick';
        btn.disabled = state.revealing || state.finished;
        btn.title = `Send ${a.name} back to the pen`;
        btn.innerHTML = `<span class="gate-face">${a.emoji}</span><span class="gate-name">${a.name}</span>`;
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
    runBtn.disabled = state.lineup.length !== LINE_SIZE || state.revealing || state.finished;
    clearBtn.hidden = state.lineup.length === 0 || state.revealing || state.finished;
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
      `<span class="ledger-animal">${a.emoji} ${a.name}${times}</span>` +
      `${stashNote}<span class="ledger-score">${step.before} → <b>${step.after}</b></span>`;
    return row;
  }

  function stashRow(result, animate) {
    const row = document.createElement('div');
    row.className = 'ledger-row stash-return' + (animate ? ' drop' : '');
    row.innerHTML =
      `<span class="ledger-animal">\u{1F43F}\u{FE0F} The stash comes back</span>` +
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
    $('#rosette').textContent = '\u{1F43E}'.repeat(rating.paws);
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

  function shareText() {
    const rating = rate(bestRun(), optimal);
    const runsUsed = state.runs.length;
    const lines = [
      `Herded No. ${day + 1} ${'\u{1F43E}'.repeat(rating.paws)}`,
      rating.pct >= 100
        ? `The perfect run, in ${runsUsed} run${runsUsed === 1 ? '' : 's'}`
        : `${rating.pct}% of the perfect run, in ${runsUsed} run${runsUsed === 1 ? '' : 's'}`,
      'https://jonezzyboy.github.io/herded/',
    ];
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
  const shownDate = archive ? new Date(EPOCH.y, EPOCH.m, EPOCH.d + day) : new Date();
  $('#date').textContent = shownDate.toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  $('#archiveNote').hidden = !archive;
  $('#startScore').textContent = puzzle.start;
  renderBadges();

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
