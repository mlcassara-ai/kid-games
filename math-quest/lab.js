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
 if(window.Quartz&&Quartz.paused&&Quartz.paused(p))return `Taking a break, ${who}? Charge your battery in my <b>⚡ Power Room</b>, then the <b>🛗 elevator</b> takes you straight back down to your dig.`;
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
function newQ(p,easy){const s=Q(p),L=s.lab;const young=easy||(p.grade!=null&&p.grade<=3); /* grade 3 too (Oct 2026 simulation: grade 3 missed 37%) */let pool=SCIQ.map((x,i)=>i).filter(i=>!young||SCIQ[i].y);
 const seen=Array.isArray(L.sq)?L.sq:[];const fresh=pool.filter(i=>!seen.includes(i));if(fresh.length)pool=fresh;
 const i=pool[Math.floor(Math.random()*pool.length)];L.sq=seen.concat(i).slice(-Math.min(15,Math.floor(pool.length/2)+5));
 let order=SCIQ[i].a.map((x,k)=>k);if(easy)order=[0,1+Math.floor(Math.random()*(order.length-1))]; /* after a wrong answer: an easy one, two choices (second simulation) */order=order.sort(()=>Math.random()-.5);EQ={i,order,picked:-1};}
function rockHTML(p){
 if(window.Quartz&&Quartz.paused&&Quartz.paused(p)){const c=p.cave||{};let bm='';try{bm=' / '+CD().BATT[(c.gear&&c.gear.bat)||0].v;}catch(e){}return `<div class="lb-rocks"><div class="lb-rock-n">⛏️</div><div class="lb-rock-act"><p style="margin:0 0 6px;font-weight:700;font-size:18px">Your dig is waiting!</p><p class="muted" style="margin:0 0 8px">🔋 Battery: ${Math.floor(c.bat||0)}${bm}. Charge it in the ⚡ Power Room first if you need to.</p><button class="btn green big" onclick="Lab.down()">🛗 Back down to your dig</button><button class="btn ghost dark small" style="margin-top:8px" onclick="closeModal();Lab.home()">🚂 I'm done digging: train home</button></div></div>`;}
 if(!canRide(p))return `<div class="lb-rocks"><div class="lb-rock-n">🔒</div><div class="lb-rock-act"><p style="margin:0 0 6px;font-weight:700;font-size:18px">Dr. Quartz takes you down himself the first time.</p><p class="muted" style="margin:0">Find a 🪨 <b>mystery rock</b> in a treasure chest or a battle, and he will come and find you on the map.</p></div></div>`;
 if(PASS)return `<div class="lb-rocks"><div class="lb-rock-n">✅</div><div class="lb-rock-act"><p style="margin:0 0 8px;font-weight:700;font-size:18px">Right! The elevator is ready.</p><button class="btn green big" onclick="Lab.down()">🛗 Ride the elevator down</button></div></div>`;
 if(!EQ)newQ(p);const Qn=SCIQ[EQ.i];
 if(EQ.picked>=0){const ok=EQ.picked===0;return `<div class="lb-sq"><p class="lb-sq-q">${esc(Qn.q)}</p><p style="margin:0 0 8px"><b>${ok?'✅ Right!':'Not quite.'}</b> ${esc(Qn.why)}</p>${ok?`<button class="btn green big" onclick="Lab.down()">🛗 Ride the elevator down</button>`:`<button class="btn gold" onclick="Lab.ans(-1)">🔬 Try another question</button>`}</div>`;}
 return `<div class="lb-sq"><p class="muted" style="margin:0 0 4px">🔬 Dr. Quartz: "Answer one science question and the elevator is yours!"</p><p class="lb-sq-q">${esc(Qn.q)}</p><div class="lb-sq-a">${EQ.order.map(k=>`<button class="btn ghost dark" onclick="Lab.ans(${k})">${esc(Qn.a[k])}</button>`).join('')}</div></div>`;}
