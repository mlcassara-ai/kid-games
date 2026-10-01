/* ================= Adventure Camp =================
   Kids send pets off on real-time trips (1, 6 or 12 hours). The pets are really gone (no battle helper, no Pet Home)
   and come back with sacks of stuff: silly junk for the Curiosity Shelf, coins, snacks, toys, outfits, eggs, postcards.
   No math and no cost — the only cost is waiting. Saved per player in p.adv. */
(function(){
const A=p=>{p.adv=p.adv||{};const a=p.adv;a.trips=a.trips||0;a.shelf=a.shelf||{};a.cards=a.cards||[];a.crew=a.crew||[];a.dest=a.dest||'meadow';a.len=a.len||'mid';return a;};
const TRIPS={
 short:{id:'short',e:'🌤️',n:'Short trip',hrs:1,items:1,xp:5,coins:[3,8],paws:1},
 mid:{id:'mid',e:'🗺️',n:'Long trip',hrs:6,items:2,xp:15,coins:[8,20],paws:2},
 night:{id:'night',e:'🌙',n:'Overnight trip',hrs:12,items:3,xp:35,coins:[15,35],paws:3}};
const SLOT_AT=[0,10,25,50,80,120,170,230,300,400,500,650];
const slots=p=>SLOT_AT.filter(x=>(p.battles||0)>=x).length;
const DESTS=[
 {id:'meadow',e:'🌼',n:'Sunny Meadow',need:0,c1:'#8ce99a',c2:'#37b24d',sky:'#a5e3ff',home:['bunny','chick','bee','butterfly','hamster','mouse','duck','pig','pup','cat'],
  cur:[['daisy','🌼','Daisy'],['honey','🍯','Honey Pot'],['ladybug','🐞','Ladybug Sticker'],['clover','🍀','Four-Leaf Clover',1]]},
 {id:'woods',e:'🌲',n:'Whisper Woods',need:2,c1:'#69db7c',c2:'#2b8a3e',sky:'#b2f2bb',home:['fox','owl','raccoon','hedgehog','wolf','sloth','koala','panda','monkey'],
  cur:[['acorn','🌰','Acorn'],['mush','🍄','Spotty Mushroom'],['berry','🫐','Wild Berries'],['key','🗝️','Old Key',1]]},
 {id:'cove',e:'🌊',n:'Coral Cove',need:4,c1:'#74c0fc',c2:'#1971c2',sky:'#99e9f2',home:['turtle','penguin','octo','otter','dolphin','shark','whale','bigwhale','frog','flamingo','nova'],
  cur:[['shell','🐚','Seashell'],['star','⭐','Starfish'],['coral','🪸','Bit of Coral'],['bottle','🍾','Message in a Bottle',1]]},
 {id:'caves',e:'💎',n:'Crystal Caves',need:7,c1:'#b197fc',c2:'#5f3dc4',sky:'#d0bfff',home:['snail','rex','titan','hedgehog','mouse','panda'],
  cur:[['crystal','💎','Crystal'],['bone','🦴','Dino Bone'],['candle','🕯️','Old Candle'],['coin','🪙','Ancient Coin',1]]},
 {id:'peaks',e:'☁️',n:'Cloud Peaks',need:10,c1:'#e7f5ff',c2:'#74c0fc',sky:'#d0ebff',home:['eagle','parrot','peacock','skydragon','owl','unicorn','flamingo'],
  cur:[['snow','❄️','Forever Snowflake'],['rainbow','🌈','Piece of Rainbow'],['lostkite','🪁','Lost Kite'],['cloudjar','☁️','Cloud in a Jar',1]]},
 {id:'volcano',e:'🌋',n:'Dragon Volcano',need:14,c1:'#ff8787',c2:'#c92a2a',sky:'#ffc9c9',home:['dragon','skydragon','rex','titan','lion','tiger'],
  cur:[['warm','🔥','Toasty Rock'],['pepper','🌶️','Fire Pepper'],['glass','🔶','Lava Glass'],['scale','🐉','Dragon Scale',1]]},
 {id:'haunt',e:'🎃',n:'Haunted Hollow',need:0,event:1,c1:'#ffa94d',c2:'#5f3dc4',sky:'#e5dbff',home:['owl','wolf','raccoon','boo'],
  cur:[['batdoodle','🦇','Bat Doodle'],['pumpkin','🎃','Tiny Pumpkin'],['web','🕸️','Spider Web'],['lantern','🏮','Glowing Lantern',1]]}];
/* odd stuff from anywhere: collectible curiosities for the shelf (the first 8 are the originals; ids never change so old shelves keep their counts).
   Litter the crew picks up (gum wrappers, banana peels…) is NOT here: it lives in cleanup.js and goes to the kid's sorting bins. */
const JUNK=[['sock','🧦','Odd Sock'],['pebble','🪨','Smooth Pebble'],['stick','🪵','Very Good Stick'],['button','🔘','Shiny Button'],['leaf','🍂','Crunchy Leaf'],['feather','🪶','Feather'],['spoon','🥄','Lost Spoon'],['candycorn','🍬','Candy Corn (ew)'],
 ['marble','🔵','Glass Marble'],['rduck','🐤','Rubber Ducky'],['yoyo','🪀','Yo-Yo'],['die','🎲','Lucky Die'],['puzzle','🧩','Puzzle Piece'],['tball','🎾','Fuzzy Ball'],['brick','🧱','Toy Brick'],['clip','📎','Paper Clip'],
 ['mitten','🧤','Lost Mitten'],['shades','🕶️','Cool Sunglasses'],['pencil','✏️','Tiny Pencil'],['bow','🎀','Hair Bow'],['toycar','🚗','Toy Car'],['magnet','🧲','Magnet'],['bell','🔔','Jingle Bell'],['shoe','👟','One Sneaker'],
 ['fortune','🥠','Fortune Cookie'],['teddy','🧸','Tiny Teddy'],['umbrella','☂️','Lost Umbrella'],['sticker','🌟','Sparkly Sticker']];
const SPECIAL=[['map','🗺️','Treasure Map Piece',1],['tinycrown','👑','Tiny Crown',1]];
const ALLCUR=()=>JUNK.concat(SPECIAL,...DESTS.map(d=>d.cur));
const DIARY_PAIR=['{A} and {B} raced to the top of a hill. {B} won… by rolling down it.','It started to rain. {A} used {B} as an umbrella. {B} did not love that.','{A} told {B} a joke so funny that {B} snorted.','{A} and {B} built a fort out of sticks and named it "Castle Awesome".','{A} and {B} shared the last snack. Then they found another snack!','{A} got a little lost. {B} found them by following the giggles.','{B} carried {A}\'s bag when {A} got sleepy. What a pal!'];
const DIARY_SOLO=['{A} explored {D} and made friends with a very grumpy snail.','{A} counted every cloud in the sky. There were a lot.','{A} took a nap under a tree. It was a great nap.','{A} practiced a brand-new dance move. Nobody saw. Probably for the best.'];
/* {C} = "the crew" (or the pet's name on a solo trip) */
const DIARY_PLACE={
 meadow:['{C} rolled down a flower hill in {D}.','{C} had a picnic in {D} and shared it with a very polite ladybug.','In {D}, {C} made a daisy chain as long as a school bus.','{C} chased butterflies all over {D}. The butterflies won.'],
 woods:['An owl in {D} said "hoo". {C} said "hoo" back. This went on for a while.','{C} followed a squirrel all over {D}. The squirrel was not impressed.','{C} built a tiny fort out of sticks in {D}.','In {D}, {C} found a tree with a little door in it. Nobody answered.'],
 cove:['{C} splashed in the waves at {D} until totally soggy.','{C} raced a crab along the beach at {D}. The crab went sideways and still won.','At {D}, {C} built a sandcastle with a moat.','{C} found a tide pool at {D} full of tiny wiggly things.'],
 caves:['In {D} everything echoed… echoed… echoed…','{C} tiptoed past a sleeping bat in {D}.','The crystals in {D} sparkled like a disco, so {C} danced.','{C} found old cave drawings in {D}. One looked like a sandwich.'],
 peaks:['At {D}, {C} bounced on a cloud like a trampoline.','{C} made snow angels at the top of {D}.','The wind at {D} was so strong that {C} almost flew away.','{C} waved at an eagle in {D}. The eagle waved back. Probably.'],
 volcano:['{D} was SO warm that {C} roasted marshmallows on a rock.','{C} hopped over warm rocks at {D}. Hot, hot, hot!','A baby dragon at {D} sneezed a tiny smoke ring at {C}.','{C} watched the lava glow at {D}. Very orange.'],
 haunt:['In {D} a friendly ghost said BOO. {C} screamed, then laughed.','{C} carved a pumpkin in {D}. It came out smiling.','A skeleton in {D} asked {C} to borrow a blanket.','{C} went trick-or-treating in {D} and got a tiny spider web.']};
/* capital letter at the start of every sentence (a pal like "a very chatty frog" can start one), skipping over tags like <b> */
const capS=t=>String(t).replace(/(^|[.!?]\s+|<br>\s*)((?:<[^>]+>)*)([a-z])/g,(m,a,b,c)=>a+b+c.toUpperCase());
const DOING={meadow:['chasing butterflies','rolling down a flower hill','having a picnic','counting ladybugs'],woods:['climbing trees','hunting for acorns','telling stories by a stump','following a squirrel'],cove:['splashing in the waves','building a sandcastle','looking in tide pools','racing a crab'],caves:['exploring a tunnel','making echoes','digging for crystals','looking at old cave drawings'],peaks:['bouncing on a cloud','sliding down a rainbow','looking for eagle nests','making snow angels'],volcano:['roasting marshmallows','hopping over warm rocks','looking for dragon scales','watching the lava glow'],haunt:['trick-or-treating','hiding from a friendly ghost','carving a pumpkin','telling spooky stories']};
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pk=a=>a[Math.floor(Math.random()*a.length)];
const wpick=o=>{let t=0;for(const k in o)t+=o[k];let r=Math.random()*t;for(const k in o){r-=o[k];if(r<=0)return k;}return Object.keys(o)[0];};
const petE=id=>{const x=PETS.find(q=>q.id===id);return x?x.e:'🐾';};
const petN=id=>{const x=PETS.find(q=>q.id===id);return x?x.name:'?';};
const dest=id=>DESTS.find(d=>d.id===id)||DESTS[0];
const destOpen=(a,d)=>d.event?(typeof eventOpen==='function'&&eventOpen()):a.trips>=d.need;
const fmtLeft=ms=>{ms=Math.max(0,ms);const h=Math.floor(ms/36e5),m=Math.ceil((ms%36e5)/6e4);return h?`${h}h ${Math.min(59,m)}m`:`${Math.max(1,m)}m`;};
const fmtClock=t=>new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const dayWord=t=>new Date(t).toDateString()===new Date().toDateString()?'today':'tomorrow';
const away=(p,id)=>!!(p&&p.adv&&p.adv.trip&&p.adv.trip.crew.includes(id));
const tripDone=p=>!!(p&&p.adv&&p.adv.trip&&Date.now()>=p.adv.trip.end);

/* ---------- styles ---------- */
const CSS=`
.adv-scene{position:relative;border-radius:22px;overflow:hidden;box-shadow:0 5px 0 rgba(0,0,0,.25);background:#8fd3ff;margin-bottom:14px}
.adv-scene .sc{position:relative;width:100%;aspect-ratio:1000/340;max-height:380px}
@media (max-width:640px){.adv-scene .sc{aspect-ratio:1000/520}}
.adv-scene svg.bg{position:absolute;inset:0;width:100%;height:100%;display:block}
.adv-actors{position:absolute;inset:0;pointer-events:none}
.adv-walker{position:absolute;left:0;top:0;will-change:transform}
.adv-walker .bob{display:block;position:relative;animation:advbob .42s ease-in-out infinite alternate;transform-origin:50% 100%}
.adv-walker .pe{display:block;line-height:1;filter:drop-shadow(0 3px 0 rgba(0,0,0,.2))}
.adv-walker .sack{position:absolute;right:-10px;bottom:2px;width:46%;height:46%}
@keyframes advbob{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-7px) rotate(4deg)}}
.adv-sitter{position:absolute;transform:translate(-50%,-100%);line-height:1;filter:drop-shadow(0 3px 0 rgba(0,0,0,.2));animation:advidle 2.4s ease-in-out infinite}
@keyframes advidle{0%,100%{margin-top:0}50%{margin-top:-4px}}
.adv-sign{position:absolute;right:3%;top:6%;background:#fff;border-radius:16px;padding:8px 12px;box-shadow:0 4px 0 rgba(0,0,0,.2);font-weight:600;max-width:46%;color:var(--ink)}
.adv-sign .t{font-size:13px;opacity:.7;font-weight:500}
.adv-sign .big{font-size:clamp(15px,2.6vw,22px);font-variant-numeric:tabular-nums}
.adv-go{position:absolute;right:3%;top:6%;text-align:center;background:rgba(255,255,255,.95);border-radius:18px;padding:8px 10px 6px;box-shadow:0 4px 0 rgba(0,0,0,.2);color:var(--ink);max-width:60%}.adv-go .btn{margin:0}.adv-go .bk{font-size:13px;margin-top:5px;font-weight:600}
@media(max-width:560px){.adv-go{padding:6px 7px 4px}.adv-go .btn.big{font-size:15px;padding:8px 12px;white-space:nowrap}.adv-go .bk{font-size:11px;margin-top:3px}.adv-go .to{display:none}}
.adv-tip{position:absolute;left:3%;top:6%;background:rgba(255,255,255,.95);border-radius:14px;padding:6px 11px;font-weight:600;font-size:14px;box-shadow:0 3px 0 rgba(0,0,0,.15);max-width:48%;color:var(--ink)}
.adv-cols{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:14px;align-items:start}
@media (max-width:820px){.adv-cols{grid-template-columns:minmax(0,1fr)}}
.adv-cols .panel{margin-bottom:0;color:var(--ink)}
.adv-cols h3{margin:0 0 6px;font-size:20px}
.adv-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;margin:8px 0}
.adv-slot{height:66px;border-radius:14px;border:2px dashed #c9bdf5;display:grid;place-items:center;color:#a99bdc;font-size:22px;background:#faf8ff;padding:0}
.adv-slot.full{border:2px solid #b8a6ff;background:#fff;font-size:38px;line-height:1}
.adv-slot.lock{border-style:solid;border-color:#ece7fa;background:#f5f2fc;font-size:13px;color:#b3a8d6;text-align:center;line-height:1.1}
.adv-opt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0}
.adv-optb{background:#f6f3ff;border-radius:16px;padding:10px 6px;text-align:center;border:3px solid transparent;display:flex;flex-direction:column;gap:2px;align-items:center;color:var(--ink)}
.adv-optb.on{border-color:var(--accent);background:#ebe5ff}
.adv-optb .e{font-size:28px;line-height:1.1}
.adv-optb b{font-size:15px}
.adv-optb small{font-size:12px;opacity:.7}
.adv-dests{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin:8px 0}
.adv-dest{border-radius:16px;padding:8px 6px;text-align:center;color:#fff;border:3px solid transparent;min-height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.adv-dest.on{border-color:var(--gold);box-shadow:0 0 0 2px #fff inset}
.adv-dest .e{font-size:26px}
.adv-dest b{font-size:14px}
.adv-dest small{font-size:11px;opacity:.95}
.adv-dest.lock{filter:grayscale(1);opacity:.55}
.adv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:7px;max-height:440px;overflow:auto;padding:2px}
.adv-pc{background:#f6f3ff;border-radius:14px;padding:6px 4px 5px;text-align:center;position:relative;border:3px solid transparent;min-width:0;color:var(--ink)}
.adv-pc .pe{font-size:34px;line-height:1.1;display:block}
.adv-pc .nm{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adv-pc.sel{border-color:var(--accent);background:#e5dcff}
.adv-pc .home{position:absolute;left:4px;top:3px;font-size:11px}
.adv-pc .bud{position:absolute;right:4px;top:3px;font-size:11px}
.adv-note{background:#fff8e1;border-radius:14px;padding:8px 12px;font-size:14px;margin:8px 0;color:#6b4e00}
.adv-meter{height:10px;border-radius:6px;background:#eee8ff;overflow:hidden;margin:8px 0}
.adv-meter i{display:block;height:100%;background:linear-gradient(90deg,#9775fa,#7c5cff);border-radius:6px}
.adv-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 12px}
.adv-tabs button{background:rgba(255,255,255,.15);color:#fff;border-radius:14px;padding:8px 14px;font-weight:600;font-size:15px}
.adv-tabs button.on{background:var(--accent)}
.adv-diary{background:#fffbea repeating-linear-gradient(#fffbea 0 27px,#e9dfb6 27px 28px);border-radius:16px;padding:12px 16px 8px;text-align:left;font-size:17px;line-height:28px;border:2px solid #efe2a8;margin:10px 0;color:var(--ink);background-origin:content-box;background-clip:border-box} .adv-diary *{line-height:28px}
.adv-diary p{margin:0}
.adv-diary .d{color:#8a6d00;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.mcard.adv-wide{max-width:760px}
.adv-sacks{display:grid;grid-template-columns:repeat(var(--c,3),minmax(0,1fr));gap:8px;margin:10px 0}
@media (max-width:560px){.adv-sacks{grid-template-columns:repeat(2,minmax(0,1fr))}}
.adv-sk{background:#f6f3ff;border-radius:16px;padding:8px;min-height:120px;display:flex;flex-direction:column;align-items:center;gap:4px}
.adv-sk .pe{font-size:32px;line-height:1}
.adv-sk .nm{font-size:13px;font-weight:600}
.adv-sk .bag{width:54px;height:54px;cursor:pointer;animation:advwig 1.6s ease-in-out infinite}
@keyframes advwig{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-9deg)}90%{transform:rotate(8deg)}95%{transform:rotate(-5deg)}}
.adv-sk .items{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:4px;width:100%}
.adv-lt{background:#fff;border-radius:12px;padding:4px 2px 3px;display:flex;flex-direction:column;align-items:center;gap:1px;animation:advpop .35s both;box-shadow:0 2px 0 rgba(0,0,0,.06);position:relative;min-width:0}
.adv-lt .e{font-size:24px;line-height:1.1}.adv-lt .n{font-size:10.5px;font-weight:600;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.adv-lt.rare{background:#fff4d6;box-shadow:0 0 0 2px var(--gold) inset}.adv-lt.junk{background:#f1f3f5}
.adv-lt .nw{position:absolute;top:-6px;right:-4px;font-style:normal;font-size:8.5px;font-weight:700;background:var(--bad);color:#fff;border-radius:6px;padding:0 3px}
.adv-lt.sci{background:#e7f5ff;box-shadow:0 0 0 3px #4dabf7 inset,0 0 12px #74c0fc}.adv-lt .nw.sci{background:#1971c2;left:-4px;right:auto;white-space:nowrap}
@keyframes advpop{from{transform:translateY(12px) scale(.6);opacity:0}to{transform:none;opacity:1}}
.adv-float{position:fixed;pointer-events:none;animation:advfloat 1.8s ease-out forwards;font-size:26px;z-index:80}
@keyframes advfloat{from{transform:translateY(0) scale(.6);opacity:1}to{transform:translateY(-120px) scale(1.2);opacity:0}}
.adv-shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.adv-cur{background:#f6f3ff;border-radius:14px;padding:8px 4px;text-align:center;min-width:0;color:var(--ink)}
.adv-cur .e{font-size:30px;line-height:1.1}
.adv-cur .nm{font-size:12px;font-weight:600}
.adv-cur .n{font-size:11px;opacity:.65}
.adv-cur.no .e{filter:brightness(0) opacity(.18)}
.adv-cur.no .nm{color:#b8b0d4}
.adv-cur.rare{box-shadow:0 0 0 2px var(--gold) inset}
.adv-shh{display:flex;align-items:center;gap:8px;margin:14px 0 6px;font-weight:600}
.adv-pcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.adv-postc{background:#fff;border-radius:14px;padding:6px;box-shadow:0 3px 0 rgba(0,0,0,.15);transform:rotate(var(--r,0deg));color:var(--ink)}
.adv-letter>.row:last-child{background:#fffaf0}
.adv-bubble{position:relative;background:#fff;border:3px solid #ffd43b;border-radius:18px;padding:12px 16px;margin:12px auto 14px;font-size:19px;font-weight:700;max-width:340px;color:var(--ink)}.adv-bubble:before{content:'';position:absolute;top:-12px;left:50%;margin-left:-10px;border:10px solid transparent;border-top:0;border-bottom:12px solid #ffd43b}.adv-letter .adv-lbody{max-height:58vh;overflow:auto}
.adv-new{background:#ff6b6b;color:#fff;border-radius:8px;padding:1px 6px;font-size:12px;margin-right:4px}
.adv-postc:hover{transform:rotate(0deg) scale(1.03)}.adv-letter{text-align:left;background:#fffaf0;max-width:460px;border:3px solid #e9d8a6}.adv-lhead{display:flex;justify-content:space-between;align-items:center;font-family:var(--display,inherit);font-weight:700;font-size:18px;border-bottom:2px dashed #e0cf8f;padding-bottom:8px;margin-bottom:8px}.adv-stamp{border:2px dashed #c92a2a;border-radius:6px;padding:2px 6px;font-size:22px;transform:rotate(6deg);background:#fff}.adv-lbody{font-family:"Comic Sans MS","Chalkboard SE","Marker Felt",var(--body,inherit);font-size:17px;line-height:1.5;color:#3b2f1a}.adv-lbody p{margin:0 0 8px}.adv-lps{font-style:italic;color:#6b5a3a}.adv-lsign{font-weight:700;margin-top:2px}
.adv-postc .ph{border-radius:10px;overflow:hidden;position:relative;aspect-ratio:3/2}
.adv-postc .ph svg{width:100%;height:100%;display:block}
.adv-postc .ps{position:absolute;bottom:6%;left:0;right:0;display:flex;justify-content:center;gap:2px;font-size:28px}
.adv-postc .cap{font-size:13px;padding:4px 4px 2px;font-weight:600}
.adv-postc .cap small{display:block;opacity:.6;font-weight:500}
.hcard.adv-hc{grid-column:1/-1}
.adv-pcard{background:linear-gradient(135deg,#fff 0%,#f3f0ff 100%);border-radius:22px;padding:14px 16px;margin:0 0 16px;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.2);display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;border:3px solid #d0bfff}
.adv-pcard.back{border-color:var(--gold);background:linear-gradient(135deg,#fff9db,#fff 70%);animation:advglow 1.6s ease-in-out infinite}
@keyframes advglow{50%{box-shadow:0 5px 0 rgba(0,0,0,.2),0 0 0 6px rgba(255,200,61,.35)}}
.adv-pcard .ic{width:74px;height:74px;border-radius:18px;display:grid;place-items:center;font-size:44px;background:var(--dc,#8ce99a)}
.adv-pcard h3{margin:0;font-size:20px}.adv-pcard .st{font-size:15px;margin:2px 0 6px}
.adv-pcard .crew{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}.adv-pcard .crew span{background:#fff;border-radius:12px;padding:3px 8px 3px 4px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:3px;box-shadow:0 1px 0 rgba(0,0,0,.08)}.adv-pcard .crew span i{font-style:normal;font-size:22px;line-height:1}
.adv-pcard .left{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;text-align:right;line-height:1.1}.adv-pcard .left small{display:block;font-size:13px;font-weight:500;opacity:.7}
.adv-pcard .adv-meter{margin:6px 0 2px}
@media (max-width:620px){.adv-pcard{grid-template-columns:auto minmax(0,1fr)}.adv-pcard .act{grid-column:1/-1}.adv-pcard .left{text-align:left}}
@media (prefers-reduced-motion:reduce){.adv-pcard.back{animation:none}}
@media (prefers-reduced-motion:reduce){.adv-walker .bob,.adv-sitter,.adv-sk .bag{animation:none}}
.adv-wh{padding:16px 18px}.adv-whtop{display:flex;gap:10px;align-items:center;text-align:left}.adv-whcrew{font-size:40px;line-height:1.05;flex:0 0 auto;max-width:34%;word-break:break-all;text-align:center}
.adv-whsay{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:6px}.adv-whsay .adv-bubble{margin:0;max-width:none;font-size:17px;padding:8px 12px}.adv-whsay .adv-bubble:before{top:50%;left:-12px;margin:-9px 0 0;border:9px solid transparent;border-left:0;border-right:12px solid #ffd43b}.adv-whsay .btn{margin:0}
.adv-wh .adv-diary{margin:10px 0 6px;font-size:16px}.adv-whpc{margin:0 0 4px;font-size:14px}.adv-whh{margin:8px 0 0;font-size:18px}.adv-whh small{font-size:14px;font-weight:500}.adv-whxp{margin:2px 0 6px;font-size:14px}.adv-wh .adv-sacks{margin:8px 0}
@media (max-width:560px){.adv-wh{padding:12px}.adv-whcrew{font-size:32px}.adv-whsay .adv-bubble{font-size:15px}.adv-wh .adv-diary{font-size:14.5px;line-height:24px;padding:8px 12px 4px;background:#fffbea repeating-linear-gradient(#fffbea 0 23px,#e9dfb6 23px 24px);background-origin:content-box}.adv-wh .adv-diary *{line-height:24px}.adv-wh .adv-sacks{grid-template-columns:repeat(var(--pc,2),minmax(0,1fr));gap:6px}.adv-wh .adv-sk{min-height:84px;padding:5px 4px;gap:2px}.adv-wh .adv-sk .bag{width:42px;height:42px}.adv-wh .adv-sk .pe{font-size:24px}.adv-wh .adv-sk .nm{font-size:12px;text-align:center;line-height:1.15}.adv-wh .adv-sk .items{grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:3px}.adv-wh .adv-lt .e{font-size:20px}.adv-wh .adv-lt .n{font-size:9.5px}.adv-whh{font-size:16px}.adv-whsay .btn.small{font-size:14px;padding:7px 12px}}`;
function css(){if(!document.getElementById('advCSS')){const s=document.createElement('style');s.id='advCSS';s.textContent=CSS;document.head.appendChild(s);}}
const SACK=`<svg viewBox="0 0 60 60"><path d="M18 18 Q10 30 10 42 Q10 56 30 56 Q50 56 50 42 Q50 30 42 18Z" fill="#c68b4e" stroke="#7a4b1f" stroke-width="3"/><path d="M18 18 Q30 24 42 18 L38 12 Q30 16 22 12Z" fill="#a86b33" stroke="#7a4b1f" stroke-width="3"/><path d="M20 20 Q30 26 40 20" stroke="#ffd43b" stroke-width="3" fill="none"/><text x="30" y="46" text-anchor="middle" font-size="16">✨</text></svg>`;

/* ---------- trips ---------- */
let TAB='camp',RES=null;
function send(force){const p=P(),a=A(p);if(a.trip)return;const crew=a.crew.filter(id=>p.pets.includes(id)&&!(window.PetCare&&PetCare.rescued(p,id)));if(!crew.length)return;
 if(!force&&crew.includes(p.pet)){const n=petN(p.pet);modal(`<div class="mcard"><div class="big-emoji">${petE(p.pet)}</div><h2>${esc(n)} is your battle buddy!</h2><p>If ${esc(n)} goes on the trip, you won't have a pet helping you in battles until they're back (${fmtClock(Date.now()+TRIPS[a.len].hrs*36e5)} ${dayWord(Date.now()+TRIPS[a.len].hrs*36e5)}).</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Keep ${esc(n)} home</button><button class="btn green" onclick="closeModal();Adv.send(true)">Send them anyway</button></div></div>`);return;}
 const T=TRIPS[a.len];a.trip={dest:a.dest,len:a.len,crew,start:Date.now(),end:Date.now()+T.hrs*36e5,mood:{}};if(a.pack){a.trip.pack=Math.min(4,a.pack);a.pack=0;} /* pack: extra finds earned by the packing questions (daily.js) */
 /* postcards are mailed halfway through the trip (chance grows with trip length; the very first trip always sends one) */
 if(Math.random()<({short:.08,mid:.25,night:.5}[a.len]||.25)||a.trips===0)a.trip.pc=a.trip.start+(a.trip.end-a.trip.start)/2;a.trip.v=2;
 crew.forEach(id=>{const pd=petData(p,id);if(typeof petMood==='function')petMood(pd);a.trip.mood[id]=[pd.food,pd.joy];});
 save();SFX.tap();toScene(()=>depart(crew,()=>{if(curScreen==='camp')draw();}));}
function callHome(){const p=P(),a=A(p);if(!a.trip)return;a.trip.early=1;a.trip.end=Date.now();save();draw();}
function lootCat(len){return len==='short'?{junk:50,coins:32,snack:14,dcur:4}:len==='mid'?{junk:32,coins:26,snack:20,dcur:14,toy:6,egg:1,map:1.5}:{junk:24,coins:22,snack:18,dcur:20,toy:10,egg:2,map:2.5,crown:.5};}
function rollItem(p,len,d){const c=wpick(lootCat(len)),T=TRIPS[len];
 if(c==='coins')return {k:'coins',e:'🪙',n:'coins',v:rnd(T.coins[0],T.coins[1])};
 if(c==='junk'){const j=pk(JUNK);return {k:'cur',id:j[0],e:j[1],n:j[2],junk:1};}
 if(c==='snack'){const s=len==='short'?pk(PET_FOODS.slice(0,3)):pk(PET_FOODS);return {k:'snack',id:s.id,e:s.e,n:s.name};}
 if(c==='dcur'){const rare=Math.random()<(len==='night'?.2:.1);const pool=d.cur.filter(x=>!!x[3]===rare);const j=pk(pool.length?pool:d.cur);return {k:'cur',id:j[0],e:j[1],n:j[2],rare:!!j[3]};}
 if(c==='toy'){const opts=PET_TOYS.filter(t=>!(p.toys||[]).includes(t.id)&&t.price<=200).map(t=>({k:'toy',id:t.id,e:t.e,n:t.name})).concat(PET_GEAR.filter(g=>!(p.petGear||[]).includes(g.id)&&g.price<=150).map(g=>({k:'gear',id:g.id,e:g.e,n:g.name+' (outfit)'})));
  return opts.length?{...pk(opts),rare:1}:{k:'coins',e:'🪙',n:'coins',v:rnd(T.coins[0],T.coins[1])};}
 if(c==='egg')return {k:'egg',e:'🥚',n:'Egg!',rare:1};
 if(c==='map')return {k:'cur',id:'map',e:'🗺️',n:'Treasure Map Piece',rare:1};
 return {k:'cur',id:'tinycrown',e:'👑',n:'Tiny Crown',rare:1};}
function finish(){const p=P(),a=A(p),tr=a.trip;if(!tr)return null;const T=TRIPS[tr.len]||TRIPS.mid,d=dest(tr.dest);
 const early=!!tr.early&&Date.now()<tr.start+T.hrs*36e5;
 const res={dest:tr.dest,len:tr.len,crew:tr.crew,early,sacks:[],diary:[],xp:early?2:T.xp,card:null,grew:[]};
 const seen={...a.shelf};let egg=0;
 const xPack=early?0:(tr.pack||0),xCrew=tr.crew.length||1;
 tr.crew.forEach((id,ci)=>{const home=d.home.includes(id);const n=early?1:T.items+(home?1:0)+Math.floor(xPack/xCrew)+(ci<xPack%xCrew?1:0);const items=[];let coins=0;
  for(let k=0;k<n;k++){let it=early?{k:'coins',e:'🪙',n:'coins',v:rnd(2,6)}:rollItem(p,tr.len,d);
   if(it.k==='egg'){if(egg)it={k:'coins',e:'🪙',n:'coins',v:rnd(T.coins[0],T.coins[1])};else egg=1;}
   if((it.k==='toy'||it.k==='gear')&&res.sacks.concat([{items}]).some(s=>s.items.some(x=>x.k===it.k&&x.id===it.id)))it={k:'coins',e:'🪙',n:'coins',v:rnd(T.coins[0],T.coins[1])};
   if(it.k==='coins'){coins+=it.v;continue;}
   if(it.k==='cur'){it.isNew=!seen[it.id];seen[it.id]=(seen[it.id]||0)+1;}items.push(it);}
  if(coins)items.unshift({k:'coins',e:'🪙',n:coins+' coins',v:coins});
  res.sacks.push({id,items,home});});
 // food truck (beta): 0-1 rare ingredient per trip, straight into p.truck; nothing happens unless the truck is enabled
 if(!early&&res.sacks.length&&window.Truck&&typeof Truck.campFind==='function'&&Truck.enabled(p)){const it=Truck.campFind(p,tr.len);if(it)res.sacks[rnd(0,res.sacks.length-1)].items.push(it);}
 // clean-up (cleanup.js): litter to sort + very rare Science Cave finds (camp-only fossil pieces, mystery rocks). It stores them itself.
 if(!early&&res.sacks.length&&window.Cleanup&&typeof Cleanup.onTrip==='function'){try{Cleanup.onTrip(p,res,tr);}catch(e){console.warn('cleanup',e);}}
 // put it all away
 res.sacks.forEach(s=>s.items.forEach(it=>{if(it.k==='coins')p.coins+=it.v;else if(it.k==='cur')a.shelf[it.id]=(a.shelf[it.id]||0)+1;
  else if(it.k==='snack')p.pantry[it.id]=(p.pantry[it.id]||0)+1;else if(it.k==='toy'){p.toys=p.toys||[];if(!p.toys.includes(it.id))p.toys.push(it.id);}
  else if(it.k==='gear'){p.petGear=p.petGear||[];if(!p.petGear.includes(it.id))p.petGear.push(it.id);}else if(it.k==='egg')p.eggs=(p.eggs||0)+1;}));
 // pets come home just as fed as they left, a bit happier, and a little more grown up
 tr.crew.forEach(id=>{const pd=petData(p,id);const m=tr.mood&&tr.mood[id];if(m){pd.food=m[0];pd.joy=Math.min(typeof MOOD_MAX!=='undefined'?MOOD_MAX:5,m[1]+(early?0:1));pd.t=Date.now();}
  const st=petStage(pd);pd.xp+=res.xp;const st2=petStage(pd);if(st2!==st){pd.hints=Math.min(st2.max,(pd.hints||0)+1);res.grew.push([id,st2.n]);}});
 const pc=early?0:{short:.08,mid:.25,night:.5}[tr.len];
 if(tr.v===2){ /* new trips: the postcard was mailed at the halfway point (deliver it now if nobody was around to get it); the story told at home matches it */
  if(tr.pc&&Date.now()>=tr.pc)mail(p,tr,true);const c=tr.pcT&&a.cards.find(x=>x.t===tr.pcT);
  if(c){res.card=c;res.tale=c;}else if(!early){res.tale={dest:tr.dest,crew:tr.crew.slice(0,5),t:Date.now(),r:rnd(-4,4),n:tr.len==='short'?1:2,len:tr.len};res.tale.k=taleKeys(p,res.tale);}}
 else{if(!early){res.tale={dest:tr.dest,crew:tr.crew.slice(0,5),t:Date.now(),r:rnd(-4,4),n:tr.len==='short'?1:2,len:tr.len};res.tale.k=taleKeys(p,res.tale);}
  if(!early&&(Math.random()<pc||a.trips===0)){res.card=res.tale;res.card.nw=1;a.cards.unshift(res.card);a.cards=a.cards.slice(0,60);}}
 const solo=tr.crew.length<2;const nm=id=>`<b>${esc(petN(id))}</b>`,fill=(s,x,y,it)=>capS(s.replace(/\{A\}/g,nm(x)).replace(/\{B\}/g,nm(y||x)).replace(/\{C\}/g,solo?nm(tr.crew[0]):'the crew').replace(/\{D\}/g,d.n).replace(/\{I\}/g,it?`${it.e} ${esc(it.n)}`:'a shiny button'));
 /* recent diary lines are skipped so the same line doesn't show up trip after trip */
 const dh=a.dh=Array.isArray(a.dh)?a.dh:[];const dpick=(arr,pre)=>{const ks=arr.map((_,i)=>pre+i);const fresh=ks.filter(k=>!dh.includes(k));const k=fresh.length?pk(fresh):ks.slice().sort((x,y)=>dh.lastIndexOf(x)-dh.lastIndexOf(y))[0]; /* all used lately: the one used longest ago */dh.push(k);return arr[+k.slice(pre.length)];};
 if(early)res.diary=[solo?`${nm(tr.crew[0])} came home early from ${d.n}, with only enough time to grab a few coins!`:`The crew came home early from ${d.n}. They only had time to grab a few coins!`];
 else{res.diary.push(fill(dpick(DIARY_PLACE[d.id]||DIARY_PLACE.meadow,'pl:'+d.id+':'),tr.crew[0]));
  if(tr.crew.length>1){const i=rnd(0,tr.crew.length-2);res.diary.push(fill(dpick(DIARY_PAIR,'pr'),tr.crew[i],tr.crew[i+1]));}
  const all=res.sacks.flatMap(s=>s.items.map(it=>({it,id:s.id})));const best=all.find(x=>x.it.rare)||all.find(x=>x.it.k==='cur');
  res.diary.push(best?fill('{A} found something special ({I}) and would NOT stop showing it to everyone.',best.id,null,best.it):fill(dpick(DIARY_SOLO,'so'),tr.crew[tr.crew.length-1]));
  a.dh=dh.slice(-40);a.trips++;}
 a.trip=null;a.last=Date.now();save();return res;}

/* ---------- scene ---------- */
function sceneSVG(d){const h=new Date().getHours(),t=h>=7&&h<18?'day':h>=18&&h<20?'dusk':'night';
 const sk=t==='day'?['#7cc8ff','#c9ecff']:t==='dusk'?['#ff9e7a','#ffd6a5']:['#1b1446','#4b3aa8'];
 const orb=t==='night'?`<circle cx="850" cy="60" r="26" fill="#fff9db"/><circle cx="861" cy="52" r="24" fill="${sk[0]}"/>`+[[120,40],[260,80],[420,30],[610,70],[720,26],[930,110]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join(''):`<circle cx="850" cy="64" r="30" fill="#ffe066"/><circle cx="850" cy="64" r="42" fill="#ffe06655"/>`;
 return `<svg class="bg" viewBox="0 0 1000 340" preserveAspectRatio="xMinYMax slice"><defs><linearGradient id="advsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk[0]}"/><stop offset="1" stop-color="${sk[1]}"/></linearGradient></defs>
 <rect width="1000" height="340" fill="url(#advsk)"/>${orb}
 <g fill="#ffffffcc"><ellipse cx="200" cy="70" rx="46" ry="14"/><ellipse cx="236" cy="62" rx="30" ry="12"/><ellipse cx="560" cy="48" rx="40" ry="12"/></g>
 <path d="M0 210 Q140 150 300 190 Q470 140 640 186 Q720 160 780 190 L780 260 L0 260Z" fill="#7bc96f" opacity=".7"/>
 <g><path d="M760 200 Q820 120 880 190 Q930 110 1000 180 L1000 230 L760 230Z" fill="${d.c2}"/><text x="880" y="178" font-size="40" text-anchor="middle">${d.e}</text></g>
 <path d="M0 240 Q250 200 520 230 Q760 200 1000 212 L1000 340 L0 340Z" fill="#8fdc7e"/><path d="M0 300 Q300 270 620 292 Q820 280 1000 290 L1000 340 L0 340Z" fill="#6cc15e"/>
 <path d="M290 330 C380 300 450 262 560 250 C680 238 760 222 840 208 C900 198 950 192 1010 186" stroke="#e8c98f" stroke-width="30" fill="none" stroke-linecap="round"/>
 <path d="M290 330 C380 300 450 262 560 250 C680 238 760 222 840 208 C900 198 950 192 1010 186" stroke="#d9b574" stroke-width="3" stroke-dasharray="4 16" fill="none"/>
 ${[[40,250,1],[520,236,.8],[660,222,.7],[980,250,.9]].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-5" y="-6" width="10" height="26" fill="#8b5a2b"/><circle cy="-22" r="24" fill="#2f9e44"/><circle cx="-12" cy="-12" r="16" fill="#37b24d"/><circle cx="12" cy="-10" r="16" fill="#2b8a3e"/></g>`).join('')}
 <g transform="translate(120 300)"><path d="M-80 0 L0 -110 L80 0Z" fill="#ff922b" stroke="#d9480f" stroke-width="5" stroke-linejoin="round"/><path d="M0 -110 L-26 0 L26 0Z" fill="#7a3d00"/><path d="M0 -110 L-10 -128 M0 -110 L12 -126" stroke="#8b5a2b" stroke-width="5"/><path d="M-10 -128 L6 -134 L2 -120Z" fill="#ffd43b"/></g>
 <g transform="translate(250 312)"><ellipse rx="40" ry="10" fill="#0002"/><path d="M-26 -2 L26 -10 M-26 -10 L26 -2" stroke="#8b5a2b" stroke-width="9" stroke-linecap="round"/><path d="M-14 -8 Q-18 -36 0 -52 Q2 -34 12 -40 Q20 -22 14 -8Z" fill="#ff922b"/><path d="M-6 -8 Q-8 -24 2 -32 Q6 -20 8 -8Z" fill="#ffd43b"/></g>
 <g transform="translate(470 262)"><rect x="-4" y="-50" width="8" height="58" fill="#8b5a2b"/><path d="M-4 -50 L56 -50 L68 -40 L56 -30 L-4 -30Z" fill="#c68b4e" stroke="#7a4b1f" stroke-width="3"/><text x="28" y="-35" font-size="15" text-anchor="middle">${d.e}</text></g></svg>`;}
const TRAIL=[[300,326],[380,300],[450,272],[560,250],[680,238],[760,222],[840,208],[920,196],[1060,180]];
function trailSvg(f){f=Math.max(0,Math.min(1,f));const i=Math.min(TRAIL.length-2,Math.floor(f*(TRAIL.length-1))),u=f*(TRAIL.length-1)-i;return [TRAIL[i][0]+(TRAIL[i+1][0]-TRAIL[i][0])*u,TRAIL[i][1]+(TRAIL[i+1][1]-TRAIL[i][1])*u];}
const box=()=>{const s=document.getElementById('advSc');return s?s.getBoundingClientRect():{left:0,top:0,width:600,height:200};};
function toPx(x,y){const svg=document.querySelector('#advSc svg');if(!svg)return [0,0];const b=box(),m=svg.getScreenCTM();if(!m)return [0,0];const pt=svg.createSVGPoint();pt.x=x;pt.y=y;const q=pt.matrixTransform(m);return [q.x-b.left,q.y-b.top];}
const trailPx=f=>{const [x,y]=trailSvg(f);return toPx(x,y);};
const petPx=()=>{const b=box();return Math.max(28,Math.min(b.height*.17,b.width*.06));};
function walker(id,sack){const px=petPx(),w=document.createElement('div');w.className='adv-walker';w.innerHTML=`<span class="bob"><span class="pe" style="font-size:${px}px">${petE(id)}</span>${sack?`<span class="sack">${SACK}</span>`:''}</span>`;document.getElementById('advActors').appendChild(w);return w;}
function walk(w,from,to,dur,delay){const px=petPx(),pts=[];for(let k=0;k<=12;k++){const f=from+(to-from)*k/12,sc=1-.5*f,[x,y]=trailPx(f);pts.push({transform:`translate(${(x-px/2).toFixed(1)}px,${(y-px*1.05*sc).toFixed(1)}px) scale(${sc.toFixed(3)})`});}
 return w.animate(pts,{duration:dur,delay,easing:'linear',fill:'both'});}
function depart(crew,done){const A_=document.getElementById('advActors');if(!A_)return done&&done();A_.innerHTML='';let last;crew.forEach((id,i)=>{last=walk(walker(id,false),0,1,3600,i*420);});
 [0,300,600].forEach(t=>setTimeout(()=>{try{SFX.tap();}catch(e){}},t));last.onfinish=()=>{A_.innerHTML='';done&&done();};}
function comeHome(crew,done){const A_=document.getElementById('advActors');if(!A_)return done&&done();A_.innerHTML='';const s=document.querySelector('.adv-sign');if(s)s.remove();let last;
 crew.forEach((id,i)=>{last=walk(walker(id,true),1,.04,3400,i*420);});last.onfinish=()=>setTimeout(()=>done&&done(),400);}
function sitters(){const A_=document.getElementById('advActors');if(!A_)return;A_.innerHTML='';const p=P(),a=A(p);if(a.trip)return;const px=petPx();
 a.crew.filter(Boolean).forEach((id,i)=>{const f=.07+i*.075,sc=1-.5*f,[x,y]=trailPx(f);const s=document.createElement('div');s.className='adv-sitter';s.style.left=x+'px';s.style.top=(y+(i%2?px*.12:0))+'px';s.style.zIndex=30-i;s.style.fontSize=(px*sc).toFixed(0)+'px';s.style.animationDelay=(i*.3)+'s';s.textContent=petE(id);A_.appendChild(s);});}
function toScene(fn){const c=document.getElementById('advScene');if(!c)return fn();const r=c.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight){window.scrollTo({top:Math.max(0,scrollY+r.top-70),behavior:'smooth'});setTimeout(fn,650);}else fn();}

/* ---------- screens ---------- */
let DRAWN=null;const KEEP_SC='.adv-grid,.cu-track,.cu-log';
function draw(){css();const p=P(),a=A(p);a.crew=a.crew.filter(id=>p.pets.includes(id)).slice(0,slots(p));if(!destOpen(a,dest(a.dest)))a.dest='meadow';
 const CU=window.Cleanup;if(TAB==='clean'&&!CU)TAB='camp';
 const resB=a.res&&!RES?`<div class="cu-strip"><span class="e">🎒</span><span><b>Your crew is still unpacking!</b><small>Hear their story and open the sacks.</small></span><button class="btn gold" onclick="Adv.resume()">🎒 Keep unpacking</button></div>`:'';
 const body=TAB==='shelf'?shelfHTML(p,a):TAB==='cards'?cardsHTML(a):TAB==='clean'?CU.html(p):resB+(CU?CU.campStrip(p):'')+campHTML(p,a);
 /* looking at the Postcards page counts as seeing them: the NEW tags (already in body) show this once, then the 📬 alert clears —
    cleared BEFORE the top bar is drawn, so its 📬 badge is gone right away */
 const seen=TAB==='cards'&&newCards(p)>0;if(seen){a.cards.forEach(c=>{delete c.nw;});save();}
 /* a redraw of the same tab (picking a pet, changing the trip) keeps every list where the kid left it */
 const same=DRAWN===TAB&&!!document.querySelector('.adv-tabs'),ks=same?[...document.querySelectorAll(KEEP_SC)].map(e=>e.scrollTop):[],ky=same?window.scrollY:-1;DRAWN=TAB;
 app.innerHTML=topbar()+`<div class="page"><div class="zhead"><button class="btn ghost small" onclick="go('world')">← World</button><h2 class="title">🏕️ Adventure Camp</h2></div>
 <div class="adv-tabs">${[['camp','🏕️ Camp'],...(CU?[['clean',CU.tabLabel(p)]]:[]),['shelf','🗄️ Curiosity Shelf'],['cards','🖼️ Postcards'+(TAB!=='cards'&&newCards(p)?` <b class="adv-new">📬 ${newCards(p)}</b>`:'')]].map(([k,t])=>`<button class="${TAB===k?'on':''}" onclick="Adv.tab('${k}')">${t}</button>`).join('')}</div>${body}</div>`;
 try{if(same){document.querySelectorAll(KEEP_SC).forEach((e,i)=>{if(ks[i])e.scrollTop=ks[i];});if(ky>=0&&window.scrollY!==ky)window.scrollTo(0,ky);}}catch(e){}
 if(TAB==='camp')requestAnimationFrame(sitters);
 try{if(seen&&typeof hudSync==='function')hudSync();}catch(e){}}
const newCards=p=>((p&&p.adv&&p.adv.cards)||[]).filter(c=>c&&c.nw).length;
function campHTML(p,a){const tr=a.trip,d=dest(tr?tr.dest:a.dest),n=slots(p);
 const done=tr&&Date.now()>=tr.end;
 const scene=`<div class="adv-scene" id="advScene"><div class="sc" id="advSc">${sceneSVG(d)}<div class="adv-actors" id="advActors"></div>
  ${tr?`<div class="adv-sign"><div class="t">${d.e} ${d.n}</div><div class="big" id="advLeft">${done?"They're back! 🎉":`Back in ${fmtLeft(tr.end-Date.now())}`}</div></div>${done?'':'<div class="adv-tip">🏕️ The camp is quiet… the crew is off exploring!</div>'}`:
  (a.crew.length&&p.pets.length?(bk=>`<div class="adv-go"><button class="btn green big" onclick="Adv.send()">🥾 Send them off!</button><div class="bk"><span class="to">${a.crew.length} pet${a.crew.length>1?'s':''} to ${d.e} ${d.n}<br></span>Back at <b>${fmtClock(bk)}</b> ${dayWord(bk)}</div></div>`)(Date.now()+(TRIPS[a.len]||TRIPS.short).hrs*36e5):`<div class="adv-tip">Pick a crew below 👇</div>`)}</div></div>`;
 if(!p.pets.length)return scene+`<div class="panel" style="text-align:center;color:var(--ink)"><div style="font-size:60px">🥚</div><p>You need a pet to go on adventures! Hatch an egg in your backpack.</p><button class="btn gold" onclick="go('backpack')">🎒 Go to backpack</button></div>`;
 if(tr){const TT=TRIPS[tr.len]||TRIPS.mid;const pct=Math.min(100,(Date.now()-tr.start)/Math.max(1,tr.end-tr.start)*100);const L=DOING[tr.dest]||DOING.meadow;
  return scene+`<div class="adv-cols"><div class="panel"><h3>${done?'🎉 Your crew is back!':`${TT.e} Exploring ${d.e} ${d.n}`}</h3>
  ${done?`<p class="muted" style="font-size:16px">They're walking up the trail with bulging sacks…</p><div class="row"><button class="btn gold big" id="advWelcome" onclick="Adv.welcome()">🎒 Welcome them home!</button></div>`:
  `<p style="margin:4px 0">Back at <b>${fmtClock(tr.end)}</b> ${dayWord(tr.end)} · <span class="muted">${fmtLeft(tr.end-Date.now())} to go</span></p><div class="adv-meter"><i style="width:${pct.toFixed(1)}%"></i></div>
  <p style="margin:4px 0 8px;font-size:15px">💭 Right now they're probably ${L[Math.floor(Date.now()/9e5)%L.length]}…</p>
  <div class="adv-note">While they're away, these pets can't help in battles or visit Pet Home. They'll be back with their sacks full!</div>
  <div class="row"><button class="btn ghost dark small" onclick="Adv.askCall()">📯 Call them home early</button></div>`}</div>
  <div class="panel"><h3>🎒 The crew</h3><div class="adv-slots">${tr.crew.map(id=>`<span class="adv-slot full" title="${esc(petN(id))}">${petE(id)}</span>`).join('')}</div></div></div>`;}
 const T=TRIPS[a.len],back=Date.now()+T.hrs*36e5;const home=a.crew.filter(id=>d.home.includes(id));
 let sl='';for(let i=0;i<12;i++){const id=a.crew[i];sl+=i<n?(id?`<button class="adv-slot full" onclick="Adv.toggle('${id}')" title="${esc(petN(id))}">${petE(id)}</button>`:`<span class="adv-slot">?</span>`):(i===n?`<span class="adv-slot lock">🔒<br>${SLOT_AT[i]} wins</span>`:'');}
 const pets=p.pets.filter(id=>PETS.some(x=>x.id===id)&&!(window.PetCare&&PetCare.rescued(p,id)));
 return scene+`<div class="adv-cols"><div class="panel"><h3>🎒 Pick your crew</h3>
  <p class="muted" style="margin:0">Crew spots: <b>${n}</b> of 12${n<12?` · the next spot opens at <b>${SLOT_AT[n]}</b> battles won (you have ${p.battles||0})`:''}</p>
  <div class="adv-slots">${sl}</div>
  <h3 style="margin-top:12px">⏳ How long?</h3>
  <div class="adv-opt">${Object.values(TRIPS).map(t=>`<button class="adv-optb ${a.len===t.id?'on':''}" onclick="Adv.set('len','${t.id}')"><span class="e">${t.e}</span><b>${t.n}</b><small>${t.hrs} hour${t.hrs>1?'s':''}</small><span style="font-size:12px">${'🐾'.repeat(t.paws)}<span style="opacity:.25">${'🐾'.repeat(3-t.paws)}</span></span></button>`).join('')}</div>
  <p class="muted" style="margin:0">Longer trips bring back more stuff, and better stuff!</p>
  <h3 style="margin-top:12px">🧭 Where to?</h3>
  <div class="adv-dests">${DESTS.filter(x=>!x.event||destOpen(a,x)).map(x=>{const ok=destOpen(a,x);const c=a.crew.filter(id=>x.home.includes(id)).length;return `<button class="adv-dest ${a.dest===x.id?'on':''} ${ok?'':'lock'}" style="background:linear-gradient(160deg,${x.c1},${x.c2})" onclick="${ok?`Adv.set('dest','${x.id}')`:`toast('🔒 ${x.n} opens after ${x.need} adventures. You've been on ${a.trips}.')`}"><span class="e">${ok?x.e:'🔒'}</span><b>${x.n}</b><small>${x.event?'Halloween only!':ok?(c?`⭐ ${c===a.crew.length&&c>1?'Your whole crew loves':c===1?`${esc(petN(a.crew.find(id=>x.home.includes(id))))} loves`:`${c} of your crew love`} it`:'Explore!'):`after ${x.need} trips`}</small></button>`;}).join('')}</div>
  ${home.length?`<div class="adv-note">⭐ ${home.map(id=>esc(petN(id))).join(', ')} ${home.length>1?'love':'loves'} ${d.n} and will find an extra treasure!</div>`:''}
</div>
  <div class="panel"><h3>🐾 Your pets</h3><p class="muted" style="margin:0 0 6px">Tap a pet to add it to the crew. Tap again to take it out.</p>
  <div class="adv-grid">${pets.map(id=>`<button class="adv-pc ${a.crew.includes(id)?'sel':''}" onclick="Adv.toggle('${id}')">${d.home.includes(id)?'<span class="home">⭐</span>':''}${p.pet===id?'<span class="bud" title="Battle buddy">⚔️</span>':''}<span class="pe">${petE(id)}</span><div class="nm">${esc(petN(id))}</div></button>`).join('')}</div></div></div>`;}
function shelfHTML(p,a){const rows=[['🧦 Odd stuff from anywhere',JUNK.concat(SPECIAL)],...DESTS.map(d=>[`${d.e} ${d.n}`,d.cur])];
 const tot=rows.reduce((s,r)=>s+r[1].length,0),have=rows.reduce((s,r)=>s+r[1].filter(x=>a.shelf[x[0]]).length,0);
 return `${window.Cleanup?Cleanup.shelfBadges(p):''}<div class="panel" style="color:var(--ink)"><p style="margin-top:0">Everything your pets drag home goes here, even the socks. Found <b>${have}</b> of ${tot}.${a.shelf.map?` 🗺️ Map pieces: <b>${Math.min(4,a.shelf.map)}/4</b>`:''}</p>
 ${(a.shelf.map||0)>=4?`<div class="adv-note">🗺️ You have all 4 pieces of a treasure map! <button class="btn gold small" onclick="Adv.treasure()">Follow the map!</button></div>`:''}
 ${rows.map(([t,list])=>`<div class="adv-shh">${t} <span class="muted">${list.filter(x=>a.shelf[x[0]]).length}/${list.length}</span></div><div class="adv-shelf">${list.map(x=>{const n=a.shelf[x[0]]||0;return `<div class="adv-cur ${n?'':'no'} ${x[3]?'rare':''}"><div class="e">${x[1]}</div><div class="nm">${n?esc(x[2]):'???'}</div><div class="n">${n?'× '+n:x[3]?'rare!':'not found yet'}</div></div>`;}).join('')}</div>`).join('')}</div>`;}

/* ---------- the halfway postcard ---------- */
function mail(p,tr,quiet){const a=A(p);tr=tr||a.trip;if(!tr||!tr.pc||tr.pcT||Date.now()<tr.pc)return null;
 const c={dest:tr.dest,crew:tr.crew.slice(0,5),t:Math.round(tr.pc),r:rnd(-4,4),n:tr.len==='short'?1:2,len:tr.len,nw:1};c.k=taleKeys(p,c);a.cards.unshift(c);a.cards=a.cards.slice(0,60);tr.pcT=c.t;save();
 if(!quiet){const d=dest(tr.dest);try{SFX.coin();}catch(e){}toast(`📮 A postcard just arrived from ${d.e} ${d.n}! Read it at Adventure Camp → Postcards.`);}return c;}
setInterval(()=>{try{const p=typeof P==='function'&&typeof state!=='undefined'&&state&&state.cur?P():null;if(!p||!p.adv||!p.adv.trip)return;if(typeof curScreen!=='undefined'&&curScreen==='battle')return;
 const tr=p.adv.trip;if(tr.pc&&!tr.pcT&&Date.now()>=tr.pc&&Date.now()<tr.end){mail(p,tr);if(typeof curScreen!=='undefined'&&curScreen==='camp'&&TAB==='cards')draw();}}catch(e){}},20e3);
/* ---------- crew tales: postcards + "want to hear about our adventure?" ----------
   Lines come from tales.js (ADV_TALES). Each story remembers which lines it used (c.k), so a postcard always
   reads the same and the story told at home matches the postcard. p.adv.heard keeps recent lines so they don't repeat soon. */
const TB=()=>window.ADV_TALES||{open:['Dear {K},'],sayOpen:['Guess what, {K}!'],close:['Love,'],sayClose:['The end!'],pal:['a frog'],food:['stew'],thing:['a sock'],num:['3'],plot:[['We went on a trip.','It was fun.','We missed you!']],plotAt:{},any:['{A} had fun.'],at:{},ps:['P.S. Hi!']};
function seeded(n){let x=(n>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%100000)/100000;};}
function taleKeys(p,c){const a=A(p),T=TB(),R=seeded(Math.floor(c.t/1000)+(c.r||0)*97+7),heard=a.heard=a.heard||[],used=[];
 const pick=keys=>{const fresh=keys.filter(k=>!heard.includes(k)&&!used.includes(k));let l=fresh;if(!l.length){const rest=keys.filter(k=>!used.includes(k)).map(k=>[k,heard.lastIndexOf(k)]).sort((x,y)=>x[1]-y[1]);l=rest.slice(0,Math.max(1,Math.ceil(rest.length/3))).map(x=>x[0]);}/* all heard: use the oldest third */const k=(l.length?l:keys)[Math.floor(R()*(l.length||keys.length))];used.push(k);return k;};
 const ids=(pre,arr)=>(arr||[]).map((_,i)=>pre+i),pa=(T.plotAt||{})[c.dest],sa=(T.at||{})[c.dest];
 const placePlot=pa&&pa.length&&R()<.6;const k=[pick(ids('o',T.open)),pick(ids('so',T.sayOpen)),placePlot?pick(ids('q:'+c.dest+':',pa)):pick(ids('p',T.plot))];
 const n=c.n||2;if(!placePlot&&sa&&sa.length)k.push(pick(ids('w:'+c.dest+':',sa)));while(k.length<3+n)k.push(pick(ids('a',T.any)));
 k.push(pick(ids('s',T.ps)),pick(ids('c',T.close)),pick(ids('sc',T.sayClose)));
 a.heard=heard.concat(used.filter(x=>!/^(o|so|c|sc)\d/.test(x))).slice(-90);return k;}
function tale(p,c){const T=TB();if(!c.k||!c.k.length)c.k=taleKeys(p,c);
 const R=seeded(Math.floor(c.t/1000)+(c.r||0)*97);const pk2=arr=>arr[Math.floor(R()*arr.length)];
 const crew=c.crew&&c.crew.length?c.crew:['?'];const nm=id=>esc(petN(id));const A0=crew[Math.floor(R()*crew.length)];const B0=crew.length>1?crew.filter(x=>x!==A0)[Math.floor(R()*(crew.length-1))]:A0;
 const pal=pk2(T.pal),food=pk2(T.food),thing=pk2(T.thing),num=pk2(T.num),Bn=B0===A0?pal:`<b>${nm(B0)}</b>`;/* solo crews get a silly camp friend */
 const pal2=B0===A0?pk2(T.pal.filter(x=>x!==pal)):pal,d=dest(c.dest);
 /* time words fit the trip: {t:1-hour|6-hour|overnight} (old saved tales: n 1 = short, else long) */
 const LI=({short:0,mid:1,night:2})[c.len]!=null?({short:0,mid:1,night:2})[c.len]:(c.n===1?0:1);
 const tw=t=>t.replace(/\{t:((?:[^{}]|\{[A-Za-z]\})*)\}/g,(m,x)=>{const o=x.split('|');return o[Math.min(LI,o.length-1)];});
 /* a camp pal is introduced once ("a squirrel named Kevin"), then just "Kevin" / "the frog" */
 const said={};const shortPal=x=>{let m=/ named (\w+)/.exec(x);if(m)return m[1];if((m=/^([A-Z].*?) the /.exec(x)))return m[1];if(/^an? /.test(x))return 'the '+x.replace(/^an? /,'').replace(/ who .*$/,'');return x;};
 const palAt=x=>{if(said[x])return shortPal(x);said[x]=1;return x;};
 const bare=x=>x.replace(/^(a|an|the) /,'');
 const fill=t=>capS(tw(String(t)).replace(/\{K\}/g,esc(String(p.name||'').split(' ')[0])).replace(/\{A\}/g,`<b>${nm(A0)}</b>`)
  .replace(/\b([Tt]he|[Aa]n?|[Yy]our|[Oo]ur) \{X\}/g,(m,w)=>w+' '+bare(thing)).replace(/\{x\}/g,bare(thing))
  .replace(/\{[BP]\}/g,m=>m==='{B}'?(B0===A0?palAt(pal):Bn):palAt(pal2)).replace(/\{F\}/g,food).replace(/\{X\}/g,thing).replace(/\{N\}/g,num).replace(/\{D\}/g,d?esc(d.n):'camp'));
 const get=k=>{let m;if((m=/^q:(\w+):(\d+)$/.exec(k)))return ((T.plotAt||{})[m[1]]||[])[+m[2]];if((m=/^w:(\w+):(\d+)$/.exec(k)))return ((T.at||{})[m[1]]||[])[+m[2]];
  m=/^([a-z]+)(\d+)$/.exec(k);if(!m)return '';const L={o:T.open,so:T.sayOpen,p:T.plot,a:T.any,s:T.ps,c:T.close,sc:T.sayClose}[m[1]];return L?L[+m[2]]:'';};
 const tx=k=>{const v=get(k);return v==null?'':Array.isArray(v)?v.map(fill).join(' '):fill(v);};
 const k=c.k,body=k.slice(2,-3).map(tx).filter(Boolean);
 return {open:tx(k[0]),sayOpen:tx(k[1]),lines:body,ps:tx(k[k.length-3]),close:tx(k[k.length-2]),sayClose:tx(k[k.length-1]),sign:crew.map(id=>`${petE(id)} ${nm(id)}`).join(', ')};}
const letter=(p,c)=>tale(p,c);
/* 🔊 tap again to stop: the game's speakToggle() when there, else cancel whatever is being spoken */
const spkTog=fn=>{try{if(typeof speakToggle==='function'){speakToggle(fn);return;}if(window.speechSynthesis&&(speechSynthesis.speaking||speechSynthesis.pending)){speechSynthesis.cancel();return;}}catch(e){}fn();};
function readAloud(parts){try{const t=parts.join(' ').replace(/<[^>]+>/g,'').replace(/P\.S\./g,'P S,');if(typeof say==='function')say(t,.9);}catch(e){}}
let LAST_TALE=null;
function readCard(i){const p=P(),a=A(p),c=a.cards[i];if(!c)return;if(c.nw){delete c.nw;save();}const d=dest(c.dest);const had=!!c.k;const L=tale(p,c);if(!had)save();try{SFX.tap();}catch(e){}
 LAST_TALE=[L.open,...L.lines,L.ps,L.close,L.sign];
 modal(`<div class="mcard adv-letter"><div class="adv-lhead"><span>${d.e} ${esc(d.n)}</span><span class="adv-stamp">${c.crew.slice(0,2).map(petE).join('')}</span></div>
  <div class="adv-lbody"><p>${L.open}</p>${L.lines.map(t=>`<p>${t}</p>`).join('')}<p class="adv-lps">${L.ps}</p><p style="margin-bottom:0">${L.close}</p><p class="adv-lsign">${L.sign}</p></div>
  <div class="row"><button class="btn" onclick="Adv.readAloud()">🔊 Read it to me</button><button class="btn green" onclick="try{speechSynthesis.cancel()}catch(e){};closeModal()">😂 Ha! Close</button></div></div>`);}
/* the crew tells the story out loud when they get home */
function offerTale(){return wh();}
function tellTale(){const r=RES;if(!r||!r.tale)return wh();r.heard=1;const p=P(),d=dest(r.dest);const L=tale(p,r.tale);try{SFX.tap();}catch(e){}
 LAST_TALE=[L.sayOpen,...L.lines,L.sayClose];
 modal(`<div class="mcard adv-letter adv-tale"><div class="adv-lhead"><span>📣 Our adventure in ${d.e} ${esc(d.n)}</span><span class="adv-stamp">${r.crew.slice(0,3).map(petE).join('')}</span></div>
  <div class="adv-lbody"><p><i>${L.sayOpen}</i></p>${L.lines.map(t=>`<p>${t}</p>`).join('')}<p class="adv-lps">${L.sayClose}</p></div>
  ${r.card?`<p style="margin:6px 0 0;font-size:14px">📮 We wrote this on a <b>postcard</b> too! It's on the Postcards page.</p>`:''}
  <div class="row"><button class="btn" onclick="Adv.readAloud()">🔊 Read it to me</button><button class="btn gold big" onclick="try{speechSynthesis.cancel()}catch(e){};Adv.home()">🎒 Back to the sacks</button></div></div>`);
 }
function cardsHTML(a){return `<div class="panel" style="color:var(--ink)"><p style="margin-top:0">Sometimes your crew mails a postcard from where they went. Longer trips mean more postcards!</p>
 ${a.cards.length?`<p class="muted" style="margin:0 0 8px">💌 Tap a postcard to read what your crew wrote!</p><div class="adv-pcards">${a.cards.map((c,ci)=>{const d=dest(c.dest);return `<div class="adv-postc" role="button" tabindex="0" style="--r:${c.r}deg;cursor:pointer" onclick="Adv.readCard(${ci})" title="Read the postcard"><div class="ph"><svg viewBox="0 0 300 200"><defs><linearGradient id="apg${c.t}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.sky}"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="300" height="200" fill="url(#apg${c.t})"/><path d="M0 120 Q80 70 150 110 Q220 60 300 100 L300 200 L0 200Z" fill="${d.c1}"/><path d="M0 160 Q150 130 300 160 L300 200 L0 200Z" fill="${d.c2}"/><text x="250" y="60" font-size="44" text-anchor="middle">${d.e}</text><text x="18" y="34" font-size="20" font-weight="700" fill="#fff" stroke="#0005" stroke-width="3" paint-order="stroke">Hi from ${esc(d.n)}!</text></svg><div class="ps">${c.crew.map(id=>`<span>${petE(id)}</span>`).join('')}</div></div><div class="cap">${c.nw?'<b class="adv-new">NEW 📮</b> ':''}${c.crew.map(id=>esc(petN(id))).join(', ')}<small>${new Date(c.t).toLocaleDateString([],{month:'short',day:'numeric'})}</small></div></div>`;}).join('')}</div>`:'<p class="muted">No postcards yet. Send a crew on an adventure!</p>'}</div>`;}

/* ---------- welcome home ---------- */
function welcome(){const p=P(),a=A(p);if(!a.trip||Date.now()<a.trip.end)return;const b=document.getElementById('advWelcome');if(b)b.disabled=true;const crew=a.trip.crew;
 RES=finish();if(RES){try{a.res=JSON.parse(JSON.stringify(RES));RES=a.res;save();}catch(e){}}SFX.coin();toScene(()=>comeHome(crew,()=>wh()));}
/* a reload (or a closed tab) in the middle of welcome-home: the finds are already in the backpack, but let the kid still hear the story and open the sacks */
function resume(){const a=A(P());if(!a.res)return;RES=a.res;wh();}
/* ONE welcome-home card: the crew says hi (with a "hear our adventure" button), the trip diary, and the sacks to tap open.
   Opened sacks are remembered in r.op (saved in a.res), so a reload or a trip to the story and back keeps them open. */
const ASKERS=['Want to hear about our adventure?','Can we tell you what happened?!','Guess what happened on our trip!','Ooh ooh! Want to hear a story?','You will NOT believe what happened. Want to hear?'];
function itemsHTML(s,anim){return s.items.map((it,k)=>`<span class="adv-lt ${it.rare?'rare':''} ${it.junk?'junk':''} ${it.sci?'sci':''}" style="${anim?`animation-delay:${k*.15}s`:'animation:none'}" title="${esc(it.n)}">${it.isNew?'<i class="nw">NEW</i>':''}${it.sci?'<i class="nw sci">🔬 CAVE</i>':''}<span class="e">${it.e}</span><span class="n">${esc(it.n)}</span></span>`).join('');}
function wh(){const r=RES;if(!r)return;css();const p=P(),d=dest(r.dest),T=TRIPS[r.len]||TRIPS.mid,crew=r.crew||[],n=r.sacks.length;r.op=r.op||[];r.shown=1;
 if(r.ask==null)r.ask=Math.floor(Math.random()*ASKERS.length);let ask=ASKERS[r.ask%ASKERS.length];if(crew.length<2)ask=ask.replace(/\bour\b/,'my').replace(/\bwe\b/i,'I');
 const first=esc(String(p.name||'').split(' ')[0]),all=r.sacks.every((_,i)=>r.op.includes(i));try{save();}catch(e){}
 modal(`<div class="mcard adv-wh ${n>3?'adv-wide':''}">
  <div class="adv-whtop"><div class="adv-whcrew">${crew.map(petE).join('')}</div><div class="adv-whsay"><div class="adv-bubble">${crew.length>1?"We're":"I'm"} back, ${first}!${r.tale&&!r.heard?' '+ask:r.tale?' That was the best trip ever!':''}</div>
   ${r.tale?`<button class="btn ${r.heard?'':'gold'} small" onclick="Adv.tellTale()">📣 ${r.heard?'Hear it again':'Hear our adventure!'}</button>`:''}</div></div>
  <div class="adv-diary"><p class="d">📔 ${d.e} ${d.n} · ${T.n}</p>${r.diary.map(l=>`<p>${l}</p>`).join('')}</div>
  ${r.card?`<p class="adv-whpc">📮 ${r.card.nw?`Someone mailed you a <b>postcard</b>! It's on the Postcards page.`:`Remember the <b>postcard</b> we mailed you? It's on the Postcards page.`}</p>`:''}
  <h3 class="adv-whh">🎒 What did they find? <small class="muted">${all?'':'Tap each sack!'}</small></h3>
  <div class="adv-sacks" style="--c:${n<=4?n:n<=6?3:4};--pc:${n===1?1:n===2||n===4?2:3}">${r.sacks.map((s,i)=>{const o=r.op.includes(i);return `<div class="adv-sk" id="advSk${i}"${o?' data-open="1"':''}><span class="pe">${petE(s.id)}</span><span class="nm">${esc(petN(s.id))}${s.home?' ⭐':''}</span>${o?'':`<span class="bag" role="button" tabindex="0" onclick="Adv.open(${i})">${SACK}</span>`}<span class="items">${o?itemsHTML(s,false):''}</span></div>`;}).join('')}</div>
  <p class="adv-whxp">✨ Every pet also got <b>+${r.xp} pet XP</b> from the trip.${r.grew&&r.grew.length?' '+r.grew.map(([id,st])=>`🌱 <b>${esc(petN(id))}</b> grew up: now <b>${esc(st)}</b>!`).join(' '):''}${r.litter&&r.litter.length?` 🧤 The crew also picked up <b>${r.litter.length} pieces of litter</b>! You'll sort them next.`:''}</p>
  <div class="row"><button class="btn ghost dark" id="advAll" onclick="Adv.openAll()"${all?' disabled':''}>Open all</button><button class="btn green big" id="advDone"${all?'':' disabled'} onclick="Adv.done()">Put it all away</button></div></div>`);}
function diary(){return wh();}
function sacks(){return wh();}
function openSack(i){const s=RES&&RES.sacks[i],el=document.getElementById('advSk'+i);if(!s||!el||el.dataset.open)return;el.dataset.open=1;const bag=el.querySelector('.bag');if(bag)bag.remove();
 RES.op=RES.op||[];if(!RES.op.includes(i)){RES.op.push(i);try{save();}catch(e){}}
 el.querySelector('.items').innerHTML=itemsHTML(s,true);
 const sci=s.items.find(it=>it.sci);if(sci)for(let k=0;k<4;k++)floatAt(el,sci.k==='rock'?'🪨':'🦴',k+3);
 try{s.items.some(it=>it.rare)?SFX.win():SFX.coin();}catch(e){}
 if(s.items.some(it=>it.rare))for(let k=0;k<5;k++)floatAt(el,'✨',k);
 if([...document.querySelectorAll('.adv-sk')].every(x=>x.dataset.open)){const d=document.getElementById('advDone');if(d)d.disabled=false;const oa=document.getElementById('advAll');if(oa)oa.disabled=true;const h=document.querySelector('.adv-whh small');if(h)h.textContent='';}}
function floatAt(el,ch,k){if(!el)return;const r=el.getBoundingClientRect(),f=document.createElement('span');f.className='adv-float';f.textContent=ch;f.style.left=(r.left+r.width*(.2+Math.random()*.6))+'px';f.style.top=(r.top+r.height*.4)+'px';f.style.animationDelay=(k*.12)+'s';document.body.appendChild(f);setTimeout(()=>f.remove(),2400);}
function done(){const r=RES;RES=null;BUSY_UNTIL=Date.now()+2000;try{const a=A(P());if(a.res){delete a.res;save();}}catch(e){}closeModal();draw();if(!r)return;
 const eggs=r.sacks.some(s=>s.items.some(it=>it.k==='egg'));const grew=r.grew.map(([id,st])=>`${petE(id)} ${petN(id)} is now ${st}!`);
 /* the grew-up news is already in the sacks card; the egg reminder rides along in the sorting card (no extra popup) */
 const msg=[eggs?'🥚 An egg is waiting in your backpack!':'',...(r.shown?[]:grew)].filter(Boolean).join(' ');
 /* the one extra step: sort the litter the crew picked up (and hear about any rare Science Cave find). The egg / grew-up news then rides along in that card instead of a toast that would cover it. */
 const cu=window.Cleanup&&typeof Cleanup.afterTrip==='function'&&Cleanup.wants(r);
 if(cu)setTimeout(()=>{try{Cleanup.afterTrip(r,msg);}catch(e){console.warn('cleanup',e);if(msg)toast(msg);}},350);else if(msg)setTimeout(()=>toast(msg),300);}
function treasure(){const p=P(),a=A(p);if((a.shelf.map||0)<4)return;a.shelf.map-=4;p.coins+=150;const s=pk(PET_FOODS.slice(3));p.pantry[s.id]=(p.pantry[s.id]||0)+2;p.eggs=(p.eggs||0)+1;save();SFX.win();
 modal(`<div class="mcard"><div class="big-emoji">🧰</div><h2>X marks the spot!</h2><p>Your pets dug where the map said and found a treasure chest: <b>🪙 150</b>, ${s.e}${s.e} and an <b>🥚 egg</b>!</p><div class="row"><button class="btn green big" onclick="closeModal();Adv.draw()">Woo-hoo!</button></div></div>`);}

/* big Adventure Camp block for the Pet Home page: what the crew is up to, who's out, and how long until they're back */
function petCard(p){css();const a=A(p),t=a.trip,n=slots(p);const crewHTML=ids=>`<div class="crew">${ids.map(id=>`<span><i>${petE(id)}</i>${esc(petN(id))}</span>`).join('')}</div>`;
 if(!t){const pets=(p.pets||[]).filter(id=>PETS.some(x=>x.id===id));const d=dest(a.dest);
  return `<div class="adv-pcard"><div class="ic" style="--dc:linear-gradient(160deg,${d.c1},${d.c2})">🏕️</div><div><h3>🏕️ Adventure Camp</h3>
   <div class="st">Your pets are home and ready to explore! Send up to <b>${n}</b> pet${n>1?'s':''} on a trip: 1, 6 or 12 hours.${a.trips?` <span class="muted">(${a.trips} adventure${a.trips>1?'s':''} so far)</span>`:''}</div>
   ${a.crew.length?`<div class="muted" style="font-size:13px">Your last crew:</div>${crewHTML(a.crew.filter(id=>pets.includes(id)))}`:''}</div>
   <div class="act"><button class="btn green" onclick="go('camp')">🥾 Plan a trip</button></div></div>`;}
 const d=dest(t.dest),T=TRIPS[t.len]||TRIPS.mid,done=Date.now()>=t.end,pct=Math.min(100,(Date.now()-t.start)/Math.max(1,t.end-t.start)*100),L=DOING[t.dest]||DOING.meadow;
 if(done)return `<div class="adv-pcard back"><div class="ic" style="--dc:linear-gradient(160deg,${d.c1},${d.c2})">🎒</div><div><h3>🎉 Your crew is back!</h3>
   <div class="st">They're home from <b>${d.e} ${d.n}</b> with bulging sacks. Come see what they found!</div>${crewHTML(t.crew)}</div>
   <div class="act"><button class="btn gold big" onclick="go('camp')">🎒 Open the sacks!</button></div></div>`;
 return `<div class="adv-pcard"><div class="ic" style="--dc:linear-gradient(160deg,${d.c1},${d.c2})">${d.e}</div><div><h3>${T.e} Crew is exploring ${d.n}</h3>
   <div class="st">💭 Right now they're probably ${L[Math.floor(Date.now()/9e5)%L.length]}…</div>${crewHTML(t.crew)}
   <div class="adv-meter"><i style="width:${pct.toFixed(1)}%"></i></div><div class="muted" style="font-size:13px">Back at <b>${fmtClock(t.end)}</b> ${dayWord(t.end)}</div></div>
   <div class="act"><div class="left">${fmtLeft(t.end-Date.now())}<small>to go</small></div><button class="btn ghost dark small" style="margin-top:6px" onclick="go('camp')">🏕️ Visit camp</button></div></div>`;}
/* ---------- hooks for the rest of the game ---------- */
let BUSY_UNTIL=0;
window.Adv={_fin:()=>finish(),newCards:p=>newCards(p||(typeof P==='function'?P():null)),busy:()=>!!RES||Date.now()<BUSY_UNTIL||!!document.querySelector('.adv-walker'),resume,_mail:(t)=>mail(P(),null,!!t),readCard,tellTale,_tale:(c)=>tale(P(),c),diary:()=>{try{speechSynthesis.cancel()}catch(e){};diary();},home:()=>{try{speechSynthesis.cancel()}catch(e){};wh();},readAloud:()=>spkTog(()=>readAloud(LAST_TALE||[])),petCard,away:(p,id)=>away(p,id),done:()=>done(),draw,send:f=>send(f),welcome,sacks,open:openSack,openAll:()=>{(RES?RES.sacks:[]).forEach((s,i)=>setTimeout(()=>openSack(i),i*180));},
 toggle(id){const p=P(),a=A(p);if(a.trip)return toast('Wait for your crew to come home first!');const i=a.crew.indexOf(id);if(i>=0)a.crew.splice(i,1);else{const n=slots(p);if(a.crew.length>=n)return toast(`All ${n} crew spot${n>1?'s are':' is'} full! Win more battles to open more.`);a.crew.push(id);}SFX.tap();save();draw();},
 set(k,v){const a=A(P());a[k]=v;save();draw();},tab(t){TAB=t;draw();window.scrollTo(0,0);},
 askCall(){modal(`<div class="mcard"><div class="big-emoji">📯</div><h2>Call them home early?</h2><p>They'll run right back, but they'll only have time to grab a few coins.</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Let them explore</button><button class="btn" onclick="closeModal();Adv.callHome()">Blow the horn!</button></div></div>`);},
 callHome,treasure,
 back:p=>tripDone(p),
 trip:p=>p&&p.adv&&p.adv.trip||null,
 awayCard(p,id){const t=p.adv.trip;return `<div class="panel" style="text-align:center;color:var(--ink)"><div style="font-size:70px">${petE(id)}🎒</div><h3>${esc(petN(id))} is on the adventure!</h3><p class="muted" style="font-size:16px">${Date.now()>=t.end?`${esc(petN(id))} is back at camp. Open the sacks and ${esc(petN(id))} will be home again!`:`You can feed and play with ${esc(petN(id))} again when the crew comes home.`}</p></div>`;},
 homeCard(p){const t=A(p).trip;const back=t&&Date.now()>=t.end;return `<button class="hcard adv-hc ${back?'glow':''}" onclick="go('camp')"><span class="pav"><span class="pe">🏕️</span></span><div><b>Adventure Camp</b><small>${!t?'Send your pets exploring!':back?'Your crew is back! 🎉 Open their sacks':`${t.crew.map(petE).join('')} exploring… back in ${fmtLeft(t.end-Date.now())}`}</small></div></button>`;}};
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.camp=()=>{TAB='camp';draw();};}else setTimeout(reg,30);})();
/* keep the countdown fresh while the camp is open */
setInterval(()=>{try{if(typeof curScreen==='undefined'||curScreen!=='camp'||TAB!=='camp'||document.querySelector('#modal.show')||document.querySelector('.adv-walker'))return;const p=P(),t=p&&p.adv&&p.adv.trip;if(!t)return;
 const el=document.getElementById('advLeft');const done=Date.now()>=t.end;if(done&&!document.getElementById('advWelcome'))return draw();if(el&&!done)el.textContent=`Back in ${fmtLeft(t.end-Date.now())}`;}catch(e){}},20000);
setInterval(()=>{try{if(typeof curScreen!=='undefined'&&curScreen==='pethome'&&!document.querySelector('#modal.show')){const p=P();const t=p&&p.adv&&p.adv.trip;const el=document.querySelector('.adv-pcard');if(t&&el){const w=document.createElement('div');w.innerHTML=petCard(p);el.replaceWith(w.firstElementChild);}}}catch(e){}},30000);
addEventListener('resize',()=>{try{if(curScreen==='camp'&&TAB==='camp'&&!document.querySelector('.adv-walker'))sitters();}catch(e){}});
})();
