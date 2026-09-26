/* Deep Down: The Science Cave — engine. Needs cave-data.js first.
   Cave.open(host) where host = {player:{id,name,grade,emoji}, state:{} (persisted, mutated here),
   coins(), addCoins(n,why), save(), exit(), event(type,data)?, today()? } */
(function(){
'use strict';
const CD=window.CAVE_DATA;
const COLS=CD.COLS,ROWS=CD.ROWS;
const ROCK_IDS=Object.keys(CD.ROCKS);
const T_AIR=0,T_WATER=100,T_LAVA=101,T_BAR=102,T_GATE=103,T_DOOR=104,T_SHAFT=105;
const GATES={12:{id:'lever',n:'Giant Boulder',e:'🪨'},30:{id:'mirror',n:'Crystal Door',e:'🚪'},48:{id:'sonar',n:'Dark Chamber',e:'🦇'},62:{id:'glow',n:'Glow Door',e:'✨'},98:{id:'pulley',n:'Ore Lift',e:'⛓️'},116:{id:'seismo',n:'Moho Scanner',e:'📈'}};
const WATER_ROWS=[54,55,56];
const CORE_ROW=136;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('en-US');
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(R,a)=>a[Math.floor(R()*a.length)];
function shuffle(R,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function today(){if(H&&H.today)return H.today();const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

let H=null,S=null,W=null,root=null,cv=null,ctx=null,fog=null,fctx=null;
let TS=44,camX=0,camY=0,raf=0,busy=false,uvOn=false,parts=[],msgT=0,lastSave=0,tick=0,hot={};
const TIER=()=>CD.tier(+H.player.grade||3);
const txt=o=>{const t=TIER();return (t>0&&o.o?o.o:o.y)+(t>1&&o.hs?`<div class="cv-h">🧪 ${o.hs}</div>`:'');};

/* ---------------- state ---------------- */
function initState(){
 S.v=1;S.gear=Object.assign({drill:0,suit:0,bat:0,pack:0,lamp:0,uv:0},S.gear||{});
 ['gates','found','idd','fos','ex','crit','geo','seen','stats'].forEach(k=>S[k]=S[k]||{});
 S.pack=S.pack||[];S.rp=S.rp||0;S.maxRow=S.maxRow||0;S.probe=S.probe||{rank:0,best:0,wins:0,day:'',runs:0};
 S.stats.dug=S.stats.dug||0;
 const d=today();
 if(S.day!==d){const first=!S.day;S.day=d;S.dug='';S.obs=[];S.x=4;S.y=0;S.bat=batMax();S.caveIn=!first;S.probe.runs=0;}
 if(S.bat==null)S.bat=batMax();
}
const batMax=()=>CD.BATT[S.gear.bat].v, packMax=()=>CD.PACK[S.gear.pack].v, lampR=()=>CD.LAMP[S.gear.lamp].v;
const drill=()=>CD.DRILLS[S.gear.drill], suit=()=>CD.SUITS[S.gear.suit];
function save(force){const n=Date.now();if(force||n-lastSave>1500){lastSave=n;S.dug=encDug();try{H.save();}catch(e){}}}
function addCoins(n,why){if(n>0){H.addCoins(n,why||'cave');}}
function ev(t,d){try{H.event&&H.event(t,d);}catch(e){}}

/* ---------------- world ---------------- */
const idx=(x,y)=>y*COLS+x;
function layerOf(y){if(y<=0)return null;return CD.LAYERS.find(L=>y>=L.r0&&y<=L.r1)||CD.LAYERS[CD.LAYERS.length-1];}
function rowKm(y){const L=layerOf(y);if(!L)return 0;return L.km0+(L.km1-L.km0)*(y-L.r0)/Math.max(1,L.r1-L.r0);}
function rowTemp(y){const L=layerOf(y);if(!L)return 15;return L.t0+(L.t1-L.t0)*(y-L.r0)/Math.max(1,L.r1-L.r0);}
function rowAtm(y){const km=rowKm(y);return Math.max(1,km<=35?km*270:35*270+(km-35)*300);}
function depthStr(y){const km=rowKm(y);return km<1?fmt(km*1000)+' m':(km<10?km.toFixed(1):fmt(km))+' km';}
function encDug(){if(!W)return S.dug||'';let s='';const b=W.dug;for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s);}
function decDug(str,n){const b=new Uint8Array(Math.ceil(n/8));if(str){try{const s=atob(str);for(let i=0;i<s.length&&i<b.length;i++)b[i]=s.charCodeAt(i);}catch(e){}}return b;}
const isDug=(i)=>(W.dug[i>>3]>>(i&7))&1, setDug=(i)=>{W.dug[i>>3]|=1<<(i&7);};

function genWorld(){
 const R=rng(hash('deepdown|'+H.player.id+'|'+S.day));
 const g=new Uint16Array(ROWS*COLS),items=new Map(),pockets=[];
 const rockCode=id=>1+ROCK_IDS.indexOf(id);
 // rock with blobs of the layer's second rock
 CD.LAYERS.forEach(L=>{
  const blobs=[];for(let k=0;k<6;k++)blobs.push({x:1+R()*(COLS-1),y:L.r0+R()*(L.r1-L.r0),r:1.5+R()*3});
  for(let y=L.r0;y<=L.r1;y++)for(let x=1;x<COLS;x++){
   const inB=L.rock[1]&&blobs.some(b=>(x-b.x)**2+((y-b.y)*1.6)**2<b.r*b.r);
   g[idx(x,y)]=rockCode(inB?L.rock[1]:L.rock[0]);}
 });
 for(let y=0;y<ROWS;y++)g[idx(0,y)]=T_SHAFT;
 for(let x=0;x<COLS;x++)g[idx(x,0)]=T_AIR;g[idx(0,0)]=T_SHAFT;
 // air pockets (open caves)
 const PK={soil:2,sed:3,cave:7,river:4,crystal:6,granite:3,magma:5,mantle:2};
 CD.LAYERS.forEach(L=>{for(let k=0;k<(PK[L.id]||2);k++){
  const big=L.id==='cave'||L.id==='crystal';const rx=1+Math.floor(R()*(big?4:3)),ry=L.id==='magma'?1:1+Math.floor(R()*(big?2:1.5));
  const cx=2+rx+Math.floor(R()*(COLS-4-rx*2)),cy=L.r0+2+ry+Math.floor(R()*Math.max(1,L.r1-L.r0-4-ry*2));
  const cells=[];
  for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){if(x<1||x>=COLS||y<=L.r0||y>=L.r1||GATES[y]||WATER_ROWS.includes(y))continue;
   if(((x-cx)/(rx+.5))**2+((y-cy)/(ry+.5))**2<=1){g[idx(x,y)]=T_AIR;cells.push([x,y]);}}
  if(cells.length){const p={L:L.id,cells};pockets.push(p);
   if(L.id==='magma'){const by=Math.max(...cells.map(c=>c[1]));cells.filter(c=>c[1]===by).forEach(c=>g[idx(c[0],c[1])]=T_LAVA);p.cells=cells.filter(c=>c[1]!==by);}}
 }});
 // underground river
 WATER_ROWS.forEach(y=>{for(let x=1;x<COLS;x++)g[idx(x,y)]=T_WATER;});
 // barrier bands with a gate
 const gateX={};
 Object.keys(GATES).forEach(r=>{r=+r;for(let x=1;x<COLS;x++)g[idx(x,r)]=T_BAR;const gx=6+Math.floor(R()*(COLS-10));gateX[r]=gx;g[idx(gx,r)]=S.gates[GATES[r].id]?T_AIR:T_GATE;});
 for(let x=1;x<COLS;x++)g[idx(x,CORE_ROW)]=T_BAR;const dx=6+Math.floor(R()*(COLS-10));g[idx(dx,CORE_ROW)]=S.gates.core?T_AIR:T_DOOR;gateX[CORE_ROW]=dx;
 // elevator landings at the top of each layer
 CD.LAYERS.forEach(L=>{for(let y=L.r0;y<=L.r0+1;y++)for(let x=1;x<=3;x++)g[idx(x,y)]=T_AIR;});
 // items
 const isRock=i=>g[i]>=1&&g[i]<100;
 const landing=(x,y)=>x<=3&&CD.LAYERS.some(L=>y>=L.r0&&y<=L.r0+1);
 CD.LAYERS.forEach(L=>{
  const mins=Object.keys(CD.MIN).filter(k=>CD.MIN[k].L.includes(L.id));
  const pool=[];mins.forEach(k=>{for(let w=0;w<CD.RAR[CD.MIN[k].r].w;w++)pool.push(k);});
  const n=Math.round((L.r1-L.r0+1)*(COLS-1)*0.055);
  for(let k=0,tries=0;k<n&&tries<500;tries++){const x=1+Math.floor(R()*(COLS-1)),y=L.r0+Math.floor(R()*(L.r1-L.r0+1)),i=idx(x,y);
   if(!isRock(i)||items.has(i)||landing(x,y))continue;items.set(i,{t:'m',id:pick(R,pool)});k++;}
  // fossils: missing pieces, up to 2 per fossil per day
  CD.FOSSILS.filter(f=>f.L===L.id).forEach(f=>{const got=S.fos[f.id]||[];const miss=f.parts.map((_,i)=>i).filter(i=>!got[i]);
   const half=f.top===undefined?[L.r0,L.r1]:f.top?[L.r0,Math.floor((L.r0+L.r1)/2)]:[Math.ceil((L.r0+L.r1)/2),L.r1];
   shuffle(R,miss).slice(0,2).forEach(pi=>{for(let tries=0;tries<200;tries++){const x=1+Math.floor(R()*(COLS-1)),y=half[0]+Math.floor(R()*(half[1]-half[0]+1)),i=idx(x,y);
    if(isRock(i)&&!items.has(i)&&!landing(x,y)){items.set(i,{t:'f',id:f.id,i:pi});break;}}});});
  // critters live in pockets
  const cr=CD.CRITTERS.filter(c=>c.L===L.id);const pk=pockets.filter(p=>p.L===L.id&&p.cells.length);
  cr.forEach((c,ci)=>{const p=pk[ci%Math.max(1,pk.length)];if(!p)return;const cell=pick(R,p.cells);const i=idx(cell[0],cell[1]);if(!items.has(i))items.set(i,{t:'c',id:c.id});});
 });
 // daily secret pocket (geode) somewhere you have already been able to reach
 const maxR=Math.max(10,Math.min(S.maxRow,CORE_ROW-1));let pocket=null;
 for(let tries=0;tries<300&&!pocket;tries++){const x=1+Math.floor(R()*(COLS-1)),y=2+Math.floor(R()*(maxR-1)),i=idx(x,y);if(isRock(i)&&!items.has(i)&&!landing(x,y)){pocket={x,y,id:pick(R,CD.GEODES).id};items.set(i,{t:'g',id:pocket.id});}}
 W={g,items,pockets,gateX,pocket,dug:decDug(S.dug,ROWS*COLS)};
 for(let i=0;i<ROWS*COLS;i++)if(isDug(i)){if(g[i]>=1&&g[i]<100||g[i]===T_GATE||g[i]===T_DOOR)g[i]=T_AIR;items.delete(i);}
 (S.obs||[]).forEach(i=>items.delete(i));
 // per-tile texture seeds
 W.tex=new Uint8Array(ROWS*COLS);for(let i=0;i<W.tex.length;i++)W.tex[i]=Math.floor(R()*256);
}
const tile=(x,y)=>(x<0||x>=COLS||y<0||y>=ROWS)?T_BAR:W.g[idx(x,y)];
const rockOf=c=>c>=1&&c<100?CD.ROCKS[ROCK_IDS[c-1]]:null;

/* ---------------- drawing helpers ---------------- */
function gemPath(c,x,y,s,sh){
 c.beginPath();
 if(sh==='cube'){c.rect(x-s*.42,y-s*.42,s*.84,s*.84);}
 else if(sh==='nugget'){c.moveTo(x-s*.45,y);c.quadraticCurveTo(x-s*.4,y-s*.5,x,y-s*.38);c.quadraticCurveTo(x+s*.5,y-s*.45,x+s*.45,y+s*.05);c.quadraticCurveTo(x+s*.35,y+s*.45,x-s*.05,y+s*.4);c.quadraticCurveTo(x-s*.5,y+s*.4,x-s*.45,y);}
 else if(sh==='sheet'){c.rect(x-s*.45,y-s*.3,s*.9,s*.16);c.rect(x-s*.4,y-s*.08,s*.85,s*.16);c.rect(x-s*.45,y+s*.14,s*.9,s*.16);}
 else if(sh==='round'){c.arc(x,y,s*.42,0,Math.PI*2);}
 else if(sh==='glass'){c.moveTo(x-s*.45,y+s*.4);c.lineTo(x-s*.1,y-s*.48);c.lineTo(x+s*.45,y+s*.2);c.lineTo(x+s*.1,y+s*.42);c.closePath();}
 else {c.moveTo(x,y-s*.5);c.lineTo(x+s*.3,y-s*.22);c.lineTo(x+s*.3,y+s*.35);c.lineTo(x,y+s*.5);c.lineTo(x-s*.3,y+s*.35);c.lineTo(x-s*.3,y-s*.22);c.closePath();}
}
function drawGem(c,x,y,s,col,sh,glow){
 c.save();if(glow){c.shadowColor=glow;c.shadowBlur=s*.8;}
 gemPath(c,x,y,s,sh);c.fillStyle=glow||col;c.fill();c.lineWidth=Math.max(1,s*.05);c.strokeStyle='rgba(0,0,0,.45)';c.stroke();
 c.shadowBlur=0;c.globalAlpha=.55;c.fillStyle='#fff';c.beginPath();c.arc(x-s*.12,y-s*.14,s*.08,0,Math.PI*2);c.fill();c.restore();
}
function gemSVG(m,size,glow){
 size=size||44;const col=glow||m.col,sh=m.sh;let d;
 const P=(pts)=>'M'+pts.map(p=>p.join(' ')).join(' L')+' Z';
 if(sh==='cube')d='<rect x="8" y="8" width="28" height="28" rx="3"/>';
 else if(sh==='round')d='<circle cx="22" cy="22" r="16"/>';
 else if(sh==='sheet')d='<rect x="5" y="10" width="34" height="7" rx="2"/><rect x="7" y="19" width="32" height="7" rx="2"/><rect x="5" y="28" width="34" height="7" rx="2"/>';
 else if(sh==='nugget')d='<path d="M6 22 Q8 8 22 10 Q40 6 38 24 Q36 38 20 36 Q4 36 6 22 Z"/>';
 else if(sh==='glass')d=`<path d="${P([[6,38],[18,4],[40,30],[24,40]])}"/>`;
 else d=`<path d="${P([[22,2],[35,14],[35,32],[22,42],[9,32],[9,14]])}"/>`;
 return `<svg class="cv-gem" width="${size}" height="${size}" viewBox="0 0 44 44" style="${glow?`filter:drop-shadow(0 0 6px ${glow})`:''}"><g fill="${col}" stroke="rgba(0,0,0,.45)" stroke-width="1.5">${d}</g><circle cx="17" cy="16" r="3" fill="#fff" opacity=".6"/></svg>`;
}
const TRILO='<svg viewBox="0 0 40 40" width="1em" height="1em" style="vertical-align:-.12em"><ellipse cx="20" cy="21" rx="12" ry="16" fill="#9c8468"/><path d="M8 12 Q20 2 32 12 Q20 16 8 12Z" fill="#7a6650"/><g stroke="#5e4c3a" stroke-width="1.6">'+[16,20,24,28,32].map(y=>`<line x1="10" y1="${y}" x2="30" y2="${y}"/>`).join('')+'</g><line x1="20" y1="10" x2="20" y2="36" stroke="#5e4c3a" stroke-width="2"/></svg>';
const femo=f=>f.e==='trilobite'?TRILO:f.e;

/* ---------------- DOM ---------------- */
function build(){
 root=document.createElement('div');root.className='cv';root.id='cvRoot';
 root.innerHTML=`<canvas id="cvC"></canvas>
 <div class="cv-top"><div class="cv-row1"><div class="cv-chip" id="cvLayer"></div><div class="cv-res"><span id="cvCoins"></span><span id="cvRP"></span><span id="cvPack"></span></div><button class="cv-x" id="cvExit" aria-label="Leave the cave">✕</button></div>
  <div class="cv-row2"><div class="cv-g" id="cvG"></div><div class="cv-bat" title="Battery"><i id="cvBatI"></i><span id="cvBatT"></span></div></div></div>
 <div class="cv-depth" id="cvDepth"></div>
 <div class="cv-msg" id="cvMsg"></div>
 <div class="cv-pad" id="cvPad"><button data-d="0,-1" class="u">▲</button><button data-d="-1,0" class="l">◀</button><button data-d="1,0" class="r">▶</button><button data-d="0,1" class="d">▼</button></div>
 <div class="cv-acts" id="cvActs"></div>
 <div class="cv-mod" id="cvMod"></div>`;
 document.body.appendChild(root);
 cv=root.querySelector('#cvC');ctx=cv.getContext('2d');fog=document.createElement('canvas');fctx=fog.getContext('2d');
 root.querySelector('#cvExit').onclick=()=>leave();
 // d-pad with hold-to-repeat
 root.querySelectorAll('#cvPad button').forEach(b=>{const [dx,dy]=b.dataset.d.split(',').map(Number);let t=null;
  const stop=()=>{clearInterval(t);t=null;};
  b.addEventListener('pointerdown',e=>{e.preventDefault();stop();step(dx,dy);t=setInterval(()=>step(dx,dy),150);});
  ['pointerup','pointerleave','pointercancel'].forEach(k=>b.addEventListener(k,stop));});
 // tap / swipe on the canvas
 let sx=0,sy=0,st=0;
 cv.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;st=Date.now();});
 cv.addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;
  if(Math.hypot(dx,dy)>30){Math.abs(dx)>Math.abs(dy)?step(Math.sign(dx),0):step(0,Math.sign(dy));return;}
  const r=cv.getBoundingClientRect();const wx=(e.clientX-r.left+camX)/TS,wy=(e.clientY-r.top+camY)/TS;
  const tx=Math.floor(wx),ty=Math.floor(wy);
  const it=W.items.get(idx(tx,ty));
  if(it&&it.t==='c'&&Math.abs(tx-S.x)+Math.abs(ty-S.y)<=lampR()+1&&tile(tx,ty)===T_AIR){observe(idx(tx,ty),it);return;}
  const ddx=wx-(S.x+.5),ddy=wy-(S.y+.5);if(Math.abs(ddx)<.5&&Math.abs(ddy)<.5)return;
  Math.abs(ddx)>Math.abs(ddy)?step(Math.sign(ddx),0):step(0,Math.sign(ddy));});
 window.addEventListener('keydown',onKey);window.addEventListener('resize',resize);
 resize();
}
function onKey(e){if(!root||modalOpen())return;const k=e.key;const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[k];if(m){e.preventDefault();step(m[0],m[1]);}}
function resize(){if(!cv)return;const dpr=Math.min(2,window.devicePixelRatio||1);const w=root.clientWidth,h=root.clientHeight;
 cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+'px';cv.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);fog.width=w*dpr;fog.height=h*dpr;fctx.setTransform(dpr,0,0,dpr,0,0);
 TS=Math.max(30,Math.min(56,Math.round(Math.min(w/12.5,h/13))));snapCam();}

