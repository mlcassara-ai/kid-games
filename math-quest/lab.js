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
const hasKey=p=>!!(p&&p.setup); /* Oct 2026: the Lab is open to everyone (train); no key */
const first=p=>esc(String(p.name||'').split(' ')[0]);
const tier=p=>{const g=+p.grade||3;return g<=4?0:g<=8?1:2;};
const cv=p=>{const c=p.cave||{};return {idd:c.idd||{},found:c.found||{},fos:c.fos||{},ex:c.ex||{},crit:c.crit||{},geo:c.geo||{},seen:c.seen||{},maxRow:c.maxRow||0,gear:c.gear||{}};};
function seeded(n){let x=(n>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%100000)/100000;};}
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
let TAB='min',MM=null,FB='';

/* ---------- the key: called by Dr. Quartz at the end of a cave trip ---------- */
function keyDue(p){return false;} /* Oct 2026: no more Lab Key; the elevator asks a science question instead */
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
 if(t.npc==='lab'){delete t.npc;t.block=false;}}catch(e){}} /* Oct 2026: the Lab is a shop on Main Street (town.js), not a plaza building */

/* ---------- lab greeting ---------- */
function greet(p){const s=Q(p),L=s.lab,m=typeof Quartz!=='undefined'?Quartz.medals(p):0;
 const firstVisit=!L.visits;const who=first(p);
 const hi=true?(firstVisit?`Welcome to my lab, ${who}! You came all the way by train. Have a look around. Everything here is for explorers like you. 🔬`:[`Welcome back, ${who}! How was the train ride?`,`Ah, ${who}! Come in, come in. Mind the rock pile.`,`There's my favorite explorer! Fresh off the train.`,`Welcome back to the lab, ${who}. I was just labeling rocks.`][(L.visits||0)%4])
  :firstVisit?`Your key works! Welcome to my lab, ${who}. Make yourself at home. 🔬`
  :[`I heard the door. You let yourself in with your key! Welcome back, ${who}.`,`Welcome back, ${who}! I see your key still works. 🔑`,`Oh, ${who}! Come in, come in. Mind the rock pile.`,`There's my favorite explorer! You let yourself in. Good.`,`Welcome back to the lab, ${who}. I was just labeling rocks.`,`Ah, ${who}! I left the door unlocked for you. Well, you have a key anyway.`][(L.visits||0)%6];
 const tips=[];
 if(canRide(p))tips.push(`Want to dig? Answer one science question at the <b>🛗 elevator</b> and down you go!`);
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
function guess(k,sure){const p=P(),s=Q(p);const mm=MM||mmState(p);if(!mm||mm.done||(!sure&&!TESTS.filter(t=>t.id!=='uv'||cv(p).gear.uv).every(t=>mm.tests.includes(t.id))))return;const D=CD();
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
/* ---------- the elevator (owner, Oct 2026): the first trip comes with a mystery rock when Dr. Quartz finds you on the map.
   After that, the elevator in the Lab takes you down whenever you answer one science question right. A wrong answer explains
   the right one and asks a different question. No key, no free-ride day, no rock needed for the elevator. ---------- */
const SCIQ=[
 {q:'What is a fossil?',a:['What is left of a living thing from long ago, turned to stone','A shiny kind of crystal','A rock that fell from space'],why:'Fossils are bones, shells, leaves or footprints from long ago that slowly turned to stone.',y:1},
 {q:'Which of these is a mineral?',a:['Quartz','Wood','Plastic'],why:'Quartz is a mineral. Minerals are natural and not alive; wood comes from trees and plastic is made in factories.',y:1},
 {q:'What sticks to a magnet?',a:['Iron','Wood','Glass'],why:'Magnets pull on iron. Wood and glass don\'t stick at all.',y:1},
 {q:'Which is the hardest mineral of all?',a:['Diamond','Talc','Chalk'],why:'Diamond is the hardest natural mineral. Talc is so soft you can scratch it with a fingernail.'},
 {q:'Is it light or dark deep inside a cave?',a:['Dark','Light','Rainbow colored'],why:'Sunlight can\'t reach deep inside a cave, so it is completely dark. That\'s why explorers bring lamps!',y:1},
 {q:'What do we call the pointy rocks that hang down from a cave\'s ceiling?',a:['Stalactites','Stalagmites','Volcanoes'],why:'Stalactites hang from the ceiling (they hold on "tight"). Stalagmites grow up from the ground.',y:1},
 {q:'How do stalactites grow?',a:['Drip by drip, very slowly','Overnight, all at once','Bats build them'],why:'Each drop of water leaves a tiny bit of rock behind. A stalactite grows only about as thick as a coin every 10 years!'},
 {q:'What is the Earth\'s outside layer called?',a:['The crust','The core','The cloud'],why:'We live on the crust, the thin rocky skin of the Earth.',y:1},
 {q:'What is the middle of the Earth called?',a:['The core','The crust','The equator'],why:'The core is the center of the Earth. It is mostly iron and nickel, and very, very hot.',y:1},
 {q:'What comes out of an erupting volcano?',a:['Lava','Snow','Sand only'],why:'Melted rock pours out as lava. When it cools it becomes new rock.',y:1},
 {q:'What is lava called while it is still underground?',a:['Magma','Fossil','Quartz'],why:'Melted rock is called magma underground and lava once it comes out.'},
 {q:'Which animals often sleep upside down in caves?',a:['Bats','Cows','Penguins'],why:'Bats hang upside down from cave ceilings to sleep during the day.',y:1},
 {q:'Which dinosaur had three horns on its face?',a:['Triceratops','T. rex','Brachiosaurus'],why:'"Tri" means three: Triceratops had two long horns and one short one on its nose.',y:1},
 {q:'Which dinosaur had a very long neck to reach treetops?',a:['Brachiosaurus','Stegosaurus','T. rex'],why:'Brachiosaurus was as tall as a 4-storey building and ate leaves from the tops of trees.',y:1},
 {q:'What did T. rex eat?',a:['Meat','Only leaves','Rocks'],why:'T. rex was a meat-eater with teeth as long as bananas.',y:1},
 {q:'What does a scientist use to look at tiny things up close?',a:['A microscope','A telescope','A stethoscope'],why:'A microscope makes tiny things look big. A telescope is for faraway things like stars.',y:1},
 {q:'What is a geode?',a:['A plain rock with crystals hidden inside','A dinosaur egg','A piece of the Moon'],why:'Geodes look like ordinary round rocks, but crack one open and it can be full of sparkly crystals.'},
 {q:'What is the "streak" of a mineral?',a:['The color of its powder','How shiny it is','How heavy it is'],why:'Rub a mineral on rough white tile and look at the line it leaves. Its streak color helps you tell minerals apart.'},
 {q:'Which mineral fizzes when you drip vinegar on it?',a:['Calcite','Quartz','Diamond'],why:'Calcite reacts with acid like vinegar and makes tiny bubbles of gas.'},
 {q:'What gives the Sun\'s energy to a solar panel?',a:['Sunlight','Wind','Rain'],why:'Solar panels turn sunlight into electricity. Batteries store it for later.',y:1},
 {q:'Where does a battery keep energy?',a:['Inside it, stored for later','In the wires only','It doesn\'t keep any'],why:'A battery stores energy so you can use it later, like using today\'s sunshine at night.',y:1},
 {q:'Which is a kind of rock made from cooled lava?',a:['Igneous rock','Sedimentary rock','Paper rock'],why:'Igneous rock forms when magma or lava cools and hardens. Granite and basalt are igneous.'},
 {q:'Which kind of rock forms from layers of sand and mud pressed together?',a:['Sedimentary rock','Igneous rock','Metal rock'],why:'Sedimentary rock builds up in layers over a very long time. Most fossils are found in it!'},
 {q:'Why are deeper rock layers usually older?',a:['New layers pile up on top of old ones','Old rocks sink on purpose','The deep ones are bigger'],why:'Layers stack up over time, like a pile of laundry: the bottom of the pile went in first.'},
 {q:'How many legs does a spider have?',a:['8','6','10'],why:'Spiders have 8 legs. Insects like ants and beetles have 6.',y:1},
 {q:'What do plants need to grow?',a:['Sunlight, water and air','Only rocks','Darkness and ice'],why:'Plants use sunlight, water and air (carbon dioxide) to make their own food.',y:1},
 {q:'Which of these is a liquid?',a:['Water','Ice','A rock'],why:'Water is a liquid. Freeze it and it becomes ice, a solid.',y:1},
 {q:'What makes earthquakes?',a:['Huge pieces of the crust slipping','Thunder','Very big footsteps'],why:'The crust is broken into giant plates. When they suddenly slip, the ground shakes.'},
 {q:'Which shiny mineral looks like gold but is NOT gold, so people call it "fool\'s gold"?',a:['Pyrite','Silver','Copper'],why:'Pyrite looks like gold, but its streak is greenish-black. Real gold\'s streak is gold.'},
 {q:'Which gas do we breathe in to stay alive?',a:['Oxygen','Smoke','Helium'],why:'Our bodies need oxygen from the air. That\'s why miners always check the air deep underground.',y:1}];
let EQ=null; /* {i, order, picked} the question on screen; PASS: answered right, the ride is ready */
let PASS=false;
const canRide=p=>!!(p&&(DEMO||(Q(p).met)));
function newQ(p){const s=Q(p),L=s.lab;const young=p.grade!=null&&p.grade<=2;let pool=SCIQ.map((x,i)=>i).filter(i=>!young||SCIQ[i].y);
 const seen=Array.isArray(L.sq)?L.sq:[];const fresh=pool.filter(i=>!seen.includes(i));if(fresh.length)pool=fresh;
 const i=pool[Math.floor(Math.random()*pool.length)];L.sq=seen.concat(i).slice(-Math.min(15,Math.floor(pool.length/2)+5));
 const order=SCIQ[i].a.map((x,k)=>k).sort(()=>Math.random()-.5);EQ={i,order,picked:-1};}
function rockHTML(p){
 if(!canRide(p))return `<div class="lb-rocks"><div class="lb-rock-n">🔒</div><div class="lb-rock-act"><p style="margin:0 0 6px;font-weight:700;font-size:18px">Dr. Quartz takes you down himself the first time.</p><p class="muted" style="margin:0">Find a 🪨 <b>mystery rock</b> in a treasure chest or a battle, and he will come and find you on the map.</p></div></div>`;
 if(PASS)return `<div class="lb-rocks"><div class="lb-rock-n">✅</div><div class="lb-rock-act"><p style="margin:0 0 8px;font-weight:700;font-size:18px">Right! The elevator is ready.</p><button class="btn green big" onclick="Lab.down()">🛗 Ride the elevator down</button></div></div>`;
 if(!EQ)newQ(p);const Qn=SCIQ[EQ.i];
 if(EQ.picked>=0){const ok=EQ.picked===0;return `<div class="lb-sq"><p class="lb-sq-q">${esc(Qn.q)}</p><p style="margin:0 0 8px"><b>${ok?'✅ Right!':'Not quite.'}</b> ${esc(Qn.why)}</p>${ok?`<button class="btn green big" onclick="Lab.down()">🛗 Ride the elevator down</button>`:`<button class="btn gold" onclick="Lab.ans(-1)">🔬 Try another question</button>`}</div>`;}
 return `<div class="lb-sq"><p class="muted" style="margin:0 0 4px">🔬 Dr. Quartz: "Answer one science question and the elevator is yours!"</p><p class="lb-sq-q">${esc(Qn.q)}</p><div class="lb-sq-a">${EQ.order.map(k=>`<button class="btn ghost dark" onclick="Lab.ans(${k})">${esc(Qn.a[k])}</button>`).join('')}</div></div>`;}
function ans(k){const p=P();if(!p||!EQ)return;
 if(k<0){newQ(p);save();}else{EQ.picked=k;if(k===0){PASS=true;try{SFX.correct();}catch(e){}const L=Q(p).lab;L.sqRight=(L.sqRight||0)+1;}else{try{SFX.wrong();}catch(e){}}save();}
 const el=document.querySelector('#modal .lb-elev');
 if(el){const h=el.querySelector('.lb-rocks,.lb-sq');if(h)h.outerHTML=rockHTML(p);}else draw();
 if(k===0)PASS=true;}
function buy(){}
function down(){const p=P();window.__tripFrom='lab';if(DEMO){toast('🔬 Preview: the elevator is closed.');return;}
 if(!canRide(p)||!PASS)return;
 PASS=false;EQ=null;try{SFX.tap();}catch(e){}try{closeModal();}catch(e){}
 Quartz.startTrip(false,true);}

/* ---------- the Lab as a dollhouse (owner, Oct 2026) ----------
   The front view of the Lab: the whole building cut open. Roof: solar panels and the glass greenhouse. Top floor: the study
   (Journal + Collection) and the Power Room. Ground floor: the Museum, the main lab (Test Center bench, Dig Map, Dr. Quartz, your
   pet's bed with the Pet Translator) and the Gear room. A plain elevator shaft on the right runs down past the bottom of the picture.
   Tap a room: the main lab and the study are pages here (VIEW), the camp's rooms open through Quartz.room() (cave.js room()). */
let VIEW='house',PETSAY=null;
const HO='#3b2a1e';
const hU=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
const hImg=(s,x,y,w,h)=>s?`<image href="${hU(s)}" x="${x}" y="${y}" width="${w}" height="${h}"/>`:'';
const dArt=k=>{try{return (window.MQ_DECOR&&MQ_DECOR.ART&&MQ_DECOR.ART[k])||'';}catch(e){return '';}};
function houseSVG(p){const O=HO;
 const flask=(x,y,c,k=1)=>`<path d="M${x-6*k} ${y-30*k} h${12*k} v${10*k} l${12*k} ${20*k} h${-36*k} l${12*k} ${-20*k} Z" fill="${c}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
 const tube=(x,y,c,k=1)=>`<rect x="${x-5*k}" y="${y-36*k}" width="${10*k}" height="${36*k}" rx="${5*k}" fill="${c}" stroke="${O}" stroke-width="2.5"/><rect x="${x-5*k}" y="${y-36*k}" width="${10*k}" height="${10*k}" fill="#fff" opacity=".55"/>`;
 const bub=(x,y)=>`<circle cx="${x}" cy="${y-40}" r="4" fill="#fff" stroke="${O}" stroke-width="1.2" opacity=".8"/><circle cx="${x+5}" cy="${y-52}" r="3" fill="#fff" stroke="${O}" stroke-width="1.2" opacity=".6"/>`;
 const scope=(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})"><rect x="-16" y="-7" width="34" height="9" rx="2" fill="#343a40" stroke="${O}" stroke-width="2"/><path d="M0 -7 L9 -44 L20 -44 L11 -7 Z" fill="#748ffc" stroke="${O}" stroke-width="2"/><rect x="9" y="-58" width="13" height="16" rx="3" fill="#343a40" stroke="${O}" stroke-width="2"/><circle cx="-8" cy="-16" r="6" fill="#ffd43b" stroke="${O}" stroke-width="1.5"/></g>`;
 const dino=(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})" stroke-linecap="round"><path d="M-70 -6 Q-40 -50 0 -46 Q34 -44 52 -74 Q62 -90 80 -82" fill="none" stroke="#fff8e8" stroke-width="10"/>${[-44,-14,14,30].map(x=>`<path d="M${x} ${x<0?-36:-44} v${x<0?38:46}" stroke="#fff8e8" stroke-width="8"/>`).join('')}<path d="M-70 -6 Q-92 0 -110 -12" fill="none" stroke="#fff8e8" stroke-width="7"/>${[-36,-24,-12,0,12,24].map(x=>`<path d="M${x} -46 l3 -14" stroke="#fff8e8" stroke-width="5"/>`).join('')}<ellipse cx="84" cy="-84" rx="16" ry="11" fill="#fff8e8" stroke="${O}" stroke-width="2"/><circle cx="88" cy="-86" r="3" fill="${O}"/></g>`;
 const locker=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${c}" stroke="${O}" stroke-width="3"/>${[.1,.15,.2].map(f=>`<rect x="${x+6}" y="${y+h*f}" width="${w-12}" height="4" rx="2" fill="${O}" opacity=".3"/>`).join('')}<rect x="${x+w-11}" y="${y+h*.5}" width="5" height="16" rx="2" fill="#dee2e6" stroke="${O}" stroke-width="1.5"/>`;
 const solar=(x,y,w,h,r)=>`<g transform="rotate(${r} ${x+w/2} ${y+h/2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#1864ab" stroke="${O}" stroke-width="3"/>${[1,2,3,4].map(i=>`<line x1="${x+w*i/5}" y1="${y}" x2="${x+w*i/5}" y2="${y+h}" stroke="#74c0fc" stroke-width="1.5"/>`).join('')}<line x1="${x}" y1="${y+h/2}" x2="${x+w}" y2="${y+h/2}" stroke="#74c0fc" stroke-width="1.5"/></g>`;
 const lamp=(x,y,w)=>`<line x1="${x}" y1="${y}" x2="${x}" y2="${y+18}" stroke="${O}" stroke-width="2"/><path d="M${x-w/2} ${y+30} Q${x} ${y+12} ${x+w/2} ${y+30} Z" fill="#ffd43b" stroke="${O}" stroke-width="2.5"/><polygon points="${x-w/2},${y+30} ${x+w/2},${y+30} ${x+w*1.6},${y+150} ${x-w*1.6},${y+150}" fill="#fff3bf" opacity=".22"/>`;
 const paper=(x,y,w,h,c1,c2,id)=>`<defs><pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${c1}"/><circle cx="12" cy="12" r="2.5" fill="${c2}"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>`;
 const boards=(x,y,w,h)=>{let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c08552" stroke="${O}" stroke-width="3"/>`;for(let i=x+30;i<x+w;i+=46)s+=`<line x1="${i}" y1="${y}" x2="${i}" y2="${y+h}" stroke="#8b5e3c" stroke-width="1.5"/>`;return s;};
 const room=(x,y,w,h,inner,id)=>`<g class="lbh-hs" data-id="${id}">${inner}<rect class="lbh-glow" x="${x+3}" y="${y+3}" width="${w-6}" height="${h-6}" rx="6" fill="none" stroke="#ffd43b" stroke-width="7"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/></g>`;
 const pet=(()=>{try{return petOf(p);}catch(e){return null;}})();
 let s=`<defs><linearGradient id="lbhSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5bb5f0"/><stop offset="1" stop-color="#d6efff"/></linearGradient><linearGradient id="lbhSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b6b43"/><stop offset="1" stop-color="#4f3524"/></linearGradient><linearGradient id="lbhGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3fafc" stop-opacity=".85"/><stop offset="1" stop-color="#99e9f2" stop-opacity=".6"/></linearGradient><linearGradient id="lbhBrick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8b28c"/><stop offset="1" stop-color="#d79a72"/></linearGradient></defs>
 <rect width="1100" height="720" fill="url(#lbhSky)"/><circle cx="1030" cy="70" r="40" fill="#ffe066"/><circle cx="1030" cy="70" r="64" fill="#ffe066" opacity=".25"/>
 ${[[130,80,1],[500,50,.8],[800,110,.7]].map(([x,y,k])=>`<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="0" rx="60" ry="22" fill="#fff"/><ellipse cx="36" cy="-12" rx="40" ry="24" fill="#fff"/><ellipse cx="-30" cy="-6" rx="30" ry="18" fill="#fff"/></g>`).join('')}
 ${hImg(dArt('pine'),20,420,70,95)}${hImg(dArt('oak'),990,400,100,120)}
 <rect y="510" width="1100" height="210" fill="url(#lbhSoil)"/><rect y="498" width="1100" height="16" fill="#69db7c" stroke="${O}" stroke-width="3"/>
 ${[[90,590,40],[300,670,26],[520,620,34],[160,700,22],[700,650,28]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.45}" fill="#5c3d22" stroke="${O}" stroke-width="2" opacity=".7"/>`).join('')}`;
 const X0=110,X1=910,Y_ROOF=140,Y_F2=160,Y_F1=330,Y_G=500;
 s+=`<rect x="${X0-10}" y="${Y_F2-10}" width="${X1-X0+20}" height="${Y_G-Y_F2+20}" fill="url(#lbhBrick)" stroke="${O}" stroke-width="5"/>`;
 {const x=X0+420,y=Y_F2,w=X1-X0-420,h=Y_F1-Y_F2;let g=paper(x,y,w,h,'#fff3bf','#ffe8a3','lbhP1')+boards(x,y+h-16,w,16); /* the study sits under the greenhouse, the Power Room under the solar panels (owner) */
  g+=`<rect x="${x+20}" y="${y+24}" width="150" height="${h-44}" rx="6" fill="#d0ebff" fill-opacity=".6" stroke="${O}" stroke-width="3"/>${[y+70,y+112].map(yy=>`<rect x="${x+20}" y="${yy}" width="150" height="7" fill="#c08552" stroke="${O}" stroke-width="2"/>`).join('')}`;
  [['💎',45,62],['🦴',95,62],['🐚',140,62],['🪨',45,104],['🔮',95,104],['🦋',140,104],['🐌',60,146],['🌋',120,146]].forEach(([e,xx,yy])=>{g+=`<text x="${x+xx}" y="${y+yy}" text-anchor="middle" font-size="24">${e}</text>`;});
  g+=`<g transform="translate(-22 0)"><rect x="${x+200}" y="${y+40}" width="80" height="60" rx="4" fill="#a5d8ff" stroke="${O}" stroke-width="3"/><path d="M${x+240} ${y+40} V${y+100} M${x+200} ${y+70} H${x+280}" stroke="${O}" stroke-width="2.5"/>
  <rect x="${x+230}" y="${y+108}" width="160" height="14" rx="4" fill="#d9a066" stroke="${O}" stroke-width="3"/><rect x="${x+240}" y="${y+122}" width="12" height="32" fill="#a5683a" stroke="${O}" stroke-width="2.5"/><rect x="${x+368}" y="${y+122}" width="12" height="32" fill="#a5683a" stroke="${O}" stroke-width="2.5"/><path d="M${x+270} ${y+108} L${x+310} ${y+101} L${x+350} ${y+108} L${x+350} ${y+104} L${x+310} ${y+97} L${x+270} ${y+104} Z" fill="#fff" stroke="${O}" stroke-width="2"/><path d="M${x+340} ${y+98} l18 -18 l4 4 l-18 18 Z" fill="#ffd43b" stroke="${O}" stroke-width="2"/><path d="M${x+380} ${y+108} v-34 q0 -10 -12 -14" stroke="${O}" stroke-width="3" fill="none"/><path d="M${x+352} ${y+48} l24 -2 l-2 14 l-24 2 Z" fill="#e03131" stroke="${O}" stroke-width="2.5"/></g>`;
  s+=room(x,y,w,h,g,'study');}
 {const x=X0,y=Y_F2,w=420,h=Y_F1-Y_F2;let g=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e9ecef"/>`+boards(x,y+h-16,w,16);
  for(let i=0;i<4;i++){const bx=x+30+i*80;g+=`<rect x="${bx}" y="${y+66}" width="54" height="84" rx="6" fill="#ffd43b" stroke="${O}" stroke-width="3"/><rect x="${bx+18}" y="${y+58}" width="18" height="10" rx="2" fill="#343a40" stroke="${O}" stroke-width="2"/><path d="M${bx+30} ${y+88} l-8 18 h10 l-6 18" stroke="${O}" stroke-width="3" fill="none"/><rect x="${bx+6}" y="${y+136}" width="42" height="8" rx="2" fill="#2f9e44"/>`;}
  g+=`<path d="M${x+57} ${y+58} V${y+22} H${x+w-40} V${y-20}" stroke="#e03131" stroke-width="3" fill="none"/><circle cx="${x+w-50}" cy="${y+40}" r="14" fill="#69db7c" stroke="${O}" stroke-width="2.5"/><circle cx="${x+w-50}" cy="${y+40}" r="26" fill="#69db7c" opacity=".2"/>`;
  s+=room(x,y,w,h,g,'power');}
 s+=`<rect x="${X0-10}" y="${Y_F1}" width="${X1-X0+20}" height="14" fill="#8b5e3c" stroke="${O}" stroke-width="3"/>`;
 {const x=X0,y=Y_F1+14,w=230,h=Y_G-Y_F1-14;let g=paper(x,y,w,h,'#e6d5b8','#d9c39c','lbhP2')+boards(x,y+h-14,w,14);
  g+=`<rect x="${x+20}" y="${y+h-44}" width="${w-40}" height="30" rx="4" fill="#efe3c2" stroke="${O}" stroke-width="3"/>`+dino(x+w/2+10,y+h-46,.85)+`<rect x="${x+30}" y="${y+18}" width="56" height="40" rx="3" fill="#fff9db" stroke="${O}" stroke-width="2.5"/><text x="${x+58}" y="${y+46}" text-anchor="middle" font-size="20">🦕</text><rect x="${x+140}" y="${y+18}" width="56" height="40" rx="3" fill="#fff9db" stroke="${O}" stroke-width="2.5"/><text x="${x+168}" y="${y+46}" text-anchor="middle" font-size="20">🦴</text>`;
  s+=room(x,y,w,h,g,'museum');}
 {const x=X0+230,y=Y_F1+14,w=410,h=Y_G-Y_F1-14;let g=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e7f5ff"/><rect x="${x}" y="${y+h*.55}" width="${w}" height="${h*.45}" fill="#c5e3f6"/>`+boards(x,y+h-14,w,14)+lamp(x+110,y,26)+lamp(x+300,y,26);
  g+=`<rect x="${x+150}" y="${y+40}" width="120" height="70" rx="4" fill="#2f5d45" stroke="#6b4423" stroke-width="7"/><path d="M${x+164} ${y+96} L${x+184} ${y+62} L${x+204} ${y+86} L${x+228} ${y+56} L${x+256} ${y+80}" stroke="#fff" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/><path d="M${x+250} ${y+74} l10 10 M${x+260} ${y+74} l-10 10" stroke="#ff8787" stroke-width="3"/>
  <rect x="${x+16}" y="${y+h-70}" width="160" height="14" rx="3" fill="#868e96" stroke="${O}" stroke-width="3"/><rect x="${x+24}" y="${y+h-56}" width="144" height="42" fill="#dee2e6" stroke="${O}" stroke-width="3"/><line x1="${x+72}" y1="${y+h-56}" x2="${x+72}" y2="${y+h-14}" stroke="${O}" stroke-width="2"/><line x1="${x+120}" y1="${y+h-56}" x2="${x+120}" y2="${y+h-14}" stroke="${O}" stroke-width="2"/>${flask(x+40,y+h-70,'#ff6b6b',.8)}${bub(x+40,y+h-70)}${tube(x+66,y+h-70,'#69db7c',.8)}${flask(x+92,y+h-70,'#4dabf7',.8)}${bub(x+92,y+h-70)}${scope(x+140,y+h-70,.75)}`;
  s+=room(x,y,w,h,g,'lab');
  s+=`<g class="lbh-hs" data-id="qz">${hImg(window.QUARTZ_SVG||'',x+200,y+h-122,90,108)}<rect class="lbh-glow" x="${x+200}" y="${y+h-124}" width="90" height="112" rx="10" fill="none" stroke="#ffd43b" stroke-width="5"/><rect x="${x+200}" y="${y+h-124}" width="90" height="112" fill="transparent"/></g>`;
  if(pet)s+=`<g class="lbh-hs" data-id="pet"><g transform="translate(${x+345} ${y+h-14})"><rect x="-44" y="-44" width="88" height="44" rx="4" fill="#f1f3f5" stroke="${O}" stroke-width="3"/><ellipse cx="0" cy="-50" rx="38" ry="12" fill="#e599f7" stroke="${O}" stroke-width="3"/><ellipse cx="0" cy="-53" rx="26" ry="6" fill="#f3d9fa"/><text x="0" y="-52" text-anchor="middle" font-size="30">${pet.e}</text><g transform="translate(36 -64)"><rect x="-8" y="-12" width="18" height="15" rx="3" fill="#74c0fc" stroke="${O}" stroke-width="2"/><line x1="0" y1="-12" x2="0" y2="-24" stroke="${O}" stroke-width="2"/><circle cx="0" cy="-26" r="3" fill="#ff6b6b" stroke="${O}" stroke-width="1.5"/></g></g><rect class="lbh-glow" x="${x+296}" y="${y+h-110}" width="98" height="98" rx="10" fill="none" stroke="#ffd43b" stroke-width="5"/><rect x="${x+296}" y="${y+h-110}" width="98" height="98" fill="transparent"/></g>`;}
 {const x=X0+640,y=Y_F1+14,w=X1-X0-640,h=Y_G-Y_F1-14;let g=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f1f3f5"/>`+boards(x,y+h-14,w,14);['#ff922b','#4dabf7','#69db7c'].forEach((c,i)=>{g+=locker(x+16+i*44,y+30,38,h-44,c);});g+=`<text x="${x+80}" y="${y+24}" text-anchor="middle" font-size="18">⭐</text>`;s+=room(x,y,w,h,g,'gear');}
 /* the elevator: a plain shaft, down past the bottom of the picture (owner) */
 {const x=X1+10,w=80;let g=`<rect x="${x}" y="${Y_F2-10}" width="${w}" height="${740-Y_F2}" fill="#868e96" stroke="${O}" stroke-width="4"/><rect x="${x+10}" y="${Y_F2}" width="${w-20}" height="${740-Y_F2}" fill="#495057"/>
  <rect x="${x+14}" y="${Y_G-84}" width="${w-28}" height="80" rx="5" fill="#ced4da" stroke="${O}" stroke-width="3"/><line x1="${x+w/2}" y1="${Y_G-78}" x2="${x+w/2}" y2="${Y_G-10}" stroke="${O}" stroke-width="2"/><line x1="${x+w/2}" y1="${Y_F2}" x2="${x+w/2}" y2="${Y_G-84}" stroke="#adb5bd" stroke-width="2"/><circle cx="${x+w/2}" cy="${Y_G-94}" r="5" fill="#69db7c" stroke="${O}" stroke-width="1.5"/>`;
  s+=room(x,Y_F2-10,w,740-Y_F2,g,'elev');}
 {let g=`<path d="M${X0-30} ${Y_F2-10} L${X0+20} ${Y_ROOF-40} L${X0+420} ${Y_ROOF-40} L${X0+440} ${Y_F2-10} Z" fill="#7a5c45" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>${solar(X0+50,Y_ROOF-34,100,40,-4)}${solar(X0+170,Y_ROOF-36,100,40,0)}${solar(X0+290,Y_ROOF-34,100,40,4)}`;s+=room(X0-30,Y_ROOF-60,470,Y_F2-Y_ROOF+50,g,'power');}
 {const cx=X0+640,base=Y_F2-10;let g=`<rect x="${cx-200}" y="${base-14}" width="400" height="14" fill="#7a5c45" stroke="${O}" stroke-width="4"/><path d="M${cx-190} ${base-14} Q${cx-190} ${base-150} ${cx} ${base-150} Q${cx+190} ${base-150} ${cx+190} ${base-14} Z" fill="url(#lbhGlass)" stroke="${O}" stroke-width="4"/>${[-120,-60,0,60,120].map(d=>`<path d="M${cx+d} ${base-14} Q${cx+d*1.05} ${base-120+Math.abs(d)*.4} ${cx} ${base-150}" stroke="${O}" stroke-width="2" fill="none" opacity=".45"/>`).join('')}${hImg(dArt('farm_sunflower'),cx-150,base-110,50,96)}${hImg(dArt('farm_carrots'),cx-90,base-60,46,46)}${hImg(dArt('farm_pumpkin'),cx-30,base-56,46,44)}${hImg(dArt('fern'),cx+30,base-66,50,52)}${hImg(dArt('farm_sunflower'),cx+100,base-104,46,90)}`;s+=room(cx-200,base-155,400,145,g,'garden');}
 return `<svg class="lbh-svg" viewBox="0 0 1100 720" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${s}</svg>`;}
