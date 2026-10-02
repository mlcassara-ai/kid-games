/* ================= Discovery District (walk-around PREVIEW, hidden) =================
   A second neighborhood reached by train from Number Village: a station plaza and five physics areas.
   This file is a look-and-feel preview only: you can ride the train, walk the map and tap things. There are no
   battles, wild monsters or chests here yet. Only Munch-Bot, the hungry robot, is real: he takes coins and saves his fact cards (p.fizz). It draws its own map so the main world code is untouched.
   HIDDEN: no entry point unless the game was opened once with ?district=1 on that device (or window.MQ_DISTRICT_BETA===true).
   Uses Math Quest globals: P, save, go, modal, closeModal, toast, esc, topbar, heroSVG, SFX, tone, say, speakable, speakToggle,
   youngReader, voiceOn, SCREENS, curScreen, W (main map tiles). */
(function(){
'use strict';
const COLS=44,ROWS=28,SEED=20261001;
const AREAS={
 plaza:{c:[22,14],g:'#a4d86e',g2:'#9ccf66',name:'🔭 Discovery District',bl:['🌳','🌲'],de:['🌼','🌷']},
 bay:{c:[35,21],g:'#f2ddb0',g2:'#ecd5a4',zone:1,open:1,name:'Balance Bay',art:'⚖️',bl:['🌴','⚓'],de:['🐚','🦀'],about:'Seesaws, levers and pulleys.'},
 mountain:{c:[8,6],g:'#b7b3c7',g2:'#aeaac0',zone:1,name:'Motion Mountain',art:'🏔️',bl:['⛰️','🌲'],de:['❄️','🛷'],about:'Speed, distance and time.'},
 canyon:{c:[22,4],g:'#e0a070',g2:'#d89868',zone:1,name:'Echo Canyon',art:'📣',bl:['🌵','🪨'],de:['🦇','🎵'],about:'Sound, echoes and waves.'},
 city:{c:[36,6],g:'#c9c4e8',g2:'#c0bae2',zone:1,name:'Circuit City',art:'💡',bl:['🏢','🔋'],de:['⚡','🔌'],about:'Batteries, bulbs and wires.'},
 lagoon:{c:[8,21],g:'#bfe9d2',g2:'#b3e0c7',zone:1,name:'Float or Sink Lagoon',art:'🛶',bl:['🌿','🎋'],de:['🦆','🫧'],about:'What floats, what sinks, and why.'}};
/* plaza is 15x9 with Munch-Bot, the hungry robot, in the middle */
const SPOTS=[{id:'fizz',x:22,y:14,e:'🤖',n:'Munch-Bot'},{id:'train',x:17,y:14,e:'🚂',n:'Train to Number Village'},{id:'board',x:27,y:14,e:'📜',n:'District Board'},{id:'scope',x:22,y:11,e:'🔭',n:''}];
const LAKES=[[41,26,5.6],[4,25,3.4],[30,12,1.5]];
const BAY_STOPS=[['Wobble Crab','Which side is heavier?'],['Tippy Gull','Make it level'],['See-Saw Seal','Find the weight'],['Heavy Hermit','Find the distance'],['Pulley Pelican','Levers and pulleys'],['Captain Counterweight (boss)','Everything, mixed']];
const TRAIN_X=28,TRAIN_Y=15; /* the station tile on the main map (right side of the village plaza) */
let D=null;
function flag(){if(window.MQ_DISTRICT_BETA===true)return true;try{if(/[?&]district=1(&|$)/.test(location.search))localStorage.setItem('mqDistrictBeta','1');return localStorage.getItem('mqDistrictBeta')==='1';}catch(e){return false;}}
function rng(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- map ---------- */
function build(){const r=rng(SEED),T=[],keys=Object.keys(AREAS);
 for(let y=0;y<ROWS;y++){T[y]=[];for(let x=0;x<COLS;x++){let best=null,bd=1e9;
  for(const k of keys){const c=AREAS[k].c;const d=Math.hypot(x-c[0],(y-c[1])*1.15)*(k==='plaza'?.8:1)+r()*1.2;if(d<bd){bd=d;best=k;}}
  const edge=x===0||y===0||x===COLS-1||y===ROWS-1;T[y][x]={b:best,water:edge,path:false,o:null,block:edge};}}
 const pc=AREAS.plaza.c;
 const carve=(x1,y1)=>{let x=pc[0],y=pc[1];const lay=()=>{for(const dx of [0,1]){const t=T[y]&&T[y][x+dx];if(t&&!t.water){t.path=true;t.block=false;t.o=null;}}};
  if(r()<.5){while(x!==x1){x+=Math.sign(x1-x);lay();}while(y!==y1){y+=Math.sign(y1-y);lay();}}else{while(y!==y1){y+=Math.sign(y1-y);lay();}while(x!==x1){x+=Math.sign(x1-x);lay();}}};
 for(const k of keys)if(k!=='plaza')carve(AREAS[k].c[0],AREAS[k].c[1]);
 for(let y=pc[1]-4;y<=pc[1]+4;y++)for(let x=pc[0]-7;x<=pc[0]+7;x++){const t=T[y][x];t.plaza=true;t.path=false;t.block=false;t.o=null;}
 for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){const t=T[y][x];if(t.path||t.plaza)continue;const B=AREAS[t.b],v=r();
  if(keys.some(k=>AREAS[k].zone&&Math.abs(AREAS[k].c[0]-x)<=1&&Math.abs(AREAS[k].c[1]-y)<=1))continue;
  if(v<.17){t.o=B.bl[Math.floor(r()*B.bl.length)];t.block=true;}else if(v<.25){t.o=B.de[Math.floor(r()*B.de.length)];t.deco=true;}}
 for(const [cx,cy,rad] of LAKES)for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const t=T[y][x];if(!t.path&&!t.plaza&&Math.hypot(x-cx,y-cy)<rad){t.water=true;t.block=true;t.o=null;t.deco=false;}}
 for(const k of keys){const B=AREAS[k];if(!B.zone)continue;const t=T[B.c[1]][B.c[0]];t.gate=k;t.block=true;t.o=null;t.water=false;t.path=false;}
 SPOTS.forEach(n=>{const t=T[n.y][n.x];t.o=null;t.spot=n.id;t.block=true;});
 D={T,hx:pc[0],hy:pc[1]+2,fx:pc[0],fy:pc[1]+2,drawX:pc[0],drawY:pc[1]+2,moving:false,mt:0,path:[],after:null,spr:{},dir:1,last:null,raf:0,ts:48,vw:0,vh:0,img:null,mark:null};}
const walk=(x,y)=>{const t=D.T[y]&&D.T[y][x];return !!t&&!t.block;};
function pathTo(tx,ty){const k=(x,y)=>y*COLS+x,prev=new Map([[k(D.hx,D.hy),-1]]),q=[[D.hx,D.hy]];
 while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty){const out=[];let c=k(x,y);while(c!==k(D.hx,D.hy)){out.unshift([c%COLS,Math.floor(c/COLS)]);c=prev.get(c);}return out;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(walk(nx,ny)&&!prev.has(k(nx,ny))){prev.set(k(nx,ny),k(x,y));q.push([nx,ny]);}}}
 return null;}

