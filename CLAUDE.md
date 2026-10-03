# kid-games

Plain HTML/CSS/JS games served by GitHub Pages from `main` at https://mlcassara-ai.github.io/kid-games/. No build step, no JS libraries. Games: `language-quest/` (active work), `math-quest/`, `castle-quest/`, `lake-legends/`, `beat-the-bully/`, plus the hub `index.html`.

**Read `HANDOFF.md` in the repo root before non-trivial work.** It holds the full architecture, external resources, decisions, and backlog. It is deliberately excluded from git (it names children and family members and this repo is public) — never commit it or copy personal details from it into tracked files.

## Working with the owner

- He does not edit code or config himself. Make the edits directly; give copy/paste commands only when he must run something, and say which machine and window (Mac "Michaels-Mini" or the Ubuntu box "trg").
- Walk him through unfamiliar web setups step by step.
- Verify after every release rather than assuming it worked.
- Use the personal GitHub account `mlcassara-ai` and Google account `mlcassara@gmail.com` only — never the Westport Solutions work accounts.
- Don't spend real money without asking. Show and explain any Firebase rules change before publishing it.
- When brainstorming, don't change files unless asked.

## Language Quest

Prodigy-style click-to-move world teaching Modern Standard Arabic with full harakat. Built for a remote children's class and the owner's kids. Primary target is iPad Safari; Mac Chrome/Safari and mouse/trackpad must work too.

- `index.html` — world map (canvas), zones, Letter Friends quest.
- `lq-core.js` — shared engine (`window.LQ`): players, picture locks, parent PIN, Parent Corner, Firestore sync, class families, auto-update.
- `alphabet/` Alphabet School (the 28 letters on their own: names, sounds, order), `letters/` Letter Dunes, `falls/` Sound Falls, `souq/` the Souq (numbers, counting and the Tailor), `harbor/` Story Harbor (fill-the-blank stories), `teacher/` teacher dashboard, `voices/` voice picker.
- `music.js` — the map's background music: three tunes (Oasis Morning, Evening Breeze, Playtime) synthesised live with Web Audio (no audio files); loaded by the map only. Voice and music volumes are separate, set from the map's 🔊 menu and remembered on the device.
- `words.json` — list of every spoken Arabic phrase for audio generation. The game never reads it.

### Release checklist

1. Bump the version (`YYYY.MM.DD` + letter, next letter for same-day releases) to the same string in:
   - `language-quest/version.json`
   - `window.LQ_VER="…"` and `lq-core.js?v=…` in `index.html`, `alphabet/index.html`, `letters/index.html`, `falls/index.html`, `souq/index.html`, `harbor/index.html`, `teacher/index.html`
   `/usr/bin/python3 language-quest/tools/release.py` does all of this in one step; a new zone page must be added to its `PAGES` list.
2. Test locally: `python3 -m http.server` from the repo root, then `http://localhost:8000/language-quest/`.
3. Commit and push; confirm Pages serves the new `version.json`.
4. If any spoken Arabic text changed, update `words.json` and regenerate audio (see below).

### Audio

- Clips live at `https://storage.googleapis.com/kid-games-dc068-voices/lq/ar-XA-Chirp3-HD-Puck/<key>.mp3`, where `<key>` is the FNV-1a 32-bit hash (8 hex chars) of the exact UTF-8 text. Any change to the text, including harakat, changes the key.
- Words and phrases: voice `ar-XA-Chirp3-HD-Puck`, rate 0.85. Texts of 2 or fewer base characters: `ar-XA-Wavenet-C`, rate 0.8, uploaded over the same filename (Chirp3-HD returns silent clips for single syllables).
- Device `speechSynthesis` is the fallback only. On iPad, speech must start inside a `pointerup` handler.
- Generate with `/usr/bin/python3 language-quest/tools/gen_audio.py` (`--check` lists missing clips, no flag records and uploads only the missing ones, `--all` re-records everything). Needs `gcloud` signed in as the personal Google account.

### Backend

- Firebase project `kid-games-dc068`, shared by Math Quest, Castle Quest and Language Quest: anonymous auth and Firestore over REST, one `families` collection. Doc id prefixes: `f_` Math Quest, `cq_` Castle Quest, `lq_` Language Quest families, `lq_class` teacher docs.
- Access control is possession of a long random code. Never put a real family code or teacher key in a tracked file.
- Sync rule: only re-stamp a player's `upd` when that player's data actually changed, or an idle tab on another device overwrites progress.
- Don't change Firestore rules or anything that could break Math Quest or Castle Quest saves.

### Diagnostics

