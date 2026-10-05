/* ================= Battle Pets (DEMO, Oct 2026) =================
   A Battle Cats-style lane battle played with the hero's REAL pets. Opened from the 🐾 building on the village plaza
   (demo access for every hero). In the full game each stage will be a hidden bonus level: a math world's stage opens after beating
   that world's boss, and the Fossil Stage opens when the Museum's dinosaurs are complete.
   HOW IT PLAYS
   - Lane: the Pet House on the right, the critter den on the left. Pets walk left, critters walk right; each stops at its range and attacks.
   - Treats come in on their own (like Battle Cats' money). Each pet costs treats and then needs time before it can be sent again.
   - The lane is wider than the screen: swipe it, drag it with the mouse, use the arrow keys, or tap the little map under it.
   - Treat Kitchen: spend treats now to make treats come faster and hold more (the one big money decision, like Battle Cats' Worker Cat).
   - Pet Pounce: charges over time; when full it knocks every critter back and hurts them (like the Cat Cannon).
   - Math = 🧱 Rebuild. When the Pet House is down to half, the kid can open the Rebuild panel: every right answer lays one big brick
     (+40% of the house). There are 5 bricks per battle, enough to rebuild the house twice from nothing. The battle keeps going.
     Rebuild questions are about speed, not difficulty: quick, easy facts for everyone (see easyQ).
   - Roles come from each pet's perk: shield = Wall (cheap, tough), power = Brawler (big hits, cracks armour), heal = Medic,
     lucky = Jumper (reaches flyers, lucky hits), xp = Archer (long range, reaches flyers), coins = Stomper (hits a whole group).
     Rarity and the pet's growth (Baby to Mighty, plus Mighty levels) make it stronger.
   - Critters have traits: swarm (many weak ones: Stompers), flying (only Jumpers and Archers reach them), armoured (Brawlers),
     speedy. When the den drops to half, the boss bursts out with a shockwave that knocks your pets back.
   - Crowns: each stage can be beaten at 1, 2 and 3 crowns (tougher critters, faster waves).
   - Math: easy, quick facts of the stage's skill (Addition Forest = addition…); the Fossil Stage mixes them.
   A wrong answer never takes anything away: it just doesn't lay a brick.
   - Keyboard: 1–5 send pets, K kitchen, Space pounce, R rebuild, arrows scroll; while rebuilding, type the answer and press Enter (Esc closes).
   SAVED: p.bp2 = {c:{stage: crowns beaten}, team:[pet ids], tr: Trainer sessions hired and not used yet, rec:{w,l,q}, st:{'stage:crown' or 'stage:aN': best stars}, tk:{world:{crown:'r'|'x'|'u', d:1}} medal tickets} and the play log p.bp (last 40 matches, for Parent Corner).
   Rewards feed the pets: pet XP for the team (a win gives more), and a snack the first time each crown is beaten.
   Uses Math Quest globals: P, state, save, go, topbar, toast, esc, SFX, tone, PETS, PET_TIERS, PERKS, petData, petStage, PET_STAGES, petLv,
   petGain, genQ, lvl, pickOpFair, ZONES, dayKey, say, speakable, speakToggle, voiceOn, W, SCREENS, curScreen, MQ_HOOKS, MQ_PARENT. */