/* ---------------- movement ---------------- */
let lastStep=0,STEP_MS=90;
function step(dx,dy){
 if(busy||modalOpen())return;const now=Date.now();if(now-lastStep<STEP_MS)return;lastStep=now;
 const nx=S.x+dx,ny=S.y+dy;
 if(nx<1||nx>=COLS||ny<0||ny>=ROWS)return;
 if(ny===0&&S.y===0){S.x=nx;after();return;}
 const t=tile(nx,ny);
 if(ny>0&&t!==T_BAR&&t!==T_GATE&&t!==T_DOOR){const tp=rowTemp(ny);if(tp>suit().t){say(`🥵 Too hot! It's ${fmt(tp)} °C down there. Your ${suit().n} is safe to ${fmt(suit().t)} °C. Upgrade your suit at the 🛒 Gear shop.`);return;}}
 if(t===T_AIR){S.x=nx;S.y=ny;after();return;}
 if(t===T_SHAFT)return;
 if(t===T_WATER){if(S.gates.raft){S.x=nx;S.y=ny;after();}else openPuzzle('raft');return;}
 if(t===T_LAVA){if(suit().t>=1200){S.x=nx;S.y=ny;after();say('🔥 Walking over lava in Magma Armor! Lava is about 1,100 °C.');}else say('🌋 Lava! It\'s about 1,100 °C — hot enough to melt rock. Go around it.');return;}
 if(t===T_BAR){const g=GATES[ny];
  if(ny===CORE_ROW)say('🧱 Super-dense mantle rock. Look for the 💠 Core Door in this band.');
  else if(g&&g.id==='glow'&&!S.gear.uv)say('✨ Something on this wall glows very faintly… A 🔦 UV lamp would show it. (Gear shop)');
  else if(g&&g.id==='glow'&&!uvOn)say('✨ Turn on your 🔦 UV lamp to find the glowing door.');
  else say(`🧱 This rock band is too tough to dig. Find the ${g?g.e+' '+g.n:'gate'} somewhere along it.`);return;}
 if(t===T_GATE){const g=GATES[ny];if(g.id==='glow'&&!uvOn){say(S.gear.uv?'✨ Turn on your 🔦 UV lamp — this door only shows up in UV light.':'✨ Something glows faintly here… You need a 🔦 UV lamp.');return;}openPuzzle(g.id);return;}
 if(t===T_DOOR){if(S.gear.drill<4){say('💠 The Core Door! It is harder than anything but diamond. You need the 💎 Diamond Drill.');return;}
  if(suit().t<1300){say('💠 It is about 1,300 °C here. You need 🔥 Magma Armor to open the Core Door.');return;}
  S.gates.core=1;W.g[idx(nx,ny)]=T_AIR;setDug(idx(nx,ny));save(true);openProbe();return;}
 const rk=rockOf(t);if(!rk)return;
 if(rk.h>drill().h){say(`⛏️ Too hard! ${rk.n} is about ${rk.h} on the hardness scale. Your ${drill().e} ${drill().n} digs up to ${drill().h}. Upgrade in the 🛒 Gear shop.`);return;}
 const cost=rk.h>drill().h-1.5?2:1;
 if(S.bat<cost){beamHome('battery');return;}
 S.bat-=cost;const i=idx(nx,ny);W.g[i]=T_AIR;setDug(i);S.stats.dug++;burst(nx,ny,rk.col);
 S.x=nx;S.y=ny;after();
 if(S.bat<=0)setTimeout(()=>beamHome('battery'),400);
}
function after(){
 const i=idx(S.x,S.y);const it=W.items.get(i);
 if(it&&it.t!=='c'){if(S.pack.length>=packMax()){say(`🎒 Backpack full (${packMax()})! Tap 🏠 to beam to camp and study your finds.`);}
  else{W.items.delete(i);setDug(i);
   if(it.t==='m'){S.pack.push({t:'m',id:it.id,k:Date.now().toString(36)+Math.random().toString(36).slice(2,5),tests:{}});say(`${CD.MIN[it.id].sh==='nugget'?'✨':'💎'} You found a mystery mineral! Study it in the 🔬 Lab.`);}
   else if(it.t==='f'){S.pack.push({t:'f',id:it.id,i:it.i});const f=CD.FOSSILS.find(x=>x.id===it.id);say(`🦴 A fossil piece! Looks like part of a ${f.n} (${f.parts[it.i]}).`);}
   else if(it.t==='g'){S.pack.push({t:'g',id:it.id});say('🔮 You found today\'s SECRET POCKET — a geode! Crack it open in the 🔬 Lab.');}
  }}
 // critter next to you? observe automatically when you bump into it
 [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{const j=idx(S.x+a,S.y+b);const c=W.items.get(j);if(c&&c.t==='c'&&!S.crit[c.id]&&S.x+a>0)observe(j,c);});
 if(S.y>S.maxRow){S.maxRow=S.y;ev('depth',{row:S.y,km:rowKm(S.y)});}
 const L=layerOf(S.y);if(L&&!S.seen[L.id]){S.seen[L.id]=1;save(true);layerCard(L);}
 hud();save();
}
function beamHome(why){
 S.x=4;S.y=0;S.bat=batMax();uvOn=false;snapCam();
 const fos=S.pack.filter(p=>p.t==='f');let msg=why==='battery'?'🔋 Battery empty — the rescue rope pulled you back to camp. Battery recharged!':'🏠 Back at camp. Battery recharged!';
 if(fos.length){fos.forEach(p=>{S.fos[p.id]=S.fos[p.id]||[];S.fos[p.id][p.i]=1;});S.pack=S.pack.filter(p=>p.t!=='f');msg+=` 🦴 ${fos.length} fossil piece${fos.length>1?'s':''} sent to the 🏛️ Museum.`;}
 say(msg);hud();save(true);
}
function burst(x,y,col){for(let k=0;k<10;k++)parts.push({x:(x+.5)*TS,y:(y+.5)*TS,vx:(Math.random()-.5)*5,vy:(Math.random()-.8)*4,l:1,col});}
function say(m,ms){const el=root&&root.querySelector('#cvMsg');if(!el)return;el.innerHTML=m;el.classList.add('show');clearTimeout(msgT);msgT=setTimeout(()=>el.classList.remove('show'),ms||3800);}
function observe(i,c){const cr=CD.CRITTERS.find(x=>x.id===c.id);W.items.delete(i);S.obs=S.obs||[];S.obs.push(i);
 const first=!S.crit[cr.id];S.crit[cr.id]=(S.crit[cr.id]||0)+1;let rew='';
 if(first){addCoins(20,'critter');S.rp+=4;rew='<div class="cv-rew">+20 🪙 · +4 🔬 New critter in your Journal!</div>';ev('critter',{id:cr.id});}
 modal(`<div class="cv-card"><div class="cv-big ${cr.glow?'cv-glowe':''}">${cr.e}</div><h2>${first?'New critter!':'Hello again!'}<br>${esc(cr.n)}</h2>${cr.tiny?'<div class="cv-tag">🔬 Seen through your microscope</div>':''}<p>${txt(cr)}</p>${rew}<button class="cv-btn" data-close>Cool!</button></div>`);save(true);hud();}
function layerCard(L){const t=TIER();
 modal(`<div class="cv-card cv-layer" style="--lc:${L.col}"><div class="cv-big">${L.e}</div><h2>${esc(L.n)}</h2><div class="cv-stats"><span>📏 ${L.r0<=1?'0':depthStr(L.r0)} – ${depthStr(L.r1)} deep</span><span>🌡️ ${L.t0===L.t1?fmt(L.t0):fmt(L.t0)+' – '+fmt(L.t1)} °C</span>${t?`<span>⏲️ ${fmt(rowAtm(L.r0))} atm</span>`:''}</div><p>${txt(L)}</p><button class="cv-btn" data-close>Let's explore!</button></div>`);}