const NAMES={study:'📓 Study: Journal & Collection',power:'☀️ Power Room',museum:'🏛️ Museum',lab:'🧪 Test Center & Dig Map',gear:'🎒 Gear',elev:'🛗 Elevator to the caves',garden:'🌱 Garden',pet:'🐾 Your pet',qz:'🔬 Dr. Quartz'};
/* the Pet Translator: mostly feelings and praise, about 1 in 3 a hint */
function petLine(p){const pet=petOf(p);if(!pet)return '';const s=Q(p),hints=[],nice=[`I LOVE train rides!`,`You're the best at math. And at belly rubs.`,`This bed is SO comfy. Thank you!`,`I'm proud of you, ${first(p)}!`,`Is it snack time? It feels like snack time.`,`I sniffed every rock in here. They smell like… rocks.`,`Dr. Quartz said I'm a very good lab assistant!`];
 try{const pd=petMood(petData(p,pet.id));if(pd.food<=1)hints.push('Psst… I\'m a little hungry 🍗');else if(pd.joy>=3)nice.push('Thanks for playing with me!');}catch(e){}
 try{const mm=mmState(p);if(mm&&!mm.done)hints.push('Today\'s Mystery Mineral is waiting on the bench!');}catch(e){}
 if(canRide(p))hints.push('Answer Dr. Quartz\'s science question and we can ride the elevator down!');
 try{if(window.Daily&&P().tad&&P().tad.s<3)hints.push('The Elder Wiz has a quest for you!');}catch(e){}
 const pool=hints.length&&Math.random()<.34?hints:nice;return pool[Math.floor(Math.random()*pool.length)];}