(function(){
'use strict';
/* ⭐ stars for a win, by how fast and how safely: under STAR_T[0] seconds 3 ⭐, under STAR_T[1] 2 ⭐, otherwise 1 ⭐; one fewer (never
   below 1) if the Pet House ever dropped below half. Set by simulation of good play (Oct 2026): typical wins take ~3 min at crown 1
   and 4.5–5.5 min from crown 2 up, so about a third of good wins earn 3 ⭐. Best stars per level are kept in p.bp2.st. */
const STAR_T={1:[170,210],2:[230,320],3:[270,350]};
const lvKey=(id,c,a)=>a?id+':a'+a:id+':'+c,starStr=n=>'⭐'.repeat(n)+'☆'.repeat(3-n),bpTime=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function starsFor(g){if(!g||!g.win)return 0;const T=STAR_T[Math.min(3,g.crown||1)];let s=g.t<=T[0]?3:g.t<=T[1]?2:1;if((g.minH===undefined?1:g.minH)<.5)s=Math.max(1,s-1);return s;}
/* the level row on the team screen: every crown unlocked so far and every Ascend level up to one past the best, with their best stars */
function levelPicker(p,S){const pr=prog(p),c=pr.c[S.id]||0,best=(pr.asc||{})[S.id]||0,st=pr.st||{},out=[];
 if(VIEW.tk){const t=tickets(p,S.id);return `<div class="bp2-card bp2-lv"><b>🎟️ Battles</b><div class="bp2-lvrow">${ticketLevels(p,S.id).map(k=>{const on=k===VIEW.crown,s=st[lvKey(S.id,k,0)]||0;
  return `<button class="${on?'on':''}" onclick="BattlePets._lvl(${k},0)" aria-pressed="${on}">${'👑'.repeat(k)}<small>${t[k]==='x'?'1 more try':s?starStr(s):'1 battle'}</small></button>`;}).join('')}</div><small class="muted">${LEGEND_MSG}</small></div>`;}
 for(let k=1;k<=Math.min(3,c+1);k++)out.push({c:k,a:0,l:'👑'.repeat(k)});if(c>=3)for(let a=1;a<=best+1;a++)out.push({c:3,a,l:'✨ '+a});if(out.length<2)return '';
 return `<div class="bp2-card bp2-lv"><b>Level</b><div class="bp2-lvrow">${out.map(o=>{const on=o.c===VIEW.crown&&o.a===(VIEW.asc||0),s=st[lvKey(S.id,o.c,o.a)]||0,won=o.a?o.a<=best:o.c<=c;
  return `<button class="${on?'on':''}" onclick="BattlePets._lvl(${o.c},${o.a})" aria-pressed="${on}">${o.l}<small>${s?starStr(s):won?'won':'new'}</small></button>`;}).join('')}</div></div>`;}
const TRAINER_COST=50,TRAINER={slip:0,lag:0,calm:.7}; /* knobs for making the Trainer sloppier while it is comfortably ahead (slip = chance of a random move, lag = extra seconds to react).
   Off on purpose: by simulation the plain Trainer wins about 84% across crowns 1–3 (crown 1 always, crown 3 often needs the kid's Rebuild math), and any slip sank crowns 2–3 to 60–68%. */
const BP_X=28,BP_Y=20,LOG_MAX=40,DEN_X=6,HOUSE_X=94,MAX_OUT=12;
const me=()=>{try{return P();}catch(e){return null;}};
const on=p=>window.MQ_BP_BETA!==false&&!!p&&!!p.setup; /* demo access: every hero */
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const choose=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- roles (from the pet's perk) ---------- */
const ROLE={
 shield:{id:'wall',n:'Wall',e:'🛡️',cost:2,cd:2.5,hp:70,atk:3,rng:1.8,spd:5,tip:'Cheap and tough: holds the line'},
 power:{id:'brawler',n:'Brawler',e:'💥',cost:6,cd:7,hp:45,atk:15,rng:2,spd:4,armor:2,tip:'Big hits; cracks armour'},
 heal:{id:'medic',n:'Medic',e:'💚',cost:4,cd:8,hp:30,atk:2,rng:2,spd:4.5,heal:3,tip:'Heals pets nearby'},
 lucky:{id:'jumper',n:'Jumper',e:'🦘',cost:3,cd:4,hp:28,atk:7,rng:2,spd:7,fly:true,crit:.25,tip:'Fast; reaches flyers; lucky hits'},
 xp:{id:'archer',n:'Archer',e:'🏹',cost:4,cd:5,hp:22,atk:6,rng:11,spd:4,fly:true,tip:'Long range; reaches flyers'},
 coins:{id:'stomper',n:'Stomper',e:'🌀',cost:5,cd:6,hp:40,atk:6,rng:2.6,spd:3.5,area:true,tip:'Hits a whole group'}};
const roleOf=pet=>ROLE[pet&&pet.perk]||ROLE.shield;
/* pets that really fly (and the winged dragons) cruise through the air and can reach flying critters; they swoop down to hit ground ones */
const PET_FLY=['duck','owl','parrot','bee','flamingo','peacock','eagle','butterfly','dragon','skydragon'];
const flies=pet=>!!pet&&PET_FLY.includes(pet.id);
const reachesFly=pet=>!!pet&&(roleOf(pet).fly||flies(pet));
/* walking speed: every pet walks slower than its role's top speed, and the stronger (bigger) it is, the slower it goes */
const petSpd=(R,m)=>R.spd*TUNE.petSpd/(1+.5*(m-1));
/* 🧌 the mega: Grumbleroot the Troll (testing: every hero, every crown; how to earn him is still to be decided).
   Huge, slow and tough (the real Grumbleroot from the troll's cave, with a club); hits a whole group and cracks armour. Every few seconds he
   takes a big breath and ROARS: the blast hurts and throws back every critter in front of him, flyers too (his club can't reach flyers).
   When called he LEAPS from the Pet House to land just behind the lead pet, then walks slowly. He stays about 28 seconds
   once he reaches the fight (50 at most), then stomps home. A big wait: 40 s before the first call, 100 s between calls. */
/* 🦅 the other mega: Skyla the Giant Eagle (the eagle's own drawing, eagle.js). She walks, then rises into the air and DIVES down at an
   angle onto the critters ahead (flyers too), smacking them back; between dives she pecks. Only one mega per battle: the team builder picks. */
const EAGLE={id:'eagle',n:'Skyla',e:'🦅',cost:16,first:40,cd:100,life:28,maxLife:50,hp:420,atk:24,rng:3,spd:3.2,fly:true,dive:3.4,rise:.55,fall:.38,reach:5,tip:'Mega eagle: rises up and dives onto critters'};
const TROLL={id:'troll',n:'Grumbleroot',e:'🧌',cost:16,first:40,cd:100,life:28,maxLife:50,hp:500,atk:30,rng:3.6,spd:2.6,area:true,armor:2,pound:3.6,wind:.45,reach:12,tip:'Mega troll: huge and slow; his ROAR blasts critters back'};
function powerOf(p,pet){const pd=petData(p,pet.id),st=petStage(pd),si=Math.max(0,PET_STAGES.indexOf(st));const tm=((typeof PET_TIERS!=='undefined'&&PET_TIERS[pet.tier])||{mult:1}).mult||1;
 let ml=0;try{ml=petLv(pd)||0;}catch(e){}return Math.min(2.6,tm*(1+.2*si+.04*ml));}

/* ---------- critters ---------- */
const TRAIT={
 basic:{hp:30,atk:5,spd:4,rng:1.8},
 swarm:{hp:10,atk:2,spd:6,rng:1.6,group:3,tag:'swarm'},
 flying:{hp:24,atk:4,spd:5,rng:1.8,fly:true,tag:'flying'},
 armored:{hp:58,atk:6,spd:2.5,rng:2,armor:true,tag:'armoured'},
 speedy:{hp:18,atk:4,spd:9,rng:1.6,tag:'speedy'},
 boss:{hp:420,atk:14,spd:2.2,rng:3.2,boss:true,tag:'boss'}};
const TRAIT_ORDER=['basic','swarm','flying','armored','speedy'];
/* a critter's type comes from what it really is: only animals that really fly can fly (a bee, a bat, a bird), shells and armour
   are armoured, wolves, lizards and snakes are speedy, bugs, spiders, sparks and skeleton gangs come in swarms */
const T_FLY=['🐝','🦇','🦅','🐦','🦉','🦜','🪿'],T_ARM=['🐌','🦀','🦂','🐢','🤖','🗿','⛄','🦞','🪲'],T_FAST=['🐺','🦎','🐍','🐇','🐰','🦊'],T_SWARM=['🐛','🕷️','🔥','💀','🐜','🐟'];
const traitOf=e=>T_FLY.includes(e)?'flying':T_ARM.includes(e)?'armored':T_FAST.includes(e)?'speedy':T_SWARM.includes(e)?'swarm':'basic';
/* the critters' boss on every stage: the Grey Goblin from the Great Fade (fade.js draws him) */
const GOBLIN=['Grey Goblin','👺'];
const goblinArt=w=>window.MQ_GOBLIN_SVG?`<span class="bp2-gob" style="width:${w}px">${window.MQ_GOBLIN_SVG()}</span>`:GOBLIN[1];
const OPN={add:'Addition',sub:'Subtraction',mul:'Multiplication',div:'Division'};
function stages(){const out=[{id:'fossil',name:'Fossil Stage',art:'🦴',op:null,bg:['#efe3c8','#d8c49b'],where:'the Museum, when every dinosaur skeleton is built',
  crit:[['Bone Rattler','🦴','basic'],['Raptor Bones','🦖','swarm'],['Pterosaur Bones','🦅','flying'],['Neck Bones','🦕','armored'],['Speedy Skull','💀','speedy']],boss:GOBLIN,
  note:'Pretend! Real skeletons don\'t walk. Real fossils are bones turned to stone over millions of years.'}];
 (typeof ZONES!=='undefined'?ZONES:[]).forEach(z=>{if(!OPN[z.op]||out.some(s=>s.op===z.op)||!z.mons||z.mons.length<6)return;
  out.push({id:z.id,name:z.name,art:z.art||'⭐',op:z.op,where:`${z.name}, after beating ${z.mons[5][0]}`,bg:{add:['#d8f5c9','#a6dc8a'],sub:['#d9d2f0','#a99fd1'],mul:['#ffd8b8','#f0a070'],div:['#dfe3ea','#aab3c2']}[z.op],
   crit:z.mons.slice(0,5).map(m=>[m[0],m[1],traitOf(m[1])]),boss:GOBLIN});});
 return out;}
const CROWN={hp:[1,1.6,1.9],atk:[1,1.3,1.36],gap:[1,.85,.72],den:[1,1.3,1.6]};
/* balance knobs, tuned by simulation (Oct 2026) against Battle Cats-style targets and players like the two real kids, after pets were
   made to walk slower (bigger = slower) and to fight at touching distance, with flyers drifting over pets that can't reach them:
   - doing nothing always loses; crown 1 is a sure win in about 3 minutes; crown 2 is a close fight (in the forest a grade-3 player wins
     about half the time); crown 3 is a stretch goal (a grade-5 player about 1 in 3). Worlds with armoured critters (the caves) are harder,
     and only worlds with real flying animals have flyers.
   - treats trickle in (the Kitchen adds more), Pounce charges in about 30 s, the Grey Goblin boss is the big push,
     critters spawn faster while the boss is out and slower once it is down; after 4 minutes they tire (no endless tug-of-war).
   - bricks: 5 per battle, each +40% of the house = exactly two full rebuilds. */
const TUNE={trickle:.73,trickleKl:.31,charge:3.3,den:400,hp:1.15,atk:1.81,gap:3.79,bricks:5,brick:.4,repairAt:.5,house:480,siege:.58,foeCap:12,
 petHp:.66,bossHp:.68,bossAtk:1.62,bossSiege:.81,rage:.87,calm:1.78,tired:240,petSpd:.75,slamWait:.6,slamR:9,downFor:7};

/* ---------- saved progress ---------- */
function prog(p){p.bp2=p.bp2||{c:{},team:[]};p.bp2.c=p.bp2.c||{};if(!Array.isArray(p.bp2.team))p.bp2.team=[];return p.bp2;}
/* the hero's record (p.bp2.rec = {w,l,q}): wins, losses and battles left early. Started from the play log the first time (the log keeps the
   last 40, so quits are only counted from it while it is not full); after that it only counts up. */
function rec(p){const pr=prog(p);if(!pr.rec){const b=p.bp||{},m=b.m||[],w=m.filter(x=>x[2]).length;pr.rec={w,l:m.length-w,q:m.length<LOG_MAX?Math.max(0,(b.s||0)-m.length):0};}return pr.rec;}
const slots=p=>Math.min(5,3+Math.floor((p.level||1)/10));
function available(p){return (p.pets||[]).filter(id=>!(window.Adv&&Adv.away&&Adv.away(p,id))&&!(window.PetCare&&PetCare.rescued&&PetCare.rescued(p,id))).map(id=>PETS.find(x=>x.id===id)).filter(Boolean);}

/* ---------- 🧱 Rebuild questions: about speed, not difficulty ----------
   Quick, easy facts for everyone (kids and grown-ups alike), in the stage's skill: adding and taking away within 20 (within 10 for the
   youngest), times tables up to 5 × 10 and the matching divisions. Heroes who don't multiply yet (grade 2 and below) get adding or
   taking away instead. The Fossil Stage mixes them. */
function easyQ(p,op){const g=p&&p.adult?12:Math.max(1,+(p&&p.grade)||3),young=g<=1,noMul=g<=2;
 if(!op)op=choose(noMul?['add','sub']:['add','sub','mul','div']);if(noMul&&(op==='mul'||op==='div'))op=op==='mul'?'add':'sub';
 const top=young?10:20;
 if(op==='add'){const a=rint(1,young?5:9),b=rint(1,Math.min(young?5:9,top-a));return {text:`${a} + ${b}`,answer:a+b};}
 if(op==='sub'){const a=rint(young?3:6,top),b=rint(1,Math.min(a-1,young?5:9));return {text:`${a} − ${b}`,answer:a-b};}
 const a=rint(2,5),b=rint(1,10);if(op==='mul')return Math.random()<.5?{text:`${a} × ${b}`,answer:a*b}:{text:`${b} × ${a}`,answer:a*b};
 return {text:`${a*b} ÷ ${a}`,answer:b};}
const makeQ=(p,op)=>easyQ(p,op);
const qText=q=>q.prompt?String(q.prompt):`${q.text} = ?`;

/* ================= the battle engine (pure state; the screen only draws it) ================= */
let G=null,SIM=false;
/* ✨ Ascend: endless levels after crown 3. Each level n makes the critters tougher (+3% health per level), harder-hitting (+2%), a little faster,
   the waves quicker (down to 75% of the gap) and the den sturdier (+3%); from Ascend 6 a second Grey Goblin bursts out near the end.
   p.bp2.asc = {stage: best Ascend level beaten}. A loss never takes anything away. */
const ascK=n=>({hp:1+.03*n,atk:1+.02*n,spd:1+.004*n,gap:Math.max(.75,1-.015*n),den:1+.03*n});
function newBattle(p,stage,crown,team,asc){const c=crown-1;
 G={t:0,stage,crown,c,treats:4,kl:0,charge:0,streak:0,bricks:TUNE.bricks,fixing:false,trollAt:TROLL.first,trolls:0,house:100,den:100,denMax:TUNE.den*CROWN.den[c],houseMax:TUNE.house,pets:[],foes:[],spawnAt:4,gap:TUNE.gap*CROWN.gap[c],boss:false,bossDown:false,over:false,win:false,
  team:team.map(pet=>{const R=roleOf(pet),m=powerOf(p,pet);return {pet,R,m,ready:0};}),asked:0,right:0,sent:0,pounces:0,q:null,inp:'',fx:[]};
 G.asc=asc||0;if(G.asc){const k=ascK(G.asc);G.denMax*=k.den;G.gap*=k.gap;}
 G.denHP=G.denMax;G.houseHP=G.houseMax;return G;}
const treatCap=()=>12+6*G.kl,treatRate=()=>TUNE.trickle+TUNE.trickleKl*G.kl,kitchenCost=()=>8+6*G.kl;
function upgradeKitchen(){if(!G||G.over||G.kl>=4||G.treats<kitchenCost())return false;G.treats-=kitchenCost();G.kl++;G.treats=Math.min(G.treats,treatCap());fx('kitchen');return true;}
function send(i){const s=G&&!G.over&&G.team[i];if(!s||G.treats<s.R.cost||s.ready>G.t||G.pets.filter(x=>!x.gone&&!x.mega).length>=MAX_OUT)return false;
 G.treats-=s.R.cost;s.ready=G.t+s.R.cd;G.sent++;const R=s.R,m=s.m;
 G.pets.push({side:'p',pet:s.pet,R,x:HOUSE_X-2,hp:R.hp*m*TUNE.petHp,max:R.hp*m*TUNE.petHp,atk:R.atk*m,rng:R.rng,spd:petSpd(R,m),kb:0,stun:0,flyer:flies(s.pet),id:Math.random()});fx('send');return true;}
const trollOut=()=>!!G&&G.pets.some(u=>u.mega&&!u.gone);
const MEGA={troll:TROLL,eagle:EAGLE},megaOf=()=>MEGA[G&&G.megaId]||TROLL;
function eagleStep(u,foes,dt){const E=EAGLE;
 if(u.ph==='rise'){if(G.t>=u.phT){u.ph='dive';u.phT=G.t+E.fall;u.x0=u.x;fx('swoop');}return;}
 if(u.ph==='dive'){const k=Math.min(1,1-(u.phT-G.t)/E.fall);u.x=u.x0+(u.tx-u.x0)*k;
  if(G.t>=u.phT){u.x=u.tx;u.ph='walk';u.diveAt=G.t+E.dive;G.dives=(G.dives||0)+1;foes.forEach(f=>{if(f.gone||Math.abs(f.x-u.x)>E.reach)return;f.hp-=u.atk*(f.boss?.8:2);knock(f,-(f.boss?2:7));f.stun=G.t+.8;f.pawT=G.t;});G.diveX=u.x;fx('dive');}return;}
 const ahead=foes.filter(f=>!f.gone&&u.x-f.x>=-1&&u.x-f.x<=16);
 if(ahead.length&&G.t>=(u.diveAt||0)){const t=ahead.reduce((a,b)=>b.x>a.x?b:a);u.tx=Math.max(DEN_X+2,t.x+.5);u.ph='rise';u.phT=G.t+E.rise;if(!u.met){u.met=true;u.leave=Math.min(u.leave,G.t+E.life);}return;}
 const near=foes.filter(f=>!f.gone&&u.x-f.x>=-1&&u.x-f.x<=u.rng);
 if(near.length){u.fight=true;near[0].hp-=u.atk*.3*dt;return;}
 if(u.x-DEN_X<=u.rng){u.fight=true;G.denHP-=u.atk*.5*dt;return;}
 u.x-=u.spd*.8*dt;u.mv=true;}
function eagleArt(){const e=window.MQ_EAGLE_SVG;if(!e)return `<span style="font-size:70px;line-height:1">${EAGLE.e}</span>`;return `<span class="eg-walk">${e.perch}</span><span class="eg-flyart">${e.fly}</span>`;}
const megaArt=(id,w)=>id==='eagle'?(w<60&&window.MQ_EAGLE_SVG?`<span class="eg-btn">${window.MQ_EAGLE_SVG.perch}</span>`:w<60?`<span style="font-size:30px">${EAGLE.e}</span>`:eagleArt()):trollArt(w);
function callTroll(){const M=megaOf();if(!G||G.over||G.t<G.trollAt||G.treats<M.cost||trollOut())return false;G.treats-=M.cost;G.trollAt=G.t+M.cd;G.trolls++;
 const m=1+.35*G.c;const lead=G.pets.filter(u=>!u.gone&&!u.mega),to=lead.length?Math.min(HOUSE_X-2,Math.min(...lead.map(u=>u.x))+2.5):HOUSE_X-2;
 G.pets.push({side:'p',mega:true,leapT:G.t,stun:G.t+.95,pet:{id:M.id,e:M.e,name:M.n},R:M,x:to,hp:M.hp*m,max:M.hp*m,atk:M.atk*m,rng:M.rng,spd:M.spd,kb:0,leave:G.t+M.maxLife,stompAt:0,poundAt:0,ph:'walk',diveAt:0,id:Math.random()});fx(M.id==='eagle'?'eagle':'troll');return true;}
/* the giant pounce paw */
const PAW='<svg class="paw" viewBox="0 0 200 200" aria-hidden="true"><g fill="#ffb627" stroke="#fff" stroke-width="7"><ellipse cx="100" cy="128" rx="54" ry="46"/><ellipse cx="42" cy="78" rx="20" ry="27" transform="rotate(-24 42 78)"/>'+
 '<ellipse cx="80" cy="48" rx="21" ry="28" transform="rotate(-8 80 48)"/><ellipse cx="122" cy="48" rx="21" ry="28" transform="rotate(8 122 48)"/><ellipse cx="160" cy="78" rx="20" ry="27" transform="rotate(24 160 78)"/></g>'+
 '<g fill="#ffd98a" opacity=".8"><ellipse cx="88" cy="116" rx="20" ry="12"/><ellipse cx="74" cy="40" rx="7" ry="10"/><ellipse cx="116" cy="40" rx="7" ry="10"/></g></svg>';
/* Grumbleroot's picture: the same drawing as the troll's cave (troll.js), plus a big club held in his hand */
const CLUB='<rect x="-10" y="-175" width="20" height="190" rx="9" fill="#6b4423" stroke="#3d2614" stroke-width="5"/><path d="M-10 -40h20M-10 -20h20" stroke="#3d2614" stroke-width="4"/>'+
 '<path d="M-32 -165 Q-46 -232 -20 -278 Q0 -304 24 -278 Q48 -232 32 -165Z" fill="#8a5a2b" stroke="#3d2614" stroke-width="6"/>'+
 '<g fill="#5a3a1a"><circle cx="-28" cy="-212" r="8"/><circle cx="26" cy="-238" r="7"/><circle cx="0" cy="-266" r="7"/><circle cx="22" cy="-192" r="6"/><circle cx="-14" cy="-246" r="5"/></g>';
function trollArt(w){const t=window.MQ_TROLL_SVG;if(!t)return `<span style="font-size:${Math.round(w*.75)}px;line-height:1">${TROLL.e}</span>`;
 const inner=t.replace(/<svg class="tr-troll"[^>]*>/,'<svg x="0" y="0" width="420" height="540" viewBox="0 0 420 540">');
 return `<svg class="bp2-trollsvg" viewBox="-190 -60 640 600" width="${w}" height="${Math.round(w*600/640)}" aria-hidden="true"><g transform="translate(66,494)"><g class="bp2-club">${CLUB}</g></g>${inner}</svg>`;}
/* the roar comes half a second after he breathes in: it hurts a little and blasts back every critter in front of him (flyers too) */
function pound(u,foes){u.poundAt=0;u.stompAt=G.t+TROLL.pound;foes.forEach(f=>{if(f.gone||u.x-f.x>TROLL.reach||f.x-u.x>2)return;f.hp-=u.atk*(f.boss?.4:.8);knock(f,-(f.boss?2.5:8));f.stun=G.t+.9;});fx('roar');}
/* every push in the battle goes through here, so the screen can show the flight (the troll is hard to move) */
function knock(u,dx){if(u.mega)dx*=.4;u.x=Math.max(DEN_X+2,Math.min(HOUSE_X-2,u.x+dx));u.kbT=G.t;}
/* 🧱 Rebuild: math mends the Pet House, from half health down, with a limited pile of bricks */
const canFix=()=>!!G&&!G.over&&G.bricks>0&&G.houseHP<=G.houseMax*TUNE.repairAt;
function openFix(){if(!G||G.over||G.fixing||!canFix())return false;G.fixing=true;return true;}
function closeFix(){if(G)G.fixing=false;}
function answer(ok){if(!G||G.over||!G.fixing||G.bricks<=0)return 0;G.asked++;if(!ok){G.streak=0;return 0;}
 G.right++;G.streak++;G.bricks--;const add=Math.min(G.houseMax-G.houseHP,G.houseMax*TUNE.brick);G.houseHP+=add;fx('brick');
 if(G.bricks<=0||G.houseHP>=G.houseMax-.01)G.fixing=false;return add;}
/* Pet Pounce (like the Cat Cannon): a giant paw drops out of the sky onto the critters' lead (the one closest to the Pet House).
   Its shadow grows for a moment, then it SLAMS: every critter near that spot (flyers too) is hurt, knocked back and stunned. */
function pounce(){if(!G||G.over||G.charge<100||G.slam)return false;const live=G.foes.filter(f=>!f.gone);if(!live.length)return false;
 const lead=live.reduce((a,b)=>b.x>a.x?b:a);G.charge=0;G.pounces++;G.slam={x:lead.x,at:G.t+TUNE.slamWait,n:G.pounces};G.camAt={x:lead.x,until:G.t+TUNE.slamWait+1};fx('pounce');return true;}
/* while the paw is coming down it keeps aiming at whichever critter is closest to the Pet House */
/* 🧑‍🏫 the Pet Trainer (like Battle Cats' CPU): sessions hired ahead of time (🪙 50 each); switched on in a battle, it plays for the kid until switched off.
   A few times a second it pounces when critters bunch up or come close, calls the mega for the boss or a crowd, saves up for the
   Treat Kitchen while the field is calm, sends flyer-catchers, Brawlers and Walls when the fight needs them, and otherwise saves up for
   the strongest pet that is ready (spamming cheap pets stalls the line). Tested by simulation: about 84% of battles won overall (owner's
   target 75–90%); crown 1 nearly always, crown 3 often needs the kid's Rebuild math. It never does the 🧱 Rebuild math: that stays the kid's job, and it says so when the house needs it. */
function trainer(){const T=G.trainer;if(!T||!T.on||G.over||G.t<(T.next||0))return;const lazy=G.houseHP>=G.houseMax*TRAINER.calm;T.next=G.t+.4+(lazy?Math.random()*TRAINER.lag:0);const slip=()=>lazy&&Math.random()<TRAINER.slip;
 if(!T.told&&canFix()&&!G.fixing){T.told=true;fx('trainerFix');}
 const live=G.foes.filter(f=>!f.gone),mine=G.pets.filter(u=>!u.gone&&!u.mega),boss=live.some(f=>f.boss),front=mine.reduce((a,u)=>Math.min(a,u.x),HOUSE_X);
 const near=live.some(f=>f.x>60),danger=live.some(f=>f.x>Math.max(front-4,40)||f.fly&&f.x>front);
 if(G.charge>=100&&live.length&&(boss||near||live.length>=4||slip()))pounce();
 if(!trollOut()&&G.t>=G.trollAt&&G.treats>=megaOf().cost&&(boss||near||live.length>=5)&&callTroll())return;
 const out=k=>mine.filter(u=>k(u)).length,ok=s=>s.ready<=G.t&&G.treats>=s.R.cost,go=k=>{const s=G.team.find(x=>k(x)&&ok(x));return !!s&&send(G.team.indexOf(s));};
 /* critters at the door: send whatever helps right now */
 if(danger){const nFly=live.filter(f=>f.fly).length;if(nFly&&out(u=>u.R.fly||u.flyer)<Math.min(3,nFly)&&go(s=>s.R.fly||flies(s.pet)))return;
  if(out(u=>u.R.id==='wall')<3&&go(s=>s.R.id==='wall'))return;}
 /* calm: build the Treat Kitchen first (save up for it), like a good Battle Cats player */
 if(slip()){const c=G.team.filter(ok);if(c.length){send(G.team.indexOf(choose(c)));return;}}
 if(G.kl<4&&!near&&!slip()){if(G.treats>=kitchenCost()){upgradeKitchen();return;}if(G.kl<2&&mine.length>=1)return;}
 if(live.some(f=>f.fly)&&out(u=>u.R.fly||u.flyer)<2&&go(s=>s.R.fly||flies(s.pet)))return;
 if(live.some(f=>f.armor)&&!out(u=>u.R.id==='brawler')&&go(s=>s.R.id==='brawler'))return;
 if(live.length&&!out(u=>u.R.id==='wall')&&go(s=>s.R.id==='wall'))return;
 /* then the strongest pet that is ready; save up for it instead of spending treats on cheap ones */
 const best=G.team.filter(s=>s.ready<=G.t&&s.R.id!=='wall').sort((a,b)=>b.R.cost-a.R.cost)[0];
 if(best){if(G.treats>=best.R.cost){send(G.team.indexOf(best));return;}if(G.treats<treatCap()-1)return;}
 go(s=>s.R.id==='wall'&&out(u=>u.R.id==='wall')<3);}
/* sessions are hired ahead of time on the team screen (🪙 50 each, saved in p.bp2.tr); the first switch-on in a battle uses one,
   and switching off and on again in that battle is free */
function hire(){const p=me();if(!p||VIEW.k!=='team'||(p.coins||0)<TRAINER_COST)return;p.coins-=TRAINER_COST;const pr=prog(p);pr.tr=(pr.tr||0)+1;save();try{SFX.coin?SFX.coin():SFX.tap();}catch(e){}screen();}
function trainerToggle(){if(!G||G.over)return;
 if(!G.trainer){const p=me(),pr=p&&prog(p);if(!pr||(pr.tr||0)<1){topNote(`🧑‍🏫 No Trainer sessions left. Hire one on the team screen (🪙 ${TRAINER_COST}).`);return;}
  pr.tr--;save();G.trainer={on:true,next:0,told:false};topNote(`🧑‍🏫 Trainer on! One session used${pr.tr?` (${pr.tr} left)`:''}. Switching off and on in this battle is free.`);draw();return;}
 G.trainer.on=!G.trainer.on;G.trainer.next=0;topNote(G.trainer.on?'🧑‍🏫 The Trainer is back in charge.':'🧑‍🏫 Trainer off: you\'re in charge!');draw();}
function slamAim(){const s=G.slam;if(!s)return;const live=G.foes.filter(f=>!f.gone);if(!live.length)return;s.x=live.reduce((a,b)=>b.x>a.x?b:a).x;G.camAt={x:s.x,until:Math.max(G.camAt&&G.camAt.until||0,s.at+1)};}
function slam(){const s=G.slam;if(!s)return;slamAim();if(G.t<s.at)return;G.slam=null;G.slamX=s.x;
 G.foes.forEach(f=>{if(f.gone||Math.abs(f.x-s.x)>TUNE.slamR)return;knock(f,-(f.boss?6:12));f.hp-=f.boss?90:45;f.stun=G.t+1.4;f.pawT=G.t;if(f.fly||f.downUntil){f.fly=false;f.downUntil=G.t+TUNE.downFor;G.downed=(G.downed||0)+1;}});fx('slam');if(G.downed===1&&!G.downNote){G.downNote=true;fx('downed');}}
function spawn(kind){const S=G.stage,c=G.c;let def,name,e;
 if(kind==='boss'){def=TRAIT.boss;name=S.boss[0];e=S.boss[1];}else{const opts=S.crit.filter(x=>x[2]===kind),pick=opts.length?choose(opts):S.crit[0];def=TRAIT[pick[2]];name=pick[0];e=pick[1];}
 const n=def.group||1,ak=ascK(G.asc||0),bh=(def.boss?TUNE.bossHp:1)*ak.hp,ba=(def.boss?TUNE.bossAtk:1)*ak.atk;for(let i=0;i<n;i++)G.foes.push({side:'c',name,e,trait:def.tag||'',notag:i>0,x:DEN_X+2+i*1.3,hp:def.hp*CROWN.hp[c]*TUNE.hp*bh,max:def.hp*CROWN.hp[c]*TUNE.hp*bh,atk:def.atk*CROWN.atk[c]*TUNE.atk*ba,rng:def.rng,spd:def.spd*(1+.08*c)*ak.spd,fly:!!def.fly,armor:!!def.armor,boss:!!def.boss,kb:0,stun:0,id:Math.random()});}
function nextKind(){const t=G.t,has=k=>G.stage.crit.some(c=>c[2]===k),w={basic:has('basic')?4:2,swarm:t>8&&has('swarm')?2:0,speedy:t>15&&has('speedy')?2:0,flying:t>20&&has('flying')?2:0,armored:t>30&&has('armored')?2:0};const tot=Object.values(w).reduce((a,b)=>a+b,0);let r=Math.random()*tot;for(const k in w){r-=w[k];if(r<=0)return k;}return 'basic';}
function step(dt){if(!G||G.over)return;G.t+=dt;G.minH=Math.min(G.minH===undefined?1:G.minH,G.houseHP/G.houseMax);
 G.treats=Math.min(treatCap(),G.treats+treatRate()*dt);if(!G.slam)G.charge=Math.min(100,G.charge+TUNE.charge*dt);slam();trainer();
 if(G.t>=G.spawnAt&&G.foes.filter(f=>!f.gone).length<TUNE.foeCap){spawn(nextKind());G.gap=Math.max(1.6,G.gap*.97);G.spawnAt=G.t+G.gap*(G.boss&&!G.bossDown?TUNE.rage:G.bossDown?TUNE.calm:1)*(G.t>TUNE.tired?1.7:1)*(.8+Math.random()*.4);} /* after 4 minutes the critters get sleepy, so no battle drags on forever */
 if(!G.tiredSaid&&G.t>TUNE.tired){G.tiredSaid=true;fx('tired');}
 if(G.asc>=6&&G.bossDown&&!G.boss2&&G.denHP<=G.denMax*.2){G.boss2=true;G.bossDown=false;spawn('boss');G.pets.forEach(p=>{if(p.gone)return;knock(p,8);p.stun=G.t+.6;});fx('boss');} /* Ascend 6+: a second Goblin */
 if(!G.boss&&G.denHP<=G.denMax*.5){G.boss=true;spawn('boss');G.pets.forEach(p=>{if(p.gone)return;knock(p,12);p.stun=G.t+.8;});fx('boss');} /* the boss's shockwave */
 const pets=G.pets.filter(x=>!x.gone),foes=G.foes.filter(x=>!x.gone);
 G.pets.forEach(u=>{u.fight=false;});G.foes.forEach(f=>{f.fight=false;});
 pets.forEach(u=>{if(u.mega&&u.poundAt&&G.t>=u.poundAt)pound(u,foes);if(u.mega&&G.t>=u.leave){u.gone=true;u.left=true;fx(u.R.id==='eagle'?'eaglebye':'trollbye');return;}if(u.stun>G.t)return;u.mv=false;const R=u.R;if(u.mega&&R.id==='eagle'){eagleStep(u,foes,dt);return;}const reach=f=>(!f.fly||R.fly||u.flyer)&&u.x-f.x>=-1&&u.x-f.x<=u.rng;const tg=foes.filter(reach);
  if(tg.length){const hit=R.area?tg:[tg.reduce((a,b)=>b.x>a.x?b:a)];u.fight=true;u.tgFly=!!hit[0].fly;hit.forEach(f=>{let d=u.atk*dt;if(f.armor)d*=R.armor?R.armor:.5;if(R.crit&&Math.random()<R.crit*dt*3)d+=u.atk*.6;f.hp-=d;});
   if(Math.random()<.18*dt)knock(hit[0],-(1.5+Math.random()*1.5)*(hit[0].boss?.3:1)); /* now and then a hit shoves the critter back a little */
   if(u.mega&&!u.met){u.met=true;u.leave=Math.min(u.leave,G.t+R.life);}}
  else if(u.x-DEN_X<=u.rng){u.fight=true;G.denHP-=u.atk*dt*(G.bossDown||!G.boss?1:.5)*(G.t>TUNE.tired?1.6:1);}
  else{u.x-=u.spd*.8*dt;u.mv=true;}
  if(u.mega&&R.id==='troll'&&!u.poundAt&&G.t>=u.stompAt&&foes.some(f=>!f.gone&&u.x-f.x>=-2&&u.x-f.x<=6)){u.poundAt=G.t+TROLL.wind;u.windT=G.t;} /* he roars at any critter right in front of him, flyers too */
  if(R.heal)pets.forEach(o=>{if(o!==u&&Math.abs(o.x-u.x)<10&&o.hp<o.max)o.hp=Math.min(o.max,o.hp+R.heal*u.atk/2*dt);});});
 /* flyers drift over pets that can't reach them (like Battle Cats' floating enemies) and go for the Pet House */
 /* a flyer the paw knocked down walks for a few seconds, then takes off again */
 foes.forEach(f=>{if(f.downUntil&&G.t>=f.downUntil){f.downUntil=0;f.fly=true;}if(f.stun>G.t)return;f.mv=false;const tg=pets.filter(u=>u.ph!=='rise'&&u.ph!=='dive'&&(!f.fly||u.R.fly||u.flyer)&&u.x-f.x>=-1&&u.x-f.x<=f.rng);
  if(tg.length){const u=tg.reduce((a,b)=>b.x<a.x?b:a);u.hp-=f.atk*dt;f.fight=true;if(Math.random()<.18*dt)knock(u,1.5+Math.random()*1.5);if(f.boss&&G.t>=(G.bossShake||0)){G.bossShake=G.t+1.4;fx('bossHit');}}
  else if(HOUSE_X-f.x<=f.rng&&(f.fight=true)){G.houseHP-=f.atk*(f.boss?TUNE.bossSiege:TUNE.siege)*dt;G.houseHit=G.t;}
  else{f.x+=f.spd*.8*dt;f.mv=true;}});
 /* knock-back each time a unit loses another third of its health */
 const bump=(u,dir)=>{const k=Math.floor((1-u.hp/u.max)*3);if(u.hp<=0||k<=u.kb)return;u.kb=k;u.stun=G.t+.4;knock(u,dir*(u.boss||u.mega?2:5));};
 pets.forEach(u=>bump(u,1));foes.forEach(f=>bump(f,-1));
 G.foes.forEach(f=>{if(!f.gone&&f.hp<=0){f.gone=true;if(f.boss){if(!G.foes.some(o=>o!==f&&o.boss&&!o.gone&&o.hp>0)){G.bossDown=true;fx('bossdown');}}else fx('poof');}});
 G.pets.forEach(u=>{if(!u.gone&&u.hp<=0){u.gone=true;fx('sleepy');}}); /* a pet is retired: it goes home for a nap */
 /* last stand: the first time a base drops to 25%, every attacker near it is thrown 50–90% of the way back home (once per base) */
 if(!G.lsH&&G.houseHP>0&&G.houseHP<=G.houseMax*.25){G.lsH=true;G.foes.forEach(f=>{if(f.gone)return;knock(f,-(f.x-DEN_X-2)*(.5+Math.random()*.4));f.stun=G.t+1;});fx('standH');}
 if(!G.lsD&&G.denHP>0&&G.denHP<=G.denMax*.25){G.lsD=true;G.pets.forEach(u=>{if(u.gone)return;knock(u,(HOUSE_X-2-u.x)*(.5+Math.random()*.4));u.stun=G.t+1;});fx('standD');}
 if(G.denHP<=0){G.denHP=0;G.over=true;G.win=true;fx('denFall');}else if(G.houseHP<=0){G.houseHP=0;G.over=true;G.win=false;fx('houseFall');}}
function fx(k){if(SIM||!G)return;G.fx.push(k);}

/* ================= the screens ================= */
let VIEW={k:'stages'},RAF=0,LAST=0;
function css(){if(document.getElementById('bp2CSS'))return;const s=document.createElement('style');s.id='bp2CSS';s.textContent=`
.bp2{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:10px}.bp2.wide{max-width:1180px}
.bp2-card{background:#fff;border-radius:18px;padding:12px 14px;box-shadow:0 6px 16px rgba(0,0,0,.15)}
.bp2-stage{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.bp2-stage .e{font-size:40px}.bp2-stage b{font-size:19px;display:block}.bp2-stage small{color:#6b6490}
.bp2-crowns{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}.bp2-crowns button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:8px 10px;background:#f1ecff;color:#2b2340;min-height:44px;cursor:pointer}
.bp2-crowns button.done{background:#d3f9d8}.bp2-crowns button.asc{background:linear-gradient(135deg,#e5dbff,#ffd8f0);border:2px solid #b197fc}.bp2-crowns button.asc small{display:block;font-size:11px;color:#6b6490}.bp2-crowns button:disabled{opacity:.45;cursor:default}
.bp2-pets{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.bp2-pet{font:inherit;border:3px solid #e9e4ff;background:#fff;border-radius:14px;padding:8px 4px;text-align:center;cursor:pointer;color:#2b2340}
.bp2-pet.in{border-color:#40c057;background:#ebfbee}.bp2-pet .pe{font-size:32px;display:block}.bp2-pet small{display:block;color:#6b6490;font-size:12px}
.bp2-slots{display:flex;gap:8px;flex-wrap:wrap}.bp2-slot{font:inherit;width:72px;height:72px;border-radius:14px;border:3px dashed #b197fc;background:#f8f5ff;font-size:34px;cursor:pointer}
.bp2-filt{font:inherit;font-weight:800;border:2px solid #f2b705;background:#fff9db;color:#2b2340;border-radius:20px;padding:6px 12px;min-height:40px;cursor:pointer}.bp2-filt.on{background:#f2b705}
.bp2-pet{position:relative}.bp2-flyb{position:absolute;top:4px;right:4px;font-size:11px;font-weight:800;background:#fff3bf;border-radius:8px;padding:1px 4px}
.bp2-mega{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0}.bp2-mega button{font:inherit;font-weight:800;border:3px solid #e9e4ff;background:#fff;border-radius:14px;padding:6px 12px;cursor:pointer;color:#2b2340;text-align:left}.bp2-mega button.on{border-color:#7048e8;background:#f3f0ff}.bp2-mega button small{display:block;font-weight:600;color:#6b6490;font-size:11px}
.bp2-zone{text-align:center;margin:8px 0}.bp2-zone p{color:#fff;opacity:.85;margin:0}
.bp2-stage.locked{opacity:.7}
.bp2-slot.full{border-style:solid;border-color:#40c057;background:#ebfbee}
.bp2-hud{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px}.bp2-bar{flex:1;height:12px;background:#eee;border-radius:6px;overflow:hidden}.bp2-bar i{display:block;height:100%}
.bp2-scroll{overflow-x:auto;overflow-y:hidden;border-radius:16px;border:3px solid #2b2340;-webkit-overflow-scrolling:touch;cursor:grab;touch-action:pan-x;scrollbar-width:thin;overscroll-behavior-x:contain}
.bp2-scroll.drag{cursor:grabbing}.bp2-scroll.drag *{user-select:none}
.bp2-field{position:relative;height:clamp(260px,46vh,420px);width:2200px;overflow:hidden}
.bp2-mini{position:relative;height:18px;background:#e9e4ff;border-radius:9px;cursor:pointer;overflow:hidden}.bp2-mini .vw{position:absolute;top:0;bottom:0;border:2px solid #7048e8;border-radius:9px;background:rgba(112,72,232,.12)}
.bp2-mini i{position:absolute;top:5px;width:8px;height:8px;border-radius:50%;margin-left:-4px}.bp2-mini i.p{background:#2f9e44}.bp2-mini i.c{background:#e8590c}.bp2-mini i.b{background:#c92a2a;width:12px;height:12px;top:3px;margin-left:-6px}
.bp2-fix{border:3px solid #f08c00;background:#fff9db}.bp2-btn.fix{background:#e8590c}.bp2-btn.fix.hot{animation:bp2pulse .8s ease-in-out infinite}@keyframes bp2pulse{50%{transform:scale(1.08);box-shadow:0 0 0 6px rgba(232,89,12,.3)}}
.bp2-bricks{letter-spacing:1px;font-size:15px}.bp2-key{display:inline-block;font-size:10px;font-weight:800;background:#2b2340;color:#fff;border-radius:5px;padding:0 4px;margin-left:3px;vertical-align:middle}
.bp2-flash{position:absolute;z-index:45;left:50%;top:30%;transform:translate(-50%,-50%);font-size:26px;font-weight:900;color:#fff;text-shadow:0 2px 6px #000;pointer-events:none;animation:bp2fl 1.6s ease-out forwards;white-space:nowrap}@keyframes bp2fl{0%{opacity:0;transform:translate(-50%,-30%) scale(.7)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}80%{opacity:1}100%{opacity:0}}
@media (hover:none){.bp2-key{display:none}}
.bp2-ent{--dir:-1}.bp2-ent.foe{--dir:1}
.bp2-ent.fight .e{animation:bp2atk .9s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes bp2atk{0%,100%{translate:0 0;rotate:0deg;scale:1}35%{translate:calc(var(--dir)*-10px) -4px;rotate:calc(var(--dir)*-14deg);scale:.9 1.08}50%{translate:calc(var(--dir)*20px) 0;rotate:calc(var(--dir)*12deg);scale:1.22 .88}62%{translate:calc(var(--dir)*9px) 0;rotate:0deg;scale:1.05}}
.bp2-ent.fight.r-brawler .e{animation-name:bp2smash;animation-duration:1.1s}
@keyframes bp2smash{0%,100%{translate:0 0;rotate:0deg;scale:1}40%{translate:calc(var(--dir)*-10px) -6px;rotate:calc(var(--dir)*-35deg);scale:1.05}55%{translate:calc(var(--dir)*16px) 2px;rotate:calc(var(--dir)*20deg);scale:1.25 .85}70%{translate:calc(var(--dir)*6px) 0;rotate:0deg;scale:1}}
.bp2-ent.fight.r-jumper .e,.bp2-ent.fight.t-speedy .e{animation-name:bp2hopatk;animation-duration:.8s}
@keyframes bp2hopatk{0%,100%{translate:0 0;scale:1}20%{translate:0 2px;scale:1.1 .85}50%{translate:calc(var(--dir)*8px) -26px;scale:.9 1.1}70%{translate:calc(var(--dir)*12px) 0;scale:1.15 .85}}
.bp2-ent.fight.r-stomper .e{animation-name:bp2stomp;animation-duration:1s}
@keyframes bp2stomp{0%,100%{translate:0 0;scale:1}40%{translate:0 -20px;scale:.92 1.08}55%{translate:0 2px;scale:1.25 .75}70%{translate:0 0;scale:1}}
.bp2-ent.fight.r-archer .e{animation-name:bp2draw;animation-duration:.9s}
@keyframes bp2draw{0%,100%{translate:0 0;rotate:0deg}45%{translate:calc(var(--dir)*-6px) 0;rotate:calc(var(--dir)*-12deg)}55%{translate:calc(var(--dir)*4px) 0;rotate:calc(var(--dir)*4deg)}}
.bp2-ent.fight.r-medic .e{animation-name:bp2heal;animation-duration:1.2s}@keyframes bp2heal{0%,100%{translate:0 0;scale:1}50%{translate:0 -6px;scale:1.08}}
.bp2-ent.fight.r-wall .e,.bp2-ent.fight.t-armored .e{animation-name:bp2bash;animation-duration:1.1s}
@keyframes bp2bash{0%,100%{translate:0 0;scale:1}40%{translate:calc(var(--dir)*-7px) 0;scale:1.08 .92}52%{translate:calc(var(--dir)*15px) 0;scale:1.18 .9}}
.bp2-ent.boss.fight .e{animation-name:bp2smash;animation-duration:1.4s}
.bp2-ent.walk .e{animation:bp2waddle .5s ease-in-out infinite;animation-delay:var(--d,0s)}@keyframes bp2waddle{0%,100%{translate:0 0;rotate:-6deg}50%{translate:0 -7px;rotate:6deg}}
.bp2-ent.fly .e{animation:bp2float 1.2s ease-in-out infinite}@keyframes bp2float{50%{translate:0 -10px}}
.bp2-ent.stun::after{content:"💫";position:absolute;top:-6px;font-size:18px;animation:bp2spin 1s linear infinite}@keyframes bp2spin{from{rotate:0deg}to{rotate:360deg}}
.bp2-ent.ko{transition:opacity .45s}.bp2-ent.ko .e{animation:bp2ko .45s ease-in forwards}@keyframes bp2ko{to{rotate:calc(var(--dir)*-540deg);scale:.3;translate:calc(var(--dir)*-30px) -30px;opacity:0}}.bp2-ent.ko .hb{opacity:0}
.bp2-arrow{position:absolute;width:26px;height:4px;border-radius:2px;background:linear-gradient(90deg,#6b4423 70%,#adb5bd 70%);z-index:3;pointer-events:none;animation:bp2arrow .35s linear forwards}
@keyframes bp2arrow{from{transform:translateX(0)}to{transform:translateX(var(--px))}}
.bp2-pt.heal{font-size:16px;color:#2f9e44;animation:bp2pop .9s ease-out forwards}
.bp2-topnote{position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:70;background:rgba(30,20,60,.94);color:#fff;border:2px solid #74c0fc;border-radius:14px;padding:10px 18px;font-weight:700;text-align:center;max-width:88vw;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:bp2tn 3.4s ease-out forwards}
@keyframes bp2tn{0%{opacity:0;translate:0 -12px}8%{opacity:1;translate:0 0}85%{opacity:1}100%{opacity:0}}
.bp2-sndc{max-width:420px;width:100%}.bp2-sl{margin:8px 0 12px;text-align:left}.bp2-sl div{display:flex;justify-content:space-between}.bp2-sl input{width:100%;height:30px}
.bp2-songs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 14px}.bp2-songs button{font:inherit;border:3px solid #e9e4ff;background:#fff;border-radius:14px;padding:8px;cursor:pointer;color:#2b2340;text-align:left}
.bp2-songs button.on{border-color:#7048e8;background:#f3f0ff}.bp2-songs small{display:block;color:#6b6490;font-size:12px}
@keyframes bp2lungeL{0%,100%{translate:0 0}30%{translate:-8px -5px}45%{translate:-11px 0}}@keyframes bp2lungeR{0%,100%{translate:0 0}30%{translate:8px -5px}45%{translate:11px 0}}
.bp2-ent.hurt .e{filter:brightness(2.4) saturate(.2)}
.bp2-ent.kb{transition:left .38s cubic-bezier(.2,.7,.3,1),bottom .45s ease}.bp2-ent.pet{transition:opacity .4s,bottom .45s ease}.bp2-ent.kb .e{animation:bp2arc .42s ease-out}
@keyframes bp2arc{0%{translate:0 0;rotate:0deg}45%{translate:0 -22px;rotate:-14deg}100%{translate:0 0;rotate:0deg}}
.bp2-ent.mega .e{font-size:0;line-height:0}.bp2-ent.mega.fight .e{animation:none}.bp2-trollsvg{display:block;overflow:visible}
.bp2-club{transform:rotate(-24deg)}.bp2-ent.pound .bp2-club{animation:bp2pound .9s ease-in-out}.bp2-ent.mega.pound .e{animation:bp2squash .9s ease-in-out}
@keyframes bp2pound{0%{transform:rotate(-24deg)}45%{transform:rotate(34deg)}56%{transform:rotate(-102deg)}82%{transform:rotate(-102deg)}100%{transform:rotate(-24deg)}}
@keyframes bp2squash{0%,100%{translate:0 0;scale:1 1}45%{translate:0 -8px;scale:.98 1.03}58%{translate:0 3px;scale:1.05 .93}70%{translate:0 0;scale:1 1}}
.bp2-pt.smoke{border-radius:50%;animation:bp2smoke var(--dur,2s) ease-out forwards;z-index:1}
@keyframes bp2smoke{0%{opacity:0;scale:.45;translate:0 0}15%{opacity:var(--op,.75)}100%{opacity:0;scale:2.3;translate:var(--dx,0px) calc(-1 * var(--rise,120px))}}
.bp2-pt.ember{width:6px;height:6px;border-radius:50%;background:#ff922b;box-shadow:0 0 6px #ff6b00;animation:bp2smoke 1.2s ease-out forwards;z-index:2}
.bp2-tc.mega .bp2-trollsvg{margin:0 auto}
.bp2-trollsvg .tr-mopen{display:none}.bp2-trollsvg .tr-mclosed{display:inline}.bp2-trollsvg .tr-brow-angry{display:inline}.bp2-trollsvg .tr-brow-kind{display:none}.bp2-trollsvg .tr-drool{display:none}
.bp2-ent.roar .bp2-trollsvg .tr-mopen{display:inline}.bp2-ent.roar .bp2-trollsvg .tr-mclosed{display:none}
.bp2-ent.mega.roar .e{animation:bp2roar 1.15s ease-in-out}
.bp2-ent.r-eagle .e{transition:translate .55s ease-out,rotate .3s}.bp2-ent.r-eagle .eg-flyart{display:none}
.bp2-ent.r-eagle .eg-walk svg,.bp2-ent.r-eagle .eg-flyart svg,.bp2-tc .eg-btn svg{position:static;display:block;height:auto;transform:none;animation:none}
.bp2-ent.r-eagle .eg-walk svg{width:84px}.bp2-ent.r-eagle .eg-flyart svg{width:170px}.bp2-tc .eg-btn{display:block;width:34px;margin:0 auto}.bp2-tc .eg-btn svg{width:34px}
.bp2-ent.r-eagle.air .eg-walk,.bp2-ent.r-eagle.diving .eg-walk{display:none}.bp2-ent.r-eagle.air .eg-flyart,.bp2-ent.r-eagle.diving .eg-flyart{display:block}
.bp2-ent.r-eagle.air .e,.bp2-ent.r-eagle.diving .e{animation:none}.bp2-ent.r-eagle.air .e{translate:0 -150px;rotate:10deg}
.bp2-ent.r-eagle.diving .e{translate:0 0;rotate:-30deg;transition:translate .38s ease-in,rotate .1s}
.bp2-ent.leap{transition:left .9s cubic-bezier(.3,.1,.5,1)}.bp2-ent.leap .e{animation:bp2leap .9s ease-in-out}
@keyframes bp2leap{0%{translate:0 0;rotate:0deg}15%{translate:0 6px}50%{translate:0 -170px;rotate:-12deg}90%{translate:0 0;rotate:4deg}100%{translate:0 0;rotate:0deg}}
@keyframes bp2roar{0%{translate:0 0;rotate:0deg;scale:1}35%{translate:5px -5px;rotate:4deg;scale:1.02}45%{translate:-8px 0;rotate:-8deg;scale:1.1}55%{translate:-6px 1px;rotate:-7deg;scale:1.1}65%{translate:-9px -1px;rotate:-8deg;scale:1.1}85%{translate:-6px 0;rotate:-6deg;scale:1.08}100%{translate:0 0;rotate:0deg;scale:1}}
.bp2-pt.sound{width:50px;height:120px;border-radius:50%;border:7px solid transparent;border-left-color:rgba(255,255,255,.95);box-shadow:-4px 0 10px -4px rgba(255,255,255,.8);animation:bp2sound .85s ease-out forwards;z-index:5}
@keyframes bp2sound{from{opacity:1;translate:0 0;scale:.5}to{opacity:0;translate:-300px 0;scale:1.9}}
.bp2-pt.word{font-size:28px;font-weight:900;color:#fff;-webkit-text-stroke:2px #5c3d1e;letter-spacing:1px;white-space:nowrap;animation:bp2word 1.1s ease-out forwards;z-index:7}
@keyframes bp2word{0%{opacity:0;scale:.4;rotate:-12deg}20%{opacity:1;scale:1.25;rotate:-6deg}70%{opacity:1;scale:1.1}100%{opacity:0;scale:1;translate:0 -24px}}
.bp2-gob{display:block;line-height:0}.bp2-gob svg{width:100%;height:auto;display:block;overflow:visible}.bp2-ent.boss .e:has(.bp2-gob){font-size:0}
.bp2-sky{position:absolute;bottom:14px;width:230px;height:230px;transform:translateX(-50%);z-index:8;pointer-events:none;animation:bp2drop 1.35s cubic-bezier(.55,0,.85,.6) forwards;filter:drop-shadow(0 0 16px #ffd43b) drop-shadow(0 8px 8px rgba(0,0,0,.4))}.bp2-sky svg{width:100%;height:100%}
@keyframes bp2drop{0%{transform:translate(-50%,-520px) scale(.7) rotate(-10deg);opacity:.9}44%{transform:translate(-50%,0) scale(1.15) rotate(0deg);opacity:1}50%{transform:translate(-50%,6px) scale(1.3,.8)}62%{transform:translate(-50%,0) scale(1.12)}82%{transform:translate(-50%,0) scale(1.12);opacity:1}100%{transform:translate(-50%,-90px) scale(1);opacity:0}}
.bp2-pshadow{position:absolute;bottom:10px;width:200px;height:34px;border-radius:50%;background:rgba(0,0,0,.45);transform:translateX(-50%);z-index:1;pointer-events:none;animation:bp2shadow 1.35s ease-in forwards}
@keyframes bp2shadow{0%{transform:translateX(-50%) scale(.15);opacity:.2}44%{transform:translateX(-50%) scale(1);opacity:.7}80%{opacity:.6}100%{transform:translateX(-50%) scale(.6);opacity:0}}
.bp2-blast{position:absolute;inset:0;background:radial-gradient(circle at var(--bx,90%) 70%,rgba(255,255,255,.95),rgba(255,236,150,.6) 30%,rgba(255,255,255,0) 70%);pointer-events:none;z-index:6;animation:bp2blast .5s ease-out forwards}
@keyframes bp2blast{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
.bp2-ent.cheer .e{animation:bp2cheer .3s ease-in-out 4 alternate !important}@keyframes bp2cheer{from{translate:0 0}to{translate:0 -20px}}
.bp2-pt.streak{height:5px;width:90px;border-radius:3px;background:linear-gradient(90deg,rgba(255,220,120,.9),rgba(255,220,120,0));animation:bp2streak .45s ease-out forwards}
@keyframes bp2streak{from{opacity:1;scale:1 1}to{opacity:0;scale:1.6 .4;translate:40px 0}}
.bp2-pounce-t{font-size:44px !important;color:#ffd43b !important;-webkit-text-stroke:2px #7048e8;letter-spacing:2px}.bp2-ent.mega .hb{width:70px;height:6px}.bp2-ent.mega .hb i{background:#7048e8}
.bp2-ent.boss .hb{width:64px;height:6px}
.bp2-pt{position:absolute;bottom:24px;pointer-events:none;transform:translateX(-50%);z-index:3}
.bp2-pt.dust{width:20px;height:20px;border-radius:50%;background:rgba(150,120,80,.55);animation:bp2dust .65s ease-out forwards}
.bp2-pt.poof{width:40px;height:40px;border-radius:50%;background:rgba(200,200,210,.85);box-shadow:14px -6px 0 -4px rgba(200,200,210,.8),-14px -4px 0 -6px rgba(200,200,210,.8);animation:bp2poof .7s ease-out forwards}
.bp2-pt.star{font-size:24px;bottom:40px;animation:bp2pop .4s ease-out forwards}
.bp2-pt.hit{width:34px;height:34px;margin-left:-2px;bottom:40px;background:radial-gradient(circle,#fff 0 18%,#ffe066 34%,#ff922b 52%,transparent 62%);clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:bp2pop .32s ease-out forwards;z-index:4}
/* shooters on the ground jump up to flying critters to shoot, and jumpers leap up to hit them (--jh: the flyers' height, set by draw;
   divided by --k, the full-screen size-up of every fighter, or the jump would be scaled up with it and overshoot) */
.bp2-ent.jumpshot .e{animation:bp2jshot .62s ease-out!important}
@keyframes bp2jshot{0%{translate:0 0;scale:1}15%{translate:0 4px;scale:1.12 .85}40%,62%{translate:0 calc(var(--jh,-120px)/var(--k,1));scale:1}100%{translate:0 0;scale:1}}
.bp2-ent.fight.upfight .e{animation-name:bp2jumpatk!important;animation-duration:.9s!important}
@keyframes bp2jumpatk{0%,100%{translate:0 0;scale:1}18%{translate:0 4px;scale:1.12 .85}48%{translate:calc(var(--dir)*6px) calc(var(--jh,-120px)/var(--k,1));scale:.95 1.08}60%{translate:calc(var(--dir)*14px) calc(var(--jh,-120px)/var(--k,1));scale:1.2 .88}78%{translate:0 calc(var(--jh,-120px)*.4/var(--k,1));scale:1}}
.bp2-pt.ring{width:40px;height:14px;border-radius:50%;border:4px solid rgba(120,90,50,.7);bottom:18px;animation:bp2ring .55s ease-out forwards}
@keyframes bp2dust{0%{opacity:.85;scale:.4;translate:0 0}100%{opacity:0;scale:1.9;translate:var(--dx,0px) -16px}}
@keyframes bp2poof{0%{opacity:1;scale:.3}100%{opacity:0;scale:1.6;translate:0 -20px}}
@keyframes bp2pop{0%{opacity:0;scale:.3}30%{opacity:1;scale:1.2}100%{opacity:0;scale:.9;translate:0 -14px}}
@keyframes bp2ring{0%{opacity:1;scale:.5}100%{opacity:0;scale:7}}
.bp2-scroll.shake{animation:bp2shake .32s linear}@keyframes bp2shake{20%{translate:-5px 2px}40%{translate:5px -2px}60%{translate:-4px 1px}80%{translate:3px 0}}
.bp2-tc.mega{border-color:#7048e8;background:linear-gradient(#f3f0ff,#e5dbff)}.bp2-tc.mega .pe{font-size:34px}.bp2-team.six{grid-template-columns:repeat(6,1fr)}
.bp2-ent.downed::before{content:'💫';position:absolute;top:-22px;font-size:22px;animation:bp2dizzy 1s linear infinite}@keyframes bp2dizzy{50%{transform:rotate(180deg) scale(1.15)}}
.bp2-who{font-size:22px;margin:0 0 4px}.bp2-rec{background:#f3f0ff;border-radius:12px;padding:6px 10px;display:inline-block}.bp2-lv{display:flex;align-items:center;gap:10px}.bp2-lvrow{display:flex;gap:6px;overflow-x:auto;padding:2px}.bp2-lvrow button{font:inherit;font-weight:800;border:2px solid #d0bfff;background:#f8f5ff;color:#2b2340;border-radius:12px;padding:4px 10px;min-height:44px;cursor:pointer;white-space:nowrap;display:flex;flex-direction:column;align-items:center;flex:none}.bp2-lvrow button.on{border-color:#7048e8;background:#e5dbff}.bp2-lvrow small{font-size:11px}.bp2-stars{font-size:38px;letter-spacing:4px;line-height:1.1}
.bp2-btn.train{background:#5c7cfa;line-height:1.1}.bp2-btn.train.on{background:#2f9e44}.bp2-btn.train.nohire{background:#868e96;opacity:.6}
.bp2-ent{position:absolute;bottom:28px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none;transition:opacity .4s;z-index:2}.bp2-ent.mega{z-index:1}
.bp2-ent .e{font-size:40px;line-height:1;display:inline-block}.bp2-ent.foe .e{transform:scaleX(-1)}.bp2-ent.boss .e{font-size:76px}.bp2-ent.fly{bottom:46%}
.bp2-ent .hb{width:36px;height:4px;border-radius:2px;background:rgba(0,0,0,.2);margin-bottom:2px;overflow:hidden}.bp2-ent .hb i{display:block;height:100%;background:#40c057}.bp2-ent.foe .hb i{background:#e8590c}
.bp2-ent.walk .e{animation:bp2hop .45s ease-in-out infinite}@keyframes bp2hop{50%{translate:0 -6px}}
.bp2-ent .tag{font-size:10px;font-weight:700;background:rgba(255,255,255,.8);border-radius:6px;padding:0 4px;margin-top:1px}
.bp2-base{position:absolute;bottom:16px;font-size:72px;line-height:1;transform:translateX(-50%);z-index:1}.bp2-base:has(svg){line-height:0}
.bp2-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.bp2-meter{flex:1 1 110px;min-width:80px;height:22px;background:#fff3bf;border-radius:11px;overflow:hidden;position:relative;border:2px solid #f2b705}.bp2-meter i{display:block;height:100%;background:#f2b705}.bp2-meter span{position:absolute;inset:0;text-align:center;font-weight:800;font-size:13px;line-height:18px;color:#1a1a1a}
.bp2-btn{font:inherit;font-weight:800;border:0;border-radius:12px;padding:8px 12px;min-height:44px;cursor:pointer;background:#7048e8;color:#fff}.bp2-btn:disabled{opacity:.45;cursor:default}.bp2-btn.gold{background:#f08c00}
.bp2-team{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
body.bp2-lock{overflow:hidden}
.bp2-full{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;gap:6px;background:#140f26;color:#fff;overflow:hidden;
 padding:max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
.bp2-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.bp2-exit{font:inherit;font-weight:800;border:0;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;padding:8px 14px;min-height:44px;cursor:pointer}
.bp2-exit:hover{background:rgba(255,255,255,.26)}.bp2-title{font-weight:800;font-size:15px;white-space:nowrap}.bp2-full .bp2-hud{flex:1;min-width:220px}
.bp2-full .bp2-scroll{flex:1 1 auto;min-height:170px}.bp2-full .bp2-field{height:100%}
.bp2-full .bp2-row,.bp2-full .bp2-team,.bp2-full .bp2-fix,.bp2-full .bp2-mini{width:100%;max-width:1100px;margin:0 auto;flex:none}
.bp2-full .bp2-tc{min-height:72px}.bp2-full .bp2-fix{color:#2b2340;padding:8px 12px}.bp2-full .bp2-pad button{min-height:40px}.bp2-full .bp2-q{font-size:24px}
.bp2-full .bp2-ent,.bp2-full .bp2-base{scale:var(--k,1);transform-origin:50% 100%}
@media (min-width:900px){.bp2-full .bp2-pad{grid-template-columns:repeat(12,1fr)}.bp2-full .bp2-pad button.go{grid-column:1/-1}.bp2-full .bp2-msg{min-height:18px}}
.bp2-note-pop{position:fixed;left:50%;top:45%;transform:translate(-50%,-50%);z-index:70;background:rgba(30,20,60,.94);color:#fff;border:3px solid #f2b705;border-radius:18px;padding:14px 22px;text-align:center;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.45);animation:bp2note 1.9s ease-out forwards;max-width:86vw}
.bp2-note-pop b{display:block;font-size:24px}.bp2-note-pop small{display:block;font-size:14px;opacity:.85;margin-top:4px}
@keyframes bp2note{0%{opacity:0;scale:.7}12%{opacity:1;scale:1.05}20%{scale:1}80%{opacity:1}100%{opacity:0}}
.bp2-padrow{display:flex;gap:6px;margin-top:6px}.bp2-padrow button{font:inherit;font-size:20px;font-weight:800;border:0;border-radius:12px;min-height:46px;cursor:pointer}.bp2-padrow .skip{flex:1;background:#e9ecef;color:#2b2340}.bp2-padrow .go{flex:3;background:#40c057;color:#fff}
.bp2-alert{position:absolute;z-index:8;font:inherit;font-weight:700;border:3px solid #fff;background:#e03131;color:#fff;border-radius:14px;padding:6px 12px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.35);animation:bp2alert 1s ease-in-out infinite;max-width:46%}.bp2-alert[hidden]{display:none}
@keyframes bp2alert{50%{translate:-6px 0}}
.bp2-note{font-size:11px;opacity:.7;margin:0;text-align:center}.bp2-tc{font:inherit;position:relative;border:3px solid #d0bfff;border-radius:14px;background:#fff;min-height:84px;padding:4px 2px;cursor:pointer;color:#2b2340;overflow:hidden}
.bp2-tc .pe{font-size:30px;display:block}.bp2-tc small{display:block;font-size:11px;font-weight:700}.bp2-tc .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(43,35,64,.35)}.bp2-tc.poor{opacity:.55}
.bp2-q{display:flex;align-items:center;justify-content:center;gap:10px;font-size:28px;font-weight:800;flex-wrap:wrap}.bp2-q .box{min-width:90px;border:3px dashed #b197fc;border-radius:12px;text-align:center;background:#f8f5ff;padding:0 8px}
.bp2-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}.bp2-pad button{font:inherit;font-size:22px;font-weight:800;border:0;border-radius:12px;background:#f1ecff;color:#2b2340;min-height:48px;cursor:pointer}.bp2-pad button.go{background:#40c057;color:#fff}
.bp2-msg{text-align:center;font-weight:700;min-height:22px}
.bp2-over{position:fixed;inset:0;background:rgba(20,15,40,.6);display:grid;place-items:center;z-index:50;padding:16px}.bp2-over .bp2-card{max-width:380px;text-align:center}`;document.head.appendChild(s);}
const head=(t,back)=>((typeof topbar==='function')?topbar():'')+`<div class="page"><div class="zhead"><button class="btn ghost small backbtn" onclick="${back}">← ${back.includes('world')?'Village':'Back'}</button><h2 class="title">${t}</h2></div>`;
function screen(){stopLoop();const p=me();if(!p||!on(p)){unlock();go('world');return;}css();if(VIEW.k!=='fight')unlock();
 if(VIEW.k==='team')return teamView(p);if(VIEW.k==='fight'&&G)return fightView(p);VIEW={k:'stages'};stageView(p);}
/* a world's stage is open once its 👑 Legend round is beaten; the Fossil Stage opens in the Museum once all 4 dinosaur skeletons are built */
const DINOS=['trex','triceratops','stego','brachio'],dinosBuilt=p=>DINOS.filter(id=>((p&&p.cave&&p.cave.ex)||{})[id]).length;
function stageOpen(p,s){if(!s.op)return dinosBuilt(p)>=DINOS.length;try{return medal(p,s.id)>=5;}catch(e){return false;}}
function stageView(p){const pr=prog(p),S=stages();
 app.innerHTML=head('🐾 Battle Pets',"go('world')")+`<div class="bp2">
  <div class="bp2-card"><b>How to play:</b> send your pets to knock down the critter den before the critters reach your Pet House. <b>Treats</b> come in by themselves: spend them to send pets, or on the <b>🍳 Treat Kitchen</b> to earn them faster. <b>🐾 Pet Pounce</b> charges up over time. When the critters smash your Pet House below half, tap <b>🧱 Rebuild</b> and answer quick math: every right answer lays a big brick. You have enough bricks to rebuild the whole house twice!<br><small class="muted">Swipe or drag the battlefield to look around. On a computer: 1–5 send pets, T mega, K kitchen, Space pounce, R rebuild, S sound, ← → scroll.<br>Mega: 🧌 <b>${TROLL.n}</b> roars critters back, or 🦅 <b>${EAGLE.n}</b> dives onto them. They take a long time to come back.</small><br><small class="muted">Each world's stage opens when you beat that world's 👑 Legend round.</small></div>
  ${S.map(s=>{const done=pr.c[s.id]||0,open=stageOpen(p,s);if(!open)return `<div class="bp2-card bp2-stage locked"><span class="e">🔒</span><span><b>${esc(s.name)}</b><small>${s.op?`Beat the 👑 Legend round in ${esc(s.name)} to open it.`:`Build all 4 dinosaur skeletons in the Science Cave's 🏛️ Museum to open it (you have ${dinosBuilt(p)}).`}</small></span></div>`;
   return `<div class="bp2-card bp2-stage"><span class="e">${s.art}</span><span><b>${esc(s.name)}</b><small>${s.op?'Quick '+OPN[s.op].toLowerCase()+' for repairs':'Mixed quick math for repairs'} · boss: the ${esc(s.boss[0])}</small></span>
   <span class="bp2-crowns">${[1,2,3].map(c=>`<button class="${done>=c?'done':''}" ${c>done+1?'disabled':''} onclick="BattlePets._pick('${s.id}',${c})">${'👑'.repeat(c)}${done>=c?' ✓':''}</button>`).join('')}${done>=3?`<button class="asc" onclick="BattlePets._pick('${s.id}',3,${((pr.asc||{})[s.id]||0)+1})">✨ Ascend ${((pr.asc||{})[s.id]||0)+1}${(pr.asc||{})[s.id]?`<small>best ${(pr.asc||{})[s.id]}</small>`:''}</button>`:''}</span></div>`;}).join('')}</div></div>`;}
function pickStage(id,crown,asc,tk){const p=me();if(!p)return;const pr=prog(p);if(tk&&!ticketLevels(p,id).includes(crown))return;if(!tk&&crown>(pr.c[id]||0)+1)return;asc=tk?0:Math.max(0,Math.min(+asc||0,crown===3&&(pr.c[id]||0)>=3?((pr.asc||{})[id]||0)+1:0));VIEW={k:'team',id,crown,asc,tk:!!tk};
 const av=available(p).map(x=>x.id);let team=pr.team.filter(x=>av.includes(x)).slice(0,slots(p));
 if(!team.length)team=available(p).sort((a,b)=>powerOf(p,b)-powerOf(p,a)).slice(0,slots(p)).map(x=>x.id);VIEW.team=team;screen();}
function teamView(p){const S=stages().find(s=>s.id===VIEW.id);if(!S){VIEW={k:'stages'};return screen();}const av=available(p),n=slots(p),team=VIEW.team;
 app.innerHTML=head(`${S.art} ${esc(S.name)} ${VIEW.asc?'✨ Ascend '+VIEW.asc:'👑'.repeat(VIEW.crown)}`,"BattlePets._back()")+`<div class="bp2">${levelPicker(p,S)}<div class="bp2-card"><b>Build your team</b> (up to ${n}). Tap a pet to add it, tap a team spot to take it out.
  <div class="bp2-mega"><b>Mega:</b> ${[['troll','🧌 Grumbleroot','roars critters back'],['eagle','🦅 Skyla','dives onto critters']].map(([id,t,sub])=>`<button class="${(prog(p).mega||'troll')===id?'on':''}" onclick="BattlePets._mega('${id}')">${t}<small>${sub}</small></button>`).join('')}<small class="muted">One mega per battle.</small></div>
  <div class="bp2-mega"><b>Pet Trainer:</b><button onclick="BattlePets._hire()" ${(p.coins||0)<TRAINER_COST?'disabled':''}>🧑‍🏫 Hire a session · 🪙 ${TRAINER_COST}<small>plays one battle for you</small></button><small class="muted">You have <b>${prog(p).tr||0}</b> session${(prog(p).tr||0)===1?'':'s'}${(p.coins||0)<TRAINER_COST?` (you need 🪙 ${TRAINER_COST} to hire one; you have ${p.coins||0})`:` · 🪙 ${p.coins||0}`}. In a battle, tap 🧑‍🏫 Trainer to switch it on or off. A session is used the first time you switch it on in a battle; switching it off and on again in that battle is free. 🧱 Rebuild math is still your job!</small></div>
  <div class="muted" style="font-size:13px;margin:4px 0 8px">Critters here: ${S.crit.map(c=>`${c[1]} ${esc(c[0])} <i>(${TRAIT[c[2]].tag||'plain'})</i>`).join(' · ')}</div>
  <div class="bp2-slots">${Array.from({length:n},(_,i)=>{const id=team[i],pet=id&&PETS.find(x=>x.id===id);return `<button class="bp2-slot ${pet?'full':''}" onclick="BattlePets._out(${i})" aria-label="${pet?'Take '+esc(pet.name)+' out':'Empty spot'}">${pet?pet.e:''}</button>`;}).join('')}
  <button class="bp2-btn" style="margin-left:auto" onclick="BattlePets._auto()" ${av.length?'':'disabled'}>🎲 Pick for me</button><button class="bp2-btn gold" ${team.length?'':'disabled'} onclick="BattlePets._start()">Start! ▶</button></div></div>
  <div class="bp2-card"><div class="bp2-row" style="margin-bottom:8px"><button class="bp2-filt ${VIEW.fly?'on':''}" onclick="BattlePets._flyFilter()" aria-pressed="${VIEW.fly?'true':'false'}">🐝 Stops flyers${VIEW.fly?' ✓':''}</button><small class="muted">${VIEW.fly?'Showing only pets that can reach flying critters.':'Tap to see which pets can reach flying critters.'}</small></div>
  <div class="bp2-pets">${av.filter(pet=>!VIEW.fly||reachesFly(pet)).map(pet=>{const R=roleOf(pet),inT=team.includes(pet.id);return `<button class="bp2-pet ${inT?'in':''}" onclick="BattlePets._in('${pet.id}')">${reachesFly(pet)?'<span class="bp2-flyb" title="Can reach flying critters">🐝✓</span>':''}<span class="pe">${pet.e}</span><b>${esc(pet.name)}</b><small>${R.e} ${R.n} · 🍖 ${R.cost}</small><small>Power ${powerOf(p,pet).toFixed(1)}×</small><small>${esc(R.tip)}</small></button>`;}).join('')||(VIEW.fly?'<p>None of your pets at home can reach flyers yet. Flying pets can, and so can pets with the ⭐ Lucky or 📈 XP skill (they fight as Jumpers 🦘 and Archers 🏹).</p>':'<p>You have no pets at home right now. Pets at camp or the Pet Rescue can\'t battle.</p>')}</div></div></div></div>`;}
/* 🎲 Pick for me: a random team that should win about 4 times in 5 (owner's ask, Oct 2026), different on each press.
   WINM predicts a team's chance from its roles, their power and counts, its flyer reach and how that meets this stage's critters
   (teamFeat), per stage and crown (Ascend levels in between are interpolated). Fitted to simulated battles played by the Pet Trainer's
   logic, with no Rebuild math (kids who do the math win more): about 6,700 random teams from varied pet collections, then 4 rounds of
   the picker's own choices, so it can't game the formula (a first version with power-only features did: "80%" teams won 8–60%).
   Last round: predicted 61%, actual 62%. Separate check with common/rare pets: picks aimed at 80% won 60–88% (castle lowest).
   Crown 1 is won by almost any team. Scripts: scratchpad bpal_w.js / bpal_fit.js (not in the repo). Every pick still covers what the stage needs
   (a Wall, a flyer-catcher when flyers come, a Brawler for armour, a Stomper for swarms). If no team lands near 80% (pets too weak or
   too strong for this level) it takes the closest. */
const WINM={"b":{"n":-1.359,"reach":0.315,"reachN":-0.652,"flyX":0.16,"flyNone":-0.632,"armX":0.21,"swarmX":0.328,"has_wall":0.699,"pow_wall":1.504,"cnt_wall":-0.59,"has_brawler":-0.919,"pow_brawler":1.177,"cnt_brawler":-1.154,"has_medic":0.042,"pow_medic":1.046,"cnt_medic":0.349,"has_jumper":-0.002,"pow_jumper":0.447,"cnt_jumper":0.208,"has_archer":0.785,"pow_archer":1.006,"cnt_archer":0.566,"has_stomper":-0.011,"pow_stomper":0.328,"cnt_stomper":-0.738},"a":{"fossil":{"c":[7.78,2.296,0.357],"asc":{"1":-0.271,"3":-1.024,"6":-3.202,"10":-4.154}},"forest":{"c":[7.616,3.285,1.692],"asc":{"1":1.169,"3":0.47,"6":-0.589,"10":-1.715}},"caves":{"c":[6.838,2.22,0.248],"asc":{"1":-0.216,"3":-1.142,"6":-3.14,"10":-4.378}},"volcano":{"c":[7.507,2.814,-0.077],"asc":{"1":-0.425,"3":-1.332,"6":-2.833,"10":-4.114}},"castle":{"c":[7.331,2.153,-0.308],"asc":{"1":-0.687,"3":-1.471,"6":-3.396,"10":-4.444}}}}; /* per-stage, per-level starting points (a) and team weights (b); refit with the simulator if TUNE changes */
const ROLE_IDS=['wall','brawler','medic','jumper','archer','stomper'];
function teamFeat(p,team,S){const f={n:team.length,reach:0,reachN:0},has=k=>!!S&&S.crit.some(c=>c[2]===k);ROLE_IDS.forEach(r=>{f['has_'+r]=0;f['pow_'+r]=0;f['cnt_'+r]=0;});
 team.forEach(pet=>{const r=roleOf(pet).id,m=powerOf(p,pet);f['has_'+r]=1;f['pow_'+r]+=m;f['cnt_'+r]++;if(reachesFly(pet)){f.reach+=m;f.reachN++;}});
 f.flyX=has('flying')?f.reach:0;f.flyNone=has('flying')&&!f.reachN?1:0;f.armX=has('armored')?f.pow_brawler:0;f.swarmX=has('swarm')?f.pow_stomper:0;return f;}
function winChance(p,S,team,crown,asc){const A=WINM.a[S.id]||WINM.a.forest;if(!A)return .5;let z;
 if(asc>0){const ks=Object.keys(A.asc).map(Number).sort((x,y)=>x-y);let i=0;while(i<ks.length-2&&asc>ks[i+1])i++;const k0=ks[i],k1=ks[i+1];z=asc<=ks[0]?A.asc[ks[0]]+(A.c[2]-A.asc[ks[0]])*(ks[0]-asc)/ks[0]:A.asc[k0]+(A.asc[k1]-A.asc[k0])*(asc-k0)/(k1-k0);}
 else z=A.c[Math.max(0,Math.min(2,(crown||1)-1))];
 const f=teamFeat(p,team,S);for(const k in WINM.b)z+=WINM.b[k]*(f[k]||0);return 1/(1+Math.exp(-z));}
function autoPick(p,S,crown,asc){const av=available(p),n=Math.min(slots(p),av.length),has=k=>S.crit.some(c=>c[2]===k),need=[x=>roleOf(x).id==='wall'];
 if(has('flying'))need.push(reachesFly);if(has('armored'))need.push(x=>roleOf(x).id==='brawler');if(has('swarm'))need.push(x=>roleOf(x).id==='stomper');
 const now=(VIEW&&VIEW.k==='team'&&Array.isArray(VIEW.team))?VIEW.team.slice().sort().join():'',seen={},cands=[];
 for(let i=0;i<240;i++){const t=[];need.forEach(ok=>{if(t.length>=n)return;const c=av.filter(x=>!t.includes(x)&&ok(x));if(c.length)t.push(choose(c));});
  while(t.length<n){const c=av.filter(x=>!t.includes(x));if(!c.length)break;t.push(choose(c));}
  const k=t.map(x=>x.id).sort().join();if(seen[k])continue;seen[k]=1;cands.push({t,k,w:winChance(p,S,t,crown,asc)});}
 if(!cands.length)return [];const fresh=cands.filter(c=>c.k!==now),pool=fresh.length?fresh:cands;
 for(const [lo,hi] of [[.75,.86],[.7,.9],[.62,.94]]){const band=pool.filter(c=>c.w>=lo&&c.w<=hi);if(band.length)return choose(band).t.map(x=>x.id);}
 return pool.reduce((a,c)=>Math.abs(c.w-.8)<Math.abs(a.w-.8)?c:a).t.map(x=>x.id);}
/* before a battle: warn when flying critters are coming and nobody on the team can reach them */
const flyRisk=(S,team)=>S.crit.some(c=>TRAIT[c[2]]&&TRAIT[c[2]].fly)&&!team.some(reachesFly);
function flyWarn(){const ov=document.createElement('div');ov.className='bp2-over';ov.id='bpFlyW';ov.innerHTML=`<div class="bp2-card"><div style="font-size:48px">🐝</div><h2>Flying critters are coming!</h2>
  <p>Nobody on your team can reach them, so they'll fly right over your pets to your Pet House.</p><p class="muted">Flying pets 🪽, Jumpers 🦘 and Archers 🏹 can stop flyers.</p>
  <div class="row"><button class="btn green" onclick="BattlePets._flyFix()">🐝 Show pets that stop flyers</button><button class="btn ghost dark" onclick="BattlePets._flyGo()">Start anyway</button></div></div>`;document.body.appendChild(ov);}
function teamIn(id){const p=me();if(!p||VIEW.k!=='team')return;const t=VIEW.team;if(t.includes(id)){t.splice(t.indexOf(id),1);}else if(t.length<slots(p))t.push(id);else{notice(`🐾 Team full! (${slots(p)} pets)`,'Tap a pet in your team to take it out first.');return;}screen();}
function teamOut(i){if(VIEW.k!=='team')return;VIEW.team.splice(i,1);screen();}
function start(){const p=me();if(!p||VIEW.k!=='team'||!VIEW.team.length)return;const S=stages().find(s=>s.id===VIEW.id);const team=VIEW.team.map(id=>PETS.find(x=>x.id===id)).filter(Boolean);
 if(!VIEW.flyOk&&flyRisk(S,team)){if(!document.getElementById('bpFlyW'))flyWarn();return;}
 rec(p);prog(p).team=VIEW.team.slice();const b=p.bp=p.bp||{s:0,m:[]};b.s=(b.s||0)+1;save();
 newBattle(p,S,VIEW.crown,team,VIEW.asc);G.megaId=prog(p).mega==='eagle'?'eagle':'troll';G.tk=VIEW.tk?G.crown:0;G.q=makeQ(p,S.op);G.songPick=Math.floor(Math.random()*3);enterFS();VIEW={k:'fight',id:S.id,crown:G.crown,asc:G.asc};screen();}
/* the battle takes over the whole screen: no menus, just ✕ Exit (and the browser goes full screen where it can) */
function fightView(p){const S=G.stage;document.body.classList.add('bp2-lock');
 app.innerHTML=`<div class="bp2-full" id="bpFull">
  <div class="bp2-top"><button class="bp2-exit" onclick="BattlePets._quit()" aria-label="Exit the battle">✕ Exit</button><button class="bp2-exit" onclick="BattlePets._sound()" aria-label="Sound (pauses the battle)">🔊</button><button class="bp2-exit" onclick="BattlePets._report()" aria-label="Report a problem or a suggestion (pauses the battle)">🐞</button><span class="bp2-title">${S.art} ${esc(S.name)} ${G.asc?'✨ Ascend '+G.asc:'👑'.repeat(G.crown)}</span>
  <div class="bp2-hud"><span>🏚️</span><div class="bp2-bar"><i id="bpDen" style="background:#e8590c"></i></div><span id="bpT" style="min-width:48px;text-align:center"></span><div class="bp2-bar"><i id="bpHouse" style="background:#40c057"></i></div><span>🏡</span></div></div>
  <div class="bp2-scroll" id="bpScroll"><div class="bp2-field" id="bpField" style="background:linear-gradient(#cfeeff 0 48%,${S.bg[0]} 48% 82%,${S.bg[1]} 82%)"><span class="bp2-base" id="bpDenB" style="left:${DEN_X}%">${window.BPScene?BPScene.base('den',S):'🏚️'}</span><span class="bp2-base" id="bpHouseB" style="left:${HOUSE_X}%">${window.BPScene?BPScene.base('house',S):'🏡'}</span></div></div>
  <div class="bp2-row"><div class="bp2-meter"><i id="bpTreat"></i><span id="bpTreatT"></span></div><button class="bp2-btn" id="bpKit" onclick="BattlePets._kit()"></button><button class="bp2-btn gold" id="bpPounce" onclick="BattlePets._pounce()"></button><button class="bp2-btn train" id="bpTrain" onclick="BattlePets._trainer()"></button><button class="bp2-btn fix" id="bpFix" onclick="BattlePets._fix()"></button></div>
  <div class="bp2-team six">${G.team.map((s,i)=>`<button class="bp2-tc" id="bpTc${i}" onclick="BattlePets._send(${i})"><span class="pe">${s.pet.e}</span><small>${s.R.e} ${s.R.n}<span class="bp2-key">${i+1}</span></small><small>🍖 ${s.R.cost}</small><span class="cd" id="bpCd${i}"></span></button>`).join('')}
   <button class="bp2-tc mega" id="bpTroll" onclick="BattlePets._troll()" aria-label="Call ${megaOf().n}"><span class="pe">${megaArt(megaOf().id,46)}</span><small>MEGA<span class="bp2-key">T</span></small><small>🍖 ${megaOf().cost}</small><span class="cd" id="bpTrollCd"></span></button></div>
  <div class="bp2-card bp2-fix" id="bpFixP" style="display:none"><div class="bp2-row" style="justify-content:space-between"><b>🧱 Rebuild the Pet House</b><span class="bp2-bricks" id="bpBricks"></span><button class="btn small ghost dark" onclick="BattlePets._fixDone()">Done <span class="bp2-key">Esc</span></button></div>
   <div class="bp2-q"><span id="bpQ"></span><span class="box" id="bpIn">&nbsp;</span><button class="btn small ghost dark" onclick="BattlePets._say()" aria-label="Read it to me">🔊</button></div><div class="bp2-msg" id="bpMsg"></div>
   <div class="bp2-pad">${['1','2','3','4','5','6','7','8','9','0','.','⌫'].map(k=>`<button onclick="BattlePets._key('${k}')">${k}</button>`).join('')}</div><div class="bp2-padrow"><button class="skip" onclick="BattlePets._key('skip')">⏭ Skip <span class="bp2-key">Space</span></button><button class="go" onclick="BattlePets._key('go')">✓ Check <span class="bp2-key">Enter</span></button></div></div>
  ${S.note?`<p class="bp2-note">${esc(S.note)}</p>`:''}</div>`;
 const sc=document.getElementById('bpScroll');sc.scrollLeft=sc.scrollWidth;panSetup(sc);scene();
 try{if(RO)RO.disconnect();if(window.ResizeObserver){RO=new ResizeObserver(()=>{clearTimeout(RSZ);RSZ=setTimeout(()=>{if(VIEW.k==='fight')scene();},200);});RO.observe(document.getElementById('bpField'));}}catch(e){}
 G.shown=false;draw();startLoop();}
/* looking around the wide battlefield: swipe (touch scrolls natively), drag with the mouse, the mouse wheel or the arrow keys */
/* the camera follows our lead pet; when the kid looks around by hand it waits 5 seconds, then glides back */
let CAM_HOLD=0;const holdCam=()=>{CAM_HOLD=performance.now()+5000;};
function camera(){const sc=document.getElementById('bpScroll');if(!sc||!G)return;if(G.camAt&&G.t<G.camAt.until){const t=Math.max(0,G.camAt.x/100*sc.scrollWidth-sc.clientWidth*.5);sc.scrollLeft+=(t-sc.scrollLeft)*.3;return;}if(performance.now()<CAM_HOLD)return;const x=leadX();
 const tgt=Math.max(0,Math.min(sc.scrollWidth-sc.clientWidth,x/100*sc.scrollWidth-sc.clientWidth*.6)),d=tgt-sc.scrollLeft;if(Math.abs(d)>3)sc.scrollLeft+=Math.sign(d)*Math.max(1.5,Math.abs(d)*(Math.abs(d)>sc.clientWidth*.5?.16:.08));}
/* the camera rides with our lead pet (the one furthest forward); with no pets out it rests on the Pet House */
function leadX(){const P2=G.pets.filter(u=>!u.gone);return P2.length?Math.min(...P2.map(u=>u.x)):HOUSE_X;}
function frontX(){const P2=G.pets.filter(u=>!u.gone),F=G.foes.filter(f=>!f.gone);const pf=P2.length?Math.min(...P2.map(u=>u.x)):null,ff=F.length?Math.max(...F.map(f=>f.x)):null;
 if(pf!==null&&ff!==null)return (pf+ff)/2;if(pf!==null)return pf;if(ff!==null)return ff;return HOUSE_X;}
function lookAt(pct){holdCam();const sc=document.getElementById('bpScroll');if(!sc)return;sc.scrollTo({left:pct/100*sc.scrollWidth-sc.clientWidth/2,behavior:'smooth'});}
function panBy(px){holdCam();const sc=document.getElementById('bpScroll');if(sc)sc.scrollBy({left:px,behavior:'smooth'});}
/* the scenery (bpscene.js): built for this stage and crown, re-built when the screen changes size, slid by the scroll */
function scene(){try{const f=document.getElementById('bpField'),sc=document.getElementById('bpScroll');if(f)f.style.setProperty('--k',Math.max(1,Math.min(1.5,f.clientHeight/380)).toFixed(2)); /* bigger screen, bigger fighters */
  if(!window.BPScene||!f||!sc||!G)return;BPScene.build(f,sc,G.stage,G.crown);if(G.boss&&!G.bossDown)BPScene.grey(true);}catch(e){}}
let RSZ=0,RO=null,FS=false;
function enterFS(){try{const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen;if(!rq||document.fullscreenElement||document.webkitFullscreenElement)return;FS=true;const r=rq.call(el);if(r&&r.catch)r.catch(()=>{FS=false;});}catch(e){FS=false;}}
function unlock(){document.body.classList.remove('bp2-lock');try{if(RO){RO.disconnect();RO=null;}}catch(e){}try{if(!FS)return;FS=false;const ex=document.exitFullscreen||document.webkitExitFullscreen;if((document.fullscreenElement||document.webkitFullscreenElement)&&ex)ex.call(document);}catch(e){}}
window.addEventListener('resize',()=>{clearTimeout(RSZ);RSZ=setTimeout(()=>{if(typeof curScreen!=='undefined'&&curScreen==='bp'&&VIEW.k==='fight')scene();},250);});
function panSetup(sc){let d=null;sc.addEventListener('scroll',()=>{try{if(window.BPScene)BPScene.parallax(sc);}catch(e){}},{passive:true});
 sc.addEventListener('pointerdown',holdCam);sc.addEventListener('touchstart',holdCam,{passive:true});sc.addEventListener('touchmove',holdCam,{passive:true});
 sc.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;d={x:e.clientX,l:sc.scrollLeft};sc.classList.add('drag');});
 window.addEventListener('pointermove',e=>{if(!d)return;holdCam();sc.scrollLeft=d.l-(e.clientX-d.x);});
 window.addEventListener('pointerup',()=>{if(d){d=null;sc.classList.remove('drag');}});
 sc.addEventListener('wheel',e=>{holdCam();if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){sc.scrollLeft+=e.deltaY;e.preventDefault();}},{passive:false});}