/* ---------------- render ---------------- */
function snapCam(){const w=root.clientWidth,h=root.clientHeight;camX=tcx(w);camY=tcy(h);}
function tcx(w){const ww=COLS*TS;return ww<=w?(ww-w)/2:Math.max(0,Math.min(ww-w,(S.x+.5)*TS-w/2));}
function tcy(h){return Math.max(-TS*3,Math.min(ROWS*TS-h+TS*2,(S.y+.5)*TS-h*.45));}
function frame(){
 raf=requestAnimationFrame(frame);if(!root||!W)return;tick++;
 const w=root.clientWidth,h=root.clientHeight;camX+=(tcx(w)-camX)*.2;camY+=(tcy(h)-camY)*.2;
 const c=ctx;c.clearRect(0,0,w,h);
 // sky
 const skyB=-camY+TS;if(skyB>0){const gr=c.createLinearGradient(0,0,0,skyB);gr.addColorStop(0,'#7cc6ff');gr.addColorStop(1,'#cdeeff');c.fillStyle=gr;c.fillRect(0,0,w,skyB);}
 c.fillStyle='#120b16';c.fillRect(0,Math.max(0,skyB),w,h);
 const x0=Math.max(0,Math.floor(camX/TS)),x1=Math.min(COLS-1,Math.ceil((camX+w)/TS)),y0=Math.max(0,Math.floor(camY/TS)),y1=Math.min(ROWS-1,Math.ceil((camY+h)/TS));
 const T=TS;
 for(let y=y0;y<=y1;y++){const L=layerOf(y);for(let x=x0;x<=x1;x++){const i=idx(x,y),t=W.g[i],px=x*T-camX,py=y*T-camY,tx=W.tex[i];
  if(y===0){if(x===0){drawShaft(c,px,py,T,true);}continue;}
  if(t===T_SHAFT){drawShaft(c,px,py,T,false);continue;}
  if(t===T_AIR){c.fillStyle=L?shade(L.col2,-.55):'#000';c.fillRect(px,py,T+1,T+1);
   if(L&&L.id==='cave'&&tile(x,y-1)<100&&tile(x,y-1)>0&&tx%3===0){c.fillStyle='#d8d2c0';c.beginPath();c.moveTo(px+T*.3,py);c.lineTo(px+T*.5,py+T*(.3+tx%5*.06));c.lineTo(px+T*.7,py);c.fill();}
   if(L&&L.id==='crystal'&&tx%4===0){c.fillStyle='rgba(190,160,255,.35)';c.beginPath();c.moveTo(px+T*.2,py+T);c.lineTo(px+T*.35,py+T*.45);c.lineTo(px+T*.5,py+T);c.fill();}
   continue;}
  if(t===T_WATER){c.fillStyle=S.gates.raft?'#2d6fa8':'#1f5f99';c.fillRect(px,py,T+1,T+1);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();const o=(tick*.05+x)%(Math.PI*2);c.moveTo(px,py+T*.4+Math.sin(o)*3);c.quadraticCurveTo(px+T/2,py+T*.2+Math.sin(o+1)*3,px+T,py+T*.4+Math.sin(o+2)*3);c.stroke();
   if(S.gates.raft&&y===54&&x%6===2){c.fillStyle='#b98a52';c.fillRect(px+2,py+T*.55,T*1.8,T*.25);}continue;}
  if(t===T_LAVA){const f=.5+.5*Math.sin(tick*.08+x);c.fillStyle=`rgb(${230+25*f|0},${80+60*f|0},20)`;c.fillRect(px,py,T+1,T+1);continue;}
  if(t===T_BAR||t===T_GATE||t===T_DOOR){c.fillStyle='#2a2230';c.fillRect(px,py,T+1,T+1);c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=2;c.beginPath();c.moveTo(px,py+T);c.lineTo(px+T,py);c.moveTo(px,py+T/2);c.lineTo(px+T/2,py);c.stroke();
   if(t===T_GATE){const g=GATES[y];if(g.id!=='glow'||uvOn)drawIcon(c,g.e,px,py,T,g.id==='glow'?'#39ff6a':'#ffd43b');}
   if(t===T_DOOR)drawIcon(c,'💠',px,py,T,'#7fb6ff');continue;}
  const rk=rockOf(t);c.fillStyle=shade(rk.col,((tx%7)-3)*.03);c.fillRect(px,py,T+1,T+1);
  c.fillStyle='rgba(0,0,0,.16)';c.fillRect(px+(tx%5)*T*.15+2,py+(tx>>3&7)*T*.1+2,T*.12,T*.1);c.fillRect(px+((tx>>2)%5)*T*.17+3,py+((tx>>5)%5)*T*.16+T*.3,T*.1,T*.08);
  if(L&&L.id==='sed'){c.fillStyle='rgba(255,255,255,.07)';c.fillRect(px,py+T*((y%3)/3),T+1,T*.12);}
 }}
 // items
 const lr=lampR();
 W.items.forEach((it,i)=>{const x=i%COLS,y=(i/COLS)|0;if(x<x0-1||x>x1+1||y<y0-1||y>y1+1)return;const px=x*T-camX+T/2,py=y*T-camY+T/2;const dist=Math.hypot(x-S.x,y-S.y);
  const inAir=W.g[i]===T_AIR;
  if(it.t==='m'){const m=CD.MIN[it.id];const hideNoUV=layerOf(y)&&layerOf(y).id==='crystal'&&m.u;
   if(uvOn&&m.u&&dist<=lr*1.4){drawGem(ctx,px,py,T*.55,m.col,m.sh,m.u);return;}
   if(hideNoUV||dist>lr+.5)return;drawGem(ctx,px,py,inAir?T*.6:T*.46,m.col,m.sh);sparkle(px,py,i);}
  else if(it.t==='f'){if(dist>lr+.5)return;drawBone(c,px,py,T*(inAir?.6:.45));}
  else if(it.t==='g'){if(dist>lr*2.2)return;c.save();c.shadowColor='#e0b0ff';c.shadowBlur=14;c.font=`${T*.55}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🔮',px,py+Math.sin(tick*.08)*2);c.restore();}
  else if(it.t==='c'){const cr=CD.CRITTERS.find(z=>z.id===it.id);if(dist>lr+.5&&!(cr.glow&&dist<lr*2.5))return;c.save();if(cr.glow){c.shadowColor='#8fffe0';c.shadowBlur=18;}c.font=`${T*(cr.tiny?.45:.62)}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(cr.e,px+Math.sin(tick*.05+i)*T*.12,py+Math.cos(tick*.07+i)*T*.06);c.restore();
   if(cr.tiny){c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2;c.beginPath();c.arc(px,py,T*.36,0,Math.PI*2);c.stroke();}}
 });
 // surface camp
 if(skyB>-T){drawCamp(c,T);}
 // player
 const ppx=(S.x+.5)*T-camX,ppy=(S.y+.5)*T-camY;
 c.font=`${T*.72}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(H.player.emoji||'🧑‍🚀',ppx,ppy+2);
 c.font=`${T*.34}px serif`;c.fillText('⛑️',ppx,ppy-T*.33);
 // particles
 parts=parts.filter(p=>p.l>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.3;p.l-=.04;c.globalAlpha=Math.max(0,p.l);c.fillStyle=p.col;c.fillRect(p.x-camX-3,p.y-camY-3,6,6);});c.globalAlpha=1;
 // darkness
 {const f=fctx;f.globalCompositeOperation='source-over';f.clearRect(0,0,w,h);const top=Math.max(0,T-camY);
  const depth=S.y<=12?.5:Math.min(.95,.62+S.y/80);
  f.fillStyle=uvOn?`rgba(25,0,45,${depth})`:`rgba(5,3,8,${depth})`;f.fillRect(0,top,w,h-top);
  f.globalCompositeOperation='destination-out';const rad=(uvOn?lr*.8:lr)*T;const gr=f.createRadialGradient(ppx,ppy,rad*.35,ppx,ppy,rad);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');f.fillStyle=gr;f.beginPath();f.arc(ppx,ppy,rad,0,Math.PI*2);f.fill();
  c.drawImage(fog,0,0,w,h);
  if(uvOn){W.items.forEach((it,i)=>{if(it.t!=='m')return;const m=CD.MIN[it.id];if(!m.u)return;const x=i%COLS,y=(i/COLS)|0;if(Math.hypot(x-S.x,y-S.y)>lr*1.4)return;drawGem(c,x*T-camX+T/2,y*T-camY+T/2,T*.5,m.col,m.sh,m.u);});
   const gy=Object.keys(GATES).find(r=>GATES[r].id==='glow');const gx=W.gateX[gy];if(W.g[idx(gx,+gy)]===T_GATE&&Math.hypot(gx-S.x,gy-S.y)<lr*3)drawIcon(c,'✨',gx*T-camX,gy*T-camY,T,'#39ff6a');}
 }
}
function drawBone(c,x,y,s){c.save();c.translate(x,y);c.rotate(-.5);c.fillStyle='#f3ead2';c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1.5;c.beginPath();c.rect(-s*.35,-s*.09,s*.7,s*.18);[[-.38,-.12],[-.38,.12],[.38,-.12],[.38,.12]].forEach(([a,b])=>{c.moveTo(s*a+s*.13,s*b);c.arc(s*a,s*b,s*.13,0,Math.PI*2);});c.fill();c.stroke();c.restore();}
function sparkle(px,py,i){if((tick+i*7)%60<8){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(px+TS*.18,py-TS*.22,3,3);}}
function drawIcon(c,e,px,py,T,glow){c.save();c.shadowColor=glow;c.shadowBlur=12+6*Math.sin(tick*.1);c.font=`${T*.6}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(e,px+T/2,py+T/2);c.restore();}
function drawShaft(c,px,py,T,top){c.fillStyle='#3a3340';c.fillRect(px,py,T+1,T+1);c.fillStyle='#8a8494';c.fillRect(px+T*.18,py,T*.08,T+1);c.fillRect(px+T*.74,py,T*.08,T+1);
 if(top){c.fillStyle='#ffd43b';c.fillRect(px+T*.25,py+T*.15,T*.5,T*.7);c.font=`${T*.4}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🛗',px+T/2,py+T/2);}}
const CAMP=[{x:3,e:'🏕️',n:'Camp'},{x:6,e:'🔬',n:'Lab'},{x:9,e:'🛒',n:'Gear'},{x:12,e:'🏛️',n:'Museum'},{x:15,e:'🌱',n:'Garden'},{x:18,e:'📓',n:'Journal'}];
function drawCamp(c,T){const gy=T-camY;c.fillStyle='#4caf50';c.fillRect(0,gy-4,COLS*T,8);
 CAMP.forEach(b=>{const px=(b.x+.5)*T-camX;c.font=`${T*.8}px serif`;c.textAlign='center';c.textBaseline='bottom';c.fillText(b.e,px,gy-2);
  c.font=`600 ${Math.max(10,T*.26)}px Fredoka,sans-serif`;c.fillStyle='#1d3a5a';c.textBaseline='top';c.fillText(b.n,px,gy-T*1.15);});}
function shade(hex,amt){let n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;const f=amt<0?0:255,p=Math.abs(amt);r=Math.round((f-r)*p+r);g=Math.round((f-g)*p+g);b=Math.round((f-b)*p+b);return`rgb(${r},${g},${b})`;}

/* ---------------- HUD ---------------- */
function hud(){if(!root)return;const q=s=>root.querySelector(s);const L=layerOf(S.y);
 q('#cvLayer').innerHTML=S.y===0?'🏕️ Base Camp':`${L.e} ${esc(L.n)}`;
 q('#cvCoins').textContent='🪙 '+fmt(H.coins());q('#cvRP').textContent='🔬 '+fmt(S.rp);q('#cvPack').textContent=`🎒 ${S.pack.length}/${packMax()}`;
 const t=rowTemp(S.y),hotw=S.y>0&&t>suit().t*.85;
 q('#cvG').innerHTML=`<span>📏 ${S.y===0?'Surface':depthStr(S.y)}</span><span class="${hotw?'warn':''}">🌡️ ${fmt(t)} °C</span>${TIER()?`<span>⏲️ ${fmt(rowAtm(S.y))} atm</span>`:''}`;
 const bm=batMax();q('#cvBatI').style.width=(S.bat/bm*100)+'%';q('#cvBatI').className=S.bat/bm<.25?'low':'';q('#cvBatT').textContent=`🔋 ${S.bat}/${bm}`;
 // depth bar
 let db='';CD.LAYERS.forEach(L=>{db+=`<i style="flex:${L.r1-L.r0+1};background:${L.col}" title="${esc(L.n)}"></i>`;});
 const pct=r=>(r/ROWS*100).toFixed(2)+'%';
 db+=`<b class="me" style="top:${pct(S.y)}"></b><b class="max" style="top:${pct(S.maxRow)}"></b>`;
 if(W.pocket&&W.items.has(idx(W.pocket.x,W.pocket.y)))db+=`<b class="pk" style="top:${pct(W.pocket.y)}">✨</b>`;
 q('#cvDepth').innerHTML=db;
 // action buttons
 let a='';
 if(S.y===0){const unk=S.pack.filter(p=>p.t!=='f').length;
  a+=`<button class="cv-act" data-a="lab">🔬<span>Lab</span>${unk?`<em>${unk}</em>`:''}</button><button class="cv-act" data-a="gear">🛒<span>Gear</span></button><button class="cv-act" data-a="museum">🏛️<span>Museum</span>${museumReady()?'<em>!</em>':''}</button>`;
  if(S.seen.cave)a+=`<button class="cv-act" data-a="garden">🌱<span>Garden</span>${S.garden&&S.garden.last!==S.day?'<em>💧</em>':''}</button>`;
  a+=`<button class="cv-act" data-a="journal">📓<span>Journal</span></button><button class="cv-act" data-a="elev">🛗<span>Elevator</span></button>`;
  if(S.gates.core)a+=`<button class="cv-act" data-a="probe">🚀<span>Core Probe</span></button>`;
 }else{a+=`<button class="cv-act" data-a="home">🏠<span>Camp</span></button>`;if(S.gear.uv)a+=`<button class="cv-act ${uvOn?'on':''}" data-a="uv">🔦<span>UV ${uvOn?'on':'off'}</span></button>`;}
 const acts=q('#cvActs');if(acts.dataset.h!==a){acts.innerHTML=a;acts.dataset.h=a;acts.querySelectorAll('button').forEach(b=>b.onclick=()=>act(b.dataset.a));}
}
function act(a){({lab:openLab,gear:openGear,museum:openMuseum,garden:openGarden,journal:openJournal,elev:openElevator,probe:openProbe,home:()=>beamHome(),uv:()=>{uvOn=!uvOn;hud();say(uvOn?'🔦 UV lamp ON — fluorescent minerals glow! (Your normal light is dimmer.)':'🔦 UV lamp off.',2200);}})[a]();}

/* ---------------- modal ---------------- */
function modalOpen(){return root&&root.querySelector('#cvMod').classList.contains('show');}
function modal(html,opts){const m=root.querySelector('#cvMod');m.innerHTML=`<div class="cv-sheet ${opts&&opts.wide?'wide':''}">${opts&&opts.noX?'':'<button class="cv-mx" data-close aria-label="Close">✕</button>'}${html}</div>`;m.classList.add('show');
 m.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal());m.scrollTop=0;return m.querySelector('.cv-sheet');}
function closeModal(){const m=root.querySelector('#cvMod');m.classList.remove('show');m.innerHTML='';if(onClose){const f=onClose;onClose=null;f();}hud();}
let onClose=null;

/* ---------------- Field Lab ---------------- */
const STREAK_NAMES={'#ffffff':'white','#2f3a2a':'greenish-black','#8fe3a9':'light green','#8ec5ff':'light blue','#1b1b1b':'black','#8b2a1e':'red-brown','#e8b923':'golden yellow','#5a5f66':'lead grey','#fff59a':'pale yellow'};
const UV_NAMES={'#ff5a3d':'orange-red','#5cc8ff':'bright blue','#39ff6a':'neon green','#ff2a2a':'red','#7fb6ff':'pale blue'};
const sw=c=>`<i class="cv-sw" style="background:${c}"></i>`;
function hardWord(h){const t=TIER();if(t)return String(h);return h<=2.5?'soft':h<=3.5?'medium':h<=5.5?'hard':h<=7?'very hard':'super hard';}
function testText(m,id){const t=TIER();
 if(id==='look')return `Color & look: <b>${esc(m.look)}</b>`;
 if(id.startsWith('scratch:')){const tl=CD.TOOLS.find(x=>x.id===id.slice(8));const s=m.h<=tl.h;
  return `${tl.e} ${tl.n}${t?` (${tl.h})`:''}: `+(s?`<b>scratched it!</b> ${t?`→ hardness ≤ ${tl.h}`:`It is softer than a ${tl.n.toLowerCase()}.`}`:`<b>no scratch.</b> ${t?`→ hardness > ${tl.h}`:`It is harder than a ${tl.n.toLowerCase()}.`}`);}
 if(id==='streak')return m.s?`Streak: ${sw(m.s)} <b>${STREAK_NAMES[m.s]}</b>`:`Streak: <b>none</b> — it scratched the plate instead!${t?' (harder than 6.5)':''}`;
 if(id==='acid')return m.f?`🧪 <b>Fizz!</b> Bubbles of carbon dioxide gas.${t>1?' (a carbonate)':''}`:'🧪 Nothing happens.';
 if(id==='magnet')return m.m?'🧲 <b>SNAP!</b> It sticks to the magnet.':'🧲 No pull at all.';
 if(id==='water')return m.w?'💧 <b>It dissolved!</b>':'💧 Nothing — it does not dissolve.';
 if(id==='uv')return m.u?`🔦 <b>It glows</b> ${sw(m.u)} ${UV_NAMES[m.u]}!`:'🔦 No glow.';
 return '';}
function openLab(){
 const list=S.pack.filter(p=>p.t!=='f');
 const cards=list.map(p=>p.t==='g'?`<button class="cv-spec" data-k="g:${S.pack.indexOf(p)}"><span class="cv-big2">🔮</span><b>Geode</b><small>Crack it open!</small></button>`
  :`<button class="cv-spec" data-k="${p.k}">${gemSVG(CD.MIN[p.id],54)}<b>Mystery #${S.pack.indexOf(p)+1}</b><small>${Object.keys(p.tests).length} test${Object.keys(p.tests).length===1?'':'s'} done</small></button>`).join('');
 modal(`<h2>🔬 Field Lab</h2><p class="cv-sub">Real geologists identify minerals with simple tests. Pick a specimen to study.</p>${list.length?`<div class="cv-specs">${cards}</div>`:'<div class="cv-empty">Your backpack has no specimens. Dig for sparkles 💎 underground!</div>'}`,{wide:1});
 root.querySelectorAll('.cv-spec').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k.startsWith('g:'))crackGeode(+k.slice(2));else bench(k);});
}
function crackGeode(i){const p=S.pack[i];const g=CD.GEODES.find(x=>x.id===p.id);S.pack.splice(i,1);const first=!S.geo[g.id];S.geo[g.id]=(S.geo[g.id]||0)+1;addCoins(g.c,'geode');S.rp+=first?8:2;save(true);
 modal(`<div class="cv-card"><div class="cv-geode" style="--gc:${g.col}"><i></i></div><h2>🔨 Crack! ${esc(g.n)}</h2><p>${esc(g.y)}</p><p class="cv-sub">A geode starts as a hollow bubble in rock. Mineral-rich water seeps in and, over thousands of years, crystals grow inward from the walls.</p><div class="cv-rew">+${g.c} 🪙 · +${first?8:2} 🔬</div><button class="cv-btn" data-close>Beautiful!</button></div>`);onClose=openLab;ev('geode',{id:g.id});}