function bubbleAt(id,html){const wrap=document.querySelector('.lbh-wrap'),tip=document.getElementById('lbhTip');if(!wrap||!tip)return;const g=wrap.querySelector(`.lbh-hs[data-id="${id}"] rect:last-child`),r=g?g.getBoundingClientRect():null,wr=wrap.getBoundingClientRect();
 tip.innerHTML=html;tip.style.left=((r?r.left+r.width/2:wr.left+wr.width/2)-wr.left)+'px';tip.style.top=((r?r.top:wr.top+40)-wr.top)+'px';tip.hidden=false;clearTimeout(PETSAY);PETSAY=setTimeout(()=>{tip.hidden=true;},5200);}
function tap(id){const p=P();try{SFX.tap();}catch(e){}
 if(id==='lab'){VIEW='room';draw();window.scrollTo(0,0);return;}if(id==='study'){VIEW='study';draw();window.scrollTo(0,0);return;}
 if(id==='elev'){modal(`<div class="mcard lb-elev"><div class="big-emoji">🛗</div><h2>The elevator to the caves</h2>${rockHTML(p)}<div class="row"><button class="btn ghost dark" onclick="closeModal()">Close</button></div></div>`);return;}
 if(id==='pet'){const t=petLine(p);bubbleAt('pet',`<small>📡 bzzt… translating…</small>`);setTimeout(()=>bubbleAt('pet',`${esc(petOf(p).e)} “${esc(t)}”`),900);return;}
 if(id==='qz'){bubbleAt('qz',`🔬 ${GREET}`);return;}
 if(['garden','museum','power','gear'].includes(id)){if(window.Quartz&&Quartz.room&&Quartz.room(id))return;toast('🔬 That room is not ready yet.');return;}}
