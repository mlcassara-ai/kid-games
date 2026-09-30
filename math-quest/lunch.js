/* REALM LUNCH PLANNER — replaces the old cafeteria (SCREENS.cafe).
   Ms. Rosa hands the kid a blank menu board and cooks whatever they pick for everyone in the realm.
   Flow (one menu per day, per player): 🧾 guest list with today's needs → 🍽️ build a MyPlate-style plate
   (fruit, veggie, grain, protein + drink) with a health meter and gentle need warnings → 🧮 Ms. Rosa's order
   sheet (2–3 grade-scaled quantity questions, number pad, 2 tries) → 🎉 lunchroom serve scene with up to 3 stars.
   Rewards keep every old side effect: coins 15+5★, p.lunchTray, a PET_FOODS snack, p.cafe={d,done,stars,…},
   questEvent 'lunch'/'lstars', p.cafePlates, and p.daily/wkAnswer for each answer.
   Compliments around town: p.lunchFb is shown on the world map ≥10 min later (or a later day).
   Week planner (grade 5+ or 10 three-star lunches): p.lunchWeek = {wk (Monday), days[5], ok, goals, served, left, bonus}.
   In-progress lunch lives in p.lunchDraft so leaving and coming back never loses work. */
(function(){
'use strict';
/* ---------- food data: [id, emoji, name, tags, price in cents, piece noun] ---------- */
const DB={
 fruit:[['apple','🍎','Apple slices','hard',40,'apple slices'],['banana','🍌','Banana','',25,'banana chunks'],['grapes','🍇','Grapes','',50,'grapes'],
  ['straw','🍓','Strawberries','',60,'strawberries'],['orange','🍊','Orange wedges','',40,'orange wedges'],['pear','🍐','Pear slices','',45,'pear slices'],
  ['peach','🍑','Peach cup','',45,'peach slices'],['melon','🍉','Watermelon','',35,'watermelon cubes'],['kiwi','🥝','Kiwi','',50,'kiwi slices'],
  ['pine','🍍','Pineapple','',50,'pineapple chunks'],['mango','🥭','Mango','',55,'mango slices'],['cherry','🍒','Cherries','',60,'cherries'],
  ['asauce','🍏','Applesauce','',30,'cups of applesauce'],['pie','🥧','Apple pie','treat sugary dairy',70,'slices of pie'],['fsnack','🍬','Fruit snacks','treat sugary',35,'fruit snacks']],
 veg:[['broc','🥦','Broccoli','',40,'broccoli trees'],['carrot','🥕','Carrot sticks','hard',25,'carrot sticks'],['corn','🌽','Corn','',30,'scoops of corn'],
  ['cuke','🥒','Cucumber slices','hard',30,'cucumber slices'],['tomato','🍅','Cherry tomatoes','',45,'cherry tomatoes'],['salad','🥗','Garden salad','',55,'salad bowls'],
  ['eggpl','🍆','Roasted eggplant','',50,'eggplant slices'],['mash','🥔','Mashed potatoes','dairy',35,'scoops of mashed potatoes'],['sweet','🍠','Sweet potato','',40,'sweet potato wedges'],
  ['mush','🍄','Mushrooms','',50,'mushrooms'],['vsoup','🍲','Veggie soup','salty',45,'bowls of soup'],['avo','🥑','Avocado','',60,'avocado slices'],
  ['spin','🥬','Spinach','',40,'spinach leaves'],['fries','🍟','French fries','treat salty',45,'fries'],['rings','🧅','Onion rings','treat salty hard',50,'onion rings']],
 grain:[['wwbread','🍞','Whole-wheat bread','whole',25,'slices of bread'],['brice','🍚','Brown rice','whole',30,'scoops of rice'],['pasta','🍝','Pasta','',35,'scoops of pasta'],
  ['bagel','🥯','Bagel','',35,'bagels'],['oats','🥣','Oatmeal','whole',25,'bowls of oatmeal'],['tort','🌮','Soft corn tortilla','whole',30,'tortillas'],
  ['croiss','🥐','Croissant','dairy',45,'croissants'],['riceball','🍙','Rice ball','',30,'rice balls'],['baguette','🥖','Crusty baguette','hard',30,'baguette slices'],
  ['cracker','🍘','Rice crackers','hard salty',25,'rice crackers'],['pancake','🥞','Pancakes','dairy',40,'pancakes'],['noodle','🍜','Noodles','salty',35,'bowls of noodles'],
  ['wrap','🌯','Whole-wheat wrap','whole',40,'wraps'],['pizza','🍕','Pizza','treat dairy salty',60,'pizza slices'],['donut','🍩','Donut','treat sugary',40,'donuts'],['cake','🍰','Cake','treat sugary dairy',55,'slices of cake']],
 prot:[['chicken','🍗','Roast chicken','meat',110,'pieces of chicken'],['fish','🐟','Baked fish','fish',140,'fish fillets'],['eggs','🥚','Scrambled eggs','',60,'scoops of eggs'],
  ['chili','🥘','Bean chili','',70,'bowls of chili'],['falafel','🧆','Falafel','hard',80,'falafel balls'],['turkey','🦃','Turkey slices','meat salty',100,'turkey slices'],
  ['shrimp','🍤','Shrimp','fish',150,'shrimp'],['pb','🥜','Peanut butter','nuts',50,'spoonfuls of peanut butter'],['cheese','🧀','Cheese cubes','dairy',70,'cheese cubes'],
  ['meatball','🍖','Meatballs','meat',100,'meatballs'],['beef','🥩','Beef strips','meat hard',130,'beef strips'],['salmon','🍣','Salmon','fish',160,'salmon pieces'],
  ['lentil','🍛','Lentil curry','',65,'bowls of curry'],['tofu','🥢','Tofu stir-fry','',75,'bowls of stir-fry'],['nuts','🌰','Nut mix','nuts hard',80,'handfuls of nuts'],
  ['hotdog','🌭','Hot dog','treat meat salty',60,'hot dogs'],['burger','🍔','Cheeseburger','treat meat dairy salty',90,'burgers']],
 drink:[['milk','🥛','Milk','dairy',35,'milk cartons'],['water','💧','Water','',0,'cups of water'],['juice','🧃','100% juice','',45,'juice boxes'],['soda','🥤','Soda','treat sugary',50,'sodas']]};
const GROUPS=['fruit','veg','grain','prot','drink'];
const GN={fruit:'Fruit',veg:'Veggie',grain:'Grain',prot:'Protein',drink:'Drink'};
const GI={fruit:'🍎',veg:'🥦',grain:'🍞',prot:'🍗',drink:'🥛'};
const ITEM={};for(const g in DB)DB[g].forEach(([id,e,n,t,pr,pc])=>{ITEM[id]={id,g,e,n,t:t?t.split(' '):[],pr,pc};});
const TAGI={nuts:'🥜',salty:'🧂',meat:'🥩',fish:'🐟',dairy:'🥛',sugary:'🍭',hard:'🪥',whole:'🌾'};
const TAGN={nuts:'nuts',salty:'salty',meat:'meat',fish:'fish',dairy:'dairy',sugary:'sugary',hard:'crunchy',whole:'whole grain'};
const has=(x,t)=>!!x&&x.t.includes(t);
const isTreat=x=>has(x,'treat')||has(x,'sugary');
const money=c=>'$'+(c/100).toFixed(2);
const WEEK_BUDGET=1200,WEEK_BONUS=50;

/* ---------- the realm's diners ---------- */
const CH={rosa:{e:'👩‍🍳',n:'Ms. Rosa'},wise:{e:'👨‍💼',n:'Principal Wise'},quartz:{e:'👨‍🔬',n:'Dr. Quartz'},hoot:{e:'🦉',n:'Professor Hoot'},
 nana:{e:'👵',n:'Nana Paws'},ozzy:{e:'🎢',n:'Ozzy'},elder:{e:'🧙',n:'Elder Wiz'},keeper:{e:'🧑‍🌾',n:'Pet Keeper'}};
const VILL=['🧒','👧','👦','👩','👴','🧑','👨','👵','🧔','👱'];
const NEEDS={
 nonut:{who:'ozzy',s:'No nuts',q:"I'm allergic to peanuts and nuts! Please keep them off my tray.",y:'No nuts 🥜 for me!',bad:x=>has(x,'nuts'),warn:"Ozzy can't eat nuts!",
  yay:'No nuts anywhere! Now I can ride all day! 🎢',boo:'Nuts?! Good thing Ms. Rosa made me a backup plate!',tip:'Ozzy is allergic to nuts. Skip the peanut butter and nut mix when he is coming.'},
 veg:{who:'quartz',s:'Vegetarian',q:"I'm eating vegetarian this week. No meat or fish, please!",y:'No meat 🥩 or fish 🐟, please!',bad:x=>has(x,'meat')||has(x,'fish'),warn:'Dr. Quartz is vegetarian this week!',
  yay:'A veggie-friendly lunch! My experiment is a success! 🔬',boo:"Hmm, I'm vegetarian this week. I'll just eat the sides!",tip:'Bean chili, eggs, lentil curry or tofu are great for vegetarians.'},
 salt:{who:'wise',s:'Less salt',q:'My doctor says I should eat less salt.',y:'Not too salty 🧂, please!',bad:x=>has(x,'salty'),warn:'Too salty for Principal Wise!',
  yay:'Not too salty. Just right! Excellent work.',boo:'Whew, that was salty! Pass the water, please.',tip:'Watch for the 🧂 salty tag: fries, turkey, noodles and pizza are salty.'},
 soft:{who:'nana',s:'Soft foods',q:"Soft foods, dear. My teeth aren't what they used to be!",y:'Soft food, please! Nothing crunchy 🪥.',bad:x=>has(x,'hard'),warn:'Too crunchy for Nana Paws!',
  yay:'So soft and yummy. Thank you, dear!',boo:"Too crunchy for my teeth! I'll dunk it in my tea.",tip:'Nana Paws needs soft foods. Skip anything with the 🪥 crunchy tag.'},
 dairy:{who:'elder',s:'No dairy',q:'Milk and cheese upset my tummy. No dairy for me!',y:'No milk or cheese 🥛 for me!',bad:x=>has(x,'dairy'),warn:"Elder Wiz can't have dairy!",
  yay:'No dairy! My tummy says thank you. ✨',boo:'Oh my, dairy! My tummy is rumbling like a dragon.',tip:'For Elder Wiz, pick water instead of milk and skip cheese.'},
 sugar:{who:'keeper',s:'Low sugar',q:"No sugary stuff! I'm training for the harvest race.",y:'No sweets 🍭 for me!',bad:x=>has(x,'sugary'),warn:'Too sugary for the Pet Keeper!',
  yay:"No sugar crash for me. I'll win the harvest race!",boo:"Too sugary! Now I'm too jumpy to train!",tip:'Skip the 🍭 sugary foods and soda on race days.'},
 brain:{who:'hoot',s:'Brain food',q:'Brain food, please! I need something with whole grains or fish.',y:'Brain food, please! 🌾 whole grains or 🐟 fish!',req:all=>all.some(x=>has(x,'whole')||has(x,'fish')),warn:'Professor Hoot wants whole grains 🌾 or fish 🐟!',
  yay:'Hoo-ray, brain food! I feel smarter already. 🦉',boo:'Hoo, no whole grains or fish today. My brain wants a snack!',tip:'Brown rice, oatmeal, whole-wheat bread or fish are brain food.'}};
const NEED_IDS=Object.keys(NEEDS);

/* ---------- helpers ---------- */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=hash(seed);return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const ri=(R,a,b)=>a+Math.floor(R()*(b-a+1));
const pk=(R,a)=>a[Math.floor(R()*a.length)];
const shuf=(R,a)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const G=p=>p.adult?12:(+p.grade||3);
const young=p=>{try{return youngReader(p);}catch(e){return G(p)<=2&&!p.adult;}};
const L=(p,op)=>{try{return lvl(p,op)||1;}catch(e){return 1;}};
const today=()=>dayKey();
function monday(d){d=d?new Date(d):new Date();d.setHours(12,0,0,0);const w=d.getDay();d.setDate(d.getDate()-(w===0?6:w-1));return d;}
const monKey=d=>dayKey(monday(d));
function wdIdx(d){const w=(d||new Date()).getDay();return w>=1&&w<=5?w-1:-1;} // 0=Mon … 4=Fri, -1 weekend
function planWk(){const d=new Date();const w=d.getDay();if(w===0||w===6){d.setDate(d.getDate()+(w===6?2:1));}return monKey(d);}
const DAYN=['Mon','Tue','Wed','Thu','Fri'],DAYF=['Monday','Tuesday','Wednesday','Thursday','Friday'];
function stats(p){p.lunchStats=p.lunchStats||{n:0,three:0};return p.lunchStats;}
function weekUnlocked(p){return G(p)>=5||(stats(p).three||0)>=10;}

/* ---------- today's guests + lunch line (same all day for this player) ---------- */
let DAYC={};
function dayPlan(p){const k=p.id+'|'+today();if(DAYC[k])return DAYC[k];const R=rng('lunch|'+k);const g=G(p);
 const nNeeds=g<=2?1:g<=4?2:g<=8?3:4;const needs=shuf(R,NEED_IDS).slice(0,nNeeds);
 let N,T=0,D=0;if(g<=2)N=ri(R,8,14);else if(g<=4){T=ri(R,4,L(p,'mul')>=4?8:6);D=ri(R,4,L(p,'mul')>=4?6:5);N=T*D;}else N=4*ri(R,6,15);
 const per=g<=2?8:10;const cards={};
 GROUPS.forEach(gr=>{if(gr==='drink'){cards.drink=DB.drink.map(x=>x[0]);return;}
  const pool=DB[gr].map(x=>ITEM[x[0]]);const tr=shuf(R,pool.filter(isTreat)).slice(0,2);let ok=shuf(R,pool.filter(x=>!isTreat(x))).slice(0,per-tr.length);
  const fits=x=>!isTreat(x)&&needs.every(n=>!NEEDS[n].bad||!NEEDS[n].bad(x));
  const want=gr==='grain'&&needs.includes('brain')?x=>fits(x)&&has(x,'whole'):fits;
  if(!ok.some(want)){const add=shuf(R,pool.filter(want))[0];if(add)ok[ok.length-1]=add;}
  cards[gr]=shuf(R,[...ok,...tr]).map(x=>x.id);});
 const vill=[];for(let i=0;i<N-needs.length;i++)vill.push(pk(R,VILL));
 return DAYC[k]={needs,N,T,D,cards,vill};}

/* ---------- scoring a plate ---------- */
function evalPlate(plate,needs){plate=plate||{};const it=['fruit','veg','grain','prot'].map(g=>ITEM[plate[g]]).filter(Boolean);const dr=ITEM[plate.drink];
 const all=dr?[...it,dr]:it;const full=it.length===4&&!!dr;const treats=all.filter(isTreat);const drinkOK=!!dr&&(dr.id==='milk'||dr.id==='water');
 const bal=full&&drinkOK&&treats.length<=1;
 const st=(needs||[]).map(n=>{const N=NEEDS[n];if(N.req){const ok=N.req(all);return {id:n,ok,pend:!ok&&!full,bad:[]};}const bad=all.filter(N.bad);return {id:n,ok:!bad.length,bad};});
 const needsOK=full&&st.every(s=>s.ok);
 let health=0;it.forEach(x=>{health+=isTreat(x)?6:18;});if(dr)health+=drinkOK?28:dr.id==='juice'?16:2;
 return {full,bal,needsOK,st,treats,drinkOK,health,dr,it,all};}

/* ---------- saved in-progress lunch ---------- */
function plannedToday(p){const lw=p.lunchWeek,i=wdIdx();if(!lw||i<0||lw.wk!==monKey())return null;const m=lw.days&&lw.days[i];if(!m||!GROUPS.every(g=>m[g]&&ITEM[m[g]]))return null;if(lw.served&&lw.served[i]!=null)return null;return {i,menu:m};}
function draft(p){let d=p.lunchDraft;if(!d||d.d!==today()){d=p.lunchDraft={d:today(),st:'intro',plate:{},qs:[],qi:0,tries:0,res:[],fb:null};}
 if((d.st==='intro'||d.st==='plate')&&!d.planned){const pl=plannedToday(p);if(pl){d.plate=Object.assign({},pl.menu);d.planned=true;d.pi=pl.i;}}
 return d;}
function doneToday(p){return !!(p.cafe&&p.cafe.d===today()&&p.cafe.done);}

/* ---------- Ms. Rosa's order sheet: quantity questions from the menu + diner count ---------- */
const FRW={2:'half',3:'third',4:'fourth',5:'fifth',6:'sixth',8:'eighth',10:'tenth'};
const emo=(e,n,cls)=>`<span class="ln-grp${cls?' '+cls:''}">${Array.from({length:n},()=>`<i>${e}</i>`).join('')}</span>`;
function makeQs(p,d){const g=G(p),dp=dayPlan(p),N=dp.N,R=rng('lunchq|'+p.id+'|'+today()+'|'+GROUPS.map(k=>d.plate[k]).join(','));
 const fr=ITEM[d.plate.fruit],vg=ITEM[d.plate.veg],gr=ITEM[d.plate.grain],pt=ITEM[d.plate.prot],dk=ITEM[d.plate.drink];const qs=[];
 if(g<=2){const big=L(p,'add')>=4;const a=ri(R,2,big?8:5),b=ri(R,1,big?7:4);
  qs.push({t:`Ms. Rosa has ${a} ${fr.e} and ${b} ${fr.e}. How many ${fr.e} in all?`,s:`Ms. Rosa has ${a} ${fr.n} and ${b} more. How many in all?`,vis:emo(fr.e,a)+'<b class="ln-op">+</b>'+emo(fr.e,b),a:a+b,post:'',hint:`Count them all! ${a} + ${b}`});
  if(L(p,'sub')>=2&&R()<.6){const n=ri(R,5,big?12:9),t=ri(R,1,n-2);
   qs.push({t:`There are ${n} 🍽️ plates. ${t} are gone. How many are left?`,s:`There are ${n} plates. ${t} are gone. How many are left?`,vis:emo('🍽️',n-t)+emo('🍽️',t,'gone'),a:n-t,post:'plates',hint:`Count the plates that are not crossed out. ${n} − ${t}`});}
  else{const n=ri(R,4,big?12:9),kids=Array.from({length:n},()=>pk(R,VILL));
   qs.push({t:`Friends sit at a table. Each one gets 1 ${dk.e}. How many ${dk.e} do we need?`,s:`Each friend at the table gets 1 ${dk.n}. How many do we need?`,vis:`<span class="ln-grp">${kids.map(k=>`<i>${k}</i>`).join('')}</span>`,a:n,post:'',hint:'Count the friends. One drink for each friend!'});}
  return qs;}
 if(g<=4){const T=dp.T,D=dp.D,mx=L(p,'mul')>=4?9:5;
  qs.push({t:`Lunch has ${T} tables with ${D} diners at each table. How many diners in all?`,a:T*D,post:'diners',hint:`${T} tables × ${D} diners. Count by ${D}s!`,vis:Array.from({length:T},()=>emo('🧑',D,'sm')).join('')});
  const k=ri(R,2,Math.min(mx,5));qs.push({t:`Each diner gets ${k} ${fr.pc} (${fr.e}). How many ${fr.pc} does one table of ${D} diners need?`,a:D*k,post:fr.pc,hint:`${D} diners × ${k} each. ${D} × ${k}`});
  if(g>=4&&R()<.6){const c=ri(R,3,9);qs.push({t:`One pan of ${pt.n.toLowerCase()} ${pt.e} costs $${c}. Ms. Rosa needs ${T} pans. How many dollars is that?`,pre:'$',a:c*T,post:'',hint:`${T} pans × $${c} each.`});}
  else{const m=ri(R,2,mx);qs.push({t:`Ms. Rosa has ${T*m} ${dk.pc} ${dk.e} to share equally on ${T} tables. How many for each table?`,a:m,post:dk.pc,hint:`${T*m} ÷ ${T}. What times ${T} makes ${T*m}?`});}
  return qs;}
 if(g<=8){const ks=[6,8,10,12];const odd=ks.filter(k=>N%k);const k=pk(R,odd.length?odd:ks);const pans=Math.ceil(N/k),fl=Math.floor(N/k);
  qs.push({t:`One pan of ${pt.n.toLowerCase()} ${pt.e} feeds ${k} diners. How many pans does Ms. Rosa need to feed all ${N} diners?`,a:pans,post:'pans',hint:N%k?`${fl} pans feed only ${fl*k} diners. The last ${N-fl*k} diners need one more pan!`:`${N} ÷ ${k}`});
  const dens=[2,3,4,5,6,8,10].filter(x=>N%x===0);const den=pk(R,dens);const num=den===2?1:ri(R,1,den-1);
  qs.push({t:`${num}/${den} of the ${N} diners want ${dk.n.toLowerCase()} ${dk.e}. How many ${dk.pc} is that?`,s:`${num} ${FRW[den]}${num>1?'s':''} of the ${N} diners want ${dk.n}. How many ${dk.pc} is that?`,a:N/den*num,post:dk.pc,hint:`${N} ÷ ${den} = ${N/den}, then × ${num}.`});
  if(g>=6&&R()<.5){const u=pk(R,[25,50]);const n2=u===25?N-N%4:N-N%2;qs.push({t:`${gr.n} ${gr.e} costs ${u}¢ per diner. How many dollars to serve ${n2} diners?`,pre:'$',a:n2*u/100,post:'',hint:`${n2} × ${u}¢ = ${n2*u}¢. 100¢ = $1.`});}
  else{const c=ri(R,4,12),B=c*pans+ri(R,1,8)*5;qs.push({t:`Ms. Rosa's budget is $${B}. Each pan of ${pt.n.toLowerCase()} costs $${c}, and she buys ${pans} pans. How much money is left?`,pre:'$',a:B-c*pans,post:'',hint:`${pans} × $${c} = $${c*pans}. Then $${B} − $${c*pans}.`});}
  return qs;}
 /* grade 9+ and adults: scaling recipes, unit price, percent of budget */
 const ss=[4,6,8,12].filter(x=>N%x===0);const s=pk(R,ss.length?ss:[4]);const cu=ri(R,2,5);
 qs.push({t:`Ms. Rosa's ${pt.n.toLowerCase()} ${pt.e} recipe serves ${s} people and uses ${cu} pounds of food. How many pounds does she need to serve all ${N} diners?`,a:cu*N/s,post:'pounds',hint:`${N} ÷ ${s} = ${N/s} batches. ${N/s} × ${cu} pounds.`});
 const combos=[];[12,20,24,40,50].forEach(n=>[15,20,25,30,35,40,45,60,75].forEach(u=>{if(n*u%100===0)combos.push([n,u]);}));const [cn,cu2]=pk(R,combos);
 qs.push({t:`A case of ${cn} ${fr.pc} ${fr.e} costs $${cn*cu2/100}. What is the price of one, in cents?`,a:cu2,post:'¢',hint:`$${cn*cu2/100} = ${cn*cu2}¢. Then ${cn*cu2} ÷ ${cn}.`});
 if(R()<.5){const B=pk(R,[200,250,300,400,500,600]);const pcs=[10,15,20,25,30,35,40,45].filter(x=>B*x%100===0);const pc=pk(R,pcs);
  qs.push({t:`The lunch budget is $${B}. Ms. Rosa spends ${pc}% of it on ${pt.n.toLowerCase()} ${pt.e}. How many dollars is that?`,pre:'$',a:B*pc/100,post:'',hint:`${pc}% = ${pc}/100. $${B} × ${pc} ÷ 100.`});}
 else{const u=pk(R,[150,175,200,225,250,275,300]);const Tot=N*u;qs.push({t:`Lunch for all ${N} diners cost $${(Tot/100).toFixed(2)}. What is the cost per diner, in cents?`,a:u,post:'¢',hint:`$${(Tot/100).toFixed(2)} = ${Tot}¢. ${Tot} ÷ ${N}.`});}
 return qs;}

/* ---------- UI state (in memory; CAFE=null from index.html means "fresh visit") ---------- */
let UI={};
function fresh(){UI={grp:null,msg:'',warn:[],inp:'',rd:{},spoken:'',serve:null,view:null};}
fresh();
function stay(){const y=window.scrollY;go('cafe');window.scrollTo(0,y);}
function speakNow(t){try{if(!t)return;try{speechSynthesis.cancel();}catch(e){}let x=String(t).replace(/<[^>]+>/g,' ');try{x=x.replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u200D\uFE0F]/gu,'');}catch(e){}say(speakable(x.replace(/\$(\d+)/g,'$1 dollars').replace(/(\d+)¢/g,'$1 cents')));}catch(e){}}
function read(k){speakNow(UI.rd[k]);}
const spk=k=>`<button class="ln-spk" onclick="Lunch.read('${k}')" aria-label="Read aloud">🔊</button>`;
function autoRead(p,key,text){UI.rd.auto=text;try{if(young(p)&&voiceOn()&&UI.spoken!==key){UI.spoken=key;setTimeout(()=>{if(typeof curScreen!=='undefined'&&curScreen==='cafe')speakNow(text);},450);}}catch(e){}}