function bench(k,note){
 const p=S.pack.find(x=>x.k===k);if(!p)return openLab();const m=CD.MIN[p.id];
 const need=S.idd[p.id]?1:2,done=Object.keys(p.tests).length;
 const tbtn=CD.TESTS.map(t=>{const dis=t.uv&&!S.gear.uv;const did=t.id==='scratch'?Object.keys(p.tests).some(x=>x.startsWith('scratch:')):p.tests[t.id];
  return `<button class="cv-test ${did?'did':''}" data-t="${t.id}" ${dis?'disabled':''}>${t.e}<span>${t.n}</span>${dis?'<small>needs UV lamp</small>':''}</button>`;}).join('');
 const res=Object.keys(p.tests).map(id=>`<li>${testText(m,id)}</li>`).join('');
 modal(`<button class="cv-back" data-back>‹ Lab</button><h2>🔬 Mystery #${S.pack.indexOf(p)+1}</h2>
  <div class="cv-bench"><div class="cv-specimen">${gemSVG(m,110)}</div><div class="cv-tests">${tbtn}</div></div>
  <div id="cvTool"></div>
  <div class="cv-log"><h4>📋 Your clues</h4>${res?`<ul>${res}</ul>`:'<p class="cv-sub">Run a test to get clues!</p>'}</div>
  ${note||''}
  <div class="cv-row"><button class="cv-btn ${done>=need?'':'dis'}" id="cvIdBtn">🔎 Identify it!</button>${done<need?`<span class="cv-sub">Run ${need-done} more test${need-done>1?'s':''} first.</span>`:''}</div>`,{wide:1});
 root.querySelector('[data-back]').onclick=openLab;
 root.querySelectorAll('.cv-test').forEach(b=>b.onclick=()=>{const t=b.dataset.t;
  if(t==='scratch'){root.querySelector('#cvTool').innerHTML=`<div class="cv-tools"><b>Scratch it with…</b>${CD.TOOLS.map(tl=>`<button data-tool="${tl.id}">${tl.e} ${tl.n}${TIER()?` <small>(${tl.h})</small>`:''}</button>`).join('')}</div>`;
   root.querySelectorAll('[data-tool]').forEach(x=>x.onclick=()=>{p.tests['scratch:'+x.dataset.tool]=1;save();bench(k,anim('scratch'));});return;}
  p.tests[t]=1;save();bench(k,anim(t,m));});
 root.querySelector('#cvIdBtn').onclick=()=>{if(done>=need)identify(k);};
}
function anim(t,m){const a={streak:'⬜➡️',acid:m&&m.f?'🫧🫧🫧':'💧',magnet:m&&m.m?'🧲💥':'🧲',water:m&&m.w?'💧➡️✨':'💧',uv:m&&m.u?'🌈':'🔦',look:'🔍',scratch:'〰️'}[t]||'';return `<div class="cv-anim">${a}</div>`;}
function candidates(p){const seen=CD.LAYERS.filter(L=>S.seen[L.id]).map(L=>L.id);const n=[3,4,6][TIER()];
 const R=rng(hash(p.k));let pool=Object.keys(CD.MIN).filter(id=>id!==p.id&&CD.MIN[id].L.some(l=>seen.includes(l)));
 if(pool.length<n-1)pool=Object.keys(CD.MIN).filter(id=>id!==p.id);
 return shuffle(R,[p.id,...shuffle(R,pool).slice(0,n-1)]);}
function identify(k,wrong){const p=S.pack.find(x=>x.k===k);const cs=candidates(p);const t=TIER();wrong=wrong||p.wrong||[];
 const row=id=>{const m=CD.MIN[id];const off=wrong.includes(id);
  return `<button class="cv-cand ${off?'off':''}" data-id="${id}" ${off?'disabled':''}><b>${esc(m.n)}</b><span>${hardWord(m.h)}</span><span>${m.s?sw(m.s):'—'}</span><span>${m.f?'🫧':'—'}</span><span>${m.m?'🧲':'—'}</span><span>${m.w?'💧':'—'}</span><span>${m.u?sw(m.u):'—'}</span></button>`;};
 modal(`<button class="cv-back" data-back>‹ Back to tests</button><h2>📖 Field Guide</h2><p class="cv-sub">Match your clues to one of these minerals.</p>
  <div class="cv-log small"><ul>${Object.keys(p.tests).map(id=>`<li>${testText(CD.MIN[p.id],id)}</li>`).join('')}</ul></div>
  <div class="cv-guide"><div class="cv-gh"><b>Mineral</b><span>💅 Hard</span><span>⬜ Streak</span><span>🧪 Fizz</span><span>🧲</span><span>💧</span><span>🔦 UV</span></div>${cs.map(row).join('')}</div>`,{wide:1});
 root.querySelector('[data-back]').onclick=()=>bench(k);
 root.querySelectorAll('.cv-cand').forEach(b=>b.onclick=()=>guess(k,b.dataset.id));
}
function mismatch(p,id){const m=CD.MIN[p.id],c=CD.MIN[id];
 for(const t of Object.keys(p.tests)){
  if(t.startsWith('scratch:')){const tl=CD.TOOLS.find(x=>x.id===t.slice(8));if((m.h<=tl.h)!==(c.h<=tl.h))return `${c.n} ${c.h<=tl.h?'<b>would</b> be scratched':'would <b>not</b> be scratched'} by the ${tl.n.toLowerCase()} — but yours ${m.h<=tl.h?'was':'was not'}.`;}
  else if(t==='streak'&&m.s!==c.s)return `${c.n} leaves ${c.s?`a ${STREAK_NAMES[c.s]} streak`:'no streak'}, but yours left ${m.s?`a ${STREAK_NAMES[m.s]} streak`:'no streak'}.`;
  else if(t==='acid'&&!!m.f!==!!c.f)return `${c.n} ${c.f?'fizzes':'does not fizz'} in acid — yours ${m.f?'did':'did not'}.`;
  else if(t==='magnet'&&!!m.m!==!!c.m)return `${c.n} ${c.m?'sticks to':'does not stick to'} a magnet — yours ${m.m?'did':'did not'}.`;
  else if(t==='water'&&!!m.w!==!!c.w)return `${c.n} ${c.w?'dissolves':'does not dissolve'} in water — yours ${m.w?'did':'did not'}.`;
  else if(t==='uv'&&m.u!==c.u)return `${c.n} ${c.u?'glows '+UV_NAMES[c.u]:'does not glow'} under UV — yours ${m.u?'glowed '+UV_NAMES[m.u]:'did not glow'}.`;
  else if(t==='look'&&m.col!==c.col&&m.look!==c.look)return `${c.n} looks ${esc(c.look)} — does yours?`;}
 return null;}
function guess(k,id){const p=S.pack.find(x=>x.k===k);const m=CD.MIN[p.id];
 if(id!==p.id){const why=mismatch(p,id);p.wrong=(p.wrong||[]).concat(id);save();
  if(why){identify(k);say(`❌ Not ${CD.MIN[id].n}. ${why}`,5000);}
  else{bench(k,`<div class="cv-hint">🤔 Your clues can't tell <b>${esc(CD.MIN[id].n)}</b> apart from your mineral yet. Try another test!</div>`);}return;}
 S.pack.splice(S.pack.indexOf(p),1);const first=!S.idd[p.id];S.idd[p.id]=1;S.found[p.id]=(S.found[p.id]||0)+1;const r=CD.RAR[m.r];S.stats.ids=(S.stats.ids||0)+1;
 const coins=first?r.c:r.sell,rp=first?r.rp:1;addCoins(coins,'mineral');S.rp+=rp;save(true);ev('identify',{id:p.id,first});
 modal(`<div class="cv-card">${gemSVG(m,120,null)}<h2>${first?'🎉 New discovery!':'✅ Correct!'}<br>${esc(m.n)}</h2><div class="cv-tag r${m.r}">${r.n}${m.notMin?' · not a true mineral!':''}</div><p>${txt(m)}</p>
  <div class="cv-facts"><span>Hardness ${m.h}</span><span>Streak ${m.s?STREAK_NAMES[m.s]:'none'}</span>${m.u?`<span>UV ${UV_NAMES[m.u]}</span>`:''}</div><div class="cv-rew">+${coins} 🪙 · +${rp} 🔬</div><button class="cv-btn" data-close>${S.pack.some(x=>x.t!=='f')?'Next specimen':'Done'}</button></div>`);
 onClose=()=>{if(S.pack.some(x=>x.t!=='f'))openLab();};}

/* ---------------- Gear shop ---------------- */
function openGear(){const t=TIER();
 const rowH=(key,arr,label,desc)=>{const lv=S.gear[key],cur=arr[lv],nx=arr[lv+1];
  return `<div class="cv-gear"><div class="cv-gi">${cur.e||label.e}</div><div class="cv-gt"><b>${cur.n||label.n}</b><small>${desc(cur)}</small>${nx?`<div class="cv-next">Next: <b>${nx.e||''} ${nx.n||label.n+' '+(lv+2)}</b> — ${desc(nx)}${nx.why&&t?`<br><i>${nx.why}</i>`:''}${nx.need&&!S.idd[nx.need]?'<br><b class="warn">Needs a real 💎 diamond — identify one in the Lab first!</b>':''}</div>`:'<div class="cv-next">⭐ Maxed out!</div>'}</div>
   ${nx?`<button class="cv-buy" data-k="${key}" ${canBuy(nx)?'':'disabled'}>🪙 ${fmt(nx.c)}${nx.r?`<br>🔬 ${nx.r}`:''}</button>`:''}</div>`;};
 modal(`<h2>🛒 Gear Shop</h2><p class="cv-sub">You have 🪙 ${fmt(H.coins())} and 🔬 ${fmt(S.rp)} research points (earn 🔬 by identifying minerals, meeting critters and solving puzzles).</p>
  ${rowH('drill',CD.DRILLS,{},d=>`digs rock up to hardness ${d.h}`)}
  ${rowH('suit',CD.SUITS,{},s=>`safe up to ${fmt(s.t)} °C`)}
  ${rowH('bat',CD.BATT.map((b,i)=>({...b,e:'🔋',n:['Battery','Big Battery','Mega Battery','Super Battery','Ultra Battery'][i]})),{},b=>`${b.v} energy per dive`)}
  ${rowH('pack',CD.PACK.map((b,i)=>({...b,e:'🎒',n:['Backpack','Big Backpack','Explorer Pack','Expedition Pack','Mega Pack'][i]})),{},b=>`holds ${b.v} finds`)}
  ${rowH('lamp',CD.LAMP.map((b,i)=>({...b,e:'🔦',n:['Head Lamp','Bright Lamp','Super Lamp','Mega Lamp'][i]})),{},b=>`lights ${b.v} tiles around you`)}
  ${rowH('uv',[{e:'🔦',n:'No UV lamp',c:0},{e:'🟣',n:'UV Lamp',c:CD.UV.c,r:CD.UV.r,why:'Ultraviolet light is invisible to us, but it makes some minerals glow (fluorescence).'}],{},u=>u.c?'shows glowing minerals + UV lab test':'—')}`,{wide:1});
 root.querySelectorAll('.cv-buy').forEach(b=>b.onclick=()=>buy(b.dataset.k));}
function gearArr(k){return {drill:CD.DRILLS,suit:CD.SUITS,bat:CD.BATT,pack:CD.PACK,lamp:CD.LAMP,uv:[{},{c:CD.UV.c,r:CD.UV.r}]}[k];}
function canBuy(nx){return H.coins()>=nx.c&&S.rp>=(nx.r||0)&&(!nx.need||S.idd[nx.need]);}
function buy(k){const arr=gearArr(k),nx=arr[S.gear[k]+1];if(!nx||!canBuy(nx))return;if(!H.spend(nx.c))return;S.rp-=nx.r||0;S.gear[k]++;if(k==='bat')S.bat=batMax();save(true);ev('gear',{k,lv:S.gear[k]});openGear();say('✅ Upgraded!',1500);}

/* ---------------- Journal ---------------- */
function openJournal(tab){tab=tab||'min';const tabs=[['min','💎 Minerals'],['fos','🦴 Fossils'],['cri','🐾 Critters'],['geo','🔮 Geodes'],['rec','🏆 Records']];
 let body='';
 if(tab==='min')body=`<div class="cv-grid">${Object.keys(CD.MIN).map(id=>{const m=CD.MIN[id];return S.idd[id]?`<button class="cv-jc" data-min="${id}">${gemSVG(m,44)}<b>${esc(m.n)}</b><small>×${S.found[id]||1}</small></button>`:`<div class="cv-jc un"><span>❔</span><b>???</b><small>${CD.RAR[m.r].n}</small></div>`;}).join('')}</div><p class="cv-sub">${Object.keys(S.idd).length} of ${Object.keys(CD.MIN).length} minerals identified</p>`;
 if(tab==='fos')body=`<div class="cv-grid">${CD.FOSSILS.map(f=>{const n=(S.fos[f.id]||[]).filter(Boolean).length;return `<div class="cv-jc ${n?'':'un'}"><span class="cv-e">${n?femo(f):'❔'}</span><b>${n?esc(f.n):'???'}</b><small>${n}/${f.parts.length} pieces${S.ex[f.id]?' · 🏛️':''}</small></div>`;}).join('')}</div>`;
 if(tab==='cri')body=`<div class="cv-grid">${CD.CRITTERS.map(c=>S.crit[c.id]?`<button class="cv-jc" data-cri="${c.id}"><span class="cv-e">${c.e}</span><b>${esc(c.n)}</b><small>${esc(CD.LAYERS.find(L=>L.id===c.L).n)}</small></button>`:`<div class="cv-jc un"><span>❔</span><b>???</b><small>${S.seen[c.L]?esc(CD.LAYERS.find(L=>L.id===c.L).n):'deeper…'}</small></div>`).join('')}</div>`;
 if(tab==='geo')body=`<div class="cv-grid">${CD.GEODES.map(g=>S.geo[g.id]?`<div class="cv-jc"><div class="cv-geode sm" style="--gc:${g.col}"><i></i></div><b>${esc(g.n)}</b><small>×${S.geo[g.id]}</small></div>`:`<div class="cv-jc un"><span>🔮</span><b>???</b><small>Find the daily ✨ secret pocket</small></div>`).join('')}</div>`;
 if(tab==='rec')body=`<div class="cv-recs"><div><b>${depthStr(Math.max(1,S.maxRow))}</b><span>Deepest dig</span></div><div><b>${fmt(S.stats.dug)}</b><span>Blocks dug</span></div><div><b>${fmt(S.stats.ids||0)}</b><span>Minerals identified</span></div><div><b>${Object.keys(S.ex).length}</b><span>Museum exhibits</span></div><div><b>${S.probe.wins?'★'.repeat(Math.min(5,S.probe.rank))||'✔':'—'}</b><span>Core Probe rank ${S.probe.rank}</span></div><div><b>${S.garden?S.garden.cols||0:0}</b><span>Cave columns grown</span></div></div>`;
 modal(`<h2>📓 Explorer's Journal</h2><div class="cv-tabs">${tabs.map(([k,n])=>`<button class="${k===tab?'on':''}" data-tab="${k}">${n}</button>`).join('')}</div>${body}`,{wide:1});
 root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openJournal(b.dataset.tab));
 root.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{const m=CD.MIN[b.dataset.min];modal(`<div class="cv-card">${gemSVG(m,100)}<h2>${esc(m.n)}</h2><div class="cv-tag r${m.r}">${CD.RAR[m.r].n}</div><p>${txt(m)}</p><div class="cv-facts"><span>Hardness ${m.h}</span><span>Streak ${m.s?STREAK_NAMES[m.s]:'none'}</span>${m.f?'<span>Fizzes</span>':''}${m.m?'<span>Magnetic</span>':''}${m.u?`<span>UV ${UV_NAMES[m.u]}</span>`:''}</div><button class="cv-btn" data-close>Back</button></div>`);onClose=()=>openJournal('min');});
 root.querySelectorAll('[data-cri]').forEach(b=>b.onclick=()=>{const c=CD.CRITTERS.find(x=>x.id===b.dataset.cri);modal(`<div class="cv-card"><div class="cv-big">${c.e}</div><h2>${esc(c.n)}</h2><p>${txt(c)}</p><button class="cv-btn" data-close>Back</button></div>`);onClose=()=>openJournal('cri');});
}

