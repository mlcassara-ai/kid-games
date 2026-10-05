/* Heritage Night: Discover Lebanon — shared engine for the big screen (screen.html) and the phones (index.html).
   No host and no server code. Every device works out the current fact/question from the clock alone:
   one "cycle" = fact card, then question, then answer reveal. Clocks are lined up with Firestore's server time.
   Scores: each phone writes its own entry into one of SHARDS small docs in the shared `families` collection
   (same {data,updated,v} shape and anonymous auth as the other kid games). The screen reads the shards. */
(function () {
'use strict';
var FB = { key: 'AIzaSyDisxs0uEXvWrlOp8VchKOz0abxPDKIWpI', project: 'kid-games-dc068' };
var BASE = 'https://firestore.googleapis.com/v1/projects/' + FB.project + '/databases/(default)/documents/families/';
var qs = new URLSearchParams(location.search);
var FAST = qs.get('fast') === '1';                       // testing: short phases
var EVENT = (qs.get('e') || 'oct2026').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'oct2026';
var SHARDS = 8;
var T = FAST ? { fact: 4000, q: 6000, reveal: 3000 } : { fact: 13000, q: 16000, reveal: 7000 };
T.cycle = T.fact + T.q + T.reveal;
var PLAY_URL = 'https://mlcassara-ai.github.io/kid-games/heritage-night/';

/* ---------- facts and questions (first option is the right one; options are shuffled per cycle) ---------- */
var Q = [
 { e: '🌲', f: "Lebanon's flag has two red stripes, a white stripe in the middle, and a green cedar tree right in the center.",
   q: 'What is in the middle of Lebanon’s flag?', o: ['A cedar tree', 'A star', 'A sun', 'An apple'] },
 { e: '🌲', f: 'Cedar trees grow high in Lebanon’s mountains. The oldest ones have been alive for more than 1,000 years!',
   q: 'How old are the oldest cedar trees in Lebanon?', o: ['More than 1,000 years', '10 years', '50 years', '100 years'] },
 { e: '🏙️', f: 'Beirut is the capital of Lebanon. It is a busy city right on the edge of the sea.',
   q: 'What is the capital city of Lebanon?', o: ['Beirut', 'Paris', 'Cairo', 'Rome'] },
 { e: '🌊', f: 'Lebanon sits on the coast of the Mediterranean Sea, the same sea that touches Greece, Italy and Spain.',
   q: 'Which sea is Lebanon next to?', o: ['The Mediterranean Sea', 'The Red Sea', 'The Black Sea', 'The Caribbean Sea'] },
 { e: '🗺️', f: 'Lebanon is a small country. The whole country is a little smaller than San Diego County!',
   q: 'Lebanon is about the same size as…', o: ['San Diego County', 'Texas', 'All of California', 'Canada'] },
 { e: '⛷️', f: 'In spring you can ski on snowy mountains in the morning and swim in the warm sea in the afternoon. They are that close!',
   q: 'What can you do in Lebanon on the same spring day?', o: ['Ski in snow and swim in the sea', 'Ride a camel to the moon', 'See penguins on the beach', 'Watch a volcano erupt'] },
 { e: '⛰️', f: 'Lebanon’s highest mountain peak is over 10,000 feet tall. It is covered in snow for much of the year.',
   q: 'How tall is Lebanon’s highest mountain?', o: ['Over 10,000 feet', '100 feet', '500 feet', '1 mile underground'] },
 { e: '🗣️', f: 'People in Lebanon speak Arabic. Many also speak French and English, sometimes all in one sentence!',
   q: 'What is the main language of Lebanon?', o: ['Arabic', 'Spanish', 'Japanese', 'German'] },
 { e: '👋', f: 'To say hello in Arabic, you say “Marhaba!” (mar-ha-ba).',
   q: 'How do you say “hello” in Arabic?', o: ['Marhaba', 'Shukran', 'Yalla', 'Bonjour'] },
 { e: '🙏', f: 'To say thank you in Arabic, you say “Shukran!” (shook-ran).',
   q: 'What does “Shukran” mean?', o: ['Thank you', 'Goodbye', 'Pizza', 'Good night'] },
 { e: '🏃', f: '“Yalla!” is a word you hear all the time in Lebanon. It means “Let’s go!” or “Hurry up!”',
   q: 'What does “Yalla!” mean?', o: ['Let’s go!', 'Be quiet', 'I’m hungry', 'Happy birthday'] },
 { e: '🏠', f: 'When guests arrive, Lebanese families say “Ahlan wa sahlan,” which means “Welcome!” and offer them food or coffee.',
   q: 'What does “Ahlan wa sahlan” mean?', o: ['Welcome!', 'Goodbye!', 'Watch out!', 'I’m sleepy'] },
 { e: '✍️', f: 'Arabic is written from right to left, the opposite way from English.',
   q: 'Which way is Arabic written?', o: ['Right to left', 'Left to right', 'Bottom to top', 'In a circle'] },
 { e: '⛵', f: 'Long ago, the Phoenicians lived on Lebanon’s coast. They were amazing sailors who traded all around the sea in wooden ships.',
   q: 'What were the Phoenicians famous for?', o: ['Sailing and trading', 'Building pyramids', 'Riding dinosaurs', 'Flying airplanes'] },
 { e: '🔤', f: 'The Phoenicians made one of the first alphabets. Over time it grew into the Greek alphabet and later the ABCs we use today!',
   q: 'Our ABCs come from an alphabet first made by the…', o: ['Phoenicians', 'Vikings', 'Pirates', 'Robots'] },
 { e: '🐌', f: 'The Phoenicians made a special purple dye from tiny sea snails. It was so rare that kings and queens wore it.',
   q: 'What did the Phoenicians use to make purple dye?', o: ['Sea snails', 'Grapes', 'Blueberries', 'Crayons'] },
 { e: '🏛️', f: 'Byblos is one of the oldest cities in the world. People have lived there for about 7,000 years!',
   q: 'What is special about the city of Byblos?', o: ['It is one of the oldest cities in the world', 'It is built on the moon', 'It is under the sea', 'It was built last year'] },
 { e: '🏛️', f: 'At Baalbek you can walk through giant ancient Roman temples. Some of the stones are as heavy as hundreds of elephants!',
   q: 'What can you see at Baalbek?', o: ['Giant ancient temples', 'A water park', 'A space station', 'A big zoo'] },
 { e: '🛶', f: 'Jeita Grotto is a huge cave with sparkling rock icicles. The lower cave has an underground river you ride through in a boat!',
   q: 'How do you visit the lower cave at Jeita Grotto?', o: ['By boat', 'By bicycle', 'By horse', 'By helicopter'] },
 { e: '🏰', f: 'In the city of Sidon there is a castle built on a tiny island in the sea, joined to land by a stone bridge.',
   q: 'Where is the Sidon Sea Castle?', o: ['On a tiny island in the sea', 'On top of a mountain', 'In the desert', 'Under the ground'] },
 { e: '🏞️', f: 'The Litani is the longest river in Lebanon. It starts and ends inside the country.',
   q: 'What is the longest river in Lebanon?', o: ['The Litani', 'The Nile', 'The Amazon', 'The Mississippi'] },
 { e: '🥣', f: 'Hummus is a creamy dip made from mashed chickpeas, sesame paste, lemon and garlic. Scoop it up with pita bread!',
   q: 'Hummus is made mostly from…', o: ['Chickpeas', 'Potatoes', 'Chocolate', 'Carrots'] },
 { e: '🥗', f: 'Tabbouleh is a fresh green salad made mostly of chopped parsley, with tomato, mint, lemon and a little cracked wheat.',
   q: 'What is the main green in tabbouleh?', o: ['Parsley', 'Lettuce', 'Spinach', 'Broccoli'] },
 { e: '🌿', f: 'Za’atar is a tasty mix of dried herbs, sesame seeds and tangy red sumac. It is spread on bread with olive oil.',
   q: 'What is za’atar?', o: ['A mix of herbs and sesame', 'A kind of fish', 'A dance', 'A board game'] },
 { e: '🍞', f: 'Man’oushe is a warm flatbread topped with za’atar or cheese. Many Lebanese kids eat it for breakfast!',
   q: 'What is man’oushe?', o: ['A flatbread', 'A soup', 'An ice cream', 'A drum'] },
 { e: '🧆', f: 'Falafel are crunchy fried balls made from chickpeas or fava beans, often wrapped in pita with veggies.',
   q: 'Falafel are shaped like…', o: ['Little balls', 'Long noodles', 'Flat pancakes', 'Stars'] },
 { e: '🍽️', f: 'Kibbeh is called the national dish of Lebanon. It is made from cracked wheat and meat, and can be baked, fried or even eaten raw.',
   q: 'Which food is called the national dish of Lebanon?', o: ['Kibbeh', 'Pizza', 'Sushi', 'Tacos'] },
 { e: '🍪', f: 'Ma’amoul are buttery cookies stuffed with dates, pistachios or walnuts. Families bake them together for holidays.',
   q: 'What is inside a ma’amoul cookie?', o: ['Dates or nuts', 'Ketchup', 'Popcorn', 'Ice cubes'] },
 { e: '🍯', f: 'Baklava is a sweet made from many paper-thin layers of pastry, chopped nuts and sweet syrup.',
   q: 'What is baklava made with?', o: ['Thin pastry, nuts and syrup', 'Rice and beans', 'Fish and chips', 'Cheese and pickles'] },
 { e: '☕', f: 'Lebanese coffee is strong and served in tiny cups. Many families add a spice called cardamom.',
   q: 'Which spice is often added to Lebanese coffee?', o: ['Cardamom', 'Hot pepper', 'Salt', 'Cinnamon gum'] },
 { e: '💃', f: 'The dabke is a joyful line dance. Dancers hold hands, step and stomp their feet together. It is a must at weddings!',
   q: 'What do people do in the dabke dance?', o: ['Hold hands in a line and stomp', 'Spin on their heads', 'Dance on ice', 'Jump on trampolines'] },
 { e: '🎶', f: 'The oud is a pear-shaped string instrument, like a cousin of the guitar, but with no frets on its neck.',
   q: 'What kind of instrument is the oud?', o: ['A string instrument', 'A drum', 'A trumpet', 'A piano'] },
 { e: '🥁', f: 'The darbuka is a drum shaped like a goblet. You play it with your hands, not sticks.',
   q: 'How do you play the darbuka drum?', o: ['With your hands', 'With your feet', 'With a bow', 'By blowing into it'] },
 { e: '🌎', f: 'Lebanese families live all over the world. Brazil has one of the biggest Lebanese communities anywhere, and so does the United States.',
   q: 'Which country has one of the biggest Lebanese communities?', o: ['Brazil', 'Antarctica', 'Iceland', 'Greenland'] },
 { e: '💰', f: 'The money in Lebanon is called the Lebanese pound. People also call it the lira.',
   q: 'What is the money in Lebanon called?', o: ['The Lebanese pound', 'The dollar', 'The yen', 'The peso'] },
 { e: '🤍', f: 'On the flag, white stands for peace, and the green cedar stands for strength and living a long time.',
   q: 'What does white stand for on Lebanon’s flag?', o: ['Peace', 'Snow days', 'Milk', 'Clouds'] }
];

/* ---------- seeded randomness so every device agrees ---------- */
function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffled(n, seed) { var r = rng(seed), a = []; for (var i = 0; i < n; i++) a.push(i); for (var j = n - 1; j > 0; j--) { var k = Math.floor(r() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; } return a; }
var permCache = {};
function questionFor(cycle) {
  var loop = Math.floor(cycle / Q.length), pos = ((cycle % Q.length) + Q.length) % Q.length;
  var p = permCache[loop] || (permCache[loop] = shuffled(Q.length, loop * 7919 + 17));
  var base = Q[p[pos]], order = shuffled(4, cycle * 31 + 5), opts = [], right = 0;
  order.forEach(function (oi, i) { opts.push(base.o[oi]); if (oi === 0) right = i; });
  return { id: p[pos], e: base.e, f: base.f, q: base.q, opts: opts, right: right };
}

/* ---------- clock (lined up with Firestore's server time) ---------- */
var offset = 0, synced = false;
function now() { return Date.now() + offset; }
function serverMs(ts) { var m = /^(.*\.\d{3})\d*Z$/.exec(ts); return Date.parse(m ? m[1] + 'Z' : ts); }
function noteServerTime(ts, t0, t1) { var s = serverMs(ts); if (!isNaN(s)) { offset = s - (t0 + t1) / 2; synced = true; } }
function phase(t) {
  t = t == null ? now() : t;
  var cycle = Math.floor(t / T.cycle), pos = t - cycle * T.cycle, name, left, len;
  if (pos < T.fact) { name = 'fact'; left = T.fact - pos; len = T.fact; }
  else if (pos < T.fact + T.q) { name = 'question'; left = T.fact + T.q - pos; len = T.q; }
  else { name = 'reveal'; left = T.cycle - pos; len = T.reveal; }
  return { cycle: cycle, name: name, left: left, len: len, qStart: cycle * T.cycle + T.fact };
}
function points(ms) { return 500 + Math.round(500 * Math.max(0, 1 - ms / T.q)); }

/* ---------- rounds, streaks, double points (all from the cycle number, so every device agrees) ---------- */
var ROUND = 10, STREAK_AT = 3, STREAK_BONUS = 100;
function roundOf(cycle) { return Math.floor(cycle / ROUND); }
function qInRound(cycle) { return ((cycle % ROUND) + ROUND) % ROUND + 1; }           // 1..10
function isDouble(cycle) { return rng(cycle * 7907 + 3)() < 1 / 8; }                  // about 1 in 8
/* points for a right answer: speed points, +100 once the streak (counting this answer) is 3+, all doubled on a double cycle */
function award(ms, streak, cycle) { return (points(ms) + (streak >= STREAK_AT ? STREAK_BONUS : 0)) * (isDouble(cycle) ? 2 : 1); }
/* top scorers of one round (rs only counts when r is that round) */
function roundTop(players, round) {
  return Object.keys(players).map(function (k) { var p = players[k]; return { id: k, n: p.n, a: p.a, g: p.g || '', rs: p.r === round ? p.rs || 0 : 0, j: p.j || 0 }; })
    .filter(function (p) { return p.rs > 0; }).sort(function (x, y) { return y.rs - x.rs || x.j - y.j; });
}
/* a streak shows only if the player answered the last question (or this one) */
function onFire(p, cycle) { return (p.st || 0) >= STREAK_AT && p.q >= cycle - 1; }

/* ---------- avatars, names and grades ---------- */
/* the player taps an avatar; the game makes the name (adjective + the avatar's noun), so nothing is ever typed */
var ADJ = ['Happy', 'Brave', 'Speedy', 'Sunny', 'Jolly', 'Clever', 'Lucky', 'Bouncy', 'Sparkly', 'Mighty', 'Cozy', 'Zippy', 'Giggly', 'Swift', 'Golden', 'Fluffy', 'Daring', 'Cheerful', 'Snappy', 'Super', 'Rocket', 'Twinkly', 'Wiggly', 'Dancing'];
var AVATARS = [['🌲', 'Cedar'], ['🍋', 'Lemon'], ['🦊', 'Fox'], ['🐢', 'Sea Turtle'], ['🐱', 'Cat'], ['🐐', 'Mountain Goat'], ['🦉', 'Owl'], ['🦔', 'Hedgehog'],
  ['🦋', 'Butterfly'], ['🐬', 'Dolphin'], ['🧆', 'Falafel'], ['🍪', 'Ma’amoul'], ['🥙', 'Pita'], ['🍇', 'Grape'], ['🥁', 'Drummer'], ['⛵', 'Sailboat']];
var GRADES = [['tk', 'TK'], ['k', 'K'], ['1', '1st'], ['2', '2nd'], ['3', '3rd'], ['4', '4th'], ['5', '5th'], ['a', 'Grown-up']];
function gradeLabel(g) { for (var i = 0; i < GRADES.length; i++) if (GRADES[i][0] === g) return GRADES[i][1]; return ''; }
function isGrown(p) { return p && p.g === 'a'; }   // anyone without a grade counts as a kid
function randInt(n) { return crypto.getRandomValues(new Uint32Array(1))[0] % n; }
function newName(taken, av) {
  var x = AVATARS[av == null ? randInt(AVATARS.length) : av];
  for (var i = 0; i < 40; i++) { var name = ADJ[randInt(ADJ.length)] + ' ' + x[1]; if (!taken || !taken[name]) return { n: name, a: x[0] }; }
  return { n: ADJ[randInt(ADJ.length)] + ' ' + x[1] + ' ' + (2 + randInt(98)), a: x[0] };
}

/* ---------- Kids vs Grown-ups tug-of-war ----------
   Each side's score is its average points per question answered, so the bigger side has no advantage.
   Kids' average counts KID_BONUS times. When fewer than BOT_FILL real grown-ups have joined, labelled robot helpers
   fill the grown-up side's head count. Robots only score when no real grown-up has answered yet, and then always a
   little behind the kids, so they can never win. Once a real grown-up answers, it is a real contest. */
var KID_BONUS = 1.25, BOT_FILL = 5;
function teams(players, cycle) {
  var k = { n: 0, pts: 0, ans: 0 }, g = { n: 0, pts: 0, ans: 0 };
  for (var id in players) { var p = players[id], t = isGrown(p) ? g : k; t.n++; t.pts += p.s || 0; t.ans += p.na || 0; }
  var kid = k.ans ? KID_BONUS * k.pts / k.ans : 0, bots = k.n ? Math.max(0, BOT_FILL - g.n) : 0, grown = 0;
  if (g.ans) grown = g.pts / g.ans;
  else if (bots && kid) grown = kid * (0.8 + 0.15 * rng((cycle || 0) * 131 + 7)());   // a close race the kids always lead
  var tot = kid + grown, kidShare = tot ? kid / tot : 0.5;
  return { kids: k.n, grown: g.n, bots: bots, kid: Math.round(kid), grownPts: Math.round(grown), kidShare: kidShare,
    lead: Math.abs(kidShare - 0.5) < 0.01 ? '' : kidShare > 0.5 ? 'kids' : 'grown' };
}

/* ---------- Firestore over REST (anonymous auth, like the other games) ---------- */
var AUTH_KEY = 'heritagenight.auth';
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
var tokP = null;
function token() {
  if (tokP) return tokP;
  tokP = (async function () {
    var a = lsGet(AUTH_KEY);
    if (a && a.id && a.exp > Date.now() + 120000) return a.id;
    if (a && a.refresh) {
      try {
        var r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + FB.key, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.refresh) });
        if (r.ok) { var j = await r.json(); a = { id: j.id_token, refresh: j.refresh_token, exp: Date.now() + (+j.expires_in) * 1000 }; lsSet(AUTH_KEY, a); return a.id; }
      } catch (e) { }
    }
    var r2 = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FB.key, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
    if (!r2.ok) throw new Error('auth ' + r2.status);
    var j2 = await r2.json(); a = { id: j2.idToken, refresh: j2.refreshToken, exp: Date.now() + (+j2.expiresIn) * 1000 }; lsSet(AUTH_KEY, a); return a.id;
  })();
  tokP.then(function () { setTimeout(function () { tokP = null; }, 5 * 60000); }, function () { tokP = null; });
  return tokP;
}
/* the Firestore rules only allow doc ids of 16+ characters, so the name is padded out with 'leaderboard' */
function docId(name) { return 'hn_' + EVENT + '_leaderboard_' + name; }
async function getDoc(name) {
  var t = await token();
  var r = await fetch(BASE + docId(name), { headers: { Authorization: 'Bearer ' + t }, cache: 'no-store' });
  if (r.status === 404) return { data: null, updateTime: null };
  if (!r.ok) throw new Error('get ' + r.status);
  var j = await r.json(), s = j.fields && j.fields.data && j.fields.data.stringValue;
  return { data: s ? JSON.parse(s) : null, updateTime: j.updateTime };
}
/* returns {ok, updateTime} or {conflict:true}; updateTime null => must not exist yet; 'any' => unconditional */
async function putDoc(name, data, updateTime) {
  var t = await token();
  var q = updateTime === 'any' ? '' : updateTime ? '?currentDocument.updateTime=' + encodeURIComponent(updateTime) : '?currentDocument.exists=false';
  var body = { fields: { data: { stringValue: JSON.stringify(data) }, updated: { integerValue: String(Date.now()) }, v: { integerValue: '1' } } };
  var t0 = Date.now();
  var r = await fetch(BASE + docId(name) + q, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  var t1 = Date.now();
  if (r.ok) { var j = await r.json(); noteServerTime(j.updateTime, t0, t1); return { ok: true, updateTime: j.updateTime }; }
  if (r.status === 400 || r.status === 409 || r.status === 404 || r.status === 412) return { conflict: true };
  throw new Error('put ' + r.status);
}
function shardOf(pid) { var h = 2166136261; for (var i = 0; i < pid.length; i++) { h ^= pid.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % SHARDS; }
/* all players, as {pid: entry} */
async function allPlayers() {
  var res = await Promise.all(Array.from({ length: SHARDS }, function (_, i) { return getDoc('s' + i).catch(function () { return null; }); }));
  var out = {}, ok = 0;
  res.forEach(function (d) { if (!d) return; ok++; var p = d.data && d.data.p; if (p) for (var k in p) out[k] = p[k]; });
  if (!ok) throw new Error('offline');
  return out;
}
/* write this player's entry into its shard, merging with whatever others wrote */
async function saveEntry(pid, entry) {
  var name = 's' + shardOf(pid);
  for (var i = 0; i < 8; i++) {
    var d = await getDoc(name), data = d.data || { p: {} };
    data.p = data.p || {}; data.p[pid] = entry;
    var r = await putDoc(name, data, d.updateTime);
    if (r.ok) return true;
    await new Promise(function (res) { setTimeout(res, 120 + Math.random() * 500 * (i + 1)); });
  }
  throw new Error('busy');
}
/* the screen keeps its clock honest by touching a tiny doc of its own */
async function syncClock() { try { await putDoc('clock', { at: Date.now() }, 'any'); } catch (e) { } }

function rank(players) {
  return Object.keys(players).map(function (k) { var p = players[k]; return { id: k, n: p.n, a: p.a, g: p.g || '', st: p.st || 0, q: p.q, s: p.s || 0, c: p.c || 0, j: p.j || 0 }; })
    .sort(function (x, y) { return y.s - x.s || y.c - x.c || x.j - y.j; });
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

window.HN = { Q: Q, T: T, EVENT: EVENT, FAST: FAST, PLAY_URL: PLAY_URL, questionFor: questionFor, phase: phase, now: now, points: points, ROUND: ROUND, STREAK_AT: STREAK_AT, roundOf: roundOf, qInRound: qInRound, isDouble: isDouble, award: award, roundTop: roundTop, onFire: onFire,
  isSynced: function () { return synced; }, newName: newName, AVATARS: AVATARS, GRADES: GRADES, gradeLabel: gradeLabel, isGrown: isGrown, teams: teams, allPlayers: allPlayers, saveEntry: saveEntry, syncClock: syncClock, rank: rank, esc: esc, lsGet: lsGet, lsSet: lsSet };
})();
