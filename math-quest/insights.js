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
#ins-rep .hdr .r{text-align:right;white-space:nowrap;font-size:13px;color:#333;font-family:system-ui,sans-serif}
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
@media (max-width:640px){#ins-rep .paper{margin:0;padding:18px 14px;box-shadow:none}#ins-rep .tiles{grid-template-columns:repeat(2,1fr)}#ins-rep .two{grid-template-columns:1fr}#ins-rep .fl{grid-template-columns:repeat(2,1fr)}#ins-rep .hdr{flex-direction:column;align-items:flex-start}#ins-rep .hdr .r{text-align:left}#ins-rep table{font-size:11.5px}#ins-rep .bar button,#ins-rep .bar select{padding:8px 10px;font-size:14px}#ins-rep .bar{flex-wrap:nowrap;gap:6px;padding:8px}#ins-rep .bar button,#ins-rep .bar select{white-space:nowrap}#ins-rep .bar .sp{display:none}#ins-rep .ins-long{display:none}}
@page{margin:14mm 13mm}
@media print{
 html.ins-printing,html.ins-printing body{background:#fff!important;height:auto!important;overflow:visible!important;min-height:0!important}
 html.ins-printing body>*:not(#ins-rep){display:none!important}
 html.ins-printing body::before,html.ins-printing body::after{display:none!important}
 #ins-rep{position:static!important;overflow:visible!important;background:#fff!important;inset:auto}
 #ins-rep .bar{display:none!important}
 #ins-rep .paper{box-shadow:none!important;margin:0!important;padding:0!important;max-width:none!important}
 #ins-rep .tw{overflow:visible}
 #ins-rep .tiles{grid-template-columns:repeat(4,1fr)!important}#ins-rep .two{grid-template-columns:1fr 1fr!important}#ins-rep .fl{grid-template-columns:repeat(4,1fr)!important}
 #ins-rep .hdr{flex-direction:row!important;align-items:flex-end!important}#ins-rep .hdr .r{text-align:right!important}
 #ins-rep tr,#ins-rep .tile{break-inside:avoid}
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
 e.forEach(([k,v])=>{r+=v.r||0;w+=v.w||0;if((v.s||0)>=2)m++;else if((v.w||0)>=2)tricky.push([k,v.w]);});
 return {words:e.length,mastered:m,acc:r+w?Math.round(r/(r+w)*100):null,answers:r+w,tricky:tricky.sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>x[0])};}
let REP={pid:null,range:28};
function report(pid){REP.pid=pid;renderReport();}
function closeReport(){const el=document.getElementById('ins-rep');if(el)el.remove();document.documentElement.classList.remove('ins-printing');}
function renderReport(){
 const p=byId(REP.pid);if(!p)return;const s=I(p);const now=new Date();
 const allKeys=Object.keys(p.daily||{}).sort();
 const firstEver=allKeys[0]?new Date(allKeys[0]+'T00:00'):now;
 let start=REP.range?addDays(new Date(now.toDateString()),-(REP.range-1)):firstEver;if(start<firstEver)start=firstEver;
 const sk=k6(start),sDash=dayKey(start);
 // practice summary: answers from p.daily (all math answers), minutes from tracked active time
 let days=new Set(),ans=0,right=0,secs=0;
 for(const k in (p.daily||{})){if(k>=sDash){const d=p.daily[k];const n=(d.r||0)+(d.w||0);if(n){days.add(k.replace(/-/g,'').slice(2));ans+=n;right+=d.r||0;}}}
 for(const k in s.d){if(k>=sk){secs+=s.d[k][0];if(s.d[k][0]>=120||s.d[k][1])days.add(k);}}
 const tracked=s.since&&s.since>sk;
 const mins=Math.round(secs/60);
 const mon=monday(now),recentK=k6(addDays(mon,-7));
 const periodWkK=k6(monday(start));
 const rows=[];const strengths=[],areas=[];
 (typeof OPS!=='undefined'?OPS:[]).forEach(op=>{const st=(p.stats&&p.stats[op])||{r:0,w:0};const nAll=st.r+st.w;const per=weekAcc(s,op,periodWkK);if(!nAll)return;
  const useP=per.n>=5;const acc=useP?per.acc:st.r/nAll;const n=useP?per.n:nAll;
  const wks=Object.keys(s.wk).filter(k=>k>=periodWkK&&s.wk[k][op]).sort();let rec={n:0},bef={n:0};
  if(wks.length>=2){const mid=wks[Math.ceil(wks.length/2)];rec=weekAcc(s,op,mid);bef=weekAcc(s,op,periodWkK,mid);}
  let trend='—';if(rec.n>=10&&bef.n>=10){const dd=rec.acc-bef.acc;trend=dd>=.05?`Improving (${Math.round(bef.acc*100)}% → ${Math.round(rec.acc*100)}%)`:dd<=-.05?`Dipping (${Math.round(bef.acc*100)}% → ${Math.round(rec.acc*100)}%)`:'Steady';}
  const Lv=levelOf(p,op),ex=expFor(p,op),basic=BASIC.includes(op);
  const at=`Level ${Lv} of ${maxL(op)}`; /* level→grade mapping differs per skill, so we show the level + its description instead */
  rows.push({op,name:opName(op),desc:descOf(op,Lv),at,acc,n,trend,Lv,ex,basic});
  if(!p.adult){const g=basic?gradeOfLevel(Lv):null;
   if(n>=20&&acc>=.85&&(!basic||Lv>=ex))strengths.push(`${opName(op)}: ${Math.round(acc*100)}% accurate (${descOf(op,Lv).toLowerCase()}).`);
   else if(n>=15&&acc<.75)areas.push(`${opName(op)}: ${Math.round(acc*100)}% accurate on ${descOf(op,Lv).toLowerCase()}.`);
   else if(basic&&n>=15&&Lv<ex-1)areas.push(`${opName(op)}: currently on ${descOf(op,Lv).toLowerCase()} — a little below the typical grade ${p.grade} level.`);
   else if(rec.n>=10&&bef.n>=10&&bef.acc-rec.acc>=.08)areas.push(`${opName(op)}: accuracy has dipped recently (${Math.round(bef.acc*100)}% → ${Math.round(rec.acc*100)}%).`);
   const lpk=s.lp[op];if(nAll>=30&&lpk&&daysAgo(lpk)>=14&&s.since&&daysAgo(s.since)>=14)areas.push(`${opName(op)}: not practiced since ${fromK6(lpk).toLocaleDateString('en-US',{month:'short',day:'numeric'})} — worth a short review.`);}});
 const facts=Object.entries(p.missed||{}).filter(([t,m])=>(m.fixed||0)<2&&m.n>=2&&/^[\d\s+\-−×÷*/=?]+$/.test(t)&&t.length<16).sort((a,b)=>b[1].n-a[1].n).slice(0,8).map(([t,m])=>`${t.replace(/\s*=\s*\?\s*$/,'')} = ${m.a}`);
 
 let fluency='';
 if(window.Mastery&&typeof Mastery.summary==='function'){try{const ms=Mastery.summary(p)||{};const ops=Object.keys(ms).filter(k=>ms[k]&&ms[k].total&&(ms[k].seen||ms[k].mastered));
  if(ops.length)fluency=`<div class="keep"><h2>Math fact fluency</h2><p class="muted">Facts answered correctly and quickly several times count as mastered.</p><div class="fl">${ops.map(k=>{const m=ms[k];const pc=Math.round((m.mastered||0)/m.total*100);return `<div><b>${E(opName(k))} facts</b><br>${m.mastered||0} of ${m.total} mastered<br><span class="muted">${m.seen||0} practiced</span><div class="m"><i style="width:${pc}%"></i></div></div>`;}).join('')}</div></div>`;}catch(e){console.warn(e);}}
 const rl=(p.readLog||[]).filter(r=>r.d>=sDash);const rlAll=p.readLog||[];
 const readList=(rl.length?rl:rlAll).slice(-10).reverse();
 const readLv=p.lib&&p.lib.rl?Math.floor(p.lib.rl):null;
 const sp=spellSum(p);
 const fmtD=d=>d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
 const first=String(p.name||'').trim().split(/\s+/)[0];
 const grade=p.adult?'Adult':gradeWord(p.grade);
 const tile=(v,l)=>`<div class="tile"><b>${v}</b><span>${l}</span></div>`;
 const html=`<div class="bar"><button onclick="Insights.closeReport()">✕ Close</button><select onchange="Insights._range(this.value)"><option value="28" ${REP.range===28?'selected':''}>Last 4 weeks</option><option value="56" ${REP.range===56?'selected':''}>Last 8 weeks</option><option value="0" ${!REP.range?'selected':''}>All time</option></select><span class="sp"></span><button class="go" onclick="window.print()">🖨️ Save as PDF<span class="ins-long"> / Print</span></button></div>
 <div class="paper">
  <div class="hdr"><div><h1>Home Learning Practice Report</h1><div class="sub"><b style="font-size:17px;color:#111">${E(first)}</b> &nbsp;·&nbsp; ${E(grade)}</div></div>
   <div class="r">${fmtD(start)} – ${fmtD(now)}<br>Prepared ${fmtD(now)}</div></div>
  <p style="margin-top:10px">${E(first)} practices at home with an adaptive math program. Each skill has its own difficulty level that rises after a run of correct answers and eases off after mistakes, so the levels below reflect what ${E(first)} is currently working on without help.</p>
  <h2>Practice summary</h2>
  <div class="tiles">${tile(days.size,'days practiced')}${tile(mins?fmtMin(mins):'—','active practice time'+(tracked?'*':''))}${tile(ans.toLocaleString(),'questions answered')}${tile(ans?Math.round(right/ans*100)+'%':'—','answered correctly')}</div>
  ${tracked?`<p class="muted" style="font-size:11.5px">* Practice time has been recorded since ${fmtD(fromK6(s.since))}.</p>`:''}
  <h2>Math skills</h2>
  <div class="tw"><table><tr><th>Skill</th><th>Currently practicing</th><th>Level</th><th class="n">Accuracy</th><th>Trend</th></tr>
  ${rows.map(r=>`<tr><td><b>${E(r.name)}</b></td><td>${E(r.desc)}</td><td>${E(r.at)}</td><td class="n">${r.acc===null?'—':Math.round(r.acc*100)+'%'} <span class="muted">(${r.n})</span></td><td>${E(r.trend)}</td></tr>`).join('')||'<tr><td colspan="5">No math practice recorded yet.</td></tr>'}</table></div>
  <p class="muted" style="font-size:11.5px">"Level" is the child's current level on the program's scale for that skill (it adapts continuously so the child answers about 80% correctly). Accuracy is for this period where there is enough data (question count in brackets). Trend compares the earlier and later weeks of the period.</p>
  ${p.adult?'':`<div class="two keep"><div><h2>Strengths</h2>${strengths.length?`<ul>${strengths.slice(0,5).map(t=>`<li>${E(t)}</li>`).join('')}</ul>`:'<p class="muted">Not enough practice yet to name clear strengths.</p>'}</div>
  <div><h2>Areas to practice</h2>${areas.length?`<ul>${areas.slice(0,4).map(t=>`<li>${E(t)}</li>`).join('')}</ul>`:(facts.length?'':'<p class="muted">No particular trouble spots right now.</p>')}${facts.length?`<p style="margin-top:6px"><b>Facts to review:</b> ${facts.map(f=>`<span style="white-space:nowrap">${E(f)}</span>`).join(', ')}</p>`:''}</div></div>`}
  ${fluency}
  ${readList.length||readLv?`<div class="keep"><h2>Reading</h2><p>${readLv?`Current reading level: <b>${readLv} of 10</b> (the program's 10 levels span roughly 1st to 12th grade). `:''}${rl.length?`${pl(rl.length,'story','stories')} read in this period.`:''} Each story is followed by comprehension questions (main idea, details, inference, vocabulary).</p>
   ${readList.length?`<div class="tw"><table><tr><th style="width:70px">Date</th><th>Story</th><th class="n" style="width:60px">Level</th><th class="n" style="width:140px">Right on first try</th></tr>${readList.map(r=>`<tr><td style="white-space:nowrap">${E(new Date(r.d+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}))}</td><td>${E(r.t)}</td><td class="n">${r.lv||'—'}</td><td class="n">${r.s} of ${r.n||3}</td></tr>`).join('')}</table></div>`:''}</div>`:''}
  ${sp?`<div class="keep"><h2>Spelling</h2><p><b>${sp.words}</b> words practiced, <b>${sp.mastered}</b> spelled correctly at least twice in a row${sp.acc!==null?`, ${sp.acc}% of ${sp.answers} attempts correct`:''}.</p>${sp.tricky.length?`<p>Words that still need practice: ${sp.tricky.map(E).join(', ')}.</p>`:''}</div>`:''}
  <div class="fine">Generated from ${E(first)}'s home practice records. Questions are answered without a time limit; difficulty adjusts automatically for each skill. Shared by ${E(first)}'s family.</div>
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
