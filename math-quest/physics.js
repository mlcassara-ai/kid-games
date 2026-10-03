/* ================= Discovery District: the five physics zones (Oct 2026) =================
   Each zone is a path of 6 stops (the last is the boss). A stop is 5 rounds (the boss 6). Every round shows a picture, asks one
   question, and then "tests it": the picture moves to show what really happens (the seesaw tips, the boat sinks, the bulb lights).
   Two tries per round; only first tries count for stars. 3 stars = all first try, 2 = all but one, 1 = at least 3 (passes the stop).
   Numbers follow the hero's grade: tier 0 = grades 1-2, 1 = grades 3-4, 2 = grades 5-6, 3 = grade 7 and up (and grown-ups).
   Saved in p.phys = {bay:[stars per stop], mountain:[…], …} (small). Right and wrong answers count in p.daily like the rest of the game.
   Coins: the first pass of a stop pays 20 + 5 per stop number (the boss 100 and the zone badge); replaying for more stars pays 5 per new star.
   Honesty: the physics is real, with friendly round numbers. Where a number is rounded (sound ≈ 340 m/s, a battery = 1.5 V) the
   game says "about".
   Opens from the district map (district.js): walk to a zone's sign. Hidden with the rest of the district.
   Uses Math Quest globals: P, save, go, toast, esc, topbar, SFX, say, speakable, speakToggle, voiceOn, dayKey, SCREENS, curScreen, state. */
