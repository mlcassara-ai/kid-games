/* DR. QUARTZ'S LAB — unlocked with the 🔑 Lab Key (given at the end of a kid's 5th Science Cave trip).
   The lab is a building on the world map (next to the Quest Board). Inside:
   • Collection cabinet — minerals, fossils, critters, geodes found in the cave (read from p.cave)
   • Mystery Mineral of the Day — identify a sample with real tests; right = 🪙 15 + a 🔬 lab check on that mineral
   • Dig Map — how deep you've dug and the next Boss Medal gate
   • Rock Counter (one 🪨 a day for 🪙 150) and the elevator down to dig: the key gives ONE free ride a day; more rides cost one 🪨 each
   Saved per player in p.sci.key and p.sci.lab. Preview without a key: add ?labdemo to the URL (nothing is saved).
   Uses Math Quest globals: P(), save(), toast(), go(), SCREENS, NPCS, W, topbar, esc, modal, closeModal, dayKey, SFX, Quartz, CAVE_DATA. */
(function(){
'use strict';
const KEY_TRIPS=5,ROCK_PRICE=150,MM_COINS=15,LAB_X=25,LAB_Y=13;
const DEMO=/labdemo/.test(location.search);
const CD=()=>window.CAVE_DATA;
const Q=p=>{p.sci=p.sci||{};const s=p.sci;s.rocks=s.rocks||0;s.trips=s.trips||0;s.lab=s.lab||{};s.lab.ok=s.lab.ok||{};return s;};
const hasKey=p=>!!(p&&p.setup&&(DEMO||(p.sci&&p.sci.key)));
const first=p=>esc(String(p.name||'').split(' ')[0]);
const tier=p=>{const g=+p.grade||3;return g<=4?0:g<=8?1:2;};
const cv=p=>{const c=p.cave||{};return {idd:c.idd||{},found:c.found||{},fos:c.fos||{},ex:c.ex||{},crit:c.crit||{},geo:c.geo||{},seen:c.seen||{},maxRow:c.maxRow||0,gear:c.gear||{}};};
function seeded(n){let x=(n>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%100000)/100000;};}
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
let TAB='min',MM=null,FB='';

/* ---------- the key: called by Dr. Quartz at the end of a cave trip ---------- */
function keyDue(p){const s=Q(p);return !s.key&&s.trips>=KEY_TRIPS;}
function giveKey(p,done){css();try{const cur=P();if(cur&&p&&cur.id===p.id)p=cur;}catch(e){} /* always the live hero, never a copy held since before the trip */
 const s=Q(p);s.key=1;s.keyAt=Date.now();save();try{SFX.level();}catch(e){}
 /* 🚪 visitor queue: normally Dr. Quartz already holds the slot for his after-trip cards; otherwise the key card takes its own turn while open */
 try{const v=window.MQ_VISIT;if(v&&typeof v.claim==='function'&&v.who()!=='quartz'&&v.claim('lab',10*60e3))v.watch('lab',()=>!!document.querySelector('#modal.show .lb-key'));}catch(e){}
 const pages=[`${first(p)}, that was trip number <b>${s.trips}</b>! You're a real explorer now. 🧭`,
  `So I made you something… your very own <b>🔑 Lab Key</b>! My lab is in Number Village, right next to the Quest Board. Come by any time. The coffee is terrible, but the rocks are great.`,
  `In the lab you can look at everything you've found, test a <b>Mystery Mineral</b> every day, and see the <b>Dig Map</b>. When you have a 🪨 mystery rock, you can ride my elevator straight down to dig!`];
 let i=0;const show=()=>{const last=i>=pages.length-1;
  modal(`<div class="mcard qz-card"><div class="lb-key">🔑</div><div class="qz-row"><div class="qz-av">${window.QUARTZ_SVG||''}</div><div class="qz-bub"><b>🔬 Dr. Quartz</b><div>${pages[i]}</div></div></div>
   <div class="row"><button class="btn ${last?'gold':'green'} big" id="lbKeyNext">${last?'Thanks! 🔑':'Next ➜'}</button></div></div>`);
  document.getElementById('lbKeyNext').onclick=()=>{if(!last){i++;show();return;}closeModal();window.visitorQuiet=Date.now()+90e3;done&&done();};};
 show();}

/* ---------- the building on the map (only for kids with a key) ---------- */
function syncTile(){try{if(typeof W==='undefined'||!W||!W.T)return;const t=W.T[LAB_Y]&&W.T[LAB_Y][LAB_X];if(!t)return;const p=P();const on=hasKey(p);
 if(on){if(t.npc!=='lab'){if(W.hx===LAB_X&&W.hy===LAB_Y)return;t.npc='lab';t.block=true;}}
 else if(t.npc==='lab'){delete t.npc;t.block=false;}}catch(e){}}

/* ---------- lab greeting ---------- */
function greet(p){const s=Q(p),L=s.lab,m=typeof Quartz!=='undefined'?Quartz.medals(p):0;
 const firstVisit=!L.visits;const who=first(p);
 const hi=firstVisit?`Your key works! Welcome to my lab, ${who}. Make yourself at home. 🔬`
  :[`I heard the door. You let yourself in with your key! Welcome back, ${who}.`,`Welcome back, ${who}! I see your key still works. 🔑`,`Oh, ${who}! Come in, come in. Mind the rock pile.`,`There's my favorite explorer! You let yourself in. Good.`,`Welcome back to the lab, ${who}. I was just labeling rocks.`,`Ah, ${who}! I left the door unlocked for you. Well, you have a key anyway.`][(L.visits||0)%6];
 const tips=[];
 if(s.rocks>0)tips.push(`You have <b>🪨 ${s.rocks} mystery rock${s.rocks>1?'s':''}</b>, so the elevator is ready when you are!`);
 const mm=mmState(p);if(mm&&!mm.done)tips.push(`Today's <b>Mystery Mineral</b> is waiting on the bench.`);
 const ng=nextGate(p,m);if(ng)tips.push(`You're <b>${ng.need-m} 🏅 Boss Medal${ng.need-m>1?'s':''}</b> away from the gate to <b>${esc(ng.L.n)}</b>.`);
 return hi+(tips.length?' '+tips[(L.visits||0)%tips.length]:'');}
function nextGate(p,m){const D=CD();if(!D||typeof Quartz==='undefined')return null;const need=Object.values(Quartz.GATE_NEED);const i=need.findIndex(v=>v>m);if(i<0)return null;return {need:need[i],L:D.LAYERS[i+1]};}

/* ---------- Mystery Mineral of the Day ---------- */
const STREAK={'#ffffff':'white','#2f3a2a':'greenish-black','#2f4f2a':'greenish-black','#8fe3a9':'light green','#8ec5ff':'light blue','#1b1b1b':'black','#8b2a1e':'red-brown','#e8b923':'golden yellow','#5a5f66':'lead grey','#7d848c':'lead grey','#fff59a':'pale yellow'};
const HB=['very soft','soft','medium','hard','super hard'];
const hardBand=h=>{const T=CD().TOOLS;const i=T.findIndex(t=>h<=t.h);return i<0?4:i;};
/* same order as the cave's Field Lab bench: look → streak → scratch → the special tests (any order, every test always offered) */
const TESTS=[{id:'look',e:'🔍',n:'Look closely'},{id:'streak',e:'⬜',n:'Streak'},{id:'hard',e:'💅',n:'Scratch'},{id:'break',e:'🔨',n:'Hammer tap'},{id:'magnet',e:'🧲',n:'Magnet'},{id:'acid',e:'🧪',n:'Vinegar'},{id:'water',e:'💧',n:'Water'},{id:'uv',e:'🔦',n:'UV lamp'}];
const UV_NAMES={'#ff5a3d':'orange-red','#5cc8ff':'bright blue','#39ff6a':'bright green','#ff2a2a':'red','#7fb6ff':'pale blue'};
function tval(m,t){return t==='hard'?hardBand(m.h):t==='streak'?(m.s||'none'):t==='acid'?!!m.f:t==='magnet'?!!m.m:t==='water'?!!m.w:t==='uv'?(m.u||''):t==='break'?(m.br||'chips'):t==='look'?m.look:'';}
const sw=c=>`<i class="lb-sw" style="background:${c}"></i>`;
/* a plain grey "mystery rock" so the picture never gives the answer away (the real color shows once it's solved) */
function rockSVG(k,size){const R=seeded(hash('rock|'+k));const n=9,pts=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=14+R()*6;pts.push([22+Math.cos(a)*r,23+Math.sin(a)*r*.82]);}
 const d='M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L')+'Z';
 return `<svg class="lb-rock" width="${size}" height="${size}" viewBox="0 0 44 44" aria-label="mystery rock"><path d="${d}" fill="#8a8f98" stroke="#495057" stroke-width="1.6" stroke-linejoin="round"/>${[0,1,2,3].map(()=>`<circle cx="${(12+R()*20).toFixed(1)}" cy="${(14+R()*16).toFixed(1)}" r="${(1+R()*1.4).toFixed(1)}" fill="#fff" opacity=".35"/>`).join('')}<path d="M14 16 q4 -4 10 -3" stroke="#fff" stroke-width="2" opacity=".45" fill="none" stroke-linecap="round"/><text x="22" y="28" font-size="13" font-weight="800" text-anchor="middle" fill="#fff" opacity=".85">?</text></svg>`;}
