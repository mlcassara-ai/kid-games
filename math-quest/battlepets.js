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
   - Math = 🧱 Rebuild. When the Pet House is down to half, the kid can open the Rebuild panel: every right answer lays one brick
     (+10% of the house). There are 20 bricks per battle, enough to rebuild the house twice from nothing. The battle keeps going.
   - Roles come from each pet's perk: shield = Wall (cheap, tough), power = Brawler (big hits, cracks armour), heal = Medic,
     lucky = Jumper (reaches flyers, lucky hits), xp = Archer (long range, reaches flyers), coins = Stomper (hits a whole group).
     Rarity and the pet's growth (Baby to Mighty, plus Mighty levels) make it stronger.
   - Critters have traits: swarm (many weak ones: Stompers), flying (only Jumpers and Archers reach them), armoured (Brawlers),
     speedy. When the den drops to half, the boss bursts out with a shockwave that knocks your pets back.
   - Crowns: each stage can be beaten at 1, 2 and 3 crowns (tougher critters, faster waves).
   - Math: the stage's own skill (Addition Forest = addition…) at the hero's own level; the Fossil Stage mixes skills.
   A wrong answer never takes anything away: it just doesn't lay a brick.
   - Keyboard: 1–5 send pets, K kitchen, Space pounce, R rebuild, arrows scroll; while rebuilding, type the answer and press Enter (Esc closes).
   SAVED: p.bp2 = {c:{stage: crowns beaten}, team:[pet ids]} and the play log p.bp (last 40 matches, for Parent Corner).
   Rewards feed the pets: pet XP for the team (a win gives more), and a snack the first time each crown is beaten.
   Uses Math Quest globals: P, state, save, go, topbar, toast, esc, SFX, tone, PETS, PET_TIERS, PERKS, petData, petStage, PET_STAGES, petLv,
   petGain, genQ, lvl, pickOpFair, ZONES, dayKey, say, speakable, speakToggle, voiceOn, W, SCREENS, curScreen, MQ_HOOKS, MQ_PARENT. */
