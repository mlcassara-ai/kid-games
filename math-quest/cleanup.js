/* CLEAN-UP CREW — Adventure Camp add-on (loaded right after adv.js).
   • On every finished (not called-home-early) trip the crew also picks up litter along the trail: short trip 2, long trip 3, overnight 4–5.
   • After the sacks are put away, Scout Leader Marisol helps the kid sort each piece into ♻️ Recycle, 🗑️ Trash or 🌱 Compost
     (tap an item, then tap a bin). Right bin = 2 Clean-Up points + a short fact. Wrong bin = she gently corrects it, it still goes
     in the right bin, 1 point.
   • Clean-Up points climb a long rewards track (TRACK): merit badges + coins about every week of normal play, a Scout Hat or a robe
     about every 3–4 weeks, and Sorty the Recycle Bot (a Clean-Up-only pet) at about 2–3 months. Pacing sim: scratchpad cleanup/pace-sim.js.
   • VERY rarely (after meeting Dr. Quartz) the crew brings home a Science Cave find: the camp-only piece of one of the Adventure Camp
     fossils in cave-data.js (f.camp — the cave never spawns it), or a 🪨 mystery rock (p.sci.rocks, max 3).
   Saved per player: p.adv.clean {pts,sorted,right,trips,bins,load,pend,seen,got,stars,dry,bones,rocks}, p.adv.badges [ids].
   Uses Math Quest globals: P, save, modal, closeModal, toast, esc, SFX, go, curScreen, PETS, PET_TIERS, HATS, ROBES, heroSVG, petData,
   youngReader, voiceOn, say, speakable, CAVE_DATA, Adv, MQ_HOOKS. Everything is additive: old saves just start with 0 points. */
