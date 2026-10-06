/* ================= Today's Adventure + math as the fuel =================
   PART A  The Elder Wiz's 3 quests (Oct 2026, replaces Today's Adventure's steps; see the PART A comment below).
           Before Oct 2026, Today's Adventure was:
             1 Fix-it        3 of the kid's own missed problems, hint shown up front
             2 Focus battle  one shortened battle in the kid's weakest skill (or the monster they left yesterday)
             3 School work   (only for kids with their own school content in content.js) one quiz or homework set from
                             this week's worksheets that isn't passed yet (80%+ first try), newest first; once a day
             4 Pick your fun a small reward for camp, pets or the coin purse, plus the day's Adventure Star
           Optional: nothing is locked behind it.
   PART B  Math as the fuel: Pet Home "Teach a trick" (3 a day, optional). Camp asks no questions: sending pets off and
             opening their sacks never needs math (owner's request, Oct 2026).
           A wrong answer never takes anything away; it shows how to solve it and gives fewer extras.
   PART C  Battle exit: "Show me how" before leaving; a monster the kid leaves is tomorrow's Focus battle.
   PART D  Parent Corner summary (window.MQ_PARENT).
   Saved in p.tad: {d, s(0..3), cur{zid,i,op}, owe{zid,i}, tr, stars, streak, last, w{k,adv,fix,fun,funR}}
   Uses Math Quest globals: P, save, go, goStay, modal, closeModal, toast, esc, SFX, genQ, lvl, pickOpFair, hintHTML, dayKey,
   weekKey, ZONES, zoneLocked, startBattle, B, curScreen, petOf, petData, petMood, petGain, MOOD_MAX, hook, wkAnswer,
   champPts, youngReader, say, voiceOn, speakable, speakToggle, OPNAME, curRound, nextBattleFor, state, Adv.          */
