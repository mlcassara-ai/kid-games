/* ================= Play Insights + Teacher report =================
   PART A  Play-pattern tracking: compact per-player aggregates in p.ins (about how kids use the GAME; no free text,
           no personal info). Kept under ~4 KB per player and pruned to the last 60 days.
   PART B  Parent Corner "📊 Play Insights" section (window.MQ_PARENT).
   PART C  Printable teacher report (full-screen overlay + print CSS → "Save as PDF").
   API     window.Insights = {summary(p), summaryText(), copy(), report(pid), closeReport(), flush()}
   p.ins format (v1):
     since  YYMMDD tracking started        mo  YYMM of last monthly decay
     n,ts   finished sessions, their total active seconds
     dw[7] hr[24]  active seconds by local weekday (0=Sun) / hour   (halved each new month → recent-weighted)
     d  {YYMMDD:[secs,answers,right,battles,sessions]}  (last 60 days)
     wk {YYMMDD(monday):{op:[right,wrong]}}             (last 9 weeks)
     lp {op:YYMMDD} last day each skill was practiced
     act{activity:secs}  sc{screen:visits}  f{feature:count}  fs{activity:n} first thing done  ls{activity:n} where they stop
     z  {zone:[wins,losses,flees]}   fx{lose:n} sessions that ended soon (≤3.5 min incl. idle grace) after a lost/fled battle
     cur {t0,la,s,fa,a,ll} the in-progress session (survives reloads)                                          */
(function(){
'use strict';
const IDLE_COUNT=120e3, END_AFTER=300e3, TICK=15e3, KEEP_DAYS=60, KEEP_WEEKS=9;
const NOSESS=['profiles','parent'];
const HUB=['world','map','profiles','parent','rest','create'];
const LEARN=['battle','spell','quiz','hw','library','cafe','skillcheck','office','cave','inner'];
const ACT_NAME={battle:'Math battles',zone:'Choosing battles',spell:'Spelling',quiz:'School quizzes',hw:'Homework practice',library:'Reading (library)',
 camp:'Adventure camp',pethome:'Pet home',cafe:'Café math',cave:'Science cave',inner:'Inner Space ride',village:'Village',leaders:'Leaderboard',
 quests:'Quests board',backpack:'Backpack & shop',skillcheck:'Skill check',office:"Principal's office",rest:'Rest break',create:'Hero setup',world:'Exploring the map',map:'Exploring the map',mastery:'Fact mastery'};
const FEAT_NAME={shop:'shop buys',egg:'eggs bought',hatch:'eggs hatched',spin:'daily spins',quest:'quests claimed',pet:'pet care',gift:'gifts sent',
 fountain:'fountain tosses',chest:'treasure chests',hint:'hints used',spell:'spelling rounds',quiz:'school quizzes',hw:'homework sets',read:'stories read',camp:'camp trips',board:'leaderboard views'};
const actName=a=>ACT_NAME[a]||(a?a[0].toUpperCase()+a.slice(1):'—');
const pad=n=>String(n).padStart(2,'0');
const k6=d=>String(d.getFullYear()).slice(2)+pad(d.getMonth()+1)+pad(d.getDate());
const fromK6=k=>new Date(2000+ +k.slice(0,2),+k.slice(2,4)-1,+k.slice(4,6));
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const monday=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());const w=(x.getDay()+6)%7;x.setDate(x.getDate()-w);return x;};
const daysAgo=k=>Math.round((new Date(new Date().toDateString())-fromK6(k))/864e5);
const hasOp=op=>typeof OPS!=='undefined'&&OPS.includes(op);
const E=s=>typeof esc==='function'?esc(String(s)):String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pl=(n,w,ws)=>n+' '+(n===1?w:(ws||w+'s'));
const players=()=>(typeof state!=='undefined'&&state&&state.players)||[];
const byId=id=>players().find(p=>p.id===id);
const curP=()=>{try{return typeof P==='function'?P():null;}catch(e){return null;}};
const scr=()=>{try{return curScreen;}catch(e){return '';}};

function I(p){
 if(!p.ins||typeof p.ins!=='object')p.ins={v:1,since:k6(new Date())};
 const s=p.ins;s.n=s.n||0;s.ts=s.ts||0;
 if(!Array.isArray(s.dw)||s.dw.length!==7)s.dw=[0,0,0,0,0,0,0];
 if(!Array.isArray(s.hr)||s.hr.length!==24)s.hr=new Array(24).fill(0);
 ['d','wk','lp','act','sc','f','fs','ls','z','fx'].forEach(k=>{if(!s[k]||typeof s[k]!=='object')s[k]={};});
 return s;}
const bump=(o,k,n)=>{o[k]=(o[k]||0)+(n===undefined?1:n);};
function dayRow(s,k){return s.d[k]||(s.d[k]=[0,0,0,0,0]);}

/* ---------- housekeeping: prune to 60 days, monthly decay of habit counters ---------- */
function tidy(s){
 const now=new Date();const cut=k6(addDays(now,-KEEP_DAYS));
 for(const k in s.d)if(k<cut)delete s.d[k];
 const wcut=k6(addDays(monday(now),-7*(KEEP_WEEKS-1)));
 for(const k in s.wk)if(k<wcut)delete s.wk[k];
 const mo=k6(now).slice(0,4);
 if(s.mo&&s.mo!==mo){
  const half=o=>{for(const k in o){o[k]=Math.floor(o[k]/2);if(!o[k])delete o[k];}};
  [s.act,s.sc,s.f,s.fs,s.ls,s.fx].forEach(half);
  s.dw=s.dw.map(v=>Math.floor(v/2));s.hr=s.hr.map(v=>Math.floor(v/2));}
 s.mo=mo;
 // hard size guard (screen names are open-ended)
 const trim=(o,max)=>{const e=Object.entries(o);if(e.length>max){e.sort((a,b)=>b[1]-a[1]).slice(max).forEach(([k])=>delete o[k]);}};
 trim(s.sc,30);trim(s.act,30);trim(s.fs,12);trim(s.ls,12);trim(s.f,24);
}

/* ---------- session tracking ---------- */
let L=null;            // live session: {pid, acc (ms accounted up to)}
let lastInput=Date.now(), hiddenAt=0;

function actOf(){const s=scr();
 if(s==='battle'){try{if(B&&B.mode&&B.mode!=='math')return B.mode;}catch(e){}return 'battle';}
 return s||'world';}

function account(p,now){
 if(!L||!p)return;const s=I(p);const cur=s.cur;if(!cur){L=null;return;}
 const lim=Math.min(now,lastInput+IDLE_COUNT);const dt=lim-L.acc;
 if(dt>500&&dt<20*60e3){
  const sec=Math.round(dt/1000);const d=new Date(lim);
  cur.s+=sec;dayRow(s,k6(d))[0]+=sec;s.dw[d.getDay()]+=sec;s.hr[d.getHours()]+=sec;
  const a=actOf();bump(s.act,a==='zone'?'battle':a==='map'?'world':a,sec);
  if(!HUB.includes(a)){cur.a=a;if(!cur.fa)cur.fa=a;}
  cur.la=lim;}
 L.acc=Math.max(L.acc,now);}

function startSession(p){
 if(!p)return;const now=Date.now();
 if(L&&L.pid!==p.id)endSession(byId(L.pid),'switch');
 if(L&&L.pid===p.id)return;
 const s=I(p);tidy(s);
 if(s.cur&&now-(s.cur.la||0)<END_AFTER){/* reload / quick return: keep going */}
 else{if(s.cur)finish(p,s);s.cur={t0:now,la:now,s:0,fa:'',a:''};}
 L={pid:p.id,acc:now};lastInput=now;}

function finish(p,s){ // close s.cur into the aggregates
 const c=s.cur;delete s.cur;if(!c||c.s<15)return;
 s.n++;s.ts+=c.s;dayRow(s,k6(new Date(c.t0)))[4]++;
 bump(s.fs,c.fa||'world');bump(s.ls,c.a||'world');
 if(c.ll&&c.la-c.ll<210e3)bump(s.fx,'lose');}

function endSession(p,why){
 if(!L)return;if(!p){L=null;return;}
 const s=I(p);try{syncDeltas(p);}catch(e){}if(why!=='hidden')account(p,Date.now());
 finish(p,s);L=null;tidy(s);
 try{save();}catch(e){}}

function maybeAutoStart(){ // input after an idle-ended session while a player is still in the game
 if(L)return;const p=curP();if(!p||!p.setup)return;if(NOSESS.includes(scr()))return;startSession(p);}

function onInput(){
 const now=Date.now();
 if(L){if(now-lastInput>IDLE_COUNT){const p=byId(L.pid);account(p,now);L.acc=now;}}
 lastInput=now;if(!L)maybeAutoStart();}

function tick(){
 if(!L||document.hidden)return;const p=byId(L.pid);if(!p){L=null;return;}
 const now=Date.now();
 if(now-lastInput>END_AFTER){account(p,now);endSession(p,'idle');return;}
 account(p,now);}

function persistLocal(){try{if(typeof saveLocal==='function')saveLocal();}catch(e){}}
document.addEventListener('pointerdown',onInput,{capture:true,passive:true});
document.addEventListener('keydown',onInput,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{
 const now=Date.now();
 if(document.hidden){if(L){account(byId(L.pid),now);persistLocal();}hiddenAt=now;return;}
 if(L){if(hiddenAt&&now-hiddenAt>END_AFTER){endSession(byId(L.pid),'hidden');lastInput=now;maybeAutoStart();}else{L.acc=now;lastInput=now;}}
 hiddenAt=0;});
window.addEventListener('pagehide',()=>{if(L){account(byId(L.pid),Date.now());persistLocal();}});
setInterval(()=>{try{tick();}catch(e){console.warn('insights tick',e);}},TICK);

