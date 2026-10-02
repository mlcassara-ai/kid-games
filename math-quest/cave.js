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
/* ---------------- sound effects (follow the game's "Sound effects" switch) ---------------- */
let SAC=null,NB=null;
function sndOK(){try{return !(typeof state!=='undefined'&&state&&state.sound===false);}catch(e){return true;}}
function sac(){try{SAC=SAC||new (window.AudioContext||window.webkitAudioContext)();if(SAC.state!=='running')SAC.resume();return SAC;}catch(e){return null;}}
function tn(f,d,type,v,dl,f2){const a=sac();if(!a)return;const t=a.currentTime+(dl||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v||.08,t+.008);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(window.fxOut?fxOut(a):a.destination);o.start(t);o.stop(t+d+.05);}
function nzs(d,fq,q,v,dl){const a=sac();if(!a)return;if(!NB){NB=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=NB.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}
 const t=a.currentTime+(dl||0),s=a.createBufferSource();s.buffer=NB;const fl=a.createBiquadFilter();fl.type='bandpass';fl.frequency.value=fq;fl.Q.value=q||1;const g=a.createGain();
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v||.1,t+.005);g.gain.exponentialRampToValueAtTime(.0005,t+d);s.connect(fl);fl.connect(g);g.connect(window.fxOut?fxOut(a):a.destination);s.start(t,Math.random()*.5);s.stop(t+d+.05);}
let stepN=0;
function sfx(k,x){if(!sndOK())return;try{switch(k){
 case 'step':{const s=(stepN++%2)?1:.85;nzs(.06,(x?1700:1250)*s,1.2,.06);if(x)tn(230*s,.05,'sine',.03);break;}
 case 'dig':{const h=Math.min(10,x||2);nzs(.18,260+h*110,.8,.18);nzs(.1,1600+h*260,1.6,.08,.03);tn(95+h*9,.13,'triangle',.09);break;}
 case 'coin':tn(1320,.08,'square',.035);tn(1760,.14,'square',.035,.07);break;
 case 'chest':[523,659,784,1047].forEach((f,i)=>tn(f,.25,'triangle',.08,i*.09));break;
 case 'find':tn(988,.18,'sine',.08);tn(1480,.25,'sine',.06,.08);tn(1976,.3,'sine',.04,.16);break;
 case 'fossil':tn(330,.2,'triangle',.08);tn(494,.25,'triangle',.07,.1);nzs(.12,900,1,.05);break;
 case 'critter':tn(1200,.08,'sine',.06,0,1700);tn(1500,.09,'sine',.05,.11,2100);break;
 case 'bonk':tn(170,.2,'sine',.11,0,115);break;
 case 'hot':nzs(.45,700,.4,.08);tn(210,.3,'sine',.05,0,150);break;
 case 'layer':[392,523,659,784].forEach((f,i)=>tn(f,.3,'triangle',.07,i*.1));break;
 case 'beam':tn(260,.7,'sine',.07,0,1500);nzs(.55,2600,.7,.04);break;
 case 'low':tn(880,.08,'square',.04);tn(660,.12,'square',.04,.13);break;
 case 'tap':tn(640,.05,'triangle',.045);break;
 case 'right':tn(660,.12,'triangle',.1);tn(990,.2,'triangle',.1,.08);break;
 case 'wrong':tn(240,.18,'sine',.09);tn(190,.25,'sine',.09,.12);break;
 case 'win':[523,659,784,1047,1319].forEach((f,i)=>tn(f,.3,'triangle',.09,i*.1));break;
 case 'buy':tn(1320,.08,'square',.04);tn(1760,.14,'square',.04,.07);tn(2093,.2,'triangle',.05,.16);break;
 case 'elev':tn(110,1.1,'sawtooth',.025,0,230);nzs(1,500,.5,.04);tn(1320,.25,'sine',.07,1.05);break;
 case 'magnet':tn(1500,.05,'square',.05);nzs(.05,4200,2,.07);break;
 case 'acid':for(let i=0;i<9;i++)tn(650+Math.random()*1000,.06,'sine',.035,i*.055);nzs(.55,5200,.6,.03);break;
 case 'water':tn(480,.12,'sine',.07,0,950);tn(700,.1,'sine',.05,.13,1250);break;
 case 'streak':nzs(.35,2300,.8,.09);break;
 case 'hard':nzs(.25,3600,1.6,.08);tn(2500,.07,'square',.02);break;
 case 'uv':tn(120,.6,'sawtooth',.02);tn(1760,.45,'sine',.035,.1);break;
 case 'look':tn(880,.1,'sine',.05);tn(1320,.12,'sine',.04,.08);break;
 case 'geode':nzs(.22,1200,1,.15);[1047,1319,1568,2093].forEach((f,i)=>tn(f,.3,'sine',.05,.18+i*.08));break;
 case 'gate':tn(80,.8,'sawtooth',.05,0,50);nzs(.8,320,.5,.1);[523,784,1047].forEach((f,i)=>tn(f,.3,'triangle',.07,.5+i*.1));break;
 case 'uvon':tn(1200,.15,'sine',.05,0,1800);break;
}}catch(e){}}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(R,a)=>a[Math.floor(R()*a.length)];
function shuffle(R,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/* the real calendar day: the garden drip and the probe's daily runs follow the clock, not the tunnel map (which the host may keep for several trips) */
function realDay(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function today(){if(H&&H.today)return H.today();const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

let H=null,S=null,W=null,root=null,cv=null,ctx=null,fog=null,fctx=null;
let TS=44,camX=0,camY=0,raf=0,busy=false,uvOn=false,parts=[],msgT=0,lastSave=0,tick=0,hot={};
const TIER=()=>CD.tier(+H.player.grade||3);
/* Math Quest mode: every visit is a TRIP (paid for with a mystery rock), deeper gates need Boss Medals, Dr. Quartz guides you at camp & in the lab */
const MQ=()=>!!(H&&H.trip);
const medals=()=>{try{return H.medals?+H.medals():99;}catch(e){return 99;}};
const gateNeed=id=>{try{return H.gateNeed?+H.gateNeed(id):0;}catch(e){return 0;}};
function guide(html,mood){const g=(H&&H.guideSVG)||'';return `<div class="cv-guide ${mood||''}"><div class="cv-gav">${g||'<span>👨‍🔬</span>'}</div><div class="cv-gsay"><b>Dr. Quartz</b><div>${html}</div></div></div>`;}
const txt=o=>{const t=TIER();return (t>0&&o.o?o.o:o.y)+(t>1&&o.hs?`<div class="cv-h">🧪 ${o.hs}</div>`:'');};

/* ---------------- state ---------------- */
function initState(){
 S.v=1;S.gear=Object.assign({drill:0,suit:0,bat:0,pack:0,lamp:0,uv:0,chg:0},S.gear||{});
 ['gates','found','idd','fos','ex','crit','geo','seen','stats'].forEach(k=>S[k]=S[k]||{});
 S.pack=S.pack||[];S.rp=S.rp||0;S.maxRow=S.maxRow||0;S.probe=S.probe||{rank:0,best:0,wins:0,day:'',runs:0};
 S.stats.dug=S.stats.dug||0;S.dive=S.dive||{c:0,f:0,cr:0,d:0,ch:0};
 const d=today();
 if(S.day!==d){const first=!S.day;S.day=d;S.dug='';S.obs=[];S.x=4;S.y=0;S.bat=batMax();S.caveIn=!first;}
 {const rd=realDay();if(S.probe.day!==rd){S.probe.day=rd;S.probe.runs=0;}}
 if(S.bat==null)S.bat=batMax();
 charge(true); // the helmet battery charges while you are away
 if(S.y===0)PEND_FOS=deliverFossils(); /* fossil pieces still in the backpack at camp (a new cave reset the hero to camp without beaming home) go to the Museum */
}
/* fossil pieces travel to the Museum whenever the hero is at camp; they never sit in the backpack (where the Lab can't see them) */
let PEND_FOS=0;
function deliverFossils(){const fos=(S.pack||[]).filter(p=>p.t==='f');if(!fos.length)return 0;S.fos=S.fos||{};fos.forEach(p=>{S.fos[p.id]=S.fos[p.id]||[];S.fos[p.id][p.i]=1;});S.pack=S.pack.filter(p=>p.t!=='f');try{save(true);}catch(e){}return fos.length;}
/* battery charges over time — only at camp (or while the game is closed). Math power-ups charge it instantly. */
const CHG=[{v:10,c:0,e:'🔌',n:'Basic Charger'},{v:15,c:250,r:10,e:'🔌',n:'Fast Charger'},{v:22,c:700,r:25,e:'⚡',n:'Turbo Charger'},{v:32,c:1600,r:50,e:'⚡',n:'Mega Charger'}];
function now(){try{return H&&H.now?H.now():Date.now();}catch(e){return Date.now();}}
const chgRate=()=>CHG[S.gear.chg||0].v;
function charge(away){if(H&&H.noRecharge){S.batT=now();return;}const t=now();const last=S.batT||t;S.batT=t;const dt=Math.max(0,(t-last)/60000);if((S.y===0||away)&&S.bat<batMax())S.bat=Math.min(batMax(),S.bat+dt*chgRate());}
function fullIn(){if(H&&H.noRecharge)return '';const m=(batMax()-S.bat)/chgRate();if(m<=0)return '';const s=Math.ceil(m*60);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
const batMax=()=>CD.BATT[S.gear.bat].v, packMax=()=>CD.PACK[S.gear.pack].v, lampR=()=>CD.LAMP[S.gear.lamp].v;
const drill=()=>CD.DRILLS[S.gear.drill], suit=()=>CD.SUITS[S.gear.suit];
function save(force){const n=Date.now();if(force||n-lastSave>1500){lastSave=n;S.dug=encDug();try{H.save();}catch(e){}}}
function addCoins(n,why){if(n>0){H.addCoins(n,why||'cave');}}
/* coins dug up in the cave get the player's Math Quest coin bonuses (pet perk, ascension…) via host.coinMult() */
/* mineral mastery: ★ at 5, ★★ at 15, ★★★ at 40 of the same mineral */
const STAR_AT=[5,15,40];const starsOf=id=>STAR_AT.filter(n=>(S.found[id]||0)>=n).length;
function foundOne(id){const b=starsOf(id);S.found[id]=(S.found[id]||0)+1;const a=starsOf(id);if(a>b){S.rp+=3;return a;}return 0;}
function coinMult(){try{return H.coinMult?Math.max(1,+H.coinMult()||1):1;}catch(e){return 1;}}
function addDugCoins(n){const v=Math.max(1,Math.round(n*coinMult()));H.addCoins(v,'cave-dig');return v;}
const COINV=[5,8,12,16,22,30,40,55],CHESTV=[40,60,90,120,160,220,300,400];
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
  // buried coins + one treasure chest per layer per day
  const li=CD.LAYERS.indexOf(L);const nc=Math.round((L.r1-L.r0+1)*(COLS-1)*0.022);
  for(let k=0,tries=0;k<=nc&&tries<600;tries++){const x=1+Math.floor(R()*(COLS-1)),y=L.r0+Math.floor(R()*(L.r1-L.r0+1)),i=idx(x,y);
   if(!isRock(i)||items.has(i)||landing(x,y))continue;const ch=k===nc;items.set(i,{t:'$',ch,v:ch?CHESTV[li]:Math.round(COINV[li]*(.7+R()*.6))});k++;}
  // fossils: missing pieces, up to 2 per fossil per day
  CD.FOSSILS.filter(f=>f.L===L.id).forEach(f=>{const got=S.fos[f.id]||[];const miss=f.parts.map((_,i)=>i).filter(i=>!got[i]&&!campOnly(f,i));
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
const femo=f=>(CD.FART&&CD.FART[f.id])||(f.e==='trilobite'?TRILO:f.e);
/* Adventure Camp fossils: the piece at f.camp is never dug up in the cave, only brought home by a camp crew (cleanup.js) */
const campOnly=(f,i)=>f.camp!=null&&i===f.camp;

/* ---------------- DOM ---------------- */
function build(){
 root=document.createElement('div');root.className='cv';root.id='cvRoot';
 root.innerHTML=`<canvas id="cvC"></canvas>
 <div class="cv-top"><div class="cv-row1"><div class="cv-chip" id="cvLayer"></div><div class="cv-res"><span id="cvCoins"></span><span id="cvRP"></span><span id="cvPack"></span></div><button class="cv-x cv-snd" id="cvSnd" aria-label="Sound and music"></button><button class="cv-x cv-map" id="cvExit" aria-label="Back to the map">🗺️<span class="cv-mapt"> Map</span></button></div>
  <div class="cv-row2"><div class="cv-g" id="cvG"></div><div class="cv-bat" title="Battery"><i id="cvBatI"></i><span id="cvBatT"></span></div></div></div>
 <div class="cv-depth" id="cvDepth"></div>
 <div class="cv-msg" id="cvMsg"></div>
 <div class="cv-pad" id="cvPad"><button data-d="0,-1" class="u">▲</button><button data-d="-1,0" class="l">◀</button><button data-d="1,0" class="r">▶</button><button data-d="0,1" class="d">▼</button></div>
 <div class="cv-acts" id="cvActs"></div>
 <div class="cv-mod" id="cvMod"></div>`;
 document.body.appendChild(root);
 root.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&!b.closest('#cvPad'))sfx('tap');},true); // every button clicks softly
 cv=root.querySelector('#cvC');ctx=cv.getContext('2d');fog=document.createElement('canvas');fctx=fog.getContext('2d');
 root.querySelector('#cvExit').onclick=()=>leave();
 const sb=root.querySelector('#cvSnd');const sbSet=()=>{const off=window.Music&&Music.muted&&Music.muted('cave');const I=typeof TB_ICONS!=='undefined'?TB_ICONS:null;if(I)sb.innerHTML=off?I.mute:I.sound;else sb.textContent=off?'🔇':'🔊';sb.title='Sound & music';};sbSet();
 // the sound panel sits in its own layer above everything, so it never replaces a lab test or a card that's open
 const sndClose=()=>{const o=root.querySelector('.cv-sndov');if(o)o.remove();sbSet();};
 const sndPanel=()=>{let o=root.querySelector('.cv-sndov');const y=o?o.scrollTop:0;if(!o){o=document.createElement('div');o.className='cv-sndov';root.appendChild(o);o.addEventListener('pointerdown',e=>{if(e.target===o)sndClose();});}
  o.innerHTML=`<div class="cv-sheet cv-sndp"><button class="cv-mx" aria-label="Close">✕</button>${Music.panel('cave')}<div class="cv-row"><button class="cv-btn">Done</button></div></div>`;o.scrollTop=y;
  o.querySelectorAll('.cv-mx,.cv-row .cv-btn').forEach(x=>x.onclick=sndClose);};
 window.__cvSndRefresh=()=>{sbSet();if(root.querySelector('.cv-sndov'))sndPanel();};
 sb.onclick=()=>{if(!window.Music||!Music.panel)return;sndPanel();};
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
  if(camY<TS*1.5&&campTap(wx,wy))return;
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
let FACE=[0,1];
function step(dx,dy){
 if(busy||modalOpen()||coreOn)return;FACE=[dx,dy];const now=Date.now();if(now-lastStep<STEP_MS)return;lastStep=now;
 const nx=S.x+dx,ny=S.y+dy;
 if(nx<1||nx>=COLS||ny<0||ny>=ROWS)return;
 if(ny===0&&S.y===0){S.x=nx;sfx('step',0);after();return;}
 const t=tile(nx,ny);
 if(ny>0&&t!==T_BAR&&t!==T_GATE&&t!==T_DOOR){const tp=rowTemp(ny);if(tp>suit().t){sfx('hot');say(`🥵 Too hot! It's ${fmt(tp)} °C down there. Your ${suit().n} is safe to ${fmt(suit().t)} °C. Upgrade your suit at the 🛒 Gear shop.`);return;}}
 if(t===T_AIR){S.x=nx;S.y=ny;sfx('step',ny>0);after();return;}
 if(t===T_SHAFT)return;
 if(t===T_WATER){if(S.gates.raft){S.x=nx;S.y=ny;after();}else openPuzzle('raft');return;}
 if(t===T_LAVA){if(suit().t>=1200){S.x=nx;S.y=ny;after();say('🔥 Walking over lava in Magma Armor! Lava is about 700–1,300 °C.');}else say('🌋 Lava! Melted rock is about 700–1,300 °C. Go around it.');return;}
 if(t===T_BAR){const g=GATES[ny];sfx('bonk');
  if(ny===CORE_ROW)say('🧱 Super-dense mantle rock. Look for the 💠 Core Door in this band.');
  else if(g&&g.id==='glow'&&!S.gear.uv)say('✨ Something on this wall glows very faintly… A 🔦 UV lamp would show it. (Gear shop)');
  else if(g&&g.id==='glow'&&!uvOn)say('✨ Turn on your 🔦 UV lamp to find the glowing door.');
  else say(`🧱 This rock band is too tough to dig. Look along it for the ${g?g.e+' '+g.n:'gate'}${g&&gateNeed(g.id)>medals()?` (it shows a 🔒 until you have ${gateNeed(g.id)} 🏅 Boss Medals)`:''}.`);return;}
 if(t===T_GATE){const g=GATES[ny];if(gateNeed(g.id)>medals()){sfx('bonk');lockCard(g);return;}if(g.id==='glow'&&!uvOn){say(S.gear.uv?'✨ Turn on your 🔦 UV lamp — this door only shows up in UV light.':'✨ Something glows faintly here… You need a 🔦 UV lamp.');return;}openPuzzle(g.id);return;}
 if(t===T_DOOR){if(gateNeed('core')>medals()){lockCard({id:'core',n:'Core Door',e:'💠'});return;}if(S.gear.drill<4){say('💠 The Core Door! It is harder than anything but diamond. You need the 💎 Diamond Drill.');return;}
  if(suit().t<1300){say('💠 It is about 1,300 °C here. You need 🔥 Magma Armor to open the Core Door.');return;}
  S.gates.core=1;W.g[idx(nx,ny)]=T_AIR;setDug(idx(nx,ny));save(true);openProbe();return;}
 const rk=rockOf(t);if(!rk)return;
 if(rk.h>drill().h){sfx('bonk');say(`⛏️ Too hard! ${rk.n} is about ${rk.h} on the hardness scale. Your ${drill().e} ${drill().n} digs up to ${drill().h}. Upgrade in the 🛒 Gear shop.`);return;}
 const cost=rk.h>drill().h-1.5?2:1;
 if(S.bat<cost){if(S.y===0){say(MQ()?(powerLeft()>0?'🔋 Battery empty! Tap ⚡ Power Up — every right answer adds charge.':'🔋 The battery is worn out for this trip. Bring Dr. Quartz another 🪨 mystery rock to come back!'):`🔋 Battery too low to dig! It's charging — full in ${fullIn()}. Tap ⚡ Power Up to charge it faster with math!`,4500);}else beamHome('battery');return;}
 const bm0=S.bat/batMax();S.bat-=cost;const i=idx(nx,ny);W.g[i]=T_AIR;setDug(i);S.stats.dug++;burst(nx,ny,rk.col);sfx('dig',rk.h);if(bm0>=.25&&S.bat/batMax()<.25)setTimeout(()=>sfx('low'),200);
 S.x=nx;S.y=ny;after();
 if(S.bat<=0)setTimeout(()=>beamHome('battery'),400);
}
function after(){
 const i=idx(S.x,S.y);const it=W.items.get(i);
 if(it&&it.t==='$'){W.items.delete(i);setDug(i);const v=addDugCoins(it.v);S.dive.c+=v;if(it.ch)S.dive.ch++;sfx(it.ch?'chest':'coin');floats.push({x:(S.x+.5)*TS,y:S.y*TS,t:`+${v} 🪙`,l:1,big:it.ch});if(it.ch)say(`🧰 A buried treasure chest! +${v} coins!`,2500);}
 else if(it&&it.t!=='c'){if(S.pack.length>=packMax()){sfx('bonk');say(`🎒 Backpack full (${packMax()})! Tap 🏠 to beam to camp and study your finds.`);}
  else{W.items.delete(i);setDug(i);
   if(it.t==='m'){sfx('find');S.dive.f++;S.pack.push({t:'m',id:it.id,k:Date.now().toString(36)+Math.random().toString(36).slice(2,5),tests:{}});say(S.idd[it.id]?`💎 ${CD.MIN[it.id].n}! You already know this one — you'll sell it at camp.`:`💎 A mystery mineral! Study it in the 🔬 Lab.`);}
   else if(it.t==='f'){sfx('fossil');S.dive.f++;S.pack.push({t:'f',id:it.id,i:it.i});const f=CD.FOSSILS.find(x=>x.id===it.id);say(`🦴 A fossil piece! Looks like part of a ${f.n} (${f.parts[it.i]}).`);}
   else if(it.t==='g'){sfx('find');S.dive.f++;S.pack.push({t:'g',id:it.id});say('🔮 You found today\'s SECRET POCKET — a geode! Crack it open in the 🔬 Lab.');}
  }}
 // critter next to you? observe automatically when you bump into it
 [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b])=>{const j=idx(S.x+a,S.y+b);const c=W.items.get(j);if(!c||c.t!=='c'||S.x+a<=0)return;
  /* a new critter always opens its card; one you already have says 'Hello again!' once per dive for each kind */
  if(!S.crit[c.id]||!metNow.has(c.id))observe(j,c);});
 if(S.y>S.dive.d)S.dive.d=S.y;
 if(S.y>S.maxRow){S.maxRow=S.y;ev('depth',{row:S.y,km:rowKm(S.y)});}
 const L=layerOf(S.y);if(L&&!S.seen[L.id]){S.seen[L.id]=1;save(true);layerCard(L);}
 if(coreDue()){hud();save();coreFall();return;} /* the Core Keeper: the Mantle floor cracks under a hero in the Core Suit */
 hud();save();
}
function beamHome(why){sfx('beam');metNow.clear();
 const dv=S.dive;S.dive={c:0,f:0,cr:0,d:0,ch:0};
 S.x=4;S.y=0;charge();uvOn=false;snapCam();
 const fos=S.pack.filter(p=>p.t==='f');let msg=MQ()?(why==='battery'?'🔋 Battery empty — the rescue rope pulled you back to camp.':'🏠 Back at camp.'):(why==='battery'?'🔋 Battery empty — the rescue rope pulled you back to camp. It\'s charging now 🔌':'🏠 Back at camp. Your battery is charging 🔌');
 const known=S.pack.filter(p=>p.t==='m'&&S.idd[p.id]);const starMsgs=[];let sold=0;if(known.length){known.forEach(p=>{const st=foundOne(p.id);if(st)starMsgs.push(`⭐ ${CD.MIN[p.id].n} reached ${'★'.repeat(st)}! +3 🔬`);sold+=CD.RAR[CD.MIN[p.id].r].sell;});S.pack=S.pack.filter(p=>!known.includes(p));sold=addDugCoins(sold);}
 if(fos.length){fos.forEach(p=>{S.fos[p.id]=S.fos[p.id]||[];S.fos[p.id][p.i]=1;});S.pack=S.pack.filter(p=>p.t!=='f');msg+=` 🦴 ${fos.length} fossil piece${fos.length>1?'s':''} sent to the 🏛️ Museum.`;}
 say(msg);hud();save(true);
 if(dv&&(dv.c||dv.f||dv.cr||known.length||why==='battery')){const spec=S.pack.filter(p=>p.t!=='f').length;
  card(`<div class="cv-card"><div class="cv-big">🎒</div><h2>Dive haul!</h2><div class="cv-haul">${dv.c?`<div><b>+${fmt(dv.c)}</b><span>🪙 coins dug up${dv.ch?` (${dv.ch} chest${dv.ch>1?'s':''}!)`:''}</span></div>`:''}${dv.f?`<div><b>${dv.f}</b><span>💎 finds</span></div>`:''}${known.length?`<div><b>+${fmt(sold)}</b><span>🪙 sold ${known.length} mineral${known.length>1?'s':''} you already know</span></div>`:''}${dv.cr?`<div><b>${dv.cr}</b><span>🐾 new critters</span></div>`:''}<div><b>${depthStr(Math.max(1,dv.d))}</b><span>📏 deepest this dive</span></div></div>${starMsgs.length?`<div class="cv-rew">${starMsgs.join('<br>')}</div>`:''}${spec?`<p class="cv-sub">${spec} specimen${spec>1?'s':''} waiting in the Lab — identify them for more coins and 🔬!</p>`:''}${why==='battery'?'<p class="cv-sub">🔋 Your battery ran out, so the rescue rope pulled you up.</p>':''}<div class="cv-row">${spec?'<button class="cv-btn" id="cvToLab">🔬 Go to the Lab</button>':''}<button class="cv-btn ${spec?'ghost':''}" data-close>OK</button></div></div>`);
  setTimeout(()=>{const tl=root&&root.querySelector('#cvToLab');if(tl)tl.onclick=()=>{closeModal();openLab();};},0);}
}
let floats=[];const metNow=new Set(); /* critters already greeted on this dive */
function burst(x,y,col){for(let k=0;k<10;k++)parts.push({x:(x+.5)*TS,y:(y+.5)*TS,vx:(Math.random()-.5)*5,vy:(Math.random()-.8)*4,l:1,col});}
function say(m,ms){const el=root&&root.querySelector('#cvMsg');if(!el)return;el.innerHTML=m;el.classList.add('show');clearTimeout(msgT);msgT=setTimeout(()=>el.classList.remove('show'),ms||3800);}
function observe(i,c){const cr=CD.CRITTERS.find(x=>x.id===c.id);sfx('critter');metNow.add(c.id); /* critters are looked at, not collected: they stay where they live */
 const first=!S.crit[cr.id];S.crit[cr.id]=(S.crit[cr.id]||0)+1;let rew='';
 if(first){S.dive.cr++;addCoins(20,'critter');S.rp+=4;rew='<div class="cv-rew">+20 🪙 · +4 🔬 New critter in your Journal!</div>';ev('critter',{id:cr.id});}
 card(`<div class="cv-card"><div class="cv-big ${cr.glow?'cv-glowe':''}">${cr.e}</div><h2>${first?'New critter!':'Hello again!'}<br>${esc(cr.n)}</h2>${cr.tiny?'<div class="cv-tag">🔬 Seen through your microscope</div>':''}<p>${txt(cr)}</p>${rew}<button class="cv-btn" data-close>Cool!</button></div>`);save(true);hud();}
function layerCard(L){const t=TIER();setTimeout(()=>sfx('layer'),150);
 card(`<div class="cv-card cv-layer" style="--lc:${L.col}"><div class="cv-big">${L.e}</div><h2>${esc(L.n)}</h2><div class="cv-stats"><span>📏 ${L.r0<=1?'0':depthStr(L.r0)} – ${depthStr(L.r1)} deep</span><span>🌡️ ${L.t0===L.t1?fmt(L.t0):fmt(L.t0)+' – '+fmt(L.t1)} °C</span>${t?`<span>⏲️ ${fmt(rowAtm(L.r0))} atm</span>`:''}</div><p>${txt(L)}</p><button class="cv-btn" data-close>Let's explore!</button></div>`);}

/* ---------------- render ---------------- */
function snapCam(){const w=root.clientWidth,h=root.clientHeight;camX=tcx(w);camY=tcy(h);}
function tcx(w){const ww=COLS*TS;return ww<=w?(ww-w)/2:Math.max(0,Math.min(ww-w,(S.x+.5)*TS-w/2));}
function tcy(h){return Math.max(-TS*3,Math.min(ROWS*TS-h+TS*2,(S.y+.5)*TS-h*.45));}
/* how dark each layer is (0 = daylight). Upper layers are bright & cheerful; deep down your headlamp and glowing crystals light the way */
const DARK={soil:0,sed:.1,cave:.55,river:.62,crystal:.8,granite:.8,magma:.8,mantle:.84};
const LIT=L=>!L||DARK[L.id]<.3;
const GLOWC=['#3ff0ff','#ff4fd8','#ffe44f','#7dff6b','#8f7bff'];
function heroDraw(c,px,py,T,dark){const im=H.player.img;
 if(im&&im.complete&&im.naturalWidth){const h=T*1.25,w=h*.77;c.save();if(FACE[0]<0){c.translate(px,0);c.scale(-1,1);c.translate(-px,0);}c.drawImage(im,px-w/2,py+T*.5-h,w,h);c.restore();}
 else{c.font=`${T*.72}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(H.player.emoji||'🧑‍🚀',px,py+2);}
 if(dark){c.save();c.fillStyle='#fff7b0';c.shadowColor='#fff7b0';c.shadowBlur=12;c.beginPath();c.arc(px+FACE[0]*T*.12,py-T*.55,T*.07,0,7);c.fill();c.restore();}}
function drawCrystal(c,px,py,T,tx,glow){const col=GLOWC[tx%5];c.save();if(glow){c.shadowColor=col;c.shadowBlur=14+4*Math.sin(tick*.06+tx);}c.fillStyle=col;c.globalAlpha=glow?.95:.8;
 [[-.22,.5,-.25],[0,.75,0],[.2,.55,.3]].forEach(([dx,h,a])=>{c.save();c.translate(px+T*(.5+dx),py+T);c.rotate(a);c.beginPath();c.moveTo(-T*.08,0);c.lineTo(-T*.07,-T*h*.7);c.lineTo(0,-T*h);c.lineTo(T*.07,-T*h*.7);c.lineTo(T*.08,0);c.fill();c.restore();});c.restore();}
function frame(){
 raf=requestAnimationFrame(frame);if(!root||!W)return;tick++;
 if(tick%30===0){const was=S.bat<batMax()-.5;charge();hudBat();if(was!==(S.bat<batMax()-.5))hud();}
 const w=root.clientWidth,h=root.clientHeight;camX+=(tcx(w)-camX)*.2;camY+=(tcy(h)-camY)*.2;
 const c=ctx;c.clearRect(0,0,w,h);
 // sky with sun & clouds
 const skyB=-camY+TS;if(skyB>0){const gr=c.createLinearGradient(0,0,0,skyB);gr.addColorStop(0,'#6ec6ff');gr.addColorStop(1,'#c9ecff');c.fillStyle=gr;c.fillRect(0,0,w,skyB);
  c.fillStyle='#ffe066';c.beginPath();c.arc(w-70,skyB-TS*2.6,TS*.7,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.9)';[[.2,2.9],[.55,3.4]].forEach(([fx,fy],k)=>{const cx=((fx*w+tick*.15*(k+1))%(w+160))-80,cy=skyB-TS*fy;c.beginPath();c.ellipse(cx,cy,TS*.9,TS*.3,0,0,7);c.ellipse(cx+TS*.4,cy-TS*.15,TS*.5,TS*.3,0,0,7);c.fill();});}
 c.fillStyle='#120b16';c.fillRect(0,Math.max(0,skyB),w,h);
 const x0=Math.max(0,Math.floor(camX/TS)),x1=Math.min(COLS-1,Math.ceil((camX+w)/TS)),y0=Math.max(0,Math.floor(camY/TS)),y1=Math.min(ROWS-1,Math.ceil((camY+h)/TS));
 const T=TS;const isAir=(x,y)=>{const q=tile(x,y);return q===T_AIR||q===T_SHAFT;};
 for(let y=y0;y<=y1;y++){const L=layerOf(y);for(let x=x0;x<=x1;x++){const i=idx(x,y),t=W.g[i],px=x*T-camX,py=y*T-camY,tx=W.tex[i];
  if(y===0){if(x===0){drawShaft(c,px,py,T,true);}continue;}
  if(t===T_SHAFT){drawShaft(c,px,py,T,false);continue;}
  const airCol=L?shade(L.col,-.62):'#000';
  if(t===T_AIR){const g2=c.createLinearGradient(0,py,0,py+T);g2.addColorStop(0,shade(L?L.col:'#333',-.7));g2.addColorStop(1,airCol);c.fillStyle=g2;c.fillRect(px,py,T+1,T+1);
   if(L&&L.id==='cave'&&tile(x,y-1)<100&&tile(x,y-1)>0&&tx%3===0){c.fillStyle='#d8d2c0';c.beginPath();c.moveTo(px+T*.3,py);c.lineTo(px+T*.5,py+T*(.3+tx%5*.06));c.lineTo(px+T*.7,py);c.fill();}
   if(L&&L.id==='crystal'&&tx%3===0&&!isAir(x,y+1))drawCrystal(c,px,py,T,tx,false);
   continue;}
  if(t===T_WATER){c.fillStyle=S.gates.raft?'#2d8fd8':'#1f6fb9';c.fillRect(px,py,T+1,T+1);c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=2;c.beginPath();const o=(tick*.05+x)%(Math.PI*2);c.moveTo(px,py+T*.4+Math.sin(o)*3);c.quadraticCurveTo(px+T/2,py+T*.2+Math.sin(o+1)*3,px+T,py+T*.4+Math.sin(o+2)*3);c.stroke();
   if(S.gates.raft&&y===54&&x%6===2){c.fillStyle='#b98a52';c.fillRect(px+2,py+T*.55,T*1.8,T*.25);}continue;}
  if(t===T_LAVA){const f=.5+.5*Math.sin(tick*.08+x);c.fillStyle=`rgb(${230+25*f|0},${80+60*f|0},20)`;c.fillRect(px,py,T+1,T+1);continue;}
  if(t===T_BAR||t===T_GATE||t===T_DOOR){c.fillStyle='#3a3142';c.fillRect(px,py,T+1,T+1);c.fillStyle='rgba(255,255,255,.07)';c.fillRect(px+2,py+2,T-4,T*.18);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;c.strokeRect(px+1,py+1,T-2,T-2);
   if(t===T_GATE){const g=GATES[y];const lk=gateNeed(g.id)>medals();if(g.id!=='glow'||uvOn||lk)drawIcon(c,lk?'🔒':g.e,px,py,T,lk?'#ff8787':g.id==='glow'?'#39ff6a':'#ffd43b');}
   if(t===T_DOOR)drawIcon(c,gateNeed('core')>medals()?'🔒':'💠',px,py,T,'#7fb6ff');continue;}
  // rock: rounded where it meets a tunnel, with pebbles
  const rk=rockOf(t);const lit=LIT(L);const base=shade(rk.col,((tx%7)-3)*.025+(lit?.06:0));
  const aU=isAir(x,y-1),aD=isAir(x,y+1),aL=isAir(x-1,y),aR=isAir(x+1,y);const r=T*.32;
  if(aU||aD||aL||aR){c.fillStyle=airCol;c.fillRect(px,py,T+1,T+1);c.fillStyle=base;c.beginPath();
   if(c.roundRect)c.roundRect(px,py,T+1,T+1,[aU&&aL?r:0,aU&&aR?r:0,aD&&aR?r:0,aD&&aL?r:0]);else c.rect(px,py,T+1,T+1);c.fill();}
  else{c.fillStyle=base;c.fillRect(px,py,T+1,T+1);}
  c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(px+T*(.2+(tx%5)*.14),py+T*(.25+((tx>>3)%4)*.15),T*(.09+(tx%3)*.03),T*.07,0,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.13)';c.beginPath();c.ellipse(px+T*(.25+((tx>>2)%5)*.12),py+T*(.2+((tx>>5)%5)*.14),T*.08,T*.055,0,0,7);c.fill();
  if(L&&L.id==='sed'){c.fillStyle='rgba(255,255,255,.08)';c.fillRect(px,py+T*((y%3)/3),T+1,T*.1);}
  if(aU){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(px+(aL?r*.6:0),py,T-(aL?r*.6:0)-(aR?r*.6:0),3);}
  if(aD){c.fillStyle='rgba(0,0,0,.28)';c.fillRect(px+(aL?r*.6:0),py+T-3,T-(aL?r*.6:0)-(aR?r*.6:0),3);}
  if(y===1&&L&&L.id==='soil'){c.fillStyle='#5cc445';c.fillRect(px,py,T+1,T*.14);for(let k=0;k<4;k++){c.beginPath();c.moveTo(px+k*T/4,py+T*.13);c.lineTo(px+k*T/4+T/8,py+T*.24);c.lineTo(px+(k+1)*T/4,py+T*.13);c.fill();}}
 }}
 // items (in the bright upper layers you can see treasures poking out of the dirt; deeper you need your lamp)
 const lr=lampR();const seeR=y=>LIT(layerOf(y))?99:lr+.5;
 W.items.forEach((it,i)=>{const x=i%COLS,y=(i/COLS)|0;if(x<x0-1||x>x1+1||y<y0-1||y>y1+1)return;const px=x*T-camX+T/2,py=y*T-camY+T/2;const dist=Math.hypot(x-S.x,y-S.y);
  const inAir=W.g[i]===T_AIR;const vr=seeR(y);
  if(it.t==='m'){const m=CD.MIN[it.id];const hideNoUV=layerOf(y)&&layerOf(y).id==='crystal'&&m.u;
   if(uvOn&&m.u&&dist<=lr*1.4){drawGem(ctx,px,py,T*.55,m.col,m.sh,m.u);return;}
   if(hideNoUV||dist>vr)return;drawGem(ctx,px,py,inAir?T*.6:T*.5,m.col,m.sh);sparkle(px,py,i);}
  else if(it.t==='$'){if(dist>vr)return;drawCoins(c,px,py,T*(it.ch?.62:.42),it.ch);if(!inAir)sparkle(px,py,i);}
  else if(it.t==='f'){if(dist>vr)return;drawBone(c,px,py,T*(inAir?.6:.5));}
  else if(it.t==='g'){if(dist>lr*2.2)return;c.save();c.shadowColor='#e0b0ff';c.shadowBlur=14;c.font=`${T*.55}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🔮',px,py+Math.sin(tick*.08)*2);c.restore();}
  else if(it.t==='c'){const cr=CD.CRITTERS.find(z=>z.id===it.id);if(dist>vr&&!(cr.glow&&dist<lr*2.5))return;c.save();if(cr.glow){c.shadowColor='#8fffe0';c.shadowBlur=18;}c.font=`${T*(cr.tiny?.45:.62)}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(cr.e,px+Math.sin(tick*.05+i)*T*.12,py+Math.cos(tick*.07+i)*T*.06);c.restore();
   if(cr.tiny){c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2;c.beginPath();c.arc(px,py,T*.36,0,Math.PI*2);c.stroke();}}
 });
 if(skyB>-T){drawCamp(c,T);}
 const ppx=(S.x+.5)*T-camX,ppy=(S.y+.5)*T-camY;
 const PL=layerOf(Math.max(1,S.y));const dk=S.y>0&&PL?DARK[PL.id]:0;
 heroDraw(c,ppx,ppy,T,dk>.3);
 floats=floats.filter(f=>f.l>0);floats.forEach(f=>{f.y-=1.1;f.l-=.018;c.globalAlpha=Math.max(0,Math.min(1,f.l*1.6));c.font=`700 ${f.big?TS*.5:TS*.36}px Fredoka,sans-serif`;c.textAlign='center';c.lineWidth=4;c.strokeStyle='#3a2a00';c.strokeText(f.t,f.x-camX,f.y-camY);c.fillStyle='#ffd43b';c.fillText(f.t,f.x-camX,f.y-camY);});c.globalAlpha=1;
 parts=parts.filter(p=>p.l>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.3;p.l-=.04;c.globalAlpha=Math.max(0,p.l);c.fillStyle=p.col;c.fillRect(p.x-camX-3,p.y-camY-3,6,6);});c.globalAlpha=1;
 // darkness: per-row by layer, cut out by your lamp (+ a beam the way you're facing)
 {const f=fctx;f.globalCompositeOperation='source-over';f.clearRect(0,0,w,h);
  for(let y=Math.max(1,y0);y<=y1;y++){const L=layerOf(y);const a=DARK[L.id];if(a<=0)continue;f.fillStyle=uvOn?`rgba(25,0,45,${Math.max(a,.6)})`:`rgba(6,4,14,${a})`;f.fillRect(0,y*T-camY,w,T+1);}
  if(uvOn&&S.y>0){f.fillStyle='rgba(25,0,45,.6)';f.fillRect(0,Math.max(0,T-camY),w,h);}
  f.globalCompositeOperation='destination-out';const rad=(uvOn?lr*.8:lr)*T;const gr=f.createRadialGradient(ppx,ppy,rad*.35,ppx,ppy,rad);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');f.fillStyle=gr;f.beginPath();f.arc(ppx,ppy,rad,0,Math.PI*2);f.fill();
  if(dk>.3&&!uvOn){const L2=rad*1.9,ang=Math.atan2(FACE[1],FACE[0]);const bx=ppx+Math.cos(ang)*L2,by=ppy+Math.sin(ang)*L2;const g3=f.createLinearGradient(ppx,ppy,bx,by);g3.addColorStop(0,'rgba(0,0,0,.95)');g3.addColorStop(1,'rgba(0,0,0,0)');f.fillStyle=g3;f.beginPath();f.moveTo(ppx,ppy);f.lineTo(bx+Math.cos(ang+Math.PI/2)*rad*.9,by+Math.sin(ang+Math.PI/2)*rad*.9);f.lineTo(bx-Math.cos(ang+Math.PI/2)*rad*.9,by-Math.sin(ang+Math.PI/2)*rad*.9);f.closePath();f.fill();}
  if(fog.width&&fog.height)c.drawImage(fog,0,0,w,h); /* a zero-size canvas (screen not laid out yet) throws */
  // things that glow through the dark: lava, crystals
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y),t=W.g[i];if(t===T_LAVA){const f2=.5+.5*Math.sin(tick*.08+x);c.globalAlpha=.75;c.fillStyle=`rgb(${230+25*f2|0},${80+60*f2|0},20)`;c.fillRect(x*T-camX,y*T-camY,T+1,T+1);c.globalAlpha=1;}
   else if(t===T_AIR&&W.tex[i]%3===0&&!isAir(x,y+1)){const L=layerOf(y);if(L&&(L.id==='crystal'||(L.id==='granite'&&W.tex[i]%9===0)))drawCrystal(c,x*T-camX,y*T-camY,T,W.tex[i],true);}}
  if(S.y>0&&PL&&(PL.id==='magma'||PL.id==='mantle')){c.fillStyle=PL.id==='mantle'?'rgba(255,60,20,.10)':'rgba(255,110,30,.08)';c.fillRect(0,Math.max(0,T-camY),w,h);}
  if(uvOn){W.items.forEach((it,i)=>{if(it.t!=='m')return;const m=CD.MIN[it.id];if(!m.u)return;const x=i%COLS,y=(i/COLS)|0;if(Math.hypot(x-S.x,y-S.y)>lr*1.4)return;drawGem(c,x*T-camX+T/2,y*T-camY+T/2,T*.5,m.col,m.sh,m.u);});
   const gy=Object.keys(GATES).find(r=>GATES[r].id==='glow');const gx=W.gateX[gy];if(W.g[idx(gx,+gy)]===T_GATE&&Math.hypot(gx-S.x,gy-S.y)<lr*3)drawIcon(c,'✨',gx*T-camX,gy*T-camY,T,'#39ff6a');}
  if(dk>.3)heroDraw(c,ppx,ppy,T,true);
 }
 // layer labels down the side (like a science-book diagram)
 CD.LAYERS.forEach(L=>{const yy=L.r0*T-camY;if(yy<-T||yy>h+T)return;c.save();c.setLineDash([6,6]);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke();c.setLineDash([]);
  const km0=L.km0<1?Math.round(L.km0*1000)+' m':L.km0+' km',km1=L.km1<1?Math.round(L.km1*1000)+' m':L.km1+' km';const lab=`${L.e} ${L.n} · ${km0}–${km1}`;
  c.font=`700 ${Math.max(11,T*.27)}px Fredoka,sans-serif`;const tw=c.measureText(lab).width+16;const lx=w-30-tw,ly=yy+6;c.fillStyle='rgba(20,14,40,.72)';c.beginPath();c.roundRect?c.roundRect(lx,ly,tw,T*.42,T*.21):c.rect(lx,ly,tw,T*.42);c.fill();
  c.fillStyle='#fff';c.textAlign='left';c.textBaseline='middle';c.fillText(lab,lx+8,ly+T*.21+1);c.restore();});
}
function drawCoins(c,x,y,s,chest){c.save();if(chest){c.fillStyle='#8a5a2b';c.strokeStyle='#4a2e12';c.lineWidth=2;c.fillRect(x-s*.5,y-s*.2,s,s*.6);c.strokeRect(x-s*.5,y-s*.2,s,s*.6);c.fillStyle='#a8703a';c.beginPath();c.moveTo(x-s*.5,y-s*.2);c.quadraticCurveTo(x,y-s*.7,x+s*.5,y-s*.2);c.fill();c.stroke();c.fillStyle='#ffd43b';c.fillRect(x-s*.08,y-s*.28,s*.16,s*.22);c.shadowColor='#ffd43b';c.shadowBlur=12;c.fillRect(x-s*.4,y-s*.3,s*.8,s*.06);}
 else{[[-.18,.12],[.16,.08],[0,-.12]].forEach(([a,b])=>{c.fillStyle='#ffc83d';c.strokeStyle='#b8860b';c.lineWidth=1.5;c.beginPath();c.ellipse(x+a*s,y+b*s,s*.3,s*.26,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#fff3b0';c.beginPath();c.arc(x+a*s-s*.08,y+b*s-s*.07,s*.06,0,Math.PI*2);c.fill();});}
 c.restore();}
function drawBone(c,x,y,s){c.save();c.translate(x,y);c.rotate(-.5);c.fillStyle='#f3ead2';c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1.5;c.beginPath();c.rect(-s*.35,-s*.09,s*.7,s*.18);[[-.38,-.12],[-.38,.12],[.38,-.12],[.38,.12]].forEach(([a,b])=>{c.moveTo(s*a+s*.13,s*b);c.arc(s*a,s*b,s*.13,0,Math.PI*2);});c.fill();c.stroke();c.restore();}
function sparkle(px,py,i){if((tick+i*7)%60<8){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(px+TS*.18,py-TS*.22,3,3);}}
function drawIcon(c,e,px,py,T,glow){c.save();c.shadowColor=glow;c.shadowBlur=12+6*Math.sin(tick*.1);c.font=`${T*.6}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(e,px+T/2,py+T/2);c.restore();}
function drawShaft(c,px,py,T,top){c.fillStyle='#3a3340';c.fillRect(px,py,T+1,T+1);c.fillStyle='#8a8494';c.fillRect(px+T*.18,py,T*.08,T+1);c.fillRect(px+T*.74,py,T*.08,T+1);
 if(top){c.fillStyle='#ffd43b';c.fillRect(px+T*.25,py+T*.15,T*.5,T*.7);c.font=`${T*.4}px serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🛗',px+T/2,py+T/2);}}
/* camp buildings — tap one to go in (they are the camp's only menu) */
const CAMP=[{x:2,e:'🔋',n:'Power Up',a:'power'},{x:8,e:'🔬',n:'Lab',a:'lab'},{x:10,e:'🛒',n:'Gear',a:'gear'},{x:12,e:'🏛️',n:'Museum',a:'museum'},{x:14,e:'🌱',n:'Garden',a:'garden',show:()=>S.seen.cave},{x:16,e:'📓',n:'Journal',a:'journal'},{x:18,e:'🚀',n:'Core Probe',a:'probe',show:()=>S.gates.core}];
const QZX=6.3; // where Dr. Quartz stands
const campB=()=>CAMP.filter(b=>!b.show||b.show());
function campBadge(b){if(b.a==='lab'){const u=S.pack.filter(p=>p.t!=='f').length;return u?String(u):'';}if(b.a==='museum')return museumReady()?'!':'';if(b.a==='garden')return S.garden&&S.garden.last!==realDay()?'💧':'';if(b.a==='power')return S.bat<batMax()*.25?'!':'';return '';}
function campTap(wx,wy){if(wy<-.55||wy>1.05)return false;
 if(Math.abs(wx-.5)<.6){sfx('tap');act('elev');return true;}
 if(Math.abs(wx-QZX)<.55){sfx('tap');act('tip');return true;}
 const b=campB().find(b=>Math.abs(wx-(b.x+.5))<.75);if(!b)return false;sfx('tap');
 if(b.a==='power'&&S.bat>=batMax()-.5){say('🔋 Your battery is full — go dig!',1800);return true;}
 act(b.a);return true;}
function drawCamp(c,T){const gy=T-camY;c.fillStyle='#4caf50';c.fillRect(-camX,gy-5,COLS*T,9);
 const gi=H.guideImg;if(gi&&gi.complete&&gi.naturalWidth){const gx=QZX*T-camX,hh=T*1.15;c.drawImage(gi,gx-hh*.33,gy-hh-2+Math.sin(tick*.05)*1.5,hh*.66,hh);}
 const lab=(txt,px,col)=>{c.font=`700 ${Math.max(11,T*.26)}px Fredoka,sans-serif`;c.textAlign='center';c.textBaseline='top';const w=c.measureText(txt).width+12,h=Math.max(15,T*.34),y=gy-T*1.2;px=Math.max(px,w/2+3);c.fillStyle='rgba(255,255,255,.85)';c.beginPath();if(c.roundRect)c.roundRect(px-w/2,y-2,w,h,h/2);else c.rect(px-w/2,y-2,w,h);c.fill();c.fillStyle=col||'#1d3a5a';c.fillText(txt,px,y);};
 lab('Elevator',.5*T-camX);lab('Dr. Quartz',QZX*T-camX,'#1971c2');
 campB().forEach(b=>{const px=(b.x+.5)*T-camX;const bob=b.a==='power'&&S.bat<batMax()*.25?Math.abs(Math.sin(tick*.12))*4:0;c.font=`${T*.8}px serif`;c.textAlign='center';c.textBaseline='bottom';c.fillText(b.e,px,gy-2-bob);
  lab(b.n,px);const bd=campBadge(b);if(bd){const r=Math.max(8,T*.17),bx=px+T*.32,by=gy-T*.82;c.fillStyle='#fa5252';c.beginPath();c.arc(bx,by,r,0,7);c.fill();c.fillStyle='#fff';c.font=`800 ${r*1.3}px Fredoka,sans-serif`;c.textBaseline='middle';c.fillText(bd,bx,by+1);}});}
function shade(hex,amt){let n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;const f=amt<0?0:255,p=Math.abs(amt);r=Math.round((f-r)*p+r);g=Math.round((f-g)*p+g);b=Math.round((f-b)*p+b);return`rgb(${r},${g},${b})`;}

/* ---------------- HUD ---------------- */
function hud(){if(!root)return;const q=s=>root.querySelector(s);const L=layerOf(S.y);
 q('#cvLayer').innerHTML=S.y===0?'🏕️ Base Camp':`${L.e} ${esc(L.n)}`;
 q('#cvCoins').textContent='🪙 '+fmt(H.coins());q('#cvRP').textContent='🔬 '+fmt(S.rp);q('#cvPack').textContent=`🎒 ${S.pack.length}/${packMax()}`;
 const t=rowTemp(S.y),hotw=S.y>0&&t>suit().t*.85;
 q('#cvG').innerHTML=`<span>📏 ${S.y===0?'Surface':depthStr(S.y)}</span><span class="${hotw?'warn':''}">🌡️ ${fmt(t)} °C</span>${TIER()?`<span>⏲️ ${fmt(rowAtm(S.y))} atm</span>`:''}`;
 hudBat();
 if(S.y===0&&!S.tapHint&&!hintShown&&!modalOpen()){hintShown=1;setTimeout(()=>{if(S.y===0&&!modalOpen())say('👆 Tap a building — like the 🔬 Lab — to go inside!',5500);},600);}
 // depth bar
 let db='';CD.LAYERS.forEach(L=>{db+=`<i style="flex:${L.r1-L.r0+1};background:${L.col}" title="${esc(L.n)}"></i>`;});
 const pct=r=>(r/ROWS*100).toFixed(2)+'%';
 db+=`<b class="me" style="top:${pct(S.y)}"></b><b class="max" style="top:${pct(S.maxRow)}"></b>`;
 if(W.pocket&&W.items.has(idx(W.pocket.x,W.pocket.y)))db+=`<b class="pk" style="top:${pct(W.pocket.y)}">✨</b>`;
 const fl={};W.items.forEach((it,i)=>{if(it.t!=='f')return;const L=layerOf((i/COLS)|0);if(L&&S.seen[L.id]&&!fl[L.id])fl[L.id]=(L.r0+L.r1)/2;});Object.values(fl).forEach(r=>db+=`<b class="pk fo" style="top:${pct(r)}" title="Fossil pieces hidden in this layer today">🦴</b>`);
 db+=`<b class="pk" style="top:99%" title="${S.core&&S.core.v?'The Core Keeper':'Something is down there…'}">${S.core&&S.core.v?'🌕':'❓'}</b>`; /* below the last layer: the mystery Dr. Quartz keeps hearing */
 q('#cvDepth').innerHTML=db;
 // action buttons
 let a='';
 if(S.y===0&&false){const unk=S.pack.filter(p=>p.t!=='f').length;
  if(S.bat<batMax()-.5)a+=`<button class="cv-act pw" data-a="power">⚡<span>Power Up</span></button>`;
  a+=`<button class="cv-act qz" data-a="tip">💡<span>Dr. Quartz</span></button><button class="cv-act" data-a="lab">🔬<span>Lab</span>${unk?`<em>${unk}</em>`:''}</button><button class="cv-act" data-a="gear">🛒<span>Gear</span></button><button class="cv-act" data-a="museum">🏛️<span>Museum</span>${museumReady()?'<em>!</em>':''}</button>`;
  if(S.seen.cave)a+=`<button class="cv-act" data-a="garden">🌱<span>Garden</span>${S.garden&&S.garden.last!==realDay()?'<em>💧</em>':''}</button>`;
  a+=`<button class="cv-act" data-a="journal">📓<span>Journal</span></button><button class="cv-act" data-a="elev">🛗<span>Elevator</span></button>`;
  if(S.gates.core)a+=`<button class="cv-act" data-a="probe">🚀<span>Core Probe</span></button>`;
 }else if(S.y>0){a+=`<button class="cv-act" data-a="home">🏠<span>Camp</span></button>`;if(S.gear.uv)a+=`<button class="cv-act ${uvOn?'on':''}" data-a="uv">🔦<span>UV ${uvOn?'on':'off'}</span></button>`;}
 const acts=q('#cvActs');if(acts.dataset.h!==a){acts.innerHTML=a;acts.dataset.h=a;acts.querySelectorAll('button').forEach(b=>b.onclick=()=>act(b.dataset.a));}
}
function hudBat(){if(!root)return;const q=s=>root.querySelector(s);const bm=batMax();q('#cvBatI').style.width=(S.bat/bm*100)+'%';q('#cvBatI').className=S.bat/bm<.25?'low':'';const f=S.y===0&&S.bat<bm?fullIn():'';q('#cvBatT').textContent=`${f?'🔌':'🔋'} ${Math.floor(S.bat)}/${bm}${f?' · '+f:''}`;q('#cvBatT').parentNode.title=f?'Charging — full in '+f:'Battery';}
function act(a){if(S.y===0&&!S.tapHint){S.tapHint=1;save();}({tip:()=>tipCard(),power:openPower,lab:openLab,gear:openGear,museum:openMuseum,garden:openGarden,journal:openJournal,elev:openElevator,probe:openProbe,home:()=>beamHome(),uv:()=>{uvOn=!uvOn;sfx('uvon');hud();say(uvOn?'🔦 UV lamp ON — fluorescent minerals glow! (Your normal light is dimmer.)':'🔦 UV lamp off.',2200);}})[a]();}

/* gates deeper down stay sealed until you have enough Boss Medals from Math Quest */
function lockCard(g){const n=gateNeed(g.id),m=medals();
 modal(`<div class="cv-card"><div class="cv-big">🔒</div><h2>${g.e} ${esc(g.n)} is sealed!</h2>${guide(`This rock is too tough for my drill right now. Every <b>🏅 Boss Medal</b> you win in Math Quest powers it up.<br>You have <b>${m}</b> — you need <b>${n}</b>. Beat more bosses (and replay worlds on harder rounds) and come back!`)}
 <div class="cv-meter ok"><i style="width:${Math.min(100,m/n*100)}%"></i></div><p class="cv-sub" style="text-align:center">🏅 ${m} / ${n}</p><button class="cv-btn" data-close>OK!</button></div>`);}
/* Dr. Quartz's best suggestion for right now */
function tipText(){const unk=S.pack.filter(p=>p.t==='m'||p.t==='g');
 if(unk.length)return {t:`You have <b>${unk.length} mystery specimen${unk.length>1?'s':''}</b> in your backpack. Let's study ${unk.length>1?'them':'it'} in the 🔬 Lab — I'll help!`,a:'lab'};
 if(museumReady())return {t:'You found enough fossil pieces to build a skeleton! Head to the 🏛️ Museum.',a:'museum'};
 const deep=S.maxRow||0;const nextG=Object.keys(GATES).map(Number).find(r=>r>deep&&!S.gates[GATES[r].id]);
 if(nextG&&gateNeed(GATES[nextG].id)>medals()&&deep>=nextG-6)return {t:`The ${GATES[nextG].e} ${GATES[nextG].n} ahead needs <b>${gateNeed(GATES[nextG].id)} 🏅 Boss Medals</b> (you have ${medals()}). Beat bosses in Math Quest to power up my drill!`};
 const nxtL=CD.LAYERS.find(L=>L.r0>deep);const L=layerOf(Math.max(1,deep+1))||CD.LAYERS[0];
 const hardRock=L.rock.map(r=>CD.ROCKS[r]).find(r=>r.h>drill().h);const nd=CD.DRILLS[S.gear.drill+1];
 if(hardRock&&nd)return {t:`${hardRock.n} is too hard for your ${drill().n}. A <b>${nd.e||'⛏️'} ${nd.n}</b> in the 🛒 Gear shop can dig it (🪙 ${fmt(nd.c)}).`,a:'gear'};
 const hot=rowTemp(Math.min(ROWS-1,deep+8))>suit().t;const ns=CD.SUITS[S.gear.suit+1];
 if(hot&&ns)return {t:`It gets <b>hot</b> down there! A ${ns.n} from the 🛒 Gear shop keeps you safe up to ${fmt(ns.t)} °C.`,a:'gear'};
 if(S.bat<batMax()*.3&&(!MQ()||powerLeft()>0))return {t:'Your battery is low. Tap <b>⚡ Power Up</b> — every right math answer adds charge!',a:'power'};
 if(S.pack.length>=packMax()-1)return {t:'Your backpack is nearly full. A bigger 🎒 backpack from the Gear shop lets you carry more finds.',a:'gear'};
 return {t:nxtL?`Dig down toward the <b>${nxtL.e} ${esc(nxtL.n)}</b>! Look for sparkly 💎 minerals, 🦴 fossil pieces and 🧰 buried chests. Tap the 🛗 Elevator to skip to layers you've already reached.`:'You have been everywhere! Try finding every mineral for your 📓 Journal.'};}
function tipCard(){const t=tipText();modal(`<div class="cv-card">${guide(t.t)}<div class="cv-row">${t.a?`<button class="cv-btn" id="cvTipGo">${({lab:'🔬 Go to the Lab',museum:'🏛️ Museum',gear:'🛒 Gear shop',power:'⚡ Power Up'})[t.a]}</button>`:''}<button class="cv-btn ghost" data-close>Thanks!</button></div></div>`);
 const b=root.querySelector('#cvTipGo');if(b)b.onclick=()=>{closeModal();act(t.a);};}
/* ---------------- modal ---------------- */
let hintShown=0;
function modalOpen(){return root&&root.querySelector('#cvMod').classList.contains('show');}
function modal(html,opts){const m=root.querySelector('#cvMod');m.innerHTML=`<div class="cv-sheet ${opts&&opts.wide?'wide':''}">${opts&&opts.noX?'':'<button class="cv-mx" data-close aria-label="Close">✕</button>'}${html}</div>`;m.classList.add('show');
 m.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal());m.scrollTop=0;return m.querySelector('.cv-sheet');}
function closeModal(){const m=root.querySelector('#cvMod');m.classList.remove('show');m.innerHTML='';if(onClose){const f=onClose;onClose=null;f();}if(!modalOpen()&&cardQ.length)modal(cardQ.shift());hud();}
let onClose=null,cardQ=[];
/* info cards wait their turn instead of replacing whatever is on screen */
function card(html){if(modalOpen())cardQ.push(html);else modal(html);}

/* ---------------- Field Lab ---------------- */
const STREAK_NAMES={'#2f3a2a':'greenish-black','#5a5f66':'lead grey','#ffffff':'white','#2f4f2a':'greenish-black','#8fe3a9':'light green','#8ec5ff':'light blue','#1b1b1b':'black','#8b2a1e':'red-brown','#e8b923':'golden yellow','#7d848c':'lead grey','#fff59a':'pale yellow'};
const UV_NAMES={'#ff5a3d':'orange-red','#5cc8ff':'bright blue','#39ff6a':'bright green','#ff2a2a':'red','#7fb6ff':'pale blue'};
const LTESTS=[{id:'hard',e:'💅',n:'Scratch test',q:'How hard is it?'},{id:'streak',e:'⬜',n:'Streak test',q:'What color is its powder?'},{id:'acid',e:'🧪',n:'Vinegar drop',q:'Does it fizz?'},{id:'magnet',e:'🧲',n:'Magnet',q:'Does it stick?'},{id:'water',e:'💧',n:'Water drop',q:'Does it dissolve?'},{id:'uv',e:'🔦',n:'UV lamp',q:'Does it glow?',uv:1},{id:'break',e:'🔨',n:'Hammer tap',q:'How does it break?'},{id:'look',e:'🔍',n:'Look closely',q:'What shape? How shiny?'}];
const hardBand=h=>{const i=CD.TOOLS.findIndex(t=>h<=t.h);return i<0?4:i;};
const HB_WORD=['very soft','soft','medium','hard','super hard'],HB_NUM=['2.5 or less','2.5 – 3.5','3.5 – 5.5','5.5 – 7','more than 7'];
const brOf=id=>CD.BREAKS.find(b=>b.id===id)||CD.BREAKS[2];
function tval(m,t){return t==='hard'?hardBand(m.h):t==='streak'?(m.s||'none'):t==='acid'?!!m.f:t==='magnet'?!!m.m:t==='water'?!!m.w:t==='uv'?(m.u||''):t==='break'?(m.br||'chips'):m.look;}
function shortV(m,t){const n=TIER();
 if(t==='hard')return HB_WORD[hardBand(m.h)]+(n?` (${m.h})`:'');
 if(t==='streak')return m.s?`${sw(m.s)} ${STREAK_NAMES[m.s]}`:'no streak';
 if(t==='acid')return m.f?'🫧 fizzes':'no fizz';if(t==='magnet')return m.m?'🧲 sticks':'no pull';if(t==='water')return m.w?'💧 dissolves':'no';
 if(t==='uv')return m.u?`${sw(m.u)} glows ${UV_NAMES[m.u]}`:'no glow';if(t==='break')return '🔨 '+brOf(m.br).n.toLowerCase();return esc(m.look);}
function resText(m,t){const n=TIER();
 if(t==='hard'){const b=hardBand(m.h);const tl=CD.TOOLS;const msg=b===0?`Your ${tl[0].e} fingernail scratches it!`:b===4?'Nothing scratches it — not even the 🔺 quartz point!':`The ${tl[b].e} ${tl[b].n.toLowerCase()} scratches it, but the ${tl[b-1].e} ${tl[b-1].n.toLowerCase()} doesn't.`;return `${msg} <b>It's ${HB_WORD[b]}${n?` (hardness ${HB_NUM[b]})`:''}.</b>`;}
 if(t==='streak')return m.s?`Rubbed on the white tile it leaves a ${sw(m.s)} <b>${STREAK_NAMES[m.s]}</b> streak.`:`<b>No streak</b> — it's so hard it scratched the tile instead!`;
 if(t==='acid')return m.f?`<b>Fizz!</b> 🫧 Bubbles of carbon dioxide gas.`:'A drop of vinegar… <b>nothing happens.</b>';
 if(t==='magnet')return m.m?'<b>SNAP!</b> 🧲 It sticks to the magnet.':'The magnet <b>doesn\'t pull</b> on it at all.';
 if(t==='water')return m.w?'<b>It dissolved!</b> 💧 It disappeared into the water.':'In water it <b>stays the same.</b>';
 if(t==='uv')return m.u?`Under UV light it <b>glows</b> ${sw(m.u)} ${UV_NAMES[m.u]}!`:'Under UV light: <b>no glow.</b>';
 if(t==='break')return `Tapped with the hammer, it <b>${brOf(m.br).r}</b>.`;
 return `Up close it looks: <b>${esc(m.look)}</b>.`;}
const sw=c=>`<i class="cv-sw" style="background:${c}"></i>`;
function testsOf(p){const o={};Object.keys(p.tests||{}).forEach(k=>{if(k.startsWith('scratch:'))o.hard=1;else if(LTESTS.some(t=>t.id===k))o[k]=1;});return Object.keys(o);}
function crackGeode(i){const p=S.pack[i];const g=CD.GEODES.find(x=>x.id===p.id);S.pack.splice(i,1);sfx('geode');const first=!S.geo[g.id];S.geo[g.id]=(S.geo[g.id]||0)+1;addCoins(g.c,'geode');S.rp+=first?8:2;save(true);
 modal(`<div class="cv-card"><div class="cv-geode" style="--gc:${g.col}"><i></i></div><h2>🔨 Crack! ${esc(g.n)}</h2><p>${esc(g.y)}</p><p class="cv-sub">A geode starts as a hollow bubble in rock. Mineral-rich water seeps in and, over thousands of years, crystals grow inward from the walls.</p><div class="cv-rew">+${g.c} 🪙 · +${first?8:2} 🔬</div><button class="cv-btn" data-close>Beautiful!</button></div>`);onClose=openLab;ev('geode',{id:g.id});}
/* suspects are chosen so a real test can always tell them apart (no "what does it look like?" guessing) */
const sig=id=>['magnet','acid','water','streak','hard','break'].concat(S.gear.uv?['uv']:[]).map(t=>JSON.stringify(tval(CD.MIN[id],t))).join('|');
function candidates(p){if(p.cands&&p.cands.includes(p.id))return p.cands;const seen=CD.LAYERS.filter(L=>S.seen[L.id]).map(L=>L.id);const n=[3,4,6][TIER()];
 const R=rng(hash(p.k));let pool=Object.keys(CD.MIN).filter(id=>id!==p.id&&CD.MIN[id].L.some(l=>seen.includes(l)));
 if(pool.length<n-1)pool=Object.keys(CD.MIN).filter(id=>id!==p.id);
 const pick2=src=>{const out=[p.id],sg=new Set([sig(p.id)]);shuffle(R,src).forEach(id=>{if(out.length<n&&!sg.has(sig(id))){out.push(id);sg.add(sig(id));}});return out;};
 let c=pick2(pool);if(c.length<n)c=pick2(Object.keys(CD.MIN).filter(id=>id!==p.id));
 p.cands=shuffle(R,c);return p.cands;}
function alive(p){const m=CD.MIN[p.id],done=testsOf(p);return candidates(p).filter(c=>!(p.wrong||[]).includes(c)&&done.every(t=>tval(CD.MIN[c],t)===tval(m,t)));}
/* ---------------- Field Lab: the Mystery Key ----------------
   One question at a time. Each test shows a picture of what happens; you read the result and pick the answer.
   The path of answers leads to the mineral. Dr. Quartz explains each test and helps if you misread a result. */
const KQ={magnet:'🧲 Does it stick to a magnet?',acid:'🧪 Does it fizz when a drop of vinegar (acid) touches it?',water:'💧 Does it dissolve in water?',
 streak:'⬜ What color is its powder on the streak tile?',hard:'💅 How hard is it? Which tools scratch it?',uv:'🔦 Does it glow under UV light?',look:'🔍 What does it look like up close?',break:'🔨 How does it break when you tap it with a hammer?'};
const KHINT={magnet:'Minerals with lots of <b>iron</b> in them are pulled by a magnet. Let\'s hold one close!',
 acid:'Vinegar is a weak <b>acid</b>. Minerals made with <b>carbonate</b> (like the stuff in seashells) fizz when it touches them. The bubbles are carbon dioxide gas!',
 water:'A few minerals are made of salt and <b>dissolve</b> in water. Let\'s drop it in a glass!',
 streak:'The color of a mineral can fool you, but its <b>powder</b> never lies. Rub it on the white tile!',
 hard:'Scratch it with different tools. The <b>softest tool that leaves a scratch</b> tells us how hard it is.',
 uv:'Some minerals <b>glow</b> in ultraviolet light — that\'s called fluorescence. Lights off, UV on!',
 look:'Scientists also look closely at a mineral\'s <b>shape and shine</b>. What do you notice?',
 break:'Every mineral breaks its own way. Some split along <b>flat</b> surfaces, some chip like glass, some crumble, and a few just bend. Let\'s tap a small piece!'};
const KBTN={magnet:'🧲 Hold the magnet close',acid:'🧪 Add a drop of vinegar',water:'💧 Drop it in water',streak:'⬜ Rub it on the tile',hard:'💅 Try the scratch tools',uv:'🔦 Turn on the UV lamp',look:'🔍 Look closely',break:'🔨 Tap it with the hammer'};
const BIN=['magnet','acid','water'];
function keyTests(){return ['magnet','acid','water','streak','hard','break'].concat(S.gear.uv?['uv']:[]);}
/* every test always shows ALL its possible answers (not just the ones our suspects could give) */
function kOpts(t,C){if(BIN.includes(t))return [true,false];
 if(t==='hard')return [0,1,2,3,4];
 if(t==='break')return CD.BREAKS.map(b=>b.id);
 const all=[...new Set(Object.keys(CD.MIN).map(id=>JSON.stringify(tval(CD.MIN[id],t))))].map(v=>JSON.parse(v));
 if(t==='uv')return all.sort((a,b)=>(a?1:0)-(b?1:0));
 if(t==='streak'){const nm=v=>v==='none'?'zzz':(STREAK_NAMES[v]||v);return all.filter((v,i,a)=>a.findIndex(x=>nm(x)===nm(v))===i).sort((a,b)=>nm(a).localeCompare(nm(b)));}
 return all;}
function kLabel(t,v){
 if(t==='magnet')return v?'Yes — it sticks!':'No — it doesn\'t stick';
 if(t==='acid')return v?'Yes — it fizzes!':'No fizz';
 if(t==='water')return v?'Yes — it dissolves!':'No — it stays the same';
 if(t==='streak')return v==='none'?'No powder (it scratched the tile!)':`${sw(v)} ${STREAK_NAMES[v]}`;
 if(t==='hard')return `${HB_OPT[v]} <small>${HB_WORD[v]}</small>`;
 if(t==='uv')return v?`${sw(v)} glows ${UV_NAMES[v]}`:'No glow';
 if(t==='break')return brOf(v).n;
 return esc(v);}
/* the best next question: splits the suspects most evenly (yes/no questions win ties — easier for young detectives) */
function kNext(p,C){const used=(p.path||[]).map(s=>s.t);let best=null;
 keyTests().filter(t=>!used.includes(t)).forEach(t=>{const g={};C.forEach(c=>{const v=JSON.stringify(tval(CD.MIN[c],t));g[v]=(g[v]||0)+1;});const n=Object.keys(g).length;if(n<2)return;
  const sc=Math.max(...Object.values(g))*10-(BIN.includes(t)?1:0)+(t==='uv'?2:0);if(!best||sc<best.sc)best={t,sc};});
 return best?best.t:(used.includes('look')?null:'look');}
function kAlive(p){const cs=candidates(p);return cs.filter(c=>(p.path||[]).every(st=>st.t==='look'||JSON.stringify(tval(CD.MIN[c],st.t))===JSON.stringify(st.v)));}
/* the order a geologist uses: look first, then streak, then hardness, then the special tests */
function sciOrder(){return ['look','streak','hard','break','magnet','acid','water'].concat(S.gear.uv?['uv']:[]);}
/* a plain grey "mystery rock" so the picture never gives the answer away (the real mineral is shown once it's identified) */
function rockSVG(k,size,tint){size=size||64;const R=rng(hash('rock|'+k));const n=9,pts=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=14+R()*6;pts.push([22+Math.cos(a)*r,23+Math.sin(a)*r*.82]);}
 const d='M'+pts.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L')+'Z';const f=tint||'#8a8f98';
 return `<svg width="${size}" height="${size}" viewBox="0 0 44 44"><path d="${d}" fill="${f}" stroke="#495057" stroke-width="1.6" stroke-linejoin="round"/>${[0,1,2,3].map(()=>`<circle cx="${(12+R()*20).toFixed(1)}" cy="${(14+R()*16).toFixed(1)}" r="${(1+R()*1.4).toFixed(1)}" fill="#fff" opacity=".35"/>`).join('')}<path d="M14 16 q4 -4 10 -3" stroke="#fff" stroke-width="2" opacity=".45" fill="none" stroke-linecap="round"/>${tint?'':'<text x="22" y="28" font-size="13" font-weight="800" text-anchor="middle" fill="#fff" opacity=".85">?</text>'}</svg>`;}
/* pictures of each test: they show what happens (with motion) and never print the answer */
function kPic(m,t,p){const G=rockSVG(p.k,64);const W2=250,H2=150;
 if(t==='magnet'){const st=!!m.m;return `<svg viewBox="0 0 ${W2} ${H2}" class="cv-kp"><rect x="0" y="120" width="250" height="30" fill="#c7a178"/>
  <g class="cv-mag"><g transform="translate(125 0)"><path d="M-34 0 L-34 40 A34 34 0 0 0 34 40 L34 0 L18 0 L18 40 A18 18 0 0 1 -18 40 L-18 0Z" fill="#e03131"/><rect x="-34" y="0" width="16" height="12" fill="#dee2e6"/><rect x="18" y="0" width="16" height="12" fill="#dee2e6"/></g></g>
  <g class="${st?'cv-jump':'cv-sit'}"><g transform="translate(93 58)">${G}</g></g></svg>`;}
 if(t==='acid'){const f=!!m.f;let b='';if(f)for(let i=0;i<12;i++)b+=`<circle cx="${92+((i*23)%66)}" cy="${86-(i%4)*14}" r="${3+i%3*2}" fill="none" stroke="#74c0fc" stroke-width="2.5" class="cv-bub" style="animation-delay:${(i*.13).toFixed(2)}s"/>`;
  return `<svg viewBox="0 0 ${W2} ${H2}" class="cv-kp"><rect x="0" y="120" width="250" height="30" fill="#c7a178"/><g transform="translate(93 60)">${G}</g>
  <g transform="translate(125 4)"><rect x="-6" y="0" width="12" height="30" rx="3" fill="#ced4da"/><path d="M-10 -6 h20 v8 h-20z" fill="#495057"/><path d="M-3 30 L3 30 L0 42Z" fill="#adb5bd"/><circle class="cv-drop" cx="0" cy="50" r="4" fill="#a5d8ff"/></g>${b}</svg>`;}
 if(t==='water'){const w=!!m.w;return `<svg viewBox="0 0 ${W2} ${H2}" class="cv-kp"><path d="M70 20 L80 140 L170 140 L180 20Z" fill="#e7f5ff" stroke="#74c0fc" stroke-width="4"/><rect x="74" y="55" width="102" height="83" fill="#a5d8ff" opacity=".7"/>
  <g transform="translate(93 72)"><g class="${w?'cv-melt':''}">${G}</g></g></svg>`;}
 if(t==='streak'){const c=m.s;return `<svg viewBox="0 0 ${W2} ${H2}" class="cv-kp"><rect x="30" y="30" width="190" height="95" rx="6" fill="#fdfdfd" stroke="#ced4da" stroke-width="4"/>
  ${c?`<path d="M55 90 Q100 55 150 80 Q180 92 200 70" stroke="${c==='#ffffff'?'#b8bec6':c}" stroke-width="19" stroke-linecap="round" fill="none"/>${c==='#ffffff'?'<path d="M55 90 Q100 55 150 80 Q180 92 200 70" stroke="#ffffff" stroke-width="15" stroke-linecap="round" fill="none"/>':''}`:'<path d="M60 60 L200 95 M70 90 L190 55" stroke="#adb5bd" stroke-width="2"/>'}
  <text x="125" y="20" font-size="14" text-anchor="middle" fill="#555">white streak tile</text></svg>`;}
 if(t==='break'){const c='#8a8f98',k='#495057',b=m.br||'chips';let pcs='';
  if(b==='sheets')pcs=[0,1,2,3,4].map(i=>`<path d="M${70+i*8} ${96-i*9} l96 -10 l14 6 l-96 10Z" fill="${i%2?'#a3a8b0':c}" stroke="${k}" stroke-width="1.5"/>`).join('');
  else if(b==='blocks')pcs=[[70,84,30],[108,92,24],[140,78,34],[150,116,18],[88,116,16]].map(([x,y,s])=>`<path d="M${x} ${y} l${s} -4 l4 ${s*.8} l-${s} 4Z" fill="${c}" stroke="${k}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${x+3} ${y+2} l${s*.5} -1" stroke="#fff" stroke-width="2" opacity=".5"/>`).join('');
  else if(b==='chips')pcs=[[72,96,1],[112,84,-1],[146,100,1],[98,116,-1],[168,116,1]].map(([x,y,f])=>`<path d="M${x} ${y} q${14*f} -22 30 -14 q8 12 -6 20 q-14 6 -24 -6Z" fill="${c}" stroke="${k}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${x+8} ${y-4} q8 -8 14 -2" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/>`).join('');
  else if(b==='crumbs'){for(let i=0;i<40;i++){const x=72+((i*29)%106),hill=Math.max(0,26-Math.abs(125-x)*.5);pcs+=`<circle cx="${x}" cy="${(117-((i*17)%Math.max(3,Math.round(hill)))).toFixed(0)}" r="${(2.2+i%3*1.3).toFixed(1)}" fill="${i%2?'#a3a8b0':c}" stroke="${k}" stroke-width="1"/>`;}}
  else pcs=`<path d="M70 118 Q72 86 104 84 Q118 98 132 84 Q170 84 178 118Z" fill="${c}" stroke="${k}" stroke-width="2"/><path d="M106 88 q12 12 24 0" stroke="${k}" stroke-width="2" fill="none"/>`;
  return `<svg viewBox="0 0 ${W2} ${H2}" class="cv-kp"><rect x="0" y="120" width="250" height="30" fill="#c7a178"/>${pcs}
  <g transform="translate(196 34) rotate(28)"><rect x="-4" y="0" width="8" height="52" rx="3" fill="#8a5a2b"/><rect x="-20" y="-12" width="40" height="16" rx="3" fill="#495057"/></g></svg>`;}
 if(t==='uv'){return `<svg viewBox="0 0 ${W2} ${H2}" class="cv-kp"><rect width="250" height="150" rx="10" fill="#1a1033"/><g transform="translate(93 50)" style="${m.u?`filter:drop-shadow(0 0 14px ${m.u}) drop-shadow(0 0 6px ${m.u})`:'filter:brightness(.35)'}">${m.u?rockSVG(p.k,64,m.u):G}</g><text x="125" y="30" font-size="14" text-anchor="middle" fill="#b197fc">🔦 UV light on</text></svg>`;}
 return `<div class="cv-klook">${gemSVG(m,90)}<div>${esc(m.look)}</div></div>`;}
/* scratch test: the kid tries the tools one at a time (softest first is the smart way) */
function scratchTray(p,m){const b=hardBand(m.h),sc=p.scr||{};
 return `<div class="cv-kh">${CD.TOOLS.map((tl,i)=>{const r=sc[i];return `<button class="cv-tool ${r==null?'':r?'y':'n'}" data-tool="${i}" ${r!=null?'disabled':''}><span>${tl.e}</span><b>${tl.n}</b><em>${r==null?'tap to try':r?'✓ scratch!':'✗ no mark'}</em></button>`;}).join('')}</div>`;}
function scratchKnown(p){const sc=p.scr||{};for(let i=0;i<4;i++){if(sc[i]===true&&(i===0||sc[i-1]===false))return true;}return sc[3]===false;}
/* the answers are "the FIRST tool that scratches it", so only one answer is ever true */
const HB_OPT=['Your fingernail scratches it','Fingernail can\'t, but the copper coin can','Coin can\'t, but the steel nail can','Only the quartz point scratches it','Nothing scratches it'];
function speak(t){return;try{if(!window.speechSynthesis||!sndOK())return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g,'').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]/gu,'').replace(/—/g,','));u.lang='en-US';u.rate=.9;try{u.volume=Math.min(1,Math.max(.25,window.fxLevel?fxLevel():1));}catch(e){}speechSynthesis.speak(u);}catch(e){}}
function splits(t,C){return new Set(C.map(c=>JSON.stringify(tval(CD.MIN[c],t)))).size>1;}
const TNAME={look:'🔍 Look closely',magnet:'🧲 Magnet',acid:'🧪 Vinegar drop',water:'💧 Water',streak:'⬜ Streak tile',hard:'💅 Scratch tools',uv:'🔦 UV lamp',break:'🔨 Hammer tap'};
function openLab(){
 const list=S.pack.filter(p=>p.t!=='f');
 const cards=list.map(p=>p.t==='g'?`<button class="cv-spec" data-k="g:${S.pack.indexOf(p)}"><span class="cv-big2">🔮</span><b>Geode</b><small>Crack it open!</small></button>`
  :`<button class="cv-spec" data-k="${p.k}">${rockSVG(p.k,54)}<b>${p.map?'🪨 Rock you brought':'Specimen #'+(S.pack.indexOf(p)+1)}</b><small>${(p.path||[]).length?(p.path.length+' step'+(p.path.length>1?'s':'')+' done'):'Not tested yet'}</small></button>`).join('');
 modal(`<h2>🔬 Field Lab</h2>${guide(list.length?'Pick a specimen and we\'ll figure out what it is together — one test at a time!':'No specimens to study right now. Dig down and look for sparkly 💎 minerals!')}${list.length?`<div class="cv-specs">${cards}</div>`:''}`,{wide:1});
 root.querySelectorAll('.cv-spec').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k.startsWith('g:'))crackGeode(+k.slice(2));else bench(k);});
}
function bench(k,st){
 const p=S.pack.find(x=>x.k===k);if(!p)return openLab();const m=CD.MIN[p.id];p.path=p.path||[];p.miss=p.miss||0;p.scr=p.scr||{};st=st||{};
 /* every specimen gets every test: the answer only comes once the whole set is in the notebook, even if one suspect is left sooner */
 const C=kAlive(p),used=p.path.map(s=>s.t);
 /* once every test is in the notebook: a mineral found 3+ times is a challenge ("do you know which one it is?") before the answer */
 if(!C.length||sciOrder().every(x=>used.includes(x)))return (C.length&&!p.qk&&S.idd[p.id]&&(S.found[p.id]||0)>=3)?quickID(p):kReveal(p);
 const young=TIER()===0;
 // young detectives get the next test chosen for them; older ones pick the tool themselves
 const nextSci=sciOrder().find(x=>!used.includes(x));
 let t=st.t||p.cur||(young?nextSci:null); /* young detectives follow the scientist's order automatically; older ones may pick any test */
 if(!t&&!nextSci)t='look';
 const trail=p.path.map((s,i)=>`<div class="cv-kstep done"><span class="cv-kn">${i+1}</span><div><div class="cv-kq">${KQ[s.t]}</div><div class="cv-ka">✓ ${kLabel(s.t,s.v)}</div></div></div>`).join('');
 const tested=t&&(t==='hard'?scratchKnown(p):!!st.tested);
 const opts=t?kOpts(t,C):[];
 let body,say;
 if(!t){const tools=keyTests().filter(x=>!used.includes(x));
  const todo=sciOrder().filter(x=>!used.includes(x));
  body=`<div class="cv-kq">🧰 Which test next? <small class="cv-korder">Scientists go: 🔍 look → ⬜ streak → 💅 scratch → 🧲 🧪 💧 special tests</small></div><div class="cv-tray">${todo.map(x=>`<button class="cv-trayb ${x===nextSci?'nxt':''}" data-pick="${x}">${TNAME[x]}${x===nextSci?' <em>next step</em>':''}</button>`).join('')}</div>`;
  say=st.say||'You can try any test you like! Real geologists usually start by looking, then the streak tile, then the scratch tools, then the special tests.';}
 else if(t==='hard'){body=`<div class="cv-kq">${KQ.hard} </div><div class="cv-kres">${scratchTray(p,m)}</div>${tested?`${kFb(st,m,t)}<div class="cv-kopts ${opts.length>4?'many':''}">${opts.map((v,i)=>`<button class="cv-kopt ${(st.bad||[]).includes(i)?'bad':''}" data-i="${i}" ${(st.bad||[]).includes(i)?'disabled':''}>${kLabel('hard',v)}</button>`).join('')}</div>`:''}`;
  say=st.say||(tested?'Now we know! Which tool was the FIRST one to make a scratch?':Object.keys(p.scr).length?'Keep going! Try the next tool.':'Let\'s scratch it! Smart scientists start with the softest tool: your fingernail.');}
 else if(t==='look'){body=`<div class="cv-kq">${KQ.look}</div>${tested?`<div class="cv-kres"><div class="cv-klook">${rockSVG(p.k,90,m.col)}<div><b>${esc(m.look)}</b></div></div></div><div style="text-align:center"><button class="cv-btn" id="cvLookOk">📝 Write it down</button></div>`:`<button class="cv-btn cv-ktest" id="cvKTest">${KBTN.look}</button>`}`;
  say=st.say||(tested?'Color and shape are good clues, but color can fool you! Let\'s write it down and keep testing.':KHINT.look);}
 else{body=`<div class="cv-kq">${KQ[t]} </div>${tested?`<div class="cv-kres">${kPic(m,t,p)}</div>${['magnet','acid','water'].includes(t)?'<div style="text-align:center"><button class="cv-say cv-replay">↻ Watch again</button></div>':''}${kFb(st,m,t)}<div class="cv-kopts ${opts.length>4?'many':''}">${opts.map((v,i)=>`<button class="cv-kopt ${(st.bad||[]).includes(i)?'bad':''}" data-i="${i}" ${(st.bad||[]).includes(i)?'disabled':''}>${kLabel(t,v)}</button>`).join('')}</div>`:`<button class="cv-btn cv-ktest" id="cvKTest">${KBTN[t]}</button>`}`;
  say=st.say||(tested?'Watch closely! What happened? Pick the answer that matches.':KHINT[t]);}
 modal(`<button class="cv-back" data-back>‹ Lab</button><h2>🗝️ ${p.map?'The Rock You Brought':'Specimen #'+(S.pack.indexOf(p)+1)}</h2>
  <div class="cv-key"><div class="cv-kleft"><div class="cv-specimen">${rockSVG(p.k,96)}</div><div class="cv-sus2"><b>Could still be:</b>${C.map(c=>`<span>${gemSVG(CD.MIN[c],22)} ${esc(CD.MIN[c].n)}</span>`).join('')}</div></div>
  <div class="cv-kright">${trail}<div class="cv-kstep now"><span class="cv-kn">${p.path.length+1}</span><div style="flex:1">${body}</div></div>
   <div class="cv-kstep todo"><span class="cv-kn">?</span><div class="cv-kq">🎉 The answer!</div></div></div></div>
  ${guide(say,st.mood)}`,{wide:1});
 const qText=t?(t==='hard'?'How hard is it? Try the scratch tools, softest first.':KQ[t]):'Which test should we try?';
 root.querySelector('[data-back]').onclick=openLab;
 /* phones: a wrong answer re-draws the sheet — keep the "look again" note and the answer buttons on screen */
 const fbEl=root.querySelector('#cvMod .cv-kfb');if(fbEl){try{fbEl.scrollIntoView({block:'center'});}catch(e){}}
 root.querySelectorAll('.cv-replay').forEach(b=>b.onclick=()=>{sfx(t);bench(k,Object.assign({},st,{t,tested:1,quiet:1}));});
 root.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const x=b.dataset.pick;sfx('tap');
  p.cur=x;save();bench(k,{t:x});});
 const lk=root.querySelector('#cvLookOk');if(lk)lk.onclick=()=>{sfx('right');p.path.push({t:'look',v:m.look});p.cur=null;save();bench(k,{say:'Noted! Now let\'s test it.',mood:'happy'});};
 const tb=root.querySelector('#cvKTest');if(tb)tb.onclick=()=>{sfx(t);p.tests[t]=1;save();bench(k,{t,tested:1,quiet:1});};
 root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{const i=+b.dataset.tool;const yes=i>=hardBand(m.h);p.scr[i]=yes;p.tests['scratch:'+i]=1;sfx(yes?'hard':'bonk');save();
  const skipped=[...Array(i).keys()].some(j=>p.scr[j]==null);
  bench(k,{t:'hard',quiet:1,mood:yes?'happy':'think',say:yes?(i===0?'Your fingernail left a scratch! It\'s very soft.':skipped?`A scratch! But did a <b>softer</b> tool scratch it too? Try one to find out.`:`A scratch! The ${CD.TOOLS[i].n.toLowerCase()} is the first tool that scratches it.`):(i===3?'Not even the quartz point scratches it! Wow!':`No mark. It's harder than the ${CD.TOOLS[i].n.toLowerCase()}. Try a harder tool!`)});});
 root.querySelectorAll('.cv-kopt:not([disabled])').forEach(b=>b.onclick=()=>{const v=opts[+b.dataset.i];const real=tval(m,t);
  if(JSON.stringify(v)===JSON.stringify(real)){sfx('right');p.path.push({t,v:real});p.cur=null;save();ev('keystep',{t,ok:1});
   const left=kAlive(p);const same=left.length===C.length;bench(k,{say:sciOrder().every(x=>p.path.some(s=>s.t===x))?'Excellent! Every test is done. I think we\'ve cracked it…':left.length<=1?'Only one suspect is left! A good scientist still finishes every test to be sure.':same?'Good observing! That test didn\'t rule anyone out this time, but it\'s another clue in our notebook. Try another test!':pick(Math.random,['Great observing! That rules out some suspects.','Exactly right! Let\'s try the next test.','Yes! A real scientist reads results just like that.']),mood:'happy'});}
  else{sfx('wrong');p.miss++;save();ev('keystep',{t,ok:0});bench(k,{t,tested:1,quiet:1,bad:(st.bad||[]).concat(+b.dataset.i),mood:'think',say:'Scientists re-check their results all the time. Look at the picture again and try another answer!'});}});
}
function kFb(st,m,t){return (st.bad&&st.bad.length)?`<div class="cv-kfb" role="status">🤔 Not quite! ${kWhy(m,t)}</div>`:'';}
function kWhy(m,t){if(t==='magnet')return m.m?'Watch the rock: it jumps up and sticks to the magnet!':'Watch the rock: the magnet is close, but the rock just sits there.';
 if(t==='acid')return m.f?'See all those bubbles? That\'s fizzing!':'No bubbles at all — so it doesn\'t fizz.';
 if(t==='water')return m.w?'It got smaller and smaller until it was gone — it dissolved!':'It\'s still sitting in the water — it didn\'t dissolve.';
 if(t==='streak')return m.s?`Look at the color of the line on the tile.`:'There\'s no colored line — just scratches. It\'s harder than the tile!';
 if(t==='hard')return 'Look at the tools you tried. Which was the <b>first</b> one (the softest) that made a scratch?';
 if(t==='uv')return m.u?'It\'s glowing brightly in the dark!':'It stays dark — no glow.';
 if(t==='break')return 'Look at the pieces. Are their sides flat, curved or rough? Are they thin sheets, or tiny crumbs? Or did it only dent?';return 'Read the description under the picture.';}