function result(m,t,p){const n=tier(p);
 if(t==='hard'){const b=hardBand(m.h);const T=CD().TOOLS;return b===0?`Your ${T[0].e} fingernail scratches it. It's <b>very soft</b>.`:b===4?`Nothing scratches it, not even the 🔺 quartz point! It's <b>super hard</b>.`:`The ${T[b].e} ${T[b].n.toLowerCase()} scratches it, but the ${T[b-1].e} ${T[b-1].n.toLowerCase()} doesn't. It's <b>${HB[b]}</b>${n?` (about ${m.h})`:''}.`;}
 if(t==='streak')return m.s?`On the white tile it leaves a ${sw(m.s)} <b>${STREAK[m.s]||'colored'}</b> streak.`:`<b>No streak.</b> It's so hard it scratched the tile instead!`;
 if(t==='acid')return m.f?`<b>Fizz!</b> 🫧 Bubbles of carbon dioxide.`:`A drop of vinegar… <b>nothing happens.</b>`;
 if(t==='magnet')return m.m?`<b>SNAP!</b> 🧲 It sticks to the magnet.`:`The magnet <b>doesn't pull</b> on it.`;
 if(t==='water')return m.w?`<b>It dissolved!</b> 💧`:`In water it <b>stays the same.</b>`;
 if(t==='uv')return m.u?`Under UV light it <b>glows</b> ${sw(m.u)} <b>${UV_NAMES[m.u]||'brightly'}</b>!`:`Under UV light: <b>no glow.</b>`;
 if(t==='break'){const b=(CD().BREAKS||[]).find(x=>x.id===m.br);return b?`Tapped with the hammer, it <b>${b.r}</b>.`:'';}
 if(t==='look')return `Up close it looks: <b>${esc(m.look)}</b>.`;return '';}
