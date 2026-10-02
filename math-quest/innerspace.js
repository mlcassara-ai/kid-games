/* INNER SPACE — the shrinking ride.
   • Dr. Quartz hands you a 🎟️ SHRINK TICKET at the end of every Science Cave trip.
   • A few battles later, Ride Operator OZZY drives the Atom-Mobile onto the map and comes to pick you up (no door — like Dr. Quartz).
   • The ride: shrink → inside the substance → one molecule → inside an atom → build it → the giant eye → quiz.
   • Quiz points become coins; each ride fills a card in your 📖 Molecule Album (saved with your hero). All 8 cards = the 🥼 Lab Coat robe.
   Text is written for 3 grade bands (K–4, 5–8, 9–12).
   Uses Math Quest globals: P(), save(), toast(), go(), curScreen, W, heroSVG, dayKey, esc, modal, closeModal, tone, SFX, wLabel. */
(function(){
'use strict';
const D=window.IS_DATA;if(!D)return;const EL=D.EL;
const TIX_MAX=3;           // tickets you can hold
const WAIT_BATTLES=3;      // Ozzy waits until you've done a few more battles after the cave (math stays the main game)
const SNOOZE_MS=8*60e3;    // "Not now" → he comes back later
const FIRST_BONUS=25;      // coins for a brand-new album card
const PRIZE_COINS=300;     // album complete bonus (plus the Lab Coat robe)
const MINERAL_RIDE={halite:'salt',gold:'gold',diamond:'diamond'}; // cave minerals that have their own ride
const ORDER=['water','salt','o2','co2','ch4','diamond','gold','glucose'];
const NAME='Ozzy';
let DEMO=null,busy=false,root=null,PL=null,R=null,HERO=null;
const sub=id=>D.SUB.find(s=>s.id===id)||D.SUB[0];

/* ---------- state (lives in the hero's save: p.inner) ---------- */
function S(p){p.inner=p.inner||{};const s=p.inner;s.tix=s.tix||[];s.album=s.album||{};s.rides=s.rides||0;return s;}
function pickRide(p,rock){const s=S(p);const held=s.tix.map(t=>t.id);const free=id=>s.album[id]==null&&!held.includes(id);
 const r=MINERAL_RIDE[rock];if(r&&free(r))return {id:r,rock};
 const nx=ORDER.find(free);if(nx)return {id:nx};
 if(r&&!held.includes(r))return {id:r,rock};
 const low=ORDER.filter(id=>!held.includes(id)).sort((a,b)=>(s.album[a]||0)-(s.album[b]||0))[0];return {id:low||ORDER[0]};}
/* called by Dr. Quartz at the end of a cave trip → returns the ticket (or null if your pocket is full) */
function award(p,o){const s=S(p);if(s.tix.length>=TIX_MAX)return null;const t=Object.assign(pickRide(p,o&&o.rock),{seen:0});s.tix.push(t);s.after=(p.battles||0)+WAIT_BATTLES;s.got=(s.got||0)+1;save();return Object.assign({s:sub(t.id)},t);}
function ticketLine(p,t,first){const sb=t.s,rk=t.rock&&window.CAVE_DATA&&CAVE_DATA.MIN[t.rock];const st=S(p);
 /* the long "who is Ozzy" intro is told once — after that Dr. Quartz just hands over the ticket */
 if(first&&(st.qIntro||st.met||st.hi))first=false;if(first&&!DEMO){st.qIntro=1;save();}
 return first?`And here's something special: a <b>🎟️ Shrink Ticket</b>! My friend <b>${NAME}</b> runs the <b>INNER SPACE</b> ride. It shrinks you down until you're as small as an ATOM! After a few more battles he'll drive over and pick you up. Your ride: <b>${sb.e} ${esc(sb.n)}</b>${rk?` — just like your ${esc(rk.n.toLowerCase())}!`:'.'}`
  :`Here's your <b>🎟️ Shrink Ticket</b>! ${NAME} will pick you up after a few battles for the <b>${sb.e} ${esc(sb.n)}</b> ride${rk?` — that's what your ${esc(rk.n.toLowerCase())} is made of`:''}.`;}
/* ticket pocket full → Dr. Quartz says so instead of silently giving nothing */
function fullLine(p){const n=S(p).tix.length;return `Your 🎟️ ticket pocket is <b>full</b> (${n} of ${TIX_MAX}), so I can't give you a new Shrink Ticket this time. Ride with <b>${NAME}</b> to use one — he'll come and pick you up after a few battles!`;}
function isFull(p){return S(p).tix.length>=TIX_MAX;}
function wants(p,ignoreQuiet){if(!p||!p.setup)return false;if(DEMO)return true;if(!ignoreQuiet&&Date.now()<(window.visitorQuiet||0))return false;const s=S(p);return s.tix.length>0&&(p.battles||0)>=(s.after||0)&&Date.now()>(s.snooze||0);}

/* ---------- sound (uses the game's sound switch) ---------- */
function snd(f,d,type,v,delay){try{tone(f,d,type,(v||.05)*1.6,delay);}catch(e){}}
const whoosh=()=>{for(let i=0;i<10;i++)snd(900-i*70,.18,'triangle',.03,i*.08);};

/* ---------- art ---------- */
const OZ_BODY=`<path d="M-24 -18 Q-24 -32 0 -32 Q24 -32 24 -18Z" fill="#fcc419"/><path d="M-6 -30 L0 -22 L6 -30Z" fill="#e8590c"/>
<circle cx="0" cy="-46" r="15" fill="#f1c8a0"/><circle cx="-5" cy="-46" r="2.2" fill="#2b2140"/><circle cx="5" cy="-46" r="2.2" fill="#2b2140"/><path d="M-6 -40 Q0 -35 6 -40" stroke="#a0522d" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M-16 -50 Q-16 -66 0 -66 Q16 -66 16 -50Z" fill="#ae3ec9"/><path d="M12 -52 L28 -50 L14 -47Z" fill="#862e9c"/><circle cx="-6" cy="-58" r="4.5" fill="#99e9f2" stroke="#495057" stroke-width="2"/><circle cx="6" cy="-58" r="4.5" fill="#99e9f2" stroke="#495057" stroke-width="2"/>`;
const CAR_SHAPE=`<ellipse cx="0" cy="38" rx="64" ry="7" fill="rgba(0,0,0,.22)"/>
<path d="M0 -74 V-86" stroke="#b197fc" stroke-width="3"/><g transform="translate(0 -90)"><circle r="3.5" fill="#ffd43b"/><ellipse rx="10" ry="4" fill="none" stroke="#ffd43b" stroke-width="1.6"/><ellipse rx="10" ry="4" fill="none" stroke="#ffd43b" stroke-width="1.6" transform="rotate(60)"/><ellipse rx="10" ry="4" fill="none" stroke="#ffd43b" stroke-width="1.6" transform="rotate(-60)"/></g>`;
const CAR_FRONT=`<path d="M-50 -24 Q-44 -70 0 -74 Q44 -70 50 -24Z" fill="rgba(180,230,255,.38)" stroke="#9fd8ff" stroke-width="3"/><path d="M-36 -40 Q-30 -62 -8 -66" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>
<path d="M-66 10 Q-70 -20 -40 -26 L40 -26 Q70 -20 66 10 Q60 34 0 34 Q-60 34 -66 10Z" fill="#7048e8" stroke="#3b1f9e" stroke-width="4"/>
<circle cx="-48" cy="2" r="7" fill="#ffd43b"/><circle cx="48" cy="2" r="7" fill="#ffd43b"/>`;
const OZZY_CAR=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -100 144 146">${CAR_SHAPE}<g transform="translate(0 4)">${OZ_BODY}</g>${CAR_FRONT}</svg>`;
const OZZY_HEAD=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -70 60 60">${OZ_BODY}</svg>`;
let OIMG=null;const oimg=()=>{if(!OIMG){OIMG=new Image();OIMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(OZZY_CAR);}return OIMG;};
window.OZZY_SVG=OZZY_CAR;

/* ---------- Ozzy drives over to you on the map ---------- */
const MOD={draw:drawMob,meet};
/* 🚪 the game's visitor queue (index.html MQ_VISIT): one visitor at a time. Ozzy holds the slot while he drives over, while his card is open, and for his goodbye */
const VQ=()=>{const v=window.MQ_VISIT;return v&&typeof v.claim==='function'?v:null;};
const rel=()=>{try{const v=VQ();if(v)v.release('ozzy');}catch(e){}};
const cardUp=()=>!!document.querySelector('#modal.show .oz-bub');
const onlyStanding=v=>{try{return ['principal','quartz'].includes(v.who())&&!document.querySelector('#modal.show')&&!window.trollBusy;}catch(e){return false;}}; /* the goodbye finishes the ride the kid chose: it doesn't wait behind someone only standing on the map */
const byeUp=()=>cardUp()||!!(typeof W!=='undefined'&&W&&W.mobs&&W.mobs.some(m=>m.byeOzzy));
/* he only announces himself once per visit, and only from a spot he can really drive from — no "Ozzy is coming" toasts for an Ozzy who never shows up */
let annAt=0;const ANN_MS=10*60e3;
function spawn(){if(typeof W==='undefined'||!W||!W.T)return;if(W.mobs.some(m=>m.ozzy||m.quartz))return;if(document.querySelector('#modal.show'))return;const p=P();
 for(let tries=0;tries<200;tries++){const a=Math.random()*Math.PI*2,d=7+Math.random()*3;const x=Math.round(W.hx+Math.cos(a)*d),y=Math.round(W.hy+Math.sin(a)*d);
  const t=W.T[y]&&W.T[y][x];if(!t||t.block||t.water||t.npc||t.gate||t.chest)continue;if(W.mobs.some(m=>m.x===x&&m.y===y))continue;
  const path=pathTo(x,y,W.hx,W.hy);if(!path||!path.length)continue;
  W.mobs.push({id:'ozzy',ozzy:true,mod:MOD,x,y,fx:x,fy:y,e:'🚗',n:NAME,b:t.b});
  if(Date.now()-annAt>ANN_MS){annAt=Date.now();snd(660,.12,'square',.04);snd(660,.12,'square',.04,.2);
   toast(S(p).met||S(p).hi?`🎢 Beep beep! ${NAME} is driving over — you have a Shrink Ticket!`:'🎢 Beep beep! A funny little car is driving toward you…');}
  return;}}
function pathTo(sx,sy,tx,ty){const key=(x,y)=>x+','+y;const prev={};prev[key(sx,sy)]=null;const q=[[sx,sy]];
 while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(k in prev)continue;
  const t=W.T[ny]&&W.T[ny][nx];if(!(nx===tx&&ny===ty)&&(!t||t.block||t.water||t.npc||t.gate||t.chest))continue;prev[k]=[x,y];q.push([nx,ny]);}if(q.length>3000)break;}
 if(!(key(tx,ty) in prev))return null;const out=[];let c=[tx,ty];while(c&&!(c[0]===sx&&c[1]===sy)){out.unshift(c);c=prev[key(c[0],c[1])];}return out;}
function walk(now){const m=W.mobs.find(o=>o.ozzy);if(!m)return;
 if(Math.abs(m.x-W.hx)+Math.abs(m.y-W.hy)<=1){if(!W.moving&&!document.querySelector('#modal.show'))meet();return;}
 const path=pathTo(m.x,m.y,W.hx,W.hy);if(!path||!path.length){W.mobs=W.mobs.filter(o=>o!==m);rel();return;}
 const [nx,ny]=path[0];if(nx===W.hx&&ny===W.hy)return;if(W.mobs.some(o=>o!==m&&o.x===nx&&o.y===ny))return;m.fx=m.x;m.fy=m.y;m.x=nx;m.y=ny;m.mt=now;}
function drawMob(ctx,sx,sy,ts,now){const im=oimg();ctx.fillStyle='rgba(177,151,252,.35)';ctx.beginPath();ctx.ellipse(sx+ts/2,sy+ts*.92,ts*.62,ts*.16,0,0,7);ctx.fill();
 const ww=ts*1.5,hh=ww*146/144;if(im.complete&&im.naturalWidth)ctx.drawImage(im,sx+ts/2-ww/2,sy+ts*1.02-hh+Math.abs(Math.sin(now/90))*1.5,ww,hh);
 try{wLabel(ctx,'🎢 '+NAME,sx+ts/2,sy-ts*.55,'#fff','rgba(112,72,232,.92)');}catch(e){}}

/* ---------- meeting Ozzy ---------- */
function meet(){if(busy)return;const p=P();if(!p)return;const s=S(p);busy=true;W.path=[];W.mobs=W.mobs.filter(m=>!m.ozzy);
 {const v=VQ();if(v&&v.claim('ozzy',10*60e3))v.watch('ozzy',cardUp);} /* his card holds the visitor slot until it closes */
 const first=!s.met&&!s.hi;let t=s.tix[0];const again=!!t&&!t.demo&&(t.seen==null||t.seen>=1); /* this ticket was offered before (older tickets have no count) */
 if(DEMO){const want=(location.search.match(/innerdemo=(\w+)/)||[])[1];t={id:D.SUB.some(x=>x.id===want)?want:(ORDER.find(id=>s.album[id]==null)||'water'),demo:true};}
 if(!t){busy=false;return;}const sb=sub(t.id);
 const lines=(first?[`Beep beep! 🚗 Hi, I'm <b>${NAME}</b>! I drive the <b>Atom-Mobile</b> on the <b>INNER SPACE</b> ride.`,
   `Dr. Quartz told me you earned a <b>🎟️ Shrink Ticket</b>! My ride shrinks you smaller than an ant… smaller than a germ… all the way down to the size of an <b>ATOM</b>! ⚛️`,
   `Today we're riding into <b>${sb.e} ${esc(sb.n)}</b>. Hop in, ${esc(p.name)}!`]
  :resumeAt(t)?[`${hiAgain(p,s)} 🎢 Last time we rode into <b>${sb.e} ${esc(sb.n)}</b> and got as far as <b>${STAGE[SCENES[t.at]]}</b>, but we didn't finish.`,
   `Do you want to <b>pick up where we left off</b>${alt(p,t)?`, or try a <b>brand-new ride</b> to <b>${sub(alt(p,t)).e} ${esc(sub(alt(p,t)).n)}</b>`:''}? Your choice!`]
  :again&&alt(p,t)?[`${hiAgain(p,s)} 🎢 Your ticket is for <b>${sb.e} ${esc(sb.n)}</b>, but we haven't ridden it yet.`,
   `Want to ride into <b>${sb.e} ${esc(sb.n)}</b> today, or try something new: <b>${sub(alt(p,t)).e} ${esc(sub(alt(p,t)).n)}</b>? Your choice!`]
  :[`${hiAgain(p,s)} 🎟️ Today we're shrinking into <b>${sb.e} ${esc(sb.n)}</b>!${s.tix.length>1?` (You have ${s.tix.length} tickets.)`:''} Hop in!`]);
 const two=!DEMO&&!first&&(resumeAt(t)||again)&&alt(p,t);if(!DEMO){t.seen=(t.seen||0)+1;if(first)s.hi=1;save();}
 if(DEMO)lines.unshift('This is a preview ride — nothing will be changed.');
 let i=0;
 const show=()=>{const last=i>=lines.length-1;
  modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av oz-av">${OZZY_CAR}</div><div class="qz-bub oz-bub"><b>🎢 ${NAME} · Ride Operator</b><div>${lines[i]}</div></div></div>
   <div class="row">${last?`<button class="btn ghost dark" id="ozNo">Not now</button>${two?`<button class="btn gold big" id="ozNew">🆕 New ride: ${sub(two).e} ${esc(sub(two).n)}</button>`:''}<button class="btn green big" id="ozGo">${resumeAt(t)&&!DEMO?`▶ Finish ${sb.e} ${esc(sb.n)}`:two?`🎢 Ride ${sb.e} ${esc(sb.n)}`:'🎢 Hop in!'}</button>`:`<button class="btn green big" id="ozNext">Next ➜</button>`}</div></div>`);
  const nw=document.getElementById('ozNew');if(nw)nw.onclick=()=>{closeModal();busy=false;t.id=two;t.at=0;t.seen=1;delete t.rock;save();startRide(t);};
  const nx=document.getElementById('ozNext');if(nx)nx.onclick=()=>{i++;show();};
  const go1=document.getElementById('ozGo');if(go1)go1.onclick=()=>{closeModal();busy=false;startRide(t,!DEMO&&resumeAt(t));};window.visitorQuiet=Date.now()+90e3;
  const no=document.getElementById('ozNo');if(no)no.onclick=()=>{closeModal();busy=false;if(DEMO===true)DEMO=null;else later(p);toast(`🎢 ${NAME}: "No problem! I'll come back ${S(p).decl>=2?'tomorrow':'after a few more battles'}."`);};};
 try{SFX.level();}catch(e){}show();}
/* the hello always comes first, then the ticket talk */
function hiAgain(p,s){return [`Beep beep! Hi again, ${esc(p.name)}!`,`There you are, ${esc(p.name)}!`,`Hello again, ${esc(p.name)}!`][(s.rides||0)%3];}
/* a ride that was left partway keeps its place (t.at), so the kid can finish it or swap to a new molecule */
const STAGE={inside:'the zoom-in',mol:'the molecule',atom:'inside the atom',alarm:'the shrink-ray alarm',atoms:'the atom workshop',build:'the Molecule Builder',eye:'the giant eye',quiz:'the quiz'};
const resumeAt=t=>t&&!t.demo&&t.at>=2&&t.at<SCENES.length?t.at:0;
function alt(p,t){const s=S(p);const held=s.tix.map(x=>x.id);const ok=id=>id!==t.id&&!held.includes(id);
 return ORDER.find(id=>ok(id)&&s.album[id]==null)||ORDER.filter(ok).sort((a,b)=>(s.album[a]||0)-(s.album[b]||0))[0]||null;}
function startRide(t,resume){const p=P();const s=S(p);
 if(DEMO===true)DEMO=JSON.stringify({inner:p.inner||null,coins:p.coins,robes:(p.owned.robes||[]).slice()});
 if(!DEMO){s.met=true;}p.wpos={x:W.hx,y:W.hy};save();
 R={t,s:sub(t.id),start:resume||0};go('inner');}

/* ---------- the ride screen ---------- */
function open(p){PL=p;if(!R){const s=S(p);if(!s.tix.length&&!DEMO){go('world');return;}R={t:s.tix[0]||{id:'water'},s:sub((s.tix[0]||{id:'water'}).id)};}
 HERO=new Image();HERO.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(heroSVG(p.look,{head:true}));
 if(root)root.remove();root=document.createElement('div');root.id='isRoot';document.body.appendChild(root);
 R.i=R.start||0;R.pts=0;if(R.i)toast(`🎢 Picking up where you left off!`);scene();}
function close(){stopAnim();if(root)root.remove();root=null;}
/* "Not now", leaving the ride, or the ride getting interrupted → Ozzy waits for a few more battles AND at least 20 minutes; the second time in a day he waits until tomorrow */
function later(p){if(!p||DEMO)return;const s=S(p);const d=typeof dayKey==='function'?dayKey():'';if(s.declDay!==d){s.declDay=d;s.decl=0;}s.decl=(s.decl||0)+1;
 s.after=(p.battles||0)+WAIT_BATTLES;const t=new Date();t.setHours(24,0,0,0);s.snooze=s.decl>=2?t.getTime():Date.now()+20*60e3;save();}
function exit(){if(R&&!R.finished&&R.score!=null&&!DEMO)commit(R.score);const fin=!!(R&&R.finished);close();const p=PL||P();if(!fin)later(p);R=null;PL=null;
 if(fin){const v=VQ(); /* the goodbye is a visit too: hold the slot before going back to the map */
  if(!v||v.claim('ozzy',10*60e3)||onlyStanding(v)){if(v)v.watch('ozzy',byeUp);setTimeout(()=>farewell(p),700);}
  else v.wait('ozzy',()=>{if(typeof curScreen!=='undefined'&&curScreen==='world'&&P()===p&&v.claim('ozzy',10*60e3)){v.watch('ozzy',byeUp);farewell(p);}});}
 if(DEMO&&DEMO!==true){const d=JSON.parse(DEMO);DEMO=null;if(d.inner)p.inner=d.inner;else delete p.inner;p.coins=d.coins;p.owned.robes=d.robes;save();go('world');toast('🎢 That was a preview — nothing was changed.');return;}
 save();go('world');}
const tier=()=>{const g=(PL&&PL.grade)||3;return g<=4?0:g<=8?1:2;};
const NM=()=>esc((PL&&PL.name)||'Explorer');

/* ---------- drawing helpers ---------- */
let raf=0,anim=null;function stopAnim(){cancelAnimationFrame(raf);anim=null;}
function loop(fn){stopAnim();anim=fn;const t0=performance.now();const step=now=>{if(anim!==fn)return;try{fn(Math.max(0,(now-t0)/1000));}catch(e){console.warn(e);}raf=requestAnimationFrame(step);};raf=requestAnimationFrame(step);}
function canvas(){const cv=document.createElement('canvas');cv.className='is-cv';const fit=()=>{if(!cv.isConnected){window.removeEventListener('resize',fit);return;}const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=cv.clientWidth*dpr;cv.height=cv.clientHeight*dpr;cv.getContext('2d').setTransform(dpr,0,0,dpr,0,0);};setTimeout(fit,0);window.addEventListener('resize',fit);return cv;}
function ball(c,el,x,y,r){const E=EL[el];const g=c.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.25,E.col);g.addColorStop(1,shade(E.col,-.35));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
function shade(hex,a){let n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;const f=a<0?0:255,p=Math.abs(a);return `rgb(${Math.round((f-r)*p+r)},${Math.round((f-g)*p+g)},${Math.round((f-b)*p+b)})`;}
function drawMol(c,lay,cx,cy,s,rot,labels){const L=D.L[lay];const cs=Math.cos(rot||0),sn=Math.sin(rot||0);const P2=L.a.map(([e,x,y])=>[e,cx+(x*cs-y*sn)*s,cy+(x*sn+y*cs)*s]);
 L.b.forEach(([i,j,o])=>{const [,x1,y1]=P2[i],[,x2,y2]=P2[j];c.strokeStyle='#ced4da';c.lineWidth=Math.max(2,s*.12);if(o===0){c.setLineDash([s*.12,s*.12]);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);return;}
  if(o===1){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}else{const dx=y2-y1,dy=x1-x2,l=Math.hypot(dx,dy)||1,k=s*.1;[-1,1].forEach(q=>{c.beginPath();c.moveTo(x1+dx/l*k*q,y1+dy/l*k*q);c.lineTo(x2+dx/l*k*q,y2+dy/l*k*q);c.stroke();});}});
 P2.forEach(([e,x,y])=>{const r=EL[e].r*s*.42;ball(c,e,x,y,r);if(labels){c.fillStyle=EL[e].txt;c.font=`800 ${Math.max(10,r*.9)}px Fredoka,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(e,x,y+1);}});}