/* ---------- things you can tap ---------- */
function useTile(x,y){const t=D.T[y]&&D.T[y][x];if(!t)return;try{SFX.tap();}catch(e){}
 if(t.gate){const B=AREAS[t.gate];
  if(B.open)modal(`<div class="mcard"><div class="big-emoji">${B.art}</div><h2>${esc(B.name)}</h2><p>${esc(B.about)} This is the first area that will open. Its path would look like this:</p>
   <ol style="text-align:left;margin:8px auto;max-width:330px;line-height:1.6">${BAY_STOPS.map(s=>`<li><b>${esc(s[0])}</b><br><span class="muted">${esc(s[1])}</span></li>`).join('')}</ol>
   <p class="muted">Preview only: the battles are not built yet.</p><div class="row"><button class="btn green" onclick="closeModal()">OK</button></div></div>`);
  else modal(`<div class="mcard"><div class="big-emoji">🚧</div><h2>${esc(B.name)}</h2><p>${esc(B.about)}</p><p><b>Coming soon!</b></p><div class="row"><button class="btn green" onclick="closeModal()">OK</button></div></div>`);return;}
 if(t.spot==='train'){modal(`<div class="mcard"><div class="big-emoji">🚂</div><h2>Ride back to Number Village?</h2><div class="row"><button class="btn ghost dark" onclick="closeModal()">Stay here</button><button class="btn green" onclick="closeModal();Discovery.ride('home')">All aboard!</button></div></div>`);return;}
 if(t.spot==='board'){modal(`<div class="mcard"><div class="big-emoji">📜</div><h2>District Board</h2><div style="text-align:left;max-width:340px;margin:0 auto">${Object.keys(AREAS).filter(k=>AREAS[k].zone).map(k=>{const B=AREAS[k];return `<p style="margin:6px 0">${B.art} <b>${esc(B.name)}</b> ${B.open?'<span style="color:#2f9e58">· opening first</span>':'<span class="muted">· coming soon</span>'}<br><span class="muted">${esc(B.about)}</span></p>`;}).join('')}</div><div class="row"><button class="btn green" onclick="closeModal()">OK</button></div></div>`);return;}
 if(t.spot==='fizz'){fizzOpen();return;}
 if(t.spot==='scope')toast('🔭 Welcome to Discovery District!');}
