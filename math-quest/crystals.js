/* ================= 💎 the Crystal Garden (Oct 2026, third version: tested with simulated grade 3-5 kids and a science teacher) =================
   The Lab's roof dome (lab.js). It works like a classroom crystal unit:
   • GOAL on top: grow all 6 crystals; all 6 = 🥼 Crystal Scientist (+PRIZE coins, once).
   • WHAT YOU NEED: each jar has a materials list (✓ have / ✗ missing, with Buy buttons, or 🛗 Go dig / 🔬 Identify it for the two cave
     minerals: halite = rock salt, azurite). Equipment (`EQUIP`) is bought once and kept; ingredients (`INGR`) are used up when you start.
     Start stays locked until everything is there. A brand-new kid sees ⭐ Start here on Rock Candy.
   • PREDICT (first time only): the kid picks a shape; it is saved, not graded, and checked on the last day (`j.pred`).
   • EACH DAY YOU PLAY: one scientist's choice where both answers sound reasonable (`jar.q`, real classroom steps: seeding the string,
     filtering cave salt, slow drying, wicking, safety). Good choice = a full day's growth, otherwise `WRONG_STEP` of it, and Dr. Quartz
     says why. Then the kid MEASURES the crystal on a ruler (grade 3 from 0; grade 4 the crystal starts part-way along, so subtract;
     grade 5+ also in centimetres on even days; +3 coins if right) and it goes into the JOURNAL: a table and a line graph (`j.log`).
   • LAST DAY: read the graph ("on which day did it grow the most?", +10), then the results: the prediction checked, final length,
     good choices, the Crystal Shelf (also in the cave Museum), coins, 🔬 research points (they buy cave gear), 1 in PERFECT_IN ✨ perfect,
     a 🏆 record when regrown (regrown crystals vary 85-115%), and Ozzy's Shrink Ticket (salt, sugar, water) if that ride is new, else 🔍 Zoom in.
   State p.cg = {j:{id:{d,mm,tgt,col,good,last,log[],pred}}, inv, shelf, best, n, zoom, seen, prize, mig}.
   Science checked by the teacher review: salt grows by slow evaporation (not heat), cave salt is filtered, the cave drip is the two-jar
   wool-string experiment and real stalactites take hundreds of years, copper sulfate is made from copper ores and is for scientists only. */
