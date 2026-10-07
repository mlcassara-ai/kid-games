/* ================= 🎓 curriculum: math by grade (owner, Oct 2026) =================
   Every level of every world is tagged with the US school grade where it is normally taught (`LG`, Common Core order; high school
   = 9-12). The owner's rules:
   • A kid only gets questions up to their own grade in each world (`cap`): no fractions for first graders, no algebra for third
     graders. Grades are EARNED upward: 15 right in a row at the top of their grade unlocks the next grade in that world (`after`,
     a 🎓 toast), so a sharp 2nd grader can climb to 5th-grade work. Nothing already reached is taken away: the first time a save is
     seen, each world's grade starts at the higher of the kid's grade and the grade of the level they are already at (`sync`).
   • Worlds whose first level is above the kid's math grade are closed until earned (`zoneLock`); worlds the kid has already
     played stay open.
   • Bronze, Silver and Gold walk through the kid's grade like a school year (`inRound`): Bronze = the start of the year (with
     review of the grade before), Silver = the middle, Gold = the end; Diamond = the hardest mix; Legend = end-of-year mastery.
     For kids the questions themselves come from the grade's school-year plan in plan.js (PLAN.q); the levels here still drive
     the skill dial, the grade caps and earning the next grade.
   • Variety: a memory of the last 40 questions per world on this device (`seen`/`remember`) so right answers aren't asked again
     across battles; the youngest levels also come as "missing number" questions (`vary`).
   • Word problems with the game's own characters (`story`) for + − × ÷ levels 1-10.
   Hooks in index.html: zoneLocked, wGate, dialLevel, adjustSkill, nextQ, pickOpFair. */