function kReveal(p){const m=CD.MIN[p.id];
 modal(`<div class="cv-card"><div class="cv-kpath">${(p.path||[]).map(s=>`<span>${KQ[s.t].split(' ')[0]} ${kLabel(s.t,s.v)}</span>`).join('<i>➜</i>')}</div>${gemSVG(m,110)}<h2>The path leads to… <br>${esc(m.n)}!</h2>
 ${guide(p.miss?'We got there! Next time, look extra carefully at each picture — you\'ll be a master detective.':pick(Math.random,['Perfect detective work — every answer right!','Brilliant! You read every test like a real geologist.','Wow, not a single mistake. I\'m impressed!']),'happy')}<button class="cv-btn" id="cvKDone">Add it to my Journal!</button></div>`,{noX:1});
 root.querySelector('#cvKDone').onclick=()=>guess(p.k,p.id);}
/* The challenge after the tests: easy = 2 choices, middle grades 3, older 4 (one more after 8 finds).
   Right = identified on the spot. Wrong, or "show me", goes to the usual answer card. */
function quickID(p){const m=CD.MIN[p.id],k=p.k,n=Math.min(5,2+TIER()+((S.found[p.id]||0)>=8?1:0));
 const R=rng(hash('quick|'+k)),known=shuffle(R,Object.keys(S.idd).filter(id=>id!==p.id&&CD.MIN[id])),rest=shuffle(R,Object.keys(CD.MIN).filter(id=>id!==p.id&&!known.includes(id)));
 const opts=shuffle(R,[p.id].concat(known.concat(rest).slice(0,n-1)));
 modal(`<button class="cv-back" data-back>‹ Lab</button><h2>🔎 You have seen this one before!</h2>
  <div class="cv-kpath">${(p.path||[]).map(s=>`<span>${KQ[s.t].split(' ')[0]} ${kLabel(s.t,s.v)}</span>`).join('<i>➜</i>')}</div>
  ${guide('Every test is done, and you have found this mineral before. Look at your clues. Do you know which one it is?')}
  <div class="cv-kopts ${opts.length>4?'many':''}">${opts.map(id=>`<button class="cv-kopt" data-q="${id}">${esc(CD.MIN[id].n)}</button>`).join('')}</div>
  <div style="text-align:center;margin-top:8px"><button class="cv-say" data-q="">🤔 I'm not sure. Show me</button></div>`,{wide:1});
 root.querySelector('[data-back]').onclick=openLab;
 root.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const id=b.dataset.q;p.qk=1;
  if(id===p.id){ev('quick',{ok:1});save();guess(k,p.id);return;}
  if(id){p.miss=(p.miss||0)+1;sfx('wrong');ev('quick',{ok:0});}else sfx('tap');save();kReveal(p);});}
