/* ================= Pet Food Truck Market (hidden for now) =================
   Every hero gets a little food truck in the village square: buy ingredients, cook pet treats (with
   grade-scaled math), pick one of three set prices, open the truck for 1/6/12 hours, read the receipt,
   sell to siblings, and fill the family Pet Picnic every other weekend.

   HIDDEN: registers SCREENS.truck + SCREENS.market, but offers NO entry point unless
   localStorage 'mqTruckBeta'==='1' (or window.MQ_TRUCK_BETA===true). Unlock: 30 battle wins.

   Data: p.truck (compact, own player only; other players are only ever READ):
    v:1  i:intro done  n:[w1,w2] name words  c:paint  a:awning  m:mascot pet id ('' = default)
    inv:{fl,ca,eg,mb,fr,ju}      ingredients
    b:[{id,r,q,p,tr,k,t,x,vs,vc,ve,g,h,f:[[orderId,buyerId,n,price]],j:[orderId]}]
       stock batches: id stable per batch, r recipe, q made, p price, tr tier 0/1/2, k ingredient cost,
       t cooked, x closed-at (0 = on the counter), vs/vc village sold/coins, ve village buyer emoji,
       g given to picnic, h taken home, f family orders PAID (seller-side), j family orders REJECTED
    ck:{r,q,k,nb}                cooked, waiting for a price
    sh:{s,e,l,n,c,tn,r,q}        shift start/end, settled-to, customers, coins, turned away, receipt read, quick check done
    vd:{k,c}                     village coins today (cap 60)
    o:[{i,s,b,r,n,p,t,x}]        MY purchases from family trucks (buyer-side). x: 0 pending, 1 refunded, 2 confirmed
    pd:[orderId]                 paid order ids from pruned batches (so late buyers still see "confirmed")
    bag:{bis,muf,pop}            Treat Bag
    bk:{'bis.c':'a'|'h'}         recipe book: math steps solved alone / with help
    ms:{a,h}                     totals solved alone / with help
    pc:{id,s,d,q,cel}            my Pet Picnic contribution for event id
    pcs:[eventId]                picnic postcards
    sq:{k,n,d}                   shop question counters for today
   Sync safety: the buyer writes an order into ITS OWN object and pays at once; the seller's device
   (the only writer of the seller object) accepts orders in (t,id) order while stock lasts (-> f, collects
   the coins) or rejects them (-> j); the buyer's device sees j and refunds itself once (x=1).

   v2 (Grand Opening): Chef Stars, Specials, Daily Cravings, rare Adventure Camp ingredients, decorations.
    more data: st stars 0-3 (never removed) · ff:[[day,n]] fair-price sales, last 7 days · cf craving-special
    sales after ⭐2 · sp:['adj.base.top.flav'] special slots · rr:{id:n} rare ingredients · dc:'lfs' decorations
    batch: sp (special recipe string, rare if its topping is a rare id)
   BALANCE (tune after the Oct 10 weekend):
    - regular treats cost 2/each; price choices cost / +1 / +3. Specials cost 3-6/each; choices +2 / +4 / +6.
    - village customers/hour: fast 3 · steady 1.5 · slow 0.6; a craving match doubles it (at least "fast"),
      rare specials always sell "fast"; each Chef Star adds +15%.
    - village money is capped per day: 60 / 80 / 100 / 100 🪙 at 0 / 1 / 2 / 3 stars. Profit is roughly half of
      that at steady/slow prices, plus family sales (≤10 items a buyer a day, coins just move between kids)
      => a keen kid nets ~40-100 🪙 profit per play day (battles pay ~60 each, so battles stay the main income).
    - rare ingredients only come from Adventure Camp (short 10% · long 35% · overnight 70%, 0-1 per trip);
      one rare = one batch, sold at "fast" even at the top price, so ~+24-36 🪙 extra profit per rare.
    - decorations 200-800 🪙 (8 items, ~3,400 🪙 total) are the long-term coin sink.
    - hook for later: Truck.hooks.critic(p,t) is called when a truck screen opens on a weekend (food critic). */