/* draw a whole molecule so it fits a w×h box (album card) */
function fitMol(c,lay,w,h){const L=D.L[lay];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;L.a.forEach(([e,x,y])=>{const r=EL[e].r*.42;x0=Math.min(x0,x-r);x1=Math.max(x1,x+r);y0=Math.min(y0,y-r);y1=Math.max(y1,y+r);});
 const sc=Math.min((w-16)/(x1-x0),(h-12)/(y1-y0),70);drawMol(c,lay,w/2-(x0+x1)/2*sc,h/2-(y0+y1)/2*sc,sc,0,true);}
/* the Atom-Mobile with YOUR hero inside */
/* The Atom-Mobile seen from BEHIND while it flies into the scenery: solid rear shield, red tail lights, 'SHRINK' plate.
   Drawn once into a picture (fast), plus a soft engine glow that pulses. */
let REAR=null;
function rearSprite(){if(REAR)return REAR;const K=3,cv=document.createElement('canvas');cv.width=160*K;cv.height=130*K;const c=cv.getContext('2d');c.scale(K,K);c.translate(80,82);
 // rear shield (dome) — solid, metallic
 let g=c.createLinearGradient(-50,-74,50,-24);g.addColorStop(0,'#c5c9d6');g.addColorStop(.5,'#8f95a8');g.addColorStop(1,'#5c6275');c.fillStyle=g;c.strokeStyle='#3b3f4f';c.lineWidth=3;
 c.beginPath();c.moveTo(-50,-24);c.quadraticCurveTo(-44,-70,0,-74);c.quadraticCurveTo(44,-70,50,-24);c.closePath();c.fill();c.stroke();
 c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-34,-40);c.quadraticCurveTo(-28,-60,-8,-64);c.stroke();
 c.strokeStyle='#4a4f60';c.lineWidth=2;c.beginPath();c.moveTo(-47,-36);c.quadraticCurveTo(0,-46,47,-36);c.stroke();                 // panel seam
 c.fillStyle='#2b2f3a';[-38,-19,0,19,38].forEach(q=>{c.beginPath();c.arc(q,-37-(q===0?4:Math.abs(q)<20?3:0),1.8,0,7);c.fill();});   // rivets
 c.fillStyle='#1d2130';c.strokeStyle='#adb5bd';c.lineWidth=2.5;c.beginPath();c.arc(0,-56,8,0,7);c.fill();c.stroke();                // little porthole
 c.fillStyle='rgba(159,216,255,.5)';c.beginPath();c.arc(-2,-58,3,0,7);c.fill();
 // body
 g=c.createLinearGradient(0,-26,0,34);g.addColorStop(0,'#845ef7');g.addColorStop(1,'#5f3dc4');c.fillStyle=g;c.strokeStyle='#3b1f9e';c.lineWidth=4;
 c.beginPath();c.moveTo(-66,10);c.quadraticCurveTo(-70,-20,-40,-26);c.lineTo(40,-26);c.quadraticCurveTo(70,-20,66,10);c.quadraticCurveTo(60,34,0,34);c.quadraticCurveTo(-60,34,-66,10);c.closePath();c.fill();c.stroke();
 // red tail lights with a glow
 [-1,1].forEach(sd=>{c.save();c.shadowColor='#ff2d2d';c.shadowBlur=14;c.fillStyle='#ff3b3b';c.strokeStyle='#8a0f0f';c.lineWidth=2.5;c.beginPath();
  if(c.roundRect)c.roundRect(sd*52-11,-8,22,15,6);else c.rect(sd*52-11,-8,22,15);c.fill();c.stroke();c.restore();
  c.fillStyle='rgba(255,220,220,.8)';c.beginPath();c.ellipse(sd*52-3,-4,4,2,0,0,7);c.fill();});
 // licence plate
 c.fillStyle='#fff9db';c.strokeStyle='#343a40';c.lineWidth=2;c.beginPath();if(c.roundRect)c.roundRect(-24,5,48,17,3);else c.rect(-24,5,48,17);c.fill();c.stroke();
 c.fillStyle='#1c1c1c';c.font='800 12px Fredoka,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('SHRINK',0,14);
 return REAR={cv,K};}
function car(c,x,y,sz,sec){const sp=rearSprite(),s=sz/140;c.save();c.translate(x,y);c.scale(s,s);
 const p=.55+.25*Math.sin((sec||performance.now()/1000)*4);const g=c.createRadialGradient(0,40,2,0,40,46);g.addColorStop(0,`rgba(177,151,252,${p})`);g.addColorStop(1,'rgba(177,151,252,0)');c.fillStyle=g;c.beginPath();c.ellipse(0,40,48,16,0,0,7);c.fill();   // engine glow
 c.drawImage(sp.cv,-80,-82,160,130);c.restore();}
function heroTag(x,y,w){return HERO?`<image href="${HERO.src}" x="${x}" y="${y}" width="${w}" height="${w*66/56}"/>`:`<text x="${x+w/2}" y="${y+w*.8}" font-size="${w*.8}" text-anchor="middle">🧒</text>`;}
function nar(html,btn,opts){opts=opts||{};return `<div class="is-nar"><div class="who">${opts.who||OZZY_HEAD}</div><div class="txt"><small>${opts.name||'Ride Operator '+NAME}</small>${html}</div>${btn?`<button class="is-btn ${opts.cls||''}" id="isNext" ${opts.dis?'disabled':''}>${btn}</button>`:''}</div>`;}

/* ---------- ride flow ---------- */
const SCENES=['board','shrink','inside','mol','atom','alarm','atoms','build','eye','quiz'];
function frame(inner){if(!root)return;const done=R.i;const fade=R.fresh;R.fresh=false;root.innerHTML=`<div class="is-stage${fade?' is-fadein':''}">${inner}<div class="is-top"><span class="is-chip">${R.s.e}<span class="cn"> ${esc(R.s.n)}</span></span>${sizeBar()}<button class="is-x" id="isX" aria-label="Leave the ride">✕</button></div></div>`;
 root.querySelector('#isX').onclick=R.finished?exit:askLeave;}
function askLeave(){if(!root||root.querySelector('.is-leave'))return;const d=document.createElement('div');d.className='is-leave';
 d.innerHTML=`<div class="is-lbox">${OZZY_HEAD}<div><b>Leave the ride?</b><br>You keep your 🎟️ ticket and your place. Next time ${NAME} comes, you can finish this ride or pick a new one.</div><div class="is-lrow"><button class="is-btn green" id="isStay">🎢 Keep riding</button><button class="is-btn" id="isLeave">Leave</button></div></div>`;
 root.appendChild(d);d.querySelector('#isStay').onclick=()=>d.remove();d.querySelector('#isLeave').onclick=()=>{exit();};}
function next(){R.i++;scene();}
function onNext(fn){const b=root&&root.querySelector('#isNext');if(b)b.onclick=fn||next;}
function scene(){stopAnim();if(!root)return;try{if(!DEMO&&R.t&&!R.t.demo&&R.i>=2&&R.i<SCENES.length){const tk=S(PL||P()).tix.find(x=>x.id===R.t.id);if(tk&&(tk.at||0)<R.i){tk.at=R.i;save();}}}catch(e){}R.sz={board:0,shrink:0,inside:6,mol:7,atom:9,alarm:9,atoms:9,build:8,eye:8,quiz:8}[SCENES[R.i]];R.fresh=true;({board,shrink,inside,mol,atom,alarm,atoms,build,eye,quiz})[SCENES[R.i]]();}
const stage=()=>root.querySelector('.is-stage');