function identify(k){bench(k);}

function guess(k,id){const p=S.pack.find(x=>x.k===k);if(!p)return;const m=CD.MIN[p.id];
 if(id!==p.id){sfx('wrong');p.wrong=(p.wrong||[]).concat(id);save();bench(k,{a:'🤔',t:`It's <b>not ${esc(CD.MIN[id].n)}</b>! Run another test to tell the last suspects apart.`});return;}
 const nt=testsOf(p).length;S.pack.splice(S.pack.indexOf(p),1);const first=!S.idd[p.id];S.idd[p.id]=1;foundOne(p.id);const r=CD.RAR[m.r];S.stats.ids=(S.stats.ids||0)+1;
 sfx('win');const sharp=!p.miss;const coins=first?r.c:r.sell,rp=(first?r.rp:1)+(sharp?2:0);addCoins(coins,'mineral');S.rp+=rp;save(true);ev('identify',{id:p.id,first});
 modal(`<div class="cv-card">${gemSVG(m,120,null)}<h2>${first?'🎉 New discovery!':'✅ You got it!'}<br>${esc(m.n)}</h2><div class="cv-tag r${m.r}">${r.n}${m.notMin?' · not a true mineral!':''}</div>${sharp?'<div class="cv-tag">🕵️ Sharp detective — no mistakes!</div>':''}<p>${txt(m)}</p>
  <div class="cv-facts"><span>Hardness ${m.h}</span><span>Streak ${m.s?STREAK_NAMES[m.s]:'none'}</span>${m.u?`<span>UV ${UV_NAMES[m.u]}</span>`:''}</div><div class="cv-rew">+${coins} 🪙 · +${rp} 🔬</div><button class="cv-btn" data-close>${S.pack.some(x=>x.t!=='f')?'Next specimen':'Done'}</button></div>`);
 onClose=()=>{if(S.pack.some(x=>x.t!=='f'))openLab();};}