/* today's sample: a mineral the kid has already identified, plus suspects a real test can tell apart */
function mmState(p){const D=CD();if(!D)return null;const s=Q(p),L=s.lab,day=dayKey();const known=Object.keys(cv(p).idd).filter(id=>D.MIN[id]);
 if(known.length<3)return null;
 if(L.mm&&L.mm.d===day&&D.MIN[L.mm.id])return L.mm;
 const R=seeded(hash(p.id+'|'+day));const prev=L.mm&&L.mm.id;const pool=known.length>3?known.filter(id=>id!==prev):known;const id=pool[Math.floor(R()*pool.length)];
 const uv=!!cv(p).gear.uv;const sig=k=>['hard','streak','break','acid','magnet','water'].concat(uv?['uv']:[]).map(t=>JSON.stringify(tval(D.MIN[k],t))).join('|');
 const others=known.filter(k=>k!==id&&sig(k)!==sig(id));const n=Math.min([3,4,4][tier(p)]-1,others.length);const sus=[];while(sus.length<n){const k=others[Math.floor(R()*others.length)];if(!sus.includes(k))sus.push(k);}
 const opts=sus.concat([id]).sort((a,b)=>hash(a+day)-hash(b+day));
 if(DEMO)return {d:day,id,opts,tests:[],tries:0,done:false};
 L.mm={d:day,id,opts,tests:[],tries:0,done:false};save();return L.mm;}
