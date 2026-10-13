/* ================= 🎣 Dottie's Pond: the homework spot (Oct 2026) =================
   The owner's idea: a special "bonus section" where a kid works on their real schoolwork and earns something really special.
   A pond with a dock and a sign appears on the map ONLY for heroes who have their own school content in content.js
   (CONTENT.kids.<name>). Dottie lives there: the real giant largemouth bass from Dixon Lake that the kid caught in Lake Legends.
   Activities use that kid's school content: 🎣 Spelling Splash (hear the word, type it, reel in a fish), 🐟 Fix-it Fish (catch the
   fish with the right spelling), 🌎 Explorer Quiz (the kid's school quizzes, kids.<name>.pond.quizzes), 🗺️ Map Dive (name the glowing
   continent or ocean on a cartoon world map; which hemisphere is it in?). Dottie's own 3×2 pond is dug on open grass near the town square
   when the map is built (the map had no inland ponds left), at least 4.5 squares from any entrance. Finishing one with 70%+ sends Dottie diving: she
   brings up a Spinosaurus fossil bone (2 a day at most, 8 in all) for the skeleton on the shore. With all 8 an egg appears; the
   next finished activity hatches a baby Spinosaurus that the kid names, and it becomes a pet. Dottie herself joins as a pet
   (🎒 Homework Hero tier) the first time an activity is finished.
   A whole dinosaur a day (owner, Oct 2026): every pass is a dive until today's skeleton (DINOS[cur]) has its 8 bones; the egg hatches on the
   next pass, the kid names the baby (a pet), and the next dinosaur waits for a new day (rest). Order: Spinosaurus, T. rex, Triceratops,
   Stegosaurus, Brachiosaurus, Ankylosaurus, Parasaurolophus, Velociraptor; after all 8 a pass gives 10 coins.
   Saved per hero in p.pond = {v:2, intro, cur, bones:[8 bools], egg, rest (day of the last hatch), names:{dino:name}, spino (old name copy), st:{splash,fix,quiz:{best,tries,last}},
   miss:{word:n}}. Pictures for Dottie, the Spinosaurus, the egg, bones and skeleton come from pondpets.js (window.MQ_PONDPETS);
   simple fallbacks if it is missing.
   Map hooks: MQ_WORLD (lays the dock beside the inland pond nearest the town square), MQ_MAPDRAW (dock, sign, Dottie jumping), MQ_TAP. */