function ans(k){const p=P();if(!p||!EQ)return;
 if(k<0){newQ(p,true);save();}else{EQ.picked=k;if(k===0){PASS=true;try{SFX.correct();}catch(e){}const L=Q(p).lab;L.sqRight=(L.sqRight||0)+1;}else{try{SFX.wrong();}catch(e){}}save();}
 const el=document.querySelector('#modal .lb-elev');
 if(el){const h=el.querySelector('.lb-rocks,.lb-sq');if(h)h.outerHTML=rockHTML(p);}else draw();
 if(k===0)PASS=true;}
function buy(){}
function down(){const p=P();window.__tripFrom='lab';if(DEMO){toast('🔬 Preview: the elevator is closed.');return;}
 if(window.Quartz&&Quartz.paused&&Quartz.paused(p)){try{SFX.tap();}catch(e){}try{closeModal();}catch(e){}Quartz.resume();return;}
 if(!canRide(p)||!PASS)return;
 PASS=false;EQ=null;try{SFX.tap();}catch(e){}try{closeModal();}catch(e){}
 Quartz.startTrip(false,true);}

/* ---------- the Lab, full screen (owner, Oct 2026) ----------
   The whole building cut open, filling the screen like the cave (no top bar; only 🪙 coins and ⚙️ float on top). Roof: 4 solar panel
   spots (the 4 solar upgrades; each swaps in bigger panels) and the 💎 Crystal Garden dome. Top floor: ⚡ Power Room (the camp bank
   fed by the panels, a live meter of watts in and Wh stored, wired to 4 battery slots = the 4 battery upgrades; an empty ＋ slot
   shows its price and opens the Gear shop), 📓 Study, 🏛️ Museum (a skeleton once one is built, the Crystal Shelf). Ground floor:
   🚂 Exit to Train (a door in the back wall), 🎒 Gear, 🔬 Test Center (the Field Lab bench), the 🛗 elevator doors in the back wall,
   Dr. Quartz, the pet's bed, 💎 Mystery Mineral + Dig Map (the main lab page). Phones held upright show a third at a time
   (◀ ▶ or swipe, opening on the middle third with the elevator). Tap a room: pages here (VIEW) or the camp's rooms via Quartz.room(). */
