/* ================= Discovery District (walk-around PREVIEW, hidden) =================
   A second neighborhood reached by train from Number Village: a station plaza and five physics areas.
   This file is a look-and-feel preview only: you can ride the train, walk the map and tap things. There are no
   battles, wild monsters or chests here yet, and nothing is saved. It draws its own map so the main world code is untouched.
   HIDDEN: no entry point unless the game was opened once with ?district=1 on that device (or window.MQ_DISTRICT_BETA===true).
   Uses Math Quest globals: P, go, modal, closeModal, toast, esc, topbar, heroSVG, SFX, SCREENS, curScreen, W (main map tiles). */
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
const SPOTS=[{id:'train',x:19,y:14,e:'🚂',n:'Train to Number Village'},{id:'board',x:25,y:14,e:'📜',n:'District Board'},{id:'scope',x:22,y:12,e:'🔭',n:''}];
const LAKES=[[41,26,5.6],[4,25,3.4],[30,12,1.5]];
const BAY_STOPS=[['Wobble Crab','Which side is heavier?'],['Tippy Gull','Make it level'],['See-Saw Seal','Find the weight'],['Heavy Hermit','Find the distance'],['Pulley Pelican','Levers and pulleys'],['Captain Counterweight (boss)','Everything, mixed']];
const TRAIN_X=27,TRAIN_Y=13; /* the station tile on the main map (top-right corner of the village plaza) */
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
 for(let y=pc[1]-3;y<=pc[1]+2;y++)for(let x=pc[0]-5;x<=pc[0]+5;x++){const t=T[y][x];t.plaza=true;t.path=false;t.block=false;t.o=null;}
 for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){const t=T[y][x];if(t.path||t.plaza)continue;const B=AREAS[t.b],v=r();
  if(keys.some(k=>AREAS[k].zone&&Math.abs(AREAS[k].c[0]-x)<=1&&Math.abs(AREAS[k].c[1]-y)<=1))continue;
  if(v<.17){t.o=B.bl[Math.floor(r()*B.bl.length)];t.block=true;}else if(v<.25){t.o=B.de[Math.floor(r()*B.de.length)];t.deco=true;}}
 for(const [cx,cy,rad] of LAKES)for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const t=T[y][x];if(!t.path&&!t.plaza&&Math.hypot(x-cx,y-cy)<rad){t.water=true;t.block=true;t.o=null;t.deco=false;}}
 for(const k of keys){const B=AREAS[k];if(!B.zone)continue;const t=T[B.c[1]][B.c[0]];t.gate=k;t.block=true;t.o=null;t.water=false;t.path=false;}
 SPOTS.forEach(n=>{const t=T[n.y][n.x];t.o=null;t.spot=n.id;t.block=true;});
 D={T,hx:pc[0],hy:pc[1]+1,fx:pc[0],fy:pc[1]+1,drawX:pc[0],drawY:pc[1]+1,moving:false,mt:0,path:[],after:null,spr:{},dir:1,last:null,raf:0,ts:48,vw:0,vh:0,img:null,mark:null};}
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
 const going=to!=='home';modal(`<div class="mcard" style="overflow:hidden"><h2>${going?'Next stop: Discovery District!':'Next stop: Number Village!'}</h2><div style="font-size:64px;white-space:nowrap;animation:dTrain 1.5s linear forwards">🚂🚃🚃</div></div>`);
 if(!document.getElementById('dCSS')){const s=document.createElement('style');s.id='dCSS';s.textContent='@keyframes dTrain{from{transform:translateX(-110%) scaleX(-1)}to{transform:translateX(110%) scaleX(-1)}}';document.head.appendChild(s);}
 try{SFX.coin();}catch(e){}
 setTimeout(()=>{try{closeModal();}catch(e){}if(going){if(D){D.hx=AREAS.plaza.c[0];D.hy=AREAS.plaza.c[1]+1;}go('district');}else go('world');},1500);}
/* the station on the main map (same pattern as the Food Truck and Dr. Quartz's Lab) */
function syncTile(){try{if(typeof W==='undefined'||!W||!W.T)return;const t=W.T[TRAIN_Y]&&W.T[TRAIN_Y][TRAIN_X];if(!t||t.water)return;
 if(flag()){if(!t.npc&&!t.chest&&!t.gate){if(W.hx===TRAIN_X&&W.hy===TRAIN_Y)return;t.npc='train';t.block=true;t.o=null;}}
 else if(t.npc==='train'){delete t.npc;t.block=false;}}catch(e){}}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world')syncTile();},session:()=>syncTile()});
window.addEventListener('resize',()=>{try{if(typeof curScreen!=='undefined'&&curScreen==='district'&&D)resize();}catch(e){}});
document.addEventListener('keydown',e=>{try{if(typeof curScreen==='undefined'||curScreen!=='district'||!D)return;const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(!d)return;e.preventDefault();stepBy(d[0],d[1]);}catch(x){}});
(function reg(n){if(typeof SCREENS!=='undefined'){SCREENS.district=screen;return;}if((n||0)<3000)setTimeout(()=>reg((n||0)+1),50);})(0);
window.Discovery={flag,ride,_dbg:{state:()=>D,build,pathTo,useTile,AREAS,SPOTS,COLS,ROWS}};
})();