const ROSA=`<svg class="ln-rosa" viewBox="0 0 120 140" aria-label="Ms. Rosa the cook"><ellipse cx="60" cy="136" rx="34" ry="4" fill="rgba(0,0,0,.15)"/>
<path d="M22 138 Q22 98 60 94 Q98 98 98 138Z" fill="#ff8787"/><path d="M40 100 L80 100 L84 138 L36 138Z" fill="#fff"/><path d="M40 100 Q60 108 80 100" stroke="#e9ecef" stroke-width="2" fill="none"/>
<circle cx="60" cy="122" r="7" fill="#ffd43b"/><path d="M57 122 h6 M60 119 v6" stroke="#e8590c" stroke-width="2"/>
<rect x="53" y="82" width="14" height="14" fill="#d9a066"/><ellipse cx="60" cy="64" rx="25" ry="26" fill="#e8b184"/>
<path d="M35 62 Q34 40 60 40 Q86 40 85 62 Q78 50 60 49 Q42 50 35 62Z" fill="#5c3317"/><path d="M34 60 q-4 14 4 22" stroke="#5c3317" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M86 60 q4 14 -4 22" stroke="#5c3317" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M36 42 Q30 22 44 20 Q48 6 60 10 Q72 4 78 18 Q92 20 84 42Z" fill="#fff" stroke="#dee2e6" stroke-width="2"/><rect x="38" y="36" width="44" height="9" rx="3" fill="#fff" stroke="#dee2e6" stroke-width="2"/>
<ellipse cx="51" cy="63" rx="3" ry="4" fill="#2b2250"/><ellipse cx="69" cy="63" rx="3" ry="4" fill="#2b2250"/><circle cx="52" cy="61.5" r="1" fill="#fff"/><circle cx="70" cy="61.5" r="1" fill="#fff"/>
<circle cx="46" cy="72" r="4.5" fill="#ff8fab" opacity=".55"/><circle cx="74" cy="72" r="4.5" fill="#ff8fab" opacity=".55"/><path d="M52 74 Q60 82 68 74" stroke="#a61e4d" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M98 110 q10 -8 6 -26" stroke="#ff8787" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="101" y="56" width="4" height="30" rx="2" fill="#adb5bd"/><ellipse cx="103" cy="54" rx="8" ry="5" fill="#ced4da" stroke="#868e96"/></svg>`;
function head(p,say,key){UI.rd[key||'bub']=say;return `<div class="ln-head"><div class="ln-rosabox">${ROSA}</div><div class="cafe-bubble ln-bubble"><b class="nm">👩‍🍳 Ms. Rosa, the Cook ${spk(key||'bub')}</b><div>${say}</div></div></div>`;}
function steps(i){return `<div class="cafe-steps ln-steps">${[['🧾','Guests'],['🍽️','Plate'],['🧮','Order'],['🎉','Serve']].map((s,k)=>`<div class="cst"><span class="${k<i?'done':k===i?'on':''}">${s[0]}</span><small>${s[1]}</small></div>`).join('')}</div>`;}
function avatar(id){try{if(id==='rosa')return ROSA;if(id==='quartz'&&window.QUARTZ_SVG)return window.QUARTZ_SVG;if(id==='hoot'&&typeof hootSVG==='function')return hootSVG();if(id==='wise'&&typeof principalMapSVG==='function')return principalMapSVG();}catch(e){}
 return `<div class="ln-emav">${(CH[id]||{e:id}).e}</div>`;}