- Each player's save carries `trail` (last 30 screens opened) and `errs` (last 10 page errors and freezes). Every screen function calls `LQ.mark("…")` first; a new screen must do the same, before any heavy work, so a freeze is attributed to it.
- Parents and the teacher see both under a child's details. To read a family's save from the terminal: `/usr/bin/python3 language-quest/tools/peek.py FAMILY-CODE` (read-only; never store the code in a file).
- This stays inside the family's own save. Do not add third-party analytics or send it anywhere else.

### Rules that must hold

- First names only; no emails, birthdays or surnames. Kids cannot create players.
- No analytics, ads, trackers or third-party scripts beyond Google Fonts and Firebase/Google APIs.
- Letter forms and standalone marks are shown with tatweel (U+0640), not ZWJ or the dotted circle.
- Letter Friends characters are original; don't copy Siraj characters, songs or art.
- Keep the "Farms of Palestine" biome.
- Reuse Math Quest's proven patterns (accounts, sync, updater) rather than inventing new ones.

## Math Quest

Adaptive math battles plus a village of side activities, for grades 1–12 and adults. Same devices as Language Quest. The detailed handoff is `MATH-QUEST-HANDOFF.md` in the repo root (private, excluded from git like `HANDOFF.md`).

- `math-quest/index.html` — the whole core game (about 765 KB, many very long single lines; edit with exact-match scripted replacements, never retype blocks).
- Add-ons are separate `.js` files loaded in order by the `document.write` loader line near the top of `index.html`. A new file must be added to that line.
- `daily.js` — Today's Adventure, pet tricks, camp packing and tied sacks.
- `truck.js` — Food Truck; hidden (no opening date) unless the device opened the game with `?truck=1`; `?truck=0` hides it again.
- `district.js` — Discovery District, a second walkable map reached by train (its techno music lives in `music.js`), with its own map drawing; hidden unless the device opened the game once with `?district=1`.
- `physics.js` — the district's five physics zones (Balance Bay, Motion Mountain, Echo Canyon, Circuit City, Float or Sink Lagoon): 6 stops each, 5 rounds per stop (boss 6), numbers set by grade tier; saved in `p.phys`. Opened from the zone signs in the district.
- `battlepets.js` + `battle-pets.html` — Battle Pets, a test only. A plaza building opens the prototype page in a frame; it gives no coins or prizes. Shown only for heroes switched on in Parent Corner (`p.bpTest`); it saves that switch and a small play log (`p.bp`, last 40 matches) shown in Parent Corner.
- `cave.js` + `cave-data.js` — the Science Cave. Includes the Core Keeper: a hero who owns the Core Suit (the sixth suit) falls from the Mantle to the centre of the Earth and answers science questions; before that Dr. Quartz only hints. `cave-test.html` is a standalone test page for the cave (`?core=1` / `?core=again` start the fall).
- `tools/smoke.py` + `tools/smoke.html` — the smoke test.

### Release checklist

1. Run `/usr/bin/python3 math-quest/tools/smoke.py` on its own (never piped or chained with `|`, which hides its exit code). It must print `RESULT: PASS`. Add a test there when a new feature or bug fix would otherwise go unchecked.
2. Bump the version (`YYYY.MM.DD` + letter) to the same string in `math-quest/version.json` and `APP_VER` in `math-quest/index.html`. Add-ons are cached by `?v=APP_VER`, so any change to a game file needs a bump (files under `tools/` do not).
3. Release from a separate git worktree based on `origin/main`, not from this folder: the Language Quest session shares this checkout and may have unpublished work on `main`.
4. Push, then confirm Pages serves the new `version.json` and that the changed files match byte for byte.

### Rules that must hold

- Never reset or wipe a kid's progress. Migrations only add or raise.
- The whole family syncs as one Firestore document (1 MiB limit): keep per-player data small, and never put bulk data in synced state.
- No regex lookbehind (`(?<=`, `(?<!`): it stops the whole script parsing on Safari older than 16.4.
- Add-on files run before the core script, so they may only touch core globals inside functions or after a deferred `reg()` wait. Avoid top-level names that already exist in the file being edited (`pk`, `pick`, `P`, `B`).
- Stories, notes and long text are never read aloud automatically; grades 1–2 hear questions and short lines automatically. No emoji are read aloud.
- A wrong answer never takes away something already earned.
- Never hold a player object (`P()`, `p.adv`, `p.tad`…) across a wait such as a question popup or a timer. An online sync replaces player objects, so anything written to the old one is lost. Fetch `P()` again inside the callback. The smoke test cannot see this unless a test swaps the player mid-flow (see the adventure test).
