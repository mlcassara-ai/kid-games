# kid-games

Plain HTML/CSS/JS games served by GitHub Pages from `main` at https://mlcassara-ai.github.io/kid-games/. No build step, no JS libraries. Games: `language-quest/` (active work), `math-quest/`, `castle-quest/`, `lake-legends/`, `beat-the-bully/`, `heritage-night/`, plus the hub `index.html`.

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
- Map speed: the map draws slow things once and reuses them (ground tiles, pictures of props, emoji, buildings and signboards; see "speed" in `index.html`). Anything that animates must stay out of those pictures. `?fps=1` once on a device shows the frame rate (`?fps=0` hides it).
- Testing switch: opening `letters/?unlock=1` once opens every Letter Dunes camp on that device (`?unlock=0` locks them again); no save changes.
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
- Testers can send a problem or suggestion with the 🐞 Report button on every page. It is saved in the player's own save (`reports`, last 30) with the screen and version, shown in the Parent Corner details and printed by `peek.py`.
- To send a player a note in the game: `/usr/bin/python3 language-quest/tools/send_note.py FAMILY-CODE "Name" "Message" --from Michael`. It shows the next time that player is signed in and stays until they tap Read ✓. `send_note.py FAMILY-CODE --list` shows each note and when it was read. Notes live in their own doc `families/lqm_<code>` so an older game version can't overwrite them.
- This stays inside the family's own save. Do not add third-party analytics or send it anywhere else.

### Rules that must hold

- First names only; no emails, birthdays or surnames. Kids cannot create players.
- No analytics, ads, trackers or third-party scripts beyond Google Fonts and Firebase/Google APIs.
- Letter forms and standalone marks are shown with tatweel (U+0640), not ZWJ or the dotted circle.
- Letter Friends characters are original; don't copy Siraj characters, songs or art.
- Keep the "Farms of Palestine" biome.
- Reuse Math Quest's proven patterns (accounts, sync, updater) rather than inventing new ones.

## Math Quest

All Math Quest notes (files, release checklist, rules that must hold) are in `math-quest/CLAUDE.md`. Read it before any Math Quest work, and keep Math Quest notes there, not here.

## Lake Legends

Fishing game for ages 8–12 on six real San Diego County lakes; just for fun (not educational). Primary targets are iPad Safari and iPhone; Mac Chrome/Safari must work too.