function house(){css();const p=P();if(!p){go('world');return;}const app=document.getElementById('app');
 app.innerHTML=topbar()+`<div class="page lb-page lb-house"><div class="zhead"><button class="btn green small" onclick="Lab.home()">🚂 Train home</button><h2 class="title" style="margin:0">🔬 Dr. Quartz's Lab</h2></div>
 <div class="lbh-wrap">${houseSVG(p)}<div class="lbh-tip" id="lbhTip" hidden></div></div></div>`;
 app.querySelectorAll('.lbh-hs').forEach(g=>{g.addEventListener('click',()=>tap(g.dataset.id)); /* no hover name bubbles (owner, Oct 2026) */});}

/* ---------- the screen ---------- */
function draw(){css();const p=P();if(!p){go('world');return;}if(VIEW==='house'){house();return;}const s=Q(p);
 const app=document.getElementById('app');
 if(VIEW==='study'){app.innerHTML=topbar()+`<div class="page lb-page"><div class="zhead"><button class="btn ghost small" onclick="Lab.back()">← Lab</button><h2 class="title" style="margin:0">📓 The Study</h2></div>
  <div class="panel lb-st"><h3>📓 My Journal</h3><p class="muted" style="margin:0 0 8px">Everything you've studied, in your own journal.</p><button class="btn green" onclick="Quartz.room('journal')">📓 Open my Journal</button></div>
  <div class="panel lb-st"><h3>🗄️ Collection</h3>${colHTML(p)}</div></div>`;return;}
 app.innerHTML=topbar()+`<div class="page lb-page">
  <div class="zhead"><button class="btn ghost small" onclick="Lab.back()">← Lab</button><h2 class="title" style="margin:0">🧪 The Main Lab</h2></div>
  ${DEMO&&!(p.sci&&p.sci.key)&&false?'<div class="panel" style="background:#fff3bf"><b>Preview.</b> You don\'t have the key yet, so nothing here is saved.</div>':''}
  <div class="panel"><div class="qz-row"><div class="qz-av">${window.QUARTZ_SVG||''}</div><div class="qz-bub"><b>🔬 Dr. Quartz</b><div id="lbHi">${GREET}</div></div>${(()=>{try{const pt=petOf(p);return pt?`<div class="lb-pet" title="${esc(pt.name)} came along!">${petAvatar(p,pt)}</div>`:'';}catch(e){return '';}})()}</div></div>
  <div class="lb-cols">
   <div class="panel lb-st"><h3>🧪 Mystery Mineral of the Day</h3>${mmHTML(p)}<div style="margin-top:10px"><button class="btn ghost dark small" onclick="Quartz.room('bench')">🔬 Field Lab bench: identify my cave finds</button></div></div>
   <div class="panel lb-st"><h3>🛗 Elevator to the dig site</h3>${rockHTML(p)}</div>
  </div>
  <div class="panel lb-st"><h3>🗺️ Dig Map</h3>${mapHTML(p)}</div>
 </div>`;}