function tap(e){if(!D||document.querySelector('#modal.show'))return;const cv=e.currentTarget,r=cv.getBoundingClientRect(),[cx,cy]=cam();
 const x=Math.floor((e.clientX-r.left+cx)/D.ts),y=Math.floor((e.clientY-r.top+cy)/D.ts);const t=D.T[y]&&D.T[y][x];if(!t)return;
 D.mark={x,y,t:performance.now()};
 if(t.gate||t.spot){const near=[[0,1],[1,0],[-1,0],[0,-1]].map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>walk(a,b)||(a===D.hx&&b===D.hy));
  let best=null;near.forEach(([a,b])=>{const p=a===D.hx&&b===D.hy?[]:pathTo(a,b);if(p&&(!best||p.length<best.length))best=p;});
  if(best){D.path=best;D.after=()=>useTile(x,y);if(!best.length&&!D.moving){const f=D.after;D.after=null;f();}}return;}
 if(t.block)return;const p=pathTo(x,y);if(p){D.path=p;D.after=null;}}
function stepBy(dx,dy){if(!D||D.moving||document.querySelector('#modal.show'))return;const nx=D.hx+dx,ny=D.hy+dy;const t=D.T[ny]&&D.T[ny][nx];if(!t)return;
 if(dx)D.dir=dx;if(t.gate||t.spot){useTile(nx,ny);return;}if(!t.block){D.path=[[nx,ny]];D.after=null;}}

/* ---------- Munch-Bot, the hungry robot: same toss mechanic as the village's Wishing Fountain (each coin snack costs 1 more
   than the last), but when he is full he burps out a strange-but-true fact card for an album. The burp is shown as a word and
   played as a sound, never spoken. (Saved under p.fizz: this began as a fizzing fountain.) Saved in p.fizz {t, need, seen:[fact ids], sets:[finished set ids]}.
   Facts must be checked before they go in; only ever ADD to the end of a set (cards are saved by id). ---------- */