(function(){
'use strict';
const BP_X=28,BP_Y=20,LOG_MAX=40,DEN_X=6,HOUSE_X=94,MAX_OUT=12;
const me=()=>{try{return P();}catch(e){return null;}};
const on=p=>window.MQ_BP_BETA!==false&&!!p&&!!p.setup; /* demo access: every hero */
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const choose=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- roles (from the pet's perk) ---------- */
const ROLE={
 shield:{id:'wall',n:'Wall',e:'🛡️',cost:2,cd:2.5,hp:70,atk:3,rng:5,spd:5,tip:'Cheap and tough: holds the line'},
 power:{id:'brawler',n:'Brawler',e:'💥',cost:6,cd:7,hp:45,atk:15,rng:6,spd:4,armor:2,tip:'Big hits; cracks armour'},
 heal:{id:'medic',n:'Medic',e:'💚',cost:4,cd:8,hp:30,atk:2,rng:5,spd:4.5,heal:3,tip:'Heals pets nearby'},
 lucky:{id:'jumper',n:'Jumper',e:'🦘',cost:3,cd:4,hp:28,atk:7,rng:6,spd:7,fly:true,crit:.25,tip:'Fast; reaches flyers; lucky hits'},
 xp:{id:'archer',n:'Archer',e:'🏹',cost:4,cd:5,hp:22,atk:6,rng:20,spd:4,fly:true,tip:'Long range; reaches flyers'},
 coins:{id:'stomper',n:'Stomper',e:'🌀',cost:5,cd:6,hp:40,atk:6,rng:9,spd:3.5,area:true,tip:'Hits a whole group'}};
const roleOf=pet=>ROLE[pet&&pet.perk]||ROLE.shield;
/* 🧌 the mega: Grumbleroot the Troll (testing: every hero, every crown; how to earn him is still to be decided).
   Huge, slow and tough; hits a whole group, cracks armour, and every few seconds STOMPS, knocking nearby critters back.
   Can't reach flyers. Stays about 28 seconds, then stomps home. A big wait: 40 s before the first call, 100 s between calls. */
const TROLL={id:'troll',n:'Grumbleroot',e:'🧌',cost:16,first:40,cd:100,life:28,hp:500,atk:30,rng:8,spd:5.5,area:true,armor:2,stomp:2.6,tip:'Mega troll: huge, stomps critters back'};
function powerOf(p,pet){const pd=petData(p,pet.id),st=petStage(pd),si=Math.max(0,PET_STAGES.indexOf(st));const tm=((typeof PET_TIERS!=='undefined'&&PET_TIERS[pet.tier])||{mult:1}).mult||1;
 let ml=0;try{ml=petLv(pd)||0;}catch(e){}return Math.min(2.6,tm*(1+.2*si+.04*ml));}

/* ---------- critters ---------- */
const TRAIT={
 basic:{hp:30,atk:5,spd:4,rng:5},
 swarm:{hp:10,atk:2,spd:6,rng:4,group:3,tag:'swarm'},
 flying:{hp:24,atk:4,spd:5,rng:5,fly:true,tag:'flying'},
 armored:{hp:70,atk:6,spd:2.5,rng:5,armor:true,tag:'armoured'},
 speedy:{hp:18,atk:4,spd:9,rng:4,tag:'speedy'},
 boss:{hp:420,atk:14,spd:2.2,rng:7,boss:true,tag:'boss'}};
const TRAIT_ORDER=['basic','swarm','flying','armored','speedy'];
const OPN={add:'Addition',sub:'Subtraction',mul:'Multiplication',div:'Division'};
function stages(){const out=[{id:'fossil',name:'Fossil Stage',art:'🦴',op:null,bg:['#efe3c8','#d8c49b'],where:'the Museum, when every dinosaur skeleton is built',
  crit:[['Bone Rattler','🦴','basic'],['Raptor Bones','🦖','swarm'],['Pterosaur Bones','🦅','flying'],['Neck Bones','🦕','armored'],['Speedy Skull','💀','speedy']],boss:['T. rex Skeleton','🦖'],
  note:'Pretend! Real skeletons don\'t walk. Real fossils are bones turned to stone over millions of years.'}];
 (typeof ZONES!=='undefined'?ZONES:[]).forEach(z=>{if(!OPN[z.op]||out.some(s=>s.op===z.op)||!z.mons||z.mons.length<6)return;
  out.push({id:z.id,name:z.name,art:z.art||'⭐',op:z.op,where:`${z.name}, after beating ${z.mons[5][0]}`,bg:{add:['#d8f5c9','#a6dc8a'],sub:['#d9d2f0','#a99fd1'],mul:['#ffd8b8','#f0a070'],div:['#dfe3ea','#aab3c2']}[z.op],
   crit:z.mons.slice(0,5).map((m,i)=>[m[0],m[1],TRAIT_ORDER[i]]),boss:z.mons[5]});});
 return out;}
const CROWN={hp:[1,1.6,2.1],atk:[1,1.3,1.44],gap:[1,.85,.72],den:[1,1.1,1.25]};
/* balance knobs, tuned by simulation (Oct 2026) against Battle Cats-style targets and players like the two real kids:
   - doing nothing always loses; crown 1 is a sure win in about 1.5 minutes; crown 2 is a close fight of about 4 minutes in which
     the Pet House usually gets badly hurt, so 🧱 Rebuild matters (a grade-3 player: about 40% without math, 80% with it);
     crown 3 is a stretch goal (a grade-5 player about 1 in 3).
   - treats trickle in (the Kitchen adds more), Pounce charges in about 30 s, the boss is the big push (hits pets and the house hard),
     critters spawn faster while the boss is out and slower once it is down; after 4 minutes they tire (no endless tug-of-war).
   - bricks: 13 per battle, each +2/13 of the house = exactly two full rebuilds. */
const TUNE={trickle:.81,trickleKl:.2,charge:3.3,den:545,hp:1.4,atk:1.45,gap:4.2,bricks:13,brick:2/13,repairAt:.5,house:280,siege:.55,foeCap:11,
 petHp:1,bossHp:1.07,bossAtk:2.19,bossSiege:1.71,rage:.82,calm:2.5,tired:240};

/* ---------- saved progress ---------- */
function prog(p){p.bp2=p.bp2||{c:{},team:[]};p.bp2.c=p.bp2.c||{};if(!Array.isArray(p.bp2.team))p.bp2.team=[];return p.bp2;}
const slots=p=>Math.min(5,3+Math.floor((p.level||1)/10));
function available(p){return (p.pets||[]).filter(id=>!(window.Adv&&Adv.away&&Adv.away(p,id))&&!(window.PetCare&&PetCare.rescued&&PetCare.rescued(p,id))).map(id=>PETS.find(x=>x.id===id)).filter(Boolean);}

/* ---------- questions: the stage's skill at the hero's own level ---------- */
const plainQ=q=>!!q&&!q.tpl&&!q.rev&&typeof q.answer==='number'&&isFinite(q.answer)&&q.answer>=0&&Math.round(q.answer*100)===q.answer*100;
function makeQ(p,op){for(let k=0;k<25;k++){let o=op;try{if(!o)o=pickOpFair(p);}catch(e){o='add';}let L=1;try{L=Math.max(1,lvl(p,o)||1);}catch(e){}
  let q=null;try{q=genQ(o,Math.min(L,20));}catch(e){q=null;}if(plainQ(q))return q;}
 const a=rint(1,9),b=rint(1,9);return {text:`${a} + ${b}`,answer:a+b};}
const qText=q=>q.prompt?String(q.prompt):`${q.text} = ?`;

/* ================= the battle engine (pure state; the screen only draws it) ================= */
let G=null,SIM=false;
function newBattle(p,stage,crown,team){const c=crown-1;
 G={t:0,stage,crown,c,treats:4,kl:0,charge:0,streak:0,bricks:TUNE.bricks,fixing:false,trollAt:TROLL.first,trolls:0,house:100,den:100,denMax:TUNE.den*CROWN.den[c],houseMax:TUNE.house,pets:[],foes:[],spawnAt:4,gap:TUNE.gap*CROWN.gap[c],boss:false,bossDown:false,over:false,win:false,
  team:team.map(pet=>{const R=roleOf(pet),m=powerOf(p,pet);return {pet,R,m,ready:0};}),asked:0,right:0,sent:0,pounces:0,q:null,inp:'',fx:[]};
 G.denHP=G.denMax;G.houseHP=G.houseMax;return G;}
const treatCap=()=>12+6*G.kl,treatRate=()=>TUNE.trickle+TUNE.trickleKl*G.kl,kitchenCost=()=>8+6*G.kl;
function upgradeKitchen(){if(!G||G.over||G.kl>=4||G.treats<kitchenCost())return false;G.treats-=kitchenCost();G.kl++;G.treats=Math.min(G.treats,treatCap());fx('kitchen');return true;}
function send(i){const s=G&&!G.over&&G.team[i];if(!s||G.treats<s.R.cost||s.ready>G.t||G.pets.filter(x=>!x.gone&&!x.mega).length>=MAX_OUT)return false;
 G.treats-=s.R.cost;s.ready=G.t+s.R.cd;G.sent++;const R=s.R,m=s.m;
 G.pets.push({side:'p',pet:s.pet,R,x:HOUSE_X-2,hp:R.hp*m*TUNE.petHp,max:R.hp*m*TUNE.petHp,atk:R.atk*m,rng:R.rng,spd:R.spd,kb:0,stun:0,id:Math.random()});fx('send');return true;}
const trollOut=()=>!!G&&G.pets.some(u=>u.mega&&!u.gone);
function callTroll(){if(!G||G.over||G.t<G.trollAt||G.treats<TROLL.cost||trollOut())return false;G.treats-=TROLL.cost;G.trollAt=G.t+TROLL.cd;G.trolls++;
 const m=1+.35*G.c;G.pets.push({side:'p',mega:true,pet:{id:'troll',e:TROLL.e,name:TROLL.n},R:TROLL,x:HOUSE_X-2,hp:TROLL.hp*m,max:TROLL.hp*m,atk:TROLL.atk*m,rng:TROLL.rng,spd:TROLL.spd,kb:0,stun:0,leave:G.t+TROLL.life,stompAt:0,id:Math.random()});fx('troll');return true;}
/* every push in the battle goes through here, so the screen can show the flight (the troll is hard to move) */
function knock(u,dx){if(u.mega)dx*=.4;u.x=Math.max(DEN_X+2,Math.min(HOUSE_X-2,u.x+dx));u.kbT=G.t;}
/* 🧱 Rebuild: math mends the Pet House, from half health down, with a limited pile of bricks */
const canFix=()=>!!G&&!G.over&&G.bricks>0&&G.houseHP<=G.houseMax*TUNE.repairAt;
function openFix(){if(!G||G.over||G.fixing||!canFix())return false;G.fixing=true;return true;}
function closeFix(){if(G)G.fixing=false;}
function answer(ok){if(!G||G.over||!G.fixing||G.bricks<=0)return 0;G.asked++;if(!ok){G.streak=0;return 0;}
 G.right++;G.streak++;G.bricks--;const add=Math.min(G.houseMax-G.houseHP,G.houseMax*TUNE.brick);G.houseHP+=add;fx('brick');
 if(G.bricks<=0||G.houseHP>=G.houseMax-.01)G.fixing=false;return add;}
function pounce(){if(!G||G.over||G.charge<100)return false;G.charge=0;G.pounces++;G.foes.forEach(f=>{if(f.gone)return;knock(f,-(f.boss?6:12));f.hp-=f.boss?60:25;f.stun=G.t+1.2;});fx('pounce');return true;}
function spawn(kind){const S=G.stage,c=G.c;let def,name,e;
 if(kind==='boss'){def=TRAIT.boss;name=S.boss[0];e=S.boss[1];}else{const pick=S.crit.find(x=>x[2]===kind)||S.crit[0];def=TRAIT[pick[2]];name=pick[0];e=pick[1];}
 const n=def.group||1,bh=def.boss?TUNE.bossHp:1,ba=def.boss?TUNE.bossAtk:1;for(let i=0;i<n;i++)G.foes.push({side:'c',name,e,trait:def.tag||'',x:DEN_X+2+i*2.5,hp:def.hp*CROWN.hp[c]*TUNE.hp*bh,max:def.hp*CROWN.hp[c]*TUNE.hp*bh,atk:def.atk*CROWN.atk[c]*TUNE.atk*ba,rng:def.rng,spd:def.spd*(1+.08*c),fly:!!def.fly,armor:!!def.armor,boss:!!def.boss,kb:0,stun:0,id:Math.random()});}
function nextKind(){const t=G.t,w={basic:4,swarm:t>8?2:0,speedy:t>15?2:0,flying:t>20?2:0,armored:t>30?2:0};const tot=Object.values(w).reduce((a,b)=>a+b,0);let r=Math.random()*tot;for(const k in w){r-=w[k];if(r<=0)return k;}return 'basic';}
function step(dt){if(!G||G.over)return;G.t+=dt;
 G.treats=Math.min(treatCap(),G.treats+treatRate()*dt);G.charge=Math.min(100,G.charge+TUNE.charge*dt);
 if(G.t>=G.spawnAt&&G.foes.filter(f=>!f.gone).length<TUNE.foeCap){spawn(nextKind());G.gap=Math.max(1.6,G.gap*.97);G.spawnAt=G.t+G.gap*(G.boss&&!G.bossDown?TUNE.rage:G.bossDown?TUNE.calm:1)*(G.t>TUNE.tired?1.7:1)*(.8+Math.random()*.4);} /* after 4 minutes the critters get sleepy, so no battle drags on forever */
 if(!G.tiredSaid&&G.t>TUNE.tired){G.tiredSaid=true;fx('tired');}
 if(!G.boss&&G.denHP<=G.denMax*.5){G.boss=true;spawn('boss');G.pets.forEach(p=>{if(p.gone)return;knock(p,12);p.stun=G.t+.8;});fx('boss');} /* the boss's shockwave */
 const pets=G.pets.filter(x=>!x.gone),foes=G.foes.filter(x=>!x.gone);
 G.pets.forEach(u=>{u.fight=false;});G.foes.forEach(f=>{f.fight=false;});
 pets.forEach(u=>{if(u.mega&&G.t>=u.leave){u.gone=true;u.left=true;fx('trollbye');return;}if(u.stun>G.t)return;u.mv=false;const R=u.R;const reach=f=>(!f.fly||R.fly)&&u.x-f.x>=-1&&u.x-f.x<=u.rng;const tg=foes.filter(reach);
  if(tg.length){const hit=R.area?tg:[tg.reduce((a,b)=>b.x>a.x?b:a)];u.fight=true;hit.forEach(f=>{let d=u.atk*dt;if(f.armor)d*=R.armor?R.armor:.5;if(R.crit&&Math.random()<R.crit*dt*3)d+=u.atk*.6;f.hp-=d;});
   if(Math.random()<.18*dt)knock(hit[0],-(1.5+Math.random()*1.5)*(hit[0].boss?.3:1)); /* now and then a hit shoves the critter back a little */
   if(u.mega&&G.t>=u.stompAt){u.stompAt=G.t+R.stomp;foes.forEach(f=>{if(Math.abs(u.x-f.x)<=u.rng+4){knock(f,-(f.boss?1.5:4));f.stun=G.t+.5;}});fx('stomp');}}
  else if(u.x-DEN_X<=u.rng){u.fight=true;G.denHP-=u.atk*dt*(G.bossDown||!G.boss?1:.5)*(G.t>TUNE.tired?1.6:1);}
  else{u.x-=u.spd*.8*dt;u.mv=true;}
  if(R.heal)pets.forEach(o=>{if(o!==u&&Math.abs(o.x-u.x)<10&&o.hp<o.max)o.hp=Math.min(o.max,o.hp+R.heal*u.atk/2*dt);});});
 foes.forEach(f=>{if(f.stun>G.t)return;f.mv=false;const tg=pets.filter(u=>u.x-f.x>=-1&&u.x-f.x<=f.rng);
  if(tg.length){const u=tg.reduce((a,b)=>b.x<a.x?b:a);u.hp-=f.atk*dt;f.fight=true;if(Math.random()<.18*dt)knock(u,1.5+Math.random()*1.5);if(f.boss&&G.t>=(G.bossShake||0)){G.bossShake=G.t+1.4;fx('bossHit');}}
  else if(HOUSE_X-f.x<=f.rng&&(f.fight=true))G.houseHP-=f.atk*(f.boss?TUNE.bossSiege:TUNE.siege)*dt;
  else{f.x+=f.spd*.8*dt;f.mv=true;}});
 /* knock-back each time a unit loses another third of its health */
 const bump=(u,dir)=>{const k=Math.floor((1-u.hp/u.max)*3);if(u.hp<=0||k<=u.kb)return;u.kb=k;u.stun=G.t+.4;knock(u,dir*(u.boss||u.mega?2:5));};
 pets.forEach(u=>bump(u,1));foes.forEach(f=>bump(f,-1));
 G.foes.forEach(f=>{if(!f.gone&&f.hp<=0){f.gone=true;if(f.boss){G.bossDown=true;fx('bossdown');}else fx('poof');}});
 G.pets.forEach(u=>{if(!u.gone&&u.hp<=0){u.gone=true;fx('sleepy');}});
 /* last stand: the first time a base drops to 25%, every attacker near it is thrown 50–90% of the way back home (once per base) */
 if(!G.lsH&&G.houseHP>0&&G.houseHP<=G.houseMax*.25){G.lsH=true;G.foes.forEach(f=>{if(f.gone)return;knock(f,-(f.x-DEN_X-2)*(.5+Math.random()*.4));f.stun=G.t+1;});fx('standH');}
 if(!G.lsD&&G.denHP>0&&G.denHP<=G.denMax*.25){G.lsD=true;G.pets.forEach(u=>{if(u.gone)return;knock(u,(HOUSE_X-2-u.x)*(.5+Math.random()*.4));u.stun=G.t+1;});fx('standD');}
 if(G.denHP<=0){G.denHP=0;G.over=true;G.win=true;}else if(G.houseHP<=0){G.houseHP=0;G.over=true;G.win=false;}}
function fx(k){if(SIM||!G)return;G.fx.push(k);}

/* ================= the screens ================= */
let VIEW={k:'stages'},RAF=0,LAST=0;
function css(){if(document.getElementById('bp2CSS'))return;const s=document.createElement('style');s.id='bp2CSS';s.textContent=`
.bp2{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:10px}.bp2.wide{max-width:1180px}
.bp2-card{background:#fff;border-radius:18px;padding:12px 14px;box-shadow:0 6px 16px rgba(0,0,0,.15)}
.bp2-stage{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.bp2-stage .e{font-size:40px}.bp2-stage b{font-size:19px;display:block}.bp2-stage small{color:#6b6490}
.bp2-crowns{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}.bp2-crowns button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:8px 10px;background:#f1ecff;color:#2b2340;min-height:44px;cursor:pointer}
.bp2-crowns button.done{background:#d3f9d8}.bp2-crowns button:disabled{opacity:.45;cursor:default}
.bp2-pets{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.bp2-pet{font:inherit;border:3px solid #e9e4ff;background:#fff;border-radius:14px;padding:8px 4px;text-align:center;cursor:pointer;color:#2b2340}
.bp2-pet.in{border-color:#40c057;background:#ebfbee}.bp2-pet .pe{font-size:32px;display:block}.bp2-pet small{display:block;color:#6b6490;font-size:12px}
.bp2-slots{display:flex;gap:8px;flex-wrap:wrap}.bp2-slot{font:inherit;width:72px;height:72px;border-radius:14px;border:3px dashed #b197fc;background:#f8f5ff;font-size:34px;cursor:pointer}
.bp2-slot.full{border-style:solid;border-color:#40c057;background:#ebfbee}
.bp2-hud{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px}.bp2-bar{flex:1;height:12px;background:#eee;border-radius:6px;overflow:hidden}.bp2-bar i{display:block;height:100%}
.bp2-scroll{overflow-x:auto;overflow-y:hidden;border-radius:16px;border:3px solid #2b2340;-webkit-overflow-scrolling:touch;cursor:grab;touch-action:pan-x;scrollbar-width:thin;overscroll-behavior-x:contain}
.bp2-scroll.drag{cursor:grabbing}.bp2-scroll.drag *{user-select:none}
.bp2-field{position:relative;height:clamp(260px,46vh,420px);width:2200px;overflow:hidden}
.bp2-mini{position:relative;height:18px;background:#e9e4ff;border-radius:9px;cursor:pointer;overflow:hidden}.bp2-mini .vw{position:absolute;top:0;bottom:0;border:2px solid #7048e8;border-radius:9px;background:rgba(112,72,232,.12)}
.bp2-mini i{position:absolute;top:5px;width:8px;height:8px;border-radius:50%;margin-left:-4px}.bp2-mini i.p{background:#2f9e44}.bp2-mini i.c{background:#e8590c}.bp2-mini i.b{background:#c92a2a;width:12px;height:12px;top:3px;margin-left:-6px}
.bp2-fix{border:3px solid #f08c00;background:#fff9db}.bp2-btn.fix{background:#e8590c}.bp2-btn.fix.hot{animation:bp2pulse .8s ease-in-out infinite}@keyframes bp2pulse{50%{transform:scale(1.08);box-shadow:0 0 0 6px rgba(232,89,12,.3)}}
.bp2-bricks{letter-spacing:1px;font-size:15px}.bp2-key{display:inline-block;font-size:10px;font-weight:800;background:#2b2340;color:#fff;border-radius:5px;padding:0 4px;margin-left:3px;vertical-align:middle}
.bp2-flash{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);font-size:26px;font-weight:900;color:#fff;text-shadow:0 2px 6px #000;pointer-events:none;animation:bp2fl 1.6s ease-out forwards;white-space:nowrap}@keyframes bp2fl{0%{opacity:0;transform:translate(-50%,-30%) scale(.7)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}80%{opacity:1}100%{opacity:0}}
@media (hover:none){.bp2-key{display:none}}
.bp2-ent.fight.pet .e{animation:bp2lungeL .5s ease-in-out infinite}.bp2-ent.fight.foe .e{animation:bp2lungeR .5s ease-in-out infinite}
@keyframes bp2lungeL{0%,100%{translate:0 0}30%{translate:-8px -5px}45%{translate:-11px 0}}@keyframes bp2lungeR{0%,100%{translate:0 0}30%{translate:8px -5px}45%{translate:11px 0}}
.bp2-ent.hurt .e{filter:brightness(2.4) saturate(.2)}
.bp2-ent.kb{transition:left .38s cubic-bezier(.2,.7,.3,1)}.bp2-ent.kb .e{animation:bp2arc .42s ease-out}
@keyframes bp2arc{0%{translate:0 0;rotate:0deg}45%{translate:0 -22px;rotate:-14deg}100%{translate:0 0;rotate:0deg}}
.bp2-ent.mega .e{font-size:92px}.bp2-ent.mega .hb{width:70px;height:6px}.bp2-ent.mega .hb i{background:#7048e8}
.bp2-ent.boss .hb{width:64px;height:6px}
.bp2-pt{position:absolute;bottom:24px;pointer-events:none;transform:translateX(-50%);z-index:3}
.bp2-pt.dust{width:20px;height:20px;border-radius:50%;background:rgba(150,120,80,.55);animation:bp2dust .65s ease-out forwards}
.bp2-pt.poof{width:40px;height:40px;border-radius:50%;background:rgba(200,200,210,.85);box-shadow:14px -6px 0 -4px rgba(200,200,210,.8),-14px -4px 0 -6px rgba(200,200,210,.8);animation:bp2poof .7s ease-out forwards}
.bp2-pt.star{font-size:24px;bottom:40px;animation:bp2pop .4s ease-out forwards}
.bp2-pt.ring{width:40px;height:14px;border-radius:50%;border:4px solid rgba(120,90,50,.7);bottom:18px;animation:bp2ring .55s ease-out forwards}
@keyframes bp2dust{0%{opacity:.85;scale:.4;translate:0 0}100%{opacity:0;scale:1.9;translate:var(--dx,0px) -16px}}
@keyframes bp2poof{0%{opacity:1;scale:.3}100%{opacity:0;scale:1.6;translate:0 -20px}}
@keyframes bp2pop{0%{opacity:0;scale:.3}30%{opacity:1;scale:1.2}100%{opacity:0;scale:.9;translate:0 -14px}}
@keyframes bp2ring{0%{opacity:1;scale:.5}100%{opacity:0;scale:7}}
.bp2-scroll.shake{animation:bp2shake .32s linear}@keyframes bp2shake{20%{translate:-5px 2px}40%{translate:5px -2px}60%{translate:-4px 1px}80%{translate:3px 0}}
.bp2-tc.mega{border-color:#7048e8;background:linear-gradient(#f3f0ff,#e5dbff)}.bp2-tc.mega .pe{font-size:34px}.bp2-team.six{grid-template-columns:repeat(6,1fr)}
.bp2-ent{position:absolute;bottom:28px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none;transition:opacity .4s;z-index:2}.bp2-ent.mega{z-index:1}
.bp2-ent .e{font-size:40px;line-height:1;display:inline-block}.bp2-ent.foe .e{transform:scaleX(-1)}.bp2-ent.boss .e{font-size:76px}.bp2-ent.fly{bottom:46%}
.bp2-ent .hb{width:36px;height:4px;border-radius:2px;background:rgba(0,0,0,.2);margin-bottom:2px;overflow:hidden}.bp2-ent .hb i{display:block;height:100%;background:#40c057}.bp2-ent.foe .hb i{background:#e8590c}
.bp2-ent.walk .e{animation:bp2hop .45s ease-in-out infinite}@keyframes bp2hop{50%{translate:0 -6px}}
.bp2-ent .tag{font-size:10px;font-weight:700;background:rgba(255,255,255,.8);border-radius:6px;padding:0 4px;margin-top:1px}
.bp2-base{position:absolute;bottom:20px;font-size:72px;transform:translateX(-50%);transition:filter .3s}
.bp2-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.bp2-meter{flex:1;min-width:160px;height:22px;background:#fff3bf;border-radius:11px;overflow:hidden;position:relative;border:2px solid #f2b705}.bp2-meter i{display:block;height:100%;background:#f2b705}.bp2-meter span{position:absolute;inset:0;text-align:center;font-weight:800;font-size:13px;line-height:18px}
.bp2-btn{font:inherit;font-weight:800;border:0;border-radius:12px;padding:8px 12px;min-height:44px;cursor:pointer;background:#7048e8;color:#fff}.bp2-btn:disabled{opacity:.45;cursor:default}.bp2-btn.gold{background:#f08c00}
.bp2-team{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.bp2-tc{font:inherit;position:relative;border:3px solid #d0bfff;border-radius:14px;background:#fff;min-height:84px;padding:4px 2px;cursor:pointer;color:#2b2340;overflow:hidden}
.bp2-tc .pe{font-size:30px;display:block}.bp2-tc small{display:block;font-size:11px;font-weight:700}.bp2-tc .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(43,35,64,.35)}.bp2-tc.poor{opacity:.55}
.bp2-q{display:flex;align-items:center;justify-content:center;gap:10px;font-size:28px;font-weight:800;flex-wrap:wrap}.bp2-q .box{min-width:90px;border:3px dashed #b197fc;border-radius:12px;text-align:center;background:#f8f5ff;padding:0 8px}
.bp2-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}.bp2-pad button{font:inherit;font-size:22px;font-weight:800;border:0;border-radius:12px;background:#f1ecff;color:#2b2340;min-height:48px;cursor:pointer}.bp2-pad button.go{background:#40c057;color:#fff}
.bp2-msg{text-align:center;font-weight:700;min-height:22px}
.bp2-over{position:fixed;inset:0;background:rgba(20,15,40,.6);display:grid;place-items:center;z-index:50;padding:16px}.bp2-over .bp2-card{max-width:380px;text-align:center}`;document.head.appendChild(s);}
const head=(t,back)=>((typeof topbar==='function')?topbar():'')+`<div class="page"><div class="zhead"><button class="btn ghost small backbtn" onclick="${back}">← ${back.includes('world')?'Village':'Back'}</button><h2 class="title">${t}</h2></div>`;
function screen(){stopLoop();const p=me();if(!p||!on(p)){go('world');return;}css();
 if(VIEW.k==='team')return teamView(p);if(VIEW.k==='fight'&&G)return fightView(p);VIEW={k:'stages'};stageView(p);}
function stageView(p){const pr=prog(p),S=stages();
 app.innerHTML=head('🐾 Battle Pets <small style="font-size:13px;font-weight:600">demo</small>',"go('world')")+`<div class="bp2">
  <div class="bp2-card"><b>How to play:</b> send your pets to knock down the critter den before the critters reach your Pet House. <b>Treats</b> come in by themselves: spend them to send pets, or on the <b>🍳 Treat Kitchen</b> to earn them faster. <b>🐾 Pet Pounce</b> charges up over time. When the critters smash your Pet House below half, tap <b>🧱 Rebuild</b> and answer math: every right answer lays a brick. You have enough bricks to rebuild the whole house twice!<br><small class="muted">Swipe or drag the battlefield to look around. On a computer: 1–5 send pets, T troll, K kitchen, Space pounce, R rebuild, ← → scroll.<br>🧌 <b>Mega: ${TROLL.n} the Troll</b> stomps in when you need him most, but he takes a long time to come back.</small><br><small class="muted">Demo: in the full game each stage is a hidden bonus level you unlock.</small></div>
  ${S.map(s=>{const done=pr.c[s.id]||0;return `<div class="bp2-card bp2-stage"><span class="e">${s.art}</span><span><b>${esc(s.name)}</b><small>${s.op?OPN[s.op]+' at your level':'Mixed math at your level'} · boss: ${s.boss[1]} ${esc(s.boss[0])}<br>Full game: opens in ${esc(s.where)}</small></span>
   <span class="bp2-crowns">${[1,2,3].map(c=>`<button class="${done>=c?'done':''}" ${c>done+1?'disabled':''} onclick="BattlePets._pick('${s.id}',${c})">${'👑'.repeat(c)}${done>=c?' ✓':''}</button>`).join('')}</span></div>`;}).join('')}</div></div>`;}
function pickStage(id,crown){const p=me();if(!p)return;const pr=prog(p);if(crown>(pr.c[id]||0)+1)return;VIEW={k:'team',id,crown};
 const av=available(p).map(x=>x.id);let team=pr.team.filter(x=>av.includes(x)).slice(0,slots(p));
 if(!team.length)team=available(p).sort((a,b)=>powerOf(p,b)-powerOf(p,a)).slice(0,slots(p)).map(x=>x.id);VIEW.team=team;screen();}
function teamView(p){const S=stages().find(s=>s.id===VIEW.id);if(!S){VIEW={k:'stages'};return screen();}const av=available(p),n=slots(p),team=VIEW.team;
 app.innerHTML=head(`${S.art} ${esc(S.name)} ${'👑'.repeat(VIEW.crown)}`,"BattlePets._back()")+`<div class="bp2"><div class="bp2-card"><b>Build your team</b> (up to ${n}). Tap a pet to add it, tap a team spot to take it out.
  <div class="muted" style="font-size:13px;margin:4px 0 8px">Critters here: ${S.crit.map(c=>`${c[1]} ${esc(c[0])} <i>(${TRAIT[c[2]].tag||'plain'})</i>`).join(' · ')}</div>
  <div class="bp2-slots">${Array.from({length:n},(_,i)=>{const id=team[i],pet=id&&PETS.find(x=>x.id===id);return `<button class="bp2-slot ${pet?'full':''}" onclick="BattlePets._out(${i})" aria-label="${pet?'Take '+esc(pet.name)+' out':'Empty spot'}">${pet?pet.e:''}</button>`;}).join('')}
  <button class="bp2-btn gold" style="margin-left:auto" ${team.length?'':'disabled'} onclick="BattlePets._start()">Start! ▶</button></div></div>
  <div class="bp2-card"><div class="bp2-pets">${av.map(pet=>{const R=roleOf(pet),inT=team.includes(pet.id);return `<button class="bp2-pet ${inT?'in':''}" onclick="BattlePets._in('${pet.id}')"><span class="pe">${pet.e}</span><b>${esc(pet.name)}</b><small>${R.e} ${R.n} · 🍖 ${R.cost}</small><small>Power ${powerOf(p,pet).toFixed(1)}×</small><small>${esc(R.tip)}</small></button>`;}).join('')||'<p>You have no pets at home right now. Pets at camp or the Pet Rescue can\'t battle.</p>'}</div></div></div></div>`;}
function teamIn(id){const p=me();if(!p||VIEW.k!=='team')return;const t=VIEW.team;if(t.includes(id)){t.splice(t.indexOf(id),1);}else if(t.length<slots(p))t.push(id);else{toast('Your team is full. Tap a team spot to take a pet out first.');return;}screen();}
function teamOut(i){if(VIEW.k!=='team')return;VIEW.team.splice(i,1);screen();}
function start(){const p=me();if(!p||VIEW.k!=='team'||!VIEW.team.length)return;const S=stages().find(s=>s.id===VIEW.id);const team=VIEW.team.map(id=>PETS.find(x=>x.id===id)).filter(Boolean);
 prog(p).team=VIEW.team.slice();const b=p.bp=p.bp||{s:0,m:[]};b.s=(b.s||0)+1;save();
 newBattle(p,S,VIEW.crown,team);G.q=makeQ(p,S.op);VIEW={k:'fight',id:S.id,crown:G.crown};screen();}
function fightView(p){const S=G.stage;
 app.innerHTML=head(`${S.art} ${esc(S.name)} ${'👑'.repeat(G.crown)}`,"BattlePets._quit()")+`<div class="bp2 wide">
  <div class="bp2-hud"><span>🏚️</span><div class="bp2-bar"><i id="bpDen" style="background:#e8590c"></i></div><span id="bpT" style="min-width:48px;text-align:center"></span><div class="bp2-bar"><i id="bpHouse" style="background:#40c057"></i></div><span>🏡</span></div>
  <div class="bp2-scroll" id="bpScroll"><div class="bp2-field" id="bpField" style="background:linear-gradient(#cfeeff 0 48%,${S.bg[0]} 48% 82%,${S.bg[1]} 82%)"><span class="bp2-base" id="bpDenB" style="left:${DEN_X}%">🏚️</span><span class="bp2-base" id="bpHouseB" style="left:${HOUSE_X}%">🏡</span></div></div>
  <div class="bp2-mini" id="bpMini" aria-label="Map of the battlefield: tap to look there"><span class="vw" id="bpVw"></span></div>
  <div class="bp2-row"><div class="bp2-meter"><i id="bpTreat"></i><span id="bpTreatT"></span></div><button class="bp2-btn" id="bpKit" onclick="BattlePets._kit()"></button><button class="bp2-btn gold" id="bpPounce" onclick="BattlePets._pounce()"></button><button class="bp2-btn fix" id="bpFix" onclick="BattlePets._fix()"></button></div>
  <div class="bp2-team six">${G.team.map((s,i)=>`<button class="bp2-tc" id="bpTc${i}" onclick="BattlePets._send(${i})"><span class="pe">${s.pet.e}</span><small>${s.R.e} ${s.R.n}<span class="bp2-key">${i+1}</span></small><small>🍖 ${s.R.cost}</small><span class="cd" id="bpCd${i}"></span></button>`).join('')}
   <button class="bp2-tc mega" id="bpTroll" onclick="BattlePets._troll()" aria-label="Call ${TROLL.n} the Troll"><span class="pe">${TROLL.e}</span><small>MEGA<span class="bp2-key">T</span></small><small>🍖 ${TROLL.cost}</small><span class="cd" id="bpTrollCd"></span></button></div>
  <div class="bp2-card bp2-fix" id="bpFixP" style="display:none"><div class="bp2-row" style="justify-content:space-between"><b>🧱 Rebuild the Pet House</b><span class="bp2-bricks" id="bpBricks"></span><button class="btn small ghost dark" onclick="BattlePets._fixDone()">Done <span class="bp2-key">Esc</span></button></div>
   <div class="bp2-q"><span id="bpQ"></span><span class="box" id="bpIn">&nbsp;</span><button class="btn small ghost dark" onclick="BattlePets._say()" aria-label="Read it to me">🔊</button></div><div class="bp2-msg" id="bpMsg"></div>
   <div class="bp2-pad">${['1','2','3','4','5','6','7','8','9','0','.','⌫'].map(k=>`<button onclick="BattlePets._key('${k}')">${k}</button>`).join('')}<button class="go" style="grid-column:1/-1" onclick="BattlePets._key('go')">✓ Check <span class="bp2-key">Enter</span></button></div></div>
  ${S.note?`<p class="muted" style="font-size:12px;margin:0">${esc(S.note)}</p>`:''}</div></div>`;
 const sc=document.getElementById('bpScroll');sc.scrollLeft=sc.scrollWidth;panSetup(sc);
 document.getElementById('bpMini').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();lookAt((e.clientX-r.left)/r.width*100);});
 G.shown=false;draw();startLoop();}
/* looking around the wide battlefield: swipe (touch scrolls natively), drag with the mouse, the mouse wheel, the arrow keys or the little map */
/* the camera glides to where the two sides meet; when the kid looks around by hand it waits 5 seconds, then glides back */
let CAM_HOLD=0;const holdCam=()=>{CAM_HOLD=performance.now()+5000;};
function camera(){const sc=document.getElementById('bpScroll');if(!sc||!G||performance.now()<CAM_HOLD)return;const x=frontX();
 const tgt=Math.max(0,Math.min(sc.scrollWidth-sc.clientWidth,x/100*sc.scrollWidth-sc.clientWidth/2)),d=tgt-sc.scrollLeft;if(Math.abs(d)>3)sc.scrollLeft+=Math.sign(d)*Math.max(1.5,Math.abs(d)*.07);}
function frontX(){const P2=G.pets.filter(u=>!u.gone),F=G.foes.filter(f=>!f.gone);const pf=P2.length?Math.min(...P2.map(u=>u.x)):null,ff=F.length?Math.max(...F.map(f=>f.x)):null;
 if(pf!==null&&ff!==null)return (pf+ff)/2;if(pf!==null)return pf;if(ff!==null)return ff;return HOUSE_X;}
function lookAt(pct){holdCam();const sc=document.getElementById('bpScroll');if(!sc)return;sc.scrollTo({left:pct/100*sc.scrollWidth-sc.clientWidth/2,behavior:'smooth'});}
function panBy(px){holdCam();const sc=document.getElementById('bpScroll');if(sc)sc.scrollBy({left:px,behavior:'smooth'});}
function panSetup(sc){let d=null;
 sc.addEventListener('pointerdown',holdCam);sc.addEventListener('touchstart',holdCam,{passive:true});sc.addEventListener('touchmove',holdCam,{passive:true});
 sc.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;d={x:e.clientX,l:sc.scrollLeft};sc.classList.add('drag');});
 window.addEventListener('pointermove',e=>{if(!d)return;holdCam();sc.scrollLeft=d.l-(e.clientX-d.x);});
 window.addEventListener('pointerup',()=>{if(d){d=null;sc.classList.remove('drag');}});
 sc.addEventListener('wheel',e=>{holdCam();if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){sc.scrollLeft+=e.deltaY;e.preventDefault();}},{passive:false});}