/* ---------------- Museum ---------------- */
const FPOS={mammoth:[[22,30],[12,60],[50,42],[55,80]],trex:[[16,28],[34,50],[52,45],[55,82],[86,40]],brachio:[[12,12],[28,34],[52,55],[55,85],[88,62]],ammonite:[[50,50],[32,34],[68,62]],trilobite:[[50,18],[50,50],[50,84]],stromatolite:[[50,84],[50,52],[50,20]]};
const SLOTHINT={Skull:'head',Tusk:'face',Neck:'neck',Arms:'front',Ribs:'chest',Legs:'feet',Tail:'back end',Shell:'outside',Spiral:'middle',Chambers:'inside',Head:'front',Body:'middle',Base:'bottom',Layers:'middle',Top:'top'};
function museumReady(){return CD.FOSSILS.some(f=>!S.ex[f.id]&&f.parts.every((_,i)=>(S.fos[f.id]||[])[i]));}
function openMuseum(){
 const ex=CD.FOSSILS.map(f=>{const got=S.fos[f.id]||[];const n=got.filter(Boolean).length;const done=S.ex[f.id];const ready=!done&&n===f.parts.length;
  return `<div class="cv-ex ${done?'done':''}"><div class="cv-exe">${n||done?femo(f):'❔'}</div><div><b>${n||done?esc(f.n):'Unknown fossil'}</b><small>${done?esc(f.age):`${n}/${f.parts.length} pieces${n?'':' · dig in the '+esc(CD.LAYERS.find(L=>L.id===f.L).n)}`}</small></div>${ready?`<button class="cv-btn sm" data-as="${f.id}">🧩 Assemble!</button>`:done?'<span class="cv-ok">🏛️ On display</span>':''}</div>`;}).join('');
 const shown=CD.FOSSILS.filter(f=>S.ex[f.id]).sort((a,b)=>a.ageY-b.ageY);
 const tl=shown.length?`<div class="cv-tl"><h4>🕰️ Time Wall — deeper rock is older rock</h4>${shown.map(f=>`<div class="cv-tli"><span>${femo(f)}</span><b>${esc(f.n)}</b><small>${esc(f.age)} · found in ${esc(CD.LAYERS.find(L=>L.id===f.L).n)}</small></div>`).join('<div class="cv-tla">⬇️ older</div>')}</div>`:'';
 modal(`<h2>🏛️ Museum</h2><p class="cv-sub">Find all the pieces of a fossil, then put the skeleton together!</p>${ex}${tl}`,{wide:1});
 root.querySelectorAll('[data-as]').forEach(b=>b.onclick=()=>assemble(b.dataset.as));}
function assemble(id){const f=CD.FOSSILS.find(x=>x.id===id);const pos=FPOS[id];const placed=[];let sel=null;
 const R=rng(hash(id+S.day));const order=shuffle(R,f.parts.map((_,i)=>i));
 const draw=()=>{const sh=modal(`<button class="cv-back" data-back>‹ Museum</button><h2>🧩 Build the ${esc(f.n)}</h2><p class="cv-sub">Tap a bone, then tap where it goes on the skeleton.</p>
  <div class="cv-skel"><div class="cv-ghost">${femo(f)}</div>${pos.map((p,i)=>`<button class="cv-slot ${placed.includes(i)?'full':''}" data-slot="${i}" style="left:${p[0]}%;top:${p[1]}%">${placed.includes(i)?'🦴<small>'+esc(f.parts[i])+'</small>':'?<small>'+(SLOTHINT[f.parts[i]]||'')+'</small>'}</button>`).join('')}</div>
  <div class="cv-bones">${order.filter(i=>!placed.includes(i)).map(i=>`<button class="cv-bone ${sel===i?'sel':''}" data-bone="${i}">🦴 ${esc(f.parts[i])}</button>`).join('')}</div>`,{wide:1});
  sh.querySelector('[data-back]').onclick=openMuseum;
  sh.querySelectorAll('[data-bone]').forEach(b=>b.onclick=()=>{sel=+b.dataset.bone;draw();});
  sh.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const s=+b.dataset.slot;if(sel===null||placed.includes(s))return;
   if(s===sel){placed.push(s);sel=null;if(placed.length===f.parts.length){finish();return;}draw();}
   else{b.classList.add('shake');say('Hmm, that piece doesn\'t fit there. Think about where it goes on the body!',2200);}});};
 const finish=()=>{S.ex[id]=1;addCoins(150,'fossil');S.rp+=10;save(true);ev('exhibit',{id});
  modal(`<div class="cv-card"><div class="cv-big">${femo(f)}</div><h2>🏛️ ${esc(f.n)} exhibit complete!</h2><div class="cv-tag">Lived ${esc(f.age)}</div><p>${txt(f)}</p><div class="cv-rew">+150 🪙 · +10 🔬</div><button class="cv-btn" data-close>Amazing!</button></div>`);onClose=openMuseum;};
 draw();}

/* ---------------- Drip Garden ---------------- */
function openGarden(){S.garden=S.garden||{stage:0,last:'',cols:0};const G=S.garden;const can=G.last!==S.day;const st=G.stage;
 const tl=12+st*5.2,tm=8+st*4.4;
 modal(`<h2>🌱 Drip Garden</h2><p class="cv-sub">Drip water on the cave ceiling once a day and watch a stalactite and stalagmite grow toward each other.</p>
  <svg class="cv-drip" viewBox="0 0 200 120"><rect width="200" height="120" rx="12" fill="#2a2330"/><path d="M0 0 H200 V14 Q100 22 0 14Z" fill="#8f897a"/><path d="M0 120 H200 V106 Q100 100 0 106Z" fill="#8f897a"/>
  ${st>=7?'<path d="M92 16 L108 16 L104 106 L96 106 Z" fill="#e8dfc8"/>':`<path d="M92 16 L108 16 L100 ${16+tl}Z" fill="#e8dfc8"/><path d="M90 104 L110 104 L100 ${104-tm}Z" fill="#d9ceb2"/>${can?'':`<circle cx="100" cy="${20+tl}" r="3" fill="#8fd3ff"><animate attributeName="cy" from="${20+tl}" to="${100-tm}" dur="1.2s" repeatCount="indefinite"/></circle>`}`}</svg>
  <div class="cv-meter"><i style="width:${Math.min(100,st/7*100)}%"></i></div><p class="cv-sub">Day ${st} of 7 · Columns grown: ${G.cols}</p>
  <p>${TIER()?'Each drip of water carries dissolved calcium bicarbonate. When the drop loses CO₂ to the cave air, calcite (CaCO₃) is left behind. Real stalactites grow only about a centimetre every 100 years — ours are magic-fast!':'Every drop of water leaves a tiny bit of rock behind. Stalac<b>t</b>ites hang from the <b>t</b>op, stalag<b>m</b>ites grow up from the ground. When they meet they make a column!'}</p>
  <div class="cv-row">${can?'<button class="cv-btn" id="cvDrip">💧 Drip water today</button>':'<span class="cv-sub">✅ Watered today. Come back tomorrow!</span>'}</div>`,{wide:1});
 const b=root.querySelector('#cvDrip');if(b)b.onclick=()=>{G.last=S.day;G.stage++;let extra='';if(G.stage>=7){G.cols++;addCoins(150,'column');S.rp+=10;extra='🏛️ They joined into a COLUMN! +150 🪙 +10 🔬';G.stage=7;}save(true);ev('drip',{});openGarden();if(extra){say(extra,4000);G.stage=0;G.last=S.day;save(true);}};}

/* ---------------- Elevator ---------------- */
function openElevator(){const stops=CD.LAYERS.filter(L=>S.maxRow>=L.r0);
 modal(`<h2>🛗 Elevator</h2><p class="cv-sub">Ride down to the top of any layer you have reached.</p><div class="cv-stops">${stops.map(L=>`<button class="cv-stop" data-r="${L.r0}" style="--lc:${L.col}"><span>${L.e}</span><b>${esc(L.n)}</b><small>${depthStr(L.r0)} · ${fmt(L.t0)} °C</small></button>`).join('')||'<div class="cv-empty">Dig down to reach your first layer!</div>'}</div>`,{wide:1});
 root.querySelectorAll('.cv-stop').forEach(b=>b.onclick=()=>{const r=+b.dataset.r;if(rowTemp(r)>suit().t){say(`🥵 It's ${fmt(rowTemp(r))} °C there — your suit is only safe to ${fmt(suit().t)} °C.`);return;}closeModal();S.x=2;S.y=r;snapCam();after();say(`🛗 Ding! ${esc(layerOf(r).n)}.`,1800);});}

/* ---------------- gate puzzles ---------------- */
const PZ_WHY={
 lever:{y:'A lever lets a small push lift something heavy. The closer the fulcrum is to the heavy thing, the easier it gets!',o:'Levers trade distance for force: effort × effort-arm = load × load-arm. Archimedes said, "Give me a lever long enough and a place to stand, and I will move the world."'},
 mirror:{y:'Light bounces off a mirror like a ball off a wall. A tilted mirror turns the beam around a corner!',o:'Law of reflection: the angle of incidence equals the angle of reflection. A mirror at 45° turns a beam exactly 90°. Periscopes and laser light shows use this.'},
 sonar:{y:'You used echoes like a bat! The longer the echo takes, the farther away the wall is.',o:'Echolocation: distance = speed of sound × time ÷ 2 (the sound travels there and back). Bats, dolphins, submarines (sonar) and cave surveyors all use it.'},
 raft:{y:'Things float when they are lighter than the same amount of water. Wood floats, rocks sink!',o:'Archimedes\' principle: the water pushes up with a force equal to the weight of the water you push aside. A block of pine (0.1 m³) pushes aside 100 kg of water but weighs only 50 kg — so it can carry 50 kg more.'},
 glow:{y:'Ultraviolet light is invisible to us, but it makes some minerals glow in bright colors!',o:'Fluorescent minerals absorb invisible ultraviolet light and give off visible light. Different impurities make different colors: fluorite glows blue, willemite green, calcite orange-red.'},
 pulley:{y:'Using more ropes and wheels shares the weight, so each rope pulls less. But you have to pull more rope!',o:'Each rope segment holding the load shares the weight, so the mechanical advantage equals the number of supporting segments. The catch: to lift the load 1 m with 4 segments, you pull 4 m of rope. Work stays the same!'},
 seismo:{y:'Earthquake waves are like messages from deep inside the Earth. P-waves are fastest and arrive first!',o:'P-waves (primary, push-pull) travel faster than S-waves (secondary, side-to-side). The gap between them tells you how far away the quake was. At the Moho — the bottom of the crust — seismic waves suddenly speed up, which is how it was discovered in 1909.'}};
function openPuzzle(id){({lever:pzLever,mirror:pzMirror,sonar:pzSonar,raft:pzRaft,glow:pzGlow,pulley:pzPulley,seismo:pzSeismo})[id]();}
function solved(id,title){
 S.gates[id]=1;const r=Object.keys(GATES).find(k=>GATES[k].id===id);if(r){const i=idx(W.gateX[r],+r);W.g[i]=T_AIR;setDug(i);}
 addCoins(60,'puzzle');S.rp+=10;save(true);ev('puzzle',{id});
 modal(`<div class="cv-card"><div class="cv-big">🎉</div><h2>${esc(title)}</h2><p>${txt(PZ_WHY[id])}</p><div class="cv-rew">+60 🪙 · +10 🔬 · The way is open!</div><button class="cv-btn" data-close>Keep digging!</button></div>`);}
const pzR=id=>rng(hash(id+'|'+H.player.id+'|'+(S.pzTry=(S.pzTry||0)+1)));

/* 1. Lever */
function pzLever(){const t=TIER(),R=pzR('lever');
 const Wt=[120,[160,200,240][Math.floor(R()*3)],[320,400,480,560][Math.floor(R()*4)]][t],F=[30,40,60][t];
 let d=5;
 const draw=(ang,msg)=>{const fx=20+d*26;const sh=modal(`<h2>🪨 The Giant Boulder</h2><p class="cv-sub">A ${Wt} kg boulder blocks the way down. You can push with ${F} kg of force. Slide the fulcrum (▲) along the 10 m plank, then push!</p>
  <svg viewBox="0 0 300 150" class="cv-pz"><rect x="0" y="130" width="300" height="20" fill="#5b4633"/>
   <g transform="rotate(${ang} ${fx} 104)"><rect x="20" y="98" width="260" height="10" rx="3" fill="#b98a52"/><circle cx="36" cy="72" r="26" fill="#7d7468"/><text x="36" y="78" text-anchor="middle" font-size="13" fill="#fff">${Wt}kg</text><text x="266" y="92" text-anchor="middle" font-size="26">${H.player.emoji||'🧑‍🚀'}</text></g>
   <path d="M${fx} 108 L${fx-14} 130 L${fx+14} 130 Z" fill="#ffd43b"/>
   ${t?`<text x="${(20+fx)/2}" y="146" text-anchor="middle" font-size="10" fill="#fff">load arm ${d} m</text><text x="${(fx+280)/2}" y="146" text-anchor="middle" font-size="10" fill="#fff">effort arm ${10-d} m</text>`:''}</svg>
  <input type="range" min="0.5" max="9.5" step="0.5" value="${d}" id="cvLv" class="cv-range">
  ${msg||''}<div class="cv-row"><button class="cv-btn" id="cvPush">💪 Push!</button></div>`,{wide:1});
  sh.querySelector('#cvLv').oninput=e=>{d=+e.target.value;draw(0);};
  sh.querySelector('#cvPush').onclick=()=>{const eff=F*(10-d),load=Wt*d;
   if(eff>=load){draw(-14);setTimeout(()=>solved('lever','The boulder rolled away!'),900);}
   else draw(4,`<div class="cv-hint">😣 Too heavy! ${t?`Your side: ${F} × ${10-d} = ${fmt(eff)}. Boulder side: ${Wt} × ${d} = ${fmt(load)}. You need your side to be at least as big.`:'Try moving the yellow fulcrum closer to the boulder.'}</div>`);};};
 draw(0);}

/* 2. Mirror beam */
function pzMirror(){const t=TIER(),N=[5,6,7][t],K=[2,3,4][t];let P=null;
 for(let tries=0;tries<400&&!P;tries++){const R=pzR('mirror');const used=new Set(),mir={};let x=-1,y=Math.floor(R()*N),dx=1,dy=0;let ok=true;
  for(let turn=0;turn<=K;turn++){let maxL=0;for(let s=1;;s++){const nx=x+dx*s,ny=y+dy*s;if(nx<0||ny<0||nx>=N||ny>=N||used.has(nx+','+ny))break;maxL=s;}
   if(maxL<1){ok=false;break;}const L=1+Math.floor(R()*maxL);for(let s=1;s<=L;s++)used.add((x+dx*s)+','+(y+dy*s));x+=dx*L;y+=dy*L;
   if(turn<K){const opts=dx?[[0,1],[0,-1]]:[[1,0],[-1,0]];const nd=pick(R,opts);const slash=(-dy===nd[0]&&-dx===nd[1]);mir[x+','+y]={c:slash?'/':'\\',ok:slash?'/':'\\'};dx=nd[0];dy=nd[1];}
   else P={N,start:(Object.keys(mir).length,0),sy:null,mir,target:[x,y]};}
  if(!ok)P=null;else if(P){P.sy=null;}
  if(P){// recover start row: first path cell row
   P.sy=[...used][0].split(',').map(Number)[1];
   const keys=Object.keys(P.mir);if(keys.length!==K){P=null;continue;}
   keys.forEach(k=>{if(R()<.6)P.mir[k].c=P.mir[k].c==='/'?'\\':'/';});if(keys.every(k=>P.mir[k].c===P.mir[k].ok)){const k=keys[0];P.mir[k].c=P.mir[k].c==='/'?'\\':'/';}
   for(let d=0;d<t;d++){for(let q=0;q<30;q++){const cx=Math.floor(R()*N),cy=Math.floor(R()*N);const k=cx+','+cy;if(!used.has(k)){P.mir[k]={c:R()<.5?'/':'\\',decoy:1};break;}}}}}
 const C=300/N;
 const trace=()=>{let x=-1,y=P.sy,dx=1,dy=0;const pts=[[0,(y+.5)*C]];for(let s=0;s<200;s++){x+=dx;y+=dy;if(x<0||y<0||x>=N||y>=N){pts.push([(x+.5-dx*.5)*C,(y+.5-dy*.5)*C]);return{pts,hit:false};}
   if(x===P.target[0]&&y===P.target[1]){pts.push([(x+.5)*C,(y+.5)*C]);return{pts,hit:true};}
   const m=P.mir[x+','+y];if(m){pts.push([(x+.5)*C,(y+.5)*C]);if(m.c==='/'){[dx,dy]=[-dy,-dx];}else{[dx,dy]=[dy,dx];}}}return{pts,hit:false};};
 const draw=()=>{const tr=trace();const sh=modal(`<h2>🚪 The Crystal Door</h2><p class="cv-sub">The door opens when light hits the crystal 💎. Tap the mirrors to tilt them and steer the laser beam!</p>
  <svg viewBox="-12 0 324 300" class="cv-pz sq"><rect x="0" y="0" width="300" height="300" fill="#1c1626" rx="6"/>
  ${Array.from({length:N+1},(_,i)=>`<line x1="${i*C}" y1="0" x2="${i*C}" y2="300" stroke="#2f2740"/><line x1="0" y1="${i*C}" x2="300" y2="${i*C}" stroke="#2f2740"/>`).join('')}
  <rect x="-12" y="${P.sy*C+C*.3}" width="12" height="${C*.4}" fill="#ff4d4d"/>
  <text x="${(P.target[0]+.5)*C}" y="${(P.target[1]+.5)*C}" font-size="${C*.6}" text-anchor="middle" dominant-baseline="central" style="${tr.hit?'filter:drop-shadow(0 0 8px #fff)':''}">💎</text>
  <polyline points="${tr.pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ff4d4d" stroke-width="4" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #ff4d4d)"/>
  ${Object.keys(P.mir).map(k=>{const [x,y]=k.split(',').map(Number);const m=P.mir[k];const a=C*.36,cx=(x+.5)*C,cy=(y+.5)*C;const l=m.c==='/'?[cx-a,cy+a,cx+a,cy-a]:[cx-a,cy-a,cx+a,cy+a];
   return `<g class="cv-mirror" data-m="${k}"><rect x="${x*C+2}" y="${y*C+2}" width="${C-4}" height="${C-4}" rx="6" fill="rgba(143,211,255,.12)"/><line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="#cfefff" stroke-width="6" stroke-linecap="round"/></g>`;}).join('')}
  </svg>${TIER()?'<p class="cv-sub">Angle in = angle out. A mirror at 45° turns the beam 90°.</p>':''}`,{wide:1});
  sh.querySelectorAll('.cv-mirror').forEach(g=>g.onclick=()=>{const m=P.mir[g.dataset.m];m.c=m.c==='/'?'\\':'/';draw();});
  if(tr.hit)setTimeout(()=>solved('mirror','The light opened the Crystal Door!'),700);};
 draw();}