(function(){
'use strict';
const LG={ /* grade for level 1..N of each world (kept non-decreasing so a level range is a grade range) */
 add:[1,1,1,2,2,3,3,4,4,4, 7,7,7,8,8, 8,8,8,9,9, 10,10,11,11,11],
 sub:[1,1,2,2,2,3,3,4,4,4, 7,7,7,7,8, 8,8,8,8,9, 10,10,10,11,11],
 mul:[2,2,3,3,3,3,4,4,4,4, 7,7,7,7,7, 8,8,8,9,9, 10,11,11,11,12],
 div:[3,3,3,3,3,3,4,4,5,5, 7,7,7,7,7, 8,8,8,8,9, 10,11,11,11,12],
 frac:[2,3,3,4,4,4,4,4,4,5, 5,5,5,6,6], money:[2,2,2,2,2,3,4,4,4,4, 7,7,7,7,8], time:[1,1,2,2,3,3,3,3,3,4, 5,6,6,6,7],
 grp:[2,2,3,3,3,3,3,3,3,3, 4,6,6,6,6], est:[3,3,3,3,3,3,4,4,4,4, 5,7,7,7,8], avg:[4,4,5,5,5,5,5,5,6,6, 7,7,7,7,7],
 vol:[5,5,5,5,5,5,5,5,5,5, 6,7,7,8,8], meas:[3,3,3,4,4,4,4,5,5,5, 6,6,7,7,7], word:[4,4,4,4,4,4,4,4,4,4, 7,8,8,8,8], graph:[1,1,2,2,3,3,4,4,5,5, 8,8,8,8,8],
 geo:[1,1,2,2,3,3,4,4,5,5, 6,6,7,7,8]};
const STREAK=15;
const ORD=n=>n>=13?'adult':n>=9?'high-school':n+(n===1?'st':n===2?'nd':n===3?'rd':'th')+'-grade';
const gradeOf=(op,L)=>{const a=LG[op];return a?a[Math.max(0,Math.min(a.length,L)-1)]:1;};
const base=p=>p.adult?99:Math.max(1,Math.min(12,+p.grade||3));
const played=(p,op)=>{const s=(p.stats||{})[op];return !!(s&&((s.r||0)+(s.w||0))>0);};
function sync(p){if(!p)return;if(p.mgv===1&&p.mg)return;p.mg=p.mg||{};const b=base(p);
 Object.keys(LG).forEach(op=>{const have=played(p,op)?gradeOf(op,Math.floor((p.skill||{})[op]||1)):0;p.mg[op]=Math.max(p.mg[op]||0,b,have);});p.mgv=1;}
function grade(p,op){sync(p);return p.adult?99:(p.mg[op]||base(p));}
function cap(p,op){const a=LG[op];if(!a)return typeof maxLv==='function'?maxLv(op):10;const g=grade(p,op);let L=1;for(let i=0;i<a.length;i++)if(a[i]<=g)L=i+1;return L;}
const mathGrade=p=>{sync(p);return p.adult?99:Math.max(base(p),p.mg.add||0,p.mg.sub||0,p.mg.mul||0,p.mg.div||0);};
function zoneLock(z,p){if(!z||!z.op||z.op==='mix'||!LG[z.op]||p.adult)return false;if(played(p,z.op)||((p.progress||{})[z.id]||[]).some(x=>x>0))return false;return gradeOf(z.op,1)>mathGrade(p);}
function lockWhy(z,p){if(!zoneLock(z,p))return '';return `🎓 ${z.name} opens with ${ORD(gradeOf(z.op,1))} math. Keep winning in the other worlds to unlock it!`;}
const opOpen=(p,op)=>p.adult||gradeOf(op,1)<=mathGrade(p)||played(p,op);
/* after each answer: keep the dial at or below the kid's grade; 15 right in a row at the top earns the next grade */
function after(p,op,ok,v){if(!LG[op]||p.adult)return v;const c=cap(p,op),a=LG[op];p.capRun=p.capRun||{};
 if(Math.floor(v)>=c){if(ok)p.capRun[op]=(p.capRun[op]||0)+1;else p.capRun[op]=0;
  if(p.capRun[op]>=STREAK&&c<a.length){p.capRun[op]=0;const ng=a[c];p.mg[op]=ng;const nm=(typeof OPNAME!=='undefined'&&OPNAME[op])||op;
   setTimeout(()=>{try{SFX.level();}catch(e){}try{toast(`🎓 Amazing! You unlocked ${ORD(ng)} ${nm}!`);}catch(e){}},400);return Math.max(v,c+.01);}}
 return Math.min(v,c+.99);}
/* the round's slice of the kid's grade */
function windowFor(p,op,r){const c=cap(p,op),a=LG[op];if(!a)return [1,c];const G=a[c-1];const band=[];for(let L=1;L<=c;L++)if(a[L-1]===G)band.push(L);const n=band.length,f=band[0];
 if(r<=1)return [Math.max(1,f-2),band[Math.max(0,Math.ceil(n/3)-1)]];
 if(r===2)return [band[Math.floor(n/3)],band[Math.max(Math.floor(n/3),Math.ceil(2*n/3)-1)]];
 if(r===3)return [band[Math.floor(2*n/3)],band[n-1]];
 if(r===4)return [band[Math.floor(n/3)],band[n-1]];
 return [band[Math.max(0,n-2)],band[n-1]];}
/* adults: the five medals climb five levels up to their own skill level (Bronze = 4 below, Legend = their level), never below 11 */
function inRound(p,op,r,dial){if(p.adult){const top=Math.max(15,Math.floor(dial||1)),mx=typeof maxLv==='function'?maxLv(op):25;/* adults never get the kids' column-arithmetic levels (1-10) */return Math.min(mx,Math.max(11,top-5+Math.max(1,Math.min(5,r||1))));}if(!LG[op])return dial;const [lo,hi]=windowFor(p,op,r);return Math.max(lo,Math.min(hi,dial));}
/* a memory of recent questions per world, on this device */
const key=q=>String(q.text||'')+'|'+String(q.prompt||'')+'|'+String(q.tpl||'')+'|'+q.answer;
const LS=(p,op)=>'mq.rq.'+(p.id||'x')+'.'+op;
function list(p,op){try{return JSON.parse(localStorage.getItem(LS(p,op))||'[]');}catch(e){return [];}}
function seen(p,op,q){return list(p,op).includes(key(q));}
function remember(p,op,q){try{const l=list(p,op).filter(k=>k!==key(q));l.push(key(q));while(l.length>40)l.shift();localStorage.setItem(LS(p,op),JSON.stringify(l));}catch(e){}}
/* the youngest levels: "missing number" questions too (Common Core 1.OA.8) */
function vary(q){if(!q||q.tpl||q.prompt||!(q.op==='add'||q.op==='sub')||q.L>3||q.a==null||q.b==null||Math.random()>.3)return q;
 if(q.op==='add')return Object.assign({},q,{text:`${q.a} + ? = ${q.answer}`,prompt:'What number is missing?',tpl:`${q.a} + {A} = ${q.answer}`,answer:q.b,miss:1});
 return Object.assign({},q,{text:`${q.a} − ? = ${q.answer}`,prompt:'What number is missing?',tpl:`${q.a} − {A} = ${q.answer}`,answer:q.b,miss:1});}
/* word problems with the game's characters */
const PL=(n,one,many)=>n===1?one:(many||one+'s');
const T={
 add:[(a,b)=>`Dr. Quartz found ${a} ${PL(a,'crystal')} in the cave on Monday and ${b} more on Tuesday. How many crystals did he find?`,
  (a,b)=>`Ms. Rosa baked ${a} ${PL(a,'cookie')} in the morning and ${b} more after lunch. How many cookies did she bake?`,
  (a,b)=>`The train had ${a} ${PL(a,'passenger')}. At the station, ${b} more got on. How many passengers are on the train now?`,
  (a,b)=>`Coach Flex did ${a} push-ups. Then he did ${b} more to show off. How many push-ups did he do?`,
  (a,b)=>`The Elder Wiz has ${a} ${PL(a,'sock')} with no partner. He finds ${b} more under his bed. How many lonely socks does he have now?`,
  (a,b)=>`Grumbleroot the troll collected ${a} ${PL(a,'coin')} at his bridge today and ${b} yesterday. How many coins in all?`,
  (a,b)=>`Skyla the eagle has ${a} shiny ${PL(a,'feather')} in her nest. She finds ${b} more. How many feathers now?`,
  (a,b)=>`Kids tossed ${a} ${PL(a,'coin')} into the Wishing Fountain this morning and ${b} this afternoon. How many coins went in?`],
 sub:[(a,b)=>`Ms. Rosa baked ${a} ${PL(a,'cookie')}. The kids ate ${b}. How many cookies are left?`,
  (a,b)=>`Dr. Quartz had ${a} mystery ${PL(a,'rock')}. He tested ${b} of them. How many are still a mystery?`,
  (a,b)=>`The train had ${a} ${PL(a,'passenger')}. At the Lab, ${b} got off. How many are still on the train?`,
  (a,b)=>`The Grey Goblin stole ${a} ${PL(a,'sock')}. The Kind Teacher got ${b} back. How many socks does the goblin still have?`,
  (a,b)=>`Gizmo built ${a} ${PL(a,'gadget')}. ${b} of them exploded with a POP. How many gadgets still work?`,
  (a,b)=>`Grumbleroot had ${a} ${PL(a,'coin')}. He spent ${b} on troll snacks. How many coins does he have left?`,
  (a,b)=>`There were ${a} jellybeans in the jar. Your pet sneaked ${b}. How many are left?`],
 mul:[(a,b)=>`Dr. Quartz has ${a} lab ${PL(a,'coat')}. Each coat has ${b} ${PL(b,'button')}. How many buttons in all?`,
  (a,b)=>`Ms. Rosa puts ${b} ${PL(b,'meatball')} on each plate. She makes ${a} ${PL(a,'plate')}. How many meatballs?`,
  (a,b)=>`The train has ${a} ${PL(a,'car')}. Each car has ${b} ${PL(b,'seat')}. How many seats on the train?`,
  (a,b)=>`Coach Flex does ${b} jumping jacks every morning for ${a} ${PL(a,'day')}. How many jumping jacks?`,
  (a,b)=>`The Elder Wiz casts ${b} ${PL(b,'sparkle')} with every wave of his wand. He waves it ${a} ${PL(a,'time')}. How many sparkles?`,
  (a,b)=>`Each crystal jar in the Lab holds ${b} ${PL(b,'crystal')}. There are ${a} ${PL(a,'jar')}. How many crystals?`,
  (a,b)=>`Nana Paws walks ${a} ${PL(a,'dog')}. Each dog has ${b===4?4:b} ${PL(b===4?4:b,'tennis ball')}. How many tennis balls?`],
 div:[(a,b)=>`Grumbleroot has ${a} ${PL(a,'coin')}. He shares them equally among ${b} troll ${PL(b,'friend')}. How many coins does each friend get?`,
  (a,b)=>`Ms. Rosa has ${a} ${PL(a,'cookie')} to put in bags of ${b}. How many bags can she fill?`,
  (a,b)=>`Dr. Quartz has ${a} ${PL(a,'rock')} to put on ${b} shelves, the same number on each shelf. How many rocks go on each shelf?`,
  (a,b)=>`${a} kids are riding the train. Each car holds ${b}. How many cars do they fill?`,
  (a,b)=>`The Elder Wiz splits ${a} ${PL(a,'gold star')} equally among ${b} ${PL(b,'student')}. How many stars does each student get?`,
  (a,b)=>`Gizmo has ${a} ${PL(a,'battery','batteries')}. Each gadget needs ${b}. How many gadgets can he power?`]};
function story(p,q){try{if(!q||q.tpl||q.prompt||q.story||q.wp||!T[q.op]||q.L>10||q.a==null||q.b==null)return null;const g=+p.grade||3;if(p.adult)return null;
 if(Math.random()>(g<=1?.12:g===2?.2:.28))return null;if(q.op==='add'&&q.L===10)return null;let a=q.a,b=q.b;
 if(q.op==='mul'&&(a===0||b===0))return null;if(q.op==='div'&&(b===1))return null;
 if(q.op==='mul'&&a<b){const t=a;a=b;b=t;}
 const f=T[q.op][Math.floor(Math.random()*T[q.op].length)];const text=f(a,b);
 return {op:q.op,L:q.L,a:q.a,b:q.b,answer:q.answer,text,prompt:text,tpl:'{A}',wp:1};}catch(e){return null;}}
window.CURR={LG,STREAK,gradeOf,grade,cap,mathGrade,zoneLock,lockWhy,opOpen,after,windowFor,inRound,seen,remember,vary,story,sync,ORD};
})();