/* ---------------- Gear shop ---------------- */
function openGear(){const t=TIER();
 const rowH=(key,arr,label,desc)=>{const lv=S.gear[key],cur=arr[lv],nx=arr[lv+1];
  return `<div class="cv-gear"><div class="cv-gi">${cur.e||label.e}</div><div class="cv-gt"><b>${cur.n||label.n}</b><small>${desc(cur)}</small>${nx?`<div class="cv-next">Next: <b>${nx.e||''} ${nx.n||label.n+' '+(lv+2)}</b> — ${desc(nx)}${nx.why&&(t||nx.core)?`<br><i>${nx.why}</i>`:''}${nx.need&&!S.idd[nx.need]?'<br><b class="warn">Needs a real 💎 diamond — identify one in the Lab first!</b>':''}</div>`:'<div class="cv-next">⭐ Maxed out!</div>'}</div>
   ${nx?`<button class="cv-buy" data-k="${key}" ${canBuy(nx)?'':'disabled'}>🪙 ${fmt(nx.c)}${nx.r?`<br>🔬 ${nx.r}`:''}</button>`:''}</div>`;};
 modal(`<h2>🛒 Gear Shop</h2><p class="cv-sub">You have 🪙 ${fmt(H.coins())} and 🔬 ${fmt(S.rp)} research points (earn 🔬 by identifying minerals, meeting critters and solving puzzles).</p>
  ${rowH('drill',CD.DRILLS,{},d=>`digs rock up to hardness ${d.h}`)}
  ${rowH('suit',CD.SUITS,{},s=>`safe up to ${fmt(s.t)} °C`)}
  ${rowH('bat',CD.BATT.map((b,i)=>({...b,e:'🔋',n:['Battery','Big Battery','Mega Battery','Super Battery','Ultra Battery'][i]})),{},b=>`${b.v} energy per dive`)}
  ${rowH('pack',CD.PACK.map((b,i)=>({...b,e:'🎒',n:['Backpack','Big Backpack','Explorer Pack','Expedition Pack','Mega Pack'][i]})),{},b=>`holds ${b.v} finds`)}
  ${rowH('lamp',CD.LAMP.map((b,i)=>({...b,e:'🔦',n:['Head Lamp','Bright Lamp','Super Lamp','Mega Lamp'][i]})),{},b=>`lights ${b.v} tiles around you`)}
  ${H.noRecharge?'':rowH('chg',CHG,{},c=>`charges ${c.v} energy per minute at camp`)}
  ${rowH('uv',[{e:'🔦',n:'No UV lamp',c:0},{e:'🟣',n:'UV Lamp',c:CD.UV.c,r:CD.UV.r,why:'Ultraviolet light is invisible to us, but it makes some minerals glow (fluorescence).'}],{},u=>u.c?'shows glowing minerals + UV lab test':'—')}`,{wide:1});
 root.querySelectorAll('.cv-buy').forEach(b=>b.onclick=()=>buy(b.dataset.k));}