/* 3. Sonar */
function pzSonar(){const t=TIER(),R=pzR('sonar');const times=shuffle(R,[0.2,0.3,0.4,0.6,0.7,0.9,1.0,1.2,1.4]).slice(0,5);
 const tun=times.map((s,i)=>({l:'ABCDE'[i],s,d:Math.round(343*s/2)}));const ans=t?pick(R,tun):tun.reduce((a,b)=>b.s>a.s?b:a);
 const pinged={};
 const draw=msg=>{const sh=modal(`<h2>🦇 The Dark Chamber</h2><p class="cv-sub">${t?`Five black tunnels. The one to the river is <b>${ans.d} m</b> long. Ping each tunnel and time the echo. Sound travels <b>343 m every second</b>${t>1?' — remember it goes there and back':''}.`:'Five dark tunnels. The way to the river is the <b>LONGEST</b> tunnel. Ping each one — a longer echo means a longer tunnel!'}</p>
  <svg viewBox="0 0 300 170" class="cv-pz"><rect width="300" height="170" rx="10" fill="#120d18"/>${tun.map((u,i)=>{const a=Math.PI*(1.1+i*.2);const x=150+Math.cos(a)*120,y=160+Math.sin(a)*130;return `<line x1="150" y1="160" x2="${x}" y2="${y}" stroke="#2c2436" stroke-width="22" stroke-linecap="round"/><text x="${x}" y="${y+5}" font-size="15" fill="#ffd43b" text-anchor="middle">${u.l}</text>${pinged[u.l]?`<text x="${(150+x)/2}" y="${(160+y)/2+4}" font-size="11" fill="#8fd3ff" text-anchor="middle">${u.s.toFixed(1)}s</text>`:''}`;}).join('')}<text x="150" y="162" font-size="22" text-anchor="middle">🦇</text></svg>
  <div class="cv-sonar">${tun.map(u=>`<div><button class="cv-btn sm ghost" data-p="${u.l}">🔊 Ping ${u.l}</button><span>${pinged[u.l]?`echo ${u.s.toFixed(1)} s`:'…'}</span><button class="cv-btn sm" data-g="${u.l}">Go ${u.l}</button></div>`).join('')}</div>${msg||''}`,{wide:1});
  sh.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{b.textContent='〰️〰️';setTimeout(()=>{pinged[b.dataset.p]=1;draw(msg);},500);});
  sh.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const u=tun.find(x=>x.l===b.dataset.g);
   if(u===ans)solved('sonar','You found the river tunnel by echo!');
   else draw(`<div class="cv-hint">🧱 Tunnel ${u.l} is a dead end — ${t?`only ${u.d} m (343 × ${u.s} ÷ 2).`:`its echo came back after ${u.s} s. Find a longer echo!`}</div>`);});};
 draw();}

/* 4. Raft */
const MATS=[{id:'balsa',e:'🪵',n:'Balsa wood',p:160},{id:'cedar',e:'🌲',n:'Cedar log',p:380},{id:'pine',e:'🌳',n:'Pine log',p:500},{id:'oak',e:'🟫',n:'Oak log',p:750},{id:'ice',e:'🧊',n:'Ice block',p:920},{id:'granite',e:'🪨',n:'Granite slab',p:2700},{id:'iron',e:'⚙️',n:'Iron plate',p:7870}];
const capOf=m=>Math.round((1000-m.p)*0.1);
function pzRaft(){const t=TIER(),R=pzR('raft');const slots=[3,4,4][t];
 const load=[60,90+Math.floor(R()*3)*10,130+Math.floor(R()*3)*10][t];
 let inv;for(let k=0;k<200;k++){inv={balsa:t>1?1:0,cedar:R()<.7?1:0,pine:1+Math.floor(R()*2),oak:2,ice:2,granite:2,iron:t?1:0};
  // brute force: is there any combo with <= slots blocks reaching load, but NOT with just the biggest two of one kind trivially? keep any solvable
  const pool=[];MATS.forEach(m=>{for(let i=0;i<inv[m.id];i++)pool.push(capOf(m));});pool.sort((a,b)=>b-a);if(pool.slice(0,slots).reduce((a,b)=>a+Math.max(0,b),0)>=load)break;}
 const raft=[];let tank=null;
 const draw=(msg,sink)=>{const cap=raft.reduce((a,id)=>a+capOf(MATS.find(m=>m.id===id)),0);const left=m=>inv[m.id]-raft.filter(x=>x===m.id).length;
  const sh=modal(`<h2>🌊 The Underground River</h2><p class="cv-sub">Build a raft with up to <b>${slots}</b> blocks to carry you and your gear: <b>${load} kg</b>. Every block is the same size (0.1 m³ — a big bathtub-full). Test them in the tank first!</p>
  <div class="cv-raft"><div class="cv-tank">${tank?(()=>{const m=MATS.find(x=>x.id===tank);const fl=m.p<1000;return `<div class="cv-water"><div class="cv-blk ${fl?'fl':'sk'}" style="${fl?`top:${(36-40*(1-m.p/1000)).toFixed(0)}px`:''}">${m.e}</div></div><small>${m.n}: ${fl?`floats${t?` — ${Math.round(m.p/10)}% under water, can carry ${capOf(m)} kg`:'!'}`:'sinks!'}${t>1?` (density ${m.p} kg/m³)`:''}</small>`;})():'<div class="cv-water"></div><small>Tap 🔬 to test a material</small>'}</div>
  <div class="cv-mats">${MATS.filter(m=>inv[m.id]).map(m=>`<div class="cv-mat"><span>${m.e}</span><b>${m.n}</b><small>×${left(m)}${t>1?` · ${m.p} kg/m³`:''}</small><button data-test="${m.id}">🔬</button><button data-add="${m.id}" ${left(m)&&raft.length<slots?'':'disabled'}>+ Add</button></div>`).join('')}</div></div>
  <div class="cv-raftb ${sink?'sink':''}">${raft.map((id,i)=>`<button data-rm="${i}">${MATS.find(m=>m.id===id).e}</button>`).join('')||'<small>Your raft (tap a block to remove it)</small>'}<span class="cv-me">${H.player.emoji||'🧑‍🚀'}</span></div>
  ${t?`<div class="cv-meter ${cap>=load?'ok':''}"><i style="width:${Math.max(0,Math.min(100,cap/load*100))}%"></i></div><p class="cv-sub">Raft can carry: <b>${cap} kg</b> of ${load} kg needed${t>1?' · capacity = (1000 − density) × 0.1 m³ for each block':''}</p>`:''}
  ${msg||''}<div class="cv-row"><button class="cv-btn" id="cvLaunch" ${raft.length?'':'disabled'}>🚣 Launch!</button></div>`,{wide:1});
  sh.querySelectorAll('[data-test]').forEach(b=>b.onclick=()=>{tank=b.dataset.test;draw();});
  sh.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{raft.push(b.dataset.add);draw();});
  sh.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{raft.splice(+b.dataset.rm,1);draw();});
  sh.querySelector('#cvLaunch').onclick=()=>{if(cap>=load)solved('raft','Your raft floats! You can cross the river now.');
   else draw(`<div class="cv-hint">💦 Glub glub… the raft sank! ${raft.some(id=>MATS.find(m=>m.id===id).p>1000)?'Something in it sinks on its own — test it in the tank.':'It needs to hold more weight. Try lighter materials.'}</div>`,true);};};
 draw();}

/* 5. Glow door */
function pzGlow(){const R=pzR('glow');const want=shuffle(R,[['#5cc8ff','blue'],['#39ff6a','green'],['#ff5a3d','orange-red']]);const opts=['fluorite','willemite','calcite','quartz'];
 const put=[null,null,null];let sel=0,shine=false;
 const draw=msg=>{const sh=modal(`<h2>✨ The Glow Door</h2><p class="cv-sub">Three keyholes glow in UV light. Put a mineral in each one that glows the same color. Tap a keyhole, then a mineral.</p>
  <div class="cv-sockets">${want.map((w,i)=>`<button class="cv-sock ${sel===i?'sel':''}" data-s="${i}" style="--g:${w[0]}">${put[i]?gemSVG(CD.MIN[put[i]],40,shine?CD.MIN[put[i]].u||'#333':null):'<span>?</span>'}<small>${w[1]}</small></button>`).join('')}</div>
  <div class="cv-minsel">${opts.map(id=>`<button data-o="${id}">${gemSVG(CD.MIN[id],40,shine?CD.MIN[id].u||'#222':null)}<b>${CD.MIN[id].n}</b></button>`).join('')}</div>
  <div class="cv-row"><button class="cv-btn ghost" id="cvShine">🔦 ${shine?'UV off':'Shine UV on them'}</button><button class="cv-btn" id="cvOpen" ${put.every(Boolean)?'':'disabled'}>🔓 Open</button></div>${msg||''}`,{wide:1});
  sh.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{sel=+b.dataset.s;draw();});
  sh.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{put[sel]=b.dataset.o;sel=Math.min(2,sel+1);draw();});
  sh.querySelector('#cvShine').onclick=()=>{shine=!shine;draw();};
  sh.querySelector('#cvOpen').onclick=()=>{if(put.every((id,i)=>CD.MIN[id].u===want[i][0]))solved('glow','The Glow Door slid open!');else draw('<div class="cv-hint">🔒 Not yet — one keyhole has the wrong glow. Shine the UV lamp to check!</div>');};};
 draw();}

/* 6. Pulley */
function pzPulley(){const t=TIER(),R=pzR('pulley');const F=[60,70,80][t],h=10;const nmin=[4,3+Math.floor(R()*2),3+Math.floor(R()*3)][t];
 const Wt=F*(nmin-1)+10+Math.floor(R()*((F-10)/10))*10;const rope=t?h*(nmin+(t>1?0:1)):999;let n=1;
 const draw=(msg,lift)=>{const sh=modal(`<h2>⛓️ The Ore Lift</h2><p class="cv-sub">A ${Wt} kg ore cart blocks the shaft. You can pull with ${F} kg of force.${t?` You have ${rope} m of rope and must lift it ${h} m.`:''} How many rope segments should hold the cart?</p>
  <svg viewBox="0 0 300 180" class="cv-pz"><rect width="300" height="180" rx="10" fill="#241c2a"/><rect x="40" y="6" width="220" height="8" fill="#8a8494"/>
  ${Array.from({length:n},(_,i)=>{const x=150-(n-1)*14+i*28;return `<line x1="${x}" y1="14" x2="${x}" y2="${lift?70:110}" stroke="#e9d8a6" stroke-width="3"/><circle cx="${x}" cy="${i%2?14:(lift?70:110)}" r="7" fill="#b0a8b8"/>`;}).join('')}
  <rect x="${150-40}" y="${lift?70:110}" width="80" height="44" rx="6" fill="#6e5a48"/><text x="150" y="${(lift?70:110)+28}" text-anchor="middle" fill="#fff" font-size="13">${Wt} kg</text></svg>
  <div class="cv-nsel">${[1,2,3,4,5,6].map(k=>`<button class="${k===n?'on':''}" data-n="${k}">${k}</button>`).join('')}</div>
  ${t?`<p class="cv-sub">Each segment holds <b>${(Wt/n).toFixed(0)} kg</b> · rope needed <b>${n*h} m</b></p>`:''}
  ${msg||''}<div class="cv-row"><button class="cv-btn" id="cvPull">💪 Pull!</button></div>`,{wide:1});
  sh.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{n=+b.dataset.n;draw();});
  sh.querySelector('#cvPull').onclick=()=>{const per=Wt/n;
   if(per>F)draw(`<div class="cv-hint">😣 Too heavy — ${t?`each segment needs ${per.toFixed(0)} kg of pull but you only have ${F}.`:'add more rope segments to share the weight!'}</div>`);
   else if(n*h>rope)draw(`<div class="cv-hint">🪢 Not enough rope! ${n} segments × ${h} m = ${n*h} m, but you only have ${rope} m.</div>`);
   else{draw('',true);setTimeout(()=>solved('pulley','The ore cart is out of the way!'),800);}};};
 draw();}