/* ---------- hooks ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({
 session(p){try{startSession(p);}catch(e){console.warn(e);}},
 screen(name){
  if(!L)return;const p=byId(L.pid);if(!p)return;
  if(NOSESS.includes(name)){endSession(p,'leave');return;}
  const s=I(p);account(p,Date.now());bump(s.sc,name);
  if(name==='leaders')bump(s.f,'board');
  if(!HUB.includes(name)&&s.cur){s.cur.a=name;if(!s.cur.fa)s.cur.fa=name==='zone'?'battle':name;}},
 answer(p,q,ok){
  if(!p||!q)return;const s=I(p);const k=k6(new Date());const r=dayRow(s,k);r[1]++;if(ok)r[2]++;
  const op=q.op;if(!hasOp(op))return;
  const wk=k6(monday(new Date()));const w=s.wk[wk]||(s.wk[wk]={});const c=w[op]||(w[op]=[0,0]);c[ok?0:1]++;s.lp[op]=k;
  if(s.cur&&!s.cur.fa)s.cur.fa='battle';},
 battle(p,b){if(!p||!b)return;const s=I(p);dayRow(s,k6(new Date()))[3]++;const z=s.z[b.zone]||(s.z[b.zone]=[0,0,0]);z[b.win?0:1]++;
  if(!b.win&&s.cur)s.cur.ll=Date.now();},
 flee(p,b){if(!p||!b)return;const s=I(p);const z=s.z[b.zone]||(s.z[b.zone]=[0,0,0]);z[2]++;if(s.cur)s.cur.ll=Date.now();}
});

/* feature counters: wrap game functions (only if present; never break the original) */
function wrap(fn,feat,ok){
 const orig=window[fn];if(typeof orig!=='function'||orig.__ins)return;
 const w=function(){const p=curP();const before=p?{c:p.coins,e:p.eggs,pets:(p.pets||[]).length,sd:p.spinDay}:null;
  const r=orig.apply(this,arguments);
  try{if(p&&L&&L.pid===p.id){const after={c:p.coins,e:p.eggs,pets:(p.pets||[]).length,sd:p.spinDay};if(!ok||ok(before,after,arguments))bump(I(p).f,feat);}}catch(e){}
  return r;};
 w.__ins=true;try{window[fn]=w;}catch(e){}}
function wrapAll(){
 wrap('buyItem','shop',(b,a)=>a.c<b.c);wrap('buyEgg','egg',(b,a)=>a.c<b.c||a.e>b.e);wrap('hatchEgg','hatch',(b,a)=>a.pets>b.pets||a.e<b.e);
 wrap('doSpin','spin',(b,a)=>a.sd!==b.sd);wrap('questClaim','quest');wrap('feedPet','pet');wrap('playPet','pet');wrap('patPet','pet');
 wrap('giftSend','gift');wrap('fountainToss','fountain');wrap('wChestTry','chest');wrap('useHint','hint');wrap('startSpell','spell');
 wrap('startQuest','quiz',(b,a,args)=>args[0]==='quiz');
 const sq=window.startQuest;if(sq&&sq.__ins){/* also count homework */const o=sq;const w=function(k){const r=o.apply(this,arguments);try{const p=curP();if(k==='hw'&&p&&L)bump(I(p).f,'hw');}catch(e){}return r;};w.__ins=true;window.startQuest=w;}
}
/* stories read + camp trips: count from state deltas (cheap, once per tick of the parent view / session end) */
function syncDeltas(p){const s=I(p);const log=p.readLog||[],ct=(p.adv&&p.adv.trips)||0;const last=log[log.length-1];const sig=last?last.d+'|'+last.t:'';
 if(s.rs===undefined){s.rs=sig;s.ct0=ct;return;}
 if(sig!==s.rs){let i=log.length-1;while(i>=0&&(log[i].d+'|'+log[i].t)!==s.rs)i--;bump(s.f,'read',log.length-1-i);s.rs=sig;}
 if(ct>s.ct0)bump(s.f,'camp',ct-s.ct0);s.ct0=ct;}
(function reg(){
 if(typeof SCREENS!=='undefined'&&typeof buyItem==='function'){wrapAll();
  // finish sessions left open by a closed tab (older than 5 min)
  try{players().forEach(p=>{if(p.ins&&p.ins.cur&&Date.now()-(p.ins.cur.la||0)>END_AFTER){finish(p,p.ins);}});}catch(e){}
 }else setTimeout(reg,40);})();
setInterval(()=>{try{if(L){const p=byId(L.pid);if(p)syncDeltas(p);}}catch(e){}},60e3);

/* ================= analysis ================= */
const gExp=p=>{try{return gradeExp(p);}catch(e){return (p.grade||3)+2;}};
const maxL=op=>{try{return maxLv(op);}catch(e){return 10;}};
const levelOf=(p,op)=>{try{return lvl(p,op);}catch(e){return Math.floor((p.skill&&p.skill[op])||1);}};
const expFor=(p,op)=>Math.min(gExp(p),maxL(op));
const BASIC=['add','sub','mul','div'];
function gradeOfLevel(L){const g=L<=10?L-2:Math.floor((L+6)/2);return g;}
function gradeWord(g){if(g<=0)return 'Kindergarten';const s=['th','st','nd','rd'];const v=g%100;return g+(s[(v-20)%10]||s[v]||s[0])+' grade';}
const descOf=(op,L)=>{try{return (LEVEL_DESC[op]&&LEVEL_DESC[op][L])||(XDESC[op]&&XDESC[op][L])||'';}catch(e){return '';}};
const opName=op=>{try{return OPNAME[op]||op;}catch(e){return op;}};

function weekAcc(s,op,fromK,toK){let r=0,w=0;for(const k in s.wk){if(k>=fromK&&(!toK||k<toK)){const c=s.wk[k][op];if(c){r+=c[0];w+=c[1];}}}return {r,w,n:r+w,acc:r+w?r/(r+w):null};}

