/* Dr. Quartz, the science teacher — takes you to the Science Cave.
   There is no door: he comes and finds you on the map.
   • First time: he shows up with a strange rock and asks for your help.
   • After that: bring him a 🪨 MYSTERY ROCK (from treasure chests, wild monsters and bosses) — when you have one, he comes to get you.
   • Deeper cave gates need 🏅 BOSS MEDALS (every boss round you beat in Math Quest = 1 medal).
   Uses Math Quest globals: P(), save(), toast(), go(), curScreen, W, wWalk, dayKey, heroSVG, genQ, pickOp, lvl, ZONES, rpeek, SFX, esc, modal, closeModal. */
(function(){
'use strict';
const NAME='Dr. Quartz',ROCK_MAX=3;
/* how many Boss Medals each cave gate needs */
const GATE_NEED={lever:1,mirror:3,sonar:6,glow:10,pulley:15,seismo:21,core:28};
/* mystery rock drop chances — tuned with a 50-kid, 3-hour simulation: ≈1.2 cave trips per hour of play, ≈25% of play time in the cave, first visit ≈20 min in */
const DROP={chest:.15,wild:.05,win:.01,boss:.30};
const PITY=40; // a rock is guaranteed after 40 battles without one (so nobody gets unlucky for too long)
const FIRST_AFTER=8; // battles before Dr. Quartz first shows up
const SNOOZE_MS=8*60e3;
let DEMO=null,busy=false,mobT=0;
/* 🚪 the game's visitor queue (index.html MQ_VISIT): only one visitor at a time; Dr. Quartz holds the slot while he walks over and while his card is open */
const VQ=()=>{const v=window.MQ_VISIT;return v&&typeof v.claim==='function'?v:null;};
const rel=()=>{try{const v=VQ();if(v)v.release('quartz');}catch(e){}};
const cardUp=()=>!!document.querySelector('#modal.show .qz-card');
/* the after-trip cards finish the visit the kid chose: they never wait behind someone who is only STANDING on the map (Principal Wise, Ozzy driving over) —
   that visitor simply waits until the cards are closed. Anything with a card or scene open (troll, another popup) still goes first. */
const onlyStanding=v=>{try{return ['principal','ozzy'].includes(v.who())&&!document.querySelector('#modal.show')&&!window.trollBusy;}catch(e){return false;}};

/* ---------- art ---------- */
const SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
<ellipse cx="50" cy="116" rx="26" ry="4" fill="rgba(0,0,0,.2)"/>
<path d="M36 84 L34 114 L46 114 L48 84Z M64 84 L66 114 L54 114 L52 84Z" fill="#3b3f5c"/><rect x="31" y="110" width="16" height="6" rx="3" fill="#2b2b2b"/><rect x="53" y="110" width="16" height="6" rx="3" fill="#2b2b2b"/>
<path d="M28 56 Q30 46 50 46 Q70 46 72 56 L76 94 Q50 100 24 94Z" fill="#fff" stroke="#c9d1db" stroke-width="2"/>
<path d="M44 48 L50 70 L56 48Z" fill="#4c9be8"/><path d="M45 50 L50 54 L55 50 L50 57Z" fill="#e8590c"/>
<rect x="60" y="62" width="9" height="11" rx="2" fill="#dbe4ee"/><path d="M62 60 v6 M65 60 v6" stroke="#e03131" stroke-width="2"/>
<path d="M28 58 Q18 72 22 84" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="22" cy="86" r="5" fill="#f1c8a0"/>
<path d="M72 58 Q84 66 82 78" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="82" cy="80" r="5" fill="#f1c8a0"/>
<g transform="translate(86 70)"><circle r="8" fill="#e7f5ff" stroke="#495057" stroke-width="3"/><path d="M5 6 L11 14" stroke="#495057" stroke-width="4" stroke-linecap="round"/></g>
<circle cx="50" cy="32" r="16" fill="#f5d0a9"/>
<path d="M32 30 Q28 14 40 14 Q42 6 52 10 Q62 4 66 14 Q76 16 68 30 Q66 20 58 20 Q50 14 42 20 Q34 20 32 30Z" fill="#f1f3f5" stroke="#ced4da" stroke-width="1.5"/>
<circle cx="43" cy="32" r="6" fill="#e7f5ff" stroke="#343a40" stroke-width="2.2"/><circle cx="57" cy="32" r="6" fill="#e7f5ff" stroke="#343a40" stroke-width="2.2"/><path d="M49 32 h2" stroke="#343a40" stroke-width="2.2"/>
<circle cx="43" cy="33" r="2" fill="#343a40"/><circle cx="57" cy="33" r="2" fill="#343a40"/>
<path d="M44 42 Q50 46 56 42" stroke="#a0522d" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M42 39 Q50 37 58 39" stroke="#dee2e6" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;
let IMG=null;const img=()=>{if(!IMG){IMG=new Image();IMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SVG);}return IMG;};
window.QUARTZ_SVG=SVG;

/* ---------- state ---------- */
function Q(p){p.sci=p.sci||{};const s=p.sci;s.rocks=s.rocks||0;s.trips=s.trips||0;return s;}
function medals(p){let n=0;(typeof ZONES!=='undefined'?ZONES:[]).forEach(z=>{for(let r=1;r<=5;r++){if((rpeek(p,z.id,r)[5]||0)>0)n++;else break;}});return n;}
function dueFirst(p){const s=Q(p);return !s.met&&((p.battles||0)>=FIRST_AFTER||!!s.call);}
/* Parent Corner 'Send a visitor': he comes now. A hero who has met him needs a rock for the trip, so one is added if there is none. */
function bring(p){const s=Q(p);s.snooze=0;if(s.met){if(s.rocks<1)s.rocks=1;}else s.call=1;}
function coming(p){const s=p.sci||{};return Date.now()>(s.snooze||0)&&(s.met?(s.rocks||0)>0:(!!s.call||(p.battles||0)>=FIRST_AFTER));}
function wants(p){const s=Q(p);if(!p||!p.setup)return false;if(DEMO)return true;if(Date.now()<(window.visitorQuiet||0))return false;if(dueFirst(p))return Date.now()>(s.snooze||0);return s.met&&s.rocks>0&&Date.now()>(s.snooze||0);}

/* ---------- mystery rock drops (called from chests, wild wins, battle wins) ---------- */
function drop(kind){try{const p=P();if(!p)return false;const s=Q(p);if(!s.met)return false;if(s.rocks>=ROCK_MAX)return false;
 if(kind!=='chest')s.dry=(s.dry||0)+1;
 if(Math.random()<(DROP[kind]||0)||(kind!=='chest'&&s.dry>=PITY)){s.dry=0;s.rocks++;s.got=(s.got||0)+1;save();return true;}}catch(e){}return false;}
const DROP_HTML='<div>🪨 +1 Mystery Rock!</div>';

/* ---------- Dr. Quartz walks over to you ---------- */
let annAt=0;const ANN_MS=10*60e3; /* announce once per visit, never for a Dr. Quartz who can't reach you */
function spawn(){if(typeof W==='undefined'||!W||!W.T)return;if(W.mobs.some(m=>m.quartz))return;if(document.querySelector('#modal.show'))return;const p=P();
 for(let tries=0;tries<200;tries++){const a=Math.random()*Math.PI*2,d=6+Math.random()*3;const x=Math.round(W.hx+Math.cos(a)*d),y=Math.round(W.hy+Math.sin(a)*d);
  const t=W.T[y]&&W.T[y][x];if(!t||t.block||t.water||t.npc||t.gate||t.chest)continue;if(W.mobs.some(m=>m.x===x&&m.y===y))continue;
  const pth=pathTo(x,y,W.hx,W.hy);if(!pth||!pth.length)continue;
  W.mobs.push({id:'quartz',quartz:true,x,y,fx:x,fy:y,e:'👨‍🔬',n:NAME,b:t.b});
  if(Date.now()-annAt<ANN_MS)return;annAt=Date.now();
  try{SFX.level();}catch(e){}toast(Q(p).met?'🔬 Dr. Quartz is coming to find you — you have a mystery rock!':'🔬 Someone is hurrying over to you… it\'s the science teacher!');return;}}
function pathTo(sx,sy,tx,ty){const key=(x,y)=>x+','+y;const prev={};prev[key(sx,sy)]=null;const q=[[sx,sy]];
 while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(k in prev)continue;
  const t=W.T[ny]&&W.T[ny][nx];if(!(nx===tx&&ny===ty)&&(!t||t.block||t.water||t.npc||t.gate||t.chest))continue;if(window.MQ_GROUND&&MQ_GROUND.blocked&&MQ_GROUND.blocked(W,x,y,nx,ny))continue;prev[k]=[x,y];q.push([nx,ny]);}if(q.length>3000)break;}
 if(!(key(tx,ty) in prev))return null;const out=[];let c=[tx,ty];while(c&&!(c[0]===sx&&c[1]===sy)){out.unshift(c);c=prev[key(c[0],c[1])];}return out;}