function showQ(fresh){const el=document.getElementById('bpQ');if(!el||!G||!G.q)return;el.innerHTML=esc(qText(G.q));const b=document.getElementById('bpIn');if(b)b.innerHTML=esc(G.inp)||'&nbsp;';
 if(fresh){try{const p=me();if(p&&!p.adult&&(+p.grade||3)<=2&&voiceOn())say(speakable(qText(G.q)),.9);}catch(e){}}}
function fixOpen(){if(!G||G.over)return;if(G.fixing){return;}if(!openFix()){toast(G.bricks<=0?'No bricks left!':'You can rebuild when your Pet House drops below half.');return;}
 G.q=makeQ(me(),G.stage.op);G.inp='';const m=document.getElementById('bpMsg');if(m)m.textContent='Every right answer lays a brick: +'+Math.round(TUNE.brick*100)+'% for your Pet House.';draw();showQ(true);}
function fixDone(){closeFix();draw();}
function key(k){if(!G||G.over||!G.fixing)return;if(k==='go'){if(G.inp===''||G.inp==='.')return;const ok=Math.abs(parseFloat(G.inp)-G.q.answer)<1e-6;const add=answer(ok);
  try{const p=me(),dk=dayKey();p.daily=p.daily||{};p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][ok?'r':'w']++;}catch(e){}
  const m=document.getElementById('bpMsg');if(m)m.innerHTML=ok?`✅ 🧱 +${Math.round(add/G.houseMax*100)}% Pet House${G.streak>=3?` · 🔥 ${G.streak} in a row!`:''}${G.fixing?'':G.bricks<=0?' · That was your last brick!':' · Your Pet House is good as new!'}`:`The answer was <b>${esc(String(G.q.answer))}</b>. No brick lost. Try this one!`;
  try{SFX[ok?'correct':'wrong']();}catch(e){}G.q=makeQ(me(),G.stage.op);G.inp='';showQ(true);draw();return;}
 if(k==='⌫')G.inp=G.inp.slice(0,-1);else if(k==='.'){if(!G.inp.includes('.'))G.inp+=G.inp?'.':'0.';}else if(G.inp.length<7)G.inp+=k;showQ(false);}