function showQ(fresh){const el=document.getElementById('bpQ');if(!el||!G||!G.q)return;el.innerHTML=esc(qText(G.q));const b=document.getElementById('bpIn');if(b)b.innerHTML=esc(G.inp)||'&nbsp;';
 if(fresh){try{const p=me();if(p&&!p.adult&&(+p.grade||3)<=2&&voiceOn())say(speakable(qText(G.q)),.9);}catch(e){}}}
function fixOpen(){if(!G||G.over)return;if(G.fixing){return;}if(!openFix()){topNote(G.bricks<=0?'No bricks left!':'You can rebuild when your Pet House drops below half.');return;}
 G.q=makeQ(me(),G.stage.op);G.inp='';const m=document.getElementById('bpMsg');if(m)m.textContent='Every right answer lays a brick: +'+Math.round(TUNE.brick*100)+'% for your Pet House.';draw();showQ(true);}
function fixDone(){closeFix();draw();}
function key(k){if(!G||G.over||!G.fixing)return;if(k==='skip'){G.skips=(G.skips||0)+1;G.q=makeQ(me(),G.stage.op);G.inp='';const m=document.getElementById('bpMsg');if(m)m.textContent='Skipped! Here is another one.';showQ(true);return;}
 if(k==='go'){if(G.inp===''||G.inp==='.')return;const ok=Math.abs(parseFloat(G.inp)-G.q.answer)<1e-6;const add=answer(ok);
  try{const p=me(),dk=dayKey();p.daily=p.daily||{};p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][ok?'r':'w']++;}catch(e){}
  const m=document.getElementById('bpMsg');if(m)m.innerHTML=ok?`✅ 🧱 +${Math.round(add/G.houseMax*100)}% Pet House${G.streak>=3?` · 🔥 ${G.streak} in a row!`:''}${G.fixing?'':G.bricks<=0?' · That was your last brick!':' · Your Pet House is good as new!'}`:`The answer was <b>${esc(String(G.q.answer))}</b>. No brick lost. Try this one!`;
  try{SFX[ok?'correct':'wrong']();}catch(e){}G.q=makeQ(me(),G.stage.op);G.inp='';showQ(true);draw();return;}
 if(k==='⌫')G.inp=G.inp.slice(0,-1);else if(k==='.'){if(!G.inp.includes('.'))G.inp+=G.inp?'.':'0.';}else if(G.inp.length<7)G.inp+=k;showQ(false);}
