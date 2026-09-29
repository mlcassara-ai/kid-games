/* ================= Mastery Map =================
   A long-term fact-fluency collection (like the fact grids in DreamBox / Reflex).
   Every basic fact the kid answers in battle (or in a Fact Sprint) is tracked:
     new -> learning (seen) -> got it (answered right) -> ⭐ mastered (right AND fast on 3 different days).
   Stored compactly per player in p.mastery (one short string per op + one day-stamp string per op).
   Cell char = String.fromCharCode(97 + status*4 + fastDays)  ('a' = new)
   Day char  = B64[dayNumber % 64] = the last day this cell earned a "fast day" (only compared for equality).
   Rewards are deliberately small and slow. */
(function(){
const OPS4=['add','sub','mul','div'];
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const G={ // grid geometry per op: rows x cols, first value
 add:{n:11,lo:0,sym:'+',e:'➕',name:'addition',rowLbl:r=>String(r),colLbl:c=>String(c),cap:'Row + column'},
 sub:{n:11,lo:0,sym:'−',e:'➖',name:'subtraction',rowLbl:r=>'−'+r,colLbl:c=>'='+c,cap:'Big number − row = column'},
 mul:{n:12,lo:1,sym:'×',e:'✖️',name:'times',rowLbl:r=>String(r),colLbl:c=>String(c),cap:'Row × column'},
 div:{n:12,lo:1,sym:'÷',e:'➗',name:'division',rowLbl:r=>'÷'+r,colLbl:c=>'='+c,cap:'Big number ÷ row = column'}};
const OPC={add:'#2f9e44',sub:'#1c7ed6',mul:'#e8590c',div:'#d6336c'};
const badge=op=>`<span class="mq-op" style="background:${OPC[op]}">${G[op].sym}</span>`;
const SIZE=op=>G[op].n*G[op].n;
const ROWNAME={add:r=>`+${r} facts`,sub:r=>`−${r} facts`,mul:r=>`${r}s times table`,div:r=>`÷${r} facts`};
/* ---------- storage ---------- */
function M(p){p.mastery=p.mastery||{v:1};return p.mastery;}
function cells(p,op){const m=M(p);if(typeof m[op]!=='string'||m[op].length!==SIZE(op))m[op]=(m[op]||'').padEnd(SIZE(op),'a').slice(0,SIZE(op));return m[op];}
function days(p,op){const m=M(p),k=op+'D';if(typeof m[k]!=='string'||m[k].length!==SIZE(op))m[k]=(m[k]||'').padEnd(SIZE(op),'.').slice(0,SIZE(op));return m[k];}
const dec=ch=>{const v=ch.charCodeAt(0)-97;return v>=0&&v<16?{s:v>>2,f:v&3}:{s:0,f:0};};
const enc=(s,f)=>String.fromCharCode(97+s*4+f);
const setAt=(str,i,ch)=>str.slice(0,i)+ch+str.slice(i+1);
function get(p,op,i){const m=M(p);return typeof m[op]==='string'?dec(m[op][i]||'a'):{s:0,f:0};}
function dayNum(){const k=(typeof dayKey==='function'?dayKey():new Date().toISOString().slice(0,10)).split('-').map(Number);return Math.floor(Date.UTC(k[0],k[1]-1,k[2])/864e5);}
const todayCh=()=>B64[dayNum()%64];
/* ---------- fact <-> cell ---------- */
// every cell is (row r, col c). add: r+c. sub: (r+c) − r = c. mul: r×c. div: (r×c) ÷ r = c.
function idxOf(op,r,c){const g=G[op];return (r-g.lo)*g.n+(c-g.lo);}
function rcOf(op,i){const g=G[op];return [Math.floor(i/g.n)+g.lo,i%g.n+g.lo];}
function fact(op,i){const [r,c]=rcOf(op,i);
 if(op==='add')return {op,a:r,b:c,answer:r+c,big:r+c,text:`${r} + ${c}`};
 if(op==='sub')return {op,a:r+c,b:r,answer:c,big:r+c,text:`${r+c} − ${r}`};
 if(op==='mul')return {op,a:r,b:c,answer:r*c,big:r*c,text:`${r} × ${c}`};
 return {op,a:r*c,b:r,answer:c,big:r*c,text:`${r*c} ÷ ${r}`};}
function cellOfQ(q){if(!q||!OPS4.includes(q.op)||q.rev||q.tpl||q.story||q.neg||q.c!==undefined||(q.L&&q.L>10))return -1;
 const a=q.a,b=q.b,x=q.answer;if(![a,b,x].every(Number.isInteger))return -1;
 if(q.op==='add'){if(a+b!==x||a<0||b<0||a>10||b>10)return -1;return idxOf('add',a,b);}
 if(q.op==='sub'){if(a-b!==x||a>20||b<0||b>10||x<0||x>10)return -1;return idxOf('sub',b,x);}
 if(q.op==='mul'){if(a*b!==x||a<1||b<1||a>12||b>12)return -1;return idxOf('mul',a,b);}
 if(b<1||b>12||x<1||x>12||a!==b*x)return -1;return idxOf('div',b,x);}
/* ---------- the learning rules ---------- */
function fastLim(p,op){const base=op==='add'||op==='sub'?3:4;return base+((p.grade||3)<=2&&!p.adult?1.5:0);}
let PEND=[];// celebrations waiting for a calm moment (also saved in m.pr)
function record(p,op,i,ok,secs){
 const m=M(p);let str=cells(p,op),ds=days(p,op);const {s,f}=dec(str[i]);const fast=ok&&secs>0&&secs<=fastLim(p,op);const t=todayCh();
 let ns=s,nf=f;
 if(ok){
  if(s<2){ns=2;nf=0;}
  if(ns===2&&fast&&ds[i]!==t){nf=Math.min(3,nf+1);ds=setAt(ds,i,t);if(nf>=3){ns=3;nf=3;}}
  else if(s===3&&fast&&f<3){nf=3;} // a wobbly star shines again
 }else{
  if(s===0){ns=1;}
  else if(s===2){nf=Math.max(0,f-1);}
  else if(s===3){if(f>=3)nf=2;else{ns=2;nf=1;}} // gentle fade: first slip = wobbly, second = back to "got it"
 }
 if(ns===3&&nf===3&&s!==3)ds=setAt(ds,i,'.');
 m[op]=setAt(str,i,enc(ns,nf));m[op+'D']=ds;
 const res={before:s*4+f,after:ns*4+nf,newStar:ns===3&&s!==3,fast};
 if(res.newStar)milestones(p,op,i);
 return res;}
function countOp(p,op){const r={mastered:0,wobbly:0,got:0,seen:0,total:SIZE(op)};const m=M(p);const str=typeof m[op]==='string'?m[op]:'';
 for(let i=0;i<str.length;i++){const {s,f}=dec(str[i]);if(s===3){r.mastered++;if(f<3)r.wobbly++;}else if(s===2)r.got++;else if(s===1)r.seen++;}return r;}
const totalStars=p=>OPS4.reduce((t,op)=>t+countOp(p,op).mastered,0);
function rowDone(p,op,r){const g=G[op];for(let c=g.lo;c<g.lo+g.n;c++){if(get(p,op,idxOf(op,r,c)).s!==3)return false;}return true;}
function milestones(p,op,i){const m=M(p);
 const tot=totalStars(p);m.hw=m.hw||0;
 if(tot>m.hw){const n=Math.floor(tot/10)-Math.floor(m.hw/10);m.hw=tot;
  if(n>0){const c=25*n;p.coins+=c;try{SFX.coin();}catch(e){}setTimeout(()=>{try{toast(`🗺️ ${Math.floor(tot/10)*10} facts mastered on your Mastery Map! +${c} 🪙`);}catch(e){}},1200);try{save();}catch(e){}}}
 const [r]=rcOf(op,i);const key=op+r;const rw=(m.rw||'').split(',').filter(Boolean);
 if(!rw.includes(key)&&rowDone(p,op,r)){rw.push(key);m.rw=rw.join(',');p.coins+=50;m.pr=((m.pr||'')+','+key).replace(/^,/,'');try{save();}catch(e){}setTimeout(flush,1500);}
}
function flush(){try{const p=P();if(!p||!p.mastery||!p.mastery.pr)return;
 if(curScreen==='battle'||SP&&!SP.done||document.querySelector('#modal.show'))return;
 const m=p.mastery;const list=m.pr.split(',').filter(Boolean);const key=list.shift();m.pr=list.join(',');if(!m.pr)delete m.pr;saveLocal&&saveLocal();
 const op=key.replace(/\d+$/,''),r=+key.slice(op.length);if(!G[op])return;
 try{SFX.win();}catch(e){}
 const conf=Array.from({length:18},(_,k)=>`<i style="left:${(k*53)%100}%;animation-delay:${(k%6)*.12}s;background:${['#ffc83d','#51cf66','#7c5cff','#ff6b6b','#4dabf7'][k%5]}"></i>`).join('');
 modal(`<div class="mcard mq-cele"><div class="mq-conf">${conf}</div><div class="big-emoji">🏆</div><h2>You mastered the ${esc(ROWNAME[op](r))}!</h2>
  <p>Every single ${G[op].e} fact in the <b>${r}</b> row is a gold star. That takes real practice!</p>
  <div class="mq-rowstars">${'⭐'.repeat(G[op].n)}</div><p class="mq-coin">+50 🪙</p>
  <button class="btn green big" onclick="closeModal();setTimeout(()=>Mastery._flush(),400)">Awesome! 🎉</button></div>`);
}catch(e){console.warn(e);}}
/* ---------- choosing practice facts ---------- */
const MULRANK={1:0,2:1,10:2,5:3,3:4,4:5,11:6,9:7,6:8,8:9,7:10,12:11};
function hard(op,i){const [r,c]=rcOf(op,i);if(op==='add'||op==='sub')return r+c+Math.min(r,c)*.3;return Math.max(MULRANK[r],MULRANK[c])*20+Math.min(MULRANK[r],MULRANK[c])+(r*c)/200;}
function weakFacts(p,op,n){n=n||5;if(!G[op])return [];const str=M(p)[op]||'';const ix=[];
 for(let i=0;i<SIZE(op);i++){const {s,f}=dec(str[i]||'a');if(s===0||(s===3&&f===3))continue;ix.push({i,k:s===3?0:s===1?1:2+f});}
 ix.sort((x,y)=>x.k-y.k||hard(op,x.i)-hard(op,y.i));
 return ix.slice(0,n).map(x=>Object.assign(fact(op,x.i),{status:dec(str[x.i]||'a').s}));}
function sprintFacts(p,op){const str=cells(p,op);const by={0:[],1:[],2:[],3:[]};
 for(let i=0;i<SIZE(op);i++){const {s,f}=dec(str[i]);by[s===3&&f<3?1:s].push(i);}// wobbly stars count as "learning"
 by[0].sort((x,y)=>hard(op,x)-hard(op,y));const fresh=by[0].slice(0,12);
 const sh=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(v=>v[1]);
 const out=[];const take=(arr,k)=>{arr=sh(arr.filter(i=>!out.includes(i)));for(let j=0;j<arr.length&&k>0;j++){out.push(arr[j]);k--;}return k;};
 let left=take(by[2],5);left=take(by[1],3+left);const l3=take(by[3],2);left=take(fresh,2+left+l3);left=take(by[2],left);left=take(by[3],left);left=take(by[0],left);
 return sh(out.slice(0,12)).map(i=>Object.assign(fact(op,i),{i}));}
/* ---------- screen ---------- */
const CSS=`
.mq{max-width:1060px;margin:0 auto;padding:12px 16px 24px}
.mq .zhead .title{margin:4px 0 8px}
.mq-tabs{display:flex;gap:8px;justify-content:center;margin:0 0 10px;flex-wrap:wrap}
.mq-tab{background:rgba(255,255,255,.14);color:#fff;font-size:22px;font-weight:700;padding:6px 16px;border-radius:16px;box-shadow:0 3px 0 rgba(0,0,0,.25);display:flex;align-items:center;gap:6px}
.mq-op{display:inline-flex;align-items:center;justify-content:center;width:1.3em;height:1.3em;border-radius:50%;color:#fff;font-weight:700;line-height:1;box-shadow:0 2px 0 rgba(0,0,0,.2);vertical-align:middle}
.mq-tab small{font-size:13px;font-weight:600;opacity:.85}
.mq-tab.on{background:#fff;color:var(--ink);box-shadow:0 3px 0 #b9b0d9}
.mq-body{display:flex;gap:16px;align-items:flex-start;justify-content:center}
.mq-gridwrap{background:#fff;border-radius:22px;padding:12px;flex:0 1 572px;min-width:0;box-shadow:0 5px 0 rgba(0,0,0,.2)}
.mq-grid{display:grid;gap:3px;width:100%}
.mq-grid .h,.mq-grid .c{aspect-ratio:1;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:clamp(9px,1.6vw,15px);position:relative;padding:0;line-height:1;min-width:0}
.mq-grid .h{background:#7c5cff;color:#fff;font-size:clamp(10px,1.7vw,16px)}
.mq-grid .h.corner{background:#ffc83d;color:#5a3b00;font-size:clamp(14px,2.4vw,24px)}
.mq-grid .h.done{background:#2f9e44}
.mq-grid .c{background:#efebf8;color:#b5acd3;transition:transform .1s}
.mq-grid .c:active{transform:scale(.9)}
.mq-grid .c.s1{background:#d0ebff;color:#5c8fc0}
.mq-grid .c.s2{background:#ffe066;color:#7a5a00}
.mq-grid .c.s3{background:linear-gradient(145deg,#69db7c,#2f9e44);color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.25)}
.mq-grid .c.s3.wob{background:#b2f2bb;color:#2b8a3e;text-shadow:none}
.mq-grid .c.s3::after{content:'⭐';position:absolute;top:-4px;right:-3px;font-size:clamp(8px,1.2vw,12px);text-shadow:none}
.mq-grid .c.s3.wob::after{opacity:.55}
.mq-grid .c .fd{position:absolute;bottom:2px;left:0;right:0;display:flex;gap:2px;justify-content:center}
.mq-grid .c .fd i{width:4px;height:4px;border-radius:50%;background:#e8590c}
.mq-grid .c.sel{outline:3px solid #7c5cff;outline-offset:1px;z-index:1}
.mq-cap{text-align:center;color:var(--muted);font-size:14px;margin-top:8px}
.mq-side{flex:0 1 360px;min-width:0;display:flex;flex-direction:column;gap:12px}
.mq-card{background:#fff;border-radius:22px;padding:14px 16px;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.2)}
.mq-sum{font-size:22px;font-weight:700;margin:0 0 6px}
.mq-bar{height:16px;border-radius:9px;background:#efebf8;overflow:hidden;display:flex}
.mq-bar i{display:block;height:100%}
.mq-leg{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:10px;font-size:15px}
.mq-leg span{display:flex;align-items:center;gap:5px}
.mq-leg b{width:18px;height:18px;border-radius:5px;display:inline-block}
.mq-info{min-height:58px;font-size:18px;line-height:1.35;display:flex;align-items:center;gap:10px}
.mq-info .big{font-size:26px;font-weight:700;white-space:nowrap}
.mq-sprintbtn{width:100%;font-size:24px!important;padding:16px!important}
.mq-sprintnote{text-align:center;font-size:14px;margin-top:8px;color:var(--muted)}
.mq-sp{max-width:520px;margin:0 auto;background:#fff;border-radius:24px;padding:16px;color:var(--ink);box-shadow:0 5px 0 rgba(0,0,0,.2);text-align:center}
.mq-dots{display:flex;gap:5px;justify-content:center;margin-bottom:8px}
.mq-dots i{width:16px;height:16px;border-radius:50%;background:#efebf8}
.mq-dots i.ok{background:#51cf66}.mq-dots i.no{background:#ff8787}.mq-dots i.cur{background:#7c5cff;transform:scale(1.2)}
.mq-q{font-size:clamp(40px,9vw,60px);font-weight:700;margin:6px 0;white-space:nowrap}
.mq-q .ansbox{display:inline-block;min-width:1.6em;padding:0 .2em;border-radius:14px;background:#f3f0ff;border:3px dashed #b197fc;color:#7c5cff}
.mq-sp.right .ansbox{background:#d3f9d8;border:3px solid #51cf66;color:#2b8a3e}
.mq-sp.wrong .ansbox{background:#ffe3e3;border:3px solid #ff8787;color:#c92a2a}
.mq-fb{min-height:30px;font-size:20px;font-weight:700}
.mq-fb.ok{color:#2b8a3e}.mq-fb.no{color:#c92a2a}
.mq-sp .pad{width:min(360px,100%);margin:8px auto 4px}
.mq-sp .pad button{font-size:30px;padding:10px 0}
.mq-end .big-emoji{font-size:64px}
.mq-stats{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0}
.mq-stats div{background:#f3f0ff;border-radius:16px;padding:10px 14px;min-width:96px}
.mq-stats b{display:block;font-size:30px}
.mq-stats small{font-size:14px;color:var(--muted)}
.mq-cele{position:relative;overflow:hidden}
.mq-rowstars{font-size:22px;letter-spacing:2px;margin:6px 0}
.mq-coin{font-size:28px;font-weight:700;color:#e67700;margin:4px 0 12px}
.mq-conf{position:absolute;inset:0;pointer-events:none}
.mq-conf i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:mqfall 1.8s ease-in forwards}
@keyframes mqfall{to{transform:translateY(520px) rotate(540deg);opacity:0}}
.hcard.mq-hc .pe{font-size:40px}
.mq-par{font-size:15px;line-height:1.6}.mq-par li{margin:2px 0}.mq-par em{color:var(--muted);font-style:normal}
@media(max-width:820px){.mq-body{flex-direction:column;align-items:stretch}.mq-side .mq-info{order:3}.mq-gridwrap,.mq-side{flex:none;width:100%;max-width:610px;margin:0 auto}}
@media(max-width:520px){.mq{padding:8px 8px 20px}.mq-gridwrap{padding:7px;border-radius:16px}.mq-grid{gap:2px}.mq-grid .h,.mq-grid .c{border-radius:5px;font-size:10px}.mq-grid .h{font-size:11px}.mq-grid .c .fd i{width:3px;height:3px}
 .mq-tab{font-size:19px;padding:7px 12px}.mq-op{display:inline-flex;align-items:center;justify-content:center;width:1.3em;height:1.3em;border-radius:50%;color:#fff;font-weight:700;line-height:1;box-shadow:0 2px 0 rgba(0,0,0,.2);vertical-align:middle}
.mq-tab small{display:none}.mq-sum{font-size:19px}.mq-info{font-size:16px;min-height:48px}.mq-info .big{font-size:21px}.mq-card{padding:12px}.mq-cap{font-size:13px}}
`;
function css(){if(!document.getElementById('mqCSS')){const s=document.createElement('style');s.id='mqCSS';s.textContent=CSS;document.head.appendChild(s);}}
let RET='world',LAST='world',TAB=null,SEL=-1,SP=null;
const opsFor=p=>OPS4.filter(op=>op==='add'||op==='sub'||(p.grade||3)>=3||p.adult||lvl(p,'mul')>=3||countOp(p,op).seen+countOp(p,op).got+countOp(p,op).mastered>0);
function sprintInfo(p){const m=M(p);const [d,n]=(m.sp||'').split(':');const used=d===dayKey()?(+n||0):0;return {used,left:Math.max(0,3-used)};}
function statusLine(p,op,i){const f=fact(op,i),{s,f:fd}=get(p,op,i);const eq=`${f.text} = ${f.answer}`;
 if(s===0)return {eq:f.text+' = ?',msg:'🌱 A brand new fact! Meet it in a battle or a Fact Sprint.'};
 if(s===1)return {eq,msg:'📘 Learning this one — get it right to turn it yellow!'};
 if(s===2)return {eq,msg:fd?`⚡ Got it! Fast on ${fd} of 3 days — ${3-fd} more fast day${3-fd>1?'s':''} for a star.`:'👍 Got it! Now answer it fast on 3 different days for a ⭐.'};
 if(fd<3)return {eq,msg:'⭐ A wobbly star — answer it right and fast to make it shine again!'};
 return {eq,msg:'🌟 MASTERED! You know this one by heart.'};}
function draw(){const p=P();if(!p){go('profiles');return;}css();
 if(SP){drawSprint(p);return;}
 const ops=opsFor(p);if(!ops.includes(TAB))TAB=((p.grade||0)>=4&&ops.includes('mul'))?'mul':ops[0];const op=TAB,g=G[op];const str=cells(p,op);const cnt=countOp(p,op);const si=sprintInfo(p);
 let grid=`<div class="h corner">${g.sym}</div>`;for(let c=g.lo;c<g.lo+g.n;c++)grid+=`<div class="h">${g.colLbl(c)}</div>`;
 for(let r=g.lo;r<g.lo+g.n;r++){grid+=`<button class="h ${rowDone(p,op,r)?'done':''}" onclick="Mastery._row(${r})">${g.rowLbl(r)}</button>`;
  for(let c=g.lo;c<g.lo+g.n;c++){const i=idxOf(op,r,c);const {s,f}=dec(str[i]);const fc=fact(op,i);
   grid+=`<button class="c s${s} ${s===3&&f<3?'wob':''} ${i===SEL?'sel':''}" data-i="${i}" onclick="Mastery._cell(${i})">${s?fc.big:''}${s===2&&f?`<span class="fd">${'<i></i>'.repeat(f)}</span>`:''}</button>`;}}
 const pct=k=>(k/cnt.total*100).toFixed(2)+'%';
 const info=SEL>=0?statusLine(p,op,SEL):null;
 app.innerHTML=topbar()+`<div class="mq"><div class="zhead"><button class="btn ghost small" onclick="Mastery._back()">← ${({quests:'Quest Board',world:'World',map:'World',backpack:'Bag'})[RET]||'Back'}</button><h2 class="title">🗺️ Mastery Map</h2></div>
 <div class="mq-tabs">${ops.map(o=>`<button class="mq-tab ${o===op?'on':''}" onclick="Mastery._tab('${o}')">${badge(o)}<small>⭐${countOp(p,o).mastered}</small></button>`).join('')}</div>
 <div class="mq-body"><div class="mq-gridwrap"><div class="mq-grid" style="grid-template-columns:repeat(${g.n+1},minmax(0,1fr))">${grid}</div><div class="mq-cap">${g.cap} · tap any square</div></div>
 <div class="mq-side">
  <div class="mq-card"><p class="mq-sum">⭐ ${cnt.mastered} of ${cnt.total} ${g.name} facts mastered</p>
   <div class="mq-bar"><i style="width:${pct(cnt.mastered)};background:#40c057"></i><i style="width:${pct(cnt.got)};background:#ffd43b"></i><i style="width:${pct(cnt.seen)};background:#a5d8ff"></i></div>
   <div class="mq-leg"><span><b style="background:#40c057"></b>Mastered ${cnt.mastered}</span><span><b style="background:#ffe066"></b>Got it ${cnt.got}</span><span><b style="background:#d0ebff"></b>Learning ${cnt.seen}</span><span><b style="background:#efebf8"></b>New ${cnt.total-cnt.mastered-cnt.got-cnt.seen}</span></div></div>
  <div class="mq-card mq-info" id="mqInfo">${info?`<span class="big">${info.eq}</span><span>${info.msg}</span>`:`<span>👆 Tap a square to see that fact. Get a fact right <b>fast</b> on <b>3 different days</b> to earn its ⭐. The little orange dots count your fast days!</span>`}</div>
  <div class="mq-card"><button class="btn gold big mq-sprintbtn" onclick="Mastery._sprint()">⚡ Fact Sprint ${badge(op)}</button>
   <div class="mq-sprintnote">12 quick ${g.name} facts picked just for you · ${si.left?`🪙 coins on ${si.left} more sprint${si.left>1?'s':''} today`:'practice only for today (coins come back tomorrow)'}</div></div>
 </div></div></div>`;
}
function openScreen(from){go('mastery',from&&from!=='mastery'&&SCREENS[from]?from:undefined);}
/* ---------- sprint ---------- */
function startSprint(){const p=P();const list=sprintFacts(p,TAB);SP={op:TAB,list,i:0,input:'',res:[],improved:0,stars:0,busy:false,t0:performance.now(),fb:'',cls:'',done:false};try{SFX.tap();}catch(e){}draw();}
function drawSprint(p){const s=SP;
 if(s.done){const si=sprintInfo(p);const right=s.res.filter(x=>x).length;
  app.innerHTML=topbar()+`<div class="mq"><div class="mq-sp mq-end"><div class="big-emoji">${right>=10?'🏆':right>=7?'🌟':'💪'}</div><h2 style="margin:4px 0">${right>=10?'Super Sprint!':right>=7?'Great Sprint!':'Nice practice!'}</h2>
   <p style="font-size:18px;margin:4px 0">You got <b>${right} of ${s.list.length}</b> right.</p>
   <div class="mq-stats"><div><b>📈 ${s.improved}</b><small>facts improved</small></div><div><b>⭐ ${s.stars}</b><small>new stars</small></div><div><b>🪙 ${s.coins}</b><small>${s.rewarded?'coins earned':'practice only'}</small></div></div>
   <p class="muted" style="font-size:15px">${s.rewarded?(si.left?`Coins on ${si.left} more sprint${si.left>1?'s':''} today.`:'That was your last coin sprint today — more practice still grows your stars!'):'You used today\'s 3 coin sprints, but every sprint still grows your Mastery Map!'}</p>
   <div class="row"><button class="btn gold" onclick="Mastery._sprint()">⚡ Sprint again</button><button class="btn green" onclick="Mastery._map()">🗺️ See my map</button></div></div></div>`;
  setTimeout(flush,900);return;}
 const f=s.list[s.i];
 app.innerHTML=topbar()+`<div class="mq"><div class="zhead"><button class="btn ghost small" onclick="Mastery._quit()">✕ Stop</button><h2 class="title">⚡ Fact Sprint ${badge(s.op)}</h2></div>
 <div class="mq-sp ${s.cls}"><div class="mq-dots">${s.list.map((_,k)=>`<i class="${k<s.res.length?(s.res[k]?'ok':'no'):k===s.i?'cur':''}"></i>`).join('')}</div>
 <div class="mq-q">${f.text} = <span class="ansbox">${s.input||'?'}</span></div>
 <div class="mq-fb ${s.cls==='right'?'ok':s.cls==='wrong'?'no':''}">${s.fb||'&nbsp;'}</div>
 <div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="Mastery._key('${n}')">${n}</button>`).join('')}<button class="del" onclick="Mastery._key('del')">⌫</button><button onclick="Mastery._key('0')">0</button><button class="go" onclick="Mastery._key('go')">✓</button></div></div></div>`;
}
function key(k){const s=SP;if(!s||s.done||s.busy)return;const p=P();
 if(k==='del')s.input=s.input.slice(0,-1);
 else if(k==='go'){if(s.input)return check(p);return;}
 else if(s.input.length<3)s.input=s.input==='0'?k:s.input+k;
 try{SFX.tap();}catch(e){}drawSprint(p);}
function check(p){const s=SP,f=s.list[s.i];const secs=(performance.now()-s.t0)/1000;const ok=+s.input===f.answer;s.busy=true;
 const r=record(p,s.op,f.i,ok,secs);if(r.after>r.before)s.improved++;if(r.newStar)s.stars++;s.res.push(ok);
 if(ok){s.cls='right';s.fb=r.newStar?'🌟 NEW STAR!':r.fast?pick(['⚡ Lightning fast!','⚡ Speedy!','⚡ Zoom!']):pick(['✔ Right!','✔ Yes!','✔ Nice!']);try{SFX.correct();}catch(e){}}
 else{s.cls='wrong';s.fb=`Oops — ${f.text} = ${f.answer}`;try{SFX.wrong();}catch(e){}}
 drawSprint(p);
 setTimeout(()=>{if(SP!==s)return;s.i++;s.input='';s.cls='';s.fb='';s.busy=false;s.t0=performance.now();
  if(s.i>=s.list.length)finish(p);else drawSprint(p);},ok?700:1700);}
function finish(p){const s=SP;s.done=true;const m=M(p);const si=sprintInfo(p);const right=s.res.filter(x=>x).length;
 s.rewarded=si.left>0;s.coins=s.rewarded?Math.min(15,right+(right===s.list.length&&s.list.length>=12?3:0)):0;
 if(s.rewarded){m.sp=dayKey()+':'+(si.used+1);p.coins+=s.coins;}
 try{SFX.win();}catch(e){}try{save();}catch(e){}drawSprint(p);}
/* ---------- public API ---------- */
function summary(p){const o={};OPS4.forEach(op=>{const c=countOp(p,op);o[op]={mastered:c.mastered,got:c.got,seen:c.seen,total:c.total};});return o;}
function cardHTML(p){p=p||P();if(!p)return '';const n=totalStars(p);
 return `<button class="hcard mq-hc" onclick="Mastery.open(curScreen)"><span class="pav"><span class="pe">🗺️</span></span><div><b>Mastery Map</b><small>⭐ ${n} fact${n===1?'':'s'} mastered</small></div></button>`;}
window.Mastery={open:openScreen,cardHTML:p=>{try{css();return cardHTML(p);}catch(e){return '';}},summary,weakFacts,
 _tab(o){TAB=o;SEL=-1;try{SFX.tap();}catch(e){}draw();},
 _cell(i){SEL=i;try{SFX.tap();}catch(e){}const p=P();document.querySelectorAll('.mq-grid .c.sel').forEach(x=>x.classList.remove('sel'));const el=document.querySelector(`.mq-grid .c[data-i="${i}"]`);if(el)el.classList.add('sel');const inf=statusLine(p,TAB,i);const box=document.getElementById('mqInfo');if(box)box.innerHTML=`<span class="big">${inf.eq}</span><span>${inf.msg}</span>`;},
 _row(r){const p=P(),op=TAB,g=G[op];let n=0;for(let c=g.lo;c<g.lo+g.n;c++)if(get(p,op,idxOf(op,r,c)).s===3)n++;try{SFX.tap();}catch(e){}
  const box=document.getElementById('mqInfo');if(box)box.innerHTML=`<span class="big">${g.rowLbl(r)}</span><span>${n===g.n?`🏆 You mastered the ${ROWNAME[op](r)}!`:`The ${ROWNAME[op](r)}: ⭐ ${n} of ${g.n} mastered.`}</span>`;},
 _back(){SP=null;SEL=-1;try{SFX.tap();}catch(e){}go(SCREENS[RET]?RET:'world');},
 _map(){SP=null;draw();},
 _quit(){SP=null;draw();},
 _sprint:startSprint,_key:key,_flush:flush,
 _record(p,op,i,ok,secs){return record(p,op,i,ok,secs);},_cellOfQ:cellOfQ};
document.addEventListener('keydown',e=>{try{if(typeof curScreen==='undefined'||curScreen!=='mastery'||!SP||SP.done||document.querySelector('#modal.show'))return;
 if(/^[0-9]$/.test(e.key)){key(e.key);e.preventDefault();}else if(e.key==='Backspace'){key('del');e.preventDefault();}else if(e.key==='Enter'){key('go');e.preventDefault();}}catch(x){}});
/* ---------- hooks ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({
 answer(p,q,ok,secs){if(!p)return;const i=cellOfQ(q);if(i<0)return;record(p,q.op,i,!!ok,+secs||99);},
 screen(name){if(name!=='mastery'){LAST=name;SP=null;}if(name!=='battle')setTimeout(flush,700);},
 session(p){SP=null;SEL=-1;TAB=null;RET='world';setTimeout(flush,2500);}
});
window.MQ_PARENT=window.MQ_PARENT||[];
window.MQ_PARENT.push(()=>{if(typeof state==='undefined'||!state.players||!state.players.length)return '';
 const rows=state.players.filter(pl=>pl.setup!==false).map(pl=>{const s=summary(pl);const w=[...weakFacts(pl,'mul',2),...weakFacts(pl,'add',2)].slice(0,3).map(f=>f.text).join(', ');
  return `<li><b>${esc(pl.name)}</b> · ${OPS4.map(op=>`${G[op].e} ${s[op].mastered}/${s[op].total}`).join(' · ')}${w?` <em>· practice: ${esc(w)}</em>`:''}</li>`;}).join('');
 return `<div class="pp"><h3>🗺️ Mastery Map</h3><p class="muted" style="margin:4px 0 8px">Basic facts mastered (right and fast on 3 different days). Fast = under 3s for + − and 4s for × ÷ (+1.5s for grades 1–2). Fact Sprints pay 1 coin per right answer, 3 paid sprints a day; +25 per 10 new stars, +50 per finished row.</p><ul class="mq-par">${rows}</ul></div>`;});
/* ---------- screen registration (SCREENS may not exist yet) ---------- */
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.mastery=arg=>{if(typeof arg==='string'&&arg!=='mastery'&&SCREENS[arg])RET=arg;else if(!SP&&LAST&&LAST!=='mastery'&&SCREENS[LAST])RET=LAST;css();draw();};}else setTimeout(reg,30);})();
})();