(function(){
const BONES=8,PASS=.7;
/* a whole dinosaur a day (owner, Oct 2026): no limit on dives until today's skeleton is done; it hatches, and the next dinosaur waits for tomorrow */
const DINOS=['spino','trex','trike','stego','brachio','ankylo','para','raptor'];
const DNAME={spino:'Spinosaurus',trex:'T. rex',trike:'Triceratops',stego:'Stegosaurus',brachio:'Brachiosaurus',ankylo:'Ankylosaurus',para:'Parasaurolophus',raptor:'Velociraptor'};
const FACTS={};FACTS.spino=['The skull! Spinosaurus had a long, thin snout like a crocodile, perfect for grabbing fish.','A neck bone. Spinosaurus could dip its long neck down to the water.',
 'A sail spine! The big sail on its back was made of very long spines, some taller than a grown-up.','A back bone. Spinosaurus was longer than a school bus: about 45 feet!',
 'An arm with a big curved claw, great for hooking slippery fish.','A leg bone. Its legs were short, maybe to help it paddle in rivers.',
 'The hips. Spinosaurus lived about 95 million years ago in North Africa, near big rivers.','The tail! It was tall and flat like a paddle, so Spinosaurus could swim.'];
FACTS.trex=['The skull! A T. rex skull was about 5 feet long, longer than you are tall!','A neck bone. T. rex had a short, strong, S-shaped neck to hold up its giant head.',
 'The lower jaw! T. rex teeth were as long as bananas, with jagged edges like a steak knife.','Back bones and ribs. T. rex was about 40 feet long and heavier than an elephant.',
 'The famous tiny arm! It was only about 3 feet long, but it was very strong.','A leg bone. T. rex walked on two powerful legs with three big toes on each foot.',
 'The hips. T. rex lived about 68 to 66 million years ago in North America.','The tail! Its long, heavy tail helped T. rex balance its huge head.'];
FACTS.trike=['The skull! Triceratops had one of the biggest skulls of any land animal, up to 8 feet long.','A neck bone. Triceratops needed a strong neck to hold up its heavy head and frill.',
 'The frill and horns! Triceratops means "three-horned face". Its two brow horns were about 3 feet long.','Back bones and ribs. Triceratops was about 30 feet long and heavier than an elephant.',
 'A front leg. Triceratops walked on all four legs, a bit like a giant rhinoceros.','A back leg. Its sturdy legs carried a body as heavy as a truck.',
 'The hips. Triceratops lived at the same time as T. rex, about 68 to 66 million years ago.','The tail. Triceratops snipped tough plants with a sharp beak, like a parrot\'s.'];
FACTS.stego=['The skull! Stegosaurus had a small head with a brain about the size of a lime.','A neck bone. Stegosaurus kept its head low to munch ferns and low plants.',
 'Back plates! Stegosaurus had 17 bony plates along its back. The biggest were about 2 feet tall.','Back bones and ribs. Stegosaurus was about 30 feet long, almost as long as a school bus.',
 'A front leg. Stegosaurus\' front legs were much shorter than its back legs.','A back leg. Long back legs made its hips the highest point of its body.',
 'The hips. Stegosaurus lived about 150 million years ago, long before T. rex.','The tail spikes! Scientists call them a "thagomizer". Stegosaurus swung them to protect itself.'];
FACTS.brachio=['The skull! Brachiosaurus had its nose openings high up on top of its head.','A neck bone. Brachiosaurus\' neck was about 30 feet long!',
 'More neck! Its neck bones had air pockets inside, which made them lighter.','Back bones and ribs. Brachiosaurus was as tall as a 4-story building.',
 'A front leg. Its front legs were longer than its back legs, like a giraffe\'s.','A back leg. Brachiosaurus means "arm lizard" because of its long front legs.',
 'The hips. Brachiosaurus lived about 154 to 153 million years ago.','The tail. Brachiosaurus ate leaves from the tops of tall trees, hundreds of pounds a day.'];
FACTS.ankylo=['The skull! Even Ankylosaurus\' eyelids had bony armor.','A neck bone. Bony half-rings protected its neck like a knight\'s armor.',
 'Armor plates! Ankylosaurus was covered in bony plates called osteoderms.','Back bones and ribs. Ankylosaurus was about 20 to 26 feet long, low and wide like a tank.',
 'A front leg. Ankylosaurus had short, sturdy legs and stayed low to the ground.','A back leg. It probably could not run fast, so it needed its armor.',
 'The hips. Ankylosaurus lived about 68 to 66 million years ago, at the same time as T. rex.','The tail club! It was made of fused bones and could swing hard enough to break bones.'];
FACTS.para=['The skull! Parasaurolophus had a beak like a duck and hundreds of teeth for chewing plants.','A neck bone. Parasaurolophus could walk on two legs or on all four.',
 'The crest! Its long, hollow crest may have made loud honking sounds, like a trumpet.','Back bones and ribs. Parasaurolophus was about 30 feet long.',
 'A front leg. Its front legs were shorter, so it could stand up tall to reach leaves.','A back leg. Strong back legs helped it run from danger.',
 'The hips. Parasaurolophus lived about 76 to 73 million years ago in North America.','The tail. It lived in herds, and its honks may have helped the herd talk to each other.'];
FACTS.raptor=['The skull! Velociraptor had a long, low snout full of sharp, curved teeth.','A neck bone. Velociraptor had an S-shaped neck, like a bird\'s.',
 'The sickle claw! Each foot had one big curved claw, almost 3 inches long.','Back bones and ribs. Real Velociraptors were only about the size of a turkey!',
 'An arm bone. Scientists found little bumps where feathers attached, so Velociraptor had feathers.','A leg bone. Velociraptor was fast and light, a little like a roadrunner.',
 'The hips. Velociraptor lived about 75 to 71 million years ago in Mongolia, in Asia.','The tail. Its stiff tail helped it balance and turn quickly.'];
const PP=()=>window.MQ_PONDPETS||null;
try{const q=new URLSearchParams(location.search).get('pondkid');if(q)localStorage.setItem('mq.pondkid',q);if(q==='0')localStorage.removeItem('mq.pondkid');}catch(e){}
const FORCE=(()=>{try{return localStorage.getItem('mq.pondkid')||'';}catch(e){return '';}})(); /* testing only: ?pondkid=mika on a device */
const K=p=>{try{const K0=(window.MQ_CONTENT||{}).kids||{};if(FORCE&&K0[FORCE])return K0[FORCE];const k=(p.ckey&&K0[p.ckey])?p.ckey:(p.name||'').toLowerCase().trim();return K0[k]||null;}catch(e){return null;}};
/* switched off for now (owner, 2026-10-13): no dock, sign, Dottie or pond screen. The pond's water stays on the map, and pets and dinosaurs
   already earned are kept. ?pond=1 turns it back on for one device (testing); set ON=true to bring it back for everyone. */
let ON=false;try{const v=new URLSearchParams(location.search).get('pond');if(v==='1')localStorage.setItem('mq.pond','1');if(v==='0')localStorage.removeItem('mq.pond');if(localStorage.getItem('mq.pond')==='1')ON=true;}catch(e){}
const hasHW=p=>!!(ON&&p&&K(p));
function st(p){p.pond=p.pond||{};const s=p.pond;s.bones=s.bones||new Array(BONES).fill(false);s.st=s.st||{};s.miss=s.miss||{};s.names=s.names||{};
 if(!s.v){s.v=2;if(s.hatched){s.names.spino=s.spino||'Spino';s.cur=1;s.bones=new Array(BONES).fill(false);s.egg=0;s.rest=s.day||'';}else s.cur=0;delete s.hatched;delete s.dayBones;}
 s.cur=s.cur||0;return s;}
/* cur = which dinosaur is being dug up (DINOS index; DINOS.length = all found); rest = the day the last one hatched (the next one waits for a new day) */
const curId=s=>DINOS[s.cur]||null;const resting=s=>s.rest===today();const art=id=>{const D=PP();return (D&&D.dinos&&D.dinos[id])||(D&&id==='spino'?{name:'Spinosaurus',baby:D.spino,bone:D.bone,skeleton:D.skeleton}:null);};
const dname=(s,id)=>s.names[id]||DNAME[id];
const nBones=s=>s.bones.filter(Boolean).length;
const today=()=>{try{return dayKey();}catch(e){return new Date().toISOString().slice(0,10);}};
const E=s=>{try{return esc(s);}catch(e){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}};
const speak=(t,r)=>{try{say(t,r||.8);}catch(e){}};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

/* ---------- the two pets (🎒 Homework Hero tier, never in eggs); everything that touches the core game waits until it has loaded ---------- */
function init(){try{PET_TIERS.homework={n:'Homework Hero',c:'#1c7ed6',odds:0,mult:1.35};
 if(!PETS.some(x=>x.id==='dottie'))PETS.push({id:'dottie',e:'🐟',name:'Dottie',perk:'lucky',tier:'homework',rare:true});
 DINOS.forEach(id=>{if(PETS.some(x=>x.id===id))return;const sp={id,e:['spino','trex','raptor'].includes(id)?'🦖':'🦕',perk:['power','power','shield','shield','heal','shield','lucky','power'][DINOS.indexOf(id)],tier:'homework',rare:true};
  Object.defineProperty(sp,'name',{get(){try{const p=P();const s=p&&p.pond;return (s&&s.names&&s.names[id])||(s&&id==='spino'&&s.spino)||DNAME[id];}catch(e){return DNAME[id];}},enumerable:true});PETS.push(sp);});
 for(let i=REG_PETS.length-1;i>=0;i--)if(REG_PETS[i].tier==='homework')REG_PETS.splice(i,1);}catch(e){console.warn('pond pets',e);}
 try{SCREENS.pond=screen;}catch(e){}
 try{const ps0=parentSchool;parentSchool=function(p){let h=ps0(p);try{h+=parentPond(p);}catch(e){}return h;};}catch(e){}}
document.addEventListener('DOMContentLoaded',init);
function givePet(p,id){if(!p.pets.includes(id)){p.pets.push(id);try{petData(p,id);}catch(e){}if(!p.pet)p.pet=id;return true;}return false;}

/* ---------- the dock on the map ---------- */
let DOCK=null;
window.MQ_WORLD=window.MQ_WORLD||[];
window.MQ_WORLD.push(T=>{DOCK=null;const H=T.length,Wd=T[0].length,C=[22,17],OK=['garden','farm','forest','village','mesa'];
 /* Dottie's own pond (the map has no inland ponds left): a 3×2 pond dug on open grass near the town square, a margin of open ground round it,
    and the dock on the side facing the town. It is there for everyone (pets visit ponds too); only the dock, sign and Dottie need homework. */
 const free=t=>t&&!t.o&&!t.block&&!t.path&&!t.plaza&&!t.water&&!t.gate&&!t.npc&&!t.chest&&!t.rail&&!t.platform&&!t.tunnel;
 const G=[];for(let y=0;y<H;y++)for(let x=0;x<Wd;x++)if(T[y][x].gate)G.push([x,y]);const PEN={forest:0,farm:0,village:2,garden:4,mesa:4};
 let best=null;for(let y=3;y<H-5;y++)for(let x=3;x<Wd-5;x++){const b=T[y][x].b;if(!OK.includes(b))continue;const d=Math.hypot(x+1-C[0],y+.5-C[1]);if(d<6||d>14)continue;if(G.some(([gx,gy])=>Math.hypot(gx-x-1,gy-y-.5)<4.5))continue; /* well away from every entrance */let ok=true;
  for(let yy=y-1;yy<=y+2&&ok;yy++)for(let xx=x-1;xx<=x+3&&ok;xx++){const t=T[yy]&&T[yy][xx];if(!t||t.b!==b)ok=false;else if(yy>=y&&yy<=y+1&&xx>=x&&xx<=x+2){if(!free(t))ok=false;}else if(t.gate||t.npc||t.plaza||t.rail||t.water)ok=false;}
  const sc=d+PEN[b];if(ok&&(!best||sc<best.sc))best={x,y,d,b,sc};}
 if(!best)return;const {x,y}=best;for(let yy=y;yy<=y+1;yy++)for(let xx=x;xx<=x+2;xx++){const t=T[yy][xx];t.water=true;t.block=true;t.o=null;t.deco=false;t.pond=true;}
 /* the dock: the square beside the pond nearest the town */const sides=[[x+1,y+2,x+1,y+1],[x+1,y-1,x+1,y],[x-1,y,x,y],[x+3,y+1,x+2,y+1]].map(([a,b2,wa,wb])=>({x:a,y:b2,wx:wa,wy:wb,d:Math.hypot(a-C[0],b2-C[1])})).filter(q=>free(T[q.y]&&T[q.y][q.x])).sort((p,q)=>p.d-q.d);
 const c=sides[0];if(!c)return;const t=T[c.y][c.x];t.o=null;t.deco=false;t.nodecor=true;t.pondDock=true;DOCK={x:c.x,y:c.y,wx:c.wx,wy:c.wy,px:x,py:y};});
const myHero=()=>{try{return P();}catch(e){return null;}};
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];
window.MQ_MAPDRAW.push((ctx,items,cx,cy,ts,now)=>{const p=myHero();if(!DOCK||!hasHW(p)||typeof W==='undefined'||!W)return;
 const X=DOCK.x*ts-cx,Y=DOCK.y*ts-cy,WX=(DOCK.wx+.5)*ts-cx,WY=(DOCK.wy+.5)*ts-cy,PX=(DOCK.px+1.5)*ts-cx,PY=(DOCK.py+1)*ts-cy;if(X<-ts*4||Y<-ts*4||X>W.vw+ts*4||Y>W.vh+ts*4)return;
 items.push({y:DOCK.y+.2,draw:()=>dockMap(ctx,X,Y,WX,WY,ts,now)});
 items.push({y:DOCK.y+.21,draw:()=>{try{wLabel(ctx,"🎣 Dottie's Pond",X+ts/2,Y-ts*.55,'#fff','rgba(28,126,214,.92)');}catch(e){}}});
 /* now and then Dottie jumps out of the water */const T=7000,k=(now%T)/T;if(k<.16){const q=k/.16;items.push({y:DOCK.py+1.5,draw:()=>jumpFish(ctx,PX,PY,ts,q)});}});
window.MQ_TAP=window.MQ_TAP||[];
window.MQ_TAP.unshift((wx,wy,ts)=>{const p=myHero();if(!DOCK||!hasHW(p)||typeof W==='undefined'||!W)return;const tx=wx/ts,ty=wy/ts;
 if(tx<DOCK.x-.2||tx>DOCK.x+1.2||ty<DOCK.y-1.1||ty>DOCK.y+1)return;
 if(Math.max(Math.abs(W.hx-DOCK.x),Math.abs(W.hy-DOCK.y))<=2){setTimeout(()=>go('pond'),60);return [W.hx,W.hy];}
 return [DOCK.x,DOCK.y];}); /* farther away: walk onto the dock, then tap it */
function dockMap(c,X,Y,WX,WY,ts,now){const O='#3b2a1e';c.save();c.lineWidth=Math.max(1.5,ts*.035);c.strokeStyle=O;
 /* planks reaching toward the water */const dx=WX-(X+ts/2),dy=WY-(Y+ts/2),a=Math.atan2(dy,dx);c.translate(X+ts/2,Y+ts*.6);c.rotate(a);
 c.fillStyle='#a0703c';c.fillRect(-ts*.25,-ts*.2,ts*.95,ts*.4);c.strokeRect(-ts*.25,-ts*.2,ts*.95,ts*.4);c.fillStyle='#7a5230';for(let i=0;i<5;i++)c.fillRect(-ts*.25+i*ts*.19,-ts*.2,1.5,ts*.4);
 c.fillStyle='#6b4423';[[.62,-.22],[.62,.16]].forEach(([px,py])=>{c.fillRect(ts*px,ts*py,ts*.07,ts*.08);});c.restore();
 /* the sign */c.fillStyle='#6b4423';c.fillRect(X+ts*.12,Y+ts*.15,ts*.07,ts*.75);c.strokeStyle=O;c.lineWidth=Math.max(1.2,ts*.03);c.strokeRect(X+ts*.12,Y+ts*.15,ts*.07,ts*.75);
 c.fillStyle='#e9c46a';c.beginPath();c.moveTo(X-ts*.05,Y+ts*.05);c.lineTo(X+ts*.42,Y+ts*.05);c.lineTo(X+ts*.5,Y+ts*.2);c.lineTo(X+ts*.42,Y+ts*.35);c.lineTo(X-ts*.05,Y+ts*.35);c.closePath();c.fill();c.stroke();
 c.font=`${Math.round(ts*.2)}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('🐟',X+ts*.2,Y+ts*.2);
 /* a little rod leaning on the post */c.strokeStyle='#5c3a1c';c.lineWidth=2;c.beginPath();c.moveTo(X+ts*.25,Y+ts*.9);c.lineTo(X+ts*.75,Y-ts*.15);c.stroke();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.beginPath();c.moveTo(X+ts*.75,Y-ts*.15);c.quadraticCurveTo(X+ts*1.05,Y+ts*.1,WX,WY+Math.sin(now/600)*2);c.stroke();}
function jumpFish(c,x,y,ts,q){const h=Math.sin(q*Math.PI)*ts*.9,dx=(q-.5)*ts*.8;c.save();c.translate(x+dx,y-h);c.rotate(-1+q*2);const s=ts*.28;c.fillStyle='#6f8f2f';c.strokeStyle='#2b2140';c.lineWidth=2;c.beginPath();c.ellipse(0,0,s,s*.45,0,0,7);c.fill();c.stroke();
 c.beginPath();c.moveTo(-s*.9,0);c.lineTo(-s*1.4,-s*.4);c.lineTo(-s*1.4,s*.4);c.closePath();c.fill();c.stroke();c.fillStyle='#f6efc0';c.beginPath();c.ellipse(s*.1,s*.15,s*.55,s*.18,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(s*.55,-s*.1,s*.12,0,7);c.fill();c.fillStyle='#2b2140';c.beginPath();c.arc(s*.58,-s*.1,s*.06,0,7);c.fill();c.restore();
 if(q>.85){const r=(q-.85)/.15;c.strokeStyle=`rgba(255,255,255,${1-r})`;c.lineWidth=2;c.beginPath();c.ellipse(x+ts*.4,y,ts*(.15+r*.3),ts*(.06+r*.1),0,0,7);c.stroke();}}

/* ---------- the pond screen ---------- */
let RAF=0,SC=null;
function css(){if(document.getElementById('pondCSS'))return;const s=document.createElement('style');s.id='pondCSS';s.textContent=`
.pond{max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.pond-scene{position:relative;border-radius:20px;overflow:hidden;border:4px solid #2b2340;background:#8fd16a;aspect-ratio:16/8;max-height:52vh;width:100%}
.pond-scene canvas{position:absolute;inset:0;width:100%;height:100%}
.pond-say{position:absolute;left:50%;top:10px;transform:translateX(-50%);background:#fff;border:3px solid #2b2340;border-radius:16px;padding:8px 14px;font-weight:700;max-width:88%;text-align:center;font-size:clamp(14px,2.2vw,18px)}
.pond-acts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.pond-act{font:inherit;text-align:left;border:3px solid #2b2340;border-radius:16px;padding:12px 14px;background:#e7f5ff;cursor:pointer;min-height:84px;display:flex;gap:12px;align-items:center}
.pond-act b{font-size:18px;display:block}.pond-act small{color:#555}.pond-act .ic{font-size:34px}
.pond-act:hover{transform:translateY(-2px)}.pond-act.done{background:#ebfbee}
.pond-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-weight:700}
.pond-pill{background:#fff9db;border:2px solid #f2b705;border-radius:999px;padding:4px 12px}
.pq{background:#fff;border:4px solid #2b2340;border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center}
.pq h3{margin:0}.pq .big{font-size:clamp(20px,4vw,30px);font-weight:800;letter-spacing:1px}
.pq input{font:inherit;font-size:26px;text-align:center;border:3px solid #2b2340;border-radius:14px;padding:8px 12px;width:min(92%,420px);text-transform:none}
.pq .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.pq .fish{font:inherit;font-size:22px;font-weight:800;border:3px solid #2b2340;border-radius:40px 60px 60px 40px;padding:10px 22px 10px 28px;background:#d3f9d8;cursor:pointer;min-width:140px;position:relative}
.pq .fish:after{content:'';position:absolute;left:-14px;top:50%;transform:translateY(-50%);border:12px solid transparent;border-right:16px solid #2b2340}
.pq .ch{font:inherit;font-size:18px;border:3px solid #2b2340;border-radius:14px;padding:10px 14px;background:#f8f9fa;cursor:pointer;min-width:160px}
.pq .ch.ok,.pq .fish.ok{background:#b2f2bb}.pq .ch.no,.pq .fish.no{background:#ffc9c9;opacity:.75}
.pq .diff span.bad{color:#e03131;text-decoration:underline}.pq .dl{color:#1c7ed6;background:#e7f5ff;border-radius:4px}
.pq .prog{font-size:14px;color:#666}.pq .btn.ghost{background:#e9ecef;color:#2b2340;border:2px solid #ced4da}.pq .why{background:#fff9db;border-radius:12px;padding:8px 12px;max-width:560px}
`;document.head.appendChild(s);}
const ACTS=[{id:'splash',ic:'🎣',t:'Spelling Splash',d:'Hear the word, type it, reel in a fish!'},{id:'fix',ic:'🐟',t:'Fix-it Fish',d:'Catch the fish with the right spelling.'},{id:'quiz',ic:'🌎',t:'Explorer Quiz',d:"Questions from what you're learning at school."},{id:'map',ic:'🗺️',t:'Map Dive',d:'Name the continents and oceans, and find the hemispheres.'}];
function screen(){const p=P();if(!hasHW(p)){go('world');return;}css();const s=st(p);
 app.innerHTML=topbar()+`<div class="page pond"><div class="zhead"><button class="btn ghost small backbtn" onclick="go('world')">← Map</button><h2 class="title">🎣 Dottie's Pond</h2></div>
 <div class="pond-scene" id="pondScene"><canvas id="pondCv"></canvas><div class="pond-say" id="pondSay"></div></div>
 <div class="pond-bar" id="pondBar">${bar(s)}</div>
 <div class="pond-acts" id="pondActs">${ACTS.map(a=>{const r=s.st[a.id];return `<button class="pond-act ${r&&r.last===today()?'done':''}" onclick="Pond.play('${a.id}')"><span class="ic">${a.ic}</span><span><b>${a.t}</b><small>${a.d}${r?`<br>Best: ${r.best}%`:''}</small></span></button>`;}).join('')}</div>
 <div id="pondPlay"></div></div>`;
 sceneStart();let line;
 if(!s.intro){line="Psst! Down here! It's me, Dottie, from Dixon Lake! I followed you all the way here. Want to do your homework together? Every time you finish one, I'll dive for dinosaur fossils!";s.intro=1;save();}
 else if(s.egg)line='Shh… listen! The egg is wiggling! Finish one more activity and it might hatch!';
 else if(resting(s)){const id=DINOS[s.cur-1];line=`${dname(s,id)} is splashing around with the others. Tomorrow there's a new dinosaur at the bottom of the pond!`;}
 else if(!curId(s))line="You found every dinosaur in my pond! I'll still dive for shiny fossils if you do your homework.";
 else if(nBones(s)===0&&s.cur>0)line=`Guess what? I saw a new skeleton down there… I think it's a ${DNAME[curId(s)]}! Let's dig it up today!`;
 else line=pick(["Ready to go fishing for words?","Hi again! Let's find another fossil!",`I've got my eye on a ${DNAME[curId(s)]} bone down there. Let's earn a dive!`]);
 sayD(line);};
function bar(s){const id=curId(s),found=DINOS.filter(d=>s.names[d]).length;return (resting(s)?'<span class="pond-pill">😴 New dinosaur tomorrow!</span>':id?`<span class="pond-pill">🦴 Today's dinosaur: ${DNAME[id]} · ${nBones(s)} / ${BONES}</span>`:'<span class="pond-pill">🏆 Every dinosaur found!</span>')+(s.egg?'<span class="pond-pill">🥚 The egg is waiting to hatch!</span>':'')+`<span class="pond-pill">🦖 Dinosaurs hatched: ${found} / ${DINOS.length}</span>`;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function sayD(t){const el=document.getElementById('pondSay');if(el){el.textContent='🐟 '+t;}speak(t,.95);}
function sceneStart(){cancelAnimationFrame(RAF);SC={t0:performance.now(),dive:null,splash:[]};const loop=now=>{const cv=document.getElementById('pondCv');if(!cv||curScreen!=='pond')return;RAF=requestAnimationFrame(loop);drawScene(cv,now);};RAF=requestAnimationFrame(loop);}
function drawScene(cv,now){const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;if(cv.width!==Math.round(r.width*dpr)){cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);}
 const c=cv.getContext('2d'),Wd=r.width,H=r.height,t=(now-SC.t0)/1000,p=P(),s=st(p),O='#2b2140';c.setTransform(dpr,0,0,dpr,0,0);
 /* grass and sky */c.fillStyle='#bde0fe';c.fillRect(0,0,Wd,H*.28);c.fillStyle='#8fd16a';c.fillRect(0,H*.25,Wd,H);c.fillStyle='#7cc35a';for(let i=0;i<40;i++){const x=(i*97)%Wd,y=H*.3+((i*53)%Math.max(1,H*.7));c.fillRect(x,y,3,6);}
 c.fillStyle='#fff';[[.15,.1],[.7,.07]].forEach(([a,b],i)=>{const x=((a*Wd+t*8*(i+1))%(Wd+160))-80;c.beginPath();c.arc(x,H*b,18,0,7);c.arc(x+20,H*b-6,22,0,7);c.arc(x+42,H*b,16,0,7);c.fill();});
 /* the pond */const px=Wd*.5,py=H*.66,pw=Wd*.27,ph=H*.25;c.fillStyle='#4aa3df';c.strokeStyle='#2f7fb8';c.lineWidth=5;c.beginPath();c.ellipse(px,py,pw,ph,0,0,7);c.fill();c.stroke();
 c.fillStyle='#74c0fc';c.beginPath();c.ellipse(px-pw*.2,py-ph*.25,pw*.5,ph*.25,0,0,7);c.fill();
 c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;for(let i=0;i<4;i++){const k=((t*.3+i/4)%1);c.globalAlpha=1-k;c.beginPath();c.ellipse(px+pw*.3*Math.cos(i*2),py+ph*.3*Math.sin(i*3),10+k*30,4+k*10,0,0,7);c.stroke();}c.globalAlpha=1;
 /* lily pads */[[-.6,.2],[.55,-.3],[.3,.45]].forEach(([a,b],i)=>{c.fillStyle='#51cf66';c.strokeStyle=O;c.lineWidth=2;c.beginPath();c.arc(px+pw*a,py+ph*b,14,.3,Math.PI*2-.1);c.lineTo(px+pw*a,py+ph*b);c.closePath();c.fill();c.stroke();if(i===1){c.fillStyle='#f783ac';c.beginPath();c.arc(px+pw*a,py+ph*b-4,6,0,7);c.fill();}});
 /* the dock */c.fillStyle='#a0703c';c.strokeStyle=O;c.lineWidth=3;c.fillRect(px+pw*.62,py-ph*.2,pw*.62,ph*.32);c.strokeRect(px+pw*.62,py-ph*.2,pw*.62,ph*.32);c.fillStyle='#7a5230';for(let i=1;i<6;i++)c.fillRect(px+pw*.62+i*pw*.62/6,py-ph*.2,2,ph*.32);
 c.fillStyle='#6b4423';[[.68,.12],[1.15,.12]].forEach(([a,b])=>c.fillRect(px+pw*a,py+ph*b,8,ph*.35));
 /* Dottie: swims in a loop, or dives and comes back with a bone */
 const D=PP();let dx=px+Math.cos(t*.6)*pw*.45,dy=py+Math.sin(t*.6)*ph*.35+ph*.05,side=Math.sin(t*.6)>0?1:-1,up=0;
 if(SC.dive){const k=(now-SC.dive.t)/3200;if(k>=1){SC.dive=null;}else{dx=px;dy=py;up=k<.25?Math.sin(k/.25*Math.PI)*ph*.9:k<.6?-ph*.2:Math.sin((k-.6)/.4*Math.PI)*ph*1.1;if(k>.6&&D&&SC.dive.bone>=0){const bx=dx,by=dy-up-ph*.55;D.bone(c,bx,by,40,SC.dive.bone,t);}if(k>.22&&k<.3)SC.splash.push({x:px,y:py,t:now});}}
 c.save();c.translate(dx,dy-up);const sc=Math.min(Wd,H*2)/560;c.scale(sc*(side>0?-1:1),sc);if(up<-1){c.globalAlpha=.25;}if(D)D.dottie(c,{kind:'dottie',view:'side',t,mode:'follow',blink:(t%4)<.15,happy:!!SC.dive,puff:false,lx:0,ly:0});else{c.font='60px sans-serif';c.textAlign='center';c.fillText('🐟',0,0);}c.restore();
 SC.splash=SC.splash.filter(q=>now-q.t<900);SC.splash.forEach(q=>{const k=(now-q.t)/900;c.strokeStyle=`rgba(255,255,255,${1-k})`;c.lineWidth=3;c.beginPath();c.ellipse(q.x,q.y,20+k*60,8+k*20,0,0,7);c.stroke();});
 /* the fossil display on the shore, and the egg or the baby */
 const bx=Wd*.12,by=H*.93,id=curId(s)||DINOS[DINOS.length-1],AR=art(resting(s)?DINOS[s.cur-1]:id);if(AR)AR.skeleton(c,bx,by,Wd*.2,resting(s)||!curId(s)?new Array(BONES).fill(true):s.bones,t);else{c.font='30px sans-serif';c.fillText('🦴 '+nBones(s),bx,by-20);}
 if(s.egg){const ex=Wd*.9,ey=H*.9,A2=art(id);c.fillStyle='#c9a46b';c.beginPath();c.ellipse(ex,ey+8,34,10,0,0,7);c.fill();if(D)D.egg(c,ex,ey-14,56,.6,t,A2&&A2.egg,id);else{c.font='40px sans-serif';c.fillText('🥚',ex-20,ey);}}
 const babies=DINOS.filter(d=>s.names[d]),SEATS=[[.84,-.42],[.3,.9],[.62,.95],[.78,.92],[.2,.62],[.92,.55],[.45,.98],[.7,.62]];
 babies.forEach((d,i)=>{if(i===0)return;const [fx,fy]=SEATS[i%SEATS.length],x=Wd*fx,y=fy<0?py+ph*fy:H*fy,A3=art(d);c.save();c.translate(x,y+Math.sin(t*2+i)*2);c.scale(sc*.6*(i%2?-1:1),sc*.6);if(A3)A3.baby(c,{kind:d,view:'side',t:t+i,mode:(t+i*3)%14<3?'nap':'follow',blink:((t+i)%3.7)<.15,happy:false,puff:false,lx:0,ly:0});c.restore();});
 if(babies.length){const d0=babies[0],A0=art(d0),ex=Wd*.84,ey=py-ph*.42+Math.sin(t*2)*3;c.save();c.translate(ex,ey);c.scale(sc*.8,sc*.8);if(A0)A0.baby(c,{kind:d0,view:'side',t,mode:'follow',blink:(t%3.5)<.15,happy:true,puff:false,lx:0,ly:0});else{c.font='50px sans-serif';c.fillText('🦖',-25,0);}c.restore();
  /* a little fishing rod in the baby's mouth */c.strokeStyle='#5c3a1c';c.lineWidth=2;c.beginPath();c.moveTo(ex-20*sc,ey);c.lineTo(ex-60*sc,ey-50*sc);c.stroke();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.beginPath();c.moveTo(ex-60*sc,ey-50*sc);c.lineTo(ex-80*sc,py+Math.sin(t*2)*4);c.stroke();}}

/* ---------- Map Dive: a cartoon world map ---------- */
const LAND={na:'M18 46 Q40 22 92 24 Q140 18 166 34 Q150 48 132 58 Q122 80 104 96 Q92 104 86 112 Q70 96 60 78 Q36 70 18 46 Z',
 sa:'M100 116 Q128 108 152 124 Q162 140 146 160 Q136 178 128 196 Q118 186 116 166 Q104 140 100 116 Z',
 eu:'M184 32 Q204 22 228 28 Q236 40 228 52 Q214 60 198 62 Q186 56 184 32 Z',
 af:'M186 70 Q214 62 240 72 Q254 92 244 112 Q236 142 220 160 Q206 152 204 128 Q192 112 186 96 Q180 82 186 70 Z',
 as:'M232 26 Q290 12 360 26 Q378 44 356 64 Q338 82 312 92 Q294 104 270 98 Q256 86 244 72 Q232 52 232 26 Z',
 au:'M302 138 Q330 128 352 140 Q358 158 340 168 Q318 172 304 162 Q296 150 302 138 Z',
 an:'M30 206 Q120 196 200 200 Q290 196 372 206 Q370 218 200 218 Q30 218 30 206 Z'};
const SPOTS=[{k:'na',n:'North America',x:92,y:58,t:'c',h:['Northern','Western']},{k:'sa',n:'South America',x:130,y:146,t:'c',h:['Southern','Western']},{k:'eu',n:'Europe',x:208,y:44,t:'c',h:['Northern','Eastern']},
 {k:'af',n:'Africa',x:218,y:100,t:'c'},{k:'as',n:'Asia',x:300,y:56,t:'c',h:['Northern','Eastern']},{k:'au',n:'Australia',x:328,y:152,t:'c',h:['Southern','Eastern']},{k:'an',n:'Antarctica',x:200,y:210,t:'c',h:['Southern']},
 {n:'Pacific Ocean',x:40,y:140,t:'o'},{n:'Atlantic Ocean',x:166,y:86,t:'o'},{n:'Indian Ocean',x:272,y:140,t:'o'},{n:'Arctic Ocean',x:200,y:10,t:'o'},{n:'Southern Ocean',x:110,y:190,t:'o'}];
function mapSVG(sp){return `<svg viewBox="0 0 400 220" style="width:min(100%,640px);border:3px solid #2b2340;border-radius:14px;background:#74c0fc">${Object.entries(LAND).map(([k,d])=>`<path d="${d}" fill="${sp&&sp.k===k?'#ffd43b':'#8ce99a'}" stroke="#2b2340" stroke-width="2.5" stroke-linejoin="round"/>`).join('')}
 <line x1="0" y1="113" x2="400" y2="113" stroke="#e03131" stroke-width="2" stroke-dasharray="7 5"/><text x="4" y="109" font-size="9" fill="#c92a2a" font-family="Fredoka,sans-serif">equator</text>
 <line x1="196" y1="0" x2="196" y2="220" stroke="#1c7ed6" stroke-width="2" stroke-dasharray="7 5"/><text x="199" y="196" font-size="9" fill="#1864ab" font-family="Fredoka,sans-serif">prime meridian</text>
 ${sp?`<circle cx="${sp.x}" cy="${sp.y}" r="9" fill="none" stroke="#e8590c" stroke-width="4"><animate attributeName="r" values="7;13;7" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="${sp.x}" cy="${sp.y}" r="4" fill="#e8590c"/>`:''}</svg>`;}
function mapItems(){const name=shuffle(SPOTS).slice(0,8).map(sp=>{const same=SPOTS.filter(o=>o.t===sp.t&&o.n!==sp.n);return {kind:'name',sp,q:sp.t==='c'?'Which continent is this?':'Which ocean is this?',c:shuffle([sp.n].concat(shuffle(same).slice(0,3).map(o=>o.n))),ans:sp.n};});
 const hem=shuffle(SPOTS.filter(sp=>sp.h)).slice(0,3).map(sp=>{const ns=sp.h.find(x=>x==='Northern'||x==='Southern'),ew=sp.h.find(x=>x==='Eastern'||x==='Western');const askEW=ew&&(!ns||Math.random()<.5);
  return askEW?{kind:'hem',sp,q:`Is ${sp.n} in the Eastern or the Western Hemisphere?`,c:['Eastern','Western'],ans:ew,why:`Look at the blue prime meridian. ${sp.n} is on the ${ew==='Eastern'?'right (east)':'left (west)'} side of it.`}
   :{kind:'hem',sp,q:`Is ${sp.n} in the Northern or the Southern Hemisphere?`,c:['Northern','Southern'],ans:ns,why:`Look at the red equator. ${sp.n} is ${ns==='Northern'?'above (north of)':'below (south of)'} it.`};});
 return shuffle(name.concat(hem));}
/* ---------- activities ---------- */
let A=null,RUN=0; /* RUN: each finished activity's late cards (fossil, hatching) only fill in their own result card */
function words(p){try{const w=spellSchool(p);return (w||[]).map(x=>typeof x==='string'?{w:x}:x).filter(x=>x&&x.w);}catch(e){return [];}}
function quizQs(p){const k=K(p)||{},ids=(k.pond&&k.pond.quizzes)||k.quizzes||[],out=[];ids.forEach(id=>{const Q0=(window.MQ_CONTENT||{}).quizzes||{},q=Q0[id];if(q&&q.questions)q.questions.forEach(x=>out.push(x));});return out;}
const dbl=w=>w.replace(/([a-z])\1/gi,'<span class="dl">$1$1</span>');
function play(id){RUN++;const p=P(),s=st(p);let items=[];
 if(id==='splash'){const ws=words(p);if(!ws.length){toast('No spelling words yet!');return;}items=shuffle(ws).sort((a,b)=>(s.miss[b.w]||0)-(s.miss[a.w]||0)).slice(0,10);}
 else if(id==='fix'){const ws=words(p).filter(x=>x.w.length>2);if(!ws.length){toast('No spelling words yet!');return;}items=shuffle(ws).slice(0,8).map(x=>({w:x.w,opts:shuffle([x.w].concat(wrongs(x.w)))}));}
 else if(id==='map'){items=mapItems();}
 else{const qs=quizQs(p);if(!qs.length){toast('No quiz questions yet!');return;}items=shuffle(qs).slice(0,8);}
 A={id,items,i:0,right:0,first:true,tries:0};document.getElementById('pondActs').style.display='none';show();}
/* two believable misspellings: drop a doubled letter, double a single one, swap a vowel, or drop a silent e */
function wrongs(w){const out=new Set(),lw=w;const add=v=>{if(v&&v!==w&&v.length>1)out.add(v);};
 const m=lw.match(/([a-z])\1/i);if(m)add(lw.replace(m[0],m[1]));
 const cons=[...lw].map((ch,i)=>/[bcdfglmnprst]/i.test(ch)&&lw[i+1]!==ch&&lw[i-1]!==ch&&i>0&&i<lw.length-1?i:-1).filter(i=>i>=0);if(cons.length){const i=cons[Math.floor(Math.random()*cons.length)];add(lw.slice(0,i+1)+lw[i]+lw.slice(i+1));}
 const V='aeiou',vi=[...lw].map((ch,i)=>V.includes(ch.toLowerCase())&&i>0?i:-1).filter(i=>i>=0);if(vi.length){const i=vi[Math.floor(Math.random()*vi.length)],nv=V.replace(lw[i].toLowerCase(),'')[Math.floor(Math.random()*4)];add(lw.slice(0,i)+nv+lw.slice(i+1));}
 if(/e$/.test(lw))add(lw.slice(0,-1));if(/y$/.test(lw))add(lw.slice(0,-1)+'ie');add(lw.replace(/([a-z])\1/i,'$1$1$1'));
 return shuffle([...out]).slice(0,2);}
function show(){const el=document.getElementById('pondPlay');if(!el||!A)return;const it=A.items[A.i],n=`<div class="prog">${A.i+1} of ${A.items.length} · 🐟 ${A.right}</div>`;
 if(A.id==='splash'){el.innerHTML=`<div class="pq"><h3>🎣 Spelling Splash</h3>${n}<div class="row"><button class="btn" onclick="Pond.hear()">🔊 Hear the word</button>${it.s?'<button class="btn ghost" onclick="Pond.hear(1)">💬 Hear it in a sentence</button>':''}</div>
  <input id="pondIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type the word" onkeydown="if(event.key==='Enter')Pond.check()"><div class="row"><button class="btn" onclick="Pond.check()">🎣 Reel it in!</button><button class="btn ghost" onclick="Pond.quit()">Stop</button></div><div id="pondFb"></div></div>`;
  setTimeout(()=>{const i=document.getElementById('pondIn');if(i)i.focus();},50);Pond.hear();}
 else if(A.id==='fix'){el.innerHTML=`<div class="pq"><h3>🐟 Fix-it Fish</h3>${n}<p>Catch the fish with the <b>right</b> spelling!</p><div class="row">${it.opts.map((o,k)=>`<button class="fish" id="pf${k}" onclick="Pond.fish(${k})">${E(o)}</button>`).join('')}</div><div id="pondFb"></div><button class="btn ghost" onclick="Pond.quit()">Stop</button></div>`;}
 else if(A.id==='map'){el.innerHTML=`<div class="pq"><h3>🗺️ Map Dive</h3>${n}${mapSVG(it.sp)}<div class="big" style="font-size:clamp(17px,3vw,22px)">${E(it.q)}</div><div class="row">${it.c.map((o,k)=>`<button class="ch" id="pc${k}" onclick="Pond.ans(${k})">${E(o)}</button>`).join('')}</div><div id="pondFb"></div><button class="btn ghost" onclick="Pond.quit()">Stop</button></div>`;speak(it.q,.9);}
 else{const ch=it.c.map((o,k)=>({o,k}));el.innerHTML=`<div class="pq"><h3>🌎 Explorer Quiz</h3>${n}<div class="big" style="font-size:clamp(17px,3vw,22px)">${E(it.q)}</div><div class="row">${ch.map(x=>`<button class="ch" id="pc${x.k}" onclick="Pond.ans(${x.k})">${E(x.o)}</button>`).join('')}</div><div id="pondFb"></div><button class="btn ghost" onclick="Pond.quit()">Stop</button></div>`;speak(it.q,.9);}}
function hear(sent){const it=A&&A.items[A.i];if(!it)return;speak(sent&&it.s?it.s:it.w,.75);}
function next(){A.i++;A.first=true;A.tries=0;if(A.i>=A.items.length)finish();else show();}
function fb(h){const f=document.getElementById('pondFb');if(f)f.innerHTML=h;}
function check(){const it=A.items[A.i],inp=document.getElementById('pondIn');if(!inp)return;const v=inp.value.trim();if(!v)return;const p=P(),s=st(p);
 if(v.toLowerCase()===it.w.toLowerCase()){if(A.tries===0)A.right++;fb(`<div class="why">🎣 Got it! <b>${dbl(E(it.w))}</b></div>`);SC&&(SC.splash.push({x:0,y:0,t:performance.now()}));speak('Yes!',1);setTimeout(next,1100);return;}
 A.tries++;s.miss[it.w]=(s.miss[it.w]||0)+1;let d='';try{d=spellDiff(it.w,v.toLowerCase());}catch(e){d=E(it.w);}
 if(A.tries>=2){fb(`<div class="why">The fish got away! It's spelled <b>${dbl(E(it.w))}</b>. Let's try it again at the end.</div>`);A.items.push({w:it.w,s:it.s,again:1});setTimeout(next,2300);return;}
 fb(`<div class="why diff">Close! Look: ${d}. Try once more!</div>`);inp.value='';inp.focus();}
function fish(k){const it=A.items[A.i],ok=it.opts[k]===it.w,b=document.getElementById('pf'+k);if(!b||b.disabled)return;
 if(ok){b.classList.add('ok');if(A.tries===0)A.right++;fb(`<div class="why">🐟 Caught it! <b>${dbl(E(it.w))}</b></div>`);speak(it.w,.8);document.querySelectorAll('.pq .fish').forEach(x=>x.disabled=true);setTimeout(next,1300);}
 else{b.classList.add('no');b.disabled=true;A.tries++;const p=P(),s=st(p);s.miss[it.w]=(s.miss[it.w]||0)+1;fb('<div class="why">That one swam away. Look closely!</div>');}}
function ans(k){const it=A.items[A.i],b=document.getElementById('pc'+k);if(!b||b.disabled)return;
 if(A.id==='map'){const ok=it.c[k]===it.ans;if(ok){b.classList.add('ok');if(A.tries===0)A.right++;fb(`<div class="why">✅ ${E(it.why||('Yes! '+it.ans+'.'))}</div>`);speak(it.ans,.85);document.querySelectorAll('.pq .ch').forEach(x=>x.disabled=true);setTimeout(next,it.why?2600:1600);}else{b.classList.add('no');b.disabled=true;A.tries++;fb('<div class="why">Not quite. Look at the map again!</div>');}return;}
 if(k===it.a){b.classList.add('ok');if(A.tries===0)A.right++;fb(`<div class="why">✅ ${E(it.why||'Right!')}</div>`);document.querySelectorAll('.pq .ch').forEach(x=>x.disabled=true);setTimeout(next,2400);}
 else{b.classList.add('no');b.disabled=true;A.tries++;fb('<div class="why">Not quite. Try another one!</div>');}}
function quit(){A=null;const el=document.getElementById('pondPlay');if(el)el.innerHTML='';const a=document.getElementById('pondActs');if(a)a.style.display='';}
function finish(){const run=++RUN,p=P(),s=st(p),total=A.items.filter(x=>!x.again).length,pct=Math.round(100*A.right/Math.max(1,total)),id=A.id;A=null;
 const r=s.st[id]=s.st[id]||{best:0,tries:0};r.tries++;r.best=Math.max(r.best,pct);r.last=today();p.coins=(p.coins||0)+5;
 const lines=[`<div class="big">${pct>=PASS*100?'🎉':'💪'} ${pct}%</div>`];let dive=-1,hatch=false,newDottie=false;
 if(pct>=PASS*100){if(givePet(p,'dottie')){newDottie=true;lines.push('<p>🐟 <b>Dottie is now your Homework Hero pet!</b> She can float along with you on the map. Pick her in your Pets.</p>');}
  s.day=today();
  if(!curId(s)){p.coins+=10;lines.push('<p>✨ Dottie dived and found a shiny fossil: +10 🪙! You have found every dinosaur in the pond.</p>');}
  else if(resting(s)){lines.push(`<p>🦖 You already hatched a dinosaur today! Tomorrow a new one will be waiting at the bottom of the pond.</p>`);}
  else if(s.egg){hatch=true;}
  else{dive=s.bones.findIndex(b=>!b);s.bones[dive]=true;if(nBones(s)>=BONES)s.egg=1;}}
 else lines.push(`<p>Get ${Math.round(PASS*100)}% to send Dottie diving for a fossil. You can do it! Try again.</p>`);
 lines.push('<p class="muted">+5 🪙</p>');save();try{const pb=document.getElementById('pondBar');if(pb)pb.innerHTML=bar(s);}catch(e){}
 const el=document.getElementById('pondPlay');if(el)el.innerHTML=`<div class="pq">${lines.join('')}<div id="pondReward"></div><button class="btn" onclick="go('pond')">OK</button></div>`;
 if(dive>=0){SC&&(SC.dive={t:performance.now(),bone:dive});sayD('Hold my rod… I\'m going in!');setTimeout(()=>{const rw=document.getElementById('pondReward');if(rw&&run===RUN){rw.innerHTML=`<canvas id="boneCv" width="200" height="120"></canvas><p><b>🦴 ${DNAME[curId(s)]} fossil ${nBones(s)} of ${BONES}!</b> ${E(FACTS[curId(s)][dive])}</p>${s.egg?'<p>🥚 <b>That was the last bone… and look, an EGG was buried right under it!</b></p>':''}`;const bc=document.getElementById('boneCv'),A4=art(curId(s));if(bc&&A4)A4.bone(bc.getContext('2d'),100,60,90,dive,0);}sayD(FACTS[curId(s)][dive]);},3000);}
 if(hatch)setTimeout(()=>{if(run===RUN)hatchNow();},600);
 if(newDottie)try{toast('🐟 Dottie joined your pets!');}catch(e){}}
function hatchNow(){const p=P(),s=st(p),id=curId(s),AH=art(id);const el=document.getElementById('pondReward');if(!el)return;
 el.innerHTML=`<canvas id="eggCv" width="220" height="200"></canvas><p><b>The egg is hatching!</b></p>`;const cv=document.getElementById('eggCv'),c=cv.getContext('2d');const t0=performance.now();
 const loop=now=>{const k=(now-t0)/3500;if(!document.getElementById('eggCv'))return;c.clearRect(0,0,220,200);const D=PP();
  if(k<1){if(D)D.egg(c,110,110,120,Math.min(1,k*1.3),now/1000,AH&&AH.egg,id);else{c.font='90px sans-serif';c.fillText('🥚',60,140);}requestAnimationFrame(loop);}
  else{c.save();c.translate(110,110);c.scale(1.4,1.4);if(AH)AH.baby(c,{kind:id,view:'front',t:now/1000,mode:'follow',blink:false,happy:true,puff:false,lx:0,ly:0});else{c.font='70px sans-serif';c.fillText('🦖',-35,25);}c.restore();
   requestAnimationFrame(loop);}};requestAnimationFrame(loop);
 /* the name prompt comes on a timer, not from the animation (which a hidden page can pause) */
 setTimeout(()=>{if(!document.getElementById('eggCv')||document.getElementById('spName'))return;el.insertAdjacentHTML('beforeend',`<p>🦖 <b>A baby ${DNAME[id]}!</b> ${id==='spino'?"He's a fishing dinosaur, just like you. ":''}What will you name him?</p><input id="spName" maxlength="12" placeholder="Name" style="font:inherit;font-size:22px;text-align:center;border:3px solid #2b2340;border-radius:12px;padding:6px"> <button class="btn" onclick="Pond.name()">That's his name!</button>`);speak(`A baby ${DNAME[id]}! What will you name him?`,.9);},3600);}
function name(){const p=P(),s=st(p),id=curId(s),i=document.getElementById('spName');if(!id)return;let n=(i&&i.value||'').replace(/[^A-Za-z ]/g,'').trim().slice(0,12);if(!n)n=DNAME[id].replace('. ','');n=n.charAt(0).toUpperCase()+n.slice(1);
 s.names[id]=n;if(id==='spino')s.spino=n;s.egg=0;s.rest=today();s.cur++;s.bones=new Array(BONES).fill(false);givePet(p,id);save();try{toast(`🦖 ${n} joined your pets!`);}catch(e){}go('pond');}

/* ---------- Parent Corner: what the kid did at the pond ---------- */
function parentPond(p){let h='';if(hasHW(p)){const s=st(p),miss=Object.entries(s.miss).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([w,n])=>`${E(w)} (${n})`).join(', ');
 h+=`<h4>🎣 Dottie's Pond</h4><div>🦖 Hatched: ${DINOS.filter(d=>s.names[d]).map(d=>`${E(s.names[d])} the ${DNAME[d]}`).join(', ')||'none yet'}</div><div>${curId(s)?`🦴 Digging up a ${DNAME[curId(s)]}: ${nBones(s)} / ${BONES}${s.egg?' · 🥚 egg waiting':''}${resting(s)?' (next one tomorrow)':''}`:'Every dinosaur found'}</div><ul>${ACTS.map(a=>{const r=s.st[a.id];return `<li>${a.ic} ${a.t}: ${r?`best ${r.best}% (${r.tries} time${r.tries>1?'s':''}, last ${r.last})`:'not tried yet'}</li>`;}).join('')}</ul>${miss?`<div>Words to practise: ${miss}</div>`:''}`;}return h;}

window.Pond={on:v=>{ON=!!v;},play,hear,check,fish,ans,quit,name,dock:()=>DOCK,st:p=>st(p||P()),_a:()=>A,DINOS};
})();
