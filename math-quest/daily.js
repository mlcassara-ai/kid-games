/* ================= Today's Adventure + math as the fuel =================
   PART A  Today's Adventure: a 3-step guided start on the Quest Board (about ten minutes).
             1 Fix-it        3 of the kid's own missed problems, hint shown up front
             2 Focus battle  one shortened battle in the kid's weakest skill (or the monster they left yesterday)
             3 School work   (only for kids with their own school content in content.js) one quiz or homework set from
                             this week's worksheets that isn't passed yet (80%+ first try), newest first; once a day
             4 Pick your fun a small reward for camp, pets or the coin purse, plus the day's Adventure Star
           Optional: nothing is locked behind it.
   PART B  Math as the fuel: a few questions inside the places kids already visit.
             Pet Home  "Teach a trick" (3 a day)          Camp  packing questions before a trip, sacks tied shut
           A wrong answer never takes anything away; it shows how to solve it and gives fewer extras.
   PART C  Battle exit: "Show me how" before leaving; a monster the kid leaves is tomorrow's Focus battle.
   PART D  Parent Corner summary (window.MQ_PARENT).
   Saved in p.tad: {d, s(0..3), cur{zid,i,op}, owe{zid,i}, tr, stars, streak, last, w{k,adv,fix,fun,funR}}
   Uses Math Quest globals: P, save, go, goStay, modal, closeModal, toast, esc, SFX, genQ, lvl, pickOpFair, hintHTML, dayKey,
   weekKey, ZONES, zoneLocked, startBattle, B, curScreen, petOf, petData, petMood, petGain, MOOD_MAX, hook, wkAnswer,
   champPts, youngReader, say, voiceOn, speakable, speakToggle, OPNAME, curRound, nextBattleFor, state, Adv.          */