function board(plate,title){return `<div class="ln-board"><div class="ln-bt">${title||'Today\'s Menu'}</div>${GROUPS.map(g=>{const x=ITEM[plate&&plate[g]];return `<div><span>${GI[g]} ${GN[g]}</span><span>${x?`${x.e} ${x.n}`:'<i class="ln-blank">?</i>'}</span></div>`;}).join('')}</div>`;}
function card(x,on,price){return `<span class="ln-ce">${x.e}</span><span class="ln-cn">${x.n}</span><span class="ln-ct">${x.t.filter(t=>TAGI[t]).map(t=>`<i title="${TAGN[t]}">${TAGI[t]}</i>`).join('')}${isTreat(x)&&x.g!=='drink'?'<em>treat</em>':''}</span>${price?`<small class="ln-pr">${money(x.pr)}</small>`:''}`;}
const legend=`<div class="ln-legend">${Object.keys(TAGI).map(t=>`<span>${TAGI[t]} ${TAGN[t]}</span>`).join('')}</div>`;

/* ---------- screen: guest list ---------- */
function introView(p,d){const dp=dayPlan(p),Y=young(p);
 const say=d.planned?`Hi ${esc(p.name)}! Today I'm cooking <b>your week plan</b> menu. Let's check the guest list!`:Y?`Hi ${esc(p.name)}! I can cook anything. <b>You pick the lunch!</b> I will feed everyone.`:`Hi ${esc(p.name)}! I can cook anything, but I can't decide! <b>You pick the menu</b> and I'll feed the whole realm.`;
 const gl=dp.needs.map(n=>{const N=NEEDS[n],c=CH[N.who];return `<div class="ln-guest"><span class="ln-gav">${c.e}</span><div><b>${c.n}</b> <span class="ln-need">${N.s}</span><div class="ln-quote">"${Y?N.y:N.q}"</div></div></div>`;}).join('');
 UI.rd.guests=`Today's guest list: ${dp.N} diners. `+dp.needs.map(n=>`${CH[NEEDS[n].who].n} says: ${Y?NEEDS[n].y:NEEDS[n].q}`).join(' ');
 const vShow=dp.vill.slice(0,18);
 autoRead(p,'intro',say.replace(/<[^>]+>/g,'')+' '+UI.rd.guests);
 return `${head(p,say,'bub')}${steps(0)}<div class="ln-two"><div class="ln-panel">${board(d.planned?d.plate:null,d.planned?'📅 Planned Menu':'Today\'s Menu')}</div>
 <div class="ln-panel"><h3 class="ln-h">🧾 Today's guest list: <b>${dp.N}</b> diners ${spk('guests')}</h3>${gl}
 <div class="ln-vill"><span>${vShow.map(v=>`<i>${v}</i>`).join('')}${dp.vill.length>vShow.length?`<b>+${dp.vill.length-vShow.length}</b>`:''}</span><small>and ${dp.vill.length} hungry villagers</small></div></div></div>
 <div class="row ln-go"><button class="btn green big" onclick="Lunch.start()">${d.planned?'Cook my planned menu ➜':'Let\'s plan the menu! ➜'}</button></div>${weekLink(p)}`;}