const SETS=[['a','🐾','Animals'],['s','🚀','Space'],['b','🫀','Your Body'],['w','🌍','Wild World']];
const FACTS=[
 ['a1','An octopus has three hearts.'],
 ['a2','A group of flamingos is called a flamboyance.'],
 ['a3','Sea otters sometimes hold paws while they sleep, so they do not drift apart.'],
 ['a4','Some desert snails can sleep for up to three years.'],
 ['a5','Butterflies taste with their feet.'],
 ['a6','Wombat poop is shaped like cubes.'],
 ['s1','A day on Venus is longer than a year on Venus.'],
 ['s2','More than a million Earths could fit inside the Sun.'],
 ['s3','Footprints on the Moon can last for millions of years, because there is no wind to blow them away.'],
 ['s4','Saturn is so light for its size that it would float in water, if you could find a bathtub big enough.'],
 ['s5','Space is silent, because sound needs something like air to travel through.'],
 ['s6','On the Moon you would weigh about one sixth of what you weigh on Earth.'],
 ['b1','You are a tiny bit taller in the morning than at night.'],
 ['b2','Your heart beats about 100,000 times every day.'],
 ['b3','Your brain is about three quarters water.'],
 ['b4','Babies are born with about 300 bones. Grown-ups have 206.'],
 ['b5','The rumbling sound your tummy makes has a name: borborygmus.'],
 ['b6','You blink more than 10,000 times a day.'],
 ['w1','A fluffy white cloud can weigh as much as 100 elephants.'],
 ['w2','Lightning is about five times hotter than the surface of the Sun.'],
 ['w3','Honey never spoils. Honey found in ancient Egyptian tombs was still good to eat.'],
 ['w4','Bananas are a tiny bit radioactive, and totally safe to eat.'],
 ['w5','Sound travels about four times faster in water than in air.'],
 ['w6','The Eiffel Tower gets about 15 centimeters taller in summer, because metal grows when it is hot.']];
const SET_COINS=100,ALL_COINS=300,REPEAT_COINS=5;
const rndN=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function fz(p){p.fizz=p.fizz||{t:0,need:rndN(1,15),seen:[],sets:[]};const f=p.fizz;if(!Array.isArray(f.seen))f.seen=[];if(!Array.isArray(f.sets))f.sets=[];if(!(f.need>=1&&f.need<=15))f.need=rndN(1,15);return f;}
const setOf=id=>SETS.find(s=>s[0]===id[0]);
function fizzCSS(){if(document.getElementById('fzCSS'))return;const s=document.createElement('style');s.id='fzCSS';s.textContent=`
.fz-pool{position:relative;height:120px;margin:0 auto 6px;max-width:220px;border-radius:26px;background:linear-gradient(#e7f5ff,#bcdcf5);overflow:hidden;box-shadow:inset 0 -8px 0 rgba(0,0,0,.12)}
.fz-pool .e{font-size:78px;line-height:120px;display:inline-block}
.fz-pool .e.nom{animation:fzNom .35s}
.fz-pool .e.burp{animation:fzBurp .7s}
@keyframes fzNom{40%{transform:scale(1.18) rotate(-6deg)}70%{transform:scale(.94) rotate(4deg)}}
@keyframes fzBurp{20%{transform:scale(1.3)}45%{transform:scale(.85) translateY(6px)}70%{transform:scale(1.15)}}
.fz-b{position:absolute;bottom:-14px;font-size:20px;animation:fzUp .5s ease-in forwards}
@keyframes fzUp{to{transform:translateY(-70px) translateX(var(--dx,0px)) scale(.5);opacity:0}}
.fz-card{background:#f1eefc;border:3px solid #7048e8;border-radius:18px;padding:12px 14px;margin:8px auto;max-width:360px}
.fz-card .set{font-weight:700;color:#5b3fd0;font-size:15px}.fz-card .txt{font-size:19px;font-weight:600;margin:6px 0;line-height:1.35}
.fz-alb{display:grid;gap:10px;text-align:left;max-height:56vh;overflow:auto}
.fz-alb h4{margin:0 0 4px;font-size:16px}.fz-alb p{margin:3px 0;font-size:15px;line-height:1.35}.fz-alb .no{color:#9a94b5}`;document.head.appendChild(s);}
const fzSpeak=t=>{try{speakToggle(()=>say(speakable(t),.9));}catch(e){}};
function fizzOpen(){const p=P(),f=fz(p);fizzCSS();
 modal(`<div class="mcard"><div class="fz-pool" id="fzPool"><span class="e" id="fzBot">🤖</span></div><h2>Munch-Bot</h2><p id="fzMsg" style="min-height:24px">Beep boop! Munch-Bot is hungry for coins…</p>
 <div class="row"><button class="btn gold big" id="fzBtn" onclick="Discovery._toss()">Feed 🪙 ${f.t+1}</button></div><p class="muted" style="margin:0">Each snack costs 1 more coin than the last. A fact card resets the price to 1.</p>
 <p class="muted" id="fzCoins">You have 🪙 ${p.coins} · 📒 ${f.seen.length} of ${FACTS.length} cards</p>
 <div class="row"><button class="btn small" onclick="Discovery._album()">📒 My fact cards</button><button class="btn ghost dark small" onclick="closeModal()">Walk away</button></div></div>`);}