(function(){
'use strict';
const ZONES_P=[
 {id:'bay',name:'Balance Bay',art:'⚖️',col:'#e8c37a',about:'Seesaws, levers and pulleys',
  stops:[['🦀','Wobble Crab','Which side is heavier?'],['🐦','Tippy Gull','Make it level'],['🦭','See-Saw Seal','Find the missing weight'],['🐚','Heavy Hermit','Find the distance'],['🦩','Pulley Pelican','Lift it with pulleys'],['⚓','Captain Counterweight','Boss: everything, mixed']]},
 {id:'mountain',name:'Motion Mountain',art:'🏔️',col:'#9fa8c9',about:'Speed, distance and time',
  stops:[['🐇','Snow Hare','Who is faster?'],['🦬','Yak Express','How far?'],['🐧','Penguin Pacer','How long?'],['🦅','Ridge Eagle','What speed?'],['🛷','Sled Race','Who wins the race?'],['🏔️','Summit Yeti','Boss: everything, mixed']]},
 {id:'canyon',name:'Echo Canyon',art:'📣',col:'#e09a66',about:'Sound, echoes and waves',
  stops:[['🦇','Whisper Bat','Loud or soft?'],['🐦','Songbird','High or low?'],['🗣️','Echo Point','How far is the wall?'],['⛈️','Thunder Ridge','How far is the storm?'],['🎸','Canyon Band','Strings and pipes'],['🐺','Howl Lord','Boss: everything, mixed']]},
 {id:'city',name:'Circuit City',art:'💡',col:'#9b8fe0',about:'Batteries, bulbs and wires',
  stops:[['🔌','Spark Plug','Will it light?'],['🔋','Battery Bot','Add up the volts'],['💡','Bulb Twins','Bright or dim?'],['🎚️','Switchboard','Volts, amps and ohms'],['🏠','Power Meter','Watts'],['🤖','Overload','Boss: everything, mixed']]},
 {id:'lagoon',name:'Float or Sink Lagoon',art:'🛶',col:'#6cc6a0',about:'What floats, what sinks, and why',
  stops:[['🦆','Duck Dock','Float or sink?'],['🐸','Frog Scale','Heavier than water?'],['🐢','Turtle Lab','Density'],['🛶','Boat Builder','Load the boat'],['🧂','Salt Pond','Salty water'],['🐊','Lagoon Croc','Boss: everything, mixed']]}];
const ZBY=Object.fromEntries(ZONES_P.map(z=>[z.id,z]));
const ROUNDS=5,BOSS_ROUNDS=6,COIN_BASE=20,COIN_STEP=5,COIN_BOSS=100,COIN_STAR=5;
/* helpers (inside this file only) */
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const one=a=>a[Math.floor(Math.random()*a.length)];
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const fmtN=n=>String(Math.round(n*1000)/1000);
function tierOf(p){if(!p)return 1;if(p.adult)return 3;const g=+p.grade||3;return g<=2?0:g<=4?1:g<=6?2:3;}
function data(p){p.phys=p.phys||{};ZONES_P.forEach(z=>{const a=p.phys[z.id];if(!Array.isArray(a))p.phys[z.id]=[0,0,0,0,0,0];});return p.phys;}
const zoneStars=(p,zid)=>((p.phys&&p.phys[zid])||[]).reduce((a,b)=>a+(b||0),0);
const unlocked=(p,zid,i)=>i===0||(((p.phys&&p.phys[zid])||[])[i-1]||0)>=1;
/* choices: the right one plus distinct wrong ones, shuffled */
function opts(right,wrongs){const out=[String(right)];wrongs.forEach(w=>{w=String(w);if(!out.includes(w))out.push(w);});return shuf(out);}
function near(n,k){const s=new Set();let g=0;while(s.size<k&&g++<60){const d=one([-3,-2,-1,1,2,3,n>10?-5:4,n>10?5:6]);const v=n+d;if(v>0&&v!==n)s.add(v);}return [...s];}

/* ================= scenes (SVG, 400 x 200) ================= */
const svg=(body,h)=>`<svg viewBox="0 0 400 ${h||200}" class="ph-svg" role="img" aria-hidden="true">${body}</svg>`;
const T_=(x,y,t,o)=>`<text x="${x}" y="${y}" text-anchor="${(o&&o.a)||'middle'}" font-size="${(o&&o.s)||14}" font-weight="${(o&&o.w)||700}" fill="${(o&&o.c)||'#2b2340'}">${t}</text>`;

/* ---------- Balance Bay ---------- */
/* sc = {L:[[kg,pos]], R:[[kg,pos]], q:'L'|'R'|null (the side with the '?' block), qpos} ; pos 1..5 from the middle */
function bayScene(sc,phase,r){const torque=s=>s.reduce((a,[w,d])=>a+w*d,0);
 const lt=torque(sc.L)+(sc.q==='L'&&phase==='a'?r.ansN*sc.qpos:0),rt=torque(sc.R)+(sc.q==='R'&&phase==='a'?r.ansN*sc.qpos:0);
 let ang=0;if(phase==='a'&&sc.tip!==false)ang=lt===rt?0:lt>rt?-12:12;if(phase==='a'&&sc.forceAng!=null)ang=sc.forceAng;
 const stack={};const blk=(w,pos,side,mystery)=>{const x=200+side*pos*32,h=16+Math.min(w,12)*3,key=side+':'+pos,base=120-(stack[key]||0);stack[key]=(stack[key]||0)+h+2;return `<g><rect x="${x-14}" y="${base-h}" width="28" height="${h}" rx="4" fill="${mystery?'#fff':'#7a5af8'}" stroke="${mystery?'#7a5af8':'#4b32c3'}" stroke-width="2" ${mystery?'stroke-dasharray="4 3"':''}/>${T_(x,base-h/2+4,mystery?'?':w+'kg',{s:11,c:mystery?'#7a5af8':'#fff'})}</g>`;};
 let marks='';for(let i=1;i<=5;i++)[-1,1].forEach(s=>{marks+=`<line x1="${200+s*i*32}" y1="118" x2="${200+s*i*32}" y2="124" stroke="#6b5a2f" stroke-width="2"/>${T_(200+s*i*32,138,i,{s:10,w:600,c:'#6b5a2f'})}`;});
 return svg(`<rect x="0" y="150" width="400" height="50" fill="#bfe3f5"/><path d="M0 150 Q100 140 200 150 T400 150 V200 H0Z" fill="#8fd0ec"/>
  <g style="transform-origin:200px 120px;transform:rotate(${ang}deg);transition:transform 1.1s cubic-bezier(.3,1.4,.5,1)">
  <rect x="30" y="118" width="340" height="8" rx="4" fill="#c49a5c" stroke="#6b5a2f" stroke-width="2"/>${marks}
  ${sc.L.map(([w,d])=>blk(w,d,-1)).join('')}${sc.R.map(([w,d])=>blk(w,d,1)).join('')}${sc.q?blk(phase==='a'?r.ansN:0,sc.qpos,sc.q==='L'?-1:1,phase!=='a'):''}</g>
  <path d="M200 126 L182 158 H218Z" fill="#8a6a3a" stroke="#5b4422" stroke-width="2"/>
  ${T_(70,30,'LEFT',{s:12,c:'#6b5a2f'})}${T_(330,30,'RIGHT',{s:12,c:'#6b5a2f'})}`);}
function pulleyScene(sc,phase){const n=sc.n,lift=phase==='a'?-30:0;let ropes='';for(let i=0;i<n;i++){const x=160+i*(80/(Math.max(1,n-1)||1));ropes+=`<line x1="${x}" y1="40" x2="${x}" y2="${120+lift}" stroke="#6b5a2f" stroke-width="3"/>`;}
 return svg(`<rect x="100" y="24" width="200" height="16" rx="4" fill="#8a6a3a"/>${ropes}
  <g style="transform:translateY(${lift}px);transition:transform 1.2s ease"><rect x="150" y="120" width="100" height="50" rx="6" fill="#c49a5c" stroke="#6b5a2f" stroke-width="3"/>${T_(200,152,sc.kg+' kg',{s:18})}</g>
  ${T_(60,90,'🦩',{s:40})}${T_(330,100,n+' ropes',{s:14,c:'#6b5a2f'})}${T_(330,120,'hold it up',{s:12,w:600,c:'#6b5a2f'})}`);}
function genBay(stop,t){const k=stop;
 if(k===0){ /* which side is heavier */
  if(t<=1){const n=t?3:2,mk=()=>Array.from({length:ri(1,n)},()=>ri(1,t?9:5));let L=mk(),R=mk();const sum=a=>a.reduce((x,y)=>x+y,0);if(Math.random()<.2){R=L.slice().reverse();}
   const lt=sum(L),rt=sum(R);const ans=lt===rt?'Balanced':lt>rt?'Left':'Right';
   return {sc:{L:L.map(w=>[w,3]),R:R.map(w=>[w,3]),q:null},scene:bayScene,q:`All the blocks sit the same distance from the middle. Which side is heavier, or are they balanced?`,kind:'choice',choices:['Left','Balanced','Right'],answer:ans,
    explain:`Left: ${L.join(' + ')} = ${lt} kg. Right: ${R.join(' + ')} = ${rt} kg. ${ans==='Balanced'?'The same, so it stays level.':`The ${ans.toLowerCase()} side is heavier, so it tips down.`}`};}
  const wl=ri(2,t>2?12:8),dl=ri(1,5),wr=ri(2,t>2?12:8);let dr=ri(1,5);if(Math.random()<.25){const tq=wl*dl;const ds=[1,2,3,4,5].filter(d=>tq%d===0&&tq/d>=1&&tq/d<=15);if(ds.length){dr=one(ds);}}
  const wr2=Math.random()<.25?(wl*dl)/dr:wr;const W2=Number.isInteger(wr2)?wr2:wr;const lt=wl*dl,rt=W2*dr;const ans=lt===rt?'Balanced':lt>rt?'Left':'Right';
  return {sc:{L:[[wl,dl]],R:[[W2,dr]],q:null},scene:bayScene,q:`A block farther from the middle pushes harder. Which side tips down?`,kind:'choice',choices:['Left','Balanced','Right'],answer:ans,
   explain:`Turning power = weight × distance. Left: ${wl} × ${dl} = ${lt}. Right: ${W2} × ${dr} = ${rt}. ${ans==='Balanced'?'Equal, so it balances!':`${ans} is bigger, so the ${ans.toLowerCase()} side goes down.`}`};}
 if(k===1){ /* make it level: pick the block for the empty spot */
  if(t<=1){const L=Array.from({length:t?2:1},()=>ri(1,t?8:5)),tot=L.reduce((a,b)=>a+b,0);const pos=3;
   return {sc:{L:L.map(w=>[w,3]),R:[],q:'R',qpos:3},scene:bayScene,
    q:`Which block makes it level?`,kind:'choice',choices:opts(tot,near(tot,3)),answer:String(tot),ansN:tot,explain:`The left side has ${L.join(' + ')} = ${tot} kg at the same distance, so the right side needs ${tot} kg too.`};}
  const wl=ri(2,t>2?12:9),dl=ri(1,5),ds=[1,2,3,4,5].filter(d=>(wl*dl)%d===0&&(wl*dl)/d<=20&&d!==dl);const dr=ds.length?one(ds):dl;const need=wl*dl/dr;
  return {sc:{L:[[wl,dl]],R:[],q:'R',qpos:dr},scene:bayScene,q:`The empty spot is ${dr} away from the middle. Which block makes it level?`,kind:'choice',choices:opts(need,[wl,...near(need,3)].filter(x=>x!==need).slice(0,3)),answer:String(need),ansN:need,
   explain:`Left: ${wl} × ${dl} = ${wl*dl}. Right needs ${wl*dl} too: ? × ${dr} = ${wl*dl}, so ? = ${wl*dl} ÷ ${dr} = ${need} kg.`};}
 if(k===2){ /* find the weight */
  if(t===0){const a=ri(1,5),b=ri(1,5);return {sc:{L:[[a,3],[b,3]],R:[],q:'R',qpos:3},scene:bayScene,q:`Both left blocks sit at spot 3. What must the mystery block weigh to balance?`,kind:'num',answer:a+b,unit:'kg',explain:`${a} + ${b} = ${a+b} kg on each side.`};}
  let dl,wl,dr,need,g=0;do{dl=ri(1,5);wl=ri(2,t>2?15:9);dr=ri(1,5);need=wl*dl/dr;}while((!Number.isInteger(need)||need<1||need>(t>2?40:20)||dr===dl&&t>1&&g<5)&&g++<200);
  return {sc:{L:[[wl,dl]],R:[],q:'R',qpos:dr},scene:bayScene,q:`What must the mystery block weigh to balance? (weight × distance must match)`,kind:'num',answer:need,unit:'kg',ansN:need,
   explain:`${wl} × ${dl} = ${wl*dl}. Then ${wl*dl} ÷ ${dr} = ${need} kg.`};}
 if(k===3){ /* find the distance */
  let wl,dl,wr,dr,g=0;do{wl=ri(1,t?12:6);dl=ri(1,5);wr=ri(1,t?12:6);dr=wl*dl/wr;}while((!Number.isInteger(dr)||dr<1||dr>5||(t===0&&wl!==wr&&g<100)||(t>0&&(wl===wr||dr===dl)&&g<250))&&g++<300);
  return {sc:{L:[[wl,dl]],R:[],q:null,mov:[wr,dr]},scene:(sc,ph,r)=>bayScene(Object.assign({},sc,{R:ph==='a'?[[wr,r.ansN||dr]]:[]}),ph,r),q:`Where should the ${wr} kg block go on the right (spot 1 to 5) to balance?`,kind:'choice',choices:['1','2','3','4','5'],answer:String(dr),ansN:dr,
   explain:`Left: ${wl} × ${dl} = ${wl*dl}. Right: ${wr} × ? = ${wl*dl}, so ? = ${wl*dl} ÷ ${wr} = ${dr}.`};}
 if(k===4){ /* pulleys */
  const n=t===0?2:ri(2,t>1?6:4),per=ri(t===0?2:3,t>1?25:10),kg=n*per;
  return {sc:{n,kg},scene:pulleyScene,q:`${n} ropes share the weight of a crate that weighs ${kg} kg. How much does each rope hold up?`,kind:'num',answer:per,unit:'kg',explain:`${kg} ÷ ${n} = ${per} kg. More ropes = less work for each one. That's why pulleys make lifting easier.`};}
 return null;}

/* ---------- Motion Mountain ---------- */
/* sc = {lanes:[{e,label,d (final distance)}], max, time} */
function mtnScene(sc,phase){const W=320,max=sc.max||Math.max(...sc.lanes.map(l=>l.d),1);let flags='';const step=max<=20?(max<=10?2:5):max<=60?10:max<=200?50:100;
 for(let m=0;m<=max;m+=step)flags+=`<line x1="${40+m/max*W}" y1="44" x2="${40+m/max*W}" y2="${50+sc.lanes.length*56}" stroke="#d6dbf0" stroke-width="1"/>${T_(40+m/max*W,38,m+' m',{s:10,w:600,c:'#6b6f8f'})}`;
 const lanes=sc.lanes.map((l,i)=>{const x=40+(phase==='a'?(l.end!=null?l.end:l.d):(l.start||0))/max*W,y=78+i*56;return `<line x1="40" y1="${y+12}" x2="${40+W}" y2="${y+12}" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
  <g style="transform:translateX(${x-40}px);transition:transform 1.4s ease-out">${T_(40,y+22,l.e,{s:28})}</g>${T_(40,y-6,l.label||'',{s:11,c:'#3a3f66',a:'start'})}`;}).join('');
 return svg(`<rect width="400" height="200" fill="#eef1fb"/><path d="M0 200 L120 150 L260 175 L400 140 V200Z" fill="#dfe4f5"/>${flags}${lanes}${sc.time!=null?T_(200,20,'⏱️ '+sc.time+' seconds',{s:14,c:'#3a3f66'}):''}`);}
function genMtn(stop,t){const k=stop,E=['🛷','⛷️','🏂','🐇','🐧','🦬'];
 const S=t===0?[1,5]:t===1?[2,10]:t===2?[3,15]:[5,25],TT=t===0?[2,3]:t===1?[2,6]:t===2?[2,9]:[3,12];
 if(k===0){const tm=ri(TT[0],TT[1]);if(t<2){let a=ri(S[0],S[1]),b=ri(S[0],S[1]);if(a===b)b=a+1;const da=a*tm,db=b*tm;const e=shuf(E).slice(0,2);
   return {sc:{lanes:[{e:e[0],label:'A',d:da},{e:e[1],label:'B',d:db}],time:tm,max:Math.max(da,db)},scene:mtnScene,q:`Both raced for ${tm} seconds. A went ${da} m and B went ${db} m. Who is faster?`,kind:'choice',choices:['A','B'],answer:da>db?'A':'B',explain:`In the same time, the one who goes farther is faster: ${Math.max(da,db)} m beats ${Math.min(da,db)} m.`};}
  let sa=ri(S[0],S[1]),sb=ri(S[0],S[1]);if(sa===sb)sb++;const ta=ri(TT[0],TT[1]),tb=ri(TT[0],TT[1]);const e=shuf(E).slice(0,2);
  return {sc:{lanes:[{e:e[0],label:'A',d:sa*ta},{e:e[1],label:'B',d:sb*tb}],max:Math.max(sa*ta,sb*tb)},scene:mtnScene,q:`A went ${sa*ta} m in ${ta} s. B went ${sb*tb} m in ${tb} s. Who is faster?`,kind:'choice',choices:['A','B'],answer:sa>sb?'A':'B',
   explain:`Speed = distance ÷ time. A: ${sa*ta} ÷ ${ta} = ${sa} m/s. B: ${sb*tb} ÷ ${tb} = ${sb} m/s.`};}
 const s=ri(S[0],S[1]),tm=ri(TT[0],TT[1]),d=s*tm,e=one(E);
 if(k===1)return {sc:{lanes:[{e,label:s+' m/s',d}],time:tm,max:Math.ceil(d/10)*10||10},scene:mtnScene,q:`${e==='🐇'?'The hare':'The sled'} goes ${s} meters every second for ${tm} seconds. How far does it go?`,kind:'num',answer:d,unit:'m',explain:`${s} × ${tm} = ${d} meters. Distance = speed × time.`};
 if(k===2)return {sc:{lanes:[{e,label:s+' m/s',d}],max:Math.ceil(d/10)*10||10},scene:mtnScene,q:`The track is ${d} m long. Going ${s} meters every second, how many seconds does it take?`,kind:'num',answer:tm,unit:'s',explain:`${d} ÷ ${s} = ${tm} seconds. Time = distance ÷ speed.`};
 if(k===3)return {sc:{lanes:[{e,label:'? m/s',d}],time:tm,max:Math.ceil(d/10)*10||10},scene:mtnScene,q:`It went ${d} m in ${tm} seconds. How many meters each second?`,kind:'num',answer:s,unit:'m/s',explain:`${d} ÷ ${tm} = ${s} meters per second. Speed = distance ÷ time.`};
 if(k===4){const fast=ri(S[0]+1,S[1]),slow=ri(S[0],fast-1),tm2=ri(TT[0],TT[1]),gain=(fast-slow)*tm2,wig=Math.max(2,Math.round(gain/3));const head=t===0?0:Math.max(1,gain+ri(-wig,wig));/* close to the catch-up point, so the kid has to work it out *//* the slower racer gets the head start, so the answer can go either way */
  const slowA=Math.random()<.5,a=slowA?slow:fast,b=slowA?fast:slow,ha=slowA?head:0,hb=slowA?0:head,da=a*tm2+ha,db=b*tm2+hb;const ans=da===db?'Tie':da>db?'A':'B';const e2=shuf(E).slice(0,2);
  return {sc:{lanes:[{e:e2[0],label:'A '+a+' m/s',d:da,start:ha},{e:e2[1],label:'B '+b+' m/s',d:db,start:hb}],time:tm2,max:Math.max(da,db)},scene:mtnScene,
   q:head?`${slowA?'A':'B'} starts ${head} m ahead. A goes ${a} m/s, B goes ${b} m/s. After ${tm2} seconds, who is ahead?`:`A goes ${a} m each second, B goes ${b}. After ${tm2} seconds, who is ahead?`,kind:'choice',choices:['A','B','Tie'],answer:ans,
   explain:`A: ${ha?ha+' + ':''}${a} × ${tm2} = ${da} m. B: ${hb?hb+' + ':''}${b} × ${tm2} = ${db} m. ${ans==='Tie'?'Exactly level!':ans+' is ahead.'}`};}
 return null;}

/* ---------- Echo Canyon ---------- */
function waveSVG(y,amp,n,col,w){let d=`M30 ${y}`;const W=w||340;for(let i=0;i<=200;i++){const x=30+i/200*W;d+=` L${x.toFixed(1)} ${(y-amp*Math.sin(i/200*n*2*Math.PI)).toFixed(1)}`;}return `<path d="${d}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;}
function canScene(sc,phase){
 if(sc.waves)return svg(`<rect width="400" height="200" fill="#fff4ea"/>${sc.waves.map((w,i)=>`${T_(14,56+i*86,w.l,{s:16,c:'#a0522d'})}<line x1="30" y1="${56+i*86}" x2="370" y2="${56+i*86}" stroke="#f0d4be"/>${waveSVG(56+i*86,w.a,w.n,phase==='a'&&w.win?'#e8590c':'#a0522d')}`).join('')}`);
 if(sc.echo){const d=sc.echo;const far=Math.round(Math.min(330,120+d/6));return svg(`<rect width="400" height="200" fill="#ffe8d6"/><path d="M${far} 0 H400 V200 H${far-10} Q${far+10} 100 ${far} 0Z" fill="#c8794a"/>${T_(50,150,'🗣️',{s:34})}
  ${[0,1,2].map(i=>`<path d="M${80+i*16} 120 q12 -20 0 -40" fill="none" stroke="#a0522d" stroke-width="3" opacity="${phase==='a'?.3:.9}"/>`).join('')}${phase==='a'?[0,1,2].map(i=>`<path d="M${far-20-i*16} 120 q-12 -20 0 -40" fill="none" stroke="#e8590c" stroke-width="3"/>`).join('')+T_((50+far)/2,60,(sc.dist?sc.dist+' m':''),{s:16,c:'#e8590c'}):''}
  ${T_(200,30,'⏱️ echo after '+sc.t+' s',{s:14,c:'#7a3e1c'})}`);}
 if(sc.storm){return svg(`<rect width="400" height="200" fill="#2f3550"/>${T_(310,110,'⛈️',{s:60})}${T_(80,160,'🧒',{s:40})}${phase==='a'?T_(200,120,'≈ '+sc.km+' km',{s:22,c:'#ffd43b'}):''}${T_(200,30,sc.label,{s:14,c:'#dee2ff'})}`);}
 if(sc.tubes){return svg(`<rect width="400" height="200" fill="#fff4ea"/>${sc.tubes.map((h,i)=>`<rect x="${70+i*80}" y="${170-h}" width="40" height="${h}" rx="6" fill="${phase==='a'&&i===sc.win?'#e8590c':'#c8794a'}"/>${T_(90+i*80,190,String.fromCharCode(65+i),{s:14,c:'#7a3e1c'})}`).join('')}`);}
 if(sc.str){return svg(`<rect width="400" height="200" fill="#fff4ea"/>${T_(200,30,sc.label,{s:13,c:'#7a3e1c'})}<line x1="40" y1="100" x2="${40+sc.len*5}" y2="100" stroke="#7a3e1c" stroke-width="4"/><circle cx="40" cy="100" r="6" fill="#7a3e1c"/><circle cx="${40+sc.len*5}" cy="100" r="6" fill="#7a3e1c"/>${T_(40+sc.len*2.5,128,sc.len+' cm',{s:13,c:'#7a3e1c'})}`);}
 return svg('');}
function genCan(stop,t){const k=stop;
 if(k===0){const a1=ri(10,36);let a2=ri(10,36);if(Math.abs(a1-a2)<8)a2=a1>23?a1-14:a1+14;const n=ri(2,5);const win=a1>a2?0:1;
  return {sc:{waves:[{l:'A',a:a1,n,win:win===0},{l:'B',a:a2,n,win:win===1}]},scene:canScene,q:`Which sound is louder?`,kind:'choice',choices:['A','B'],answer:win?'B':'A',explain:`Taller waves carry more energy, so they sound louder. How tall a wave is (its amplitude) is its loudness.`};}
 if(k===1){if(t<2){const n1=ri(2,4);let n2=ri(4,9);if(n2===n1)n2++;const top=Math.random()<.5;const A=top?n2:n1,B=top?n1:n2;
   return {sc:{waves:[{l:'A',a:22,n:A,win:A>B},{l:'B',a:22,n:B,win:B>A}]},scene:canScene,q:`Which sound has the higher pitch (a higher note)?`,kind:'choice',choices:['A','B'],answer:A>B?'A':'B',explain:`More waves squeezed into the same time means a higher note. Count them: A has ${A}, B has ${B}.`};}
  const n1=ri(2,4),m=ri(2,3),n2=n1*m;return {sc:{waves:[{l:'A',a:22,n:n1},{l:'B',a:22,n:n2,win:true}]},scene:canScene,q:`Both pictures show the same tiny slice of time. A makes ${n1} waves and B makes ${n2}. How many times higher is B's frequency?`,kind:'num',answer:m,unit:'times',explain:`${n2} ÷ ${n1} = ${m}. Frequency means waves per second, and higher frequency sounds higher.`};}
 if(k===2){ /* echo; sound in air ≈ 340 m/s */
  if(t===0){const near_=ri(2,4)*20,far_=near_*ri(2,3),last=Math.random()<.5;return {sc:{echo:last?far_:near_,t:'?'},scene:canScene,q:`One cliff is ${near_} m away and another is ${far_} m away. Which echo comes back ${last?'last':'first'}?`,kind:'choice',choices:['The near cliff','The far cliff'],answer:last?'The far cliff':'The near cliff',explain:last?`Sound has a longer trip to the far cliff and back, so its echo comes last.`:`Sound has a shorter trip to the near cliff and back, so its echo comes first.`};}
  if(t===1){const s=ri(1,3);return {sc:{echo:340*s,t:s,dist:340*s},scene:canScene,q:`Sound travels about 340 meters every second. How far does it travel in ${s} second${s>1?'s':''}?`,kind:'num',answer:340*s,unit:'m',explain:`340 × ${s} = ${340*s} meters.`};}
  const s=ri(1,6)*(t>2?1:1);const dist=340*s/2;return {sc:{echo:dist,t:s,dist},scene:canScene,q:`You shout and hear the echo after ${s} second${s>1?'s':''}. Sound goes about 340 m each second. How far away is the cliff?`,kind:'num',answer:dist,unit:'m',
   explain:`In ${s} s the sound goes 340 × ${s} = ${340*s} m. But that's there AND back, so the cliff is ${340*s} ÷ 2 = ${dist} m away.`};}
 if(k===3){ /* thunder: about 3 seconds per kilometer */
  if(t===0){const a=ri(2,4)*3,b=Math.random()<.5?a-3:a+ri(1,2)*3,cl=b<a;return {sc:{storm:1,km:'',label:`Count: ${a} seconds… later ${b}`},scene:canScene,q:`After the flash you counted ${a} seconds to the thunder. Later you counted ${b}. Is the storm coming closer or going away?`,kind:'choice',choices:['Closer','Going away'],answer:cl?'Closer':'Going away',explain:cl?`Fewer seconds means the sound had less far to travel, so the storm is closer.`:`More seconds means the sound had farther to travel, so the storm is moving away.`};}
  const sec=ri(1,t>1?10:5)*3;const km=sec/3;return {sc:{storm:1,km,label:`⚡ flash … ${sec} seconds … 🔊 boom`},scene:canScene,q:`Thunder takes about 3 seconds to travel 1 kilometer. You count ${sec} seconds. About how many kilometers away is the storm?`,kind:'num',answer:km,unit:'km',
   explain:`${sec} ÷ 3 = ${km} km. Light from the flash arrives almost at once; the sound is much slower.`};}
 if(k===4){if(t<2){const hs=shuf([40,70,100,130]).slice(0,3);const win=hs.indexOf(Math.min(...hs));return {sc:{tubes:hs,win},scene:canScene,q:`Blow across these pipes. Which one plays the highest note?`,kind:'choice',choices:['A','B','C'],answer:'ABC'[win],explain:`The shortest pipe has the shortest column of air to wiggle, so it plays the highest note.`};}
  const len=one([40,60,80,90,120]),f=one([100,150,200,220,300]),m=one([2,2,3]);return {sc:{str:1,len,label:`${len} cm string plays ${f} waves per second`},scene:canScene,q:`A ${len} cm string plays ${f} waves each second. If you press it so only ${len/m} cm can wiggle (${m===2?'half':'a third'} as long), how many waves each second does it play?`,kind:'num',answer:f*m,unit:'per second',
   explain:`${m===2?'Half':'A third'} as long wiggles ${m} times as fast: ${f} × ${m} = ${f*m}. That's a higher note.`};}
 return null;}

/* ---------- Circuit City ---------- */
/* sc = {bats:n, bulbs:n, gap:bool, sw:'open'|'closed'|null, lit (after), bright: 'bright'|'dim', label} */
function cityPair(sc,phase){const lit=phase==='a';const one_=(x0,n,par,label,dim)=>{const bulbs=par?[[x0+60,40],[x0+120,40]]:n===1?[[x0+90,40]]:[[x0+60,40],[x0+120,40]];
  const b=bulbs.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="15" fill="${lit?(dim?'#ffe8a3':'#ffd43b'):'#f1f3f5'}" stroke="#495057" stroke-width="2"/>${lit?`<circle cx="${x}" cy="${y}" r="${dim?20:28}" fill="#ffe066" opacity=".35"/>`:''}`).join('');
  const wires=par?`<path d="M${x0+10} 90 V40 H${x0+170} V160 H${x0+10} V120" fill="none" stroke="#e8590c" stroke-width="4"/><path d="M${x0+120} 40 V100 H${x0+60} V40" fill="none" stroke="#e8590c" stroke-width="3"/>`:`<path d="M${x0+10} 90 V40 H${x0+170} V160 H${x0+10} V120" fill="none" stroke="#e8590c" stroke-width="4"/>`;
  return `${wires}<rect x="${x0}" y="90" width="22" height="30" rx="3" fill="#495057"/><rect x="${x0+4}" y="94" width="14" height="22" fill="#fab005"/>${b}${T_(x0+90,190,label,{s:13,c:'#7a3e1c'})}`;};
 const two=(x,l)=>one_(x,2,sc.par,l+(sc.par?': two bulbs side by side':': two bulbs in a row'),!sc.par),single=(x,l)=>one_(x,1,false,l+': one bulb',false);
 return svg(`<rect width="400" height="200" fill="#fff8f0"/>${sc.swap?two(10,'A')+single(210,'B'):single(10,'A')+two(210,'B')}`);}
function cityScene(sc,phase){const lit=phase==='a'&&sc.lit;const nb=sc.bulbs||1;
 const bulb=(x,y)=>`<g><circle cx="${x}" cy="${y}" r="16" fill="${lit?(sc.dim?'#ffe8a3':'#ffd43b'):'#f1f3f5'}" stroke="#495057" stroke-width="2"/>${lit?`<circle cx="${x}" cy="${y}" r="${sc.dim?22:30}" fill="#ffe066" opacity=".35"/>`:''}<path d="M${x-6} ${y+16} h12 v8 h-12z" fill="#868e96"/></g>`;
 let bulbs='';for(let i=0;i<nb;i++)bulbs+=bulb(nb===1?200:150+i*100/(nb-1||1),40);
 let bats='';const n=sc.bats||1;for(let i=0;i<n;i++)bats+=`<g><rect x="${30}" y="${70+i*(90/n)}" width="30" height="${Math.min(26,80/n)}" rx="3" fill="#495057"/><rect x="34" y="${74+i*(90/n)}" width="22" height="${Math.min(18,80/n-8)}" fill="#fab005"/></g>`;
 const gapX=sc.gap?'<rect x="190" y="164" width="30" height="14" fill="#fff8f0"/>'+(sc.bridge?T_(205,180,sc.bridge,{s:26}):''):'';
 const sw=sc.sw?`<line x1="330" y1="${sc.sw==='open'?92:100}" x2="${sc.sw==='open'?352:340}" y2="${sc.sw==='open'?72:100}" stroke="#c92a2a" stroke-width="5" stroke-linecap="round"/>${T_(360,90,sc.sw==='open'?'off':'on',{s:11,c:'#c92a2a'})}`:'';
 return svg(`<rect width="400" height="200" fill="#fff8f0"/><path d="M45 70 V40 H340 V170 H45 V160" fill="none" stroke="#e8590c" stroke-width="4"/>${sc.sw?'<rect x="326" y="80" width="28" height="40" fill="#fff8f0"/><circle cx="330" cy="100" r="4" fill="#c92a2a"/><circle cx="340" cy="120" r="4" fill="#c92a2a"/><line x1="340" y1="120" x2="340" y2="170" stroke="#e8590c" stroke-width="4"/>':''}${gapX}${bats}${bulbs}${sw}${sc.label?T_(200,192,sc.label,{s:12,c:'#7a3e1c'}):''}`);}
function genCity(stop,t){const k=stop;
 if(k===0){const kind=one(t===0?['ok','ok','gap','open']:['ok','ok2','gap','open']);const lit=kind==='ok'||kind==='ok2';
  return {sc:{bats:1,bulbs:kind==='ok2'?2:1,gap:kind==='gap',sw:kind==='open'?'open':kind==='ok'?'closed':null,lit},scene:cityScene,q:`Will the bulb${kind==='ok2'?'s':''} light up?`,kind:'choice',choices:['Yes','No'],answer:lit?'Yes':'No',
   explain:lit?`The wire makes a full loop from the battery, through the bulb and back. Electricity can flow!`:kind==='gap'?`There's a gap in the wire, so the loop is broken. No loop, no light.`:`The switch is off, which opens a gap in the loop. No loop, no light.`};}
 if(k===1){if(t===0){const a=ri(1,3),b=a+ri(1,2);const first=Math.random()<.5;return {sc:{bats:first?b:a,bulbs:1,lit:true},scene:cityScene,q:`Flashlight A has ${first?b:a} batteries in a row. Flashlight B has ${first?a:b}. Which one shines brighter?`,kind:'choice',choices:['A','B'],answer:first?'A':'B',explain:`Batteries in a row add their push (voltage), so more batteries make the bulb brighter.`};}
  const n=t===1?one([2,4,6,8]):ri(1,8);return {sc:{bats:n,bulbs:1,lit:true,label:'each battery ≈ 1.5 volts'},scene:cityScene,q:`Each battery gives about 1.5 volts. How many volts do ${n} batteries in a row give?`,kind:'num',answer:n*1.5,unit:'volts',explain:`${n} × 1.5 = ${fmtN(n*1.5)} volts. Batteries in a row add up.`};}
 if(k===2){const par=t>=2&&Math.random()<.4,swap=Math.random()<.5,dimQ=Math.random()<.5,S1=swap?'B':'A',S2=swap?'A':'B';
  if(par)return {sc:{par:true,swap},scene:cityPair,q:`Each circuit has one battery. Which bulbs glow brighter: ${S1}'s single bulb, or each of ${S2}'s two bulbs side by side?`,kind:'choice',choices:['A','B','The same'],answer:'The same',explain:`Side by side (in parallel), each bulb has its own path and gets the battery's full push, so each glows as brightly as ${S1}'s bulb. The battery runs down faster, though.`};
  return {sc:{par:false,swap},scene:cityPair,q:`Each circuit has one battery. Which glows ${dimQ?'dimmer':'brighter'}: ${S1}'s single bulb, or one of ${S2}'s two bulbs in a row?`,kind:'choice',choices:['A','B','The same'],answer:dimQ?S2:S1,explain:`Bulbs in a row share the battery's push, so each of ${S2}'s bulbs gets less and glows dimmer than ${S1}'s.`};}
 if(k===3){if(t<2){const o=one([['🔑','a metal key',1],['📎','a metal paper clip',1],['🥄','a metal spoon',1],['🪙','a coin',1],['🧽','a sponge',0],['🥢','a wooden chopstick',0],['🎈','a rubber balloon',0],['🧦','a sock',0],['📏','a plastic ruler',0]]);
   return {sc:{bats:1,bulbs:1,gap:true,bridge:o[0],lit:!!o[2],label:`${o[1]} across the gap`},scene:cityScene,q:`There's a gap in the wire. If you lay ${o[1]} across the gap, will the bulb light?`,kind:'choice',choices:['Yes','No'],answer:o[2]?'Yes':'No',
    explain:o[2]?`Metal lets electricity through (it's a conductor), so it closes the loop.`:`${o[1][0].toUpperCase()+o[1].slice(1)} doesn't let electricity through (it's an insulator), so the loop stays broken.`};}
  const R=one([2,3,4,5,6,10]),I=ri(1,t>2?6:4),V=R*I;const ask=one(t>2?['I','V','R']:['I','V']);
  if(ask==='I')return {sc:{bats:Math.min(6,Math.ceil(V/1.5)),bulbs:1,lit:true,label:`${V} volts · ${R} ohms`},scene:cityScene,q:`Amps = volts ÷ ohms. ${V} volts push through a ${R} ohm bulb. How many amps flow?`,kind:'num',answer:I,unit:'amps',explain:`${V} ÷ ${R} = ${I} amps (Ohm's law).`};
  if(ask==='V')return {sc:{bats:Math.min(6,Math.ceil(V/1.5)),bulbs:1,lit:true,label:`${I} amps · ${R} ohms`},scene:cityScene,q:`Volts = amps × ohms. ${I} amps flow through a ${R} ohm bulb. How many volts?`,kind:'num',answer:V,unit:'volts',explain:`${I} × ${R} = ${V} volts (Ohm's law).`};
  return {sc:{bats:Math.min(6,Math.ceil(V/1.5)),bulbs:1,lit:true,label:`${V} volts · ${I} amps`},scene:cityScene,q:`Ohms = volts ÷ amps. ${V} volts make ${I} amps flow. How many ohms is the bulb?`,kind:'num',answer:R,unit:'ohms',explain:`${V} ÷ ${I} = ${R} ohms (Ohm's law).`};}
 if(k===4){if(t===0){const a=ri(2,6),b=ri(1,a-1);return {sc:{bats:1,bulbs:Math.min(3,a),lit:true,label:`${a} lights on, then ${b} switched off`},scene:cityScene,q:`${a} lights are on. You switch off ${b}. How many are still using electricity?`,kind:'num',answer:a-b,unit:'lights',explain:`${a} − ${b} = ${a-b}. Switching lights off saves energy.`};}
  if(t===1){const w=one([5,10,20,25,50]),n=ri(2,6);return {sc:{bats:1,bulbs:Math.min(3,n),lit:true,label:`${n} bulbs × ${w} watts`},scene:cityScene,q:`Each bulb uses ${w} watts. How many watts do ${n} bulbs use?`,kind:'num',answer:w*n,unit:'watts',explain:`${w} × ${n} = ${w*n} watts.`};}
  const V=one([6,9,12,120]),A=V===120?ri(1,5):ri(1,4);return {sc:{bats:1,bulbs:1,lit:true,label:`${V} volts × ${A} amps`},scene:cityScene,q:`Watts = volts × amps. A ${V} volt lamp draws ${A} amps. How many watts?`,kind:'num',answer:V*A,unit:'watts',explain:`${V} × ${A} = ${V*A} watts.`};}
 return null;}

/* ---------- Float or Sink Lagoon ---------- */
/* sc = {e, label, floats (after), boat:{cap,crate,n}} */
function boxScene(sc,phase){return svg(`<rect width="400" height="200" fill="#e6fcf5"/><rect x="30" y="60" width="340" height="130" rx="10" fill="#74c0fc" opacity=".75"/>${sc.boxes.map(([m,v,sink],i)=>{const x=80+i*120,y=phase==='a'?(sink?150:66):34;return `<g style="transform:translateY(${y}px);transition:transform 1.4s cubic-bezier(.3,1.2,.5,1)"><rect x="${x-26}" y="0" width="52" height="34" rx="5" fill="#ffd8a8" stroke="#a0522d" stroke-width="2"/>${T_(x,22,'ABC'[i],{s:18,c:'#7a3e1c'})}</g>${T_(x,24,`${m} g · ${v} cm³`,{s:11,c:'#0b7285'})}`;}).join('')}`);}
function lagScene(sc,phase){const fl=sc.floats;const y=phase==='a'?(fl?72:160):40;
 if(sc.boat){const n=phase==='a'?sc.boat.n:0;let cr='';for(let i=0;i<Math.min(n,12);i++)cr+=`<rect x="${150+(i%6)*18}" y="${70-Math.floor(i/6)*16}" width="16" height="14" fill="#c49a5c" stroke="#6b5a2f"/>`;
  return svg(`<rect width="400" height="200" fill="#e6fcf5"/><rect x="0" y="100" width="400" height="100" fill="#74c0fc" opacity=".8"/>${T_(200,108,'🛶',{s:96})}${cr}${T_(200,26,`Boat holds up to ${sc.boat.cap} kg · crates ${sc.boat.crate} kg each`,{s:13,c:'#0b7285'})}`);}
 return svg(`<rect width="400" height="200" fill="#e6fcf5"/><rect x="60" y="60" width="280" height="130" rx="10" fill="#74c0fc" opacity="${sc.salty?.95:.75}"/>${sc.salty?T_(310,180,'🧂',{s:20}):''}
  <g style="transform:translateY(${y-40}px);transition:transform 1.4s cubic-bezier(.3,1.2,.5,1)">${T_(200,72,sc.e,{s:46})}</g>${sc.label?T_(200,26,sc.label,{s:14,c:'#0b7285'}):''}`);}
const OBJ=[['🪵','a wooden block',1],['🪨','a rock',0],['🍎','an apple',1],['🪙','a coin',0],['🧊','an ice cube',1],['🔑','a key',0],['🦆','a rubber duck',1],['🔮','a glass marble',0],['🍃','a leaf',1],['🥄','a metal spoon',0],['🥚','a fresh egg',0],['🎾','a tennis ball',1],['🍋','a lemon',1]];
function genLag(stop,t){const k=stop;
 if(k===0){const o=one(OBJ);return {sc:{e:o[0],label:o[1],floats:!!o[2]},scene:lagScene,q:`Will ${o[1]} float or sink in fresh water?`,kind:'choice',choices:['Float','Sink'],answer:o[2]?'Float':'Sink',
   explain:o[2]?`${o[1][0].toUpperCase()+o[1].slice(1)} is lighter than the same amount of water, so the water holds it up.`:`${o[1][0].toUpperCase()+o[1].slice(1)} is heavier than the same amount of water, so it sinks.`};}
 if(k===1){const big=t===0?20:t===1?100:t===2?1000:2000;let v=ri(Math.ceil(big/10),big),m=ri(Math.ceil(big/10),big);if(m===v)m+=1;const fl=m<v;
  return {sc:{e:one(['📦','🧸','🎁','🧱','🪣']),label:`${m} g, and it takes up as much room as ${v} g of water`,floats:fl},scene:lagScene,q:`This toy weighs ${m} grams. The same amount of water would weigh ${v} grams. Float or sink?`,kind:'choice',choices:['Float','Sink'],answer:fl?'Float':'Sink',
   explain:`${m} is ${fl?'less':'more'} than ${v}. ${fl?'Lighter than its own amount of water: it floats.':'Heavier than its own amount of water: it sinks.'}`};}
 if(k===2){if(t<2){const sink=ri(0,2),big=t?60:30;const nums=[0,1,2].map(i=>{const v=ri(10,big);const m=i===sink?v+ri(3,t?25:12):Math.max(1,v-ri(3,Math.min(t?25:9,v-1)));return [m,v];});
   return {sc:{boxes:nums.map(([m,v],i)=>[m,v,i===sink])},scene:boxScene,q:`Water weighs 1 gram for every cubic centimeter. Which box sinks? ${nums.map(([m,v],i)=>`${'ABC'[i]}: ${m} g, ${v} cm³`).join(' · ')}`,kind:'choice',choices:['A','B','C'],answer:'ABC'[sink],
    explain:`Box ${'ABC'[sink]} has more grams (${nums[sink][0]}) than cubic centimeters (${nums[sink][1]}), so it is denser than water and sinks.`};}
  const d=one(t>2?[0.5,0.8,1.5,2,2.5,3,7,0.2]:[2,3,4,5,0.5]),v=one(d<1?[10,20,40,50,100]:[10,20,30,40,50]);const m=d*v;
  return {sc:{e:d>1?'🔩':'🪵',label:`${fmtN(m)} g · ${v} cm³`,floats:d<1},scene:lagScene,q:`Density = mass ÷ volume. It has a mass of ${fmtN(m)} g and a volume of ${v} cm³. What is its density in g/cm³?`,kind:'num',answer:d,unit:'g/cm³',
   explain:`${fmtN(m)} ÷ ${v} = ${fmtN(d)} g/cm³. Water is 1 g/cm³, so it ${d<1?'floats':'sinks'}.`};}
 if(k===3){const crate=t===0?one([2,5,10]):t===1?one([3,4,5,6,8,10]):one([6,7,8,9,12,15]),n=ri(t===0?2:3,t===0?6:t===1?10:12),extra=t>1?ri(0,crate-1):0,cap=crate*n+extra;
  return {sc:{boat:{cap,crate,n}},scene:lagScene,q:`The boat can carry ${cap} kg before it sinks. Each crate weighs ${crate} kg. What is the most crates it can carry?`,kind:'num',answer:n,unit:'crates',explain:`${cap} ÷ ${crate} = ${n}${extra?` remainder ${extra}`:''}. One more crate would make ${crate*(n+1)} kg, too much!`};}
 if(k===4){if(t<2){const qq=one([['🥚','An egg sinks in tap water. You stir in lots of salt. Now the egg…',['Floats','Sinks'],'Floats',true,true],['🥔','A potato slice sinks in fresh water. You stir in lots of salt. Now it…',['Floats','Sinks'],'Floats',true,true],['🥚','An egg floats in very salty water. You pour in lots of fresh water. Now it…',['Floats','Sinks'],'Sinks',false,false],['🏊','Where is it easier for a swimmer to float?',['In the salty sea','In a fresh lake'],'In the salty sea',true,true],['🧊','Which water pushes up harder on things?',['Very salty water','Fresh water'],'Very salty water',true,true]]);
   return {sc:{e:qq[0],salty:qq[5],floats:qq[4],label:qq[5]?'very salty water':'fresh water added'},scene:lagScene,q:qq[1],kind:'choice',choices:qq[2],answer:qq[3],explain:`Salt makes water heavier for its size (denser), so it pushes up harder on things in it. Less salt, less push.`};}
  const w=one([1.03,1.1,1.2,1.24]),o=one([0.9,1.05,1.1,1.15,1.3]);const fl=o<w;return {sc:{e:'🧊',salty:true,label:`salty water ${w} g/cm³ · object ${o} g/cm³`,floats:fl},scene:lagScene,q:`The salty water's density is ${w} g/cm³ (the Dead Sea is about 1.24). An object's density is ${o} g/cm³. Float or sink?`,kind:'choice',choices:['Float','Sink'],answer:fl?'Float':'Sink',
   explain:`${o} is ${fl?'less':'more'} than ${w}, so it ${fl?'floats':'sinks'} in this water.`};}
 return null;}
const GEN={bay:genBay,mountain:genMtn,canyon:genCan,city:genCity,lagoon:genLag};
function makeRound(zid,stop,t){const g=GEN[zid];for(let k=0;k<20;k++){const s=stop===5?ri(0,4):stop;const r=g(s,t);if(r){r.ansN=r.ansN!=null?r.ansN:+r.answer;return r;}}return null;}

/* ================= screens ================= */
let RUN=null; /* the stop being played: {zid,stop,t,rounds,i,tries,first:[],done} — kept here, never in the save, until the stop ends */
function css(){if(document.getElementById('phCSS'))return;const s=document.createElement('style');s.id='phCSS';s.textContent=`
.ph-path{display:grid;gap:10px;max-width:640px;margin:0 auto}.ph-stop{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:#fff;border:3px solid #e9e4ff;text-align:left;font:inherit;color:inherit;cursor:pointer;width:100%}
.ph-stop.lock{opacity:.55;cursor:default}.ph-stop .e{font-size:36px}.ph-stop b{display:block;font-size:18px}.ph-stop small{color:#6b6490}.ph-stop .st{margin-left:auto;font-size:18px;white-space:nowrap}
.ph-play{max-width:640px;margin:0 auto;background:#fff;border-radius:20px;padding:14px;box-shadow:0 6px 18px rgba(0,0,0,.15)}
.ph-svg{width:100%;height:auto;border-radius:14px;display:block;background:#f8f9fa}.ph-q{font-size:20px;font-weight:700;margin:12px 0 8px;line-height:1.35}
.ph-dots{display:flex;gap:6px;justify-content:center;margin-bottom:8px}.ph-dots i{width:14px;height:14px;border-radius:50%;background:#e9e4ff}.ph-dots i.ok{background:#40c057}.ph-dots i.no{background:#fa5252}.ph-dots i.now{outline:3px solid #7048e8}
.ph-ch{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}.ph-ch button{font:inherit;font-size:19px;font-weight:700;padding:12px;border-radius:14px;border:3px solid #d0bfff;background:#f8f5ff;color:#2b2340;cursor:pointer;min-height:52px}
.ph-ch button.right{background:#d3f9d8;border-color:#40c057}.ph-ch button.wrong{background:#ffe3e3;border-color:#fa5252}
.ph-in{display:flex;align-items:center;justify-content:center;gap:8px;font-size:26px;font-weight:800;margin:6px 0}.ph-in .box{min-width:110px;border:3px dashed #b197fc;border-radius:12px;padding:4px 10px;text-align:center;background:#f8f5ff}
.ph-pad{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:360px;margin:0 auto}.ph-pad button{font:inherit;font-size:22px;font-weight:700;padding:10px;border-radius:12px;border:0;background:#f1ecff;color:#2b2340;min-height:50px;cursor:pointer}.ph-pad button.go{background:#40c057;color:#fff}
.ph-fb{margin-top:10px;padding:10px 12px;border-radius:14px;font-size:17px;line-height:1.4}.ph-fb.ok{background:#ebfbee}.ph-fb.no{background:#fff5f5}
.ph-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px}`;document.head.appendChild(s);}
function head(title,back){return topbar()+`<div class="page"><div class="zhead"><button class="btn ghost small backbtn" onclick="${back}">← ${back.includes('district')?'Discovery District':'Back'}</button><h2 class="title">${title}</h2></div>`;}
/* the zone's path of stops */
function zoneScreen(zid){const p=P(),z=ZBY[zid];if(!p||!z){go('district');return;}css();data(p);RUN=null;const st=p.phys[zid];
 app.innerHTML=head(`${z.art} ${esc(z.name)}`,"go('district')")+`<p class="muted" style="text-align:center;margin:-4px 0 12px">${esc(z.about)} · ⭐ ${zoneStars(p,zid)} / 18</p><div class="ph-path">${z.stops.map((s,i)=>{const ok=unlocked(p,zid,i),n=st[i]||0;
  return `<button class="ph-stop ${ok?'':'lock'}" ${ok?`onclick="Physics.play('${zid}',${i})"`:''}><span class="e">${ok?s[0]:'🔒'}</span><span><b>${i+1}. ${esc(s[1])}</b><small>${esc(s[2])}${ok?'':' · beat the stop before to open'}</small></span><span class="st">${n?'⭐'.repeat(n)+'☆'.repeat(3-n):ok?'☆☆☆':''}</span></button>`;}).join('')}</div>
  <p class="muted" style="text-align:center;margin-top:12px">Each stop has ${ROUNDS} questions (the boss has ${BOSS_ROUNDS}). Get at least 3 right on the first try to open the next stop.</p></div>`;}
function play(zid,stop){const p=P();if(!p||!ZBY[zid]||!unlocked(p,zid,stop))return;css();const t=tierOf(p),n=stop===5?BOSS_ROUNDS:ROUNDS;
 const rounds=[];for(let i=0;i<n;i++){let r=makeRound(zid,stop,t),g=0;while(r&&rounds.some(x=>x.q===r.q)&&g++<8)r=makeRound(zid,stop,t);if(r)rounds.push(r);}
 RUN={zid,stop,t,rounds,i:0,tries:0,first:[],inp:'',done:false};go('phys',zid+':'+stop);}
function drawPlay(){const R=RUN;if(!R){go('district');return;}const z=ZBY[R.zid],s=z.stops[R.stop],r=R.rounds[R.i];if(!r){finish();return;}
 const dots=R.rounds.map((_,i)=>`<i class="${i<R.first.length?(R.first[i]?'ok':'no'):i===R.i?'now':''}"></i>`).join('');const phase=R.phase||'q';
 const input=r.kind==='choice'?`<div class="ph-ch">${r.choices.map(c=>`<button data-c="${esc(c)}" ${phase==='a'?'disabled':''} class="${phase==='a'&&String(c)===String(r.answer)?'right':R.picked===c&&phase!=='q'?'wrong':''}">${esc(c)}</button>`).join('')}</div>`
  :`<div class="ph-in"><span class="box" id="phBox">${esc(R.inp)||'&nbsp;'}</span>${r.unit?`<span style="font-size:18px">${esc(r.unit)}</span>`:''}</div>${phase==='a'?'':`<div class="ph-pad">${['7','8','9','⌫','4','5','6','.','1','2','3','0'].map(k=>`<button data-k="${k}">${k}</button>`).join('')}<button class="go" data-k="go" style="grid-column:1/-1">✓ Test it!</button></div>`}`;
 app.innerHTML=head(`${s[0]} ${esc(s[1])}`,`Physics.zone('${R.zid}')`)+`<div class="ph-play"><div class="ph-dots">${dots}</div>${r.scene(r.sc,phase,r)}
  <div class="ph-q">${esc(r.q)} <button class="btn small ghost dark" style="vertical-align:middle;padding:2px 8px;min-height:32px" onclick="Physics._say()" aria-label="Read it to me">🔊</button></div>${input}<div id="phFb">${R.fb||''}</div>
  ${phase==='a'?`<div class="ph-row"><button class="btn green big" onclick="Physics._next()">${R.i+1<R.rounds.length?'Next ➜':'Finish ➜'}</button></div>`:''}</div></div>`;
 app.querySelectorAll('.ph-ch button[data-c]').forEach(b=>b.onclick=()=>answer(b.dataset.c));
 app.querySelectorAll('.ph-pad button').forEach(b=>b.onclick=()=>key(b.dataset.k));
 if(phase==='q'&&R.tries===0&&!R.spoke){R.spoke=1;try{const p=P();if(p&&!p.adult&&(+p.grade||3)<=2&&voiceOn())say(speakable(r.q),.9);}catch(e){}}}
function key(k){const R=RUN;if(!R||R.phase==='a')return;if(k==='go'){if(R.inp===''||R.inp==='.')return;answer(R.inp);return;}
 if(k==='⌫')R.inp=R.inp.slice(0,-1);else if(k==='.'){if(!R.inp.includes('.'))R.inp+=R.inp?'.':'0.';}else if(R.inp.replace('.','').length<6)R.inp+=k;
 const b=document.getElementById('phBox');if(b)b.innerHTML=esc(R.inp)||'&nbsp;';try{SFX.tap();}catch(e){}}
function answer(v){const R=RUN;if(!R||R.phase==='a')return;const r=R.rounds[R.i];
 const ok=r.kind==='choice'?String(v)===String(r.answer):Math.abs(parseFloat(v)-Number(r.answer))<1e-6;
 const p=P();try{const dk=dayKey();p.daily=p.daily||{};p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][ok?'r':'w']++;save();}catch(e){}
 if(ok){if(R.tries===0)R.first.push(true);else R.first.push(false);R.phase='a';R.picked=null;try{SFX.correct();}catch(e){}
  if(r.kind==='num')r.ansN=Number(r.answer);R.fb=`<div class="ph-fb ok"><b>✅ ${R.tries?'Got it!':'Yes!'}</b> ${esc(r.explain)}</div>`;drawPlay();return;}
 R.tries++;try{SFX.wrong();}catch(e){}
 if(R.tries>=2){R.first.push(false);R.phase='a';R.picked=String(v);const at=r.kind==='num'?fmtN(Number(r.answer))+(r.unit?' '+r.unit:''):String(r.answer);R.fb=`<div class="ph-fb no"><b>The answer is ${esc(at)}.</b> ${esc(r.explain)}</div>`;drawPlay();return;}
 R.inp='';R.picked=String(v);R.fb=`<div class="ph-fb no">Not quite. Have another look and try again!</div>`;drawPlay();
 if(r.kind==='choice'){const b=[...app.querySelectorAll('.ph-ch button')].find(x=>x.dataset.c===String(v));if(b){b.classList.add('wrong');b.disabled=true;}}}
function next(){const R=RUN;if(!R)return;R.i++;R.tries=0;R.inp='';R.phase='q';R.fb='';R.picked=null;R.spoke=0;if(R.i>=R.rounds.length){finish();return;}drawPlay();}
function finish(){const R=RUN;if(!R||R.done)return;R.done=true;const p=P();data(p);const z=ZBY[R.zid],n=R.rounds.length,right=R.first.filter(Boolean).length;
 const stars=right>=n?3:right>=n-1?2:right>=3?1:0;const old=p.phys[R.zid][R.stop]||0;let coins=0,badge=false;
 if(stars>old){if(!old&&stars>=1){coins+=R.stop===5?COIN_BOSS:COIN_BASE+COIN_STEP*R.stop;if(R.stop===5)badge=true;}coins+=COIN_STAR*(stars-Math.max(old,stars>=1&&!old?1:old));p.phys[R.zid][R.stop]=stars;}
 if(coins>0)p.coins=(p.coins||0)+coins;save();try{SFX[stars?'win':'wrong']();}catch(e){}
 const nxt=R.stop<5&&stars>=1?R.stop+1:null;
 app.innerHTML=head(`${z.art} ${esc(z.name)}`,`Physics.zone('${R.zid}')`)+`<div class="ph-play" style="text-align:center"><div style="font-size:64px">${stars?(badge?'🏅':z.stops[R.stop][0]):'💪'}</div>
  <h2>${stars?(badge?`You beat ${esc(z.stops[5][1])}!`:'Stop cleared!'):'So close!'}</h2><p style="font-size:20px">${right} of ${n} right on the first try</p><p style="font-size:30px;margin:4px 0">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</p>
  ${coins?`<p><b>+${coins} 🪙</b>${badge?` and the <b>${esc(z.name)} badge</b>!`:''}</p>`:stars&&stars<=old?'<p class="muted">You already had these stars. Go for 3!</p>':''}${stars?'':'<p>Get at least 3 right on the first try to open the next stop. Try again: the questions change each time!</p>'}
  <div class="ph-row">${nxt!=null?`<button class="btn green big" onclick="Physics.play('${R.zid}',${nxt})">Next stop ➜</button>`:''}<button class="btn ${nxt!=null?'ghost dark':'green big'}" onclick="Physics.play('${R.zid}',${R.stop})">${stars?'Play again':'Try again'}</button><button class="btn ghost dark" onclick="Physics.zone('${R.zid}')">Back to the path</button></div></div></div>`;}
function screen(arg){const a=String(arg||'');if(a.includes(':')){if(!RUN){const [z,s]=a.split(':');zoneScreen(z);return;}drawPlay();return;}zoneScreen(a||'bay');}
/* the District Board and signs ask these */
function summary(p){data(p);return ZONES_P.map(z=>({id:z.id,name:z.name,art:z.art,about:z.about,stars:zoneStars(p,z.id),badge:(p.phys[z.id][5]||0)>=1,next:(z.stops[p.phys[z.id].findIndex(x=>!x)]||[])[1]||''}));}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({session:()=>{RUN=null;}}); /* a stop in progress never carries over to another hero */
(function reg(n){if(typeof SCREENS!=='undefined'){SCREENS.phys=screen;return;}if((n||0)<3000)setTimeout(()=>reg((n||0)+1),50);})(0);
window.Physics={zone:zid=>{RUN=null;go('phys',zid);},play,summary,ZONES:ZONES_P,tierOf,
 _say:()=>{try{const r=RUN&&RUN.rounds[RUN.i];if(r)speakToggle(()=>say(speakable(r.q),.9));}catch(e){}},_next:next,
 _dbg:{run:()=>RUN,answer,key,makeRound,GEN,data,finish}};
})();