let VIEW='house',PETSAY=null;
const HO='#3b2a1e';
const hU=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
const hImg=(s,x,y,w,h)=>s?`<image href="${hU(s)}" x="${x}" y="${y}" width="${w}" height="${h}"/>`:'';
const dArt=k=>{try{return (window.MQ_DECOR&&MQ_DECOR.ART&&MQ_DECOR.ART[k])||'';}catch(e){return '';}};
function houseSVG(p){const O=HO;
 /* full-screen Lab (owner, Oct 2026): one 1280x800 picture, drawn once per visit; the live solar meter updates its own text */
 const c=p.cave||{},g=c.gear||{},sol=(window.Cave&&Cave.solarNow&&Cave.solarNow(c))||{lv:0,panels:0,now:0,wh:0,max:0,batLv:0};
 const pet=(()=>{try{return petOf(p);}catch(e){return null;}})();
 const hs=(id,x,y,w,h,inner,r)=>`<g class="lbh-hs" data-id="${id}">${inner||''}<rect class="lbh-glow" x="${x+3}" y="${y+3}" width="${w-6}" height="${h-6}" rx="${r||10}" fill="none" stroke="#ffd43b" stroke-width="7"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/></g>`;
 const txt=(x,y,t,sz,col,w)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="${w||700}" font-size="${sz}" fill="${col||O}">${t}</text>`;
 let s=`<defs><linearGradient id="lbfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc7f5"/><stop offset="1" stop-color="#d6efff"/></linearGradient><linearGradient id="lbfGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7f5ff" stop-opacity=".85"/><stop offset="1" stop-color="#c5f6fa" stop-opacity=".5"/></linearGradient><pattern id="lbfBrick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#f1e3c8"/><path d="M0 19.5 H40 M20 0 V10 M0 10 H40" stroke="#e2cfa8" stroke-width="1.5"/></pattern></defs>
 <rect width="1280" height="800" fill="url(#lbfSky)" class="lbf-sky"/><circle cx="1220" cy="80" r="40" fill="#ffd43b"/><circle cx="1220" cy="80" r="62" fill="#ffd43b" opacity=".2"/>
 ${[[180,70,1],[560,96,.8],[1000,50,.7]].map(([x,y,k])=>`<g transform="translate(${x} ${y}) scale(${k})" fill="#fff" opacity=".92"><ellipse rx="60" ry="20"/><ellipse cx="36" cy="-12" rx="40" ry="22"/><ellipse cx="-30" cy="-6" rx="30" ry="16"/></g>`).join('')}
 <rect y="690" width="1280" height="110" fill="#7a5233"/><rect y="682" width="1280" height="12" fill="#69db7c" stroke="${O}" stroke-width="2"/>${[100,420,760,1100].map(x=>`<ellipse cx="${x}" cy="745" rx="40" ry="12" fill="#5c3d26"/>`).join('')}
 <rect x="50" y="226" width="1180" height="464" fill="#d9c7a3" stroke="${O}" stroke-width="6"/>`;
 /* roof: 4 panel spots (the 4 solar upgrades: each one swaps in bigger panels); spots not bought yet are faded outlines */
 const PW=[0,96,110,122,130][sol.lv]||110,PC=['#1c4f8a','#1c4f8a','#1864ab','#1971c2','#0b3d91'][sol.lv];
 let roof=`<path d="M40 226 L110 160 L630 160 L650 226 Z" fill="#8a5a3b" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>`;
 for(let i=0;i<4;i++){const x=128+i*124,own=i<sol.panels;roof+=own?`<g transform="translate(${x} 170) skewX(-14)"><rect width="${PW}" height="44" rx="4" fill="${PC}" stroke="${sol.lv>=4?'#ffd43b':O}" stroke-width="3"/><path d="M${PW/3} 0 v44 M${PW*2/3} 0 v44 M0 22 h${PW}" stroke="#4dabf7" stroke-width="2"/></g><path d="M${x+PW/2-6} 214 V232" stroke="#e03131" stroke-width="3"/>`
  :`<g transform="translate(${x} 170) skewX(-14)" opacity=".5"><rect width="110" height="44" rx="4" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 6"/></g>`;}
 if(sol.panels)roof+=`<path d="M${128+44} 232 H${128+(sol.panels-1)*124+44}" stroke="#e03131" stroke-width="3"/>`;
 s+=hs('power',40,156,610,74,roof,6);
 /* the crystal dome */
 s+=hs('garden',700,60,480,170,`<rect x="690" y="206" width="500" height="20" fill="#8a5a3b" stroke="${O}" stroke-width="5"/><path d="M712 208 A228 146 0 0 1 1168 208 Z" fill="url(#lbfGlass)" stroke="${O}" stroke-width="5"/><path d="M940 62 V208 M820 86 Q850 150 838 208 M1060 86 Q1030 150 1042 208" stroke="${O}" stroke-width="2" opacity=".35" fill="none"/>${domeJars(p,940,226)}`);
 s+=`<g transform="translate(640 238)"><rect x="-150" y="-32" width="300" height="46" rx="12" fill="#fff" stroke="#1971c2" stroke-width="5"/>${txt(0,0,"🔬 Dr. Quartz's Lab",26,'#1971c2')}</g><rect x="56" y="440" width="1168" height="16" fill="#8a5a3b" stroke="${O}" stroke-width="4"/>`;
 /* ⚡ Power Room: the camp bank (fed by the panels, with the live meter) wired to the 4 helmet-battery slots (the 4 battery upgrades) */
 {let r=`<rect x="60" y="262" width="380" height="178" fill="#e9ecef"/>`;
  const fill=sol.max?Math.max(0,Math.min(1,sol.wh/sol.max)):0;
  r+=`<path d="M100 232 V276" stroke="#e03131" stroke-width="4"/><rect x="72" y="276" width="62" height="150" rx="8" fill="#495057" stroke="${O}" stroke-width="3"/><rect x="80" y="296" width="46" height="120" rx="4" fill="#212529"/><rect id="lbBankFill" x="80" y="${296+120*(1-fill)}" width="46" height="${120*fill}" rx="4" fill="#40c057"/>${txt(103,290,'BANK',11,'#fff')}`;
  r+=`<rect x="148" y="270" width="282" height="46" rx="8" fill="#212529" stroke="${O}" stroke-width="3"/><text id="lbSolW" x="160" y="290" font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="15" fill="#ffd43b">${sol.lv?(sol.now?`☀️ ${sol.now} W in`:'🌙 0 W (night)'):'☀️ no panels yet'}</text><text id="lbSolWh" x="160" y="309" font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="15" fill="#69db7c">${sol.lv?`🔋 ${Math.floor(sol.wh)} / ${sol.max} Wh`:'🔋 bank: buy panels'}</text>`;
  r+=`<path d="M134 352 H${150+3*68+26}" stroke="#e03131" stroke-width="3"/>`;
  for(let i=0;i<4;i++){const x=150+i*68,own=i<sol.batLv;r+=own?`<path d="M${x+26} 352 V366" stroke="#e03131" stroke-width="3"/><g transform="translate(${x} 366)"><rect width="52" height="64" rx="8" fill="#ffd43b" stroke="${O}" stroke-width="3"/><rect x="16" y="-6" width="20" height="8" rx="3" fill="${O}"/><path d="M29 12 L19 34 L28 34 L22 54 L36 28 L27 28 L33 12Z" fill="${O}"/></g>`
   :`<g transform="translate(${x} 366)" opacity=".55"><rect width="52" height="64" rx="8" fill="#f8f9fa" stroke="${O}" stroke-width="2.5" stroke-dasharray="7 5"/>${txt(26,30,'＋',24,'#868e96')}${txt(26,52,'🪙'+(CD().BATT[i+1]||{}).c,11,'#495057',600)}</g>`;}
  r+=txt(258,340,`${sol.batLv} of 4 batteries`,12,'#495057',600);
  s+=hs('power',60,262,380,178,r);
  if(sol.batLv<4)s+=hs('buybat',150+sol.batLv*68-4,360,(4-sol.batLv)*68,76,'',8);}
 /* 📓 Study */
 {let r=`<rect x="440" y="262" width="400" height="178" fill="url(#lbfBrick)"/><rect x="466" y="280" width="150" height="136" rx="6" fill="#c9a27a" stroke="${O}" stroke-width="3"/>${[0,1,2].map(i=>`<rect x="472" y="${314+i*38}" width="138" height="5" fill="${O}"/>`).join('')}${['💎','🦴','🐚','🪨','🦋','🐌','🔮','🌿','⭐'].map((e,i)=>`<text x="${490+(i%3)*44}" y="${308+Math.floor(i/3)*38}" font-size="22" text-anchor="middle">${e}</text>`).join('')}
  <rect x="660" y="282" width="130" height="64" rx="5" fill="#a5d8ff" stroke="${O}" stroke-width="3"/><path d="M725 282 V346 M660 314 H790" stroke="${O}" stroke-width="2.5"/><rect x="644" y="364" width="170" height="16" rx="4" fill="#a0522d" stroke="${O}" stroke-width="3"/><rect x="658" y="380" width="10" height="56" fill="#a0522d"/><rect x="790" y="380" width="10" height="56" fill="#a0522d"/><rect x="690" y="342" width="70" height="24" rx="3" fill="#fff" stroke="${O}" stroke-width="2"/>${txt(725,360,'📓',16)}`;
  s+=hs('study',440,262,400,178,r);}
 /* 🏛️ Museum: a skeleton once one is built, and the Crystal Shelf */
 {const built=Object.keys(c.ex||{}).length;let r=`<rect x="840" y="262" width="380" height="178" fill="#fff4e6"/><rect x="862" y="398" width="176" height="14" rx="4" fill="#c9a27a" stroke="${O}" stroke-width="3"/>`;
  r+=built?`<g stroke="${O}" stroke-width="2.5" stroke-linecap="round" fill="#f8f9fa"><path d="M870 352 Q900 330 940 336 Q975 340 1000 330" fill="none" stroke-width="9" stroke="#f8f9fa"/><path d="M870 352 Q900 330 940 336 Q975 340 1000 330" fill="none"/>${[0,1,2,3,4].map(i=>`<path d="M${912+i*14} 336 q2 18 -4 28" fill="none" stroke-width="3"/>`).join('')}<path d="M1000 322 l26 -6 q8 4 4 12 l-8 6 l-22 0 Z"/><path d="M930 342 l-6 56 M948 342 l8 56 M986 336 l-4 62 M1000 334 l8 64" fill="none" stroke-width="5" stroke="#f8f9fa"/><path d="M930 342 l-6 56 M948 342 l8 56 M986 336 l-4 62 M1000 334 l8 64" fill="none"/></g>${built>1?txt(950,300,'🦴×'+built,16):''}`
   :`${txt(950,380,'🦴 ❔',34)}${txt(950,300,'Build a skeleton!',14,'#868e96',600)}`;
  let shelf='';try{const sh=(p.cg&&p.cg.shelf)||[];sh.slice(-3).forEach((x,i)=>{shelf+=`<svg x="${1072+i*42}" y="336" width="40" height="44" viewBox="0 0 120 124">${CG.art(x.id,1,x.col)}</svg>`;});}catch(e){}
  r+=`<rect x="1060" y="288" width="146" height="124" rx="6" fill="#e5dbff" stroke="${O}" stroke-width="3"/>${txt(1133,310,'Crystal Shelf',14,'#5f3dc4')}<path d="M1066 384 h134" stroke="${O}" stroke-width="4"/>${shelf}`;
  s+=hs('museum',840,262,380,178,r);}
 /* ground floor: 🚂 exit door, 🎒 Gear, 🔬 Test Center, 🛗 elevator doors in the back wall, Dr. Quartz, the pet's bed, 💎 Mystery Mineral + Dig Map */
 s+=`<rect x="60" y="456" width="230" height="230" fill="#dee2e6"/><rect x="290" y="456" width="250" height="230" fill="#e3fafc"/><rect x="540" y="456" width="200" height="230" fill="url(#lbfBrick)"/><rect x="740" y="456" width="216" height="230" fill="#fff3bf"/><rect x="956" y="456" width="264" height="230" fill="#e7f5ff"/>`;
 s+=hs('exit',66,466,112,220,`<rect x="74" y="514" width="96" height="172" rx="6" fill="#8a5a3b" stroke="${O}" stroke-width="4"/><rect x="88" y="530" width="68" height="56" rx="5" fill="#a5d8ff" stroke="${O}" stroke-width="3"/><g transform="translate(92 556) scale(.5)"><rect x="0" y="10" width="40" height="26" rx="4" fill="#1c7ed6"/><rect x="40" y="16" width="44" height="20" rx="8" fill="#e03131"/><rect x="62" y="4" width="8" height="14" fill="#212529"/><circle cx="16" cy="40" r="7" fill="#212529"/><circle cx="62" cy="40" r="7" fill="#212529"/></g><circle cx="156" cy="612" r="6" fill="#ffd43b" stroke="${O}" stroke-width="2"/><rect x="68" y="474" width="108" height="30" rx="6" fill="#2f9e44" stroke="${O}" stroke-width="3"/>${txt(122,494,'🚂 Exit to Train',13,'#fff')}`);
 s+=hs('gear',180,470,110,216,['#f76707','#1c7ed6'].map((cc,i)=>`<rect x="${186+i*52}" y="500" width="46" height="180" rx="5" fill="${cc}" stroke="${O}" stroke-width="3"/><path d="M${198+i*52} 530 h22 M${198+i*52} 540 h22" stroke="#fff" stroke-width="3" opacity=".7"/>`).join('')+txt(235,494,'🎒 Gear',13,O,600));
 s+=hs('test',294,470,242,216,`<rect x="306" y="590" width="220" height="20" rx="4" fill="#868e96" stroke="${O}" stroke-width="3"/><rect x="318" y="610" width="196" height="74" fill="#adb5bd" stroke="${O}" stroke-width="3"/><path d="M350 590 v-50 l14 -10 l8 10 v50" fill="#495057" stroke="${O}" stroke-width="3"/><circle cx="430" cy="574" r="14" fill="#8a8f98" stroke="${O}" stroke-width="2.5"/><path d="M470 590 l8 -30 h8 l8 30Z" fill="#69db7c" stroke="${O}" stroke-width="2.5"/>${txt(415,508,'🧲 🔦 🧪',26)}`);
 const waiting=(()=>{try{return window.Quartz&&Quartz.paused&&Quartz.paused(p);}catch(e){return false;}})();
 s+=hs('elev',560,470,160,216,`<rect x="560" y="476" width="160" height="210" rx="8" fill="#c9a227" stroke="${O}" stroke-width="5"/><rect x="574" y="514" width="64" height="172" fill="#ced4da" stroke="${O}" stroke-width="3"/><rect x="642" y="514" width="64" height="172" fill="#ced4da" stroke="${O}" stroke-width="3"/><path d="M590 530 v140 M690 530 v140" stroke="#fff" stroke-width="5" opacity=".6"/><rect x="598" y="484" width="84" height="24" rx="6" fill="#212529" stroke="${O}" stroke-width="2"/>${txt(640,502,'⬇ Dig Site',14,'#ffd43b')}<circle cx="732" cy="590" r="9" fill="${waiting?'#69db7c':'#ffd43b'}" stroke="${O}" stroke-width="2"/>`);
 s+=hs('qz',724,556,94,130,hImg(window.QUARTZ_SVG||'',724,560,94,116));
 if(pet)s+=hs('pet',826,590,120,96,`<g transform="translate(886 650)"><ellipse rx="54" ry="18" fill="#e599f7" stroke="${O}" stroke-width="3"/><ellipse cy="-6" rx="42" ry="10" fill="#f3d9fa"/><text y="-12" text-anchor="middle" font-size="40">${esc(pet.e||'🐾')}</text></g>`);
 {const mx=(c.maxRow||0);const L=(CD()&&CD().LAYERS)||[];let r=`<rect x="980" y="480" width="210" height="100" rx="6" fill="#fff" stroke="${O}" stroke-width="3"/>`;
  L.slice(0,6).forEach((l,i)=>{r+=`<rect x="990" y="${488+i*14}" width="190" height="11" rx="3" fill="${mx>=l.r0?l.col:'#dee2e6'}"/>`;});
  r+=txt(1085,598,'Dig Map',13)+`<rect x="1030" y="642" width="110" height="42" fill="#a0522d" stroke="${O}" stroke-width="3"/><path d="M1055 642 a30 30 0 0 1 60 0" fill="#e7f5ff" fill-opacity=".7" stroke="${O}" stroke-width="3"/><circle cx="1085" cy="630" r="10" fill="#8a8f98" stroke="${O}" stroke-width="2"/>${txt(1085,634,'❔',11)}`;
  s+=hs('lab',960,470,256,216,r);}
 s+=`<path d="M50 686 H1230" stroke="${O}" stroke-width="6"/>`;
 return `<svg class="lbh-svg" id="lbhSvg" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">${s}</svg>`;}