- `lake-legends/index.html` — the whole game (data tables near the top, then save, sound, fish painting, screens, fishing loop, rendering, Lodge/Derby, players). Edit with exact-match scripted replacements; the base64 icons in `<head>` are huge, never print them.
- `lake-legends/ll-core.js` — players, secret-picture locks, parent PIN, Parent Corner, online save (`families/ll_<code>`, same pattern as `lq-core.js`) and auto-update. Each player's game is `player.game`; the game's `S` points at it and `save()` goes through `LL.save()`.
- `lake-legends/README.md` — the player-facing feature list. Keep it current with every feature.
- The play area takes the screen's shape (`layout()`: `W` 480–1280, `H` 720 or taller on phones). `W`/`H` are variables; `SW` is the narrowest width. Anything cached by width (shore art) is keyed by `W`.
- A new save field goes in `defaultSave()`; `normalizeSave()` fills it into old saves. Never lower anything already earned.
- Function names must be unique in the file (a duplicate silently replaces the earlier one), and one syntax error stops the whole game.
- Fish follow the bait only inside `fishBand()` (their species depth band, and at most about 8 ft above where they were swimming; an occasional bold bass or trout 18 ft). Keep it that way so fish can't be teased to the surface.
- 🐞 Report (`LL.report()`) saves `reports` (last 30) in the player record with the screen and version; the Parent Corner shows them. To read a family's save from the terminal: `/usr/bin/python3 lake-legends/tools/peek.py FAMILY-CODE` (read-only; never store the code in a file).
- When a report is dealt with, answer it so the player gets a popup: `/usr/bin/python3 lake-legends/tools/reply.py FAMILY-CODE --list` shows every report numbered with its answer and whether it was seen; `reply.py FAMILY-CODE N "Message"` answers report N (`--status fixed|added|thanks`; the default is fixed for problems, added for suggestions); `reply.py FAMILY-CODE --note "Name" "Message"` sends a plain note. Replies live in `families/llm_<code>` so the game's own sync can't overwrite them; the popup waits until the player isn't mid-cast, and tapping it records `readBy`.
- Prizes: `MILESTONES` (the prize ladder; coins plus prize-only items marked `prize:` in HATS/RODS/PAINTS) are checked in `save()`; announcements queue in `prizeQueue` and pop up only between casts. Prizes from home live in the player record (`pprizes`, removals in `pdel`); `mergePrizes()` in ll-core combines both copies on sync so a prize set on a parent's phone isn't lost while the kid plays elsewhere.
- Sound: three buses (`BUS.sfx`, `BUS.music`, `BUS.amb`) with per-device volumes in `localStorage["lakelegends.audio"]`; `S.sound` is the player's on/off. Music (`musicTick`) and lake sounds (`ambTick`) are synthesised live; `navigator.audioSession.type = "playback"` lets iPads play with the silent switch on.
- Installable as an app: `manifest.json` plus `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `apple-touch-icon.png` (drawn by `node lake-legends/tools/icons.js` with the game's own fish painter). The title's "💻 Get the app" uses the browser's install prompt where there is one (Chrome/Edge) and shows steps otherwise (Safari: File → Add to Dock; iPad: Share → Add to Home Screen). Safari web apps keep their own storage, so families join with their code there.
- The ocean (`LAKES` entry `ocean`, Oceanside Pier) comes after Lower Otay and is deliberately hard so it can't be raced through: it needs the Saltwater Rod & Reel (`S.saltRod`, 2,500 coins); salt baits (`salt:true`) only work there and `FRESH_ONLY` baits don't (`baitHere`); the pier uses `pierDepth`; the charter always costs `L.boat` and is the only place `boatFish` spawn. Ocean species are listed in `OCEAN_DEX`, not `DEX_ORDER`, so the 15-fish Fishdex goals are unchanged. Sharks, rays, the guitarfish and the halibut have their own painters (`ODD_PAINT`).
- Dock Showdowns (`SD_TIERS`, `RIVALS`, `startShowdown`, `sdUpdate`, `sdFinish`) live in `visit.sd`; the clock only runs while fishing. Rivals are drawn with `drawAngler` through a pseudo-trip that has `ax` and `who`. Events (frenzy `visit.ev`, storm `visit.weather.storm`, `stockDay`, `tagInfo`, `fullMoon`), extra gear (`GEAR`, the rod holder `visit.holder`), the cabin (`S.cabin`, `CABIN_UPS`) and rewards (`PATCHES`, `VLURES` in `S.vl`, `S.tmap`, `S.sponsor`, `S.cards`) are all in `index.html`; their Lodge sections come from `lodgeExtras()`.
- Fish moves (`MOVES`, `MOVES_BY_SHAPE`/`MOVES_BY_FISH`, `moveTick`, `moveEffect`, `moveWant`) run on `trip.move` in the reel and fight phases; a wrong response raises `trip.strain` (100 = the hook is thrown, gentler for a player's first 10 moves). Handled moves count in `S.moves` and wear the fish (`f.worn`). No moves on a tired fish. Boat hotspots (`SPOTS`, `visit.spots`, `visit.spot`, `spotTick`, `goSpot`, `spotFish`) add fish for `SPOT_CASTS` casts. The smoke bot answers moves via `moveWant`.
- When a new version is published, a "Tap to update" notice appears just above the reel button; tapping it saves, reloads and lands on the title screen.

### Release checklist

1. Run `node lake-legends/tools/smoke.js` on its own (fakes Firebase, plays the game in headless Chromium). It must print `RESULT: PASS`. Add a check there for each new feature.
2. `/usr/bin/python3 lake-legends/tools/release.py` bumps `version.json`, `window.LL_VER` and `ll-core.js?v=` together.
3. Commit, push to `main`, and confirm the Pages build succeeded and serves the new `version.json`.

## Heritage Night (Discover Lebanon)

A live classroom-event quiz: one big screen plus any number of phones, no host. Not linked from the hub on purpose.

- `heritage-night/screen.html` — the TV page (1920×1080, sized in vh). Left 3/4: fact card → question → answer reveal, with a round countdown clock in the top bar for each part (seconds left; gold fact, red question that pulses in its last 5 s, green answer). Bottom of the stage: the Kids vs Grown-ups tug-of-war (`renderTug`). Right 1/4 takes turns (`viewFor`): 🧒 Kids on even questions, 🧑 Grown-ups (blue) on odd ones during the fact and question, Kids on every answer reveal; the grown-up turn is skipped until a real grown-up joins. Each turn shows "Playing Now" (players of that group who answered one of the last 5 questions, ranked by all-night points, up to 12), the ⭐ All-night stars strip (top 3 of that group for the night), the "N playing" count, a small "Scan to play!" QR code (inline SVG of the phone URL `https://mlcassara-ai.github.io/kid-games/heritage-night/`; regenerate with Python `qrcode` if the URL ever changes). Join toasts bottom-left.
- `heritage-night/index.html` — the phone page: pick one of 16 avatars (`AVATARS`), the game makes a matching name (adjective + the avatar's noun, 🎲 to re-roll; nothing is typed, so no bad words), then the grade (TK–5th or Grown-up, `GRADES`, saved as `g`), then fact / four big answer buttons / result with rank. Player kept in localStorage per event.
- `heritage-night/hn-core.js` — shared engine (`window.HN`): the 100 fact+question pairs (`Q`, first option is the right one), names, timing, scoring, Firestore.
- Timing: every device derives the current cycle from the clock alone (`phase()`); fact 13 s, question 4 s (trial; was 10), reveal 3.5 s, except the 10th question of each round whose reveal is 9 s for the Round Champion (`T.champ`; a round is `10*T.cycle - T.reveal + T.champ` long). Question order reshuffles each loop and answer order each cycle with a seeded PRNG so all devices agree. Clocks are lined up with Firestore server time from write responses (`updateTime`); the screen writes `hn_<event>_leaderboard_clock` every 5 min for this.
- Scoring: see Points below (`points()`, `award()`). The phone hides its new score until the reveal; the screen only re-sorts the leaderboard outside the question phase.
- Kids vs Grown-ups tug-of-war: every question is one pull (`pull()`): the side with the higher average points on that question (everyone playing now, i.e. answered this or one of the 5 before; wrong or skipped = 0; plus its robots) moves the rope one notch (`movePos`, −8 grown-ups … +8 kids); kids' average counts ×1.8 (`KID_BONUS`, from a 50-kid/35-adult simulation with the 10 s question: kids win ~63% of nights, ~4 lead changes; retune with the simulation if the question time changes). Each side is topped up to 5 with labelled 🤖 robot helpers (`BOT_FILL`) that are not very smart (`ROBOT_RIGHT` 35%, seeded), never on the leaderboard, and a robots-only win can't give a side the lead. The rope position lives on the screen (localStorage `heritagenight.rope.<event>`); a 🌲 cedar rides the rope with 🧒/🧑/🤖 pullers at the ends.
- `heritage-night/card.html` — printable table cards (two per Letter page, same QR code).
- Kids-only prizes: the big board and the Round Champion is the top kid of the round (`kidsOnly`); grown-ups see their rank among grown-ups on their phone.
- Desktop app: `manifest.json` (opens `screen.html` full screen), `sw.js` (no caching, only makes it installable), icons drawn by `node heritage-night/tools/icons.js`. Bottom-left of the screen: 💻 Install app (Chrome/Edge, when offered); press F for full screen.
- 🔄 Reset (bottom-left of the screen, the mouse pointer shows when moved): `resetAll()` empties all shards under a new game id `z`; a phone whose player has another `z` goes back to join (`startOver`).
- Points: right = 50 + up to 50 for speed; streak +10 from 3 in a row; double ×2.
- Rounds, streaks, double points (all from the cycle number): a round is 10 cycles (`roundOf`, `qInRound`); entries keep `r` (round) and `rs` (round score, 0 unless `r` is the current round). On the reveal of question 10 the screen shows the 🏆 Round Champion overlay (`showChamp`, top 3 by `rs`). The screen's top bar says "Round X · Question Y of 10" and the fact card "Next Round Champion in N questions! 🏆"; "Round X" counts from the first round this screen saw (localStorage, `?round=1` restarts at 1; phones use the absolute round). Streak `st` = right answers in a row (a wrong or missed answer resets it); from 3 in a row each right answer gets +100 and the leaderboard shows 🔥 (`onFire`). About 1 cycle in 8 is ⚡ double points (`isDouble`, seeded), streak bonus included (`award`).
- Backend: same project and pattern as the other games (anonymous auth, Firestore REST, `families` collection, `{data,updated,v}` shape). Players are spread over 8 shard docs `hn_<event>_leaderboard_s0`…`s7` (the rules reject doc ids under 16 characters, hence the padding) (`{p:{pid:{n,a,g,na,r,rs,st,s,c,j,q,k,t}}}`), written with `currentDocument.updateTime` preconditions and retried on conflict. The screen polls all shards every 2.5 s.
- URL switches: `?e=<name>` uses a separate event (separate leaderboard; default `oct2026`, which the QR code uses); `?fast=1` short phases for testing. Use `?e=test` when testing so the real leaderboard stays clean.
- Test: `node heritage-night/tools/smoke.js [screenshotDir]` (fakes Firebase with preconditions and a server clock, skews the screen clock 47 s, three phones, one full question, a 30-player join burst). Must print `RESULT: PASS`.
- Release: no version file; bump `hn-core.js?v=` in both pages when `hn-core.js` changes, push, then open the live screen with `?e=test&fast=1` and one phone to confirm.