let fzBusy=false;
function fizzToss(){const p=P(),f=fz(p),msg=document.getElementById('fzMsg');if(fzBusy||!msg)return;const n=f.t+1;
 if(p.coins<n){msg.textContent=p.coins?`You only have ${p.coins} coin${p.coins>1?'s':''}!`:'Munch-Bot looks at your empty pockets. You need a coin!';return;}
 p.coins-=n;f.t++;save();const b=document.getElementById('fzBtn');if(b)b.textContent=`Feed 🪙 ${f.t+1}`;
 const pool=document.getElementById('fzPool'),bot=document.getElementById('fzBot');if(bot){bot.classList.remove('nom');void bot.offsetWidth;bot.classList.add('nom');}
 for(let i=0;i<Math.min(n,5);i++){try{tone(500+Math.random()*200,.07,'square',.04,i*.08);}catch(e){}if(pool){const c=document.createElement('span');c.className='fz-b';c.textContent='🪙';const lx=20+Math.random()*60;c.style.left=lx+'%';c.style.setProperty('--dx',((50-lx)*1.6)+'px');c.style.animationDelay=(i*.08)+'s';pool.appendChild(c);setTimeout(()=>c.remove(),900);}}
 const ce=document.getElementById('fzCoins');if(ce)ce.textContent=`You have 🪙 ${p.coins} · 📒 ${f.seen.length} of ${FACTS.length} cards`;
 if(f.t>=f.need){fzBusy=true;msg.textContent='Uh oh… his tummy is rumbling!';if(bot){bot.classList.remove('nom');void bot.offsetWidth;bot.classList.add('burp');}try{tone(110,.35,'sawtooth',.07,.35);tone(80,.3,'sawtooth',.06,.6);}catch(e){}setTimeout(()=>{fzBusy=false;fizzCard();},1000);}
 else msg.textContent=['Nom nom nom!','Crunchy!','More, please!','Mmm, shiny.','Yum. Tastes like a nickel.','Beep! Delicious.','Still hungry!'][Math.floor(Math.random()*7)];}
function fizzCard(){const p=P(),f=fz(p);let pool=FACTS.filter(x=>!f.seen.includes(x[0])),repeat=false;if(!pool.length){pool=FACTS;repeat=true;}
 const [id,txt]=pool[Math.floor(Math.random()*pool.length)];f.t=0;f.need=rndN(1,15);let extra='';
 if(repeat){p.coins+=REPEAT_COINS;extra=`<p class="muted">You already have this card, so here are 🪙 ${REPEAT_COINS} back.</p>`;}
 else{f.seen.push(id);const S=setOf(id),done=FACTS.filter(x=>x[0][0]===S[0]).every(x=>f.seen.includes(x[0]));
  if(done&&!f.sets.includes(S[0])){f.sets.push(S[0]);p.coins+=SET_COINS;extra=`<p><b>${S[1]} ${S[2]} set complete! 🪙 +${SET_COINS}</b></p>`;
   if(f.sets.length===SETS.length){p.coins+=ALL_COINS;extra+=`<p><b>🏆 Every card found! 🪙 +${ALL_COINS}</b></p>`;}}}
 save();try{[523,659,784,1047].forEach((x,k)=>tone(x,.16,'triangle',.07,k*.09));}catch(e){}
 const S=setOf(id);window.__fzTxt=txt;
 modal(`<div class="mcard"><div class="big-emoji">🤖</div><h2>BURP! A fact card!</h2><p class="muted" style="margin:0">"Excuse me," says Munch-Bot.</p><div class="fz-card"><div class="set">${S[1]} ${S[2]} · strange but true</div><div class="txt">${esc(txt)}</div><button class="btn ghost dark small" onclick="Discovery._read()">🔊 Read it to me</button></div>${extra}
 <p class="muted">📒 ${f.seen.length} of ${FACTS.length} cards</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Done</button><button class="btn gold" onclick="Discovery._fizz()">Feed him again!</button></div></div>`);
 try{if(youngReader(p)&&voiceOn())setTimeout(()=>say(speakable(txt),.9),400);}catch(e){}}