function weekLink(p){if(weekUnlocked(p)){const lw=p.lunchWeek,has=lw&&lw.wk===planWk();return `<div class="ln-wklink"><button class="btn gold" onclick="Lunch.week()">🗓️ ${has?'My week plan':'Plan the whole week'}</button><small>${has?(lw.ok?'✅ All weekly goals met':'Some weekly goals still open'):`Plan Monday to Friday and earn a 🪙 ${WEEK_BONUS} bonus!`}</small></div>`;}
 const t=stats(p).three||0;return `<div class="ln-wklink"><small>🔒 Week Planner: earn ⭐⭐⭐ on <b>${10-t}</b> more lunch${10-t===1?'':'es'} to unlock it (${t}/10).</small></div>`;}

/* ---------- screen: build the plate ---------- */
function plateView(p,d){const dp=dayPlan(p),ev=evalPlate(d.plate,dp.needs),Y=young(p);const lock=!!d.planned;
 if(!UI.grp)UI.grp=GROUPS.find(g=>!d.plate[g])||'fruit';
 const say=UI.msg||(lock?'This is your planned menu for today. Check the guests, then send it to me!':ev.full?(Y?'All done! Send it to me! 🧾':'Looks delicious! Send the menu to me when you are ready. 🧾'):(Y?`Pick a <b>${GN[UI.grp].toLowerCase()}</b> for the plate!`:`Tap a food for each part of the plate: fruit, veggie, grain, protein, and a drink.`));
 autoRead(p,'plate'+(UI.msg||UI.grp),say.replace(/<[^>]+>/g,''));
 const slot=g=>{const x=ITEM[d.plate[g]];return `<button class="ln-slot ln-s-${g} ${UI.grp===g&&!lock?'on':''} ${x?'full':''}" onclick="Lunch.grp('${g}')"><span>${x?x.e:GI[g]}</span><small>${x?x.n:GN[g]}</small></button>`;};
 const hcol=ev.health>=85?'#2f9e44':ev.health>=60?'#94d82d':ev.health>=35?'#fcc419':'#ff6b6b';
 const hl=!ev.full?'Fill every part of the plate!':ev.health>=85?'💪 Super healthy!':ev.health>=60?'🙂 Pretty good!':ev.health>=35?'🤔 Needs more balance':'🍭 Too many treats!';
 const goal=(ok,t)=>`<div class="ln-goal ${ok?'ok':''}"><span class="ck">${ok?'✓':''}</span>${t}</div>`;
 const gs=ev.st.map(s=>{const N=NEEDS[s.id];return `<div class="ln-gchip ${s.ok?'ok':s.pend?'':'bad'}">${CH[N.who].e} ${N.s} ${s.ok?'✅':s.pend?'⏳':'⚠️'}</div>`;}).join('');
 const warn=UI.warn.length?`<div class="ln-warn">${UI.warn.map(w=>`⚠️ ${w}`).join('<br>')}<small>You can keep it, or pick something else.</small></div>`:'';
 const list=(dp.cards[UI.grp]||[]).map(id=>ITEM[id]);
 const cards=lock?`<div class="ln-lockmsg">📅 Today's menu comes from your <b>week plan</b>. Tap <b>Send</b> when you're ready!</div>`:
  `${warn}<div class="ln-tabs">${GROUPS.map(g=>`<button class="${UI.grp===g?'on':''}" onclick="Lunch.grp('${g}')"><span>${d.plate[g]?'✅':GI[g]}</span>${GN[g]}</button>`).join('')}</div>
  <div class="ln-cards">${list.map(x=>`<button class="ln-card ${d.plate[x.g]===x.id?'on':''} ${isTreat(x)?'treat':''}" onclick="Lunch.pick('${x.id}')">${card(x,d.plate[x.g]===x.id,false)}</button>`).join('')}</div>${legend}`;
 return `${head(p,say,'bub')}${steps(1)}<div class="ln-two plate"><div class="ln-panel ln-pa">
  <div class="ln-platewrap"><div class="ln-plate">${['fruit','veg','grain','prot'].map(slot).join('')}</div>${slot('drink').replace('ln-slot','ln-slot ln-cup')}</div>
  <div class="ln-meter"><b>❤️ Health meter</b><div class="bar"><i style="width:${Math.min(100,ev.health)}%;background:${hcol}"></i></div><small>${hl}</small></div></div>
  <div class="ln-panel ln-pb"><div class="ln-goals" style="margin-top:0">${goal(ev.it.length===4,'🍽️ All 4 food groups')}${goal(ev.drinkOK,'🥛 Milk or 💧 water')}${goal(ev.full&&ev.treats.length<=1,'🎉 One treat at most')}</div>
  <div class="ln-gchips">${gs}</div>
  <div class="row" style="margin-top:8px"><button class="btn ${ev.full?'green':'ghost dark'} big" ${ev.full?'':'disabled'} onclick="Lunch.send()">🧾 Send my menu to Ms. Rosa</button>${!lock&&Object.keys(d.plate).length?'<button class="btn ghost dark small" onclick="Lunch.clear()">↺ Start over</button>':''}</div></div>
  <div class="ln-panel ln-tray">${cards}</div></div>`;}

/* ---------- screen: order sheet math ---------- */
function mathView(p,d){const q=d.qs[d.qi];const Y=young(p);const n=d.qs.length;
 const fbT=d.fb==='ok'?`✅ Yes! <b>${q.pre||''}${q.a}</b>${q.post?' '+q.post:''}. ${pick(['Yummy, that\'s right!','Perfect, chef!','Ms. Rosa is impressed!'])}`:d.fb==='miss'?`Not quite! 💡 ${q.hint}`:d.fb==='reveal'?`The answer is <b>${q.pre||''}${q.a}</b>${q.post?' '+q.post:''}. ${q.hint}`:'';
 const say=d.fb==='ok'?(Y?'Yes! Great job!':'That\'s right! Now I know how much to cook.'):d.fb==='miss'?'Almost! Try once more.':d.fb==='reveal'?'That\'s okay! Here is the answer.':d.qi===0?(Y?'Now help me count!':'Now fill in my order sheet so I know how much to cook!'):'Next line on the order sheet!';
 UI.rd.q=(q.s||q.t)+(d.fb&&d.fb!=='ok'?' '+q.hint:'');
 autoRead(p,'q'+d.qi+(d.fb||''),say+' '+(d.fb?fbT.replace(/<[^>]+>/g,''):(q.s||q.t)));
 const done=d.fb==='ok'||d.fb==='reveal';
 return `${head(p,say,'bub')}${steps(2)}<div class="ln-sheet"><div class="ln-sh-top"><b>🧾 Order sheet</b><span>Question ${d.qi+1} of ${n}</span></div>
  <div class="cafe-q ln-q">${q.t} ${spk('q')}</div>${q.vis?`<div class="ln-vis">${q.vis}</div>`:''}
  <div class="cafe-ans">${q.pre?`<span>${q.pre}</span>`:''}<span class="ansbox ln-ans ${d.fb==='ok'?'ok':d.fb==='reveal'?'rev':''}">${done?q.a:esc(UI.inp||'?')}</span>${q.post?` <span class="ln-post">${q.post}</span>`:''}</div>
  ${fbT?`<div class="cafe-hintbox ln-fbk ${d.fb}">${fbT}</div>`:''}
  ${done?`<div class="row"><button class="btn green big" onclick="Lunch.next()">${d.qi+1<n?'Next ➜':'Serve lunch! 🍽️'}</button></div>`:
  `<div class="cpad">${['1','2','3','4','5','6','7','8','9','del','0'].map(k=>`<button onclick="Lunch.key('${k}')">${k==='del'?'⌫':k}</button>`).join('')}<button class="go ln-ok" onclick="Lunch.check()">✓</button></div>`}</div>`;}

/* ---------- screen: serve scene + rewards ---------- */
function reactions(p,S){const out=[];const ev=S.ev;
 ev.st.forEach(s=>{const N=NEEDS[s.id];out.push({e:CH[N.who].e,n:CH[N.who].n,t:s.ok?N.yay:N.boo,ok:s.ok});});
 const tr=ev.treats.filter(x=>x.g!=='drink');
 if(tr.length>1)out.push({e:pk(Math.random,VILL),n:'A villager',t:`${tr[0].n} AND ${tr[1].n.toLowerCase()}${tr.length>2?' AND more':''}? My tummy is doing flips!`,ok:false});
 else if(ev.dr&&ev.dr.id==='soda')out.push({e:pk(Math.random,VILL),n:'A villager',t:'All that soda made me jumpy! Milk or water next time?',ok:false});
 else if(ev.dr&&ev.dr.id==='juice')out.push({e:pk(Math.random,VILL),n:'A villager',t:'Juice is nice, but milk or water is best with lunch.',ok:false});
 if(ev.bal)out.push({e:pk(Math.random,VILL),n:'A villager',t:`Every color of the rainbow! Yummy ${ITEM[S.menu.prot].n.toLowerCase()}! 🌈`,ok:true});
 out.push({e:'👩‍🍳',n:'Ms. Rosa',t:S.m?'Your order sheet was perfect. I cooked exactly enough! 🧾':'A few numbers were off, so I ran around a bit. But everyone got fed! 😅',ok:S.m});
 return out.slice(0,5);}