/* the keyboard (computers): while rebuilding, keys type the answer; otherwise they play */
function onKey(e){try{if(typeof curScreen==='undefined'||curScreen!=='bp'||VIEW.k!=='fight'||!G||G.over||document.querySelector('.bp2-over')||document.querySelector('#modal.show'))return;
 const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;const k=e.key;let used=true;
 if(k==='ArrowLeft')panBy(-320);else if(k==='ArrowRight')panBy(320);
 else if(G.fixing){if(/^[0-9]$/.test(k))key(k);else if(k==='.'||k===',')key('.');else if(k==='Backspace')key('⌫');else if(k==='Enter')key('go');else if(k==='Escape')fixDone();else used=false;}
 else if(/^[1-5]$/.test(k)){if(send(+k-1))draw();}else if(k==='k'||k==='K'){if(upgradeKitchen())draw();}else if(k===' '||k==='p'||k==='P'){if(pounce())draw();}else if(k==='r'||k==='R')fixOpen();else if(k==='t'||k==='T'){if(callTroll())draw();}else used=false;
 if(used){e.preventDefault();e.stopPropagation();}}catch(x){}}
window.addEventListener('keydown',onKey,true);
/* draw: one element per unit, moved every frame */
function draw(){if(!G)return;const f=document.getElementById('bpField');if(!f)return;const all=G.pets.concat(G.foes);
 all.forEach(u=>{if(!u.el){u.el=document.createElement('div');u.el.className=`bp2-ent ${u.side==='p'?'pet':'foe'}${u.boss?' boss':''}${u.fly?' fly':''}`;u.el.innerHTML=`<div class="hb"><i></i></div><span class="e">${u.side==='p'?u.pet.e:u.e}</span>${u.side==='c'&&u.trait&&u.trait!=='boss'?`<span class="tag">${u.trait}</span>`:''}`;f.appendChild(u.el);}
  if(u.gone){if(!u.dead){u.dead=1;u.el.style.opacity=0;const e=u.el;setTimeout(()=>e.remove(),450);if(!u.left){puff(u.x,'poof');if(Math.random()<.6)puff(u.x+(Math.random()*2-1),'dust');}}return;}
  const now=performance.now();if(u.kbT!==u.kbSeen){u.kbSeen=u.kbT;u.kbUntil=now+420;u.el.classList.remove('kb');void u.el.offsetWidth;u.el.classList.add('kb');puff(u.x,'dust');}
  if(u.kbUntil&&now>u.kbUntil){u.kbUntil=0;u.el.classList.remove('kb');puff(u.x,'dust');}
  if(u.lastHp!==undefined&&u.hp<u.lastHp){u.hurtAcc=(u.hurtAcc||0)+u.lastHp-u.hp;if(u.hurtAcc>u.max*.07){u.hurtAcc=0;u.hurtUntil=now+120;}}u.lastHp=u.hp;u.el.classList.toggle('hurt',(u.hurtUntil||0)>now);
  u.el.style.left=u.x+'%';u.el.classList.toggle('walk',!!u.mv&&!u.fight);u.el.classList.toggle('fight',!!u.fight);if(u.mega)u.el.classList.add('mega');u.el.querySelector('.hb i').style.width=Math.max(0,u.hp/u.max*100)+'%';});
 G.pets=G.pets.filter(u=>!(u.gone&&u.dead));G.foes=G.foes.filter(u=>!(u.gone&&u.dead));
 clash();camera();
 {const tb=document.getElementById('bpTroll'),tc=document.getElementById('bpTrollCd');if(tb&&tc){const out=trollOut(),wait=Math.max(0,G.trollAt-G.t),span=G.trolls?TROLL.cd:TROLL.first;
  tc.style.height=(out?100:wait/span*100)+'%';tb.classList.toggle('poor',G.treats<TROLL.cost||out||wait>0);tb.title=out?`${TROLL.n} is stomping!`:wait>0?`${TROLL.n} is coming in ${Math.ceil(wait)} s`:`Call ${TROLL.n}!`;}}
 const q=id=>document.getElementById(id);q('bpDen').style.width=(G.denHP/G.denMax*100)+'%';q('bpHouse').style.width=(G.houseHP/G.houseMax*100)+'%';q('bpT').textContent=Math.floor(G.t)+'s';
 q('bpTreat').style.width=(G.treats/treatCap()*100)+'%';q('bpTreatT').textContent=`🍖 ${Math.floor(G.treats)} / ${treatCap()}`;
 const fb=q('bpFix'),fp=q('bpFixP'),cf=canFix();fb.innerHTML=`🧱 Rebuild <span class="bp2-key">R</span><br><small>${G.bricks} brick${G.bricks===1?'':'s'}</small>`;fb.disabled=!G.fixing&&!cf;fb.classList.toggle('hot',cf&&!G.fixing);
 if(fp){if(G.fixing!==G.shown){G.shown=G.fixing;fp.style.display=G.fixing?'':'none';if(G.fixing){showQ(false);try{fp.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(e){}}}const bk=q('bpBricks');if(bk)bk.textContent=`🧱 × ${G.bricks}`;}
 const hb=q('bpHouseB');if(hb)hb.style.filter=G.houseHP<G.houseMax*.3?'grayscale(.6) brightness(.8)':'';const db=q('bpDenB');if(db)db.style.filter=G.denHP<G.denMax*.3?'grayscale(.6) brightness(.8)':'';
 miniMap();
 const kb=q('bpKit');kb.textContent=G.kl>=4?'🍳 Kitchen max':`🍳 Kitchen ${G.kl+1}→${G.kl+2} · 🍖${kitchenCost()}`;kb.disabled=G.kl>=4||G.treats<kitchenCost();
 const pb=q('bpPounce');pb.textContent=G.charge>=100?'🐾 POUNCE!':`🐾 ${Math.floor(G.charge)}%`;pb.disabled=G.charge<100;
 G.team.forEach((s,i)=>{const c=q('bpCd'+i),b=q('bpTc'+i);if(!c)return;const left=Math.max(0,s.ready-G.t);c.style.height=(left/s.R.cd*100)+'%';b.classList.toggle('poor',G.treats<s.R.cost);});
 while(G.fx.length){const k=G.fx.shift();try{if(k==='send')tone(440,.1,'square',.03);else if(k==='poof')tone(300,.12,'triangle',.04);else if(k==='pounce'){[523,659,784].forEach((h,j)=>tone(h,.12,'triangle',.06,j*.06));}else if(k==='boss'){shake();tone(110,.6,'sawtooth',.06);toast(`${G.stage.boss[1]} ${G.stage.boss[0]} bursts out!`);}else if(k==='bossdown')toast('The boss is down! Knock over the den!');else if(k==='kitchen')SFX.coin();else if(k==='brick')tone(660,.08,'square',.04);else if(k==='standH'){shake();flash('🏡 LAST STAND! Critters thrown back!');[392,523,659].forEach((h,j)=>tone(h,.15,'square',.06,j*.08));}else if(k==='standD')flash('🏚️ The den shakes your pets back!');else if(k==='tired')toast('😴 The critters are getting sleepy. Push now!');
   else if(k==='troll'){shake();flash(`🧌 ${TROLL.n} stomps in!`);tone(70,.5,'sawtooth',.08);tone(55,.6,'square',.05,.2);}
   else if(k==='stomp'){const t=G.pets.find(u=>u.mega&&!u.gone);if(t){puff(t.x-3,'ring');puff(t.x-4,'dust');puff(t.x-1,'dust');}shake();tone(60,.25,'sine',.12);}
   else if(k==='trollbye')toast(`🧌 ${TROLL.n} stomps home. He'll be back!`);
   else if(k==='bossHit'){shake();tone(90,.18,'sawtooth',.04);}}catch(e){}}}
/* effects: little dust clouds, smoke and hit stars, kept to a handful at a time so older iPads stay smooth */
let PTS=0,CLASH=0;
function puff(x,kind){if(PTS>=36)return;const f=document.getElementById('bpField');if(!f)return;const d=document.createElement('div');d.className='bp2-pt '+kind;d.style.left=x+'%';
 if(kind==='star')d.textContent=Math.random()<.5?'💥':'✨';if(kind==='dust')d.style.setProperty('--dx',(Math.random()*24-12)+'px');PTS++;f.appendChild(d);
 const done=()=>{if(d.parentNode){d.remove();PTS--;}};d.addEventListener('animationend',done);setTimeout(done,900);}
function clash(){const now=performance.now();if(now<CLASH)return;CLASH=now+170;const fighters=G.pets.concat(G.foes).filter(u=>!u.gone&&u.fight);if(!fighters.length)return;
 const u=fighters[Math.floor(Math.random()*fighters.length)];const x=u.x+(u.side==='p'?-2:2)+(Math.random()*2-1);puff(x,'dust');if(Math.random()<.22)puff(x,'star');}
function shake(){const sc=document.getElementById('bpScroll');if(!sc)return;sc.classList.remove('shake');void sc.offsetWidth;sc.classList.add('shake');}
function flash(t){const f=document.getElementById('bpScroll');if(!f)return;const d=document.createElement('div');d.className='bp2-flash';d.textContent=t;d.style.position='fixed';d.style.top='40%';document.body.appendChild(d);setTimeout(()=>d.remove(),1700);}
let MINI=0;function miniMap(){if(++MINI%4)return;const m=document.getElementById('bpMini'),sc=document.getElementById('bpScroll');if(!m||!sc||!G)return;
 const vw=document.getElementById('bpVw');if(vw){vw.style.left=(sc.scrollLeft/sc.scrollWidth*100)+'%';vw.style.width=(sc.clientWidth/sc.scrollWidth*100)+'%';}
 m.querySelectorAll('i').forEach(x=>x.remove());let h='';G.pets.forEach(u=>{if(!u.gone)h+=`<i class="p" style="left:${u.x}%"></i>`;});G.foes.forEach(f=>{if(!f.gone)h+=`<i class="${f.boss?'b':'c'}" style="left:${f.x}%"></i>`;});m.insertAdjacentHTML('beforeend',h);}
function loop(now){if(VIEW.k!=='fight'||!G||typeof curScreen==='undefined'||curScreen!=='bp'){stopLoop();return;}const dt=Math.min(.05,(now-LAST)/1000);LAST=now;if(!document.hidden)step(dt);draw();if(G.over){stopLoop();finish();return;}RAF=requestAnimationFrame(loop);}
function startLoop(){stopLoop();LAST=performance.now();RAF=requestAnimationFrame(loop);}
function stopLoop(){if(RAF)cancelAnimationFrame(RAF);RAF=0;}
/* the end: rewards feed the pets; the play log feeds Parent Corner */
function finish(){if(!G||G.done)return;G.done=true;const p=me();if(!p)return;const pr=prog(p),S=G.stage,first=G.win&&(pr.c[S.id]||0)<G.crown;
 const xp=G.win?3*G.crown:1;G.team.forEach(s=>{try{if((p.pets||[]).includes(s.pet.id))petGain(p,s.pet,xp);}catch(e){}});
 let snack='';if(first){pr.c[S.id]=G.crown;const f=choose(['cookie','apple','carrot']);p.pantry=p.pantry||{};p.pantry[f]=(p.pantry[f]||0)+1;snack=f;}
 const b=p.bp=p.bp||{s:0,m:[]};b.m=b.m||[];const n=x=>Math.max(0,Math.min(9999,Math.round(+x||0)));
 b.m.push([Math.floor(Date.now()/1000),stages().findIndex(s=>s.id===S.id)*10+G.crown,G.win?1:0,n(G.t),n(G.asked),n(G.right),n(G.sent),n(G.pounces),n(G.houseHP/G.houseMax*100),n(G.denHP/G.denMax*100),n(G.trolls)]);if(b.m.length>LOG_MAX)b.m=b.m.slice(-LOG_MAX);
 save();try{SFX[G.win?'win':'wrong']();}catch(e){}
 const ov=document.createElement('div');ov.className='bp2-over';ov.innerHTML=`<div class="bp2-card"><div style="font-size:60px">${G.win?'🎉':'💤'}</div><h2>${G.win?`${esc(S.name)} ${'👑'.repeat(G.crown)} beaten!`:'Your pets need a rest'}</h2>
  <p>${Math.floor(G.t)} seconds${G.asked?` · 🧱 ${G.right} brick${G.right===1?'':'s'} laid (${G.right} of ${G.asked} answers right)`:''}</p><p><b>+${xp} pet XP</b> for each pet on your team${snack?` and a <b>${snack}</b> for your pantry`:''}.</p>${G.win?'':'<p class="muted">Nothing is lost. Try a different team, upgrade the kitchen early, save your Pounce for the boss, and tap 🧱 Rebuild when your Pet House gets low!</p>'}
  <div class="row"><button class="btn green big" onclick="BattlePets._again()">${G.win&&G.crown<3?'Next crown ➜':'Play again'}</button><button class="btn ghost dark" onclick="BattlePets._back()">Stages</button></div></div>`;
 document.body.appendChild(ov);}
function again(){const g=G;document.querySelectorAll('.bp2-over').forEach(x=>x.remove());if(!g)return backTo();const p=me(),pr=prog(p);const c=g.win&&g.crown<3?g.crown+1:g.crown;pickStage(g.stage.id,Math.min(c,(pr.c[g.stage.id]||0)+1));}
function backTo(){stopLoop();document.querySelectorAll('.bp2-over').forEach(x=>x.remove());G=null;VIEW={k:'stages'};screen();}
function quit(){if(G&&!G.over&&G.t>3){if(!document.getElementById('bpQuit')){const ov=document.createElement('div');ov.className='bp2-over';ov.id='bpQuit';ov.innerHTML=`<div class="bp2-card"><h2>Leave this battle?</h2><p>Nothing is lost, but this battle won't count.</p><div class="row"><button class="btn green" onclick="this.closest('.bp2-over').remove()">Keep playing</button><button class="btn ghost dark" onclick="BattlePets._back()">Leave</button></div></div>`;document.body.appendChild(ov);}return;}backTo();}

/* ---------- the plaza building (demo access for every hero) ---------- */
function syncTile(){try{if(typeof W==='undefined'||!W||!W.T)return;const t=W.T[BP_Y]&&W.T[BP_Y][BP_X];if(!t||t.water)return;
 if(on(me())){if(t.npc!=='bp'&&!t.npc&&!t.chest){if(W.hx===BP_X&&W.hy===BP_Y)return;t.npc='bp';t.block=true;t.o=null;}}
 else if(t.npc==='bp'){delete t.npc;t.block=false;}}catch(e){}}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world')syncTile();if(s!=='bp'){stopLoop();document.querySelectorAll('.bp2-over').forEach(x=>x.remove());}},session:()=>{G=null;VIEW={k:'stages'};syncTile();}});

/* ---------- Parent Corner: the play log ---------- */
function stats(p){const b=(p&&p.bp)||{},m=b.m||[];const w=m.filter(x=>x[2]).length,days=new Set(m.map(x=>new Date(x[0]*1000).toDateString())).size;
 const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;const asked=m.reduce((a,x)=>a+x[4],0),right=m.reduce((a,x)=>a+x[5],0);
 return {started:b.s||0,done:m.length,wins:w,days,mins:Math.round(m.reduce((a,x)=>a+x[3],0)/60),winSecs:avg(m.filter(x=>x[2]).map(x=>x[3])),houseLeft:avg(m.filter(x=>x[2]).map(x=>x[8])),asked,right,last:m.length?m[m.length-1][0]*1000:0,crowns:Object.values(prog(p).c).reduce((a,c)=>a+c,0)};}
function logLine(p){const s=stats(p);if(!s.started&&!s.done)return 'Not played yet';
 return `${s.done} match${s.done===1?'':'es'} on ${s.days} day${s.days===1?'':'s'} (${s.mins} min) · won ${s.wins} of ${s.done}${s.done?` (${Math.round(s.wins/s.done*100)}%)`:''} · walked away from ${Math.max(0,s.started-s.done)} · 👑 ${s.crowns} crowns`+(s.wins?` · a win takes about ${s.winSecs}s with the Pet House at ${s.houseLeft}%`:'')+(s.asked?` · facts ${s.right}/${s.asked} right`:'');}
function parentSection(){try{if(typeof state==='undefined'||!state.players)return '';const list=state.players.filter(p=>p.setup&&(p.bp||p.bp2));if(!list.length)return '';
 return `<div class="panel"><h3>🐾 Battle Pets (demo)</h3><p class="muted" style="margin-top:0">The Battle Cats-style demo on the village plaza. It feeds the pets (pet XP and snacks), not the coin purse. This log shows how much it is played and whether it is too easy.</p>
 ${list.map(p=>`<div style="margin:6px 0"><b>${esc(p.name)}</b><br><small class="muted">${esc(logLine(p))}</small></div>`).join('')}</div>`;}catch(e){return '';}}
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);

(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.bp=()=>screen();}else setTimeout(reg,30);})();
window.BattlePets={on,stats,stages,
 _pick:pickStage,_in:teamIn,_out:teamOut,_start:start,_send:i=>{if(send(i))draw();},_kit:()=>{if(upgradeKitchen())draw();},_fix:fixOpen,_fixDone:fixDone,_troll:()=>{if(callTroll())draw();},_cam:()=>{CAM_HOLD=0;camera();},_pounce:()=>{if(pounce())draw();},_key:key,_again:again,_back:backTo,_quit:quit,
 _say:()=>{try{if(G&&G.q)speakToggle(()=>say(speakable(qText(G.q)),.9));}catch(e){}},_sync:syncTile,
 _dbg:{TUNE,CROWN,TROLL,G:()=>G,newBattle,step,callTroll,_spawn:k=>spawn(k),send,answer,openFix,closeFix,canFix,pounce,upgradeKitchen,roleOf,powerOf,stages,makeQ,finish,sim:v=>{SIM=!!v;},view:()=>VIEW}};
})();