function fizzAlbum(){const p=P(),f=fz(p);fizzCSS();
 modal(`<div class="mcard"><h2>📒 Strange-but-true cards</h2><p class="muted">${f.seen.length} of ${FACTS.length} found. A full set earns 🪙 ${SET_COINS}.</p><div class="fz-alb">${SETS.map(S=>{const list=FACTS.filter(x=>x[0][0]===S[0]),got=list.filter(x=>f.seen.includes(x[0])).length;
  return `<div><h4>${S[1]} ${S[2]} · ${got} of ${list.length}${f.sets.includes(S[0])?' ✅':''}</h4>${list.map(x=>f.seen.includes(x[0])?`<p>• ${esc(x[1])}</p>`:'<p class="no">• ? ? ?</p>').join('')}</div>`;}).join('')}</div>
 <div class="row"><button class="btn green" onclick="Discovery._fizz()">Back to Munch-Bot</button></div></div>`);}

/* ---------- drawing ---------- */
function sprite(e,size){const k=e+'|'+size;if(D.spr[k])return D.spr[k];const dpr=window.devicePixelRatio||1,c=document.createElement('canvas'),s=Math.ceil(size*dpr*1.25);c.width=c.height=s;
 const x=c.getContext('2d');x.font=`${size*dpr}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(e,s/2,s/2+size*dpr*.06);D.spr[k]=c;return c;}
function cam(){const ts=D.ts;return [clampN(D.drawX*ts+ts/2-D.vw/2,0,Math.max(0,COLS*ts-D.vw)),clampN(D.drawY*ts+ts/2-D.vh/2,0,Math.max(0,ROWS*ts-D.vh))];}
function label(ctx,txt,x,y,fg,bg){ctx.font=`700 ${Math.round(D.ts*.26)}px Fredoka, system-ui, sans-serif`;const w=ctx.measureText(txt).width+12,h=D.ts*.36;x=clampN(x,w/2+4,Math.max(w/2+4,D.vw-w/2-4));y=clampN(y,h/2+3,Math.max(h/2+3,D.vh-h/2-3));
 ctx.fillStyle=bg;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-w/2,y-h/2,w,h,h/2);else ctx.rect(x-w/2,y-h/2,w,h);ctx.fill();ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x,y+1);}
function resize(){const cv=document.getElementById('dcv'),box=document.getElementById('dworld');if(!cv||!box||!D)return;const b=box.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 cv.width=Math.round(b.width*dpr);cv.height=Math.round(b.height*dpr);cv.style.width=b.width+'px';cv.style.height=b.height+'px';D.ts=Math.round(clampN(Math.min(b.width,b.height)/9,38,58));D.vw=b.width;D.vh=b.height;}
function frame(now){const cv=document.getElementById('dcv');if(typeof curScreen==='undefined'||curScreen!=='district'||!cv||!D)return;D.raf=requestAnimationFrame(frame);
 if(D.moving&&now-D.mt>=140)D.moving=false;
 if(!D.moving){if(D.path.length){const [nx,ny]=D.path.shift();if(nx!==D.hx)D.dir=nx>D.hx?1:-1;D.fx=D.hx;D.fy=D.hy;D.hx=nx;D.hy=ny;D.mt=now;D.moving=true;}else if(D.after){const f=D.after;D.after=null;f();}}
 if(D.moving){const k=Math.min(1,(now-D.mt)/140);D.drawX=D.fx+(D.hx-D.fx)*k;D.drawY=D.fy+(D.hy-D.fy)*k;}else{D.drawX=D.hx;D.drawY=D.hy;}
 if(!D.vw||!cv.width)resize();if(!D.vw||!cv.width)return;
 const ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,ts=D.ts,[cx,cy]=cam();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,D.vw,D.vh);
 const x0=Math.max(0,Math.floor(cx/ts)),y0=Math.max(0,Math.floor(cy/ts)),x1=Math.min(COLS-1,Math.ceil((cx+D.vw)/ts)),y1=Math.min(ROWS-1,Math.ceil((cy+D.vh)/ts)),items=[];
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=D.T[y][x],B=AREAS[t.b],sx=x*ts-cx,sy=y*ts-cy;
  ctx.fillStyle=t.water?((x+y)%2?'#4aa3df':'#459bd6'):t.path?'#dcc48c':t.plaza?((x+y)%2?'#e8dcc0':'#e2d5b6'):((x*7+y*3)%5?B.g:B.g2);ctx.fillRect(sx,sy,ts+1,ts+1);
  if(t.o){const s=t.deco?ts*.5:ts*.9;items.push({y,draw:()=>ctx.drawImage(sprite(t.o,t.deco?Math.round(ts*.45):Math.round(ts*.8)),sx+(ts-s)/2,sy+(ts-s)/2-(t.deco?0:ts*.12),s,s)});}
  if(t.gate){const G=AREAS[t.gate],s=ts*1.5;items.push({y,draw:()=>{ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(sx+ts/2,sy+ts*.8,ts*.8,ts*.3,0,0,7);ctx.fill();
   ctx.globalAlpha=G.open?1:.8;ctx.drawImage(sprite(G.open?G.art:'🚧',Math.round(ts*1.3)),sx+ts/2-s/2,sy+ts/2-s/2-ts*.25+Math.sin(now/500)*2,s,s);ctx.globalAlpha=1;
   label(ctx,G.name+(G.open?'':' · Coming soon'),sx+ts/2,sy-ts*.55,'#fff',G.open?'rgba(200,80,0,.92)':'rgba(40,20,80,.85)');}});}
  if(t.spot){const n=SPOTS.find(q=>q.id===t.spot),s=ts*1.1;items.push({y,draw:()=>{ctx.drawImage(sprite(n.e,Math.round(ts*.95)),sx+ts/2-s/2,sy+ts/2-s/2-ts*.1,s,s);if(n.n)label(ctx,n.n,sx+ts/2,sy-ts*.18,'#3b2b6b','rgba(255,255,255,.9)');}});}}
 {const sx=D.drawX*ts-cx,sy=D.drawY*ts-cy;items.push({y:D.drawY+.02,draw:()=>{ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(sx+ts/2,sy+ts*.9,ts*.33,ts*.1,0,0,7);ctx.fill();
  const h=ts*1.35,w=h*.77,bob=D.moving?Math.abs(Math.sin(now/60))*3:Math.sin(now/400)*1.5;
  if(D.img&&D.img.complete&&D.img.naturalWidth){ctx.save();ctx.translate(sx+ts/2,0);ctx.scale(D.dir<0?-1:1,1);ctx.drawImage(D.img,-w/2,sy+ts*.95-h-bob,w,h);ctx.restore();}}});}
 items.sort((a,b)=>a.y-b.y).forEach(it=>it.draw());
 if(D.mark&&now-D.mark.t<600){const a=1-(now-D.mark.t)/600;ctx.strokeStyle=`rgba(255,255,255,${a})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(D.mark.x*ts-cx+ts/2,D.mark.y*ts-cy+ts/2,ts*.3+(1-a)*ts*.2,0,7);ctx.stroke();}
 const bn=D.T[D.hy][D.hx].b;if(bn!==D.last){D.last=bn;const el=document.getElementById('darea');if(el){const B=AREAS[bn];el.textContent=B.zone?`${B.art} ${B.name}`:B.name;}}}