let GREET='';
function open(v){VIEW=v==='room'||v==='study'?v:'house';const p=P();if(!p){go('world');return;}const s=Q(p);try{if(window.Cave&&Cave.deliverFossils&&p.cave){const n=Cave.deliverFossils(p.cave);if(n){save();toast(`🦴 ${n} fossil piece${n>1?'s':''} from your backpack went to the 🏛️ Museum.`);}}}catch(e){} /* pieces left in the pack (see cave.js campFossils) */MM=null;FB='';GREET=greet(p);if(!DEMO||hasKey(p)){s.lab.visits=(s.lab.visits||0)+1;s.lab.last=dayKey();save();}
 try{if(typeof W!=='undefined'&&W)p.wpos={x:W.hx,y:W.hy};}catch(e){}draw();}

/* ---------- styles ---------- */
let CSS=false;function css(){if(CSS)return;CSS=true;const st=document.createElement('style');st.textContent=`
.lb-page{max-width:980px}.lb-page h3{margin:0 0 10px;font-size:20px;color:var(--ink)}
.lb-pet{flex:0 0 auto;align-self:flex-end;animation:bob 1.6s ease-in-out infinite;font-size:56px;line-height:1;margin-left:6px}.lb-pet .pav{transform:scale(1.7);transform-origin:bottom center;display:inline-block}
.lbh-wrap{position:relative;margin:0 auto;max-width:1100px}.lbh-svg{width:100%;max-height:calc(100vh - 150px);display:block;border-radius:18px;border:4px solid #8fd3ff;background:#5bb5f0}
.lbh-hs{cursor:pointer}.lbh-glow{opacity:0;transition:opacity .15s}.lbh-hs:hover .lbh-glow,.lbh-hs:active .lbh-glow{opacity:1}
.lbh-tip{position:absolute;transform:translate(-50%,calc(-100% - 6px));background:#fff;color:#2b2250;border:3px solid #3b2a1e;border-radius:16px;padding:6px 12px;font-weight:700;font-size:15px;max-width:280px;text-align:center;pointer-events:none;z-index:2;box-shadow:0 4px 12px #0003}.lbh-tip small{color:#6a5fa0}
.lb-elev .lb-rocks{text-align:left}
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
.lb-sq{text-align:left}.lb-sq-q{margin:0 0 10px;font-weight:700;font-size:19px}.lb-sq-a{display:flex;flex-direction:column;gap:8px}.lb-sq-a .btn{width:100%;white-space:normal;text-align:center}
.lb-rock-n{font-size:34px;display:flex;flex-direction:column;align-items:center;min-width:80px}.lb-rock-n small{font-size:13px;color:var(--muted)}
.lb-rock-act{display:flex;flex-direction:column;gap:8px;flex:1;min-width:200px}.lb-rock-act small{display:block}
#lbBuy{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.lb-key{font-size:64px;text-align:center;animation:lbKey 1.2s ease-out}
@keyframes lbKey{0%{transform:scale(.2) rotate(-40deg);opacity:0}60%{transform:scale(1.2) rotate(8deg);opacity:1}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.lb-key{animation:none}}
@media(max-width:560px){.lb-mm{flex-direction:column}.lb-sample{flex-basis:auto;width:64px;height:64px}.lb-sample.lb-unk svg{width:64px;height:64px}}`;document.head.appendChild(st);}