function gearArr(k){return {chg:CHG,drill:CD.DRILLS,suit:CD.SUITS,bat:CD.BATT,pack:CD.PACK,lamp:CD.LAMP,uv:[{},{c:CD.UV.c,r:CD.UV.r}]}[k];}
function canBuy(nx){return H.coins()>=nx.c&&S.rp>=(nx.r||0)&&(!nx.need||S.idd[nx.need]);}
function buy(k){const arr=gearArr(k),nx=arr[S.gear[k]+1];if(!nx||!canBuy(nx))return;if(!H.spend(nx.c))return;sfx('buy');S.rp-=nx.r||0;S.gear[k]++;if(k==='bat')S.bat=batMax();save(true);ev('gear',{k,lv:S.gear[k]});openGear();say('✅ Upgraded!',1500);}

/* ---------------- ⚡ Power Up with math ---------------- */
function mathQ(g){const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),p=Math.random();
 if(g<=1){const a=r(1,10),b=r(1,10);return p<.5?{q:`${a} + ${b}`,a:a+b}:{q:`${a+b} − ${a}`,a:b};}
 if(g<=2){const a=r(5,60),b=r(2,30);return p<.5?{q:`${a} + ${b}`,a:a+b}:{q:`${a+b} − ${b}`,a:a};}
 if(g<=4){const a=r(2,10),b=r(2,10);return p<.6?{q:`${a} × ${b}`,a:a*b}:{q:`${a*b} ÷ ${a}`,a:b};}
 if(g<=6){const a=r(12,60),b=r(3,9);return p<.4?{q:`${a} × ${b}`,a:a*b}:p<.7?{q:`${a*b} ÷ ${b}`,a:a}:{q:`${a*10} + ${b*25}`,a:a*10+b*25};}
 if(g<=8){const a=r(-12,12),b=r(-12,12);return p<.5?{q:`${a} + (${b})`,a:a+b}:{q:`${a} × (${b})`,a:a*b};}
 const x=r(-9,12),m=r(2,9),c=r(-20,20);return {q:`${m}x ${c<0?'−':'+'} ${Math.abs(c)} = ${m*x+c}`,a:x,x:1};}
function powerLeft(){return MQ()?Math.max(0,batMax()-(S.tripPow||0)):Infinity;}
function openPower(){charge();let Q=H.mathQ?H.mathQ():mathQ(+H.player.grade||3),inp='',streak=0,note='';
 const gain=()=>Math.max(1,Math.min(powerLeft(),Math.max(4,Math.round(batMax()*.06))));
 const draw=()=>{const bm=batMax();const sh=modal(`<h2>⚡ Power Up!</h2><p class="cv-sub">Every right answer adds <b>+${gain()} 🔋</b>. ${S.bat>=bm||!fullIn()?'':'Or just wait — it charges by itself at camp (full in '+fullIn()+').'}</p>
  <div class="cv-meter ok"><i style="width:${S.bat/bm*100}%"></i></div><p class="cv-sub" style="text-align:center">🔋 ${Math.floor(S.bat)} / ${bm}${streak>1?` · 🔥 ${streak} in a row`:''}</p>
  ${S.bat>=bm-.5?`<div class="cv-card"><div class="cv-big">🔋</div><h2>Fully charged!</h2><button class="cv-btn" data-close>Go dig!</button></div>`:powerLeft()<=0?`<div class="cv-card">${guide('Phew — that is all the charge this battery can take on one trip! Finish up here, and bring me another 🪨 <b>mystery rock</b> from Math Quest to come back.')}<button class="cv-btn" data-close>OK</button></div>`:`
  <div class="cv-mq">${esc(Q.q)}${Q.x?'<small>x = ?</small>':' = ?'}</div><div class="cv-inp">${esc(inp)||'&nbsp;'}</div><div style="min-height:38px">${note}</div>
  <div class="cv-pad2">${[1,2,3,4,5,6,7,8,9,'±',0,'⌫'].map(k=>`<button data-k="${k}">${k}</button>`).join('')}</div>
  <div class="cv-row"><button class="cv-btn" id="cvChk">✓ Check</button></div>`}`,{wide:0});
  sh.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==='⌫')inp=inp.slice(0,-1);else if(k==='±')inp=inp.startsWith('-')?inp.slice(1):'-'+inp;else if(inp.replace('-','').length<5)inp+=k;upd();});
  const c=sh.querySelector('#cvChk');if(c)c.onclick=check;};
 /* a number press only changes the answer box; redrawing the whole popup made it jump */
 const upd=()=>{const e=root.querySelector('.cv-inp');if(e)e.innerHTML=esc(inp)||'&nbsp;';else draw();};
 const check=()=>{if(inp===''||inp==='-')return;if(+inp===Q.a){sfx('right');streak++;const gg=gain();S.bat=Math.min(batMax(),S.bat+gg);if(MQ())S.tripPow=(S.tripPow||0)+gg;S.stats.power=(S.stats.power||0)+1;note=`<div class="cv-ok2">✅ Yes! +${gain()} 🔋</div>`;ev('power',{ok:1});}
  else{sfx('wrong');streak=0;note=`<div class="cv-hint">Not quite — ${esc(Q.q)} ${Q.x?'→ x':''} = <b>${Q.a}</b>. Try the next one!</div>`;ev('power',{ok:0});}
  inp='';Q=H.mathQ?H.mathQ():mathQ(+H.player.grade||3);save();hud();draw();};
 const key=e=>{if(!modalOpen()||!root.querySelector('.cv-pad2')){window.removeEventListener('keydown',key);return;}if(/^[0-9]$/.test(e.key)){if(inp.replace('-','').length<5)inp+=e.key;upd();}else if(e.key==='-'){inp=inp.startsWith('-')?inp.slice(1):'-'+inp;upd();}else if(e.key==='Backspace'){inp=inp.slice(0,-1);upd();}else if(e.key==='Enter')check();};
 window.addEventListener('keydown',key);draw();}

/* ---------------- Journal ---------------- */
function openJournal(tab){tab=tab||'min';const tabs=[['min','💎 Minerals'],['fos','🦴 Fossils'],['cri','🐾 Critters'],['geo','🔮 Geodes'],['rec','🏆 Records']];
 let body='';
 if(tab==='min')body=`<div class="cv-grid">${Object.keys(CD.MIN).map(id=>{const m=CD.MIN[id];return S.idd[id]?`<button class="cv-jc" data-min="${id}">${gemSVG(m,44)}<b>${esc(m.n)}</b><small>${'★'.repeat(starsOf(id))||''}${'☆'.repeat(3-starsOf(id))} ×${S.found[id]||1}</small></button>`:`<div class="cv-jc un"><span>❔</span><b>???</b><small>${CD.RAR[m.r].n}</small></div>`;}).join('')}</div><p class="cv-sub">${Object.keys(S.idd).length} of ${Object.keys(CD.MIN).length} minerals identified · Collect more of each for stars: ★ at 5, ★★ at 15, ★★★ at 40</p>`;
 if(tab==='fos')body=`<div class="cv-grid">${CD.FOSSILS.map(f=>{const n=(S.fos[f.id]||[]).filter(Boolean).length;return `<div class="cv-jc ${n?'':'un'}"><span class="cv-e">${n?femo(f):'❔'}</span><b>${n?esc(f.n):'???'}</b><small>${n}/${f.parts.length} pieces${S.ex[f.id]?' · 🏛️':''}</small>${f.camp!=null&&!S.ex[f.id]?`<small class="cv-camp">🏕️ ${(S.fos[f.id]||[])[f.camp]?'Camp piece found!':'Needs a camp piece'}</small>`:''}</div>`;}).join('')}</div>${CD.FOSSILS.some(f=>f.camp!=null)?'<p class="cv-sub">🏕️ Some pieces are only found by your <b>Adventure Camp</b> crew. Send your pets on trips!</p>':''}`;
 if(tab==='cri')body=`<div class="cv-grid">${CD.CRITTERS.map(c=>S.crit[c.id]?`<button class="cv-jc" data-cri="${c.id}"><span class="cv-e">${c.e}</span><b>${esc(c.n)}</b><small>${esc(CD.LAYERS.find(L=>L.id===c.L).n)}</small></button>`:`<div class="cv-jc un"><span>❔</span><b>???</b><small>${S.seen[c.L]?esc(CD.LAYERS.find(L=>L.id===c.L).n):'deeper…'}</small></div>`).join('')}</div>`;
 if(tab==='geo')body=`<div class="cv-grid">${CD.GEODES.map(g=>S.geo[g.id]?`<div class="cv-jc"><div class="cv-geode sm" style="--gc:${g.col}"><i></i></div><b>${esc(g.n)}</b><small>×${S.geo[g.id]}</small></div>`:`<div class="cv-jc un"><span>🔮</span><b>???</b><small>Find the daily ✨ secret pocket</small></div>`).join('')}</div>`;
 if(tab==='rec')body=`<div class="cv-recs"><div><b>${depthStr(Math.max(1,S.maxRow))}</b><span>Deepest dig</span></div><div><b>${fmt(S.stats.dug)}</b><span>Blocks dug</span></div><div><b>${fmt(S.stats.ids||0)}</b><span>Minerals identified</span></div><div><b>${Object.keys(S.ex).length}</b><span>Museum exhibits</span></div><div><b>${S.probe.wins?'★'.repeat(Math.min(5,S.probe.rank))||'✔':'—'}</b><span>Core Probe rank ${S.probe.rank}</span></div><div><b>${S.garden?S.garden.cols||0:0}</b><span>Cave columns grown</span></div></div>`;
 modal(`<h2>📓 Explorer's Journal</h2><div class="cv-tabs">${tabs.map(([k,n])=>`<button class="${k===tab?'on':''}" data-tab="${k}">${n}</button>`).join('')}</div>${body}`,{wide:1});
 root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openJournal(b.dataset.tab));
 root.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{const m=CD.MIN[b.dataset.min];modal(`<div class="cv-card">${gemSVG(m,100)}<h2>${esc(m.n)}</h2><div class="cv-tag r${m.r}">${CD.RAR[m.r].n}</div><p>${txt(m)}</p><div class="cv-facts"><span>Hardness ${m.h}</span><span>Streak ${m.s?STREAK_NAMES[m.s]:'none'}</span>${m.f?'<span>Fizzes</span>':''}${m.m?'<span>Magnetic</span>':''}${m.u?`<span>UV ${UV_NAMES[m.u]}</span>`:''}</div><button class="cv-btn" data-close>Back</button></div>`);onClose=()=>openJournal('min');});
 root.querySelectorAll('[data-cri]').forEach(b=>b.onclick=()=>{const c=CD.CRITTERS.find(x=>x.id===b.dataset.cri);modal(`<div class="cv-card"><div class="cv-big">${c.e}</div><h2>${esc(c.n)}</h2><p>${txt(c)}</p><button class="cv-btn" data-close>Back</button></div>`);onClose=()=>openJournal('cri');});
}

/* ---------------- Museum ---------------- */
const FPOS={smilodon:[[82,34],[48,44],[40,80],[12,40]],triceratops:[[82,34],[46,44],[42,82],[11,64]],pteranodon:[[62,18],[20,42],[50,52],[50,82]],stego:[[88,52],[46,18],[46,48],[42,82],[10,60]],mammoth:[[22,30],[12,60],[50,42],[55,80]],trex:[[16,28],[34,50],[52,45],[55,82],[86,40]],brachio:[[12,12],[28,34],[52,55],[55,85],[88,62]],ammonite:[[50,50],[32,34],[68,62]],trilobite:[[50,18],[50,50],[50,84]],stromatolite:[[50,84],[50,52],[50,20]]};
const SLOTHINT={'Fang Skull':'head','Horned Skull':'head','Crested Skull':'head',Wings:'sides','Back Plates':'back','Spiky Tail':'back end',Skull:'head',Tusk:'face',Neck:'neck',Arms:'front',Ribs:'chest',Legs:'feet',Tail:'back end',Shell:'outside',Spiral:'middle',Chambers:'inside',Head:'front',Body:'middle',Base:'bottom',Layers:'middle',Top:'top'};
function museumReady(){return CD.FOSSILS.some(f=>!S.ex[f.id]&&f.parts.every((_,i)=>(S.fos[f.id]||[])[i]));}
function openMuseum(){
 const ex=CD.FOSSILS.map(f=>{const got=S.fos[f.id]||[];const n=got.filter(Boolean).length;const done=S.ex[f.id];const ready=!done&&n===f.parts.length;
  return `<div class="cv-ex ${done?'done':''}"><div class="cv-exe">${n||done?femo(f):'❔'}</div><div><b>${n||done?esc(f.n):'Unknown fossil'}</b><small>${done?esc(f.age):`${n}/${f.parts.length} pieces${n?'':' · dig in the '+esc(CD.LAYERS.find(L=>L.id===f.L).n)}`}</small>${!done&&f.camp!=null?(got[f.camp]?`<small class="cv-campok">🏕️ ${esc(f.parts[f.camp])}: found by your camp crew!</small>`:`<small class="cv-camp">🏕️ The <b>${esc(f.parts[f.camp])}</b> is only found by your Adventure Camp crew!</small>`):''}</div>${ready?`<button class="cv-btn sm" data-as="${f.id}">🧩 Assemble!</button>`:done?`<button class="cv-btn sm" data-look="${f.id}">🔍 Look</button>`:''}</div>`;}).join('');
 const shown=CD.FOSSILS.filter(f=>S.ex[f.id]).sort((a,b)=>a.ageY-b.ageY);
 const tl=shown.length?`<div class="cv-tl"><h4>🕰️ Time Wall — deeper rock is older rock</h4>${shown.map(f=>`<div class="cv-tli" data-look="${f.id}" style="cursor:pointer"><span>${femo(f)}</span><b>${esc(f.n)}</b><small>${esc(f.age)} · found in ${esc(CD.LAYERS.find(L=>L.id===f.L).n)}</small></div>`).join('<div class="cv-tla">⬇️ older</div>')}</div>`:'';
 const today=[...new Set([...W.items.values()].filter(it=>it.t==='f').map(it=>CD.FOSSILS.find(f=>f.id===it.id).L))].filter(l=>S.seen[l]).map(l=>CD.LAYERS.find(L=>L.id===l).n);
 modal(`<h2>🏛️ Museum</h2><p class="cv-sub">Find all the pieces of a fossil, then put the skeleton together! Tap 🔍 Look on a finished one to read about it.</p>${today.length?`<div class="cv-hint">🦴 Today, fossil pieces are hidden in: <b>${today.map(esc).join(', ')}</b>. Look for the 🦴 on the depth bar!</div>`:''}${ex}${tl}`,{wide:1});
 root.querySelectorAll('[data-as]').forEach(b=>b.onclick=()=>assemble(b.dataset.as));
 root.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>exhibit(b.dataset.look));}
/* a finished skeleton on display: come back any time to look at it and read about it */
function exhibit(id){const f=CD.FOSSILS.find(x=>x.id===id);if(!f||!S.ex[id])return openMuseum();const L=CD.LAYERS.find(l=>l.id===f.L),x=f.x||{};
 const row=(e,h,v)=>v?`<div style="display:flex;gap:10px;text-align:left;margin:8px 0"><span style="font-size:22px">${e}</span><div><b>${h}</b><br>${esc(v)}</div></div>`:'';
 const sh=modal(`<button class="cv-back" data-back>‹ Museum</button><div class="cv-card"><div class="cv-big">${femo(f)}</div><h2>${esc(f.n)}</h2>
  <div class="cv-stats"><span>🕰️ ${esc(f.age)}</span><span>${L.e} Found in ${esc(L.n)}</span><span>🦴 ${f.parts.length} pieces: ${f.parts.map(esc).join(', ')}</span></div>
  <p>${txt(f)}</p>${row('🔎','What it was',x.what)}${row('📏','How big',x.size)}${row('🍽️','What it ate',x.ate)}${row('🌍','Where it lived',x.where)}
  ${row('⛏️','Why you found it this deep','Rock builds up in layers over a very long time, so deeper rock is older. This fossil was in the '+L.n+' because of when it lived: '+f.age+'.')}
  <button class="cv-btn" data-back>Back to the Museum</button></div>`,{wide:1});
 sh.querySelectorAll('[data-back]').forEach(b=>b.onclick=openMuseum);}
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
function openGarden(){S.garden=S.garden||{stage:0,last:'',cols:0};const G=S.garden;const can=G.last!==realDay();const st=G.stage;
 const tl=12+st*5.2,tm=8+st*4.4;
 modal(`<h2>🌱 Drip Garden</h2><p class="cv-sub">Drip water on the cave ceiling once a day and watch a stalactite and stalagmite grow toward each other.</p>
  <svg class="cv-drip" viewBox="0 0 200 120"><rect width="200" height="120" rx="12" fill="#2a2330"/><path d="M0 0 H200 V14 Q100 22 0 14Z" fill="#8f897a"/><path d="M0 120 H200 V106 Q100 100 0 106Z" fill="#8f897a"/>
  ${st>=7?'<path d="M92 16 L108 16 L104 106 L96 106 Z" fill="#e8dfc8"/>':`<path d="M92 16 L108 16 L100 ${16+tl}Z" fill="#e8dfc8"/><path d="M90 104 L110 104 L100 ${104-tm}Z" fill="#d9ceb2"/>${can?'':`<circle cx="100" cy="${20+tl}" r="3" fill="#8fd3ff"><animate attributeName="cy" from="${20+tl}" to="${100-tm}" dur="1.2s" repeatCount="indefinite"/></circle>`}`}</svg>
  <div class="cv-meter"><i style="width:${Math.min(100,st/7*100)}%"></i></div><p class="cv-sub">Day ${st} of 7 · Columns grown: ${G.cols}</p>
  <p>${TIER()?'Each drip of water carries dissolved calcium bicarbonate. When the drop loses CO₂ to the cave air, calcite (CaCO₃) is left behind. Real stalactites grow only about a centimetre every 100 years — ours are magic-fast!':'Every drop of water leaves a tiny bit of rock behind. Stalac<b>t</b>ites hang from the <b>t</b>op, stalag<b>m</b>ites grow up from the ground. When they meet they make a column!'}</p>
  <div class="cv-row">${can?'<button class="cv-btn" id="cvDrip">💧 Drip water today</button>':'<span class="cv-sub">✅ Watered today. Come back tomorrow!</span>'}</div>`,{wide:1});
 const b=root.querySelector('#cvDrip');if(b)b.onclick=()=>{G.last=realDay();G.stage++;let extra='';if(G.stage>=7){G.cols++;addCoins(150,'column');S.rp+=10;extra='🏛️ They joined into a COLUMN! +150 🪙 +10 🔬';G.stage=7;}save(true);ev('drip',{});openGarden();if(extra){say(extra,4000);G.stage=0;G.last=S.day;save(true);}};}