function summary(p){
 const s=I(p);const now=new Date();const today=k6(now);
 const d28=k6(addDays(now,-27));const mon=monday(now);
 const recentK=k6(addDays(mon,-7)); // this week + last week ≈ last 2 weeks
 // 4 weekly buckets (oldest → newest), weekday vs weekend seconds
 const weeks=[];for(let i=3;i>=0;i--){const st=addDays(mon,-7*i);let wd=0,we=0,ans=0;for(let j=0;j<7;j++){const dd=addDays(st,j);const r=s.d[k6(dd)];if(r){const dow=dd.getDay();if(dow===0||dow===6)we+=r[0];else wd+=r[0];ans+=r[1];}}weeks.push({start:k6(st),wd,we,ans});}
 let m28=0,a28=0,r28=0,s28=0,days28=0,wdS=0,weS=0;
 for(const k in s.d){if(k>=d28){const r=s.d[k];m28+=r[0];a28+=r[1];r28+=r[2];s28+=r[4];if(r[0]>60||r[1])days28++;const dw=fromK6(k).getDay();if(dw===0||dw===6)weS+=r[0];else wdS+=r[0];}}
 const top=(o,n)=>Object.entries(o).filter(([k,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,n);
 const favs=top(s.act,6).filter(([k])=>k!=='world'&&k!=='rest').slice(0,3).map(([k,v])=>({act:k,name:actName(k),min:Math.round(v/60)}));
 const first=top(s.fs,1)[0],stop=top(s.ls,1)[0];
 const nFs=Object.values(s.fs).reduce((a,b)=>a+b,0)||1,nLs=Object.values(s.ls).reduce((a,b)=>a+b,0)||1;
 const skills=[];
 (typeof OPS!=='undefined'?OPS:[]).forEach(op=>{const st=(p.stats&&p.stats[op])||{r:0,w:0};const n=st.r+st.w;const rec=weekAcc(s,op,recentK);const before=weekAcc(s,op,'000000',recentK);
  if(!n&&!rec.n)return;const Lv=levelOf(p,op),ex=expFor(p,op);
  const spark=[];for(let i=7;i>=0;i--){const wk=k6(addDays(mon,-7*i));const c=s.wk[wk]&&s.wk[wk][op];spark.push(c&&c[0]+c[1]>=3?c[0]/(c[0]+c[1]):null);}
  skills.push({op,name:opName(op),level:Lv,max:maxL(op),expected:ex,desc:descOf(op,Lv),n,acc:n?st.r/n:null,n14:rec.n,acc14:rec.acc,nBefore:before.n,accBefore:before.acc,last:s.lp[op]||null,spark,basic:BASIC.includes(op)});});
 const lastDay=Object.keys(s.d).filter(k=>s.d[k][0]>0||s.d[k][1]>0).sort().pop()||Object.keys(p.daily||{}).map(k=>k.replace(/-/g,'').slice(2)).sort().pop()||null;
 const learnS=Object.entries(s.act).filter(([k])=>LEARN.includes(k)).reduce((a,[,v])=>a+v,0),allS=Object.values(s.act).reduce((a,b)=>a+b,0);
 const out={name:p.name,grade:p.adult?'Adult':p.grade,adult:!!p.adult,trackingSince:s.since,
  last28:{minutes:Math.round(m28/60),weekdayMin:Math.round(wdS/60),weekendMin:Math.round(weS/60),daysPlayed:days28,sessions:s28,answers:a28,accuracy:a28?Math.round(r28/a28*100):null},
  weeks:weeks.map(w=>({week:w.start,weekdayMin:Math.round(w.wd/60),weekendMin:Math.round(w.we/60),answers:w.ans})),
  sessions:{count:s.n,avgMin:s.n?Math.round(s.ts/s.n/60*10)/10:null,endedAfterLoss:s.fx.lose||0},
  favourites:favs,learningShare:allS?Math.round(learnS/allS*100):null,
  firstThing:first?{act:first[0],name:actName(first[0]),pct:Math.round(first[1]/nFs*100)}:null,
  usualStop:stop?{act:stop[0],name:actName(stop[0]),pct:Math.round(stop[1]/nLs*100)}:null,
  features:Object.fromEntries(top(s.f,20)),zones:s.z,byDow:s.dw.map(v=>Math.round(v/60)),byHour:s.hr.map(v=>Math.round(v/60)),
  lastPlayed:lastDay,skills};
 out.observations=observe(p,s,out);
 return out;}

const DOWN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function partOfDay(hr){const parts={mornings:[5,12],afternoons:[12,17],evenings:[17,21],'late evenings':[21,29]};let tot=hr.reduce((a,b)=>a+b,0);if(!tot)return null;let best=null,bv=0;for(const k in parts){let v=0;for(let h=parts[k][0];h<parts[k][1];h++)v+=hr[h%24];if(v>bv){bv=v;best=k;}}return bv/tot>=.5?best:null;}
function observe(p,s,o){
 const out=[];const pct=v=>Math.round(v*100)+'%';
 const lp=o.lastPlayed?daysAgo(o.lastPlayed):null;
 if(lp!==null&&lp>=7)out.push({pri:9,t:`Hasn't played in ${lp} days.`});
 // timing
 const tot=s.dw.reduce((a,b)=>a+b,0);
 if(tot>=1800){const part=partOfDay(s.hr);const mx=s.dw.indexOf(Math.max(...s.dw));const share=s.dw[mx]/tot;const we=(s.dw[0]+s.dw[6])/tot;
  let t=null;
  if(share>=.35)t=`Plays mostly ${DOWN[mx]}${part?' '+part:'s'}.`;
  else if(we>=.6)t=`Plays mostly at weekends${part?', usually '+part:''}.`;
  else if(we<=.15)t=`Plays mostly on school days${part?', usually '+part:''}.`;
  else if(part)t=`Usually plays in the ${part.replace(/s$/,'')}.`;
  if(t)out.push({pri:4,t});}
 // skills not practiced lately (only once tracking has run ≥ 14 days)
 const tracked=s.since?daysAgo(s.since):0;
 if(tracked>=14){const stale=o.skills.filter(k=>k.n>=20&&(!k.last||daysAgo(k.last)>=14)).sort((a,b)=>(b.basic-a.basic)||(b.n-a.n))[0];
  if(stale){const dd=stale.last?daysAgo(stale.last):null;out.push({pri:7,t:`Hasn't practiced ${stale.name.toLowerCase()} in ${dd!==null?dd+' days':'over 2 weeks'}.`});}}
 // low recent accuracy
 const recentDown=op=>(p.log||[]).some(l=>l.op===op&&l.to<l.from&&l.d&&daysAgo(l.d.replace(/-/g,'').slice(2))<=14);
 o.skills.filter(k=>k.n14>=15&&k.acc14<.7).sort((a,b)=>a.acc14-b.acc14).slice(0,1).forEach(k=>{
  out.push({pri:8,t:`Accuracy in ${k.name.toLowerCase()} is ${pct(k.acc14)} over the last 2 weeks — ${recentDown(k.op)?'the game has stepped it down to make it easier.':'the game will ease off if it stays low.'}`});});
 // strength
 const strong=o.skills.filter(k=>k.n14>=20&&k.acc14>=.9&&k.level>=k.expected).sort((a,b)=>b.acc14-a.acc14)[0];
 if(strong)out.push({pri:3,t:`Strong in ${strong.name.toLowerCase()}: ${pct(strong.acc14)} right at level ${strong.level} (at or above grade expectation).`});
 // improving
 const imp=o.skills.filter(k=>k.n14>=15&&k.nBefore>=15&&k.acc14-k.accBefore>=.1).sort((a,b)=>(b.acc14-b.accBefore)-(a.acc14-a.accBefore))[0];
 if(imp)out.push({pri:5,t:`${imp.name} is improving: ${pct(imp.accBefore)} → ${pct(imp.acc14)}.`});
 if(s.n>=5&&(s.fx.lose||0)/s.n>=.3)out.push({pri:6,t:`Often stops playing right after losing a battle (${s.fx.lose} of ${s.n} sessions).`});
 if(s.n>=5&&s.ts/s.n<300)out.push({pri:4,t:`Sessions are short — about ${Math.max(1,Math.round(s.ts/s.n/60))} min on average.`});
 if(o.learningShare!==null&&tot>=1800&&o.learningShare<40)out.push({pri:5,t:`Only ${o.learningShare}% of play time is on learning activities; the rest is pets, shop and exploring.`});
 return out.sort((a,b)=>b.pri-a.pri).slice(0,3).map(x=>x.t);}

/* ================= PART B: Parent Corner section ================= */
const CSS=`
.ins-wrap .ins-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between}
.ins-wrap details.ins-kid{border:1px solid #e3ddff;border-radius:16px;margin:10px 0;background:#fbfaff;overflow:hidden}
.ins-wrap details.ins-kid>summary{cursor:pointer;padding:12px 14px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;list-style:none}
.ins-wrap details.ins-kid>summary::-webkit-details-marker{display:none}
.ins-wrap details.ins-kid>summary:before{content:'▸';color:#7c5cff;font-weight:900;margin-right:2px}
.ins-wrap details[open].ins-kid>summary:before{content:'▾'}
.ins-wrap .ins-sum-name{font-weight:900;font-size:17px}.ins-wrap .ins-sum-meta{color:#666;font-size:13px}
.ins-body{padding:4px 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ins-box{background:#fff;border:1px solid #eee;border-radius:12px;padding:10px 12px;min-width:0}
.ins-box h5{margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#6b5fb5}
.ins-box.wide{grid-column:1/-1}
.ins-bars{display:flex;gap:10px;align-items:flex-end;height:92px;padding-top:4px}
.ins-bars .wk{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}
.ins-bars .pr{display:flex;gap:3px;align-items:flex-end;height:70px}
.ins-bars i{display:block;width:14px;border-radius:4px 4px 0 0;min-height:2px}
.ins-bars i.wd{background:#4c6ef5}.ins-bars i.we{background:#f59f00}
.ins-bars small{font-size:10px;color:#777;white-space:nowrap}
.ins-leg{font-size:11px;color:#666;display:flex;gap:10px;margin-top:4px}.ins-leg b{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:3px;vertical-align:-1px}
.ins-kv{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:14px}.ins-kv span{color:#666}
.ins-heat{display:grid;grid-template-columns:repeat(24,1fr);gap:1px;margin:4px 0}.ins-heat i{height:12px;border-radius:2px;background:#eee}
.ins-heat.dow{grid-template-columns:repeat(7,1fr)}.ins-heat.dow i{height:16px;font-style:normal;font-size:10px;text-align:center;line-height:16px;color:#333}
.ins-sk{width:100%;border-collapse:collapse;font-size:13px}.ins-sk td{padding:3px 4px;border-top:1px solid #f1f1f1;vertical-align:middle}
.ins-sk .accb{display:inline-block;width:60px;height:8px;background:#eee;border-radius:4px;vertical-align:middle;margin-right:4px;overflow:hidden}.ins-sk .accb i{display:block;height:100%}
.ins-sk td.ins-lv{white-space:nowrap;width:92px;text-align:right}.ins-sk td.ins-sp{width:66px}.ins-sk td.ins-ac{width:112px;white-space:nowrap}.ins-sk .ins-up{color:#2b8a3e}.ins-sk .ins-dn{color:#c92a2a}.ins-sk .ins-eq{color:#555}
.ins-obs{margin:0;padding-left:18px;font-size:14px}.ins-obs li{margin:3px 0}
.ins-btns{display:flex;gap:8px;flex-wrap:wrap;grid-column:1/-1}
@media (max-width:640px){.ins-body{grid-template-columns:1fr;padding:4px 8px 10px}.ins-sk td.ins-sp{display:none}.ins-sk td.ins-ac{width:96px}.ins-sk .accb{width:44px}}
/* teacher report */
#ins-rep{position:fixed;inset:0;z-index:99999;background:#dee2e6;overflow:auto;-webkit-overflow-scrolling:touch;color:#111;font-family:Georgia,'Times New Roman',serif}
#ins-rep .bar{position:sticky;top:0;z-index:2;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;background:#343a40;font-family:system-ui,-apple-system,sans-serif}
#ins-rep .bar button,#ins-rep .bar select{font:600 15px system-ui,sans-serif;padding:9px 14px;border-radius:10px;border:0;background:#fff;color:#111}
#ins-rep .bar .go{background:#2f9e44;color:#fff}#ins-rep .bar .sp{flex:1}
#ins-rep .paper{background:#fff;max-width:780px;margin:18px auto 40px;padding:40px 46px;box-shadow:0 4px 24px rgba(0,0,0,.18)}
#ins-rep h1{font-size:23px;margin:0 0 2px;font-weight:700}#ins-rep h2{font-size:15px;margin:20px 0 6px;padding-bottom:3px;border-bottom:1.5px solid #222;text-transform:uppercase;letter-spacing:.06em;font-family:system-ui,-apple-system,sans-serif}
#ins-rep .sub{color:#444;font-size:14px}#ins-rep .hdr{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;border-bottom:3px double #222;padding-bottom:10px}
#ins-rep .hh{font-size:15px;margin:14px 0 6px}
.hdr .r{text-align:right;white-space:nowrap;font-size:13px;color:#333;font-family:system-ui,sans-serif}
#ins-rep .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}
#ins-rep .tile{border:1px solid #bbb;border-radius:6px;padding:8px 6px;text-align:center}#ins-rep .tile b{display:block;font-size:22px;font-family:system-ui,sans-serif}#ins-rep .tile span{font-size:11.5px;color:#444;font-family:system-ui,sans-serif}
#ins-rep table{width:100%;border-collapse:collapse;font-size:12.5px;font-family:system-ui,-apple-system,sans-serif}
#ins-rep th{background:#f1f3f5;text-align:left;font-weight:700;padding:5px 6px;border-bottom:1.5px solid #333;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em}
#ins-rep td{padding:5px 6px;border-bottom:1px solid #ddd;vertical-align:top}#ins-rep td.n{text-align:right;white-space:nowrap}
#ins-rep .tw{overflow-x:auto}
#ins-rep .two{display:grid;grid-template-columns:1fr 1fr;gap:18px}#ins-rep ul{margin:4px 0;padding-left:18px;font-size:13.5px}#ins-rep li{margin:2px 0}
#ins-rep p{font-size:13.5px;margin:4px 0;line-height:1.4}#ins-rep .fine{font-size:11px;color:#555;margin-top:18px;border-top:1px solid #ccc;padding-top:6px;font-family:system-ui,sans-serif}
#ins-rep .muted{color:#666}#ins-rep .fl{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}#ins-rep .fl div{border:1px solid #ccc;border-radius:6px;padding:6px;font-size:12.5px;font-family:system-ui,sans-serif}
#ins-rep .fl .m{height:6px;background:#e9ecef;border-radius:3px;margin-top:4px;overflow:hidden}#ins-rep .fl .m i{display:block;height:100%;background:#495057}
#ins-rep .keep{break-inside:avoid;page-break-inside:avoid}
#ins-rep p.about{font-size:12.5px;margin-top:10px;background:#f8f9fa;border-left:3px solid #495057;padding:6px 10px}
#ins-rep .note{font-size:11px;color:#555;margin:3px 0 5px;font-family:system-ui,sans-serif;text-align:left}
#ins-rep h3.hh{break-after:avoid;page-break-after:avoid}#ins-rep .paper p{text-align:left}
#ins-rep table.pr td{padding:3px 6px}#ins-rep .chg{white-space:nowrap}
#ins-rep .kv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin-top:8px;font-size:12.5px;font-family:system-ui,-apple-system,sans-serif}#ins-rep .kv span{color:#555;font-weight:600;white-space:nowrap}
#ins-rep .why{font-size:11px;color:#a61e1e}#ins-rep .std{font-size:11.5px}#ins-rep .stdn{font-size:10.5px;color:#444}#ins-rep td .muted{font-size:10.5px}
#ins-rep .stdi{font:600 10px system-ui,sans-serif;color:#495057;border:1px solid #adb5bd;border-radius:3px;padding:0 3px;white-space:nowrap}
#ins-rep ol.tips{margin:4px 0;padding-left:20px;font-size:13px}#ins-rep ol.tips li{margin:3px 0}
#ins-rep .two table{align-self:start}
#ins-rep .words{display:grid;grid-template-columns:repeat(4,1fr);gap:3px 12px;font-size:13px;font-family:system-ui,sans-serif}#ins-rep .words span{border-bottom:1px solid #eee;padding:2px 0}#ins-rep .words small{color:#666}
@media (max-width:640px){#ins-rep .paper{margin:0;padding:18px 14px;box-shadow:none}#ins-rep .tiles{grid-template-columns:repeat(2,1fr)}#ins-rep .two{grid-template-columns:1fr}#ins-rep .fl{grid-template-columns:repeat(2,1fr)}#ins-rep .words{grid-template-columns:repeat(2,1fr)}#ins-rep .hdr{flex-direction:column;align-items:flex-start}#ins-rep .hdr .r{text-align:left}#ins-rep table{font-size:11.5px}#ins-rep .bar button,#ins-rep .bar select{padding:8px 10px;font-size:14px}#ins-rep .bar{flex-wrap:nowrap;gap:6px;padding:8px}#ins-rep .bar button,#ins-rep .bar select{white-space:nowrap}#ins-rep .bar .sp{display:none}#ins-rep .ins-long{display:none}}
@page{margin:14mm 13mm}
@media print{
 html.ins-printing,html.ins-printing body{background:#fff!important;height:auto!important;overflow:visible!important;min-height:0!important}
 html.ins-printing body>*:not(#ins-rep){display:none!important}
 html.ins-printing body::before,html.ins-printing body::after{display:none!important}
 #ins-rep{position:static!important;overflow:visible!important;background:#fff!important;inset:auto}
 #ins-rep .bar{display:none!important}
 #ins-rep .paper{box-shadow:none!important;margin:0!important;padding:0!important;max-width:none!important}
 #ins-rep .tw{overflow:visible}
 #ins-rep .tiles{grid-template-columns:repeat(4,1fr)!important}#ins-rep .two{grid-template-columns:1fr 1fr!important}#ins-rep .fl{grid-template-columns:repeat(4,1fr)!important}#ins-rep .words{grid-template-columns:repeat(4,1fr)!important}
 #ins-rep .hdr{flex-direction:row!important;align-items:flex-end!important}#ins-rep .hdr .r{text-align:right!important}
 #ins-rep tr,#ins-rep .tile,#ins-rep li{break-inside:avoid}
 #ins-rep *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}`;
function addCSS(){if(document.getElementById('ins-css'))return;const st=document.createElement('style');st.id='ins-css';st.textContent=CSS;(document.head||document.documentElement).appendChild(st);}
addCSS();

const fmtMin=m=>m<60?m+' min':Math.floor(m/60)+' h '+(m%60?m%60+' min':'');
const fmtDay=k=>{if(!k)return '—';const d=fromK6(k);const n=daysAgo(k);return n===0?'today':n===1?'yesterday':n<7?n+' days ago':d.toLocaleDateString('en-US',{month:'short',day:'numeric'});};
const accCol=a=>a===null?'#adb5bd':a>=.85?'#37b24d':a>=.7?'#f59f00':'#e03131';
function sparkSVG(v){const pts=v.map((a,i)=>a===null?null:[i*8+2,16-a*14]);const segs=[];let cur=[];pts.forEach(p=>{if(p)cur.push(p.join(','));else if(cur.length){segs.push(cur);cur=[];}});if(cur.length)segs.push(cur);
 return `<svg class="spk" width="62" height="18" viewBox="0 0 62 18" aria-hidden="true"><line x1="0" x2="62" y1="${16-.7*14}" y2="${16-.7*14}" stroke="#eee"/>${segs.map(s=>s.length>1?`<polyline points="${s.join(' ')}" fill="none" stroke="#7c5cff" stroke-width="1.6"/>`:`<circle cx="${s[0].split(',')[0]}" cy="${s[0].split(',')[1]}" r="1.8" fill="#7c5cff"/>`).join('')}</svg>`;}

function kidCard(p){
 let o;try{o=summary(p);}catch(e){console.warn(e);return '';}
 const l=o.last28;const mx=Math.max(1,...o.weeks.map(w=>Math.max(w.weekdayMin,w.weekendMin)));
 const bars=o.weeks.map((w,i)=>`<div class="wk"><div class="pr"><i class="wd" style="height:${Math.round(w.weekdayMin/mx*70)}px" title="weekdays ${w.weekdayMin} min"></i><i class="we" style="height:${Math.round(w.weekendMin/mx*70)}px" title="weekend ${w.weekendMin} min"></i></div><small>${i===3?'this wk':fromK6(w.week).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small><small>${w.weekdayMin+w.weekendMin}m</small></div>`).join('');
 const hmax=Math.max(1,...o.byHour),dmax=Math.max(1,...o.byDow);
 const heat=`<div class="ins-heat dow">${o.byDow.map((v,i)=>`<i style="background:rgba(124,92,255,${(v/dmax*.85+.08).toFixed(2)})" title="${DOWN[i]}: ${v} min">${'SMTWTFS'[i]}</i>`).join('')}</div>
  <div class="ins-heat">${o.byHour.map((v,h)=>`<i style="background:rgba(124,92,255,${(v/hmax*.85+.06).toFixed(2)})" title="${h}:00 — ${v} min"></i>`).join('')}</div><div class="ins-leg"><span>12am</span><span style="flex:1;text-align:center">noon</span><span>11pm</span></div>`;
 const sk=o.skills.map(k=>{const a=k.n14>=5?k.acc14:k.acc;const d=k.level-k.expected;const cls=p.adult?'ins-eq':d>0?'ins-up':d<0?'ins-dn':'ins-eq';
  return `<tr><td><b>${E(k.name)}</b></td><td class="ins-sp">${sparkSVG(k.spark)}</td><td class="ins-ac"><span class="accb"><i style="width:${Math.round((a||0)*100)}%;background:${accCol(a)}"></i></span>${a===null?'—':Math.round(a*100)+'%'}</td><td class="ins-lv ${cls}" title="${E(k.desc)}">L${k.level}${p.adult?'':` <small>(exp ${k.expected})</small>`}</td></tr>`;}).join('');
 const feats=Object.entries(o.features).slice(0,6).map(([k,v])=>`${FEAT_NAME[k]||k} ${v}`).join(' · ');
 const obs=o.observations;
 return `<details class="ins-kid"><summary><span class="ins-sum-name">${E(p.name)}</span><span class="ins-sum-meta">${p.adult?'Adult':'Grade '+p.grade} · ${fmtMin(l.minutes)} in last 4 weeks · last played ${fmtDay(o.lastPlayed)}</span></summary>
 <div class="ins-body">
  ${obs.length?`<div class="ins-box wide"><h5>What stands out</h5><ul class="ins-obs">${obs.map(t=>`<li>${E(t)}</li>`).join('')}</ul></div>`:''}
  <div class="ins-box"><h5>Last 4 weeks · minutes</h5><div class="ins-bars">${bars}</div><div class="ins-leg"><span><b style="background:#4c6ef5"></b>weekdays ${l.weekdayMin}m</span><span><b style="background:#f59f00"></b>weekend ${l.weekendMin}m</span></div></div>
  <div class="ins-box"><h5>Sessions</h5><div class="ins-kv"><span>Days played (4 wks)</span><b>${l.daysPlayed}</b><span>Sessions (4 wks)</span><b>${l.sessions}</b><span>Average length</span><b>${o.sessions.avgMin!==null?o.sessions.avgMin+' min':'—'}</b><span>Answers (4 wks)</span><b>${l.answers}${l.accuracy!==null?' <small>('+l.accuracy+'% right)</small>':''}</b><span>Does first</span><b>${o.firstThing?E(o.firstThing.name)+' <small>('+o.firstThing.pct+'%)</small>':'—'}</b><span>Usually stops at</span><b>${o.usualStop?E(o.usualStop.name)+' <small>('+o.usualStop.pct+'%)</small>':'—'}</b></div></div>
  <div class="ins-box"><h5>Favourite activities</h5>${o.favourites.length?`<ol class="ins-obs">${o.favourites.map(f=>`<li>${E(f.name)} <small class="muted">${f.min} min</small></li>`).join('')}</ol>`:'<p class="muted">Not enough play yet.</p>'}
   ${o.learningShare!==null?`<p style="font-size:13px;margin:6px 0 0">Learning activities: <b>${o.learningShare}%</b> of play time</p>`:''}${feats?`<p class="muted" style="font-size:12px;margin:4px 0 0">${E(feats)}</p>`:''}</div>
  <div class="ins-box"><h5>When they play</h5>${heat}</div>
  <div class="ins-box wide"><h5>Accuracy by skill <small style="text-transform:none;letter-spacing:0">(last 2 weeks when there's enough, otherwise all time · 8-week trend · level vs grade expectation)</small></h5>${sk?`<table class="ins-sk">${sk}</table>`:'<p class="muted">No answers yet.</p>'}</div>
  <div class="ins-btns"><button class="btn small" onclick="Insights.report('${p.id}')">🖨️ Teacher report (PDF)</button></div>
 </div></details>`;}

function section(){
 const ps=players().filter(p=>p.setup);if(!ps.length)return '';
 const kids=ps.filter(p=>!p.adult),grown=ps.filter(p=>p.adult);
 return `<div class="pp ins-wrap"><div class="ins-top"><h3 style="margin:0">📊 Play Insights</h3><button class="btn small ghost dark" onclick="Insights.copy()">📋 Copy insights as text</button></div>
 <p class="muted" style="font-size:13px;margin:6px 0 4px">How each player uses the game: when, for how long, what they choose, where they stop, and how accuracy is moving. Counts only active time (a tap or key in the last 2 minutes). Kept on this family's save, last 60 days.</p>
 ${kids.map(kidCard).join('')}${grown.length?`<p class="muted" style="font-size:12px;margin:10px 0 0">Grown-ups / testers</p>${grown.map(kidCard).join('')}`:''}</div>`;}

function summaryText(){
 const out={generated:new Date().toISOString().slice(0,10),note:'Math Quest play insights. Minutes = active time. Levels: the game expects about level (grade+2) for + − × ÷.',players:[]};
 players().filter(p=>p.setup).forEach(p=>{try{const o=summary(p);
  o.skills=o.skills.map(k=>({skill:k.name,level:k.level,expected:k.expected,now:k.desc,accAll:k.acc===null?null:Math.round(k.acc*100),n:k.n,acc2wk:k.acc14===null?null:Math.round(k.acc14*100),n2wk:k.n14,lastPracticed:k.last}));
  delete o.byHour;o.reading=(p.readLog||[]).slice(-5).map(r=>({d:r.d,level:r.lv,score:r.s+'/'+(r.n||3)}));
  const sp=spellSum(p);if(sp)o.spelling={words:sp.words,mastered:sp.mastered,accuracy:sp.acc};
  if(window.Mastery&&typeof Mastery.summary==='function'){try{o.factMastery=Mastery.summary(p);}catch(e){}}
  out.players.push(o);}catch(e){console.warn(e);}});
 return JSON.stringify(out,null,1);}

function copy(){const t=summaryText();
 const done=()=>{try{toast('📋 Insights copied — paste them anywhere');}catch(e){}};
 const fallback=()=>{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,t.length);let ok=false;try{ok=document.execCommand('copy');}catch(e){}ta.remove();
  if(ok)done();else{try{modal(`<h3>Copy insights</h3><textarea style="width:100%;height:260px;font:12px monospace" readonly>${E(t)}</textarea><div class="row"><button class="btn" onclick="closeModal()">Close</button></div>`);}catch(e){}}};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,fallback);else fallback();}