/* the crystal dome's inside: a shelf of the hero's jars (grown ones look full) and a few glowing crystals; 💧 when a jar can be tended today */
function domeJars(p,cx,base){const O=HO;let g=`<circle cx="${cx}" cy="${base-70}" r="95" fill="#b197fc" opacity=".14"/><rect x="${cx-165}" y="${base-34}" width="330" height="10" rx="4" fill="#c9a27a" stroke="${O}" stroke-width="3"/>`;
 try{if(!window.CG)return g;const s=CG._st(p);['sugar','salt','alum','copper'].forEach((id,i)=>{const j=s.j[id],jar=CG.JARS.find(x=>x.id===id);const k=j?Math.max(.15,j.mm/jar.mm):(s.n[id]?1:.35);g+=`<svg x="${cx-160+i*80}" y="${base-112}" width="76" height="78" viewBox="0 0 120 124">${CG.art(id,k,j&&j.col)}</svg>`;});
  g+=`<path d="M${cx-178} ${base-14} L${cx-170} ${base-56} L${cx-160} ${base-14}Z" fill="#b197fc" stroke="${O}" stroke-width="2.5"/><path d="M${cx+158} ${base-14} L${cx+166} ${base-50} L${cx+174} ${base-14}Z" fill="#74c0fc" stroke="${O}" stroke-width="2.5"/>`;
  if(CG.due(p))g+=`<g transform="translate(${cx+150} ${base-120})"><circle r="16" fill="#fff" stroke="${O}" stroke-width="3"/><text y="6" text-anchor="middle" font-size="17">💧</text></g>`;}catch(e){}
 return g;}
