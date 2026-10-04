/* ================= 🧠 Teach me (Oct 2026) =================
   After a wrong answer to a plain ➕ ➖ ✖️ ➗ fact in a math battle, the "So close" card offers 🧠 Teach me. It walks the kid through ONE
   well-known strategy that suits that fact, in small steps the kid answers (each step is an easier fact), then offers ✏️ Try one like it.
   Strategies (the ones US schools teach):
     ➕ near doubles (6+7 = 6+6+1), make a ten (8+5 = 8+2+3), count on from the bigger number, round and adjust (29+14 = 30+14−1), split by place.
     ➖ back through ten (13−5 = 13−3−2), think addition (5 + ? = 13), count up when the numbers are close, round and adjust (52−19 = 52−20+1), split.
     ✖️ 2s double · 4s double-double · 8s double three times · 5s half of the 10s · 9s the 10s minus one group · 3s/6s one more group
        (2×, 5×) · 7s/12s break apart (5×+2×, 10×+2×) · 11s 10× plus one group · big numbers break apart by place.
     ➗ think multiplication + skip count (small answers) · halve for ÷2 · chunk it (45÷5: 5×5=25, 45−25=20, 5×4=20, 5+4=9).
   Every step is built as a little sum (a op b) so it is right by construction; the smoke test checks the last step equals the answer.
   Practice only: no stats, coins or streak change, and nothing is taken away. Saved: p.teach = {o:{add,sub,mul,div}, f, pr:[right,asked]}
   (counts only) for Parent Corner. Never holds the player across a wait: P() is fetched fresh each time. */