/* ================= PART C: teacher report ================= */
function spellSum(p){const e=Object.entries(p.spellStats||{});if(!e.length)return null;let r=0,w=0,m=0;const tricky=[];
 e.forEach(([k,v])=>{r+=v.r||0;w+=v.w||0;if((v.s||0)>=2)m++;else if((v.w||0)>=1)tricky.push([k,v.w]);});
 return {words:e.length,mastered:m,acc:r+w?Math.round(r/(r+w)*100):null,answers:r+w,tricky:tricky.sort((a,b)=>b[1]-a[1]).slice(0,24).map(x=>x[0]),trickyN:tricky.sort((a,b)=>b[1]-a[1]).slice(0,24)};}
/* Related US Common Core State Standards per skill level (array index = level). null = no single clear match, so nothing is shown. */
const STD={
 add:[null,'1.OA.C.6','2.OA.B.2','2.NBT.B.5','2.NBT.B.5','2.NBT.B.5','3.NBT.A.2','3.NBT.A.2','4.NBT.B.4','4.NBT.B.4',null,'7.NS.A.1','5.OA.A.1','6.EE.B.7','6.EE.A.1',null,'6.EE.A.2','7.EE.A.1','8.EE.C.7','8.EE.C.8',null],
 sub:[null,'1.OA.C.6','2.OA.B.2','2.NBT.B.5','2.NBT.B.5','2.NBT.B.5','3.NBT.A.2','3.NBT.A.2','4.NBT.B.4','4.NBT.B.4','4.NBT.B.4','7.NS.A.1','7.NS.A.1','6.EE.B.7','7.NS.A.1','6.EE.A.1','7.NS.A.1','7.NS.A.1','6.NS.C.7','8.F.B.4','8.F.A.1'],
 mul:[null,'3.OA.C.7','3.OA.C.7','3.OA.C.7','3.OA.C.7','3.OA.C.7','3.OA.C.7','4.NBT.B.5','4.NBT.B.5','4.NBT.B.5','4.NBT.B.5','7.NS.A.2','6.RP.A.3','6.EE.A.1','6.RP.A.3','7.EE.B.4','7.NS.A.2','8.EE.A.1','6.EE.A.3',null,null],
 div:[null,'3.OA.C.7','3.OA.C.7','3.OA.C.7','3.OA.C.7','3.OA.C.7','3.OA.C.7','4.NBT.B.6','4.NBT.B.6','5.NBT.B.6','5.NBT.B.6','7.NS.A.2','6.RP.A.3','8.EE.A.2','6.RP.A.3','7.EE.B.4','7.NS.A.2','8.EE.A.1','7.EE.B.4','7.EE.B.4',null],
 frac:[null,'3.NF.A.1','3.NF.A.1','4.NF.B.4','4.NF.B.4','4.NF.B.3','4.NF.B.3','4.NF.A.1','4.NF.B.4','4.NF.C.5','4.NF.C.5'],
 money:[null,'2.MD.C.8','2.MD.C.8','2.MD.C.8','2.MD.C.8','2.MD.C.8','2.MD.C.8','4.MD.A.2','4.MD.A.2','4.MD.A.2','4.MD.A.2'],
 time:[null,'1.MD.B.3','1.MD.B.3','2.MD.C.7','2.MD.C.7','3.MD.A.1','4.MD.A.1','3.MD.A.1','3.MD.A.1','3.MD.A.1','3.MD.A.1'],
 vol:[null,'5.MD.C.4','5.MD.C.4','5.MD.C.5','5.MD.C.5','5.MD.C.5','5.MD.C.5','5.MD.C.5','5.MD.C.5','5.MD.C.5','5.MD.C.5'],
 meas:[null,'4.MD.C.6','4.MD.A.1','4.MD.A.1','4.MD.A.1','4.MD.A.1','3.MD.D.8','3.MD.D.8','4.MD.A.3','4.MD.A.3','4.MD.C.7'],
 word:[null,'4.OA.A.2','4.OA.A.2','4.OA.A.2','3.OA.A.3',null,'4.OA.A.3','4.NBT.A.1',null,'4.OA.A.3',null],
 graph:[null,'2.MD.D.10','2.MD.D.10','3.MD.B.3','3.MD.B.3','3.MD.B.3','3.MD.B.3','3.MD.B.3','3.MD.B.3','3.MD.B.3','3.MD.B.3'],
 grp:[null,'3.OA.A.1','3.OA.A.1','3.OA.A.4',null,'3.OA.A.2','3.OA.A.2','3.OA.A.3','3.OA.A.3','3.OA.C.7','3.OA.D.8'],
 est:[null,'3.NBT.A.1','3.NBT.A.1','3.NBT.A.1','3.OA.D.8',null,'3.OA.D.8','4.NBT.A.3','4.OA.A.3','4.OA.A.3','4.OA.A.3'],
 avg:[null,null,null,'6.SP.B.5','6.SP.B.5','6.SP.B.5',null,'6.SP.B.5',null,'6.SP.B.5',null]};
