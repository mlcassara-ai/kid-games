#!/usr/bin/env node
/* Heritage Night smoke test:  node heritage-night/tools/smoke.js [shotsDir]
   Serves the repo, fakes Firebase (with updateTime preconditions and a server clock), opens the big screen with a
   wrong device clock plus three phones in fast mode, plays one question and checks everyone agrees. */
const path = require('path'), http = require('http'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const ROOT = path.join(__dirname, '..', '..'), SHOTS = process.argv[2];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f.endsWith('/') ? f + 'index.html' : f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    // the real host key is secret (only its hash is in hn-core.js), so the test swaps in the hash of 'testkey'
    if (f.endsWith('hn-core.js')) d = Buffer.from(d.toString().replace(/var HOST_HASH = '[0-9a-f]+'/, "var HOST_HASH = '" + require('crypto').createHash('sha256').update('testkey').digest('hex') + "'"));
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'text/html' }); r.end(d);
  });
});
const fails = []; let checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const STORE = new Map(); let conflicts = 0;
// The fake server clock is shifted so the test lands on the 10th question of a round that is a double-points question,
// with two questions before it to build a 3-answer streak (same seeded generator as hn-core.js).
const CYCLE = 4000 + 6000 + 3000, RL = 10 * CYCLE - 3000 + 5000;   // fast mode; the 10th reveal is 5 s
const startOf = c => Math.floor(c / 10) * RL + (c % 10) * CYCLE;
function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const isDouble = c => rng(c * 7907 + 3)() < 1 / 8;
let C = Math.floor(Date.now() / RL) * 10 + 100; while (C % 10 !== 9 || !isDouble(C)) C++;
let SHIFT = 0;   // set just before the phones join
const stamp = () => new Date(Date.now() + SHIFT).toISOString().replace('Z', '123Z') ; // server time, with extra digits like Firestore
async function fake(ctx) {
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.fulfill({ status: 200, body: '' }));
  await ctx.route(/identitytoolkit|securetoken/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ idToken: 't', refreshToken: 'r', expiresIn: '3600', id_token: 't', refresh_token: 'r', expires_in: '3600' }) }));
  await ctx.route(/firestore\.googleapis\.com/, async r => {
    if (r.request().method() !== 'GET') await new Promise(res => setTimeout(res, 30));
    const u = r.request().url(), id = decodeURIComponent(u.split('/families/')[1].split('?')[0]), cur = STORE.get(id);
    if (id.length < 16) return r.fulfill({ status: 403, body: 'PERMISSION_DENIED' });   // like the real rules
    if (r.request().method() === 'GET') {
      if (!cur) return r.fulfill({ status: 404, body: '{}' });
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fields: { data: { stringValue: cur.data } }, updateTime: cur.ut }) });
    }
    const pre = new URL(u).searchParams;
    if (pre.get('currentDocument.exists') === 'false' && cur) { conflicts++; return r.fulfill({ status: 409, body: 'ALREADY_EXISTS' }); }
    const want = pre.get('currentDocument.updateTime');
    if (want && (!cur || cur.ut !== want)) { conflicts++; return r.fulfill({ status: 400, body: 'FAILED_PRECONDITION' }); }
    const b = JSON.parse(r.request().postData()), ut = stamp();
    STORE.set(id, { data: b.fields.data.stringValue, ut });
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ updateTime: ut }) });
  });
}
async function page(browser, vp, errs, skew) {
  const ctx = await browser.newContext({ viewport: vp });
  await fake(ctx);
  if (skew) await ctx.addInitScript(s => { const n = Date.now.bind(Date); Date.now = () => n() + s; }, skew);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  return p;
}
const shot = async (p, n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
const waitPhase = (p, name) => p.waitForFunction(n => HN.phase().name === n, name, { timeout: 30000 });

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://localhost:' + server.address().port + '/heritage-night/';
  const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const errs = [];
  try {
    SHIFT = startOf(C - 2) - 9000 - Date.now();   // 9 s before the first streak question starts
    const scr = await page(browser, { width: 1920, height: 1080 }, errs, -47000);   // screen clock 47 s slow
    await scr.goto(base + 'screen.html?fast=1&e=test');
    const phones = [];
    for (let i = 0; i < 3; i++) { const p = await page(browser, { width: 390, height: 844 }, errs, i * 400); await p.goto(base + '?fast=1&e=test'); phones.push(p); }
    await phones[0].waitForSelector('#next'); await shot(phones[0], 'phone-join');
    ok(/Step 1 of 3/.test(await phones[0].textContent('.steps')) && /Pick a character/.test(await phones[0].textContent('.step-t')), 'join step 1 of 3: pick a character');
    const n1 = await phones[0].textContent('.big-nm'); await phones[0].click('#reroll');
    ok((await phones[0].textContent('.big-nm')).length > 3, 'name re-roll gives a name (' + n1 + ')');
    await phones[0].click('[data-av="3"]');
    ok(/Sea Turtle$/.test(await phones[0].textContent('.big-nm')), 'picking an avatar makes a matching name');
    for (const p of phones) await p.click('#next');
    ok(/Step 2 of 3/.test(await phones[0].textContent('.steps')) && /Pick your grade/.test(await phones[0].textContent('.step-t')), 'join step 2 of 3: pick your grade');
    ok(await phones[0].locator('#next[disabled]').count() === 1, 'cannot go on before picking a grade');
    const grades = ['3', 'k', 'a'];   // phones A and B are kids, phone C is a grown-up
    for (let i = 0; i < 3; i++) { await phones[i].click('[data-g="' + grades[i] + '"]'); await phones[i].click('#next'); }
    ok(/Step 3 of 3/.test(await phones[0].textContent('.steps')) && /Ready to play/.test(await phones[0].textContent('.step-t')) && /Sea Turtle/.test(await phones[0].textContent('.big-nm')), 'join step 3 of 3: ready to play');
    await shot(phones[0], 'phone-ready');
    for (const p of phones) await p.click('#go');
    // the test joins in the middle of a question, so every phone waits for the next fact card
    ok(await phones[0].evaluate(() => HN.phase().name) !== 'fact' && /You’re in/.test(await phones[0].textContent('.panel')), 'joining mid-question waits for the next fact');
    await shot(phones[0], 'phone-wait');
    await scr.waitForTimeout(1500);
    ok(await scr.evaluate(() => HN.isSynced()), 'screen clock synced to server time');
    const cyc = await Promise.all([scr, ...phones].map(p => p.evaluate(() => HN.phase().cycle)));
    ok(cyc.every(c => c === cyc[0]), 'screen and phones agree on the cycle despite the screen clock being 47 s off');
    await scr.waitForFunction(() => /Answer a question/.test(document.getElementById('board').textContent), null, { timeout: 8000 }).catch(() => {});
    ok(await scr.locator('.row').count() === 0 && /Answer a question/.test(await scr.textContent('#board')), 'Playing Now board waits for a first answer');
    for (const p of phones) await p.waitForFunction(() => HN.isSynced(), null, { timeout: 8000 });
    const atQ = (p, c) => p.waitForFunction(c => { const h = HN.phase(); return h.cycle === c && h.name === 'question'; }, c, { timeout: 40000 });
    ok(await scr.evaluate(c => HN.qInRound(c) === 10 && HN.isDouble(c) && HN.roundOf(c) === HN.roundOf(c - 2), C), 'test lands on a double-points 10th question');
    ok(await scr.evaluate(() => { let n = 0; for (let c = 0; c < 8000; c++) if (HN.isDouble(c)) n++; return n > 800 && n < 1200; }), 'about 1 in 8 questions is double points');
    ok(await scr.evaluate(() => {   // every phase lines up: normal reveals are short, the 10th question's reveal is long
      const T = HN.T, t0 = 5e12; let prev = HN.phase(t0), lens = {};
      for (let t = t0; t < t0 + 3 * (10 * T.cycle + T.champ); t += 250) { const p = HN.phase(t); if (p.cycle < prev.cycle || p.cycle > prev.cycle + 1) return false; if (p.name === 'reveal') lens[HN.qInRound(p.cycle)] = p.len; prev = p; }
      return lens[1] === T.reveal && lens[10] === T.champ;
    }), 'the 10th question gets the long Round Champion reveal');
    for (const c of [C - 2, C - 1]) {   // phone A builds a streak; phone B gets one right
      await atQ(phones[0], c); await phones[0].waitForSelector('.ans');
      const r = await phones[0].evaluate(() => HN.questionFor(HN.phase().cycle).right);
      await phones[0].click('.ans.o' + r); if (c === C - 2) await phones[1].click('.ans.o' + r);
    }
    ok(await phones[0].evaluate(() => JSON.parse(localStorage.getItem('heritagenight.me.test')).st) === 2, 'streak counts 2 in a row');
    await scr.waitForFunction(c => { const h = HN.phase(); return h.cycle === c && h.name === 'fact'; }, C, { timeout: 30000 }); await scr.waitForTimeout(600);
    await shot(scr, 'screen-fact'); await shot(phones[0], 'phone-fact');
    ok(/Chocolate lira winners after this question/.test(await scr.textContent('.prize')), 'fact card says the chocolate lira winners come after this question');
    ok(/Question 10 of 10/.test(await scr.textContent('#rnd')), 'top bar shows the round and question number');
    const clk = async () => ({ n: +(await scr.textContent('#secs')), c: await scr.getAttribute('#clock', 'class') });
    const cf = await clk(); ok(cf.n >= 1 && cf.n <= 4 && cf.c === 'clock', 'countdown clock on the fact card (' + cf.n + ' s)');
    ok(/Grown-ups/.test(await scr.textContent('#who')) && /side gr/.test(await scr.getAttribute('.side', 'class')), 'side board takes its grown-up turn on an odd question');
    ok(await scr.locator('.dbl').count() === 1 && await phones[0].locator('.dbl').count() === 1, 'double points banner on the screen and the phone');
    await atQ(phones[0], C); await phones[0].waitForSelector('.ans');
    const nameA = await phones[0].evaluate(() => JSON.parse(localStorage.getItem('heritagenight.me.test')).n), before = await phones[0].textContent('#sc');
    const right = await phones[0].evaluate(() => HN.questionFor(HN.phase().cycle).right);
    await shot(scr, 'screen-question'); await shot(phones[0], 'phone-question');
    await phones[0].click('.ans.o' + right);
    await phones[1].waitForTimeout(700); await phones[1].click('.ans.o' + ((right + 1) % 4));
    await phones[1].waitForTimeout(400); await shot(phones[1], 'phone-locked');
    ok(await phones[0].locator('.locked').count() === 1, 'answer locks in');
    ok(/Remember the last fact/.test(await scr.textContent('#body')) && /Remember the last fact/.test(await phones[0].textContent('.panel')), 'question screens say it is about the last fact');
    const cq = await clk(); ok(/ q/.test(cq.c) && cq.n >= 1 && cq.n <= 6, 'countdown clock on the question, in red (' + cq.n + ' s)');
    ok(await phones[0].textContent('#sc') === before, 'score hidden until the reveal');
    for (let i = 0; i < 16 && !/2/.test(await scr.textContent('#status')); i++) await scr.waitForTimeout(500);   // the screen polls every 4 s
    ok(/2/.test(await scr.textContent('#status')), 'screen counts 2 answered');
    await waitPhase(scr, 'reveal'); await scr.waitForTimeout(1600);
    await shot(scr, 'screen-reveal'); await shot(phones[0], 'phone-correct'); await shot(phones[1], 'phone-wrong'); await shot(phones[2], 'phone-missed');
    ok(/Correct/.test(await phones[0].textContent('.panel')), 'phone A sees Correct!');
    ok(/Not this time/.test(await phones[1].textContent('.panel')), 'phone B sees Not this time');
    ok(/Missed/.test(await phones[2].textContent('.panel')), 'phone C sees Missed');
    const top = await scr.textContent('.row:first-child .nm');
    ok(top.replace('🔥', '').startsWith(nameA), 'fastest right answer tops the leaderboard (' + top + ')');
    ok(/#1/.test(await phones[0].textContent('#rank')), 'phone A told it is #1');
    const sc = +(await phones[0].textContent('#sc')).replace(/,/g, '');
    const gain = +(await phones[0].textContent('.pts')).replace(/[^0-9]/g, '');
    ok(gain >= 120 && gain <= 220 && gain % 2 === 0, 'double points with the streak bonus (' + gain + ')');
    ok(/On fire! 3 in a row/.test(await phones[0].textContent('.panel')), 'phone shows the streak bonus');
    ok(sc >= gain + 100 && sc <= gain + 440, 'score in range (' + sc + ')');
    ok(/🔥/.test(await scr.textContent('.row:first-child .nm')), 'leaderboard shows 🔥 for the streak');
    await scr.waitForSelector('#champ.on', { timeout: 3000 }).catch(() => {}); await shot(scr, 'screen-champion');
    const ch = await scr.textContent('#champ').catch(() => '');
    ok(/Round 1 Winners/.test(ch) && ch.includes(nameA), 'winners screen crowns phone A (' + nameA + ')');
    ok(/🥈/.test(ch) && /wins 3 chocolate lira/.test(ch), 'winners screen shows the runner-up and what each one won');
    ok(await phones[1].evaluate(() => JSON.parse(localStorage.getItem('heritagenight.me.test')).st) === 0, 'a wrong answer ends the streak');
    ok(/Fastest/.test(await scr.textContent('#status')), 'screen shows the fastest player');
    ok(/Kids/.test(await scr.textContent('#who')), 'answer reveal always shows the kids board');
    const cr = await clk(); ok(/ r$/.test(cr.c) && cr.n >= 1 && cr.n <= 5, 'countdown clock on the answer, in green (' + cr.n + ' s)');
    await scr.waitForTimeout(2800); await shot(scr, 'screen-winners');
    // the winner's phone and everyone else's
    await phones[0].waitForSelector('#wins.on', { timeout: 6000 }).catch(() => {});
    const wA = await phones[0].textContent('#wins').catch(() => '');
    ok(/You won/.test(wA) && /3 chocolate lira/.test(wA), 'the winner’s phone says You won! and the prize');
    await phones[2].waitForSelector('#wins.on', { timeout: 6000 }).catch(() => {});
    const wC = await phones[2].textContent('#wins').catch(() => '');
    ok(/Round winners/.test(wC) && wC.includes(nameA) && /Prizes are for the kids/.test(wC), 'other phones see the round winners');
    await phones[0].waitForTimeout(1200); await shot(phones[0], 'phone-won'); await shot(phones[2], 'phone-winners');
    await phones[0].click('#wnok'); ok(await phones[0].locator('#wins.on').count() === 0, 'Got my prize closes the winner card');
    const rules = await phones[0].evaluate(() => {
      const top = [{ id: 'A', rs: 300 }, { id: 'B', rs: 200 }, { id: 'C', rs: 100 }, { id: 'D', rs: 50 }];
      const one = HN.pickWinners(top, { A: 1 }, 1), three = HN.pickWinners(top, { A: 2 }, 3);
      return { skip: one.win.map(p => p.id).join('') === 'BCD' && one.win[0].lira === 3 && one.maxed[0].id === 'A',
        keep: three.win[0].id === 'A', every: HN.questionsToPrize(9, 3, 3) === 1 && HN.questionsToPrize(9, 1, 3) === 21 && HN.questionsToPrize(9, 1, 0) === null };
    });
    ok(rules.skip, 'a kid at the win limit is skipped and the next kid wins');
    ok(rules.keep, 'with a limit of 3, a kid can win again');
    ok(rules.every, 'prize rounds every N rounds count down correctly');
    ok(/3rd/.test(await scr.textContent('.row:first-child .nm')), 'leaderboard shows the grade');
    ok(await scr.locator('.row').count() === 2 && /2 playing/.test(await scr.textContent('#count')), 'Playing Now lists the 2 kids who answered (the grown-up is not on it)');
    ok(/All-night stars/.test(await scr.textContent('#stars')) && (await scr.textContent('#stars')).includes(nameA), 'All-night stars shows the top kid');
    ok(/2 kids \+ 🤖 3/.test(await scr.textContent('#tkidn')) && /1 grown-up \+ 🤖 4/.test(await scr.textContent('#tgrn')), 'tug-of-war tops both sides up with robot helpers');
    ok(/🌲/.test(await scr.textContent('#knot')) && /🧒/.test(await scr.textContent('#plk')), 'cedar on the rope, pullers at the ends');
    ok(/pull/.test(await scr.textContent('#say')), 'screen says who won the pull (' + await scr.textContent('#say') + ')');
    const ropeNow = await scr.evaluate(() => JSON.parse(localStorage.getItem('heritagenight.rope.test')));
    ok(ropeNow.c === C && ropeNow.pos >= 0, 'one pull per question; robots never put the grown-ups ahead (rope ' + ropeNow.pos + ')');
    await phones[0].waitForSelector('#team:not(:empty)', { timeout: 5000 }).catch(() => {});
    ok(/pull/.test(await phones[0].textContent('#team')) && /pull/.test(await phones[2].textContent('#team')), 'phones say who won the pull');
    ok(/of 2 kids/.test(await phones[0].textContent('#rank')), 'kids are ranked among kids');
    // tug-of-war maths, straight from the engine (a cycle that is not double points)
    const tm = await scr.evaluate(() => {
      let c = 5; while (HN.isDouble(c)) c++;
      const at = pts => ({ q: c, k: true, st: 0, t: HN.T.q * (1 - (pts - 50) / 50) });   // a right answer worth pts
      const r = {};
      // robots alone can never give a side the lead
      let pos = 0; r.botsNoLead = true;
      for (let x = 0; x < 2000; x++) { pos = HN.movePos(pos, HN.pull({}, x)); if (pos !== 0) r.botsNoLead = false; }
      let pos2 = 0; for (let x = 0; x < 2000; x++) { pos2 = HN.movePos(pos2, HN.pull({ k: Object.assign({ g: '2' }, { q: x, k: false, st: 0, t: 0 }) }, x)); if (pos2 < 0) r.botsNoLead = false; }
      // averages, not head count: 10 kids worth 50 each (x1.8 = 90) lose to one grown-up worth 100, with no robots in the way
      const many = {}; for (let i = 0; i < 10; i++) many['k' + i] = Object.assign({ g: '4' }, at(50));
      for (let i = 0; i < 5; i++) many['g' + i] = Object.assign({ g: 'a' }, i ? { q: -1 } : at(100));
      const p2 = HN.pull(many, c); r.avg = p2.winner === 'grown' && p2.grownBots === 0 && p2.kidBots === 0;
      // the kid bonus: kids worth 60 (x1.8 = 108) beat grown-ups worth 100
      const b = {}; for (let i = 0; i < 5; i++) { b['k' + i] = Object.assign({ g: '1' }, at(60)); b['g' + i] = Object.assign({ g: 'a' }, at(100)); }
      r.bonus = HN.pull(b, c).winner === 'kids';
      // skipping counts 0 for a player who is playing now: 5 kids answer right (70 each), 5 more skipped this one
      const sk = {}; for (let i = 0; i < 10; i++) sk['k' + i] = Object.assign({ g: '2' }, i < 5 ? at(70) : { q: c - 1, k: true, st: 0, t: 0 });
      for (let i = 0; i < 5; i++) sk['g' + i] = Object.assign({ g: 'a' }, at(70));
      r.skip = HN.pull(sk, c).winner === 'grown';   // kids 35 avg x1.8 = 63 < 70
      // robots fill each side up to 5
      const one = HN.pull({ k: { g: '3' } }, c); r.fill = one.kidBots === 4 && one.grownBots === 5;
      return r;
    });
    ok(tm.botsNoLead, 'robot helpers never give their side the lead');
    ok(tm.avg, 'each pull uses the average, not the head count');
    ok(tm.bonus, 'kids get their 1.8x bonus');
    ok(tm.fill, 'robot helpers fill each side up to 5');
    ok(tm.skip, 'a skipped question counts 0 for a player who is playing now');
    // reload keeps the player
    await phones[0].reload(); await phones[0].waitForSelector('.me');
    ok((await phones[0].textContent('.me .nm')).startsWith(nameA), 'reload keeps the same player');
    // every question renders
    ok(await scr.evaluate(() => { for (let c = 1; c < 5000; c++) if (HN.questionFor(c).f !== HN.factFor(c - 1).f || HN.factFor(c).f === HN.factFor(c - 1).f) return false; return true; }), 'each question asks about the previous fact');
    ok(await scr.evaluate(() => { for (let c = 0; c < 200; c++) { const q = HN.questionFor(c); if (q.opts.length !== 4 || q.opts[q.right] !== HN.Q[q.id].o[0]) return false; } return true; }), 'shuffled answers keep the right one');
    // a burst of 30 more players writing at once
    await phones[2].evaluate(async () => { const ps = []; for (let i = 0; i < 30; i++) ps.push(HN.saveEntry('burst' + i, { n: 'Tester ' + i, a: '🦊', s: i * 10, c: 0, j: i, q: -1 })); await Promise.all(ps); });
    const all = await phones[2].evaluate(async () => Object.keys(await HN.allPlayers()).length);
    ok(all === 33, '30 simultaneous joins all saved (' + all + ' players, ' + conflicts + ' retried conflicts)');
    await scr.waitForTimeout(3500); await shot(scr, 'screen-busy');
    // anything wearing the robot avatar is never listed, so it can't be a winner
    const botGone = await phones[2].evaluate(async () => { await HN.saveEntry('zzrobot', { n: 'Robot', a: '🤖', s: 99999, c: 0, j: 0, q: -1 }); return !(await HN.allPlayers()).zzrobot; });
    ok(botGone, 'robot entries are filtered out of the player list');
    // auto-update: every page can read its own hn-core.js?v= number, and the served page carries the same one (so no reload loop)
    const ver = await scr.evaluate(async () => { const v = (document.querySelector('script[src*="hn-core.js"]').getAttribute('src').match(/v=(\d+)/) || [])[1];
      const t = await (await fetch(location.pathname + '?vcheck=1', { cache: 'no-store' })).text(); return v && (t.match(/hn-core\.js\?v=(\d+)/) || [])[1] === v; });
    ok(ver, 'the screen can check for a new version of itself');
    // 🎛️ the host page
    const pid = async p => p.evaluate(() => JSON.parse(localStorage.getItem('heritagenight.me.test')).pid);
    const pidA = await pid(phones[0]), pidB = await pid(phones[1]);
    const lockd = await page(browser, { width: 900, height: 1000 }, errs); await lockd.goto(base + 'host.html?fast=1&e=test#k=wrong');
    await lockd.waitForSelector('.lock'); await lockd.waitForTimeout(800);
    ok(/secret link/.test(await lockd.textContent('.lock')), 'host page stays locked without the secret link');
    const host = await page(browser, { width: 900, height: 1400 }, errs); await host.goto(base + 'host.html?fast=1&e=test#k=testkey');
    await host.waitForFunction(n => /prize round/.test(document.body.textContent) && document.body.textContent.includes(n), nameA, { timeout: 10000 }).catch(() => {});
    ok((await host.textContent('.round').catch(() => '')).includes(nameA) && /3 chocolate lira/.test(await host.textContent('.round').catch(() => '')), 'host page logs the round winners and their prizes');
    ok(await host.locator('#every').count() === 1 && await host.locator('#max').count() === 1, 'host page has the prize dropdowns');
    await host.selectOption('#every', '3'); await host.waitForTimeout(900);
    ok(await host.evaluate(async () => (await HN.readDoc('ctrl')).every === 3), 'the host can change how often prizes are given');
    await host.selectOption('#every', '1'); await host.waitForTimeout(900);
    await shot(host, 'host');
    await host.click('[data-call="' + pidA + '"]');
    await host.waitForTimeout(800);
    ok(await host.evaluate(async id => !!((await HN.readDoc('ctrl')).calls || {})[id], pidA), 'host can call a winner');
    for (let i = 0; i < 10 && !(await host.textContent('body')).includes('🎁×2'); i++) await host.waitForTimeout(700);
    ok((await host.textContent('body')).includes('🎁×2'), 'host counts the round win and the extra call as 🎁×2');
    await phones[0].waitForSelector('#prize.on', { timeout: 35000 }).catch(() => {});
    const pz = await phones[0].textContent('#prize').catch(() => '');
    ok(/You’re a winner/.test(pz) && pz.includes(pidA.slice(0, 4).toUpperCase()), 'the called phone shows the prize card with its code');
    await shot(phones[0], 'phone-prize');
    await phones[0].click('#pzok'); ok(await phones[0].locator('#prize.on').count() === 0, 'Got my prize closes the card');
    await host.click('[data-hide="' + pidB + '"]'); await host.waitForTimeout(800);
    for (let i = 0; i < 35; i++) { if (await host.evaluate(async id => { const b = await HN.readDoc('board'); return !!(b && b.ranks && !b.ranks[id] && b.at > Date.now() - 20000); }, pidB)) break; await host.waitForTimeout(1000); }
    ok(await host.evaluate(async id => !((await HN.readDoc('board')).ranks || {})[id], pidB), 'a hidden player leaves the big screen board');
    await host.click('#finon');
    await scr.waitForSelector('#final.on', { timeout: 10000 }).catch(() => {});
    ok(/Grand Champions/.test(await scr.textContent('#final')) && (await scr.textContent('#final')).includes(nameA), 'final winners fill the big screen');
    await shot(scr, 'screen-final');
    await phones[0].waitForSelector('#prize.on', { timeout: 35000 }).catch(() => {});
    ok(/whole night/.test(await phones[0].textContent('#prize').catch(() => '')), 'the night’s winner gets the final prize card');
    await host.click('#finoff');
    await scr.waitForFunction(() => !document.querySelector('#final.on'), null, { timeout: 10000 }).catch(() => {});
    ok(await scr.locator('#final.on').count() === 0, 'hiding the final winners goes back to the game');
    // 🔄 Reset from the host page: scores gone, phones sent back to join
    host.once('dialog', d => d.accept());
    await host.click('#reset');
    await scr.waitForFunction(() => !document.querySelector('.row'), null, { timeout: 8000 }).catch(() => {});
    ok(await scr.locator('.row').count() === 0, 'Reset empties the leaderboard');
    let left = '';
    for (let i = 0; i < 20; i++) { left = await phones[1].evaluate(async () => Object.values(await HN.allPlayers()).map(p => p.n).join(', ')); if (!left) break; await phones[1].waitForTimeout(500); }
    ok(!left, 'Reset clears every saved player' + (left ? ' (left: ' + left + ')' : ''));
    await phones[1].waitForSelector('.steps', { timeout: 30000 }).catch(() => {});
    ok(/Step 1 of 3/.test(await phones[1].textContent('.steps').catch(() => '')) && /New game/.test(await phones[1].textContent('#net')), 'a phone from the old game is sent back to join');
    await phones[1].click('#next'); await phones[1].click('[data-g="2"]'); await phones[1].click('#next'); await phones[1].click('#go'); await phones[1].waitForTimeout(1500);
    ok(await phones[1].evaluate(async () => Object.keys(await HN.allPlayers()).length) === 1, 'joining again works after a reset');
  } catch (e) { fails.push(String(e)); console.log(e); }
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close(); server.close();
  console.log(checks + ' checks, ' + fails.length + ' failed'); console.log('RESULT: ' + (fails.length ? 'FAIL' : 'PASS'));
  process.exit(fails.length ? 1 : 0);
})();