const NAMES={exit:'🚂 Exit to Train',test:'🔬 Test Center',buybat:'🔋 Buy a battery',study:'📓 Study: Journal & Collection',power:'☀️ Power Room',museum:'🏛️ Museum',lab:'💎 Mystery Mineral & Dig Map',gear:'🎒 Gear',elev:'🛗 Elevator to the caves',garden:'💎 Crystal Garden',pet:'🐾 Your pet',qz:'🔬 Dr. Quartz'};
/* the Pet Translator: mostly feelings and praise, about 1 in 3 a hint */
function petLine(p){const pet=petOf(p);if(!pet)return '';const s=Q(p),hints=[],nice=[`I LOVE train rides!`,`You're the best at math. And at belly rubs.`,`This bed is SO comfy. Thank you!`,`I'm proud of you, ${first(p)}!`,`Is it snack time? It feels like snack time.`,`I sniffed every rock in here. They smell like… rocks.`,`Dr. Quartz said I'm a very good lab assistant!`];
 try{const pd=petMood(petData(p,pet.id));if(pd.food<=1)hints.push('Psst… I\'m a little hungry 🍗');else if(pd.joy>=3)nice.push('Thanks for playing with me!');}catch(e){}
 try{const mm=mmState(p);if(mm&&!mm.done)hints.push('Today\'s Mystery Mineral is waiting on the bench!');}catch(e){}
 try{if(window.CG&&CG.due(p))hints.push('A crystal jar up in the dome wants tending! 💧');}catch(e){}
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
 if(id==='exit'){home();return;}
 if(id==='test'){if(window.Quartz&&Quartz.room&&Quartz.room('bench'))return;}
 if(id==='buybat'){if(window.Quartz&&Quartz.room&&Quartz.room('gear'))return;}
 if(id==='garden'&&window.CG){CG.open();return;}
 if(['garden','museum','power','gear'].includes(id)){if(window.Quartz&&Quartz.room&&Quartz.room(id))return;toast('🔬 That room is not ready yet.');return;}}