/* 1. boarding */
const OBJ={glass:'🥛',salt:'🧂',air:'🌬️',soda:'🥤',stove:'🔥',candy:'🍬',ring:'💍'};
function board(){const s=R.s,t=tier();const rk=R.t.rock&&window.CAVE_DATA&&CAVE_DATA.MIN[R.t.rock];
 const tall=window.innerWidth<window.innerHeight*.9; // phone held upright → show the whole scene instead of cropping it
 frame(`<svg class="is-svg${tall?' is-tall':''}" viewBox="${tall?'40 60 924 470':'0 0 960 600'}" preserveAspectRatio="xMidYMid meet"><rect x="-600" y="-900" width="2160" height="2400" fill="#2b1d5c"/>
 ${Array.from({length:40},(_,i)=>`<circle cx="${(i*97)%960}" cy="${(i*53)%300}" r="${1+i%3*.6}" fill="#fff" opacity=".6"/>`).join('')}
 <rect x="-600" y="430" width="2160" height="470" fill="#3d2b7a"/><path d="M-600 470 H1560" stroke="#ffd43b" stroke-width="6" stroke-dasharray="30 20"/>
 <text x="480" y="90" font-size="50" font-weight="700" fill="#ffd43b" text-anchor="middle" stroke="#7048e8" stroke-width="2">✨ INNER SPACE ✨</text>
 <defs><radialGradient id="isCaveG" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#b197fc"/><stop offset=".45" stop-color="#5f3dc4"/><stop offset="1" stop-color="#140a2e"/></radialGradient></defs>
 <path d="M592 474 Q606 306 690 258 Q752 224 816 250 Q892 292 902 474Z" fill="#5c4a3d" stroke="#3b2f25" stroke-width="5"/>
 <path d="M626 474 Q636 356 700 306" stroke="#6f5b4b" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/><path d="M870 474 Q878 366 830 296" stroke="#4a3b30" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/>
 <path d="M672 474 Q672 350 746 342 Q820 350 820 474Z" fill="url(#isCaveG)" stroke="#2b1d5c" stroke-width="6"/>
 ${[0,1,2].map(i=>`<ellipse cx="746" cy="440" rx="${22+i*18}" ry="${14+i*12}" fill="none" stroke="#d0bfff" stroke-width="2" opacity=".5"><animate attributeName="opacity" values=".15;.5;.15" dur="6s" begin="${i*2}s" repeatCount="indefinite"/></ellipse>`).join('')}
 <g transform="translate(746 190)"><rect x="-6" y="30" width="12" height="46" fill="#8d5a2b"/><rect x="-128" y="-42" width="256" height="80" rx="14" fill="#fff4e6" stroke="#8d5a2b" stroke-width="6"/><text x="0" y="-14" font-size="17" font-weight="800" fill="#8d5a2b" text-anchor="middle" letter-spacing="2">THIS ADVENTURE</text><text x="0" y="22" font-size="28" font-weight="800" fill="#5f3dc4" text-anchor="middle">${s.e} ${esc(s.n)}</text></g>
 ${[0,1,2].map(i=>`<path d="M${572+i*26} 458 l14 12 l-14 12" stroke="#ffd43b" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"><animate attributeName="opacity" values=".3;1;.3" dur="3s" begin="${i*.5}s" repeatCount="indefinite"/></path>`).join('')}
 <g transform="translate(330 452) scale(.9)">${OZ_BODY}<path d="M-24 -18 L-22 30 L22 30 L24 -18Z" fill="#ae3ec9"/><path d="M-10 30 V52 M10 30 V52" stroke="#343a40" stroke-width="8" stroke-linecap="round"/><path d="M22 -12 Q40 -30 46 -46" stroke="#ae3ec9" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="46" cy="-48" r="6" fill="#f1c8a0"/></g>
 <g id="isCarGo" class="is-cargo"><g transform="translate(470 440)"><ellipse cx="0" cy="38" rx="70" ry="10" fill="rgba(0,0,0,.25)"/><path d="M-78 -2 h-28 M-80 12 h-40 M-76 26 h-24" stroke="#b197fc" stroke-width="4" stroke-linecap="round" opacity=".6"/>${heroTag(-24,-76,48)}<path d="M-50 -24 Q-44 -70 0 -74 Q44 -70 50 -24Z" fill="rgba(180,230,255,.38)" stroke="#9fd8ff" stroke-width="3"/><path d="M-66 10 Q-70 -20 -40 -26 L40 -26 Q70 -20 66 10 Q60 34 0 34 Q-60 34 -66 10Z" fill="#7048e8" stroke="#3b1f9e" stroke-width="4"/><circle cx="-48" cy="2" r="7" fill="#ffd43b"/><circle cx="48" cy="2" r="7" fill="#ffd43b"/></g></g></svg><div class="is-black" id="isBlack"></div>
 ${nar(`Welcome aboard, <b>${NM()}</b>! Keep your hands inside the Atom-Mobile. ${rk?`Dr. Quartz says your mystery rock was <b>${esc(rk.n.toLowerCase())}</b> — let's see what it's made of! `:''}${esc(s.intro[t])}`,'🎢 Start the ride!',{cls:'gold'})}`);
 onNext(()=>{const b=root.querySelector('#isNext');if(b){b.disabled=true;b.textContent='Here we go… 🎢';}whoosh();
  const car=root.querySelector('#isCarGo');if(car)car.classList.add('go');
  setTimeout(()=>{const k=root&&root.querySelector('#isBlack');if(k)k.classList.add('on');},3500);setTimeout(()=>{if(root)next();},4500);});}

/* 2. shrinking: a slow ride past real-world size markers, with a stop (and a chat) at each one */
const SIZES=[{e:'🧒',n:'Your normal size',sz:'about 1.5 m'},{e:'🐜',n:'As small as an ant',sz:'3 mm'},{e:'〰️',n:'Smaller than a hair is wide',sz:'0.08 mm'},{e:'CELL',n:'As small as one cell',sz:'0.01 mm'},{e:'🦠',n:'As small as a germ',sz:'0.002 mm'},{e:'VIRUS',n:'As small as a virus',sz:'0.0001 mm'},
 {e:'🫧',n:'Among the molecules',sz:'0.000 01 mm'},{e:'MOL',n:'As small as one molecule',sz:'0.000 000 3 mm'},{e:'⚛️',n:'As small as one atom',sz:'0.000 000 1 mm'},{e:'✨',n:'Inside an atom!',sz:'0.000 000 000 001 mm'}];
const STOPS=[null,
 ['We\'re as small as an <b>ANT</b>! 🐜 Hi there, ant! To us it looks as big as a <b>house</b> now!','Ant-sized: about <b>3 millimeters</b>. A single grain of sand would look like a boulder!','About <b>3 mm</b>: we\'ve shrunk roughly 500 times. Sand grains are boulders now.'],
 ['Whoa! That brown log is ONE <b>HAIR</b>! From down here it looks as thick as a tree trunk. 🌳','A human hair is only about <b>0.08 mm</b> wide. We\'re smaller than that now, so it looks like a giant log!','A hair is about <b>80 micrometers</b> wide. See the overlapping scales on it? They\'re called the cuticle.'],
 ['Now we\'re as small as one <b>CELL</b>! Your whole body is built from tiny cells like this one.','One cell is about <b>0.01 mm</b>. You are made of about <b>30 trillion</b> of them!','A typical cell is about <b>10 micrometers</b>. The dark blob in the middle is the <b>nucleus</b>, the cell\'s control center.'],
 ['Wiggly <b>GERMS</b>! These are bacteria. 🦠 Most are harmless, and some even help your tummy digest food.','Bacteria are about <b>0.002 mm</b> long, about 5 times smaller than a cell. See their little tails? They swim with them!','Bacteria are about <b>2 micrometers</b> long. Those whip-like tails are called <b>flagella</b>.'],
 ['Even smaller: a <b>VIRUS</b>! It\'s so tiny that a normal microscope can\'t even see it.','Viruses are about <b>0.0001 mm</b> across. Scientists need an <b>electron microscope</b> to see one!','About <b>100 nanometers</b>: too small for light microscopes. Light waves are bigger than the virus!']];
const MOL_ICO=`<svg viewBox="-12 -12 24 24" class="is-vico"><path d="M0 -1 L-7 5 M0 -1 L7 5" stroke="#adb5bd" stroke-width="2"/><circle cx="0" cy="-2" r="6" fill="#fa5252" stroke="#c92a2a" stroke-width="1"/><circle cx="-7.5" cy="5.5" r="3.8" fill="#f1f3f5" stroke="#868e96" stroke-width="1"/><circle cx="7.5" cy="5.5" r="3.8" fill="#f1f3f5" stroke="#868e96" stroke-width="1"/></svg>`;
const CELL_ICO=`<svg viewBox="-12 -12 24 24" class="is-vico"><ellipse rx="10.5" ry="9" fill="#f7a8c8" stroke="#c2255c" stroke-width="1.4"/><circle cx="1" cy="-.5" r="3.8" fill="#862e9c"/><circle cx="-5" cy="3" r="1.2" fill="#c2255c"/><circle cx="5.5" cy="4" r="1" fill="#c2255c"/></svg>`;
const VIRUS_ICO=`<svg viewBox="-12 -12 24 24" class="is-vico">${Array.from({length:10},(_,i)=>{const a=i/10*Math.PI*2;return `<line x1="${(Math.cos(a)*6).toFixed(1)}" y1="${(Math.sin(a)*6).toFixed(1)}" x2="${(Math.cos(a)*10).toFixed(1)}" y2="${(Math.sin(a)*10).toFixed(1)}" stroke="#9c36b5" stroke-width="1.6"/><circle cx="${(Math.cos(a)*10.5).toFixed(1)}" cy="${(Math.sin(a)*10.5).toFixed(1)}" r="1.6" fill="#e599f7"/>`;}).join('')}<circle r="6.5" fill="#cc5de8"/></svg>`;
function sizeBar(){const k=R.sz||0,n=SIZES.length,z=SIZES[k];
 return `<div class="is-size" id="isSize"><div class="trk"><i style="width:${k/(n-1)*100}%"></i>${SIZES.map((q,j)=>`<span class="${j<k?'past':''}${j===k?' on':''}" style="left:${j/(n-1)*100}%">${q.e==='VIRUS'?VIRUS_ICO:q.e==='CELL'?CELL_ICO:q.e==='MOL'?MOL_ICO:q.e}</span>`).join('')}</div><div class="lab">📏 <b>${z.sz}</b> · ${z.n}</div></div>`;}
function setSize(k){R.sz=k;const el=root&&root.querySelector('#isSize');if(el)el.outerHTML=sizeBar();}
/* Speed: the ant, hair, cell and virus are drawn ONCE into a picture (sprite) and then just stretched each frame.
   Redrawing a giant emoji or a screen-wide gradient stroke every frame was what made the shrink stutter. */
const SPR={},SPR_BOX={1:[.62,.62],2:[2.3,.62],3:[.52,.44],5:[.5,.5]};let STOP_BASE=400;
function stopSprite(k){const B=Math.max(120,Math.min(900,Math.round(STOP_BASE))),key=k+':'+B;if(SPR[key])return SPR[key];
 const [bx,by]=SPR_BOX[k],cv=document.createElement('canvas');cv.width=Math.ceil(bx*2*B);cv.height=Math.ceil(by*2*B);
 drawStopLive(cv.getContext('2d'),k,cv.width/2,cv.height/2,B,0,1);return SPR[key]={cv,B};}
function drawStop(c,k,x,y,S,sec,a){if(k<1||a<=0.02)return;
 if(SPR_BOX[k]){const sp=stopSprite(k),sc=S/sp.B,w=sp.cv.width*sc,h=sp.cv.height*sc;c.save();c.globalAlpha=Math.min(1,a);
  if(k===5){c.translate(x,y);c.rotate(sec*.1);c.drawImage(sp.cv,-w/2,-h/2,w,h);}else c.drawImage(sp.cv,x-w/2,y-h/2,w,h);c.restore();return;}
 drawStopLive(c,k,x,y,S,sec,a);}
function drawStopLive(c,k,x,y,S,sec,a){if(k<1||a<=0.01)return;c.save();c.globalAlpha=Math.min(1,a);
 if(k===1){c.font=`${S}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🐜',x,y);}
 else if(k===2){c.lineCap='round';const g=c.createLinearGradient(x,y-S*.3,x,y+S*.3);g.addColorStop(0,'#8d5a2b');g.addColorStop(.5,'#c08552');g.addColorStop(1,'#6f4520');c.strokeStyle=g;c.lineWidth=S*.42;c.beginPath();c.moveTo(x-S*2,y+S*.25);c.quadraticCurveTo(x,y-S*.35,x+S*2,y+S*.15);c.stroke();
  c.strokeStyle='rgba(60,30,10,.35)';c.lineWidth=Math.max(1,S*.02);for(let i=-9;i<=9;i++){const px=x+i*S*.2;c.beginPath();c.moveTo(px,y-S*.12);c.quadraticCurveTo(px+S*.06,y,px,y+S*.14);c.stroke();}}
 else if(k===3){const g=c.createRadialGradient(x-S*.12,y-S*.12,S*.05,x,y,S*.48);g.addColorStop(0,'rgba(255,214,231,.95)');g.addColorStop(1,'rgba(230,119,160,.75)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,S*.48,S*.4,0,0,7);c.fill();c.strokeStyle='#c2255c';c.lineWidth=Math.max(2,S*.02);c.stroke();
  c.fillStyle='#862e9c';c.beginPath();c.arc(x+S*.06,y-S*.02,S*.13,0,7);c.fill();c.fillStyle='rgba(134,46,156,.5)';for(let i=0;i<9;i++){c.beginPath();c.arc(x+Math.cos(i*2.1)*S*.3,y+Math.sin(i*2.1)*S*.24,S*.025,0,7);c.fill();}}
 else if(k===4){for(let b=0;b<3;b++){const bx=x+(b-1)*S*.42,by=y+(b===1?-S*.18:S*.12),ang=-.3+b*.35+Math.sin(sec*.8+b)*.08;c.save();c.translate(bx,by);c.rotate(ang);
   c.strokeStyle='#2b8a3e';c.lineWidth=Math.max(1.5,S*.015);c.beginPath();c.moveTo(-S*.16,0);for(let q=0;q<=20;q++)c.lineTo(-S*.16-q*S*.012,Math.sin(q*.8+sec*3)*S*.03);c.stroke();
   c.fillStyle='#69db7c';c.strokeStyle='#2b8a3e';c.lineWidth=Math.max(2,S*.02);c.beginPath();if(c.roundRect)c.roundRect(-S*.16,-S*.06,S*.32,S*.12,S*.06);else c.rect(-S*.16,-S*.06,S*.32,S*.12);c.fill();c.stroke();c.restore();}}
 else if(k===5){const r=S*.3;c.strokeStyle='#9c36b5';c.lineWidth=Math.max(2,S*.02);for(let i=0;i<16;i++){const q=i/16*Math.PI*2+sec*.1;c.beginPath();c.moveTo(x+Math.cos(q)*r,y+Math.sin(q)*r);c.lineTo(x+Math.cos(q)*r*1.35,y+Math.sin(q)*r*1.35);c.stroke();c.fillStyle='#e599f7';c.beginPath();c.arc(x+Math.cos(q)*r*1.38,y+Math.sin(q)*r*1.38,S*.035,0,7);c.fill();}
  const g=c.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);g.addColorStop(0,'#f3d9fa');g.addColorStop(1,'#9c36b5');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
 c.restore();}
function shrink(){const t=tier();R.sz=0;let k=0,go=performance.now()+600;const TRAVEL=4.6;
 const say=()=>k===0?'':(k===1?['We\'ve already started shrinking… and now we\'re as small as an <b>ANT</b>! 🐜 Hi there, ant! To us it looks as big as a <b>house</b>! Watch the size meter at the top to see how small we get.','The shrink ray is already on! We\'re ant-sized: about <b>3 millimeters</b>. A grain of sand would look like a boulder! The <b>size meter</b> at the top shows how small we are.','Shrinking is underway: about <b>3 mm</b> now, roughly 500 times smaller. Sand grains are boulders. The <b>size meter</b> tracks us; each stop is about 10× smaller than the last.'][t]:STOPS[k][t]);
 const btnTxt=()=>k<5?'Let\'s keep going ➜':'Dive into the molecules ➜';
 frame(nar(say(),'Shrinking… ⏳',{dis:1}));{const nb=root.querySelector('.is-nar');if(nb){nb.style.opacity='0';nb.style.transition='opacity .8s';}}
 const cv=canvas();stage().prepend(cv);const c=cv.getContext('2d');
 const hook=()=>onNext(()=>{if(go)return;if(k>=5){next();return;}go=performance.now();const b=root.querySelector('#isNext');if(b){b.disabled=true;b.textContent='Shrinking… ⏳';}snd(520-k*40,.5,'sine',.04);});
 hook();
 loop(sec=>{const w=cv.clientWidth,h=cv.clientHeight;if(!w)return;
  const gp=go?Math.max(0,Math.min(1,(performance.now()-go)/1000/TRAVEL)):0;const depth=(k+gp)/5;
  const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,`hsl(255,45%,${22-depth*12}%)`);g.addColorStop(1,`hsl(250,50%,${14-depth*8}%)`);c.fillStyle=g;c.fillRect(0,0,w,h);
  const S=Math.min(w,h)*.55,cx=w/2,cy=(h-120)*.5+40;STOP_BASE=S*Math.min(2,window.devicePixelRatio||1);if(!R.sprWarm){R.sprWarm=1;[1,2,3,5].forEach(stopSprite);}
  // calm, slow rings while traveling (gentle: slow, see-through, no flashing)
  if(go){const f=Math.max(0,(performance.now()-go)/1000);for(let i=0;i<5;i++){const ph=((f/6+i/5)%1);c.strokeStyle='#b197fc';c.globalAlpha=.16*(1-ph);c.lineWidth=2+ph*2;c.beginPath();c.ellipse(cx,cy,ph*Math.max(w,h)*.7,ph*Math.max(w,h)*.46,0,0,7);c.stroke();}c.globalAlpha=1;}
  if(go){const p=gp,sm=x=>x*x*(3-2*x),a=sm(Math.min(1,p/.42)),b=sm(Math.max(0,(p-.55)/.45));
   // first the thing we're passing grows past us and fades away… then (after a moment of just rings) the next one appears as a dot
   if(p<.42)drawStop(c,k,cx,cy,S*(1+a*2),sec,1-a);if(p>.55)drawStop(c,k+1,cx,cy,S*(.02+b*.98),sec,Math.min(1,b*1.6));
   if(p>=1){go=0;k++;setSize(k);snd(660+k*60,.18,'triangle',.05);const n=root.querySelector('.is-nar .txt');if(n)n.innerHTML=`<small>Ride Operator ${NAME}</small>${say()}`;const nb=root.querySelector('.is-nar');if(nb)nb.style.opacity='1';const b=root.querySelector('#isNext');if(b){b.disabled=false;b.textContent=btnTxt();}}}
  else drawStop(c,k,cx,cy,S,sec,1);
  car(c,cx+Math.sin(sec*.7)*8,cy+S*.34+Math.cos(sec*.9)*5,Math.min(w,h)*.14,sec);});}

/* 3. inside the substance */
function inside(){const s=R.s,t=tier();frame(nar(esc(s.inside[t]).replace(/molecules/,'<b>molecules</b>'),'Look closer ➜'));
 const cv=canvas();stage().prepend(cv);const c=cv.getContext('2d');onNext();
 const bg={liquid:'#0b3d6b',gas:'#9ecbff',solid:'#1b1036'}[s.state];let P2=null;
 loop(sec=>{const w=cv.clientWidth,h=cv.clientHeight;if(!w)return;c.fillStyle=bg;c.fillRect(0,0,w,h);
  if(s.state!=='solid'){const N=s.state==='gas'?28:176,sp=s.state==='gas'?160:28;const zz=Math.min(1,sec/3.5),zm=.25+.75*zz*zz*(3-2*zz);const unit=Math.min(w,h)/(s.state==='gas'?22:18)*(s.lay==='glucose'?.6:1)*zm;
   if(!P2)P2=Array.from({length:N},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*sp,vy:(Math.random()-.5)*sp,r:Math.random()*6,vr:(Math.random()-.5)*(s.state==='gas'?3:1.2)}));
   const dt=1/60;P2.forEach(m=>{m.x+=m.vx*dt;m.y+=m.vy*dt;m.r+=m.vr*dt;if(s.state==='gas'){if(m.x<0||m.x>w)m.vx*=-1;if(m.y<0||m.y>h)m.vy*=-1;}else{m.vx+=(Math.random()-.5)*6;m.vy+=(Math.random()-.5)*6;m.vx*=.99;m.vy*=.99;m.x=(m.x+w)%w;m.y=(m.y+h)%h;}drawMol(c,s.lay,m.x,m.y,unit,m.r,false);});
   if(s.state==='gas'){c.fillStyle='rgba(20,10,46,.85)';c.font='700 15px Fredoka,sans-serif';c.textAlign='left';c.textBaseline='alphabetic';c.fillText('lots of empty space between molecules!',14,h-150);}}
  else{const zz=Math.min(1,sec/3.5),u=Math.min(w,h)/10*(.3+.7*zz*zz*(3-2*zz));const cols=Math.ceil(w/u)+1,rows=Math.ceil(h/u)+1;
   if(s.metal){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=x*u+(y%2?u/2:0),py=y*u*.87;const j=Math.sin(sec*9+x*1.3+y*2.1)*u*.04;ball(c,'Au',px+j,py-j,u*.46);}
    c.fillStyle='#74c0fc';for(let k=0;k<60;k++){const ex=((k*97+sec*80*(k%3+1))%w),ey=((k*53+Math.sin(sec+k)*40)%h+h)%h;c.beginPath();c.arc(ex,ey,3,0,7);c.fill();}
    c.fillStyle='rgba(20,10,46,.8)';c.beginPath();c.roundRect?c.roundRect(10,52,330,34,12):c.rect(10,52,330,34);c.fill();c.fillStyle='#fff';c.font='700 17px Fredoka,sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillText('🔵 = free-floating electrons ("electron sea")',20,69);}
   else if(s.lay==='glucose'){const u2=u*2.4;for(let y=0;y<h/u2+1;y++)for(let x=0;x<w/u2+1;x++){const j=Math.sin(sec*6+x+y*2)*3;drawMol(c,'glucose',x*u2+u2/2+j,y*u2+u2/2-j,u2*.15,0,false);}}
   else{const els=s.lattice;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const j=Math.sin(sec*9+x*1.7+y*1.1)*u*.05;const px=x*u+j,py=y*u-j;
     if(s.id==='diamond'){c.strokeStyle='#adb5bd';c.lineWidth=4;c.beginPath();c.moveTo(px,py);c.lineTo(px+u,py);c.moveTo(px,py);c.lineTo(px,py+u);c.stroke();}
     const el=els[(x+y)%els.length];ball(c,el,px,py,u*(s.id==='diamond'?.26:EL[el].r*.32));
     if(s.id==='salt'&&x<3&&y<3&&t>0){c.fillStyle='#fff';c.font=`800 ${u*.2}px Fredoka,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(el==='Na'?'+':'−',px,py);}}}}
  car(c,w*.5+Math.sin(sec)*20,h*.42+Math.cos(sec*1.3)*10,Math.min(w,h)*.115,sec);});}

/* 4. one molecule */
function mol(){const s=R.s,t=tier();const L=D.L[s.lay];
 frame(`<div class="is-panel" style="right:14px;top:60px"><h3>${s.elem?'Building block':s.id==='salt'?(t>1?'One formula unit':'One salt pair'):'One molecule'} · <span style="font-size:24px">${s.f}</span></h3>${Object.entries(s.elem?{[Object.keys(s.atoms)[0]]:1}:s.atoms).map(([e,n])=>`<div class="is-cnt"><span class="is-ball" style="background:${EL[e].col};color:${EL[e].txt}">${e}</span>${s.elem?'':n+' × '}${EL[e].n}</div>`).join('')}
 ${!s.elem&&s.id!=='salt'?`<div style="margin-top:6px;color:#495057">= ${L.a.length} atoms in all</div>`:''}</div>
 ${nar(esc(s.mol[t]),'Go inside an atom ➜')}`);onNext();
 const cv=canvas();stage().prepend(cv);const c=cv.getContext('2d');
 loop(sec=>{const w=cv.clientWidth,h=cv.clientHeight;if(!w)return;c.fillStyle='#0b3d6b';c.fillRect(0,0,w,h);const span=Math.max(...L.a.map(a=>Math.hypot(a[1],a[2])))+1;
  const zq=Math.min(1,sec/2.2),sc=Math.max(4,Math.min(w*.8,(h-190)*.9)/(span*2))*(.3+.7*zq*zq*(3-2*zq));drawMol(c,s.lay,w*.42,(h-120)*.55,sc,Math.sin(sec*.6)*.25,true);
  if(s.id==='salt'&&t>0){c.fillStyle='#ffd43b';c.font=`800 ${Math.max(18,sc*.35)}px Fredoka,sans-serif`;c.textAlign='center';c.textBaseline='alphabetic';const r2=Math.sin(sec*.6)*.25;c.fillText('Na⁺',w*.42-Math.cos(r2)*.75*sc,(h-120)*.55-Math.sin(r2)*.75*sc+sc*.85);c.fillText('Cl⁻',w*.42+Math.cos(r2)*.75*sc,(h-120)*.55+Math.sin(r2)*.75*sc+sc*.85);}});}

/* 5. inside the atom */
function atom(){const s=R.s,t=tier();const e=s.star,E=EL[e];const an=/^[AEIOU]/.test(E.n)?'an':'a';
 frame(`<div class="is-panel" id="isAtomPanel" style="left:14px;top:60px"><h3>Inside ${an} ${E.n.toLowerCase()} atom (${e})</h3>
 <div class="is-cnt"><span class="is-ball" style="background:#e03131;color:#fff">+</span>${E.p} proton${E.p>1?'s':''}</div>
 <div class="is-cnt"><span class="is-ball" style="background:#1c7ed6;color:#fff">n</span>${E.nu} neutron${E.nu===1?'':'s'}</div>
 <div class="is-cnt"><span class="is-ball" style="background:#ffe066">−</span>${E.p} electron${E.p>1?'s':''}</div>
 ${t>0?`<div style="margin-top:6px;color:#495057">Atomic number: <b>${E.p}</b>${t>1?` · shells ${E.sh.join(', ')}`:''}</div>`:''}</div>
 ${nar(`${[`We're INSIDE ${an} ${E.n.toLowerCase()} atom! The middle is packed with <b>protons</b> and <b>neutrons</b>. Tiny <b>electrons</b> zoom around the outside.`,`The center is the <b>nucleus</b>: protons (+) and neutrons. Electrons (−) whizz around in shells. The number of protons decides what element it is — ${E.p} means ${E.n.toLowerCase()}!`,`Nucleus: ${E.p} p⁺ and ${E.nu} n⁰. Electron shells: ${E.sh.join(', ')}. The atom is ~100,000× wider than its nucleus — it's mostly empty space.`][t]} ${esc(E.fact[t])}`,'Continue ➜')}`);onNext();
 const cv=canvas();stage().prepend(cv);const c=cv.getContext('2d');const nucl=[];const big=E.p+E.nu>40;
 if(!big){const N=E.p+E.nu;for(let i=0;i<N;i++){const a=i*2.4,r=Math.sqrt(i)*1;nucl.push([Math.cos(a)*r,Math.sin(a)*r,i<E.p]);}}
 loop(sec=>{const w=cv.clientWidth,h=cv.clientHeight;if(!w)return;c.fillStyle='#140a2e';c.fillRect(0,0,w,h);const top=110,bot=h-(w<600?230:170),cy=(top+bot)/2;let cx=w*.5;const pan=root.querySelector('#isAtomPanel');const pw=pan&&w>=600?pan.offsetWidth:0;const R0=Math.max(40,Math.min(w<600?w*.38:(w-pw-60)/2-20,(bot-top)/2-14));const n=E.sh.length;if(pw){const gap=40,x0=Math.max(14,(w-(pw+gap+R0*2))/2);cx=x0+pw+gap+R0;const L2=Math.round(x0)+'px',T2=Math.round(cy-pan.offsetHeight/2)+'px';if(pan.style.left!==L2)pan.style.left=L2;if(pan.style.top!==T2)pan.style.top=T2;}
  E.sh.forEach((k,si)=>{const r=R0*(si+1)/n;c.strokeStyle='rgba(255,224,102,.35)';c.setLineDash([4,8]);c.lineWidth=2;c.beginPath();c.arc(cx,cy,r,0,7);c.stroke();c.setLineDash([]);
   for(let q=0;q<k;q++){const a=sec*(1.6-si*.2)+q*Math.PI*2/k+si;c.fillStyle='#ffe066';c.shadowColor='#ffe066';c.shadowBlur=10;c.beginPath();c.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,Math.max(3,7-n*.6),0,7);c.fill();c.shadowBlur=0;}});
  const nr=big?Math.max(38,R0/n*.6):R0/n*.45;if(big){const g=c.createRadialGradient(cx-nr*.3,cy-nr*.3,2,cx,cy,nr);g.addColorStop(0,'#ffc9c9');g.addColorStop(1,'#c92a2a');c.fillStyle=g;c.beginPath();c.arc(cx,cy,nr,0,7);c.fill();c.fillStyle='#fff';c.font=`800 ${nr*.42}px Fredoka,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(`${E.p} p⁺`,cx,cy-nr*.2);c.fillText(`${E.nu} n`,cx,cy+nr*.25);}
  else{const u=nr/(Math.sqrt(nucl.length)+1)*1.1;nucl.forEach(([x,y,pr])=>{const g=c.createRadialGradient(cx+x*u-u*.3,cy+y*u-u*.3,1,cx+x*u,cy+y*u,u*.9);g.addColorStop(0,'#fff');g.addColorStop(.3,pr?'#ff6b6b':'#4dabf7');g.addColorStop(1,pr?'#c92a2a':'#1864ab');c.fillStyle=g;c.beginPath();c.arc(cx+x*u+Math.sin(sec*20+x)*.8,cy+y*u,u*.9,0,7);c.fill();});}});}

/* 6. build it */
function build(){const s=R.s,t=tier();const need=Object.assign({},s.atoms);const have={};const DECOYS=['H','C','N','O','Na','Cl','Au'].filter(e=>!need[e]);
 const tray=Object.keys(need).sort();
 let placed=[],done=false;R.buzz=0;
 const draw=(msg,ok)=>{const L=D.L[s.lay];const total=Object.values(need).reduce((a,b)=>a+b,0);let x0=-1.4,x1=1.4,y0=-1.25,y1=1.25;L.a.forEach(([e,x,y])=>{const r=EL[e].r*.45;x0=Math.min(x0,x-r);x1=Math.max(x1,x+r);y0=Math.min(y0,y-r);y1=Math.max(y1,y+r);});const pw=(x1-x0)*.08+.2;const vb=`${x0-pw} ${y0-pw} ${x1-x0+pw*2} ${y1-y0+pw*2}`; // fit the finished molecule
  frame(`<div class="is-build is-dark2"><h2>🔧 ${esc(s.build[t])}</h2>
   <div class="is-brow"><div class="is-tray"><h4>YOUR ATOMS</h4><div class="atoms">${tray.map(e=>`<button class="is-atom" data-e="${e}" style="background:${EL[e].col};color:${EL[e].txt}" ${done?'disabled':''}>${e}<small>${EL[e].n}</small></button>`).join('')}</div></div>
   <div class="is-area ${done?'done':''}" id="isArea"><svg viewBox="${vb}" width="100%" height="100%" id="isSvg"></svg></div>
   <div class="is-recipe"><h4>RECIPE</h4><div class="f">${s.f}</div><ul>${Object.entries(need).map(([e,n])=>`<li>${(have[e]||0)>=n?'✅':'◻️'} ${n} ${EL[e].n.toLowerCase()} <b>(${have[e]||0}/${n})</b></li>`).join('')}</ul></div></div>
   <div class="is-buzz" style="color:${ok?'#2b8a3e':'#c92a2a'}">${msg||'&nbsp;'}</div></div>
   ${nar(done?(s.id==='salt'&&t>0?'Watch the electron jump from sodium to chlorine! Now they have opposite charges, so they stick together.':s.metal?'Clink! The gold atoms packed together, sharing a sea of free electrons (the blue dots). That\'s a metal!':s.id==='diamond'?'SNAP! One carbon holding on to four others — repeat that forever and you get a diamond!':'SNAP! The atoms bonded together. You built it!'):`Tap atoms in the tray to add them. ${total>6?`You need ${total} atoms — keep going!`:''}`,done?'🔁 Replicate!':null,{cls:done?'gold':'green'})}`);
  const svg=root.querySelector('#isSvg');
  if(done){const lay=L;let h='';lay.b.forEach(([i,j,o])=>{const a=lay.a[i],b=lay.a[j];h+=`<line x1="${a[1]}" y1="${a[2]}" x2="${b[1]}" y2="${b[2]}" stroke="#adb5bd" stroke-width="${o===2?.16:.1}" ${o===0?'stroke-dasharray=".12 .12"':''}><animate attributeName="stroke-opacity" from="0" to="1" dur=".8s"/></line>`;});
   const sc=1;lay.a.forEach(([e,x,y],k)=>{const r=EL[e].r*.42*sc;h+=`<g><circle cx="${x}" cy="${y}" r="${r}" fill="${EL[e].col}" stroke="rgba(0,0,0,.25)" stroke-width=".04"><animate attributeName="r" values="0;${r*1.25};${r}" dur=".5s" begin="${k*.03}s" fill="freeze"/></circle><text x="${x}" y="${y+r*.35}" font-size="${r*.95}" text-anchor="middle" font-weight="800" fill="${EL[e].txt}">${e}</text></g>`;});
   if(s.id==='salt'&&t>0)h+=`<circle r=".13" fill="#ffe066" stroke="#e67700" stroke-width=".03"><animate attributeName="cx" values="-1.1;1.1" dur="1.4s" fill="freeze"/><animate attributeName="cy" values="-.9;-1.4;-.9" dur="1.4s" fill="freeze"/></circle><text x="-.75" y="1.25" font-size=".42" text-anchor="middle" font-weight="800" fill="#7048e8">Na⁺</text><text x=".75" y="1.25" font-size=".42" text-anchor="middle" font-weight="800" fill="#2b8a3e">Cl⁻</text>`;
   if(s.metal)h+=Array.from({length:6},(_,k)=>`<circle cx="${-1.3+k*.5}" cy="${1.4-(k%2)*.2}" r=".08" fill="#74c0fc"><animate attributeName="cx" values="${-1.3+k*.5};${-1.3+k*.5+.5};${-1.3+k*.5}" dur="${1.5+k*.2}s" repeatCount="indefinite"/></circle>`).join('');
   svg.innerHTML=h;}
  else{svg.innerHTML=placed.map((e,k)=>{const n=placed.length;const a=k/n*Math.PI*2,rr=n>1?(n>8?2:1.2):0;const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.8;const r=EL[e].r*.42*(n>8?.6:1);return `<g class="is-float" style="animation-delay:${k*.1}s"><circle cx="${x}" cy="${y}" r="${r}" fill="${EL[e].col}" stroke="rgba(0,0,0,.25)" stroke-width=".04"/><text x="${x}" y="${y+r*.35}" font-size="${r*.95}" text-anchor="middle" font-weight="800" fill="${EL[e].txt}">${e}</text></g>`;}).join('');}
  root.querySelectorAll('.is-atom').forEach(b=>b.onclick=()=>add(b.dataset.e));onNext(done?replicate:null);};
 const add=e=>{if(done)return;if(!need[e]){R.buzz++;snd(150,.3,'sawtooth',.05);draw(`Bzzzt! ${EL[e].n} isn't in ${esc(s.n.toLowerCase())}! Check the recipe.`);return;}
  if((have[e]||0)>=need[e]){R.buzz++;snd(180,.25,'sawtooth',.05);draw(`That's enough ${EL[e].n.toLowerCase()} — the recipe only needs ${need[e]}.`);return;}
  have[e]=(have[e]||0)+1;placed.push(e);snd(500+placed.length*40,.1,'triangle',.05);
  if(Object.entries(need).every(([k,n])=>(have[k]||0)>=n)){done=true;R.built=true;snd(880,.25,'triangle',.08,.1);snd(1320,.3,'triangle',.08,.25);draw('🎉 Perfect! That\'s '+s.f+'!',true);}else draw('');};
 draw('');}

/* 6a. uh-oh: the shrink ray is stuck and the Molecule Builder is broken */
function alarm(){const s=R.s,t=tier();
 const L=[`Uh-oh… 😬 Do you feel that? We're <b>STILL shrinking</b>! The shrink ray is stuck ON!`,
  `If we don't stop it, we'll keep shrinking forever and disappear into <b>INNER SPACE</b>! 😱 To reverse the shrink ray, the Atom-Mobile needs <b>${esc(s.n.toLowerCase())}</b> (${s.f}). The Atom-Mobile\'s <b>Molecule Builder</b> usually makes it for us…`,
  `…but look at the dashboard: <b>COMPUTER ERROR!</b> The Molecule Builder is broken! We'll have to build it by hand: first the <b>atoms</b>, then the <b>molecule</b>. Once we build one, the Molecule Builder can copy it billions of times. You can do this!`];
 let i=0;const show=()=>{const last=i>=L.length-1;
  frame(`<div class="is-dash"><svg viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet" class="is-svg"><rect x="-600" y="-600" width="2160" height="1800" fill="#0b0716"/>
   <path d="M60 600 L140 250 Q480 170 820 250 L900 600Z" fill="#1c1535" stroke="#3b2d6b" stroke-width="6"/>
   <rect x="300" y="210" width="360" height="170" rx="14" fill="#0a1f14" stroke="#495057" stroke-width="8"/>
   <text x="480" y="262" font-size="30" font-weight="800" fill="#ff6b6b" text-anchor="middle" font-family="monospace" class="is-blinkslow">⚠ COMPUTER ERROR</text>
   <text x="480" y="300" font-size="17" fill="#69db7c" text-anchor="middle" font-family="monospace">MOLECULE BUILDER: OFFLINE</text><text x="480" y="326" font-size="17" fill="#69db7c" text-anchor="middle" font-family="monospace">SHRINK RAY: STUCK ON</text><text x="480" y="356" font-size="17" fill="#ffd43b" text-anchor="middle" font-family="monospace">&gt; MANUAL BUILD REQUIRED_</text>
   ${[[200,420,'#ff6b6b'],[760,420,'#ffd43b']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="40" fill="#15102b" stroke="#495057" stroke-width="6"/><path d="M${x} ${y} L${x+26} ${y-22}" stroke="${c}" stroke-width="5" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-30 ${x} ${y};40 ${x} ${y};-30 ${x} ${y}" dur="4s" repeatCount="indefinite"/></path>`).join('')}
   <g transform="translate(480 470)"><rect x="-70" y="-38" width="140" height="76" rx="12" fill="#343a40" stroke="#868e96" stroke-width="4"/><text x="0" y="-48" font-size="15" font-weight="800" fill="#ced4da" text-anchor="middle">MOLECULE BUILDER</text>
    <path d="M-10 18 L-2 -30" stroke="#adb5bd" stroke-width="10" stroke-linecap="round"/><path d="M4 -8 L26 -40" stroke="#adb5bd" stroke-width="10" stroke-linecap="round" transform="rotate(25 4 -8)"/>
    <g class="is-spark"><path d="M0 -14 l10 -8 l-4 10 l12 -2 l-12 8" stroke="#ffe066" stroke-width="3" fill="none"/></g></g>
   <circle cx="130" cy="300" r="14" fill="#fa5252" class="is-blinkslow"/><circle cx="830" cy="300" r="14" fill="#fa5252" class="is-blinkslow"/></svg></div>
   ${nar(L[i],last?'🔧 Let\'s build the atoms!':'Next ➜',{cls:last?'gold':''})}`);
  onNext(()=>{if(last){next();return;}i++;snd(160,.5,'sawtooth',.03);show();});};
 snd(220,.4,'square',.04);snd(180,.5,'square',.04,.45);show();}

/* 6b. build the atoms: protons (older kids also electrons, then neutrons too) */
function atomSVG(p,n,el){const N=p+n;const u=Math.max(3.2,11-Math.sqrt(N)*.9);let h='';const order=[];for(let i=0;i<N;i++)order.push(i<p?1:0);
 for(let i=order.length-1;i>0;i--){const j=(i*7+3)%(i+1);[order[i],order[j]]=[order[j],order[i]];}
 order.forEach((pr,i)=>{const a=i*2.4,r=Math.sqrt(i)*u*.95;h+=`<circle cx="${(Math.cos(a)*r).toFixed(1)}" cy="${(Math.sin(a)*r).toFixed(1)}" r="${u}" fill="${pr?'#fa5252':'#339af0'}" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`;});
 const sh=[];let left=el;for(const cap of [2,8,18,32,32,18,8]){if(left<=0)break;sh.push(Math.min(cap,left));left-=cap;}
 const R0=Math.max(46,Math.sqrt(N)*u*1.1+18);sh.forEach((k,si)=>{const r=R0+si*18;h+=`<circle r="${r}" fill="none" stroke="rgba(255,224,102,.45)" stroke-dasharray="3 6"/>`;const shw=Math.min(k,24);for(let q=0;q<shw;q++){const a=q/shw*Math.PI*2;h+=`<circle cx="${(Math.cos(a)*r).toFixed(1)}" cy="${(Math.sin(a)*r).toFixed(1)}" r="4" fill="#ffe066"/>`;}});
 const V=Math.max(80,R0+sh.length*18+10);return `<svg viewBox="${-V} ${-V} ${V*2} ${V*2}" class="is-asvg">${h}</svg>`;}
function atoms(){const s=R.s,t=tier();const els=Object.keys(s.atoms).sort((a,b)=>EL[b].p-EL[a].p);R.made=R.made||{};
 const cur=els.find(e=>!R.made[e]);if(!cur){next();return;}const E=EL[cur];if(!R.cnt||R.cnt.e!==cur)R.cnt={e:cur,p:0,n:0,el:0};const c=R.cnt;
 const need={p:E.p,n:E.nu,el:E.p},ok=c.p===need.p&&c.n===need.n&&c.el===need.el;const an=/^[AEIOU]/.test(E.n)?'an':'a';
 const row=(k,lab,ico,col,lock)=>`<div class="is-crow ${lock?'lock':''}"><span class="is-cball" style="background:${col}">${ico}</span><b>${lab}</b><span class="is-cnum ${c[k]===need[k]?'good':c[k]>need[k]?'over':''}">${c[k]} / ${need[k]}</span>${lock?'<small>Ozzy did these ✓</small>':`<span class="is-cbs"><button class="is-cb" data-k="${k}" data-d="-1" aria-label="remove one">−</button><button class="is-cb" data-k="${k}" data-d="1" aria-label="add one">+</button>${need[k]>=10?`<button class="is-cb wide" data-k="${k}" data-d="10">+10</button>`:''}${need[k]>=10&&c[k]>=10&&c[k]<need[k]?`<button class="is-cb wide fill" data-k="${k}" data-fill="1" aria-label="fill the rest">⚡ Fill to ${need[k]}</button>`:''}</span>`}</div>`;
 const tips=[`${an[0].toUpperCase()+an.slice(1)} <b>${E.n.toLowerCase()}</b> atom needs <b>${E.p} proton${E.p>1?'s':''}</b>, <b>${E.nu} neutron${E.nu===1?'':'s'}</b> and <b>${E.p} electron${E.p>1?'s':''}</b>. The number of protons is what makes it ${E.n.toLowerCase()}! Tap <b>+</b> to add them.`,
  `Build ${an} <b>${E.n.toLowerCase()}</b> atom: <b>${E.p} proton${E.p>1?'s':''}</b> and <b>${E.nu} neutron${E.nu===1?'':'s'}</b> in the middle, and the same number of <b>electrons</b> as protons zooming around the outside.`,
  `Build ${an} <b>${E.n.toLowerCase()}</b> atom: ${E.p} protons, ${E.nu} neutrons and ${E.p} electrons. Protons (+) and electrons (−) balance, so the whole atom has no charge.`][t];
 const over=c.p>need.p||c.n>need.n||c.el>need.el;
 frame(`<div class="is-build is-dark2"><h2>⚛️ Build ${an} ${E.n} atom (${cur})</h2>
  <div class="is-steps">${els.map(e=>`<span class="${R.made[e]?'done':e===cur?'on':''}">${R.made[e]?'✅':'⚛️'} ${EL[e].n}</span>`).join('<i>➜</i>')}<i>➜</i><span>🧪 ${esc(s.n)}</span></div>
  <div class="is-brow is-arow"><div class="is-abox">${atomSVG(c.p,c.n,c.el)}</div><div class="is-cbox">${row('p','Protons','+','#fa5252',false)}${row('n','Neutrons','n','#339af0',false)}${row('el','Electrons','−','#fcc419',false)}
   ${ok?`<div class="is-okmsg">✅ That's ${an} ${E.n.toLowerCase()} atom!</div>`:over?`<div class="is-okmsg bad">Too many! Tap − to take some away.</div>`:''}</div></div></div>
  ${nar(ok?`Perfect! ${E.fact?E.fact[t]:''}`:tips,ok?(els.some(e=>!R.made[e]&&e!==cur)?'Next atom ➜':'Now build the molecule ➜'):null,{cls:ok?'green':''})}`);
 /* big atoms (gold has 79 protons + 118 neutrons!) → after the first +10, Ozzy's turbo button fills the rest so it isn't ~50 taps */
 root.querySelectorAll('.is-cb').forEach(b=>b.onclick=()=>{const k=b.dataset.k,d=b.dataset.fill?need[k]-c[k]:+b.dataset.d;c[k]=Math.max(0,Math.min(need[k]+10,c[k]+d));snd(d>0?Math.min(1200,480+c[k]*8):300,.08,'triangle',.05);atoms();});
 if(ok){snd(880,.2,'triangle',.07);onNext(()=>{R.made[cur]=true;R.cnt=null;atoms();});}}

/* 6c. after the molecule is built: the replicator copies it billions of times and the shrinking stops */
function replicate(){const s=R.s;const box=root.querySelector('.is-build');if(!box)return;R.replDone=false;
 const ov=document.createElement('div');ov.className='is-repl';ov.innerHTML=`<canvas></canvas><div class="is-rtxt"><div>🔁 REPLICATING…</div><b id="isRN">1</b><small>${esc(s.n.toLowerCase())} molecules</small></div>`;box.appendChild(ov);
 const cv=ov.querySelector('canvas'),c=cv.getContext('2d');const nb=root.querySelector('#isNext');if(nb){nb.disabled=true;nb.textContent='Replicating… ⏳';}
 const N=[1,2,4,16,100,1000,1000000,1000000000];const t0=performance.now();snd(300,1.5,'sine',.05);
 loop(()=>{const w=cv.clientWidth,h=cv.clientHeight;if(!w)return;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}const f=Math.min(1,(performance.now()-t0)/5200);c.clearRect(0,0,w,h);
  const cnt=Math.floor(1+f*f*220);const R0=Math.min(w,h)/(6+f*26);for(let i=0;i<cnt;i++){const a=i*2.39996,r=Math.sqrt(i)*R0*1.25;const x=w/2+Math.cos(a)*r,y=h/2+Math.sin(a)*r*.8;if(x<-R0||x>w+R0||y<-R0||y>h+R0)continue;drawMol(c,s.lay,x,y,R0*.55,i*.7,false);}
  const n=root.querySelector('#isRN');if(n){const k=Math.min(N.length-1,Math.floor(f*N.length));n.textContent=N[k].toLocaleString();}
  if(f>=1&&!R.replDone){R.replDone=true;snd(660,.3,'triangle',.07);snd(990,.4,'triangle',.07,.2);const nb2=root.querySelector('#isNext');const tx=root.querySelector('.is-nar .txt');
   if(tx)tx.innerHTML=`<small>Ride Operator ${NAME}</small>BILLIONS of molecules! The shrink ray has <b>STOPPED</b>! 🎉 Phew… wait. Why did everything just go quiet…?`;if(nb2){nb2.disabled=false;nb2.textContent='Next ➜';onNext();}}});}

/* 7. the giant eye */
function eye(){const s=R.s,t=tier();const EYE_SVG=`<div class="is-eyewrap" id="isEye"><svg class="is-svg" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid slice"><rect width="960" height="600" fill="#0c0c14"/>
 <circle cx="480" cy="280" r="290" fill="#1e1e2e"/><circle cx="480" cy="280" r="270" fill="none" stroke="#343a40" stroke-width="24"/>
 <ellipse cx="480" cy="270" rx="240" ry="130" fill="#f8f9fa"/><g class="is-pupil"><circle cx="480" cy="270" r="100" fill="#1971c2"/>${Array.from({length:24},(_,i)=>`<line x1="${480+Math.cos(i*.26)*45}" y1="${270+Math.sin(i*.26)*45}" x2="${480+Math.cos(i*.26)*92}" y2="${270+Math.sin(i*.26)*92}" stroke="#4dabf7" stroke-width="3" opacity=".6"/>`).join('')}<circle cx="480" cy="270" r="44" fill="#050505"/><circle cx="455" cy="245" r="16" fill="#fff" opacity=".9"/></g>
 <g class="is-lid"><path d="M230 270 Q480 20 730 270 Q480 150 230 270Z" fill="#e8b98f"/><path d="M230 270 Q480 150 730 270 Q480 400 230 270Z" fill="#e8b98f"/></g>
 <path d="M240 270 Q480 40 720 270" fill="none" stroke="#343a40" stroke-width="4"/><path d="M200 120 Q480 -30 760 120" stroke="#f1f3f5" stroke-width="46" fill="none" stroke-linecap="round"/><path d="M220 112 Q480 -18 740 112" stroke="#dee2e6" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="6 16"/>${Array.from({length:14},(_,i)=>`<path d="M${480+(i-6.5)*30} ${140+Math.abs(i-6.5)*8} q${(i-6.5)*2} -30 ${(i-6.5)*4} -44" stroke="#343a40" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}
 <rect x="330" y="505" width="300" height="24" rx="4" fill="rgba(200,235,255,.5)" stroke="#d0ebff" stroke-width="2"/><g transform="translate(480 492) scale(.16)"><path d="M-66 10 Q-70 -20 -40 -26 L40 -26 Q70 -20 66 10 Q60 34 0 34 Q-60 34 -66 10Z" fill="#7048e8"/><path d="M-50 -24 Q-44 -70 0 -74 Q44 -70 50 -24Z" fill="rgba(180,230,255,.7)"/></g></svg></div>`;const QZ=window.Quartz&&Quartz.SVG?`<div style="width:54px;height:54px">${Quartz.SVG}</div>`:'🧑‍🔬';
 // 1) lights out: a little spooky, told by Ozzy in the dark
 const DARK=[['Huh? The lights just went OUT. 😨 Stay in your seat…',2600],['Did you feel that? <b>*rumble*</b> I think we\'re… moving!',2800],['Something just picked us up… and set us down on something flat and glassy. 😬',3000],['Wait… is this a <b>MICROSCOPE SLIDE</b>?! What in the world is happening?!',3000]];
 const LIT=[`Ha ha! Don't be scared, ${NM()}! It's ME, <b>Dr. Quartz</b>! 👋 I'm looking at you through my microscope. You look SO tiny!`,
  `I watched the whole thing. You built <b>${esc(s.n.toLowerCase())}</b> (${s.f}) all by yourself, one atom at a time. ${['Very well done, little scientist!','Outstanding work! That is real chemistry!','Excellent. Real chemists would be proud of that!'][t]} 🎉`,
  `Your mission is complete! Now it's time to return to your normal size. Hold on tight… here we GROW!`];
 let step=0,lit=false,timer=null;const tok=R;
 frame(`${EYE_SVG.replace('id="isEye"','id="isEye" style="opacity:0"')}<div class="is-dark" id="isDark"></div>
  <div id="isNarBox">${nar(DARK[0][0],'Next ➜')}</div>`);
 const box=()=>root&&root.querySelector('#isNarBox');
 const say=(html,btn,opts)=>{const b=box();if(b)b.innerHTML=nar(html,btn,opts);};
 snd(90,1.2,'sine',.06);
 const darkNext=()=>{if(!root||R!==tok)return;step++;
  if(step<DARK.length){say(DARK[step][0],'Next ➜');snd(step===1?70:110,step===1?1.4:.6,'sine',.07);onNext(darkNext);return;}
  {const b=root.querySelector('#isNext');if(b){b.disabled=true;b.textContent='…';}}
  // 2) the lights come on slowly (no flash) and there's a giant eye
  lit=true;const d=root.querySelector('#isDark'),e=root.querySelector('#isEye');if(e){e.style.transition='opacity 2.5s ease';e.style.opacity='1';}if(d){d.style.transition='opacity 2.5s ease';d.style.opacity='0';}
  snd(200,.5,'sine',.06,.8);timer=setTimeout(()=>{if(!root||R!==tok)return;litStep(0);},2600);};
 // the middle Dr. Quartz line switches to HIS view: full size, in his lab, peering into the microscope (we're far too small to see)
 const labSVG=()=>{   // side view: Dr. Quartz behind his desk, bent over the microscope with his eye on the eyepiece
  // proportions/pose: a big adult body leaning in, head bent to the eyepiece, both hands on the focus knob (original drawing)
  const body=`<g id="isQzSide">
   <path d="M410 246 Q364 254 350 316 Q338 400 344 640 L482 640 L480 420 Q480 300 456 258Z" fill="#fff" stroke="#c9d1db" stroke-width="3"/>
   <path d="M366 340 Q360 430 366 520" stroke="#dde3ea" stroke-width="4" fill="none"/>
   <path d="M424 250 L466 330 L474 262Z" fill="#4c9be8"/><path d="M438 262 L452 274 L462 262 L456 300 L450 306Z" fill="#e8590c"/>
   <path d="M420 238 L430 262 L462 256 L452 230Z" fill="#f5d0a9"/>
   <g transform="rotate(14 440 206)">
    <circle cx="440" cy="204" r="44" fill="#f5d0a9"/>
    <path d="M478 196 Q496 204 484 220 Q480 224 476 216" fill="#f5d0a9" stroke="#e0b48a" stroke-width="2"/>
    <path d="M404 206 Q388 150 424 148 Q432 128 454 140 Q476 130 482 152 Q496 160 484 176 Q470 162 452 168 Q430 160 420 180 Q414 196 416 214 Q400 232 392 218 Q380 204 394 196 Q382 180 398 174Z" fill="#f1f3f5" stroke="#ced4da" stroke-width="2"/>
    <ellipse cx="428" cy="210" rx="8" ry="11" fill="#efc198" stroke="#e0b48a" stroke-width="2"/>
    <path d="M458 180 Q470 175 482 181" stroke="#dee2e6" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="474" cy="194" r="12" fill="#e7f5ff" stroke="#343a40" stroke-width="3"/><path d="M462 194 L432 198" stroke="#343a40" stroke-width="3"/><path d="M470 196 q4 -3 8 0" stroke="#343a40" stroke-width="2.5" fill="none"/>
    <path d="M458 226 Q466 231 474 226" stroke="#a0522d" stroke-width="2.5" fill="none" stroke-linecap="round"/></g></g>`;
  const scope=`<g><rect x="560" y="404" width="170" height="22" rx="7" fill="#343a40"/><path d="M700 404 Q742 330 700 250" stroke="#495057" stroke-width="28" fill="none" stroke-linecap="round"/>
   <rect x="562" y="338" width="140" height="12" rx="3" fill="#495057"/><rect x="592" y="333" width="76" height="6" fill="rgba(200,235,255,.9)" stroke="#a5d8ff"/>
   <circle cx="628" cy="336" r="3" fill="#fff"><animate attributeName="opacity" values=".3;1;.3" dur="1.6s" repeatCount="indefinite"/></circle>
   <rect x="612" y="278" width="32" height="54" rx="4" fill="#343a40"/><rect x="619" y="326" width="18" height="10" fill="#868e96"/>
   <path d="M640 282 L700 256" stroke="#495057" stroke-width="16" stroke-linecap="round"/>
   <path d="M620 286 L524 216" stroke="#343a40" stroke-width="30" stroke-linecap="round"/><path d="M524 216 L503 204" stroke="#212529" stroke-width="28" stroke-linecap="round"/>
   <circle cx="690" cy="360" r="14" fill="#868e96"/><circle cx="690" cy="360" r="6" fill="#495057"/></g>`;
  const arm=`<path d="M386 300 Q386 402 432 406 Q506 402 574 364" stroke="#fff" stroke-width="32" fill="none" stroke-linecap="round"/><path d="M386 300 Q386 402 432 406 Q506 402 574 364" stroke="#c9d1db" stroke-width="3" fill="none" stroke-dasharray="1 0" opacity=".6"/>
   <circle cx="592" cy="352" r="17" fill="#f1c8a0" stroke="#e0b48a" stroke-width="2"/><path d="M584 340 q10 -8 18 2" stroke="#e0b48a" stroke-width="2" fill="none"/>`;
  return `<svg class="is-svg" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="isLabW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbe4ff"/><stop offset="1" stop-color="#bac8ff"/></linearGradient><radialGradient id="isLamp" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff9db" stop-opacity=".9"/><stop offset="1" stop-color="#fff9db" stop-opacity="0"/></radialGradient></defs>
  <rect x="-400" y="-300" width="1760" height="1200" fill="url(#isLabW)"/>
  <rect x="40" y="60" width="220" height="150" rx="8" fill="#a5d8ff" stroke="#fff" stroke-width="10"/><path d="M150 60 V210 M40 135 H260" stroke="#fff" stroke-width="6"/>
  ${[[680,120],[680,210]].map(([x,y])=>`<rect x="${x}" y="${y}" width="320" height="10" fill="#8d5a2b"/>`).join('')}
  ${[[690,'#ff8787',60],[745,'#69db7c',44],[795,'#74c0fc',70],[860,'#ffd43b',50],[915,'#da77f2',64]].map(([x,c,hh],i)=>i%2?`<path d="M${x} ${120-hh} h16 v${hh*.4} l14 ${hh*.6-4} q0 4 -4 4 h-36 q-4 0 -4 -4 l14 ${-(hh*.6-4)}z" fill="${c}" opacity=".85" stroke="#495057" stroke-width="2"/>`:`<rect x="${x}" y="${120-hh}" width="26" height="${hh}" rx="4" fill="${c}" opacity=".85" stroke="#495057" stroke-width="2"/>`).join('')}
  ${[700,760,830,900].map((x,i)=>`<rect x="${x}" y="${210-30-(i%3)*8}" width="${40+(i%2)*10}" height="${30+(i%3)*8}" fill="${['#e64980','#1c7ed6','#f08c00','#2f9e44'][i]}" rx="3"/>`).join('')}
  <path d="M520 0 L460 60 H580Z" fill="#495057"/><ellipse cx="520" cy="200" rx="330" ry="240" fill="url(#isLamp)"/>
  <rect x="-400" y="520" width="1760" height="400" fill="#9775fa" opacity=".18"/>
  ${body}
  <rect x="520" y="426" width="900" height="30" fill="#8d5a2b"/><rect x="540" y="456" width="860" height="400" fill="#5c3b1e"/>
  ${scope}${arm}
  <g transform="translate(770 398)"><path d="M0 28 h36 l-6 -22 v-18 h-24 v18z" fill="#b2f2bb" stroke="#495057" stroke-width="2"/><rect x="60" y="0" width="54" height="28" rx="3" fill="#fff3bf" stroke="#adb5bd"/><path d="M66 9 h40 M66 17 h30" stroke="#adb5bd" stroke-width="2"/></g></svg>`;};
 const lab=on=>{let L=root&&root.querySelector('#isLab');if(on&&!L){L=document.createElement('div');L.id='isLab';L.className='is-eyewrap';L.style.opacity='0';L.style.transition='opacity 1.2s ease';L.innerHTML=labSVG();const nb=root.querySelector('#isNarBox');nb.parentNode.insertBefore(L,nb);requestAnimationFrame(()=>requestAnimationFrame(()=>{L.style.opacity='1';}));snd(520,.3,'triangle',.04);}
  else if(!on&&L){L.style.opacity='0';setTimeout(()=>L.remove(),1300);}};
 const litStep=k=>{lab(k===1);const last=k>=LIT.length-1;say(LIT[k],last?'🌱 Grow back to normal size!':'Next ➜',{who:QZ,name:'Dr. Quartz',cls:last?'gold':''});
  onNext(()=>{if(!last){litStep(k+1);return;}const dk=root.querySelector('#isDark');if(dk){dk.style.transition='opacity 1.8s ease';dk.style.opacity='1';}[300,400,500,650,800].forEach((f,q)=>snd(f,.25,'triangle',.05,q*.3));const b=root.querySelector('#isNext');if(b)b.disabled=true;setTimeout(()=>{if(root)next();},2000);});};
 onNext(darkNext);
 R.eyeTimer=timer;}

/* 8. quiz → coins + album card */
const riseShip=()=>`<div class="is-riseship"><svg viewBox="-80 -84 160 132"><path d="M-58 40 l-10 18 M0 40 v22 M58 40 l10 18" stroke="#ffd43b" stroke-width="5" stroke-linecap="round" opacity=".5"/>${heroTag(-24,-76,48)}<path d="M-50 -24 Q-44 -70 0 -74 Q44 -70 50 -24Z" fill="rgba(180,230,255,.38)" stroke="#9fd8ff" stroke-width="3"/><path d="M-66 10 Q-70 -20 -40 -26 L40 -26 Q70 -20 66 10 Q60 34 0 34 Q-60 34 -66 10Z" fill="#7048e8" stroke="#3b1f9e" stroke-width="4"/><circle cx="-48" cy="2" r="7" fill="#ffd43b"/><circle cx="48" cy="2" r="7" fill="#ffd43b"/></svg></div>`;
function quiz(){const s=R.s,t=tier();const Q=s.quiz[t];R.qMax=Q.reduce((a,_,i)=>a+10*(i+1),0);let qi=0,score=0,tries=0,answered=false;R.firstTry=0;R.qT0=performance.now();
 const draw=(why,okIdx,bad)=>{const q=Q[qi];R.sz=Math.max(0,Math.round(8*(1-(qi+(answered?1:0))/Q.length)));
  const el=(performance.now()-R.qT0)/1000;const rings=Array.from({length:6},(_,i)=>`<i class="is-rring" style="animation-delay:-${((el+i)%6).toFixed(2)}s"></i>`).join('');
  frame(`<div class="is-quiz is-rise">${rings}${riseShip()}<div class="is-risetxt">⬆️ Growing back to normal size…</div><div class="is-q"><div class="h">🧪 RIDE QUIZ · Question ${qi+1} of ${Q.length} · ⭐ ${score} points</div><div class="qq">${esc(q[0])}</div>
   ${q[1].map((o,k)=>`<button class="is-opt ${okIdx===k?'ok':(bad||[]).includes(k)?'no':''}" data-k="${k}" ${answered||(bad||[]).includes(k)?'disabled':''}>${esc(o)}${okIdx===k?' ✅':''}</button>`).join('')}
   ${why?`<div class="is-why">${why}</div><div style="text-align:right;margin-top:10px"><button class="is-btn" id="isQN">${qi<Q.length-1?'Next question ➜':'Finish growing ➜'}</button></div>`:''}</div></div>`);
  root.querySelectorAll('.is-opt:not([disabled])').forEach(b=>b.onclick=()=>{const k=+b.dataset.k;
   if(k===q[2]){answered=true;const got=tries===0?10*(qi+1):5*(qi+1);if(tries===0)R.firstTry++;score+=got;snd(880,.15,'triangle',.08);snd(1320,.2,'triangle',.08,.1);draw(`<b>+${got} points!</b> ${esc(q[3])}`,k,bad);}
   else{tries++;snd(200,.3,'sine',.07);if(tries>=2){answered=true;draw(`The answer is <b>${esc(q[1][q[2]])}</b>. ${esc(q[3])}`,q[2],(bad||[]).concat(k));}else draw(null,null,(bad||[]).concat(k));}});
  const n=root.querySelector('#isQN');if(n)n.onclick=()=>{if(qi<Q.length-1){qi++;tries=0;answered=false;draw();}else home(score);};};
 const rings=Array.from({length:6},(_,i)=>`<i class="is-rring" style="animation-delay:-${i}s"></i>`).join('');
 frame(`<div class="is-quiz is-rise">${rings}${riseShip()}<div class="is-risetxt">⬆️ Growing back to normal size…</div></div>${nar(`Here we go, ${NM()}, we're <b>growing back</b>! 🚀 It's a long way up to normal size, so now is the perfect time to <b>test your knowledge</b>. Ready for the ride quiz?`,'🧪 Start the quiz ➜')}`);
 onNext(()=>draw());}

/* Ozzy's words match how the quiz really went */
function quizLine(score){const mx=R.qMax||60,f=score/mx;
 return f>=1?'and <b>aced the quiz</b>. What a scientist! 🎉':f>=.6?'and did <b>great on the quiz</b>. What a scientist! 🎉':score>0?'and finished the quiz. Some questions were tricky, but every one teaches you something! 🎉':'and finished the quiz. Those questions were tough! Now you know the answers for next time. 🎉';}
/* back at the start line, normal size again */
function home(score){R.score=score;const k=document.createElement('div');k.className='is-black on';k.style.transition='opacity 1.2s';k.style.opacity='0';root.appendChild(k);requestAnimationFrame(()=>{k.style.opacity='1';});snd(440,.3,'triangle',.05);snd(660,.4,'triangle',.05,.3);
 setTimeout(()=>{if(!root)return;R.sz=0;R.fresh=true;
  frame(`<svg class="is-svg" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet"><rect x="-600" y="-900" width="2160" height="2400" fill="#2b1d5c"/>${Array.from({length:40},(_,i)=>`<circle cx="${(i*97)%960}" cy="${(i*53)%300}" r="${1+i%3*.6}" fill="#fff" opacity=".6"/>`).join('')}
   <rect x="-600" y="430" width="2160" height="470" fill="#3d2b7a"/><path d="M-600 470 H1560" stroke="#ffd43b" stroke-width="6" stroke-dasharray="30 20"/>
   <path d="M592 474 Q606 306 690 258 Q752 224 816 250 Q892 292 902 474Z" fill="#5c4a3d" stroke="#3b2f25" stroke-width="5"/><path d="M672 474 Q672 350 746 342 Q820 350 820 474Z" fill="#140a2e" stroke="#2b1d5c" stroke-width="6"/>
   <g transform="translate(480 150)"><rect x="-190" y="-44" width="380" height="84" rx="16" fill="#fff4e6" stroke="#8d5a2b" stroke-width="6"/><text x="0" y="12" font-size="40" font-weight="800" fill="#5f3dc4" text-anchor="middle">🎉 WELCOME BACK!</text></g>
   <g transform="translate(330 452) scale(.9)">${OZ_BODY}<path d="M-24 -18 L-22 30 L22 30 L24 -18Z" fill="#ae3ec9"/><path d="M-10 30 V52 M10 30 V52" stroke="#343a40" stroke-width="8" stroke-linecap="round"/><path d="M22 -12 Q40 -30 46 -46" stroke="#ae3ec9" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="46" cy="-48" r="6" fill="#f1c8a0"/></g>
   <g transform="translate(520 440)"><ellipse cx="0" cy="38" rx="70" ry="10" fill="rgba(0,0,0,.25)"/>${heroTag(-24,-76,48)}<path d="M-50 -24 Q-44 -70 0 -74 Q44 -70 50 -24Z" fill="rgba(180,230,255,.38)" stroke="#9fd8ff" stroke-width="3"/><path d="M-66 10 Q-70 -20 -40 -26 L40 -26 Q70 -20 66 10 Q60 34 0 34 Q-60 34 -66 10Z" fill="#7048e8" stroke="#3b1f9e" stroke-width="4"/><circle cx="-48" cy="2" r="7" fill="#ffd43b"/><circle cx="48" cy="2" r="7" fill="#ffd43b"/></g></svg>
   ${nar(`We made it! You're back to <b>normal size</b>, ${NM()}! You fixed the Molecule Builder, stopped the shrink ray, ${quizLine(score)}`,'🃏 See my card ➜',{cls:'gold'})}`);
  onNext(()=>card(score));},1300);}
/* the ride counts as soon as the quiz is done — even if the app is closed before the card screen — so the ticket is used up and Ozzy doesn't repeat the same ride */
function commit(score){if(R.committed)return R.committed;const s=R.s,p=PL||P();const st=S(p);const first=st.album[s.id]==null;const best=Math.max(st.album[s.id]||0,score);st.album[s.id]=best;
 const coins=score+(first?FIRST_BONUS:0);p.coins=(p.coins||0)+coins;
 if(!R.t.demo){const k=st.tix.findIndex(x=>x.id===s.id);if(k>=0)st.tix.splice(k,1);else st.tix.shift();}
 st.rides++;st.last=typeof dayKey==='function'?dayKey():'';st.pts=(st.pts||0)+score;st.after=(p.battles||0)+WAIT_BATTLES;st.decl=0;
 const n=Object.keys(st.album).length,all=n>=D.SUB.length;let prize=false;
 if(all&&!st.prize){st.prize=1;prize=true;p.owned.robes=p.owned.robes||[];if(!p.owned.robes.includes('labcoat'))p.owned.robes.push('labcoat');p.coins+=PRIZE_COINS;}
 R.finished=true;save();R.committed={first,coins,prize,n,all,best};return R.committed;}
function card(score){const s=R.s,p=PL;const st=S(p);const {first,coins,prize,n,all,best}=commit(score);R.i=SCENES.length;
 frame(`<div class="is-quiz"><div class="is-card"><div style="font-weight:700;color:#e67700">📖 ${first?'NEW MOLECULE ALBUM CARD!':'ALBUM CARD'}</div><canvas id="isCard" width="300" height="170" style="width:100%;max-width:300px"></canvas><div class="n">${esc(s.n)} · ${s.f}</div>
  <ul><li>⚛️ ${Object.entries(s.atoms).map(([e,k])=>`${s.elem?'':k+' '}${EL[e].n.toLowerCase()}`).join(' + ')}</li>${s.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>
  <div style="font-weight:700">⭐ ${score} / 60 points${score<best?` · your best: ${best}`:''}</div>
  <div class="is-coins">🪙 +${coins} coins${first?` <small>(includes +${FIRST_BONUS} new-card bonus)</small>`:''}</div>
  <div style="color:#e67700;font-weight:700;margin-top:4px">📖 Album: ${n} / ${D.SUB.length}${all?' — COMPLETE! 🎉':''}</div></div>
  <div class="is-endcol">${prize?`<div class="is-prize">🥼 <b>ALBUM COMPLETE!</b><br>You earned the <b>Lab Coat</b> robe and 🪙 ${PRIZE_COINS} bonus coins! Put it on in your backpack.</div>`:''}
  ${st.tix.length&&!R.t.demo?`<div class="is-more">🎟️ You still have ${st.tix.length} ticket${st.tix.length>1?'s':''}. ${NAME} will come back for you after a few battles!</div>`:''}
  <button class="is-btn gold" id="isHome">🗺️ Back to the adventure</button><button class="is-btn" id="isAlb">📖 My album</button></div></div>`);
 fitMol(root.querySelector('#isCard').getContext('2d'),s.lay,300,170);
 root.querySelector('#isHome').onclick=exit;root.querySelector('#isAlb').onclick=albumScreen;
 if(!R.t.demo)st.after=(p.battles||0)+WAIT_BATTLES;
 try{SFX.coin();}catch(e){}snd(660,.2,'triangle',.06);snd(990,.3,'triangle',.06,.15);if(prize)try{SFX.level();}catch(e){}}

/* ---------- the Molecule Album ---------- */
function albumHTML(p){const st=S(p);const n=Object.keys(st.album).length;
 return `<div class="is-album"><div class="is-ahead">📖 Molecule Album · <b>${n} / ${D.SUB.length}</b>${st.prize?' · 🥼 Lab Coat earned!':` · fill all ${D.SUB.length} to win the 🥼 Lab Coat robe`}</div>
 <div class="is-agrid">${D.SUB.map(s=>st.album[s.id]!=null?`<div class="is-acard done"><span class="e">${s.e}</span><b>${esc(s.n)}</b><small>${s.f}</small><em>⭐ ${st.album[s.id]}</em></div>`:`<div class="is-acard"><span class="e" style="filter:grayscale(1) brightness(.4);opacity:.45">${s.e}</span><b>???</b><small>Ride to unlock</small></div>`).join('')}</div></div>`;}
function albumScreen(){frame(`<div class="is-quiz">${albumHTML(PL)}<div class="is-endcol"><button class="is-btn gold" id="isHome">🗺️ Back to the adventure</button></div></div>`);root.querySelector('#isHome').onclick=exit;}
function albumModal(){const p=P();modal(`<div class="mcard" style="max-width:560px">${albumHTML(p)}<div class="row"><button class="btn green" onclick="closeModal()">Close</button></div></div>`);}
function bagHTML(p){const st=S(p);if(!st.met&&!st.tix.length&&!Object.keys(st.album).length)return '';const n=Object.keys(st.album).length;
 return `<div class="tr-hoardbox" style="background:#5f3dc4"><b>🎢 Inner Space</b> · 🎟️ Shrink Tickets: <b>${st.tix.length}</b>/${TIX_MAX} · 📖 Molecule Album: <b>${n}</b>/${D.SUB.length} <span style="font-size:20px">${D.SUB.filter(s=>st.album[s.id]!=null).map(s=>s.e).join('')}</span>
 <button class="btn small" style="margin-left:6px" onclick="Inner.album()">📖 Open album</button><br><small>Dr. Quartz gives you a Shrink Ticket after each cave trip. ${NAME} picks you up for the ride!${st.prize?'':' Fill the album to win the 🥼 Lab Coat robe.'}</small></div>`;}


/* ---------- after the ride: Ozzy pulls up next to you, explains how to ride again, and drives off ---------- */
const MOD_BYE={draw:drawMob,meet(){}};
function farewell(p){try{if(typeof curScreen==='undefined'||curScreen!=='world'||!W||!W.T||!p)return;
 let spot=null;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=W.hx+dx,y=W.hy+dy,t=W.T[y]&&W.T[y][x];if(t&&!t.block&&!t.water&&!t.npc&&!t.gate&&!t.chest&&!W.mobs.some(m=>m.x===x&&m.y===y)){spot=[x,y,t];break;}}
 if(!spot)return;const m={id:'ozzyBye',byeOzzy:true,mod:MOD_BYE,x:spot[0],y:spot[1],fx:spot[0],fy:spot[1],e:'🚗',n:NAME,b:spot[2].b};m.st='talk';W.mobs=W.mobs.filter(o=>!o.byeOzzy);W.mobs.push(m);window.visitorQuiet=Math.max(window.visitorQuiet||0,Date.now()+60e3);
 snd(660,.12,'square',.04);snd(660,.12,'square',.04,.2);
 const st=S(p),n=Object.keys(st.album).length,tot=ORDER.length;
 const lines=[`What a ride, ${esc(p.name)}! 🎢 You shrank all the way down <b>inside an atom</b> and made it back in one piece!`,
  st.tix.length?`You still have <b>${st.tix.length} 🎟️ Shrink Ticket${st.tix.length>1?'s':''}</b>! Win a few more battles and I'll come back to pick you up.`
  :`Want to ride again? Here's how: go on a <b>Science Cave</b> trip with <b>🔬 Dr. Quartz</b>. After a trip he hands out <b>🎟️ Shrink Tickets</b>. When you have one, win a few battles and I'll drive over to pick you up!`,
  n<tot?`You have <b>${n} of ${tot}</b> Inner Space cards. Collect them all for a special prize! 🥼 See you next time!`:`You collected ALL ${tot} Inner Space cards. You're a true atom explorer! 🥼 See you next time!`];
 let i=0;const show=()=>{const last=i>=lines.length-1;
  modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av oz-av">${OZZY_CAR}</div><div class="qz-bub oz-bub"><b>🎢 ${NAME} · Ride Operator</b><div>${lines[i]}</div></div></div>
   <div class="row"><button class="btn green big" id="ozBye">${last?'Bye, '+NAME+'! 👋':'Next ➜'}</button></div></div>`);
  document.getElementById('ozBye').onclick=()=>{if(!last){i++;show();return;}closeModal();driveOff(m);};};
 show();}catch(e){}}
function driveOff(m){if(m.st==='drive')return;m.st='drive';snd(520,.1,'square',.04);snd(700,.1,'square',.04,.15);
 // head for a spot far away, one tile at a time, then vanish
 let target=null;for(let tries=0;tries<200&&!target;tries++){const a=Math.random()*Math.PI*2,d=11+Math.random()*4;const x=Math.round(m.x+Math.cos(a)*d),y=Math.round(m.y+Math.sin(a)*d);const t=W.T[y]&&W.T[y][x];if(t&&!t.block&&!t.water&&!t.npc&&!t.gate&&!t.chest)target=[x,y];}
 const path=target?pathTo(m.x,m.y,target[0],target[1]):null;let k=0,n=0;
 const iv=setInterval(()=>{n++;const gone=()=>{clearInterval(iv);if(W)W.mobs=W.mobs.filter(o=>o!==m);};
  if(typeof curScreen==='undefined'||curScreen!=='world'||!W||!path||k>=path.length||n>60){gone();return;}
  const [x,y]=path[k];if(x===W.hx&&y===W.hy){return;}m.fx=m.x;m.fy=m.y;m.x=x;m.y=y;m.mt=performance.now();k++;if(k>=8&&k%2===0){}},230);}

/* ---------- loops ---------- */
setInterval(()=>{try{
 if(root&&typeof curScreen!=='undefined'&&curScreen!=='inner'){ // time's up (play-time bank) or the screen changed → close the ride; the ticket is kept
  if(R&&!DEMO){if(!R.finished&&R.score!=null)commit(R.score);else if(!R.finished)later(PL||P());}close();R=null;if(DEMO&&DEMO!==true){const p=PL||P();const d=JSON.parse(DEMO);DEMO=null;if(d.inner)p.inner=d.inner;else delete p.inner;p.coins=d.coins;p.owned.robes=d.robes;save();}PL=null;}
 if(busy&&!root&&!document.querySelector('#modal.show .oz-bub'))busy=false; /* another popup replaced Ozzy's → don't get stuck */
 tick();}catch(e){}},330);
function tick(){try{
 if(typeof curScreen==='undefined'||curScreen!=='world'||typeof W==='undefined'||!W||!W.T||busy||window.trollBusy)return;const p=P();if(!p)return;
 {const bye=W.mobs.find(m=>m.byeOzzy);if(bye){if(bye.st==='talk'&&!document.querySelector('#modal.show'))driveOff(bye);return;}}
 if(!wants(p)){if(W.mobs.some(m=>m.ozzy)&&!wants(p,true)){W.mobs=W.mobs.filter(m=>!m.ozzy);rel();}return;} /* quiet time → he waits where he is */
 if(W.mobs.some(m=>m.quartz))return; // Dr. Quartz goes first
 if(!W.mobs.some(m=>m.ozzy)){if(document.querySelector('#modal.show'))return;
  const v=VQ();if(v&&!v.claim('ozzy',30*60e3)){v.wait('ozzy',tick);return;} /* another visitor's turn: get in line */
  spawn();if(!W.mobs.some(m=>m.ozzy))rel();}
 else walk(performance.now());}catch(e){}}
if(/innerdemo/.test(location.search)){const iv=setInterval(()=>{try{const p=P();if(p&&p.setup&&curScreen==='world'){clearInterval(iv);DEMO=true;toast(`🎢 Inner Space preview: ${NAME} is on his way…`);}}catch(e){}},500);}

/* ---------- styles (all scoped to the ride) ---------- */
const st=document.createElement('style');st.textContent=`
#isRoot{position:fixed;inset:0;z-index:5000;background:#140a2e;font-family:'Fredoka',system-ui,sans-serif;color:#1f2340;overflow:hidden;-webkit-user-select:none;user-select:none}
#isRoot button{font-family:inherit;cursor:pointer}
#isRoot .is-stage{position:absolute;inset:0;display:flex;flex-direction:column}
#isRoot .is-top{position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;right:10px;display:flex;justify-content:space-between;align-items:center;z-index:7;pointer-events:none}
#isRoot .is-top>*{pointer-events:auto}#isRoot .is-chip{background:rgba(0,0,0,.55);color:#fff;border-radius:14px;padding:5px 12px;font-weight:700;font-size:15px}
#isRoot .is-dots{display:flex;gap:6px}#isRoot .is-dots i{width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.3)}#isRoot .is-dots i.on{background:#ffd43b}#isRoot .is-dots i.done{background:#8ce99a}
#isRoot .is-x{border:none;background:rgba(0,0,0,.55);color:#fff;border-radius:50%;width:44px;height:44px;min-width:44px;flex:0 0 auto;font-size:18px}
#isRoot canvas.is-cv{position:absolute;inset:0;width:100%;height:100%}
#isRoot .is-svg{position:absolute;inset:0;width:100%;height:100%}#isRoot .is-svg.is-tall{overflow:visible;top:56px;height:calc(100% - 290px)}#isRoot .is-stage:has(.is-tall){background:#2b1d5c}
#isRoot .is-nar{position:absolute;left:14px;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:6;background:rgba(255,255,255,.96);border:4px solid #7048e8;border-radius:20px;padding:12px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 6px 0 rgba(0,0,0,.25);max-width:880px;margin:0 auto}
#isRoot .is-nar .who{flex:0 0 auto;width:54px;height:54px}#isRoot .is-nar .who svg{width:54px;height:54px}#isRoot .is-nar .txt{flex:1;font-size:clamp(16px,2.6vw,20px);line-height:1.4}#isRoot .is-nar .txt b{color:#7048e8}
#isRoot .is-nar .txt small{display:block;color:#7048e8;font-weight:700;font-size:13px;letter-spacing:.5px;text-transform:uppercase}
#isRoot .is-btn{border:none;background:#7048e8;color:#fff;font-size:19px;font-weight:700;border-radius:16px;padding:12px 18px;box-shadow:0 4px 0 #3b1f9e;white-space:nowrap}
#isRoot .is-btn:disabled{opacity:.45}#isRoot .is-btn.gold{background:#fcc419;color:#5c3d00;box-shadow:0 4px 0 #b08900}#isRoot .is-btn.green{background:#2ecc71;box-shadow:0 4px 0 #1e9e55}
#isRoot .is-panel{position:absolute;z-index:4;background:rgba(255,255,255,.96);border-radius:18px;padding:12px 14px;font-size:17px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
#isRoot .is-panel h3{margin:0 0 6px;font-size:18px;color:#5f3dc4}
#isRoot .is-cnt{display:flex;align-items:center;gap:8px;margin:4px 0;font-weight:700}#isRoot .is-ball{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;box-shadow:inset -3px -3px 0 rgba(0,0,0,.2)}
#isRoot .is-meter{position:absolute;left:14px;top:60px;z-index:4;background:rgba(20,10,46,.75);border:2px solid #b197fc;border-radius:16px;padding:10px 14px;color:#fff;min-width:230px}
#isRoot .is-meter div{display:flex;justify-content:space-between;gap:16px;font-size:17px;opacity:.35;transition:all .3s}#isRoot .is-meter div.on{opacity:1;color:#ffd43b;font-weight:700;transform:scale(1.06)}#isRoot .is-meter div.past{opacity:.7}
#isRoot .is-build{position:absolute;inset:0;background:#f3f0ff;overflow:auto;padding:60px 14px 150px;display:flex;flex-direction:column;align-items:center;gap:12px}
#isRoot .is-build h2{margin:0;color:#5f3dc4;font-size:clamp(22px,4vw,30px);text-align:center}
#isRoot .is-brow{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-start;width:100%;max-width:900px}
#isRoot .is-tray,#isRoot .is-recipe{background:#fff;border-radius:20px;padding:12px;border:3px solid #dee2e6;min-width:170px}
#isRoot .is-tray h4,#isRoot .is-recipe h4{margin:0 0 8px;text-align:center;color:#495057;letter-spacing:1px}
#isRoot .is-tray .atoms{display:grid;grid-template-columns:repeat(2,64px);gap:10px;justify-content:center}
#isRoot .is-atom{width:64px;height:64px;border-radius:50%;border:none;font-size:22px;font-weight:800;box-shadow:inset -5px -6px 0 rgba(0,0,0,.18),0 4px 0 rgba(0,0,0,.15);padding:0}
#isRoot .is-atom small{display:block;font-size:10px;font-weight:600}
#isRoot .is-area{width:min(420px,92vw);aspect-ratio:1.15;background:#fff;border:4px dashed #b197fc;border-radius:26px;position:relative;overflow:hidden}
#isRoot .is-area.done{border-style:solid;border-color:#51cf66}
#isRoot .is-recipe .f{font-size:36px;font-weight:800;text-align:center;color:#1f2340}#isRoot .is-recipe li{list-style:none;font-size:17px;margin:4px 0}#isRoot .is-recipe ul{padding:0;margin:6px 0}
#isRoot .is-buzz{min-height:28px;font-size:18px;font-weight:700;color:#c92a2a;text-align:center}
#isRoot .is-quiz{position:absolute;inset:0;background:linear-gradient(#2b1d5c,#5f3dc4);overflow:auto;padding:60px 14px 30px;display:flex;flex-wrap:wrap;gap:16px;justify-content:center;align-items:flex-start}
#isRoot .is-q{background:#fff;border-radius:22px;padding:16px 18px;width:min(560px,94vw)}
#isRoot .is-q .h{font-size:15px;font-weight:700;color:#7048e8}#isRoot .is-q .qq{font-size:clamp(20px,3.4vw,24px);font-weight:700;margin:8px 0 12px}
#isRoot .is-opt{display:block;width:100%;text-align:left;margin:8px 0;padding:12px 16px;border-radius:14px;font-size:19px;font-weight:700;border:3px solid #d0bfff;background:#f8f5ff;color:#1f2340}
#isRoot .is-opt.ok{border-color:#2ecc71;background:#ebfbee}#isRoot .is-opt.no{border-color:#fa5252;background:#fff5f5;opacity:.6;text-decoration:line-through}
#isRoot .is-why{background:#fff9db;border-radius:12px;padding:10px 12px;font-size:17px;margin-top:6px}
#isRoot .is-card{background:#fff9db;border:5px solid #fcc419;border-radius:22px;padding:14px;width:min(340px,94vw);text-align:center}
#isRoot .is-card .n{font-size:28px;font-weight:700}#isRoot .is-card ul{text-align:left;padding-left:18px;font-size:16px;margin:8px 0}
#isRoot .is-coins{margin-top:6px;font-size:20px;font-weight:700;color:#2b8a3e}#isRoot .is-coins small{font-size:13px;color:#495057}
#isRoot .is-endcol{display:flex;flex-direction:column;gap:12px;align-self:center;max-width:340px;width:min(340px,94vw)}
#isRoot .is-prize{background:#fff;border:4px solid #74c0fc;border-radius:18px;padding:12px;font-size:17px;text-align:center}
#isRoot .is-more{background:rgba(255,255,255,.14);color:#fff;border-radius:14px;padding:10px 12px;font-size:16px}
#isRoot .is-eyewrap{position:absolute;inset:0;background:#0c0c14;transition:transform 1.6s ease-in,opacity 1.6s}
#isRoot .is-eyewrap.grow{transform:scale(.05);opacity:0!important;transition:transform 2.2s ease-in,opacity 2.2s}
#isRoot .is-dark{position:absolute;inset:0;background:#000;z-index:3;pointer-events:none}
#isRoot .is-lid{transform-origin:480px 150px;animation:isblink 3.2s infinite}@keyframes isblink{0%,86%,100%{transform:scaleY(0)}91%{transform:scaleY(1)}}
#isRoot .is-pupil{animation:islook 4s ease-in-out infinite}@keyframes islook{0%,100%{transform:translate(0,0)}40%{transform:translate(-18px,6px)}70%{transform:translate(14px,-4px)}}
#isRoot .is-size{flex:1;max-width:560px;margin:0 12px;pointer-events:none}#isRoot .is-size .trk{position:relative;height:10px;border-radius:6px;background:rgba(255,255,255,.22);margin:12px 14px 4px}
#isRoot .is-size .trk i{position:absolute;left:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,#8ce99a,#ffd43b);transition:width 1s}
#isRoot .is-size .trk span{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:15px;filter:grayscale(1) opacity(.55);transition:all .5s}#isRoot .is-size .trk span.past{filter:none;opacity:.85}#isRoot .is-size .trk span.on{filter:none;font-size:26px;text-shadow:0 0 10px #ffd43b}
#isRoot .is-size .lab{text-align:center;color:#fff;font-size:14px;background:rgba(20,10,46,.7);border-radius:10px;padding:2px 10px;margin:6px auto 0;width:max-content;max-width:100%}#isRoot .is-size .lab b{color:#ffd43b}
#isRoot .is-panel{top:96px!important}#isRoot .is-meter{display:none}
@media(max-width:600px){#isRoot .is-chip .cn{display:none}#isRoot .is-size{margin:0 6px}#isRoot .is-size .trk{margin:10px 8px 2px}#isRoot .is-size .trk span{font-size:11px}#isRoot .is-size .trk span.on{font-size:20px}#isRoot .is-size .lab{font-size:12px}}
#isRoot .is-fadein{animation:isfadein 1.1s ease}@keyframes isfadein{from{opacity:0}}
#isRoot .is-black{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 1s ease;z-index:8}#isRoot .is-black.on{opacity:1}
#isRoot .is-cargo{transform-box:fill-box;transform-origin:50% 55%}#isRoot .is-cargo.go{animation:iscargo 3.6s forwards}@keyframes iscargo{0%{transform:translate(0,0) scale(1);animation-timing-function:ease-in-out}55%{transform:translate(276px,-2px) scale(.62);animation-timing-function:ease-in}100%{transform:translate(276px,-2px) scale(.01)}}
#isRoot .is-vico{width:1.1em;height:1.1em;vertical-align:middle}
#isRoot .is-dash{position:absolute;inset:0;background:#0b0716}#isRoot .is-blinkslow{animation:isblinks 2.4s ease-in-out infinite}@keyframes isblinks{50%{opacity:.35}}
#isRoot .is-spark{animation:isspark 1.8s ease-in-out infinite}@keyframes isspark{0%,60%,100%{opacity:0}70%,80%{opacity:1}}
#isRoot .is-build.is-dark2{background:radial-gradient(ellipse at 50% 30%,#2b1d5c,#0f0a24)}#isRoot .is-dark2 h2{color:#ffd43b}#isRoot .is-dark2 .is-buzz{text-shadow:0 1px 2px #000}#isRoot .is-dark2 .is-area{background:#150e30;border-color:#7048e8}#isRoot .is-dark2 .is-area.done{border-color:#51cf66}
#isRoot .is-steps{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;color:#d0bfff;font-weight:700}#isRoot .is-steps span{background:rgba(255,255,255,.1);border-radius:999px;padding:4px 12px;font-size:15px}#isRoot .is-steps span.on{background:#ffd43b;color:#3d2a00}#isRoot .is-steps span.done{background:#2b8a3e;color:#fff}#isRoot .is-steps i{font-style:normal;opacity:.6}
#isRoot .is-brow.is-arow{display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:center}@media(max-width:600px){#isRoot .is-brow.is-arow{flex-direction:column;gap:10px}#isRoot .is-arow .is-abox{width:min(190px,52vw)}#isRoot .is-arow .is-cbox{min-width:0;width:100%;max-width:340px;box-sizing:border-box}#isRoot .is-arow .is-cb{width:42px;height:42px}}
#isRoot .is-abox{width:min(300px,80vw);aspect-ratio:1;background:#150e30;border:3px solid #7048e8;border-radius:24px;display:flex;align-items:center;justify-content:center}#isRoot .is-asvg{width:92%;height:92%}
#isRoot .is-cbox{background:#fff;border-radius:20px;padding:12px 14px;min-width:260px;display:flex;flex-direction:column;gap:10px}
#isRoot .is-crow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}#isRoot .is-crow b{min-width:84px;font-size:17px}#isRoot .is-crow small{color:#2b8a3e;font-weight:700}#isRoot .is-crow.lock{opacity:.75}
#isRoot .is-cball{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800}
#isRoot .is-cnum{font-weight:800;font-size:19px;min-width:62px;text-align:center;color:#495057}#isRoot .is-cnum.good{color:#2b8a3e}#isRoot .is-cnum.over{color:#c92a2a}
#isRoot .is-cbs{display:inline-flex;gap:6px}#isRoot .is-cb{width:46px;height:46px;border-radius:14px;border:0;background:#7048e8;color:#fff;font-size:24px;font-weight:800;box-shadow:0 3px 0 #3b1f9e}#isRoot .is-cb.wide{width:58px;font-size:17px}#isRoot .is-cb.fill{width:auto;padding:0 10px;font-size:14px;background:#f08c00;box-shadow:0 3px 0 #a35200;white-space:nowrap}#isRoot .is-cbs{flex-wrap:wrap;justify-content:flex-end}
#isRoot .is-okmsg{font-weight:800;color:#2b8a3e;font-size:18px;text-align:center}#isRoot .is-okmsg.bad{color:#c92a2a}
#isRoot .is-repl{position:absolute;inset:0;background:rgba(10,6,24,.93);z-index:4}#isRoot .is-repl canvas{position:absolute;inset:0;width:100%;height:100%}
#isRoot .is-rtxt{position:absolute;left:50%;top:22%;transform:translate(-50%,-50%);text-align:center;color:#fff;background:rgba(20,10,46,.8);border:3px solid #ffd43b;border-radius:18px;padding:10px 22px;font-weight:800}#isRoot .is-rtxt b{display:block;font-size:40px;color:#ffd43b;font-variant-numeric:tabular-nums}#isRoot .is-rtxt small{color:#d0bfff}
#isRoot .is-quiz.is-rise{background:radial-gradient(ellipse at center,#2b1d5c,#0f0a24);overflow:auto;padding-top:130px;align-content:center;align-items:center;padding-bottom:9vh}#isRoot .is-riseship{position:absolute;left:50%;top:45%;width:min(300px,46vw);transform:translate(-50%,-50%);z-index:1;pointer-events:none;animation:isbob 3.2s ease-in-out infinite}#isRoot .is-riseship svg{width:100%;height:auto;display:block;filter:drop-shadow(0 0 22px rgba(177,151,252,.45))}@keyframes isbob{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 10px))}}#isRoot .is-rise .is-q,#isRoot .is-rise>div:not(.is-risetxt):not(.is-riseship){position:relative;z-index:2}
#isRoot .is-rring{position:absolute;left:50%;top:50%;width:150vmax;height:100vmax;margin:-50vmax 0 0 -75vmax;border-radius:50%;border:3px solid #b197fc;opacity:0;animation:isrise 6s linear infinite;pointer-events:none;z-index:1}
@keyframes isrise{0%{transform:scale(1);opacity:0}20%{opacity:.2}100%{transform:scale(.02);opacity:0}}
#isRoot .is-risetxt{position:absolute;top:96px;left:0;right:0;text-align:center;color:#d0bfff;font-weight:700;z-index:2}
@media (prefers-reduced-motion:reduce){#isRoot .is-rring{animation-duration:14s}#isRoot .is-cargo.go{animation-duration:1.2s}}
#isRoot .is-float{animation:isfloat 2s ease-in-out infinite alternate}@keyframes isfloat{to{transform:translateY(-.06px)}}
#isRoot .is-leave{position:absolute;inset:0;z-index:20;background:rgba(10,5,30,.6);display:grid;place-items:center;padding:16px}
#isRoot .is-lbox{background:#fff;border-radius:22px;padding:16px;max-width:420px;display:grid;grid-template-columns:60px 1fr;gap:12px;align-items:center;font-size:18px;border:4px solid #7048e8}
#isRoot .is-lbox svg{width:60px;height:60px}#isRoot .is-lrow{grid-column:1/3;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.is-album{color:#1f2340;width:100%;max-width:760px}.is-ahead{background:#fff;border-radius:16px;padding:10px 14px;font-size:17px;margin-bottom:10px;text-align:center}
.is-agrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.is-acard{background:#f1f3f5;border-radius:16px;padding:10px 8px;text-align:center;position:relative;border:3px solid #dee2e6}.is-acard.done{background:#fff9db;border-color:#fcc419}
.is-acard .e{font-size:38px;display:block}.is-acard b{display:block;font-size:17px}.is-acard small{color:#7048e8;font-weight:700}.is-acard em{display:block;font-style:normal;font-size:14px;color:#e67700;font-weight:700}
.oz-av{flex-basis:110px!important}.oz-av svg{width:110px;height:112px}.oz-bub{background:#f3f0ff!important;border-color:#b197fc!important}.oz-bub>b{color:#7048e8!important}
@media(max-width:560px){.oz-av{flex-basis:78px!important}.oz-av svg{width:78px;height:80px}}
@media(max-width:600px){#isRoot .is-brow{display:grid;grid-template-columns:1fr 1fr;gap:8px}#isRoot .is-brow .is-tray,#isRoot .is-brow .is-recipe{min-width:0;padding:8px}#isRoot .is-brow .is-area{grid-column:1/3;order:3;justify-self:center}#isRoot .is-recipe .f{font-size:26px}#isRoot .is-recipe li{font-size:14px}#isRoot .is-tray .atoms{grid-template-columns:repeat(2,54px);gap:6px}#isRoot .is-atom{width:54px;height:54px;font-size:19px}#isRoot .is-nar{flex-wrap:wrap}#isRoot .is-nar .who,#isRoot .is-nar .who svg{width:40px;height:40px}#isRoot .is-nar .is-btn{width:100%}#isRoot .is-meter{min-width:0;font-size:14px;top:56px}#isRoot .is-meter div{font-size:14px}.is-agrid{grid-template-columns:1fr 1fr}}`;
document.head.appendChild(st);

/* Parent Corner 'Send a visitor': Ozzy stops waiting for more battles and comes on the hero's next visit to the World map (a ticket is still needed) */
function bring(p){const s=S(p);if(!s.tix.length)return false;s.after=0;s.snooze=0;s.decl=0;return true;}
function coming(p){const s=(p&&p.inner)?S(p):null;return !!s&&s.tix.length>0&&(p.battles||0)>=(s.after||0)&&Date.now()>(s.snooze||0);}
window.Inner={_bring:bring,_coming:coming,open,award,ticketLine,fullLine,isFull,bagHTML,album:albumModal,meet,draw:drawMob,S,pickRide,ORDER,TIX_MAX,WAIT_BATTLES,_demo:()=>{DEMO=true;},_state:()=>({R,DEMO,busy,root:!!root}),_next:next,_spawn:spawn,_fit:fitMol};
})();