(function(){
'use strict';
const FIX_N=3, TRICKS=3, MIN_BATTLES=3, BASIC=['add','sub','mul','div'];
const TRICK_NAMES=['Roll over','Shake','Spin','High five','Sit','Play dead','Jump','Fetch','Wave','Speak','Twirl','Bow'];
const today=()=>dayKey();
function tad(p){const t=p.tad=p.tad||{};const d=today();
 if(t.d!==d){t.d=d;t.s=0;t.cur=null;t.tr=0;t.pk=null;t.sch=null;t.nx=0;} /* t.rw (an earned reward) and t.met carry over */
 const wk=weekKey();if(!t.w||t.w.k!==wk)t.w={k:wk,adv:0,fix:0,fun:0,funR:0};
 return t;}
const zoneOK=(p,z)=>!!z&&z.op!=='mix'&&!z.event&&!zoneLocked(z,p);

/* ---------- questions ---------- */
/* a saved 'Flip it' problem (□ − □ = 15) has lost its rev flag, so also check the text itself is plain numbers and signs */
const plain=q=>!!q&&!q.tpl&&!q.rev&&typeof q.answer==='number'&&q.answer>=0&&!!q.text&&/^\d[\d,.]*( [+−×÷\-] \d[\d,.]*)+$/.test(q.text);
function funQ(p){for(let k=0;k<25;k++){const op=pickOpFair(p);const q=genQ(op,Math.max(1,Math.min(10,lvl(p,op))));if(plain(q))return q;}
 return genQ('add',Math.max(1,Math.min(10,lvl(p,'add'))));}
function fixList(p){
 const c=Object.values(p.missed||{}).filter(m=>m.q&&(m.fixed||0)<2&&BASIC.includes(m.q.op)&&plain(m.q)).sort((a,b)=>(b.n||0)-(a.n||0)||String(b.last||'').localeCompare(String(a.last||'')));
 const out=[],ops={};
 c.forEach(m=>{if(out.length<FIX_N&&!ops[m.q.op]){ops[m.q.op]=1;out.push(m);}});
 c.forEach(m=>{if(out.length<FIX_N&&!out.includes(m))out.push(m);});
 const qs=out.map(m=>Object.assign({},m.q,{practice:true,_fix:true}));
 while(qs.length<FIX_N)qs.push(funQ(p));
 return qs;}
/* one answer outside a battle: counts in the kid's stats, reports and weekly points; never moves the difficulty dial */
function record(p,q,ok,secs,kind){try{
 p.stats[q.op]=p.stats[q.op]||{r:0,w:0};p.stats[q.op][ok?'r':'w']++;
 const dk=today();p.daily=p.daily||{};p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][ok?'r':'w']++;
 try{hook('answer',p,q,ok,secs,{slip:false,zone:'daily',round:1,boss:false});}catch(e){}
 const t=tad(p);
 if(kind==='fix'){if(q._fix&&ok)t.w.fix++;}else{t.w.fun++;if(ok)t.w.funR++;}
 const mm=p.missed[q.text];
 if(ok){try{wkAnswer(p,champPts(p,q.L,q.op));}catch(e){}
  if(mm&&q._fix){mm.fixed=(mm.fixed||0)+1;p.coins+=3;}}
 else if(mm){mm.n=(mm.n||0)+1;mm.last=dk;mm.fixed=0;}
 else{p.missed[q.text]={n:1,a:q.answer,op:q.op,last:dk,fixed:0,q:{op:q.op,L:q.L,a:q.a,b:q.b,c:q.c,answer:q.answer,text:q.text}};}
 save();}catch(e){}}

/* ---------- the question card (its own layer, so it can sit on top of the welcome-home card) ---------- */
let ST=null;
function css(){if(document.getElementById('dqCSS'))return;const s=document.createElement('style');s.id='dqCSS';s.textContent=`
.dq-ov{position:fixed;inset:0;z-index:120;background:rgba(10,5,30,.72);display:grid;place-items:center;padding:12px;overflow:auto}
.dq-card{background:#fff;color:#241a3d;border-radius:24px;padding:18px;width:100%;max-width:440px;text-align:center;animation:pop .25s}
.dq-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:600;color:#6b6486;font-size:15px}
.dq-x{border:0;background:#f1eefc;border-radius:12px;min-width:44px;min-height:44px;font-size:18px;color:#241a3d}
.dq-card .big-emoji{margin:0;line-height:1.1}.dq-card h2{margin:4px 0 2px;font-size:22px}.dq-sub{color:#6b6486;font-size:15px;margin:0 0 6px}
.dq-q{font-size:36px;font-weight:700;margin:8px 0;display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap}
.dq-in{min-width:74px;border-bottom:4px solid #7048e8;color:#7048e8;padding:0 6px}
.dq-spk{border:0;background:#f1eefc;border-radius:50%;width:44px;height:44px;font-size:18px}
.dq-hint{background:#f1eefc;border-radius:16px;padding:8px 10px;margin:8px 0;font-size:16px}
.dq-msg{font-weight:600;min-height:24px;margin:4px 0}.dq-msg.bad{color:#e8590c}.dq-msg.good{color:#2f9e58}
.dq-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.dq-pad button{border:0;border-radius:14px;background:#f1eefc;font:inherit;font-size:24px;font-weight:700;min-height:54px;color:#241a3d;box-shadow:0 3px 0 #d7cff5}
.dq-pad button:active{transform:translateY(2px);box-shadow:none}
.dq-pad .ok{background:#2f9e58;color:#fff;box-shadow:0 3px 0 #1f7a42}.dq-pad .del{background:#ffe3e3;box-shadow:0 3px 0 #f5bcbc}
.dq-card.still{animation:none}
.dq-card.shake{animation:shakex .4s}
.tad-card{background:#fff;color:#241a3d;border-radius:22px;padding:14px 16px;margin:6px 0 14px;box-shadow:0 6px 0 rgba(0,0,0,.18)}
.tad-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.tad-head h3{margin:0;font-size:20px}
.tad-streak{background:#fff3bf;border-radius:999px;padding:3px 10px;font-weight:600;font-size:14px}
.tad-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
.tad-step{background:#f1eefc;border:2px solid #e2dcf5;border-radius:14px;padding:8px 10px;font-size:14px;text-align:left}
.tad-step b{display:block;font-size:15px}.tad-step.done{background:#e3f6ea;border-color:#9bd8b3}.tad-step.now{background:#fff7df;border-color:#f5b731}
.tad-foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.tad-foot small{color:#6b6486;font-size:14px}
.tad-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
.tad-pick button{border:2px solid #e2dcf5;background:#f1eefc;border-radius:16px;padding:10px 6px;font:inherit;color:#241a3d;min-height:44px}
.tad-pick button b{display:block;font-size:30px}.tad-pick small{color:#6b6486;display:block}
.tad-trick{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between}
.eq-card{max-width:580px}.eq-talk{display:flex;gap:12px;align-items:flex-end;text-align:left}.eq-av{flex:0 0 84px}.eq-av .npc-art{height:126px;width:auto;margin:0}
.eq-bub{flex:1;background:#f3f0ff;border:3px solid #b197fc;border-radius:18px;padding:10px 14px;font-size:17px;line-height:1.4;color:#241a3d}.eq-who{display:block;color:#7048e8;font-size:14px}
.eq-track{display:flex;align-items:stretch;gap:5px;margin:14px 0 8px}.eq-ar{align-self:center;color:#b5a8ff;font-weight:800}
.eq-q{flex:1;border:3px solid #e6e0ff;border-radius:14px;padding:6px;text-align:center;font-size:13px;font-weight:600;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#faf9ff;color:#6a5fa0;min-height:84px;min-width:0}
.eq-q .e{font-size:24px;line-height:1.15}.eq-q b{font-size:14px;color:#241a3d}.eq-q small{font-size:12px;color:#6a5fa0;font-weight:500}
.eq-q.on{flex:1.9;border-color:#7c5cff;background:#f1edff;box-shadow:0 0 0 4px #7c5cff22}.eq-q.done{border-color:#40c057;background:#ebfbee;color:#2b8a3e}
.eq-q.mys .e{color:#b5a8ff}.eq-q.gift{flex:.8;border-style:dashed;border-color:#f2b73a;background:#fff9db;color:#9c6b00}.eq-q.gift.done{border-style:solid}
.eq-home h3{display:flex;align-items:center;gap:6px}.eq-home h3 .qface{height:34px;margin:0}
.eq-rw{text-align:center;margin:10px 0 2px}.eq-rw .big{font-size:56px;line-height:1}.eq-rw b{display:block;font-size:20px;margin-top:4px}.eq-rw small{display:block;color:#6a5fa0}
.eq-spark{display:inline-block;animation:eqspin 3s linear infinite}@keyframes eqspin{to{transform:rotate(360deg)}}
.eq-gag{position:relative;height:124px;margin-top:8px}.eq-hv{position:absolute;right:6px;bottom:0;width:80px;height:104px}.eq-hv svg,.eq-hv2 svg{width:100%;height:100%}
.eq-sw{position:absolute;left:30px;top:30px;font-size:44px;animation:eqsw 3.4s ease-in-out forwards}
@keyframes eqsw{0%,12%{left:30px;transform:scale(1);opacity:1}40%{left:calc(100% - 110px);transform:scale(1)}55%{transform:scale(.7)}70%{transform:scale(.35);opacity:1}80%,100%{left:calc(100% - 110px);transform:scale(0);opacity:0}}
.eq-blech{position:absolute;right:92px;top:0;background:#fff4e6;border:3px solid #ffa94d;border-radius:16px;padding:6px 10px;font-size:15px;font-weight:600;opacity:0;animation:eqbl .5s 2.8s forwards;max-width:240px;text-align:left}@keyframes eqbl{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.eq-heroline{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:10px}.eq-hv2{width:70px;height:91px;flex:none}.eq-hbub{background:#fff4e6;border:3px solid #ffa94d;border-radius:18px;padding:8px 12px;font-size:16px;max-width:70%}
.eq-pick button b{font-size:28px}
@media (max-width:520px){.tad-steps,.tad-pick{grid-template-columns:1fr}.eq-q{min-height:70px;font-size:12px}.eq-q.on{flex:2.4}.eq-av{flex-basis:62px}.eq-av .npc-art{height:94px}.eq-bub{font-size:15px}.eq-track{gap:3px}.eq-ar{display:none}}`;document.head.appendChild(s);}
function speakQ(q){try{const s=typeof qSpeakFor==='function'?qSpeakFor(q):null;const t=s&&s.t?s.t:speakable(q.text+' = what number');say(t,s&&s.r);}catch(e){}}
function ask(q,o){css();shut();const p=P();ST={q,o:o||{},inp:'',left:(o&&o.tries)||2,t0:performance.now(),first:true,msg:'',cls:'',hint:!!(o&&o.hintFirst),end:false,ok:false};
 const el=document.createElement('div');el.className='dq-ov';el.id='dqOv';document.body.appendChild(el);paint();
 if(youngReader(p)&&voiceOn())setTimeout(()=>{if(ST&&ST.q===q)speakQ(q);},350);}
function paint(){const el=document.getElementById('dqOv');if(!el||!ST)return;const {q,o}=ST;let hint='';if(ST.hint){try{hint=hintHTML(q)||'';}catch(e){hint='';}}
 const still=ST.shown?' still':'';ST.shown=true;
 el.innerHTML=`<div class="dq-card${still}" id="dqCard"><div class="dq-top"><span>${o.step||''}</span>${o.canClose===false?'':'<button class="dq-x" title="Not now" onclick="Daily._x()">✕</button>'}</div>
 <div class="big-emoji" style="font-size:44px">${o.emoji||'🧭'}</div><h2>${o.title||''}</h2>${o.sub?`<p class="dq-sub">${o.sub}</p>`:''}
 <div class="dq-q"><span>${esc(q.text)} =</span><span class="dq-in">${ST.end?q.answer:(ST.inp||'?')}</span><button class="dq-spk" title="Read it to me" onclick="Daily._say()">🔊</button></div>
 ${hint?`<div class="dq-hint">${hint}</div>`:(ST.end?'':'<div><button class="btn ghost dark small" onclick="Daily._hint()">💡 Show me a hint</button></div>')}<div class="dq-msg ${ST.cls}">${ST.msg}</div>
 ${ST.end?`<div class="row"><button class="btn green big" onclick="Daily._next()">${ST.ok?'Yay! ➜':'Got it ➜'}</button></div>`:
 `<div class="dq-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="Daily._k('${n}')">${n}</button>`).join('')}<button class="del" onclick="Daily._k('del')">⌫</button><button onclick="Daily._k('0')">0</button><button class="ok" onclick="Daily._k('go')">✓</button></div>`}</div>`;}
/* a number press only changes the answer box; redrawing the whole card made it flicker */
function setIn(){const e=document.querySelector('#dqOv .dq-in');if(e)e.textContent=ST.inp||'?';else paint();}
function key(k){if(!ST||ST.end)return;
 if(k==='del'){ST.inp=ST.inp.slice(0,-1);setIn();return;}
 if(k!=='go'){if(ST.inp.length<7)ST.inp+=k;try{SFX.tap();}catch(e){}setIn();return;}
 if(!ST.inp)return;const q=ST.q,v=parseInt(ST.inp,10),ok=v===q.answer||!!(q.alt&&q.alt.includes(v));
 const first=ST.first;if(ST.first){record(P(),q,ok,(performance.now()-ST.t0)/1000,ST.o.kind||'fun');ST.first=false;}
 if(ok){try{SFX.correct();}catch(e){}ST.ok=true;ST.end=true;ST.msg=first?(ST.o.right||'That\'s it! ⭐'):(ST.o.right2||'You got it this time! ⭐');ST.cls='good';paint();return;}
 try{SFX.wrong();}catch(e){}ST.left--;ST.inp='';ST.hint=true;
 if(ST.left>0){ST.msg='Not quite. Look at the hint and try once more!';ST.cls='bad';paint();const c=document.getElementById('dqCard');if(c)c.classList.add('shake');return;}
 ST.end=true;ST.msg=`It was ${q.answer}. ${ST.o.wrong||'You\'ll get it next time!'}`;ST.cls='bad';paint();}
function shut(){const el=document.getElementById('dqOv');if(el)el.remove();try{speechSynthesis.cancel();}catch(e){}}
function next(){if(!ST)return;const s=ST;ST=null;shut();try{s.o.onDone&&s.o.onDone(s.ok);}catch(e){console.warn('daily',e);}}
function closeAsk(){if(!ST)return;const s=ST;ST=null;shut();try{s.o.onClose&&s.o.onClose();}catch(e){}}
document.addEventListener('keydown',e=>{if(!ST)return;if(/^[0-9]$/.test(e.key)){key(e.key);e.preventDefault();e.stopPropagation();}else if(e.key==='Backspace'){key('del');e.preventDefault();e.stopPropagation();}else if(e.key==='Enter'){if(ST.end)next();else key('go');e.preventDefault();e.stopPropagation();}},true);
/* ask several questions in a row; done(rightCount) */
function series(qs,mk,done){let i=0,right=0;const go1=()=>{if(i>=qs.length){done(right);return;}const o=mk(i,qs.length);o.onDone=ok=>{if(ok)right++;i++;go1();};ask(qs[i],o);};go1();}

/* ---------- PART A: the Elder Wiz's 3 quests (owner, Oct 2026) ----------
   The one to-do list in the game. Each day the Elder Wiz gives 3 quests, one at a time; as soon as one is done his card
   pops up with the next (no need to find him). All three = his special reward, which he brings to the hero on the map.
     1 🎯 Practice  this week's school work if it isn't passed yet (kids with their own content), otherwise Fix-it
     2 ⚔️ Battle    the monster left yesterday, sometimes a Bonus World monster, else the weakest skill's next monster
     3 🎉 Fun       read a story, make lunch, teach a pet trick or do a Fact Sprint (any of them counts)
   Not finished by midnight: tomorrow brings 3 new ones. An earned reward (t.rw) is never lost: it waits until he gives it.
   The first map visit of the day he walks up to the hero with today's quests (t.met); elder.js does the walking (MQ_ELDER.seek). */
function focus(p){const t=tad(p);
 if(t.owe){const z=ZONES.find(x=>x.id===t.owe.zid);if(zoneOK(p,z))return {zid:z.id,i:Math.min(4,t.owe.i|0),op:z.op,owed:true};t.owe=null;}
 const first=z=>{const cr=curRound(p,z.id);const arr=cr===1?(p.progress[z.id]||[]):(((p.rounds||{})[z.id]||{})[cr]||[]);let i=[0,1,2,3,4].find(k=>!arr[k]);if(i===undefined)i=Math.floor(Math.random()*5);return i;};
 try{const bz=typeof bonusZone==='function'?ZONES.find(x=>x.id===bonusZone(p)):null;if(bz&&zoneOK(p,bz)&&Math.random()<.35)return {zid:bz.id,i:first(bz),op:bz.op,bonus:true};}catch(e){}
 let best=null;ZONES.forEach(z=>{if(!zoneOK(p,z))return;const s=p.stats[z.op]||{r:0,w:0},tot=s.r+s.w;if(tot<8)return;
  const rec=(p.recent||{})[z.op]||[];let acc=s.r/tot;if(rec.length>=4)acc=.4*acc+.6*(rec.reduce((a,b)=>a+b,0)/rec.length);
  if(!best||acc<best.acc)best={z,acc};});
 let z=best&&best.z;if(!z){const n=nextBattleFor(p);z=n&&zoneOK(p,n.z)?n.z:ZONES.find(x=>zoneOK(p,x));}
 if(!z)return null;return {zid:z.id,i:first(z),op:z.op};}
function show(p){return !!p&&p.setup&&(p.battles||0)>=MIN_BATTLES;}
/* ---------- school work (the kid's own weekly worksheets, content.js) ---------- */
const PASS=80;
function ownSchool(p){try{if(p&&!p.ckey)kidData(p); /* kidData matches the hero to their school content by name */
 return !!(p&&p.ckey&&typeof CONTENT!=='undefined'&&CONTENT.kids&&CONTENT.kids[p.ckey]);}catch(e){return false;}}
function schoolItems(p){if(!ownSchool(p))return [];const out=[];try{quizList(p).forEach(x=>out.push({kind:'quiz',id:x.id,title:x.title,emoji:x.emoji||'📚',st:(p.quizStats||{})[x.id]}));hwList(p).forEach(x=>out.push({kind:'hw',id:x.id,title:x.title,emoji:'📝',st:(p.hwStats||{})[x.id]}));}catch(e){}return out;}
function schoolDue(p){return schoolItems(p).find(x=>!(x.st&&(x.st.best||0)>=PASS))||null;}
function schoolToday(p){return schoolItems(p).find(x=>x.st&&x.st.d===today())||null;}
/* today's quest 1: school work or Fix-it, fixed for the day once chosen */
function prac(p){const t=tad(p);if(!t.pk){const due=schoolDue(p);if(due&&!schoolToday(p)){t.pk='school';t.sch={kind:due.kind,id:due.id,title:due.title,emoji:due.emoji};}else t.pk='fix';}return t.pk;}
function cur(p){const t=tad(p);if(!t.cur)t.cur=focus(p);return t.cur;}
const ORD=['first','second','last'];
function qInfo(p,k){const t=tad(p);
 if(k===0){if(prac(p)==='school'&&t.sch)return {e:'📚',t:'School work',s:t.sch.title};return {e:'🎯',t:'Warm up!',s:'Fix 3 problems you missed'};}
 if(k===1){const c=cur(p),z=c&&ZONES.find(x=>x.id===c.zid);if(!z)return {e:'⚔️',t:'Win a battle',s:'in any world'};const m=(z.mons&&z.mons[c.i])||['a monster'];return {e:'⚔️',t:`Beat ${m[0]}`,s:`in ${z.name}${c.bonus?' (Bonus World! 🪙×1.5)':c.owed?' (it\'s been waiting for you!)':''}`};}
 return {e:'🎉',t:'Pick something fun',s:'A story, lunch, a pet trick or a Fact Sprint'};}
/* "School work: Reading…", "Warm up! Fix 3…", "Beat Grumbug in Addition Forest" */
function qLine(q){return `<b>${esc(q.t)}</b>${/[!?]$/.test(q.t)||/^in /.test(q.s)?' ':': '}${esc(q.s)}`;}
function face(big){try{return typeof qFace==='function'?qFace('elder',big):'🧙';}catch(e){return '🧙';}}
function track(p){const t=tad(p),s=Math.min(3,t.s);
 return `<div class="eq-track">${[0,1,2].map(k=>{const q=qInfo(p,k);return k<s?`<div class="eq-q done"><span class="e">✅</span>${esc(q.t)}</div>`:k===s?`<div class="eq-q on"><span class="e">${q.e}</span><b>${esc(q.t)}</b><small>${esc(q.s)}</small></div>`:`<div class="eq-q mys"><span class="e">?</span>Quest ${k+1}</div>`;}).join('<span class="eq-ar">›</span>')}<span class="eq-ar">›</span><div class="eq-q gift ${t.s>=3?'done':''}"><span class="e">🎁</span>${t.s>=3?'Earned!':'Special reward'}</div></div>`;}
function goBtn(p){const t=tad(p);if(t.s>=3)return '';return `<button class="btn green big" onclick="closeModal();Daily.go()">${t.s===0?'Let\'s go! ➜':t.s===1?'Battle ➜':'Pick my fun ➜'}</button>`;}
function card(html){css();modal(`<div class="mcard eq-card"><div class="eq-talk"><div class="eq-av">${face(true)}</div><div class="eq-bub"><b class="eq-who">🧙 Elder Wiz</b>${html}</div></div>`);}
/* the card on Me → Quests */
function cardHTML(p){try{if(!show(p))return '';css();const t=tad(p);
 if(t.s>=3)return `<div class="tad-card eq-home"><div class="tad-head"><h3>${face(false)} Today's 3 quests: done! ⭐</h3><span class="tad-streak">🔥 ${t.streak||1} day${(t.streak||1)>1?'s':''} in a row</span></div>${track(p)}<div class="tad-foot"><small>${t.rw?'🎁 The Elder Wiz has your special reward. Find him on the map!':'Come back tomorrow for 3 new quests.'}</small>${t.rw?'<button class="btn gold" onclick="go(\'world\')">To the map ➜</button>':''}</div></div>`;
 const q=qInfo(p,t.s);
 return `<div class="tad-card eq-home"><div class="tad-head"><h3>${face(false)} The Elder Wiz's 3 quests</h3>${t.streak&&t.last?`<span class="tad-streak">🔥 ${t.streak} in a row</span>`:''}</div>${track(p)}
 <div class="tad-foot"><button class="btn green" onclick="Daily.go()">${q.e} ${t.s===0?'Start':t.s===1?'Battle':'Pick my fun'} ➜</button><small>Quest ${t.s+1} of 3 · finish all three for his special reward 🎁</small></div></div>`;}catch(e){return '';}}
function redraw(){try{if(curScreen==='me')goStay('me','quests');}catch(e){}}
/* start the current quest */
function goQ(){const p=P();if(!show(p))return;const t=tad(p);if(t.s===0){if(prac(p)==='school')school();else fix();}else if(t.s===1)battle();else if(t.s===2)funCard();}
function fix(){const p=P();if(!show(p))return;const t=tad(p);if(t.s!==0)return;const qs=fixList(p);
 series(qs,(i,n)=>({kind:'fix',step:`Quest 1 · ${i+1} of ${n}`,emoji:'🔧',title:qs[i]._fix?'You met this one before':'Warm-up',sub:qs[i]._fix?'Take your time. Tap the hint if you want help.':'A quick one to get started.',tries:2,right:qs[i]._fix?'Fixed! +3 🪙':'That\'s it! ⭐',right2:qs[i]._fix?'You got it! It will come back once more to be sure.':'You got it this time! ⭐',onClose:redraw}),
 right=>{const p=P(); /* fetch the hero again: an online sync during the questions replaces the player object, and progress written to the old one is lost */
  advance(p,`You got <b>${right} of ${qs.length}</b>!`);});}
function school(){const p=P();if(!show(p))return;const t=tad(p);if(t.s!==0||!t.sch){fix();return;}
 try{startQuest(t.sch.kind,t.sch.id);if(typeof B!=='undefined'&&B){B.backTo='me';B.backArg='quests';}}catch(e){t.pk='fix';fix();}}
function battle(){const p=P();const t=tad(p);if(t.s!==1)return;const c=cur(p);if(!c){advance(p,'');return;}save();
 startBattle(c.zid,c.i,null,{short:true});try{if(typeof B!=='undefined'&&B){B.backTo='me';B.backArg='quests';}}catch(e){}}
/* quest 3: the choices (any of them counts, even done without this card) */
function funCard(){const p=P();const t=tad(p);if(t.s!==2)return;const pet=petOf(p),lunchDone=!!(p.cafe&&p.cafe.d===today()&&p.cafe.done),tricks=pet&&(t.tr||0)<TRICKS;
 card(`Two down, one to go! For your <b>last quest</b>, pick something fun:`);
 const m=document.querySelector('#modal .eq-card');if(m)m.insertAdjacentHTML('beforeend',`${track(p)}<div class="tad-pick eq-pick">
 <button onclick="closeModal();Daily._fun('story')"><b>📚</b>Read a story<small>in the Library</small></button>
 ${lunchDone?'':'<button onclick="closeModal();Daily._fun(\'lunch\')"><b>🍱</b>Make lunch<small>in the Cafeteria</small></button>'}
 ${tricks?`<button onclick="closeModal();Daily._fun('trick')"><b>${pet.e}</b>Teach ${esc(pet.name)} a trick<small>one question</small></button>`:''}
 ${window.Mastery?'<button onclick="closeModal();Daily._fun(\'sprint\')"><b>⚡</b>Fact Sprint<small>in the Fact Gym</small></button>':''}</div>
 <div class="row"><button class="btn ghost dark" onclick="closeModal()">Later</button></div>`);}
function fun(k){if(k==='story'){try{LIB=null;}catch(e){}go('library');}else if(k==='lunch'){try{CAFE=null;}catch(e){}go('cafe');}else if(k==='trick')trick();else if(k==='sprint'&&window.Mastery)Mastery.open('me');}
/* a quest is done: next card (now if nothing else is showing, else as soon as it can) or, after the third, the reward */
function advance(p,note){const t=tad(p);if(t.s>=3)return;t.s++;if(t.s===1&&!t.cur)t.cur=focus(p);
 if(t.s>=3){finishDay(p);return;}t.nx=note||1;save();redraw();setTimeout(showNext,250);}
function busy(){return !!(document.querySelector('#modal.show')||document.getElementById('dqOv')||(typeof curScreen!=='undefined'&&['battle','fade','inner','cave'].includes(curScreen)));}
function showNext(){const p=P();if(!p||!show(p))return;const t=tad(p);if(!t.nx||t.s>=3||busy())return;const note=typeof t.nx==='string'?t.nx+' ':'';t.nx=0;save();
 card(`${note}Well done, young wizard! Your <b>${ORD[t.s]} quest</b> is… ${qLine(qInfo(p,t.s))}!`);
 const m=document.querySelector('#modal .eq-card');if(m)m.insertAdjacentHTML('beforeend',`${track(p)}<div class="row"><button class="btn ghost dark" onclick="closeModal()">Later</button>${goBtn(p)}</div>`);}
/* all three: streak, then his reward (rolled now, handed over on the map) */
function finishDay(p){const t=tad(p);const d=today(),days=p.days||[];const prev=days[days.length-1]===d?days[days.length-2]:days[days.length-1];
 t.streak=(t.last&&t.last===prev)?(t.streak||0)+1:(t.last===d?(t.streak||1):1);t.last=d;t.stars=(t.stars||0)+1;t.s=3;t.nx=0;t.w.adv++;try{wkBump(p,'adv');}catch(e){}
 t.rw=roll(p,t);save();redraw();try{SFX.level();}catch(e){}
 setTimeout(()=>{if(busy())return;if(curScreen==='world'&&window.MQ_ELDER&&MQ_ELDER.seek){MQ_ELDER.seek('reward');return;}
  card(`All three quests! I knew you could do it! 🎉 I have your <b>special reward</b>… come and find me on the map!`);const m=document.querySelector('#modal .eq-card');if(m)m.insertAdjacentHTML('beforeend',`${track(p)}<div class="row"><button class="btn ghost dark" onclick="closeModal()">Later</button><button class="btn gold big" onclick="closeModal();go('world')">To the map ➜</button></div>`);},300);}
/* ---------- his reward bag ----------
   most days coins (more on a streak) or pet snacks; now and then something silly (plus 15 coins for being brave);
   rarely a Mystery Egg; always an egg on day 7, 14…, and a Legend egg on day 30, 60… of a streak */
const SILLY=[{id:'sandwich',e:'🥪',say:'Here\'s my leftover sandwich… it\'s not <i>too</i> soggy!',hero:'*munch munch*… Blech! I make better food in the Cafeteria! 🤢',eat:1,ok:'Um… thanks?'},
 {id:'cookie',e:'🍪',say:'A cookie I baked last Tuesday. Or was it last year?',hero:'*crunch*… ow, my teeth!',eat:1,ok:'Thanks… I think'},
 {id:'sock',e:'🧦',say:'One magic sock! I lost the other one.',hero:'…It smells like cabbage.',keep:1,ok:'Okay…'},
 {id:'rock',e:'🪨',say:'This is <b>Gerald</b>. He\'s a very good rock. Please take care of him.',hero:'…Hi, Gerald.',keep:1,ok:'I\'ll keep him safe'}];
function roll(p,t){const st=t.streak||1;if(st%30===0)return {k:'legend'};if(st%7===0)return {k:'egg',streak:st};const r=Math.random();
 if(r<.1)return {k:'egg'};if(r<.25)return {k:'silly',id:SILLY[Math.floor(Math.random()*SILLY.length)].id};if(r<.4)return {k:'snack'};
 return {k:'coins',n:40+Math.floor(Math.random()*41)+Math.min(20,(st-1)*3)};}
function rewardCard(){const p=P();const t=tad(p);const r=t.rw;if(!r)return false;css();let say='',body='',ok='Thanks!';
 if(r.k==='coins'){p.coins+=r.n;say='All three! I knew you could do it. Here you go!';body=`<div class="eq-rw"><div class="big">🪙</div><b>${r.n} coins</b>${(t.streak||1)>1?`<small>🔥 ${t.streak} days in a row</small>`:''}</div>`;}
 else if(r.k==='snack'){p.pantry=p.pantry||{};['apple','carrot','cookie'].forEach(f=>{p.pantry[f]=(p.pantry[f]||0)+1;});say='All three! Here, some treats for your pets!';body='<div class="eq-rw"><div class="big">🧺</div><b>3 pet snacks</b><small>They\'re in your pet food bag</small></div>';}
 else if(r.k==='egg'){p.eggs=(p.eggs||0)+1;say=r.streak?`${r.streak} days in a row! That deserves something <b>really</b> special…`:'You did so well that I found something special…';body='<div class="eq-rw"><div class="big"><span class="eq-spark">✨</span>🥚<span class="eq-spark">✨</span></div><b>A Mystery Egg!</b><small>Hatch it in the Pet Home</small></div>';ok='WOW! 🎉';}
 else if(r.k==='legend'){p.legendEggs=(p.legendEggs||0)+1;say=`${t.streak} days in a row! You are a true wizard. This is my most special treasure…`;body='<div class="eq-rw"><div class="big"><span class="eq-spark">✨</span>🌟<span class="eq-spark">✨</span></div><b>A Legend Egg!</b><small>Epic or Legendary pet inside. Hatch it in the Pet Home</small></div>';ok='WOW!!! 🎉';}
 else{const s=SILLY.find(x=>x.id===r.id)||SILLY[0];p.coins+=15;if(s.keep){p.elderGifts=p.elderGifts||{};p.elderGifts[s.id]=(p.elderGifts[s.id]||0)+1;}say=`All three! Here's something from my pocket… ${s.say}`;ok=s.ok;
  const hero=typeof heroSVG==='function'?heroSVG(p.look,{spell:p.spell}):'';
  body=s.eat?`<div class="eq-gag"><span class="eq-sw">${s.e}</span><div class="eq-blech">${s.hero}</div><div class="eq-hv">${hero}</div></div><div class="eq-rw"><small>…and 🪙 15 coins for being brave</small></div>`
   :`<div class="eq-heroline"><div class="eq-hbub">${s.hero}</div><div class="eq-hv2">${hero}</div></div><div class="eq-rw"><small>${s.e} goes in your 🎒 Treasures · 🪙 15 coins</small></div>`;}
 t.rw=null;save();try{SFX.win();}catch(e){}
 card(say);const m=document.querySelector('#modal .eq-card');if(m)m.insertAdjacentHTML('beforeend',`${body}<div class="row"><button class="btn gold big" onclick="closeModal();Daily._after()">${ok}</button></div>`);return true;}
/* he arrives on the map (elder.js): today's quests, or the reward */
function arrive(why){const p=P();if(!p||!show(p)||busy())return false;const t=tad(p);
 if(t.rw)return rewardCard();
 t.met=today();save();
 if(t.s>=3){card('You did all three quests today! Come back tomorrow and I\'ll have 3 new ones for you.');return true;}
 if(t.s===0){card(`Ah, there you are! I have <b>3 quests</b> for you today. As you finish each one, I'll give you the next. And if you finish all three… I have a <b>special reward</b>! 🎁<br><br>Your first quest is… ${qLine(qInfo(p,0))}!`);}
 else card(`Hello again! You're doing great. Your ${ORD[t.s]} quest is… ${qLine(qInfo(p,t.s))}!`);
 const m=document.querySelector('#modal .eq-card');if(m)m.insertAdjacentHTML('beforeend',`${track(p)}<div class="row"><button class="btn ghost dark" onclick="closeModal()">Later</button>${goBtn(p)}</div>`);return true;}
/* bumping into him on the map */
function elderCard(){if(!arrive('talk'))card('Hmm? Oh, hello! Come and see me when you have a moment.');}
/* the top bar shows where you are: 1/3, 2/3, 3/3 or 🎁 */
function badge(p){try{if(!show(p))return '';const t=tad(p);if(t.rw)return '<b class="qdot tb-qdot eq-badge" title="The Elder Wiz has your reward">🎁</b>';if(t.s>=3)return '';return `<b class="qdot tb-qdot eq-badge" title="Today's quest ${t.s+1} of 3">${t.s+1}/3</b>`;}catch(e){return '';}}
function hasReward(p){try{return !!(p&&p.tad&&p.tad.rw);}catch(e){return false;}}
/* finished things that count: quest 3 (any fun pick) and quest 1 when it's school work */
function qevent(p,type){try{if(!p||!show(p))return;const t=tad(p);if(t.s===2&&['story','lunch','trick','sprint'].includes(type))advance(p,'');}catch(e){}}
function check(){try{const p=P();if(!p||!show(p))return;const t=tad(p);if(t.s===0&&t.pk==='school'&&schoolToday(p))advance(P(),'');else showNext();
 /* on the map: he comes to find you, the first visit of the day (today's quests) or when he has your reward (never by himself on the smoke-test page) */
 if(curScreen==='world'&&!/[?&]smoke=/.test(location.search)&&window.MQ_ELDER&&MQ_ELDER.seek&&!MQ_ELDER.seeking()&&(t.rw||(t.met!==today()&&t.s<3)))setTimeout(()=>{try{const q=P(),u=tad(q);if(curScreen==='world'&&!MQ_ELDER.seeking()&&(u.rw||(u.met!==today()&&u.s<3)))MQ_ELDER.seek(u.rw?'reward':'intro');}catch(e){}},2500);}catch(e){}}

/* ---------- PART C: battle exit ---------- */
function help(){try{if(typeof B==='undefined'||!B||!B.q)return closeModal();const q=B.q;q.hinted=true;let h='';try{h=hintHTML(q)||'';}catch(e){}
 modal(`<div class="mcard"><div class="big-emoji">🆘</div><h2>Here's how to do it</h2><div class="hint">${h||'Take a breath and read it one more time. You can do this!'}</div><p class="muted" style="font-size:14px">Help is free. A helped answer earns no coins or streak, and the problem comes back later for a real try.</p><div class="row"><button class="btn green" onclick="closeModal()">Back to the battle</button></div></div>`);}catch(e){closeModal();}}

/* ---------- PART B: Pet Home tricks ---------- */
function trickPanel(){try{const p=P();if(!show(p))return;const pet=petOf(p);if(!pet||document.getElementById('tadTrick'))return;css();const t=tad(p);const left=TRICKS-(t.tr||0);
 const host=document.querySelector('#app .page');if(!host)return;const d=document.createElement('div');d.className='tad-card';d.id='tadTrick';
 d.innerHTML=`<div class="tad-trick"><div><h3 style="margin:0">🎓 Teach ${esc(pet.name)} a trick</h3><small class="muted">${left>0?`Answer a question to teach it. ${left} trick${left>1?'s':''} left today.`:'All 3 tricks taught today. More tomorrow!'}</small></div>${left>0?'<button class="btn green" onclick="Daily.trick()">Teach a trick</button>':''}</div>`;
 /* just above the pet area (the top-level block that holds the pet stage), so it is seen without scrolling */
 let top=document.getElementById('phStage');while(top&&top.parentNode!==host)top=top.parentNode;if(top)host.insertBefore(d,top);else host.appendChild(d);}catch(e){}}
function trick(){const p=P();const pet=petOf(p);if(!pet)return;const t=tad(p);if((t.tr||0)>=TRICKS)return;const name=TRICK_NAMES[((t.stars||0)*3+(t.tr||0)+pet.name.length)%TRICK_NAMES.length];
 ask(funQ(p),{kind:'fun',step:`Trick ${(t.tr||0)+1} of ${TRICKS}`,emoji:pet.e,title:`Teach ${esc(pet.name)}: ${name}!`,sub:`${esc(pet.name)} learns when you answer.`,tries:2,right:`${esc(pet.name)} learned ${name}! 🎉`,wrong:`${esc(pet.name)} will try again later.`,
  onDone:ok=>{const p=P(),t=tad(p);t.tr=(t.tr||0)+1;if(ok){const pd=petMood(petData(p,pet.id));pd.joy=Math.min(MOOD_MAX,pd.joy+1);try{petGain(p,pet,4);}catch(e){}try{questEvent(p,'petcare',1);}catch(e){}}save();qevent(P(),'trick');if(curScreen==='pethome')goStay('pethome');if(ok)toast(`${pet.e} ${pet.name} learned ${name}! +4 pet XP`);}});}

/* ---------- PART B: camp ----------
   Oct 2026: the owner asked that nobody has to answer math to send pets to camp or to open the sacks when they come home, so the
   packing questions and the tied sacks were removed. What is left: the Trail pack reward from Today's Adventure still adds one
   extra find to the next trip (adv.js reads a.pack when the trip starts). */
function wrapAdv(){const A=window.Adv;if(!A||A.__daily)return;A.__daily=1;const send0=A.send;
 A.send=function(force){try{const a=P().adv;if(a&&a.packB&&!a.trip){a.pack=(a.pack||0)+1;a.packB=0;save();}}catch(e){}return send0(force);};}

/* ---------- PART D: Parent Corner ---------- */
function parentSection(){try{if(typeof state==='undefined'||!state.players)return '';const kids=state.players.filter(p=>p.setup&&p.tad);if(!kids.length)return '';const wk=weekKey();
 const rows=kids.map(p=>{const t=p.tad,w=t.w&&t.w.k===wk?t.w:{adv:0,fix:0,fun:0,funR:0};const days=(p.days||[]).filter(d=>d>=wk).length;
  const op=t.cur&&t.cur.op,s=op&&p.stats[op];const acc=s&&s.r+s.w?Math.round(100*s.r/(s.r+s.w)):null;
  return `<tr><td><b>${esc(p.name)}</b></td><td>${w.adv} of ${days} day${days===1?'':'s'}</td><td>${w.fix}</td><td>${op?`${esc((typeof OPNAME!=='undefined'&&OPNAME[op])||op)}${acc!=null?` (${acc}%)`:''}`:'—'}</td><td>${w.fun?`${w.funR} of ${w.fun} right`:'0'}</td></tr>`;}).join('');
 return `<div class="pp"><h3>🧭 Today's Adventure (this week)</h3><p class="muted">A short guided start: three missed problems to fix, one battle in the weakest skill, then a small reward. Pet tricks ask a question too (optional).</p>
 <div style="overflow-x:auto"><table class="ptable" style="width:100%;text-align:left"><tr><th>Hero</th><th>Adventures finished</th><th>Missed problems fixed</th><th>Focus skill</th><th>Pet trick questions</th></tr>${rows}</table></div></div>`;}catch(e){return '';}}

/* ---------- wiring ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({
 screen:s=>{if(s==='pethome')trickPanel();setTimeout(check,600);},
 battle:(p,d)=>{try{if(!p||!d||!d.win)return;const t=tad(p);
  if(t.owe&&t.owe.zid===d.zone&&t.owe.i===d.i)t.owe=null;
  if(t.s===1&&t.cur&&t.cur.zid===d.zone&&t.cur.i===d.i)advance(p,'Battle won! ⚔️');}catch(e){}},
 fled:(p,d)=>{try{if(!p||!d||d.wild||d.mode!=='math')return;const z=ZONES.find(x=>x.id===d.zone);if(!z||z.op==='mix'||z.event||d.i>4)return;tad(p).owe={zid:d.zone,i:d.i};save();}catch(e){}}
});
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
(function reg(n){if(window.Adv&&typeof SCREENS!=='undefined'){wrapAdv();return;}if((n||0)<3000)setTimeout(()=>reg((n||0)+1),50);})(0);

window.Daily={cardHTML,go:goQ,fix,battle,school,funCard,trick,help,arrive,elderCard,rewardCard,badge,hasReward,event:qevent,check,SILLY,_fun:fun,_after:()=>{redraw();},_k:key,_next:next,_x:closeAsk,_say:()=>{if(ST)speakToggle(()=>speakQ(ST.q));},_hint:()=>{if(ST&&!ST.end){ST.hint=true;paint();}},_dbg:{tad,focus,fixList,funQ,ask,cur:()=>ST&&ST.q,qInfo,roll,advance:()=>advance(P(),'')}};
})();