function mmHTML(p){const D=CD(),mm=MM||mmState(p);if(!mm)return `<p class="muted">Identify <b>3 minerals</b> in the Science Cave and Dr. Quartz will start leaving you a sample here every day.</p>`;MM=mm;
 const m=D.MIN[mm.id],uv=!!cv(p).gear.uv;
 const gem=mm.done?`<div class="lb-sample" style="--gc:${m.col}"><i></i></div>`:`<div class="lb-sample lb-unk">${rockSVG(mm.d+mm.id,76)}</div>`;
 if(mm.done)return `<div class="lb-mm">${gem}<div><b>${mm.ok?'✅ Solved!':'Today\'s sample'}: ${esc(m.n)}</b><p class="muted" style="margin:4px 0 0">${esc(tier(p)?m.o:m.y)}</p><p style="margin:6px 0 0">${mm.ok?`🪙 +${MM_COINS} and a 🔬 lab check on your ${esc(m.n)} card.`:'Nice try! A new sample comes tomorrow.'}</p>${FB&&!mm.ok?`<div class="lb-fb" id="lbFb" role="status">${FB}</div>`:''}</div></div>`;
 const tests=TESTS.filter(t=>t.id!=='uv'||uv);const nxt=(tests.find(t=>!mm.tests.includes(t.id))||{}).id;
 const done=TESTS.filter(t=>mm.tests.includes(t.id)); /* clues always listed in the scientist's order */
 return `<div class="lb-mm">${gem}<div style="min-width:0"><p style="margin:0 0 6px">Run every test to collect the clues, then pick which mineral it is.${mm.tries?` <b>One more try!</b>`:''}</p>
  <p class="muted lb-order">Scientists go: 🔍 look → ⬜ streak → 💅 scratch → 🔨 hammer → 🧲 🧪 💧${uv?' 🔦':''} special tests. Any order is fine, but do them all!</p>
  <div class="lb-tests">${tests.map(t=>{const did=mm.tests.includes(t.id);return `<button class="btn small ${did?'ghost dark':''}${t.id===nxt?' lb-nxt':''}" ${did?'disabled aria-pressed="true"':''} onclick="Lab.test('${t.id}')">${did?'✓ ':''}${t.e} ${t.n}${t.id===nxt?' <em>next step</em>':''}</button>`;}).join('')}</div>
  ${done.length?`<ul class="lb-clues">${done.map(t=>`<li>${result(m,t.id,p)}</li>`).join('')}</ul>`:''}
  <p class="lb-pick"><b>Which mineral is it?</b></p>
  <div class="lb-opts">${mm.opts.map(k=>`<button class="btn gold small" ${tests.every(t=>mm.tests.includes(t.id))?'':'disabled'} onclick="Lab.guess('${k}')">${esc(D.MIN[k].n)}</button>`).join('')}</div>
  ${FB?`<div class="lb-fb" id="lbFb" role="status">${FB}</div>`:''}
  ${tests.every(t=>mm.tests.includes(t.id))?'':`<p class="muted" style="margin:6px 0 0;font-size:14px">Run all the tests first: ${tests.filter(t=>!mm.tests.includes(t.id)).length} to go.</p>`}</div></div>`;}
function test(t){const p=P();const mm=MM||mmState(p);if(!mm||mm.done)return;FB='';if(!mm.tests.includes(t)){mm.tests.push(t);if(!DEMO)save();}try{SFX.tap();}catch(e){}draw();}
/* phones: keep the answer feedback on screen (it sits right under the answer buttons) */
function showFb(){const e=document.getElementById('lbFb');if(!e)return;try{const r=e.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight-10)e.scrollIntoView({block:'center'});}catch(x){}}
function guess(k){const p=P(),s=Q(p);const mm=MM||mmState(p);if(!mm||mm.done||!TESTS.filter(t=>t.id!=='uv'||cv(p).gear.uv).every(t=>mm.tests.includes(t.id)))return;const D=CD();
 if(k===mm.id){mm.done=true;mm.ok=true;try{SFX.win();}catch(e){}
  if(!DEMO){p.coins=(p.coins||0)+MM_COINS;s.lab.ok[k]=(s.lab.ok[k]||0)+1;s.lab.solved=(s.lab.solved||0)+1;save();}
  FB=`✅ Yes! It's <b>${esc(D.MIN[k].n)}</b>! 🪙 +${MM_COINS}`;toast(`🔬 Yes! It's ${D.MIN[k].n}! 🪙 +${MM_COINS}${DEMO?' (preview)':''}`);}
 else{mm.tries=(mm.tries||0)+1;try{SFX.wrong();}catch(e){}
  if(mm.tries>=2){mm.done=true;mm.ok=false;FB=`It was <b>${esc(D.MIN[mm.id].n)}</b>. Look at the clues again!`;toast(`🔬 It was ${D.MIN[mm.id].n}. Look at the clues again!`);}else{FB=`🤔 It's <b>not ${esc(D.MIN[k].n)}</b>. Check your clues (or run another test) and try once more!`;toast(`🔬 Not ${D.MIN[k].n}. Check your clues and try once more!`);}
  if(!DEMO)save();}
 draw();showFb();}