(function(){
'use strict';
const FIX_N=3, TRICKS=3, SACK_Q=3, MIN_BATTLES=3, BASIC=['add','sub','mul','div'];
const TRICK_NAMES=['Roll over','Shake','Spin','High five','Sit','Play dead','Jump','Fetch','Wave','Speak','Twirl','Bow'];
const today=()=>dayKey();
function tad(p){const t=p.tad=p.tad||{};const d=today();
 if(t.d!==d){t.d=d;t.s=0;t.cur=null;t.tr=0;}
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
@media (max-width:520px){.tad-steps,.tad-pick{grid-template-columns:1fr}}`;document.head.appendChild(s);}
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

/* ---------- PART A: Today's Adventure ---------- */
function focus(p){const t=tad(p);
 if(t.owe){const z=ZONES.find(x=>x.id===t.owe.zid);if(zoneOK(p,z))return {zid:z.id,i:Math.min(4,t.owe.i|0),op:z.op,owed:true};t.owe=null;}
 let best=null;ZONES.forEach(z=>{if(!zoneOK(p,z))return;const s=p.stats[z.op]||{r:0,w:0},tot=s.r+s.w;if(tot<8)return;
  const rec=(p.recent||{})[z.op]||[];let acc=s.r/tot;if(rec.length>=4)acc=.4*acc+.6*(rec.reduce((a,b)=>a+b,0)/rec.length);
  if(!best||acc<best.acc)best={z,acc};});
 let z=best&&best.z;if(!z){const n=nextBattleFor(p);z=n&&zoneOK(p,n.z)?n.z:ZONES.find(x=>zoneOK(p,x));}
 if(!z)return null;const cr=curRound(p,z.id);const arr=cr===1?(p.progress[z.id]||[]):(((p.rounds||{})[z.id]||{})[cr]||[]);
 let i=[0,1,2,3,4].find(k=>!arr[k]);if(i===undefined)i=Math.floor(Math.random()*5);
 return {zid:z.id,i,op:z.op};}
function show(p){return !!p&&p.setup&&(p.battles||0)>=MIN_BATTLES;}
/* ---------- step 3: school work (the kid's own weekly worksheets, content.js) ---------- */
const PASS=80;
function ownSchool(p){try{if(p&&!p.ckey)kidData(p); /* kidData matches the hero to their school content by name */
 return !!(p&&p.ckey&&typeof CONTENT!=='undefined'&&CONTENT.kids&&CONTENT.kids[p.ckey]);}catch(e){return false;}}
function schoolItems(p){if(!ownSchool(p))return [];const out=[];try{quizList(p).forEach(x=>out.push({kind:'quiz',id:x.id,title:x.title,emoji:x.emoji||'📚',st:(p.quizStats||{})[x.id]}));hwList(p).forEach(x=>out.push({kind:'hw',id:x.id,title:x.title,emoji:'📝',st:(p.hwStats||{})[x.id]}));}catch(e){}return out;}
function schoolDue(p){return schoolItems(p).find(x=>!(x.st&&(x.st.best||0)>=PASS))||null;}
function schoolToday(p){return schoolItems(p).find(x=>x.st&&x.st.d===today())||null;}
function school(){const p=P();if(!show(p))return;const t=tad(p);if(t.s!==2)return;const due=schoolDue(p);if(!due||schoolToday(p)){pick();return;}
 try{startQuest(due.kind,due.id);if(typeof B!=='undefined'&&B){B.backTo='map';B.backArg=null;}}catch(e){pick();}}
function cardHTML(p){try{if(!show(p))return '';css();const t=tad(p);
 if(t.s>=3)return `<div class="tad-card"><div class="tad-head"><h3>🧭 Today's Adventure: done! ⭐</h3><span class="tad-streak">🔥 ${t.streak||1} day${(t.streak||1)>1?'s':''} in a row</span></div><div class="tad-foot"><small>Come back next time you play for a new one.</small></div></div>`;
 if(t.s===1&&!t.cur){t.cur=focus(p);}
 const f=t.s<=1?(t.cur||focus(p)):t.cur;const zn=f?(ZONES.find(z=>z.id===f.zid)||{}).name:'a math world';
 const st=(n,b,txt)=>`<div class="tad-step ${t.s>n?'done':t.s===n?'now':''}"><b>${t.s>n?'✅ ':''}${b}</b>${txt}</div>`;
 const due=schoolDue(p),did=schoolToday(p),sch=did||due;const needSch=t.s===2&&due&&!did;
 const btn=t.s===0?['Daily.fix()','Start ➜']:t.s===1?['Daily.battle()','Battle ➜']:needSch?['Daily.school()','School work ➜']:['Daily.pick()','Pick your fun ➜'];
 const schStep=sch?`<div class="tad-step ${did?'done':needSch?'now':''}"><b>${did?'✅ ':''}3 · School work</b>${esc(sch.emoji+' '+sch.title)}</div>`:'';
 return `<div class="tad-card"><div class="tad-head"><h3>🧭 Today's Adventure</h3>${t.streak&&t.last?`<span class="tad-streak">🔥 ${t.streak} in a row</span>`:''}</div>
 <div class="tad-steps">${st(0,'1 · Fix-it','3 problems to try again')}${st(1,'2 · Focus battle',esc(zn||''))}${schStep}${st(2,(sch?'4':'3')+' · Pick your fun','Choose a reward')}</div>
 <div class="tad-foot"><button class="btn green" onclick="${btn[0]}">${btn[1]}</button><small>About 10 minutes · earns today's ⭐ Adventure Star</small></div></div>`;}catch(e){return '';}}
function redraw(){try{if(curScreen==='map')goStay('map');}catch(e){}}
function fix(){const p=P();if(!show(p))return;const t=tad(p);if(t.s!==0)return;const qs=fixList(p);
 series(qs,(i,n)=>({kind:'fix',step:`Fix-it · ${i+1} of ${n}`,emoji:'🔧',title:qs[i]._fix?'You met this one before':'Warm-up',sub:qs[i]._fix?'Take your time. Tap the hint if you want help.':'A quick one to get started.',tries:2,right:qs[i]._fix?'Fixed! +3 🪙':'That\'s it! ⭐',right2:qs[i]._fix?'You got it! It will come back once more to be sure.':'You got it this time! ⭐',onClose:redraw}),
 right=>{const p=P(),t=tad(p); /* fetch the hero again: an online sync during the questions replaces the player object, and progress written to the old one is lost */
  t.s=1;t.cur=focus(p);save();try{SFX.win();}catch(e){}redraw();const zn=t.cur?(ZONES.find(z=>z.id===t.cur.zid)||{}).name:'';
  modal(`<div class="mcard"><div class="big-emoji">🔧</div><h2>Fix-it done!</h2><p>You got <b>${right} of ${qs.length}</b>. Next up: one battle${zn?` in <b>${esc(zn)}</b>`:''}.${t.cur&&t.cur.owed?' That monster has been waiting for you!':''}</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Later</button><button class="btn green" onclick="closeModal();Daily.battle()">Battle ➜</button></div></div>`);});}
function battle(){const p=P();const t=tad(p);if(t.s!==1)return;if(!t.cur)t.cur=focus(p);if(!t.cur){t.s=2;save();redraw();return;}save();
 startBattle(t.cur.zid,t.cur.i,null,{short:true});try{if(typeof B!=='undefined'&&B){B.backTo='map';B.backArg=null;}}catch(e){}}
function pick(){const p=P();const t=tad(p);if(t.s!==2)return;if(schoolDue(p)&&!schoolToday(p)){school();return;}
 modal(`<div class="mcard"><div class="big-emoji">⭐</div><h2>Adventure done! Pick your fun:</h2><div class="tad-pick">
 <button onclick="Daily.take('pack')"><b>🥾</b>Trail pack<small>extra camp sack on your next trip</small></button>
 <button onclick="Daily.take('treat')"><b>🧺</b>Treat basket<small>3 pet snacks</small></button>
 <button onclick="Daily.take('coins')"><b>🪙</b>Coin pouch<small>30 coins</small></button></div></div>`);}
function take(k){const p=P();const t=tad(p);if(t.s!==2)return;let msg='';
 if(k==='pack'){p.adv=p.adv||{};p.adv.packB=1;msg='🥾 Trail pack ready! Your next camp trip brings home an extra find.';}
 else if(k==='treat'){p.pantry=p.pantry||{};['apple','carrot','cookie'].forEach(f=>{p.pantry[f]=(p.pantry[f]||0)+1;});msg='🧺 3 snacks are in your pantry!';}
 else{p.coins+=30;msg='🪙 30 coins!';}
 const d=today(),days=p.days||[];const prev=days[days.length-1]===d?days[days.length-2]:days[days.length-1];
 t.streak=(t.last&&t.last===prev)?(t.streak||0)+1:1;t.last=d;t.stars=(t.stars||0)+1;t.s=3;t.w.adv++;try{wkBump(p,'adv');}catch(e){}save();
 try{SFX.level();}catch(e){}
 modal(`<div class="mcard"><div class="big-emoji">⭐</div><h2>Adventure Star #${t.stars}!</h2><p>${msg}</p><p class="muted">🔥 ${t.streak} day${t.streak>1?'s':''} in a row.</p><div class="row"><button class="btn green" onclick="closeModal();go('map')">Hooray!</button></div></div>`);}

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
  onDone:ok=>{const p=P(),t=tad(p);t.tr=(t.tr||0)+1;if(ok){const pd=petMood(petData(p,pet.id));pd.joy=Math.min(MOOD_MAX,pd.joy+1);try{petGain(p,pet,4);}catch(e){}try{questEvent(p,'petcare',1);}catch(e){}}save();if(curScreen==='pethome')goStay('pethome');if(ok)toast(`${pet.e} ${pet.name} learned ${name}! +4 pet XP`);}});}