/* 7. Seismograph */
function pzSeismo(){const t=TIER(),R=pzR('seismo');const P=8+Math.floor(R()*8),lag=[10,15,20,25,30][Math.floor(R()*5)],Sw=P+lag;let stage=0;const X=s=>10+s*4.6;
 let path='M10 90';for(let s=0;s<=60;s+=.25){const a=s<P?1.5:s<Sw?(10*Math.exp(-(s-P)/5)+3):(26*Math.exp(-(s-Sw)/6)+4);path+=` L${X(s).toFixed(1)} ${(90+Math.sin(s*9+R()*2)*a*(0.6+R()*.4)).toFixed(1)}`;}
 const dist=lag*8;const ch=shuffle(R,[dist,Math.round(dist/2),dist*2,lag]).map(v=>v+' km');
 const draw=msg=>{const prompt=stage===0?'Tap the <b>P-wave</b> — the FIRST wiggle to arrive (P = Primary).':stage===1?'Now tap the <b>S-wave</b> — the second, bigger wiggle (S = Secondary).':`The S-wave arrived <b>${lag} s</b> after the P-wave. With about <b>8 km for every second</b> of gap, how far away was the quake?`;
  const sh=modal(`<h2>📈 The Moho Scanner</h2><p class="cv-sub">A small earthquake shook the rock. Read the seismograph to unlock the scanner!</p>
  <svg viewBox="0 0 300 180" class="cv-pz" id="cvSeis"><rect width="300" height="180" rx="10" fill="#fbf8f0"/>${Array.from({length:7},(_,i)=>`<line x1="${X(i*10)}" y1="20" x2="${X(i*10)}" y2="160" stroke="#e3dccb"/><text x="${X(i*10)}" y="174" font-size="9" text-anchor="middle" fill="#8a7">${i*10}s</text>`).join('')}
  <path d="${path}" fill="none" stroke="#1d3a8a" stroke-width="1.4"/>${stage>0?`<line x1="${X(P)}" y1="20" x2="${X(P)}" y2="160" stroke="#2ecc71" stroke-width="2"/><text x="${X(P)+3}" y="30" font-size="11" fill="#2ecc71">P</text>`:''}${stage>1?`<line x1="${X(Sw)}" y1="20" x2="${X(Sw)}" y2="160" stroke="#ff5a5f" stroke-width="2"/><text x="${X(Sw)+3}" y="30" font-size="11" fill="#ff5a5f">S</text>`:''}</svg>
  <p>${prompt}</p>${stage===2?`<div class="cv-choices">${ch.map(c=>`<button class="cv-btn sm ghost" data-c="${c}">${c}</button>`).join('')}</div>`:''}${msg||''}`,{wide:1});
  const svg=sh.querySelector('#cvSeis');svg.onclick=e=>{if(stage>1)return;const r=svg.getBoundingClientRect();const s=((e.clientX-r.left)/r.width*300-10)/4.6;const target=stage===0?P:Sw;
   if(Math.abs(s-target)<=3.5){stage++;if(stage===2&&!t){solved('seismo','Seismic scan complete!');return;}draw();}
   else draw(`<div class="cv-hint">${stage===0?(s<target?'That is just background shaking. Look for where the wiggles suddenly start!':'Earlier! The P-wave is the very first change.'):'Look for where the wiggles suddenly get much BIGGER.'}</div>`);};
  sh.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{if(b.dataset.c===dist+' km')solved('seismo','You located the earthquake!');else draw(`<div class="cv-hint">Not quite: ${lag} seconds × 8 km = ?</div>`);});};
 draw();}

/* ---------------- Core Probe expedition ---------------- */
const PHASES=[{n:'Deep Mantle',km:[200,2900],tC:[1300,3700],col:'#6b2a1f',ob:'plume',y:'Slowly flowing hot rock. Plumes of extra-hot rock rise up!',o:'The lower mantle is solid rock under huge pressure, flowing a few cm a year. Hot mantle plumes rise from near the core — they may feed hotspots like Hawaii.'},
 {n:'Outer Core',km:[2900,5150],tC:[4000,5000],col:'#c2551a',ob:'swirl',y:'A giant ocean of liquid metal! Its swirling makes Earth\'s magnetic field.',o:'The outer core is liquid iron and nickel. As it churns it acts like a dynamo, generating Earth\'s magnetic field that shields us from solar wind. S-waves cannot pass through it.'},
 {n:'Inner Core',km:[5150,6371],tC:[5200,5400],col:'#ffd08a',ob:'crystal',y:'A solid ball of iron as hot as the surface of the Sun!',o:'The inner core is a solid iron-nickel ball about 1,220 km in radius, around 5,400 °C. It stays solid because the pressure — about 3.3–3.6 million atmospheres — keeps the atoms locked in place.'}];
function openProbe(){const rank=S.probe.rank||0;const left=Math.max(0,3-(S.probe.runs||0));
 modal(`<div class="cv-card"><div class="cv-big">🚀</div><h2>Core Probe Expedition</h2><p>No human can go deeper — but a heat-shielded probe can! Steer it down through the deep mantle, the liquid outer core and into the solid inner core, 6,371 km down. Dodge hot spots, collect 🔷 data, and answer science checks to repair your shield.</p>
  <div class="cv-stats"><span>⭐ Rank ${rank}${rank?' '+'★'.repeat(Math.min(5,rank)):''}</span><span>🏆 Best ${S.probe.best} data</span><span>🎁 Rewards left today: ${left}</span></div>
  <p class="cv-sub">${rank?'Each rank makes the probe fall faster. Win to rank up!':'Win once to earn the Core Explorer trophy.'}</p><button class="cv-btn" id="cvGo">🚀 Launch!</button></div>`);
 root.querySelector('#cvGo').onclick=()=>probeRun();}
function probeRun(){
 const t=TIER(),rank=S.probe.rank||0,spd=1+rank*.12,dur=t?18:15;
 const sh=modal(`<div class="cv-probe"><canvas id="cvPC"></canvas><div class="cv-phud" id="cvPH"></div><div class="cv-pctl"><button id="cvPL">◀</button><button id="cvPR">▶</button></div></div>`,{wide:1,noX:1});
 sh.classList.add('probe');const pc=sh.querySelector('#cvPC'),g=pc.getContext('2d');
 const dpr=Math.min(2,devicePixelRatio||1);let Wd=0,Hd=0;const rs=()=>{Wd=pc.clientWidth;Hd=pc.clientHeight;pc.width=Wd*dpr;pc.height=Hd*dpr;g.setTransform(dpr,0,0,dpr,0,0);};rs();
 const st={x:.5,shield:3,orbs:0,ph:0,t:0,obs:[],paused:false,over:false,inv:0,dir:0,qs:shuffle(Math.random,CD.Q[t])};
 let last=performance.now(),id=0;
 const keys=e=>{if(e.key==='ArrowLeft')st.dir=e.type==='keydown'?-1:0;if(e.key==='ArrowRight')st.dir=e.type==='keydown'?1:0;};
 window.addEventListener('keydown',keys);window.addEventListener('keyup',keys);
 const hold=(b,d)=>{b.onpointerdown=()=>st.dir=d;b.onpointerup=b.onpointerleave=()=>st.dir=0;};hold(sh.querySelector('#cvPL'),-1);hold(sh.querySelector('#cvPR'),1);
 pc.onpointermove=e=>{if(e.buttons||e.pointerType==='touch'){const r=pc.getBoundingClientRect();st.x=Math.max(.05,Math.min(.95,(e.clientX-r.left)/r.width));}};
 const cleanup=()=>{cancelAnimationFrame(id);window.removeEventListener('keydown',keys);window.removeEventListener('keyup',keys);};
 const spawn=()=>{const P=PHASES[st.ph];if(Math.random()<.035*spd*(1+st.ph*.25))st.obs.push({k:P.ob,x:Math.random(),y:Hd+30,r:14+Math.random()*16,ph:Math.random()*6});if(Math.random()<.02)st.obs.push({k:'orb',x:.1+Math.random()*.8,y:Hd+20,r:12});};
 const loop=now=>{id=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(st.paused||st.over)return;
  st.t+=dt;st.x=Math.max(.05,Math.min(.95,st.x+st.dir*dt*.9));spawn();const P=PHASES[st.ph];const px=st.x*Wd,py=Hd*.28;
  st.obs.forEach(o=>{o.y-=dt*150*spd;if(o.k==='swirl')o.x+=Math.sin(st.t*2+o.ph)*dt*.25;});
  st.obs=st.obs.filter(o=>{if(o.y<-40)return false;const dx=o.x*Wd-px,dy=o.y-py;if(Math.hypot(dx,dy)<o.r+14){if(o.k==='orb'){st.orbs++;return false;}if(st.inv<=0&&!window.__cvGod){st.shield--;st.inv=1.2;if(st.shield<=0){end(false);}}return false;}return true;});
  st.inv-=dt;
  // draw
  const frac=Math.min(1,st.t/dur);const km=P.km[0]+(P.km[1]-P.km[0])*frac,tc=P.tC[0]+(P.tC[1]-P.tC[0])*frac;
  const gr=g.createLinearGradient(0,0,0,Hd);gr.addColorStop(0,shade(P.col,-.3));gr.addColorStop(1,P.col);g.fillStyle=gr;g.fillRect(0,0,Wd,Hd);
  for(let i=0;i<20;i++){g.fillStyle='rgba(255,255,255,.06)';g.fillRect((i*97+st.t*30)%Wd,(i*53-st.t*150*spd)%Hd+Hd,3,18);}
  st.obs.forEach(o=>{g.save();if(o.k==='orb'){g.font='22px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('🔷',o.x*Wd,o.y);}
   else{g.shadowColor='#fff3a0';g.shadowBlur=16;g.fillStyle=o.k==='crystal'?'#fff6d8':o.k==='swirl'?'#ffb347':'#ff5a2a';g.beginPath();if(o.k==='crystal'){g.moveTo(o.x*Wd,o.y-o.r);g.lineTo(o.x*Wd+o.r*.6,o.y);g.lineTo(o.x*Wd,o.y+o.r);g.lineTo(o.x*Wd-o.r*.6,o.y);}else g.arc(o.x*Wd,o.y,o.r,0,Math.PI*2);g.fill();}g.restore();});
  g.globalAlpha=st.inv>0&&Math.floor(st.inv*10)%2?.35:1;g.save();g.translate(px,py);g.fillStyle='#ffd43b';g.beginPath();g.moveTo(0,22);g.lineTo(-10,6);g.lineTo(10,6);g.fill();g.fillStyle='#dfe7f1';g.strokeStyle='#5a6b80';g.lineWidth=2;g.beginPath();g.moveTo(-14,-18);g.lineTo(14,-18);g.lineTo(18,6);g.lineTo(-18,6);g.closePath();g.fill();g.stroke();g.fillStyle='#74c0fc';g.beginPath();g.arc(0,-6,6,0,Math.PI*2);g.fill();if(st.shield>0){g.strokeStyle=`rgba(143,211,255,${.25+st.shield*.15})`;g.lineWidth=3;g.beginPath();g.arc(0,0,26,0,Math.PI*2);g.stroke();}g.restore();g.globalAlpha=1;
  sh.querySelector('#cvPH').innerHTML=`<b>${P.n}</b><span>📏 ${fmt(km)} km</span><span>🌡️ ${fmt(tc)} °C</span><span>🛡️ ${'❤️'.repeat(Math.max(0,st.shield))}</span><span>🔷 ${st.orbs}</span>`;
  if(st.t>=dur){st.t=0;st.obs=[];if(st.ph>=2){end(true);return;}st.paused=true;quiz();}
 };
 const quiz=()=>{const q=st.qs.pop()||CD.Q[t][0];const R2=Math.random;const opts=shuffle(R2,q.a.map((a,i)=>({a,ok:!i})));const nx=PHASES[st.ph+1];
  const box=document.createElement('div');box.className='cv-pq';box.innerHTML=`<h3>🔧 Shield check! Entering the ${esc(nx.n)}</h3><p>${txt(nx)}</p><p><b>${esc(q.q)}</b></p><div class="cv-choices">${opts.map((o,i)=>`<button class="cv-btn sm ghost" data-i="${i}">${esc(o.a)}</button>`).join('')}</div>`;
  sh.querySelector('.cv-probe').appendChild(box);
  box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const o=opts[+b.dataset.i];if(o.ok){st.shield=Math.min(3,st.shield+1);S.rp+=2;}
   box.innerHTML=`<h3>${o.ok?'✅ Correct! Shield repaired.':'❌ Not quite.'}</h3><p>${esc(q.x)}</p><button class="cv-btn sm">Continue ⬇️</button>`;box.querySelector('button').onclick=()=>{box.remove();st.ph++;st.paused=false;last=performance.now();};});};
 const end=win=>{st.over=true;cleanup();S.probe.runs=(S.probe.runs||0)+1;const rewarded=S.probe.runs<=3;let coins=0,rp=0,first=false;
  if(st.orbs>S.probe.best)S.probe.best=st.orbs;
  if(win){if(!S.probe.wins){first=true;coins=500;rp=30;}else if(rewarded){coins=50+st.orbs*5;rp=5;}S.probe.wins++;S.probe.rank=Math.min(10,rank+1);}
  else if(rewarded)coins=st.orbs*5;
  if(coins)addCoins(coins,'probe');S.rp+=rp;save(true);ev('probe',{win,orbs:st.orbs,rank:S.probe.rank});
  modal(`<div class="cv-card"><div class="cv-big">${win?'🌟':'💥'}</div><h2>${win?(first?'🏆 Core Explorer! You reached the inner core!':'Inner core reached! Rank up!'):'Probe lost…'}</h2><p>${win?txt(PHASES[2]):'The heat got through your shield. Mission control is building a new probe — try again!'}</p><div class="cv-stats"><span>🔷 ${st.orbs} data</span><span>⭐ Rank ${S.probe.rank}</span></div>${coins||rp?`<div class="cv-rew">+${coins} 🪙${rp?` · +${rp} 🔬`:''}</div>`:rewarded?'':'<p class="cv-sub">No more rewards today — but you can keep practising!</p>'}<button class="cv-btn" data-close>OK</button></div>`);};
 id=requestAnimationFrame(loop);
}