/* ---------- Collection cabinet ---------- */
function gem(m,big){return `<span class="lb-gem${big?' big':''}" style="--gc:${m.col}"></span>`;}
function colHTML(p){const D=CD();if(!D)return '';const c=cv(p),ok=Q(p).lab.ok;
 const tabs=[['min','💎 Minerals',Object.keys(c.idd).length,Object.keys(D.MIN).length],['fos','🦴 Fossils',D.FOSSILS.filter(f=>(c.fos[f.id]||[]).some(Boolean)).length,D.FOSSILS.length],['cri','🐾 Critters',Object.keys(c.crit).length,D.CRITTERS.length],['geo','🔮 Geodes',Object.keys(c.geo).length,D.GEODES.length]];
 const stars=id=>[5,15,40].filter(n=>(c.found[id]||0)>=n).length;
 let body='';
 if(TAB==='min')body=Object.keys(D.MIN).map(id=>{const m=D.MIN[id];return c.idd[id]?`<button class="lb-cell" onclick="Lab.card('min','${id}')">${gem(m)}<b>${esc(m.n)}</b><small>${'★'.repeat(stars(id))}${'☆'.repeat(3-stars(id))}${ok[id]?' 🔬':''}</small></button>`:`<div class="lb-cell un"><span class="lb-q">?</span><b>???</b><small>${esc(D.RAR[m.r].n)}</small></div>`;}).join('');
 if(TAB==='fos')body=D.FOSSILS.map(f=>{const n=(c.fos[f.id]||[]).filter(Boolean).length;return n?`<button class="lb-cell" onclick="Lab.card('fos','${f.id}')"><span class="lb-e">${(D.FART&&D.FART[f.id])||f.e}</span><b>${esc(f.n)}</b><small>${n}/${f.parts.length} pieces${c.ex[f.id]?' · 🏛️':''}</small></button>`:`<div class="lb-cell un"><span class="lb-q">?</span><b>???</b><small>0/${f.parts.length} pieces</small></div>`;}).join('');
 if(TAB==='cri')body=D.CRITTERS.map(k=>c.crit[k.id]?`<button class="lb-cell" onclick="Lab.card('cri','${k.id}')"><span class="lb-e">${k.e}</span><b>${esc(k.n)}</b><small>${esc((D.LAYERS.find(L=>L.id===k.L)||{}).n||'')}</small></button>`:`<div class="lb-cell un"><span class="lb-q">?</span><b>???</b><small>${c.seen[k.L]?esc((D.LAYERS.find(L=>L.id===k.L)||{}).n||''):'deeper…'}</small></div>`).join('');
 if(TAB==='geo')body=D.GEODES.map(g=>c.geo[g.id]?`<button class="lb-cell" onclick="Lab.card('geo','${g.id}')"><span class="lb-gem big" style="--gc:${g.col}"></span><b>${esc(g.n)}</b><small>×${c.geo[g.id]}</small></button>`:`<div class="lb-cell un"><span class="lb-q">?</span><b>???</b><small>a daily secret pocket</small></div>`).join('');
 return `<div class="lb-tabs">${tabs.map(([k,n,a,b])=>`<button class="lb-tab${TAB===k?' on':''}" onclick="Lab.tab('${k}')">${n} <small>${a}/${b}</small></button>`).join('')}</div><div class="lb-grid">${body}</div>`;}
function card(kind,id){const p=P(),D=CD(),t=tier(p);let h='';
 if(kind==='min'){const m=D.MIN[id];h=`${gem(m,1)}<h2>${esc(m.n)}</h2><p><b>Looks:</b> ${esc(m.look)}</p><p>${esc(t?m.o:m.y)}</p>${Q(p).lab.ok[id]?`<p>🔬 You identified this one in the lab ${Q(p).lab.ok[id]} time${Q(p).lab.ok[id]>1?'s':''}.</p>`:''}`;}
 if(kind==='fos'){const f=D.FOSSILS.find(x=>x.id===id);h=`<div class="big-emoji">${(D.FART&&D.FART[f.id])||f.e}</div><h2>${esc(f.n)}</h2><p class="muted">${esc(f.age||'')}</p><p>${esc(t?f.o:f.y)}</p>`;}
 if(kind==='cri'){const k=D.CRITTERS.find(x=>x.id===id);h=`<div class="big-emoji">${k.e}</div><h2>${esc(k.n)}</h2><p>${esc(t&&k.o?k.o:k.y)}</p>`;}
 if(kind==='geo'){const g=D.GEODES.find(x=>x.id===id);h=`<span class="lb-gem big" style="--gc:${g.col}"></span><h2>${esc(g.n)}</h2><p>${esc(g.y)}</p>`;}
 try{SFX.tap();}catch(e){}modal(`<div class="mcard lb-card">${h}<div class="row"><button class="btn green" onclick="closeModal()">Close</button></div></div>`);}