/* the keyboard (computers): while rebuilding, keys type the answer; otherwise they play */
function onKey(e){try{if(document.getElementById('bpSnd')&&(e.key==='Escape'||e.key==='Enter')){soundDone();e.preventDefault();return;}if(typeof curScreen==='undefined'||curScreen!=='bp'||VIEW.k!=='fight'||!G||G.over||document.querySelector('.bp2-over')||document.querySelector('#modal.show'))return;
 const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;const k=e.key;let used=true;
 if(k==='ArrowLeft')panBy(-320);else if(k==='ArrowRight')panBy(320);
 else if(G.fixing){if(/^[0-9]$/.test(k))key(k);else if(k==='.'||k===',')key('.');else if(k==='Backspace')key('⌫');else if(k==='Enter')key('go');else if(k===' ')key('skip');else if(k==='Escape')fixDone();else used=false;}
 else if(/^[1-5]$/.test(k))trySend(+k-1);else if(k==='k'||k==='K'){if(upgradeKitchen())draw();}else if(k===' '||k==='p'||k==='P'){if(pounce())draw();}else if(k==='r'||k==='R')fixOpen();else if(k==='s'||k==='S')soundOpen();else if(k==='t'||k==='T'){if(callTroll())draw();}else if(k==='a'||k==='A')trainerToggle();else used=false;
 if(used){e.preventDefault();e.stopPropagation();}}catch(x){}}