/* ---------------- Elevator ---------------- */
function openElevator(){const stops=CD.LAYERS.filter(L=>S.maxRow>=L.r0);
 modal(`<h2>🛗 Elevator</h2><p class="cv-sub">Ride down to the top of any layer you have reached.</p><div class="cv-stops">${stops.map(L=>`<button class="cv-stop" data-r="${L.r0}" style="--lc:${L.col}"><span>${L.e}</span><b>${esc(L.n)}</b><small>${depthStr(L.r0)} · ${fmt(L.t0)} °C</small></button>`).join('')||'<div class="cv-empty">Dig down to reach your first layer!</div>'}</div>`,{wide:1});
 root.querySelectorAll('.cv-stop').forEach(b=>b.onclick=()=>{const r=+b.dataset.r;if(rowTemp(r)>suit().t){say(`🥵 It's ${fmt(rowTemp(r))} °C there — your suit is only safe to ${fmt(suit().t)} °C.`);return;}closeModal();sfx('elev');S.x=2;S.y=r;snapCam();after();say(`🛗 Ding! ${esc(layerOf(r).n)}.`,1800);});}

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
 sfx('gate');S.gates[id]=1;const r=Object.keys(GATES).find(k=>GATES[k].id===id);if(r){const i=idx(W.gateX[r],+r);W.g[i]=T_AIR;setDug(i);}
 addCoins(60,'puzzle');S.rp+=10;save(true);ev('puzzle',{id});
 modal(`<div class="cv-card"><div class="cv-big">🎉</div><h2>${esc(title)}</h2><p>${txt(PZ_WHY[id])}</p><div class="cv-rew">+60 🪙 · +10 🔬 · The way is open!</div><button class="cv-btn" data-close>Keep digging!</button></div>`);}
const pzR=id=>rng(hash(id+'|'+H.player.id+'|'+(S.pzTry=(S.pzTry||0)+1)));

/* 1. Lever */
function pzLever(){const t=TIER(),R=pzR('lever');
 const Wt=[120,[160,200,240][Math.floor(R()*3)],[320,400,480,560][Math.floor(R()*4)]][t],F=[30,40,60][t];
 /* The plank is a see-saw: the boulder's end sits on the ground and your end is up in the air. The fulcrum starts right
    under you (no help at all); slide it toward the boulder until your push is enough to tip the plank and lift the boulder. */
 let d=9.5;
 const draw=(mode,msg)=>{const fx=20+d*26,deg=x=>x*180/Math.PI,lim=x=>Math.asin(Math.min(.6,x));
  /* a0: boulder end resting on the ground; a1: your end pushed down to the ground (kept gentle so the picture stays readable) */
  const a0=-Math.min(24,deg(lim(22/Math.max(1,fx-20))),deg(lim(62/Math.max(1,266-fx)))),a1=Math.min(24,deg(lim(22/Math.max(1,280-fx)))),a2=a0+(a1-a0)*.3,fin=mode==='win'?a1:a0;
  const anim=mode==='win'?'animation:cvLevW .7s ease-out forwards':mode==='fail'?'animation:cvLevF .8s ease-in-out':'';
  const sh=modal(`<h2>🪨 The Giant Boulder</h2><p class="cv-sub">${t?`A ${Wt} kg boulder sits on the low end of the plank. You can push down with ${F} kg of force. Slide the fulcrum (▲) along the 10 m plank toward the boulder, then push!`:'A giant boulder sits on the low end of the plank, and your end is up in the air. Slide the yellow ▲ toward the boulder, then push down. Can you find a spot where you are strong enough to lift it?'}</p>
  <svg viewBox="0 0 300 150" class="cv-pz"><style>@keyframes cvLevW{from{transform:rotate(${a0.toFixed(2)}deg)}to{transform:rotate(${a1.toFixed(2)}deg)}}@keyframes cvLevF{0%,100%{transform:rotate(${a0.toFixed(2)}deg)}45%{transform:rotate(${a2.toFixed(2)}deg)}}@keyframes cvRoll{to{transform:translate(-70px,0);opacity:0}}</style>
   <rect x="0" y="130" width="300" height="20" fill="#5b4633"/>
   <path d="M${fx} 108 L${fx-14} 130 L${fx+14} 130 Z" fill="#ffd43b"/>
   <g style="transform-box:view-box;transform-origin:${fx}px 108px;transform:rotate(${fin.toFixed(2)}deg);${anim}"><rect x="20" y="98" width="260" height="10" rx="3" fill="#b98a52"/>
    <g style="${mode==='win'?'animation:cvRoll .6s .75s ease-in forwards':''}"><circle cx="36" cy="72" r="26" fill="#7d7468"/><text x="36" y="78" text-anchor="middle" font-size="13" fill="#fff">${Wt}kg</text></g>
    <text x="266" y="92" text-anchor="middle" font-size="26">${H.player.emoji||'🧑‍🚀'}</text></g>
   ${t?`<text x="${Math.max(34,(20+fx)/2)}" y="146" text-anchor="middle" font-size="10" fill="#fff">load arm ${d} m</text><text x="${Math.min(262,(fx+280)/2)}" y="146" text-anchor="middle" font-size="10" fill="#fff">effort arm ${10-d} m</text>`:''}</svg>
  <input type="range" min="0.5" max="9.5" step="0.5" value="${d}" id="cvLv" class="cv-range">
  ${msg||''}<div class="cv-row"><button class="cv-btn" id="cvPush">💪 Push!</button></div>`,{wide:1});
  sh.querySelector('#cvLv').oninput=e=>{d=+e.target.value;draw('rest');};
  sh.querySelector('#cvPush').onclick=()=>{const eff=F*(10-d),load=Wt*d;
   if(eff>=load){draw('win');setTimeout(()=>solved('lever','The boulder rolled away!'),1500);}
   else draw('fail',`<div class="cv-hint">😣 Too heavy! Your end barely moves. ${t?`Your side: ${F} × ${10-d} = ${fmt(eff)}. Boulder side: ${Wt} × ${d} = ${fmt(load)}. You need your side to be at least as big.`:'Try sliding the yellow fulcrum closer to the boulder.'}</div>`);};};
 draw('rest');}

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
 modal(`<div class="cv-card"><div class="cv-big">🚀</div><h2>Core Probe Expedition</h2><p>No person or machine has ever gone this deep in real life. In the cave, your pretend probe can! Steer it down through the deep mantle, the liquid outer core and into the solid inner core, 6,371 km down. Dodge hot spots, collect 🔷 data, and answer science checks to repair your shield.</p>
  <div class="cv-stats"><span>⭐ Rank ${rank}${rank?' '+'★'.repeat(Math.min(5,rank)):''}</span><span>🏆 Best ${S.probe.best} data</span><span>🎁 Rewards left today: ${left}</span></div>
  <p class="cv-sub">${rank?'Each rank makes the probe fall faster. Win to rank up!':'Win once to earn the Core Explorer trophy.'}</p><button class="cv-btn" id="cvGo">🚀 Launch!</button></div>`);
 root.querySelector('#cvGo').onclick=()=>probeRun();}