function walk(now){const m=W.mobs.find(o=>o.quartz);if(!m)return;
 if(Math.abs(m.x-W.hx)+Math.abs(m.y-W.hy)<=1){if(!W.moving&&!document.querySelector('#modal.show'))meet();return;}
 const path=pathTo(m.x,m.y,W.hx,W.hy);if(!path||!path.length){W.mobs=W.mobs.filter(o=>o!==m);rel();return;}
 const [nx,ny]=path[0];if(nx===W.hx&&ny===W.hy)return;if(W.mobs.some(o=>o!==m&&o.x===nx&&o.y===ny))return;m.fx=m.x;m.fy=m.y;m.x=nx;m.y=ny;m.mt=now;}
function draw(ctx,sx,sy,ts,now){const im=img();ctx.fillStyle='rgba(116,192,252,.35)';ctx.beginPath();ctx.ellipse(sx+ts/2,sy+ts*.9,ts*.5,ts*.16,0,0,7);ctx.fill();
 const hh=ts*1.4,ww=hh*100/120;if(im.complete&&im.naturalWidth)ctx.drawImage(im,sx+ts/2-ww/2,sy+ts*.97-hh+Math.abs(Math.sin(now/120))*2,ww,hh);
 try{wLabel(ctx,'🔬 '+NAME,sx+ts/2,sy-ts*.5,'#fff','rgba(25,113,194,.92)');}catch(e){}}