window.addEventListener('keydown',onKey,true);
/* draw: one element per unit, moved every frame */
/* buttons are redrawn every frame: only touch their HTML when it changes, or a click that lands mid-redraw is lost */
const setH=(el,h)=>{if(el&&el._h!==h){el._h=h;el.innerHTML=h;}};
function draw(){if(!G)return;const f=document.getElementById('bpField');if(!f)return;{const fh=f.clientHeight;if(fh&&fh!==G.fh){G.fh=fh;f.style.setProperty('--jh',(-(fh*.46-28))+'px');}}const all=G.pets.concat(G.foes);
 all.forEach(u=>{if(!u.el){u.el=document.createElement('div');u.el.className=`bp2-ent ${u.side==='p'?'pet r-'+((u.R&&u.R.id)||'x'):'foe t-'+(u.trait||'basic')}${u.boss?' boss':''}${u.fly?' fly':''}`;u.el.style.setProperty('--d',(-Math.random()*.9).toFixed(2)+'s');u.el.innerHTML=`<div class="hb"><i></i></div><span class="e">${u.mega?megaArt(u.R.id,130):u.boss?goblinArt(118):u.side==='p'?u.pet.e:u.e}</span>${u.side==='c'&&u.trait&&u.trait!=='boss'&&!u.notag?`<span class="tag">${u.trait}</span>`:''}`;f.appendChild(u.el);}
  if(u.gone){if(!u.dead){u.dead=1;if(!u.left)u.el.classList.add('ko');else u.el.style.opacity=0;const e=u.el;setTimeout(()=>e.remove(),450);if(!u.left){puff(u.x,'poof');if(Math.random()<.6)puff(u.x+(Math.random()*2-1),'dust');}}return;}
  const now=performance.now();if(u.kbT!==u.kbSeen){u.kbSeen=u.kbT;u.kbUntil=now+420;u.el.classList.remove('kb');void u.el.offsetWidth;u.el.classList.add('kb');puff(u.x,'dust');whack();}
  if(u.kbUntil&&now>u.kbUntil){u.kbUntil=0;u.el.classList.remove('kb');puff(u.x,'dust');}
  if(u.lastHp!==undefined&&u.hp<u.lastHp){u.hurtAcc=(u.hurtAcc||0)+u.lastHp-u.hp;if(u.hurtAcc>u.max*.07){u.hurtAcc=0;u.hurtUntil=now+120;}}u.lastHp=u.hp;u.el.classList.toggle('hurt',(u.hurtUntil||0)>now);
  if(u.mega&&u.leapT!==undefined&&!u.leapSeen){u.leapSeen=1;u.el.style.left=HOUSE_X+'%';void u.el.offsetWidth;u.el.classList.add('leap');setTimeout(()=>{try{u.el.classList.remove('leap');puffAny(u.x,'ring');puffAny(u.x-1,'dust');puffAny(u.x+1,'dust');shake();tone(55,.35,'sine',.14);}catch(e){}},900);}
  if(u.mega&&u.R.id==='eagle'){u.el.classList.toggle('air',u.ph==='rise');u.el.classList.toggle('diving',u.ph==='dive');}
  if(u.mega&&u.windT!==u.windSeen){u.windSeen=u.windT;u.el.classList.remove('roar');void u.el.offsetWidth;u.el.classList.add('roar');}
  u.el.style.left=u.x+'%';u.el.classList.toggle('walk',!!u.mv&&!u.fight);if(u.mv&&!u.fly&&window.BPScene&&Math.random()<.025)BPScene.scuff(u.x);u.el.classList.toggle('fight',!!u.fight);if(u.flyer)u.el.classList.toggle('fly',!(u.fight&&!u.tgFly));if(u.side==='c'){u.el.classList.toggle('fly',!!u.fly);u.el.classList.toggle('downed',!!(u.downUntil&&u.downUntil>G.t));}u.el.classList.toggle('stun',!!(u.stun>G.t&&!u.mega&&!(u.leapT!==undefined&&G.t-u.leapT<1)));
  u.el.classList.toggle('upfight',!!(u.side==='p'&&u.fight&&u.tgFly&&!u.flyer&&!u.mega&&u.R&&u.R.id!=='archer'));
  if(u.fight&&!u.mega&&now>(u.fxAt||0)){u.fxAt=now+900;if(u.R&&u.R.id==='archer')arrow(u);else if(u.R&&u.R.id==='medic')puffAny(u.x,'heal',70);
   else{const up=u.side==='p'?!!(u.tgFly||u.el.classList.contains('fly')):!!u.fly,hx=u.x+(u.side==='p'?-1.6:1.6),big=!!u.boss;setTimeout(()=>{try{puffAny(hx,'hit',up?Math.round((G&&G.fh||300)*.46+20):40);hitSound(big?1.8:1);}catch(e){}},Math.random()*250);}}
  if((u.boss||u.mega)&&!u.gone){const eg=u.mega&&u.R&&u.R.id==='eagle';
   if(u.mv&&!eg&&now>(u.stepAt||0)){u.stepAt=now+(u.boss?620:720);stomp(u.boss?1:.8);}
   if(u.boss&&now>(u.voxAt||0)){if(u.voxAt)cackle();u.voxAt=now+5000+Math.random()*3000;}
   if(u.fight&&!eg&&now>(u.bigAt||0)){u.bigAt=now+(u.boss?1400:1100);heavy();puffAny(u.x+(u.side==='p'?-2.6:2.6),'hit',60);}
   if(eg&&(u.ph==='rise'||u.mv)&&now>(u.flapAt||0)){u.flapAt=now+430;flap();}}if(u.mega)u.el.classList.add('mega');u.el.querySelector('.hb i').style.width=Math.max(0,u.hp/u.max*100)+'%';});
 G.pets=G.pets.filter(u=>!(u.gone&&u.dead));G.foes=G.foes.filter(u=>!(u.gone&&u.dead));
 clash();baseSmoke();pawHits();pawFollow();threats();camera();flyHint();
 {const tb=document.getElementById('bpTroll'),tc=document.getElementById('bpTrollCd'),M=megaOf();if(tb&&tc){const out=trollOut(),wait=Math.max(0,G.trollAt-G.t),span=G.trolls?M.cd:M.first;
  tc.style.height=(out?100:wait/span*100)+'%';tb.classList.toggle('poor',G.treats<M.cost||out||wait>0);tb.title=out?`${M.n} is fighting!`:wait>0?`${M.n} is coming in ${Math.ceil(wait)} s`:`Call ${M.n}!`;}}
 const q=id=>document.getElementById(id);q('bpDen').style.width=(G.denHP/G.denMax*100)+'%';q('bpHouse').style.width=(G.houseHP/G.houseMax*100)+'%';q('bpT').textContent=Math.floor(G.t)+'s';
 q('bpTreat').style.width=(G.treats/treatCap()*100)+'%';q('bpTreatT').textContent=`🍖 ${Math.floor(G.treats)} / ${treatCap()}`;
 const fb=q('bpFix'),fp=q('bpFixP'),cf=canFix();setH(fb,`🧱 Rebuild <span class="bp2-key">R</span><br><small>${G.bricks} brick${G.bricks===1?'':'s'}</small>`);fb.disabled=!G.fixing&&!cf;fb.classList.toggle('hot',cf&&!G.fixing);
 if(fp){if(G.fixing!==G.shown){G.shown=G.fixing;fp.style.display=G.fixing?'':'none';if(G.fixing){showQ(false);try{fp.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(e){}}}const bk=q('bpBricks');if(bk)bk.textContent=`🧱 × ${G.bricks}`;}
 if(window.BPScene){BPScene.baseState(q('bpHouseB'),G.houseHP/G.houseMax);BPScene.baseState(q('bpDenB'),G.denHP/G.denMax);if(G.boss&&!G.bossDown)BPScene.grey(true);}

 const kb=q('bpKit');kb.textContent=G.kl>=4?'🍳 Kitchen max':`🍳 Kitchen ${G.kl+1}→${G.kl+2} · 🍖${kitchenCost()}`;kb.disabled=G.kl>=4||G.treats<kitchenCost();
 const tn=q('bpTrain');if(tn){if(G.trainer){const on=G.trainer.on;setH(tn,`🧑‍🏫 Trainer ${on?'ON':'OFF'} <span class="bp2-key">A</span>`);tn.classList.toggle('on',on);tn.classList.remove('ask');tn.disabled=false;tn.setAttribute('aria-pressed',on?'true':'false');}
  else{const n=(prog(me()||{}).tr)||0;setH(tn,n?`🧑‍🏫 Trainer OFF<br><small>${n} session${n===1?'':'s'}</small>`:`🧑‍🏫 Trainer<br><small>no sessions</small>`);tn.classList.remove('on');tn.classList.toggle('nohire',!n);tn.title=n?'Switch the Trainer on (uses one session)':'Hire Trainer sessions on the team screen';}}
 const pb=q('bpPounce');pb.textContent=G.charge>=100?'🐾 POUNCE!':`🐾 ${Math.floor(G.charge)}%`;pb.disabled=G.charge<100;
 G.team.forEach((s,i)=>{const c=q('bpCd'+i),b=q('bpTc'+i);if(!c)return;const left=Math.max(0,s.ready-G.t);c.style.height=(left/s.R.cd*100)+'%';b.classList.toggle('poor',G.treats<s.R.cost);});
 while(G.fx.length){const k=G.fx.shift();try{if(k==='send')tone(440,.1,'square',.03);else if(k==='poof')tone(300,.12,'triangle',.04);else if(k==='sleepy')retired();else if(k==='denFall')baseFall(DEN_X);else if(k==='houseFall')baseFall(HOUSE_X);else if(k==='trainerFix')topNote('🧑‍🏫 Trainer: your Pet House needs bricks! Tap 🧱 Rebuild: the math is your job.');else if(k==='downed')topNote('💫 The paw knocked the flyers to the ground! Hit them now, before they fly again.');else if(k==='pounce'){const x=G.slam?G.slam.x:50;[392,523,659,784].forEach((h,j)=>tone(h,.12,'triangle',.06,j*.06));flash('🐾 PET POUNCE!',true);
    const fl=document.getElementById('bpField');if(fl){const sh=document.createElement('div');sh.className='bp2-pshadow';sh.style.left=x+'%';const pw=document.createElement('div');pw.className='bp2-sky';pw.style.left=x+'%';pw.innerHTML=PAW;fl.appendChild(sh);fl.appendChild(pw);G.slamEls=[sh,pw];setTimeout(()=>{sh.remove();pw.remove();},1450);}
    G.pets.forEach(u=>{if(u.el&&!u.gone&&!u.mega){u.el.classList.add('cheer');setTimeout(()=>{try{u.el.classList.remove('cheer');}catch(e){}},1300);}});}
   else if(k==='slam'){const x=G.slamX;shake();setTimeout(shake,180);tone(48,.6,'sine',.22);tone(90,.25,'square',.08);tone(1400,.18,'triangle',.03,.02);
    puffAny(x,'ring');setTimeout(()=>puffAny(x,'ring'),120);for(let i=0;i<6;i++)puffAny(x+(Math.random()*8-4),'dust');
    const fl=document.getElementById('bpField');if(fl){const b=document.createElement('div');b.className='bp2-blast';b.style.setProperty('--bx',x+'%');fl.appendChild(b);setTimeout(()=>b.remove(),600);}}else if(k==='boss'){shake();if(window.BPScene)BPScene.grey(true);tone(110,.6,'sawtooth',.06);setTimeout(cackle,500);flash(`The ${G.stage.boss[0]} bursts out!`);}else if(k==='bossdown'){if(window.BPScene)BPScene.rainbow();flash('🌈 The colors are back! Knock over the den!');}else if(k==='kitchen')SFX.coin();else if(k==='brick')tone(660,.08,'square',.04);else if(k==='standH'){shake();flash('🏡 LAST STAND! Critters thrown back!');[392,523,659].forEach((h,j)=>tone(h,.15,'square',.06,j*.08));}else if(k==='standD')flash('🏚️ The den shakes your pets back!');else if(k==='tired')topNote('😴 The critters are getting sleepy. Push now!');
   else if(k==='troll'){shake();flash(`🧌 ${TROLL.n} stomps in!`);tone(70,.5,'sawtooth',.08);tone(55,.6,'square',.05,.2);}
   else if(k==='roar'){const t=G.pets.find(u=>u.mega&&!u.gone);if(t){[0,110,220,330].forEach(ms=>setTimeout(()=>puffAny(t.x-1.6,'sound',78),ms));puffAny(t.x-2.5,'word',150);puffAny(t.x-3,'dust');puffAny(t.x-5,'dust');}shake();setTimeout(shake,250);roarSound();}
   else if(k==='trollbye')topNote(`🧌 ${TROLL.n} stomps home. He'll be back!`);
   else if(k==='eaglebye')topNote(`🦅 ${EAGLE.n} flies home. She'll be back!`);
   else if(k==='eagle'){flash(`🦅 ${EAGLE.n} swoops in!`);screech();tone(1500,.18,'triangle',.03);tone(1100,.25,'triangle',.025,.12);}
   else if(k==='swoop'){tone(900,.3,'sawtooth',.012);tone(600,.35,'triangle',.02,.05);}
   else if(k==='dive'){const x=G.diveX;screech();puffAny(x,'ring');puffAny(x-1,'dust');puffAny(x+1,'dust');puffAny(x,'star');shake();tone(70,.3,'sine',.1);}
   else if(k==='bossHit'){shake();tone(90,.18,'sawtooth',.04);}}catch(e){}}}
/* effects: little dust clouds, smoke and hit stars, kept to a handful at a time so older iPads stay smooth */
let PTS=0,CLASH=0,WHACK=0;
/* battle sounds: soft thumps while fighters clash, a whack on a knock-back (never more than a few a second), a sleepy tune when a pet is
   retired, and a big crash when a base falls */
function hitSound(v){try{const r=Math.random();tone(95+r*70,.06,'square',.016*v);tone(620+r*700,.035,'triangle',.01*v,.012);}catch(e){}}
function whack(){const n=performance.now();if(n<WHACK)return;WHACK=n+120;try{tone(210+Math.random()*60,.07,'sawtooth',.022);tone(150,.09,'square',.016,.02);}catch(e){}}
function stomp(v){try{tone(55,.16,'sine',.09*v);tone(92,.08,'square',.018*v,.01);}catch(e){}}
function heavy(){try{tone(70,.2,'sawtooth',.06);tone(130,.1,'square',.03,.02);tone(1600,.05,'triangle',.01,.03);}catch(e){}}
function cackle(){try{[0,.11,.22,.33,.44].forEach((d,i)=>tone(i%2?360:480,.09,'square',.022,d));tone(85,.5,'sawtooth',.03,.55);}catch(e){}} /* the Grey Goblin's laugh and growl */
function flap(){try{tone(260,.12,'sawtooth',.011);tone(180,.14,'triangle',.012,.05);}catch(e){}}
function screech(){try{[[1900,0],[1700,.08],[1500,.16]].forEach(([f,d])=>tone(f,.14,'sawtooth',.02,d));tone(2300,.25,'triangle',.015,.02);}catch(e){}}
function retired(){try{[[660,0],[523,.1],[392,.2]].forEach(([f,d])=>tone(f,.16,'triangle',.035,d));}catch(e){}}
function baseFall(x){shake();setTimeout(shake,200);setTimeout(shake,420);try{tone(55,.9,'sawtooth',.14);tone(38,1.1,'square',.09,.06);tone(90,.5,'triangle',.06,.25);
 for(let i=0;i<8;i++)tone(380+Math.random()*1400,.05,'square',.02,i*.07);}catch(e){}for(let i=0;i<8;i++)setTimeout(()=>{try{puffAny(x+(Math.random()*8-4),'dust');}catch(e){}},i*60);}
function puff(x,kind){if(PTS>=36)return;const f=document.getElementById('bpField');if(!f)return;const d=document.createElement('div');d.className='bp2-pt '+kind;d.style.left=x+'%';
 if(kind==='star')d.textContent=Math.random()<.5?'💥':'✨';if(kind==='dust')d.style.setProperty('--dx',(Math.random()*24-12)+'px');PTS++;f.appendChild(d);
 const done=()=>{if(d.parentNode){d.remove();PTS--;}};d.addEventListener('animationend',done);setTimeout(done,900);}
function clash(){const now=performance.now();if(now<CLASH)return;CLASH=now+170;const fighters=G.pets.concat(G.foes).filter(u=>!u.gone&&u.fight);if(!fighters.length)return;
 const u=fighters[Math.floor(Math.random()*fighters.length)];const x=u.x+(u.side==='p'?-2:2)+(Math.random()*2-1);puff(x,'dust');if(Math.random()<.35)hitSound(.6);if(window.BPScene&&Math.random()<.4)BPScene.scuff(x);if(Math.random()<.22)puff(x,'star');}
/* a hurt base smokes: from 25% damage, more and darker smoke the more it is hurt, with embers near the end */
let WSEEN=0;
/* stars on every critter the paw hit */
function pawFollow(){if(G.slam&&G.slamEls)G.slamEls.forEach(e=>{e.style.left=G.slam.x+'%';});}
function pawHits(){G.foes.forEach(f=>{if(f.pawT&&f.pawT!==f.pawSeen&&!f.gone){f.pawSeen=f.pawT;puffAny(f.x,'star',60);puffAny(f.x,'dust');}});}
/* effects that must show even when the screen is busy (the pounce) */
function puffAny(x,kind,y){const f=document.getElementById('bpField');if(!f||PTS>60)return;const d=document.createElement('div');d.className='bp2-pt '+kind;d.style.left=x+'%';if(y!==undefined)d.style.bottom=y+'px';
 if(kind==='star')d.textContent=Math.random()<.5?'💥':'⭐';if(kind==='word')d.textContent='RRROOAAARR!';if(kind==='heal')d.textContent=Math.random()<.5?'✚':'💚';if(kind==='dust')d.style.setProperty('--dx',(Math.random()*30)+'px');PTS++;f.appendChild(d);
 const done=()=>{if(d.parentNode){d.remove();PTS--;}};d.addEventListener('animationend',done);setTimeout(done,900);}
/* Grumbleroot's roar, made live: a growl that falls in pitch, rough breath noise and a deep rumble */
function roarSound(){try{if(typeof state!=='undefined'&&!state.sound)return;const ctx=AC||(AC=new(window.AudioContext||window.webkitAudioContext)());const out=fxOut(ctx),t=ctx.currentTime;
 const nb=ctx.createBuffer(1,ctx.sampleRate*1.3,ctx.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 const n=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),ng=ctx.createGain();n.buffer=nb;bp.type='bandpass';bp.Q.value=1.1;bp.frequency.setValueAtTime(900,t);bp.frequency.exponentialRampToValueAtTime(220,t+1.15);
 ng.gain.setValueAtTime(.0001,t);ng.gain.exponentialRampToValueAtTime(.28,t+.08);ng.gain.setValueAtTime(.25,t+.7);ng.gain.exponentialRampToValueAtTime(.0001,t+1.25);n.connect(bp);bp.connect(ng);ng.connect(out);n.start(t);n.stop(t+1.3);
 const o=ctx.createOscillator(),lp=ctx.createBiquadFilter(),og=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(62,t+1.15);
 lp.type='lowpass';lp.frequency.value=950;og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(.14,t+.07);og.gain.setValueAtTime(.13,t+.75);og.gain.exponentialRampToValueAtTime(.0001,t+1.2);
 lfo.frequency.value=21;lg.gain.value=.12;lfo.connect(lg);lg.connect(og.gain);o.connect(lp);lp.connect(og);og.connect(out);o.start(t);lfo.start(t);o.stop(t+1.25);lfo.stop(t+1.25);
 const sub=ctx.createOscillator(),sg=ctx.createGain();sub.frequency.setValueAtTime(70,t);sub.frequency.exponentialRampToValueAtTime(40,t+1.1);sg.gain.setValueAtTime(.18,t);sg.gain.exponentialRampToValueAtTime(.0001,t+1.2);sub.connect(sg);sg.connect(out);sub.start(t);sub.stop(t+1.25);}catch(e){}}
const SMKT={};let SMKN=0;
function baseSmoke(){const now=performance.now();[['h',G.houseHP/G.houseMax,HOUSE_X],['d',G.denHP/G.denMax,DEN_X]].forEach(([k,hp,x0])=>{const top=k==='h'&&Math.random()<.55,x=top?x0+1.2:x0+(Math.random()*3-1.5),y=top?116:52+Math.random()*50;const dmg=1-hp;if(dmg<.25||now<(SMKT[k]||0))return;
 const I=Math.min(1,(dmg-.25)/.7);SMKT[k]=now+1000/(1.2+11*I);smoke(x,I,false,y);if(I>.55&&Math.random()<I*.5)smoke(x,I,true,y);});}
function smoke(x,I,ember,y){if(SMKN>=44)return;const f=document.getElementById('bpField');if(!f)return;const d=document.createElement('div'),sz=Math.round(22+30*I*(.7+Math.random()*.6)),g=Math.round(205-150*I);
 d.className='bp2-pt '+(ember?'ember':'smoke');d.style.left=(x+(Math.random()*1.2-.6))+'%';d.style.bottom=(y||70)+'px';
 if(!ember){d.style.width=d.style.height=sz+'px';d.style.background=`rgb(${g},${g},${g+6})`;d.style.setProperty('--op',(.55+.35*I).toFixed(2));d.style.setProperty('--dur',(1.7+1.1*I).toFixed(2)+'s');}
 d.style.setProperty('--dx',(Math.random()*60-30)+'px');d.style.setProperty('--rise',Math.round(100+80*I)+'px');SMKN++;f.appendChild(d);
 const done=()=>{if(d.parentNode){d.remove();SMKN--;}};d.addEventListener('animationend',done);setTimeout(done,3200);}
/* critters that slip past the front line: an edge alert while they are off screen (tap it to look), and the first time they hit
   the Pet House the camera glides over for about 3 seconds with an alarm, then back to the lead pet. Once per break-in: it re-arms
   after the house has been left alone for 6 seconds. */
function threats(){if(!G||G.over)return {n:0};const sc=document.getElementById('bpScroll'),full=document.getElementById('bpFull');if(!sc||!full)return {n:0};
 const P2=G.pets.filter(u=>!u.gone);const lead=P2.length?Math.min(...P2.map(u=>u.x)):null;
 const W2=sc.scrollWidth,right=(sc.scrollLeft+sc.clientWidth)/W2*100;
 const past=lead==null?[]:G.foes.filter(f=>!f.gone&&f.x>lead+2&&f.x>right-1);
 let el=document.getElementById('bpAlert');
 if(past.length&&!(G.camAt&&G.t<G.camAt.until)){if(!el){el=document.createElement('button');el.id='bpAlert';el.className='bp2-alert';full.appendChild(el);
   el.onclick=()=>{const g=G;if(!g)return;const f=g.foes.filter(x=>!x.gone).reduce((a,b)=>b.x>a.x?b:a,{x:HOUSE_X-6});g.camAt={x:Math.min(HOUSE_X-4,f.x),until:g.t+3};};}
  el.hidden=false;el.textContent=`${past[0].e} → 🏡 ${past.length} critter${past.length>1?'s':''} heading home!`;
  const fr=sc.getBoundingClientRect(),pr=full.getBoundingClientRect();el.style.top=(fr.top-pr.top+fr.height*.3)+'px';el.style.right=(pr.right-fr.right+8)+'px';}
 else if(el)el.hidden=true;
 if(G.houseHit&&G.t-G.houseHit<.3&&G.dangerArmed!==false){G.dangerArmed=false;G.camAt={x:HOUSE_X-5,until:G.t+3};shake();topNote('🚨 Critters are smashing your Pet House!');
  try{[0,.18,.36].forEach((d,i)=>tone(i%2?660:880,.14,'square',.035,d));}catch(e){}}
 if(G.dangerArmed===false&&(!G.houseHit||G.t-G.houseHit>6))G.dangerArmed=true;
 return {n:past.length,el:!!el&&!el.hidden};}
/* the first time a flyer slips past the front line, say how to stop it */
function flyHint(){if(G.flyHint)return;const P2=G.pets.filter(u=>!u.gone&&!u.mega);if(!P2.length)return;const front=Math.min(...P2.map(u=>u.x));
 if(G.foes.some(f=>!f.gone&&f.fly&&f.x>front+3)){G.flyHint=true;topNote(G.team.some(s=>s.R.fly||flies(s.pet))?'🐝 Flyers float over pets that can\'t reach them! Send a flying pet 🪽, a Jumper 🦘 or an Archer 🏹.':'🐝 Flyers float over pets that can\'t reach them! Next time, bring a flying pet 🪽, a Jumper 🦘 or an Archer 🏹.');}}
/* an Archer's arrow flies to the critter it is shooting */
function arrow(u){const f=document.getElementById('bpField');if(!f)return;const tg=G.foes.filter(x=>!x.gone&&(!x.fly||u.R.fly||u.flyer)&&u.x-x.x>=-1&&u.x-x.x<=u.rng);if(!tg.length)return;const t=tg.reduce((a,b)=>b.x>a.x?b:a);
 const px=(u.x-t.x)/100*f.clientWidth,air=f.clientHeight*.48,gnd=54,sAir=!!(u.el&&u.el.classList.contains('fly'));if(px<30&&!(t.fly&&!sAir))return;
 const shoot=(from,to)=>{const a=document.createElement('div'),dy=from-to,dist=Math.hypot(px,dy);a.className='bp2-arrow';a.style.left=u.x+'%';a.style.bottom=from+'px';a.style.setProperty('--px',(-dist)+'px');a.style.rotate=(-Math.atan2(dy,Math.max(1,px))*180/Math.PI)+'deg';f.appendChild(a);setTimeout(()=>a.remove(),500);try{tone(1250,.05,'triangle',.012);}catch(e){}};
 if(t.fly&&!sAir){const e=u.el;e.classList.remove('jumpshot');void e.offsetWidth;e.classList.add('jumpshot');setTimeout(()=>{try{e.classList.remove('jumpshot');}catch(x){}},650);setTimeout(()=>{if(G&&!u.gone)shoot(air,air);},250);} /* jump up, shoot at the top */
 else shoot(sAir?air:gnd,t.fly?air:gnd);}
function shake(){const sc=document.getElementById('bpScroll');if(!sc)return;sc.classList.remove('shake');void sc.offsetWidth;sc.classList.add('shake');}
/* 🔊 during a battle: the game pauses while the kid sets the sound-effects and music volume and picks the battle song.
   p.bpSong: 'mix' (a different song each battle), 'march' (Pet Battle), 'last' (Last Stand), 'firm' (Stand Firm) or 'off' (no music in battles). */
const SONGS=[['mix','🎲 Mix them up','A different song each battle'],['march','🥁 Pet Battle','Bouncy marching band'],['last','⚔️ Last Stand','Epic drums and strings'],['firm','🛡️ Stand Firm','Slower: war drums and horns'],['off','🔇 No battle music','']];
function songChoice(p){const c=p&&p.bpSong;return SONGS.some(x=>x[0]===c)?c:'mix';}
function songId(){const p=me();const c=songChoice(p);if(c==='off')return null;if(c==='march')return 'petBattle';if(c==='last')return 'lastStand';if(c==='firm')return 'standFirm';return ['petBattle','lastStand','standFirm'][(G&&G.songPick)||0];}
function soundOpen(){if(!G||G.over)return;G.paused=true;document.querySelectorAll('#bpSnd').forEach(x=>x.remove());const p=me();
 const fx=(typeof state!=='undefined'&&state.sound===false)?0:((typeof state!=='undefined'&&state.fxVol!=null)?state.fxVol:70),mu=(typeof state!=='undefined'&&state.musicVol!=null)?state.musicVol:30,c=songChoice(p);
 const sl=(k,t,v)=>`<div class="bp2-sl"><div><b>${t}</b><span id="bpv_${k}">${v===0?'Off':v+'%'}</span></div><input type="range" min="0" max="100" step="5" value="${v}" aria-label="${t}" oninput="BattlePets._vol('${k}',this.value,false)" onchange="BattlePets._vol('${k}',this.value,true)"></div>`;
 const ov=document.createElement('div');ov.className='bp2-over';ov.id='bpSnd';ov.innerHTML=`<div class="bp2-card bp2-sndc"><h2 style="margin:0 0 4px">🔊 Sound</h2><p class="muted" style="margin:0 0 10px">⏸️ The battle is paused.</p>
  ${sl('fx','💥 Sound effects',fx)}${sl('mu','🎵 Battle music',mu)}
  <div class="bp2-songs">${SONGS.map(([k,t,sub])=>`<button class="${c===k?'on':''}" onclick="BattlePets._song('${k}')"><b>${t}</b>${sub?`<small>${sub}</small>`:''}</button>`).join('')}</div>
  <button class="btn green big" style="width:100%" onclick="BattlePets._soundDone()">▶ Back to the battle</button></div>`;document.body.appendChild(ov);}
function soundDone(){document.querySelectorAll('#bpSnd').forEach(x=>x.remove());if(G){G.paused=false;LAST=performance.now();}}
function setVol(k,v,done){try{Music.vol(k,v,done);}catch(e){}const l=document.getElementById('bpv_'+k);if(l)l.textContent=+v===0?'Off':Math.round(+v/5)*5+'%';}
function setSong(k){const p=me();if(!p)return;p.bpSong=k;save();try{Music.update();}catch(e){}const ov=document.getElementById('bpSnd');if(ov)ov.querySelectorAll('.bp2-songs button').forEach((b,i)=>b.classList.toggle('on',SONGS[i][0]===k));}
/* battle tips show near the top of the screen, under the health bars, so they never cover the pet buttons */
function topNote(t){document.querySelectorAll('.bp2-topnote').forEach(x=>x.remove());const d=document.createElement('div');d.className='bp2-topnote';d.setAttribute('role','status');d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3400);}
/* a big notice in the middle of the screen (team full, too many pets out) */
let NOTE_T=0;
function notice(t,sub){const now=Date.now();if(now<NOTE_T)return;NOTE_T=now+1200;document.querySelectorAll('.bp2-note-pop').forEach(x=>x.remove());
 const d=document.createElement('div');d.className='bp2-note-pop';d.setAttribute('role','status');d.innerHTML=`<b>${esc(t)}</b>${sub?`<small>${esc(sub)}</small>`:''}`;document.body.appendChild(d);setTimeout(()=>d.remove(),1900);try{tone(220,.12,'square',.04);}catch(e){}}