(function(){
'use strict';
const NAME='Scout Leader Marisol',NICK='Leader Mari';
const PT_RIGHT=2,PT_WRONG=1,PEND_MAX=20,BATCH=10;
const LIT={short:()=>2,mid:()=>3,night:()=>4+(Math.random()<.5?1:0)};
/* very rare Science Cave finds, per finished trip (only after meeting Dr. Quartz). Normal mix ≈ 1 bone per 42 trips, 1 rock per 33. */
const BONE={short:1/80,mid:1/45,night:1/25},BONE_PITY=70;
const ROCK={short:1/60,mid:1/35,night:1/20};
const BINS={rec:{e:'♻️',n:'Recycle',c:'#1c7ed6',bg:'#e7f5ff',lid:'#1864ab'},tra:{e:'🗑️',n:'Trash',c:'#5c636a',bg:'#f1f3f5',lid:'#343a40'},com:{e:'🌱',n:'Compost',c:'#2f9e44',bg:'#ebfbee',lid:'#2b8a3e'}};
const BIN_IDS=['rec','tra','com'];

/* ---------- little pictures for litter that has no good emoji ---------- */
const sv=(b,vb)=>`<svg viewBox="${vb||'0 0 40 40'}" width="1em" height="1em" style="vertical-align:-.12em" aria-hidden="true">${b}</svg>`;
const ART={
 cap:sv('<circle cx="20" cy="20" r="14" fill="#e03131" stroke="#a61e1e" stroke-width="3.5" stroke-dasharray="3 2.2"/><circle cx="20" cy="20" r="8.5" fill="#fa5252"/><path d="M15 16 Q20 12 25 16" stroke="#ffc9c9" stroke-width="2" fill="none" stroke-linecap="round"/>'),
 straw:sv('<path d="M12 37 L16 15 Q17 9 23 8 L35 6" stroke="#f06595" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 37 L16 15 Q17 9 23 8 L35 6" stroke="#fff" stroke-width="2.4" fill="none" stroke-dasharray="3 4"/>'),
 gum:sv('<g transform="rotate(-14 20 20)"><rect x="5" y="12" width="30" height="16" rx="2" fill="#dee2e6" stroke="#868e96" stroke-width="2"/><path d="M9 15 L31 25 M12 25 L20 16" stroke="#fff" stroke-width="1.6"/><rect x="5" y="17" width="30" height="6" fill="#74c0fc" opacity=".8"/></g>'),
 candy:sv('<path d="M3 12 L12 17 L12 23 L3 28 Z M37 12 L28 17 L28 23 L37 28 Z" fill="#cc5de8" stroke="#862e9c" stroke-width="1.8" stroke-linejoin="round"/><rect x="11" y="14" width="18" height="12" rx="5" fill="#ffd43b" stroke="#e67700" stroke-width="2"/><path d="M15 18 L25 22" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'),
 chips:sv('<path d="M8 8 L32 8 L30 36 L10 36 Z" fill="#fd7e14" stroke="#c2410c" stroke-width="2" stroke-linejoin="round"/><path d="M8 8 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3" stroke="#c2410c" stroke-width="1.8" fill="none"/><circle cx="20" cy="22" r="7" fill="#ffe066"/><path d="M16 22 Q20 17 24 22" stroke="#e67700" stroke-width="1.8" fill="none"/>'),
 jar:sv('<rect x="9" y="12" width="22" height="25" rx="5" fill="#c5f6fa" stroke="#3bc9db" stroke-width="2.5"/><rect x="10" y="5" width="20" height="7" rx="2" fill="#adb5bd" stroke="#495057" stroke-width="2"/><path d="M14 18 v12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'),
 plbag:sv('<path d="M8 15 L32 15 L30 37 L10 37 Z" fill="#f8f9fa" stroke="#adb5bd" stroke-width="2" stroke-linejoin="round"/><path d="M13 15 Q12 4 18 9 M27 15 Q28 4 22 9" stroke="#adb5bd" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M14 22 Q20 26 26 21" stroke="#dee2e6" stroke-width="1.6" fill="none"/>'),
 shell:sv('<path d="M3 24 Q3 13 12 13 Q16 13 18 16 L15 18 L18 21 L15 24 L18 27 Q16 35 11 35 Q3 35 3 24Z" fill="#fff4e6" stroke="#c9a27a" stroke-width="2" stroke-linejoin="round"/><path d="M37 22 Q37 11 28 11 Q24 11 22 14 L25 16 L22 19 L25 22 L22 25 Q24 33 29 33 Q37 33 37 22Z" fill="#fff4e6" stroke="#c9a27a" stroke-width="2" stroke-linejoin="round"/>'),
 pstick:sv('<rect x="16" y="3" width="9" height="34" rx="4.5" fill="#e9c38a" stroke="#b08447" stroke-width="2" transform="rotate(28 20 20)"/>'),
 pbottle:sv('<g transform="rotate(-12 20 20)"><rect x="16" y="2" width="8" height="5" rx="1.5" fill="#1c7ed6"/><path d="M15.5 7 h9 l3 6 v21 q0 3 -3 3 h-9 q-3 0 -3 -3 v-21z" fill="#d0ebff" stroke="#4dabf7" stroke-width="2" stroke-linejoin="round"/><rect x="12.8" y="19" width="14.4" height="7" fill="#74c0fc"/><path d="M16 12 v18" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>'),
 tube:sv('<g transform="rotate(-18 20 20)"><rect x="7" y="13" width="24" height="14" fill="#c8a165" stroke="#8b6b3d" stroke-width="2"/><path d="M11 13 L17 27 M17 13 L23 27 M23 13 L29 27" stroke="#b08447" stroke-width="1.2"/><ellipse cx="31" cy="20" rx="4" ry="7" fill="#b08447" stroke="#8b6b3d" stroke-width="2"/><ellipse cx="31" cy="20" rx="2" ry="4.6" fill="#5c4424"/></g>'),
 pbag:sv('<path d="M9 12 L31 12 L33 37 L7 37Z" fill="#d4a373" stroke="#8b5e34" stroke-width="2" stroke-linejoin="round"/><path d="M9 12 L11 5 L29 5 L31 12Z" fill="#e9c38a" stroke="#8b5e34" stroke-width="2" stroke-linejoin="round"/><path d="M13 5 L14.5 12 M27 5 L25.5 12 M11 24 h18" stroke="#8b5e34" stroke-width="1.4" opacity=".7"/>'),
 fork:sv('<path d="M13 3 L13 13 Q13 19 18 19 L18 36 Q20 39 22 36 L22 19 Q27 19 27 13 L27 3 L25.2 3 L25.2 12 L23.4 12 L23.4 3 L21 3 L21 12 L19 12 L19 3 L16.6 3 L16.6 12 L14.8 12 L14.8 3Z" fill="#f8f9fa" stroke="#868e96" stroke-width="1.5" stroke-linejoin="round" transform="rotate(28 20 20)"/>'),
 core:sv('<path d="M12 9 Q17 12 17 20 Q17 28 12 32 L28 32 Q23 28 23 20 Q23 12 28 9Z" fill="#fff3bf" stroke="#f59f00" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="20" cy="9" rx="9" ry="3.8" fill="#e03131"/><ellipse cx="20" cy="32.5" rx="9" ry="3.8" fill="#e03131"/><ellipse cx="20" cy="18" rx="1.3" ry="2.2" fill="#5c3d1e"/><ellipse cx="20" cy="23.5" rx="1.3" ry="2.2" fill="#5c3d1e"/><path d="M20 6 Q20.5 2 24 1.5" stroke="#6b4f2a" stroke-width="2" fill="none" stroke-linecap="round"/>'),
 peel:sv('<path d="M20 14 Q10 17 5 31 Q11 27 16 27 Q13.5 33 15 38 Q20 31 22 27 Q27 31 34 33 Q31 21 22 14Z" fill="#ffd43b" stroke="#e67700" stroke-width="2" stroke-linejoin="round"/><path d="M18.5 5 L22 5 L22.5 15 L18.5 15Z" fill="#8a6b2e"/><path d="M20 16 Q18 22 17 26 M21 16 Q23 22 25 27" stroke="#fab005" stroke-width="1.4" fill="none"/>'),
 orange:sv('<path d="M4 25 Q6 10 21 9 Q18 13 18.5 17 Q10 17 9 27Z" fill="#fd7e14" stroke="#d9480f" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 35 Q30 37 36 22 Q32 22.5 30 20 Q27 30 15 31Z" fill="#fd7e14" stroke="#d9480f" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 24 Q23 16 31 15 Q29 20 24 24Z" fill="#ffc078" stroke="#d9480f" stroke-width="1.5" stroke-linejoin="round"/>'),
 berry:sv('<g transform="translate(12 14)"><path d="M-4 3 Q0 11 4 3Z" fill="#fa5252"/><path d="M0 0 L-8 -3 L-3 2 L-8 6 L-1 4 L0 9 L2 4 L8 6 L3 1 L7 -4Z" fill="#40c057" stroke="#2b8a3e" stroke-width="1.2" stroke-linejoin="round"/></g><g transform="translate(27 27) rotate(40)"><path d="M-4 3 Q0 11 4 3Z" fill="#fa5252"/><path d="M0 0 L-8 -3 L-3 2 L-8 6 L-1 4 L0 9 L2 4 L8 6 L3 1 L7 -4Z" fill="#40c057" stroke="#2b8a3e" stroke-width="1.2" stroke-linejoin="round"/></g>'),
 balloon:sv('<path d="M11 11 L17 6 L20 12 L26 7 L25.5 14 L31 16 L23 20 L20 17.5 L16 21.5 L9 17Z" fill="#fa5252" stroke="#c92a2a" stroke-width="1.6" stroke-linejoin="round"/><circle cx="19.5" cy="20" r="1.8" fill="#c92a2a"/><path d="M19.5 21.5 Q15 28 22 31 Q27 34 22 39" stroke="#495057" stroke-width="1.6" fill="none" stroke-linecap="round"/>'),
 napkin:sv('<path d="M6 10 L30 6 L34 30 L10 34 Z" fill="#fff" stroke="#adb5bd" stroke-width="2" stroke-linejoin="round"/><path d="M8 20 L32 17 M18 8 L22 32" stroke="#dee2e6" stroke-width="1.6"/><circle cx="25" cy="25" r="2.5" fill="#ffa8a8" opacity=".7"/>')};
/* [id, emoji or ART key, name, correct bin, fact, also-OK bin]. Facts stay general; where town rules differ we say so. */
const LITTER=[
 ['can','🥫','Empty Can','rec','Metal cans can be recycled again and again, forever!'],
 ['pbottle','@pbottle','Plastic Bottle','rec','Empty it first! Old plastic bottles can become new bottles, or even cozy fleece jackets.'],
 ['cap','@cap','Bottle Cap','rec','Many towns want caps screwed back on the empty bottle, then recycled. If your town doesn\'t take caps, the trash is OK. Ask a grown-up!','tra'],
 ['news','📰','Old Newspaper','rec','Old newspapers get made into new paper, egg cartons and more.'],
 ['box','📦','Cardboard Scrap','rec','Cardboard is one of the most recycled things there is. Flatten boxes so they fit!'],
 ['jar','@jar','Glass Jar','rec','Rinse it out! Glass can be melted and made into new jars again and again. (A few towns collect glass in its own bin.)'],
 ['juice','🧃','Juice Box','rec','Juice boxes are cartons, and lots of towns recycle cartons (push the straw inside!). Some towns don\'t, and then it goes in the trash.','tra'],
 ['homework','📝','Old Homework','rec','Clean paper is great for recycling. (Just don\'t recycle your homework before you turn it in!)'],
 ['tube','@tube','Toilet Paper Tube','rec','Cardboard tubes go in recycling with paper. They can go in compost too!','com'],
 ['pbag','@pbag','Paper Bag','rec','Paper bags go in recycling with other paper. Or use them again first! A plain paper bag can go in compost too.','com'],
 ['gum','@gum','Gum Wrapper','tra','Gum wrappers have a thin shiny layer stuck to paper. That mix goes in the trash.'],
 ['candy','@candy','Candy Wrapper','tra','Candy wrappers are made of mixed layers that recycling machines can\'t pull apart. Trash!'],
 ['chips','@chips','Chip Bag','tra','Chip bags are shiny inside and made of mixed layers, so they go in the trash.'],
 ['straw','@straw','Bent Straw','tra','Straws are too small and light for recycling machines, so they go in the trash.'],
 ['brush','🪥','Old Toothbrush','tra','In most towns an old toothbrush goes in the trash. A few special programs recycle them!'],
 ['crayon','🖍️','Broken Crayon','tra','Broken crayons go in the trash, but some groups collect old crayons and melt them into new ones!'],
 ['plbag','@plbag','Plastic Bag','tra','Plastic bags tangle up recycling machines! Keep them out of the recycle bin. Many stores collect them instead.'],
 ['fork','@fork','Plastic Fork','tra','Most towns can\'t recycle plastic forks and spoons, so they go in the trash.'],
 ['balloon','@balloon','Popped Balloon','tra','Popped balloons go in the trash. Loose balloons can hurt birds and sea animals, so great job picking it up!'],
 ['cup','🥤','Paper Cup','tra','Most paper cups have a thin plastic coat inside. A few towns do recycle them, so ask a grown-up!','rec'],
 ['sponge','🧽','Old Sponge','tra','Most kitchen sponges are made of plastic, so an old one goes in the trash.'],
 ['core','@core','Apple Core','com','Apple cores rot and turn into rich new soil. Worms love them!'],
 ['peel','@peel','Banana Peel','com','Banana peels break down in compost and feed the soil.'],
 ['shell','@shell','Eggshells','com','Eggshells go in compost. Crush them up so they break down faster!'],
 ['orange','@orange','Orange Peel','com','Orange peels can go in compost. Tear them into small bits so they rot faster.'],
 ['crust','🍕','Pizza Crust','com','Many towns collect food scraps like pizza crust for compost. If yours doesn\'t, it goes in the trash.','tra'],
 ['pstick','@pstick','Popsicle Stick','com','Plain wooden popsicle sticks are made of wood, so they can go in compost. (The trash is OK too.)','tra'],
 ['cob','🌽','Corn Cob','com','Corn cobs go in compost. Break them into pieces so they rot faster.'],
 ['rind','🍉','Watermelon Rind','com','Watermelon rinds are full of water and rot fast in compost.'],
 ['bread','🍞','Old Bread Crust','com','Old bread goes in compost, even fuzzy, moldy bread! No compost bin at home? Then the trash.','tra'],
 ['berry','@berry','Strawberry Tops','com','Strawberry tops are plant parts, so they go in compost.'],
 ['nut','🥜','Peanut Shells','com','Peanut shells are plant parts, so they can go in compost.'],
 ['grass','🌿','Grass Clippings','com','Grass clippings are great "greens" for compost. Mix them with dry leaves!'],
 ['napkin','@napkin','Used Napkin','com','Used paper napkins can\'t be recycled, but many towns take them in compost. (The trash is OK too.)','tra']
].map(([id,e,n,b,f,alt])=>({id,e,n,b,f,alt}));
const LIT_BY={};LITTER.forEach(x=>LIT_BY[x.id]=x);
/* a little flavor: each place leaves its own kind of mess */
const PLACE={meadow:['core','peel','napkin','juice','berry','grass'],woods:['orange','chips','pstick','nut','can'],cove:['pbottle','cap','plbag','straw','can','cup'],caves:['crayon','brush','sponge','jar','news'],peaks:['candy','gum','balloon','homework','box'],volcano:['can','chips','cob','crust','fork'],haunt:['candy','gum','core','box','pbag'],harvest:['core','peel','napkin','juice','berry']};
const icon=x=>x&&x.e&&x.e[0]==='@'?ART[x.e.slice(1)]:(x?x.e:'❓');

/* ---------- the rewards track ----------
   Normal play (≈6–12 trips a week, mixed lengths, ~85% sorted right) ≈ 26 litter ≈ 48 points a week:
   badge ≈ every week, Scout Hat ≈ week 3.6, Earth Guardian robe ≈ week 7, Sorty ≈ week 11, Ocean Cleanup robe ≈ week 14. */
const TRACK=[
 {at:45,id:'picker',e:'🧤',n:'Litter Picker',c:'#fab005',coins:50},
 {at:100,id:'rookie',e:'♻️',n:'Recycle Rookie',c:'#1c7ed6',coins:75},
 {at:175,id:'scout',e:'🏕️',n:'Camp Scout',c:'#b08447',coins:100,hat:'scout'},
 {at:230,id:'compost',e:'🌱',n:'Compost Champ',c:'#2f9e44',coins:100},
 {at:285,id:'binboss',e:'🗑️',n:'Bin Boss',c:'#5c636a',coins:125},
 {at:350,id:'guardian',e:'🌍',n:'Earth Guardian',c:'#1971c2',coins:150,robe:'earthguard'},
 {at:405,id:'trail',e:'🥾',n:'Trail Keeper',c:'#a0522d',coins:150},
 {at:460,id:'creek',e:'💧',n:'Clean Creek',c:'#15aabf',coins:150},
 {at:540,id:'sorty',e:'🤖',n:'Robot Buddy',c:'#7048e8',coins:200,pet:'sorty'},
 {at:600,id:'ocean',e:'🐳',n:'Ocean Hero',c:'#1098ad',coins:200},
 {at:700,id:'wave',e:'🌊',n:'Wave Maker',c:'#0b7285',coins:200,robe:'oceanclean'},
 {at:800,id:'planet',e:'🌎',n:'Planet Protector',c:'#e8590c',coins:300}];
const STAR_EVERY=100,STAR_COINS=150;/* after the track: a ⭐ Clean-Up Star every 100 points, forever */
const BOT={id:'sorty',e:'🤖',name:'Sorty the Recycle Bot',perk:'coins',tier:'scout',rare:true,prize:true,cleanup:1};
const HAT={id:'scout',name:'Scout Hat',price:1,event:true,cleanup:1};
const ROBE_DEFS=[{id:'earthguard',name:'Earth Guardian',grad:['#1864ab','#2f9e44','#74c0fc','#2b8a3e'],price:1,event:true,cleanup:1},
 {id:'oceanclean',name:'Ocean Cleanup',grad:['#0b7285','#22b8cf','#99e9f2','#e6fcf5'],price:1,event:true,cleanup:1}];
/* prizes are registered at run time (like fade.js): never sold, never in eggs (REG_PETS is built before this runs), never taken */
function defs(){
 try{if(typeof PET_TIERS!=='undefined'&&!PET_TIERS.scout)PET_TIERS.scout={n:'Clean-Up',c:'#2f9e44',odds:0,mult:1.3};}catch(e){}
 try{if(typeof PETS!=='undefined'&&Array.isArray(PETS)&&!PETS.some(x=>x.id===BOT.id))PETS.push(Object.assign({},BOT));}catch(e){}
 try{if(typeof HATS!=='undefined'&&Array.isArray(HATS)&&!HATS.some(x=>x.id===HAT.id))HATS.push(Object.assign({},HAT));}catch(e){}
 try{if(typeof ROBES!=='undefined'&&Array.isArray(ROBES))ROBE_DEFS.forEach(r=>{if(!ROBES.some(x=>x.id===r.id))ROBES.push(Object.assign({},r,{grad:r.grad.slice()}));});}catch(e){}
 try{if(typeof petSays==='function'&&!petSays._cu){const o=petSays;const w=function(pd,pet){try{if(pet&&pet.id===BOT.id&&Math.random()<.5)return pk(['Beep boop! Is that recyclable? ♻️','I sorted 1,000 bottle caps today. Okay, maybe 3. 🤖','My favorite snack is… a battery! Just kidding. 🔋','Compost, recycle, trash! Beep! 🌱♻️🗑️','Let\'s go on a trip and clean up the trail! 🥾']);}catch(e){}return o.apply(this,arguments);};w._cu=1;window.petSays=w;}}catch(e){}}
(function reg(n){let ok=false;try{ok=typeof PETS!=='undefined'&&typeof ROBES!=='undefined'&&typeof HATS!=='undefined'&&typeof PET_TIERS!=='undefined';}catch(e){}if(ok)defs();else if(n<3000)setTimeout(()=>reg(n+1),n<300?0:200);})(0);
try{document.addEventListener('DOMContentLoaded',defs);}catch(e){}

/* ---------- state ---------- */
const pk=a=>a[Math.floor(Math.random()*a.length)];
function C(p){p.adv=p.adv||{};const a=p.adv;const c=a.clean=a.clean||{};
 ['pts','sorted','right','trips','got','stars','dry','bones','rocks'].forEach(k=>{if(typeof c[k]!=='number')c[k]=0;});
 c.bins=Object.assign({rec:0,tra:0,com:0},c.bins||{});c.load=Object.assign({rec:0,tra:0,com:0},c.load||{});
 c.pend=Array.isArray(c.pend)?c.pend.filter(id=>LIT_BY[id]):[];c.seen=c.seen||{};a.badges=Array.isArray(a.badges)?a.badges:[];return c;}
const young=p=>{try{return youngReader(p);}catch(e){return !!p&&!p.adult&&(+p.grade||3)<=2;}};
const first=p=>esc(String((p&&p.name)||'').split(' ')[0]);
const CDd=()=>window.CAVE_DATA||null;
const campFossils=()=>{const D=CDd();return D?D.FOSSILS.filter(f=>f.camp!=null):[];};
const fart=f=>{const D=CDd();return (D&&D.FART&&D.FART[f.id])||f.e;};
function nextM(c){return TRACK[c.got]||null;}
const atK=k=>k<TRACK.length?TRACK[k].at:TRACK[TRACK.length-1].at+(k-TRACK.length+1)*STAR_EVERY;/* points needed for the k-th reward (0-based) */
function prevAt(c){return c.got>0?atK(c.got-1):0;}
function nextAt(c){return atK(c.got);}
function perTrip(c){return c.trips>=3&&c.pts>0?Math.max(3,Math.min(12,c.pts/c.trips)):5.5;}

/* ---------- a trip comes home (called by adv.js finish(), before it saves) ---------- */
function onTrip(p,res,tr){const c=C(p),len=tr.len in LIT?tr.len:'mid';
 const n=LIT[len]();const out=[];const pref=PLACE[tr.dest]||[];
 for(let k=0,tries=0;k<n&&tries<40;tries++){const id=pref.length&&Math.random()<.4?pk(pref):pk(LITTER).id;if(out.includes(id)&&tries<30)continue;out.push(id);k++;}
 c.pend=c.pend.concat(out).slice(-PEND_MAX);c.trips++;res.litter=out;
 /* very rare Science Cave finds */
 const sci=p.sci;if(sci&&sci.met){
  const miss=campFossils().filter(f=>!((p.cave&&p.cave.fos&&p.cave.fos[f.id])||[])[f.camp]&&!(p.cave&&p.cave.ex&&p.cave.ex[f.id]));
  if(miss.length){c.dry++;
   if(Math.random()<(BONE[len]||BONE.mid)||c.dry>=BONE_PITY){c.dry=0;
    const w=[];miss.forEach(f=>{const has=((p.cave&&p.cave.fos&&p.cave.fos[f.id])||[]).some(Boolean);for(let i=0;i<(has?2:1);i++)w.push(f);});const f=pk(w);
    p.cave=p.cave||{};p.cave.fos=p.cave.fos||{};const arr=Array.isArray(p.cave.fos[f.id])?p.cave.fos[f.id]:[];arr[f.camp]=1;for(let i=0;i<arr.length;i++)if(!arr[i])arr[i]=0;p.cave.fos[f.id]=arr;c.bones++;
    const it={k:'bone',sci:1,rare:1,e:'🦴',n:`${f.n} ${f.parts[f.camp]}`,id:f.id,i:f.camp};res.sacks[Math.floor(Math.random()*res.sacks.length)].items.push(it);res.bone=it;}}
  if((sci.rocks||0)<3&&Math.random()<(ROCK[len]||ROCK.mid)){sci.rocks=(sci.rocks||0)+1;sci.got=(sci.got||0)+1;c.rocks++;
   const it={k:'rock',sci:1,rare:1,e:'🪨',n:'Mystery Rock'};res.sacks[Math.floor(Math.random()*res.sacks.length)].items.push(it);res.rock=it;}}
 return out;}

/* ---------- points + rewards (granted the moment they are earned, shown afterwards) ---------- */
function grant(p,m){const c=C(p),a=p.adv;const got={m,lines:[]};
 if(!a.badges.includes(m.id))a.badges.push(m.id);p.coins=(p.coins||0)+(m.coins||0);got.lines.push(`🪙 ${m.coins} coins`);
 p.owned=p.owned||{};p.owned.hats=p.owned.hats||[];p.owned.robes=p.owned.robes||[];
 if(m.hat&&!p.owned.hats.includes(m.hat))p.owned.hats.push(m.hat);
 if(m.robe&&!p.owned.robes.includes(m.robe))p.owned.robes.push(m.robe);
 if(m.pet){defs();p.pets=p.pets||[];if(!p.pets.includes(m.pet)){p.pets.push(m.pet);try{petData(p,m.pet);}catch(e){}if(!p.pet)p.pet=m.pet;}}
 return got;}
function addPts(p,n){const c=C(p);c.pts+=n;const won=[];
 while(c.pts>=nextAt(c)){if(c.got<TRACK.length){won.push(grant(p,TRACK[c.got]));}else{c.stars++;p.coins=(p.coins||0)+STAR_COINS;won.push({m:{id:'star',e:'⭐',n:'Clean-Up Star',c:'#f59f00',coins:STAR_COINS,star:c.stars},lines:[`🪙 ${STAR_COINS} coins`]});}
  c.got++;c.load={rec:0,tra:0,com:0};}
 return won;}

/* ---------- art ---------- */
const LEADER=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" aria-hidden="true">
<ellipse cx="50" cy="116" rx="27" ry="4" fill="rgba(0,0,0,.2)"/>
<path d="M37 86 L35 113 L47 113 L48 86Z M63 86 L65 113 L53 113 L52 86Z" fill="#6b4f2a"/><rect x="32" y="109" width="16" height="7" rx="3" fill="#3b2a17"/><rect x="52" y="109" width="16" height="7" rx="3" fill="#3b2a17"/>
<path d="M29 56 Q31 46 50 46 Q69 46 71 56 L74 90 Q50 95 26 90Z" fill="#5c940d" stroke="#3f6212" stroke-width="2"/>
<path d="M40 47 L50 62 L60 47 Z" fill="#ffd43b" stroke="#e67700" stroke-width="1.5"/><circle cx="50" cy="60" r="3" fill="#e67700"/>
<rect x="33" y="64" width="9" height="8" rx="2" fill="#74b816" stroke="#3f6212"/><circle cx="62" cy="68" r="4.5" fill="#fff" stroke="#1c7ed6" stroke-width="1.5"/><text x="62" y="70.5" font-size="6" text-anchor="middle">♻</text>
<path d="M29 58 Q18 70 20 84" stroke="#5c940d" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="20" cy="86" r="5" fill="#b87a4b"/>
<path d="M71 58 Q82 64 84 74" stroke="#5c940d" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="84" cy="76" r="5" fill="#b87a4b"/>
<path d="M85 74 L94 112" stroke="#868e96" stroke-width="3" stroke-linecap="round"/><path d="M92 110 l-4 5 M95 110 l2 5" stroke="#495057" stroke-width="2.5" stroke-linecap="round"/>
<path d="M14 88 L26 88 L25 104 L15 104Z" fill="#339af0" stroke="#1864ab" stroke-width="2"/>
<circle cx="50" cy="33" r="15" fill="#b87a4b"/>
<path d="M35 33 Q33 44 38 50 L41 40Z M65 33 Q67 44 62 50 L59 40Z" fill="#2b1d12"/>
<circle cx="44" cy="34" r="2" fill="#2b1d12"/><circle cx="56" cy="34" r="2" fill="#2b1d12"/><path d="M44 41 Q50 46 56 41" stroke="#7a2e12" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="40" cy="39" r="2.5" fill="#e8805d" opacity=".5"/><circle cx="60" cy="39" r="2.5" fill="#e8805d" opacity=".5"/>
<ellipse cx="50" cy="23" rx="26" ry="5.5" fill="#c8a165" stroke="#6b4f2a" stroke-width="2"/><path d="M37 23 Q38 11 44 5 L50 10 L56 5 Q62 11 63 23Z" fill="#b08447" stroke="#6b4f2a" stroke-width="2" stroke-linejoin="round"/><rect x="37" y="18" width="26" height="4" fill="#2f9e44"/>
</svg>`;
function binSVG(b,fill,big){const B=BINS[b];const f=Math.max(0,Math.min(1,fill||0));const top=92-f*62;
 return `<svg viewBox="0 0 80 100" class="cu-binsvg" aria-hidden="true"><defs><clipPath id="cuc${b}${big?'b':''}"><path d="M12 26 L68 26 L62 94 L18 94Z"/></clipPath></defs>
  <path d="M12 26 L68 26 L62 94 L18 94Z" fill="${B.bg}" stroke="${B.c}" stroke-width="4" stroke-linejoin="round"/>
  ${f>0?`<rect x="0" y="${top.toFixed(1)}" width="80" height="100" fill="${B.c}" opacity=".6" clip-path="url(#cuc${b}${big?'b':''})"/>`:''}
  <path d="M28 40 L28 84 M40 40 L40 84 M52 40 L52 84" stroke="${B.c}" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>
  <rect x="6" y="15" width="68" height="11" rx="4" fill="${B.lid}"/><rect x="31" y="9" width="18" height="7" rx="3" fill="${B.lid}"/>
  <text x="40" y="66" font-size="26" text-anchor="middle">${B.e}</text></svg>`;}
const badgeHTML=(m,on,sz)=>`<span class="cu-badge ${on?'':'off'}" style="--bc:${m.c};${sz?`--bs:${sz}px`:''}" title="${esc(m.n)}"><i>${on?m.e:'❔'}</i></span>`;
function prizeLine(m){return m.pet?'🤖 a rare pet: <b>Sorty the Recycle Bot</b>':m.hat?'👒 the <b>Scout Hat</b>':m.robe?`👘 the <b>${esc((ROBE_DEFS.find(r=>r.id===m.robe)||{}).name)}</b> robe`:`🪙 ${m.coins} coins`;}

/* ---------- speech ---------- */
let LAST_SAY='';
function speak(t){try{let x=String(t).replace(/<[^>]+>/g,' ');try{x=x.replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}‍️]/gu,'');}catch(e){}try{speechSynthesis.cancel();}catch(e){}say(typeof speakable==='function'?speakable(x):x,.9);}catch(e){}}
function autoSay(p,t){LAST_SAY=t;try{if(young(p)&&voiceOn())setTimeout(()=>speak(t),250);}catch(e){}}
/* 🔊 tap again to stop: the game's speakToggle() when there, else cancel whatever is being spoken */
const spkTog=fn=>{try{if(typeof speakToggle==='function'){speakToggle(fn);return;}if(window.speechSynthesis&&(speechSynthesis.speaking||speechSynthesis.pending)){speechSynthesis.cancel();return;}}catch(e){}fn();};
const spkBtn=`<button class="cu-spk" onclick="Cleanup.readAloud()" aria-label="Read it to me">🔊</button>`;
const bubble=(t)=>`<div class="qz-row cu-row"><div class="qz-av">${LEADER}</div><div class="qz-bub cu-bub"><b>🧤 ${NAME} ${spkBtn}</b><div id="cuSay">${t}</div></div></div>`;

/* ---------- the sorting game ---------- */
let SORT=null;
function sortModal(){const p=P(),c=C(p);if(!c.pend.length){SORT=null;return false;}css();
 const items=c.pend.slice(0,BATCH);const firstTime=!c.sorted;
 SORT={items,done:[],sel:0,gain:0,ok:0,won:[],msg:''};
 const y=young(p);
 SORT.msg=firstTime?(y?`Hi ${first(p)}! I'm ${NICK}. Your crew picked up litter! Tap a thing. Then tap the right bin.`:`Hi ${first(p)}! I'm ${NAME}, but you can call me ${NICK}. Your crew picked up litter on the trail. Great scouts! Let's sort it: tap an item, then tap the bin it goes in.`)
  :(y?`Nice clean-up! Tap a thing. Then tap a bin.`:pk([`Great clean-up, crew! ${items.length} pieces to sort. Tap an item, then tap its bin.`,`Look what the crew picked up! Let's sort it: tap an item, then a bin.`,`The trail is cleaner thanks to you! Sort these ${items.length} pieces.`]));
 drawSort();autoSay(p,SORT.msg);return true;}
function drawSort(){const S=SORT;if(!S)return;const p=P(),c=C(p);const left=S.items.map((id,i)=>i).filter(i=>!S.done.includes(i));
 if(left.length&&!left.includes(S.sel))S.sel=left[0];
 const fin=!left.length;
 modal(`<div class="mcard cu-sort">${S.done.length?'':newsHTML()}${bubble(S.msg)}
  ${fin?'':`<div class="cu-pile">${S.items.map((id,i)=>{const x=LIT_BY[id];if(S.done.includes(i))return '';return `<button class="cu-it ${S.sel===i?'sel':''}" onclick="Cleanup.pick(${i})" aria-label="${esc(x.n)}"><span class="e">${icon(x)}</span><span class="n">${esc(x.n)}</span></button>`;}).join('')}</div>
  <div class="cu-bins">${BIN_IDS.map(b=>`<button class="cu-bin" id="cuBin_${b}" onclick="Cleanup.drop('${b}')" style="--bc:${BINS[b].c}">${binSVG(b,0)}<b>${BINS[b].n}</b></button>`).join('')}</div>`}
  <div class="cu-foot"><span>♻️ <b>+${S.gain}</b> Clean-Up points${S.done.length?` · ${S.ok}/${S.done.length} right`:''}</span><span class="muted">${S.done.length}/${S.items.length} sorted</span></div>
  ${fin?`<div class="adv-meter cu-meter"><i style="width:${Math.min(100,(c.pts-prevAt(c))/Math.max(1,nextAt(c)-prevAt(c))*100).toFixed(1)}%"></i></div><p class="cu-next">${nextLine(c)}</p>`:''}
  <div class="row">${fin?(S.won.length?`<button class="btn gold big" onclick="Cleanup.rewards()">🎁 You earned a reward!</button>`:c.pend.length?`<button class="btn ghost dark" onclick="Cleanup.close()">Done for now</button><button class="btn green big" onclick="Cleanup.sort()">♻️ Sort ${c.pend.length} more</button>`:`<button class="btn green big" onclick="Cleanup.close()">🙌 All sorted!</button>`)
   :`<button class="btn ghost dark small" onclick="Cleanup.close()">Sort later</button>`}</div></div>`);}
function pickIt(i){if(!SORT||SORT.done.includes(i))return;SORT.sel=i;try{SFX.tap();}catch(e){}drawSort();const x=LIT_BY[SORT.items[i]];if(x&&young(P())&&voiceOn())speak(x.n);}
function drop(b){const S=SORT;if(!S)return;NEWS='';const i=S.sel;if(S.done.includes(i)||i==null)return;const id=S.items[i],x=LIT_BY[id];if(!x)return;
 const p=P(),c=C(p);const ok=b===x.b||b===x.alt;const into=ok?b:x.b;const pts=ok?PT_RIGHT:PT_WRONG;
 const at=c.pend.indexOf(id);if(at>=0)c.pend.splice(at,1);
 c.sorted++;if(ok)c.right++;c.bins[into]++;c.load[into]++;c.seen[id]=(c.seen[id]||0)+1;S.done.push(i);S.gain+=pts;if(ok)S.ok++;
 const won=addPts(p,pts);S.won=S.won.concat(won);if(won.length)c.rw=(c.rw||[]).concat(won.map(w=>w.m.star?{s:w.m.star}:{id:w.m.id}));save();
 const fin=S.done.length>=S.items.length;
 const y=young(p);
 S.msg=ok?`${pk(['✅ Yes!','✅ You got it!','✅ Right!','✅ Super sorting!'])} ${b!==x.b?`That works! (Best bin: ${BINS[x.b].e} ${BINS[x.b].n}.) `:''}${icon(x)} <b>${esc(x.n)}</b> → ${BINS[b].e} ${BINS[b].n}. ${esc(x.f)}`
  :`${pk(['Oops, almost!','Close one!','Good try!'])} The ${icon(x)} <b>${esc(x.n)}</b> goes in ${BINS[x.b].e} <b>${BINS[x.b].n}</b>${x.alt?` (or ${BINS[x.alt].e} ${BINS[x.alt].n})`:''}. ${esc(x.f)} I put it there for you!`;
 if(fin)S.msg+=`<br><br>${y?`All done! +${S.gain} points!`:`That's all of it! You earned <b>+${S.gain}</b> Clean-Up points.`}${S.won.length?' And look… a reward! 🎁':''}`;
 try{ok?SFX.correct():tone(330,.12,'sine',.06);}catch(e){}
 drawSort();const el=document.getElementById('cuBin_'+into);if(el){el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');floatAt(el,`+${pts}`);}
 autoSay(p,S.msg);}
function floatAt(el,t){try{const r=el.getBoundingClientRect(),f=document.createElement('span');f.className='cu-float';f.textContent=t;f.style.left=(r.left+r.width/2-14)+'px';f.style.top=(r.top+10)+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1500);}catch(e){}}
function nextLine(c){const at=nextAt(c),m=nextM(c),need=Math.max(0,at-c.pts),trips=Math.max(1,Math.ceil(need/perTrip(c)));
 return m?`Next reward at <b>${at}</b> points: ${badgeHTML(m,1,26)} <b>${esc(m.n)}</b> badge + ${prizeLine(m)} <span class="muted">(${need} to go · about ${trips} more trip${trips>1?'s':''})</span>`
  :`Next ⭐ Clean-Up Star at <b>${at}</b> points <span class="muted">(${need} to go)</span>`;}
function close(){if(SORT&&SORT.won&&SORT.won.length)return rewards(); /* "Sort later" after earning a badge: show the reward first, never lose it */SORT=null;NEWS='';try{speechSynthesis.cancel();}catch(e){}closeModal();redraw();}
function redraw(){try{if(typeof curScreen!=='undefined'&&curScreen==='camp'&&window.Adv)Adv.draw();}catch(e){}}

/* ---------- reward reveal ---------- */
/* rewards earned but not yet shown (saved, so a reload or 'Sort later' never loses the big reveal) */
function rwList(c){return (c.rw||[]).map(x=>{if(x.s)return {m:{id:'star',e:'⭐',n:'Clean-Up Star',c:'#f59f00',coins:STAR_COINS,star:x.s},lines:[`🪙 ${STAR_COINS} coins`]};const m=TRACK.find(t=>t.id===x.id);return m?{m,lines:[`🪙 ${m.coins} coins`]}:null;}).filter(Boolean);}
function rewards(list){const p=P(),c=C(p);list=list||(SORT&&SORT.won&&SORT.won.length?SORT.won:rwList(c));if(SORT)SORT.won=[];if(!list.length){SORT=null;return close();}css();const r=list[0],rest=list.slice(1),m=r.m;
 if(c.rw&&c.rw.length){const k=c.rw.findIndex(x=>m.star?x.s===m.star:x.id===m.id);if(k>=0){c.rw.splice(k,1);save();}}
 let art=badgeHTML(m,1,110),extra='',btn2='';
 if(m.hat){art=`<div class="cu-hero">${heroSVG(Object.assign({},p.look,{hat:m.hat}))}</div>`;extra=`<p>A brand-new hat: the <b>👒 Scout Hat</b>! It's never sold in the shop. Find it in your Backpack → Hats.</p>`;btn2=`<button class="btn" onclick="Cleanup.wear('hat','${m.hat}')">👒 Wear it now!</button>`;}
 else if(m.robe){const R=ROBE_DEFS.find(x=>x.id===m.robe);art=`<div class="cu-hero">${heroSVG(Object.assign({},p.look,{robe:m.robe}))}</div>`;extra=`<p>A brand-new robe: <b>👘 ${esc(R.name)}</b>! It's never sold in the shop. Find it in your Backpack → Robes.</p>`;btn2=`<button class="btn" onclick="Cleanup.wear('robe','${m.robe}')">👘 Wear it now!</button>`;}
 else if(m.pet){art=`<div class="cu-pet">🤖</div>`;extra=`<p><b>Sorty the Recycle Bot</b> rolled into camp! "Beep boop! I heard you are the best sorter around. Can I join your crew?"</p><p class="muted">Sorty is a special Clean-Up pet: you can only get Sorty here. Sorty never runs off to the Pet Rescue and the Troll can't take Sorty.</p>`;btn2=`<button class="btn" onclick="Cleanup.buddy()">🤖 Make Sorty my buddy!</button>`;}
 const head=m.star?`⭐ Clean-Up Star #${m.star}!`:`🎖️ New merit badge: ${esc(m.n)}!`;
 const txt=m.star?`You're a super sorter! Here's a star and ${m.coins} coins.`:`${NICK} pins the <b>${esc(m.n)}</b> badge on your sash. 🚛 The recycling truck came and emptied your bins!`;
 LAST_SAY=`${head} ${txt} ${extra}`;
 modal(`<div class="mcard cu-rew" style="--bc:${m.c}"><div class="cu-rart">${art}</div>${m.hat||m.robe||m.pet?`<div class="cu-rbadge">${badgeHTML(m,1,54)}</div>`:''}<h2>${head}</h2><p>${txt}</p>${extra}<p class="cu-rl">${r.lines.join(' · ')}</p>
  <div class="row">${btn2}<button class="btn gold big" onclick="${rest.length?'Cleanup._more()':'Cleanup.close()'}">${rest.length?'Next reward ➜':'Yay! 🎉'}</button> ${spkBtn}</div></div>`);
 REST=rest;try{SFX.win();if(m.pet||m.hat||m.robe)setTimeout(()=>SFX.level(),600);}catch(e){}if(young(p)&&voiceOn())setTimeout(()=>speak(`${head} ${txt}`),400);}
let REST=[];
function wear(k,id){const p=P();if(k==='hat'&&p.owned.hats.includes(id))p.look.hat=id;if(k==='robe'&&p.owned.robes.includes(id))p.look.robe=id;save();try{SFX.tap();}catch(e){}toast(k==='hat'?'👒 Looking sharp, scout!':'👘 You look amazing!');}
function buddy(){const p=P();if(window.Adv&&Adv.away(p,BOT.id))return toast('Sorty is on an adventure right now!');if(p.pets.includes(BOT.id)){p.pet=BOT.id;save();try{SFX.tap();}catch(e){}toast('🤖 Sorty is your battle buddy! Beep boop!');}}

/* ---------- after a trip: rare science find first, then sorting ---------- */
function wants(r){try{const p=P();return !!(p&&(r&&(r.bone||r.rock)||C(p).pend.length||(C(p).rw||[]).length));}catch(e){return false;}}
let NEWS='';const newsHTML=()=>NEWS?`<div class="cu-news">${esc(NEWS)}</div>`:'';
function afterTrip(r,news){const p=P();if(!p)return;const c=C(p);NEWS=news||'';
 if(r&&(r.bone||r.rock)){css();const bits=[];
  if(r.bone){const D=CDd(),f=D&&D.FOSSILS.find(x=>x.id===r.bone.id);if(f)bits.push(`<div class="cu-sci"><span class="cu-scie">${fart(f)}</span><div><b>🦴 ${esc(f.n)}: ${esc(f.parts[f.camp])}!</b><small>This piece is <b>only</b> found by Adventure Camp crews. I sent it to Dr. Quartz's 🏛️ Museum in the Science Cave. Dig up the other pieces there to build the skeleton!</small></div></div>`);}
  if(r.rock)bits.push(`<div class="cu-sci"><span class="cu-scie">🪨</span><div><b>A Mystery Rock!</b><small>Dr. Quartz will want to see this. He'll come find you on the map soon!</small></div></div>`);
  const t=`WOW! Look what your crew found on the trail! 🔬`;LAST_SAY=t+' '+bits.join(' ');
  modal(`<div class="mcard cu-sort">${newsHTML()}${bubble(t)}${bits.join('')}<div class="row"><button class="btn green big" onclick="${c.pend.length?'Cleanup.sort()':'Cleanup.close()'}">${c.pend.length?'♻️ Now let\'s sort the litter ➜':'Awesome! 🎉'}</button></div></div>`);
  NEWS='';try{SFX.win();}catch(e){}autoSay(p,t+(r.bone?' A fossil for the Science Cave!':' A mystery rock!'));return;}
 if(c.pend.length)sortModal();else if((c.rw||[]).length)rewards();}

/* ---------- Clean-Up tab ---------- */
function html(p){css();const c=C(p),a=p.adv;const lo=prevAt(c),hi=nextAt(c),f=Math.min(1,(c.pts-lo)/Math.max(1,hi-lo));const mx=Math.max(1,...BIN_IDS.map(b=>c.load[b]));
 const y=young(p);const intro=c.sorted?(y?`You have <b>${c.pts}</b> points! Fill the bins to win prizes.`:`Every trip, your crew picks up litter on the trail. Sort it into the right bins to earn Clean-Up points. When the bins fill up, you win a reward!`)
  :(y?`Hi! I'm ${NICK}. Send pets on a trip. They pick up litter. You sort it!`:`Hi! I'm ${NAME}. Every trip, your crew picks up litter along the trail. When they come home, you sort it into ♻️ Recycle, 🗑️ Trash or 🌱 Compost. Fill the bins to earn badges, outfits and a very special pet!`);
 LAST_SAY=intro;
 const seenN=LITTER.filter(x=>c.seen[x.id]).length;
 const badges=TRACK.map(m=>badgeHTML(m,a.badges.includes(m.id))).join('')+(c.stars?`<span class="cu-stars">⭐ × ${c.stars}</span>`:'');
 const track=TRACK.map((m,i)=>{const done=i<c.got,nx=i===c.got;const big=m.pet||m.hat||m.robe;const need=Math.max(0,m.at-c.pts),trips=Math.ceil(need/perTrip(c));
  return `<div class="cu-tr ${done?'done':''} ${nx?'next':''} ${big?'big':''}">${badgeHTML(m,done,34)}<div><b>${esc(m.n)}</b><small>${m.at} pts · ${prizeLine(m)}</small></div><span class="cu-trs">${done?'✅':nx?`${need} to go<br><small>≈ ${trips} trip${trips>1?'s':''}</small>`:(m.pet?'🌟':big?'⭐':'')}</span></div>`;}).join('');
 const met=p.sci&&p.sci.met;const cf=campFossils();const fos=(p.cave&&p.cave.fos)||{},ex=(p.cave&&p.cave.ex)||{};
 const sci=cf.length?`<div class="panel cu-panel"><h3>🔬 Science Cave finds</h3><p class="muted" style="margin:0 0 6px">${met?'Once in a long while, your crew finds something for Dr. Quartz: a special fossil piece (only camp crews can find these!) or a mystery rock. Longer trips are luckier.':'After you meet <b>Dr. Quartz</b> the science teacher, your crew might (very rarely!) find fossils and mystery rocks for the Science Cave.'}</p>
  <div class="cu-fos">${cf.map(f=>{const has=(fos[f.id]||[])[f.camp];return `<div class="cu-fo ${has||ex[f.id]?'got':''}"><span class="e">${has||ex[f.id]?fart(f):'❔'}</span><b>${has||ex[f.id]?esc(f.n):'???'}</b><small>${ex[f.id]?'🏛️ In the Museum':has?`🦴 ${esc(f.parts[f.camp])} found!`:'🏕️ camp-only piece'}</small></div>`;}).join('')}</div>${c.rocks?`<p style="margin:6px 0 0">🪨 Mystery rocks found by your crew: <b>${c.rocks}</b></p>`:''}</div>`:'';
 return `<div class="panel cu-panel">${bubble(intro)}
  ${c.pend.length?`<div class="cu-pend"><span>🧤 <b>${c.pend.length}</b> piece${c.pend.length>1?'s':''} of litter waiting to be sorted!${c.pend.length>=PEND_MAX?' <small>(The pile is full! Sort it so your crew can pick up more.)</small>':''}</span><button class="btn green" onclick="Cleanup.sort()">♻️ Sort now</button></div>`:''}
  <div class="cu-binrow">${BIN_IDS.map(b=>{const fl=f*c.load[b]/mx;return `<div class="cu-bbox">${binSVG(b,fl,1)}<b>${BINS[b].e} ${BINS[b].n}</b><small>${c.bins[b]} sorted${fl>=.99?' · FULL!':''}</small></div>`;}).join('')}</div>
  <div class="cu-pts"><span>♻️ Clean-Up points: <b>${c.pts}</b></span>${c.sorted?`<span class="muted">${Math.round(c.right/c.sorted*100)}% sorted right</span>`:''}</div>
  <div class="adv-meter cu-meter"><i style="width:${(f*100).toFixed(1)}%"></i></div><p class="cu-next">${nextLine(c)}</p></div>
 <div class="adv-cols"><div class="panel cu-panel"><h3>🎖️ Merit badges <span class="muted" style="font-size:14px">${a.badges.filter(id=>TRACK.some(m=>m.id===id)).length}/${TRACK.length}</span></h3><div class="cu-badges">${badges}</div>
  <h3 style="margin-top:12px">🛤️ Rewards trail</h3><div class="cu-track">${track}</div><p class="muted" style="margin:6px 0 0;font-size:13px">After the last badge, every ${STAR_EVERY} points earns a ⭐ Clean-Up Star (+🪙 ${STAR_COINS}).</p></div>
  <div>${sci}<div class="panel cu-panel" style="margin-top:${sci?'14px':'0'}"><h3>📋 Litter log <span class="muted" style="font-size:14px">${seenN}/${LITTER.length}</span></h3><p class="muted" style="margin:0 0 6px">Every kind of litter you've sorted. Tap one to hear where it goes.</p>
  <div class="cu-log">${LITTER.map(x=>c.seen[x.id]?`<button class="cu-lg" onclick="Cleanup.fact('${x.id}')"><span class="e">${icon(x)}</span><b>${esc(x.n)}</b><small>${BINS[x.b].e} ×${c.seen[x.id]}</small></button>`:`<div class="cu-lg no"><span class="e">❔</span><b>???</b></div>`).join('')}</div></div></div></div>`;}
function fact(id){const x=LIT_BY[id];if(!x)return;css();const t=`${icon(x)} <b>${esc(x.n)}</b> goes in ${BINS[x.b].e} <b>${BINS[x.b].n}</b>${x.alt?` (${BINS[x.alt].e} ${BINS[x.alt].n} is OK too)`:''}. ${esc(x.f)}`;LAST_SAY=t;
 modal(`<div class="mcard cu-sort">${bubble(t)}<div class="row"><button class="btn green" onclick="closeModal()">Got it!</button></div></div>`);if(voiceOn())speak(t);}
function campStrip(p){css();const c=C(p);if(!c.pend.length&&!(c.rw&&c.rw.length))return '';
 if(!c.pend.length)return `<div class="cu-strip"><span class="e">🎁</span><span><b>You have a Clean-Up reward waiting!</b><small>Scout Leader Mari has something for you.</small></span><button class="btn gold" onclick="Cleanup.rewards()">🎁 Open it</button></div>`;
 return `<div class="cu-strip"><span class="e">🧤</span><span><b>${c.pend.length} piece${c.pend.length>1?'s':''} of litter</b> to sort!<small>${nextLine(c).replace(/<span class="muted">.*<\/span>/,'')}</small></span><button class="btn green" onclick="Cleanup.sort()">♻️ Sort now</button></div>`;}
function tabLabel(p){const n=C(p).pend.length;return `♻️ Clean-Up${n?` <span class="cu-dot">${n}</span>`:''}`;}
function shelfBadges(p){const a=p.adv||{},c=C(p);const got=TRACK.filter(m=>(a.badges||[]).includes(m.id));if(!got.length&&!c.stars)return '';css();
 return `<div class="panel cu-shelfb"><b>🎖️ Clean-Up merit badges</b><div class="cu-badges">${got.map(m=>badgeHTML(m,1,40)).join('')}${c.stars?`<span class="cu-stars">⭐ × ${c.stars}</span>`:''}</div></div>`;}

/* ---------- Backpack: Sorty gets its own little shelf (it isn't in the normal tiers) ---------- */
function bagInject(p){try{defs();const sec=document.querySelector('.bpsec[data-t="pets"]');if(!sec||sec.querySelector('.cu-bag'))return;const own=(p.pets||[]).includes(BOT.id);
 const a=p.adv||{};if(!own&&!(a.trips>0))return;css();
 let body='';if(own){const eq=p.pet===BOT.id;let st='';try{st=petStage(petData(p,BOT.id)).n;}catch(e){}const away=window.Adv&&Adv.away(p,BOT.id);
  body=`<button class="item ${eq?'eq':''}" onclick="shopClick('pet','${BOT.id}')"><div class="ie">${BOT.e}</div><div>${esc(BOT.name)}</div><small>${away?'🎒 On an adventure<br>':''}🪙 Extra coins${st?'<br>'+esc(st):''}</small><div class="ip">${eq?'✓ Using':'Use'}</div></button>`;}
 else body=`<div class="item mystery moretile"><div class="ie">❓</div><div>1 more to discover</div><small>Only the ♻️ Adventure Camp Clean-Up can earn it.</small></div>`;
 sec.insertAdjacentHTML('beforeend',`<div class="cu-bag"><h4 class="tierh" style="color:#2f9e44">♻️ Clean-Up <span class="muted">${own?1:0} / 1</span></h4><div class="items">${body}</div></div>`);}catch(e){}}

/* ---------- styles ---------- */
const CSS=`
.qz-row{display:flex;gap:12px;align-items:flex-start;text-align:left}.qz-av{flex:0 0 96px}.qz-av svg{width:96px;height:116px}
.qz-bub{flex:1;background:#e7f5ff;border:3px solid #74c0fc;border-radius:18px;padding:10px 14px;font-size:18px;line-height:1.45;color:#1f2340}.qz-bub>b{display:block;color:#1971c2;font-size:14px;margin-bottom:2px}
@media(max-width:560px){.qz-av{flex-basis:70px}.qz-av svg{width:70px;height:85px}.qz-bub{font-size:16px}}
.cu-news{background:#fff4e6;border:2px solid #ffc078;border-radius:12px;padding:6px 10px;margin:0 0 10px;font-weight:700;font-size:15px;text-align:center}
.cu-bub{background:#f4fce3;border-color:#94d82d}.cu-bub>b{color:#5c940d}
.cu-spk{background:#fff;border:2px solid #c0eb75;border-radius:10px;font-size:14px;padding:0 6px;margin-left:6px;cursor:pointer;line-height:1.5;vertical-align:1px}
.mcard.cu-sort{max-width:620px;color:var(--ink)}
.cu-pile{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:12px 0 8px}
.cu-it{background:#fff;border:3px solid #e9ecef;border-radius:16px;padding:6px 6px 4px;width:88px;min-height:82px;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--ink);box-shadow:0 3px 0 rgba(0,0,0,.08);cursor:pointer;animation:advpop .3s both}
.cu-it .e{font-size:36px;line-height:1.1}.cu-it .n{font-size:12px;font-weight:700;line-height:1.15;text-align:center}
.cu-it.sel{border-color:#fab005;background:#fff9db;transform:translateY(-4px);box-shadow:0 6px 0 rgba(250,176,5,.35)}
.cu-bins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:6px 0 8px}
.cu-bin{background:#fff;border:3px solid var(--bc);border-radius:18px;padding:6px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--ink);cursor:pointer;min-height:120px}
.cu-bin b{font-size:17px;color:var(--bc)}.cu-bin:active{transform:scale(.97)}
.cu-binsvg{width:74px;height:92px;display:block}
.cu-bin.hit{animation:cuhit .5s}@keyframes cuhit{30%{transform:scale(1.08) rotate(-3deg)}60%{transform:scale(.97) rotate(2deg)}}
.cu-float{position:fixed;z-index:90;font-weight:800;font-size:24px;color:#2b8a3e;text-shadow:0 2px 0 #fff;pointer-events:none;animation:advfloat 1.4s ease-out forwards}
.cu-foot{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:15px;margin:2px 2px 6px}
.cu-next{font-size:14px;margin:4px 0 8px;line-height:1.6}.cu-next .cu-badge{vertical-align:middle}
.cu-meter i{background:linear-gradient(90deg,#51cf66,#2f9e44)}
.cu-badge{--bs:48px;width:var(--bs);height:var(--bs);border-radius:50%;display:inline-grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff 0 30%,#f1f3f5 70%);background:radial-gradient(circle at 35% 30%,#fff 0 30%,color-mix(in srgb,var(--bc) 25%,#fff) 70%);border:calc(var(--bs)*.07) solid var(--bc);box-shadow:inset 0 0 0 calc(var(--bs)*.05) #fff,inset 0 0 0 calc(var(--bs)*.08) var(--bc);flex:none}
.cu-badge i{font-style:normal;font-size:calc(var(--bs)*.5);line-height:1}
.cu-badge.off{filter:grayscale(1);opacity:.35}
.cu-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;align-items:center}.cu-stars{font-weight:700;font-size:18px}
.cu-panel{color:var(--ink)}.cu-panel h3{margin:0 0 6px;font-size:20px}
.cu-pend,.cu-strip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff9db;border:3px solid #ffd43b;border-radius:16px;padding:8px 12px;margin:10px 0;color:var(--ink);animation:advglow 1.6s ease-in-out infinite}
.cu-pend .btn,.cu-strip .btn{white-space:nowrap;flex:none}
.cu-strip{margin:0 0 12px}.cu-strip .e{font-size:30px}.cu-strip>span:nth-child(2){flex:1;min-width:0}@media(max-width:420px){.cu-strip{flex-wrap:wrap}.cu-strip .btn{flex:1 1 100%;margin:0}}.cu-strip small{display:block;font-size:12px;opacity:.8}.cu-strip .cu-badge{--bs:20px!important;vertical-align:middle}
.cu-binrow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:10px 0 4px;text-align:center}
.cu-bbox{display:flex;flex-direction:column;align-items:center}.cu-bbox .cu-binsvg{width:90px;height:112px}.cu-bbox b{font-size:15px}.cu-bbox small{font-size:12px;opacity:.75}
.cu-pts{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:17px;margin-top:6px}
.cu-track{display:grid;gap:6px;padding:2px} /* shown in full, no inner scroll (owner, Oct 2026) */
.cu-tr{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;background:#f8f9fa;border-radius:14px;padding:6px 8px;border:2px solid transparent}
.cu-tr small{display:block;font-size:12px;opacity:.8}.cu-tr.done{background:#ebfbee}.cu-tr.next{border-color:#fab005;background:#fff9db}.cu-tr.big b{color:#7048e8}
.cu-trs{font-size:13px;font-weight:700;text-align:right;white-space:nowrap}
.cu-fos{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px}
.cu-fo{background:#f1f3f5;border-radius:12px;padding:6px;text-align:center}.cu-fo.got{background:#e7f5ff}.cu-fo .e{font-size:30px;display:block;line-height:1.2}.cu-fo b{font-size:13px;display:block}.cu-fo small{font-size:11px;opacity:.8}
.cu-log{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px}
.cu-lg{background:#f8f9fa;border-radius:12px;padding:5px 3px;text-align:center;color:var(--ink);display:flex;flex-direction:column;align-items:center;min-width:0}.cu-lg .e{font-size:26px;line-height:1.2}.cu-lg b{font-size:11px;line-height:1.15}.cu-lg small{font-size:11px;opacity:.75}
.cu-lg.no .e{opacity:.3}.cu-lg.no b{color:#adb5bd}
.cu-dot{background:#ff6b6b;color:#fff;border-radius:9px;padding:0 6px;font-size:12px;margin-left:2px}
.cu-shelfb{color:var(--ink);margin-bottom:12px}
.mcard.cu-rew{text-align:center;max-width:460px;border:4px solid var(--bc)}.cu-rart{display:flex;justify-content:center;margin:4px 0}.cu-rbadge{margin:-8px 0 4px}
.cu-hero svg{width:130px;height:170px}.cu-pet{font-size:96px;line-height:1.1;animation:advpop .5s both}.cu-rl{font-weight:700}
.cu-sci{display:flex;gap:10px;align-items:center;background:#e7f5ff;border:3px solid #4dabf7;border-radius:16px;padding:10px 12px;margin:10px 0;text-align:left}.cu-scie{font-size:44px;line-height:1}.cu-sci small{display:block;font-size:14px;margin-top:2px}
@media(max-width:560px){.cu-it{width:76px;min-height:74px}.cu-it .e{font-size:30px}.cu-bin{min-height:104px}.cu-binsvg{width:58px;height:72px}.cu-bin b{font-size:15px}.cu-bbox .cu-binsvg{width:72px;height:90px}.cu-badge{--bs:42px}}
/* phones: 4 litter pieces per row and shorter bins so the pile AND the bins fit on one screen; every tap target stays 40px+ */
.cu-spk{min-width:40px;min-height:40px;font-size:16px}.cu-sort .row .btn{min-height:44px}
@media(max-width:560px){.cu-sort .qz-av{flex-basis:56px}.cu-sort .qz-av svg{width:56px;height:68px}.cu-sort .qz-bub{font-size:15px;padding:8px 10px;line-height:1.35}
 .cu-sort .cu-pile{gap:6px;margin:8px 0 6px}.cu-sort .cu-it{width:calc(25% - 5px);max-width:84px;min-width:60px;min-height:66px;padding:4px 2px 3px;border-radius:14px}.cu-sort .cu-it .e{font-size:28px}.cu-sort .cu-it .n{font-size:11px}
 .cu-sort .cu-bins{gap:6px}.cu-sort .cu-bin{min-height:92px;padding:4px 2px 6px}.cu-sort .cu-binsvg{width:48px;height:60px}.cu-sort .cu-bin b{font-size:14px}}
@media (prefers-reduced-motion:reduce){.cu-pend,.cu-strip{animation:none}.cu-bin.hit{animation:none}}`;
function css(){if(!document.getElementById('cuCSS')){const s=document.createElement('style');s.id='cuCSS';s.textContent=CSS;document.head.appendChild(s);}}

/* ---------- wiring ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({screen:s=>{try{if(s==='backpack'){const p=typeof P==='function'?P():null;if(p)bagInject(p);}}catch(e){}}});
window.Cleanup={onTrip,afterTrip,wants,html,campStrip,tabLabel,shelfBadges,sort:()=>{if(!sortModal())close();},pick:pickIt,drop,close,rewards:()=>rewards(),_more:()=>rewards(REST),wear,buddy,fact,
 readAloud:()=>spkTog(()=>speak(LAST_SAY)),state:p=>C(p),addPts:(p,n)=>addPts(p,n),
 LITTER,TRACK,BOT,HAT,ROBES:ROBE_DEFS,PT_RIGHT,PT_WRONG,LIT_COUNT:LIT,BONE,ROCK,BONE_PITY};
})();
