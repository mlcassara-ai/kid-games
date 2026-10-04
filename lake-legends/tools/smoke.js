#!/usr/bin/env node
/* Lake Legends smoke test. Run from anywhere:  node lake-legends/tools/smoke.js
   Serves the repo, opens the game in headless Chromium (Playwright), fakes Firebase in memory,
   and plays through accounts, sync and the fishing loop. Prints RESULT: PASS or RESULT: FAIL. */
const path = require("path"), http = require("http"), fs = require("fs");
let pw; try { pw = require("playwright"); } catch (e) { pw = require("/opt/node22/lib/node_modules/playwright"); }
const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html":"text/html", ".js":"text/javascript", ".json":"application/json", ".png":"image/png" };
const server = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]));
  fs.readFile(f.endsWith("/") ? f + "index.html" : f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "text/html" }); r.end(d); });
});
const fails = []; let checks = 0;
const ok = (c, msg) => { checks++; if (!c){ fails.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg); };
const STORE = new Map();                                  // the fake Firestore: doc id -> stringified data
async function fakeFirebase(ctx){
  await ctx.route(/identitytoolkit|securetoken/, r => r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify({ idToken:"t", refreshToken:"r", expiresIn:"3600", id_token:"t", refresh_token:"r", expires_in:"3600" }) }));
  await ctx.route(/firestore\.googleapis\.com/, r => {
    const id = r.request().url().split("/families/")[1].split("?")[0];
    if (r.request().method() === "GET"){ if (!STORE.has(id)) return r.fulfill({ status:404, body:"{}" }); return r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify({ fields:{ data:{ stringValue: STORE.get(id) } } }) }); }
    const b = JSON.parse(r.request().postData()); STORE.set(id, b.fields.data.stringValue); return r.fulfill({ status:200, body:"{}" });
  });
}
async function newPage(browser, errs){
  const ctx = await browser.newContext({ viewport:{ width:390, height:780 } });
  await fakeFirebase(ctx);
  const p = await ctx.newPage();
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  p.on("dialog", d => d.accept());
  return p;
}
const URL = port => "http://localhost:" + port + "/lake-legends/";

// a simple bot: casts, waits for BITE, taps fast, reels, keeps everything. Runs the game's own update loop.
const BOT = n => {
  const out = { casts:0, fish:0 }, start = S.landed || 0;
  let steps = 0;
  while (out.casts < n && steps++ < 60000){
    if (state === "results"){ $("btnCollect").onclick(); continue; }
    if ($("modal").classList.contains("show")){ const b = $("modalBox").querySelectorAll("button"); b[b.length - 1].click(); continue; }
    if (state !== "fishing" || !trip){ startVisit(lakeById(S.lastLake) || LAKES[0], "dock"); continue; }
    const T = trip, hk = T.hook;
    if (T.phase === "ready"){ out.casts++; T.wait = 0; T.goal = null; reelPress(); reelRelease(); }
    else if (T.nibble){ if (T.nibble.stage === "bite" && T.nibble.t > .15){ reelPress(); reelRelease(); } }
    else if (T.phase === "fight"){ if (T.fight.tension > 70 || (T.move && moveWant(T.move, true) === "idle")) reelRelease(); else btnHeld = true; }
    else if (T.phase === "drop"){
      // pick a fish that likes the bait and drop down to it
      if (!T.goal) T.goal = T.fish.filter(f => interest(T, f) > .2 && f.y < T.maxY).sort((x, y) => Math.abs(x.x - hk.x) - Math.abs(y.x - hk.x))[0] || { x: hk.x, y: T.maxY };
      pointerX = T.goal.x;
      if (hk.y >= T.goal.y - 6){ reelPress(); reelRelease(); }
    }
    else if (T.phase === "reel"){
      if (T.caught.length){ const w = T.move ? moveWant(T.move, false) : "tap"; btnHeld = w === "hold"; if (w === "tap" && steps % 3 === 0) crank(); }
      else { T.wait = (T.wait || 0) + 1/30; btnHeld = T.wait > 5 || !!T.fouled; }     // empty hook: give fish a few seconds, then reel up
    }
    updateFishing(1/30);
  }
  btnHeld = false; out.fish = (S.landed || 0) - start;
  return out;
};

