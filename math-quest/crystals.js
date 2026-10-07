/* ================= 💎 the Crystal Garden (Oct 2026) =================
   The Lab's greenhouse (lab.js, the dollhouse roof) is a glass dome of crystal jars. Owner's loop: the cave gives the ingredient
   (FIND), the jar grows it over a few days (GROW), and Ozzy's shrinking ride shows why it has that shape (SHRINK).
   • Six jars (JARS). Rock Candy and Cave Drip are open from the start; Salt needs halite identified in the cave, Alum and Sparkle
     Snow need Limestone Caves reached (Sparkle Snow moved there from the River after the second simulation), Blue Copper needs azurite (a real copper mineral) identified.
   • Starting a jar asks the kid to guess the crystal's shape (checked when it is grown). Rock candy lets them pick a colour.
   • Tend each jar once a day: it grows one day. Missing 2+ PLAY days (days the kid played Math Quest but didn't tend it;
     days they didn't play never count, and one skipped play day is let off, after the Oct 2026 simulation) grows only GAP_STEP of a step, so the crystal ends up a bit smaller,
     never ruined. Each tend shows the crystal by a ruler and asks a ruler question (+RULER_COINS if right), rotating
     how much it grew / how much is left to full size / how big tomorrow; plus one real science fact (a second set, f2, for repeats).
   • Growing the same jar again: no guess (the kid knows the shape); each regrown crystal ends a little different (`tgt`, 85-115% of
     full size) and the jar shows the record; beating it is a 🏆 New record (+RECORD_COINS). (The size guess was dropped after the
     second simulation: with crystals nearly always full-size, "as big as it gets" was almost always right.)
   • A grown crystal goes onto the Crystal Shelf (shown here and in the cave Museum) for coins and 🔬 research points; 1 in
     PERFECT_IN is a ✨ perfect crystal (double coins). Salt, Rock Candy and Cave Drip also earn Ozzy's Shrink Ticket for that
     substance (Inner.awardRide) only if that ride is still new in the Molecule Album; otherwise 🔍 Zoom in (the atoms inside) opens on
     the jar straight away (s.zoom). Locked jars say where the mineral is found and nudge to the Field Lab bench when the kid is carrying
     an unidentified rock that might be it.
   • The old Drip Garden (p.cave.garden) becomes the Cave Drip jar; its days are carried over once.
   State: p.cg = {j:{id:{d,mm,last,guess,tgt,col,gaps}}, shelf:[{id,mm,col,pf,at}], best:{id:mm}, n:{id:count}, zoom:{id:1}, mig}.
   Safety (owner): salt, sugar, alum and Epsom salt are real home experiments with a grown-up; the copper jar says plainly that Dr. Quartz
   grows it himself with gloves on and that kids must never try it at home. */