const STDN={'1.OA.C.6':'Add and subtract within 20','2.OA.B.2':'Fluently add and subtract within 20','2.NBT.B.5':'Fluently add and subtract within 100',
 '3.NBT.A.2':'Fluently add and subtract within 1000','4.NBT.B.4':'Add and subtract multi-digit numbers (standard algorithm)','3.OA.C.7':'Fluently multiply and divide within 100',
 '4.NBT.B.5':'Multiply multi-digit by 1-digit and 2-digit by 2-digit','4.NBT.B.6':'Divide up to 4-digit numbers by 1-digit divisors','5.NBT.B.6':'Divide by 2-digit divisors',
 '5.OA.A.1':'Parentheses and order of operations','6.EE.B.7':'Solve one-step equations','6.EE.A.1':'Expressions with whole-number exponents','6.EE.A.2':'Evaluate expressions with variables',
 '6.EE.A.3':'Distributive property / equivalent expressions','7.EE.A.1':'Combine like terms','8.EE.C.7':'Solve linear equations in one variable','8.EE.C.8':'Systems of two linear equations',
 '7.NS.A.1':'Add and subtract integers','7.NS.A.2':'Multiply and divide integers','6.NS.C.7':'Absolute value','8.F.B.4':'Rate of change (slope)','8.F.A.1':'Functions: inputs and outputs',
 '6.RP.A.3':'Ratio, rate and percent problems','7.EE.B.4':'Solve two-step equations','8.EE.A.1':'Properties of integer exponents','8.EE.A.2':'Square roots and cube roots',
 '3.NF.A.1':'Understand fractions as parts of a whole','4.NF.B.4':'Multiply a fraction by a whole number','4.NF.B.3':'Add and subtract fractions with like denominators',
 '4.NF.A.1':'Equivalent fractions','4.NF.C.5':'Tenths and hundredths','5.NF.A.1':'Add and subtract fractions with unlike denominators',
 '2.MD.C.8':'Money: coins and dollars','4.MD.A.2':'Word problems with money, time and measures','1.MD.B.3':'Tell time to the hour and half hour','2.MD.C.7':'Tell time to the nearest 5 minutes',
 '3.MD.A.1':'Time to the minute; elapsed time','4.MD.A.1':'Convert measurement units','5.MD.C.4':'Volume by counting unit cubes','5.MD.C.5':'Volume: l × w × h, composite figures',
 '4.MD.C.6':'Measure angles with a protractor','4.MD.C.7':'Find unknown angles','3.MD.D.8':'Perimeter problems','4.MD.A.3':'Area and perimeter formulas',
 '4.OA.A.2':'Multiplicative comparison problems','3.OA.A.3':'Multiplication and division word problems','4.OA.A.3':'Multistep word problems, remainders, estimation',
 '4.NBT.A.1':'Place value (each place is 10 times the next)','2.MD.D.10':'Picture and bar graphs','3.MD.B.3':'Scaled picture and bar graphs','3.OA.A.1':'Multiplication as equal groups',
 '3.OA.A.2':'Division as equal sharing','3.OA.A.4':'Unknown factor in × and ÷ equations','3.OA.D.8':'Two-step problems; estimating to check','3.NBT.A.1':'Round to the nearest 10 or 100',
 '4.NBT.A.3':'Round multi-digit numbers','6.SP.B.5':'Summarize data (mean, median)'};
const stdOf=(op,L)=>{const a=STD[op];const c=a&&a[L];return c?{c,n:STDN[c]||''}:null;};
const stdCode=c=>c?{c,n:STDN[c]||''}:null;
const stdHTML=s=>s?`<b class="std">${E(s.c)}</b><br><span class="stdn">${E(s.n)}</span>`:'<span class="muted">—</span>';
/* ---- missed-problem classification (for error patterns) ---- */
function carries(a,b){let c=0;while(a||b){const s=a%10+b%10+c;if(s>=10)return true;c=0;a=Math.floor(a/10);b=Math.floor(b/10);}return false;}
function borrows(a,b){const A=String(a).split('').reverse().map(Number),Bd=String(b).split('').reverse().map(Number);let br=0,need=false,zero=false;
 for(let i=0;i<A.length;i++){if(A[i]===0&&br)zero=true;const t=A[i]-br,u=Bd[i]||0;if(t<u){need=true;br=1;}else br=0;}return {need,zero};}