/* ---------- screen + train ---------- */
function screen(){if(!flag()){go('world');return;}const p=P();if(!D)build();D.path=[];D.after=null;D.moving=false;D.last=null;D.drawX=D.hx;D.drawY=D.hy;
 D.img=new Image();D.img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(heroSVG(p.look,{spell:p.spell}));
 app.innerHTML=topbar()+`<div class="world" id="dworld"><canvas id="dcv" style="display:block;touch-action:none"></canvas>
 <div class="wtop"><div class="warea" id="darea"></div><button class="btn small" style="pointer-events:auto" onclick="Discovery.ride('home')">🚂 Number Village</button></div>
 <div class="whelp">Preview: tap anywhere to walk · tap a sign to look</div>
 <div class="dpad"><button data-d="0,-1" style="grid-area:u">▲</button><button data-d="-1,0" style="grid-area:l">◀</button><button data-d="1,0" style="grid-area:r">▶</button><button data-d="0,1" style="grid-area:d">▼</button></div></div>`;
 const tb=document.querySelector('.topbar'),wd=document.getElementById('dworld');if(tb&&wd)wd.style.height=`calc(100dvh - ${tb.offsetHeight}px)`;
 resize();document.getElementById('dcv').addEventListener('pointerdown',tap);
 document.querySelectorAll('#dworld .dpad button').forEach(b=>{const [dx,dy]=b.dataset.d.split(',').map(Number);b.addEventListener('pointerdown',e=>{e.preventDefault();stepBy(dx,dy);});});
 cancelAnimationFrame(D.raf);D.raf=requestAnimationFrame(frame);}