(function(){
'use strict';
const O='#3b2a1e',RECORD_COINS=20,GAP_STEP=.7,RULER_COINS=5,PERFECT_IN=10;
const SHAPES={cube:{n:'Little cubes',svg:'<path d="M8 16 l12 -6 l12 6 l-12 6Z" fill="#fff"/><path d="M8 16 v14 l12 6 v-14Z" fill="#dee2e6"/><path d="M32 16 v14 l-12 6 v-14Z" fill="#f1f3f5"/><path d="M8 16 l12 -6 l12 6 v14 l-12 6 l-12 -6Z" fill="none" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/>'},
 chunk:{n:'Chunky slanted blocks',svg:'<path d="M6 30 L14 10 L30 8 L34 26 L20 36Z" fill="#ffdeeb" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/><path d="M14 10 L20 36 M30 8 L20 36" stroke="#3b2a1e" stroke-width="1.2" opacity=".5"/>'},
 octa:{n:'Two pyramids, base to base',svg:'<path d="M20 4 L34 20 L20 36 L6 20Z" fill="#f8f9fa"/><path d="M20 4 L20 36 L6 20Z" fill="#dee2e6"/><path d="M6 20 H34" stroke="#3b2a1e" stroke-width="1.2" opacity=".5"/><path d="M20 4 L34 20 L20 36 L6 20Z" fill="none" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/>'},
 needle:{n:'Thin needles',svg:'<g stroke="#3b2a1e" stroke-width="1.5" fill="#f1f3f5">'+[[8,34,14,6],[14,34,20,4],[20,34,24,8],[26,34,30,5],[30,34,34,10]].map(([a,b,c,d])=>`<path d="M${a} ${b} L${c} ${d} L${c+3} ${d+2} L${a+3} ${b}Z"/>`).join('')+'</g>'},
 box:{n:'A squashed, slanted box',svg:'<path d="M6 26 L14 8 L34 12 L26 32Z" fill="#339af0" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/><path d="M14 8 L26 32" stroke="#1971c2" stroke-width="2"/>'},
 column:{n:'A tall column',svg:'<rect x="14" y="4" width="12" height="32" fill="#e8dfc8" stroke="#3b2a1e" stroke-width="2"/><path d="M10 4 H30 M10 36 H30" stroke="#3b2a1e" stroke-width="3"/>'}};
/* need: what opens the jar. ride: Ozzy's Inner Space ride for the same substance. days: tends to grow. mm: full size. */
const JARS=[
 {id:'sugar',n:'Rock Candy',e:'🍬',days:5,mm:40,shape:'chunk',tend:'🧵 Dip the string',ride:'glucose',coins:50,need:null,liquid:'#fff0f6',
  how:'Sugar dissolves in hot water, then grows into crystals on a string.',
  f:['Hot water can hold far more sugar than cold water. That is why we start hot!','As the water cools, sugar molecules grab onto the rough string.','Each day more sugar joins the crystals already there.','Look at the flat, slanted faces. Every sugar crystal has them.','Done! Rock candy is just sugar crystals. (Ask a grown-up before you make your own.)'],
  f2:['Rock candy is one of the oldest sweets: people made it over 1,000 years ago!','A rough string works better than a smooth one: crystals need a place to start.','If you stir the jar, tiny crystals form everywhere instead of on the string.','Sugar is made by plants. Sugar cane and sugar beets are full of it.','Done again! A bigger, slower-grown crystal is usually a clearer one.']},
 {id:'drip',n:'Cave Drip',e:'💧',days:5,mm:30,shape:'column',tend:'💧 Drip water',ride:'water',coins:60,need:null,liquid:'#8fd3ff',
  how:'Drip water on the cave ceiling and watch a stalactite and a stalagmite grow.',
  f:['Every drop of water carries a tiny bit of dissolved rock.','The stalactite hangs from the top. (It holds on "tight"!)','The stalagmite grows up from the ground. (It "might" reach the top!)','Almost touching!','They joined into a column! Real ones take thousands of years.'],
  f2:['The dissolved rock is calcite, the same mineral as in limestone.','A soda straw is a thin, hollow baby stalactite. Water runs down the middle!','Some caves have stalagmites taller than a house.','Cave scientists never touch the formations: oil from your skin stops them growing.','A column again! In a real cave this would be about 10,000 years old.']},
 {id:'salt',n:'Salt Cubes',e:'🧂',days:3,mm:15,shape:'cube',tend:'🥄 Stir in salt',ride:'salt',coins:40,need:{min:'halite'},liquid:'#d0ebff',
  how:'Rock salt from the cave, dissolved in warm water. As the water dries up, the salt comes back as crystals.',
  f:['The rock salt you found in the cave is called halite. It dissolves in warm water.','As the water slowly dries up, the salt has to come out again: as crystals!','Done! Every piece is a little cube. Salt always stacks in a cube pattern.'],
  f2:['Some salt comes from the sea, and some is dug out of old dried-up seas underground.','Big salt crystals sometimes grow as hollow "hopper" cubes, like little stairs.','Done again! Same cubes every time: that is how scientists tell halite apart.']},
 {id:'alum',n:'Alum Diamonds',e:'💠',days:5,mm:25,shape:'octa',tend:'🌡️ Warm the jar',ride:null,coins:60,need:{layer:'cave'},liquid:'#f1f3f5',
  how:'Alum is a salt that pickle makers use. A tiny seed crystal on a thread grows bigger every day.',
  f:['A tiny "seed" crystal hangs on a thread in the alum water.','The seed grows bigger, but it keeps exactly the same shape.','Crystals grow by adding layer after layer to their faces.','The shape is called an octahedron: 8 flat faces!','Done! A clear alum crystal shaped like a diamond (but it is not one).'],
  f2:['A seed crystal gives the alum one place to grow, so you get one big crystal instead of lots of small ones.','Alum crystals can grow as big as your fist with enough patience.','The water must stay still: a bump knocks new tiny crystals loose.','8 faces, 6 corners, 12 edges. Count them on your crystal!','Done again! Bigger seeds grow bigger crystals.']},
 {id:'epsom',n:'Sparkle Snow',e:'❄️',days:2,mm:20,shape:'needle',tend:'🧊 Chill the jar',ride:null,coins:30,need:{layer:'cave'},liquid:'#e7f5ff',
  how:'Epsom salt, the kind people put in a bath. It grows on real limestone cave walls too, as fuzzy white epsomite! Chill it and it grows needles fast.',
  f:['Epsom salt dissolves easily in warm water. Cooling it makes the crystals grow quickly.','Done! Long, thin needles, like frost on a window.'],
  f2:['Fast-grown crystals are thin needles; slow-grown ones are thicker.','Done again! Epsom salt is named after a spring in Epsom, England.']},
 {id:'copper',n:'Blue Copper',e:'🔷',days:5,mm:30,shape:'box',tend:'🧤 Ask Dr. Quartz',ride:null,coins:90,need:{min:'azurite'},liquid:'#228be6',lab:1,
  how:'Copper sulfate grows bright blue crystals. Dr. Quartz grows this one himself, with gloves on. Never try it at home!',
  f:['Dr. Quartz puts his gloves on: copper sulfate is not safe to touch or taste.','The water turns a deep, bright blue. Copper makes that colour.','Little blue crystals form on the bottom, and the biggest keeps growing.','Its faces are flat and slanted, like a squashed box.','Done! A brilliant blue crystal. Dr. Quartz says: this one is for scientists only.'],
  f2:['The azurite you found is blue for the same reason: it has copper in it.','Old copper roofs turn green. That is copper reacting with the air and rain.','Heat a blue copper crystal and it turns white as its water leaves it.','No two sides of this crystal are quite the same length.','Done again! Still for scientists only. Gloves off, crystal on the shelf.']}];
const J=id=>JARS.find(x=>x.id===id);
const COLORS=[{id:'',n:'Clear',c:'#ffdeeb',c2:'#ffc9de'},{id:'pink',n:'Pink',c:'#fcc2d7',c2:'#f783ac'},{id:'blue',n:'Blue',c:'#a5d8ff',c2:'#74c0fc'}];
const esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const yday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dayKey(d);};

/* ---------- state ---------- */
function st(p){p.cg=p.cg||{};const s=p.cg;s.j=s.j||{};s.zoom=s.zoom||{};s.shelf=s.shelf||[];s.best=s.best||{};s.n=s.n||{};
 if(!s.mig){s.mig=1;try{const g=p.cave&&p.cave.garden;if(g&&g.stage>0&&!s.j.drip)s.j.drip={d:Math.min(4,g.stage),mm:Math.round(Math.min(4,g.stage)*30/5),last:g.last||'',guess:'column',gaps:0};}catch(e){}}
 return s;}
function layerOK(p,id){try{const L=window.CAVE_DATA.LAYERS.find(x=>x.id===id);return !!(p.cave&&L&&(p.cave.maxRow||0)>=L.r0);}catch(e){return false;}}
function open_(p,jar){const n=jar.need;if(!n)return true;if(n.min)return !!(p.cave&&p.cave.idd&&p.cave.idd[n.min]);if(n.layer)return layerOK(p,n.layer);return true;}
/* where to look, and a nudge when the kid is carrying an unidentified rock that might be the one */
function where(id){try{const m=window.CAVE_DATA.MIN[id];const L=window.CAVE_DATA.LAYERS.find(x=>x.id===m.L[0]);return `${L.e} ${esc2(L.n)}`;}catch(e){return 'the cave';}}
function maybeHas(p,id){try{return ((p.cave&&p.cave.pack)||[]).some(x=>x&&x.t==='m'&&x.id===id);}catch(e){return false;}}
function needText(jar,p){const n=jar.need;if(!n)return '';try{if(n.min){const m=window.CAVE_DATA.MIN[n.min];return `Find ${esc2(m.n.toLowerCase())}${n.min==='halite'?' (rock salt)':''} in ${where(n.min)}, then identify it at the 🔬 Field Lab bench`;}if(n.layer){const L=window.CAVE_DATA.LAYERS.find(x=>x.id===n.layer);return `Dig down to ${L.e} ${esc2(L.n)}`;}}catch(e){}return '';}
const tendable=(j)=>j&&j.d<J(j.id||'sugar').days&&j.last!==dayKey();
function due(p){const s=st(p);return JARS.filter(jar=>{const j=s.j[jar.id];return j&&j.d<jar.days&&j.last!==dayKey();}).length;}
function rideDone(p,jar){try{if(st(p).zoom[jar.id])return true;return !!(jar.ride&&p.inner&&p.inner.album&&p.inner.album[jar.ride]!=null);}catch(e){return false;}}
const ZOOMS=['salt','sugar','drip'];
/* missed PLAY days between the last tend and today: days the kid played Math Quest (p.daily) but didn't tend. One is let off (kids skip the Lab
   now and then); two or more count (Oct 2026 simulation: with one counted, 50-80% of crystals came out smaller) */
function missed(p,last){if(!last)return false;const t=dayKey();try{return Object.keys(p.daily||{}).filter(d=>d>last&&d<t&&((p.daily[d].r||0)+(p.daily[d].w||0))>0).length>=2;}catch(e){return false;}}

/* ---------- pictures ---------- */
function glass(inner,liquid,lv){return `<path d="M30 30 h60 v8 q8 4 8 14 v52 q0 10 -10 10 h-56 q-10 0 -10 -10 v-52 q0 -10 8 -14 z" fill="#eef8ff" fill-opacity=".55"/><path d="M24 ${118-lv} H96 V104 q0 10 -10 10 h-52 q-10 0 -10 -10 Z" fill="${liquid}" opacity=".55"/>${inner}<path d="M30 30 h60 v8 q8 4 8 14 v52 q0 10 -10 10 h-56 q-10 0 -10 -10 v-52 q0 -10 8 -14 z" fill="none" stroke="${O}" stroke-width="3"/><rect x="26" y="22" width="68" height="10" rx="4" fill="#ced4da" stroke="${O}" stroke-width="3"/><path d="M40 52 q-6 20 0 44" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>`;}
function cube(x,y,s){return `<path d="M${x} ${y} l${s} ${-s*.4} l${s} ${s*.4} l${-s} ${s*.4}Z" fill="#fff"/><path d="M${x} ${y} v${s} l${s} ${s*.4} v${-s}Z" fill="#dee2e6"/><path d="M${x+s} ${y+s*.4} v${s} l${s} ${-s*.4} v${-s}Z" fill="#f1f3f5"/><path d="M${x} ${y} l${s} ${-s*.4} l${s} ${s*.4} v${s} l${-s} ${s*.4} l${-s} ${-s*.4}Z" fill="none" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>`;}
function octa(cx,cy,r,f1,f2){return `<path d="M${cx} ${cy-r} L${cx+r*.8} ${cy} L${cx} ${cy+r} L${cx-r*.8} ${cy}Z" fill="${f1}"/><path d="M${cx} ${cy-r} L${cx} ${cy+r} L${cx-r*.8} ${cy}Z" fill="${f2}"/><path d="M${cx-r*.8} ${cy} L${cx+r*.8} ${cy}" stroke="${O}" stroke-width="1.2" opacity=".5"/><path d="M${cx} ${cy-r} L${cx+r*.8} ${cy} L${cx} ${cy+r} L${cx-r*.8} ${cy}Z" fill="none" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`;}
/* k: how grown, 0..1 (the crystal's size relative to a full one) */
function art(id,k,col){k=Math.max(0,Math.min(1,k));
 if(id==='salt'){const P=[[36,96,10],[52,98,12],[70,95,9],[44,84,8],[62,86,9],[54,74,7]];let c='';for(let i=0;i<Math.round(k*6);i++)c+=cube(...P[i]);return glass(c,'#d0ebff',60);}
 if(id==='sugar'){const C=COLORS.find(x=>x.id===(col||''))||COLORS[0];const h=8+k*46;let c=`<path d="M60 32 V${48+h}" stroke="#a0522d" stroke-width="3"/>`;for(let i=0;i<Math.round(k*9);i++){const y=50+i*h/9,w=6+k*10;c+=`<path d="M${60-w} ${y} L60 ${y-6} L${60+w} ${y} L60 ${y+7}Z" fill="${i%2?C.c2:C.c}" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>`;}return glass(c,'#fff0f6',66);}
 if(id==='alum'){const r=3+k*20;return glass(`<path d="M60 32 V${74-r}" stroke="#868e96" stroke-width="1.5"/>`+(k>0?octa(60,74,r,'#f8f9fa','#dee2e6'):''),'#f1f3f5',62);}
 if(id==='copper'){let c='';if(k>0){const big=5+k*20;c+=octa(60,100-big*.6,big,'#339af0','#1c7ed6');if(k>.3)c+=octa(40,104,6+k*5,'#4dabf7','#1971c2');if(k>.5)c+=octa(80,105,5+k*4,'#4dabf7','#1971c2');}return glass(c,'#228be6',60);}
 if(id==='epsom'){let c='';const n=Math.round(k*9);for(let i=0;i<n;i++){const x=36+i*6,h=12+((i*7)%5)*4+k*16;c+=`<path d="M${x} 110 L${x+4} ${110-h} L${x+6} ${110-h+3} L${x+3} 110Z" fill="#f8f9fa" stroke="${O}" stroke-width="1.2"/>`;}return glass(c,'#e7f5ff',58);}
 if(id==='drip'){const s=k*7,tl=6+s*5,tm=4+s*4.2;return `<rect x="14" y="20" width="92" height="96" rx="12" fill="#2a2330"/><path d="M14 28 H106 V36 Q60 42 14 36Z" fill="#8f897a"/><path d="M14 116 H106 V104 Q60 98 14 104Z" fill="#8f897a"/>${k>=1?'<path d="M54 36 L66 36 L63 104 L57 104 Z" fill="#e8dfc8" stroke="'+O+'" stroke-width="1.5"/>':`<path d="M54 36 L66 36 L60 ${36+tl}Z" fill="#e8dfc8"/><path d="M53 104 L67 104 L60 ${104-tm}Z" fill="#d9ceb2"/>`}`;}
 return '';}
const svg=(id,k,col,cls)=>`<svg class="${cls||'cg-pic'}" viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg">${art(id,k,col)}</svg>`;
/* the atoms inside, for 🔍 Zoom in (after Ozzy's ride for the same substance) */
function zoomSVG(id){const at=(x,y,r,c,t)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${O}" stroke-width="2"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="${r*.8}" font-weight="700" font-family="Fredoka,sans-serif" fill="#fff">${t}</text>`;
 if(id==='salt'){let s='';for(let r=0;r<4;r++)for(let c=0;c<4;c++){const na=(r+c)%2===0;s+=at(30+c*40,30+r*40,na?11:16,na?'#9775fa':'#40c057',na?'Na':'Cl');}return `<svg viewBox="0 0 180 180" class="cg-zoom">${s}</svg>`;}
 if(id==='sugar'){const ring=[[90,40],[130,62],[130,108],[90,130],[50,108],[50,62]];let s=`<path d="M${ring.map(p=>p.join(' ')).join(' L')} Z" fill="none" stroke="${O}" stroke-width="5"/>`;ring.forEach(([x,y],i)=>{s+=at(x,y,i===0?14:13,i===0?'#ff6b6b':'#495057',i===0?'O':'C');});[[90,10],[160,50],[160,120],[20,120],[20,50]].forEach(([x,y])=>s+=at(x,y,9,'#ff8787','O'));return `<svg viewBox="0 0 180 150" class="cg-zoom">${s}</svg>`;}
 if(id==='drip'){let s='';[[50,60],[130,60],[90,120]].forEach(([x,y])=>{s+=`<path d="M${x-22} ${y+16} L${x} ${y} L${x+22} ${y+16}" stroke="${O}" stroke-width="4" fill="none"/>`+at(x,y,16,'#ff6b6b','O')+at(x-22,y+16,10,'#f1f3f5','H').replace('fill="#fff">H','fill="#495057">H')+at(x+22,y+16,10,'#f1f3f5','H').replace('fill="#fff">H','fill="#495057">H');});return `<svg viewBox="0 0 180 160" class="cg-zoom">${s}</svg>`;}
 return '';}
const ZOOM={salt:'Inside your salt cube: sodium (Na) and chlorine (Cl) atoms take turns in neat rows, in every direction. Rows of a cube make a cube!',
 sugar:'Inside your rock candy: sugar molecules, each a ring of carbon (C) and oxygen (O) atoms. They stack up in a slanted pattern, so the crystals are slanted too.',
 drip:'Inside a drop of cave water: water molecules, 2 hydrogen (H) and 1 oxygen (O) each. The water carries dissolved rock and leaves a little behind with every drop.'};

/* ---------- screens ---------- */
let VIEW=null; /* {k:'tend',id,y,t,opts,ans} | {k:'start',id,step} | {k:'done',id,...} | {k:'zoom',id} */
function css(){if(document.getElementById('cgCSS'))return;const s=document.createElement('style');s.id='cgCSS';s.textContent=`
.cg-card{max-width:760px!important;text-align:left}.cg-card h2{margin:0 0 4px}.cg-sub{color:#6a5fa0;font-size:15px;margin:0 0 12px}
.cg-shelf{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:600px){.cg-shelf{grid-template-columns:repeat(2,1fr)}}
.cg-jar{background:#f6f3ff;border-radius:16px;padding:8px 8px 10px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px}
.cg-pic{width:100%;max-width:120px;height:auto}.cg-jar b{font-size:15px}.cg-jar small{color:#6a5fa0;font-size:12.5px;min-height:30px;line-height:1.25}
.cg-bar{width:100%;height:7px;border-radius:5px;background:#e3dcff;overflow:hidden;margin:3px 0 6px}.cg-bar i{display:block;height:100%;background:linear-gradient(90deg,#74c0fc,#b197fc)}
.cg-jar .btn{width:100%;font-size:14px;padding:8px 8px;white-space:normal}.cg-lock{opacity:.4}
.cg-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px}.cg-big{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.cg-big .cg-pic{max-width:150px}
.cg-fact{background:#fff9db;border-radius:12px;padding:8px 10px;font-size:15px;margin:10px 0}
.cg-ruler{margin:4px 0}.cg-ruler svg{width:100%;max-width:340px;height:auto;display:block}.cg-key{font-size:13px;color:#6a5fa0}.cg-key i{display:inline-block;width:18px;height:8px;border-radius:3px;margin:0 4px 0 8px;vertical-align:middle}
.cg-opts{display:flex;gap:8px;flex-wrap:wrap}.cg-opts .btn{flex:1;min-width:80px}
.cg-shape{display:flex;flex-direction:column;align-items:center;gap:2px;background:#f6f3ff;border:3px solid transparent;border-radius:14px;padding:8px;cursor:pointer;flex:1;min-width:90px;font:600 13px Fredoka,sans-serif;color:#2b2250}
.cg-shape svg{width:46px;height:46px}.cg-shape:hover{border-color:#b197fc}
.cg-sh{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.cg-it{background:#f6f3ff;border-radius:12px;padding:6px;text-align:center;width:92px;font-size:12px;color:#6a5fa0}.cg-it svg{width:70px;height:auto}.cg-it b{display:block;color:#2b2250;font-size:12.5px}
.cg-zoom{width:100%;max-width:220px;height:auto;display:block;margin:6px auto}`;document.head.appendChild(s);}
function card(inner){css();modal(`<div class="mcard cg-card">${inner}</div>`);}
function open(){VIEW=null;draw();}
function draw(){const p=P();if(!p)return;const s=st(p);
 if(VIEW&&VIEW.k==='tend')return drawTend(p,s);if(VIEW&&VIEW.k==='start')return drawStart(p,s);if(VIEW&&VIEW.k==='done')return drawDone(p,s);if(VIEW&&VIEW.k==='zoom')return drawZoom(p,s);
 const cells=JARS.map(jar=>{const j=s.j[jar.id],ok=open_(p,jar),k=j?Math.min(1,j.mm/jar.mm):0,done=j&&j.d>=jar.days;
  let btn,line;
  if(!ok){const nudge=jar.need&&jar.need.min&&maybeHas(p,jar.need.min);btn=nudge?`<button class="btn gold small" onclick="CG.bench()">🔬 Identify my rocks</button>`:`<button class="btn ghost dark small" disabled>🔒 Locked</button>`;line=needText(jar,p)+(nudge?'. <b>You are carrying a rock that might be it!</b>':'');}
  else if(!j){btn=`<button class="btn gold small" onclick="CG.start('${jar.id}')">✨ Start a jar</button>`;line=s.n[jar.id]?`Grown ${s.n[jar.id]}× · best ${s.best[jar.id]} mm`:'Empty jar';}
  else if(done){btn=`<button class="btn gold small" onclick="CG.collect('${jar.id}')">🎉 Put it on the shelf</button>`;line='Fully grown!';}
  else if(j.last===dayKey()){btn=`<button class="btn ghost dark small" disabled>✅ Tended today</button>`;line=`Day ${j.d} of ${jar.days} · ${j.mm} mm`;}
  else{btn=`<button class="btn green small" onclick="CG.tend('${jar.id}')">${jar.tend}</button>`;line=`Day ${j.d} of ${jar.days} · 💧 ready today`;}
  const z=ZOOMS.includes(jar.id)&&rideDone(p,jar)&&(j||s.n[jar.id])?`<button class="btn ghost dark small" style="margin-top:4px" onclick="CG.zoom('${jar.id}')">🔍 Zoom in</button>`:'';
  return `<div class="cg-jar">${ok?svg(jar.id,j?k:(s.n[jar.id]?1:0),j&&j.col):`<div class="cg-lock">${svg(jar.id,.6)}</div>`}<b>${jar.e} ${esc2(jar.n)}</b><small>${line}</small><div class="cg-bar"><i style="width:${j?Math.round(j.d/jar.days*100):0}%"></i></div>${btn}${z}</div>`;}).join('');
 card(`<h2>💎 Crystal Garden</h2><p class="cg-sub">Tend each jar once a day you play. Tending every time you play grows the biggest crystals. Grown crystals go on your Crystal Shelf.</p><div class="cg-shelf">${cells}</div>${shelfHTML(p)}<div class="cg-row"><button class="btn ghost dark" onclick="closeModal()">Close</button></div>`);}
function shelfHTML(p){p=p||P();if(!p)return '';const s=st(p);if(!s.shelf.length)return '';
 return `<h3 style="margin:14px 0 4px">🏆 Crystal Shelf</h3><div class="cg-sh">${s.shelf.slice(-12).reverse().map(c=>{const jar=J(c.id);return jar?`<div class="cg-it">${svg(c.id,1,c.col)}<b>${c.pf?'✨ ':''}${esc2(jar.n)}</b>${c.mm} mm</div>`:'';}).join('')}</div>`;}
/* starting a jar: guess the shape first (science thinking), rock candy also picks a colour */
function start(id){const p=P(),jar=J(id);if(!p||!jar||!open_(p,jar))return;const s=st(p);if(s.j[id])return;try{SFX.tap();}catch(e){}
 if(s.n[id]){VIEW={k:'start',id,guess:jar.shape,step:'col'};if(id==='sugar')draw();else begin(p,id,jar.shape,'');return;} /* growing it again: straight in (rock candy still picks a colour) */
 VIEW={k:'start',id,step:'guess'};draw();}
function drawStart(p,s){const jar=J(VIEW.id);
 if(VIEW.step==='col'){card(`<h2>${jar.e} ${esc2(jar.n)}</h2><p class="cg-sub">What colour should your rock candy be? (A drop of food colouring!)</p><div class="cg-opts">${COLORS.map(c=>`<button class="cg-shape" onclick="CG._col('${c.id}')">${svg('sugar',1,c.id,'')}<span>${c.n}</span></button>`).join('')}</div>`);return;}
 const wrong=Object.keys(SHAPES).filter(k=>k!==jar.shape);const opts=[jar.shape,...wrong.sort(()=>Math.random()-.5).slice(0,2)].sort(()=>Math.random()-.5);
 card(`<h2>${jar.e} ${esc2(jar.n)}</h2><div class="cg-fact">🔬 <b>Dr. Quartz:</b> ${esc2(jar.how)}</div><p style="margin:6px 0"><b>Make a guess!</b> What shape do you think the crystals will be? We'll find out when it's grown.</p><div class="cg-opts">${opts.map(k=>`<button class="cg-shape" onclick="CG._guess('${k}')"><svg viewBox="0 0 40 40">${SHAPES[k].svg}</svg><span>${SHAPES[k].n}</span></button>`).join('')}</div><div class="cg-row"><button class="btn ghost dark small" onclick="CG.back()">← Back</button></div>`);}
function guess(k){const p=P();if(!p||!VIEW||VIEW.k!=='start')return;VIEW.guess=k;if(VIEW.id==='sugar'){VIEW.step='col';draw();return;}begin(p,VIEW.id,k,'');}
function pickCol(c){const p=P();if(!p||!VIEW)return;begin(p,VIEW.id,VIEW.guess,c);}
function begin(p,id,g,col){const s=st(p);const jar=J(id);s.j[id]={d:0,mm:0,last:'',guess:g||'',tgt:s.n[id]?Math.round(jar.mm*(.85+Math.random()*.3)):jar.mm,col:col||'',gaps:0};save();try{SFX.coin();}catch(e){}VIEW=null;tend(id);}
/* tending: one day of growth, a ruler question and a fact */
function tend(id){const p=P(),jar=J(id);if(!p||!jar)return;const s=st(p),j=s.j[id];if(!j||j.d>=jar.days||j.last===dayKey())return;
 const y=j.mm,gap=missed(p,j.last);if(gap)j.gaps=(j.gaps||0)+1;
 const T=j.tgt||jar.mm;j.d++;const step=T/jar.days;j.mm=Math.max(y+1,Math.round(j.mm+(gap?step*GAP_STEP:step)));if(j.d>=jar.days&&!j.gaps)j.mm=T;j.mm=Math.min(j.mm,T);j.last=dayKey();save();try{SFX.correct();}catch(e){}
 /* the ruler question rotates so it never gets samey: how much it grew → how much is left → how big tomorrow */
 const best=s.best[id]||0,rec=!!s.n[id],goal=rec?best:jar.mm;let typ=j.d>=jar.days?'grow':['grow','left','next'][(j.d-1)%3];if(typ==='left'&&goal<=j.mm)typ='grow'; /* regrown: how far to your record */
 const diff=j.mm-y,right=typ==='grow'?diff:typ==='left'?goal-j.mm:j.mm+diff;
 const opts=[...new Set([right,right+2,Math.max(0,right-1),right+1])].slice(0,3).sort(()=>Math.random()-.5);
 VIEW={k:'tend',id,y,t:j.mm,typ,right,opts,ans:null,gap,goal,rec,max:Math.max(jar.mm,best,T)};draw();}
function rulerSVG(y,t,max){const W=200,px=mm=>10+mm/Math.max(max,t)*180;let s=`<rect x="6" y="28" width="${W-2}" height="22" rx="3" fill="#ffe8a3" stroke="${O}" stroke-width="2"/>`;
 const top=Math.max(max,t),stp=top<=20?1:5,lab=top<=20?5:10;for(let m=0;m<=top;m+=stp){const x=px(m);s+=`<path d="M${x} 28 v${m%lab?(m%5?4:6):10}" stroke="${O}" stroke-width="${m%lab?1:1.5}"/>`;if(m%lab===0)s+=`<text x="${x}" y="47" text-anchor="middle" font-size="8" font-family="Fredoka,sans-serif" fill="${O}">${m}</text>`;}
 s+=`<rect x="10" y="8" width="${px(y)-10}" height="7" rx="3" fill="#ced4da"/><rect x="10" y="17" width="${px(t)-10}" height="7" rx="3" fill="#b197fc"/>`;return `<svg viewBox="0 0 ${W+10} 54">${s}</svg>`;}
function drawTend(p,s){const v=VIEW,jar=J(v.id),j=s.j[v.id];const k=j?Math.min(1,j.mm/jar.mm):1;const fs=s.n[v.id]&&jar.f2?jar.f2:jar.f;const fact=fs[Math.min(fs.length-1,(j?j.d:jar.days)-1)];
 const ask=v.typ==='left'?`Today it is ${v.t} mm. ${v.rec?`Your record is ${v.goal} mm`:`A full-size one is ${v.goal} mm`}. <b>How many more mm to ${v.rec?'reach your record':'full size'}?</b>`:v.typ==='next'?`Yesterday ${v.y} mm, today ${v.t} mm. <b>If it grows the same again, how big will it be tomorrow?</b>`:`<b>Yesterday: ${v.y} mm. Today: ${v.t} mm.</b> How much did it grow?`;
 const how=v.typ==='left'?`${v.goal} − ${v.t} = ${v.right} mm`:v.typ==='next'?`${v.t} + ${v.t-v.y} = ${v.right} mm`:`${v.t} − ${v.y} = ${v.right} mm`;
 const q=v.ans==null?`<p style="margin:6px 0">${ask}</p><div class="cg-opts">${v.opts.map(o=>`<button class="btn gold" onclick="CG._ans(${o})">${o} mm</button>`).join('')}</div>`
  :v.ans===v.right?`<p style="margin:6px 0"><b>✅ Yes! ${how}.</b> +${RULER_COINS} 🪙</p>`:`<p style="margin:6px 0"><b>Not quite:</b> ${how}.</p>`;
 card(`<h2>${jar.e} ${esc2(jar.n)} · Day ${j?j.d:jar.days} of ${jar.days}</h2><div class="cg-big">${svg(jar.id,k,j&&j.col)}<div style="flex:1;min-width:200px"><div class="cg-ruler">${rulerSVG(v.y,v.t,v.max||jar.mm)}<div class="cg-key"><i style="background:#ced4da;margin-left:0"></i>yesterday <i style="background:#b197fc"></i>today · in mm</div></div>${q}</div></div>
  ${v.gap?'<p class="cg-sub" style="margin:4px 0">💭 It grew a little less: you played a day without tending it. Tend it every day you play for the biggest crystal.</p>':''}
  <div class="cg-fact">🔬 <b>Dr. Quartz:</b> ${esc2(fact)}</div><div class="cg-row">${j&&j.d>=jar.days?`<button class="btn gold" onclick="CG.collect('${jar.id}')">🎉 See your crystal!</button>`:''}<button class="btn ghost dark" onclick="CG.back()">← Crystal Garden</button></div>`);}
function ans(o){const p=P();if(!p||!VIEW||VIEW.k!=='tend'||VIEW.ans!=null)return;VIEW.ans=o;if(o===VIEW.right){p.coins=(p.coins||0)+RULER_COINS;try{SFX.coin();}catch(e){}save();}else{try{SFX.wrong();}catch(e){}}draw();}
/* a grown crystal: reveal the guess, coins and research points, the shelf, and Ozzy's ticket for that substance */
function collect(id){const p=P(),jar=J(id);if(!p||!jar)return;const s=st(p),j=s.j[id];if(!j||j.d<jar.days)return;
 const pf=Math.random()<1/PERFECT_IN,first=!s.n[id],right=first&&j.guess===jar.shape,prev=s.best[id]||0,rec=!first&&j.mm>prev;
 const coins=Math.round((jar.coins+j.mm)*(pf?2:1))+(first?25:0)+(rec?RECORD_COINS:0);p.coins=(p.coins||0)+coins;try{p.cave=p.cave||{};p.cave.rp=(p.cave.rp||0)+5+(right?5:0);}catch(e){}
 s.shelf.push({id,mm:j.mm,col:j.col||'',pf:pf?1:0,at:dayKey()});if(s.shelf.length>60)s.shelf.splice(0,s.shelf.length-60);s.n[id]=(s.n[id]||0)+1;s.best[id]=Math.max(s.best[id]||0,j.mm);delete s.j[id];
 let tix=null,zoomNow=false,full=false;try{if(jar.ride){const al=p.inner&&p.inner.album;if(al&&al[jar.ride]!=null){if(!s.zoom[id]){s.zoom[id]=1;zoomNow=true;}}else if(window.Inner&&Inner.awardRide){tix=Inner.awardRide(p,jar.ride);if(!tix){full=!!(Inner.isFull&&Inner.isFull(p));if(!full&&!s.zoom[id]){s.zoom[id]=1;zoomNow=true;}}}}}catch(e){}
 save();try{SFX.win();}catch(e){}
 VIEW={k:'done',id,mm:j.mm,col:j.col,pf,coins,right,guess:j.guess,again:!first,rec,prev,tix:!!tix,zoomNow,pocket:full,full:j.tgt||jar.mm,gaps:j.gaps};draw();}
function drawDone(p,s){const v=VIEW,jar=J(v.id);
 card(`<h2>🎉 Your ${esc2(jar.n)} is grown!</h2><div class="cg-big">${svg(jar.id,1,v.col)}<div style="flex:1;min-width:200px">
  <p style="margin:0 0 6px">${v.pf?'<b>✨ A PERFECT crystal!</b> Not a single crack. Double coins! ':''}It is <b>${v.mm} mm</b>.${v.gaps?' Tending it every time you play grows it bigger.':''}</p>
  <p style="margin:0 0 6px">${v.again?(v.rec?`<b>🏆 New record!</b> Your best was ${v.prev} mm. +${RECORD_COINS} 🪙`:v.mm===v.prev?`You matched your record of ${v.prev} mm!`:`Your record is still <b>${v.prev} mm</b>. Every crystal grows a little different: try again to beat it!`):`You guessed <b>${esc2((SHAPES[v.guess]||{n:'?'}).n.toLowerCase())}</b>. ${v.right?'<b>✅ You were right!</b> +5 🔬':`It's <b>${esc2(SHAPES[jar.shape].n.toLowerCase())}</b>. Good try!`}`}</p>
  <p style="margin:0"><b>+${v.coins} 🪙 · +${5+(v.right?5:0)} 🔬</b> It's on your Crystal Shelf (in the Museum too).</p></div></div>
  ${v.tix?`<div class="cg-fact">🎟️ <b>Ozzy's Shrink Ticket!</b> Ozzy wants to shrink you down <b>inside</b> your ${esc2(jar.n.toLowerCase())} to see why it grows this shape. He'll pick you up after a few battles.</div>`:''}${v.pocket?`<div class="cg-fact">🎟️ Ozzy had a Shrink Ticket for you, but your ticket pocket is full! Take a ride with Ozzy to make room.</div>`:''}${v.zoomNow?`<div class="cg-fact">🔍 You've already been inside ${esc2(jar.id==='drip'?'water':jar.n.toLowerCase())} with Ozzy, so <b>Zoom in</b> is open on this jar: see the atoms inside your crystal!</div>`:''}
  <div class="cg-row"><button class="btn gold" onclick="CG.back()">💎 Back to the garden</button></div>`);}
function zoom(id){VIEW={k:'zoom',id};try{SFX.tap();}catch(e){}draw();}
function drawZoom(p,s){const jar=J(VIEW.id);card(`<h2>🔍 Inside your ${esc2(jar.n)}</h2>${zoomSVG(jar.id)}<div class="cg-fact">⚛️ ${esc2(ZOOM[jar.id]||'')}</div><div class="cg-row"><button class="btn ghost dark" onclick="CG.back()">← Crystal Garden</button></div>`);}
function back(){VIEW=null;try{SFX.tap();}catch(e){}draw();}
function bench(){try{closeModal();}catch(e){}try{if(window.Quartz&&Quartz.room)Quartz.room('bench');}catch(e){}}
window.CG={open,bench,start,tend,collect,zoom,back,due,shelfHTML,art,JARS,SHAPES,_guess:guess,_col:pickCol,_ans:ans,_st:st,_view:()=>VIEW};
})();