(function(){
'use strict';
const O='#3b2a1e',RECORD_COINS=20,PRIZE=300,PERFECT_IN=10,WRONG_STEP=.35;
const SHAPES={cube:{n:'Little cubes',svg:'<path d="M8 16 l12 -6 l12 6 l-12 6Z" fill="#fff"/><path d="M8 16 v14 l12 6 v-14Z" fill="#dee2e6"/><path d="M32 16 v14 l-12 6 v-14Z" fill="#f1f3f5"/><path d="M8 16 l12 -6 l12 6 v14 l-12 6 l-12 -6Z" fill="none" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/>'},
 chunk:{n:'Chunky slanted blocks',svg:'<path d="M6 30 L14 10 L30 8 L34 26 L20 36Z" fill="#ffdeeb" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/><path d="M14 10 L20 36 M30 8 L20 36" stroke="#3b2a1e" stroke-width="1.2" opacity=".5"/>'},
 octa:{n:'Two pyramids, base to base',svg:'<path d="M20 4 L34 20 L20 36 L6 20Z" fill="#f8f9fa"/><path d="M20 4 L20 36 L6 20Z" fill="#dee2e6"/><path d="M6 20 H34" stroke="#3b2a1e" stroke-width="1.2" opacity=".5"/><path d="M20 4 L34 20 L20 36 L6 20Z" fill="none" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/>'},
 needle:{n:'Thin needles',svg:'<g stroke="#3b2a1e" stroke-width="1.5" fill="#f1f3f5">'+[[8,34,14,6],[14,34,20,4],[20,34,24,8],[26,34,30,5],[30,34,34,10]].map(([a,b,c,d])=>`<path d="M${a} ${b} L${c} ${d} L${c+3} ${d+2} L${a+3} ${b}Z"/>`).join('')+'</g>'},
 box:{n:'A squashed, slanted box',svg:'<path d="M6 26 L14 8 L34 12 L26 32Z" fill="#339af0" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/><path d="M14 8 L26 32" stroke="#1971c2" stroke-width="2"/>'},
 column:{n:'A tall column',svg:'<rect x="14" y="4" width="12" height="32" fill="#e8dfc8" stroke="#3b2a1e" stroke-width="2"/><path d="M10 4 H30 M10 36 H30" stroke="#3b2a1e" stroke-width="3"/>'}};
/* need: what opens the jar. ride: Ozzy's Inner Space ride for the same substance. days: tends to grow. mm: full size. */
/* the Supply Cupboard. Equipment: buy once, keep forever. Ingredients: used up each time you grow one. */
const EQUIP={jars:{e:'🫙',n:'Glass jars',c:30,say:'For every experiment.'},string:{e:'🧵',n:'String & pencil',c:10,say:'To hang things in the jar.'},thermo:{e:'🌡️',n:'Thermometer',c:40,say:'To check how warm the water is.'},
 wool:{e:'🧶',n:'Wool string',c:10,say:'Wool soaks up water and carries it along.'},filter:{e:'☕',n:'Coffee filters',c:10,say:'To strain dirt out of water.'},gloves:{e:'🧤',n:'Gloves & goggles',c:50,say:'So you can watch Dr. Quartz safely.'}};
const INGR={sugar:{e:'🍬',n:'Bag of sugar',c:15},soda:{e:'🧺',n:'Washing soda',c:15},alum:{e:'🧪',n:'Alum powder',c:20,say:'A kind of salt that pickle makers use.'},epsom:{e:'🛁',n:'Epsom salt',c:15,say:'The salt people put in a bath.'},copper:{e:'🔷',n:'Copper sulfate',c:30,need:'azurite',say:'Made from copper ores like azurite.'}};
/* need: [kind,id]: 'eq' equipment, 'in' ingredient (used up), 'min' a mineral identified in the cave (not used up).
   q: one scientist's choice per day; both answers sound reasonable to a 9-year-old (teacher review); a[0] is right (shown shuffled). */
const JARS=[
 {id:'sugar',n:'Rock Candy',e:'🍬',days:5,mm:40,shape:'chunk',ride:'glucose',coins:50,need:[['eq','jars'],['eq','string'],['in','sugar']],
  how:'Mix lots of sugar into hot water (a grown-up does the hot part), roll a string in sugar, and hang it in the jar. Sugar crystals grow on the string.',
  shapeWhy:'Sugar packs together in a slanted pattern, so rock candy grows as chunky, slanted blocks.',
  q:[{q:'How much sugar goes into 1 cup of hot water?',a:['3 cups (it looks like way too much!)','Half a cup'],why:'The water must be <b>stuffed with sugar</b>, so the extra comes out as crystals.'},
   {q:'Only a few tiny crystals so far. What should you do?',a:['Wait, crystals take days to grow','Stir in more sugar'],why:'<b>Crystals grow slowly.</b> Stirring would knock them loose.'},
   {q:'Where should the jar sit?',a:['On a quiet shelf at room temperature','On a warm, sunny windowsill'],why:'<b>Slow and still</b> grows the biggest crystals. Warmth can dissolve the crystals back into the water.'},
   {q:'A hard crust covered the top, so the water can\'t dry up. What should you do?',a:['Gently break the crust','Leave the crust alone'],why:'The water needs to <b>keep drying up</b> for crystals to grow.'},
   {q:'How should you cover the jar?',a:['With a loose paper towel','With a tight lid'],why:'A paper towel keeps dust out but <b>lets water escape</b>.'}],
  q2:[{q:'Why must the water be so full of sugar?',a:['So the extra sugar comes out as crystals','So the water stays warm longer'],why:'Crystals only grow when there is <b>more sugar than the water can hold</b>.'},
   {q:'Why did we roll the string in sugar?',a:['The grains are seeds for new crystals','So the string hangs straight down'],why:'New crystals <b>grow on the seed grains</b>.'},
   {q:'Why do crystals grow bigger on a still shelf?',a:['Bumps knock new tiny crystals loose','Shelves are colder than tables'],why:'<b>No bumps</b> means the crystals already there keep growing.'},
   {q:'It grew less today than yesterday. Why?',a:['There is less extra sugar left in the water','The water got too cold to work'],why:'As crystals grow, they <b>use up the extra sugar</b>.'},
   {q:'What is rock candy made of?',a:['Sugar crystals','Frozen sugar water'],why:'Rock candy is just <b>sugar crystals</b>. It never froze.'}]},
 {id:'drip',n:'Cave Drip',e:'💧',days:5,mm:30,shape:'column',ride:'water',coins:60,need:[['eq','jars'],['eq','wool'],['in','soda']],
  how:'A model of a cave: fill two jars with washing-soda water and hang a wool string between them. The water creeps along the string and drips in the middle.',
  shapeWhy:'Each drip leaves a little solid behind: a stalactite hangs down and a stalagmite grows up underneath.',
  q:[{q:'Why does the string have to be wool?',a:['Water creeps along it','It is strong enough to hold the jars'],why:'Wool <b>soaks up water and carries it</b>, like a paper towel soaking up a spill.'},
   {q:'Where should the drips land?',a:['On a plate between the jars','Back into one of the jars'],why:'The stalagmite needs a <b>dry place to build up</b>.'},
   {q:'The string sagged and now touches the plate. What should you do?',a:['Lift it a little so drips can form','Let it touch so the water reaches the plate faster'],why:'Drips need <b>a gap to fall through</b>.'},
   {q:'In a real cave, how long does a stalactite take to grow as long as your finger?',a:['Hundreds to thousands of years','About a week'],why:'Real ones are <b>very slow</b>. Our washing-soda model dries fast.'},
   {q:'In a real cave, what happens if a stalactite and stalagmite keep growing?',a:['They meet and make a column','They stay apart forever'],why:'They <b>join into a column</b>. (In our model the stalactite often drops off first!)'}],
  q2:[{q:'What carries the water along the wool?',a:['The wool soaks it up, like a paper towel','Water evaporates and lands on the string'],why:'Water <b>creeps through the tiny gaps</b> in the wool.'},
   {q:'What is left behind when a drip dries?',a:['Solid washing soda','Nothing, it all disappears'],why:'The water leaves, <b>the solid stays</b>.'},
   {q:'Which one grows from the floor up?',a:['The stalagmite','The stalactite'],why:'Stalag<b>m</b>ites grow up from the ground (they <b>m</b>ight reach the top!).'},
   {q:'Why is our model faster than a real cave?',a:['Washing soda dries much faster than cave rock builds up','Our room is warmer than a cave'],why:'In caves, <b>limestone builds up a tiny bit</b> with every drop.'},
   {q:'What is a column?',a:['A stalactite and a stalagmite joined','A very long stalactite'],why:'A column goes <b>all the way from top to bottom</b>.'}]},
 {id:'salt',n:'Salt Cubes',e:'🧂',days:3,mm:15,shape:'cube',ride:'salt',coins:60,need:[['eq','jars'],['eq','filter'],['min','halite']],
  how:'Rock salt from the cave is dirty. Mix it into water, strain out the dirt, then let the clean salt water dry up very slowly.',
  shapeWhy:'Salt stacks itself in neat square rows, so its crystals are little cubes.',
  q:[{q:'The salt water is cloudy and brown from cave dirt. What now?',a:['Pour it through a coffee filter','Boil it to clean it'],why:'Boiling doesn\'t remove dirt. <b>A filter catches it.</b>'},
   {q:'Sugar dissolves much better in hot water. Does salt?',a:['No, hot or cold water holds about the same salt','Yes, hot water holds much more salt too'],why:'Surprise! Hot water holds <b>only a little more salt</b> than cold. So salt crystals grow as the water <b>dries up</b>, not as it cools.'},
   {q:'Where should the shallow dish go?',a:['A quiet spot at room temperature','A hot, sunny windowsill'],why:'<b>Slow drying</b> grows bigger, neater cubes.'}],
  q2:[{q:'Why filter the cave salt water?',a:['Dirt gets in the way of the crystals','It makes the water saltier'],why:'<b>Clean water</b> grows clean cubes.'},
   {q:'Why do crystals appear as the water dries up?',a:['Less water can\'t hold all the salt','The water turns into salt'],why:'The salt was there all along: <b>less water, so it comes out</b>.'},
   {q:'Why are slow-dried cubes bigger?',a:['The salt has time to stack neatly','Slow drying keeps the water colder'],why:'<b>Time to stack</b> means big, neat cubes.'}]},
 {id:'alum',n:'Alum Diamonds',e:'💠',days:5,mm:25,shape:'octa',ride:null,coins:60,need:[['eq','jars'],['eq','string'],['eq','thermo'],['in','alum']],
  how:'Mix alum into warm water. Tiny crystals form overnight: pick the best one as a "seed", hang it on a string, and it grows bigger every day.',
  shapeWhy:'Alum packs into a shape with 8 flat triangle faces, like two pyramids stuck base to base. It is called an octahedron.',
  q:[{q:'Tiny crystals formed overnight. Which one should be your seed?',a:['The clearest one with flat faces','The biggest lumpy one'],why:'A <b>clear seed</b> grows a clear crystal.'},
   {q:'How should the seed hang?',a:['In the middle, not touching anything','Touching the side of the jar'],why:'Hanging free, it <b>grows evenly</b> on every side.'},
   {q:'The thermometer shows the water slowly cooling. Is that good?',a:['Yes, it helps the seed grow','No, keep it warm'],why:'<b>Cool water holds less alum</b>, so the extra joins your seed.'},
   {q:'New tiny crystals are growing on the bottom. What should you do?',a:['Move the seed to fresh alum water','Leave them, it is fine'],why:'The little ones <b>steal alum</b> from your seed.'},
   {q:'How many faces does a perfect alum crystal have?',a:['8','6'],why:'<b>8 faces</b>: an octahedron. (A cube has 6.)'}],
  q2:[{q:'Why pick a clear seed?',a:['Clear seeds grow clear crystals','Clear seeds grow faster'],why:'The crystal <b>copies its seed</b>.'},
   {q:'Why hang the seed in the middle?',a:['So it grows evenly on every side','So it stays warm'],why:'<b>Room on every side</b> means an even shape.'},
   {q:'Why does cooling help the seed grow?',a:['Cool water holds less alum','Cold water freezes onto the seed'],why:'The <b>extra alum</b> has to go somewhere: onto your seed.'},
   {q:'Why move the seed to fresh alum water?',a:['The small crystals were using up the alum','Old alum water goes bad'],why:'<b>Fresh water</b> has alum for your seed.'},
   {q:'What is an 8-faced shape called?',a:['An octahedron','A hexagon'],why:'Octa means <b>8</b>, like an octopus.'}]},
 {id:'epsom',n:'Sparkle Snow',e:'❄️',days:2,mm:20,shape:'needle',ride:null,coins:45,need:[['eq','jars'],['in','epsom']],
  how:'Mix Epsom salt (bath salt) into hot water (a grown-up does the hot part), then cool it quickly.',
  shapeWhy:'Epsom salt usually grows as long needles. The faster it grows, the thinner the needles.',
  q:[{q:'To get lots of thin needles by tomorrow, where should the jar cool?',a:['In the fridge','On the counter'],why:'<b>Fast cooling</b> makes lots of thin needles.'},
   {q:'Why did crystals appear when the water cooled?',a:['Cold water holds less Epsom salt','Cold makes the salt freeze'],why:'It isn\'t ice! <b>Cold water holds less salt</b>, so the extra comes out.'}],
  q2:[{q:'Why are the needles so thin?',a:['They grew very fast','Epsom salt is very soft'],why:'<b>Fast growing</b> makes thin needles.'},
   {q:'What would cooling it slowly on the counter give?',a:['Fewer, thicker needles','No crystals at all'],why:'<b>Slow cooling</b> grows fewer, bigger crystals.'}]},
 {id:'copper',n:'Blue Copper',e:'🔷',days:5,mm:30,shape:'box',ride:null,coins:90,need:[['eq','jars'],['eq','gloves'],['min','azurite'],['in','copper']],
  how:'Copper sulfate is made from copper ores like the azurite you found. It is not safe to touch, so Dr. Quartz grows this one while you watch. Never try it at home!',
  shapeWhy:'Copper sulfate packs in a lopsided pattern, so its crystals are slanted blue boxes with no square corners.',
  q:[{q:'Dr. Quartz pours the hot blue liquid. What should you wear?',a:['Gloves and goggles too','Just goggles, since you are not touching it'],why:'<b>Everyone near</b> wears full safety gear.'},
   {q:'Where should the jar sit?',a:['High up, labeled, away from food','In the fridge to keep it cool'],why:'It is <b>poisonous if swallowed</b>, so never near food.'},
   {q:'Why is the water so blue?',a:['Copper makes it blue','Dr. Quartz added blue food colouring'],why:'<b>Copper in water turns it blue</b>, and copper makes azurite blue too.'},
   {q:'Lots of small crystals grew. How do you get one big one?',a:['Put the best one in fresh blue liquid','Leave them all together'],why:'<b>Alone</b>, one crystal gets all the copper sulfate.'},
   {q:'Where does the leftover blue liquid go?',a:['Back to the lab to be thrown away safely','Down the sink with lots of water'],why:'It <b>harms fish and plants</b>, so never down the drain.'}],
  q2:[{q:'Where does copper sulfate come from?',a:['Copper ores like azurite, treated in a lab','Crushed blue glass'],why:'It is <b>made from copper</b> dug out of the ground.'},
   {q:'Why does everyone near wear goggles?',a:['Splashes can hurt eyes','So the bright blue won\'t hurt their eyes'],why:'<b>Eyes first!</b> Splashes happen.'},
   {q:'Why keep it away from food?',a:['It is poisonous if swallowed','It makes food spoil faster'],why:'<b>Never near food</b>: it makes people sick.'},
   {q:'Why grow one crystal alone?',a:['It gets all the copper sulfate','It grows straighter that way'],why:'<b>No sharing</b> means one big crystal.'},
   {q:'Why never pour it down the sink?',a:['It harms fish and plants','It blocks the pipes'],why:'Drains lead to rivers: <b>keep it out</b>.'}]}];
const J=id=>JARS.find(x=>x.id===id);
const COLORS=[{id:'',n:'Clear',c:'#ffdeeb',c2:'#ffc9de'},{id:'pink',n:'Pink',c:'#fcc2d7',c2:'#f783ac'},{id:'blue',n:'Blue',c:'#a5d8ff',c2:'#74c0fc'}];
const esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const has=(p,kind,id)=>{const s=st(p);if(kind==='eq')return !!s.inv[id];if(kind==='in')return (s.inv[id]||0)>0;if(kind==='min')return !!(p.cave&&p.cave.idd&&p.cave.idd[id]);return false;};
const item=(kind,id)=>kind==='eq'?EQUIP[id]:kind==='in'?INGR[id]:null;
function missing(p,jar){return jar.need.filter(([k,id])=>!has(p,k,id));}

/* ---------- state ---------- */
function st(p){p.cg=p.cg||{};const s=p.cg;s.j=s.j||{};s.zoom=s.zoom||{};s.shelf=s.shelf||[];s.best=s.best||{};s.n=s.n||{};s.inv=s.inv||{};s.seen=s.seen||{};
 if(!s.mig){s.mig=1;try{const g=p.cave&&p.cave.garden;if(g&&g.stage>0&&!s.j.drip)s.j.drip={d:Math.min(4,g.stage),mm:Math.round(Math.min(4,g.stage)*30/5),last:g.last||'',good:Math.min(4,g.stage)};}catch(e){}}
 if(s.mig<2){s.mig=2;/* version 2: jars already growing keep going; anyone who started a jar already has its equipment */Object.keys(s.j).forEach(id=>{const jar=J(id);if(jar)jar.need.forEach(([k,x])=>{if(k==='eq')s.inv[x]=1;});});Object.keys(s.n).forEach(id=>{const jar=J(id);if(jar)jar.need.forEach(([k,x])=>{if(k==='eq')s.inv[x]=1;});s.seen[id]=1;});}
 return s;}
function due(p){const s=st(p);return JARS.filter(jar=>{const j=s.j[jar.id];return j&&j.d<jar.days&&j.last!==dayKey();}).length;}
function rideDone(p,jar){try{if(st(p).zoom[jar.id])return true;return !!(jar.ride&&p.inner&&p.inner.album&&p.inner.album[jar.ride]!=null);}catch(e){return false;}}
const ZOOMS=['salt','sugar','drip'];
function where(id){try{const m=window.CAVE_DATA.MIN[id];const L=window.CAVE_DATA.LAYERS.find(x=>x.id===m.L[0]);return `${L.e} ${esc2(L.n)}`;}catch(e){return 'the cave';}}
function carrying(p,id){try{return ((p.cave&&p.cave.pack)||[]).some(x=>x&&x.t==='m'&&x.id===id);}catch(e){return false;}}

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


/* ---------- screens ---------- */
let VIEW=null; /* null = the garden | need | guess | saved | col | tend | meas | journal | most | done | zoom */
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
.cg-zoom{width:100%;max-width:220px;height:auto;display:block;margin:6px auto}
.cg-goal{background:#e5dbff;border-radius:12px;padding:8px 12px;margin:4px 0 8px;font-size:15px;color:#2b2250}.cg-n{float:right;font-weight:700;color:#5f3dc4}
.cg-mat{display:flex;align-items:center;gap:10px;background:#f6f3ff;border-radius:12px;padding:8px 10px;margin:6px 0}.cg-mat.ok{background:#ebfbee}.cg-mat.no{background:#fff5f5}
.cg-tick{font-size:18px}.cg-mi{font-size:26px}.cg-mt{flex:1}.cg-mt b{display:block;color:#2b2250}.cg-mt small{color:#6a5fa0;font-size:13px}
.cg-q{font-size:18px;font-weight:700;margin:4px 0 10px;color:#2b2250}.cg-shapebig{width:110px;height:110px}.cg-rulerpic{width:100%;max-width:560px;height:auto;display:block;margin:4px auto}
.cg-row .btn:disabled{opacity:.45}.cg-jar{position:relative}.cg-first{box-shadow:0 0 0 4px #ffd43b}.cg-star{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#ffd43b;color:#5a3b00;font-weight:700;font-size:12px;border-radius:999px;padding:2px 10px;white-space:nowrap}
.cg-jr{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}.cg-tab{border-collapse:collapse;font-size:15px;color:#2b2250}.cg-tab td,.cg-tab th{padding:4px 10px;border-bottom:1px solid #e6e0ff;text-align:left}.cg-graph{width:100%;max-width:320px;height:auto;border:2px solid #e6e0ff;border-radius:10px}.cg-prize{background:#ffe8cc}`;document.head.appendChild(s);}
function card(inner){css();modal(`<div class="mcard cg-card">${inner}</div>`);}
function open(){VIEW=null;draw();}
function draw(){const p=P();if(!p)return;const s=st(p);const k=VIEW&&VIEW.k;
 const F={need:drawNeed,guess:drawGuess,saved:drawGuess,col:drawCol,tend:drawTend,meas:drawMeas,journal:drawJournal,most:drawMost,done:drawDone,zoom:drawZoom}[k];if(F)return F(p,s);
 const kinds=JARS.filter(j=>s.n[j.id]).length,fresh=!kinds&&!Object.keys(s.j).length;
 const cells=JARS.map(jar=>{const j=s.j[jar.id],kk=j?Math.min(1,j.mm/jar.mm):(s.n[jar.id]?1:0),miss=missing(p,jar);let btn,line;
  if(j&&(j.log||[]).length<j.d){btn=`<button class="btn gold small" onclick="CG.meas('${jar.id}')">📏 Measure ${j.d>=jar.days?'and finish':'today'}</button>`;line=`Day ${j.d} of ${jar.days}: time to measure`;}
  else if(j&&j.d>=jar.days){btn=`<button class="btn gold small" onclick="CG.journal('${jar.id}')">📓 Finish the journal</button>`;line='Fully grown!';}
  else if(j&&j.last===dayKey()){btn=`<button class="btn ghost dark small" onclick="CG.journal('${jar.id}')">📓 Journal</button>`;line=`Day ${j.d} of ${jar.days} done · come back tomorrow`;}
  else if(j){btn=`<button class="btn green small" onclick="CG.tend('${jar.id}')">🔬 Day ${j.d+1}: check on it</button>`;line=`Day ${j.d} of ${jar.days} · ${j.mm} mm`;}
  else if(!miss.length){btn=`<button class="btn gold small" onclick="CG.need('${jar.id}')">✨ Start the experiment</button>`;line=s.n[jar.id]?`Grown ${s.n[jar.id]}× · record ${s.best[jar.id]} mm`:'Ready to start!';}
  else{btn=`<button class="btn ghost dark small" onclick="CG.need('${jar.id}')">📋 What do I need?</button>`;line=`Need ${miss.length}`+(miss.length<=2?': '+miss.map(([kk,id])=>kk==='min'?window.CAVE_DATA.MIN[id].n:item(kk,id).n).join(', '):' things');}
  const star=fresh&&jar.id==='sugar'?'<span class="cg-star">⭐ Start here</span>':'';
  return `<div class="cg-jar${star?' cg-first':''}">${star}${svg(jar.id,kk,j&&j.col)}<b>${jar.e} ${esc2(jar.n)}</b><small>${line}</small><div class="cg-bar"><i style="width:${j?Math.round(j.d/jar.days*100):s.n[jar.id]?100:0}%"></i></div>${btn}${ZOOMS.includes(jar.id)&&rideDone(p,jar)&&s.n[jar.id]?`<button class="btn ghost dark small" style="margin-top:4px" onclick="CG.zoom('${jar.id}')">🔍 Zoom in</button>`:''}</div>`;}).join('');
 card(`<h2>💎 Crystal Garden</h2><div class="cg-goal">${s.prize?'🥼 <b>Crystal Scientist!</b> You grew all 6. Keep beating your records!':`<b>Goal:</b> grow all 6 crystals. 🥼 Grow them all to become a Crystal Scientist (+300 🪙)!`}<span class="cg-n">${kinds} of 6</span></div>
  <p class="cg-sub">${fresh?'Each crystal is a real experiment. Start with ⭐ Rock Candy!':'Check on each jar once a day you play: make the scientist\'s choice, then measure it. <b>Tip:</b> you can grow several jars at the same time!'}</p>
  <div class="cg-shelf">${cells}</div>${shelfHTML(p)}<div class="cg-row"><button class="btn ghost dark" onclick="closeModal()">Close</button></div>`);}
function shelfHTML(p){p=p||P();if(!p)return '';const s=st(p);if(!s.shelf.length)return '';
 return `<h3 style="margin:14px 0 4px">🏆 Crystal Shelf</h3><div class="cg-sh">${s.shelf.slice(-12).reverse().map(c=>{const jar=J(c.id);return jar?`<div class="cg-it">${svg(c.id,1,c.col)}<b>${c.pf?'✨ ':''}${esc2(jar.n)}</b>${c.mm} mm</div>`:'';}).join('')}</div>`;}
/* the materials list: what you need, what you have, what is missing and how to get it */
function need(id){const p=P(),jar=J(id);if(!p||!jar)return;try{SFX.tap();}catch(e){}VIEW={k:'need',id};draw();}
function drawNeed(p,s){const jar=J(VIEW.id),miss=missing(p,jar);
 const rows=jar.need.map(([k,id])=>{const ok=has(p,k,id);
  if(k==='min'){const m=window.CAVE_DATA.MIN[id];const car=carrying(p,id);return `<div class="cg-mat ${ok?'ok':'no'}"><span class="cg-tick">${ok?'✅':'❌'}</span><span class="cg-mi">🪨</span><div class="cg-mt"><b>${esc2(m.n)}${id==='halite'?' (rock salt)':''}</b><small>${ok?'You found it in the cave and identified it.':car?'<b>You are carrying one!</b> Test it at the Field Lab bench to find out what it is.':`Find it in the cave (${where(id)}), then test it at the 🔬 Field Lab bench to identify it.`}</small></div>${ok?'':car?`<button class="btn gold small" onclick="CG.bench()">🔬 Identify it</button>`:`<button class="btn ghost dark small" onclick="CG.dig()">🛗 Go dig</button>`}</div>`;}
  const it=item(k,id),cnt=k==='in'?(s.inv[id]||0):0,lockd=it.need&&!has(p,'min',it.need);
  return `<div class="cg-mat ${ok?'ok':'no'}"><span class="cg-tick">${ok?'✅':'❌'}</span><span class="cg-mi">${it.e}</span><div class="cg-mt"><b>${esc2(it.n)}</b><small>${it.say&&it.say!=='(old)'?esc2(it.say)+' ':''}${k==='eq'?(ok?'Yours to keep.':'Buy once, keep forever.'):(ok?`You have ${cnt}. Starting uses 1.`:'Used up each time you grow one.')}${lockd?` Dr. Quartz only has it once you've identified ${esc2(window.CAVE_DATA.MIN[it.need].n.toLowerCase())}.`:''}</small></div>${!ok&&!lockd?`<button class="btn gold small" onclick="CG.buy('${k}','${id}')" ${(p.coins||0)<it.c?'disabled':''}>Buy 🪙 ${it.c}</button>`:''}</div>`;}).join('');
 card(`<h2>${jar.e} ${esc2(jar.n)}</h2><div class="cg-fact">🔬 <b>Dr. Quartz:</b> ${esc2(jar.how)}</div><h3 style="margin:10px 0 6px">📋 What you need</h3>${rows}
  <p class="cg-sub" style="margin:10px 0 0">${miss.length?`You still need <b>${miss.length}</b> thing${miss.length>1?'s':''}. You have 🪙 ${(p.coins||0).toLocaleString()}.`:'<b>✅ You have everything!</b>'}</p>
  <div class="cg-row"><button class="btn ghost dark" onclick="CG.back()">← Crystal Garden</button><button class="btn green" onclick="CG.start('${jar.id}')" ${miss.length?'disabled':''}>✨ Start the experiment</button></div>`);}
function buy(k,id){const p=P(),it=item(k,id);if(!p||!it)return;if(it.need&&!has(p,'min',it.need))return;if((p.coins||0)<it.c){toast(`🪙 You need ${it.c-(p.coins||0)} more coins.`);return;}
 const s=st(p);if(k==='eq'){if(s.inv[id])return;s.inv[id]=1;}else s.inv[id]=(s.inv[id]||0)+1;p.coins-=it.c;save();try{SFX.coin();}catch(e){}toast(`${it.e} ${it.n}: bought!`);draw();}
function dig(){try{closeModal();}catch(e){}try{if(window.Lab&&Lab.tap)Lab.tap('elev');}catch(e){}}
/* starting: everything must be there; ingredients are used up; the first time, a prediction (checked on the last day) */
/* each day's share of the growth: real crystals grow fastest at first, then slow down; a little natural variety; no two days equal */
function weights(n){let w=[];for(let i=0;i<n;i++)w.push(Math.sin(Math.PI*(i+.7)/(n+.4))*(.8+Math.random()*.4));const t=w.reduce((a,b)=>a+b,0);w=w.map(x=>x/t);
 for(let i=1;i<n;i++)if(Math.abs(w[i]-w[i-1])<.04/n){w[i]*=.9;}const t2=w.reduce((a,b)=>a+b,0);return w.map(x=>Math.round(x/t2*1000)/1000);}
function start(id){const p=P(),jar=J(id);if(!p||!jar)return;const s=st(p);if(s.j[id]||missing(p,jar).length)return;
 jar.need.forEach(([k,x])=>{if(k==='in')s.inv[x]=Math.max(0,(s.inv[x]||0)-1);});
 s.j[id]={d:0,mm:0,tgt:s.n[id]?Math.round(jar.mm*(.85+Math.random()*.3)):jar.mm,col:'',good:0,last:'',log:[],pred:'',w:weights(jar.days)};save();try{SFX.coin();}catch(e){}
 VIEW=s.seen[id]?(id==='sugar'?{k:'col',id}:null):{k:'guess',id};if(!VIEW){tend(id);return;}draw();}
const PAIRS={chunk:'box',box:'chunk'};
function drawGuess(p,s){const jar=J(VIEW.id);
 if(VIEW.k==='saved'){card(`<h2>📝 Prediction saved!</h2><div class="cg-big"><svg viewBox="0 0 40 40" class="cg-shapebig">${SHAPES[VIEW.pick].svg}</svg><div style="flex:1;min-width:200px"><p style="margin:0 0 6px;font-size:18px">You predicted: <b>${esc2(SHAPES[VIEW.pick].n.toLowerCase())}</b>.</p><p class="cg-sub" style="margin:0">On the last day you'll see if you were right. Scientists don't know the answer before they start: that's why they experiment!</p></div></div><div class="cg-row"><button class="btn green" onclick="CG._go()">Let's grow it! ➜</button></div>`);return;}
 const wrong=Object.keys(SHAPES).filter(k=>k!==jar.shape&&k!==PAIRS[jar.shape]);const opts=VIEW.opts||(VIEW.opts=[jar.shape,...wrong.sort(()=>Math.random()-.5).slice(0,2)].sort(()=>Math.random()-.5));
 card(`<h2>${jar.e} ${esc2(jar.n)}: make a prediction</h2><p style="margin:4px 0 10px">Scientists guess first, then test. <b>What shape do you think these crystals will grow into?</b> You'll find out on the last day.</p><div class="cg-opts">${opts.map(k=>`<button class="cg-shape" onclick="CG._guess('${k}')"><svg viewBox="0 0 40 40">${SHAPES[k].svg}</svg><span>${SHAPES[k].n}</span></button>`).join('')}</div>`);}
function guess(k){const p=P();if(!p||!VIEW||VIEW.k!=='guess')return;const s=st(p),j=s.j[VIEW.id];if(j)j.pred=k;s.seen[VIEW.id]=1;save();try{SFX.tap();}catch(e){}VIEW={k:'saved',id:VIEW.id,pick:k};draw();}
function go(){const id=VIEW&&VIEW.id;if(!id)return;if(id==='sugar'){VIEW={k:'col',id};draw();return;}tend(id);}
function drawCol(p,s){card(`<h2>🍬 Rock Candy</h2><p class="cg-sub">One drop of food colouring: what colour should yours be?</p><div class="cg-opts">${COLORS.map(c=>`<button class="cg-shape" onclick="CG._col('${c.id}')">${svg('sugar',1,c.id,'')}<span>${c.n}</span></button>`).join('')}</div>`);}
function pickCol(c){const p=P();if(!p||!VIEW)return;const j=st(p).j[VIEW.id];if(j){j.col=c;save();}tend(VIEW.id);}
/* each day: one scientist's choice */
function tend(id){const p=P(),jar=J(id);if(!p||!jar)return;const s=st(p),j=s.j[id];if(!j||j.d>=jar.days||j.last===dayKey()){VIEW=null;draw();return;}
 if((j.log||[]).length<j.d){meas(id);return;} /* yesterday's measuring first */
 const set=(s.n[id]%2===1&&jar.q2)?'q2':'q';VIEW={k:'tend',id,set,qi:j.d%jar[set].length,order:[0,1].sort(()=>Math.random()-.5),pick:null};try{SFX.tap();}catch(e){}draw();}
function choose(i){const p=P();if(!p||!VIEW||VIEW.k!=='tend'||VIEW.pick!=null)return;const jar=J(VIEW.id),s=st(p),j=s.j[VIEW.id];if(!j||j.last===dayKey())return;
 const good=i===0,T=j.tgt||jar.mm,step=j.w&&j.w[j.d]!=null?T*j.w[j.d]:T/jar.days,y=j.mm;j.d++;if(good)j.good=(j.good||0)+1;j.mm=Math.min(T,Math.max(y+1,Math.round(y+(good?step:step*WRONG_STEP))));if(j.d>=jar.days&&j.good>=jar.days)j.mm=T;if(j.d<jar.days&&j.mm>=T)j.mm=T-(jar.days-j.d);j.last=dayKey();
 j.log=j.log||[];while(j.log.length<j.d-1)j.log.push(null);save();try{good?SFX.correct():SFX.wrong();}catch(e){}VIEW.pick=i;draw();}
function drawTend(p,s){const v=VIEW,jar=J(v.id),j=s.j[v.id],Q=jar[v.set||'q'][v.qi];const k=j?Math.min(1,j.mm/jar.mm):0;
 const body=v.pick==null?`<p class="cg-q">${esc2(Q.q)}</p><div class="cg-opts">${v.order.map(i=>`<button class="btn gold" onclick="CG._choose(${i})">${esc2(Q.a[i])}</button>`).join('')}</div>`
  :`<p class="cg-q">${v.pick===0?'✅ Good thinking!':'🤔 Not the best choice.'}</p><div class="cg-fact">🔬 <b>Dr. Quartz:</b> ${v.pick===0?'':`The better choice was “${esc2(Q.a[0])}”. `}${Q.why}</div><p style="margin:6px 0">${v.pick===0?'It grew well today!':'It only grew a little today.'} How much? Measure it and see!</p>
   <div class="cg-row"><button class="btn gold" onclick="CG.meas('${jar.id}')">📏 Measure it</button></div>`;
 card(`<h2>${jar.e} ${esc2(jar.n)} · Day ${v.pick==null?(j?j.d+1:1):j.d} of ${jar.days}</h2><div class="cg-big">${svg(jar.id,k,j&&j.col)}<div style="flex:1;min-width:220px">${body}</div></div>`);}
/* measuring every day: read the ruler. Grade 3: from 0; grade 4: the crystal starts part-way along; grade 5+: also in centimetres */
function lvl(p){const g=+p.grade||3;return g<=3?0:g===4?1:2;}
function meas(id){const p=P(),jar=J(id);if(!p||!jar)return;const j=st(p).j[id];if(!j||(j.log||[]).length>=j.d)return;const L=lvl(p),v=j.mm,off=L?5+Math.floor(Math.random()*11):0,cm=L>=2&&j.d%2===0;
 const pool=L===0?[v-5,v-3,v+3,v+5]:cm?[v*10,off+v,v+2]:[v-2,v-1,v+1,v+2,off+v]; /* grade 5 cm traps: the mm number read as cm, and the end mark */let wrong=[...new Set(pool.filter(x=>x>0&&x!==v&&x!==off+v))].sort(()=>Math.random()-.5);if(L)wrong.unshift(off+v); /* reading the end instead of subtracting */if(cm&&!wrong.includes(v*10))wrong.splice(1,0,v*10);
 const opts=[v,...wrong.slice(0,2)].sort((a,b)=>a-b);VIEW={k:'meas',id,off,cm,opts,pick:null};try{SFX.tap();}catch(e){}draw();}
function rulerPic(id,off,mm,col,cmL){const span=Math.max(20,Math.ceil((off+mm+4)/10)*10),px=v=>20+v/span*420,lab=cmL?10:span<=20?5:10;let r='';
 for(let v=0;v<=span;v++){const x=px(v),big=v%lab===0,mid=v%5===0;r+=`<path d="M${x} 110 v${big?-22:mid?-15:-9}" stroke="${O}" stroke-width="${big?2:1}"/>`;if(big)r+=`<text x="${x}" y="128" text-anchor="middle" font-size="12" font-family="Fredoka,sans-serif" fill="${O}">${cmL?v/10:v}</text>`;}
 const c=COLORS.find(x=>x.id===(col||''))||COLORS[0],cc={sugar:c.c,salt:'#f1f3f5',alum:'#f8f9fa',epsom:'#e7f5ff',copper:'#339af0',drip:'#e8dfc8'}[id]||'#dee2e6',a=px(off),b=px(off+mm),e=Math.min(8,(b-a)/3);
 return `<svg viewBox="0 0 460 136" class="cg-rulerpic"><rect x="10" y="84" width="440" height="50" rx="4" fill="#ffe8a3" stroke="${O}" stroke-width="2"/>${r}<text x="446" y="100" text-anchor="end" font-size="11" font-family="Fredoka,sans-serif" fill="${O}">${cmL?'cm':'mm'}</text>
  <path d="M${a} 60 L${a+e} 40 L${b-e} 38 L${b} 58 L${b-e*.8} 76 L${a+e*.8} 78 Z" fill="${cc}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${a} 30 V86 M${b} 30 V86" stroke="#e03131" stroke-width="1.5" stroke-dasharray="4 3"/></svg>`;}
const fmtL=(v,cm)=>cm?`${+(v/10).toFixed(1)} cm`:`${v} mm`;
function drawMeas(p,s){const v=VIEW,jar=J(v.id),j=s.j[v.id];if(!j){VIEW=null;draw();return;}
 const ask=v.off?`The crystal does <b>not</b> start at 0! Find where it starts and where it ends. <b>How long is it${v.cm?' in centimetres':''}?</b>${v.cm?' (10 mm = 1 cm)':''}`:'<b>How long is the crystal?</b> It starts at 0. Find where its end lines up.';
 const body=v.pick==null?`<div class="cg-opts" style="margin-top:8px">${v.opts.map(o=>`<button class="btn gold" onclick="CG._meas(${o})">${fmtL(o,v.cm)}</button>`).join('')}</div>`
  :`<p class="cg-q" style="margin-top:8px">${v.pick===j.mm?`✅ Yes! It is ${fmtL(j.mm,v.cm)} long. +3 🪙`:`🤔 Not quite. ${v.off?`It starts at ${v.off} and ends at ${v.off+j.mm}, so it is ${v.off+j.mm} − ${v.off} = `:'Its end lines up with '}<b>${j.mm} mm</b>${v.cm?` = ${(j.mm/10).toFixed(1)} cm`:''}.`}</p><div class="cg-row"><button class="btn green" onclick="CG.journal('${jar.id}')">📓 Write it in the journal ➜</button></div>`;
 card(`<h2>📏 Day ${j.d}: measure your ${esc2(jar.n)}</h2><p style="margin:4px 0 8px">${ask}</p>${rulerPic(jar.id,v.off,j.mm,j.col,lvl(p)>=1)}${body}`);}
function measured(o){const p=P();if(!p||!VIEW||VIEW.k!=='meas'||VIEW.pick!=null)return;const s=st(p),j=s.j[VIEW.id];if(!j)return;
 j.log=j.log||[];while(j.log.length<j.d-1)j.log.push(null);j.log[j.d-1]=j.mm;if(o===j.mm){p.coins=(p.coins||0)+3;try{SFX.coin();}catch(e){}}else{try{SFX.wrong();}catch(e){}}VIEW.pick=o;save();draw();}
/* the journal: a table and a line graph of the measurements */
function journal(id){VIEW={k:'journal',id};try{SFX.tap();}catch(e){}draw();}
function graph(jar,log,T,prev){const n=jar.days,W=300,H=150,x=d=>34+(d-1)/(Math.max(1,n-1))*(W-50),max=Math.max(10,Math.ceil(Math.max(T,...log.filter(v=>v!=null))/10)*10),y=v=>H-24-v/max*(H-40);let s=`<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#fff"/>`;
 for(let v=0;v<=max;v+=max/2)s+=`<path d="M30 ${y(v)} H${W-10}" stroke="#e9ecef"/><text x="26" y="${y(v)+4}" text-anchor="end" font-size="10" fill="#868e96" font-family="Fredoka,sans-serif">${v}</text>`;
 for(let d=1;d<=n;d++)s+=`<text x="${x(d)}" y="${H-8}" text-anchor="middle" font-size="10" fill="#868e96" font-family="Fredoka,sans-serif">Day ${d}</text>`;
 if(prev&&prev.length>1){const pp=prev.map((v,i)=>v==null?null:[x(i+1),y(v)]).filter(Boolean);s+=`<polyline points="${pp.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#adb5bd" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${W-12}" y="22" text-anchor="end" font-size="10" fill="#868e96" font-family="Fredoka,sans-serif">- - last time</text>`;}
 const pts=log.map((v,i)=>v==null?null:[x(i+1),y(v)]).filter(Boolean);if(pts.length>1)s+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#7048e8" stroke-width="3"/>`;pts.forEach(([a,b])=>{s+=`<circle cx="${a}" cy="${b}" r="5" fill="#7048e8"/>`;});
 return `<svg viewBox="0 0 ${W} ${H}" class="cg-graph">${s}<text x="8" y="14" font-size="10" fill="#868e96" font-family="Fredoka,sans-serif">mm</text></svg>`;}
const NOTICE=['✨ More crystals','📏 Bigger crystals','😐 Looks the same'];
function notice(i){const p=P();if(!p||!VIEW)return;const j=st(p).j[VIEW.id];if(!j)return;j.obs=j.obs||[];j.obs[j.d-1]=i;save();try{SFX.tap();}catch(e){}draw();}
function drawJournal(p,s){const jar=J(VIEW.id),j=s.j[VIEW.id];if(!j){VIEW=null;draw();return;}const log=j.log||[],obs=j.obs||[];
 const rows=log.map((v,i)=>{const prev=i?log[i-1]:0;return `<tr><td>Day ${i+1}</td><td>${v==null?'—':v+' mm'}</td><td>${v==null||prev==null?'—':'+'+(v-prev)+' mm'}</td><td>${obs[i]!=null?NOTICE[obs[i]].split(' ')[0]:''}</td></tr>`;}).join('');
 const ask=log.length>=j.d&&j.d>0&&obs[j.d-1]==null?`<div class="cg-fact">🔎 <b>What do you notice today?</b> <span class="cg-opts" style="display:inline-flex;margin-left:6px">${NOTICE.map((t,i)=>`<button class="btn ghost dark small" onclick="CG._notice(${i})">${t}</button>`).join('')}</span></div>`:'';
 const end=j.d>=jar.days&&log.length>=jar.days;
 card(`<h2>📓 ${esc2(jar.n)} journal</h2><div class="cg-jr"><table class="cg-tab"><tr><th>Day</th><th>Length</th><th>Grew</th><th>Noticed</th></tr>${rows}</table>${graph(jar,log,j.tgt||jar.mm,s.n[jar.id]&&s.prev&&s.prev[jar.id])}</div>${ask}
  <div class="cg-row">${end?`<button class="btn gold" onclick="CG._most()">📈 Read the graph ➜</button>`:`<span class="cg-sub">Come back tomorrow for day ${j.d+1} of ${jar.days}.</span><button class="btn ghost dark" onclick="CG.back()">← Crystal Garden</button>`}</div>`);}
/* the last day: read the graph, then the results */
/* reading the graph on the last day: the question rotates (grew the most / grew the least / how much between two days) */
function most(){const p=P();if(!p||!VIEW)return;const s=st(p),id=VIEW.id,j=s.j[id];if(!j)return;const log=(j.log||[]).map(v=>v||0),n=log.length,g=grew(log),L=lvl(p),prev=s.n[id]&&s.prev&&s.prev[id];
 const kinds=prev&&prev.length===n&&s.n[id]%2===1?['compare']:L>=2?['avg','span','next']:L===1?['span','most','least']:['most','least','span'];let t=kinds[(s.shelf.length+n)%kinds.length];if(t==='span'&&n<3)t='most';
 let q,opts,right,ans,tip;const mmO=x=>({v:x,l:x+' mm'});const mix=a=>{const u=[];a.forEach(o=>{if(!u.some(x=>x.v===o.v))u.push(o);});return u.slice(0,3).sort(()=>Math.random()-.5);};
 if(t==='span'){const a=Math.floor(Math.random()*(n-2)),b=a+2+Math.floor(Math.random()*(n-a-2));right=log[b]-log[a];q=`How much did it grow from <b>day ${a+1}</b> to <b>day ${b+1}</b>?`;opts=mix([mmO(right),mmO(log[b]),mmO(right+3),mmO(Math.max(1,right-2))]);ans=right+' mm';tip='Find both days on the graph and subtract the smaller length from the bigger one.';}
 else if(t==='avg'){const r1=x=>Math.round(x*10)/10;right=r1(log[n-1]/n);q=`It grew <b>${log[n-1]} mm</b> in <b>${n} days</b>. About how much is that <b>each day</b> on average?`;opts=mix([{v:right,l:right+' mm'},{v:r1(log[n-1]/(n-1)),l:r1(log[n-1]/(n-1))+' mm'},{v:log[n-1]-n,l:(log[n-1]-n)+' mm'}]);ans=`${log[n-1]} ÷ ${n} = ${right} mm a day`;tip='Share the total equally between the days: divide.';}
 else if(t==='next'){right=log[n-1]+g[n-1];q=`On its last day it grew <b>+${g[n-1]} mm</b>. If it kept growing like that, how long would it be on <b>day ${n+1}</b>?`;opts=mix([mmO(right),mmO(log[n-1]),mmO(log[n-1]+g[0])]);ans=`${log[n-1]} + ${g[n-1]} = ${right} mm`;tip='Add the last day\'s growth to the last length.';}
 else if(t==='compare'){right=Math.sign(log[n-1]-prev[n-1]);q=`Look at both lines. On the last day, was this crystal <b>longer or shorter</b> than last time?`;opts=[{v:1,l:'Longer'},{v:-1,l:'Shorter'},{v:0,l:'The same'}];ans=right>0?`longer (${log[n-1]} mm vs ${prev[n-1]} mm)`:right<0?`shorter (${log[n-1]} mm vs ${prev[n-1]} mm)`:`the same (${log[n-1]} mm)`;tip='The purple line is this time and the grey dashed line is last time: compare them at the last day.';}
 else{right=t==='least'?Math.min(...g):Math.max(...g);q=`On which day did your crystal grow the <b>${t==='least'?'least':'most'}</b>?`;opts=g.map((x,i)=>({v:x,l:'Day '+(i+1)}));ans=`day ${g.indexOf(right)+1} (+${right} mm)`;tip=t==='least'?'Look for the flattest part of the line.':'Look for the steepest part of the line.';}
 if(!opts.some(o=>o.v===right))opts[0]=t==='avg'?{v:right,l:right+' mm'}:mmO(right);
 VIEW={k:'most',id,t,q,opts,right,ans,tip,pick:null};try{SFX.tap();}catch(e){}draw();}
const grew=log=>log.map((v,i)=>(v||0)-(i?(log[i-1]||0):0));
function drawMost(p,s){const v=VIEW,jar=J(v.id),j=s.j[v.id];if(!j){VIEW=null;draw();return;}
 const body=v.pick==null?`<div class="cg-opts">${v.opts.map((o,i)=>`<button class="btn gold" onclick="CG._mostPick(${i})">${o.l}</button>`).join('')}</div>`
  :`<p class="cg-q">${v.opts[v.pick].v===v.right?`✅ Yes! ${v.ans}. +10 🪙`:`🤔 ${v.tip} The answer is ${v.ans}.`}</p><div class="cg-row"><button class="btn green" onclick="CG._finish()">🎉 See the results ➜</button></div>`;
 card(`<h2>📈 Read your graph</h2>${graph(jar,j.log||[],j.tgt||jar.mm,s.n[jar.id]&&s.prev&&s.prev[jar.id])}<p style="margin:8px 0">${v.q}</p>${body}`);}
function mostPick(i){const p=P();if(!p||!VIEW||VIEW.k!=='most'||VIEW.pick!=null)return;if(VIEW.opts[i].v===VIEW.right){p.coins=(p.coins||0)+10;save();try{SFX.correct();}catch(e){}}else{try{SFX.wrong();}catch(e){}}VIEW.pick=i;draw();}
/* the results: prediction checked, the shelf, rewards, Ozzy's ticket or Zoom in, the all-6 prize */
function finish(){const p=P();if(!p||!VIEW)return;const id=VIEW.id,jar=J(id),s=st(p),j=s.j[id];if(!j||j.d<jar.days)return;
 const lastRun=(s.shelf.filter(x=>x.id===id).slice(-1)[0])||null,pf=Math.random()<1/PERFECT_IN,first=!s.n[id],prev=s.best[id]||0,rec=!first&&j.mm>prev,predOK=!!j.pred&&j.pred===jar.shape;
 const coins=Math.round((jar.coins+j.mm)*(pf?2:1))+(first?25:0)+(rec?RECORD_COINS:0);p.coins=(p.coins||0)+coins;try{p.cave=p.cave||{};p.cave.rp=(p.cave.rp||0)+5+(predOK?5:0);}catch(e){}
 s.prev=s.prev||{};s.prev[id]=(j.log||[]).slice();s.shelf.push({id,mm:j.mm,col:j.col||'',pf:pf?1:0,at:dayKey()});if(s.shelf.length>60)s.shelf.splice(0,s.shelf.length-60);s.n[id]=(s.n[id]||0)+1;s.best[id]=Math.max(prev,j.mm);delete s.j[id];
 let tix=null,zoomNow=false,full=false;try{if(jar.ride){const al=p.inner&&p.inner.album;if(al&&al[jar.ride]!=null){if(!s.zoom[id]){s.zoom[id]=1;zoomNow=true;}}else if(window.Inner&&Inner.awardRide){tix=Inner.awardRide(p,jar.ride);if(!tix){full=!!(Inner.isFull&&Inner.isFull(p));if(!full&&!s.zoom[id]){s.zoom[id]=1;zoomNow=true;}}}}}catch(e){}
 const kinds=JARS.filter(x=>s.n[x.id]).length;let prize=false;if(kinds>=6&&!s.prize){s.prize=1;p.coins+=PRIZE;prize=true;}
 save();try{SFX.win();}catch(e){}
 VIEW={k:'done',id,lastRun,mm:j.mm,col:j.col,pf,coins,first,rec,prev,good:j.good||0,days:jar.days,pred:j.pred,predOK,tix:!!tix,zoomNow,pocket:full,kinds,prize,cm:lvl(p)>=1};draw();}
function drawDone(p,s){const v=VIEW,jar=J(v.id);
 card(`<h2>🎉 ${esc2(jar.n)}: on your Crystal Shelf!</h2><div class="cg-big">${svg(jar.id,1,v.col)}<div style="flex:1;min-width:220px">
  ${v.pred?`<p style="margin:0 0 6px">📝 You predicted <b>${esc2(SHAPES[v.pred].n.toLowerCase())}</b>. It grew as <b>${esc2(SHAPES[jar.shape].n.toLowerCase())}</b>. ${v.predOK?'<b>✅ Your prediction was right!</b> +5 🔬':'Your prediction was different: that\'s exactly why scientists test their ideas!'}</p><p class="cg-sub" style="margin:0 0 6px">${esc2(jar.shapeWhy)}</p>`:''}
  <p style="margin:0 0 6px">Final length: <b>${v.mm} mm</b>${v.cm?` (${(v.mm/10).toFixed(1)} cm)`:''}. You made <b>${v.good} of ${v.days}</b> good choices.${v.good<v.days?' Every good choice grows it bigger.':' Perfect care!'}${v.pf?' <b>✨ It came out PERFECT: double coins!</b>':''}${v.rec?` <b>🏆 New record!</b> (Your best was ${v.prev} mm.) +${RECORD_COINS} 🪙`:''}</p>
  ${v.lastRun?`<p style="margin:0 0 6px">🔬 <b>Compare:</b> last time ${v.id==='sugar'?`(${esc2((COLORS.find(c=>c.id===(v.lastRun.col||''))||COLORS[0]).n.toLowerCase())}) `:''}it was ${v.lastRun.mm} mm; this time ${v.id==='sugar'?`(${esc2((COLORS.find(c=>c.id===(v.col||''))||COLORS[0]).n.toLowerCase())}) `:''}${v.mm} mm. ${v.id==='sugar'&&(v.lastRun.col||'')!==(v.col||'')?'Food colouring doesn\'t change how sugar crystals grow: the difference came from your choices and natural variety.':'Same recipe, different result: your choices and natural variety make each crystal unique.'}</p>`:''}
  <p style="margin:0"><b>+${v.coins} 🪙 · +5 🔬</b> <small class="cg-sub">(🔬 research points buy cave gear)</small> · Crystals grown: <b>${v.kinds} of 6</b></p></div></div>
  ${v.prize?`<div class="cg-fact cg-prize">🥼 <b>You grew all 6 crystals! You are a Crystal Scientist!</b> +${PRIZE} 🪙</div>`:''}
  ${v.tix?`<div class="cg-fact">🎟️ <b>Ozzy's Shrink Ticket!</b> Ozzy will shrink you down <b>inside</b> your ${esc2(jar.id==='drip'?'water drop':jar.n.toLowerCase())} to see why it grows this way. He comes to find you on the map after 3 more battles.</div>`:''}${v.pocket?`<div class="cg-fact">🎟️ Ozzy had a Shrink Ticket for you, but your ticket pocket is full! Ride with Ozzy to make room.</div>`:''}${v.zoomNow?`<div class="cg-fact">🔍 You've already been inside ${esc2(jar.id==='drip'?'water':jar.n.toLowerCase())} with Ozzy, so <b>Zoom in</b> is open on this jar: see the atoms inside your crystal!</div>`:''}
  <div class="cg-row"><button class="btn gold" onclick="CG.back()">💎 Back to the garden</button></div>`);}
function zoom(id){VIEW={k:'zoom',id};try{SFX.tap();}catch(e){}draw();}
function drawZoom(p,s){const jar=J(VIEW.id);card(`<h2>🔍 Inside your ${esc2(jar.n)}</h2>${zoomSVG(jar.id)}<div class="cg-fact">⚛️ ${esc2(ZOOM[jar.id]||'')}</div><div class="cg-row"><button class="btn ghost dark" onclick="CG.back()">← Crystal Garden</button></div>`);}
function back(){VIEW=null;try{SFX.tap();}catch(e){}draw();}
function bench(){try{closeModal();}catch(e){}try{if(window.Quartz&&Quartz.room)Quartz.room('bench');}catch(e){}}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:sc=>{if(sc!=='world')return;setTimeout(()=>{try{const p=P();if(!p||typeof curScreen==='undefined'||curScreen!=='world'||!p.cg||!due(p))return;const s=st(p);if(s.remind===dayKey())return;s.remind=dayKey();save();toast('💧 A crystal jar in Dr. Quartz\'s Lab is ready for today\'s check!');}catch(e){}},2500);}});
window.CG={open,bench,dig,need,buy,start,tend,meas,journal,zoom,back,due,shelfHTML,art,JARS,EQUIP,INGR,SHAPES,missing,_guess:guess,_go:go,_col:pickCol,_choose:choose,_meas:measured,_most:most,_mostPick:mostPick,_finish:finish,_notice:notice,_st:st,_view:()=>VIEW};
})();
