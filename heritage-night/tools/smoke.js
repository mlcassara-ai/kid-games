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
  fs.readFile(f.endsWith('/') ? f + 'index.html' : f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'text/html' }); r.end(d); });
});
const fails = []; let checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails.push(msg); console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };
const STORE = new Map(); let conflicts = 0;
const stamp = () => new Date(Date.now()).toISOString().replace('Z', '123Z') ; // server time, with extra digits like Firestore
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
    const scr = await page(browser, { width: 1920, height: 1080 }, errs, -47000);   // screen clock 47 s slow
    await scr.goto(base + 'screen.html?fast=1&e=test');
    const phones = [];
    for (let i = 0; i < 3; i++) { const p = await page(browser, { width: 390, height: 844 }, errs, i * 400); await p.goto(base + '?fast=1&e=test'); phones.push(p); }
    await phones[0].waitForSelector('#go'); await shot(phones[0], 'phone-join');
    const n1 = await phones[0].textContent('.big-nm'); await phones[0].click('#reroll');
    ok((await phones[0].textContent('.big-nm')).length > 3, 'name re-roll gives a name (' + n1 + ')');
    for (const p of phones) await p.click('#go');
    await scr.waitForTimeout(1500);
    ok(await scr.evaluate(() => HN.isSynced()), 'screen clock synced to server time');
    const cyc = await Promise.all([scr, ...phones].map(p => p.evaluate(() => HN.phase().cycle)));
    ok(cyc.every(c => c === cyc[0]), 'screen and phones agree on the cycle despite the screen clock being 47 s off');
    await scr.waitForFunction(() => document.querySelectorAll('.row').length === 3, null, { timeout: 8000 }).catch(() => {});
    ok(await scr.locator('.row').count() === 3, 'leaderboard lists 3 players');
    await waitPhase(scr, 'fact'); await scr.waitForTimeout(800); await shot(scr, 'screen-fact'); await shot(phones[0], 'phone-fact');
    await waitPhase(phones[0], 'question'); await phones[0].waitForSelector('.ans');
    const right = await phones[0].evaluate(() => HN.questionFor(HN.phase().cycle).right);
    await shot(scr, 'screen-question'); await shot(phones[0], 'phone-question');
    await phones[0].click('.ans.o' + right);
    await phones[1].waitForTimeout(700); await phones[1].click('.ans.o' + ((right + 1) % 4));
    await phones[1].waitForTimeout(400); await shot(phones[1], 'phone-locked');
    ok(await phones[0].locator('.locked').count() === 1, 'answer locks in');
    ok(await phones[0].textContent('#sc') === '0', 'score hidden until the reveal');
    await scr.waitForTimeout(3000);
    ok(/2/.test(await scr.textContent('#status')), 'screen counts 2 answered');
    await waitPhase(scr, 'reveal'); await scr.waitForTimeout(1600);
    await shot(scr, 'screen-reveal'); await shot(phones[0], 'phone-correct'); await shot(phones[1], 'phone-wrong'); await shot(phones[2], 'phone-missed');
    ok(/Correct/.test(await phones[0].textContent('.panel')), 'phone A sees Correct!');
    ok(/Not this time/.test(await phones[1].textContent('.panel')), 'phone B sees Not this time');
    ok(/Missed/.test(await phones[2].textContent('.panel')), 'phone C sees Missed');
    const top = await scr.textContent('.row:first-child .nm'), a = await phones[0].textContent('.me .nm');
    ok(a.startsWith(top.replace('▲', '')), 'fastest right answer tops the leaderboard (' + top + ')');
    ok(/#1/.test(await phones[0].textContent('#rank')), 'phone A told it is #1');
    const sc = +(await phones[0].textContent('#sc')).replace(/,/g, '');
    ok(sc >= 500 && sc <= 1000, 'score in range (' + sc + ')');
    ok(/Fastest/.test(await scr.textContent('#status')), 'screen shows the fastest player');
    // reload keeps the player
    await phones[0].reload(); await phones[0].waitForSelector('.me');
    ok((await phones[0].textContent('.me .nm')).startsWith(top.replace('▲', '')), 'reload keeps the same player');
    // every question renders
    ok(await scr.evaluate(() => { for (let c = 0; c < 200; c++) { const q = HN.questionFor(c); if (q.opts.length !== 4 || q.opts[q.right] !== HN.Q[q.id].o[0]) return false; } return true; }), 'shuffled answers keep the right one');
    // a burst of 30 more players writing at once
    await phones[2].evaluate(async () => { const ps = []; for (let i = 0; i < 30; i++) ps.push(HN.saveEntry('bot' + i, { n: 'Bot ' + i, a: '🤖', s: i * 10, c: 0, j: i, q: -1 })); await Promise.all(ps); });
    const all = await phones[2].evaluate(async () => Object.keys(await HN.allPlayers()).length);
    ok(all === 33, '30 simultaneous joins all saved (' + all + ' players, ' + conflicts + ' retried conflicts)');
    await scr.waitForTimeout(3500); await shot(scr, 'screen-busy');
  } catch (e) { fails.push(String(e)); console.log(e); }
  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close(); server.close();
  console.log(checks + ' checks, ' + fails.length + ' failed'); console.log('RESULT: ' + (fails.length ? 'FAIL' : 'PASS'));
  process.exit(fails.length ? 1 : 0);
})();