function classify(t,m){const q=m.q||{};const op=m.op||q.op;const L=q.L||0;const o={op,L,t:t.replace(/\s*=\s*\?\s*$/,''),n:m.n||1};
 const bm=o.t.match(/^\s*(\d+)\s*([+−×÷])\s*(\d+)\s*$/);
 if(BASIC.includes(op)&&(!L||L<=10)&&bm){const a=+bm[1],b=+bm[3];
  if(op==='mul')return Object.assign(o,a<=12&&b<=12?{k:'mulfact',a,b}:{k:'mulmulti'});
  if(op==='div')return Object.assign(o,b<=12&&a/b<=12&&a%b===0?{k:'divfact',a,b}:{k:'divmulti'});
  if(op==='add')return Object.assign(o,a<=10&&b<=10?{k:'addfact',cross:a+b>10}:{k:carries(a,b)?'addcarry':'addplain'});
  if(op==='sub'){if(a<=20&&b<=10)return Object.assign(o,{k:'subfact',cross:a>10&&a%10<b});const r=borrows(a,b);return Object.assign(o,{k:r.need?'subregroup':'subplain',zero:r.zero});}}
 if(op==='frac'){
  if(/Grid|\/10\b.*\/100/.test(o.t))return Object.assign(o,{k:'fracdec'});
  const f=o.t.match(/^(\d+)\/(\d+)\s*[+−-]\s*(\d+)\/(\d+)$/);if(f)return Object.assign(o,{k:+f[2]===+f[4]?'fraclike':'fracunlike'});
  if(/=\s*\?\//.test(o.t))return Object.assign(o,{k:'fracequiv'});
  if(/ of \d/.test(o.t))return Object.assign(o,{k:'fracof'});
  if(/mixed|wholes/.test(o.t))return Object.assign(o,{k:'fracmixed'});
  if(/shaded/i.test(o.t))return Object.assign(o,{k:'fracpic'});}
 if(op==='time'){
  if(/^Clock/.test(o.t))return Object.assign(o,{k:'timeread'});
  if(/^Minutes in/.test(o.t))return Object.assign(o,{k:'timeconv'});
  const tm=o.t.match(/(\d+):(\d\d)\s*([+−-])\s*(?:(\d+)h\s*)?(\d+)\s*m/),tt=o.t.match(/(\d+):(\d\d)\s+to\s+(\d+):(\d\d)/);
  if(tm){const mm=+tm[2],d=+tm[5];return Object.assign(o,{k:'timeelapsed',cross:tm[3]==='+'?mm+d>=60:mm-d<0});}
  if(tt)return Object.assign(o,{k:'timeelapsed',cross:+tt[4]<+tt[2]||+tt[3]!==+tt[1]});}
 if(op==='money'){if(/^Coins/.test(o.t))return Object.assign(o,{k:'moneycount'});if(/^Change from/.test(o.t))return Object.assign(o,{k:'moneychange'});}
 return Object.assign(o,{k:'lvl:'+op+':'+L});}
const listW=a=>a.length<=1?a.join(''):a.length===2?a.join(' and '):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const exs=(items,n)=>items.slice(0,n||2).map(x=>x.t).join(', ');
function patterns(missedUnfixed,F,weakMulFacts){
 const G={};missedUnfixed.forEach(x=>{(G[x.k]=G[x.k]||[]).push(x);});const out=[];
 const add=(k,n,t,std,tip)=>out.push({k,n,t,std,tip});
 const facts=(k,sym,items)=>{const c={};items.forEach(x=>{const fs=k==='divfact'?[x.b]:x.a===x.b?[x.a]:[x.a,x.b];fs.forEach(f=>{if(f>=3&&f!==10)c[f]=(c[f]||0)+1;});});
  let top=Object.entries(c).filter(([,v])=>v>=2).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([f])=>+f);
  const covered=items.filter(x=>top.some(f=>(k==='divfact'?[x.b]:[x.a,x.b]).includes(f))).length;
  return {top,mostly:top.length&&covered/items.length>=.5,tables:listW(top.map(f=>sym+f))};};
 if(G.mulfact&&G.mulfact.length>=2){const f=facts('mulfact','×',G.mulfact);add('mulfact',G.mulfact.length,`Multiplication facts: ${G.mulfact.length} different facts missed${f.mostly?`, mostly in the ${f.tables} tables`:', spread across several tables'} (e.g., ${exs(G.mulfact,3)}).`,stdCode('3.OA.C.7'),
  `Short, frequent practice on the ${f.mostly?f.tables:'harder multiplication'} facts, building hard facts from known ones (e.g., ×8 = double ×4; ×6 = ×5 plus one more group).`);}
 if(G.divfact&&G.divfact.length>=2){const f=facts('divfact','÷',G.divfact);add('divfact',G.divfact.length,`Division facts: ${G.divfact.length} different facts missed${f.mostly?`, mostly dividing by ${listW(f.top.map(String))}`:''} (e.g., ${exs(G.divfact,3)}).`,stdCode('3.OA.C.7'),
  `Connect each division fact to its multiplication fact family (56 ÷ 8 = 7 because 8 × 7 = 56).`);}
 ['add','sub'].forEach(op=>{const it=G[op+'fact'];if(!it||it.length<2)return;const c=it.filter(x=>x.cross).length;
  add(op+'fact',it.length,`${op==='add'?'Addition':'Subtraction'} facts within 20: ${it.length} missed${c/it.length>=.6?`, most of them ${op==='add'?'crossing ten':'subtracting across ten'}`:''} (e.g., ${exs(it,3)}).`,stdCode('2.OA.B.2'),
   op==='add'?'Practice the make-ten strategy for facts that cross ten (8 + 7 = 8 + 2 + 5).':'Practice "think addition" for subtraction across ten (15 − 8: 8 + ? = 15).');});
 {const r=G.subregroup||[],pl=G.subplain||[];if(r.length>=2){const z=r.filter(x=>x.zero);
  add('subregroup',r.length,`Multi-digit subtraction: ${r.length} of ${r.length+pl.length} missed problems need regrouping (borrowing)${z.length>=2?`, ${z.length} of them across a zero (e.g., ${exs(z,1)})`:` (e.g., ${exs(r,2)})`}.`,stdOf('sub',r[0].L||7)||stdCode('3.NBT.A.2'),
   `Model regrouping with base-ten blocks or a place-value chart${z.length>=2?', especially regrouping across zeros':''}, and estimate first to check whether an answer is reasonable.`);}}
 {const r=G.addcarry||[],pl=G.addplain||[];if(r.length>=2)add('addcarry',r.length,`Multi-digit addition: ${r.length} of ${r.length+pl.length} missed problems need regrouping (carrying) (e.g., ${exs(r,2)}).`,stdOf('add',r[0].L||7)||stdCode('3.NBT.A.2'),
   'Review regrouping in addition with place-value models, keeping digits lined up by place.');}
 ['mul','div'].forEach(op=>{const it=G[op+'multi'];if(!it||it.length<2)return;
  add(op+'multi',it.length,`Multi-digit ${op==='mul'?'multiplication':'division'}: ${it.length} problems missed (e.g., ${exs(it,2)})${weakMulFacts?' — some errors may come from the multiplication facts listed below':''}.`,stdOf(op,it[0].L||8),
   op==='mul'?'Use an area model or partial products alongside the standard algorithm.':'Use partial quotients (repeated subtraction of easy multiples) alongside long division.');});
 const FR={fracunlike:['Adding or subtracting fractions with unlike denominators','5.NF.A.1','Use fraction strips or area models to find a common denominator before adding or subtracting.'],
  fraclike:['Adding or subtracting fractions with like denominators','4.NF.B.3','Use fraction strips or a number line to add and subtract parts of the same whole.'],
  fracequiv:['Equivalent fractions','4.NF.A.1','Use fraction strips to show that multiplying the top and bottom by the same number names the same amount.'],
  fracof:['Finding a fraction of a number or group','4.NF.B.4','Draw equal groups to find a fraction of a number (1/4 of 12: split 12 into 4 equal groups).'],
  fracdec:['Tenths and hundredths','4.NF.C.5','Use a 10 × 10 grid to connect tenths and hundredths.'],
  fracmixed:['Mixed numbers and wholes','4.NF.B.3','Use fraction strips to regroup wholes and parts in mixed numbers.'],
  fracpic:['Naming fractions from pictures','3.NF.A.1','Practice naming fractions from pictures, counting equal parts first.'],
  timeread:['Reading an analog clock',null,'Practice reading analog clocks, counting minutes by fives.'],
  timeconv:['Converting hours and minutes','4.MD.A.1',null],
  moneycount:['Counting mixed coins','2.MD.C.8','Practice counting mixed coins, starting with the coin worth the most.'],
  moneychange:['Making change',null,'Practice making change by counting up from the price to the amount paid.']};
 Object.keys(FR).forEach(k=>{const it=G[k];if(!it||it.length<2)return;const [lbl,sc,tip]=FR[k];
  add(k,it.length,`${lbl}: ${it.length} problems missed (e.g., ${exs(it,2)}).`,sc?stdCode(sc):stdOf(it[0].op,it[0].L),tip);});
 if(G.timeelapsed&&G.timeelapsed.length>=2){const it=G.timeelapsed,c=it.filter(x=>x.cross).length;
  add('timeelapsed',it.length,`Elapsed time: ${it.length} problems missed${c>=2&&c/it.length>=.6?`, most of them crossing the hour`:''} (e.g., ${exs(it,2)}).`,stdCode('3.MD.A.1'),
   'Solve elapsed-time problems on an open number line: jump to the next hour first, then add the remaining minutes.');}
 Object.keys(G).filter(k=>k.startsWith('lvl:')).forEach(k=>{const it=G[k];if(it.length<3)return;const [,op,L]=k.split(':');const d=descOf(op,+L);if(!d)return;
  add(k,it.length,`${opName(op)} — ${d.toLowerCase()}: ${it.length} problems missed (e.g., ${exs(it,2)}).`,stdOf(op,+L),null);});
 out.sort((a,b)=>b.n-a.n);
 const rep=missedUnfixed.filter(x=>x.n>=3).length;
 return {list:out.slice(0,5),repeat:rep};}
