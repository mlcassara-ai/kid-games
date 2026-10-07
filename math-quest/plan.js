/* ================= 📅 PLAN: a school year of questions for each world, grades 1-5 (owner, Oct 2026) =================
   For kids (not adults), each world serves questions from its grade's plan instead of the old level generators:
   PLAN.def(op, grade, [bronze, silver, gold, diamond, legend]) — each round is a list of question makers.
   • Bronze = start of the school year (with a little review), Silver = middle, Gold = end of year,
     Diamond = the hardest mix of the year, Legend = multi-step stories and the year's biggest ideas.
     A later round is never easier than an earlier one.
   • Every round has several question kinds; they are dealt like cards (`bag`) so kinds rotate and don't repeat back to back.
   • The grade is the kid's EARNED grade in that world (CURR.grade); a kid whose skill dial has dropped below the bottom of
     their grade gets the grade before (if planned).
   Question object (tpl must contain {A}; answer is always an integer):
     {prompt?, tpl, answer, text, explain, nudge, vis?, kind:'clock'?, dp:1|2?, pick:[labels]?, alt:[ints]?, fast?, wp:1?}
     dp = the answer is a decimal with dp places, stored ×10^dp (the box puts the dot in by itself).
     pick = tap-to-choose buttons; answer = index of the right label (use H.choice).
     wp = a story (word) problem.
   Makers are functions (c) => question, where c = {p, name, pet, grade, round}. */
(function(){
'use strict';
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const PK=a=>a[Math.floor(Math.random()*a.length)];
const SH=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;};
const P2=n=>String(n).padStart(2,'0');
const N=n=>Number(n).toLocaleString('en-US');
const PL=(n,one,many)=>n===1?one:(many||one+'s');
const F=(a,b)=>`<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const FA=b=>`<span class="fr"><span>{A}</span><span>${b}</span></span>`;
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const T=(h,m)=>`${h}:${P2(m)}`;
const D=(v,dp)=>{const s=String(Math.abs(v)).padStart(dp+1,'0');return (v<0?'−':'')+s.slice(0,-dp)+'.'+s.slice(-dp);};
const $$=c=>{const d=Math.floor(c/100),r=c%100;return '$'+d+'.'+P2(r);};
/* game characters for story problems (first names only; kid's own name and pet come from c) */
const WHO=['Dr. Quartz','Ms. Rosa','Coach Flex','the Elder Wiz','Grumbleroot the troll','Skyla the eagle','Gizmo','Nana Paws','the Grey Goblin','Ozzy','the Kind Teacher'];
function choice(o,right,wrongs){const w=[...new Set(wrongs.map(String))].filter(x=>x!==String(right));const list=SH([String(right),...w.slice(0,3)]);return Object.assign(o,{pick:list,answer:list.indexOf(String(right))});}
const H={R,PK,SH,P2,N,PL,F,FA,gcd,T,D,$$,WHO,choice,
 /* reuse an old level generator as a maker */
 old:(op,L)=>()=>{const q=genQ(op,typeof L==='function'?L():Array.isArray(L)?PK(L):L);return q;}};
const PLAN={};
function def(op,g,rounds){if(!Array.isArray(rounds)||rounds.length!==5)throw new Error('PLAN '+op+' '+g+': need 5 rounds');(PLAN[op]=PLAN[op]||{})[g]=rounds;}
const bags={};
function deal(key,n){let b=bags[key];if(!b||!b.length){const last=b&&b.last;b=SH(Array.from({length:n},(_,i)=>i));if(n>1&&b[0]===last)b.push(b.shift());bags[key]=b;}const k=b.shift();b.last=k;bags[key]=b;return k;}
function gradeFor(p,op,L0){const pl=PLAN[op];if(!pl||p.adult)return 0;const g=Math.min(5,(window.CURR?CURR.grade(p,op):+p.grade||3));if(g<1)return 0;
 let use=0;for(let k=g;k>=1;k--)if(pl[k]){use=k;break;}if(!use)for(let k=1;k<=5;k++)if(pl[k]){use=k;break;}
 /* struggling: the dial is below the bottom of this grade's levels → the grade before */
 if(window.CURR&&L0!=null&&CURR.LG[op]){const a=CURR.LG[op];const lo=a.filter(x=>x<=use);if(lo.length){const G=Math.max(...lo),first=a.indexOf(G)+1;if(L0<first&&pl[use-1])use=use-1;}}
 return use;}
const sigs={},lastA={},lastT={},lastU={};let useN=0;
/* the answer to compare: a typed number, or the text of a tap choice ("He is right!", "Yes"…); other formats none */
const akey=x=>x.pick?'P:'+String(x.pick[x.answer]).replace(/<[^>]+>/g,'').slice(0,14):(x.multi||x.tf||x.nlt||x.plot)?null:x.answer;const NAMES=/Dr\. Quartz|Ms\. Rosa|Coach Flex|(the )?Elder Wiz|Grumbleroot( the troll)?|Skyla( the eagle)?|Gizmo|Nana Paws|(the )?Grey Goblin|Ozzy|(the )?Kind Teacher|the troll|the eagle|the Goblin|your pet \w+|[Yy]our pet|\byou\b/g;
/* a question's "shape": the set of its first 8 words with names, numbers and emoji taken out (plain sums with no story have none) */
const STOP={a:1,an:1,the:1,and:1,of:1,to:1,is:1,in:1,on:1,at:1,he:1,she:1,his:1,her:1,it:1};
const sig=x=>{const w=String(x.prompt||'').replace(/<[^>]+>/g,' ').replace(NAMES,' ').replace(/[0-9][0-9.,/]*/g,' ').replace(/[^A-Za-z' ]+/g,' ').toLowerCase().split(/\s+/).filter(t=>t&&!STOP[t]).slice(0,8);return w.length>=2?w:null;};
const alike=(a,b)=>{const A=new Set(a),Bs=new Set(b);let n=0;A.forEach(t=>{if(Bs.has(t))n++;});return n/Math.max(1,Math.min(A.size,Bs.size))>=.7;};
function q(p,op,round,L,L0){try{const g=gradeFor(p,op,L0);if(!g)return null;const r=Math.max(1,Math.min(5,round||1));const list=PLAN[op][g][r-1];if(!list||!list.length)return null;
  const pt=typeof petOf==='function'&&petOf(p);const pet=pt?'your pet '+pt.name:'your pet';const c={p,name:p.name||'You',pet,grade:g,round:r};
  /* no template twice in a row-window: the last 6 questions of this round are remembered as "shapes" (numbers, names and emoji
     removed); a match is drawn again (up to 10 tries) */
  const key=p.id+'|'+op+'|'+g+'|'+r,ring=(sigs[key]=sigs[key]||[]);let o=null,sg='';
  const ans=(lastA[key]=lastA[key]||[]);
  /* template ids: a maker's own `tk` (its story kind) or its place in the round; the same id again within the round is redrawn */
  const tks=(lastT[key]=lastT[key]||[]);let tk='';const win=Math.min(8,Math.max(1,list.length-1));/* a kind once per round (a round is about 8) when the round has enough kinds */
  const used=(lastU[key]=lastU[key]||{}),ok=(x,k)=>{const t2=String(x.tk!=null?'k:'+x.tk:'m'+k),s2=sig(x),a2=akey(x);return !tks.slice(-win).includes(t2)&&!(s2&&ring.some(r=>alike(r,s2)))&&!(a2!=null&&ans.includes(a2));};
  let pass=false,kk=-1;
  for(let t=0;t<10&&!pass;t++){const k=deal(key,list.length);const x=list[k](c);if(!x)continue;o=x;kk=k;pass=ok(x,k);}
  /* random tries failed: walk the makers from least recently used, a few draws each */
  if(!pass){const order=list.map((_,i)=>i).sort((a2,b2)=>(used[a2]||0)-(used[b2]||0));
   for(const k of order){for(let t=0;t<4&&!pass;t++){const x=list[k](c);if(x&&ok(x,k)){o=x;kk=k;pass=true;}}if(pass)break;}}
  if(o){sg=sig(o);tk=String(o.tk!=null?'k:'+o.tk:'m'+kk);used[kk]=++useN;}
  if(o){tks.push(tk);while(tks.length>8)tks.shift();}
  if(!o)return null;if(sg){ring.push(sg);while(ring.length>6)ring.shift();}{const av=akey(o);if(av!=null){ans.push(av);while(ans.length>3)ans.shift();}}
  o=Object.assign({fast:12},o,{op,L:L||o.L||1,plan:g});if(!o.tpl)o.tpl='{A}';if(o.text==null)o.text=String(o.prompt||'').replace(/<[^>]+>/g,'')+' '+o.tpl;
  return o;}catch(e){console.warn('PLAN',op,e);return null;}}
window.PLAN={def,q,H,PLAN,gradeFor};
})();
/* plan-addsub.js: Addition Forest (add) and Subtraction Caves (sub), grades 1–5 (Common Core year plans) */
(function(){'use strict';const {R,PK,SH,P2,N,PL,F,FA,gcd,T,D,$$,WHO,choice,old}=PLAN.H;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const sum=a=>a.reduce((x,y)=>x+y,0);
const rs=(lo,hi,st)=>{st=st||1;return st*R(Math.ceil(lo/st),Math.floor(hi/st));};
const carries=(a,b)=>{let c=0,k=0;while(a>0||b>0){const s=a%10+b%10+k;k=s>=10?1:0;c+=k;a=Math.floor(a/10);b=Math.floor(b/10);}return c;};
const fastFor=v=>v<=20?8:v<=100?15:v<=1000?20:30;
const PN=['ones','tens','hundreds','thousands','ten thousands'];
const pv=n=>{const s=String(n),o=[];for(let i=0;i<s.length;i++){const d=+s[i];if(d)o.push(d*Math.pow(10,s.length-1-i));}return o;};
const EM=['🍎','🍪','⭐','🐞','🌸','🎈','🐟','🍓','🦋','🧁','🐣','🔮'];
/* decimals: values are scaled integers (×10 or ×100) */
const fd=(v,dp)=>{let s=D(v,dp);if(s.includes('.'))s=s.replace(/0+$/,'').replace(/\.$/,'');return s;};
const dpOf=(v,dp)=>{while(dp>1&&v%10===0){v/=10;dp--;}return dp;};

/* ---------- number generators ---------- */
/* addend pair: a from [lo,hi,step], b from [lo,hi,step], carries between cmin and cmax, optional max sum */
function gA(A,B,cmin,cmax,max,min){let a,b;for(let i=0;i<400;i++){a=rs(A[0],A[1],A[2]);b=rs(B[0],B[1],B[2]);const k=carries(a,b);if(k>=cmin&&k<=cmax&&(!max||a+b<=max)&&(!min||a+b>=min))return [a,b];}return [a,b];}
/* subtraction pair: a from A, b from B, a−b ≥ 1, borrows between bmin and bmax */
function gS(A,B,bmin,bmax){let a,b;for(let i=0;i<400;i++){a=rs(A[0],A[1],A[2]);b=rs(B[0],B[1],B[2]);if(a-b<1)continue;const k=carries(a-b,b);if(k>=bmin&&k<=bmax)return [a,b];}return [a,b];}

/* ---------- explanations ---------- */
function addEx(ns){const s=sum(ns);
 if(ns.length===2&&s<=20&&ns.every(x=>x<=10)){const [a,b]=ns;const big=Math.max(a,b),sm=Math.min(a,b);
  if(s>10&&big<10){const need=10-big;return `<p>Make a ten: ${big} + ${need} = 10.</p><p>${sm} is ${need} and ${sm-need}, so 10 + ${sm-need} = <b>${s}</b>.</p>`;}
  if(a===b)return `<p>A double: ${a} + ${a} = <b>${s}</b>.</p>`;
  if(sm<=4&&sm>0){const st=[];for(let i=1;i<=sm;i++)st.push(big+i);return `<p>Start at ${big} and count on ${sm}: ${st.join(', ')}.</p><p>${a} + ${b} = <b>${s}</b>.</p>`;}
  return `<p>Start at ${big} and count on ${sm}.</p><p>${a} + ${b} = <b>${s}</b>.</p>`;}
 if(s<=20){for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++)if(ns[i]+ns[j]===10&&ns.length===3){const r=ns.find((_,k)=>k!==i&&k!==j);return `<p>Look for a ten: ${ns[i]} + ${ns[j]} = 10.</p><p>10 + ${r} = <b>${s}</b>.</p>`;}
  const L=[];let t=ns[0];for(let i=1;i<ns.length;i++){L.push(`${t} + ${ns[i]} = ${t+ns[i]}`);t+=ns[i];}L[L.length-1]=L[L.length-1].replace(/= (\d+)$/,'= <b>$1</b>');return `<p>Add two at a time:</p><p>${L.join('<br>')}</p>`;}
 const len=Math.max(...ns.map(x=>String(x).length));const lines=[],parts=[];
 for(let k=len-1;k>=0;k--){const vals=ns.map(x=>Math.floor(x/Math.pow(10,k))%10*Math.pow(10,k)).filter(v=>v);if(!vals.length)continue;const t=sum(vals);
  lines.push(vals.length>1?`${cap(PN[k])}: ${vals.map(N).join(' + ')} = ${N(t)}`:`${cap(PN[k])}: ${N(t)}`);parts.push(t);}
 return `<p>Add each place:</p><p>${lines.join('<br>')}</p><p>${parts.length>1?parts.map(N).join(' + ')+' = ':''}<b>${N(s)}</b>.</p>`;}
const addNudge=ns=>{const m=Math.max(...ns);return sum(ns)<=10?'<p>Start with the bigger number and count on.</p>':sum(ns)<=20&&ns.length===2?'<p>Can you make a ten first?</p>':sum(ns)<=20?'<p>Look for two numbers that make 10.</p>':m<100&&ns.length===2?'<p>Add the tens, then add the ones.</p>':'<p>Line up the places. Add ones, tens, hundreds… and regroup when a place gets 10 or more.</p>';};
function subEx(a,b){const d=a-b;
 if(a<=20&&b<=10){
  if(a>10&&d<10&&b<10){const x=a-10;return `<p>Take ${x} to get to 10: ${a} − ${x} = 10.</p><p>Take ${b-x} more: 10 − ${b-x} = <b>${d}</b>.</p>`;}
  if(b<=3&&b>0){const st=[];for(let i=1;i<=b;i++)st.push(a-i);return `<p>Start at ${a} and count back ${b}: ${st.join(', ')}.</p><p>${a} − ${b} = <b>${d}</b>.</p>`;}
  return `<p>Think addition: ${b} + ? = ${a}.</p><p>${b} + ${d} = ${a}, so ${a} − ${b} = <b>${d}</b>.</p>`;}
 const parts=pv(b);
 if(parts.length===1){const k=String(b).length-1,u=Math.pow(10,k);
  if(a%u===0)return `<p>${N(a/u)} ${PN[k]} − ${N(b/u)} ${PN[k]} = ${N(d/u)} ${PN[k]}.</p><p>${N(a)} − ${N(b)} = <b>${N(d)}</b>.</p>`;
  if(Math.floor(a/u)%10>=b/u&&b>=10)return `<p>Only the ${PN[k]} change: ${Math.floor(a/u)%10} ${PN[k]} − ${b/u} ${PN[k]} = ${Math.floor(a/u)%10-b/u} ${PN[k]}.</p><p>${N(a)} − ${N(b)} = <b>${N(d)}</b>.</p>`;}
 let cur=a;const L=[];
 for(const v of parts){if(v<10&&cur%10<v&&cur%10>0){const x=cur%10;L.push(`${N(cur)} − ${x} = ${N(cur-x)}`);cur-=x;L.push(`${N(cur)} − ${v-x} = ${N(cur-(v-x))}`);cur-=v-x;}else{L.push(`${N(cur)} − ${N(v)} = ${N(cur-v)}`);cur-=v;}}
 return `<p>Take away ${N(b)} in parts:</p><p>${L.join('<br>')}</p><p>So ${N(a)} − ${N(b)} = <b>${N(d)}</b>.</p>`;}
const subNudge=(a,b)=>a<=10?'<p>Start at the big number and count back.</p>':a<=20?'<p>Take away to get to 10 first.</p>':a<100?'<p>Take away the tens, then the ones.</p>':'<p>Line up the places. If the top digit is too small, regroup from the next place.</p>';
function decEx(a,b,dp,op){const u=dp===1?'tenths':dp===2?'hundredths':'thousandths';const r=op==='+'?a+b:a-b;const sa=fd(a,dp),sb=fd(b,dp);const pad=[];
 if(sa!==D(a,dp))pad.push(`${sa} as ${D(a,dp)}`);if(sb!==D(b,dp))pad.push(`${sb} as ${D(b,dp)}`);
 return `<p>Line up the decimal points.${pad.length?' Write '+pad.join(' and ')+'.':''}</p><p>Think in ${u}: ${a} ${op==='+'?'+':'−'} ${b} = ${r} ${u}.</p><p>${r} ${u} = <b>${fd(r,dp)}</b>.</p>`;}

/* ---------- plain makers ---------- */
const fresh=(gen,c)=>{let v;for(let i=0;i<25;i++){v=gen(c);const k=v.slice().sort((a,b)=>a-b).join(',');if(!RECN.includes(k)||i===24){RECN=RECN.concat([k]).slice(-10);return v;}}return v;};
const add=(gen,o)=>c=>{o=o||{};const ns=fresh(gen,c);const s=sum(ns);const q={tpl:ns.map(N).join(' + ')+' = {A}',answer:s,text:'a'+ns.join('+'),explain:addEx(ns),nudge:o.nudge||addNudge(ns),fast:o.fast||fastFor(s)};if(o.pic)Object.assign(q,o.pic(ns));return q;};
const sub=(gen,o)=>c=>{o=o||{};const [a,b]=fresh(gen,c);const q={tpl:`${N(a)} − ${N(b)} = {A}`,answer:a-b,text:`s${a}-${b}`,explain:subEx(a,b),nudge:o.nudge||subNudge(a,b),fast:o.fast||fastFor(a)};if(o.pic)Object.assign(q,o.pic(a,b));return q;};
/* missing addend: a + {A} = s or {A} + b = s */
const miss=(gen,o)=>c=>{o=o||{};const [a,b]=gen(c);const s=a+b;const left=o.side==='L'||(o.side!=='R'&&R(0,1));
 return {prompt:o.prompt,tpl:left?`{A} + ${N(b)} = ${N(s)}`:`${N(a)} + {A} = ${N(s)}`,answer:left?a:b,text:`m${left?'L':'R'}${a}+${b}`,
  explain:`<p>${left?`What plus ${N(b)} makes ${N(s)}?`:`Count up from ${N(a)} to ${N(s)}.`}</p><p>${N(s)} − ${N(left?b:a)} = <b>${N(left?a:b)}</b>.</p><p>Check: ${N(a)} + ${N(b)} = ${N(s)}.</p>`,
  nudge:`<p>Take the number you know away from ${N(s)}, or count up.</p>`,fast:o.fast||fastFor(s)+4};};
/* missing number in subtraction: a − {A} = d or {A} − b = d */
const missS=(gen,o)=>c=>{o=o||{};const [a,b]=gen(c);const d=a-b;const top=o.side==='T'||(o.side!=='B'&&R(0,1));
 return {prompt:o.prompt,tpl:top?`{A} − ${N(b)} = ${N(d)}`:`${N(a)} − {A} = ${N(d)}`,answer:top?a:b,text:`ms${top?'T':'B'}${a}-${b}`,
  explain:top?`<p>Put back what was taken: ${N(d)} + ${N(b)} = <b>${N(a)}</b>.</p><p>Check: ${N(a)} − ${N(b)} = ${N(d)}.</p>`:`<p>How much do you take from ${N(a)} to leave ${N(d)}?</p><p>${N(a)} − ${N(d)} = <b>${N(b)}</b>.</p><p>Check: ${N(a)} − ${N(b)} = ${N(d)}.</p>`,
  nudge:top?'<p>Add the two numbers you know to get back to the start.</p>':'<p>Subtract the answer from the first number.</p>',fast:o.fast||fastFor(a)+4};};
/* compare with < > = */
function cmpQ(ls,lv,rsx,rv,ex,text){const right=lv<rv?'&lt;':lv>rv?'&gt;':'=';const o={prompt:'Choose &lt;, &gt; or =.',tpl:`${ls} {A} ${rsx}`,text:text||`c${ls}?${rsx}`,
 explain:ex+`<p>So ${ls} <b>${right}</b> ${rsx}.</p>`,nudge:'<p>Which side is bigger? The open mouth eats the bigger number.</p>',fast:12};return choice(o,right,['&lt;','&gt;','=']);}
const cmpNum=(gen)=>c=>{let [a,b]=gen();const k=String(Math.max(a,b)).length;const ex=a===b?'<p>They are the same number.</p>':(()=>{const sa=String(a),sb=String(b);if(sa.length!==sb.length)return `<p>${N(Math.max(a,b))} has more digits, so it is bigger.</p>`;let i=0;while(sa[i]===sb[i])i++;const k2=sa.length-1-i;return `<p>Look from the left. The first different place is the ${PN[k2]}: ${sa[i]} and ${sb[i]}.</p>`;})();return cmpQ(N(a),a,N(b),b,ex,`cn${a}?${b}`);};

/* ---------- one-off makers ---------- */
const pic10=c=>{const a=R(1,7),b=R(1,10-a-0);const bb=Math.min(b,10-a);const e=PK(EM);return {vis:{t:'set',n:a+bb,k:a,e},prompt:`<b>${a}</b> ${e} and <b>${bb}</b> more ${e}. How many in all?`,tpl:`${a} + ${bb} = {A}`,answer:a+bb,text:`pic${a}+${bb}${e}`,explain:addEx([a,bb])+'<p>Count all the pictures to check.</p>',nudge:'<p>Count all the pictures.</p>',fast:10};};
const make10=(t0)=>c=>{const t=t0||R(12,18);const a=t===10?R(1,9):R(t-9,t-3);const e='🔴',w='⚪';const pic=t===10?`<p style="font-size:26px;letter-spacing:2px">${e.repeat(Math.min(a,5))}${w.repeat(Math.max(0,5-a))}<br>${e.repeat(Math.max(0,a-5))}${w.repeat(Math.min(5,10-a))}</p>`:'';
 return {prompt:t===10?pic+'How many more make 10?':`How many more make ${t}?`,tpl:`${a} + {A} = ${t}`,answer:t-a,text:`mk${t}-${a}`,explain:`<p>${t===10?`Count the empty spots: ${t-a}.`:`From ${a} to ${t} is ${t-a}.`}</p><p>${a} + <b>${t-a}</b> = ${t}.</p>`,nudge:t===10?'<p>Count the empty circles.</p>':`<p>Count up from ${a} to ${t}.</p>`,fast:8};};
const moreThan=(steps,lo,hi,less)=>c=>{const s=PK(steps);const n=less?R(Math.max(lo,s+1),hi):R(lo,hi);const a=less?n-s:n+s;
 return {tpl:`${N(s)} ${less?'less':'more'} than ${N(n)} is {A}`,answer:a,text:`mt${less?'-':'+'}${s}|${n}`,explain:`<p>${N(n)} ${less?'−':'+'} ${N(s)} = <b>${N(a)}</b>.</p>${s>=10?`<p>Only the ${PN[String(s).length-1]} digit changes${(less?(Math.floor(n/s)%10===0):(Math.floor(n/s)%10===9))?' (it crosses over to the next place here)':''}.</p>`:''}`,nudge:s>=10?`<p>Which place changes when you ${less?'take away':'add'} ${N(s)}?</p>`:`<p>Count ${less?'back':'on'} ${s}.</p>`,fast:8};};
const count120=c=>{const k=R(0,4);let tpl,ans,ex,nd;
 if(k===0){const n=PK([R(99,119),R(99,119),R(39,98)]);tpl=`What comes after ${n}? {A}`;ans=n+1;ex=`<p>Count on one: ${n}, <b>${n+1}</b>.</p>`;nd='<p>Say the number, then count one more.</p>';}
 else if(k===1){const n=R(91,120);tpl=`What comes just before ${n}? {A}`;ans=n-1;ex=`<p>Count back one: ${n}, <b>${n-1}</b>.</p>`;nd='<p>Count back one.</p>';}
 else if(k===2){const a=R(1,9)+10*R(5,8);const seq=[a,a+10,a+20];tpl=`Count by 10s: ${seq.join(', ')}, {A}`;ans=a+30;ex=`<p>Each step adds 10. Only the tens digit changes.</p><p>${a+20} + 10 = <b>${a+30}</b>.</p>`;nd='<p>Add 10 to the last number.</p>';}
 else if(k===3){const a=R(96,116);tpl=`${a}, ${a+1}, ${a+2}, {A}`;ans=a+3;ex=`<p>Count on by ones: <b>${a+3}</b>.</p>`;nd='<p>Keep counting by ones.</p>';}
 else{const n=R(100,119);tpl=`1 more than ${n} is {A}`;ans=n+1;ex=`<p>${n} + 1 = <b>${n+1}</b>.</p>`;nd='<p>Count on one.</p>';}
 return {tpl,answer:ans,text:'ct'+tpl,explain:ex,nudge:nd,fast:8};};
const doubles=c=>{const a=R(5,10);const near=R(0,2);const b=near===0?a:near===1?a+1:a-1;const s=a+b;const d=Math.min(a,b);
 return {tpl:`${a} + ${b} = {A}`,answer:s,text:`dbl${a}+${b}`,explain:a===b?`<p>A double: ${a} + ${a} = <b>${s}</b>.</p>`:`<p>Use a double: ${d} + ${d} = ${2*d}.</p><p>One more: <b>${s}</b>.</p>`,nudge:a===b?'<p>A double! Do you know it?</p>':'<p>Use the double you know, then add 1.</p>',fast:8};};
const pvTO=c=>{const t=R(1,9),o=R(0,9);const flip=R(0,3)===0;return {prompt:`<span style="font-size:24px">${'🟦'.repeat(t)} ${'▫️'.repeat(o)}</span><br>Each 🟦 is a ten. Each ▫️ is a one.`,tpl:flip?`${o} ${PL(o,'one','ones')} and ${t} ${PL(t,'ten')} = {A}`:`${t} ${PL(t,'ten')} and ${o} ${PL(o,'one','ones')} = {A}`,answer:10*t+o,text:`pv${t}${o}${flip}`,explain:`<p>${t} tens is ${10*t}. ${o} ones is ${o}.</p><p>${10*t} + ${o} = <b>${10*t+o}</b>.</p>`,nudge:'<p>The tens digit goes first, then the ones digit.</p>',fast:10};};
const pvHTO=c=>{const h=R(1,9),t=R(0,9),o=R(0,9);const n=100*h+10*t+o;const parts=[[h,PL(h,'hundred')],[t,PL(t,'ten')],[o,PL(o,'one','ones')]];const sh=R(0,2)===0?SH(parts):parts;
 return {tpl:`${sh.map(p=>p[0]+' '+p[1]).join(', ')} = {A}`,answer:n,text:`pvh${n}${sh[0][1]}`,explain:`<p>${h} hundreds = ${100*h}, ${t} tens = ${10*t}, ${o} ones = ${o}.</p><p>${100*h} + ${10*t} + ${o} = <b>${n}</b>.</p>`,nudge:'<p>Put the hundreds digit first, then tens, then ones. A zero holds an empty place.</p>',fast:12};};
const expanded=c=>{const h=R(1,9),t=PK([0,R(1,9),R(1,9)]),o=PK([0,R(1,9),R(1,9),R(1,9)]);const n=100*h+10*t+o;const ps=pv(n);const sh=R(0,3)===0?SH(ps):ps;
 return {tpl:`${sh.join(' + ')} = {A}`,answer:n,text:`ex${sh.join('+')}`,explain:`<p>${ps.join(' + ')} = <b>${n}</b>.</p>${t===0||o===0?'<p>Write 0 for an empty place.</p>':''}`,nudge:'<p>Each number fills one place: hundreds, tens, ones.</p>',fast:10};};
const skip=(steps,back)=>c=>{const s=PK(steps);let a;if(s===5)a=5*R(back?6:1,back?20:15);else if(s===10)a=back?R(60,990):R(3,900);else a=back?100*R(5,9)+PK([0,0,50,R(1,9)*10]):PK([100*R(1,5),100*R(1,5)+R(1,9)*10,R(1,99)]);
 const seq=[0,1,2,3,4].map(i=>back?a-i*s:a+i*s);return {prompt:`Skip count by <b>${s}</b>${back?' backward':''}.`,tpl:`${seq.slice(0,4).join(', ')}, {A}`,answer:seq[4],text:`sk${s}${back?'b':''}${a}`,explain:`<p>Each step ${back?'takes away':'adds'} ${s}.</p><p>${seq[3]} ${back?'−':'+'} ${s} = <b>${seq[4]}</b>.</p>`,nudge:`<p>${back?'Take away':'Add'} ${s} to the last number.</p>`,fast:10};};
const evenOdd=(lo,hi)=>c=>{const n=R(lo||2,hi||20);const e=PK(EM);const r=n%2?'odd':'even';return choice({vis:n<=20?{t:'set',n,e}:undefined,prompt:`Is <b>${n}</b> even or odd?`,tpl:'{A}',text:`eo${n}`,explain:n<=20?`<p>Make pairs: ${Math.floor(n/2)} pairs${n%2?' and 1 left over':' and none left over'}.</p><p>${n} is <b>${r}</b>.</p>`:`<p>Look at the ones digit: ${n%10}. ${n%10} is ${r}.</p><p>So ${n} is <b>${r}</b>.</p>`,nudge:n<=20?'<p>Can every one have a partner?</p>':'<p>Only the ones digit matters: 0, 2, 4, 6, 8 are even.</p>',fast:10},r,['even','odd']);};
const roundN=(places,vis,big)=>c=>{const to=PK(places);let v;do{v=big?R(1100,98900):R(to*1.1,to*9.4);}while(v%to===0||Math.floor(v/(to/10))%10===5&&v%(to/10)===0&&R(0,1));
 const lo=Math.floor(v/to)*to,hi=lo+to;const dg=Math.floor(v/(to/10))%10;const ans=dg>=5?hi:lo;const word={10:'ten',100:'hundred',1000:'thousand'}[to];
 const q={prompt:`Round <b>${N(v)}</b> to the nearest <b>${word}</b>.`,tpl:'{A}',answer:ans,text:`rd${v}/${to}`,explain:`<p>${N(v)} is between ${N(lo)} and ${N(hi)}.</p><p>Look at the ${PN[String(to).length-2]} digit: ${dg}. ${dg>=5?'5 or more rounds up':'Less than 5 rounds down'}.</p><p>So it rounds to <b>${N(ans)}</b>.</p>`,nudge:`<p>Which ${word} is ${N(v)} closer to?</p>`,fast:12};if(vis&&to<=100)q.vis={t:'rline',lo,hi,v,step:to/10};return q;};
const digitVal=(lo,hi)=>c=>{let n,s;do{n=R(lo,hi);s=String(n);}while(new Set(s).size!==s.length);const i=R(0,s.length-2);const k=s.length-1-i;const d=+s[i];if(!d)return digitVal(lo,hi)(c);const v=d*Math.pow(10,k);
 return {prompt:`In <b>${N(n)}</b>, what is the digit <b>${d}</b> worth?`,tpl:'{A}',answer:v,text:`dv${n}|${d}`,explain:`<p>The ${d} is in the ${PN[k]} place.</p><p>${d} ${PN[k]} = <b>${N(v)}</b>.</p>`,nudge:'<p>Find the place of the digit: ones, tens, hundreds, thousands…</p>',fast:12};};
/* mental math near a round number: 299 + 145, 500 − 199 */
const nearRound=(opx,big)=>c=>{const u=big?1000:100;const r=u*R(big?2:2,big?6:6);const off=PK([1,2,1,1,2]);const n=r-off;
 if(opx==='+'){const b=big?rs(1200,3800,5):R(120,Math.min(580,999-n));const s=n+b;return {tpl:`${N(n)} + ${N(b)} = {A}`,answer:s,text:`nr+${n}+${b}`,explain:`<p>${N(n)} is ${off} less than ${N(r)}.</p><p>${N(r)} + ${N(b)} = ${N(r+b)}, then take away ${off}: <b>${N(s)}</b>.</p>`,nudge:`<p>${N(n)} is almost ${N(r)}. Add ${N(r)}, then fix it.</p>`,fast:15};}
 const a=big?u*R(6,9)+PK([0,0,500]):R(r/100+1,9)*100+PK([0,0,50,R(1,9)*10]);const d=a-n;return {tpl:`${N(a)} − ${N(n)} = {A}`,answer:d,text:`nr-${a}-${n}`,explain:`<p>${N(n)} is ${off} less than ${N(r)}.</p><p>${N(a)} − ${N(r)} = ${N(a-r)}. You took ${off} too many, so add ${off} back: <b>${N(d)}</b>.</p>`,nudge:`<p>Take away ${N(r)} instead, then give back what was extra.</p>`,fast:15};};
const trueFalse=c=>{const a=R(5,10),b=R(1,a-1);const d=a-b;const ok=R(0,1);let x=R(0,d),y=d-x;if(!ok){y+=PK([1,-1]);if(y<0)y=1;}const t=x+y===d;
 return choice({prompt:'Is this true or false?',tpl:`${a} − ${b} = ${x} + ${y}  →  {A}`,text:`tf${a}-${b}=${x}+${y}`,explain:`<p>${a} − ${b} = ${d}. ${x} + ${y} = ${x+y}.</p><p>${t?'Both sides are '+d+', so it is <b>true</b>.':'The sides are not the same, so it is <b>false</b>.'}</p>`,nudge:'<p>Work out each side. The = sign means both sides are the same.</p>',fast:12},t?'true':'false',['true','false']);};
const three=(lo,hi,max)=>c=>{let ns;do{ns=[R(lo,hi),R(lo,hi),R(lo,hi)];}while(sum(ns)>max);const s=sum(ns);return {tpl:ns.join(' + ')+' = {A}',answer:s,text:'t'+ns.join('+'),explain:addEx(ns),nudge:'<p>Look for two numbers that make 10, or add two at a time.</p>',fast:12};};
const cmpSum=(opx)=>c=>{let a,b,v,t;if(opx==='+'){a=R(11,59)*10+PK([0,5]);b=R(11,Math.min(49,Math.floor((980-a)/10)))*10;v=a+b;t=Math.min(900,Math.round(v/100)*100+PK([0,0,100,-100,0]));if(R(0,5)===0)t=v;}
 else{a=R(5,9)*100;b=rs(110,a-110,10)+PK([0,5]);v=a-b;t=Math.round(v/100)*100+PK([0,100,-100]);if(t<=0)t=100;if(R(0,5)===0)t=v;}
 const ls=`${N(a)} ${opx==='+'?'+':'−'} ${N(b)}`;return cmpQ(ls,v,N(t),t,`<p>${ls} = ${N(v)}.</p>`,`cs${ls}?${t}`);};
/* decimal makers (values scaled by 10^dp) */
const dq=(op,gen)=>c=>{let a,b,dp,r;for(let i=0;i<200;i++){[a,b,dp]=gen();r=op==='+'?a+b:a-b;if(r>0&&r%Math.pow(10,dp)!==0)break;}const ad=dpOf(r,dp);
 return {tpl:`${fd(a,dp)} ${op==='+'?'+':'−'} ${fd(b,dp)} = {A}`,answer:r/Math.pow(10,dp-ad),dp:ad,text:`d${a}${op}${b}/${dp}`,explain:decEx(a,b,dp,op),nudge:'<p>Line up the decimal points, then add or subtract like whole numbers.</p>',fast:20};};
const dmiss=(gen,sideL)=>c=>{let a,b,dp;for(let i=0;i<200;i++){[a,b,dp]=gen();if(b%Math.pow(10,dp)!==0&&a%Math.pow(10,dp)!==0)break;}const s=a+b;const L=sideL==null?R(0,1):sideL;const ans=L?a:b,kn=L?b:a;const ad=dpOf(ans,dp);
 return {tpl:L?`{A} + ${fd(b,dp)} = ${fd(s,dp)}`:`${fd(a,dp)} + {A} = ${fd(s,dp)}`,answer:ans/Math.pow(10,dp-ad),dp:ad,text:`dm${L}${a}+${b}`,explain:`<p>Take the part you know from the total.</p><p>${fd(s,dp)} − ${fd(kn,dp)} = <b>${fd(ans,dp)}</b>.</p><p>Check: ${fd(a,dp)} + ${fd(b,dp)} = ${fd(s,dp)}.</p>`,nudge:`<p>What do you add to ${fd(kn,dp)} to make ${fd(s,dp)}?</p>`,fast:25};};
const dmissS=(gen)=>c=>{let a,b,dp;for(let i=0;i<200;i++){[a,b,dp]=gen();if(b%Math.pow(10,dp)!==0&&(a-b)%Math.pow(10,dp)!==0&&a>b)break;}const d=a-b;const ad=dpOf(b,dp);
 return {tpl:`${fd(a,dp)} − {A} = ${fd(d,dp)}`,answer:b/Math.pow(10,dp-ad),dp:ad,text:`dms${a}-${b}`,explain:`<p>${fd(a,dp)} − ${fd(d,dp)} = <b>${fd(b,dp)}</b>.</p><p>Check: ${fd(a,dp)} − ${fd(b,dp)} = ${fd(d,dp)}.</p>`,nudge:`<p>How far is it from ${fd(d,dp)} up to ${fd(a,dp)}?</p>`,fast:25};};
const money=(op,gen)=>c=>{let a,b,r;for(let i=0;i<200;i++){[a,b]=gen();r=op==='+'?a+b:a-b;if(r>0&&r%100!==0)break;}
 return {tpl:`${$$(a)} ${op==='+'?'+':'−'} ${$$(b)} = $ {A}`,answer:r,dp:2,text:`$${a}${op}${b}`,explain:`<p>Line up the dollars and cents.</p><p>Think in cents: ${a} ${op==='+'?'+':'−'} ${b} = ${r} cents.</p><p>${r} cents = <b>${$$(r)}</b>.</p>`,nudge:'<p>Add or subtract the cents, then the dollars. 100 cents make a dollar.</p>',fast:20};};
const dpv=c=>{const o=R(0,9),t=R(1,9),h=PK([0,R(1,9)]);const dp=h?2:1;const v=h?100*o+10*t+h:10*o+t;const form=R(0,1);
 const tpl=form?`${o} + ${t/10}${h?' + '+(h/100).toFixed(2):''} = {A}`:`${o} ${PL(o,'one','ones')}, ${t} ${PL(t,'tenth')}${h?`, ${h} ${PL(h,'hundredth')}`:''} = {A}`;
 return {tpl,answer:v,dp,text:`dpv${tpl}`,explain:`<p>${o} goes in the ones place, ${t} in the tenths place${h?`, ${h} in the hundredths place`:''}.</p><p>That is <b>${fd(v,dp)}</b>.</p>`,nudge:'<p>Ones, then the decimal point, then tenths, then hundredths.</p>',fast:12};};
const cmpDec=c=>{let a,b;const k=R(0,3);const w=R(0,5);if(k===0){a=w*100+R(1,9)*10;b=w*100+R(10,99);}else if(k===1){a=w*100+R(1,9)*10;b=a+PK([-1,1])*R(1,9);}else if(k===2){a=w*100+R(1,9)*10;b=a;}else{a=w*100+R(11,99);b=(w+PK([0,1]))*100+R(1,9);}
 const sa=fd(a,2),sb=k===2?D(b,2):fd(b,2);return cmpQ(sa,a,sb,b,`<p>Write both with hundredths: ${D(a,2)} and ${D(b,2)}.</p><p>Compare ${a} hundredths and ${b} hundredths.</p>`,`cd${sa}?${sb}`);};
const roundDec=c=>{let v;do{v=R(101,999);}while(v%10===0||(v%100>=95)||(v%100<5));const ans=Math.round(v/10);
 return {prompt:`Round <b>${D(v,2)}</b> to the nearest <b>tenth</b>.`,tpl:'{A}',answer:ans,dp:1,text:`rdd${v}`,explain:`<p>${D(v,2)} is between ${D(Math.floor(v/10),1)} and ${D(Math.floor(v/10)+1,1)}.</p><p>The hundredths digit is ${v%10}: ${v%10>=5?'round up':'round down'}.</p><p>Answer: <b>${D(ans,1)}</b>.</p>`,nudge:'<p>Look at the hundredths digit. 5 or more rounds up.</p>',fast:12};};

/* ---------- story problems ---------- */
const TM={d:[['in the morning','in the afternoon','in the evening'],['on Monday','on Tuesday','on Wednesday'],['on Saturday','on Sunday','on Monday']],
 w:[['on Monday','on Tuesday','on Wednesday'],['in May','in June','in July'],['in week one','in week two','in week three']],
 g:[['in level one','in level two','in level three'],['in the first game','in the second game','in the third game']],
 y:[['in June','in July','in August'],['in spring','in summer','in fall']]};
const CT=[
 ['Ms. Rosa','she','cookies','bakes','baked','bake','sells','sold',2,300,'d'],
 ['Ms. Rosa','she','muffins','bakes','baked','bake','sells','sold',2,120,'d'],
 ['Dr. Quartz','he','crystals','finds','found','find','gives away','gave away',2,500,'w'],
 ['Grumbleroot the troll','he','coins','collects','collected','collect','spends','spent',2,999,'w',1],
 ['Skyla the eagle','she','feathers','collects','collected','collect','drops','dropped',2,300,'w'],
 ['Gizmo','he','batteries','buys','bought','buy','uses up','used up',2,100,'w'],
 ['the Elder Wiz','he','lonely socks','finds','found','find','loses','lost',2,60,'d'],
 ['the Grey Goblin','he','socks','steals','stole','steal','drops','dropped',2,200,'d',1],
 ['Nana Paws','she','balls of yarn','buys','bought','buy','uses','used',2,40,'w'],
 ['the Kind Teacher','she','stickers','buys','bought','buy','gives out','gave out',2,600,'w'],
 ['Coach Flex','he','push-ups','does','did','do',0,0,2,200,'d'],
 ['Coach Flex','he','laps','runs','ran','run',0,0,2,40,'w'],
 ['Ozzy','he','ride tickets','sells','sold','sell',0,0,2,999,'w'],
 ['Skyla the eagle','she','miles','flies','flew','fly',0,0,10,999,'w',1],
 ['the Elder Wiz','he','pages','reads','read','read',0,0,10,999,'w'],
 ['Coach Flex','he','steps','walks','walked','walk',0,0,1000,30000,'w'],
 ['Dr. Quartz','he','grains of sand','counts','counted','count','spills','spilled',1000,99999,'w'],
 ['Ozzy','he','train tickets','prints','printed','print','sells','sold',1000,20000,'w'],
 ['Nana Paws','she','dog treats','bakes','baked','bake','gives out','gave out',100,5000,'w'],
 ['Gizmo','he','bolts','buys','bought','buy','uses','used',100,20000,'w'],
 ['Gizmo','he','points','scores','scored','score','loses','lost',100,99999,'g'],
 ['Ozzy','he','people','gives rides to','gave rides to','give rides to',0,0,1000,90000,'y',1],
 ['Skyla the eagle','she','miles','flies','flew','fly',0,0,1000,20000,'y',1],
 ['Ms. Rosa','she','sprinkles','buys','bought','buy','uses','used',1000,60000,'w'],
 ['Grumbleroot the troll','he','gold coins','collects','collected','collect','spends','spent',1000,50000,'y'],
 ['the school library','it','books','buys','bought','buy','lends out','lent out',1000,20000,'y',1]
].map(a=>({n:a[0],p:a[1],P:cap(a[1]),us:a[2],g3:a[3],gp:a[4],g0:a[5],l3:a[6],lp:a[7],lo:a[8],hi:a[9],tc:a[10],solo:a[11],sn:{'Grumbleroot the troll':'the troll','Skyla the eagle':'the eagle','the Grey Goblin':'the Goblin'}[a[0]]||a[0]}));
const both=(t1,t2)=>{const sp=t1.split(' ')[0];return (['on','in'].includes(sp)&&t2.startsWith(sp+' '))?`${t1} and ${t2.slice(sp.length+1)}`:`${t1} and ${t2}`;};
const B=n=>`<b>${N(n)}</b>`;
/* kinds: ns are the numbers; ans = answer; eq = solving steps [text, value]; mid = other sizes the story mentions */
const K={
 join:{ok:([p,q])=>p>0&&q>0,ans:([p,q])=>p+q,mid:([p,q])=>[p+q],eq:([p,q])=>[[`${N(p)} + ${N(q)}`,p+q]],why:'In all means put the amounts together.',nudge:'Put the two amounts together.',
  t:(x,[p,q],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us} ${o.t1}. ${x.P} ${x.gp} ${B(q)} more ${o.t2}. How many ${x.us} did ${x.p} ${x.g0} in all?`},
 sep:{lose:1,ok:([p,q])=>p>0&&q>0,ans:([p,q])=>p,mid:([p,q])=>[p+q],eq:([p,q])=>[[`${N(p+q)} − ${N(q)}`,p]],why:'Some went away, so take them away.',nudge:'Start with all of them and take some away.',
  t:(x,[p,q])=>`${cap(x.n)} has ${B(p+q)} ${x.us}. ${x.P} ${x.l3} ${B(q)} of them. How many ${x.us} does ${x.p} have now?`},
 cmp:{ok:([p,q])=>p>0&&q>0,ans:([p,q])=>q,mid:([p,q])=>[p+q],eq:([p,q])=>[[`${N(p+q)} − ${N(p)}`,q]],why:'To find how many more or fewer, take the smaller number from the bigger one.',nudge:'Which is bigger? Find the difference.',
  t:(x,[p,q],o)=>{const sw=R(0,1);const tb=sw?o.t2:o.t1,ts=sw?o.t1:o.t2;const v1=sw?p:p+q,v2=sw?p+q:p;return `${cap(x.n)} ${x.gp} ${B(v1)} ${x.us} ${o.t1} and ${B(v2)} ${x.us} ${o.t2}. How many more ${x.us} did ${x.p} ${x.g0} ${tb} than ${ts}?`;}},
 part:{ok:([p,q])=>p>0&&q>0,ans:([p,q])=>q,mid:([p,q])=>[p+q],eq:([p,q])=>[[`${N(p+q)} − ${N(p)}`,q]],why:'You know the total and one part. Take that part away from the total.',nudge:'You know the total and one part. What is the other part?',
  t:(x,[p,q],o)=>`${cap(both(o.t1,o.t2))}, ${x.n} ${x.gp} ${B(p+q)} ${x.us} in all. ${x.P} ${x.gp} ${B(p)} ${o.t1}. How many ${x.us} did ${x.p} ${x.g0} ${o.t2}?`},
 change:{ok:([p,q])=>p>0&&q>0,ans:([p,q])=>q,mid:([p,q])=>[p+q],eq:([p,q])=>[[`${N(p+q)} − ${N(p)}`,q]],why:'Find the missing part: take the first amount from the total.',nudge:'You know the start and the total. What was added?',
  t:(x,[p,q],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us} ${o.t1}. ${x.P} ${x.gp} some more ${o.t2}. ${x.P} ${x.gp} ${B(p+q)} ${x.us} in all. How many ${x.us} did ${x.p} ${x.g0} ${o.t2}?`},
 startS:{lose:1,ok:([p,q])=>p>0&&q>0,ans:([p,q])=>p+q,mid:()=>[],eq:([p,q])=>[[`${N(p)} + ${N(q)}`,p+q]],why:'Put back the ones that went away to find the start.',nudge:'Some went away. Put them back to find the start.',
  t:(x,[p,q])=>`${cap(x.n)} had some ${x.us}. ${x.P} ${x.lp} ${B(q)} of them. Now ${x.p} has ${B(p)} left. How many ${x.us} did ${x.p} have at the start?`},
 startJ:{lose:1,ok:([p,q])=>p>0&&q>0,ans:([p,q])=>p,mid:([p,q])=>[p+q],eq:([p,q])=>[[`${N(p+q)} − ${N(q)}`,p]],why:'Take away the ones that were added to find the start.',nudge:'Some were added. Take them away to find the start.',
  t:(x,[p,q])=>`${cap(x.n)} had some ${x.us}. Then ${x.p} ${x.gp} ${B(q)} more. Now ${x.p} has ${B(p+q)}. How many ${x.us} did ${x.p} have at the start?`},
 more:{who:1,ok:([p,q])=>p>0&&q>0,ans:([p,q])=>p+q,mid:()=>[],eq:([p,q])=>[[`${N(p)} + ${N(q)}`,p+q]],why:'"More than" means add on.',nudge:'Is the answer bigger or smaller than the first number?',
  t:(x,[p,q],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us}. ${cap(o.who)} ${x.gp} ${B(q)} more ${x.us} than ${x.sn}. How many ${x.us} did ${o.who} ${x.g0}?`},
 fewer:{who:1,ok:([p,q])=>p>0&&q>0,ans:([p,q])=>p,mid:([p,q])=>[p+q],eq:([p,q])=>[[`${N(p+q)} − ${N(q)}`,p]],why:'"Fewer than" means take away.',nudge:'Is the answer bigger or smaller than the first number?',
  t:(x,[p,q],o)=>`${cap(x.n)} ${x.gp} ${B(p+q)} ${x.us}. ${cap(o.who)} ${x.gp} ${B(q)} fewer ${x.us} than ${x.sn}. How many ${x.us} did ${o.who} ${x.g0}?`},
 /* two steps */
 js:{lose:1,ok:([p,q,r])=>r<p+q&&r!==q,ans:([p,q,r])=>p+q-r,mid:([p,q])=>[p+q],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} − ${N(r)}`,p+q-r]],why:'First add what came in, then take away what went out.',nudge:'Two steps: first add, then take away.',
  t:(x,[p,q,r])=>`${cap(x.n)} has ${B(p)} ${x.us}. ${x.P} ${x.g3} ${B(q)} more. Then ${x.p} ${x.l3} ${B(r)}. How many ${x.us} does ${x.p} have now?`},
 ss:{lose:1,ok:([p,q,r])=>q+r<p,ans:([p,q,r])=>p-q-r,mid:()=>[],eq:([p,q,r])=>[[`${N(p)} − ${N(q)}`,p-q],[`${N(p-q)} − ${N(r)}`,p-q-r]],why:'Take away twice.',nudge:'Two steps: take away, then take away again.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} has ${B(p)} ${x.us}. ${x.P} ${x.l3} ${B(q)} ${o.t1}. Then ${x.p} ${x.l3} ${B(r)} more ${o.t2}. How many ${x.us} does ${x.p} have now?`},
 sj:{lose:1,ok:([p,q,r])=>q<p&&r!==q,ans:([p,q,r])=>p-q+r,mid:([p,q,r])=>[p-q+r],eq:([p,q,r])=>[[`${N(p)} − ${N(q)}`,p-q],[`${N(p-q)} + ${N(r)}`,p-q+r]],why:'First take away, then add.',nudge:'Two steps: first take away, then add.',
  t:(x,[p,q,r])=>`${cap(x.n)} has ${B(p)} ${x.us}. ${x.P} ${x.l3} ${B(q)} of them. Then ${x.p} ${x.g3} ${B(r)} more. How many ${x.us} does ${x.p} have now?`},
 jjj:{ok:()=>true,ans:([p,q,r])=>p+q+r,mid:([p,q,r])=>[p+q+r],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} + ${N(r)}`,p+q+r]],why:'Add all three amounts.',nudge:'Add the first two, then add the third.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us} ${o.t1}, ${B(q)} ${o.t2} and ${B(r)} ${o.t3}. How many ${x.us} did ${x.p} ${x.g0} in all?`},
 mt:{who:1,ok:()=>true,ans:([p,q])=>2*p+q,mid:([p,q])=>[2*p+q],eq:([p,q])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p)} + ${N(p+q)}`,2*p+q]],why:'First find how many the second one got. Then add both.',nudge:'Step 1: how many did the second one get? Step 2: add them together.',
  t:(x,[p,q],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us}. ${cap(o.who)} ${x.gp} ${B(q)} more ${x.us} than ${x.sn}. How many ${x.us} did they ${x.g0} together?`},
 ft:{who:1,ok:([p,q])=>q<p,ans:([p,q])=>2*p-q,mid:([p,q])=>[2*p-q],eq:([p,q])=>[[`${N(p)} − ${N(q)}`,p-q],[`${N(p)} + ${N(p-q)}`,2*p-q]],why:'First find how many the second one got. Then add both.',nudge:'Step 1: how many did the second one get? Step 2: add them together.',
  t:(x,[p,q],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us}. ${cap(o.who)} ${x.gp} ${B(q)} fewer ${x.us} than ${x.sn}. How many ${x.us} did they ${x.g0} together?`},
 cmp2:{who:1,ok:([p,q,r])=>r<p+q-1,ans:([p,q,r])=>r,mid:([p,q,r])=>[p+q,p+q-r],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} − ${N(p+q-r)}`,r]],why:'First find the total for the first one. Then find the difference.',nudge:'Step 1: add the two days. Step 2: compare.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us} ${o.t1} and ${B(q)} ${x.us} ${o.t2}. ${cap(o.who)} ${x.gp} ${B(p+q-r)} ${x.us} in all. How many more ${x.us} did ${x.sn} ${x.g0} than ${o.who}?`},
 jt:{lose:1,ok:([p,q,r])=>r<p+q&&r!==p&&r!==q,ans:([p,q,r])=>p+q-r,mid:([p,q])=>[p+q],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} − ${N(r)}`,p+q-r]],why:'First add both times together, then take away.',nudge:'Two steps: add both times, then take away.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us} ${o.t1} and ${B(q)} ${o.t2}. Then ${x.p} ${x.lp} ${B(r)} of them. How many ${x.us} does ${x.p} have left?`},
 mm:{who:1,ok:()=>true,ans:([p,q,r])=>p+q+r,mid:([p,q,r])=>[p+q,p+q+r],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} + ${N(r)}`,p+q+r]],why:'Find the second one first. Then find the third one.',nudge:'Step 1: how many for the second one? Step 2: the third one.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us}. ${cap(o.who)} ${x.gp} ${B(q)} more than ${x.sn}. ${cap(o.who2)} ${x.gp} ${B(r)} more than ${o.who}. How many ${x.us} did ${o.who2} ${x.g0}?`},
 sm:{who:1,ok:([p,q])=>q<p,ans:([p,q,r])=>p-q+r,mid:([p,q])=>[p-q],eq:([p,q,r])=>[[`${N(p)} − ${N(q)}`,p-q],[`${N(p-q)} + ${N(r)}`,p-q+r]],why:'Find the second one first. Then find the third one.',nudge:'Step 1: how many for the second one? Step 2: the third one.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us}. ${cap(o.who)} ${x.gp} ${B(q)} fewer than ${x.sn}. ${cap(o.who2)} ${x.gp} ${B(r)} more than ${o.who}. How many ${x.us} did ${o.who2} ${x.g0}?`},
 ms:{who:1,lose:1,ok:([p,q,r])=>r<p+q&&r!==q,ans:([p,q,r])=>p+q-r,mid:([p,q])=>[p+q],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} − ${N(r)}`,p+q-r]],why:'First find how many the second one had. Then take away.',nudge:'Step 1: how many did the second one have? Step 2: take away.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} has ${B(p)} ${x.us}. ${cap(o.who)} has ${B(q)} more than ${x.sn}. Then ${o.who} gives away ${B(r)} of ${({'Ms. Rosa':'her','Nana Paws':'her','the Kind Teacher':'her'})[o.who]||(OTH.includes(o.who)?'his':'the')} ${x.us}. How many ${x.us} does ${o.who} have now?`},
 sc:{who:1,lose:1,ok:([p,q,r])=>p-r-q>=2,ans:([p,q,r])=>p-r-q,mid:([p,q,r])=>[p-r],eq:([p,q,r])=>[[`${N(p)} − ${N(r)}`,p-r],[`${N(p-r)} − ${N(q)}`,p-r-q]],why:'First take away. Then compare.',nudge:'Step 1: how many are left? Step 2: how many more than the other one?',
  t:(x,[p,q,r],o)=>`${cap(x.n)} has ${B(p)} ${x.us}. ${cap(o.who)} has ${B(q)} ${x.us}. Then ${x.sn} ${x.l3} ${B(r)} of ${({he:'his',she:'her',it:'its'})[x.p]} ${x.us}. How many more ${x.us} does ${x.sn} have than ${o.who} now?`},
 bats:{ok:([p,q,r])=>q<p&&r<q&&r>0,ans:([p,q,r])=>p-q+r,mid:()=>[],eq:([p,q,r])=>[[`${N(p)} − ${N(q)}`,p-q],[`${N(p-q)} + ${N(r)}`,p-q+r]],why:'Take away the bats that flew out. Then add the ones that came back.',nudge:'Two steps: out means take away, back in means add.',
  own:([p,q,r])=>[`There are ${B(p)} bats in the cave. ${B(q)} bats fly out at night. Then ${B(r)} bats fly back in. How many bats are in the cave now?`,'bats']},
 kid2:{ok:([p,q,r])=>r<p+q&&r!==q&&r!==p,ans:([p,q,r])=>p+q-r,mid:([p,q])=>[p+q],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} − ${N(r)}`,p+q-r]],why:'First add what you win. Then take away what you spend.',nudge:'Two steps: add, then take away.',
  own:([p,q,r])=>[`You have ${B(p)} gems. You win ${B(q)} more in a battle. Then you spend ${B(r)} at the shop. How many gems do you have now?`,'gems']},
 /* three steps */
 jjs:{lose:1,ok:([p,q,r,s])=>s<p+q+r,ans:([p,q,r,s])=>p+q+r-s,mid:([p,q,r])=>[p+q+r],eq:([p,q,r,s])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} + ${N(r)}`,p+q+r],[`${N(p+q+r)} − ${N(s)}`,p+q+r-s]],why:'Add what came in, then take away what went out.',nudge:'Three steps: add, add again, then take away.',
  t:(x,[p,q,r,s],o)=>`${cap(x.n)} has ${B(p)} ${x.us}. ${x.P} ${x.g3} ${B(q)} more ${o.t1} and ${B(r)} more ${o.t2}. Then ${x.p} ${x.l3} ${B(s)}. How many ${x.us} does ${x.p} have now?`},
 mt3:{who:1,ok:([p,q,r])=>r<p+q,ans:([p,q,r])=>3*p+2*q-r,mid:([p,q,r])=>[p+q,3*p+2*q-r],eq:([p,q,r])=>[[`${N(p)} + ${N(q)}`,p+q],[`${N(p+q)} − ${N(r)}`,p+q-r],[`${N(p)} + ${N(p+q)} + ${N(p+q-r)}`,3*p+2*q-r]],why:'Find each one first, then add all three.',nudge:'Find the second one, then the third one, then add all three.',
  t:(x,[p,q,r],o)=>`${cap(x.n)} ${x.gp} ${B(p)} ${x.us}. ${cap(o.who)} ${x.gp} ${B(q)} more than ${x.sn}. ${cap(o.who2)} ${x.gp} ${B(r)} fewer than ${o.who}. How many ${x.us} did all three ${x.g0} together?`}
};
/* special stories (fixed settings): f(ns,c) → [prompt, unit] using the same numbers as the kind */
const SP=[
 {k:'join',lo:2,hi:999,f:([p,q])=>[`You have ${B(p)} gems. You win ${B(q)} more in a battle. How many gems do you have now?`,'gems']},
 {k:'join',lo:2,hi:30,f:([p,q],c)=>[`You give ${c.pet} ${B(p)} treats in the morning and ${B(q)} treats at night. How many treats do you give in all?`,'treats']},
 {k:'join',lo:2,hi:150,f:([p,q])=>[`There are ${B(p)} riders on Ozzy's train. At the next stop, ${B(q)} more riders get on. How many riders are on the train now?`,'riders']},
 {k:'join',lo:1000,hi:90000,f:([p,q])=>[`${B(p)} fans came to Coach Flex's game on Saturday. ${B(q)} fans came on Sunday. How many fans came in all?`,'fans']},
 {k:'join',lo:100,hi:20000,f:([p,q])=>[`The wishing fountain had ${B(p)} coins in it. Visitors threw in ${B(q)} more. How many coins are in the fountain now?`,'coins']},
 {k:'sep',lo:2,hi:999,f:([p,q])=>[`You have ${B(p+q)} gems. You spend ${B(q)} of them in the shop. How many gems do you have left?`,'gems']},
 {k:'sep',lo:2,hi:30,f:([p,q],c)=>[`You have ${B(p+q)} treats. You give ${B(q)} of them to ${c.pet}. How many treats do you have left?`,'treats']},
 {k:'sep',lo:2,hi:150,f:([p,q])=>[`There are ${B(p+q)} riders on Ozzy's train. At the next stop, ${B(q)} riders get off. How many riders are still on the train?`,'riders']},
 {k:'sep',lo:1000,hi:90000,f:([p,q])=>[`The stadium has ${B(p+q)} seats. ${B(q)} fans are sitting in them. How many seats are empty?`,'seats']},
 {k:'sep',lo:100,hi:5000,f:([p,q])=>[`The Elder Wiz's spell book has ${B(p+q)} pages. He has read ${B(q)} pages. How many pages are left to read?`,'pages']},
 {k:'cmp',lo:2,hi:999,f:([p,q],c)=>[`${c.name} has ${B(p+q)} gems. Gizmo has ${B(p)} gems. How many more gems does ${c.name} have than Gizmo?`,'gems']},
 {k:'cmp',lo:10,hi:200,f:([p,q])=>[`Ozzy's red train has ${B(p+q)} seats. His blue train has ${B(p)} seats. How many more seats does the red train have?`,'seats']},
 {k:'cmp',lo:1000,hi:90000,f:([p,q])=>[`The Red Team's stadium holds ${B(p+q)} fans. The Blue Team's stadium holds ${B(p)} fans. How many more fans does the Red Team's stadium hold?`,'fans']},
 {k:'cmp',lo:100,hi:5000,f:([p,q])=>[`Coach Flex's mountain is ${B(p+q)} steps to the top. He has climbed ${B(p)} steps. How many more steps must he climb?`,'steps']},
 {k:'startS',lo:2,hi:150,f:([p,q])=>[`Some riders were on Ozzy's train. At the stop, ${B(q)} riders got off. Now ${B(p)} riders are on the train. How many riders were on the train before the stop?`,'riders']},
 {k:'part',lo:2,hi:20,f:([p,q],c)=>[`${cap(c.pet)} has ${B(p+q)} toys. ${B(p)} are balls and the rest are bones. How many bones are there?`,'bones']}
];
TM.c=[['in the first cave','in the second cave','in the third cave'],['on Monday','on Tuesday','on Wednesday'],['in the morning','in the afternoon','in the evening']];
/* Subtraction Caves: its own settings */
const CTS=[
 ['Dr. Quartz','he','crystals','digs up','dug up','dig up','trades','traded',2,800,'c'],
 ['Gizmo','he','gems','digs up','dug up','dig up','sells','sold',2,60000,'c'],
 ['Grumbleroot the troll','he','cave mushrooms','picks','picked','pick','eats','ate',2,200,'d',1],
 ['the Elder Wiz','he','glow stones','finds','found','find','uses','used',2,300,'c'],
 ['Nana Paws','she','candles','buys','bought','buy','burns','burned',2,120,'w'],
 ['the Kind Teacher','she','fossils','finds','found','find','lends','lent',2,500,'c'],
 ['the Grey Goblin','he','gold nuggets','steals','stole','steal','drops','dropped',2,300,'d',1],
 ['Ms. Rosa','she','bags of trail mix','packs','packed','pack','hands out','handed out',2,200,'d'],
 ['Ozzy','he','rocks','loads','loaded','load','drops off','dropped off',2,999,'d'],
 ['Coach Flex','he','cave steps','climbs','climbed','climb',0,0,10,9000,'c'],
 ['Dr. Quartz','he','bats','counts','counted','count',0,0,1000,90000,'y',1],
 ['Gizmo','he','feet of tunnel','drills','drilled','drill',0,0,100,20000,'w',1],
 ['Grumbleroot the troll','he','gold coins','collects','collected','collect','spends','spent',1000,50000,'y',1],
 ['the crystal shop','it','crystals','buys','bought','buy','sells','sold',1000,20000,'w',1],
 ['Nana Paws','she','glow beads','strings','strung','string','uses','used',100,5000,'w']
].map(a=>({n:a[0],p:a[1],P:cap(a[1]),us:a[2],g3:a[3],gp:a[4],g0:a[5],l3:a[6],lp:a[7],lo:a[8],hi:a[9],tc:a[10],solo:a[11],sn:{'Grumbleroot the troll':'the troll','the Grey Goblin':'the Goblin'}[a[0]]||a[0]}));
const SPC=[
 {k:'sep',lo:2,hi:999,f:([p,q])=>[`You have ${B(p+q)} gems. You spend ${B(q)} of them at the Cave Shop. How many gems do you have left?`,'gems']},
 {k:'sep',lo:2,hi:150,f:([p,q])=>[`There are ${B(p+q)} rocks in Ozzy's mine cart. He takes out ${B(q)} of them. How many rocks are still in the cart?`,'rocks']},
 {k:'sep',lo:2,hi:90000,f:([p,q])=>[`There are ${B(p+q)} bats in the cave. ${B(q)} bats fly out to hunt. How many bats are still in the cave?`,'bats']},
 {k:'cmp',lo:10,hi:5000,f:([p,q])=>[`The Deep Cave is ${B(p+q)} feet deep. The Small Cave is ${B(p)} feet deep. How many feet deeper is the Deep Cave?`,'feet']},
 {k:'cmp',lo:2,hi:999,f:([p,q],c)=>[`${c.name} found ${B(p+q)} gems in the cave. Gizmo found ${B(p)} gems. How many more gems did ${c.name} find than Gizmo?`,'gems']},
 {k:'startS',lo:2,hi:90000,f:([p,q])=>[`Some bats were in the cave. ${B(q)} bats flew out. Now ${B(p)} bats are in the cave. How many bats were in the cave at first?`,'bats']},
 {k:'part',lo:2,hi:20,f:([p,q])=>[`Dr. Quartz has ${B(p+q)} crystals. ${B(p)} are purple and the rest are green. How many crystals are green?`,'crystals']}
];
const CAP={1:100,2:1000,3:999};
const OTH=['Ms. Rosa','Dr. Quartz','Coach Flex','the Elder Wiz','Gizmo','Nana Paws','Ozzy','the Kind Teacher'];
let RECENT=[];  /* the last few settings used, so the same character or thing doesn't come back at once */
let RECN=[],RECA=[];  /* recent numbers and answers, so two stories in a row never share them */
function story(kind,ns,c,cave,loose){const k=K[kind];if(ns.some(v=>v===1)||!k.ok(ns))return null;const ans=k.ans(ns);if(!(ans>=2))return null;
 const nk=ns.slice().sort((a,b)=>a-b).join(',');if(!loose&&(RECN.includes(nk)||RECA.includes(ans)))return null;
 const all=ns.concat(k.mid(ns),[ans]);const mx=Math.max(...all);if(mx>20&&Math.min(...ns)<mx/25)return null;if(CAP[c.grade]&&mx>CAP[c.grade])return null;
 const CL=cave?CTS:CT,SL=cave?SPC:SP;let opts=k.own?[{s:{f:k.own,own:1}}]:CL.filter(x=>x.lo<=mx&&mx<=x.hi&&(!k.lose||x.l3)&&!(k.who&&x.solo)).map(x=>({x}));if(!k.own)SL.filter(s=>s.k===kind&&s.lo<=mx&&mx<=s.hi).forEach(s=>opts.push({s}));
 const sid=o=>o.own?'own'+kind:(cave?'spc':'sp')+SL.indexOf(o);const fresh=opts.filter(o=>o.s?!RECENT.includes(sid(o.s)):!RECENT.includes(o.x.n)&&!RECENT.includes(o.x.us.replace('lonely ','')));if(fresh.length)opts=fresh;
 if(!opts.length)return null;const o=PK(opts);let prompt,unit,id;RECENT=RECENT.concat(o.s?[sid(o.s)]:[o.x.n,o.x.us.replace('lonely ','')]).slice(-6);RECN=RECN.concat([nk]).slice(-10);RECA=RECA.concat([ans]).slice(-3);
 if(o.s){[prompt,unit]=o.s.f(ns,c);id=sid(o.s);}else{const x=o.x;const tt=PK(TM[x.tc]);const w=SH(OTH.filter(v=>v!==x.n).concat([c.name]));prompt=k.t(x,ns,{t1:tt[0],t2:tt[1],t3:tt[2],who:w[0],who2:w[1]});unit=x.us;id=x.n+x.us;}
 const eq=k.eq(ns);if(c.grade===1&&eq.some(e=>{const m=String(e[0]).replace(/,/g,'').match(/^(\d+) − (\d+)$/);return m&&+m[1]>20&&+m[2]>=10&&(+m[1]%10)<(+m[2]%10);}))return null;
 const steps=eq.map((e,i)=>`${e[0]} = ${i===eq.length-1?'<b>'+N(e[1])+'</b>':N(e[1])}`);
 RECK=RECK.concat([kind]).slice(-3);return {prompt,tpl:'{A} '+unit,answer:ans,tk:/ bats /.test(prompt)?'bats':TKN[kind]||kind,text:`${kind}|${id}|${ns.join(',')}`,explain:`<p>${k.why}</p><p>${steps.join('<br>')}</p>`,nudge:`<p>${k.nudge}</p>`,wp:1,fast:eq.length>=3?60:eq.length===2?45:mx>100?30:25};}
/* story maker: kinds to choose from, and a number generator gen() → [p,q,(r,s)] */
let RECK=[];  /* the story kinds used last, so a maker with several kinds rotates them */
const TKN={join:'join',sep:'take-away',cmp:'compare',part:'unknown-part',change:'unknown-change',startS:'unknown-start',startJ:'unknown-start',more:'more-than',fewer:'fewer-than',js:'two-step-buy-use',ss:'two-step-use-twice',sj:'two-step-use-buy',jjj:'three-amounts',mt:'more-than-together',ft:'fewer-than-together',cmp2:'two-day-compare',jt:'two-days-then-use',mm:'chain',sm:'chain',ms:'more-then-use',sc:'use-then-compare',bats:'bats',kid2:'gems-win-spend',jjs:'three-step-buy-use',mt3:'chain-of-three'};
const ST=(kinds,gen,cave)=>c=>{const pool=kinds.filter(k=>!RECK.includes(k));for(let i=0;i<160;i++){const q=story(PK(i<60&&pool.length?pool:kinds),gen(),c,cave,i>=120);if(q)return q;}const [p,q]=[R(5,9),R(2,5)];return story(cave?'sep':'join',[p,q],c,cave,1);};

/* estimate stories: round each number, then add or subtract */
const estStory=(op,to,cave)=>c=>{const word=to===100?'hundred':'thousand';const pk=(lo,hi)=>{let v;do{v=R(lo,hi);}while(Math.abs(v%to-to/2)<to*0.08||v%to<to*0.05);return v;};
 let a,b;if(op==='+'){const hi=to*(to===100?4.4:6.4);a=pk(to*1.2,hi);b=pk(to*1.2,hi);}else{a=pk(to*4.6,to*9.4);b=pk(to*1.2,a-to*2.2);}const ra=Math.round(a/to)*to,rb=Math.round(b/to)*to;const ans=op==='+'?ra+rb:ra-rb;
 const S=to===100?(op==='+'?[[`Ozzy's train carried ${B(a)} riders on Saturday and ${B(b)} riders on Sunday.`,'About how many riders is that in all?','riders'],[`Grumbleroot the troll collected ${B(a)} coins in May and ${B(b)} in June.`,'About how many coins did he collect in all?','coins']]:
   [[`Dr. Quartz has ${B(a)} crystals. He gives away ${B(b)} of them.`,'About how many crystals does he have left?','crystals'],[`The Elder Wiz's book has ${B(a)} pages. He has read ${B(b)} pages.`,'About how many pages are left?','pages']])
  :(op==='+'?[[`${B(a)} fans came to Coach Flex's game on Saturday and ${B(b)} came on Sunday.`,'About how many fans came in all?','fans'],[`Coach Flex walked ${B(a)} steps on Monday and ${B(b)} steps on Tuesday.`,'About how many steps did he walk in all?','steps']]:
   [[`The stadium has ${B(a)} seats. ${B(b)} fans came to the game.`,'About how many seats are empty?','seats'],[`Skyla the eagle flew ${B(a)} miles this year. Last year she flew ${B(b)} miles.`,'About how many more miles did she fly this year?','miles']]);
 const s=cave?PK([[`There are ${B(a)} bats in the cave. ${B(b)} bats fly out at night.`,'About how many bats are still in the cave?','bats'],[`Gizmo's drill must dig ${B(a)} feet of tunnel. It has dug ${B(b)} feet so far.`,'About how many feet are left to dig?','feet']]):PK(S);return {prompt:`${s[0]} ${s[1]} Round each number to the nearest ${word} first.`,tpl:`about {A} ${s[2]}`,answer:ans,text:`est${op}${a},${b}`,wp:1,
  explain:`<p>${N(a)} rounds to ${N(ra)}. ${N(b)} rounds to ${N(rb)}.</p><p>${N(ra)} ${op==='+'?'+':'−'} ${N(rb)} = <b>${N(ans)}</b>.</p>`,nudge:`<p>Round each number to the nearest ${word}, then ${op==='+'?'add':'subtract'} the round numbers.</p>`,fast:40};};

/* decimal and money stories */
const DJ=[ // [who, pronoun, unit, past verb, base verb]
 ['Skyla the eagle','she','miles','flew','fly'],['Coach Flex','he','kilometers','ran','run'],['Nana Paws','she','miles','walked','walk'],['Gizmo\'s robot','it','meters','rolled','roll'],['Ozzy\'s train','it','miles','went','go']];
const DS=[ // separate: [start text(x), take text(y), question, unit]
 (x,y)=>[`Nana Paws has ${x} meters of yarn. She uses ${y} meters for a scarf.`,'How many meters of yarn are left?','meters'],
 (x,y)=>[`Gizmo's jug holds ${x} liters of water. He pours out ${y} liters for his robot.`,'How many liters are left in the jug?','liters'],
 (x,y)=>[`Ms. Rosa has ${x} kilograms of flour. She uses ${y} kilograms for bread.`,'How many kilograms of flour are left?','kilograms'],
 (x,y)=>[`Coach Flex must run ${x} kilometers. He has run ${y} kilometers so far.`,'How many more kilometers must he run?','kilometers'],
 (x,y)=>[`Dr. Quartz's blue crystal is ${x} cm long. His green crystal is ${y} cm long.`,'How many centimeters longer is the blue crystal?','cm']];
const decStory=(op,gen)=>c=>Object.assign(decStory0(op,gen)(c),{tk:'decimal-story'+op});
const decStory0=(op,gen)=>c=>{let a,b,dp,r;for(let i=0;i<200;i++){[a,b,dp]=gen();r=op==='+'?a+b:a-b;if(r>0&&r%Math.pow(10,dp)!==0)break;}const ad=dpOf(r,dp);const xa=`<b>${fd(a,dp)}</b>`,xb=`<b>${fd(b,dp)}</b>`;let pr,unit,id;
 if(op==='+'){const j=PK(DJ);const tt=PK([['in the morning','in the afternoon'],['on Monday','on Tuesday']]);pr=`${cap(j[0])} ${j[3]} ${xa} ${j[2]} ${tt[0]} and ${xb} ${j[2]} ${tt[1]}. How many ${j[2]} did ${j[1]} ${j[4]} in all?`;unit=j[2];id=j[0];}
 else{const k=R(0,DS.length-1);const s=DS[k](xa,xb);pr=s[0]+' '+s[1];unit=s[2];id=k;}
 return {prompt:pr,tpl:'{A} '+unit,answer:r/Math.pow(10,dp-ad),dp:ad,text:`ds${op}${id}${a},${b}`,wp:1,explain:`<p>${op==='+'?'Put the two amounts together.':'Find the difference: subtract.'}</p>`+decEx(a,b,dp,op),nudge:'<p>Line up the decimal points first.</p>',fast:35};};
const ITEMS=[['a muffin',150,450],['a juice',95,325],['a cookie',45,175],['a ball of yarn',225,695],['a battery',125,475],['a toy wand',350,995],['a sticker book',275,850],['a train ticket',175,600],['a crystal',250,1250],['a cupcake',125,395]];
const it=()=>{const x=PK(ITEMS);return [x[0],rs(x[1],x[2],5)];};
const moneyStory=(op)=>c=>{let a,b,r,pr,id;for(let i=0;i<200;i++){if(op==='+'){const x=it(),y=it();if(x[0]===y[0])continue;a=x[1];b=y[1];r=a+b;const who=PK(['You','Nana Paws','Gizmo','Coach Flex','The Elder Wiz']);
   pr=`At the Forest Market, ${x[0]} costs <b>${$$(a)}</b> and ${y[0]} costs <b>${$$(b)}</b>. How much do they cost together?`;id=x[0]+y[0];}
  else{const x=it();b=x[1];const k=R(0,2);if(k===0){a=PK([500,1000,2000]);pr=`You buy ${x[0]} for <b>${$$(b)}</b>. You pay with a <b>${$$(a).replace('.00','')}</b> bill. How much change do you get?`;}
   else if(k===1){a=rs(b+55,b+900,5);pr=`You have <b>${$$(a)}</b>. You buy ${x[0]} for <b>${$$(b)}</b>. How much money do you have left?`;}
   else{a=b;b=rs(Math.max(5,a-900),a-55,5);pr=`${x[0].replace(/^a /,'A ')} costs <b>${$$(a)}</b>. Gizmo has <b>${$$(b)}</b>. How much more money does he need?`;}id=x[0]+k;r=a-b;}
  if(r>0&&r%100!==0&&a>b-(op==='+'?99999:0))break;}
 return {prompt:pr,tpl:'$ {A}',answer:r,dp:2,text:`ms${op}${id}${a},${b}`,wp:1,explain:`<p>${op==='+'?'Add the prices.':'Subtract to find what is left.'}</p><p>Think in cents: ${a} ${op==='+'?'+':'−'} ${b} = ${r} cents.</p><p>That is <b>${$$(r)}</b>.</p>`,nudge:'<p>Line up dollars and cents.</p>',fast:35};};
/* multi-step money: change after buying 2 or 3 things */
const changeStory=(n,bill)=>c=>Object.assign(changeStory0(n,bill)(c),{tk:'market-change'});
const changeStory0=(n,bill)=>c=>{let xs,t;do{xs=SH(ITEMS).slice(0,n).map(x=>[x[0],rs(x[1],Math.min(x[2],n===3?700:900),5)]);t=sum(xs.map(x=>x[1]));}while(t>=bill-50||(bill-t)%100===0);
 const who=PK([['You','buy','You pay','do you get'],['Nana Paws','buys','She pays','does she get'],['Gizmo','buys','He pays','does he get'],['the Elder Wiz','buys','He pays','does he get'],['Coach Flex','buys','He pays','does he get']]);
 const list=xs.map(x=>`${x[0]} for <b>${$$(x[1])}</b>`);const L=list.length===2?list.join(' and '):list.slice(0,-1).join(', ')+' and '+list[list.length-1];
 const r=bill-t;const steps=[];let run=xs[0][1];for(let i=1;i<xs.length;i++){steps.push(`${$$(run)} + ${$$(xs[i][1])} = ${$$(run+xs[i][1])}`);run+=xs[i][1];}steps.push(`$${bill/100}.00 − ${$$(t)} = <b>${$$(r)}</b>`);
 return {prompt:`At the Forest Market, ${who[0]==='You'?'you':who[0]} ${who[1]} ${L}. ${who[2]} with a <b>$${bill/100}</b> bill. How much change ${who[3]}?`,
  tpl:'$ {A}',answer:r,dp:2,text:`ch${xs.map(x=>x[0]+x[1]).join(',')}`,wp:1,explain:`<p>First add the prices, then take the total from $${bill/100}.</p><p>${steps.join('<br>')}</p>`,nudge:'<p>Step 1: add up the prices. Step 2: subtract the total from the bill.</p>',fast:60};};
/* two- and three-step decimal stories */
const dec2=(dp,three,kk)=>c=>{const u=Math.pow(10,dp);let a,b,t,x,r;const g=()=>dp===1?rs(11,59):rs(105,595,5);
 for(let i=0;i<300;i++){a=g();b=g();x=three?g():0;t=(R(Math.ceil((a+b+x)/u)+1,Math.ceil((a+b+x)/u)+4))*u;r=t-a-b-x;if(r>0&&r%u!==0&&(a%u)&&(b%u))break;}const ad=dpOf(r,dp);const f=v=>`<b>${fd(v,dp)}</b>`;
 const k=kk==null?R(0,1):kk;let pr,unit;if(k===0){pr=`Skyla the eagle wants to fly ${f(t)} miles today. She flies ${f(a)} miles in the morning${three?`, ${f(x)} miles at noon`:''} and ${f(b)} miles in the afternoon. How many more miles must she fly?`;unit='miles';}
 else{pr=`Ms. Rosa has ${f(t)} kilograms of flour. She uses ${f(a)} kilograms for bread${three?`, ${f(x)} kilograms for cookies`:''} and ${f(b)} kilograms for a cake. How many kilograms of flour are left?`;unit='kilograms';}
 const parts=three?[a,x,b]:[a,b];const st=[];let run=parts[0];for(let i=1;i<parts.length;i++){st.push(`${fd(run,dp)} + ${fd(parts[i],dp)} = ${fd(run+parts[i],dp)}`);run+=parts[i];}st.push(`${fd(t,dp)} − ${fd(run,dp)} = <b>${fd(r,dp)}</b>`);
 return {prompt:pr,tpl:'{A} '+unit,answer:r/Math.pow(10,dp-ad),dp:ad,text:`d2${k}${t},${a},${b},${x}`,wp:1,explain:`<p>First add what was used, then subtract from the total.</p><p>${st.join('<br>')}</p>`,nudge:'<p>Step 1: add the parts. Step 2: take that from the total.</p>',fast:60};};

const dec3=c=>{let ns;do{ns=[R(11,49),R(11,39),R(11,29)];}while(sum(ns)%10===0);const s=sum(ns);
 return {tpl:ns.map(v=>fd(v,1)).join(' + ')+' = {A}',answer:s,dp:1,text:'d3'+ns.join('+'),explain:`<p>Line up the decimal points.</p><p>Think in tenths: ${ns.join(' + ')} = ${s} tenths.</p><p>${s} tenths = <b>${fd(s,1)}</b>.</p>`,nudge:'<p>Line up the decimal points and add the tenths first.</p>',fast:25};};
/* ---------- grade 5: decimal place value to thousandths, × and ÷ by 10, 100, 1000 ---------- */
const PDN=['tenth','hundredth','thousandth'];
const dDigit=c=>{let w,f,s;do{w=R(1,9);f=R(102,987);s=String(f);}while(new Set(String(w)+s).size<4||s.includes('0'));const k=R(0,2);const d=+s[k];
 return {prompt:`In <b>${w}.${s}</b>, what is the digit <b>${d}</b> worth?`,tpl:'{A}',answer:d,dp:k+1,text:`dd${w}.${s}|${k}`,explain:`<p>The ${d} is in the ${PDN[k]}s place.</p><p>${d} ${PL(d,PDN[k])} = <b>${D(d,k+1)}</b>.</p>`,nudge:'<p>After the point come tenths, then hundredths, then thousandths.</p>',fast:12};};
const dExp=c=>{const w=R(0,9),t=R(0,9),h=R(0,9),th=R(1,9);const v=1000*w+100*t+10*h+th;const parts=[w?String(w):'',t?D(t,1):'',h?D(h,2):'',D(th,3)].filter(Boolean);
 const tpl=R(0,1)?parts.join(' + ')+' = {A}':`${w} ${PL(w,'one','ones')}, ${t} ${PL(t,'tenth')}, ${h} ${PL(h,'hundredth')}, ${th} ${PL(th,'thousandth')} = {A}`;
 return {tpl,answer:v,dp:3,text:'de'+tpl,explain:`<p>Put each digit in its place: ${w} ones, ${t} tenths, ${h} hundredths, ${th} thousandths.</p><p>That is <b>${D(v,3)}</b>.</p>${t===0||h===0?'<p>Write 0 for an empty place.</p>':''}`,nudge:'<p>Ones, then the point, then tenths, hundredths and thousandths. Use 0 for an empty place.</p>',fast:15};};
const cmpDec3=c=>{const w=R(0,9);let a,b;const k=R(0,4);
 if(k===0){const x=R(1,9),y=R(1,9);a=w*1000+x*100+y*10;b=w*1000+x*100+R(1,9);}
 else if(k===1){a=w*1000+R(1,9)*100;b=a-R(1,99);}
 else if(k===2){a=w*1000+R(11,99)*10;b=a;}
 else if(k===3){a=w*1000+R(1,9)*100+R(0,9)*10;b=w*1000+R(101,999);if(b===a)b+=1;}
 else{a=w*1000+R(101,999);b=a+PK([1,-1,10,-10]);}
 if(R(0,1))[a,b]=[b,a];const sa=fd(a,3),sb=k===2?D(b,3):fd(b,3);
 return cmpQ(sa,a,sb,b,`<p>Write both with thousandths: ${D(a,3)} and ${D(b,3)}.</p><p>Compare ${a} thousandths and ${b} thousandths.</p>`,`c3${sa}?${sb}`);};
const mdTen=(ops)=>c=>Object.assign(mdTen0(ops)(c),{tk:'times-divide-10s'});
const mdTen0=(ops)=>c=>{const op=PK(ops);let m,e,k;
 if(op==='x'){e=R(1,3);k=R(1,3);do{m=R(11,999);}while(m%10===0||m<Math.pow(10,e-1));}else{e=R(0,1);k=R(1,3-e);do{m=R(11,999);}while(m%10===0&&e>0);}
 const u=Math.pow(10,k);const shown=e?fd(m,e):N(m);let ans,dp;
 if(op==='x'){if(e>k){ans=m;dp=e-k;}else{ans=m*Math.pow(10,k-e);dp=0;}}else{ans=m;dp=e+k;}
 if(dp){const d2=dpOf(ans,dp);ans=ans/Math.pow(10,dp-d2);dp=d2;}const as=dp?fd(ans,dp):N(ans);const z=['','one place','two places','three places'][k];
 const q={tpl:`${shown} ${op==='x'?'×':'÷'} ${N(u)} = {A}`,answer:ans,text:`md${shown}${op}${u}`,explain:`<p>${op==='x'?`Times ${N(u)} moves every digit ${z} to the left (bigger).`:`Divided by ${N(u)} moves every digit ${z} to the right (smaller).`}</p><p>${shown} ${op==='x'?'×':'÷'} ${N(u)} = <b>${as}</b>.</p>`,nudge:`<p>${N(u)} has ${k} ${PL(k,'zero')}, so the digits move ${z}.</p>`,fast:15};if(dp)q.dp=dp;return q;};
/* ---------- test-style items (CAASPP / Smarter Balanced kinds), kept game-like ---------- */
const SPK=[['Gizmo','he'],['Ms. Rosa','she'],['Coach Flex','he'],['Nana Paws','she'],['Dr. Quartz','he'],['the Kind Teacher','she'],['Ozzy','he'],['the Elder Wiz','he']];
const noCarry=(a,b)=>{let r=0,m=1;while(a>0||b>0){r+=((a%10+b%10)%10)*m;m*=10;a=Math.floor(a/10);b=Math.floor(b/10);}return r;};
const flipSub=(a,b)=>{let r=0,m=1;while(a>0||b>0){r+=Math.abs(a%10-b%10)*m;m*=10;a=Math.floor(a/10);b=Math.floor(b/10);}return r;};
/* error analysis: what mistake did they make? opts = [{k:label(P), v:wrong value}] — one is picked as the real slip (or none) */
function errQ(eqS,right,opts,fmt,dp,key){const sp=PK(SPK);const nm=cap(sp[0]),Pn=cap(sp[1]);
 opts=opts.filter(o=>o.v!==right&&o.v>0&&(right>=1000||o.v<1000));const seen=new Set();opts=opts.filter(o=>!seen.has(o.v)&&seen.add(o.v));
 const r=R(0,5);
 if(r<2){const m=PK(opts);const q={prompt:`${nm} says <b>${eqS} = ${fmt(m.v)}</b>, but ${sp[1]} made a mistake. What is the right answer?`,tpl:`${eqS} = {A}`,answer:right,text:`ef${key}`,explain:`<p>${Pn} ${m.k}.</p><p>${eqS} = <b>${fmt(right)}</b>.</p>`,nudge:'<p>Work it out yourself, place by place.</p>',fast:25};if(dp){const d2=dpOf(right,dp);q.answer=right/Math.pow(10,dp-d2);q.dp=d2;}return q;}
 const none=r===2;const m=none?null:PK(opts);const say=none?right:m.v;const lab=o=>o?`No. ${Pn} ${o.k}.`:`${Pn} is right!`;
 const wr=SH(opts.filter(o=>o!==m)).slice(0,none?3:2).map(lab);if(!none)wr.push(lab(null));
 return choice({prompt:`${nm} says <b>${eqS} = ${fmt(say)}</b>. Is ${sp[1]} right? Choose the reason.`,tpl:'{A}',text:`em${key}=${say}`,explain:`<p>${eqS} = ${fmt(right)}.</p><p>${none?`So <b>${sp[1]} is right</b>.`:`${nm} got ${fmt(say)}: <b>${sp[1]} ${m.k}</b>.`}</p>`,nudge:'<p>Work it out yourself first. Then see how they got their answer.</p>',fast:35},lab(m),wr);}
const errCheck=(op,gen)=>c=>{let a,b,o;for(let i=0;i<100;i++){[a,b]=gen();const rt=op==='+'?a+b:a-b;
  o=op==='+'?[{k:'forgot to regroup',v:noCarry(a,b)},{k:'subtracted instead of adding',v:a-b},{k:'added an extra ten',v:rt+10},{k:'added an extra hundred',v:rt+100}]
   :[{k:'took the smaller digit from the bigger one',v:flipSub(a,b)},{k:'added instead of subtracting',v:a+b},{k:'took away an extra ten',v:rt-10},{k:'took away an extra hundred',v:rt-100}];
  if(o[0].v!==rt)break;}
 const right=op==='+'?a+b:a-b;return errQ(`${N(a)} ${op==='+'?'+':'−'} ${N(b)}`,right,o,N,0,`${a}${op}${b}`);};
const errDec=(op)=>c=>{let a,b,eqS,right,o;
 if(op==='+'){do{a=R(11,99);b=R(101,999);}while(b%10===0||a%10===0);right=a*10+b;eqS=`${fd(a,1)} + ${fd(b,2)}`;
  o=[{k:'lined up the last digits, not the decimal points',v:a+b},{k:'forgot to regroup',v:noCarry(a*10,b)},{k:'subtracted instead of adding',v:Math.abs(a*10-b)},{k:'added an extra one',v:right+100}];}
 else{const W=R(3,9);do{b=R(101,W*100-101);}while(b%10===0||b%100<10);right=W*100-b;eqS=`${W} − ${fd(b,2)}`;
  o=[{k:'only took away the whole number',v:(W-Math.floor(b/100))*100+b%100},{k:'added instead of subtracting',v:W*100+b},{k:'took away an extra one',v:right-100},{k:'took away an extra tenth',v:right-10}];}
 return errQ(eqS,right,o,v=>fd(v,2),2,eqS);};
/* which statement is true? */
const whichTrue=(op,gen,u,fmt,mist)=>c=>{fmt=fmt||N;for(let i=0;i<200;i++){const [a,b]=gen();const v=op==='+'?a+b:a-b;const ex=`${fmt(a)} ${op==='+'?'+':'−'} ${fmt(b)}`;
  const m=mist?mist(a,b):op==='+'?noCarry(a,b):flipSub(a,b);const fl=v%u===0?v-u:Math.floor(v/u)*u;if(fl<=0||m===v)continue;
  const tA=`${ex} = ${fmt(v)}`,tB=`${ex} is more than ${fmt(fl)}`;const useA=R(0,1);
  const wr=[`${ex} = ${fmt(m)}`,`${ex} = ${fmt(v+(R(0,1)?u/10:-u/10))}`,useA?`${ex} is less than ${fmt(fl)}`:`${ex} = ${fmt(v+u)}`];
  return choice({prompt:'Which one is true?',tpl:'{A}',text:`wt${ex}${useA}`,explain:`<p>${ex} = ${fmt(v)}.</p><p>So <b>${useA?tA:tB}</b> is true.</p>`,nudge:'<p>Work it out first, then check each one.</p>',fast:30},useA?tA:tB,wr);}return null;};
function tfQ(ls,lv,rsx,rv,fmt){const t=lv===rv;return choice({prompt:'True or false?',tpl:`${ls} = ${rsx} is {A}`,text:`tf${ls}=${rsx}`,explain:`<p>${ls} = ${fmt(lv)}.</p><p>${rsx} = ${fmt(rv)}.</p><p>${t?'Both sides match, so it is <b>true</b>.':'The sides do not match, so it is <b>false</b>.'}</p>`,nudge:'<p>Work out each side. The = sign means both sides are the same.</p>',fast:20},t?'true':'false',['true','false']);}
const tfX=(op,u,lo,hi,max,fmt)=>c=>{fmt=fmt||N;for(let i=0;i<200;i++){let a=rs(lo,hi,u),b=rs(lo,hi,u);if(op==='-'&&a<b)[a,b]=[b,a];if(op==='-'&&a-b<2*u)continue;const v=op==='+'?a+b:a-b;if(v>max)continue;
  const off=R(0,1)?0:PK([u,-u,10*u]);const rv=v+off;if(rv<=2*u)continue;const ls=`${fmt(a)} ${op==='+'?'+':'−'} ${fmt(b)}`;let rsx;
  if(R(0,1)){const d=rs(u,hi,u);if(rv+d>max)continue;rsx=`${fmt(rv+d)} − ${fmt(d)}`;}else{const e=rs(u,rv-u,u);rsx=`${fmt(e)} + ${fmt(rv-e)}`;}
  return tfQ(ls,v,rsx,rv,fmt);}return tfQ(fmt(2*u)+' + '+fmt(u),3*u,fmt(3*u),3*u,fmt);};
const closer=(op,u,gen,fmt)=>c=>{fmt=fmt||N;for(let i=0;i<200;i++){const [a,b]=gen();const v=op==='+'?a+b:a-b;const r=Math.round(v/u)*u;if(Math.abs(v-r)>0.4*u||r-u<=0)continue;const ex=`${fmt(a)} ${op==='+'?'+':'−'} ${fmt(b)}`;
  return choice({prompt:`About how much is <b>${ex}</b>? Is it closest to ${fmt(r-u)}, ${fmt(r)} or ${fmt(r+u)}?`,tpl:'{A}',text:`cl${ex}`,explain:`<p>${ex} = ${fmt(v)}.</p><p>${fmt(v)} is closest to <b>${fmt(r)}</b>.</p>`,nudge:'<p>Round each number first, then add or subtract the round numbers.</p>',fast:20},fmt(r),[fmt(r-u),fmt(r+u)]);}return null;};
/* which expression matches the story? (built from a 2-step story) */
const EXK={js:(p,q,r)=>[`${p} + ${q} − ${r}`,[`${p} − ${q} + ${r}`,`${p} + ${q} + ${r}`,`${p} − ${q} − ${r}`]],
 sj:(p,q,r)=>[`${p} − ${q} + ${r}`,[`${p} + ${q} − ${r}`,`${p} − ${q} − ${r}`,`${p} + ${q} + ${r}`]],
 ss:(p,q,r)=>[`${p} − ${q} − ${r}`,[`${p} − ${q} + ${r}`,`${p} + ${q} − ${r}`,`${p} + ${q} + ${r}`]],
 mt:(p,q)=>[`${p} + (${p} + ${q})`,[`${p} + ${q}`,`${p} + (${p} − ${q})`,`(${p} + ${q}) − ${p}`]]};
const exprMatch=(kinds,gen,cave)=>c=>{for(let i=0;i<150;i++){const kind=PK(kinds);const ns=gen();const q=story(kind,ns,c,cave,i>100);if(!q)continue;const E=EXK[kind](...ns.map(N));
  return choice({prompt:q.prompt+' <br>Which expression answers the question?',tpl:'{A}',tk:'which-expression',text:'em'+q.text,wp:1,
   explain:`<p>${K[kind].why}</p><p>So the story matches <b>${E[0]}</b> = ${N(q.answer)}.</p>`,nudge:'<p>Act it out: what happens first? What happens next?</p>',fast:35},E[0],E[1]);}return null;};
const exprMoney=c=>{let x,y,bill;do{x=it();y=it();bill=PK([1000,2000]);}while(x[0]===y[0]||x[1]+y[1]>=bill-100);const A=D(x[1],2),Bv=D(y[1],2),T=bill/100;
 return choice({prompt:`You have <b>$${T}</b>. You buy ${x[0]} for <b>${$$(x[1])}</b> and ${y[0]} for <b>${$$(y[1])}</b>. Which expression shows how much money you have left?`,tpl:'{A}',text:`emm${x[0]}${x[1]}${y[0]}${y[1]}${T}`,wp:1,
  explain:`<p>Both things cost money, so take both prices away from $${T}.</p><p><b>${T} − ${A} − ${Bv}</b> = ${D(bill-x[1]-y[1],2)}.</p>`,nudge:'<p>Does buying something make your money go up or down?</p>',fast:30},`${T} − ${A} − ${Bv}`,[`${T} − ${A} + ${Bv}`,`${T} + ${A} + ${Bv}`,`${A} + ${Bv} − ${T}`]);};
const WN='Which number makes this true?';

/* ---------- grade 5 Legend: multi-step decimal stories (values ×100, or ×10 for tenths) ---------- */
const dv=(lo,hi)=>{let v;do{v=R(lo,hi);}while(v%10===0);return v;};
const dl=fn=>c=>{let o;for(let i=0;i<300;i++){o=fn(c);if(o&&o[2]>0)break;}const [pr,unit,ans,dp,steps,why,money]=o;const f=v=>money?$$(v):fd(v,dp);const d2=money?2:dpOf(ans,dp);
 return {prompt:pr,tpl:money?'$ {A}':'{A} '+unit,answer:money?ans:ans/Math.pow(10,dp-d2),dp:d2,text:'dl'+pr.replace(/<[^>]+>/g,''),wp:1,
  explain:`<p>${why}</p><p>${steps.map(([e,v],i)=>`${e} = ${i===steps.length-1?'<b>'+f(v)+'</b>':f(v)}`).join('<br>')}</p>`,nudge:'<p>One step at a time. Line up the decimal points.</p>',fast:60};};
const bx=(v,dp,m)=>`<b>${m?$$(v):fd(v,dp)}</b>`;
const LA=[ /* addition Legend, grade 5 */
 dl(()=>{const dp=PK([1,2]);const a=dp===1?dv(21,69):dv(205,695),b=dp===1?dv(3,19):dv(25,195);const t=a+b,f=v=>fd(v,dp);
  return [`Coach Flex ran ${bx(a,dp)} kilometers on Monday. On Tuesday he ran ${bx(b,dp)} kilometers more than on Monday. How many kilometers did he run on both days?`,'kilometers',a+t,dp,[[`${f(a)} + ${f(b)}`,t],[`${f(a)} + ${f(t)}`,a+t]],'First find Tuesday. Then add both days.'];}),
 dl(()=>{const x=d5(500,1500),y=d5(250,900),z=d5(300,x+y-150);const f=$$;return [`Nana Paws has ${bx(x,2,1)}. She earns ${bx(y,2,1)} walking dogs. Then she buys yarn for ${bx(z,2,1)}. How much money does she have now?`,'',x+y-z,2,[[`${f(x)} + ${f(y)}`,x+y],[`${f(x+y)} − ${f(z)}`,x+y-z]],'Add what she earns, then take away what she spends.',1];}),
 dl(()=>{const a=dv(105,395),b=dv(105,395),c2=dv(105,395);const t=a+b+c2;const d=Math.floor(t/100)*100-R(1,3)*100;const f=v=>fd(v,2);
  return [`Gizmo wants his robot to roll ${bx(d,2)} meters. It rolls ${bx(a,2)} meters, then ${bx(b,2)} meters, then ${bx(c2,2)} meters. How many meters farther than his goal did it roll?`,'meters',t-d,2,[[`${f(a)} + ${f(b)}`,a+b],[`${f(a+b)} + ${f(c2)}`,t],[`${f(t)} − ${f(d)}`,t-d]],'Add the three rolls. Then compare with the goal.'];}),
 dl(()=>{const a=dv(11,49),b=dv(11,49),x=dv(5,29);const f=v=>fd(v,1);return [`Skyla the eagle flew ${bx(a,1)} miles to the lake and ${bx(b,1)} miles back. Then she flew ${bx(x,1)} miles to her nest. How many miles did she fly in all?`,'miles',a+b+x,1,[[`${f(a)} + ${f(b)}`,a+b],[`${f(a+b)} + ${f(x)}`,a+b+x]],'Add all three trips.'];})
];
const LS=[ /* subtraction Legend, grade 5: in the caves */
 dl(()=>{const x=R(3,9)*100,a=dv(55,295),b=dv(55,295);const f=v=>fd(v,2);return [`Gizmo's lantern holds ${bx(x,2)} liters of oil. It burns ${bx(a,2)} liters on Monday and ${bx(b,2)} liters on Tuesday. How many liters of oil are left?`,'liters',x-a-b,2,[[`${f(x)} − ${f(a)}`,x-a],[`${f(x-a)} − ${f(b)}`,x-a-b]],'Take away Monday, then take away Tuesday.'];}),
 dl(()=>{const x=dv(105,995)+R(5,9)*100,a=dv(105,395),b=dv(105,295);const f=v=>fd(v,2);return [`Dr. Quartz has a rope ${bx(x,2)} meters long. He cuts off ${bx(a,2)} meters to climb into a hole and ${bx(b,2)} meters to tie his bag. How many meters of rope are left?`,'meters',x-a-b,2,[[`${f(x)} − ${f(a)}`,x-a],[`${f(x-a)} − ${f(b)}`,x-a-b]],'Take away both pieces he cut off.'];}),
 dl(()=>{const x=dv(25,89),a=dv(11,x-5),b=dv(11,49);const f=v=>fd(v,1);return [`Grumbleroot the troll has ${bx(x,1)} liters of mushroom soup. He eats ${bx(a,1)} liters. Then he cooks ${bx(b,1)} liters more. How many liters of soup does he have now?`,'liters',x-a+b,1,[[`${f(x)} − ${f(a)}`,x-a],[`${f(x-a)} + ${f(b)}`,x-a+b]],'Take away what he eats, then add what he cooks.'];}),
 dl(()=>{const y=dv(205,595),x=y+dv(150,450),a=dv(15,x-y-25);const f=v=>fd(v,2);return [`Dr. Quartz's blue crystal is ${bx(x,2)} cm long. His green crystal is ${bx(y,2)} cm long. He trims ${bx(a,2)} cm off the blue crystal. Now how many centimeters longer is the blue crystal?`,'cm',x-a-y,2,[[`${f(x)} − ${f(a)}`,x-a],[`${f(x-a)} − ${f(y)}`,x-a-y]],'First trim the blue crystal. Then compare.'];}),
 dl(()=>{const a=d5(255,795),b=d5(355,895),cc=d5(25,450);return [`At the Cave Shop you buy a map for ${bx(a,2,1)} and a lantern for ${bx(b,2,1)}. You pay with a <b>$20</b> bill. Then you find ${bx(cc,2,1)} in the cave. How much money do you have now?`,'',2000-a-b+cc,2,[[`${$$(a)} + ${$$(b)}`,a+b],[`${$$(2000)} − ${$$(a+b)}`,2000-a-b],[`${$$(2000-a-b)} + ${$$(cc)}`,2000-a-b+cc]],'Add the prices, take them from $20, then add what you find.',1];}),
 dl(()=>{const x=dv(41,99),a=dv(11,29),b=dv(11,29);const f=v=>fd(v,1);return [`The Grey Goblin has ${bx(x,1)} kilograms of gold dust. He drops ${bx(a,1)} kilograms in one tunnel and ${bx(b,1)} kilograms in another. How many kilograms does he still have?`,'kilograms',x-a-b,1,[[`${f(a)} + ${f(b)}`,a+b],[`${f(x)} − ${f(a+b)}`,x-a-b]],'Add what he dropped, then take it away.'];}),
 dl(()=>{const x=R(6,9)*100+dv(5,95),a=dv(105,295),b=dv(105,195),cc=dv(55,145);const f=v=>fd(v,2);return [`The tunnel is ${bx(x,2)} km long. Ozzy's mine cart goes ${bx(a,2)} km, then ${bx(b,2)} km, then ${bx(cc,2)} km. How many kilometers are left to the end?`,'km',x-a-b-cc,2,[[`${f(a)} + ${f(b)}`,a+b],[`${f(a+b)} + ${f(cc)}`,a+b+cc],[`${f(x)} − ${f(a+b+cc)}`,x-a-b-cc]],'Add the three trips. Then take that from the whole tunnel.'];}),
 dl(()=>{const W=R(4,9)*100,a=dv(105,W/2),b=dv(55,W/2-60);const f=v=>fd(v,2);return [`Coach Flex must climb ${bx(W,2)} meters to get out of the cave. He climbs ${bx(a,2)} meters before lunch and ${bx(b,2)} meters after lunch. How many more meters must he climb?`,'meters',W-a-b,2,[[`${f(a)} + ${f(b)}`,a+b],[`${f(W)} − ${f(a+b)}`,W-a-b]],'Add what he has climbed. Then take it from the total.'];})
];

/* ---------- number generators used below ---------- */
const g10=()=>{const p=R(2,8);return [p,R(2,10-p)];};
const g20=()=>{const p=R(3,9);return [p,R(Math.max(3,11-p),9)];};
const g20any=()=>{const p=R(2,14);return [p,R(2,Math.min(9,20-p))];};
const two1N=()=>gA([20,89],[2,9],0,0);           // 42+5
const two1R=()=>gA([15,89],[3,9],1,1);           // 38+5
const twoTen=()=>[R(11,69),rs(10,30,10)];        // 34+20
const tens=()=>{const a=R(1,7)*10;return [a,R(1,9-a/10)*10];};
const twotwoN=()=>gA([11,79],[11,59],0,0,99);
const twotwoR=()=>gA([15,79],[15,69],1,1,100);
const w100=()=>gA([20,79],[12,59],1,1,99,40);
const thrH=()=>[rs(110,790,10),rs(100,200,100)*1+0];
const thr3N=()=>gA([110,699],[101,299],0,0,999);
const thr3R1=()=>gA([120,699],[105,299],1,1,999);
const thr3R2=()=>gA([150,699],[150,399],2,2,999);
const four3=()=>gA([1100,8800,10],[120,950,10],0,1,9999);
const four4=()=>gA([1100,6800,10],[1100,3200,10],0,2,9999);
const four4R=()=>gA([1200,6800],[1200,3200],2,3,9999);
const bigF=()=>gA([12100,68900,100],[1200,9800,100],1,2,99999);
const multiF=()=>gA([10500,69500,50],[10500,29500,50],0,2,99999);

/* story number generators: parts of at least 3 so stories never read "2 … 6 in all" */
const g20b=()=>{const p=R(3,12);return [p,R(Math.max(3,8-p),Math.min(9,20-p))];};
const g20c=()=>{const p=R(3,12);return [p,R(Math.max(3,11-p),Math.min(9,20-p))];};
const d5=(lo,hi)=>rs(lo,hi,5);

/* ======================= ADDITION FOREST ======================= */
PLAN.def('add',1,[
 [pic10,pic10,add(()=>{const a=R(1,9);return [a,R(0,10-a)];},{fast:8}),make10(10),moreThan([1,2],2,8),ST(['join'],g10),ST(['part'],g10)],
 [add(g20,{fast:8}),doubles,three(2,7,18),make10(10),count120,ST(['join','more'],g20),ST(['join','more'],g20b)],
 [add(two1N),add(twoTen),moreThan([10],11,89),miss(()=>{const a=R(3,9);return [a,R(Math.max(2,11-a),9)];}),add(tens),count120,ST(['more','part','change'],g20c),ST(['more','part','change','join'],()=>[R(12,60),rs(10,30,10)])],
 [add(two1R),miss(()=>[R(11,59),rs(10,30,10)],{side:'R'}),three(2,9,20),cmpNum(()=>{const a=R(12,98);let b=R(0,5)?PK([Number(String(a).split('').reverse().join('')),a+PK([-1,1,-10,10])]):a;if(b<10||b>99)b=a+1;return [a,b];}),miss(()=>{const a=R(5,13);return [a,R(Math.max(2,11-a),Math.min(9,20-a))];},{side:'L'}),ST(['part','change','more','startS'],g20c),ST(['join','more','change'],two1R)],
 [ST(['jjj'],()=>[R(2,7),R(2,7),R(2,6)]),ST(['js'],()=>[R(5,10),R(3,8),R(2,7)]),ST(['sj'],()=>[R(8,15),R(2,6),R(2,7)]),ST(['jt'],()=>[R(4,9),R(3,8),R(2,6)]),ST(['mm','sm'],()=>[R(7,12),R(2,4),R(2,5)]),ST(['ms'],()=>[R(4,9),R(2,5),R(2,6)]),ST(['mt','ft'],()=>[R(3,8),R(2,4)]),ST(['kid2'],()=>[R(5,10),R(3,7),R(2,6)])]
]);
PLAN.def('add',2,[
 [add(g20,{fast:8}),add(()=>gA([15,89],[2,9],0,1)),pvTO,skip([5,10]),ST(['join','more'],()=>gA([12,79],[3,9],0,1)),ST(['join','more','part'],g20c)],
 [add(twotwoN),add(twotwoR),pvHTO,skip([5,10,100]),miss(()=>[R(12,69),rs(10,30,10)],{side:'R'}),ST(['join','more','part'],twotwoN),ST(['join','more','change'],twotwoR)],
 [add(w100),add(()=>{let ns;do{ns=[R(11,35),R(10,30),R(11,25),R(10,20)];}while(sum(ns)>100||ns.filter(v=>v%10===0).length<1);return ns;}),moreThan([10,100],110,880),add(thrH),expanded,ST(['startS','change','more','part'],w100),ST(['join','more'],thrH)],
 [add(thr3R1),cmpNum(()=>{const a=R(101,989);const s=String(a);const sw=s[1]+s[0]+s[2];let b=R(0,5)?PK([a+PK([1,-1,10,-10,100,-100]),+sw]):a;if(b<100||b>999)b=a+10;return [a,b];}),evenOdd(21,99),miss(()=>w100(),{}),add(()=>{let ns;do{ns=[R(12,45),R(12,40),R(11,35),R(11,30)];}while(sum(ns)>150);return ns;}),ST(['startS','startJ','fewer','part','change'],w100),ST(['more','join','part'],thr3N)],
 [ST(['ss'],()=>[R(60,99),R(10,30),R(10,25)]),ST(['js'],()=>[R(25,60),R(12,35),R(10,30)]),ST(['sj'],()=>[R(40,80),R(12,30),R(10,35)]),ST(['jt'],()=>[R(20,45),R(15,40),R(12,30)]),ST(['mm','sm'],()=>[R(40,70),R(10,25),R(10,30)]),ST(['ms'],()=>[R(20,50),R(10,25),R(10,30)]),ST(['mt','ft','cmp2'],()=>[R(25,50),R(12,24),R(8,20)]),ST(['kid2'],()=>[R(25,60),R(12,35),R(10,30)]),ST(['js','sj'],()=>[rs(200,500,10),rs(100,300,10),rs(100,200,10)])]
]);
PLAN.def('add',3,[
 [add(twotwoR),add(thr3N),add(()=>PK([[rs(110,690,10),rs(100,300,100)],[rs(110,690,10),rs(10,30,10)]])),ST(['join','part'],w100),ST(['more','change'],thr3N),ST(['startS'],thr3N)],
 [add(thr3R1),roundN([10,100],true),add(()=>gA([110,880,10],[20,90,10],1,1,999)),miss(()=>[rs(110,600,10),rs(100,300,10)],{side:'R'}),ST(['join','more','change'],thr3R1),ST(['part','more','startS'],thr3R1)],
 [add(thr3R2),add(()=>{let ns;do{ns=[rs(105,450,5),rs(100,300,10),rs(100,250,5)];}while(sum(ns)>999);return ns;}),roundN([10,100],true),errCheck('+',()=>gA([150,599],[150,399],1,2,999)),ST(['more','startS','part','change'],thr3R2),ST(['join','more','startS'],thr3R1)],
 [miss(()=>[rs(150,650,50),rs(100,300,50)].map((v,i)=>i?v+PK([0,0,25]):v),{prompt:WN}),nearRound('+'),whichTrue('+',()=>gA([150,499],[150,449],1,2,999),100),closer('+',100,()=>gA([110,480],[110,480],0,2,849)),add(thr3R2),ST(['startS','startJ','fewer','change'],thr3R2),ST(['more','part','startS'],thr3R2)],
 [ST(['js'],()=>[R(150,450),R(100,300),R(60,250)]),ST(['sj'],()=>[R(300,600),R(100,250),R(80,300)]),ST(['jt'],()=>[R(150,400),R(100,350),R(80,300)]),ST(['mm'],()=>[R(120,300),R(50,200),R(50,200)]),ST(['sm'],()=>[R(300,600),R(60,200),R(60,250)]),ST(['ms'],()=>[R(150,400),R(60,250),R(60,250)]),ST(['mt','cmp2'],()=>[R(150,350),R(60,200),R(40,150)]),estStory('+',100),exprMatch(['js','sj','mt'],()=>[R(120,450),R(60,250),R(50,200)])]
]);
PLAN.def('add',4,[
 [add(four3),add(thr3R2),digitVal(1000,9999),add(()=>[rs(1100,7800,100),rs(1000,2000,1000)]),ST(['join','more','part'],four3),ST(['join','more'],four3)],
 [add(four4),roundN([100,1000],false,true),miss(()=>[rs(1500,5500,500),rs(500,3500,500)]),add(four4R),ST(['join','more','part','change'],four4),ST(['join','more','startS'],four4R)],
 [add(()=>{let ns;do{ns=[rs(1100,4800,100),rs(1100,4800,100),rs(1100,3800,100)];}while(sum(ns)>9999);return ns;}),add(bigF),add(four4R),errCheck('+',()=>gA([1100,6800],[1100,2900],1,2,9999)),ST(['join','more','cmp'],()=>[rs(12000,48000,100),rs(2500,25000,50)]),ST(['join','more','part','startS'],four4R)],
 [miss(()=>[rs(1250,6250,25),rs(1100,3200,50)],{prompt:WN}),digitVal(10000,99999),cmpNum(()=>{const a=R(10000,98999);const s=String(a);let b=PK([+(s.slice(0,3)+s[4]+s[3]),a+PK([10,-10,100,-100,1000,-1000])]);if(b===a)b=a+100;return [a,b];}),whichTrue('+',()=>gA([1100,4800],[1100,4800],1,3,9999),1000),closer('+',1000,()=>gA([1100,4800],[1100,4800],0,3,9999)),estStory('+',1000),ST(['startS','startJ','fewer','change'],four4R)],
 [ST(['js','sj'],()=>[rs(2400,9600,10),rs(1200,4800,10),rs(800,4500,10)]),ST(['jt'],()=>[rs(2400,6000,10),rs(1200,4000,10),rs(1500,5000,10)]),ST(['mm'],()=>[rs(1200,4800,10),rs(500,2400,10),rs(300,1800,10)]),ST(['ms'],()=>[rs(2400,6000,10),rs(800,3000,10),rs(500,2500,10)]),ST(['mt','ft','cmp2'],()=>[rs(2400,6000,10),rs(800,2400,10),rs(300,1500,10)]),ST(['jjs'],()=>[rs(1200,4800,10),rs(500,2400,10),rs(300,1800,10),rs(1000,3500,10)]),ST(['mt3'],()=>[rs(1200,4800,10),rs(500,2400,10),rs(300,1800,10)]),ST(['jjs','js'],()=>[rs(10000,30000,100),rs(5000,20000,100),rs(5000,20000,100),rs(6000,15000,100)]),exprMatch(['js','sj','ss','mt'],()=>[rs(2400,6800,10),rs(800,2400,10),rs(500,1800,10)])]
]);
PLAN.def('add',5,[
 [dDigit,dExp,cmpDec3,mdTen(['x','÷']),roundDec,dq('+',()=>[R(11,59),R(11,39),1]),decStory('+',()=>[R(11,69),R(11,49),1])],
 [dq('+',()=>[R(11,69),R(11,39),1]),dq('+',()=>gA([12,79],[13,49],1,1).concat([1])),dq('+',()=>[R(101,699),R(101,399),2]),decStory('+',()=>[R(11,69),R(11,49),1]),cmpDec3,roundDec,mdTen(['x','÷'])],
 [dq('+',()=>gA([110,690],[110,390],1,2).concat([2])),dq('+',()=>[R(1001,4999),PK([R(11,49)*100,R(101,499)*10]),3]),money('+',()=>[d5(105,950),d5(105,850)]),moneyStory('+'),decStory('+',()=>[R(101,699),R(101,399),2]),errDec('+')],
 [dq('+',()=>{const a=R(11,79)*10,b=R(101,399);return R(0,1)?[a,b,2]:[b,a,2];}),dq('+',()=>{const a=R(1001,3999),b=PK([R(11,39)*100,R(101,399)*10]);return R(0,1)?[a,b,3]:[b,a,3];}),dmiss(()=>{const s=R(2,9)*10;const a=R(11,s-11);return [a,s-a,1];}),dmiss(()=>{const s=R(2,6)*100;const a=d5(105,s-105);return [a,s-a,2];}),dec3,closer('+',100,()=>[R(105,695),R(105,395)],v=>fd(v,2)),whichTrue('+',()=>[dv(105,595),dv(105,395)],100,v=>fd(v,2),(a,b)=>Math.floor(a/100)*100+Math.floor(b/100)*100+(a%100+b%100)%100),decStory('+',()=>{const a=R(11,79)*10,b=R(101,399);return [a,b,2];})],
 [changeStory(2,2000),changeStory(3,5000),dec2(2,false,0),dec2(1,true,1),exprMoney].concat(LA)
]);

/* ======================= SUBTRACTION CAVES ======================= */
const takePic=(a,b)=>{const e=PK(EM);return {vis:{t:'set',n:a,k:b,e},prompt:`There are <b>${a}</b> ${e}. Take away <b>${b}</b>. How many are left?`};};
const s10=()=>{const a=R(3,10);return [a,R(1,a-1)];};
const s20=()=>{const a=R(11,18);return [a,R(Math.max(2,a-9),9)];};
const sTens=()=>{const a=R(3,9)*10;return [a,R(1,a/10-1)*10];};
const s2Tens=()=>{const a=R(21,99);return [a,R(1,Math.floor(a/10)-1)*10];};   // 54 − 20
const s22N=()=>gS([35,98],[11,64],0,0);
const s22R=()=>gS([31,97],[12,69],1,1);
const s3H=()=>{const a=R(210,980);return [a,R(1,Math.floor(a/100)-1)*100];};
const s33N=()=>gS([350,989],[110,489],0,0);
const s33R1=()=>gS([310,980],[109,499],1,1);
const s33R2=()=>gS([400,980],[125,489],2,2);
const sZero=()=>{const a=PK([R(3,9)*100,R(3,9)*100+R(1,9),R(3,9)*100]);return [a,R(111,a-60)];};
const s43=()=>gS([2100,9800,10],[120,980,10],0,1);
const s44=()=>gS([3100,9800,10],[1100,2900,10],1,1);
const s44R=()=>gS([3100,9800],[1100,4900],2,3);
const sZero4=()=>{const a=PK([R(3,9)*1000,R(3,9)*1000,R(3,9)*1000+R(1,9)*10,R(3,9)*1000+R(1,9)]);return [a,R(1111,a-600)];};
const sBigF=()=>{const a=rs(20000,90000,500);return [a,rs(10000,a-5000,500)];};
/* story pairs for subtraction: [p,q] where the start is p+q */
const sp20=()=>{const t=R(11,20);const q=R(3,Math.min(9,t-3));return [t-q,q];};
const sp10=()=>{const t=R(4,10);const q=R(1,t-2);return [t-q,q];};
const fromS=(gen)=>()=>{const [a,b]=gen();return [a-b,b];};

const SC=(k,g)=>ST(k,g,1);
PLAN.def('sub',1,[
 [sub(s10,{pic:takePic,fast:10}),sub(s10,{fast:8}),moreThan([1,2],3,10,true),sub(()=>{const a=R(2,10);return PK([[a,0],[a,a],[a,1]]);},{fast:8}),SC(['sep'],sp10),SC(['part'],sp10)],
 [sub(s20,{fast:8}),sub(()=>{const a=R(3,9);return [2*a,a];},{fast:8}),missS(()=>{const a=R(5,10);return [a,R(1,a-1)];},{side:'B'}),make10(0),SC(['sep','cmp'],sp20),SC(['sep','cmp'],sp20)],
 [sub(sTens),sub(s20,{fast:8}),moreThan([10],20,99,true),missS(()=>s20(),{}),SC(['cmp','fewer','part'],sp20),SC(['sep','cmp'],fromS(sTens))],
 [sub(s20,{fast:8}),missS(()=>s20(),{side:'T'}),missS(sTens,{side:'B'}),trueFalse,SC(['part','cmp','fewer','startJ'],sp20),SC(['change','startS'],sp20),SC(['sep','cmp'],fromS(sTens))],
 [SC(['ss'],()=>[R(12,20),R(2,6),R(2,6)]),SC(['sj'],()=>[R(10,18),R(3,7),R(2,6)]),SC(['js'],()=>[R(6,12),R(3,7),R(4,9)]),SC(['jt'],()=>[R(5,10),R(4,9),R(3,8)]),SC(['sm'],()=>[R(8,14),R(2,5),R(2,6)]),SC(['ms'],()=>[R(4,9),R(2,5),R(2,6)]),SC(['bats'],()=>[R(12,20),R(4,9),R(2,6)]),SC(['sc'],()=>[R(12,19),R(2,6),R(2,5)])]
]);
PLAN.def('sub',2,[
 [sub(s20,{fast:8}),sub(()=>gS([21,95],[2,9],0,1)),missS(()=>s20(),{}),skip([10],true),SC(['sep','cmp'],sp20),SC(['sep','cmp','part'],fromS(()=>gS([24,98],[2,9],0,1)))],
 [sub(s22N),sub(s22R),missS(()=>[R(5,9)*10+R(0,9),rs(10,40,10)],{}),skip([5,100],true),SC(['sep','cmp','part'],fromS(s22N)),SC(['sep','cmp','fewer'],fromS(s22R))],
 [sub(()=>gS([31,99],[12,79],1,1)),sub(s3H),moreThan([10,100],110,990,true),sub(()=>gS([250,980,10],[110,450,10],0,0)),SC(['cmp','change','fewer','part'],fromS(s22R)),SC(['sep','cmp'],fromS(s3H))],
 [sub(s33R1),missS(()=>gS([31,99],[12,69],1,1),{}),sub(s22R,{fast:12}),SC(['startS','startJ','fewer','part'],fromS(s22R)),SC(['sep','cmp','part'],fromS(s33N)),sub(()=>gS([210,990],[100,489],0,1))],
 [SC(['ss'],()=>[R(60,99),R(10,30),R(10,25)]),SC(['sj'],()=>[R(50,99),R(15,35),R(10,30)]),SC(['js'],()=>[R(40,80),R(12,30),R(20,50)]),SC(['jt'],()=>[R(25,50),R(20,45),R(15,40)]),SC(['sm'],()=>[R(40,80),R(10,25),R(10,30)]),SC(['ms'],()=>[R(20,50),R(10,25),R(10,30)]),SC(['bats'],()=>[R(60,99),R(20,45),R(10,19)]),SC(['sc'],()=>[R(60,99),R(15,35),R(10,25)]),SC(['ss'],()=>[rs(500,900,10),rs(100,250,10),rs(100,200,10)])]
]);
PLAN.def('sub',3,[
 [sub(()=>gS([31,99],[12,79],1,1)),sub(s33N),sub(()=>PK([s3H(),[R(210,980),R(1,8)*10]]).map((v,i,a)=>i===1&&v>=a[0]?10:v)),SC(['sep','part'],fromS(s22R)),SC(['cmp','fewer'],fromS(s33N)),SC(['change','startJ'],fromS(s33N))],
 [sub(s33R1),sub(()=>{const a=rs(210,980,10);return [a,rs(20,90,10)];}),missS(()=>[rs(300,900,10),rs(100,290,10)],{}),SC(['sep','cmp','part','fewer'],fromS(s33R1)),SC(['sep','cmp','change'],fromS(s33R1))],
 [sub(sZero),sub(s33R2),sub(s33R1),errCheck('-',()=>gS([310,980],[109,499],1,2)),SC(['sep','cmp','fewer','part'],fromS(s33R2)),SC(['sep','cmp'],fromS(sZero))],
 [missS(()=>[rs(400,950,25),rs(150,375,25)],{prompt:WN}),whichTrue('-',()=>gS([400,980],[110,480],1,2),100),closer('-',100,()=>gS([400,980],[110,480],0,2)),nearRound('-'),sub(sZero),SC(['startS','startJ','fewer','change'],fromS(s33R2)),SC(['part','cmp','sep'],fromS(sZero))],
 [SC(['ss'],()=>[R(500,950),R(100,300),R(60,250)]),SC(['sj'],()=>[R(300,700),R(100,250),R(80,250)]),SC(['js'],()=>[R(200,500),R(100,300),R(150,400)]),SC(['jt'],()=>[R(150,400),R(100,350),R(100,300)]),SC(['sm'],()=>[R(300,700),R(60,200),R(60,250)]),SC(['sc'],()=>[R(400,800),R(100,300),R(60,200)]),SC(['bats'],()=>[R(400,950),R(150,350),R(50,149)]),estStory('-',100,1),exprMatch(['ss','sj','js'],()=>[R(400,800),R(60,250),R(50,200)],1)]
]);
PLAN.def('sub',4,[
 [sub(s43),sub(s33R2),sub(()=>[rs(3100,9800,100),R(1,3)*1000]),SC(['sep','part'],fromS(s43)),SC(['cmp','fewer'],fromS(s43)),SC(['change','startS'],fromS(s43))],
 [sub(s44),sub(()=>gS([3000,9800,10],[1100,4900,10],1,1)),missS(()=>[rs(5000,9500,500),rs(1500,4500,250)],{side:'B'}),SC(['sep','cmp','part','fewer'],fromS(s44)),SC(['change','startS','startJ'],fromS(()=>gS([3000,9800,10],[1100,4900,10],1,1)))],
 [sub(sZero4),sub(s44R),errCheck('-',()=>gS([3100,9800],[1100,2900],1,2)),SC(['sep','cmp'],fromS(sBigF)),SC(['sep','cmp','part'],fromS(sZero4)),sub(()=>[rs(3000,9000,1000),rs(1250,2750,250)])],
 [sub(sBigF),missS(()=>[rs(5000,9500,250),rs(1250,3750,250)],{prompt:WN}),cmpNum(()=>{const a=R(10000,98999);return [a,a+PK([10,-10,100,-100,1000,-1000,1])];}),whichTrue('-',()=>gS([4100,9800],[1100,3800],1,3),1000),closer('-',1000,()=>gS([4100,9800],[1100,4800],0,3)),estStory('-',1000,1),SC(['startS','startJ','fewer','change'],fromS(s44R))],
 [SC(['ss'],()=>[rs(5000,9600,10),rs(1200,3000,10),rs(800,2500,10)]),SC(['sj'],()=>[rs(4000,9000,10),rs(1200,3000,10),rs(800,2500,10)]),SC(['js'],()=>[rs(3000,6000,10),rs(1200,3000,10),rs(2000,5000,10)]),SC(['jt'],()=>[rs(2400,6000,10),rs(1200,4000,10),rs(1500,5000,10)]),SC(['sc'],()=>[rs(5000,9000,10),rs(1200,3000,10),rs(800,2500,10)]),SC(['sm'],()=>[rs(4000,9000,10),rs(800,2500,10),rs(600,2000,10)]),SC(['jjs'],()=>[rs(1200,4800,10),rs(500,2400,10),rs(300,1800,10),rs(1000,3500,10)]),SC(['bats'],()=>[rs(30000,60000,100),rs(10000,25000,100),rs(3000,9000,100)]),exprMatch(['ss','sj','js'],()=>[rs(4000,8000,10),rs(800,2400,10),rs(500,1800,10)],1)]
]);
PLAN.def('sub',5,[
 [dDigit,dExp,cmpDec3,mdTen(['x','÷']),roundDec,dq('-',()=>{const a=R(31,99);return [a,R(11,a-11),1];}),decStory('-',()=>{const a=R(31,99);return [a,R(11,a-5),1];})],
 [dq('-',()=>{const a=R(21,99);return [a,R(11,a-10),1];}),dq('-',()=>gS([21,99],[11,79],1,1).concat([1])),dq('-',()=>{const a=R(201,999);return [a,R(101,a-50),2];}),decStory('-',()=>{const a=R(31,99);return [a,R(11,a-5),1];}),dmissS(()=>{const a=R(31,99);return [a,R(11,a-11),1];}),roundDec,mdTen(['x','÷'])],
 [dq('-',()=>gS([201,999],[101,799],1,2).concat([2])),dq('-',()=>[R(21,89)*100,R(1001,1999),3]),money('-',()=>{const a=d5(300,2000);return [a,d5(105,a-55)];}),moneyStory('-'),decStory('-',()=>{const a=R(201,999);return [a,R(101,a-50),2];}),errDec('-')],
 [dq('-',()=>{const a=R(2,9)*100;return [a,R(101,a-30),2];}),dq('-',()=>{const a=R(2,9)*1000;return [a,R(101,999),3];}),dq('-',()=>{const a=R(21,99)*10,b=R(101,a-20);return [a,b,2];}),dmissS(()=>{const a=R(301,999);return [a,R(101,a-101),2];}),closer('-',100,()=>{const a=R(505,995);return [a,R(105,a-205)];},v=>fd(v,2)),whichTrue('-',()=>{const a=dv(305,995);return [a,dv(105,a-150)];},100,v=>fd(v,2),(a,b)=>flipSub(a,b)),decStory('-',()=>{const a=R(3,9)*100;return [a,R(101,a-30),2];})],
 LS
]);
/* ---------- number-line taps (one per round, Silver to Diamond) ---------- */
const TAP=' Tap the number, then Check.';
const nlq=(prompt,nlt,text,explain,nudge)=>({prompt:prompt+TAP,tpl:'{A}',answer:1,nlt,text,explain,nudge,fast:15});
const nlCount=c=>{const lo=PK([80,90,100]);let k;do{k=R(1,19);}while(k%5===0);const n=lo+k,b=lo+Math.floor(k/5)*5;
 return nlq(`Tap <b>${n}</b> on the number line.`,{lo,hi:lo+20,den:1,ans:k,labs:[0,5,10,15,20]},`nlc${n}`,`<p>Find ${b}. Count on ${n-b} more: <b>${n}</b>.</p>`,`<p>Find the nearest number with a label, then count the little marks.</p>`);};
const nlTens=op=>c=>{let a,b;if(op==='+'){a=R(1,7)*10;b=R(1,9-a/10)*10;}else{[a,b]=sTens();}const v=op==='+'?a+b:a-b;
 return nlq(`Where does <b>${a} ${op==='+'?'+':'−'} ${b}</b> land?`,{lo:0,hi:100,step:10,ans:v/10},`nlt${a}${op}${b}`,`<p>${a/10} tens ${op==='+'?'+':'−'} ${b/10} tens = ${v/10} tens.</p><p>${a} ${op==='+'?'+':'−'} ${b} = <b>${v}</b>.</p>`,`<p>Each mark is 10. Start at ${a} and jump ${b/10} ${PL(b/10,'mark')} ${op==='+'?'forward':'back'}.</p>`);};
const nlJump=(op,span,lo0,mx0)=>c=>{const lo=lo0!=null?lo0:R(2,7)*10,hi=lo+span,mx=mx0||9;let st,j,e;
 do{if(op==='+'){st=R(lo+2,lo+9);j=R(lo+11-st,Math.min(hi-1-st,mx));e=st+j;}else{st=R(lo+11,hi-1);e=R(lo+1,lo+9);j=st-e;}}while(j<2||j>mx||e<=lo||e>=hi);
 const t=lo+10,f=op==='+'?t-st:st-t;
 return nlq(`Start at <b>${st}</b>. Jump <b>${j}</b> ${op==='+'?'forward':'back'}. Where do you land?`,{lo,hi,den:1,ans:e-lo,labs:Array.from({length:span/10+1},(_,i)=>i*10)},`nlj${st}${op}${j}`,
  `<p>${op==='+'?`Jump ${f} to get to ${t}, then ${j-f} more`:`Jump back ${f} to get to ${t}, then ${j-f} more`}.</p><p>${st} ${op==='+'?'+':'−'} ${j} = <b>${e}</b>.</p>`,`<p>Jump to ${t} first, then the rest.</p>`);};
const nlBig=(op,hi,step,fine)=>c=>{const L=hi/10,h=step/2;let v,a,b;for(let t=0;t<500;t++){do{v=rs(hi*0.3,op==='+'?hi*0.9:hi-L-step,step);}while(step<L&&v%L===0);
 if(fine){if(op==='+'){a=rs(L,v-L,h);b=v-a;}else{a=rs(v+L,hi-step,h);b=a-v;}if(a%step!==0&&b%step!==0&&b>=L&&a>=L)break;}
 else{if(op==='+'){a=rs(L,v-L,step);b=v-a;}else{a=rs(v+L,hi-step,step);b=a-v;}break;}}
 const lab=Array.from({length:11},(_,i)=>i*L/step).filter(i=>Number.isInteger(i));const fl=Math.floor(v/L)*L;
 return nlq(`Where does <b>${N(a)} ${op==='+'?'+':'−'} ${N(b)}</b> land?`,{lo:0,hi,step,ans:v/step,labs:lab},`nlb${a}${op}${b}`,`<p>${N(a)} ${op==='+'?'+':'−'} ${N(b)} = ${N(v)}.</p><p>${N(v)} is ${(v-fl)/step} ${PL((v-fl)/step,'mark')} after ${N(fl)}: <b>${N(v)}</b>.</p>`,`<p>Work it out first. Each little mark is ${N(step)}.</p>`);};
const nlDec=op=>c=>{let a,b,v;do{if(op==='+'){v=R(11,19);a=R(2,v-2);b=v-a;}else{a=R(1,2)*10;b=R(2,a-2);v=a-b;}}while(v%10===0||(op==='+'&&(a%10===0||b%10===0)));
 return nlq(`Where does <b>${fd(a,1)} ${op==='+'?'+':'−'} ${fd(b,1)}</b> land?`,{lo:0,hi:2,den:10,ans:v,dec:true},`nld${a}${op}${b}`,`<p>Think in tenths: ${a} ${op==='+'?'+':'−'} ${b} = ${v} tenths.</p><p>That is <b>${fd(v,1)}</b>.</p>`,'<p>Each little mark is one tenth (0.1).</p>');};
const NLX={add:{1:[nlCount,nlTens('+'),nlCount],2:[nlJump('+',20),nlBig('+',1000,50),nlJump('+',20,null,17)],3:[nlBig('+',1000,100),nlBig('+',1000,50,1),nlBig('+',1000,50,1)],4:[nlBig('+',10000,1000),nlBig('+',10000,500,1),nlBig('+',10000,500,1)],5:[nlDec('+'),nlDec('+'),nlDec('+')]},
 sub:{1:[nlJump('-',20,0),nlTens('-'),nlJump('-',20,0)],2:[nlJump('-',20),nlBig('-',1000,50),nlJump('-',20,null,17)],3:[nlBig('-',1000,100),nlBig('-',1000,50,1),nlBig('-',1000,50,1)],4:[nlBig('-',10000,500,1),nlBig('-',10000,500,1),nlBig('-',10000,500,1)],5:[nlDec('-'),nlDec('-'),nlDec('-')]}};
for(const op in NLX)for(const g in NLX[op])NLX[op][g].forEach((m,i)=>PLAN.PLAN[op][g][i+1].push(m));
})();
/* plan-muldiv.js: school-year plans for Multiplication Volcano (mul, grades 2-5), Division Castle (div, grades 3-5)
   and Array Reef (grp, grades 2-5). Each grade: [bronze, silver, gold, diamond, legend] lists of question makers. */
(function(){'use strict';const {R,PK,SH,P2,N,PL,F,FA,gcd,T,D,$$,WHO,choice,old}=PLAN.H;
/* ---------- small helpers ---------- */
const ex=(...a)=>a.filter(Boolean).map(s=>`<p>${s}</p>`).join('');
const nu=s=>`<p>${s}</p>`;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const rep=(n,g)=>Array(g).fill(N(n)).join(' + ');
const sk=(s,k,st=0)=>Array.from({length:k},(_,i)=>N(st+s*(i+1)));
const M=(a,b)=>`${N(a)} × ${N(b)}`;
const DIVS=(a,b)=>`${N(a)} ÷ ${N(b)}`;
const dec=(v,dp)=>D(v,dp).replace(/\.?0+$/,'');           /* 40,1 → "4"; 45,1 → "4.5" */
const lcm=(a,b)=>a*b/gcd(a,b);
const isPrime=n=>{if(n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true;};
const pw=k=>`10<sup>${k}</sup>`;
const swap=(a,b)=>Math.random()<.5?[a,b]:[b,a];
const FUN=[['🍎','apples'],['⭐','stars'],['🍪','cookies'],['🌸','flowers'],['🐞','ladybugs'],['🧁','cupcakes'],['🍓','strawberries'],['🎈','balloons'],['🍩','donuts'],['🐥','chicks']];
const SEA=[['🐠','fish'],['🐚','shells'],['🦀','crabs'],['🐙','octopuses'],['🐢','turtles'],['🐡','pufferfish'],['🦐','shrimp'],['🐬','dolphins']];
/* answer wrapper with defaults */
const Q=(o)=>Object.assign({fast:12},o);

/* ---------- equal-group story contexts (small numbers: groups ≤ 10, each ≤ 10) ---------- */
const EQ=c=>[
 {k:'qz',mul:(g,n)=>`Dr. Quartz has <b>${g}</b> lab coats. Each coat has <b>${n}</b> buttons.`,qm:'How many buttons are there in all?',um:'buttons',
  sh:(t,g)=>`Dr. Quartz sews <b>${t}</b> buttons onto <b>${g}</b> lab coats. Each coat gets the same number.`,qs:'How many buttons go on each coat?',
  gr:(t,n)=>`Dr. Quartz has <b>${t}</b> buttons. He sews <b>${n}</b> onto each lab coat.`,qg:'How many lab coats does he fill?',ug:'coats'},
 {k:'rosa',mul:(g,n)=>`Ms. Rosa bakes <b>${g}</b> trays of muffins. Each tray holds <b>${n}</b> muffins.`,qm:'How many muffins does she bake?',um:'muffins',
  sh:(t,g)=>`Ms. Rosa puts <b>${t}</b> muffins on <b>${g}</b> trays. Each tray gets the same number.`,qs:'How many muffins go on each tray?',
  gr:(t,n)=>`Ms. Rosa has <b>${t}</b> muffins. She puts <b>${n}</b> on each tray.`,qg:'How many trays does she fill?',ug:'trays'},
 {k:'flex',mul:(g,n)=>`Coach Flex does <b>${g}</b> sets of push-ups. Each set has <b>${n}</b> push-ups.`,qm:'How many push-ups does he do?',um:'push-ups',
  sh:(t,g)=>`Coach Flex does <b>${t}</b> push-ups in <b>${g}</b> equal sets.`,qs:'How many push-ups are in each set?',
  gr:(t,n)=>`Coach Flex does <b>${t}</b> push-ups, <b>${n}</b> in each set.`,qg:'How many sets does he do?',ug:'sets'},
 {k:'nana',mul:(g,n)=>`Nana Paws walks <b>${g}</b> dogs. She gives each dog <b>${n}</b> treats.`,qm:'How many treats does she give out?',um:'treats',
  sh:(t,g)=>`Nana Paws shares <b>${t}</b> treats equally among <b>${g}</b> dogs.`,qs:'How many treats does each dog get?',
  gr:(t,n)=>`Nana Paws has <b>${t}</b> treats. She gives each dog <b>${n}</b> treats.`,qg:'How many dogs get treats?',ug:'dogs'},
 {k:'giz',mul:(g,n)=>`Gizmo builds <b>${g}</b> gadgets. Each gadget needs <b>${n}</b> batteries.`,qm:'How many batteries does he need?',um:'batteries',
  sh:(t,g)=>`Gizmo puts <b>${t}</b> batteries into <b>${g}</b> gadgets, the same number in each.`,qs:'How many batteries go in each gadget?',
  gr:(t,n)=>`Gizmo has <b>${t}</b> batteries. Each gadget needs <b>${n}</b>.`,qg:'How many gadgets can he power?',ug:'gadgets'},
 {k:'gob',mul:(g,n)=>`The Grey Goblin fills <b>${g}</b> sacks. Each sack holds <b>${n}</b> stolen socks.`,qm:'How many socks did he steal?',um:'socks',
  sh:(t,g)=>`The Grey Goblin hides <b>${t}</b> stolen socks in <b>${g}</b> sacks, the same number in each.`,qs:'How many socks are in each sack?',
  gr:(t,n)=>`The Grey Goblin has <b>${t}</b> stolen socks. He stuffs <b>${n}</b> into each sack.`,qg:'How many sacks does he fill?',ug:'sacks'},
 {k:'ozzy',mul:(g,n)=>`Ozzy's train has <b>${g}</b> cars. Each car has <b>${n}</b> seats.`,qm:'How many seats are on the train?',um:'seats',
  sh:(t,g)=>`Ozzy's train has <b>${t}</b> seats in <b>${g}</b> cars. Each car has the same number.`,qs:'How many seats are in each car?',
  gr:(t,n)=>`Ozzy's train has <b>${t}</b> seats. Each car has <b>${n}</b> seats.`,qg:'How many cars does the train have?',ug:'cars'},
 {k:'wiz',mul:(g,n)=>`The Elder Wiz has <b>${g}</b> drawers. Each drawer holds <b>${n}</b> lonely socks.`,qm:'How many lonely socks does he have?',um:'socks',
  sh:(t,g)=>`The Elder Wiz sorts <b>${t}</b> lonely socks into <b>${g}</b> drawers, the same number in each.`,qs:'How many socks go in each drawer?',
  gr:(t,n)=>`The Elder Wiz has <b>${t}</b> lonely socks. He puts <b>${n}</b> in each drawer.`,qg:'How many drawers does he fill?',ug:'drawers'},
 {k:'tch',mul:(g,n)=>`The Kind Teacher has <b>${g}</b> kids in her group. She gives each kid <b>${n}</b> stickers.`,qm:'How many stickers does she give out?',um:'stickers',
  sh:(t,g)=>`The Kind Teacher shares <b>${t}</b> stickers equally among <b>${g}</b> kids.`,qs:'How many stickers does each kid get?',
  gr:(t,n)=>`The Kind Teacher has <b>${t}</b> stickers. She gives each kid <b>${n}</b>.`,qg:'How many kids get stickers?',ug:'kids'},
 {k:'troll',mul:(g,n)=>`<b>${g}</b> carts cross Grumbleroot's bridge. Each cart pays <b>${n}</b> coins.`,qm:'How many coins does Grumbleroot the troll collect?',um:'coins',
  sh:(t,g)=>`Grumbleroot the troll collects <b>${t}</b> coins from <b>${g}</b> carts. Each cart pays the same.`,qs:'How many coins does each cart pay?',
  gr:(t,n)=>`Grumbleroot the troll collects <b>${t}</b> coins. Each cart pays <b>${n}</b> coins.`,qg:'How many carts cross the bridge?',ug:'carts'},
 {k:'sky',mul:(g,n)=>`Skyla the eagle flies <b>${n}</b> miles each day for <b>${g}</b> days.`,qm:'How many miles does she fly?',um:'miles',
  sh:(t,g)=>`Skyla the eagle flies <b>${t}</b> miles in <b>${g}</b> days. She flies the same distance each day.`,qs:'How many miles does she fly each day?',
  gr:(t,n)=>`Skyla the eagle flies <b>${t}</b> miles. She flies <b>${n}</b> miles each day.`,qg:'How many days does it take?',ug:'days'},
 {k:'pet',mul:(g,n)=>`${cap(c.pet)} eats <b>${n}</b> treats each day for <b>${g}</b> days.`,qm:'How many treats is that?',um:'treats',
  sh:(t,g)=>`${cap(c.pet)} eats <b>${t}</b> treats in <b>${g}</b> days, the same number each day.`,qs:'How many treats does it eat each day?',
  gr:(t,n)=>`${cap(c.pet)} has <b>${t}</b> treats and eats <b>${n}</b> each day.`,qg:'How many days do the treats last?',ug:'days'},
 {k:'kid',mul:(g,n)=>`${c.name} plants <b>${g}</b> rows of flowers with <b>${n}</b> flowers in each row.`,qm:'How many flowers is that?',um:'flowers',
  sh:(t,g)=>`${c.name} plants <b>${t}</b> flowers in <b>${g}</b> equal rows.`,qs:'How many flowers are in each row?',
  gr:(t,n)=>`${c.name} plants <b>${t}</b> flowers, <b>${n}</b> in each row.`,qg:'How many rows are there?',ug:'rows'},
];
const unitOf=x=>x.qs.match(/How many (\S+)/)[1];

/* equal-groups multiplication story; pair() → [groups, each]; g2 = grade 2 (no × sign) */
const EQA=['qz','rosa','flex','nana','giz','gob','ozzy'];const eqPick=(c,keys)=>PK(EQ(c).filter(z=>!keys||keys.includes(z.k)===true));const notA=k=>!EQA.includes(k);
const EQB=['wiz','tch','troll','sky','pet','kid'];
const eqMul=(pair,g2,keys)=>c=>{let [g,n]=pair();const x=eqPick(c,keys),t=g*n;
 return Q({prompt:`${x.mul(g,n)} ${x.qm}`,tpl:`{A} ${x.um}`,answer:t,text:`eqm ${x.k} ${g} ${n}`,wp:1,fast:20,
  nudge:nu(g2?`There are ${g} equal groups of ${n}. Add ${n} again and again.`:`There are ${g} equal groups of ${n}. Multiply.`),
  explain:g2?ex(`${g} groups of ${n}: ${rep(n,g)} = <b>${t}</b>`):ex(`${g} groups of ${n}`,`${g} × ${n} = <b>${t}</b>`)});};
/* sharing (how many in each) */
const eqShare=(pair,keys)=>c=>{let [g,n]=pair();const x=eqPick(c,keys),t=g*n;
 return Q({prompt:`${x.sh(t,g)} ${x.qs}`,tpl:`{A} ${unitOf(x)}`,answer:n,text:`eqs ${x.k} ${t} ${g}`,wp:1,fast:20,
  nudge:nu(`Share ${t} into ${g} equal groups. What times ${g} makes ${t}?`),
  explain:ex(`${t} ÷ ${g} = <b>${n}</b>`,`Check: ${g} × ${n} = ${t}`)});};
/* how many groups */
const eqGroups=(pair,keys)=>c=>{let [g,n]=pair();const x=eqPick(c,keys),t=g*n;
 return Q({prompt:`${x.gr(t,n)} ${x.qg}`,tpl:`{A} ${x.ug}`,answer:g,text:`eqg ${x.k} ${t} ${n}`,wp:1,fast:20,
  nudge:nu(`How many groups of ${n} make ${t}?`),
  explain:ex(`${t} ÷ ${n} = <b>${g}</b>`,`Check: ${g} × ${n} = ${t}`)});};

/* basic fact: one factor from As, other from Bs */
const fact=(As,Bs)=>c=>{let [a,b]=swap(PK(As),PK(Bs));const s=Math.random()<.5?[a,b]:[b,a];
 const big=Math.max(a,b),small=Math.min(a,b);
 return Q({tpl:`${a} × ${b} = {A}`,answer:a*b,text:`f ${a}x${b}`,fast:8,mem:small<2?['rule']:[],
  nudge:nu(small===0?'What is any number times 0?':small===1?'What is any number times 1?':`Count by ${big}s, ${small} times.`),
  explain:small===0?ex(`Zero groups, or groups of zero, make 0.`,`${a} × ${b} = <b>0</b>`):small===1?ex(`One group of ${big} is ${big}.`,`${a} × ${b} = <b>${a*b}</b>`):
   ex(`Count by ${big}s, ${small} times: ${sk(big,small).join(', ')}`,`${a} × ${b} = <b>${a*b}</b>`)});};
/* division fact: divisor from Ds, quotient from Qs */
const dfact=(Ds,Qs)=>c=>{const d=PK(Ds),q=PK(Qs),t=d*q;
 return Q({tpl:`${t} ÷ ${d} = {A}`,answer:q,text:`d ${t}/${d}`,fast:8,
  nudge:nu(`Think: ${d} × what = ${t}?`),explain:ex(`${d} × ${q} = ${t}`,`So ${t} ÷ ${d} = <b>${q}</b>`)});};
/* missing factor */
const mfact=(As,Bs)=>c=>{const a=PK(As),b=PK(Bs),t=a*b;const left=Math.random()<.5;
 return Q({tpl:left?`${a} × {A} = ${t}`:`{A} × ${a} = ${t}`,answer:b,text:`mf ${a} ${t} ${left}`,fast:10,
  nudge:nu(`How many ${a}s make ${t}? Think ${t} ÷ ${a}.`),explain:ex(`${t} ÷ ${a} = ${b}`,`${left?`${a} × <b>${b}</b>`:`<b>${b}</b> × ${a}`} = ${t}`)});};

/* skip counting sequence; steps list; o.off: not from a multiple; o.mid: blank in the middle; o.back: may count down */
const skipSeq=(steps,o={})=>c=>{const s=PK(steps);const kmax=s===100?5:s===10?50:s===5?25:s===2?30:12;
 const off=o.off&&(o.off===2||Math.random()<.7)?(s===100?10*R(1,9):s===10?R(1,9):R(1,s-1)):0;
 const a=s*R(o.off?0:1,kmax)+off;let seq=[0,1,2,3,4].map(i=>a+i*s);const back=o.back&&Math.random()<.5;if(back)seq.reverse();
 const pos=o.mid?R(1,3):4;const show=seq.map((v,i)=>i===pos?'{A}':N(v)).join(', ');
 return Q({prompt:`Count ${back?'back ':''}by <b>${s}s</b>.`,tpl:show,answer:seq[pos],text:`sk ${seq.join(',')} ${pos}`,fast:10,
  nudge:nu(`Each number is ${s} ${back?'less':'more'} than the one before.`),
  explain:ex(`${back?'Take away':'Add'} ${s} each time:`,seq.map((v,i)=>i===pos?`<b>${N(v)}</b>`:N(v)).join(', '))});};

/* ===================================================== MULTIPLICATION ===================================================== */
/* ---- grade 2: equal groups, repeated addition, arrays, skip counting (no × sign) ---- */
const m2hands=c=>{const n=R(2,9);return Q({prompt:`${'✋'.repeat(n)}<br>Count the fingers by 5s.`,tpl:'{A} fingers',answer:5*n,text:`hands ${n}`,tk:'by5',
 nudge:nu('Each hand has 5 fingers. Count 5, 10, 15, …'),explain:ex(`${n} hands: ${sk(5,n).join(', ')}`,`That is <b>${5*n}</b> fingers.`)});};
const m2coins=c=>{const v=PK([5,10]),n=R(3,v===10?9:8);return Q({prompt:`How many cents? Count by ${v}s.`,vis:{t:'coins',list:Array(n).fill(v)},tpl:'{A}¢',answer:v*n,text:`coins ${v} ${n}`,tk:'by'+v,
 nudge:nu(v===10?'A dime is 10¢. Count 10, 20, 30, …':'A nickel is 5¢. Count 5, 10, 15, …'),explain:ex(`${sk(v,n).join(', ')}`,`<b>${v*n}¢</b>`)});};
const m2bundles=c=>{const n=R(3,9),o=R(0,1)?R(1,9):0;return Q({prompt:`Ozzy ties sticks into bundles of 10. He has <b>${n}</b> bundles${o?` and <b>${o}</b> loose ${PL(o,'stick')}`:''}. Count by 10s${o?', then add the loose ones':''}. How many sticks?`,tpl:'{A} sticks',answer:10*n+o,text:`bun ${n} ${o}`,wp:1,fast:15,
 nudge:nu('Count 10, 20, 30, …'),explain:ex(`${sk(10,n).join(', ')}`,o?`${10*n} + ${o} = <b>${10*n+o}</b>`:`<b>${10*n}</b> sticks`)});};
const m2wheels=c=>{const n=R(3,9);return Q({prompt:`${n} bikes are parked by Ms. Rosa's café. Each bike has 2 wheels. How many wheels?`,tpl:'{A} wheels',answer:2*n,text:`whl ${n}`,wp:1,fast:15,
 nudge:nu('Count by 2s: 2, 4, 6, …'),explain:ex(`${sk(2,n).join(', ')}`,`<b>${2*n}</b> wheels`)});};
const m2socks=c=>{const k=R(3,10);return Q({prompt:`The Grey Goblin stole <b>${k}</b> pairs of socks. A pair is 2 socks. How many socks did he steal?`,vis:{t:'set',n:2*k,e:'🧦'},tpl:'{A} socks',answer:2*k,text:`socks ${k}`,wp:1,fast:15,
 nudge:nu('Count by 2s: 2, 4, 6, …'),explain:ex(`${sk(2,k).join(', ')}`,`<b>${2*k}</b> socks`)});};
const m2groupsAdd=(gm,nm)=>c=>{const g=R(2,gm),n=R(2,nm),e=PK(FUN);return Q({prompt:`<b>${g}</b> groups of <b>${n}</b> ${e[1]}. Add the groups.`,vis:{t:'groups',g,n,e:e[0]},tpl:`${rep(n,g)} = {A}`,answer:g*n,text:`ga ${g} ${n}`,
 nudge:nu(`Add ${n} again and again, ${g} times. Or count by ${n}s.`),explain:ex(`${rep(n,g)} = <b>${g*n}</b>`)});};
const m2groupsWords=c=>{const g=R(2,5),n=R(2,5);return Q({prompt:`Ms. Rosa makes <b>${g}</b> plates. She puts <b>${n}</b> cookies on each plate. How many cookies is that?`,tpl:'{A} cookies',answer:g*n,text:`plates ${g} ${n}`,wp:1,fast:20,
 nudge:nu(`Draw ${g} plates with ${n} cookies on each. Count them all.`),explain:ex(`${rep(n,g)} = <b>${g*n}</b> cookies`)});};
const m2arrayRows=(rm,cm,mn)=>c=>{const r=R(mn||2,rm),k=R(mn||2,cm),e=PK(FUN);return Q({prompt:`<b>${r}</b> rows with <b>${k}</b> in each row. Add the rows.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${rep(k,r)} = {A}`,answer:r*k,text:`ar ${r} ${k}`,
 nudge:nu(`Each row has ${k}. Add a ${k} for every row.`),explain:ex(`${rep(k,r)} = <b>${r*k}</b>`)});};
const m2arrayCols=c=>{const r=R(3,5),k=R(3,5),e=PK(FUN);return Q({prompt:`This time add the <b>columns</b>. Each column has <b>${r}</b>.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${rep(r,k)} = {A}`,answer:r*k,text:`ac ${r} ${k}`,
 nudge:nu(`There are ${k} columns. Add ${r} for each one.`),explain:ex(`${rep(r,k)} = <b>${r*k}</b>`,`Rows or columns, the total is the same.`)});};
const m2arrayTotal=c=>{const r=R(3,5),k=R(3,5),e=PK(FUN);return Q({prompt:`How many ${e[1]} are in this array?`,vis:{t:'array',r,c:k,e:e[0]},tpl:`{A} ${e[1]}`,answer:r*k,text:`at ${r} ${k} ${e[1]}`,
 nudge:nu(`Count the rows and how many are in each row. Skip count.`),explain:ex(`${r} rows of ${k}: ${rep(k,r)} = <b>${r*k}</b>`)});};
const ARR2=c=>[
 (r,k)=>[`The Kind Teacher sets out chairs in <b>${r}</b> rows. Each row has <b>${k}</b> chairs.`,'How many chairs are there?','chairs'],
 (r,k)=>[`${c.name} plants a garden with <b>${r}</b> rows of carrots. Each row has <b>${k}</b> carrots.`,'How many carrots are there?','carrots'],
 (r,k)=>[`Ms. Rosa fills a muffin pan. It has <b>${r}</b> rows with <b>${k}</b> muffins in each row.`,'How many muffins are in the pan?','muffins'],
 (r,k)=>[`Dr. Quartz lines up crystals in <b>${r}</b> rows of <b>${k}</b>.`,'How many crystals are there?','crystals'],
 (r,k)=>[`Ozzy parks toy trains in <b>${r}</b> rows. Each row has <b>${k}</b> trains.`,'How many toy trains are there?','trains']];
const m2arrStory=(rm,cm,mn)=>c=>{const r=R(mn||2,rm),k=R(mn||2,cm);const [s,q,u]=PK(ARR2(c))(r,k);return Q({prompt:`${s} ${q}`,tpl:`{A} ${u}`,answer:r*k,text:`as ${u} ${r} ${k}`,wp:1,fast:20,
 nudge:nu(`Add ${k} for each of the ${r} rows.`),explain:ex(`${rep(k,r)} = <b>${r*k}</b> ${u}`)});};
const m2compare=c=>{let a=[R(2,5),R(2,5)],b=[R(2,5),R(2,5)];while(a[0]*a[1]<=b[0]*b[1]){a=[R(2,5),R(3,5)];b=[R(2,4),R(2,4)];}
 const A=a[0]*a[1],B=b[0]*b[1];return Q({prompt:`Skyla the eagle counts <b>${a[0]}</b> rows of <b>${a[1]}</b> crabs on one rock. On another rock she counts <b>${b[0]}</b> rows of <b>${b[1]}</b> crabs. How many more crabs are on the first rock?`,tpl:'{A} more crabs',answer:A-B,text:`cmp ${a} ${b}`,wp:1,fast:30,
 nudge:nu('Find each total first. Then subtract.'),explain:ex(`First rock: ${rep(a[1],a[0])} = ${A}`,`Second rock: ${rep(b[1],b[0])} = ${B}`,`${A} − ${B} = <b>${A-B}</b>`)});};
const m2twoStep=c=>{const t=PK(['chairs','eggs','coins']);
 if(t==='chairs'){const r=R(3,5),k=R(3,5),u=R(2,r*k-3);return Q({prompt:`The Kind Teacher sets out <b>${r}</b> rows of <b>${k}</b> chairs. <b>${u}</b> kids sit down. How many chairs are still empty?`,tpl:'{A} chairs',answer:r*k-u,text:`2s ch ${r} ${k} ${u}`,wp:1,fast:30,
  nudge:nu('How many chairs in all? Then take away the full ones.'),explain:ex(`${rep(k,r)} = ${r*k} chairs`,`${r*k} − ${u} = <b>${r*k-u}</b>`)});}
 if(t==='eggs'){const g=R(2,4),n=PK([5,6]),m=R(2,9);return Q({prompt:`Ms. Rosa has <b>${g}</b> egg boxes with <b>${n}</b> eggs each. She also has <b>${m}</b> loose eggs. How many eggs does she have?`,tpl:'{A} eggs',answer:g*n+m,text:`2s eg ${g} ${n} ${m}`,wp:1,fast:30,
  nudge:nu('Add the boxes first. Then add the loose eggs.'),explain:ex(`${rep(n,g)} = ${g*n}`,`${g*n} + ${m} = <b>${g*n+m}</b>`)});}
 const d=R(2,5),k=R(1,4);return Q({prompt:`${c.name} has <b>${d}</b> dimes and <b>${k}</b> ${PL(k,'nickel')}. How many cents is that?`,vis:{t:'coins',list:[...Array(d).fill(10),...Array(k).fill(5)]},tpl:'{A}¢',answer:10*d+5*k,text:`2s co ${d} ${k}`,wp:1,fast:25,
  nudge:nu('Count the dimes by 10s, then keep going by 5s.'),explain:ex(`${sk(10,d).join(', ')}, then ${sk(5,k,10*d).join(', ')}`,`<b>${10*d+5*k}¢</b>`)});};

/* ---- grade 3 ---- */
const m3groupsVis=(Ns)=>c=>{const g=R(2,5),n=PK(Ns),e=PK(FUN);return Q({prompt:`<b>${g}</b> groups of <b>${n}</b>. Write it as multiplication.`,vis:{t:'groups',g,n,e:e[0]},tpl:`${g} × ${n} = {A}`,answer:g*n,text:`gv ${g} ${n}`,
 nudge:nu(`${g} groups of ${n} means ${g} × ${n}.`),explain:ex(`${rep(n,g)} = ${g*n}`,`${g} × ${n} = <b>${g*n}</b>`)});};
const m3arrayVis=(Ns)=>c=>{const r=PK(Ns),k=R(2,6),e=PK(FUN);return Q({prompt:`<b>${r}</b> rows of <b>${k}</b>.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r} × ${k} = {A}`,answer:r*k,text:`av ${r} ${k}`,
 nudge:nu(`Count by ${k}s, one count for each row.`),explain:ex(`${sk(k,r).join(', ')}`,`${r} × ${k} = <b>${r*k}</b>`)});};
const m3turn=c=>{const a=R(2,9),b=R(2,9);if(a===b)return m3turn(c);return Q({prompt:'Turn the factors around.',tpl:`${a} × ${b} = ${b} × {A}`,answer:a,text:`turn ${a} ${b}`,fast:8,
 nudge:nu('You can multiply in any order and get the same answer.'),explain:ex(`${a} × ${b} and ${b} × ${a} are both ${a*b}.`,`So the box is <b>${a}</b>.`)});};
const m3double=c=>{const n=R(3,9),s=PK([4,6,8]);const h=s/2;return Q({prompt:`Use a double. ${h} × ${n} = <b>${h*n}</b>.`,tpl:`${s} × ${n} = {A}`,answer:s*n,text:`dbl ${s} ${n}`,fast:10,
 nudge:nu(`${s} is double ${h}. So ${s} × ${n} is double ${h*n}.`),explain:ex(`${h} × ${n} = ${h*n}`,`Double it: ${h*n} + ${h*n} = <b>${s*n}</b>`)});};
const m3break=c=>{const a=PK([6,7,8,9]),b=PK([6,7,8,9]);return Q({prompt:`Break ${b} into 5 and ${b-5}.`,tpl:`${a} × ${b} = ${a*5} + ${a*(b-5)} = {A}`,answer:a*b,text:`brk ${a} ${b}`,fast:12,
 nudge:nu(`${a} × 5 = ${a*5} and ${a} × ${b-5} = ${a*(b-5)}. Add them.`),explain:ex(`${a} × 5 = ${a*5}`,`${a} × ${b-5} = ${a*(b-5)}`,`${a*5} + ${a*(b-5)} = <b>${a*b}</b>`)});};
const m3nine=c=>{const n=R(2,10);return Q({prompt:`Nine trick: 10 × ${n} = ${10*n}. Take away one ${n}.`,tpl:`9 × ${n} = {A}`,answer:9*n,text:`nine ${n}`,fast:10,
 nudge:nu(`9 groups is one group less than 10 groups.`),explain:ex(`10 × ${n} = ${10*n}`,`${10*n} − ${n} = <b>${9*n}</b>`)});};
const m3tens=(As,Ts)=>c=>{const a=PK(As),t=PK(Ts)*10;const [x,y]=swap(a,t);return Q({tpl:`${x} × ${y} = {A}`,answer:a*t,text:`ten ${x} ${y}`,fast:10,
 nudge:nu(`Find ${a} × ${t/10}, then make it ten times bigger.`),explain:ex(`${a} × ${t/10} = ${a*t/10}`,`${a} × ${t/10} tens = ${a*t/10} tens = <b>${a*t}</b>`)});};
const m3three=c=>{const a=PK([2,3,5]),b=PK([2,3,4,5]),d=PK([2,5,10].filter(z=>z!==a));return Q({prompt:'Multiply two numbers first, then the third.',tpl:`${a} × ${b} × ${d} = {A}`,answer:a*b*d,text:`3f ${a} ${b} ${d}`,fast:12,
 nudge:nu('Pick the easiest pair to start with.'),explain:ex(`${a} × ${b} = ${a*b}`,`${a*b} × ${d} = <b>${a*b*d}</b>`)});};
const m3mfStory=c=>{const x=PK(EQ(c)),g=R(3,9),n=R(3,9),t=g*n;return Q({prompt:`${x.gr(t,n)} ${x.qg}`,tpl:`${n} × {A} = ${t}`,answer:g,text:`mfs ${x.k} ${t} ${n}`,wp:1,fast:20,
 nudge:nu(`How many ${n}s make ${t}?`),explain:ex(`${n} × ${g} = ${t}`,`So it is <b>${g}</b>.`)});};
const m3tenStory=c=>{const g=R(2,9),n=PK([10,20,30,40,50]),k=PK(['box','bus','bag']);
 const s=k==='box'?[`Dr. Quartz has <b>${g}</b> boxes. Each box holds <b>${n}</b> crystals.`,'How many crystals is that?','crystals']:
  k==='bus'?[`<b>${g}</b> buses come to the castle. Each bus carries <b>${n}</b> kids.`,'How many kids is that?','kids']:
  [`Grumbleroot the troll has <b>${g}</b> bags. Each bag holds <b>${n}</b> coins.`,'How many coins does he have?','coins'];
 return Q({prompt:`${s[0]} ${s[1]}`,tpl:`{A} ${s[2]}`,answer:g*n,text:`ts ${k} ${g} ${n}`,wp:1,fast:20,nudge:nu(`Find ${g} × ${n/10}, then make it tens.`),explain:ex(`${g} × ${n} = <b>${g*n}</b>`,`(${g} × ${n/10} = ${g*n/10}, so ${g*n/10} tens.)`)});};
/* two-step grade 3 stories */
const m3two=c=>{const k=c.k!=null?c.k:R(0,4);
 if(k===6){const g=R(3,6),n=R(3,8),a=R(2,3);return Q({prompt:`Nana Paws knits <b>${g}</b> scarves with <b>${n}</b> stripes each. Then she knits <b>${a}</b> more scarves just like them. How many stripes are there in all?`,tpl:'{A} stripes',answer:(g+a)*n,text:`m3t6 ${g} ${n} ${a}`,wp:1,fast:35,
  nudge:nu('How many scarves in all? Then multiply.'),explain:ex(`${g} + ${a} = ${g+a} scarves`,`${g+a} × ${n} = <b>${(g+a)*n}</b>`)});}
 if(k===7){const b=R(3,6),n=PK([4,6,8]),m=PK([2,3,4,6,8].filter(z=>(b*n)%z===0&&z!==b&&z!==n&&(b*n)/z<=10&&(b*n)/z>1));if(!m)return m3two(c);return Q({prompt:`Coach Flex has <b>${b}</b> boxes of <b>${n}</b> balls. He shares all the balls equally among <b>${m}</b> teams. How many balls does each team get?`,tpl:'{A} balls',answer:b*n/m,text:`m3t7 ${b} ${n} ${m}`,wp:1,fast:35,
  nudge:nu('How many balls in all? Then share.'),explain:ex(`${b} × ${n} = ${b*n}`,`${b*n} ÷ ${m} = <b>${b*n/m}</b>`)});}
 if(k===0){const g=R(3,6),n=R(4,9),e=R(2,n-1);return Q({prompt:`${c.name} buys <b>${g}</b> bags of <b>${n}</b> apples. ${cap(c.pet)} eats <b>${e}</b> of them. How many apples are left?`,tpl:'{A} apples',answer:g*n-e,text:`m3t0 ${g} ${n} ${e}`,wp:1,fast:30,
  nudge:nu('First find how many apples in all. Then take away.'),explain:ex(`${g} × ${n} = ${g*n}`,`${g*n} − ${e} = <b>${g*n-e}</b>`)});}
 if(k===1){const a=R(3,6),b=R(5,9),d=R(4,8),e=R(4,9);if(a*b===d*e)return m3two(c);const [A,B]=a*b>d*e?[[a,b,'Coach Flex'],[d,e,'Gizmo']]:[[d,e,'Gizmo'],[a,b,'Coach Flex']];
  return Q({prompt:`Coach Flex does <b>${a}</b> sets of <b>${b}</b> push-ups. Gizmo does <b>${d}</b> sets of <b>${e}</b> push-ups. How many more push-ups does ${A[2]} do?`,tpl:'{A} more push-ups',answer:A[0]*A[1]-B[0]*B[1],text:`m3t1 ${a} ${b} ${d} ${e}`,wp:1,fast:35,
  nudge:nu('Find each total. Then subtract.'),explain:ex(`Coach Flex: ${a} × ${b} = ${a*b}`,`Gizmo: ${d} × ${e} = ${d*e}`,`${A[0]*A[1]} − ${B[0]*B[1]} = <b>${A[0]*A[1]-B[0]*B[1]}</b>`)});}
 if(k===2){const g=R(3,8),n=R(3,9),m=R(3,15);return Q({prompt:`Ozzy's train has <b>${g}</b> cars with <b>${n}</b> seats each. The engine has <b>${m}</b> more seats. How many seats are there in all?`,tpl:'{A} seats',answer:g*n+m,text:`m3t2 ${g} ${n} ${m}`,wp:1,fast:30,
  nudge:nu('Multiply for the cars, then add the engine seats.'),explain:ex(`${g} × ${n} = ${g*n}`,`${g*n} + ${m} = <b>${g*n+m}</b>`)});}
 if(k===3){const g=R(2,5),n=PK([6,8,10]),pr=R(2,5);return Q({prompt:`Ms. Rosa sells <b>${g}</b> boxes of <b>${n}</b> cookies. Each cookie costs <b>${pr}</b> coins. How many coins does she get?`,tpl:'{A} coins',answer:g*n*pr,text:`m3t3 ${g} ${n} ${pr}`,wp:1,fast:35,
  nudge:nu('How many cookies? Then how many coins for all of them?'),explain:ex(`${g} × ${n} = ${g*n} cookies`,`${g*n} × ${pr} = <b>${g*n*pr}</b> coins`)});}
 if(k===5){const b=R(3,8),n=PK([20,30,40,50]),sp=PK([10,20,30].filter(z=>z<b*n));return Q({prompt:`Grumbleroot the troll has <b>${b}</b> bags with <b>${n}</b> coins in each bag. He spends <b>${sp}</b> coins on troll snacks. How many coins does he have left?`,tpl:'{A} coins',answer:b*n-sp,text:`m3t5 ${b} ${n} ${sp}`,wp:1,fast:35,
  nudge:nu('How many coins in the bags? Then take away the snacks.'),explain:ex(`${b} × ${n} = ${b*n}`,`${b*n} − ${sp} = <b>${b*n-sp}</b>`)});}
 const g=R(4,8),n=R(3,6),l=R(1,g-2);return Q({prompt:`Dr. Quartz has <b>${g}</b> lab coats with <b>${n}</b> buttons each. <b>${l}</b> ${PL(l,'coat is','coats are')} in the wash. How many buttons are on the coats that are not in the wash?`,tpl:'{A} buttons',answer:(g-l)*n,text:`m3t4 ${g} ${n} ${l}`,wp:1,fast:35,
  nudge:nu('How many coats are left? Then count their buttons.'),explain:ex(`${g} − ${l} = ${g-l} coats`,`${g-l} × ${n} = <b>${(g-l)*n}</b>`)});};

/* ---- grade 4 ---- */
/* bigger-number contexts: a each, b groups; amax/bmax keep them realistic */
const BIGM=c=>[
 {k:'stad',amin:60,bmin:8,amax:9999,bmax:99,s:(a,b)=>`The stadium has <b>${b}</b> sections. Each section has <b>${N(a)}</b> seats.`,q:'How many seats are there?',u:'seats'},
 {k:'page',amax:99,bmax:30,s:(a,b)=>`The Elder Wiz reads <b>${a}</b> pages of his spell book each day for <b>${b}</b> days.`,q:'How many pages does he read?',u:'pages'},
 {k:'step',amax:400,bmax:9,s:(a,b)=>`Coach Flex runs up the <b>${a}</b> steps of the tower <b>${b}</b> times.`,q:'How many steps does he run up?',u:'steps'},
 {k:'coin',amax:999,bmax:31,s:(a,b)=>`Grumbleroot the troll collects <b>${N(a)}</b> coins every day for <b>${b}</b> days.`,q:'How many coins does he collect?',u:'coins'},
 {k:'mile',amax:500,bmax:52,s:(a,b)=>`Skyla the eagle flies <b>${a}</b> miles each week for <b>${b}</b> weeks.`,q:'How many miles does she fly?',u:'miles'},
 {k:'train',amax:300,bmax:40,s:(a,b)=>`Ozzy's train carries <b>${a}</b> riders on each trip. It makes <b>${b}</b> trips.`,q:'How many riders does it carry?',u:'riders'},
 {k:'cook',amax:200,bmax:31,s:(a,b)=>`Ms. Rosa's café sells <b>${a}</b> cookies each day for <b>${b}</b> days.`,q:'How many cookies does she sell?',u:'cookies'},
 {k:'pts',amax:5000,bmax:99,s:(a,b)=>`${c.name} wins <b>${b}</b> gems in a game. Each gem is worth <b>${N(a)}</b> points.`,q:'How many points is that?',u:'points'},
 {k:'sand',amin:1000,amax:9999,bmax:9,s:(a,b)=>`Ozzy shrinks you down to count sand. One bucket holds <b>${N(a)}</b> grains. You count <b>${b}</b> buckets.`,q:'How many grains is that?',u:'grains'},
];
const bigStory=(ga,gb,how)=>c=>{let a,b,x;for(let i=0;i<50;i++){a=ga();b=gb();const ok=BIGM(c).filter(z=>a<=z.amax&&b<=z.bmax&&a>=(z.amin||0)&&b>=(z.bmin||0));if(ok.length){x=PK(ok);break;}}
 if(!x){x=BIGM(c)[0];}const t=a*b;return Q({prompt:`${x.s(a,b)} ${x.q}`,tpl:`{A} ${x.u}`,answer:t,text:`bs ${x.k} ${a} ${b}`,wp:1,fast:30,
 nudge:nu(how||`Multiply ${N(a)} × ${N(b)}.`),explain:splitExplain(a,b)});};
/* explain a × b by place value of the bigger side when the other is 1 digit, else by tens and ones of b */
function splitExplain(a,b){const t=a*b;
 if(b<10||a<10){const big=Math.max(a,b),sm=Math.min(a,b);const parts=String(big).split('').map((d,i,s)=>+d*Math.pow(10,s.length-1-i)).filter(v=>v);
  if(parts.length===1)return ex(`${sm} × ${N(big)} = <b>${N(t)}</b>`);
  return ex(`${N(big)} = ${parts.map(N).join(' + ')}`,parts.map(p=>`${sm} × ${N(p)} = ${N(sm*p)}`).join('; '),`${parts.map(p=>N(sm*p)).join(' + ')} = <b>${N(t)}</b>`);}
 const tb=Math.floor(b/10)*10,ob=b%10;if(!ob)return ex(`${N(a)} × ${b/10} = ${N(a*b/10)}`,`${N(a*b/10)} × 10 = <b>${N(t)}</b>`);
 return ex(`${N(a)} × ${tb} = ${N(a*tb)}`,`${N(a)} × ${ob} = ${N(a*ob)}`,`${N(a*tb)} + ${N(a*ob)} = <b>${N(t)}</b>`);}
const mplain=(ga,gb,fast)=>c=>{const a=ga(),b=gb();const [x,y]=b<10&&Math.random()<.3?[b,a]:[a,b];return Q({tpl:`${M(x,y)} = {A}`,answer:a*b,text:`mp ${a} ${b}`,fast:fast||25,
 nudge:nu(b<10?`Break ${N(a)} into place values. Multiply each part by ${b}.`:`Break ${b} into tens and ones. Multiply ${N(a)} by each part.`),explain:splitExplain(a,b)});};
const m4hund=c=>{const a=R(2,9),k=PK([10,100,1000]),m=R(2,9)*k;const [x,y]=swap(a,m);return Q({tpl:`${M(x,y)} = {A}`,answer:a*m,text:`h ${x} ${y}`,fast:10,
 nudge:nu(`Think ${a} × ${m/k}, then add the zeros.`),explain:ex(`${a} × ${m/k} = ${a*m/k}`,`${a} × ${N(m)} = <b>${N(a*m)}</b>`)});};
const m4missTen=c=>{const a=R(3,9),m=R(2,9)*PK([10,100]);return Q({tpl:`${a} × {A} = ${N(a*m)}`,answer:m,text:`mt ${a} ${m}`,fast:12,
 nudge:nu(`Which fact of ${a} is hiding here? Then think about the zeros.`),explain:ex(`${a} × ${m/(m>=100?100:10)} = ${a*m/(m>=100?100:10)}`,`So ${a} × <b>${N(m)}</b> = ${N(a*m)}`)});};
const m4partial=c=>{const a=R(12,98),b=R(3,9);if(a%10===0)return m4partial(c);const t=a-a%10,u=a%10;return Q({prompt:`Break ${a} into ${t} and ${u}.`,tpl:`${a} × ${b} = ${N(t*b)} + {A}`,answer:u*b,text:`pp ${a} ${b}`,fast:12,
 nudge:nu(`${t} × ${b} is done. What is the other part?`),explain:ex(`${a} × ${b} = ${t} × ${b} + ${u} × ${b}`,`${u} × ${b} = <b>${u*b}</b>`)});};
const m4tt=c=>{const a=R(2,9)*10,b=R(2,9)*10;return Q({tpl:`${a} × ${b} = {A}`,answer:a*b,text:`tt ${a} ${b}`,fast:12,
 nudge:nu(`${a/10} × ${b/10}, then add two zeros.`),explain:ex(`${a/10} × ${b/10} = ${a*b/100}`,`${a} × ${b} = <b>${N(a*b)}</b>`)});};
const m4area=c=>{const a=R(23,49),b=R(13,29);const at=a-a%10,au=a%10,bt=b-b%10,bu=b%10;if(au<3||bu<3)return m4area(c);
 const k=R(0,2);const parts=[at*bt,at*bu,au*bt,au*bu];const lab=[`${at} × ${bt}`,`${at} × ${bu}`,`${au} × ${bt}`,`${au} × ${bu}`];
 return Q({prompt:`Area model for ${a} × ${b}: ${lab.map((l,i)=>i===k?`<b>${l} = ?</b>`:`${l} = ${parts[i]}`).join(', ')}.`,tpl:`${lab[k]} = {A}`,answer:parts[k],text:`am ${a} ${b} ${k}`,fast:12,
 nudge:nu('Multiply the two parts of this box.'),explain:ex(`${lab[k]} = <b>${parts[k]}</b>`,`All four parts: ${parts.join(' + ')} = ${N(a*b)}`)});};
/* "times as many" (4.OA.1-2) */
const TAM=c=>[
 (s,k)=>[`Skyla the eagle flew <b>${s}</b> miles. Gizmo's rocket drone flew <b>${k}</b> times as far.`,'How many miles did the drone fly?','miles',
   `Gizmo's rocket drone flew <b>${s*k}</b> miles. That is <b>${k}</b> times as far as Skyla the eagle flew.`,'How many miles did Skyla fly?'],
 (s,k)=>[`Gizmo did <b>${s}</b> push-ups. Coach Flex did <b>${k}</b> times as many.`,'How many push-ups did Coach Flex do?','push-ups',
   `Coach Flex did <b>${s*k}</b> push-ups. That is <b>${k}</b> times as many as Gizmo.`,'How many push-ups did Gizmo do?'],
 (s,k)=>[`Nana Paws knitted <b>${s}</b> hats. The Kind Teacher's class knitted <b>${k}</b> times as many.`,'How many hats did the class knit?','hats',
   `The Kind Teacher's class knitted <b>${s*k}</b> hats. That is <b>${k}</b> times as many as Nana Paws knitted.`,'How many hats did Nana Paws knit?'],
 (s,k)=>[`The Grey Goblin stole <b>${s}</b> red socks. He stole <b>${k}</b> times as many blue socks.`,'How many blue socks did he steal?','socks',
   `The Grey Goblin stole <b>${s*k}</b> blue socks. That is <b>${k}</b> times as many as the red socks he stole.`,'How many red socks did he steal?'],
 (s,k)=>[`${c.name} read <b>${s}</b> pages. Ms. Rosa read <b>${k}</b> times as many pages.`,'How many pages did Ms. Rosa read?','pages',
   `Ms. Rosa read <b>${s*k}</b> pages. That is <b>${k}</b> times as many as ${c.name} read.`,'How many pages did '+c.name+' read?'],
];
const m4times=(sm,km,back,smin,kmin,ids)=>c=>{const s=R(smin||3,sm),k=R(kmin||2,km);const st=PK(TAM(c).filter((_,i)=>!ids||ids.includes(i)))(s,k);const rev=back&&Math.random()<.4;
 if(rev)return Q({prompt:`${st[3]} ${st[4]}`,tpl:`{A} ${st[2]}`,answer:s,text:`tam r ${st[2]} ${s} ${k}`,wp:1,fast:25,
  nudge:nu(`${k} times what number makes ${s*k}?`),explain:ex(`${k} × ? = ${s*k}`,`${s*k} ÷ ${k} = <b>${s}</b>`)});
 return Q({prompt:`${st[0]} ${st[1]}`,tpl:`{A} ${st[2]}`,answer:s*k,text:`tam ${st[2]} ${s} ${k}`,wp:1,fast:25,
  nudge:nu(`"${k} times as many" means multiply by ${k}.`),explain:ex(`${s} × ${k} = <b>${s*k}</b>`)});};
const m4multi=c=>{const k=c.k!=null?c.k:R(0,7);
 if(k===6){const s=R(12,35),kk=R(3,7);return Q({prompt:`Gizmo did <b>${s}</b> push-ups. Coach Flex did <b>${kk}</b> times as many. How many more push-ups did Coach Flex do than Gizmo?`,tpl:'{A} more push-ups',answer:s*kk-s,text:`m4m6 ${s} ${kk}`,wp:1,fast:45,
  nudge:nu('Find Coach Flex\'s push-ups first. Then compare.'),explain:ex(`Coach Flex: ${s} × ${kk} = ${s*kk}`,`${s*kk} − ${s} = <b>${s*kk-s}</b>`)});}
 if(k===7){const g=R(12,30),kk=R(3,6);return Q({prompt:`Coach Flex ran <b>${g*kk}</b> laps this month. That is <b>${kk}</b> times as many laps as Ozzy ran. How many laps did they run together?`,tpl:'{A} laps',answer:g*kk+g,text:`m4m7 ${g} ${kk}`,wp:1,fast:45,
  nudge:nu('Find Ozzy\'s laps first. Then add.'),explain:ex(`Ozzy: ${g*kk} ÷ ${kk} = ${g}`,`${g*kk} + ${g} = <b>${g*kk+g}</b>`)});}
 if(k===4){const a=PK([24,36,45,48,52]),b=R(2,4),d=R(2,4);return Q({prompt:`Ozzy's train carries <b>${a}</b> riders on each trip. It makes <b>${b}</b> trips in the morning and <b>${d}</b> trips in the afternoon. How many riders does it carry?`,tpl:'{A} riders',answer:a*(b+d),text:`m4m4 ${a} ${b} ${d}`,wp:1,fast:40,
  nudge:nu('How many trips in all? Then multiply.'),explain:ex(`${b} + ${d} = ${b+d} trips`,`${b+d} × ${a} = <b>${a*(b+d)}</b>`)});}
 if(k===5){const sc=R(4,8),bl=PK([2,3]),pr=PK([12,15]),pay=PK([300,400,500]);const cost=sc*bl*pr;if(cost>=pay)return m4multi(c);return Q({prompt:`Nana Paws knits <b>${sc}</b> scarves. Each scarf uses <b>${bl}</b> balls of yarn. A ball of yarn costs <b>${pr}</b> coins. She pays with <b>${pay}</b> coins. How many coins does she get back?`,tpl:'{A} coins',answer:pay-cost,text:`m4m5 ${sc} ${bl} ${pr} ${pay}`,wp:1,fast:50,
  nudge:nu('Balls of yarn, then the cost, then the change.'),explain:ex(`${sc} × ${bl} = ${sc*bl} balls`,`${sc*bl} × ${pr} = ${cost} coins`,`${pay} − ${cost} = <b>${pay-cost}</b>`)});}
 if(k===0){const a=R(3,6),p=PK([12,15,24,25]),b=R(2,4),q=PK([8,9,11,14]);return Q({prompt:`Ms. Rosa buys <b>${a}</b> sacks of flour for <b>${p}</b> coins each and <b>${b}</b> jars of honey for <b>${q}</b> coins each. How many coins does she spend?`,tpl:'{A} coins',answer:a*p+b*q,text:`m4m0 ${a} ${p} ${b} ${q}`,wp:1,fast:40,
  nudge:nu('Find the cost of the flour and of the honey. Then add.'),explain:ex(`${a} × ${p} = ${a*p}`,`${b} × ${q} = ${b*q}`,`${a*p} + ${b*q} = <b>${a*p+b*q}</b>`)});}
 if(k===1){const g=R(3,6),n=PK([24,25,36,48]),gv=R(10,40);return Q({prompt:`Gizmo has <b>${g}</b> boxes of <b>${n}</b> batteries. He uses <b>${gv}</b> for a robot. How many batteries are left?`,tpl:'{A} batteries',answer:g*n-gv,text:`m4m1 ${g} ${n} ${gv}`,wp:1,fast:40,
  nudge:nu('How many batteries in all? Then subtract.'),explain:ex(`${g} × ${n} = ${g*n}`,`${g*n} − ${gv} = <b>${g*n-gv}</b>`)});}
 if(k===2){const s=R(12,25),kk=R(3,5);return Q({prompt:`Skyla the eagle flies <b>${s}</b> miles on Monday. On Tuesday she flies <b>${kk}</b> times as far. How many miles does she fly on the two days together?`,tpl:'{A} miles',answer:s+s*kk,text:`m4m2 ${s} ${kk}`,wp:1,fast:40,
  nudge:nu('Find Tuesday first. Then add Monday.'),explain:ex(`Tuesday: ${s} × ${kk} = ${s*kk}`,`${s} + ${s*kk} = <b>${s+s*kk}</b>`)});}
 const r=R(4,8),cc=R(6,12),b=R(2,4),f=R(5,20);const tot=r*cc*b;return Q({prompt:`For the show, the Kind Teacher sets up <b>${r}</b> rows of <b>${cc}</b> chairs in each of <b>${b}</b> rooms. <b>${f}</b> chairs are still empty when the show starts. How many people are sitting?`,tpl:'{A} people',answer:tot-f,text:`m4m3 ${r} ${cc} ${b} ${f}`,wp:1,fast:50,
  nudge:nu('Chairs in one room, then all rooms, then take away the empty ones.'),explain:ex(`One room: ${r} × ${cc} = ${r*cc}`,`${b} rooms: ${r*cc} × ${b} = ${tot}`,`${tot} − ${f} = <b>${tot-f}</b>`)});};
const g4fr4=()=>PK([R(1,4)*1000+R(1,5),R(1,4)*1000+R(1,9)*100,R(1,2)*1000+R(0,4)*100+R(1,3)*10]);

/* ---- grade 5 ---- */
const m5pow=c=>{const k=R(0,2);
 if(k===0){const e=R(2,5);return Q({tpl:`${pw(e)} = {A}`,answer:Math.pow(10,e),text:`pw ${e}`,fast:10,nudge:nu(`${pw(e)} means ${e} tens multiplied together.`),explain:ex(`${Array(e).fill(10).join(' × ')} = <b>${N(Math.pow(10,e))}</b>`,`A 1 with ${e} zeros.`)});}
 if(k===1){const a=R(2,9),e=R(2,4);return Q({tpl:`${a} × ${pw(e)} = {A}`,answer:a*Math.pow(10,e),text:`pw2 ${a} ${e}`,fast:10,nudge:nu(`${pw(e)} is a 1 with ${e} zeros.`),explain:ex(`${pw(e)} = ${N(Math.pow(10,e))}`,`${a} × ${N(Math.pow(10,e))} = <b>${N(a*Math.pow(10,e))}</b>`)});}
 const a=R(12,99),m=PK([10,100,1000]);return Q({tpl:`${a} × ${N(m)} = {A}`,answer:a*m,text:`pw3 ${a} ${m}`,fast:10,nudge:nu(`Each × 10 moves the digits one place to the left.`),explain:ex(`Add ${String(m).length-1} zeros: <b>${N(a*m)}</b>`)});};
const m5decPow=c=>{const dp=PK([1,2]);let v;do{v=dp===1?R(11,99):R(101,999);}while(v%10===0);const k=PK([1,2,3]),m=Math.pow(10,k);
 const o={tpl:`${dec(v,dp)} × ${N(m)} = {A}`,text:`dpw ${v} ${dp} ${k}`,fast:12,nudge:nu(`× ${N(m)} moves every digit ${k} ${PL(k,'place')} to the left.`)};
 if(k>=dp){o.answer=v*Math.pow(10,k-dp);o.explain=ex(`Move the decimal point ${k} ${PL(k,'place')} to the right:`,`${dec(v,dp)} × ${N(m)} = <b>${N(o.answer)}</b>`);}
 else{o.answer=v;o.dp=dp-k;o.explain=ex(`Move the decimal point ${k} ${PL(k,'place')} to the right:`,`${dec(v,dp)} × ${N(m)} = <b>${dec(v,dp-k)}</b>`);}
 return Q(o);};
const m5decWhole=(vmax,wmax)=>c=>{for(;;){const v=R(Math.min(12,vmax),vmax),w=R(3,wmax);if(v%10===0)continue;const t=v*w;if(t%10===0)continue;
 return Q({tpl:`${dec(v,1)} × ${w} = {A}`,answer:t,dp:1,text:`dw ${v} ${w}`,fast:15,nudge:nu(`Think ${v} tenths × ${w}.`),
  explain:ex(`${v} tenths × ${w} = ${t} tenths`,`${t} tenths = <b>${dec(t,1)}</b>`)});}};
const m5decDec=c=>{for(;;){const a=R(2,25),b=R(2,9);if(a%10===0)continue;const t=a*b;if(t%100===0)continue;const dp=t%10===0?1:2;
 return Q({tpl:`${dec(a,1)} × ${dec(b,1)} = {A}`,answer:dp===1?t/10:t,dp,text:`dd ${a} ${b}`,fast:15,nudge:nu(`Multiply ${a} × ${b}, then count the decimal places: 1 + 1 = 2.`),
  explain:ex(`${a} × ${b} = ${t}`,`Tenths × tenths = hundredths: ${t} hundredths`,`= <b>${dec(t,2)}</b>`)});}};
/* order of operations, grade 5 */
const ooNo=c=>{for(;;){const k=R(0,3);let s,v,why;
 const a=R(2,20),b=R(2,9),d=R(2,9);
 if(k===0){s=`${a} + ${b} × ${d}`;v=a+b*d;why=[`${b} × ${d} = ${b*d}`,`${a} + ${b*d} = ${v}`];}
 else if(k===1){if(a<=b*d)continue;s=`${a} − ${b} × ${d}`;v=a-b*d;why=[`${b} × ${d} = ${b*d}`,`${a} − ${b*d} = ${v}`];}
 else if(k===2){s=`${b} × ${d} + ${a}`;v=b*d+a;why=[`${b} × ${d} = ${b*d}`,`${b*d} + ${a} = ${v}`];}
 else{const q=R(2,9);s=`${a} + ${q*b} ÷ ${b}`;v=a+q;why=[`${q*b} ÷ ${b} = ${q}`,`${a} + ${q} = ${v}`];}
 return Q({tpl:`${s} = {A}`,answer:v,text:`oo ${s}`,fast:15,nudge:nu('Multiply or divide before you add or subtract.'),explain:ex(...why.slice(0,-1),why[why.length-1].replace(/= (\d+)$/,'= <b>$1</b>'))});}};
const ooPar=c=>{for(;;){const k=R(0,3);const a=R(2,12),b=R(2,9),d=R(2,9);let s,v,why;
 if(k===0){s=`(${a} + ${b}) × ${d}`;v=(a+b)*d;why=[`${a} + ${b} = ${a+b}`,`${a+b} × ${d} = ${v}`];}
 else if(k===1){if(a<=b)continue;s=`(${a} − ${b}) × ${d}`;v=(a-b)*d;why=[`${a} − ${b} = ${a-b}`,`${a-b} × ${d} = ${v}`];}
 else if(k===2){s=`${d} × (${a} + ${b})`;v=d*(a+b);why=[`${a} + ${b} = ${a+b}`,`${d} × ${a+b} = ${v}`];}
 else{const q=R(2,9);const sum=q*d;const x=R(1,sum-1);s=`(${x} + ${sum-x}) ÷ ${d}`;v=q;why=[`${x} + ${sum-x} = ${sum}`,`${sum} ÷ ${d} = ${q}`];}
 return Q({tpl:`${s} = {A}`,answer:v,text:`op ${s}`,fast:15,nudge:nu('Do what is inside the parentheses first.'),explain:ex(why[0],why[1].replace(/= (\d+)$/,'= <b>$1</b>'))});}};
const ooNest=c=>{for(;;){const k=R(0,2);const a=R(2,6),b=R(2,9),d=R(2,5),e=R(2,9);let s,v,why;
 if(k===0){s=`${a} × [${b} + (${d} × ${e})]`;v=a*(b+d*e);why=[`(${d} × ${e}) = ${d*e}`,`[${b} + ${d*e}] = ${b+d*e}`,`${a} × ${b+d*e} = ${v}`];}
 else if(k===1){s=`[(${b} + ${e}) × ${d}] − ${a}`;v=(b+e)*d-a;why=[`(${b} + ${e}) = ${b+e}`,`[${b+e} × ${d}] = ${(b+e)*d}`,`${(b+e)*d} − ${a} = ${v}`];}
 else{if(b<=d)continue;s=`${e} + ${a} × (${b} − ${d})`;v=e+a*(b-d);why=[`(${b} − ${d}) = ${b-d}`,`${a} × ${b-d} = ${a*(b-d)}`,`${e} + ${a*(b-d)} = ${v}`];}
 if(v>200)continue;return Q({tpl:`${s} = {A}`,answer:v,text:`on ${s}`,fast:20,nudge:nu('Start with the innermost ( ), then the [ ], then the rest.'),explain:ex(why[0],why[1],why[2].replace(/= (\d+)$/,'= <b>$1</b>'))});}};
const m5money=c=>{const k=R(0,2);
 if(k===0){const p=PK([125,150,175,225,250,275,325,350,375,450]),n=R(3,6),t=p*n;const o={prompt:`A ride on Ozzy's train costs <b>${$$(p)}</b>. ${c.name} buys <b>${n}</b> tickets. How much do the tickets cost?`,tpl:'$ {A}',text:`mo0 ${p} ${n}`,wp:1,fast:25,
  nudge:nu(`Multiply ${$$(p)} × ${n}. Dollars first, then cents.`),explain:ex(`${$$(p)} × ${n} = <b>${$$(t)}</b>`)};
  if(t%100===0)o.answer=t/100;else{o.answer=t;o.dp=2;}return Q(o);}
 if(k===1){for(;;){const v=R(12,48),w=R(3,9);if(v%10===0||(v*w)%10===0)continue;return Q({prompt:`Skyla the eagle flies <b>${dec(v,1)}</b> miles to her nest. She makes the trip <b>${w}</b> times. How far does she fly?`,tpl:'{A} miles',answer:v*w,dp:1,text:`mo1 ${v} ${w}`,wp:1,fast:25,
  nudge:nu(`Multiply ${dec(v,1)} × ${w}.`),explain:ex(`${v} tenths × ${w} = ${v*w} tenths`,`= <b>${dec(v*w,1)}</b> miles`)});}}
 for(;;){const v=R(2,9),w=R(12,40);if((v*w)%10===0)continue;return Q({prompt:`Each of Dr. Quartz's crystals weighs <b>${dec(v,1)}</b> pounds. He packs <b>${w}</b> crystals. How many pounds is that?`,tpl:'{A} pounds',answer:v*w,dp:1,text:`mo2 ${v} ${w}`,wp:1,fast:25,
  nudge:nu(`${dec(v,1)} is ${v} tenths. Multiply by ${w}.`),explain:ex(`${v} tenths × ${w} = ${v*w} tenths`,`= <b>${dec(v*w,1)}</b> pounds`)});}};
const m5ooStory=c=>{const k=c.k!=null?c.k:R(0,2);
 if(k===0){const t=R(3,6),n=PK([12,24]),x=R(4,15);return Q({prompt:`Ms. Rosa bakes <b>${t}</b> trays of <b>${n}</b> cookies and <b>${x}</b> extra cookies. How many cookies does she bake?`,tpl:`${x} + ${t} × ${n} = {A}`,answer:x+t*n,text:`oos0 ${t} ${n} ${x}`,wp:1,fast:30,
  nudge:nu('Multiply first, then add the extras.'),explain:ex(`${t} × ${n} = ${t*n}`,`${x} + ${t*n} = <b>${x+t*n}</b>`)});}
 if(k===1){const a=R(5,15),b=R(5,15),w=R(3,6);return Q({prompt:`Coach Flex runs <b>${a}</b> laps in the morning and <b>${b}</b> laps in the afternoon, every day for <b>${w}</b> days. How many laps does he run?`,tpl:`(${a} + ${b}) × ${w} = {A}`,answer:(a+b)*w,text:`oos1 ${a} ${b} ${w}`,wp:1,fast:30,
  nudge:nu('Add the laps in one day first.'),explain:ex(`${a} + ${b} = ${a+b} laps a day`,`${a+b} × ${w} = <b>${(a+b)*w}</b>`)});}
 const g=R(3,8),n=R(4,9),gv=R(2,9);return Q({prompt:`Nana Paws knits <b>${g}</b> scarves with <b>${n}</b> stripes each, then pulls out <b>${gv}</b> stripes she doesn't like. How many stripes are left?`,tpl:`${g} × ${n} − ${gv} = {A}`,answer:g*n-gv,text:`oos2 ${g} ${n} ${gv}`,wp:1,fast:30,
  nudge:nu('Multiply before you subtract.'),explain:ex(`${g} × ${n} = ${g*n}`,`${g*n} − ${gv} = <b>${g*n-gv}</b>`)});};
const m5multi=c=>{const k=c.k!=null?c.k:R(0,5);
 if(k===0){const tk=PK([350,425,450,475,550,625]),n=R(2,3),sn=PK([125,175,225,250,275]),pay=2000;const tot=tk*n+sn;if(tot>=pay||(pay-tot)%100===0)return m5multi(c);
  return Q({prompt:`${c.name} buys <b>${n}</b> tickets to Ozzy's ride at <b>${$$(tk)}</b> each and a snack for <b>${$$(sn)}</b>. ${c.name} pays with a $20 bill. How much change comes back?`,tpl:'$ {A}',answer:pay-tot,dp:2,text:`m5m0 ${tk} ${n} ${sn}`,wp:1,fast:60,
  nudge:nu('Tickets, then add the snack, then subtract from $20.00.'),explain:ex(`${n} × ${$$(tk)} = ${$$(tk*n)}`,`${$$(tk*n)} + ${$$(sn)} = ${$$(tot)}`,`$20.00 − ${$$(tot)} = <b>${$$(pay-tot)}</b>`)});}
 if(k===1){const s=R(4,12),r=R(10,25),d=PK([10,20,25]);return Q({prompt:`The stadium has <b>${s}</b> sections. Each section has <b>${r}</b> rows with <b>${d}</b> seats in each row. Every seat is sold. How many tickets is that?`,tpl:'{A} tickets',answer:s*r*d,text:`m5m1 ${s} ${r} ${d}`,wp:1,fast:50,
  nudge:nu('Seats in one section first, then all the sections.'),explain:ex(`${r} × ${d} = ${N(r*d)} seats in a section`,`${N(r*d)} × ${s} = <b>${N(s*r*d)}</b>`)});}
 if(k===5)return m5milesDec(c);
 if(k===4){for(;;){const st=R(11,39),g=R(2,9),d=R(3,9);if(st%10===0||g*d%10===0||(st+g*d)%10===0)continue;return Q({prompt:`Dr. Quartz's crystal is <b>${dec(st,1)}</b> cm tall. It grows <b>${dec(g,1)}</b> cm every day. How tall is it after <b>${d}</b> days?`,tpl:'{A} cm',answer:st+g*d,dp:1,text:`m5m4 ${st} ${g} ${d}`,wp:1,fast:45,
  nudge:nu('How much does it grow in all? Then add the starting height.'),explain:ex(`${dec(g,1)} × ${d} = ${dec(g*d,1)}`,`${dec(st,1)} + ${dec(g*d,1)} = <b>${dec(st+g*d,1)}</b> cm`)});}}
 if(k===2){const c1=R(4,6),b=R(3,4),j=R(10,25),gv=R(10,40);const tot=c1*b*j;return Q({prompt:`Dr. Quartz has <b>${c1}</b> shelves. Each shelf holds <b>${b}</b> jars with <b>${j}</b> crystals in each jar. He gives <b>${gv}</b> crystals to the museum. How many crystals does he keep?`,tpl:'{A} crystals',answer:tot-gv,text:`m5m2 ${c1} ${b} ${j} ${gv}`,wp:1,fast:50,
  nudge:nu('Jars, then crystals, then subtract the gift.'),explain:ex(`${c1} × ${b} = ${c1*b} jars`,`${c1*b} × ${j} = ${tot} crystals`,`${tot} − ${gv} = <b>${tot-gv}</b>`)});}
 const w=R(12,25),d=R(5,7),wk=R(3,4),x=R(20,60);return Q({prompt:`Skyla the eagle flies <b>${w}</b> miles a day, <b>${d}</b> days a week, for <b>${wk}</b> weeks. Then she flies <b>${x}</b> more miles home. How many miles does she fly?`,tpl:'{A} miles',answer:w*d*wk+x,text:`m5m3 ${w} ${d} ${wk} ${x}`,wp:1,fast:50,
  nudge:nu('Miles in one week, then all the weeks, then add the trip home.'),explain:ex(`${w} × ${d} = ${w*d} a week`,`${w*d} × ${wk} = ${w*d*wk}`,`${w*d*wk} + ${x} = <b>${w*d*wk+x}</b>`)});};

/* ======================================================= DIVISION ======================================================= */
const d3setShare=(Ds)=>c=>{const g=PK(Ds),n=R(2,g===10?3:g===5?4:9),e=PK(FUN);const t=g*n;if(t>24)return d3setShare(Ds)(c);
 return Q({prompt:`Share these <b>${t}</b> ${e[1]} equally into <b>${g}</b> groups.`,vis:{t:'set',n:t,e:e[0]},tpl:`${t} ÷ ${g} = {A}`,answer:n,text:`ssh ${t} ${g}`,fast:12,
  nudge:nu(`Deal them out one by one into ${g} groups.`),explain:ex(`${g} groups of ${n} make ${t}.`,`${t} ÷ ${g} = <b>${n}</b>`)});};
const d3unk=(Ds)=>c=>{const d=PK(Ds),q=R(2,10);return Q({prompt:`Use multiplication to divide.`,tpl:`${d} × {A} = ${d*q}, so ${d*q} ÷ ${d} = ${q}`,answer:q,text:`unk ${d} ${q}`,fast:10,
 nudge:nu(`Count by ${d}s until you reach ${d*q}.`),explain:ex(`${sk(d,q).join(', ')}`,`${d} × <b>${q}</b> = ${d*q}`)});};
const d3rules=c=>{const n=R(2,50),k=R(0,2);
 if(k===0)return Q({mem:['rule'],tpl:`${n} ÷ 1 = {A}`,answer:n,text:`r1 ${n}`,fast:8,nudge:nu('Put everything into 1 group.'),explain:ex(`One group gets all of them: <b>${n}</b>`)});
 if(k===1)return Q({mem:['rule'],tpl:`${n} ÷ ${n} = {A}`,answer:1,text:`rs ${n}`,fast:8,nudge:nu(`How many groups of ${n} are in ${n}?`),explain:ex(`A number divided by itself is <b>1</b>.`)});
 return Q({mem:['rule'],tpl:`0 ÷ ${n} = {A}`,answer:0,text:`r0 ${n}`,fast:8,nudge:nu(`Share nothing among ${n} friends.`),explain:ex(`Zero shared is still zero: <b>0</b>`)});};
const d3array=(Rs)=>c=>{const r=PK(Rs),k=R(2,6),e=PK(FUN);return Q({prompt:`These <b>${r*k}</b> ${e[1]} are in <b>${r}</b> equal rows. How many are in each row?`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r*k} ÷ ${r} = {A}`,answer:k,text:`dar ${r} ${k}`,fast:10,
 nudge:nu('Count one row.'),explain:ex(`${r} × ${k} = ${r*k}`,`${r*k} ÷ ${r} = <b>${k}</b>`)});};
const d3missDiv=c=>{const d=R(2,9),q=R(2,9);const left=Math.random()<.5;return Q({tpl:left?`{A} ÷ ${d} = ${q}`:`${d*q} ÷ {A} = ${q}`,answer:left?d*q:d,text:`md ${d} ${q} ${left}`,fast:12,
 nudge:nu(left?`What number shared into ${d} groups gives ${q} in each? Multiply.`:`${q} times what makes ${d*q}?`),
 explain:left?ex(`${d} × ${q} = ${d*q}`,`So <b>${d*q}</b> ÷ ${d} = ${q}`):ex(`${q} × ${d} = ${d*q}`,`So ${d*q} ÷ <b>${d}</b> = ${q}`)});};
const d3family=c=>{const a=R(3,9),b=R(3,9);if(a===b)return d3family(c);const t=a*b;
 return Q(choice({prompt:`Which one belongs to the fact family of <b>${a}</b>, <b>${b}</b> and <b>${t}</b>?`,tpl:'{A}',text:`fam ${a} ${b}`,fast:15,
  nudge:nu(`A fact family uses only ${a}, ${b} and ${t}, with × and ÷.`),explain:ex(`${a} × ${b} = ${t}, ${b} × ${a} = ${t}, ${t} ÷ ${a} = ${b}, ${t} ÷ ${b} = ${a}`,`So <b>${t} ÷ ${a} = ${b}</b>`)},
  `${t} ÷ ${a} = ${b}`,[`${t} − ${a} = ${b}`,`${a} ÷ ${t} = ${b}`,`${b} × ${t} = ${a}`]));};
const d3cmp=c=>{const a=R(2,9),q1=R(2,9),b=R(2,9),q2=R(2,9);const s=q1>q2?'&gt;':q1<q2?'&lt;':'=';
 return Q(choice({tpl:`${a*q1} ÷ ${a} {A} ${b*q2} ÷ ${b}`,text:`dc ${a} ${q1} ${b} ${q2}`,fast:15,nudge:nu('Work out each side, then compare.'),
  explain:ex(`${a*q1} ÷ ${a} = ${q1}`,`${b*q2} ÷ ${b} = ${q2}`,`So it is <b>${s}</b>`)},s,['&lt;','&gt;','='].filter(z=>z!==s)));};
const d3two=c=>{const k=c.k!=null?c.k:R(0,3);
 if(k===4){const b=R(2,5),n=PK([6,8,9,10,12]),m=PK([3,4,6,9].filter(z=>(b*n)%z===0&&z!==n&&(b*n)/z<=10&&(b*n)/z>1));if(!m)return d3two(c);return Q({prompt:`Gizmo has <b>${b}</b> boxes of <b>${n}</b> batteries. Each robot needs <b>${m}</b> batteries. How many robots can he power?`,tpl:'{A} robots',answer:b*n/m,text:`d3t4 ${b} ${n} ${m}`,wp:1,fast:35,
  nudge:nu('How many batteries in all? Then make groups.'),explain:ex(`${b} × ${n} = ${b*n}`,`${b*n} ÷ ${m} = <b>${b*n/m}</b>`)});}
 if(k===5){const d=R(3,8),n=R(3,7),l=R(2,9);const t=d*n+l;return Q({prompt:`The Kind Teacher has <b>${t}</b> stickers. She gives each of her <b>${d}</b> kids <b>${n}</b> stickers. How many stickers are left?`,tpl:'{A} stickers',answer:l,text:`d3t5 ${t} ${d} ${n}`,wp:1,fast:35,
  nudge:nu('How many stickers does she give away? Then subtract.'),explain:ex(`${d} × ${n} = ${d*n}`,`${t} − ${d*n} = <b>${l}</b>`)});}
 if(k===6){const n=PK([4,5,6,8]),q=R(4,9),e=n*R(1,2);const t=n*q-e;return Q({prompt:`Each car of Ozzy's train holds <b>${n}</b> riders. <b>${t}</b> riders get on at the first stop and <b>${e}</b> more at the second stop. Every car is full. How many cars does the train have?`,tpl:'{A} cars',answer:q,text:`d3t6 ${n} ${t} ${e}`,wp:1,fast:35,
  nudge:nu('How many riders in all? Then make groups of '+n+'.'),explain:ex(`${t} + ${e} = ${t+e}`,`${t+e} ÷ ${n} = <b>${q}</b>`)});}
 if(k===7){const d=R(3,5),per=R(5,9),m=R(4,8);if(m===d)return d3two(c);return Q({prompt:`Skyla the eagle flies <b>${d*per}</b> miles in <b>${d}</b> days, the same distance each day. How far does she fly in <b>${m}</b> days?`,tpl:'{A} miles',answer:per*m,text:`d3t7 ${d} ${per} ${m}`,wp:1,fast:40,
  nudge:nu('How far does she fly in one day?'),explain:ex(`${d*per} ÷ ${d} = ${per} miles a day`,`${per} × ${m} = <b>${per*m}</b>`)});}
 if(k===0){const tr=R(2,4),n=PK([6,8,10,12]),b=PK([3,4,6,8].filter(z=>(tr*n)%z===0&&(tr*n)/z<=10&&z!==tr&&(tr*n)/z!==n));if(!b)return d3two(c);const t=tr*n;
  return Q({prompt:`Ms. Rosa bakes <b>${tr}</b> trays of <b>${n}</b> cookies. She shares them equally into <b>${b}</b> boxes. How many cookies go in each box?`,tpl:'{A} cookies',answer:t/b,text:`d3t0 ${tr} ${n} ${b}`,wp:1,fast:35,
   nudge:nu('How many cookies in all? Then share.'),explain:ex(`${tr} × ${n} = ${t}`,`${t} ÷ ${b} = <b>${t/b}</b>`)});}
 if(k===1){const tm=PK([3,4,5,6]),q=R(3,7),ab=R(1,5);const t=tm*q+ab;return Q({prompt:`There are <b>${t}</b> kids in the class. <b>${ab}</b> ${PL(ab,'is','are')} away today. The rest make teams of <b>${tm}</b>. How many teams are there?`,tpl:'{A} teams',answer:q,text:`d3t1 ${t} ${ab} ${tm}`,wp:1,fast:35,
  nudge:nu('How many kids are here? Then make teams.'),explain:ex(`${t} − ${ab} = ${t-ab}`,`${t-ab} ÷ ${tm} = <b>${q}</b>`)});}
 if(k===2){const p=PK([5,6,7,8,9]),q=R(3,8),kp=R(2,9);const t=p*q+kp;return Q({prompt:`Coach Flex has <b>${t}</b> cones. He keeps <b>${kp}</b> for himself and puts the rest in <b>${p}</b> equal piles. How many cones are in each pile?`,tpl:'{A} cones',answer:q,text:`d3t2 ${t} ${kp} ${p}`,wp:1,fast:35,
  nudge:nu('Take away the cones he keeps. Then share the rest.'),explain:ex(`${t} − ${kp} = ${t-kp}`,`${t-kp} ÷ ${p} = <b>${q}</b>`)});}
 const n=PK([4,5,6]),d=R(3,9),ea=R(2,4);if(n*d>60)return d3two(c);const t=n*d*1;return Q({prompt:`${cap(c.pet)} gets <b>${t}</b> treats. It eats <b>${n}</b> treats a day. Then ${c.name} buys enough treats for <b>${ea}</b> more days. How many days will the treats last in all?`,tpl:'{A} days',answer:d+ea,text:`d3t3 ${t} ${n} ${ea}`,wp:1,fast:35,
  nudge:nu(`How many days do ${t} treats last? Then add the bonus days.`),explain:ex(`${t} ÷ ${n} = ${d} days`,`${d} + ${ea} = <b>${d+ea}</b>`)});};

/* ---- grade 4 ---- */
const dTens=(mult)=>c=>{const d=R(2,9),q=R(2,9)*PK(mult);const t=d*q;return Q({tpl:`${N(t)} ÷ ${d} = {A}`,answer:q,text:`dt ${t} ${d}`,fast:12,
 nudge:nu(`Use a fact: ${t/(q/(q%100===0?100:10))} ÷ ${d}.`),explain:ex(`${d} × ${q/(q%100===0?100:10)} = ${t/(q/(q%100===0?100:10))}`,`So ${N(t)} ÷ ${d} = <b>${N(q)}</b>`)});};
const longDivExplain=(t,d,q,r)=>{const parts=[];let left=t;const pv=[1000,100,10,1];for(const p of pv){const k=Math.floor(left/(d*p));if(k>0&&p<=t){parts.push(`${d} × ${N(k*p)} = ${N(k*p*d)}`);left-=k*p*d;}}
 return ex(...parts.slice(0,3),parts.length>3?parts.slice(3).join('; '):null,r?`${N(q)} groups of ${d}, with <b>${r}</b> left over.`:`${parts.length>1?parts.map(s=>s.split(' = ')[0].split(' × ')[1]).join(' + ')+' = ':''}<b>${N(q)}</b>`);};
const dPlain=(gd,gq,fast)=>c=>{const d=gd(),q=gq(),t=d*q;return Q({tpl:`${N(t)} ÷ ${d} = {A}`,answer:q,text:`dp ${t} ${d}`,fast:fast||25,
 nudge:nu(d<10?`Break ${N(t)} into parts that are easy to share by ${d}.`:`Estimate: how many ${d}s are in ${N(t)}? Try a round number first.`),
 explain:d<10?longDivExplain(t,d,q,0):ex(`Try ${d} × ${q-q%10||q} = ${N(d*(q-q%10||q))}`,q%10&&q>10?`${N(t-d*(q-q%10))} left. ${d} × ${q%10} = ${N(d*(q%10))}`:null,`${N(t)} ÷ ${d} = <b>${N(q)}</b>`,`Check: ${d} × ${q} = ${N(t)}`)});};
const dRem=(gd,gq)=>c=>{const d=gd(),q=gq(),r=R(1,d-1),t=d*q+r;const askR=Math.random()<.5;
 return Q({tpl:askR?`${N(t)} ÷ ${d} = ${q} R {A}`:`${N(t)} ÷ ${d} = {A} R ${r}`,answer:askR?r:q,text:`dr ${t} ${d} ${askR}`,fast:25,
  nudge:nu(askR?`${d} × ${q} = ${N(d*q)}. How many are left?`:`What is the biggest number of ${d}s that fit in ${N(t)}?`),
  explain:ex(`${d} × ${q} = ${N(d*q)}`,`${N(t)} − ${N(d*q)} = ${r}`,askR?`So it is ${q} R <b>${r}</b>`:`So it is <b>${q}</b> R ${r}`)});};
const BIGD=c=>[
 {k:'stad',share:1,dmin:4,tmax:99999,s:(t,b)=>`The stadium has <b>${N(t)}</b> seats in <b>${b}</b> equal sections.`,q:'How many seats are in each section?',u:'seats'},
 {k:'page',share:1,tmax:999,s:(t,b)=>`The Elder Wiz reads a <b>${N(t)}</b>-page spell book in <b>${b}</b> days. He reads the same number of pages each day.`,q:'How many pages does he read each day?',u:'pages'},
 {k:'coin',share:1,tmax:9999,s:(t,b)=>`Grumbleroot the troll shares <b>${N(t)}</b> coins equally among <b>${b}</b> troll cousins.`,q:'How many coins does each cousin get?',u:'coins'},
 {k:'mile',share:1,tmax:9999,s:(t,b)=>`Skyla the eagle flies <b>${N(t)}</b> miles in <b>${b}</b> weeks. She flies the same distance each week.`,q:'How many miles does she fly each week?',u:'miles'},
 {k:'crys',share:0,tmax:9999,s:(t,a)=>`Dr. Quartz packs <b>${N(t)}</b> crystals into boxes of <b>${a}</b>.`,q:'How many boxes does he fill?',u:'boxes'},
 {k:'cook',share:0,tmax:2000,s:(t,a)=>`Ms. Rosa packs <b>${N(t)}</b> cookies into bags of <b>${a}</b>.`,q:'How many bags does she fill?',u:'bags'},
 {k:'step',share:0,dmin:12,tmax:9999,s:(t,a)=>`Coach Flex climbs <b>${N(t)}</b> steps by running up a tower of <b>${a}</b> steps again and again.`,q:'How many times does he run up the tower?',u:'times'},
 {k:'sand',share:0,tmax:99999,s:(t,a)=>`Ozzy shrinks you down. You count <b>${N(t)}</b> grains of sand into piles of <b>${a}</b>.`,q:'How many piles do you make?',u:'piles'},
];
const dStory=(gd,gq)=>c=>{let d,q,x;for(let i=0;i<50;i++){d=gd();q=gq();const ok=BIGD(c).filter(z=>d*q<=z.tmax&&d>=(z.dmin||0)&&!(z.k==='stad'&&d*q<500));if(ok.length){x=PK(ok);break;}}const t=d*q;
 return Q({prompt:`${x.s(t,d)} ${x.q}`,tpl:`{A} ${x.u}`,answer:q,text:`ds ${x.k} ${t} ${d}`,wp:1,fast:35,nudge:nu(`Divide ${N(t)} by ${d}.`),
  explain:ex(`${N(t)} ÷ ${d} = <b>${N(q)}</b>`,`Check: ${d} × ${N(q)} = ${N(t)}`)});};
const dLeft=c=>{const d=R(3,9),q=R(3,12),r=R(1,d-1),t=d*q+r;const k=R(0,1);
 const s=k?`Grumbleroot the troll shares <b>${t}</b> coins equally among <b>${d}</b> trolls. He keeps the coins that are left over.`:`The Grey Goblin splits <b>${t}</b> stolen socks equally into <b>${d}</b> sacks, as many as he can. The rest go under his bed.`;
 const q2=k?'How many coins does Grumbleroot keep?':'How many socks go under his bed?';
 return Q({prompt:`${s} ${q2}`,tpl:`{A} ${k?'coins':'socks'}`,answer:r,text:`dl ${k} ${t} ${d}`,wp:1,fast:30,nudge:nu(`How many are left over after sharing ${t} into ${d} equal groups?`),
  explain:ex(`${t} ÷ ${d} = ${q} R ${r}`,`The left over is <b>${r}</b>.`)});};
/* remainder interpretation */
const REMS=c=>[
 {k:'van',small:1,m:'up',s:(t,s)=>`<b>${N(t)}</b> kids are going on a trip. Each van holds <b>${s}</b> kids.`,q:'How many vans are needed?',u:'vans'},
 {k:'car',small:1,m:'up',s:(t,s)=>`<b>${N(t)}</b> riders line up for Ozzy's train. Each car holds <b>${s}</b> riders.`,q:'How many cars are needed so everyone rides at once?',u:'cars'},
 {k:'bat',m:'up',s:(t,s)=>`Gizmo needs <b>${N(t)}</b> batteries. Batteries come in packs of <b>${s}</b>.`,q:'How many packs must he buy?',u:'packs'},
 {k:'box',m:'down',s:(t,s)=>`Ms. Rosa has <b>${N(t)}</b> cookies. A box holds <b>${s}</b> cookies.`,q:'How many boxes can she fill all the way?',u:'boxes'},
 {k:'yarn',small:1,m:'down',s:(t,s)=>`Nana Paws has <b>${N(t)}</b> feet of yarn. Each scarf needs <b>${s}</b> feet.`,q:'How many whole scarves can she knit?',u:'scarves'},
 {k:'team',small:1,m:'left',s:(t,s)=>`Coach Flex puts <b>${N(t)}</b> kids into teams of <b>${s}</b>, making as many full teams as he can.`,q:'How many kids are not on a team?',u:'kids'},
 {k:'jar',m:'left',s:(t,s)=>`Dr. Quartz puts <b>${N(t)}</b> crystals into jars of <b>${s}</b>, filling as many jars as he can.`,q:'How many crystals are left out?',u:'crystals'},
];
const dRemStory=(gs,gq,mode)=>c=>{const s=gs(),q=gq(),r=R(1,s-1),t=s*q+r;const x=PK(REMS(c).filter(z=>(!mode||z.m===mode)&&!(z.small&&t>300)));const ans=x.m==='up'?q+1:x.m==='down'?q:r;
 return Q({prompt:`${x.s(t,s)} ${x.q}`,tpl:`{A} ${x.u}`,answer:ans,text:`rs ${x.k} ${t} ${s}`,wp:1,fast:35,
  nudge:nu(x.m==='up'?'Divide. Does everyone fit? Think about the leftovers.':x.m==='down'?'Divide. Only full ones count.':'Divide. What is left over?'),
  explain:ex(`${N(t)} ÷ ${s} = ${q} R ${r}`,x.m==='up'?`${q} are full, and ${r} still need a spot. So <b>${q+1}</b>.`:x.m==='down'?`Only ${q} are full. The ${r} left over is not enough. So <b>${q}</b>.`:`The left over is <b>${r}</b>.`)});};
const d4multi=c=>{const k=c.k!=null?c.k:R(0,7);
 if(k===4){const t=R(3,6),n=PK([24,36,48]),s=PK([7,9,10]);const tot=t*n;if(tot%s===0)return d4multi(c);return Q({prompt:`Ms. Rosa bakes <b>${t}</b> trays of <b>${n}</b> cookies. A box holds <b>${s}</b> cookies. How many boxes can she fill all the way?`,tpl:'{A} boxes',answer:Math.floor(tot/s),text:`d4m4 ${t} ${n} ${s}`,wp:1,fast:50,
  nudge:nu('How many cookies in all? Then divide. Only full boxes count.'),explain:ex(`${t} × ${n} = ${tot}`,`${tot} ÷ ${s} = ${Math.floor(tot/s)} R ${tot%s}`,`Only full boxes count: <b>${Math.floor(tot/s)}</b>`)});}
 if(k===5){const r=R(12,30),per=R(3,5),p=PK([6,8]);const need=r*per;if(need%p===0)return d4multi(c);return Q({prompt:`Gizmo builds <b>${r}</b> robots. Each robot needs <b>${per}</b> batteries. Batteries come in packs of <b>${p}</b>. How many packs must he buy?`,tpl:'{A} packs',answer:Math.ceil(need/p),text:`d4m5 ${r} ${per} ${p}`,wp:1,fast:50,
  nudge:nu('How many batteries does he need? Then divide. Does a part pack count?'),explain:ex(`${r} × ${per} = ${need}`,`${need} ÷ ${p} = ${Math.floor(need/p)} R ${need%p}`,`He needs one more pack for the rest: <b>${Math.ceil(need/p)}</b>`)});}
 if(k===6){const b=R(4,9),n=PK([12,15,25]),s=PK([7,8,9]);const tot=b*n;if(tot%s===0)return d4multi(c);return Q({prompt:`Coach Flex has <b>${b}</b> bags of <b>${n}</b> balls. He gives the same number of balls to each of <b>${s}</b> teams, as many as he can. How many balls are left over?`,tpl:'{A} balls',answer:tot%s,text:`d4m6 ${b} ${n} ${s}`,wp:1,fast:50,
  nudge:nu('How many balls in all? Then divide and find the leftover.'),explain:ex(`${b} × ${n} = ${tot}`,`${tot} ÷ ${s} = ${Math.floor(tot/s)} R ${tot%s}`,`Left over: <b>${tot%s}</b>`)});}
 if(k===7){const d=R(4,7),per=R(35,90),f=R(20,99);const tot=f+(d-1)*per;return Q({prompt:`Skyla the eagle flies <b>${tot}</b> miles in <b>${d}</b> days. On the first day she flies <b>${f}</b> miles. She flies the same distance on each of the other days. How far does she fly on each of those days?`,tpl:'{A} miles',answer:per,text:`d4m7 ${tot} ${d} ${f}`,wp:1,fast:55,
  nudge:nu('Take away the first day. How many days are left?'),explain:ex(`${tot} − ${f} = ${tot-f}`,`${d} − 1 = ${d-1} days`,`${tot-f} ÷ ${d-1} = <b>${per}</b>`)});}
 if(k===0){const cl=R(3,5),kids=R(18,26),v=PK([6,7,8]);const t=cl*kids;const q=Math.ceil(t/v);if(t%v===0)return d4multi(c);
  return Q({prompt:`<b>${cl}</b> classes with <b>${kids}</b> kids each go to the castle. Each van holds <b>${v}</b> kids. How many vans are needed?`,tpl:'{A} vans',answer:q,text:`d4m0 ${cl} ${kids} ${v}`,wp:1,fast:50,
   nudge:nu('How many kids in all? Then divide. Does everyone fit?'),explain:ex(`${cl} × ${kids} = ${t} kids`,`${t} ÷ ${v} = ${Math.floor(t/v)} R ${t%v}`,`The ${t%v} left over need one more van: <b>${q}</b>`)});}
 if(k===1){const b=R(3,6),n=PK([24,36,48]),f=PK([4,6,8].filter(z=>(b*n)%z===0&&z!==b));const t=b*n;return Q({prompt:`Dr. Quartz has <b>${b}</b> bags of <b>${n}</b> crystals. He shares them equally among <b>${f}</b> scientists. How many crystals does each scientist get?`,tpl:'{A} crystals',answer:t/f,text:`d4m1 ${b} ${n} ${f}`,wp:1,fast:45,
  nudge:nu('How many crystals in all? Then share.'),explain:ex(`${b} × ${n} = ${t}`,`${t} ÷ ${f} = <b>${t/f}</b>`)});}
 if(k===3){const days=R(4,7),per=PK([36,48,64,72,96]),tr=PK([3,4,6,8].filter(z=>(days*per)%z===0)),sp=tr*R(3,9);const t=days*per;return Q({prompt:`Grumbleroot the troll collects <b>${per}</b> coins every day for <b>${days}</b> days. He spends <b>${sp}</b> coins on troll snacks. He shares the rest equally among <b>${tr}</b> troll cousins. How many coins does each cousin get?`,tpl:'{A} coins',answer:(t-sp)/tr,text:`d4m3 ${per} ${days} ${sp} ${tr}`,wp:1,fast:55,
  nudge:nu('Coins in all, minus the snacks, then share.'),explain:ex(`${per} × ${days} = ${t}`,`${t} − ${sp} = ${t-sp}`,`${t-sp} ÷ ${tr} = <b>${(t-sp)/tr}</b>`)});}
 const t=R(6,9)*100,g=R(40,150),d=PK([4,5,6,8].filter(z=>((t-g)%z)===0));if(!d)return d4multi(c);return Q({prompt:`Ms. Rosa bakes <b>${t}</b> cookies. She sells <b>${g}</b> at the café. She packs the rest into <b>${d}</b> big tins, the same number in each. How many cookies go in each tin?`,tpl:'{A} cookies',answer:(t-g)/d,text:`d4m2 ${t} ${g} ${d}`,wp:1,fast:50,
  nudge:nu('Subtract the sold cookies. Then share the rest.'),explain:ex(`${t} − ${g} = ${t-g}`,`${t-g} ÷ ${d} = <b>${(t-g)/d}</b>`)});};
const g4friendly=()=>{const d=R(2,9);const q=PK([R(2,9)*100,R(1,9)*100+R(1,9)*10,R(1,4)*100+R(1,9),R(2,9)*100+R(1,3)]);return [d,q];};
const dFriend=c=>{let d,q;do{[d,q]=g4friendly();}while(d*q<1000||d*q>9999);const t=d*q;return Q({tpl:`${N(t)} ÷ ${d} = {A}`,answer:q,text:`df ${t} ${d}`,fast:25,
 nudge:nu(`Break ${N(t)} into parts that ${d} goes into easily.`),explain:longDivExplain(t,d,q,0)});};

/* ---- grade 5 ---- */
const d5dec=c=>{for(;;){const w=R(2,9),q=R(2,40);if(q%10===0)continue;const t=q*w;return Q({tpl:`${dec(t,1)} ÷ ${w} = {A}`,answer:q,dp:1,text:`dd ${t} ${w}`,fast:20,
 nudge:nu(`Think in tenths: ${t} tenths ÷ ${w}.`),explain:ex(`${t} tenths ÷ ${w} = ${q} tenths`,`= <b>${dec(q,1)}</b>`)});}};
const d5pow=c=>{for(;;){const k=R(0,2);
 if(k===0){const n=R(11,99);if(n%10===0)continue;return Q({tpl:`${n} ÷ 10 = {A}`,answer:n,dp:1,text:`p10 ${n}`,fast:12,nudge:nu('÷ 10 moves every digit one place to the right.'),explain:ex(`${n} ÷ 10 = <b>${dec(n,1)}</b>`)});}
 if(k===1){const n=R(101,999);if(n%10===0)continue;return Q({tpl:`${n} ÷ 100 = {A}`,answer:n,dp:2,text:`p100 ${n}`,fast:12,nudge:nu('÷ 100 moves every digit two places to the right.'),explain:ex(`${n} ÷ 100 = <b>${dec(n,2)}</b>`)});}
 const v=R(11,99);if(v%10===0)continue;return Q({tpl:`${dec(v,1)} ÷ 10 = {A}`,answer:v,dp:2,text:`pd ${v}`,fast:12,nudge:nu('÷ 10 moves every digit one place to the right.'),explain:ex(`${dec(v,1)} ÷ 10 = <b>${dec(v,2)}</b>`)});}};
const d5money=c=>{for(;;){const n=R(2,6),each=R(105,495);if(each%100===0||each%5)continue;const t=each*n;return Q({prompt:`${c.name} and ${n-1} ${PL(n-1,'friend')} share a lunch bill of <b>${$$(t)}</b> equally. How much does each person pay?`,tpl:'$ {A}',answer:each,dp:2,text:`dmo ${t} ${n}`,wp:1,fast:35,
 nudge:nu(`That is ${n} people. Divide ${$$(t)} by ${n}.`),explain:ex(`${$$(t)} ÷ ${n} = <b>${$$(each)}</b>`,`Check: ${n} × ${$$(each)} = ${$$(t)}`)});}};
const d5frac=c=>{const k=R(0,1);
 if(k===0){const a=R(2,6),w=R(2,5);return Q({prompt:`Divide a unit fraction by a whole number.`,tpl:`${F(1,a)} ÷ ${w} = ${F(1,'{A}')}`,answer:a*w,text:`uf ${a} ${w}`,fast:20,
  nudge:nu(`Cut ${F(1,a)} into ${w} equal pieces. How big is each piece of the whole?`),explain:ex(`${F(1,a)} ÷ ${w} = ${F(1,a)} × ${F(1,w)}`,`= ${F(1,'<b>'+a*w+'</b>')}`)});}
 const w=R(2,9),a=R(2,6);return Q({prompt:'How many unit fractions fit?',tpl:`${w} ÷ ${F(1,a)} = {A}`,answer:w*a,text:`wf ${w} ${a}`,fast:20,
  nudge:nu(`Each whole holds ${a} pieces of size ${F(1,a)}.`),explain:ex(`${a} pieces in each whole, ${w} wholes`,`${w} × ${a} = <b>${w*a}</b>`)});};
const d5fracStory=c=>{const k=c.k!=null?c.k:R(0,2);
 if(k===0){const w=R(2,6),a=PK([2,3,4]);return Q({prompt:`Ms. Rosa has <b>${w}</b> cups of flour. Each batch of pancakes needs <b>${F(1,a)}</b> cup. How many batches can she make?`,tpl:'{A} batches',answer:w*a,text:`ufs0 ${w} ${a}`,wp:1,fast:30,
  nudge:nu(`How many ${F(1,a)}s are in 1 cup? Then in ${w} cups?`),explain:ex(`${w} ÷ ${F(1,a)} = ${w} × ${a}`,`= <b>${w*a}</b> batches`)});}
 if(k===1){const a=PK([2,3,4]),n=R(2,4);return Q({prompt:`<b>${F(1,a)}</b> of a pan of brownies is left. ${c.name} shares it equally with friends so <b>${n}</b> people each get a piece. What fraction of the whole pan does each person get?`,tpl:`${F(1,'{A}')} of the pan`,answer:a*n,text:`ufs1 ${a} ${n}`,wp:1,fast:30,
  nudge:nu(`Split ${F(1,a)} into ${n} equal parts.`),explain:ex(`${F(1,a)} ÷ ${n} = ${F(1,a*n)}`,`Each gets ${F(1,'<b>'+a*n+'</b>')} of the pan.`)});}
 const m=R(2,5),a=PK([2,3,4,5]);return Q({prompt:`Skyla the eagle flies <b>${m}</b> miles. She rests every <b>${F(1,a)}</b> mile. How many parts of the trip are there?`,tpl:'{A} parts',answer:m*a,text:`ufs2 ${m} ${a}`,wp:1,fast:30,
  nudge:nu(`How many ${F(1,a)}-mile parts fit in one mile?`),explain:ex(`${m} ÷ ${F(1,a)} = ${m} × ${a}`,`= <b>${m*a}</b>`)});};
const d5multi=c=>{const k=c.k!=null?c.k:R(0,1);
 if(k===0){const t=PK([13,14,17,18,19,22,23]),pr=PK([3,4,6]),b=PK([4,5,6]);if(t%b===0)return d5multi(c);const tot=t*pr;return Q({prompt:`The Kind Teacher spends <b>${tot}</b> coins on notebooks that cost <b>${pr}</b> coins each. She shares the notebooks equally among <b>${b}</b> tables, as many as she can. How many notebooks are left over?`,
  tpl:'{A} left over',answer:t%b,text:`d5m0 ${tot} ${pr} ${b}`,wp:1,fast:50,nudge:nu('How many notebooks? Then share them.'),explain:ex(`${tot} ÷ ${pr} = ${t} notebooks`,`${t} ÷ ${b} = ${Math.floor(t/b)} R ${t%b}`,`Left over: <b>${t%b}</b>`)});}
 const pp=R(320,980),bus=PK([24,28,32,36,40]);if(pp%bus===0)return d5multi(c);const q=Math.ceil(pp/bus);
 return Q({prompt:`<b>${pp}</b> fans are going to the big game. Each bus holds <b>${bus}</b> fans. How many buses are needed?`,tpl:'{A} buses',answer:q,text:`d5m1 ${pp} ${bus}`,wp:1,fast:45,
  nudge:nu('Divide. Do all the fans fit?'),explain:ex(`${pp} ÷ ${bus} = ${Math.floor(pp/bus)} R ${pp%bus}`,`The ${pp%bus} left over need one more bus: <b>${q}</b>`)});};
const d5two=c=>{const k=c.k!=null?c.k:R(0,1);
 if(k===0){const s=PK([12,15,20,24,25]),q=R(20,60),gv=R(50,200);const t=s*q;return Q({prompt:`Grumbleroot the troll collects <b>${N(t+gv)}</b> coins. He spends <b>${gv}</b> on troll snacks. He packs the rest into bags of <b>${s}</b>. How many bags does he fill?`,tpl:'{A} bags',answer:q,text:`d5t0 ${t} ${gv} ${s}`,wp:1,fast:50,
  nudge:nu('Subtract the snacks. Then divide.'),explain:ex(`${N(t+gv)} − ${gv} = ${N(t)}`,`${N(t)} ÷ ${s} = <b>${q}</b>`)});}
 const r=PK([12,15,18,20,24]),sec=R(4,9),f=R(10,40);const t=r*sec*f;return Q({prompt:`<b>${N(t)}</b> fans fill <b>${sec}</b> sections of the stadium equally. Each section has <b>${r}</b> rows. How many fans sit in each row?`,tpl:'{A} fans',answer:f,text:`d5t1 ${t} ${sec} ${r}`,wp:1,fast:50,
  nudge:nu('Fans in one section first. Then fans in one row.'),explain:ex(`${N(t)} ÷ ${sec} = ${N(r*f)} in each section`,`${N(r*f)} ÷ ${r} = <b>${f}</b>`)});};
const tenDiv=c=>{const d=R(2,9)*10,q=R(12,40);if(q%10===0)return tenDiv(c);return Q({tpl:`${N(d*q)} ÷ ${d} = {A}`,answer:q,text:`td ${d} ${q}`,fast:15,
 nudge:nu(`How many ${d}s make ${N(d*q)}? Cross off a zero from each first.`),explain:ex(`${N(d*q/10)} ÷ ${d/10} = ${q}`,`So ${N(d*q)} ÷ ${d} = <b>${q}</b>`)});};

/* ======================================================== ARRAY REEF ======================================================== */
const sea=()=>PK(SEA);
const gArrTotal=(rm,cm)=>c=>{const r=R(2,rm),k=R(2,cm),e=sea();return Q({prompt:`How many ${e[1]} are in this array?`,vis:{t:'array',r,c:k,e:e[0]},tpl:`{A} ${e[1]}`,answer:r*k,text:`gat ${r} ${k}`,
 nudge:nu('Count the first row. Then count on by that many for each row.'),explain:ex(`${r} rows of ${k}: ${sk(k,r).join(', ')}`,`<b>${r*k}</b> ${e[1]}`)});};
const gPairs=c=>{const k=R(3,10),e=sea();return Q({prompt:`The ${e[1]} swim in pairs. Count by 2s.`,vis:{t:'set',n:2*k,e:e[0]},tpl:`{A} ${e[1]}`,answer:2*k,text:`gpr ${k}`,
 nudge:nu('Count 2, 4, 6, …'),explain:ex(`${sk(2,k).join(', ')}`,`<b>${2*k}</b>`)});};
const gGroupsTot=c=>{const g=R(2,4),n=R(2,5),e=sea();return Q({prompt:`How many ${e[1]} in all?`,vis:{t:'groups',g,n,e:e[0]},tpl:`{A} ${e[1]}`,answer:g*n,text:`ggt ${g} ${n}`,
 nudge:nu(`Each group has ${n}. Count on by ${n}s.`),explain:ex(`${sk(n,g).join(', ')}`,`<b>${g*n}</b>`)});};
const gRowSkip=c=>{const k=PK([2,5,10]),r=k===2?5:R(4,5),e=sea();return Q({prompt:`Each row has <b>${k}</b>. Count by ${k}s, one row at a time.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${sk(k,r-1).join(', ')}, {A}`,answer:k*r,text:`grs ${k} ${r}`,
 nudge:nu(`Add one more row of ${k}.`),explain:ex(`${sk(k,r).join(', ')}`,`The last row brings it to <b>${k*r}</b>.`)});};
const gRepAdd=c=>{const g=R(2,5),n=R(2,5),e=sea();return Q({prompt:`<b>${g}</b> groups with <b>${n}</b> ${e[1]} in each.`,vis:{t:'groups',g,n,e:e[0]},tpl:`${rep(n,g)} = {A}`,answer:g*n,text:`gra ${g} ${n}`,
 nudge:nu(`Add ${n} again and again.`),explain:ex(`${rep(n,g)} = <b>${g*n}</b>`)});};
const gRepWordsF=mn=>c=>{const g=R(mn,5),n=R(mn,5);const s=PK([
 [`Skyla the eagle sees <b>${g}</b> rocks. Each rock has <b>${n}</b> crabs on it.`,'How many crabs does she see?','crabs'],
 [`${c.name} finds <b>${g}</b> tide pools. Each pool has <b>${n}</b> starfish.`,'How many starfish are there?','starfish'],
 [`Ozzy shrinks you to fish size. You swim past <b>${g}</b> groups of <b>${n}</b> turtles.`,'How many turtles do you pass?','turtles'],
 [`Nana Paws knits <b>${g}</b> fish hats. Each hat has <b>${n}</b> buttons.`,'How many buttons is that?','buttons']]);
 return Q({prompt:`${s[0]} ${s[1]}`,tpl:`{A} ${s[2]}`,answer:g*n,text:`grw ${s[2]} ${g} ${n}`,wp:1,fast:20,nudge:nu(`Add ${n} again and again, ${g} times.`),explain:ex(`${rep(n,g)} = <b>${g*n}</b>`)});};
const gRepWords=gRepWordsF(2);
const gEvenOdd=(max,num)=>c=>{const n=R(num?11:5,max),e=sea();const ev=n%2===0;const pic=!num||Math.random()<.4;
 const pairs=`${(e[0]+e[0]+' ').repeat(Math.floor(n/2))}${ev?'':e[0]}`;
 return Q(choice({prompt:pic?`${pairs}<br>Are there an even or odd number of ${e[1]}? Look at the pairs.`:`Is <b>${n}</b> even or odd?`,tpl:`${n} is {A}`,text:`eo ${n} ${pic}`,fast:10,
  nudge:nu(pic?'Does every one have a partner?':'Can you make pairs with none left over? Look at the ones digit.'),
  explain:ex(ev?`${n} = ${n/2} + ${n/2}. Every one has a partner.`:`${n} = ${(n-1)/2} + ${(n-1)/2} + 1. One is left over.`,`So ${n} is <b>${ev?'even':'odd'}</b>.`)},ev?'even':'odd',[ev?'odd':'even']));};
const gHalves=c=>{const h=R(3,10);const e=sea();return Q({prompt:`An even number splits into two equal parts. <b>${2*h}</b> ${e[1]} swim into 2 equal groups.`,tpl:`${2*h} = {A} + ${h}`,answer:h,text:`gh ${h}`,fast:10,
 nudge:nu('Both parts are the same. What doubles to make it?'),explain:ex(`${h} + ${h} = ${2*h}`,`So the box is <b>${h}</b>.`)});};
const gArrRows=c=>{const r=R(2,5),k=R(2,5),e=sea();return Q({prompt:`Add the rows of ${e[1]}.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${rep(k,r)} = {A}`,answer:r*k,text:`gar ${r} ${k}`,
 nudge:nu(`Each row has ${k}.`),explain:ex(`${rep(k,r)} = <b>${r*k}</b>`)});};
const g2story=(two)=>c=>{const k=two?PK([1,3,4,5,6]):R(0,2);
 if(k===5){const b=R(2,3),u=R(3,9);return Q({prompt:`An egg carton has 2 rows of 6 eggs. Ms. Rosa has <b>${b}</b> cartons. She uses <b>${u}</b> eggs for a cake. How many eggs are left?`,tpl:'{A} eggs',answer:12*b-u,text:`g2s5 ${b} ${u}`,wp:1,fast:30,nudge:nu('How many eggs at first? Then take away.'),explain:ex(`${rep(12,b)} = ${12*b}`,`${12*b} − ${u} = <b>${12*b-u}</b>`)});}
 if(k===6){const a=R(2,4),n=R(3,5),b=R(2,3),m=R(2,5);return Q({prompt:`The Kind Teacher sets out <b>${a}</b> rows of <b>${n}</b> chairs. Then she adds <b>${b}</b> more rows of <b>${m}</b> chairs. How many chairs are there now?`,tpl:'{A} chairs',answer:a*n+b*m,text:`g2s6 ${a} ${n} ${b} ${m}`,wp:1,fast:35,nudge:nu('Add up each set of rows. Then add the two totals.'),explain:ex(`${rep(n,a)} = ${a*n}`,`${rep(m,b)} = ${b*m}`,`${a*n} + ${b*m} = <b>${a*n+b*m}</b>`)});}
 if(k===0){const r=R(2,5),n=R(3,5);return Q({prompt:`The Kind Teacher puts chairs in <b>${r}</b> rows with <b>${n}</b> chairs in each row. How many chairs are there?`,tpl:'{A} chairs',answer:r*n,text:`g2s0 ${r} ${n}`,wp:1,fast:20,nudge:nu(`Add ${n} for each row.`),explain:ex(`${rep(n,r)} = <b>${r*n}</b>`)});}
 if(k===1){const b=R(2,3);return Q({prompt:`An egg carton has 2 rows of 6 eggs. Ms. Rosa buys <b>${b}</b> cartons. How many eggs is that?`,tpl:'{A} eggs',answer:12*b,text:`g2s1 ${b}`,wp:1,fast:25,nudge:nu('One carton is 6 + 6.'),explain:ex(`One carton: 6 + 6 = 12`,`${rep(12,b)} = <b>${12*b}</b>`)});}
 if(k===2){const r=R(2,5),n=R(2,5);return Q({prompt:`Dr. Quartz grows crystals in a tray with <b>${r}</b> rows and <b>${n}</b> crystals in each row. How many crystals are in the tray?`,tpl:'{A} crystals',answer:r*n,text:`g2s2 ${r} ${n}`,wp:1,fast:20,nudge:nu(`Add the rows: ${n} each time.`),explain:ex(`${rep(n,r)} = <b>${r*n}</b>`)});}
 if(k===3){const r=R(3,5),n=R(3,5),e=R(2,6);return Q({prompt:`An egg carton has <b>${r}</b> rows of <b>${n}</b> eggs. Gizmo drops <b>${e}</b> eggs. Oops! How many eggs are not broken?`,tpl:'{A} eggs',answer:r*n-e,text:`g2s3 ${r} ${n} ${e}`,wp:1,fast:30,nudge:nu('How many eggs at first? Then take away the broken ones.'),explain:ex(`${rep(n,r)} = ${r*n}`,`${r*n} − ${e} = <b>${r*n-e}</b>`)});}
 const n=R(9,19);const ev=n%2===0;return Q(choice({prompt:`<b>${n}</b> kids want to ride Ozzy's train in pairs. Can everyone have a partner, with nobody left over?`,tpl:'{A}',text:`g2s4 ${n}`,wp:1,fast:15,nudge:nu('Is the number even or odd?'),
  explain:ex(ev?`${n} = ${n/2} + ${n/2}, so ${n} is even.`:`${n} is odd: one kid is left over.`,`<b>${ev?'Yes':'No'}</b>`)},ev?'Yes':'No',[ev?'No':'Yes']));};

/* ---- grade 3 ---- */
const gArrMul=c=>{const r=R(2,6),k=R(2,7),e=sea();return Q({prompt:`Write a multiplication for this array.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r} × ${k} = {A}`,answer:r*k,text:`gam ${r} ${k}`,fast:10,
 nudge:nu(`${r} rows of ${k} is ${r} × ${k}.`),explain:ex(`${sk(k,r).join(', ')}`,`${r} × ${k} = <b>${r*k}</b>`)});};
const gArrPick=c=>{const r=R(2,6),k=R(2,7);if(r===k)return gArrPick(c);const e=sea();
 return Q(choice({prompt:`Which multiplication matches this array?`,vis:{t:'array',r,c:k,e:e[0]},tpl:'{A}',text:`gap ${r} ${k}`,fast:12,nudge:nu('Count the rows. Count how many in each row.'),
  explain:ex(`${r} rows, ${k} in each row.`,`<b>${r} × ${k}</b> = ${r*k}`)},`${r} × ${k}`,[`${r} + ${k}`,`${r} × ${k+1}`,`${r+1} × ${k}`]));};
const gArrMiss=c=>{const r=R(2,6),k=R(2,9),e=sea();return Q({prompt:`There are <b>${r*k}</b> ${e[1]} in <b>${r}</b> equal rows.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r} × {A} = ${r*k}`,answer:k,text:`gamm ${r} ${k}`,fast:12,
 nudge:nu('How many are in each row?'),explain:ex(`${r} × <b>${k}</b> = ${r*k}`)});};
const gGrpMul=c=>{const g=R(2,5),n=R(3,8),e=sea();return Q({prompt:`<b>${g}</b> groups of <b>${n}</b> ${e[1]}.`,vis:{t:'groups',g,n,e:e[0]},tpl:`${g} × ${n} = {A}`,answer:g*n,text:`ggm ${g} ${n}`,fast:10,
 nudge:nu(`Count by ${n}s, ${g} times.`),explain:ex(`${sk(n,g).join(', ')}`,`${g} × ${n} = <b>${g*n}</b>`)});};
const gSeatStory=c=>{const r=R(3,9),k=R(4,9);const s=PK([[`The reef theater has <b>${r}</b> rows of seats with <b>${k}</b> seats in each row.`,'How many seats are there?','seats'],
 [`Ms. Rosa sets out cupcakes in <b>${r}</b> rows of <b>${k}</b>.`,'How many cupcakes are there?','cupcakes'],
 [`Coach Flex lines up kids in <b>${r}</b> rows of <b>${k}</b> for a race.`,'How many kids are in the race?','kids']]);
 return Q({prompt:`${s[0]} ${s[1]}`,tpl:`{A} ${s[2]}`,answer:r*k,text:`gss ${s[2]} ${r} ${k}`,wp:1,fast:20,nudge:nu(`${r} rows of ${k}: multiply.`),explain:ex(`${r} × ${k} = <b>${r*k}</b>`)});};
const gArrDiv=c=>{const r=R(2,6),k=R(2,9),e=sea();return Q({prompt:`<b>${r*k}</b> ${e[1]} line up in rows of <b>${k}</b>. How many rows are there?`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r*k} ÷ ${k} = {A}`,answer:r,text:`gad ${r} ${k}`,fast:12,
 nudge:nu('Count the rows, or think: how many groups of '+k+'?'),explain:ex(`${r} × ${k} = ${r*k}`,`${r*k} ÷ ${k} = <b>${r}</b>`)});};
const gMixStory=c=>Math.random()<.5?eqMul(()=>[R(3,9),R(3,9)])(c):PK([eqShare,eqGroups])(()=>[R(3,9),R(3,9)])(c);
const gAddPat=(mid)=>c=>{const s=R(2,9),a=R(1,30);const seq=[0,1,2,3,4].map(i=>a+i*s);const pos=mid?R(1,3):4;
 return Q({prompt:`Find the pattern.`,tpl:seq.map((v,i)=>i===pos?'{A}':v).join(', '),answer:seq[pos],text:`gap ${a} ${s} ${pos}`,fast:12,
  nudge:nu('How much does it grow each time?'),explain:ex(`The rule is add ${s}.`,seq.map((v,i)=>i===pos?`<b>${v}</b>`:v).join(', '))});};
const gMulPat=c=>{const m=PK([2,2,3,10]),a=m===10?R(1,9):R(1,5);const seq=[0,1,2,3].map(i=>a*Math.pow(m,i));if(seq[3]>500)return gMulPat(c);
 return Q({prompt:`Find the pattern. Each number is the one before times the same number.`,tpl:`${seq.slice(0,3).join(', ')}, {A}`,answer:seq[3],text:`gmp ${a} ${m}`,fast:12,
  nudge:nu(`${seq[0]} to ${seq[1]}: what did it multiply by?`),explain:ex(`The rule is × ${m}.`,`${seq[2]} × ${m} = <b>${seq[3]}</b>`)});};
const gEvenProd=c=>{const a=R(2,9),b=R(2,9);const ev=(a*b)%2===0;
 return Q(choice({prompt:`Without multiplying all the way: is <b>${a} × ${b}</b> even or odd?`,tpl:`${a} × ${b} is {A}`,text:`gep ${a} ${b}`,fast:12,
  nudge:nu('If either number is even, the answer is even.'),explain:ex(ev?`${a%2===0?a:b} is even, so the product is even.`:`Odd × odd is always odd.`,`${a} × ${b} = ${a*b}, <b>${ev?'even':'odd'}</b>`)},ev?'even':'odd',[ev?'odd':'even']));};
const gNines=c=>{const n=R(2,10);return Q({prompt:`In the 9s, the digits of the answer always add to 9.`,tpl:`9 × ${n} = {A}`,answer:9*n,text:`gn ${n}`,fast:10,
 nudge:nu(`The tens digit is ${n-1}.`),explain:ex(`${10*n} − ${n} = <b>${9*n}</b>`,`Check: ${String(9*n).split('').join(' + ')} = ${String(9*n).split('').reduce((s,d)=>s+ +d,0)}`)});};

/* ---- grade 4 ---- */
const gFactPair=(max,min)=>c=>{let a,b;do{a=R(2,12);b=R(2,max>50?25:12);}while(a*b>max||a*b<(min||12));const t=a*b;const left=Math.random()<.5;
 return Q({prompt:`Find the missing factor.`,tpl:left?`${a} × {A} = ${t}`:`{A} × ${a} = ${t}`,answer:b,text:`fp ${a} ${t} ${left}`,fast:12,
  nudge:nu(`${t} ÷ ${a} = ?`),explain:ex(`${t} ÷ ${a} = ${b}`,`So ${a} and <b>${b}</b> are a factor pair of ${t}.`)});};
const gNextMul=c=>{const k=R(3,9);let m=R(20,90);if(m%k===0)m++;const ans=(Math.floor(m/k)+1)*k;if(ans>100)return gNextMul(c);
 return Q({prompt:`What is the next multiple of <b>${k}</b> after <b>${m}</b>?`,tpl:'{A}',answer:ans,text:`nm ${k} ${m}`,fast:15,
  nudge:nu(`Count by ${k}s. Which one comes right after ${m}?`),explain:ex(`${k} × ${ans/k-1} = ${ans-k}, ${k} × ${ans/k} = ${ans}`,`The next one after ${m} is <b>${ans}</b>.`)});};
const gNth=c=>{const k=PK([6,7,8,9,11,12]),n=R(5,12);return Q({prompt:`Count by ${k}s: ${sk(k,3).join(', ')}, … What is the <b>${ord(n)}</b> multiple of ${k}?`,tpl:'{A}',answer:k*n,text:`nth ${k} ${n}`,fast:12,
 nudge:nu(`The ${ord(n)} multiple is ${k} × ${n}.`),explain:ex(`${k} × ${n} = <b>${k*n}</b>`)});};
const gIsFactor=c=>{const k=R(3,9);const yes=Math.random()<.5;let n;do{n=yes?k*R(3,12):R(20,99);}while(!yes&&n%k===0);if(n>100)return gIsFactor(c);
 return Q(choice({prompt:`Is <b>${k}</b> a factor of <b>${n}</b>?`,tpl:'{A}',text:`isf ${k} ${n}`,fast:12,nudge:nu(`Does ${k} go into ${n} with nothing left over?`),
  explain:yes?ex(`${k} × ${n/k} = ${n}`,`<b>Yes</b>`):ex(`${n} ÷ ${k} = ${Math.floor(n/k)} R ${n%k}`,`There is a left over, so <b>No</b>.`)},yes?'Yes':'No',[yes?'No':'Yes']));};
const gPrime=c=>{const pr=Math.random()<.5;let n;do{n=R(4,50);}while(isPrime(n)!==pr);let f=2;while(n%f)f++;
 return Q(choice({prompt:`Is <b>${n}</b> prime or composite?`,tpl:`${n} is {A}`,text:`pc ${n}`,fast:15,nudge:nu(`Can you write ${n} as a times fact without using 1?`),
  explain:pr?ex(`Only 1 × ${n} makes ${n}.`,`So ${n} is <b>prime</b>.`):ex(`${f} × ${n/f} = ${n}`,`So ${n} is <b>composite</b>.`)},pr?'prime':'composite',[pr?'composite':'prime']));};
const gNextPrime=c=>{const p0=PK([23,31,37,47,53,61,73,79,89]);let n=p0+1;while(!isPrime(n))n++;
 return Q({prompt:`<b>${p0}</b> is prime. What is the next prime number after it?`,tpl:'{A}',answer:n,text:`np ${p0}`,fast:20,nudge:nu('Test each number after it: can it be split into a times fact without 1?'),
  explain:ex(...(n-p0>1?[Array.from({length:n-p0-1},(_,i)=>p0+1+i).map(x=>{let f=2;while(x%f)f++;return `${x} = ${f} × ${x/f}`;}).join('; ')]:[]),`<b>${n}</b> has only 1 × ${n}, so it is prime.`)});};
const gRuleNth=c=>{const s=R(1,9),k=R(3,9),n=R(5,7);const seq=Array.from({length:n},(_,i)=>s+i*k);
 return Q({prompt:`Start at <b>${s}</b>. Rule: <b>add ${k}</b>. What is the <b>${n}th</b> number?`,tpl:`${seq.slice(0,2).join(', ')}, …, {A}`,answer:seq[n-1],text:`rn ${s} ${k} ${n}`,fast:20,
  nudge:nu('Keep adding until you have the right number of terms.'),explain:ex(seq.map((v,i)=>i===n-1?`<b>${v}</b>`:v).join(', '))});};
const gRuleMul=c=>{const s=R(1,5),m=PK([2,3]);const seq=[0,1,2,3,4].map(i=>s*Math.pow(m,i));if(seq[4]>300)return gRuleMul(c);
 return Q({prompt:`Start at <b>${s}</b>. Rule: <b>multiply by ${m}</b>.`,tpl:`${seq.slice(0,4).join(', ')}, {A}`,answer:seq[4],text:`rm ${s} ${m}`,fast:15,
  nudge:nu(`${seq[3]} × ${m}`),explain:ex(`${seq[3]} × ${m} = <b>${seq[4]}</b>`)});};
const gFindRule=c=>{const s=R(2,20),k=R(3,12);const seq=[0,1,2,3].map(i=>s+i*k);return Q({prompt:`What is the rule? <b>${seq.join(', ')}</b>, …`,tpl:'Rule: add {A}',answer:k,text:`fr ${s} ${k}`,fast:12,
 nudge:nu('Subtract one number from the next.'),explain:ex(`${seq[1]} − ${seq[0]} = ${k}`,`Rule: add <b>${k}</b>`)});};
const gRuleOdd=c=>{const s=R(1,15),k=R(2,9);const allOdd=s%2===1&&k%2===0;const seq=[0,1,2,3].map(i=>s+i*k);
 return Q(choice({prompt:`Start at <b>${s}</b>. Rule: <b>add ${k}</b>. Will <b>every</b> number in the pattern be odd?`,tpl:'{A}',text:`ro ${s} ${k}`,fast:20,
  nudge:nu('Odd + even = odd. Odd + odd = even. Write a few terms.'),
  explain:ex(`${seq.join(', ')}, …`,allOdd?`Starts odd and adds an even number each time, so it stays odd: <b>Yes</b>`:s%2===0?`It starts with an even number: <b>No</b>`:`Adding an odd number flips odd to even: <b>No</b>`)},allOdd?'Yes':'No',[allOdd?'No':'Yes']));};
const gPuzMul=c=>{const k=R(6,9),m=R(3,10);const v=k*m;if(v>100)return gPuzMul(c);const d1=R(1,k-3),d2=R(Math.max(1,3-d1),k-1-d1);
 return Q({prompt:`Puzzle: I am a multiple of <b>${k}</b>. I am more than <b>${v-d1}</b> and less than <b>${v+d2}</b>. What number am I?`,tpl:'{A}',answer:v,text:`pzm ${k} ${v} ${d1} ${d2}`,fast:25,
  nudge:nu(`Count by ${k}s and look between ${v-d1} and ${v+d2}.`),explain:ex(`${k} × ${m} = ${v}`,`Only <b>${v}</b> fits.`)});};
const gPuzCommon=c=>{let a,b;do{a=R(2,6);b=R(2,9);}while(a===b||lcm(a,b)>40||lcm(a,b)===Math.max(a,b));const L=lcm(a,b);
 return Q({prompt:`Puzzle: I am a multiple of <b>${a}</b> and a multiple of <b>${b}</b>. I am less than <b>${2*L}</b>. What number am I?`,tpl:'{A}',answer:L,text:`pzc ${a} ${b}`,fast:30,
  nudge:nu(`List the multiples of ${b}. Which one can ${a} also go into?`),explain:ex(`Multiples of ${b}: ${sk(b,Math.min(L/b+1,8)).join(', ')}`,`<b>${L}</b> is also a multiple of ${a}.`)});};
const gPuzPrime=c=>{const p0=PK([23,29,31,37,47,53,67,73,79,83,89,97]);let lo=p0-1,hi=p0+1;const dl=R(1,3),dh=R(1,3);
 for(let i=0;i<dl&&!isPrime(lo-1)&&lo-1>1;i++)lo--;for(let i=0;i<dh&&!isPrime(hi+1);i++)hi++;
 return Q({mem:['pz'+p0],prompt:`Puzzle: I am a prime number between <b>${lo}</b> and <b>${hi}</b>. What number am I?`,tpl:'{A}',answer:p0,text:`pzp ${p0} ${lo} ${hi}`,fast:30,
  nudge:nu('Check each number in between. Which one has no times fact except 1 × itself?'),
  explain:ex(Array.from({length:hi-lo-1},(_,i)=>lo+1+i).map(x=>{if(isPrime(x))return `${x}: prime`;let f=2;while(x%f)f++;return `${x} = ${f} × ${x/f}`;}).join('; '),`So it is <b>${p0}</b>.`)});};
const g4story=two=>c=>{if(typeof two==='object'&&two.k===8){for(;;){const a=R(2,4),n=PK([12,8]),b=R(2,4),m=PK([6,10]),p=PK([4,6,7,8]);const t=a*n+b*m;if(t%p||t/p<5)continue;return Q({prompt:`Gizmo has <b>${a}</b> boxes of <b>${n}</b> batteries and <b>${b}</b> boxes of <b>${m}</b> batteries. He repacks all of them into packs of <b>${p}</b>. How many packs does he make?`,tpl:'{A} packs',answer:t/p,text:`g4s8 ${a} ${n} ${b} ${m} ${p}`,wp:1,fast:55,
  nudge:nu('Find each kind, add, then divide.'),explain:ex(`${a} × ${n} = ${a*n}`,`${b} × ${m} = ${b*m}`,`${a*n} + ${b*m} = ${t}`,`${t} ÷ ${p} = <b>${t/p}</b>`)});}}
 const k=typeof two==='object'?two.k:two===1?PK([2,4,5,6,7]):two==='b'?PK([0,2]):two==='s'?PK([0,1,2]):two==='p'?3:PK([0,1,3]);
 if(k===5){const r=PK([6,8,9]),n=R(5,8),tk=R(2,n-2);const t=r*n;if(t>72)return g4story(two)(c);return Q({prompt:`Nana Paws sets out <b>${t}</b> chairs in rows of <b>${r}</b>. Then she takes away <b>${tk}</b> ${PL(tk,'row')} to make room for the stage. How many chairs are still set up?`,tpl:'{A} chairs',answer:t-tk*r,text:`g4s5 ${t} ${r} ${tk}`,wp:1,fast:40,nudge:nu('How many rows? How many rows are left? Then how many chairs?'),explain:ex(`${t} ÷ ${r} = ${n} rows`,`${n} − ${tk} = ${n-tk} rows`,`${n-tk} × ${r} = <b>${(n-tk)*r}</b>`)});}
 if(k===6){const b=R(3,6),n=PK([6,8,12]),rw=PK([6,8,9].filter(z=>(b*n)%z===0&&z!==n&&b*n/z>3));if(!rw)return g4story(two)(c);return Q({prompt:`Gizmo has <b>${b}</b> boxes of <b>${n}</b> batteries. He lines them up in rows of <b>${rw}</b>. How many rows does he make?`,tpl:'{A} rows',answer:b*n/rw,text:`g4s6 ${b} ${n} ${rw}`,wp:1,fast:40,nudge:nu('How many batteries in all? Then make rows.'),explain:ex(`${b} × ${n} = ${b*n}`,`${b*n} ÷ ${rw} = <b>${b*n/rw}</b>`)});}
 if(k===7){const bg=R(4,6),n=PK([9,12]),gv=R(2,9),r=PK([6,7,8]);const rest=bg*n-gv;if(rest%r)return g4story(two)(c);return Q({prompt:`Coach Flex has <b>${bg}</b> bags of <b>${n}</b> balls. He gives <b>${gv}</b> balls to the Kind Teacher. He lines up the rest in rows of <b>${r}</b>. How many rows does he make?`,tpl:'{A} rows',answer:rest/r,text:`g4s7 ${bg} ${n} ${gv} ${r}`,wp:1,fast:50,nudge:nu('Balls in all, take away the gift, then make rows.'),explain:ex(`${bg} × ${n} = ${bg*n}`,`${bg*n} − ${gv} = ${rest}`,`${rest} ÷ ${r} = <b>${rest/r}</b>`)});}
 if(k===0){const r=PK([6,7,8,9]),t=r*R(11,16);return Q({prompt:`Nana Paws sets out <b>${t}</b> chairs in rows of <b>${r}</b>. How many rows does she make?`,tpl:'{A} rows',answer:t/r,text:`g4s0 ${t} ${r}`,wp:1,fast:25,nudge:nu(`${r} × what = ${t}?`),explain:ex(`${t} ÷ ${r} = <b>${t/r}</b>`)});}
 if(k===1){const t=PK([23,29,31,37,41,43,47]);return Q(choice({prompt:`The Kind Teacher has <b>${t}</b> chairs. Can she put them in equal rows with more than 1 row and more than 1 chair in each row?`,tpl:'{A}',text:`g4s1 ${t}`,wp:1,fast:25,nudge:nu(`Is ${t} prime or composite?`),explain:ex(`${t} is prime: only 1 × ${t}.`,`<b>No</b>`)},'No',['Yes']));}
 if(k===2){const p=PK([4,6,8]),h=R(13,37);if(h%p===0)return g4story(two)(c);const nx=(Math.floor(h/p)+1)*p;return Q({prompt:`Gizmo packs batteries in packs of <b>${p}</b>. He has <b>${h}</b> batteries. How many more batteries does he need to fill one more full pack?`,tpl:'{A} more',answer:nx-h,text:`g4s2 ${p} ${h}`,wp:1,fast:30,
  nudge:nu(`What is the next multiple of ${p} after ${h}?`),explain:ex(`The next multiple of ${p} is ${nx}.`,`${nx} − ${h} = <b>${nx-h}</b>`)});}
 if(k===3){const s=R(2,6),a=R(3,6),d=R(6,9);const v=s+(d-1)*a;return Q({prompt:`Coach Flex runs <b>${s}</b> laps on day 1. Each day he runs <b>${a}</b> more laps than the day before. How many laps does he run on day <b>${d}</b>?`,tpl:'{A} laps',answer:v,text:`g4s3 ${s} ${a} ${d}`,wp:1,fast:35,
  nudge:nu('Write the pattern day by day.'),explain:ex(Array.from({length:d},(_,i)=>`day ${i+1}: ${s+i*a}`).join(', '),`<b>${v}</b> laps`)});}
 const r=PK([4,5,6]),n=R(6,9),e=R(2,r-1);const tot=r*n+e;const x=R(3,9);return Q({prompt:`Dr. Quartz has <b>${tot}</b> crystals. He puts <b>${r}</b> in each jar and gives the <b>${e}</b> left over to ${c.name}. Then he buys <b>${x}</b> more jars, also with ${r} crystals each. How many full jars does he have now?`,tpl:'{A} jars',answer:n+x,text:`g4s4 ${tot} ${r} ${x}`,wp:1,fast:45,
  nudge:nu('How many full jars at first? Then add the new jars.'),explain:ex(`${tot} ÷ ${r} = ${n} R ${e}`,`${n} + ${x} = <b>${n+x}</b>`)});};

/* ---- grade 5 ---- */
const gTwoRules=c=>{const a=R(2,5),m=PK([2,3]),b=a*m,st=R(3,6);const k=rot('tr',[0,1]);
 if(k===0)return Q({prompt:`Both patterns start at 0. Pattern A adds <b>${a}</b> each step. Pattern B adds <b>${b}</b> each step. After <b>${st}</b> steps, A is at ${a*st}. Where is B?`,tpl:'B = {A}',answer:b*st,text:`tr0 ${a} ${b} ${st}`,fast:20,
  nudge:nu(`B adds ${b} each step, ${st} times.`),explain:ex(`A: ${sk(a,st).join(', ')}`,`B: ${sk(b,st).join(', ')}`,`B is at <b>${b*st}</b>`)});
 return Q({mem:['tr1'+m],prompt:`Pattern A: ${sk(a,4).join(', ')}<br>Pattern B: ${sk(b,4).join(', ')}<br>Each number in B is how many times the matching number in A?`,tpl:'{A} times',answer:m,text:`tr1 ${a} ${b}`,fast:20,
  nudge:nu(`Compare ${b} with ${a}.`),explain:ex(`${a} × ${m} = ${b}, ${2*a} × ${m} = ${2*b}`,`B is always <b>${m}</b> times A.`)});};
const gIO=(hard)=>c=>{const m=R(2,hard?6:5),b=R(hard?-6:0,9);const f=x=>m*x+b;let xs=SH([1,2,3,4,5,6,7,8]).slice(0,4).sort((x,y)=>x-y);if(xs.some(x=>f(x)<=0))return gIO(hard)(c);
 const ask=R(9,12);const back=hard&&Math.random()<.4;
 const rule=b===0?`× ${m}`:b>0?`× ${m}, then + ${b}`:`× ${m}, then − ${-b}`;
 if(back)return Q({prompt:`Input → output: ${xs.map(x=>`${x} → ${f(x)}`).join(', ')}. Which input gives <b>${f(ask)}</b>?`,tpl:`{A} → ${f(ask)}`,answer:ask,text:`iob ${m} ${b} ${ask}`,fast:30,
  nudge:nu('Find the rule first. Then undo it.'),explain:ex(`Rule: ${rule}`,`${ask} × ${m}${b?(b>0?' + '+b:' − '+(-b)):''} = ${f(ask)}`,`Input: <b>${ask}</b>`)});
 return Q({prompt:`Input → output: ${xs.map(x=>`${x} → ${f(x)}`).join(', ')}. Use the same rule.`,tpl:`${ask} → {A}`,answer:f(ask),text:`io ${m} ${b} ${ask}`,fast:30,
  nudge:nu('When the input goes up by 1, how much does the output go up?'),explain:ex(`Rule: ${rule}`,`${ask} × ${m}${b?(b>0?' + '+b:' − '+(-b)):''} = <b>${f(ask)}</b>`)});};
const EXW=[
 ()=>{const k=R(2,5),a=R(2,9),b=R(2,9);return [`${k} times the sum of ${a} and ${b}`,`${k} × (${a} + ${b})`,k*(a+b),[`${k} × ${a} + ${b}`,`${k} + ${a} × ${b}`,`(${k} + ${a}) × ${b}`]];},
 ()=>{const k=R(2,5),a=R(2,9),b=R(2,9);return [`add ${a} and ${b}, then multiply by ${k}`,`(${a} + ${b}) × ${k}`,k*(a+b),[`${a} + ${b} × ${k}`,`${a} × ${b} + ${k}`,`${a} + ${b} + ${k}`]];},
 ()=>{const k=R(2,5),b=R(2,8),a=b+R(2,9);return [`subtract ${b} from ${a}, then multiply by ${k}`,`(${a} − ${b}) × ${k}`,k*(a-b),[`${a} − ${b} × ${k}`,`(${b} − ${a}) × ${k}`,`${a} − (${b} × ${k})`]];},
 ()=>{const a=R(2,9),b=R(2,9),d=R(2,20);return [`multiply ${a} by ${b}, then add ${d}`,`${a} × ${b} + ${d}`,a*b+d,[`${a} × (${b} + ${d})`,`${a} + ${b} × ${d}`,`(${a} + ${b}) × ${d}`]];},
 ()=>{const a=R(11,40),b=R(2,9);return [`double ${a}, then subtract ${b}`,`2 × ${a} − ${b}`,2*a-b,[`2 × (${a} − ${b})`,`${a} − 2 × ${b}`,`2 + ${a} − ${b}`]];},
 ()=>{const q=R(3,12),k=R(2,5),a=R(1,k*q-1);return [`the sum of ${a} and ${k*q-a}, divided by ${k}`,`(${a} + ${k*q-a}) ÷ ${k}`,q,[`${a} + ${k*q-a} ÷ ${k}`,`${k} ÷ (${a} + ${k*q-a})`,`${a} ÷ ${k} + ${k*q-a}`]];},
];
const gExprVal=c=>{const [w,e,v]=PK(EXW)();return Q({prompt:`Write it as an expression, then find its value: <b>${w}</b>.`,tpl:'{A}',answer:v,text:`ev ${w}`,fast:25,
 nudge:nu('Write the numbers and signs in order. Use ( ) for the part done first.'),explain:ex(`${e}`,`= <b>${v}</b>`)});};
const gExprPick=c=>{const [w,e,v,wr]=PK(EXW)();return Q(choice({prompt:`Which expression means <b>${w}</b>?`,tpl:'{A}',text:`epk ${w}`,fast:25,
 nudge:nu('Which part happens first? It goes in ( ), or is a × that is done first anyway.'),explain:ex(`<b>${e}</b>`,`Its value is ${v}.`)},e,wr));};
const gTimesLarge=c=>{const a=R(12,95),b=R(100,999),k=R(2,9);const [x,y]=Math.random()<.5?[`${k} × (${a} + ${b})`,`${a} + ${b}`]:[`(${a} + ${b}) × ${k}`,`${a} + ${b}`];
 return Q({prompt:`Don't work it out! <b>${x}</b> is how many times as large as <b>${y}</b>?`,tpl:'{A} times as large',answer:k,text:`tl ${a} ${b} ${k}`,fast:15,
  nudge:nu('Look for the same sum inside both.'),explain:ex(`Both have (${a} + ${b}).`,`The first one is that sum times ${k}: <b>${k}</b> times as large.`)});};
const gWhereParen=c=>{const a=R(2,9),b=R(2,9),d=R(2,6);
 if(Math.random()<.5){const v=(a+b)*d;return Q(choice({prompt:`Where do the parentheses go to make it true? <b>${a} + ${b} × ${d} = ${v}</b>`,tpl:'{A}',text:`wp0 ${a} ${b} ${d}`,fast:25,
  nudge:nu('Try each one and work it out.'),explain:ex(`(${a} + ${b}) × ${d} = ${a+b} × ${d} = ${v}`,`<b>(${a} + ${b}) × ${d}</b>`)},`(${a} + ${b}) × ${d}`,[`${a} + (${b} × ${d})`]));}
 const v=d*(a+b);return Q(choice({prompt:`Where do the parentheses go to make it true? <b>${d} × ${a} + ${b} = ${v}</b>`,tpl:'{A}',text:`wp1 ${a} ${b} ${d}`,fast:25,
  nudge:nu('Try each one and work it out.'),explain:ex(`${d} × (${a} + ${b}) = ${d} × ${a+b} = ${v}`,`<b>${d} × (${a} + ${b})</b>`)},`${d} × (${a} + ${b})`,[`(${d} × ${a}) + ${b}`]));};
const gGCF=c=>{let a,b;do{a=R(4,30);b=R(4,30);}while(a===b||gcd(a,b)<2||gcd(a,b)===Math.min(a,b)&&Math.random()<.7);const g=gcd(a,b);
 const fa=[];for(let i=1;i<=a;i++)if(a%i===0)fa.push(i);const fb=[];for(let i=1;i<=b;i++)if(b%i===0)fb.push(i);
 return Q({prompt:`⭐ Challenge: What is the greatest factor that <b>${a}</b> and <b>${b}</b> share?`,tpl:'{A}',answer:g,text:`gcf ${Math.min(a,b)} ${Math.max(a,b)}`,fast:30,
  nudge:nu(`List the factors of each number and find the biggest one in both lists.`),explain:ex(`${a}: ${fa.join(', ')}`,`${b}: ${fb.join(', ')}`,`The biggest one in both: <b>${g}</b>`)});};
const gLCM=c=>{let a,b;do{a=R(2,12);b=R(2,12);}while(a===b||lcm(a,b)>60||lcm(a,b)===Math.max(a,b)&&Math.random()<.8);const L=lcm(a,b);const big=Math.max(a,b),sm=Math.min(a,b);
 return Q({prompt:`⭐ Challenge: What is the smallest number (more than 0) that is a multiple of both <b>${a}</b> and <b>${b}</b>?`,tpl:'{A}',answer:L,text:`lcm ${sm} ${big}`,fast:30,
  nudge:nu(`Count by ${big}s. Stop at the first one that ${sm} also goes into.`),explain:ex(`Multiples of ${big}: ${sk(big,L/big).join(', ')}`,`<b>${L}</b> is also a multiple of ${sm}.`)});};
const g5story=c=>{const k=c.k!=null?c.k:R(0,4);
 if(k===5){const per=R(3,5),pan=R(1,3),b=R(6,12);return Q({prompt:`For each batch of muffins, Ms. Rosa uses <b>${per}</b> cups of flour. She also uses <b>${pan}</b> ${PL(pan,'cup')} to dust the pans, once for the whole bake. How many cups does she use for <b>${b}</b> batches?`,tpl:`${b} × ${per} + ${pan} = {A}`,answer:b*per+pan,text:`g5s5 ${per} ${pan} ${b}`,wp:1,fast:40,
  nudge:nu('Multiply for the batches, then add the pan flour once.'),explain:ex(`${b} × ${per} = ${b*per}`,`${b*per} + ${pan} = <b>${b*per+pan}</b>`)});}
 if(k===6){const p=R(3,6),r=R(3,8),bl=R(3,8),g=R(4,15);return Q({prompt:`Coach Flex buys <b>${p}</b> packs of balls. Each pack has <b>${r}</b> red and <b>${bl}</b> blue balls. He gives <b>${g}</b> balls to the Kind Teacher. How many balls does he keep?`,tpl:`${p} × (${r} + ${bl}) − ${g} = {A}`,answer:p*(r+bl)-g,text:`g5s6 ${p} ${r} ${bl} ${g}`,wp:1,fast:45,
  nudge:nu('Balls in one pack first, then all the packs, then take away.'),explain:ex(`${r} + ${bl} = ${r+bl}`,`${p} × ${r+bl} = ${p*(r+bl)}`,`${p*(r+bl)} − ${g} = <b>${p*(r+bl)-g}</b>`)});}
 if(k===7){const ad=R(1,3),kd=R(3,6),pa=PK([6,8,10]),pk=PK([3,4,5]),tr=R(3,5);const one=ad*pa+kd*pk;return Q({prompt:`Each trip on Ozzy's train carries <b>${ad}</b> ${PL(ad,'grown-up')} at <b>${pa}</b> coins and <b>${kd}</b> kids at <b>${pk}</b> coins. How many coins does Ozzy collect in <b>${tr}</b> trips?`,tpl:`${tr} × (${ad} × ${pa} + ${kd} × ${pk}) = {A}`,answer:tr*one,text:`g5s7 ${ad} ${kd} ${pa} ${pk} ${tr}`,wp:1,fast:50,
  nudge:nu('Coins for one trip first. Then times the trips.'),explain:ex(`${ad} × ${pa} = ${ad*pa}, ${kd} × ${pk} = ${kd*pk}`,`One trip: ${ad*pa} + ${kd*pk} = ${one}`,`${tr} × ${one} = <b>${tr*one}</b>`)});}
 if(k===0){const t=R(3,5),n=PK([12,24]),kp=R(2,9),b=PK([5,6,7,8]);const rest=t*n-kp;if(rest%b)return g5story(c);
  return Q({prompt:`Ms. Rosa bakes <b>${t}</b> trays of <b>${n}</b> cookies. She keeps <b>${kp}</b> for the café. She packs the rest into bags of <b>${b}</b>. How many bags does she fill?`,tpl:'{A} bags',answer:rest/b,text:`g5s0 ${t} ${n} ${kp} ${b}`,wp:1,fast:50,
   nudge:nu('Cookies, then subtract, then divide.'),explain:ex(`${t} × ${n} = ${t*n}`,`${t*n} − ${kp} = ${rest}`,`${rest} ÷ ${b} = <b>${rest/b}</b>`)});}
 if(k===1){let a,b;do{a=PK([6,8,10,12]);b=PK([4,6,8,9,10]);}while(a===b||lcm(a,b)===Math.max(a,b));const L=lcm(a,b);
  return Q({prompt:`Hot dogs come in packs of <b>${a}</b>. Buns come in packs of <b>${b}</b>. Grumbleroot the troll wants the same number of hot dogs and buns, with none left over. What is the smallest number of hot dogs he can buy?`,tpl:'{A} hot dogs',answer:L,text:`g5s1 ${a} ${b}`,wp:1,fast:45,
   nudge:nu(`Find a number that is a multiple of both ${a} and ${b}.`),explain:ex(`Multiples of ${Math.max(a,b)}: ${sk(Math.max(a,b),L/Math.max(a,b)).join(', ')}`,`<b>${L}</b> is the first one that is also a multiple of ${Math.min(a,b)}.`)});}
 if(k===2){let a,b;do{a=R(2,6)*PK([2,3,4]);b=R(2,6)*PK([2,3,4]);}while(a===b||gcd(a,b)<2||a>30||b>30);const g=gcd(a,b);
  return Q({prompt:`Nana Paws has <b>${a}</b> red beads and <b>${b}</b> blue beads. She makes matching gift bags, each with the same mix of red and blue, using every bead. What is the greatest number of bags she can make?`,tpl:'{A} bags',answer:g,text:`g5s2 ${a} ${b}`,wp:1,fast:45,
   nudge:nu(`The number of bags must be a factor of both ${a} and ${b}.`),explain:ex(`Greatest factor of both ${a} and ${b}: <b>${g}</b>`,`Each bag gets ${a/g} red and ${b/g} blue.`)});}
 if(k===3){const a=R(1,3),b=a*PK([2,3]),d=R(5,9);return Q({prompt:`Coach Flex and Gizmo both start at 0 laps. Each day Coach Flex adds <b>${b}</b> laps to his total and Gizmo adds <b>${a}</b>. On the day Gizmo's total reaches <b>${a*d}</b>, what is Coach Flex's total?`,tpl:'{A} laps',answer:b*d,text:`g5s3 ${a} ${b} ${d}`,wp:1,fast:40,
  nudge:nu(`How many days did it take Gizmo? Coach Flex had the same number of days.`),explain:ex(`${a*d} ÷ ${a} = ${d} days`,`${d} × ${b} = <b>${b*d}</b>`)});}
 const s=R(15,30),tk=PK([4,5,6]),ch=R(2,4);const pay=s*tk+ch*R(3,8);const snack=(pay-s*tk)/ch;return Q({prompt:`<b>${s}</b> kids buy tickets for Ozzy's ride at <b>${tk}</b> coins each. The class also buys <b>${ch}</b> bags of snacks. The class spends <b>${pay}</b> coins in all. How many coins does one bag of snacks cost?`,tpl:'{A} coins',answer:snack,text:`g5s4 ${s} ${tk} ${ch} ${pay}`,wp:1,fast:50,
  nudge:nu('Find the ticket cost, take it away, then share the rest among the bags.'),explain:ex(`${s} × ${tk} = ${s*tk}`,`${pay} − ${s*tk} = ${pay-s*tk}`,`${pay-s*tk} ÷ ${ch} = <b>${snack}</b>`)});};
/* ---------- round 2: helpers ---------- */
const ord=n=>{const v=n%100;if(v>=11&&v<=13)return n+'th';return n+(['th','st','nd','rd'][n%10]||'th');};
const K=(f,k)=>c=>f(Object.assign({},c,{k}));
const dsum=n=>String(n).split('').reduce((s,d)=>s+ +d,0);
const YN=(o,yes)=>Q(choice(o,yes?'Yes':'No',[yes?'No':'Yes']));
/* ---------- CAASPP-style kinds (game tone) ---------- */
/* Gizmo checks a product; slips are ±one group or a place-value slip */
const tfMul=(ga,gb)=>c=>{const a=ga(),b=gb(),p=a*b;const ok=Math.random()<.45;const sl=[a,-a,b,-b,10,-10];if(p>300)sl.push(100,-100);const shown=ok?p:p+PK(sl.filter(z=>p+z>0));
 return YN({prompt:`Gizmo's calculator is broken, so he works it out by hand. He says <b>${M(a,b)} = ${N(shown)}</b>. Is he right?`,tpl:'{A}',text:`tfm ${a} ${b} ${shown}`,fast:20,
  nudge:nu(`Work out ${M(a,b)} yourself, then compare.`),explain:ex(`${M(a,b)} = ${N(p)}`,ok?'So <b>Yes</b>, he is right.':`Not ${N(shown)}, so <b>No</b>.`)},ok);};
const tfDiv=(Ds,Qs)=>c=>{const d=PK(Ds),q=PK(Qs),t=d*q;const ok=Math.random()<.45;const shown=ok?q:q+PK([1,-1].filter(z=>q+z>0));
 return YN({prompt:`The Grey Goblin says <b>${t} ÷ ${d} = ${shown}</b>. Is he right?`,tpl:'{A}',text:`tfd ${t} ${d} ${shown}`,fast:15,
  nudge:nu(`Check with multiplication: ${d} × ${shown} = ?`),explain:ex(`${d} × ${shown} = ${d*shown}`,ok?'That matches, so <b>Yes</b>.':`That is not ${t}, so <b>No</b>. (${t} ÷ ${d} = ${q})`)},ok);};
/* which number makes it true: a × ? = b × d */
const balance=(amax)=>c=>{for(;;){const a=R(2,amax),x=R(2,9),p=a*x;const fs=[];for(let b=2;b<=12;b++)if(p%b===0&&b!==a&&b!==x&&p/b>=2&&p/b<=20&&p/b!==a)fs.push(b);if(!fs.length)continue;const b=PK(fs),d=p/b;
 return Q({prompt:'Which number makes both sides equal?',tpl:`${a} × {A} = ${b} × ${d}`,answer:x,text:`bal ${a} ${b} ${d}`,fast:20,nudge:nu(`Work out ${b} × ${d} first.`),explain:ex(`${b} × ${d} = ${p}`,`${a} × <b>${x}</b> = ${p}`)});}};
const divBalance=c=>{const q=PK([[2,2],[2,3],[2,4],[3,3],[2,5]]),qq=q[0]*q[1],x=R(2,9),t=qq*x;
 return Q({prompt:'Which number makes both sides equal?',tpl:`${t} ÷ {A} = ${q[0]} × ${q[1]}`,answer:x,text:`dbal ${t} ${qq}`,fast:20,nudge:nu(`${q[0]} × ${q[1]} = ${qq}. What do you divide ${t} by to get ${qq}?`),explain:ex(`${q[0]} × ${q[1]} = ${qq}`,`${t} ÷ <b>${x}</b> = ${qq}`)});};
/* which expression matches the story */
const whichMul=c=>{let g,n;do{g=R(3,9);n=R(3,9);}while(g===n);const x=PK(EQ(c));
 return Q(choice({prompt:`${x.mul(g,n)} Which one finds the total?`,tpl:'{A}',text:`wm ${x.k} ${g} ${n}`,wp:1,fast:20,nudge:nu('Equal groups means multiply.'),
  explain:ex(`${g} equal groups of ${n}: <b>${g} × ${n}</b> = ${g*n}`)},`${g} × ${n}`,[`${g} + ${n}`,`${n} − ${g}`,`${g*n} ÷ ${g}`]));};
const whichDiv=c=>{let g,n;do{g=R(3,9);n=R(3,9);}while(g===n);const x=PK(EQ(c)),t=g*n;
 return Q(choice({prompt:`${x.sh(t,g)} ${x.qs} Which one finds it?`,tpl:'{A}',text:`wd ${x.k} ${t} ${g}`,wp:1,fast:20,nudge:nu('Sharing equally means divide.'),
  explain:ex(`Share ${t} into ${g} equal groups: <b>${t} ÷ ${g}</b> = ${n}`)},`${t} ÷ ${g}`,[`${t} × ${g}`,`${t} − ${g}`,`${g} ÷ ${t}`]));};
const whichTimes=c=>{const s=R(12,40),k=R(3,9);if(s===k)return whichTimes(c);
 return Q(choice({prompt:`Gizmo did <b>${s}</b> push-ups. Coach Flex did <b>${k}</b> times as many. Which one shows how many push-ups Coach Flex did?`,tpl:'{A}',text:`wt ${s} ${k}`,wp:1,fast:20,
  nudge:nu('"Times as many" means multiply.'),explain:ex(`<b>${s} × ${k}</b> = ${s*k}`)},`${s} × ${k}`,[`${s} + ${k}`,`${s} − ${k}`,`${s} + ${s}`]));};
/* closer to … (estimation pick) */
const estMul=(aT,bT)=>c=>{for(;;){const A0=PK(aT),B0=PK(bT),P=A0*B0,st=P/2;const a=A0+R(-3,3),b=B0+R(-2,2);if(a===A0&&b===B0)continue;if(Math.abs(a*b-P)>=st/2)continue;
 return Q(choice({prompt:`Don't work it out exactly! Is <b>${M(a,b)}</b> closer to…`,tpl:'{A}',text:`est ${a} ${b}`,fast:20,nudge:nu('Round each number to a friendly number first.'),
  explain:ex(`${a} is about ${A0} and ${b} is about ${B0}.`,`${A0} × ${B0} = <b>${N(P)}</b>`)},N(P),[N(P-st),N(P+st)]));}};
const estDiv=c=>{for(;;){const D0=R(2,9)*10,q0=PK([3,4,5,6,7,8,9])*10;const d=D0+R(-2,2),t=d*q0+R(-15,15);if(t<1000)continue;
 return Q(choice({prompt:`Don't work it out exactly! Is <b>${N(t)} ÷ ${d}</b> closer to…`,tpl:'{A}',text:`estd ${t} ${d}`,fast:20,nudge:nu(`Round ${d} to ${D0}. How many ${D0}s make about ${N(t)}?`),
  explain:ex(`${N(t)} is about ${N(D0*q0)}, and ${d} is about ${D0}.`,`${N(D0*q0)} ÷ ${D0} = <b>${q0}</b>`)},String(q0),[String(q0/10),String(q0*10)]));}};
/* remainder slip */
const remSlip=(qmin,qmax)=>c=>{const d=R(3,9),q=R(qmin,qmax),r=R(1,d-1),t=d*q+r;const k=rot('rw',[0,1,2]);let sq=q,sr=r;if(k===1){sq=q-1;sr=r+d;}else if(k===2){sr=r===d-1?r-1:r+1;}
 return YN({prompt:`Gizmo says <b>${N(t)} ÷ ${d} = ${sq} R ${sr}</b>. Is he right?`,tpl:'{A}',text:`rsl ${t} ${d} ${k}`,fast:25,
  nudge:nu('Check: is the remainder smaller than the divisor? Does divisor × quotient + remainder give the number?'),
  explain:k===0?ex(`${d} × ${q} + ${r} = ${N(t)}`,'<b>Yes</b>, he is right.'):k===1?ex(`R ${sr} is not smaller than ${d}, so one more group of ${d} fits.`,`It should be ${q} R ${r}, so <b>No</b>.`):ex(`${d} × ${q} + ${sr} = ${N(d*q+sr)}, not ${N(t)}.`,`It should be ${q} R ${r}, so <b>No</b>.`)},k===0);};
/* grade 5 slips */
const decSlip=c=>{for(;;){const a=R(2,9),b=R(2,9);const t=a*b;if(t%10===0)continue;const ok=Math.random()<.4;
 return YN({prompt:`Gizmo says <b>${dec(a,1)} × ${dec(b,1)} = ${ok?dec(t,2):dec(t,1)}</b>. Is he right?`,tpl:'{A}',text:`dsl ${a} ${b} ${ok}`,fast:20,
  nudge:nu('Tenths × tenths makes hundredths. Count the decimal places.'),explain:ex(`${a} × ${b} = ${t}`,`Tenths × tenths = hundredths: ${dec(t,2)}`,ok?'So <b>Yes</b>.':`Not ${dec(t,1)}, so <b>No</b>.`)},ok);}};
const ooSlip=c=>{const a=R(2,9),b=R(2,9),d=R(2,9);const right=a+b*d,wrong=(a+b)*d;const ok=Math.random()<.4;
 return YN({prompt:`Gizmo says <b>${a} + ${b} × ${d} = ${ok?right:wrong}</b>. Is he right?`,tpl:'{A}',text:`osl ${a} ${b} ${d} ${ok}`,fast:20,
  nudge:nu('Which comes first, × or +?'),explain:ex(`Multiply first: ${b} × ${d} = ${b*d}`,`${a} + ${b*d} = ${right}`,ok?'So <b>Yes</b>.':`He added first and got ${wrong}, so <b>No</b>.`)},ok);};
const tfExpr=c=>{const a=R(2,9),b=R(2,9),d=R(2,5);const k=R(0,2);let L,Rr,ok;
 if(k===0){L=`(${a} + ${b}) × ${d}`;Rr=`${a} × ${d} + ${b} × ${d}`;ok=true;}
 else if(k===1){L=`(${a} + ${b}) × ${d}`;Rr=`${a} + ${b} × ${d}`;ok=false;}
 else{L=`${d} × (${a} + ${b})`;Rr=`${d} × ${a} + ${b}`;ok=false;}
 return Q(choice({prompt:`True or false? <b>${L} = ${Rr}</b>`,tpl:'{A}',text:`tfe ${k} ${a} ${b} ${d}`,fast:25,nudge:nu('Work out each side.'),
  explain:k===0?ex(`(${a} + ${b}) × ${d} = ${(a+b)*d}`,`${a*d} + ${b*d} = ${(a+b)*d}`,'<b>True</b>'):k===1?ex(`Left: ${(a+b)*d}`,`Right: ${a+b*d}`,'<b>False</b>'):ex(`Left: ${d*(a+b)}`,`Right: ${d*a+b}`,'<b>False</b>')},ok?'True':'False',[ok?'False':'True']));};

/* ---------- grade 2 Array Reef (arrays ≤ 5×5) ---------- */
const gStar=c=>{const n=R(3,8);return Q({prompt:`${'⭐'.repeat(n)}<br>Each starfish has 5 arms. Count the arms by 5s.`,tpl:'{A} arms',answer:5*n,text:`gst ${n}`,tk:'by5',fast:15,
 nudge:nu('Count 5, 10, 15, …'),explain:ex(`${sk(5,n).join(', ')}`,`<b>${5*n}</b> arms`)});};
const gShell10=c=>{const n=R(3,9);return Q({prompt:`${c.name} fills <b>${n}</b> buckets with 10 shells each. Count by 10s. How many shells?`,tpl:'{A} shells',answer:10*n,text:`gsh ${n}`,tk:'by10',wp:1,fast:15,
 nudge:nu('Count 10, 20, 30, …'),explain:ex(`${sk(10,n).join(', ')}`,`<b>${10*n}</b> shells`)});};
const gRepAdd2=(mn)=>c=>{const g=R(mn,5),n=R(mn,5),e=sea();return Q({prompt:`<b>${g}</b> groups with <b>${n}</b> ${e[1]} in each.`,vis:{t:'groups',g,n,e:e[0]},tpl:`${rep(n,g)} = {A}`,answer:g*n,text:`gra ${g} ${n}`,
 nudge:nu(`Add ${n} again and again.`),explain:ex(`${rep(n,g)} = <b>${g*n}</b>`)});};
const gArrRows2=(mn)=>c=>{const r=R(mn,5),k=R(mn,5),e=sea();return Q({prompt:`Add the rows of ${e[1]}.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${rep(k,r)} = {A}`,answer:r*k,text:`gar ${r} ${k}`,
 nudge:nu(`Each row has ${k}.`),explain:ex(`${rep(k,r)} = <b>${r*k}</b>`)});};
const gArrCols2=c=>{const r=R(3,5),k=R(3,5),e=sea();return Q({prompt:`Now add the <b>columns</b>. Each column has <b>${r}</b> ${e[1]}.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${rep(r,k)} = {A}`,answer:r*k,text:`gac ${r} ${k}`,
 nudge:nu(`There are ${k} columns. Add ${r} for each one.`),explain:ex(`${rep(r,k)} = <b>${r*k}</b>`,'Rows or columns, the total is the same.')});};
const gArrBig2=c=>{const r=R(4,5),k=R(4,5),e=sea();return Q({prompt:`How many ${e[1]} are in this array?`,vis:{t:'array',r,c:k,e:e[0]},tpl:`{A} ${e[1]}`,answer:r*k,text:`gab ${r} ${k} ${e[1]}`,
 nudge:nu('Count by the number in one row.'),explain:ex(`${r} rows of ${k}: ${sk(k,r).join(', ')}`,`<b>${r*k}</b>`)});};
const ARRS2=c=>[
 (r,k)=>[`The Kind Teacher sets out chairs in <b>${r}</b> rows with <b>${k}</b> chairs in each row.`,'How many chairs are there?','chairs'],
 (r,k)=>[`${c.name} plants <b>${r}</b> rows of sea grass with <b>${k}</b> plants in each row.`,'How many plants is that?','plants'],
 (r,k)=>[`Ms. Rosa's muffin pan has <b>${r}</b> rows with <b>${k}</b> muffins in each row.`,'How many muffins fit in the pan?','muffins'],
 (r,k)=>[`Dr. Quartz grows crystals in a tray with <b>${r}</b> rows of <b>${k}</b>.`,'How many crystals are in the tray?','crystals'],
 (r,k)=>[`Skyla the eagle sees <b>${r}</b> rows of turtles on the beach, <b>${k}</b> in each row.`,'How many turtles does she see?','turtles']];
const g2arrStory=c=>{const r=R(3,5),k=R(3,5);const [s,q,u]=PK(ARRS2(c))(r,k);return Q({prompt:`${s} ${q}`,tpl:`{A} ${u}`,answer:r*k,text:`g2a ${u} ${r} ${k}`,wp:1,fast:20,
 nudge:nu(`Add ${k} for each of the ${r} rows.`),explain:ex(`${rep(k,r)} = <b>${r*k}</b> ${u}`)});};
const g2L=c=>{const k=c.k;
 if(k===6){const a=R(2,4),n=R(3,5),b=R(2,3),m=R(2,4);return Q({prompt:`Ozzy shrinks you down at the reef. You see <b>${a}</b> rows of <b>${n}</b> fish and <b>${b}</b> rows of <b>${m}</b> turtles. How many animals do you see?`,tpl:'{A} animals',answer:a*n+b*m,text:`g2L6 ${a} ${n} ${b} ${m}`,wp:1,fast:35,
  nudge:nu('Count the fish. Count the turtles. Then add.'),explain:ex(`Fish: ${rep(n,a)} = ${a*n}`,`Turtles: ${rep(m,b)} = ${b*m}`,`${a*n} + ${b*m} = <b>${a*n+b*m}</b>`)});}
 if(k===7){const r=R(4,5),n=R(3,5),g=R(1,2);return Q({prompt:`Nana Paws has <b>${r}</b> rows of dog treats with <b>${n}</b> in each row. She gives away <b>${g}</b> whole ${PL(g,'row')}. How many treats are left?`,tpl:'{A} treats',answer:(r-g)*n,text:`g2L7 ${r} ${n} ${g}`,wp:1,fast:35,
  nudge:nu('How many rows are left? Then add them up.'),explain:ex(`${r} − ${g} = ${r-g} rows`,`${rep(n,r-g)} = <b>${(r-g)*n}</b>`)});}
 if(k===0){const r=R(4,5),n=R(4,5),u=R(4,r*n-4);return Q({prompt:`The Kind Teacher sets out <b>${r}</b> rows of <b>${n}</b> chairs. <b>${u}</b> kids sit down. How many chairs are still empty?`,tpl:'{A} chairs',answer:r*n-u,text:`g2L0 ${r} ${n} ${u}`,wp:1,fast:30,
  nudge:nu('How many chairs in all? Then take away the full ones.'),explain:ex(`${rep(n,r)} = ${r*n} chairs`,`${r*n} − ${u} = <b>${r*n-u}</b>`)});}
 if(k===1){const n=R(3,5),a=R(2,3),b=R(1,2);return Q({prompt:`${c.name} lines up shells in <b>${a}</b> rows of <b>${n}</b>. Then ${c.name} adds <b>${b}</b> more ${PL(b,'row')} of <b>${n}</b>. How many shells are there now?`,tpl:'{A} shells',answer:(a+b)*n,text:`g2L1 ${a} ${b} ${n}`,wp:1,fast:30,
  nudge:nu('How many rows are there now? Add that many groups.'),explain:ex(`${a} + ${b} = ${a+b} rows`,`${rep(n,a+b)} = <b>${(a+b)*n}</b>`)});}
 if(k===2){const r=R(3,4),n=R(4,5),e=R(2,6);return Q({prompt:`Gizmo has a box of eggs with <b>${r}</b> rows of <b>${n}</b>. He drops <b>${e}</b> eggs. Oops! How many eggs are not broken?`,tpl:'{A} eggs',answer:r*n-e,text:`g2L2 ${r} ${n} ${e}`,wp:1,fast:30,
  nudge:nu('How many eggs at first? Then take away the broken ones.'),explain:ex(`${rep(n,r)} = ${r*n}`,`${r*n} − ${e} = <b>${r*n-e}</b>`)});}
 if(k===3){let a,b;do{a=[R(3,5),R(4,5)];b=[R(2,4),R(2,4)];}while(a[0]*a[1]<=b[0]*b[1]);const A=a[0]*a[1],B=b[0]*b[1];return Q({prompt:`Skyla the eagle counts <b>${a[0]}</b> rows of <b>${a[1]}</b> crabs on one rock. On another rock she counts <b>${b[0]}</b> rows of <b>${b[1]}</b> crabs. How many more crabs are on the first rock?`,tpl:'{A} more crabs',answer:A-B,text:`g2L3 ${a} ${b}`,wp:1,fast:35,
  nudge:nu('Find each total first. Then subtract.'),explain:ex(`First rock: ${rep(a[1],a[0])} = ${A}`,`Second rock: ${rep(b[1],b[0])} = ${B}`,`${A} − ${B} = <b>${A-B}</b>`)});}
 if(k===4){const r=R(3,5),n=R(3,5);const ev=(r*n)%2===0;return Q(choice({prompt:`<b>${r}</b> rows of <b>${n}</b> kids wait for Ozzy's train. Each seat holds 2 kids. Can every kid sit with a partner, with nobody left over?`,tpl:'{A}',text:`g2L4 ${r} ${n}`,wp:1,fast:30,
  nudge:nu('How many kids are there? Is that number even or odd?'),explain:ex(`${rep(n,r)} = ${r*n} kids`,ev?`${r*n} is even, so <b>Yes</b>.`:`${r*n} is odd, so one kid is left over: <b>No</b>.`)},ev?'Yes':'No',[ev?'No':'Yes']));}
 const r=R(3,4),n=R(4,5),s=R(3,9),b=R(2,6);return Q({prompt:`Ms. Rosa bakes <b>${r}</b> rows of <b>${n}</b> cookies. She sells <b>${s}</b>. Then she bakes <b>${b}</b> more. How many cookies does she have now?`,tpl:'{A} cookies',answer:r*n-s+b,text:`g2L5 ${r} ${n} ${s} ${b}`,wp:1,fast:35,
  nudge:nu('Find the first total. Take away, then add.'),explain:ex(`${rep(n,r)} = ${r*n}`,`${r*n} − ${s} = ${r*n-s}`,`${r*n-s} + ${b} = <b>${r*n-s+b}</b>`)});};

/* ---------- grade 3 Array Reef: arrays, area, break apart, patterns, even/odd ---------- */
const gArrMul3=c=>{const r=R(3,6),k=R(3,9),e=sea();return Q({prompt:`Write a multiplication for this array: rows × how many in each row.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r} × ${k} = {A}`,answer:r*k,text:`gam3 ${r} ${k}`,fast:10,
 nudge:nu(`${r} rows of ${k} is ${r} × ${k}.`),explain:ex(`${sk(k,r).join(', ')}`,`${r} × ${k} = <b>${r*k}</b>`)});};
const gArrPick3=c=>{let r,k;do{r=R(3,6);k=R(3,8);}while(r===k);const e=sea();
 return Q(choice({prompt:`Which multiplication matches this array?`,vis:{t:'array',r,c:k,e:e[0]},tpl:'{A}',text:`gap3 ${r} ${k}`,fast:12,nudge:nu('Count the rows. Count how many in each row.'),
  explain:ex(`${r} rows, ${k} in each row.`,`<b>${r} × ${k}</b> = ${r*k}`)},`${r} × ${k}`,[`${r} + ${k}`,`${r} × ${k+1}`,`${r+1} × ${k}`]));};
const gTurn3=c=>{let r,k;do{r=R(3,6);k=R(4,9);}while(r===k);const e=sea();return Q({prompt:`This array has <b>${r}</b> rows of <b>${k}</b>. Turn it on its side.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${k} rows of {A}`,answer:r,text:`gtn ${r} ${k}`,fast:12,
 nudge:nu('The columns become rows.'),explain:ex(`${r} × ${k} = ${k} × ${r} = ${r*k}`,`So ${k} rows of <b>${r}</b>.`)});};
const gArea3=(rm,km)=>c=>{const r=R(3,rm),k=R(3,km);return Q({prompt:`Each square is 1 square unit. What is the area of this shape?`,vis:{t:'array',r,c:k,e:'🟦'},tpl:'{A} square units',answer:r*k,text:`gar3 ${r} ${k}`,fast:12,
 nudge:nu('Count the rows and the squares in each row. Multiply.'),explain:ex(`${r} rows of ${k} squares`,`${r} × ${k} = <b>${r*k}</b> square units`)});};
const gAreaRect3=c=>{const a=R(3,9),b=R(4,10);return Q({prompt:`A rug at the reef is <b>${b}</b> units long and <b>${a}</b> units wide. What is its area?`,vis:{t:'rect',top:`${b} units`,side:`${a} units`},tpl:'{A} square units',answer:a*b,text:`garr ${a} ${b}`,fast:15,
 nudge:nu('Area of a rectangle = length × width.'),explain:ex(`${b} × ${a} = <b>${a*b}</b> square units`)});};
const gBreak3=c=>{const r=R(3,8),k=R(6,9),e=sea();return Q({prompt:`Break the array apart: ${k} columns = 5 columns + ${k-5} ${PL(k-5,'column')}.`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r} × ${k} = ${r} × 5 + ${r} × ${k-5} = ${r*5} + {A}`,answer:r*(k-5),text:`gbr ${r} ${k}`,fast:15,
 nudge:nu(`What is ${r} × ${k-5}?`),explain:ex(`${r} × ${k-5} = <b>${r*(k-5)}</b>`,`Total: ${r*5} + ${r*(k-5)} = ${r*k}`)});};
const gBreakBack3=c=>{const r=R(3,9),a=R(2,5),b=R(2,5);return Q({prompt:`Two arrays side by side make one bigger array.`,tpl:`${r} × ${a} + ${r} × ${b} = ${r} × {A}`,answer:a+b,text:`gbb ${r} ${a} ${b}`,fast:15,
 nudge:nu(`Both have ${r} rows. How many columns all together?`),explain:ex(`${a} + ${b} = ${a+b} columns`,`${r} × ${a} + ${r} × ${b} = ${r} × <b>${a+b}</b> = ${r*(a+b)}`)});};
const gTwoRect3=c=>{const r=R(3,7),a=R(2,6),b=R(2,6);return Q({prompt:`A <b>${r}</b> by <b>${a}</b> rug and a <b>${r}</b> by <b>${b}</b> rug lie side by side. What is their total area?`,tpl:'{A} square units',answer:r*(a+b),text:`g2r ${r} ${a} ${b}`,fast:20,
 nudge:nu(`Find each area and add, or put them together into ${r} by ${a+b}.`),explain:ex(`${r} × ${a} = ${r*a}`,`${r} × ${b} = ${r*b}`,`${r*a} + ${r*b} = <b>${r*(a+b)}</b>`)});};
const gLShape3=c=>{const w=R(5,9),h=R(5,8),cw=R(2,w-2),ch=R(2,h-2);const A=w*h-cw*ch;return Q({prompt:`A <b>${w}</b> by <b>${h}</b> patch of sand has a <b>${cw}</b> by <b>${ch}</b> rock in one corner. What is the area of the sand around the rock?`,tpl:'{A} square units',answer:A,text:`gls ${w} ${h} ${cw} ${ch}`,fast:30,
 nudge:nu('Find the whole area. Then take away the rock.'),explain:ex(`${w} × ${h} = ${w*h}`,`${cw} × ${ch} = ${cw*ch}`,`${w*h} − ${cw*ch} = <b>${A}</b>`)});};
const gEvenArr3=c=>{const r=R(3,9),k=R(3,9);const ev=(r*k)%2===0;
 return Q(choice({prompt:`An array has <b>${r}</b> rows of <b>${k}</b>. Is the total even or odd? Try not to multiply!`,tpl:'{A}',text:`gea ${r} ${k}`,fast:12,
  nudge:nu('If either number is even, the total is even.'),explain:ex(ev?`${r%2===0?r:k} is even, so the total is even.`:'Odd × odd is always odd.',`${r} × ${k} = ${r*k}: <b>${ev?'even':'odd'}</b>`)},ev?'even':'odd',[ev?'odd':'even']));};
const gArrDiv3=c=>{const r=R(3,8),k=R(3,9),e=sea();return Q({prompt:`<b>${r*k}</b> ${e[1]} line up in rows of <b>${k}</b>. How many rows are there?`,vis:{t:'array',r,c:k,e:e[0]},tpl:`${r*k} ÷ ${k} = {A}`,answer:r,text:`gad3 ${r} ${k}`,fast:12,
 nudge:nu(`How many groups of ${k} make ${r*k}?`),explain:ex(`${r} × ${k} = ${r*k}`,`${r*k} ÷ ${k} = <b>${r}</b>`)});};
const gTablePat3=c=>{const a=R(3,9),s=R(3,7);const v=[0,1,2].map(i=>a*(s+i));return Q({prompt:`Look at the pattern: ${v.map((x,i)=>`${a} × ${s+i} = ${x}`).join(', ')}.`,tpl:'Each answer goes up by {A}',answer:a,text:`gtp ${a} ${s}`,fast:15,
 nudge:nu('Subtract one answer from the next.'),explain:ex(`${v[1]} − ${v[0]} = ${a}`,`Each step adds one more group of ${a}: <b>${a}</b>`)});};
const gWhichArr3=c=>{const r=R(3,8),k=R(6,9),a=R(2,k-2),e=sea();
 return Q(choice({prompt:`This array is split into two parts: ${a} columns and ${k-a} columns. Which one shows the total?`,vis:{t:'array',r,c:k,e:e[0]},tpl:'{A}',text:`gwa ${r} ${k} ${a}`,fast:20,
  nudge:nu('Each part has the same number of rows.'),explain:ex(`${r} × ${a} + ${r} × ${k-a} = ${r*a} + ${r*(k-a)} = ${r*k}`,`<b>${r} × ${a} + ${r} × ${k-a}</b>`)},`${r} × ${a} + ${r} × ${k-a}`,[`${r} × ${a} + ${k-a}`,`${r} + ${a} × ${k-a}`,`${a} × ${k-a}`]));};
const g3L=c=>{const k=c.k;
 if(k===6){const r=R(5,8),n=R(6,9),red=R(2,n-3);return Q({prompt:`Dr. Quartz's crystal tray has <b>${r}</b> rows of <b>${n}</b> crystals. In every row, <b>${red}</b> crystals are red. How many crystals are not red?`,tpl:'{A} crystals',answer:r*(n-red),text:`g3L6 ${r} ${n} ${red}`,wp:1,fast:40,
  nudge:nu('How many in each row are not red? Then multiply by the rows.'),explain:ex(`${n} − ${red} = ${n-red} in each row`,`${r} × ${n-red} = <b>${r*(n-red)}</b>`)});}
 if(k===7){const r=R(6,9),n=R(3,6),d=R(2,3),m=R(2,3);return Q({prompt:`${c.name} plants <b>${r}</b> rows of <b>${n}</b> carrots. ${cap(c.pet)} digs up <b>${d}</b> whole rows. Then ${c.name} plants <b>${m}</b> more carrots in each row that is left. How many carrots are there now?`,tpl:'{A} carrots',answer:(r-d)*(n+m),text:`g3L7 ${r} ${n} ${d} ${m}`,wp:1,fast:50,
  nudge:nu('How many rows are left? How many carrots in each row now?'),explain:ex(`${r} − ${d} = ${r-d} rows`,`${n} + ${m} = ${n+m} in each row`,`${r-d} × ${n+m} = <b>${(r-d)*(n+m)}</b>`)});}
 if(k===0){const r=R(6,9),n=R(6,9),e=R(2,3);return Q({prompt:`The reef garden has <b>${r}</b> rows of <b>${n}</b> sea plants. Gizmo's robot crab munches <b>${e}</b> whole rows. How many plants are left?`,tpl:'{A} plants',answer:(r-e)*n,text:`g3L0 ${r} ${n} ${e}`,wp:1,fast:35,
  nudge:nu('How many rows are left? Then multiply.'),explain:ex(`${r} − ${e} = ${r-e} rows`,`${r-e} × ${n} = <b>${(r-e)*n}</b>`)});}
 if(k===1){const a=R(5,8),b=R(4,7),d=R(4,7),e=R(5,9);if(a*b===d*e)return g3L(c);const big=a*b>d*e;return Q({prompt:`Coach Flex's mat is <b>${a}</b> by <b>${b}</b> squares. Nana Paws's mat is <b>${d}</b> by <b>${e}</b> squares. How many more squares does the bigger mat have?`,tpl:'{A} more squares',answer:Math.abs(a*b-d*e),text:`g3L1 ${a} ${b} ${d} ${e}`,wp:1,fast:40,
  nudge:nu('Find each area. Then subtract.'),explain:ex(`Coach Flex: ${a} × ${b} = ${a*b}`,`Nana Paws: ${d} × ${e} = ${d*e}`,`${Math.max(a*b,d*e)} − ${Math.min(a*b,d*e)} = <b>${Math.abs(a*b-d*e)}</b>`)});}
 if(k===2){const cars=R(2,4),r=R(3,5),s=R(3,5),f=R(10,cars*r*s-5);const t=cars*r*s;return Q({prompt:`Ozzy's train has <b>${cars}</b> cars. Each car has <b>${r}</b> rows of <b>${s}</b> seats. <b>${f}</b> seats are full. How many seats are empty?`,tpl:'{A} seats',answer:t-f,text:`g3L2 ${cars} ${r} ${s} ${f}`,wp:1,fast:45,
  nudge:nu('Seats in one car, then all the cars, then take away the full ones.'),explain:ex(`${r} × ${s} = ${r*s} in a car`,`${r*s} × ${cars} = ${t}`,`${t} − ${f} = <b>${t-f}</b>`)});}
 if(k===3){const w=PK([4,5,6]),rows=R(5,9),add=R(2,3);const t=w*rows;return Q({prompt:`Nana Paws has <b>${t}</b> tiles. She makes a rectangle <b>${w}</b> tiles wide, using all of them. Then she adds <b>${add}</b> more rows. How many tiles are in the rectangle now?`,tpl:'{A} tiles',answer:(rows+add)*w,text:`g3L3 ${t} ${w} ${add}`,wp:1,fast:45,
  nudge:nu('How many rows at first? How many rows now?'),explain:ex(`${t} ÷ ${w} = ${rows} rows`,`${rows} + ${add} = ${rows+add} rows`,`${rows+add} × ${w} = <b>${(rows+add)*w}</b>`)});}
 if(k===4){const r=R(5,9),n=R(5,9);const t=r*n;const ev=t%2===0;return Q(choice({prompt:`${c.name} finds <b>${r}</b> rows of <b>${n}</b> shells. Can ${c.name} share them equally with one friend, with none left over?`,tpl:'{A}',text:`g3L4 ${r} ${n}`,wp:1,fast:30,
  nudge:nu('Sharing between 2 works when the total is even.'),explain:ex(`${r} × ${n} = ${t}`,ev?`${t} is even, so <b>Yes</b>.`:`${t} is odd, so <b>No</b>.`)},ev?'Yes':'No',[ev?'No':'Yes']));}
 const r=R(4,8),a=R(4,6),b=R(3,5),pr=R(2,5);return Q({prompt:`Ms. Rosa sets out <b>${r}</b> rows of <b>${a}</b> cupcakes and <b>${r}</b> rows of <b>${b}</b> cookies. Every treat costs <b>${pr}</b> coins. How many coins does she get if she sells them all?`,tpl:'{A} coins',answer:r*(a+b)*pr,text:`g3L5 ${r} ${a} ${b} ${pr}`,wp:1,fast:50,
  nudge:nu('How many treats in each row? Then how many treats? Then coins.'),explain:ex(`${a} + ${b} = ${a+b} treats in each row`,`${r} × ${a+b} = ${r*(a+b)} treats`,`${r*(a+b)} × ${pr} = <b>${r*(a+b)*pr}</b>`)});};

/* ---------- grade 4 Array Reef Legend puzzles ---------- */
const gPuzDigits=c=>{for(;;){const k=R(3,9);const ms=[];for(let v=k;v<=99;v+=k)if(v>=10)ms.push(v);const v=PK(ms),s=dsum(v);let cand=ms.filter(x=>dsum(x)===s);if(cand.length<2)continue;
 const clues=[`I am a 2-digit number.`,`I am a multiple of <b>${k}</b>.`,`My digits add up to <b>${s}</b>.`];const all=cand.slice();
 const od=cand.filter(x=>x%2===v%2);if(od.length<cand.length&&Math.random()<.5){clues.push(`I am ${v%2?'odd':'even'}.`);cand=od;}
 if(cand.length>1){const lo=cand.filter(x=>x<v),hi=cand.filter(x=>x>v);if(lo.length){const m=R(Math.max(...lo),v-1);clues.push(`I am more than <b>${m}</b>.`);}if(hi.length){const m=R(v+1,Math.min(...hi));clues.push(`I am less than <b>${m}</b>.`);}}
 return Q({prompt:`Puzzle: ${clues.join(' ')} What number am I?`,tpl:'{A}',answer:v,text:`pzd ${clues.join('|')}`,fast:45,
  nudge:nu(`List the 2-digit multiples of ${k}. Check each clue.`),explain:ex(`Multiples of ${k} with digits adding to ${s}: ${all.join(', ')}`,`Only <b>${v}</b> fits every clue.`)});}};
const gPuzFactor=c=>{for(;;){const n=PK([24,30,36,40,42,48,56,60,63,64,72,80,84,90,96,100]);const fs=[];for(let i=2;i<n;i++)if(n%i===0)fs.push(i);
 const kinds=[['even',x=>x%2===0],['odd',x=>x%2===1],['a prime number',isPrime],['a multiple of 3',x=>x%3===0]];const kd=PK(kinds);let cand=fs.filter(kd[1]);if(cand.length<3)continue;const top=Math.random()<.7;const v=top?cand[cand.length-1]:cand[0];if(v<4)continue;
 const clues=[`I am a factor of <b>${n}</b>.`,`I am ${kd[0]}.`,`I am not ${n}.`];if(top)clues.push(`I am more than <b>${R(cand[cand.length-2],v-1)}</b>.`);else clues.push(`I am less than <b>${R(v+1,cand[1])}</b>.`);
 return Q({prompt:`Puzzle: ${clues.join(' ')} What number am I?`,tpl:'{A}',answer:v,text:`pzf ${clues.join('|')}`,fast:45,
  nudge:nu(`List the factor pairs of ${n}. Then check each clue.`),explain:ex(`Factors of ${n} (not 1 or ${n}) that are ${kd[0]}: ${cand.join(', ')}`,`Only <b>${v}</b> fits every clue.`)});}};
const gChairRange=c=>{for(;;){const n=R(24,96);if(isPrime(n))continue;const a=R(3,8),b=a+R(3,5);const f=[];for(let i=a+1;i<b;i++)if(n%i===0)f.push(i);if(f.length!==1)continue;
 return Q({prompt:`Nana Paws has <b>${n}</b> chairs for the reef show. She wants equal rows, with more than <b>${a}</b> and fewer than <b>${b}</b> chairs in each row, and no chairs left over. How many rows does she make?`,tpl:'{A} rows',answer:n/f[0],text:`gcr ${n} ${a} ${b}`,wp:1,fast:50,
  nudge:nu(`Which number between ${a} and ${b} is a factor of ${n}?`),explain:ex(`Try each number between ${a} and ${b}: only ${f[0]} goes into ${n} evenly.`,`${n} ÷ ${f[0]} = <b>${n/f[0]}</b> rows`)});}};
const primeErr=c=>{const n=PK([21,27,33,39,49,51,57,63,69,77,87,91,29,31,37,41,43,47,53,59,61,67,71,73]);const pr=isPrime(n);let f=2;while(n%f&&f<n)f++;
 return YN({prompt:`Gizmo says <b>${n}</b> is a prime number. Is he right?`,tpl:'{A}',text:`pe ${n}`,fast:25,nudge:nu(`Try dividing ${n} by 3, 7 and other small numbers.`),
  explain:pr?ex(`Only 1 × ${n} makes ${n}.`,'So <b>Yes</b>, it is prime.'):ex(`${f} × ${n/f} = ${n}`,'So it is composite: <b>No</b>.')},pr);};
const tfFactor=c=>{const k=R(3,9);const yes=Math.random()<.5;let n;do{n=yes?k*R(4,12):R(30,99);}while((!yes&&n%k===0)||n>100);
 return Q(choice({prompt:`True or false? <b>${n} is a multiple of ${k}.</b>`,tpl:'{A}',text:`tff ${k} ${n}`,fast:15,nudge:nu(`Count by ${k}s, or divide ${n} by ${k}.`),
  explain:yes?ex(`${k} × ${n/k} = ${n}`,'<b>True</b>'):ex(`${n} ÷ ${k} = ${Math.floor(n/k)} R ${n%k}`,'<b>False</b>')},yes?'True':'False',[yes?'False':'True']));};

/* ---------- grade 5 Array Reef: coordinate plane in words, ordered pairs ---------- */
const PT=(x,y)=>`(${x}, ${y})`;
const coMove=lv=>c=>{let x=lv?R(1,6):0,y=lv?R(1,6):0;const start=PT(x,y);const moves=[],at=[];
 if(lv===0){const a=R(1,9),b=R(1,9);moves.push(`right <b>${a}</b>`,`up <b>${b}</b>`);x+=a;at.push(PT(x,y));y+=b;at.push(PT(x,y));}
 else{const n=lv===2?3:2;for(let i=0;i<n;i++){const amt=R(1,5);let dir;if(i%2===0){dir=x-amt>=0&&Math.random()<.4?'left':'right';x+=dir==='left'?-amt:amt;}else{dir=y-amt>=0&&Math.random()<.4?'down':'up';y+=dir==='down'?-amt:amt;}moves.push(`${dir} <b>${amt}</b>`);at.push(PT(x,y));}}
 const ax=Math.random()<.5?'x':'y';
 return Q({prompt:`On the reef map, start at <b>${start}</b>. Go ${moves.join(', then ')}. Where do you end up? Type the ${ax}-coordinate.`,tpl:`${ax} = {A}`,answer:ax==='x'?x:y,text:`com ${start} ${moves.join(',')} ${ax}`,fast:25,
  nudge:nu('Right and left change x (the first number). Up and down change y (the second number).'),explain:ex(`${start} → ${at.join(' → ')}`,`The ${ax}-coordinate is <b>${ax==='x'?x:y}</b>.`)});};
const coDist=lv=>c=>{if(!lv){const hz=Math.random()<.5,a=R(0,6),b=a+R(2,8),o=R(1,9);const p1=hz?PT(a,o):PT(o,a),p2=hz?PT(b,o):PT(o,b);
  return Q({prompt:`How many units apart are <b>${p1}</b> and <b>${p2}</b>?`,tpl:'{A} units',answer:b-a,text:`cod ${p1} ${p2}`,fast:20,
   nudge:nu(`One coordinate is the same. Subtract the other ones.`),explain:ex(`${hz?'The y-coordinates match, so look at x':'The x-coordinates match, so look at y'}: ${b} − ${a} = <b>${b-a}</b>`)});}
 const x1=R(0,4),y1=R(0,4),w=R(2,7),h=R(2,6),x2=x1+w,y2=y1+h;const per=Math.random()<.5;
 return Q({prompt:`A rectangle has corners at <b>${PT(x1,y1)}</b>, <b>${PT(x2,y1)}</b>, <b>${PT(x2,y2)}</b> and <b>${PT(x1,y2)}</b>. What is its ${per?'perimeter':'area'}?`,tpl:per?'{A} units':'{A} square units',answer:per?2*(w+h):w*h,text:`cor ${x1} ${y1} ${w} ${h} ${per}`,fast:35,
  nudge:nu('Find the length from the x-coordinates and the width from the y-coordinates.'),explain:ex(`Length: ${x2} − ${x1} = ${w}`,`Width: ${y2} − ${y1} = ${h}`,per?`${w} + ${h} + ${w} + ${h} = <b>${2*(w+h)}</b>`:`${w} × ${h} = <b>${w*h}</b>`)});};
const coPattern=lv=>c=>{const m=rot('cop'+lv,[2,3,4,5]),b=lv?R(1,6):0,f=x=>m*x+b;const xs=[1,2,3];const ask=R(5,10);
 return Q({prompt:`Gizmo's number machine makes these pairs: ${xs.map(x=>`<b>${PT(x,f(x))}</b>`).join(', ')}. Each pair follows the same rule. What is the second number when the first is <b>${ask}</b>?`,tpl:`${PT(ask,'{A}')}`,answer:f(ask),text:`cop ${m} ${b} ${ask}`,fast:30,
  nudge:nu('When the first number goes up by 1, how much does the second go up?'),explain:ex(b?`Rule: multiply by ${m}, then add ${b}`:`Rule: multiply by ${m}`,`${m} × ${ask}${b?' + '+b:''} = <b>${f(ask)}</b>`)});};
const ordPairs=lv=>c=>{const a=R(1,4),b=a*R(2,4)+(lv?R(1,3):0);const n=R(4,7);const xs=[0,1,2].map(i=>i*a),ys=[0,1,2].map(i=>i*b);
 return Q({prompt:`Rule for x: start at 0, add <b>${a}</b>. Rule for y: start at 0, add <b>${b}</b>. The ordered pairs are ${xs.map((x,i)=>PT(x,ys[i])).join(', ')}, … What is y in the pair where x is <b>${n*a}</b>?`,tpl:PT(n*a,'{A}'),answer:n*b,text:`op ${a} ${b} ${n}`,fast:30,
  nudge:nu(`How many steps does it take x to reach ${n*a}? y takes the same number of steps.`),explain:ex(`${n*a} ÷ ${a} = ${n} steps`,`${n} × ${b} = <b>${n*b}</b>`)});};
const coStory=c=>{const k=c.k;
 if(k===0){const x0=R(1,5),y0=R(1,5),a=R(2,6),b=R(2,6),l=R(1,x0+a-1);const ax=Math.random()<.5;const X=x0+a-l,Y=y0+b;
  return Q({prompt:`Skyla the eagle's nest is at <b>${PT(x0,y0)}</b>. She flies <b>${a}</b> units right and <b>${b}</b> units up to a tall tree. Then she flies <b>${l}</b> ${PL(l,'unit')} left to the lake. What is the ${ax?'x':'y'}-coordinate of the lake?`,tpl:`${ax?'x':'y'} = {A}`,answer:ax?X:Y,text:`cs0 ${x0} ${y0} ${a} ${b} ${l} ${ax}`,wp:1,fast:45,
   nudge:nu('Track each move. Right and left change x; up changes y.'),explain:ex(`Tree: ${PT(x0+a,y0+b)}`,`Lake: ${PT(X,Y)}`,`The ${ax?'x':'y'}-coordinate is <b>${ax?X:Y}</b>.`)});}
 if(k===1){const x0=R(0,3),y0=R(0,3),a=R(1,3),b=R(2,4),m=R(4,8);return Q({prompt:`Gizmo's robot starts at <b>${PT(x0,y0)}</b>. Every minute it rolls <b>${a}</b> right and <b>${b}</b> up. Where is it after <b>${m}</b> minutes? Type the y-coordinate.`,tpl:`y = {A}`,answer:y0+m*b,text:`cs1 ${x0} ${y0} ${a} ${b} ${m}`,wp:1,fast:45,
  nudge:nu(`y goes up ${b} each minute, starting at ${y0}.`),explain:ex(`${m} × ${b} = ${m*b}`,`${y0} + ${m*b} = <b>${y0+m*b}</b>`,`(It is at ${PT(x0+m*a,y0+m*b)}.)`)});}
 if(k===2){const x1=R(1,3),y1=R(1,3),w=R(4,9),h=R(3,7),pr=R(2,5);const per=2*(w+h);return Q({prompt:`Nana Paws fences a garden with corners at <b>${PT(x1,y1)}</b>, <b>${PT(x1+w,y1)}</b>, <b>${PT(x1+w,y1+h)}</b> and <b>${PT(x1,y1+h)}</b>. Each unit of fence costs <b>${pr}</b> coins. How many coins does the fence cost?`,tpl:'{A} coins',answer:per*pr,text:`cs2 ${x1} ${y1} ${w} ${h} ${pr}`,wp:1,fast:55,
  nudge:nu('Find the side lengths, then the perimeter, then the cost.'),explain:ex(`Sides: ${w} and ${h}`,`Perimeter: ${w} + ${h} + ${w} + ${h} = ${per}`,`${per} × ${pr} = <b>${per*pr}</b>`)});}
 const x1=R(1,4),y=R(2,6),x2=x1+R(4,8),y2=y+R(3,7),x3=x2-R(2,x2-x1-1);const L=(x2-x1)+(y2-y)+(x2-x3);
 return Q({prompt:`Ozzy builds train track on the map. It runs from <b>${PT(x1,y)}</b> to <b>${PT(x2,y)}</b>, then to <b>${PT(x2,y2)}</b>, then to <b>${PT(x3,y2)}</b>. How many units of track is that?`,tpl:'{A} units',answer:L,text:`cs3 ${x1} ${y} ${x2} ${y2} ${x3}`,wp:1,fast:55,
  nudge:nu('Find the length of each straight piece. Then add.'),explain:ex(`${x2} − ${x1} = ${x2-x1}`,`${y2} − ${y} = ${y2-y}`,`${x2} − ${x3} = ${x2-x3}`,`${x2-x1} + ${y2-y} + ${x2-x3} = <b>${L}</b>`)});};
const gGcfLcm=c=>(Math.random()<.5?gGCF:gLCM)(c);

/* ---------- grade 5 multiplication: building rounds, no single-digit facts ---------- */
const m5pow2=c=>{const k=R(0,2);
 if(k===0){const e=R(3,6);return Q({tpl:`${pw(e)} = {A}`,answer:Math.pow(10,e),text:`pw ${e}`,fast:12,nudge:nu(`${pw(e)} means ${e} tens multiplied together.`),explain:ex(`${Array(e).fill(10).join(' × ')} = <b>${N(Math.pow(10,e))}</b>`,`A 1 with ${e} zeros.`)});}
 if(k===1){const a=R(12,99),e=R(2,4);return Q({tpl:`${a} × ${pw(e)} = {A}`,answer:a*Math.pow(10,e),text:`pw2 ${a} ${e}`,fast:12,nudge:nu(`${pw(e)} is a 1 with ${e} zeros.`),explain:ex(`${pw(e)} = ${N(Math.pow(10,e))}`,`${a} × ${N(Math.pow(10,e))} = <b>${N(a*Math.pow(10,e))}</b>`)});}
 const a=R(12,99),m=PK([100,1000]),b=R(12,40);return Q({tpl:`${N(a*b)} × ${N(m)} = {A}`,answer:a*b*m,text:`pw3 ${a*b} ${m}`,fast:12,nudge:nu('Each × 10 shifts the digits one place to the left.'),explain:ex(`Add ${String(m).length-1} zeros: <b>${N(a*b*m)}</b>`)});};
const m5fourTwo=c=>{const a=PK([1005,1010,1020,1050,1200,1250,1500,2005,2010,2050,2100,2500,3005,3100,3200,4010]),b=R(11,25);return mplain(()=>a,()=>b,35)(c);};
const m5areaSum=c=>{let a,b;do{a=R(12,49);b=R(12,29);}while(a%10<2||b%10<2);const at=a-a%10,au=a%10,bt=b-b%10,bu=b%10;const p=[at*bt,at*bu,au*bt,au*bu];
 return Q({prompt:`Area model for ${a} × ${b}: the four parts are ${at} × ${bt} = ${p[0]}, ${at} × ${bu} = ${p[1]}, ${au} × ${bt} = ${p[2]} and ${au} × ${bu} = ${p[3]}. Add the parts.`,tpl:`${a} × ${b} = {A}`,answer:a*b,text:`as ${a} ${b}`,fast:25,
  nudge:nu('Add the four parts together.'),explain:ex(`${p.join(' + ')} = <b>${N(a*b)}</b>`)});};
const checkDiv=(gd,gq)=>c=>{const d=gd(),q=gq(),t=d*q;
 return Q(choice({prompt:`Gizmo works out <b>${N(t)} ÷ ${d} = ${N(q)}</b>. Which one can he use to check his answer?`,tpl:'{A}',text:`chk ${t} ${d}`,fast:20,
  nudge:nu('Division and multiplication undo each other.'),explain:ex(`If ${N(t)} ÷ ${d} = ${N(q)}, then ${N(q)} × ${d} should give ${N(t)}.`,`<b>${N(q)} × ${d}</b> = ${N(t)}`)},`${N(q)} × ${d}`,[`${N(t)} × ${d}`,`${N(q)} + ${d}`,`${N(t)} − ${d}`]));};
const m5friendly=c=>{const k=R(0,2);let a,b;
 if(k===0){a=PK([125,250]);b=4*R(3,9);}else if(k===1){a=R(11,49)*10;b=R(2,9)*10;}else{a=R(1,4)*100+PK([1,2]);b=R(12,40);}
 const ex2=k===0?ex(`${a} × 4 = ${a*4}`,`${b} = 4 × ${b/4}, so ${a} × ${b} = ${a*4} × ${b/4} = <b>${N(a*b)}</b>`):k===1?ex(`${a/10} × ${b/10} = ${a*b/100}`,`Add two zeros: <b>${N(a*b)}</b>`):ex(`${a} = ${a-a%100} + ${a%100}`,`${a-a%100} × ${b} = ${N((a-a%100)*b)}, ${a%100} × ${b} = ${(a%100)*b}`,`${N((a-a%100)*b)} + ${(a%100)*b} = <b>${N(a*b)}</b>`);
 return Q({tpl:`${N(a)} × ${b} = {A}`,answer:a*b,text:`mfr ${a} ${b}`,fast:25,nudge:nu(k===0?`${a} × 4 is a round number. Use it.`:k===1?'Multiply the front digits, then add the zeros.':`Break ${a} into hundreds and ones.`),explain:ex2});};
const m5decWhole2=c=>{for(;;){const v=R(12,95),w=R(11,25);if(v%10===0||(v*w)%10===0)continue;return Q({tpl:`${dec(v,1)} × ${w} = {A}`,answer:v*w,dp:1,text:`dw2 ${v} ${w}`,fast:25,
 nudge:nu(`Multiply ${v} × ${w}, then put back the one decimal place.`),explain:ex(`${v} × ${w} = ${v*w}`,`${v} tenths × ${w} = ${v*w} tenths = <b>${dec(v*w,1)}</b>`)});}};
const m5decDec2=c=>{for(;;){const a=R(11,49),b=R(2,9);if(a%10===0)continue;const t=a*b;if(t%10===0)continue;
 return Q({tpl:`${dec(a,1)} × ${dec(b,1)} = {A}`,answer:t,dp:2,text:`dd2 ${a} ${b}`,fast:20,nudge:nu(`Multiply ${a} × ${b}, then count the decimal places: 1 + 1 = 2.`),
  explain:ex(`${a} × ${b} = ${t}`,`Tenths × tenths = hundredths: <b>${dec(t,2)}</b>`)});}};
/* new Legend kind for m5multi (k 5) */
const m5milesDec=c=>{for(;;){const m=R(12,35),d=R(11,21),x=R(11,49);if(m%10===0||x%10===0||(m*d+x)%10===0)continue;const t=m*d+x;
 return Q({prompt:`Coach Flex runs <b>${dec(m,1)}</b> miles every day for <b>${d}</b> days. On the last day he runs an extra <b>${dec(x,1)}</b> miles. How many miles does he run in all?`,tpl:'{A} miles',answer:t,dp:1,text:`m5m5 ${m} ${d} ${x}`,wp:1,fast:55,
  nudge:nu('Multiply for the daily runs, then add the extra.'),explain:ex(`${dec(m,1)} × ${d} = ${dec(m*d,1)}`,`${dec(m*d,1)} + ${dec(x,1)} = <b>${dec(t,1)}</b>`)});}};
/* new grade 4 division pieces */
const dRem4=c=>{for(;;){const d=R(3,9),q=R(Math.ceil(1000/d),Math.floor(9000/d)),r=R(1,d-1);if(q%10===0)continue;return dRem(()=>d,()=>q)(c);}};
const dPlain4=c=>{for(;;){const d=R(3,9),q=R(Math.ceil(1000/d),Math.floor(9999/d));if(q%10===0||q%100<11)continue;return dPlain(()=>d,()=>q,35)(c);}};
const dStory4=c=>{for(;;){const d=R(3,9),q=R(Math.ceil(1000/d),Math.floor(9999/d));if(q%10===0)continue;return dStory(()=>d,()=>q)(c);}};
/* ---------- round 3 additions ---------- */
/* "which statement is true?" from a right statement and wrong ones */
const truest=(o,right,wrongs)=>Q(choice(o,right,wrongs));
const tfMul3=(ga,gb)=>c=>{const a=ga(),b=gb(),p=a*b;const sl=SH([a,-a,b,-b,10,-10,p>300?100:20]).filter(z=>p+z>0).slice(0,3);
 return truest({prompt:`Gizmo's calculator is broken, so he writes three wrong answers and one right one. Which one is true?`,tpl:'{A}',text:`tfm3 ${a} ${b}`,mem:['why'],fast:25,
  nudge:nu(`Work out ${M(a,b)} yourself.`),explain:ex(`<b>${M(a,b)} = ${N(p)}</b>`,'The others are off by a group or a place.')},`${M(a,b)} = ${N(p)}`,sl.map(z=>`${M(a,b)} = ${N(p+z)}`));};
const tfDiv3=(Ds,Qs)=>c=>{const d=PK(Ds),q=PK(Qs),t=d*q;const w=SH([1,-1,2,-2].filter(z=>q+z>0)).slice(0,3);
 return truest({prompt:`The Grey Goblin scribbled on the castle wall. Only one is true. Which one?`,tpl:'{A}',text:`tfd3 ${t} ${d}`,mem:['why'],fast:20,
  nudge:nu('Check each one with multiplication.'),explain:ex(`${d} × ${q} = ${t}`,`So <b>${t} ÷ ${d} = ${q}</b>`)},`${t} ÷ ${d} = ${q}`,w.map(z=>`${t} ÷ ${d} = ${q+z}`));};
const ROT={};const rot=(key,ks)=>{let b=ROT[key];if(!b||!b.length)b=ROT[key]=SH(ks.slice());return b.shift();};
const REASONS_R=['He is right!','The remainder is too big, so one more group fits.','The remainder is wrong. Check divisor × quotient + remainder.','He should have multiplied instead.'];
const remWhy=(qmin,qmax)=>c=>{const d=R(3,9),q=R(qmin,qmax),r=R(1,d-1),t=d*q+r;const k=rot('rw',[0,1,2]);let sq=q,sr=r;if(k===1){sq=q-1;sr=r+d;}else if(k===2){sr=r===d-1?r-1:r+1;}
 return Q(choice({prompt:`Gizmo says <b>${N(t)} ÷ ${d} = ${N(sq)} R ${sr}</b>. Is he right? Choose the reason.`,tpl:'{A}',mem:['why'],text:`rw ${t} ${d} ${k}`,fast:30,
  nudge:nu('Is the remainder smaller than the divisor? Does divisor × quotient + remainder give the number?'),
  explain:k===0?ex(`${d} × ${N(q)} + ${r} = ${N(t)}`,'<b>He is right!</b>'):k===1?ex(`R ${sr} is not smaller than ${d}.`,`It should be ${N(q)} R ${r}: <b>the remainder is too big</b>.`):ex(`${d} × ${N(q)} + ${sr} = ${N(d*q+sr)}, not ${N(t)}.`,`It should be ${N(q)} R ${r}: <b>the remainder is wrong</b>.`)},REASONS_R[k],REASONS_R.filter((_,i)=>i!==k)));};
const REASONS_D=['He is right!','He put the decimal point in the wrong place.','He multiplied the wrong digits.','He added instead of multiplying.'];
const decWhy=c=>{for(;;){const a=R(2,9),b=R(2,9);const t=a*b;if(t%10===0)continue;const k=rot('dw',[0,1,3]);const shown=k===0?dec(t,2):k===1?dec(t,1):dec(a+b,1);
 return Q(choice({prompt:`Gizmo says <b>${dec(a,1)} × ${dec(b,1)} = ${shown}</b>. Is he right? Choose the reason.`,tpl:'{A}',mem:['why'],text:`dw ${a} ${b} ${k}`,fast:25,
  nudge:nu('Tenths × tenths makes hundredths. Count the decimal places.'),explain:ex(`${a} × ${b} = ${t}, and tenths × tenths = hundredths: ${dec(t,2)}`,`<b>${REASONS_D[k]}</b>`)},REASONS_D[k],REASONS_D.filter((_,i)=>i!==k)));}};
const REASONS_O=['He is right!','He added before multiplying.','He multiplied all three numbers.','He subtracted instead of adding.'];
const ooWhy=c=>{const a=R(2,9),b=R(2,9),d=R(2,9);const right=a+b*d;const k=rot('ow',[0,1,2]);const shown=k===0?right:k===1?(a+b)*d:a*b*d;if(shown===right&&k){ROT.ow=(ROT.ow||[]);ROT.ow.unshift(k);return ooWhy(c);}
 return Q(choice({prompt:`Gizmo says <b>${a} + ${b} × ${d} = ${shown}</b>. Is he right? Choose the reason.`,tpl:'{A}',mem:['why'],text:`ow ${a} ${b} ${d} ${k}`,fast:25,
  nudge:nu('Which comes first, × or +?'),explain:ex(`Multiply first: ${b} × ${d} = ${b*d}`,`${a} + ${b*d} = ${right}`,`<b>${REASONS_O[k]}</b>`)},REASONS_O[k],REASONS_O.filter((_,i)=>i!==k)));};
const primeTrue=c=>{const n=PK([21,27,33,39,49,51,57,63,69,77,87,91,29,31,37,41,43,47,53,59,61,67,71,73]);const pr=isPrime(n);let f=2;while(n%f&&f<n)f++;
 const right=pr?`${n} is prime.`:`${n} = ${f} × ${n/f}, so it is composite.`;
 const wr=pr?[`${n} = 3 × ${Math.floor(n/3)}, so it is composite.`,`${n} is even.`,`${n} = 7 × ${Math.floor(n/7)}, so it is composite.`]:[`${n} is prime.`,`${n} is even.`,`${n} = ${f} × ${n/f+1}, so it is composite.`];
 return truest({prompt:`Gizmo, Ozzy, Coach Flex and Dr. Quartz each say something about <b>${n}</b>. Which statement is true?`,tpl:'{A}',text:`pt ${n}`,fast:30,
  nudge:nu(`Try dividing ${n} by 3, 7 and other small numbers.`),explain:pr?ex(`Only 1 × ${n} makes ${n}.`,`<b>${right}</b>`):ex(`<b>${right}</b>`)},right,wr);};
const decDiv=c=>{const b=R(2,9),q=R(3,12);const t=b*q;if(t%10===0)return decDiv(c);
 return Q({tpl:`${dec(t,1)} ÷ ${dec(b,1)} = {A}`,answer:q,text:`ddv ${t} ${b}`,fast:20,nudge:nu(`Multiply both numbers by 10 first: ${t} ÷ ${b}.`),
  explain:ex(`${dec(t,1)} ÷ ${dec(b,1)} is the same as ${t} ÷ ${b}`,`${t} ÷ ${b} = <b>${q}</b>`)});};
const decDivStory=c=>{const k=R(0,2);const b=R(2,9),q=R(4,12);const t=b*q;if(t%10===0)return decDivStory(c);
 const s=k===0?[`Ms. Rosa has <b>${dec(t,1)}</b> kg of flour. Each bag holds <b>${dec(b,1)}</b> kg. She fills the bags and gives <b>2</b> bags to Nana Paws.`,'How many bags does she keep?','bags',q-2]:
  k===1?[`Skyla the eagle flies <b>${dec(t,1)}</b> miles, resting every <b>${dec(b,1)}</b> miles. Then she flies <b>3</b> more parts of the same length.`,'How many parts does she fly in all?','parts',q+3]:
  [`Dr. Quartz pours <b>${dec(t,1)}</b> liters of crystal juice into jars of <b>${dec(b,1)}</b> liters. He breaks <b>1</b> jar.`,'How many full jars are left?','jars',q-1];
 return Q({prompt:`${s[0]} ${s[1]}`,tpl:`{A} ${s[2]}`,answer:s[3],text:`dds ${k} ${t} ${b}`,wp:1,fast:45,nudge:nu(`First find ${dec(t,1)} ÷ ${dec(b,1)}. Multiply both by 10.`),
  explain:ex(`${dec(t,1)} ÷ ${dec(b,1)} = ${t} ÷ ${b} = ${q}`,k===1?`${q} + 3 = <b>${q+3}</b>`:`${q} − ${k===0?2:1} = <b>${s[3]}</b>`)});};
const gSubPat=c=>{const s=R(3,9),st=R(5,9)*s+R(0,9);const seq=[0,1,2,3,4].map(i=>st-i*s);const pos=R(2,4);
 return Q({prompt:'Find the pattern. It goes down.',tpl:seq.map((v,i)=>i===pos?'{A}':v).join(', '),answer:seq[pos],text:`gsp ${st} ${s} ${pos}`,fast:15,
  nudge:nu('How much smaller is each number?'),explain:ex(`The rule is subtract ${s}.`,seq.map((v,i)=>i===pos?`<b>${v}</b>`:v).join(', '))});};
const coCorner=c=>{const x1=R(1,5),y1=R(1,5),w=R(2,7),h=R(2,6);const P=[[x1,y1],[x1+w,y1],[x1+w,y1+h],[x1,y1+h]];const miss=R(0,3);const ax=Math.random()<.5?0:1;
 const shown=P.filter((_,i)=>i!==miss).map(p=>`<b>${PT(p[0],p[1])}</b>`).join(', ');
 return Q({prompt:`Three corners of a rectangle on the reef map are ${shown}. Where is the fourth corner? Type its ${ax?'y':'x'}-coordinate.`,tpl:`${ax?'y':'x'} = {A}`,answer:P[miss][ax],text:`ccr ${x1} ${y1} ${w} ${h} ${miss} ${ax}`,fast:35,
  nudge:nu('A rectangle has two corners with each x and two corners with each y.'),explain:ex(`The fourth corner is ${PT(P[miss][0],P[miss][1])}.`,`Its ${ax?'y':'x'}-coordinate is <b>${P[miss][ax]}</b>.`)});};
/* grade 2 multiplication Legend: 2-step equal groups */
const m2L=c=>{const k=c.k;
 const S=[
  ()=>{const r=R(3,5),k2=R(3,5),u=R(2,r*k2-3);return [`The Kind Teacher sets out <b>${r}</b> rows of <b>${k2}</b> chairs. <b>${u}</b> kids sit down.`,'How many chairs are still empty?','chairs',r*k2-u,[`${rep(k2,r)} = ${r*k2}`,`${r*k2} − ${u} = `]];},
  ()=>{const g=R(2,4),n=PK([5,6]),m=R(2,9);return [`Ms. Rosa has <b>${g}</b> egg boxes with <b>${n}</b> eggs each. She also has <b>${m}</b> loose eggs.`,'How many eggs does she have?','eggs',g*n+m,[`${rep(n,g)} = ${g*n}`,`${g*n} + ${m} = `]];},
  ()=>{const g=R(3,5),n=R(3,5),e=R(2,n+2);return [`Ms. Rosa makes <b>${g}</b> plates with <b>${n}</b> cookies on each. ${cap(c.pet)} eats <b>${e}</b> cookies.`,'How many cookies are left?','cookies',g*n-e,[`${rep(n,g)} = ${g*n}`,`${g*n} − ${e} = `]];},
  ()=>{const a=R(2,4),b=R(2,3),n=PK([4,5]),m=PK([2,3]);return [`Gizmo has <b>${a}</b> boxes with <b>${n}</b> batteries each and <b>${b}</b> boxes with <b>${m}</b> batteries each.`,'How many batteries does he have?','batteries',a*n+b*m,[`${rep(n,a)} = ${a*n}`,`${rep(m,b)} = ${b*m}`,`${a*n} + ${b*m} = `]];},
  ()=>{const g=R(3,5),n=PK([2,5,10]),l=R(2,n===2?3:6);return [`Skyla the eagle finds <b>${n}</b> feathers every day for <b>${g}</b> days. The wind blows away <b>${l}</b> of them.`,'How many feathers does she have now?','feathers',g*n-l,[`${rep(n,g)} = ${g*n}`,`${g*n} − ${l} = `]];},
  ()=>{const g=R(2,4),n=R(3,5),e=R(2,7);return [`Ozzy's train has <b>${g}</b> cars with <b>${n}</b> kids in each car. At the next stop, <b>${e}</b> more kids get on.`,'How many kids are on the train now?','kids',g*n+e,[`${rep(n,g)} = ${g*n}`,`${g*n} + ${e} = `]];},
  ()=>{const g=R(3,5),n=R(3,5),e=R(2,6);return [`The Elder Wiz has <b>${g}</b> drawers with <b>${n}</b> lonely socks in each. The Grey Goblin steals <b>${e}</b> socks.`,'How many socks are left?','socks',g*n-e,[`${rep(n,g)} = ${g*n}`,`${g*n} − ${e} = `]];},
  ()=>{const d=R(2,5),kk=R(1,4);return [`${c.name} has <b>${d}</b> dimes and <b>${kk}</b> ${PL(kk,'nickel')}.`,'How many cents is that?','¢',10*d+5*kk,[`Dimes: ${sk(10,d).join(', ')}`,`Nickels: keep going ${sk(5,kk,10*d).join(', ')}`,'']];},
  ()=>{let a,b;do{a=[R(3,5),R(3,5)];b=[R(2,4),R(2,4)];}while(a[0]*a[1]<=b[0]*b[1]);return [`Nana Paws plants <b>${a[0]}</b> rows of <b>${a[1]}</b> flowers. Dr. Quartz plants <b>${b[0]}</b> rows of <b>${b[1]}</b> flowers.`,'How many more flowers does Nana Paws plant?','more flowers',a[0]*a[1]-b[0]*b[1],[`Nana Paws: ${rep(a[1],a[0])} = ${a[0]*a[1]}`,`Dr. Quartz: ${rep(b[1],b[0])} = ${b[0]*b[1]}`,`${a[0]*a[1]} − ${b[0]*b[1]} = `]];}];
 const [s,q,u,v,w]=S[k]();const last=w.length-1;w[last]=w[last]+`<b>${v}${u==='¢'?'¢':''}</b>`;
 return Q({prompt:`${s} ${q}`,tpl:u==='¢'?'{A}¢':`{A} ${u}`,answer:v,text:`m2L ${k} ${s}`,wp:1,fast:35,nudge:nu('Find the equal groups first. Then add or take away.'),explain:ex(...w)});};
/* ---------- round 4: per-round recent memory (no same numbers, same setting or same template close together) ---------- */
const MEM={};const NAMES=['Dr. Quartz','Ms. Rosa','Coach Flex','Elder Wiz','Grumbleroot','Skyla','Gizmo','Nana Paws','Grey Goblin','Ozzy','Kind Teacher'];
const plain=t=>String(t||'').replace(/<[^>]+>/g,' ');
const sig=q=>{const t=plain(q.prompt)+' '+plain(q.tpl)+(q.pick?' '+plain(q.pick[q.answer]):'');const nums=(t.match(/\d[\d,.]*/g)||[]).map(x=>x.replace(/,/g,''));const keys=(q.mem||[]).slice();if(q.prompt&&q.text){const w=String(q.text).split(' ');keys.push('tx:'+w[0]+(w[0]==='m2L'?w[1]:''));}
 (t.match(/\d+\s*[×÷]\s*\d+/g)||[]).forEach(f=>{const m=f.match(/(\d+)\s*([×÷])\s*(\d+)/);const a=+m[1],b=+m[3];keys.push('fx:'+(m[2]==='×'?[Math.min(a,b),Math.max(a,b)].join('x'):a+'/'+b));if(m[2]==='÷'&&a%b===0)keys.push('fx:'+[Math.min(b,a/b),Math.max(b,a/b)].join('x'));});
 if(q.wp){NAMES.forEach(n=>{if(t.includes(n))keys.push('who:'+n);});const u=plain(q.tpl).match(/\{A\}\s*([a-z-]+)/);if(u)keys.push('u:'+u[1].replace(/^more$/,''));}
 return {n:[...new Set(nums)].sort().join(' '),t:q.prompt?plain(q.prompt).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,'').replace(/\d[\d,.]*/g,'#').replace(/\s+/g,' ').trim():'',k:keys,wp:!!q.wp};};
const clash=(a,list)=>list.some((b,i)=>a.n===b.n||(a.t&&a.t===b.t)||a.k.some(k=>b.k.includes(k)&&(k.startsWith('who:')||k.startsWith('u:')?i>=list.length-3:true)));
const USE={};
const DEF=(op,g,rounds)=>PLAN.def(op,g,rounds.map((list,r)=>list.map((mk,i)=>c=>{const key=op+g+r;const mem=MEM[key]=MEM[key]||[];const use=USE[key]=USE[key]||{n:0,at:list.map(()=>-99)};let q,sg,used=i;
 /* the core may call again with the same c when it rejects a draw: forget the rejected one */
 if(use.lastC===c&&use.pushed){mem.pop();use.at[use.lastJ]=use.prevAt;}
 const order=[i,i,i,...list.map((_,j)=>j).filter(j=>j!==i).sort((x,y)=>use.at[x]-use.at[y]||Math.random()-.5)];
 let ok=false;for(let t=0;t<order.length+3;t++){const j=order[Math.min(t,order.length-1)];q=list[j](c);if(!q)continue;sg=sig(q);used=j;if(!clash(sg,mem.slice(-7))){ok=true;break;}}
 if(!ok&&list.length>1){const j=order[3];const x=list[j](c);if(x){q=x;sg=sig(x);used=j;}}
 use.lastC=c;use.pushed=false;if(q&&q.tk==null&&q.text){const w=String(q.text).split(' ');q.tk=['eqm','eqs','eqg','mfs','wm','wd'].includes(w[0])?'eq:'+w[1]:'md:'+w[0]+(w[0]==='m2L'?w[1]:'');}
 if(q){mem.push(sg);if(mem.length>8)mem.shift();use.lastJ=used;use.prevAt=use.at[used];use.at[used]=++use.n;use.pushed=true;}return q;})));
/* ================= the year plans (round 2) ================= */
const F0to10=[0,1,2,3,4,5,6,7,8,9,10],F2to10=[2,3,4,5,6,7,8,9,10],Q2_10=[2,3,4,5,6,7,8,9,10];
const r19=()=>R(2,9);
DEF('mul',2,[
 [skipSeq([2,5,10]),m2hands,m2coins,m2socks,m2bundles,m2wheels,m2groupsAdd(3,4),gPairs],
 [m2groupsAdd(4,5),m2groupsWords,eqMul(()=>[R(2,4),R(3,5)],1),skipSeq([2,5,10],{mid:1}),m2arrayRows(4,4),m2coins,m2wheels,gRepWords],
 [m2arrayRows(5,5,3),m2arrayCols,m2arrStory(5,5,3),eqMul(()=>[R(3,5),R(3,5)],1),skipSeq([5,10,100],{off:1,mid:1}),m2arrayTotal,K(m2L,1),gArrBig2],
 [skipSeq([5,10,100],{off:1,mid:1,back:1}),m2arrayTotal,eqMul(()=>[R(3,5),PK([4,5,10])],1),K(m2L,5),m2arrStory(5,5,3),K(m2L,0),K(m2L,3),K(m2L,6)],
 [K(m2L,0),K(m2L,1),K(m2L,2),K(m2L,3),K(m2L,4),K(m2L,5),K(m2L,6),K(m2L,7),K(m2L,8)]
]);
DEF('mul',3,[
 [fact([2,5,10],F0to10),m3groupsVis([2,5,10]),eqMul(()=>[R(2,9),PK([2,5,10])]),fact([0,1],F2to10),m3turn,mfact([2,5,10],[2,3,4,5,6,7,8,9,10]),tfMul3(()=>PK([2,5,10]),()=>R(3,9)),m3arrayVis([2,5])],
 [fact([3,4,6],F2to10),m3arrayVis([3,4,6]),m3double,eqMul(()=>swap(PK([3,4,6]),R(3,9)),0,EQA),m3turn,m3groupsVis([3,4,6]),mfact([3,4,6],[3,4,5,6,7,8,9]),tfMul3(()=>PK([3,4,6]),()=>R(4,9))],
 [fact([7,8,9],F2to10),m3break,m3nine,eqMul(()=>swap(PK([7,8,9]),R(3,9)),0,EQB),fact([3,4,6],[6,7,8,9]),tfMul3(()=>R(3,9),()=>R(6,9)),mfact([7,8,9],[3,4,5,6,7,8,9]),whichMul],
 [m3tens([2,3,4,5,6,7,8,9],[2,3,4,5,6,7,8,9]),mfact([3,4,6,7,8,9],[3,4,5,6,7,8,9]),fact([6,7,8,9],[6,7,8,9]),m3three,m3mfStory,m3tenStory,balance(9),whichMul],
 [K(m3two,0),K(m3two,1),K(m3two,2),K(m3two,3),K(m3two,4),K(m3two,5),K(m3two,6),K(m3two,7)]
]);
DEF('mul',4,[
 [fact([6,7,8,9],[6,7,8,9]),m4hund,m4missTen,bigStory(()=>R(2,9)*PK([10,100]),()=>R(3,9)),mfact([6,7,8,9],[6,7,8,9]),m3three,m4tt,balance(9)],
 [mplain(()=>R(2,9)*10+PK([0,1,2,5]),()=>R(3,9)),m4partial,bigStory(()=>R(12,98),()=>R(3,9)),m4tt,m4times(25,6,0,14,4,[0,1]),whichTimes,tfMul3(()=>R(12,49),()=>R(3,9)),m4missTen],
 [mplain(()=>R(102,499),()=>R(3,9)),mplain(g4fr4,()=>R(3,6)),bigStory(()=>R(110,450),()=>R(3,9)),mplain(()=>R(512,989),()=>R(6,9)),m4times(30,8,0,16,3,[2,3,4]),estMul([20,30,40,50,60,70,80],[20,30,40,50]),tfMul3(()=>R(102,499),()=>R(3,9)),balance(12)],
 [mplain(()=>PK([11,12,15,21,25]),()=>R(11,32),30),m4area,mplain(g4fr4,()=>R(3,6)),bigStory(()=>R(12,40),()=>R(11,25)),m4times(60,9,1,24,6),tfMul3(()=>PK([R(23,29),R(31,39),R(41,49)]),()=>PK([R(13,19),R(21,29)])),balance(12),estMul([20,30,40,50,60,70,80],[20,30,40,50])],
 [K(m4multi,0),K(m4multi,1),K(m4multi,2),K(m4multi,3),K(m4multi,4),K(m4multi,5),K(m4multi,6),K(m4multi,7)]
]);
DEF('mul',5,[
 [mplain(()=>R(12,49),()=>PK([11,12,15,20,21,22,25,30,31,35,40])),bigStory(()=>R(12,45),()=>PK([12,15,20,21,25,30])),m5areaSum,mplain(()=>R(21,89),()=>PK([11,12,15,21,25,31,41]),30),estMul([20,30,40,50,60,70,80,90],[20,30,40,50]),tfMul3(()=>R(21,49),()=>PK([11,12,15,21,25])),balance(12),K(m4multi,6)],
 [m5friendly,K(m4multi,4),bigStory(()=>PK([120,150,200,250,300]),()=>PK([12,20,24,30,40])),estMul([200,300,400,500],[20,30,40]),m5pow2,m5decPow,m5areaSum,tfMul3(()=>PK([125,250]),()=>PK([12,16,20,24]))],
 [m5fourTwo,bigStory(()=>PK([1050,1200,1250,1500,2500,3200]),()=>R(12,20)),m5decWhole(99,9),m5decWhole2,mplain(()=>R(120,480),()=>R(21,48),35),tfMul3(()=>R(102,399),()=>R(12,29)),estMul([1000,2000,3000],[20,30,40]),m5money],
 [m5decWhole2,m5decDec2,m5decDec,ooNo,ooPar,m5money,decWhy,ooWhy],
 [K(m5multi,0),K(m5multi,1),K(m5multi,2),K(m5multi,3),K(m5multi,4),K(m5multi,5),K(m5ooStory,0),K(m5ooStory,1),K(m5ooStory,2)]
]);
DEF('div',3,[
 [dfact([2,5,10],Q2_10),d3setShare([2,5,10]),eqShare(()=>[PK([2,5,10]),R(2,9)]),d3unk([2,5,10]),d3rules,d3array([2,5]),tfDiv3([2,5,10],[2,3,4,5,6,7,8,9,10]),eqGroups(()=>[R(2,9),PK([2,5,10])])],
 [dfact([3,4,6],Q2_10),d3array([3,4,6]),eqGroups(()=>[R(2,9),PK([3,4,6])],EQA),eqShare(()=>[PK([3,4,6]),R(2,9)],EQA),d3unk([3,4,6]),tfDiv3([3,4,6],[3,4,5,6,7,8,9]),d3setShare([3,4]),d3cmp],
 [dfact([7,8,9],Q2_10),d3unk([7,8,9]),eqShare(()=>[PK([7,8,9]),R(3,9)],EQB),eqGroups(()=>[R(3,9),PK([7,8,9])],EQB),dfact([3,4,6],[6,7,8,9]),tfDiv3([6,7,8,9],[4,5,6,7,8,9]),d3array([7,8,9]),d3family],
 [d3missDiv,d3family,dfact([6,7,8,9],[6,7,8,9]),d3cmp,eqGroups(()=>[R(5,9),R(6,9)]),divBalance,whichDiv,tfDiv3([6,7,8,9],[6,7,8,9])],
 [K(d3two,0),K(d3two,1),K(d3two,2),K(d3two,3),K(d3two,4),K(d3two,5),K(d3two,6),K(d3two,7)]
]);
DEF('div',4,[
 [dfact([6,7,8,9],[6,7,8,9]),dTens([10]),dTens([100]),dStory(()=>R(3,9),()=>R(2,9)*10),d3missDiv,d3family,tfDiv3([6,7,8,9],[6,7,8,9]),d3cmp],
 [dRem(()=>R(3,9),()=>R(3,12)),dPlain(()=>R(2,6),()=>R(12,32)),dLeft,dStory(()=>R(2,6),()=>R(12,30)),dRemStory(()=>R(3,9),()=>R(3,9),'left'),remWhy(3,12),whichDiv,divBalance],
 [dPlain(()=>R(3,9),()=>PK([R(34,49),R(51,69),R(71,99)])),dRem(()=>R(4,9),()=>R(25,99)),dStory(()=>R(3,9),()=>R(34,99)),dPlain(()=>R(3,9),()=>PK([R(112,149),R(151,199),R(201,299)])),dLeft,remWhy(12,40),dRemStory(()=>R(3,9),()=>R(12,40),'up'),c=>{const d=R(3,9),q=R(21,99);return Q({tpl:`{A} ÷ ${d} = ${q}`,answer:d*q,text:`mdv ${d} ${q}`,fast:20,nudge:nu(`Undo the division: multiply ${q} × ${d}.`),explain:ex(`${q} × ${d} = <b>${d*q}</b>`)});}],
 [dPlain4,dRem4,dStory4,c=>{const d=R(3,9),q=R(101,999);return Q({tpl:`{A} ÷ ${d} = ${q}`,answer:d*q,text:`mdv ${d} ${q}`,fast:25,nudge:nu(`Undo the division: multiply ${q} × ${d}.`),explain:ex(`${q} × ${d} = <b>${N(d*q)}</b>`)});},remWhy(120,999),dRemStory(()=>R(4,9),()=>R(120,999)),divBalance,checkDiv(()=>R(3,9),()=>R(112,999))],
 [K(d4multi,0),K(d4multi,1),K(d4multi,2),K(d4multi,3),K(d4multi,4),K(d4multi,5),K(d4multi,6),K(d4multi,7)]
]);
DEF('div',5,[
 [tenDiv,dPlain(()=>PK([11,12,15,25]),()=>R(6,15),20),dStory(()=>PK([12,15,25,30]),()=>PK([6,7,8,9,11,12,13,14,15,16])),c=>{const d=PK([11,12,15,20,25]),q=R(6,15);return Q({tpl:`${d} × {A} = ${d*q}`,answer:q,text:`d5mf ${d} ${q}`,fast:15,nudge:nu(`How many ${d}s make ${d*q}?`),explain:ex(`${d} × <b>${q}</b> = ${d*q}`)});},tfDiv3([11,12,15,20,25],[4,5,6,7,8,9,11,12]),dRem(()=>PK([11,12,15,20]),()=>R(4,12)),estDiv,divBalance],
 [dPlain(()=>PK([11,12,15]),()=>R(12,25),30),dStory(()=>PK([20,25,50]),()=>R(6,19)),dRem(()=>PK([20,30,40,50]),()=>R(6,19)),tenDiv,estDiv,dPlain(()=>PK([30,40,50,60]),()=>R(12,29)),tfDiv3([20,25,30,40,50],[12,13,14,15,16,17,18,19]),checkDiv(()=>PK([20,25,30,40,50]),()=>R(12,29))],
 [c=>{let d,q;do{d=PK([12,15,20,24,25,30,40,50]);q=R(25,99);}while(d*q<1000);return dPlain(()=>d,()=>q,35)(c);},dStory(()=>PK([12,15,20,24,25]),()=>R(45,99)),dRem(()=>R(12,25),()=>R(20,45)),dPlain(()=>R(11,25),()=>R(12,39),30),estDiv,remWhy(100,999),checkDiv(()=>R(12,29),()=>R(31,99)),divBalance],
 [d5dec,d5pow,d5money,c=>{let d,q;do{d=R(13,32);q=R(30,99);}while(d*q<1000);return dPlain(()=>d,()=>q,40)(c);},decDiv,remWhy(100,999),K(d5frac,0),estDiv],
 [decDivStory,d5frac,K(d5fracStory,0),K(d5fracStory,1),K(d5fracStory,2),K(d5multi,0),K(d5multi,1),K(d5two,0),K(d5two,1)]
]);
DEF('grp',2,[
 [gArrTotal(4,5),gPairs,gGroupsTot,gRowSkip,gStar,gShell10,gArrRows2(2),gRepAdd2(2)],
 [gRepAdd2(2),gRepWords,gArrRows2(2),gRowSkip,gArrTotal(5,5),gGroupsTot,gShell10,gArrCols2],
 [gEvenOdd(20,0),gArrRows2(3),gHalves,g2arrStory,gRepAdd2(3),gArrCols2,gArrBig2,gRepWordsF(3)],
 [skipSeq([10],{off:2,mid:1,back:1}),gEvenOdd(20,1),gArrBig2,gArrCols2,g2arrStory,K(g2L,2),K(g2L,6),K(g2L,1)],
 [K(g2L,0),K(g2L,1),K(g2L,2),K(g2L,3),K(g2L,4),K(g2L,5),K(g2L,6),K(g2L,7)]
]);
DEF('grp',3,[
 [gArrMul3,gArrPick3,gTurn3,gArea3(5,6),gArrMiss,gEvenArr3,gAddPat(0),gArrDiv3],
 [gArea3(6,9),gAreaRect3,gBreak3,gArrMul3,gArrDiv3,gWhichArr3,gTwoRect3,gEvenArr3],
 [gBreakBack3,gTwoRect3,gEvenArr3,gBreak3,gArrDiv3,gWhichArr3,gLShape3,gAreaRect3],
 [gAddPat(1),gSubPat,gTablePat3,gEvenProd,gLShape3,c=>g4story('p')(c),gWhichArr3,gNines],
 [K(g3L,0),K(g3L,1),K(g3L,2),K(g3L,3),K(g3L,4),K(g3L,5),K(g3L,6),K(g3L,7)]
]);
DEF('grp',4,[
 [gFactPair(60),gNextMul,gNth,gIsFactor,g4story('b'),tfFactor,gPrime,gRuleNth],
 [gPrime,gFactPair(100),gNextMul,gNextPrime,g4story('s'),primeTrue,gNth,gPuzMul],
 [gRuleNth,gRuleMul,gFindRule,gRuleOdd,g4story(0),primeTrue,gNextPrime,tfFactor],
 [gPuzMul,gPuzCommon,gPuzPrime,gFactPair(100,40),gRuleNth,tfFactor,gRuleOdd,gNextPrime],
 [gPuzDigits,gPuzFactor,gChairRange,g4story({k:4}),g4story({k:5}),g4story({k:6}),g4story({k:7}),g4story({k:8})]
]);
DEF('grp',5,[
 [gTwoRules,gIO(0),ordPairs(0),K(g5story,3),coPattern(0),K(g5story,5),gExprVal,gTimesLarge],
 [gExprVal,gExprPick,gTimesLarge,gIO(1),K(m5ooStory,0),ordPairs(1),coPattern(0),gWhereParen],
 [ooPar,ooNo,gWhereParen,gExprVal,ooWhy,tfExpr,gIO(1),K(g5story,6)],
 [ooNest,gIO(1),ordPairs(1),gGcfLcm,gTimesLarge,coPattern(1),gExprVal,gExprPick],
 [K(g5story,0),K(g5story,3),K(g5story,4),K(g5story,5),K(g5story,6),K(g5story,7),K(m5ooStory,1),K(m5ooStory,2)]
]);
})();
/* plan-fracmoney.js: a school year of Fraction Farm (frac) and Money Market (money), grades 2–5 */
(function(){'use strict';const {R,PK,SH,P2,N,PL,F,FA,gcd,T,D,$$,WHO,choice,old}=PLAN.H;

/* ---------- shared helpers ---------- */
const st=o=>Object.assign(o,{wp:1,fast:o.fast||25});
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const ord=n=>n+((n%100>10&&n%100<14)?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th');
const lcm=(a,b)=>a*b/gcd(a,b);
const FN={2:['half','halves'],3:['third','thirds'],4:['fourth','fourths'],5:['fifth','fifths'],6:['sixth','sixths'],8:['eighth','eighths'],10:['tenth','tenths'],12:['twelfth','twelfths'],100:['hundredth','hundredths']};
const fw=(k,n)=>`${k} ${k===1?FN[n][0]:FN[n][1]}`;      /* "2 thirds" */
const FD=b=>`<span class="fr"><span>1</span><span>{A}</span></span>`; /* box in the bottom */
const MX=(w,a,b)=>w?(a?`${w} ${F(a,b)}`:`${w}`):F(a,b); /* mixed number */
/* a fraction as a pick label: simplest form, mixed number if more than 1 */
const FL=(a,b)=>{const g=gcd(a,b);a/=g;b/=g;if(b===1)return String(a);if(a>b)return `${Math.floor(a/b)} ${F(a%b,b)}`;return F(a,b);};
function fpick(o,A,B,wr){const bad=wr.filter(w=>w[0]>0&&w[1]>0&&w[0]*B!==A*w[1]);
 [[A+1,B],[A,B+1],[A+2,B+1]].forEach(w=>{if(w[0]*B!==A*w[1])bad.push(w);});return choice(o,FL(A,B),bad.map(w=>FL(w[0],w[1])));}
const CMP=['&lt;','&gt;','='];const sgn=(x)=>x>0?'&gt;':x<0?'&lt;':'=';
const PN=c=>c.pet.replace(/^your pet ?/,'')||'Your pet'; /* pet name at the start of a sentence */
const wt=w=>w%10?D(w,1):String(w/10);
const pn=c=>c.pet.replace(/^your pet ?/,'')||'your pet'; /* pet name mid-sentence */
const YN=['Yes','No'];
/* keep a round fresh: retry a question whose answer or story opening was served in the last few questions of this round */
const MEM={};
const FID=new Map();
const FRAMES=[[/Wishing Fountain/,'fountain'],[/\bempties\b/,'empties'],[/\bfinds\b/,'finds'],[/change is all quarters/,'qchange'],[/Which one shows/,'expr'],[/every week|each week|saving for/,'save'],[/per pound/,'pound'],[/bridge/,'toll'],[/marked in|counted in/,'eqstory'],[/NOT eat/,'noteat'],[/must be shaded/,'moreshade'],[/to match/,'match'],[/How much for both/,'both']];
function frame(q){const t=String(q.prompt||'').replace(/<[^>]+>/g,' ');for(const [re,k] of FRAMES)if(re.test(t))return 'fm-'+k;return '';}
function fresh(op,g,r,mk){if(!FID.has(mk))FID.set(mk,'fm'+(FID.size+1));const id=FID.get(mk);return c=>{const key=(c.p&&c.p.id)+'|'+op+g+r;const m=MEM[key]||(MEM[key]={a:[],s:[]});let q,a,s;
 for(let i=0;i<6;i++){q=mk(c);if(!q)return q;a=q.pick?'p'+q.pick[q.answer]:q.answer+'|'+(q.dp||0);s=q.wp?String(q.prompt||'').replace(/<[^>]+>/g,' ').trim().split(/\s+/).slice(0,3).join(' '):'';
  if(!m.a.includes(a)&&(!s||!m.s.includes(s)))break;}
 q.tk=q.tk||frame(q)||id;m.a.push(a);if(m.a.length>8)m.a.shift();if(s){m.s.push(s);if(m.s.length>4)m.s.shift();}return q;};}
const PD=(op,g,rounds)=>PLAN.def(op,g,rounds.map((list,r)=>list.map(mk=>fresh(op,g,r,mk))));
/* 'What mistake did ___ make?' with reasons (one right) */
function mistake(o,who,say,right,wrongs){return choice(Object.assign(o,{prompt:`${who} says ${say}. Is ${heOf(who)} right? Choose the reason.`,tpl:'{A}',fast:30}),right,wrongs);}
const FEM=['Ms. Rosa','Nana Paws','Skyla the eagle','the Kind Teacher'];const heOf=w=>FEM.includes(w)?'she':'he';
const ra=b=>{let a;do{a=R(1,b-1);}while(gcd(a,b)!==1);return a;}; /* a top number in simplest form */

/* things that can be cut: round ones use the pie picture, long ones the bar picture */
const ROUND=[['pizza','pizzas'],['pie','pies'],['cake','cakes'],['pancake','pancakes'],['cookie','cookies'],['tortilla','tortillas'],['waffle','waffles']];
const LONG=[['chocolate bar','chocolate bars'],['garden bed','garden beds'],['granola bar','granola bars'],['sandwich','sandwiches'],['ribbon','ribbons'],['fruit bar','fruit bars']];
const thing=(n,k)=>{const r=Math.random()<.55;const t=PK(r?ROUND:LONG);return {one:t[0],many:t[1],vis:{t:r?'pie':'bar',n,k}};};
const FOOD=[['pizza','pizzas'],['pie','pies'],['cake','cakes'],['pancake','pancakes'],['sandwich','sandwiches'],['waffle','waffles'],['cookie','cookies'],['quesadilla','quesadillas']];
const CUT=['Ms. Rosa','Gizmo','Nana Paws','Coach Flex','Ozzy','the Elder Wiz','Dr. Quartz','the Kind Teacher'];

/* number line drawn with text; dot on mark k, wholes labelled */
const NL=(n,k,wh)=>{wh=wh||1;const seg=n*wh>8?'─':'──';let s='0';for(let i=1;i<=n*wh;i++){s+=seg+(i===k?'●':i%n===0?'┃'+(i/n):'│');}
 return `<div style="font-family:monospace;font-size:1.25em;white-space:nowrap;margin-top:6px">${s}</div>`;};

/* ---------- money helpers ---------- */
const M=c=>c<100?`${c}¢`:$$(c);
/* set the answer box for an amount in cents: ¢ under $1, $ x.00 for whole dollars, dp:2 otherwise */
function money(o,c,pre){pre=pre||'';if(c<100)return Object.assign(o,{tpl:`${pre}{A} ¢`,answer:c});
 if(c%100===0)return Object.assign(o,{tpl:`${pre}$ {A}.00`,answer:c/100});return Object.assign(o,{tpl:`${pre}$ {A}`,answer:c,dp:2});}
const c5=(lo,hi)=>5*R(Math.ceil(lo/5),Math.floor(hi/5));
const c25=(lo,hi)=>25*R(Math.ceil(lo/25),Math.floor(hi/25));
const sumC=l=>l.reduce((a,b)=>a+b,0);
const COINN={1:['penny','pennies'],5:['nickel','nickels'],10:['dime','dimes'],25:['quarter','quarters'],100:['one-dollar bill','one-dollar bills']};
function coinSet(pool,cnt,lo,hi){let l,t;do{l=Array.from({length:R(cnt[0],cnt[1])},()=>PK(pool)).sort((x,y)=>y-x);t=sumC(l);}while(t<lo||t>hi);return {l,t};}
const coinWords=l=>{const m={};l.forEach(c=>m[c]=(m[c]||0)+1);return Object.keys(m).map(Number).sort((a,b)=>b-a).map(c=>`<b>${m[c]}</b> ${PL(m[c],COINN[c][0],COINN[c][1])}`).join(', ').replace(/, ([^,]*)$/,' and $1');};
const coinCount=l=>l.map(c=>c===100?'100':c).join(' + ');
/* realistic prices in cents: [emoji, one, many, lo, hi] */
const SMALL=[['🍭','lollipop','lollipops',25,50],['🍬','piece of candy','pieces of candy',10,25],['⭐','sticker','stickers',10,35],['✏️','pencil','pencils',25,60],['🍌','banana','bananas',25,40],['🐞','toy bug','toy bugs',30,60],['🎈','balloon','balloons',35,75],['🧃','juice box','juice boxes',50,90],['🍪','cookie','cookies',40,85]];
const MID=[['📓','notebook','notebooks',150,350],['🧃','juice box','juice boxes',100,175],['🍦','ice cream cone','ice cream cones',225,425],['🥐','croissant','croissants',175,325],['🖍️','box of crayons','boxes of crayons',150,375],['🧁','cupcake','cupcakes',125,300],['🥤','smoothie','smoothies',275,475],['🍕','slice of pizza','slices of pizza',200,375],['🎈','balloon','balloons',100,225]];
const BIG=[['📚','book','books',600,1200],['🧢','cap','caps',800,1500],['🪁','kite','kites',700,1400],['🧸','teddy bear','teddy bears',900,1600],['⚽','soccer ball','soccer balls',1000,1800],['🎲','board game','board games',1200,1900],['🥪','sandwich','sandwiches',475,875]];
const an=w=>/^[aeiou]/i.test(w)?'an':'a';
const item=(L)=>{const t=PK(L);return {e:t[0],one:t[1],many:t[2],p:c5(t[3],t[4])};};
const two=(L)=>{const s=SH(L);const a=s[0],b=s[1];return [{e:a[0],one:a[1],many:a[2],p:c5(a[3],a[4])},{e:b[0],one:b[1],many:b[2],p:c5(b[3],b[4])}];};

/* =====================================================================
   FRACTION FARM
   ===================================================================== */

/* ----- grade 2: equal shares in words (halves, thirds, fourths) ----- */
const f2={
 parts:c=>{const n=PK([2,3,4]);const t=thing(n,0);const w=PK(CUT);
  return {vis:t.vis,prompt:`${cap(w)} cut this ${t.one} into equal parts.`,tpl:'{A} equal parts',answer:n,text:`${w} ${t.one} ${n} parts`,fast:8,
   explain:`<p>Count the pieces one by one. There are <b>${n}</b> equal parts.</p>`,nudge:`<p>Touch each piece as you count it.</p>`};},
 name:c=>{const n=PK([2,3,4]);const t=thing(n,0);const w=PK(CUT);
  return choice({vis:t.vis,prompt:`${cap(w)} cut this ${t.one} into <b>${n}</b> equal parts. What are the parts called?`,tpl:'{A}',text:`name ${n} parts ${w} ${t.one}`,fast:10,
   explain:`<p>2 equal parts are <b>halves</b>, 3 are <b>thirds</b>, 4 are <b>fourths</b>.</p><p>${n} equal parts are <b>${FN[n][1]}</b>.</p>`,nudge:`<p>Count the parts. 2 parts = halves, 3 parts = thirds, 4 parts = fourths.</p>`},FN[n][1],['halves','thirds','fourths','wholes']);},
 howMany:c=>{const n=PK([2,3,4]);const f=PK(FOOD);const w=PK(CUT);
  return {prompt:`${cap(w)} cuts a ${f[0]} into <b>${FN[n][1]}</b>.`,tpl:'{A} equal pieces',answer:n,text:`${w} ${f[0]} into ${FN[n][1]}`,fast:10,
   explain:`<p>Halves means 2 pieces, thirds means 3, fourths means 4.</p><p>${cap(FN[n][1])} means <b>${n}</b> equal pieces.</p>`,nudge:`<p>Listen to the word: half sounds like 2, third sounds like 3, fourth sounds like 4.</p>`};},
 fair:c=>{const n=PK([2,3,4]);const f=PK(FOOD);const w=PK(CUT);const eq=Math.random()<.5;
  const desc=eq?`<b>${n}</b> pieces that are all the same size`:n===2?'<b>2</b> pieces. One is big and one is small':`<b>${n}</b> pieces. Some are big and some are small`;
  return choice({prompt:`${cap(w)} cuts a ${f[0]} into ${desc}. Are the pieces ${FN[n][1]}?`,tpl:'{A}',text:`fair ${n} ${eq} ${w} ${f[0]}`,fast:12,
   explain:eq?`<p>The ${n} pieces are the <b>same size</b>, so they are ${FN[n][1]}. <b>Yes</b>.</p>`:`<p>${cap(FN[n][1])} must all be the <b>same size</b>. These pieces are not, so <b>No</b>.</p>`,
   nudge:`<p>Halves, thirds and fourths must be <b>equal</b> pieces.</p>`},eq?'Yes':'No',['Yes','No']);},
 shadeWords:c=>{const n=PK([2,3,4]);const k=R(1,n-1);const t=thing(n,k);const not=Math.random()<.3&&n>2;const v=not?n-k:k;
  const w=[fw(n-v,n),fw(v,PK([2,3,4].filter(x=>x!==n&&x>=v)) || 4),fw(Math.min(n,v+1),n),fw(n,n)];
  return choice({vis:t.vis,prompt:`How much of the ${t.one} is ${not?'<b>NOT</b> shaded':'shaded'}?`,tpl:'{A}',text:`words ${not} ${k}/${n} ${t.one}`,fast:12,
   explain:`<p>There are ${n} equal parts, so they are <b>${FN[n][1]}</b>.</p><p>${v} ${v===1?'part is':'parts are'} ${not?'white':'shaded'}: <b>${fw(v,n)}</b>.</p>`,nudge:`<p>First name the parts (halves, thirds or fourths). Then count the ${not?'white':'orange'} ones.</p>`},fw(v,n),w);},
 countShaded:c=>{const n=PK([3,4]);const not=Math.random()<.45;const k=not?R(1,n-1):R(1,n);const t=thing(n,k);const v=not?n-k:k;
  return {vis:t.vis,prompt:`This ${t.one} is cut into ${FN[n][1]}. How many ${FN[n][1]} are ${not?'<b>NOT</b> shaded':'shaded'}?`,tpl:`{A} ${FN[n][1]}`,answer:v,text:`count ${not} ${k}/${n} ${t.one}`,fast:10,
   explain:`<p>Count the ${not?'white':'orange'} parts: <b>${v}</b>.</p>`,nudge:`<p>Each part is one ${FN[n][0]}. Count the ${not?'white':'orange'} ones.</p>`};},
 stripes:c=>{const S=PK([['Nana Paws','knits a scarf with','equal stripes','stripes','red'],['Gizmo','paints a robot arm with','equal bands','bands','blue'],['Dr. Quartz','builds a crystal wall with','equal rows','rows','purple'],['Coach Flex','paints a racing flag with','equal stripes','stripes','gold'],['Ms. Rosa','bakes a long cake with','equal layers','layers','chocolate']]);
  const n=PK([3,4]);const k=R(2,n-1);const not=Math.random()<.4&&n-k>=2;const v=not?n-k:k;
  return st({prompt:`${S[0]} ${S[1]} <b>${n}</b> ${S[2]}. <b>${k}</b> ${S[3]} are ${S[4]}. How many ${FN[n][1]} are ${not?'<b>not</b> '+S[4]:S[4]}?`,tpl:`{A} ${FN[n][1]}`,answer:v,text:`${S[0]} ${n} ${k} ${not}`,fast:20,
   explain:`<p>${n} equal ${S[3]} means each one is 1 ${FN[n][0]}.</p><p>${not?`${n} − ${k} = ${v} are not ${S[4]}`:`${k} are ${S[4]}`}, so <b>${fw(v,n)}</b>.</p>`,nudge:`<p>Each ${S[3].replace(/s$/,'')} is one ${FN[n][0]}. How many are ${not?'not ':''}${S[4]}?</p>`});},
 makeWhole:c=>{const n=PK([2,3,4]);const w=PK([1,1,2,2,3]);const f=PK(FOOD);
  return {prompt:`How many <b>${FN[n][1]}</b> make <b>${w}</b> whole ${w===1?f[0]:f[1]}?`,tpl:`{A} ${FN[n][1]}`,answer:n*w,text:`${FN[n][1]} in ${w} ${f[0]}`,fast:12,
   explain:`<p>1 whole = <b>${n}</b> ${FN[n][1]}.</p>${w>1?`<p>${w} wholes: ${Array(w).fill(n).join(' + ')} = <b>${n*w}</b> ${FN[n][1]}.</p>`:''}`,nudge:`<p>${cap(FN[n][1])} cut one whole into how many pieces?${w>1?` Then count for ${w} wholes.`:''}</p>`};},
 moreToWhole:c=>{const n=PK([2,3,4]);const k=R(1,n-1);const t=thing(n,k);
  return {vis:t.vis,prompt:`This ${t.one} is cut into ${FN[n][1]}. ${cap(fw(k,n))} ${k===1?'is':'are'} shaded. How many more ${FN[n][1]} must be shaded to shade the whole ${t.one}?`,tpl:'{A} more',answer:n-k,text:`more ${k}/${n} ${t.one}`,fast:12,
   explain:`<p>The whole is ${fw(n,n)}. ${k} ${k===1?'is':'are'} shaded.</p><p>${n} − ${k} = <b>${n-k}</b> more.</p>`,nudge:`<p>How many ${FN[n][1]} make the whole? How many are shaded already?</p>`};},
 isWhole:c=>{const n=PK([2,3,4]);const k=R(1,n);const f=PK(FOOD);const w=PK(CUT);const r=k===n?'1 whole':'less than 1 whole';
  return choice({prompt:`${cap(w)} has <b>${fw(k,n)}</b> of a ${f[0]}. How much is that?`,tpl:'{A}',text:`whole? ${k}/${n} ${w} ${f[0]}`,fast:12,
   explain:`<p>${cap(fw(n,n))} make 1 whole.</p><p>${cap(fw(k,n))} is <b>${r}</b>.</p>`,nudge:`<p>How many ${FN[n][1]} make 1 whole ${f[0]}?</p>`},r,['1 whole','less than 1 whole','more than 1 whole']);},
 eatLeft:c=>{const n=PK([3,4]);const k=R(1,n-2);const f=PK(FOOD);const w=PK(['Skyla the eagle','Coach Flex','Gizmo',PN(c),c.name,'Grumbleroot the troll']);
  return st({prompt:`A ${f[0]} is cut into <b>${FN[n][1]}</b>. ${w} eats <b>${fw(k,n)}</b>. How many ${FN[n][1]} are left?`,tpl:`{A} ${FN[n][1]}`,answer:n-k,text:`eat ${k}/${n} ${w} ${f[0]}`,fast:20,
   explain:`<p>The whole ${f[0]} is ${fw(n,n)}.</p><p>${n} − ${k} = <b>${n-k}</b> ${FN[n][1]} left.</p>`,nudge:`<p>How many ${FN[n][1]} in the whole ${f[0]}? Take away the eaten ones.</p>`});},
 bigger:c=>{const [a,b]=SH([2,4]);const f=PK(FOOD);const small=Math.random()<.4;const big=a<b?a:b,sm=a<b?b:a;const r=small?sm:big;
  return choice({prompt:`Two ${f[1]} are the same size. One is cut into <b>${FN[a][1]}</b>. The other is cut into <b>${FN[b][1]}</b>. Which piece is <b>${small?'smaller':'bigger'}</b>?`,tpl:'{A}',text:`${small?'smaller':'bigger'} ${a} ${b} ${f[0]}`,fast:12,
   explain:`<p>More pieces means <b>smaller</b> pieces. Fewer pieces means <b>bigger</b> pieces.</p><p>${FN[big][1]} are bigger than ${FN[sm][1]}, so <b>1 ${FN[r][0]}</b>.</p>`,nudge:`<p>Picture sharing the same ${f[0]} with more friends. Do the pieces get bigger or smaller?</p>`},`1 ${FN[r][0]}`,[`1 ${FN[a][0]}`,`1 ${FN[b][0]}`,'they are the same']);},
 lookDiff:c=>{const S=PK([[2,'2 long rectangles','2 triangles'],[2,'2 rectangles','2 triangles'],[4,'4 small squares','4 long strips'],[4,'4 triangles','4 small squares'],[4,'4 long strips','4 triangles']]);
  const sh=PK(['square sandwiches','square brownies','square pieces of toast','square crackers']);const [p,q]=SH(['Nana Paws','Gizmo','Ozzy','Ms. Rosa','Coach Flex']);const n=S[0];const bad=false;
  if(bad)return choice({prompt:`${p} cuts a sandwich into <b>${n}</b> pieces, but some pieces are big and some are small. Are the pieces ${FN[n][1]}?`,tpl:'{A}',text:`lookdiff bad ${n} ${p}`,fast:12,
   explain:`<p>${cap(FN[n][1])} must be <b>equal</b> pieces. These are not equal, so <b>No</b>.</p>`,nudge:`<p>Are all the pieces the same size?</p>`},'No',['Yes','No']);
  return choice({prompt:`${p} and ${q} have two ${sh} of the same size. ${p} cuts one into ${S[1]}. ${q} cuts the other into ${S[2]}. Both cuts make ${FN[n][1]}. Is ${p}'s piece the same amount as ${q}'s piece?`,tpl:'{A}',text:`lookdiff ${S[1]} ${S[2]} ${sh} ${p} ${q}`,fast:15,
   explain:`<p>Both wholes are the same size and both are cut into ${n} <b>equal</b> parts.</p><p>So each piece is 1 ${FN[n][0]}. They look different but they are the same amount: <b>Yes</b>.</p>`,nudge:`<p>Same-size wholes, ${n} equal parts each. Does the shape of the piece matter?</p>`},'Yes',['Yes','No']);},
 piecesOfWholes:c=>{const n=PK([2,3,4]);const w=PK([2,3]);const f=PK(FOOD);const who=PK(CUT);
  return st({prompt:`${cap(who)} cuts <b>${w}</b> ${f[1]} into <b>${FN[n][1]}</b>. How many pieces are there in all?`,tpl:'{A} pieces',answer:n*w,text:`${who} ${w} ${f[1]} ${n}`,fast:20,
   explain:`<p>Each ${f[0]} has ${n} ${FN[n][1]}.</p><p>${Array(w).fill(n).join(' + ')} = <b>${n*w}</b> pieces.</p>`,nudge:`<p>How many pieces in one ${f[0]}? Add that ${w} times.</p>`});},
 notEaten:c=>{const n=4;const k=R(1,3);const t=thing(4,k);const who=PK(['Grumbleroot the troll','the Grey Goblin','Coach Flex',pn(c)]);
  return st({vis:t.vis,prompt:`The shaded part of this ${t.one} is what ${who} ate. How many fourths did <b>${who}</b> NOT eat?`,tpl:'{A} fourths',answer:4-k,text:`noteat ${k} ${who} ${t.one}`,fast:15,
   explain:`<p>The whole is 4 fourths. ${who} ate ${k}.</p><p>4 − ${k} = <b>${4-k}</b> fourths.</p>`,nudge:`<p>Count the white parts.</p>`});},
 /* legend */
 cutSell:c=>{const n=PK([2,3,4]);const w=PK([2,3]);const tot=n*w;const s=R(2,tot-1);const f=PK(FOOD);
  return st({prompt:`Ms. Rosa cuts <b>${w}</b> ${f[1]} into <b>${FN[n][1]}</b>. She sells <b>${s}</b> pieces. How many pieces are left?`,tpl:'{A} pieces',answer:tot-s,text:`cutsell ${w} ${n} ${s} ${f[0]}`,fast:30,
   explain:`<p>Pieces: ${Array(w).fill(n).join(' + ')} = ${tot}.</p><p>${tot} − ${s} = <b>${tot-s}</b> pieces left.</p>`,nudge:`<p>Step 1: how many pieces in all? Step 2: take away the ones she sold.</p>`});},
 share:c=>{const S=PK([[2,4,2],[2,4,4],[2,2,4],[3,4,4],[2,3,2],[2,3,3],[3,2,3],[4,2,4]]);const [w,n,fr]=S;const f=PK(FOOD);const who=PK(CUT);
  return st({prompt:`<b>${fr}</b> friends share <b>${w}</b> ${f[1]} fairly. ${cap(who)} cuts each ${f[0]} into <b>${FN[n][1]}</b>. How many pieces does each friend get?`,tpl:'{A} pieces each',answer:w*n/fr,text:`share ${w} ${n} ${fr} ${f[0]} ${who}`,fast:30,
   explain:`<p>Pieces: ${w} × ${n} = ${w*n}.</p><p>Share ${w*n} pieces with ${fr} friends: <b>${w*n/fr}</b> each.</p>`,nudge:`<p>Find all the pieces first. Then deal them out one at a time to ${fr} friends.</p>`});},
eatTwo:c=>{const n=PK([3,4]);const a=1,b=R(1,n-2);const f=PK(FOOD);const who=PK(['Ms. Rosa','Nana Paws','Gizmo','Coach Flex','the Kind Teacher']);const [p,q]=SH(['Ozzy','Skyla the eagle',PN(c),c.name,'Grumbleroot the troll']);
  return st({prompt:`${cap(who)} cuts a ${f[0]} into ${FN[n][1]}. ${p} eats <b>${a}</b> piece. ${q} eats <b>${b}</b> ${PL(b,'piece')}. How many pieces are left?`,tpl:'{A} pieces',answer:n-a-b,text:`eattwo ${who} ${p} ${q} ${f[0]} ${n} ${b}`,fast:30,
   explain:`<p>${cap(FN[n][1])} means ${n} pieces.</p><p>Eaten: ${a} + ${b} = ${a+b}. Left: ${n} − ${a+b} = <b>${n-a-b}</b>.</p>`,nudge:`<p>How many pieces does "${FN[n][1]}" make? Take away both eaters' pieces.</p>`});},
 mixCut:c=>{const [n1,n2]=SH([2,3,4]).slice(0,2);const w1=R(1,2),w2=R(1,3);const [f1,f2x]=SH(FOOD).slice(0,2);const who=PK(['Ms. Rosa','Nana Paws','the Kind Teacher','Gizmo','Ozzy']);const t=n1*w1+n2*w2;
  return st({prompt:`${cap(who)} cuts <b>${w1}</b> ${w1===1?f1[0]:f1[1]} into <b>${FN[n1][1]}</b> and <b>${w2}</b> ${w2===1?f2x[0]:f2x[1]} into <b>${FN[n2][1]}</b>. How many pieces are there in all?`,tpl:'{A} pieces',answer:t,text:`mixcut ${who} ${w1}${f1[0]}${n1} ${w2}${f2x[0]}${n2}`,fast:35,
   explain:`<p>${cap(f1[1])}: ${Array(w1).fill(n1).join(' + ')} = ${n1*w1}. ${cap(f2x[1])}: ${Array(w2).fill(n2).join(' + ')} = ${n2*w2}.</p><p>${n1*w1} + ${n2*w2} = <b>${t}</b></p>`,nudge:`<p>Count the pieces for each kind of food, then add.</p>`});},
 cutGive:c=>{const n=PK([2,3,4]);const w=PK([2,3]);const tot=n*w;const e=R(1,2);const g=R(1,tot-e-1);const f=PK(FOOD);const who=PK(['Gizmo','Coach Flex','Ozzy','Nana Paws','Ms. Rosa']);const P=heOf(who);
  return st({prompt:`${who} cuts <b>${w}</b> ${f[1]} into <b>${FN[n][1]}</b>. ${cap(P)} eats <b>${e}</b> ${PL(e,'piece')} and gives <b>${g}</b> ${PL(g,'piece')} to friends. How many pieces are left?`,tpl:'{A} pieces',answer:tot-e-g,text:`cutgive ${who} ${w} ${n} ${e} ${g} ${f[0]}`,fast:40,
   explain:`<p>Pieces: ${Array(w).fill(n).join(' + ')} = ${tot}.</p><p>Gone: ${e} + ${g} = ${e+g}. Left: ${tot} − ${e+g} = <b>${tot-e-g}</b></p>`,nudge:`<p>Step 1: all the pieces. Step 2: pieces eaten and given. Step 3: take away.</p>`});},
wholePlus:c=>{const n=PK([2,3,4]);const w=R(1,3);const k=R(1,n-1);const f=PK(FOOD);const who=PK(['Ms. Rosa','Nana Paws','Gizmo','Ozzy','Coach Flex']);
  return st({prompt:`${who} has <b>${w}</b> whole ${w===1?f[0]:f[1]} and <b>${fw(k,n)}</b> of another ${f[0]}. How many ${FN[n][1]} is that in all?`,tpl:`{A} ${FN[n][1]}`,answer:w*n+k,text:`wp ${who} ${f[0]} ${w} ${k}/${n}`,fast:30,
   explain:`<p>Each whole ${f[0]} is ${n} ${FN[n][1]}: ${Array(w).fill(n).join(' + ')} = ${w*n}.</p><p>${w*n} + ${k} = <b>${w*n+k}</b> ${FN[n][1]}</p>`,nudge:`<p>How many ${FN[n][1]} in one whole? Count the wholes, then add the extra.</p>`});},
 mixEat:c=>{const [n1,n2]=SH([2,3,4]).slice(0,2);const [f1,f2x]=SH(FOOD).slice(0,2);const who=PK(['picnic','party','fair']);const e=R(1,2);
  return st({prompt:`At the ${who} there is a ${f1[0]} cut into <b>${FN[n1][1]}</b> and a ${f2x[0]} cut into <b>${FN[n2][1]}</b>. The kids eat <b>${e}</b> ${PL(e,'piece')} of each. How many pieces are left?`,tpl:'{A} pieces',answer:n1+n2-2*e,text:`me ${who} ${f1[0]}${n1} ${f2x[0]}${n2} ${e}`,fast:40,
   explain:`<p>Pieces: ${n1} + ${n2} = ${n1+n2}. Eaten: ${e} + ${e} = ${2*e}.</p><p>${n1+n2} − ${2*e} = <b>${n1+n2-2*e}</b></p>`,nudge:`<p>Step 1: all the pieces. Step 2: how many were eaten from both?</p>`});},
 fixShare:c=>{const w=PK([1,2]);const n=4;const tot=w*n;const a=R(tot/2+1,tot-1);const b=tot-a;const [p,q]=SH(['Coach Flex','Gizmo','Ozzy','Grumbleroot the troll']);const f=PK(FOOD);
  return st({prompt:`${p} and ${q} share ${w===1?'a '+f[0]:'2 '+f[1]} cut into fourths. ${p} takes <b>${a}</b> pieces and ${q} gets <b>${b}</b>. That isn't fair! How many pieces should ${p} give to ${q} so they have the same?`,tpl:`{A} ${'pieces'}`,answer:(a-b)/2,text:`fs ${p} ${q} ${w} ${a}`,fast:40,
   explain:`<p>There are ${tot} pieces. Fair means ${tot/2} each.</p><p>${p} has ${a}, so ${p} gives ${a} − ${tot/2} = <b>${(a-b)/2}</b>.</p>`,nudge:`<p>How many pieces would each get if it were fair?</p>`});},
 eaglets2:c=>{const n=PK([2,3,4]);const w=R(2,3);const k=PK([2,3]);const e=R(1,Math.floor((w*n-1)/k));
  return st({prompt:`Skyla the eagle cuts <b>${w}</b> fish pies into <b>${FN[n][1]}</b>. Each of her <b>${k}</b> eaglets eats <b>${e}</b> ${PL(e,'piece')}. How many pieces are left?`,tpl:'{A} pieces',answer:w*n-k*e,text:`eg2 ${w} ${n} ${k} ${e}`,fast:40,
   explain:`<p>Pieces: ${Array(w).fill(n).join(' + ')} = ${w*n}. Eaten: ${Array(k).fill(e).join(' + ')} = ${k*e}.</p><p>${w*n} − ${k*e} = <b>${w*n-k*e}</b></p>`,nudge:`<p>Step 1: all the pieces. Step 2: what the eaglets ate. Step 3: take away.</p>`});},
shareParts:c=>{const n=PK([2,3,4]);const f=PK(FOOD);const who=PK(CUT);const kids=SH(['Mia','Leo','Sam','Zoe','Ben','Ivy']).slice(0,n);
  return {prompt:`${kids.slice(0,-1).join(', ')} and ${kids[n-1]} share a ${f[0]} fairly. ${cap(who)} cuts it so each gets one equal part. How many equal parts?`,tpl:'{A} equal parts',answer:n,text:`sp ${n} ${f[0]} ${who}`,fast:12,
   explain:`<p>One equal part for each of the <b>${n}</b> friends: ${n} equal parts, called <b>${FN[n][1]}</b>.</p>`,nudge:`<p>Count the friends.</p>`};},
 morePieces:c=>{const [a,b]=SH([2,3,4]).slice(0,2);const f=PK(FOOD);const more=Math.random()<.5;const r=more?(a>b?a:b):(a>b?b:a);
  return choice({prompt:`Ozzy cuts one ${f[0]} into <b>${FN[a][1]}</b> and another into <b>${FN[b][1]}</b>. Which way makes ${more?'<b>more</b>':'<b>fewer</b>'} pieces?`,tpl:'{A}',text:`mp ${a} ${b} ${more} ${f[0]}`,fast:12,
   explain:`<p>${cap(FN[a][1])} make ${a} pieces. ${cap(FN[b][1])} make ${b} pieces.</p><p>So <b>${FN[r][1]}</b>.</p>`,nudge:`<p>Halves = 2 pieces, thirds = 3, fourths = 4.</p>`},FN[r][1],[FN[a][1],FN[b][1]]);}
};
PD('frac',2,[
 [f2.parts,f2.name,f2.makeWhole,f2.fair,f2.shareParts,f2.morePieces,f2.countShaded,f2.shadeWords,f2.stripes],
 [f2.shadeWords,f2.countShaded,f2.stripes,f2.howMany,f2.shareParts,f2.morePieces,f2.makeWhole,f2.isWhole,f2.fair],
 [f2.makeWhole,f2.moreToWhole,f2.isWhole,f2.eatLeft,f2.countShaded,f2.shadeWords,f2.stripes,f2.piecesOfWholes,f2.wholePlus],
 [f2.lookDiff,f2.piecesOfWholes,f2.notEaten,f2.wholePlus,f2.bigger,f2.isWhole,f2.moreToWhole,f2.eatLeft,f2.makeWhole],
 [f2.eatTwo,f2.cutSell,f2.share,f2.mixCut,f2.cutGive,f2.mixEat,f2.fixShare,f2.eaglets2,f2.piecesOfWholes]]);

/* ----- grade 3: unit fractions, number line, equivalent and comparing (denominators 2,3,4,6,8) ----- */
const D3=[2,3,4,6,8];
const SET3=[['Nana Paws','knits a blanket with','equal squares','squares','blue'],['Dr. Quartz','has a tray of','crystals','crystals','purple'],['Gizmo','has a box of','batteries','batteries','charged'],['Ms. Rosa','bakes a pan of','brownies','brownies','with nuts'],['the Elder Wiz','has a drawer of','lonely socks','socks','striped'],['Coach Flex','sets up','cones','cones','orange']];
const f3={
 shaded:c=>{const n=PK(D3);const k=R(1,n-1);const t=thing(n,k);const who=PK(CUT);
  return {vis:t.vis,prompt:`${cap(who)} shaded part of this ${t.one}. What fraction is shaded?`,tpl:FA(n),answer:k,text:`shade ${k}/${n} ${t.one} ${who}`,fast:10,
   explain:`<p>${n} equal parts: the bottom number is ${n}.</p><p>${k} shaded: the top number is <b>${k}</b>. It's ${F(k,n)}.</p>`,nudge:`<p>Bottom = how many equal parts. Top = how many are shaded.</p>`};},
 notShaded:c=>{const n=PK(D3);const k=R(1,n-1);const t=thing(n,k);
  return {vis:t.vis,prompt:`Count the <b>white</b> pieces of this ${t.one}. Write them as a fraction of the whole.`,tpl:FA(n),answer:n-k,text:`notshade ${k}/${n} ${t.one}`,fast:10,
   explain:`<p>${n} parts in all, ${k} shaded.</p><p>${n} − ${k} = <b>${n-k}</b> white parts: ${F(n-k,n)}.</p>`,nudge:`<p>Count the white parts. The bottom number is still ${n}.</p>`};},
 unit:c=>{const n=PK(D3);const t=thing(n,1);const who=PK(CUT);
  return {vis:t.vis,prompt:`${cap(who)} cut a ${t.one} into <b>${n}</b> equal parts. What fraction is ONE part?`,tpl:FD(n),answer:n,text:`unit 1/${n} ${who} ${t.one}`,fast:10,
   explain:`<p>One part out of ${n} equal parts is ${F(1,n)}, so the bottom number is <b>${n}</b>.</p>`,nudge:`<p>The bottom number tells how many equal parts make the whole.</p>`};},
 setStory:c=>{const S=PK(SET3);const n=PK([4,6,8]);const k=R(1,n-1);
  return st({prompt:`${S[0]==='the Elder Wiz'?'The Elder Wiz':S[0]} ${S[1]} <b>${n}</b> ${S[2]}. <b>${k}</b> of the ${S[3]} ${k===1?'is':'are'} ${S[4]}. What fraction of the ${S[3]} ${k===1?'is':'are'} ${S[4]}?`,tpl:FA(n),answer:k,text:`set ${S[0]} ${n} ${k}`,fast:20,
   explain:`<p>There are ${n} ${S[3]} in all: bottom number ${n}.</p><p>${k} ${k===1?'is':'are'} ${S[4]}: top number <b>${k}</b>. It's ${F(k,n)}.</p>`,nudge:`<p>Bottom: how many in all? Top: how many are ${S[4]}?</p>`});},
 nline:c=>{const n=PK([3,4,6,8]);const k=R(1,n-1);
  return {prompt:`A number line from 0 to 1 is cut into <b>${n}</b> equal parts. The dot is on the <b>${ord(k)}</b> mark after 0. What fraction is it at?${NL(n,k)}`,tpl:FA(n),answer:k,text:`nline ${k}/${n}`,fast:12,
   explain:`<p>Each jump is ${F(1,n)}. The dot is ${k} ${PL(k,'jump')} from 0.</p><p>So it is at ${F(k,n)}: top number <b>${k}</b>.</p>`,nudge:`<p>Count the jumps from 0 to the dot. Each jump is ${F(1,n)}.</p>`};},
 wholes:c=>{const n=PK(D3);const m=R(1,4);const v=R(0,3);
  if(v===0)return {prompt:'Write it as a whole number.',tpl:`${F(n*m,n)} = {A}`,answer:m,text:`${n*m}/${n} whole`,fast:10,explain:`<p>${n} ${FN[n][1]} make 1 whole.</p><p>${n*m} ÷ ${n} = <b>${m}</b> ${PL(m,'whole')}.</p>`,nudge:`<p>How many groups of ${n} ${FN[n][1]} are in ${n*m} ${FN[n][1]}?</p>`};
  if(v===1)return {prompt:`How many ${FN[n][1]} make ${m} ${PL(m,'whole')}?`,tpl:`${m} = ${FA(n)}`,answer:m*n,text:`${m} = ?/${n}`,fast:10,explain:`<p>1 whole = ${F(n,n)}.</p><p>${m} wholes = ${m} × ${n} = <b>${m*n}</b> ${FN[n][1]}.</p>`,nudge:`<p>One whole is ${n} ${FN[n][1]}. How many for ${m}?</p>`};
  if(v===2){const k=R(2,8);return {prompt:'Write it as a whole number.',tpl:`${F(k,1)} = {A}`,answer:k,text:`${k}/1`,fast:8,explain:`<p>A bottom number of 1 means each piece is a whole. ${k} wholes = <b>${k}</b>.</p>`,nudge:`<p>${F(1,1)} is one whole thing.</p>`};}
  return {prompt:'Write it as a whole number.',tpl:`${F(n,n)} = {A}`,answer:1,text:`${n}/${n}`,fast:8,explain:`<p>${n} out of ${n} equal parts is the whole thing: <b>1</b>.</p>`,nudge:`<p>All the parts are there. How many wholes is that?</p>`};},
 unitCount:c=>{const n=PK(D3);const k=R(2,n+3);
  return {prompt:`How many ${F(1,n)} pieces make ${F(k,n)}?`,tpl:'{A} pieces',answer:k,text:`count 1/${n} in ${k}/${n}`,fast:10,
   explain:`<p>${F(k,n)} means <b>${k}</b> pieces, each ${F(1,n)}.</p>`,nudge:`<p>The top number counts the pieces of size ${F(1,n)}.</p>`};},
 track:c=>{const S=PK([['Coach Flex runs on a track that is','He stops at','How far has he run?','mile'],['Skyla the eagle flies along a river that is','She lands on','How far has she flown?','mile'],['Ozzy\'s train track is','The train stops at','How far has the train gone?','mile'],['Nana Paws walks the dogs on a path that is','She stops at','How far has she walked?','mile']]);
  const n=PK([3,4,6,8]);const k=R(1,n-1);
  return st({prompt:`${S[0]} 1 mile long. Signs cut it into <b>${n}</b> equal parts. ${S[1]} the <b>${ord(k)}</b> sign. ${S[2]}${NL(n,k)}`,tpl:`${FA(n)} mile`,answer:k,text:`track ${S[0].slice(0,8)} ${k}/${n}`,fast:20,
   explain:`<p>Each part is ${F(1,n)} mile. ${k} ${PL(k,'part')}: ${F(k,n)} mile. Top number <b>${k}</b>.</p>`,nudge:`<p>Each part is ${F(1,n)} of a mile. How many parts?</p>`});},
 equiv:c=>{const P=[[1,2,4],[1,2,6],[1,2,8],[1,3,6],[2,3,6],[1,4,8],[3,4,8],[2,4,8],[1,2,4],[3,6,2]];let [a,b,d]=PK(P);
  if(b>d){/* 3/6 = ?/2 */const m=b/d;return {vis:{t:'bar',n:b,k:a},prompt:'Use the picture. Fill in the equal fraction.',tpl:`${F(a,b)} = ${FA(d)}`,answer:a/m,text:`${a}/${b}=?/${d}`,fast:15,explain:`<p>Put every ${m} small parts together. ${b} parts become ${d}, and ${a} shaded become <b>${a/m}</b>.</p>`,nudge:`<p>Join the parts into ${d} equal bigger parts. How many are shaded?</p>`};}
  const m=d/b;const rev=Math.random()<.35;
  if(rev)return {vis:{t:'bar',n:d,k:a*m},prompt:'Use the picture. Fill in the equal fraction.',tpl:`${F(a*m,d)} = ${FA(b)}`,answer:a,text:`${a*m}/${d}=?/${b}`,fast:15,explain:`<p>Join every ${m} small parts into one. ${d} parts become ${b}.</p><p>${a*m} shaded parts become <b>${a}</b>: ${F(a,b)}.</p>`,nudge:`<p>Group the small parts by ${m}s. How many groups are shaded?</p>`};
  return {vis:{t:'bar',n:b,k:a},prompt:`Use the picture. Cut each part into ${m} equal pieces.`,tpl:`${F(a,b)} = ${FA(d)}`,answer:a*m,text:`${a}/${b}=?/${d}`,fast:15,explain:`<p>Each part becomes ${m} pieces, so ${b} parts become ${d}.</p><p>${a} shaded part${a>1?'s':''} become ${a} × ${m} = <b>${a*m}</b>.</p>`,nudge:`<p>If each part is cut into ${m}, how many shaded pieces are there?</p>`};},
 whichEq:c=>{const P=[[1,2],[1,3],[2,3],[1,4],[3,4]];const [a,b]=PK(P);const ms=[2,3,4].filter(m=>b*m<=8);const m=PK(ms);
  const wr=[];[[a+1,b*m],[a*m,b],[a,b*m],[a*m-1||a*m+1,b*m],[b,a*m]].forEach(w=>wr.push(w));
  const o={prompt:`Which fraction is equal to ${F(a,b)}?`,tpl:'{A}',text:`whicheq ${a}/${b} ${m}`,fast:15,
   explain:`<p>${F(a,b)}: cut each part into ${m}. ${a} × ${m} = ${a*m} and ${b} × ${m} = ${b*m}.</p><p>So ${F(a,b)} = <b>${F(a*m,b*m)}</b>.</p>`,nudge:`<p>Picture the same bar cut into smaller equal parts. The shaded amount stays the same.</p>`};
  const right=F(a*m,b*m);const bad=wr.filter(w=>w[0]>0&&w[1]>0&&w[0]*b!==a*w[1]&&w[1]<=8).map(w=>F(w[0],w[1]));return choice(o,right,bad.length>=2?bad:bad.concat([F(a+1,b),F(b*m-1,b*m)]));},
 nline2:c=>{const n=PK([2,3,4,6]);let k;do{k=R(n+1,2*n-1);}while(k%n===0);
  return {prompt:`A number line from 0 to 2. Each whole is cut into <b>${n}</b> equal parts. The dot is on the <b>${ord(k)}</b> mark after 0. What fraction is it at?${NL(n,k,2)}`,tpl:FA(n),answer:k,text:`nline2 ${k}/${n}`,fast:15,
   explain:`<p>Each jump is ${F(1,n)}. From 0 to the dot is ${k} jumps.</p><p>So the dot is at ${F(k,n)}: top number <b>${k}</b>.</p>`,nudge:`<p>Keep counting jumps past 1. Every jump is ${F(1,n)}.</p>`};},
 sameShare:c=>{const P=[[1,2,4],[1,2,6],[1,2,8],[1,3,6],[2,3,6],[1,4,8],[3,4,8]];const [a,b,d]=PK(P);const m=d/b;
  const S=PK([['Gizmo','Ozzy','gadget bar','uses'],['Ms. Rosa','Nana Paws','pan of lasagna','serves'],['Coach Flex','Skyla the eagle','energy bar','eats'],['Dr. Quartz','Gizmo','crystal bar','paints']]);
  return st({prompt:`${S[0]} cuts ${an(S[2])} ${S[2]} into <b>${b}</b> equal parts and ${S[3]} <b>${a}</b>. ${S[1]} cuts the same size ${S[2]} into <b>${d}</b> equal parts. How many ${FN[d][1]} must ${S[1]} use to match ${S[0]}?`,tpl:`{A} ${FN[d][1]}`,answer:a*m,text:`same ${S[0]} ${a}/${b} ${d}`,fast:25,
   explain:`<p>${S[0]} has ${F(a,b)}. Each ${FN[b][0]} is ${m} ${FN[d][1]}.</p><p>${a} × ${m} = <b>${a*m}</b>, so ${F(a,b)} = ${F(a*m,d)}.</p>`,nudge:`<p>How many ${FN[d][1]} fit in one ${FN[b][0]}?</p>`});},
 compare:c=>{const v=R(0,2);let a,b,cc,d;
  if(v===0){b=d=PK([3,4,6,8]);a=R(1,b-1);do{cc=R(1,b-1);}while(cc===a);}
  else if(v===1){a=cc=R(1,3);const ds=D3.filter(x=>x>a);[b,d]=SH(ds).slice(0,2);}
  else{const P=[[1,2,2,4],[1,2,3,6],[1,2,4,8],[1,3,2,6],[2,3,4,6],[1,4,2,8],[3,4,6,8]];[a,b,cc,d]=PK(P);if(Math.random()<.5){a=a+(Math.random()<.5&&a+1<b?1:0);}}
  if(Math.random()<.5){[a,b,cc,d]=[cc,d,a,b];}
  const s=sgn(a*d-cc*b);
  const ex=b===d?`<p>Same size pieces (${FN[b][1]}). ${a} ${s==='='?'is the same as':s==='&gt;'?'is more than':'is less than'} ${cc}.</p>`:a===cc?`<p>Same number of pieces (${a}). ${cap(FN[b][1])} are ${b<d?'bigger':'smaller'} than ${FN[d][1]}.</p>`:`<p>Make the bottoms match: ${F(a,b)} = ${F(a*lcm(b,d)/b,lcm(b,d))} and ${F(cc,d)} = ${F(cc*lcm(b,d)/d,lcm(b,d))}.</p>`;
  return choice({tpl:`${F(a,b)} {A} ${F(cc,d)}`,prompt:'Compare the fractions.',text:`cmp ${a}/${b} ${cc}/${d}`,fast:12,
   explain:ex+`<p>So ${F(a,b)} <b>${s}</b> ${F(cc,d)}</p>`,nudge:b===d?`<p>Same bottom: more pieces means more.</p>`:a===cc?`<p>Same top: which pieces are bigger, ${FN[b][1]} or ${FN[d][1]}?</p>`:`<p>Picture both as bars. Do they cover the same amount?</p>`},s,CMP);},
 equivHard:c=>{const v=0;
  if(v===0){const P=[[3,4,8],[2,3,6],[1,3,6],[1,4,8],[1,2,8],[1,2,6]];const [a,b,d]=PK(P);const m=d/b;const rev=Math.random()<.5;
   return rev?{tpl:`${F(a*m,d)} = ${FA(b)}`,answer:a,text:`H${a*m}/${d}=?/${b}`,fast:15,explain:`<p>${d} ÷ ${m} = ${b}, so ${a*m} ÷ ${m} = <b>${a}</b>.</p>`,nudge:`<p>How many ${FN[d][1]} make one ${FN[b][0]}?</p>`}
    :{tpl:`${F(a,b)} = ${FA(d)}`,answer:a*m,text:`H${a}/${b}=?/${d}`,fast:15,explain:`<p>Each ${FN[b][0]} is ${m} ${FN[d][1]}.</p><p>${a} × ${m} = <b>${a*m}</b></p>`,nudge:`<p>How many ${FN[d][1]} make one ${FN[b][0]}?</p>`};}
  const n=PK(D3),m=R(2,3);
  if(v===1)return {prompt:`How many ${FN[n][1]} make ${m} wholes?`,tpl:`${m} = ${FA(n)}`,answer:m*n,text:`H${m}=?/${n}`,fast:12,explain:`<p>1 whole = ${n} ${FN[n][1]}, so ${m} wholes = ${m} × ${n} = <b>${m*n}</b>.</p>`,nudge:`<p>Count ${n} ${FN[n][1]} for each whole.</p>`};
  return {prompt:'Write it as a whole number.',tpl:`${F(m*n,n)} = {A}`,answer:m,text:`H${m*n}/${n}`,fast:12,explain:`<p>Every ${n} ${FN[n][1]} make 1 whole. ${m*n} ÷ ${n} = <b>${m}</b>.</p>`,nudge:`<p>How many groups of ${n} are in ${m*n}?</p>`};},
 whoMore:c=>{const [p,q]=SH(['Gizmo','Ozzy','Coach Flex','Nana Paws','Grumbleroot',c.name]);const f=PK(['pie','pizza','cake','pan of brownies']);let a,b,cc,d;
  if(Math.random()<.55){b=d=PK([4,6,8]);a=R(1,b-2);do{cc=R(1,b-1);}while(cc===a||a+cc>b);}else{a=cc=R(1,2);[b,d]=SH(D3.filter(x=>x>a)).slice(0,2);}
  const r=a*d>cc*b?p:q;const same=b===d;
  return st(choice({prompt:`${p} ate ${F(a,b)} of a ${f}. ${q} ate ${F(cc,d)} of ${same?'the same':'a same-size'} ${f}. Who ate more?`,tpl:'{A}',text:`whomore ${p} ${q} ${a}/${b} ${cc}/${d}`,fast:20,
   explain:same?`<p>Same size pieces. ${Math.max(a,cc)} ${FN[b][1]} is more than ${Math.min(a,cc)}.</p><p><b>${r}</b> ate more.</p>`:`<p>Both ate ${a} ${PL(a,'piece')}. ${cap(FN[Math.min(b,d)][1])} are bigger than ${FN[Math.max(b,d)][1]}.</p><p><b>${r}</b> ate more.</p>`,
   nudge:same?`<p>The pieces are the same size. Who has more of them?</p>`:`<p>Same number of pieces. Whose pieces are bigger?</p>`},r,[p,q]));},
 inAll:c=>{const n=PK([6,8]);const a=R(1,n-3),b=R(1,n-1-a);const [p,q]=SH(['Gizmo','Ozzy','Coach Flex','Nana Paws',PN(c),c.name]);const left=Math.random()<.5;const f=PK(['pie','pizza','cake','pan of lasagna']);
  return st({prompt:`A ${f} is cut into <b>${n}</b> equal slices. ${p} eats ${F(a,n)} of it. ${q} eats ${F(b,n)} of it. ${left?'What fraction of the '+f+' is left?':'What fraction did they eat in all?'}`,tpl:`${FA(n)}`,answer:left?n-a-b:a+b,text:`inall ${left} ${a} ${b}/${n} ${p} ${q}`,fast:25,
   explain:`<p>Eaten: ${a} + ${b} = ${a+b} ${FN[n][1]}.</p>${left?`<p>Left: ${n} − ${a+b} = <b>${n-a-b}</b>, so ${F(n-a-b,n)}.</p>`:`<p>So they ate <b>${F(a+b,n)}</b>.</p>`}`,nudge:`<p>The slices are all ${FN[n][1]}. Add the slices they ate${left?', then take that from the whole':''}.</p>`});},
 slices:c=>{const n=PK([4,6,8]);const w=PK([2,3]);const tot=n*w;const s=R(n+1,tot-1);const f=PK(['pies','pizzas','cakes','quiches']);
  return st({prompt:`Ms. Rosa bakes <b>${w}</b> ${f} and cuts each into <b>${n}</b> equal slices. She sells <b>${s}</b> slices. How many slices are left?`,tpl:'{A} slices',answer:tot-s,text:`slices ${w} ${n} ${s} ${f}`,fast:30,
   explain:`<p>Slices: ${w} × ${n} = ${tot}.</p><p>${tot} − ${s} = <b>${tot-s}</b> left.</p>`,nudge:`<p>Step 1: all the slices. Step 2: take away the ones sold.</p>`});},
nlinePick:c=>{const n=PK([3,4,6,8]);const k=R(1,n-1);const R2=F(k,n);const w=[[k+1,n],[k-1,n],[n-k,n],[k,n+2],[1,k+1],[n,k]].filter(x=>x[0]>0&&x[1]>0&&x[0]*n!==k*x[1]).map(x=>F(x[0],x[1]));
  return choice({prompt:`Which fraction is at the dot?${NL(n,k)}`,tpl:'{A}',text:`nlp ${k}/${n}`,fast:15,explain:`<p>0 to 1 is cut into ${n} equal parts, so each jump is ${F(1,n)}.</p><p>The dot is ${k} ${PL(k,'jump')} from 0: <b>${R2}</b></p>`,nudge:`<p>Count the parts from 0 to 1. Then count jumps to the dot.</p>`},R2,SH(w));},
 track2:c=>{const n=PK([2,3,4]);let k;do{k=R(n+1,2*n-1);}while(k%n===0);const S=PK([['Coach Flex runs on a path','He stops at','How far has he run?'],['Ozzy\'s train runs on a track','The train stops at','How far has the train gone?'],['Skyla the eagle flies along a river','She lands at','How far has she flown?']]);
  return st({prompt:`${S[0]} that is 2 miles long. Each mile is cut into <b>${n}</b> equal parts by signs. ${S[1]} the <b>${ord(k)}</b> sign. ${S[2]}${NL(n,k,2)}`,tpl:`${FA(n)} miles`,answer:k,text:`tr2 ${S[0].slice(0,6)} ${k}/${n}`,fast:30,
   explain:`<p>Each part is ${F(1,n)} mile. ${k} parts = ${F(k,n)} miles.</p><p>Top number <b>${k}</b>.</p>`,nudge:`<p>Count every part from 0, even past the 1-mile mark.</p>`});},
 pieWholes:c=>{const n=PK([3,4,6,8]);const w=R(2,4);const sold=R(1,w-1);const S=PK([['Ms. Rosa','pie','pies','sells'],['Nana Paws','pan of brownies','pans of brownies','gives away'],['Gizmo','pizza','pizzas','eats']]);
  return st({prompt:`${S[0]} has <b>${n*w}</b> slices. Each slice is ${F(1,n)} of a ${S[1]}. She puts them back together into whole ${S[2]}, then ${S[3]} <b>${sold}</b> whole ${sold===1?S[1]:S[2]}. How many whole ${S[2]} are left?`.replace('She puts',S[0]==='Gizmo'?'He puts':'She puts'),tpl:`{A} ${S[2]}`,answer:w-sold,text:`pw ${S[0]} ${n} ${w} ${sold}`,fast:40,
   explain:`<p>${n} slices make 1 whole, so ${F(n*w,n)} = ${n*w} ÷ ${n} = ${w} wholes.</p><p>${w} − ${sold} = <b>${w-sold}</b></p>`,nudge:`<p>How many slices make one whole? How many wholes is ${n*w} slices?</p>`});},
 stripes3:c=>{const n=PK([6,8]);const a=R(1,n-3),b=R(1,n-1-a);const S=PK([['Nana Paws knits a scarf with','equal stripes','red','blue','green'],['Gizmo paints a rocket with','equal bands','silver','orange','black'],['Dr. Quartz lines up','crystals','purple','pink','clear']]);
  return st({prompt:`${S[0]} <b>${n}</b> ${S[1]}. <b>${a}</b> ${a===1?'is':'are'} ${S[2]}, <b>${b}</b> ${b===1?'is':'are'} ${S[3]} and the rest are ${S[4]}. What fraction is ${S[4]}?`,tpl:FA(n),answer:n-a-b,text:`st3 ${S[0].slice(0,5)} ${n} ${a} ${b}`,fast:35,
   explain:`<p>${S[4]}: ${n} − ${a} − ${b} = ${n-a-b}.</p><p>${n-a-b} out of ${n}: ${F(n-a-b,n)}. Top <b>${n-a-b}</b>.</p>`,nudge:`<p>First count how many are ${S[4]}. Then write it out of ${n}.</p>`});},
mistake3:c=>{const who=PK(['Ozzy','Gizmo','Coach Flex','the Elder Wiz','Grumbleroot the troll']);const W=cap(who);const v=R(0,3);const NM='He is right!';
  if(v===0){const [x,y]=SH([2,3,4,6,8]).slice(0,2).sort((p,q)=>p-q);return mistake({text:`m3a ${x} ${y} ${who}`,explain:`<p>More equal parts means <b>smaller</b> parts, so ${F(1,y)} &lt; ${F(1,x)}.</p><p>Answer: <b>more parts make smaller pieces</b>.</p>`,nudge:`<p>Picture two same-size pizzas: one cut into ${x}, one into ${y}.</p>`},W,`${F(1,y)} is bigger than ${F(1,x)} because ${y} is bigger than ${x}`,'More parts make smaller pieces',['The tops are different',NM,'He should add the numbers']);}
  if(v===1){const [a,b,m]=PK([[1,2,2],[1,2,3],[1,2,4],[1,3,2],[2,3,2],[1,4,2],[3,4,2]]);return mistake({text:`m3b ${a}/${b} ${m} ${who}`,explain:`<p>Cut each part of ${F(a,b)} into ${m}: you get ${F(a*m,b*m)}. They are the same amount.</p><p>Answer: <b>${NM}</b></p>`,nudge:`<p>Draw both on the same size bar.</p>`},W,`${F(a*m,b*m)} is the same as ${F(a,b)}`,NM,['The bottoms must match','Bigger numbers mean a bigger fraction','The tops must match']);}
  if(v===2){const n=PK([3,4,6,8]);const k=R(1,n-1);return mistake({text:`m3c ${k}/${n} ${who}`,explain:`<p>The line from 0 to 1 has ${n} equal parts, so each jump is ${F(1,n)}. The dot is at ${F(k,n)}.</p><p>Answer: <b>he counted the marks, not the parts</b>.</p>`,nudge:`<p>Count the equal parts between 0 and 1.</p>`+NL(n,k)},W,`the dot is at ${F(k,n+1)}${NL(n,k)}`,'He counted the marks, not the parts',[NM,'The top should be '+(k+1),'Fractions can\'t go on a line']);}
  const n=PK([4,6,8]);const a=R(2,n-1);return mistake({text:`m3d ${a}/${n} ${who}`,explain:`<p>Same size parts: ${a} parts is more than ${a-1} parts, so ${F(a,n)} &gt; ${F(a-1,n)}.</p><p>Answer: <b>${NM}</b></p>`,nudge:`<p>Same bottom number means same size parts.</p>`},W,`${F(a,n)} is more than ${F(a-1,n)}`,NM,['More parts make smaller pieces','The bottoms are the same, so they are equal','He should compare the bottoms']);},
 feedFriends:c=>{const n=PK([2,3,4,6,8]);const w=R(2,4);const got=R(1,w*n-1);const S=PK([['Ms. Rosa','pies','pie','friend'],['Nana Paws','pans of cornbread','pan','dog walker'],['Gizmo','pizzas','pizza','robot helper']]);
  return st({prompt:`${S[0]} has <b>${w}</b> ${S[1]}. Each ${S[3]} gets ${F(1,n)} of a ${S[2]}. <b>${got}</b> ${PL(got,S[3])} already got a piece. How many more ${S[3]}s can get a piece?`,tpl:`{A} ${S[3]}s`,answer:w*n-got,text:`ff ${S[0]} ${w} ${n} ${got}`,fast:40,
   explain:`<p>Each ${S[2]} has ${n} pieces of ${F(1,n)}: ${w} × ${n} = ${w*n} pieces.</p><p>${w*n} − ${got} = <b>${w*n-got}</b></p>`,nudge:`<p>How many ${F(1,n)} pieces are in ${w} wholes?</p>`});},
 jumpsLeft:c=>{const n=PK([2,3,4]);let k;do{k=R(1,2*n-1);}while(k===n);const S=PK([['Skyla the eagle flies from her nest to the lake, 2 miles away.','She is at'],['Coach Flex jogs to the gym, 2 miles away.','He is at'],['Ozzy\'s train rides to the Depot, 2 miles away.','The train is at']]);
  return st({prompt:`${S[0]} Signs mark every ${F(1,n)} mile. ${S[1]} ${F(k,n)} mile${k>n?'s':''}. How many more ${F(1,n)}-mile jumps to get there?${NL(n,k,2)}`,tpl:'{A} jumps',answer:2*n-k,text:`jl ${S[0].slice(0,6)} ${k}/${n}`,fast:40,
   explain:`<p>2 miles = ${F(2*n,n)}. The dot is at ${F(k,n)}.</p><p>Count the jumps from ${k} to ${2*n}: <b>${2*n-k}</b>.</p>`,nudge:`<p>How many ${F(1,n)} jumps make 2 miles? How many are done?</p>`});},
whichTrue3:c=>{const [a,b,m]=PK([[1,2,2],[1,2,4],[1,3,2],[2,3,2],[1,4,2],[3,4,2]]);const [x,y]=SH([2,3,4,6,8]).slice(0,2).sort((p,q)=>p-q);const n=PK([4,6,8]);const k=R(1,n-2);
  const st3=(p,q,op,r,s)=>({l:`${F(p,q)} ${op==='>'?'&gt;':'='} ${op==='1'?'1':F(r,s)}`.replace(' = 1 1',' = 1'),v:op==='>'?p*s>r*q:op==='1'?p===q:p*s===r*q});
  const all=[st3(a,b,'=',a*m,b*m),st3(1,x,'>',1,y),{l:`${F(n,n)} = 1`,v:true},st3(k+1,n,'>',k,n),st3(1,y,'>',1,x),st3(k,n,'>',k+1,n),{l:`${F(n-1,n)} = 1`,v:false},st3(a,b,'=',a+1,b*m),{l:`${F(2*n,n)} = 1`,v:false},st3(a,b,'=',a,b*m)];
  const T=all.filter(x=>x.v),Fa=SH(all.filter(x=>!x.v));const r=PK(T).l;
  return choice({prompt:'Which one is true?',tpl:'{A}',text:`wt3 ${r}`,fast:25,explain:`<p><b>${r}</b> is true. The others are not: check each one with a picture of a fraction bar.</p>`,nudge:`<p>Draw each pair as bars. Same size? Which is bigger?</p>`},r,Fa.slice(0,3).map(x=>x.l));}
};
PD('frac',3,[
 [f3.shaded,f3.notShaded,f3.unit,f3.setStory,f3.unitCount,f2.isWhole,f2.piecesOfWholes,f2.lookDiff,f3.nline],
 [f3.nline,f3.wholes,f3.unitCount,f3.track,f3.nlinePick,f3.setStory,f3.stripes3,f3.unit,f3.shaded],
 [f3.equiv,f3.whichEq,f3.nline2,f3.sameShare,f3.wholes,f3.nlinePick,f3.equivHard,f3.track2,f3.feedFriends],
 [f3.compare,f3.equivHard,f3.nline2,f3.mistake3,f3.wholes,f3.track2,f3.whichTrue3,f3.sameShare,f3.feedFriends],
 [f3.whoMore,f3.slices,f3.pieWholes,f3.sameShare,f3.stripes3,f3.mistake3,f3.feedFriends,f3.jumpsLeft,f3.whichTrue3]]);

/* ----- grade 4: equivalent, compare, add/subtract like denominators, mixed numbers, × whole, decimals ----- */
const EQ4=[[2,4],[2,6],[2,8],[2,10],[2,12],[3,6],[3,12],[4,8],[4,12],[5,10],[6,12],[10,100]];
const D4=[3,4,5,6,8,10,12];
const f4={
 equiv:c=>{const [b,d]=PK(EQ4);const m=d/b;let a=R(1,b-1);if(b===10)a=R(1,9);
  return {tpl:`${F(a,b)} = ${FA(d)}`,answer:a*m,text:`eq ${a}/${b}=?/${d}`,fast:12,explain:`<p>${b} × <b>${m}</b> = ${d}, so multiply the top by ${m} too.</p><p>${a} × ${m} = <b>${a*m}</b></p>`,nudge:`<p>What times ${b} makes ${d}? Do the same to the top.</p>`};},
 equivDen:c=>{const [b,d]=PK(EQ4.slice(0,11));const m=d/b;const a=R(1,b-1);
  return {prompt:'Find the missing bottom number.',tpl:`${F(a,b)} = <span class="fr"><span>${a*m}</span><span>{A}</span></span>`,answer:b*m,text:`eqden ${a}/${b}=${a*m}/?`,fast:15,explain:`<p>The top went from ${a} to ${a*m}: × ${m}.</p><p>Do the same to the bottom: ${b} × ${m} = <b>${b*m}</b></p>`,nudge:`<p>What did the top get multiplied by?</p>`};},
 reduce:c=>{const [b,d]=PK(EQ4.slice(0,11));const m=d/b;const a=R(1,b-1);
  return {tpl:`${F(a*m,d)} = ${FA(b)}`,answer:a,text:`red ${a*m}/${d}=?/${b}`,fast:12,explain:`<p>${d} ÷ ${m} = ${b}, so divide the top by ${m} too.</p><p>${a*m} ÷ ${m} = <b>${a}</b></p>`,nudge:`<p>What divides ${d} to make ${b}? Divide the top the same way.</p>`};},
 equivStory:c=>{const [b,d]=PK([[2,8],[4,8],[4,12],[3,12],[5,10],[3,6],[2,10]]);const m=d/b;const a=R(1,b-1);
  const S=PK([['Ozzy\'s train has gone','of the way to the Depot. The map is marked in','The train has gone how many'],['Coach Flex has run','of the race. The track is marked in','He has run how many'],['Skyla the eagle has flown','of the way home. Her map is marked in','She has flown how many'],['Nana Paws has knit','of a scarf. Her pattern is counted in','She has knit how many']]);
  return st({prompt:`${S[0]} ${F(a,b)} ${S[1]} <b>${FN[d][1]}</b>. ${S[2]} ${FN[d][1]}?`,tpl:FA(d),answer:a*m,text:`eqst ${S[0].slice(0,6)} ${a}/${b} ${d}`,fast:20,
   explain:`<p>${b} × ${m} = ${d}, so ${a} × ${m} = <b>${a*m}</b>.</p><p>${F(a,b)} = ${F(a*m,d)}</p>`,nudge:`<p>Write ${F(a,b)} with a bottom number of ${d}.</p>`});},
 compare:c=>{const P=[[2,3],[2,4],[2,5],[3,4],[2,6],[3,6],[4,8],[2,8],[5,10],[3,5],[4,6],[6,8],[4,5],[3,8],[4,10],[5,6]];let [b,d]=SH(PK(P));let a=R(1,b-1),cc=R(1,d-1);
  if(Math.random()<.15){const L=lcm(b,d);/* make equal if possible */const g=[1,2,3,4,5,6,7,8,9].find(t=>t*L/b<L&&(t*L/b)%(L/d)===0&&t<b);if(g){a=g;cc=g*(L/b)/(L/d);}}
  const s=sgn(a*d-cc*b);const L=lcm(b,d);
  return choice({tpl:`${F(a,b)} {A} ${F(cc,d)}`,prompt:'Compare. Make the bottom numbers match first, or think about ½.',text:`c4 ${a}/${b} ${cc}/${d}`,fast:20,
   explain:`<p>Use ${FN[L]?FN[L][1]:L+'ths'}: ${F(a,b)} = ${F(a*L/b,L)} and ${F(cc,d)} = ${F(cc*L/d,L)}.</p><p>${a*L/b} ${s} ${cc*L/d}, so ${F(a,b)} <b>${s}</b> ${F(cc,d)}</p>`,nudge:`<p>Change both to ${L}ths, then compare the tops.</p>`},s,CMP);},
 addLike:c=>{const n=PK(D4);const a=R(1,n-1),b=R(1,n-1);const t=a+b;
  return {vis:t<=n?{t:'bar',n,k:a,k2:b}:undefined,tpl:`${F(a,n)} + ${F(b,n)} = ${FA(n)}`,answer:t,text:`al ${a}+${b}/${n}`,fast:12,explain:`<p>Same bottom number: add the tops. ${a} + ${b} = <b>${t}</b>.</p><p>${F(a,n)} + ${F(b,n)} = ${F(t,n)}</p>`,nudge:`<p>Keep the bottom (${n}). Add the top numbers.</p>`};},
 subLike:c=>{const n=PK(D4);const one=Math.random()<.3;const a=one?n:R(2,n-1);const b=R(1,a-1);
  return {vis:{t:'bar',n,k:a,x:b},tpl:`${one?'1':F(a,n)} − ${F(b,n)} = ${FA(n)}`,answer:a-b,text:`sl ${one?1:a}-${b}/${n}`,fast:12,explain:`<p>${one?`1 = ${F(n,n)}. `:''}Same bottom: subtract the tops. ${a} − ${b} = <b>${a-b}</b>.</p>`,nudge:one?`<p>Write 1 as ${F('?',n)} first.</p>`:`<p>Keep the bottom (${n}). Subtract the tops.</p>`};},
 decompose:c=>{const n=PK([4,5,6,8,10,12]);const t=R(3,n-1);const a=R(1,t-1);
  return {prompt:'Break the fraction into two parts.',tpl:`${F(t,n)} = ${F(a,n)} + ${FA(n)}`,answer:t-a,text:`dec ${t}=${a}+?/${n}`,fast:12,explain:`<p>${a} + ? = ${t}, so ? = <b>${t-a}</b>.</p>`,nudge:`<p>What do you add to ${a} to make ${t}?</p>`};},
 likeStory:c=>{const S=PK([['Nana Paws knits','of a scarf on Monday and','on Tuesday','How much of the scarf has she knit?','How much of the scarf is still left to knit?'],['Gizmo paints','of his robot in the morning and','after lunch','How much of the robot is painted?','How much of the robot is not painted yet?'],['Coach Flex runs','of the trail before breakfast and','after breakfast','How much of the trail has he run?','How much of the trail is left?'],['Skyla the eagle flies','of the way to the mountain and rests. Then she flies','more','How much of the way has she flown?','How much of the way is left?']]);
  const n=PK([5,6,8,10,12]);const a=R(1,n-2),b=R(1,n-1-a);const left=Math.random()<.45;
  return st({prompt:`${S[0]} ${F(a,n)} ${S[1]} ${F(b,n)} ${S[2]}. ${left?S[4]:S[3]}`,tpl:FA(n),answer:left?n-a-b:a+b,text:`ls ${S[0].slice(0,6)} ${a} ${b}/${n} ${left}`,fast:25,
   explain:`<p>${F(a,n)} + ${F(b,n)} = ${F(a+b,n)}</p>${left?`<p>The whole is ${F(n,n)}. ${n} − ${a+b} = <b>${n-a-b}</b>, so ${F(n-a-b,n)}.</p>`:`<p>Top: ${a} + ${b} = <b>${a+b}</b></p>`}`,nudge:left?`<p>Add the two parts. Then take that from the whole, ${F(n,n)}.</p>`:`<p>Same bottom number, so add the tops.</p>`});},
 mixAdd:c=>{const n=PK([3,4,5,6,8,10]);const w1=R(1,4),w2=R(1,3);const a=R(1,n-1),b=R(1,n-1);const t=a+b;const W=w1+w2+(t>=n?1:0),r=t%n;
  if(r===0)return {tpl:`${MX(w1,a,n)} + ${MX(w2,b,n)} = {A}`,answer:W,text:`ma ${w1} ${a} ${w2} ${b}/${n}`,fast:20,explain:`<p>Fractions: ${F(a,n)} + ${F(b,n)} = ${F(t,n)} = 1 whole.</p><p>Wholes: ${w1} + ${w2} + 1 = <b>${W}</b></p>`,nudge:`<p>Add the fractions first. Do they make a whole?</p>`};
  return {tpl:`${MX(w1,a,n)} + ${MX(w2,b,n)} = ${W} ${FA(n)}`,answer:r,text:`ma ${w1} ${a} ${w2} ${b}/${n}`,fast:20,
   explain:`<p>Fractions: ${F(a,n)} + ${F(b,n)} = ${F(t,n)}${t>n?` = 1 ${F(r,n)} (that 1 joins the wholes)`:''}.</p><p>Wholes: ${w1} + ${w2}${t>n?' + 1':''} = ${W}. Answer: ${W} ${F(r,n)}, top <b>${r}</b>.</p>`,nudge:`<p>Add wholes and fractions separately.${t>n?' The fractions make more than 1!':''}</p>`};},
 mixSub:c=>{const n=PK([3,4,5,6,8,10]);const w1=R(2,5);const w2=R(1,w1-1);const a=R(1,n-1),b=R(1,n-1);let W,r,ex;
  if(a>=b){W=w1-w2;r=a-b;ex=`<p>Fractions: ${a} − ${b} = ${r}. Wholes: ${w1} − ${w2} = ${W}.</p>`;}else{W=w1-w2-1;r=a+n-b;ex=`<p>${F(b,n)} is more than ${F(a,n)}, so trade 1 whole: ${MX(w1,a,n)} = ${MX(w1-1,a+n,n)}.</p><p>${a+n} − ${b} = ${r}. Wholes: ${w1-1} − ${w2} = ${W}.</p>`;}
  if(r===0)return {tpl:`${MX(w1,a,n)} − ${MX(w2,b,n)} = {A}`,answer:W,text:`ms ${w1} ${a} ${w2} ${b}/${n}`,fast:20,explain:ex+`<p>Answer: <b>${W}</b></p>`,nudge:`<p>Subtract the fractions, then the wholes.</p>`};
  return {tpl:`${MX(w1,a,n)} − ${MX(w2,b,n)} = ${W?W+' ':''}${FA(n)}`,answer:r,text:`ms ${w1} ${a} ${w2} ${b}/${n}`,fast:25,explain:ex+`<p>Answer: ${MX(W,r,n)}, top <b>${r}</b>.</p>`,nudge:a>=b?`<p>Subtract the fractions, then the wholes.</p>`:`<p>${F(b,n)} is bigger than ${F(a,n)}. Trade 1 whole for ${F(n,n)} first.</p>`};},
 mixImp:c=>{const n=PK([2,3,4,5,6,8]);const w=R(1,4);const a=R(1,n-1);const top=w*n+a;
  if(Math.random()<.5)return {prompt:'Write as a fraction.',tpl:`${MX(w,a,n)} = ${FA(n)}`,answer:top,text:`mi ${w} ${a}/${n}`,fast:15,explain:`<p>${w} ${PL(w,'whole')} = ${w} × ${n} = ${w*n} ${FN[n][1]}.</p><p>${w*n} + ${a} = <b>${top}</b></p>`,nudge:`<p>How many ${FN[n][1]} are in ${w} ${PL(w,'whole')}? Add ${a} more.</p>`};
  return {prompt:'Write as a mixed number.',tpl:`${F(top,n)} = ${w} ${FA(n)}`,answer:a,text:`im ${top}/${n}`,fast:15,explain:`<p>${w} wholes use ${w} × ${n} = ${w*n} ${FN[n][1]}.</p><p>${top} − ${w*n} = <b>${a}</b> left over.</p>`,nudge:`<p>How many ${FN[n][1]} do ${w} wholes use? What is left?</p>`};},
 timesWhole:c=>{const n=PK([3,4,5,6,8,10,12]);const a=R(1,Math.min(5,n-1));const k=R(2,6);
  return {tpl:`${k} × ${F(a,n)} = ${FA(n)}`,answer:k*a,text:`tw ${k}x${a}/${n}`,fast:15,explain:`<p>${k} groups of ${F(a,n)}: ${k} × ${a} = <b>${k*a}</b> ${FN[n][1]}.</p>`,nudge:`<p>Multiply the top by ${k}. The bottom stays ${n}.</p>`};},
 timesStory:c=>{const S=PK([['Coach Flex runs','mile every day for','days','How many fourths of a mile does he run in all?',4],['Ms. Rosa uses','cup of sugar in each cake. She bakes','cakes','How many thirds of a cup does she use?',3],['Nana Paws walks the dogs','mile each trip. She makes','trips','How many fifths of a mile does she walk?',5],['Gizmo uses','of a battery for each robot. He builds','robots','How many eighths of a battery does he use?',8],['Skyla the eagle flies','mile each lap. She flies','laps','How many sixths of a mile does she fly?',6]]);
  const n=S[4];const a=R(1,n-1);const k=R(3,7);
  return st({prompt:`${S[0]} <b>${F(a,n)}</b> ${S[1]} <b>${k}</b> ${S[2]}. ${S[3]}`,tpl:FA(n),answer:a*k,text:`ts ${S[0].slice(0,6)} ${a}/${n} ${k}`,fast:25,
   explain:`<p>${k} × ${F(a,n)} = ${F(k*a,n)}</p><p>${k} × ${a} = <b>${k*a}</b> ${FN[n][1]}.</p>`,nudge:`<p>That's ${k} groups of ${F(a,n)}. Multiply the top by ${k}.</p>`});},
 tenHund:c=>{const k=R(1,9);if(Math.random()<.5)return {vis:{t:'g100',cols:k},prompt:'Write the shaded part as hundredths.',tpl:`${F(k,10)} = ${FA(100)}`,answer:k*10,text:`th ${k}/10`,fast:12,explain:`<p>Each tenth is 10 hundredths. ${k} × 10 = <b>${k*10}</b>.</p>`,nudge:`<p>One column is ${F(1,10)} and has 10 little squares.</p>`};
  return {tpl:`${F(k*10,100)} = ${FA(10)}`,answer:k,text:`ht ${k*10}/100`,fast:12,explain:`<p>10 hundredths make 1 tenth. ${k*10} ÷ 10 = <b>${k}</b>.</p>`,nudge:`<p>How many tens are in ${k*10}?</p>`};},
 addTH:c=>{const a=R(1,8);let b;do{b=R(1,99-a*10);}while(b%10===0);const t=a*10+b;
  return {vis:{t:'g100',cells:t},tpl:`${F(a,10)} + ${F(b,100)} = ${FA(100)}`,answer:t,text:`ath ${a}/10+${b}/100`,fast:15,explain:`<p>${F(a,10)} = ${F(a*10,100)}.</p><p>${a*10} + ${b} = <b>${t}</b></p>`,nudge:`<p>Change ${F(a,10)} into hundredths first.</p>`};},
 decimal:c=>{const v=R(0,3);
  if(v===0){const k=R(1,9);return {prompt:'Write as a decimal.',tpl:`${F(k,10)} = {A}`,answer:k,dp:1,text:`dec ${k}/10`,fast:12,explain:`<p>Tenths go in the first place after the dot: <b>0.${k}</b></p>`,nudge:`<p>${F(k,10)} is ${k} tenths.</p>`};}
  if(v===1){let k;do{k=R(1,99);}while(k%10===0);return {prompt:'Write as a decimal.',tpl:`${F(k,100)} = {A}`,answer:k,dp:2,text:`dec ${k}/100`,fast:12,explain:`<p>Hundredths use two places after the dot: <b>0.${P2(k)}</b></p>`,nudge:`<p>${F(k,100)} needs 2 digits after the dot.${k<10?' Put a 0 first!':''}</p>`};}
  if(v===2){const w=R(1,5),k=R(1,9);return {prompt:'Write as a decimal.',tpl:`${MX(w,k,10)} = {A}`,answer:w*10+k,dp:1,text:`dec ${w} ${k}/10`,fast:12,explain:`<p>${w} wholes and ${k} tenths: <b>${w}.${k}</b></p>`,nudge:`<p>The whole number goes before the dot.</p>`};}
  let k;do{k=R(1,99);}while(k%10===0);return {prompt:'Write the decimal as a fraction.',tpl:`0.${P2(k)} = ${FA(100)}`,answer:k,text:`frac 0.${P2(k)}`,fast:12,explain:`<p>Two places after the dot = hundredths. 0.${P2(k)} = <b>${F(k,100)}</b></p>`,nudge:`<p>How many hundredths is 0.${P2(k)}?</p>`};},
 cmpDec:c=>{const v=R(0,3);let x,y;
  if(v===0){x=R(1,9)*10;y=R(11,99);}else if(v===1){x=R(1,9);y=R(1,9)*10;}else if(v===2){x=R(1,9)*10;y=x;}else{x=R(11,99);y=R(11,99);}
  if(Math.random()<.5)[x,y]=[y,x];const s=sgn(x-y);const sx=x%10===0&&v!==2?D(x/10,1):D(x,2),sy=y%10===0&&v!==3?D(y/10,1):D(y,2);
  const show=(v===2&&Math.random()<.5);const L=show?D(x/10,1):sx,Rr=show?D(y,2):sy;
  return choice({tpl:`${L} {A} ${Rr}`,prompt:'Compare the decimals.',text:`cd ${L} ${Rr}`,fast:15,explain:`<p>Write both as hundredths: ${D(x,2)} and ${D(y,2)}.</p><p>${x} hundredths ${s} ${y} hundredths, so <b>${s}</b>.</p>`,nudge:`<p>Give both numbers 2 digits after the dot, then compare.</p>`},s,CMP);},
 timesMixed:c=>{const n=PK([3,4,5,6,8]);let a,k;do{a=R(1,n-1);k=R(2,6);}while((k*a)%n===0||k*a<n);const t=k*a;const w=Math.floor(t/n),r=t%n;
  return {prompt:'Multiply and write as a mixed number.',tpl:`${k} × ${F(a,n)} = ${w} ${FA(n)}`,answer:r,text:`tm ${k}x${a}/${n}`,fast:20,explain:`<p>${k} × ${F(a,n)} = ${F(t,n)}.</p><p>${w} wholes use ${w*n}. ${t} − ${w*n} = <b>${r}</b>, so ${MX(w,r,n)}.</p>`,nudge:`<p>Multiply first: ${k} × ${a} ${FN[n][1]}. Then pull out the wholes.</p>`};},
 /* legend */
 runDays:c=>{const S=PK([['Coach Flex runs','mile a day for','days. How far does he run in all?','miles'],['Nana Paws uses','of a ball of yarn for each hat. She knits','hats. How much yarn does she use?','balls of yarn'],['Ms. Rosa uses','cup of flour for each batch of muffins. She makes','batches. How much flour does she use?','cups'],['Skyla the eagle flies','mile on each trip to the lake. She makes','trips. How far does she fly?','miles']]);
  const n=PK([3,4,5,6,8]);let a,k;do{a=R(1,n-1);k=R(3,7);}while((k*a)%n===0||k*a<n);const t=k*a,w=Math.floor(t/n),r=t%n;
  return st({prompt:`${S[0]} <b>${F(a,n)}</b> ${S[1]} <b>${k}</b> ${S[2]}`,tpl:`${w} ${FA(n)} ${S[3]}`,answer:r,text:`rd ${S[0].slice(0,6)} ${a}/${n} ${k}`,fast:30,
   explain:`<p>${k} × ${F(a,n)} = ${F(t,n)}.</p><p>${t} ${FN[n][1]} = ${w} wholes and ${r} more: ${MX(w,r,n)}. Top <b>${r}</b>.</p>`,nudge:`<p>Step 1: multiply ${k} × ${F(a,n)}. Step 2: change it to a mixed number.</p>`});},
 pieDay:c=>{const P=R(2,3);const a=R(3,7),b=R(2,7);const used=a+b;const left=P*8-used;const w=Math.floor(left/8),r=left%8;const f=PK(['pies','cakes','pizzas','quiches']);
  if(r===0)return pieDay(c);
  return st({prompt:`Ms. Rosa has <b>${P}</b> whole ${f}, each cut into eighths. She sells ${F(a,8)} of a ${f.replace(/s$/,'')} in the morning and ${F(b,8)} of a ${f.replace(/s$/,'')} in the afternoon. How much is left?`,tpl:`${w?w+' ':''}${FA(8)} ${w?f:f.replace(/s$/,'')}`,answer:r,text:`pd ${P} ${a} ${b} ${f}`,fast:30,
   explain:`<p>Sold: ${a} + ${b} = ${used} eighths. She had ${P} × 8 = ${P*8} eighths.</p><p>${P*8} − ${used} = ${left} eighths = ${MX(w,r,8)}. Top <b>${r}</b>.</p>`,nudge:`<p>Count everything in eighths: how many eighths in ${P} ${f}?</p>`});},
whoGrew:c=>{const P=[[3,5,7,10],[1,2,3,8],[2,3,5,6],[3,4,5,8],[2,5,3,10],[1,2,2,5],[3,4,7,12],[5,6,3,4],[1,3,3,12],[4,5,7,10]];let [a,b,cc,d]=PK(P);if(Math.random()<.5)[a,b,cc,d]=[cc,d,a,b];
  const S=PK([['Dr. Quartz','Gizmo','\'s crystal grew','inch','Whose crystal grew more?'],['Coach Flex','Skyla the eagle',' went','mile','Who went farther?'],['Nana Paws','Ms. Rosa',' used','cup of milk','Who used more milk?'],['Ozzy','the Elder Wiz','\'s train ride lasted','hour','Whose ride was longer?']]);const [p,q]=Math.random()<.5?[S[0],S[1]]:[S[1],S[0]];
  const r=a*d>cc*b?p:q;const L=lcm(b,d);
  return st(choice({prompt:`${cap(p)}${S[2]} ${F(a,b)} ${S[3]}. ${cap(q)}${S[2]} ${F(cc,d)} ${S[3]}. ${S[4]}`,tpl:'{A}',text:`wg ${p} ${a}/${b} ${cc}/${d}`,fast:30,
   explain:`<p>Make the bottoms match (${L}): ${F(a,b)} = ${F(a*L/b,L)}, ${F(cc,d)} = ${F(cc*L/d,L)}.</p><p>So <b>${r}</b>.</p>`,nudge:`<p>Change both fractions to ${L}ths, then compare.</p>`},r,[p,q]));},
 battery:c=>{const a=R(1,4);let b;do{b=R(5,40);}while(b%10===0);const left=100-a*10-b;const who=PK([['Gizmo\'s robot battery is full','His robot uses','to dance and','to fly'],['Dr. Quartz\'s lab tank is full of crystal water','He uses','for one test and','for another'],['Ozzy\'s train starts with a full tank','It uses','on the way out and','on the way back']]);
  return st({prompt:`${who[0]}. ${who[1]} ${F(a,10)} ${who[2]} ${F(b,100)} ${who[3]}. How much is left?`,tpl:FA(100),answer:left,text:`bat ${who[1]} ${a} ${b}`,fast:35,
   explain:`<p>${F(a,10)} = ${F(a*10,100)}. Used: ${a*10} + ${b} = ${a*10+b} hundredths.</p><p>100 − ${a*10+b} = <b>${left}</b></p>`,nudge:`<p>Full means ${F(100,100)}. Change ${F(a,10)} to hundredths, add what was used, then subtract.</p>`});},
 likeStory3:c=>{const S=PK([['Nana Paws knits','of a scarf on Monday,','on Tuesday and','on Wednesday. How much is left to knit?'],['Gizmo paints','of his robot in the morning,','after lunch and','after dinner. How much is not painted yet?'],['Ozzy builds','of a new track on Monday,','on Tuesday and','on Wednesday. How much is left to build?']]);
  const n=PK([8,10,12]);const a=R(1,n-4),b=R(1,n-3-a),d=R(1,n-1-a-b);
  return st({prompt:`${S[0]} ${F(a,n)} ${S[1]} ${F(b,n)} ${S[2]} ${F(d,n)} ${S[3]}`,tpl:FA(n),answer:n-a-b-d,text:`ls3 ${S[0].slice(0,5)} ${a} ${b} ${d}/${n}`,fast:40,
   explain:`<p>Done: ${a} + ${b} + ${d} = ${a+b+d} ${FN[n][1]}.</p><p>Left: ${n} − ${a+b+d} = <b>${n-a-b-d}</b>, so ${F(n-a-b-d,n)}.</p>`,nudge:`<p>Add the three parts, then take them from the whole, ${F(n,n)}.</p>`});},
 goalMiles:c=>{const n=PK([4,5,8,10]);let w1,w2,a,b,G,left;do{w1=R(1,3);w2=R(1,2);a=R(1,n-1);b=R(1,n-1);G=w1+w2+R(1,3);left=G*n-(w1*n+a+w2*n+b);}while(left<=0||left%n===0);const W=Math.floor(left/n),r=left%n;
  const S=PK([['Coach Flex runs','miles on Monday and','miles on Tuesday. His goal for the week is','miles.','How much more must he run?','miles'],['Skyla the eagle flies','miles before lunch and','miles after lunch. Her goal is','miles.','How much farther must she fly?','miles'],['Nana Paws walks the dogs','miles on Saturday and','miles on Sunday. Her goal is','miles.','How much more must she walk?','miles']]);
  return st({prompt:`${S[0]} <b>${MX(w1,a,n)}</b> ${S[1]} <b>${MX(w2,b,n)}</b> ${S[2]} <b>${G}</b> ${S[3]} ${S[4]}`,tpl:`${W?W+' ':''}${FA(n)} ${S[5]}`,answer:r,text:`gm ${S[0].slice(0,5)} ${w1} ${a} ${w2} ${b} ${n} ${G}`,fast:50,
   explain:`<p>So far: ${MX(w1,a,n)} + ${MX(w2,b,n)} = ${F(w1*n+a+w2*n+b,n)}.</p><p>Goal: ${G} = ${F(G*n,n)}. ${G*n} − ${w1*n+a+w2*n+b} = ${left} ${FN[n][1]} = ${MX(W,r,n)}. Top <b>${r}</b>.</p>`,nudge:`<p>Step 1: add the two days. Step 2: take that away from ${G}. Work in ${FN[n][1]}!</p>`});},
 batchesLeft:c=>{const n=PK([3,4,8]);let a,k,H,left;do{a=R(1,n-1);k=R(3,6);H=R(2,5);left=H*n-k*a;}while(left<=0||left%n===0);const W=Math.floor(left/n),r=left%n;const S=PK([['Ms. Rosa has','cups of flour. Each batch of muffins uses','cup. She makes','batches. How much flour is left?','cups'],['Nana Paws has','balls of yarn. Each hat uses','ball. She knits','hats. How much yarn is left?','balls']]);
  return st({prompt:`${S[0]} <b>${H}</b> ${S[1]} <b>${F(a,n)}</b> ${S[2]} <b>${k}</b> ${S[3]}`,tpl:`${W?W+' ':''}${FA(n)} ${W?S[4]:S[4].replace(/s$/,'')}`,answer:r,text:`bl ${S[0].slice(0,5)} ${H} ${a}/${n} ${k}`,fast:50,
   explain:`<p>Used: ${k} × ${F(a,n)} = ${F(k*a,n)}. She had ${H} = ${F(H*n,n)}.</p><p>${H*n} − ${k*a} = ${left} ${FN[n][1]} = ${MX(W,r,n)}. Top <b>${r}</b>.</p>`,nudge:`<p>Step 1: multiply to find what she used. Step 2: subtract from ${H}.</p>`});},
 mistake4:c=>{const who=PK(['Ozzy','Gizmo','Dr. Quartz','Coach Flex','the Grey Goblin']);const W=cap(who);const NM='He is right!';const v=R(0,5);
  const AB='He added the bottom numbers too',CH=`He didn't change the wholes into parts`,MB='He multiplied the bottom too',CMP2='He compared the digits, not the hundredths';
  if(v===0){const a=R(1,9),b=R(1,9);return mistake({text:`m4a ${a} ${b} ${who}`,explain:`<p>${F(a,10)} = ${F(a*10,100)}, so the sum is ${F(a*10+b,100)}. Never add the bottoms!</p><p>Answer: <b>${AB}</b></p>`,nudge:`<p>Did ${heOf(who)} keep a bottom number of 100?</p>`},W,`${F(a,10)} + ${F(b,100)} = ${F(a+b,110)}`,AB,[NM,MB,CH]);}
  if(v===1){const n=PK([5,6,8,10]);const a=R(1,n-2),b=R(1,n-1-a);return mistake({text:`m4b ${a} ${b} ${n} ${who}`,explain:`<p>Same size parts: add the tops and keep ${n}. ${F(a+b,n)}.</p><p>Answer: <b>${AB}</b></p>`,nudge:`<p>When the bottoms match, what stays the same?</p>`},W,`${F(a,n)} + ${F(b,n)} = ${F(a+b,2*n)}`,AB,[NM,CH,CMP2]);}
  if(v===2){const x=R(2,8);let y;do{y=R(11,x*10-1);}while(y%10===0);return mistake({text:`m4c ${x} ${y} ${who}`,explain:`<p>0.${x} = 0.${x}0 = ${x*10} hundredths, which is more than ${y} hundredths.</p><p>Answer: <b>${CMP2}</b></p>`,nudge:`<p>Write both with 2 digits after the dot.</p>`},W,`0.${x} is less than 0.${y}`,CMP2,[NM,AB,MB]);}
  if(v===3){const n=PK([3,4,5,6,8]);const w=R(2,4),a=R(1,n-1);return mistake({text:`m4d ${w} ${a}/${n} ${who}`,explain:`<p>${w} wholes = ${w*n} ${FN[n][1]}, plus ${a}: ${F(w*n+a,n)}.</p><p>Answer: <b>${CH}</b></p>`,nudge:`<p>How many ${FN[n][1]} are in ${w} wholes?</p>`},W,`${MX(w,a,n)} = ${F(w+a,n)}`,CH,[NM,AB,MB]);}
  if(v===4){const n=PK([3,4,5,6,8]);const a=R(1,n-1),k=R(2,5);return mistake({text:`m4e ${k} ${a}/${n} ${who}`,explain:`<p>${k} × ${F(a,n)} means ${k} groups of ${F(a,n)}: ${F(k*a,n)}. The size of the parts doesn't change.</p><p>Answer: <b>${MB}</b></p>`,nudge:`<p>Do ${k} groups of ${FN[n][1]} change the size of a ${FN[n][0]}?</p>`},W,`${k} × ${F(a,n)} = ${F(k*a,k*n)}`,MB,[NM,AB,CH]);}
  const [a,b]=PK([[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5]]);const m=R(2,4);return mistake({text:`m4f ${a}/${b} ${m} ${who}`,explain:`<p>Multiply top and bottom by ${m}: ${F(a*m,b*m)}. It's right!</p><p>Answer: <b>${NM}</b></p>`,nudge:`<p>Check: what was the top and bottom multiplied by?</p>`},W,`${F(a,b)} = ${F(a*m,b*m)}`,NM,[MB,AB,CH]);},
 estFrac4:c=>{const big=Math.random()<.5;const pickF=()=>{const b=PK([3,4,5,6,8,10,12]);const a=big?R(Math.floor(b/2)+1,b-1):R(1,Math.ceil(b/2)-1);return [a,b];};const [a,b]=pickF();let [cc,d]=pickF();if(d===b)[cc,d]=pickF();if(a<1||cc<1)return f4.estFrac4(c);
  const r=big?'more than 1':'less than 1';
  return choice({prompt:`Without working it out: is <b>${F(a,b)} + ${F(cc,d)}</b> more than 1 or less than 1?`,tpl:'{A}',text:`ef ${a}/${b} ${cc}/${d}`,fast:20,
   explain:`<p>${F(a,b)} is ${big?'more':'less'} than ${F(1,2)} and ${F(cc,d)} is ${big?'more':'less'} than ${F(1,2)}.</p><p>Two ${big?'more':'less'}-than-halves make <b>${r}</b>.</p>`,nudge:`<p>Compare each fraction with ${F(1,2)}.</p>`},r,['more than 1','less than 1']);},
decimalGoal:c=>{const x=R(1,6);let y;do{y=R(5,35);}while(y%10===0||x*10+y>=95);const S=PK([['Skyla the eagle flies','mile, rests, then flies','mile more. Her nest is 1 mile from the start.','How much farther must she fly?'],['Nana Paws walks the dogs','mile, stops for water, then walks','mile more. The park is 1 mile from home.','How much farther must she walk?'],['Coach Flex swims','mile, rests, then swims','mile more. His goal is 1 mile.','How much more must he swim?']]);const t=100-x*10-y;
  return st({prompt:`${S[0]} <b>${F(x,10)}</b> ${S[1]} <b>${F(y,100)}</b> ${S[2]} ${S[3]}`,tpl:`${FA(100)} mile`,answer:t,text:`dg ${S[0].slice(0,6)} ${x} ${y}`,fast:40,
   explain:`<p>${F(x,10)} = ${F(x*10,100)}. So far: ${x*10} + ${y} = ${x*10+y} hundredths.</p><p>1 mile = ${F(100,100)}. 100 − ${x*10+y} = <b>${t}</b></p>`,nudge:`<p>Step 1: change ${F(x,10)} to hundredths and add. Step 2: take it from ${F(100,100)}.</p>`});},
whichEq4:c=>{const [a,b]=PK([[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[1,6],[5,6]]);const m=PK([2,3,4].filter(x=>x*b<=12||b===5));const R1=F(a*m,b*m);
  const w=[[a*m+1,b*m],[a+m,b*m],[a*m,b+m],[a,b*m],[b*m-a*m,b*m]].filter(x=>x[0]>0&&x[1]>0&&x[0]*b!==a*x[1]).map(x=>F(x[0],x[1]));
  return choice({prompt:`Which fraction is equal to ${F(a,b)}?`,tpl:'{A}',text:`we4 ${a}/${b} ${m}`,fast:20,explain:`<p>Multiply top and bottom by ${m}: ${F(a,b)} = <b>${R1}</b>.</p>`,nudge:`<p>Equal fractions: the top and bottom are multiplied by the same number.</p>`},R1,SH(w));},
 scoop:c=>{const [a,b,s]=PK([[3,4,8],[1,2,8],[2,3,6],[1,3,6],[1,2,4],[3,4,12],[2,3,12],[5,6,12],[1,4,8]]);const who=PK(['Ms. Rosa','Nana Paws','Gizmo','Dr. Quartz']);const what=PK(['cup of flour','cup of sugar','cup of oats']);
  return st({prompt:`${who}'s recipe needs <b>${F(a,b)}</b> ${what}. The only scoop is a <b>${F(1,s)}</b> cup. How many scoops are needed?`,tpl:'{A} scoops',answer:a*s/b,text:`sc ${who} ${a}/${b} ${s}`,fast:30,
   explain:`<p>${F(a,b)} = ${F(a*s/b,s)}, so it takes <b>${a*s/b}</b> scoops of ${F(1,s)}.</p>`,nudge:`<p>Write ${F(a,b)} with a bottom number of ${s}.</p>`});}
};
function pieDay(c){return f4.pieDay(c);}
PD('frac',4,[
 [f4.equiv,f4.equivDen,f4.reduce,f4.equivStory,f4.whichEq4,f4.scoop,f3.compare,f3.whoMore,f3.wholes],
 [f4.compare,f4.addLike,f4.subLike,f4.decompose,f4.likeStory,f4.whichEq4,f4.scoop,f4.equivStory,f4.estFrac4],
 [f4.mixAdd,f4.mixSub,f4.mixImp,f4.timesWhole,f4.timesStory,f4.estFrac4,f4.decompose,f4.likeStory,f4.compare],
 [f4.tenHund,f4.addTH,f4.decimal,f4.cmpDec,f4.timesMixed,f4.mixSub,f4.mistake4,f4.estFrac4,f4.mixImp],
 [f4.runDays,f4.pieDay,f4.battery,f4.whoGrew,f4.likeStory3,f4.goalMiles,f4.batchesLeft,f4.decimalGoal,f4.mistake4]]);

/* ----- grade 5: unlike denominators, × and ÷ with fractions ----- */
const MUL5=[[2,4],[2,6],[2,8],[2,10],[3,6],[3,9],[3,12],[4,8],[4,12],[5,10],[6,12]];
const CO5=[[2,3],[2,5],[3,4],[3,5],[4,5],[2,7],[4,3],[5,6],[3,8],[6,4],[4,10],[6,8]];
/* a ± c over denominators b,d: shown with the common denominator L */
function unlike(add,pairs,showDen){let [b,d]=SH(PK(pairs));const L=lcm(b,d);let a=ra(b),cc=ra(d);
 if(!add&&a*d<cc*b){[a,b,cc,d]=[cc,d,a,b];}if(!add&&a*d===cc*b)return unlike(add,pairs,showDen);
 const A=a*L/b,C=cc*L/d,t=add?A+C:A-C;return {a,b,cc,d,L,A,C,t};}

const f5={
 addMul:c=>{const u=unlike(true,MUL5);const {a,b,cc,d,L,A,C,t}=u;
  return {tpl:`${F(a,b)} + ${F(cc,d)} = ${FA(L)}`,answer:t,text:`am ${a}/${b}+${cc}/${d}`,fast:20,explain:`<p>Change to ${FN[L]?FN[L][1]:L+'ths'}: ${F(a,b)} = ${F(A,L)}, ${F(cc,d)} = ${F(C,L)}.</p><p>${A} + ${C} = <b>${t}</b></p>`,nudge:`<p>Make both bottom numbers ${L} first.</p>`};},
 subMul:c=>{const u=unlike(false,MUL5);const {a,b,cc,d,L,A,C,t}=u;
  return {tpl:`${F(a,b)} − ${F(cc,d)} = ${FA(L)}`,answer:t,text:`sm ${a}/${b}-${cc}/${d}`,fast:20,explain:`<p>Change to ${L}ths: ${F(a,b)} = ${F(A,L)}, ${F(cc,d)} = ${F(C,L)}.</p><p>${A} − ${C} = <b>${t}</b></p>`,nudge:`<p>Make both bottom numbers ${L} first.</p>`};},
 mixMul:c=>{const [b,d]=PK([[2,4],[2,6],[3,6],[2,8],[4,8],[5,10]]);const L=d;let a=ra(b),cc=ra(d);const A=a*L/b;if(A+cc>=L)return f5.mixMul(c);
  const w1=R(1,4),w2=R(1,3);
  return {tpl:`${MX(w1,a,b)} + ${MX(w2,cc,d)} = ${w1+w2} ${FA(L)}`,answer:A+cc,text:`mm ${w1} ${a}/${b} ${w2} ${cc}/${d}`,fast:20,explain:`<p>${F(a,b)} = ${F(A,L)}. ${A} + ${cc} = ${A+cc}.</p><p>Wholes: ${w1} + ${w2} = ${w1+w2}. Top <b>${A+cc}</b>.</p>`,nudge:`<p>Change ${F(a,b)} to ${L}ths, then add wholes and fractions separately.</p>`};},
 sugar:c=>{const [b,d]=PK([[2,4],[2,8],[4,8],[3,6],[2,6]]);let a=ra(b),cc=ra(d);const L=d,A=a*L/b;const sub=Math.random()<.4&&A!==cc;
  const S=PK([['Ms. Rosa uses','cup of sugar and','cup of honey in her muffins. How much sweetener is that?','Ms. Rosa has','cup of sugar. She uses','cup. How much sugar is left?','cup'],['Gizmo pours','liter of oil into his robot and','liter of water into the cooler. How much liquid is that?','Gizmo has','liter of oil. He pours','liter into a robot. How much oil is left?','liter'],['Dr. Quartz mixes','cup of salt with','cup of crystal powder. How much mixture is that?','Dr. Quartz has','cup of salt. He uses','cup in a test. How much salt is left?','cup']]);
  let x=A,y=cc,xa=a,xb=b,ya=cc,yb=d;if(sub&&A<cc){/* bigger first */return st({prompt:`${S[3]} ${F(cc,d)} ${S[4]} ${F(a,b)} ${S[5]}`,tpl:`${FA(L)} ${S[6]}`,answer:cc-A,text:`sg- ${S[0].slice(0,5)} ${cc}/${d} ${a}/${b}`,fast:25,explain:`<p>${F(a,b)} = ${F(A,L)}.</p><p>${cc} − ${A} = <b>${cc-A}</b> ${FN[L][1]}.</p>`,nudge:`<p>Change ${F(a,b)} to ${FN[L][1]} first.</p>`});}
  if(sub)return st({prompt:`${S[3]} ${F(a,b)} ${S[4]} ${F(cc,d)} ${S[5]}`,tpl:`${FA(L)} ${S[6]}`,answer:A-cc,text:`sg- ${S[0].slice(0,5)} ${a}/${b} ${cc}/${d}`,fast:25,explain:`<p>${F(a,b)} = ${F(A,L)}.</p><p>${A} − ${cc} = <b>${A-cc}</b> ${FN[L][1]}.</p>`,nudge:`<p>Change ${F(a,b)} to ${FN[L][1]} first.</p>`});
  return st({prompt:`${S[0]} ${F(a,b)} ${S[1]} ${F(cc,d)} ${S[2]}`,tpl:`${FA(L)} ${S[6]}${A+cc>L?'s':''}`,answer:A+cc,text:`sg+ ${S[0].slice(0,5)} ${a}/${b} ${cc}/${d}`,fast:25,explain:`<p>${F(a,b)} = ${F(A,L)}.</p><p>${A} + ${cc} = <b>${A+cc}</b> ${FN[L][1]}.</p>`,nudge:`<p>Change ${F(a,b)} to ${FN[L][1]} first.</p>`});},
 pickUnlike:c=>{const add=Math.random()<.6;let u;do{u=unlike(add,CO5.concat(MUL5));}while(add&&u.t>u.L);const {a,b,cc,d,L,A,C,t}=u;const op=add?'+':'−';
  const wr=add?[[a+cc,b+d],[a+cc,L],[a+cc,Math.max(b,d)],[A+C+1,L]]:[[Math.abs(a-cc)||1,Math.abs(b-d)||1],[Math.abs(a-cc)||1,L],[A+C,L],[t+1,L]];
  const g=gcd(t,L);
  return fpick({tpl:`${F(a,b)} ${op} ${F(cc,d)} = {A}`,text:`pu ${a}/${b}${op}${cc}/${d}`,fast:25,
   explain:`<p>Use ${L}ths: ${F(a,b)} = ${F(A,L)}, ${F(cc,d)} = ${F(C,L)}.</p><p>${A} ${op} ${C} = ${t}, so ${F(t,L)}${g>1?` = <b>${FL(t,L)}</b>`:` (<b>${FL(t,L)}</b>)`}.</p><p class="tip">Never ${add?'add':'subtract'} the bottom numbers!</p>`,nudge:`<p>Find a bottom number both ${b} and ${d} go into.</p>`},t,L,wr);},
 typeUnlike:c=>{const add=Math.random()<.6;const u=unlike(add,CO5);const {a,b,cc,d,L,A,C,t}=u;const op=add?'+':'−';
  return {tpl:`${F(a,b)} ${op} ${F(cc,d)} = ${FA(L)}`,answer:t,text:`tu ${a}/${b}${op}${cc}/${d}`,fast:25,explain:`<p>${L} is a multiple of ${b} and ${d}.</p><p>${F(a,b)} = ${F(A,L)}, ${F(cc,d)} = ${F(C,L)}. ${A} ${op} ${C} = <b>${t}</b></p>`,nudge:`<p>Change both fractions to ${L}ths.</p>`};},
 ofNum:c=>{const n=PK([2,3,4,5,6,8,10]);const a=ra(n);const N=n*R(2,9);
  return {tpl:`${F(a,n)} of ${N} = {A}`,answer:N/n*a,text:`of ${a}/${n} ${N}`,fast:15,explain:`<p>${F(1,n)} of ${N}: ${N} ÷ ${n} = ${N/n}.</p><p>${F(a,n)}: ${N/n} × ${a} = <b>${N/n*a}</b></p>`,nudge:`<p>Divide by ${n}, then multiply by ${a}.</p>`};},
 knit:c=>{const [b,d]=SH(PK(CO5.slice(0,8)));const L=lcm(b,d);const a=ra(b);let cc=ra(d);const A=a*L/b,C=cc*L/d;if(A+C>=L)return f5.knit(c);const left=Math.random()<.5;
  const S=PK([['Nana Paws knits','of a scarf on Saturday and','more on Sunday','How much has she knit?','How much is left to knit?'],['Coach Flex paints','of the gym fence in the morning and','more after lunch','How much has he painted?','How much is left to paint?'],['Ozzy builds','of a new train track on Monday and','more on Tuesday','How much has he built?','How much is left to build?']]);
  return st({prompt:`${S[0]} <b>${F(a,b)}</b> ${S[1]} <b>${F(cc,d)}</b> ${S[2]}. ${left?S[4]:S[3]}`,tpl:FA(L),answer:left?L-A-C:A+C,text:`kn ${S[0].slice(0,5)} ${a}/${b} ${cc}/${d} ${left}`,fast:30,
   explain:`<p>${F(a,b)} = ${F(A,L)}, ${F(cc,d)} = ${F(C,L)}. Done: ${A+C} ${L}ths.</p>${left?`<p>Left: ${L} − ${A+C} = <b>${L-A-C}</b></p>`:`<p>Top <b>${A+C}</b></p>`}`,nudge:`<p>Make both bottoms ${L}${left?', add, then take from the whole':''}.</p>`});},
 mulFF:c=>{const b=PK([2,3,4,5,6]),d=PK([2,3,4,5,8]);const a=ra(b),cc=ra(d);
  return {tpl:`${F(a,b)} × ${F(cc,d)} = ${FA(b*d)}`,answer:a*cc,text:`mf ${a}/${b}x${cc}/${d}`,fast:15,explain:`<p>Multiply top × top and bottom × bottom.</p><p>${a} × ${cc} = <b>${a*cc}</b>, ${b} × ${d} = ${b*d}.</p>`,nudge:`<p>Top times top, bottom times bottom.</p>`};},
 asDiv:c=>{const v=Math.random();if(v<.5){const b=PK([3,4,5,6,8]);const a=ra(b);
   const S=PK([[`<b>${b}</b> friends share <b>${a}</b> ${PL(a,'pizza')} equally. How much pizza does each friend get?`,'of a pizza'],[`Ms. Rosa shares <b>${a}</b> ${PL(a,'pie')} equally among <b>${b}</b> plates. How much pie is on each plate?`,'of a pie'],[`What is <b>${a} ÷ ${b}</b>?`,'']]);
   return choice({prompt:S[0],tpl:`{A} ${S[1]}`,text:`ad ${a}/${b} ${S[1]}`,fast:20,explain:`<p>${a} shared by ${b} is ${a} ÷ ${b} = <b>${F(a,b)}</b>.</p><p class="tip">The top is what's shared, the bottom is how many share it.</p>`,nudge:`<p>A fraction is a division: top ÷ bottom.</p>`},F(a,b),[F(b,a),F(1,b),F(a,a+b),F(1,a*b)]);}
  const b=PK([2,3,4,5]);let a;do{a=R(b+1,4*b);}while(a%b===0);const w=Math.floor(a/b),r=a%b;
  return {prompt:'Write the answer as a mixed number.',tpl:`${a} ÷ ${b} = ${w} ${FA(b)}`,answer:r,text:`adm ${a}/${b}`,fast:20,explain:`<p>${a} ÷ ${b} = ${F(a,b)}.</p><p>${b} × ${w} = ${b*w}, ${r} left over: ${MX(w,r,b)}. Top <b>${r}</b>.</p>`,nudge:`<p>${a} ÷ ${b} = ${F(a,b)}. How many wholes, and what is left?</p>`};},
 fracWhole:c=>{const b=PK([2,3,4,5,6,8]);const a=ra(b);if(Math.random()<.5){const N=b*R(2,8);return {tpl:`${F(a,b)} × ${N} = {A}`,answer:N/b*a,text:`fw ${a}/${b}x${N}`,fast:15,explain:`<p>${N} ÷ ${b} = ${N/b}, then × ${a} = <b>${N/b*a}</b></p>`,nudge:`<p>Same as ${F(a,b)} of ${N}.</p>`};}
  let N;do{N=R(2,9);}while((N*a)%b===0||N*a<b);const t=N*a,w=Math.floor(t/b),r=t%b;
  return {tpl:`${N} × ${F(a,b)} = ${w} ${FA(b)}`,answer:r,text:`fwm ${N}x${a}/${b}`,fast:20,explain:`<p>${N} × ${F(a,b)} = ${F(t,b)} = ${MX(w,r,b)}. Top <b>${r}</b>.</p>`,nudge:`<p>Multiply the top by ${N}, then pull out the wholes.</p>`};},
 scale:c=>{const N=PK([6,8,10,12,15,20,24,30]);const v=R(0,2);let a,b;if(v===0){b=PK([2,3,4,5,6,8]);a=ra(b);}else if(v===1){b=PK([2,3,4,5]);a=b+R(1,3);}else{b=PK([2,3,4,5,8]);a=b;}
  const r=v===0?`less than ${N}`:v===1?`more than ${N}`:`equal to ${N}`;
  return choice({prompt:`Without working it out: is <b>${F(a,b)} × ${N}</b> more than, less than or equal to ${N}?`,tpl:'{A}',text:`sc ${a}/${b} ${N}`,fast:15,
   explain:`<p>${F(a,b)} is ${v===0?'less than 1':v===1?'more than 1':'equal to 1'}.</p><p>Times a number ${v===0?'less than 1 makes it smaller':v===1?'more than 1 makes it bigger':'equal to 1 keeps it the same'}: <b>${r}</b>.</p>`,nudge:`<p>Is ${F(a,b)} less than 1, equal to 1 or more than 1?</p>`},r,[`less than ${N}`,`more than ${N}`,`equal to ${N}`]);},
 lasagna:c=>{const P=[[3,4,1,2],[2,3,1,2],[1,2,1,3],[3,4,2,3],[2,3,3,4],[1,2,3,4],[4,5,1,2],[5,6,1,2],[2,3,1,4],[3,5,2,3]];const [a,b,cc,d]=PK(P);
  const S=PK([['Ms. Rosa has','of a pan of lasagna.','eats','of it. What fraction of the whole pan did he eat?','Gizmo'],['There is','of a cake left after the party.','eats','of it. What fraction of the whole cake is that?','Coach Flex'],['Nana Paws has','of a ball of yarn.','uses','of it for a mitten. What fraction of the whole ball does she use?','She']]);
  return st({prompt:`${S[0]} <b>${F(a,b)}</b> ${S[1]} ${S[4]} ${S[2]} <b>${F(cc,d)}</b> ${S[3]}`,tpl:FA(b*d),answer:a*cc,text:`ls ${S[0].slice(0,5)} ${a}/${b} ${cc}/${d}`,fast:30,
   explain:`<p>"${F(cc,d)} of ${F(a,b)}" means ${F(cc,d)} × ${F(a,b)}.</p><p>${cc} × ${a} = <b>${a*cc}</b>, ${d} × ${b} = ${b*d}.</p>`,nudge:`<p>"Of" means multiply.</p>`});},
 unitDiv:c=>{const b=PK([2,3,4,5]);const n=PK([2,3,4,5]);
  const o={prompt:Math.random()<.5?`What is ${F(1,b)} ÷ ${n}?`:`${F(1,b)} of a pan of cornbread is shared equally by <b>${n}</b> friends. What part of the whole pan does each friend get?`,tpl:`{A}`,text:`ud 1/${b}÷${n}`,fast:20,
   explain:`<p>Cut ${F(1,b)} into ${n} equal parts. Each part is ${F(1,b*n)} of the whole.</p><p>${F(1,b)} ÷ ${n} = <b>${F(1,b*n)}</b> (check: ${F(1,b*n)} × ${n} = ${F(1,b)}).</p>`,nudge:`<p>Sharing makes pieces <b>smaller</b>. Cut ${F(1,b)} into ${n} parts.</p>`};
  return choice(o,F(1,b*n),[F(n,b),F(1,b+n),FL(b,n)===F(1,b*n)?F(2,b*n):FL(b,n),F(n,b*n)]);},
 wholeDiv:c=>{const n=R(2,8),b=PK([2,3,4,5,6,8]);
  return Math.random()<.5?{tpl:`${n} ÷ ${F(1,b)} = {A}`,answer:n*b,text:`wd ${n}÷1/${b}`,fast:15,explain:`<p>How many ${F(1,b)} pieces fit in ${n}? Each whole has ${b}.</p><p>${n} × ${b} = <b>${n*b}</b></p>`,nudge:`<p>How many ${FN[b][1]} are in 1 whole? In ${n} wholes?</p>`}
  :{tpl:`{A} ÷ ${F(1,b)} = ${n*b}`,answer:n,text:`wdu ?÷1/${b}=${n*b}`,fast:20,explain:`<p>Each whole holds ${b} pieces of ${F(1,b)}.</p><p>${n*b} ÷ ${b} = <b>${n}</b></p>`,nudge:`<p>${b} pieces of ${F(1,b)} make 1 whole.</p>`};},
 simplify:c=>{const P=[[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[4,5],[1,6],[5,6],[3,8],[5,8],[3,10],[7,10]];const [a,b]=PK(P);const m=PK([2,3,4,5].filter(x=>x*b<=40));
  const A=a*m,B=b*m;return fpick({prompt:`Write ${F(A,B)} in simplest form.`,tpl:'{A}',text:`sp ${A}/${B}`,fast:20,explain:`<p>${A} and ${B} can both be divided by <b>${m}</b>.</p><p>${A} ÷ ${m} = ${a}, ${B} ÷ ${m} = ${b}: <b>${F(a,b)}</b></p>`,nudge:`<p>Find the biggest number that divides both ${A} and ${B}.</p>`},a,b,[[a,B],[A,b],[a+1,b],[b-a||1,b],[a,b+1]]);},
 mixUnlike:c=>{const [b,d]=SH(PK([[2,3],[2,4],[3,4],[2,5],[4,6],[2,6],[3,6],[4,8],[2,8],[5,10]]));const L=lcm(b,d);const add=Math.random()<.5;const a=ra(b),cc=ra(d);
  let w1=R(1,4),w2=R(1,3);let x=w1*L+a*L/b,y=w2*L+cc*L/d;if(!add&&x<=y){[w1,w2]=[w2+1,w1>w2+1?w2:Math.max(0,w1-1)];x=w1*L+a*L/b;y=w2*L+cc*L/d;}if(!add&&x<=y)return f5.mixUnlike(c);
  const t=add?x+y:x-y;const W=Math.floor(t/L),r=t%L;if(r===0)return f5.mixUnlike(c);const op=add?'+':'−';
  return {tpl:`${MX(w1,a,b)} ${op} ${MX(w2,cc,d)} = ${W?W+' ':''}${FA(L)}`,answer:r,text:`mu ${w1} ${a}/${b}${op}${w2} ${cc}/${d}`,fast:30,
   explain:`<p>Use ${L}ths: ${MX(w1,a*L/b,L)} ${op} ${MX(w2,cc*L/d,L)}.</p><p>${add?`Add: ${a*L/b} + ${cc*L/d} = ${a*L/b+cc*L/d}${a*L/b+cc*L/d>=L?` = 1 whole and ${a*L/b+cc*L/d-L}`:''}`:a*L/b>=cc*L/d?`Subtract: ${a*L/b} − ${cc*L/d} = ${a*L/b-cc*L/d}`:`Trade 1 whole: ${a*L/b} + ${L} = ${a*L/b+L}, then ${a*L/b+L} − ${cc*L/d} = ${a*L/b+L-cc*L/d}`}.</p><p>Answer: ${MX(W,r,L)}, top <b>${r}</b>.</p>`,
   nudge:`<p>Change both fractions to ${L}ths. Then work with wholes and fractions.</p>`};},
 /* legend */
 mixedStory:c=>{const S=PK([['Coach Flex runs','miles on Monday and','miles on Tuesday. How far does he run in all?','miles',1],['Ms. Rosa buys','pounds of apples and','pounds of pears. How many pounds of fruit is that?','pounds',1],['Skyla the eagle flies','miles in the morning and','miles in the evening. How far does she fly?','miles',1],['Gizmo has a wire','feet long. He cuts off','feet for a robot. How much wire is left?','feet',0],['Nana Paws has','yards of yarn. She uses','yards for a hat. How much yarn is left?','yards',0]]);
  const [b,d]=SH(PK([[2,4],[3,6],[2,3],[4,8],[3,4],[2,8],[2,5]]));const L=lcm(b,d);const a=ra(b),cc=ra(d);let w1=R(2,5),w2=R(1,3);const add=S[4]===1;
  let x=w1*L+a*L/b,y=w2*L+cc*L/d;if(!add){w1=w2+R(1,3);x=w1*L+a*L/b;}const t=add?x+y:x-y;const W=Math.floor(t/L),r=t%L;if(r===0)return f5.mixedStory(c);
  return st({prompt:`${S[0]} <b>${MX(w1,a,b)}</b> ${S[1]} <b>${MX(w2,cc,d)}</b> ${S[2]}`,tpl:`${W?W+' ':''}${FA(L)} ${S[3]}`,answer:r,text:`mst ${S[0].slice(0,5)} ${w1} ${a}/${b} ${w2} ${cc}/${d}`,fast:40,
   explain:`<p>Use ${L}ths: ${MX(w1,a*L/b,L)} ${add?'+':'−'} ${MX(w2,cc*L/d,L)}.</p><p>${add?'Add':'Subtract'} wholes and fractions${add&&a*L/b+cc*L/d>=L?' (the fractions make 1 more whole)':!add&&a*L/b<cc*L/d?' (trade 1 whole first)':''}: ${MX(W,r,L)}. Top <b>${r}</b>.</p>`,nudge:`<p>Change the fractions to ${L}ths first.</p>`});},
 batteries:c=>{const S=PK([['Gizmo has','batteries.','of them are charged. He uses','of the charged ones in a robot. How many charged batteries are not used?'],['Dr. Quartz has','crystals.','of them are purple. He gives','of the purple ones to Skyla. How many purple crystals does he keep?'],['Nana Paws has','dog treats.','of them are bacon flavor. The dogs eat','of the bacon treats. How many bacon treats are left?']]);
  const P=[[2,3,1,2],[3,4,1,3],[3,4,2,3],[1,2,1,2],[2,3,1,4],[3,5,1,3],[4,5,1,2],[5,6,2,5],[1,2,1,3],[3,4,1,2]];const [a,b,cc,d]=PK(P);let N,ch,used;do{N=b*d*R(1,Math.floor(60/(b*d)));ch=N/b*a;used=ch/d*cc;}while(N<12||ch-used<3);
  return st({prompt:`${S[0]} <b>${N}</b> ${S[1]} <b>${F(a,b)}</b> ${S[2]} <b>${F(cc,d)}</b> ${S[3]}`,tpl:`{A} ${S[1].replace('.','').replace('dog ','')}`,answer:ch-used,text:`bt ${S[0].slice(0,5)} ${N} ${a}/${b} ${cc}/${d}`,fast:40,
   explain:`<p>${F(a,b)} of ${N} = ${N} ÷ ${b} × ${a} = ${ch}.</p><p>${F(cc,d)} of ${ch} = ${ch} ÷ ${d} × ${cc} = ${used}.</p><p>${ch} − ${used} = <b>${ch-used}</b></p>`,nudge:`<p>Step 1: find ${F(a,b)} of ${N}. Step 2: find ${F(cc,d)} of that. Step 3: subtract.</p>`});},
 eaglets:c=>{const S=PK([['Skyla the eagle has','of a fish pie. She shares it equally among her','eaglets. How much of the whole pie does each eaglet get?'],['Ms. Rosa has','of a pan of brownies. She shares it equally among','friends. How much of the whole pan does each friend get?'],['Ozzy has','of a box of train tickets. He shares it equally among','helpers. How much of the whole box does each helper get?']]);
  const b=PK([2,3,4]);const n=PK([2,3,4,5]);
  if(Math.random()<.5)return st(choice({prompt:`${S[0]} <b>${F(1,b)}</b> ${S[1]} <b>${n}</b> ${S[2]}`,tpl:'{A}',text:`eg ${S[0].slice(0,5)} ${b} ${n}`,fast:30,explain:`<p>${F(1,b)} ÷ ${n} = <b>${F(1,b*n)}</b>.</p><p>Check: ${n} × ${F(1,b*n)} = ${F(n,b*n)} = ${F(1,b)}.</p>`,nudge:`<p>Cut ${F(1,b)} into ${n} equal parts. How big is each part of the whole?</p>`},F(1,b*n),[F(n,b),F(1,b+n),F(n,b*n),F(b,n)]));
  const fr=PK([3,4,5,6]);const lb=PK([2,3,4,5].filter(x=>x<fr&&gcd(x,fr)===1));
  return st(choice({prompt:`<b>${fr}</b> friends share <b>${lb}</b> pounds of trail mix equally. How many pounds does each friend get?`,tpl:'{A} pound',text:`tm ${fr} ${lb}`,fast:30,explain:`<p>${lb} ÷ ${fr} = <b>${F(lb,fr)}</b> pound each.</p>`,nudge:`<p>Sharing ${lb} among ${fr} is ${lb} ÷ ${fr}. Write it as a fraction.</p>`},F(lb,fr),[F(fr,lb),F(1,fr),F(1,lb),F(lb,fr+lb)]));},
batches:c=>{const b=PK([2,3,4,8]);const n=R(2,5);const tot=n*b;const done=R(1,tot-2);
  const S=PK([['Ms. Rosa','cups of flour','Each batch of cookies needs','cup','batches','she','made','make','batch'],['Gizmo','feet of wire','Each robot needs','foot','robots','he','built','build','robot'],['Coach Flex','liters of juice','Each water bottle holds','liter','bottles','he','filled','fill','bottle']]);const two=Math.random()<.6;
  return st({prompt:`${S[0]} has <b>${n}</b> ${S[1]}. ${S[2]} <b>${F(1,b)}</b> ${S[3]}. ${two?`${cap(S[5])} has already ${S[6]} <b>${done}</b> ${done===1?S[8]:S[4]}. How many more ${S[4]} can ${S[5]} ${S[7]}?`:`How many ${S[4]} can ${S[5]} ${S[7]}?`}`,tpl:`{A} ${S[4]}`,answer:two?tot-done:tot,text:`bch ${S[0]} ${n} ${b} ${two?done:''}`,fast:35,
   explain:`<p>${n} ÷ ${F(1,b)} = ${n} × ${b} = ${tot}.</p>${two?`<p>${tot} − ${done} = <b>${tot-done}</b></p>`:`<p>So <b>${tot}</b>.</p>`}`,nudge:`<p>How many ${F(1,b)} fit in 1? In ${n}?${two?' Then take away what is already made.':''}</p>`});},
mistake5:c=>{const who=PK(['Ozzy','Gizmo','Dr. Quartz','Coach Flex','the Elder Wiz']);const W=cap(who);const NM='He is right!';const v=R(0,5);
  const AB='He added the bottoms too',TP='He changed the bottoms but not the tops',DV='He divided instead of multiplying',FB='He forgot to multiply the bottoms',MI='He multiplied instead of dividing';
  const [b,d]=SH(PK([[2,3],[3,4],[2,5],[3,5],[4,5]]));const a=ra(b),cc=ra(d);
  if(v===0)return mistake({text:`m5a ${a}/${b} ${cc}/${d} ${who}`,explain:`<p>Use ${b*d}ths: ${F(a*d,b*d)} + ${F(cc*b,b*d)} = ${F(a*d+cc*b,b*d)}.</p><p>Answer: <b>${AB}</b></p>`,nudge:`<p>Can you add fractions with different bottoms straight away?</p>`},W,`${F(a,b)} + ${F(cc,d)} = ${F(a+cc,b+d)}`,AB,[TP,NM,FB]);
  if(v===1)return mistake({text:`m5b ${a}/${b} ${cc}/${d} ${who}`,explain:`<p>${F(a,b)} = ${F(a*d,b*d)} and ${F(cc,d)} = ${F(cc*b,b*d)}: the tops change too. Sum: ${F(a*d+cc*b,b*d)}.</p><p>Answer: <b>${TP}</b></p>`,nudge:`<p>When the bottom is multiplied, what happens to the top?</p>`},W,`${F(a,b)} + ${F(cc,d)} = ${F(a+cc,b*d)}`,TP,[AB,NM,FB]);
  if(v===2){const n=R(2,6),q=PK([2,3,4,5]);return mistake({text:`m5c ${n} ${q} ${who}`,explain:`<p>${n} × ${F(1,q)} = ${F(n,q)}, so he multiplied. But ${n} ÷ ${F(1,q)} asks how many ${F(1,q)} fit in ${n}: ${n} × ${q} = ${n*q}.</p><p>Answer: <b>${MI}</b></p>`,nudge:`<p>What do you get for ${n} × ${F(1,q)}? Is that the same as ${n} ÷ ${F(1,q)}?</p>`},W,`${n} ÷ ${F(1,q)} = ${F(n,q)}`,MI,[NM,AB,FB]);}
  if(v===3)return mistake({text:`m5d ${a}/${b} ${cc}/${d} ${who}`,explain:`<p>Top × top and bottom × bottom: ${F(a*cc,b*d)}.</p><p>Answer: <b>${FB}</b></p>`,nudge:`<p>What happens to the bottoms when you multiply fractions?</p>`},W,`${F(a,b)} × ${F(cc,d)} = ${F(a*cc,b)}`,FB,[NM,AB,TP]);
  if(v===4)return mistake({text:`m5e ${a}/${b} ${cc}/${d} ${who}`,explain:`<p>Top × top = ${a*cc}, bottom × bottom = ${b*d}. It's right!</p><p>Answer: <b>${NM}</b></p>`,nudge:`<p>Work it out yourself and compare.</p>`},W,`${F(a,b)} × ${F(cc,d)} = ${F(a*cc,b*d)}`,NM,[FB,AB,TP]);
  const n=R(2,6),q=PK([2,3,4,5]);return mistake({text:`m5f ${n} ${q} ${who}`,explain:`<p>${q} pieces of ${F(1,q)} in each whole, so ${n} × ${q} = ${n*q}. It's right!</p><p>Answer: <b>${NM}</b></p>`,nudge:`<p>How many ${F(1,q)} pieces fit in 1 whole?</p>`},W,`${n} ÷ ${F(1,q)} = ${n*q}`,NM,[MI,AB,FB]);},
 gardenArea:c=>{const [b,d]=PK([[2,3],[3,4],[4,5],[2,5],[3,5],[4,3],[5,6],[3,8]]);const a=ra(b),cc=ra(d);const k=R(2,3);const who=PK(['Nana Paws','Gizmo','Ms. Rosa','Dr. Quartz']);
  return st({prompt:`${who} builds <b>${k}</b> garden boxes. Each box is <b>${F(a,b)}</b> yard long and <b>${F(cc,d)}</b> yard wide. What is the total area of the boxes?`,...(k*a*cc%(b*d)===0?{tpl:`{A} square yard${k*a*cc>b*d?'s':''}`,answer:k*a*cc/(b*d)}:{tpl:`${FA(b*d)} square yard${k*a*cc>b*d?'s':''}`,answer:k*a*cc}),text:`ga ${who} ${k} ${a}/${b} ${cc}/${d}`,fast:50,
   explain:`<p>One box: ${F(a,b)} × ${F(cc,d)} = ${F(a*cc,b*d)}.</p><p>${k} boxes: ${k} × ${a*cc} = <b>${k*a*cc}</b>, so ${F(k*a*cc,b*d)}.</p>`,nudge:`<p>Step 1: area of one box (length × width). Step 2: times ${k}.</p>`});},
 timeLeft:c=>{const P=[[2,4,3],[2,3,4],[4,3,2],[3,4,2],[2,6,3],[4,6,3],[2,4,8]];const [x,y,z]=PK(P);const L=lcm(x,z);let H,a,b,used,left;do{H=R(2,4);a=ra(x)*L/x;b=(R(0,1)*z+ra(z))*L/z;used=a+b;left=H*L-used;}while(left<=0||left%L===0);const W=Math.floor(left/L),r=left%L;
  const who=PK([['Coach Flex','He','running','swimming'],['Nana Paws','She','knitting','walking dogs'],['Gizmo','He','building','painting']]);
  return st({prompt:`${who[0]} has <b>${H}</b> free hours. ${who[1]} spends <b>${FL(a,L)}</b> hour ${who[2]} and <b>${FL(b,L)}</b> hour${b>L?'s':''} ${who[3]}. How much free time is left?`,tpl:`${W?W+' ':''}${FA(L)} hour${W?'s':''}`,answer:r,text:`tl ${who[0]} ${H} ${a} ${b} ${L}`,fast:60,
   explain:`<p>Use ${L}ths: ${FL(a,L)} = ${F(a,L)}, ${FL(b,L)} = ${F(b,L)}. Used: ${F(used,L)}.</p><p>${H} = ${F(H*L,L)}. ${H*L} − ${used} = ${left}, which is ${MX(W,r,L)}. Top <b>${r}</b>.</p>`,nudge:`<p>Step 1: same bottoms. Step 2: add the time used. Step 3: subtract from ${H}.</p>`});},
 scaleStory:c=>{const S=PK([['Gizmo\'s robot is','inches tall. He builds a copy that is','as tall. Is the copy taller, shorter or the same height?','taller','shorter','the same height'],['Ms. Rosa\'s cake recipe uses','cups of flour. She makes','of the recipe. Does she use more flour, less flour or the same?','more flour','less flour','the same']]);const N=PK([8,12,15,20,24]);const v=R(0,2);let a,b;
  if(v===0){b=PK([3,4,5,6,8]);a=b+R(1,3);if(gcd(a,b)>1)return f5.scaleStory(c);}else if(v===1){b=PK([3,4,5,8]);a=ra(b);}else{b=PK([3,4,5]);a=b;}
  const r=v===0?S[3]:v===1?S[4]:S[5];
  return st(choice({prompt:`Without working it out: ${S[0]} <b>${N}</b> ${S[1]} <b>${F(a,b)}</b> ${S[2]}`,tpl:'{A}',text:`ss ${S[0].slice(0,5)} ${N} ${a}/${b}`,fast:30,
   explain:`<p>${F(a,b)} is ${v===0?'more than 1':v===1?'less than 1':'equal to 1'}, so ${N} × ${F(a,b)} is ${v===0?'more than':v===1?'less than':'the same as'} ${N}: <b>${r}</b>.</p>`,nudge:`<p>Is ${F(a,b)} more than 1, less than 1, or equal to 1?</p>`},r,[S[3],S[4],S[5]]));}
};
PD('frac',5,[
 [f5.addMul,f5.subMul,f5.mixMul,f5.sugar,f4.compare,f4.mixImp,f4.timesWhole,f4.mixSub,f4.decompose],
 [f5.pickUnlike,f5.typeUnlike,f5.ofNum,f5.knit,f5.subMul,f5.addMul,f5.mixMul,f5.sugar,f4.estFrac4],
 [f5.mulFF,f5.asDiv,f5.fracWhole,f5.scale,f5.lasagna,f5.typeUnlike,f5.ofNum,f5.knit,f5.pickUnlike],
 [f5.unitDiv,f5.wholeDiv,f5.simplify,f5.mixUnlike,f5.mulFF,f5.mistake5,f5.scale,f5.asDiv,f5.fracWhole],
 [f5.mixedStory,f5.batteries,f5.batches,f5.eaglets,f5.lasagna,f5.gardenArea,f5.timeLeft,f5.scaleStory,f5.mixUnlike]]);

/* =====================================================================
   MONEY MARKET
   ===================================================================== */
const SHOP=['the Money Market','Ms. Rosa\'s café','the school fair','the toy stand','the farm stand'];
const m2={
 count:c=>{const {l,t}=coinSet([1,5,10],[3,6],10,49);
  return {vis:{t:'coins',list:l},prompt:'How much money is this?',tpl:'{A} ¢',answer:t,text:`c ${l.join('+')}`,fast:15,explain:`<p>Count the biggest coins first: ${coinCount(l)} = <b>${t}¢</b></p>`,nudge:`<p>Dime = 10¢, nickel = 5¢, penny = 1¢. Count by 10s, then 5s, then 1s.</p>`};},
 makeCoin:c=>{const v=R(0,3);
  if(v===0){const n=R(2,9);return {prompt:`How many pennies make <b>${n*5}¢</b>?`,tpl:'{A} pennies',answer:n*5,text:`pen ${n*5}`,fast:10,explain:`<p>Each penny is 1¢, so ${n*5}¢ is <b>${n*5}</b> pennies.</p>`,nudge:`<p>A penny is worth 1¢.</p>`};}
  if(v===1){const n=R(2,9);return {prompt:`How many nickels make <b>${n*5}¢</b>?`,tpl:'{A} nickels',answer:n,text:`nic ${n*5}`,fast:12,explain:`<p>Count by 5s: ${Array.from({length:n},(_,i)=>(i+1)*5).join(', ')}. That's <b>${n}</b> nickels.</p>`,nudge:`<p>A nickel is 5¢. Count by 5s.</p>`};}
  if(v===2){const n=R(2,9);return {prompt:`How many dimes make <b>${n*10}¢</b>?`,tpl:'{A} dimes',answer:n,text:`dim ${n*10}`,fast:12,explain:`<p>Count by 10s to ${n*10}: <b>${n}</b> dimes.</p>`,nudge:`<p>A dime is 10¢. Count by 10s.</p>`};}
  const n=R(1,4);return {prompt:`How many nickels have the same value as <b>${n}</b> ${PL(n,'dime')}?`,tpl:'{A} nickels',answer:2*n,text:`n4d ${n}`,fast:12,explain:`<p>1 dime = 2 nickels, so ${n} ${PL(n,'dime')} = <b>${2*n}</b> nickels.</p>`,nudge:`<p>How many nickels make 10¢?</p>`};},
 coinStory:c=>{const who=PK(['Nana Paws','Gizmo','Coach Flex','Ozzy',c.name]);const {l,t}=coinSet([1,5,10],[3,6],12,49);const pl=who==='Nana Paws'?PK(['knitting bag','purse','coat pocket']):PK(['pocket','piggy bank','lunch box','backpack']);
  return st({prompt:`${who} finds ${coinWords(l)} in ${who===c.name?'the':who==='Nana Paws'?'her':'his'} ${pl}. How much money is that?`,tpl:'{A} ¢',answer:t,text:`cs ${who} ${l.join('+')}`,fast:20,explain:`<p>${coinCount(l)} = <b>${t}¢</b></p>`,nudge:`<p>Add the dimes first, then nickels, then pennies.</p>`});},
 countQ:c=>{const {l,t}=coinSet([25,10,5,1],[4,7],40,99);
  return {vis:{t:'coins',list:l},prompt:'Count the coins. How many cents in all?',tpl:'{A} ¢',answer:t,text:`cq ${l.join('+')}`,fast:15,explain:`<p>Quarters first: ${coinCount(l)} = <b>${t}¢</b></p>`,nudge:`<p>Quarter = 25¢. Count 25, 50, 75 for quarters, then add the rest.</p>`};},
 quarters:c=>{const v=R(0,2);
  if(v===0){const n=R(1,4);return {prompt:`How many quarters make <b>${n===4?'$1':n*25+'¢'}</b>?`,tpl:'{A} quarters',answer:n,text:`q ${n}`,fast:10,explain:`<p>Count by 25s: ${Array.from({length:n},(_,i)=>(i+1)*25).join(', ')}. <b>${n}</b> ${PL(n,'quarter')}.</p>`,nudge:`<p>A quarter is 25¢.</p>`};}
  if(v===1){const q=R(1,3);const d=R(1,Math.floor((99-q*25)/10));const t=q*25+d*10;return {prompt:`Make <b>${t}¢</b> with <b>${q}</b> ${PL(q,'quarter')} and some dimes.`,tpl:'{A} dimes',answer:d,text:`qd ${q} ${t}`,fast:15,explain:`<p>${q} ${PL(q,'quarter')} = ${q*25}¢. ${t} − ${q*25} = ${d*10}¢ = <b>${d}</b> dimes.</p>`,nudge:`<p>How much do the quarters make? What is still missing?</p>`};}
  const q=R(1,3),n=R(1,Math.min(6,Math.floor((99-q*25)/5)));const t=q*25+n*5;return {prompt:`Make <b>${t}¢</b> with <b>${q}</b> ${PL(q,'quarter')} and some nickels.`,tpl:'{A} nickels',answer:n,text:`qn ${q} ${t}`,fast:15,explain:`<p>${q} ${PL(q,'quarter')} = ${q*25}¢. ${t} − ${q*25} = ${n*5}¢ = <b>${n}</b> ${PL(n,'nickel')}.</p>`,nudge:`<p>Take away the quarters first. Then count by 5s.</p>`};},
 fountain:c=>{const {l,t}=coinSet([25,10,5,1],[3,6],30,99);const who=PK([c.name,'Skyla the eagle','the Elder Wiz','Ozzy','Nana Paws']);
  return st({prompt:`${cap(who)} tosses ${coinWords(l)} into the Wishing Fountain. How much money is that?`,tpl:'{A} ¢',answer:t,text:`wf ${who} ${l.join('+')}`,fast:20,explain:`<p>${coinCount(l)} = <b>${t}¢</b></p>`,nudge:`<p>Start with the quarters: 25, 50, 75…</p>`});},
 bills:c=>{const {l,t}=coinSet([100,25,10,5,1],[4,7],120,399);if(l.filter(x=>x===100).length===0||t%100===0)return m2.bills(c);
  return money({vis:{t:'coins',list:l},prompt:'Add up the dollar bills and the coins. What is the amount?',text:`b ${l.join('+')}`,fast:20,explain:`<p>Dollars: ${l.filter(x=>x===100).length}. Cents: ${coinCount(l.filter(x=>x<100))} = ${t%100}¢.</p><p>That's <b>${$$(t)}</b>.</p>`,nudge:`<p>Count the $1 bills first. Then count the coins. Dollars go before the dot, cents after.</p>`},t);},
 dollarEq:c=>{const v=R(0,3);
  if(v===0)return {prompt:'How many cents are in one dollar?',tpl:'$1 = {A} ¢',answer:100,text:`$1cents`,fast:8,explain:`<p>$1 = <b>100¢</b></p>`,nudge:`<p>Think: 4 quarters, or 10 dimes.</p>`,alt:[]};
  const [cn,v1]=PK([['dimes',10],['quarters',25],['nickels',5]]);const d=R(1,2);
  if(v===1)return {prompt:`How many ${cn} make <b>$${d}</b>?`,tpl:`{A} ${cn}`,answer:100*d/v1,text:`deq ${cn} ${d}`,fast:12,explain:`<p>$1 = ${100/v1} ${cn}${d>1?`, so $2 = ${200/v1} ${cn}`:''}. Answer <b>${100*d/v1}</b>.</p>`,nudge:`<p>$1 is 100¢. How many ${v1}¢ coins make 100¢?</p>`};
  const ce=R(1,9)*5;const t=d*100+ce;return {prompt:'Write it in cents.',tpl:`${$$(t)} = {A} ¢`,answer:t,text:`toc ${t}`,fast:12,explain:`<p>$${d} = ${d*100}¢. ${d*100} + ${ce} = <b>${t}¢</b></p>`,nudge:`<p>Each dollar is 100¢.</p>`};},
 moreCoins:c=>{const a=R(1,3),b=R(3,9);const x=a*25,y=b*10;const s=sgn(x-y);const r=x>y?`${a} ${PL(a,'quarter')}`:x<y?`${b} dimes`:'the same';
  return choice({prompt:`Which is worth more: <b>${a}</b> ${PL(a,'quarter')} or <b>${b}</b> dimes?`,tpl:'{A}',text:`mc ${a} ${b}`,fast:15,explain:`<p>${a} ${PL(a,'quarter')} = ${x}¢. ${b} dimes = ${y}¢.</p><p><b>${r==='the same'?'They are the same':r}</b>.</p>`,nudge:`<p>Find how many cents each one is.</p>`},r,[`${a} ${PL(a,'quarter')}`,`${b} dimes`,'the same']);},
 twoItems:c=>{let a,b;do{[a,b]=two(SMALL);a.p=R(Math.max(11,a.p-9),a.p+4);b.p=R(Math.max(11,b.p-9),b.p+4);}while(a.p+b.p>=100);
  return st({prompt:`${cap(an(a.one))} ${a.one} ${a.e} costs <b>${a.p}¢</b>. ${cap(an(b.one))} ${b.one} ${b.e} costs <b>${b.p}¢</b>. How much for both?`,tpl:'{A} ¢',answer:a.p+b.p,text:`ti ${a.one} ${a.p} ${b.one} ${b.p}`,fast:20,explain:`<p>${a.p} + ${b.p} = <b>${a.p+b.p}¢</b></p>`,nudge:`<p>Add the tens, then the ones.</p>`});},
 needMore:c=>{let it,has;do{it=item(SMALL);it.p=R(Math.max(32,it.p-5),it.p+15);has=R(11,it.p-14);}while(it.p>99||has%5===0&&Math.random()<.5);
  return st({prompt:`${cap(an(it.one))} ${it.one} ${it.e} costs <b>${it.p}¢</b>. You have <b>${has}¢</b>. How much more money do you need?`,tpl:'{A} ¢ more',answer:it.p-has,text:`nm ${it.one} ${it.p} ${has}`,fast:20,explain:`<p>Count up from ${has} to ${it.p}: ${it.p} − ${has} = <b>${it.p-has}¢</b></p>`,nudge:`<p>Count up from ${has}¢ to ${it.p}¢.</p>`});},
 toll:c=>{const toll=c5(50,95);let s;do{s=coinSet([25,10,5],[2,4],15,toll-5);}while(s.t>=toll);
  return st({vis:{t:'coins',list:s.l},prompt:`Grumbleroot the troll wants <b>${toll}¢</b> to cross his bridge. ${PN(c)} has these coins. How much more does ${pn(c)} need?`,tpl:'{A} ¢ more',answer:toll-s.t,text:`tl ${toll} ${s.l.join('+')}`,fast:25,explain:`<p>The coins make ${coinCount(s.l)} = ${s.t}¢.</p><p>${toll} − ${s.t} = <b>${toll-s.t}¢</b> more.</p>`,nudge:`<p>Count the coins first. Then count up to ${toll}¢.</p>`});},
 changeDollar:c=>{const it=item(SMALL);
  return st({prompt:`You buy ${an(it.one)} ${it.one} ${it.e} for <b>${it.p}¢</b>. You pay with a <b>$1</b> bill. How much change do you get?`,tpl:'{A} ¢',answer:100-it.p,text:`cd ${it.one} ${it.p}`,fast:20,explain:`<p>$1 = 100¢. 100 − ${it.p} = <b>${100-it.p}¢</b></p><p class="tip">Count up from ${it.p} to 100.</p>`,nudge:`<p>$1 is 100¢. Count up from ${it.p}¢ to 100¢.</p>`});},
 changeTwo:c=>{let a,b;do{[a,b]=two(SMALL);}while(a.p+b.p>=100);const t=a.p+b.p;
  return st({prompt:`At the Money Market you buy ${an(a.one)} ${a.one} for <b>${a.p}¢</b> and ${an(b.one)} ${b.one} for <b>${b.p}¢</b>. You pay with <b>$1</b>. How much change do you get?`,tpl:'{A} ¢',answer:100-t,text:`c2 ${a.one} ${a.p} ${b.one} ${b.p}`,fast:30,explain:`<p>Cost: ${a.p} + ${b.p} = ${t}¢.</p><p>100 − ${t} = <b>${100-t}¢</b></p>`,nudge:`<p>Step 1: add the prices. Step 2: take that from 100¢.</p>`});},
 earnSpend:c=>{const h=c5(20,60),e=PK([10,15,20,25,30]),s=c5(15,h+e-5);const who=PK(['You','Gizmo','Nana Paws','Ozzy']);const he=who==='You'?'you':who==='Nana Paws'?'she':'he';const has=who==='You'?'have':'has';const earn=who==='You'?'earn':'earns';const spend=who==='You'?'spend':'spends';
  return st({prompt:`${who} ${has} <b>${h}¢</b>. Then ${he} ${earn} <b>${e}¢</b> more for helping and ${spend} <b>${s}¢</b> on a treat. How much money is left?`,tpl:'{A} ¢',answer:h+e-s,text:`es ${who} ${h} ${e} ${s}`,fast:30,explain:`<p>${h} + ${e} = ${h+e}¢.</p><p>${h+e} − ${s} = <b>${h+e-s}¢</b></p>`,nudge:`<p>Add what was earned first. Then take away what was spent.</p>`});},
 coinsBuy:c=>{const it=item(SMALL.filter(x=>x[4]>=40));const q=PK([1,2,3]);const left=q*25-it.p;if(left<=0)return m2.coinsBuy(c);
  return st({prompt:`You have <b>${q}</b> ${PL(q,'quarter')}. You buy ${an(it.one)} ${it.one} ${it.e} for <b>${it.p}¢</b>. How much money do you have left?`,tpl:'{A} ¢',answer:left,text:`cb ${q} ${it.one} ${it.p}`,fast:25,explain:`<p>${q} ${PL(q,'quarter')} = ${q*25}¢.</p><p>${q*25} − ${it.p} = <b>${left}¢</b></p>`,nudge:`<p>How many cents are the quarters? Then subtract.</p>`});},
billStory:c=>{const d=R(1,4);const {l,t}=coinSet([25,10,5,1],[2,6],11,97);const [who,P]=PK([['Grumbleroot the troll','He'],['Ms. Rosa','She'],['Gizmo','He'],['Ozzy','He'],['Nana Paws','She']]);
  return st(money({prompt:`${who} has ${d===1?'one $1 bill':`<b>${d}</b> $1 bills`}. ${P} also has ${coinWords(l)}. How much money is that?`,text:`bs ${who} ${d} ${l.join('+')}`,fast:25,explain:`<p>Dollars: $${d}. Coins: ${coinCount(l)} = ${t}¢.</p><p>Together <b>${$$(d*100+t)}</b>.</p>`,nudge:`<p>Dollars before the dot, cents after the dot.</p>`},d*100+t));},
 tollBoth:c=>{const n=PK([2,3]);const toll=n===2?PK([20,25,30,35,40,45]):PK([10,15,20,25,30]);const grp=n===2?`You and ${pn(c)} both cross`:`You, ${pn(c)} and ${PK(['Ozzy','Gizmo','Nana Paws'])} all cross`;
  return st({prompt:`Grumbleroot the troll charges <b>${toll}¢</b> for each one who crosses his bridge. ${grp}. You pay with a <b>$1</b> bill. How much change do you get?`,tpl:'{A} ¢',answer:100-n*toll,text:`tb ${toll} ${grp}`,fast:35,explain:`<p>Toll for ${n}: ${Array(n).fill(toll).join(' + ')} = ${n*toll}¢.</p><p>100 − ${n*toll} = <b>${100-n*toll}¢</b></p>`,nudge:`<p>Step 1: the toll for two. Step 2: count up to 100¢.</p>`});},
 coinsLeft:c=>{const {l,t}=coinSet([25,10,5],[3,5],50,95);let it;do{it=item(SMALL);}while(it.p>=t||t-it.p<5);
  return st({vis:{t:'coins',list:l},prompt:`You have these coins. You buy ${an(it.one)} ${it.one} ${it.e} for <b>${it.p}¢</b>. How much money do you have left?`,tpl:'{A} ¢',answer:t-it.p,text:`cl ${l.join('+')} ${it.one} ${it.p}`,fast:35,explain:`<p>Your coins: ${coinCount(l)} = ${t}¢.</p><p>${t} − ${it.p} = <b>${t-it.p}¢</b></p>`,nudge:`<p>Step 1: count your coins. Step 2: take away the price.</p>`});},
saveCoins:c=>{const q=R(1,3),dd=R(1,4),d2=R(1,3);const t=q*25*1+0;const days=R(2,3);const tot=days*q*25+dd*10;if(tot>99)return m2.saveCoins(c);
  return st({prompt:`You put <b>${q}</b> ${PL(q,'quarter')} in your piggy bank every day for <b>${days}</b> days. Then you find <b>${dd}</b> ${PL(dd,'dime')}. How much money do you have now?`,tpl:'{A} ¢',answer:tot,text:`sc ${q} ${days} ${dd}`,fast:40,
   explain:`<p>Each day: ${q*25}¢. ${days} days: ${Array(days).fill(q*25).join(' + ')} = ${days*q*25}¢.</p><p>Dimes: ${dd*10}¢. ${days*q*25} + ${dd*10} = <b>${tot}¢</b></p>`,nudge:`<p>Step 1: the quarters for all the days. Step 2: add the dimes.</p>`});},
 fountainMore:c=>{const [p,q]=SH(['Nana Paws','Ozzy','Skyla the eagle','Gizmo']);const a=coinSet([25,10,5],[2,4],30,95),b=coinSet([10,5,1],[2,5],10,45);if(a.t<=b.t)return m2.fountainMore(c);
  return st({prompt:`${p} tosses ${coinWords(a.l)} into the Wishing Fountain. ${q} tosses ${coinWords(b.l)}. How much more money did ${p} toss?`,tpl:'{A} ¢ more',answer:a.t-b.t,text:`fm ${p} ${a.l.join('+')} ${b.l.join('+')}`,fast:45,
   explain:`<p>${p}: ${coinCount(a.l)} = ${a.t}¢. ${q}: ${coinCount(b.l)} = ${b.t}¢.</p><p>${a.t} − ${b.t} = <b>${a.t-b.t}¢</b></p>`,nudge:`<p>Step 1: count each one's coins. Step 2: find the difference.</p>`});},
 buyTwoSame:c=>{const it=item(SMALL);let p=it.p;if(2*p>=100)p=c5(15,45);
  return st({prompt:`${cap(it.many)} cost <b>${p}¢</b> each. You buy <b>2</b> ${it.many} ${it.e} and pay with a <b>$1</b> bill. How much change do you get?`,tpl:'{A} ¢',answer:100-2*p,text:`b2 ${it.one} ${p}`,fast:40,
   explain:`<p>2 ${it.many}: ${p} + ${p} = ${2*p}¢.</p><p>100 − ${2*p} = <b>${100-2*p}¢</b></p>`,nudge:`<p>Step 1: the cost of 2. Step 2: count up to 100¢.</p>`});},
shopPay:c=>{const big=c.round>=2;let it,p=0,a,ca,cb,nb=0;do{const T=PK(SMALL);it={e:T[0],one:T[1]};const lo=Math.max(T[3],big?40:12),hi=Math.min(T[4],big?95:49);if(lo>hi)continue;p=R(lo,hi);[ca,cb]=big?PK([[25,10],[25,5]]):PK([[10,5],[10,1],[5,1]]);a=R(1,Math.floor(p/ca));nb=(p-a*ca)/cb;}while(!Number.isInteger(nb)||nb<1||nb>9);
  return st({prompt:`${cap(an(it.one))} ${it.one} ${it.e} costs <b>${p}¢</b>. You pay with <b>${a}</b> ${PL(a,COINN[ca][0],COINN[ca][1])} and some ${COINN[cb][1]}. How many ${COINN[cb][1]} do you need?`,tpl:`{A} ${COINN[cb][1]}`,answer:nb,text:`sp ${it.one} ${p} ${a} ${ca} ${cb}`,fast:30,
   explain:`<p>${a} ${PL(a,COINN[ca][0],COINN[ca][1])} = ${a*ca}¢. Still needed: ${p} − ${a*ca} = ${p-a*ca}¢.</p><p>${p-a*ca} ÷ ${cb} = <b>${nb}</b> ${COINN[cb][1]}</p>`,nudge:`<p>How much do the ${COINN[ca][1]} make? What is still missing?</p>`});},
 twoKidsCoins:c=>{const big=c.round>=2;const pool=big?[25,10,5]:[10,5,1];const [p,q]=SH(['Gizmo','Ozzy','Nana Paws','Coach Flex','Ms. Rosa']);let A,B;do{A=coinSet(pool,[2,4],big?30:12,big?95:49);B=coinSet(pool,[2,4],big?20:10,big?90:45);}while(A.t<=B.t);
  return st({prompt:`${p} has ${coinWords(A.l)}. ${q} has ${coinWords(B.l)}. How much more money does ${p} have?`,tpl:'{A} ¢ more',answer:A.t-B.t,text:`tk ${p} ${A.l.join('+')} ${q} ${B.l.join('+')}`,fast:35,
   explain:`<p>${p}: ${coinCount(A.l)} = ${A.t}¢. ${q}: ${coinCount(B.l)} = ${B.t}¢.</p><p>${A.t} − ${B.t} = <b>${A.t-B.t}¢</b></p>`,nudge:`<p>Count each one's money first, then find the difference.</p>`});},
buySmall:c=>{const big=c.round>=2;let A,it,p;do{A=coinSet(big?[25,10,5]:[10,5,1],[2,4],big?50:20,big?99:49);const T=PK(SMALL);it={one:T[1],e:T[0]};p=R(Math.max(5,T[3]-5),T[4]);}while(p>=A.t||A.t-p<3);
  return st({prompt:`You have ${coinWords(A.l)}. You buy ${an(it.one)} ${it.one} ${it.e} for <b>${p}¢</b>. How much money is left?`,tpl:'{A} ¢',answer:A.t-p,text:`bs ${A.l.join('+')} ${it.one} ${p}`,fast:30,
   explain:`<p>You have ${coinCount(A.l)} = ${A.t}¢.</p><p>${A.t} − ${p} = <b>${A.t-p}¢</b></p>`,nudge:`<p>Count your coins first, then take away the price.</p>`});},
 addMore:c=>{const big=c.round>=2;const [p,q]=SH(['Gizmo','Coach Flex','Ozzy','Skyla the eagle','Ms. Rosa']);let A,B;do{A=coinSet(big?[25,10]:[10,5],[1,3],10,60);B=coinSet(big?[10,5]:[5,1],[2,4],5,35);}while(A.t+B.t>(big?99:49));
  return st({prompt:`${p} has ${coinWords(A.l)}. ${q} gives ${heOf(p)==='she'?'her':'him'} ${coinWords(B.l)} more. How much money does ${p} have now?`,tpl:'{A} ¢',answer:A.t+B.t,text:`am ${p} ${A.l.join('+')} ${B.l.join('+')}`,fast:30,
   explain:`<p>${coinCount(A.l)} = ${A.t}¢. ${coinCount(B.l)} = ${B.t}¢.</p><p>${A.t} + ${B.t} = <b>${A.t+B.t}¢</b></p>`,nudge:`<p>Count both sets of coins, then add.</p>`});},
 fewestCoins:c=>{const big=c.round>=2;const t=big?R(26,99):R(11,49);const pool=big?[25,10,5,1]:[10,5,1];let r=t;const l=[];for(const x of pool)while(r>=x){l.push(x);r-=x;}
  return {prompt:`Make <b>${t}¢</b> with the <b>fewest</b> coins you can${big?'':' (dimes, nickels and pennies)'}. How many coins is that?`,tpl:'{A} coins',answer:l.length,text:`fc ${t} ${big}`,fast:25,
   explain:`<p>Use the biggest coins first: ${coinWords(l)}.</p><p>That's <b>${l.length}</b> coins.</p>`,nudge:`<p>Start with as many ${big?'quarters':'dimes'} as fit, then the next biggest coin.</p>`};},
 twoSmall:c=>{const [a,b]=SH([['🍬','piece of candy'],['⭐','sticker'],['🧷','button'],['🎯','marble'],['🍡','gumdrop']]).slice(0,2);const x=R(5,24),y=R(5,24);
  return st({prompt:`${cap(an(a[1]))} ${a[1]} ${a[0]} costs <b>${x}¢</b>. ${cap(an(b[1]))} ${b[1]} ${b[0]} costs <b>${y}¢</b>. What do they cost together?`,tpl:'{A} ¢',answer:x+y,text:`ts ${a[1]} ${x} ${b[1]} ${y}`,fast:20,
   explain:`<p>${x} + ${y} = <b>${x+y}¢</b></p>`,nudge:`<p>Add the tens, then the ones.</p>`});}
};
PD('money',2,[
 [m2.count,m2.makeCoin,m2.coinStory,m2.shopPay,m2.twoKidsCoins,m2.buySmall,m2.addMore,m2.fewestCoins,m2.twoSmall],
 [m2.countQ,m2.quarters,m2.fountain,m2.shopPay,m2.twoKidsCoins,m2.fewestCoins,m2.buySmall,m2.addMore,m2.moreCoins],
 [m2.bills,m2.dollarEq,m2.moreCoins,m2.billStory,m2.countQ,m2.fewestCoins,m2.twoItems,m2.needMore,m2.buySmall],
 [m2.twoItems,m2.needMore,m2.toll,m2.bills,m2.quarters,m2.billStory,m2.moreCoins,m2.dollarEq,m2.changeDollar],
 [m2.changeTwo,m2.earnSpend,m2.coinsBuy,m2.tollBoth,m2.coinsLeft,m2.saveCoins,m2.fountainMore,m2.buyTwoSame,m2.changeDollar]]);

/* ----- grade 3 ----- */
const m3={
 count5:c=>{const {l,t}=coinSet([100,100,25,10,5,1],[5,9],150,499);if(t%100===0)return m3.count5(c);
  return money({vis:{t:'coins',list:l},prompt:'What do these bills and coins add up to?',text:`c5 ${l.join('+')}`,fast:20,explain:`<p>Bills: $${l.filter(x=>x===100).length}. Coins: ${coinCount(l.filter(x=>x<100))} = ${t%100}¢.</p><p><b>${$$(t)}</b></p>`,nudge:`<p>Count the dollars, then the coins. Write dollars.cents.</p>`},t);},
 toCents:c=>{const d=R(1,4),ce=R(1,19)*5;const t=d*100+ce;
  if(Math.random()<.5)return {prompt:'Write it in cents.',tpl:`${$$(t)} = {A} ¢`,answer:t,text:`tc ${t}`,fast:12,explain:`<p>$${d} = ${d*100}¢, plus ${ce}¢ = <b>${t}¢</b></p>`,nudge:`<p>Each dollar is 100¢.</p>`};
  return money({prompt:`Write <b>${t}¢</b> with a dollar sign.`,text:`td ${t}`,fast:12,explain:`<p>${t}¢ = ${d} dollars and ${ce} cents = <b>${$$(t)}</b></p>`,nudge:`<p>Every 100¢ is one dollar. The rest are cents after the dot.</p>`},t);},
 total2:c=>{let a,b;do{[a,b]=two(MID);a.p=c25(a.p,a.p+20);b.p=c25(b.p,b.p+20);}while(a.p+b.p>500||(a.p+b.p)%100===0&&Math.random()<.6);
  return money({prompt:`At the Money Market, ${an(a.one)} ${a.one} ${a.e} costs <b>${$$(a.p)}</b> and ${an(b.one)} ${b.one} ${b.e} costs <b>${$$(b.p)}</b>. How much for both?`,text:`t2 ${a.one} ${a.p} ${b.one} ${b.p}`,fast:25,explain:`<p>Dollars: ${Math.floor(a.p/100)} + ${Math.floor(b.p/100)}. Cents: ${a.p%100} + ${b.p%100}.</p><p>${$$(a.p)} + ${$$(b.p)} = <b>${$$(a.p+b.p)}</b></p>`,nudge:`<p>Add the dollars, then the cents. 100 cents make another dollar!</p>`},a.p+b.p);},
 diff:c=>{let a,b;do{[a,b]=two(MID);a.p=c25(a.p,a.p+20);b.p=c25(b.p,b.p+20);}while(a.p===b.p);if(a.p<b.p)[a,b]=[b,a];
  return st(money({prompt:`${cap(an(a.one))} ${a.one} costs <b>${$$(a.p)}</b>. ${cap(an(b.one))} ${b.one} costs <b>${$$(b.p)}</b>. How much more does the ${a.one} cost?`,text:`df ${a.one} ${a.p} ${b.one} ${b.p}`,fast:25,explain:`<p>${a.p}¢ − ${b.p}¢ = ${a.p-b.p}¢ = <b>${M(a.p-b.p)}</b></p>`,nudge:`<p>Subtract the smaller price from the bigger one. Try counting up!</p>`},a.p-b.p));},
 groups:c=>{const v=R(0,2);
  if(v===0){const it=PK(SMALL);const p=c5(it[3],it[4]);const k=R(2,9);const t=k*p;
   return st(money({prompt:`${PL(2,it[1],it[2]).replace(/^./,ch=>ch.toUpperCase())} cost <b>${p}¢</b> each. How much do <b>${k}</b> ${it[2]} cost?`,text:`g0 ${it[1]} ${p} ${k}`,fast:25,explain:`<p>${k} × ${p}¢ = ${t}¢ = <b>${M(t)}</b></p>`,nudge:`<p>Skip count by ${p}: ${p}, ${2*p}, ${3*p}…</p>`},t));}
  if(v===1){const it=PK([['📓','notebook','notebooks',2,4],['🖍️','box of crayons','boxes of crayons',2,4],['🍕','slice of pizza','slices of pizza',2,4],['📚','book','books',5,9],['🪁','kite','kites',6,9],['🚗','toy car','toy cars',2,5]]);const p=R(it[3],it[4]);const k=R(2,9);
   return st({prompt:`${cap(it[2])} cost <b>$${p}</b> each. How much do <b>${k}</b> ${it[2]} cost?`,tpl:'$ {A}',answer:k*p,text:`g1 ${it[1]} ${p} ${k}`,fast:20,explain:`<p>${k} × $${p} = <b>$${k*p}</b></p>`,nudge:`<p>Multiply ${k} × ${p}.</p>`});}
  const k=PK([2,3,4,5,6]);const each=R(2,9);const tot=k*each;const who=PK(['Ms. Rosa','Nana Paws','the Kind Teacher']);
  return st({prompt:`${cap(who)} shares <b>$${tot}</b> equally among <b>${k}</b> helpers. How much does each helper get?`,tpl:'$ {A}',answer:each,text:`g2 ${who} ${tot} ${k}`,fast:20,explain:`<p>${tot} ÷ ${k} = <b>$${each}</b></p>`,nudge:`<p>Share $${tot} into ${k} equal parts.</p>`});},
 buyN:c=>{const it=PK([['🧁','cupcakes',2],['📓','notebooks',2],['🍦','ice cream cones',3],['🖍️','boxes of crayons',2],['🥐','croissants',2]]);const k=R(2,3);const p=it[2];const tot=k*p;const pay=tot<5?5:10;
  return st({prompt:`${PK(['Ozzy','Coach Flex','Nana Paws','Gizmo'])} buys <b>${k}</b> ${it[1]} ${it[0]} at <b>$${p}</b> each and pays with a <b>$${pay}</b> bill. How much change does ${'he'} get?`.replace(/Nana Paws(.*)he get/,'Nana Paws$1she get'),tpl:'$ {A}.00',answer:pay-tot,text:`bn ${it[1]} ${k} ${pay}`,fast:30,explain:`<p>Cost: ${k} × $${p} = $${tot}.</p><p>$${pay} − $${tot} = <b>$${pay-tot}</b></p>`,nudge:`<p>Find the cost first. Then subtract from $${pay}.</p>`});},
 fountain3:c=>{const q=R(2,8),d=R(2,9),n=R(1,6);const t=q*25+d*10+n*5;if(t<100||t%100===0)return m3.fountain3(c);const who=PK([c.name,'Skyla the eagle','the Elder Wiz']);
  return st(money({prompt:`${cap(who)} fishes coins out of the Wishing Fountain: <b>${q}</b> quarters, <b>${d}</b> dimes and <b>${n}</b> ${PL(n,'nickel')}. How much money is that?`,text:`f3 ${q} ${d} ${n} ${who}`,fast:35,explain:`<p>Quarters: ${q} × 25 = ${q*25}¢. Dimes: ${d*10}¢. Nickels: ${n*5}¢.</p><p>${q*25} + ${d*10} + ${n*5} = ${t}¢ = <b>${$$(t)}</b></p>`,nudge:`<p>Find each kind of coin's value, then add.</p>`},t));},
billStory:c=>{const d=R(1,4);const {l,t}=coinSet([25,10,5,1],[2,5],10,95);const [who,pl]=PK([['Grumbleroot the troll','his toll bucket'],['Gizmo','his gadget box'],['the Elder Wiz','his wizard hat'],['Nana Paws','her knitting bag']]);
  return st(money({prompt:`${cap(who)} empties ${pl}. Out come ${d===1?'one $1 bill':`<b>${d}</b> $1 bills`} and these coins: ${coinWords(l)}. How much money is that?`,text:`b3 ${who} ${d} ${l.join('+')}`,fast:25,explain:`<p>$${d} and ${coinCount(l)} = ${t}¢.</p><p><b>${$$(d*100+t)}</b></p>`,nudge:`<p>Dollars before the dot, cents after.</p>`},d*100+t));},
 change10:c=>{let a,b;do{[a,b]=two(MID);a.p=c25(a.p,a.p+20);b.p=c25(b.p,b.p+20);}while(a.p+b.p>900);const t=a.p+b.p;
  return st(money({prompt:`You buy ${an(a.one)} ${a.one} ${a.e} for <b>${$$(a.p)}</b> and ${an(b.one)} ${b.one} ${b.e} for <b>${$$(b.p)}</b>. You pay with a <b>$10</b> bill. How much change do you get?`,text:`c10 ${a.one} ${a.p} ${b.one} ${b.p}`,fast:35,explain:`<p>Cost: ${$$(a.p)} + ${$$(b.p)} = ${$$(t)}.</p><p>$10.00 − ${$$(t)} = <b>${M(1000-t)}</b></p>`,nudge:`<p>Step 1: add the prices. Step 2: count up to $10.</p>`},1000-t));},
 estimate:c=>{const near=x=>Math.max(85,100*Math.max(1,Math.round(x.p/100))+PK([-10,-5,5,10]));const [a,b]=two(MID);a.p=near(a);b.p=near(b);const r=Math.round(a.p/100)+Math.round(b.p/100);
  return choice({prompt:`${cap(an(a.one))} ${a.one} ${a.e} costs <b>${$$(a.p)}</b>. ${cap(an(b.one))} ${b.one} ${b.e} costs <b>${$$(b.p)}</b>. <b>About</b> how much for both?`,tpl:'about {A}',text:`est ${a.one} ${a.p} ${b.one} ${b.p}`,fast:20,explain:`<p>${$$(a.p)} is about $${Math.round(a.p/100)}. ${$$(b.p)} is about $${Math.round(b.p/100)}.</p><p>${Math.round(a.p/100)} + ${Math.round(b.p/100)} = <b>$${r}</b></p>`,nudge:`<p>Round each price to the nearest dollar, then add.</p>`},`$${r}`,[`$${r+1}`,`$${r-1}`,`$${r+2}`,`$${r*10}`].filter(x=>x!=='$0'));},
 twoKids:c=>{const s=PK([10,15,20,25]);const k=R(2,4);const p=PK([35,40,45,50,60]);const t=k*s+p;
  return st(money({prompt:`At the school fair you buy <b>${k}</b> stickers at <b>${s}¢</b> each and a pencil for <b>${p}¢</b>. How much do you spend?`,text:`tk ${k} ${s} ${p}`,fast:35,explain:`<p>Stickers: ${k} × ${s}¢ = ${k*s}¢.</p><p>${k*s} + ${p} = ${t}¢ = <b>${M(t)}</b></p>`,nudge:`<p>Step 1: the stickers. Step 2: add the pencil.</p>`},t));},
 expr:c=>{const it=PK(SMALL);const p=c5(it[3],it[4]);const k=R(3,6);
  return st(choice({prompt:`${cap(it[2])} cost <b>${p}¢</b> each. Ozzy buys <b>${k}</b> ${it[2]}. Which one shows how many cents he pays?`,tpl:'{A}',text:`ex ${it[1]} ${p} ${k}`,fast:25,explain:`<p>${k} groups of ${p}¢ is <b>${k} × ${p}</b> = ${k*p}¢.</p>`,nudge:`<p>He pays ${p}¢ again and again, ${k} times.</p>`},`${k} × ${p}`,[`${k} + ${p}`,`${p} − ${k}`,`${p} ÷ ${k}`]));},
stickers:c=>{const p=PK([15,20,35,45,55,65]);const k=R(4,9);const t=k*p;const it=PK(['stickers','pencils','toy bugs','lollipops','erasers','bookmarks']);
  return st(money({prompt:`At the school fair, ${it} cost <b>${p}¢</b> each. You buy <b>${k}</b> ${it}. How much do you spend?`,text:`st ${it} ${p} ${k}`,fast:30,explain:`<p>${k} × ${p}¢ = ${t}¢${t>=100?` = ${$$(t)}`:''}. Answer <b>${M(t)}</b>.</p>`,nudge:`<p>Multiply ${k} × ${p}. Every 100¢ is a dollar.</p>`},t));},
 saveWeek:c=>{const s=R(2,5);const w=R(3,6);const who=PK([[c.name,'',''],['Ozzy','he'],['Nana Paws','she'],['Gizmo','he'],['Coach Flex','he']]);const [thing,lo,hi]=PK([['a book',6,12],['a kite',8,15],['a puzzle',5,10],['a toy car',4,9],['a ball',5,12],['a paint set',9,16]]);const p=R(Math.min(lo,s*w-2),Math.min(hi,s*w-1));
  return st({prompt:`${who[0]} saves <b>$${s}</b> every week for <b>${w}</b> weeks. Then ${who[1]||who[0]} buys ${thing} for <b>$${p}</b>. How much money is left?`,tpl:'$ {A}.00',answer:s*w-p,text:`sw ${who[0]} ${s} ${w} ${p} ${thing}`,fast:40,explain:`<p>Saved: ${w} × $${s} = $${s*w}.</p><p>$${s*w} − $${p} = <b>$${s*w-p}</b></p>`,nudge:`<p>Step 1: how much is saved? Step 2: take away the price.</p>`});},
 change5two:c=>{let a,b;do{a=c25(50,250);b=c25(50,250);}while(a+b>=500||a===b);const [x,y]=SH(['a cupcake','a juice box','a balloon','a pencil box','a muffin','a toy car']);
  return st(money({prompt:`You buy ${x} for <b>${M(a)}</b> and ${y} for <b>${M(b)}</b>. You pay with a <b>$5</b> bill. How much change do you get?`,text:`c5t ${x} ${a} ${y} ${b}`,fast:40,explain:`<p>Cost: ${M(a)} + ${M(b)} = ${M(a+b)}.</p><p>$5.00 − ${$$(a+b)} = <b>${M(500-a-b)}</b></p>`,nudge:`<p>Step 1: add. Step 2: count up to $5.</p>`},500-a-b));},
 fountainSpend:c=>{const q=R(3,8),d=R(2,6);const t=q*25+d*10;const sp=c5(50,t-10);const who=PK([[c.name,'buys'],['Skyla the eagle','buys'],['the Elder Wiz','buys']]);
  return st(money({prompt:`${cap(who[0])} finds <b>${q}</b> quarters and <b>${d}</b> dimes by the Wishing Fountain, then ${who[1]} a treat for <b>${M(sp)}</b>. How much money is left?`,text:`fs ${who[0]} ${q} ${d} ${sp}`,fast:45,explain:`<p>Found: ${q} × 25 + ${d} × 10 = ${q*25} + ${d*10} = ${t}¢.</p><p>${t} − ${sp} = <b>${M(t-sp)}</b></p>`,nudge:`<p>Step 1: count the coins. Step 2: subtract the treat.</p>`},t-sp));},
 cafeOrder3:c=>{const it=SH([['a muffin',c25(100,200)],['a hot cocoa',c25(125,250)],['a fruit cup',c25(150,275)],['a bagel',c25(100,175)],['a smoothie',c25(250,350)]]).slice(0,3);const t=sumC(it.map(x=>x[1]));if(t>1000)return m3.cafeOrder3(c);
  return st(money({prompt:`At Ms. Rosa's café you order ${it.map(x=>`${x[0]} (<b>${$$(x[1])}</b>)`).join(', ').replace(/, ([^,]*)$/,' and $1')}. You pay with a <b>$10</b> bill. How much change do you get?`,text:`co3 ${it.map(x=>x[1]).join(' ')}`,fast:50,explain:`<p>Total: ${it.map(x=>$$(x[1])).join(' + ')} = ${$$(t)}.</p><p>$10.00 − ${$$(t)} = <b>${M(1000-t)}</b></p>`,nudge:`<p>Step 1: add all three. Step 2: count up to $10.</p>`},1000-t));},
 perFriend:c=>{const k=R(3,5);const p=R(2,4);const j=PK([25,50,75]);const t=k*(p*100+j);
  return st(money({prompt:`<b>${k}</b> friends go to the fair. Each friend pays <b>$${p}</b> for a ride and <b>${j}¢</b> for a juice. How much do they spend in all?`,text:`pf ${k} ${p} ${j}`,fast:45,explain:`<p>One friend: $${p}.00 + ${j}¢ = ${$$(p*100+j)}.</p><p>${k} friends: ${k} × ${$$(p*100+j)} = <b>${M(t)}</b></p>`,nudge:`<p>Step 1: what one friend spends. Step 2: times ${k}.</p>`},t));},
 tollTrip:c=>{const t=PK([25,50,75]);const d=R(2,4);const who=PK(['Ozzy','Gizmo','Nana Paws']);
  return st(money({prompt:`Grumbleroot the troll charges <b>${t}¢</b> to cross his bridge, each way. ${who} crosses over and back every day for <b>${d}</b> days. How much does ${who} pay in all?`,text:`tt ${t} ${d} ${who}`,fast:45,explain:`<p>One day: over and back = ${t} + ${t} = ${2*t}¢.</p><p>${d} days: ${d} × ${2*t}¢ = ${2*t*d}¢ = <b>${M(2*t*d)}</b></p>`,nudge:`<p>Step 1: the cost for one day. Step 2: times ${d}.</p>`},2*t*d));},
 earnBuy:c=>{const p=R(2,3);const k=R(3,5);const sp=c25(150,p*k*100-50);
  return st(money({prompt:`Nana Paws earns <b>$${p}</b> for each dog she walks. She walks <b>${k}</b> dogs. Then she buys yarn for <b>${$$(sp)}</b>. How much money is left?`,text:`eb ${p} ${k} ${sp}`,fast:45,explain:`<p>Earned: ${k} × $${p} = $${k*p}.</p><p>$${k*p}.00 − ${$$(sp)} = <b>${M(k*p*100-sp)}</b></p>`,nudge:`<p>Step 1: how much she earns. Step 2: subtract the yarn.</p>`},k*p*100-sp));},
 whoHasMore:c=>{const a=R(3,5)*100;const b=coinSet([100,25,10],[4,8],a-95,a+95);if(b.t===a)return m3.whoHasMore(c);const more=a>b.t?'Gizmo':'Ozzy',less=a>b.t?'Ozzy':'Gizmo';
  return st(money({prompt:`Gizmo has <b>$${a/100}</b>. Ozzy has ${coinWords(b.l)}. How much more money does ${more} have than ${less}?`,text:`hm ${a} ${b.l.join('+')}`,fast:50,explain:`<p>Ozzy: ${coinCount(b.l)} = ${b.t}¢ = ${$$(b.t)}.</p><p>${more} has more: ${M(Math.abs(a-b.t))}. Answer <b>${M(Math.abs(a-b.t))}</b>.</p>`,nudge:`<p>Step 1: count Ozzy's money. Step 2: compare and subtract.</p>`},Math.abs(a-b.t)));},
change5:c=>{const it=item(MID);const p=Math.min(475,c25(it.p,it.p+20));const [who,v]=PK([['You','buy'],['Ozzy','buys'],['Nana Paws','buys'],['Coach Flex','buys'],[c.name,'buys']]);const how=PK(['a $5 bill','five $1 bills']);
  return st(money({prompt:`${who} ${v} ${an(it.one)} ${it.one} ${it.e} for <b>${$$(p)}</b> and ${who==='You'?'pay':'pays'} with <b>${how}</b>. How much change ${who==='You'?'do you':'does '+(who===c.name?c.name:heOf(who))} get?`,text:`c5 ${it.one} ${p} ${who}`,fast:25,explain:`<p>$5 = 500¢. 500 − ${p} = ${500-p}¢ = <b>${M(500-p)}</b></p><p class="tip">Count up: ${$$(p)} → ${$$(Math.ceil(p/100)*100)} → $5.00</p>`,nudge:`<p>Count up from ${$$(p)} to the next dollar, then to $5.</p>`},500-p));},
 change2:c=>{const pay=PK([200,300]);const p=c5(pay-95,pay-5);const it=PK(['a juice box','a muffin','a pack of gum','a bag of popcorn','a toy car','a jump rope','a comic book']);const who=PK(['Grumbleroot the troll','Gizmo','Skyla the eagle','the Elder Wiz','Ms. Rosa']);
  return st(money({prompt:`${cap(who)} buys ${it} for <b>${$$(p)}</b> and pays with <b>$${pay/100}</b>. How much change does ${heOf(who)} get?`,text:`c2 ${it} ${p} ${who}`,fast:25,explain:`<p>$${pay/100} = ${pay}¢. ${pay} − ${p} = <b>${M(pay-p)}</b></p>`,nudge:`<p>Count up from ${$$(p)} to $${pay/100}.00.</p>`},pay-p));},
 quarterChange:c=>{const p=PK([125,150,175,225,250,275,325,350,375,425,450,475]);const it=PK(['a kite string','a sandwich','a book of puzzles','a bird feeder','a lunch box']);const ch=500-p;
  return st({prompt:`Gizmo buys ${it} for <b>${$$(p)}</b> and pays with a <b>$5</b> bill. The change is all quarters. How many quarters does he get?`,tpl:'{A} quarters',answer:ch/25,text:`qc ${it} ${p}`,fast:35,explain:`<p>Change: $5.00 − ${$$(p)} = ${M(ch)} = ${ch}¢.</p><p>${ch} ÷ 25 = <b>${ch/25}</b> quarters (4 quarters in each dollar).</p>`,nudge:`<p>Step 1: find the change. Step 2: 4 quarters make $1.</p>`});},
makeAmount:c=>{const d=R(1,4),q=R(0,3);let dm;const t0=d*100+q*25;dm=R(1,6);const t=t0+dm*10;
  return st({prompt:`Ms. Rosa needs <b>${$$(t)}</b> for the till. She puts in <b>${d}</b> $1 ${PL(d,'bill')}${q?` and <b>${q}</b> ${PL(q,'quarter')}`:''}. How many dimes must she add?`,tpl:'{A} dimes',answer:dm,text:`ma ${t} ${d} ${q}`,fast:35,
   explain:`<p>So far: $${d}.00${q?` + ${q*25}¢`:''} = ${$$(t0)}.</p><p>Still needed: ${$$(t)} − ${$$(t0)} = ${dm*10}¢ = <b>${dm}</b> dimes.</p>`,nudge:`<p>How much is in already? How many 10¢ coins fill the gap?</p>`});},
 compare3:c=>{const [p,q]=SH(['Ozzy','Gizmo','Nana Paws','Skyla the eagle','Coach Flex']);let A,B;do{A=coinSet([100,25,10],[3,7],120,480);B=coinSet([100,25,10,5],[3,7],110,470);}while(A.t<=B.t);
  return st(money({prompt:`${p} has ${coinWords(A.l)}. ${q} has ${coinWords(B.l)}. How much more money does ${p} have?`,text:`c3 ${A.l.join('+')} ${B.l.join('+')}`,fast:40,explain:`<p>${p}: ${$$(A.t)}. ${q}: ${$$(B.t)}.</p><p>${$$(A.t)} − ${$$(B.t)} = <b>${M(A.t-B.t)}</b></p>`,nudge:`<p>Count each one's money, then subtract.</p>`},A.t-B.t));},
 total3s:c=>{const s=SH(SMALL).slice(0,3).map(t=>({one:t[1],e:t[0],p:c5(t[3],t[4])}));const t=sumC(s.map(x=>x.p));
  return st(money({prompt:`At the school fair you buy ${s.map(x=>`${an(x.one)} ${x.one} ${x.e} (<b>${x.p}¢</b>)`).join(', ').replace(/, ([^,]*)$/,' and $1')}. What do you spend in all?`,text:`t3s ${s.map(x=>x.one+x.p).join(' ')}`,fast:35,explain:`<p>${s.map(x=>x.p).join(' + ')} = ${t}¢${t>=100?` = ${$$(t)}`:''}. Answer <b>${M(t)}</b>.</p>`,nudge:`<p>Add the three prices. Every 100¢ is $1.</p>`},t));}
};
PD('money',3,[
 [m3.count5,m3.toCents,m3.billStory,m3.makeAmount,m2.countQ,m2.bills,m2.dollarEq,m2.moreCoins,m2.shopPay],
 [m3.total2,m3.diff,m3.fountain3,m3.estimate,m3.compare3,m3.total3s,m3.makeAmount,m3.count5,m3.toCents],
 [m3.change5,m3.change2,m3.change5two,m3.quarterChange,m3.diff,m3.total2,m3.total3s,m3.compare3,m3.estimate],
 [m3.change10,m3.groups,m3.stickers,m3.twoKids,m3.expr,m3.change5,m3.quarterChange,m3.change5two,m3.cafeOrder3],
 [m3.buyN,m3.saveWeek,m3.fountainSpend,m3.cafeOrder3,m3.perFriend,m3.tollTrip,m3.earnBuy,m3.whoHasMore,m3.twoKids]]);

/* ----- grade 4 ----- */
const m4={
 total3:c=>{const s=SH(MID).slice(0,3).map(t=>({e:t[0],one:t[1],p:c5(t[3],t[4])}));const t=sumC(s.map(x=>x.p));if(t%100===0)return m4.total3(c);
  return money({prompt:`At the Money Market you buy ${s.map(x=>`${an(x.one)} ${x.one} ${x.e} (<b>${$$(x.p)}</b>)`).join(', ').replace(/, ([^,]*)$/,' and $1')}. What is the total?`,text:`t3 ${s.map(x=>x.one+x.p).join(' ')}`,fast:30,explain:`<p>${s.map(x=>$$(x.p)).join(' + ')} = <b>${$$(t)}</b></p>`,nudge:`<p>Add the cents, then the dollars. Carry when the cents reach 100.</p>`},t);},
 total2b:c=>{const a=item(BIG),b=item(MID);const t=a.p+b.p;if(t%100===0)return m4.total2b(c);
  return money({prompt:`${cap(an(a.one))} ${a.one} ${a.e} costs <b>${$$(a.p)}</b>. ${cap(an(b.one))} ${b.one} ${b.e} costs <b>${$$(b.p)}</b>. How much for both?`,text:`tb ${a.one} ${a.p} ${b.one} ${b.p}`,fast:25,explain:`<p>${$$(a.p)} + ${$$(b.p)} = <b>${$$(t)}</b></p>`,nudge:`<p>Line up the dots. Add cents, then dollars.</p>`},t);},
 toCents4:c=>{const d=R(2,19),ce=R(1,99);const t=d*100+ce;
  return Math.random()<.5?{prompt:'Write it in cents.',tpl:`${$$(t)} = {A} ¢`,answer:t,text:`t4 ${t}`,fast:12,explain:`<p>$${d} = ${d*100}¢. ${d*100} + ${ce} = <b>${t}¢</b></p>`,nudge:`<p>Each dollar is 100 cents.</p>`}
   :money({prompt:`Write <b>${N(t)}¢</b> in dollars and cents.`,text:`t4d ${t}`,fast:12,explain:`<p>${t}¢ = ${d} dollars and ${ce} cents = <b>${$$(t)}</b></p>`,nudge:`<p>100¢ = $1. How many hundreds are in ${t}?</p>`},t);},
 cmpPrice:c=>{const x=c5(150,950),y=c5(150,950);if(x===y)return m4.cmpPrice(c);const s=sgn(x-y);
  return choice({tpl:`${$$(x)} {A} ${N(y)}¢`,prompt:'Compare the amounts.',text:`cp ${x} ${y}`,fast:12,explain:`<p>${$$(x)} = ${x}¢. ${x} ${s} ${y}, so <b>${s}</b>.</p>`,nudge:`<p>Change the dollars to cents first.</p>`},s,CMP);},
 change1020:c=>{const big=Math.random()<.5;const pay=big?2000:1000;const it=item(big?BIG:MID.concat(BIG.slice(0,1)));let p=it.p;if(p>=pay)p=pay-c5(100,400);
  return st(money({prompt:`${PK(['You','Coach Flex','Nana Paws','Gizmo','Dr. Quartz'])} ${PK(['buy','buys'])} ${an(it.one)} ${it.one} ${it.e} for <b>${$$(p)}</b> with a <b>$${pay/100}</b> bill. How much change?`.replace(/^You buys/,'You buy').replace(/^(Coach Flex|Nana Paws|Gizmo|Dr\. Quartz) buy /,'$1 buys '),text:`ch ${it.one} ${p} ${pay}`,fast:25,explain:`<p>$${pay/100}.00 − ${$$(p)} = <b>${M(pay-p)}</b></p><p class="tip">Count up: ${$$(p)} → ${$$(Math.ceil(p/100)*100)} → $${pay/100}.00</p>`,nudge:`<p>Count up from ${$$(p)} to the next dollar, then to $${pay/100}.</p>`},pay-p));},
 saveUp:c=>{const S=PK([['a kite',1400,1800],['a skateboard',3000,4500],['a board game',1500,2400],['a soccer ball',1200,2000]]);const price=100*R(S[1]/100,S[2]/100);const has=100*R(3,8);const wk=PK([200,300,400,500]);const need=price-has;const w=Math.ceil(need/wk);
  return st({prompt:`${c.name} wants ${S[0]} that costs <b>${$$(price)}</b>. ${c.name} has <b>${$$(has)}</b> and saves <b>${$$(wk)}</b> every week. How many weeks until ${c.name} has enough?`,tpl:`{A} ${'weeks'}`,answer:w,text:`su ${S[0]} ${price} ${has} ${wk}`,fast:45,
   explain:`<p>Still needed: ${$$(price)} − ${$$(has)} = ${$$(need)}.</p><p>${$$(need)} ÷ ${$$(wk)} = ${need%wk?(need/wk).toFixed(2).replace(/0+$/,''):need/wk}${need%wk?`, so round <b>up</b>: <b>${w}</b> weeks`:`: <b>${w}</b> weeks`}.</p>`,nudge:`<p>How much more is needed? How many weeks of saving cover it? A part-week still counts as a week!</p>`});},
changeTwo4:c=>{const [a,b]=two(MID);const t=a.p+b.p;const pay=t<1000?1000:2000;
  return st(money({prompt:`You buy ${an(a.one)} ${a.one} ${a.e} for <b>${$$(a.p)}</b> and ${an(b.one)} ${b.one} ${b.e} for <b>${$$(b.p)}</b>. You pay with <b>$${pay/100}</b>. How much change do you get?`,text:`c24 ${a.one} ${a.p} ${b.one} ${b.p}`,fast:35,explain:`<p>Cost: ${$$(a.p)} + ${$$(b.p)} = ${$$(t)}.</p><p>$${pay/100}.00 − ${$$(t)} = <b>${M(pay-t)}</b></p>`,nudge:`<p>Add the prices, then count up to $${pay/100}.</p>`},pay-t));},
 timesPrice:c=>{const k=R(3,9);if(true){const it=PK([['📚','books',12,18],['🧢','caps',14,22],['🪁','kites',13,19],['🎲','board games',16,29],['🎒','backpacks',24,38],['⚽','soccer balls',15,25]]);const p=R(it[2],it[3]);
   return {prompt:`${cap(it[1])} ${it[0]} cost <b>$${p}</b> each. How much do <b>${k}</b> cost?`,tpl:'$ {A}.00',answer:k*p,text:`tpd ${it[1]} ${p} ${k}`,fast:20,explain:`<p>${k} × $${p} = <b>$${k*p}</b></p>`,nudge:`<p>Multiply ${k} × ${p}.</p>`};}
  const it=PK(SMALL);let p;do{p=c5(Math.max(25,it[3]),Math.max(35,it[4]+10));}while(p%25===0);const t=k*p;
  return money({prompt:`${cap(it[2])} ${it[0]} cost <b>${p}¢</b> each. How much do <b>${k}</b> cost?`,text:`tpc ${it[1]} ${p} ${k}`,fast:25,explain:`<p>${k} × ${p}¢ = ${t}¢${t>=100?` = ${$$(t)}`:''}. Answer <b>${M(t)}</b>.</p>`,nudge:`<p>Multiply in cents, then change 100¢ into $1.</p>`},t);},
 timesStory:c=>{const S=PK([['Ozzy sells train tickets for','each. He sells','tickets. How much money does he take in?'],['Ms. Rosa sells muffins for','each. She sells','muffins this morning. How much money is that?'],['Grumbleroot charges a toll of','per cart. He counts','carts today. How much toll money does he get?'],['Nana Paws earns','for each dog walk. She does','walks. How much does she earn?']]);
  let p,k;do{p=PK([45,55,65,75,85,95]);k=R(4,9);}while((p*k)%100===0);const t=p*k;
  return st(money({prompt:`${S[0]} <b>${M(p)}</b> ${S[1]} <b>${k}</b> ${S[2]}`,text:`ts ${S[0].slice(0,5)} ${p} ${k}`,fast:30,explain:`<p>${k} × ${M(p)}${p<100?` = ${k} × ${p}¢ = ${t}¢`:''} = <b>${M(t)}</b></p>`,nudge:`<p>Multiply the price by ${k}.${p<100?' Then change every 100¢ into $1.':''}</p>`},t));},
 unitPrice:c=>{const k=PK([2,3,4,5,6]);const it=PK([['📚','books',5,9],['🧢','caps',8,12],['🪁','kites',6,9],['🎲','board games',12,19],['🧸','teddy bears',9,15],['🍦','ice cream cones',3,5]]);const each=R(it[2],it[3]);const t=k*each;
  return {prompt:`<b>${k}</b> ${it[1]} ${it[0]} cost <b>$${t}</b> in all. What does <b>one</b> cost?`,tpl:'$ {A}.00',answer:each,text:`up ${it[1]} ${t} ${k}`,fast:25,explain:`<p>$${t} ÷ ${k} = <b>$${each}</b></p><p class="tip">Check: ${k} × $${each} = $${t} ✓</p>`,nudge:`<p>Share $${t} into ${k} equal parts.</p>`};},
 deal:c=>{const it=PK([['🍪','cookies'],['🧃','juice boxes'],['✏️','pencils'],['🎾','tennis balls'],['🧁','cupcakes']]);let a,b,pa,pb,N,ta,tb;
  do{N=PK([12,12,24,18,20]);[a,b]=SH([2,3,4,5,6].filter(x=>N%x===0)).slice(0,2);pa=R(1,6);pb=R(1,6);ta=N/a*pa;tb=N/b*pb;}while(a===undefined||b===undefined||ta===tb||Math.abs(ta-tb)>4);
  const r=ta<tb?`packs of ${a}`:`packs of ${b}`;
  return st(choice({prompt:`You need <b>${N}</b> ${it[1]} ${it[0]}. Packs of <b>${a}</b> cost <b>$${pa}</b>. Packs of <b>${b}</b> cost <b>$${pb}</b>. Which costs less for ${N} ${it[1]}?`,tpl:'{A}',text:`dl ${N} ${a} ${pa} ${b} ${pb}`,fast:40,
   explain:`<p>Packs of ${a}: ${N} ÷ ${a} = ${N/a} packs × $${pa} = $${ta}.</p><p>Packs of ${b}: ${N} ÷ ${b} = ${N/b} packs × $${pb} = $${tb}.</p><p><b>${cap(r)}</b> cost less.</p>`,nudge:`<p>How many packs of each would you need? What would they cost?</p>`},r,[`packs of ${a}`,`packs of ${b}`]));},
 budget:c=>{const have=PK([2000,2500,3000]);const n=PK([['📓','notebooks'],['🖍️','boxes of markers'],['🧁','cupcakes']]);const k=R(2,4);const p=100*R(2,4);const x=item(BIG.slice(0,3));const t=k*p+x.p;if(t>=have)return m4.budget(c);
  return st(money({prompt:`You have <b>${$$(have)}</b>. You buy <b>${k}</b> ${n[1]} ${n[0]} at <b>$${p/100}</b> each and ${an(x.one)} ${x.one} ${x.e} for <b>${$$(x.p)}</b>. How much money is left?`,text:`bd ${k} ${p} ${x.one} ${x.p} ${have}`,fast:45,
   explain:`<p>${k} × $${p/100} = $${k*p/100}.</p><p>$${k*p/100}.00 + ${$$(x.p)} = ${$$(t)}.</p><p>${$$(have)} − ${$$(t)} = <b>${M(have-t)}</b></p>`,nudge:`<p>Step 1: cost of the ${n[1]}. Step 2: add the ${x.one}. Step 3: subtract from ${$$(have)}.</p>`},have-t));},
 snackRun:c=>{const S=PK([['Coach Flex','team snacks','He'],['the Kind Teacher','class party','She'],['Ms. Rosa','café','She'],['Nana Paws','dog park picnic','She']]);const k=R(3,5);const p=100*R(2,3);const k2=R(2,4);const p2=PK([50,75,95,85,65]);const t=k*p+k2*p2;const pay=t<1000?1000:2000;
  return st(money({prompt:`For the ${S[1]}, ${S[0]} buys <b>${k}</b> juice jugs at <b>$${p/100}</b> each and <b>${k2}</b> bags of pretzels at <b>${p2}¢</b> each. ${S[2]} pays with <b>$${pay/100}</b>. How much change?`,text:`sr ${S[0]} ${k} ${p} ${k2} ${p2}`,fast:50,
   explain:`<p>Jugs: ${k} × $${p/100} = $${k*p/100}. Pretzels: ${k2} × ${p2}¢ = ${k2*p2}¢ = ${M(k2*p2)}.</p><p>Total ${$$(t)}. $${pay/100}.00 − ${$$(t)} = <b>${M(pay-t)}</b></p>`,nudge:`<p>Find each cost, add them, then subtract from $${pay/100}.</p>`},pay-t));},
 shareBill4:c=>{const k=PK([2,3,4,5]);let a,b;do{a=R(12,30);b=R(4,12);}while((a+b)%k!==0);
  return st({prompt:`<b>${k}</b> friends buy a pizza for <b>$${a}</b> and drinks for <b>$${b}</b>. They share the cost equally. How much does each friend pay?`,tpl:'$ {A}.00',answer:(a+b)/k,text:`sb ${k} ${a} ${b}`,fast:40,explain:`<p>Total: $${a} + $${b} = $${a+b}.</p><p>$${a+b} ÷ ${k} = <b>$${(a+b)/k}</b></p>`,nudge:`<p>Add the costs first, then share equally.</p>`});},
 expr:c=>{const pay=PK([10,20]);const k=R(2,4);const p=R(2,Math.floor((pay-1)/k));const it=PK(['books','caps','puzzles','kites']);
  return st(choice({prompt:`Gizmo buys <b>${k}</b> ${it} at <b>$${p}</b> each. He pays with a <b>$${pay}</b> bill. Which one shows his change?`,tpl:'{A}',text:`ex4 ${k} ${p} ${pay} ${it}`,fast:30,explain:`<p>Cost: ${k} × ${p}. Change: take the cost away from ${pay}.</p><p><b>${pay} − (${k} × ${p})</b> = ${pay-k*p}</p>`,nudge:`<p>First the cost of all the ${it}, then the change.</p>`},`${pay} − (${k} × ${p})`,[`(${pay} − ${k}) × ${p}`,`${pay} − ${k} − ${p}`,`${k} × ${p} + ${pay}`]));},
 estimate:c=>{const s=SH(MID).slice(0,3).map(t=>({one:t[1],p:Math.max(85,100*Math.max(1,Math.round(c5(t[3],t[4])/100))+PK([-15,-10,-5,5,10,15]))}));const r=sumC(s.map(x=>Math.round(x.p/100)));
  return choice({prompt:`You buy ${s.map(x=>`${an(x.one)} ${x.one} (<b>${$$(x.p)}</b>)`).join(', ').replace(/, ([^,]*)$/,' and $1')}. <b>About</b> how much is that?`,tpl:'about {A}',text:`es4 ${s.map(x=>x.p).join(' ')}`,fast:25,explain:`<p>Round to the nearest dollar: ${s.map(x=>'$'+Math.round(x.p/100)).join(' + ')} = <b>$${r}</b></p>`,nudge:`<p>Round each price to the nearest dollar, then add.</p>`},`$${r}`,[`$${r+2}`,`$${r-2}`,`$${r+1}`,`$${r*10}`]);},
timesCents:c=>{const k=R(6,9);const it=PK([['🍭','lollipops'],['🧃','juice boxes'],['🍪','cookies'],['🎈','balloons'],['🍌','bananas']]);const p=PK([35,45,55,65,75,85,95]);const t=k*p;if(t%100===0)return m4.timesCents(c);const pay=Math.floor(t/500)*500+500+(Math.random()<.5?500:0);
  return st(money({prompt:`${cap(it[1])} ${it[0]} cost <b>${p}¢</b> each. You buy <b>${k}</b> and pay with <b>$${pay/100}</b>. How much change do you get?`,text:`tc ${it[1]} ${p} ${k} ${pay}`,fast:45,explain:`<p>Cost: ${k} × ${p}¢ = ${t}¢ = ${$$(t)}.</p><p>$${pay/100}.00 − ${$$(t)} = <b>${M(pay-t)}</b></p>`,nudge:`<p>Step 1: multiply in cents. Step 2: change to dollars. Step 3: subtract from $${pay/100}.</p>`},pay-t));},
 groupChange:c=>{const k=R(3,6);const p=PK([3,4,5,6,7,8,9]);const extra=c25(125,475);const t=k*p*100+extra;const pay=t<2000?2000:t<5000?5000:10000;const S=PK([['Coach Flex','jump ropes','a whistle'],['the Kind Teacher','paint sets','a roll of tape'],['Gizmo','gear kits','a can of oil']]);
  return st(money({prompt:`${cap(S[0])} buys <b>${k}</b> ${S[1]} at <b>$${p}</b> each and ${S[2]} for <b>${$$(extra)}</b>. ${cap(heOf(S[0]))} pays with <b>$${pay/100}</b>. How much change?`,text:`gc ${S[0]} ${k} ${p} ${extra} ${pay}`,fast:50,explain:`<p>${k} × $${p} = $${k*p}. Plus ${$$(extra)} = ${$$(t)}.</p><p>$${pay/100}.00 − ${$$(t)} = <b>${M(pay-t)}</b></p>`,nudge:`<p>Step 1: multiply. Step 2: add. Step 3: subtract.</p>`},pay-t));},
 lemonade:c=>{const p=PK([25,50,75]);const k=PK([12,16,20,24]);const cost=100*R(2,4)+PK([0,25,50]);const t=k*p-cost;if(t<=0)return m4.lemonade(c);
  return st(money({prompt:`${c.name} sells lemonade for <b>${p}¢</b> a cup and sells <b>${k}</b> cups. The lemons and cups cost <b>${$$(cost)}</b>. How much money does ${c.name} make after paying for them?`,text:`lm ${p} ${k} ${cost}`,fast:50,explain:`<p>Sales: ${k} × ${p}¢ = ${k*p}¢ = ${$$(k*p)}.</p><p>${$$(k*p)} − ${$$(cost)} = <b>${M(t)}</b></p>`,nudge:`<p>Step 1: total sales. Step 2: subtract the cost.</p>`},t));},
 rideTickets:c=>{const ad=R(4,7),kd=R(2,3);const na=R(1,3),nk=R(2,5);const t=na*ad+nk*kd;const pay=t<20?20:50;
  return st({prompt:`Ozzy's train ride costs <b>$${ad}</b> for a grown-up and <b>$${kd}</b> for a kid. <b>${na}</b> ${PL(na,'grown-up')} and <b>${nk}</b> kids ride. They pay with <b>$${pay}</b>. How much change do they get?`,tpl:'$ {A}.00',answer:pay-t,text:`rt ${ad} ${kd} ${na} ${nk}`,fast:50,explain:`<p>Grown-ups: ${na} × $${ad} = $${na*ad}. Kids: ${nk} × $${kd} = $${nk*kd}.</p><p>Total $${t}. $${pay} − $${t} = <b>$${pay-t}</b></p>`,nudge:`<p>Step 1: grown-ups. Step 2: kids. Step 3: add, then subtract from $${pay}.</p>`});},
 walkEarn:c=>{const p=PK([3,4,5]);const a=R(2,4),b=R(2,4);const sp=c25(500,(a+b)*p*100-100);
  return st(money({prompt:`Nana Paws earns <b>$${p}</b> for each dog walk. She does <b>${a}</b> walks on Saturday and <b>${b}</b> on Sunday. Then she spends <b>${$$(sp)}</b> on yarn. How much is left?`,text:`we ${p} ${a} ${b} ${sp}`,fast:50,explain:`<p>Walks: ${a} + ${b} = ${a+b}. Earned: ${a+b} × $${p} = $${(a+b)*p}.</p><p>$${(a+b)*p}.00 − ${$$(sp)} = <b>${M((a+b)*p*100-sp)}</b></p>`,nudge:`<p>Step 1: all the walks. Step 2: money earned. Step 3: subtract the yarn.</p>`},(a+b)*p*100-sp));},
billsCoins:c=>{const f=R(0,2),o=R(1,4);const {l,t}=coinSet([25,10,5],[2,5],20,95);const tot=f*500+o*100+t;const who=PK(['Grumbleroot the troll','Ozzy','Coach Flex','Ms. Rosa']);
  return money({prompt:`${who} counts the cash box: ${f?`<b>${f}</b> $5 ${PL(f,'bill')}, `:''}<b>${o}</b> $1 ${PL(o,'bill')} and ${coinWords(l)}. How much is in the box?`,text:`bc ${f} ${o} ${l.join('+')}`,fast:35,explain:`<p>Bills: ${f?`${f} × $5 + `:''}${o} × $1 = $${f*5+o}. Coins: ${coinCount(l)} = ${t}¢.</p><p>Total <b>${$$(tot)}</b></p>`,nudge:`<p>Bills first, then the coins.</p>`},tot);},
 priceDiff:c=>{const a=item(BIG),b=item(MID);
  return st(money({prompt:`${cap(an(a.one))} ${a.one} ${a.e} costs <b>${$$(a.p)}</b>. ${cap(an(b.one))} ${b.one} ${b.e} costs <b>${$$(b.p)}</b>. How much more does the ${a.one} cost?`,text:`pd ${a.one} ${a.p} ${b.one} ${b.p}`,fast:30,explain:`<p>${$$(a.p)} − ${$$(b.p)} = <b>${M(a.p-b.p)}</b></p>`,nudge:`<p>Subtract. Count up from ${$$(b.p)} if it helps.</p>`},a.p-b.p));},
 twoPeople:c=>{const [p,q]=SH(['Ozzy','Gizmo','Nana Paws','Coach Flex','Skyla the eagle']);let A,B;do{A=c5(800,1900);B=c5(300,1500);}while(A<=B);
  return st(money({prompt:`${p} has <b>${$$(A)}</b> in a piggy bank. ${q} has <b>${$$(B)}</b>. How much more does ${p} have?`,text:`tp ${p} ${A} ${q} ${B}`,fast:30,explain:`<p>${$$(A)} − ${$$(B)} = <b>${M(A-B)}</b></p>`,nudge:`<p>Subtract the smaller amount from the bigger one.</p>`},A-B));}
};
PD('money',4,[
 [m4.total3,m4.total2b,m4.toCents4,m4.cmpPrice,m4.billsCoins,m4.twoPeople,m3.quarterChange,m3.groups,m3.makeAmount],
 [m4.change1020,m4.changeTwo4,m4.priceDiff,m4.total2b,m4.billsCoins,m4.toCents4,m3.groups,m3.makeAmount,m3.quarterChange],
 [m4.timesPrice,m4.timesStory,m4.change1020,m4.changeTwo4,m4.expr,m4.priceDiff,m4.total3,m4.estimate,m4.unitPrice],
 [m4.unitPrice,m4.deal,m4.changeTwo4,m4.estimate,m4.timesCents,m4.groupChange,m4.timesPrice,m4.expr,m4.shareBill4],
 [m4.budget,m4.saveUp,m4.snackRun,m4.shareBill4,m4.deal,m4.lemonade,m4.rideTickets,m4.walkEarn,m4.groupChange]]);

/* ----- grade 5: decimals to hundredths ----- */
const m5={
 addDec:c=>{let a,b;do{a=R(105,1999);b=R(105,1999);}while((a+b)%100===0||a%100===0||b%100===0);
  return money({tpl:'',text:`ad ${a} ${b}`,fast:25,explain:`<p>Line up the dots: ${$$(a)} + ${$$(b)} = <b>${$$(a+b)}</b></p>`,nudge:`<p>Add the cents, carry if they pass 100, then add the dollars.</p>`},a+b,`${$$(a)} + ${$$(b)} = `);},
 subDec:c=>{let a,b;do{a=R(500,2999);b=R(105,a-50);}while((a-b)%100===0||a%100===0||b%100===0);
  return money({text:`sd ${a} ${b}`,fast:25,explain:`<p>Line up the dots: ${$$(a)} − ${$$(b)} = <b>${M(a-b)}</b></p>`,nudge:`<p>Subtract the cents first. Trade a dollar for 100¢ if you need to.</p>`},a-b,`${$$(a)} − ${$$(b)} = `);},
 change20:c=>{const pay=PK([2000,5000]);const a=R(pay===2000?305:1205,pay-105);if(a%100===0)return m5.change20(c);const it=PK(['a kite','a book','a model rocket','a puzzle','a beach towel','a lamp','a backpack','a pair of goggles']);const who=PK(['Gizmo','Ms. Rosa','Coach Flex','Nana Paws','Dr. Quartz','Skyla the eagle']);
  return st(money({prompt:`${who} buys ${it} for <b>${$$(a)}</b> and pays with a <b>$${pay/100}</b> bill. How much change does ${heOf(who)} get?`,text:`c20 ${who} ${it} ${a} ${pay}`,fast:25,explain:`<p>$${pay/100}.00 − ${$$(a)} = <b>${M(pay-a)}</b></p>`,nudge:`<p>Count up from ${$$(a)} to the next dollar, then to $${pay/100}.</p>`},pay-a));},
 cafe:c=>{const it=SH([['a muffin',R(145,295)],['a hot cocoa',R(175,325)],['a fruit cup',R(225,395)],['a bagel',R(125,245)]]).slice(0,2);const t=it[0][1]+it[1][1];if(t%100===0)return m5.cafe(c);
  return st(money({prompt:`Ms. Rosa's café menu: ${it[0][0]} costs <b>${$$(it[0][1])}</b> and ${it[1][0]} costs <b>${$$(it[1][1])}</b>. What do they cost together?`,text:`cf ${it[0][1]} ${it[1][1]}`,fast:25,explain:`<p>${$$(it[0][1])} + ${$$(it[1][1])} = <b>${$$(t)}</b></p>`,nudge:`<p>Line up the dots and add.</p>`},t));},
 mulDec:c=>{const p=PK([125,175,225,250,275,85,95,149,199,345,425,0]);const pp=p||R(105,495);const k=R(3,9);const t=pp*k;
  return money({text:`md ${pp} ${k}`,fast:25,explain:`<p>${$$(pp)} × ${k} = ${pp}¢ × ${k} = ${t}¢ = <b>${M(t)}</b></p>${pp>=100?`<p class="tip">Or: $${Math.floor(pp/100)} × ${k} = $${Math.floor(pp/100)*k}, and ${pp%100}¢ × ${k} = ${(pp%100)*k}¢.</p>`:''}`,nudge:`<p>Multiply as if there were no dot (${pp} × ${k}), then put 2 digits after the dot.</p>`},t,`${$$(pp)} × ${k} = `);},
 mulStory:c=>{const S=PK([['Ozzy\'s train tickets cost','each. A class of','kids rides the train. How much do the tickets cost?',[18,24,25]],['Ms. Rosa sells croissants for','each. She sells','croissants. How much money does she make?',[6,12]],['Coach Flex buys water bottles for','each for','players. How much does he spend?',[8,12]],['Skyla the eagle buys fish snacks for','each for her','eaglets. How much does she spend?',[3,6]]]);
  const k=R(S[3][0],S[3][S[3].length-1]);const p=PK([125,150,175,225,250,75,95,135,215]);const t=k*p;
  return st(money({prompt:`${S[0]} <b>${$$(p)}</b> ${S[1]} <b>${k}</b> ${S[2]}`,text:`ms ${S[0].slice(0,5)} ${p} ${k}`,fast:35,explain:`<p>${k} × ${$$(p)} = ${k} × ${p}¢ = ${t}¢ = <b>${M(t)}</b></p>`,nudge:`<p>Multiply ${p} × ${k}, then put the dot back 2 places from the right.</p>`},t));},
 divDec:c=>{const k=PK([2,3,4,5,6,8]);let each;do{each=R(55,495);}while(each%100===0||(each*k)%100===0&&Math.random()<.5);const t=each*k;
  return money({text:`dd ${t} ${k}`,fast:30,explain:`<p>${t}¢ ÷ ${k} = ${each}¢ = <b>${M(each)}</b></p><p class="tip">Check: ${$$(each)} × ${k} = ${$$(t)} ✓</p>`,nudge:`<p>Think in cents: ${t}¢ ÷ ${k}. Then write it with a dot.</p>`},each,`${$$(t)} ÷ ${k} = `);},
 shareStory:c=>{const k=PK([3,4,5,6]);let each;do{each=R(105,895);}while(each%100===0||each%5!==0);const t=each*k;const S=PK([['friends split a pizza bill of','equally. How much does each friend pay?'],['dog owners split Nana Paws\'s bill of','equally. How much does each owner pay?'],['kids share the cost of a gift,','equally. How much does each kid pay?']]);
  return st(money({prompt:`<b>${k}</b> ${S[0]} <b>${$$(t)}</b> ${S[1]}`,text:`sh ${S[0].slice(0,5)} ${t} ${k}`,fast:35,explain:`<p>${$$(t)} ÷ ${k} = <b>${M(each)}</b></p><p class="tip">Check: ${k} × ${$$(each)} = ${$$(t)} ✓</p>`,nudge:`<p>Divide the dollars first, change leftovers to cents, keep going.</p>`},each));},
 betterBuy:c=>{const it=PK([['🧃','juice boxes'],['🖍️','markers'],['🧦','pairs of socks (the Elder Wiz needs them!)'],['🔋','batteries for Gizmo'],['🍪','cookies']]);let a,b,ua,ub;
  do{a=PK([3,4,5,6,8]);b=PK([4,6,8,10,12]);ua=R(35,160);ub=ua+PK([-1,1])*R(3,12);}while(a===b||ub<25||(a*ua)%100===0||(b*ub)%100===0);
  const r=ua<ub?`${a} for ${$$(a*ua)}`:`${b} for ${$$(b*ub)}`;
  return choice({prompt:`⭐ Challenge: which is the better buy for ${it[1]} ${it[0]}: <b>${a} for ${$$(a*ua)}</b> or <b>${b} for ${$$(b*ub)}</b>?`,tpl:'{A}',text:`bb ${a} ${ua} ${b} ${ub}`,fast:40,
   explain:`<p>${$$(a*ua)} ÷ ${a} = ${M(ua)} each. ${$$(b*ub)} ÷ ${b} = ${M(ub)} each.</p><p>Better buy: <b>${r}</b>.</p>`,nudge:`<p>Divide to find the price of one in each pack.</p>`},r,[`${a} for ${$$(a*ua)}`,`${b} for ${$$(b*ub)}`]);},
 saving:c=>{const S=PK([['a telescope',4500,8900],['a pair of skates',3500,6500],['a guitar',6000,9900],['a bike helmet',2500,4500]]);const price=R(S[1]/5,S[2]/5)*5;let wk;do{wk=R(12,40)*25;}while(price%wk===0);const w=Math.ceil(price/wk);
  return st({prompt:`${c.name} is saving for ${S[0]} that costs <b>${$$(price)}</b>. ${c.name} saves <b>${$$(wk)}</b> each week. How many weeks until ${c.name} has enough?`,tpl:'{A} weeks',answer:w,text:`sv ${S[0]} ${price} ${wk}`,fast:45,
   explain:`<p>${$$(price)} ÷ ${$$(wk)} is between ${w-1} and ${w}.</p><p>After ${w-1} weeks: ${$$((w-1)*wk)}, not enough. After ${w} weeks: ${$$(w*wk)}. So <b>${w}</b> weeks.</p>`,nudge:`<p>Divide, then round <b>up</b>: a part-week of saving still needs a whole week.</p>`});},
 perItem:c=>{const k=PK([4,5,6,8,10]);let each;do{each=R(35,395);}while(each%100===0);const t=each*k;const it=PK(['bags of crystal sand','toy trains','sticky-note pads','jars of jam','knitting needles']);
  return money({prompt:`A pack of <b>${k}</b> ${it} costs <b>${$$(t)}</b>. What is the price of one?`,text:`pi ${it} ${t} ${k}`,fast:30,explain:`<p>${$$(t)} ÷ ${k} = <b>${M(each)}</b></p>`,nudge:`<p>Share the price into ${k} equal parts.</p>`},each);},
 shopping:c=>{const pay=PK([2000,5000,5000]);const a=PK([125,175,249,295,350,425]);const ka=R(2,4);const b=R(1,Math.floor((pay-ka*a-100)/100))*100+PK([25,49,75,99,50]);if(b<=0||ka*a+b>=pay)return m5.shopping(c);
  const it=PK([['notebooks','a backpack'],['juice jugs','a picnic blanket'],['tennis balls','a racket'],['sticker packs','a sketchbook']]);const t=ka*a+b;
  return st(money({prompt:`${c.name} buys <b>${ka}</b> ${it[0]} at <b>${$$(a)}</b> each and ${it[1]} for <b>${$$(b)}</b>. ${c.name} pays with <b>$${pay/100}</b>. How much change?`,text:`sp ${ka} ${a} ${b} ${pay}`,fast:50,
   explain:`<p>${ka} × ${$$(a)} = ${$$(ka*a)}.</p><p>${$$(ka*a)} + ${$$(b)} = ${$$(t)}.</p><p>$${pay/100}.00 − ${$$(t)} = <b>${M(pay-t)}</b></p>`,nudge:`<p>Step 1: multiply. Step 2: add. Step 3: subtract from $${pay/100}.</p>`},pay-t));},
 split:c=>{const k=PK([3,4,5]);const items=[[R(4,9)*100+PK([25,50,75,95]),'pizza'],[R(2,5)*100+PK([25,50,75]),'salad'],[R(1,3)*100+PK([25,50,75]),'drinks']];let t=sumC(items.map(x=>x[0]));if(t%k!==0||(t/k)%100===0)return m5.split(c);
  return st(money({prompt:`At Ms. Rosa's café, <b>${k}</b> friends order pizza for <b>${$$(items[0][0])}</b>, a salad for <b>${$$(items[1][0])}</b> and drinks for <b>${$$(items[2][0])}</b>. They split the bill equally. How much does each friend pay?`,text:`spl ${k} ${items.map(x=>x[0]).join(' ')}`,fast:50,
   explain:`<p>Total: ${items.map(x=>$$(x[0])).join(' + ')} = ${$$(t)}.</p><p>${$$(t)} ÷ ${k} = <b>${M(t/k)}</b></p>`,nudge:`<p>Add the whole bill first. Then divide by ${k}.</p>`},t/k));},
 fountainSave:c=>{const wk=R(3,6);const per=PK([125,175,225,250,275,350]);const spent=R(3,8)*100+PK([25,50,75,49]);const t=wk*per-spent;if(t<=0||t%100===0)return m5.fountainSave(c);
  return st(money({prompt:`Every week for <b>${wk}</b> weeks, the Elder Wiz collects <b>${$$(per)}</b> from the Wishing Fountain. Then he spends <b>${$$(spent)}</b> on new socks. How much is left?`,text:`fs ${wk} ${per} ${spent}`,fast:45,
   explain:`<p>${wk} × ${$$(per)} = ${$$(wk*per)}.</p><p>${$$(wk*per)} − ${$$(spent)} = <b>${M(t)}</b></p>`,nudge:`<p>Multiply first, then subtract.</p>`},t));},
perPound:c=>{const S=PK([['Apples cost','Ms. Rosa','she'],['Cheese costs','Gizmo','he'],['Grapes cost','Nana Paws','she'],['Crystal sand costs','Dr. Quartz','he'],['Fish costs','Skyla the eagle','she']]);const p=10*R(12,59);const w=PK([5,15,25,35,12,24,32,15,25]);const t=p*w/10;
  return st(money({prompt:`${S[0]} <b>${$$(p)}</b> per pound. ${S[1]} buys <b>${wt(w)}</b> pounds. How much does ${S[2]} pay?`,text:`pp ${S[0]} ${p} ${w}`,fast:40,explain:`<p>${$$(p)} × ${D(w,1)} = ${p} × ${w} = ${p*w}, then put 3 decimal places back: ${(p*w/1000).toFixed(3)}.</p><p>That is <b>${M(t)}</b>.</p>`,nudge:`<p>Multiply without the dots, then count the decimal places in both numbers.</p>`},t));},
 est5:c=>{const k=R(4,9);const d=R(2,9);const p=d*100+PK([-11,-9,-5,-2,2,5,8]);const S=PK([['Gizmo buys','gadget kits'],['Ms. Rosa buys','bags of flour'],['Coach Flex buys','jump ropes']]);
  return choice({prompt:`${S[0]} <b>${k}</b> ${S[1]} at <b>${$$(p)}</b> each. <b>About</b> how much is that?`,tpl:'about {A}',text:`e5 ${k} ${p}`,fast:20,explain:`<p>${$$(p)} is about $${d}. ${k} × $${d} = <b>$${k*d}</b></p>`,nudge:`<p>Round the price to the nearest dollar, then multiply.</p>`},`$${k*d}`,[`$${k*(d+1)}`,`$${k*(d-1)}`,`$${k+d}`,`$${k*d*10}`]);},
 deli:c=>{const p1=10*R(25,60),w1=PK([15,25,5]);const p2=10*R(20,45),w2=PK([20,30,15,5]);const a=p1*w1/10,b=p2*w2/10;const pay=a+b<2000?2000:5000;
  return st(money({prompt:`Ms. Rosa buys <b>${wt(w1)}</b> pounds of cheese at <b>${$$(p1)}</b> per pound and <b>${wt(w2)}</b> pounds of ham at <b>${$$(p2)}</b> per pound. She pays with <b>$${pay/100}</b>. How much change does she get?`,text:`deli ${p1} ${w1} ${p2} ${w2}`,fast:60,
   explain:`<p>Cheese: ${$$(p1)} × ${D(w1,1)} = ${$$(a)}. Ham: ${$$(p2)} × ${D(w2,1)} = ${$$(b)}.</p><p>Total ${$$(a+b)}. $${pay/100}.00 − ${$$(a+b)} = <b>${M(pay-a-b)}</b></p>`,nudge:`<p>Step 1: cheese. Step 2: ham. Step 3: add, then subtract from $${pay/100}.</p>`},pay-a-b));},
tipSplit:c=>{const k=PK([3,4,5]);let bill,tip;do{bill=R(1500,4500);tip=c25(bill*.1,bill*.2);}while((bill+tip)%k!==0||((bill+tip)/k)%100===0||bill%5!==0);const t=bill+tip;
  return st(money({prompt:`At Ms. Rosa's café the bill for <b>${k}</b> friends is <b>${$$(bill)}</b>. They add a tip of <b>${$$(tip)}</b> and split it all equally. How much does each friend pay?`,text:`ts ${k} ${bill} ${tip}`,fast:55,explain:`<p>Total: ${$$(bill)} + ${$$(tip)} = ${$$(t)}.</p><p>${$$(t)} ÷ ${k} = <b>${M(t/k)}</b></p>`,nudge:`<p>Step 1: add the tip. Step 2: divide by ${k}.</p>`},t/k));},
 fuelTrip:c=>{const g=PK([15,25,35,45,55]);const p=10*R(28,45);const fuel=p*g/10;const snack=c25(250,600);const t=fuel+snack;const pay=t<2000?2000:5000;
  return st(money({prompt:`Ozzy fills the train's little engine with <b>${wt(g)}</b> gallons of fuel at <b>${$$(p)}</b> a gallon, then buys snacks for <b>${$$(snack)}</b>. He pays with <b>$${pay/100}</b>. How much change?`,text:`ft ${g} ${p} ${snack}`,fast:60,explain:`<p>Fuel: ${$$(p)} × ${wt(g)} = ${$$(fuel)}.</p><p>Plus snacks: ${$$(t)}. $${pay/100}.00 − ${$$(t)} = <b>${M(pay-t)}</b></p>`,nudge:`<p>Step 1: multiply the decimals. Step 2: add the snacks. Step 3: subtract.</p>`},pay-t));},
 coupon:c=>{const p=PK([175,225,249,275,325,349]);const k=R(3,6);const off=PK([100,150,200,250]);const t=k*p-off;const pay=t<2000?2000:5000;const it=PK(['notebooks','art kits','jars of crystal paint','sketchbooks']);
  return st(money({prompt:`${cap(it)} cost <b>${$$(p)}</b> each. Gizmo buys <b>${k}</b> and uses a coupon for <b>${$$(off)}</b> off. He pays with <b>$${pay/100}</b>. How much change does he get?`,text:`cp ${it} ${p} ${k} ${off}`,fast:60,explain:`<p>${k} × ${$$(p)} = ${$$(k*p)}. Minus the coupon: ${$$(k*p)} − ${$$(off)} = ${$$(t)}.</p><p>$${pay/100}.00 − ${$$(t)} = <b>${M(pay-t)}</b></p>`,nudge:`<p>Step 1: multiply. Step 2: take off the coupon. Step 3: find the change.</p>`},pay-t));}
};
PD('money',5,[
 [m5.addDec,m5.subDec,m5.change20,m5.cafe,m4.total3,m4.billsCoins,m4.priceDiff,m4.twoPeople,m4.timesPrice],
 [m5.mulDec,m5.mulStory,m5.addDec,m5.subDec,m5.change20,m5.cafe,m5.est5,m4.timesCents,m4.deal],
 [m5.divDec,m5.shareStory,m5.perItem,m5.perPound,m5.est5,m5.mulDec,m5.mulStory,m4.groupChange,m4.budget],
 [m5.betterBuy,m5.saving,m5.perPound,m5.shareStory,m5.divDec,m5.mulStory,m5.perItem,m5.est5,m4.snackRun],
 [m5.shopping,m5.split,m5.fountainSave,m5.saving,m5.deli,m5.tipSplit,m5.fuelTrip,m5.coupon,m5.betterBuy]]);
})();
/* plan-other.js: school-year plans for Time Temple (time), Measure Mesa (meas), Graph Garden (graph), Estimation Station (est),
   The Average Shoppe (avg), Volume Vault (vol) and Story Summit (word). */
(function(){'use strict';const {R,PK:PK0,SH,P2,N,PL,F,FA,gcd,T,D,$$,WHO,choice,old}=PLAN.H;
/* ---------- shared helpers ---------- */
/* PK deals each list like cards, so a round doesn't repeat a setting until the list is used up */
const PKB={};const PK=a=>{const k=a.length+'|'+String(JSON.stringify(a[0])).slice(0,60);let b=PKB[k];if(!b||!b.length)b=PKB[k]=SH(Array.from({length:a.length},(_,i)=>i));return a[b.shift()];};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const P={quartz:{n:'Dr. Quartz',s:'Dr. Quartz',he:'he',his:'his',him:'him'},rosa:{n:'Ms. Rosa',s:'Ms. Rosa',he:'she',his:'her',him:'her'},
 flex:{n:'Coach Flex',s:'Coach Flex',he:'he',his:'his',him:'him'},wiz:{n:'the Elder Wiz',s:'the Elder Wiz',he:'he',his:'his',him:'him'},
 troll:{n:'Grumbleroot the troll',s:'Grumbleroot',he:'he',his:'his',him:'him'},skyla:{n:'Skyla the eagle',s:'Skyla',he:'she',his:'her',him:'her'},
 gizmo:{n:'Gizmo',s:'Gizmo',he:'he',his:'his',him:'him'},nana:{n:'Nana Paws',s:'Nana Paws',he:'she',his:'her',him:'her'},
 goblin:{n:'the Grey Goblin',s:'the Grey Goblin',he:'he',his:'his',him:'him'},ozzy:{n:'Ozzy',s:'Ozzy',he:'he',his:'his',him:'him'},
 teacher:{n:'the Kind Teacher',s:'the Kind Teacher',he:'she',his:'her',him:'her'}};
const fixP=o=>{if(o.prompt)o.prompt=o.prompt.replace(/([ap])\.m\.(<\/b>)?\./g,'$1.m.$2');return o;};
const ok=(o)=>fixP(Object.assign({fast:12},o));
const st=(o)=>fixP(Object.assign({fast:25,wp:1},o));
/* decimal answer: dp only when it is not a whole number */
const DEC=(o,v,dp)=>{const s=Math.pow(10,dp);if(v%s===0){o.answer=v/s;delete o.dp;}else{o.answer=v;o.dp=dp;}return o;};
const dstr=(v,dp)=>{const s=Math.pow(10,dp);return v%s===0?String(v/s):D(v,dp).replace(/0+$/,'');};
const money=c=>$$(c);
const sum=a=>a.reduce((x,y)=>x+y,0);

/* =================================== ⏰ TIME TEMPLE =================================== */
/* times are minutes after midnight (t) */
const H12=h=>((h-1)%12+12)%12+1;
const hh=t=>H12(Math.floor((((t%1440)+1440)%1440)/60)),mm=t=>(((t%1440)+1440)%1440)%60;
const Tt=t=>T(hh(t),mm(t));
const lab=t=>{t=((t%1440)+1440)%1440;return t===720?'noon':t===0?'midnight':Tt(t)+(t<720?' a.m.':' p.m.');};
const AP=t=>(((t%1440)+1440)%1440)<720?'a.m.':'p.m.';
const CK=t=>({kind:'clock',answer:hh(t)*100+mm(t),alt:mm(t)===0?[hh(t)]:undefined});
const NUMW=['twelve','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const dw=d=>{const h=Math.floor(d/60),m=d%60;if(d===30)return 'half an hour';return (h?`${h} hour${h>1?'s':''}`:'')+(h&&m?' and ':'')+(m?`${m} minute${m>1?'s':''}`:'');};
const hm=d=>`${Math.floor(d/60)} h ${P2(d%60)} min`;
const TYPE=t=>`<p class="tip">Type ${Tt(t)} as ${hh(t)}${P2(mm(t))}.</p>`;
const at=(h,m)=>h*60+m;
/* a time of day between two hours, on a step grid */
const tAny=(h1,h2,step)=>at(R(h1,h2),step*R(0,Math.floor(59/step)));
function readClock(t,pr){const h=hh(t),m=mm(t),nx=H12(h+1);
 const hw=m===0?`It points right at the <b>${h}</b>.`:m===30?`It is halfway between the ${h} and the ${nx}, so the hour is still <b>${h}</b>.`:`It is between the ${h} and the ${nx}. It has not reached the ${nx} yet, so the hour is <b>${h}</b>.`;
 const k=Math.floor(m/5);const mw=m===0?`The long hand points straight up at the 12: <b>o'clock</b>.`:m%5===0?`The long hand points at the ${k}. Count by 5s: <b>${m}</b> minutes.`:`The long hand is ${m%5} little ${m%5>1?'marks':'mark'} past the ${k||12}. Count by 5s to ${k*5}, then by 1s: <b>${m}</b> minutes.`;
 return ok(Object.assign({vis:{t:'clock',h,m},prompt:pr||'What time does the clock show?',tpl:'{A}',text:`read ${Tt(t)}`,fast:10,
  explain:`<p>Short hand = hour. ${hw}</p><p>Long hand = minutes. ${mw}</p><p>It is <b>${Tt(t)}</b>.</p>${TYPE(t)}`,
  nudge:`<p>Short hand = hour, long hand = minutes.${m%5===0?'':' Count by 5s, then by 1s.'} Type 3:45 as 3 4 5.</p>`},CK(t)));}
function exLater(t,d){let s=`<p>Start at ${Tt(t)}.</p>`;const hrs=Math.floor(d/60),mn=d%60;let c=t;
 if(hrs){c=t+hrs*60;s+=`<p>Add ${hrs} hour${hrs>1?'s':''}: ${Tt(c)}.</p>`;}
 if(mn){if(mm(c)+mn<60)s+=`<p>Add ${mn} minutes: ${mm(c)} + ${mn} = ${mm(c)+mn}.</p>`;else{const to=60-mm(c);s+=`<p>${to} minutes gets you to ${Tt(c+to)}.${mn>to?` Then ${mn-to} more minute${mn-to===1?'':'s'}.`:''}</p>`;}}
 return s+`<p>It is <b>${Tt(t+d)}</b>.</p>`;}
function exEarlier(t,d){let s=`<p>Start at ${Tt(t)} and go back.</p>`;const hrs=Math.floor(d/60),mn=d%60;let c=t;
 if(hrs){c=t-hrs*60;s+=`<p>Go back ${hrs} hour${hrs>1?'s':''}: ${Tt(c)}.</p>`;}
 if(mn){if(mn<=mm(c))s+=`<p>Go back ${mn} minutes: ${mm(c)} − ${mn} = ${mm(c)-mn}.</p>`;else if(mm(c)===0)s+=`<p>Going back from ${Tt(c)} lands in the hour before: 60 − ${mn} = ${60-mn}.</p>`;else s+=`<p>Go back ${mm(c)} minutes to ${Tt(c-mm(c))}. Then ${mn-mm(c)} more minutes back.</p>`;}
 return s+`<p>It was <b>${Tt(t-d)}</b>.</p>`;}
function exEl(t1,t2,L){const f=L?lab:Tt;const d=t2-t1;if(Math.floor(t1/60)===Math.floor(t2/60))return `<p>Same hour: ${mm(t2)} − ${mm(t1)} = <b>${d}</b> minutes.</p>`;
 const nh=Math.ceil(t1/60)*60,a=nh-t1,hrs=Math.floor((t2-nh)/60),b=t2-nh-hrs*60;const parts=[],nums=[];
 if(a){parts.push(`${f(t1)} → ${f(nh)} is ${a} min`);nums.push(a);}
 if(hrs){parts.push(`${f(nh)} → ${f(nh+hrs*60)} is ${hrs} hour${hrs>1?'s':''} = ${hrs*60} min`);nums.push(hrs*60);}
 if(b){parts.push(`${f(nh+hrs*60)} → ${f(t2)} is ${b} min`);nums.push(b);}
 return `<p>${parts.join('.<br>')}.</p><p>${nums.length>1?nums.join(' + ')+' = ':''}<b>${d}</b> minutes${d>=60?` (${dw(d)})`:''}.</p>`;}
/* story starters: [who, start phrase, duration lead, question]  (unknown end) */
const ACTS=c=>[
 ['Coach Flex lies down for a nap','He sleeps for','What time does he wake up?'],
 ['Ms. Rosa puts bread in the oven','It bakes for','What time does the bread come out?'],
 ['Nana Paws takes the dogs for a walk','They walk for','What time do they get home?'],
 ['Gizmo starts building a robot','He works for','What time does he finish?'],
 ['Dr. Quartz starts digging for crystals','He digs for','What time does he stop?'],
 ['The Elder Wiz starts reading a spell book','He reads for','What time does he stop reading?'],
 ['Skyla the eagle takes off from her nest','She flies for','What time does she land?'],
 ['Grumbleroot the troll starts guarding his bridge','He guards it for','What time does he stop?'],
 ["Ozzy's train leaves the station",'The ride takes','What time does the train arrive?'],
 [`${c.name} starts a puzzle`,`${c.name} works on it for`,`What time does ${c.name} finish?`],
 ['The Kind Teacher starts art class','Class lasts','What time does class end?'],
 ['The Grey Goblin starts hunting for socks','He hunts for','What time does he stop?']];
/* (unknown start) */
const ENDS=[["The bread comes out of Ms. Rosa's oven",'It baked for','What time did it go in?'],
 ['Coach Flex wakes up from his nap','He slept for','What time did he fall asleep?'],
 ["Ozzy's train arrives at the station",'The ride took','What time did the train leave?'],
 ['Nana Paws gets home from walking the dogs','The walk took','What time did she leave?'],
 ['Gizmo finishes his robot','He worked for','What time did he start?'],
 ['Skyla lands on her nest','She flew for','What time did she take off?'],
 ["The Kind Teacher's art class ends",'It lasted','What time did it start?'],
 ['Dr. Quartz stops digging for crystals','He dug for','What time did he start?']];
/* elapsed: [who does it, from…to phrase] */
const SPANS=c=>[['Nana Paws walks dogs','How long does she walk?'],['Coach Flex runs laps','How long does he run?'],['Gizmo fixes his rocket','How long does he work?'],
 ['Ms. Rosa bakes pies','How long does she bake?'],['Dr. Quartz studies a crystal','How long does he study it?'],['The Elder Wiz practices spells','How long does he practice?'],
 [`${c.name} reads a book`,`How long does ${c.name} read?`],['Skyla flies over the mountains','How long does she fly?'],["Ozzy's train rolls from the Depot to the lake",'How long is the ride?'],
 ['Grumbleroot collects bridge coins','How long does he collect coins?'],['The Kind Teacher plays music for the class','How long does the music play?']];
const laterQ=(t,d,ask)=>ok(Object.assign({vis:{t:'clock',h:hh(t),m:mm(t)},prompt:ask||`What time will it be <b>${dw(d)} later</b>?`,tpl:'{A}',text:`${Tt(t)} + ${d}`,explain:exLater(t,d)+TYPE(t+d),
 nudge:`<p>Read the clock first, then count forward ${dw(d)}.</p>`},CK(t+d)));
const earlierQ=(t,d)=>ok(Object.assign({vis:{t:'clock',h:hh(t),m:mm(t)},prompt:`What time was it <b>${dw(d)} earlier</b>?`,tpl:'{A}',text:`${Tt(t)} − ${d}`,explain:exEarlier(t,d)+TYPE(t-d),
 nudge:`<p>Read the clock first, then count <b>back</b> ${dw(d)}.</p>`},CK(t-d)));
const actStory=(c,t,d)=>{const [a,b,q]=PK(ACTS(c));return st(Object.assign({prompt:`${a} at <b>${Tt(t)}</b>. ${b} <b>${dw(d)}</b>. ${q}`,tpl:'{A}',text:`${a} ${Tt(t)}+${d}`,explain:exLater(t,d)+TYPE(t+d),nudge:`<p>Start at ${Tt(t)} and count forward ${dw(d)}.</p>`},CK(t+d)));};
const endStory=(c,t,d)=>{const [a,b,q]=PK(ENDS);return st(Object.assign({prompt:`${a} at <b>${Tt(t)}</b>. ${b} <b>${dw(d)}</b>. ${q}`,tpl:'{A}',text:`${a} ${Tt(t)}-${d}`,explain:exEarlier(t,d)+TYPE(t-d),nudge:`<p>It ended at ${Tt(t)}. Count <b>back</b> ${dw(d)}.</p>`},CK(t-d)));};
const spanStory=(c,t1,t2,tpl)=>{const [a,q]=PK(SPANS(c));const d=t2-t1;return st({prompt:`${a} from <b>${Tt(t1)}</b> to <b>${Tt(t2)}</b>. ${q}`,tpl:tpl||'{A} minutes',answer:d,text:`${a} ${Tt(t1)}-${Tt(t2)}`,explain:exEl(t1,t2),nudge:`<p>Count up from ${Tt(t1)} to ${Tt(t2)}. Jump to the next o'clock first.</p>`});};
/* a.m. / p.m. activities: [text with {T}, lo, hi, step] */
const AMPM=[['You eat breakfast at {T}.',at(6,30),at(8,30)],['The school bus picks you up at {T}.',at(7,0),at(8,15)],['Recess starts at {T}.',at(9,45),at(11,0)],
 ['The sun comes up at {T}.',at(5,45),at(7,15)],['Nana Paws walks the dogs before breakfast, at {T}.',at(6,0),at(7,30)],["The Kind Teacher's class starts at {T}.",at(8,0),at(9,0)],
 ["Ms. Rosa opens the café for breakfast at {T}.",at(6,30),at(8,0)],['School ends at {T}.',at(14,30),at(15,30)],['You eat an after-school snack at {T}.',at(15,15),at(16,30)],
 ['Your family eats dinner at {T}.',at(17,30),at(19,0)],['You go to bed at {T}.',at(19,30),at(21,0)],['Skyla watches the sunset at {T}.',at(18,30),at(20,0)],
 ['The Elder Wiz looks at the stars at {T}.',at(20,30),at(22,0)],['You eat lunch at school at {T}.',at(12,15),at(12,50)],['Coach Flex does morning push-ups at {T}.',at(6,15),at(7,45)],
 ['You brush your teeth before bed at {T}.',at(19,45),at(20,45)]];
const ampmQ=c=>{const [s,lo,hi]=PK(AMPM);const t=lo+5*R(0,Math.floor((hi-lo)/5));const r=AP(t);
 return choice(ok({prompt:`${s.replace('{T}','<b>'+Tt(t)+'</b>')} Is that a.m. or p.m.?`,tpl:'{A}',text:`ampm ${s} ${t}`,explain:`<p>a.m. is from midnight to noon (night and morning). p.m. is from noon to midnight (afternoon and evening).</p><p>This happens in the ${t<720?'morning':t<1020?'afternoon':'evening'}, so it is <b>${r}</b>.</p>`,nudge:`<p>Morning = a.m. Afternoon and evening = p.m.</p>`}),r,[r==='a.m.'?'p.m.':'a.m.']);};

/* ---------- grade 1 ---------- */
const t1={
 oclock:()=>readClock(at(R(1,12),0)),
 handsO:()=>{const h=R(1,12);return ok(Object.assign({prompt:`The short hand points to the <b>${h}</b>. The long hand points to the <b>12</b>. What time is it?`,tpl:'{A}',text:`hands ${h}:00`,explain:`<p>Short hand on ${h} = ${h} o'clock. Long hand on 12 = :00.</p><p>It is <b>${h}:00</b>.</p>`,nudge:`<p>Long hand on the 12 means o'clock. Where is the short hand?</p>`},CK(at(h,0))));},
 wordsO:()=>{const h=R(1,12);return ok(Object.assign({prompt:`Type <b>${NUMW[h]} o'clock</b>.`,tpl:'{A}',text:`words ${h}:00`,explain:`<p>${cap(NUMW[h])} o'clock is <b>${h}:00</b>.</p>`,nudge:`<p>o'clock means :00 at the end.</p>`},CK(at(h,0))));},
 half:()=>readClock(at(R(1,12),30)),
 handsH:()=>{const h=R(1,12);return ok(Object.assign({prompt:`The long hand points to the <b>6</b>. The short hand is <b>halfway between the ${h} and the ${H12(h+1)}</b>. What time is it?`,tpl:'{A}',text:`hands ${h}:30`,explain:`<p>Long hand on 6 = 30 minutes (half past).</p><p>The short hand has passed the ${h} but not reached the ${H12(h+1)}, so it is <b>${h}:30</b>.</p>`,nudge:`<p>The hour is the number the short hand has already <b>passed</b>.</p>`},CK(at(h,30))));},
 wordsH:()=>{const h=R(1,12);return ok(Object.assign({prompt:`Type <b>half past ${NUMW[h]}</b>.`,tpl:'{A}',text:`words ${h}:30`,explain:`<p>Half past ${NUMW[h]} is 30 minutes after ${h}:00. It is <b>${h}:30</b>.</p>`,nudge:`<p>Half past means 30 minutes after the hour.</p>`},CK(at(h,30))));},
 mix:()=>readClock(at(R(1,12),PK([0,30]))),
 hourLater:()=>{const t=at(R(1,12),0);return laterQ(t,60);},
 halfLater:()=>{const t=at(R(1,12),0);return laterQ(t,30);},
 hourLaterH:()=>{const t=at(R(1,12),PK([0,30,30]));return Math.random()<.5?laterQ(t,PK([60,60,120])):earlierQ(t,60);},
 whichLater:()=>{const h=R(1,4);const opts=SH([at(h,0),at(h,30),at(h+1,0),at(h+1,30)]).slice(0,3);const late=Math.max(...opts);
  return choice(ok({prompt:'These times are all in the same afternoon. Which time comes <b>last</b>?',tpl:'{A}',text:`last ${opts.join(',')}`,explain:`<p>Bigger hour = later. If the hours match, :30 is later than :00.</p><p><b>${Tt(late)}</b> comes last.</p>`,nudge:`<p>Look at the hour first. Which hour is biggest?</p>`}),Tt(late),opts.filter(x=>x!==late).map(Tt));},
 storyLater:c=>actStory(c,at(R(1,10),PK([0,30])),PK([60,60,120,30])),
 storyStart:c=>endStory(c,at(R(3,11),PK([0,30])),PK([60,60,120])),
 storyHours:c=>{const [a,q]=PK(SPANS(c));const h=R(1,8),d=R(1,3);return st({prompt:`${a} from <b>${h}:00</b> to <b>${h+d}:00</b>. ${q}`,tpl:'{A} hours',answer:d,alt:[d*60],text:`${a} ${h}-${h+d}`,explain:`<p>Count the hours: ${Array.from({length:d},(_,i)=>`${h+i}:00 → ${h+i+1}:00`).join(', ')}.</p><p>That is <b>${d}</b> hour${d>1?'s':''}.</p>`,nudge:`<p>Count each hour from ${h}:00 to ${h+d}:00.</p>`});},
 whoFirst:c=>{const ppl=SH(['Gizmo','Nana Paws','Coach Flex','Ms. Rosa','Dr. Quartz','Ozzy']).slice(0,2);const h=R(1,4);const ts=SH([at(h,30),at(h+1,0)]);const first=ts[0]<ts[1]?0:1;
  return choice(st({prompt:`This afternoon, ${ppl[0]} goes to the library at <b>${Tt(ts[0])}</b>. ${ppl[1]} goes to the library at <b>${Tt(ts[1])}</b>. Who gets there <b>first</b>?`,tpl:'{A}',text:`first ${ppl} ${ts}`,explain:`<p>${Tt(Math.min(...ts))} comes before ${Tt(Math.max(...ts))}.</p><p><b>${ppl[first]}</b> gets there first.</p>`,nudge:`<p>Which time comes first on the clock?</p>`,fast:15}),ppl[first],[ppl[1-first]]);}
};
/* round 2: grade 1 reads and writes o'clock and half past only (no elapsed time) */
const QW1=t=>mm(t)===30?`half past ${NUMW[hh(t)]}`:`${NUMW[hh(t)]} o'clock`;
const CAEV=[['Coach Flex','goes for a jog'],['Ms. Rosa','opens the café'],['Nana Paws','walks the dogs'],['Gizmo','starts building'],["Ozzy's train",'leaves the Depot'],['Dr. Quartz','feeds his crystals'],['Skyla','flies to the lake'],['The Kind Teacher','rings the school bell']];
const t1x={
 match:()=>{const t=at(R(1,12),PK([0,30,30]));const h=hh(t);const r=QW1(t);const w=[QW1(at(h,30-mm(t))),QW1(t+60),QW1(t-60),`half past ${NUMW[H12(h-1)]}`].filter(x=>x!==r);
  return choice(ok(Object.assign({vis:{t:'clock',h,m:mm(t)},prompt:'Which words match this clock?',tpl:'{A}',text:`match ${Tt(t)}`,explain:`<p>The long hand is on the ${mm(t)?'6, so it is half past':'12, so it is o\'clock'}. The short hand ${mm(t)?`has passed the ${h}`:`is on the ${h}`}.</p><p>It is <b>${r}</b>.</p>`,nudge:`<p>Long hand on 12 = o'clock. Long hand on 6 = half past.</p>`})),r,SH(w));},
 pickTime:o=>()=>{const m=o==='o'?0:o==='h'?30:PK([0,30]);const t=at(R(1,12),m);const r=Tt(t);return choice(ok({prompt:`Which time is <b>${QW1(t)}</b>?`,tpl:'{A}',text:`pt ${Tt(t)}`,explain:`<p>${cap(QW1(t))} is <b>${r}</b>.</p>`,nudge:`<p>${m?'Half past means :30.':"O'clock means :00."}</p>`}),r,SH([Tt(t+60),Tt(t-60),Tt(at(hh(t),30-m)),Tt(at(hh(t)+1,30-m))]));},
 hand:o=>()=>{const m=o==='o'?0:PK([0,30]);const t=at(R(1,12),m);const sh=m===0&&Math.random()<.5;return ok({prompt:`At <b>${QW1(t)}</b>, which number does the <b>${sh?'short':'long'}</b> hand point to?`,tpl:'The {A}',answer:sh?hh(t):m?6:12,text:`hand ${Tt(t)} ${sh}`,explain:sh?`<p>The short hand shows the hour: it points to the <b>${hh(t)}</b>.</p>`:`<p>The long hand shows the minutes: ${m?'half past means it points down at the <b>6</b>':"o'clock means it points straight up at the <b>12</b>"}.</p>`,nudge:`<p>Short hand = hour. Long hand = minutes.</p>`,fast:8});},
 order:c=>{const ev=SH(CAEV).slice(0,3);const ts=SH([at(6,0),at(6,30),at(7,0),at(7,30),at(8,0),at(8,30),at(9,0),at(9,30),at(10,0),at(10,30),at(11,0)]).slice(0,3);const first=Math.random()<.5;const idx=ts.indexOf(first?Math.min(...ts):Math.max(...ts));
  return choice(st({prompt:`This morning:<br>${ev.map((e,i)=>`${e[0]} ${e[1]} at <b>${Tt(ts[i])}</b>.`).join('<br>')}<br>Who goes <b>${first?'first':'last'}</b>?`,tpl:'{A}',text:`ord ${ev.map(e=>e[0])} ${ts} ${first}`,explain:`<p>In order: ${ts.map((t,i)=>[t,i]).sort((a,b)=>a[0]-b[0]).map(([t,i])=>`${Tt(t)} ${ev[i][0]}`).join(', then ')}.</p><p><b>${ev[idx][0]}</b> goes ${first?'first':'last'}.</p>`,nudge:`<p>The ${first?'smallest':'biggest'} hour comes ${first?'first':'last'} in the morning.</p>`,fast:20}),ev[idx][0],ev.map(e=>e[0]).filter((_,i)=>i!==idx));},
 storyWhat:c=>{const half=Math.random()<.5;const h=R(1,11);const t=at(h,half?30:0);const [s,q]=PK([['Coach Flex wakes up from his nap','What time does he wake up?'],["Ms. Rosa's bread comes out of the oven",'What time does the bread come out?'],["Ozzy's train leaves the station",'What time does the train leave?'],['Skyla lands on her nest','What time does she land?'],['Gizmo starts his robot','What time does he start it?'],['Nana Paws walks the dogs','What time does she walk them?']]);
  return st(Object.assign({prompt:`${s} when the long hand points to the <b>${half?6:12}</b> and the short hand ${half?`is halfway between the <b>${h}</b> and the <b>${h+1}</b>`:`points to the <b>${h}</b>`}. ${q}`,tpl:'{A}',text:`sw ${s} ${Tt(t)}`,explain:`<p>Long hand on ${half?'6 = half past':"12 = o'clock"}. The hour is <b>${h}</b>.</p><p>It is <b>${Tt(t)}</b>.</p>`,nudge:`<p>Long hand on 12 = :00. Long hand on 6 = :30.</p>`,fast:20},CK(t)));},
 storyWords:c=>{const t=at(R(1,12),PK([0,30]));const [who,what]=PK([['The Kind Teacher','"Art class starts at {W}."'],['Ms. Rosa','"The cookies are ready at {W}."'],['Ozzy','"The next train leaves at {W}."'],['Coach Flex','"Practice starts at {W}!"'],['The Elder Wiz','"The magic show is at {W}."'],[c.name+"'s pet",'barks at {W} every day.']]);const said=what.replace('{W}',QW1(t));
  return st(Object.assign({prompt:`${who}${/^"/.test(what)?' says, ':' '}${said} Type the time.`,tpl:'{A}',text:`swd ${who} ${Tt(t)}`,explain:`<p>${cap(QW1(t))} is <b>${Tt(t)}</b>.</p>`,nudge:`<p>${mm(t)?'Half past means :30.':"O'clock means :00."}</p>`,fast:15},CK(t)));}
};
/* round 2: grade 2 Legend and a balanced a.m./p.m. */
const AMPM2=AMPM.concat([['Coach Flex runs soccer practice after school at {T}.',at(15,45),at(17,0)],['You go to piano lessons after school at {T}.',at(15,30),at(17,30)],['Your family watches a movie at {T} before bed.',at(18,30),at(19,30)],['Ms. Rosa closes the café for the night at {T}.',at(19,0),at(21,0)]]);
const ampmB=c=>{const pm=Math.random()<.5;const [s,lo,hi]=PK(AMPM2.filter(x=>(x[1]>=720)===pm));const t=lo+5*R(0,Math.floor((hi-lo)/5));const r=AP(t);
 return choice(ok({prompt:`${s.replace('{T}','<b>'+Tt(t)+'</b>')} Is that a.m. or p.m.?`,tpl:'{A}',text:`ampm ${s} ${t}`,explain:`<p>a.m. is from midnight to noon (night and morning). p.m. is from noon to midnight (afternoon and evening).</p><p>This happens in the ${t<720?'morning':t<1020?'afternoon':'evening'}, so it is <b>${r}</b>.</p>`,nudge:`<p>Morning = a.m. Afternoon and evening = p.m.</p>`}),r,[r==='a.m.'?'p.m.':'a.m.']);};
const t2x={
 sense:c=>{const L=[['eat dinner',at(6,0),'p.m.'],['eat breakfast',at(7,30),'a.m.'],['go to bed',at(8,30),'p.m.'],['catch the school bus',at(7,45),'a.m.'],['watch the sunset',at(7,15),'p.m.'],['go to soccer practice after school',at(4,15),'p.m.'],['eat lunch',at(12,15),'p.m.'],['wake up',at(6,45),'a.m.']];const [w,t,r]=PK(L);const o=r==='a.m.'?'p.m.':'a.m.';
  return choice(st({prompt:`Which time makes sense to <b>${w}</b>?`,tpl:'{A}',text:`sense ${w}`,explain:`<p>People ${w} in the ${r==='a.m.'?'morning':w==='eat lunch'?'middle of the day, just after noon':'afternoon or evening'}, so it is <b>${Tt(t)} ${r}</b>.</p>`,nudge:`<p>a.m. = morning. p.m. = afternoon and evening.</p>`}),`${Tt(t)} ${r}`,[`${Tt(t)} ${o}`]);},
 clockStory:c=>{const t=at(R(1,12),5*R(1,11));const [s,q]=PK([["Ozzy's train leaves when the clock looks like this.",'What time does it leave?'],['Ms. Rosa takes the muffins out at this time.','What time is it?'],['Coach Flex blows his whistle at this time.','What time does he blow it?'],['The Grey Goblin sneaks in at this time.','What time does he sneak in?']]);const o=readClock(t,`${s} ${q}`);o.wp=1;o.fast=15;return o;},
 wordsTo:()=>{const h=R(1,12),k=5*R(1,5);const t=at(h,0)-k;return ok(Object.assign({prompt:`Type the time <b>${k} minutes to ${NUMW[h]}</b>.`,tpl:'{A}',text:`to5 ${k} ${h}`,explain:`<p>${k} minutes to ${NUMW[h]} is ${k} minutes <b>before</b> ${h}:00.</p><p>60 − ${k} = ${60-k}, so it is <b>${Tt(t)}</b>.</p>`,nudge:`<p>"To" means before. Count back by 5s from ${h}:00.</p>`},CK(t)));},
 sayStory:c=>{const t=at(R(1,12),5*R(1,6));const [who,s]=PK([['The Kind Teacher','"The puppet show starts at {W}."'],['Gizmo','"My rocket launches at {W}!"'],['Nana Paws','"The dogs eat at {W}."'],['Dr. Quartz','"The crystal show starts at {W}."']]);
  return st(Object.assign({prompt:`${who} says, ${s.replace('{W}',`${mm(t)} minutes after ${NUMW[hh(t)]}`)} Type the time.`,tpl:'{A}',text:`say ${who} ${t}`,explain:`<p>${mm(t)} minutes after ${hh(t)}:00 is <b>${Tt(t)}</b>.</p>`,nudge:`<p>The hour comes first, then the minutes.</p>`,fast:15},CK(t)));}
};
/* round 2: CAASPP-style "can they finish in time?" (grades 3–5) */
const caFinish=(lo,hi,L)=>c=>{const f=L?lab:Tt;const y=Math.random()<.5;let t,d1,d2,dl;do{t=L?at(R(9,11),5*R(0,11)):at(R(1,9),R(0,11)*5+PK([0,0,2,3]));d1=R(lo,hi);d2=5*R(2,6);{const e0=t+d1+d2;dl=y?Math.ceil((e0+1)/15)*15+15*R(0,1):Math.floor((e0-1)/15)*15-15*R(0,1);}}while(dl===t+d1+d2||dl<=t+d1||dl%720===0);
 const end=t+d1+d2,r=end<=dl?'Yes':'No';const [who,a,b,he]=PK([['Gizmo','fixing his rocket','cleaning up','he'],['Ms. Rosa','baking a cake','frosting it','she'],['Coach Flex','running laps','stretching','he'],['Nana Paws','walking the dogs','brushing them','she'],['Dr. Quartz','growing a crystal','polishing it','he']]);
 return choice(st({prompt:`${who} starts ${a} at <b>${f(t)}</b>. That takes <b>${dw(d1)}</b>. Then ${b} takes <b>${d2} minutes</b>. Can ${he} finish by <b>${f(dl)}</b>?`,tpl:'{A}',text:`fin ${t} ${d1} ${d2} ${dl}`,explain:`<p>${dw(d1)} + ${d2} minutes = ${dw(d1+d2)}.</p><p>${f(t)} + ${dw(d1+d2)} = ${f(end)}. That is ${end<=dl?'not later than':'later than'} ${f(dl)}, so <b>${r}</b>.</p>`,nudge:`<p>Find the finish time first, then compare it with ${f(dl)}.</p>`,fast:35}),r,[r==='Yes'?'No':'Yes']);};
/* round 2: more grade 4 Legend stories */
const t4x={
 dogs:c=>{const t=at(R(1,4),5*R(0,11)),n=R(3,4),w=5*R(4,7),b=5*R(1,2);const tot=n*w+(n-1)*b;return st(Object.assign({prompt:`Nana Paws walks <b>${n}</b> dogs, one at a time, starting at <b>${Tt(t)}</b>. Each walk takes <b>${w} minutes</b>, with a <b>${b}-minute</b> rest between walks. What time does the last walk end?`,tpl:'{A}',text:`dogs ${t}${n}${w}${b}`,explain:`<p>Walks: ${n} × ${w} = ${n*w} min. Rests: only ${n-1} between walks, ${n-1} × ${b} = ${(n-1)*b} min.</p><p>${n*w} + ${(n-1)*b} = ${tot} min.</p>`+exLater(t,tot)+TYPE(t+tot),nudge:`<p>With ${n} walks there are only ${n-1} rests.</p>`,fast:45},CK(t+tot)));},
 oven:c=>{const out=at(R(3,6),5*R(0,11)),d=60*R(1,3)+5*R(1,11);return st(Object.assign({prompt:`Dr. Quartz's crystal must bake in a hot oven for <b>${dw(d)}</b>. He wants to take it out at <b>${Tt(out)}</b>. What time must he put it in?`,tpl:'{A}',text:`oven ${out} ${d}`,explain:exEarlier(out,d)+TYPE(out-d),nudge:`<p>Count back the hours first, then the minutes.</p>`,fast:35},CK(out-d)));},
 trip:c=>{const t=at(R(6,8),5*R(0,11)),a=60*R(1,2)+5*R(1,11),r=5*R(3,9),b=60+5*R(1,11);const tot=a+r+b;return st(Object.assign({prompt:`Skyla leaves her nest at <b>${Tt(t)}</b>. She flies <b>${dw(a)}</b>, rests <b>${r} minutes</b>, then flies <b>${dw(b)}</b> more. What time does she arrive?`,tpl:'{A}',text:`trip ${t}${a}${r}${b}`,explain:`<p>${a} + ${r} + ${b} = ${tot} minutes = ${dw(tot)}.</p>`+exLater(t,tot)+TYPE(t+tot),nudge:`<p>Add all three parts, then count forward.</p>`,fast:45},CK(t+tot)));},
 laps:c=>{const ls=Array.from({length:4},()=>R(62,88));const s=sum(ls);return st({prompt:`Coach Flex runs 4 laps. They take <b>${ls.join(', ')}</b> seconds. How long is that in minutes and seconds?`,tpl:`${Math.floor(s/60)} min {A} s`,answer:s%60,text:`laps ${ls}`,explain:`<p>${ls.join(' + ')} = ${s} seconds.</p><p>${Math.floor(s/60)} minutes = ${Math.floor(s/60)*60} seconds. ${s} − ${Math.floor(s/60)*60} = <b>${s%60}</b></p>`,nudge:`<p>Add the seconds, then take out full minutes (60 s each).</p>`,fast:45});},
 read:c=>{const m=5*R(3,9),w=R(1,2);const tot=m*7*w;const h=Math.floor(tot/60);if(tot%60===0)return t4x.read(c);return st({prompt:`The Elder Wiz reads his spell book for <b>${m} minutes</b> every day for <b>${w===1?'1 week':'2 weeks'}</b>. How long is that in all?`,tpl:`${h} h {A} min`,answer:tot%60,text:`read ${m}${w}`,explain:`<p>${w===1?'1 week = 7 days':'2 weeks = 14 days'}. ${m} × ${7*w} = ${tot} minutes.</p><p>${h} hours = ${h*60} minutes. ${tot} − ${h*60} = <b>${tot%60}</b></p>`,nudge:`<p>Find the number of days, multiply, then change to hours and minutes.</p>`,fast:45});}
};
/* round 2: grade 5 a.m./p.m. without giving the end time away */
const apSet=()=>{const night=Math.random()<.4;let t,d;do{if(night){t=at(R(21,23),5*R(0,11));d=60*R(1,4)+5*R(0,11);}else{t=at(R(9,11),5*R(1,11));d=60*R(1,3)+5*R(1,11);}}while((t+d)%720===0||mm(t)+d%60<60);
 return {night,t,d,e:t+d,S:night?`The Elder Wiz starts watching the stars at <b>${lab(t)}</b>. He watches for <b>${dw(d)}</b>.`:`Ozzy's train leaves at <b>${lab(t)}</b>. The ride takes <b>${dw(d)}</b>.`};};
const t5x={
 apEnd:c=>{const s=apSet();return st(Object.assign({prompt:`${s.S} What time does it end?`,tpl:'{A}',text:`ape ${s.t} ${s.d}`,explain:exLater(s.t,s.d)+`<p>That is ${lab(s.e)}.</p>`+TYPE(s.e),nudge:`<p>Add the hours first, then the minutes.</p>`},CK(s.e)));},
 apPick:c=>{const s=apSet();const r=AP(s.e);return choice(st({prompt:`${s.S} Will it end in the a.m. or the p.m.?`,tpl:'{A}',text:`app ${s.t} ${s.d}`,explain:`<p>${lab(s.t)} + ${dw(s.d)} = ${lab(s.e)}.</p><p>${s.night?(s.e>=1440?'It goes past midnight, so it is a.m. again.':'It does not reach midnight, so it is still p.m.'):(s.e>=720?'It goes past noon, so it is p.m.':'It does not reach noon, so it is still a.m.')} The answer is <b>${r}</b>.</p>`,nudge:`<p>${s.night?'Does it go past midnight?':'Does it go past noon?'}</p>`}),r,[r==='a.m.'?'p.m.':'a.m.']);}
};

/* ===== round 3 (Oct 2026 feedback): more steps up each round, 8+ Legend templates, "what mistake?" picks ===== */
const SAY=[['Gizmo','he'],['Coach Flex','he'],['Ozzy','he'],['Skyla','she'],['Ms. Rosa','she'],['Nana Paws','she']];
/* pick with reasons: right is one of the reason labels */
const why=(o,right,all)=>choice(o,right,all.filter(x=>x!==right));
const r3={
 /* ---- time G1 ---- */
 t1sched:c=>{const acts=SH([['art','🎨'],['music','🎵'],['lunch','🥪'],['reading','📚'],['recess','⚽'],['science','🔬']]).slice(0,3);const ts=SH([at(9,0),at(9,30),at(10,0),at(10,30),at(11,0),at(11,30),at(12,30),at(1,0),at(1,30),at(2,0)]).slice(0,3);const i=R(0,2);
  return choice(st({vis:{t:'clock',h:hh(ts[i]),m:mm(ts[i])},prompt:`The Kind Teacher's class list:<br>${acts.map((a,j)=>`${a[1]} ${cap(a[0])} at <b>${QW1(ts[j])}</b>`).join('<br>')}<br>What does the class do at the time on this clock?`,tpl:'{A}',text:`sch ${acts.map(a=>a[0])} ${ts} ${i}`,explain:`<p>The clock shows ${Tt(ts[i])}, which is ${QW1(ts[i])}.</p><p>That is <b>${acts[i][0]}</b>.</p>`,nudge:`<p>Read the clock first, then find that time in the list.</p>`,fast:25}),acts[i][0],acts.filter((_,j)=>j!==i).map(a=>a[0]));},
 t1fl:c=>{const pool=SH([at(1,0),at(1,30),at(2,0),at(2,30),at(3,0),at(3,30),at(4,0),at(4,30),at(5,0),at(5,30)]);const ts=pool.slice(0,3);const first=Math.random()<.5;const r=first?Math.min(...ts):Math.max(...ts);
  return choice(ok({prompt:`These times are all in the same afternoon. Which time comes <b>${first?'first':'last'}</b>?`,tpl:'{A}',text:`fl ${ts} ${first}`,explain:`<p>In order: ${ts.slice().sort((a,b)=>a-b).map(Tt).join(', ')}.</p><p><b>${Tt(r)}</b> comes ${first?'first':'last'}.</p>`,nudge:`<p>Look at the hour first. If the hours match, :00 comes before :30.</p>`}),Tt(r),ts.filter(x=>x!==r).map(Tt));},
 t1mid:c=>{const pool=SH([at(7,0),at(7,30),at(8,0),at(8,30),at(9,0),at(9,30),at(10,0),at(10,30),at(11,0)]);const ts=pool.slice(0,3);const s=ts.slice().sort((a,b)=>a-b);const ev=SH(CAEV).slice(0,3);const mid=ts.indexOf(s[1]);
  return choice(st({prompt:`This morning:<br>${ev.map((e,i)=>`${e[0]} ${e[1]} at <b>${QW1(ts[i])}</b>.`).join('<br>')}<br>Who is in the <b>middle</b>, not first and not last?`,tpl:'{A}',text:`mid ${ev.map(e=>e[0])} ${ts}`,explain:`<p>In order: ${s.map(t=>`${Tt(t)} ${ev[ts.indexOf(t)][0]}`).join(', then ')}.</p><p><b>${ev[mid][0]}</b> is in the middle.</p>`,nudge:`<p>Change each to a clock time, then put them in order.</p>`,fast:25}),ev[mid][0],ev.filter((_,i)=>i!==mid).map(e=>e[0]));},
 t1between:()=>{const h=R(1,11);const t=at(h,30);return ok(Object.assign({prompt:`The short hand is <b>between the ${h} and the ${h+1}</b>. The long hand is on the <b>6</b>. What time is it?`,tpl:'{A}',text:`btw ${h}`,explain:`<p>Long hand on 6 = half past. The short hand has passed the ${h} but not reached the ${h+1}, so the hour is ${h}.</p><p>It is <b>${Tt(t)}</b>.</p>`,nudge:`<p>The hour is the number the short hand has already passed.</p>`},CK(t)));},
 /* ---- time G2 ---- */
 t2ap:c=>{const pm=Math.random()<.5;const [s,lo,hi]=PK(AMPM2.filter(x=>(x[1]>=720)===pm));let t;do{t=lo+5*R(0,Math.floor((hi-lo)/5));}while(mm(t)%15===0&&Math.random()<.6);
  const o=readClock(t,`${s.replace(/,? at \{T\}/,'').replace(/\.$/,'')} at this time. What time is it?`);o.tpl=`{A} ${AP(t)}`;o.wp=1;o.fast=15;o.text='ap '+o.text+s;o.explain+=`<p>It happens in the ${t<720?'morning':t<1020?'afternoon':'evening'}, so it is ${AP(t)}.</p>`;return o;},
 /* ---- time G3 ---- */
 t3two:c=>{const a=at(R(1,3),5*R(1,9)),d1=R(15,40),b=a+d1+R(40,90),d2=R(15,40);const [who,what,he]=PK([['Ms. Rosa','bakes','she'],['Gizmo','tests his robot','he'],['Coach Flex','runs laps','he'],['Nana Paws','walks dogs','she']]);
  return st({prompt:`${who} ${what} from <b>${Tt(a)}</b> to <b>${Tt(a+d1)}</b>, and again from <b>${Tt(b)}</b> to <b>${Tt(b+d2)}</b>. How many minutes is that in all?`,tpl:'{A} minutes',answer:d1+d2,text:`tw ${a}${d1}${b}${d2}`,explain:`<p>First time: ${d1} minutes. Second time: ${d2} minutes.</p><p>${d1} + ${d2} = <b>${d1+d2}</b></p>`,nudge:`<p>Find each time separately, then add.</p>`,fast:35});},
 t3mist:c=>{const h=R(1,9),m1=R(35,55),d=R(65-m1,59);const t1=at(h,m1),t2=t1+d;const k=KK(3);const naive=(hh(t2)*100+mm(t2))-(hh(t1)*100+mm(t1));const said=k===0?d:k===1?naive:60-m1;if(said===d&&k)return r3.t3mist(c);const [who,he]=PK(SAY);
  const A=[`${cap(he)} is right!`,'There are only 60 minutes in an hour, not 100',`${cap(he)} only counted up to ${Tt(t2-mm(t2))}`];const r=A[k];
  return why(st({prompt:`${who} says it is <b>${said} minutes</b> from <b>${Tt(t1)}</b> to <b>${Tt(t2)}</b>. Is ${he} right? Choose the reason.`,tpl:'{A}',text:`t3m ${t1}${d}${k}`,explain:exEl(t1,t2)+`<p>So the answer is: <b>${r}</b>.</p>`,nudge:`<p>Work out the minutes yourself first.</p>`,fast:35}),r,A);},
 /* ---- meas G3 ---- */
 lshape:()=>{let a,b,c2,d,x,y;do{a=R(3,6);b=R(2,3);c2=R(2,a-1);d=R(1,3);x=R(3,6);y=R(2,5);}while(Math.abs(a*b+c2*d-x*y)<1||Math.abs(a*b+c2*d-x*y)>4);const L=a*b+c2*d;const r=L>x*y?'The L-shape':'The rectangle';
  return choice(ok({prompt:`Shape 1 is an L-shape: a rectangle <b>${a} squares across and ${b} rows tall</b>, with a block <b>${c2} squares across and ${d} row${d>1?'s':''} tall</b> on top of its left end. Shape 2 is a rectangle <b>${x} squares across and ${y} rows tall</b>. Which has the bigger area?`,tpl:'{A}',text:`ls ${a}${b}${c2}${d}${x}${y}`,explain:`<p>L-shape: ${a} × ${b} = ${a*b}, plus ${c2} × ${d} = ${c2*d}, so ${L} squares.</p><p>Rectangle: ${x} × ${y} = ${x*y}.</p><p><b>${r}</b> is bigger.</p>`,nudge:`<p>Split the L into two rectangles and add their areas.</p>`,fast:30}),r,[r==='The L-shape'?'The rectangle':'The L-shape']);},
 lArea:()=>{const a=R(4,8),b=R(2,4),c2=R(2,a-2),d=R(2,4);return ok({prompt:`An L-shaped garden is made of a rectangle <b>${a} m by ${b} m</b> with a <b>${c2} m by ${d} m</b> part on one end. What is its area?`,tpl:'{A} square meters',answer:a*b+c2*d,text:`la ${a}${b}${c2}${d}`,explain:`<p>${a} × ${b} = ${a*b}. ${c2} × ${d} = ${c2*d}.</p><p>${a*b} + ${c2*d} = <b>${a*b+c2*d}</b></p>`,nudge:`<p>Find the two parts, then add.</p>`});},
 mPerim:c=>{let l,w;do{l=R(4,9);w=R(2,8);}while(l===w||l*w===2*(l+w));const P=2*(l+w);const k=KK(4);const said=[P,l*w,l+w,2*l+w][k];const [who,he]=PK(SAY);
  const A=[`${cap(he)} is right!`,`${cap(he)} found the area, not the perimeter`,`${cap(he)} only added 2 sides`,`${cap(he)} left out one side`];
  return why(st({prompt:`${who} says a garden <b>${l} ft</b> by <b>${w} ft</b> has a perimeter of <b>${said} ft</b>. Is ${he} right? Choose the reason.`,tpl:'{A}',text:`mp ${l}${w}${k}`,explain:`<p>Perimeter: ${l} + ${w} + ${l} + ${w} = ${P} ft.</p><p><b>${A[k]}</b></p>`,nudge:`<p>Find the perimeter yourself, then see how ${he} got ${said}.</p>`,fast:30}),A[k],A);},
 /* ---- meas G4 ---- */
 tAngle:()=>{const ty=a=>a<90?'acute':a===90?'right':a<180?'obtuse':'straight';const as=SH([5*R(3,16),90,5*R(20,34),180]);const ti=R(0,3);const st2=as.map((a,i)=>{const t=ty(a);if(i===ti)return `A ${a}° angle is ${t}.`;const w=PK(['acute','right','obtuse','straight'].filter(x=>x!==t));return `A ${a}° angle is ${w}.`;});
  return choice(ok({prompt:'Which statement is <b>true</b>?',tpl:'{A}',text:`ta ${as} ${ti}`,explain:`<p>Acute: less than 90°. Right: 90°. Obtuse: between 90° and 180°. Straight: 180°.</p><p><b>${st2[ti]}</b></p>`,nudge:`<p>Compare each angle with 90° and 180°.</p>`,fast:25}),st2[ti],st2.filter((_,i)=>i!==ti));},
 mConv:c=>{const L=[['kg','g',1000,[100,10]],['m','cm',100,[10,1000]],['L','mL',1000,[100,10]],['ft','in',12,[10,100]],['yd','ft',3,[12,10]],['lb','oz',16,[10,12]],['km','m',1000,[100,10]]];const [b,s,f,wf]=PK(L);const n=R(2,6);const k=KK(3);const used=k===0?f:wf[k-1];const said=n*used;const [who,he]=PK(SAY);
  const A=[`${cap(he)} is right!`,`${cap(he)} used ${N(wf[0])} ${s} in 1 ${b}`,`${cap(he)} used ${N(wf[1])} ${s} in 1 ${b}`];
  return why(st({prompt:`${who} says <b>${n} ${b} = ${N(said)} ${s}</b>. Is ${he} right? Choose the reason.`,tpl:'{A}',text:`mc ${n}${b}${k}`,explain:`<p>1 ${b} = ${N(f)} ${s}, so ${n} ${b} = ${N(n*f)} ${s}.</p><p><b>${A[k]}</b></p>`,nudge:`<p>How many ${s} are really in 1 ${b}?</p>`,fast:25}),A[k],A);},
 lpNot:(mk,re)=>c=>{let q;for(let i=0;i<60;i++){q=mk(c);if(!re.test(q.prompt))break;}return q;},
 /* ---- meas G5 ---- */
 mConv5:c=>{const L=[['kg','g',1000],['m','cm',100],['L','mL',1000],['km','m',1000]];const [b,s,f]=PK(L);let v;do{v=R(11,49);}while(v%10===0);const right=v*f/10;const k=KK(3);const said=[right,right/10,right*10][k];const [who,he]=PK(SAY);
  const A=[`${cap(he)} is right!`,`${cap(he)} moved the point one place too few`,`${cap(he)} moved the point one place too many`];
  return why(st({prompt:`${who} says <b>${D(v,1)} ${b} = ${N(said)} ${s}</b>. Is ${he} right? Choose the reason.`,tpl:'{A}',text:`m5 ${v}${b}${k}`,explain:`<p>1 ${b} = ${N(f)} ${s}. ${D(v,1)} × ${N(f)} = ${N(right)}.</p><p><b>${A[k]}</b></p>`,nudge:`<p>× ${N(f)} moves the point ${String(f).length-1} places right.</p>`,fast:25}),A[k],A);},
 flour5:c=>{const n=R(2,4),kg=PK([15,25,20]),used=50*R(10,Math.floor(n*kg*100/50)-4);const left=n*kg*100-used;const o=st({prompt:`Ms. Rosa buys <b>${n}</b> bags of flour. Each bag holds <b>${D(kg,1)} kg</b>. She uses <b>${N(used)} g</b>. How many <b>kilograms</b> are left?`,tpl:'{A} kg',text:`f5 ${n}${kg}${used}`,explain:`<p>${n} × ${D(kg,1)} = ${dstr(n*kg,1)} kg = ${N(n*kg*100)} g.</p><p>${N(n*kg*100)} − ${N(used)} = ${N(left)} g = <b>${dstr(left/10,2)}</b> kg</p>`,nudge:`<p>Work in grams, then change back to kilograms.</p>`,fast:45});return DEC(o,left/10,2);},
 fence5:c=>{let a,b;do{a=R(41,99);b=R(21,60);}while(a%5||a%10===0||b%5===0);const per=PK([2,3,4]);const P=2*(a+b);const o=st({prompt:`Grumbleroot's goat pen is <b>${D(a,1)} m</b> by <b>${D(b,1)} m</b>. How many meters of fence go all the way around it?`,tpl:'{A} m',text:`fn ${a}${b}`,explain:`<p>${D(a,1)} + ${D(b,1)} = ${D(a+b,1)}. Doubled: <b>${dstr(P,1)}</b> m.</p>`,nudge:`<p>Add one length and one width, then double.</p>`,fast:35});return DEC(o,P,1);},
 /* ---- est G3 ---- */
 e3left:c=>{let a,b,s;do{a=notM(510,980,100);b=notM(110,390,100);s=notM(110,390,100);}while(rnd(a,100)-rnd(b,100)-rnd(s,100)<100);const [ra,rb,rs]=[rnd(a,100),rnd(b,100),rnd(s,100)];
  return st({prompt:`Ms. Rosa baked <b>${a}</b> cookies for the fair. She sold <b>${b}</b> on Saturday and <b>${s}</b> on Sunday. <b>About</b> how many are left? Round each to the nearest hundred.`,tpl:'About {A}',answer:ra-rb-rs,text:`el ${a}${b}${s}`,explain:`<p>${a} → ${ra}, ${b} → ${rb}, ${s} → ${rs}.</p><p>${ra} − ${rb} − ${rs} = <b>${ra-rb-rs}</b></p>`,nudge:`<p>Round all three, then subtract twice.</p>`,fast:35});},
 e3three:c=>{let v;do{v=[notM(110,390,100),notM(110,390,100),notM(110,390,100)];}while(sum(v.map(x=>rnd(x,100)))>1000);const r=v.map(x=>rnd(x,100));
  return st({prompt:`Grumbleroot collected <b>${v[0]}</b>, <b>${v[1]}</b> and <b>${v[2]}</b> toll coins on three days. <b>About</b> how many coins in all? Round to the nearest hundred.`,tpl:'About {A} coins',answer:sum(r),text:`e3t ${v}`,explain:`<p>${v.map((x,i)=>`${x} → ${r[i]}`).join(', ')}.</p><p>${r.join(' + ')} = <b>${sum(r)}</b></p>`,nudge:`<p>Round each number, then add.</p>`,fast:30});},
 e3add:c=>{const [s,u]=PK([["Ms. Rosa's café had",'visitors'],['The Elder Wiz read','pages'],['Coach Flex jumped rope','times']]);const a=notM(210,490,100),b=notM(150,490,100);const ra=rnd(a,100),rb=rnd(b,100);
  return st({prompt:`${s} <b>${a}</b> ${u} on Monday and <b>${b}</b> ${u} on Tuesday. <b>About</b> how many ${u} in all? Round to the nearest hundred.`,tpl:'About {A}',answer:ra+rb,text:`e3a ${s}${a}${b}`,explain:`<p>${a} → ${ra}. ${b} → ${rb}.</p><p>${ra} + ${rb} = <b>${ra+rb}</b></p>`,nudge:`<p>Round both, then add.</p>`});},
 e3diff:c=>{let a,b;do{a=notM(410,980,100);b=notM(110,580,100);}while(rnd(a,100)-rnd(b,100)<100);const ra=rnd(a,100),rb=rnd(b,100);
  return st({prompt:`Skyla flew <b>${a}</b> miles this month and <b>${b}</b> miles last month. <b>About</b> how many more miles this month? Round to the nearest hundred.`,tpl:'About {A} more',answer:ra-rb,text:`e3d ${a}${b}`,explain:`<p>${a} → ${ra}. ${b} → ${rb}.</p><p>${ra} − ${rb} = <b>${ra-rb}</b></p>`,nudge:`<p>Round both, then subtract.</p>`});},
 e3chk:c=>{let a,b;do{a=notM(120,580,100);b=notM(120,380,100);}while(a+b>1000);const ex=a+b,est=rnd(a,100)+rnd(b,100);const k=KK(3);let sh=ex;if(k===1)sh=ex+100*R(3,4);if(k===2)sh=ex-100*R(2,3);if(sh<100||(k&&Math.abs(sh-est)<250))return r3.e3chk(c);const [who,he]=PK(SAY);
  const A=['It makes sense',`It is too big: the estimate is about ${est}`,`It is too small: the estimate is about ${est}`];
  return why(st({prompt:`${who} says <b>${a} + ${b} = ${sh}</b>. Round to the nearest hundred to check. What do you think?`,tpl:'{A}',text:`e3c ${a}${b}${sh}`,explain:`<p>${a} → ${rnd(a,100)}, ${b} → ${rnd(b,100)}. Estimate: ${est}.</p><p><b>${A[k]}</b>${k?` (Exact: ${ex}.)`:''}</p>`,nudge:`<p>Estimate first, then compare with ${sh}.</p>`,fast:30}),A[k],A);},
 e3close:c=>{const a=notM(120,480,10),b=notM(120,480,10);const ex=a+b;const r10=rnd(a,10)+rnd(b,10),r100=rnd(a,100)+rnd(b,100);if(r10===r100)return r3.e3close(c);const r=String(r10);
  return choice(ok({prompt:`Which estimate of <b>${a} + ${b}</b> is <b>closest</b> to the exact answer?`,tpl:'{A}',text:`e3cl ${a}${b}`,explain:`<p>Rounding to tens: ${rnd(a,10)} + ${rnd(b,10)} = ${r10}. Rounding to hundreds: ${rnd(a,100)} + ${rnd(b,100)} = ${r100}.</p><p>The exact answer is ${ex}, so <b>${r10}</b> is closest. Rounding to tens is closer!</p>`,nudge:`<p>Rounding to tens keeps more of the number.</p>`,fast:25}),r,[String(r100),String(r10-100)].filter(x=>x!==r));},
 /* ---- est G4 ---- */
 e4mist:c=>{const a=notM(23,89,10),b=R(3,9);const ex=a*b,est=rnd(a,10)*b;const k=KK(3);const sh=[ex,ex*10,Math.round(ex/10)][k];const [who,he]=PK(SAY);
  const A=['It makes sense','It is too big: a zero too many','It is too small: a zero is missing'];
  return why(st({prompt:`${who} says <b>${a} × ${b} = ${N(sh)}</b>. Estimate to check. What do you think?`,tpl:'{A}',text:`e4m ${a}${b}${k}`,explain:`<p>${a} ≈ ${rnd(a,10)}. ${rnd(a,10)} × ${b} = ${est}.</p><p><b>${A[k]}</b>${k?` (Exact: ${ex}.)`:''}</p>`,nudge:`<p>Round ${a} to the nearest ten and multiply.</p>`,fast:25}),A[k],A);},
 e4pages:c=>{const p=notM(120,480,100),w=R(3,6);const rp=rnd(p,100);return st({prompt:`The Elder Wiz reads <b>${p}</b> pages every week for <b>${w}</b> weeks. <b>About</b> how many pages is that? Round to the nearest hundred.`,tpl:'About {A} pages',answer:rp*w,text:`e4p ${p}${w}`,explain:`<p>${p} → ${rp}.</p><p>${rp} × ${w} = <b>${N(rp*w)}</b></p>`,nudge:`<p>Round, then multiply.</p>`});},
 e4riders:c=>{const v=[notM(1200,4800,100),notM(1200,4800,100),notM(1200,4800,100)];const r=v.map(x=>rnd(x,1000));return st({prompt:`Ozzy's train carried <b>${v.map(N).join('</b>, <b>')}</b> riders on three days. <b>About</b> how many riders in all? Round to the nearest thousand.`,tpl:'About {A} riders',answer:sum(r),text:`e4r ${v}`,explain:`<p>${v.map((x,i)=>`${N(x)} → ${N(r[i])}`).join(', ')}.</p><p>${r.map(N).join(' + ')} = <b>${N(sum(r))}</b></p>`,nudge:`<p>Round each to the nearest thousand, then add.</p>`,fast:30});},
 e4more:c=>{const a=notM(12,89,10),b=R(3,9);const est=rnd(a,10)*b,ex=a*b;const g=Math.round(est/100)*100+PK([-100,100]);if(Math.abs(ex-g)<20||g<=0)return r3.e4more(c);const r=ex>g?`More than ${g}`:`Less than ${g}`;
  return choice(ok({prompt:`Without finding the exact answer: is <b>${a} × ${b}</b> more or less than <b>${g}</b>?`,tpl:'{A}',text:`e4mo ${a}${b}${g}`,explain:`<p>${a} ≈ ${rnd(a,10)}, and ${rnd(a,10)} × ${b} = ${est}.</p><p>So it is <b>${r.toLowerCase()}</b>. (Exact: ${ex}.)</p>`,nudge:`<p>Round ${a} and multiply in your head.</p>`}),r,[r.startsWith('More')?`Less than ${g}`:`More than ${g}`]);},
 /* ---- est G5 ---- */
 enough:c=>{const yes=Math.random()<.5;let items,tot,have,est;do{items=SH([['a toy train',600,1400],['a puzzle',500,1200],['a kite',700,1300],['a book',400,900],['a yo-yo',200,500]]).slice(0,3).map(([n,lo,hi])=>[n,R(lo,hi)]);tot=sum(items.map(x=>x[1]));est=100*sum(items.map(x=>Math.round(x[1]/100)));have=100*(Math.round(tot/100)+(yes?R(2,3):-R(2,3)));}while((have>=tot)!==(have>=est)||Math.abs(have-tot)<150||Math.abs(have-est)<100);const r=have>=tot?'Yes':'No';
  return choice(st({prompt:`${c.name} has <b>$${have/100}</b>. ${c.name} wants ${items.map(x=>`${x[0]} (${$$(x[1])})`).join(', ')}. Is that enough money for all three?`,tpl:'{A}',text:`en ${JSON.stringify(items)} ${have}`,explain:`<p>Round: ${items.map(x=>`$${Math.round(x[1]/100)}`).join(' + ')} = about $${sum(items.map(x=>Math.round(x[1]/100)))}. The exact total is ${$$(tot)}.</p><p>$${have/100} is ${have>=tot?'enough':'not enough'}, so <b>${r}</b>.</p>`,nudge:`<p>Round each price to the nearest dollar and add.</p>`}),r,[r==='Yes'?'No':'Yes']);},
 decProd:()=>{let a,b;do{a=R(15,95);b=R(15,95);}while(a%10===0||b%10===0||a%10===5||b%10===5);const ra=Math.round(a/10),rb=Math.round(b/10);return ok({prompt:'Round each number to the nearest whole number, then multiply.',tpl:`${D(a,1)} × ${D(b,1)} ≈ {A}`,answer:ra*rb,text:`dp ${a}${b}`,explain:`<p>${D(a,1)} → ${ra}, ${D(b,1)} → ${rb}.</p><p>${ra} × ${rb} = <b>${ra*rb}</b> (exact: ${D(a*b,2)})</p>`,nudge:`<p>Round both to whole numbers first.</p>`});},
 decMist:c=>{let a,b;do{a=R(21,89);b=R(12,48);}while(a%10===0);const ex=a*b,k=KK(3);const sh=[ex,ex/10,ex*10][k];const est=Math.round(a/10)*Math.round(b/10)*10;const [who,he]=PK(SAY);
  const A=['It makes sense',`It is too small: the point is in the wrong place`,`It is too big: the point is in the wrong place`];
  return why(st({prompt:`${who} says <b>${D(a,1)} × ${b} = ${dstr(sh,1)}</b>. Estimate to check. What do you think?`,tpl:'{A}',text:`dm ${a}${b}${k}`,explain:`<p>${D(a,1)} ≈ ${Math.round(a/10)}, ${b} ≈ ${Math.round(b/10)*10}. Estimate: about ${est}.</p><p><b>${A[k]}</b>${k?` (Exact: ${dstr(ex,1)}.)`:''}</p>`,nudge:`<p>Round both numbers and multiply in your head.</p>`,fast:30}),A[k],A);},
 quotMist:c=>{const dr=10*R(2,6),dv=dr+PK([-2,-1,1,2]),q=10*R(2,6),comp=dr*q;const dd=comp+R(-9,9);const k=KK(3);const sh=[q,q*10,q/10][k];const [who,he]=PK(SAY);
  const A=['It makes sense','It is too big: a zero too many','It is too small: a zero is missing'];
  return why(st({prompt:`${who} says <b>${N(dd)} ÷ ${dv}</b> is about <b>${sh}</b>. What do you think?`,tpl:'{A}',text:`qm ${dd}${dv}${k}`,explain:`<p>${dv} ≈ ${dr}, ${N(dd)} ≈ ${N(comp)}. ${N(comp)} ÷ ${dr} = ${q}.</p><p><b>${A[k]}</b></p>`,nudge:`<p>Use numbers that divide easily.</p>`,fast:30}),A[k],A);},
 /* ---- avg ---- */
 chal:mk=>c=>{const q=mk(c);if(!/^⭐/.test(q.prompt||''))q.prompt='⭐ Challenge: '+(q.prompt||'');return q;},
 a4mean3:()=>{const l=meanL(3,12,60);return ok({prompt:'What is the <b>mean</b> (average)?',tpl:`Mean of ${l.join(', ')} = {A}`,answer:sum(l)/3,text:`a3 ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ 3 = <b>${sum(l)/3}</b></p>`,nudge:`<p>Add them, then divide by 3.</p>`});},
 a4mean4:()=>{const k=PK([4,5]);const l=meanL(k,12,80);return ok({prompt:'What is the <b>mean</b> (average)?',tpl:`Mean of ${l.join(', ')} = {A}`,answer:sum(l)/k,text:`a4 ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ ${k} = <b>${sum(l)/k}</b></p>`,nudge:`<p>Add them all, then divide by ${k}.</p>`});},
 a4miss:c=>{const k=PK([3,4]),m=R(15,40);const l=Array.from({length:k-1},()=>R(m-10,m+10));const x=m*k-sum(l);if(x<2)return r3.a4miss(c);const [who,what,vb]=PK([['Coach Flex','push-ups each day','did'],['Ms. Rosa','muffins each day','baked'],['Skyla','miles each day','flew']]);
  return st({prompt:`${who} ${vb} a mean of <b>${m}</b> ${what} for ${k} days. On ${k-1} days the numbers were <b>${l.join(', ')}</b>. One value is missing. What is it?`,tpl:'{A}',answer:x,text:`a4m ${l} ${m}`,explain:`<p>Total for ${k} days: ${m} × ${k} = ${m*k}.</p><p>${m*k} − ${sum(l)} = <b>${x}</b></p>`,nudge:`<p>Mean × number of days = the total.</p>`,fast:35});},
 a4bars:c=>{const k=PK([4,5]);const l=meanL(k,10,40);return ok({vis:{t:'sbars',vals:l,names:['Mon','Tue','Wed','Thu','Fri'].slice(0,k)},prompt:'The chart shows the hats sold at The Average Shoppe. What is the <b>mean</b> per day?',tpl:'Mean: {A} hats',answer:sum(l)/k,text:`a4b ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ ${k} = <b>${sum(l)/k}</b></p>`,nudge:`<p>Read each bar, add, then divide by ${k}.</p>`,fast:25});},
 a4ctx:(c,K)=>{const k=K;const l=meanL(k===2?5:4,12,48),n=l.length;const S=[[`Nana Paws walked <b>${l.join(', ')}</b> dogs on ${n} days.`,'dogs a day'],[`Gizmo fixed <b>${l.join(', ')}</b> gadgets in ${n} weeks.`,'gadgets a week'],[`The ${n} cars on Ozzy's train carried <b>${l.join(', ')}</b> riders.`,'riders a car'],[`Dr. Quartz found <b>${l.join(', ')}</b> crystals in ${n} caves.`,'crystals a cave']][k];
  return st({prompt:`${S[0]} What is the mean?`,tpl:`{A} ${S[1]}`,answer:sum(l)/n,text:`a4c ${k} ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ ${n} = <b>${sum(l)/n}</b></p>`,nudge:`<p>Add them all, then divide by ${n}.</p>`,fast:30});},
 a5gap:c=>{let A,B;do{A=meanL(4,10,30);B=meanL(5,10,30);}while(sum(A)/4===sum(B)/5);const ma=sum(A)/4,mb=sum(B)/5;const [hi,lo,hn,ln]=ma>mb?[ma,mb,'Team Rosa','Team Flex']:[mb,ma,'Team Flex','Team Rosa'];
  return st({prompt:`Team Rosa scored <b>${A.join(', ')}</b> in 4 games. Team Flex scored <b>${B.join(', ')}</b> in 5 games. How much higher is the better team's mean?`,tpl:'{A} points higher',answer:hi-lo,text:`gap ${A} ${B}`,explain:`<p>Team Rosa: ${sum(A)} ÷ 4 = ${ma}. Team Flex: ${sum(B)} ÷ 5 = ${mb}.</p><p>${hn}: ${hi} − ${lo} = <b>${hi-lo}</b></p>`,nudge:`<p>Find both means first.</p>`,fast:45});},
 aMist:c=>{let l;do{l=[R(4,30),R(4,30),R(4,30)];}while(sum(l)%12||new Set(l).size<3);const s=l.slice().sort((a,b)=>a-b);const m=sum(l)/3;if(s[1]===m)return r3.aMist(c);const k=KK(4);const said=[m,sum(l)/4,sum(l),s[1]][k];const [who,he]=PK(SAY);
  const A=[`${cap(he)} is right!`,`${cap(he)} divided by 4 instead of 3`,`${cap(he)} forgot to divide`,`${cap(he)} just picked the middle number`];
  return why(st({prompt:`${who} says the mean of <b>${l.join(', ')}</b> is <b>${said}</b>. Is ${he} right? Choose the reason.`,tpl:'{A}',text:`am ${l}${k}`,explain:`<p>${l.join(' + ')} = ${sum(l)}. ${sum(l)} ÷ 3 = ${m}.</p><p><b>${A[k]}</b></p>`,nudge:`<p>Find the mean yourself first.</p>`,fast:30}),A[k],A);},
 /* ---- vol ---- */
 mVol:c=>{const l=R(2,6),w=R(2,5),h=R(2,5);const V=l*w*h;const k=KK(3);const said=[V,l+w+h,l*w][k];if(k&&said===V)return r3.mVol(c);const [who,he]=PK(SAY);
  const A=[`${cap(he)} is right!`,`${cap(he)} added instead of multiplying`,`${cap(he)} only counted one layer`];
  return why(st({prompt:`${who} says a box <b>${l} × ${w} × ${h}</b> holds <b>${said}</b> unit cubes. Is ${he} right? Choose the reason.`,tpl:'{A}',text:`mv ${l}${w}${h}${k}`,explain:`<p>Volume = ${l} × ${w} × ${h} = ${V}.</p><p><b>${A[k]}</b></p>`,nudge:`<p>Find the volume yourself, then compare.</p>`,fast:25}),A[k],A);},
 moreBox:()=>{let a,b;do{a=[R(2,8),R(2,6),R(2,6)];b=[R(2,8),R(2,6),R(2,6)];}while(a[0]*a[1]*a[2]===b[0]*b[1]*b[2]);const va=a[0]*a[1]*a[2],vb=b[0]*b[1]*b[2];const r=va>vb?'Box A':'Box B';
  return choice(ok({prompt:`Box A is <b>${a.join(' × ')}</b> cm. Box B is <b>${b.join(' × ')}</b> cm. Which box holds more?`,tpl:'{A}',text:`mb ${a}${b}`,explain:`<p>A: ${va} cubic cm. B: ${vb} cubic cm.</p><p><b>${r}</b> holds more.</p>`,nudge:`<p>Find both volumes.</p>`}),r,['Box A','Box B']);},
 /* ---- word ---- */
 mVans:c=>{const d=R(5,9),n=R(8,20),r=R(1,d-1);const t=d*n+r;const k=KK(3);const said=[n+1,n,n+2][k];
  const A=['He is right!','He forgot the leftover kids need a van too','He added one van too many'];
  return why(st({prompt:`<b>${t}</b> kids are going to the lake. Each van holds <b>${d}</b> kids. Gizmo says they need <b>${said}</b> vans. Is he right? Choose the reason.`,tpl:'{A}',text:`mvn ${t}${d}${k}`,explain:`<p>${t} ÷ ${d} = ${n} R ${r}. The ${r} extra kids need a van too: ${n+1} vans.</p><p><b>${A[k]}</b></p>`,nudge:`<p>Divide, then think about the leftover kids.</p>`,fast:30}),A[k],A);},
 mOps:c=>{let a,b,d;do{a=R(2,9);b=R(2,9);d=R(2,6);}while((a+b)*d===a+b*d||a*b+d===a+b*d);const k=KK(3);const said=[a+b*d,(a+b)*d,a*b+d][k];const [who,he]=PK(SAY);
  const A=[`${cap(he)} is right!`,`${cap(he)} worked left to right`,`${cap(he)} did ${a} × ${b} + ${d}`];
  return why(st({prompt:`${who} says <b>${a} + ${b} × ${d} = ${said}</b>. Is ${he} right? Choose the reason.`,tpl:'{A}',text:`mo ${a}${b}${d}${k}`,explain:`<p>Multiply first: ${b} × ${d} = ${b*d}. Then ${a} + ${b*d} = ${a+b*d}.</p><p><b>${A[k]}</b></p>`,nudge:`<p>× comes before +.</p>`,fast:25}),A[k],A);},
 timesBig:c=>{const a=R(12,25),k=R(4,8),g=R(10,a*k-10);const [A,B,u,v]=PK([[`${c.name} found`,'Dr. Quartz','crystals','found'],['Nana Paws knitted','the knitting club','scarves','knitted'],['The Elder Wiz has','the Grey Goblin','lonely socks','has']]);
  return st({prompt:`${A} <b>${a}</b> ${u}. ${cap(B)} ${v} <b>${k} times as many</b>, then gave away <b>${g}</b>. How many ${u} does ${B} have now?`,tpl:`{A} ${u}`,answer:a*k-g,text:`tb ${a}${k}${g}${u}`,explain:`<p>${a} × ${k} = ${a*k}.</p><p>${a*k} − ${g} = <b>${a*k-g}</b></p>`,nudge:`<p>Multiply first, then subtract.</p>`,fast:30});},
 books:c=>{const bx=R(4,8),per=PK([12,18,24]),g=R(5,20),sh=PK([3,4,6]);const left=bx*per-g;if(left%sh)return r3.books(c);return st({prompt:`The Kind Teacher has <b>${bx}</b> boxes of <b>${per}</b> books. She gives <b>${g}</b> books to the library. She puts the rest equally on <b>${sh}</b> shelves. How many books go on each shelf?`,tpl:'{A} books',answer:left/sh,text:`bk ${bx}${per}${g}${sh}`,explain:`<p>${bx} × ${per} = ${bx*per}. ${bx*per} − ${g} = ${left}.</p><p>${left} ÷ ${sh} = <b>${left/sh}</b></p>`,nudge:`<p>Multiply, subtract, then divide.</p>`,fast:45});},
 garden:c=>{const r1=R(6,9),p1=R(12,18),r2=R(4,7),p2=R(10,15);if(r1*p1<=r2*p2)return r3.garden(c);return st({prompt:`Ms. Rosa plants <b>${r1}</b> rows of <b>${p1}</b> tulips and <b>${r2}</b> rows of <b>${p2}</b> daisies. How many more tulips than daisies?`,tpl:'{A} more tulips',answer:r1*p1-r2*p2,text:`gd ${r1}${p1}${r2}${p2}`,explain:`<p>Tulips: ${r1} × ${p1} = ${r1*p1}. Daisies: ${r2} × ${p2} = ${r2*p2}.</p><p>${r1*p1} − ${r2*p2} = <b>${r1*p1-r2*p2}</b></p>`,nudge:`<p>Find each kind of flower, then subtract.</p>`,fast:40});}
};

/* ===== round 4 polish: balanced "is he right?" answers, no repeats inside a round, harder steps ===== */
const ZB=[];const KK=n=>{if(!ZB.length)ZB.push(...SH([1,0,0,0]));return ZB.shift()?0:R(1,n-1);};
const RECENT=[];
const fr=mk=>c=>{let q,key;for(let i=0;i<14;i++){q=mk(c);if(!q)return q;const pt=String(q.prompt||'').replace(/<[^>]+>/g,' ').replace(/⭐ Challenge:/,'').replace(/\s+/g,' ').trim();
  key=q.kind==='clock'?'c'+q.answer:q.wp?pt.split(' ').slice(0,4).join(' '):null;if(!key||!RECENT.includes(key))break;}
 if(key){RECENT.push(key);if(RECENT.length>7)RECENT.shift();}return q;};
const unitN=(n,pl)=>n===1?({feet:'foot',inches:'inch'}[pl]||pl.replace(/s$/,'')):pl;
const r5ins=1;
const qalt=(dd,dv,dr,q)=>{const a=[...new Set([Math.round(dd/dv/10)*10,Math.round(dd/dr/10)*10])].filter(x=>x!==q&&x>0);return a.length?a:undefined;};
const qaltEx=(dd,dv,q)=>{const x=Math.round(dd/dv/10)*10;return x!==q?`<p class="tip">Using ${dv} × ${x} = ${N(dv*x)} is a good estimate too, so ${x} is also right.</p>`:'';};
/* ===== round 6: template keys (tk) and more kinds per round ===== */
const K=(tk,mk)=>c=>{const q=mk(c);if(q)q.tk=tk;return q;};
const QW2=t=>{const m=mm(t),h=hh(t);return m===0?`${NUMW[h]} o'clock`:m===15?`quarter past ${NUMW[h]}`:m===30?`half past ${NUMW[h]}`:m===45?`quarter to ${NUMW[H12(h+1)]}`:m<30?`${m} minutes after ${NUMW[h]}`:`${60-m} minutes to ${NUMW[H12(h+1)]}`;};
const EV4=[['Coach Flex','goes for a run'],['Ms. Rosa','opens the café'],['Nana Paws','walks the dogs'],['Gizmo','tests a gadget'],["Ozzy's train",'leaves the Depot'],['Dr. Quartz','checks his crystals'],['Skyla','flies to the lake'],['The Elder Wiz','reads a spell'],['Grumbleroot','opens his bridge']];
const r6={
 whichTime:o=>()=>{const m=o==='q'?PK([15,45]):5*R(1,11);const h=R(1,11);const t=at(h,m);const r=Tt(t);const sw=m/5===h?null:at(m/5===0?12:m/5,(h%12)*5);
  const w=[Tt(t+60),Tt(t-60),sw!=null&&sw!==t?Tt(sw):Tt(t+5),Tt(t-5)];return choice(ok({vis:{t:'clock',h,m},prompt:'Which time does this clock show?',tpl:'{A}',text:`wt ${r}`,explain:`<p>Short hand: it has passed the ${h}, so the hour is ${h}. Long hand on the ${m/5}: ${m} minutes.</p><p>It is <b>${r}</b>.</p>`,nudge:`<p>Short hand = hour, long hand = minutes. Don't mix them up!</p>`}),r,w);},
 order:(n,wd)=>c=>{const ev=SH(EV4).slice(0,n);const pool=SH(Array.from({length:20},(_,i)=>at(7+Math.floor(i/4),5*R(0,11)))).filter((t,i,a)=>a.indexOf(t)===i);const ts=pool.slice(0,n);const s=ts.slice().sort((a,b)=>a-b);
  const pos=n===4?R(0,3):PK([0,2]);const word=['first','second','third','last'][n===3&&pos===2?3:pos];const idx=ts.indexOf(s[pos]);
  return choice(st({prompt:`This morning:<br>${ev.map((e,i)=>`${e[0]} ${e[1]} at <b>${wd?QW2(ts[i]):Tt(ts[i])}</b>.`).join('<br>')}<br>Who goes <b>${word}</b>?`,tpl:'{A}',text:`o${n} ${ts} ${pos}`,explain:`<p>In order: ${s.map(t=>`${Tt(t)} ${ev[ts.indexOf(t)][0]}`).join(', then ')}.</p><p><b>${ev[idx][0]}</b> goes ${word}.</p>`,nudge:`<p>Write each time as a clock time, then put them in order.</p>`,fast:30}),ev[idx][0],ev.filter((_,i)=>i!==idx).map(e=>e[0]));},
 wait2:c=>{const ev=at(R(2,11),5*R(1,6));const d=5*R(Math.floor(mm(ev)/5)+1,9);const now=ev-d;const [s,u]=PK([['The school bus comes at','the bus comes'],["Ozzy's train leaves at",'the train leaves'],['The puppet show starts at','the show starts'],['Soccer practice starts at','practice starts'],["Ms. Rosa's pies are ready at",'the pies are ready']]);
  return st({prompt:`${s} <b>${Tt(ev)}</b>. It is <b>${Tt(now)}</b> now. How many minutes until ${u}?`,tpl:'{A} minutes',answer:d,text:`w2 ${ev} ${d}`,explain:`<p>${Tt(now)} → ${Tt(ev-mm(ev))} is ${60-mm(now)} minutes. ${Tt(ev-mm(ev))} → ${Tt(ev)} is ${mm(ev)} minutes.</p><p>${60-mm(now)} + ${mm(ev)} = <b>${d}</b></p>`,nudge:`<p>Count by 5s up to the o'clock first, then on to ${Tt(ev)}.</p>`,fast:30});},
 clockWords:()=>{const t=at(R(1,11),5*PK([1,2,4,5,7,8,10,11]));const r=QW2(t);const w=[QW2(t+5),QW2(t-5),QW2(t+60),QW2(at(hh(t),60-mm(t)))].filter(x=>x!==r);
  return choice(ok({vis:{t:'clock',h:hh(t),m:mm(t)},prompt:'Which words match this clock?',tpl:'{A}',text:`cw ${Tt(t)}`,explain:`<p>The clock shows ${Tt(t)}, which is <b>${r}</b>.</p>`,nudge:`<p>Past :30, count the minutes <b>to</b> the next hour.</p>`}),r,SH(w).slice(0,3));},
 sched4:c=>{const ev=SH(EV4).slice(0,4);const ts=SH([at(7,0),at(7,30),at(8,0),at(8,30),at(9,0),at(9,30),at(10,0),at(10,30),at(11,0)]).slice(0,4);const s=ts.slice().sort((a,b)=>a-b);const k=R(0,2);const a=ts.indexOf(s[k]),b=ts.indexOf(s[k+1]);
  return choice(st({prompt:`This morning:<br>${ev.map((e,i)=>`${e[0]} ${e[1]} at <b>${QW1(ts[i])}</b>.`).join('<br>')}<br>Who goes <b>right after</b> ${ev[a][0].replace(/^The /,'the ')}?`,tpl:'{A}',text:`s4 ${ts} ${k}`,explain:`<p>In order: ${s.map(t=>`${Tt(t)} ${ev[ts.indexOf(t)][0]}`).join(', then ')}.</p><p>Right after ${ev[a][0]} comes <b>${ev[b][0]}</b>.</p>`,nudge:`<p>Change each to a clock time and put them in order.</p>`,fast:30}),ev[b][0],ev.filter((_,i)=>i!==b&&i!==a).map(e=>e[0]));},
 startHM:c=>{const out=at(R(11,16),5*R(0,11)),d=60*R(1,2)+5*R(1,11);const [s,q]=PK([['Gizmo finishes building a robot','What time did he start?'],["Ms. Rosa's bread comes out of the oven",'What time did it go in?'],["Ozzy's train arrives at the lake",'What time did it leave?'],['The Elder Wiz stops practicing spells','What time did he start?']]);
  return st(Object.assign({prompt:`${s} at <b>${Tt(out)}</b>. It took <b>${dw(d)}</b>. ${q}`,tpl:'{A}',text:`shm ${out} ${d}`,explain:exEarlier(out,d)+TYPE(out-d),nudge:`<p>Count back the hours first, then the minutes.</p>`,fast:35},CK(out-d)));},
 secCmp:c=>{const a=R(70,140),b=R(1,2);const bs=R(5,50);const bt=b*60+bs;if(a===bt)return r6.secCmp(c);const [hi,lo]=a>bt?['Gizmo','Coach Flex']:['Coach Flex','Gizmo'];
  return st({prompt:`Gizmo's robot runs a race in <b>${a} seconds</b>. Coach Flex runs it in <b>${b} min ${bs} s</b>. How many seconds longer does ${hi} take?`,tpl:'{A} seconds',answer:Math.abs(a-bt),text:`sc ${a}${bt}`,explain:`<p>${b} min ${bs} s = ${b*60} + ${bs} = ${bt} s.</p><p>${Math.max(a,bt)} − ${Math.min(a,bt)} = <b>${Math.abs(a-bt)}</b></p>`,nudge:`<p>Change minutes to seconds first.</p>`,fast:30});},
 protOdd:()=>{const a=5*(2*R(1,16)+1);return ok({vis:{t:'prot',a,fine:true},prompt:'Measure the angle. Look at the small marks!',tpl:'{A}°',answer:a,text:`po ${a}`,explain:`<p>Start at 0 on the flat side and count up to where the ray crosses: <b>${a}°</b>.</p><p>${a<90?'It is acute.':'It is obtuse.'}</p>`,nudge:`<p>The ray is between two big marks, so use the small marks (5° each).</p>`});},
 tAngle:()=>{const ty=a=>a<90?'acute':a===90?'right':a<180?'obtuse':'straight';let as;do{as=SH([5*R(3,17),5*R(3,17),5*R(19,35),5*R(19,35),90,180]).slice(0,4);}while(new Set(as).size<4);const cand=as.map((a,i)=>i).filter(i=>as[i]!==90&&as[i]!==180);const ti=PK(cand);
  const st2=as.map((a,i)=>{const t=ty(a);if(i===ti)return `A ${a}° angle is ${t}.`;const w=PK(['acute','right','obtuse','straight'].filter(x=>x!==t));return `A ${a}° angle is ${w}.`;});
  return choice(ok({prompt:'Which statement is <b>true</b>?',tpl:'{A}',text:`ta ${as} ${ti}`,explain:`<p>Acute: less than 90°. Right: 90°. Obtuse: between 90° and 180°. Straight: 180°.</p><p><b>${st2[ti]}</b></p>`,nudge:`<p>Compare each angle with 90° and 180°.</p>`,fast:25}),st2[ti],st2.filter((_,i)=>i!==ti));},
 areaMix:()=>{let a,b,s;do{a=R(15,45);b=R(11,25);s=R(11,25);}while(a%10===0||b%10===0||s%10===0||(a*b+s*s)%10===0);const o=ok({prompt:`A garden is a rectangle <b>${D(a,1)} m</b> by <b>${D(b,1)} m</b> plus a square patch <b>${D(s,1)} m</b> on each side. What is the total area?`,tpl:'{A} square meters',text:`am ${a}${b}${s}`,explain:`<p>Rectangle: ${D(a,1)} × ${D(b,1)} = ${D(a*b,2)}. Square: ${D(s,1)} × ${D(s,1)} = ${D(s*s,2)}.</p><p>${D(a*b,2)} + ${D(s*s,2)} = <b>${D(a*b+s*s,2)}</b></p>`,nudge:`<p>Find both areas, then add.</p>`,fast:35});return DEC(o,a*b+s*s,2);},
 shareMoney:c=>{const k=PK([3,4]),m=R(5,12);let l;do{l=Array.from({length:k-1},()=>R(m-4,m+4));l.push(m*k-sum(l));}while(l.some(v=>v<2)||new Set(l).size<2);const who=SH([c.name,'Gizmo','Nana Paws','Skyla','Ozzy']).slice(0,k);
  return st({prompt:`${who.slice(0,-1).join(', ')} and ${who[k-1]} have <b>$${l.slice(0,-1).join('</b>, <b>$')}</b> and <b>$${l[k-1]}</b>. They put the money together and <b>share it equally</b>. How much does each one get?`,tpl:'$ {A}',answer:m,text:`smo ${l}`,explain:`<p>Together: $${l.join(' + $')} = $${m*k}.</p><p>$${m*k} ÷ ${k} = <b>$${m}</b> each</p>`,nudge:`<p>Put it all together, then share by ${k}.</p>`});},
 shareTwo:c=>{const k=PK([3,4]),m=R(6,12),g=R(1,3);let l;do{l=Array.from({length:k-1},()=>R(m-4,m+4));l.push(m*k-sum(l));}while(l.some(v=>v<2)||new Set(l).size<2);const [who,what]=PK([['Three friends','strawberries'],['The Kind Teacher\'s helpers','stickers'],['The campers','marbles']]);
  return st({prompt:`${who} have <b>${l.slice(0,-1).join(', ')}</b> and <b>${l[k-1]}</b> ${what}. They share them equally among the ${k} of them. Then each one gives <b>${g}</b> to Ms. Rosa. How many does each one have now?`.replace('Three friends',k===3?'Three friends':'Four friends'),tpl:`{A} ${what}`,answer:m-g,text:`st ${l} ${g}`,explain:`<p>Together: ${l.join(' + ')} = ${m*k}. Shared: ${m*k} ÷ ${k} = ${m}.</p><p>${m} − ${g} = <b>${m-g}</b></p>`,nudge:`<p>Share equally first, then take away.</p>`,fast:30});},
 barShare:c=>{const k=PK([3,4,5]),m=R(4,9);let l;do{l=Array.from({length:k-1},()=>R(m-3,m+3));l.push(m*k-sum(l));}while(l.some(v=>v<1)||new Set(l).size<2);
  return ok({vis:{t:'sbars',vals:l,names:['Mon','Tue','Wed','Thu','Fri'].slice(0,k)},prompt:'The chart shows the pies Ms. Rosa baked. If she had baked the <b>same number every day</b>, how many would that be each day?',tpl:'{A} pies',answer:m,text:`bs ${l}`,explain:`<p>Total: ${l.join(' + ')} = ${m*k}.</p><p>Shared by ${k} days: ${m*k} ÷ ${k} = <b>${m}</b></p>`,nudge:`<p>Add all the bars, then share by ${k} days.</p>`,fast:25});},
 vLayer:()=>{const a=R(2,5),b=R(2,4),n=R(2,5);return ok({prompt:`A box holds <b>${a*b*n}</b> cubes in <b>${n}</b> equal layers. How many cubes are in one layer?`,tpl:'{A} cubes',answer:a*b,text:`vl ${a}${b}${n}`,explain:`<p>${a*b*n} ÷ ${n} = <b>${a*b}</b></p>`,nudge:`<p>Share the cubes equally among the layers.</p>`});},
 vMore:()=>{let a,b;do{a=[R(2,4),R(2,3),R(1,3)];b=[R(2,4),R(2,3),R(1,3)];}while(a[0]*a[1]*a[2]===b[0]*b[1]*b[2]);const va=a[0]*a[1]*a[2],vb=b[0]*b[1]*b[2];const r=va>vb?'Box A':'Box B';
  return choice(ok({vis:{t:'iso',b:[{x:0,l:a[0],w:a[1],h:a[2]},{x:a[0]+1,l:b[0],w:b[1],h:b[2]}],lb:[{name:'A'},{name:'B'}]},prompt:'Which box is made of more unit cubes?',tpl:'{A}',text:`vm ${a}${b}`,explain:`<p>A: ${a.join(' × ')} = ${va}. B: ${b.join(' × ')} = ${vb}.</p><p><b>${r}</b></p>`,nudge:`<p>Count each box: layer × layers.</p>`}),r,['Box A','Box B']);},
 wkd:()=>{const w=R(2,6),d=R(1,6);return ok({prompt:'Change to days.',tpl:`${w} weeks ${d} day${d>1?'s':''} = {A} days`,answer:w*7+d,text:`wkd ${w}${d}`,explain:`<p>${w} × 7 = ${w*7}. ${w*7} + ${d} = <b>${w*7+d}</b></p>`,nudge:`<p>A week has 7 days.</p>`});},
 m2hm5:()=>{const h=R(2,5),m=R(5,55);return ok({prompt:'Change to hours and minutes.',tpl:`${h*60+m} min = ${h} h {A} min`,answer:m,text:`mh5 ${h}${m}`,explain:`<p>${h} h = ${h*60} min. ${h*60+m} − ${h*60} = <b>${m}</b></p>`,nudge:`<p>Take away ${h} × 60.</p>`});},
 s2min:()=>{const m=R(3,12);return ok({prompt:'Change to minutes.',tpl:`${m*60} seconds = {A} minutes`,answer:m,text:`s2m ${m}`,explain:`<p>60 seconds = 1 minute. ${m*60} ÷ 60 = <b>${m}</b></p>`,nudge:`<p>How many 60s are in ${m*60}?</p>`});}
};

/* ===== round 5: extra makers ===== */
const r5={
 sqMiss:()=>{const s=R(4,15),u=PK(['cm','m','in','ft']);return ok({prompt:`A square has a perimeter of <b>${4*s} ${u}</b>. How long is each side?`,tpl:`{A} ${u}`,answer:s,text:`sqm ${s}${u}`,explain:`<p>A square has 4 equal sides: ${4*s} ÷ 4 = <b>${s}</b> ${u}</p>`,nudge:`<p>Share the perimeter equally among 4 sides.</p>`});},
 lights:c=>{const l=R(4,9),w=R(3,l),gap=PK([1,2]);const P=2*(l+w);if(P%gap)return r5.lights(c);return st({prompt:`Gizmo puts a string of lights all the way around a window <b>${l} ft</b> wide and <b>${w} ft</b> tall. He puts one light every <b>${gap===1?'foot':gap+' feet'}</b>. How many lights does he need?`,tpl:'{A} lights',answer:P/gap,text:`lt ${l}${w}${gap}`,explain:`<p>Perimeter: ${l} + ${w} + ${l} + ${w} = ${P} ft.</p><p>${P} ÷ ${gap} = <b>${P/gap}</b> lights</p>`,nudge:`<p>Find the distance around first.</p>`,fast:30});},
 cmpLen:()=>{const f=R(2,5),i=R(1,11);const v=f*12+i+PK([-2,-1,1,2,0]);const L=`${f} ft ${i} in`,Rt=`${v} in`;const r=f*12+i>v?L:f*12+i<v?Rt:'Same';
  return choice(ok({prompt:'Which is longer?',tpl:'{A}',text:`cl ${f}${i}${v}`,explain:`<p>${f} ft ${i} in = ${f} × 12 + ${i} = ${f*12+i} in.</p><p>Compare with ${v} in: <b>${r}</b>.</p>`,nudge:`<p>Change ${L} to inches first.</p>`}),r,[L,Rt,'Same']);},
 shelf:c=>{const w=PK([15,20,25,30,40]),n=R(4,9);const L=w*n;const o=st({prompt:`Dr. Quartz's shelf is <b>${dstr(L,2)} m</b> long. Each crystal box is <b>${w} cm</b> wide. How many boxes fit side by side?`,tpl:'{A} boxes',answer:n,text:`sh ${w}${n}`,explain:`<p>${dstr(L,2)} m = ${L} cm.</p><p>${L} ÷ ${w} = <b>${n}</b> boxes</p>`,nudge:`<p>Change meters to centimeters first.</p>`,fast:30});return o;},
 divTwo:c=>{const a=R(6,12),k=R(4,9);const [A,u,B]=PK([['Coach Flex did','push-ups','Nana Paws'],['Dr. Quartz found','crystals','Gizmo'],['Skyla flew','miles','a sparrow']]);
  return st({prompt:`${A} <b>${a*k}</b> ${u}. That is <b>${k} times as many</b> as ${B}. How many ${u} is that <b>together</b>?`,tpl:`{A} ${u}`,answer:a*k+a,text:`dt ${a}${k}${u}`,explain:`<p>${B}: ${a*k} ÷ ${k} = ${a}.</p><p>Together: ${a*k} + ${a} = <b>${a*k+a}</b></p>`,nudge:`<p>Step 1: divide to find the smaller amount. Step 2: add.</p>`,fast:30});},
 shareLeft:c=>{const f=R(3,8),e=R(5,12),eat=R(1,4);const [who,what]=PK([['Nana Paws','dog treats'],['The Kind Teacher','stickers'],['Grumbleroot','troll snacks']]);
  return st({prompt:`${who} shares <b>${f*e}</b> ${what} equally among <b>${f}</b> friends. Each friend uses <b>${eat}</b> right away. How many does each friend have left?`,tpl:`{A} ${what}`,answer:e-eat,text:`sl ${f}${e}${eat}${what}`,explain:`<p>Each gets ${f*e} ÷ ${f} = ${e}.</p><p>${e} − ${eat} = <b>${e-eat}</b></p>`,nudge:`<p>Divide first, then subtract.</p>`,fast:30});},
 sum100k:()=>{const a=notM(1110,4890,100),b=notM(1110,3890,100);const ra=rnd(a,100),rb=rnd(b,100);return ok({prompt:'Round each number to the nearest <b>hundred</b>, then add.',tpl:`${N(a)} + ${N(b)} ≈ {A}`,answer:ra+rb,text:`s100k ${a}${b}`,explain:`<p>${N(a)} → ${N(ra)}. ${N(b)} → ${N(rb)}.</p><p>${N(ra)} + ${N(rb)} = <b>${N(ra+rb)}</b></p>`,nudge:`<p>Look at the tens digit to round to hundreds.</p>`});},
 roundsTo:()=>{const t=1000*R(2,9);const r=t+100*PK([-4,-3,-2,2,3,4])+R(1,99)*PK([1,-1]);const w=[t+500+R(1,99),t-500-R(1,99),t+1000+R(-300,300)];const ok2=String(N(r));
  return choice(ok({prompt:`Which number rounds to <b>${N(t)}</b> (nearest thousand)?`,tpl:'{A}',text:`rt ${t}${r}`,explain:`<p>Numbers from ${N(t-500)} up to ${N(t+499)} round to ${N(t)}.</p><p><b>${ok2}</b> does.</p>`,nudge:`<p>Look at the hundreds digit.</p>`}),ok2,w.map(N));}
};

const r7={
 relate:()=>{const [b,s,f]=PK([['foot','inches',12],['yard','feet',3],['meter','centimeters',100],['kilogram','grams',1000],['pound','ounces',16],['liter','milliliters',1000],['hour','minutes',60],['kilometer','meters',1000]]);return ok({prompt:`How many <b>${s}</b> are in <b>1 ${b}</b>?`,tpl:`1 ${b} = {A} ${s}`,answer:f,text:`rel ${b}`,explain:`<p>1 ${b} = <b>${N(f)}</b> ${s}.</p>`,nudge:`<p>Think of a ruler, a scale or a clock.</p>`,fast:8});},
 ftIn:()=>{const f=R(1,4),i=R(1,11);return ok({prompt:'Change to inches.',tpl:`${f} ${f>1?'feet':'foot'} ${i} ${i>1?'inches':'inch'} = {A} inches`,answer:f*12+i,text:`fi ${f}${i}`,explain:`<p>${f} × 12 = ${f*12}. ${f*12} + ${i} = <b>${f*12+i}</b></p>`,nudge:`<p>1 foot = 12 inches.</p>`});}
};
const r4={
 t1sched:c=>{const [who,list,what]=PK([["The Kind Teacher's class list",[['art','🎨'],['music','🎵'],['lunch','🥪'],['reading','📚'],['recess','⚽'],['science','🔬']],'the class'],["Coach Flex's camp plan",[['running','🏃'],['swimming','🏊'],['lunch','🥪'],['jump rope','🪢'],['stretching','🧘'],['soccer','⚽']],'the campers'],["Nana Paws's day plan",[['dog walk','🐕'],['knitting','🧶'],['lunch','🥪'],['nap','😴'],['bath time for dogs','🛁'],['garden','🌷']],'Nana Paws'],["Ms. Rosa's café plan",[['baking','🧁'],['cleaning','🧽'],['lunch rush','🥪'],['pie time','🥧'],['shopping','🛒'],['tea party','🫖']],'Ms. Rosa']]);
  const acts=SH(list).slice(0,3);const ts=SH([at(9,0),at(9,30),at(10,0),at(10,30),at(11,0),at(11,30),at(12,30),at(1,0),at(1,30),at(2,0)]).slice(0,3);const i=R(0,2);
  return choice(st({vis:{t:'clock',h:hh(ts[i]),m:mm(ts[i])},prompt:`${who}:<br>${acts.map((a,j)=>`${a[1]} ${cap(a[0])} at <b>${QW1(ts[j])}</b>`).join('<br>')}<br>What ${what==='the campers'?'do':'does'} ${what} do at the time on this clock?`,tpl:'{A}',text:`sch ${acts.map(a=>a[0])} ${ts} ${i}`,explain:`<p>The clock shows ${Tt(ts[i])}, which is ${QW1(ts[i])}.</p><p>That is <b>${acts[i][0]}</b>.</p>`,nudge:`<p>Read the clock first, then find that time in the list.</p>`,fast:25}),acts[i][0],acts.filter((_,j)=>j!==i).map(a=>a[0]));},
 t1fl:c=>{const ts=SH([at(1,0),at(1,30),at(2,0),at(2,30),at(3,0),at(3,30),at(4,0),at(4,30),at(5,0),at(5,30)]).slice(0,3);const first=Math.random()<.5;const r=first?Math.min(...ts):Math.max(...ts);
  return choice(ok({prompt:`These times are all in the same afternoon. Which comes <b>${first?'first':'last'}</b>?`,tpl:'{A}',text:`fl ${ts} ${first}`,explain:`<p>In order: ${ts.slice().sort((a,b)=>a-b).map(t=>`${QW1(t)} (${Tt(t)})`).join(', ')}.</p><p><b>${QW1(r)}</b> comes ${first?'first':'last'}.</p>`,nudge:`<p>Change each to a clock time. Smaller hour = earlier.</p>`}),QW1(r),ts.filter(x=>x!==r).map(QW1));},
 wait:c=>{const ev=at(R(1,11),5*R(2,11));const d=5*R(2,9);const now=ev-d;const [s,u]=PK([['The school bus comes at','the bus comes'],["Ozzy's train leaves at",'the train leaves'],["Ms. Rosa's cookies are ready at",'the cookies are ready'],['Soccer practice starts at','practice starts'],['The puppet show starts at','the show starts']]);
  return st({prompt:`${s} <b>${Tt(ev)}</b>. It is <b>${Tt(now)}</b> now. How many minutes until ${u}?`,tpl:'{A} minutes',answer:d,text:`wait ${ev} ${d}`,explain:`<p>Count by 5s from ${Tt(now)} to ${Tt(ev)}: ${Array.from({length:d/5},(_,i)=>Tt(now+5*(i+1))).join(', ')}.</p><p>That is ${d/5} jumps of 5 = <b>${d}</b> minutes.</p>`,nudge:`<p>Count by 5s from ${Tt(now)}.</p>`,fast:25});},
 e3close:c=>{const a=notM(120,480,10),b=notM(120,480,10);const ex=a+b;const e=rnd(a,10)+rnd(b,10);const r=String(e);
  return choice(ok({prompt:`Round to the nearest ten to estimate <b>${a} + ${b}</b>. What estimate do you get?`,tpl:'{A}',text:`e3cl ${a}${b}`,explain:`<p>${a} → ${rnd(a,10)}, ${b} → ${rnd(b,10)}. ${rnd(a,10)} + ${rnd(b,10)} = <b>${e}</b>.</p><p>(Exact: ${ex}.)</p>`,nudge:`<p>Round each number to the nearest ten, then add.</p>`,fast:25}),r,[String(e-10),String(e+10),String(e+20)]);},
 clockAng:()=>{const h=PK([1,2,3,4,5,6]);return ok({prompt:`At <b>${h}:00</b>, what angle do the clock hands make? (A full turn is 360°. The clock has 12 equal parts.)`,tpl:'{A}°',answer:30*h,text:`ca ${h}`,explain:`<p>Each of the 12 parts is 360 ÷ 12 = 30°.</p><p>The hands are ${h} part${h>1?'s':''} apart: ${h} × 30 = <b>${30*h}°</b></p>`,nudge:`<p>One part of the clock is 360 ÷ 12 degrees.</p>`});},
 pizza:c=>{const n=PK([3,4,5,6,8,9,10,12]);const k=R(1,Math.min(3,n-1));return st({prompt:`Ms. Rosa cuts a round pie into <b>${n}</b> equal slices. What angle is at the point of <b>${k===1?'one slice':k+' slices together'}</b>?`,tpl:'{A}°',answer:360/n*k,text:`pz ${n}${k}`,explain:`<p>A full turn is 360°. One slice: 360 ÷ ${n} = ${360/n}°.</p>${k>1?`<p>${k} × ${360/n} = <b>${360/n*k}°</b></p>`:`<p>The answer is <b>${360/n}°</b>.</p>`}`,nudge:`<p>Share 360° equally among ${n} slices.</p>`});},
 e4more:c=>{const want=Math.random()<.5;let a,b,g,ex;do{a=notM(21,89,10);b=notM(21,49,10);ex=a*b;g=Math.round(rnd(a,10)*rnd(b,10)/100)*100+100*PK([-2,-1,1,2]);}while(g<500||Math.abs(ex-g)<0.15*g||Math.abs(rnd(a,10)*rnd(b,10)-g)<0.15*g||(ex>g)!==(rnd(a,10)*rnd(b,10)>g)||(ex>g)!==want);const r=ex>g?`More than ${N(g)}`:`Less than ${N(g)}`;
  return choice(ok({prompt:`Without finding the exact answer: is <b>${a} × ${b}</b> more or less than <b>${N(g)}</b>?`,tpl:'{A}',text:`e4mo ${a}${b}${g}`,explain:`<p>${a} ≈ ${rnd(a,10)}, ${b} ≈ ${rnd(b,10)}. ${rnd(a,10)} × ${rnd(b,10)} = ${N(rnd(a,10)*rnd(b,10))}.</p><p>So it is <b>${r.toLowerCase()}</b>. (Exact: ${N(ex)}.)</p>`,nudge:`<p>Round both numbers to the nearest ten and multiply.</p>`,fast:25}),r,[r.startsWith('More')?`Less than ${N(g)}`:`More than ${N(g)}`]);},
 e4more2:c=>{const want=Math.random()<.5;let p,d1,d2,g,ex,est;do{p=notM(23,48,10);d1=R(4,9);d2=R(3,8);ex=p*(d1+d2);est=rnd(p,10)*(d1+d2);g=Math.round(est/100)*100+100*PK([-2,-1,1,2]);}while(g<=0||Math.abs(ex-g)<0.15*g||Math.abs(est-g)<0.15*g||(ex>g)!==(est>g)||(ex>g)!==want);const r=ex>g?'More':'Less';
  return choice(st({prompt:`Ozzy's train carries about <b>${p}</b> riders on each trip. It makes <b>${d1}</b> trips on Monday and <b>${d2}</b> trips on Tuesday. Will it carry more or less than <b>${N(g)}</b> riders in all?`,tpl:'{A}',text:`e4m2 ${p}${d1}${d2}${g}`,explain:`<p>Trips: ${d1} + ${d2} = ${d1+d2}. ${p} ≈ ${rnd(p,10)}.</p><p>${rnd(p,10)} × ${d1+d2} = ${N(est)}, so <b>${r.toLowerCase()}</b> than ${N(g)}. (Exact: ${N(ex)}.)</p>`,nudge:`<p>Step 1: total trips. Step 2: round and multiply.</p>`,fast:35}),r,[r==='More'?'Less':'More']);},
 move:()=>{const m=R(3,8),d=R(1,m-1);const l=SH([m+d,m-d]);return ok({vis:{t:'towers',list:l},prompt:`Two towers have <b>${l[0]}</b> and <b>${l[1]}</b> blocks. How many blocks must move from the tall tower to the short one to make them even?`,tpl:'{A} blocks',answer:d,text:`mv ${l}`,explain:`<p>The difference is ${2*d}. Move half of it: ${2*d} ÷ 2 = <b>${d}</b>.</p><p>Then both towers have ${m}.</p>`,nudge:`<p>Moving 1 block makes the tall one 1 shorter AND the short one 1 taller.</p>`});},
 smallMean:()=>{const l=meanL(3,4,15);return ok({vis:{t:'towers',list:l},prompt:`Make the 3 towers <b>even</b> by moving blocks. How tall is each tower then?`,tpl:'{A} blocks',answer:sum(l)/3,text:`sm ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ 3 = <b>${sum(l)/3}</b></p>`,nudge:`<p>Add them, then share by 3.</p>`});},
 bags:c=>{const k=PK([3,4]),m=R(5,10);const l=evenList(k,m,5).map(v=>v+0);if(l.some(v=>v>20))return r4.bags(c);const [who,what,he]=PK([['Gizmo','bolts','he'],['Ms. Rosa','cherries','she'],['Skyla','feathers','she'],['Coach Flex','tennis balls','he']]);
  return st({prompt:`${who} has ${k} bags with <b>${l.slice(0,-1).join(', ')}</b> and <b>${l[k-1]}</b> ${what}. If ${he} shares them out fairly, how many go in each bag?`,tpl:`{A} ${what}`,answer:m,text:`bg ${l}${what}`,explain:`<p>${l.join(' + ')} = ${m*k}.</p><p>${m*k} ÷ ${k} = <b>${m}</b></p>`,nudge:`<p>Add them all, then share by ${k}.</p>`});},
 count:()=>{const l=R(3,5),w=R(2,3),h=R(2,4);return ok({vis:{t:'iso',b:[{x:0,l,w,h}]},prompt:'How many unit cubes make this box?',tpl:'{A} unit cubes',answer:l*w*h,text:`ct ${l}${w}${h}`,explain:`<p>One layer: ${l} × ${w} = ${l*w} cubes.</p><p>${h} layers: ${l*w} × ${h} = <b>${l*w*h}</b></p>`,nudge:`<p>Count the top layer, then count the layers.</p>`});},
 count2:()=>{const A={l:R(2,4),w:2,h:R(2,3)},B={l:R(1,2),w:2,h:R(1,A.h)};return ok({vis:{t:'iso',b:[{x:0,...A},{x:A.l,...B}]},prompt:'How many unit cubes make this shape?',tpl:'{A} unit cubes',answer:A.l*A.w*A.h+B.l*B.w*B.h,text:`ct2 ${JSON.stringify([A,B])}`,explain:`<p>Big part: ${A.l} × ${A.w} × ${A.h} = ${A.l*A.w*A.h}. Small part: ${B.l} × ${B.w} × ${B.h} = ${B.l*B.w*B.h}.</p><p>Total: <b>${A.l*A.w*A.h+B.l*B.w*B.h}</b></p>`,nudge:`<p>Count each box separately, then add.</p>`});},
 decH10:()=>{let v;do{v=R(11,39);}while(v%5===0);return ok({prompt:'How many minutes?',tpl:`${D(v,1)} hours = {A} minutes`,answer:v*6,text:`dh ${v}`,explain:`<p>0.1 hour = 6 minutes.</p><p>${D(v,1)} hours = ${v} tenths × 6 = <b>${v*6}</b> minutes</p>`,nudge:`<p>0.1 hour is 6 minutes.</p>`});},
 lpMore:c=>{let d;do{d=lpData();}while(new Set(d.map(x=>x[1])).size<2);const [t,u]=PK(LPT.slice(1));const [a,b]=SH(d).slice(0,2);const [hi,lo]=a[1]>b[1]?[a,b]:[b,a];if(hi[1]===lo[1])return r4.lpMore(c);
  return ok({prompt:lpHTML(t,u,d)+`<br>How many more ${u}s measure <b>${fr8(hi[0])}</b> than <b>${fr8(lo[0])}</b>?`,tpl:'{A} more',answer:hi[1]-lo[1],text:`lpm ${JSON.stringify(d)}${hi[0]}${lo[0]}`,explain:`<p>${fr8(hi[0])}: ${hi[1]} ✕. ${fr8(lo[0])}: ${lo[1]} ✕.</p><p>${hi[1]} − ${lo[1]} = <b>${hi[1]-lo[1]}</b></p>`,nudge:`<p>Count the ✕ above each one, then subtract.</p>`});}
};

const DEF=(op,g,r)=>PLAN.def(op,g,r.map((l,ri)=>l.map(mk=>{let m=fr(mk);if(op==='avg'&&ri>=2)m=r3.chal(m);return m;})));
DEF('time',1,[
 [t1.oclock,t1.handsO,t1.wordsO,t1x.hand('o'),t1x.pickTime('o')],
 [t1.half,t1.handsH,t1.wordsH,t1x.match,t1x.hand('h'),t1x.pickTime('h')],
 [t1.mix,t1x.match,r4.t1sched,r3.t1between,t1x.storyWords,r4.t1fl],
 [t1.mix,r4.t1fl,K('morning',r3.t1mid),K('morning',t1x.order),r4.t1sched,r3.t1between,r6.sched4],
 [t1x.storyWhat,t1x.storyWords,K('morning',t1x.order),K('morning',r3.t1mid),r4.t1sched,r4.t1fl,r6.sched4,r3.t1between]]);

/* ---------- grade 2 ---------- */
const QW=t=>{const h=hh(t),m=mm(t);return m===15?`quarter past ${NUMW[h]}`:m===45?`quarter to ${NUMW[H12(h+1)]}`:m===30?`half past ${NUMW[h]}`:`${NUMW[h]} o'clock`;};
const t2={
 quarter:()=>readClock(at(R(1,12),PK([15,45,15,45,30]))),
 wordsQ:()=>{const t=at(R(1,12),PK([15,45]));const h=hh(t),m=mm(t);return ok(Object.assign({prompt:`Type <b>${QW(t)}</b>.`,tpl:'{A}',text:`words ${Tt(t)}`,explain:m===15?`<p>Quarter past means 15 minutes after ${h}:00.</p><p>It is <b>${Tt(t)}</b>.</p>`:`<p>Quarter to ${NUMW[H12(h+1)]} means 15 minutes <b>before</b> ${H12(h+1)}:00. 60 − 15 = 45.</p><p>It is <b>${Tt(t)}</b>.</p>`,nudge:`<p>A quarter of an hour is 15 minutes. "Past" is after the hour, "to" is before the next hour.</p>`},CK(t)));},
 nameQ:()=>{const t=at(R(1,11),PK([15,45,30]));const h=hh(t),r=QW(t);return choice(ok({prompt:`Which words mean <b>${Tt(t)}</b>?`,tpl:'{A}',text:`name ${Tt(t)}`,explain:`<p>${Tt(t)} is <b>${r}</b>.</p>`,nudge:`<p>:15 is quarter past, :30 is half past, :45 is quarter to the next hour.</p>`}),r,[`quarter past ${NUMW[h]}`,`quarter to ${NUMW[h]}`,`quarter to ${NUMW[H12(h+1)]}`,`half past ${NUMW[h]}`,`quarter past ${NUMW[H12(h+1)]}`].filter(x=>x!==r).slice(0,3));},
 review:()=>readClock(at(R(1,12),PK([0,30]))),
 five:()=>{let m;do{m=5*R(1,11);}while(m===30);return readClock(at(R(1,12),m));},
 hand:()=>{const k=R(1,11);return ok({prompt:`The long hand points to the <b>${k}</b>. How many minutes after the hour is it?`,tpl:'{A} minutes',answer:5*k,text:`hand ${k}`,explain:`<p>Each number on the clock is 5 minutes. Count by 5s ${k} times: <b>${5*k}</b>.</p>`,nudge:`<p>Count by 5s: 1 → 5, 2 → 10, 3 → 15…</p>`,fast:8});},
 handBack:()=>{const t=at(R(1,12),5*R(1,11));return ok({prompt:`It is <b>${Tt(t)}</b>. Which number does the long hand point to?`,tpl:'The {A}',answer:mm(t)/5,text:`handback ${Tt(t)}`,explain:`<p>${mm(t)} minutes ÷ 5 = <b>${mm(t)/5}</b>. Each number is 5 minutes.</p>`,nudge:`<p>Count by 5s until you reach ${mm(t)}. How many jumps?</p>`,fast:10});},
 words5:()=>{const t=at(R(1,12),5*R(1,6));return ok(Object.assign({prompt:`Type the time <b>${mm(t)} minutes after ${NUMW[hh(t)]}</b>.`,tpl:'{A}',text:`after ${Tt(t)}`,explain:`<p>${mm(t)} minutes after ${hh(t)}:00 is <b>${Tt(t)}</b>.</p>`,nudge:`<p>The hour comes first, then the minutes.</p>`},CK(t)));},
 untilHour:()=>{const t=at(R(1,11),5*R(7,11));return ok({prompt:`It is <b>${Tt(t)}</b>. How many minutes until <b>${hh(t)+1}:00</b>?`,tpl:'{A} minutes',answer:60-mm(t),text:`until ${Tt(t)}`,explain:`<p>An hour has 60 minutes. 60 − ${mm(t)} = <b>${60-mm(t)}</b>.</p><p>Or count by 5s from ${mm(t)} up to 60.</p>`,nudge:`<p>Count by 5s from ${mm(t)} up to 60.</p>`});},
 ampm:c=>ampmQ(c),
 later5:()=>{const t=at(R(1,11),5*R(0,11)),d=PK([5,10,15,20,30,10]);return laterQ(t,d);},
 earlier5:()=>{const t=at(R(1,11),5*R(0,11)),d=PK([5,10,15,20,30]);return earlierQ(t,d);},
 spanHours:c=>{const h=R(1,7),d=R(1,4);return (()=>{const m=PK([0,30]);const t1=at(h,m),t2=t1+d*60;const [a,q]=PK(SPANS(c));return st({prompt:`${a} from <b>${Tt(t1)}</b> to <b>${Tt(t2)}</b>. ${q}`,tpl:'{A} hours',answer:d,text:`${a} ${Tt(t1)} ${d}h`,explain:`<p>Count the hours: ${Array.from({length:d+1},(_,i)=>Tt(t1+60*i)).join(' → ')}.</p><p>That is <b>${d}</b> hour${d>1?'s':''}.</p>`,nudge:`<p>Count one hour at a time from ${Tt(t1)}.</p>`});})();},
 spanHalf:c=>{const h=R(1,8),m=PK([0,30]);const d=PK([30,90]);const t1=at(h,m);const [a,q]=PK(SPANS(c));
  if(d===30)return st({prompt:`${a} from <b>${Tt(t1)}</b> to <b>${Tt(t1+30)}</b>. ${q}`,tpl:'{A} minutes',answer:30,alt:[],text:`${a} ${Tt(t1)} 30`,explain:`<p>From ${Tt(t1)} to ${Tt(t1+30)} the long hand goes halfway around: <b>30</b> minutes.</p>`,nudge:`<p>How far does the long hand move?</p>`});
  return st({prompt:`${a} from <b>${Tt(t1)}</b> to <b>${Tt(t1+90)}</b>. ${q}`,tpl:'1 hour and {A} minutes',answer:30,text:`${a} ${Tt(t1)} 90`,explain:`<p>${Tt(t1)} → ${Tt(t1+60)} is 1 hour. ${Tt(t1+60)} → ${Tt(t1+90)} is <b>30</b> minutes.</p>`,nudge:`<p>First count 1 hour from ${Tt(t1)}. How much more?</p>`});},
 startsLasts:c=>actStory(c,at(R(1,10),5*R(0,11)),PK([30,60,120,15,30])),
 twoStep:c=>{const t=at(R(1,9),PK([0,15,30,45]));const d1=PK([30,15,60]),d2=PK([15,30]);const who=PK([
   [`Ms. Rosa puts cookies in the oven at <b>${Tt(t)}</b>. They bake for <b>${dw(d1)}</b>. Then they cool for <b>${dw(d2)}</b>. What time can you eat them?`],
   [`Gizmo starts building a kite at <b>${Tt(t)}</b>. He builds for <b>${dw(d1)}</b>. Then he paints it for <b>${dw(d2)}</b>. What time is the kite done?`],
   [`${c.name} starts homework at <b>${Tt(t)}</b>. Math takes <b>${dw(d1)}</b>. Reading takes <b>${dw(d2)}</b>. What time is homework done?`],
   [`Nana Paws walks the dogs at <b>${Tt(t)}</b> for <b>${dw(d1)}</b>. Then she knits for <b>${dw(d2)}</b>. What time does she stop knitting?`]])[0];
  return st(Object.assign({prompt:who,tpl:'{A}',text:`two ${t} ${d1} ${d2} ${who.slice(0,8)}`,explain:`<p>${Tt(t)} + ${dw(d1)} = ${Tt(t+d1)}.</p><p>${Tt(t+d1)} + ${dw(d2)} = <b>${Tt(t+d1+d2)}</b>.</p>`,nudge:`<p>Add the first part, then the second part.</p>`},CK(t+d1+d2)));}
};
DEF('time',2,[
 [K('readQ',t2.quarter),K('wordsQ',t2.wordsQ),K('name',t2.nameQ),K('read',t2.review),K('which',r6.whichTime('q')),K('hand',t2.hand)],
 [K('read',t2.five),K('hand',t2.hand),K('words',t2.words5),K('hand2',t2.handBack),K('which',r6.whichTime('5')),K('name',t2.nameQ),K('order',r6.order(3))],
 [K('ampm',ampmB),K('read',t2.five),K('until',t2.untilHour),K('hand2',t2.handBack),K('words',t2.words5),K('which',r6.whichTime('5')),K('order',r6.order(3))],
 [K('read',t2.five),K('ampm',r3.t2ap),K('until',t2.untilHour),K('wordsQ',t2.wordsQ),K('name',t2.nameQ),K('which',r6.whichTime('5')),K('order',r6.order(4)),K('words',t2x.sayStory)],
 [K('until',r6.wait2),K('order',r6.order(4,1)),K('read',t2x.clockStory),K('words',t2x.sayStory),K('ampm',r3.t2ap),K('wordsTo',t2x.wordsTo),K('cw',r6.clockWords),K('which',r6.whichTime('5'))]]);

/* ---------- grade 3 ---------- */
const odd=()=>{let m;do{m=R(1,59);}while(m%5===0);return m;};
const t3={
 minute:()=>readClock(at(R(1,12),odd())),
 five:()=>readClock(at(R(1,12),5*R(1,11))),
 past:()=>{const t=at(R(1,12),R(1,29));return ok(Object.assign({prompt:`Type the time <b>${mm(t)} minute${mm(t)>1?'s':''} past ${NUMW[hh(t)]}</b>.`,tpl:'{A}',text:`past ${Tt(t)}`,explain:`<p>${mm(t)} minutes after ${hh(t)}:00 is <b>${Tt(t)}</b>.</p>`,nudge:`<p>"Past" means after the hour.</p>`},CK(t)));},
 to:()=>{const h=R(1,12),k=R(1,29);const t=at(h,0)-k;return ok(Object.assign({prompt:`Type the time <b>${k} minute${k>1?'s':''} to ${NUMW[h]}</b>.`,tpl:'{A}',text:`to ${k} ${h}`,explain:`<p>"${k} minutes to ${NUMW[h]}" is ${k} minutes <b>before</b> ${h}:00.</p><p>60 − ${k} = ${60-k}, in the hour before: <b>${Tt(t)}</b>.</p>`,nudge:`<p>"To" means before the hour. Count back ${k} minutes from ${h}:00.</p>`},CK(t)));},
 elWithin:c=>{const h=R(1,10),m1=R(0,30),d=R(8,59-m1);const t1=at(h,m1);return Math.random()<.5?spanStory(c,t1,t1+d):ok({prompt:`How many minutes from <b>${Tt(t1)}</b> to <b>${Tt(t1+d)}</b>?`,tpl:'{A} minutes',answer:d,text:`el ${Tt(t1)} ${d}`,explain:exEl(t1,t1+d),nudge:`<p>Same hour, so subtract the minutes.</p>`});},
 laterWithin:()=>{const t=at(R(1,12),R(0,35));const d=R(6,59-mm(t));return laterQ(t,d);},
 laterCross:()=>{const t=at(R(1,11),R(35,58));const d=R(62-mm(t),55);return laterQ(t,d);},
 elCross:c=>{const t1=at(R(1,10),R(30,57));const d=R(64-mm(t1),59);return Math.random()<.6?spanStory(c,t1,t1+d):ok({prompt:`How many minutes from <b>${Tt(t1)}</b> to <b>${Tt(t1+d)}</b>?`,tpl:'{A} minutes',answer:d,text:`elc ${Tt(t1)} ${d}`,explain:exEl(t1,t1+d),nudge:`<p>Count up to the next o'clock first, then add the rest.</p>`});},
 laterStory:c=>{const t=at(R(1,10),R(30,58));return actStory(c,t,R(62-mm(t),55));},
 earlier:()=>{const t=at(R(2,12),R(0,30));const d=R(mm(t)+3,58);return earlierQ(t,d);},
 earlierStory:c=>{const t=at(R(2,11),R(0,40));return endStory(c,t,R(Math.max(10,mm(t)+3),59));},
 sched:c=>{const t=at(R(1,9),R(0,59));const d1=5*R(3,9),d2=5*R(2,Math.floor((90-d1)/5));const S=PK([
   [`Gizmo starts building a robot at <b>${Tt(t)}</b>. He works for <b>${d1} minutes</b>, then paints it for <b>${d2} minutes</b>. What time is he done?`],
   [`Coach Flex starts practice at <b>${Tt(t)}</b>. He runs laps for <b>${d1} minutes</b>, then does push-ups for <b>${d2} minutes</b>. What time does practice end?`],
   [`Ms. Rosa starts baking at <b>${Tt(t)}</b>. Muffins take <b>${d1} minutes</b>. Then a pie takes <b>${d2} minutes</b>. What time is she done?`],
   [`Dr. Quartz starts his lab work at <b>${Tt(t)}</b>. He grows crystals for <b>${d1} minutes</b> and cleans up for <b>${d2} minutes</b>. What time is he done?`],
   [`${c.name} gets on Ozzy's train at <b>${Tt(t)}</b>. The ride is <b>${d1} minutes</b>. Then ${c.name} walks <b>${d2} minutes</b> to the lake. What time does ${c.name} get to the lake?`]])[0];
  return st(Object.assign({prompt:S,tpl:'{A}',text:`sched ${t} ${d1} ${d2}`,explain:`<p>${d1} + ${d2} = ${d1+d2} minutes in all.</p>`+exLater(t,d1+d2).replace(/^<p>Start at [^<]*<\/p>/,`<p>Start at ${Tt(t)}.</p>`)+TYPE(t+d1+d2),nudge:`<p>Add the two times together first, then count forward from ${Tt(t)}.</p>`},CK(t+d1+d2)));},
 compare:c=>{const s1=at(R(1,4),R(0,40)),d1=R(20,55),s2=s1+R(5,25),d2=d1+R(5,25);const [A,B]=SH([['Gizmo','fixes gadgets'],['Ms. Rosa','bakes'],['Nana Paws','knits'],['Coach Flex','jumps rope'],['Skyla','flies']]).slice(0,2);
  return st({prompt:`${A[0]} ${A[1]} from <b>${Tt(s1)}</b> to <b>${Tt(s1+d1)}</b>. ${B[0]} ${B[1]} from <b>${Tt(s2)}</b> to <b>${Tt(s2+d2)}</b>. How many minutes longer does ${B[0]} spend?`,tpl:'{A} minutes longer',answer:d2-d1,text:`cmp ${s1} ${d1} ${s2} ${d2}`,explain:`<p>${A[0]}: ${Tt(s1)} → ${Tt(s1+d1)} is ${d1} minutes.</p><p>${B[0]}: ${Tt(s2)} → ${Tt(s2+d2)} is ${d2} minutes.</p><p>${d2} − ${d1} = <b>${d2-d1}</b></p>`,nudge:`<p>Find how long each one takes, then subtract.</p>`,fast:30});},
 latest:c=>{const due=at(R(3,8),PK([0,15,30,45]));const d1=R(10,40),d2=R(10,40);const [who,a,b,goal]=PK([[`${c.name}`,'Packing a bag takes','The walk to the train takes','must catch Ozzy\'s train at'],['Ms. Rosa','Mixing the batter takes','Baking takes','wants muffins ready by'],['Gizmo','Charging the batteries takes','Testing the gadget takes','must show his gadget at']]);
  return st(Object.assign({prompt:`${who} ${goal} <b>${Tt(due)}</b>. ${a} <b>${d1} minutes</b>. ${b} <b>${d2} minutes</b>. What is the latest time to start?`,tpl:'{A}',text:`latest ${due} ${d1} ${d2} ${who}`,explain:`<p>${d1} + ${d2} = ${d1+d2} minutes in all. Count back from ${Tt(due)}.</p>`+exEarlier(due,d1+d2).replace(/^<p>Start[^<]*<\/p>/,'')+TYPE(due-d1-d2),nudge:`<p>Add the two parts, then count <b>back</b> from ${Tt(due)}.</p>`},CK(due-d1-d2)));}
};
DEF('time',3,[
 [t3.minute,t3.past,t3.to,t3.five],
 [t3.elWithin,t3.laterWithin,t3.minute,t3.to],
 [t3.laterCross,t3.elCross,t3.laterStory,t3.minute],
 [t3.earlier,t3.earlierStory,t3.elCross,t3.laterCross,t3.to,caFinish(15,45)],
 [t3.sched,t3.compare,t3.latest,t3.earlierStory,t3.laterStory,caFinish(25,55),r3.t3two,r3.t3mist]]);

/* ---------- grade 4 ---------- */
const t4={
 h2m:()=>{const h=R(2,12);return ok({prompt:'Change hours to minutes.',tpl:`${h} hours = {A} minutes`,answer:h*60,text:`${h}h`,explain:`<p>1 hour = 60 minutes.</p><p>${h} × 60 = <b>${h*60}</b></p>`,nudge:`<p>Each hour is 60 minutes.</p>`});},
 m2s:()=>{const m=R(2,10);return ok({prompt:'Change minutes to seconds.',tpl:`${m} minutes = {A} seconds`,answer:m*60,text:`${m}min`,explain:`<p>1 minute = 60 seconds.</p><p>${m} × 60 = <b>${m*60}</b></p>`,nudge:`<p>Each minute is 60 seconds.</p>`});},
 m2h:()=>{const h=R(2,10);return ok({prompt:'Change minutes to hours.',tpl:`${h*60} minutes = {A} hours`,answer:h,text:`${h*60}m→h`,explain:`<p>60 minutes make 1 hour.</p><p>${h*60} ÷ 60 = <b>${h}</b></p>`,nudge:`<p>How many 60s are in ${h*60}?</p>`});},
 hmMin:()=>{const h=R(1,3),m=5*R(1,11);return ok({prompt:'Change to minutes.',tpl:`${h} h ${m} min = {A} minutes`,answer:h*60+m,text:`${h}h${m}`,explain:`<p>${h} h = ${h*60} min.</p><p>${h*60} + ${m} = <b>${h*60+m}</b></p>`,nudge:`<p>Change the hours to minutes first, then add.</p>`});},
 msSec:()=>{const m=R(1,5),s=5*R(1,11);return ok({prompt:'Change to seconds.',tpl:`${m} min ${s} s = {A} seconds`,answer:m*60+s,text:`${m}m${s}s`,explain:`<p>${m} min = ${m*60} s.</p><p>${m*60} + ${s} = <b>${m*60+s}</b></p>`,nudge:`<p>Change the minutes to seconds first, then add.</p>`});},
 tripEnd:c=>{const t=at(R(6,10),5*R(0,11)),d=60*R(1,3)+5*R(1,11);const [a,b,q]=PK(ACTS(c).filter((_,i)=>i!==0));return st(Object.assign({prompt:`${a} at <b>${Tt(t)}</b>. ${b} <b>${d>=60?dw(d):d+' minutes'}</b>. ${q}`,tpl:'{A}',text:`trip ${t} ${d} ${a}`,explain:exLater(t,d)+TYPE(t+d),nudge:`<p>Add the hours first, then the minutes.</p>`},CK(t+d)));},
 elHM:c=>{const t1=at(R(7,10),5*R(1,11));let d;do{d=R(70,170);}while(d%60<10||d%60>50);const t2=t1+d-(d%5);return spanStory(c,t1,t2);},
 m2hm:()=>{const h=R(2,4),m=R(5,55);const tot=h*60+m;return Math.random()<.65?ok({prompt:'Change to hours and minutes.',tpl:`${tot} minutes = ${h} h {A} min`,answer:m,text:`${tot}→hm`,explain:`<p>${h} hour${h>1?'s':''} = ${h*60} minutes.</p><p>${tot} − ${h*60} = <b>${m}</b></p>`,nudge:`<p>Take away the minutes in ${h} hour${h>1?'s':''} (${h} × 60).</p>`})
  :ok({prompt:'Change to hours and minutes.',tpl:`${tot} minutes = {A} h ${m} min`,answer:h,text:`${tot}→h`,explain:`<p>${tot} − ${m} = ${h*60} minutes. ${h*60} ÷ 60 = <b>${h}</b> hours.</p>`,nudge:`<p>How many full 60s fit in ${tot}?</p>`});},
 s2ms:()=>{const m=R(1,6),s=R(5,55);const tot=m*60+s;return ok({prompt:'Change to minutes and seconds.',tpl:`${tot} seconds = ${m} min {A} s`,answer:s,text:`${tot}s`,explain:`<p>${m} minute${m>1?'s':''} = ${m*60} seconds.</p><p>${tot} − ${m*60} = <b>${s}</b></p>`,nudge:`<p>Take away ${m} × 60 seconds.</p>`});},
 cmp:()=>{const h=R(1,2),m=5*R(1,11);const a=h*60+m;const b=a+PK([-15,-10,-5,0,5,10,20]);const r=b>a?'&lt;':b<a?'&gt;':'=';
  return choice(ok({prompt:'Compare the times.',tpl:`${h} h ${m} min {A} ${b} minutes`,text:`cmp ${a} ${b}`,explain:`<p>${h} h ${m} min = ${h*60} + ${m} = ${a} minutes.</p><p>${a} ${r} ${b}, so the answer is <b>${r}</b>.</p>`,nudge:`<p>Change ${h} h ${m} min to minutes first.</p>`}),r,['&lt;','&gt;','=']);},
 days:()=>{const k=PK([0,2,4]);
  if(k===0){const w=R(2,9);return ok({prompt:'Change weeks to days.',tpl:`${w} weeks = {A} days`,answer:w*7,text:`${w}wk`,explain:`<p>1 week = 7 days. ${w} × 7 = <b>${w*7}</b></p>`,nudge:`<p>A week has 7 days.</p>`});}
  if(k===1){const d=R(2,5);return ok({prompt:'Change days to hours.',tpl:`${d} days = {A} hours`,answer:d*24,text:`${d}d`,explain:`<p>1 day = 24 hours. ${d} × 24 = <b>${d*24}</b></p>`,nudge:`<p>A day has 24 hours.</p>`});}
  if(k===2){const w=R(1,5),d=R(1,6);return ok({prompt:'Change to days.',tpl:`${w} week${w>1?'s':''} ${d} day${d>1?'s':''} = {A} days`,answer:w*7+d,text:`${w}w${d}d`,explain:`<p>${w} × 7 = ${w*7} days.</p><p>${w*7} + ${d} = <b>${w*7+d}</b></p>`,nudge:`<p>Change the weeks to days first, then add.</p>`});}
  if(k===3){const d=R(2,5);return ok({prompt:'Change hours to days.',tpl:`${d*24} hours = {A} days`,answer:d,text:`${d*24}h→d`,explain:`<p>24 hours = 1 day. ${d*24} ÷ 24 = <b>${d}</b></p>`,nudge:`<p>How many 24s are in ${d*24}?</p>`});}
  const w=R(2,8);return ok({prompt:'Change days to weeks.',tpl:`${w*7} days = {A} weeks`,answer:w,text:`${w*7}d→w`,explain:`<p>7 days = 1 week. ${w*7} ÷ 7 = <b>${w}</b></p>`,nudge:`<p>How many 7s are in ${w*7}?</p>`});},
 daysStory:c=>{const k=R(0,2);
  if(k===0){const w=R(2,4),x=R(2,6);return st({prompt:`Dr. Quartz is growing a crystal. It needs <b>${w} weeks</b> and <b>${x} days</b> to grow. How many days is that?`,tpl:'{A} days',answer:w*7+x,text:`crystal ${w} ${x}`,explain:`<p>${w} weeks = ${w} × 7 = ${w*7} days.</p><p>${w*7} + ${x} = <b>${w*7+x}</b> days</p>`,nudge:`<p>Each week is 7 days.</p>`});}
  if(k===1){const d=R(2,4);return st({prompt:`Skyla flies south. Her trip takes <b>${d} days</b>, day and night. How many hours is that?`,tpl:'{A} hours',answer:d*24,text:`skyla ${d}`,explain:`<p>1 day = 24 hours. ${d} × 24 = <b>${d*24}</b></p>`,nudge:`<p>Each day is 24 hours.</p>`});}
  const w=R(2,5),per=R(2,4);return st({prompt:`Nana Paws knits <b>${per} scarves</b> every week. How many scarves does she knit in <b>${w*7} days</b>?`,tpl:'{A} scarves',answer:w*per,text:`knit ${w} ${per}`,explain:`<p>${w*7} days = ${w*7} ÷ 7 = ${w} weeks.</p><p>${w} × ${per} = <b>${w*per}</b> scarves</p>`,nudge:`<p>First find how many weeks ${w*7} days is.</p>`});},
 batches:c=>{const t=at(R(1,9),5*R(0,11)),n=R(3,4),b=5*R(4,7);return st(Object.assign({prompt:`Ms. Rosa starts baking at <b>${Tt(t)}</b>. She bakes <b>${n} batches</b> of muffins, one after another. Each batch takes <b>${b} minutes</b>. What time is she done?`,tpl:'{A}',text:`batches ${t} ${n} ${b}`,explain:`<p>${n} × ${b} = ${n*b} minutes = ${dw(n*b)}.</p>`+exLater(t,n*b)+TYPE(t+n*b),nudge:`<p>Step 1: total time = ${n} × ${b}. Step 2: count forward from ${Tt(t)}.</p>`},CK(t+n*b)));},
 legs:c=>{const a=5*R(5,11),b=5*R(5,11),w=5*R(2,5);const tot=a+b+w;if(tot%60===0)return t4.legs(c);return st({prompt:`Ozzy's train ride has two parts. The first part is <b>${a} minutes</b>. Then the train waits <b>${w} minutes</b> at the Depot. The second part is <b>${b} minutes</b>. How long is the whole trip?`,tpl:`${Math.floor(tot/60)} h {A} min`,answer:tot%60,text:`legs ${a} ${w} ${b}`,explain:`<p>${a} + ${w} + ${b} = ${tot} minutes.</p><p>${tot} − ${Math.floor(tot/60)*60} = <b>${tot%60}</b>, so it is ${Math.floor(tot/60)} h ${tot%60} min.</p>`,nudge:`<p>Add all three parts, then take out the full hours.</p>`,fast:30});},
 movie:c=>{const t=at(R(1,7),5*R(0,11)),d=60+5*R(4,11),br=5*R(2,4);return st(Object.assign({prompt:`${c.name} and the Elder Wiz watch a movie that starts at <b>${Tt(t)}</b>. It is <b>${dw(d)}</b> long. After it ends, they talk about it for <b>${br} minutes</b>. What time do they stop talking?`,tpl:'{A}',text:`movie ${t} ${d} ${br}`,explain:`<p>Movie + talking = ${d} + ${br} = ${d+br} minutes.</p>`+exLater(t,d+br)+TYPE(t+d+br),nudge:`<p>Add the movie time and the talking time, then count forward.</p>`},CK(t+d+br)));},
 plank:c=>{const n=R(3,5),s=PK([45,60,90]),r=PK([15,20,30]);const tot=n*s+(n-1)*r;return st({prompt:`Coach Flex holds a plank for <b>${s} seconds</b>, <b>${n} times</b>. He rests <b>${r} seconds</b> between planks (not after the last one). How many seconds is that in all?`,tpl:'{A} seconds',answer:tot,text:`plank ${n} ${s} ${r}`,explain:`<p>Planks: ${n} × ${s} = ${n*s} s.</p><p>Rests: there are ${n-1} rests, ${n-1} × ${r} = ${(n-1)*r} s.</p><p>${n*s} + ${(n-1)*r} = <b>${tot}</b> seconds</p>`,nudge:`<p>Careful: with ${n} planks there are only ${n-1} rests in between.</p>`,fast:35});}
};
DEF('time',4,[
 [t4.h2m,t4.m2s,t4.m2h,t4.hmMin],
 [t4.tripEnd,K('fromto',t4.elHM),t4.hmMin,t4.msSec,t4.m2h,r6.startHM,r6.secCmp],
 [t4.m2hm,t4.s2ms,t4.cmp,t4.tripEnd,K('fromto',t4.elHM)],
 [t4.days,t4.daysStory,t4.m2hm,K('fromto',t4.elHM),t4.cmp,caFinish(60,150),r6.startHM,r6.secCmp],
 [t4.batches,t4.legs,t4.movie,t4.plank,t4x.dogs,t4x.oven,t4x.trip,t4x.laps,t4x.read]]);

/* ---------- grade 5 ---------- */
const t5={
 hm:()=>{const h=R(2,5),m=R(5,55);return ok({prompt:'Change to minutes.',tpl:`${h} h ${m} min = {A} min`,answer:h*60+m,text:`${h}h${m}`,explain:`<p>${h} × 60 = ${h*60}.</p><p>${h*60} + ${m} = <b>${h*60+m}</b></p>`,nudge:`<p>Hours to minutes first (× 60), then add.</p>`});},
 ms:()=>{const m=R(2,9),s=R(5,55);return ok({prompt:'Change to seconds.',tpl:`${m} min ${s} s = {A} s`,answer:m*60+s,text:`${m}m${s}`,explain:`<p>${m} × 60 = ${m*60}.</p><p>${m*60} + ${s} = <b>${m*60+s}</b></p>`,nudge:`<p>Minutes to seconds first (× 60), then add.</p>`});},
 dh:()=>{const d=R(1,4),h=R(1,23);return ok({prompt:'Change to hours.',tpl:`${d} day${d>1?'s':''} ${h} h = {A} hours`,answer:d*24+h,text:`${d}d${h}`,explain:`<p>${d} × 24 = ${d*24}.</p><p>${d*24} + ${h} = <b>${d*24+h}</b></p>`,nudge:`<p>Each day is 24 hours.</p>`});},
 hs:()=>{const k=R(0,2);
  if(k===0){const h=R(1,2);return ok({prompt:'Two steps: hours → minutes → seconds.',tpl:`${h} hour${h>1?'s':''} = {A} seconds`,answer:h*3600,text:`${h}h→s`,explain:`<p>${h} h = ${h*60} minutes.</p><p>${h*60} × 60 = <b>${N(h*3600)}</b> seconds</p>`,nudge:`<p>First change to minutes, then to seconds.</p>`});}
  if(k===1){const d=R(1,3);return ok({prompt:'Two steps: days → hours → minutes.',tpl:`${d} day${d>1?'s':''} = {A} minutes`,answer:d*1440,text:`${d}d→m`,explain:`<p>${d} day${d>1?'s':''} = ${d*24} hours.</p><p>${d*24} × 60 = <b>${N(d*1440)}</b> minutes</p>`,nudge:`<p>First change to hours (× 24), then to minutes (× 60).</p>`});}
  const w=R(1,4);return ok({prompt:'Two steps: weeks → days → hours.',tpl:`${w} week${w>1?'s':''} = {A} hours`,answer:w*168,text:`${w}w→h`,explain:`<p>${w} week${w>1?'s':''} = ${w*7} days.</p><p>${w*7} × 24 = <b>${w*168}</b> hours</p>`,nudge:`<p>First change to days (× 7), then to hours (× 24).</p>`});},
 noonEl:c=>{const t1=at(R(9,11),5*R(1,11)),t2=at(R(12,14),5*R(1,11));if(t2-t1<40||t1===720||t2===720)return t5.noonEl(c);const [a,q]=PK(SPANS(c));
  return st({prompt:`${a} from <b>${lab(t1)}</b> to <b>${lab(t2)}</b>. ${q}`,tpl:'{A} minutes',answer:t2-t1,text:`noon ${t1} ${t2} ${a}`,explain:exEl(t1,t2,1),nudge:`<p>Count up to noon first, then add the time after noon.</p>`});},
 noonEnd:c=>{let t,d;do{t=at(R(9,11),5*R(0,11));d=60*R(1,2)+5*R(1,11);}while(t+d<=730||t===720);const [a,b,q]=PK(ACTS(c).filter((_,i)=>i!==0));
  return st(Object.assign({prompt:`${a} at <b>${lab(t)}</b>. ${b} <b>${dw(d)}</b>. ${q}`,tpl:'{A} p.m.',text:`noonEnd ${t} ${d} ${a}`,explain:exLater(t,d).replace(/<b>([^<]*)<\/b>\.<\/p>$/,`<b>$1 p.m.</b> (it passed noon).</p>`)+TYPE(t+d),nudge:`<p>Count forward. After 12:59 the clock goes to 1:00, and it is p.m. now.</p>`},CK(t+d)));},
 apCross:c=>{const night=Math.random()<.4;let t,d;if(night){t=at(R(21,23),5*R(0,11));d=60*R(1,4)+5*R(0,11);}else{t=at(R(9,11),5*R(0,11));d=60*R(0,3)+5*R(1,11);}
  if(t+d===720||t+d===1440)d+=5;const e=t+d;const r=night?(e%1440<720?'a.m.':'p.m.'):AP(e);
  const S=night?`The Elder Wiz starts watching the stars at <b>${lab(t)}</b>. He watches for <b>${dw(d)}</b>.`:`Ozzy's train leaves at <b>${lab(t)}</b>. The ride takes <b>${dw(d)}</b>.`;
  return choice(st({prompt:`${S} Is the end time a.m. or p.m.?`,tpl:`It ends at ${Tt(e)} {A}`,text:`ap ${t} ${d}`,explain:`<p>${lab(t)} + ${dw(d)} = ${Tt(e)}.</p><p>${night?(e>=1440?'It passed midnight, so it is a.m. again.':'It did not reach midnight, so it is still p.m.'):(e>=720?'It passed noon, so it is p.m.':'It did not reach noon, so it is still a.m.')} The answer is <b>${r}</b>.</p>`,nudge:`<p>${night?'Does it pass midnight?':'Does it pass noon?'}</p>`}),r,[r==='a.m.'?'p.m.':'a.m.']);},
 frac:()=>{const L=[[3,4,60],[1,4,60],[2,3,60],[1,3,60],[1,5,60],[2,5,60],[3,5,60],[5,6,60],[1,6,60],[1,10,60],[3,10,60],[7,10,60],[1,12,60],[5,12,60]];const [a,b]=PK(L);
  return ok({prompt:'How many minutes?',tpl:`${F(a,b)} hour = {A} minutes`,answer:60*a/b,text:`${a}/${b}h`,explain:`<p>${F(1,b)} of 60 = 60 ÷ ${b} = ${60/b}.</p><p>${F(a,b)} = ${a} × ${60/b} = <b>${60*a/b}</b> minutes</p>`,nudge:`<p>Find ${F(1,b)} of 60 minutes first.</p>`});},
 fracMixed:()=>{const w=R(1,3),[a,b]=PK([[1,2],[1,4],[3,4],[1,3],[2,3],[1,6]]);return ok({prompt:'How many minutes?',tpl:`${w} ${F(a,b)} hours = {A} minutes`,answer:w*60+60*a/b,text:`${w} ${a}/${b}h`,explain:`<p>${w} hour${w>1?'s':''} = ${w*60} min. ${F(a,b)} hour = ${60*a/b} min.</p><p>${w*60} + ${60*a/b} = <b>${w*60+60*a/b}</b></p>`,nudge:`<p>Do the whole hours and the fraction separately.</p>`});},
 fracDay:()=>{const [a,b]=PK([[1,4],[3,4],[1,3],[2,3],[1,6],[5,6],[1,8],[3,8],[1,2],[5,8],[1,12]]);return ok({prompt:'How many hours?',tpl:`${F(a,b)} of a day = {A} hours`,answer:24*a/b,text:`${a}/${b}d`,explain:`<p>A day is 24 hours. 24 ÷ ${b} = ${24/b}.</p><p>${a} × ${24/b} = <b>${24*a/b}</b></p>`,nudge:`<p>Find ${F(1,b)} of 24 first.</p>`});},
 fracMin:()=>{const [a,b]=PK([[1,4],[3,4],[1,3],[2,3],[1,5],[4,5],[1,6],[5,6],[1,10],[1,12]]);return ok({prompt:'How many seconds?',tpl:`${F(a,b)} minute = {A} seconds`,answer:60*a/b,text:`${a}/${b}m`,explain:`<p>60 ÷ ${b} = ${60/b}. ${a} × ${60/b} = <b>${60*a/b}</b></p>`,nudge:`<p>A minute is 60 seconds. Find ${F(1,b)} of 60.</p>`});},
 decH:()=>{const v=PK([15,25,75,125,150,175,225,250,275,350,20,40,80,120,130,260,110,320]);const shown=String(v/100);const minutes=v*60/100;const w=Math.floor(v/100),f=v%100;
  return ok({prompt:'How many minutes?',tpl:`${shown} hours = {A} minutes`,answer:minutes,text:`${shown}h`,explain:`<p>${w?`${w} hour${w>1?'s':''} = ${w*60} minutes. `:''}${String(f/100)} hour = ${String(f/100)} × 60 = ${f*60/100} minutes.</p><p>${w?`${w*60} + ${f*60/100} = `:''}<b>${minutes}</b> minutes</p>`,nudge:`<p>0.5 hour is half of 60 minutes. 0.1 hour is 6 minutes.</p>`});},
 min2dec:()=>{const m=PK([90,150,210,270,45,75,105,135,165,195,18,24,36,42,54,66,78,84]);const o=ok({prompt:'Write the hours as a decimal.',tpl:`${m} minutes = {A} hours`,text:`${m}→dec`,explain:`<p>Divide by 60: ${m} ÷ 60 = <b>${(m/60).toString()}</b> hours.</p>`,nudge:`<p>30 min = 0.5 hour, 15 min = 0.25 hour, 6 min = 0.1 hour.</p>`});
  const v=Math.round(m/60*100);return DEC(o,v%10===0?v/10:v,v%10===0?1:2);},
 table:(c,K)=>{const k=K!=null?K:R(0,3);
  if(k===0){const t1=at(R(6,10),5*R(0,11)),d=R(70,170);const t2=t1+d-(d%5);if(t2>=720&&t1<720&&t2===720)return t5.table(c,K);const D2=t2-t1;
   return st({prompt:`<b>Train timetable</b><br>🚂 Leaves Pebble Hill: <b>${lab(t1)}</b><br>🚂 Arrives Crystal Lake: <b>${lab(t2)}</b><br>How long is the ride?`,tpl:'{A} minutes',answer:D2,text:`tt ${t1} ${t2}`,explain:exEl(t1,t2,1),nudge:`<p>Count up to the next o'clock, then whole hours, then the rest.</p>`,fast:30});}
  if(k===1){const t=at(R(6,8),5*R(0,11)),g=5*R(4,9),n=R(4,6);const e=t+(n-1)*g;const L=e<720?'a.m.':'p.m.';if(e===720)return t5.table(c,K);
   return st(Object.assign({prompt:`Ozzy's trains leave the Depot every <b>${g} minutes</b>. The first train leaves at <b>${lab(t)}</b>. What time does the <b>${['','','2nd','3rd','4th','5th','6th'][n]} train</b> leave?`,tpl:`{A} ${L}`,text:`every ${t} ${g} ${n}`,explain:`<p>The ${n}th train comes after ${n-1} gaps (not ${n}!): ${n-1} × ${g} = ${(n-1)*g} minutes.</p>`+exLater(t,(n-1)*g)+TYPE(e),nudge:`<p>Train 1 is at the start. Train 2 is 1 gap later. How many gaps until train ${n}?</p>`,fast:35},CK(e)));}
  if(k===2){let t,d;do{t=at(11,5*R(0,11));d=60+5*R(1,11);}while(t+d===720);const e=t+d;
   return st(Object.assign({prompt:`A train leaves Crystal Lake at <b>${lab(t)}</b>. The trip to Pebble Hill takes <b>${dw(d)}</b>. What time does it arrive?`,tpl:`{A} ${AP(e)}`,text:`arr ${t} ${d}`,explain:exLater(t,d)+`<p>It passed noon, so it is p.m.</p>`+TYPE(e),nudge:`<p>Add the hour, then the minutes. Watch out for noon!</p>`,fast:30},CK(e)));}
  let t1,r1,w,r2;do{t1=at(R(9,10),5*R(0,11));r1=5*R(6,11);w=5*R(2,5);r2=5*R(6,13);}while(t1+r1+w+r2<=725||(t1+r1+w+r2)%720===0);const e=t1+r1+w+r2;
  return st(Object.assign({prompt:`${c.name} takes a train at <b>${lab(t1)}</b>. The ride is <b>${r1} minutes</b>. ${c.name} waits <b>${w} minutes</b> for a second train. The second ride is <b>${dw(r2)}</b>. What time does ${c.name} arrive?`,tpl:`{A} ${AP(e)}`,text:`2tr ${t1} ${r1} ${w} ${r2}`,explain:`<p>${r1} + ${w} + ${r2} = ${r1+w+r2} minutes.</p>`+exLater(t1,r1+w+r2)+TYPE(e),nudge:`<p>Add all three times, then count forward from ${lab(t1)}.</p>`,fast:40},CK(e)));}
};
DEF('time',5,[
 [t5.hm,t5.ms,K('dh',t5.dh),t5.hs,r6.wkd,r6.m2hm5,r6.s2min],
 [t5.noonEl,t5.noonEnd,t5x.apEnd,t5x.apPick,t5.hm],
 [t5.frac,t5.fracMixed,t5.fracDay,t5.fracMin,t5.noonEl],
 [r4.decH10,K('m2d',t5.min2dec),t5.fracDay,t5.noonEnd,t5x.apPick,t5.fracMin,caFinish(60,150,1)],
 [c=>t5.table(c,0),c=>t5.table(c,1),c=>t5.table(c,2),c=>t5.table(c,3),t5x.apEnd,K('m2d',t5.min2dec),t5.noonEl,caFinish(90,170,1)]]);

/* =================================== 📏 MEASURE MESA =================================== */
const SQ=u=>`square ${u}`;
const m3={
 arr:()=>{const r=R(2,5),c=R(3,7);return ok({vis:{t:'array',r,c,e:'🟦'},prompt:'Each 🟦 is <b>1 square unit</b>. What is the area of the shape?',tpl:'{A} square units',answer:r*c,text:`arr ${r}x${c}`,explain:`<p>There are ${r} rows with ${c} squares in each row.</p><p>${r} × ${c} = <b>${r*c}</b> square units</p>`,nudge:`<p>Count the squares in one row, then skip-count for each row.</p>`});},
 tiles:c=>{const r=R(3,8),k=R(3,9);const [who,where]=PK([['Dr. Quartz','his lab floor'],['Ms. Rosa','the café floor'],['Gizmo','his workshop wall'],['Nana Paws','her kitchen floor'],[c.name,'a play mat']]);
  return st({prompt:`${who} covers ${where} with square tiles, with no gaps. It takes <b>${r} rows</b> of <b>${k} tiles</b>. What is the area?`,tpl:'{A} square units',answer:r*k,text:`tiles ${r} ${k} ${who}`,explain:`<p>Each tile is 1 square unit. ${r} rows × ${k} tiles = <b>${r*k}</b>.</p>`,nudge:`<p>Area = how many squares cover it. Rows × tiles in each row.</p>`,fast:20});},
 lshape:()=>{const a=R(4,7),b=R(2,a-1),k=R(2,3);const rows=k===2?[a,b]:[a,b,R(1,b)];const tot=sum(rows);return ok({prompt:`A shape is made of unit squares:<br>${rows.map(n=>'🟦'.repeat(n)).join('<br>')}<br>What is its area?`,tpl:'{A} square units',answer:tot,text:`L ${rows}`,explain:`<p>Add the rows: ${rows.join(' + ')} = <b>${tot}</b> square units.</p>`,nudge:`<p>Count the squares in each row, then add.</p>`});},
 cmpA:()=>{let a,b,c2,d;do{a=R(2,6);b=R(2,7);c2=R(2,6);d=R(2,7);}while(a===c2&&b===d);const A=a*b,B=c2*d;const r=A>B?'A':A<B?'B':'Same';
  return choice(ok({prompt:(([x,y])=>`${x} A is ${a} squares by ${b} squares. ${x} B is ${c2} squares by ${d} squares. Which ${y} has more area?`)(PK([['Rug','rug'],['Poster','poster'],['Garden','garden'],['Blanket','blanket'],['Window','window']])),tpl:'{A}',text:`cmp ${a}${b}${c2}${d}`,explain:`<p>A: ${a} × ${b} = ${A}. B: ${c2} × ${d} = ${B}.</p><p>The answer is <b>${r}</b>.</p>`,nudge:`<p>Find the area of each rug (rows × columns), then compare.</p>`}),r,['A','B','Same']);},
 rect:()=>{const l=R(3,9),w=R(2,8),u=PK(['cm','m','in','ft']);return ok({vis:{t:'rect',top:`${l} ${u}`,side:`${w} ${u}`},prompt:'Find the area of the rectangle.',tpl:`{A} square ${u}`,answer:l*w,text:`area ${l} ${w} ${u}`,explain:`<p>Area = length × width.</p><p>${l} × ${w} = <b>${l*w}</b> square ${u}</p>`,nudge:`<p>Think of rows of squares: ${w} rows of ${l}.</p>`});},
 areaWords:c=>{const l=R(5,10),w=R(2,l-1);const [thing,u]=PK([['rug in the Kind Teacher\'s room','feet'],['garden bed','feet'],['crystal display case','inches'],['dog bed for Nana Paws','feet'],['poster','inches'],['picnic blanket','feet']]);
  return st({prompt:`A ${thing} is <b>${l} ${u}</b> long and <b>${w} ${u}</b> wide. What is its area?`,tpl:`{A} square ${u}`,answer:l*w,text:`aw ${l} ${w} ${thing}`,explain:`<p>${l} × ${w} = <b>${l*w}</b> square ${u}</p>`,nudge:`<p>Area of a rectangle = length × width.</p>`,fast:20});},
 split:()=>{const a=R(3,9),b=R(6,9),p=R(2,b-2);return ok({prompt:`Split ${a===8?'an':'a'} ${a} by ${b} rectangle into two smaller rectangles.`,tpl:`${a} × ${b} = ${a} × ${p} + ${a} × {A}`,answer:b-p,text:`split ${a} ${b} ${p}`,explain:`<p>${b} = ${p} + <b>${b-p}</b>, so the second part is ${a} × ${b-p}.</p><p>${a*p} + ${a*(b-p)} = ${a*b} ✓</p>`,nudge:`<p>${p} + ? = ${b}</p>`});},
 perimArr:()=>{const r=R(2,5),k=R(3,7);return ok({vis:{t:'array',r,c:k,e:'🟦'},prompt:'Each side of a 🟦 is <b>1 unit</b> long. What is the <b>perimeter</b> of the whole rectangle?',tpl:'{A} units',answer:2*(r+k),text:`pa ${r} ${k}`,explain:`<p>Go around the outside: ${k} across the top, ${r} down the side, ${k} across the bottom, ${r} up the other side.</p><p>${k} + ${r} + ${k} + ${r} = <b>${2*(r+k)}</b> units</p>`,nudge:`<p>Count the edges all the way around the <b>outside</b>.</p>`});},
 perim:()=>{const l=R(4,12),w=R(2,9),u=PK(['cm','m','in','ft']);return ok({vis:{t:'rect',top:`${l} ${u}`,side:`${w} ${u}`},prompt:'Find the <b>perimeter</b> (the distance all the way around).',tpl:`{A} ${u}`,answer:2*(l+w),text:`per ${l} ${w} ${u}`,explain:`<p>A rectangle has 2 long sides and 2 short sides.</p><p>${l} + ${w} + ${l} + ${w} = <b>${2*(l+w)}</b> ${u}</p>`,nudge:`<p>Add all 4 sides, not just the 2 you see.</p>`});},
 poly:()=>{const n=R(3,6),u=PK(['cm','in','m']);const sides=Array.from({length:n},()=>R(2,12));const nm=['','','','triangle','shape with 4 sides','pentagon','hexagon'][n];
  return ok({prompt:`A ${nm} has sides of <b>${sides.join(', ')}</b> ${u}. What is its perimeter?`,tpl:`{A} ${u}`,answer:sum(sides),text:`poly ${sides}`,explain:`<p>Add every side: ${sides.join(' + ')} = <b>${sum(sides)}</b> ${u}</p>`,nudge:`<p>Perimeter = all the sides added together.</p>`});},
 square:()=>{const s=R(3,12),u=PK(['cm','in','ft','m']);return ok({prompt:`A square has sides of <b>${s} ${u}</b>. What is its perimeter?`,tpl:`{A} ${u}`,answer:4*s,text:`sq ${s} ${u}`,explain:`<p>A square has 4 equal sides: ${s} × 4 = <b>${4*s}</b> ${u}</p>`,nudge:`<p>How many sides does a square have? Are they all the same?</p>`});},
 fence:c=>{const l=R(5,15),w=R(3,10);const [who,what]=PK([['Nana Paws','a dog yard'],['Ms. Rosa','her herb garden'],['Grumbleroot','his goat pen by the bridge'],['Dr. Quartz','his crystal garden']]);
  return st({prompt:`${who} puts a fence all the way around ${what}. It is a rectangle <b>${l} meters</b> long and <b>${w} meters</b> wide. How many meters of fence?`,tpl:'{A} meters',answer:2*(l+w),text:`fence ${l} ${w} ${who}`,explain:`<p>The fence goes around all 4 sides: ${l} + ${w} + ${l} + ${w} = <b>${2*(l+w)}</b> meters.</p>`,nudge:`<p>A fence around is the <b>perimeter</b>.</p>`});},
 missPoly:()=>{const n=R(4,5),u=PK(['cm','in','m']);const s=Array.from({length:n},()=>R(3,12));const P=sum(s);return ok({prompt:`A shape with ${n} sides has a perimeter of <b>${P} ${u}</b>. ${n-1} of the sides are <b>${s.slice(0,-1).join(', ')}</b> ${u}. How long is the last side?`,tpl:`{A} ${u}`,answer:s[n-1],text:`mp ${s}`,explain:`<p>Add the sides you know: ${s.slice(0,-1).join(' + ')} = ${P-s[n-1]}.</p><p>${P} − ${P-s[n-1]} = <b>${s[n-1]}</b> ${u}</p>`,nudge:`<p>Add the sides you know, then take that away from ${P}.</p>`});},
 missA:()=>{const l=R(3,10),w=R(2,9);return ok({vis:{t:'rect',top:`${l} ft`,side:'? ft'},prompt:`The area is <b>${l*w} square feet</b>. The length is ${l} feet. How wide is it?`,tpl:'{A} feet',answer:w,text:`missA ${l} ${w}`,explain:`<p>${l} × ? = ${l*w}</p><p>${l*w} ÷ ${l} = <b>${w}</b></p>`,nudge:`<p>Area = length × width. ${l} times what is ${l*w}?</p>`});},
 missP:()=>{const l=R(5,14),w=R(2,l-1);const P=2*(l+w);return ok({vis:{t:'rect',top:`${l} m`,side:'? m'},prompt:`The perimeter is <b>${P} meters</b>. The length is ${l} meters. How wide is it?`,tpl:'{A} meters',answer:w,text:`missP ${l} ${w}`,explain:`<p>The two long sides: ${l} + ${l} = ${2*l}.</p><p>${P} − ${2*l} = ${P-2*l} for the two short sides. ${P-2*l} ÷ 2 = <b>${w}</b></p>`,nudge:`<p>Take away both long sides from ${P}, then split the rest in half.</p>`});},
 same:()=>{const pairs=[[[1,12],[3,4]],[[2,12],[4,6]],[[2,9],[3,6]],[[1,16],[4,4]],[[2,10],[4,5]],[[1,18],[3,6]],[[2,8],[4,4]],[[1,20],[4,5]],[[3,8],[4,6]],[[2,6],[3,4]]];const [p,q]=SH(PK(pairs));
  if(Math.random()<.5){const PA=2*(p[0]+p[1]),PB=2*(q[0]+q[1]);const r=PA>PB?'A':'B';return choice(ok({prompt:`Pen A is ${p[0]} m by ${p[1]} m. Pen B is ${q[0]} m by ${q[1]} m. They have the <b>same area</b> (${p[0]*p[1]} square meters). Which one needs <b>more fence</b>?`,tpl:'{A}',text:`same ${p}${q}`,explain:`<p>Fence = perimeter. A: ${p[0]} + ${p[1]} + ${p[0]} + ${p[1]} = ${PA} m. B: ${q[0]} + ${q[1]} + ${q[0]} + ${q[1]} = ${PB} m.</p><p><b>${r}</b> needs more. Long, skinny shapes have bigger perimeters!</p>`,nudge:`<p>Find the perimeter of each pen.</p>`}),r,['A','B','Same']);}
  const s=R(4,8),a=R(1,s-2);const A=[s,s],B=[s-a,s+a];const r='A';return choice(ok({prompt:`Garden A is ${A[0]} m by ${A[1]} m. Garden B is ${B[0]} m by ${B[1]} m. Both have a perimeter of ${4*s} m. Which has <b>more area</b>?`,tpl:'{A}',text:`samep ${s} ${a}`,explain:`<p>A: ${s} × ${s} = ${s*s}. B: ${B[0]} × ${B[1]} = ${B[0]*B[1]}.</p><p><b>A</b> has more area.</p>`,nudge:`<p>Find the area of each garden.</p>`}),r,['B','Same']);},
 comp:c=>{const a=R(4,8),b=R(3,6),x=R(2,a-1),y=R(2,5);const [who,what]=PK([['Ms. Rosa','a café patio'],['Dr. Quartz','a lab floor'],['Gizmo','a robot track'],['Nana Paws','a dog park']]);const A1=a*b,A2=x*y;
  return st({prompt:`${who} builds ${what} from two rectangles: one is <b>${a} m by ${b} m</b>, and a smaller one is <b>${x} m by ${y} m</b>. What is the total area?`,tpl:'{A} square meters',answer:A1+A2,text:`comp ${a}${b}${x}${y}${who}`,explain:`<p>Big part: ${a} × ${b} = ${A1}. Small part: ${x} × ${y} = ${A2}.</p><p>${A1} + ${A2} = <b>${A1+A2}</b> square meters</p>`,nudge:`<p>Find the area of each rectangle, then add.</p>`,fast:30});},
 fence2:c=>{const l=R(6,15),w=R(3,9),have=R(10,2*(l+w)-4);return st({prompt:`Nana Paws wants a fence around a dog yard <b>${l} feet</b> long and <b>${w} feet</b> wide. She has <b>${have} feet</b> of fence. How many more feet does she need?`,tpl:'{A} more feet',answer:2*(l+w)-have,text:`f2 ${l} ${w} ${have}`,explain:`<p>Perimeter: ${l} + ${w} + ${l} + ${w} = ${2*(l+w)} feet.</p><p>${2*(l+w)} − ${have} = <b>${2*(l+w)-have}</b> feet</p>`,nudge:`<p>Step 1: find the perimeter. Step 2: take away what she has.</p>`,fast:30});},
 tilesLeft:c=>{const l=R(4,9),w=R(3,8),have=l*w+R(5,30);return st({prompt:`Gizmo has <b>${have}</b> square tiles. He covers a floor <b>${l} tiles</b> long and <b>${w} tiles</b> wide. How many tiles are left?`,tpl:'{A} tiles',answer:have-l*w,text:`tl ${l} ${w} ${have}`,explain:`<p>Floor: ${l} × ${w} = ${l*w} tiles.</p><p>${have} − ${l*w} = <b>${have-l*w}</b></p>`,nudge:`<p>First find the area of the floor.</p>`,fast:30});},
 est:()=>{const L=[['How heavy is a grape?','about 1 gram','about 1 kilogram'],['How heavy is a paper clip?','about 1 gram','about 1 kilogram'],['How heavy is a big dictionary?','about 1 kilogram','about 1 gram'],['How heavy is a pineapple?','about 1 kilogram','about 1 gram'],['How heavy is a kid\'s bike?','about 12 kilograms','about 12 grams'],['How heavy is a pencil?','about 5 grams','about 5 kilograms'],["How heavy is Coach Flex's dumbbell?",'about 10 kilograms','about 10 grams'],['How heavy is one of Skyla\'s feathers?','less than 1 gram','about 1 kilogram'],
   ['How much water does a bathtub hold?','about 200 liters','about 2 liters'],['How much juice is in a juice box?','less than 1 liter','about 10 liters'],['How much water does a bucket hold?','about 10 liters','about 1,000 liters'],['How much milk is in a big jug?','about 4 liters','about 400 liters'],['How much water fills a kitchen sink?','about 20 liters','about 2,000 liters']];const [q,r,w]=PK(L);
  return choice(ok({prompt:`${q}`,tpl:'{A}',text:`est ${q}`,explain:`<p>A gram is very light (a paper clip). A kilogram is like a big book. A liter is a big water bottle.</p><p>The answer is <b>${r}</b>.</p>`,nudge:`<p>Gram = paper clip. Kilogram = big book. Liter = big water bottle.</p>`}),r,[w]);},
 liquid:c=>{const k=R(0,2);
  if(k===0){const n=R(3,6),e=R(2,5),u=R(1,n*e-1);return st({prompt:`Ms. Rosa has <b>${n} jugs</b> of lemonade. Each jug holds <b>${e} liters</b>. She pours out <b>${u} liters</b>. How many liters are left?`,tpl:'{A} liters',answer:n*e-u,text:`liq ${n} ${e} ${u}`,explain:`<p>${n} × ${e} = ${n*e} liters.</p><p>${n*e} − ${u} = <b>${n*e-u}</b> liters</p>`,nudge:`<p>Find how many liters in all first.</p>`,fast:30});}
  if(k===1){const b=R(3,8),g=PK([2,3,4,5]);return st({prompt:`Dr. Quartz has <b>${b*g} grams</b> of crystal sand. He fills <b>${g}</b> jars with the same amount. How many grams in each jar?`,tpl:'{A} grams',answer:b,text:`sand ${b} ${g}`,explain:`<p>${b*g} ÷ ${g} = <b>${b}</b> grams</p>`,nudge:`<p>Share ${b*g} into ${g} equal parts.</p>`});}
  const a=R(12,40),b=R(3,Math.floor(a/2));return st({prompt:`Gizmo's backpack weighs <b>${a} kilograms</b> with his tools. He takes out a toolbox that weighs <b>${Math.min(b,a-2)} kilograms</b>. How heavy is the backpack now?`,tpl:'{A} kilograms',answer:a-Math.min(b,a-2),text:`bp ${a} ${b}`,explain:`<p>${a} − ${Math.min(b,a-2)} = <b>${a-Math.min(b,a-2)}</b> kilograms</p>`,nudge:`<p>Taking out means subtract.</p>`});}
};
/* round 2: grade 3 mass, liquid volume, units, line plots, CAASPP-style checks */
const m3x={
 mass:c=>{const k=PK([0,1,2,3,4]);
  if(k===0){const g=R(3,9),n=R(3,8);return st({prompt:`Each of Dr. Quartz's tiny crystals weighs <b>${g} grams</b>. He puts <b>${n}</b> crystals on the scale. What does the scale show?`,tpl:'{A} grams',answer:g*n,text:`ms0 ${g}${n}`,explain:`<p>${n} × ${g} = <b>${g*n}</b> grams</p>`,nudge:`<p>Same weight ${n} times: multiply.</p>`});}
  if(k===1){const j=PK([2,3,4,5]),e=R(2,9);return st({prompt:`A big pot holds <b>${j*e} liters</b> of soup. Ms. Rosa pours it equally into <b>${j}</b> jugs. How many liters in each jug?`,tpl:'{A} liters',answer:e,text:`ms1 ${j}${e}`,explain:`<p>${j*e} ÷ ${j} = <b>${e}</b> liters</p>`,nudge:`<p>Share equally: divide.</p>`});}
  if(k===2){const a=R(2,9),b=R(2,9);return st({prompt:`A bag of apples weighs <b>${a} kilograms</b>. Nana Paws adds a bag of dog food that weighs <b>${b} kilograms</b> to the scale. What does the scale show now?`,tpl:'{A} kilograms',answer:a+b,text:`ms2 ${a}${b}`,explain:`<p>${a} + ${b} = <b>${a+b}</b> kilograms</p>`,nudge:`<p>Both bags are on the scale: add.</p>`});}
  if(k===3){const cap=10*R(3,8),has=R(5,cap-5);return st({prompt:`Ozzy's fish tank holds <b>${cap} liters</b>. It has <b>${has} liters</b> of water in it. How many more liters will fill it?`,tpl:'{A} liters',answer:cap-has,text:`ms3 ${cap}${has}`,explain:`<p>${cap} − ${has} = <b>${cap-has}</b> liters</p>`,nudge:`<p>How far is ${has} from ${cap}?</p>`});}
  const a=10*R(3,9),b=10*R(1,a/10-1);return st({prompt:`Gizmo's red gadget weighs <b>${a} grams</b>. His blue gadget weighs <b>${b} grams</b>. How much heavier is the red one?`,tpl:'{A} grams heavier',answer:a-b,text:`ms4 ${a}${b}`,explain:`<p>${a} − ${b} = <b>${a-b}</b> grams</p>`,nudge:`<p>"How much heavier" means subtract.</p>`});},
 unit:()=>{const L=[['the weight of a puppy','kilograms',['grams','liters']],['the weight of a strawberry','grams',['kilograms','liters']],['the water in a bathtub','liters',['grams','kilograms']],['the length of a pencil','centimeters',['meters','kilograms']],['the length of a school bus','meters',['centimeters','grams']],['the weight of a bag of potatoes','kilograms',['grams','meters']],['the juice in a big jug','liters',['grams','centimeters']],['the weight of a coin','grams',['kilograms','liters']]];const [t,r,w]=PK(L);
  return choice(ok({prompt:`Which unit makes the most sense for <b>${t}</b>?`,tpl:'{A}',text:`unit ${t}`,explain:`<p>Grams for light things, kilograms for heavy things, liters for liquids, centimeters for short lengths, meters for long ones.</p><p>The answer is <b>${r}</b>.</p>`,nudge:`<p>Is it a weight, a liquid or a length? Small or big?</p>`}),r,w);},
 lp:c=>{const base=R(3,6);const vals=[0,1,2,3,4].map(i=>base*2+i);let cnt;do{cnt=vals.map(()=>R(0,5));}while(sum(cnt)<6||cnt.filter(x=>x).length<3);const show=v=>v%2?`${(v-1)/2} ${F(1,2)}`:String(v/2);
  const [t,u]=PK([['Lengths of crayons (inches)','crayon'],["Lengths of Skyla's feathers (inches)",'feather'],["Lengths of Gizmo's bolts (inches)",'bolt'],['Lengths of leaves in the garden (inches)','leaf']]);const plur=u==='leaf'?'leaves':u+'s';
  const html=`<b>${t}</b><br><small>(line plot: each ✕ is one ${u})</small><br>`+vals.map((v,i)=>`${show(v)} : ${cnt[i]?'✕ '.repeat(cnt[i]).trim():'—'}`).join('<br>');const k=R(0,2);
  if(k===0){const i=cnt.findIndex(x=>x>0);const j=R(0,4);return ok({prompt:html+`<br>How many ${plur} are <b>${show(vals[j])}</b> inches long?`,tpl:`{A} ${plur}`,answer:cnt[j],text:`lp0 ${cnt} ${j}`,explain:`<p>Count the ✕ above ${show(vals[j])}: <b>${cnt[j]}</b>.</p>`,nudge:`<p>Find ${show(vals[j])} and count its ✕.</p>`});}
  if(k===1){const j=R(1,3);const n=sum(cnt.slice(j+1));return ok({prompt:html+`<br>How many ${plur} are <b>longer than ${show(vals[j])}</b> inches?`,tpl:`{A} ${plur}`,answer:n,text:`lp1 ${cnt} ${j}`,explain:`<p>Count the ✕ above the numbers bigger than ${show(vals[j])}: ${cnt.slice(j+1).join(' + ')} = <b>${n}</b>.</p>`,nudge:`<p>Only count the ✕ to the right of ${show(vals[j])}.</p>`});}
  return ok({prompt:html+`<br>How many ${plur} were measured in all?`,tpl:`{A} ${plur}`,answer:sum(cnt),text:`lp2 ${cnt}`,explain:`<p>${cnt.join(' + ')} = <b>${sum(cnt)}</b></p>`,nudge:`<p>Count every ✕.</p>`});},
 caPerim:c=>{const l=R(3,9),w=R(2,8);if(l===w||l*w===2*(l+w))return m3x.caPerim(c);const P=2*(l+w);const k=R(0,2);const said=k===0?P:k===1?l*w:l+w;const r=said===P?'Yes':'No';const [who,he]=PK([['Coach Flex','he'],['Gizmo','he'],['Nana Paws','she'],['Skyla','she']]);
  return choice(st({prompt:`${who} says a garden <b>${l} feet</b> by <b>${w} feet</b> has a perimeter of <b>${said} feet</b>. Is ${he} right?`,tpl:'{A}',text:`cap ${l}${w}${said}`,explain:`<p>Perimeter = all 4 sides: ${l} + ${w} + ${l} + ${w} = ${P} feet.</p><p><b>${r}</b>.${k===1?` (${said} is the area, not the perimeter!)`:k===2?' (That only adds 2 of the 4 sides!)':''}</p>`,nudge:`<p>Work out the perimeter yourself, then compare.</p>`,fast:25}),r,[r==='Yes'?'No':'Yes']);},
 bigger:()=>{let a,b,x,y,z;do{a=R(3,7);b=R(3,6);x=R(2,5);y=R(2,4);z=R(1,x);}while(a*b===x*y+z*2);const A=a*b,B=x*y+z*2;const r=A>B?'The rectangle':'The L-shape';
  return choice(ok({prompt:`Shape 1 is a rectangle of squares, <b>${a} rows of ${b}</b>. Shape 2 is an L-shape: <b>${y} rows of ${x}</b> squares, plus <b>2 rows of ${z}</b> square${z>1?'s':''}. Which shape has the bigger area?`,tpl:'{A}',text:`big ${a}${b}${x}${y}${z}`,explain:`<p>Rectangle: ${a} × ${b} = ${A}. L-shape: ${y} × ${x} + 2 × ${z} = ${x*y} + ${2*z} = ${B}.</p><p><b>${r}</b> is bigger.</p>`,nudge:`<p>Find each area, then compare.</p>`}),r,[r==='The rectangle'?'The L-shape':'The rectangle']);}
};
/* round 2: grade 4 extra Legend stories and checks */
const m4x={
 flour:c=>{const lb=R(2,4),oz=R(2,12),n=R(2,4);const per=lb*16+oz;return st({prompt:`Ms. Rosa uses <b>${lb} lb ${oz} oz</b> of flour for each batch of bread. She bakes <b>${n}</b> batches. How many ounces of flour is that?`,tpl:'{A} ounces',answer:per*n,text:`fl ${lb}${oz}${n}`,explain:`<p>One batch: ${lb} × 16 + ${oz} = ${per} oz.</p><p>${n} × ${per} = <b>${per*n}</b> ounces</p>`,nudge:`<p>Change one batch to ounces first (1 lb = 16 oz).</p>`,fast:40});},
 train:c=>{const km=R(1,4),m=100*R(1,9),n=PK([2,3]);const one=km*1000+m;return st({prompt:`Ozzy's train track from the Depot to the lake is <b>${km} km ${m} m</b> long. The train makes the trip <b>${n} times</b> today. How many meters does it travel?`,tpl:'{A} meters',answer:one*n,text:`tr ${km}${m}${n}`,explain:`<p>${km} km ${m} m = ${N(one)} m.</p><p>${n} × ${N(one)} = <b>${N(one*n)}</b> m</p>`,nudge:`<p>Change to meters first (1 km = 1,000 m).</p>`,fast:40});},
 angle:c=>{const a=PK([30,40,45,50,60]),n=R(2,3),x=PK([20,25,35]);const tot=a*n+x;if(tot>=180)return m4x.angle(c);return st({prompt:`Skyla turns <b>${a}°</b>, then <b>${a}°</b>${n===3?`, then <b>${a}°</b>`:''}, then <b>${x}°</b> more, all the same way. How far must she still turn to make a <b>straight-line half turn (180°)</b>?`,tpl:'{A}°',answer:180-tot,text:`ang ${a}${n}${x}`,explain:`<p>Turned so far: ${n} × ${a} + ${x} = ${tot}°.</p><p>180 − ${tot} = <b>${180-tot}°</b></p>`,nudge:`<p>Add up her turns, then subtract from 180.</p>`,fast:40});},
 caAngle:c=>{const a=PK([5*R(3,17),5*R(19,34),90]);const said=PK(['acute','right','obtuse']);const r0=a<90?'acute':a===90?'right':'obtuse';const r=said===r0?'Yes':'No';
  return choice(st({prompt:`Gizmo says a <b>${a}°</b> angle is <b>${said}</b>. Is he right?`,tpl:'{A}',text:`caa ${a}${said}`,explain:`<p>Acute is less than 90°, right is exactly 90°, obtuse is between 90° and 180°.</p><p>${a}° is ${r0}, so <b>${r}</b>.</p>`,nudge:`<p>Compare ${a}° with 90°.</p>`}),r,[r==='Yes'?'No':'Yes']);},
 caConv:c=>{const L=[['kg','g',1000],['m','cm',100],['L','mL',1000],['ft','in',12],['yd','ft',3],['lb','oz',16],['km','m',1000]];const [b,s,f]=PK(L);const n=R(2,6);const wrong=Math.random()<.5;const said=wrong?n*PK(f===1000?[100,10]:f===100?[10,1000]:f===12?[10,100]:f===16?[10,12]:[12,10]):n*f;const r=wrong?'No':'Yes';const [who,he]=PK([['Skyla','she'],['Coach Flex','he'],['Ozzy','he'],['Ms. Rosa','she']]);
  return choice(st({prompt:`${who} says <b>${n} ${b} = ${N(said)} ${s}</b>. Is ${he} right?`,tpl:'{A}',text:`cac ${n}${b}${said}`,explain:`<p>1 ${b} = ${N(f)} ${s}, so ${n} ${b} = ${N(n*f)} ${s}.</p><p><b>${r}</b>.</p>`,nudge:`<p>How many ${s} are in 1 ${b}?</p>`}),r,[r==='Yes'?'No':'Yes']);}
};
/* round 2: grade 5 */
const m5x={
 bottle:c=>{const ml=PK([250,350,450,600,750]),n=R(3,6);const tot=ml*n;const o=st({prompt:`Coach Flex drinks a <b>${ml} mL</b> bottle of water <b>${n} times</b> during practice. How many <b>liters</b> is that?`,tpl:'{A} liters',text:`bt ${ml}${n}`,explain:`<p>${n} × ${ml} = ${N(tot)} mL.</p><p>${N(tot)} ÷ 1,000 = <b>${tot/1000}</b> liters</p>`,nudge:`<p>Find the mL, then divide by 1,000.</p>`});return DEC(o,tot/10,2);},
 yarn:c=>{const ft=R(2,5),inch=PK([3,4,6]),n=R(3,6);const tot=ft*12*n;return st({prompt:`Nana Paws knits <b>${n}</b> scarves. Each one is <b>${ft} feet</b> long. How many <b>inches</b> of scarf is that?`,tpl:'{A} inches',answer:tot,text:`yn ${ft}${n}`,explain:`<p>${ft} ft = ${ft*12} in.</p><p>${n} × ${ft*12} = <b>${tot}</b> inches</p>`,nudge:`<p>1 foot = 12 inches.</p>`});},
 wire3:c=>{const m=R(2,5),used=10*R(4,15),p=PK([3,4,5,6]);const rest=m*100-used;if(rest%p||rest<=0)return m5x.wire3(c);return st({prompt:`Gizmo has <b>${m} m</b> of wire. He uses <b>${used} cm</b> for a robot arm. He cuts the rest into <b>${p}</b> equal pieces. How many centimeters long is each piece?`,tpl:'{A} cm',answer:rest/p,text:`w3 ${m}${used}${p}`,explain:`<p>${m} m = ${m*100} cm. ${m*100} − ${used} = ${rest} cm left.</p><p>${rest} ÷ ${p} = <b>${rest/p}</b> cm</p>`,nudge:`<p>Change to cm, take away the arm, then divide.</p>`,fast:45});},
 caConv5:c=>{const L=[['kg','g',1000],['m','cm',100],['L','mL',1000],['km','m',1000]];const [b,s,f]=PK(L);const v=R(11,49);if(v%10===0)return m5x.caConv5(c);const right=v*f/10;const wrong=Math.random()<.5;const said=wrong?right/10:right;const r=wrong?'No':'Yes';const [who,he]=PK([['Skyla','she'],['Dr. Quartz','he'],['Gizmo','he'],['Ms. Rosa','she']]);
  return choice(st({prompt:`${who} says <b>${D(v,1)} ${b} = ${N(said)} ${s}</b>. Is ${he} right?`,tpl:'{A}',text:`cc5 ${v}${b}${said}`,explain:`<p>1 ${b} = ${N(f)} ${s}. ${D(v,1)} × ${N(f)} = ${N(right)}.</p><p><b>${r}</b>.</p>`,nudge:`<p>Multiply by ${N(f)}: move the decimal point.</p>`}),r,[r==='Yes'?'No':'Yes']);}
};

DEF('meas',3,[
 [m3.arr,m3.tiles,m3.lshape,m3.cmpA],
 [m3.rect,m3.areaWords,m3.split,m3x.mass,m3x.unit],
 [m3.perim,m3.poly,m3.square,m3.fence,m3.perimArr,m3x.lp],
 [m3.missPoly,m3.missA,m3.missP,m3.same,r3.lshape,r3.lArea,c=>gq.more(Bs5)(c),r3.mPerim],
 [m3.comp,m3.fence2,m3.tilesLeft,m3.liquid,m3x.lp,c=>gq.two(Bs5)(c),m3.est,m3x.mass,r3.mPerim]]);

/* ---------- grade 4 ---------- */
const CONV=[['feet','inches',12,'foot'],['yards','feet',3,'yard'],['meters','centimeters',100,'meter'],['kilometers','meters',1000,'kilometer'],['kilograms','grams',1000,'kilogram'],['liters','milliliters',1000,'liter'],['hours','minutes',60,'hour'],['pounds','ounces',16,'pound'],['centimeters','millimeters',10,'centimeter']];
const m4={
 conv:()=>{const [b,s,f,one]=PK(CONV);const n=R(2,f>=1000?9:f>=60?8:10);return ok({prompt:'Change the units.',tpl:`${n} ${b} = {A} ${s}`,answer:n*f,text:`${n}${b}`,explain:`<p>1 ${one} = ${N(f)} ${s}.</p><p>${n} × ${N(f)} = <b>${N(n*f)}</b> ${s}</p>`,nudge:`<p>Big unit → small unit: you get <b>more</b> of them. Multiply.</p>`,fast:10});},
 convBack:()=>{const [b,s,f,one]=PK(CONV);const n=R(2,9);return ok({prompt:'Change the units.',tpl:`${N(n*f)} ${s} = {A} ${b}`,answer:n,text:`back ${n}${b}`,explain:`<p>${N(f)} ${s} make 1 ${one}.</p><p>${N(n*f)} ÷ ${N(f)} = <b>${n}</b></p>`,nudge:`<p>How many groups of ${N(f)} are in ${N(n*f)}?</p>`});},
 convCmp:()=>{const [b,s,f,one]=PK(CONV.filter(x=>x[2]<=100));const n=R(2,6);const v=n*f+PK([-1,1,0])*R(1,Math.max(1,Math.floor(f/2)));const L=`${n} ${b}`,Rt=`${v} ${s}`;const r=n*f>v?L:n*f<v?Rt:'Same';
  return choice(ok({prompt:`Which is ${/hours/.test(b)?'longer':/pounds|kilograms/.test(b)?'heavier':/liters/.test(b)?'more':'longer'}?`,tpl:'{A}',text:`cc ${L} ${Rt}`,explain:`<p>${n} ${b} = ${n} × ${f} = ${n*f} ${s}.</p><p>${n*f} vs ${v}: the answer is <b>${r}</b>.</p>`,nudge:`<p>Change ${n} ${b} into ${s} first.</p>`}),r,[L,Rt,'Same']);},
 convStory:c=>{const k=R(0,4);
  if(k===0){const n=R(2,9);return st({prompt:`Skyla the eagle flies <b>${n} kilometers</b> to her nest. How many meters is that?`,tpl:'{A} meters',answer:n*1000,text:`sk ${n}`,explain:`<p>1 km = 1,000 m. ${n} × 1,000 = <b>${N(n*1000)}</b> m</p>`,nudge:`<p>How many meters are in 1 kilometer?</p>`});}
  if(k===1){const n=R(2,8);return st({prompt:`Gizmo's robot is <b>${n} feet</b> tall. How many inches tall is it?`,tpl:'{A} inches',answer:n*12,text:`rob ${n}`,explain:`<p>1 foot = 12 inches. ${n} × 12 = <b>${n*12}</b></p>`,nudge:`<p>How many inches are in 1 foot?</p>`});}
  if(k===2){const n=R(2,5);return st({prompt:`Ms. Rosa makes <b>${n} liters</b> of soup. How many milliliters is that?`,tpl:'{A} mL',answer:n*1000,text:`soup ${n}`,explain:`<p>1 L = 1,000 mL. ${n} × 1,000 = <b>${N(n*1000)}</b> mL</p>`,nudge:`<p>How many milliliters are in 1 liter?</p>`});}
  if(k===3){const n=R(2,6);return st({prompt:`Coach Flex's medicine ball weighs <b>${n} pounds</b>. How many ounces is that?`,tpl:'{A} ounces',answer:n*16,text:`ball ${n}`,explain:`<p>1 pound = 16 ounces. ${n} × 16 = <b>${n*16}</b></p>`,nudge:`<p>How many ounces are in 1 pound?</p>`});}
  const n=R(3,9);return st({prompt:`Grumbleroot's bridge is <b>${n} yards</b> long. How many feet is that?`,tpl:'{A} feet',answer:n*3,text:`br ${n}`,explain:`<p>1 yard = 3 feet. ${n} × 3 = <b>${n*3}</b></p>`,nudge:`<p>How many feet are in 1 yard?</p>`});},
 areaF:()=>{const l=R(8,25),w=R(3,12),u=PK(['ft','m','cm','in']);return ok({vis:{t:'rect',top:`${l} ${u}`,side:`${w} ${u}`},prompt:'Use the formula: Area = length × width.',tpl:`Area = {A} sq ${u}`,answer:l*w,text:`aF ${l} ${w}`,explain:`<p>${l} × ${w} = <b>${l*w}</b> square ${u}</p>`,nudge:`<p>Multiply length × width. Split ${l} into tens and ones if it helps.</p>`});},
 perF:()=>{const l=R(10,45),w=R(4,30),u=PK(['ft','m','cm','yd']);return ok({vis:{t:'rect',top:`${l} ${u}`,side:`${w} ${u}`},prompt:'Use the formula: Perimeter = 2 × length + 2 × width.',tpl:`Perimeter = {A} ${u}`,answer:2*(l+w),text:`pF ${l} ${w}`,explain:`<p>2 × ${l} = ${2*l}. 2 × ${w} = ${2*w}.</p><p>${2*l} + ${2*w} = <b>${2*(l+w)}</b> ${u}</p>`,nudge:`<p>Double the length, double the width, then add.</p>`});},
 sqAP:()=>{const s=R(5,15),u=PK(['cm','m','ft']);const a=Math.random()<.5;return ok({prompt:`A square has sides of <b>${s} ${u}</b>. What is its <b>${a?'area':'perimeter'}</b>?`,tpl:a?`{A} square ${u}`:`{A} ${u}`,answer:a?s*s:4*s,text:`sq ${s} ${a}`,explain:a?`<p>Area = side × side: ${s} × ${s} = <b>${s*s}</b></p>`:`<p>Perimeter = 4 × side: 4 × ${s} = <b>${4*s}</b></p>`,nudge:`<p>${a?'Area is the squares inside.':'Perimeter is the distance around.'} All sides of a square are equal.</p>`});},
 areaSt:c=>{const l=R(10,30),w=R(6,15);const [who,what]=PK([["Ms. Rosa's café",'floor'],["the Kind Teacher's classroom",'floor'],["Dr. Quartz's lab",'floor'],["Coach Flex's gym",'mat area']]);const a=Math.random()<.5;
  return st({prompt:`The ${what} of ${who} is a rectangle <b>${l} feet</b> by <b>${w} feet</b>. ${a?'What is its area?':'What is its perimeter?'}`,tpl:a?'{A} square feet':'{A} feet',answer:a?l*w:2*(l+w),text:`as ${l} ${w} ${a} ${who}`,explain:a?`<p>${l} × ${w} = <b>${l*w}</b> square feet</p>`:`<p>2 × ${l} + 2 × ${w} = ${2*l} + ${2*w} = <b>${2*(l+w)}</b> feet</p>`,nudge:`<p>${a?'Area = length × width.':'Perimeter = add all 4 sides.'}</p>`});},
 prot:()=>{const a=5*R(2,34);return ok({vis:{t:'prot',a,fine:true},prompt:'Measure the angle.',tpl:'{A}°',answer:a,text:`prot ${a}`,explain:`<p>Start at <b>0</b> on the flat side and count up to where the other ray crosses: <b>${a}°</b>.</p><p>${a<90?'Less than 90° = acute.':a===90?'90° = right angle.':'More than 90° = obtuse.'}</p>`,nudge:`<p>Start at 0 on the flat line. Is the angle bigger or smaller than a right angle (90°)?</p>`});},
 type:()=>{const a=PK([5*R(2,17),90,90,5*R(19,35),180]);const r=a<90?'acute':a===90?'right':a<180?'obtuse':'straight';return choice(ok({prompt:`An angle measures <b>${a}°</b>. What kind of angle is it?`,tpl:'{A}',text:`type ${a}`,explain:`<p>Acute: less than 90°. Right: exactly 90°. Obtuse: between 90° and 180°. Straight: 180°.</p><p>${a}° is <b>${r}</b>.</p>`,nudge:`<p>Compare it with 90°, a square corner.</p>`}),r,['acute','right','obtuse','straight']);},
 add:()=>{const a=5*R(3,15),b=5*R(3,15);if(Math.random()<.5)return ok({prompt:`An angle is split into two parts: <b>${a}°</b> and <b>${b}°</b>. How big is the whole angle?`,tpl:'{A}°',answer:a+b,text:`add ${a} ${b}`,explain:`<p>The parts add up to the whole: ${a} + ${b} = <b>${a+b}°</b></p>`,nudge:`<p>Add the two parts.</p>`});
  const t=PK([90,180]);const x=5*R(2,t/5-2);return ok({prompt:`Two angles together make a <b>${t===90?'right angle (90°)':'straight line (180°)'}</b>. One angle is <b>${x}°</b>. How big is the other?`,tpl:'{A}°',answer:t-x,text:`miss ${t} ${x}`,explain:`<p>${t} − ${x} = <b>${t-x}°</b></p>`,nudge:`<p>They add up to ${t}°. What goes with ${x}?</p>`});},
 turn:c=>{const k=R(0,2);if(k===0){const [w,d]=PK([['a quarter turn',90],['a half turn',180],['three quarter turns',270],['a full turn',360]]);return st({prompt:`Skyla turns <b>${w}</b> in the sky. How many degrees does she turn?`,tpl:'{A}°',answer:d,text:`turn ${d}`,explain:`<p>A full turn is 360°. ${w} = <b>${d}°</b>.</p>`,nudge:`<p>A full circle is 360°. A quarter of that is 90°.</p>`});}
  if(k===1){const s=PK([15,20,30,45]),n=R(2,Math.floor(180/s));return st({prompt:`Gizmo's robot turns <b>${s}°</b> at a time. It turns <b>${n} times</b> the same way. How many degrees in all?`,tpl:'{A}°',answer:s*n,text:`rob ${s} ${n}`,explain:`<p>${n} × ${s} = <b>${s*n}°</b></p>`,nudge:`<p>Same turn ${n} times: multiply.</p>`});}
  const n=R(20,170);return st({prompt:`An angle turns through <b>${n}</b> one-degree angles. How many degrees is it?`,tpl:'{A}°',answer:n,text:`one ${n}`,explain:`<p>Each one-degree angle is 1°. ${n} of them make <b>${n}°</b>.</p>`,nudge:`<p>Each tiny angle is 1°.</p>`,fast:8});},
 mixed:()=>{const L=[['feet','inches',12,11],['yards','feet',3,2],['meters','centimeters',100,99],['kilograms','grams',1000,999],['pounds','ounces',16,15],['liters','milliliters',1000,999],['hours','minutes',60,59]];const [b,s,f,mx]=PK(L);const n=R(1,6);const x=f>=100?(f===1000?50*R(1,19):5*R(1,19)):R(1,mx);
  return ok({prompt:'Change to the smaller unit.',tpl:`${n} ${unitN(n,b)} ${N(x)} ${unitN(x,s)} = {A} ${s}`,answer:n*f+x,text:`mx ${n}${b}${x}`,explain:`<p>${n} × ${N(f)} = ${N(n*f)} ${s}.</p><p>${N(n*f)} + ${N(x)} = <b>${N(n*f+x)}</b> ${s}</p>`,nudge:`<p>Change the ${b} into ${s}, then add the extra ${N(x)}.</p>`});},
 missBig:()=>{if(Math.random()<.5){const l=R(6,15),w=R(4,12);return ok({vis:{t:'rect',top:`${l} m`,side:'? m'},prompt:`The area is <b>${l*w} square meters</b>. The length is ${l} m.`,tpl:'Width = {A} m',answer:w,text:`mbA ${l} ${w}`,explain:`<p>${l*w} ÷ ${l} = <b>${w}</b></p>`,nudge:`<p>Area ÷ length = width.</p>`});}
  const l=R(15,40),w=R(5,l-2);return ok({vis:{t:'rect',top:`${l} ft`,side:'? ft'},prompt:`The perimeter is <b>${2*(l+w)} feet</b>. The length is ${l} ft.`,tpl:'Width = {A} ft',answer:w,text:`mbP ${l} ${w}`,explain:`<p>${2*(l+w)} − ${l} − ${l} = ${2*w}. ${2*w} ÷ 2 = <b>${w}</b></p>`,nudge:`<p>Take away both lengths, then halve what is left.</p>`});},
 missAng:()=>{if(Math.random()<.5){const a=5*R(4,14),b=5*R(4,14);const t=a+b<175?180:360;return ok({prompt:`Three angles together make a ${t===180?'straight line (180°)':'full turn (360°)'}. Two of them are <b>${a}°</b> and <b>${b}°</b>. How big is the third?`,tpl:'{A}°',answer:t-a-b,text:`ma3 ${a} ${b}`,explain:`<p>${a} + ${b} = ${a+b}.</p><p>${t} − ${a+b} = <b>${t-a-b}°</b></p>`,nudge:`<p>They add up to ${t}°.</p>`});}
  const x=R(11,79);return ok({prompt:`A right angle is split into two parts. One part is <b>${x}°</b>. How big is the other part?`,tpl:'{A}°',answer:90-x,text:`mr ${x}`,explain:`<p>90 − ${x} = <b>${90-x}°</b></p>`,nudge:`<p>A right angle is 90°.</p>`});},
 tileCost:c=>{const l=R(6,15),w=R(4,10),p=R(2,5);return st({prompt:`Ms. Rosa's café patio is <b>${l} feet</b> by <b>${w} feet</b>. Tiles cost <b>$${p}</b> for each square foot. How much do the tiles cost?`,tpl:'$ {A}',answer:l*w*p,text:`tc ${l} ${w} ${p}`,explain:`<p>Area: ${l} × ${w} = ${l*w} square feet.</p><p>${l*w} × $${p} = <b>$${l*w*p}</b></p>`,nudge:`<p>Step 1: area. Step 2: times the price per square foot.</p>`,fast:35});},
 fenceCost:c=>{const l=R(8,20),w=R(5,12),p=R(2,6);return st({prompt:`Grumbleroot wants a fence around his goat pen, <b>${l} feet</b> by <b>${w} feet</b>. Fence costs <b>${p} toll coins</b> per foot. How many coins does he need?`,tpl:'{A} coins',answer:2*(l+w)*p,text:`fc ${l} ${w} ${p}`,explain:`<p>Perimeter: 2 × ${l} + 2 × ${w} = ${2*(l+w)} feet.</p><p>${2*(l+w)} × ${p} = <b>${2*(l+w)*p}</b> coins</p>`,nudge:`<p>Step 1: perimeter. Step 2: times ${p}.</p>`,fast:35});},
 yarn:c=>{const m=R(2,6),p=PK([20,25,50]);const pieces=m*100/p;return st({prompt:`Nana Paws has <b>${m} meters</b> of yarn. She cuts it into pieces <b>${p} cm</b> long. How many pieces does she get?`,tpl:'{A} pieces',answer:pieces,text:`yarn ${m} ${p}`,explain:`<p>${m} m = ${m*100} cm.</p><p>${m*100} ÷ ${p} = <b>${pieces}</b> pieces</p>`,nudge:`<p>Change meters to centimeters first.</p>`,fast:30});},
 laps:c=>{const n=R(3,6),track=PK([200,400]),more=100*R(2,9);return st({prompt:`Coach Flex runs <b>${n} laps</b> of a <b>${track}-meter</b> track. Then he jogs <b>${more} meters</b> home. How many meters does he run in all?`,tpl:'{A} meters',answer:n*track+more,text:`laps ${n} ${track} ${more}`,explain:`<p>${n} × ${track} = ${N(n*track)} m.</p><p>${N(n*track)} + ${more} = <b>${N(n*track+more)}</b> m</p>`,nudge:`<p>Laps first (multiply), then add the jog.</p>`,fast:30});},
 batt:c=>{const b=PK([150,200,250,300,350,400]),n=R(4,9),box=PK([1,2]);return st({prompt:`Gizmo packs <b>${n} batteries</b> into a box. Each battery weighs <b>${b} grams</b>. The empty box weighs <b>${box} kilogram${box>1?'s':''}</b>. How many grams does the full box weigh?`,tpl:'{A} grams',answer:n*b+box*1000,text:`batt ${n} ${b} ${box}`,explain:`<p>Batteries: ${n} × ${b} = ${N(n*b)} g. Box: ${box} kg = ${N(box*1000)} g.</p><p>${N(n*b)} + ${N(box*1000)} = <b>${N(n*b+box*1000)}</b> grams</p>`,nudge:`<p>Change kilograms to grams before adding.</p>`,fast:35});},
 juice:c=>{const L=R(1,5),cup=PK([100,200,250,500]);return st({prompt:`Ms. Rosa makes <b>${L} liter${L>1?'s':''}</b> of lemonade. She pours it into cups that hold <b>${cup} mL</b> each. How many cups can she fill?`,tpl:'{A} cups',answer:L*1000/cup,text:`juice ${L} ${cup}`,explain:`<p>${L} L = ${N(L*1000)} mL.</p><p>${N(L*1000)} ÷ ${cup} = <b>${L*1000/cup}</b> cups</p>`,nudge:`<p>Change liters to milliliters first.</p>`,fast:30});}
};
DEF('meas',4,[
 [K('conv',m4.conv),K('back',m4.convBack),K('cmp',m4.convCmp),K('cstory',m4.convStory),K('rel',r7.relate),K('ftin',r7.ftIn)],
 [m4.areaF,m4.perF,m4.sqAP,K('room',m4.areaSt),m4.conv,r5.sqMiss,r5.lights,r6.protOdd],
 [m4.prot,r6.protOdd,m4.type,m4.add,m4.turn,r6.tAngle,r4.clockAng,r4.pizza],
 [m4.mixed,m4.missBig,m4.missAng,r3.lpNot(c=>L4.diff(c),/yarn|beaker/),r3.lpNot(c=>L8.total(c),/yarn|feather/),r3.mConv,m4.convBack,r5.cmpLen],
 [m4.tileCost,m4.fenceCost,m4.yarn,m4.laps,m4.batt,m4.juice,m4x.flour,m4x.train,m4x.angle,r3.lpNot(c=>L8.all(c),/yarn/)]]);

/* ---------- grade 5 ---------- */
const m5={
 dec:()=>{const L=[['m','cm',100],['kg','g',1000],['L','mL',1000],['km','m',1000],['m','mm',1000],['cm','mm',10]];const [b,s,f]=PK(L);const v=f===10?R(11,99):PK([R(11,99),R(101,999)]);const dp=f===10?1:v>99?2:1;
  const shown=D(v,dp).replace(/\.?0+$/,'');const ans=Math.round(parseFloat(shown)*f);if(ans%1||!/\./.test(shown))return m5.dec();
  return ok({prompt:'Change to the smaller unit.',tpl:`${shown} ${b} = {A} ${s}`,answer:ans,text:`dec ${shown}${b}`,explain:`<p>1 ${b} = ${N(f)} ${s}.</p><p>${shown} × ${N(f)} = <b>${N(ans)}</b> ${s} (move the point ${String(f).length-1} place${f>10?'s':''} right)</p>`,nudge:`<p>Multiplying by ${N(f)} moves the decimal point ${String(f).length-1} place${f>10?'s':''} to the right.</p>`});},
 cust:()=>{const L=[['pounds','ounces',16,'1 pound = 16 ounces'],['gallons','quarts',4,'1 gallon = 4 quarts'],['gallons','pints',8,'1 gallon = 4 quarts = 8 pints'],['quarts','cups',4,'1 quart = 2 pints = 4 cups'],['yards','inches',36,'1 yard = 3 feet = 36 inches'],['feet','inches',12,'1 foot = 12 inches'],['gallons','cups',16,'1 gallon = 4 quarts = 16 cups']];const [b,s,f,why]=PK(L);const n=R(2,f>100?3:9);
  return ok({prompt:'Change the units.',tpl:`${n} ${b} = {A} ${s}`,answer:n*f,text:`cust ${n}${b}`,explain:`<p>${why}.</p><p>${n} × ${N(f)} = <b>${N(n*f)}</b> ${s}</p>`,nudge:`<p>How many ${s} are in one ${b.replace(/s$/,'')}?</p>`});},
 toBig:()=>{const L=[['cm','m',100],['g','kg',1000],['mL','L',1000],['m','km',1000]];const [s,b,f]=PK(L);let v;do{v=f===100?R(11,999):10*R(11,999);}while(v%f===0);
  const val=v/f;const o=ok({prompt:'Change to the bigger unit. Use a decimal.',tpl:`${N(v)} ${s} = {A} ${b}`,text:`tb ${v}${s}`,explain:`<p>${N(f)} ${s} = 1 ${b}, so divide by ${N(f)}.</p><p>${N(v)} ÷ ${N(f)} = <b>${val}</b> ${b} (move the point ${String(f).length-1} places left)</p>`,nudge:`<p>Dividing by ${N(f)} moves the decimal point ${String(f).length-1} places to the left.</p>`});
  const cents=Math.round(val*100);return DEC(o,cents%10===0?cents/10:cents,cents%10===0?1:2);},
 wp:(c,K)=>{const k=K!=null?K:R(0,4);
  if(k===0){const L=R(2,4),u=PK([200,250,500]);return st({prompt:`Ms. Rosa has <b>${L} liters</b> of milk. Each cake uses <b>${u} mL</b>. How many cakes can she make?`,tpl:'{A} cakes',answer:L*1000/u,text:`cake ${L} ${u}`,explain:`<p>${L} L = ${N(L*1000)} mL.</p><p>${N(L*1000)} ÷ ${u} = <b>${L*1000/u}</b> cakes</p>`,nudge:`<p>Change liters to mL first.</p>`});}
  if(k===1){const y=R(2,5),p=PK([4,6,9,12]);return st({prompt:`Nana Paws has <b>${y} yards</b> of ribbon. She cuts pieces <b>${p} inches</b> long. How many pieces?`,tpl:'{A} pieces',answer:y*36/p,text:`rib ${y} ${p}`,explain:`<p>${y} yd = ${y} × 36 = ${y*36} inches.</p><p>${y*36} ÷ ${p} = <b>${y*36/p}</b> pieces</p>`,nudge:`<p>1 yard = 36 inches.</p>`});}
  if(k===2){const n=R(3,6),g=PK([250,750,500,600,400]);const o=st({prompt:`Dr. Quartz has <b>${n} crystals</b>. Each weighs <b>${g} grams</b>. How many <b>kilograms</b> do they weigh in all?`,tpl:'{A} kg',text:`cry ${n} ${g}`,explain:`<p>${n} × ${g} = ${N(n*g)} g.</p><p>${N(n*g)} g ÷ 1,000 = <b>${(n*g/1000)}</b> kg</p>`,nudge:`<p>Find the grams first, then divide by 1,000.</p>`});return DEC(o,n*g/10,2);}
  if(k===3){const a=R(21,49),b=100*R(5,19);return st({prompt:`Skyla flies <b>${D(a,1)} km</b> in the morning and <b>${N(b)} m</b> in the afternoon. How many <b>meters</b> does she fly?`,tpl:'{A} meters',answer:a*100+b,text:`sky ${a} ${b}`,explain:`<p>${D(a,1)} km = ${N(a*100)} m.</p><p>${N(a*100)} + ${N(b)} = <b>${N(a*100+b)}</b> m</p>`,nudge:`<p>Change km to m first (× 1,000).</p>`});}
  const g=R(2,5);return st({prompt:`Ozzy has <b>${g} gallons</b> of lemonade for the train riders. Each rider gets <b>1 pint</b>. How many riders get lemonade?`,tpl:'{A} riders',answer:g*8,text:`lem ${g}`,explain:`<p>1 gallon = 4 quarts = 8 pints.</p><p>${g} × 8 = <b>${g*8}</b> riders</p>`,nudge:`<p>How many pints are in 1 gallon?</p>`});},
 decArea:()=>{let a,w;do{a=R(11,59);w=R(2,9);}while(a%10===0||(a*w)%10===0);const o=ok({vis:{t:'rect',top:`${D(a,1)} m`,side:`${w} m`},prompt:'Find the area.',tpl:'{A} square meters',text:`da ${a} ${w}`,explain:`<p>${D(a,1)} × ${w}: think ${a} × ${w} = ${a*w}, then put back 1 decimal place.</p><p>= <b>${D(a*w,1)}</b> square meters</p>`,nudge:`<p>Multiply like whole numbers, then count the decimal places.</p>`});return DEC(o,a*w,1);},
 decArea2:()=>{let a,b;do{a=R(11,49);b=R(11,39);}while(a%10===0||b%10===0||(a*b)%10===0);const o=ok({vis:{t:'rect',top:`${D(a,1)} m`,side:`${D(b,1)} m`},prompt:'Find the area.',tpl:'{A} square meters',text:`da2 ${a} ${b}`,explain:`<p>${a} × ${b} = ${a*b}. There are 2 decimal places in all.</p><p>${D(a,1)} × ${D(b,1)} = <b>${D(a*b,2)}</b></p>`,nudge:`<p>Multiply like whole numbers, then put back 2 decimal places.</p>`});return DEC(o,a*b,2);},
 fracArea:()=>{const b=PK([2,3,4,5]),d=PK([2,3,4,5,6]);let a,cc;do{a=R(1,b-1);cc=R(1,d-1);}while(gcd(a,b)>1||gcd(cc,d)>1);return ok({prompt:`A tile is <b>${F(a,b)} foot</b> by <b>${F(cc,d)} foot</b>. What is its area?`,tpl:`${FA(b*d)} square foot`,answer:a*cc,text:`fa ${a}/${b} ${cc}/${d}`,explain:`<p>Area = ${F(a,b)} × ${F(cc,d)}: tops ${a} × ${cc} = ${a*cc}, bottoms ${b} × ${d} = ${b*d}.</p><p>= ${F(a*cc,b*d)}, so the top is <b>${a*cc}</b></p>`,nudge:`<p>Multiply the tops, multiply the bottoms.</p>`});},
 fracWhole:()=>{const b=PK([2,3,4]),a=b===4?PK([1,3]):R(1,b-1),w=b*R(2,6);return ok({prompt:`A garden is <b>${F(a,b)} yard</b> wide and <b>${w} yards</b> long. What is its area?`,tpl:'{A} square yards',answer:a*w/b,text:`fw ${a}/${b} ${w}`,explain:`<p>${F(a,b)} × ${w} = ${a} × ${w} ÷ ${b} = ${a*w} ÷ ${b} = <b>${a*w/b}</b></p>`,nudge:`<p>Find ${F(1,b)} of ${w} first, then multiply by ${a}.</p>`});},
 mixedArea:()=>{const w=R(1,4),h=PK([2,4,6,8]);return ok({prompt:`A rug is <b>${w} ${F(1,2)} feet</b> by <b>${h} feet</b>. What is its area?`,tpl:'{A} square feet',answer:w*h+h/2,text:`ma ${w} ${h}`,explain:`<p>${w} × ${h} = ${w*h}. ${F(1,2)} × ${h} = ${h/2}.</p><p>${w*h} + ${h/2} = <b>${w*h+h/2}</b> square feet</p>`,nudge:`<p>Multiply the whole part and the half separately, then add.</p>`});},
 decPer:()=>{let a,b;do{a=R(11,59);b=R(11,59);}while((a+b)%5===0);const o=ok({vis:{t:'rect',top:`${D(a,1)} m`,side:`${D(b,1)} m`},prompt:'Find the perimeter.',tpl:'{A} meters',text:`dp ${a} ${b}`,explain:`<p>${D(a,1)} + ${D(b,1)} = ${D(a+b,1)}.</p><p>Double it: <b>${D(2*(a+b),1)}</b> meters</p>`,nudge:`<p>Add one length and one width, then double.</p>`});return DEC(o,2*(a+b),1);}
};
/* line plots with fractions (eighths) */
function lpData(n0){let d;do{const vals=SH([1,2,3,4,5,6,7]).slice(0,4).sort((a,b)=>a-b);d=vals.map(v=>[v,R(1,4)]);}while(sum(d.map(x=>x[1]))<5);return d;}
const fr8=v=>{const g=gcd(v,8);return F(v/g,8/g);};
const lpHTML=(title,unit,d)=>`<b>${title}</b> (line plot, each ✕ is one ${unit})<br>`+d.map(([v,k])=>`${fr8(v)} : ${'✕ '.repeat(k).trim()}`).join('<br>');
const LPT=[['Water in Dr. Quartz\'s beakers (liters)','beaker','liter'],['Lengths of Skyla\'s feathers (feet)','feather','foot'],['Weights of Gizmo\'s bolts (pounds)','bolt','pound'],['Lengths of the Grey Goblin\'s stolen socks (yards)','sock','yard']];
const lp={
 total:()=>{const d=lpData();const [t,u,unit]=PK(LPT.slice(1));const [v,k]=PK(d);return ok({prompt:lpHTML(t,u,d)+`<br>What is the total of all the ${u}s that measure ${fr8(v)}?`,tpl:`${FA(8)} ${unit}`,answer:v*k,text:`lpt ${JSON.stringify(d)} ${v}`,explain:`<p>${gcd(v,8)>1?`${fr8(v)} = ${F(v,8)}. `:''}There ${k>1?'are':'is'} ${k} of them.</p><p>${k} × ${F(v,8)} = <b>${F(v*k,8)}</b></p>`,nudge:`<p>Change ${fr8(v)} into eighths, then multiply by how many ✕.</p>`,fast:25});},
 diff:()=>{const d=lpData();const [t,u,unit]=PK(LPT.slice(1));const hi=d[d.length-1][0],lo=d[0][0];return ok({prompt:lpHTML(t,u,d)+`<br>How much more is the biggest than the smallest?`,tpl:`${FA(8)} ${unit}`,answer:hi-lo,text:`lpd ${JSON.stringify(d)}`,explain:`<p>Biggest: ${F(hi,8)}. Smallest: ${F(lo,8)}.</p><p>${F(hi,8)} − ${F(lo,8)} = <b>${F(hi-lo,8)}</b></p>`,nudge:`<p>Change both to eighths, then subtract.</p>`,fast:25});},
 share:()=>{let d,n,s;do{d=lpData();n=sum(d.map(x=>x[1]));s=sum(d.map(x=>x[0]*x[1]));}while(s%n!==0);const t=LPT[0];return ok({prompt:lpHTML(t[0],t[1],d)+`<br>Dr. Quartz pours all the water together, then shares it <b>equally</b> among the ${n} beakers. How much is in each?`,tpl:`${FA(8)} liter`,answer:s/n,text:`lps ${JSON.stringify(d)}`,explain:`<p>Total in eighths: ${d.map(([v,k])=>`${k} × ${v}`).join(' + ')} = ${s} eighths = ${F(s,8)} L.</p><p>${s} ÷ ${n} = <b>${s/n}</b>, so each beaker gets ${F(s/n,8)} L.</p>`,nudge:`<p>Find the total in eighths, then divide by the number of beakers (${n}).</p>`,fast:40});},
 count:()=>{const d=lpData();const [t,u]=PK(LPT.slice(1));const c=4;const k=sum(d.filter(x=>x[0]>c).map(x=>x[1]));return ok({prompt:lpHTML(t,u,d)+`<br>How many ${u}s measure <b>more than ${F(1,2)}</b>?`,tpl:`{A} ${u}s`,answer:k,text:`lpc ${JSON.stringify(d)}`,explain:`<p>${F(1,2)} = ${F(4,8)}. Count the ✕ above values bigger than ${F(4,8)}: <b>${k}</b>.</p>`,nudge:`<p>${F(1,2)} is the same as ${F(4,8)}.</p>`});},
};
const m5L={
 seeds:c=>{const per=PK([15,25]);let l,w;do{l=R(21,69);w=R(2,6);}while(l%10===0||(l*w)%per!==0);return st({prompt:`Ms. Rosa's garden is <b>${D(l,1)} m</b> by <b>${w} m</b>. One pack of seeds covers <b>${D(per,1)} square meters</b>. How many packs does she need?`,tpl:'{A} packs',answer:l*w/per,text:`seed ${l} ${w} ${per}`,explain:`<p>Area: ${D(l,1)} × ${w} = ${dstr(l*w,1)} square meters.</p><p>${dstr(l*w,1)} ÷ ${D(per,1)} = <b>${l*w/per}</b> packs</p>`,nudge:`<p>Step 1: area. Step 2: divide by what one pack covers.</p>`,fast:40});},
 box:c=>{const n=R(4,12),g=PK([250,150,500,200,350]),b=PK([500,250,1000,750]);const tot=n*g+b;const o=st({prompt:`Dr. Quartz packs <b>${n} crystals</b> of <b>${g} g</b> each into a box that weighs <b>${N(b)} g</b>. How many <b>kilograms</b> is the full box?`,tpl:'{A} kg',text:`box ${n} ${g} ${b}`,explain:`<p>${n} × ${g} = ${N(n*g)} g. Plus the box: ${N(n*g)} + ${N(b)} = ${N(tot)} g.</p><p>${N(tot)} ÷ 1,000 = <b>${tot/1000}</b> kg</p>`,nudge:`<p>Find all the grams, then change to kilograms (÷ 1,000).</p>`,fast:40});return DEC(o,tot/10,2);},
 wire:c=>{const m=R(2,6),p=PK([4,5,8]);if((m*100)%p)return m5L.wire(c);return st({prompt:`Gizmo has <b>${m} m</b> of wire. He cuts it into <b>${p} equal pieces</b>. How many <b>centimeters</b> long is each piece?`,tpl:'{A} cm',answer:m*100/p,text:`wire ${m} ${p}`,explain:`<p>${m} m = ${m*100} cm.</p><p>${m*100} ÷ ${p} = <b>${m*100/p}</b> cm</p>`,nudge:`<p>Change to centimeters first, then divide.</p>`,fast:30});},
 sky:c=>{const a=R(11,39),b=R(11,29),d=R(3,6);if(a%10===0||b%10===0)return m5L.sky(c);const o=st({prompt:`Skyla flies <b>${D(a,1)} km</b> every morning and <b>${D(b,1)} km</b> every evening. How far does she fly in <b>${d} days</b>?`,tpl:'{A} km',text:`sky ${a} ${b} ${d}`,explain:`<p>One day: ${D(a,1)} + ${D(b,1)} = ${D(a+b,1)} km.</p><p>${d} × ${D(a+b,1)} = <b>${dstr((a+b)*d,1)}</b> km</p>`,nudge:`<p>Find one day's distance first.</p>`,fast:35});return DEC(o,(a+b)*d,1);},
 batches:c=>{const q=R(2,5),u=PK([[1,2,2],[1,4,4],[1,3,3]]);const cups=q*4;return st({prompt:`Ms. Rosa has <b>${q} quarts</b> of milk. Each batch of pancakes uses <b>${F(u[0],u[1])} cup</b>. How many batches can she make? (1 quart = 4 cups)`,tpl:'{A} batches',answer:cups*u[2],text:`pan ${q} ${u[1]}`,explain:`<p>${q} quarts = ${cups} cups.</p><p>Each cup makes ${u[2]} batches: ${cups} ÷ ${F(1,u[1])} = ${cups} × ${u[2]} = <b>${cups*u[2]}</b></p>`,nudge:`<p>Change quarts to cups. How many ${F(1,u[1])}-cups fit in 1 cup?</p>`,fast:40});}
};
DEF('meas',5,[
 [m5.dec,m5.cust,m5.toBig,m5.dec],
 [c=>m5.wp(c,0),c=>m5.wp(c,1),c=>m5.wp(c,3),c=>m5.wp(c,4),m5x.bottle,m5.cust,m5x.yarn,r5.shelf],
 [m5.decArea,m5.fracArea,m5.fracWhole,m5.mixedArea,m5.decPer],
 [K('lp',lp.total),K('lp',lp.diff),K('lpS',lp.share),K('lp',lp.count),m5.decArea2,r3.mConv5,K('lp',r4.lpMore),r6.areaMix],
 [m5L.seeds,m5L.box,m5x.wire3,m5L.sky,m5L.batches,r4.lpMore,r3.flour5,r3.fence5]]);

/* =================================== 📊 GRAPH GARDEN =================================== */
const GT=[{t:'Cookies Ms. Rosa sold',u:'cookies',e:'🍪',c:['Mon','Tue','Wed','Thu']},{t:'Laps Coach Flex ran',u:'laps',e:'🏃',c:['Mon','Tue','Wed','Thu']},
 {t:'Socks the Grey Goblin stole',u:'socks',e:'🧦',c:['Red','Blue','Green','Pink']},{t:'Crystals Dr. Quartz found',u:'crystals',e:'💎',c:['Cave','River','Hill','Beach']},
 {t:'Dogs Nana Paws walked',u:'dogs',e:'🐕',c:['Mon','Tue','Wed','Thu']},{t:'Gadgets Gizmo built',u:'gadgets',e:'⚙️',c:['June','July','Aug','Sept']},
 {t:"Riders on Ozzy's train",u:'riders',e:'🚂',c:['Car 1','Car 2','Car 3','Car 4']},{t:'Favorite snack votes',u:'votes',e:'⭐',c:['Apples','Popcorn','Grapes','Carrots']},
 {t:'Feathers Skyla dropped',u:'feathers',e:'🪶',c:['Mon','Tue','Wed','Thu']},{t:"Coins in Grumbleroot's toll box",u:'coins',e:'🪙',c:['Mon','Tue','Wed','Thu']},
 {t:'Favorite pet votes',u:'votes',e:'🐾',c:['Dogs','Cats','Fish','Birds']}];
function gMake(o){const th=PK(o.only?GT.filter(x=>o.only.includes(x.u)):GT);const nc=o.nc||PK([3,4]);const cats=th.c.slice(0,nc);const unit=o.unit;const vals=[];let g=0;
 while(vals.length<nc&&g++<500){let v=R(o.minU||1,o.maxU)*unit;if(o.half&&Math.random()<.5)v-=unit/2;if(v>0&&!vals.includes(v))vals.push(v);}
 const data=cats.map((c,i)=>[c,vals[i]]);const hasHalf=vals.some(v=>v%unit);
 const vis=o.bar?{t:'bgraph',title:th.t,cats:data,scale:unit,max:(Math.ceil(Math.max(...vals)/unit)+1)*unit}:{t:'pgraph',title:th.t,e:th.e,key:unit,u:th.u,rows:data};
 const read=o.bar?`<p>Go to the top of each bar, then slide across to the numbers on the side${unit>1?` (they go up by ${unit})`:''}.${hasHalf?' A bar that stops halfway between two lines is the number in the middle.':''}</p>`:(unit===1?`<p>Each ${th.e} is 1, so count the pictures.</p>`:`<p>Each ${th.e} stands for <b>${unit}</b>, so skip-count by ${unit}s${hasHalf?`. Half a picture is ${unit/2}`:''}.</p>`);
 const hint=o.bar?`The numbers on the side go up by ${unit}.`:`Check the key: each ${th.e} = ${unit}.`;
 const two=()=>{const [a,b]=SH(data).slice(0,2);return a[1]>=b[1]?[a,b]:[b,a];};
 return {th,data,vis,read,hint,two,unit,vals};}
const gq={
 read:o=>c=>{const g=gMake(o);const [n,v]=PK(g.data);return ok({vis:g.vis,prompt:`How many ${g.th.u} for <b>${n}</b>?`,tpl:`{A} ${g.th.u}`,answer:v,text:`read ${JSON.stringify(g.data)} ${n}`,explain:g.read+`<p>${n}: <b>${v}</b></p>`,nudge:`<p>${g.hint}</p>`});},
 most:o=>c=>{const g=gMake(o);const least=Math.random()<.4;const best=g.data.reduce((a,b)=>(least?b[1]<a[1]:b[1]>a[1])?b:a);return choice(ok({vis:g.vis,prompt:`Which has the <b>${least?'fewest':'most'}</b> ${g.th.u}?`,tpl:'{A}',text:`most ${least} ${JSON.stringify(g.data)}`,explain:`<p>The ${o.bar?(least?'shortest bar':'tallest bar'):(least?'shortest row':'longest row')} is <b>${best[0]}</b> (${best[1]}).</p>`,nudge:`<p>Look for the ${o.bar?(least?'shortest bar':'tallest bar'):(least?'shortest row':'longest row')}.</p>`}),best[0],g.data.map(x=>x[0]).filter(x=>x!==best[0]));},
 more:o=>c=>{const g=gMake(o);const [hi,lo]=g.two();const few=Math.random()<.4;return ok({vis:g.vis,prompt:few?`How many <b>fewer</b> ${g.th.u} for ${lo[0]} than ${hi[0]}?`:`How many <b>more</b> ${g.th.u} for ${hi[0]} than ${lo[0]}?`,tpl:few?'{A} fewer':'{A} more',answer:hi[1]-lo[1],text:`more ${few} ${JSON.stringify(g.data)} ${hi[0]}${lo[0]}`,explain:g.read+`<p>${hi[0]} = ${hi[1]}, ${lo[0]} = ${lo[1]}.</p><p>${hi[1]} − ${lo[1]} = <b>${hi[1]-lo[1]}</b></p>`,nudge:`<p>${g.hint} Then subtract: big − small.</p>`});},
 both:o=>c=>{const g=gMake(o);const [a,b]=g.two();return ok({vis:g.vis,prompt:`How many ${g.th.u} for ${a[0]} and ${b[0]} <b>together</b>?`,tpl:`{A} ${g.th.u}`,answer:a[1]+b[1],text:`both ${JSON.stringify(g.data)} ${a[0]}${b[0]}`,explain:g.read+`<p>${a[1]} + ${b[1]} = <b>${a[1]+b[1]}</b></p>`,nudge:`<p>${g.hint} Then add the two.</p>`});},
 all:o=>c=>{const g=gMake(o);const s=sum(g.vals);return ok({vis:g.vis,prompt:`How many ${g.th.u} <b>in all</b>?`,tpl:`{A} ${g.th.u}`,answer:s,text:`all ${JSON.stringify(g.data)}`,explain:g.read+`<p>${g.vals.join(' + ')} = <b>${s}</b></p>`,nudge:`<p>${g.hint} Read every one, then add them all.</p>`,fast:20});},
 pics:o=>c=>{const g=gMake(o);const k=g.unit;const n=R(2,8)+(o.half?PK([0,0.5]):0);const v=n*k;if(v%1)return gq.pics(o)(c);const full=Math.floor(n),half=n%1?1:0;
  return ok({vis:g.vis,prompt:`On Friday there were <b>${v}</b> ${g.th.u}. How many ${g.th.e} should be drawn for Friday?${half?' (A half picture counts as a half; type the whole pictures.)':''}`,tpl:half?`{A} and a half ${g.th.e}`:`{A} ${g.th.e}`,answer:full,text:`pics ${k} ${v}`,explain:`<p>Each ${g.th.e} = ${k}. ${v} ÷ ${k} = <b>${full}</b>${half?` and a half (${full} × ${k} = ${full*k}, plus ${k/2})`:''}.</p>`,nudge:`<p>How many ${k}s make ${v}? Skip-count by ${k}s.</p>`});},
 two:o=>c=>{const g=gMake(Object.assign({},o,{nc:4}));const [A,B,C]=SH(g.data);const s=A[1]+B[1];if(s===C[1])return gq.two(o)(c);const [big,small,bn,sn]=s>C[1]?[s,C[1],`${A[0]} and ${B[0]} together`,C[0]]:[C[1],s,C[0],`${A[0]} and ${B[0]} together`];
  return st({vis:g.vis,prompt:`How many more ${g.th.u} for <b>${bn}</b> than for <b>${sn}</b>?`,tpl:'{A} more',answer:big-small,text:`two ${JSON.stringify(g.data)} ${A[0]}${B[0]}`,explain:g.read+`<p>${A[0]} + ${B[0]} = ${A[1]} + ${B[1]} = ${s}. ${C[0]} = ${C[1]}.</p><p>${big} − ${small} = <b>${big-small}</b></p>`,nudge:`<p>Step 1: add ${A[0]} and ${B[0]}. Step 2: compare with ${C[0]}.</p>`,fast:30});},
 tie:o=>c=>{const g=gMake(o);const [hi,lo]=g.two();return st({vis:g.vis,prompt:`How many more ${g.th.u} would make <b>${lo[0]}</b> equal to <b>${hi[0]}</b>?`,tpl:'{A} more',answer:hi[1]-lo[1],text:`tie ${JSON.stringify(g.data)}`,explain:g.read+`<p>${lo[0]} has ${lo[1]}. ${hi[0]} has ${hi[1]}.</p><p>${lo[1]} + <b>${hi[1]-lo[1]}</b> = ${hi[1]}</p>`,nudge:`<p>Count up from ${lo[0]}'s number to ${hi[0]}'s number.</p>`});},
 goal:o=>c=>{const g=gMake(o);const [n,v]=PK(g.data);const goal=v+g.unit*R(2,6);return st({vis:g.vis,prompt:`The goal for <b>${n}</b> was <b>${goal}</b> ${g.th.u}. How many more were needed to reach the goal?`,tpl:'{A} more',answer:goal-v,text:`goal ${JSON.stringify(g.data)} ${n} ${goal}`,explain:g.read+`<p>${n} = ${v}.</p><p>${goal} − ${v} = <b>${goal-v}</b></p>`,nudge:`<p>Read ${n}, then find how far it is from ${goal}.</p>`});},
 left:o=>c=>{const g=gMake(o);const [a,b]=g.two();const gone=R(2,Math.max(2,a[1]+b[1]-1));return st({vis:g.vis,prompt:`Add the ${g.th.u} for <b>${a[0]}</b> and <b>${b[0]}</b>. Then <b>${gone}</b> of them are taken away. How many ${g.th.u} are left?`,tpl:`{A} ${g.th.u}`,answer:a[1]+b[1]-gone,text:`left ${JSON.stringify(g.data)} ${gone}`,explain:g.read+`<p>${a[1]} + ${b[1]} = ${a[1]+b[1]}.</p><p>${a[1]+b[1]} − ${gone} = <b>${a[1]+b[1]-gone}</b></p>`,nudge:`<p>Step 1: add the two. Step 2: take away ${gone}.</p>`});},
 price:o=>c=>{const g=gMake(Object.assign({},o,{only:['cookies','laps','riders','gadgets','dogs','socks']}));const th=g.th;const [n,v]=PK(g.data);const p=R(2,5);
  const M={cookies:[`Ms. Rosa sells each cookie for <b>$${p}</b>. How much money did she get on <b>${n}</b>?`,'$ {A}','dollars'],laps:[`Coach Flex earns <b>${p} stars</b> for each lap. How many stars did he earn on <b>${n}</b>?`,'{A} stars','stars'],
   riders:[`Each rider pays Ozzy <b>${p} tickets</b>. How many tickets were paid in <b>${n}</b>?`,'{A} tickets','tickets'],gadgets:[`Each gadget needs <b>${p} batteries</b>. How many batteries did Gizmo need in <b>${n}</b>?`,'{A} batteries','batteries'],
   dogs:[`Nana Paws gives each dog <b>${p} treats</b>. How many treats did she give on <b>${n}</b>?`,'{A} treats','treats'],socks:[`Each stolen sock has <b>${p} holes</b>. How many holes are in the <b>${n}</b> socks?`,'{A} holes','holes']}[th.u];
  return st({vis:g.vis,prompt:M[0],tpl:M[1],answer:v*p,text:`price ${JSON.stringify(g.data)} ${n} ${p}`,explain:g.read+`<p>${n} = ${v}.</p><p>${v} × ${p} = <b>${v*p}</b> ${M[2]}</p>`,nudge:`<p>Read ${n} on the graph, then multiply by ${p}.</p>`});}
};
const S1={unit:1,maxU:8},B1={bar:true,unit:1,maxU:9};
PLAN.def('graph',2,[
 [gq.read(S1),gq.most(S1),gq.both(S1),gq.read(B1)],
 [gq.more(S1),gq.read(B1),gq.both(B1),gq.all(S1)],
 [gq.more(B1),gq.all(B1),gq.tie(S1),gq.most(B1),gq.left(S1)],
 [gq.all(Object.assign({nc:4},B1)),gq.more(B1),gq.tie(B1),gq.two(B1),gq.left(B1)],
 [gq.goal(B1),gq.two(S1),gq.left(B1),gq.tie(B1),gq.goal(S1)]]);
const K2={unit:2,maxU:7,half:true},Bs2={bar:true,unit:2,maxU:8,half:true},K5={unit:5,maxU:7},Bs5={bar:true,unit:5,maxU:8},K10={unit:10,maxU:6,half:true},Bs10={bar:true,unit:10,maxU:8,half:true},K4={unit:4,maxU:6,half:true};
PLAN.def('graph',3,[
 [gq.read(K2),gq.more(K2),gq.read(Bs2),gq.pics({unit:2,maxU:7})],
 [gq.read(Bs5),gq.read(K5),gq.more(Bs5),gq.read(K10),gq.both(K5)],
 [gq.more(K10),gq.read(Bs10),gq.all(K5),gq.more(Bs10),gq.pics({unit:5,maxU:7})],
 [gq.two(Bs5),gq.more(Bs10),gq.two(K10),gq.pics({unit:10,maxU:6,half:true}),gq.both(K10),gq.all(Bs10)],
 [gq.price(K5),gq.goal(Bs10),gq.two(K2),gq.tie(K10),gq.price(Bs5)]]);

/* ---------- grade 4: tables and line plots ---------- */
const TB=[['Push-ups Coach Flex did','push-ups',['Mon','Tue','Wed','Thu','Fri'],[25,95]],['Visitors at Ms. Rosa\'s café','visitors',['Mon','Tue','Wed','Thu','Fri'],[120,480]],
 ['Miles Skyla flew','miles',['Week 1','Week 2','Week 3','Week 4'],[40,160]],['Riders on Ozzy\'s train','riders',['Mon','Tue','Wed','Thu','Fri'],[150,600]],
 ['Pages the Elder Wiz read','pages',['Mon','Tue','Wed','Thu','Fri'],[30,90]],['Coins in Grumbleroot\'s toll box','coins',['Mon','Tue','Wed','Thu','Fri'],[200,900]]];
function tMake(n){const [t,u,days,[lo,hi]]=PK(TB);const pre=/Week/.test(days[0])?'in':'on';const k=n||PK([4,5]);const d=days.slice(0,k).map(x=>[x,lo>=100?10*R(lo/10,hi/10):R(lo,hi)]);
 const html=`<b>${t}</b><table style="margin:4px auto;border-collapse:collapse">`+d.map(([a,b])=>`<tr><td style="padding:1px 12px;border:1px solid #c9c2e8">${a}</td><td style="padding:1px 12px;border:1px solid #c9c2e8;text-align:right">${N(b)}</td></tr>`).join('')+'</table>';
 return {t,u,d,html,pre};}
const tq={
 read:()=>{const T0=tMake();const [a,b]=PK(T0.d);const big=T0.d.reduce((x,y)=>y[1]>x[1]?y:x);if(Math.random()<.4)return choice(ok({prompt:T0.html+`Which had the <b>most</b> ${T0.u}?`,tpl:'{A}',text:`tmost ${JSON.stringify(T0.d)}`,explain:`<p>The biggest number is ${N(big[1])}, for <b>${big[0]}</b>.</p>`,nudge:`<p>Compare the numbers. Look at the biggest place first.</p>`}),big[0],T0.d.map(x=>x[0]).filter(x=>x!==big[0]));
  return ok({prompt:T0.html+`How many ${T0.u} ${T0.pre} <b>${a}</b>?`,tpl:`{A} ${T0.u}`,answer:b,text:`tread ${JSON.stringify(T0.d)} ${a}`,explain:`<p>Find the row for ${a}: <b>${N(b)}</b>.</p>`,nudge:`<p>Find ${a} in the table and read across.</p>`});},
 diff:()=>{const T0=tMake();const [x,y]=SH(T0.d);const [hi,lo]=x[1]>=y[1]?[x,y]:[y,x];if(hi[1]===lo[1])return tq.diff();return ok({prompt:T0.html+`How many more ${T0.u} ${T0.pre} <b>${hi[0]}</b> than ${T0.pre} <b>${lo[0]}</b>?`,tpl:'{A} more',answer:hi[1]-lo[1],text:`tdiff ${JSON.stringify(T0.d)} ${hi[0]}${lo[0]}`,explain:`<p>${N(hi[1])} − ${N(lo[1])} = <b>${N(hi[1]-lo[1])}</b></p>`,nudge:`<p>Find both numbers, then subtract.</p>`});},
 total:()=>{const T0=tMake(PK([3,4]));const s=sum(T0.d.map(x=>x[1]));return ok({prompt:T0.html+`How many ${T0.u} in all?`,tpl:`{A} ${T0.u}`,answer:s,text:`ttot ${JSON.stringify(T0.d)}`,explain:`<p>${T0.d.map(x=>N(x[1])).join(' + ')} = <b>${N(s)}</b></p>`,nudge:`<p>Add every row. Line up the places.</p>`,fast:30});},
 two:()=>{const T0=tMake(4);const [A,B,C]=SH(T0.d);const s=A[1]+B[1];if(s===C[1])return tq.two();const [big,small]=s>C[1]?[s,C[1]]:[C[1],s];return st({prompt:T0.html+`How many more ${T0.u} were there ${T0.pre} ${s>C[1]?`<b>${A[0]} and ${B[0]} together</b> than ${T0.pre} <b>${C[0]}</b>`:`<b>${C[0]}</b> than ${T0.pre} <b>${A[0]} and ${B[0]} together</b>`}?`,tpl:'{A} more',answer:big-small,text:`ttwo ${JSON.stringify(T0.d)} ${A[0]}${B[0]}`,explain:`<p>${A[0]} + ${B[0]} = ${N(A[1])} + ${N(B[1])} = ${N(s)}.</p><p>${N(big)} − ${N(small)} = <b>${N(big-small)}</b></p>`,nudge:`<p>Step 1: add the two days. Step 2: compare.</p>`,fast:35});},
 goal:c=>{const T0=tMake(PK([3,4]));const s=sum(T0.d.map(x=>x[1]));const step=T0.d[0][1]>=100?100:10;const goal=Math.ceil((s+step)/step)*step+step*R(0,3);return st({prompt:T0.html+`The goal for the week is <b>${N(goal)}</b> ${T0.u}. How many more are needed to reach the goal?`,tpl:'{A} more',answer:goal-s,text:`tgoal ${JSON.stringify(T0.d)} ${goal}`,explain:`<p>So far: ${T0.d.map(x=>N(x[1])).join(' + ')} = ${N(s)}.</p><p>${N(goal)} − ${N(s)} = <b>${N(goal-s)}</b></p>`,nudge:`<p>Step 1: add up the table. Step 2: subtract from the goal.</p>`,fast:40});}
};
/* line plots: values counted in 1/den */
function mkLP(den,opts){const plu=u=>u==='foot'?'feet':u+'s';const frd=v=>{if(v===den)return '1';const g=gcd(v,den);return F(v/g,den/g);};
 const data=()=>{let d;do{const vals=SH(Array.from({length:den},(_,i)=>i+1)).slice(0,Math.min(4,den)).sort((a,b)=>a-b);d=vals.map(v=>[v,R(1,4)]);}while(sum(d.map(x=>x[1]))<5);return d;};
 const html=(t,u,d)=>`<b>${t}</b><br><small>(line plot: each ✕ is one ${u})</small><br>`+d.map(([v,k])=>`${frd(v)} : ${'✕ '.repeat(k).trim()}`).join('<br>');
 const TH=[["Lengths of Skyla's feathers (feet)",'feather','foot'],["Weights of Gizmo's bolts (pounds)",'bolt','pound'],["Lengths of the Grey Goblin's stolen socks (yards)",'sock','yard'],["Lengths of Nana Paws's yarn scraps (yards)",'scrap','yard'],["Water in Dr. Quartz's beakers (liters)",'beaker','liter']];
 const nm=den===4?'fourths':'eighths';
 return {
 count:()=>{const d=data();const [t,u]=PK(TH);const half=den/2;const k=sum(d.filter(x=>x[0]>half).map(x=>x[1]));return ok({prompt:html(t,u,d)+`<br>How many ${u}s measure <b>more than ${F(1,2)}</b>?`,tpl:`{A} ${u}s`,answer:k,text:`lpc${den} ${JSON.stringify(d)}`,explain:`<p>${F(1,2)} = ${F(half,den)}. Count the ✕ above numbers bigger than that: <b>${k}</b>.</p>`,nudge:`<p>${F(1,2)} is the same as ${F(half,den)}. Count the ✕ for the bigger ones.</p>`});},
 diff:()=>{const d=data();const [t,u,unit]=PK(TH);const hi=d[d.length-1][0],lo=d[0][0];return ok({prompt:html(t,u,d)+`<br>How much longer or heavier is the biggest ${u} than the smallest?`.replace('longer or heavier',/pound/.test(unit)?'heavier':/liter/.test(unit)?'more':'longer'),tpl:`${FA(den)} ${unit}`,answer:hi-lo,text:`lpd${den} ${JSON.stringify(d)}`,explain:`<p>Biggest: ${frd(hi)} = ${F(hi,den)}. Smallest: ${frd(lo)} = ${F(lo,den)}.</p><p>${F(hi,den)} − ${F(lo,den)} = <b>${F(hi-lo,den)}</b></p>`,nudge:`<p>Write both in ${nm}, then subtract the tops.</p>`,fast:25});},
 total:()=>{const d=data();const [t,u,unit]=PK(TH);const [v,k]=PK(d.filter(x=>x[1]>1).concat(d.length?[]:[]))||d[0];return ok({prompt:html(t,u,d)+`<br>Put all the ${u}s that measure ${frd(v)} together. What is their total?`,tpl:`${FA(den)} ${plu(unit)}`,answer:v*k,text:`lpt${den} ${JSON.stringify(d)} ${v}`,explain:`<p>${frd(v)} = ${F(v,den)}, and there are ${k} of them.</p><p>${Array(k).fill(F(v,den)).join(' + ')} = <b>${F(v*k,den)}</b></p>`,nudge:`<p>Write ${frd(v)} in ${nm}. Add it once for each ✕.</p>`,fast:25});},
 pair:()=>{const d=data();const [t,u,unit]=PK(TH);const [a,b]=SH(d).slice(0,2);return ok({prompt:html(t,u,d)+`<br>Take one ${u} that measures ${frd(a[0])} and one that measures ${frd(b[0])}. What is their total?`,tpl:`${FA(den)} ${plu(unit)}`,answer:a[0]+b[0],text:`lpp${den} ${JSON.stringify(d)} ${a[0]}${b[0]}`,explain:`<p>${frd(a[0])} = ${F(a[0],den)}, ${frd(b[0])} = ${F(b[0],den)}.</p><p>${a[0]} + ${b[0]} = <b>${a[0]+b[0]}</b>, so ${F(a[0]+b[0],den)}</p>`,nudge:`<p>Write both in ${nm}, then add the tops.</p>`});},
 all:()=>{let d,s;do{d=data();s=sum(d.map(x=>x[0]*x[1]));}while(s>4*den);const [t,u,unit]=PK(TH);return st({prompt:html(t,u,d)+`<br>${/liter/.test(unit)?'All the water is poured into one big jug':`All the ${u}s are put together`}. What is the total?`,tpl:`${FA(den)} ${plu(unit)}`,answer:s,text:`lpa${den} ${JSON.stringify(d)}`,explain:`<p>In ${nm}: ${d.map(([v,k])=>`${k} × ${v}`).join(' + ')} = <b>${s}</b>, so ${F(s,den)}.</p>`,nudge:`<p>Write each value in ${nm}, multiply by its number of ✕, then add.</p>`,fast:45});},
 share:()=>{let d,n,s;do{d=data();n=sum(d.map(x=>x[1]));s=sum(d.map(x=>x[0]*x[1]));}while(s%n!==0);return st({prompt:html(TH[4][0],'beaker',d)+`<br>Dr. Quartz pours all the water together, then shares it <b>equally</b> among the ${n} beakers. How much is in each?`,tpl:`${FA(den)} liter`,answer:s/n,text:`lps${den} ${JSON.stringify(d)}`,explain:`<p>Total in ${nm}: ${d.map(([v,k])=>`${k} × ${v}`).join(' + ')} = ${s}.</p><p>${s} ÷ ${n} = <b>${s/n}</b>, so each beaker gets ${F(s/n,den)} L.</p>`,nudge:`<p>Find the total in ${nm}, then divide by the number of beakers (${n}).</p>`,fast:45});}};}
const L4=mkLP(4),L8=mkLP(8);
PLAN.def('graph',4,[
 [tq.read,tq.diff,tq.total,tq.read],
 [L4.count,L4.diff,L4.total,L4.pair,tq.diff],
 [L8.diff,L8.total,L8.count,L8.pair,tq.total],
 [tq.two,L8.diff,L8.total,L4.all,tq.goal],
 [tq.goal,tq.two,L8.all,L4.all,L8.diff]]);

/* ---------- grade 5: coordinate plane and line plots ---------- */
const cq={
 move:()=>{const a=R(1,9),b=R(1,9),y=Math.random()<.5;return ok({prompt:`Start at (0, 0). Go <b>right ${a}</b> and <b>up ${b}</b>. What is the ${y?'<b>y</b>':'<b>x</b>'}-coordinate of the point?`,tpl:y?`(${a}, {A})`:`({A}, ${b})`,answer:y?b:a,text:`mv ${a} ${b} ${y}`,explain:`<p>The first number (x) is how far <b>right</b>. The second number (y) is how far <b>up</b>.</p><p>The point is (${a}, ${b}), so ${y?'y':'x'} = <b>${y?b:a}</b>.</p>`,nudge:`<p>(x, y): x is across, y is up.</p>`,fast:10});},
 read:()=>{const a=R(0,9),b=R(0,9);const y=Math.random()<.5;return ok({prompt:`Point P is at <b>(${a}, ${b})</b>. Starting from (0, 0), how many units do you go ${y?'<b>up</b>':'<b>right</b>'}?`,tpl:'{A} units',answer:y?b:a,text:`rd ${a} ${b} ${y}`,explain:`<p>In (${a}, ${b}) the first number is right, the second is up. So you go ${y?'up':'right'} <b>${y?b:a}</b>.</p>`,nudge:`<p>"Across the hall, then up the stairs": x first, then y.</p>`,fast:10});},
 step:()=>{const a=R(1,7),b=R(1,7),dx=R(1,5),dy=R(1,5);const y=Math.random()<.5;return ok({prompt:`Start at <b>(${a}, ${b})</b>. Go right ${dx} and up ${dy}. Where do you land?`,tpl:y?`(${a+dx}, {A})`:`({A}, ${b+dy})`,answer:y?b+dy:a+dx,text:`st ${a}${b}${dx}${dy}${y}`,explain:`<p>Right changes x: ${a} + ${dx} = ${a+dx}. Up changes y: ${b} + ${dy} = ${b+dy}.</p><p>You land on (${a+dx}, ${b+dy}), so the answer is <b>${y?b+dy:a+dx}</b>.</p>`,nudge:`<p>Right adds to x. Up adds to y.</p>`});},
 dist:()=>{const sx=Math.random()<.5;const k=R(0,9),p=R(0,6),q=p+R(2,8);const A=sx?`(${k}, ${p})`:`(${p}, ${k})`,B=sx?`(${k}, ${q})`:`(${q}, ${k})`;return ok({prompt:`How far apart are the points <b>${A}</b> and <b>${B}</b>?`,tpl:'{A} units',answer:q-p,text:`ds ${A}${B}`,explain:`<p>The ${sx?'x-coordinates':'y-coordinates'} are the same (${k}), so the points are on one ${sx?'up-and-down':'across'} line.</p><p>${q} − ${p} = <b>${q-p}</b> units</p>`,nudge:`<p>Which number is the same? Subtract the other numbers.</p>`});},
 pattern:()=>{const a=R(1,4),b=R(2,6);if(a===b)return cq.pattern();const k=R(4,8);const pts=[0,1,2,3].map(i=>`(${i*a}, ${i*b})`).join(', ');return ok({prompt:`Rule for x: start at 0, <b>add ${a}</b>. Rule for y: start at 0, <b>add ${b}</b>.<br>Points: ${pts}, …<br>When x is <b>${k*a}</b>, what is y?`,tpl:`(${k*a}, {A})`,answer:k*b,text:`pt ${a} ${b} ${k}`,explain:`<p>x = ${k*a} after ${k*a} ÷ ${a} = ${k} steps.</p><p>After ${k} steps, y = ${k} × ${b} = <b>${k*b}</b>.</p>`,nudge:`<p>How many steps does it take x to reach ${k*a}? y takes the same number of steps.</p>`,fast:25});},
 table:()=>{const m=R(2,6),add=PK([0,0,1,2,3]);const xs=[1,2,3,4],x=R(5,9);const f=v=>m*v+add;return ok({prompt:`The points follow a pattern: ${xs.map(v=>`(${v}, ${f(v)})`).join(', ')}.<br>What is y when x is <b>${x}</b>?`,tpl:`(${x}, {A})`,answer:f(x),text:`tb ${m} ${add} ${x}`,explain:`<p>Each time x goes up 1, y goes up ${m}.${add?` And y = ${m} × x + ${add}.`:` So y = ${m} × x.`}</p><p>${m} × ${x}${add?` + ${add}`:''} = <b>${f(x)}</b></p>`,nudge:`<p>How much does y grow each time x grows by 1?</p>`,fast:25});},
 rect:()=>{const x1=R(0,4),y1=R(0,4),x2=x1+R(2,6),y2=y1+R(2,6);const pts=[[x1,y1],[x2,y1],[x2,y2],[x1,y2]];const miss=R(0,3);const m=pts[miss];const askY=Math.random()<.5;const shown=pts.filter((_,i)=>i!==miss).map(p=>`(${p[0]}, ${p[1]})`).join(', ');
  return ok({prompt:`A rectangle has corners at <b>${shown}</b>. Where is the fourth corner?`,tpl:askY?`(${m[0]}, {A})`:`({A}, ${m[1]})`,answer:askY?m[1]:m[0],text:`rc ${shown} ${askY}`,explain:`<p>A rectangle's corners line up: two share each x and two share each y.</p><p>The missing corner is (${m[0]}, ${m[1]}), so the answer is <b>${askY?m[1]:m[0]}</b>.</p>`,nudge:`<p>Which x and which y are only used once so far?</p>`,fast:20});},
 robot:c=>{const a=R(1,5),b=R(1,5),r=R(2,6),u=R(3,7),d=R(1,u-1);const y=Math.random()<.5;const fx=a+r,fy=b+u-d;return st({prompt:`Gizmo's robot starts at <b>(${a}, ${b})</b>. It rolls <b>right ${r}</b>, then <b>up ${u}</b>, then <b>down ${d}</b>. Where does it stop?`,tpl:y?`(${fx}, {A})`:`({A}, ${fy})`,answer:y?fy:fx,text:`rb ${a}${b}${r}${u}${d}${y}`,explain:`<p>x: ${a} + ${r} = ${fx}.</p><p>y: ${b} + ${u} − ${d} = ${fy}.</p><p>It stops at (${fx}, ${fy}), so the answer is <b>${y?fy:fx}</b>.</p>`,nudge:`<p>Right/left change x. Up/down change y.</p>`});},
 perim:c=>{const x1=R(0,4),y1=R(0,4),w=R(2,7),h=R(2,7);const [who,what]=PK([['Ms. Rosa','garden'],['Nana Paws','dog yard'],['Dr. Quartz','crystal field'],['Grumbleroot','goat pen']]);
  return st({prompt:`On a map, ${who}'s ${what} is a rectangle with corners at <b>(${x1}, ${y1})</b>, <b>(${x1+w}, ${y1})</b>, <b>(${x1+w}, ${y1+h})</b> and <b>(${x1}, ${y1+h})</b>. Each unit is 1 meter. How many meters of fence go around it?`,tpl:'{A} meters',answer:2*(w+h),text:`pr ${x1}${y1}${w}${h}`,explain:`<p>Across: ${x1+w} − ${x1} = ${w}. Up: ${y1+h} − ${y1} = ${h}.</p><p>Perimeter: ${w} + ${h} + ${w} + ${h} = <b>${2*(w+h)}</b> meters</p>`,nudge:`<p>Find the length and width by subtracting coordinates, then add all 4 sides.</p>`,fast:40});},
 flight:c=>{const a=R(0,3),b=R(0,3),r1=R(2,5),u1=R(2,5),r2=R(1,4);const k=Math.random()<.5;return st({prompt:`Skyla flies from her nest at <b>(${a}, ${b})</b>: right ${r1}, up ${u1}, then right ${r2} more. How many units did she fly in all?`,tpl:'{A} units',answer:r1+u1+r2,text:`fl ${a}${b}${r1}${u1}${r2}`,explain:`<p>Add every part of the trip: ${r1} + ${u1} + ${r2} = <b>${r1+u1+r2}</b> units.</p><p>(She lands at (${a+r1+r2}, ${b+u1}).)</p>`,nudge:`<p>Add up each part of the flight.</p>`});}
};
PLAN.def('graph',5,[
 [cq.move,cq.read,cq.step,L8.count],
 [cq.dist,cq.step,cq.rect,L8.diff,cq.move],
 [cq.pattern,cq.table,cq.dist,L8.total,cq.rect],
 [L8.share,L8.all,cq.table,cq.pattern,cq.rect,cq.dist],
 [cq.robot,cq.perim,cq.flight,L8.share,cq.pattern]]);

/* =================================== 🎯 ESTIMATION STATION =================================== */
const rnd=(v,to)=>Math.round(v/to)*to; /* positive v: halfway rounds up */
const notM=(a,b,to)=>{let v;do{v=R(a,b);}while(v%to===0);return v;};
const PLACE={10:'ten',100:'hundred',1000:'thousand',10000:'ten thousand',100000:'hundred thousand'};
function roundQ(v,to,vis){const lo=Math.floor(v/to)*to,hi=lo+to,ans=rnd(v,to);const half=lo+to/2;
 return ok({vis:vis!==false?{t:'rline',lo,hi,v,step:to/10}:undefined,prompt:`Round <b>${N(v)}</b> to the nearest <b>${PLACE[to]}</b>.`,tpl:'{A}',answer:ans,text:`round ${v} ${to}`,
  explain:`<p>${N(v)} is between <b>${N(lo)}</b> and <b>${N(hi)}</b>. Halfway is ${N(half)}.</p><p>${v===half?'It is exactly halfway, and halfway rounds <b>up</b>':v>half?'It is past halfway, so it rounds <b>up</b>':'It is below halfway, so it rounds <b>down</b>'} to <b>${N(ans)}</b>.</p>`,
  nudge:`<p>Look at the digit to the right of the ${PLACE[to]}s place: 5 or more rounds up, 4 or less rounds down.</p>`,fast:10});}
const e3={
 r10:()=>roundQ(Math.random()<.5?notM(11,98,10):notM(101,989,10),10),
 r100:()=>roundQ(notM(110,989,100),100),
 sum10:()=>{const a=notM(12,89,10),b=notM(11,89,10);const ra=rnd(a,10),rb=rnd(b,10);return ok({prompt:'Round each number to the nearest <b>ten</b>, then add.',tpl:`${a} + ${b} ≈ {A}`,answer:ra+rb,text:`s10 ${a} ${b}`,explain:`<p>${a} → ${ra}. ${b} → ${rb}.</p><p>${ra} + ${rb} = <b>${ra+rb}</b> (exact: ${a+b})</p>`,nudge:`<p>Round both first. Adding tens is easy!</p>`});},
 sum100:()=>{const a=notM(110,690,100),b=notM(110,890-rnd(a,100),100);const ra=rnd(a,100),rb=rnd(b,100);return ok({prompt:'Round each number to the nearest <b>hundred</b>, then add.',tpl:`${a} + ${b} ≈ {A}`,answer:ra+rb,text:`s100 ${a} ${b}`,explain:`<p>${a} → ${ra}. ${b} → ${rb}.</p><p>${ra} + ${rb} = <b>${ra+rb}</b> (exact: ${a+b})</p>`,nudge:`<p>Round both to hundreds, then add the hundreds.</p>`});},
 diff:()=>{if(Math.random()<.4){const a=notM(52,98,10),b=notM(11,rnd(a,10)-15,10);const ra=rnd(a,10),rb=rnd(b,10);return ok({prompt:'Round each number to the nearest <b>ten</b>, then subtract.',tpl:`${a} − ${b} ≈ {A}`,answer:ra-rb,text:`d10 ${a} ${b}`,explain:`<p>${a} → ${ra}. ${b} → ${rb}.</p><p>${ra} − ${rb} = <b>${ra-rb}</b> (exact: ${a-b})</p>`,nudge:`<p>Round both to tens first.</p>`});}
  const a=notM(420,980,100),b=notM(110,rnd(a,100)-150,100),ra=rnd(a,100),rb=rnd(b,100);return ok({prompt:'Round each number to the nearest <b>hundred</b>, then subtract.',tpl:`${a} − ${b} ≈ {A}`,answer:ra-rb,text:`d100 ${a} ${b}`,explain:`<p>${a} → ${ra}. ${b} → ${rb}.</p><p>${ra} − ${rb} = <b>${ra-rb}</b> (exact: ${a-b})</p>`,nudge:`<p>Round both to hundreds first.</p>`});},
 jar:old('est',5),
 story:c=>{const k=R(0,3);const S=[['Ms. Rosa\'s café had','visitors','on Saturday','on Sunday'],['Coach Flex climbed','steps','in the morning','in the afternoon'],['Grumbleroot collected','toll coins','last week','this week'],['The Elder Wiz read','pages','in June','in July']][k];
  const a=notM(210,690,100);let b;do{b=notM(150,690,100);}while(Math.abs(rnd(a,100)-rnd(b,100))<100);const ra=rnd(a,100),rb=rnd(b,100);const add=Math.random()<.55;const [hi,lo,rh,rl]=a>=b?[a,b,ra,rb]:[b,a,rb,ra];
  return st({prompt:`${S[0]} <b>${hi}</b> ${S[1]} ${a>=b?S[2]:S[3]} and <b>${lo}</b> ${S[1]} ${a>=b?S[3]:S[2]}. ${add?`<b>About</b> how many ${S[1]} in all?`:`<b>About</b> how many more ${a>=b?S[2]:S[3]}?`} Round to the nearest hundred.`,tpl:'About {A}',answer:add?rh+rl:rh-rl,text:`es ${k} ${a} ${b} ${add}`,explain:`<p>${hi} → ${rh}. ${lo} → ${rl}.</p><p>${rh} ${add?'+':'−'} ${rl} = <b>${add?rh+rl:rh-rl}</b></p>`,nudge:`<p>"About" means estimate. Round each number to the nearest hundred first.</p>`});},
 check:c=>{const a=notM(120,580,100),b=notM(120,380,100);const ex=a+b;const wrong=Math.random()<.5;const est0=rnd(a,100)+rnd(b,100);let shown=ex;if(wrong){do{shown=ex+PK([1,1,-1])*100*R(3,5);}while(shown<100||Math.abs(shown-est0)<250);}const who=PK(['Gizmo','the Grey Goblin','Coach Flex','Ozzy']);const est=rnd(a,100)+rnd(b,100);const r=wrong?'No':'Yes';
  return choice(st({prompt:`${cap(who)} says <b>${a} + ${b} = ${N(shown)}</b>. Round to the nearest hundred to check. Is ${who.startsWith('the')?'his':'his'} answer reasonable?`,tpl:'{A}',text:`chk ${a} ${b} ${shown}`,explain:`<p>${a} → ${rnd(a,100)}, ${b} → ${rnd(b,100)}. The estimate is ${est}.</p><p>${N(shown)} is ${wrong?'far from':'close to'} ${est}, so the answer is <b>${r}</b>.${wrong?` (Exact: ${ex}.)`:''}</p>`,nudge:`<p>Estimate first. Is ${shown} close to your estimate?</p>`}),r,[r==='Yes'?'No':'Yes']);}
};
/* round 2: Average Shoppe grade 5 variety */
const a5x={
 fair:c=>{const k=R(3,5),m=R(12,30);let l;do{l=Array.from({length:k-1},()=>R(m-9,m+9));l.push(m*k-sum(l));}while(l.some(v=>v<3)||new Set(l).size<2);const [who,what,on,he]=PK([['Ms. Rosa','cupcakes','trays','she'],['Dr. Quartz','crystals','shelves','he'],['Nana Paws','treats','dog bowls','she'],['Gizmo','bolts','boxes','he']]);
  return st({prompt:`${who} has ${k} ${on} with <b>${l.slice(0,-1).join(', ')}</b> and <b>${l[k-1]}</b> ${what}. ${cap(he)} moves ${what} around so every one has the same number. How many on each?`,tpl:`{A} ${what}`,answer:m,text:`fair ${l}`,explain:`<p>Total: ${l.join(' + ')} = ${m*k}.</p><p>${m*k} ÷ ${k} = <b>${m}</b>. Sharing fairly gives the mean!</p>`,nudge:`<p>Put them all together, then share equally.</p>`});},
 tf:c=>{const l=meanL(3,4,20),m=sum(l)/3;const wrong=Math.random()<.5;const said=wrong?m+PK([1,2,-1,-2]):m;const r=wrong?'No':'Yes';const [who,he]=PK([['Gizmo','he'],['Skyla','she'],['Coach Flex','he'],['Nana Paws','she']]);
  return choice(st({prompt:`${who} says the mean of <b>${l.join(', ')}</b> is <b>${said}</b>. Is ${he} right?`,tpl:'{A}',text:`tf ${l} ${said}`,explain:`<p>${l.join(' + ')} = ${sum(l)}. ${sum(l)} ÷ 3 = ${m}.</p><p><b>${r}</b>.</p>`,nudge:`<p>Check: does ${said} × 3 equal the total?</p>`}),r,[r==='Yes'?'No':'Yes']);},
 drop:c=>{let l,lo,rest;do{l=Array.from({length:5},()=>R(70,98));lo=Math.min(...l);rest=sum(l)-lo;}while(sum(l)%5||rest%4||l.filter(x=>x===lo).length>1);
  return st({prompt:`Dr. Quartz tested 5 crystals. Their shine scores were <b>${l.join(', ')}</b>. He throws out the lowest score. What is the mean of the other 4?`,tpl:'Mean: {A}',answer:rest/4,text:`drop ${l}`,explain:`<p>The lowest is ${lo}. The other 4 add up to ${sum(l)} − ${lo} = ${rest}.</p><p>${rest} ÷ 4 = <b>${rest/4}</b></p>`,nudge:`<p>Take out the lowest, add the other 4, then divide by 4.</p>`,fast:45});},
 week:c=>{let m,x;do{m=R(18,30);x=R(m+3,m+20);}while((m*5+x)%6);return st({prompt:`Ms. Rosa sold a <b>mean of ${m}</b> cookies a day from Monday to Friday. On Saturday she sold <b>${x}</b>. What is her mean for all 6 days?`,tpl:'{A} cookies',answer:(m*5+x)/6,text:`wk ${m}${x}`,explain:`<p>Mon–Fri total: ${m} × 5 = ${m*5}. With Saturday: ${m*5} + ${x} = ${m*5+x}.</p><p>${m*5+x} ÷ 6 = <b>${(m*5+x)/6}</b></p>`,nudge:`<p>Mean × days = total. Find the 5-day total first.</p>`,fast:45});},
 join:c=>{let m,x;do{m=R(8,20);x=R(m+2,m+15);}while((m*4+x)%5);return st({prompt:`Four friends have a mean of <b>$${m}</b> each. ${c.name} joins them with <b>$${x}</b>. What is the new mean for all 5?`,tpl:'$ {A}',answer:(m*4+x)/5,text:`jn ${m}${x}`,explain:`<p>The 4 friends have $${m} × 4 = $${m*4}. Add ${c.name}: $${m*4+x}.</p><p>$${m*4+x} ÷ 5 = <b>$${(m*4+x)/5}</b></p>`,nudge:`<p>Find the 4 friends' total first.</p>`,fast:40});},
 boxes:c=>{const m=R(10,20);const a=R(m-6,m+6),b=R(m-6,m+6);const x=3*m-a-b;if(x<2)return a5x.boxes(c);return st({prompt:`Gizmo has 3 boxes of parts. Their mean weight is <b>${m} kg</b>. Two boxes weigh <b>${a} kg</b> and <b>${b} kg</b>. How heavy is the third box?`,tpl:'{A} kg',answer:x,text:`bx ${m}${a}${b}`,explain:`<p>Total: ${m} × 3 = ${3*m} kg.</p><p>${3*m} − ${a} − ${b} = <b>${x}</b> kg</p>`,nudge:`<p>Mean × 3 = the total weight.</p>`,fast:35});}
};
/* round 2: Volume Vault Legend */
const v5x={
 pan:c=>{const [l,w]=PK([[9,13],[8,8],[9,9],[10,15]]),h=PK([2,3]),f=R(1,h-1)||1;const k=R(0,1);
  if(k===0)return st({prompt:`Ms. Rosa's cake pan is <b>${l} in</b> by <b>${w} in</b> and <b>${h} in</b> deep. She fills it <b>${f} in</b> deep with batter. How many cubic inches of batter is that?`,tpl:'{A} cubic inches',answer:l*w*f,text:`pan ${l}${w}${h}${f}`,explain:`<p>The batter is a box ${l} × ${w} × ${f}.</p><p>${l*w} × ${f} = <b>${l*w*f}</b></p>`,nudge:`<p>Use the batter's depth, not the pan's.</p>`,fast:35});
  return st({prompt:`Ms. Rosa bakes <b>2</b> cakes in pans <b>${l} in × ${w} in × ${h} in</b>, full to the top. How many cubic inches of cake in all?`,tpl:'{A} cubic inches',answer:2*l*w*h,text:`pan2 ${l}${w}${h}`,explain:`<p>One pan: ${l} × ${w} × ${h} = ${l*w*h}.</p><p>2 × ${l*w*h} = <b>${2*l*w*h}</b></p>`,nudge:`<p>Find one pan, then double it.</p>`,fast:35});},
 bed:c=>{const bag=PK([2,3,4]);let l,w,h;do{l=R(4,10);w=R(2,4);h=R(1,2);}while((l*w*h)%bag);const have=R(1,l*w*h/bag-1);return st({prompt:`Nana Paws builds a garden bed <b>${l} ft</b> long, <b>${w} ft</b> wide and <b>${h} ft</b> deep. Each bag of soil fills <b>${bag} cubic feet</b>. She already has <b>${have}</b> bag${have>1?'s':''}. How many more bags does she need?`,tpl:'{A} more bags',answer:l*w*h/bag-have,text:`bed ${l}${w}${h}${bag}${have}`,explain:`<p>Volume: ${l} × ${w} × ${h} = ${l*w*h} cubic feet. Bags: ${l*w*h} ÷ ${bag} = ${l*w*h/bag}.</p><p>${l*w*h/bag} − ${have} = <b>${l*w*h/bag-have}</b></p>`,nudge:`<p>Three steps: volume, bags needed, then subtract.</p>`,fast:45});},
 caVol:c=>{const l=R(2,6),w=R(2,5),h=R(2,5);const V=l*w*h;const k=R(0,2);const said=k===0?V:k===1?l+w+h:l*w;const r=said===V?'Yes':'No';if(k&&said===V)return v5x.caVol(c);
  return choice(st({prompt:`Gizmo says a box <b>${l} × ${w} × ${h}</b> holds <b>${said}</b> unit cubes. Is he right?`,tpl:'{A}',text:`cav ${l}${w}${h}${said}`,explain:`<p>Volume = ${l} × ${w} × ${h} = ${V}.</p><p><b>${r}</b>.${k===1?' (He added instead of multiplying.)':k===2?' (He only found one layer.)':''}</p>`,nudge:`<p>Find the volume yourself, then compare.</p>`}),r,[r==='Yes'?'No':'Yes']);}
};
/* round 2: Story Summit checks and grade 5 fraction/decimal stories */
const w4x={
 caVans:c=>{const d=R(5,9),n=R(8,20),r=R(1,d-1);const t=d*n+r;const wrong=Math.random()<.5;const said=wrong?n:n+1;const ok2=wrong?'No':'Yes';
  return choice(st({prompt:`<b>${t}</b> kids are going to the lake. Each van holds <b>${d}</b> kids. Gizmo says they need <b>${said}</b> vans. Is he right?`,tpl:'{A}',text:`cv ${t}${d}${said}`,explain:`<p>${t} ÷ ${d} = ${n} remainder ${r}. The ${r} extra kids need a van too, so ${n+1} vans.</p><p><b>${ok2}</b>.</p>`,nudge:`<p>Divide, then think about the leftover kids.</p>`}),ok2,[ok2==='Yes'?'No':'Yes']);},
 shop:c=>{const k=R(0,1);
  if(k===0){const p=R(3,8),n=R(6,12),s=R(5,p*n-5);return st({prompt:`Ms. Rosa sells lemonade for <b>$${p}</b> a jug. She sells <b>${n}</b> jugs, then spends <b>$${s}</b> on lemons. How much money does she have left?`,tpl:'$ {A}',answer:p*n-s,text:`sh0 ${p}${n}${s}`,explain:`<p>${n} × $${p} = $${p*n}.</p><p>$${p*n} − $${s} = <b>$${p*n-s}</b></p>`,nudge:`<p>Find what she earned, then subtract.</p>`});}
  const p=R(4,9),n=R(5,10),b=R(10,30);return st({prompt:`Ozzy sells train tickets for <b>${p} coins</b> each. He sells <b>${n}</b> tickets and finds <b>${b}</b> coins under the seats. How many coins does he have?`,tpl:'{A} coins',answer:p*n+b,text:`sh1 ${p}${n}${b}`,explain:`<p>${n} × ${p} = ${p*n}. ${p*n} + ${b} = <b>${p*n+b}</b></p>`,nudge:`<p>Multiply, then add.</p>`});}
};
const w5x={
 caOps:c=>{const a=R(2,9),b=R(2,9),d=R(2,6);const right=a+b*d,wrongV=(a+b)*d;if(right===wrongV)return w5x.caOps(c);const wr=Math.random()<.5;const said=wr?wrongV:right;const r=wr?'No':'Yes';const [who,he]=PK([['Ozzy','he'],['Skyla','she'],['Gizmo','he'],['Ms. Rosa','she']]);
  return choice(st({prompt:`${who} says <b>${a} + ${b} × ${d} = ${said}</b>. Is ${he} right?`,tpl:'{A}',text:`co ${a}${b}${d}${said}`,explain:`<p>Multiply first: ${b} × ${d} = ${b*d}. Then ${a} + ${b*d} = ${right}.</p><p><b>${r}</b>.${wr?' (Adding first gives the wrong answer.)':''}</p>`,nudge:`<p>Which comes first: × or +?</p>`}),r,[r==='Yes'?'No':'Yes']);},
 decShare:c=>{const n=PK([3,4,5]),each=5*R(300/5,900/5),sp=5*R(50/5,250/5);if(sp>=each)return w5x.decShare(c);const tot=each*n;const o=st({prompt:`${c.name} and ${n-1} friends win <b>${$$(tot)}</b> at the fair and share it equally. Then each of them spends <b>${$$(sp)}</b> on a snack. How much does each one have left?`,tpl:'$ {A}',text:`ds ${n}${each}${sp}`,explain:`<p>Each share: ${$$(tot)} ÷ ${n} = ${$$(each)}.</p><p>${$$(each)} − ${$$(sp)} = <b>${$$(each-sp)}</b></p>`,nudge:`<p>Divide first, then subtract.</p>`,fast:45});return DEC(o,each-sp,2);},
 fracMoney:c=>{const [n,d]=PK([[3,4],[2,3],[2,5],[3,5],[5,6],[3,8]]);const tot=d*R(3,9);const saved=tot/d*n*100;const sp=5*R(20,Math.floor(saved/5)-10);const o=st({prompt:`Nana Paws earns <b>$${tot}</b> walking dogs. She saves <b>${F(n,d)}</b> of it. Then she spends <b>${$$(sp)}</b> of her savings on yarn. How much of her savings is left?`,tpl:'$ {A}',text:`fm ${tot}${n}${d}${sp}`,explain:`<p>${F(n,d)} of $${tot}: $${tot} ÷ ${d} × ${n} = $${saved/100}.</p><p>${$$(saved)} − ${$$(sp)} = <b>${$$(saved-sp)}</b></p>`,nudge:`<p>Find ${F(n,d)} of $${tot} first.</p>`,fast:45});return DEC(o,saved-sp,2);},
 flour:c=>{const w=R(2,4),q=PK([1,3]),b=R(3,6);const have=w*4+2;const used=q*b;if(used>=have)return w5x.flour(c);return st({prompt:`Ms. Rosa has <b>${w} ${F(1,2)} cups</b> of flour. Each batch of muffins uses <b>${F(q,4)} cup</b>. She bakes <b>${b}</b> batches. How much flour is left?`,...(()=>{const x=have-used;return x%4===0?{tpl:x===4?'{A} cup':'{A} cups',answer:x/4}:x%2===0?{tpl:`${FA(2)} cups`,answer:x/2}:{tpl:`${FA(4)} cups`,answer:x};})(),text:`fl ${w}${q}${b}`,explain:`<p>In quarter cups: ${w} ${F(1,2)} = ${F(have,4)}. Used: ${b} × ${F(q,4)} = ${F(used,4)}.</p><p>${have} − ${used} = <b>${have-used}</b>, so ${F(have-used,4)}${(have-used)%2===0?` = ${(have-used)%4===0?(have-used)/4:F((have-used)/2,2)}`:''} cups are left.</p>`,nudge:`<p>Change everything to fourths first.</p>`,fast:45});},
 opsStory:c=>{const p=R(3,6),n=R(6,12),bad=R(1,3),g=PK([2,3]);const good=p*(n-bad);if(good%g)return w5x.opsStory(c);return st({prompt:`Dr. Quartz has <b>${p}</b> packs of <b>${n}</b> crystals. <b>${bad}</b> ${bad===1?'crystal in each pack is':'crystals in each pack are'} cracked. He shares the good ones equally between <b>${g}</b> labs. How many good crystals does each lab get?`,tpl:'{A} crystals',answer:good/g,text:`os ${p}${n}${bad}${g}`,explain:`<p>${p} × (${n} − ${bad}) = ${p} × ${n-bad} = ${good} good crystals.</p><p>${good} ÷ ${g} = <b>${good/g}</b></p>`,nudge:`<p>Write it as [${p} × (${n} − ${bad})] ÷ ${g}. Parentheses first!</p>`,fast:45});}
};
/* round 2: estimation stories */
const e3x={
 need:c=>{const a=notM(210,380,100),b=notM(150,280,100),g=100*R(Math.ceil((a+b)/100)+2,10);const ra=rnd(a,100),rb=rnd(b,100);return st({prompt:`Grumbleroot wants <b>${g}</b> shiny pebbles for his bridge. He has <b>${a}</b> and finds <b>${b}</b> more. <b>About</b> how many more does he need? Round to the nearest hundred.`,tpl:'About {A}',answer:g-ra-rb,text:`nd ${a}${b}${g}`,explain:`<p>${a} → ${ra}, ${b} → ${rb}. About ${ra+rb} so far.</p><p>${g} − ${ra+rb} = <b>${g-ra-rb}</b></p>`,nudge:`<p>Round, add, then subtract from ${g}.</p>`,fast:35});}
};
const e5x={
 decStory:c=>{let a;do{a=R(21,89);}while(a%10===0||a%10===5);const d=R(4,9);const ra=Math.round(a/10);return st({prompt:`Skyla flies <b>${D(a,1)} km</b> every day for <b>${d}</b> days. <b>About</b> how far does she fly? Round to the nearest whole km first.`,tpl:'About {A} km',answer:ra*d,text:`dst ${a}${d}`,explain:`<p>${D(a,1)} → ${ra}.</p><p>${ra} × ${d} = <b>${ra*d}</b></p>`,nudge:`<p>Round ${D(a,1)} to a whole number, then multiply.</p>`});}
};

DEF('est',3,[
 [e3.r10,e3.r10,e3.r100,e3.r100],
 [e3.r100,e3.sum10,e3.jar,e3.r10,e3.sum100],
 [e3.sum100,e3.diff,e3.sum10,r3.e3add,r3.e3diff],
 [r3.e3chk,r4.e3close,e3.diff,e3.sum100,r3.e3add],
 [r3.e3left,r3.e3three,e3x.need,r3.e3chk,r3.e3add,r3.e3diff,r4.e3close,e3.diff]]);
const e4={
 r1000:()=>{const T=PK([2,3,4,5,6,7,8,9]);let v;do{v=T*1000+PK([-1,1])*R(101,499);}while(v<1100);return roundQ(v,1000);},
 r10k:()=>roundQ(notM(11000,98900,1000),10000),
 rAny:()=>{const to=PK([1000,10000,100000]);const v=to===100000?notM(110000,989000,10000):to===10000?notM(110000,989000,1000):notM(11000,99800,100);return roundQ(v,to,false);},
 prod:()=>{const k=R(0,2);
  if(k===0){const a=notM(23,98,10),b=R(4,9),ra=rnd(a,10);return ok({prompt:'Round the 2-digit number to the nearest <b>ten</b>, then multiply.',tpl:`${a} × ${b} ≈ {A}`,answer:ra*b,text:`p1 ${a} ${b}`,explain:`<p>${a} → ${ra}.</p><p>${ra} × ${b} = <b>${N(ra*b)}</b> (exact: ${N(a*b)})</p>`,nudge:`<p>${ra} × ${b} is ${ra/10} × ${b} with a zero on the end.</p>`});}
  if(k===1){const a=notM(120,980,100),b=R(3,9),ra=rnd(a,100);return ok({prompt:'Round the 3-digit number to the nearest <b>hundred</b>, then multiply.',tpl:`${a} × ${b} ≈ {A}`,answer:ra*b,text:`p2 ${a} ${b}`,explain:`<p>${a} → ${ra}.</p><p>${ra} × ${b} = <b>${N(ra*b)}</b> (exact: ${N(a*b)})</p>`,nudge:`<p>${ra} × ${b} is ${ra/100} × ${b} with two zeros on the end.</p>`});}
  const a=notM(12,89,10),b=notM(12,89,10),ra=rnd(a,10),rb=rnd(b,10);return ok({prompt:'Round both numbers to the nearest <b>ten</b>, then multiply.',tpl:`${a} × ${b} ≈ {A}`,answer:ra*rb,text:`p3 ${a} ${b}`,explain:`<p>${a} → ${ra}, ${b} → ${rb}.</p><p>${ra/10} × ${rb/10} = ${ra*rb/100}, then add two zeros: <b>${N(ra*rb)}</b> (exact: ${N(a*b)})</p>`,nudge:`<p>Multiply the tens digits, then add two zeros.</p>`});},
 sum1000:()=>{const a=notM(1100,5800,1000),b=notM(1100,3800,1000),ra=rnd(a,1000),rb=rnd(b,1000);const add=Math.random()<.6;const [x,y,rx,ry]=add||a>=b?[a,b,ra,rb]:[b,a,rb,ra];if(!add&&rx===ry)return e4.sum1000();
  return ok({prompt:`Round each number to the nearest <b>thousand</b>, then ${add?'add':'subtract'}.`,tpl:`${N(x)} ${add?'+':'−'} ${N(y)} ≈ {A}`,answer:add?rx+ry:rx-ry,text:`s1k ${x} ${y} ${add}`,explain:`<p>${N(x)} → ${N(rx)}. ${N(y)} → ${N(ry)}.</p><p>${N(rx)} ${add?'+':'−'} ${N(ry)} = <b>${N(add?rx+ry:rx-ry)}</b></p>`,nudge:`<p>Round both to thousands first. Then it's like ${rx/1000} ${add?'+':'−'} ${ry/1000}.</p>`});},
 reason:c=>{const a=notM(23,89,10),b=R(3,9);const ex=a*b;const k=R(0,2);const shown=k===0?ex:k===1?ex*10:Math.round(ex/10);const who=PK(['Gizmo','Coach Flex','Ozzy','Nana Paws']);const est=rnd(a,10)*b;const r=k===0?'Yes':'No';
  return choice(st({prompt:`${who} says <b>${a} × ${b} = ${N(shown)}</b>. Estimate to check. Is that reasonable?`,tpl:'{A}',text:`rs ${a} ${b} ${shown}`,explain:`<p>${a} is about ${rnd(a,10)}, and ${rnd(a,10)} × ${b} = ${est}.</p><p>${N(shown)} is ${r==='Yes'?'close to':'far from'} ${est}, so <b>${r}</b>.${k===1?' (A zero too many!)':k===2?' (A zero is missing!)':''}${r==='No'?` (Exact: ${ex}.)`:''}</p>`,nudge:`<p>Round ${a} to the nearest ten and multiply. Is ${N(shown)} close?</p>`}),r,[r==='Yes'?'No':'Yes']);},
 story:(c,K)=>{const k=K!=null?K:R(0,3);
  if(k===0){const a=notM(21000,58000,1000),b=notM(15000,39000,1000);const ra=rnd(a,1000),rb=rnd(b,1000);return st({prompt:`The stadium had <b>${N(a)}</b> fans on Saturday and <b>${N(b)}</b> fans on Sunday. <b>About</b> how many fans came in all? Round each to the nearest thousand.`,tpl:'About {A} fans',answer:ra+rb,text:`fans ${a} ${b}`,explain:`<p>${N(a)} → ${N(ra)}. ${N(b)} → ${N(rb)}.</p><p>${N(ra)} + ${N(rb)} = <b>${N(ra+rb)}</b></p>`,nudge:`<p>Round both to thousands, then add.</p>`});}
  if(k===1){const m=notM(23,78,10),d=R(4,9);const rm=rnd(m,10);return st({prompt:`Skyla flies <b>${m} miles</b> every day for <b>${d} days</b>. <b>About</b> how many miles is that? Round the miles to the nearest ten.`,tpl:'About {A} miles',answer:rm*d,text:`sky ${m} ${d}`,explain:`<p>${m} → ${rm}.</p><p>${rm} × ${d} = <b>${rm*d}</b></p>`,nudge:`<p>Round ${m} to the nearest ten, then multiply.</p>`});}
  if(k===2){const a=notM(1100,4800,100),b=notM(1100,3900,100);const ra=rnd(a,1000),rb=rnd(b,1000);if(ra===rb)return e4.story(c,K);const [x,y,rx,ry]=a>b?[a,b,ra,rb]:[b,a,rb,ra];return st({prompt:`Coach Flex climbed <b>${N(x)}</b> steps on Monday and <b>${N(y)}</b> steps on Tuesday. <b>About</b> how many more steps on Monday? Round to the nearest thousand.`,tpl:'About {A} more',answer:rx-ry,text:`steps ${x} ${y}`,explain:`<p>${N(x)} → ${N(rx)}. ${N(y)} → ${N(ry)}.</p><p>${N(rx)} − ${N(ry)} = <b>${N(rx-ry)}</b></p>`,nudge:`<p>Round both to thousands, then subtract.</p>`});}
  const p=notM(120,480,100),bx=R(3,9);const rp=rnd(p,100);return st({prompt:`Dr. Quartz has <b>${bx} boxes</b>. Each box holds <b>${p} tiny crystals</b>. <b>About</b> how many crystals? Round to the nearest hundred.`,tpl:'About {A} crystals',answer:rp*bx,text:`cry ${p} ${bx}`,explain:`<p>${p} → ${rp}.</p><p>${rp} × ${bx} = <b>${N(rp*bx)}</b></p>`,nudge:`<p>Round ${p} to the nearest hundred, then multiply.</p>`});}
};
DEF('est',4,[
 [e4.r1000,e4.r1000,e3.r100,e4.sum1000],
 [e4.r10k,e4.rAny,e4.sum1000,e4.r1000,r5.sum100k,r5.roundsTo],
 [e4.prod,e4.rAny,r4.e4more,e4.sum1000,r5.sum100k,e4.r10k],
 [r3.e4mist,e4.prod,e4.rAny,c=>e4.story(c,3),e4.sum1000,r4.e4more],
 [c=>e4.story(c,0),c=>e4.story(c,1),c=>e4.story(c,2),r3.e4mist,r3.e4pages,r3.e4riders,r4.e4more2,e4.prod]]);
const e5={
 rWhole:()=>{let v;do{v=R(11,999);}while(v%10===0);const dp=1;const ans=Math.round(v/10);const s=D(v,1);const lo=Math.floor(v/10);return ok({prompt:`Round <b>${s}</b> to the nearest <b>whole number</b>.`,tpl:'{A}',answer:ans,text:`rw ${v}`,explain:`<p>${s} is between ${lo} and ${lo+1}. Look at the tenths digit: ${v%10}.</p><p>${v%10>=5?'5 or more rounds up':'4 or less rounds down'}: <b>${ans}</b></p>`,nudge:`<p>Look at the digit just after the decimal point.</p>`});},
 rWhole2:()=>{let v;do{v=R(101,9999);}while(v%100===0);const s=D(v,2);const ans=Math.round(v/100);return ok({prompt:`Round <b>${s}</b> to the nearest <b>whole number</b>.`,tpl:'{A}',answer:ans,text:`rw2 ${v}`,explain:`<p>The tenths digit is ${Math.floor(v/10)%10}. ${Math.floor(v/10)%10>=5?'5 or more rounds up':'4 or less rounds down'}: <b>${ans}</b></p>`,nudge:`<p>Only the tenths digit decides.</p>`});},
 rTenth:()=>{let v;do{v=R(101,2999);}while(v%10===0);const t=Math.round(v/10);const s=D(v,2);const o=ok({prompt:`Round <b>${s}</b> to the nearest <b>tenth</b>.`,tpl:'{A}',text:`rt ${v}`,explain:`<p>Look at the hundredths digit: ${v%10}. ${v%10>=5?'5 or more rounds up':'4 or less rounds down'}.</p><p>${s} → <b>${D(t,1)}</b>${t%10===0?` (you can type ${D(t,1)} or ${t/10})`:''}</p>`,nudge:`<p>Keep one digit after the point. The next digit decides.</p>`});return DEC(o,t,1);},
 rHund:()=>{let v;do{v=R(1001,9999);}while(v%10===0);const t=Math.round(v/10);const s=D(v,3);const o=ok({prompt:`Round <b>${s}</b> to the nearest <b>hundredth</b>.`,tpl:'{A}',text:`rh ${v}`,explain:`<p>Look at the thousandths digit: ${v%10}. ${v%10>=5?'5 or more rounds up':'4 or less rounds down'}.</p><p>${s} → <b>${dstr(t,2)}</b></p>`,nudge:`<p>Keep two digits after the point. The third one decides.</p>`});return DEC(o,t,2);},
 pickR:()=>{let v;do{v=R(101,999);}while(v%10===0);const s=D(v,2);const t=Math.round(v/10);const r=D(t,1);const w=[D(Math.floor(v/10),1),D(Math.floor(v/10)+1,1),D(v,2).slice(0,-1)];if(Math.round(v/100)*10!==t)w.push(String(Math.round(v/100)));
  return choice(ok({prompt:`Which is <b>${s}</b> rounded to the nearest tenth?`,tpl:'{A}',text:`pr ${v}`,explain:`<p>The hundredths digit is ${v%10}, so ${v%10>=5?'round up':'round down'}: <b>${r}</b>.</p>`,nudge:`<p>Look at the hundredths digit.</p>`}),r,w);},
 quot:()=>{const dr=10*R(2,9),dv=dr+PK([-2,-1,1,2]),q=10*R(2,9);const comp=dr*q;const dd=comp+R(-Math.floor(dr/3),Math.floor(dr/3));if(dd===comp)return e5.quot();
  return ok({prompt:'Use nearby numbers that divide easily.',tpl:`${N(dd)} ÷ ${dv} ≈ {A}`,answer:q,alt:qalt(dd,dv,dr,q),text:`q ${dd} ${dv}`,explain:`<p>${dv} is close to ${dr}. ${N(dd)} is close to ${N(comp)}.</p><p>${N(comp)} ÷ ${dr} = ${comp/10} ÷ ${dr/10} = <b>${q}</b></p>`+qaltEx(dd,dv,q),nudge:`<p>Round ${dv} to ${dr}. Which number near ${N(dd)} divides by ${dr} easily?</p>`});},
 quot1:()=>{const d=R(3,9),q=10*R(3,9),comp=d*q;const dd=comp+PK([-2,-1,1,2,3]);return ok({prompt:'Use a nearby number that divides easily.',tpl:`${dd} ÷ ${d} ≈ {A}`,answer:q,text:`q1 ${dd} ${d}`,explain:`<p>${dd} is close to ${comp}, and ${comp} ÷ ${d} = <b>${q}</b> (because ${d} × ${q/10} = ${comp/10}).</p>`,nudge:`<p>Think of your ${d} times table: ${d} × ? is close to ${Math.round(dd/10)}.</p>`});},
 decSum:()=>{const n=R(2,3);const vs=Array.from({length:n},()=>{let v;do{v=R(11,99);}while(v%10===0||v%10===5);return v;});const rs=vs.map(v=>Math.round(v/10));return ok({prompt:'Round each number to the nearest whole number, then add.',tpl:`${vs.map(v=>D(v,1)).join(' + ')} ≈ {A}`,answer:sum(rs),text:`ds ${vs}`,explain:`<p>${vs.map((v,i)=>`${D(v,1)} → ${rs[i]}`).join(', ')}.</p><p>${rs.join(' + ')} = <b>${sum(rs)}</b></p>`,nudge:`<p>Round each to a whole number first.</p>`});},
 money:c=>{const L=[['a bag of flour',350,600],['a jar of honey',400,850],['a box of berries',250,500],['butter',300,550],['a bag of sugar',200,450],['vanilla',500,900]];const items=SH(L).slice(0,3).map(([n,lo,hi])=>{let v;do{v=R(lo,hi);}while(Math.abs(v%100-50)<10);return [n,v];});const rs=items.map(x=>Math.round(x[1]/100));
  return st({prompt:`Ms. Rosa buys ${items.map(x=>`${x[0]} for <b>${$$(x[1])}</b>`).join(', ')}. Round each price to the nearest dollar. <b>About</b> how much does she spend?`,tpl:'About $ {A}',answer:sum(rs),text:`mn ${JSON.stringify(items)}`,explain:`<p>${items.map((x,i)=>`${$$(x[1])} → $${rs[i]}`).join(', ')}.</p><p>${rs.join(' + ')} = <b>$${sum(rs)}</b></p>`,nudge:`<p>Look at the cents: 50¢ or more rounds up.</p>`});},
 enough:c=>{const items=SH([['a toy train',600,1400],['a puzzle',500,1200],['a kite',700,1300],['a book',400,900],['a yo-yo',200,500]]).slice(0,3).map(([n,lo,hi])=>[n,R(lo,hi)]);const tot=sum(items.map(x=>x[1]));const have=100*(Math.round(tot/100)+PK([-3,-2,2,3]));const r=have>=tot?'Yes':'No';
  return choice(st({prompt:`${c.name} has <b>$${have/100}</b>. ${c.name} wants ${items.map(x=>`${x[0]} (${$$(x[1])})`).join(', ')}. Is that enough money for all three?`,tpl:'{A}',text:`en ${JSON.stringify(items)} ${have}`,explain:`<p>Round: ${items.map(x=>`$${Math.round(x[1]/100)}`).join(' + ')} = about $${sum(items.map(x=>Math.round(x[1]/100)))}. The exact total is ${$$(tot)}.</p><p>$${have/100} is ${have>=tot?'more':'less'} than that, so <b>${r}</b>.</p>`,nudge:`<p>Round each price to the nearest dollar and add.</p>`}),r,[r==='Yes'?'No':'Yes']);},
 qStory:c=>{const dr=10*R(2,6),dv=dr+PK([-2,-1,1,2]),q=10*R(2,6),comp=dr*q;const dd=comp+R(-9,9);const [a,b,u]=PK([[`Ozzy's train carried <b>${N(dd)}</b> riders in <b>${dv}</b> trips.`,'riders per trip','riders'],[`Ms. Rosa baked <b>${N(dd)}</b> cookies in <b>${dv}</b> days.`,'cookies per day','cookies'],[`Coach Flex did <b>${N(dd)}</b> push-ups in <b>${dv}</b> days.`,'push-ups per day','push-ups']]);
  return st({prompt:`${a} <b>About</b> how many ${b}? Use numbers that divide easily.`,tpl:`About {A} ${u}`,answer:q,alt:qalt(dd,dv,dr,q),text:`qs ${dd} ${dv} ${u}`,explain:`<p>${dv} ≈ ${dr}, ${N(dd)} ≈ ${N(comp)}.</p><p>${N(comp)} ÷ ${dr} = <b>${q}</b></p>`+qaltEx(dd,dv,q),nudge:`<p>Round ${dv} to ${dr}, then find a nearby number that ${dr} divides into.</p>`});}
};
DEF('est',5,[
 [e5.rWhole,e5.rWhole2,e4.r10k,e5.decSum],
 [e5.rTenth,e5.pickR,e5.rWhole2,e5.decSum,e5.rHund],
 [e5.quot1,e5.quot,e5.rTenth,e5.rHund,K('shop',e5.money),e5.decSum,e5.pickR],
 [e5.quot,e5.rHund,K('shop',e5.money),K('shop',r3.enough),e5.rTenth,r3.decProd,r3.quotMist],
 [e5.qStory,K('shop',e5.money),K('shop2',r3.enough),e5x.decStory,r3.decProd,r3.decMist,r3.quotMist,e5.quot]]);

/* =================================== 🧺 THE AVERAGE SHOPPE =================================== */
const evenList=(k,m,spread)=>{let l;do{l=Array.from({length:k},()=>R(Math.max(1,m-spread),m+spread));l[k-1]=m*k-sum(l.slice(0,-1));}while(l.some(v=>v<1||v>12)||l.every(v=>v===m));return l;};
const meanL=(k,lo,hi)=>{let l;do{l=Array.from({length:k},()=>R(lo,hi));}while(sum(l)%k||new Set(l).size<2);return l;};
const a4={
 even:k=>()=>{const m=R(3,8),l=evenList(k,m,4);const [what,stack]=PK([['cans','stack'],['blocks','tower'],['books','pile'],['hats','stack']]);return ok({vis:{t:'towers',list:l},prompt:`The shopkeeper wants every ${stack} of ${what} the <b>same height</b>. Move ${what} from tall ${stack}s to short ones. How tall will each ${stack} be?`,tpl:`{A} ${what}`,answer:m,text:`ev ${l}`,explain:`<p>All together: ${l.join(' + ')} = <b>${m*k}</b>.</p><p>Shared by ${k} ${stack}s: ${m*k} ÷ ${k} = <b>${m}</b>. That number is the <b>average</b>!</p>`,nudge:`<p>Count them all, then share equally between the ${k} ${stack}s.</p>`});},
 move:()=>{const m=R(3,8),d=R(1,4);const l=SH([m+d,m-d]);return ok({vis:{t:'towers',list:l},prompt:`Two towers have <b>${l[0]}</b> and <b>${l[1]}</b> blocks. How many blocks must move from the tall tower to the short one to make them even?`,tpl:'{A} blocks',answer:d,text:`mv ${l}`,explain:`<p>The difference is ${2*d}. Move half of it: ${2*d} ÷ 2 = <b>${d}</b>.</p><p>Then both towers have ${m}.</p>`,nudge:`<p>Moving 1 block makes the tall one 1 shorter AND the short one 1 taller.</p>`});},
 share:c=>{const k=c.round===1?2:PK([3,3,4]),m=R(3,9),l=evenList(k,m,4);if(l.includes(1))return a4.share(c);const [who,on,what]=PK([['Ms. Rosa','plates','cookies'],['Nana Paws','dog bowls','treats'],['Dr. Quartz','trays','crystals'],['Gizmo','boxes','bolts']]);
  return st({prompt:`${who} has ${k} ${on} with <b>${l.slice(0,-1).join(', ')}</b> and <b>${l[l.length-1]}</b> ${what}. ${cap(P[Object.keys(P).find(x=>P[x].s===who)]?.he||'they')} moves ${what} so every one has the same number. How many ${what} on each?`,tpl:`{A} ${what}`,answer:m,text:`sh ${who} ${l}`,explain:`<p>${l.join(' + ')} = ${m*k}.</p><p>${m*k} ÷ ${k} = <b>${m}</b></p>`,nudge:`<p>Find the total, then share it equally.</p>`});},
 mean3:()=>{const l=meanL(3,2,15);return ok({vis:{t:'towers',list:l},prompt:'What is the <b>average</b> (mean) of these numbers?',tpl:`Average of ${l.join(', ')} = {A}`,answer:sum(l)/3,text:`m3 ${l}`,explain:`<p>Add: ${l.join(' + ')} = ${sum(l)}.</p><p>Divide by 3: ${sum(l)} ÷ 3 = <b>${sum(l)/3}</b></p>`,nudge:`<p>Average = add them up, then divide by how many numbers (3).</p>`});},
 mean4:()=>{const k=PK([4,4,5]);const l=meanL(k,2,20);return ok({prompt:'What is the <b>average</b> (mean)?',tpl:`Average of ${l.join(', ')} = {A}`,answer:sum(l)/k,text:`m4 ${l}`,explain:`<p>Add: ${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ ${k} = <b>${sum(l)/k}</b></p>`,nudge:`<p>Add them all, then divide by ${k}.</p>`});},
 story:(c,K)=>{const k=K!=null?K:R(0,3);
  if(k===0){const l=meanL(3,10,30);return st({prompt:`Coach Flex did <b>${l.join(', ')}</b> push-ups on 3 days. What is his <b>average</b> per day?`,tpl:'{A} push-ups',answer:sum(l)/3,text:`fx ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}. ${sum(l)} ÷ 3 = <b>${sum(l)/3}</b></p>`,nudge:`<p>Add the 3 days, then divide by 3.</p>`});}
  if(k===1){const l=meanL(3,2,12);return st({prompt:`${c.name}, Gizmo and Nana Paws have <b>$${l[0]}</b>, <b>$${l[1]}</b> and <b>$${l[2]}</b>. They put it all together and share it fairly. How much does each get?`,tpl:'$ {A}',answer:sum(l)/3,text:`mo ${l}`,explain:`<p>$${l.join(' + $')} = $${sum(l)}.</p><p>$${sum(l)} ÷ 3 = <b>$${sum(l)/3}</b></p>`,nudge:`<p>Put it all together, then share between 3.</p>`});}
  if(k===2){const l=meanL(4,3,15);return st({prompt:`Skyla dropped <b>${l.join(', ')}</b> feathers on 4 days. What is the <b>average</b> number of feathers per day?`,tpl:'{A} feathers',answer:sum(l)/4,text:`sk ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}. ${sum(l)} ÷ 4 = <b>${sum(l)/4}</b></p>`,nudge:`<p>Add the 4 days, then divide by 4.</p>`});}
  const l=meanL(3,5,25);return st({prompt:`The Grey Goblin stole <b>${l.join(', ')}</b> socks from 3 houses. If he had stolen the same number from each house, how many would that be?`,tpl:'{A} socks',answer:sum(l)/3,text:`gb ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}. ${sum(l)} ÷ 3 = <b>${sum(l)/3}</b> (the average)</p>`,nudge:`<p>Same number from each = the average. Add, then divide by 3.</p>`});},
 two:c=>{const m=R(4,8),l=evenList(3,m,3),add=R(1,3)*3;const nm=m+add/3;return st({vis:{t:'towers',list:l},prompt:`Three stacks of cans have <b>${l.join(', ')}</b> cans. The shopkeeper adds <b>${add}</b> more cans, then makes all 3 stacks even. How tall is each stack?`,tpl:'{A} cans',answer:nm,text:`tw ${l} ${add}`,explain:`<p>Before: ${l.join(' + ')} = ${m*3}. After: ${m*3} + ${add} = ${nm*3}.</p><p>${nm*3} ÷ 3 = <b>${nm}</b></p>`,nudge:`<p>Find the new total first, then share between 3.</p>`});}
};
DEF('avg',4,[
 [K('tower',a4.even(2)),K('move',r4.move),K('tower',a4.even(3)),K('plates',a4.share),K('money',r6.shareMoney),K('bags',r4.bags),K('bars',r6.barShare)],
 [K('tower',a4.even(3)),K('tower',r4.smallMean),K('bags',r4.bags),K('tower',a4.even(4)),K('plates',a4.share),K('money',r6.shareMoney),K('addcans',a4.two),K('bars',r6.barShare)],
 [K('list',r3.a4mean3),K('list',r3.a4mean4),K('chart',r3.a4bars),K('miss',r3.a4miss),K('bags',r4.bags),K('ctx',c=>r3.a4ctx(c,3)),K('mist',r3.aMist),K('addcans',a4.two)],
 [K('list',r3.a4mean4),K('miss',r3.a4miss),K('chart',r3.a4bars),K('ctx',c=>r3.a4ctx(c,R(0,3))),K('mist',r3.aMist),K('boxes',c=>a5x.boxes(c)),K('list',r3.a4mean3)],
 [K('need',c=>a5.need(c)),K('week',c=>a5x.week(c)),K('join',c=>a5x.join(c)),K('miss',r3.a4miss),K('ctx',c=>r3.a4ctx(c,R(0,2))),K('boxes',c=>a5x.boxes(c)),K('drop',c=>a5x.drop(c)),K('gap',c=>r3.a5gap(c))]]);
const a5={
 mean:()=>{const k=R(3,5);const l=meanL(k,4,40);return ok({prompt:'What is the <b>mean</b> (average)?',tpl:`Mean of ${l.join(', ')} = {A}`,answer:sum(l)/k,text:`mn ${l}`,explain:`<p>Add: ${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ ${k} = <b>${sum(l)/k}</b></p>`,nudge:`<p>Add them all, then divide by ${k}.</p>`});},
 meanBig:()=>{const k=R(4,5);const l=meanL(k,20,95);return ok({prompt:'What is the <b>mean</b> (average)?',tpl:`Mean of ${l.join(', ')} = {A}`,answer:sum(l)/k,text:`mb ${l}`,explain:`<p>Add: ${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ ${k} = <b>${sum(l)/k}</b></p>`,nudge:`<p>Add them all, then divide by ${k}.</p>`});},
 bars:c=>{const k=PK([4,5]);const l=meanL(k,4,30);const [what,names]=PK([['lemonades Ms. Rosa sold',['Mon','Tue','Wed','Thu','Fri']],['laps Coach Flex swam',['Mon','Tue','Wed','Thu','Fri']],['gadgets Gizmo fixed',['Week 1','Week 2','Week 3','Week 4','Week 5']],['dogs Nana Paws walked',['Mon','Tue','Wed','Thu','Fri']]]);
  return ok({vis:{t:'sbars',vals:l,names:names.slice(0,k)},prompt:`The chart shows ${what}. What is the <b>mean</b> per ${/Week/.test(names[0])?'week':'day'}?`,tpl:'Mean: {A}',answer:sum(l)/k,text:`br ${l}`,explain:`<p>${l.join(' + ')} = ${sum(l)}.</p><p>${sum(l)} ÷ ${k} = <b>${sum(l)/k}</b></p>`,nudge:`<p>Read every bar, add them, then divide by ${k}.</p>`,fast:20});},
 money:c=>{const k=PK([3,4]);const l=meanL(k,3,25);const who=PK(['Ms. Rosa','Gizmo','Nana Paws','Dr. Quartz']);return st({prompt:`At The Average Shoppe, ${who} buys ${k} things that cost <b>$${l.join(', $')}</b>. What is the <b>mean</b> price?`,tpl:'$ {A}',answer:sum(l)/k,text:`my ${l}`,explain:`<p>$${l.join(' + $')} = $${sum(l)}.</p><p>$${sum(l)} ÷ ${k} = <b>$${sum(l)/k}</b></p>`,nudge:`<p>Add the prices, then divide by ${k}.</p>`});},
 total:c=>{const m=R(6,25),d=PK([4,5,6,7]);return st({prompt:`Ozzy's train carried a <b>mean</b> of <b>${m}</b> riders per trip for <b>${d}</b> trips. How many riders in all?`,tpl:'{A} riders',answer:m*d,text:`tt ${m} ${d}`,explain:`<p>Mean × how many = total.</p><p>${m} × ${d} = <b>${m*d}</b></p>`,nudge:`<p>If every trip had exactly ${m}, how many is that?</p>`});},
 cmp:()=>{let A,B;do{A=meanL(3,4,20);B=meanL(3,4,20);}while(sum(A)===sum(B));const r=sum(A)>sum(B)?'Team A':'Team B';return choice(ok({prompt:`Team A scored <b>${A.join(', ')}</b>. Team B scored <b>${B.join(', ')}</b>. Which team has the higher <b>mean</b>?`,tpl:'{A}',text:`cp ${A} ${B}`,explain:`<p>A: ${sum(A)} ÷ 3 = ${sum(A)/3}. B: ${sum(B)} ÷ 3 = ${sum(B)/3}.</p><p><b>${r}</b></p>`,nudge:`<p>Find each team's mean. (Same number of games, so you can also compare the totals!)</p>`}),r,['Team A','Team B']);},
 newMean:c=>{const l=meanL(3,6,20),m=sum(l)/3;let x;do{x=R(2,30);}while((sum(l)+x)%4||x===m);const nm=(sum(l)+x)/4;return st({prompt:`Coach Flex's first 3 scores were <b>${l.join(', ')}</b> (mean ${m}). His 4th score is <b>${x}</b>. What is the new mean?`,tpl:'New mean: {A}',answer:nm,text:`nm ${l} ${x}`,explain:`<p>New total: ${sum(l)} + ${x} = ${sum(l)+x}.</p><p>${sum(l)+x} ÷ 4 = <b>${nm}</b></p>`,nudge:`<p>Add the new score to the total, then divide by 4.</p>`,fast:30});},
 missing:c=>{const k=PK([3,4,5]),m=R(8,20);const l=Array.from({length:k-1},()=>R(m-6,m+6));const miss=m*k-sum(l);if(miss<1||miss>40)return a5.missing(c);return ok({prompt:`The mean of ${k} numbers is <b>${m}</b>. ${k-1} of them are <b>${l.join(', ')}</b>. What is the missing number?`,tpl:`${l.join(', ')}, {A}`,answer:miss,text:`ms ${l} ${m}`,explain:`<p>The total must be ${m} × ${k} = ${m*k}.</p><p>${m*k} − ${sum(l)} = <b>${miss}</b></p>`,nudge:`<p>Mean × how many = total. What is missing from the total?</p>`,fast:25});},
 need:c=>{const k=4,l=meanL(k,6,20),s=sum(l),goal=s/k+R(1,4),need=goal*5-s;const [who,noun,past,pres,he]=PK([['Ms. Rosa','cookies','sold','sell','she'],['Nana Paws','dogs','walked','walk','she'],['Gizmo','gadgets','built','build','he'],['Skyla','miles','flew','fly','she']]);
  return st({prompt:`Over 4 days, ${who} ${past} <b>${l.join(', ')}</b> ${noun}. How many ${noun} must ${he} ${pres} on day 5 to make the mean <b>${goal}</b> a day?`,tpl:'Day 5: {A}',answer:need,text:`nd ${l} ${goal}`,explain:`<p>For a mean of ${goal} over 5 days, the total must be ${goal} × 5 = ${goal*5}.</p><p>So far: ${s}. ${goal*5} − ${s} = <b>${need}</b></p>`,nudge:`<p>Mean × 5 days = the total needed. How far is ${s} from that?</p>`,fast:40});}
};
DEF('avg',5,[
 [K('tower',a4.even(4)),r4.move,r6.shareMoney,a5x.fair,r4.bags,a4.two,r6.shareTwo],
 [lp.share,a5x.fair,r6.shareMoney,a4.two,r6.shareTwo,r6.barShare],
 [a5.bars,a5.missing,a5.newMean,a5.meanBig,a5x.fair,a5.money,a5.total,r3.a4mean3],
 [a5.cmp,a5.missing,a5.meanBig,a5.bars,r3.aMist,a5x.boxes],
 [a5.need,a5x.drop,a5x.week,a5x.join,r3.a5gap,r3.aMist,r3.a4miss,c=>r3.a4ctx(c,3)]]);

/* =================================== 🧊 VOLUME VAULT =================================== */
const VU=()=>PK(['inches','feet','cm','meters']);
const v5={
 count:()=>{const l=R(2,4),w=R(1,3),h=R(1,3);return ok({vis:{t:'iso',b:[{x:0,l,w,h}]},prompt:'How many unit cubes make this box?',tpl:'{A} unit cubes',answer:l*w*h,text:`ct ${l}${w}${h}`,explain:`<p>One layer: ${l} × ${w} = ${l*w} cubes.</p><p>${h} layer${h>1?'s':''}: ${l*w} × ${h} = <b>${l*w*h}</b></p>`,nudge:`<p>Count the cubes in the top layer, then count the layers.</p>`});},
 layers:()=>{const a=R(2,5),b=R(2,5),n=R(2,6);return ok({prompt:`The bottom layer of a box is <b>${a} cubes by ${b} cubes</b>. There are <b>${n} layers</b>. How many cubes in all?`,tpl:'{A} cubes',answer:a*b*n,text:`ly ${a}${b}${n}`,explain:`<p>One layer: ${a} × ${b} = ${a*b}.</p><p>${a*b} × ${n} = <b>${a*b*n}</b></p>`,nudge:`<p>Find one layer first, then multiply by ${n}.</p>`});},
 fill:c=>{const l=R(2,5),w=R(2,4),h=R(2,4);const [who,what]=PK([['Dr. Quartz','a crystal box'],['Gizmo','a battery box'],[c.name,'a toy box'],['Ms. Rosa','a sugar-cube tin']]);return st({prompt:`${who} fills ${what} with 1-inch cubes. The box is <b>${l} inches</b> long, <b>${w} inches</b> wide and <b>${h} inches</b> tall. How many cubes fit?`,tpl:'{A} cubes',answer:l*w*h,text:`fl ${l}${w}${h}${who}`,explain:`<p>${l} × ${w} = ${l*w} cubes in a layer.</p><p>${l*w} × ${h} layers = <b>${l*w*h}</b></p>`,nudge:`<p>How many cubes cover the bottom? How many layers?</p>`,fast:20});},
 lwh:()=>{const l=R(3,6),w=R(2,4),h=R(2,5);return ok({vis:{t:'iso',b:[{x:0,l,w,h}],lb:[{l,w,h}]},prompt:'Find the volume.',tpl:'{A} cubic units',answer:l*w*h,text:`lw ${l}${w}${h}`,explain:`<p>Volume = length × width × height.</p><p>${l} × ${w} × ${h} = <b>${l*w*h}</b> cubic units</p>`,nudge:`<p>Multiply length × width × height.</p>`});},
 words:()=>{const l=R(4,12),w=R(2,8),h=R(2,9),u=VU();return ok({prompt:`A box is <b>${l} ${u}</b> long, <b>${w} ${u}</b> wide and <b>${h} ${u}</b> tall. What is its volume?`,tpl:`{A} cubic ${u}`,answer:l*w*h,text:`wd ${l}${w}${h}${u}`,explain:`<p>${l} × ${w} = ${l*w} (the base).</p><p>${l*w} × ${h} = <b>${l*w*h}</b> cubic ${u}</p>`,nudge:`<p>Find the base (${l} × ${w}) first, then multiply by the height.</p>`});},
 cube:()=>{const a=R(2,6);return ok({vis:a<=4?{t:'iso',b:[{x:0,l:a,w:a,h:a}],lb:[{l:a,w:a,h:a}]}:undefined,prompt:`A cube is <b>${a} cm</b> on every edge. What is its volume?`,tpl:'{A} cubic cm',answer:a*a*a,text:`cb ${a}`,explain:`<p>${a} × ${a} × ${a} = ${a*a} × ${a} = <b>${a*a*a}</b></p>`,nudge:`<p>A cube's length, width and height are all ${a}.</p>`});},
 base:()=>{const B=R(6,40),h=R(2,9),u=VU();return ok({prompt:`The base of a box has an area of <b>${B} square ${u}</b>. The box is <b>${h} ${u}</b> tall. What is its volume?`,tpl:`{A} cubic ${u}`,answer:B*h,text:`bs ${B}${h}`,explain:`<p>Volume = base area × height.</p><p>${B} × ${h} = <b>${B*h}</b> cubic ${u}</p>`,nudge:`<p>Base area × height.</p>`});},
 missH:()=>{const l=R(3,10),w=R(2,8),h=R(2,9),u=VU();const V=l*w*h;return ok({prompt:`A box has a volume of <b>${V} cubic ${u}</b>. It is ${l} ${u} long and ${w} ${u} wide. How tall is it?`,tpl:`{A} ${u}`,answer:h,text:`mh ${l}${w}${h}`,explain:`<p>Base: ${l} × ${w} = ${l*w}.</p><p>${V} ÷ ${l*w} = <b>${h}</b> ${u}</p>`,nudge:`<p>Volume = base × height. Find the base, then divide.</p>`});},
 missB:()=>{const B=R(8,30),h=R(3,9);const ask=Math.random()<.5;return ask?ok({prompt:`A box has a volume of <b>${B*h} cubic cm</b>. Its base has an area of <b>${B} square cm</b>. How tall is it?`,tpl:'{A} cm',answer:h,text:`mb ${B}${h}`,explain:`<p>${B*h} ÷ ${B} = <b>${h}</b></p>`,nudge:`<p>Volume ÷ base area = height.</p>`})
  :ok({prompt:`A box has a volume of <b>${B*h} cubic cm</b> and is <b>${h} cm</b> tall. What is the area of its base?`,tpl:'{A} square cm',answer:B,text:`mbb ${B}${h}`,explain:`<p>${B*h} ÷ ${h} = <b>${B}</b></p>`,nudge:`<p>Volume ÷ height = base area.</p>`});},
 tens:()=>{const l=PK([10,20,30]),w=R(2,6),h=R(2,9);return ok({prompt:`A storage box is <b>${l} ft</b> by <b>${w} ft</b> by <b>${h} ft</b>. What is its volume?`,tpl:'{A} cubic feet',answer:l*w*h,text:`tn ${l}${w}${h}`,explain:`<p>${w} × ${h} = ${w*h}. ${w*h} × ${l} = <b>${N(l*w*h)}</b></p><p class="tip">You can multiply in any order. Save the ${l} for last!</p>`,nudge:`<p>Multiply the small numbers first, then × ${l}.</p>`});},
 comp:()=>{const A={l:R(2,4),w:R(2,3),h:R(2,4)};const Bb={l:R(1,3),w:A.w,h:R(1,Math.max(1,A.h-1))};const va=A.l*A.w*A.h,vb=Bb.l*Bb.w*Bb.h;
  return ok({vis:{t:'iso',b:[{x:0,...A},{x:A.l,...Bb}],lb:[{name:'A'},{name:'B'}]},prompt:`Box <b>A</b> is ${A.l} × ${A.w} × ${A.h}. Box <b>B</b> is ${Bb.l} × ${Bb.w} × ${Bb.h}. What is the total volume?`,tpl:'{A} cubic units',answer:va+vb,text:`cp ${JSON.stringify([A,Bb])}`,explain:`<p>A: ${A.l} × ${A.w} × ${A.h} = ${va}.</p><p>B: ${Bb.l} × ${Bb.w} × ${Bb.h} = ${vb}.</p><p>${va} + ${vb} = <b>${va+vb}</b></p>`,nudge:`<p>Find each box's volume, then add.</p>`,fast:25});},
 compW:c=>{const a=[R(4,8),R(3,5),R(3,5)],b=[R(1,3),R(2,3),R(2,3)];const va=a[0]*a[1]*a[2],vb=b[0]*b[1]*b[2];return st({prompt:`Gizmo builds a robot from two boxes. The body is <b>${a.join(' cm × ')} cm</b>. The head is <b>${b.join(' cm × ')} cm</b>. What is the robot's total volume?`,tpl:'{A} cubic cm',answer:va+vb,text:`cw ${a}${b}`,explain:`<p>Body: ${a.join(' × ')} = ${va}. Head: ${b.join(' × ')} = ${vb}.</p><p>${va} + ${vb} = <b>${va+vb}</b></p>`,nudge:`<p>Find each part's volume, then add.</p>`});},
 diffV:()=>{let a,b;do{a=[R(3,8),R(2,6),R(2,6)];b=[R(2,6),R(2,5),R(2,5)];}while(a[0]*a[1]*a[2]<=b[0]*b[1]*b[2]);const va=a[0]*a[1]*a[2],vb=b[0]*b[1]*b[2];return ok({prompt:`Box A is <b>${a.join(' × ')}</b> inches. Box B is <b>${b.join(' × ')}</b> inches. How much more volume does box A have?`,tpl:'{A} cubic inches more',answer:va-vb,text:`dv ${a}${b}`,explain:`<p>A: ${va}. B: ${vb}.</p><p>${va} − ${vb} = <b>${va-vb}</b></p>`,nudge:`<p>Find both volumes, then subtract.</p>`,fast:25});},
 tank:c=>{const l=PK([20,24,30,36]),w=PK([10,12,15]),H=PK([12,16,18,20]),h=H-R(2,6);const k=R(0,1);
  if(k===0)return st({prompt:`Ozzy's fish tank is <b>${l} in</b> long, <b>${w} in</b> wide and <b>${H} in</b> tall. How much water fills it to the top?`,tpl:'{A} cubic inches',answer:l*w*H,text:`tk ${l}${w}${H}`,explain:`<p>${l} × ${w} = ${l*w}. ${l*w} × ${H} = <b>${N(l*w*H)}</b></p>`,nudge:`<p>Base first (${l} × ${w}), then × ${H}.</p>`,fast:35});
  return st({prompt:`A fish tank is <b>${l} in</b> long, <b>${w} in</b> wide and <b>${H} in</b> tall. The water is <b>${h} in</b> deep. How many more cubic inches of water will fill it to the top?`,tpl:'{A} cubic inches',answer:l*w*(H-h),text:`tk2 ${l}${w}${H}${h}`,explain:`<p>The empty part is ${H} − ${h} = ${H-h} in tall.</p><p>${l} × ${w} × ${H-h} = <b>${N(l*w*(H-h))}</b></p>`,nudge:`<p>Only the empty part on top needs water. How tall is it?</p>`,fast:40});},
 crystals:c=>{const n=R(3,8),l=R(2,5),w=R(2,4),h=R(2,4);return st({prompt:`Dr. Quartz has <b>${n} boxes</b> of 1-inch crystal cubes. Each box is <b>${l} × ${w} × ${h}</b> inches and full. How many crystal cubes in all?`,tpl:'{A} crystals',answer:n*l*w*h,text:`cr ${n}${l}${w}${h}`,explain:`<p>One box: ${l} × ${w} × ${h} = ${l*w*h}.</p><p>${n} × ${l*w*h} = <b>${n*l*w*h}</b></p>`,nudge:`<p>Find one box, then multiply by ${n}.</p>`,fast:35});},
 pack:c=>{const s=PK([2,3]),a=s*R(2,4),b=s*R(2,3),d=s*R(1,3);const n=(a/s)*(b/s)*(d/s);return st({prompt:`Gizmo packs small cube boxes, <b>${s} inches</b> on each edge, into a big box <b>${a} × ${b} × ${d}</b> inches. How many small boxes fit?`,tpl:'{A} small boxes',answer:n,text:`pk ${s}${a}${b}${d}`,explain:`<p>Along each edge: ${a} ÷ ${s} = ${a/s}, ${b} ÷ ${s} = ${b/s}, ${d} ÷ ${s} = ${d/s}.</p><p>${a/s} × ${b/s} × ${d/s} = <b>${n}</b></p>`,nudge:`<p>How many small boxes fit along each edge? Then multiply.</p>`,fast:40});},
 sand:c=>{const bag=PK([4,6,8]);let l,w,h;do{l=R(3,8);w=R(2,5);h=R(2,4);}while((l*w*h)%bag);return st({prompt:`Coach Flex fills a sandpit <b>${l} ft</b> long, <b>${w} ft</b> wide and <b>${h} ft</b> deep. Each bag of sand fills <b>${bag} cubic feet</b>. How many bags does he need?`,tpl:'{A} bags',answer:l*w*h/bag,text:`sd ${l}${w}${h}${bag}`,explain:`<p>Volume: ${l} × ${w} × ${h} = ${l*w*h} cubic feet.</p><p>${l*w*h} ÷ ${bag} = <b>${l*w*h/bag}</b> bags</p>`,nudge:`<p>Find the volume, then divide by ${bag}.</p>`,fast:40});}
};
DEF('vol',5,[
 [r4.count,v5.layers,K('fill',v5.fill),r4.count2,r6.vLayer,r6.vMore],
 [v5.lwh,v5.words,v5.cube,v5.base,K('fill',v5.fill)],
 [v5.missH,v5.missB,v5.tens,v5.words,v5.cube],
 [v5.comp,v5.compW,v5.diffV,v5.tens,K('mist',r3.mVol),r3.moreBox,v5.missB],
 [v5.tank,v5.crystals,v5.pack,v5.sand,v5.compW,v5x.pan,v5x.bed,K('mist',r3.mVol)]]);

/* =================================== ⛰️ STORY SUMMIT =================================== */
/* size by round: small (Bronze/Silver), bigger later */
const big=c=>c.round>=3;
const w4={
 addSub:c=>{const k=R(0,5);const B=big(c);const n=(lo,hi)=>B?R(lo*3,hi*3):R(lo,hi);
  if(k===0){const a=n(24,60),b=n(18,50),s=R(10,a+b-5);return st({prompt:`Ms. Rosa baked <b>${a}</b> muffins in the morning and <b>${b}</b> in the afternoon. She sold <b>${s}</b>. How many muffins are left?`,tpl:'{A} muffins',answer:a+b-s,text:`as0 ${a} ${b} ${s}`,explain:`<p>Baked: ${a} + ${b} = ${a+b}.</p><p>Left: ${a+b} − ${s} = <b>${a+b-s}</b></p>`,nudge:`<p>Step 1: how many in all? Step 2: take away what was sold.</p>`});}
  if(k===1){const a=n(20,45),b=n(20,45),g=Math.ceil((a+b)/50)*50+50*R(1,3);return st({prompt:`Coach Flex did <b>${a}</b> push-ups on Monday and <b>${b}</b> on Tuesday. His goal is <b>${g}</b> push-ups. How many more does he need?`,tpl:'{A} push-ups',answer:g-a-b,text:`as1 ${a} ${b} ${g}`,explain:`<p>So far: ${a} + ${b} = ${a+b}.</p><p>${g} − ${a+b} = <b>${g-a-b}</b></p>`,nudge:`<p>Add what he did, then see how far he is from ${g}.</p>`});}
  if(k===2){const a=n(40,90),b=n(15,60),s=R(10,a+b-5);return st({prompt:`Grumbleroot had <b>${a}</b> toll coins. He collected <b>${b}</b> more, then spent <b>${s}</b> on troll snacks. How many coins does he have now?`,tpl:'{A} coins',answer:a+b-s,text:`as2 ${a} ${b} ${s}`,explain:`<p>${a} + ${b} = ${a+b}.</p><p>${a+b} − ${s} = <b>${a+b-s}</b></p>`,nudge:`<p>Add the coins he collected, then subtract what he spent.</p>`});}
  if(k===3){const a=n(30,80),off=R(5,a-5),on=n(5,40);return st({prompt:`Ozzy's train has <b>${a}</b> riders. At the Depot, <b>${off}</b> riders get off and <b>${on}</b> get on. How many riders are on the train now?`,tpl:'{A} riders',answer:a-off+on,text:`as3 ${a} ${off} ${on}`,explain:`<p>${a} − ${off} = ${a-off}.</p><p>${a-off} + ${on} = <b>${a-off+on}</b></p>`,nudge:`<p>Take away the riders who got off, then add the ones who got on.</p>`});}
  if(k===4){const g=B?100*R(5,9):10*R(15,30),a=R(Math.floor(g/5),Math.floor(g/3)),b=R(Math.floor(g/6),Math.floor(g/3));return st({prompt:`The Elder Wiz's spell book has <b>${g}</b> pages. He read <b>${a}</b> pages last week and <b>${b}</b> pages this week. How many pages are left?`,tpl:'{A} pages',answer:g-a-b,text:`as4 ${g} ${a} ${b}`,explain:`<p>Read: ${a} + ${b} = ${a+b}.</p><p>${g} − ${a+b} = <b>${g-a-b}</b></p>`,nudge:`<p>Find how many pages he read, then subtract from ${g}.</p>`});}
  const a=n(40,90),f=R(8,a-10);return st({prompt:`Skyla flew <b>${a}</b> miles on Monday. On Tuesday she flew <b>${f} fewer</b> miles. How many miles did she fly on both days?`,tpl:'{A} miles',answer:a+a-f,text:`as5 ${a} ${f}`,explain:`<p>Tuesday: ${a} − ${f} = ${a-f}.</p><p>Both days: ${a} + ${a-f} = <b>${2*a-f}</b></p>`,nudge:`<p>"Fewer" tells you Tuesday's miles. Find them first, then add both days.</p>`});},
 times:c=>{const L=[[`${c.name} found`,'Dr. Quartz found','crystals','did Dr. Quartz find'],['Nana Paws did','Coach Flex did','push-ups','did Coach Flex do'],['The Elder Wiz has','The Grey Goblin has','lonely socks','does the Grey Goblin have'],
  ["Ozzy's small train has",'His big train has','seats','does the big train have'],['A sparrow flew','Skyla flew','miles','did Skyla fly'],['On Monday Ms. Rosa sold','On Saturday she sold','pies','did she sell on Saturday'],['Gizmo has','Dr. Quartz has','test tubes','does Dr. Quartz have']];
  const [A,B,u,q]=PK(L);const a=u==='seats'?R(10,20):R(3,12),k=R(3,9);const mode=c.round===1?0:c.round>=3?R(1,2):R(0,2);
  if(mode===0)return st({prompt:`${A} <b>${a}</b> ${u}. ${B} <b>${k} times as many</b>. How many ${u} ${q}?`,tpl:`{A} ${u}`,answer:a*k,text:`tm0 ${A} ${a} ${k}`,explain:`<p>"${k} times as many" means multiply: ${a} × ${k} = <b>${a*k}</b></p>`,nudge:`<p>"Times as many" means <b>multiply</b>.</p>`});
  if(mode===1)return st({prompt:`${A} <b>${a}</b> ${u}. ${B} <b>${k} times as many</b>. How many ${u} is that <b>together</b>?`,tpl:`{A} ${u}`,answer:a*k+a,text:`tm1 ${A} ${a} ${k}`,explain:`<p>Step 1: ${a} × ${k} = ${a*k}.</p><p>Step 2: ${a*k} + ${a} = <b>${a*k+a}</b></p>`,nudge:`<p>Find the bigger amount first, then add both.</p>`});
  return st({prompt:`${A} <b>${a}</b> ${u}. ${B} <b>${k} times as many</b>. How many <b>more</b> is that?`,tpl:`{A} more`,answer:a*k-a,text:`tm2 ${A} ${a} ${k}`,explain:`<p>Step 1: ${a} × ${k} = ${a*k}.</p><p>Step 2: ${a*k} − ${a} = <b>${a*k-a}</b></p>`,nudge:`<p>Find the bigger amount first, then subtract.</p>`});},
 timesDiv:c=>{const L=[['Coach Flex did','push-ups','Nana Paws did','How many push-ups did Nana Paws do?'],['Dr. Quartz has','crystals','Gizmo has','How many crystals does Gizmo have?'],['The Grey Goblin stole','socks','the Elder Wiz lost','How many socks did the Elder Wiz lose?'],['Skyla flew','miles','a sparrow flew','How many miles did the sparrow fly?'],["Ozzy's big train has",'seats','his small train has','How many seats does the small train have?']];
  const [A,u,B,q]=PK(L);const a=R(3,12),k=R(3,9);return st({prompt:`${A} <b>${a*k}</b> ${u}. That is <b>${k} times as many</b> as ${B}. ${q}`,tpl:`{A} ${u}`,answer:a,text:`td ${A} ${a} ${k}`,explain:`<p>The ${a*k} is the bigger amount. To find the smaller one, divide: ${a*k} ÷ ${k} = <b>${a}</b></p>`,nudge:`<p>The bigger number is ${k} times the smaller. Divide by ${k}.</p>`});},
 howMany:c=>{const L=[['A bike costs','A helmet costs','$',[15,40],'How many times as much does the bike cost?'],['Coach Flex lifts','Gizmo lifts','pounds',[6,20],'How many times as much does Coach Flex lift?'],['The tall tower has','The short tower has','blocks',[4,12],'How many times as many blocks does the tall tower have?'],["Skyla's flight was",'A pigeon\'s flight was','miles',[3,10],'How many times as far did Skyla fly?']];const [A,B,u,[lo,hi],Qn]=PK(L);const b=R(lo,hi),k=R(2,8);const money=u==='$';
  return st({prompt:`${A} <b>${money?'$'+b*k:b*k+' '+u}</b>. ${B} <b>${money?'$'+b:b+' '+u}</b>. ${Qn}`,tpl:'{A} times',answer:k,text:`hm ${A} ${b} ${k}`,explain:`<p>${b*k} ÷ ${b} = <b>${k}</b>. The answer is "${k} times", not ${money?'dollars':u}!</p>`,nudge:`<p>How many ${b}s fit into ${b*k}? Divide.</p>`});},
 rem:mode=>c=>{const m=mode==='mix'?PK(['up','down','left']):mode;const d=R(4,9),n=big(c)?R(8,25):R(3,9),r=R(1,d-1);const t=d*n+r;
  const S={up:PK([[`<b>${t}</b> riders are waiting for Ozzy's train. Each car holds <b>${d}</b> riders. How many cars are needed so everyone can ride?`,'cars'],[`<b>${t}</b> kids are going on a field trip with the Kind Teacher. Each van holds <b>${d}</b> kids. How many vans are needed?`,'vans'],[`Ms. Rosa has <b>${t}</b> guests coming. Each table seats <b>${d}</b>. How many tables does she need?`,'tables']]),
   down:PK([[`Ms. Rosa baked <b>${t}</b> cookies. Each box holds <b>${d}</b>. How many boxes can she fill <b>completely</b>?`,'boxes'],[`Dr. Quartz has <b>${t}</b> crystals. He puts <b>${d}</b> in each bag. How many <b>full</b> bags can he make?`,'bags'],[`<b>${t}</b> kids sign up for Coach Flex's teams. Each team needs exactly <b>${d}</b> kids. How many full teams can he make?`,'teams']]),
   left:PK([[`The Grey Goblin puts <b>${t}</b> stolen socks into bags of <b>${d}</b>. How many socks are left over?`,'socks'],[`Nana Paws shares <b>${t}</b> treats equally among <b>${d}</b> dogs. How many treats are left over?`,'treats'],[`Gizmo puts <b>${t}</b> batteries into packs of <b>${d}</b>. How many batteries are left over?`,'batteries']])}[m];
  const ans=m==='up'?n+1:m==='down'?n:r;return st({prompt:S[0],tpl:`{A} ${S[1]}`,answer:ans,text:`rm ${m} ${t} ${d} ${S[1]}`,explain:`<p>${t} ÷ ${d} = ${n} remainder ${r}.</p><p>${m==='up'?`The ${r} extra still need a place, so round up: <b>${n+1}</b>.`:m==='down'?`Only full ones count, so <b>${n}</b>.`:`The remainder is what's left over: <b>${r}</b>.`}</p>`,nudge:`<p>Divide, then think: what does the remainder mean here?</p>`});},
 share:c=>{const d=R(3,9),n=R(8,25);const [a,u,q]=PK([[`Nana Paws has <b>${d*n}</b> treats to share equally among <b>${d}</b> dogs.`,'treats','How many treats does each dog get?'],[`Ms. Rosa puts <b>${d*n}</b> cupcakes on <b>${d}</b> trays, the same number on each.`,'cupcakes','How many cupcakes are on each tray?'],[`Coach Flex runs <b>${d*n}</b> laps in <b>${d}</b> days, the same number each day.`,'laps','How many laps does he run each day?']]);
  return st({prompt:`${a} ${q}`,tpl:`{A} ${u}`,answer:n,text:`sh ${d} ${n} ${u}`,explain:`<p>${d*n} ÷ ${d} = <b>${n}</b></p><p>Check: ${n} × ${d} = ${d*n} ✓</p>`,nudge:`<p>Share equally means divide.</p>`});},
 multAdd:c=>{const k=R(0,2);
  if(k===0){const p=5*R(3,8),d=R(4,7),x=5*R(4,10);return st({prompt:`Coach Flex does <b>${p}</b> push-ups every day for <b>${d}</b> days. On the last day he does <b>${x}</b> extra. How many push-ups in all?`,tpl:'{A} push-ups',answer:p*d+x,text:`ma0 ${p} ${d} ${x}`,explain:`<p>${p} × ${d} = ${p*d}.</p><p>${p*d} + ${x} = <b>${p*d+x}</b></p>`,nudge:`<p>Multiply first, then add the extra.</p>`});}
  if(k===1){const b=R(3,7),t=R(12,24),x=R(5,15);return st({prompt:`Gizmo buys <b>${b}</b> packs of <b>${t}</b> bolts. He already had <b>${x}</b> bolts. How many bolts does he have now?`,tpl:'{A} bolts',answer:b*t+x,text:`ma1 ${b} ${t} ${x}`,explain:`<p>${b} × ${t} = ${b*t}.</p><p>${b*t} + ${x} = <b>${b*t+x}</b></p>`,nudge:`<p>Find how many are in the packs, then add.</p>`});}
  const c1=R(3,6),b1=R(3,5),c2=R(2,5),b2=R(4,6);return st({prompt:`Dr. Quartz has <b>${c1}</b> lab coats with <b>${b1}</b> buttons each, and <b>${c2}</b> fancy lab coats with <b>${b2}</b> buttons each. How many buttons in all?`,tpl:'{A} buttons',answer:c1*b1+c2*b2,text:`ma2 ${c1}${b1}${c2}${b2}`,explain:`<p>${c1} × ${b1} = ${c1*b1}. ${c2} × ${b2} = ${c2*b2}.</p><p>${c1*b1} + ${c2*b2} = <b>${c1*b1+c2*b2}</b></p>`,nudge:`<p>Find the buttons on each kind of coat, then add.</p>`});},
 multSub:c=>{const k=R(0,1);
  if(k===0){const cars=R(5,9),seats=R(16,30),riders=R(Math.floor(cars*seats*0.6),cars*seats-3);return st({prompt:`Ozzy's train has <b>${cars}</b> cars with <b>${seats}</b> seats in each. <b>${riders}</b> riders get on. How many seats are empty?`,tpl:'{A} empty seats',answer:cars*seats-riders,text:`ms0 ${cars} ${seats} ${riders}`,explain:`<p>Seats: ${cars} × ${seats} = ${cars*seats}.</p><p>${cars*seats} − ${riders} = <b>${cars*seats-riders}</b></p>`,nudge:`<p>Find all the seats first, then take away the riders.</p>`});}
  const tr=R(4,8),per=R(18,36),sold=R(Math.floor(tr*per/2),tr*per-5);return st({prompt:`Ms. Rosa bakes <b>${tr}</b> trays with <b>${per}</b> cookies on each tray. She sells <b>${sold}</b> cookies. How many are left?`,tpl:'{A} cookies',answer:tr*per-sold,text:`ms1 ${tr} ${per} ${sold}`,explain:`<p>${tr} × ${per} = ${tr*per}.</p><p>${tr*per} − ${sold} = <b>${tr*per-sold}</b></p>`,nudge:`<p>Multiply first, then subtract.</p>`});},
 money:c=>{const p=R(2,5),n=R(20,60),s=R(15,Math.min(90,p*n-10));return st({prompt:`Grumbleroot charges <b>${p} coins</b> to cross his bridge. <b>${n}</b> travelers cross today. He spends <b>${s}</b> coins on troll snacks. How many coins are left?`,tpl:'{A} coins',answer:p*n-s,text:`mo ${p} ${n} ${s}`,explain:`<p>Collected: ${n} × ${p} = ${p*n}.</p><p>${p*n} − ${s} = <b>${p*n-s}</b></p>`,nudge:`<p>Step 1: coins collected. Step 2: subtract the snacks.</p>`});},
 three:(c,K)=>{const k=K!=null?K:R(0,5);
  if(k===0){const tr=R(4,7),per=PK([12,18,24]),sold=R(20,tr*per-20),b=PK([4,5,6]);const left=tr*per-sold;return st({prompt:`Ms. Rosa bakes <b>${tr}</b> trays of <b>${per}</b> cookies. She sells <b>${sold}</b>. She packs the rest into bags of <b>${b}</b>. How many <b>full</b> bags can she make?`,tpl:'{A} full bags',answer:Math.floor(left/b),text:`t0 ${tr}${per}${sold}${b}`,explain:`<p>Baked: ${tr} × ${per} = ${tr*per}. Left: ${tr*per} − ${sold} = ${left}.</p><p>${left} ÷ ${b} = ${Math.floor(left/b)} remainder ${left%b}, so <b>${Math.floor(left/b)}</b> full bags.</p>`,nudge:`<p>Three steps: multiply, subtract, then divide.</p>`,fast:40});}
  if(k===1){const w=R(3,6),per=R(3,5),g=R(1,5),sh=PK([2,3,4]);const tot=w*per-g;if(tot%sh||tot<=0)return w4.three(c,K);return st({prompt:`Nana Paws knits <b>${per}</b> scarves every week for <b>${w}</b> weeks. She keeps <b>${g}</b>. She gives the rest equally to <b>${sh}</b> shelters. How many scarves does each shelter get?`,tpl:'{A} scarves',answer:tot/sh,text:`t1 ${w}${per}${g}${sh}`,explain:`<p>${per} × ${w} = ${w*per}. ${w*per} − ${g} = ${tot}.</p><p>${tot} ÷ ${sh} = <b>${tot/sh}</b></p>`,nudge:`<p>Multiply, subtract, then share.</p>`,fast:40});}
  if(k===2){const c1=R(3,6),b1=R(3,5),c2=R(2,4),b2=R(4,6),lost=R(2,8);const t=c1*b1+c2*b2;return st({prompt:`Dr. Quartz has <b>${c1}</b> lab coats with <b>${b1}</b> buttons each and <b>${c2}</b> fancy coats with <b>${b2}</b> buttons each. <b>${lost}</b> buttons fall off in the lab. How many buttons are still on?`,tpl:'{A} buttons',answer:t-lost,text:`t2 ${c1}${b1}${c2}${b2}${lost}`,explain:`<p>${c1} × ${b1} = ${c1*b1}. ${c2} × ${b2} = ${c2*b2}. Total ${t}.</p><p>${t} − ${lost} = <b>${t-lost}</b></p>`,nudge:`<p>Find the buttons on each kind of coat, add, then subtract.</p>`,fast:40});}
  if(k===3){const pk=R(3,6),per=PK([8,10,12]),use=PK([3,4,6]);const tot=pk*per;const g=Math.floor(tot/use);return st({prompt:`Gizmo buys <b>${pk}</b> packs of <b>${per}</b> batteries. Each gadget needs <b>${use}</b> batteries. How many gadgets can he power?`,tpl:'{A} gadgets',answer:g,text:`t3 ${pk}${per}${use}`,explain:`<p>${pk} × ${per} = ${tot} batteries.</p><p>${tot} ÷ ${use} = ${g} remainder ${tot%use}: <b>${g}</b> gadgets (${tot%use} left over).</p>`,nudge:`<p>Find all the batteries, then divide.</p>`,fast:40});}
  if(k===4){const a=R(12,30),k2=R(3,5),f=R(5,a-2);return st({prompt:`Skyla found <b>${a}</b> feathers. Coach Flex found <b>${k2} times as many</b>. Then Coach Flex lost <b>${f}</b> of his. How many feathers do they have together now?`,tpl:'{A} feathers',answer:a+a*k2-f,text:`t4 ${a}${k2}${f}`,explain:`<p>Coach Flex: ${a} × ${k2} = ${a*k2}. After losing some: ${a*k2} − ${f} = ${a*k2-f}.</p><p>Together: ${a} + ${a*k2-f} = <b>${a+a*k2-f}</b></p>`,nudge:`<p>Find Coach Flex's feathers first.</p>`,fast:40});}
  const d=R(4,8),seats=R(5,8),riders=d*seats*R(2,3)+R(1,seats-1),r2=Math.ceil(riders/seats);return st({prompt:`<b>${riders}</b> riders want a ride. Each of Ozzy's cars holds <b>${seats}</b> riders, and the train pulls <b>${d}</b> cars on each trip. How many <b>trips</b> does the train need so everyone rides?`,tpl:'{A} trips',answer:Math.ceil(r2/d),text:`t5 ${riders}${seats}${d}`,explain:`<p>Cars: ${riders} ÷ ${seats} = ${Math.floor(riders/seats)} R ${riders%seats}, so ${r2} cars (round up).</p><p>Trips: ${r2} ÷ ${d} → <b>${Math.ceil(r2/d)}</b> trips (round up again).</p>`,nudge:`<p>Find the cars first. Then how many trips of ${d} cars?</p>`,fast:45});},
 fewer:c=>{const a=10*R(25,90),f=10*R(5,20);const [S,u]=PK([[`The stadium sold <b>${a}</b> tickets on Friday. On Saturday it sold <b>${f} more</b> than on Friday. How many tickets were sold on both days?`,'tickets'],[`Ms. Rosa's café had <b>${a}</b> visitors in May. In June it had <b>${f} fewer</b>. How many visitors in both months?`,'visitors']]);const more=/more/.test(S);const b=more?a+f:a-f;
  return st({prompt:S,tpl:`{A} ${u}`,answer:a+b,text:`fw ${a} ${f} ${u}`,explain:`<p>Second day: ${N(a)} ${more?'+':'−'} ${f} = ${N(b)}.</p><p>Both: ${N(a)} + ${N(b)} = <b>${N(a+b)}</b></p>`,nudge:`<p>Find the second amount first, then add both.</p>`});}
};
DEF('word',4,[
 [w4.addSub,w4.times,w4.timesDiv,w4.howMany,w4.rem('left'),w4.share,w4.rem('down'),w4x.shop],
 [w4.addSub,w4.times,w4.rem('up'),w4.rem('down'),w4.multAdd,w4.multSub],
 [w4.addSub,w4.money,w4.times,w4.multSub,w4.fewer,r5.divTwo,K('shareLeft',r5.shareLeft),w4.multAdd],
 [w4.rem('mix'),w4x.shop,r3.timesBig,K('coats',c=>w4.three(c,2)),w4.multSub,w4.addSub,w4.fewer,r3.mVans],
 [c=>w4.three(c,0),c=>w4.three(c,1),c=>w4.three(c,3),c=>w4.three(c,4),c=>w4.three(c,5),r3.books,r3.garden,r3.timesBig]]);

/* ---------- grade 5 ---------- */
const w5={
 ops:c=>{const k=c.round<=1?R(0,1):c.round===2?R(1,3):R(2,4);let e,v,ex;
  if(k===0){const a=R(2,20),b=R(2,9),d=R(2,9);e=`${a} + ${b} × ${d}`;v=a+b*d;ex=`<p>Multiply first: ${b} × ${d} = ${b*d}.</p><p>${a} + ${b*d} = <b>${v}</b></p>`;}
  else if(k===1){const a=R(3,9),b=R(2,9),d=R(2,20),s=Math.min(d,a*b-1);e=`${a} × ${b} − ${s}`;v=a*b-s;ex=`<p>Multiply first: ${a} × ${b} = ${a*b}.</p><p>${a*b} − ${s} = <b>${v}</b></p>`;}
  else if(k===2){const a=R(2,9),b=R(1,9),d=R(2,6);e=`(${a} + ${b}) × ${d}`;v=(a+b)*d;ex=`<p>Parentheses first: ${a} + ${b} = ${a+b}.</p><p>${a+b} × ${d} = <b>${v}</b></p>`;}
  else if(k===3){const d=R(2,6),q=R(2,9),s=R(1,9),a=d*q+s,x=R(2,15);e=`(${a} − ${s}) ÷ ${d} + ${x}`;v=q+x;ex=`<p>Parentheses: ${a} − ${s} = ${a-s}.</p><p>Divide: ${a-s} ÷ ${d} = ${q}. Add: ${q} + ${x} = <b>${v}</b></p>`;}
  else{const a=R(2,9),b=R(2,5),d=R(2,5),m=R(2,4);e=`[${a} + (${b} × ${d})] × ${m}`;v=(a+b*d)*m;ex=`<p>Inside first: ${b} × ${d} = ${b*d}, then ${a} + ${b*d} = ${a+b*d}.</p><p>${a+b*d} × ${m} = <b>${v}</b></p>`;}
  return ok({prompt:'Use the order of operations.',tpl:`${e} = {A}`,answer:v,text:`op ${e}`,explain:ex,nudge:`<p>Parentheses and brackets first, then × and ÷, then + and −.</p>`,fast:20});},
 expr:c=>{const k=R(0,2);let S,r,w;
  if(k===0){const p=R(2,6),n=R(6,12),x=R(2,9);S=`Gizmo buys <b>${p}</b> packs of <b>${n}</b> batteries and <b>${x}</b> single batteries.`;r=`${p} × ${n} + ${x}`;w=[`${p} × (${n} + ${x})`,`${p} + ${n} × ${x}`,`(${p} + ${n}) × ${x}`];}
  else if(k===1){const a=R(5,12),b=R(2,8),f=R(2,5);S=`Ms. Rosa bakes <b>${a}</b> muffins and <b>${b}</b> pies, then makes <b>${f} times</b> that many items for the fair.`;r=`(${a} + ${b}) × ${f}`;w=[`${a} + ${b} × ${f}`,`${a} × ${f} + ${b}`,`${a} + ${b} + ${f}`];}
  else{let t,s,g;do{t=R(20,50);s=R(2,9);g=R(2,5);}while((t-s)%g);S=`Coach Flex has <b>${t}</b> balls. He gives away <b>${s}</b>, then shares the rest equally among <b>${g}</b> teams.`;r=`(${t} − ${s}) ÷ ${g}`;w=[`${t} − ${s} ÷ ${g}`,`${t} ÷ ${g} − ${s}`,`(${t} + ${s}) ÷ ${g}`];}
  return choice(st({prompt:`${S} Which expression matches the story?`,tpl:'{A}',text:`ex ${S}`,explain:`<p>The story does things in this order, so the expression is <b>${r}</b>.</p><p>Parentheses show what happens first.</p>`,nudge:`<p>What happens first in the story? That part needs parentheses (or must be × or ÷).</p>`}),r,w);},
 fracOf:c=>{const [n,d]=PK([[2,3],[3,4],[2,5],[3,5],[5,6],[3,8],[1,4],[4,5]]);const tot=d*R(3,8);const part=tot/d*n;const not=c.round>=2&&Math.random()<.6;const [S,u,adj,nadj]=PK([[`Dr. Quartz has <b>${tot}</b> crystals. <b>${F(n,d)}</b> of them are purple.`,'crystals','purple','not purple'],[`Ozzy's train has <b>${tot}</b> riders. <b>${F(n,d)}</b> of them are kids.`,'riders','kids','grown-ups'],[`The Grey Goblin stole <b>${tot}</b> socks. <b>${F(n,d)}</b> of them are striped.`,'socks','striped','not striped']]);
  return st({prompt:`${S} How many are <b>${not?nadj:adj}</b>?`,tpl:`{A} ${u}`,answer:not?tot-part:part,text:`fo ${tot} ${n}/${d} ${not} ${u}`,explain:`<p>${F(1,d)} of ${tot} = ${tot} ÷ ${d} = ${tot/d}. So ${F(n,d)} = ${tot/d} × ${n} = ${part}.</p>${not?`<p>${tot} − ${part} = <b>${tot-part}</b></p>`:`<p>The answer is <b>${part}</b>.</p>`}`,nudge:`<p>Divide by ${d}, then multiply by ${n}.${not?' Then find the rest.':''}</p>`});},
 moneyTot:c=>{const [it,lo,hi]=PK([['muffins',175,325],['juice boxes',95,175],['pencils',45,95],['stickers',25,75]]);const p=5*R(lo/5,hi/5),n=R(3,6),x=PK([125,150,250,99,199]);const tot=p*n+x;const o=st({prompt:`At Ms. Rosa's café, ${it} cost <b>${$$(p)}</b> each. You buy <b>${n}</b> ${it} and a drink for <b>${$$(x)}</b>. How much do you spend?`,tpl:'$ {A}',text:`mt ${p}${n}${x}`,explain:`<p>${n} × ${$$(p)} = ${$$(p*n)}.</p><p>${$$(p*n)} + ${$$(x)} = <b>${$$(tot)}</b></p>`,nudge:`<p>Multiply the ${it}, then add the drink.</p>`});return DEC(o,tot,2);},
 change:c=>{const pay=PK([1000,2000,2000,5000]);const n=R(2,4);const p=5*R(41,Math.min(240,Math.floor(pay/(5*n))-2));if(p*n>=pay||p%100===0)return w5.change(c);const o=st({prompt:`${c.name} buys <b>${n}</b> books at the Library sale for <b>${$$(p)}</b> each and pays with a <b>$${pay/100}</b> bill. How much change?`,tpl:'$ {A}',text:`ch ${pay}${p}${n}`,explain:`<p>Cost: ${n} × ${$$(p)} = ${$$(p*n)}.</p><p>${$$(pay)} − ${$$(p*n)} = <b>${$$(pay-p*n)}</b></p>`,nudge:`<p>Find the cost first, then subtract from $${pay/100}.</p>`});return DEC(o,pay-p*n,2);},
 decMult:c=>{const k=R(0,2);let o,v;
  if(k===0){const a=R(12,39),d=R(3,7);if(a%10===0)return w5.decMult(c);v=a*d;o=st({prompt:`Skyla flies <b>${D(a,1)} km</b> every day for <b>${d}</b> days. How far does she fly?`,tpl:'{A} km',text:`dm0 ${a}${d}`,explain:`<p>${D(a,1)} × ${d}: think ${a} × ${d} = ${a*d}, then 1 decimal place.</p><p>= <b>${dstr(v,1)}</b> km</p>`,nudge:`<p>Multiply like whole numbers, then put the decimal point back.</p>`});return DEC(o,v,1);}
  if(k===1){const a=R(105,295),d=R(2,6);if(a%5||a%10===0)return w5.decMult(c);v=a*d;o=st({prompt:`One of Gizmo's batteries weighs <b>${D(a,2)} kg</b>. How much do <b>${d}</b> batteries weigh?`,tpl:'{A} kg',text:`dm1 ${a}${d}`,explain:`<p>${a} × ${d} = ${a*d}, then 2 decimal places: <b>${dstr(v,2)}</b> kg</p>`,nudge:`<p>Multiply, then count the decimal places.</p>`});return DEC(o,v,2);}
  const a=R(12,49),b=R(12,29);if(a%10===0||b%10===0)return w5.decMult(c);v=a*b;o=st({prompt:`Ms. Rosa's rug is <b>${D(a,1)} m</b> by <b>${D(b,1)} m</b>. What is its area?`,tpl:'{A} square meters',text:`dm2 ${a}${b}`,explain:`<p>${a} × ${b} = ${a*b}. Two decimal places in all: <b>${dstr(v,2)}</b></p>`,nudge:`<p>Multiply like whole numbers, then put back 2 decimal places.</p>`});return DEC(o,v,2);},
 decAdd:c=>{const a=R(11,49),b=R(105,395);if(a%10===0||b%5||b%10===0)return w5.decAdd(c);const v=a*10+b;const o=st({prompt:`Coach Flex runs <b>${D(a,1)} km</b> in the morning and <b>${D(b,2)} km</b> in the evening. How far does he run?`,tpl:'{A} km',text:`da ${a}${b}`,explain:`<p>Line up the points: ${D(a*10,2)} + ${D(b,2)} = <b>${dstr(v,2)}</b></p>`,nudge:`<p>Write ${D(a,1)} as ${D(a*10,2)} so both have 2 decimal places.</p>`});return DEC(o,v,2);},
 unitDiv:c=>{const k=R(0,2);
  if(k===0){const L=R(2,8),d=PK([2,3,4,5]);return st({prompt:`Nana Paws has <b>${L} feet</b> of ribbon. She cuts it into pieces <b>${F(1,d)} foot</b> long. How many pieces?`,tpl:'{A} pieces',answer:L*d,text:`ud0 ${L}${d}`,explain:`<p>Each foot makes ${d} pieces.</p><p>${L} ÷ ${F(1,d)} = ${L} × ${d} = <b>${L*d}</b></p>`,nudge:`<p>How many ${F(1,d)}-foot pieces fit in 1 foot?</p>`});}
  if(k===1){const d=PK([2,3,4]),n=PK([2,3,4,5]);return st({prompt:`Ms. Rosa has <b>${F(1,d)}</b> of a pie left. She shares it equally among <b>${n}</b> friends. What fraction of the whole pie does each friend get?`,tpl:FA(d*n),answer:1,text:`ud1 ${d}${n}`,explain:`<p>${F(1,d)} ÷ ${n} = ${F(1,d*n)}.</p><p>The top is <b>1</b>: each friend gets ${F(1,d*n)} of the pie.</p>`,nudge:`<p>Splitting ${F(1,d)} into ${n} parts makes each part ${n} times smaller.</p>`});}
  const s=R(2,6),d=PK([2,3,4]);return st({prompt:`Dr. Quartz has <b>${s} cups</b> of crystal salt. Each test uses <b>${F(1,d)} cup</b>. How many tests can he do?`,tpl:'{A} tests',answer:s*d,text:`ud2 ${s}${d}`,explain:`<p>${s} ÷ ${F(1,d)} = ${s} × ${d} = <b>${s*d}</b></p>`,nudge:`<p>How many ${F(1,d)} cups are in 1 cup?</p>`});},
 fracAdd:c=>{const pairs=[[2,3],[2,4],[3,4],[2,5],[3,6],[4,6],[2,6],[4,8],[3,5]];const [b,d]=PK(pairs);const l=b*d/gcd(b,d);let a,cc;do{a=R(1,b-1);cc=R(1,d-1);}while(gcd(a,b)>1||gcd(cc,d)>1);const sub=Math.random()<.4&&a/b>cc/d;const top=sub?a*l/b-cc*l/d:a*l/b+cc*l/d;if(top<=0)return w5.fracAdd(c);
  return st({prompt:sub?`Ms. Rosa has <b>${F(a,b)} cup</b> of honey. She uses <b>${F(cc,d)} cup</b>. How much is left?`:`Ms. Rosa uses <b>${F(a,b)} cup</b> of flour and <b>${F(cc,d)} cup</b> of sugar. How much is that in all?`,tpl:`${FA(l)} cup${!sub&&top>l?'s':''}`,answer:top,text:`fa ${a}/${b} ${cc}/${d} ${sub}`,explain:`<p>Make the bottoms match: ${F(a,b)} = ${F(a*l/b,l)}, ${F(cc,d)} = ${F(cc*l/d,l)}.</p><p>${a*l/b} ${sub?'−':'+'} ${cc*l/d} = <b>${top}</b>, so ${F(top,l)}</p>`,nudge:`<p>Change both fractions to ${l}ths first.</p>`});},
 fracMult:c=>{const [a,b]=PK([[1,2],[2,3],[3,4],[1,3],[3,5]]),[x,y]=PK([[1,2],[1,3],[2,3],[1,4],[3,4]]);return st({prompt:`<b>${F(a,b)}</b> of Ms. Rosa's garden is vegetables. <b>${F(x,y)}</b> of the vegetable part is carrots. What fraction of the whole garden is carrots?`,tpl:FA(b*y),answer:a*x,text:`fm ${a}/${b} ${x}/${y}`,explain:`<p>${F(x,y)} of ${F(a,b)} = ${F(x,y)} × ${F(a,b)} = ${F(a*x,b*y)}.</p><p>The top is <b>${a*x}</b>.</p>`,nudge:`<p>"Of" means multiply: tops times tops, bottoms times bottoms.</p>`});},
 perItem:c=>{const n=R(3,8),p=5*R(25,90);const tot=n*p;const o=st({prompt:`Ozzy pays <b>${$$(tot)}</b> for <b>${n}</b> train tickets. Each ticket costs the same. How much is one ticket?`,tpl:'$ {A}',text:`pi ${n}${p}`,explain:`<p>${$$(tot)} ÷ ${n} = <b>${$$(p)}</b></p><p>Check: ${n} × ${$$(p)} = ${$$(tot)} ✓</p>`,nudge:`<p>Share the total equally: divide by ${n}.</p>`});return DEC(o,p,2);},
 whole:c=>{const k=R(0,2);
  if(k===0){const t=R(11,15),r=R(105,185);return st({prompt:`Ozzy's train makes <b>${t}</b> trips a day. Each trip carries <b>${r}</b> riders. How many riders a day?`,tpl:'{A} riders',answer:t*r,text:`wh0 ${t}${r}`,explain:`<p>${r} × 10 = ${N(r*10)}. ${r} × ${t-10} = ${r*(t-10)}.</p><p>${N(r*10)} + ${r*(t-10)} = <b>${N(t*r)}</b></p>`,nudge:`<p>Split ${t} into 10 + ${t-10} and multiply each part.</p>`});}
  if(k===1){const d=R(12,25),q=R(15,45);return st({prompt:`Coach Flex ran <b>${N(d*q)}</b> meters in <b>${d}</b> days, the same each day. How many meters a day?`,tpl:'{A} meters',answer:q,text:`wh1 ${d}${q}`,explain:`<p>${N(d*q)} ÷ ${d} = <b>${q}</b></p><p>Check: ${d} × ${q} = ${N(d*q)} ✓</p>`,nudge:`<p>Estimate first: ${d} × 20 = ${d*20}, ${d} × 40 = ${d*40}.</p>`});}
  const s=R(24,48),r=R(12,30);return st({prompt:`The stadium has <b>${s}</b> rows with <b>${r}</b> seats in each row. How many seats?`,tpl:'{A} seats',answer:s*r,text:`wh2 ${s}${r}`,explain:`<p>${s} × ${r} = <b>${N(s*r)}</b></p>`,nudge:`<p>Multiply ${s} × ${r}: do ${s} × ${Math.floor(r/10)*10} and ${s} × ${r%10}, then add.</p>`});},
 money3:c=>{const a=5*R(30,90),n=R(2,4),b=5*R(50,150),pay=PK([2000,5000]);const tot=a*n+b;if(tot>=pay)return w5.money3(c);const o=st({prompt:`Ms. Rosa buys <b>${n}</b> bags of flour at <b>${$$(a)}</b> each and a jar of honey for <b>${$$(b)}</b>. She pays with a <b>$${pay/100}</b> bill. How much change does she get?`,tpl:'$ {A}',text:`m3 ${a}${n}${b}${pay}`,explain:`<p>Flour: ${n} × ${$$(a)} = ${$$(a*n)}. Total: ${$$(a*n)} + ${$$(b)} = ${$$(tot)}.</p><p>Change: ${$$(pay)} − ${$$(tot)} = <b>${$$(pay-tot)}</b></p>`,nudge:`<p>Three steps: multiply, add, subtract.</p>`,fast:45});return DEC(o,pay-tot,2);},
 frac3:(c,K)=>{const k=K!=null?K:R(0,2);
  if(k===0){const d=PK([3,4]),tot=d*R(4,8)*2,n=R(1,d-1);const part=tot/d*n,rest=tot-part;return st({prompt:`Dr. Quartz grows <b>${tot}</b> crystals. <b>${F(n,d)}</b> of them are blue. He gives <b>half</b> of the other crystals to Gizmo. How many crystals does Gizmo get?`,tpl:'{A} crystals',answer:rest/2,text:`f30 ${tot}${n}${d}`,explain:`<p>Blue: ${tot} ÷ ${d} × ${n} = ${part}. Others: ${tot} − ${part} = ${rest}.</p><p>Half: ${rest} ÷ 2 = <b>${rest/2}</b></p>`,nudge:`<p>Find the blue ones, then the others, then half.</p>`,fast:45});}
  if(k===1){const q=R(2,4),d=PK([2,3,4]),used=R(2,q*d-2);const cups=q*4;return st({prompt:`Ms. Rosa has <b>${q} cups</b> of milk. Each batch of pancakes needs <b>${F(1,d)} cup</b>. She already made <b>${used}</b> batches. How many more batches can she make?`,tpl:'{A} more batches',answer:q*d-used,text:`f31 ${q}${d}${used}`,explain:`<p>${q} ÷ ${F(1,d)} = ${q} × ${d} = ${q*d} batches in all.</p><p>${q*d} − ${used} = <b>${q*d-used}</b></p>`,nudge:`<p>How many batches can ${q} cups make altogether?</p>`,fast:45});}
  const L=R(3,6),d=PK([2,4]),g=R(2,5);const pieces=L*d;if(pieces%g)return w5.frac3(c,K);return st({prompt:`Gizmo has <b>${L} meters</b> of wire. He cuts it into <b>${F(1,d)}-meter</b> pieces and shares them equally among <b>${g}</b> robots. How many pieces does each robot get?`,tpl:'{A} pieces',answer:pieces/g,text:`f32 ${L}${d}${g}`,explain:`<p>Pieces: ${L} × ${d} = ${pieces}.</p><p>${pieces} ÷ ${g} = <b>${pieces/g}</b></p>`,nudge:`<p>First count the pieces, then share them.</p>`,fast:45});},
 dec3:c=>{const a=R(12,35),b=R(8,25),d=R(4,6);if(a%10===0||b%10===0)return w5.dec3(c);const v=(a-b>0?a+b:a+b)*d;const o=st({prompt:`Skyla flies <b>${D(a,1)} km</b> to the lake, then <b>${D(b,1)} km</b> on to the cliffs, every day. How far does she fly in <b>${d}</b> days?`,tpl:'{A} km',text:`d3 ${a}${b}${d}`,explain:`<p>One day: ${D(a,1)} + ${D(b,1)} = ${dstr(a+b,1)} km.</p><p>${d} × ${dstr(a+b,1)} = <b>${dstr(v,1)}</b> km</p>`,nudge:`<p>Find one day first, then multiply.</p>`,fast:40});return DEC(o,v,1);}
};
DEF('word',5,[
 [w5.ops,w5.fracOf,w5.moneyTot,w5.decMult,w5.whole,w4.rem('mix')],
 [w5.ops,w5.expr,w5.change,w5.unitDiv,w5.fracOf,w5.decAdd],
 [w5.fracAdd,w5.perItem,w5.ops,w5.fracMult,w5.change,w5.unitDiv,w5.whole],
 [w5.ops,w5.fracMult,w5.money3,w5.decMult,w5.expr,w5.fracAdd,r3.mOps],
 [w5.money3,c=>w5.frac3(c,0),c=>w5.frac3(c,1),w5.dec3,w5x.decShare,w5x.fracMoney,w5x.flour,w5x.opsStory]]);





})();
/* plan-geo.js: Shape Island (geo) and Graph Garden (graph), grades 1–5 (Common Core year plans, Oct 2026).
   Every question is doable in your head: small sides, rulers ≤ 12, coordinates 0–10, line plots ≤ 12 marks.
   Uses the new answer formats (multi = select all, tf = true/false table, nlt = number-line tap, plot = grid tap; all answer:1)
   and the new pictures (shape, shapes, solid, ruler, grid, lplot, tally, lines). Loads after plan.js; these defs replace earlier ones. */
(function(){'use strict';const {R,PK,SH,P2,N,PL,F,FA,gcd,T,D,$$,WHO,choice,old}=PLAN.H;
/* ---------- shared helpers ---------- */
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const sum=a=>a.reduce((x,y)=>x+y,0);
const pickN=(a,n)=>SH(a).slice(0,n);
const LET=['A','B','C','D','E'];
const AN=w=>(/^[aeiou]/i.test(w)?'an ':'a ')+w;
const ABn=w=>AN(w).replace(w,`<b>${w}</b>`);
const ok=o=>Object.assign({fast:12},o);
const st=o=>Object.assign({fast:25,wp:1},o);
/* new formats (the UI checks them; answer is the sentinel 1) */
const MU=o=>Object.assign({fast:20},o,{tpl:'{A}',answer:1});
const TFq=o=>Object.assign({fast:25},o,{tpl:'{A}',answer:1});
const NL=(o,lo,hi,den,a)=>Object.assign({fast:15},o,{tpl:'{A}',answer:1,nlt:{lo,hi,den,ans:a}});
const PT=(o,max,x,y,pts)=>Object.assign({fast:15},o,{tpl:'{A}',answer:1,plot:pts?{max,ans:[x,y],pts}:{max,ans:[x,y]}});
/* choose n items with at least one that is good and one that is not */
function mix(pool,good,n){let s=pickN(pool,n);for(let g=0;g<400;g++){s=pickN(pool,n);const k=s.filter(good).length;if(k>=1&&k<n)break;}return s;}
/* true/false rows [statement, truth, reason]: n rows with both kinds */
function tfRows(pool,n){let s=pickN(pool,n);for(let g=0;g<400;g++){s=pickN(pool,n);const k=s.filter(r=>r[1]).length;if(k>=1&&k<n)break;}return s;}
const tfQ=(prompt,rows,nudge)=>TFq({prompt,tf:rows.map(r=>({s:r[0],t:r[1]})),text:`tf ${rows.map(r=>r[0]).join('|')}`,
 explain:`<p>${rows.map(r=>`${r[0]} <b>${r[1]?'True':'False'}</b>${r[2]?`: ${r[2]}`:''}`).join('<br>')}</p>`,nudge:`<p>${nudge||'Read each sentence. Is it true every time? If it can fail even once, it is false.'}</p>`});
/* select-all from shape specs: good(spec) decides */
const selEx=(list,good,name)=>`<p>${list.map((s,i)=>`${LET[i]}: ${name(s)}${good(s)?' ✓':''}`).join('<br>')}</p><p>So the answer is <b>${list.map((s,i)=>good(s)?LET[i]:'').filter(Boolean).join(', ')}</b>.</p>`;
const ansOf=(list,good)=>list.map((s,i)=>good(s)?i:-1).filter(i=>i>=0);
/* characters with fixed pronouns */
const PP={quartz:['Dr. Quartz','he'],rosa:['Ms. Rosa','she'],flex:['Coach Flex','he'],wiz:['the Elder Wiz','he'],troll:['Grumbleroot','he'],skyla:['Skyla','she'],
 gizmo:['Gizmo','he'],nana:['Nana Paws','she'],goblin:['the Grey Goblin','he'],ozzy:['Ozzy','he'],teacher:['the Kind Teacher','she']};
const who=k=>{const [n,h]=PP[k||PK(Object.keys(PP))];const m=h==='he';return {n,N:cap(n),he:h,He:cap(h),his:m?'his':'her',him:m?'him':'her'};};
const MEN=['quartz','flex','wiz','troll','gizmo','ozzy','goblin'],WOMEN=['rosa','skyla','nana','teacher'];
/* "Is he right? Choose the reason."  right===true means the claim is right (the answer is "He is right!") */
function isRight(w,claim,right,wrongs,ex,o){const yes=`${w.He} is right!`;const R0=right===true?yes:right;const W=(right===true?wrongs:[yes,...wrongs]);
 return choice(st(Object.assign({prompt:`${w.N} says: “${claim}”<br>Is ${w.he} right? Choose the reason.`,tpl:'{A}',text:`ir ${w.n} ${claim}`,explain:ex,
  nudge:'<p>Check the rule. Does it work every time?</p>',fast:30},o||{})),R0,W);}

/* ---------- shapes ---------- */
const SHN={circle:'circle',tri:'triangle',square:'square',rect:'rectangle',rhombus:'rhombus',trap:'trapezoid',para:'parallelogram',kite:'kite',pent:'pentagon',hex:'hexagon',oct:'octagon'};
const SIDES={circle:0,tri:3,square:4,rect:4,rhombus:4,trap:4,para:4,kite:4,pent:5,hex:6,oct:8};
const sp=(k,x)=>Object.assign({k},k==='tri'?{ttype:PK(['equi','iso','scalene','right','obtuse'])}:{},x||{});
const S1=(k,x)=>Object.assign({t:'shape'},sp(k,x));
const ROW=list=>({t:'shapes',list,labels:LET.slice(0,list.length)});
const nmOf=s=>s.k==='tri'?(s.ttype==='right'?'a right triangle':s.ttype==='obtuse'?'an obtuse triangle':s.ttype==='equi'?'an equilateral triangle':'a triangle'):AN(SHN[s.k]);

/* ======================================================================
   🔷 SHAPE ISLAND (geo)
   ====================================================================== */
/* ---------- decks: deal items without repeats (per key) until the pool is used up ---------- */
const DECK={};
function dk(key,arr){let d=DECK[key];if(!d||!d.length){const last=d&&d.last;d=DECK[key]=SH(arr.map((_,i)=>i));if(d.length>1&&d[0]===last)d.push(d.shift());}const i=d.shift();d.last=i;return arr[i];}
/* n true/false rows [s, truth, reason] dealt without repeats, at least one true and one false */
function dkRows(key,pool,n){const out=[];const prev=(DECK[key+'#']||[]);const refill=()=>{let ix=SH(pool.map((_,i)=>i)).filter(i=>!out.includes(pool[i]));const fresh=ix.filter(i=>!prev.includes(i));if(fresh.length>=n-out.length+1)ix=fresh.concat(ix.filter(i=>prev.includes(i)));return DECK[key]=ix;};
 let d=DECK[key];if(!d||d.length<n)d=refill();
 while(out.length<n-1){if(!d.length)d=refill();out.push(pool[d.shift()]);}
 const need=out.every(r=>r[1])?false:out.every(r=>!r[1])?true:null;const fit=i=>need===null||pool[i][1]===need;
 let j=d.findIndex(fit);if(j<0){d=refill();j=d.findIndex(fit);}out.push(pool[d.splice(j,1)[0]]);DECK[key+'#']=out.map(r=>pool.indexOf(r));return SH(out);}
/* a pool per round: P = {1:[…],2:[…],…}; uses the nearest round at or below c.round */
const forRound=(P,r)=>{for(let k=r;k>=1;k--)if(P[k])return [k,P[k]];const k=Object.keys(P)[0];return [k,P[k]];};

/* ---------- grade 1: flat shapes, solids, sides and corners, composing shapes, halves and fourths, length with cubes and paper clips ---------- */
const DESC1={circle:'is round, with no sides and no corners',tri:'has 3 straight sides and 3 corners',square:'has 4 sides that are all the same length and 4 square corners',
 rect:'has 4 square corners, 2 long sides and 2 short sides',trap:'has 4 sides. The top and bottom go the same way, and one of them is longer',hex:'has 6 sides and 6 corners'};
const IN1=['Gizmo built a gadget in this shape.','Ms. Rosa baked a cookie in this shape.','The Grey Goblin stole this shape from a sign.',"Ozzy's train has a window in this shape.",
 'The Elder Wiz drew this shape with wand sparkles.','Nana Paws knitted a rug in this shape.','Skyla found a pebble in this shape.','Grumbleroot painted this shape on his bridge.'];
/* solids: [vis key, grade 1–2 name, example] */
const SOL=[['cube','cube','🎲 a number cube'],['box','box','📦 a cereal box'],['cone','cone','🍦 an ice cream cone'],['cylinder','cylinder','🥫 a soup can'],['sphere','sphere','⚽ a ball']];
const SOLD={cube:'has 6 flat faces that are all squares',box:'has 6 flat faces that are rectangles, like a cereal box',cone:'has a circle on the bottom and a point on top',cylinder:'has 2 flat circles and a curved side, like a can',sphere:'is round all over, like a ball'};
/* ruler stories (grade 2+): [sentence, emoji, thing, pronoun of the person] */
const RT=[['Skyla dropped a feather.','🪶','feather','her'],['Gizmo found a crayon.','🖍️','crayon','his'],['Ms. Rosa measures a carrot.','🥕','carrot','her'],['Dr. Quartz measures a crystal.','💎','crystal','his'],
 ['The Elder Wiz measures his pencil.','✏️','pencil','his'],['Coach Flex measures a worm.','🐛','worm','his'],['Ozzy measures a key.','🔑','key','his'],['Nana Paws measures a banana.','🍌','banana','her']];
const ITM1=[['Wand','🪄'],['Rope','🪢'],['Feather','🪶'],['Scarf','🧣'],['Sock','🧦'],['Bread','🥖'],['Snake','🐍'],['Ribbon','🎀'],['Carrot','🥕'],['Pencil','✏️']];
const MS1=[['pencil','✏️'],['worm','🐛'],['carrot','🥕'],['feather','🪶'],['crayon','🖍️'],['banana','🍌'],['spoon','🥄'],['key','🔑']];
const P1=[['with <b>4 sides</b>',s=>SIDES[s.k]===4,'Count the sides of each shape.'],['with <b>3 corners</b>',s=>s.k==='tri','Count the corners of each shape.'],
 ['with <b>no corners</b>',s=>s.k==='circle','Which shape is round?'],['with <b>6 sides</b>',s=>s.k==='hex','Count the sides of each shape.'],
 ['with <b>more than 3 sides</b>',s=>SIDES[s.k]>3,'Count the sides. More than 3 means 4, 5, 6 and so on.'],['with <b>4 square corners</b>',s=>s.k==='square'||s.k==='rect','A square corner looks like the corner of a book.'],
 ['with <b>fewer than 4 corners</b>',s=>SIDES[s.k]<4,'Fewer than 4 means 3, 2, 1 or none.']];
const RID1=[['I have 3 sides and 3 corners.','triangle'],['I am round. I have no sides and no corners.','circle'],['I have 4 sides that are all the same length and 4 square corners.','square'],
 ['I have 4 square corners. Two of my sides are long and two are short.','rectangle'],['I have 6 sides and 6 corners.','hexagon'],['I have 4 sides. My top and bottom go the same way, but my top is shorter.','trapezoid']];
const RIDS=[['I can roll. I have no flat faces at all.','sphere'],['I have 6 flat faces, and every face is a square.','cube'],['I can roll, and I can stack. My two flat faces are circles.','cylinder'],
 ['I have one flat face that is a circle, and a point on top.','cone'],['I look like a cereal box. My 6 faces are rectangles.','box']];
const CMP1=[['Ozzy puts 2 same-size squares side by side.','What shape do they make?','rectangle',['triangle','circle','hexagon'],'Two squares side by side make a longer shape with 4 square corners: a <b>rectangle</b>.'],
 ['Ms. Rosa puts 2 half circles together.','What shape does she make?','circle',['square','triangle','rectangle'],'Two half circles make a whole <b>circle</b>.'],
 ['Gizmo cuts a square from one corner to the opposite corner.','What 2 shapes does he get?','2 triangles',['2 squares','2 circles','2 hexagons'],'Each piece has 3 sides and 3 corners: <b>2 triangles</b>.'],
 ['The Elder Wiz cuts a rectangle in half, straight down the middle.','What 2 shapes does he get?','2 rectangles',['2 triangles','2 circles','2 hexagons'],'Each half still has 4 sides and 4 square corners: <b>2 rectangles</b>.'],
 ['Skyla puts 6 triangles together around one point, like pattern blocks.','What shape does she make?','hexagon',['circle','square','rectangle'],'Six triangles around one point make a shape with 6 sides: a <b>hexagon</b>.'],
 ['Coach Flex stacks 2 cubes, one on top of the other.','What solid do they make?','box',['sphere','cone','cylinder'],'Two cubes stacked make a taller solid with flat rectangle faces: a <b>box</b>.']];
const g1={
 name:c=>{const k=dk('g1name',['circle','tri','square','rect','hex','trap','tri','rect']);const v=S1(k);const nm=SHN[k];const it=PK(IN1);
  const pool=['circle','triangle','square','rectangle','hexagon','trapezoid'].filter(x=>x!==nm&&!(k==='square'&&x==='rectangle'));
  return choice(ok({vis:v,prompt:`${it} What shape is it?`,tpl:'{A}',text:`g1n ${k} ${v.ttype||''} ${it}`,explain:`<p>This shape ${DESC1[k]}.</p><p>It is ${ABn(nm)}.</p>`,nudge:'<p>Count the sides and the corners. Is it round?</p>',fast:8}),nm,pickN(pool,3));},
 sides:o=>c=>{const k=dk('g1sides'+!!o.circle,o.circle?['circle','tri','square','rect','hex','trap','pent']:['tri','square','rect','hex','trap','pent']);const n=SIDES[k];const cor=!!o.corners&&Math.random()<.5;
  const S=cor?PK([['Grumbleroot puts a toll coin on each corner of this sign. How many coins does he need?','{A} coins'],['How many corners does this shape have?','{A} corners'],['Skyla lands on each corner of this shape. How many corners does she land on?','{A} corners']])
   :PK([['How many sides does this shape have?','{A} sides'],['Coach Flex runs along every side of this shape. How many sides does he run?','{A} sides'],['Gizmo glues one stick on each side of this shape. How many sticks does he need?','{A} sticks']]);
  const w=cor?'corner':'side';
  return ok({vis:S1(k),prompt:S[0],tpl:S[1],answer:n,text:`g1s ${k} ${S[0]}`,explain:k==='circle'?'<p>A circle is round. It has <b>0</b> sides and <b>0</b> corners.</p>':`<p>Touch and count: ${Array.from({length:n},(_,i)=>i+1).join(', ')}.</p><p>${cap(AN(SHN[k]))} has <b>${n}</b> ${w}s.</p>`,nudge:`<p>Touch each ${w} and count. Don't count one twice!</p>`,fast:8});},
 sum2:c=>{const [a,b]=dk('g1sum2',[['tri','square'],['tri','rect'],['tri','tri'],['square','square'],['rect','tri'],['tri','hex'],['square','rect']]);const A=sp(a),B=sp(b);const n=SIDES[a]+SIDES[b];const cor=Math.random()<.5;const w=PK([who('gizmo'),who('ozzy'),who('quartz'),who('rosa')]);
  return ok({vis:ROW([A,B]),prompt:`${w.N} has these two shapes. How many ${cor?'corners':'sides'} do they have <b>in all</b>?`,tpl:`{A} ${cor?'corners':'sides'}`,answer:n,text:`g1sum ${a}${b} ${cor} ${w.n}`,explain:`<p>${cap(AN(SHN[a]))} has ${SIDES[a]}. ${cap(AN(SHN[b]))} has ${SIDES[b]}.</p><p>${SIDES[a]} + ${SIDES[b]} = <b>${n}</b></p>`,nudge:'<p>Count for one shape, then count on for the other.</p>',fast:15});},
 sort:o=>c=>{const pr=dk('g1sort'+!!o.hard,o.hard?[P1[0],P1[1],P1[4],P1[5],P1[6]]:P1.slice(0,4));const list=mix(['circle','tri','tri','square','rect','hex','trap','rhombus'].map(k=>sp(k)),pr[1],4);
  const w=PK(['Help Gizmo build a tower.','Help Ozzy fix his train.','Help Ms. Rosa pick cookie cutters.','Help the Elder Wiz with a spell.']);
  return MU({vis:ROW(list),prompt:`${w} Select ALL the shapes ${pr[0]}.`,multi:LET.slice(0,4),ans:ansOf(list,pr[1]),text:`g1so ${pr[0]} ${list.map(s=>s.k+(s.ttype||'')).join()} ${w}`,explain:selEx(list,pr[1],s=>AN(SHN[s.k])),nudge:`<p>${pr[2]}</p>`});},
 /* composing shapes (1.G.2) */
 compose:c=>{const v=dk('g1comp',[0,1,2,3,4]);
  if(v===0)return choice(ok({vis:ROW([{k:'tri',ttype:'right'},{k:'tri',ttype:'right'}]),prompt:'Ozzy has two same-size triangles. Each one is half of a square. He slides them together, long side to long side. Which shape do they make?',tpl:'{A}',text:'g1c0',explain:'<p>Two of these triangles fit together into a shape with 4 equal sides and 4 square corners: a <b>square</b>.</p>',nudge:'<p>Picture the long sides touching. How many corners are on the outside?</p>'}),'square',['circle','hexagon','pentagon']);
  if(v===1){const r=PK([1,2]),cc=r===1?R(2,4):R(2,3);return ok({vis:{t:'array',r,c:cc,e:'🟦'},prompt:`Gizmo built this rectangle out of same-size squares. How many squares make the rectangle?`,tpl:'{A} squares',answer:r*cc,text:`g1c1 ${r}x${cc}`,explain:`<p>Count the squares: <b>${r*cc}</b>.</p>`,nudge:'<p>Count each square once.</p>',fast:10});}
  if(v===2){const [k,n,nm]=PK([['hex',6,'hexagon'],['square',2,'square'],['circle',2,'circle']]);const piece=k==='hex'?'triangles':k==='square'?'triangles':'half circles';
   return ok({vis:k==='square'?{t:'shape',k:'square',sym:'d'}:S1(k),prompt:k==='square'?'Skyla cuts this square along the dashed line. How many triangles does she get?':`Skyla wants to build this ${nm} out of ${piece}. How many ${piece} does she need?`,tpl:`{A} ${piece}`,answer:n,text:`g1c2 ${k}`,explain:`<p>${k==='hex'?'Six triangles meet in the middle of a hexagon':k==='square'?'A square cut corner to corner makes 2 triangles':'Two half circles make a circle'}.</p><p>She needs <b>${n}</b>.</p>`,nudge:'<p>Picture the pieces inside the shape.</p>',fast:15});}
  if(v===3){const n=R(2,4);return ok({vis:{t:'array',r:1,c:n,e:'🟧'},prompt:`Nana Paws lines up ${n} same-size squares in a row. What shape do they make together?`,tpl:'{A}',...choice({},'rectangle',['circle','triangle','hexagon']),text:`g1c3 ${n}`,explain:`<p>Squares in a row make a long shape with 4 square corners: a <b>rectangle</b>.</p>`,nudge:'<p>Look at the outside edge only.</p>'});}
  return choice(ok({vis:ROW([{k:'square'},{k:'tri',ttype:'equi'}]),prompt:'Coach Flex puts a triangle on top of a square, like a little house. How many corners does the new shape have on the outside?',tpl:'{A}',text:'g1c4',explain:'<p>The square gives 2 bottom corners and 2 where the roof starts; the roof adds 1 at the top: <b>5</b> corners.</p>',nudge:'<p>Trace the outside of the house with your finger and count corners.</p>'}),'5',['7','4','3']);},
 parts:c=>{const v=dk('g1parts',[0,1,2,2]);
  if(v===0){const tgt=PK(['halves','fourths']);const ks=SH([tgt,tgt==='halves'?'fourths':'halves','unequal']);const r=LET[ks.indexOf(tgt)];const n=tgt==='halves'?2:4;
   return choice(ok({vis:ROW(ks.map(k=>k==='unequal'?{k,n:PK([2,4])}:{k})),prompt:`Ms. Rosa cut three cakes. Which cake is cut into <b>${tgt}</b>?`,tpl:'Cake {A}',text:`g1p0 ${ks.join()}`,explain:`<p>${cap(tgt)} means ${n} <b>equal</b> parts.</p><p>Cake <b>${r}</b> has ${n} parts that are all the same size.</p>`,nudge:'<p>Count the parts. Are they all the same size?</p>'}),r,['A','B','C']);}
  if(v===1){const k=PK(['halves','fourths']);const n=k==='halves'?2:4;const [w,f]=PK([['Gizmo','sandwich'],['Coach Flex','pizza'],['Dr. Quartz','cracker'],['Nana Paws','pancake'],['Ozzy','waffle']]);
   return ok({vis:{t:'shape',k,of:PK(['square','rect','circle'])},prompt:`${w} cut a ${f} into equal parts. How many equal parts are there?`,tpl:'{A} parts',answer:n,text:`g1p1 ${k} ${w}`,explain:`<p>Count the parts: they are all the same size.</p><p>There are <b>${n}</b> equal parts. They are called ${k}.</p>`,nudge:'<p>Count every part.</p>',fast:8});}
  const eq=dk('g1eq',[true,false]);const k=eq?PK(['halves','fourths']):'unequal';const f=PK(['pie','pizza','cake','sandwich']);
  return choice(ok({vis:eq?{t:'shape',k,of:PK(['square','rect','circle'])}:{t:'shape',k:'unequal',n:PK([2,3,4]),of:PK(['square','rect','circle'])},prompt:`The Grey Goblin cut this ${f}. Are all the parts the <b>same size</b>?`,tpl:'{A}',text:`g1p2 ${k} ${f}`,explain:eq?`<p>Every part is the same size. <b>Yes</b>, it is cut into ${k}.</p>`:'<p>Some parts are bigger than others. <b>No</b>, the parts are not equal.</p>',nudge:'<p>Look at each part. Is any part bigger?</p>'}),eq?'Yes':'No',['Yes','No']);},
 parts2:c=>{const v=dk('g1parts2',[0,1,2,3]);const f=PK(['pizza','pie','sandwich','waffle','cake']);
  if(v===0){const big=Math.random()<.6;
   return choice(ok({prompt:`Ms. Rosa cuts one ${f} into halves. She cuts the same size ${f} into fourths. Which pieces are <b>${big?'bigger':'smaller'}</b>?`,tpl:'{A}',text:`g1q0 ${f} ${big}`,explain:`<p>Halves: 2 pieces. Fourths: 4 pieces.</p><p>The more pieces you cut, the smaller each piece is. So <b>${big?'the halves':'the fourths'}</b> are ${big?'bigger':'smaller'}.</p>`,nudge:'<p>Would you rather share a pizza with 1 friend or with 3 friends?</p>'}),big?'the halves':'the fourths',['the halves','the fourths','they are the same']);}
  if(v===1){const k=PK(['halves','fourths']);const n=k==='halves'?2:4;return ok({prompt:`How many ${k} make one whole ${f}?`,tpl:`{A} ${k}`,answer:n,text:`g1q1 ${k} ${f}`,explain:`<p>${cap(k)} means ${n} equal parts. <b>${n}</b> ${k} make the whole ${f}.</p>`,nudge:`<p>How many equal parts are in ${k}?</p>`,fast:8});}
  if(v===2){const k=PK(['halves','fourths']);const r=k==='halves'?'one half':'one fourth';
   return choice(ok({vis:{t:'shape',k,shade:1,of:PK(['square','rect','circle'])},prompt:`${cap(c.pet)} ate the shaded part. What part did your pet eat?`,tpl:'{A}',text:`g1q2 ${k}`,explain:`<p>There are ${k==='halves'?2:4} equal parts, and 1 is shaded.</p><p>That is <b>${r}</b>.</p>`,nudge:'<p>Count all the equal parts. How many are shaded?</p>'}),r,['one half','one fourth','one whole']);}
  const [n,k,e]=PK([[1,'fourths',1],[1,'fourths',2],[2,'halves',1],[2,'halves',3],[2,'fourths',3],[3,'halves',2]]);const p=n*(k==='halves'?2:4);
  return st({prompt:`${c.name} cuts ${n===1?'a '+f:n+' '+f+(f==='sandwich'?'es':'s')} into ${k}. ${c.name} eats ${e} ${PL(e,'piece')}. How many pieces are left?`,tpl:'{A} pieces',answer:p-e,text:`g1q3 ${n}${k}${e}${f}`,explain:`<p>${n} × ${k==='halves'?2:4} pieces: there are ${p} pieces.</p><p>${p} − ${e} = <b>${p-e}</b></p>`,nudge:'<p>First find how many pieces there are. Then take away the ones eaten.</p>'});},
 long:o=>c=>{const v=dk('g1long'+(o.vs||[0]).join(''),o.vs||[0]);
  if(v===0||v===2){const it=pickN(ITM1,3);let ls;do{ls=[R(2,9),R(2,9),R(2,9)];}while(new Set(ls).size<3);
   const rows=it.map(([n,e],i)=>`${e} ${n}: ${'🟩'.repeat(ls[i])}`).join('<br>');const exr=it.map(([n],i)=>`${n}: ${ls[i]} cubes`).join('<br>');
   if(v===0){const lg=Math.random()<.6;const idx=ls.indexOf(lg?Math.max(...ls):Math.min(...ls));
    return choice(ok({prompt:`Ozzy measured with cubes.<br>${rows}<br>Which is the <b>${lg?'longest':'shortest'}</b>?`,tpl:'{A}',text:`g1l0 ${it.map(x=>x[0])} ${ls} ${lg}`,explain:`<p>${exr}</p><p>The ${lg?'longest':'shortest'} is the <b>${it[idx][0].toLowerCase()}</b>.</p>`,nudge:`<p>Count the cubes in each row. ${lg?'Most':'Fewest'} cubes is ${lg?'longest':'shortest'}.</p>`}),it[idx][0],it.map(x=>x[0]));}
   const [i,j]=ls[0]>ls[1]?[0,1]:[1,0];const d=ls[i]-ls[j];
   return ok({prompt:`Ozzy measured with cubes.<br>${rows}<br>How many cubes longer is the <b>${it[i][0].toLowerCase()}</b> than the <b>${it[j][0].toLowerCase()}</b>?`,tpl:'{A} cubes longer',answer:d,text:`g1l2 ${it.map(x=>x[0])} ${ls}`,explain:`<p>${it[i][0]}: ${ls[i]} cubes. ${it[j][0]}: ${ls[j]} cubes.</p><p>${ls[i]} − ${ls[j]} = <b>${d}</b></p>`,nudge:'<p>Count both rows. How many extra cubes does the longer one have?</p>'});}
  const ps=pickN(['Skyla','Gizmo','Ozzy','Nana Paws','Coach Flex','Ms. Rosa','Dr. Quartz'],3);const t=PK(['ribbon','jump rope','scarf','kite string']);const lg=Math.random()<.5;
  const s=Math.random()<.5?`${ps[0]}'s ${t} is longer than ${ps[1]}'s. ${ps[1]}'s ${t} is longer than ${ps[2]}'s.`:`${ps[2]}'s ${t} is shorter than ${ps[1]}'s. ${ps[1]}'s ${t} is shorter than ${ps[0]}'s.`;
  return choice(ok({prompt:`${s} Whose ${t} is the <b>${lg?'longest':'shortest'}</b>?`,tpl:'{A}',text:`g1l1 ${ps} ${t} ${lg} ${s.slice(0,12)}`,explain:`<p>From longest to shortest: ${ps[0]}, ${ps[1]}, ${ps[2]}.</p><p>The ${lg?'longest':'shortest'} is <b>${lg?ps[0]:ps[2]}</b>'s.</p>`,nudge:'<p>Line them up in your head from longest to shortest.</p>',fast:20}),lg?ps[0]:ps[2],ps);},
 /* measuring with same-size units laid end to end (1.MD.2): cubes and paper clips, no rulers in grade 1 */
 measure:o=>c=>{const v=dk('g1meas'+(o.vs||[0]).join(''),o.vs||[0]);const [th,e]=PK(MS1);const U=PK([['paper clip','paper clips','📎'],['cube','cubes','🟩']]);
  if(v===0){const n=R(o.lo||2,o.hi||8);return ok({prompt:`${PK(['Gizmo','Ozzy','Skyla','Ms. Rosa'])} lines up ${U[1]} under the ${th}, end to end with no gaps.<br>${e}<br>${U[2].repeat(n)}<br>How long is the ${th}?`,tpl:`{A} ${U[1]}`,answer:n,text:`g1m0 ${th} ${n} ${U[0]}`,explain:`<p>Count the ${U[1]}: <b>${n}</b>.</p>`,nudge:`<p>Count the ${U[1]} one by one.</p>`,fast:10});}
  if(v===1){const a=R(4,9),b=R(2,a-1);const [t2]=PK(MS1.filter(x=>x[0]!==th));return ok({prompt:`The ${th} is <b>${a}</b> ${U[1]} long. The ${t2} is <b>${b}</b> ${U[1]} long. How many ${U[1]} longer is the ${th}?`,tpl:`{A} ${U[1]} longer`,answer:a-b,text:`g1m1 ${th}${t2} ${a} ${b} ${U[0]}`,explain:`<p>${a} − ${b} = <b>${a-b}</b></p>`,nudge:`<p>Count up from ${b} to ${a}.</p>`});}
  if(v===2){const w=who(PK(['gizmo','flex','ozzy','goblin']));return choice(st({prompt:`${w.N} measured the ${th} with paper clips, but ${w.he} left <b>big gaps</b> between them. Is ${w.his} number too big, too small, or just right?`,tpl:'{A}',text:`g1m2 ${th} ${w.n}`,explain:'<p>With gaps, fewer clips reach the end, so the number comes out <b>too small</b>. Clips must touch, end to end.</p>',nudge:'<p>With gaps, does it take more clips or fewer clips to reach the end?</p>'}),'too small',['too big','just right']);}
  const w=who(PK(['rosa','nana','quartz','wiz']));const big=Math.random()<.5;return choice(st({prompt:`${w.N} measures the same ${th} two times: once with cubes and once with paper clips. A paper clip is longer than a cube. Which number is ${big?'bigger':'smaller'}?`,tpl:'{A}',text:`g1m3 ${th} ${w.n} ${big}`,explain:`<p>Cubes are shorter, so it takes <b>more cubes</b> than paper clips. The ${big?'bigger':'smaller'} number is the number of <b>${big?'cubes':'paper clips'}</b>.</p>`,nudge:'<p>Small units: you need more of them.</p>'}),big?'the number of cubes':'the number of paper clips',['the number of cubes','the number of paper clips','they are the same']);},
 solid:o=>c=>{const [k,nm,ex]=dk('g1sol'+!!o.words,SOL);const others=SOL.map(x=>x[1]).filter(x=>x!==nm&&!(nm==='cube'&&x==='box'));
  if(!o.words||Math.random()<.5){const it=PK(['Dr. Quartz found a crystal in this shape.','Gizmo built a robot part in this shape.','Ozzy shrank you down next to this giant block.','The Grey Goblin is hiding behind this shape.']);
   return choice(ok({vis:{t:'solid',k},prompt:`What is this solid called? ${it}`,tpl:'{A}',text:`g1so ${k} ${it}`,explain:`<p>It ${SOLD[k]}.</p><p>It is ${ABn(nm)}.</p>`,nudge:'<p>Look at the flat faces. Can it roll?</p>',fast:10}),nm,pickN(others,3));}
  return choice(ok({prompt:`Which solid has the same shape as ${ex}?`,tpl:'{A}',text:`g1sw ${k}`,explain:`<p>${cap(ex.replace(/^\S+ /,''))}: it ${SOLD[k]}.</p><p>That is ${ABn(nm)}.</p>`,nudge:'<p>Picture it in your hand. Does it have flat faces? Can it roll?</p>',fast:10}),nm,pickN(others,3));},
 riddle:c=>{const s=Math.random()<.45;const [txt,ans]=dk(s?'g1rs':'g1r1',s?RIDS:RID1);const w=who(PK(['wiz','skyla','gizmo','rosa','ozzy']));const pool=(s?RIDS:RID1).map(x=>x[1]).filter(x=>x!==ans&&!(ans==='cube'&&x==='box'));
  return choice(ok({prompt:`${w.N} turned into a ${s?'solid':'shape'}! ${w.He} says: “${txt}” What ${s?'solid':'shape'} is ${w.he}?`,tpl:'{A}',text:`g1rid ${txt} ${w.n}`,explain:`<p>${txt}</p><p>That is ${ABn(ans)}.</p>`,nudge:'<p>Check each clue one at a time.</p>',fast:20}),ans,pickN(pool,3));},
 /* Legend: thinking puzzles */
 legSides:c=>{if(Math.random()<.4){const [k,n]=PK([['triangles',3],['squares',4]]);const m=k==='triangles'?PK([2,3]):2;const have=m*n+R(1,5);
   return st({prompt:`Gizmo has <b>${have}</b> sticks. He makes ${m} ${k}, one stick for each side. How many sticks are left?`,tpl:'{A} sticks',answer:have-m*n,text:`g1ls0 ${k} ${m} ${have}`,explain:`<p>Each one has ${n} sides: ${Array(m).fill(n).join(' + ')} = ${m*n} sticks.</p><p>${have} − ${m*n} = <b>${have-m*n}</b></p>`,nudge:'<p>Step 1: how many sticks does he use? Step 2: how many are left?</p>',fast:30});}
  const [a,b]=dk('g1ls',[['square','triangle'],['hexagon','triangle'],['triangle','rectangle'],['rectangle','square'],['hexagon','circle']]);const NS={triangle:3,square:4,hexagon:6,rectangle:4,circle:0};const n=NS[a]+NS[b];
  const [p,t]=PK([[`Ms. Rosa bakes ${AN(a)} cookie and ${AN(b)} cookie. She puts one sprinkle on every corner. How many sprinkles does she use?`,'{A} sprinkles'],[`Coach Flex runs around ${AN(a)} track, then ${AN(b)} track. He gives a high five at every corner. How many high fives does he give?`,'{A} high fives'],[`Grumbleroot puts a toll coin on every corner of ${AN(a)} sign and ${AN(b)} sign. How many coins does he use?`,'{A} coins']]);
  return st({prompt:p,tpl:t,answer:n,text:`g1ls1 ${a}${b} ${t}`,explain:`<p>${cap(AN(a))} has ${NS[a]} corners. ${cap(AN(b))} has ${NS[b]} corners.</p><p>${NS[a]} + ${NS[b]} = <b>${n}</b></p>`,nudge:'<p>How many corners does each shape have?</p>'});},
 legThink:c=>{const v=dk('g1think',[0,1,2,3]);
  if(v===0){const third=dk('g1th3rd',[['hexagon',6],['square',4],['triangle',3]]);const t=6+third[1];
   return choice(st({prompt:`Skyla has 3 shapes with <b>${t}</b> corners in all. Two of them are triangles. What is the third shape?`,tpl:'{A}',text:`g1th0 ${third[0]}`,explain:`<p>Two triangles have 3 + 3 = 6 corners.</p><p>${t} − 6 = ${third[1]} corners, so the third shape is ${ABn(third[0])}.</p>`,nudge:'<p>How many corners do the two triangles have together?</p>',fast:35}),third[0],['hexagon','square','triangle','circle']);}
  if(v===1){const [clue,a,w]=PK([['It is not round. It has 4 sides. All its corners are square corners. Its sides are not all the same length.','rectangle',['square','trapezoid','triangle']],['It has straight sides. It has more corners than a square. It has fewer corners than a hexagon.','pentagon',['hexagon','triangle','circle']],['It can roll. It has 2 flat faces.','cylinder',['sphere','cone','cube']],['It cannot roll. All 6 of its faces are the same square.','cube',['cylinder','cone','sphere']]]);
   return choice(st({prompt:`The Elder Wiz hid a shape. Clues: ${clue} What is it?`,tpl:'{A}',text:`g1th1 ${a}`,explain:`<p>Use every clue: it is ${ABn(a)}.</p>`,nudge:'<p>Cross out the choices that break a clue.</p>',fast:35}),a,w);}
  if(v===2){const [cut,s,n]=PK([['straight down the middle','2 rectangles',8],['from one corner to the opposite corner','2 triangles',6]]);
   return st({vis:S1('square'),prompt:`Gizmo cuts a square paper ${cut}. Then he counts all the corners of both pieces. How many corners does he count?`,tpl:'{A} corners',answer:n,text:`g1th2 ${n}`,explain:`<p>He gets ${s}.</p><p>${n===8?'4 + 4':'3 + 3'} = <b>${n}</b></p>`,nudge:'<p>First: what 2 shapes does he get?</p>',fast:35});}
  const b=R(2,5);return st({prompt:`A paper clip is as long as <b>2</b> cubes. Ozzy's crayon is <b>${b}</b> paper clips long. How many cubes long is the crayon?`,tpl:'{A} cubes',answer:2*b,text:`g1th3 ${b}`,explain:`<p>Each clip is 2 cubes: ${Array(b).fill(2).join(' + ')} = <b>${2*b}</b> cubes.</p>`,nudge:'<p>Count 2 cubes for each paper clip.</p>',fast:35});},
 legParts:c=>{const v=dk('g1lp',[0,1,2]);
  if(v===0){const k=PK(['halves','fourths']);const n=k==='halves'?R(2,4):R(2,3);const p=k==='halves'?2:4;
   return st({prompt:`Ms. Rosa cuts ${n} pizzas into ${k}. How many pieces does she have?`,tpl:'{A} pieces',answer:n*p,text:`g1lp0 ${k}${n}`,explain:`<p>${cap(k)}: ${p} pieces in each pizza.</p><p>${Array(n).fill(p).join(' + ')} = <b>${n*p}</b></p>`,nudge:`<p>How many pieces does one pizza make?</p>`});}
  if(v===1){const [n,k]=PK([[1,'fourths'],[2,'halves'],[2,'fourths'],[3,'halves']]);const p=n*(k==='halves'?2:4);const e=R(1,Math.min(4,p-1));
   return st({prompt:`${c.name} cuts ${n===1?'a sandwich':n+' sandwiches'} into ${k}. ${cap(c.pet)} eats ${e} ${PL(e,'piece')}. How many pieces are left?`,tpl:'{A} pieces',answer:p-e,text:`g1lp1 ${n}${k}${e}`,explain:`<p>${n===1?'':n+' sandwiches × '}${k==='halves'?2:4} pieces: ${p} pieces.</p><p>${p} − ${e} = <b>${p-e}</b></p>`,nudge:'<p>How many pieces are there before anyone eats?</p>'});}
  const m=PK([2,4]);const r=m===2?'halves':'fourths';
  return choice(st({prompt:`Skyla shares one big cookie equally. There ${m===2?'are 2 eagles':'are 4 eagles'} in all, counting her. Should she cut it into halves or fourths?`,tpl:'{A}',text:`g1lp2 ${m}`,explain:`<p>${m} eagles need ${m} equal pieces.</p><p>${m} equal pieces are <b>${r}</b>.</p>`,nudge:'<p>How many pieces does she need?</p>'}),r,['halves','fourths']);},
 legLen:c=>{const v=dk('g1ll',[0,1,2]);
  if(v===0){const a=R(3,9),b=R(2,6);return st({prompt:`Skyla's feather is <b>${a}</b> paper clips long. Gizmo's wire is <b>${b}</b> paper clips longer than the feather. How long is the wire?`,tpl:'{A} paper clips',answer:a+b,text:`g1ll0 ${a} ${b}`,explain:`<p>Longer means add.</p><p>${a} + ${b} = <b>${a+b}</b></p>`,nudge:'<p>Is the wire longer or shorter than the feather?</p>'});}
  if(v===1){const a=R(8,12),b=R(2,5),d=R(1,4);return st({prompt:`The rope is <b>${a}</b> cubes long. The ribbon is <b>${b}</b> cubes shorter than the rope. The scarf is <b>${d}</b> ${PL(d,'cube')} longer than the ribbon. How long is the scarf?`,tpl:'{A} cubes',answer:a-b+d,text:`g1ll1 ${a}${b}${d}`,explain:`<p>Ribbon: ${a} − ${b} = ${a-b}.</p><p>Scarf: ${a-b} + ${d} = <b>${a-b+d}</b></p>`,nudge:'<p>Step 1: find the ribbon. Step 2: find the scarf.</p>',fast:35});}
  const a=R(3,8),b=R(2,6);return st({prompt:`Nana Paws knits a scarf. It is this long:<br>🧣<br>${'🟩'.repeat(a)}<br>Then she knits <b>${b}</b> more cubes of length. How many cubes long is the scarf now?`,tpl:'{A} cubes',answer:a+b,text:`g1ll2 ${a} ${b}`,explain:`<p>The cubes show ${a}.</p><p>${a} + ${b} = <b>${a+b}</b></p>`,nudge:'<p>Count the cubes first. Then add.</p>'});},
 legMake:c=>{const [s,q,r,w,ex]=dk('g1lm',CMP1);return choice(st({prompt:`${s} ${q}`,tpl:'{A}',text:`g1lm ${s}`,explain:`<p>${ex}</p>`,nudge:'<p>Draw it in the air with your finger.</p>'}),r,w);}
};
PLAN.def('geo',1,[
 [g1.name,g1.sides({}),g1.solid({}),g1.measure({vs:[0],lo:2,hi:7}),g1.long({vs:[0]}),g1.compose,g1.parts,g1.sort({})],
 [g1.name,g1.sides({corners:1}),g1.sort({}),g1.parts,g1.measure({vs:[0,1],lo:3,hi:9}),g1.solid({words:1}),g1.compose,g1.long({vs:[0,2]})],
 [g1.parts,g1.parts2,g1.long({vs:[1]}),g1.sort({}),g1.riddle,g1.sides({corners:1,circle:1}),g1.measure({vs:[2]}),g1.compose],
 [g1.sort({hard:1}),g1.parts2,g1.long({vs:[2]}),g1.sum2,g1.riddle,g1.measure({vs:[1,3]}),g1.compose,g1.legMake],
 [g1.legSides,g1.legParts,g1.legLen,g1.legMake,g1.legThink,g1.sort({hard:1}),g1.riddle]]);

/* ---------- grade 2: shapes by sides and angles, cubes, rows and columns, halves/thirds/fourths, measuring length ---------- */
const NM2={3:'triangle',4:'quadrilateral',5:'pentagon',6:'hexagon'};const NS2={triangle:3,quadrilateral:4,pentagon:5,hexagon:6};
const IN2=['Gizmo built a gadget in this shape.','The Grey Goblin painted this shape grey.','Dr. Quartz found a crystal in this shape.',"Ozzy's ticket is cut in this shape.",'The Elder Wiz drew this shape in the sky.','Grumbleroot put this shape on his bridge.'];
const EST2=[['About how long is a new pencil?','about 7 inches',['about 7 feet','about 7 yards']],['About how long is a crayon?','about 3 inches',['about 3 feet','about 3 yards']],
 ['About how tall is a classroom door?','about 7 feet',['about 7 inches','about 7 yards']],['About how long is a school bus?','about 12 meters',['about 12 centimeters','about 12 inches']],
 ['About how long is a paper clip?','about 3 centimeters',['about 3 meters','about 3 feet']],['About how long is your math book?','about 25 centimeters',['about 25 meters','about 25 feet']],
 ['About how wide is your thumb?','about 1 inch',['about 1 foot','about 1 yard']],['About how long is a baseball bat?','about 1 yard',['about 1 inch','about 1 centimeter']],
 ['About how tall is a grown-up?','about 2 meters',['about 2 centimeters','about 2 inches']],['About how long is a kitchen table?','about 2 meters',['about 2 centimeters','about 20 meters']]];
const UNIT2=[['Gizmo measures his wand in inches and then in centimeters.','Which number is bigger?','the number of centimeters',['the number of inches','they are the same'],'A centimeter is smaller than an inch, so it takes <b>more centimeters</b> to cover the wand.'],
 ['Coach Flex measures his jump rope in feet and then in inches.','Which number is bigger?','the number of inches',['the number of feet','they are the same'],'An inch is much smaller than a foot, so it takes <b>more inches</b>.'],
 ['Skyla measures a path in meters and then in centimeters.','Which number is smaller?','the number of meters',['the number of centimeters','they are the same'],'A meter is much longer than a centimeter, so it takes <b>fewer meters</b>.'],
 ["Nana Paws's scarf is 5 feet long.",'Is that longer or shorter than 5 inches?','longer',['shorter','the same'],'A foot is longer than an inch, so 5 feet is <b>longer</b> than 5 inches.'],
 ["Dr. Quartz's crystal is 6 centimeters long.",'Is that longer or shorter than 6 inches?','shorter',['longer','the same'],'A centimeter is shorter than an inch, so 6 cm is <b>shorter</b> than 6 inches.']];
const TF2={2:[['3 thirds make one whole.',true,''],['2 fourths make one whole.',false,'it takes 4 fourths'],['4 halves make one whole.',false,'2 halves make one whole'],['2 halves make one whole.',true,''],
  ['A whole cut into 3 equal parts is cut into thirds.',true,''],['A whole cut into 4 parts of different sizes is cut into fourths.',false,'fourths must be equal'],['4 fourths make one whole.',true,''],['A pizza cut into halves has 3 pieces.',false,'halves are 2 pieces']],
 4:[['Halves of the same square can be different shapes.',true,'cut straight across or corner to corner, each piece is still half'],['Thirds of a pizza are bigger than halves of the same pizza.',false,'more pieces means smaller pieces'],
  ['Fourths of a sandwich are smaller than halves of the same sandwich.',true,''],['If 4 parts are not the same size, they are not fourths.',true,'fourths must be equal'],['Half of a big cake and half of a small cake are the same size.',false,'the halves of the big cake are bigger'],
  ['The more equal parts you cut a pie into, the smaller each part is.',true,''],['One third of a pie is bigger than one fourth of the same pie.',true,''],['Three thirds of a waffle is less than the whole waffle.',false,'3 thirds is the whole waffle']]};
const L2=[["Gizmo's wire",'wire'],["Skyla's feather",'feather'],["Dr. Quartz's crystal",'crystal'],["Gizmo's screwdriver",'screwdriver'],["Ms. Rosa's breadstick",'breadstick'],["Nana Paws's knitting needle",'knitting needle']];
const L2B=[["Gizmo's wire",'wire',40,95],["Nana Paws's scarf",'scarf',60,99],["The Elder Wiz's wand",'wand',30,45],["Ms. Rosa's loaf of bread",'loaf',30,45],["Coach Flex's towel",'towel',50,90]];
const P2S=[['the <b>quadrilaterals</b>',s=>SIDES[s.k]===4,'A quadrilateral has 4 sides.'],['the <b>pentagons</b>',s=>s.k==='pent','A pentagon has 5 sides.'],['the <b>hexagons</b>',s=>s.k==='hex','A hexagon has 6 sides.'],
 ['the shapes with <b>5 angles</b>',s=>s.k==='pent','Count the corners (angles).'],['the shapes with <b>more than 4 sides</b>',s=>SIDES[s.k]>4,'More than 4 means 5, 6 or more.'],['the shapes with <b>fewer than 5 angles</b>',s=>SIDES[s.k]<5,'Fewer than 5 means 3 or 4.']];
const g2={
 name:c=>{const k=PK(['tri','square','rect','rhombus','trap','kite','para','pent','hex','pent','hex']);const n=SIDES[k];const nm=NM2[n];const v=S1(k);const it=PK(IN2);
  return choice(ok({vis:v,prompt:`${it} What kind of shape is it?`,tpl:'{A}',text:`g2n ${k} ${v.ttype||''} ${it}`,explain:`<p>Count the sides: it has ${n} sides and ${n} angles.</p><p>A shape with ${n} sides is ${ABn(nm)}.</p>`,nudge:'<p>Count the sides first. What do we call a shape with that many sides?</p>',fast:10}),nm,Object.values(NM2));},
 count:o=>c=>{if(o.two&&Math.random()<.6){const [a,b]=dk('g2two',[['triangle','pentagon'],['quadrilateral','hexagon'],['pentagon','hexagon'],['triangle','hexagon'],['quadrilateral','pentagon'],['triangle','quadrilateral']]);const n=NS2[a]+NS2[b];const ang=Math.random()<.5;
   return ok({prompt:ang?`How many angles do ${AN(a)} and ${AN(b)} have <b>in all</b>?`:`Gizmo makes ${AN(a)} and ${AN(b)} with straws, one straw for each side. How many straws does he use?`,tpl:ang?'{A} angles':'{A} straws',answer:n,text:`g2c2 ${a}${b}${ang}`,explain:`<p>${cap(AN(a))} has ${NS2[a]}. ${cap(AN(b))} has ${NS2[b]}.</p><p>${NS2[a]} + ${NS2[b]} = <b>${n}</b></p>`,nudge:'<p>Remember how many sides each shape has. Sides and angles match.</p>',fast:15});}
  const k=PK(['tri','square','rect','rhombus','trap','kite','pent','hex','hex','pent']);const n=SIDES[k];const [q,t]=PK([['How many angles does this shape have?','{A} angles'],['How many sides does this shape have?','{A} sides'],['How many corners (vertices) does this shape have?','{A} corners']]);
  return ok({vis:S1(k),prompt:q,tpl:t,answer:n,text:`g2c ${k} ${q}`,explain:`<p>Count around the shape: ${Array.from({length:n},(_,i)=>i+1).join(', ')}.</p><p>It has <b>${n}</b>.</p>`,nudge:'<p>Put your finger on one and count all the way around.</p>',fast:8});},
 cube:o=>c=>{const v=dk('g2cube'+!!o.hard,o.hard?[2,3]:[0,1]);
  if(v===0){const [q,t]=PK([['How many faces does a cube have?','{A} faces'],['Ozzy shrinks you down onto a giant cube. You visit every flat face once. How many faces do you visit?','{A} faces']]);return ok({vis:{t:'solid',k:'cube'},prompt:q,tpl:t,answer:6,text:`g2cu0 ${q}`,explain:'<p>Top, bottom, front, back, left, right.</p><p>A cube has <b>6</b> faces.</p>',nudge:'<p>Think of a dice. Count top, bottom and all around.</p>',fast:10});}
  if(v===1)return choice(ok({vis:{t:'solid',k:'cube'},prompt:'Dr. Quartz has a crystal shaped like a cube. What shape is each flat face?',tpl:'{A}',text:'g2cu1',explain:'<p>Every face of a cube is a <b>square</b>.</p>',nudge:'<p>All the edges of a cube are the same length.</p>',fast:10}),'square',['triangle','circle','hexagon']);
  if(v===2){const n=dk('g2cuben',[2,3,4]);return st({prompt:`Gizmo puts a sticker on every face of ${n} cubes. How many stickers does he use?`,tpl:'{A} stickers',answer:6*n,text:`g2cu2 ${n}`,explain:`<p>A cube has 6 faces.</p><p>${Array(n).fill(6).join(' + ')} = <b>${6*n}</b></p>`,nudge:'<p>How many faces does one cube have?</p>'});}
  const n=R(1,2);return st({prompt:`Dr. Quartz paints ${n===1?'a cube':'2 cubes'} but not the bottom face${n===1?'':'s'} sitting on the table. How many faces does he paint?`,tpl:'{A} faces',answer:5*n,text:`g2cu3 ${n}`,explain:`<p>Each cube has 6 faces. The bottom one is not painted: 6 − 1 = 5.</p><p>${n===1?'':'5 + 5 = '}<b>${5*n}</b></p>`,nudge:'<p>How many faces does a cube have? Which one is missed?</p>'});},
 part:o=>c=>{const r=R(2,o.max||4),cc=R(2,o.max||5);const S=PK([[`Ms. Rosa cuts a pan of brownies into ${r} rows and ${cc} columns of same-size squares. How many brownies are there?`,'{A} brownies'],[`Gizmo covers a rectangle with square tiles: ${r} rows with ${cc} tiles in each row. How many tiles does he use?`,'{A} tiles'],
   [`Nana Paws knits a blanket with ${r} rows and ${cc} columns of squares. How many squares are there?`,'{A} squares'],[`A window on Ozzy's train has ${r} rows of ${cc} little panes. How many panes are there?`,'{A} panes']]);
  const o2={prompt:S[0],tpl:S[1],answer:r*cc,text:`g2pt ${r}x${cc} ${S[1]}`,explain:`<p>Add the rows: ${Array(r).fill(cc).join(' + ')} = <b>${r*cc}</b></p>`,nudge:`<p>How many are in one row? Count by that number for each row.</p>`,fast:20};
  if(!o.novis)o2.vis={t:'array',r,c:cc,e:PK(['🟦','🟨','🟩','🟪'])};return o.novis?st(o2):ok(o2);},
 share:o=>c=>{const v=dk('g2sh'+(o.vs||[0,1]).join(''),o.vs||[0,1]);const K=PK(['halves','thirds','fourths']);const n={halves:2,thirds:3,fourths:4}[K];const one={halves:'a half',thirds:'a third',fourths:'a fourth'}[K];const f=PK(['pie','pizza','cake','sandwich','pancake']);
  if(v===0)return choice(ok({vis:{t:'shape',k:K,shade:1},prompt:`Ms. Rosa ate the shaded part of her ${f}. How much of the ${f} did she eat?`,tpl:'{A}',text:`g2s0 ${K} ${f}`,explain:`<p>The ${f} has ${n} equal parts. She ate 1 of them.</p><p>One of ${n} equal parts is <b>${one}</b>.</p>`,nudge:'<p>Count all the equal parts.</p>'}),one,['a half','a third','a fourth']);
  if(v===1){if(K==='halves')return g2.share(o)(c);const s=R(1,n-1);return ok({vis:{t:'shape',k:K,shade:s},prompt:`Gizmo painted the shaded ${PL(s,'part')}. How many more ${K} must he paint to paint the whole thing?`,tpl:`{A} more ${K}`,answer:n-s,text:`g2s1 ${K} ${s}`,explain:`<p>The whole is ${n} ${K}. ${s} ${s===1?'is':'are'} done.</p><p>${n} − ${s} = <b>${n-s}</b></p>`,nudge:`<p>How many ${K} make the whole?</p>`});}
  if(v===2){const ks=SH([K,K==='thirds'?'fourths':'thirds','unequal']);const r=LET[ks.indexOf(K)];
   return choice(ok({vis:ROW(ks.map(k=>({k}))),prompt:`Which ${f} is cut into <b>${K}</b>?`,tpl:`${cap(f)} {A}`,text:`g2s2 ${ks.join()} ${f}`,explain:`<p>${cap(K)} means ${n} <b>equal</b> parts.</p><p>${cap(f)} <b>${r}</b> has ${n} equal parts.</p>`,nudge:'<p>Count the parts, and check that they are the same size.</p>'}),r,['A','B','C']);}
  const [A,B]=pickN([who('rosa'),who('gizmo'),who('skyla'),who('ozzy'),who('nana'),who('flex')],2);const [ka,kb]=SH(['halves','thirds','fourths']).slice(0,2);const na={halves:2,thirds:3,fourths:4}[ka],nb={halves:2,thirds:3,fourths:4}[kb];const big=na<nb?A:B;
  return choice(st({prompt:`${A.N} cuts a ${f} into ${ka}. ${B.N} cuts the same size ${f} into ${kb}. Whose pieces are bigger?`,tpl:'{A}',text:`g2s3 ${A.n}${B.n}${ka}${kb}`,explain:`<p>${cap(ka)} = ${na} pieces, ${kb} = ${nb} pieces.</p><p>Fewer pieces means bigger pieces, so <b>${big.n}</b>'s pieces are bigger.</p>`,nudge:'<p>Which way cuts the food into fewer pieces?</p>'}),big.n,[A.n,B.n,'They are the same']);},
 shareTF:c=>{const [k,P]=forRound(TF2,c.round);return tfQ('The Kind Teacher wrote these on the board. Is each one true or false?',dkRows('g2tf'+k,P,3),'Picture cutting a real pizza. Equal parts only!');},
 sel:o=>c=>{const pr=PK(o.hard?P2S.slice(3):P2S.slice(0,3));const list=mix(['tri','square','rect','rhombus','trap','kite','pent','hex','pent','hex','tri'].map(k=>sp(k)),pr[1],4);const w=PK(['Gizmo needs shapes for a robot.','Grumbleroot is fixing his bridge.','Skyla is building a nest.']);
  return MU({vis:ROW(list),prompt:`${w} Select ALL ${pr[0]}.`,multi:LET.slice(0,4),ans:ansOf(list,pr[1]),text:`g2sel ${pr[0]} ${list.map(s=>s.k+(s.ttype||'')).join()} ${w}`,explain:selEx(list,pr[1],s=>`${SIDES[s.k]} sides`),nudge:`<p>${pr[2]}</p>`});},
 ruler:o=>c=>{const u=PK([['in','inches'],['cm','centimeters']]);const s=o.shift&&Math.random()<.75?R(1,4):0;const n=R(2,12-s);const [st0,e,th]=PK(RT);
  return ok({vis:{t:'ruler',len:n,unit:u[0],start:s,obj:e},prompt:`${st0} How long is the ${th}?`,tpl:`{A} ${u[1]}`,answer:n,text:`g2r ${th} ${s} ${n} ${u[0]}`,explain:s?`<p>It starts at ${s}, not at 0! It ends at ${s+n}.</p><p>Count the spaces: ${s+n} − ${s} = <b>${n}</b></p>`:`<p>It starts at 0 and ends at ${n}: <b>${n}</b> ${u[1]}.</p>`,nudge:'<p>Look at both ends. Where does it start?</p>',fast:15});},
 longer:o=>c=>{const u=PK([['in','inches',3,12],['cm','centimeters',5,o.big?60:30]]);
  if(o.ruler&&Math.random()<.6){const s=o.big?R(0,3):0;const n=R(5,12-s);const b=R(2,n-2);const [st0,e,th,pr]=PK(RT.filter(x=>x[2]!=='key'));const t2=PK(['crayon','paper clip','eraser'].filter(x=>x!==th));
   return st({vis:{t:'ruler',len:n,unit:u[0],start:s,obj:e},prompt:`${st0} ${cap(pr)} ${t2} is <b>${b}</b> ${u[1]} long. How much longer is the ${th} than the ${t2}?`,tpl:`{A} ${u[1]} longer`,answer:n-b,text:`g2lr ${th} ${s} ${n} ${b} ${u[0]}`,explain:`<p>The ${th}: ${s?`from ${s} to ${s+n}, `:''}${n} ${u[1]}.</p><p>${n} − ${b} = <b>${n-b}</b></p>`,nudge:'<p>Step 1: read the ruler carefully. Step 2: subtract.</p>'});}
  const big=o.big&&u[0]==='cm';let [A,B]=pickN(big?L2B:L2,2);let a=R(u[2]+4,u[3]),b=R(u[2],a-3);if(big){const B0=pickN(L2B,2);A=B0[0];B=B0[1];a=R(Math.max(A[2],B[2]+11),Math.max(A[3],B[2]+15));b=R(B[2],Math.min(B[3],a-11));}
  return st({prompt:`${A[0]} is <b>${a}</b> ${u[1]} long. ${B[0]} is <b>${b}</b> ${u[1]} long. How much longer is the ${A[1]} than the ${B[1]}?`,tpl:`{A} ${u[1]} longer`,answer:a-b,text:`g2lo ${A[1]}${B[1]} ${a} ${b}`,explain:`<p>Find the difference: ${a} − ${b} = <b>${a-b}</b></p>`,nudge:`<p>Count up from ${b} to ${a}.</p>`});},
 jump:o=>c=>{const v=dk('g2j'+(o.vs||[0]).join(''),o.vs||[0]);
  if(v===0){const a=R(2,9),b=R(2,9);const [s,q]=PK([[`Skyla flies <b>${a}</b> miles, then <b>${b}</b> more miles.`,'Tap the number line where she lands.'],[`Coach Flex jumps <b>${a}</b> feet, then <b>${b}</b> more feet.`,'Tap how far he went in all.'],[`Gizmo's toy car rolls <b>${a}</b> meters, then <b>${b}</b> more meters.`,'Tap where it stops.']]);
   return NL({prompt:`${s} ${q}`,text:`g2j0 ${a} ${b} ${s.slice(0,8)}`,explain:`<p>Start at 0. Jump ${a} to ${a}. Jump ${b} more to <b>${a+b}</b>.</p>`,nudge:`<p>Make the first jump, then the second jump.</p>`},0,20,1,a+b);}
  if(v===1){const a=R(11,20),b=R(3,9);const [s,q]=PK([[`Ms. Rosa has a ribbon <b>${a}</b> inches long. She cuts off <b>${b}</b> inches.`,'Tap how long the ribbon is now.'],[`Ozzy's train is at mile <b>${a}</b>. It backs up <b>${b}</b> miles.`,'Tap where the train is now.']]);
   return NL({prompt:`${s} ${q}`,text:`g2j1 ${a} ${b} ${s.slice(0,8)}`,explain:`<p>Start at ${a}. Jump back ${b}.</p><p>${a} − ${b} = <b>${a-b}</b></p>`,nudge:'<p>Find the start, then jump back.</p>'},0,20,1,a-b);}
  if(v===3){const a=R(6,12),b=R(3,8);const [s,q]=PK([[`Skyla flew <b>${a}</b> miles on Monday. On Tuesday she flew <b>${b}</b> miles more than on Monday.`,'Tap how far she flew on Tuesday.'],[`Gizmo's red wire is <b>${a}</b> inches long. His blue wire is <b>${b}</b> inches longer than the red one.`,'Tap the length of the blue wire.']]);
   if(a+b>20)return g2.jump(o)(c);return NL(st({prompt:`${s} ${q}`,text:`g2j3 ${a} ${b} ${s.slice(0,8)}`,explain:`<p>${b} more than ${a}: ${a} + ${b} = <b>${a+b}</b>.</p>`,nudge:'<p>"More than" means start at the first number and jump forward.</p>'}),0,20,1,a+b);}
  const a=R(5,9),b=R(2,4),d=R(3,8);return NL(st({prompt:`Ozzy's train goes forward <b>${a}</b> miles, back <b>${b}</b> miles, then forward <b>${d}</b> miles. It started at 0. Tap where it stops.`,text:`g2j2 ${a}${b}${d}`,explain:`<p>${a} − ${b} = ${a-b}.</p><p>${a-b} + ${d} = <b>${a-b+d}</b></p>`,nudge:'<p>Do one move at a time.</p>'}),0,20,1,a-b+d);},
 est:c=>{const [q,r,w]=dk('g2est',EST2);return choice(ok({prompt:`Gizmo can't find a ruler, so he estimates. ${q}`,tpl:'{A}',text:`g2e ${q}`,explain:`<p>Think of the size of an inch (a thumb), a foot (a ruler), a centimeter (a fingertip) and a meter (a big step).</p><p>It is <b>${r}</b>.</p>`,nudge:'<p>Picture each choice. Which one makes sense?</p>'}),r,w);},
 unit:c=>{const [s,q,r,w,ex]=dk('g2unit',UNIT2);return choice(ok({prompt:`${s} ${q}`,tpl:'{A}',text:`g2u ${s}`,explain:`<p>${ex}</p>`,nudge:'<p>Which unit is smaller? Smaller units take more of them.</p>',fast:20}),r,w);},
 /* Legend */
 leg1:c=>{const v=R(0,2);
  if(v===0){const a=R(9,15),b=R(4,9),d=R(2,6);return st({prompt:`Coach Flex has a jump rope <b>${a}</b> feet long. He ties on <b>${b}</b> more feet. Then he cuts off <b>${d}</b> feet. How long is the rope now?`,tpl:'{A} feet',answer:a+b-d,text:`g2l0 ${a}${b}${d}`,explain:`<p>${a} + ${b} = ${a+b}.</p><p>${a+b} − ${d} = <b>${a+b-d}</b></p>`,nudge:'<p>Step 1: add on. Step 2: cut off.</p>',fast:35});}
  if(v===1){const a=R(30,60),b=R(8,15),d=R(10,20);return st({prompt:`Nana Paws knits a scarf <b>${a}</b> inches long. The Grey Goblin steals <b>${b}</b> inches of it! Then she knits <b>${d}</b> more inches. How long is the scarf now?`,tpl:'{A} inches',answer:a-b+d,text:`g2l1 ${a}${b}${d}`,explain:`<p>${a} − ${b} = ${a-b}.</p><p>${a-b} + ${d} = <b>${a-b+d}</b></p>`,nudge:'<p>Take away first, then add.</p>',fast:35});}
  const a=R(20,45),b=R(15,40),t=R(30,a+b-5);return st({prompt:`Skyla flies <b>${a}</b> meters to a tree, then <b>${b}</b> meters to the lake. Ozzy's balloon floats <b>${t}</b> meters. How much farther did Skyla fly?`,tpl:'{A} meters farther',answer:a+b-t,text:`g2l2 ${a}${b}${t}`,explain:`<p>Skyla: ${a} + ${b} = ${a+b}.</p><p>${a+b} − ${t} = <b>${a+b-t}</b></p>`,nudge:'<p>First find how far Skyla flew in all.</p>',fast:40});},
 leg2:c=>{const v=R(0,2);
  if(v===0){const r=R(3,4),k=R(4,5),e=R(4,9);return st({vis:{t:'array',r,c:k,e:'🧁'},prompt:`Ms. Rosa's tray has <b>${r}</b> rows of <b>${k}</b> muffins. She sells <b>${e}</b>. How many muffins are left?`,tpl:'{A} muffins',answer:r*k-e,text:`g2l3 ${r}${k}${e}`,explain:`<p>${Array(r).fill(k).join(' + ')} = ${r*k}.</p><p>${r*k} − ${e} = <b>${r*k-e}</b></p>`,nudge:'<p>How many muffins were on the tray at first?</p>'});}
  if(v===1){const [nm,s]=PK([['pentagons',5],['hexagons',6],['quadrilaterals',4],['triangles',3]]);const n=R(2,3);return st({prompt:`Gizmo builds ${n} ${nm} with straws, one straw for each side. How many straws does he use?`,tpl:'{A} straws',answer:n*s,text:`g2l4 ${nm}${n}`,explain:`<p>One of them has ${s} sides.</p><p>${Array(n).fill(s).join(' + ')} = <b>${n*s}</b></p>`,nudge:'<p>How many sides does one have?</p>'});}
  const [a,b,d]=[R(12,25),R(10,20),R(8,15)];return st({prompt:`Nana Paws ties three pieces of yarn end to end. They are <b>${a}</b>, <b>${b}</b> and <b>${d}</b> inches long. How long is the yarn now?`,tpl:'{A} inches',answer:a+b+d,text:`g2l5 ${a}${b}${d}`,explain:`<p>${a} + ${b} = ${a+b}.</p><p>${a+b} + ${d} = <b>${a+b+d}</b></p>`,nudge:'<p>Add two pieces first, then the third.</p>',fast:40});},
 leg3:c=>{if(Math.random()<.5){const n=R(2,3),f=R(2,5);return st({prompt:`Gizmo puts a sticker on every face of <b>${n}</b> cubes. Then <b>${f}</b> stickers fall off. How many stickers are still on?`,tpl:'{A} stickers',answer:6*n-f,text:`g2l6 ${n}${f}`,explain:`<p>Each cube has 6 faces: ${Array(n).fill(6).join(' + ')} = ${6*n}.</p><p>${6*n} − ${f} = <b>${6*n-f}</b></p>`,nudge:'<p>How many faces does a cube have?</p>'});}
  const a=R(4,8),b=R(5,9);return st({prompt:`Put two crystals end to end: Dr. Quartz's is <b>${a}</b> centimeters, and the Grey Goblin's is <b>${b}</b> centimeters longer than that. How long are they together?`,tpl:'{A} centimeters',answer:a+a+b,text:`g2l7 ${a}${b}`,explain:`<p>The goblin's crystal: ${a} + ${b} = ${a+b} centimeters.</p><p>End to end: ${a} + ${a+b} = <b>${2*a+b}</b> centimeters</p>`,nudge:'<p>Step 1: how long is the goblin\'s crystal? Step 2: add both.</p>',fast:35});},
 leg4:c=>{const v=dk('g2l4v',[0,1]);if(v===0){const s=R(3,9),k=PK([['square',4],['triangle',3],['pentagon',5]]);return st({prompt:`Grumbleroot builds a fence around a ${k[0]}-shaped goat pen. Every side is <b>${s}</b> feet long. How many feet of fence does he need?`,tpl:'{A} feet',answer:s*k[1],text:`g2l9 ${k[0]} ${s}`,explain:`<p>A ${k[0]} has ${k[1]} sides.</p><p>${Array(k[1]).fill(s).join(' + ')} = <b>${s*k[1]}</b></p>`,nudge:'<p>How many sides? Add one length for each side.</p>',fast:35});}
  const a=R(30,60),b=R(15,a-10);return st({prompt:`Skyla's wing feather is <b>${a}</b> centimeters long. Her tail feather is <b>${b}</b> centimeters long. She lays them end to end, then Gizmo cuts <b>10</b> centimeters off. How long is it now?`,tpl:'{A} centimeters',answer:a+b-10,text:`g2l10 ${a}${b}`,explain:`<p>${a} + ${b} = ${a+b}.</p><p>${a+b} − 10 = <b>${a+b-10}</b></p>`,nudge:'<p>Step 1: put them end to end. Step 2: cut off 10.</p>',fast:40});},
 legRight:c=>{const v=dk('g2lr',[0,1,2]);const w=who(PK(['gizmo','ozzy','flex','quartz']));
  if(v===0){const s=R(1,4),n=R(3,8);return isRight(w,`My pencil goes from the ${s} to the ${s+n} on the ruler, so it is ${s+n} inches long.`,`No, it starts at ${s}, so it is ${n} inches long`,[`No, it is ${2*s+n} inches because ${s} + ${s+n} = ${2*s+n}`,`No, it is ${s} inches long`],`<p>Count the spaces from ${s} to ${s+n}: ${s+n} − ${s} = <b>${n}</b> inches. ${w.He} is not right.</p>`,{vis:{t:'ruler',len:n,unit:'in',start:s,obj:'✏️'}});}
  if(v===1)return isRight(w,'I cut my cracker into 4 pieces, so each piece is one fourth.','No, the 4 pieces must be the same size to be fourths',['No, 4 pieces make thirds','No, one fourth means 2 pieces'],'<p>Fourths must be <b>equal</b> parts. These pieces are not the same size.</p>',{vis:{t:'shape',k:'unequal'}});
  return isRight(w,'A cube has 6 faces, and every face is a square.',true,['No, a cube has 4 faces','No, the faces are triangles','No, a cube has 8 faces'],`<p>Top, bottom, front, back, left, right: 6 square faces. <b>${w.He} is right!</b></p>`);}
};
PLAN.def('geo',2,[
 [g2.name,g2.count({}),g2.ruler({}),g2.part({max:4}),g2.share({vs:[0,1]}),g2.jump({vs:[0]}),g2.sel({}),g2.cube({})],
 [g2.ruler({shift:1}),g2.longer({}),g2.est,g2.jump({vs:[0,1]}),g2.shareTF,g2.part({max:5}),g2.count({}),g2.share({vs:[2]}),g2.cube({}),g2.count({two:1})],
 [g2.part({max:5,novis:1}),g2.share({vs:[1]}),g2.longer({ruler:1}),g2.est,g2.count({two:1}),g2.sel({hard:1}),g2.jump({vs:[1]}),g2.cube({hard:1})],
 [g2.unit,g2.ruler({shift:1}),g2.shareTF,g2.cube({hard:1}),g2.longer({ruler:1,big:1}),g2.jump({vs:[1,3]}),g2.count({two:1}),g2.part({max:5,novis:1}),g2.est,g2.share({vs:[1]})],
 [g2.leg1,g2.leg2,g2.leg3,g2.legRight,g2.jump({vs:[2]}),g2.leg4,g2.longer({ruler:1,big:1}),g2.unit]]);

/* ---------- grade 3: quadrilaterals and their families, equal parts as fractions of area (perimeter and area live in Measure Mesa: light links only) ---------- */
const Q3={square:['square','4 equal sides and 4 right angles',['trapezoid','kite','pentagon']],rect:['rectangle','4 right angles, but its sides are not all the same length',['square','rhombus','trapezoid','kite']],
 rhombus:['rhombus','4 equal sides, but no right angles',['square','rectangle','trapezoid']],trap:['trapezoid','a top and bottom that go the same way (like train tracks) but are different lengths, and two leaning sides',['rectangle','rhombus','square','kite']],
 kite:['kite','two pairs of equal sides that sit next to each other',['trapezoid','square','rectangle']],para:['parallelogram','two pairs of sides that go the same way, but no right angles',['rectangle','square','kite']]};
const P3=[['the <b>quadrilaterals</b>',s=>SIDES[s.k]===4,'A quadrilateral is any shape with 4 sides.'],['the shapes with <b>4 right angles</b>',s=>s.k==='square'||s.k==='rect','Look for the little square marks. You need one in every corner.'],
 ['the shapes with <b>4 equal sides</b>',s=>s.k==='square'||s.k==='rhombus','Check whether all 4 sides are the same length.'],['the shapes that are <b>not</b> quadrilaterals',s=>SIDES[s.k]!==4,'Count the sides. Not 4 sides means not a quadrilateral.']];
/* true/false pools, one per round (no statement is used in two rounds) */
const TF3={2:[['A square has 4 sides.',true,''],['A triangle is a quadrilateral.',false,'it has only 3 sides'],['A rectangle has 4 right angles.',true,''],['A pentagon is a quadrilateral.',false,'it has 5 sides'],
  ['A kite has 4 sides.',true,''],['A hexagon has 4 angles.',false,'it has 6'],['Every quadrilateral has 4 angles.',true,''],['A circle is a quadrilateral.',false,'it has no sides at all']],
 3:[['A square is always a rectangle.',true,'it has 4 right angles'],['A rectangle is always a square.',false,'its sides do not have to be equal'],['Every rhombus has 4 sides of the same length.',true,''],
  ['A rhombus always has 4 right angles.',false,'it can lean'],['A square is always a rhombus.',true,'it has 4 equal sides'],['Every quadrilateral is a rectangle.',false,'a kite is not'],['A trapezoid is a quadrilateral.',true,'it has 4 sides'],['A kite always has 4 equal sides.',false,'only its neighbor sides match']],
 4:[['Some rectangles are squares.',true,''],['Some rhombuses are not squares.',true,'the leaning ones'],['Every 4-sided shape with 4 right angles is a rectangle.',true,''],['A shape with 4 equal sides must be a square.',false,'a rhombus can lean'],
  ['If a quadrilateral has 4 right angles, its sides must all be equal.',false,'a long rectangle does not'],['A rhombus can be a square.',true,'if it has right angles'],['Every rectangle is a rhombus.',false,'its sides are not all equal'],['A shape with 3 sides can be a quadrilateral.',false,'it needs 4 sides'],['Every square is a quadrilateral.',true,''],['A rectangle can have sides of 2 different lengths.',true,''],['Every kite is a square.',false,'most kites have no right angles']],
 5:[['Halves of the same square can be different shapes.',true,''],[`If a rectangle is cut into 4 equal parts, each part is ${F(1,4)} of its area.`,true,''],['A shape cut into 4 parts that are not equal is cut into fourths.',false,'fourths must be equal'],
  ['A square cut corner to corner makes 2 triangles of the same size.',true,''],['A rectangle cut into 3 equal parts shows thirds.',true,''],[`${F(1,2)} of a big pizza is the same amount as ${F(1,2)} of a small pizza.`,false,'the big pizza\'s half is bigger'],
  ['Every quadrilateral with 4 equal sides is a rhombus.',true,''],[`Each part of a shape cut into 6 equal parts is ${F(1,6)} of the area.`,true,''],['A square cut into 2 parts is always cut into halves.',false,'only if the 2 parts are equal']]};
const RID3=[['I have 4 equal sides, but no right angles.','rhombus'],['I have 4 right angles, but my sides are not all equal.','rectangle'],['I am a rectangle and a rhombus at the same time.','square'],
 ['I have 4 sides. My top and bottom go the same way but are different lengths, and my other two sides lean in.','trapezoid'],['I have 5 sides and 5 angles.','pentagon'],['I have 4 sides. My two pairs of equal sides sit next to each other, and I fly on a string.','kite']];
const RID3W={rhombus:['square','rectangle','trapezoid'],rectangle:['square','rhombus','trapezoid'],square:['rhombus','rectangle','kite'],trapezoid:['rectangle','square','rhombus'],pentagon:['hexagon','quadrilateral','triangle'],kite:['trapezoid','rectangle','pentagon']};
const g3={
 best:c=>{const k=PK(Object.keys(Q3));const [nm,why,wr]=Q3[k];const it=PK(IN2);
  return choice(ok({vis:S1(k,{ang:true}),prompt:`${it} What is the <b>best</b> name for it?`,tpl:'{A}',text:`g3b ${k} ${it}`,explain:`<p>It has ${why}.</p><p>The best name is ${ABn(nm)}.</p>`,nudge:'<p>Check the sides (all equal?) and the corners (right angles?).</p>',fast:15}),nm,pickN(wr,3));},
 rcount:c=>{const s=PK([{k:'square'},{k:'rect'},{k:'tri',ttype:'right'},{k:'rhombus'},{k:'para'},{k:'tri',ttype:'obtuse'},{k:'rect'}]);const n={square:4,rect:4,rhombus:0,para:0,tri:s.ttype==='right'?1:0}[s.k];
  return ok({vis:Object.assign({t:'shape',ang:true},s),prompt:'Grumbleroot checks the corners of this sign. How many <b>right angles</b> does it have?',tpl:'{A} right angles',answer:n,text:`g3rc ${s.k}${s.ttype||''}`,explain:`<p>A right angle is a square corner, marked with a little square.</p><p>${cap(nmOf(s))} has <b>${n}</b>.</p>`,nudge:'<p>Look in every corner for a square corner.</p>',fast:10});},
 sel:o=>c=>{const pr=PK(o.ps?o.ps.map(i=>P3[i]):P3);const list=mix(['square','rect','rhombus','trap','kite','para','tri','pent','hex','rect','rhombus'].map(k=>sp(k,{ang:true})),pr[1],4);
  const w=PK(['Dr. Quartz sorts his crystal shapes.','The Kind Teacher draws four shapes.','Gizmo needs parts for a robot.']);
  return MU({vis:ROW(list),prompt:`${w} Select ALL ${pr[0]}.`,multi:LET.slice(0,4),ans:ansOf(list,pr[1]),text:`g3sel ${pr[0]} ${list.map(s=>s.k+(s.ttype||'')).join()} ${w}`,explain:selEx(list,pr[1],s=>nmOf(s)),nudge:`<p>${pr[2]}</p>`});},
 tf:o=>c=>{const [k,P]=forRound(TF3,c.round);return tfQ(PK(['Dr. Quartz wrote rules for his shape club. Is each one true or false?','The Grey Goblin scribbled some shape facts. Is each one true or false?']),dkRows('g3tf'+k,P,o.n||3),'Think of every shape that could fit. If even one shape breaks the rule, it is false.');},
 frac:o=>c=>{const v=dk('g3fr'+(o.vs||[0,1]).join(''),o.vs||[0,1]);
  if(v===5){const n=PK([6,8]);const a=R(1,n-4),b=R(1,n-a-2);return st({vis:{t:'array',r:2,c:n/2,e:'⬜'},prompt:`Gizmo's wall has <b>${n}</b> equal panels. <b>${a}</b> ${a===1?'panel is':'panels are'} already red. He paints <b>${b}</b> more red. What fraction of the wall is red now?`,tpl:`${FA(n)}`,answer:a+b,text:`g3f5 ${n}${a}${b}`,explain:`<p>${a} + ${b} = ${a+b} red panels out of ${n}.</p><p><b>${F(a+b,n)}</b></p>`,nudge:'<p>How many panels are red after he paints?</p>',fast:30});}
  if(v===4){const [r,cc]=dk('g3fr4',[[2,4],[2,3],[3,3],[2,5],[3,4]]);const n=r*cc;const a=R(1,n-3),b=R(1,n-a-1);return st({vis:{t:'array',r,c:cc,e:'🟫'},prompt:`Gizmo's garden has <b>${n}</b> equal beds. He plants carrots in <b>${a}</b> ${PL(a,'bed')} and beans in <b>${b}</b> ${PL(b,'bed')}. What fraction of the garden has <b>nothing</b> planted?`,tpl:`${FA(n)}`,answer:n-a-b,text:`g3f4 ${r}${cc}${a}${b}`,explain:`<p>${a} + ${b} = ${a+b} beds are planted.</p><p>${n} − ${a+b} = ${n-a-b} empty, so <b>${F(n-a-b,n)}</b>.</p>`,nudge:'<p>Step 1: how many beds are planted? Step 2: how many are empty?</p>',fast:30});}
  if(v===0){const K=PK(['halves','thirds','fourths']);const n={halves:2,thirds:3,fourths:4}[K];const [w,t]=PK([['Gizmo splits his garden','garden'],['Nana Paws cuts a blanket','blanket'],['Ms. Rosa cuts a cake','cake']]);
   return choice(ok({vis:{t:'shape',k:K},prompt:`${w} into equal parts. What fraction of the ${t}'s area is <b>each</b> part?`,tpl:'{A}',text:`g3f0 ${K} ${t}`,explain:`<p>There are ${n} equal parts, so each part is 1 out of ${n}.</p><p>Each part is <b>${F(1,n)}</b> of the area.</p>`,nudge:'<p>Count the equal parts. Each part is 1 of them.</p>'}),F(1,n),[F(1,2),F(1,3),F(1,4),F(1,6),F(1,8)]);}
  if(v===1){const [r,cc]=PK([[2,2],[2,3],[3,2],[2,4],[4,2]]);const n=r*cc;
   return choice(ok({vis:{t:'array',r,c:cc,e:'🟫'},prompt:`Ms. Rosa cuts a pan of cornbread into ${r} rows and ${cc} columns of equal pieces. What fraction of the pan is <b>one</b> piece?`,tpl:'{A}',text:`g3f1 ${r}x${cc}`,explain:`<p>${r} rows of ${cc} = ${n} equal pieces.</p><p>One piece is <b>${F(1,n)}</b> of the pan.</p>`,nudge:'<p>How many equal pieces are there in all?</p>'}),F(1,n),[F(1,r),F(1,cc),F(1,n+1),F(1,n-1)]);}
  if(v===2){const K=PK(['thirds','fourths']);const n=K==='thirds'?3:4;const s=R(1,n-1);
   return ok({vis:{t:'shape',k:K,shade:s},prompt:`The Grey Goblin painted the shaded part grey. What fraction of the shape's area is grey?`,tpl:`${FA(n)}`,answer:s,text:`g3f2 ${K}${s}`,explain:`<p>${n} equal parts, and ${s} are grey.</p><p>${s} out of ${n} is <b>${F(s,n)}</b>.</p>`,nudge:'<p>How many equal parts in all? How many are grey?</p>'});}
  const [r,cc]=PK([[2,3],[2,4],[3,2],[2,2]]);const n=r*cc;const k=R(1,n-1);const cells=SH(Array.from({length:n},(_,i)=>i<k));let g='';for(let i=0;i<r;i++)g+=cells.slice(i*cc,i*cc+cc).map(x=>x?'🟦':'⬜').join('')+'<br>';
  return ok({prompt:`Gizmo tiled a floor with ${n} equal square tiles:<br>${g}What fraction of the floor is blue?`,tpl:`${FA(n)}`,answer:k,text:`g3f3 ${r}x${cc} ${cells.map(Number).join('')}`,explain:`<p>${n} equal tiles, ${k} blue.</p><p>The blue part is <b>${F(k,n)}</b> of the floor.</p>`,nudge:'<p>Count all the tiles, then the blue ones.</p>'});},
 area:o=>c=>{const r=R(2,o.max||5),cc=R(2,o.max||6);return ok({vis:{t:'array',r,c:cc,e:'🟩'},prompt:`Each square is 1 square unit. What is the area of Gizmo's tiled floor?`,tpl:'{A} square units',answer:r*cc,text:`g3a ${r}x${cc}`,explain:`<p>${r} rows of ${cc}: ${r} × ${cc} = <b>${r*cc}</b> square units.</p>`,nudge:'<p>Count one row, then multiply by the number of rows.</p>'});},
 perim:o=>c=>{const v=PK(o.vs||[0,1]);
  if(v===0){const s=R(3,10);const w=who(PK(['nana','rosa','troll']));return ok({vis:S1('square',{lab:[s+' m'],ang:true}),prompt:`${w.N}'s garden is a square with sides of <b>${s}</b> meters. How many meters of fence go all the way around?`,tpl:'{A} meters',answer:4*s,text:`g3p0 ${s} ${w.n}`,explain:`<p>A square has 4 equal sides.</p><p>${s} + ${s} + ${s} + ${s} = 4 × ${s} = <b>${4*s}</b></p>`,nudge:'<p>How many sides, and how long is each?</p>'});}
  if(v===1){const l=R(4,10),w=R(2,l-1);return ok({vis:{t:'rect',top:l+' cm',side:w+' cm'},prompt:'What is the perimeter of this rectangle?',tpl:'{A} cm',answer:2*(l+w),text:`g3p1 ${l}x${w}`,explain:`<p>Add all 4 sides: ${l} + ${w} + ${l} + ${w} = <b>${2*(l+w)}</b> cm</p>`,nudge:'<p>A rectangle has two long sides and two short sides.</p>'});}
  const s=R(3,9);return ok({prompt:`A square has a perimeter of <b>${4*s}</b> cm. How long is each side?`,tpl:'{A} cm',answer:s,text:`g3p2 ${s}`,explain:`<p>4 equal sides make ${4*s}.</p><p>${4*s} ÷ 4 = <b>${s}</b> cm</p>`,nudge:'<p>4 equal sides. What number times 4 makes the perimeter?</p>'});},
 right:o=>c=>{const v=dk('g3ir'+(o.vs||[0,1,2,3,4,5,6]).join(''),o.vs||[0,1,2,3,4,5,6]);const w=who();
  if(v===0)return isRight(w,'This shape has 4 sides, so it must be a square.','No, a 4-sided shape could be a rhombus, rectangle, trapezoid or kite',['No, a square has 5 sides','No, a square has no right angles'],'<p>A square needs 4 equal sides <b>and</b> 4 right angles. This shape has 4 sides, but it is not a square.</p>',{vis:S1(PK(['rhombus','trap','kite','para']),{ang:true})});
  if(v===1)return isRight(w,'A square is a rectangle.',true,['No, a square has 4 equal sides, so it is not a rectangle','No, a rectangle must be long and thin','No, a rectangle has 3 sides'],`<p>A rectangle is any quadrilateral with 4 right angles. A square has 4 right angles, so it <b>is</b> a rectangle. ${w.He} is right!</p>`);
  if(v===2)return isRight(w,'Every rhombus is a square.','No, a rhombus does not need right angles',['No, a rhombus has 5 sides','No, a rhombus has no equal sides'],'<p>A rhombus has 4 equal sides, but it can lean, with no right angles. So <b>not every rhombus is a square</b>.</p>');
  if(v===3)return isRight(w,`I cut this shape into 4 parts, so each part is ${F(1,4)}.`,'No, the 4 parts are not equal, so they are not fourths',[`No, each part is ${F(1,3)}`,`No, each part is ${F(1,5)}`],'<p>Fourths must be 4 <b>equal</b> parts. These parts are different sizes.</p>',{vis:{t:'shape',k:'unequal'}});
  if(v===4)return isRight(w,'A trapezoid has 4 sides, so it is a quadrilateral.',true,['No, a trapezoid has 3 sides','No, a quadrilateral must have 4 right angles','No, only squares are quadrilaterals'],`<p>Any shape with 4 sides is a quadrilateral. ${w.He} is right!</p>`);
  if(v===5)return isRight(w,'I cut one square into 2 triangles and the same size square into 2 rectangles. The triangle is bigger than the rectangle.','No, each piece is half of the same square, so they have the same area',['No, the rectangle is bigger','No, the triangle is twice as big'],'<p>Each piece is <b>half</b> of the same size square, so the triangle and the rectangle cover the same area.</p>');
  if(v===7)return isRight(w,'A rhombus is a quadrilateral.',true,['No, a rhombus has 5 sides','No, a quadrilateral must have right angles','No, only squares are quadrilaterals'],`<p>A rhombus has 4 sides, so it is a quadrilateral. ${w.He} is right!</p>`);
  if(v===8)return isRight(w,'A kite is a rhombus, because it has 4 sides.','No, a rhombus needs 4 equal sides, and a kite does not have them',['No, a kite has 3 sides','No, a rhombus has 6 sides'],'<p>Having 4 sides makes it a quadrilateral, not a rhombus. A rhombus needs <b>4 equal sides</b>.</p>',{vis:S1('kite')});
  if(v===9)return isRight(w,'Every rectangle has 4 equal sides.','No, most rectangles have 2 long sides and 2 short sides',['No, a rectangle has 3 sides','No, a rectangle has 5 equal sides'],'<p>Only the rectangles that are squares have 4 equal sides.</p>');
  if(v===10)return isRight(w,'If a rectangle has 4 equal sides, it is also a rhombus.',true,['No, a rectangle can never be a rhombus','No, a rhombus cannot have right angles','No, it would be a trapezoid'],`<p>A rhombus is any quadrilateral with 4 equal sides. A rectangle with 4 equal sides (a square) has them, so it is a rhombus too. ${w.He} is right!</p>`);
  return isRight(w,'A rectangle always has 4 right angles.',true,['No, a rectangle has 2 right angles','No, only a square has right angles','No, a rectangle has no right angles'],`<p>Every rectangle has 4 right angles. ${w.He} is right!</p>`);},
 riddle:c=>{const [t,a]=dk('g3rid',RID3);const w=who(PK(['wiz','gizmo','skyla','ozzy','rosa']));
  return choice(st({prompt:`${w.N} turned into a shape riddle! ${w.He} says: “${t}” What shape is ${w.he}?`,tpl:'{A}',text:`g3rid ${t} ${w.n}`,explain:`<p>${t}</p><p>That is ${ABn(a)}.</p>`,nudge:'<p>Test each choice against every clue.</p>'}),a,RID3W[a]);},
 /* Legend */
 legA:c=>{if(Math.random()<.5){const s=R(3,9),x=R(2,10);const f=4*s+x;return st({prompt:`Nana Paws builds a square dog pen. Each side is <b>${s}</b> meters. She has <b>${f}</b> meters of fence. How much fence is left over?`,tpl:'{A} meters',answer:x,text:`g3lA0 ${s} ${f}`,explain:`<p>Around the square: 4 × ${s} = ${4*s} meters.</p><p>${f} − ${4*s} = <b>${x}</b></p>`,nudge:'<p>Step 1: how much fence goes around the pen? Step 2: subtract.</p>',fast:35});}
  const l=R(4,8),w=R(2,Math.min(l-1,12-l));return st({vis:{t:'rect',top:l+' m',side:w+' m'},prompt:`Coach Flex runs around this field <b>2 times</b>. How many meters does he run?`,tpl:'{A} meters',answer:4*(l+w),text:`g3lA1 ${l}${w}`,explain:`<p>Once around: ${l} + ${w} + ${l} + ${w} = ${2*(l+w)} meters.</p><p>Two times: ${2*(l+w)} + ${2*(l+w)} = <b>${4*(l+w)}</b></p>`,nudge:'<p>Step 1: once around. Step 2: twice around.</p>',fast:35});},
 legB:c=>{if(dk('g3lbv',[0,1])===0){const [r,cc,k]=dk('g3lb',[[2,3,1],[2,4,3],[3,2,4],[2,4,5],[3,3,2],[2,3,4],[2,5,3],[3,4,5]]);const n=r*cc;return st({vis:{t:'array',r,c:cc,e:'🍰'},prompt:`Ms. Rosa cuts a tray into ${r} rows of ${cc} equal pieces. She sells <b>${k}</b> ${PL(k,'piece')}. What fraction of the tray is left?`,tpl:`${FA(n)} of the tray`,answer:n-k,text:`g3lB0 ${r}${cc}${k}`,explain:`<p>${r} × ${cc} = ${n} equal pieces. ${n} − ${k} = ${n-k} left.</p><p>That is <b>${F(n-k,n)}</b> of the tray.</p>`,nudge:'<p>How many pieces in all? How many are left?</p>'});}
  const n=PK([3,4,6,8]);const k=R(1,n-1);return st({prompt:`Dr. Quartz splits a square crystal into <b>${n}</b> equal parts. The Grey Goblin steals <b>${k}</b> of them. What fraction of the crystal is left?`,tpl:`${FA(n)}`,answer:n-k,text:`g3lB1 ${n}${k}`,explain:`<p>${n} − ${k} = ${n-k} parts are left, out of ${n}.</p><p><b>${F(n-k,n)}</b></p>`,nudge:'<p>How many equal parts are left?</p>'});},
 legC:c=>{if(Math.random()<.5){const r=R(3,6),cc=R(3,6);const d=R(4,r*cc-3);return st({prompt:`Gizmo tiles a floor that is <b>${r}</b> squares by <b>${cc}</b> squares. He has laid <b>${d}</b> tiles. How many more tiles does he need?`,tpl:'{A} tiles',answer:r*cc-d,text:`g3lC0 ${r}${cc}${d}`,explain:`<p>The floor needs ${r} × ${cc} = ${r*cc} tiles.</p><p>${r*cc} − ${d} = <b>${r*cc-d}</b></p>`,nudge:'<p>Step 1: how many tiles cover the whole floor?</p>',fast:30});}
  const l=R(4,9),w=R(2,7);return st({prompt:`Gizmo's rectangle is <b>${l}</b> cm long. Its perimeter is <b>${2*(l+w)}</b> cm. How wide is it?`,tpl:'{A} cm',answer:w,text:`g3lC1 ${l}${w}`,explain:`<p>The two long sides: ${l} + ${l} = ${2*l}.</p><p>${2*(l+w)} − ${2*l} = ${2*w} for the two short sides, so each is <b>${w}</b> cm.</p>`,nudge:'<p>Take away the two long sides. What is left is shared by the two short sides.</p>',fast:35});},
 legD:c=>{const NS={triangles:3,squares:4,pentagons:5,hexagons:6};const [A,B]=pickN(Object.keys(NS),2);const a=R(1,3),b=R(1,2);const one=n=>n===1?{triangles:'triangle',squares:'square',pentagons:'pentagon',hexagons:'hexagon'}:null;
  const nA=a===1?one(1)[A]:A,nB=b===1?one(1)[B]:B;const t=a*NS[A]+b*NS[B];
  return st({prompt:`Gizmo builds <b>${a}</b> ${nA} and <b>${b}</b> ${nB} with sticks, one stick for each side. How many sticks does he use?`,tpl:'{A} sticks',answer:t,text:`g3lD ${a}${A}${b}${B}`,explain:`<p>${a} × ${NS[A]} = ${a*NS[A]}. ${b} × ${NS[B]} = ${b*NS[B]}.</p><p>${a*NS[A]} + ${b*NS[B]} = <b>${t}</b></p>`,nudge:'<p>How many sides does each shape have?</p>',fast:30});}
};
PLAN.def('geo',3,[
 [g3.best,g3.sel({ps:[0,3]}),g3.rcount,g3.frac({vs:[0,1]}),g3.area({max:5}),g3.perim({vs:[0]}),g3.right({vs:[4,7]}),g2.share({vs:[0]})],
 [g3.best,g3.tf({}),g3.frac({vs:[1,2]}),g3.right({vs:[1,9]}),g3.sel({ps:[1]}),g3.area({max:6}),g3.rcount,g3.perim({vs:[0,1]})],
 [g3.tf({}),g3.sel({ps:[1,2]}),g3.frac({vs:[2,3]}),g3.perim({vs:[1,2]}),g3.right({vs:[2,6]}),g3.riddle,g3.best,g3.legD],
 [g3.tf({n:4}),g3.sel({ps:[1,2]}),g3.right({vs:[0,3,8]}),g3.frac({vs:[4,5]}),g3.riddle,g3.perim({vs:[1,2]}),g3.legA,g3.legC],
 [g3.legA,g3.legB,g3.legC,g3.legD,g3.right({vs:[5,10]}),g3.riddle,g3.tf({n:4}),g3.frac({vs:[4,5]})]]);

/* ---------- grade 4: points, lines, rays, angles, parallel/perpendicular, triangles by angles, symmetry ---------- */
const LN4={point:['point','one exact spot, shown by a dot'],segment:['line segment','two endpoints: it starts and stops'],ray:['ray','one endpoint, and it goes on forever in one direction'],line:['line','no endpoints: it goes on forever both ways (arrows on both ends)']};
const RW4=[['Skyla flies straight out from her nest and never stops.','ray'],["A laser shoots out of Gizmo's gadget and goes on forever.",'ray'],['Grumbleroot stretches a rope tight between two posts.','line segment'],
 ["Ozzy's straight train track goes on forever both ways.",'line'],['The Elder Wiz taps one tiny spot with his wand.','point'],['The edge of a pencil, from the tip to the eraser.','line segment']];
const PR4=[["The two rails of Ozzy's train track.",'parallel'],['The two edges that meet at the corner of a book.','perpendicular'],['The two lines in a plus sign +.','perpendicular'],['The top and bottom lines of the letter Z.','parallel'],
 ['The two up-and-down sides of the letter H.','parallel'],['The two lines in the letter V.','intersecting, not perpendicular'],['The two lines in the letter L.','perpendicular'],['The two lines in the letter T.','perpendicular']];
const PRW={parallel:'they go the same way and never meet',perpendicular:'they meet at a right angle',['intersecting, not perpendicular']:'they cross, but not at a right angle'};
const SYM=[[{k:'square'},4,'up-down, across, and 2 corner to corner'],[{k:'rect'},2,'up-down and across (corner-to-corner folds do not match)'],[{k:'rhombus'},2,'the 2 corner-to-corner lines'],[{k:'kite'},1,'one line down the middle, through the top and bottom corners'],
 [{k:'tri',ttype:'equi'},3,'one from each corner to the middle of the opposite side'],[{k:'tri',ttype:'iso'},1,'one line down the middle, between the two equal sides'],[{k:'tri',ttype:'scalene'},0,'no fold makes the halves match'],[{k:'para'},0,'no fold makes the halves match; the halves come out slanted the wrong way'],
 [{k:'pent'},5,'one from each corner to the middle of the opposite side'],[{k:'hex'},6,'3 corner to corner and 3 side to side'],[{k:'oct'},8,'4 corner to corner and 4 side to side']];
const LETS=[['A',1],['H',2],['M',1],['T',1],['E',1],['F',0],['L',0],['N',0],['X',2],['W',1],['Z',0],['S',0],['Y',1],['C',1],['G',0],['P',0]];
const P4=[['shapes with <b>at least one pair of parallel sides</b>',s=>['square','rect','rhombus','para','trap'].includes(s.k),'Parallel sides go the same way and never meet, like train tracks.',()=>sp(PK(['square','rect','rhombus','para','trap','kite','tri','kite','tri']))],
 ['shapes with <b>2 pairs of parallel sides</b>',s=>['square','rect','rhombus','para'].includes(s.k),'Check both pairs of opposite sides.',()=>sp(PK(['square','rect','rhombus','para','trap','kite','tri','trap']))],
 ['shapes with <b>at least one right angle</b>',s=>s.k==='square'||s.k==='rect'||(s.k==='tri'&&s.ttype==='right'),'A right angle is a square corner.',()=>{const k=PK(['square','rect','rhombus','para','kite','tri','tri','tri']);return sp(k,k==='tri'?{ttype:PK(['right','equi','obtuse']),ang:true}:{ang:true});}],
 ['shapes with <b>perpendicular sides</b>',s=>s.k==='square'||s.k==='rect'||(s.k==='tri'&&s.ttype==='right'),'Perpendicular sides meet in a square corner.',()=>{const k=PK(['square','rect','rhombus','para','tri','tri']);return sp(k,k==='tri'?{ttype:PK(['right','equi','obtuse']),ang:true}:{ang:true});}],
 ['shapes with <b>at least one line of symmetry</b>',s=>['square','rect','rhombus','kite'].includes(s.k)||(s.k==='tri'&&(s.ttype==='equi'||s.ttype==='iso')),'Could you fold it so the two halves match?',()=>{const k=PK(['square','rect','rhombus','kite','para','tri','tri','para']);return sp(k,k==='tri'?{ttype:PK(['equi','iso','scalene'])}:{});}]];
const TF4={1:[['A ray goes on forever in both directions.',false,'only one way; a line goes both ways'],['A line segment has two endpoints.',true,''],['A line has no endpoints.',true,''],['Parallel lines never meet.',true,''],
  ['Perpendicular lines meet at a right angle.',true,''],['A ray has exactly one endpoint.',true,''],['An acute angle is less than 90°.',true,''],['An obtuse angle is smaller than a right angle.',false,'it is bigger'],['A point has a length.',false,'it is just one spot']],
 2:[['A right angle measures 90°.',true,''],['A straight angle measures 180°.',true,''],['A triangle can have 2 right angles.',false,'the sides could never meet'],['A right triangle has one right angle.',true,''],
  ['An obtuse triangle has one obtuse angle.',true,''],['An acute triangle has a right angle.',false,'all its angles are acute'],['A square has 4 right angles.',true,''],['Two lines that cross always make right angles.',false,'only perpendicular lines do']],
 3:[['A square has 4 lines of symmetry.',true,''],['Every rectangle has 4 lines of symmetry.',false,'a long one has only 2'],['An equilateral triangle has 3 lines of symmetry.',true,''],['Every triangle has at least one line of symmetry.',false,'a scalene triangle has none'],
  ['A circle has more lines of symmetry than a square.',true,'every line through the middle works'],['A rectangle has 2 pairs of parallel sides.',true,''],['Every kite has 2 pairs of parallel sides.',false,'most kites have none'],['Every parallelogram has a line of symmetry.',false,'a slanted one has none']],
 4:[['A quarter turn is 90°.',true,''],['A half turn is 180°.',true,''],['Three quarter turns make 360°.',false,'they make 270°'],['An angle of 100° is acute.',false,'it is obtuse'],['Two 45° angles together make a right angle.',true,''],
  ['A 30° angle and a 50° angle together make an acute angle.',true,'80°'],['Perpendicular lines can also be parallel.',false,''],['Every rectangle has perpendicular sides.',true,''],['Two right angles together make a straight angle.',true,''],['A 60° angle is bigger than a right angle.',false,''],['A full turn is 360°.',true,'']],
 5:[['An angle of 120° and an angle of 60° together make a straight angle.',true,''],['A triangle can have one right angle and one obtuse angle.',false,''],['A rhombus that is not a square has exactly 2 lines of symmetry.',true,''],['A regular hexagon has 6 lines of symmetry.',true,''],
  [`A 1° angle is ${F(1,360)} of a full turn.`,true,''],['Two acute angles can never add up to more than 90°.',false,'60° + 60° = 120°'],['Every right triangle is also acute.',false,'it has a right angle'],['The minute hand turns 90° in 15 minutes.',true,''],['An equilateral triangle has 3 acute angles.',true,''],['A straight angle is the same as two quarter turns.',true,''],['Every rectangle has as many lines of symmetry as a square.',false,'a long rectangle has only 2']]};
const ANGX='<p>Acute: less than 90°. Right: exactly 90°. Obtuse: between 90° and 180°. Straight: 180°.</p>';
const g4={
 lines:c=>{if(Math.random()<.6){const k=PK(Object.keys(LN4));const [nm,why]=LN4[k];return choice(ok({vis:{t:'lines',k},prompt:'Gizmo drew this with his laser pen. What is it called?',tpl:'{A}',text:`g4l ${k}`,explain:`<p>It has ${why}.</p><p>It is ${ABn(nm)}.</p>`,nudge:'<p>Look at the ends. A dot stops it; an arrow means it keeps going.</p>',fast:10}),nm,['point','line segment','ray','line']);}
  const [s,a]=PK(RW4);return choice(ok({prompt:`${s} Which is it most like?`,tpl:'{A}',text:`g4lw ${s}`,explain:`<p>${cap(AN(a))} has ${LN4[{point:'point','line segment':'segment',ray:'ray',line:'line'}[a]][1]}.</p><p>So it is like ${ABn(a)}.</p>`,nudge:'<p>Does it have a start? Does it have an end?</p>',fast:15}),a,['point','line segment','ray','line']);},
 pairs:c=>{const opts=['parallel','perpendicular','intersecting, not perpendicular'];if(Math.random()<.5){const k=PK(['parallel','perpendicular','intersecting']);const a=k==='intersecting'?opts[2]:k;
   return choice(ok({vis:{t:'lines',k},prompt:'Ozzy laid down these two train tracks. Which word fits them best?',tpl:'{A}',text:`g4p ${k}`,explain:`<p>These lines are <b>${a}</b>: ${PRW[a]}.</p>`,nudge:'<p>Do they meet? If they do, is it a square corner?</p>',fast:10}),a,opts);}
  const [s,a]=PK(PR4);return choice(ok({prompt:`${s} Which word fits best?`,tpl:'{A}',text:`g4pw ${s}`,explain:`<p>They are <b>${a}</b>: ${PRW[a]}.</p>`,nudge:'<p>Picture it. Do the lines meet? At a square corner?</p>',fast:15}),a,opts);},
 atype:o=>c=>{const kind=PK(o.straight?['acute','right','obtuse','straight','acute','obtuse']:['acute','right','obtuse','acute','obtuse']);const deg=kind==='acute'?10*R(2,8):kind==='right'?90:kind==='obtuse'?10*R(10,17):180;
  if(o.num&&Math.random()<.5){const d=kind==='acute'?R(11,88):kind==='obtuse'?R(92,178):deg;return choice(ok({prompt:`The Elder Wiz opens his spell book to make an angle of <b>${d}°</b>. What kind of angle is it?`,tpl:'{A}',text:`g4an ${d}`,explain:ANGX+`<p>${d}° is <b>${kind}</b>.</p>`,nudge:'<p>Compare it with 90° and 180°.</p>',fast:10}),kind,['acute','right','obtuse','straight']);}
  const s=PK(["Gizmo opened his robot's arm to this angle.",'Skyla spreads her wings to this angle.','The Elder Wiz holds his wand at this angle.']);
  return choice(ok({vis:{t:'lines',k:'angle',deg},prompt:`${s} What kind of angle is it?`,tpl:'{A}',text:`g4a ${deg} ${s}`,explain:ANGX+`<p>This angle is ${deg}°, so it is <b>${kind}</b>.</p>`,nudge:'<p>Compare it with a square corner.</p>',fast:10}),kind,['acute','right','obtuse','straight']);},
 prot:c=>{const a=dk('g4prot',[35,125,65,145,25,115,55,155,75,105,45,135,85,95]);return ok({vis:{t:'prot',a},prompt:`Dr. Quartz measures the angle of a crystal. How many degrees is it?`,tpl:'{A}°',answer:a,text:`g4pr ${a}`,explain:`<p>The angle is ${a<90?'smaller':a>90?'bigger':'the same as'} a right angle, so use the scale that makes sense: <b>${a}°</b>${a!==90?`, not ${180-a}°`:''}.</p>`,nudge:'<p>Start at the 0 where the angle starts. Is it smaller or bigger than 90°?</p>',fast:15});},
 add:o=>c=>{const v=PK(o.vs||[0,1,2]);
  if(v===0){const a=10*R(1,8);return ok({prompt:`A right angle is split into two angles. One is <b>${a}°</b>. How big is the other?`,tpl:'{A}°',answer:90-a,text:`g4ad0 ${a}`,explain:`<p>A right angle is 90°.</p><p>90 − ${a} = <b>${90-a}</b>°</p>`,nudge:'<p>The two parts add up to 90°.</p>'});}
  if(v===1){const a=10*R(2,16);return ok({prompt:`A straight angle is split into two angles. One is <b>${a}°</b>. How big is the other?`,tpl:'{A}°',answer:180-a,text:`g4ad1 ${a}`,explain:`<p>A straight angle is 180°.</p><p>180 − ${a} = <b>${180-a}</b>°</p>`,nudge:'<p>The two parts add up to 180°.</p>'});}
  if(v===2){const a=10*R(2,9),b=10*R(2,9);return ok({prompt:`Gizmo puts an angle of <b>${a}°</b> next to an angle of <b>${b}°</b> with no gap. How big is the whole angle?`,tpl:'{A}°',answer:a+b,text:`g4ad2 ${a} ${b}`,explain:`<p>Angles next to each other add.</p><p>${a} + ${b} = <b>${a+b}</b>°</p>`,nudge:'<p>Put the two parts together.</p>'});}
  if(v===3){let a,b;do{a=10*R(1,6);b=10*R(1,6);}while(a+b>80);return ok({prompt:`A right angle is split into <b>three</b> angles. Two of them are <b>${a}°</b> and <b>${b}°</b>. How big is the third?`,tpl:'{A}°',answer:90-a-b,text:`g4ad3 ${a} ${b}`,explain:`<p>${a} + ${b} = ${a+b}.</p><p>90 − ${a+b} = <b>${90-a-b}</b>°</p>`,nudge:'<p>All three parts add up to 90°.</p>',fast:20});}
  const [whole,n]=dk('g4eq',[[180,3],[180,6],[90,3],[360,8],[180,4],[360,6],[90,6]]);return ok({prompt:`How big is each angle? The Elder Wiz splits a ${whole===90?'right':whole===360?'full-turn':'straight'} angle into <b>${n}</b> equal angles. `,tpl:'{A}°',answer:whole/n,text:`g4ad4 ${whole} ${n}`,explain:`<p>A ${whole===90?'right':whole===360?'full-turn':'straight'} angle is ${whole}°.</p><p>${whole} ÷ ${n} = <b>${whole/n}</b>°</p>`,nudge:'<p>Share the whole angle equally.</p>',fast:20});},
 turn:o=>c=>{const v=PK(o.vs||[0,1]);
  if(v===0){const [p,d]=dk('g4turn',[['a quarter turn',90],['a half turn',180],['three quarter turns',270],['a full turn',360],['two quarter turns',180],['two full turns',720],['one and a half turns',540]]);const w=who(PK(['flex','skyla','gizmo','ozzy']));
   return ok({prompt:`${w.N} spins <b>${p}</b>. How many degrees does ${w.he} turn?`,tpl:'{A}°',answer:d,text:`g4t0 ${p} ${w.n}`,explain:`<p>A full turn is 360°. A quarter turn is 90°.</p><p>${cap(p)} = <b>${d}</b>°</p>`,nudge:'<p>A full turn is 360°.</p>',fast:10});}
  if(v===1){const k=dk('g4mh',[1,2,3,4,6,9,8,5]);return ok({prompt:`The minute hand moves from the 12 to the <b>${k}</b>. How many degrees does it turn?`,tpl:'{A}°',answer:30*k,text:`g4t1 ${k}`,explain:`<p>The 12 numbers share 360°, so each step is 30°.</p><p>${k} × 30 = <b>${30*k}</b>°</p>`,nudge:'<p>From the 12 to the 3 is a quarter turn.</p>'});}
  const m=dk('g4mm',[15,30,45,20,10,40,25,50]);return ok({prompt:`How many degrees does the minute hand turn in <b>${m}</b> minutes?`,tpl:'{A}°',answer:6*m,text:`g4t2 ${m}`,explain:`<p>60 minutes is a full turn, 360°. Every 5 minutes is 30°.</p><p>${m} minutes = ${m/5} × 30 = <b>${6*m}</b>°</p>`,nudge:'<p>15 minutes is a quarter turn.</p>',fast:20});},
 tri:o=>c=>{const kind=PK(['right','obtuse','acute']);const nm=kind+' triangle';
  if(o.num&&Math.random()<.6){const a=PK({right:[[90,30,60],[90,45,45],[90,20,70],[90,50,40]],acute:[[60,60,60],[50,60,70],[40,70,70],[80,50,50]],obtuse:[[120,30,30],[100,40,40],[110,30,40],[130,20,30]]}[kind]);const s=SH(a);
   return choice(ok({prompt:`Skyla's kite is a triangle with angles of <b>${s[0]}°</b>, <b>${s[1]}°</b> and <b>${s[2]}°</b>. What kind of triangle is it?`,tpl:'{A}',text:`g4tr ${s}`,explain:`<p>A triangle is named by its biggest angle. The biggest is ${Math.max(...a)}°, which is ${kind==='right'?'a right angle':kind==='obtuse'?'obtuse':'acute, so all 3 are acute'}.</p><p>It is ${ABn(nm)}.</p>`,nudge:'<p>Look at the biggest angle.</p>',fast:15}),nm,['right triangle','acute triangle','obtuse triangle']);}
  return choice(ok({vis:S1('tri',{ttype:kind==='acute'?'equi':kind,ang:true}),prompt:'Name this triangle by its biggest angle.',tpl:'{A}',text:`g4tv ${kind}`,explain:`<p>${kind==='right'?'It has a right angle (the little square).':kind==='obtuse'?'One angle is wider than a right angle.':'All three angles are smaller than a right angle.'}</p><p>It is ${ABn(nm)}.</p>`,nudge:'<p>Find the biggest angle. Is it 90°, more or less?</p>',fast:10}),nm,['right triangle','acute triangle','obtuse triangle']);},
 sym:o=>c=>{if(o.letters&&Math.random()<.4){const [L,n]=dk('g4let',LETS);return ok({prompt:`The Grey Goblin stole the letter <span style="font-size:2.2em;font-family:Arial,Helvetica,sans-serif;font-weight:bold">${L}</span> from a sign. How many lines of symmetry does it have?`,tpl:'{A} lines',answer:n,text:`g4sl ${L}`,explain:`<p>A line of symmetry is a fold where both halves match.</p><p>The letter ${L} has <b>${n}</b>.</p>`,nudge:'<p>Try folding it up-down, then across.</p>'});}
  const [s,n,why]=dk('g4sym'+!!o.hard,o.hard?SYM.slice(4).concat(SYM.slice(0,2)):SYM.slice(0,8));return ok({vis:Object.assign({t:'shape'},s),prompt:`How many lines of symmetry does this ${s.k==='tri'?'triangle':SHN[s.k]} have?`,tpl:'{A} lines',answer:n,text:`g4s ${s.k}${s.ttype||''}`,explain:`<p>Fold lines where both halves match: ${why}.</p><p>That makes <b>${n}</b>.</p>`,nudge:'<p>Try every fold: up-down, across and corner to corner.</p>',fast:15});},
 symYN:c=>{const [s]=PK(SYM.filter(x=>x[1]>0));const good=Math.random()<.5;
  return choice(ok({vis:Object.assign({t:'shape',sym:good?true:'wrong'},s),prompt:'Gizmo drew a dashed line. Is it a line of symmetry?',tpl:'{A}',text:`g4sy ${s.k}${s.ttype||''} ${good}`,explain:good?'<p>Fold along the dashed line: both halves match exactly. <b>Yes</b>.</p>':'<p>Fold along the dashed line: the halves do not match. <b>No</b>.</p>',nudge:'<p>Imagine folding the paper on the dashed line.</p>',fast:10}),good?'Yes':'No',['Yes','No']);},
 ppar:c=>{const [k,n]=dk('g4pp',[['square',2],['rect',2],['para',2],['rhombus',2],['kite',0]]);return ok({vis:S1(k),prompt:`How many pairs of <b>parallel</b> sides does this ${SHN[k]} have?`,tpl:'{A} pairs',answer:n,text:`g4pp ${k}`,explain:`<p>Parallel sides go the same way and never meet.</p><p>${cap(AN(SHN[k]))} has <b>${n}</b> ${n===1?'pair':'pairs'}.</p>`,nudge:'<p>Check each pair of opposite sides.</p>',fast:10});},
 sel:o=>c=>{const pr=PK(o.ps?o.ps.map(i=>P4[i]):P4);let list;for(let g=0;g<400;g++){list=[pr[3](),pr[3](),pr[3](),pr[3]()];const k=list.filter(pr[1]).length;if(k>=1&&k<4&&new Set(list.map(s=>s.k+(s.ttype||''))).size>=3)break;}
  return MU({vis:ROW(list),prompt:`Dr. Quartz is sorting crystal shapes. Select ALL the ${pr[0]}.`,multi:LET.slice(0,4),ans:ansOf(list,pr[1]),text:`g4sel ${pr[0]} ${list.map(s=>s.k+(s.ttype||'')).join()}`,explain:selEx(list,pr[1],nmOf),nudge:`<p>${pr[2]}</p>`});},
 tf:o=>c=>{const [k,P]=forRound(TF4,c.round);return tfQ(PK(['Gizmo made a quiz for his robot. Is each sentence true or false?','Skyla wrote facts about angles and lines. Is each one true or false?']),dkRows('g4tf'+k,P,o.n||3));},
 /* naming lines, rays and segments with points */
 named:o=>c=>{const v=dk('g4nm'+!!o.hard,o.hard?[2,3,4]:[0,1,2]);const [A,B,C]=pickN(['A','B','C','P','Q','M','N','X','Y'],3);
  if(v===0)return choice(ok({prompt:`A ray starts at point <b>${A}</b> and goes on forever through point <b>${B}</b>. What is its name?`,tpl:'{A}',text:`g4nm0 ${A}${B}`,explain:`<p>A ray is named starting with its endpoint: <b>ray ${A}${B}</b>.</p>`,nudge:'<p>Which point does the ray start at? That letter comes first.</p>',fast:15}),`ray ${A}${B}`,[`ray ${B}${A}`,`line ${A}${B}`,`segment ${A}${B}`]);
  if(v===1){const [k,n]=dk('g4nm1',[['line segment',2],['ray',1],['line',0]]);return ok({prompt:`How many endpoints does a <b>${k}</b> have?`,tpl:'{A} endpoints',answer:n,text:`g4nm1 ${k}`,explain:`<p>A segment stops at both ends (2), a ray stops at one end (1), a line never stops (0).</p><p>${cap(AN(k))} has <b>${n}</b>.</p>`,nudge:'<p>An endpoint is where it stops.</p>',fast:10});}
  if(v===2)return choice(ok({prompt:`Gizmo draws segment <b>${A}${B}</b> and segment <b>${B}${C}</b>. They meet at point ${B} in a square corner. What do they make at ${B}?`,tpl:'{A}',text:`g4nm2 ${A}${B}${C}`,explain:'<p>A square corner is a <b>right angle</b>, so the segments are perpendicular.</p>',nudge:'<p>What is a square corner called?</p>',fast:15}),'a right angle',['an acute angle','an obtuse angle','parallel lines']);
  if(v===3)return ok({prompt:`Points <b>${A}</b>, <b>${B}</b> and <b>${C}</b> are on one straight line, with ${B} in the middle. How many different line segments can you name using two of these points?`,tpl:'{A} segments',answer:3,text:`g4nm3 ${A}${B}${C}`,explain:`<p>${A}${B}, ${B}${C} and ${A}${C}: <b>3</b> segments.</p>`,nudge:'<p>List every pair of points.</p>',fast:25});
  return choice(ok({prompt:`Ray <b>${A}${B}</b> and ray <b>${A}${C}</b> make an angle. Which point is the vertex (the corner)?`,tpl:'point {A}',text:`g4nm4 ${A}${B}${C}`,explain:`<p>Both rays start at ${A}, so the vertex is <b>${A}</b>.</p>`,nudge:'<p>Where do both rays start?</p>',fast:15}),A,[B,C]);},
 /* angles inside figures (no marks drawn) */
 inside:o=>c=>{const [s,kind,n,why]=dk('g4in'+!!o.hard,(o.hard?[[{k:'hex'},'obtuse',6,'every corner of a regular hexagon is 120°'],[{k:'pent'},'obtuse',5,'every corner of a regular pentagon is 108°'],[{k:'rhombus'},'obtuse',2,'two wide corners and two narrow ones'],[{k:'para'},'acute',2,'two narrow corners and two wide ones'],[{k:'tri',ttype:'right'},'acute',2,'besides the right angle, the other two are smaller']]:[])
   .concat([[{k:'rect'},'right',4,'every corner is a square corner'],[{k:'tri',ttype:'right'},'right',1,'one square corner'],[{k:'tri',ttype:'obtuse'},'obtuse',1,'one wide corner'],[{k:'tri',ttype:'equi'},'acute',3,'all 60°'],[{k:'tri',ttype:'obtuse'},'acute',2,'the two corners next to the wide one'],[{k:'square'},'acute',0,'every corner is a right angle']]));
  return ok({vis:Object.assign({t:'shape'},s),prompt:`How many <b>${kind}</b> angles are inside this ${s.k==='tri'?'triangle':SHN[s.k]}?`,tpl:`{A} ${kind} angles`,answer:n,text:`g4in ${s.k}${s.ttype||''} ${kind}`,explain:`<p>${cap(why)}.</p><p>There ${n===1?'is':'are'} <b>${n}</b>.</p>`,nudge:'<p>Compare each corner with a square corner.</p>',fast:15});},
 right:o=>c=>{const vs=o.vs||[0,1,2,3,4,5,6];const v=dk('g4ir'+vs.join(''),vs);const w=who();
  if(v===0)return isRight(w,'A triangle can have two right angles.','No, with two right angles the sides would never meet',['No, a triangle can have three right angles','No, a triangle has no angles'],'<p>Two right angles would make two sides go the same way (parallel), so they could never meet to close the triangle.</p>');
  if(v===1){const a=10*R(2,7);return isRight(w,`This angle is ${180-a}°.`,`No, it is acute, so it is ${a}°`,[`No, it is ${a+10}°`,'No, it is 90°'],`<p>The angle is smaller than a right angle, so it must be <b>${a}°</b>. ${w.He} read the wrong scale.</p>`,{vis:{t:'prot',a}});}
  if(v===2)return isRight(w,'A square has 2 lines of symmetry.','No, it has 4: up-down, across, and 2 corner to corner',['No, it has 1','No, it has 8'],'<p>A square folds 4 ways: up-down, across, and both corner-to-corner lines.</p>');
  if(v===3)return isRight(w,'Every square is a rectangle, because it has 4 right angles.',true,['No, a square has no right angles','No, a rectangle has 2 pairs of equal sides, so it can\'t be a square'],`<p>A rectangle needs 4 right angles. A square has them. ${w.He} is right!</p>`);
  if(v===4)return isRight(w,'This rectangle has 4 lines of symmetry, because it has 4 sides.','No, it has only 2: the corner-to-corner folds do not match',['No, it has 0','No, it has 1'],'<p>Fold a rectangle corner to corner: the halves do not line up. Only up-down and across work: <b>2</b> lines.</p>',{vis:S1('rect')});
  if(v===5)return isRight(w,'Perpendicular lines are parallel too.','No, perpendicular lines cross; parallel lines never meet',['No, perpendicular lines never meet','No, parallel lines cross at a right angle'],'<p>Perpendicular lines meet at a right angle. Parallel lines never meet. They can\'t be both.</p>');
  return isRight(w,'An angle of 120° is obtuse.',true,['No, it is acute','No, it is a right angle','No, it is straight'],`<p>120° is between 90° and 180°, so it is obtuse. ${w.He} is right!</p>`);},
 /* Legend */
 prot2:c=>{const a=dk('g4p2',[35,65,25,55,75,45,115,125,145,105]);const b=5*R(3,9);const more=a<90||Math.random()<.5;const t=more?a+b:a-b;return st({vis:{t:'prot',a},prompt:`Dr. Quartz measures one corner of a crystal on the protractor. The next corner is <b>${b}°</b> ${more?'bigger':'smaller'}. How big is the next corner?`,tpl:'{A}°',answer:t,text:`g4pr2 ${a} ${b} ${more}`,explain:`<p>The protractor shows ${a}°${a<90?' (it is acute)':' (it is obtuse)'}.</p><p>${a} ${more?'+':'−'} ${b} = <b>${t}</b>°</p>`,nudge:'<p>Step 1: read the protractor (acute or obtuse?). Step 2: add or subtract.</p>',fast:35});},
 eq2:c=>{const [whole,n,k]=dk('g4eq2',[[180,6,2],[180,4,3],[90,3,2],[360,8,3],[180,3,2],[360,6,4],[360,12,5]]);const e=whole/n;return st({prompt:`The Elder Wiz splits a ${whole===90?'right':whole===360?'full-turn':'straight'} angle into <b>${n}</b> equal angles. Then he joins <b>${k}</b> of them together. How big is the joined angle?`,tpl:'{A}°',answer:e*k,text:`g4eq2 ${whole} ${n} ${k}`,explain:`<p>Each part: ${whole} ÷ ${n} = ${e}°.</p><p>${k} parts: ${k} × ${e} = <b>${e*k}</b>°</p>`,nudge:'<p>Step 1: find one part. Step 2: join the parts.</p>',fast:35});},
 legTurn:c=>{const v=R(0,2);
  if(v===0){const TU=[['a quarter turn',90],['a half turn',180],['three quarter turns',270],['a full turn',360]];const [p1,a]=PK(TU),[p2,b]=PK(TU.slice(0,3));const w=who(PK(['flex','skyla','ozzy']));const back=Math.random()<.35&&a>b;const t=back?a-b:a+b;
   return st({prompt:`${w.N} shows off: ${w.he} spins <b>${p1}</b>, then ${back?'spins back':'keeps going'} <b>${p2}</b>. How many degrees ${back?'is '+w.he+' turned from the start':'does '+w.he+' spin in all'}?`,tpl:'{A}°',answer:t,text:`g4L0 ${p1} ${p2} ${back} ${w.n}`,explain:`<p>${cap(p1)} = ${a}°. ${cap(p2)} = ${b}°.</p><p>${a} ${back?'−':'+'} ${b} = <b>${t}</b>°</p>`,nudge:'<p>A quarter turn is 90°. A full turn is 360°.</p>',fast:30});}
  if(v===1){let a,b;do{a=10*R(3,9);b=10*R(3,9);}while(a+b>=180);return st({prompt:`Gizmo's robot turns <b>${a}°</b>, then <b>${b}°</b> more. How many more degrees must it turn to finish a half turn?`,tpl:'{A}°',answer:180-a-b,text:`g4L1 ${a} ${b}`,explain:`<p>So far: ${a} + ${b} = ${a+b}°. A half turn is 180°.</p><p>180 − ${a+b} = <b>${180-a-b}</b>°</p>`,nudge:'<p>Step 1: add the two turns. Step 2: how far to 180°?</p>',fast:30});}
  const [h1,m]=PK([[3,20],[5,15],[8,40],[1,30],[2,45],[7,10]]);return st({prompt:`Ozzy's train leaves at <b>${h1}:00</b> and arrives at <b>${h1}:${P2(m)}</b>. How many degrees does the minute hand turn during the ride?`,tpl:'{A}°',answer:6*m,text:`g4L2 ${h1} ${m}`,explain:`<p>${m} minutes. Every 5 minutes is 30°.</p><p>${m/5} × 30 = <b>${6*m}</b>°</p>`,nudge:'<p>How many minutes long is the ride? 15 minutes is 90°.</p>',fast:30});},
 legSlice:c=>{if(Math.random()<.6){const n=PK([3,4,6,8,12]);return st({prompt:`Ms. Rosa cuts a round pizza into <b>${n}</b> equal slices, all from the middle. How many degrees is the angle at the tip of each slice?`,tpl:'{A}°',answer:360/n,text:`g4L3 ${n}`,explain:`<p>All the slices meet in the middle and make a full turn: 360°.</p><p>360 ÷ ${n} = <b>${360/n}</b>°</p>`,nudge:'<p>All the tips together make a full turn.</p>'});}
  const n=PK([2,3]);const e=90/n;return st({prompt:`The Elder Wiz splits a straight angle into a right angle and <b>${n}</b> equal smaller angles. How big is each smaller angle?`,tpl:'{A}°',answer:e,text:`g4L4 ${n}`,explain:`<p>Straight angle 180° − right angle 90° = 90° left.</p><p>90 ÷ ${n} = <b>${e}</b>°</p>`,nudge:'<p>Step 1: take the right angle away from 180°. Step 2: share what is left.</p>',fast:35});},
 legCount:c=>{if(Math.random()<.5){const SY={square:4,'long rectangle':2,'equilateral triangle':3,'regular hexagon':6,kite:1};const [a,b]=pickN(Object.keys(SY),2);const n=R(1,2);const t=n*SY[a]+SY[b];
   return st({prompt:`Dr. Quartz has <b>${n}</b> ${n===1?a:a==='rhombus'?'rhombuses':a+'s'} and <b>1</b> ${b}, all made of crystal. He folds each one along every line of symmetry. How many lines of symmetry is that in all?`,tpl:'{A} lines',answer:t,text:`g4L5 ${n}${a}${b}`,explain:`<p>${cap(AN(a))} has ${SY[a]}${n>1?`, so ${n} of them have ${n*SY[a]}`:''}. ${cap(AN(b))} has ${SY[b]}.</p><p>${n*SY[a]} + ${SY[b]} = <b>${t}</b></p>`,nudge:'<p>How many lines of symmetry does each shape have?</p>',fast:35});}
  const r=R(2,4),t=R(2,5);return st({prompt:`Grumbleroot builds <b>${r}</b> rectangle windows and <b>${t}</b> right-triangle windows for his bridge house. He paints a dot in every right angle. How many dots does he paint?`,tpl:'{A} dots',answer:4*r+t,text:`g4L6 ${r}${t}`,explain:`<p>Each rectangle has 4 right angles: ${r} × 4 = ${4*r}. Each right triangle has 1: ${t}.</p><p>${4*r} + ${t} = <b>${4*r+t}</b></p>`,nudge:'<p>How many right angles does each shape have?</p>',fast:35});},
 legAng:c=>{let a,b;do{a=10*R(1,5);b=10*R(1,5);}while(a+b>=90);const e=5*R(3,15);if(dk('g4l7',[0,1])===0)return st({prompt:`Skyla opens her wings into a straight line. A right angle takes up part of it, and one more angle is <b>${e}°</b>. The rest is the last angle. How big is the last angle?`,tpl:'{A}°',answer:90-e,text:`g4L7 ${e}`,explain:`<p>Straight angle: 180°. 180 − 90 − ${e} = <b>${90-e}</b>°</p>`,nudge:'<p>All the parts add up to 180°.</p>',fast:30});
  const x=10*R(3,8),y=10*R(2,(170-x)/10);return st({prompt:`On a straight line, Gizmo draws two rays from one point. That makes three angles. Two of them are <b>${x}°</b> and <b>${y}°</b>. How big is the third?`,tpl:'{A}°',answer:180-x-y,text:`g4L8 ${x} ${y}`,explain:`<p>The three angles fill a straight angle: 180°.</p><p>180 − ${x} − ${y} = <b>${180-x-y}</b>°</p>`,nudge:'<p>The three angles together make a straight line.</p>',fast:30});}
};
PLAN.def('geo',4,[
 [g4.lines,g4.pairs,g4.atype({}),g4.named({}),g4.symYN,g4.tf({}),g4.sel({ps:[0,2]}),g4.tri({})],
 [g4.atype({straight:1}),g4.prot,g4.tri({num:1}),g4.sym({}),g4.inside({}),g4.sel({ps:[1]}),g4.tf({}),g4.ppar,g4.named({}),g4.pairs],
 [g4.add({vs:[1,2]}),g4.turn({vs:[0]}),g4.sym({letters:1}),g4.prot,g4.tf({}),g4.named({hard:1}),g4.atype({num:1,straight:1}),g4.ppar],
 [g4.add({vs:[3,4]}),g4.turn({vs:[1,2]}),g4.sym({hard:1}),g4.sel({ps:[3,4]}),g4.tf({n:4}),g4.right({vs:[0,1,2,3]}),g4.inside({hard:1}),g4.tri({num:1})],
 [g4.legTurn,g4.legSlice,g4.legCount,g4.legAng,g4.right({vs:[4,5,6]}),g4.tf({n:4}),g4.eq2,g4.prot2]]);

/* ---------- grade 5: shape families, triangles by sides and angles, the coordinate plane ---------- */
const TF5={1:[['Every square is a rectangle.',true,'4 right angles'],['Every rectangle is a square.',false,'its sides need not be equal'],['Every square is a rhombus.',true,'4 equal sides'],['Every rhombus is a square.',false,'a rhombus need not have right angles'],
  ['Some parallelograms are rectangles.',true,''],['Every parallelogram is a rectangle.',false,'it may have no right angles'],['Every rectangle is a parallelogram.',true,''],['Every quadrilateral is a parallelogram.',false,'a kite is not']],
 3:[['Some rectangles are squares.',true,''],['Every rhombus is a parallelogram.',true,''],['No rhombus is a rectangle.',false,'a square is both'],['Some rhombuses are rectangles.',true,'the squares'],['Every kite is a parallelogram.',false,''],
  ['Every equilateral triangle is acute.',true,'all angles are 60°'],['A right triangle can also be isosceles.',true,''],['A triangle can have two obtuse angles.',false,''],['A scalene triangle has two equal sides.',false,'all sides are different'],
  ['An obtuse triangle can be isosceles.',true,'like 30°, 30°, 120°'],['Every square is a parallelogram.',true,''],['Some quadrilaterals have no parallel sides.',true,'a kite'],['Some parallelograms are rhombuses.',true,''],['Every parallelogram has 4 equal sides.',false,'']]};
const FM5=[['true for EVERY <b>square</b>',['quadrilateral','parallelogram','rectangle','rhombus','triangle'],[0,1,2,3]],['true for EVERY <b>rectangle</b>',['quadrilateral','parallelogram','rhombus','square','pentagon'],[0,1]],
 ['true for EVERY <b>rhombus</b>',['quadrilateral','parallelogram','rectangle','square','triangle'],[0,1]],['true for EVERY <b>parallelogram</b>',['quadrilateral','rectangle','rhombus','square'],[0]]];
const FM5b=[['shapes that are ALWAYS <b>parallelograms</b>',['square','rectangle','rhombus','kite','pentagon'],[0,1,2]],['shapes that ALWAYS have <b>4 right angles</b>',['square','rectangle','rhombus','parallelogram','trapezoid'],[0,1]],
 ['shapes that ALWAYS have <b>4 equal sides</b>',['square','rhombus','rectangle','parallelogram','kite'],[0,1]]];
const TB5=[['It has a right angle, and two of its sides are the same length.','right isosceles'],['It has an angle of 120°, and all three sides are different lengths.','obtuse scalene'],['All three sides are the same length.','acute equilateral'],
 ['It has a right angle, and its sides are 3 cm, 4 cm and 5 cm.','right scalene'],['Its angles are 70°, 70° and 40°, and two sides are the same length.','acute isosceles'],['Its angles are 30°, 30° and 120°, and two sides are the same length.','obtuse isosceles']];
const TBA=['right isosceles','right scalene','obtuse isosceles','obtuse scalene','acute equilateral','acute isosceles','acute scalene'];
const RID5=[['I am a parallelogram with 4 right angles and 4 equal sides.','square',['rhombus','rectangle','trapezoid']],['I am a parallelogram with 4 equal sides, but no right angles.','rhombus',['square','rectangle','kite']],
 ['I am a quadrilateral with two pairs of equal sides that sit next to each other, but my 4 sides are not all equal.','kite',['rhombus','rectangle','parallelogram']],['I am a parallelogram with 4 right angles, but my sides are not all equal.','rectangle',['square','rhombus','trapezoid']]];
const pt=(x,y)=>`(${x}, ${y})`;
function gpts(n,lo,hi){const out=[];let g=0;while(out.length<n&&g++<500){const x=R(lo,hi),y=R(lo,hi);if(!out.some(p=>p[0]===x&&p[1]===y))out.push([x,y]);}return out;}
const g5={
 tside:c=>{const tt=PK(['equi','iso','scalene']);let s;if(tt==='equi'){const a=R(3,9);s=[a,a,a];}else if(tt==='iso'){const a=R(4,9);let b;do{b=R(2,9);}while(b===a||b>=2*a);s=SH([a,a,b]);}else{do{s=[R(3,9),R(3,9),R(3,9)];}while(new Set(s).size<3||Math.max(...s)*2>=sum(s));}
  const nm={equi:'equilateral',iso:'isosceles',scalene:'scalene'}[tt];const why={equi:'all 3 sides are the same length',iso:'exactly 2 sides are the same length',scalene:'all 3 sides are different lengths'}[tt];
  return choice(ok({vis:S1('tri',{ttype:tt}),prompt:`Gizmo builds a triangle with sides of <b>${s[0]} cm</b>, <b>${s[1]} cm</b> and <b>${s[2]} cm</b>. What kind of triangle is it?`,tpl:'{A}',text:`g5ts ${s}`,explain:`<p>${cap(why)}.</p><p>It is ${ABn(nm)} triangle.</p>`,nudge:'<p>How many sides are the same length?</p>',fast:12}),nm,['equilateral','isosceles','scalene']);},
 tboth:c=>{const [t,a]=dk('g5tb',TB5);const wr=TBA.filter(x=>x!==a&&!(a==='acute equilateral'&&x==='acute isosceles'));return choice(st({prompt:`Skyla found a triangle-shaped feather. ${t} What is the best name for it?`,tpl:'{A}',text:`g5tb ${t}`,explain:`<p>By its angles: ${a.split(' ')[0]}. By its sides: ${a.split(' ')[1]}.</p><p>It is a <b>${a}</b> triangle.</p>`,nudge:'<p>Name it twice: once by its biggest angle, once by its sides.</p>',fast:25}),a,pickN(wr,3));},
 tf:o=>c=>{const [k,P]=forRound(TF5,c.round);return tfQ(PK(['Dr. Quartz made a shape-family quiz. Is each sentence true or false?','The Kind Teacher posted these on the board. Is each one true or false?']),dkRows('g5tf'+k,P,o.n||3),'Think of every shape in the family. If one shape breaks it, “every” is false. “Some” only needs one shape.');},
 fam:o=>c=>{const [q,labs,right]=dk('g5fam'+!!o.b+!!o.both,o.b?FM5b:o.both?FM5.concat(FM5b):FM5);const L=SH(labs);const ans=L.map((x,i)=>right.map(j=>labs[j]).includes(x)?i:-1).filter(i=>i>=0);const verb=/^true/.test(q)?`the names that are ${q}`:`the ${q}`;
  return MU({prompt:`Select ALL ${verb}.`,multi:L,ans,text:`g5fam ${q} ${L.join()}`,explain:`<p>${L.map(x=>`${x}${right.map(j=>labs[j]).includes(x)?' ✓':''}`).join('<br>')}</p><p>Answer: <b>${ans.map(i=>L[i]).join(', ')}</b>.</p>`,nudge:'<p>Check each name. It must work for every one of them, every time.</p>',fast:30});},
 cread:o=>c=>{const P=gpts(3,1,9);if(P[0][0]===P[0][1])P[0][1]=P[0][0]===9?8:P[0][0]+1;const L=['A','B','C'];const vis={t:'grid',max:10,pts:P.map((p,i)=>[p[0],p[1],L[i]])};const [x,y]=P[0];
  if(o.pick||Math.random()<.4)return choice(ok({vis,prompt:`Which ordered pair names point <b>A</b> on the grid?`,tpl:'{A}',text:`g5cr ${JSON.stringify(P)}`,explain:`<p>From 0, go right ${x} (that is x), then up ${y} (that is y).</p><p>A is at <b>${pt(x,y)}</b>.</p>`,nudge:'<p>Across first, then up.</p>',fast:10}),pt(x,y),[pt(y,x),pt(x,y===10?9:y+1),pt(x===0?1:x-1,y)]);
  const ay=Math.random()<.5;return ok({vis,prompt:`What are the coordinates of point <b>A</b>?`,tpl:ay?`(${x}, {A})`:`({A}, ${y})`,answer:ay?y:x,text:`g5cr2 ${JSON.stringify(P)} ${ay}`,explain:`<p>A is ${x} across and ${y} up: ${pt(x,y)}.</p><p>So the missing number is <b>${ay?y:x}</b>.</p>`,nudge:'<p>The first number is how far across, the second is how far up.</p>',fast:10});},
 plotPt:c=>{let x=R(0,10),y=R(0,10);if(x===y)y=(y+R(2,6))%11;const [s,q]=PK([[`Dr. Quartz buried a crystal at <b>${pt(x,y)}</b>.`,'Tap where it is.'],[`Plot the point <b>${pt(x,y)}</b>.`,'Tap it on the grid.'],[`Skyla's nest is at <b>${pt(x,y)}</b>.`,'Tap the nest.'],[`Gizmo's lost battery is at <b>${pt(x,y)}</b>.`,'Tap where it is.']]);
  return PT({prompt:`${s} ${q}`,text:`g5pp ${x} ${y} ${s.slice(0,6)}`,explain:`<p>Start at (0, 0). Go right <b>${x}</b>, then up <b>${y}</b>.</p>`,nudge:'<p>x first (across), then y (up).</p>'},10,x,y);},
 dist:o=>c=>{const vert=Math.random()<.5;const k=R(1,9);let a=R(0,5),b=a+R(2,5);const A=vert?[k,a]:[a,k],B=vert?[k,b]:[b,k];const sw=Math.random()<.5;const P=sw?[B,A]:[A,B];
  if(o.novis)return ok({prompt:`How far apart are the points <b>${pt(...P[0])}</b> and <b>${pt(...P[1])}</b>?`,tpl:'{A} units',answer:b-a,text:`g5d ${P}`,explain:`<p>The ${vert?'x':'y'}-coordinates are the same (${k}), so the points are on one ${vert?'up-and-down':'across'} line.</p><p>${b} − ${a} = <b>${b-a}</b> units</p>`,nudge:'<p>Which number is the same? Subtract the other numbers.</p>'});
  return ok({vis:{t:'grid',max:10,pts:[[...P[0],'A'],[...P[1],'B']],seg:[[...P[0],...P[1]]]},prompt:'How many units long is the segment from A to B?',tpl:'{A} units',answer:b-a,text:`g5dv ${P}`,explain:`<p>A is ${pt(...P[0])} and B is ${pt(...P[1])}. Only the ${vert?'y':'x'} changes.</p><p>${b} − ${a} = <b>${b-a}</b> units</p>`,nudge:'<p>Count the steps along the line, or subtract the coordinates that change.</p>'});},
 rectP:()=>{const x1=R(0,5),y1=R(0,5),w=R(2,5),h=R(2,5);return {x1,y1,w,h,C:[[x1,y1],[x1+w,y1],[x1+w,y1+h],[x1,y1+h]]};},
 corner:c=>{const r=g5.rectP();const miss=R(0,3);const L=['A','B','C'];const shown=r.C.filter((_,i)=>i!==miss).map((p,i)=>[p[0],p[1],L[i]]);const m=r.C[miss];
  return PT({prompt:`Points A, B and C are three corners of ${PK(["Grumbleroot's rectangle garden","a rectangle on Gizmo's map","Ms. Rosa's rectangle patio"])}. Tap the <b>fourth</b> corner.`,text:`g5co ${JSON.stringify(shown)}`,explain:`<p>In a rectangle, two corners share each x and two share each y.</p><p>The missing corner is <b>${pt(...m)}</b>.</p>`,nudge:'<p>Which x is used only once so far? Which y?</p>',fast:20},10,m[0],m[1],shown);},
 rmeas:o=>c=>{const r=g5.rectP();const area=!!(o.area||(o.both&&Math.random()<.5));const vis={t:'grid',max:10,pts:r.C.map((p,i)=>[p[0],p[1],LET[i]]),seg:[[...r.C[0],...r.C[1]],[...r.C[1],...r.C[2]],[...r.C[2],...r.C[3]],[...r.C[3],...r.C[0]]]};
  return ok({vis,prompt:`Each unit is 1 meter. What is the ${area?'<b>area</b>':'<b>perimeter</b>'} of rectangle ABCD?`,tpl:area?'{A} square meters':'{A} meters',answer:area?r.w*r.h:2*(r.w+r.h),text:`g5rm ${area} ${JSON.stringify(r.C)}`,
   explain:`<p>Across: ${r.x1+r.w} − ${r.x1} = ${r.w}. Up: ${r.y1+r.h} − ${r.y1} = ${r.h}.</p><p>${area?`${r.w} × ${r.h} = <b>${r.w*r.h}</b>`:`${r.w} + ${r.h} + ${r.w} + ${r.h} = <b>${2*(r.w+r.h)}</b>`}</p>`,nudge:'<p>Find the length and the width by subtracting coordinates.</p>',fast:20});},
 right:o=>c=>{const vs=o.vs||[0,1,2,3,4,5,6];const v=dk('g5ir'+vs.join(''),vs);const w=who();
  if(v===0)return isRight(w,'Every rhombus is a square, because all its sides are equal.','No, a rhombus does not need right angles',['No, a rhombus has only 2 equal sides','No, a square has 5 sides'],'<p>A square needs 4 equal sides <b>and</b> 4 right angles. A rhombus can lean, so not every rhombus is a square.</p>');
  if(v===1)return isRight(w,'A square is a rhombus.',true,["No, a rhombus can't have right angles",'No, a square is only a rectangle','No, a rhombus has 3 sides'],`<p>A rhombus is any quadrilateral with 4 equal sides. A square has 4 equal sides, so it is a rhombus. ${w.He} is right!</p>`);
  if(v===2)return isRight(w,'This shape is a parallelogram, so it must be a rectangle.','No, a parallelogram does not need right angles',['No, a parallelogram has only one pair of parallel sides','No, a rectangle has 5 sides'],'<p>A parallelogram only needs 2 pairs of parallel sides. This one has no right angles, so it is not a rectangle.</p>',{vis:S1('para')});
  if(v===3)return isRight(w,'A right triangle can never be isosceles.','No, a right triangle can have 2 equal sides',['No, a right triangle is always equilateral','No, a right triangle has 2 right angles'],'<p>A right triangle with two equal legs (like half of a square cut corner to corner) is <b>right isosceles</b>.</p>');
  if(v===4){const x=R(1,4),y=R(6,9);return isRight(w,`To plot ${pt(x,y)}, I go up ${x} and then right ${y}.`,`No, x comes first: right ${x}, then up ${y}`,[`No, go left ${x} and down ${y}`,`No, go up ${x} and up ${y}`],`<p>In ${pt(x,y)} the first number tells how far across (right ${x}); the second tells how far up (${y}).</p>`);}
  if(v===5)return isRight(w,'Every rectangle is a parallelogram.',true,['No, a parallelogram cannot have right angles','No, a rectangle has only one pair of parallel sides'],`<p>A rectangle has 2 pairs of parallel sides, so it is a parallelogram. ${w.He} is right!</p>`);
  const y=R(1,9),a=R(0,3),b=a+R(4,7);const d=b-a;const wr=[a+b,d+1,d-1,b,y].filter((x,k,A)=>x!==d&&x>0&&A.indexOf(x)===k).slice(0,3);return isRight(w,`The distance from ${pt(a,y)} to ${pt(b,y)} is ${d} units.`,true,wr.map(x=>`No, it is ${x} units`),`<p>The y-coordinates match, so subtract the x's: ${b} − ${a} = ${d}. ${w.He} is right!</p>`);},
 riddle:c=>{const [t,a,wr]=dk('g5rid',RID5);const w=who(PK(['wiz','ozzy','skyla','gizmo']));return choice(st({prompt:`${w.N} turned into a shape riddle! ${w.He} says: “${t}” What shape is ${w.he}?`,tpl:'{A}',text:`g5rid ${t} ${w.n}`,explain:`<p>${t}</p><p>That is ${ABn(a)}.</p>`,nudge:'<p>Check every clue against each choice.</p>'}),a,wr);},
 /* Legend */
 legRobot:c=>{for(;;){const a=R(0,4),b=R(0,4),r=R(2,6),u=R(3,7),d=R(1,u-1),l=R(0,2);const x=a+r-l,y=b+u-d;if(x<0||x>10||y<0||y>10||a+r>10||b+u>10)continue;
   return PT(st({prompt:`Gizmo's robot starts at <b>${pt(a,b)}</b>. It rolls right <b>${r}</b>, up <b>${u}</b>, down <b>${d}</b>${l?`, then left <b>${l}</b>`:''}. Tap where it stops.`,text:`g5LR ${a}${b}${r}${u}${d}${l}`,explain:`<p>x: ${a} + ${r}${l?` − ${l}`:''} = ${x}. y: ${b} + ${u} − ${d} = ${y}.</p><p>It stops at <b>${pt(x,y)}</b>.</p>`,nudge:'<p>Right and left change x. Up and down change y.</p>',fast:35}),10,x,y);}},
 legClue:c=>{const v=dk('g5clue',[0,1,2]);const x1=R(0,4),y1=R(0,4),w=R(2,6),h=R(2,6);
  if(v===0)return st({prompt:`Gizmo's rectangle has one corner at <b>${pt(x1,y1)}</b> and the <b>opposite</b> corner at <b>${pt(x1+w,y1+h)}</b>. Its sides go straight across and straight up. What is its area?`,tpl:'{A} square units',answer:w*h,text:`g5cl0 ${x1}${y1}${w}${h}`,explain:`<p>Length: ${x1+w} − ${x1} = ${w}. Width: ${y1+h} − ${y1} = ${h}.</p><p>${w} × ${h} = <b>${w*h}</b></p>`,nudge:'<p>Opposite corners give you both the length and the width.</p>',fast:40});
  if(v===1){const s0=R(2,5);const X=R(0,10-s0),Y=R(0,10-s0);return PT(st({prompt:`A <b>square</b> has its bottom side from <b>${pt(X,Y)}</b> to <b>${pt(X+s0,Y)}</b>. Tap its <b>top-right</b> corner.`,text:`g5cl1 ${X}${Y}${s0}`,explain:`<p>The bottom side is ${s0} long, so every side is ${s0}.</p><p>Go up ${s0} from ${pt(X+s0,Y)}: <b>${pt(X+s0,Y+s0)}</b>.</p>`,nudge:'<p>All 4 sides of a square are the same length.</p>',fast:35}),10,X+s0,Y+s0,[[X,Y,'A'],[X+s0,Y,'B']]);}
  const P=2*(w+h);return st({prompt:`A rectangle has its bottom-left corner at <b>${pt(x1,y1)}</b>. It is <b>${w}</b> units wide and its perimeter is <b>${P}</b> units. What is the y-coordinate of its top-right corner?`,tpl:`(${x1+w}, {A})`,answer:y1+h,text:`g5cl2 ${x1}${y1}${w}${h}`,explain:`<p>${P} − ${w} − ${w} = ${2*h}, so each side going up is ${h}.</p><p>${y1} + ${h} = <b>${y1+h}</b></p>`,nudge:'<p>Step 1: take away the two widths. Step 2: find one height. Step 3: go up from the corner.</p>',fast:50});},
 legClass:c=>{const [d,labs,right]=dk('g5cls',[['A quadrilateral has 4 equal sides and 4 right angles.',['square','rectangle','rhombus','parallelogram','triangle'],[0,1,2,3]],
   ['A quadrilateral has 2 pairs of parallel sides and 4 right angles, but its sides are not all equal.',['rectangle','parallelogram','quadrilateral','rhombus','square'],[0,1,2]],
   ['A quadrilateral has 4 equal sides but no right angles.',['rhombus','parallelogram','quadrilateral','rectangle','square'],[0,1,2]],
   ['A triangle has a 90° angle and two sides of the same length.',['right','isosceles','scalene','obtuse','equilateral'],[0,1]],
   ['A triangle has angles of 30°, 30° and 120°.',['obtuse','isosceles','acute','right','scalene'],[0,1]],['A triangle has sides of 4, 6 and 7 centimeters, and all its angles are less than 90°.',['acute','scalene','isosceles','right','obtuse'],[0,1]]]);
  const L=SH(labs);const ans=L.map((x,i)=>right.map(j=>labs[j]).includes(x)?i:-1).filter(i=>i>=0);
  return MU(st({prompt:`${d} Select ALL the names that fit it.`,multi:L,ans,text:`g5cls ${d} ${L}`,explain:`<p>${L.map(x=>`${x}${right.map(j=>labs[j]).includes(x)?' ✓':''}`).join('<br>')}</p>`,nudge:'<p>Test each name against every clue. A shape can have more than one name.</p>',fast:40}));},
 legGarden:c=>{const v=dk('g5gar',[0,1]);let r;do{r=g5.rectP();}while(r.w<3||r.h<3);const A=r.w*r.h,P=2*(r.w+r.h);
  if(v===0){const f=R(2,3);return st({vis:{t:'grid',max:10,pts:r.C.map((p,i)=>[p[0],p[1],LET[i]])},prompt:`Ms. Rosa plans a garden with corners A, B, C and D. Each unit is 1 meter. Fence costs <b>$${f}</b> a meter, and soil costs <b>$1</b> a square meter. How much do the fence and the soil cost together?`,tpl:'$ {A}',answer:f*P+A,text:`g5gar0 ${JSON.stringify(r.C)} ${f}`,explain:`<p>Sides: ${r.w} and ${r.h}. Perimeter ${P} m, area ${A} m².</p><p>Fence: ${P} × ${f} = ${f*P}. Soil: ${A}. Total: ${f*P} + ${A} = <b>$${f*P+A}</b></p>`,nudge:'<p>Step 1: the sides. Step 2: the perimeter and the area. Step 3: the costs.</p>',fast:60});}
  let q;do{q=g5.rectP();}while(q.w*q.h===A);const [big,sm]=A>q.w*q.h?[A,q.w*q.h]:[q.w*q.h,A];
  return st({prompt:`Which garden is bigger, and by how much? Gizmo's garden has corners ${r.C.map(p=>'<b>'+pt(...p)+'</b>').join(', ')}. Nana Paws's garden has corners ${q.C.map(p=>'<b>'+pt(...p)+'</b>').join(', ')}. How many more square units does the bigger garden have?`,tpl:'{A} square units',answer:big-sm,text:`g5gar1 ${JSON.stringify(r.C)} ${JSON.stringify(q.C)}`,explain:`<p>Gizmo: ${r.w} × ${r.h} = ${A}. Nana Paws: ${q.w} × ${q.h} = ${q.w*q.h}.</p><p>${big} − ${sm} = <b>${big-sm}</b></p>`,nudge:'<p>Find each area from its corners, then compare.</p>',fast:60});},
 legFence:c=>{const r=g5.rectP();const g=R(1,2);const w=who(PK(['nana','troll','rosa']));const P=2*(r.w+r.h);return st({prompt:`How much fence is needed? On a map, ${w.n}'s ${w.n==='Nana Paws'?'dog yard':w.n==='Grumbleroot'?'goat pen':'garden'} is a rectangle with corners at ${r.C.map(p=>'<b>'+pt(...p)+'</b>').join(', ')}. Each unit is 1 meter. ${w.He} leaves a <b>${g}</b>-meter gap for a gate. How many meters of fence ${w.he==='he'?'does he':'does she'} need?`,tpl:'{A} meters',answer:P-g,text:`g5LF ${JSON.stringify(r.C)} ${g}`,explain:`<p>Length ${r.w}, width ${r.h}. Perimeter: ${r.w} + ${r.h} + ${r.w} + ${r.h} = ${P}.</p><p>${P} − ${g} = <b>${P-g}</b></p>`,nudge:'<p>Step 1: find the sides. Step 2: the perimeter. Step 3: take away the gate.</p>',fast:45});},
 legArea:c=>{if(Math.random()<.5){let r;do{r=g5.rectP();}while(r.w<3||r.h<3);const s=2;return st({prompt:`How much room is left for flowers? Ms. Rosa's garden is a rectangle with corners at ${r.C.map(p=>'<b>'+pt(...p)+'</b>').join(', ')}. Each unit is 1 meter. She plants tomatoes in a <b>2 by 2</b> square. How many square meters are left for flowers?`,tpl:'{A} square meters',answer:r.w*r.h-4,text:`g5LA0 ${JSON.stringify(r.C)}`,explain:`<p>Garden: ${r.w} × ${r.h} = ${r.w*r.h}. Tomatoes: 2 × 2 = 4.</p><p>${r.w*r.h} − 4 = <b>${r.w*r.h-4}</b></p>`,nudge:'<p>Step 1: area of the garden. Step 2: take away the tomato square.</p>',fast:45});}
  const r=g5.rectP();const C3=SH(r.C).slice(0,3);return st({prompt:`Find the area. Three corners of a rectangle are at ${C3.map(p=>'<b>'+pt(...p)+'</b>').join(', ')}. What is the area of the rectangle?`,tpl:'{A} square units',answer:r.w*r.h,text:`g5LA1 ${JSON.stringify(C3)}`,explain:`<p>The x's are ${r.x1} and ${r.x1+r.w}, so the length is ${r.w}. The y's are ${r.y1} and ${r.y1+r.h}, so the width is ${r.h}.</p><p>${r.w} × ${r.h} = <b>${r.w*r.h}</b></p>`,nudge:'<p>Find the two different x values and the two different y values.</p>',fast:40});},
 legFly:c=>{const x1=R(0,4),y1=R(0,4),y2=y1+R(2,6),x2=x1+R(2,6);return st({vis:{t:'grid',max:10,pts:[[x1,y1,'N'],[x1,y2,'L'],[x2,y2,'C']]},prompt:`Skyla flies from her nest N at <b>${pt(x1,y1)}</b> straight to the lighthouse L at <b>${pt(x1,y2)}</b>, then straight to the cave C at <b>${pt(x2,y2)}</b>. How many units does she fly in all?`,tpl:'{A} units',answer:(y2-y1)+(x2-x1),text:`g5LY ${x1}${y1}${x2}${y2}`,explain:`<p>N to L: ${y2} − ${y1} = ${y2-y1}. L to C: ${x2} − ${x1} = ${x2-x1}.</p><p>${y2-y1} + ${x2-x1} = <b>${y2-y1+x2-x1}</b></p>`,nudge:'<p>Find each part of the trip, then add.</p>',fast:35});}
};
PLAN.def('geo',5,[
 [g5.tside,g4.tri({num:1}),g5.cread({}),g5.plotPt,g5.tf({}),g5.dist({}),g5.fam({}),g5.riddle],
 [g5.fam({}),g5.cread({pick:1}),g5.plotPt,g5.dist({novis:1}),g5.tboth,g5.rmeas({}),g5.riddle,g5.tside],
 [g5.corner,g5.rmeas({both:1}),g5.tboth,g5.tf({n:4}),g5.dist({novis:1}),g5.legFly,g5.right({vs:[2,3]}),g5.cread({pick:1})],
 [g5.corner,g5.rmeas({both:1}),g5.fam({both:1}),g5.right({vs:[0,4]}),g5.riddle,g5.legFence,g5.legArea,g5.tboth],
 [g5.legClue,g5.legClass,g5.legGarden,g5.legArea,g5.legFly,g5.right({vs:[1,5,6]}),g5.legFence,g5.tf({n:4})]]);

/* ======================================================================
   📊 GRAPH GARDEN (graph): tally charts, picture and bar graphs, line plots, tables, the coordinate grid
   ====================================================================== */
/* chart themes: add(n, category) tells the story of n more */
const GT=[{t:'Cookies Ms. Rosa sold',u:'cookies',e:'🍪',c:['Mon','Tue','Wed','Thu'],k:'on',phys:1,add:(n,x)=>`Ms. Rosa sells ${n} more cookies on ${x}`},
 {t:'Laps Coach Flex ran',u:'laps',e:'🏃',c:['Mon','Tue','Wed','Thu'],k:'on',add:(n,x)=>`Coach Flex runs ${n} more laps on ${x}`},
 {t:'Socks the Grey Goblin stole',u:'socks',e:'🧦',c:['Red','Blue','Green','Pink'],k:'adj',phys:1,add:(n,x)=>`The Grey Goblin steals ${n} more ${x.toLowerCase()} socks`},
 {t:'Crystals Dr. Quartz found',u:'crystals',e:'💎',c:['Cave','River','Hill','Beach'],k:'at',phys:1,add:(n,x)=>`Dr. Quartz finds ${n} more crystals at the ${x.toLowerCase()}`},
 {t:'Dogs Nana Paws walked',u:'dogs',e:'🐕',c:['Mon','Tue','Wed','Thu'],k:'on',add:(n,x)=>`Nana Paws walks ${n} more dogs on ${x}`},
 {t:'Votes for the class pet',u:'votes',e:'🐾',c:['Dogs','Cats','Fish','Birds'],k:'for',add:(n,x)=>`${n} more kids vote for ${x}`},
 {t:'Favorite snack votes',u:'votes',e:'⭐',c:['Apples','Popcorn','Grapes','Carrots'],k:'for',add:(n,x)=>`${n} more kids vote for ${x}`},
 {t:'Feathers Skyla found',u:'feathers',e:'🪶',c:['Mon','Tue','Wed','Thu'],k:'on',phys:1,add:(n,x)=>`Skyla finds ${n} more feathers on ${x}`},
 {t:"Riders on Ozzy's train",u:'riders',e:'🚂',c:['Car 1','Car 2','Car 3','Car 4'],k:'in',add:(n,x)=>`${n} more riders get on ${x}`},
 {t:"Coins in Grumbleroot's toll box",u:'coins',e:'🪙',c:['Mon','Tue','Wed','Thu'],k:'on',phys:1,add:(n,x)=>`Grumbleroot gets ${n} more coins on ${x}`},
 {t:'Gadgets Gizmo built',u:'gadgets',e:'⚙️',c:['June','July','Aug','Sept'],k:'in',phys:1,add:(n,x)=>`Gizmo builds ${n} more gadgets in ${x}`},
 {t:'Weather on Shape Island this month',u:'days',e:'🌤️',c:['Sunny','Rainy','Cloudy','Windy'],k:'adj',wx:1,add:(n,x)=>`The next week adds ${n} more ${x.toLowerCase()} days`},
 {t:"Books the Kind Teacher's class read",u:'books',e:'📚',c:['Week 1','Week 2','Week 3','Week 4'],k:'in',phys:1,add:(n,x)=>`The class reads ${n} more books in ${x}`},
 {t:'Apples Ozzy picked',u:'apples',e:'🍎',c:['Tree A','Tree B','Tree C','Tree D'],k:'from',phys:1,add:(n,x)=>`Ozzy picks ${n} more apples from ${x}`},
 {t:'Fish the Elder Wiz caught',u:'fish',u1:'fish',e:'🐟',c:['Mon','Tue','Wed','Thu'],k:'on',phys:1,add:(n,x)=>`The Elder Wiz catches ${n} more fish on ${x}`},
 {t:"Trolls crossing Grumbleroot's bridge",u:'trolls',e:'🧌',c:['Mon','Tue','Wed','Thu'],k:'on',add:(n,x)=>`${n} more trolls cross the bridge on ${x}`},
 {t:'Favorite color votes',u:'votes',e:'🎨',c:['Red','Blue','Green','Yellow'],k:'for',add:(n,x)=>`${n} more kids vote for ${x}`}];
const U1=th=>th.u1||th.u.replace(/s$/,'');
const catN=th=>{const c=th.c[0];return th.wx?'kind of weather':/^Week/.test(c)?'week':/^Car/.test(c)?'car':/^Tree/.test(c)?'tree':c==='June'?'month':th.k==='on'?'day':th.k==='at'?'place':th.k==='adj'?'color':'choice';};
const PH={on:c=>`on ${c}`,for:c=>`for ${c}`,in:c=>`in ${c}`,at:c=>`at the ${c.toLowerCase()}`,from:c=>`from ${c}`};
const gOf=(th,c)=>th.k==='adj'?`<b>${c.toLowerCase()}</b> ${th.u}`:`${th.u} ${PH[th.k](`<b>${c}</b>`)}`;
const gCmp=(th,a,b)=>th.k==='adj'?`<b>${a.toLowerCase()}</b> ${th.u} than <b>${b.toLowerCase()}</b> ${th.u}`:`${th.u} ${PH[th.k](`<b>${a}</b>`)} than ${PH[th.k](`<b>${b}</b>`)}`;
const gAnd=(th,a,b)=>th.k==='adj'?`<b>${a.toLowerCase()}</b> and <b>${b.toLowerCase()}</b> ${th.u}`:`${th.u} ${PH[th.k](`<b>${a}</b>`)} and ${PH[th.k](`<b>${b}</b>`)}`;
/* o: {kind:'tally'|'pg'|'bar', key, nc, minU, maxU, half, maxSum} — values are R(minU,maxU)*key (minus key/2 for half pictures) */
const RECENT=[];function gD(o){const wxOk=o.maxSum&&o.maxSum<=30,ok2=t=>wxOk||!t.wx;const pool=GT.filter(t=>ok2(t)&&(!o.only||o.only(t)));let th;for(let i=0;i<6;i++){th=dk('GT'+!!wxOk+(o.only?String(o.only).length:''),pool);if(!RECENT.includes(th))break;}RECENT.push(th);while(RECENT.length>4)RECENT.shift();const nc=o.nc||PK([3,4]);const key=o.key||1;let vals;
 for(let g=0;g<600;g++){vals=[];let h=0;while(vals.length<nc&&h++<300){let v=R(o.minU||1,o.maxU||8)*key;if(o.half&&key>1&&Math.random()<.4)v-=key/2;if(v>0&&!vals.includes(v))vals.push(v);}
  if(vals.length===nc&&(!o.maxSum||sum(vals)<=o.maxSum)&&(!o.half||key===1||vals.some(v=>v%key)))break;}
 const data=th.c.slice(0,nc).map((c,i)=>[c,vals[i]]);const half=vals.some(v=>v%key);const kind=o.kind||'pg';const mx=Math.max(...vals);
 const vis=kind==='tally'?{t:'tally',title:th.t,rows:data}:kind==='bar'?{t:'bgraph',title:th.t,cats:data,scale:key,max:(Math.ceil(mx/key)+1)*key}:{t:'pgraph',title:th.t,e:th.e,key,u:th.u,rows:data};
 const read=kind==='tally'?'<p>Each bundle of tally marks is 5. Count by 5s, then count on the single marks.</p>':kind==='bar'?`<p>Go to the top of each bar, then across to the numbers${key>1?` (they go up by ${key})`:''}.${half?' A bar that stops halfway between two lines is the number in the middle.':''}</p>`:key===1?`<p>Each ${th.e} is 1, so count the pictures.</p>`:`<p>Each ${th.e} stands for <b>${key}</b>, so skip-count by ${key}s.${half?` Half a picture is ${key/2}.`:''}</p>`;
 const hint=kind==='tally'?'Count the bundles of 5 first.':kind==='bar'?`Read across from the top of each bar${key>1?`; the lines go up by ${key}`:''}.`:`Check the key: each ${th.e} = ${key}.`;
 const two=()=>{const [a,b]=SH(data).slice(0,2);return a[1]>=b[1]?[a,b]:[b,a];};
 return {th,data,vis,read,hint,two,key,vals,kind};}
/* true/false statements about a category graph: [text, truth] with distinct types */
function gStmts(g,n){const D=g.data,u=g.th.u;const tot=sum(g.vals);const [a,b]=g.two();const d=a[1]-b[1];const mx=D.reduce((p,q)=>q[1]>p[1]?q:p),mn=D.reduce((p,q)=>q[1]<p[1]?q:p);const [c1,c2]=pickN(D,2);const s=c1[1]+c2[1];const off=g.key;
 const u1=U1(g.th);const T=[[[`<b>${a[0]}</b> has ${d} more ${d===1?u1:u} than <b>${b[0]}</b>.`,true],[`<b>${a[0]}</b> has ${d+off} more ${u} than <b>${b[0]}</b>.`,false]],
  [[`<b>${mx[0]}</b> has the most ${u}.`,true],[`<b>${PK(D.filter(x=>x!==mx))[0]}</b> has the most ${u}.`,false]],
  [[`There are ${tot} ${u} in all.`,true],[`There are ${tot+PK([-off,off])} ${u} in all.`,false]],
  [[`<b>${c1[0]}</b> and <b>${c2[0]}</b> together have ${s} ${u}.`,true],[`<b>${c1[0]}</b> and <b>${c2[0]}</b> together have ${s+off} ${u}.`,false]],
  [[`<b>${mn[0]}</b> has the fewest ${u}.`,true],[`<b>${PK(D.filter(x=>x!==mn))[0]}</b> has the fewest ${u}.`,false]]];
 let rows;for(let g2=0;g2<200;g2++){rows=pickN(T,n).map(p=>PK(p));const k=rows.filter(r=>r[1]).length;if(k>=1&&k<n)break;}
 return rows.map(r=>[r[0],r[1],'']);}
const GQ={
 read:o=>c=>{const g=gD(o);const [n,v]=PK(g.data);return ok({vis:g.vis,prompt:`How many ${gOf(g.th,n)}?`,tpl:`{A} ${g.th.u}`,answer:v,text:`gr ${JSON.stringify(g.data)} ${n}`,explain:g.read+`<p>${n}: <b>${v}</b></p>`,nudge:`<p>${g.hint}</p>`,fast:10});},
 most:o=>c=>{const g=gD(o);const few=Math.random()<.4;const best=g.data.reduce((a,b)=>(few?b[1]<a[1]:b[1]>a[1])?b:a);const look=g.kind==='bar'?(few?'shortest bar':'tallest bar'):(few?'shortest row':'longest row');
  return choice(ok({vis:g.vis,prompt:`Which has the <b>${few?'fewest':'most'}</b> ${g.th.u}?`,tpl:'{A}',text:`gm ${few} ${JSON.stringify(g.data)}`,explain:`<p>The ${look} is <b>${best[0]}</b> (${best[1]}).</p>`,nudge:`<p>Look for the ${look}.</p>`,fast:10}),best[0],g.data.map(x=>x[0]));},
 more:o=>c=>{const g=gD(o);const [hi,lo]=g.two();const few=(o.key||1)>1&&Math.random()<.4;
  return ok({vis:g.vis,prompt:few?`How many <b>fewer</b> ${gCmp(g.th,lo[0],hi[0])}?`:`How many <b>more</b> ${gCmp(g.th,hi[0],lo[0])}?`,tpl:few?'{A} fewer':'{A} more',answer:hi[1]-lo[1],text:`gmo ${few} ${JSON.stringify(g.data)} ${hi[0]}${lo[0]}`,explain:g.read+`<p>${hi[0]} = ${hi[1]}, ${lo[0]} = ${lo[1]}.</p><p>${hi[1]} − ${lo[1]} = <b>${hi[1]-lo[1]}</b></p>`,nudge:`<p>${g.hint} Then find the difference.</p>`});},
 both:o=>c=>{const g=gD(o);const [a,b]=g.two();return ok({vis:g.vis,prompt:`How many ${gAnd(g.th,a[0],b[0])} <b>together</b>?`,tpl:`{A} ${g.th.u}`,answer:a[1]+b[1],text:`gb ${JSON.stringify(g.data)} ${a[0]}${b[0]}`,explain:g.read+`<p>${a[1]} + ${b[1]} = <b>${a[1]+b[1]}</b></p>`,nudge:`<p>${g.hint} Then add the two.</p>`});},
 all:o=>c=>{const g=gD(o);const s=sum(g.vals);return ok({vis:g.vis,prompt:`How many ${g.th.u} are there <b>in all</b>?`,tpl:`{A} ${g.th.u}`,answer:s,text:`ga ${JSON.stringify(g.data)}`,explain:g.read+`<p>${g.vals.join(' + ')} = <b>${s}</b></p>`,nudge:`<p>${g.hint} Read every one, then add.</p>`,fast:20});},
 tie:o=>c=>{const g=gD(o);const [hi,lo]=g.two();return st({vis:g.vis,prompt:`How many more ${g.th.u} would <b>${lo[0]}</b> need to have the same as <b>${hi[0]}</b>?`,tpl:'{A} more',answer:hi[1]-lo[1],text:`gt ${JSON.stringify(g.data)} ${hi[0]}${lo[0]}`,explain:g.read+`<p>${lo[0]} has ${lo[1]}. ${hi[0]} has ${hi[1]}.</p><p>${lo[1]} + <b>${hi[1]-lo[1]}</b> = ${hi[1]}</p>`,nudge:`<p>Count up from ${lo[0]}'s number to ${hi[0]}'s number.</p>`});},
 two:o=>c=>{for(;;){const g=gD(Object.assign({},o,{nc:o.nc||PK([3,4])}));const [A,B,C]=SH(g.data);const s=A[1]+B[1];if(s===C[1])continue;const big=Math.max(s,C[1]),small=Math.min(s,C[1]);
   const pa=g.th.k==='adj'?`<b>${A[0].toLowerCase()}</b> and <b>${B[0].toLowerCase()}</b> ${g.th.u} together`:`${g.th.u} ${PH[g.th.k](`<b>${A[0]}</b> and <b>${B[0]}</b>`)} together`,pc=gOf(g.th,C[0]);
   return st({vis:g.vis,prompt:s>C[1]?`How many more ${pa} than ${pc}?`:`How many more ${pc} than ${pa}?`,tpl:'{A} more',answer:big-small,text:`g2s ${JSON.stringify(g.data)} ${A[0]}${B[0]}`,explain:g.read+`<p>${A[0]} + ${B[0]} = ${A[1]} + ${B[1]} = ${s}. ${C[0]} = ${C[1]}.</p><p>${big} − ${small} = <b>${big-small}</b></p>`,nudge:`<p>Step 1: add ${A[0]} and ${B[0]}. Step 2: compare with ${C[0]}.</p>`,fast:30});}},
 goal:o=>c=>{const g=gD(Object.assign({},o,{only:t=>!t.wx}));const [n,v]=PK(g.data);const goal=v+g.key*R(2,6);return st({vis:g.vis,prompt:`The goal ${PH[g.th.k==='adj'||g.th.k==='from'?'for':g.th.k](`<b>${n}</b>`)} was <b>${goal}</b> ${g.th.u}. How many more were needed to reach the goal?`,tpl:'{A} more',answer:goal-v,text:`gg ${JSON.stringify(g.data)} ${n} ${goal}`,explain:g.read+`<p>${n} = ${v}.</p><p>${goal} − ${v} = <b>${goal-v}</b></p>`,nudge:`<p>Read ${n}, then find how far it is from ${goal}.</p>`});},
 left:o=>c=>{const g=gD(Object.assign({},o,{only:t=>t.phys}));const [a,b]=g.two();const gone=R(2,Math.max(2,a[1]+b[1]-2));const [s1,s2]=['are put in a basket','The Grey Goblin steals'];
  return st({vis:g.vis,prompt:`All the ${gAnd(g.th,a[0],b[0])} ${s1}. ${s2} <b>${gone}</b> of them. How many ${g.th.u} are left in the ${s1.includes('basket')?'basket':'box'}?`,tpl:`{A} ${g.th.u}`,answer:a[1]+b[1]-gone,text:`gl ${JSON.stringify(g.data)} ${gone} ${s2}`,explain:g.read+`<p>${a[1]} + ${b[1]} = ${a[1]+b[1]}.</p><p>${a[1]+b[1]} − ${gone} = <b>${a[1]+b[1]-gone}</b></p>`,nudge:`<p>Step 1: add the two. Step 2: take away ${gone}.</p>`});},
 change:o=>c=>{for(;;){const g=gD(o);const [hi,lo]=g.two();const k=R(2,4)*g.key;if(lo[1]+k===hi[1])continue;const nl=lo[1]+k;const [big,sm,bn,sn]=nl>hi[1]?[nl,hi[1],lo[0],hi[0]]:[hi[1],nl,hi[0],lo[0]];
   return st({vis:g.vis,prompt:`${g.th.add(`<b>${k}</b>`,lo[0])}. Now how many more ${gCmp(g.th,bn,sn)}?`,tpl:'{A} more',answer:big-sm,text:`gc ${JSON.stringify(g.data)} ${lo[0]} ${k}`,explain:g.read+`<p>${lo[0]}: ${lo[1]} + ${k} = ${nl}. ${hi[0]} = ${hi[1]}.</p><p>${big} − ${sm} = <b>${big-sm}</b></p>`,nudge:`<p>Step 1: find ${lo[0]}'s new number. Step 2: compare.</p>`,fast:30});}},
 range:o=>c=>{const g=gD(Object.assign({nc:PK([3,4])},o));const mx=g.data.reduce((p,q)=>q[1]>p[1]?q:p),mn=g.data.reduce((p,q)=>q[1]<p[1]?q:p);
  return st({vis:g.vis,prompt:`How many more ${g.th.u} does the ${catN(g.th)} with the <b>most</b> have than the ${catN(g.th)} with the <b>fewest</b>?`,tpl:'{A} more',answer:mx[1]-mn[1],text:`grng ${JSON.stringify(g.data)}`,explain:g.read+`<p>Most: ${mx[0]} (${mx[1]}). Fewest: ${mn[0]} (${mn[1]}).</p><p>${mx[1]} − ${mn[1]} = <b>${mx[1]-mn[1]}</b></p>`,nudge:'<p>Step 1: find the most and the fewest. Step 2: subtract.</p>',fast:30});},
 order:o=>c=>{const g=gD(Object.assign({nc:PK([3,4])},o));const dn=g.data.slice().sort((a,b)=>b[1]-a[1]).map(x=>x[0]);const lab=a=>a.join(', ');const W=[lab(dn.slice().reverse())];for(let i=0;i<6&&W.length<3;i++){const x=lab(SH(dn));if(x!==lab(dn)&&!W.includes(x))W.push(x);}
  return choice(ok({vis:g.vis,prompt:`Line them up, starting with the biggest number of ${g.th.u} and ending with the smallest. Which list is right?`,tpl:'{A}',text:`gord ${JSON.stringify(g.data)}`,explain:g.read+`<p>${g.data.slice().sort((a,b)=>b[1]-a[1]).map(x=>`${x[0]} (${x[1]})`).join(', ')}</p>`,nudge:'<p>Find the biggest first, then the next biggest.</p>',fast:20}),lab(dn),W);},
 missing:o=>c=>{const g=gD(Object.assign({nc:PK([3,4])},o));const i=R(0,g.data.length-1);const [n,v]=g.data[i];const rest=g.data.filter((_,j)=>j!==i);const T=sum(g.vals);const vis=Object.assign({},g.vis);if(vis.rows)vis.rows=rest;if(vis.cats)vis.cats=rest;
  return st({vis,prompt:`The row for <b>${n}</b> fell off the graph! All together there are <b>${T}</b> ${g.th.u}. How many ${gOf(g.th,n)}?`,tpl:`{A} ${g.th.u}`,answer:v,text:`gmis ${JSON.stringify(g.data)} ${n}`,explain:g.read+`<p>The graph shows ${rest.map(x=>x[1]).join(' + ')} = ${T-v}.</p><p>${T} − ${T-v} = <b>${v}</b></p>`,nudge:'<p>Add what the graph shows. How much more makes the total?</p>',fast:30});},
 which2:o=>c=>{const want=dk('gw2want',['AB','C','AB','C','same']);let g,A,B,C,s2;for(let t=0;t<300;t++){g=gD(Object.assign({nc:PK([3,4])},o));[A,B,C]=SH(g.data);s2=A[1]+B[1];const got=s2>C[1]?'AB':s2<C[1]?'C':'same';if(got===want&&Math.abs(s2-C[1])<=2*g.key)break;}const r=s2>C[1]?`${A[0]} and ${B[0]} together`:s2<C[1]?C[0]:'they are the same';
  return choice(st({vis:g.vis,prompt:`Which is more: <b>${A[0]} and ${B[0]} together</b>, or <b>${C[0]}</b>?`,tpl:'{A}',text:`gw2 ${JSON.stringify(g.data)} ${A[0]}${B[0]}`,explain:g.read+`<p>${A[0]} + ${B[0]} = ${A[1]} + ${B[1]} = ${s2}. ${C[0]} = ${C[1]}.</p><p>So: <b>${r}</b>.</p>`,nudge:'<p>Add the two first, then compare.</p>',fast:25}),r,[`${A[0]} and ${B[0]} together`,C[0],'they are the same']);},
 pics:o=>c=>{const g=gD(o);const k=g.key;const n=R(2,8);const half=o.half&&Math.random()<.5;const v=n*k+(half?k/2:0);
  return ok({vis:g.vis,prompt:`On Friday there were <b>${v}</b> ${g.th.u}. How many ${g.th.e} should be drawn for Friday?${half?' (Type the whole pictures; the half is already drawn.)':''}`,tpl:half?`{A} and a half ${g.th.e}`:`{A} ${g.th.e}`,answer:n,text:`gp ${k} ${v} ${g.th.u}`,explain:`<p>Each ${g.th.e} = ${k}. ${n} × ${k} = ${n*k}${half?`, plus half a picture (${k/2}) makes ${v}`:''}.</p><p><b>${n}</b> ${half?'whole pictures and a half':'pictures'}.</p>`,nudge:`<p>Skip-count by ${k}s up to ${v}.</p>`});},
 sel:o=>c=>{for(;;){const g=gD(Object.assign({nc:4},o));const sv=g.vals.slice().sort((a,b)=>a-b);const N0=sv[R(0,2)]+(Math.random()<.5?0:Math.ceil(g.key/2));const good=x=>x[1]>N0;const k=g.data.filter(good).length;if(k<1||k>3||N0<2)continue;
   return MU({vis:g.vis,prompt:`Select ALL the ${g.kind==='bar'?'bars':'rows'} with <b>more than ${N0}</b> ${g.th.u}.`,multi:g.data.map(x=>x[0]),ans:ansOf(g.data,good),text:`gsel ${JSON.stringify(g.data)} ${N0}`,explain:g.read+`<p>${g.data.map(x=>`${x[0]}: ${x[1]}${good(x)?' ✓':''}`).join('<br>')}</p>`,nudge:`<p>Read each one. Is it more than ${N0}? (${N0} itself does not count.)</p>`});}},
 tf:o=>c=>{const g=gD(Object.assign({nc:PK([3,4])},o));return Object.assign(tfQ('Is each sentence about the graph true or false?',gStmts(g,o.n||3),g.read.replace(/<\/?p>/g,'')+' Check each sentence against the graph.'),{vis:g.vis,text:`gtf ${JSON.stringify(g.data)} ${Math.random()}`});}
};
/* ---------- line plots ---------- */
/* sz: M = a few inches long (whole inches, grade 2), S = small (1–3 inches, or fractions of an inch), X = other units for fraction plots */
const LPT=[{t:"Skyla's feathers",own:'Skyla',it:'feather',its:'feathers',u:['inch','inches'],how:'long',sz:'M'},{t:"Pencils in the Kind Teacher's cup",own:'the Kind Teacher',it:'pencil',its:'pencils',u:['inch','inches'],how:'long',sz:'M'},
 {t:"Gizmo's bolts",own:'Gizmo',it:'bolt',its:'bolts',u:['inch','inches'],how:'long',sz:'S'},{t:"Dr. Quartz's tiny crystals",own:'Dr. Quartz',it:'crystal',its:'crystals',u:['inch','inches'],how:'long',sz:'S'},
 {t:"Beetles in Ms. Rosa's garden",own:'Ms. Rosa',it:'beetle',its:'beetles',u:['inch','inches'],how:'long',sz:'S'},
 {t:"Nana Paws's yarn scraps",own:'Nana Paws',it:'scrap',its:'scraps',u:['foot','feet'],how:'long',sz:'X'},{t:"Ribbon pieces Ms. Rosa cut",own:'Ms. Rosa',it:'ribbon',its:'ribbons',u:['foot','feet'],how:'long',sz:'X'},{t:"Ms. Rosa's bags of flour",own:'Ms. Rosa',it:'bag',its:'bags',u:['pound','pounds'],how:'heavy',sz:'X'},
 {t:"Water in Dr. Quartz's beakers",own:'Dr. Quartz',it:'beaker',its:'beakers',u:['liter','liters'],how:'hold',sz:'X'}];
const lpL=(v,den)=>{const w=Math.floor(v/den),r=v%den;if(!r)return String(w);const g=gcd(r,den);const f=`${r/g}/${den/g}`;return w?`${w} ${f}`:f;};
const lpH=(v,den)=>{const w=Math.floor(v/den),r=v%den;if(!r)return String(w);const g=gcd(r,den);const f=F(r/g,den/g);return w?`${w} ${f}`:f;};
const lpU=(th,v,den)=>v<=den?th.u[0]:th.u[1];
const lpM=(th,v,den)=>{const l=lpH(v,den),u=lpU(th,v,den);return th.how==='long'?`are <b>${l}</b> ${u} long`:th.how==='heavy'?`weigh <b>${l}</b> ${u}`:`hold <b>${l}</b> ${u}`;};
const lpGt=th=>th.how==='long'?'are longer than':th.how==='heavy'?'weigh more than':'hold more than';
const lpBig=th=>th.how==='long'?['longest','shortest','longer']:th.how==='heavy'?['heaviest','lightest','heavier']:['fullest','emptiest','more'];
const lpWhat=th=>th.how==='long'?'length':th.how==='heavy'?'weight':'amount';
/* o: {den, start:[lo,hi] tick start in 1/den, nt, minM, maxM, maxEach, th:filter, ok:xs=>bool} */
function lpMake(o){const th=PK(o.th?LPT.filter(o.th):LPT);const nt=o.nt||5;const start=R(o.start[0],o.start[1]);let xs;
 for(let g=0;g<800;g++){xs=Array.from({length:nt},()=>R(0,o.maxEach||4));const tot=sum(xs),nz=xs.filter(Boolean).length;if(tot>=(o.minM||5)&&tot<=(o.maxM||12)&&nz>=3&&xs[0]>0&&(!o.ok||o.ok(xs,start)))break;}
 const vals=Array.from({length:nt},(_,i)=>start+i);const ticks=vals.map(v=>lpL(v,o.den));
 const nzI=xs.map((x,i)=>x?i:-1).filter(i=>i>=0);
 return {th,xs,vals,ticks,den:o.den,start,nzI,lo:vals[nzI[0]],hi:vals[nzI[nzI.length-1]],tot:sum(xs),vis:{t:'lplot',title:`${th.t} (${th.u[1]})`,ticks,xs}};}
const LPR='<p>Each ✕ is one ';
const LQ={
 count:o=>c=>{const L=lpMake(o);const i=PK(L.nzI);const v=L.vals[i];return ok({vis:L.vis,prompt:`How many ${L.th.its} ${lpM(L.th,v,L.den)}?`,tpl:`{A} ${L.th.its}`,answer:L.xs[i],text:`lc ${L.th.it} ${L.ticks} ${L.xs} ${i}`,explain:`${LPR}${L.th.it}. Count the ✕ above ${lpH(v,L.den)}: <b>${L.xs[i]}</b>.</p>`,nudge:`<p>Find ${lpH(v,L.den)} on the line. Count the ✕ above it.</p>`,fast:10});},
 total:o=>c=>{const L=lpMake(o);return ok({vis:L.vis,prompt:`Count every ✕. How many ${L.th.its} were measured in all?`,tpl:`{A} ${L.th.its}`,answer:L.tot,text:`lt ${L.th.it} ${L.ticks} ${L.xs}`,explain:`${LPR}${L.th.it}.</p><p>${L.xs.filter(Boolean).join(' + ')} = <b>${L.tot}</b></p>`,nudge:'<p>Count every ✕ on the line plot.</p>'});},
 most:o=>c=>{const L=lpMake(Object.assign({},o,{ok:xs=>xs.filter(x=>x===Math.max(...xs)).length===1}));const i=L.xs.indexOf(Math.max(...L.xs));const w=lpWhat(L.th);
  return choice(ok({vis:L.vis,prompt:`Which ${w} has the most ${L.th.its}?`,tpl:'{A}',text:`lm ${L.th.it} ${L.ticks} ${L.xs}`,explain:`<p>The tallest stack of ✕ is above <b>${lpH(L.vals[i],L.den)}</b> (${L.xs[i]} ${L.th.its}).</p>`,nudge:'<p>Find the tallest stack of ✕.</p>',fast:10}),lpH(L.vals[i],L.den),pickN(L.vals.filter((_,j)=>j!==i).map(v=>lpH(v,L.den)),3));},
 gt:o=>c=>{for(;;){const L=lpMake(o);const j=R(1,L.xs.length-2);const k=sum(L.xs.slice(j+1));if(!k)continue;const v=L.vals[j];
   return ok({vis:L.vis,prompt:`Look to the right of <b>${lpH(v,L.den)}</b> on the line plot. How many ${L.th.its} ${lpGt(L.th)} <b>${lpH(v,L.den)}</b> ${lpU(L.th,v,L.den)}?`,tpl:`{A} ${L.th.its}`,answer:k,text:`lg ${L.th.it} ${L.ticks} ${L.xs} ${j}`,explain:`<p>Count only the ✕ to the <b>right</b> of ${lpH(v,L.den)} (not on it).</p><p>${L.xs.slice(j+1).filter(Boolean).join(' + ')} = <b>${k}</b></p>`,nudge:`<p>Bigger numbers are to the right. Don't count the ✕ on ${lpH(v,L.den)}.</p>`});}},
 diff:o=>c=>{const L=lpMake(Object.assign({},o,{ok:(xs,s)=>{const nz=xs.map((x,i)=>x?i:-1).filter(i=>i>=0);return nz[nz.length-1]-nz[0]<(o.den>1?o.den:99)&&(!o.ok||o.ok(xs,s));}}));const d=L.hi-L.lo;const [b,sm,er]=lpBig(L.th);
  const q=L.th.how==='hold'?`How much more water is in the fullest beaker than in the emptiest?`:`How much ${er} is the ${b} ${L.th.it} than the ${sm}?`;
  const tpl=L.den===1?`{A} ${L.th.u[1]}`:`${FA(L.den)} ${L.th.u[0]}`;
  return ok({vis:L.vis,prompt:q,tpl,answer:d,text:`ld ${L.th.it} ${L.ticks} ${L.xs}`,explain:`<p>The ${b}: ${lpH(L.hi,L.den)}. The ${sm}: ${lpH(L.lo,L.den)}.</p><p>${L.den===1?`${L.hi} − ${L.lo} = <b>${d}</b>`:`In ${L.den}ths: ${F(L.hi,L.den)} − ${F(L.lo,L.den)} = <b>${F(d,L.den)}</b>`}</p>`.replace('4ths','fourths').replace('8ths','eighths').replace('2ths','halves'),nudge:`<p>Find the ✕ farthest left and farthest right. ${L.den>1?'Write both with the same bottom number, then subtract the tops.':'Subtract.'}</p>`,fast:20});},
 at:o=>c=>{const L=lpMake(Object.assign({},o,{ok:xs=>xs.some((x,i)=>x>=2)}));const i=PK(L.nzI.filter(i=>L.xs[i]>=2));const v=L.vals[i],k=L.xs[i];const nm=L.den===8?'eighths':L.den===4?'fourths':'halves';
  return ok({vis:L.vis,prompt:`Put together all the ${L.th.its} that ${lpM(L.th,v,L.den).replace(/ long$/,' long')}. What is their total ${lpWhat(L.th)}?`,tpl:`${FA(L.den)} ${L.th.u[1]}`,answer:v*k,text:`la ${L.th.it} ${L.ticks} ${L.xs} ${i}`,explain:`<p>There are ${k} of them, each ${F(v,L.den)}.</p><p>${Array(k).fill(F(v,L.den)).join(' + ')} = <b>${F(v*k,L.den)}</b></p>`,nudge:`<p>Write ${lpH(v,L.den)} in ${nm}. Add it once for each ✕.</p>`,fast:25});},
 pair:o=>c=>{const L=lpMake(o);const [i,j]=pickN(L.nzI,2);const a=L.vals[i],b=L.vals[j];const nm=L.den===8?'eighths':L.den===4?'fourths':'halves';
  return ok({vis:L.vis,prompt:`Take one ${L.th.it} that ${L.th.how==='heavy'?'weighs':'measures'} ${lpH(a,L.den)} ${lpU(L.th,a,L.den)} and one that ${L.th.how==='heavy'?'weighs':'measures'} ${lpH(b,L.den)} ${lpU(L.th,b,L.den)}. What is their total?`,tpl:`${FA(L.den)} ${L.th.u[1]}`,answer:a+b,text:`lp ${L.th.it} ${L.ticks} ${L.xs} ${i}${j}`,explain:`<p>${lpH(a,L.den)} = ${F(a,L.den)} and ${lpH(b,L.den)} = ${F(b,L.den)}.</p><p>${a} + ${b} = ${a+b}, so <b>${F(a+b,L.den)}</b></p>`,nudge:`<p>Write both in ${nm}, then add the tops.</p>`,fast:20});},
 all:o=>c=>{const L=lpMake(Object.assign({},o,{ok:(xs,s)=>sum(xs.map((x,i)=>x*(s+i)))<=(o.maxTot||3*o.den)}));const t=sum(L.xs.map((x,i)=>x*L.vals[i]));const nm=L.den===8?'eighths':L.den===4?'fourths':'halves';
  return st({vis:L.vis,prompt:`${L.th.how==='hold'?'All the water is poured into one big jug':`All the ${L.th.its} are put together`}. What is the total ${lpWhat(L.th)}, in ${nm}?`,tpl:`${FA(L.den)} ${L.th.u[1]}`,answer:t,text:`lall ${L.th.it} ${L.ticks} ${L.xs}`,explain:`<p>In ${nm}: ${L.xs.map((x,i)=>x?`${x} × ${L.vals[i]}`:'').filter(Boolean).join(' + ')} = <b>${t}</b>, so ${F(t,L.den)}.</p>`,nudge:`<p>Write each value in ${nm}, times its number of ✕, then add.</p>`,fast:45});},
 share:o=>c=>{const L=lpMake(Object.assign({},o,{th:t=>t.how==='hold',ok:(xs,s)=>{const t=sum(xs.map((x,i)=>x*(s+i)));return t%sum(xs)===0&&t<=4*o.den;}}));const t=sum(L.xs.map((x,i)=>x*L.vals[i])),n=L.tot;
  return st({vis:L.vis,prompt:`Dr. Quartz pours all the water together. Then he shares it <b>equally</b> among the ${n} beakers. How much water is in each beaker now?`,tpl:`${FA(L.den)} liter`,answer:t/n,text:`ls ${L.ticks} ${L.xs}`,explain:`<p>Total in eighths: ${L.xs.map((x,i)=>x?`${x} × ${L.vals[i]}`:'').filter(Boolean).join(' + ')} = ${t}.</p><p>${t} ÷ ${n} = <b>${t/n}</b>, so each beaker gets ${F(t/n,L.den)} liter.</p>`,nudge:`<p>Find the total in eighths, then share it among ${n} beakers.</p>`,fast:45});},
 jug:o=>c=>{for(;;){const L=lpMake(Object.assign({},o,{th:t=>t.how==='heavy'}));if(L.nzI.length<2)continue;const [i,j]=pickN(L.nzI,2).sort((a,b)=>a-b);const vi=L.vals[i],vj=L.vals[j];const t=L.xs[i]*vi+L.xs[j]*vj;const k=R(1,3);if(t-k<1)continue;
   return st({vis:L.vis,prompt:`Ms. Rosa empties every bag that weighs ${lpH(vi,L.den)} pound and every bag that weighs ${lpH(vj,L.den)} pound into one bin. Then she uses <b>${F(k,L.den)}</b> pound for a cake. How much flour is left in the bin, in eighths?`,tpl:`${FA(L.den)} pounds`,answer:t-k,text:`ljug ${L.ticks} ${L.xs} ${i}${j}${k}`,explain:`<p>${L.xs[i]} × ${vi} = ${L.xs[i]*vi} eighths. ${L.xs[j]} × ${vj} = ${L.xs[j]*vj} eighths.</p><p>${L.xs[i]*vi} + ${L.xs[j]*vj} = ${t}. ${t} − ${k} = <b>${t-k}</b>, so ${F(t-k,L.den)} pounds.</p>`,nudge:'<p>Step 1: each group in eighths. Step 2: add them. Step 3: take away what she used.</p>',fast:50});}},
 fromList:c=>{const th=PK(LPT.filter(t=>t.sz==='M'));const lo=R(3,6);let v;do{v=Array.from({length:R(6,8)},()=>lo+R(0,3));}while(new Set(v).size<3);const k=PK(v);const n=v.filter(x=>x===k).length;const mode=Math.random()<.4;
  const cnt=[0,1,2,3].map(i=>v.filter(x=>x===lo+i).length);const top=Math.max(...cnt);
  if(mode&&cnt.filter(x=>x===top).length===1){const m=lo+cnt.indexOf(top);return choice(st({prompt:`Gizmo measured ${v.length} ${th.its} (inches): <b>${v.join(', ')}</b>. He makes a line plot with one ✕ for each. Which number will have the tallest stack of ✕?`,tpl:'{A} inches',text:`glist m ${v}`,explain:`<p>Count each length: ${cnt.map((x,i)=>`${lo+i}: ${x}`).join(', ')}.</p><p>The most ✕ go above <b>${m}</b>.</p>`,nudge:'<p>Make a tally for each length first.</p>',fast:35}),String(m),[0,1,2,3].map(i=>String(lo+i)));}
  return st({prompt:`Gizmo measured ${v.length} ${th.its} (inches): <b>${v.join(', ')}</b>. He makes a line plot with one ✕ for each. How many ✕ will be stacked over the number <b>${k}</b>?`,tpl:'{A} ✕',answer:n,text:`glist ${v} ${k}`,explain:`<p>Count the ${k}s in the list: <b>${n}</b>.</p>`,nudge:`<p>Find every ${k} in the list.</p>`,fast:30});},
 place:o=>c=>{const L=lpMake(o);let v;do{v=R(L.vals[0],L.vals[L.vals.length-1]);}while(o.frac&&v%L.den===0);const lo=Math.floor(L.vals[0]/L.den),hi=Math.max(lo+1,Math.ceil(L.vals[L.vals.length-1]/L.den));const w={n:L.th.own,N:cap(L.th.own)};
  const q=NL({prompt:`${w.N} ${L.th.how==='heavy'?'weighed':'measured'} one more ${L.th.it}: <b>${lpH(v,L.den)}</b> ${lpU(L.th,v,L.den)}. Tap where its ✕ goes on the number line.${o.hard?' (Only the ends are numbered!)':''}`,text:`lnl ${L.th.it} ${v} ${L.den} ${w.n} ${!!o.hard}`,explain:`<p>Each whole is cut into ${L.den} equal steps.</p><p>${lpH(v,L.den)} is ${v-lo*L.den} ${v-lo*L.den===1?'step':'steps'} past ${lo}.</p>`,nudge:`<p>Find the whole number first, then count the small steps.</p>`},lo,hi,L.den,v-lo*L.den);if(o.hard)q.nlt.labs=[0,(hi-lo)*L.den];return q;},
 stm:o=>c=>{const L=lpMake(o);const S=[];const i=PK(L.nzI);const v=L.vals[i];const [b,sm]=lpBig(L.th);const d=L.hi-L.lo;const j=PK(L.nzI.filter(x=>x!==i));
  S.push([[`${L.xs[i]} ${L.xs[i]===1?L.th.it+' '+lpM(L.th,v,L.den).replace(/^are /,'is ').replace(/^weigh /,'weighs ').replace(/^hold /,'holds '):L.th.its+' '+lpM(L.th,v,L.den)}.`,true],[`${L.xs[i]+1} ${L.th.its} ${lpM(L.th,v,L.den)}.`,false]]);
  S.push([[`${L.tot} ${L.th.its} were measured.`,true],[`${L.tot+PK([-1,1])} ${L.th.its} were measured.`,false]]);
  S.push([[`The ${b} ${L.th.it} is ${lpH(L.hi,L.den)} ${lpU(L.th,L.hi,L.den)}.`,true],[`The ${b} ${L.th.it} is ${lpH(L.vals[L.vals.length-1]===L.hi?L.hi-1:L.vals[L.vals.length-1],L.den)} ${L.th.u[0]}.`,false]]);
  if(L.den>1)S.push([[`The difference between the ${b} and the ${sm} is ${lpH(d,L.den)} ${lpU(L.th,d,L.den)}.`,true],[`The difference between the ${b} and the ${sm} is ${lpH(d+1,L.den)} ${lpU(L.th,d+1,L.den)}.`,false]]);
  if(L.xs[i]!==L.xs[j]){const [p,q]=L.xs[i]>L.xs[j]?[i,j]:[j,i];S.push([[`There are more ✕ above ${lpH(L.vals[p],L.den)} than above ${lpH(L.vals[q],L.den)}.`,true],[`There are more ✕ above ${lpH(L.vals[q],L.den)} than above ${lpH(L.vals[p],L.den)}.`,false]]);}
  let rows;for(let g=0;g<200;g++){rows=pickN(S,o.n||3).map(p=>PK(p));const k=rows.filter(r=>r[1]).length;if(k>=1&&k<rows.length)break;}
  if(o.multi){if(rows.length<4){let rr;for(let g=0;g<200;g++){rr=pickN(S,Math.min(4,S.length)).map(p=>PK(p));const k=rr.filter(r=>r[1]).length;if(k>=1&&k<rr.length)break;}rows=rr;}
   return MU({vis:L.vis,prompt:'Select ALL the sentences that are true about the line plot.',multi:rows.map(r=>r[0]),ans:rows.map((r,i)=>r[1]?i:-1).filter(i=>i>=0),text:`lstm ${L.ticks} ${L.xs} ${rows.map(r=>r[0]).join('|')}`,explain:`<p>${rows.map(r=>`${r[0]} <b>${r[1]?'True':'False'}</b>`).join('<br>')}</p>`,nudge:'<p>Check each sentence against the ✕ marks.</p>',fast:40});}
  return Object.assign(tfQ('Is each sentence about the line plot true or false?',rows.map(r=>[r[0],r[1],'']),'Check each sentence against the ✕ marks.'),{vis:L.vis,text:`ltf ${L.ticks} ${L.xs} ${rows.map(r=>r[0]).join('|')}`});}
};
/* ---------- tables (grade 4) ---------- */
const TB=[['Push-ups Coach Flex did','push-ups',['Mon','Tue','Wed','Thu','Fri'],[15,60,5]],["Muffins Ms. Rosa baked",'muffins',['Mon','Tue','Wed','Thu','Fri'],[20,75,5]],
 ['Miles Skyla flew','miles',['Week 1','Week 2','Week 3','Week 4'],[30,90,10]],["Riders on Ozzy's train",'riders',['Mon','Tue','Wed','Thu','Fri'],[40,95,5]],
 ['Pages the Elder Wiz read','pages',['Mon','Tue','Wed','Thu','Fri'],[12,48,1]],["Coins in Grumbleroot's toll box",'coins',['Mon','Tue','Wed','Thu','Fri'],[25,90,5]]];
function tMake(n){const [t,u,days,[lo,hi,stp]]=PK(TB);const pre=/Week/.test(days[0])?'in':'on';const k=n||PK([4,5]);let d;do{d=days.slice(0,k).map(x=>[x,stp*R(Math.ceil(lo/stp),Math.floor(hi/stp))]);}while(new Set(d.map(x=>x[1])).size<d.length);
 const html=`<b>${t}</b><table style="margin:4px auto;border-collapse:collapse">`+d.map(([a,b])=>`<tr><td style="padding:1px 12px;border:1px solid #c9c2e8">${a}</td><td style="padding:1px 12px;border:1px solid #c9c2e8;text-align:right">${b}</td></tr>`).join('')+'</table>';
 return {t,u,d,html,pre};}
const TQ={
 most:c=>{const T0=tMake();const few=dk('tqfew',[false,true,false]);const b=T0.d.reduce((x,y)=>(few?y[1]<x[1]:y[1]>x[1])?y:x);return choice(ok({prompt:T0.html+`Which had the <b>${few?'fewest':'most'}</b> ${T0.u}?`,tpl:'{A}',text:`tm ${JSON.stringify(T0.d)} ${few}`,explain:`<p>The ${few?'smallest':'biggest'} number is ${b[1]}, ${T0.pre} <b>${b[0]}</b>.</p>`,nudge:'<p>Compare the tens first.</p>',fast:10}),b[0],T0.d.map(x=>x[0]));},
 range:c=>{const T0=tMake();const mx=T0.d.reduce((x,y)=>y[1]>x[1]?y:x),mn=T0.d.reduce((x,y)=>y[1]<x[1]?y:x);const wk=T0.pre==='in'?'week':'day';return st({prompt:T0.html+`How many more ${T0.u} were there ${T0.pre} the <b>busiest</b> ${wk} than ${T0.pre} the <b>quietest</b> ${wk}?`,tpl:'{A} more',answer:mx[1]-mn[1],text:`trng ${JSON.stringify(T0.d)}`,explain:`<p>Busiest: ${mx[0]} (${mx[1]}). Quietest: ${mn[0]} (${mn[1]}).</p><p>${mx[1]} − ${mn[1]} = <b>${mx[1]-mn[1]}</b></p>`,nudge:'<p>Step 1: find the biggest and smallest numbers. Step 2: subtract.</p>',fast:30});},
 pair3:c=>{for(;;){const T0=tMake(4);const P=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)P.push([T0.d[i],T0.d[j]]);const ab=PK(P);const s0=ab[0][1]+ab[1][1];if(P.filter(p=>p[0][1]+p[1][1]===s0).length!==1)continue;const lab=p=>`${p[0][0]} and ${p[1][0]}`;
   return choice(st({prompt:T0.html+`Which two ${T0.pre==='in'?'weeks':'days'} together had exactly <b>${s0}</b> ${T0.u}?`,tpl:'{A}',text:`tp3 ${JSON.stringify(T0.d)} ${s0}`,explain:`<p>${ab[0][1]} + ${ab[1][1]} = ${s0}, so <b>${lab(ab)}</b>.</p>`,nudge:'<p>Try adding pairs. Look at the ones digits first.</p>',fast:40}),lab(ab),pickN(P.filter(p=>p!==ab),3).map(lab));}},
 diff:c=>{const T0=tMake();const [x,y]=pickN(T0.d,2);const [hi,lo]=x[1]>y[1]?[x,y]:[y,x];return ok({prompt:T0.html+`How many more ${T0.u} ${T0.pre} <b>${hi[0]}</b> than ${T0.pre} <b>${lo[0]}</b>?`,tpl:'{A} more',answer:hi[1]-lo[1],text:`td ${JSON.stringify(T0.d)} ${hi[0]}${lo[0]}`,explain:`<p>${hi[1]} − ${lo[1]} = <b>${hi[1]-lo[1]}</b></p>`,nudge:`<p>Count up from ${lo[1]} to ${hi[1]}: first to the next ten.</p>`});},
 total:c=>{const T0=tMake(3);const s=sum(T0.d.map(x=>x[1]));return ok({prompt:T0.html+`How many ${T0.u} in all?`,tpl:`{A} ${T0.u}`,answer:s,text:`tt ${JSON.stringify(T0.d)}`,explain:`<p>${T0.d.map(x=>x[1]).join(' + ')} = <b>${s}</b></p>`,nudge:'<p>Add the tens first, then the ones.</p>',fast:30});},
 two:c=>{for(;;){const T0=tMake(4);const [A,B,C]=SH(T0.d);const s=A[1]+B[1];if(s===C[1])continue;const big=Math.max(s,C[1]),small=Math.min(s,C[1]);
   return st({prompt:T0.html+`How many more ${T0.u} were there ${s>C[1]?`${T0.pre} <b>${A[0]} and ${B[0]} together</b> than ${T0.pre} <b>${C[0]}</b>`:`${T0.pre} <b>${C[0]}</b> than ${T0.pre} <b>${A[0]} and ${B[0]} together</b>`}?`,tpl:'{A} more',answer:big-small,text:`t2 ${JSON.stringify(T0.d)} ${A[0]}${B[0]}`,explain:`<p>${A[1]} + ${B[1]} = ${s}. ${C[0]}: ${C[1]}.</p><p>${big} − ${small} = <b>${big-small}</b></p>`,nudge:'<p>Step 1: add the two. Step 2: compare.</p>',fast:35});}},
 money:c=>{const T0=tMake(4);const [A,B]=pickN(T0.d,2);const p=R(2,3);const M={'push-ups':[`Coach Flex earns <b>${p} stars</b> for every push-up. How many stars did he earn on <b>${A[0]} and ${B[0]}</b> together?`,'{A} stars'],muffins:[`Ms. Rosa sells each muffin for <b>$${p}</b>. How much money did she get for the muffins baked on <b>${A[0]} and ${B[0]}</b>?`,'$ {A}'],
   miles:[`Skyla eats <b>${p} berries</b> for every mile she flies. How many berries did she eat in <b>${A[0]} and ${B[0]}</b>?`,'{A} berries'],riders:[`Each rider gives Ozzy <b>${p} tickets</b>. How many tickets did he get on <b>${A[0]} and ${B[0]}</b>?`,'{A} tickets'],
   pages:[`The Elder Wiz casts <b>${p} sparkles</b> for every page he reads. How many sparkles did he cast on <b>${A[0]} and ${B[0]}</b>?`,'{A} sparkles'],coins:[`Grumbleroot buys <b>${p} troll snacks</b> with every coin. How many snacks can he buy with the coins from <b>${A[0]} and ${B[0]}</b>?`,'{A} snacks']}[T0.u];
  return st({prompt:T0.html+M[0],tpl:M[1],answer:(A[1]+B[1])*p,text:`tmon ${JSON.stringify(T0.d)} ${A[0]}${B[0]} ${p}`,explain:`<p>${A[1]} + ${B[1]} = ${A[1]+B[1]}.</p><p>${A[1]+B[1]} × ${p} = <b>${(A[1]+B[1])*p}</b></p>`,nudge:`<p>Step 1: add the two. Step 2: multiply by ${p}.</p>`,fast:40});},
 goal:c=>{const T0=tMake(3);const s=sum(T0.d.map(x=>x[1]));const goal=Math.ceil((s+5)/50)*50+50*R(0,1);return st({prompt:T0.html+`The goal is <b>${goal}</b> ${T0.u} in all. How many more are needed to reach the goal?`,tpl:'{A} more',answer:goal-s,text:`tg ${JSON.stringify(T0.d)} ${goal}`,explain:`<p>So far: ${T0.d.map(x=>x[1]).join(' + ')} = ${s}.</p><p>${goal} − ${s} = <b>${goal-s}</b></p>`,nudge:'<p>Step 1: add up the table. Step 2: subtract from the goal.</p>',fast:45});}
};
/* tables: put the question before the table, so table questions open differently */
for(const k of Object.keys(TQ)){const f=TQ[k];TQ[k]=c=>{const q=f(c);const i=q.prompt.indexOf('</table>');if(i>0){const tb=q.prompt.slice(0,i+8);q.prompt=q.prompt.slice(i+8)+'<br>'+tb;}return q;};}
/* ---------- grade 5: patterns on the grid and a map of the island ---------- */
const PLC=[['D','dock'],['L','lighthouse'],['C','cave'],['H','hut'],['T','palm tree'],['F','fort'],['W','well']];
function mapMake(n){const pl=pickN(PLC,n||4);const P=gpts(pl.length,1,9);return {pl,P,vis:{t:'grid',max:10,pts:P.map((p,i)=>[p[0],p[1],pl[i][0]])},key:pl.map(x=>`${x[0]} = ${x[1]}`).join(', ')};}
const MQ={
 what:c=>{const M=mapMake();const i=R(0,3);return choice(ok({vis:M.vis,prompt:`What is at <b>${pt(...M.P[i])}</b>? Use the island map (${M.key}).`,tpl:'the {A}',text:`mw ${JSON.stringify(M.P)} ${i}`,explain:`<p>Go right ${M.P[i][0]}, then up ${M.P[i][1]}.</p><p>You reach the <b>${M.pl[i][1]}</b>.</p>`,nudge:'<p>Across first, then up.</p>',fast:15}),M.pl[i][1],M.pl.map(x=>x[1]));},
 where:c=>{let M,i;do{M=mapMake();i=R(0,3);}while(M.P[i][0]===M.P[i][1]);const [x,y]=M.P[i];return choice(ok({vis:M.vis,prompt:`Where is the <b>${M.pl[i][1]}</b>? Read it off the island map (${M.key}).`,tpl:'{A}',text:`mwh ${JSON.stringify(M.P)} ${i}`,explain:`<p>The ${M.pl[i][1]} is ${x} across and ${y} up: <b>${pt(x,y)}</b>.</p>`,nudge:'<p>The first number is across, the second is up.</p>',fast:15}),pt(x,y),[pt(y,x),pt(x+1,y),pt(x,y-1)]);},
 plot:c=>{for(;;){const M=mapMake(3);const i=R(0,2);const dx=R(-3,4),dy=R(-3,4);if(!dx||!dy)continue;const x=M.P[i][0]+dx,y=M.P[i][1]+dy;if(x<0||x>10||y<0||y>10||M.P.some(p=>p[0]===x&&p[1]===y))continue;
   const w=PK([['Skyla builds her nest','the nest'],['Gizmo hides a battery','the battery'],['Grumbleroot buries a toll coin','the coin']]);
   return PT({prompt:`${w[0]} <b>${Math.abs(dx)}</b> ${dx>0?'right':'left'} and <b>${Math.abs(dy)}</b> ${dy>0?'up':'down'} from the ${M.pl[i][1]}. Tap ${w[1]}. (Map: ${M.key}.)`,text:`mp ${JSON.stringify(M.P)} ${i}${dx}${dy}`,explain:`<p>The ${M.pl[i][1]} is at ${pt(...M.P[i])}.</p><p>x: ${M.P[i][0]} ${dx>0?'+':'−'} ${Math.abs(dx)} = ${x}. y: ${M.P[i][1]} ${dy>0?'+':'−'} ${Math.abs(dy)} = ${y}. Tap <b>${pt(x,y)}</b>.</p>`,nudge:'<p>Right and left change x. Up and down change y.</p>',fast:25},10,x,y,M.P.map((p,j)=>[p[0],p[1],M.pl[j][0]]));}},
 dist:c=>{const pl=pickN(PLC,2);const vert=Math.random()<.5;const k=R(1,9);const a=R(0,4),b=a+R(2,6);const A=vert?[k,a]:[a,k],B=vert?[k,b]:[b,k];
  return ok({vis:{t:'grid',max:10,pts:[[...A,pl[0][0]],[...B,pl[1][0]]]},prompt:`On the map, the ${pl[0][1]} (${pl[0][0]}) is at <b>${pt(...A)}</b> and the ${pl[1][1]} (${pl[1][0]}) is at <b>${pt(...B)}</b>. Each unit is 1 mile. How far apart are they?`,tpl:'{A} miles',answer:b-a,text:`md ${A} ${B} ${pl[0][0]}`,explain:`<p>The ${vert?'x':'y'}-coordinates match (${k}), so subtract the other ones.</p><p>${b} − ${a} = <b>${b-a}</b> miles</p>`,nudge:'<p>Which coordinate is the same? Subtract the other.</p>'});},
 route:c=>{const x1=R(0,4),y1=R(0,4),y2=y1+R(2,5),x2=x1+R(2,6);const [p,q,r]=pickN(PLC,3);const w=who(PK(['ozzy','nana','flex']));
  return st({vis:{t:'grid',max:10,pts:[[x1,y1,p[0]],[x1,y2,q[0]],[x2,y2,r[0]]]},prompt:`${w.N} walks from the ${p[1]} at <b>${pt(x1,y1)}</b> straight to the ${q[1]} at <b>${pt(x1,y2)}</b>, then straight to the ${r[1]} at <b>${pt(x2,y2)}</b>. Each unit is 1 mile. How many miles does ${w.he} walk?`,tpl:'{A} miles',answer:(y2-y1)+(x2-x1),text:`mr ${x1}${y1}${x2}${y2}${w.n}`,explain:`<p>First part: ${y2} − ${y1} = ${y2-y1}. Second part: ${x2} − ${x1} = ${x2-x1}.</p><p>${y2-y1} + ${x2-x1} = <b>${y2-y1+x2-x1}</b> miles</p>`,nudge:'<p>Find each part, then add.</p>',fast:35});},
 loop:c=>{const x1=R(0,4),y1=R(0,4),w=R(2,6),h=R(2,6);const [a,b,d,e]=pickN(PLC,4);const C=[[x1,y1],[x1+w,y1],[x1+w,y1+h],[x1,y1+h]];
  return st({vis:{t:'grid',max:10,pts:C.map((p,i)=>[p[0],p[1],[a,b,d,e][i][0]]),seg:[[...C[0],...C[1]],[...C[1],...C[2]],[...C[2],...C[3]],[...C[3],...C[0]]]},prompt:`Ozzy's island train goes from the ${a[1]} at <b>${pt(...C[0])}</b> to the ${b[1]} at <b>${pt(...C[1])}</b>, to the ${d[1]} at <b>${pt(...C[2])}</b>, to the ${e[1]} at <b>${pt(...C[3])}</b>, and back to the ${a[1]}. Each unit is 1 mile. How long is one trip around?`,tpl:'{A} miles',answer:2*(w+h),text:`mloop ${JSON.stringify(C)}`,explain:`<p>Across: ${x1+w} − ${x1} = ${w}. Up: ${y1+h} − ${y1} = ${h}.</p><p>${w} + ${h} + ${w} + ${h} = <b>${2*(w+h)}</b> miles</p>`,nudge:'<p>Find each side of the track, then add all four.</p>',fast:45});},
 /* patterns: x and y each follow an "add" rule */
 patY:o=>c=>{const C=[];for(const a of o.as)for(const b of o.bs)if(a!==b)for(const k of o.ks)C.push([a,b,k]);const [a,b,k]=dk('py'+o.as+o.bs+o.ks+!!o.start,C);const x0=o.start?R(1,3):0,y0=o.start?R(1,4):0;const w=PK(['Gizmo','Ozzy','Dr. Quartz']);const X=x0+k*a,Y=y0+k*b;
  return (o.start?st:ok)({prompt:`What is y when x reaches <b>${X}</b>? In ${w}'s pattern, x starts at ${x0} and adds <b>${a}</b>, and y starts at ${y0} and adds <b>${b}</b>.<br>Points: ${[0,1,2].map(i=>pt(x0+i*a,y0+i*b)).join(', ')}, …`,tpl:`(${X}, {A})`,answer:Y,text:`py ${x0}${y0} ${a} ${b} ${k} ${w}`,explain:`<p>x goes from ${x0} to ${X}: ${X-x0} ÷ ${a} = ${k} steps.</p><p>y also takes ${k} steps: ${y0} + ${k} × ${b} = <b>${Y}</b></p>`,nudge:'<p>How many steps does x take to get there? y takes the same number of steps.</p>',fast:o.start?40:25});},
 patTimes:c=>{const a=R(1,3),m=R(2,4);const b=a*m;return ok({prompt:`Compare the numbers in each pair: ${[1,2,3].map(i=>pt(i*a,i*b)).join(', ')}, … (x adds <b>${a}</b> each time, y adds <b>${b}</b>.) Each y is how many times its x?`,tpl:'y = {A} × x',answer:m,text:`pt ${a} ${m}`,explain:`<p>${[1,2,3].map(i=>`${i*b} = ${m} × ${i*a}`).join(', ')}.</p><p>y is always <b>${m}</b> times x, because ${b} is ${m} times ${a}.</p>`,nudge:'<p>Compare the numbers in each pair.</p>',fast:20});},
 patPick:c=>{const a=R(1,3),b=R(2,5);if(a===b)return MQ.patPick(c);const k=R(4,6);const r=pt(k*a,k*b);return choice(ok({prompt:`Which point fits <b>both</b> rules? Rule for x: start at 0, add <b>${a}</b>. Rule for y: start at 0, add <b>${b}</b>.`,tpl:'{A}',text:`pp ${a} ${b} ${k}`,explain:`<p>After ${k} steps: x = ${k} × ${a} = ${k*a}, y = ${k} × ${b} = ${k*b}.</p><p><b>${r}</b></p>`,nudge:'<p>Both numbers must come from the same number of steps.</p>',fast:25}),r,[pt(k*b,k*a),pt(k*a,k*b+b),pt(k*a+a,k*b+1)]);},
 patPlot:o=>c=>{const C=[];if(o.start){for(let x0=0;x0<=2;x0++)for(let y0=1;y0<=3;y0++)for(let a=1;a<=2;a++)for(let b=1;b<=3;b++)if(x0+3*a<=10&&y0+3*b<=10)C.push([x0,y0,a,b]);}else{for(let a=1;a<=3;a++)for(let b=1;b<=3;b++)if(a!==b)C.push([0,0,a,b]);}const [x0,y0,a,b]=dk('ppl'+!!o.start,C);
  const P=[0,1,2].map(i=>[x0+i*a,y0+i*b,String.fromCharCode(80+i)]);const nx=x0+3*a,ny=y0+3*b;
  const who0=PK(["Nana Paws's dog leaves paw prints",'Skyla leaves footprints in the sand','The Grey Goblin leaves muddy footprints',"Ozzy's toy train drops pebbles"]);return PT({prompt:`${who0} at P, Q and R. x starts at ${x0} and adds <b>${a}</b>; y starts at ${y0} and adds <b>${b}</b>. Tap where the <b>next</b> one goes.`,text:`ppl ${x0}${y0}${a}${b}`,explain:`<p>R is at ${pt(x0+2*a,y0+2*b)}. Add ${a} to x and ${b} to y.</p><p>The next one is at <b>${pt(nx,ny)}</b>.</p>`,nudge:'<p>Start at R. Use both rules once more.</p>',fast:25},10,nx,ny,P);}
};
/* ---------- grade 1 ---------- */
const T1={kind:'tally',maxU:9,maxSum:20,nc:3},G1p={kind:'pg',maxU:9,maxSum:20,nc:3};
const gl1={
 tf:c=>{const g=gD(PK([T1,G1p]));return Object.assign(tfQ('Is each sentence about the chart true or false?',gStmts(g,2),'Count each one first.'),{vis:g.vis,text:`g1tf ${JSON.stringify(g.data)} ${Math.random()}`});},
 pickMore:c=>{for(;;){const g=gD(PK([T1,G1p]));const [A,B]=pickN(g.data,2);const d=B[1]-A[1];if(d<1||d>4)continue;if(g.data.filter(x=>x[1]-A[1]===d).length!==1)continue;
   return choice(st({vis:g.vis,prompt:`Find the row that has <b>${d}</b> more ${d===1?U1(g.th):g.th.u} than <b>${A[0]}</b>. Which one is it?`,tpl:'{A}',text:`g1pm ${JSON.stringify(g.data)} ${A[0]}`,explain:g.read+`<p>${A[0]} has ${A[1]}. ${A[1]} + ${d} = ${B[1]}, and that is <b>${B[0]}</b>.</p>`,nudge:`<p>Count on ${d} from ${A[0]}'s number.</p>`}),B[0],g.data.map(x=>x[0]));}},
 oneMore:c=>{const g=gD(T1);const [n,v]=PK(g.data);const k=R(1,3);return st({vis:g.vis,prompt:`${g.th.add(`<b>${k}</b>`,n)}. Now how many ${gOf(g.th,n)}?`,tpl:`{A} ${g.th.u}`,answer:v+k,text:`g1om ${JSON.stringify(g.data)} ${n} ${k}`,explain:g.read+`<p>${n} had ${v}.</p><p>${v} + ${k} = <b>${v+k}</b></p>`,nudge:`<p>Read ${n} first. Then count on ${k}.</p>`});},
 count5:c=>{for(;;){const g=gD(PK([T1,G1p]));const N0=R(3,6);const k=g.data.filter(x=>x[1]>N0).length;if(!k)continue;return ok({vis:g.vis,prompt:`Count the rows that show <b>more than ${N0}</b> ${g.th.u}. How many rows is that?`,tpl:'{A} rows',answer:k,text:`g1c5 ${JSON.stringify(g.data)} ${N0}`,explain:g.read+`<p>${g.data.map(x=>`${x[0]}: ${x[1]}${x[1]>N0?' ✓':''}`).join('<br>')}</p><p><b>${k}</b> ${k===1?'row':'rows'}.</p>`,nudge:`<p>Check each row: is it more than ${N0}?</p>`,fast:15});}},
 erase:c=>{const g=gD(T1);const [n,v]=PK(g.data.filter(x=>x[1]>=3));const k=R(1,Math.min(3,v-1));const s=sum(g.vals);return st({vis:g.vis,prompt:`The Grey Goblin erases <b>${k}</b> tally ${PL(k,'mark')} from <b>${n}</b>. How many ${g.th.u} are on the chart in all now?`,tpl:`{A} ${g.th.u}`,answer:s-k,text:`g1er ${JSON.stringify(g.data)} ${n} ${k}`,explain:g.read+`<p>In all: ${g.vals.join(' + ')} = ${s}.</p><p>${s} − ${k} = <b>${s-k}</b></p>`,nudge:'<p>Step 1: find the total. Step 2: take away the erased marks.</p>',fast:30});}
};
PLAN.def('graph',1,[
 [GQ.read(T1),GQ.most(G1p),GQ.read(G1p),GQ.most(T1)],
 [GQ.more(G1p),GQ.all(T1),GQ.tie(G1p),GQ.both(T1),GQ.most(T1),GQ.goal(Object.assign({},G1p,{maxU:7})),gl1.count5,gl1.tf,GQ.order(T1),gl1.oneMore],
 [GQ.more(T1),GQ.all(T1),GQ.tie(G1p),GQ.both(G1p),gl1.tf,GQ.goal(Object.assign({},G1p,{maxU:7})),GQ.two(T1),gl1.pickMore,GQ.missing(G1p),GQ.which2(T1)],
 [GQ.two(T1),GQ.tie(T1),GQ.all(T1),GQ.more(G1p),gl1.tf,gl1.pickMore,GQ.change(T1),gl1.erase,GQ.which2(G1p),GQ.missing(T1)],
 [GQ.change(T1),gl1.erase,GQ.two(G1p),GQ.left(T1),gl1.pickMore,GQ.goal(T1),GQ.tie(G1p),GQ.range(T1),GQ.missing(G1p),GQ.which2(T1)]]);

/* ---------- grade 2: picture and bar graphs (scale 1, up to 4 groups), line plots of whole-number lengths ---------- */
const P2g={kind:'pg',maxU:9,nc:4},B2={kind:'bar',maxU:12,nc:4},B2s={kind:'bar',maxU:10,nc:3};
const LW={den:1,start:[3,6],nt:5,minM:6,maxM:12,th:t=>t.sz==='M'};
PLAN.def('graph',2,[
 [GQ.read(B2),GQ.more(B2s),GQ.both(P2g),LQ.count(LW),GQ.most(B2),GQ.sel(B2),GQ.all(Object.assign({},P2g,{maxU:6})),LQ.total(LW),GQ.order(B2)],
 [GQ.all(Object.assign({},P2g,{maxU:8})),GQ.more(P2g),LQ.count(LW),LQ.total(LW),GQ.sel(B2),GQ.tie(B2),GQ.read(B2),LQ.most(LW),GQ.missing(B2),GQ.which2(P2g)],
 [GQ.two(B2),LQ.diff(LW),LQ.most(LW),GQ.tf(B2),GQ.left(P2g),GQ.goal(B2),LQ.fromList,LQ.gt(LW),GQ.which2(B2),GQ.order(P2g)],
 [GQ.two(P2g),LQ.gt(LW),GQ.tf(P2g),GQ.all(B2),GQ.change(B2),LQ.diff(LW),GQ.sel(P2g),GQ.range(B2),GQ.missing(P2g),GQ.which2(B2)],
 [GQ.change(P2g),GQ.two({kind:'pg',key:2,maxU:6,nc:4}),GQ.range(B2),LQ.fromList,GQ.read({kind:'pg',key:2,maxU:8,nc:4}),GQ.tf(B2),GQ.tie({kind:'pg',key:2,maxU:7,nc:4}),GQ.goal({kind:'pg',key:2,maxU:7,nc:4}),GQ.missing(B2),GQ.which2(B2)]]);

/* ---------- grade 3: scaled picture and bar graphs (keys of 2, 5, 10, half pictures), line plots in halves and quarters ---------- */
const K2={kind:'pg',key:2,maxU:7,half:true},Bs2={kind:'bar',key:2,maxU:8,half:true},K5={kind:'pg',key:5,maxU:7},Bs5={kind:'bar',key:5,maxU:8},K10={kind:'pg',key:10,maxU:6,half:true},Bs10={kind:'bar',key:10,maxU:8,half:true};
const LQ4={den:4,start:[4,8],nt:5,minM:6,maxM:12,th:t=>t.sz==='S'},LH2={den:2,start:[2,4],nt:5,minM:6,maxM:12,th:t=>t.sz==='S'};
PLAN.def('graph',3,[
 [GQ.read(K2),GQ.more(Bs2),GQ.pics({kind:'pg',key:2,maxU:7}),LQ.count(LH2),LQ.place(LH2),GQ.both(Object.assign({},K2,{maxU:5})),GQ.most(Bs2),LQ.total(LH2),GQ.order(K2),GQ.missing(Bs2)],
 [GQ.read(K5),GQ.more(Bs5),GQ.both(K5),LQ.count(LQ4),GQ.sel(Bs5),GQ.all(Object.assign({nc:3},K5)),LQ.most(LQ4),GQ.tie(Bs5),GQ.missing(K5),GQ.which2(Bs5)],
 [GQ.read(K10),GQ.more(Bs10),GQ.all(Object.assign({nc:3},K5)),GQ.both(K10),LQ.gt(LQ4),LQ.place(Object.assign({frac:1},LQ4)),GQ.tf(Bs10),GQ.goal(Bs5),GQ.which2(K10),GQ.missing(Bs5)],
 [GQ.two(Bs5),GQ.range(K10),GQ.pics({kind:'pg',key:10,maxU:6,half:true}),LQ.most(LQ4),LQ.place(Object.assign({frac:1,hard:1},LQ4)),GQ.tf(K5),GQ.more(Bs10),GQ.change(K5),GQ.missing(Bs10),GQ.which2(K5)],
 [GQ.change(Bs5),GQ.goal(Bs10),GQ.two(K2),GQ.tie(K10),GQ.left(K5),LQ.gt(LQ4),GQ.sel(K10),GQ.range(Bs5),GQ.which2(Bs10),GQ.missing(K5)]]);

/* ---------- grade 4: line plots in 1/2, 1/4, 1/8; tables; which statements are true ---------- */
const SX=t=>t.sz!=='M'&&t.how!=='hold';const L4={den:4,start:[1,1],nt:4,minM:5,maxM:10,th:SX},L8={den:8,start:[1,4],nt:5,minM:5,maxM:11,th:SX},L8s={den:8,start:[1,3],nt:5,minM:4,maxM:6,maxEach:2,th:SX};
PLAN.def('graph',4,[
 [TQ.most,TQ.diff,TQ.total,LQ.count(L4),LQ.place(L4),LQ.total(L4),LQ.most(L4),LQ.gt(L4),GQ.missing(Bs10),GQ.which2(K10)],
 [LQ.diff(L4),LQ.at(L4),LQ.pair(L4),TQ.range,LQ.stm(Object.assign({multi:1},L4)),LQ.count(L8),LQ.place(L8),TQ.total,GQ.missing(Bs5),TQ.diff],
 [LQ.diff(L8),LQ.at(L8),LQ.pair(L8),LQ.stm(L8),TQ.two,TQ.pair3,LQ.gt(L8),LQ.most(L8),GQ.which2(Bs10),TQ.total],
 [LQ.all(Object.assign({maxTot:24},L8s)),LQ.diff(L8),LQ.stm(Object.assign({multi:1},L8)),TQ.goal,LQ.at(L8),LQ.place(Object.assign({frac:1,hard:1},L8)),TQ.range,LQ.gt(L8),TQ.pair3,GQ.missing(Bs10)],
 [TQ.money,TQ.two,LQ.all(Object.assign({maxTot:24},L8s)),LQ.jug(L8s),LQ.stm(Object.assign({multi:1,n:4},L8)),TQ.pair3,LQ.pair(L8),TQ.goal,GQ.which2(Bs10),LQ.gt(L8)]]);

/* ---------- grade 5: line plots with fractions (fair share), graphing patterns, reading the island map ---------- */
const W8={den:8,start:[1,3],nt:5,minM:3,maxM:6,maxEach:2,th:t=>t.how==='hold'};
PLAN.def('graph',5,[
 [LQ.diff(L8),LQ.at(L8),MQ.patY({as:[1],bs:[2,3,4,5],ks:[3,4,5]}),MQ.what,MQ.plot,MQ.where,MQ.dist,LQ.count(L8),LQ.gt(L8),LQ.total(L8)],
 [LQ.all(Object.assign({maxTot:24},L8s)),MQ.patPick,MQ.patPlot({}),LQ.stm(L8),MQ.patTimes,MQ.route,LQ.gt(L8),LQ.pair(L8),MQ.what,LQ.count(L8)],
 [LQ.share(W8),MQ.patPlot({}),MQ.patTimes,MQ.where,MQ.dist,MQ.loop,LQ.diff(L8),LQ.at(L8),LQ.count(L8),LQ.gt(L8)],
 [LQ.share(W8),MQ.patPlot({start:1}),MQ.route,LQ.stm(Object.assign({multi:1},L8)),MQ.patPick,MQ.patY({as:[2,3],bs:[3,5,7],ks:[5,6,7]}),LQ.jug(L8s),MQ.what,LQ.gt(L8),MQ.dist],
 [LQ.share(W8),MQ.route,MQ.patPlot({start:1}),MQ.loop,LQ.jug(L8s),MQ.patY({as:[2,3],bs:[4,5],ks:[4,5,6],start:1}),LQ.all(Object.assign({maxTot:24},L8s)),MQ.patTimes,LQ.at(L8),LQ.stm(Object.assign({multi:1,n:4},L8))]]);



/* ---------- a short how-to the first time each tap format shows up in a grade ---------- */
const HOW={multi:'Tap ALL the right ones, then tap Check ✓.',tf:'Tap True or False on every line, then tap Check ✓.',nlt:'Tap a mark on the number line, then tap Check ✓.',plot:'Tap the point where two grid lines cross, then tap Check ✓.'};
const fmtOf=q=>q&&(q.multi?'multi':q.tf?'tf':q.nlt?'nlt':q.plot?'plot':'');
/* tk = template key for PLAN.q (the same kind is not repeated within a few questions): tap formats by format, others by the text's kind code.
   The how-to line is worked out on first use: the first round in which each format appears in the grade. */
const TKF={multi:'select-all',tf:'tf-table',nlt:'tap-line',plot:'plot'};
function addHow(op,g){const P=PLAN.PLAN[op][g];const raw=P.map(l=>l.slice());let first=null;
 const find=()=>{first={};raw.forEach((list,r)=>list.forEach(mk=>{for(let i=0;i<12;i++){let q;try{q=mk({name:'You',pet:'your pet',grade:g,round:r+1});}catch(e){break;}const f=fmtOf(q);if(f&&!(f in first))first[f]=r;}}));};
 raw.forEach((list,r)=>list.forEach((mk,k)=>{P[r][k]=c=>{const q=mk(c);if(!q)return q;const f=fmtOf(q);if(q.tk==null)q.tk=f?TKF[f]:op+'-'+String(q.text||'').split(' ')[0];
  if(f){if(!first)find();if(first[f]===r&&q.prompt&&!/Check ✓/.test(q.prompt))q.prompt+=`<br><small>${HOW[f]}</small>`;}return q;};}));}
for(const op of ['geo','graph'])for(let g=1;g<=5;g++)if(PLAN.PLAN[op]&&PLAN.PLAN[op][g])addHow(op,g);
})();