function serveView(p){const S=UI.serve;const Y=young(p);const R=S.react;const stars=S.stars;
 const say=stars===3?`WOW, ${esc(p.name)}! The whole realm loved it! ⭐⭐⭐`:stars===2?`Great lunch, ${esc(p.name)}! Everyone is full and happy.`:stars===1?`Everyone got fed, ${esc(p.name)}! Let's make it even healthier tomorrow.`:`Thanks for cooking, ${esc(p.name)}! Tomorrow let's try a more balanced plate.`;
 const st=[[S.ev.bal,'Balanced plate'],[S.ev.needsOK,'Every guest happy'],[S.m,'Order math right']];
 autoRead(p,'serve',say.replace(/<[^>]+>/g,'')+` You got ${stars} star${stars===1?'':'s'}!`);
 UI.rd.react=R.map(r=>`${r.n}: ${r.t}`).join(' ');
 return `${head(p,say,'bub')}${steps(3)}<div class="ln-room"><div class="ln-rt">🍽️ The Realm Lunchroom ${spk('react')}</div>${board(S.menu,'Today\'s Menu')}
  <div class="ln-diners">${R.map((r,i)=>`<div class="ln-diner" style="animation-delay:${.25+i*.45}s"><span class="ln-de">${r.e}</span><div class="ln-say ${r.ok?'ok':'meh'}"><b>${r.n}</b>${r.t}</div></div>`).join('')}</div>
  <div class="ln-table">${S.eaters.map(e=>`<i>${e}</i>`).join('')}</div></div>
  <div class="ln-stars">${st.map(([ok,t],i)=>`<div class="ln-star ${ok?'on':''}" style="animation-delay:${1+i*.35}s"><span>${ok?'⭐':'☆'}</span><small>${t}</small></div>`).join('')}</div>
  <div class="cafe-reward ln-reward"><div class="big-emoji">🍱</div><div><b style="font-size:20px">Lunch Tray power-up earned!</b><br>Your next battle starts with a <b>🛡️ shield</b> and <b>+${20+5*(typeof vLv==='function'?vLv(p,'cafe'):0)} ❤️</b>.<br>Ms. Rosa made your pet a treat: <b>${S.treat}</b> 🐾<br>🪙 +${S.coins} coins${S.bonus?`<br><b>🗓️ Week plan bonus: 🪙 +${WEEK_BONUS}!</b>`:''}${S.wk?`<br><small>📅 Week plan: ${S.wk}</small>`:''}</div></div>
  ${S.unlock?'<div class="ln-unlock">🎉 You unlocked the <b>🗓️ Week Planner</b>! Plan Monday to Friday for a big bonus.</div>':''}
  <div class="row"><button class="btn gold big" onclick="CAFE=null;go('world')">Back to the village 🏡</button>${weekUnlocked(p)?'<button class="btn ghost dark" onclick="Lunch.week()">🗓️ Week planner</button>':''}</div>`;}

/* ---------- screen: already served today ---------- */
function doneView(p){const c=p.cafe||{};const say=`Thanks for lunch today, ${esc(p.name)}! The kitchen is closed now. Come back <b>tomorrow</b> for a brand-new guest list! 🍎`;
 autoRead(p,'done',say.replace(/<[^>]+>/g,''));
 const st=c.stars!=null?`<div class="ln-donestars">${'⭐'.repeat(Math.min(3,c.stars))}${'☆'.repeat(Math.max(0,3-c.stars))}</div>`:'';
 return `${head(p,say,'bub')}<div class="ln-two"><div class="ln-panel">${c.menu?board(c.menu,'Today\'s Menu · Served!'):'<div class="ln-board"><div class="ln-bt">Lunch is served! 🍽️</div></div>'}${st}</div>
 <div class="ln-panel">${p.lunchTray?'<div class="ln-note">🍱 Your <b>Lunch Tray power-up</b> is ready for your next battle!</div>':''}${nextPlanNote(p)}${weekLink(p)}</div></div>`;}
function nextPlanNote(p){const lw=p.lunchWeek;if(!lw||lw.wk!==monKey())return '';const n=Object.keys(lw.served||{}).length;const need=Math.min(3,lw.left||0);
 return `<div class="ln-note">🗓️ This week's plan: <b>${n}</b> planned lunch${n===1?'':'es'} served.${lw.bonus?' Bonus earned! 🎉':lw.ok&&need?` Serve ${Math.max(0,need-n)} more for the 🪙 ${WEEK_BONUS} bonus.`:''}</div>`;}

/* ---------- week planner ---------- */
function weekGoals(days){const full=days.every(m=>m&&GROUPS.every(g=>m[g]));const it=g=>days.map(m=>m&&ITEM[m[g]]).filter(Boolean);
 const mains=it('prot').map(x=>x.id);const vegs=new Set(it('veg').map(x=>x.id));
 const tot=days.reduce((s,m)=>s+(m?GROUPS.reduce((a,g)=>a+(ITEM[m[g]]?ITEM[m[g]].pr:0),0):0),0);
 const treatEarly=days.slice(0,4).some(m=>m&&GROUPS.some(g=>isTreat(ITEM[m[g]])));
 const g={full,mains:mains.length===5&&new Set(mains).size===5,veg:vegs.size>=5,fish:it('prot').some(x=>has(x,'fish')),treat:!treatEarly,budget:tot<=WEEK_BUDGET,tot};
 g.all=g.full&&g.mains&&g.veg&&g.fish&&g.treat&&g.budget;return g;}
function wkDraft(p){const wk=planWk();if(!UI.wd||UI.wd.wk!==wk){const lw=p.lunchWeek&&p.lunchWeek.wk===wk?p.lunchWeek:null;UI.wd={wk,days:lw?lw.days.map(m=>Object.assign({},m)):[{},{},{},{},{}],served:lw?Object.assign({},lw.served||{}):{}};UI.wday=Math.max(0,wdIdx()<0||wk!==monKey()?0:wdIdx());UI.wgrp='fruit';}return UI.wd;}
function weekView(p){const W=wkDraft(p);const g=weekGoals(W.days);const di=UI.wday,dm=W.days[di];const locked=W.served[di]!=null;
 const thisWk=W.wk===monKey();const mon=new Date(W.wk+'T12:00:00');
 const say=`Plan <b>Monday to Friday</b>${thisWk?' for this week':' for next week'}! Meet every goal and I'll give you a <b>🪙 ${WEEK_BONUS} bonus</b> when you serve the week.`;
 const goal=(ok,t)=>`<div class="ln-goal ${ok?'ok':''}"><span class="ck">${ok?'✓':''}</span>${t}</div>`;
 const pct=Math.min(100,g.tot/WEEK_BUDGET*100);
 const tabs=DAYN.map((n,i)=>{const m=W.days[i];const dd=new Date(mon);dd.setDate(mon.getDate()+i);return `<button class="${i===di?'on':''} ${W.served[i]!=null?'served':''}" onclick="Lunch.wday(${i})"><b>${n}</b><small>${dd.getMonth()+1}/${dd.getDate()}</small><span>${GROUPS.map(gg=>m&&ITEM[m[gg]]?ITEM[m[gg]].e:'·').join('')}</span>${W.served[i]!=null?'<em>served</em>':''}</button>`;}).join('');
 const slots=GROUPS.map(gg=>{const x=dm&&ITEM[dm[gg]];return `<button class="ln-wslot ${UI.wgrp===gg?'on':''}" onclick="Lunch.wgrp('${gg}')" ${locked?'disabled':''}><span>${x?x.e:GI[gg]}</span><small>${x?x.n:GN[gg]}</small>${x?`<em>${money(x.pr)}</em>`:''}</button>`;}).join('');
 const pool=DB[UI.wgrp].map(r=>ITEM[r[0]]);
 const dayCost=dm?GROUPS.reduce((a,gg)=>a+(ITEM[dm[gg]]?ITEM[dm[gg]].pr:0),0):0;
 return `${head(p,say,'bubw')}<div class="ln-two week"><div class="ln-panel"><h3 class="ln-h">🗓️ Weekly goals</h3><div class="ln-goals">
  ${goal(g.full,'🍽️ All 5 days planned')}${goal(g.mains,'🍗 A different main (protein) every day')}${goal(g.veg,'🥦 At least 5 different veggies')}${goal(g.fish,'🐟 Fish at least once')}${goal(g.treat,'🎉 Treats only on Friday')}${goal(g.budget,`💵 Stay within ${money(WEEK_BUDGET)}`)}</div>
  <div class="ln-meter"><b>💵 Budget (one plate each day)</b><div class="bar"><i style="width:${pct}%;background:${g.budget?'#40c057':'#fa5252'}"></i></div><small>${money(g.tot)} of ${money(WEEK_BUDGET)} ${g.budget?'':' · over budget!'}</small></div>
  <div class="row" style="margin-top:10px"><button class="btn ${g.full?'green':'ghost dark'} big" ${g.full?'':'disabled'} onclick="Lunch.wsave()">💾 Save my week plan</button><button class="btn ghost dark small" onclick="Lunch.wback()">← Kitchen</button></div></div>
  <div class="ln-panel"><div class="ln-gstrip">${[[g.full,'🍽️'],[g.mains,'🍗'],[g.veg,'🥦'],[g.fish,'🐟'],[g.treat,'🎉'],[g.budget,'💵']].map(([o,e])=>`<span class="${o?'ok':''}">${e}${o?'✓':'…'}</span>`).join('')}<b>${money(g.tot)}</b></div><div class="ln-days">${tabs}</div><h3 class="ln-h">${DAYF[di]} ${locked?'🔒 already served':''} <small class="muted">${money(dayCost)}</small></h3><div class="ln-wslots">${slots}</div>
  ${locked?'<div class="ln-lockmsg">This day was already served, so it can\'t change.</div>':`<div class="ln-cards">${pool.map(x=>`<button class="ln-card ${dm&&dm[x.g]===x.id?'on':''} ${isTreat(x)?'treat':''}" onclick="Lunch.wpick('${x.id}')">${card(x,false,true)}</button>`).join('')}</div>${legend}`}</div></div>`;}