/* ---------- Dig Map ---------- */
function mapHTML(p){const D=CD();if(!D)return '';const c=cv(p),m=typeof Quartz!=='undefined'?Quartz.medals(p):0,need=typeof Quartz!=='undefined'?Object.values(Quartz.GATE_NEED):[];
 const here=[...D.LAYERS].reverse().find(L=>c.maxRow>=L.r0);const COL=['#7a5c3a','#b08968','#8d99a6','#3e7cb1','#6f42c1','#6c757d','#c92a2a','#e8590c'];
 return `<div class="lb-strata">${D.LAYERS.map((L,i)=>{const open=i===0||m>=(need[i-1]||0);const been=c.maxRow>=L.r0;
  return `<div class="lb-layer${been?'':' dim'}" style="--lc:${COL[i]||'#555'}"><span>${esc(L.n)}</span>${here&&here.id===L.id?'<em>📍 You</em>':''}${open?(been?'<small>explored</small>':'<small>open</small>'):`<small>🔒 ${need[i-1]} 🏅 <i>(${m} now)</i></small>`}</div>`;}).join('')}</div>
  <p class="muted" style="margin:8px 0 0">🏅 You have <b>${m}</b> Boss Medal${m===1?'':'s'}. Beat new boss rounds in Math Quest to open deeper gates.</p>`;}

/* ---------- Rock Counter + elevator ---------- */
/* the Lab Key's daily perk: one elevator ride a day without a rock. More rides on the same day need a mystery rock. */
const freeRide=s=>s.lab.freeDay!==dayKey();
function rockHTML(p){const s=Q(p),today=dayKey(),bought=s.lab.rockDay===today,full=s.rocks>=3,free=freeRide(s);
 return `<div class="lb-rocks"><div class="lb-rock-n">🪨 <b>${s.rocks}</b><small>/ 3 rocks</small></div>
  <div class="lb-rock-act">${free?`
   <p style="margin:0 0 6px;font-weight:700;font-size:18px">🔑 Your key gives you one free ride today!</p>
   <button class="btn green big" onclick="Lab.down()">🛗 Ride the elevator down</button>
   <small class="muted">No rock needed for this ride. Bring a 🪨 mystery rock if you want Dr. Quartz to help you identify it.</small>${s.rocks>0?`<div style="margin-top:8px"><button class="btn ghost dark small" onclick="Lab.down(1)">Ride down with a 🪨 rock instead</button></div>`:''}`
   :s.rocks>0?`
   <p style="margin:0 0 6px" class="muted">You used today's free ride. This ride uses a rock.</p>
   <button class="btn green big" onclick="Lab.down()">🛗 Ride the elevator down</button>
   <small class="muted">Uses 1 mystery rock. Same cave, same tunnels.</small>
   <div id="lbBuy">${bought?`<button class="btn ghost dark small" disabled>✔ Bought today's rock</button>`:full?`<button class="btn ghost dark small" disabled>Your rock bag is full</button>`:`<button class="btn gold small" onclick="Lab.buy()">Buy 1 rock · 🪙 ${ROCK_PRICE}</button><small class="muted">One a day. You have 🪙 ${p.coins||0}.</small>`}</div>`
   :`<p style="margin:0 0 6px;font-weight:700;font-size:18px">You used today's free ride. Another ride needs a new 🪨 mystery rock, and you have none.</p>${(()=>{const n=((p.cave&&p.cave.pack)||[]).filter(x=>x&&x.t==='m').length;return n?`<p class="muted" style="margin:0 0 8px">The ${n} rock${n>1?'s':''} in your cave backpack ${n>1?'were':'was'} already used for a trip. ${n>1?'They are':'It is'} waiting in the cave's Field Lab to be identified.</p>`:'';})()}
   ${bought?`<p style="margin:0 0 8px">You already bought today's rock. Find another by <b>winning battles</b>, <b>opening chests</b> or <b>beating bosses</b>, or buy one tomorrow.</p>`
    :`<div id="lbBuy"><p style="margin:0 0 6px"><b>Step 1:</b> get a rock.</p><button class="btn gold big" onclick="Lab.buy()">🪨 Buy a rock · 🪙 ${ROCK_PRICE}</button><small class="muted">One a day. You have 🪙 ${p.coins||0}. You can also find rocks in battles, chests and boss fights.</small></div>`}
   <p style="margin:10px 0 6px"><b>${bought?'Then':'Step 2:'}</b> ride down to the dig site.</p>
   <button class="btn green big" disabled>🛗 Ride the elevator down</button>`}
  </div></div>`;}
