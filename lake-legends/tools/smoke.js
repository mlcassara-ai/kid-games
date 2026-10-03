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
    else if (T.phase === "fight"){ if (T.fight.tension > 70) reelRelease(); else btnHeld = true; }
    else if (T.phase === "drop"){
      // pick a fish that likes the bait and drop down to it
      if (!T.goal) T.goal = T.fish.filter(f => interest(T, f) > .2 && f.y < T.maxY).sort((x, y) => Math.abs(x.x - hk.x) - Math.abs(y.x - hk.x))[0] || { x: hk.x, y: T.maxY };
      pointerX = T.goal.x;
      if (hk.y >= T.goal.y - 6){ reelPress(); reelRelease(); }
    }
    else if (T.phase === "reel"){
      if (T.caught.length){ btnHeld = false; if (steps % 3 === 0) crank(); }
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

  ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
  await browser.close(); server.close();
  console.log("\n" + checks + " checks, " + fails.length + " failed");
  console.log(fails.length ? "RESULT: FAIL" : "RESULT: PASS");
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); console.log("RESULT: FAIL"); process.exit(1); });