/* ---------- compliments around town ---------- */
function queueFb(p,S){const good=S.stars===3,nudge=S.stars<=1;if(!good&&!nudge&&Math.random()>=1/3)return;
 const m=S.menu,pt=ITEM[m.prot],vg=ITEM[m.veg],ev=S.ev;let who,text,tip=null,kind;
 if(nudge){kind='nudge';const broke=ev.st.find(s=>!s.ok);const tr=ev.all.filter(isTreat);
  if(tr.length>1){who=broke?NEEDS[broke.id].who:pk(Math.random,['wise','keeper','hoot']);text=`${tr[0].n} and ${tr[1].n.toLowerCase()} again? My tummy hurts. Try harder, chef! 😅`;tip='Tip: pick just <b>one</b> treat, and choose milk or water to drink.';}
  else if(!ev.drinkOK){who=pk(Math.random,['keeper','wise','ozzy']);text=`${ev.dr?ev.dr.n:'That drink'} with lunch? I got thirsty all afternoon!`;tip='Tip: <b>milk</b> or <b>water</b> is the best lunch drink.';}
  else if(broke){who=NEEDS[broke.id].who;text=NEEDS[broke.id].boo;tip='Tip: '+NEEDS[broke.id].tip;}
  else {who='rosa';text='We ran out of food in the lunch line yesterday! My order sheet numbers were a little off.';tip='Tip: read each order question slowly and use the hint. You can do it, chef!';}}
 else{kind='good';const met=ev.st.filter(s=>s.ok);who=met.length?NEEDS[pk(Math.random,met).id].who:pk(Math.random,['wise','hoot','quartz','nana','ozzy','elder']);
  text=pk(Math.random,[`Your ${pt.n.toLowerCase()} made the best lunch all month!`,`I'm still thinking about your ${pt.n.toLowerCase()} with ${vg.n.toLowerCase()}. Delicious!`,`Everyone in the realm is talking about your ${pt.n.toLowerCase()}! Great menu, chef!`]);
  tip=good?(Math.random()<.5?{coins:10}:{food:1}):{coins:5};}
 p.lunchFb={d:today(),at:Date.now()+10*60e3,who,text,tip,kind};}
function fbReady(p){const f=p&&p.lunchFb;if(!f)return false;return Date.now()>=f.at||f.d!==today();}
let fbShowing=false;
function fbCheck(){try{if(fbShowing||typeof curScreen==='undefined'||curScreen!=='world')return;const p=P();if(!p||!p.setup||!fbReady(p))return;
 if(document.querySelector('#modal.show'))return;if((window.visitorQuiet||0)>Date.now())return;if(typeof B!=='undefined'&&B&&!B.over&&curScreen==='battle')return;
 const f=p.lunchFb;p.lunchFb=null;let got='';
 if(f.tip&&f.tip.coins){p.coins=(p.coins||0)+f.tip.coins;got=`<div class="ln-tip">🎁 A thank-you tip: <b>🪙 ${f.tip.coins}</b></div>`;}
 else if(f.tip&&f.tip.food){const fd=PET_FOODS.filter(x=>x.price<=25);const x=pk(Math.random,fd.length?fd:PET_FOODS);p.pantry=p.pantry||{};p.pantry[x.id]=(p.pantry[x.id]||0)+1;got=`<div class="ln-tip">🎁 A thank-you gift for your pet: <b>${x.e} ${x.name}</b></div>`;}
 else if(typeof f.tip==='string')got=`<div class="ln-tip nudge">💡 ${f.tip}</div>`;
 save();window.visitorQuiet=Math.max(window.visitorQuiet||0,Date.now()+120e3);fbShowing=true;css();
 const c=CH[f.who]||CH.rosa;UI.rd.fb=`${c.n} says: ${f.text} ${String(typeof f.tip==='string'?f.tip:'').replace(/<[^>]+>/g,'')}`;
 modal(`<div class="mcard qz-card ln-fbcard"><div class="qz-row"><div class="qz-av">${avatar(f.who)}</div><div class="qz-bub ln-fbub"><b>${c.e} ${c.n} ${spk('fb')}</b><div><small class="ln-about">${f.d===today()?'About today\'s lunch:':'About your last lunch:'}</small>"${f.text}"</div>${got}</div></div>
  <div class="row"><button class="btn gold big" onclick="closeModal();Lunch._fbDone()">${f.kind==='good'?'Thank you! 💛':'Okay, I\'ll try! 👍'}</button></div></div>`);
 try{if(young(p)&&voiceOn())setTimeout(()=>speakNow(UI.rd.fb),500);}catch(e){}
 try{SFX.coin();}catch(e){}}catch(e){console.warn('lunch fb',e);}}

/* ---------- actions ---------- */
function start(){const p=P(),d=draft(p);d.st='plate';UI.grp=null;UI.msg='';UI.warn=[];save();try{SFX.tap();}catch(e){}go('cafe');}
function grp(g){UI.grp=g;UI.msg='';try{SFX.tap();}catch(e){}stay();}
function pickItem(id){const p=P(),d=draft(p),x=ITEM[id];if(!x||d.planned)return;const dp=dayPlan(p);
 if(d.plate[x.g]===id){delete d.plate[x.g];UI.warn=[];UI.msg='';save();stay();return;}
 d.plate[x.g]=id;try{if(typeof tone==='function')tone(700+Math.random()*300,.08,'sine',.05);else SFX.tap();}catch(e){}
 const broke=dp.needs.filter(n=>NEEDS[n].bad&&NEEDS[n].bad(x));UI.warn=broke.map(n=>NEEDS[n].warn);
 if(broke.length)try{toast('⚠️ '+NEEDS[broke[0]].warn);}catch(e){}
 UI.msg=broke.length?`Uh-oh! ${NEEDS[broke[0]].warn} 😟`:isTreat(x)&&x.g!=='drink'?`${x.e} ${x.n} is a treat! Yummy, but it makes the health meter go down.`:x.id==='soda'?'🥤 Soda is a sometimes drink. Milk or water is better for lunch!':'';
 if(!broke.length){const nx=GROUPS.find(g=>!d.plate[g]);if(nx)UI.grp=nx;}
 save();stay();}
function clear(){const p=P(),d=draft(p);if(d.planned)return;d.plate={};UI.warn=[];UI.msg='';UI.grp='fruit';save();stay();}
function send(){const p=P(),d=draft(p);const ev=evalPlate(d.plate,dayPlan(p).needs);if(!ev.full)return;try{document.getElementById('toast').classList.remove('show');}catch(e){}d.qs=makeQs(p,d);d.qi=0;d.tries=0;d.res=[];d.fb=null;d.st='math';UI.inp='';UI.msg='';UI.warn=[];save();try{SFX.win();}catch(e){}go('cafe');}
function key(k){if(k==='del')UI.inp=UI.inp.slice(0,-1);else if(UI.inp.length<6)UI.inp=(UI.inp==='0'?'':UI.inp)+k;try{SFX.tap();}catch(e){}const b=document.querySelector('.ln-ans');if(b)b.textContent=UI.inp||'?';}
function right(p){const dk=dayKey();p.daily=p.daily||{};p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk].r++;try{if(typeof wkAnswer==='function')wkAnswer(p,8);}catch(e){}}
function wrong(p){const dk=dayKey();p.daily=p.daily||{};p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk].w++;}
function check(){const p=P(),d=draft(p);if(d.st!=='math')return;const q=d.qs[d.qi];if(!q||d.fb==='ok'||d.fb==='reveal'||!UI.inp)return;const v=parseInt(UI.inp,10);UI.inp='';
 if(v===q.a){right(p);d.res[d.qi]=true;d.fb='ok';try{SFX.correct();}catch(e){}}
 else{wrong(p);d.tries++;try{SFX.wrong();}catch(e){}if(d.tries>=2){d.res[d.qi]=false;d.fb='reveal';}else d.fb='miss';}
 save();stay();}
function next(){const p=P(),d=draft(p);if(d.fb!=='ok'&&d.fb!=='reveal')return;d.qi++;d.tries=0;d.fb=null;UI.inp='';if(d.qi>=d.qs.length){finish(p,d);return;}save();go('cafe');}
function finish(p,d){const dp=dayPlan(p);const ev=evalPlate(d.plate,dp.needs);const m=d.qs.every((q,i)=>d.res[i]===true);const stars=(ev.bal?1:0)+(ev.needsOK?1:0)+(m?1:0);
 const coins=15+5*stars;p.coins=(p.coins||0)+coins;p.lunchTray=true;const f=pick(PET_FOODS);p.pantry=p.pantry||{};p.pantry[f.id]=(p.pantry[f.id]||0)+1;
 const menu=Object.assign({},d.plate);p.cafe={d:today(),done:true,stars,menu,b:ev.bal?1:0,n:ev.needsOK?1:0,m:m?1:0};if(d.planned)p.cafe.planned=1;
 p.cafePlates=(p.cafePlates||0)+1;const S0=stats(p);const wasUnl=weekUnlocked(p);S0.n=(S0.n||0)+1;if(stars===3)S0.three=(S0.three||0)+1;
 try{questEvent(p,'lunch',1);questEvent(p,'lstars',stars);}catch(e){}
 let bonus=false,wk='';const lw=p.lunchWeek;
 if(d.planned&&lw&&lw.wk===monKey()){lw.served=lw.served||{};lw.served[d.pi]=stars;const n=Object.keys(lw.served).length,need=Math.min(3,lw.left||0);
  if(lw.ok&&!lw.bonus&&need>0&&n>=need){lw.bonus=true;bonus=true;p.coins+=WEEK_BONUS;}wk=`${n} planned lunch${n===1?'':'es'} served${lw.bonus?' · bonus earned!':lw.ok&&need?` · ${Math.max(0,need-n)} more for the bonus`:''}`;}
 const S={stars,coins,treat:`${f.e} ${f.name}`,ev,m,menu,bonus,wk,unlock:!wasUnl&&weekUnlocked(p)};
 const eaters=dayPlan(p).vill.slice(0,12);S.eaters=eaters.length?eaters:['🧒','👧'];S.react=reactions(p,S);
 queueFb(p,S);p.lunchDraft=null;save();try{SFX.win();}catch(e){}UI.serve=S;UI.spoken='';go('cafe');}