/* ---------------- styles ---------------- */
const CSS=`
.cv{position:fixed;inset:0;z-index:5000;background:#0b0710;font-family:'Fredoka',system-ui,sans-serif;color:#241a3d;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}
.cv canvas#cvC{position:absolute;inset:0;display:block}
.cv button{font-family:inherit;cursor:pointer;border:none;color:inherit;touch-action:manipulation}
.cv-top{position:absolute;left:0;right:0;top:0;padding:calc(6px + env(safe-area-inset-top)) 10px 0;display:flex;flex-direction:column;gap:5px;pointer-events:none}
.cv-row1,.cv-row2{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.cv-chip,.cv-res span,.cv-g span{background:rgba(20,12,30,.78);color:#fff;border-radius:12px;padding:5px 10px;font-weight:600;font-size:14px;white-space:nowrap}
.cv-res{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end}
.cv-g{display:flex;gap:5px;flex-wrap:wrap}.cv-g span{font-size:13px;font-weight:500}.cv-g .warn{background:#c92a2a}
.cv-x{pointer-events:auto;background:rgba(255,255,255,.9)!important;width:36px;height:36px;border-radius:50%;font-size:18px;font-weight:700}
.cv-bat{position:relative;width:130px;height:24px;background:rgba(20,12,30,.78);border-radius:12px;overflow:hidden;margin-left:auto}
.cv-bat i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#2ecc71,#8ce99a);transition:width .2s}.cv-bat i.low{background:linear-gradient(90deg,#ff5a5f,#ffa94d)}
.cv-bat span{position:relative;color:#fff;font-size:13px;font-weight:600;line-height:24px;padding-left:8px}
.cv-depth{position:absolute;right:6px;top:92px;bottom:150px;width:14px;border-radius:8px;overflow:visible;display:flex;flex-direction:column;box-shadow:0 0 0 2px rgba(255,255,255,.25)}
.cv-depth i{display:block;width:100%}.cv-depth i:first-child{border-radius:8px 8px 0 0}.cv-depth i:last-child{border-radius:0 0 8px 8px}
.cv-depth b{position:absolute;left:-6px;right:-6px;height:3px;background:#fff}.cv-depth b.me{height:10px;margin-top:-5px;border-radius:5px;background:#ffd43b;box-shadow:0 0 6px #ffd43b}.cv-depth b.max{background:#ff5a5f}.cv-depth b.pk{background:none;height:auto;left:-24px;font-size:14px;margin-top:-9px}
.cv-msg{position:absolute;left:50%;top:96px;transform:translate(-50%,-10px);max-width:min(560px,86vw);background:rgba(255,255,255,.95);border-radius:14px;padding:10px 14px;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:.25s;text-align:center}
.cv-msg.show{opacity:1;transform:translate(-50%,0)}
.cv-pad{position:absolute;left:12px;bottom:calc(12px + env(safe-area-inset-bottom));width:156px;height:156px}
.cv-pad button{position:absolute;width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.22);color:#fff;font-size:22px;backdrop-filter:blur(3px);box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}
.cv-pad button:active{background:rgba(255,212,59,.6)}
.cv-pad .u{left:52px;top:0}.cv-pad .d{left:52px;bottom:0}.cv-pad .l{left:0;top:52px}.cv-pad .r{right:0;top:52px}
.cv-acts{position:absolute;right:26px;bottom:calc(12px + env(safe-area-inset-bottom));display:flex;flex-wrap:wrap-reverse;gap:8px;justify-content:flex-end;max-width:calc(100vw - 200px)}
.cv-act{position:relative;background:#fff;border-radius:16px;padding:6px 10px;font-size:24px;display:flex;flex-direction:column;align-items:center;min-width:62px;box-shadow:0 4px 0 #b7aee0}
.cv-act span{font-size:12px;font-weight:600}.cv-act.on{background:#b197fc;color:#fff}
.cv-act em{position:absolute;top:-6px;right:-6px;background:#ff5a5f;color:#fff;font-style:normal;font-size:12px;font-weight:700;border-radius:10px;padding:1px 6px}
.cv-mod{position:absolute;inset:0;background:rgba(10,5,20,.6);display:none;align-items:center;justify-content:center;padding:12px;overflow:auto}
.cv-mod.show{display:flex}
.cv-sheet{position:relative;background:#fff;border-radius:22px;padding:18px;max-width:440px;width:100%;max-height:calc(100dvh - 24px);overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.5);margin:auto}
.cv-sheet.wide{max-width:720px}.cv-sheet h2{margin:4px 30px 6px 0;font-size:22px}.cv-sheet p{line-height:1.45}
.cv-sheet.probe{padding:0;max-width:560px;height:min(720px,calc(100dvh - 24px));overflow:hidden}
.cv-mx{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;background:#eee9ff!important;font-size:16px;font-weight:700;z-index:2}
.cv-back{background:#eee9ff!important;border-radius:10px;padding:5px 10px;font-weight:600;margin-bottom:4px}
.cv-sub{color:#6d6490;font-size:14px}
.cv-card{text-align:center}.cv-card h2{margin-right:0}.cv-big{font-size:64px;line-height:1.1}.cv-big2{font-size:40px}.cv-glowe{filter:drop-shadow(0 0 12px #8fffe0)}
.cv-btn{background:#7c5cff;color:#fff!important;font-size:17px;font-weight:600;padding:11px 20px;border-radius:14px;box-shadow:0 4px 0 #4a31c9;margin:4px}
.cv-btn.sm{font-size:14px;padding:7px 12px;box-shadow:0 3px 0 #4a31c9}.cv-btn.ghost{background:#eee9ff;color:#241a3d!important;box-shadow:0 3px 0 #cfc6f5}
.cv-btn.dis,.cv-btn:disabled{opacity:.45}
.cv-row{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:10px}
.cv-rew{background:#fff4cc;border-radius:12px;padding:8px;font-weight:700;margin:10px 0;color:#8a5a00}
.cv-tag{display:inline-block;background:#eee9ff;border-radius:10px;padding:3px 10px;font-size:13px;font-weight:600;margin:4px 0}
.cv-tag.r2{background:#d3f9d8}.cv-tag.r3{background:#d0ebff}.cv-tag.r4{background:#f3d9fa}
.cv-h{background:#f1f3f5;border-radius:10px;padding:8px;margin-top:8px;font-size:14px;text-align:left}
.cv-stats,.cv-facts{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:6px 0}.cv-stats span,.cv-facts span{background:#f3f0ff;border-radius:10px;padding:4px 10px;font-size:13px;font-weight:600}
.cv-layer{border-top:8px solid var(--lc);border-radius:10px}
.cv-empty{text-align:center;color:#6d6490;padding:24px}
.cv-specs{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
.cv-spec{background:#f6f3ff;border-radius:16px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:2px}.cv-spec small{color:#6d6490}
.cv-bench{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center}
.cv-specimen{background:radial-gradient(#fff,#e9e4ff);border-radius:20px;padding:10px}
.cv-tests{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;flex:1;min-width:240px}
.cv-test{background:#f3f0ff;border-radius:12px;padding:8px 4px;font-size:22px;display:flex;flex-direction:column;align-items:center}.cv-test span{font-size:12px;font-weight:600}.cv-test small{font-size:10px;color:#a33}
.cv-test.did{background:#d3f9d8}.cv-test:disabled{opacity:.5}
.cv-tools{display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;background:#fff4cc;border-radius:12px;padding:8px;margin-top:8px}.cv-tools button{background:#fff;border-radius:10px;padding:6px 10px;font-weight:600}
.cv-log{background:#fbfaff;border:2px dashed #ddd5ff;border-radius:14px;padding:6px 12px;margin-top:10px}.cv-log h4{margin:4px 0}.cv-log ul{margin:4px 0;padding-left:18px}.cv-log li{margin:3px 0}.cv-log.small{font-size:13px}
.cv-sw{display:inline-block;width:14px;height:14px;border-radius:4px;border:1px solid #999;vertical-align:-2px}
.cv-anim{text-align:center;font-size:30px;animation:cvpop .6s}@keyframes cvpop{from{transform:scale(.3);opacity:0}}
.cv-hint{background:#fff4cc;border-radius:12px;padding:8px 12px;margin-top:8px}
.cv-guide{display:flex;flex-direction:column;gap:4px;margin-top:8px;font-size:13px}
.cv-gh,.cv-cand{display:grid;grid-template-columns:1.5fr repeat(6,1fr);gap:4px;align-items:center;text-align:center}
.cv-gh{font-weight:700;color:#6d6490;font-size:11px}.cv-cand{background:#f6f3ff;border-radius:12px;padding:4px}.cv-cand b{text-align:left}.cv-cand:hover{background:#e5dbff}.cv-cand.off{opacity:.35;text-decoration:line-through}
.cv-gear{display:flex;gap:10px;align-items:center;background:#f6f3ff;border-radius:14px;padding:10px;margin:8px 0}.cv-gi{font-size:34px}.cv-gt{flex:1}.cv-gt small{display:block;color:#6d6490}.cv-next{font-size:13px;margin-top:3px}.cv-next i{color:#6d6490}.warn{color:#c92a2a}
.cv-buy{background:#ffc83d;color:#5a3b00;border-radius:12px;padding:8px 10px;font-weight:700;box-shadow:0 3px 0 #c98f00;min-width:78px}.cv-buy:disabled{opacity:.4}
.cv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.cv-tabs button{background:#f3f0ff;border-radius:10px;padding:6px 10px;font-weight:600;font-size:13px}.cv-tabs button.on{background:#7c5cff;color:#fff}
.cv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.cv-jc{background:#f6f3ff;border-radius:14px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:13px}.cv-jc.un{opacity:.55}.cv-jc span,.cv-e{font-size:32px}.cv-jc small{color:#6d6490;font-size:11px;text-align:center}
.cv-recs{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.cv-recs div{background:#f6f3ff;border-radius:14px;padding:12px;text-align:center}.cv-recs b{display:block;font-size:22px}.cv-recs span{font-size:12px;color:#6d6490}
.cv-geode{width:90px;height:90px;border-radius:50%;margin:0 auto;background:radial-gradient(circle,var(--gc) 0 38%,#fff 40% 44%,#7d7468 46%);position:relative;box-shadow:0 0 20px var(--gc)}.cv-geode.sm{width:44px;height:44px}
.cv-ex{display:flex;gap:10px;align-items:center;background:#f6f3ff;border-radius:14px;padding:10px;margin:6px 0}.cv-ex.done{background:#e6fcf5}.cv-exe{font-size:36px;width:48px;text-align:center}.cv-ex>div:nth-child(2){flex:1}.cv-ex small{display:block;color:#6d6490}.cv-ok{font-size:13px;font-weight:600;color:#087f5b}
.cv-tl{margin-top:12px;background:#fff9db;border-radius:14px;padding:10px}.cv-tl h4{margin:2px 0 8px}.cv-tli{display:flex;gap:8px;align-items:center}.cv-tli span{font-size:26px}.cv-tli small{color:#6d6490;margin-left:auto;text-align:right}.cv-tla{text-align:center;font-size:12px;color:#a08a2e}
.cv-skel{position:relative;height:260px;background:#f4ede0;border-radius:16px;margin:8px 0;overflow:hidden}.cv-ghost{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:190px;opacity:.16}
.cv-slot{position:absolute;transform:translate(-50%,-50%);min-width:56px;min-height:44px;border-radius:12px;border:3px dashed #b39b72!important;background:rgba(255,255,255,.7);font-weight:700;color:#8a7350;font-size:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px 6px}
.cv-slot small{font-size:10px}.cv-slot.full{border-style:solid!important;background:#fff;color:#241a3d}.cv-slot.shake{animation:cvsh .35s}@keyframes cvsh{25%{transform:translate(-44%,-50%)}75%{transform:translate(-56%,-50%)}}
.cv-bones{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.cv-bone{background:#f4ede0;border-radius:12px;padding:8px 12px;font-weight:600}.cv-bone.sel{background:#ffd43b}
.cv-drip{width:100%;max-width:360px;display:block;margin:6px auto}
.cv-meter{height:14px;background:#eee9ff;border-radius:8px;overflow:hidden;margin:8px 0}.cv-meter i{display:block;height:100%;background:linear-gradient(90deg,#74c0fc,#7c5cff);transition:width .3s}.cv-meter.ok i{background:linear-gradient(90deg,#69db7c,#2ecc71)}
.cv-stops{display:grid;gap:8px}.cv-stop{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:8px;background:#f6f3ff;border-left:10px solid var(--lc);border-radius:12px;padding:10px;text-align:left}.cv-stop span{font-size:26px}.cv-stop small{color:#6d6490}
.cv-pz{width:100%;max-width:520px;display:block;margin:6px auto;border-radius:12px}.cv-pz.sq{max-width:400px}.cv-mirror{cursor:pointer}
.cv-range{width:100%;accent-color:#ffd43b;height:30px}
.cv-sonar{display:grid;gap:6px}.cv-sonar div{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;gap:6px;text-align:center}
.cv-raft{display:grid;grid-template-columns:150px 1fr;gap:10px}@media(max-width:520px){.cv-raft{grid-template-columns:1fr}}
.cv-tank{text-align:center;font-size:12px}.cv-water{height:120px;border-radius:0 0 14px 14px;border:3px solid #adb5bd;border-top:none;background:linear-gradient(transparent 30%,#74c0fc 30%);position:relative}
.cv-blk{position:absolute;left:50%;width:50px;height:40px;margin-left:-25px;font-size:30px;display:flex;align-items:center;justify-content:center;transition:top .8s}
.cv-blk.sk{top:78px}
.cv-mats{display:grid;gap:5px}.cv-mat{display:grid;grid-template-columns:30px 1fr auto auto auto;gap:6px;align-items:center;background:#f6f3ff;border-radius:10px;padding:5px 8px;font-size:14px}.cv-mat span{font-size:22px}.cv-mat small{color:#6d6490}.cv-mat button{background:#fff;border-radius:8px;padding:5px 8px;font-weight:600}.cv-mat button:disabled{opacity:.4}
.cv-raftb{display:flex;gap:4px;align-items:center;justify-content:center;min-height:56px;background:linear-gradient(transparent 55%,#74c0fc 55%);border-radius:12px;margin-top:10px;padding:4px;transition:transform .8s}.cv-raftb.sink{transform:translateY(20px);opacity:.6}.cv-raftb button{font-size:28px;background:#b98a52;border-radius:6px;padding:2px 4px}.cv-me{font-size:30px}
.cv-sockets,.cv-minsel{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0}
.cv-sock{width:90px;height:100px;border-radius:16px;background:#1c1626;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 16px var(--g),inset 0 0 0 3px var(--g)}.cv-sock.sel{outline:4px solid #ffd43b}.cv-sock span{font-size:30px}
.cv-minsel button{background:#1c1626;color:#fff;border-radius:14px;padding:6px 10px;display:flex;flex-direction:column;align-items:center;font-size:12px}
.cv-nsel{display:flex;gap:6px;justify-content:center}.cv-nsel button{width:44px;height:44px;border-radius:12px;background:#f3f0ff;font-weight:700;font-size:18px}.cv-nsel button.on{background:#7c5cff;color:#fff}
.cv-choices{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.cv-probe{position:relative;width:100%;height:100%}.cv-probe canvas{width:100%;height:100%;display:block}
.cv-phud{position:absolute;left:8px;right:8px;top:8px;display:flex;gap:6px;flex-wrap:wrap}.cv-phud>*{background:rgba(0,0,0,.55);color:#fff;border-radius:10px;padding:4px 8px;font-size:13px}
.cv-pctl{position:absolute;left:0;right:0;bottom:14px;display:flex;justify-content:space-between;padding:0 14px}.cv-pctl button{width:70px;height:60px;border-radius:16px;background:rgba(255,255,255,.3);color:#fff;font-size:26px}
.cv-pq{position:absolute;left:12px;right:12px;top:18%;background:#fff;border-radius:18px;padding:14px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.5)}.cv-pq h3{margin:4px 0}.cv-pq p{font-size:14px}
@media(max-width:560px){.cv-chip,.cv-res span{font-size:12px;padding:4px 7px}.cv-g span{font-size:11px;padding:4px 7px}.cv-bat{width:100px}.cv-pad{width:138px;height:138px}.cv-pad button{width:46px;height:46px}.cv-pad .u,.cv-pad .d{left:46px}.cv-pad .l,.cv-pad .r{top:46px}.cv-act{min-width:52px;font-size:20px;padding:5px 7px}.cv-acts{max-width:calc(100vw - 170px)}.cv-tests{grid-template-columns:repeat(4,1fr);min-width:0}.cv-gh,.cv-cand{grid-template-columns:1.3fr repeat(6,1fr);font-size:11px}.cv-gh{font-size:10px}.cv-bench{flex-direction:column}.cv-tests{width:100%}.cv-specimen svg{width:80px;height:80px}}
`;

/* ---------------- public API ---------------- */
function open(host){
 H=host;S=host.state;initState();
 if(!document.getElementById('cvCSS')){const st=document.createElement('style');st.id='cvCSS';st.textContent=CSS;document.head.appendChild(st);}
 genWorld();build();snapCam();hud();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
 if(S.caveIn){S.caveIn=false;say('🌙 Overnight a small cave-in shifted the rocks — new pockets have opened! Look for today\'s ✨ secret pocket.',5000);}
 else if(!S.stats.dug)modal(`<div class="cv-card"><div class="cv-big">⛏️</div><h2>Deep Down: The Science Cave</h2><p>Dig down through the real layers of the Earth! Find mystery minerals 💎, fossils 🦴 and cave critters 🦇. Study your finds in the 🔬 Lab to earn coins and research points, then upgrade your gear to dig deeper and deeper.</p><p class="cv-sub">Use the arrow buttons (or swipe) to dig. Tap 🏠 to beam back to camp any time.</p><button class="cv-btn" data-close>Start digging!</button></div>`);
 save(true);
}
function leave(){save(true);cancelAnimationFrame(raf);window.removeEventListener('keydown',onKey);window.removeEventListener('resize',resize);if(root)root.remove();root=null;const h=H;H=null;W=null;if(h&&h.exit)h.exit();}
function summary(st){st=st||{};const L=[...CD.LAYERS].reverse().find(l=>(st.maxRow||0)>=l.r0);
 const r=st.maxRow||0;let km=0;if(L){km=L.km0+(L.km1-L.km0)*(r-L.r0)/Math.max(1,L.r1-L.r0);}
 return {maxRow:r,km,layer:L?L.n:'Surface',minerals:Object.keys(st.idd||{}).length,fossils:Object.keys(st.ex||{}).length,critters:Object.keys(st.crit||{}).length,probeRank:(st.probe||{}).rank||0};}
window.Cave={open,leave,summary,_dbg:()=>({S,W,H,step,beamHome,openPuzzle,solved,guess,openLab,bench,identify,openGear,buy,openMuseum,assemble,openGarden,openJournal,openElevator,openProbe,probeRun,closeModal,rowTemp,rowKm,tile,idx,GATES,uv:v=>{uvOn=v;hud();},fast:()=>{STEP_MS=0;},isUV:()=>uvOn,genWorld,layerOf,rockOf,suit,drill,packMax,batMax,lampR,modalOpen})};
})();