let PART=1,SOLT=null,RSZ=null;
const tall=()=>innerWidth<innerHeight*.95; /* phone held upright: a third of the building at a time */
function house(){css();const p=P();if(!p){go('world');return;}const app=document.getElementById('app');
 app.innerHTML=`<div class="lbh-full lbh-wrap${tall()?' tall':''}">${houseSVG(p)}<div class="lbh-tip" id="lbhTip" hidden></div>
  <div class="lbf-ui"><span class="lbf-pill">🪙 ${(p.coins||0).toLocaleString()}</span><button class="lbf-pill lbf-btn" onclick="tbMore(this)" aria-label="More">⚙️</button></div>
  ${tall()?`<div class="lbf-arrows"><button class="lbf-btn" onclick="Lab.part(-1)" ${PART?'':'disabled'}>◀</button><button class="lbf-btn" onclick="Lab.part(1)" ${PART>=2?'disabled':''}>▶</button></div>`:''}</div>`;
 const sv=document.getElementById('lbhSvg');if(tall()){sv.setAttribute('viewBox',`${[40,440,840][PART]} 40 400 760`);sv.setAttribute('preserveAspectRatio','xMidYMid slice');}
 app.querySelectorAll('.lbh-hs').forEach(g=>{g.addEventListener('click',()=>tap(g.dataset.id)); /* no hover name bubbles (owner, Oct 2026) */});
 /* swipe between thirds on a tall phone */
 const w=app.querySelector('.lbh-full');let sx=null;w.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});w.addEventListener('touchend',e=>{if(sx==null||!tall())return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>60)part(dx<0?1:-1);},{passive:true});
 /* the live solar meter */
 clearInterval(SOLT);SOLT=setInterval(()=>{const a=document.getElementById('lbSolW'),b=document.getElementById('lbSolWh'),f=document.getElementById('lbBankFill');if(!a){clearInterval(SOLT);return;}
  try{const q=P(),n=Cave.solarNow(q.cave||{});if(!n||!n.lv)return;a.textContent=n.now?`☀️ ${n.now} W in`:'🌙 0 W (night)';b.textContent=`🔋 ${Math.floor(n.wh)} / ${n.max} Wh`;const k=n.max?Math.max(0,Math.min(1,n.wh/n.max)):0;f.setAttribute('y',296+120*(1-k));f.setAttribute('height',120*k);}catch(e){}},3000);
 if(!RSZ){RSZ=()=>{clearTimeout(RSZ.t);RSZ.t=setTimeout(()=>{try{if(typeof curScreen!=='undefined'&&curScreen==='lab'&&VIEW==='house'&&document.querySelector('.lbh-full')&&!document.querySelector('#modal.show'))house();}catch(e){}},250);};window.addEventListener('resize',RSZ);}}