(function(){
'use strict';
const H=36e5,DAY=864e5,UNLOCK=30,BUY_DAY=10,PIC_PAY=4,PIC_GOAL={s:24,d:12},KEEP=14*DAY;
const CAPS=[60,80,100,100],RMAX=12,SP_ADD=[2,4,6];
const RATE=[3,1.5,.6];
let SKEW=0,PFORCE=false,UID=0;
const now=()=>Date.now()+SKEW;
const dk=t=>{const d=new Date(t==null?now():t);try{if(typeof dayKey==='function')return dayKey(d);}catch(e){}return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const dnum=t=>{const k=dk(t).split('-').map(Number);return Math.floor(Date.UTC(k[0],k[1]-1,k[2])/DAY);};
const E=s=>typeof esc==='function'?esc(s):String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sfx=n=>{try{SFX[n]();}catch(e){}};
const sv=()=>{try{save();}catch(e){}};
const me=()=>{try{return P();}catch(e){return null;}};
const players=()=>(typeof state!=='undefined'&&state&&state.players)||[];
const byId=id=>players().find(x=>x.id===id);
const say=m=>{try{toast(m);}catch(e){}};
/* HIDDEN for now (Oct 2026): no opening date. The truck only shows on a device that opened the game with ?truck=1 in the
   address (a grown-up preview); ?truck=0 hides it again. The preview key was renamed so earlier previews are switched off. */
function flag(){if(window.MQ_TRUCK_BETA===true)return true;try{const m=/[?&]truck=([01])(&|$)/.exec(location.search);if(m){if(m[1]==='1')localStorage.setItem('mqTruckPreview','1');else localStorage.removeItem('mqTruckPreview');}localStorage.removeItem('mqTruckBeta');return localStorage.getItem('mqTruckPreview')==='1';}catch(e){return false;}}
/* the truck parks on the village map once it is open (same pattern as Dr. Quartz's Lab) */
const TK_X=25,TK_Y=17;
function syncTile(){try{if(typeof W==='undefined'||!W||!W.T)return;const t=W.T[TK_Y]&&W.T[TK_Y][TK_X];if(!t||t.water)return;
 if(t.npc==='truck'){delete t.npc;t.block=false;}}catch(e){}} /* Oct 2026: the Food Truck parks on Main Street (town.js) */
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world')syncTile();},session:()=>syncTile()});
const enabled=p=>!!p&&flag()&&(p.battles||0)>=UNLOCK;
function hs(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=hs(seed);return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const uid=pre=>pre+now().toString(36)+Math.random().toString(36).slice(2,5);
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const C=n=>`${n} 🪙`;

/* ---------- game data ---------- */
const ING={
 fl:{e:'🌾',n:'Flour',u:'scoop',us:'scoops',p:2,bq:6,bp:9},
 ca:{e:'🥕',n:'Carrots',u:'carrot',us:'carrots',p:1,bq:6,bp:5},
 eg:{e:'🥚',n:'Eggs',u:'egg',us:'eggs',p:1,bq:6,bp:5},
 mb:{e:'🫐',n:'Moonberries',u:'cup',us:'cups',p:3,bq:4,bp:10},
 fr:{e:'🍓',n:'Fruit',u:'fruit',us:'fruit',p:2,bq:6,bp:10},
 ju:{e:'🧃',n:'Juice',u:'cup',us:'cups',p:2,bq:4,bp:6}};
const REC={
 bis:{id:'bis',e:'🦴',n:'Puppy Biscuits',one:'biscuit',many:'biscuits',makes:4,need:{fl:2,ca:2,eg:2},main:'eg',big:'fl',x:{e:'🥜',n:'peanut butter',a:1,b:4},hs:{to:10,k:'fl'},kind:'s'},
 muf:{id:'muf',e:'🧁',n:'Moonberry Muffins',one:'muffin',many:'muffins',makes:6,need:{fl:2,mb:2,eg:2},main:'eg',big:'mb',x:{e:'🍯',n:'honey',a:1,b:2},hs:{to:15,k:'mb'},kind:'s'},
 pop:{id:'pop',e:'🍧',n:'Fruit Pops',one:'pop',many:'pops',makes:5,need:{fr:3,ju:2},main:'fr',big:'fr',x:{e:'🍋',n:'lemon juice',a:3,b:4},hs:{to:15,k:'ju'},kind:'d'}};
const RIDS=['bis','muf','pop'];
const cost1=r=>sum(Object.keys(REC[r].need),k=>REC[r].need[k]*ING[k].p);
const each=r=>cost1(r)/REC[r].makes;
const TIERS=[{add:0,face:'😀😀😀',n:'Sells fast'},{add:1,face:'😀😀',n:'Steady'},{add:3,face:'😐',n:'Sells slowly'}];
const priceOf=(r,tr)=>each(r)+TIERS[tr].add;
const PAINT=['#ff8787','#74c0fc','#b197fc','#8ce99a','#ffd43b','#ffa94d','#f783ac','#63e6be'];
const AWN=['#ff6b6b','#fab005','#12b886','#339af0','#845ef7','#e64980'];
const W1=['Moon','Taco','Happy','Sunny','Rocket','Berry','Cozy','Paws','Star','Bubble','Lucky','Yummy'];
const W2=['Muffins','Treats','Snacks','Kitchen','Bakery','Café','Wagon','Bites','Express','Munchies','Diner','Rocket'];
const CUST=['🐶','🐱','🐰','🦊','🐻','🐢','🐷','🐼','🐹','🦔'];
const STARTER={fl:2,ca:2,eg:2};
const TREAT_FX={bis:{food:1,joy:0,xp:3},muf:{food:1,joy:1,xp:4},pop:{food:0,joy:2,xp:3}};
const band=p=>{const g=p.adult?12:(+p.grade||3);return g<=2?0:g<=4?1:g<=8?2:3;};
/* specials: base recipe + topping + flavor (+ name word). Extras cost per treat, so cost ÷ yield is always whole. */
const FLAV={swe:{e:'🍭',n:'sweet',w:'Sweet',c:1},cru:{e:'🥜',n:'crunchy',w:'Crunch',c:1},fru:{e:'🍑',n:'fruity',w:'Fruity',c:1},spi:{e:'🔥',n:'spicy',w:'Zing',c:2},fiz:{e:'🫧',n:'fizzy',w:'Fizz',c:2}};
const FIDS=Object.keys(FLAV);
const BASEF={bis:'cru',muf:'swe',pop:'fru'},BASEW={bis:'Biscuit',muf:'Muffin',pop:'Pop'};
const TOP={hon:{e:'🍯',n:'Honey',u:'cup',us:'cups',a:1,b:4,c:1},spr:{e:'🎊',n:'Sprinkle',u:'spoon',us:'spoons',a:1,b:2,c:1},car:{e:'🥕',n:'Carrot Curl',u:'cup',us:'cups',a:1,b:2,c:1},
 mbr:{e:'🫐',n:'Moonberry',u:'cup',us:'cups',a:1,b:4,c:2},cho:{e:'🍫',n:'Choco Chip',u:'spoon',us:'spoons',a:3,b:4,c:2}};
const RARE={dp:{e:'🌶️',n:'Dragon Pepper'},ss:{e:'✨',n:'Star Sugar'},ch:{e:'🐝',n:'Cave Honey'},mm:{e:'🌿',n:'Moon Mint'},rb:{e:'🌈',n:'Rainbow Berry'}};
const ADJ=['Sparkly','Happy','Super','Cozy','Zippy','Golden','Magic','Mega','Jolly','Tiny'];
function spParse(def){if(!def)return null;const [a,b,tp,f]=String(def).split('.');if(!REC[b]||!FLAV[f]||!(TOP[tp]||RARE[tp]))return null;const rare=!!RARE[tp],Tp=rare?RARE[tp]:TOP[tp],F=FLAV[f];
 const xc=(rare?0:Tp.c)+F.c;return {def,a:+a||0,b,tp,f,rare,Tp,F,name:`${ADJ[+a]||ADJ[0]} ${Tp.n} ${F.w} ${BASEW[b]}`,e:REC[b].e+Tp.e+F.e,xc,each:each(b)+xc,flavs:[...new Set([f,BASEF[b]])]};}
const itemN=b=>{const s=b.sp&&spParse(b.sp);return s?s.name:REC[b.r].n;};
const itemE=b=>{const s=b.sp&&spParse(b.sp);return s?s.e:REC[b.r].e;};
const flavsOf=b=>{const s=b.sp&&spParse(b.sp);return s?s.flavs:[BASEF[b.r]];};
/* daily cravings: 2 flavors, the same on every device (seeded by the date) */
function cravings(t){const R=rng('crave'+dnum(t));const a=FIDS.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,2);}
const matches=(b,t)=>{const c=cravings(t);return flavsOf(b).some(f=>c.includes(f));};
const stars=t=>(t&&t.st)|0;
function rateOf(b,at,st){const s=b.sp&&spParse(b.sp);let r=s&&s.rare?RATE[0]:RATE[b.tr|0];if(matches(b,at))r=Math.max(r*2,RATE[0]);return r*(1+.15*st);}
/* chef stars (never taken away) */
const FAIR_N=20,CROWD_N=10;
function fairAdd(t,at,n){const d=dnum(at);t.ff=t.ff||[];const e=t.ff.find(x=>x[0]===d);if(e)e[1]+=n;else t.ff.push([d,n]);t.ff=t.ff.filter(x=>x[0]>dnum()-7).slice(-7);}
const fair7=t=>sum((t.ff||[]).filter(x=>x[0]>dnum()-7),x=>x[1]);
function soldAt(t,b,at,n){if((b.tr|0)<2)fairAdd(t,at,n);if(b.sp&&stars(t)>=2&&matches(b,at))t.cf=(t.cf||0)+n;}
function starCheck(t){const s0=stars(t);
 if(stars(t)===0&&Object.keys(t.bk||{}).some(k=>/\.(c|g)$/.test(k)&&t.bk[k]==='a'))t.st=1;
 if(stars(t)===1&&fair7(t)>=FAIR_N)t.st=2;
 if(stars(t)===2&&(t.cf||0)>=CROWD_N)t.st=3;
 return stars(t)-s0;}
const STAR_RULE=['Work out what a treat costs to make, all by yourself (no hint).',`Sell ${FAIR_N} treats at a fast or steady price within 7 days.`,`Sell ${CROWD_N} Chef's Specials that match the day's craving.`];
const STAR_NAME=['Math Chef','Fair & Friendly','Crowd Favorite'];
function starLine(t){const s=stars(t);if(s===0)return 'Work out what a treat costs to make, all by yourself (no hint), to earn your 1st star.';
 if(s===1){const n=Math.max(0,FAIR_N-fair7(t));return `Sell ${n} more treat${n===1?'':'s'} at a fast or steady price this week to earn your 2nd star.`;}
 if(s===2){const n=Math.max(0,CROWD_N-(t.cf||0));return `Sell ${n} more Chef's Special${n===1?'':'s'} that match${n===1?'es':''} the day's craving to earn your 3rd star.`;}
 return "All 3 stars! You're a top chef.";}
const starStr=s=>'⭐'.repeat(s)+'☆'.repeat(3-s);
const spSlots=t=>stars(t)>=3?2:1;
/* decorations (cosmetic) */
const DECO=[{id:'l',e:'💡',n:'String lights',c:200},{id:'f',e:'🌷',n:'Flower box',c:250},{id:'s',e:'🍭',n:'Candy-stripe awning',c:300},{id:'b',e:'🛏️',n:'Pet bed on the roof',c:350},
 {id:'m',e:'📋',n:'Big menu board',c:400},{id:'n',e:'🌟',n:'Neon sign',c:500},{id:'w',e:'💫',n:'Sparkle wheels',c:600},{id:'g',e:'🍩',n:'Giant donut',c:800}];

/* ---------- storage ---------- */
function T(p){const t=p.truck=p.truck||{v:1};t.inv=t.inv||{};t.b=t.b||[];t.o=t.o||[];t.bag=t.bag||{};t.bk=t.bk||{};t.ms=t.ms||{a:0,h:0};return t;}
const R0=pl=>pl&&pl.truck&&pl.truck.i&&pl.truck.n?pl.truck:null; // read-only view of another player's truck
const tname=t=>t&&t.n?`${W1[t.n[0]]||W1[0]} ${W2[t.n[1]]||W2[0]}`:'My Truck';
const petE=id=>{try{const x=(typeof PETS!=='undefined'?PETS:[]).find(q=>q.id===id);return x?x.e:null;}catch(e){return null;}};
const mascotE=t=>(t&&t.m&&petE(t.m))||'🐾';
const bLeft=b=>b.q-(b.vs||0)-(b.g||0)-(b.h||0)-sum(b.f||[],f=>f[2]);
const active=t=>(t&&t.b||[]).filter(b=>!b.x);
const isOpen=t=>!!(t&&t.sh&&now()<t.sh.e);
const shiftDone=t=>!!(t&&t.sh&&now()>=t.sh.e&&!t.sh.r);
const stockLeft=t=>sum(active(t),bLeft);
/* orders from every other player against batch b of seller, not yet paid/rejected, oldest first (t, then id) */
function pendingFor(sellerId,b){const out=[];players().forEach(pl=>{if(pl.id===sellerId||!pl.truck||!pl.truck.o)return;
 pl.truck.o.forEach(o=>{if(o.s===sellerId&&o.b===b.id&&o.x!==1&&!(b.f||[]).some(f=>f[0]===o.i)&&!(b.j||[]).includes(o.i))out.push({o,pl});});});
 return out.sort((a,c)=>a.o.t-c.o.t||(a.o.i<c.o.i?-1:a.o.i>c.o.i?1:0));}
/* what a BUYER sees: stock minus orders the seller hasn't processed yet (in the same order the seller will) */
function viewLeft(sellerId,b){let left=bLeft(b);pendingFor(sellerId,b).forEach(({o})=>{if(o.n<=left)left-=o.n;});return Math.max(0,left);}
const boughtToday=t=>sum((t.o||[]).filter(o=>o.x!==1&&dk(o.t)===dk()),o=>o.n);

/* ---------- seller side: collect family orders + village customers (own object only) ---------- */
function settle(p){const t=T(p);if(!t.i)return [];const news=[];const T0=now();
 t.b.forEach(b=>{b.f=b.f||[];b.j=b.j||[];pendingFor(p.id,b).forEach(({o,pl})=>{
  if(o.n<=bLeft(b)){b.f.push([o.i,pl.id,o.n,o.p]);p.coins=(p.coins||0)+o.n*o.p;soldAt(t,b,o.t,o.n);news.push({k:'sold',who:pl.name,r:b.r,e:itemE(b),n:o.n,c:o.n*o.p});}
  else b.j.push(o.i);});
  if(!b.f.length)delete b.f;if(!b.j.length)delete b.j;});
 const sh=t.sh;if(sh){const end=Math.min(T0,sh.e),from=sh.l||sh.s;if(end>from){village(p,t,sh,from,end);sh.l=end;}}
 const ns=starCheck(t);if(ns)news.push({k:'star',s:stars(t)});
 prune(t);return news;}
/* village customers: every hour-slot has RMAX possible visitors, each with a fixed seeded time and a fixed
   seeded "mood" u; a visitor comes if u < rate/RMAX. Same answer however often (or late) the device settles. */
function village(p,t,sh,from,end){const arr=[];const S=stars(t);
 active(t).forEach(b=>{const st=Math.max(from,b.t);if(st>=end)return;const k0=Math.max(0,Math.floor((st-sh.s)/H)),k1=Math.floor((end-1-sh.s)/H);
  for(let k=k0;k<=k1;k++){const R=rng(b.id+':'+k);
   for(let i=0;i<RMAX;i++){const at=sh.s+k*H+Math.floor(R()*H),u=R(),who=CUST[Math.floor(R()*CUST.length)];if(at>st&&at<=end&&u<rateOf(b,at,S)/RMAX)arr.push({at,b,who});}}});
 arr.sort((a,c)=>a.at-c.at);
 arr.forEach(a=>{const b=a.b;if(bLeft(b)<=0)return;const day=dk(a.at);if(!t.vd||t.vd.k!==day)t.vd={k:day,c:0};
  if(t.vd.c+b.p>CAPS[S]){sh.tn=(sh.tn||0)+1;return;}
  b.vs=(b.vs||0)+1;b.vc=(b.vc||0)+b.p;t.vd.c+=b.p;p.coins=(p.coins||0)+b.p;sh.n=(sh.n||0)+1;sh.c=(sh.c||0)+b.p;soldAt(t,b,a.at,1);
  const ve=Array.from(b.ve||'');if(ve.length<6)b.ve=(b.ve||'')+a.who;});}
function prune(t){const T0=now();
 t.o=t.o.filter(o=>!(o.x&&T0-o.t>KEEP));
 const res=t.o.filter(o=>o.x);if(res.length>30){const drop=new Set(res.slice(0,res.length-30).map(o=>o.i));t.o=t.o.filter(o=>!drop.has(o.i));}
 const gone=b=>{(b.f||[]).forEach(f=>{t.pd=t.pd||[];t.pd.push(f[0]);});};
 const cl=t.b.filter(b=>b.x).sort((a,c)=>a.x-c.x);const keep=new Set(cl.filter(b=>T0-b.x<=KEEP).slice(-5).map(b=>b.id));
 t.b=t.b.filter(b=>{if(!b.x||keep.has(b.id))return true;gone(b);return false;});
 if(t.pd){t.pd=t.pd.filter(id=>T0-parseInt(id.slice(1,9),36)<3*KEEP).slice(-60);if(!t.pd.length)delete t.pd;}}
/* ---------- buyer side: confirm or refund my own orders (idempotent) ---------- */
function resolve(p){const t=T(p);const news=[];
 t.o.forEach(o=>{if(o.x)return;const s=byId(o.s),st=s&&s.truck;let res='wait';
  if(!st)res='no';else{const b=(st.b||[]).find(b=>b.id===o.b);
   if(!b)res=(st.pd||[]).includes(o.i)?'ok':'no';else if((b.f||[]).some(f=>f[0]===o.i))res='ok';else if((b.j||[]).includes(o.i))res='no';}
  if(res==='ok')o.x=2;
  else if(res==='no'){o.x=1;p.coins=(p.coins||0)+o.n*o.p;t.bag[o.r]=Math.max(0,(t.bag[o.r]||0)-o.n);news.push({k:'refund',who:s?s.name:'?',r:o.r,n:o.n,c:o.n*o.p});}});
 return news;}
function buy(p,sellerId,batchId,n){const t=T(p),s=byId(sellerId);if(!s||s.id===p.id)return 'nope';const st=R0(s);const b=st&&(st.b||[]).find(x=>x.id===batchId&&!x.x);
 if(!b)return 'gone';if(n<1)return 'nope';if(viewLeft(s.id,b)<n)return 'soldout';if(boughtToday(t)+n>BUY_DAY)return 'limit';if((p.coins||0)<n*b.p)return 'coins';
 t.o.push({i:uid('o'),s:s.id,b:b.id,r:b.r,n,p:b.p,t:now(),x:0});p.coins-=n*b.p;t.bag[b.r]=(t.bag[b.r]||0)+n;sv();return 'ok';}

/* ---------- Pet Picnic: every other weekend (Fri–Sun of even weeks) ---------- */
function picnic(){const d=dnum(),w=Math.floor((d+3)/7),dow=(d+3)%7; // 0=Mon
 const even=w%2===0;const act=PFORCE||(even&&dow>=4);const wk=even?w:w+1;
 const daysTo=even&&dow>=4?0:((wk-w)*7+4-dow);return {id:'pk'+wk,active:act,daysTo:Math.max(0,daysTo),end:(wk*7-3+6)};}
function picTotals(id){let s=0,d=0;const who=[];players().forEach(pl=>{const pc=pl.truck&&pl.truck.pc;if(pc&&pc.id===id&&(pc.s||pc.d)){s+=pc.s||0;d+=pc.d||0;who.push({n:pl.name,s:pc.s||0,d:pc.d||0});}});return {s,d,who};}
function myPc(t,id){if(!t.pc||t.pc.id!==id)t.pc={id,s:0,d:0};return t.pc;}
const picDone=tot=>tot.s>=PIC_GOAL.s&&tot.d>=PIC_GOAL.d;

/* ---------- art ---------- */
const INK='#2b2250';
function truckInner(t,o){o=o||{};const c=PAINT[t.c|0]||PAINT[0],a=AWN[t.a|0]||AWN[0];const items=(o.items||[]).slice(0,3);const nm=tname(t);
 const dc=t.dc||'',has=x=>dc.includes(x),S=stars(t);
 let sc='';for(let i=0;i<9;i++)sc+=`<circle cx="${20+i*13.5}" cy="58" r="7" fill="${i%2?'#fff':has('s')?'#f06595':a}" stroke="${INK}" stroke-width="2"/>`;
 let st='';if(has('s')){for(let i=0;i<8;i++){const x=25+i*12.4;st+=`<path d="M${x} 41h6l1.5 17h-7z" fill="${i%2?a:'#f06595'}"/>`;}}else for(let i=0;i<4;i++){const x=27+i*25;st+=`<path d="M${x} 41h12l2 17h-15z" fill="${a}"/>`;}
 const LC=['#ffd43b','#ff6b6b','#51cf66','#4dabf7','#f783ac'];
 const lights=has('l')?`<path d="M18 66 Q70 74 126 66" stroke="${INK}" stroke-width="1" fill="none"/>`+Array.from({length:9},(_,i)=>{const x=22+i*12.8,y=66+Math.sin(i/8*Math.PI)*4.5;return `<circle cx="${x}" cy="${y+2}" r="2.8" fill="${LC[i%5]}"><animate attributeName="opacity" values="1;.35;1" dur="1.2s" begin="${(i*.15).toFixed(2)}s" repeatCount="indefinite"/></circle>`;}).join(''):'';
 const flowers=has('f')?`<rect x="16" y="106" width="48" height="9" rx="3" fill="#8a5a2b" stroke="${INK}" stroke-width="1.5"/><text x="18" y="108" font-size="10">🌷🌼🌷</text>`:'';
 const menu=has('m')?`<g transform="translate(124 60)"><rect width="32" height="44" rx="3" fill="#2b2250" stroke="#8a5a2b" stroke-width="3"/><text x="16" y="12" font-size="8" font-weight="700" text-anchor="middle" fill="#fff" font-family="Fredoka,sans-serif">MENU</text>${items.slice(0,2).map((e,i)=>`<text x="16" y="${25+i*12}" font-size="10" text-anchor="middle">${e}</text>`).join('')}</g>`:'';
 const neon=has('n')?`<g><rect x="62" y="19" width="58" height="17" rx="8" fill="#2b2250" stroke="#ff6bd6" stroke-width="2.5"><animate attributeName="stroke-opacity" values="1;.4;1" dur="1.6s" repeatCount="indefinite"/></rect><text x="91" y="31.5" font-size="10.5" font-weight="700" text-anchor="middle" fill="#ffd8f5" font-family="Fredoka,sans-serif">★ YUM ★</text></g>`:'';
 const donut=has('g')?`<text x="${has('n')?140:100}" y="40" font-size="30" text-anchor="middle">🍩</text>`:'';
 const bed=has('b')?`<ellipse cx="186" cy="63" rx="21" ry="6" fill="#f783ac" stroke="${INK}" stroke-width="2"/>`:'';
 const rim=has('w')?'#ffd43b':'#adb5bd';const spark=has('w')?`<text x="58" y="124" font-size="11">✨<animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></text><text x="188" y="124" font-size="11">✨<animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite"/></text>`:'';
 const starB=S?`<g><rect x="12" y="20" width="${S*15+8}" height="17" rx="8" fill="#fff8db" stroke="${INK}" stroke-width="2"/><text x="16" y="33" font-size="12">${'⭐'.repeat(S)}</text></g>`:'';
 return `<ellipse cx="112" cy="151" rx="100" ry="7" fill="#0003"/>
 <rect x="10" y="38" width="150" height="92" rx="14" fill="${c}" stroke="${INK}" stroke-width="4"/>
 <path d="M160 66H192Q208 66 212 86L214 130H160Z" fill="${c}" stroke="${INK}" stroke-width="4"/>
 <path d="M168 74H190Q200 74 203 90H168Z" fill="#d0ebff" stroke="${INK}" stroke-width="3"/>
 <circle cx="208" cy="112" r="4" fill="#ffe066" stroke="${INK}" stroke-width="2"/>
 <rect x="24" y="60" width="96" height="42" rx="6" fill="${o.open?'#fff4d6':'#ded8ef'}" stroke="${INK}" stroke-width="3"/>
 ${items.map((e,i)=>`<text x="${44+i*28}" y="93" font-size="22" text-anchor="middle">${e}</text>`).join('')}
 <rect x="20" y="98" width="104" height="8" rx="3" fill="#8a5a2b" stroke="${INK}" stroke-width="1.5"/>
 <path d="M14 58H130L122 40H22Z" fill="#fff" stroke="${INK}" stroke-width="3"/>${st}${sc}${lights}${menu}${flowers}${neon}${donut}${starB}
 ${o.nolabel?'':`<rect x="68" y="109" width="89" height="17" rx="6" fill="#fff" stroke="${INK}" stroke-width="2"/><text x="112.5" y="121.5" font-size="11" font-weight="700" text-anchor="middle" fill="${INK}" font-family="Fredoka,sans-serif" ${nm.length>11?'textLength="80" lengthAdjust="spacingAndGlyphs"':''}>${E(nm)}</text>`}
 <g transform="translate(129 42)"><rect width="28" height="13" rx="4" fill="${o.open?'#2f9e44':'#868e96'}" stroke="${INK}" stroke-width="1.5"/><text x="14" y="10" font-size="8" font-weight="700" text-anchor="middle" fill="#fff" font-family="Fredoka,sans-serif">${o.open?'OPEN':'CLOSED'}</text></g>
 <circle cx="50" cy="132" r="15" fill="#343a40" stroke="${INK}" stroke-width="3"/><circle cx="50" cy="132" r="6" fill="${rim}"/>
 <circle cx="180" cy="132" r="15" fill="#343a40" stroke="${INK}" stroke-width="3"/><circle cx="180" cy="132" r="6" fill="${rim}"/>${spark}
 ${bed}<text x="186" y="${has('b')?62:66}" font-size="24" text-anchor="middle">${mascotE(t)}</text>`;}
const truckSVG=(t,o)=>`<svg class="tk-trk" viewBox="0 0 220 160" role="img" aria-label="${E(tname(t))} food truck">${truckInner(t,o)}</svg>`;
const itemsOf=(t,left)=>active(t).filter(b=>(left?left(b):bLeft(b))>0).map(b=>{const s=b.sp&&spParse(b.sp);return s?s.Tp.e:REC[b.r].e;});
function kidSVG(x,y,s,col){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M8 58 L12 26 H28 L32 58Z" fill="${col}" stroke="${INK}" stroke-width="2"/><circle cx="20" cy="16" r="10" fill="#ffd8a8" stroke="${INK}" stroke-width="2"/><path d="M8 11 L20 -8 L32 11Z" fill="${col}" stroke="${INK}" stroke-width="2"/><circle cx="16" cy="16" r="1.8" fill="${INK}"/><circle cx="24" cy="16" r="1.8" fill="${INK}"/><path d="M16 21q4 3 8 0" stroke="${INK}" stroke-width="1.6" fill="none"/></g>`;}
const walker=(e,y,dur,delay,x0,x1,size)=>`<g><animateTransform attributeName="transform" type="translate" values="${x0} 0;${x1} 0;${x0} 0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/><text x="0" y="${y}" font-size="${size||30}">${e}</text></g>`;
function bgSky(id,night){return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night?'#3b2f8f':'#8fd3ff'}"/><stop offset="1" stop-color="${night?'#8b7fd6':'#e7f8ff'}"/></linearGradient></defs>`;}
const isNight=()=>{const h=new Date(now()).getHours();return h>=20||h<6;};
function houses(y,sc){let s='';const cols=['#ffe8cc','#e3fafc','#fff0f6','#f3f0ff','#ebfbee','#fff9db'];for(let i=0;i<7;i++){const x=i*150+10;s+=`<g transform="translate(${x} ${y}) scale(${sc})"><rect x="0" y="20" width="90" height="60" fill="${cols[i%6]}" stroke="${INK}" stroke-width="3"/><path d="M-8 22 L45 -12 L98 22Z" fill="${['#e8590c','#c2255c','#5f3dc4','#1971c2'][i%4]}" stroke="${INK}" stroke-width="3"/><rect x="14" y="36" width="18" height="16" fill="#a5d8ff" stroke="${INK}" stroke-width="2"/><rect x="54" y="46" width="20" height="34" fill="#8a5a2b" stroke="${INK}" stroke-width="2"/></g>`;}return s;}
function squareSVG(meId){UID++;const sid='tkS'+UID,night=isNight();const ps=players().slice(0,6);
 const SLOT=[[8,198,238],[754,198,238],[200,140,192],[608,140,192],[88,104,152],[760,104,152]];const ORDER=[4,5,2,3,0,1];
 const pic=picnic();const tot=picTotals(pic.id);
 let trucks='',labels='';
 ORDER.forEach(si=>{const pl=ps[si];if(!pl)return;const [x,y,w]=SLOT[si];const h=w*160/220;const t=R0(pl);const mine=pl.id===meId;
  if(!t){trucks+=`<g opacity=".55"><rect x="${x+14}" y="${y+h*.35}" width="${w*.72}" height="${h*.52}" rx="14" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="12 9"/><text x="${x+w*.5}" y="${y+h*.7}" font-size="${w*.2}" text-anchor="middle">🅿️</text></g>`;
   labels+=`<text class="tk-lbl" x="${x+w*.5}" y="${y+h*.3}" fill="#fff">${E(pl.name)}</text>`;return;}
  const open=isOpen(t);const items=itemsOf(t,b=>viewLeft(pl.id,b));
  trucks+=`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 220 160" class="tk-sq-t" onclick="Truck._visit('${pl.id}')">${truckInner(t,{open,items,nolabel:true})}</svg>`;
  labels+=`<text class="tk-lbl" x="${x+w*.42}" y="${y+4}" fill="${mine?'#ffd43b':'#fff'}">${E(pl.name)}${mine?' ⭐':''}</text>`;});
 const board=pic.active?`🧺 Pet Picnic ${Math.min(tot.s,PIC_GOAL.s)+Math.min(tot.d,PIC_GOAL.d)} / ${PIC_GOAL.s+PIC_GOAL.d}`:'🏙️ Market Square';
 const walkers=[walker('🐶',408,30,0,60,860),walker('🐱',425,38,-9,880,120),walker('🐰',398,26,-4,300,700),walker('🐢',432,60,-20,200,760,26)].join('')+
  ps.filter(pl=>R0(pl)&&isOpen(pl.truck)).slice(0,3).map((pl,i)=>walker(CUST[(i*3+2)%CUST.length],385+i*14,18+i*5,-i*3,380+i*40,620-i*30,28)).join('');
 return `<svg class="tk-sq" viewBox="0 0 1000 450" role="img" aria-label="Market Square with the family food trucks">${bgSky(sid,night)}
 <rect width="1000" height="450" fill="url(#${sid})"/>${night?'<circle cx="880" cy="60" r="26" fill="#fff3bf"/><g fill="#fff"><circle cx="120" cy="40" r="2"/><circle cx="300" cy="70" r="2"/><circle cx="640" cy="30" r="2"/><circle cx="760" cy="90" r="2"/></g>':'<circle cx="880" cy="62" r="30" fill="#ffe066"/><g fill="#fff" opacity=".9"><ellipse cx="160" cy="58" rx="60" ry="18"/><ellipse cx="200" cy="48" rx="40" ry="20"/><ellipse cx="640" cy="70" rx="70" ry="18"/><ellipse cx="690" cy="58" rx="40" ry="18"/></g>'}
 <g opacity=".95">${houses(95,.9)}</g>
 <path d="M0 190 Q250 165 500 182 T1000 178 V450 H0Z" fill="#b2f2bb"/>
 <ellipse cx="500" cy="372" rx="480" ry="86" fill="#e9d8a6"/><ellipse cx="500" cy="372" rx="400" ry="62" fill="#f1e3b8"/>
 <ellipse cx="500" cy="360" rx="78" ry="24" fill="#74c0fc" stroke="${INK}" stroke-width="4"/>
 <rect x="488" y="306" width="24" height="52" rx="6" fill="#dee2e6" stroke="${INK}" stroke-width="3"/>
 <ellipse cx="500" cy="304" rx="32" ry="10" fill="#a5d8ff" stroke="${INK}" stroke-width="3"/>
 <path d="M500 296 q-18 -26 -34 4 M500 296 q18 -26 34 4" stroke="#74c0fc" stroke-width="4" fill="none"><animate attributeName="opacity" values="1;.4;1" dur="1.6s" repeatCount="indefinite"/></path>
 <g font-family="Fredoka,sans-serif" font-weight="700"><rect x="${500-(board.length*9+40)/2}" y="232" width="${board.length*9+40}" height="38" rx="16" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="500" y="258" text-anchor="middle" font-size="19" fill="${INK}">${board}</text></g>
 ${trucks}${labels}${walkers}</svg>`;}
function streetSVG(p){UID++;const sid='tkH'+UID,night=isNight();const t=T(p);const open=isOpen(t);
 const q=open?[walker(CUST[1],236,7,0,40,110,34),walker(CUST[4],244,9,-2,0,70,34),walker(CUST[0],240,11,-5,470,540,32)].join(''):'';
 return `<svg class="tk-street" viewBox="0 0 600 270" role="img" aria-label="Your food truck on the street">${bgSky(sid,night)}<rect width="600" height="270" fill="url(#${sid})"/>
 ${night?'<circle cx="530" cy="50" r="20" fill="#fff3bf"/>':'<circle cx="530" cy="48" r="24" fill="#ffe066"/><g fill="#fff"><ellipse cx="110" cy="46" rx="46" ry="14"/><ellipse cx="140" cy="38" rx="30" ry="15"/></g>'}
 <g opacity=".9">${houses(58,.72)}</g><rect y="190" width="600" height="80" fill="#e9d8a6"/><rect y="190" width="600" height="8" fill="#d4c08a"/>
 <svg x="140" y="44" width="320" height="233" viewBox="0 0 220 160">${truckInner(t,{open,items:itemsOf(t)})}</svg>${q}</svg>`;}
function rosaSVG(){return `<svg class="tk-rosa" viewBox="0 0 600 250" role="img" aria-label="Ms. Rosa at the cafeteria door with a gift box"><rect width="600" height="250" fill="#fff4e6"/>
 <rect x="24" y="40" width="230" height="190" rx="14" fill="#ffe8cc" stroke="${INK}" stroke-width="4"/><text x="139" y="82" font-family="Fredoka,sans-serif" font-weight="700" font-size="24" text-anchor="middle" fill="${INK}">CAFETERIA</text>
 <rect x="100" y="112" width="78" height="118" rx="6" fill="#e8590c" stroke="${INK}" stroke-width="4"/><circle cx="165" cy="172" r="5" fill="#ffd43b"/>
 <rect y="228" width="600" height="22" fill="#e9d8a6"/>
 <g><animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="2.4s" repeatCount="indefinite"/><text x="330" y="208" font-size="120" text-anchor="middle">👩‍🍳</text></g>
 <g><animateTransform attributeName="transform" type="rotate" values="-4 490 190;4 490 190;-4 490 190" dur="1.4s" repeatCount="indefinite"/><text x="490" y="222" font-size="96" text-anchor="middle">🎁</text></g>
 <g font-size="30"><text x="400" y="80">✨</text><text x="540" y="110">✨</text></g></svg>`;}
function partySVG(){UID++;const ps=players().filter(pl=>R0(pl)||pl.pet).slice(0,7);const n=Math.max(1,ps.length);const sp=520/n;
 let crowd='';ps.forEach((pl,i)=>{const t=R0(pl);const col=t?PAINT[t.c|0]:'#9775fa';const x=50+sp*i+sp/2-22;
  crowd+=`<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -10;0 0" dur="${.9+i*.13}s" repeatCount="indefinite"/>${kidSVG(x,150,1.1,col)}</g><text x="${x+44}" y="222" font-size="30">${(pl.pet&&petE(pl.pet))||'🐾'}</text><text x="${x+22}" y="244" font-size="14" font-family="Fredoka,sans-serif" font-weight="700" text-anchor="middle" fill="${INK}">${E(pl.name)}</text>`;});
 let bunt='';for(let i=0;i<14;i++)bunt+=`<path d="M${i*44} 20 l22 26 l22 -26z" fill="${AWN[i%6]}"/>`;
 let conf='';for(let i=0;i<26;i++){const R=rng('c'+i);conf+=`<rect x="${Math.floor(R()*600)}" y="-10" width="8" height="12" rx="2" fill="${AWN[i%6]}"><animate attributeName="y" values="-10;260" dur="${2+R()*2}s" begin="${-R()*3}s" repeatCount="indefinite"/></rect>`;}
 return `<svg class="tk-party" viewBox="0 0 600 260" role="img" aria-label="The family Pet Picnic party with every hero and pet"><rect width="600" height="260" fill="#d3f9d8"/><rect width="600" height="120" fill="#a5e3ff"/><path d="M0 18 H600" stroke="${INK}" stroke-width="2"/>${bunt}
 <path d="M60 250 L130 150 H470 L540 250Z" fill="#ff8787" stroke="${INK}" stroke-width="3"/><path d="M95 200 H505 M130 150 L60 250 M200 150 L170 250 M270 150 L260 250 M330 150 L340 250 M400 150 L430 250 M470 150 L540 250" stroke="#fff" stroke-width="6" opacity=".6"/>
 <text x="300" y="148" font-size="44" text-anchor="middle">🧺</text><g font-size="26"><text x="210" y="196">🦴</text><text x="360" y="196">🧁</text><text x="290" y="238">🍧</text></g>${crowd}${conf}</svg>`;}

/* ---------- CSS ---------- */
const CSS=`
.tk{max-width:1060px;margin:0 auto;padding:12px 14px 40px}
.tk .zhead .title{margin:6px 0 10px}
.tk-card{background:#fff;border-radius:22px;padding:14px 16px;margin-bottom:14px;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.18)}
.tk-card h3{margin:0 0 8px;font-size:20px}
.tk-scene{border-radius:22px;overflow:hidden;box-shadow:0 6px 0 rgba(0,0,0,.25);margin-bottom:14px;background:#8fd3ff}
.tk-scene>svg{display:block;width:100%;height:auto}
.tk-lbl{font-family:Fredoka,sans-serif;font-weight:700;font-size:20px;text-anchor:middle;stroke:#2b2250;stroke-width:5px;paint-order:stroke;stroke-linejoin:round}
.tk-sq-t{cursor:pointer}
.tk-2{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px;align-items:start}
.tk-say{display:flex;gap:10px;align-items:flex-start}
.tk-av{font-size:44px;line-height:1;flex:none}
.tk-bub{background:#fff;border:3px solid #e7e0ff;border-radius:18px;padding:10px 14px;font-size:19px;font-weight:600;color:var(--ink);position:relative;flex:1;min-width:0}
.tk-bub small{display:block;font-weight:500;color:var(--muted);font-size:15px;margin-top:2px}
.tk-next{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;font-size:23px;padding:16px 18px;border-radius:18px;animation:tkPulse 1.8s ease-in-out infinite}
@keyframes tkPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
.tk-next:active{animation:none}
.tk-acts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}
.tk-combo{white-space:nowrap;letter-spacing:-.12em;display:inline-block}
.tk-combo.big{font-size:60px;line-height:1.1;text-align:center;display:block}
.tk-combo.sm{font-size:20px}
.tk-rec .e .tk-combo{font-size:32px}
.tk-crv{display:inline-block;margin-left:6px;background:#fff3bf;color:#8a5a00;border-radius:8px;padding:0 6px;font-size:12px;font-weight:700;vertical-align:middle}
.tk-crv.rare{background:#f3d9fa;color:#862e9c}
.tk-crave{background:linear-gradient(135deg,#fff3bf,#ffe8cc);color:#5c3b00;border-radius:18px;padding:10px 14px;font-size:17px;font-weight:600;margin:0 0 12px;box-shadow:0 4px 0 rgba(0,0,0,.18)}
.tk-crave small{display:block;font-size:14px;font-weight:600;color:#8a5a00;opacity:.85}
.tk-stars{font-size:22px;letter-spacing:1px;white-space:nowrap}
.tk-stars.sm{display:block;font-size:14px}
.tk-starc{background:linear-gradient(135deg,#fff,#fff9db);margin-bottom:0}
.tk-starm .tk-bigstars{font-size:52px;letter-spacing:4px;animation:pop .5s}
.tk-perk{background:#fff3bf;border-radius:14px;padding:8px 12px;font-weight:700;color:#8a5a00}
.tk-chip.rare{background:#f3d9fa}
.tk-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.tk-opt{background:#f3f0ff;border-radius:16px;padding:8px 6px;font-weight:700;font-size:15px;color:var(--ink);border:3px solid transparent;line-height:1.15}
.tk-opt i{display:block;font-style:normal;font-size:30px}
.tk-opt small{display:block;font-size:12px;color:var(--muted);font-weight:600}
.tk-opt.on{border-color:var(--accent);background:#e5dbff}
.tk-spgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px}
.tk-spc{text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
.tk-spc .nm{font-size:20px}
.tk-spc.lock{opacity:.8;background:#f1f3f5}
.tk-sppre{text-align:center}
.tk-deco{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tk-act{background:#fff;border-radius:18px;padding:10px 6px;text-align:center;color:var(--ink);box-shadow:0 4px 0 rgba(0,0,0,.2);font-weight:700;font-size:15px;line-height:1.15;position:relative;min-height:84px}
.tk-act i{display:block;font-style:normal;font-size:34px;line-height:1.1;margin-bottom:2px}
.tk-act .dot{position:absolute;top:6px;right:8px;background:#ff5a5f;color:#fff;border-radius:999px;font-size:12px;padding:1px 7px}
.tk-act:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.2)}
.tk-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 12px;font-weight:700;font-size:15px;background:#f3f0ff;color:var(--ink)}
.tk-pill.open{background:#d3f9d8;color:#2b8a3e}.tk-pill.closed{background:#f1f3f5;color:#495057}.tk-pill.gold{background:#fff3bf;color:#8a5a00}
.tk-stock{display:flex;flex-direction:column;gap:8px}
.tk-srow{display:flex;align-items:center;gap:10px;background:#f8f6ff;border-radius:14px;padding:8px 10px}
.tk-srow .e{font-size:34px;line-height:1}
.tk-srow b{display:block;font-size:17px}.tk-srow small{color:var(--muted);font-size:14px}
.tk-srow .grow{flex:1;min-width:0}
.tk-inv{display:flex;flex-wrap:wrap;gap:6px}
.tk-chip{background:#f3f0ff;border-radius:12px;padding:4px 10px;font-weight:700;font-size:16px}
.tk-chip.zero{opacity:.45}
.tk-muted{color:var(--muted);font-size:15px}
.tk-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.tk-row.c{justify-content:center}
.tk-swatches{display:flex;flex-wrap:wrap;gap:8px}
.tk-sw{width:46px;height:46px;border-radius:14px;border:4px solid #fff;box-shadow:0 0 0 2px #d9d2f5}
.tk-sw.on{box-shadow:0 0 0 4px var(--accent);transform:scale(1.08)}
.tk-words{display:flex;flex-wrap:wrap;gap:6px}
.tk-word{background:#f3f0ff;border-radius:12px;padding:8px 12px;font-size:17px;font-weight:700;color:var(--ink)}
.tk-word.on{background:var(--accent);color:#fff}
.tk-trkwrap{max-width:420px;margin:0 auto}
.tk-trk{display:block;width:100%;height:auto}
.tk-name{text-align:center;font-size:26px;font-weight:700;margin:4px 0 2px;color:var(--ink)}
.tk-shop{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.tk-ing{background:#fff;border-radius:18px;padding:10px;text-align:center;color:var(--ink);box-shadow:0 4px 0 rgba(0,0,0,.18);display:flex;flex-direction:column;gap:6px}
.tk-ing .e{font-size:38px;line-height:1}
.tk-ing b{font-size:17px}
.tk-ing small{color:var(--muted);font-size:13px}
.tk-buy{border-radius:12px;padding:8px 6px;font-weight:700;font-size:15px;background:#f3f0ff;color:var(--ink);box-shadow:0 3px 0 #d0c7f5;line-height:1.15}
.tk-buy.bulk{background:#fff3bf;box-shadow:0 3px 0 #f1d27a}
.tk-buy em{display:block;font-style:normal;font-size:12px;color:var(--muted);font-weight:600}
.tk-buy:disabled{opacity:.45}
.tk-cart{position:sticky;bottom:8px;z-index:4;background:#241a3d;color:#fff;border-radius:20px;padding:10px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.tk-cart .lines{flex:1;min-width:0;font-weight:600;font-size:16px}
.tk-cart .lines span{display:inline-block;background:rgba(255,255,255,.14);border-radius:10px;padding:2px 8px;margin:2px}
.tk-fill{display:flex;gap:8px;flex-wrap:wrap}
.tk-recs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.tk-rec{background:#fff;border-radius:20px;padding:12px;text-align:center;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.2);border:4px solid transparent;display:flex;flex-direction:column;gap:6px;align-items:center}
.tk-rec.on{border-color:var(--accent);background:#f6f3ff}
.tk-rec.no{opacity:.6}
.tk-rec .e{font-size:48px;line-height:1}
.tk-rec b{font-size:19px}
.tk-need{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.tk-need span{background:#f3f0ff;border-radius:10px;padding:2px 8px;font-weight:700;font-size:15px}
.tk-need span.miss{background:#ffe3e3;color:#c92a2a}
.tk-nb{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.tk-nb button{min-width:96px;font-size:20px;font-weight:700;padding:12px 14px;border-radius:16px;background:#fff;color:var(--ink);box-shadow:0 4px 0 #cfc6f2;border:4px solid transparent}
.tk-nb button.on{border-color:var(--accent);background:#f1edff}
.tk-nb button:disabled{opacity:.4}
.tk-nb small{display:block;font-size:13px;color:var(--muted)}
.tk-math{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px;align-items:start}
.tk-q{font-size:21px;font-weight:600;line-height:1.35}
.tk-pics{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin:10px 0;font-size:28px}
.tk-grp{background:#f3f0ff;border-radius:14px;padding:4px 8px;letter-spacing:2px}
.tk-plus{font-weight:700;color:var(--muted);font-size:24px}
.tk-eq{font-size:32px;font-weight:700;text-align:center;margin:8px 0 4px;color:var(--ink)}
.tk-eq .ansbox{min-width:1.8em;text-align:center}
.tk-fb{min-height:30px;text-align:center;font-weight:700;font-size:20px}
.tk-fb.ok{color:#2b8a3e}.tk-fb.no{color:#c92a2a}
.tk-hint{background:#e6fcf5;border-radius:16px;padding:10px 12px;font-size:18px;margin:8px 0;color:#0b7285;line-height:1.45}
.tk-hint b{color:#087f5b}
.tk-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:380px;margin:0 auto}
.tk-pad button{font-size:30px;font-weight:700;padding:10px 0;border-radius:14px;background:#fff;color:var(--ink);box-shadow:0 4px 0 #b9b0d9;border:2px solid #eee9ff}
.tk-pad button:active{transform:translateY(3px);box-shadow:0 1px 0 #b9b0d9}
.tk-pad .go{background:var(--good);color:#fff;box-shadow:0 4px 0 #1e9a53;border-color:transparent}
.tk-pad .del{background:#ffe1e2}
.tk-pad .fr{background:#fff4e6;color:#d9480f}
.tk-choice{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tk-choice button{background:#fff;border-radius:18px;padding:14px 8px;font-size:20px;font-weight:700;color:var(--ink);box-shadow:0 4px 0 #cfc6f2;border:3px solid #eee9ff}
.tk-choice button small{display:block;font-size:14px;color:var(--muted);font-weight:600}
.tk-prices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.tk-price{background:#fff;border-radius:20px;padding:14px 8px;text-align:center;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.2);border:4px solid transparent}
.tk-price.on{border-color:var(--accent);background:#f6f3ff}
.tk-price .big{font-size:36px;font-weight:700;display:block;line-height:1.1}
.tk-price .face{font-size:26px;display:block;margin:4px 0}
.tk-price small{display:block;color:var(--muted);font-size:14px}
.tk-price .pf{display:inline-block;margin-top:6px;border-radius:10px;padding:2px 10px;font-weight:700;font-size:15px;background:#f1f3f5}
.tk-price .pf.pos{background:#d3f9d8;color:#2b8a3e}
.tk-shift{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.tk-shift button{background:#fff;border-radius:20px;padding:14px 8px;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.2);font-size:20px;font-weight:700}
.tk-shift button i{display:block;font-style:normal;font-size:42px}
.tk-shift button small{display:block;font-size:14px;color:var(--muted);font-weight:600}
.tk-receipt{background:#fffdf5;border:3px dashed #e0cf8f;border-radius:16px;padding:12px 14px;font-variant-numeric:tabular-nums;color:var(--ink)}
.tk-receipt h4{margin:6px 0 4px;font-size:18px}
.tk-line{display:flex;justify-content:space-between;gap:10px;font-size:17px;padding:2px 0}
.tk-line span:first-child{min-width:0}
.tk-line.sub{border-top:2px solid #e0cf8f;margin-top:4px;padding-top:6px;font-weight:700}
.tk-money{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}
.tk-money div{border-radius:16px;padding:10px;text-align:center}
.tk-money b{display:block;font-size:30px}
.tk-money small{display:block;font-size:14px;font-weight:600}
.tk-money .in{background:#e7f5ff;color:#1864ab}
.tk-money .pr{background:#d3f9d8;color:#2b8a3e}
.tk-money .pr.neg{background:#fff4e6;color:#d9480f}
.tk-bar{height:22px;border-radius:999px;background:#efeaff;overflow:hidden;position:relative}
.tk-bar i{display:block;height:100%;background:linear-gradient(90deg,#20c997,#51cf66);border-radius:999px;transition:width .6s}
.tk-bar.d i{background:linear-gradient(90deg,#4dabf7,#74c0fc)}
.tk-bar span{position:absolute;inset:0;display:grid;place-items:center;font-weight:700;font-size:14px;color:var(--ink)}
.tk-mk{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.tk-mcard{background:#fff;border-radius:20px;padding:12px;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.2);border-top:10px solid var(--tc,#b197fc)}
.tk-mcard.mine{outline:4px solid #ffd43b}
.tk-mhead{display:flex;align-items:center;gap:8px}
.tk-mhead svg{width:92px;flex:none}
.tk-mhead b{display:block;font-size:18px;line-height:1.1}
.tk-mhead small{color:var(--muted);font-size:14px}
.tk-menu{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.tk-mi{display:flex;align-items:center;gap:8px;background:#f8f6ff;border-radius:14px;padding:6px 8px}
.tk-mi .e{font-size:30px}
.tk-mi .grow{flex:1;min-width:0;font-weight:700;font-size:16px;line-height:1.1}
.tk-mi .grow small{display:block;font-weight:600;color:var(--muted);font-size:13px}
.tk-bagg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.tk-petstage{text-align:center;font-size:96px;line-height:1.1;position:relative}
.tk-petstage.happy{animation:tkHop .5s ease-in-out 3}
@keyframes tkHop{50%{transform:translateY(-22px) rotate(-6deg)}}
.tk-hearts{position:absolute;left:0;right:0;top:0;font-size:30px;pointer-events:none;animation:tkUp 1.6s ease-out forwards}
@keyframes tkUp{from{opacity:1;transform:translateY(20px)}to{opacity:0;transform:translateY(-60px)}}
.tk-book{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.tk-badges{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:6px}
.tk-badges span{border-radius:10px;padding:2px 8px;font-size:13px;font-weight:700}
.tk-badges .a{background:#fff3bf;color:#8a5a00}.tk-badges .h{background:#e7f5ff;color:#1864ab}.tk-badges .n{background:#f1f3f5;color:#868e96}
.tk-post{background:#fffdf5;border:3px solid #e0cf8f;border-radius:14px;padding:8px;display:inline-block;width:180px;text-align:center;font-size:14px;font-weight:700;color:var(--ink)}
.tk-post svg{width:100%;height:auto;border-radius:8px;display:block;margin-bottom:4px}
.tk-cook{text-align:center;padding:10px}
.tk-bowl{font-size:96px;display:inline-block;animation:tkStir .5s ease-in-out infinite}
@keyframes tkStir{50%{transform:rotate(12deg)}}
.tk-news li{margin:4px 0;font-size:17px}
.tk-news{text-align:left;padding-left:22px}
.hcard.tk-hc .pe{font-size:40px}
.tk-lock{text-align:center}
.tk-lock .big-emoji{font-size:80px}
.tk-2 .tk-math,.tk-math.one{grid-template-columns:minmax(0,1fr)}
@media(max-width:820px){.tk-2,.tk-math{grid-template-columns:minmax(0,1fr)}}
@media(max-width:560px){.tk-spgrid{grid-template-columns:minmax(0,1fr)}.tk-opts{grid-template-columns:repeat(3,minmax(0,1fr))}.tk-combo.big{font-size:52px}.tk-lbl{font-size:38px;stroke-width:8px}.tk{padding:8px 10px 30px}.tk-shop{grid-template-columns:repeat(2,minmax(0,1fr))}.tk-recs,.tk-prices,.tk-shift,.tk-book,.tk-bagg{grid-template-columns:minmax(0,1fr)}
 .tk-rec{flex-direction:row;text-align:left;align-items:center}.tk-rec .e{font-size:40px}.tk-rec .tk-need{justify-content:flex-start}
 .tk-price{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;text-align:left;padding:10px 12px}.tk-price .face{margin:0}
 .tk-shift button{display:flex;align-items:center;gap:10px;text-align:left;padding:10px 14px}.tk-shift button i{font-size:34px}
 .tk-bub{font-size:17px}.tk-av{font-size:38px}.tk-next{font-size:20px;padding:14px}.tk-q{font-size:19px}.tk-pad button{font-size:26px;padding:8px 0}
 .tk-act{min-height:72px;font-size:12.5px;padding:8px 2px}.tk-act i{font-size:28px}.tk-crave{font-size:15.5px}.tk-money b{font-size:26px}}
`;
function css(){if(!document.getElementById('tkCSS')){const s=document.createElement('style');s.id='tkCSS';s.textContent=CSS;document.head.appendChild(s);}}

/* ---------- UI state ---------- */
let VIEW='hub',RET='world',MRET=null,SETUP=null,CART={},COOK=null,MQ=null,PRICE=null,FEED=null,VISIT=null,NOTE=null;
const VIEWS=['hub','intro','setup','shop','pay','cook','price','open','receipt','bag','book','picnic','party','lock','special','deco'];
let SPB=null;
let LASTV='';
const BACK_NAME={world:'World',map:'Map',village:'Village',quests:'Quest Board',pethome:'Pet Home',me:'Me',shop:'Shop',zone:'Zone',camp:'Camp',leaders:'Leaders',library:'Library',cafe:'Kitchen',market:'Market',truck:'My truck',fade:'Paint'};
const backName=s=>BACK_NAME[s]||'World'; /* the ← button names where it goes */
function page(title,inner,back){const tb=(typeof topbar==='function')?topbar():'';if(LASTV!==VIEW){LASTV=VIEW;try{window.scrollTo(0,0);}catch(e){}}
 app.innerHTML=tb+`<div class="page tk"><div class="zhead"><button class="btn ghost small backbtn" onclick="Truck._back(${back?`'${back}'`:''})">← ${VIEW==='special'&&SPB?'Specials':back==='hub'?'My truck':backName(RET&&typeof SCREENS!=='undefined'&&SCREENS[RET]&&RET!=='truck'?RET:'world')}</button><h2 class="title">${title}</h2></div>${inner}</div>`;}
const rosa=(txt,sm,av)=>`<div class="tk-say"><span class="tk-av">${av||'👩‍🍳'}</span><div class="tk-bub">${txt}${sm?`<small>${sm}</small>`:''}</div></div>`;
const left2=ms=>{const t=Math.max(0,Math.ceil(ms/6e4)),h=Math.floor(t/60),m=t%60;return h?(m?`${h}h ${m}m`:`${h}h`):`${m}m`;};

function draw(){const p=me();if(!p){try{go('profiles');}catch(e){}return;}css();
 if(!enabled(p)&&VIEW!=='lock'){VIEW='lock';}
 if(VIEW==='lock')return drawLock(p);
 const t=T(p);
 if(!t.i&&VIEW!=='intro')VIEW='intro';
 else if(t.i&&!t.n&&VIEW!=='setup'){VIEW='setup';}
 ({hub:drawHub,intro:drawIntro,setup:drawSetup,shop:drawShop,pay:drawPayMath,cook:drawCook,price:drawPrice,open:drawOpen,receipt:drawReceipt,bag:drawBag,book:drawBook,picnic:drawPicnic,party:drawParty,special:drawSpecial,deco:drawDeco}[VIEW]||drawHub)(p,t);}
function drawLock(p){VIEW='hub';const n=p.battles||0;
 page('🚚 Food Truck',`<div class="tk-card tk-lock"><div class="big-emoji">🔒</div><h3>${flag()?`Win ${UNLOCK-n} more battle${UNLOCK-n===1?'':'s'}!`:'Coming soon!'}</h3><p class="tk-muted">${flag()?`Ms. Rosa visits heroes who have won ${UNLOCK} battles. You have ${n}.`:'The food trucks are still being built.'}</p><div class="tk-row c"><button class="btn green big" onclick="Truck._back()">OK</button></div></div>`);}
/* news: family sales, refunds */
function runSync(p){const a=settle(p),b=resolve(p);const n=a.concat(b);if(n.length)sv();return n;}
function starModal(sN){const perk=sN===3?"Customers +45% · village limit 100 🪙 a day · a 2nd Chef's Special slot!":`Customers +${sN*15}% · village limit ${CAPS[sN]} 🪙 a day`;
 return `<div class="mcard tk-starm"><div class="tk-bigstars">${starStr(sN)}</div><h2>New Chef Star: ${STAR_NAME[sN-1]}!</h2><p>${STAR_RULE[sN-1]}</p><p class="tk-perk">🎁 ${perk}</p><p class="tk-muted">Everyone in the family can see your stars on your truck. Stars are yours to keep!</p><div class="row"><button class="btn gold big" onclick="closeModal()">⭐ Hooray!</button></div></div>`;}
function newsModal(n){if(!n.length)return;const sold=n.filter(x=>x.k==='sold'),ref=n.filter(x=>x.k==='refund'),star=n.filter(x=>x.k==='star').pop();
 if(star){setTimeout(()=>{try{modal(starModal(star.s));}catch(e){}},250);sfx('win');if(!sold.length&&!ref.length)return;n=n.filter(x=>x.k!=='star');setTimeout(()=>newsModal(n),50);return;}
 const li=[...sold.map(x=>`<li><b>${E(x.who)}</b> bought ${x.n} ${x.e||REC[x.r].e} → <b>+${C(x.c)}</b></li>`),...ref.map(x=>`<li>The last ${REC[x.r].e} at <b>${E(x.who)}</b>'s truck was already gone. <b>${C(x.c)}</b> came back to you.</li>`)].join('');
 const html=`<div class="mcard"><div class="big-emoji">${sold.length?'💰':'🔄'}</div><h2>${sold.length?'Family sales!':'Money back'}</h2><ul class="tk-news">${li}</ul><div class="row"><button class="btn green big" onclick="closeModal()">Yay!</button></div></div>`;
 setTimeout(()=>{try{if(document.querySelector('#modal.show .tk-starm'))return;modal(html);}catch(e){}},250);sfx('coin');}

/* ---------- intro (Ms. Rosa, once) ---------- */
function drawIntro(p,t){
 page('👩‍🍳 Ms. Rosa has an idea',`<div class="tk-scene">${rosaSVG()}</div>
 <div class="tk-card">${rosa(`Hi ${E(p.name)}! The village pets are hungry for treats. Want your own <b>food truck</b>?`,`Here's a starter box, on me!`)}
 <div class="tk-row c" style="margin:12px 0 6px"><span class="tk-chip">🌾 2 scoops</span><span class="tk-chip">🥕 2</span><span class="tk-chip">🥚 2</span><span class="tk-chip">= 4 🦴 Puppy Biscuits</span></div>
 <button class="btn green tk-next" onclick="Truck._intro()">🎁 Open the box!</button></div>`);}
function doIntro(){const p=me(),t=T(p);if(!t.i){t.i=1;Object.keys(STARTER).forEach(k=>t.inv[k]=(t.inv[k]||0)+STARTER[k]);}sv();sfx('coin');
 SETUP={n:[Math.floor(Math.random()*W1.length),Math.floor(Math.random()*W2.length)],c:Math.floor(Math.random()*PAINT.length),a:Math.floor(Math.random()*AWN.length),m:p.pet||''};VIEW='setup';draw();}

/* ---------- setup ---------- */
function drawSetup(p,t){if(!SETUP)SETUP={n:t.n?t.n.slice():[0,0],c:t.c|0,a:t.a|0,m:t.m||p.pet||''};const s=SETUP;
 const pets=(p.pets||[]).filter(id=>petE(id)).slice(0,12);
 page('🎨 Make it yours',`<div class="tk-2"><div><div class="tk-card"><div class="tk-trkwrap">${truckSVG({...s,dc:t.dc,st:t.st},{open:true,items:['🦴','🧁','🍧']})}</div><div class="tk-name">${E(tname(s))}</div></div></div>
 <div><div class="tk-card"><h3>1. Pick a name</h3><div class="tk-words">${W1.map((w,i)=>`<button class="tk-word ${s.n[0]===i?'on':''}" onclick="Truck._set('n0',${i})">${w}</button>`).join('')}</div>
 <div class="tk-words" style="margin-top:8px">${W2.map((w,i)=>`<button class="tk-word ${s.n[1]===i?'on':''}" onclick="Truck._set('n1',${i})">${w}</button>`).join('')}</div></div>
 <div class="tk-card"><h3>2. Paint</h3><div class="tk-swatches">${PAINT.map((c,i)=>`<button class="tk-sw ${s.c===i?'on':''}" style="background:${c}" aria-label="paint ${i+1}" onclick="Truck._set('c',${i})"></button>`).join('')}</div>
 <h3 style="margin-top:12px">3. Awning</h3><div class="tk-swatches">${AWN.map((c,i)=>`<button class="tk-sw ${s.a===i?'on':''}" style="background:repeating-linear-gradient(90deg,${c} 0 10px,#fff 10px 20px)" aria-label="awning ${i+1}" onclick="Truck._set('a',${i})"></button>`).join('')}</div>
 <h3 style="margin-top:12px">4. Mascot</h3><div class="tk-words">${pets.map(id=>`<button class="tk-word ${s.m===id?'on':''}" style="font-size:26px" onclick="Truck._set('m','${id}')">${petE(id)}</button>`).join('')}<button class="tk-word ${!s.m?'on':''}" style="font-size:26px" onclick="Truck._set('m','')">🐾</button></div></div>
 <button class="btn green tk-next" onclick="Truck._setupDone()">✅ This is my truck!</button></div></div>`,t.n?'hub':null);}
function setupSet(k,v){const s=SETUP;if(!s)return;if(k==='n0')s.n[0]=v;else if(k==='n1')s.n[1]=v;else s[k]=v;sfx('tap');const y=window.scrollY;draw();window.scrollTo(0,y);}
function setupDone(){const p=me(),t=T(p),s=SETUP;t.n=s.n.slice();t.c=s.c;t.a=s.a;t.m=s.m||'';SETUP=null;sv();sfx('correct');VIEW='hub';NOTE=`🎉 <b>${E(tname(t))}</b> is ready!`;draw();}

/* ---------- hub ---------- */
function canMake(t,r){const n=REC[r].need;return Math.min(...Object.keys(n).map(k=>Math.floor((t.inv[k]||0)/n[k])));}
function nextStep(p,t){
 if(t.ck)return {v:'price',l:`🏷️ Pick a price for your ${t.ck.q} ${REC[t.ck.r].e}`};
 if(shiftDone(t))return {v:'receipt',l:'🧾 Read your receipt!'};
 const left=stockLeft(t),canCook=RIDS.some(r=>canMake(t,r)>0);
 if(isOpen(t))return {v:'market',l:'🏙️ Visit the Market Square',sub:`Customers are coming! ⏳ ${left2(t.sh.e-now())} left`};
 if(left>0)return {v:'open',l:'🚚 Open the truck!'};
 if(canCook)return {v:'cook',l:'👩‍🍳 Cook a batch'};
 return {v:'shop',l:'🛒 Buy ingredients'};}
function cravHTML(){const c=cravings(now());return `<div class="tk-crave">🐾 Today the pets want something <b>${FLAV[c[0]].e} ${FLAV[c[0]].n.toUpperCase()}</b> and <b>${FLAV[c[1]].e} ${FLAV[c[1]].n.toUpperCase()}</b>!<small>Treats that match sell twice as fast, even at a higher price.</small></div>`;}
function drawHub(p,t){const news=runSync(p);newsModal(news);
 const pic=picnic();const tot=picTotals(pic.id);
 if(pic.active&&picDone(tot)&&!(t.pc&&t.pc.id===pic.id&&t.pc.cel)){VIEW='party';return drawParty(p,t);}
 const nx=nextStep(p,t);const open=isOpen(t);const act=active(t);
 const status=open?`<span class="tk-pill open">🟢 Open · ${left2(t.sh.e-now())} left</span>`:`<span class="tk-pill closed">⚪ Closed</span>`;
 const stock=act.length?act.map(b=>{const L=bLeft(b),fam=sum(b.f||[],f=>f[2]);return `<div class="tk-srow"><span class="e">${b.sp?`<span class="tk-combo">${itemE(b)}</span>`:REC[b.r].e}</span><div class="grow"><b>${E(itemN(b))}</b>${matches(b,now())?'<span class="tk-crv">🐾 craving!</span>':''}${b.sp&&spParse(b.sp).rare?'<span class="tk-crv rare">🌟 rare</span>':''}<small>${L} of ${b.q} left · ${C(b.p)} each${b.vs||fam?` · sold ${(b.vs||0)+fam}`:''}</small></div>${L===0?'<span class="tk-pill gold">Sold out!</span>':''}</div>`;}).join(''):`<p class="tk-muted" style="margin:0">Nothing on the counter yet.</p>`;
 const inv=Object.keys(ING).map(k=>`<span class="tk-chip ${(t.inv[k]||0)?'':'zero'}">${ING[k].e} ${t.inv[k]||0}</span>`).join('')+Object.keys(t.rr||{}).filter(k=>RARE[k]&&t.rr[k]>0).map(k=>`<span class="tk-chip rare" title="${RARE[k].n}">${RARE[k].e} ${t.rr[k]}</span>`).join('');
 const S=stars(t);try{if(window.Truck&&Truck.hooks&&typeof Truck.hooks.critic==='function'&&[0,6].includes(new Date(now()).getDay()))Truck.hooks.critic(p,t);}catch(e){}
 const bagN=sum(RIDS,r=>t.bag[r]||0);
 const nb=nx.v==='market'?`Truck.market('truck')`:`Truck._view('${nx.v}')`;
 page(`🚚 ${E(tname(t))}`,`${NOTE?`<div class="tk-card">${rosa(NOTE)}</div>`:''}
 <div class="tk-2"><div><div class="tk-scene">${streetSVG(p)}</div>
  <div class="tk-card"><div class="tk-row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">On the counter</h3>${status}</div><div class="tk-stock">${stock}</div>
  ${open?`<div class="tk-row" style="margin-top:10px"><span class="tk-muted">🏘️ ${t.sh.n||0} customers so far · +${C(t.sh.c||0)}</span><button class="btn ghost dark small" onclick="Truck._close()">Close early</button></div>`:''}</div>
  <div class="tk-card"><h3>🧺 Ingredients</h3><div class="tk-inv">${inv}</div>${Object.keys(t.rr||{}).length?'<p class="tk-muted" style="margin:6px 0 0">🌟 Rare ingredients come from Adventure Camp trips.</p>':''}</div></div>
 <div><button class="btn green tk-next" onclick="${nb}">${nx.l}</button>${nx.sub?`<p class="tk-muted" style="text-align:center;margin:6px 0 0;color:#d6ccff">${nx.sub}</p>`:''}
  ${cravHTML()}
  <div class="tk-card tk-starc"><div class="tk-row" style="justify-content:space-between"><h3 style="margin:0">Chef Stars</h3><span class="tk-stars">${starStr(S)}</span></div><p style="margin:6px 0 0">${starLine(t)}</p>
   <p class="tk-muted" style="margin:4px 0 0">${S?`Now: customers +${S*15}% · village limit ${CAPS[S]} 🪙 a day${S>=3?" · 2 special slots":''}`:'Each star brings more customers and a bigger daily village limit.'}</p></div>
  <div class="tk-acts">
   <button class="tk-act" onclick="Truck._view('shop')"><i>🛒</i>Supply Shop</button>
   <button class="tk-act" onclick="Truck._view('cook')"><i>👩‍🍳</i>Cook</button>
   <button class="tk-act" onclick="Truck._view('special')"><i>✨</i>Specials${(t.sp||[]).length?'':'<span class="dot">new</span>'}</button>
   <button class="tk-act" onclick="Truck._view('receipt')"><i>🧾</i>Receipt${shiftDone(t)?'<span class="dot">!</span>':''}</button>
   <button class="tk-act" onclick="Truck.market('truck')"><i>🏙️</i>Market Square</button>
   <button class="tk-act" onclick="Truck._view('bag')"><i>🎒</i>Treat Bag${bagN?`<span class="dot">${bagN}</span>`:''}</button>
   <button class="tk-act" onclick="Truck._view('book')"><i>📖</i>Recipe Book</button>
   <button class="tk-act" onclick="Truck._view('deco')"><i>🎨</i>Decorate</button>
   ${pic.active?`<button class="tk-act" style="grid-column:1/-1;min-height:0;display:flex;align-items:center;gap:10px;text-align:left;padding:10px 14px" onclick="Truck._view('picnic')"><i style="font-size:38px">🧺</i><span style="flex:1">Pet Picnic! <small style="display:block;font-weight:600;color:var(--muted)">${Math.min(tot.s,PIC_GOAL.s)+Math.min(tot.d,PIC_GOAL.d)} of ${PIC_GOAL.s+PIC_GOAL.d} treats · ${PIC_PAY} 🪙 for each one you give</small></span></button>`:''}
  </div></div></div>`);
 NOTE=null;}
function closeEarly(){const p=me(),t=T(p);if(!isOpen(t))return;
 modal(`<div class="mcard"><div class="big-emoji">🚚</div><h2>Close the truck now?</h2><p>Customers stop coming until you open again.</p><div class="row"><button class="btn danger" onclick="Truck._closeYes()">Close it</button><button class="btn green" onclick="closeModal()">Keep it open</button></div></div>`);}
function closeYes(){closeModal();const p=me(),t=T(p);settle(p);t.sh.e=now();t.sh.l=t.sh.e;sv();VIEW='receipt';draw();}

/* ---------- shop ---------- */
function cartTotal(){return sum(Object.keys(CART),k=>(CART[k].s||0)*ING[k].p+(CART[k].b||0)*ING[k].bp);}
function cartLines(){const out=[];Object.keys(CART).forEach(k=>{const c=CART[k];if(c.s)out.push({k,e:ING[k].e,q:c.s,c:c.s*ING[k].p,t:`${ING[k].e} ${c.s}`});if(c.b)out.push({k,e:ING[k].e,q:c.b*ING[k].bq,c:c.b*ING[k].bp,t:`${ING[k].e} ${c.b*ING[k].bq} (bulk)`});});return out;}
function drawShop(p,t){const tot=cartTotal();const lines=cartLines();const b=band(p);const sq=sqToday(t);
 const deal=b>=2&&!sq.d?dealQ():null;if(deal&&(!MQ||MQ.o.onDone!=='deal'))startMath(deal,{onDone:'deal'});
 page('🦉 Supply Shop',`${rosa(`Hoo! What do you need today?`,`Tap a recipe and I'll fill your cart.`,'🦉')}
 <div class="tk-card" style="margin-top:10px"><h3>🧺 Fill my cart for 1 batch of…</h3><div class="tk-fill">${RIDS.map(r=>`<button class="btn gold small" onclick="Truck._fill('${r}')">${REC[r].e} ${REC[r].n}</button>`).join('')}</div></div>
 ${deal?`<div class="tk-card"><h3>🔎 Deal detective <span class="tk-pill gold">+1 🪙</span></h3><div id="tkMath">${mathHTML()}</div></div>`:''}
 <div class="tk-shop">${Object.keys(ING).map(k=>{const g=ING[k];const c=CART[k]||{};return `<div class="tk-ing"><span class="e">${g.e}</span><b>${g.n}</b><small>You have ${t.inv[k]||0}${(c.s||c.b)?` · 🛒 +${(c.s||0)+(c.b||0)*g.bq}`:''}</small>
  <button class="tk-buy" onclick="Truck._add('${k}','s')">1 ${g.u} · ${C(g.p)}<em>single</em></button>
  <button class="tk-buy bulk" onclick="Truck._add('${k}','b')">${g.bq} ${g.us} · ${C(g.bp)}<em>bulk pack</em></button></div>`;}).join('')}</div>
 <div style="height:12px"></div>
 <div class="tk-cart"><div class="lines">${lines.length?lines.map(l=>`<span>${l.t}</span>`).join(''):'🛒 Your cart is empty'}</div>
  ${lines.length?`<button class="btn ghost small" onclick="Truck._clearCart()">✕</button>`:''}
  <button class="btn green" ${!lines.length||tot>(p.coins||0)?'disabled style="opacity:.5"':''} onclick="Truck._pay()">Pay ${C(tot)}</button></div>
 ${lines.length&&tot>(p.coins||0)?`<p class="tk-muted" style="color:#ffc9c9;text-align:center">You need ${C(tot-(p.coins||0))} more. Win battles to earn coins!</p>`:''}`,'hub');
}
function sqToday(t){if(!t.sq||t.sq.k!==dk())t.sq={k:dk(),n:0,d:0};return t.sq;}
function dealQ(){const k=['mb','fl','ju'][dnum()%3];const g=ING[k];const per=g.bp/g.bq;const fm=fmtNum(per);
 return {k:'deal',av:'🦉',op:'div',choice:[{t:`1 ${g.u}`,s:`${C(g.p)}`},{t:`${g.bq} ${g.us}`,s:`${C(g.bp)} bulk`}],ans:per<g.p?1:0,
  text:`${g.e} Which is the better deal <b>per ${g.u}</b>?`,pics:'',
  hint:`Bulk: ${g.bp} ÷ ${g.bq} = <b>${fm} 🪙</b> for each ${g.u}.<br>Single: <b>${g.p} 🪙</b> for each ${g.u}. Which is less?`,
  explain:`${g.bp} ÷ ${g.bq} = ${fm} 🪙 a ${g.u}, less than ${g.p} 🪙. The bulk pack is the better deal (if you'll use it all!).`};}
function addCart(k,kind){CART[k]=CART[k]||{s:0,b:0};CART[k][kind]++;sfx('tap');const y=window.scrollY;draw();window.scrollTo(0,y);}
function fillFor(r){const p=me(),t=T(p);const n=REC[r].need;Object.keys(n).forEach(k=>{const have=(t.inv[k]||0)+((CART[k]||{}).s||0)+((CART[k]||{}).b||0)*ING[k].bq;const miss=n[k]-have;if(miss>0){CART[k]=CART[k]||{s:0,b:0};CART[k].s+=miss;}});
 sfx('tap');if(!cartLines().length)say(`You already have enough for ${REC[r].e}!`);const y=window.scrollY;draw();window.scrollTo(0,y);}
function checkoutQ(p,lines){const b=band(p);const tot=sum(lines,l=>l.c);
 const coins=n=>`<span class="tk-grp">${'🪙'.repeat(Math.min(n,12))}${n>12?`<b style="font-size:18px"> ${n}</b>`:''}</span>`;
 if(b===0){if(tot>20)return null;const ls=lines.slice(0,3);return {k:'shop',av:'🦉',op:'add',ans:tot,text:`How many coins do you pay?`,
  pics:ls.map(l=>`${l.e}${coins(l.c)}`).join('<span class="tk-plus">+</span>'),eq:ls.map(l=>l.c).join(' + ')+' =',
  hint:`Count the coins one by one: ${Array.from({length:Math.min(tot,20)},(_,i)=>i+1).join(', ')}`,explain:`${ls.map(l=>l.c).join(' + ')} = ${tot}`};}
 if(b===1)return {k:'shop',av:'🦉',op:'add',ans:tot,text:`What's the total for your cart?`,pics:lines.map(l=>`<span class="tk-grp" style="font-size:20px;letter-spacing:0">${l.t} · ${C(l.c)}</span>`).join(''),eq:'Total =',
  hint:addHint(lines.map(l=>l.c)),explain:`${lines.map(l=>l.c).join(' + ')} = ${tot}`};
 return null;}
function addHint(a){if(a.length<2)return `Just one thing to pay for: look at its price!`;let run=a[0];const st=[];for(let i=1;i<a.length;i++){const last=i===a.length-1;st.push(`${run} + ${a[i]} = ${last?'?':run+a[i]}`);run+=a[i];}return 'Add them one at a time:<br>'+st.join('<br>');}
function pay(){const p=me(),t=T(p);const lines=cartLines();const tot=cartTotal();if(!lines.length||tot>(p.coins||0))return;
 const sq=sqToday(t);const q=sq.n<2?checkoutQ(p,lines):null;
 if(q){sq.n++;startMath(q,{onDone:'pay'});VIEW='pay';return drawPayMath(p);}
 finishPay();}
function drawPayMath(p){if(!MQ||MQ.o.onDone!=='pay'){VIEW='shop';return draw();}page('🦉 Checkout',`<div class="tk-card"><div id="tkMath">${mathHTML()}</div></div>`,'hub');}
function finishPay(){const p=me(),t=T(p);const tot=cartTotal();if(tot>(p.coins||0))return;p.coins-=tot;
 Object.keys(CART).forEach(k=>{const c=CART[k];t.inv[k]=(t.inv[k]||0)+(c.s||0)+(c.b||0)*ING[k].bq;});CART={};MQ=null;sv();sfx('coin');
 const r=RIDS.find(r=>canMake(t,r)>0);VIEW='hub';NOTE=`Thanks for shopping! ${r?`You can cook ${REC[r].e} now.`:''}`;draw();}

/* ---------- math engine (keypad, hints, never blocks) ---------- */
const FR={'½':.5,'¼':.25,'¾':.75};
function parseAns(s){if(!s)return NaN;let v=0,num='';for(const ch of s){if(FR[ch]!=null)v+=FR[ch];else num+=ch;}return (num?+num:0)+v;}
function fmtNum(x){const w=Math.floor(x+1e-9),f=Math.round((x-w)*100)/100;const fc={.5:'½',.25:'¼',.75:'¾'}[f];if(!f)return String(w);if(fc)return (w?w:'')+fc;return String(Math.round(x*100)/100);}
function startMath(q,o){MQ={q,in:'',tries:0,help:false,fb:'',cls:'',done:false,alone:false,o:o||{}};}
function mathHTML(){const m=MQ;if(!m)return '';const q=m.q;
 const hint=m.help||m.tries>=1?`<div class="tk-hint">🤝 ${q.hint}</div>`:'';
 const doneBar=m.done?`<div class="tk-row c" style="margin-top:8px"><button class="btn green big" onclick="Truck._mathNext()">Next ➜</button></div>`:'';
 const body=q.choice?`<div class="tk-choice">${q.choice.map((c,i)=>`<button ${m.done?'disabled':''} style="${m.done&&i===q.ans?'border-color:#40c057;background:#ebfbee':''}" onclick="Truck._pickA(${i})">${c.t}<small>${c.s}</small></button>`).join('')}</div>`
  :`<div class="tk-eq">${q.eq||''} <span class="ansbox">${m.in||'?'}</span>${q.unit?` <span style="font-size:22px">${q.unit}</span>`:''}</div>`;
 const pad=q.choice||m.done?'':`<div class="tk-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="Truck._k('${n}')">${n}</button>`).join('')}<button class="del" onclick="Truck._k('del')">⌫</button><button onclick="Truck._k('0')">0</button><button class="go" onclick="Truck._k('go')">✓</button>${q.fr?['½','¼','¾'].map(f=>`<button class="fr" onclick="Truck._k('${f}')">${f}</button>`).join(''):''}</div>`;
 return `<div class="tk-math ${q.choice||m.done?'one':''}"><div>${rosa(q.text,null,q.av)}${q.pics?`<div class="tk-pics">${q.pics}</div>`:''}${body}<div class="tk-fb ${m.cls}">${m.fb||'&nbsp;'}</div>${hint}
  ${!m.done&&!m.help&&!m.tries?`<div class="tk-row c"><button class="btn ghost dark small" onclick="Truck._help()">🤝 Work it out with me</button></div>`:''}${doneBar}</div><div>${pad}</div></div>`;}
function redrawMath(){const el=document.getElementById('tkMath');if(el)el.innerHTML=mathHTML();else draw();}
function mkey(k){const m=MQ;if(!m||m.done)return;if(k==='del')m.in=m.in.slice(0,-1);else if(k==='go'){if(m.in)return check(parseAns(m.in));return;}
 else if(FR[k]!=null){if(!/[½¼¾]/.test(m.in))m.in+=k;}else if(m.in.length<4&&!/[½¼¾]/.test(m.in))m.in=m.in==='0'?k:m.in+k;sfx('tap');redrawMath();}
function pickA(i){if(!MQ||MQ.done)return;check(i);}
function check(v){const m=MQ,q=m.q;const ok=Math.abs(v-q.ans)<1e-6;const p=me();
 if(ok){m.done=true;m.ok=true;m.alone=!m.help;m.cls='ok';m.fb=m.alone?pick2(['✔ Yes! You got it!','✔ Right!','✔ Super cooking math!']):'✔ Yes! Great teamwork!';sfx('correct');}
 else{m.tries++;if(m.tries>=2){m.done=true;m.alone=false;m.cls='no';m.fb=`It's ${q.choice?q.choice[q.ans].t:fmtNum(q.ans)}. ${q.explain||''}`;sfx('wrong');}
  else{m.cls='no';m.fb=`Hmm, try again!`;m.in='';m.help=true;sfx('wrong');}}
 if(m.done)stat(p,q.op,m.alone);redrawMath();}
const pick2=a=>a[Math.floor(Math.random()*a.length)];
function stat(p,op,alone){try{const t=T(p);t.ms[alone?'a':'h']++;const s=p.stats&&p.stats[op];if(s&&typeof s.r==='number'){if(alone)s.r++;else s.w=(s.w||0)+1;}}catch(e){}}
function mathNext(){const m=MQ;if(!m)return;const p=me(),t=T(p);const q=m.q;const alone=m.alone;
 if(q.book){if(t.bk[q.book]!=='a')t.bk[q.book]=alone?'a':'h';}
 if(starCheck(t)){sv();const sN=stars(t);setTimeout(()=>{try{modal(starModal(sN));}catch(e){}},450);sfx('win');}
 const d=m.o.onDone;MQ=null;
 if(d==='pay'){if(m.ok){p.coins=(p.coins||0)+1;say('+1 🪙 math bonus!');}finishPay();return;}
 if(d==='deal'){const sq=sqToday(t);sq.d=1;if(m.ok){p.coins=(p.coins||0)+1;say('+1 🪙 deal detective!');}sv();draw();return;}
 if(d==='cook'){COOK.si++;sv();return drawCook(p,t);}
 if(d==='receipt'){if(t.sh)t.sh.q=1;if(m.ok){p.coins=(p.coins||0)+1;say('+1 🪙 quick check!');}sv();draw();return;}
 if(d==='picnic'){const pc=myPc(t,picnic().id);pc.q=1;if(m.ok){p.coins=(p.coins||0)+1;say('+1 🪙 picnic planner!');}sv();draw();return;}
 sv();draw();}

/* ---------- cook ---------- */
function cookSteps(p,t,r,nb){const R=REC[r],b=band(p),st=[];const n=R.need;const ck=R.main,g=ING[ck];
 const costB=cost1(r)*nb,made=R.makes*nb;
 const costQ={k:'c',book:`${r}.c`,op:'div',ans:costB/made,text:`${made} ${R.many} cost <b>${C(costB)}</b> to make. How much is <b>each ${R.one}</b>?`,
  pics:`<span class="tk-grp">${'🪙'.repeat(Math.min(costB,12))}${costB>12?` <b style="font-size:18px">${costB}</b>`:''}</span><span class="tk-plus">÷</span><span class="tk-grp">${R.e.repeat(Math.min(made,8))}${made>8?` <b style="font-size:18px">${made}</b>`:''}</span>`,
  eq:`${costB} ÷ ${made} =`,unit:'🪙',hint:`Share the coins out fairly: give every ${R.one} 1 🪙 — that uses ${made}. ${costB>made?`Give each one more — that's ${made*2} used.`:''} How many coins does each ${R.one} get?`,explain:`${costB} ÷ ${made} = ${costB/made} 🪙 each.`};
 if(b===0){const items=Object.keys(n);
  if(nb>1)st.push({k:'g',book:`${r}.g${nb}`,op:'add',ans:n[ck]*nb,text:`Each batch needs <b>${n[ck]} ${g.e}</b>. You're making <b>${nb} batches</b>. How many ${g.e} in all?`,
   pics:Array.from({length:nb},()=>`<span class="tk-grp">${g.e.repeat(n[ck])}</span>`).join('<span class="tk-plus">+</span>'),eq:Array(nb).fill(n[ck]).join(' + ')+' =',
   hint:`Count every ${g.e}: ${Array.from({length:n[ck]*nb},(_,i)=>i+1).join(', ')}!`,explain:`${Array(nb).fill(n[ck]).join(' + ')} = ${n[ck]*nb}`});
  else st.push({k:'g',book:`${r}.g1`,op:'add',ans:sum(items,k=>n[k]),text:`Everything goes in the bowl! How many things is that?`,
   pics:items.map(k=>`<span class="tk-grp">${ING[k].e.repeat(n[k])}</span>`).join('<span class="tk-plus">+</span>'),eq:items.map(k=>n[k]).join(' + ')+' =',
   hint:`Count them all: ${Array.from({length:sum(items,k=>n[k])},(_,i)=>i+1).join(', ')}!`,explain:`${items.map(k=>n[k]).join(' + ')} = ${sum(items,k=>n[k])}`});}
 else if(b===1){const k=R.big,G=ING[k];
  if(nb>1)st.push({k:'s',book:`${r}.s${nb}`,op:'mul',ans:n[k]*nb,text:`1 batch needs <b>${n[k]} ${G.us} ${G.e}</b>. How many for <b>${nb} batches</b>?`,
   pics:Array.from({length:nb},()=>`<span class="tk-grp">${G.e.repeat(n[k])}</span>`).join(''),eq:`${n[k]} × ${nb} =`,unit:G.us,
   hint:`${nb} groups of ${n[k]}: ${Array.from({length:nb},(_,i)=>n[k]*(i+1)).slice(0,-1).join(', ')}, …?`,explain:`${n[k]} × ${nb} = ${n[k]*nb}`});
  st.push(costQ);}
 else if(b===2){const x=R.x,m=nb>1?nb:3;const tot=x.a*m/x.b;const fr=fmtNum(x.a/x.b);
  st.push({k:'f',book:`${r}.f${m}`,op:'frac',fr:1,ans:tot,text:`Rosa's secret: <b>${fr} cup ${x.e} ${x.n}</b> in each batch. How much for <b>${m} batches</b>?${nb>1?'':' <small>(just imagine!)</small>'}`,
   pics:Array.from({length:m},()=>`<span class="tk-grp">${x.e} ${fr}</span>`).join('<span class="tk-plus">+</span>'),eq:`${fr} × ${m} =`,unit:'cups',
   hint:`Add it ${m} times: ${Array(m).fill(fr).join(' + ')}.<br>${x.b===2?'Two halves (½ + ½) make <b>1 whole cup</b>.':'Four quarters (¼ + ¼ + ¼ + ¼) make <b>1 whole cup</b>.'} Use the ½ ¼ ¾ keys for the leftover part.`,
   explain:`${fr} × ${m} = ${fmtNum(tot)} cups.`});st.push(costQ);}
 else{const hsx=R.hs,G=ING[hsx.k],amt=n[hsx.k]*hsx.to/R.makes;
  st.push({k:'p',book:`${r}.p`,op:'mul',ans:amt,text:`This recipe makes <b>${R.makes} ${R.many}</b> with <b>${n[hsx.k]} ${G.us} ${G.e}</b>. How many ${G.us} for <b>${hsx.to} ${R.many}</b>?`,
   pics:`<span class="tk-grp">${R.makes} ${R.e} : ${n[hsx.k]} ${G.e}</span><span class="tk-plus">→</span><span class="tk-grp">${hsx.to} ${R.e} : ? ${G.e}</span>`,eq:`${n[hsx.k]} × ${hsx.to}/${R.makes} =`,unit:G.us,
   hint:`Find 1 ${R.one} first: ${n[hsx.k]} ÷ ${R.makes} = ${fmtNum(n[hsx.k]/R.makes)} ${G.u}. Then × ${hsx.to}.`,explain:`${n[hsx.k]} ÷ ${R.makes} × ${hsx.to} = ${fmtNum(amt)} ${G.us}.`,fr:amt%1?1:0});st.push(costQ);}
 return st.filter(q=>!t.bk[q.book]);}
function ckInfo(t,key){if(RIDS.includes(key))return {key,base:key,sp:null,R:REC[key],makes:REC[key].makes,cb:cost1(key),xb:0,rare:null,e:REC[key].e,n:REC[key].n};
 const s=spParse((t.sp||[])[+String(key).slice(1)]);if(!s)return null;const R=REC[s.b];return {key,base:s.b,sp:s,R,makes:R.makes,cb:cost1(s.b)+s.xc*R.makes,xb:s.xc*R.makes,rare:s.rare?s.tp:null,e:s.e,n:s.name};}
function canMakeK(p,t,key){const c=ckInfo(t,key);if(!c)return 0;let n=canMake(t,c.base);if(c.xb)n=Math.min(n,Math.floor((p.coins||0)/c.xb));if(c.rare)n=Math.min(n,(t.rr||{})[c.rare]||0);return Math.max(0,Math.min(3,n));}
const cookKeys=t=>RIDS.concat((t.sp||[]).map((d,i)=>spParse(d)?'s'+i:null).filter(Boolean));
function spSteps(p,t,c,nb){const s=c.sp,R=c.R,b=band(p),made=c.makes*nb,costB=c.cb*nb,ce=s.each,st=[],d=s.def;
 const coins=n=>`<span class="tk-grp">${'🪙'.repeat(n)}</span>`;
 const partsQ={k:'g',book:`${d}.g`,op:'add',ans:ce,text:`What does <b>one</b> ${E(s.name)} cost to make? Add the parts!`,
  pics:`${R.e}${coins(each(s.b))}<span class="tk-plus">+</span>${s.Tp.e}${s.rare?'<span class="tk-grp">free!</span>':coins(s.Tp.c)}<span class="tk-plus">+</span>${s.F.e}${coins(s.F.c)}`,
  eq:`${each(s.b)} + ${s.rare?0:s.Tp.c} + ${s.F.c} =`,unit:'🪙',hint:`Count all the coins: ${Array.from({length:ce},(_,i)=>i+1).join(', ')}!`,explain:`${each(s.b)} + ${s.rare?0:s.Tp.c} + ${s.F.c} = ${ce} 🪙`};
 const costQ={k:'c',book:`${d}.c`,op:'div',ans:ce,text:`Your ${made} specials cost <b>${C(costB)}</b> to make (food ${C(cost1(s.b)*nb)} + extras ${C(c.xb*nb)}). How much is <b>each one</b>?`,
  pics:`<span class="tk-grp">🪙 ${costB}</span><span class="tk-plus">÷</span><span class="tk-grp">${R.e.repeat(Math.min(made,8))}${made>8?` <b style="font-size:18px">${made}</b>`:''}</span>`,eq:`${costB} ÷ ${made} =`,unit:'🪙',
  hint:`Try a guess: if each cost ${ce-1} 🪙, ${made} would cost ${made*(ce-1)} 🪙. Is that enough, or one more?`,explain:`${costB} ÷ ${made} = ${ce} 🪙 each.`};
 if(b===0)st.push(partsQ);
 else if(b===1)st.push(costQ);
 else if(b===2){if(!s.rare){const Tp=s.Tp,amt=made*Tp.a/Tp.b,fr=fmtNum(Tp.a/Tp.b);
   st.push({k:'f',book:`${d}.f${made}`,op:'frac',fr:1,ans:amt,text:`Each treat gets <b>${fr} ${Tp.u} ${Tp.e} ${Tp.n.toLowerCase()}</b>. How much for <b>${made} treats</b>?`,
    pics:`<span class="tk-grp">${Tp.e} ${fr} × ${made}</span>`,eq:`${fr} × ${made} =`,unit:Tp.us,
    hint:`${made} × ${Tp.a} = ${made*Tp.a} pieces of 1/${Tp.b}. ${Tp.b===2?'Two halves':'Four quarters'} make 1 whole. How many wholes, and what's left over?`,explain:`${fr} × ${made} = ${fmtNum(amt)} ${Tp.us}.`});}
  st.push(costQ);}
 else{st.push(costQ);const add=SP_ADD.find(a=>(a*100)%ce===0)||SP_ADD[0];const pct=Math.round(add*100/ce);
  st.push({k:'m',book:`${d}.m`,op:'div',ans:pct,text:`Each one costs <b>${C(ce)}</b>. If you sell it for <b>${C(ce+add)}</b>, what's your <b>markup</b>?`,pics:`<span class="tk-grp">profit ${add} ÷ cost ${ce}</span>`,eq:'Markup =',unit:'%',
   hint:`Markup = profit ÷ cost × 100. The profit is ${ce+add} − ${ce} = ${add} 🪙.`,explain:`${add} ÷ ${ce} × 100 = ${pct}%`});}
 return st.filter(q=>!t.bk[q.book]);}
function drawCook(p,t){if(t.ck){VIEW='price';return drawPrice(p,t);}
 const keys=cookKeys(t);
 if(!COOK)COOK={r:keys.find(k=>canMakeK(p,t,k)>0)||null,nb:1,stage:'pick',steps:[],si:0};const c=COOK;
 if(c.stage==='pick'){const rs=keys.map(k=>{const I=ckInfo(t,k),R=I.R,mk=canMakeK(p,t,k);const s=I.sp;
   return `<button class="tk-rec ${c.r===k?'on':''} ${mk?'':'no'} ${s?'sp':''}" onclick="Truck._cookPick('${k}')"><span class="e">${s?`<span class="tk-combo">${I.e}</span>`:R.e}</span><div><b>${E(I.n)}</b>${s?`<div class="tk-badges" style="justify-content:inherit;margin:2px 0"><span class="a">✨ Chef's Special</span>${s.rare?'<span class="h">🌟 Rare</span>':''}${matches({r:s.b,sp:s.def},now())?'<span class="a">🐾 craving!</span>':''}</div>`:''}<div class="tk-muted">Makes ${R.makes}${s&&I.xb?` · extras ${C(I.xb)}`:''}${s&&s.rare?` · uses 1 ${s.Tp.e} (you have ${(t.rr||{})[s.tp]||0})`:''}</div>
   <div class="tk-need">${Object.keys(R.need).map(q=>`<span class="${(t.inv[q]||0)<R.need[q]?'miss':''}">${ING[q].e} ${R.need[q]}</span>`).join('')}</div>${mk?`<div class="tk-muted" style="color:#2b8a3e;font-weight:700">✔ You can make ${mk} batch${mk>1?'es':''}</div>`:`<div class="tk-muted" style="color:#c92a2a;font-weight:700">${s&&s.rare&&!((t.rr||{})[s.tp])?'Need a rare ingredient':s&&I.xb>(p.coins||0)?'Need more coins':'Need more ingredients'}</div>`}</div></button>`;}).join('');
  const I=c.r&&ckInfo(t,c.r);const mk=c.r?canMakeK(p,t,c.r):0;const key=I&&(I.sp?'s:'+I.sp.def:I.base);const old=I&&active(t).find(b=>(b.sp?'s:'+b.sp:b.r)===key&&bLeft(b)>0);
  const none=!keys.some(k=>canMakeK(p,t,k)>0);
  page('👩‍🍳 Cook a batch',`${rosa(none?'We need ingredients first!':I?`How many batches of ${I.e}?`:'What shall we cook?',none?'The Supply Shop has everything.':I?'Or tap another recipe.':'Tap a recipe.')}
  ${none?`<button class="btn green tk-next" style="margin-top:12px" onclick="Truck._view('shop')">🛒 Go to the Supply Shop</button>`:''}
  <div class="tk-recs" style="margin-top:12px">${rs}</div>
  ${(t.sp||[]).length?'':`<div class="tk-row c"><button class="btn gold" onclick="Truck._view('special')">✨ Invent a Chef's Special</button></div>`}
  ${I?`<div class="tk-card" style="margin-top:14px"><div class="tk-nb">${[1,2,3].map(n=>`<button class="${c.nb===n?'on':''}" ${n>mk?'disabled':''} onclick="Truck._cookNb(${n})">${n} batch${n>1?'es':''}<small>${I.makes*n} ${I.R.e}${I.xb?` · ${C(I.xb*n)}`:''}</small></button>`).join('')}</div>
   ${old?`<p class="tk-muted" style="text-align:center">Your ${bLeft(old)} leftover ${I.R.e} will go into your 🎒 Treat Bag.</p>`:''}
   <div class="tk-row c"><button class="btn green tk-next" ${mk?'':'disabled style="opacity:.5;animation:none"'} onclick="Truck._cookGo()">🥣 Let's cook!</button></div>
   ${mk?'':`<div class="tk-row c"><button class="btn gold" onclick="Truck._view('shop')">🛒 Get ingredients</button></div>`}</div>`:''}`,'hub');return;}
 const I=ckInfo(t,c.r);
 if(c.stage==='math'){if(c.si>=c.steps.length){c.stage='anim';return drawCook(p,t);}
  if(!MQ)startMath(c.steps[c.si],{onDone:'cook'});
  page(`${I.sp?'✨':I.R.e} ${E(I.n)}`,`<div class="tk-card"><div class="tk-row" style="justify-content:space-between;margin-bottom:6px"><span class="tk-pill">Step ${c.si+1} of ${c.steps.length}</span><span class="tk-pill">${c.nb} batch${c.nb>1?'es':''} · ${I.makes*c.nb} ${I.R.e}</span></div><div id="tkMath">${mathHTML()}</div></div>`,'hub');return;}
 if(c.stage==='anim'){const R=I.R;
  page(`${I.sp?'✨':R.e} Cooking…`,`<div class="tk-card tk-cook"><div class="tk-bowl">🥣</div><h3>Mix, mix, mix…</h3><div class="tk-need" style="font-size:26px">${Object.keys(R.need).map(k=>`<span>${ING[k].e} ${R.need[k]*c.nb}</span>`).join('')}${I.sp?`<span>${I.sp.Tp.e}</span><span>${I.sp.F.e}</span>`:''}</div></div>`,'hub');
  setTimeout(()=>{if(COOK!==c||VIEW!=='cook')return;doCook(p,t,c);},1300);return;}}
function doCook(p,t,c){const I=ckInfo(t,c.r);if(!I||canMakeK(p,t,c.r)<c.nb){COOK=null;draw();return;}const R=I.R;
 Object.keys(R.need).forEach(k=>t.inv[k]=Math.max(0,(t.inv[k]||0)-R.need[k]*c.nb));
 if(I.xb)p.coins-=I.xb*c.nb;if(I.rare){t.rr[I.rare]-=c.nb;if(t.rr[I.rare]<=0)delete t.rr[I.rare];}
 t.ck={r:I.base,q:I.makes*c.nb,k:I.cb*c.nb,nb:c.nb};if(I.sp)t.ck.sp=I.sp.def;COOK=null;sv();sfx('win');VIEW='price';PRICE=null;
 NOTE=null;draw();}
function cookPick(r){if(!COOK)COOK={nb:1,stage:'pick'};COOK.r=r;COOK.nb=1;sfx('tap');draw();}
function cookNb(n){COOK.nb=n;sfx('tap');draw();}
function cookGo(){const p=me(),t=T(p);const c=COOK;if(!c||!c.r||canMakeK(p,t,c.r)<c.nb)return;const I=ckInfo(t,c.r);c.steps=I.sp?spSteps(p,t,I,c.nb):cookSteps(p,t,I.base,c.nb);c.si=0;c.stage='math';MQ=null;sfx('tap');draw();}

/* ---------- price ---------- */
function tierFace(r){return r>=RATE[0]-1e-9?{f:'😀😀😀',n:'Sells fast'}:r>=RATE[1]-1e-9?{f:'😀😀',n:'Steady'}:{f:'😐',n:'Sells slowly'};}
function drawPrice(p,t){const ck=t.ck;if(!ck){VIEW='hub';return drawHub(p,t);}const R=REC[ck.r];const s=ck.sp&&spParse(ck.sp);const e1=s?s.each:each(ck.r);const b=band(p);
 const known=s?(t.bk[`${s.def}.c`]||t.bk[`${s.def}.g`]):t.bk[`${ck.r}.c`];const adds=s?SP_ADD:TIERS.map(x=>x.add);const fake={r:ck.r,sp:ck.sp};const crave=matches(fake,now());
 const cards=adds.map((ad,i)=>{const pr=e1+ad;const fc=tierFace(rateOf({...fake,tr:i},now(),0));return `<button class="tk-price ${PRICE===i?'on':''}" onclick="Truck._price(${i})"><span class="big">${C(pr)}</span><span class="face">${fc.f}</span><div><b>${fc.n}</b><small>${ad?`profit +${ad} each${b>=2?` · +${ad*ck.q} for all`:''}`:'no profit, happy pets'}</small></div></button>`;}).join('');
 const nm=s?(ck.q>1?s.name+'s':s.name):R.many;
 page(`🏷️ Price your ${s?'special':R.many}`,`<div class="tk-card"><div class="tk-row c" style="font-size:44px;margin-bottom:6px">${s?`<span class="tk-combo" style="font-size:52px">${s.e}</span>`:R.e.repeat(Math.min(ck.q,9))}</div>
 ${rosa(`You made <b>${ck.q} ${E(nm)}</b>! Each one cost <b>${known?C(e1):'?'}</b> to make.`,s&&s.rare?'🌟 Rare special: pets snap these up at any price!':crave?'🐾 It matches today\'s craving, so it sells fast even at a higher price!':'Pick a price. There is no wrong answer!')}</div>
 <div class="tk-prices">${cards}</div>
 <div class="tk-row c" style="margin-top:14px"><button class="btn green tk-next" ${PRICE==null?'disabled style="opacity:.5;animation:none"':''} onclick="Truck._priceGo()">🚚 Put them on my truck</button></div>`,'hub');}
function priceGo(){const p=me(),t=T(p);const ck=t.ck;if(!ck||PRICE==null)return;settle(p);const s=ck.sp&&spParse(ck.sp);
 const key=s?'s:'+ck.sp:ck.r;const close=old=>{const L=bLeft(old);if(L>0){old.h=(old.h||0)+L;t.bag[old.r]=(t.bag[old.r]||0)+L;}old.x=now();};
 const old=active(t).find(b=>(b.sp?'s:'+b.sp:b.r)===key);if(old)close(old);
 if(s){const sps=active(t).filter(b=>b.sp).sort((a,c)=>a.t-c.t);while(sps.length>=spSlots(t))close(sps.shift());}
 const nb={id:uid('b'),r:ck.r,q:ck.q,p:(s?s.each+SP_ADD[PRICE]:priceOf(ck.r,PRICE)),tr:PRICE,k:ck.k,t:now(),x:0};if(s)nb.sp=ck.sp;
 t.b.push(nb);delete t.ck;PRICE=null;sv();sfx('coin');
 VIEW=isOpen(t)?'hub':'open';if(isOpen(t))NOTE=`Your ${itemE(nb)} are on the counter!`;draw();}

/* ---------- open ---------- */
const SHIFTS=[{h:1,e:'🌤️',n:'1 hour'},{h:6,e:'🗺️',n:'6 hours'},{h:12,e:'🌙',n:'Overnight',s:'12 hours'}];
function drawOpen(p,t){if(isOpen(t)){VIEW='hub';return drawHub(p,t);}const left=stockLeft(t);
 if(!left){VIEW='hub';NOTE='Cook something first, then open the truck!';return drawHub(p,t);}
 const fast=active(t).filter(b=>bLeft(b)>0).map(b=>rateOf(b,now(),stars(t))).reduce((a,b)=>a+b,0);
 page('🚚 Open the truck',`<div class="tk-scene">${streetSVG(p)}</div>${rosa(`How long should the truck stay open?`,`Village pets visit while you're away. About ${fmtNum(Math.round(fast*2)/2)} an hour at your prices.`)}
 <div class="tk-shift" style="margin-top:12px">${SHIFTS.map((s,i)=>`<button onclick="Truck._openGo(${i})"><i>${s.e}</i><span>${s.n}<small>${s.s||`about ${Math.round(fast*s.h)} customers`}</small></span></button>`).join('')}</div>`,'hub');}
function openGo(i){const p=me(),t=T(p);settle(p);if(isOpen(t)||!stockLeft(t))return;const s=SHIFTS[i];const T0=now();t.sh={s:T0,e:T0+s.h*H,l:T0,n:0,c:0};sv();sfx('win');VIEW='hub';NOTE=`🟢 Open for ${s.n.toLowerCase()}! Customers are on their way.`;draw();}

/* ---------- receipt ---------- */
function receiptQ(p,t){const b=band(p);const bt=active(t).concat(t.b.filter(x=>x.x&&t.sh&&x.x>=t.sh.s)).find(x=>(x.vs||0)+sum(x.f||[],f=>f[2])>0);if(!bt)return null;const R=REC[bt.r];
 const fam=sum(bt.f||[],f=>f[2]),vs=bt.vs||0,sold=vs+fam,L=bLeft(bt),rev=sold*bt.p;
 if(b===0){if(fam)return {k:'rq',op:'add',ans:sold,text:`Village pets bought <b>${vs}</b> ${R.e}. Family bought <b>${fam}</b>. How many in all?`,pics:`<span class="tk-grp">${R.e.repeat(Math.min(vs,10))}</span><span class="tk-plus">+</span><span class="tk-grp">${R.e.repeat(Math.min(fam,10))}</span>`,eq:`${vs} + ${fam} =`,hint:`Count on from ${vs}: ${Array.from({length:fam},(_,i)=>vs+i+1).join(', ')}`,explain:`${vs} + ${fam} = ${sold}`};
  return {k:'rq',op:'sub',ans:L,text:`You made <b>${bt.q}</b> ${R.e}. You sold <b>${sold}</b>. How many are left?`,pics:`<span class="tk-grp">${R.e.repeat(Math.min(L,12))}${'⬜'.repeat(Math.min(sold,12))}</span>`,eq:`${bt.q} − ${sold} =`,hint:`Count the ${R.e} that are still in the picture!`,explain:`${bt.q} − ${sold} = ${L}`};}
 if(b===1)return {k:'rq',op:'mul',ans:rev,text:`You sold <b>${sold}</b> ${R.e} for <b>${C(bt.p)}</b> each. How much money came in?`,pics:`<span class="tk-grp">${R.e.repeat(Math.min(sold,10))}</span>`,eq:`${sold} × ${bt.p} =`,unit:'🪙',hint:`${bt.p} for each one: ${Array.from({length:Math.min(sold,8)},(_,i)=>bt.p*(i+1)).join(', ')}${sold>8?', …':''}`,explain:`${sold} × ${bt.p} = ${rev}`};
 const fin=(sold+L)*bt.p-bt.k;
 return {k:'rq',op:'mul',ans:fin,text:L?`If you sell the last <b>${L}</b> ${R.e} for ${C(bt.p)} each, what's your <b>total profit</b>?`:`All sold! What was your <b>profit</b> on this batch?`,pics:`<span class="tk-grp">${bt.q} × ${C(bt.p)}</span><span class="tk-plus">−</span><span class="tk-grp">🥣 ${C(bt.k)}</span>`,eq:'Profit =',unit:'🪙',
  hint:`Money in if all ${bt.q} sell: ${bt.q} × ${bt.p} = ${bt.q*bt.p}. Then take away what the ingredients cost (${bt.k}).`,explain:`${bt.q} × ${bt.p} − ${bt.k} = ${fin} 🪙`};}
function drawReceipt(p,t){const news=runSync(p);newsModal(news);
 const bs=active(t).concat(t.b.filter(x=>x.x&&t.sh&&x.x>=t.sh.s&&x.q-bLeft(x)-(x.h||0)>0));
 if(t.sh&&!isOpen(t)&&!t.sh.r){t.sh.r=1;sv();}
 const body=bs.length?bs.map(b=>{const R=REC[b.r],IE=itemE(b),IN=itemN(b);const fam=(b.f||[]);const famN=sum(fam,f=>f[2]),famC=sum(fam,f=>f[2]*f[3]);const vc=b.vc||0,rev=vc+famC,pf=rev-b.k,L=bLeft(b);
  const names=[...new Set(fam.map(f=>(byId(f[1])||{}).name||'?'))];
  return `<div class="tk-receipt" style="margin-bottom:12px"><h4>${IE} ${E(IN)} · made ${b.q}${b.x?' <span class="tk-pill">done</span>':''}</h4>
   <div class="tk-line"><span>🏘️ Village ${b.vs||0} × ${C(b.p)}</span><span>${C(vc)}</span></div>
   <div class="tk-line"><span>👪 Family ${famN} × ${C(b.p)}${names.length?` <small class="tk-muted">(${names.map(E).join(', ')})</small>`:''}</span><span>${C(famC)}</span></div>
   ${b.g?`<div class="tk-line"><span>🧺 Given to the picnic: ${b.g}</span><span>—</span></div>`:''}${b.h?`<div class="tk-line"><span>🎒 Taken home: ${b.h}</span><span>—</span></div>`:''}
   <div class="tk-money"><div class="in"><small>💰 Money taken in</small><b>${C(rev)}</b></div><div class="pr ${pf<0?'neg':''}"><small>⭐ Profit so far</small><b>${pf<0?'−'+C(-pf):C(pf)}</b></div></div>
   <div class="tk-line"><span>🥣 Ingredients for ${b.q} ${R.many}</span><span>−${C(b.k)}</span></div>
   <div class="tk-line"><span>📦 Still for sale</span><span>${L} ${R.e}${L?` · worth ${C(L*b.p)}`:''}</span></div>
   ${b.ve||names.length?`<div class="tk-line" style="font-size:20px"><span>Bought by: ${Array.from(b.ve||'').join(' ')}${names.length?` and ${names.map(E).join(', ')}`:''}</span></div>`:''}
   ${!b.x&&L>0&&!isOpen(t)?`<div class="tk-row" style="margin-top:6px"><button class="btn ghost dark small" onclick="Truck._takeHome('${b.id}')">🎒 Take the ${L} left home</button></div>`:''}
   ${!b.x&&L===0?`<div class="tk-row" style="margin-top:6px"><span class="tk-pill gold">🎉 Sold out!</span><button class="btn ghost dark small" onclick="Truck._clearB('${b.id}')">Clear the counter</button></div>`:''}</div>`;}).join('')
  :`<div class="tk-card"><p style="margin:0">No sales yet. Cook something and open the truck!</p></div>`;
 const sh=t.sh;const shLine=sh?`<div class="tk-card"><div class="tk-row" style="justify-content:space-between"><b>${isOpen(t)?'🟢 This shift so far':'🏁 Last shift'}</b><span class="tk-pill gold">🏘️ ${sh.n||0} customers · +${C(sh.c||0)}</span></div>
  ${sh.tn?`<p class="tk-muted" style="margin:6px 0 0">🏘️ Village pets spent ${CAPS[stars(t)]} 🪙 today — that's the most. More come tomorrow!</p>`:''}
  <p class="tk-muted" style="margin:6px 0 0"><b>Money taken in</b> is every coin customers paid. <b>Profit</b> is what's left after paying for the ingredients.</p></div>`:'';
 let qh='';const q=sh&&!sh.q?receiptQ(p,t):null;
 if(q){if(!MQ||MQ.o.onDone!=='receipt')startMath(q,{onDone:'receipt'});qh=`<div class="tk-card"><h3>🧠 Quick check <span class="tk-pill gold">+1 🪙</span></h3><div id="tkMath">${mathHTML()}</div></div>`;}
 const nx=nextStep(p,t);
 page(`🧾 Receipt`,`<div class="tk-2"><div>${shLine}${body}</div><div>${qh}<button class="btn green tk-next" onclick="${nx.v==='market'?`Truck.market('truck')`:nx.v==='receipt'?`Truck._view('hub')`:`Truck._view('${nx.v}')`}">${nx.v==='receipt'?'🚚 Back to my truck':nx.l}</button></div></div>`,'hub');}
function takeHome(id){const p=me(),t=T(p);settle(p);const b=t.b.find(x=>x.id===id);if(!b)return;const L=bLeft(b);if(L<=0||isOpen(t))return;b.h=(b.h||0)+L;t.bag[b.r]=(t.bag[b.r]||0)+L;b.x=now();sv();sfx('coin');say(`${L} ${REC[b.r].e} went into your Treat Bag!`);draw();}
function clearB(id){const p=me(),t=T(p);const b=t.b.find(x=>x.id===id);if(b&&bLeft(b)===0){b.x=now();sv();}draw();}

/* ---------- market square ---------- */
function drawMarket(){const p=me();if(!p)return;css();if(!enabled(p)){VIEW='lock';return drawLock(p);}const t=T(p);const news=runSync(p);newsModal(news);
 const pic=picnic();const tot=picTotals(pic.id);const canBuy=Math.max(0,BUY_DAY-boughtToday(t));
 const cards=players().map(pl=>{const st=R0(pl);const mine=pl.id===p.id;
  if(!st&&mine)return '';
  if(!st)return `<div class="tk-mcard" style="--tc:#dee2e6"><div class="tk-mhead"><span style="font-size:44px">🅿️</span><div><b>${E(pl.name)}</b><small>${mine?'Your spot is waiting!':'No truck yet'}</small></div></div>${mine?`<button class="btn green" style="width:100%;margin-top:8px" onclick="Truck._view('hub')">🚚 Get my truck</button>`:''}</div>`;
  const open=isOpen(st);const bs=active(st);
  const menu=bs.length?bs.map(b=>{const L=mine?bLeft(b):viewLeft(pl.id,b);
   return `<div class="tk-mi"><span class="e">${b.sp?`<span class="tk-combo sm">${itemE(b)}</span>`:REC[b.r].e}</span><div class="grow">${E(itemN(b))}${matches(b,now())?' <span class="tk-crv">🐾</span>':''}<small>${L?`${L} left`:'Sold out'} · ${C(b.p)}</small></div>${mine?'':`<button class="btn ${L&&canBuy&&(p.coins||0)>=b.p?'green':'ghost dark'} small" ${L?'':'disabled'} onclick="Truck._buyAsk('${pl.id}','${b.id}')">Buy</button>`}</div>`;}).join(''):`<p class="tk-muted" style="margin:6px 0 0">Nothing for sale right now.</p>`;
  return `<div class="tk-mcard ${mine?'mine':''}" style="--tc:${PAINT[st.c|0]}"><div class="tk-mhead">${truckSVG(st,{open,items:itemsOf(st),nolabel:true})}<div><b>${E(tname(st))}</b><small>${mine?'Your truck':E(pl.name)+"'s truck"} · ${open?'🟢 open':'⚪ closed'}</small><span class="tk-stars sm">${starStr(stars(st))}</span></div></div><div class="tk-menu">${menu}</div>${mine?`<button class="btn ghost dark small" style="width:100%;margin-top:8px" onclick="Truck._view('hub')">Go to my truck</button>`:''}</div>`;}).join('');
 app.innerHTML=((typeof topbar==='function')?topbar():'')+`<div class="page tk"><div class="zhead"><button class="btn ghost small backbtn" onclick="Truck._mback()">← ${MRET==='truck'?'My truck':backName(RET&&SCREENS[RET]&&RET!=='market'&&RET!=='truck'?RET:'world')}</button><h2 class="title">🏙️ Market Square</h2></div>
 <div class="tk-scene">${squareSVG(p.id)}</div>
 ${cravHTML()}
 <div class="tk-row" style="justify-content:space-between;margin:-2px 0 12px"><span class="tk-pill gold">🛍️ You can buy ${canBuy} more treat${canBuy===1?'':'s'} today</span>${pic.active?`<button class="btn gold small" onclick="Truck._view('picnic')">🧺 Pet Picnic ${Math.min(tot.s,PIC_GOAL.s)+Math.min(tot.d,PIC_GOAL.d)}/${PIC_GOAL.s+PIC_GOAL.d}</button>`:`<span class="tk-pill">🧺 Next Pet Picnic in ${pic.daysTo} day${pic.daysTo===1?'':'s'}</span>`}</div>
 ${!R0(p)?`<div class="tk-card">${rosa(`${E(p.name)}, your parking spot is empty! Want a truck?`)}<button class="btn green tk-next" style="margin-top:10px" onclick="Truck._view('hub')">🚚 Get my own truck!</button></div>`:''}
 <div class="tk-mk">${cards}</div></div>`;}
function visit(id){const el=document.querySelector(`.tk-mcard:nth-child(${players().findIndex(x=>x.id===id)+1})`);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.transition='transform .3s';el.style.transform='scale(1.03)';setTimeout(()=>el.style.transform='',400);}sfx('tap');}
function buyAsk(sid,bid){const p=me(),t=T(p);const s=byId(sid),st=R0(s);const b=st&&(st.b||[]).find(x=>x.id===bid);if(!b)return;const R={e:itemE(b),n:E(itemN(b))};
 const L=viewLeft(sid,b),room=BUY_DAY-boughtToday(t),aff=Math.floor((p.coins||0)/b.p);const mx=Math.min(3,L,room,aff);
 if(room<=0){modal(`<div class="mcard"><div class="big-emoji">🛍️</div><h2>That's 10 today!</h2><p>You can buy ${BUY_DAY} treats a day from family trucks. More tomorrow!</p><div class="row"><button class="btn green big" onclick="closeModal()">OK</button></div></div>`);return;}
 if(aff<=0){modal(`<div class="mcard"><div class="big-emoji">🪙</div><h2>Not enough coins</h2><p>${R.e} costs ${C(b.p)}. Win battles to earn more!</p><div class="row"><button class="btn green big" onclick="closeModal()">OK</button></div></div>`);return;}
 if(L<=0){say('Sold out!');return;}
 modal(`<div class="mcard"><div class="big-emoji">${R.e}</div><h2>${R.n}</h2><p>from <b>${E(s.name)}</b>'s truck · ${C(b.p)} each</p>
 <div class="tk-nb" style="margin:10px 0">${[1,2,3].map(n=>`<button ${n>mx?'disabled':''} onclick="Truck._buyGo('${sid}','${bid}',${n})">Buy ${n}<small>${C(n*b.p)}</small></button>`).join('')}</div>
 <p class="tk-muted">You have ${C(p.coins||0)} · ${room} more today</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Not now</button></div></div>`);}
function buyGo(sid,bid,n){const p=me();const r=buy(p,sid,bid,n);closeModal();const s=byId(sid);
 if(r==='ok'){sfx('coin');const b=(s.truck.b||[]).find(x=>x.id===bid);say(`${n} ${itemE(b)} from ${s.name}! It's in your 🎒 Treat Bag.`);}
 else say({soldout:'Sold out!',limit:"That's 10 today!",coins:'Not enough coins',gone:'That truck changed its menu.'}[r]||'Hmm, try again');
 const y=window.scrollY;drawMarket();window.scrollTo(0,y);}

/* ---------- treat bag + feeding ---------- */
function drawBag(p,t){const pet=(typeof petOf==='function')?petOf(p):null;const pic=picnic();
 const cards=RIDS.map(r=>{const n=t.bag[r]||0;const fx=TREAT_FX[r];return `<div class="tk-ing"><span class="e">${REC[r].e}</span><b>${REC[r].n}</b><small>${n} in your bag · ${fx.food?'🍗 food':''}${fx.joy?' 💖 fun':''}</small>
  <button class="btn ${n&&pet?'green':'ghost dark'} small" ${n&&pet?'':'disabled'} onclick="Truck._feed('${r}')">${pet?`Feed ${E(pet.name)}`:'Feed a pet'}</button></div>`;}).join('');
 const pcs=(t.pcs||[]);
 page('🎒 Treat Bag',`<div class="tk-2"><div class="tk-card"><div class="tk-petstage ${FEED?'happy':''}" id="tkPet">${pet?pet.e:'🥚'}${FEED?`<div class="tk-hearts">💖 😋 💖</div>`:''}</div>
 ${rosa(pet?(FEED?`${E(pet.name)} loved the ${FEED}!`:`${E(pet.name)} is sniffing your bag…`):'Hatch a pet to feed it treats!',pet?'Treats give food, fun and a little pet XP.':null,pet?pet.e:'🥚')}</div>
 <div><div class="tk-bagg">${cards}</div>
 <div class="tk-row" style="margin-top:12px">${pic.active?`<button class="btn gold" onclick="Truck._view('picnic')">🧺 Give to the Pet Picnic</button>`:''}<button class="btn ghost" onclick="Truck.market('truck')">🏙️ Buy from family</button></div>
 ${pcs.length?`<div class="tk-card" style="margin-top:14px"><h3>📮 Picnic postcards</h3><div class="tk-row">${pcs.map(id=>`<div class="tk-post">${postcardArt()}Pet Picnic · ${E(picDate(id))}</div>`).join('')}</div></div>`:''}</div></div>`,'hub');FEED=null;}
function feed(r){const p=me(),t=T(p);if(!(t.bag[r]>0))return;const pet=(typeof petOf==='function')?petOf(p):null;if(!pet)return;const fx=TREAT_FX[r];
 try{if(typeof petData==='function'&&typeof petMood==='function'){const MX=(typeof MOOD_MAX!=='undefined')?MOOD_MAX:5;const pd=petMood(petData(p,pet.id));
  if((fx.food&&pd.food>=MX)||(!fx.food&&pd.joy>=MX)){say(`${pet.e} ${pet.name} is too full! Maybe later.`);return;}
  pd.food=Math.min(MX,(pd.food||0)+fx.food);pd.joy=Math.min(MX,(pd.joy||0)+fx.joy);if(typeof petGain==='function')petGain(p,pet,fx.xp);}}catch(e){}
 t.bag[r]--;if(!t.bag[r])delete t.bag[r];sv();sfx('coin');FEED=REC[r].n;say(`${pet.e} ${pet.name} loved the ${REC[r].one}! +${fx.xp} pet XP`);drawBag(p,t);}
function picDate(id){const w=parseInt(String(id).slice(2),10);if(!w)return '';try{return new Date((w*7-3+5)*DAY).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});}catch(e){return '';}}
function postcardArt(){return `<svg viewBox="0 0 160 90"><rect width="160" height="90" fill="#a5e3ff"/><rect y="55" width="160" height="35" fill="#8ce99a"/><path d="M20 88 L40 60 H120 L140 88Z" fill="#ff8787"/><text x="80" y="62" font-size="22" text-anchor="middle">🧺</text><text x="30" y="52" font-size="18">🐶</text><text x="112" y="52" font-size="18">🐱</text><text x="70" y="30" font-size="16">🎉</text></svg>`;}

/* ---------- Chef's Specials builder (no typing: pick base, topping, flavor, name word) ---------- */
function drawSpecial(p,t){if(SPB)return drawSpEdit(p,t);const n=spSlots(t);const sp=t.sp||[];
 const cards=[0,1].map(i=>{if(i>=n)return `<div class="tk-card tk-spc lock"><div class="big-emoji">🔒</div><b>2nd special slot</b><p class="tk-muted" style="margin:4px 0 0">Earn all 3 Chef Stars ⭐⭐⭐ to unlock it.</p></div>`;
  const s=spParse(sp[i]);if(!s)return `<div class="tk-card tk-spc"><div class="big-emoji">✨</div><b>Empty slot</b><p class="tk-muted" style="margin:4px 0 8px">Invent your own treat!</p><button class="btn green" onclick="Truck._spNew(${i})">➕ Invent a special</button></div>`;
  const known=t.bk[s.def+'.c']||t.bk[s.def+'.g'];
  return `<div class="tk-card tk-spc"><div class="tk-combo big">${s.e}</div><b class="nm">${E(s.name)}</b><div class="tk-badges">${s.rare?'<span class="h">🌟 Rare</span>':''}${s.flavs.map(f=>`<span class="${cravings(now()).includes(f)?'a':'n'}">${FLAV[f].e} ${FLAV[f].n}${cravings(now()).includes(f)?' 🐾':''}</span>`).join('')}</div>
   <p class="tk-muted" style="margin:6px 0">${known?`Costs ${C(s.each)} each to make`:'Cost each: work it out when you cook!'}</p>
   <div class="tk-row c" style="margin-top:4px"><button class="btn green small" onclick="Truck._cookSp(${i})">👩‍🍳 Cook it</button><button class="btn ghost dark small" onclick="Truck._spEdit(${i})">✏️ Change</button></div></div>`;}).join('');
 page("✨ Chef's Specials",`${rosa('Mix a base, a topping and a flavor. Every new combo is a new money puzzle!','Specials sell for more. Match the craving to sell them fast.')}${cravHTML()}<div class="tk-spgrid">${cards}</div>`,'hub');}
function drawSpEdit(p,t){const e=SPB;const def=`${e.a}.${e.b}.${e.t}.${e.f}`;const s=spParse(def);const cr=cravings(now());const rr=t.rr||{};
 const opt=(k,v,on,html)=>`<button class="tk-opt ${on?'on':''}" onclick="Truck._spSet('${k}','${v}')">${html}</button>`;
 const tops=Object.keys(TOP).map(k=>opt('t',k,e.t===k,`<i>${TOP[k].e}</i>${TOP[k].n}<small>+${TOP[k].c} 🪙 a treat</small>`)).join('')+
  Object.keys(RARE).filter(k=>rr[k]>0||e.t===k).map(k=>opt('t',k,e.t===k,`<i>${RARE[k].e}</i>${RARE[k].n}<small>🌟 rare · you have ${rr[k]||0}</small>`)).join('');
 page("✨ Invent a special",`<div class="tk-2"><div><div class="tk-card tk-sppre"><div class="tk-combo big">${s?s.e:'?'}</div><div class="tk-name">${s?E(s.name):''}</div>
  <div class="tk-badges">${s&&s.rare?'<span class="h">🌟 Rare: one rare ingredient makes one batch, sells fast at any price</span>':''}${s&&s.flavs.some(f=>cr.includes(f))?'<span class="a">🐾 Matches today\'s craving!</span>':''}</div>
  <p class="tk-muted" style="margin:8px 0 0">Makes ${REC[e.b].makes} · extras cost ${s?`${s.xc} 🪙 a treat`:'?'}</p>
  <button class="btn green tk-next" style="margin-top:12px" onclick="Truck._spSave()">✅ Save my special</button></div>${cravHTML()}</div>
 <div><div class="tk-card"><h3>1. Base</h3><div class="tk-opts">${RIDS.map(r=>opt('b',r,e.b===r,`<i>${REC[r].e}</i>${BASEW[r]}<small>${FLAV[BASEF[r]].n}</small>`)).join('')}</div></div>
 <div class="tk-card"><h3>2. Topping</h3><div class="tk-opts">${tops}</div>${Object.keys(rr).length?'':'<p class="tk-muted" style="margin:6px 0 0">🌟 Rare toppings come home from Adventure Camp trips.</p>'}</div>
 <div class="tk-card"><h3>3. Flavor</h3><div class="tk-opts">${FIDS.map(f=>opt('f',f,e.f===f,`<i>${FLAV[f].e}</i>${FLAV[f].w==='Zing'?'Spicy':FLAV[f].w==='Crunch'?'Crunchy':FLAV[f].w==='Fizz'?'Fizzy':FLAV[f].w}${cr.includes(f)?' 🐾':''}<small>+${FLAV[f].c} 🪙 a treat</small>`)).join('')}</div></div>
 <div class="tk-card"><h3>4. Fancy word</h3><div class="tk-words">${ADJ.map((w,i)=>`<button class="tk-word ${+e.a===i?'on':''}" onclick="Truck._spSet('a','${i}')">${w}</button>`).join('')}</div></div></div></div>`,'hub');}
function spNew(i){const t=T(me());VIEW='special';SPB={slot:i,a:Math.floor(Math.random()*ADJ.length),b:RIDS.find(r=>canMake(t,r)>0)||'muf',t:'hon',f:cravings(now())[0]};sfx('tap');draw();}
function spEdit(i){const t=T(me());const s=spParse((t.sp||[])[i]);if(!s)return spNew(i);VIEW='special';SPB={slot:i,a:s.a,b:s.b,t:s.tp,f:s.f};sfx('tap');draw();}
function spSet(k,v){if(!SPB)return;SPB[k]=v;sfx('tap');const y=window.scrollY;draw();window.scrollTo(0,y);}
function spSave(){const p=me(),t=T(p);const e=SPB;if(!e)return;const def=`${e.a}.${e.b}.${e.t}.${e.f}`;if(!spParse(def))return;t.sp=t.sp||[];const old=t.sp[e.slot];
 if(old&&old!==def)Object.keys(t.bk).forEach(k=>{if(k.startsWith(old+'.'))delete t.bk[k];});
 t.sp[e.slot]=def;t.sp=t.sp.slice(0,2);SPB=null;sv();sfx('correct');NOTE=null;say(`✨ ${spParse(def).name} is on your menu!`);draw();}
function cookSp(i){VIEW='cook';COOK={r:'s'+i,nb:1,stage:'pick',steps:[],si:0};MQ=null;sfx('tap');window.scrollTo(0,0);draw();}
/* ---------- decorations ---------- */
function drawDeco(p,t){const dc=t.dc||'';
 page('🎨 Decorate your truck',`<div class="tk-2"><div><div class="tk-card"><div class="tk-trkwrap">${truckSVG(t,{open:true,items:itemsOf(t).length?itemsOf(t):['🦴','🧁','🍧']})}</div><div class="tk-name">${E(tname(t))}</div>
  <div class="tk-row c"><button class="btn ghost dark small" onclick="Truck._paint()">🎨 Paint, name &amp; mascot</button></div></div>
  ${rosa('Decorations are just for fun. Everyone sees them in the Market Square!',null,'🦉')}</div>
 <div><div class="tk-deco">${DECO.map(d=>{const own=dc.includes(d.id);return `<div class="tk-ing"><span class="e">${d.e}</span><b>${d.n}</b>${own?'<span class="tk-pill open">✔ On your truck</span>':`<button class="btn ${(p.coins||0)>=d.c?'gold':'ghost dark'} small" ${(p.coins||0)>=d.c?'':'disabled'} onclick="Truck._decoAsk('${d.id}')">${C(d.c)}</button>`}</div>`;}).join('')}</div></div></div>`,'hub');}
function decoAsk(id){const p=me();const d=DECO.find(x=>x.id===id);if(!d||(p.coins||0)<d.c)return;
 modal(`<div class="mcard"><div class="big-emoji">${d.e}</div><h2>${d.n}</h2><p>Buy it for <b>${C(d.c)}</b>? You have ${C(p.coins||0)}.</p><div class="row"><button class="btn gold big" onclick="Truck._decoYes('${id}')">Buy it!</button><button class="btn ghost dark" onclick="closeModal()">Not now</button></div></div>`);}
function decoYes(id){closeModal();const p=me(),t=T(p);const d=DECO.find(x=>x.id===id);if(!d||(t.dc||'').includes(id)||(p.coins||0)<d.c)return;p.coins-=d.c;t.dc=(t.dc||'')+id;sv();sfx('win');say(`${d.e} ${d.n} added to your truck!`);draw();}
/* ---------- rare ingredients from Adventure Camp (called by adv.js when a trip is welcomed home) ---------- */
function campFind(p,len,force){try{if(!p||!enabled(p))return null;const ch={short:.1,mid:.35,night:.7}[len]||0;if(!force&&Math.random()>=ch)return null;const t=T(p);t.rr=t.rr||{};
 const ids=Object.keys(RARE);const id=ids[Math.floor(Math.random()*ids.length)];t.rr[id]=Math.min(9,(t.rr[id]||0)+1);return {k:'truck',id,e:RARE[id].e,n:`${RARE[id].n} (for your food truck!)`,rare:1};}catch(e){return null;}}

/* ---------- recipe book ---------- */
function drawBook(p,t){const b=band(p);
 const label={g:'Adding groups',s:'Scaling ×',c:'Cost each',f:'Fractions',p:'Scaling to any size'};
 const cards=RIDS.map(r=>{const R=REC[r];const keys=Object.keys(t.bk).filter(k=>k.startsWith(r+'.'));const known=t.bk[r+'.c'];
  return `<div class="tk-rec" style="cursor:default"><span class="e">${R.e}</span><div><b>${R.n}</b><div class="tk-muted">Makes ${R.makes}</div><div class="tk-need">${Object.keys(R.need).map(k=>`<span>${ING[k].e} ${R.need[k]}</span>`).join('')}${b>=2?`<span>${R.x.e} ${fmtNum(R.x.a/R.x.b)} cup</span>`:''}</div>
  <div class="tk-muted" style="margin-top:4px">Cost: ${C(cost1(r))} a batch · ${known?`<b>${C(each(r))} each</b>`:'? each'}</div>
  <div class="tk-badges">${keys.length?keys.map(k=>{const s=k.split('.')[1];return `<span class="${t.bk[k]}">${t.bk[k]==='a'?'⭐':'🤝'} ${label[s[0]]||s}${s.length>1&&/\d/.test(s[1])?' '+s.slice(1):''}</span>`;}).join(''):'<span class="n">Not cooked yet</span>'}</div></div></div>`;}).join('');
 const SL={g:'Adding parts',c:'Cost each',f:'Fractions',m:'Markup %'};
 const sps=(t.sp||[]).map(spParse).filter(Boolean).map(sp=>{const keys=Object.keys(t.bk).filter(k=>k.startsWith(sp.def+'.'));
  return `<div class="tk-rec" style="cursor:default"><span class="e"><span class="tk-combo">${sp.e}</span></span><div><b>${E(sp.name)}</b><div class="tk-muted">Makes ${REC[sp.b].makes} · ${keys.some(k=>/\.(c|g)$/.test(k))?`<b>${C(sp.each)} each</b>`:'? each'}</div>
  <div class="tk-badges">${keys.length?keys.map(k=>{const x=k.split('.').pop();return `<span class="${t.bk[k]}">${t.bk[k]==='a'?'⭐':'🤝'} ${SL[x[0]]||x}</span>`;}).join(''):'<span class="n">Not cooked yet</span>'}</div></div></div>`;}).join('');
 page('📖 Recipe Book',`${rosa('Every recipe you work out is saved here.','⭐ = solved it yourself · 🤝 = solved it with help')}<div class="tk-book" style="margin-top:12px">${cards}</div>
 ${sps?`<h2 class="title" style="font-size:22px;margin:16px 0 8px">✨ My Chef's Specials</h2><div class="tk-book">${sps}</div>`:''}
 <div class="tk-card" style="margin-top:14px"><b>⭐ ${t.ms.a}</b> solved alone · <b>🤝 ${t.ms.h}</b> with help</div>`,'hub');}

/* ---------- pet picnic ---------- */
function picnicQ(p,t,tot){const b=band(p);const ns=Math.max(0,PIC_GOAL.s-tot.s),nd=Math.max(0,PIC_GOAL.d-tot.d);
 if(b===0){if(!nd)return null;return {k:'pq',op:'sub',ans:nd,text:`How many more 🍧 does the picnic need?`,pics:`<span class="tk-grp" style="letter-spacing:0">${'🍧'.repeat(Math.min(tot.d,PIC_GOAL.d))}${'⚪'.repeat(nd)}</span>`,eq:'',hint:'Count the empty ⚪ spots!',explain:`${PIC_GOAL.d} − ${Math.min(tot.d,PIC_GOAL.d)} = ${nd}`};}
 if(!ns)return null;
 if(b===1)return {k:'pq',op:'div',ans:Math.ceil(ns/4),text:`The picnic needs <b>${ns} more snacks</b>. One batch of 🦴 makes <b>4</b>. How many batches?`,pics:`<span class="tk-grp">🦴🦴🦴🦴</span><span class="tk-plus">→</span><span class="tk-grp">${ns} 🧺</span>`,eq:'Batches =',hint:`4, 8, 12, 16, 20, 24… how many 4s to reach ${ns}?`,explain:`${ns} ÷ 4 → ${Math.ceil(ns/4)} batch${Math.ceil(ns/4)>1?'es':''}${ns%4?' (one extra left over)':''}.`};
 return {k:'pq',op:'sub',ans:ns,text:`Snacks: <b>${tot.s} of ${PIC_GOAL.s}</b>. How many more are needed?`,pics:'',eq:`${PIC_GOAL.s} − ${tot.s} =`,hint:`Count up from ${tot.s} to ${PIC_GOAL.s}.`,explain:`${PIC_GOAL.s} − ${tot.s} = ${ns}`};}
function drawPicnic(p,t){const pic=picnic();if(!pic.active){page('🧺 Pet Picnic',`<div class="tk-card tk-lock"><div class="big-emoji">🧺</div><h3>Next Pet Picnic in ${pic.daysTo} day${pic.daysTo===1?'':'s'}</h3><p class="tk-muted">Every other weekend the whole family fills one big picnic order together.</p></div>`,'hub');return;}
 settle(p);const tot=picTotals(pic.id);if(picDone(tot)&&!(t.pc&&t.pc.id===pic.id&&t.pc.cel)){VIEW='party';return drawParty(p,t);}
 const pc=myPc(t,pic.id);const ns=Math.max(0,PIC_GOAL.s-tot.s),nd=Math.max(0,PIC_GOAL.d-tot.d);
 const have=r=>({truck:sum(active(t).filter(b=>b.r===r&&!isOpen(t)),bLeft),bag:t.bag[r]||0});
 const give=RIDS.map(r=>{const h=have(r);const need=REC[r].kind==='s'?ns:nd;const tot2=h.truck+h.bag;const mx=Math.min(tot2,need);
  return `<div class="tk-mi"><span class="e">${REC[r].e}</span><div class="grow">${REC[r].n}<small>${h.bag} in bag${h.truck?` · ${h.truck} on truck`:''}${isOpen(t)&&sum(active(t).filter(b=>b.r===r),bLeft)?' · close truck to use stock':''}</small></div>
   <button class="btn ${mx?'green':'ghost dark'} small" ${mx?'':'disabled'} onclick="Truck._give('${r}',1)">Give 1</button>${mx>1?`<button class="btn gold small" onclick="Truck._give('${r}',${mx})">Give ${mx}</button>`:''}</div>`;}).join('');
 let qh='';const q=!pc.q?picnicQ(p,t,tot):null;if(q){if(!MQ||MQ.o.onDone!=='picnic')startMath(q,{onDone:'picnic'});qh=`<div class="tk-card"><h3>🧠 Picnic planner <span class="tk-pill gold">+1 🪙</span></h3><div id="tkMath">${mathHTML()}</div></div>`;}
 page('🧺 Pet Picnic',`<div class="tk-2"><div><div class="tk-card"><h3>🧺 Village order · ends Sunday</h3>
  <div style="margin:8px 0 4px;font-weight:700">🦴🧁 Snacks</div><div class="tk-bar"><i style="width:${Math.min(100,tot.s/PIC_GOAL.s*100)}%"></i><span>${Math.min(tot.s,PIC_GOAL.s)} / ${PIC_GOAL.s}</span></div>
  <div style="margin:10px 0 4px;font-weight:700">🍧 Cool pops</div><div class="tk-bar d"><i style="width:${Math.min(100,tot.d/PIC_GOAL.d*100)}%"></i><span>${Math.min(tot.d,PIC_GOAL.d)} / ${PIC_GOAL.d}</span></div>
  <div class="tk-row" style="margin-top:10px">${tot.who.length?tot.who.map(w=>`<span class="tk-chip">${E(w.n)} gave ${[w.s?`${w.s} snacks`:'',w.d?`${w.d} pops`:''].filter(Boolean).join(' + ')}</span>`).join(''):'<span class="tk-muted">Nobody has given yet. Be the first!</span>'}</div></div>
  <div class="tk-card"><h3>Give treats · +${PIC_PAY} 🪙 each</h3><div class="tk-menu">${give}</div>
  ${!sum(RIDS,r=>have(r).bag+have(r).truck)?`<p class="tk-muted">Cook treats or buy some from family, then come back!</p>`:''}</div></div>
  <div>${qh}${rosa('When the order is full, the whole family gets a party and a postcard!',null,'🧺')}</div></div>`,'hub');}
function giveP(r,n){const p=me(),t=T(p);const pic=picnic();if(!pic.active)return;settle(p);const tot=picTotals(pic.id);const pc=myPc(t,pic.id);
 const kind=REC[r].kind;const need=kind==='s'?PIC_GOAL.s-tot.s:PIC_GOAL.d-tot.d;n=Math.min(n,Math.max(0,need));let g=0;
 while(g<n&&(t.bag[r]||0)>0){t.bag[r]--;g++;}if(!t.bag[r])delete t.bag[r];
 if(!isOpen(t))active(t).filter(b=>b.r===r).forEach(b=>{while(g<n&&bLeft(b)>0){b.g=(b.g||0)+1;g++;}});
 if(!g)return;pc[kind]=(pc[kind]||0)+g;p.coins=(p.coins||0)+g*PIC_PAY;sv();sfx('coin');say(`Thank you! +${C(g*PIC_PAY)} for ${g} ${REC[r].e}`);draw();}
function drawParty(p,t){const pic=picnic();const pc=myPc(t,pic.id);
 page('🎉 Pet Picnic party!',`<div class="tk-scene">${partySVG()}</div><div class="tk-card" style="text-align:center">${rosa('You did it together! Every pet in the village had a picnic.',null,'🥳')}
 <div style="margin:12px 0"><div class="tk-post" style="width:220px">${postcardArt()}📮 Pet Picnic · ${E(picDate(pic.id))}</div></div>
 <button class="btn green tk-next" onclick="Truck._partyDone()">📮 Keep my postcard</button></div>`,'hub');sfx('win');}
function partyDone(){const p=me(),t=T(p);const pic=picnic();const pc=myPc(t,pic.id);pc.cel=1;t.pcs=t.pcs||[];if(!t.pcs.includes(pic.id))t.pcs.push(pic.id);t.pcs=t.pcs.slice(-20);sv();VIEW='hub';NOTE='📮 Postcard saved in your Treat Bag!';draw();}

/* ---------- Quest Board card ---------- */
function cardHTML(p){p=p||me();if(!p||!flag())return '';css();const n=p.battles||0;
 if(n<UNLOCK)return `<button class="hcard tk-hc" onclick="Truck.open()"><span class="pav"><span class="pe">🚚</span></span><div><b>Food Truck</b><small>🔒 Win ${UNLOCK-n} more battle${UNLOCK-n===1?'':'s'}</small></div></button>`;
 const t=p.truck||{};let line='🍳 Cook, sell and feed pets',glow=false;
 if(!t.i){line='✨ Ms. Rosa has a surprise for you!';glow=true;}
 else if(t.ck){line='🏷️ Pick a price!';glow=true;}
 else if(shiftDone(t)){line='🧾 Your receipt is ready!';glow=true;}
 else if(isOpen(t))line=`🟢 Open · ${left2(t.sh.e-now())} left`;
 else if(stockLeft(t)){line='🚚 Ready to open!';glow=true;}
 const pic=picnic();if(t.i&&pic.active&&!glow)line='🧺 Pet Picnic this weekend!';
 return `<button class="hcard tk-hc ${glow?'glow':''}" onclick="Truck.open()"><span class="pav"><span class="pe">🚚</span></span><div><b>${t.n?E(tname(t)):'Food Truck'}${stars(t)?' '+'⭐'.repeat(stars(t)):''}</b><small>${line}</small></div></button>`;}

/* ---------- navigation + public API ---------- */
function curS(){try{return typeof curScreen!=='undefined'?curScreen:null;}catch(e){return null;}}
function open(from){const c=from||curS();if(c&&c!=='truck'&&c!=='market')RET=c;VIEW='hub';MQ=null;COOK=null;try{sfx('tap');go('truck');}catch(e){}}
function market(from){const c=from||curS();MRET=c==='truck'||from==='truck'?'truck':null;if(!MRET&&c&&c!=='market')RET=c;MQ=null;go('market');}
function view(v){const p=me();if(v==='market'){market('truck');return;}if(v==='cook'){COOK=null;const t=T(p);if(t.ck)v='price';}
 if(v!=='shop'||VIEW!=='shop')MQ=null;VIEW=v;sfx('tap');if(typeof curScreen!=='undefined'&&curScreen!=='truck'){go('truck');return;}window.scrollTo(0,0);draw();}
function back(to){MQ=null;sfx('tap');if(VIEW==='special'&&SPB){SPB=null;draw();return;}if(to==='hub'&&VIEW!=='hub'){if(VIEW==='cook'&&COOK&&COOK.stage==='math'){COOK=null;}VIEW='hub';SETUP=null;draw();window.scrollTo(0,0);return;}
 const r=RET&&typeof SCREENS!=='undefined'&&SCREENS[RET]&&RET!=='truck'?RET:'world';VIEW='hub';try{go(r);}catch(e){}}
function mback(){MQ=null;sfx('tap');if(MRET==='truck'){VIEW='hub';go('truck');}else{const r=RET&&SCREENS[RET]&&RET!=='market'&&RET!=='truck'?RET:'world';go(r);}}

window.Truck={open,market,enabled,cardHTML:p=>{try{return cardHTML(p);}catch(e){return '';}},flag,campFind,
 hooks:{critic:null}, /* later: weekend food-critic visit, called as hooks.critic(p,p.truck) when the truck screen opens on Sat/Sun */
 _spNew:spNew,_spEdit:spEdit,_spSet:spSet,_spSave:spSave,_cookSp:cookSp,_decoAsk:decoAsk,_decoYes:decoYes,
 _view:view,_back:back,_mback:mback,_intro:doIntro,_set:setupSet,_setupDone:setupDone,_paint:()=>{SETUP=null;VIEW='setup';draw();},
 _add:addCart,_fill:fillFor,_clearCart:()=>{CART={};draw();},_pay:pay,
 _k:mkey,_pickA:pickA,_help:()=>{if(MQ){MQ.help=true;sfx('tap');redrawMath();}},_mathNext:mathNext,
 _cookPick:cookPick,_cookNb:cookNb,_cookGo:cookGo,_price:i=>{PRICE=i;sfx('tap');draw();},_priceGo:priceGo,_openGo:openGo,_close:closeEarly,_closeYes:closeYes,
 _takeHome:takeHome,_clearB:clearB,_visit:visit,_buyAsk:buyAsk,_buyGo:buyGo,_feed:feed,_give:giveP,_partyDone:partyDone,
 _dbg:{skew:()=>SKEW,setSkew:ms=>{SKEW=ms;},picnic:on=>{PFORCE=!!on;},picnicInfo:picnic,picTotals,settle,resolve,buy,viewLeft,bLeft,T,
  cravings,spParse,stars,fair7,rateOf,starCheck,CAPS,DECO,RARE,TOP,FLAV,ckInfo,canMakeK,
  view:()=>VIEW,math:()=>MQ&&{ans:MQ.q.ans,choice:!!MQ.q.choice,fr:!!MQ.q.fr,k:MQ.q.k,done:MQ.done},REC,ING,TIERS,priceOf,boughtToday,reset:()=>{VIEW='hub';SETUP=null;SPB=null;CART={};COOK=null;MQ=null;PRICE=null;NOTE=null;}}};
document.addEventListener('keydown',e=>{try{if(!MQ||MQ.done||MQ.q.choice||(curS()!=='truck')||document.querySelector('#modal.show'))return;
 if(/^[0-9]$/.test(e.key)){mkey(e.key);e.preventDefault();}else if(e.key==='Backspace'){mkey('del');e.preventDefault();}else if(e.key==='Enter'){mkey('go');e.preventDefault();}}catch(x){}});
/* ---------- screen registration (SCREENS may not exist yet) ---------- */
(function reg(){if(typeof SCREENS!=='undefined'){
 SCREENS.truck=arg=>{if(typeof arg==='string'&&VIEWS.includes(arg))VIEW=arg;css();draw();};
 SCREENS.market=()=>{css();drawMarket();};}else setTimeout(reg,30);})();
})();