/* fact fluency by fact family, decoded from the Mastery Map grid (p.mastery; see mastery.js) */
const MG={add:{n:11,lo:0,sym:'+',name:'Addition facts (0–10)'},sub:{n:11,lo:0,sym:'−',name:'Subtraction facts (0–10)'},mul:{n:12,lo:1,sym:'×',name:'Multiplication facts (1–12)'},div:{n:12,lo:1,sym:'÷',name:'Division facts (1–12)'}};
function fluency(p){const m=p.mastery;if(!m||typeof m!=='object')return [];const out=[];
 ['mul','div','add','sub'].forEach(op=>{const str=m[op];const g=MG[op];if(typeof str!=='string')return;
  const st=i=>{const v=(str.charCodeAt(i)||97)-97;return v>=0&&v<16?v>>2:0;};
  let tot=g.n*g.n,mast=0,prac=0;for(let i=0;i<tot;i++){const s=st(i);if(s)prac++;if(s===3)mast++;}if(prac<8)return;
  const fam={};const txt=(r,c)=>op==='add'?`${Math.min(r,c)} + ${Math.max(r,c)}`:op==='sub'?`${r+c} − ${r}`:op==='mul'?`${Math.min(r,c)} × ${Math.max(r,c)}`:`${r*c} ÷ ${r}`;
  const miss=new Map();
  for(let i=0;i<tot;i++){const r=Math.floor(i/g.n)+g.lo,c=i%g.n+g.lo,s=st(i);if(!s)continue;
   const ks=(op==='add'||op==='mul')?(r===c?[r]:[r,c]):[r];ks.forEach(k=>{const f=fam[k]||(fam[k]={p:0,m:0});f.p++;if(s===3)f.m++;});
   if(s===1){const t=txt(r,c);if(!miss.has(t))miss.set(t,(op==='mul'||op==='div'?Math.max(r,c):r+c));}}
  const trivial=op==='mul'||op==='div'?[1,10]:[0,1];
  const weak=Object.entries(fam).filter(([k,f])=>!trivial.includes(+k)&&f.p>=4&&f.m/f.p<.5).sort((a,b)=>a[1].m/a[1].p-b[1].m/b[1].p).map(([k,f])=>({k:+k,m:f.m,p:f.p}));
  if(!weak.length&&!miss.size)return;
  const lbl=op==='mul'?k=>`×${k}`:op==='div'?k=>`÷${k}`:op==='add'?k=>`+${k}`:k=>`−${k}`;
  out.push({op,name:g.name,total:tot,mastered:mast,practiced:prac,weak:weak.slice(0,5).sort((a,b)=>a.k-b.k).map(w=>({l:lbl(w.k),m:w.m,p:w.p})),
   miss:[...miss.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]),std:op==='mul'||op==='div'?stdCode('3.OA.C.7'):stdCode('2.OA.B.2')});});
 return out;}