/* week planner actions */
function week(){UI.view='week';UI.wd=null;UI.serve=null;try{SFX.tap();}catch(e){}go('cafe');}
function wback(){UI.view=null;go('cafe');}
function wday(i){UI.wday=i;stay();}
function wgrp(g){UI.wgrp=g;stay();}
function wpick(id){const W=UI.wd,x=ITEM[id];if(!W||!x||W.served[UI.wday]!=null)return;const m=W.days[UI.wday]=W.days[UI.wday]||{};
 if(m[x.g]===id){delete m[x.g];stay();return;}const wasFull=GROUPS.every(g=>m[g]);m[x.g]=id;try{SFX.tap();}catch(e){}
 const nx=GROUPS.find(g=>!m[g]);if(nx)UI.wgrp=nx;else if(!wasFull){const nd=[0,1,2,3,4].find(i=>i>UI.wday&&W.served[i]==null&&!GROUPS.every(g=>(W.days[i]||{})[g]));if(nd!=null){UI.wday=nd;UI.wgrp='fruit';}}stay();}
function wsave(){const p=P(),W=UI.wd;if(!W)return;const g=weekGoals(W.days);if(!g.full)return;
 const old=p.lunchWeek&&p.lunchWeek.wk===W.wk?p.lunchWeek:null;const thisWk=W.wk===monKey();
 let left=5;if(thisWk){const i=wdIdx();left=Math.max(0,5-i-(doneToday(p)&&!(old&&old.served&&old.served[i]!=null)?1:0));/* days still to serve, counting today unless today's lunch is already done */}
 if(old&&old.left!=null)left=Math.max(left,old.left);
 p.lunchWeek={wk:W.wk,days:W.days.map(m=>Object.assign({},m)),ok:g.all,goals:{mains:g.mains,veg:g.veg,fish:g.fish,treat:g.treat,budget:g.budget,tot:g.tot},served:old?old.served||{}:{},left,bonus:old?!!old.bonus:false,saved:Date.now()};
 /* today's lunch not started yet? it now follows the plan */
 const d=p.lunchDraft;if(d&&d.d===today()&&(d.st==='intro'||d.st==='plate')&&!d.planned){p.lunchDraft=null;}
 save();try{SFX.win();}catch(e){}
 toast(g.all?`🗓️ Week plan saved! Every goal met: serve it for a 🪙 ${WEEK_BONUS} bonus!`:'🗓️ Week plan saved! Some goals are still open, so no bonus this time.');UI.view=null;go('cafe');}

/* ---------- the screen ---------- */
function screen(){const p=P();if(!p)return;css();
 try{if(typeof CAFE!=='undefined'&&CAFE===null){fresh();CAFE={lunch:1};}}catch(e){}
 UI.rd={};
 const back=`<div class="zhead"><button class="btn ghost small" onclick="CAFE=null;go('world')">← World</button><h2 class="title">🍱 Realm Lunch</h2></div>`;
 let body='';
 if(UI.view==='week'&&weekUnlocked(p))body=weekView(p);
 else if(UI.serve)body=serveView(p);
 else if(doneToday(p))body=doneView(p);
 else{const d=draft(p);if(d.st==='math'&&(!d.qs||!d.qs.length))d.st='plate';
  body=d.st==='intro'?introView(p,d):d.st==='plate'?plateView(p,d):mathView(p,d);}
 app.innerHTML=topbar()+`<div class="room cafe-room"><div class="page cafe ln">${back}${body}</div></div>`;}