function trySend(i){if(send(i)){draw();return;}if(G&&!G.over&&G.team[i]&&G.pets.filter(x=>!x.gone&&!x.mega).length>=MAX_OUT)notice(`🐾 Max pets out! (${MAX_OUT})`,'Wait for a pet to come back before sending more.');}
function flash(t,big){const f=document.getElementById('bpScroll');if(!f)return;const d=document.createElement('div');d.className='bp2-flash'+(big?' bp2-pounce-t':'');d.textContent=t;d.style.position='fixed';d.style.top='40%';document.body.appendChild(d);setTimeout(()=>d.remove(),1700);}
function loop(now){if(VIEW.k!=='fight'||!G||typeof curScreen==='undefined'||curScreen!=='bp'){stopLoop();return;}const dt=Math.min(.05,(now-LAST)/1000);LAST=now;if(!document.hidden&&!G.paused)step(dt);draw();if(G.over){stopLoop();const g=G;setTimeout(()=>{if(G===g)finish();},1100);return;} /* a moment to see and hear the base fall */RAF=requestAnimationFrame(loop);}
function startLoop(){stopLoop();LAST=performance.now();RAF=requestAnimationFrame(loop);}
function stopLoop(){if(RAF)cancelAnimationFrame(RAF);RAF=0;}
/* the end: rewards feed the pets; the play log feeds Parent Corner */
function finish(){if(!G||G.done)return;G.done=true;const p=me();if(!p)return;const pr=prog(p),S=G.stage;pr.asc=pr.asc||{};
 const newBest=G.win&&G.asc>0&&G.asc>(pr.asc[S.id]||0),first=G.win&&((pr.c[S.id]||0)<G.crown||newBest);
 const xp=G.win?3*G.crown+Math.min(6,G.asc||0):1;if(newBest)pr.asc[S.id]=G.asc;G.team.forEach(s=>{try{if((p.pets||[]).includes(s.pet.id))petGain(p,s.pet,xp);}catch(e){}});
 let snack='';if(first){pr.c[S.id]=Math.max(pr.c[S.id]||0,G.crown);const f=choose(['cookie','apple','carrot']);p.pantry=p.pantry||{};p.pantry[f]=(p.pantry[f]||0)+1;snack=f;}
 const b=p.bp=p.bp||{s:0,m:[]};b.m=b.m||[];const n=x=>Math.max(0,Math.min(9999,Math.round(+x||0)));
 b.m.push([Math.floor(Date.now()/1000),stages().findIndex(s=>s.id===S.id)*10+G.crown,G.win?1:0,n(G.t),n(G.asked),n(G.right),n(G.sent),n(G.pounces),n(G.houseHP/G.houseMax*100),n(G.denHP/G.denMax*100),n(G.trolls),n(G.asc),G.trainer?1:0]);if(b.m.length>LOG_MAX)b.m=b.m.slice(-LOG_MAX);
 const R=rec(p);R[G.win?'w':'l']++;const st=starsFor(G),stK=lvKey(S.id,G.crown,G.asc||0);pr.st=pr.st||{};const prevSt=pr.st[stK]||0;if(st>prevSt)pr.st[stK]=st;const tkLeft=G.tk?useTicket(p,S.id,G.tk,G.win):null,tkMore=G.tk?ticketLevels(p,S.id).length:0;save();try{SFX[G.win?'win':'wrong']();}catch(e){}
 const ov=document.createElement('div');ov.className='bp2-over';ov.innerHTML=`<div class="bp2-card"><div style="font-size:60px">${G.win?'🎉':'💤'}</div><p class="bp2-who">${G.win?'🏆 <b>Your pets won!</b>':'🐛 <b>The critters won this time.</b>'}</p>${G.win?`<div class="bp2-stars" aria-label="${st} of 3 stars">${starStr(st)}</div>${st>prevSt&&prevSt?'<p>🌟 <b>New best</b> for this level!</p>':''}`:''}<h2>${G.win?`${esc(S.name)} ${G.asc?'✨ Ascend '+G.asc:'👑'.repeat(G.crown)} beaten!`:'Your pets need a rest'}</h2>${G.win&&newBest?`<p>✨ New best: <b>Ascend ${G.asc}</b>!</p>`:''}${G.tk?`<p class="bp2-tk">${G.win?`🎟️ Battle won! ${LEGEND_MSG}`:tkLeft==='x'?'💪 You get <b>one more try</b> at this level!':`🎟️ That was your last try here. ${LEGEND_MSG}`}</p>`:''}${G.win&&G.crown===3&&!G.asc&&first&&!G.tk?'<p>✨ <b>Ascend</b> is open: endless levels, each one harder. How far can you go?</p>':''}
  <p>⏱️ ${bpTime(G.t)}${G.win&&st<3?` <span class="muted">(for 3 ⭐: win in under ${bpTime(STAR_T[Math.min(3,G.crown)][0])} and keep your Pet House above half)</span>`:''}${G.asked?` · 🧱 ${G.right} brick${G.right===1?'':'s'} laid (${G.right} of ${G.asked} answers right)`:''}</p><p><b>+${xp} pet XP</b> for each pet on your team${snack?` and a <b>${snack}</b> for your pantry`:''}.</p>${G.win?'':'<p class="muted">Nothing is lost. Try a different team, upgrade the kitchen early, save your Pounce for the boss, and tap 🧱 Rebuild when your Pet House gets low!</p>'}
  <p class="bp2-rec">Your record: 🏆 <b>${R.w}</b> won · 💤 <b>${R.l}</b> lost · 🚪 <b>${R.q}</b> quit</p>
  <div class="row">${G.tk&&!tkMore?'':`<button class="btn green big" onclick="BattlePets._again()">${G.tk?(tkLeft==='x'?'Try again':'Next battle ➜'):G.win&&G.crown<3?'Next crown ➜':G.win?'✨ Ascend '+((G.asc||0)+1)+' ➜':'Play again'}</button>`}<button class="btn ghost dark" onclick="BattlePets._back()">${esc(backLabel(S))}</button></div></div>`;
 document.body.appendChild(ov);}