/* ---------- PART B: camp packing and tied sacks ---------- */
function wrapAdv(){const A=window.Adv;if(!A||A.__daily)return;A.__daily=1;
 const send0=A.send,open0=A.open,all0=A.openAll;
 A.send=function(force){try{const p=P();const a=p.adv||{};const crew=(a.crew||[]).filter(id=>p.pets.includes(id));
  if(a.trip||!crew.length||!show(p)||(!force&&crew.includes(p.pet)))return send0(force);
  const n=a.len==='short'?2:3,qs=Array.from({length:n},()=>funQ(p));
  series(qs,(i,m)=>({kind:'fun',step:`Packing · ${i+1} of ${m}`,emoji:'🎒',title:'Pack the trail bag',sub:'Each right answer packs one more find for the trip home.',tries:1,right:'Packed! 🎒',wrong:'The crew will manage without that one.'}),
   right=>{const a=P().adv;a.pack=right+(a.packB?1:0);a.packB=0;save();send0(true);if(a.pack)setTimeout(()=>toast(`🎒 Packed for ${a.trip&&a.trip.pack||right} extra find${(a.trip&&a.trip.pack||right)>1?'s':''}!`),600);});
 }catch(e){return send0(force);}};
 const res=()=>{try{return P().adv.res||null;}catch(e){return null;}};
 const need=r=>Math.min(SACK_Q,(r.sacks||[]).length);
 A.open=function(i){try{const r=res();if(!r||(r.op||[]).includes(i)||(r.tq||0)>=need(r)||!show(P()))return open0(i);
  ask(funQ(P()),{kind:'fun',step:'Welcome home',emoji:'🎒',title:'This sack is tied shut!',sub:'Untie it with the right answer.',tries:2,right:'Untied! 🎉',wrong:'The knot came loose anyway.',onDone:()=>{const r2=res()||r;r2.tq=(r2.tq||0)+1;try{save();}catch(e){}open0(i);}});
 }catch(e){return open0(i);}};
 A.openAll=function(){try{const r=res();if(!r||(r.tq||0)>=need(r)||!show(P()))return all0();
  ask(funQ(P()),{kind:'fun',step:'Welcome home',emoji:'🎒',title:'The sacks are tied shut!',sub:'One right answer unties them all.',tries:2,right:'Untied! 🎉',wrong:'The knots came loose anyway.',onDone:()=>{const r2=res()||r;r2.tq=need(r2);try{save();}catch(e){}all0();}});
 }catch(e){return all0();}};}