(function(){
const SYM={add:'+',sub:'−',mul:'×',div:'÷'},OPN={add:'➕',sub:'➖',mul:'✖️',div:'➗'};
const ones=n=>n%10,tens=n=>n-n%10;
const calc=(a,op,b)=>op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:op==='÷'?a/b:a/2;
/* a step: say (a short sentence), e:[a,op,b] the little sum, hide 'r' (the result is the blank) or 'b' (the second number is the blank) */
const S=(say,a,op,b,hide)=>({say,a,op,b,hide:hide||'r',r:calc(a,op,b)});
const ans=s=>s.hide==='b'?s.b:s.r;
function placeParts(n){const s=String(n),o=[];for(let i=0;i<s.length;i++){const d=+s[i];if(d)o.push(d*Math.pow(10,s.length-1-i));}return o.length?o:[0];}
function chips(list){return `<div class="tm-chips">${list.map(x=>`<span>${x}</span>`).join('')}</div>`;}

function planAdd(a,b,c){
 if(c!==undefined)return {id:'three',name:'Two at a time',steps:[S(`Add the first two numbers.`,a,'+',b),S(`Now add the last one.`,a+b,'+',c)]};
 const s=a+b,big=Math.max(a,b),sm=Math.min(a,b);
 if(s<=20&&big<=10){
  if(big-sm===1&&sm>=2)return {id:'near',name:'Near doubles',steps:[S(`${sm} and ${big} are next-door numbers. Start with the double you know.`,sm,'+',sm),S(`${big} is one more than ${sm}, so add 1 more.`,sm*2,'+',1)]};
  if(s>10&&big<10){const need=10-big;return {id:'ten',name:'Make a ten',steps:[S(`Make a ten! How many more does ${big} need to make 10?`,big,'+',need,'b'),
   S(`Take that ${need} from the ${sm}. What is left?`,sm,'−',need),S(`10 plus a little number is easy.`,10,'+',sm-need)]};}
  return {id:'on',name:'Count on',steps:[S(`Start at the bigger number, <b>${big}</b>, and count on ${sm}:`+chips(Array.from({length:sm},(_,i)=>big+i+1)),big,'+',sm)]};
 }
 const near=[a,b].filter(n=>n>=10&&ones(n)>=8);
 if(near.length){const n=near[0],o=n===a?b:a,up=10-ones(n),r=n+up;
  return {id:'round',name:'Round and adjust',steps:[S(`${n} is close to <b>${r}</b>. Add ${r} instead, it's easier.`,r,'+',o),S(`We added ${up} too many, so take ${up} away.`,r+o,'−',up)]};}
 if(sm<10){if(ones(big)+sm<10)return {id:'ones',name:'Ones first',steps:[S(`Add the ones: ${ones(big)} + ${sm}.`,ones(big),'+',sm),S(`Put the tens back.`,tens(big),'+',ones(big)+sm)]};
  const nt=tens(big)+10,u=nt-big;return {id:'ten',name:'Make the next ten',steps:[S(`How many more does ${big} need to make ${nt}?`,big,'+',u,'b'),S(`Take that ${u} from the ${sm}. What is left?`,sm,'−',u),S(`Add what is left to ${nt}.`,nt,'+',sm-u)]};}
 return {id:'split',name:'Split by place',steps:[S(`Split them up! Add the big parts first.`,tens(a),'+',tens(b)),S(`Now add the ones.`,ones(a),'+',ones(b)),S(`Put them together.`,tens(a)+tens(b),'+',ones(a)+ones(b))]};
}
function planSub(a,b){const d=a-b;
 if(a<=20){
  if(a>10&&b<10&&b>a-10){const k=a-10;return {id:'back10',name:'Back through ten',steps:[S(`First take away ${k} to get to 10.`,a,'−',k),S(`You still need to take away ${b-k} more.`,10,'−',b-k)]};}
  return {id:'think',name:'Think addition',steps:[S(`Turn it around! Start at ${b}: how many more to get to ${a}?`+(d<=10?chips(Array.from({length:d},(_,i)=>b+i+1)):''),b,'+',d,'b')]};
 }
 if(d<=12&&ones(b)){const nt=tens(b)+10,u=nt-b;
  if(nt<=a)return {id:'countup',name:'Count up',steps:[S(`These numbers are close! Count up from ${b} to the next ten.`,b,'+',u,'b'),S(`Now from ${nt} up to ${a}.`,nt,'+',a-nt,'b'),S(`Add the two jumps.`,u,'+',a-nt)]};}
 if(b>=10&&ones(b)>=8){const up=10-ones(b),r=b+up;return {id:'round',name:'Round and adjust',steps:[S(`${b} is close to <b>${r}</b>. Take away ${r} instead.`,a,'−',r),S(`We took away ${up} too many, so add ${up} back.`,a-r,'+',up)]};}
 if(b<10){if(ones(a)>=b)return {id:'split',name:'Ones first',steps:[S(`Look at the ones: ${ones(a)} take away ${b}.`,ones(a),'−',b),S(`Put the tens back.`,tens(a),'+',ones(a)-b)]};
  const k=ones(a);return {id:'back10',name:'Back through ten',steps:[S(`First take away ${k} to get to ${tens(a)}.`,a,'−',k),S(`You still need to take away ${b-k} more.`,tens(a),'−',b-k)]};}
 const steps=[S(`Take away the tens first.`,a,'−',tens(b))];if(ones(b))steps.push(S(`Then take away the ones.`,a-tens(b),'−',ones(b)));
 return {id:'split',name:'Tens, then ones',steps};
}
const MUL_ORDER=[0,1,10,2,5,9,4,11,3,6,8,12,7];
function planMul(a,b){
 if(a>12||b>12){if(Math.min(a,b)>99)return null;const big=a>12&&b>12?Math.min(a,b):a>12?a:b,o=big===a?b:a,parts=placeParts(big);if(parts.length<2)return {id:'zeros',name:'Zeros on the end',steps:[S(`Do the small sum first.`,parts[0]/Math.pow(10,String(parts[0]).length-1),'×',o),S(`Then put the zero${String(parts[0]).length>2?'s':''} back on.`,parts[0]/Math.pow(10,String(parts[0]).length-1)*o,'×',Math.pow(10,String(parts[0]).length-1))]};
  const st=parts.map((x,i)=>S(i?`Next: ${x} × ${o}.`:`Break ${big} into ${parts.join(' + ')}. Start with ${x} × ${o}.`,x,'×',o));
  let sum=parts[0]*o;for(let i=1;i<parts.length;i++){st.push(S(i===parts.length-1?`Add them all up.`:`Add as you go.`,sum,'+',parts[i]*o));sum+=parts[i]*o;}
  return {id:'break',name:'Break it apart',steps:st};}
 const k=MUL_ORDER.find(x=>x===a||x===b),o=k===a?b:a;
 switch(k){
  case 0:return {id:'x0',name:'Times zero',steps:[S(`${o} groups of nothing (or nothing groups of ${o}) is nothing at all!`,o,'×',0)]};
  case 1:return {id:'x1',name:'Times one',steps:[S(`One group of ${o} is just ${o}.`,o,'×',1)]};
  case 10:return {id:'x10',name:'Times ten',steps:[S(`Times 10: put a zero on the end of ${o}.`,o,'×',10)]};
  case 2:return {id:'x2',name:'Double it',steps:[S(`Times 2 means double it: ${o} + ${o}.`,o,'+',o)]};
  case 5:return {id:'x5',name:'Half of the 10s',steps:[S(`5 is half of 10. Start with 10 × ${o}.`,10,'×',o),S(`Now take half of it.`,10*o,'half',2)]};
  case 9:return {id:'x9',name:'10s minus one group',steps:[S(`9 is one less than 10. Start with 10 × ${o}.`,10,'×',o),S(`Take away one group of ${o}.`,10*o,'−',o)]};
  case 4:return {id:'x4',name:'Double, double',steps:[S(`Times 4: double it…`,o,'+',o),S(`…then double again!`,2*o,'+',2*o)]};
  case 11:return o<=9?{id:'x11',name:'10s plus one group',steps:[S(`11 is 10 and 1 more. Start with 10 × ${o}.`,10,'×',o),S(`Add one more group of ${o}.`,10*o,'+',o)]}:{id:'x11b',name:'Break it apart',steps:[S(`Break 11 into 10 + 1. Start with 10 × ${o}.`,10,'×',o),S(`Add one more group of ${o}.`,10*o,'+',o)]};
  case 3:return {id:'x3',name:'Double plus one more',steps:[S(`Times 3: start with double ${o}.`,o,'+',o),S(`Add one more group of ${o}.`,2*o,'+',o)]};
  case 6:return {id:'x6',name:'5s plus one more',steps:[S(`6 is 5 and 1 more. Start with 5 × ${o}.`,5,'×',o),S(`Add one more group of ${o}.`,5*o,'+',o)]};
  case 8:return {id:'x8',name:'Double three times',steps:[S(`Times 8: double it…`,o,'+',o),S(`…double again…`,2*o,'+',2*o),S(`…and double one last time!`,4*o,'+',4*o)]};
  case 12:return {id:'x12',name:'10s plus 2s',steps:[S(`12 is 10 and 2. Start with 10 × ${o}.`,10,'×',o),S(`Now 2 × ${o}.`,2,'×',o),S(`Add them together.`,10*o,'+',2*o)]};
  default:return {id:'x7',name:'5s plus 2s',steps:[S(`7 is 5 and 2. Start with 5 × ${o}.`,5,'×',o),S(`Now 2 × ${o}.`,2,'×',o),S(`Add them together.`,5*o,'+',2*o)]};
 }
}
function planDiv(a,b){const q=a/b;if(!b||!Number.isInteger(q))return null;
 if(b===1)return {id:'d1',name:'Divide by one',steps:[S(`Sharing ${a} into 1 group puts all ${a} in it.`,a,'÷',1)]};
 if(b===2&&a<=40)return {id:'d2',name:'Halve it',steps:[S(`Divide by 2 means take half.`,a,'half',2)]};
 if(b===10&&ones(a)===0)return {id:'d10',name:'Take off a zero',steps:[S(`Divide by 10: take the zero off the end of ${a}.`,a,'÷',10)]};
 const think=`Think: <b>${b} × ? = ${a}</b>. `;
 if(q<=5)return {id:'skip',name:'Skip count',steps:[S(think+`Count by ${b}s until you reach ${a}:`+chips(Array.from({length:q},(_,i)=>b*(i+1)))+`How many jumps?`,b,'×',q,'b')]};
 if(q%10===0)return {id:'zero',name:'Zeros on the end',steps:[S(think+`Take the zero off the end of ${a}.`,a,'÷',10),S(`How many ${b}s make ${a/10}?`,b,'×',q/10,'b'),S(`Put the zero back on.`,q/10,'×',10)]};
 const f=q>=10?tens(q):5,rest=a-b*f,r=q-f;
 const st=[S(think+`Start with an easy chunk: ${f} groups of ${b}.`,b,'×',f),S(`How much is left?`,a,'−',b*f)];
 if(r>0){st.push(S(`How many ${b}s make ${rest}?`,b,'×',r,'b'));st.push(S(`Add up the groups.`,f,'+',r));}
 return {id:q>=10?'chunk10':'chunk5',name:'Chunk it',steps:st};
}
function plan(q){if(!q||!SYM[q.op]||q.tpl||q.rev||q.explain||q.neg||(q.L&&q.L>10))return null;const a=+q.a,b=+q.b,c=q.c===undefined?undefined:+q.c,v=[a,b,+q.answer].concat(c===undefined?[]:[c]);
 if(!v.every(x=>Number.isInteger(x)&&x>=0))return null;
 if((q.op==='add'||q.op==='sub')&&Math.max(a,b,c||0)>=1000)return null;
 const p=q.op==='add'?planAdd(a,b,c):q.op==='sub'?planSub(a,b):q.op==='mul'?planMul(a,b):planDiv(a,b);
 if(!p||!p.steps.length||ans(p.steps[p.steps.length-1])!==+q.answer)return null;
 if(p.steps.some(s=>!Number.isInteger(s.r)||s.r<0||!Number.isInteger(ans(s))))return null;return p;}

/* ---------- the card ---------- */
let TM=null; /* {q, p, i, inp, miss, prac, mode:'steps'|'done'|'prac'|'pracDone'} */
const kid=()=>{try{return P();}catch(e){return null;}};
const young=()=>{const p=kid();return !!p&&p.grade!=null&&p.grade<=2;};
function log(k,v){try{const p=kid();if(!p)return;const t=p.teach=p.teach||{o:{},f:0,pr:[0,0]};if(k==='o')t.o[v]=(t.o[v]||0)+1;else if(k==='f')t.f++;else if(k==='pr'){t.pr[1]++;if(v)t.pr[0]++;}save();}catch(e){}}
function askHTML(s,val,box){const B=box?`<span class="tm-box ${val===''?'':'full'}">${val===''?'&nbsp;':val}</span>`:`<b>${val}</b>`;
 if(s.op==='half')return `half of ${s.a} = ${B}`;return s.hide==='b'?`${s.a} ${s.op} ${B} = ${s.r}`:`${s.a} ${s.op} ${s.b} = ${B}`;}
function sayText(s){const t=s.op==='half'?`half of ${s.a} equals what?`:s.hide==='b'?`${s.a} ${s.op} what number equals ${s.r}?`:`${s.a} ${s.op} ${s.b} equals what?`;return speakable(s.say.replace(/<div class="tm-chips">[\s\S]*?<\/div>/g,' '))+' '+speakable(t);}
const PAD=`<div class="tm-pad">${['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(k=>`<button onpointerup="Teach._key('${k}')" class="${k==='✓'?'go':''}">${k}</button>`).join('')}</div>`;
function draw(){if(!TM)return;const {q,p}=TM,steps=p.steps;let body='';
 if(TM.mode==='steps'||TM.mode==='done'){
  const done=steps.slice(0,TM.i).map(s=>`<div class="tm-step ok"><div>${s.say.replace(/<div class="tm-chips">[\s\S]*?<\/div>/g,'')}</div><div class="tm-ask">${askHTML(s,ans(s),false)} ✓</div></div>`).join('');
  const now=TM.mode==='steps'?steps[TM.i]:null;
  body=`<div class="tm-q">${esc(q.text)} = ?</div><div class="tm-name">Strategy: <b>${esc(p.name)}</b></div><div class="tm-steps">${done}${now?`<div class="tm-step now"><div>${now.say}</div><div class="tm-ask">${askHTML(now,TM.inp,true)}</div><div class="tm-msg" id="tmMsg">${TM.msg||''}</div></div>`:''}</div>`+
   (now?(TM.show?`<button class="btn green big" onpointerup="Teach._next()">Next step ➜</button>`:PAD):`<div class="tm-win">🎉 So <b>${esc(q.text)} = ${q.answer}</b>!</div><div class="row"><button class="btn green big" onpointerup="Teach._prac()">✏️ Try one like it</button><button class="btn ghost dark" onpointerup="Teach._close()">Back to the battle ➜</button></div>`);
 }else{const s=TM.prac;
  body=`<div class="tm-name">Try one like it, with <b>${esc(p.name)}</b></div><div class="tm-q">${esc(s.text)} = <span class="tm-box ${TM.inp===''?'':'full'}">${TM.inp===''?'&nbsp;':TM.inp}</span></div><div class="tm-msg" id="tmMsg">${TM.msg||''}</div>`+
   (TM.mode==='prac'?PAD:`<div class="row">${TM.right?`<button class="btn green big" onpointerup="Teach._prac()">✏️ Another one</button>`:`<button class="btn green big" onpointerup="Teach._again()">🧠 Show me the steps</button>`}<button class="btn ghost dark" onpointerup="Teach._close()">Back to the battle ➜</button></div>`);}
 modal(`<div class="mcard tm"><div class="row" style="justify-content:space-between;align-items:center"><div class="fb-title" style="margin:0">🧠 Teach me</div><button class="btn small ghost dark" onpointerup="Teach._say()" aria-label="Read it to me">🔊</button></div>${body}</div>`);}
function speakNow(){if(!TM)return;try{speechSynthesis.cancel();}catch(e){}
 if(TM.mode==='steps')say(sayText(TM.p.steps[TM.i]),.8);else if(TM.mode==='done')say(speakable(`So ${TM.q.text} = ${TM.q.answer}!`),.8);else if(TM.prac)say(speakable(TM.prac.text+' = ?'),.8);}
function start(q){const p=plan(q);if(!p)return false;TM={q,p,i:0,inp:'',miss:0,mode:'steps',msg:''};log('o',q.op);draw();if(young())speakNow();return true;}
function key(k){if(!TM||!(TM.mode==='steps'&&!TM.show||TM.mode==='prac'))return;
 if(k==='⌫'){TM.inp=TM.inp.slice(0,-1);TM.msg='';return draw();}
 if(k==='✓'){if(TM.inp==='')return;return check();}
 if(/^[0-9]$/.test(k)&&TM.inp.length<7){TM.inp=TM.inp==='0'?k:TM.inp+k;TM.msg='';draw();}}
function check(){const v=+TM.inp;
 if(TM.mode==='prac'){const ok=v===+TM.prac.answer;log('pr',ok);TM.right=ok;TM.mode='pracDone';TM.msg=ok?`✅ Yes! ${esc(TM.prac.text)} = ${TM.prac.answer}`:`Not quite: ${esc(TM.prac.text)} = <b>${TM.prac.answer}</b>. Let's do the steps together.`;try{SFX[ok?'correct':'wrong']();}catch(e){}return draw();}
 const s=TM.p.steps[TM.i];
 if(v===ans(s)){try{SFX.correct();}catch(e){}TM.miss=0;return advance();}
 TM.miss++;try{SFX.tap();}catch(e){}
 if(TM.miss>=2){TM.inp=String(ans(s));TM.show=true;TM.msg=`It's <b>${ans(s)}</b>. That's OK, now you know!`;}else{TM.inp='';TM.msg='Not quite. Try again! 🙂';}draw();}
function advance(){TM.i++;TM.inp='';TM.msg='';TM.show=false;TM.miss=0;if(TM.i>=TM.p.steps.length){TM.mode='done';log('f');}draw();if(young())speakNow();}
/* a fact that uses the same strategy, from the same level */
function similar(){const q=TM.q;let best=null;for(let i=0;i<80;i++){let c;try{c=genQ(q.op,q.L||1);}catch(e){return null;}const p=plan(c);if(!p)continue;if(c.text===q.text||TM.prac&&c.text===TM.prac.text)continue;best=best||c;if(p.id===TM.p.id)return c;}return best;}
function prac(){const c=similar();if(!c){return close();}TM.prac=c;TM.mode='prac';TM.inp='';TM.msg='';TM.right=false;draw();if(young())speakNow();}
function again(){const c=TM&&TM.prac;if(!c)return;start(c);}
function close(){TM=null;try{speechSynthesis.cancel();}catch(e){}try{closeFeedback();}catch(e){}}
/* keyboard on computers: digits, Backspace, Enter (it runs before the battle's own keys, so Enter can't close the card by accident) */
window.addEventListener('keydown',e=>{if(!TM||!document.querySelector('#modal.show .tm'))return;const k=e.key;
 if(/^[0-9]$/.test(k))key(k);else if(k==='Backspace')key('⌫');else if(k==='Enter'){if(TM.show)advance();else if(TM.mode==='steps'||TM.mode==='prac')key('✓');else if(TM.mode==='done'||TM.mode==='pracDone'&&TM.right)prac();else if(TM.mode==='pracDone')again();}else if(k==='Escape')close();else return;
 e.preventDefault();e.stopImmediatePropagation();},true);
const st=document.createElement('style');st.textContent=`.tm{max-width:460px}.tm-q{font-size:30px;font-weight:900;text-align:center;margin:6px 0}.tm-name{text-align:center;color:#7048e8;margin-bottom:6px}
.tm-steps{display:flex;flex-direction:column;gap:6px;margin:6px 0;text-align:left}.tm-step{border-radius:12px;padding:8px 10px;background:#f3f0ff}.tm-step.ok{background:#ebfbee;opacity:.85;font-size:14px}
.tm-step.now{border:2px solid #7048e8}.tm-ask{font-size:24px;font-weight:800;margin-top:4px}.tm-step.ok .tm-ask{font-size:18px}
.tm-box{display:inline-block;min-width:56px;border-bottom:3px solid #7048e8;text-align:center}.tm-box.full{color:#7048e8}.tm-msg{min-height:20px;font-weight:700;margin-top:4px}
.tm-chips{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}.tm-chips span{background:#fff;border:2px solid #b197fc;border-radius:999px;padding:1px 9px;font-weight:800}
.tm-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}.tm-pad button{font:inherit;font-size:24px;font-weight:800;min-height:52px;border:0;border-radius:12px;background:#e5dbff;color:#2b2340;cursor:pointer;touch-action:manipulation}
.tm-pad button.go{background:#40c057;color:#fff}.tm-win{font-size:22px;text-align:center;margin:8px 0}
.tm-btn{margin:6px auto 0;display:block}`;document.head.appendChild(st);
/* Parent Corner: how often each child used Teach me */
function parentSection(){try{if(typeof state==='undefined'||!state.players)return '';const list=state.players.filter(p=>p.setup&&p.teach);if(!list.length)return '';
 return `<div class="panel"><h3>🧠 Teach me</h3><p class="muted" style="margin-top:0">After a wrong answer on a plain ➕ ➖ ✖️ ➗ fact, a child can open a step-by-step strategy and then try one like it.</p>
 ${list.map(p=>{const t=p.teach,o=t.o||{},n=Object.values(o).reduce((a,b)=>a+b,0);return `<div style="margin:6px 0"><b>${esc(p.name)}</b><br><small class="muted">opened ${n} time${n===1?'':'s'} (${Object.keys(o).map(k=>OPN[k]+' '+o[k]).join(' · ')}) · finished the steps ${t.f||0} · tried one like it ${t.pr[1]} (${t.pr[0]} right)</small></div>`;}).join('')}</div>`;}catch(e){return '';}}
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
window.Teach={can:q=>!!plan(q),plan,button:()=>`<button class="btn ghost dark tm-btn" onpointerup="Teach._open()">🧠 Teach me</button>`,
 _open:()=>{try{start(B.q);}catch(e){}},_key:key,_next:advance,_prac:prac,_again:again,_close:close,_say:speakNow,_dbg:{TM:()=>TM,start,check,ans}};
})();