/* ---------- styles ---------- */
let CSS=false;function css(){if(CSS)return;CSS=true;const st=document.createElement('style');st.textContent=`
.qz-row{display:flex;gap:12px;align-items:flex-start;text-align:left}.qz-av{flex:0 0 96px}.qz-av svg{width:96px;height:116px}
.qz-bub{flex:1;background:#e7f5ff;border:3px solid #74c0fc;border-radius:18px;padding:10px 14px;font-size:18px;line-height:1.45;color:#1f2340}.qz-bub>b{display:block;color:#1971c2;font-size:14px;margin-bottom:2px}
@media(max-width:560px){.qz-av{flex-basis:70px}.qz-av svg{width:70px;height:85px}.qz-bub{font-size:16px}}
.ln{color:var(--ink)}.ln *{box-sizing:border-box}
.ln-head{display:flex;gap:10px;align-items:flex-end;margin-bottom:6px}.ln-rosabox{width:104px;flex:none}.ln-rosa{width:100%;height:auto;display:block;animation:bob 2.4s ease-in-out infinite}
.ln-bubble{margin-bottom:14px;min-width:0}.ln-bubble .nm{display:flex;align-items:center;gap:6px}
.ln-spk{border:0;background:#fff4e6;border-radius:50%;width:34px;height:34px;font-size:17px;cursor:pointer;flex:none;box-shadow:0 2px 0 rgba(0,0,0,.15);vertical-align:middle;margin-left:auto;padding:0}
.ln-h .ln-spk,.ln-q .ln-spk,.ln-rt .ln-spk,.qz-bub .ln-spk{margin-left:6px}
.ln-steps{margin-bottom:10px}.ln-steps .cst{display:flex;flex-direction:column;align-items:center;gap:2px}.ln-steps small{font-size:11px;font-weight:700;color:#7a3e0e}
.ln-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:14px;align-items:start}.ln-two>*{min-width:0}
.ln-panel{background:rgba(255,255,255,.85);border-radius:20px;padding:12px;box-shadow:0 3px 0 rgba(122,62,14,.15)}
.ln-h{margin:0 0 8px;font-size:17px;display:flex;align-items:center;flex-wrap:wrap;gap:4px}
.ln-board{background:#2b2b2b;color:#fff;border-radius:12px;padding:8px 12px;font-family:"Chalkboard SE","Comic Sans MS",cursive;border:7px solid #8d6e63;box-shadow:0 4px 0 rgba(0,0,0,.2)}
.ln-board .ln-bt{text-align:center;font-size:19px;font-weight:700;color:#ffe066;margin-bottom:4px}.ln-board>div:not(.ln-bt){display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px dashed #555;font-size:16px}.ln-board>div:last-child{border:0}
.ln-board>div>span:last-child{text-align:right}.ln-blank{opacity:.5;font-style:normal;display:inline-block;min-width:60px;border-bottom:2px solid #777;text-align:center}
.ln-guest{display:flex;gap:10px;align-items:flex-start;background:#fff9f0;border-radius:14px;padding:8px 10px;margin-bottom:6px;border:2px solid #ffe8cc}
.ln-gav{font-size:36px;line-height:1;flex:none}.ln-need{display:inline-block;font-size:12px;font-weight:800;background:#ffe3e3;color:#c92a2a;border-radius:10px;padding:1px 8px;vertical-align:2px}.ln-quote{font-style:italic;color:#6b5a3a;font-size:15px;line-height:1.35;margin-top:2px}
.ln-vill{display:flex;flex-direction:column;gap:2px;margin-top:4px}.ln-vill span{font-size:22px;line-height:1.2;display:flex;flex-wrap:wrap}.ln-vill i{font-style:normal}.ln-vill b{font-size:15px;align-self:center;margin-left:4px}.ln-vill small{color:#6b5a3a}
.ln-go{margin-top:12px}.ln-wklink{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:10px;text-align:center}.ln-wklink small{color:#7a3e0e}
.ln-platewrap{display:flex;gap:10px;align-items:center;justify-content:center}
.ln-plate{width:min(250px,60vw);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff 62%,#e9edf2 63%,#fff 70%,#dfe4ea 100%);display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;padding:9%;gap:4px;box-shadow:0 6px 0 rgba(0,0,0,.12)}
.ln-slot{border:0;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;padding:2px;color:var(--ink);min-width:0;background:#f8f9fa}
.ln-slot span{font-size:30px;line-height:1.1}.ln-slot small{font-size:10.5px;font-weight:800;line-height:1.1;text-align:center;overflow:hidden;max-width:100%}
.ln-plate .ln-slot:nth-child(1){border-radius:60% 14px 14px 14px}.ln-plate .ln-slot:nth-child(2){border-radius:14px 60% 14px 14px}.ln-plate .ln-slot:nth-child(3){border-radius:14px 14px 14px 60%}.ln-plate .ln-slot:nth-child(4){border-radius:14px 14px 60% 14px}
.ln-s-fruit{background:#ffe3e3}.ln-s-veg{background:#ebfbee}.ln-s-grain{background:#fff4e6}.ln-s-prot{background:#f3f0ff}
.ln-slot:not(.full) span{opacity:.35}.ln-slot.on{box-shadow:inset 0 0 0 3px #e8590c}.ln-slot.full{animation:plpop .35s cubic-bezier(.2,1.6,.4,1)}
.ln-cup{width:66px;height:96px;flex:none;background:#e7f5ff!important;border:3px solid #74c0fc;border-radius:6px 6px 18px 18px}
.ln-meter{margin-top:10px;background:#fff;border-radius:14px;padding:8px 12px}.ln-meter .bar{height:16px;border-radius:10px;background:#f1f3f5;overflow:hidden;margin:5px 0}.ln-meter .bar i{display:block;height:100%;transition:width .4s}.ln-meter small{color:#6b5a3a;font-size:14px}
.ln-warn{margin-top:8px;background:#fff5f5;border:2px solid #ff8787;color:#c92a2a;border-radius:14px;padding:8px 12px;font-weight:700;animation:plpop .3s}.ln-warn small{display:block;font-weight:600;color:#a36;font-size:13px}
.ln-goals{display:grid;gap:5px;margin-top:8px}.ln-goal{display:flex;align-items:center;gap:8px;background:#fff;border-radius:12px;padding:6px 10px;font-weight:700;border:2px solid #ffe8cc;font-size:15px}
.ln-goal .ck{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e9ecef;color:#fff;font-size:13px;flex:none}.ln-goal.ok{border-color:#8ce99a}.ln-goal.ok .ck{background:#2f9e44}
.ln-gchips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.ln-gchip{background:#fff;border:2px solid #dee2e6;border-radius:12px;padding:3px 8px;font-size:14px;font-weight:700}.ln-gchip.ok{border-color:#8ce99a}.ln-gchip.bad{border-color:#ff8787;background:#fff5f5}
.ln-tray{background:#8d6e63;color:#fff}
.ln-two.plate{grid-template-areas:"a t" "b t"}.ln-pa{grid-area:a}.ln-pb{grid-area:b}.ln-two.plate .ln-tray{grid-area:t}.ln-tray .ln-warn{margin:0 0 8px}
.ln-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-bottom:8px}.ln-tabs button{font:inherit;font-size:13px;font-weight:800;border:0;border-radius:12px;padding:5px 2px;background:rgba(255,255,255,.25);color:#fff;cursor:pointer;white-space:nowrap;overflow:hidden;display:flex;flex-direction:column;align-items:center;line-height:1.15}.ln-tabs button span{font-size:20px}.ln-tabs button.on{background:#ffd43b;color:#5c3b1e}
.ln-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:7px}
.ln-card{position:relative;background:#fffdf5;border:0;border-radius:14px;padding:6px 4px 5px;font:inherit;color:var(--ink);cursor:pointer;display:flex;flex-direction:column;align-items:center;box-shadow:0 3px 0 rgba(0,0,0,.22);min-width:0}
.ln-card.on{background:#d3f9d8;box-shadow:0 0 0 3px #2f9e44}.ln-card.treat{background:#fff0f6}.ln-card.treat.on{background:#d3f9d8}
.ln-ce{font-size:30px;line-height:1.1}.ln-cn{font-size:13px;font-weight:800;line-height:1.15;text-align:center;min-height:2.3em;display:flex;align-items:center}
.ln-ct{display:flex;flex-wrap:wrap;justify-content:center;gap:1px;font-size:13px;min-height:17px;align-items:center}.ln-ct i{font-style:normal}.ln-ct em{font-style:normal;font-size:10px;font-weight:800;background:#f06595;color:#fff;border-radius:8px;padding:0 5px;margin-left:2px}
.ln-pr{font-size:12px;font-weight:800;color:#2b8a3e}
.ln-legend{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;margin-top:8px;opacity:.95}
.ln-lockmsg{background:rgba(255,255,255,.9);color:var(--ink);border-radius:14px;padding:12px;text-align:center;font-size:16px}
.ln-sheet{background:#fffef5;background-image:repeating-linear-gradient(#fffef5 0 31px,#d0ebff 31px 32px);border-radius:14px;padding:14px 16px;max-width:640px;margin:0 auto;box-shadow:0 4px 0 rgba(0,0,0,.18);border-left:6px solid #ff8787}
.ln-sh-top{display:flex;justify-content:space-between;align-items:center;font-size:15px;color:#c05621;margin-bottom:4px}.ln-q{line-height:1.4}
.ln-vis{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin:6px 0;background:#fff;border-radius:14px;padding:8px}
.ln-grp{display:inline-flex;flex-wrap:wrap;justify-content:center;gap:2px;font-size:30px;line-height:1.15;background:#f8f9fa;border-radius:12px;padding:4px 6px;max-width:100%}.ln-grp i{font-style:normal}.ln-grp.gone i{opacity:.35;text-decoration:line-through;position:relative}.ln-grp.gone i::after{content:'✕';position:absolute;left:18%;top:-2px;color:#e03131;font-size:28px;opacity:1}
.ln-op{font-size:30px;color:#c05621}.ln-grp.sm{font-size:17px;gap:0;padding:3px 4px}.ln-about{display:block;font-size:13px;color:#8a5a2b;font-weight:700}.ln-ans.ok{background:#d3f9d8}.ln-ans.rev{background:#fff3bf}.ln-post{font-size:18px}
.ln-fbk.ok{background:#ebfbee;border-color:#8ce99a}.ln-fbk.reveal{background:#fff9db}
.ln-room{background:linear-gradient(#fff9db,#ffe8cc);border-radius:20px;padding:12px;border:4px solid #d9a066;max-width:760px;margin:0 auto}
.ln-rt{font-weight:800;color:#7a3e0e;text-align:center;margin-bottom:6px}.ln-room .ln-board{max-width:380px;margin:0 auto 10px}
.ln-diners{display:grid;gap:8px}.ln-diner{display:flex;gap:10px;align-items:center;opacity:0;animation:lnIn .45s forwards}
@keyframes lnIn{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
.ln-de{font-size:38px;line-height:1;flex:none;width:46px;text-align:center}.ln-say{flex:1;background:#fff;border-radius:16px;padding:7px 12px;border:3px solid #8ce99a;position:relative;font-size:16px;line-height:1.35}.ln-say.meh{border-color:#ffc078}.ln-say b{display:block;font-size:12px;color:#7a3e0e}
.ln-table{margin-top:10px;background:#c9a27a;border-radius:10px;padding:6px;display:flex;flex-wrap:wrap;justify-content:center;gap:4px;font-size:24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.15)}.ln-table i{font-style:normal;animation:bob 2s ease-in-out infinite}.ln-table i:nth-child(2n){animation-delay:.5s}
.ln-stars{display:flex;justify-content:center;gap:10px;margin:14px 0}.ln-star{background:#fff;border-radius:16px;padding:8px 10px;text-align:center;width:118px;opacity:0;animation:lnIn .4s forwards;border:3px solid #dee2e6}.ln-star.on{border-color:#fcc419;background:#fff9db}
.ln-star span{font-size:34px;display:block;line-height:1.1}.ln-star small{font-weight:800;font-size:13px}
.ln-reward{margin-top:4px}.ln-unlock{max-width:640px;margin:0 auto 12px;background:#d3f9d8;border:3px solid #40c057;border-radius:16px;padding:10px 14px;text-align:center;font-size:17px}
.ln-note{background:#fff9db;border-radius:14px;padding:10px 12px;margin-bottom:8px}.ln-donestars{text-align:center;font-size:34px;margin-top:8px}
.ln-days{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-bottom:8px}
.ln-days button{font:inherit;border:2px solid #ffd8a8;background:#fff9f0;border-radius:12px;padding:5px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;color:var(--ink);min-width:0;overflow:hidden}
.ln-days button.on{background:#ffd43b;border-color:#e8590c}.ln-days button.served{background:#d3f9d8}.ln-days b{font-size:14px}.ln-days small{font-size:11px;color:#8a7b5a}.ln-days span{font-size:11px;letter-spacing:-2px;white-space:nowrap;max-width:100%;overflow:hidden}.ln-days em{font-size:10px;font-style:normal;color:#2b8a3e;font-weight:800}
.ln-gstrip{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:8px}.ln-gstrip span{background:#f1f3f5;border-radius:10px;padding:2px 7px;font-size:14px;font-weight:800;color:#868e96}.ln-gstrip span.ok{background:#d3f9d8;color:#2b8a3e}.ln-gstrip b{margin-left:auto;font-size:14px;color:#2b8a3e}
.ln-wslots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin-bottom:8px}.ln-wslot{font:inherit;border:0;border-radius:12px;background:#f8f9fa;padding:5px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;color:var(--ink);min-width:0;box-shadow:0 2px 0 rgba(0,0,0,.12)}
.ln-wslot.on{box-shadow:inset 0 0 0 3px #e8590c;background:#fff4e6}.ln-wslot span{font-size:26px}.ln-wslot small{font-size:10.5px;font-weight:800;text-align:center;line-height:1.1;overflow:hidden;max-width:100%}.ln-wslot em{font-style:normal;font-size:11px;color:#2b8a3e;font-weight:800}
.week .ln-cards{grid-template-columns:repeat(auto-fill,minmax(92px,1fr))}.week .ln-panel:last-child .ln-legend{color:var(--ink)}
.ln-emav{width:88px;height:88px;border-radius:50%;background:#fff4e6;display:flex;align-items:center;justify-content:center;font-size:54px;border:3px solid #ffc078}
.ln-fbub{background:#fff4e6;border-color:#ffc078}.ln-fbub>b{color:#d9480f;display:flex;align-items:center}.ln-tip{margin-top:8px;background:#fff;border-radius:12px;padding:6px 10px;font-size:16px}.ln-tip.nudge{background:#e7f5ff}
@media(max-width:760px){.ln-two{grid-template-columns:1fr}.ln-two.plate{grid-template-areas:"a" "t" "b"}.ln-rosabox{width:78px}.ln-bubble{font-size:15px;padding:8px 11px}.ln-plate{width:min(210px,54vw)}.ln-cup{width:56px;height:84px}.ln-slot span{font-size:26px}}
@media(max-width:420px){.ln-cards{grid-template-columns:repeat(3,minmax(0,1fr))}.ln-tabs button{font-size:11.5px;padding:5px 0}.ln-star{width:auto;flex:1;padding:6px 4px}.ln-star small{font-size:11.5px}.ln-emav{width:62px;height:62px;font-size:38px}.ln-grp{font-size:26px}.ln-days span{display:none}.ln-wslot small{font-size:9.5px}}
@media (prefers-reduced-motion:reduce){.ln-diner,.ln-star{animation:none;opacity:1}.ln-rosa,.ln-table i{animation:none}}`;document.head.appendChild(st);}

/* ---------- wiring ---------- */
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.cafe=screen;}else setTimeout(reg,30);})();
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({screen:s=>{if(s==='world')setTimeout(fbCheck,1600);}});
setInterval(()=>{try{if(typeof curScreen!=='undefined'&&curScreen==='world')fbCheck();}catch(e){}},30e3);
window.Lunch={read,start,grp,pick:pickItem,clear,send,key,check,next,week,wback,wday,wgrp,wpick,wsave,
 _fbDone:()=>{fbShowing=false;},_fbCheck:fbCheck,_dayPlan:dayPlan,_eval:evalPlate,_makeQs:makeQs,_weekGoals:weekGoals,_ITEM:ITEM,_NEEDS:NEEDS,_UI:()=>UI,_reset:()=>{DAYC={};fresh();},monKey,planWk,WEEK_BUDGET};
})();
