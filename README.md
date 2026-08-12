# Herded

Seven creatures in the pen, five through the gate — order is everything.

A daily puzzle game. Every creature bends the score its own way: some add,
some double, some make the next one act twice, some reverse the score's
digits, some stash half of it for safekeeping. Pick five of the day's seven
and send them through the gate in the order that makes the most of them.

Everyone gets the same pen and the same starting score. You get three runs;
your best is measured against the day's one perfect run — found by brute
force over all 2,520 possible lines.

**Play it: <https://jonezzyboy.github.io/herded/>**

## Packs

Fifty-one creatures in four packs, one pack a day in rotation:

| Pack | Who turns up |
| --- | --- |
| The Farmyard | elephant, fox, parrot, tortoise, squirrel… |
| The Myth | dragon, phoenix, sphinx, ouroboros, cerberus… |
| The Eldritch | star-spawn, the hollow, the beckoner, leviathan… |
| The Cryptids | bigfoot, mothman, nessie, thunderbird, jackalope… |

Packs share the same family of powers at different strengths, so what you
learn about shape carries from one day to the next while the arithmetic never
does. Each pack also keeps a signature of its own — the phoenix trebles the
score instead of doubling if it leads, the hollow halves a score and adds 90,
mothman doubles only from second place.

Powers read the score or the shape of the line — where a creature stands, what
stands beside it, how many follow. None of them read what the *other* creatures
are, which is deliberate: a power counted off the rest of the pen scores the
same wherever you put it, and the game is about order.

## Commendations

Sixteen badges, earned once and kept. Some are for a single good day (find the
perfect run, find it on your first run, beat 99% of all 2,520 line-ups), some
accumulate (herd a week running, five perfect runs, herd a day from every
pack, send every creature in the roster through the gate at least once). They
live under **Commendations** below the board, and new ones are announced with a
toast when the day closes. Replayed past days never earn them.

## Fields

Six colour schemes — Dusk pasture, Meadow, Hayloft, Moorland, Frostfield and
Midnight barn — chosen from the picker in the footer and remembered in
`localStorage`. Each is a set of custom-property overrides on
`:root[data-theme="…"]`; the chosen one is applied by an inline script in
`<head>` so the page never flashes the wrong field.

## How it works

- `game.js` — the packs, the line engine, the brute-force solver, the
  deterministic daily generator, and the browser UI. The day number picks the
  pack; the pen is then seeded from the same number and rejected until it
  passes quality gates (a perfect run worth hunting for, rare enough that
  order genuinely matters, with real branching between outcomes).
- `icons.js` — one SVG mark per creature (plus the stash sack and the paw),
  extracted from [game-icons.net](https://game-icons.net/) (CC BY 3.0;
  artists delapouite, lorc, skoll) and drawn with `currentColor` so they
  follow every field's ink. Attribution lives in the footer. Each animal
  keeps its emoji as a fallback for any creature without a mark.
- No build step, no dependencies. Static files served by GitHub Pages.
- A past day can be replayed with `?day=N` (No. 1 is `day=0`) — practice
  only, stats untouched.

## Running locally

```sh
npm start     # serves on http://localhost:8000
npm test      # engine, solver, and 3 years of generated days
```