function buy(confirmNow){const p=P(),s=Q(p);if(s.lab.rockDay===dayKey()||s.rocks>=3)return;
 if((p.coins||0)<ROCK_PRICE){toast(`🪙 You need ${ROCK_PRICE-(p.coins||0)} more coins.`);return;}
 const box=document.getElementById('lbBuy');
 if(!confirmNow&&box){box.innerHTML=`<span style="font-weight:600;display:block;margin-bottom:6px">Spend 🪙 ${ROCK_PRICE} on a mystery rock?</span><button class="btn gold small" onclick="Lab.buy(1)">Yes, buy it</button><button class="btn ghost dark small" onclick="Lab.draw()">No</button>`;return;}
 if(DEMO){toast('🔬 Preview: nothing was bought.');draw();return;}
 p.coins-=ROCK_PRICE;s.rocks++;s.lab.rockDay=dayKey();s.lab.bought=(s.lab.bought||0)+1;save();try{SFX.coin();}catch(e){}toast('🪨 +1 Mystery Rock!');draw();}
function down(useRock){const p=P(),s=Q(p);if(DEMO){toast('🔬 Preview: the elevator is closed.');return;}
 const free=freeRide(s)&&!useRock;if(!free&&s.rocks<=0)return;
 try{SFX.tap();}catch(e){}
 if(free){s.lab.freeDay=dayKey();save();}
 Quartz.startTrip(false,free);}

/* ---------- the screen ---------- */
function draw(){css();const p=P();if(!p||!hasKey(p)){go('world');return;}const s=Q(p);
 const app=document.getElementById('app');
 app.innerHTML=topbar()+`<div class="page lb-page">
  <div class="zhead"><button class="btn ghost small" onclick="go('world')">← World</button><h2 class="title" style="margin:0">🔬 Dr. Quartz's Lab</h2></div>
  ${DEMO&&!(p.sci&&p.sci.key)?'<div class="panel" style="background:#fff3bf"><b>Preview.</b> You don\'t have the key yet, so nothing here is saved.</div>':''}
  <div class="panel"><div class="qz-row"><div class="qz-av">${window.QUARTZ_SVG||''}</div><div class="qz-bub"><b>🔬 Dr. Quartz</b><div id="lbHi">${GREET}</div></div></div></div>
  <div class="lb-cols">
   <div class="panel lb-st"><h3>🧪 Mystery Mineral of the Day</h3>${mmHTML(p)}</div>
   <div class="panel lb-st"><h3>🛗 Rock Counter &amp; Elevator</h3>${rockHTML(p)}</div>
  </div>
  <div class="panel lb-st"><h3>🗄️ Collection</h3>${colHTML(p)}</div>
  <div class="panel lb-st"><h3>🗺️ Dig Map</h3>${mapHTML(p)}</div>
 </div>`;}
let GREET='';
function open(){const p=P();if(!p||!hasKey(p)){go('world');return;}const s=Q(p);MM=null;FB='';GREET=greet(p);if(!DEMO){s.lab.visits=(s.lab.visits||0)+1;s.lab.last=dayKey();save();}
 try{if(typeof W!=='undefined'&&W)p.wpos={x:W.hx,y:W.hy};}catch(e){}draw();}