/* ---------- PART D: Parent Corner ---------- */
function parentSection(){try{if(typeof state==='undefined'||!state.players)return '';const kids=state.players.filter(p=>p.setup&&p.tad);if(!kids.length)return '';const wk=weekKey();
 const rows=kids.map(p=>{const t=p.tad,w=t.w&&t.w.k===wk?t.w:{adv:0,fix:0,fun:0,funR:0};const days=(p.days||[]).filter(d=>d>=wk).length;
  const op=t.cur&&t.cur.op,s=op&&p.stats[op];const acc=s&&s.r+s.w?Math.round(100*s.r/(s.r+s.w)):null;
  return `<tr><td><b>${esc(p.name)}</b></td><td>${w.adv} of ${days} day${days===1?'':'s'}</td><td>${w.fix}</td><td>${op?`${esc((typeof OPNAME!=='undefined'&&OPNAME[op])||op)}${acc!=null?` (${acc}%)`:''}`:'—'}</td><td>${w.fun?`${w.funR} of ${w.fun} right`:'0'}</td></tr>`;}).join('');
 return `<div class="pp"><h3>🧭 Today's Adventure (this week)</h3><p class="muted">A short guided start: three missed problems to fix, one battle in the weakest skill, then a small reward. Pet tricks, camp packing and tied sacks each ask a question too.</p>
 <div style="overflow-x:auto"><table class="ptable" style="width:100%;text-align:left"><tr><th>Hero</th><th>Adventures finished</th><th>Missed problems fixed</th><th>Focus skill</th><th>Questions at pets and camp</th></tr>${rows}</table></div></div>`;}catch(e){return '';}}

/* ---------- wiring ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({
 screen:s=>{if(s==='pethome')trickPanel();},
 battle:(p,d)=>{try{if(!p||!d||!d.win)return;const t=tad(p);
  if(t.owe&&t.owe.zid===d.zone&&t.owe.i===d.i)t.owe=null;
  if(t.s===1&&t.cur&&t.cur.zid===d.zone&&t.cur.i===d.i){t.s=2;save();setTimeout(()=>{try{toast('🧭 Focus battle won! Pick your fun on the Quest Board.');}catch(e){}},1800);}}catch(e){}},
 fled:(p,d)=>{try{if(!p||!d||d.wild||d.mode!=='math')return;const z=ZONES.find(x=>x.id===d.zone);if(!z||z.op==='mix'||z.event||d.i>4)return;tad(p).owe={zid:d.zone,i:d.i};save();}catch(e){}}
});
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
(function reg(n){if(window.Adv&&typeof SCREENS!=='undefined'){wrapAdv();return;}if((n||0)<3000)setTimeout(()=>reg((n||0)+1),50);})(0);

window.Daily={cardHTML,fix,battle,school,pick,take,trick,help,_k:key,_next:next,_x:closeAsk,_say:()=>{if(ST)speakToggle(()=>speakQ(ST.q));},_hint:()=>{if(ST&&!ST.end){ST.hint=true;paint();}},_dbg:{tad,focus,fixList,funQ,ask,cur:()=>ST&&ST.q}};
})();