/* ---------- meeting ---------- */
function meet(){if(busy)return;const p=P();if(!p)return;const s=Q(p);busy=true;W.path=[];W.mobs=W.mobs.filter(m=>!m.quartz);
 {const v=VQ();if(v&&v.claim('quartz',10*60e3))v.watch('quartz',cardUp);} /* his card holds the slot; it's given back once the card closes */
 const first=!s.met;
 const lines=first?[`Oh, hello there! I'm <b>${NAME}</b>, the town's science teacher. 🔬`,
   'I just found this <b>strange rock</b> 🪨 and I can\'t figure out what it is! A clever math hero like you could help me.',
   'My dig site is down in the <b>Science Cave</b> — it goes deep into the real layers of the Earth! Will you come with me?']
  :[DEMO?'This is a preview trip — nothing will be changed.':'',s.key?`${esc(p.name)}! You found a <b>mystery rock</b> 🪨${s.rocks>1?` — actually ${s.rocks} of them`:''}! Want to go dig right now? <small>(You can also use your 🔑 key and ride the lab elevator any time.)</small>`:`${esc(p.name)}! You found a <b>mystery rock</b> 🪨${s.rocks>1?` — actually ${s.rocks} of them`:''}! Let's take it to my lab and find out what it is.`].filter(Boolean);
 let i=0;
 const show=()=>{const last=i>=lines.length-1;
  modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${SVG}</div><div class="qz-bub"><b>🔬 ${NAME}</b><div>${lines[i]}</div></div></div>
   <div class="row">${last?`<button class="btn ghost dark" id="qzNo">${first?'Maybe later':'Not now'}</button><button class="btn green big" id="qzGo">⛏️ Let's go!</button>`:`<button class="btn green big" id="qzNext">Next ➜</button>`}</div></div>`);
  const nx=document.getElementById('qzNext');if(nx)nx.onclick=()=>{i++;show();};
  const go1=document.getElementById('qzGo');if(go1)go1.onclick=()=>{closeModal();busy=false;startTrip(first);};window.visitorQuiet=Date.now()+90e3;
  const no=document.getElementById('qzNo');if(no)no.onclick=()=>{closeModal();busy=false;const tmr=snooze(s);if(first)s.firstNo=(s.firstNo||0)+1;save();
   toast(tmr?'🔬 Dr. Quartz: "No problem! I\'ll come find you tomorrow."'+(s.key?' (Your 🔑 lab elevator works any time.)':''):first?'🔬 Dr. Quartz: "No problem! I\'ll come find you again a little later."':'🔬 Dr. Quartz: "Okay! I\'ll come back for you in a bit."');};};
 try{SFX.level();}catch(e){}show();}

/* "Not now": the first time in a day he comes back in 8 minutes; the second time he waits until tomorrow (no endless re-asking) */
function snooze(s){const d=dayKey();if(s.snzDay!==d){s.snzDay=d;s.snzN=0;}s.snzN=(s.snzN||0)+1;
 if(s.snzN>=2){const t=new Date();t.setHours(24,0,0,0);s.snooze=t.getTime();return true;}s.snooze=Date.now()+SNOOZE_MS;return false;}
/* which mineral is the rock? something from a layer the kid can reach */
function rockMineral(p){const CD=window.CAVE_DATA;if(!CD)return 'quartz';const m=medals(p);
 const open=['soil'];if(m>=1)open.push('sed');if(m>=3)open.push('cave');if(m>=6)open.push('river');if(m>=10)open.push('crystal');if(m>=15)open.push('granite');if(m>=21)open.push('magma');if(m>=28)open.push('mantle');
 const pool=[];Object.keys(CD.MIN).forEach(k=>{const x=CD.MIN[k];if(!x.L.some(l=>open.includes(l)))return;const w=(CD.RAR[x.r]||{w:1}).w;for(let j=0;j<w;j++)pool.push(k);});
 const s=Q(p);const known=(p.cave&&p.cave.idd)||{};const fresh=pool.filter(k=>!known[k]);
 const src=fresh.length&&Math.random()<.7?fresh:pool;return src[Math.floor(Math.random()*src.length)]||'quartz';}

/* ---------- the trip ---------- */
let HOST=null;
/* free: the Lab Key's one free elevator ride a day (lab.js). No rock is spent and there is no rock to identify. */
function startTrip(first,free){const p=P();const s=Q(p);
 if(DEMO===true)DEMO=JSON.stringify({sci:p.sci||null,cave:p.cave||null,coins:p.coins,daily:p.daily,wkHist:p.wkHist||null});
 if(!first&&!free&&s.rocks<=0&&!DEMO){toast('🪨 You need a mystery rock first!');return;}
 if(!first&&!free&&!DEMO)s.rocks--;s.met=true;s.trips++;s.last=dayKey();p.wpos={x:W.hx,y:W.hy};p.cave=p.cave||{};save();
 HOST={first,rock:free?null:rockMineral(p)};go('cave');}
function host(p){const hi=new Image();hi.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(heroSVG(p.look,{spell:p.spell}));
 const tk='cave#'+Math.floor(((Q(p).trips||1)-1)/5); // Sep 2026: the cave keeps your tunnels between trips (kids read a reset as 'progress lost'); a fresh cave every 5 trips
 return {player:{id:p.id,name:p.name,grade:p.grade||3,emoji:'🧑‍🚀',img:hi},state:p.cave,today:()=>tk,shiftIn:()=>{const t=Q(p).trips||1;return 5*Math.ceil(t/5)+1-t;},
  coins:()=>p.coins,addCoins:(n)=>{p.coins+=n;save();},spend:(n)=>{if(p.coins<n)return false;p.coins-=n;save();return true;},
  save:()=>save(),trip:true,noRecharge:true,tripRock:HOST&&HOST.rock,medals:()=>medals(p),gateNeed:id=>GATE_NEED[id]||0,
  guideSVG:SVG,guideImg:img(),
  mathQ:()=>{let q=null,best=null;for(let k=0;k<30;k++){const op=typeof pickOpFair==='function'?pickOpFair(p):pickOp(p,'mix');if(!['add','sub','mul','div'].includes(op))continue;q=genQ(op,Math.max(1,Math.min(8,lvl(p,op)-1)));if(q.tpl||typeof q.answer!=='number')continue;if(!best||String(q.text).length<String(best.text).length)best=q;if(String(q.text).length<=9)break;}q=best||genQ('add',1);return {q:q.text,a:q.answer};}, // quick-fire facts a little below the kid's level — Power Ups should feel snappy
  event:(t,d)=>{if(t==='power'){const dk=dayKey();p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][d&&d.ok?'r':'w']++;if(d&&d.ok&&typeof wkAnswer==='function')wkAnswer(p,5);}},
  exit:()=>tripOver(p)};}
function tripOver(p){const s=Q(p);const first=HOST&&HOST.first;const rock=HOST&&HOST.rock;HOST=null;
 if(DEMO&&DEMO!==true){const d=JSON.parse(DEMO);DEMO=null;p.sci=d.sci||undefined;if(!d.sci)delete p.sci;p.cave=d.cave||undefined;if(!d.cave)delete p.cave;p.coins=d.coins;p.daily=d.daily;if(d.wkHist)p.wkHist=d.wkHist;save();go('world');toast('🔬 That was a preview — nothing was changed.');return;}
 /* every trip ends with a 🎟️ Shrink Ticket for the Inner Space ride (Ozzy picks you up a few battles later) */
 let tix=null,full=false;try{if(window.Inner){tix=Inner.award(p,{rock});full=!tix&&!!(Inner.isFull&&Inner.isFull(p));}}catch(e){}
 const inMet=!!(p.inner&&p.inner.met);
 /* 🔑 Lab Key after the 5th trip (given once; kids who already have it are never offered it again) */
 const keyNow=!first&&window.Lab&&Lab.keyDue(p);
 save();
 /* hold the visitor slot BEFORE going back to the map, so nobody (Principal Wise, Ozzy…) lands on top of the key / thank-you cards */
 const v=VQ(),mine=!v||v.claim('quartz',10*60e3)||onlyStanding(v);go('world');
 const post=()=>{if(v)v.watch('quartz',cardUp);if(keyNow){setTimeout(()=>{if(curScreen!=='world')return;Lab.giveKey(p,()=>after());},700);return;}after();};
 if(!mine){v.wait('quartz',()=>{if(curScreen==='world'&&P()===p&&v.claim('quartz',10*60e3))post();});return;}
 post();
 function after(){
 const card=(html,btn)=>modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${SVG}</div><div class="qz-bub"><b>🔬 ${NAME}</b><div>${html}</div></div></div>
   <div class="row"><button class="btn green big" onclick="closeModal()">${btn}</button></div></div>`);
 /* now and then he mentions the strange thump from far below (the Core Keeper, cave.js); never on the very first trip */
 let hint='';try{hint=(window.Cave&&Cave.coreHint)?Cave.coreHint(p.cave,s.trips):'';}catch(e){}
 if(first||s.trips===1)setTimeout(()=>{if(curScreen!=='world')return;
  const pages=[`Thank you for helping, ${esc(p.name)}! Want to do more science? <b>Bring me a 🪨 mystery rock!</b> You find them in 🎁 treasure chests and from monsters. When you have one, I'll come and find you.`,
   `Every <b>🏅 Boss Medal</b> you win makes my drill stronger, so we can open the deeper gates!`];
  if(tix)pages.push(Inner.ticketLine(p,tix,!inMet));else if(full)pages.push(Inner.fullLine(p));
  let i=0;const show=()=>{const last=i>=pages.length-1;modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${SVG}</div><div class="qz-bub"><b>🔬 ${NAME}</b><div>${pages[i]}</div></div></div>
   <div class="row"><button class="btn green big" id="qzPg">${last?'Deal! 🤝':'Next ➜'}</button></div></div>`);document.getElementById('qzPg').onclick=()=>{if(last){closeModal();window.visitorQuiet=Date.now()+90e3;}else{i++;show();}};};show();},700);
 else if(tix||full||hint)setTimeout(()=>{if(curScreen!=='world')return;
  card(`Great work today, ${esc(p.name)}! ${tix?Inner.ticketLine(p,tix,!inMet):full?Inner.fullLine(p):''}${hint?`${tix||full?'<br><br>':''}🤔 ${hint}`:''}${s.rocks?`<br><br>You still have 🪨 ${s.rocks} mystery rock${s.rocks>1?'s':''} — I'll come back for you soon.`:''}`,tix?'Thanks! 🎟️':hint&&!full?'Hmm! 🤔':'Okay! 👍');},700);
 else toast(`🔬 Dr. Quartz: "Great work today!" ${s.rocks?`You still have 🪨 ${s.rocks} mystery rock${s.rocks>1?'s':''} — I'll come back for you soon.`:'Bring me another 🪨 mystery rock to come back!'}`);}}

/* ---------- backpack panel ---------- */
function bagHTML(p){const s=Q(p);if(!s.met)return '';const c=p.cave||{};const nid=Object.keys(c.idd||{}).length;const tot=window.CAVE_DATA?Object.keys(CAVE_DATA.MIN).length:21;
 const sm=window.Cave?Cave.summary(c):{layer:'Surface'};const m=medals(p);const nxt=Object.entries(GATE_NEED).map(([k,v])=>v).find(v=>v>m);
 return `<div class="tr-hoardbox" style="background:#1864ab"><b>🔬 Science Cave</b> · 🪨 Mystery rocks: <b>${s.rocks}</b>/${ROCK_MAX} · 🏅 Boss Medals: <b>${m}</b>${nxt?` (next gate at ${nxt})`:''} · 💎 Minerals: <b>${nid}</b>/${tot} · 📏 Deepest: <b>${esc(sm.layer)}</b><br><small>Find mystery rocks in treasure chests and from monsters. Dr. Quartz comes to get you when you have one!</small></div>`;}

/* ---------- loops ---------- */
function tick(){try{
 if(typeof curScreen==='undefined'||curScreen!=='world'||typeof W==='undefined'||!W||!W.T||busy||window.trollBusy)return;const p=P();if(!p)return;
 if(!wants(p)){if(W.mobs.some(m=>m.quartz)&&!(Q(p).rocks>0||dueFirst(p)||DEMO)){W.mobs=W.mobs.filter(m=>!m.quartz);rel();}return;}
 if(!W.mobs.some(m=>m.quartz)){if(document.querySelector('#modal.show'))return;
  const v=VQ();if(v&&!v.claim('quartz',30*60e3)){v.wait('quartz',tick);return;} /* another visitor's turn: get in line */
  spawn();if(!W.mobs.some(m=>m.quartz))rel();}
 else walk(performance.now());}catch(e){}}
setInterval(()=>{try{
 // time's up while in the cave (play-time bank) → close the cave cleanly
 if(document.getElementById('cvRoot')&&typeof curScreen!=='undefined'&&curScreen!=='cave'&&window.Cave){Cave.leave();}}catch(e){}
 tick();},450);

if(/quartzdemo/.test(location.search)){const iv=setInterval(()=>{try{const p=P();if(p&&p.setup&&curScreen==='world'){clearInterval(iv);DEMO=true;toast('🔬 Dr. Quartz preview: he\'s on his way…');}}catch(e){}},500);}

/* ---------- the cave screen ---------- */
function openCave(p){Cave.open(host(p));}

/* ---------- styles ---------- */
const st=document.createElement('style');st.textContent=`.qz-row{display:flex;gap:12px;align-items:flex-start;text-align:left}.qz-av{flex:0 0 96px}.qz-av svg{width:96px;height:116px}
.qz-bub{flex:1;background:#e7f5ff;border:3px solid #74c0fc;border-radius:18px;padding:10px 14px;font-size:18px;line-height:1.45;color:#1f2340}.qz-bub>b{display:block;color:#1971c2;font-size:14px;margin-bottom:2px}
@media(max-width:560px){.qz-av{flex-basis:70px}.qz-av svg{width:70px;height:85px}.qz-bub{font-size:16px}}`;document.head.appendChild(st);

window.Quartz={room:(which)=>{const p=P();if(!p||!window.Cave||!Cave.room)return false;p.cave=p.cave||{};const h=host(p);h.exit=()=>{try{if(window.Lab&&Lab.back)Lab.back();else go('lab');}catch(e){}};return Cave.room(h,which);},_bring:bring,_coming:coming,SVG,openCave,meet,drop,DROP_HTML,draw,bagHTML,medals,rockMineral,GATE_NEED,DROP,_Q:Q,_spawn:spawn,_demo:()=>{DEMO=true;},startTrip};
})();