function again(){const g=G;document.querySelectorAll('.bp2-over').forEach(x=>x.remove());if(!g)return backTo();const p=me(),pr=prog(p);
 if(g.tk){const lv=ticketLevels(p,g.stage.id);if(!lv.length)return backTo();return pickStage(g.stage.id,lv.includes(g.crown)?g.crown:lv[0],0,true);} /* ticket battles: the same level's retry, or the next ticket */const c=g.win&&g.crown<3?g.crown+1:g.crown;
 if(g.crown===3&&(g.win||g.asc))return pickStage(g.stage.id,3,g.win?(g.asc||0)+1:g.asc); /* after crown 3: on to the next Ascend level (or try this one again) */
 pickStage(g.stage.id,Math.min(c,(pr.c[g.stage.id]||0)+1));}
function backTo(){stopLoop();unlock();document.querySelectorAll('#bpSnd').forEach(x=>x.remove());document.querySelectorAll('.bp2-over').forEach(x=>x.remove());G=null;
 const f=FROM;FROM=null;if(f){VIEW={k:'stages'};if(f.s==='lab'&&!(window.Lab&&Lab.hasKey&&Lab.hasKey(me())))go('world');else go(f.s,f.a);return;}VIEW={k:'stages'};screen();}
const backLabel=S=>FROM?(FROM.s==='lab'?'🔬 Back to the Lab':`← ${S.name}`):'Stages';
/* ✕ Exit from a battle goes back to the team builder for the same stage and level (unused Trainer sessions stay saved) */
function leave(){const g=G;if(!g||!g.stage)return backTo();if(!g.over&&g.t>3){const p=me();if(p){rec(p).q++;if(g.tk)useTicket(p,g.stage.id,g.tk,false);save();}}stopLoop();unlock();document.querySelectorAll('#bpSnd').forEach(x=>x.remove());document.querySelectorAll('.bp2-over').forEach(x=>x.remove());G=null;if(g.tk){const lv=ticketLevels(me(),g.stage.id);if(!lv.length)return backTo();return pickStage(g.stage.id,lv.includes(g.crown)?g.crown:lv[0],0,true);}pickStage(g.stage.id,g.crown,g.asc||0);}
function quit(){if(G&&!G.over&&G.t>3){if(!document.getElementById('bpQuit')){const ov=document.createElement('div');ov.className='bp2-over';ov.id='bpQuit';ov.innerHTML=`<div class="bp2-card"><h2>Leave this battle?</h2><p>${G.trainer?"Your pets are fine, but this battle won't count, and the Trainer session is already used.":"Nothing is lost, but this battle won't count."}${G.tk?" It does use up this 🎟️ try.":""}</p><div class="row"><button class="btn green" onclick="this.closest('.bp2-over').remove()">Keep playing</button><button class="btn ghost dark" onclick="BattlePets._leave()">Leave</button></div></div>`;document.body.appendChild(ov);}return;}leave();}