/* ---------- wiring ---------- */
setInterval(syncTile,500);
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.lab=v=>open(v);}else setTimeout(reg,30);})();
/* a key that is due but was never saved (it could be lost to an online sync before Oct 2 2026) is handed over again on the map */
function keyCatchUp(){try{const p=P();if(!p||DEMO||!keyDue(p)||curScreen!=='world'||document.querySelector('#modal.show'))return;if(window.MQ_VISIT&&MQ_VISIT.busy('labkey'))return;giveKey(p,()=>{});}catch(e){}}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world'){setTimeout(syncTile,0);setTimeout(keyCatchUp,2500);}}});
/* back to Number Town by train (ride.js), landing on the station platform */
function home(){const go2=()=>{try{const p=P();const x=23,y=20;if(typeof W!=='undefined'&&W&&W.T&&W.T[y]&&W.T[y][x]&&!W.T[y][x].block){W.hx=x;W.hy=y;W.drawX=x;W.drawY=y;W.path=[];}if(p)p.wpos={x,y};}catch(e){}go('world');};
 if(window.Ride&&Ride.go('home',go2))return;go2();}
window.Lab={home,open,back:()=>{VIEW='house';go('lab');},tap,petLine,houseSVG,draw:()=>draw(),tab:t=>{TAB=t;try{SFX.tap();}catch(e){}draw();},card,test,guess,buy,down,ans,_pass:()=>{PASS=true;},SCIQ,keyDue,giveKey,hasKey,KEY_TRIPS,ROCK_PRICE,_mm:mmState,_sync:syncTile};
})();
