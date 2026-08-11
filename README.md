# Herded

Seven animals in the pen, five through the gate — order is everything.

A daily puzzle game. Every animal bends the score its own way: elephants add,
rabbits double, foxes make the next animal act twice, snakes reverse the
score's digits, squirrels stash half of it for safekeeping. Pick five of the
day's seven animals and send them through the gate in the order that makes
the most of them.

Everyone gets the same pen and the same starting score. You get three runs;
your best is measured against the day's one perfect run — found by brute
force over all 2,520 possible lines.

**Play it: <https://jonezzyboy.github.io/herded/>**

## How it works

- `game.js` — the roster, the line engine, the brute-force solver, the
  deterministic daily generator, and the browser UI. The daily pen is seeded
  from the day number and rejected until it passes quality gates (a perfect
  run worth hunting for, rare enough that order genuinely matters, with real
  branching between outcomes).
- No build step, no dependencies. Static files served by GitHub Pages.
- A past day can be replayed with `?day=N` (No. 1 is `day=0`) — practice
  only, stats untouched.

## Running locally

```sh
npm start     # serves on http://localhost:8000
npm test      # engine, solver, and 3 years of generated days
```