function probeRun(){
 const t=TIER(),rank=S.probe.rank||0,spd=1+rank*.12,dur=t?18:15;
 const sh=modal(`<div class="cv-probe"><canvas id="cvPC"></canvas><div class="cv-phud" id="cvPH"></div><div class="cv-pctl"><button id="cvPL">◀</button><button id="cvPR">▶</button></div></div>`,{wide:1,noX:1});
 sh.classList.add('probe');const pc=sh.querySelector('#cvPC'),g=pc.getContext('2d');
 const dpr=Math.min(2,devicePixelRatio||1);let Wd=0,Hd=0;const rs=()=>{Wd=pc.clientWidth;Hd=pc.clientHeight;pc.width=Wd*dpr;pc.height=Hd*dpr;g.setTransform(dpr,0,0,dpr,0,0);};rs();
 const st={x:.5,shield:3,orbs:0,ph:0,t:0,obs:[],paused:false,over:false,inv:0,dir:0,qs:shuffle(Math.random,CD.Q[t])};window.__cvProbe=st;
 let last=performance.now(),id=0;
 const keys=e=>{if(e.key==='ArrowLeft')st.dir=e.type==='keydown'?-1:0;if(e.key==='ArrowRight')st.dir=e.type==='keydown'?1:0;};
 window.addEventListener('keydown',keys);window.addEventListener('keyup',keys);
 const hold=(b,d)=>{b.onpointerdown=()=>st.dir=d;b.onpointerup=b.onpointerleave=()=>st.dir=0;};hold(sh.querySelector('#cvPL'),-1);hold(sh.querySelector('#cvPR'),1);
 pc.onpointermove=e=>{if(e.buttons||e.pointerType==='touch'){const r=pc.getBoundingClientRect();st.x=Math.max(.05,Math.min(.95,(e.clientX-r.left)/r.width));}};
 const cleanup=()=>{cancelAnimationFrame(id);window.removeEventListener('keydown',keys);window.removeEventListener('keyup',keys);};
 const spawn=dt=>{const P=PHASES[st.ph];if(Math.random()<dt*(.85+.3*st.ph)*spd)st.obs.push({k:P.ob,x:Math.random(),y:Hd+30,r:14+Math.random()*14,ph:Math.random()*6});if(Math.random()<dt*.9)st.obs.push({k:'orb',x:.1+Math.random()*.8,y:Hd+20,r:12});};
 const loop=now=>{id=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(st.paused||st.over)return;
  st.t+=dt;st.x=Math.max(.05,Math.min(.95,st.x+st.dir*dt*.9));spawn(dt);const P=PHASES[st.ph];const px=st.x*Wd,py=Hd*.28;
  st.obs.forEach(o=>{o.y-=dt*150*spd;if(o.k==='swirl')o.x+=Math.sin(st.t*2+o.ph)*dt*.25;});
  st.obs=st.obs.filter(o=>{if(o.y<-40)return false;const dx=o.x*Wd-px,dy=o.y-py;if(Math.hypot(dx,dy)<(o.k==='orb'?o.r+16:o.r*.7+12)){if(o.k==='orb'){st.orbs++;return false;}if(st.inv<=0&&!window.__cvGod){st.shield--;st.inv=1.2;if(st.shield<=0){end(false);}}return false;}return true;});
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
.cv-row1,.cv-row2{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.cv-row1{flex-wrap:nowrap;padding-right:48px}
.cv-chip,.cv-res span,.cv-g span{background:rgba(20,12,30,.78);color:#fff;border-radius:12px;padding:5px 10px;font-weight:600;font-size:14px;white-space:nowrap}
.cv-res{display:flex;gap:6px;margin-left:auto;flex-wrap:nowrap;justify-content:flex-end;min-width:0}
.cv-g{display:flex;gap:5px;flex-wrap:wrap}.cv-g span{font-size:13px;font-weight:500}.cv-g .warn{background:#c92a2a}
.cv-map{width:auto!important;padding:0 12px!important;border-radius:18px!important;font-size:15px!important;white-space:nowrap}
.cv-x{position:absolute;right:10px;top:calc(6px + env(safe-area-inset-top));pointer-events:auto;background:rgba(255,255,255,.9)!important;width:36px;height:36px;border-radius:50%;font-size:18px;font-weight:700}
.cv-bat{position:relative;width:130px;height:24px;background:rgba(20,12,30,.78);border-radius:12px;overflow:hidden;margin-left:auto}
.cv-bat i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#2ecc71,#8ce99a);transition:width .2s}.cv-bat i.low{background:linear-gradient(90deg,#ff5a5f,#ffa94d)}
.cv-bat span{position:relative;color:#fff;font-size:13px;font-weight:600;line-height:24px;padding-left:8px}
.cv-depth{position:absolute;right:6px;top:92px;bottom:150px;width:14px;border-radius:8px;overflow:visible;display:flex;flex-direction:column;box-shadow:0 0 0 2px rgba(255,255,255,.25)}
.cv-depth i{display:block;width:100%}.cv-depth i:first-child{border-radius:8px 8px 0 0}.cv-depth i:last-child{border-radius:0 0 8px 8px}
.cv-depth b{position:absolute;left:-6px;right:-6px;height:3px;background:#fff}.cv-depth b.me{height:10px;margin-top:-5px;border-radius:5px;background:#ffd43b;box-shadow:0 0 6px #ffd43b}.cv-depth b.max{background:#ff5a5f}.cv-depth b.pk.fo{left:auto;right:-26px}.cv-depth b.pk{background:none;height:auto;left:-24px;font-size:14px;margin-top:-9px}
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
.cv-mx{position:absolute;top:8px;right:8px;width:44px;height:44px;border-radius:50%;background:#eee9ff!important;font-size:18px;font-weight:700;z-index:2}
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
.cv-ex small.cv-camp,.cv-jc small.cv-camp{display:block;color:#1864ab;font-weight:700;background:#e7f5ff;border-radius:8px;padding:2px 6px;margin-top:3px}.cv-ex small.cv-campok{display:block;color:#2b8a3e;font-weight:700}
.cv-ex{display:flex;gap:10px;align-items:center;background:#f6f3ff;border-radius:14px;padding:10px;margin:6px 0}.cv-ex.done{background:#e6fcf5}.cv-exe{font-size:36px;width:48px;text-align:center}.cv-ex>div:nth-child(2){flex:1}.cv-ex small{display:block;color:#6d6490}.cv-ok{font-size:13px;font-weight:600;color:#087f5b}
.cv-tl{margin-top:12px;background:#fff9db;border-radius:14px;padding:10px}.cv-tl h4{margin:2px 0 8px}.cv-tli{display:flex;gap:8px;align-items:center}.cv-tli span{font-size:26px}.cv-tli small{color:#6d6490;margin-left:auto;text-align:right}.cv-tla{text-align:center;font-size:12px;color:#a08a2e}
.cv-skel{position:relative;height:260px;background:#f4ede0;border-radius:16px;margin:8px 0;overflow:hidden}.cv-ghost{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:190px;opacity:.16}
.cv-slot{position:absolute;transform:translate(-50%,-50%);min-width:56px;min-height:44px;border-radius:12px;border:3px dashed #b39b72!important;background:rgba(255,255,255,.7);font-weight:700;color:#8a7350;font-size:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px 6px}
.cv-slot small{font-size:10px}.cv-slot.full{border-style:solid!important;background:#fff;color:#241a3d}.cv-slot.shake{animation:cvsh .35s}@keyframes cvsh{25%{transform:translate(-44%,-50%)}75%{transform:translate(-56%,-50%)}}
.cv-bones{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.cv-bone{background:#f4ede0;border-radius:12px;padding:8px 12px;font-weight:600}.cv-bone.sel{background:#ffd43b}
.cv-drip{width:100%;max-width:360px;display:block;margin:6px auto}
.cv-meter{height:14px;background:#eee9ff;border-radius:8px;overflow:hidden;margin:8px 0}.cv-meter i{display:block;height:100%;background:linear-gradient(90deg,#74c0fc,#7c5cff);transition:width .3s}.cv-meter.ok i{background:linear-gradient(90deg,#69db7c,#2ecc71)}
.cv-haul{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:10px 0}.cv-haul div{background:#fff4cc;border-radius:14px;padding:10px}.cv-haul b{display:block;font-size:24px;color:#8a5a00}.cv-haul span{font-size:12px;color:#6d6490}
.cv-act.pw{background:#ffd43b;box-shadow:0 4px 0 #c98f00;animation:cvpulse 1.6s infinite}@keyframes cvpulse{50%{transform:scale(1.06)}}
.cv-mq{font-size:38px;font-weight:700;text-align:center;margin:8px 0}.cv-mq small{display:block;font-size:16px;color:#6d6490}.cv-inp{font-size:34px;font-weight:700;text-align:center;background:#f3f0ff;border-radius:14px;padding:6px;min-height:52px}
.cv-pad2{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.cv-pad2 button{background:#eee9ff;border-radius:12px;font-size:24px;font-weight:700;padding:10px}.cv-ok2{text-align:center;color:#2b8a3e;font-weight:700;margin-top:6px}
.cv-tut{background:#e7f5ff;border-radius:14px;padding:10px 12px;margin:6px 0}.cv-tut ol{margin:6px 0 6px 18px;padding:0}.cv-tut li{margin:3px 0}
.cv-lab2{display:flex;gap:10px;align-items:center}.cv-result{flex:1;background:#fff9db;border-radius:14px;padding:10px;min-height:80px;display:flex;flex-direction:column;justify-content:center;font-size:15px}.cv-result .cv-anim{font-size:26px;text-align:left}
.cv-h4{margin:12px 0 4px}.cv-banner{background:#d3f9d8;color:#2b8a3e;border-radius:12px;padding:8px 10px;font-weight:700;margin-bottom:6px;animation:cvpulse 1.6s infinite}.cv-sub2{color:#6d6490;font-size:13px;margin-bottom:6px}
.cv-suss{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.cv-sus{background:#fff;border:3px solid #b197fc!important;border-radius:14px;padding:8px;text-align:left;position:relative;box-shadow:0 3px 0 #d0bfff}.cv-sus b{font-size:16px}.cv-sus ul{list-style:none;margin:4px 0 0;padding:0;font-size:12px}.cv-sus li.y{color:#2b8a3e}.cv-sus li.n{color:#c92a2a}.cv-sus small{color:#aaa}
.cv-sus.out{opacity:.45;border-color:#ddd!important;box-shadow:none;background:#f8f8f8}.cv-sus em{display:block;font-style:normal;font-size:11px;font-weight:700;color:#c92a2a;margin-top:2px}.cv-sus small{display:block;font-size:11px}
.cv-t2s{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}.cv-t2{background:#f3f0ff;border-radius:12px;padding:8px;text-align:left;display:grid;grid-template-columns:32px 1fr;column-gap:6px;align-items:center}.cv-te{font-size:24px;grid-row:span 2}.cv-t2 b{font-size:14px}.cv-t2 small{font-size:11px;color:#6d6490}.cv-t2.did{background:#e6fcf5}.cv-t2:disabled{cursor:default}.cv-t2:not(.did):disabled{opacity:.5}
.cv-guide{display:flex;gap:10px;align-items:flex-start;background:#eef7ff;border:3px solid #74c0fc;border-radius:18px;padding:10px 12px;margin:10px 0;text-align:left}
.cv-kfb{background:#fff9db;border:2px solid #fcc419;border-radius:12px;padding:8px 10px;margin:8px 0;font-size:15px;line-height:1.35;color:#5c3c00}
.cv-guide.happy{background:#ebfbee;border-color:#51cf66}.cv-guide.think{background:#fff9db;border-color:#fcc419}
.cv-gav{flex:0 0 64px;width:64px;height:78px;display:flex;align-items:flex-end;justify-content:center}.cv-gav svg{width:64px;height:78px}.cv-gav span{font-size:44px}
.cv-gsay{flex:1;font-size:16px;line-height:1.4;color:#1f2340}.cv-gsay>b{display:block;color:#1971c2;font-size:13px;letter-spacing:.5px;text-transform:uppercase}
.cv-act.qz{background:#e7f5ff}
.cv-key{display:flex;gap:14px;align-items:flex-start;margin-top:6px}
.cv-kleft{flex:0 0 150px;text-align:center}.cv-kleft .cv-specimen{background:#f8f9fa;border-radius:18px;padding:8px}
.cv-sus2{margin-top:8px;font-size:13px;text-align:left;display:flex;flex-direction:column;gap:3px}.cv-sus2 b{font-size:12px;color:#868e96;text-transform:uppercase}.cv-sus2 span{display:flex;align-items:center;gap:5px;background:#f1f3f5;border-radius:10px;padding:2px 6px}
.cv-kright{flex:1;min-width:0;display:flex;flex-direction:column;gap:0;position:relative}
.cv-kstep{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:16px;position:relative;margin-bottom:10px}
.cv-kstep:not(:last-child)::after{content:'';position:absolute;left:23px;top:44px;bottom:-12px;width:4px;background:#b2f2bb;border-radius:2px}
.cv-kstep.now:not(:last-child)::after,.cv-kstep.todo::after{background:#dee2e6}
.cv-kn{flex:0 0 28px;height:28px;border-radius:50%;background:#51cf66;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:1}
.cv-kstep.done{background:#ebfbee}.cv-kstep.now{background:#fff;border:4px solid #4c6ef5;box-shadow:0 0 0 5px rgba(76,110,245,.15)}.cv-kstep.now .cv-kn{background:#4c6ef5}
.cv-kstep.todo{background:#f1f3f5;color:#868e96}.cv-kstep.todo .cv-kn{background:#adb5bd}
.cv-kq{font-weight:700;font-size:17px;color:#1f2340}.cv-kstep.todo .cv-kq{color:#868e96}.cv-ka{color:#2b8a3e;font-weight:700;font-size:15px;margin-top:2px}
.cv-ktest{margin-top:8px;font-size:18px!important}
.cv-kres{margin:8px 0;display:flex;justify-content:center}.cv-kp{width:100%;max-width:300px;height:auto;background:#fff9f0;border-radius:14px}
.cv-kopts{display:flex;flex-wrap:wrap;gap:8px}.cv-kopt{flex:1 1 140px;font-family:inherit;font-size:16px;font-weight:700;padding:12px 10px;border-radius:14px;border:3px solid #4c6ef5;background:#edf2ff;color:#1f2340;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;flex-direction:column}
.cv-kopt small{font-weight:500;font-size:12px;color:#5c677d}.cv-kopt.bad{opacity:.4;border-color:#fa5252;background:#fff5f5;text-decoration:line-through}
.cv-kh{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%}.cv-kh div{background:#fff9f0;border-radius:12px;padding:6px 4px;text-align:center;display:flex;flex-direction:column;gap:2px;border:3px solid #ffe8cc}
.cv-mag{animation:cvMag 1s ease-out forwards}@keyframes cvMag{from{transform:translateY(-44px)}to{transform:translateY(-10px)}}
.cv-jump{animation:cvJump .3s .95s ease-in forwards}@keyframes cvJump{to{transform:translateY(-16px)}}
.cv-sit{animation:cvSit .5s 1s ease-in-out 2}@keyframes cvSit{50%{transform:translateX(1px)}}
.cv-melt{transform-box:fill-box;transform-origin:50% 90%;animation:cvMelt 3s .5s ease-in forwards}@keyframes cvMelt{60%{opacity:.6}to{transform:scale(0);opacity:0}}
.cv-drop{animation:cvDrop .9s ease-in infinite}@keyframes cvDrop{to{transform:translateY(10px);opacity:.2}}
.cv-tray{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.cv-kopts.many{display:grid!important;grid-template-columns:1fr 1fr;gap:6px}.cv-kopts.many .cv-kopt{padding:8px 6px;font-size:14px;margin:0}
.cv-trayb.nxt{outline:3px solid #ffd43b}.cv-trayb em{display:block;font-style:normal;font-size:11px;color:#e67700}.cv-korder{display:block;font-weight:500;font-size:12px;opacity:.8;margin-top:2px}
.cv-trayb{flex:1 1 130px;font-family:inherit;font-size:16px;font-weight:700;padding:12px 10px;border-radius:14px;border:3px solid #fab005;background:#fff9db;color:#1f2340;cursor:pointer}.cv-trayb.bad{opacity:.45;border-color:#fa5252;background:#fff5f5;text-decoration:line-through}
button.cv-tool{font-family:inherit;background:#fff9f0;border-radius:12px;padding:6px 4px;text-align:center;display:flex;flex-direction:column;gap:2px;border:3px solid #ffe8cc;cursor:pointer;color:#1f2340}button.cv-tool:not([disabled]){border-color:#fab005;box-shadow:0 3px 0 #f59f00}button.cv-tool[disabled]{cursor:default}
.cv-kh button.cv-tool.y{border-color:#8ce99a}.cv-kh button.cv-tool.y em{color:#2b8a3e}.cv-kh button.cv-tool.n em{color:#c92a2a}.cv-kh button.cv-tool em{color:#e67700}
.cv-say{background:#edf2ff;border:0;border-radius:10px;padding:2px 8px;font-size:16px;cursor:pointer;vertical-align:middle}
@media (prefers-reduced-motion:reduce){.cv-mag,.cv-jump,.cv-melt{animation-duration:.01s;animation-delay:0s}}
.cv-kh span{font-size:28px}.cv-kh b{font-size:12px}.cv-kh em{font-style:normal;font-weight:800;font-size:13px}.cv-kh .y{border-color:#8ce99a}.cv-kh .y em{color:#2b8a3e}.cv-kh .n em{color:#c92a2a}
.cv-klook{display:flex;align-items:center;gap:10px;background:#fff9f0;border-radius:14px;padding:8px 12px;font-weight:600}
.cv-kpath{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center;font-size:13px;margin-bottom:6px}.cv-kpath span{background:#ebfbee;border-radius:10px;padding:3px 8px;display:flex;align-items:center;gap:3px}.cv-kpath i{color:#51cf66;font-style:normal;font-weight:800}
.cv-snap{animation:cvsnap .5s ease-out}@keyframes cvsnap{0%{transform:translate(93px,56px)}100%{transform:translate(93px,64px)}}
.cv-bub{animation:cvbub 1.4s ease-in infinite}@keyframes cvbub{0%{opacity:0;transform:translateY(20px)}40%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}
@media(max-width:600px){.cv-key{flex-direction:column}.cv-kleft{flex:none;width:100%;display:flex;gap:10px;align-items:center;text-align:left}.cv-kleft .cv-specimen{flex:0 0 auto}.cv-sus2{flex-direction:row;flex-wrap:wrap;margin:0}.cv-kh{grid-template-columns:repeat(2,1fr)}.cv-gav{flex-basis:48px;width:48px;height:58px}.cv-gav svg{width:48px;height:58px}}
@media(max-width:560px){.cv-suss{grid-template-columns:1fr 1fr}.cv-t2s{grid-template-columns:1fr 1fr}.cv-specimen svg{width:64px;height:64px}}
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
.cv .cv-sock,.cv .cv-sock span,.cv .cv-sock small{color:#fff}.cv-top .cv-snd{right:54px!important;background:none!important;padding:0;border:2px solid rgba(255,255,255,.9)!important;border-radius:11px!important;box-shadow:0 3px 0 rgba(0,0,0,.4);overflow:hidden}.cv-snd svg{width:100%;height:100%;display:block}
.cv-sndov{position:absolute;inset:0;z-index:60;background:rgba(10,5,30,.6);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;pointer-events:auto}.cv-sndov .cv-sheet{max-width:440px;width:100%;margin:auto;position:relative}
.cv-sndp{text-align:center}.cv-sndp h2{margin:0 0 10px}.cv-sndp .snd-opt{font-family:inherit;border:3px solid #d0bfff!important;background:#f8f5ff!important}.cv-sndp .snd-opt.on{border-color:#2ecc71!important;background:#ebfbee!important}.cv-sndp input[type=range]{touch-action:pan-x}.cv-top .cv-row1{padding-right:98px!important}
/* top-right buttons sit in the row (no overlap on wide screens), ≥44px tap targets; phones show the 🗺️ icon only so nothing gets clipped */
#cvRoot .cv-top .cv-row1{padding-right:0!important}
#cvRoot .cv-top .cv-x{position:static!important;flex:0 0 auto;width:44px!important;height:44px!important;min-width:44px;font-size:18px!important;display:inline-flex;align-items:center;justify-content:center}
#cvRoot .cv-top .cv-map{width:auto!important;padding:0 12px!important;font-size:15px!important}#cvRoot .cv-mapt{margin-left:4px}
@media(max-width:480px){#cvRoot .cv-top .cv-map{width:44px!important;padding:0!important;font-size:20px!important}#cvRoot .cv-top .cv-mapt{display:none}}.cv-sock{width:90px;height:100px;border-radius:16px;background:#1c1626;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 16px var(--g),inset 0 0 0 3px var(--g)}.cv-sock.sel{outline:4px solid #ffd43b}.cv-sock span{font-size:30px}
.cv-minsel button{background:#1c1626;color:#fff;border-radius:14px;padding:6px 10px;display:flex;flex-direction:column;align-items:center;font-size:12px}
.cv-nsel{display:flex;gap:6px;justify-content:center}.cv-nsel button{width:44px;height:44px;border-radius:12px;background:#f3f0ff;font-weight:700;font-size:18px}.cv-nsel button.on{background:#7c5cff;color:#fff}
.cv-choices{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.cv-probe{position:relative;width:100%;height:100%}.cv-probe canvas{width:100%;height:100%;display:block}
.cv-phud{position:absolute;left:8px;right:8px;top:8px;display:flex;gap:6px;flex-wrap:wrap}.cv-phud>*{background:rgba(0,0,0,.55);color:#fff;border-radius:10px;padding:4px 8px;font-size:13px}
.cv-pctl{position:absolute;left:0;right:0;bottom:14px;display:flex;justify-content:space-between;padding:0 14px}.cv-pctl button{width:70px;height:60px;border-radius:16px;background:rgba(255,255,255,.3);color:#fff;font-size:26px}
.cv-pq{position:absolute;left:12px;right:12px;top:18%;background:#fff;border-radius:18px;padding:14px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.5)}.cv-pq h3{margin:4px 0}.cv-pq p{font-size:14px}
@media(max-width:560px){.cv-chip,.cv-res span{font-size:12px;padding:4px 6px}.cv-chip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.cv-res{gap:4px}.cv-x{width:32px!important;height:32px!important;font-size:15px!important}.cv-g span{font-size:11px;padding:4px 7px}.cv-bat{width:100px}.cv-pad{width:138px;height:138px}.cv-pad button{width:46px;height:46px}.cv-pad .u,.cv-pad .d{left:46px}.cv-pad .l,.cv-pad .r{top:46px}.cv-act{min-width:52px;font-size:20px;padding:5px 7px}.cv-acts{max-width:calc(100vw - 170px)}.cv-tests{grid-template-columns:repeat(4,1fr);min-width:0}.cv-gh,.cv-cand{grid-template-columns:1.3fr repeat(6,1fr);font-size:11px}.cv-gh{font-size:10px}.cv-bench{flex-direction:column}.cv-tests{width:100%}.cv-specimen svg{width:80px;height:80px}}
`;

/* ---------------- public API ---------------- */
function open(host){coreOn=false;coreRoll=null;
 H=host;S=host.state;initState();
 if(!document.getElementById('cvCSS')){const st=document.createElement('style');st.id='cvCSS';st.textContent=CSS;document.head.appendChild(st);}
 let tripK=null;
 if(MQ()){S.bat=batMax();S.tripPow=0;S.x=4;S.y=0;uvOn=false;S.trips=(S.trips||0)+1;PEND_FOS+=deliverFossils();
  if(H.tripRock){tripK='r'+Date.now().toString(36);S.pack.push({t:'m',id:H.tripRock,k:tripK,tests:{},map:1});}}
 genWorld();build();snapCam();hud();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
 if(!MQ()&&PEND_FOS){try{say(`🦴 ${PEND_FOS} fossil piece${PEND_FOS>1?'s':''} went to the 🏛️ Museum.`);}catch(e){}PEND_FOS=0;}
 if(MQ()){const first=!S.stats.dug&&S.trips<=1;setTimeout(()=>{S.caveIn=false;},0);
  modal(`<div class="cv-card">${first?`<div class="cv-big">⛏️</div><h2>Deep Down: The Science Cave</h2>`:''}${guide(first?`Welcome to my dig site, ${esc(H.player.name)}! Down there are the real layers of the Earth — minerals 💎, fossils 🦴 and cave critters 🦇.<br>First, let's find out what your <b>mystery rock</b> is. I'll show you how in the Lab!`:!H.tripRock?`Welcome back, ${esc(H.player.name)}! Your key let you ride straight down. No new rock to test today, so grab your shovel and dig!`:pick(Math.random,[`Welcome back, ${esc(H.player.name)}! Let's see what that mystery rock of yours is.`,`Ooh, another mystery rock! To the Lab — I can't wait to find out what it is!`,`Hello again, rock detective! Let's test your mystery rock first, then you can dig.`]))}
  ${!first&&S.caveIn?'<p class="cv-sub">🌀 The cave shifted since your last visit — fresh minerals, coins and fossil pieces are waiting!</p>':(!first?'<p class="cv-sub">⛏️ Your tunnels are just where you left them. Keep digging deeper!</p>':'')}${(()=>{const n=PEND_FOS;PEND_FOS=0;return n?`<p class="cv-sub">🦴 <b>${n} fossil piece${n>1?'s':''}</b> from your backpack went to the 🏛️ Museum! Build skeletons there.</p>`:'';})()}<p class="cv-sub">Your battery is full. ⚡ Math can add up to one more battery of charge this trip.</p><button class="cv-btn" id="cvGoLab">${H.tripRock||first?'🔬 Study my mystery rock':'⛏️ Start digging'}</button></div>`,{noX:1});
  const b=root.querySelector('#cvGoLab');if(b)b.onclick=()=>{closeModal();if(tripK)bench(tripK);else if(H.tripRock||first)openLab();};
  save(true);return;}
 if(S.caveIn){S.caveIn=false;say('🌙 Overnight a small cave-in shifted the rocks — new pockets have opened! Look for today\'s ✨ secret pocket.',5000);}
 else if(!S.stats.dug)modal(`<div class="cv-card"><div class="cv-big">⛏️</div><h2>Deep Down: The Science Cave</h2><p>Dig down through the real layers of the Earth! Find mystery minerals 💎, fossils 🦴 and cave critters 🦇. Study your finds in the 🔬 Lab to earn coins and research points, then upgrade your gear to dig deeper and deeper.</p><p class="cv-sub">Use the arrow buttons (or swipe) to dig. Tap 🏠 to beam back to camp any time.</p><button class="cv-btn" data-close>Start digging!</button></div>`);
 save(true);
}
function leave(){save(true);cardQ.length=0;cancelAnimationFrame(raf);window.removeEventListener('keydown',onKey);window.removeEventListener('resize',resize);if(root)root.remove();root=null;const h=H;H=null;W=null;if(h&&h.exit)h.exit();}
/* ---------------- The Core Keeper (Oct 2026) ----------------
   A surprise for explorers who own the Core Suit (the sixth suit, CD.SUITS[..].core). Deep in the Mantle the floor cracks and the
   hero falls through the Earth's real layers to the centre (the same layers the Core Probe visits, but this time in person).
   The fall holds at the top of each layer until the kid taps on, so there is time to read. At the centre the Core Keeper, a grumpy
   ball of iron and nickel, asks science questions about the layers (not math), then launches the hero back to camp.
   Like the Troll and the Eagle: on the first visit he grabs a specimen for each wrong answer but hands everything back at the end
   (nothing really leaves the backpack). Later visits: a wrong answer costs one unidentified specimen from the backpack (kept in
   S.core.keep, at most 6) and a right answer wins one back. HONESTY RULE: the game says plainly that the suit, the fall and the
   Keeper are pretend (no person or machine could reach the core) while the layer facts are real: in the suit's shop text, in the
   Keeper's first hello, and in Dr. Quartz's 'Real or pretend?' card after the first fall (S.core.told). He is drawn white-hot with a faint yellow tint: nobody has seen the
   core, but metal at about 5,400 °C would glow nearly white, like the Sun's surface (which is about that hot). Before a kid has the suit, Dr. Quartz only hints (coreHint).
   S.core = {v: visits, keep: [specimens], last}. */
const CKP_KM=6371,CKP_SUIT=CD.SUITS.findIndex(s=>s.core),CKP_ROW=(CD.LAYERS.find(l=>l.id==='mantle')||{r0:ROWS}).r0+2,CKP_KEEP=6;
const CKP_L=[
 {n:'Crust',d0:0,d1:40,col:[122,86,58],secs:2,
  y:'This is the crust: the thin, hard skin of the Earth. Everything we know lives on it!',
  o:'The crust is the thin rocky skin we live on. Under the land it is only about 40 km thick. If the Earth were an apple, the crust would be the peel.',
  y2:'People have never dug all the way through the crust. The deepest hole ever is about 12 km deep, and it took almost 20 years to dig!',
  o2:'The deepest hole people ever dug, in Russia, is about 12 km deep. It took almost 20 years and only got about a third of the way through the crust.',
  h:'Under the continents the crust is about 35 to 40 km of mostly granite-like rock. Under the oceans it is only about 7 km of basalt. Its bottom edge is called the Moho, found in 1909 from the way earthquake waves suddenly speed up there.'},
 {n:'Upper mantle',d0:40,d1:660,col:[168,62,30],secs:3.3,
  y:'Now the mantle. The rock here is so hot that it bends and creeps, like very thick, slow toffee.',
  o:'The mantle is hot, solid rock that still flows, very slowly, a few centimetres a year. That slow flow is what moves the continents.',
  y2:'Diamonds are made down here in the mantle, by squeezing and heat!',
  o2:'Diamonds form here in the upper mantle, about 150 to 200 km down, where carbon is squeezed and heated. Volcanoes carry them up to the surface.',
  h:'The mantle is solid, but over millions of years it flows by convection: hot rock rises and cooler rock sinks. That slow churning drags the plates of the crust around. This is plate tectonics.'},
 {n:'Lower mantle',d0:660,d1:2890,col:[214,84,24],secs:3.6,
  y:'Still the mantle! It is the biggest part of the Earth. Most of our planet is mantle.',
  o:'Upper and lower mantle together make up about 84% of the Earth by volume. Down here it is over 3,000 °C, but the huge pressure keeps the rock solid.',
  y2:'Hot rock down here rises very, very slowly, like a lava lamp in super slow motion.',
  o2:'Heat from the core makes mantle rock rise very slowly, cool, and sink again, like a lava lamp in extreme slow motion. One loop takes many millions of years.',
  h:'The lower mantle is mostly a mineral called bridgmanite. It is the most common mineral in the whole Earth, yet almost nobody has ever held a piece, because it is only stable under enormous pressure.'},
 {n:'Outer core',d0:2890,d1:5150,col:[245,150,30],secs:3.6,liquid:1,
  y:'The outer core is LIQUID metal: a deep, swirling ocean of melted iron!',
  o:'The outer core is liquid iron and nickel. Its swirling makes the Earth\'s magnetic field, which is why a compass points north. We know it is liquid because some earthquake waves cannot pass through liquid, and they stop here.',
  y2:'The swirling metal here turns the whole Earth into a giant magnet. That is why a compass works!',
  o2:'The magnetic field made here works like a shield. It steers harmful particles from the Sun away from our air.',
  h:'Earthquake S-waves cannot pass through liquid, so they vanish at the outer core and leave a "shadow" on the far side of the planet. That shadow is how scientists proved, in the early 1900s, that the outer core is liquid.',
  guess:{q:'It is over 3,700 °C here. What do you think this layer is like?',a:'Liquid metal',b:'Solid rock',yes:'Good thinking!',no:'Surprise: it is liquid!'}},
 {n:'Inner core',d0:5150,d1:CKP_KM,col:[255,244,205],secs:3,solid:1,
  y:'The inner core is a giant ball of solid metal, right in the middle of the Earth. It is the hottest place of all!',
  o:'The inner core is a solid ball of iron and nickel, about as hot as the surface of the Sun. It stays solid because the weight of the whole planet squeezes it.',
  y2:'The inner core is a metal ball a bit smaller than the Moon.',
  o2:'The inner core is a metal ball about 2,440 km across, a bit smaller than the Moon. It grows by about a millimetre a year as the liquid metal around it slowly freezes.',
  h:'The solid inner core was discovered in 1936 by Inge Lehmann, a Danish scientist, who noticed earthquake waves bouncing off something inside the liquid core. The pressure here is about 3.6 million times the air pressure at the surface.',
  guess:{q:'The very centre is even hotter than the liquid layer above. Liquid or solid?',a:'Solid',b:'Liquid',yes:'Yes! Hotter, but solid.',no:'Surprise: it is solid!'}}];
const CKP_T=[[0,15],[40,500],[660,1600],[2890,3700],[5150,5000],[CKP_KM,5400]];
const coreTemp=d=>{for(let i=1;i<CKP_T.length;i++)if(d<=CKP_T[i][0]){const a=CKP_T[i-1],b=CKP_T[i];return a[1]+(b[1]-a[1])*(d-a[0])/(b[0]-a[0]);}return 5400;};
/* a[0] is the right answer; the choices are shuffled when shown. young = the short list for grades 1–2; hard = grades 6 and up only
   (their answers are taught in the 'h' facts those grades read on the way down) */
const CKP_Q=[
 {q:'Which layer is liquid?',a:['Outer core','Inner core','Mantle','Crust'],young:1,why:'The outer core is a swirling ocean of melted iron and nickel.'},
 {q:'What is the Earth\'s core mostly made of?',a:['Iron and nickel','Ice','Gold','Wood'],young:1,why:'The core is metal: mostly iron, with some nickel.'},
 {q:'Where is it hottest?',a:['Inner core','Crust','Mantle'],young:1,why:'It gets hotter all the way down. The inner core is about as hot as the surface of the Sun.'},
 {q:'Which layer is the thinnest?',a:['Crust','Mantle','Outer core','Inner core'],why:'The crust is only about 40 km thick under the land. You fell through it in seconds.'},
 {q:'The inner core is hotter than the liquid outer core, but it is solid. Why?',a:['Huge pressure squeezes it solid','It is made of ice','It is far from the Sun'],why:'The weight of the whole planet presses on it so hard that the metal cannot melt.'},
 {q:'What does the swirling liquid outer core make?',a:['The Earth\'s magnetic field','Rain clouds','The ocean tides'],why:'Moving liquid metal makes the magnetic field that turns a compass needle north.'},
 {q:'Nobody has ever seen the core. How do scientists know what is inside the Earth?',a:['By studying earthquake waves','By digging a hole to the centre','By looking through a telescope'],why:'Earthquake waves bend, bounce and stop as they pass through the layers. Scientists read those waves like an X-ray of the planet.'},
 {q:'Which earthquake waves cannot travel through liquid?',a:['S-waves','P-waves','Radio waves'],hard:1,why:'S-waves stop at the liquid outer core. That is how we know it is liquid.'},
 {q:'Who discovered the Earth\'s solid inner core, in 1936?',a:['Inge Lehmann','Isaac Newton','Marie Curie'],hard:1,why:'Inge Lehmann spotted earthquake waves bouncing off a solid ball inside the liquid core.'},
 {q:'What slow movement in the mantle drags the plates of the crust around?',a:['Convection','Evaporation','Magnetism'],hard:1,why:'Hot rock rises and cooler rock sinks. That slow loop is convection.'},
 {q:'About how far is it from the ground to the centre of the Earth?',a:['About 6,400 km','About 64 km','About 640,000 km'],why:'It is about 6,371 km straight down.'}];
const CKP_CSS=`#cvCore{position:absolute;inset:0;z-index:80;background:#17110e;color:#fff4e6;display:flex;justify-content:center;overflow:auto;font-size:16px;line-height:1.4}
#cvCore .ck{width:100%;max-width:560px;padding:10px 14px;display:flex;flex-direction:column;gap:8px}
#cvCore .ck-read{display:flex;justify-content:space-between;gap:8px;font-weight:700;font-variant-numeric:tabular-nums}
#cvCore .ck-read span{background:#261c17;border:1px solid #4a382d;border-radius:10px;padding:4px 10px}
#cvCore .ck-read small{display:block;font-weight:400;font-size:11px;color:#c9b3a0;letter-spacing:.04em;text-transform:uppercase}
#cvCore .ck-shaft{position:relative;height:min(46vh,380px);min-height:240px;border-radius:16px;overflow:hidden;border:2px solid #4a382d;background:#000;flex:none}
#cvCore canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#cvCore .ck-gauge{position:absolute;right:8px;top:8px;bottom:8px;width:16px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.35);display:flex;flex-direction:column}
#cvCore .ck-gauge i{display:block;min-height:3px}
#cvCore .ck-mark{position:absolute;right:26px;width:0;height:0;border:7px solid transparent;border-left-color:#fff4e6;transform:translateY(-7px);filter:drop-shadow(0 0 2px #000)}
#cvCore .ck-layer{position:absolute;left:10px;top:10px;right:40px;font-weight:700;font-size:22px;text-shadow:0 2px 6px rgba(0,0,0,.7)}
#cvCore .ck-layer small{display:block;font-weight:400;font-size:13px;color:#fff4e6}
#cvCore .ck-skip{position:absolute;left:10px;bottom:10px;background:rgba(0,0,0,.55);color:#fff4e6;border:0;border-radius:10px;padding:6px 12px;font:inherit;font-weight:700;cursor:pointer}
#cvCore .ck-keeper{position:absolute;left:50%;bottom:12%;width:150px;height:150px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle at 38% 32%,#ffffff,#fffdf0 45%,#fff3c4 75%,#ffd97a);box-shadow:0 0 60px 24px rgba(255,250,225,.75);animation:ckBob 2.6s ease-in-out infinite}
#cvCore .ck-keeper::before,#cvCore .ck-keeper::after{content:'';position:absolute;top:44%;width:26px;height:20px;background:#2a1408;border-radius:50% 50% 45% 45%}
#cvCore .ck-keeper::before{left:28%}#cvCore .ck-keeper::after{right:28%}
#cvCore .ck-brow{position:absolute;top:33%;left:22%;right:22%;height:8px}
#cvCore .ck-brow::before,#cvCore .ck-brow::after{content:'';position:absolute;top:0;width:36px;height:7px;background:#2a1408;border-radius:4px}
#cvCore .ck-brow::before{left:0;transform:rotate(16deg)}#cvCore .ck-brow::after{right:0;transform:rotate(-16deg)}
#cvCore .ck-mouth{position:absolute;left:38%;right:38%;top:70%;height:10px;border:4px solid #2a1408;border-color:#2a1408 transparent transparent;border-radius:50%}
#cvCore .ck-keeper.kind .ck-brow::before{transform:rotate(-8deg)}#cvCore .ck-keeper.kind .ck-brow::after{transform:rotate(8deg)}
#cvCore .ck-keeper.kind .ck-mouth{border-color:transparent transparent #2a1408;top:62%}
@keyframes ckBob{50%{transform:translateX(-50%) translateY(-8px)}}
#cvCore .ck-panel{background:#261c17;border:1px solid #4a382d;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;min-height:140px}
#cvCore .ck-panel h2{margin:0;font-size:20px;color:#fff4e6}#cvCore .ck-panel p{margin:0;color:#fff4e6}
#cvCore .ck-who{font-weight:700;color:#ffb02e}
#cvCore .ck-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}
#cvCore .ck-opt{background:#4a382d;color:#fff4e6;border:0;border-radius:12px;padding:10px 12px;text-align:left;font:inherit;font-weight:700;min-height:44px;cursor:pointer}
#cvCore .ck-opt.right{background:#7bd88f;color:#0c2a14}#cvCore .ck-opt.wrong{background:#ff8a7a;color:#3a0d07}
#cvCore .ck-go{background:#ff7a1a;color:#1b0f06;border:0;border-radius:12px;padding:10px 16px;font:inherit;font-weight:700;font-size:18px;align-self:flex-start;min-height:44px;cursor:pointer}
#cvCore .ck-dots{display:flex;gap:6px}#cvCore .ck-dots i{width:14px;height:14px;border-radius:50%;background:#4a382d}#cvCore .ck-dots i.ok{background:#7bd88f}#cvCore .ck-dots i.no{background:#ff8a7a}
@media (prefers-reduced-motion:reduce){#cvCore .ck-keeper{animation:none}}`;
let coreOn=false,coreRoll=null; /* coreRoll: decided once per cave visit (always on the first ever visit, then about every other trip) */
function coreState(){S.core=S.core||{v:0,keep:[]};S.core.keep=S.core.keep||[];return S.core;}
function coreDue(){if(coreOn||coreRoll===false||CKP_SUIT<0||(S.gear.suit||0)<CKP_SUIT||S.y<CKP_ROW||modalOpen())return false;
 if(coreRoll==null)coreRoll=!coreState().v||Math.random()<.5;return coreRoll;}
/* Dr. Quartz's hints after a trip (quartz.js): about one trip in four, stronger the deeper the kid has been; none once the Keeper has been met */
function coreHint(st,trips){st=st||{};if(CKP_SUIT<0||(st.core&&st.core.v)||(trips||0)%4!==2)return '';const suitLv=(st.gear&&st.gear.suit)||0,deep=st.maxRow||0;
 if(suitLv>=CKP_SUIT)return 'You have the <b>Core Suit</b> now. Something far below us is still thumping away. If you dig down into the Mantle, be ready for anything!';
 if(suitLv>=CKP_SUIT-1)return 'I\'ve finished the design for a <b>Core Suit</b>, with a space helmet. I\'ll be honest: it could never work in real life. But here we can pretend! If anyone could reach the very bottom and find out what\'s making that sound, it\'s you. Look in the 🛒 Gear shop.';
 if(deep>=81)return 'Whatever is down there, it\'s at the very centre of the Earth. No suit I own could survive it. I\'ve started sketching a new one…';
 if(deep>=31)return 'There it is again. Something very, very deep is giving off heat in a steady rhythm. I have no idea what it is.';
 return 'Funny… my instruments picked up a strange, slow <b>thump</b> from far below. Probably nothing…';}
function coreFall(){if(coreOn||!root)return;coreOn=true;coreRoll=false;const k=coreState(),first=!k.v,grade=+H.player.grade||3,young=grade<=2,older=grade>=6,alt=(k.v||0)%2===1;
 /* three reading levels: grades 1–2 (y), 3–5 (o), 6+ (h). Every other visit swaps to a second set of facts (y2 / o2), so a return trip teaches something new. */
 const factOf=L=>young?((alt&&L.y2)||L.y):older?((alt&&L.o2)||L.h||L.o):((alt&&L.o2)||L.o);
 if(!document.getElementById('cvkCSS')){const s=document.createElement('style');s.id='cvkCSS';s.textContent=CKP_CSS;document.head.appendChild(s);}
 const el=document.createElement('div');el.id='cvCore';
 el.innerHTML=`<div class="ck"><div class="ck-read"><span><small>Depth</small><b data-r="d">0 km</b></span><span><small>Temperature</small><b data-r="t">15 °C</b></span><span><small>To the centre</small><b data-r="l">6,371 km</b></span></div>
  <div class="ck-shaft"><canvas></canvas><div class="ck-layer"></div><div class="ck-gauge" aria-hidden="true">${CKP_L.map(L=>`<i style="flex:${L.d1-L.d0} 0 0;background:rgb(${L.col})"></i>`).join('')}</div><div class="ck-mark" aria-hidden="true"></div>
  <div class="ck-keeper" hidden><div class="ck-brow"></div><div class="ck-mouth"></div></div><button class="ck-skip" hidden>Skip the fall ▸▸</button></div><div class="ck-panel" aria-live="polite"></div></div>`;
 root.appendChild(el);
 const q=s=>el.querySelector(s),cv=q('canvas'),cx=cv.getContext('2d'),st={mode:'wait',depth:0,t:0,li:-1,res:[],qs:[],qi:0,took:0,gave:0,lent:[]};let parts=[],raf=0;
 const size=()=>{const r=cv.getBoundingClientRect(),kk=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(1,r.width*kk);cv.height=Math.max(1,r.height*kk);};
 const readout=d=>{q('[data-r=d]').textContent=fmt(Math.round(d))+' km';q('[data-r=t]').textContent=fmt(Math.round(coreTemp(d)))+' °C';q('[data-r=l]').textContent=fmt(Math.round(CKP_KM-d))+' km';const g=q('.ck-gauge');q('.ck-mark').style.top=(g.offsetTop+g.offsetHeight*d/CKP_KM)+'px';};
 const layerAt=d=>CKP_L.find(L=>d<L.d1)||CKP_L[CKP_L.length-1];
 const colAt=d=>{const i=CKP_L.indexOf(layerAt(d)),L=CKP_L[i],N=CKP_L[Math.min(CKP_L.length-1,i+1)],t=Math.pow((d-L.d0)/(L.d1-L.d0),3);return L.col.map((c,j)=>Math.round(c+(N.col[j]-c)*t*.6));};
 /* the hero: the kid's own character when the host gave us its picture, inside a space helmet; otherwise a drawn stand-in */
 const hero=u=>{const P=Math.PI*2,im=H.player.img;
  if(im&&im.complete&&im.naturalWidth){const hh=u*3.4,w=hh*.77;cx.drawImage(im,-w/2,-hh*.5,w,hh);
   cx.fillStyle='rgba(170,225,255,.22)';cx.strokeStyle='rgba(255,255,255,.92)';cx.lineWidth=u*.1;cx.beginPath();cx.arc(0,-hh*.5+hh*.25,hh*.27,0,P);cx.fill();cx.stroke();
   cx.strokeStyle='rgba(255,255,255,.75)';cx.lineWidth=u*.1;cx.beginPath();cx.arc(0,-hh*.5+hh*.25,hh*.2,Math.PI*1.1,Math.PI*1.4);cx.stroke();return;}
  cx.fillStyle='#f4f1ea';cx.strokeStyle='#3a2a20';cx.lineWidth=u*.09;
  [[-.95,.75,-.5],[.95,.75,.5]].forEach(([x,y,r])=>{cx.save();cx.translate(x*u,y*u);cx.rotate(r);cx.beginPath();cx.rect(-u*.2,-u*.45,u*.4,u*.95);cx.fill();cx.stroke();cx.restore();});
  [[-.35,1.75],[.35,1.75]].forEach(([x,y])=>{cx.beginPath();cx.rect(x*u-u*.22,y*u-u*.5,u*.44,u);cx.fill();cx.stroke();});
  cx.beginPath();cx.rect(-u*.7,u*.35,u*1.4,u*1.25);cx.fill();cx.stroke();
  cx.fillStyle='#ff7a1a';cx.fillRect(-u*.3,u*.7,u*.6,u*.4);
  cx.fillStyle='#f4f1ea';cx.beginPath();cx.arc(0,-u*.35,u,0,P);cx.fill();cx.stroke();
  cx.fillStyle='#e8b58a';cx.beginPath();cx.arc(0,-u*.3,u*.66,0,P);cx.fill();
  cx.fillStyle='#4a2f1f';cx.beginPath();cx.arc(0,-u*.5,u*.68,Math.PI*1.05,Math.PI*1.95);cx.fill();
  cx.fillStyle='#2a1a12';[[-.24,-.28],[.24,-.28]].forEach(([x,y])=>{cx.beginPath();cx.arc(x*u,y*u,u*.08,0,P);cx.fill();});
  cx.strokeStyle='#2a1a12';cx.lineWidth=u*.07;cx.beginPath();cx.arc(0,-u*.02,u*.16,0,P);cx.stroke();
  cx.fillStyle='rgba(170,225,255,.28)';cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=u*.08;cx.beginPath();cx.arc(0,-u*.3,u*.8,0,P);cx.fill();cx.stroke();};
 const paint=dt=>{const w=cv.width,h=cv.height,d=st.depth,L=layerAt(d),c=colAt(d);
  const g=cx.createLinearGradient(0,0,0,h);g.addColorStop(0,`rgb(${c.map(v=>Math.round(v*.55))})`);g.addColorStop(1,`rgb(${c})`);cx.fillStyle=g;cx.fillRect(0,0,w,h);
  if(st.mode==='core'){const rg=cx.createRadialGradient(w/2,h*.75,10,w/2,h*.75,h*.9);rg.addColorStop(0,'rgba(255,255,245,.95)');rg.addColorStop(1,'rgba(255,225,150,0)');cx.fillStyle=rg;cx.fillRect(0,0,w,h);return;}
  const dir=st.mode==='up'?-1:1,sp=(st.mode==='up'?2.4:1)*h*.9; /* the rock keeps rushing past during a reading pause; only the depth waits */
  if(parts.length<46)parts.push({x:Math.random()*w,y:dir>0?h+20:-20,s:.5+Math.random(),r:4+Math.random()*10});
  parts.forEach(p=>{p.y-=dir*sp*p.s*dt;});parts=parts.filter(p=>p.y>-40&&p.y<h+40);
  parts.forEach(p=>{if(L.liquid){cx.strokeStyle='rgba(255,240,190,.55)';cx.lineWidth=3;cx.beginPath();for(let j=0;j<5;j++)cx.lineTo(p.x+Math.sin((p.y+j*14+st.t*200)/30)*12,p.y+j*14);cx.stroke();}
   else if(L.solid){cx.fillStyle='rgba(255,255,235,.75)';cx.beginPath();cx.moveTo(p.x,p.y-p.r);cx.lineTo(p.x+p.r*.6,p.y);cx.lineTo(p.x,p.y+p.r);cx.lineTo(p.x-p.r*.6,p.y);cx.fill();}
   else{cx.fillStyle=L.d0===0?'rgba(60,40,26,.8)':'rgba(70,20,8,.55)';cx.beginPath();cx.ellipse(p.x,p.y,p.r,p.r*(L.d0===0?.8:2.2),0,0,7);cx.fill();}});
  const hx=w/2+Math.sin(st.t*2.1)*w*.06,hy=h*(st.mode==='up'?.6:.42)+Math.cos(st.t*3)*6;cx.save();cx.translate(hx,hy);cx.rotate(st.mode==='up'?0:Math.sin(st.t*2.6)*.5);hero(h*.085);cx.restore();};
 const panel=html=>{q('.ck-panel').innerHTML=html;};
 const talk=(who,text,btn,fn)=>{panel(`<div class="ck-who">${who}</div><p>${text}</p><button class="ck-go">${btn||'Next ➜'}</button>`);q('.ck-go').onclick=fn;};
 const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const loop=()=>{let last=performance.now();const f=now=>{if(!coreOn)return;const dt=Math.min(.05,(now-last)/1000);last=now;st.t+=dt;
   if(st.mode==='fall')fall(dt);else if(st.mode==='up')rise(dt);paint(dt);if(st.mode==='fall'||st.mode==='up'||st.mode==='hold')raf=requestAnimationFrame(f);};raf=requestAnimationFrame(f);};
 const fall=dt=>{const j=CKP_L.findIndex(L=>st.depth<L.d1),i=j<0?CKP_L.length-1:j,L=CKP_L[i],fact=factOf(L);
  if(st.li!==i){st.li=i;sfx('layer');q('.ck-layer').innerHTML=`${L.n}<small>${fmt(L.d0)} to ${fmt(L.d1)} km deep</small>`;
   const more=i<CKP_L.length-1?'Keep falling ➜':'Down to the centre ➜';
   const tell=pre=>{panel(`<h2>${L.n}</h2><p>${pre||''}${fact}</p><button class="ck-go">${more}</button>`);q('.ck-go').onclick=()=>{if(st.mode!=='hold')return;st.mode='fall';panel(`<h2>${L.n}</h2><p>${fact}</p>`);};};
   st.mode='hold';
   /* two layers ask for a guess first (solid or liquid?). Nothing rides on it: guessing before being told makes the answer stick. */
   if(L.guess){const g=L.guess,two=Math.random()<.5?[g.a,g.b]:[g.b,g.a];panel(`<h2>${L.n}</h2><p>${g.q}</p><div class="ck-opts">${two.map(o=>`<button class="ck-opt">${o}</button>`).join('')}</div>`);
    el.querySelectorAll('.ck-opt').forEach(b=>b.onclick=()=>{const ok=b.textContent===g.a;sfx(ok?'find':'layer');tell(`<b>${ok?g.yes:g.no}</b> `);});}
   else tell();return;}
  st.depth=Math.min(CKP_KM,st.depth+(L.d1-L.d0)/L.secs*dt);readout(st.depth);if(st.depth>=CKP_KM)arrive();};
 const arrive=()=>{cancelAnimationFrame(raf);st.mode='core';st.depth=CKP_KM;readout(CKP_KM);paint(0);q('.ck-skip').hidden=true;q('.ck-layer').innerHTML='The centre of the Earth<small>6,371 km down</small>';q('.ck-keeper').hidden=false;sfx('bonk');
  const K='The Core Keeper',nm=esc(H.player.name||'You');
  const intro=first?(young?[['🙂 '+nm,'Oof! Something big, round and warm caught you.'],[K,'<b>WHO fell into my core?!</b> I am the Core Keeper. I am made of iron, and I am so hot that I glow white!'],[K,'No real person could ever come down here. It is much too hot and squashy! Lucky for you, this is a pretend trip.'],[K,'Nobody ever visits. Hmph. If you want to go home, answer my questions about what you fell through!']]
   :[['🙂 '+nm,'Something big, round and glowing catches you before you hit the middle. So THIS is what Dr. Quartz kept hearing!'],[K,'<b>WHO dropped into MY core?!</b> I am the Core Keeper: solid iron and nickel, squeezed by a whole planet. I am over 5,000 degrees, so hot that I glow <b>white</b>, like the surface of the Sun.'],[K,'No real person has ever come here, and none ever could. The deepest hole people ever dug is about <b>12 km</b>. You fell <b>6,371</b>. Only in a pretend suit!'],[K,'Nobody ever visits. If you want a push back up, prove you were paying attention on the way down!']])
   :[[K,'<b>YOU again!</b> My favourite visitor. I mean… what are you doing in my core?!'],[K,`Same deal as last time. Answer right and up you go. Miss one and I keep a specimen from your backpack for my collection.${k.keep.length?` I am still holding ${k.keep.length} of yours. Answer right to win ${k.keep.length>1?'them':'it'} back!`:''}`]];
  let n=0;const next=()=>{if(n<intro.length){const [who,text]=intro[n++];talk(who,text,'Next ➜',next);}else{st.qs=young?shuf(CKP_Q.filter(x=>x.young)).slice(0,2):older?shuf(shuf(CKP_Q.filter(x=>x.hard)).slice(0,1).concat(shuf(CKP_Q.filter(x=>!x.hard)).slice(0,2))):shuf(CKP_Q.filter(x=>!x.hard)).slice(0,3);st.qi=0;ask();}};next();};
 const specName=it=>S.idd[it.id]&&CD.MIN[it.id]?CD.MIN[it.id].n:'a mystery specimen';
 const ask=()=>{const qq=st.qs[st.qi],n=st.qs.length,opts=shuf(young?qq.a.slice(0,3):qq.a);
  panel(`<div class="ck-dots">${st.qs.map((_,i)=>`<i class="${st.res[i]===true?'ok':st.res[i]===false?'no':''}"></i>`).join('')}</div><div class="ck-who">The Core Keeper · question ${st.qi+1} of ${n}</div><h2>${esc(qq.q)}</h2><div class="ck-opts">${opts.map(o=>`<button class="ck-opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="ck-after"></div>`);
  el.querySelectorAll('.ck-opt').forEach(b=>b.onclick=()=>{if(st.res[st.qi]!=null)return;const ok=b.textContent===qq.a[0];st.res[st.qi]=ok;el.querySelectorAll('.ck-opt').forEach(x=>{x.disabled=true;if(x.textContent===qq.a[0])x.classList.add('right');});if(!ok)b.classList.add('wrong');sfx(ok?'find':'bonk');
   let extra='';
   if(ok){S.rp+=3;if(!first&&k.keep.length&&S.pack.length<packMax()){const it=k.keep.pop();S.pack.push(it);st.gave++;extra=` Fine… here is ${esc(specName(it))} back.`;}}
   else if(first){const it=S.pack.find(p=>p.t==='m'&&!st.lent.includes(p));if(it){st.lent.push(it);extra=` <b>I\'ll keep ${esc(specName(it))} from your backpack! HAR!</b>`;}else extra=' …but I\'ll give you credit for trying.';} /* first visit: only pretend, it never leaves the pack */
   else{const i=k.keep.length<CKP_KEEP?S.pack.findIndex(p=>p.t==='m'):-1;if(i>=0){const it=S.pack.splice(i,1)[0];k.keep.push(it);st.took++;extra=` <b>I\'ll keep ${esc(specName(it))} from your backpack. Win it back next time!</b>`;}else extra=' …but I\'ll give you credit for trying.';}
   save(true);
   q('.ck-after').innerHTML=`<p>${ok?'<b>Hmph. Correct.</b> ':'<b>Not quite.</b> '}${esc(qq.why)}${extra}</p><button class="ck-go">${st.qi+1<n?'Next question ➜':'Done ➜'}</button>`;
   q('.ck-go').onclick=()=>{st.qi++;if(st.qi<n)ask();else outro();};});};
 const outro=()=>{const right=st.res.filter(Boolean).length,n=st.qs.length,K='The Core Keeper';q('.ck-keeper').classList.add('kind');
  const line=first?(st.lent.length?`All right, all right… here, have your ${st.lent.length>1?st.lent.length+' specimens':'specimen'} back. `:'All right, all right. ')+'I was only pretending to be grumpy. It gets lonely at the centre of the Earth. But next time, what I take, I KEEP until you win it back!':right===n?'Every one right! You know my planet better than I do. Off you go, clever one.':'You are learning. Come back and you can win your things back.';
  talk(K,`${right} out of ${n}. ${line}`,'Hold on tight ➜',()=>talk(K,'I\'ll give you a push. Up through the outer core, the mantle and the crust: <b>6,371 km</b> to go!','🚀 Launch!',()=>{q('.ck-keeper').hidden=true;st.mode='up';parts=[];sfx('beam');loop();}));};
 const rise=dt=>{st.depth=Math.max(0,st.depth-CKP_KM/3.2*dt);readout(st.depth);q('.ck-layer').innerHTML=`Going up!<small>${layerAt(st.depth).n}</small>`;if(st.depth<=0)done();};
 const done=()=>{cancelAnimationFrame(raf);st.mode='done';const right=st.res.filter(Boolean).length,n=st.qs.length;k.v=(k.v||0)+1;k.last=Date.now();
  let rew=`+${right*3} 🔬`;if(right===n){addCoins(50,'core');rew+=' · +50 🪙';}if(first)ev('core',{right});save(true);
  window.removeEventListener('resize',size);el.remove();coreOn=false;beamHome('core');
  /* after the first fall Dr. Quartz says plainly which parts were real science and which were pretend, and how we really know */
  if(!k.told){k.told=1;save(true);card(`<div class="cv-card"><div class="cv-big">🔬</div><h2>Real or pretend?</h2><p><b>Dr. Quartz:</b> You met it! So THAT was the thumping. Now, a scientist always says what is real and what is not.</p>
   <p style="text-align:left">✅ <b>Real:</b> the layers, how deep they are, how hot they are, and what they are made of.</p>
   <p style="text-align:left">🎭 <b>Pretend:</b> the Core Suit, the fall and the Core Keeper. No person or machine could ever go there: it is far too hot, and the squeeze would crush anything we can build.</p>
   <p style="text-align:left">🌍 <b>So how do we know?</b> Nobody has seen the inside of the Earth. Scientists worked it out by measuring how earthquake waves bend, bounce and stop as they travel through the planet.</p><button class="cv-btn" data-close>Got it!</button></div>`);}
  say(`🚀 The Core Keeper launched you all the way back to camp! ${right} of ${n} right · ${rew}${st.took?` · he kept ${st.took} specimen${st.took>1?'s':''}`:''}${st.gave?` · you won back ${st.gave}`:''}`,7000);};
 q('.ck-skip').onclick=()=>{if(st.mode==='fall'||st.mode==='hold')arrive();};
 window.addEventListener('resize',size);size();readout(0);paint(0);sfx('bonk');
 panel(`<h2>${first?'The floor is cracking…':'That crack in the floor again!'}</h2><p>${first?'The ground under your boots gives way. Good thing you have your Core Suit and space helmet on. Hold tight!':'You know where this goes. All the way down!'}</p><button class="ck-go">${first?'Uh oh ➜':'Here we go ➜'}</button>`);
 q('.ck-go').onclick=()=>{st.mode='fall';q('.ck-skip').hidden=first;loop();};
 coreDbg={st,arrive,el};}
let coreDbg=null;
function summary(st){st=st||{};const L=[...CD.LAYERS].reverse().find(l=>(st.maxRow||0)>=l.r0);
 const r=st.maxRow||0;let km=0;if(L){km=L.km0+(L.km1-L.km0)*(r-L.r0)/Math.max(1,L.r1-L.r0);}
 return {maxRow:r,km,layer:L?L.n:'Surface',minerals:Object.keys(st.idd||{}).length,fossils:Object.keys(st.ex||{}).length,critters:Object.keys(st.crit||{}).length,probeRank:(st.probe||{}).rank||0};}
window.Cave={mathQ,open,leave,summary,coreHint,_dbg:()=>({S,W,H,coreFall,coreDue,core:()=>coreDbg,CKP_ROW,CKP_SUIT,step,beamHome,openPuzzle,solved,guess,openLab,bench,identify,openGear,buy,openMuseum,exhibit,assemble,openGarden,openJournal,openElevator,openProbe,probeRun,closeModal,rowTemp,rowKm,tile,idx,GATES,uv:v=>{uvOn=v;hud();},fast:()=>{STEP_MS=0;},isUV:()=>uvOn,genWorld,layerOf,rockOf,suit,drill,packMax,batMax,lampR,modalOpen,get TS(){return TS;},get camX(){return camX;},get camY(){return camY;},campTap,sfx})};
})();