/* ---------- styles ---------- */
let CSS=false;function css(){if(CSS)return;CSS=true;const st=document.createElement('style');st.textContent=`
.lb-page{max-width:980px}.lb-page h3{margin:0 0 10px;font-size:20px;color:var(--ink)}
.lb-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0 16px}
.lb-st{color:var(--ink)}
.lb-mm{display:flex;gap:14px;align-items:flex-start}
.lb-sample{flex:0 0 76px;height:76px;border-radius:40% 55% 45% 50%;background:radial-gradient(circle at 32% 30%,#fff9 0 10%,transparent 26%),var(--gc);box-shadow:inset -8px -10px 0 #0003,0 6px 0 #0002;border:3px solid #0002}
.lb-tests,.lb-opts{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.lb-page .btn[disabled]{opacity:.45;cursor:default;transform:none}
.lb-clues{margin:6px 0;padding-left:18px;line-height:1.5}
.lb-order{margin:0 0 4px;font-size:13px}.lb-pick{margin:8px 0 0}
.lb-tests .btn em{font-style:normal;font-size:11px;background:#ffe066;color:#23364a;border-radius:8px;padding:1px 6px;margin-left:4px}
.lb-tests .lb-nxt{box-shadow:0 0 0 3px #ffe066}
.lb-fb{background:#fff9db;border:2px solid #fcc419;border-radius:12px;padding:8px 10px;margin:8px 0 0;line-height:1.35}
.lb-sample.lb-unk{background:none;box-shadow:none;border:0;border-radius:0;display:grid;place-items:center}.lb-sample.lb-unk i{display:none}
.lb-sw{display:inline-block;width:14px;height:14px;border-radius:4px;border:1px solid #0003;vertical-align:-2px}
.lb-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.lb-tab{border:0;border-radius:12px;padding:8px 12px;font:inherit;font-weight:600;background:#eee9ff;color:var(--ink);cursor:pointer}
.lb-tab.on{background:var(--accent);color:#fff}.lb-tab small{opacity:.75}
.lb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.lb-cell{display:flex;flex-direction:column;align-items:center;gap:3px;background:#f6f3ff;border:0;border-radius:14px;padding:10px 6px;font:inherit;color:var(--ink);cursor:pointer;min-width:0;text-align:center}
.lb-cell b{font-size:14px;line-height:1.2}.lb-cell small{font-size:12px;color:var(--muted)}
.lb-cell.un{background:#eef0f3;cursor:default;opacity:.8}
.lb-q{width:40px;height:40px;border-radius:50%;background:#dde1e6;display:grid;place-items:center;font-weight:700;color:#8a93a0;font-size:20px}
.lb-e{font-size:34px;line-height:40px}
.lb-gem{width:40px;height:40px;border-radius:40% 55% 45% 50%;background:radial-gradient(circle at 32% 30%,#fff9 0 10%,transparent 28%),var(--gc);box-shadow:inset -5px -6px 0 #0003;border:2px solid #0002;display:inline-block}
.lb-gem.big{width:84px;height:84px;display:block;margin:0 auto 6px}
.lb-card{text-align:center}.lb-card p{text-align:left}
.lb-strata{display:grid;gap:3px;border-radius:14px;overflow:hidden}
.lb-layer{display:flex;align-items:center;gap:10px;background:var(--lc);color:#fff;padding:8px 12px;font-weight:600;flex-wrap:wrap}
.lb-layer span{flex:1;min-width:120px}.lb-layer small{font-weight:600;opacity:.95}.lb-layer i{font-style:normal;opacity:.8}
.lb-layer em{font-style:normal;background:#ffe066;color:#23364a;border-radius:10px;padding:2px 8px;font-size:13px}
.lb-layer.dim{filter:saturate(.35) brightness(.8)}
.lb-rocks{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}
.lb-rock-n{font-size:34px;display:flex;flex-direction:column;align-items:center;min-width:80px}.lb-rock-n small{font-size:13px;color:var(--muted)}
.lb-rock-act{display:flex;flex-direction:column;gap:8px;flex:1;min-width:200px}.lb-rock-act small{display:block}
#lbBuy{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.lb-key{font-size:64px;text-align:center;animation:lbKey 1.2s ease-out}
@keyframes lbKey{0%{transform:scale(.2) rotate(-40deg);opacity:0}60%{transform:scale(1.2) rotate(8deg);opacity:1}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.lb-key{animation:none}}
@media(max-width:560px){.lb-mm{flex-direction:column}.lb-sample{flex-basis:auto;width:64px;height:64px}.lb-sample.lb-unk svg{width:64px;height:64px}}`;document.head.appendChild(st);}

/* ---------- wiring ---------- */
setInterval(syncTile,500);
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.lab=()=>open();}else setTimeout(reg,30);})();
/* a key that is due but was never saved (it could be lost to an online sync before Oct 2 2026) is handed over again on the map */
function keyCatchUp(){try{const p=P();if(!p||DEMO||!keyDue(p)||curScreen!=='world'||document.querySelector('#modal.show'))return;if(window.MQ_VISIT&&MQ_VISIT.busy('labkey'))return;giveKey(p,()=>{});}catch(e){}}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world'){setTimeout(syncTile,0);setTimeout(keyCatchUp,2500);}}});
window.Lab={open,draw:()=>draw(),tab:t=>{TAB=t;try{SFX.tap();}catch(e){}draw();},card,test,guess,buy,down,keyDue,giveKey,hasKey,KEY_TRIPS,ROCK_PRICE,_mm:mmState,_sync:syncTile};
})();