function ride(to){if(!flag())return;try{closeModal();}catch(e){}
 const going=to!=='home';modal(`<div class="mcard" style="overflow:hidden"><h2>${going?'Next stop: Discovery District!':'Next stop: Number Village!'}</h2><div style="font-size:64px;white-space:nowrap;animation:${going?'dTrainR':'dTrainL'} 1.5s linear forwards">🚂🚃🚃</div></div>`);
 if(!document.getElementById('dCSS')){const s=document.createElement('style');s.id='dCSS';/* out to the district: left to right (engine flipped to lead); home again: right to left */
  s.textContent='@keyframes dTrainR{from{transform:translateX(-110%) scaleX(-1)}to{transform:translateX(110%) scaleX(-1)}}@keyframes dTrainL{from{transform:translateX(110%)}to{transform:translateX(-110%)}}';document.head.appendChild(s);}
 try{SFX.coin();}catch(e){}
 setTimeout(()=>{try{closeModal();}catch(e){}if(going){if(D){D.hx=AREAS.plaza.c[0]-4;D.hy=AREAS.plaza.c[1]+1;}go('district');}else go('world');},1500);}
/* the station on the main map (same pattern as the Food Truck and Dr. Quartz's Lab) */
function syncTile(){try{if(typeof W==='undefined'||!W||!W.T)return;const t=W.T[TRAIN_Y]&&W.T[TRAIN_Y][TRAIN_X];if(!t||t.water)return;
 if(flag()){if(!t.npc&&!t.chest&&!t.gate){if(W.hx===TRAIN_X&&W.hy===TRAIN_Y)return;t.npc='train';t.block=true;t.o=null;}}
 else if(t.npc==='train'){delete t.npc;t.block=false;}}catch(e){}}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world')syncTile();},session:()=>syncTile()});
window.addEventListener('resize',()=>{try{if(typeof curScreen!=='undefined'&&curScreen==='district'&&D)resize();}catch(e){}});
document.addEventListener('keydown',e=>{try{if(typeof curScreen==='undefined'||curScreen!=='district'||!D)return;const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(!d)return;e.preventDefault();stepBy(d[0],d[1]);}catch(x){}});
(function reg(n){if(typeof SCREENS!=='undefined'){SCREENS.district=screen;return;}if((n||0)<3000)setTimeout(()=>reg((n||0)+1),50);})(0);
window.Discovery={flag,ride,_fizz:fizzOpen,_toss:fizzToss,_album:fizzAlbum,_read:()=>fzSpeak(window.__fzTxt||''),_dbg:{state:()=>D,build,pathTo,useTile,AREAS,SPOTS,COLS,ROWS,FACTS,SETS,fz,card:fizzCard}};
})();
