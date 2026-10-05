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

Adaptive math battles plus a village of side activities, for grades 1–12 and adults. Same devices as Language Quest. The detailed handoff is `MATH-QUEST-HANDOFF.md` in the repo root (private, excluded from git like `HANDOFF.md`).

- `math-quest/index.html` — the whole core game (about 765 KB, many very long single lines; edit with exact-match scripted replacements, never retype blocks).
- Add-ons are separate `.js` files loaded in order by the `document.write` loader line near the top of `index.html`. A new file must be added to that line.
- `town.js` — Number Town: the plaza's buildings live inside one Town building on the map (`TOWN_X`/`TOWN_Y` in index.html, 5x3 tiles). Walking in opens Main Street, a swipeable street of drawn shopfronts in five blocks (Learning, Science, Pets, Shops, Fun); each shop calls the same `wNpc(id)` the old building did. The Lab, Train and Food Truck appear as shops only when switched on (their add-ons no longer place map tiles). Red dots: quest marks, the daily spin, gifts; the map building shows the total. Visitors still find the hero on the map, and the Wishing Fountain stands outside in front of the Town. A new place gets a shop in `BLOCKS`, not a map tile.
- `daily.js` — Today's Adventure, pet tricks, camp packing and tied sacks.
- `truck.js` — Food Truck; hidden (no opening date) unless the device opened the game with `?truck=1`; `?truck=0` hides it again.
- `district.js` — Discovery District, a second walkable map reached by train (its techno music lives in `music.js`), with its own map drawing; hidden unless the device opened the game once with `?district=1` (`?district=0` hides it again).
- `physics.js` — the district's five physics zones (Balance Bay, Motion Mountain, Echo Canyon, Circuit City, Float or Sink Lagoon): 6 stops each, 5 rounds per stop (boss 6), numbers set by grade tier; saved in `p.phys`. Opened from the zone signs in the district.
- `battlepets.js` — Battle Pets DEMO: a Battle Cats-style lane battle with the hero's real pets (roles from perks); a battle takes over the whole screen (no menus, only ✕ Exit; browser full screen where allowed) on a wide battlefield that scrolls sideways; the camera follows our lead pet (pauses 5 s when the kid looks around), with dust, hit flashes, lunges, random shoves and knock-back arcs. Pets walk slower the stronger they are, and fighters touch; flyers drift over pets that can't reach them. A hurt base smokes from 25% damage, more and darker as it falls. Pet Pounce is a giant paw dropping out of the sky onto the critters' lead. Critter types come from what each animal really is (only real flyers fly). Pets that really fly (plus the winged dragons; `PET_FLY`) cruise in the air, swoop down to hit ground critters, and can reach flying critters. The team picker has 🎲 Pick for me (a random team aimed at about an 80% win chance, different each press; `winChance` with weights `WINM` fitted to simulated battles played by the Trainer logic, retrain if `TUNE` changes), 🧑‍🏫 Pet Trainer (like Battle Cats' CPU: sessions hired ahead of time on the team screen, 50 coins each, saved in `p.bp2.tr`; the bottom-row Trainer button (between Pounce and Rebuild, or A) uses one session the first time it is switched on in a battle, and off/on again in that battle is free; it sends pets, upgrades the kitchen, pounces and calls the mega but never does the Rebuild math; about 84% of battles won by simulation, `trainer()`, knobs in `TRAINER`, logged as `p.bp.m[i][12]`), a 🐝 Stops flyers filter, and Start warns when nobody on the team can reach flyers. Treats come in on their own (Treat Kitchen upgrades), Pet Pounce charges over time, critter traits and counters, a boss, a once-per-base last stand at 25%, 3 crowns per stage then endless ✨ Ascend levels (`ascK`, best per stage in `p.bp2.asc`; a second Goblin from Ascend 6), and the 🧌 mega Grumbleroot the Troll (the real troll.js drawing via `window.MQ_TROLL_SVG`, holding a club; he leaps in behind the lead pet and ROARS, blasting critters back (flyers too); testing: every hero; 40 s before the first call, 100 s cooldown; how to earn him is undecided). The other mega is 🦅 Skyla the Giant Eagle (eagle.js drawing via `window.MQ_EAGLE_SVG`): she walks, rises and dives at an angle onto critters; the team builder picks one mega per battle (`p.bp2.mega`). The critters' boss on every stage is the Grey Goblin (fade.js drawing via `window.MQ_GOBLIN_SVG`). Math is 🧱 Rebuild: below half health a right answer lays a brick (5 per battle, +40% each = two full rebuilds); questions are quick, easy facts of the stage's skill for everyone (speed, not difficulty; `easyQ`), with ⏭ Skip; keyboard works (digits/Enter, 1–5, K, Space, R, arrows). Balance is tuned by simulation (knobs in `TUNE`). ✕ Exit (after asking) goes back to the team builder for the same stage and level; ← Back from the team builder or results goes to the world page the battle was opened from (the Lab for the Fossil Stage). Results say who won, ⭐ stars for a win (speed thresholds `STAR_T` per crown, one fewer if the Pet House ever fell below half; best per level in `p.bp2.st`) and the hero's record (`p.bp2.rec` wins/losses/quits). The team screen's Level row picks any unlocked crown or Ascend level (up to one past the best) and shows its best stars; it opens on the next level. Sounds: clashes, knock-backs, a retired pet, a falling base. Opened from each world's page: before 👑 Legend, medal tickets (`p.bp2.tk`): 🥉 Bronze, 🥈 Silver, 🥇 Gold give one battle each at crown 1/2/3 (a loss or leaving a started battle gives one retry), 💎 Diamond a free Trainer session, medals earned earlier count; after 👑 Legend every level and Ascend (no plaza building any more); the Fossil Stage opens from the Science Cave's 🏛️ Museum once all 4 dinosaur skeletons are built (T. rex, Triceratops, Stegosaurus, Brachiosaurus; `p.cave.ex`). Saves `p.bp2` (crowns, last team) and the play log `p.bp`; rewards are pet XP and snacks only. Battle songs (chosen in `music.js` from `BattlePets.songId()`): Pet Battle (`audio/pet-battle-studio.mp3`, the owner's Suno version of an original tune) Last Stand (`audio/pet-battle-last-stand-studio.mp3`) and the slower Stand Firm (`audio/pet-battle-stand-firm-studio.mp3`), all the owner's Suno versions of original tunes; `p.bpSong` = mix (default, a random one per battle) / march / last / firm / off. The battle's 🔊 button pauses the game and shows only the sound-effects and music sliders and the battle song choice. Fighters wind up before each hit, each role in its own way.
- `bpscene.js` — Battle Pets scenery: a parallax world per stage (forest, crystal caves, volcano, castle, desert dig site) drawn in code, sky by crown (day, sunset, stormy night), the Grey Goblin draining the colour, drawn bases that crack, lane scuffs. Decoration only (`window.BPScene`).
- `innerspace.js` — Ozzy's Inner Space ride (Shrink Tickets). Its music is `audio/inner-space-studio.mp3` (the owner's Suno version of the live tune in `music.js`). After a kid's first ride the shrink-down is an ⏩ express (🐢 Slow tour brings back every stop).
- `cave.js` + `cave-data.js` — the Science Cave. Includes the Core Keeper: a hero who owns the Core Suit (the sixth suit) falls from the Mantle to the centre of the Earth and answers science questions; before that Dr. Quartz only hints. `cave-test.html` is a standalone test page for the cave (`?core=1` / `?core=again` start the fall).
- `ground.js` — the map floor: each tile drawn as 4×4 smaller squares (`N` in ground.js) in 4 shades of its area's colours (fixed hash, no flicker), soft borders between areas, water shades and shore foam, and paths as rounded dirt trails joined to neighbours, the town square and gates. Drawing only; the walking grid is unchanged. Called from the core ground loop as `MQ_GROUND.draw`.
- `decor.js` — drawn map scenery (`MQ_DECOR`): an area in `SET` gets drawn trees/bushes on its old blocking-object tiles and drawn plants on its old decoration tiles (same tiles, so walking is unchanged), picked by a fixed hash, plus a few small flowers/tufts on open ground (drawing only). Done: the Addition Forest (pine, dark pine, oak, birch; bush, berry bush, flowering bush; toadstools, brown mushrooms, fern, daisies, bluebells) and the Division Castle (battlement walls, watchtowers, catapults, knight statues, cannonballs in three equal piles; pennants, torches, shields, rubble, candles). Areas not in `SET` keep their emoji (the Haunted Hollow keeps its tombstones).
- `gateart.js` — drawn world entrances on the map (`MQ_GATE_ART[world]` = an SVG drawn bottom-aligned on the gate tile, `w` tiles wide; worlds without art keep their emoji). Done: the Subtraction Caves' Cave Mouth the Addition Forest's Treehouse (bright leaves so it stands out on the forest grass) the Division Castle's gatehouse (÷ shield) and the Multiplication Volcano (× plaque). Style for the rest (owner-approved): bold dark-brown outlines, flat shaded colours, a doorway whose inside is darker and darker bands, and the world's math sign on the keystone/plaque.
- `train.js` — the Town Train (coming soon): a track across the plaza's bottom row from the brick Depot (west, where the train lives) to a side-view hill with a tunnel (east) (tiles 15–17 and 27–29), a side-view track and a 🚉 departure board near the middle; signs "Depot" (west) and "Discovery Zone" (east). A train comes every 15 min of map time (the first 1–15 min in), stops ~16 s ("All aboard!", whistle) and leaves; the board's card has a free 🔔 bell (train within 60 s) or a 10-coin call (right away). Getting on says the Discovery Zone will open October 15th. Visitors (Kind Teacher, Dr. Quartz, Principal Wise, Ms. Rosa, Elder Wiz, Pet Keeper) appear beside the stopped train and walk into Town, or walk out and vanish into it; nobody is drawn riding. Core hooks in index.html: `MQ_WORLD` (tiles), `MQ_MAPDRAW` (per-frame drawing), `MQ_NPC` (tap handlers).
- `teach.js` — 🧠 Teach me: on the wrong-answer card of a plain ➕ ➖ ✖️ ➗ fact (levels 1–10, numbers under 1000 for ➕ ➖) a button walks the kid through one well-known strategy in small steps they answer (make a ten, near doubles, back through ten, round and adjust, 9s = 10s minus one group, chunk it for ➗…), then ✏️ Try one like it (`genQ` at the same level, same strategy). Practice only: no stats or coins. Steps are built as little sums so they are right by construction; the smoke test checks every level. Counts in `p.teach` for Parent Corner.
- `report.js` — the 🐞 Report button (top bar, and in a Battle Pets fight where it pauses): a problem or suggestion saved in the hero's own save (`p.reports`, last 30) with the screen and version; shown in Parent Corner. `tools/peek.py FAMILY-CODE` prints a family's reports read-only (never store the code in a file).
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