let REP={pid:null,range:28};
function report(pid){REP.pid=pid;renderReport();}
function closeReport(){const el=document.getElementById('ins-rep');if(el)el.remove();document.documentElement.classList.remove('ins-printing');}
function renderReport(){
 const p=byId(REP.pid);if(!p)return;const s=I(p);const now=new Date();const today0=new Date(now.toDateString());
 const allKeys=Object.keys(p.daily||{}).sort();
 const firstEver=allKeys[0]?new Date(allKeys[0]+'T00:00'):today0;
 let start=REP.range?addDays(today0,-(REP.range-1)):firstEver;if(start<firstEver)start=firstEver;
 const sk=k6(start),sDash=dayKey(start);
 const F=String(p.name||'').trim().split(/\s+/)[0]||'This student';
 // practice summary: answers from p.daily (all math answers), minutes from tracked active time
 let days=new Set(),ans=0,right=0,secs=0;const dayAns=[];
 for(const k in (p.daily||{})){if(k>=sDash){const d=p.daily[k];const n=(d.r||0)+(d.w||0);if(n){days.add(k.replace(/-/g,'').slice(2));ans+=n;right+=d.r||0;dayAns.push([k,d.r||0,n]);}}}
 let sesN=0,sesAns=0;
 for(const k in s.d){if(k>=sk){const r=s.d[k];secs+=r[0];if(r[0]>=120||r[1])days.add(k);if(r[4]){sesN+=r[4];sesAns+=r[1];}}}
 const tracked=s.since&&s.since>sk;
 const mins=Math.round(secs/60);
 const periodWkK=k6(monday(start));
 /* ---- practice habits ---- */
 const spanDays=Math.max(1,Math.round((today0-start)/864e5)+1);const perWk=spanDays/7;
 let wdD=0,weD=0;days.forEach(k=>{const dw=fromK6(k).getDay();if(dw===0||dw===6)weD++;else wdD++;});
 const trackDays=tracked?Math.max(1,Math.round((today0-fromK6(s.since))/864e5)+1):spanDays;
 let trend=null;if(dayAns.length>=4){dayAns.sort((a,b)=>a[0]<b[0]?-1:1);const mid=dayKey(addDays(start,Math.floor(spanDays/2)));let a1=0,n1=0,a2=0,n2=0;dayAns.forEach(([k,r,n])=>{if(k<mid){a1+=r;n1+=n;}else{a2+=r;n2+=n;}});
  if(n1>=30&&n2>=30){const x=Math.round(a1/n1*100),y=Math.round(a2/n2*100);trend={x,y,w:y-x>=5?'improving':x-y>=5?'lower in the second half':'steady'};}}
 const kv=(p.kindVisits||[]).filter(v=>v.d>=sDash&&(v.kind==='math'||v.kind==='spell'));const kvM=kv.filter(v=>v.kind==='math').length,kvS=kv.length-kvM;
 const lastK=[...days].sort().pop();
 const habits=[];
 if(days.size){habits.push(['Practice days',`${days.size} of ${spanDays} days (about ${Math.round(days.size/perWk*10)/10} per week) · ${pl(wdD,'school day')}, ${pl(weD,'weekend day')}`]);
  if(mins)habits.push(['Practice time',`about ${fmtMin(Math.round(mins/(Math.min(spanDays,trackDays)/7)))} per week · ${fmtMin(Math.round(mins/Math.max(1,days.size)))} per practice day`]);
  if(sesN>=2&&sesAns)habits.push(['Session length',`about ${Math.round(sesAns/sesN)} math questions per session (${pl(sesN,'session')})`]);
  if(trend)habits.push(['Accuracy trend',`${trend.x}% in the first half of the period → ${trend.y}% in the second half (${trend.w})`]);
  if(kv.length)habits.push(['Needed guided help',`${pl(kv.length,'time')} (${[kvM?kvM+' math':'',kvS?kvS+' spelling':''].filter(Boolean).join(', ')}) — a step-by-step walkthrough appears after repeated misses on the same item, at most once a day`]);
  if(lastK&&daysAgo(lastK)>=4)habits.push(['Most recent practice',fromK6(lastK).toLocaleDateString('en-US',{month:'short',day:'numeric'})+` (${daysAgo(lastK)} days ago)`]);}
 /* ---- skills that need help ---- */
 const areas=[];const fmtS=k=>new Date(k+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
 (typeof OPS!=='undefined'?OPS:[]).forEach(op=>{if(p.adult)return;const st=(p.stats&&p.stats[op])||{r:0,w:0};const nAll=st.r+st.w;const per=weekAcc(s,op,periodWkK);if(!nAll)return;
  const useP=per.n>=5;const acc=useP?per.acc:st.r/nAll;const n=useP?per.n:nAll;
  const wks=Object.keys(s.wk).filter(k=>k>=periodWkK&&s.wk[k][op]).sort();let rec={n:0},bef={n:0};
  if(wks.length>=2){const mid=wks[Math.ceil(wks.length/2)];rec=weekAcc(s,op,mid);bef=weekAcc(s,op,periodWkK,mid);}
  const Lv=levelOf(p,op),ex=expFor(p,op),basic=BASIC.includes(op);
  const why=[];
  if(n>=15&&acc<.75)why.push('accuracy below the 80% the program aims for');
  if(basic&&n>=15&&Lv<ex-1&&(acc<.85||(p.log||[]).some(l=>l.op===op&&l.d>=sDash&&l.to<l.from)))why.push(`working below the typical grade ${p.grade} level`);
  if(rec.n>=10&&bef.n>=10&&bef.acc-rec.acc>=.08)why.push(`accuracy dipped recently (${Math.round(bef.acc*100)}% → ${Math.round(rec.acc*100)}%)`);
  const lpk=s.lp[op];if(nAll>=30&&lpk&&daysAgo(lpk)>=14&&s.since&&daysAgo(s.since)>=14)why.push(`not practiced since ${fromK6(lpk).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`);
  if(!why.length)return;
  const lg=(p.log||[]).filter(l=>l.op===op&&l.d>=sDash).sort((a,b)=>a.d<b.d?-1:1);
  const dn=lg.filter(l=>l.to<l.from).length,up=lg.length-dn;
  const chg=lg.length?`${lg.slice(-4).map(l=>`<span class="chg">${l.to<l.from?'↓':'↑'} ${fmtS(l.d)}</span>`).join(', ')}${lg.length>4?' …':''}<br><span class="muted">${[dn?`eased ${dn}×`:'',up?`raised ${up}×`:''].filter(Boolean).join(', ')}</span>`:'<span class="muted">no change</span>';
  const tr=rec.n>=10&&bef.n>=10?(rec.acc-bef.acc>=.05?' <span class="muted">(rising)</span>':bef.acc-rec.acc>=.05?' <span class="muted">(falling)</span>':''):'';
  areas.push({op,name:opName(op),desc:descOf(op,Lv),why,acc,n,useP,chg,tr,std:stdOf(op,Lv),sev:(acc<.75?2:0)+(Lv<ex-1?1:0)+why.length*.1});});
 areas.sort((a,b)=>b.sev-a.sev);
 /* ---- missed problems ---- */
 const unf=Object.entries(p.missed||{}).filter(([t,m])=>(m.fixed||0)<2&&t.length<70);
 const cls=unf.map(([t,m])=>classify(t,m));
 const flu=fluency(p);const weakMul=flu.some(f=>f.op==='mul'&&f.weak.length);
 const pat=patterns(cls,F,weakMul);
 const ansTxt=m=>{try{if(m.q&&m.q.kind==='clock'){const a=m.a;return Math.floor(a/100)+':'+String(a%100).padStart(2,'0');}if(m.q&&m.q.tpl&&m.q.tpl!=='{A}'){const a=m.a<0?'−'+(-m.a):String(m.a);
   const f=String(m.q.tpl).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g,'$1/$2').replace(/&nbsp;|→/g,' ').replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ');
   const seg=f.split('=').find(x=>x.includes('{A}'));if(seg){const t=seg.replace('{A}',a).replace(/\s+/g,' ').trim();if(t&&t.length<=24)return t;}}
  if(m.q&&m.q.tpl&&typeof xAnsStr==='function')return xAnsStr(m.q,true);}catch(e){}return String(m.a);};
 const probT=t=>t.replace(/\s*=\s*\?\s*$/,'').replace(/^Clock (\d+:\d\d)$/,'Read a clock showing $1').replace(/^Cube count /,'Count unit cubes ');
 const probs=unf.sort((a,b)=>b[1].n-a[1].n||String(b[1].last||'').localeCompare(String(a[1].last||''))).slice(0,12).map(([t,m])=>({t:probT(t),a:ansTxt(m),n:m.n,sk:opName(m.op||(m.q&&m.q.op)||'')}));
 /* ---- reading, school practice sets ---- */
 const rl=(p.readLog||[]).filter(r=>r.d>=sDash&&r.n);let readW=null;
 if(rl.length>=3){const sc=rl.reduce((a,r)=>a+(r.s||0),0),nq=rl.reduce((a,r)=>a+(r.n||3),0);if(nq&&sc/nq<.7){const lv=rl.map(r=>r.lv).filter(Boolean);readW={pct:Math.round(sc/nq*100),n:rl.length,lv:lv.length?Math.round(lv.reduce((a,b)=>a+b,0)/lv.length):null};}}
 const school=[];try{if(typeof quizList==='function')quizList(p).forEach(x=>{const st=p.quizStats&&p.quizStats[x.id];if(st&&st.tries&&st.best<70)school.push([x.title||'Quiz',st.best,st.tries]);});
  if(typeof hwList==='function')hwList(p).forEach(x=>{const st=p.hwStats&&p.hwStats[x.id];if(st&&st.tries&&st.best<70)school.push([x.title||'Homework set',st.best,st.tries]);});}catch(e){}
 const sp=spellSum(p);
 /* ---- suggestions ---- */
 const tips=[];pat.list.forEach(x=>{if(x.tip&&!tips.includes(x.tip)&&tips.length<3)tips.push(x.tip);});
 if(flu.length&&!pat.list.some(x=>/fact/.test(x.k))&&tips.length<3){const f=flu[0];if(f.weak.length)tips.push(`Short, frequent fact practice on the ${listW(f.weak.slice(0,3).map(w=>w.l))} facts, aiming for quick recall rather than counting.`);}
 areas.forEach(a=>{if(tips.length>=3)return;if(pat.list.some(x=>x.k.includes(a.op)||(x.std&&a.std&&x.std.c===a.std.c)))return;if(a.why.some(w=>/not practiced/.test(w)))tips.push(`A quick review of ${a.name.toLowerCase()} (${a.desc.toLowerCase()}) — it has not come up in home practice lately.`);
  else if(a.desc)tips.push(`Extra practice with ${a.name.toLowerCase()}: ${a.desc.toLowerCase()}.`);});
 if(sp&&sp.trickyN.length>=4&&tips.length<3)tips.push(`Review the spelling words listed below — each has been misspelled at least once and not yet spelled correctly twice in a row.`);
 if(readW&&tips.length<3)tips.push('Ask a few who / what / why questions after short reading passages to build comprehension.');
 if(tips.length)tips.push(`Home practice can be focused on whatever you are teaching in class — please let us know what would help most.`);
 const fmtD=d=>d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
 const grade=p.adult?'Adult':gradeWord(p.grade);
 const tile=(v,l)=>`<div class="tile"><b>${v}</b><span>${l}</span></div>`;
 const pct=a=>Math.round(a*100)+'%';
 const skillTable=areas.length?`<div class="tw"><table class="sk"><tr><th style="width:21%">Skill</th><th>Currently working on · why listed</th><th class="n" style="width:12%">Accuracy</th><th style="width:16%">Level changes</th><th style="width:23%">Related standard</th></tr>
  ${areas.slice(0,6).map(a=>`<tr><td><b>${E(a.name)}</b></td><td>${E(a.desc||'—')}<br><span class="why">${E(a.why.join('; '))}</span></td><td class="n">${pct(a.acc)}${a.tr}<br><span class="muted">of ${a.n}${a.useP?'':' (all time)'}</span></td><td>${a.chg}</td><td>${stdHTML(a.std)}</td></tr>`).join('')}</table></div>
  <p class="note">Level changes: ↓ = the program eased the difficulty after repeated misses; ↑ = moved up after 6 correct answers in a row.</p>`
  :'<p class="muted">No math skill stands out as needing extra help in this period.</p>';
 const patHTML=pat.list.length||pat.repeat>=2?`<ul>${pat.list.map(x=>`<li>${E(x.t)}${x.std?` <span class="stdi">${E(x.std.c)}</span>`:''}</li>`).join('')}${pat.repeat>=2?`<li>${pat.repeat} problems have been missed three or more times, so these are persistent rather than one-off slips.</li>`:''}</ul>`:'';
 const fluHTML=flu.length?`<div class="keep"><h3 class="hh">Math facts not yet automatic</h3><p class="note">A fact counts as mastered once it has been answered correctly and quickly on three different days. Only fact families that have been practiced are judged.</p>
  <div class="tw"><table><tr><th style="width:24%">Facts</th><th class="n" style="width:14%">Mastered</th><th style="width:30%">Families under 50% mastered</th><th>Not yet answered correctly</th></tr>
  ${flu.map(f=>`<tr><td><b>${E(f.name)}</b><br><span class="muted">${E(f.std.c)}</span></td><td class="n">${f.mastered} of ${f.total}<br><span class="muted">${f.practiced} practiced</span></td><td>${f.weak.length?f.weak.map(w=>`${E(w.l)} <span class="muted">(${w.m}/${w.p})</span>`).join(', '):'—'}</td><td>${f.miss.length?E(f.miss.join(', ')):'—'}</td></tr>`).join('')}</table></div></div>`:'';
 const half=Math.ceil(probs.length/2);const pt=rows=>`<table class="pr"><tr><th>Problem</th><th class="n" style="width:22%">Answer</th><th class="n" style="width:14%">Missed</th></tr>${rows.map(x=>`<tr><td>${E(x.t)} <span class="muted">· ${E(x.sk)}</span></td><td class="n">${E(String(x.a))}</td><td class="n">${x.n}×</td></tr>`).join('')}</table>`;
 const probHTML=probs.length?(probs.length>6?`<div class="two">${pt(probs.slice(0,half))}${pt(probs.slice(half))}</div>`:pt(probs)):'<p class="muted">None right now. Missed problems drop off this list once answered correctly twice.</p>';
 const spHTML=sp&&sp.trickyN.length?`<div class="words">${sp.trickyN.map(([w,n])=>`<span><b>${E(w)}</b> <small>${n}×</small></span>`).join('')}</div><p class="note">${sp.mastered} of ${sp.words} practiced words are mastered (spelled correctly on two separate occasions). Number = times misspelled.</p>`:'';
 const html=`<div class="bar"><button onclick="Insights.closeReport()">✕ Close</button><select onchange="Insights._range(this.value)"><option value="28" ${REP.range===28?'selected':''}>Last 4 weeks</option><option value="56" ${REP.range===56?'selected':''}>Last 8 weeks</option><option value="0" ${!REP.range?'selected':''}>All time</option></select><span class="sp"></span><button class="go" onclick="window.print()">🖨️ Save as PDF<span class="ins-long"> / Print</span></button></div>
 <div class="paper">
  <div class="hdr"><div><h1>Home Math Practice Report</h1><div class="sub"><b style="font-size:17px;color:#111">${E(F)}</b> &nbsp;·&nbsp; ${E(grade)}</div></div>
   <div class="r">${fmtD(start)} – ${fmtD(now)}<br>Prepared ${fmtD(now)}</div></div>
  <p class="about"><b>About this report.</b> ${E(F)} practices at home with an adaptive program. Each skill has its own difficulty level that moves up after 6 correct answers in a row and eases off after 2 misses out of 4, so children settle where they get <b>about 80% right</b>. Accuracy near 80% means the work is at the right challenge; well below 75% points to a real sticking point. Only skills and items that still need work are listed — skills going well are left out on purpose. Questions have no time limit.</p>
  <h2>Practice at a glance</h2>
  <div class="tiles">${tile(days.size,'days practiced')}${tile(mins?fmtMin(mins):'—','active practice time'+(tracked?'*':''))}${tile(ans.toLocaleString(),'math questions answered')}${tile(ans?Math.round(right/ans*100)+'%':'—','answered correctly')}</div>
  ${habits.length?`<div class="kv">${habits.map(([k,v])=>`<span>${E(k)}</span><div>${E(v)}</div>`).join('')}</div>`:''}
  ${tracked?`<p class="note">* Practice time has been recorded since ${fmtD(fromK6(s.since))}.</p>`:''}
  ${!days.size&&!ans?`<p class="muted">No practice has been recorded in this period yet, so there is nothing to report. Try a longer period above.</p>`:''}
  ${!days.size&&!ans&&!unf.length&&!(sp&&sp.trickyN.length)?'':`${p.adult?'':`<h2>Where ${E(F)} needs help</h2>
  <div class="keep"><h3 class="hh">Math skills to watch</h3>${skillTable}</div>`}
  ${patHTML?`<div><h3 class="hh">Patterns in the mistakes</h3><p class="note">Based on problems answered wrong and not yet corrected. Codes are related Common Core standards.</p>${patHTML}</div>`:''}
  ${tips.length?`<div><h3 class="hh">Suggested next steps</h3><ol class="tips">${tips.map(t=>`<li>${E(t)}</li>`).join('')}</ol></div>`:''}
  ${fluHTML}
  <div><h3 class="hh">Math problems answered wrong and not yet corrected</h3>${probHTML}</div>
  ${readW?`<div class="keep"><h3 class="hh">Reading comprehension</h3><p>Answered ${readW.pct}% of story questions correctly on the first try across ${readW.n} stories${readW.lv?` (about grade ${readW.lv} level)`:''} in this period.</p></div>`:''}
  ${school.length?`<div class="keep"><h3 class="hh">School practice sets with low scores</h3><ul>${school.slice(0,6).map(([t,b,n])=>`<li>${E(t)}: best score ${b}% (${pl(n,'try','tries')})</li>`).join('')}</ul></div>`:''}
  <div class="keep"><h3 class="hh">Spelling words still being learned</h3>${spHTML||`<p class="muted">${sp?'No spelling words need extra help right now.':'No spelling practice recorded yet.'}</p>`}</div>`}
  <div class="fine">Generated from ${E(F)}'s home practice records. Standards are listed as related Common Core State Standards for reference only; they are matched from the skill being practiced, not from a formal assessment. Shared by ${E(F)}'s family.</div>
 </div>`;
 let el=document.getElementById('ins-rep');if(!el){el=document.createElement('div');el.id='ins-rep';document.body.appendChild(el);}
 el.innerHTML=html;el.scrollTop=0;document.documentElement.classList.add('ins-printing');}

/* ================= register ================= */
window.MQ_PARENT=window.MQ_PARENT||[];
window.MQ_PARENT.push(section);
window.Insights={summary,summaryText,copy,report,closeReport,section,
 flush(){if(L){const p=byId(L.pid);account(p,Date.now());}},
 _range(v){REP.range=+v||0;renderReport();},
 _state:()=>({L,lastInput}),_tick:()=>tick()};
})();