function part(d){PART=Math.max(0,Math.min(2,PART+d));try{SFX.tap();}catch(e){}house();}

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
.lbh-full{position:fixed;inset:0;max-width:none;z-index:3;background:linear-gradient(to bottom,#5bb5f0 0%,#d6efff 85.5%,#69db7c 85.5%,#69db7c 87%,#7a5233 87%)}
.lbh-full .lbh-svg{width:100%;height:100%;max-height:none;border:0;border-radius:0;background:none}.lbh-full .lbf-sky{display:none} /* the screen's own sky shows through, so there is no seam */
.lbf-ui{position:absolute;top:calc(10px + env(safe-area-inset-top));right:12px;display:flex;gap:8px;z-index:4}
.lbf-pill{background:rgba(255,255,255,.94);color:#2b2250;border-radius:999px;padding:8px 14px;font:700 16px Fredoka,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);border:0}
.lbf-btn{cursor:pointer}.lbf-arrows{position:absolute;bottom:calc(14px + env(safe-area-inset-bottom));left:0;right:0;display:flex;justify-content:space-between;padding:0 14px;pointer-events:none;z-index:4}
.lbf-arrows button{pointer-events:auto;width:52px;height:52px;border-radius:50%;border:0;font-size:24px;background:rgba(255,255,255,.94);box-shadow:0 2px 8px rgba(0,0,0,.3)}.lbf-arrows button:disabled{opacity:.35}
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
function home(){const go2=()=>{try{if(window.Train&&Train.arrive)Train.arrive();}catch(e){}try{const p=P();const x=23,y=20;if(typeof W!=='undefined'&&W&&W.T&&W.T[y]&&W.T[y][x]&&!W.T[y][x].block){W.hx=x;W.hy=y;W.drawX=x;W.drawY=y;W.path=[];}if(p)p.wpos={x,y};}catch(e){}try{if(window.Quartz&&Quartz.endPaused&&Quartz.endPaused(P()))return;}catch(e){}go('world');}; /* a paused dig ends when you leave by train */
 if(window.Ride&&Ride.go('home',go2))return;go2();}
window.Lab={part,home,open,back:()=>{VIEW='house';go('lab');},tap,petLine,houseSVG,draw:()=>draw(),tab:t=>{TAB=t;try{SFX.tap();}catch(e){}draw();},card,test,guess,buy,down,ans,_pass:()=>{PASS=true;},SCIQ,keyDue,giveKey,hasKey,KEY_TRIPS,ROCK_PRICE,_mm:mmState,_sync:syncTile};
})();