(async () => {
  await new Promise(r => server.listen(0, r)); const port = server.address().port;
  let browser; try { browser = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); } catch (e) { browser = await pw.chromium.launch(); }
  const errs = [];
  console.log("Accounts");
  const a = await newPage(browser, errs);
  // a device that already has an old (pre-accounts) save
  await a.addInitScript(() => { if (!localStorage.getItem("seeded")){ localStorage.setItem("seeded", "1");
    localStorage.setItem("lakeLegendsDeepDrop_v1", JSON.stringify({ coins:123, lakes:["dixon","poway"], up:{line:1,stringer:0,reel:0,guard:0,lure:0}, dex:{ bluegill:{ n:4, best:8.2 } }, baits:["spinner","bread","worm"], baitCount:{ worm:5 }, bosses:{ dixon:true }, bait:"spinner", trips:9 })); } });
  await a.goto(URL(port)); await a.waitForTimeout(400);
  ok(await a.isVisible("#llOv"), "first visit asks who's fishing");
  await a.click("#llStart"); await a.fill("#llPin", "1234"); await a.click("#llO"); await a.fill("#llPin", "1234"); await a.click("#llO");
  ok(await a.isVisible("#llAddKid"), "parent PIN opens the Parent Corner");
  await a.click("#llAddKid"); await a.fill("#llName", "Ana");
  ok(await a.isChecked("#llOld"), "offers this device's old progress to the first player");
  await a.click("#llNext"); await a.click("#llSkip"); await a.waitForTimeout(200);
  ok(!(await a.isVisible("#llOv")), "first player goes straight into the game");
  ok(await a.evaluate(() => S.coins === 123 && S.lakes.length === 2 && S.dex.bluegill.n === 4 && S.baitCount.worm === 5), "old save moved into the first player");
  ok((await a.textContent("#btnPlay")).includes("Ana"), "title greets the player");
  ok(await a.evaluate(() => localStorage.getItem("lakeLegendsDeepDrop_v1") !== null), "old save kept on the device as a backup");

  console.log("Fishing");
  const r1 = await a.evaluate(BOT, 25);
  ok(r1.casts >= 25, "bot made 25 casts (" + r1.casts + ")");
  ok(r1.fish >= 3, "bot landed fish (" + r1.fish + ")");
  ok(await a.evaluate(() => LL.player().game === S && S.landed >= 4), "catches are saved to the player");
  await a.evaluate(() => { trip = null; visit = null; showScreen("shop"); });
  ok(await a.evaluate(() => [...document.querySelectorAll("#shopList b")].some(b => b.textContent === "Lucky Lure")), "Lucky Lure is in the Tackle Shop");

  console.log("Catch moments, night, legends, rare looks, treasure");
  const r2 = await a.evaluate(() => {
    const out = {}, land = (f, lake) => { trip.fish.push(f); trip.phase = "reel"; hookFish(f); trip.fight = null; if (!trip.caught.length) landFish(f); trip.phase = "reel"; trip.hook.y = 2;
      for (let i = 0; i < 80 && trip; i++){ crank(); updateFishing(1/30); } };
    S.coins = 500; S.lakes = LAKES.map(l => l.id);
    // a smallmouth near the surface can jump
    startVisit(lakeById("cuyamaca"), "boat"); const sm = makeFish("smallmouth", 6*PPF); sm.inches = 17; sm.L = fishPx(sm.sp, 17);
    trip.fish.push(sm); trip.phase = "reel"; hookFish(sm); trip.phase = "reel"; trip.fight = null; if (!trip.caught.length) landFish(sm);
    const oj = JUMPERS.smallmouth; JUMPERS.smallmouth = 1; trip.hook.y = 8 * PPF; let jumped = false;
    for (let i = 0; i < 200 && trip; i++){ updateFishing(1/30); if (trip && trip.jump) jumped = true; if (jumped && trip && !trip.jump) break; }
    JUMPERS.smallmouth = oj; out.jumped = jumped;
    for (let i = 0; i < 600 && trip; i++){ crank(); updateFishing(1/30); }
    out.brag = !!document.querySelector("#resList .brag");
    $("btnCollect").onclick(); while ($("modal").classList.contains("show")) $("modalBox").querySelector("button:last-child").click();
    // night: catfish come up; the legend is caught and recorded, not added to the Fishdex
    S.clock = 23; out.night = isNight();
    startTrip(lakeById("dixon"), 0, "boat", true);
    land({ id:"legend_dixon", sp: legendSp("dixon"), inches:27, frac:1, L:120, x:200, y:100, baseY:100, dir:1, speed:0, phase:0, trophy:false, nightLegend:true });
    out.legend = !!S.legends.dixon && !S.dex.legend_dixon && state === "results";
    $("btnCollect").onclick(); while ($("modal").classList.contains("show")) $("modalBox").querySelector("button:last-child").click();
    // a rare look counts double and is remembered
    S.clock = 10; startTrip(lakeById("dixon"), 0, "dock", true);
    const v = makeFish("trout", 80); v.sp = variantSp("trout"); v.variant = "golden"; land(v);
    out.look = !!(S.dex.trout && S.dex.trout.v && S.dex.trout.v.golden);
    $("btnCollect").onclick(); while ($("modal").classList.contains("show")) $("modalBox").querySelector("button:last-child").click();
    // a treasure chest
    const t0 = S.treasures || 0; startTrip(lakeById("dixon"), 0, "dock", true); const c = makeSnag("chest", trip.hook.x, 0); c.y = trip.hook.y; trip.snags = [c]; trip.phase = "drop"; checkSnags(trip, trip.hook);
    trip.hook.y = 2; trip.phase = "reel"; for (let i = 0; i < 40 && trip; i++) updateFishing(1/30);
    out.chest = S.treasures === t0 + 1; $("modal").classList.remove("show");
    showScreen("dex"); out.dex = document.querySelectorAll("#legGrid .dexcell").length === LAKES.length;
    trip = null; visit = null; showScreen("title");
    return out;
  });
  ok(r2.jumped, "a hooked smallmouth jumps near the surface");
  ok(r2.brag, "the catch screen shows the brag shot");
  ok(r2.night, "the clock reaches night");
  ok(r2.legend, "a Night Legend is caught, recorded and released");
  ok(r2.look, "a rare look is saved in the Fishdex");
  ok(r2.chest, "a treasure chest opens");
  ok(r2.dex, "the Fishdex has the Night Legends shelf");
  console.log("Boats, style, Pearl's jobs, Fish of the Day, Lodge, Derby");
  const r3 = await a.evaluate(() => {
    const out = {}, land = (id, inches) => { const f = makeFish(id, 80); f.variant = null; f.sp = SPECIES[id]; f.inches = inches; f.L = fishPx(f.sp, inches);
      trip.fish.push(f); trip.phase = "reel"; hookFish(f); trip.fight = null; if (!trip.caught.length) landFish(f); trip.phase = "reel"; trip.hook.y = 2;
      for (let i = 0; i < 80 && trip; i++){ crank(); updateFishing(1/30); } return f; };
    const clear = () => { while ($("modal").classList.contains("show")) $("modalBox").querySelector("button:last-child").click(); };
    S.coins = 1000; S.clock = 10;
    // own boat: no rent
    showScreen("shop"); S.boatOwn = 0; const before = S.coins; S.coins -= BOATS[1].cost; S.boatOwn = 1;
    const c0 = S.coins; startVisit(lakeById("dixon"), "boat"); out.noRent = S.coins === c0 && trip.mode === "boat";
    // style: buy and wear a hat
    showScreen("shop"); const cell = [...document.querySelectorAll(".stylecell")].find(c => c.textContent.includes("Straw hat")); cell.click();
    out.hat = look().hat === "straw" && owns("hat", "straw");
    // Fish of the Day pays double, and Pearl's jobs move
    S.jobs = null; const J = jobs(); J.list[0] = { k:"count", need:1, got:0, text:"Catch 1 fish", pay:20 };
    startTrip(lakeById("dixon"), 0, "dock", true); const fd = fishOfDay(); land(fd, 10);
    const it = pending && pending.items[0]; out.fotd = !!it && document.querySelector("#resList").textContent.includes("FISH OF THE DAY");
    const c1 = S.coins; $("btnCollect").onclick(); clear();
    out.job = J.list[0].got === 1 && S.coins >= c1 + 20;
    // Derby and mounting
    out.derby = rollDerby().wk === weekKey() && (S.derby.score > 0 || derbyFor(S.derby.wk).unit === "lb");
    startTrip(lakeById("dixon"), 0, "dock", true); const big = land("largemouth", 20);
    const mb = document.querySelector("#resList .brag .mount"); mb.click(); out.mount = S.mounts.length === 1 && S.mounts[0].id === "largemouth";
    $("btnCollect").onclick(); clear(); trip = null; visit = null;
    showScreen("lodge"); out.lodge = document.querySelectorAll("#lodgeBody .plaque").length === 1 && document.querySelector("#lodgeBody").textContent.includes("Family records");
    // last week's champion is paid once
    S.derbyLast = { wk: weekKey(-1), score: 3, best: "3 fish" }; S.derbyPaid = {}; const c2 = S.coins;
    out.prize = !!derbyPrize() && S.coins === c2 + 100 && !derbyPrize();
    showScreen("title");
    return out;
  });
  ok(r3.noRent, "your own boat is free at every lake");
  ok(r3.hat, "a hat can be bought and worn");
  ok(r3.fotd, "the Fish of the Day pays double");
  ok(r3.job, "Pearl's jobs count catches and pay");
  ok(r3.derby, "the Family Derby tracks this week");
  ok(r3.mount, "a catch can be mounted on the Lodge wall");
  ok(r3.lodge, "the Lodge shows the wall and the family records");
  ok(r3.prize, "last week's Derby winner is paid once");
  console.log("Depth bands, reports, update notice");
  const r4 = await a.evaluate(() => {
    const out = {};
    // a catfish can't be teased up out of the deep (Mika's trick): try a few, at least one must follow, none may rise past its band
    let topY = 99999, moved = false;
    for (let k = 0; k < 6 && !moved; k++){
      S.clock = 12; startTrip(lakeById("dixon"), 0, "boat", true);
      const f = makeFish("channel", 50 * PPF); f.variant = null; f.sp = SPECIES.channel; f.x = 240; f.baseY = f.y = 50 * PPF; trip.fish = [f];
      trip.bait = "worm"; trip.phase = "reel"; trip.hook.x = 250; trip.hook.y = 50 * PPF; let top = f.baseY;
      for (let i = 0; i < 1500; i++){ const hy = Math.max(2 * PPF, 50 * PPF - i * .8); trip.hook.y = hy; trip.pending = 0; btnHeld = false; trip.nibble = null; f.nibbling = false; f.sniffT = 0; f.fleeT = 0;
        updateFishing(1/30); if (!trip) break; trip.hook.y = hy; trip.phase = "reel"; trip.caught = []; top = Math.min(top, f.baseY); }
      topY = Math.min(topY, top); moved = moved || top < 49 * PPF;
    }
    out.band = topY > 30 * PPF && moved; out.topFt = Math.round(topY / PPF);
    trip = null; visit = null; showScreen("title");
    // a report is saved with the screen and version
    LL.report();
    { const ta = document.getElementById("llRep"); ta.focus(); const ev = new KeyboardEvent("keydown", { code:"Space", key:" ", bubbles:true, cancelable:true }); ta.dispatchEvent(ev); out.space = !ev.defaultPrevented; }
    document.getElementById("llRep").value = "The boat is upside down"; document.getElementById("llRepOk").click();
    const rp = (LL.player().reports || [])[0]; out.report = !!rp && rp.m.includes("upside") && !!rp.v; document.getElementById("llRepDone").click();
    out.bug = getComputedStyle($("btnBug")).display !== "none";
    showScreen("map"); out.pins = document.querySelectorAll("#lakeMap .pin").length === LAKES.length && $("lakeMap").getBoundingClientRect().height > 100; showScreen("title");
    return out;
  });
  ok(r4.band, "a catfish won't follow the bait up out of its depth (stopped at " + r4.topFt + " ft)");
  ok(r4.space, "the space bar types a space in the report box");
  ok(r4.report, "a report or suggestion is saved with the screen and version");
  ok(r4.bug, "the 🐞 Report button is on the menus");
  ok(r4.pins, "the drawn lake map shows a pin for every lake");
  await a.evaluate(() => { localStorage.removeItem("llUpdTry"); });
  await a.route(/version\.json/, r => r.fulfill({ status:200, contentType:"application/json", body:'{"v":"2099.01.01a"}' }));
  ok(await a.evaluate(async () => { await LL_UPDATE.check(); return true; }), "update check runs");
  await a.unroute(/version\.json/);
  for (const [w, h] of [[1024, 768], [390, 844], [1440, 900]]){
    await a.setViewportSize({ width: w, height: h }); await a.waitForTimeout(100);
    const fit = await a.evaluate(() => { const r = $("wrap").getBoundingClientRect(); return { w: r.width / innerWidth, h: r.height / innerHeight }; });
    ok(fit.w > .97 && fit.h > .97, `the game fills a ${w}×${h} screen (${Math.round(fit.w*100)}% × ${Math.round(fit.h*100)}%)`);
  }
  await a.setViewportSize({ width: 390, height: 780 });

  console.log("Pacing");
  const r6 = await a.evaluate(() => {
    const out = {}, L = lakeById("dixon"), keep = id => { startTrip(L, 0, "dock", true); const f = makeFish(id, 60); f.variant = null; f.sp = SPECIES[id]; f.inches = Math.max(13, SPECIES[id].min + 1);
      trip.fish.push(f); trip.phase = "reel"; hookFish(f); trip.fight = null; trip.phase = "reel"; if (!trip.caught.length) landFish(f); trip.hook.y = 2;
      for (let i = 0; i < 80 && trip; i++){ crank(); updateFishing(1/30); } const q = applyPending(); return q.length; };
    const saved = { bosses: S.bosses, lakeDex: S.lakeDex, day: S.day }; S.bosses = {}; S.lakeDex = {}; S.day = { lake:"dixon", kept:[] };
    for (let i = 0; i < DAY_LIMIT.dixon; i++) keep("bluegill");
    out.noBoss = !$("modalBox").textContent.includes("is here") && kindsAt(L) === 1;
    let offered = false; const keepQ = id => { startTrip(L, 0, "dock", true); const f = makeFish(id, 60); f.variant = null; f.sp = SPECIES[id]; f.inches = Math.max(13, SPECIES[id].min + 1);
      trip.fish.push(f); trip.phase = "reel"; hookFish(f); trip.fight = null; trip.phase = "reel"; if (!trip.caught.length) landFish(f); trip.hook.y = 2;
      for (let i = 0; i < 80 && trip; i++){ crank(); updateFishing(1/30); } return applyPending(); };
    for (const id of ["largemouth", "channel"]) offered = keepQ(id).some(fn => /bossOffer/.test(fn.toString())) || offered;
    const q = []; out.offerFlag = offered;
    out.kinds = kindsAt(L); out.offer = out.offerFlag;
    Object.assign(S, saved); trip = null; visit = null; $("modal").classList.remove("show"); showScreen("title");
    return out;
  });
  ok(r6.noBoss, "a full basket of just bluegill doesn't bring out the boss");
  ok(r6.kinds >= 3 && r6.offer, "after 3 kinds at Dixon the boss offer comes");

  console.log("Wildlife");
  const r5 = await a.evaluate(() => {
    const out = {}, hookOne = () => { startTrip(lakeById("dixon"), 0, "boat", true); const f = makeFish("largemouth", 6 * PPF); f.variant = null; f.sp = SPECIES.largemouth; f.inches = 15; f.L = fishPx(f.sp, 15);
      trip.fish.push(f); trip.phase = "reel"; trip.hook.y = 6 * PPF; hookFish(f); trip.fight = null; trip.phase = "reel"; if (!trip.caught.length) landFish(f); trip.caught[0].jumped = true; return f; };
    S.clock = 10;
    let f = hookOne(); startRaid(trip, "osprey", f); for (let i = 0; i < 9; i++){ reelPress(); reelRelease(); } updateWild(trip, 1/30);
    out.saved = trip.wild && trip.wild.stage === "flee" && trip.caught.includes(f);
    f = hookOne(); startRaid(trip, "osprey", f); for (let i = 0; i < 120 && trip.wild && trip.wild.stage !== "flee"; i++) updateWild(trip, 1/30);
    out.stolen = !trip.caught.includes(f) && !!S.wild.seen.osprey;
    trip = null; startTrip(lakeById("dixon"), 0, "boat", true); trip.phase = "ready"; const n0 = trip.fish.length; startShow(trip, "merganser");
    for (let i = 0; i < 400 && trip.wild; i++) updateWild(trip, 1/30);
    out.show = !trip.wild && !!S.wild.seen.merganser;
    // timing: a big moment once every 14-26 minutes of fishing
    S.wild.t = 0; S.wild.nextBig = 15 * 60; trip.wild = null; trip.phase = "ready"; let fired = 0;
    for (let i = 0; i < 30 * 60 * 30 / 10; i++){ updateWild(trip, 10/30); if (trip.wild && trip.wild.mode !== "see"){ fired++; trip.wild = null; } else if (trip.wild) trip.wild = null; }
    out.rate = fired;
    trip = null; visit = null; showScreen("dex"); out.album = document.querySelectorAll("#wildGrid .dexcell").length === WILD_ORDER.length; showScreen("title");
    return out;
  });
  ok(r5.saved, "tapping fast scares the osprey off and keeps the fish");
  ok(r5.stolen, "too slow, and the osprey takes the fish (and it's in the album)");
  ok(r5.show, "the merganser dives for a fish and is photographed");
  ok(r5.rate >= 1 && r5.rate <= 2, "an osprey or duck shows up 1-2 times in 30 minutes (" + r5.rate + ")");
  ok(r5.album, "the Fishdex has the Wildlife album");

  console.log("Sound");
  await a.evaluate(() => { trip = null; visit = null; showScreen("title"); prizeQueue = []; $("modal").classList.remove("show"); const o = document.getElementById("llOv"); if (o) o.remove(); });
  await a.click("#btnMute"); await a.waitForTimeout(1500);
  const snd = await a.evaluate(() => ({ sliders: document.querySelectorAll("#modalBox [data-av]").length, ctx: !!AC && AC.state, notes: mus.step }));
  ok(snd.sliders === 3, "the sound panel has effects, music and lake-sound volumes");
  ok(snd.ctx === "running" && snd.notes > 0, "the background music is playing (" + snd.notes + " steps)");
  await a.evaluate(() => { const r = document.querySelector('#modalBox [data-av="music"]'); r.value = 20; r.oninput(); $("modalBox").querySelector("button:last-child").click(); });
  ok(await a.evaluate(() => JSON.parse(localStorage.getItem("lakelegends.audio")).music === .2 && Math.abs(BUS.music.gain.value - .12) < .01), "volume changes stick on the device");

  console.log("Install as an app");
  const app = await a.evaluate(async () => { const m = await (await fetch(document.querySelector('link[rel="manifest"]').href)).json();
    const ok = await Promise.all(m.icons.map(async i => (await fetch(i.src)).ok)); return { name: m.name, display: m.display, icons: m.icons.length, all: ok.every(Boolean), btn: !!$("btnApp") }; });
  ok(app.name === "Lake Legends" && app.display === "standalone" && app.icons >= 2 && app.all, "the app manifest and its icons load");
  ok(app.btn, "the title screen has a Get the app button");

  console.log("Second player");
  await a.evaluate(() => $("btnWho").onclick());
  await a.click("#llParent"); await a.fill("#llPin", "1234"); await a.click("#llO");
  await a.click("#llAddKid"); await a.fill("#llName", "Ben");
  ok(!(await a.$("#llOld")), "old progress is only offered once");
  await a.click("#llNext"); await a.click(".ll-grid button:nth-child(1)"); await a.click(".ll-grid button:nth-child(2)"); await a.click("#llOk");
  await a.click("#llDone");
  ok((await a.$$(".ll-pc")).length === 2, "two players to choose from");
  await a.click(".ll-pc:nth-child(2)");
  ok(await a.isVisible("#llGrid"), "a locked player asks for secret pictures");
  await a.click("#llNot"); await a.click(".ll-pc:nth-child(1)");
  ok(await a.evaluate(() => LL.player().name === "Ana" && S.coins >= 123), "back to the first player");
  await a.evaluate(() => $("btnWho").onclick());
  const benLock = await a.evaluate(() => LL.players()[1].lock);
  await a.click(".ll-pc:nth-child(2)");
  for (const e of benLock) await a.click(`#llGrid button[data-e="${e}"]`);
  ok(await a.evaluate(() => LL.player().name === "Ben" && S.coins === 0 && !Object.keys(S.dex).length), "the right pictures open Ben, with his own fresh game");

  console.log("Online save");
  await a.evaluate(() => LL.parentCorner()); await a.fill("#llPin", "1234"); await a.click("#llO");
  await a.click("#llOn"); await a.waitForTimeout(500);
  const code = await a.textContent(".ll-code");
  ok(/^[A-Z]+-[A-Z]+-[A-Z]+-[A-Z]+-\d\d$/.test(code), "family code made (" + code + ")");
  ok([...STORE.keys()].some(k => k.startsWith("ll_") && k.length > 20), "saved online under an ll_ document");
  const b = await newPage(browser, errs);
  await b.goto(URL(port)); await b.waitForTimeout(300);
  await b.click("#llParent"); await b.fill("#llPin", "9999"); await b.click("#llO"); await b.fill("#llPin", "9999"); await b.click("#llO");
  await b.fill("#llJoin", code); await b.click("#llJoinBtn"); await b.waitForTimeout(500);
  await b.click("#llDone");
  ok((await b.$$(".ll-pc")).length === 2, "second device sees both players after joining");
  await b.click(".ll-pc:nth-child(1)");
  ok(await b.evaluate(() => LL.player().name === "Ana" && S.landed >= 4), "Ana's catches came across");
  await b.evaluate(() => { S.coins += 1000; save(); return LL.syncNow(); });
  await a.evaluate(() => LL.syncNow()); await a.waitForTimeout(200);
  ok(await a.evaluate(() => LL.players().find(p => p.name === "Ana").game.coins >= 1123), "a change on one device reaches the other");
  ok(await a.evaluate(() => LL.player().name === "Ben" && S.coins === 0), "the player signed in on the first device is untouched");

  console.log("Replies to reports");
  // the reply tool writes families/llm_<code>; Ana (signed in on device b) should get a popup, but not in the middle of a cast
  const rep = await b.evaluate(() => (LL.player().reports || [])[0]);
  const ana = await b.evaluate(() => LL.player().id);
  const mid = [...STORE.keys()].find(k => k.startsWith("ll_")).replace(/^ll_/, "llm_");
  STORE.set(mid, JSON.stringify({ v:1, msgs:[{ id:"r1", t:Date.now(), to:ana, toName:"Ana", from:"the Lake Legends team", m:"The boat floats the right way now!", st:"fixed", re:{ t:rep.t, k:"problem", m:rep.m }, readBy:{} }] }));
  await b.evaluate(() => { startVisit(lakeById("dixon"), "dock"); });
  await b.evaluate(() => LL.syncNow()); await b.waitForTimeout(500);
  ok(!(await b.$("#llNoteRead")), "a reply waits while the player is fishing");
  await b.evaluate(() => { trip = null; visit = null; showScreen("title"); }); await b.waitForTimeout(5600);
  ok(await b.isVisible("#llNoteRead") && (await b.textContent("#llOv")).includes("We fixed it!") && (await b.textContent("#llOv")).includes("upside"), "the reply pops up with the report and the answer");
  await b.click("#llNoteRead"); await b.waitForTimeout(400);
  ok(!!JSON.parse(STORE.get(mid)).msgs[0].readBy[ana], "tapping it records that the player saw it");
  ok(!(await b.$("#llNoteRead")), "it doesn't show again");

  const r8 = await a.evaluate(() => {
    const out = {}, land = () => { startTrip(lakeById("dixon"), 0, "boat", true); const f = makeFish("bluegill", 4 * PPF); f.variant = null; f.sp = SPECIES.bluegill; f.inches = 7; f.trophy = false;
      trip.fish.push(f); trip.phase = "reel"; trip.hook.y = 4 * PPF; hookFish(f); trip.fight = null; trip.phase = "reel"; if (!trip.caught.length) landFish(f); return f; };
    const R = Math.random; S.dex.bluegill = S.dex.bluegill || { n:1, best:7 }; wildClock().nextSnatch = 0;
    SNATCH.chance = 1; let f = land();
    for (let i = 0; i < 400 && trip && trip.phase !== "snatch"; i++){ crank(); updateFishing(1/30); }
    out.started = trip && trip.phase === "snatch";
    for (let i = 0; i < 200 && trip && trip.phase === "snatch"; i++) updateFishing(1/30);
    out.stolen = trip && !trip.caught.includes(f) && trip.phase === "done";
    f = land();
    for (let i = 0; i < 400 && trip && trip.phase === "reel"; i++){ crank(); updateFishing(1/30); }
    out.cooldown = trip && trip.phase !== "snatch" && trip.caught.includes(f); SNATCH.chance = .08;
    trip = null; visit = null; $("modal").classList.remove("show"); modalQueue = []; showScreen("title");
    return out;
  });
  ok(r8.started && r8.stolen, "a bird can swoop down and steal a fish right at the surface");
  ok(r8.cooldown, "it can't happen again right away");

  console.log("The ocean");
  const r7 = await a.evaluate(async () => {
    const out = {}, bak = JSON.stringify(S), O = lakeById("ocean");
    out.unlock = normalizeSave(Object.assign(JSON.parse(bak), { bosses:{ otay:true }, lakes:["dixon"] })).lakes.includes("ocean");
    S.lakes = S.lakes.concat("ocean"); S.saltRod = false; S.coins = SALT_ROD_COST + 100; trip = null; visit = null;
    startVisit(O, "dock"); out.gate = !trip && $("modalBox").textContent.includes("Saltwater Rod"); $("modal").classList.remove("show");
    showScreen("shop"); const buy = [...document.querySelectorAll("#shopList button")].find(b => b.textContent === "🪙" + SALT_ROD_COST); if (buy) buy.click();
    out.rod = S.saltRod && S.coins === 100;
    S.baits = S.baits.concat(["worm", "squid"]); S.baitCount.worm = 5; S.baitCount.squid = 5; S.bait = "worm"; S.boatOwn = 2;
    startVisit(O, "dock");
    out.pier = trip && trip.bottom === O.pierDepth * PPF && trip.bait === "spinner" && anglerBase(trip).feet < -40;
    uiSheet = "bait"; renderBaitBar(); const bar = $("baitBar").textContent; out.baits = bar.includes("Squid") && !bar.includes("Worm");
    let boatFish = 0; for (let i = 0; i < 300; i++) if (spawnFishFor(O, 300, null, false).sp.boatOnly) boatFish++; out.pierOnly = boatFish === 0;
    await new Promise(r => setTimeout(r, 200));
    out.charterCost = rentCost(O) === O.boat;
    S.coins = 500; toggleBoat(); boatFish = 0; for (let i = 0; i < 400; i++) if (spawnFishFor(O, 300, null, false).sp.boatOnly) boatFish++;
    out.charter = trip.mode === "boat" && S.coins === 500 - O.boat && boatFish > 0;
    await new Promise(r => setTimeout(r, 200));
    let painted = true; try { for (const id of OCEAN_DEX.concat("giantsea")) for (let k = 0; k < 5; k++) fishSprite(SPECIES[id], 90, k); fishSprite(legendSp("ocean"), 120, 2); } catch (e) { painted = false; }
    out.painted = painted;
    const f = makeFish("mackerel", 6 * PPF); trip.fish.push(f); trip.phase = "reel"; trip.hook.y = 6 * PPF; hookFish(f); trip.fight = null; trip.phase = "reel"; if (!trip.caught.length) landFish(f);
    startRaid(trip, "sealion", f); out.sealion = trip.wild.need > 8 && !!S.wild.seen.sealion;
    for (let i = 0; i < 120 && trip.wild && trip.wild.stage !== "flee"; i++) updateWild(trip, 1/30);
    leaveLake(); visit = null;
    startTrip(lakeById("dixon"), 0, "dock", true); uiSheet = "bait"; renderBaitBar(); out.lakeBaits = !$("baitBar").textContent.includes("Squid");
    trip = null; showScreen("dex"); out.dex = $("oceanDex").style.display !== "none" && document.querySelectorAll("#oceanGrid .dexcell").length === OCEAN_DEX.length;
    Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(bak)); showScreen("title");
    return out;
  });
  const night = await a.evaluate(() => { const v = visit; visit = visit || { lake: LAKES[0], mode:"dock" }; const c0 = S.clock; let t = 0;
    S.clock = 20; while (dayPart() === "night" && t < 3600){ updateClock(1); t++; } S.clock = c0; visit = v; return t; });
  ok(night > 500 && night < 640, "night lasts about 9 minutes (" + Math.round(night / 60 * 10) / 10 + " min)");
  ok(r7.unlock, "beating Otay's boss opens the ocean (old saves too)");
  ok(r7.gate, "the ocean needs a Saltwater Rod & Reel first");
  ok(r7.rod, "the rod is sold in the Tackle Shop for " + 2500);
  ok(r7.pier, "the pier is its own depth, up high, and lake bait stays home");
  ok(r7.baits, "only ocean bait shows at the ocean");
  ok(r7.pierOnly, "yellowtail and white seabass never come to the pier");
  ok(r7.charterCost && r7.charter, "the charter costs " + 120 + " even with your own boat, and brings the offshore fish");
  ok(r7.painted, "every ocean fish can be drawn");
  ok(r7.sealion, "a sea lion raid needs more taps");
  ok(r7.lakeBaits, "ocean bait doesn't show at the lakes");
  ok(r7.dex, "the Fishdex has an ocean section");

  console.log("Showdowns, events, gear, cabin and rewards");
  const r9 = await a.evaluate(async () => {
    const out = {}, bak = JSON.stringify(S), D = lakeById("dixon");
    const reset = () => { trip = null; visit = null; $("modal").classList.remove("show"); modalQueue = []; };
    // --- the Dock Showdown
    S.coins = 100; S.sd = { wins:{}, played:0, cups:[] }; reset();
    showdownOffer(lakeById("jennings")); out.locked = $("modalBox").textContent.includes("Local Derby first"); reset();
    startShowdown(D); const sd = visit.sd;
    out.started = !!sd && S.coins === 75 && sd.rivals.length === 2 && trip.mode === "dock" && sd.rivals.every(r => r.def.name);
    for (let i = 0; i < 30 * 150; i++){ if (trip.phase !== "ready"){ trip.phase = "ready"; } updateFishing(1/30); }
    out.rivalsFish = sd.rivals.some(r => r.fish.length > 0) && sd.left < SD_SECS - 60 && sd.left > 0;
    sd.mine.push({ id:"largemouth", lb: 99 }); sd.left = .01; updateFishing(1/30);
    out.finished = !visit.sd && $("modalBox").textContent.includes("YOU WON") && S.sd.wins.local === 1 && S.sd.cups.length === 1 && S.coins === 75 + 75;
    out.county = sdOpen(SD_TIERS[1]) && $("modalBox").textContent.includes("County Cup");
    reset();
    out.scores = sdScore("bag", [{id:"a",lb:1},{id:"b",lb:2},{id:"c",lb:3},{id:"d",lb:.5}]) === 6 && Math.floor(sdScore("kinds", [{id:"a",lb:1},{id:"a",lb:2},{id:"c",lb:3}])) === 2 && sdScore("big", [{id:"a",lb:1},{id:"b",lb:4}]) === 4 && sdScore("count", [{},{},{}]) === 3;
    const other = LL.players().find(p => p.id !== LL.player().id);
    if (other){ other.game = other.game || {}; const od = other.game.dex; other.game.dex = Object.assign({}, od, { bluegill:{ n:1, best:9 }, largemouth:{ n:1, best:20 } }); out.sib = (siblingRival(D) || {}).name === other.name; other.game.dex = od; }
    // --- events
    startVisit(D, "dock"); visit.ev = { clock: 0, next: 0, on: false, warn: 0, left: 0 };
    const f0 = makeFish("bluegill", 60); trip.bait = "worm"; const c0 = interest(trip, f0);
    for (let i = 0; i < 30 * 5; i++){ trip.phase = "ready"; updateFishing(1/30); }
    out.frenzy = frenzyOn() && interest(trip, f0) > c0;
    visit.ev.left = .01; trip.phase = "ready"; updateFishing(1/30); out.frenzyEnds = !frenzyOn();
    const tg = tagInfo(); out.tagInfo = !!tg && !!SPECIES[tg.id] && S.lakes.includes(tg.lake.id);
    reset(); startVisit(tg.lake, "dock"); const tf = makeFish(tg.id, 4 * PPF); tf.tagged = true; tf.variant = null; tf.sp = SPECIES[tg.id];
    trip.fish.push(tf); trip.phase = "reel"; trip.hook.y = 4 * PPF; hookFish(tf); trip.fight = null; trip.phase = "reel"; if (!trip.caught.length) landFish(tf);
    for (let i = 0; i < 600 && trip; i++){ crank(); updateFishing(1/30); }
    out.tagged = !!(pending && pending.items.some(it => it.f.tagged && it.coins >= TAG_PRIZE)) && S.tag && S.tag.w === tg.w && tagInfo().caught;
    pending = null; reset();
    startVisit(D, "dock"); trip.phase = "ready"; visit.mode = "boat"; visit.weather = { target: 1, level: 1, next: Date.now() + 1e6, storm: { left: .05, flash: 0 } };
    out.stormBite = stormOn(); updateWeather(.1); out.storm = visit.mode === "dock" && !stormOn();
    out.moon = typeof fullMoon() === "boolean" && moonPhase() >= 0 && moonPhase() < 1;
    reset();
    // --- gear
    S.coins = 5000; showScreen("shop"); const buy = name => { const row = [...document.querySelectorAll("#shopList .shopitem")].find(d => d.textContent.includes(name)); if (row) row.querySelector("button").click(); };
    buy("Rod Holder"); buy("Landing Net"); buy("Live Well"); buy("Heavy Rod");
    out.bought = S.holder && S.net && S.livewell && S.heavyRod && S.coins === 5000 - 400 - 250 - 300 - 600;
    startVisit(D, "dock"); const l0 = S.landed || 0; visit.holder = { clock: 999, next: 1, bite: 0 }; trip.phase = "ready"; updateFishing(1/30);
    syncReelBtn(); out.bell = visit.holder.bite > 0 && getComputedStyle($("bellBtn")).display !== "none";
    $("bellBtn").click(); out.holder = (S.landed || 0) === l0 + 1 && visit.holder.bite === 0;
    const nf = makeFish("channel", 3 * PPF); trip.fish.push(nf); trip.phase = "reel"; trip.hook.y = 3 * PPF; hookFish(nf);
    trip.phase = "fight"; trip.fight = trip.fight || { f: nf, tension: 100, prog: 10, stage: 1, stages: 2, surge: 0, nextRun: 9, shake: 0 }; trip.fight.tension = 100; trip.hook.y = 3 * PPF; btnHeld = true; updateFight(1/30); btnHeld = false;
    out.net = !!trip.fight && trip.fight.tension < 100;
    reset();
    // --- the cabin
    S.coins = 5000; showScreen("lodge"); const cbtn = [...document.querySelectorAll("#lodgeBody button")].find(b => b.textContent === D.name); if (cbtn) cbtn.click();
    out.cabin = S.cabin && S.cabin.lake === "dixon" && S.coins === 5000 - CABIN_COST;
    const ubtn = name => { const row = [...document.querySelectorAll("#lodgeBody .row")].find(r => r.textContent.includes(name)); if (row) row.querySelector("button").click(); };
    ubtn("Long dock"); ubtn("Bait fridge"); ubtn("Dock lights");
    const w0 = S.baitCount.worm || 0; startVisit(D, "dock");
    out.longDock = S.cabin.up.longdock && trip.bottom > 24 * PPF && (S.baitCount.worm || 0) >= w0 + 9;
    await new Promise(r => setTimeout(r, 250));                                  // a few frames with the cabin drawn
    reset();
    // --- rewards
    S.tmap = { pieces: 0 }; for (let i = 0; i < 200 && S.tmap.pieces < 4; i++) chestExtra();
    out.map = S.tmap.pieces === 4 && !!lakeById(S.tmap.lake);
    S.boatOwn = Math.max(1, S.boatOwn); S.lakes.includes(S.tmap.lake) || S.lakes.push(S.tmap.lake); startVisit(lakeById(S.tmap.lake), "boat");
    out.goldSpot = trip.snags.some(sg => sg.gold);
    const c1 = S.coins; openGoldChest(); out.gold = S.tmap.done && S.coins === c1 + 500 && S.vl.includes(29); reset();
    out.lures = VLURES.length === 30 && S.vl.length >= 1;
    S.bosses = Object.assign({}, S.bosses, { dixon: true }); showScreen("lodge");
    const patch = [...document.querySelectorAll("#lodgeBody .patches button")].find(b => b.textContent.includes("Boss Beater")); if (patch) patch.click();
    out.title = titleOf() === "Boss Beater"; showTitle(); out.titleShown = $("whoName").textContent.includes("Boss Beater");
    showScreen("lodge"); out.cardsN = [Object.keys(S.cards).length, document.querySelectorAll("#lodgeBody .dexgrid canvas").length];
    out.cards = out.cardsN[0] >= 1 && out.cardsN[1] >= VLURES.length + LAKES.length;
    S.sd.wins = { local: 2, county: 1 }; S.sponsor = false; const sp = sponsorCheck(); S.sponsorDay = "x"; const c2 = S.coins; startVisit(D, "dock");
    out.sponsor = !!sp && S.sponsor && S.coins === c2 + SPONSOR_PAY;
    reset(); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(bak)); showScreen("title");
    return out;
  });
  ok(r9.locked, "the County Cup is locked until you win a Local Derby");
  ok(r9.started, "a Showdown takes the entry fee and puts you on the dock with 2 rivals");
  ok(r9.rivalsFish, "the rivals catch fish while the clock runs");
  ok(r9.finished, "when time's up the standings show, the winner gets 3x the entry and a cup");
  ok(r9.county, "winning a Local Derby opens the County Cup");
  ok(r9.scores, "each contest is scored its own way (bag, kinds, biggest, most)");
  ok(r9.sib !== false, "a brother or sister can be your rival with their real best fish");
  ok(r9.frenzy && r9.frenzyEnds, "a feeding frenzy starts, makes fish hungrier, and ends");
  ok(r9.tagInfo && r9.tagged, "the tagged fish of the week pays " + 150 + " coins once");
  ok(r9.stormBite && r9.storm, "a storm sends boats back to the dock when lightning hits");
  ok(r9.moon, "the full moon follows the real moon");
  ok(r9.bought, "the rod holder, net, live well and heavy rod are in the Tackle Shop");
  ok(r9.bell && r9.holder, "the rod holder's bell rings and tapping it lands a fish");
  ok(r9.net, "the landing net stops a snap near the top");
  ok(r9.cabin && r9.longDock, "a lake cabin can be bought and upgraded (long dock, bait fridge)");
  ok(r9.map && r9.goldSpot && r9.gold, "4 map pieces lead to a golden chest worth 500 coins and the Golden Spoon");
  ok(r9.lures, "vintage lures are collected");
  ok(r9.title && r9.titleShown, "vest patches give titles that show by your name");
  ok(r9.cards, "postcards and the lure collection show in the Lodge (" + r9.cardsN + ")");
  ok(r9.sponsor, "3 Showdown wins bring a sponsor who pays every day");

  const r10 = await a.evaluate(() => {
    const out = {}; trip = null; visit = null; startVisit(lakeById("dixon"), "dock");
    reelPress(); reelRelease(); out.tap = trip.phase === "cast" && !trip.perfect;
    startTrip(lakeById("dixon"), 0, "dock", true); trip.phase = "ready";
    reelPress(); for (let i = 0; i < 31; i++) updateFishing(1/30); out.holding = trip.phase === "ready" && !!trip.charge;
    while (castPower(trip.charge.t) < .99) updateFishing(1/120);
    reelRelease(); out.perfect = trip.phase === "cast" && trip.perfect && trip.castX > W * .6;
    startTrip(lakeById("dixon"), 0, "dock", true); trip.phase = "ready"; reelPress(); for (let i = 0; i < 12; i++) updateFishing(1/30); reelRelease();
    out.short = trip.phase === "cast" && !trip.perfect && trip.castX < trip.tipX + 120;
    trip = null; visit = null; showScreen("title"); return out; });
  ok(r10.tap, "a quick tap casts anywhere");
  ok(r10.holding && r10.perfect, "holding fills the power bar; letting go at the top makes a long PERFECT cast");
  ok(r10.short, "letting go early makes a short cast");

  console.log("Fish moves and hotspots");
  const r11 = await a.evaluate(() => {
    const out = {}, bakMoves = S.moves, bakBoat = S.boatOwn; S.boatOwn = 2; S.wild = Object.assign({}, S.wild, { nextBig: 1e9, nextSee: 1e9 });
    const hook = (id, kind) => { trip = null; visit = null; startVisit(lakeById("dixon"), "boat"); visit.ev = { clock: 0, next: 1e9 };
      const f = makeFish(id, 30 * PPF); f.variant = null; f.sp = SPECIES[id]; f.inches = SPECIES[id].max * .6; f.jumped = true; f.trophy = false; f.frac = .5; f.L = fishPx(f.sp, f.inches);
      trip.snags = []; trip.fish.push(f); trip.phase = "reel"; trip.hook.y = 30 * PPF; trip.hook.x = W / 2 + 80; hookFish(f);
      trip.moveF = f; trip.moveCD = 99; if (kind) trip.move = { kind, t: 0, stage: 0, toward: true, ok: true }; return f; };
    S.moves = { shake: 20 };                                           // an experienced angler: no beginner help
    let f = hook("largemouth", "shake");
    for (let i = 0; i < 90 && trip.caught.length; i++){ if (i % 3 === 0) crank(); updateFishing(1/30); }
    out.shakeLost = !trip.caught.includes(f) && trip.lost === 1;
    f = hook("largemouth", "shake"); const n0 = S.moves.shake;
    for (let i = 0; i < 50; i++){ btnHeld = false; updateFishing(1/30); }
    out.shakeOk = trip.caught.includes(f) && S.moves.shake === n0 + 1 && f.worn === 1 && !trip.move;
    f = hook("channel", "dive"); for (let i = 0; i < 60; i++){ btnHeld = true; updateFishing(1/30); } btnHeld = false;
    out.dive = trip.caught.includes(f) && (S.moves.dive || 0) >= 1;
    f = hook("trout", "zigzag"); updateFishing(.1); const t1 = trip.move.toward; trip.move.t = .65; updateFishing(.01); out.zig = t1 === true && trip.move.toward === false && moveWant(trip.move, false) === "idle";
    f = hook("carp", "run"); for (let i = 0; i < 60; i++){ btnHeld = false; updateFishing(1/30); } out.run = trip.move && trip.move.stage === 1 && moveWant(trip.move, false) === "tap";
    f = hook("bluecat"); out.fightFish = trip.phase === "fight"; trip.moveCD = 0; trip.hook.y = 20 * PPF; updateFishing(1/30); out.fightMove = !!trip.move;
    if (trip.move){ trip.move.kind = "shake"; const t0 = trip.fight.tension; btnHeld = true; updateFight(.2); btnHeld = false; out.fightTension = trip.fight.tension > t0 + 10; }
    f = hook("largemouth"); trip.tired = true; trip.moveCD = 0; updateFishing(1/30); out.tired = !trip.move;
    // boss runs can be steered now
    trip = null; visit = { lake: lakeById("dixon"), mode: "boat", ev: { clock: 0, next: 1e9 } }; S.coins = 999; startTrip(lakeById("dixon"), 25);
    const bf = trip.fish.find(x => x.boss); trip.phase = "drop"; trip.hook.x = W / 2; trip.hook.y = bf.y; hookFish(bf); trip.fight.run = { dir: 1, t: 2 }; trip.fight.nextRun = 99; trip.move = null; trip.moveCD = 99;
    pointerX = W * .15; for (let i = 0; i < 40; i++){ trip.moveCD = 99; updateFight(1/30); } out.steer = trip.hook.x < W / 2; pointerX = null;
    // hotspots
    trip = null; visit = null; startVisit(lakeById("dixon"), "boat"); visit.ev = { clock: 0, next: 1e9 };
    trip.phase = "ready"; for (let i = 0; i < 30 * 5; i++) updateFishing(1/30);
    out.spots = (visit.spots || []).length >= 1 && visit.spots.every(sp => SPOTS[sp.kind] && sp.x > 0 && sp.x < W);
    syncReelBtn(); out.spotBtn = getComputedStyle($("spotBtn")).display !== "none";
    const sp = visit.spots[0]; spotMenu(); out.menu = $("modalBox").textContent.includes(sp.name); $("modal").classList.remove("show");
    goSpot(sp); for (let i = 0; i < 30 * 2; i++) updateFishing(1/30);
    out.atSpot = visit.spot && visit.spot.kind === sp.kind && visit.spot.casts === SPOT_CASTS - 1 && visit.motorT === 0;
    for (let k = 0; k < SPOT_CASTS - 1; k++) startTrip(visit.lake, 0, "boat", true);
    out.coolOff = !visit.spot;
    trip = null; visit = null; $("modal").classList.remove("show"); S.moves = bakMoves; S.boatOwn = bakBoat; showScreen("title");
    return out; });
  ok(r11.shakeLost, "reeling through a head shake throws the hook");
  ok(r11.shakeOk, "letting go through a head shake keeps the fish and wears it out");
  ok(r11.dive, "holding through a dive pumps the fish up");
  ok(r11.zig, "a zig-zag switches between reel and wait");
  ok(r11.run, "after a big run the fish turns and you reel fast");
  ok(r11.fightFish && r11.fightMove && r11.fightTension, "big fish make moves in a fight too (holding through a shake raises tension)");
  ok(r11.tired, "a fish you've beaten doesn't make moves on the way up");
  ok(r11.steer, "you can steer a boss away from the logs");
  ok(r11.spots && r11.spotBtn && r11.menu, "spots appear from the boat with a 🧭 Spots button");
  ok(r11.atSpot && r11.coolOff, "motoring to a spot gives 4 casts there, then it cools off");

  console.log("Bug fixes from the full review");
  const r12 = await a.evaluate(async () => {
    const out = {}, bak = JSON.stringify(S), D = lakeById("dixon");
    // the game keeps running after an error in a frame
    const orig = window.renderScene; let thrown = 0; window.renderScene = function(){ if (!thrown++) throw new Error("test boom"); return orig.apply(this, arguments); };
    const f0 = performance.now(); await new Promise(r => setTimeout(r, 400)); window.renderScene = orig;
    let frames = 0; const cnt = () => { frames++; if (frames < 5) requestAnimationFrame(cnt); }; requestAnimationFrame(cnt); await new Promise(r => setTimeout(r, 400));
    out.loop = thrown >= 1 && frames >= 5;
    // a rented boat is paid once per visit
    S.boatOwn = 0; S.coins = 100; trip = null; visit = null; startVisit(D, "boat"); const c1 = S.coins;
    toggleBoat(); toggleBoat(); out.rentOnce = S.coins === c1 && visit.mode === "boat" && c1 === 100 - D.boat;
    // going back to the dock while motoring to a spot doesn't lock casting
    S.boatOwn = 2; trip = null; visit = null; startVisit(D, "boat"); visit.spots = [newSpot(D, [])]; goSpot(visit.spots[0]); toggleBoat();
    trip.phase = "ready"; reelPress(); reelRelease(); out.motorUnlock = trip.phase === "cast" && !(visit.motorT > 0);
    // leaving after a fish ate your worm doesn't give the worm back
    trip = null; visit = null; S.baits = S.baits.concat("worm"); S.baitCount.worm = 5; S.bait = "worm"; startVisit(D, "dock"); const w0 = S.baitCount.worm; trip.baitLost = true; leaveLake();
    out.noBaitRefund = S.baitCount.worm === w0;
    // hooking a fish that's already gone never deletes a different fish
    trip = null; visit = null; startVisit(D, "dock"); const n0 = trip.fish.length, ghost = makeFish("bluegill", 60); trip.phase = "drop"; hookFish(ghost); out.hookSafe = trip.fish.length === n0;
    // Pearl's mystery gift never hands out a prize-only item
    S.owned = []; S.prizes = {}; let bad = 0; for (let i = 0; i < 200; i++){ const before = S.owned.length; mysteryGift(); const g = S.owned[before]; if (g){ const [k, key] = g.split(":"); const T = ({ hat:HATS, rod:RODS, paint:PAINTS })[k]; if (T[key].prize || T[key].champ) bad++; } }
    out.gift = bad === 0;
    // rivals stop catching when time's up
    trip = null; visit = null; S.coins = 500; S.sd = { wins:{}, played:0, cups:[] }; startShowdown(D); const sd = visit.sd;
    trip.phase = "fight"; trip.fight = { f: makeFish("channel", 200), tension: 0, prog: 0, surge: 0, nextSurge: 99, stage: 1, stages: 1, shake: 0, nextRun: 99 }; sd.left = 0; sd.rivals.forEach(r => r.next = 0);
    const before = sd.rivals.map(r => r.fish.length).join(); for (let i = 0; i < 30; i++){ sdUpdate(trip, 1/30); } out.overtime = sd.rivals.map(r => r.fish.length).join() === before;
    trip = null; visit = null;
    // a boss you can't afford waits: the basket stays full
    S.coins = 0; S.bosses = {}; S.day = { lake: "dixon", kept: [{ id: "bluegill" }, { id: "bluegill" }] }; bossOffer(D, () => {}); $("modalBox").querySelector("button:last-child").click();
    out.bossWaits = S.day.kept.length === 2;
    $("modal").classList.remove("show"); modalQueue = []; prizeQueue = [];
    Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(bak)); showScreen("title");
    return out; });
  const r13 = await a.evaluate(async () => {
    trip = null; visit = null; startVisit(lakeById("dixon"), "dock"); const rb = $("reelBtn"), out = {};
    const ev = (t, id) => rb.dispatchEvent(new PointerEvent(t, { pointerId: id, bubbles: true, pointerType: "touch" }));
    ev("pointerdown", 71); trip.phase = "ready"; trip.charge = null; btnHeld = false;         // a finger lift iOS never delivered
    ev("pointerdown", 72); ev("pointerup", 72); out.a = trip.phase === "cast";
    startTrip(lakeById("dixon"), 0, "dock", true); trip.phase = "ready";
    ev("pointerdown", 73); trip.phase = "reel"; trip.charge = null; trip.phase = "ready";       // lost while holding
    ev("pointerdown", 74); ev("pointerup", 74); out.b = trip.phase === "cast";
    trip = null; visit = null; btnHeld = false; showScreen("title"); return out; });
  ok(r13.a && r13.b, "a lost finger-lift on the reel button never blocks the next cast");
  ok(r12.loop, "one error in a frame doesn't freeze the game");
  ok(r12.rentOnce, "a rented boat is paid for once per visit");
  ok(r12.motorUnlock, "going back to the dock while motoring to a spot doesn't block casting");
  ok(r12.noBaitRefund, "leaving the lake doesn't give back bait a fish already ate");
  ok(r12.hookSafe, "hooking never removes a different fish");
  ok(r12.gift, "Pearl's mystery gift never gives a prize-only item");
  ok(r12.overtime, "Showdown rivals stop catching when time's up");
  ok(r12.bossWaits, "a boss you can't afford yet waits, and the basket stays full");

  console.log("Prizes");
  // device a (Ben signed in): a parent sets a prize for Ana; device b (Ana signed in) must get it, and earn it
  await a.evaluate(() => { trip = null; visit = null; showScreen("title"); LL.parentCorner(); });
  await a.fill("#llPin", "9999"); await a.click("#llO");                 // the newest PIN (set on device b) is the family's PIN
  const anaBtn = await a.$$("[data-padd]"); if (!anaBtn.length) console.log("PC:", (await a.textContent("#llOv")).slice(0, 300)); await anaBtn[0].click();
  await a.selectOption("#llPG", "land1000"); await a.fill("#llPT", "Pizza night"); await a.click("#llPS");
  ok((await a.textContent("#llOv")).includes("Pizza night"), "a parent can set a prize from home");
  await a.click("#llDone"); await a.evaluate(() => LL.syncNow()); await a.waitForTimeout(300);
  await b.evaluate(() => LL.syncNow()); await b.waitForTimeout(300);
  ok(await b.evaluate(() => (LL.player().pprizes || []).some(x => x.text === "Pizza night")), "the prize reaches the kid's device even while they're playing there");
  const pz = await b.evaluate(() => { S.landed = 1000; S.dex = Object.assign({}, S.dex); for (const id of DEX_ORDER.slice(0, 5)) S.dex[id] = S.dex[id] || { n:1, best: SPECIES[id].min + 1 };
    const c0 = S.coins; save(); return { coins: S.coins - c0, pirate: owns("hat", "pirate"), earned: !!(LL.player().pprizes.find(x => x.text === "Pizza night") || {}).earned, queued: prizeQueue.length }; });
  ok(pz.pirate && pz.coins >= 100 + 100, "the prize ladder pays coins and unlocks prize items (pirate hat)");
  ok(pz.earned && pz.queued >= 2, "the prize from home is earned and announced");
  await b.waitForTimeout(1200);
  ok((await b.textContent("#modalBox")).length > 0 && await b.isVisible("#modal"), "prizes pop up on the title screen");
  await b.evaluate(() => { while ($("modal").classList.contains("show")){ $("modalBox").querySelector("button:last-child").click(); flushPrizes(); } });
  await b.evaluate(() => printCertificate({ sp: SPECIES.largemouth, inches: 22.4, lb: 7.4, lake: "Dixon Lake", t: Date.now() }));
  ok(await b.isVisible("#cert .certpage") && (await b.textContent("#cert")).includes("Ana"), "a catch certificate is ready to print");
  await b.click("#certClose");

  const realErrs = errs.filter(e => !/test boom/.test(e));             // the frame-error test throws one on purpose
  ok(!realErrs.length, "no page errors" + (realErrs.length ? ": " + realErrs.slice(0, 3).join(" | ") : ""));
  await browser.close(); server.close();
  console.log("\n" + checks + " checks, " + fails.length + " failed");
  console.log(fails.length ? "RESULT: FAIL" : "RESULT: PASS");
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); console.log("RESULT: FAIL"); process.exit(1); });