/* ---------- the plaza building (demo access for every hero) ---------- */
function syncTile(){try{if(typeof W==='undefined'||!W||!W.T)return;const t=W.T[BP_Y]&&W.T[BP_Y][BP_X];if(!t||t.water)return;
 if(t.npc==='bp'){delete t.npc;t.block=false;}}catch(e){}} /* the plaza building is gone (Oct 2026): stages open from each world's page */
/* 🎟️ battles before Legend (owner, Oct 2026): 🥉 Bronze, 🥈 Silver and 🥇 Gold each give that world one battle at 👑, 👑👑 and 👑👑👑
   (a loss gives one retry), 💎 Diamond gives a free 🧑‍🏫 Pet Trainer session, and 👑 Legend opens every level any time, plus ✨ Ascend.
   Medals earned before this existed count too. p.bp2.tk = {world:{1:'r'|'x'|'u',2:…,3:…,d:1}}: r ready, x one retry left, u used. */
function legend(p,zid){try{return medal(p,zid)>=5;}catch(e){return false;}}
function tickets(p,zid){const pr=prog(p);pr.tk=pr.tk||{};const t=pr.tk[zid]=pr.tk[zid]||{};let m=0,ch=false;try{m=medal(p,zid)||0;}catch(e){}
 for(let k=1;k<=Math.min(3,m);k++)if(!t[k]){t[k]='r';ch=true;}
 if(m>=4&&!t.d){t.d=1;pr.tr=(pr.tr||0)+1;ch=true;setTimeout(()=>{try{toast('💎 Diamond medal: a free 🧑‍🏫 Pet Trainer session for Battle Pets!');}catch(e){}},400);}
 if(ch)save();return t;}
const ticketLevels=(p,zid)=>{const t=tickets(p,zid);return [1,2,3].filter(k=>t[k]==='r'||t[k]==='x');};
function useTicket(p,zid,crown,won){const t=tickets(p,zid);if(!t[crown]||t[crown]==='u')return t[crown];t[crown]=won?'u':t[crown]==='r'?'x':'u';return t[crown];}
const LEGEND_MSG='🔒 Reach 👑 <b>Legend</b> here to play any level again, then challenge yourself with ✨ <b>Ascend</b>!';
/* the world page: a Battle button once that world has a ticket (or for good, after its 👑 Legend round) */
function zoneBtn(zid){const st=stages().find(x=>x.id===zid),p=me();if(!st||!p||!on(p))return;const tip=document.querySelector('#app .ztip');if(!tip||document.getElementById('bpZone'))return;
 let won=false;try{won=medal(p,zid)>=5;}catch(e){}const c=prog(p).c[zid]||0;const d=document.createElement('div');d.id='bpZone';d.className='bp2-zone';
 const lv=ticketLevels(p,zid);let m=0;try{m=medal(p,zid)||0;}catch(e){}
 d.innerHTML=won?`<button class="btn gold big" onclick="BattlePets.openStage('${zid}')">🐾 Battle Pets: ${esc(st.name)} ${c?'👑'.repeat(c):''}${(prog(p).asc||{})[zid]?' ✨'+prog(p).asc[zid]:''}</button>`
  :lv.length?`<button class="btn gold big" onclick="BattlePets.openStage('${zid}')">🎟️ Battle Pets: ${esc(st.name)} ${'👑'.repeat(lv[0])} · ${lv.length} battle${lv.length===1?'':'s'} ready</button><p class="muted" style="margin:6px 0 0">${LEGEND_MSG}</p>`
  :m?`<p>🎟️ You've played your 🐾 Battle Pets battles here. ${LEGEND_MSG}</p>`:`<p>🎟️ Earn a 🥉 <b>Bronze</b> medal here for a 🐾 Battle Pets battle! Each medal gives another one, and 👑 <b>Legend</b> opens them all.</p>`;tip.after(d);css();}
let FROM=null; /* where this stage was opened from: its world's page, or the Lab for the Fossil Stage (the Museum is inside the cave) */
function openStage(zid){const p=me();if(!p)return;FROM=zid==='fossil'?{s:'lab'}:{s:'zone',a:zid};
 if(zid!=='fossil'&&!legend(p,zid)){const lv=ticketLevels(p,zid);if(!lv.length)return;VIEW={k:'stages'};go('bp');pickStage(zid,lv[0],0,true);return;}
 VIEW={k:'stages'};go('bp');const pr=prog(p),c=Math.min(3,(pr.c[zid]||0)+1);pickStage(zid,c,c===3&&(pr.c[zid]||0)>=3?((pr.asc||{})[zid]||0)+1:0);}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:(s,arg)=>{if(s==='zone')try{zoneBtn(arg);}catch(e){}if(s==='world')syncTile();if(s!=='bp'){stopLoop();unlock();document.querySelectorAll('.bp2-over').forEach(x=>x.remove());try{if(window.BPScene)BPScene.stop();}catch(e){}}},session:()=>{G=null;VIEW={k:'stages'};syncTile();}});

/* ---------- Parent Corner: the play log ---------- */
function stats(p){const b=(p&&p.bp)||{},m=b.m||[];const w=m.filter(x=>x[2]).length,days=new Set(m.map(x=>new Date(x[0]*1000).toDateString())).size;
 const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;const asked=m.reduce((a,x)=>a+x[4],0),right=m.reduce((a,x)=>a+x[5],0);
 return {started:b.s||0,done:m.length,wins:w,days,mins:Math.round(m.reduce((a,x)=>a+x[3],0)/60),winSecs:avg(m.filter(x=>x[2]).map(x=>x[3])),houseLeft:avg(m.filter(x=>x[2]).map(x=>x[8])),asked,right,last:m.length?m[m.length-1][0]*1000:0,crowns:Object.values(prog(p).c).reduce((a,c)=>a+c,0),asc:Math.max(0,...Object.values(prog(p).asc||{})),trainer:m.filter(x=>x[12]).length};}
function logLine(p){const s=stats(p);if(!s.started&&!s.done)return 'Not played yet';
 return `${s.done} match${s.done===1?'':'es'} on ${s.days} day${s.days===1?'':'s'} (${s.mins} min) · won ${s.wins} of ${s.done}${s.done?` (${Math.round(s.wins/s.done*100)}%)`:''} · walked away from ${Math.max(0,s.started-s.done)} · 👑 ${s.crowns} crowns${s.asc?` · ✨ best Ascend ${s.asc}`:''}`+(s.wins?` · a win takes about ${s.winSecs}s with the Pet House at ${s.houseLeft}%`:'')+(s.asked?` · facts ${s.right}/${s.asked} right`:'')+(s.trainer?` · 🧑‍🏫 Trainer hired in ${s.trainer}`:'');}
function parentSection(){try{if(typeof state==='undefined'||!state.players)return '';const list=state.players.filter(p=>p.setup&&(p.bp||p.bp2));if(!list.length)return '';
 return `<div class="panel"><h3>🐾 Battle Pets (demo)</h3><p class="muted" style="margin-top:0">The Battle Cats-style demo on the village plaza. It feeds the pets (pet XP and snacks), not the coin purse. This log shows how much it is played and whether it is too easy.</p>
 ${list.map(p=>`<div style="margin:6px 0"><b>${esc(p.name)}</b><br><small class="muted">${esc(logLine(p))}</small></div>`).join('')}</div>`;}catch(e){return '';}}
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);

(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.bp=()=>screen();}else setTimeout(reg,30);})();
window.BattlePets={on,stats,stages,openStage,stageOpen,
 _pick:pickStage,_in:teamIn,_out:teamOut,_start:start,_send:i=>trySend(i),_kit:()=>{if(upgradeKitchen())draw();},_sound:soundOpen,_report:()=>{if(!G||G.over||!window.MQReport)return;G.paused=true;MQReport.open(()=>{if(G){G.paused=false;LAST=performance.now();}});},_soundDone:soundDone,_vol:setVol,_song:setSong,songId,_auto:()=>{const p=me();if(!p||VIEW.k!=='team')return;const S=stages().find(s=>s.id===VIEW.id);if(!S)return;VIEW.team=autoPick(p,S,VIEW.crown,VIEW.asc);try{SFX.tap();}catch(e){}screen();},_trainer:trainerToggle,_hire:hire,_mega:id=>{const p=me();if(!p||!MEGA[id])return;prog(p).mega=id;save();if(VIEW.k==='team')screen();},_flyFilter:()=>{if(VIEW.k!=='team')return;VIEW.fly=!VIEW.fly;screen();},_flyFix:()=>{document.querySelectorAll('#bpFlyW').forEach(x=>x.remove());if(VIEW.k==='team'){VIEW.fly=true;screen();}},_flyGo:()=>{document.querySelectorAll('#bpFlyW').forEach(x=>x.remove());VIEW.flyOk=true;start();},_fix:fixOpen,_fixDone:fixDone,_troll:()=>{if(callTroll())draw();},_cam:()=>{CAM_HOLD=0;camera();},_pounce:()=>{if(pounce())draw();else if(G&&!G.over&&G.charge>=100&&!G.foes.some(f=>!f.gone))topNote('No critters to pounce on yet!');},_key:key,_again:again,_lvl:(c,a)=>{if(VIEW.k!=='team')return;const t=VIEW.team.slice(),fl=VIEW.fly;pickStage(VIEW.id,c,a,VIEW.tk);if(VIEW.k==='team'){VIEW.team=t;VIEW.fly=fl;screen();}},_back:backTo,_leave:leave,_quit:quit,
 _say:()=>{try{if(G&&G.q)speakToggle(()=>say(speakable(qText(G.q)),.9));}catch(e){}},_sync:syncTile,
 _dbg:{tickets,ticketLevels,starsFor,STAR_T,arrow:u=>arrow(u),winChance,WINM,teamFeat,TRAINER_COST,TRAINER,trainer:()=>trainer(),TUNE,CROWN,TROLL,EAGLE,threats:()=>threats(),ascK,petSpd,flyRisk,autoPick,leadX:()=>leadX(),G:()=>G,newBattle,step,callTroll,_spawn:k=>spawn(k),send,answer,openFix,closeFix,canFix,pounce,upgradeKitchen,roleOf,powerOf,stages,makeQ,finish,sim:v=>{SIM=!!v;},view:()=>VIEW}};
})();
