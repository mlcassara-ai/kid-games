/* ================= The Great Fade (yearly event: Nov 1 – Nov 16) =================
   A random event, one kid at a time: the Grey Goblin, who doesn't like color, steals every color from that kid's world and hides it. Prisma the Color Wizard
   (the Grey Goblin took hers too) teaches them to mix it back with paint drops they win in battles — ratios, fractions,
   percentages, 0–255 light values and wheel angles, scaled by grade. 9–12 mixing puzzles in 4 stages.

   WHEN: a yearly event, on by itself from Nov 1 00:00 (local time) for 16 days, i.e. through Nov 16 (two full weekends).
   Before Nov 1 it does nothing visible (no teaser). During the window each kid gets one Great Fade: the colors drain after
   their first battle win (or a little while after they log in, on the World screen, if they've battled before).
   After Nov 16 it goes quiet: no gray, no HUD, the mixing-table screen bounces to the World; prizes, coins and p.fade stay.
   An unfinished Fade sleeps until next Nov 1, then picks up where it left off (Prisma re-introduces herself).
   Preview / test outside the window: ?fade=1 in the URL, window.FADE_FORCE=true, Fade._dbg.force(true),
   or the old beta switch localStorage 'mqFadeBeta'==='1' / window.MQ_FADE_BETA===true.
   (Always, even when quiet: the two prize definitions — the Rainbow Chameleon pet and the Prismatic robe — are
   registered, so a kid who won them never has an unknown id in p.pets / p.owned.robes.)
   Popups: never starts while #modal.show is up, while MQ_VISIT.busy('fade') (another visitor holds the slot or stands on the
   map) or outside the game's autoPopOK() popup budget. Holds MQ_VISIT 'fade' while the drain and Prisma's intro are on
   screen, releases it after. Works without MQ_VISIT too (then only #modal / autoPopOK / trollBusy are checked).

   Uses Math Quest globals only at run time (loaded before index.html's main script): P, save, go, SCREENS,
   curScreen, topbar, toast, tone, SFX, PETS, ROBES, petData, autoPopOK, autoPopUsed, eventOpen, heroSVG, state.
   Hooks via window.MQ_HOOKS: answer, battle, flee, screen, session.

   Saved per player in p.fade (compact; ~100–250 bytes):
     c  completed fades        n  next time a fade may start (ms)      sp rare paint splotches won
     h  history [[startDay,endDay,helpersUsed], …] (last 6, day = days since 1970)
     a  the active fade: {t start ms, sd seed, b grade band 0–3, s stage, i puzzle in stage, d [red,yellow,blue] drops,
        in intro seen, hp last helper-puzzle ms, hu helpers used}
*/
(function(){
'use strict';
const EV_MONTH=10,EV_DAY=1,EV_DAYS=16; /* Nov 1 00:00 local, 16 days: through the end of Nov 16 */
const FIRST_WINS=1,GAP=[21,28],HELP_DAYS=3,POT_CAP=30,STARTER=4,LOGIN_WAIT=25e3,VISIT_GAP=10*60e3;
const DAY=864e5;
let SKEW=0;const now=()=>Date.now()+SKEW;
const dnum=t=>Math.floor((t==null?now():t)/DAY);
function flag(){if(window.MQ_FADE_BETA===true)return true;try{return localStorage.getItem('mqFadeBeta')==='1';}catch(e){return false;}}
function ymd(t){const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
let FORCE=false;try{FORCE=/[?&]fade=1(&|$)/.test(location.search||'');}catch(e){}
function forced(){return FORCE||window.FADE_FORCE===true;}
const evStart=y=>new Date(y,EV_MONTH,EV_DAY).getTime(),evEnd=y=>new Date(y,EV_MONTH,EV_DAY+EV_DAYS).getTime();
function inWindow(t){t=t==null?now():t;const y=new Date(t).getFullYear();return t>=evStart(y)&&t<evEnd(y);}
/* the start of the most recent window that has already begun (this year's if we're past Nov 1, else last year's) */
function lastStart(t){t=t==null?now():t;const y=new Date(t).getFullYear();return t>=evStart(y)?evStart(y):evStart(y-1);}
function enabled(){return inWindow()||forced()||flag();}
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const me=()=>{try{return typeof P==='function'?P():null;}catch(e){return null;}};
const cur=()=>{try{return typeof curScreen!=='undefined'?curScreen:'';}catch(e){return '';}};
const sv=()=>{try{if(typeof save==='function')save();}catch(e){}};
const say=m=>{try{if(typeof toast==='function')toast(m);}catch(e){}};
const snd=k=>{try{if(typeof SFX!=='undefined'&&SFX[k])SFX[k]();}catch(e){}};
const tn=(f,d,t,v,dl)=>{try{if(typeof tone==='function')tone(f,d,t,v,dl);}catch(e){}};
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
function goTo(s,a){try{go(s,a);}catch(e){}}
/* read-aloud: the game's own say()/speakable()/voiceOn(); a 🔊 button on questions and Prisma's lines, and grade 2 and
   under hear each new question / mixing instruction once, automatically (the intro story is button-only) */
const gfn=n=>{try{return typeof window[n]==='function'?window[n]:null;}catch(e){return null;}};
const voiceOK=()=>{try{const v=gfn('voiceOn');return v?v():true;}catch(e){return true;}};
const youngR=p=>!!p&&!p.adult&&(+p.grade||3)<=2;
function spText(el){if(!el)return '';const c=el.cloneNode(true);c.querySelectorAll('h2,h3,p,li,.fd-q').forEach(x=>x.append(/h\d/i.test(x.tagName)&&!/[.!?]\s*$/.test(x.textContent)?'. ':' '));c.querySelectorAll('button:not(.fd-mco),.fd-mcl,.fd-spk,[aria-hidden="true"]:not(.fd-sr)').forEach(x=>x.remove());
 c.querySelectorAll('.fd-mco').forEach((b,j)=>b.replaceWith(document.createTextNode(' '+'ABC'[j]+'. '+(b.textContent||'').trim()+'. ')));const t=(c.textContent||'').replace(/\s+/g,' ').trim();const sp=gfn('speakable');return sp?sp(t):t;}
function speakEl(el){const sy=gfn('say');if(!sy||!el)return;try{speechSynthesis.cancel();}catch(e){}const t=spText(el);if(t)sy(t,.85);}
function tapSpeak(btn){try{const busy=gfn('ttsBusy');if(busy&&busy()){const st=gfn('ttsStop');if(st)st();else speechSynthesis.cancel();return;}speakEl(btn.closest('[data-spk]'));}catch(e){}}
const SPK='<button class="qspk inl fd-spk" type="button" title="Read it to me" aria-label="Read it out loud" onclick="event.stopPropagation();Fade._say(this)">🔊</button>';
let SPOKE='',LASTPZ=null;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- state ---------- */
function F(p){if(!p.fade||typeof p.fade!=='object')p.fade={};const f=p.fade;if(f.a&&f.a.v!==2){f.a.v=2;f.a.s=0;f.a.i=0;} /* v1 beta fades restart on the 7-color plan */if(!Array.isArray(f.h))f.h=[];f.c=f.c||0;
 if(f.a&&enabled()&&(f.a.t||0)<lastStart()){f.a.t=now();f.a.in=0;delete f.a.hp;delete f.a.hs;} /* last year's unfinished Fade: keep its progress, Prisma says hello again */
 return f;}
const band=g=>{g=+g||3;return g<=2?0:g<=4?1:g<=6?2:3;};
function active(p){p=p||me();return !!(enabled()&&p&&p.fade&&p.fade.a);}
const SIZES=b=>b>=3?[3,4,2]:[3,4,1];
const LEV=[1,.6,.15,0];
function level(p){const a=p&&p.fade&&p.fade.a;if(!a)return 0;const z=SIZES(a.b);if(a.s>=z.length)return 0;return LEV[a.s]+(LEV[a.s+1]-LEV[a.s])*(a.i/z[a.s]);}
function totalDone(a){const z=SIZES(a.b);let n=0;for(let s=0;s<a.s&&s<z.length;s++)n+=z[s];return n+(a.s<z.length?a.i:0);}

/* ---------- colors: names, patterns (for kids who see colors differently) and paint mixing ---------- */
const PRIM={r:{n:'red',hex:'#e03131',rgb:[224,49,49]},y:{n:'yellow',hex:'#fcc419',rgb:[252,196,25]},b:{n:'blue',hex:'#1c7ed6',rgb:[28,126,214]},
 w:{n:'white',hex:'#ffffff',rgb:[255,255,255]},k:{n:'black',hex:'#2b2527',rgb:[43,37,39]}};
const KEYS=['r','y','b','w','k'];
/* the RYB paint cube (Gossett & Chen style): corners are what the paints look like when mixed 1:1 */
const CUBE={w:[255,255,255],r:PRIM.r.rgb,y:PRIM.y.rgb,o:[253,126,20],b:PRIM.b.rgb,p:[123,63,181],g:[55,170,72],x:[60,44,36]};
function ryb(r,y,b){const m=Math.max(r,y,b);if(!m)return null;r=Math.pow(r/m,.6);y=Math.pow(y/m,.6);b=Math.pow(b/m,.6);const C=CUBE,out=[0,0,0];
 const W=[[(1-r)*(1-y)*(1-b),C.w],[r*(1-y)*(1-b),C.r],[(1-r)*y*(1-b),C.y],[r*y*(1-b),C.o],[(1-r)*(1-y)*b,C.b],[r*(1-y)*b,C.p],[(1-r)*y*b,C.g],[r*y*b,C.x]];
 W.forEach(([w,c])=>{out[0]+=w*c[0];out[1]+=w*c[1];out[2]+=w*c[2];});return out;}
/* mix = {r,y,b,w,k} drop counts → [R,G,B]. Primaries set the hue (RYB cube), white tints it (linear), black shades it (a little goes a long way). */
function mixRGB(m){const r=m.r||0,y=m.y||0,b=m.b||0,w=m.w||0,k=m.k||0,T=r+y+b+w+k;if(!T)return null;
 let base=ryb(r,y,b);const pT=r+y+b;let c;
 if(!base)c=w?[255,255,255]:PRIM.k.rgb.slice();else{const ps=pT/(pT+w);c=base.map((v,i)=>v*ps+255*(1-ps));}
 if(k){if(!pT&&!w)return PRIM.k.rgb.slice();const f=1-Math.min(.82,k/T*2);c=c.map((v,i)=>v*f+PRIM.k.rgb[i]*(1-f)*.35);}
 return c.map(v=>Math.max(0,Math.min(255,Math.round(v))));}
const hex=c=>c?'#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''):'#e9ecef';
const mixHex=m=>hex(mixRGB(m));
function shares(m){const T=KEYS.reduce((s,k)=>s+(m[k]||0),0)||1;const o={};KEYS.forEach(k=>o[k]=(m[k]||0)/T);return o;}
function sameRatio(a,b){const A=shares(a),B=shares(b);return KEYS.every(k=>Math.abs(A[k]-B[k])<1e-9);}
function offBy(bowl,tgt){const A=shares(bowl),B=shares(tgt);let best=null,d=0;KEYS.forEach(k=>{const x=A[k]-B[k];if(x>d+1e-9){d=x;best=k;}});return best;}
const TOO={r:'Too red!',y:'Too yellow!',b:'Too blue!',w:'Too light: too much white!',k:'Too dark: too much black!'};
/* SVG patterns: dots = red, stripes = yellow, waves = blue, sparkles = white, criss-cross = black */
const DEFS=`<svg id="fdDefs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<pattern id="fdp-r" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.5" fill="#fff" fill-opacity=".6"/></pattern>
<pattern id="fdp-y" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="7" fill="#000" fill-opacity=".2"/></pattern>
<pattern id="fdp-b" width="10" height="7" patternUnits="userSpaceOnUse"><path d="M0 4 Q2.5 1 5 4 T10 4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3"/></pattern>
<pattern id="fdp-w" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M4.5 2.5v4M2.5 4.5h4" stroke="#000" stroke-opacity=".18" stroke-width="1.1"/></pattern>
<pattern id="fdp-k" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M8 0L0 8" stroke="#fff" stroke-opacity=".35" stroke-width="1"/></pattern>
</defs></svg>`;
const pats=m=>KEYS.filter(k=>m[k]).map(k=>`<rect width="100%" height="100%" fill="url(#fdp-${k})"/>`).join('');
function swatch(m,sz,cls){return `<svg class="fd-sw ${cls||''}" viewBox="0 0 60 60" width="${sz}" height="${sz}" aria-hidden="true"><clipPath id="fdc${++UID}"><rect width="60" height="60" rx="14"/></clipPath><g clip-path="url(#fdc${UID})"><rect width="60" height="60" fill="${mixHex(m)}"/>${pats(m)}</g><rect x="1.5" y="1.5" width="57" height="57" rx="13" fill="none" stroke="#2b2250" stroke-width="3"/></svg>`;}
let UID=0;
function drop(k,sz,gray){const c=PRIM[k];const id='fdd'+(++UID);return `<svg class="fd-drop" viewBox="0 0 24 30" width="${sz}" height="${Math.round(sz*1.25)}" aria-hidden="true"><clipPath id="${id}"><path d="M12 1.5C12 1.5 3 12.5 3 19a9 9 0 0 0 18 0C21 12.5 12 1.5 12 1.5Z"/></clipPath><g clip-path="url(#${id})"><rect width="24" height="30" fill="${gray?'#adb5bd':c.hex}"/>${gray?'':`<rect width="24" height="30" fill="url(#fdp-${k})"/>`}</g><path d="M12 1.5C12 1.5 3 12.5 3 19a9 9 0 0 0 18 0C21 12.5 12 1.5 12 1.5Z" fill="none" stroke="#2b2250" stroke-width="1.8"/><ellipse cx="8.5" cy="18" rx="2" ry="3.2" fill="#fff" opacity=".6"/></svg>`;}
const cw=k=>`<b class="fd-cw fd-c-${k}">${PRIM[k].n}</b>`;
/* a recipe shown as drops: "🟡🟡🟡 : 🔴" (≤4 drops drawn, else "12 ×") */
function recipeHTML(m,sep){const parts=KEYS.filter(k=>m[k]).map(k=>{const n=m[k];return `<span class="fd-rc"><span>${n<=4?Array(n).fill(drop(k,18)).join(''):`<b>${n}×</b>${drop(k,18)}`}</span><small>${n} ${PRIM[k].n}</small></span>`;});return parts.join(`<span class="fd-rsep">${sep||':'}</span>`);}

/* ---------- the plan: fill the 7 rainbow colors on Prisma's Color Wheel ---------- */
/* primaries (won in battles, poured straight in) → 4 mixes → the Rainbow Bridge finale (+ an optional bonus for high school) */
const SEVEN=['r','o','y','g','b','i','v'];
const RBOW={r:'#e03131',o:'#fd7e14',y:'#fcc419',g:'#37b24d',b:'#1c7ed6',i:'#3b3fae',v:'#9c5bd6'};
const CNAME={r:'red',o:'orange',y:'yellow',g:'green',b:'blue',i:'indigo',v:'violet'};
const RECIPE={r:{r:1},y:{y:1},b:{b:1},o:{r:2,y:2},g:{y:2,b:2},i:{b:3,k:1},v:{r:1,b:1,w:1}};
const MIX_ORDER=['o','g','i','v'];
const PARTS={o:['r','y'],g:['y','b'],i:['b','k'],v:['r','b','w']};
const Cap=s=>s[0].toUpperCase()+s.slice(1);
const cwc=c=>`<b class="fd-cw" style="color:${c==='y'?'#b08800':RBOW[c]}">${CNAME[c]}</b>`;
/* math that sits comfortably BELOW each kid's level: a question type is allowed when its level is ≤ (kid's level − 2) in that op, never above */
const TYPES={pick:[null,0],bowlpick:[null,0],addpics:['add',1],countup:['add',1],count20:['sub',2],double:['mul',1],half:['div',2],groups:['mul',3],ratioMC:['div',3],scale:['mul',4],pctMC:['frac',4],pctOf:['frac',6]};
function kidLv(p,op){const g=+p.grade||3;if(g>=7)return 10;try{if(typeof lvl==='function'&&p.skill&&p.skill[op]!=null)return lvl(p,op);}catch(e){}return Math.min(10,g+1);}
function comfort(p,op){const L=kidLv(p,op);return Math.max(1,Math.min(L,L-2));}
const typeOK=(p,t)=>{const [op,need]=TYPES[t];return !op||need<=comfort(p,op);};
const POOLS=[
 {slot:['count20','double','countup','addpics'],mix:['pick','bowlpick','addpics','countup'],fin:['countup']},
 {slot:['half','double','count20','countup'],mix:['ratioMC','scale','bowlpick','pick','groups'],fin:['groups','countup']},
 {slot:['pctOf','half','count20'],mix:['pctMC','ratioMC','scale','bowlpick'],fin:['groups','countup']},
 {slot:['pctOf','half','count20'],mix:['ratioMC','pctMC','scale'],fin:['groups']}];
function pickType(p,a,ctx,i,c){const pool=POOLS[a.b][ctx].filter(t=>typeOK(p,t)&&!(ctx==='mix'&&BADFOR[t]&&BADFOR[t](c)));const top=pool.slice(0,3);
 if(!top.length)return ctx==='mix'?'pick':'countup';return top[((a.sd>>>3)+i)%top.length];}
const BADFOR={pctMC:c=>c==='v',ratioMC:()=>false};
const dropsPic=(k,n)=>`<span class="fd-dpic">${Array(n).fill(drop(k,20)).join('')}<span class="fd-sr"> ${n} ${PRIM[k].n} drop${n>1?'s':''} </span></span>`;
const mcDrops=m=>Object.keys(m).filter(k=>m[k]).map(k=>dropsPic(k,m[k])).join('<b class="fd-plus">+</b>');
function mcOpts(R,correct,wrongs){const all=[correct,...wrongs.slice(0,2)];for(let j=all.length-1;j>0;j--){const q=Math.floor(R()*(j+1));[all[j],all[q]]=[all[q],all[j]];}return {mc:all,a:all.indexOf(correct)};}
/* one question: t = type, c = target color key (slot or mix), ctx = 'slot' | 'mix' | 'fin' */
function question(t,c,ctx,R,ri,pk){const nm=cwc(c),pr=PARTS[c]||[];const P1=pr[0],P2=pr[1];
 const pn=k=>`<b class="fd-cw fd-c-${k}">${PRIM[k].n}</b>`;
 switch(t){
 case 'countup':{if(ctx==='fin'){return {q:`A rainbow has <b>7</b> colors. You <b>mixed</b> 4 of them. How many colors did you win in battles?`,a:3,work:['Count up from 4 to 7.','4 … 5, 6, 7']};}
  const n=ri(4,6),h=n-ri(2,3);return {q:`The ${nm} slot needs <b>${n}</b> drops. It already has <b>${h}</b>: ${dropsPic(ctx==='slot'?c:P1,h)} How many more?`,a:n-h,n:n-h,work:[`Count up from ${h} to ${n}.`,`${h} + ? = ${n}`]};}
 case 'count20':{const n=ri(12,16),h=n-ri(2,4);return {q:`The ${nm} slot holds <b>${n}</b> drops when it's full. It has <b>${h}</b>. How many more to fill it?`,a:n-h,n:n-h,work:[`Count up from ${h}.`,`${h} + ? = ${n}`]};}
 case 'addpics':{if(ctx==='mix'&&RECIPE[c]){const R0=RECIPE[c],ks=Object.keys(R0),tot=ks.reduce((t,k)=>t+R0[k],0); /* show the REAL recipe, so the question matches the 'Now put…' step that follows */
  return {q:`For ${nm}, I put these in the mixing bowl. How many drops in all? ${ks.map(k=>dropsPic(k,R0[k])).join('<b class="fd-plus">+</b>')}`,a:tot,n:tot,work:['Count them one by one.',`${ks.map(k=>R0[k]).join(' + ')} = ?`]};}
  const k1=ctx==='slot'?c:P1,k2=ctx==='slot'?c:P2,x=ri(1,2),y=ri(1,2);return {q:`${ctx==='mix'?`For ${nm}, I put these in the mixing bowl. `:''}How many drops in all? ${dropsPic(k1,x)}<b class="fd-plus">+</b>${dropsPic(k2,y)}`,a:x+y,n:x+y,work:['Count them one by one.',`${x} + ${y} = ?`]};}
 case 'double':{const e=ri(1,2);if(ctx==='slot')return {q:`The ${nm} slot has <b>2</b> sides. Each side needs <b>${e}</b> drop${e>1?'s':''}. How many drops?`,a:2*e,n:2*e,work:['2 sides, the same on each side.',`${e} + ${e} = ?`]};
  return {q:`${Cap(CNAME[c])} needs <b>2</b> ${pn(P1)} drops in every pot. Make <b>2</b> pots. How many ${pn(P1)} drops?`,a:4,work:['2 pots with 2 each.','2 + 2 = ?']};}
 case 'half':{const h=ri(2,4);return {q:`I have <b>${2*h}</b> ${ctx==='slot'?pn(c):pn(P1)} drops. <b>Half</b> of them go in the ${nm} slot. How many is half?`,a:h,n:ctx==='slot'?h:undefined,work:['Half means 2 equal groups.',`${2*h} ÷ 2 = ?`]};}
 case 'groups':{if(ctx==='fin'){const k=ri(2,3);return {q:`My rainbow has <b>7</b> stripes. Each stripe needs <b>${k}</b> drops. How many drops in all?`,a:7*k,work:[`7 groups of ${k}.`,`7 × ${k} = ?`]};}
  const g=ri(2,4),k=ri(2,5);return {q:`For the ${nm} slot I fill <b>${g}</b> little pots with <b>${k}</b> drops each. How many drops is that?`,a:g*k,work:[`${g} groups of ${k}.`,`${g} × ${k} = ?`]};}
 case 'pctOf':{const [pc,tot]=pk([[10,30],[10,20],[50,6],[50,8],[25,12],[25,8]]);return {q:`The ${nm} slot needs <b>${pc}%</b> of <b>${tot}</b> drops. How many drops?`,a:pc*tot/100,n:ctx==='slot'?pc*tot/100:undefined,work:[pc===50?'50% is half.':pc===25?'25% is a quarter: half of half.':'10% is one tenth.',`${pc===50?tot+' ÷ 2':pc===25?tot+' ÷ 4':tot+' ÷ 10'} = ?`]};}
 case 'pick':{const lab=ks=>`<span class="fd-dpic">${ks.map(k=>drop(k,22)).join('')}</span><span>${ks.map(k=>PRIM[k].n).join(' + ')}</span>`;const W=[['r','b'],['y','b'],['r','y'],['b','k'],['r','w'],['y','w'],['y','k']].filter(x=>!x.every(k=>pr.includes(k)));
  const o=mcOpts(R,lab(pr),[lab(W[ri(0,1)]),lab(W[ri(2,4)])]);
  return Object.assign(o,{q:`Which colors make ${nm}?`,work:[c==='v'?'Violet is a light purple. Purple comes from red and blue…':c==='i'?'Indigo is a deep, dark blue.':c==='o'?'Orange sits between red and yellow on the wheel.':'Green sits between yellow and blue on the wheel.']});}
 case 'bowlpick':{const R0=RECIPE[c];const alts=[{r:2,b:2},{y:2,b:2},{r:2,y:2},{b:3,w:1},{r:1,y:1,w:1}].filter(m=>JSON.stringify(m)!==JSON.stringify(R0));
  const o=mcOpts(R,`<span class="fd-mbowl">${mcDrops(R0)}</span>`,[`<span class="fd-mbowl">${mcDrops(alts[ri(0,1)])}</span>`,`<span class="fd-mbowl">${mcDrops(alts[ri(2,3)])}</span>`]);
  return Object.assign(o,{q:`Which mixing bowl makes ${nm}?`,work:[`Which two colors sit next to ${CNAME[c]} on the wheel?`]});}
 case 'ratioMC':{const R0=RECIPE[c],r1=R0[P1],r2=R0[P2],g=gcd(r1,r2),x=r1/g,y=r2/g,m=ri(2,5);
  const right=`${x} : ${y}`,W=[`${y} : ${x}`,`1 : 2`,`2 : 1`,`1 : 1`,`3 : 1`,`1 : 3`].filter(s=>s!==right&&s!==`${x} : ${y}`);const uniq=[...new Set(W)];
  const o=mcOpts(R,right,[uniq[0],uniq[1]]);
  return Object.assign(o,{q:`I put <b>${x*m}</b> ${pn(P1)} and <b>${y*m}</b> ${pn(P2)} drops in the mixing bowl for ${nm}. What's the ratio of ${PRIM[P1].n} to ${PRIM[P2].n}?`,work:[`Share both numbers by ${m}.`,`${x*m} ÷ ${m} = ${x} and ${y*m} ÷ ${m} = ?`]});}
 case 'scale':{const m=ri(2,4);if(c==='i')return {q:`Indigo is <b>3</b> ${pn('b')} for every <b>1</b> ${pn('k')}. You have <b>${m}</b> black drops. How many blue?`,a:3*m,work:['3 blue for each black.',`3 × ${m} = ?`]};
  if(c==='v')return {q:`Violet is <b>1</b> ${pn('r')}, <b>1</b> ${pn('b')} and <b>1</b> ${pn('w')}. With <b>${m}</b> red drops, how many drops in all?`,a:3*m,work:[`${m} red, ${m} blue and ${m} white.`,`3 × ${m} = ?`]};
  return {q:`${Cap(CNAME[c])} uses the <b>same</b> number of ${pn(P1)} and ${pn(P2)}. With <b>${m*2}</b> ${PRIM[P1].n} drops, how many drops in all?`,a:4*m,work:[`${m*2} of each.`,`${m*2} + ${m*2} = ?`]};}
 case 'pctMC':{const R0=RECIPE[c],T=bowlN(R0),k=c==='i'?'k':P1,n=R0[k],pc=Math.round(n/T*100);
  const o=mcOpts(R,pc+'%',[25,50,75].filter(x=>x!==pc).map(x=>x+'%'));
  return Object.assign(o,{q:`My mixing bowl for ${nm} has <b>${T}</b> drops: ${mcDrops(R0)} What percent of the drops are ${PRIM[k].n}?`,work:[`${n} out of ${T}.`,n*2===T?'That is half.':'That is a quarter: 1 of 4.']});}
 }}
const gcd=(x,y)=>y?gcd(y,x%y):x;
function gen(p,a,s,i,helper){
 const R=mulberry((a.sd|0)+s*101+i*13+(helper?777:0)),ri=(x,y)=>x+Math.floor(R()*(y-x+1)),pk=arr=>arr[Math.floor(R()*arr.length)];
 if(helper){const x=ri(2,5),y=ri(1,3);return {key:'help',kind:'help',name:'Prisma\'s secret paint',mix:{r:1,y:1,b:1},q:`Easy one! I have <b>${x}</b> drops of secret paint and find <b>${y}</b> more. How many drops now?`,a:x+y,work:[`Start at ${x}.`,`Count up ${y} more.`]};}
 const key=s+'.'+i;
 if(s===0){const c=['r','y','b'][i],t=pickType(p,a,'slot',i),Q=question(t,c,'slot',R,ri,pk);const n=Q.n>=2&&Q.n<=4?Q.n:3;
  return Object.assign({key,kind:'slot',k:c,slot:c,type:t,name:Cap(CNAME[c]),mix:{[c]:n}},Q);}
 if(s===1){const c=MIX_ORDER[i],t=pickType(p,a,'mix',i,c),Q=question(t,c,'mix',R,ri,pk);
  return Object.assign({key,kind:'mix',slot:c,type:t,name:Cap(CNAME[c]),mix:Object.assign({},RECIPE[c])},Q);}
 if(a.b>=3&&i===0){const v=pk([0,1,2]);
  if(v===2){const r0=pk([30,45,60]);return {key,kind:'light',bonus:1,slot:'c',name:'Color-wheel angles',light:[255,128,0],mix:{r:1},q:`<b>Bonus:</b> on a 360° wheel, the <b>complement</b> is straight across. If orange sits at <b>${r0}°</b>, where is its complement?`,a:r0+180,work:['Straight across is half a turn: 180°.',`${r0} + 180 = ?`],after:'Yes! Complementary colors sit 180° apart. Blue is across from orange.'};}
  if(v===1){const r0=pk([55,105,155,200]);return {key,kind:'light',bonus:1,slot:'c',name:'Printer ink',light:[r0,255,255],ink:1,mix:{b:1},q:`<b>Bonus:</b> screens use light (RGB); printers use ink (cyan, magenta, yellow). Cyan ink = 255 − red light. If red is <b>${r0}</b>, how much cyan?`,a:255-r0,work:[`255 − ${r0} = ?`],after:`Yes! Cyan ${255-r0}: less red light means more cyan ink.`};}
  return {key,kind:'light',bonus:1,slot:'c',name:'Orange light',light:[255,128,0],mix:{r:1},q:'<b>Bonus:</b> screens mix <b>light</b>. Orange light is <b>255</b> red, <b>half of 255</b> green (round up) and <b>0</b> blue. How much green?',a:128,work:['255 ÷ 2 = 127.5','Round up.'],after:'Yes! Orange light = (255, 128, 0).'};}
 const t=pickType(p,a,'fin',0),Q=question(t,'r','fin',R,ri,pk);
 return Object.assign({key,kind:'rainbow',slot:'c',type:t,name:'The rainbow',mix:{r:1,y:1,b:1},after:'Now paint the rainbow! Tap the 7 colors in order, from the outside in.'},Q);}
const plan=(p,a)=>SIZES(a.b).map((n,s)=>Array.from({length:n},(_,i)=>gen(p,a,s,i)));
function curPuzzle(p){const a=p.fade.a;if(!a)return null;const z=SIZES(a.b);if(a.s>=z.length)return null;return gen(p,a,a.s,a.i);}
/* primaries the current (and next) puzzle's bowl needs */
function needs(p){const a=p.fade.a;const z=SIZES(a.b),out={r:0,y:0,b:0};let s=a.s,i=a.i;
 for(let n=0;n<2&&s<z.length;n++){const pz=gen(p,a,s,i);if(pz.kind==='mix'||pz.kind==='slot')['r','y','b'].forEach(k=>out[k]+=pz.mix[k]||0);i++;if(i>=z[s]){s++;i=0;}}return out;}
const POT=['r','y','b'];
const pot=a=>{if(!Array.isArray(a.d))a.d=[0,0,0];return {r:a.d[0],y:a.d[1],b:a.d[2]};};
function potAdd(a,k,n){pot(a);const j=POT.indexOf(k);a.d[j]=Math.max(0,Math.min(POT_CAP,a.d[j]+n));}
function short(p,pz){const a=p.fade.a,pt=pot(a),o={};let any=false;POT.forEach(k=>{const n=(pz.mix[k]||0)-pt[k];if(n>0){o[k]=n;any=true;}});return any?o:null;}

/* ---------- world color: a grayscale layer above the game (the paint pot HUD and Prisma sit above it, in color) ---------- */
let OV=null,HUD=null,LAY=null,TW=null,CUR_L=null;
function ov(){if(!OV||!OV.isConnected){OV=document.getElementById('fdGray')||document.createElement('div');OV.id='fdGray';OV.setAttribute('aria-hidden','true');document.body.appendChild(OV);}return OV;}
function setGray(l){const o=ov();CUR_L=l;if(l<=0.001){o.style.display='none';return;}o.style.display='block';const f=`grayscale(${l.toFixed(3)})`;o.style.backdropFilter=f;o.style.webkitBackdropFilter=f;}
function tween(from,to,ms,done,clip){if(TW)cancelAnimationFrame(TW.id);if(RM()||ms<=0){setGray(to);if(clip)ov().style.clipPath='';TW=null;if(done)done();return;}
 const t0=performance.now();TW={id:0};const step=t=>{const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  if(clip){setGray(from);ov().style.clipPath=`inset(0 0 0 ${(e*100).toFixed(1)}%)`;}else setGray(from+(to-from)*e);
  if(k<1)TW.id=requestAnimationFrame(step);else{TW=null;if(clip){ov().style.clipPath='';setGray(to);}if(done)done();}};TW.id=requestAnimationFrame(step);}
const NO_GRAY=['profiles','create','fade','rest','parent','lock'];
function apply(){try{const p=me(),on=active(p),scr=cur();document.documentElement.classList.toggle('fd-faded',!!(on&&!NO_GRAY.includes(scr)));
 if(!TW){if(!on||NO_GRAY.includes(scr))setGray(0);else setGray(level(p));}
 hud(p,on&&!NO_GRAY.includes(scr)&&!DRAINING);}catch(e){}}
function hud(p,show){if(!show){if(HUD)HUD.style.display='none';return;}css();
 if(!HUD||!HUD.isConnected){HUD=document.createElement('button');HUD.id='fdHud';HUD.type='button';HUD.onclick=()=>{if(cur()==='battle'){say('🎨 Finish the battle first, then visit Prisma!');return;}open();};document.body.appendChild(HUD);}
 const a=p.fade.a,pt=pot(a),pz=curPuzzle(p),help=helpReady(p);
 HUD.style.display='';HUD.className='fd-hud'+(cur()==='battle'?' inb':'')+(help||(pz&&!short(p,pz))?' ready':'');
 HUD.setAttribute('aria-label',`Paint pot: ${pt.r} red, ${pt.y} yellow, ${pt.b} blue. Open Prisma's mixing table.`);
 if(cur()==='battle'){const ar=document.getElementById('arena');HUD.style.top=ar?Math.max(8,ar.getBoundingClientRect().top+10)+'px':'';HUD.style.bottom='';}else{HUD.style.top='';
  /* the World's walking pad sits bottom-left: park the pot just above it */
  const dp=document.querySelector('#app .dpad');const r=dp&&dp.offsetParent?dp.getBoundingClientRect():null;HUD.style.bottom=r&&r.height&&r.left<200?Math.round(innerHeight-r.top+8)+'px':'';}
 HUD.innerHTML=`<span class="fd-h7">🌈 <b>${colorsDone(p,a)}/7</b></span><span class="fd-hpot">🎨</span>${POT.map(k=>`<span class="fd-hd" data-k="${k}">${drop(k,15)}<b>${pt[k]}</b></span>`).join('')}${help?'<span class="fd-hbang">!</span>':''}`;}
/* a drop flies from the battle to the pot */
function flyDrop(k){try{if(!HUD||HUD.style.display==='none')return;const tgt=HUD.querySelector(`[data-k="${k}"]`)||HUD;const tr=tgt.getBoundingClientRect();
 const src=document.getElementById('arena')||document.querySelector('.qcard')||document.body;const sr=src.getBoundingClientRect();
 const d=document.createElement('div');d.className='fd-fly';d.innerHTML=drop(k,26);document.body.appendChild(d);
 const x0=sr.left+sr.width/2-13,y0=sr.top+Math.min(sr.height/2,160),x1=tr.left+tr.width/2-13,y1=tr.top+tr.height/2-16;
 if(RM()){d.remove();bump(tgt);return;}
 const an=d.animate([{transform:`translate(${x0}px,${y0}px) scale(.4)`,opacity:0},{transform:`translate(${x0}px,${y0-40}px) scale(1.25)`,opacity:1,offset:.25},{transform:`translate(${x1}px,${y1}px) scale(.7)`,opacity:1}],{duration:900,easing:'cubic-bezier(.4,.1,.3,1)'});
 an.onfinish=()=>{d.remove();bump(tgt);};}catch(e){}}
function bump(el){try{el.animate([{transform:'scale(1)'},{transform:'scale(1.35)'},{transform:'scale(1)'}],{duration:350});}catch(e){}}
function chip(html){try{const c=document.createElement('div');c.className='fd-chip';c.innerHTML=html;document.body.appendChild(c);setTimeout(()=>{c.classList.add('out');setTimeout(()=>c.remove(),500);},3400);}catch(e){}}

/* ---------- paint drops from battles ---------- */
let BT={r:0,y:0,b:0};
function giveDrop(p){const a=p.fade.a,pt=pot(a),nd=needs(p);const w=POT.map(k=>pt[k]>=POT_CAP?0:1+4*Math.max(0,nd[k]-pt[k]));const T=w.reduce((s,x)=>s+x,0);if(!T)return null;
 let r=Math.random()*T,k='r';for(let j=0;j<3;j++){r-=w[j];if(r<=0){k=POT[j];break;}}potAdd(a,k,1);return k;}

/* ---------- when does the Fade come? ---------- */
/* During the event every kid gets one: after their first battle win in the window, or ~25 s after they log in on the World
   screen (kids who have battled before). One Fade per kid per event (GAP is longer than the window). */
function picnicOn(){try{return !!(window.Truck&&Truck._dbg&&Truck._dbg.picnicInfo&&Truck._dbg.picnicInfo().active&&Truck.enabled&&Truck.enabled(me()));}catch(e){return false;}}
function whyNot(p,wins){const f=F(p),t=now();if(!enabled())return 'off';if(f.a)return 'active';if(!p.setup)return 'setup';if((wins==null?p.battles||0:wins)<FIRST_WINS)return 'wins';if(t<(f.n||0))return 'wait';
 if(picnicOn())return 'picnic';const tl=(p.troll&&p.troll.last)||0,el=(p.eagle&&p.eagle.last)||0;if(t-Math.max(tl,el)<VISIT_GAP)return 'visitor';return '';}
const CALM=['world','zone','map','quests','village','pethome','backpack']; /* hub screens: never drain the colors in the middle of a mini-game */
let PEND=null,PENDF=false,PEND_AT=0,DRAINING=false,CLAIM=false;
const VQ=()=>{const v=window.MQ_VISIT;return v&&typeof v.busy==='function'?v:null;};
function quiet(){try{if(window.trollBusy)return false;if(document.getElementById('isRoot')||document.getElementById('cvRoot'))return false;if(document.querySelector('#modal.show'))return false;
 const v=VQ();if(v&&v.busy('fade'))return false;if(typeof autoPopOK==='function'&&!autoPopOK())return false;return true;}catch(e){return true;}}
/* hold the visitor queue while the drain + Prisma's intro are on screen */
function claim(){const v=VQ();if(!v||CLAIM)return true;try{const r=v.claim('fade',15*60e3);if(r===false)return false;CLAIM=true;}catch(e){}return true;}
function release(){if(!CLAIM)return;CLAIM=false;try{const v=window.MQ_VISIT;if(v&&typeof v.release==='function')v.release('fade');}catch(e){}}
function tryFire(){const p=me();if(!PEND||!p||p.id!==PEND)return;if(now()<PEND_AT)return;const s=cur();if((PENDF?s==='battle'||NO_GRAY.includes(s):!CALM.includes(s))||LAY)return;if(!quiet())return;
 if(!PENDF&&whyNot(p)){PEND=null;return;}if(F(p).a){PEND=null;return;}if(!claim())return;PEND=null;PENDF=false;try{if(typeof autoPopUsed==='function')autoPopUsed();}catch(e){}start(p,true);}

/* ---------- start: the colors drain away ---------- */
function start(p,show){const f=F(p);if(f.a){release();return;}
 f.a={v:2,t:now(),sd:Math.floor(Math.random()*1e9),b:band(p.grade),s:0,i:0,d:[0,0,0]};sv();
 if(!show||p!==me()){release();apply();return;}
 DRAINING=true;css();hud(p,false);gobDash();
 whoosh();setTimeout(()=>say('Where did all the colors go?!'),600);
 tween(0,1,3000,()=>{DRAINING=false;apply();setTimeout(()=>{if(me()===p&&p.fade.a&&!p.fade.a.in)intro(0);else release();},700);});}
function whoosh(){for(let i=0;i<14;i++)tn(900-i*50,.22,'sine',.035,i*.1);tn(140,1.4,'triangle',.05,1.1);}
function trigger(p,o){p=p||me();if(!p)return false;o=o||{};if(!enabled()&&!o.force)return false;if(!o.force&&whyNot(p))return false;if(F(p).a)return false;
 if(p===me()&&cur()==='battle'){PEND=p.id;PENDF=!!o.force;PEND_AT=0;return true;}if(p===me())claim();start(p,p===me());return true;}

/* ---------- Prisma the Color Wizard ---------- */
const STR=[['r','#e03131'],['o','#fd7e14'],['y','#fcc419'],['g','#37b24d'],['b','#1c7ed6'],['i','#3b3fae'],['v','#9c5bd6']];
const GRY=c=>{const n=parseInt(c.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,l=Math.round(.3*r+.59*g+.11*b);return `rgb(${l},${l},${l})`;};
function prismaSVG(o){o=o||{};const u=++UID,on=o.on||{},gl=o.gray==null?1:o.gray,all=STR.every(([k])=>on[k]);
 const band=(k,c,j)=>`<rect x="14" y="${60+j*7.4}" width="52" height="8" fill="${on[k]?c:GRY(c)}"/>`;
 return `<svg class="fd-prisma ${all?'full':''}" viewBox="0 0 80 124" aria-hidden="true"><defs><clipPath id="fpc${u}"><path d="M22 112 L28 62 H52 L58 112Z"/></clipPath></defs>
 <ellipse cx="40" cy="118" rx="24" ry="4" fill="#0003"/>
 <g style="filter:grayscale(${gl})">
  <path d="M26 44 Q24 30 40 26 Q56 30 54 44 Q58 60 50 66 H30 Q22 60 26 44Z" fill="#c8a2f0"/>
  <path d="M40 2 L25 38 H55Z" fill="#6741d9" stroke="#2b2250" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 38 H58" stroke="#2b2250" stroke-width="4" stroke-linecap="round"/>
  <path d="M43 12 l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4Z" fill="#ffd43b"/>
  <circle cx="40" cy="50" r="11.5" fill="#ffd8a8" stroke="#2b2250" stroke-width="2.5"/>
  <circle cx="36" cy="49" r="1.8" fill="#2b2250"/><circle cx="44" cy="49" r="1.8" fill="#2b2250"/><path d="M36 55 Q40 ${gl>.6?56:58} 44 55" stroke="#2b2250" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="33" cy="53" r="2" fill="#ff8787" opacity=".5"/><circle cx="47" cy="53" r="2" fill="#ff8787" opacity=".5"/>
  <path d="M60 72 L71 56" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/>
 </g>
 <g clip-path="url(#fpc${u})">${STR.map(([k,c],j)=>band(k,c,j)).join('')}</g>
 <path d="M22 112 L28 62 H52 L58 112Z" fill="none" stroke="#2b2250" stroke-width="2.5" stroke-linejoin="round"/>
 <circle cx="72" cy="54" r="6" fill="${all?'#fff':'#dee2e6'}" stroke="#2b2250" stroke-width="2"/>${all?'<circle class="fd-orb" cx="72" cy="54" r="10" fill="none" stroke="#ffe066" stroke-width="2"/>':''}
 </svg>`;}
/* the Color Wheel: 7 slots, the rainbow in order (red at the top, clockwise); a rainbow in the middle when it's all done */
function wheelSVG(p,a,sz,hl){const done=doneSlots(p,a);const R=52,arc=(a0,a1,r0,r1)=>{const P=(ang,r)=>[(r*Math.cos(ang)).toFixed(2),(r*Math.sin(ang)).toFixed(2)];const[x0,y0]=P(a0,r1),[x1,y1]=P(a1,r1),[x2,y2]=P(a1,r0),[x3,y3]=P(a0,r0);return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;};
 const W=2*Math.PI/7;const seg=(k,j)=>{const a0=-Math.PI/2-W/2+j*W,d=arc(a0,a0+W,15,R),m=done[k]?RECIPE[k]:null,on=!!m;const mid=a0+W/2,lx=(R+7)*Math.cos(mid),ly=(R+7)*Math.sin(mid);
  return `<g data-slot="${k}"><path class="fd-sf" d="${d}" fill="${on?mixHex(m):'#f1f3f5'}" stroke="#2b2250" stroke-width="${on?2:1.5}" ${on?'':'stroke-dasharray="4 3"'}/><g class="fd-sp" opacity="${on?.8:0}">${on?pats(m).replace(/<rect width="100%" height="100%"/g,`<path d="${d}"`):''}</g>${hl===k?`<path class="fd-hlp" d="${d}" fill="none" stroke="#fab005" stroke-width="4" stroke-linejoin="round"/>`:''}<text x="${lx.toFixed(1)}" y="${(ly+3).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="800" fill="${on?'#2b2250':'#adb5bd'}">${CNAME[k][0].toUpperCase()}</text></g>`;};
 const c=done.c;return `<svg class="fd-wheel" viewBox="-66 -66 132 132" width="${sz}" height="${sz}" aria-hidden="true"><circle r="63" fill="#fff" opacity=".85"/>${SEVEN.map(seg).join('')}<circle r="15" fill="${c?'#fff':'#f8f9fa'}" stroke="#2b2250" stroke-width="2"/>${c?'<text y="6" text-anchor="middle" font-size="18">🌈</text>':''}</svg>`;}
function doneSlots(p,a){const o={};if(!a){SEVEN.forEach(k=>o[k]=1);o.c=1;return o;}const z=SIZES(a.b);for(let s=0;s<z.length;s++)for(let i=0;i<z[s];i++){if(s>a.s||(s===a.s&&i>=a.i))continue;if(s===0)o[['r','y','b'][i]]=1;else if(s===1)o[MIX_ORDER[i]]=1;else if(i===z[s]-1)o.c=1;}
 return o;}
const colorsDone=(p,a)=>{const d=doneSlots(p,a);return SEVEN.filter(k=>d[k]).length;};
function stripesOn(p,a){const d=doneSlots(p,a),o={};SEVEN.forEach(k=>{if(d[k])o[k]=1;});return o;}
const ALL7=()=>{const o={};SEVEN.forEach(k=>o[k]=1);return o;};
/* the 7-color checklist */
function checklist(p,a){const d=doneSlots(p,a),n=SEVEN.filter(k=>d[k]).length;return `<div class="fd-check"><div class="fd-cnt">🌈 <b>${n} of 7</b> colors</div><div class="fd-chips">${SEVEN.map(k=>`<span class="fd-chip7 ${d[k]?'on':''}">${swatch(RECIPE[k],16)}${Cap(CNAME[k])}${d[k]?' ✓':''}</span>`).join('')}</div></div>`;}
/* the village (the world, as Prisma's window shows it) */
function villageSVG(){return `<svg class="fd-vil" viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
 <defs><linearGradient id="fdsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#74c0fc"/><stop offset="1" stop-color="#d0ebff"/></linearGradient></defs>
 <rect width="400" height="170" fill="url(#fdsky)"/><circle cx="345" cy="34" r="17" fill="#ffd43b"/><circle cx="345" cy="34" r="25" fill="#ffd43b" opacity=".25"/>
 <g fill="#fff" opacity=".9"><ellipse cx="80" cy="30" rx="26" ry="9"/><ellipse cx="100" cy="24" rx="16" ry="9"/><ellipse cx="240" cy="42" rx="20" ry="7"/></g>
 <path d="M0 100 Q90 70 190 92 T400 86 V170 H0Z" fill="#8ce99a"/><path d="M0 128 Q120 108 230 124 T400 118 V170 H0Z" fill="#51cf66"/>
 <path d="M34 104 L70 60 L106 104Z" fill="#fa5252" stroke="#2b2250" stroke-width="2"/><rect x="46" y="104" width="48" height="30" fill="#ffe8cc" stroke="#2b2250" stroke-width="2"/><rect x="63" y="114" width="14" height="20" fill="#845ef7" stroke="#2b2250" stroke-width="1.5"/>
 <rect x="150" y="84" width="44" height="34" fill="#ffd8a8" stroke="#2b2250" stroke-width="2"/><path d="M144 86 L172 62 L200 86Z" fill="#7048e8" stroke="#2b2250" stroke-width="2"/><rect x="160" y="94" width="10" height="10" fill="#74c0fc" stroke="#2b2250" stroke-width="1.5"/>
 <rect x="266" y="104" width="8" height="24" fill="#8a5a2b"/><circle cx="270" cy="92" r="22" fill="#40c057" stroke="#2b2250" stroke-width="2"/><circle cx="262" cy="86" r="3" fill="#fa5252"/><circle cx="278" cy="96" r="3" fill="#fa5252"/><circle cx="270" cy="80" r="3" fill="#fa5252"/>
 <path d="M296 170 Q320 140 350 150 T400 140 V170Z" fill="#339af0"/><path d="M310 162 q10 -5 20 0" stroke="#d0ebff" stroke-width="2" fill="none"/>
 <g>${[[20,150,'#f06595'],[120,150,'#ffd43b'],[210,148,'#ff922b'],[240,156,'#cc5de8'],[135,160,'#fa5252']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="5" fill="${c}" stroke="#2b2250" stroke-width="1"/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff3bf"/>`).join('')}</g>
 <g transform="translate(372,78)"><ellipse rx="11" ry="13" fill="#ff6b6b" stroke="#2b2250" stroke-width="1.5"/><path d="M0 13 V32" stroke="#2b2250" stroke-width="1"/></g>
 <text x="100" y="152" font-size="22">🦊</text><text x="200" y="140" font-size="20">🐢</text></svg>`;}

/* the Grey Goblin: doesn't like color, so he grabs it and hides it (original character) */
function goblinSVG(o){o=o||{};const sad=!!o.soft;return `<svg class="fd-goblin" viewBox="0 0 110 120" width="${o.w||96}" aria-hidden="true">
<ellipse cx="52" cy="116" rx="30" ry="4" fill="rgba(0,0,0,.2)"/>
<g transform="translate(80 70) rotate(12)"><path d="M-20 0 Q-24 32 0 36 Q24 32 20 0 Q10 -8 0 -6 Q-10 -8 -20 0Z" fill="#8d8f96" stroke="#4a4c52" stroke-width="2.5"/><path d="M-10 -6 Q0 -14 10 -6" stroke="#4a4c52" stroke-width="3" fill="none"/>
<circle cx="-8" cy="-9" r="4" fill="#ff6b6b"/><circle cx="1" cy="-12" r="4" fill="#ffd43b"/><circle cx="9" cy="-9" r="4" fill="#4dabf7"/><circle cx="-2" cy="14" r="2.4" fill="#6b6d73"/><circle cx="7" cy="20" r="2" fill="#6b6d73"/></g>
<path d="M34 72 Q52 64 70 72 L74 108 Q52 114 30 108Z" fill="#6b6d73" stroke="#4a4c52" stroke-width="2.5"/>
<path d="M38 108 L36 116 M66 108 L68 116" stroke="#4a4c52" stroke-width="6" stroke-linecap="round"/>
<path d="M70 80 Q80 76 78 66" stroke="#9a9ca3" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M34 80 Q24 88 28 96" stroke="#9a9ca3" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M22 34 L4 22 L24 46Z" fill="#9a9ca3" stroke="#4a4c52" stroke-width="2.5" stroke-linejoin="round"/><path d="M82 34 L100 22 L80 46Z" fill="#9a9ca3" stroke="#4a4c52" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="52" cy="44" rx="30" ry="26" fill="#a9abb2" stroke="#4a4c52" stroke-width="2.5"/>
<path d="M36 34 L48 38 M68 34 L56 38" stroke="#3b3d42" stroke-width="3.5" stroke-linecap="round"/>
<circle cx="43" cy="42" r="4.5" fill="#fff"/><circle cx="61" cy="42" r="4.5" fill="#fff"/><circle cx="44" cy="43" r="2.2" fill="#2b2d31"/><circle cx="60" cy="43" r="2.2" fill="#2b2d31"/>
<path d="M52 44 Q58 52 52 56 Q47 54 49 50" fill="#8d8f96" stroke="#4a4c52" stroke-width="2"/>
<path d="${sad?'M42 62 Q52 67 62 62':'M42 64 Q52 58 62 64'}" stroke="#3b3d42" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M30 26 Q40 14 52 18 Q64 12 74 26" stroke="#7d7f86" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;}
/* the Grey Goblin dashes across the screen with his sack while the color drains */
function gobDash(){try{if(RM())return;const d=document.createElement('div');d.className='fd-dash';d.innerHTML=goblinSVG({w:110})+'<div class="fd-hehe">Hee hee! No more color!</div>';document.body.appendChild(d);
 const a=d.animate([{transform:'translateX(-30vw)'},{transform:'translateX(40vw)',offset:.45},{transform:'translateX(45vw) translateY(-6px)',offset:.55},{transform:'translateX(130vw)'}],{duration:3000,easing:'ease-in-out'});a.onfinish=()=>d.remove();setTimeout(()=>{try{d.remove();}catch(e){}},3600);}catch(e){}}
/* ---------- the layer above the gray (Prisma's popups, celebrations) ---------- */
function layer(html,cls){dropLayer();css();LAY=document.createElement('div');LAY.id='fdLay';LAY.className=cls||'';LAY.innerHTML=html;document.body.appendChild(LAY);return LAY;}
function dropLayer(){if(LAY){LAY.remove();LAY=null;}const l=document.getElementById('fdLay');if(l)l.remove();}
function closeLayer(){dropLayer();release();}
const INTRO=[
 {t:'Oh no! The Grey Goblin!',b:'The <b>Grey Goblin</b> doesn\'t like color one bit. He snatched every color from your world and <b>hid them</b>. Even mine! I\'m <b>Prisma</b>, the Color Wizard.'},
 {t:'Fill all 7 colors',b:'To bring the colors back to your world, we need to fill all <b>7 colors of the rainbow</b> on my <b>Color Wheel</b>.'},
 {t:'Free paint, hidden paint',b:'Your world is already black and white, so I\'ll give you <b>white and black</b> paint for free. The Grey Goblin hid the <b>3 primary colors</b> (red, yellow, blue) inside the monsters! <b>Win battles</b> to find them. Every right answer can drop some paint!'},
 {t:'Then we mix!',b:'Then we\'ll <b>MIX</b> the other 4: <b>orange, green, indigo and violet</b>.'}];
const NI=INTRO.length;
const RECIPE_LINE=c=>`<div class="fd-recl">${PARTS[c].map(k=>drop(k,22)).join('<b class="fd-plus">+</b>')}<b class="fd-plus">=</b>${swatch(RECIPE[c],26)}<b>${Cap(CNAME[c])}</b></div>`;
function introCard(pg,inPage){const p=me(),a=p.fade.a,it=INTRO[pg];
 const art=pg===0?`${goblinSVG({w:92})}${prismaSVG({gray:1})}`:pg===1?`<div class="fd-col">${wheelSVG(p,a,150)}${checklist(p,a)}</div>`
  :pg===2?`<div class="fd-col"><div class="fd-trio"><div>${drop('w',40)}<small>white · free</small></div><div>${drop('k',40)}<small>black · free</small></div></div><div class="fd-trio">${POT.map(k=>`<div>${drop(k,40)}<small>${PRIM[k].n}</small></div>`).join('')}</div><div class="fd-note">I saved ${STARTER} of each for you to start 🎨</div></div>`
  :`<div class="fd-col fd-recipes">${MIX_ORDER.map(RECIPE_LINE).join('')}</div>`;
 const btn=pg<NI-1?`<button class="btn green big" onclick="Fade._intro(${pg+1},${inPage?1:0})">Next ➜</button>`:`<button class="btn gold big" onclick="Fade._introDone(1)">🎨 Let's start!</button>${inPage?'':'<button class="btn ghost dark" onclick="Fade._introDone(0)">Later, I\'ll battle first</button>'}`;
 return `<div class="fd-card fd-intro"><div class="fd-art">${art}</div><div data-spk="intro"><h2>${it.t}</h2><p class="fd-big">${it.b} ${SPK}</p></div><div class="fd-dots">${INTRO.map((_,j)=>`<i class="${j===pg?'on':''}"></i>`).join('')}</div><div class="row">${btn}</div></div>`;}
function intro(pg){layer(introCard(pg,false),'dim');snd('tap');}

/* ---------- the mixing table (screen 'fade') ---------- */
let UI={key:null},RET='world',LAST='world';
function resetUI(key){UI={key,ph:'q',inp:'',miss:0,hint:0,bowl:{r:0,y:0,b:0,w:0,k:0},shown:null,mm:0,fb:'',rb:0,rbm:0};}
const STAGES=b=>[{n:'Win back the primaries',t:'Red, yellow and blue are the <b>primary</b> colors. Nobody can mix them, so you won them in battles. Pour each one into its slot on my <b>Color Wheel</b>!'},
 {n:'Mix the other 4',t:'Mix two colors to make a new one! <b>Indigo</b> is blue with a little <b>black</b>. <b>Violet</b> is red and blue with a little <b>white</b>.'},
 {n:'The Rainbow Bridge',t:'All 7 colors are on the Color Wheel! Put them back in the rainbow and the Grey Goblin\'s trick is undone!'}];
function helpReady(p){const a=p&&p.fade&&p.fade.a;if(!a||!a.in)return false;const z=SIZES(a.b);if(a.s>=z.length)return false;return now()-Math.max(a.t,a.hp||0)>=HELP_DAYS*DAY;}
function page(p,inner){let tb='';try{tb=typeof topbar==='function'?topbar():'';}catch(e){tb='';}
 const app=document.getElementById('app');app.innerHTML=`<div class="fd-tb">${tb}</div><div class="page fd"><div class="zhead"><button class="btn ghost small" onclick="Fade._back()">← Back</button><h2 class="title">🎨 Prisma's Mixing Table</h2></div>${inner}</div>`;
 const t=app.querySelector('.fd-tb');if(t)t.style.filter=`grayscale(${active(p)?level(p).toFixed(2):0})`;}
function draw(){const p=me();if(!p){goTo('profiles');return;}css();const f=F(p),a=f.a;
 if(!a||!enabled())return drawCalm(p,f);
 if(!a.in){page(p,`<div class="fd-solo">${introCard(UI.ipg||0,true)}</div>`);return;}
 const z=SIZES(a.b);const over=a.s>=z.length;if(over&&!(UI.ph==='solved'&&UI.solved)){finish(p);return;}
 const helper=UI.key==='help',done=UI.ph==='solved'&&UI.solved;const pz=over||done?UI.solved:helper?gen(p,a,a.s,0,true):curPuzzle(p);if(!over&&!done&&UI.key!==pz.key)resetUI(pz.key);
 const L=level(p),st=STAGES(a.b)[Math.min(a.s,z.length-1)],pt=pot(a);
 const scene=`<div class="fd-scene"><div class="fd-win" style="filter:grayscale(${L.toFixed(3)})">${villageSVG()}</div><div class="fd-pr">${prismaSVG({gray:Math.min(1,L*1.1),on:stripesOn(p,a)})}</div><div class="fd-wh">${wheelSVG(p,a,108)}</div>
  <div class="fd-prog"><b>Stage ${Math.min(a.s+1,z.length)} of ${z.length}</b> · ${st.n}<div class="fd-bar"><i style="width:${Math.round((1-L)*100)}%"></i></div><small>${Math.round((1-L)*100)}% of the color is back · ${over?'every puzzle solved!':`puzzle ${totalDone(a)+1} of ${z.reduce((s,n)=>s+n,0)}`}</small></div></div>
  ${checklist(p,a)}<div class="fd-pot"><span>🎨 Paint pot</span>${POT.map(k=>`<span class="fd-pc">${drop(k,20)}<b>${pt[k]}</b> <small>${PRIM[k].n}</small></span>`).join('')}</div>`;
 page(p,`<div class="fd-grid"><div class="fd-left">${scene}</div><div class="fd-right">${puzzleHTML(p,a,pz,st)}</div></div>`);
 autoRead(p,pz);
 /* phones: the table stacks (scene, then puzzle), so bring each new puzzle up into view */
 const pk=over||done?null:(helper?'help':pz.key);if(pk&&pk!==LASTPZ){LASTPZ=pk;try{if(innerWidth<820)setTimeout(()=>{const c=document.querySelector('.fd-right .fd-pz');if(c&&cur()==='fade'){const y=c.getBoundingClientRect().top+scrollY-64;if(y>scrollY+40)scrollTo({top:y,behavior:RM()?'auto':'smooth'});}},450);}catch(e){}}
 if(UI.fx){const fx=UI.fx;UI.fx=null;setTimeout(()=>fxAfter(fx),30);}}
function autoRead(p,pz){try{if(!youngR(p)||!voiceOK()||!pz)return;const ph=UI.ph,k=(UI.key||pz.key)+'|'+ph;if(k===SPOKE||(ph!=='q'&&ph!=='mix'))return;const sel=ph==='q'?'[data-spk="q"]':'[data-spk="mix"]';if(!document.querySelector(sel))return;SPOKE=k;setTimeout(()=>{if(UI.ph===ph&&cur()==='fade'&&!LAY)speakEl(document.querySelector(sel));},400);}catch(e){}}
function drawCalm(p,f){const n=f.c||0;
 page(p,`<div class="fd-solo"><div class="fd-card"><div class="fd-art">${prismaSVG({gray:0,on:ALL7()})}</div><h2>${n?'Your world is full of color!':'All quiet here'}</h2>
 <p class="fd-big">${n?`You have beaten the Grey Goblin <b>${n}</b> time${n>1?'s':''}. Prisma will call if he ever sneaks back!`:'Prisma is resting. If the colors ever disappear, come find her here!'}</p>
 ${f.sp?`<p>🎨 Rare paint splotches: <b>${f.sp}</b></p>`:''}<div class="row"><button class="btn green big" onclick="Fade._back()">OK</button></div></div></div>`);}
function puzzleHTML(p,a,pz,st){
 const helper=pz.kind==='help';
 if(!helper&&UI.ph==='q'){const sh=short(p,pz);if(sh&&(pz.kind==='mix'||pz.kind==='slot'))return needHTML(p,a,pz,sh);}
 const tgt=pz.kind==='slot'?`<div class="fd-tgt">${swatch(pz.mix,64)}<div><small>Primary color · won in battles</small><b>${E(pz.name)}</b><div class="fd-rec"><span class="fd-prim">${drop(pz.k,18)} a primary color</span></div></div></div>`
  :pz.kind==='rainbow'?`<div class="fd-tgt">${rainbowSVG(7,64)}<div><small>Finale</small><b>The Rainbow Bridge</b></div></div>`
  :pz.kind==='light'?`<div class="fd-tgt"><div class="fd-lsw" style="background:rgb(${pz.light.join(',')})"></div><div><small>${pz.bonus?'⭐ Bonus puzzle (you can skip it)':'Prisma\'s secret'}</small><b>${pz.ink?'Light and ink':'Mixing light'}</b></div></div>`
  :helper?`<div class="fd-tgt"><div class="fd-lsw fd-rbw"></div><div><small>Helper puzzle</small><b>Prisma's secret paint</b></div></div>`
  :`<div class="fd-tgt">${swatch(pz.mix,64)}<div><small>Target color</small><b>${E(pz.name)}</b><div class="fd-rec">${recipeHTML(pz.ratio||pz.mix,':')}</div></div></div>`;
 const lead=helper?`<div class="fd-help">🎁 You've been busy! Solve this <b>easy</b> one and I'll use my secret paint to finish <b>this whole stage</b>.</div>`:(UI.ph==='q'&&helpReady(p)?`<div class="fd-help">🎁 It's been a few days! Want an <b>easy helper puzzle</b> instead? I'll finish this whole stage with my secret paint.<div class="row" style="margin-top:6px"><button class="btn gold small" onclick="Fade._helper()">Yes please!</button></div></div>`:'')+(!helper&&a.i===0&&UI.ph==='q'?`<div class="fd-say">${st.t}</div>`:'');
 let body='';
 if(UI.ph==='q'&&pz.mc){body=`<div data-spk="q"><div class="fd-q">${pz.q}${SPK}</div>
  <div class="fd-mc ${pz.mc.some(x=>x.length>60)?'pics':''}">${pz.mc.map((o,j)=>`<button class="fd-mco ${(UI.bad||[]).includes(j)?'bad':''}" ${(UI.bad||[]).includes(j)?'disabled':''} data-i="${j}" onclick="Fade._mc(${j})"><span class="fd-mcl">${'ABC'[j]}</span>${o}</button>`).join('')}</div></div>
  ${UI.hint?`<div class="fd-work"><b>Let's work it out:</b><ol>${pz.work.slice(0,UI.hint).map(s=>`<li>${s}</li>`).join('')}</ol></div>`:''}
  ${UI.miss===1?'<div class="fd-fb no">Not quite! Try again. 💪</div>':''}
  ${UI.hint<pz.work.length?`<div class="row" style="margin-top:6px"><button class="btn ghost dark small" onclick="Fade._hint()">💡 Work it out with me</button></div>`:''}${pz.bonus?BONUS_SKIP:''}`;}
 else if(UI.ph==='q'){body=`<div class="fd-q" data-spk="q">${pz.q}${SPK}</div>
  <div class="fd-ans ${UI.shake?'no':''}" aria-live="polite">${UI.inp?E(UI.inp):'<span>?</span>'}</div>
  ${UI.hint?`<div class="fd-work"><b>Let's work it out:</b><ol>${pz.work.slice(0,UI.hint).map(s=>`<li>${s}</li>`).join('')}</ol></div>`:''}
  ${UI.miss===1?'<div class="fd-fb no">Not quite! Try again. 💪</div>':''}
  <div class="fd-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="Fade._k('${n}')">${n}</button>`).join('')}<button class="del" onclick="Fade._k('del')" aria-label="Delete">⌫</button><button onclick="Fade._k('0')">0</button><button class="go" onclick="Fade._k('go')" aria-label="Check">✓</button></div>
  ${UI.hint<pz.work.length?`<div class="row" style="margin-top:6px"><button class="btn ghost dark small" onclick="Fade._hint()">💡 Work it out with me</button></div>`:''}${pz.bonus?BONUS_SKIP:''}`;}
 else if(UI.ph==='shown'){body=`<div class="fd-q">${pz.q}</div><div class="fd-work"><b>Here's how:</b><ol>${pz.work.map(s=>`<li>${s}</li>`).join('')}</ol><div class="fd-reveal">The answer is <b class="fd-revv">${pz.mc?pz.mc[pz.a]:pz.a}</b>.</div></div><div class="row"><button class="btn green big" onclick="Fade._cont()">Got it ➜</button></div>`;}
 else if(UI.ph==='mix'){body=mixHTML(p,a,pz);}
 else if(UI.ph==='light'){body=lightHTML(pz);}
 else if(UI.ph==='rainbow'){body=rbHTML();}
 else if(UI.ph==='solved'){body=solvedHTML(p,a,pz);}
 return `<div class="fd-card fd-pz">${tgt}${lead}${body}</div>`;}
function needHTML(p,a,pz,sh){const help=helpReady(p),secret=pz.kind==='slot'; /* don't give away the answer: there the drop count IS the answer */
 return `<div class="fd-card fd-pz"><div class="fd-tgt">${swatch(pz.mix,64)}<div><small>Next color</small><b>${E(pz.name)}</b><div class="fd-rec">${pz.kind==='slot'?`<span class="fd-prim">${drop(pz.k,18)} a primary color</span>`:recipeHTML(pz.ratio||pz.mix,pz.ratio?':':'+')}</div></div></div>
 <div class="fd-need" data-spk="need"><div class="fd-say">We need a little more paint for ${E(pz.name.toLowerCase())}: ${SPK}</div><div class="fd-needs">${POT.filter(k=>sh[k]).map(k=>`<span>${drop(k,26)} ${secret?'':`<b>${sh[k]}</b> `}more ${PRIM[k].n}</span>`).join('')}</div>
 <p>Win a few battles to collect more paint! Every right answer can drop a paint drop. 🎨</p></div>
 ${help?`<div class="fd-help">🎁 It's been a few days! Want an <b>easy helper puzzle</b>? Solve it and I'll finish this stage with my secret paint.<div class="row"><button class="btn gold" onclick="Fade._helper()">Yes please!</button></div></div>`:''}
 <div class="row"><button class="btn green big" onclick="Fade._back()">⚔️ Go collect paint</button></div></div>`;}
const BONUS_SKIP=`<div class="row" style="margin-top:6px"><button class="btn ghost dark small fd-skip" onclick="Fade._skip()">Skip the bonus ➜</button></div>`;
const phaseAfter=pz=>pz.kind==='mix'||pz.kind==='slot'?'mix':pz.kind==='light'?'light':pz.kind==='rainbow'?'rainbow':'solved';
function curPz(p){return UI.key==='help'?gen(p,p.fade.a,p.fade.a.s,0,true):curPuzzle(p);}
function mcTap(j){const p=me();if(!p||!p.fade.a||UI.ph!=='q')return;const pz=curPz(p);if(!pz.mc)return;
 if(j===pz.a){snd('correct');UI.fb='';UI.ph=phaseAfter(pz);if(UI.ph==='solved')return solve(p,pz);return redraw();}
 UI.miss++;snd('wrong');UI.bad=(UI.bad||[]).concat(j);if(UI.miss>=2)UI.ph='shown';else UI.hint=Math.max(UI.hint,1);redraw();}
/* keypad */
function key(k){const p=me();if(!p||!p.fade.a)return;const pz=curPz(p);if(UI.ph!=='q'||pz.mc)return;
 if(k==='del'){UI.inp=UI.inp.slice(0,-1);UI.shake=0;snd('tap');return redraw();}
 if(k==='go'){if(!UI.inp)return;const v=parseInt(UI.inp,10);
  if(v===pz.a){snd('correct');UI.fb='';UI.shake=0;UI.ph=phaseAfter(pz);if(UI.ph==='solved')return solve(p,pz);return redraw();}
  UI.miss++;snd('wrong');UI.inp='';UI.shake=1;if(UI.miss>=2){UI.ph='shown';}else UI.hint=Math.max(UI.hint,1);return redraw();}
 if(UI.inp.length<4){UI.inp=UI.inp==='0'?k:UI.inp+k;UI.shake=0;snd('tap');redraw();}}
function redraw(){const y=window.scrollY;draw();try{window.scrollTo(0,y);}catch(e){}}
/* the bowl */
/* the mixing table: droppers with one mark per drop, and a measuring bowl of Prisma's magic mixing water */
const WATER=[223,241,251],JAR_EXTRA=20; /* white/black come from Prisma's jars: refilled for every puzzle */
const bowlCap=pz=>{const T=KEYS.reduce((s,k)=>s+(pz.mix[k]||0),0);return Math.max(4,Math.ceil(T/.75));};
const bowlN=b=>KEYS.reduce((s,k)=>s+(b[k]||0),0);
function jarsOf(a,pz){return pz.kind==='slot'?[pz.k]:['r','y','b','w','k'];}
function supply(a,pz,k){if(k==='w'||k==='k')return Math.max(JAR_EXTRA,(pz.mix[k]||0)+8);return pot(a)[k];}
/* bottle geometry: one tick per drop; a taller bottle above 20 drops */
function bgeo(full){const cap=Math.max(10,Math.min(30,full)),H=cap>20?170:128,yt=34,yb=H-10;return {cap,H,yt,yb,step:(yb-yt)/cap};}
function bottleSVG(k,full,left){const g=bgeo(full),c=PRIM[k],id='fdbt'+k+(++UID);const dark=k==='w'?'#ced4da':k==='k'?'#000':c.hex;
 let ticks='';for(let i=1;i<=g.cap;i++){const y=(g.yb-i*g.step).toFixed(1),big=i%5===0;ticks+=`<line x1="${big?1:5}" x2="11" y1="${y}" y2="${y}" stroke="#2b2250" stroke-opacity="${big?.8:.5}" stroke-width="${big?1.5:1}"/>`;}
 return `<svg class="fd-btl" viewBox="0 0 50 ${g.H}" width="50" height="${g.H}" aria-hidden="true"><clipPath id="${id}"><rect x="13" y="${g.yt-2}" width="28" height="${g.yb-g.yt+6}" rx="7"/></clipPath>
 <ellipse cx="27" cy="10" rx="9" ry="9" fill="${dark}" stroke="#2b2250" stroke-width="2"/><rect x="22" y="16" width="10" height="14" fill="#dee2e6" stroke="#2b2250" stroke-width="2"/>
 <rect x="13" y="${g.yt-2}" width="28" height="${g.yb-g.yt+6}" rx="7" fill="${k==='w'?'#d5dbe3':'#eef1f5'}"/>
 <g clip-path="url(#${id})"><g class="fd-liq" data-step="${g.step}" data-cap="${g.cap}" style="transform:translateY(${((g.cap-Math.min(left,g.cap))*g.step).toFixed(2)}px)"><rect x="0" y="${g.yt}" width="50" height="${g.H}" fill="${c.hex}"/><rect x="0" y="${g.yt}" width="50" height="${g.H}" fill="url(#fdp-${k})"/><rect x="0" y="${g.yt-1}" width="50" height="2" fill="#2b2250" opacity=".45"/></g></g>
 ${ticks}<rect x="34" y="${g.yt+4}" width="3" height="${g.yb-g.yt-8}" rx="1.5" fill="#fff" opacity=".6"/>
 <rect x="13" y="${g.yt-2}" width="28" height="${g.yb-g.yt+6}" rx="7" fill="none" stroke="#2b2250" stroke-width="2.2"/></svg>`;}
/* bowl geometry (viewBox 0 0 200 150): the water sits 8 units deep; each drop adds 92/cap */
const BW={bot:128,base:8,span:92};
const bLevel=(n,cap)=>BW.base+Math.min(n,cap)/cap*BW.span;
function bowlColor(b){const n=bowlN(b);if(!n)return hex(WATER);const c=mixRGB(b),t=n/(n+.6);return hex(c.map((v,i)=>Math.round(WATER[i]*(1-t)+v*t)));}
function bowlSVG(b,cap){const n=bowlN(b),h=bLevel(n,cap);let ticks='';const every=cap>24?5:1;
 for(let i=every;i<=cap;i+=every){const y=(BW.bot-bLevel(i,cap)).toFixed(1),big=i%5===0;ticks+=`<line x1="${big?168:173}" x2="182" y1="${y}" y2="${y}" stroke="#2b2250" stroke-opacity="${big?.75:.4}" stroke-width="${big?1.6:1}"/>${big?`<text x="186" y="${(+y+3).toFixed(1)}" font-size="9" fill="#6f6499" font-weight="700">${i}</text>`:''}`;}
 return `<svg class="fd-bowl" viewBox="0 0 200 150" aria-hidden="true"><defs><clipPath id="fdbc"><path d="M22 26 H178 L166 124 Q100 140 34 124 Z"/></clipPath></defs>
 <path d="M22 26 H178 L166 124 Q100 140 34 124 Z" fill="#fbfdff"/>
 <g clip-path="url(#fdbc)"><g class="fd-bliq" style="transform:translateY(${(100-h).toFixed(2)}px)"><rect class="fd-bfill" x="0" y="28" width="200" height="130" fill="${bowlColor(b)}"/><g class="fd-bpat" opacity=".8">${pats(b).replace(/width="100%" height="100%"/g,'x="0" y="28" width="200" height="130"')}</g>
  <ellipse cx="100" cy="28" rx="84" ry="4" fill="#fff" opacity=".55"/><g class="fd-sparkle"><circle cx="60" cy="33" r="1.8" fill="#fff"/><circle cx="118" cy="31" r="1.4" fill="#fff"/><circle cx="150" cy="34" r="1.6" fill="#fff"/></g>
  <ellipse class="fd-ripple" cx="100" cy="28" rx="10" ry="2.5" fill="none" stroke="#fff" stroke-width="1.5" opacity="0"/></g></g>
 ${ticks}<path d="M22 26 H178 L166 124 Q100 140 34 124 Z" fill="none" stroke="#2b2250" stroke-width="3" stroke-linejoin="round"/><path d="M34 34 L42 112" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
 <rect x="14" y="20" width="172" height="8" rx="4" fill="#fff" stroke="#2b2250" stroke-width="3"/></svg>`;}
function bowlLabel(b){const n=bowlN(b);return n?`${KEYS.filter(k=>b[k]).map(k=>`${b[k]} ${PRIM[k].n}`).join(' + ')} <span class="fd-muted">· ${n} drop${n>1?'s':''} in the mixing bowl</span>`:'✨ Prisma\'s <b>magic mixing water</b>: clear until paint drops in';}
const SLN=CNAME;
const slotName=pz=>SLN[pz.slot]||pz.name.replace(/\s*\(.*\)/,'').toLowerCase();
function sayMix(pz){const sn=slotName(pz);if(pz.kind==='slot'){const n=pz.mix[pz.k];return `Put <b>${n}</b> ${cw(pz.k)} drop${n>1?'s':''} in the <b>mixing bowl</b>, then pour ${n>1?'them':'it'} into the <b>${sn} slot</b> on my <b>Color Wheel</b>.`;}
 const m=pz.mix;return `${pz.kind==='mix'?'Now put '+KEYS.filter(k=>m[k]).map(k=>`<b>${m[k]}</b> ${PRIM[k].n}`).join(' + ')+' in the <b>mixing bowl</b>':(pz.after||'Mix it in the mixing bowl!')}, then pour it into the <b>${sn} slot</b> on my <b>Color Wheel</b>.${pz.slot==='v'?' (The white makes it violet, not dark purple!)':pz.slot==='i'?' (A little black makes a deep indigo blue!)':''}`;}
const ARROW=`<svg class="fd-arrow" viewBox="0 0 40 60" aria-hidden="true"><path d="M2 40 Q20 6 34 24" fill="none" stroke="#7c5cff" stroke-width="3.5" stroke-dasharray="6 5" stroke-linecap="round"/><path d="M27 21 L36 27 L37 16" fill="none" stroke="#7c5cff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function mixHTML(p,a,pz){const bw=UI.bowl,sh=UI.shown||(UI.shown=Object.assign({},bw)),slot=pz.kind==='slot',cap=bowlCap(pz);const has=bowlN(bw)>0;
 const jars=jarsOf(a,pz),T=bowlN(pz.mix),sn=slotName(pz),Sn=sn[0].toUpperCase()+sn.slice(1);
 return `<div class="fd-say" data-spk="mix">${sayMix(pz)}${SPK}</div>
 <div class="fd-mixrow"><div class="fd-bowlw">${bowlSVG(sh,cap)}<small class="fd-blab">${bowlLabel(sh)}</small></div>${ARROW}
  <div class="fd-wheelw">${wheelSVG(p,a,130,pz.slot)}<small class="fd-slab"><b>${Sn} slot</b><br>${slot?`needs ${pz.mix[pz.k]} drop${pz.mix[pz.k]>1?'s':''}`:`needs ${E(pz.name.toLowerCase())}`}</small></div></div>
 <div class="fd-jars">${jars.map(k=>{const full=supply(a,pz,k),left=full-bw[k],dis=left<=0;const nm=PRIM[k].n[0].toUpperCase()+PRIM[k].n.slice(1);
  return `<div class="fd-jarw" data-jar="${k}"><button class="fd-jar ${dis?'off':''}" ${dis?'disabled':''} onclick="Fade._add('${k}')" aria-label="Add a ${PRIM[k].n} drop">${bottleSVG(k,full,left)}<span class="fd-jn">${left}</span><b>${nm}</b><small>${k==='w'||k==='k'?'Prisma\'s jar':'tap = 1 drop'}</small></button>${T>10&&full>10?`<button class="fd-pour" onclick="Fade._pour('${k}')" ${left<=0?'disabled':''} aria-label="Pour 5 ${PRIM[k].n} drops">+5</button>`:''}</div>`;}).join('')}</div>
 ${UI.fb?`<div class="fd-fb ${UI.fbok?'ok':'no'}">${UI.fb}</div>`:''}
 <div class="row"><button class="btn ghost dark fd-empty" onclick="Fade._empty()" ${has?'':'disabled'}>↺ Empty the mixing bowl</button><button class="btn green big fd-mixbtn" onclick="Fade._mix()" ${has?'':'disabled'}>Pour into the ${E(sn)} slot ✨</button></div>
 <div class="fd-legend">Patterns: ${['r','y','b','w','k'].filter(k=>jars.includes(k)).map(k=>`<span>${swatch({[k]:1},16)} ${k==='r'?'dots':k==='y'?'stripes':k==='b'?'waves':k==='w'?'plus signs':'criss-cross'} = ${PRIM[k].n}</span>`).join('')}</div>`;}
/* update the table in place, so the levels glide instead of jumping */
function updMix(){try{const p=me(),a=p&&p.fade.a;if(!a||UI.ph!=='mix')return;const pz=curPuzzle(p),cap=bowlCap(pz),bw=UI.bowl,sh=UI.shown;
 jarsOf(a,pz).forEach(k=>{const w=document.querySelector(`.fd-jarw[data-jar="${k}"]`);if(!w)return;const full=supply(a,pz,k),left=full-bw[k];const lq=w.querySelector('.fd-liq');
  if(lq){const st=+lq.dataset.step,c=+lq.dataset.cap;lq.style.transform=`translateY(${((c-Math.min(left,c))*st).toFixed(2)}px)`;}
  const n=w.querySelector('.fd-jn');if(n)n.textContent=left;const b=w.querySelector('.fd-jar');if(b){b.disabled=left<=0;b.classList.toggle('off',left<=0);}const pr=w.querySelector('.fd-pour');if(pr)pr.disabled=left<=0;});
 const n=bowlN(sh),bl=document.querySelector('.fd-bliq');if(bl)bl.style.transform=`translateY(${(100-bLevel(n,cap)).toFixed(2)}px)`;
 const f=document.querySelector('.fd-bfill');if(f)f.setAttribute('fill',bowlColor(sh));const pg=document.querySelector('.fd-bpat');if(pg)pg.innerHTML=pats(sh).replace(/width="100%" height="100%"/g,'x="0" y="28" width="200" height="130"');
 const lab=document.querySelector('.fd-blab');if(lab)lab.innerHTML=bowlLabel(sh);
 const has=bowlN(bw)>0;document.querySelectorAll('.fd-empty,.fd-mixbtn').forEach(x=>x.disabled=!has);
}catch(e){}}
function clearFb(){if(UI.fb){UI.fb='';const fb=document.querySelector('.fd-pz .fd-fb');if(fb)fb.remove();}}
function ripple(){try{const r=document.querySelector('.fd-ripple');if(r&&!RM())r.animate([{opacity:.9,transform:'scale(.3)'},{opacity:0,transform:'scale(2.4)'}],{duration:520,easing:'ease-out'});}catch(e){}}
/* one drop: out of the dropper now, into the bowl when it lands */
function addDrop(k,quiet){const p=me(),a=p&&p.fade.a;if(!a||UI.ph!=='mix')return false;const pz=curPuzzle(p),cap=bowlCap(pz);
 if(supply(a,pz,k)-UI.bowl[k]<=0){if(!quiet)say(k==='w'||k==='k'?`Prisma's ${PRIM[k].n} jar is empty!`:`No more ${PRIM[k].n} drops! Win battles for more.`);return false;}
 if(bowlN(UI.bowl)>=cap){if(!quiet)say('The mixing bowl is full! Pour it, or empty it and try again.');return false;}
 UI.shown=UI.shown||Object.assign({},UI.bowl);UI.bowl[k]++;clearFb();const land=()=>{UI.shown[k]++;updMix();ripple();tn(560+KEYS.indexOf(k)*80,.1,'sine',.06);};
 updMix();const src=document.querySelector(`.fd-jarw[data-jar="${k}"] .fd-btl`),bowl=document.querySelector('.fd-bowl');
 if(RM()||!src||!bowl){land();return true;}
 try{const s=src.getBoundingClientRect(),bb=bowl.getBoundingClientRect(),n=bowlN(UI.shown);const x0=s.left+s.width*.54-9,y0=s.top+4,x1=bb.left+bb.width/2-9+(Math.random()*30-15),y1=bb.top+(BW.bot-bLevel(n+1,cap))/150*bb.height-20;
  const d=document.createElement('div');d.className='fd-fly';d.innerHTML=drop(k,18);document.body.appendChild(d);
  const an=d.animate([{transform:`translate(${x0}px,${y0}px) scale(.5)`,opacity:.3},{transform:`translate(${x0}px,${y0-22}px) scale(1)`,opacity:1,offset:.25},{transform:`translate(${x1}px,${y1}px) scale(.9)`,opacity:1}],{duration:430,easing:'cubic-bezier(.5,0,.8,.6)'});
  an.onfinish=()=>{d.remove();land();};}catch(e){land();}return true;}
function pour(k){let i=0;const t=()=>{if(i++>=5||!addDrop(k,i>1))return;setTimeout(t,RM()?0:110);};t();}
function emptyBowl(){UI.bowl={r:0,y:0,b:0,w:0,k:0};UI.shown={r:0,y:0,b:0,w:0,k:0};clearFb();snd('tap');updMix();}
function doMix(){if(POURING)return;const p=me(),a=p&&p.fade.a;if(!a)return;if(UI.shown&&bowlN(UI.shown)<bowlN(UI.bowl)){setTimeout(doMix,120);return;} /* let the last drops land first */const pz=curPuzzle(p),bw=UI.bowl;if(!KEYS.some(k=>bw[k]))return;
 let ok=false,msg='';
 if(pz.kind==='slot'){const other=KEYS.find(k=>k!==pz.k&&bw[k]);const n=bw[pz.k];if(other)msg=`Only ${PRIM[pz.k].n} goes in the ${PRIM[pz.k].n} slot! Empty the mixing bowl and try again.`;else if(n<pz.mix[pz.k])msg=`A little more! The slot needs ${pz.mix[pz.k]}.`;else if(n>pz.mix[pz.k])msg=`Too many! The slot needs just ${pz.mix[pz.k]}.`;else ok=true;}
 else if(sameRatio(bw,pz.mix))ok=true;
 else{const k=offBy(bw,pz.mix);msg=(k?TOO[k]:'Not quite!')+` Your mix is <b style="color:${mixHex(bw)}">■</b>, the target is <b style="color:${mixHex(pz.mix)}">■</b>.`;}
 if(ok){const same=KEYS.every(k=>(bw[k]||0)===(pz.mix[k]||0));POT.forEach(k=>potAdd(a,k,-(bw[k]||0)));UI.sameMsg=!same&&pz.kind==='mix'?`Same color! ${ratioTxt(bw)} is the same mix as ${ratioTxt(pz.mix)}. ✨`:'';return pourAnim(pz,Object.assign({},bw),()=>solve(p,pz));}
 UI.mm++;snd('wrong');if(UI.mm>=2)msg+=` Try exactly: ${KEYS.filter(k=>pz.mix[k]).map(k=>`<b>${pz.mix[k]}</b> ${PRIM[k].n}`).join(' + ')}.`;UI.fb=msg;UI.fbok=false;
 try{const b=document.querySelector('.fd-bowl');if(b&&!RM())b.animate([{transform:'rotate(0)'},{transform:'rotate(-6deg)'},{transform:'rotate(6deg)'},{transform:'rotate(0)'}],{duration:400});}catch(e){}
 UI.shown=Object.assign({},UI.bowl);setTimeout(redraw,RM()?0:380);}
/* the pour: bowl tips, a stream runs along the arrow into the glowing slot, the slot fills (color + pattern), the bowl empties */
let POURING=false;
function pourAnim(pz,bw,done){const g=document.querySelector(`.fd-wheelw [data-slot="${pz.slot}"]`),bowl=document.querySelector('.fd-bowl');
 const fill=()=>{if(!g)return;const f=g.querySelector('.fd-sf');if(f){f.setAttribute('fill',mixHex(pz.mix));f.setAttribute('stroke','#2b2250');f.removeAttribute('stroke-dasharray');}
  const sp=g.querySelector('.fd-sp');if(sp&&f){sp.innerHTML=pats(pz.mix).replace(/<rect width="100%" height="100%"/g,`<path d="${f.getAttribute('d')}"`);sp.setAttribute('opacity','.8');}const h=g.querySelector('.fd-hlp');if(h)h.remove();};
 const emptyIt=()=>{UI.shown={r:0,y:0,b:0,w:0,k:0};const sv0=UI.bowl;UI.bowl={r:0,y:0,b:0,w:0,k:0};updMix();UI.bowl=sv0;};
 document.querySelectorAll('.fd-mixbtn,.fd-empty,.fd-jar,.fd-pour').forEach(x=>x.disabled=true);
 if(RM()||!g||!bowl){fill();emptyIt();snd('correct');setTimeout(done,RM()?350:0);return;}
 POURING=true;const col=bowlColor(bw);const br=bowl.getBoundingClientRect(),tr=g.getBoundingClientRect();
 bowl.style.transformOrigin='92% 40%';bowl.style.transition='transform .45s ease-in-out';bowl.style.transform='rotate(18deg)';
 const x0=br.left+br.width*.93,y0=br.top+br.height*.22,x1=tr.left+tr.width/2,y1=tr.top+tr.height/2;
 const ns='http://www.w3.org/2000/svg',sv=document.createElementNS(ns,'svg');sv.setAttribute('class','fd-stream');sv.setAttribute('width',innerWidth);sv.setAttribute('height',innerHeight);
 const pth=document.createElementNS(ns,'path');const mx=(x0+x1)/2,my=Math.min(y0,y1)-50;pth.setAttribute('d',`M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}`);pth.setAttribute('fill','none');pth.setAttribute('stroke',col);pth.setAttribute('stroke-width','9');pth.setAttribute('stroke-linecap','round');
 const edge=pth.cloneNode();edge.setAttribute('stroke','#2b2250');edge.setAttribute('stroke-width','12');sv.appendChild(edge);sv.appendChild(pth);document.body.appendChild(sv);
 const L=pth.getTotalLength();[edge,pth].forEach(x=>{x.style.strokeDasharray=L;x.style.strokeDashoffset=L;});
 tn(420,.5,'sine',.05);
 setTimeout(()=>{[edge,pth].forEach(x=>x.animate([{strokeDashoffset:L},{strokeDashoffset:0}],{duration:520,fill:'forwards',easing:'ease-in'}));
  const bl=document.querySelector('.fd-bliq');if(bl){bl.style.transition='transform .9s ease-in';bl.style.transform=`translateY(${100-BW.base}px)`;}},420);
 setTimeout(()=>{fill();try{g.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:450});}catch(e){}snd('correct');},950);
 setTimeout(()=>{[edge,pth].forEach(x=>x.animate([{strokeDashoffset:0},{strokeDashoffset:-L}],{duration:420,fill:'forwards',easing:'ease-out'}));bowl.style.transform='';emptyIt();},1300);
 setTimeout(()=>{sv.remove();POURING=false;done();},1900);}
const ratioTxt=m=>KEYS.filter(k=>m[k]).map(k=>m[k]).join(' : ');
/* light (grade 5+) */
function lightHTML(pz){const [r,g,b]=pz.light;
 const L=`<svg class="fd-light" viewBox="0 0 160 120" aria-label="Red, green and blue light overlapping. Where all three meet, it is white."><rect width="160" height="120" rx="14" fill="#111"/><g style="mix-blend-mode:screen;isolation:isolate"><circle cx="62" cy="48" r="32" fill="#ff0000" style="mix-blend-mode:screen"/><circle cx="98" cy="48" r="32" fill="#00ff00" style="mix-blend-mode:screen"/><circle cx="80" cy="78" r="32" fill="#0000ff" style="mix-blend-mode:screen"/></g><text x="80" y="116" text-anchor="middle" font-size="9" fill="#fff">light: R + G + B = white</text></svg>`;
 const I=`<svg class="fd-light" viewBox="0 0 160 120" aria-label="Cyan, magenta and yellow ink overlapping. Where all three meet, it is almost black."><rect width="160" height="120" rx="14" fill="#fff" stroke="#dee2e6"/><g style="isolation:isolate"><circle cx="62" cy="48" r="32" fill="#00ffff" style="mix-blend-mode:multiply"/><circle cx="98" cy="48" r="32" fill="#ff00ff" style="mix-blend-mode:multiply"/><circle cx="80" cy="78" r="32" fill="#ffff00" style="mix-blend-mode:multiply"/></g><text x="80" y="116" text-anchor="middle" font-size="9" fill="#333">ink: C + M + Y = dark</text></svg>`;
 return `<div class="fd-say">${pz.after}</div><div class="fd-lights">${L}${pz.ink?I:''}<div class="fd-lswc"><div class="fd-lsw big" style="background:rgb(${r},${g},${b})"></div><small>(${r}, ${g}, ${b})</small></div></div>
 <p class="fd-small">Paint <b>soaks up</b> light, so mixing paint gets darker. Screens <b>add</b> light, so mixing gets brighter.${pz.ink?' Printers use cyan, magenta and yellow ink, the opposites of red, green and blue.':''}</p>
 <div class="row"><button class="btn green big" onclick="Fade._lightOK()">Wow! ✨</button></div>`;}
/* rainbow bridge (the finale) */
const RB=SEVEN.map(k=>[k,RECIPE[k],Cap(CNAME[k])]);
function rainbowSVG(n,w){return `<svg class="fd-rbw" viewBox="0 0 120 64" width="${w}" aria-hidden="true">${RB.map(([k,m],j)=>{const r=56-j*6.2;const on=j<n;return `<path d="M${(60-r).toFixed(1)} 62 A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(60+r).toFixed(1)} 62" fill="none" stroke="${on?RBOW[k]:'#edf0f3'}" stroke-width="5.8"/>`;}).join('')}</svg>`;}
function rbHTML(){const order=UI.rbo||(UI.rbo=[0,1,2,3,4,5,6].sort(()=>Math.random()-.5));
 return `<div class="fd-say" data-spk="rb">${UI.rb===0?'Paint the rainbow! Tap the colors in order, from the outside in. Red goes first!':UI.rb<7?`Great! What comes after <b>${RB[UI.rb-1][2].toLowerCase()}</b>?`:''}${SPK}</div>
 <div class="fd-rbwrap">${rainbowSVG(UI.rb,280)}</div>
 <div class="fd-rbb">${order.map(j=>{const [k,m,n]=RB[j];const done=j<UI.rb;const glow=UI.rbm>=2&&j===UI.rb;return `<button class="fd-rbtn ${done?'done':''} ${glow?'glow':''}" ${done?'disabled':''} onclick="Fade._rb(${j})">${swatch(m,40)}<b>${n}</b></button>`;}).join('')}</div>
 ${UI.fb?`<div class="fd-fb no">${UI.fb}</div>`:''}`;}
function rbTap(j){const p=me();if(!p||UI.ph!=='rainbow')return;if(j===UI.rb){UI.rb++;UI.rbm=0;UI.fb='';tn(520+j*80,.18,'triangle',.1);if(UI.rb>=7){snd('win');return solve(p,curPuzzle(p));}return redraw();}
 UI.rbm++;snd('wrong');UI.fb=`Not that one yet! Rainbows go red, orange, yellow, green, blue, indigo, violet.${UI.rbm>=2?' Look for the glowing one!':''}`;redraw();}
/* solved */
function solve(p,pz){const a=p.fade.a;const was=level(p);
 if(pz.kind==='help'){const z=SIZES(a.b);a.hu=(a.hu||0)+1;a.hp=now();a.s++;a.i=0;UI.solvedMsg=`Prisma used her secret paint! Stage ${a.s} is done.`;}
 else{a.i++;const z=SIZES(a.b);if(a.i>=z[a.s]){a.s++;a.i=0;UI.stageDone=a.s;}}
 if(!UI.skipped)p.coins=(p.coins||0)+5;sv();UI.ph='solved';UI.solved=pz;UI.from=was;UI.fx={from:was,to:level(p)};snd('correct');redraw();}
function solvedHTML(p,a,pz){const z=SIZES(a.b),fin=a.s>=z.length,sd=UI.stageDone;
 const back=pz.kind==='help'?UI.solvedMsg:pz.kind==='slot'?`${E(pz.name)} is back!`:pz.kind==='rainbow'?'The rainbow is back!':pz.kind==='light'?(UI.skipped?'On to the rainbow!':'You found Prisma\'s secret!'):`${E(pz.name)} is back!`;
 const msg=sd&&!fin?[null,'Red, yellow and blue are back: 3 of 7 colors! The world has a little color again.','All 7 colors are on the Color Wheel! Almost there!'][sd]||'':'';const cnt=pz.kind==='slot'||pz.kind==='mix'?`<p class="fd-cntl">🌈 <b>${colorsDone(p,a)} of 7</b> colors on the Color Wheel</p>`:'';
 return `<div class="fd-yay"><div class="fd-yay-sw">${pz.kind==='rainbow'?rainbowSVG(7,130):pz.kind==='light'?`<div class="fd-lsw big" style="background:rgb(${pz.light.join(',')})"></div>`:pz.kind==='help'?'<div class="fd-lsw big fd-rbw"></div>':swatch(pz.mix,84,'pop')}</div><h3>✨ ${back}</h3>${UI.sameMsg?`<p>${UI.sameMsg}</p>`:''}${cnt}${msg?`<p class="fd-stage">🌈 ${msg}</p>`:''}<p class="fd-small">${pz.bonus&&UI.skipped?'Bonus skipped':'+5 🪙'}</p>
 <div class="row">${fin?'<button class="btn gold big" onclick="Fade._finish()">🎆 Bring back ALL the color!</button>':`<button class="btn green big" onclick="Fade._next()">Next color ➜</button>`}</div></div>`;}
function fxAfter(fx){const w=document.querySelector('.fd-win');if(!w||RM())return;w.style.filter=`grayscale(${fx.from})`;void w.offsetWidth;w.style.transition='filter 1.6s ease';w.style.filter=`grayscale(${fx.to})`;
 const pr=document.querySelector('.fd-pr');if(pr)bump(pr);}
/* the finale: color bursts back */
function finish(p){const f=F(p),a=f.a;if(!a){drawCalm(p,f);return;}
 const rw=grant(p,f);f.h.push([dnum(a.t),dnum(),a.hu||0]);if(f.h.length>6)f.h=f.h.slice(-6);f.n=now()+(GAP[0]+Math.floor(Math.random()*(GAP[1]-GAP[0]+1)))*DAY;delete f.a;UI={key:null};SWEEP=true;sv();
 celebrate(p,rw);}
let SWEEP=false;
function grant(p,f){f.c=(f.c||0)+1;p.coins=(p.coins||0)+100;const out={coins:100};defs();
 if(f.c===1&&!(p.pets||[]).includes(CHAM.id)){p.pets=p.pets||[];p.pets.push(CHAM.id);try{if(typeof petData==='function')petData(p,CHAM.id);}catch(e){}if(!p.pet)p.pet=CHAM.id;out.pet=1;}
 else if(f.c<=2&&p.owned&&Array.isArray(p.owned.robes)&&!p.owned.robes.includes(ROBE.id)){p.owned.robes.push(ROBE.id);out.robe=1;}
 else{p.coins+=150;out.coins+=150;f.sp=(f.sp||0)+1;out.sp=1;try{if(window.Adv&&p.adv&&p.adv.shelf)p.adv.shelf.fdsplotch=(p.adv.shelf.fdsplotch||0)+1;}catch(e){}}
 return out;}
function celebrate(p,rw){const reduce=RM();
 const conf=reduce?'':Array.from({length:44},(_,j)=>`<i class="fd-conf" style="left:${(j*37)%100}%;background:${STR[j%6][1]};animation-delay:${(j%11)*.18}s;animation-duration:${2.6+(j%5)*.4}s"></i>`).join('');
 const fw=reduce?'':`<svg class="fd-fw" viewBox="0 0 400 300" aria-hidden="true">${[[90,90,'#ff6b6b'],[300,70,'#ffd43b'],[200,150,'#4dabf7'],[330,190,'#69db7c'],[70,210,'#cc5de8']].map(([x,y,c],j)=>`<g transform="translate(${x},${y})" style="animation-delay:${j*.45}s">${Array.from({length:12},(_,q)=>`<line x1="0" y1="0" x2="${(Math.cos(q*Math.PI/6)*34).toFixed(1)}" y2="${(Math.sin(q*Math.PI/6)*34).toFixed(1)}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`).join('')}</g>`).join('')}</svg>`;
 let prize='';
 if(rw.pet)prize=`<div class="fd-prize"><div class="fd-chamw">${rainbowSVG(7,150)}<div class="fd-cham">🦎</div></div><h3>Rainbow Chameleon!</h3><p>"I change color to match the world I'm in. Thanks for bringing the colors back!"</p><small>A new pet for your collection (Great Fade prize)</small>${p.pet!==CHAM.id?`<div class="row" style="margin-top:6px"><button class="btn green small" onclick="Fade._buddy(this)">🦎 Make it my buddy!</button></div>`:''}</div>`;
 else if(rw.robe){let hero='';try{if(typeof heroSVG==='function'){defs();hero=heroSVG(Object.assign({},p.look,{robe:ROBE.id}),{});}}catch(e){hero='';}
  prize=`<div class="fd-prize"><div class="fd-robe">${hero||`<div class="fd-robesw"></div>`}</div><h3>The Prismatic Robe!</h3><p>It slowly shifts through every color. It's never sold in the shop!</p><small>Also in your Backpack → Robes</small>${p.look&&p.look.robe!==ROBE.id?`<div class="row" style="margin-top:6px"><button class="btn green small" onclick="Fade._wear(this)">👘 Wear it now!</button></div>`:''}</div>`;}
 else prize=`<div class="fd-prize"><div class="fd-spl">${splotchSVG()}</div><h3>A rare paint splotch!</h3><p>Plus <b>🪙 ${rw.coins}</b> coins.</p></div>`;
 layer(`${fw}<div class="fd-confw">${conf}</div><div class="fd-card fd-end"><div class="fd-art">${prismaSVG({gray:0,on:ALL7()})}</div><h2 class="fd-rainbowt">The colors are back!</h2><p class="fd-big">You beat the Grey Goblin! Your whole world is in color again.</p><div class="fd-gobend">${goblinSVG({w:70,soft:1})}<p>"Hmph! All this color… okay, maybe that rainbow is a <i>little</i> bit pretty." <small>— the Grey Goblin, stomping off</small></p></div>${prize}<p class="fd-small">+🪙 ${rw.coins}</p><div class="row"><button class="btn gold big" onclick="Fade._home()">🌍 See my world!</button></div></div>`,'party');
 snd('level');setTimeout(()=>snd('win'),700);setTimeout(shimmer,60);}
function splotchSVG(){return `<svg viewBox="0 0 100 80" width="110" aria-hidden="true"><path d="M20 40 Q10 20 30 18 Q40 4 55 14 Q72 6 78 24 Q96 30 84 48 Q92 66 70 64 Q58 78 44 66 Q24 74 22 58 Q6 52 20 40Z" fill="#cc5de8" stroke="#2b2250" stroke-width="2.5"/><circle cx="40" cy="36" r="8" fill="#ffd43b"/><circle cx="60" cy="46" r="7" fill="#4dabf7"/><circle cx="52" cy="28" r="5" fill="#ff6b6b"/><circle cx="86" cy="14" r="5" fill="#cc5de8"/><circle cx="10" cy="66" r="4" fill="#cc5de8"/></svg>`;}

/* ---------- prizes: registered at run time (inert unless owned) ---------- */
const CHAM={id:'chameleon',e:'🦎',name:'Rainbow Chameleon',perk:'xp',tier:'event',rare:true,fade:1};
const PRISM=['#e03131','#fd7e14','#fcc419','#37b24d','#1c7ed6','#3b3fae','#9c5bd6']; /* ROYGBIV */
const ROBE={id:'prismatic',name:'Prismatic',grad:PRISM,price:1,event:true,fade:1};
function defs(){try{if(typeof PETS!=='undefined'&&Array.isArray(PETS)&&!PETS.some(x=>x.id===CHAM.id))PETS.push(Object.assign({},CHAM));}catch(e){}
 try{if(typeof ROBES!=='undefined'&&Array.isArray(ROBES)&&!ROBES.some(x=>x.id===ROBE.id))ROBES.push(Object.assign({},ROBE,{grad:PRISM.slice()}));}catch(e){}
 try{if(typeof petSays==='function'&&!petSays._fd){const o=petSays;const w=function(pd,pet){try{if(pet&&pet.id===CHAM.id&&Math.random()<.5){const p=me();return active(p)?'Everything is gray, so I\'m gray too! Let\'s find the colors! 🎨':'I change color to match the world! Right now I\'m '+['every color at once','sunset orange','leaf green','sky blue','rainbow'][Math.floor(Math.random()*5)]+'! 🌈';}}catch(e){}return o.apply(this,arguments);};w._fd=1;window.petSays=w;}}catch(e){}}
(function reg(n){let ok=false;try{ok=typeof PETS!=='undefined'&&typeof ROBES!=='undefined';}catch(e){}if(ok)defs();else if(n<3000)setTimeout(()=>reg(n+1),n<300?0:200);})(0);
try{document.addEventListener('DOMContentLoaded',defs);}catch(e){}
/* the Prismatic robe shimmers (SMIL, so it works inside the game's own hero SVG) */
function shimmer(){if(RM())return;try{document.querySelectorAll('linearGradient').forEach(g=>{const st=g.querySelectorAll('stop');if(st.length!==PRISM.length||g._fd||(st[0].getAttribute('stop-color')||'').toLowerCase()!==PRISM[0])return;g._fd=1;
 st.forEach((s,j)=>{const an=document.createElementNS('http://www.w3.org/2000/svg','animate');const seq=PRISM.map((_,q)=>PRISM[(j+q)%PRISM.length]);seq.push(seq[0]);an.setAttribute('attributeName','stop-color');an.setAttribute('values',seq.join(';'));an.setAttribute('dur','7s');an.setAttribute('repeatCount','indefinite');s.appendChild(an);});});}catch(e){}}
function chamHue(){if(RM())return;try{const p=me();if(!p||!(p.pets||[]).includes(CHAM.id))return;css();document.querySelectorAll('#app .pe, #app .petf, #app .pav, #app .ie').forEach(el=>{if(el.textContent.trim()===CHAM.e&&!el._fdh){el._fdh=1;try{el.animate([{filter:'hue-rotate(0deg)'},{filter:'hue-rotate(360deg)'}],{duration:5000,iterations:Infinity});}catch(e){}}});}catch(e){}}
/* the chameleon has no Halloween home in the Backpack, so it gets its own shelf there */
function bagInject(p){try{const f=p.fade||{};const own=(p.pets||[]).includes(CHAM.id);const sec=document.querySelector('.bpsec[data-t="pets"]');
 if(own&&sec&&!sec.querySelector('.fd-bag')){defs();const eq=p.pet===CHAM.id;let st='';try{if(typeof petStage==='function'&&typeof petData==='function')st=petStage(petData(p,CHAM.id)).n;}catch(e){}
  sec.insertAdjacentHTML('beforeend',`<div class="fd-bag"><h4 class="tierh" style="color:#cc5de8">🌈 Great Fade <span class="muted">1 / 1</span></h4><div class="items"><button class="item ${eq?'eq':''}" onclick="shopClick('pet','${CHAM.id}')"><div class="ie fd-chamie"><span class="fd-cham sm">🦎</span></div><div>${CHAM.name}</div><small>Changes color with the world${st?'<br>'+E(st):''}</small><div class="ip">${eq?'✓ Using':'Use'}</div></button></div></div>`);}
 const more=document.querySelector('.bpsec[data-t="more"]');if(more&&(f.c||0)>0&&!more.querySelector('.fd-more')){more.insertAdjacentHTML('afterbegin',`<div class="panel fd-more"><h3>🌈 The Great Fade</h3><p style="margin:0">You beat the Grey Goblin <b>${f.c}</b> time${f.c>1?'s':''}!${f.sp?` Rare paint splotches: <b>${f.sp}</b> 🎨`:''}</p></div>`);}}catch(e){}}

/* ---------- open / navigation ---------- */
function open(){LASTPZ=null;const s=cur();if(s&&s!=='fade'&&s!=='battle')RET=s;closeLayer();goTo('fade');}
function back(){closeLayer();const r=RET&&RET!=='fade'&&typeof SCREENS!=='undefined'&&SCREENS[RET]?RET:'world';goTo(r);}
function home(){closeLayer();const r=RET&&RET!=='fade'&&typeof SCREENS!=='undefined'&&SCREENS[RET]?RET:'world';
 if(SWEEP){SWEEP=false;DRAINING=true;goTo(r);DRAINING=false;const p=me();setGray(.9);ov().style.display='block';tween(.9,0,2600,()=>{apply();},true);try{hud(p,false);}catch(e){}}else goTo(r);}
function hudHTML(p){p=p||me();if(!p||!active(p))return '';const a=p.fade.a;if(!a.in)return `<button class="hcard glow fd-qcard" onclick="Fade.open()"><span class="pav">🧙‍♀️</span><div><b>Where did the colors go?!</b><small>Prisma the Color Wizard needs your help</small></div></button>`;
 const z=SIZES(a.b),st=STAGES(a.b)[Math.min(a.s,z.length-1)],pz=curPuzzle(p),ready=helpReady(p)||(pz&&!short(p,pz));
 return `<button class="hcard ${ready?'glow':''} fd-qcard" onclick="Fade.open()"><span class="pav">🎨</span><div><b>The Great Fade · 🌈 ${colorsDone(p,a)} of 7 colors</b><small>${ready?'You have enough paint! Visit Prisma\'s mixing table':st.n+' · win battles to collect paint drops'}</small></div></button>`;}

/* ---------- styles ---------- */
const CSS=`
.fd-h7{background:linear-gradient(90deg,#e03131,#fd7e14,#fcc419,#37b24d,#1c7ed6,#3b3fae,#9c5bd6);color:#fff;border-radius:999px;padding:1px 8px;font-size:14px;text-shadow:0 1px 2px #0008;white-space:nowrap}.fd-h7 b{font-size:15px}
.fd-check{background:#fff;border-radius:18px;margin-top:10px;padding:8px 12px;color:#241a3d}.fd-cnt{font-size:17px;margin-bottom:4px}.fd-chips{display:flex;flex-wrap:wrap;gap:5px}
.fd-chip7{display:inline-flex;align-items:center;gap:3px;border:2px dashed #ced4da;border-radius:999px;padding:1px 8px 1px 3px;font-size:13px;font-weight:700;color:#868e96}.fd-chip7 svg{flex:none}.fd-chip7.on{border:2px solid #37b24d;background:#ebfbee;color:#2b8a3e}
.fd-intro .fd-check{margin-top:6px;box-shadow:none;padding:4px}.fd-intro .fd-chips{justify-content:center}.fd-intro .fd-cnt{text-align:center}
.fd-recipes{gap:6px}.fd-recl{display:flex;align-items:center;gap:4px;font-size:17px}.fd-plus{font-size:18px;margin:0 3px;color:#6f6499}.fd-dpic{display:inline-flex;vertical-align:middle;gap:0}
.fd-mc{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 4px}.fd-mc.pics{grid-template-columns:minmax(0,1fr)}
.fd-mco{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:#f1edff;border:3px solid #d0bfff;border-radius:16px;padding:10px 6px;font-size:21px;font-weight:800;color:#241a3d;box-shadow:0 4px 0 #b9b0d9;min-height:62px}
.fd-mc.pics .fd-mco{flex-direction:row;font-size:16px;justify-content:flex-start;gap:10px;padding:8px 12px;text-align:left}
.fd-mco:active{transform:translateY(3px);box-shadow:0 1px 0 #b9b0d9}.fd-mco.bad{opacity:.4;background:#fff0f0;border-color:#ffc9c9;text-decoration:line-through}
.fd-mcl{background:#7c5cff;color:#fff;border-radius:50%;width:24px;height:24px;display:inline-grid;place-items:center;font-size:13px;flex:none}
.fd-mbowl{display:inline-flex;align-items:center;gap:2px;background:#eef6ff;border:2px solid #a5d8ff;border-radius:0 0 22px 22px;padding:6px 10px;border-top-width:4px}
.fd-revv .fd-mbowl,.fd-revv span{vertical-align:middle}.fd-cntl{font-size:16px;margin:4px 0}
.fd-chamw{position:relative;display:inline-block}.fd-chamw .fd-rbw{display:block}.fd-chamw .fd-cham{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);font-size:58px}
.fd-chamie{background:conic-gradient(#e03131,#fd7e14,#fcc419,#37b24d,#1c7ed6,#3b3fae,#9c5bd6,#e03131);border-radius:50%;width:60px;height:60px;margin:0 auto}
  .fd-dash{position:fixed;left:0;bottom:18vh;z-index:61;pointer-events:none;display:flex;align-items:flex-end;gap:6px}.fd-hehe{background:#fff;border:3px solid #868e96;border-radius:14px;padding:4px 10px;font:600 15px 'Fredoka',system-ui,sans-serif;color:#495057;margin-bottom:70px}
#fdGray{position:fixed;inset:0;z-index:59;pointer-events:none;display:none;background:rgba(0,0,0,.001)}
.fd-hud{position:fixed;left:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:61;display:flex;align-items:center;gap:6px;background:#fff;border:3px solid #2b2250;border-radius:999px;padding:4px 12px 4px 6px;box-shadow:0 4px 0 rgba(0,0,0,.3);font-family:inherit;color:#241a3d;cursor:pointer}
.fd-hud.inb{top:62px;bottom:auto!important;left:auto;right:10px;padding:2px 8px 2px 4px;transform:scale(.9);transform-origin:top right}
.fd-hud.ready{animation:fdglow 1.4s ease-in-out infinite}
.fd-hpot{font-size:22px;line-height:1}
.fd-hd{display:flex;align-items:center;gap:1px;font-weight:700;font-size:16px}
.fd-hbang{background:#ff6b6b;color:#fff;border-radius:50%;width:20px;height:20px;display:grid;place-items:center;font-weight:800;font-size:14px}
@keyframes fdglow{50%{box-shadow:0 4px 0 rgba(0,0,0,.3),0 0 16px 4px #ffe066}}
.fd-fly{position:fixed;left:0;top:0;z-index:63;pointer-events:none}
.fd-chip{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:63;background:#fff;color:#241a3d;border:3px solid #2b2250;border-radius:16px;padding:8px 14px;font-weight:700;display:flex;align-items:center;gap:8px;box-shadow:0 6px 18px rgba(0,0,0,.35);transition:opacity .5s;max-width:92vw;flex-wrap:wrap;justify-content:center;font-size:16px}
.fd-chip.out{opacity:0}.fd-chip span{display:inline-flex;align-items:center;gap:2px}
#fdLay{position:fixed;inset:0;z-index:62;display:grid;place-items:center;padding:14px;overflow:auto}
#fdLay.dim{background:rgba(10,5,30,.55)}#fdLay.party{background:radial-gradient(ellipse at center,rgba(40,20,90,.55),rgba(10,5,30,.8))}
.fd-card{background:#fff;color:#241a3d;border-radius:24px;padding:18px;max-width:560px;width:100%;text-align:center;box-shadow:0 8px 0 rgba(0,0,0,.25);position:relative}
#fdLay .fd-card{animation:fdpop .3s ease-out;max-height:94dvh;overflow:auto}
@keyframes fdpop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
.fd-card h2{margin:4px 0 6px;font-size:clamp(24px,5vw,30px)}
.fd-big{font-size:clamp(17px,2.4vw,20px);line-height:1.4;margin:6px 0 10px}
.fd-small{font-size:14px;color:#6f6499;margin:6px 0}
.fd-art{display:flex;justify-content:center;align-items:flex-end;gap:10px;min-height:120px}
.fd-art .fd-prisma{width:96px;height:auto}
.fd-gobend{display:flex;align-items:center;gap:10px;background:#f1f3f5;border-radius:14px;padding:8px 12px;margin:8px auto;max-width:420px;text-align:left}.fd-gobend p{margin:0;font-size:15px;color:#495057}.fd-gobend small{display:block;color:#868e96}.fd-gobend svg{flex:none}
.fd-introw{display:flex;align-items:center;gap:14px;justify-content:center}.fd-introw .fd-prisma{width:84px}
.fd-trio{display:flex;gap:18px;justify-content:center}.fd-trio div{display:flex;flex-direction:column;align-items:center;font-weight:700}
.fd-note{font-weight:700;color:#087f5b;margin-top:4px}.fd-col{display:flex;flex-direction:column;align-items:center}.fd-prim{font-size:14px;color:#6f6499;font-weight:600;display:inline-flex;align-items:center;gap:4px}
.fd-dots{display:flex;gap:6px;justify-content:center;margin:4px 0}.fd-dots i{width:9px;height:9px;border-radius:50%;background:#dee2e6}.fd-dots i.on{background:#7c5cff}
.fd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.qspk.fd-spk{position:static;transform:none;display:inline-grid;place-items:center;vertical-align:middle;margin:0 0 0 6px;padding:0;width:34px;height:34px;line-height:1;background:#eee9ff;box-shadow:0 2px 0 #c9bff0}
.fd-cw{font-weight:800}.fd-c-r{color:#c92a2a}.fd-c-y{color:#b08800;text-decoration:underline wavy #fcc419}.fd-c-b{color:#1864ab}.fd-c-w{color:#868e96}.fd-c-k{color:#212529}
.fd-tb .topbar{position:relative}
.page.fd{max-width:1100px}
.fd-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:14px;align-items:start}
@media(max-width:820px){.fd-grid{grid-template-columns:minmax(0,1fr)}}
.fd-solo{max-width:560px;margin:0 auto}
.fd-scene{position:relative;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.25)}
.fd-win{aspect-ratio:400/170;overflow:hidden}.fd-win svg{display:block;width:100%;height:100%}
.fd-pr{position:absolute;left:8px;top:8px;width:21%;max-width:96px}.fd-pr svg{width:100%;height:auto;display:block}
.fd-wh{position:absolute;right:8px;top:8px;width:27%;max-width:118px;background:#fffc;border-radius:50%;padding:3px}.fd-wh svg{width:100%;height:auto;display:block}
.fd-prog{padding:10px 14px 12px;color:#241a3d;font-size:16px}.fd-prog small{color:#6f6499;font-size:13.5px}
.fd-bar{height:12px;border-radius:8px;background:#e9ecef;overflow:hidden;margin:6px 0 4px}.fd-bar i{display:block;height:100%;background:linear-gradient(90deg,#e03131,#fd7e14,#fcc419,#37b24d,#1c7ed6,#3b3fae,#9c5bd6);transition:width .8s}
.fd-pot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:#fff;border-radius:18px;margin-top:10px;padding:8px 12px;color:#241a3d;font-weight:700}
.fd-pot>span:first-child{margin-right:auto}.fd-pc{display:inline-flex;align-items:center;gap:3px;font-size:18px}.fd-pc small{font-size:13px;color:#6f6499;font-weight:600}
@media(max-width:820px){.fd-pot{margin-top:8px}.fd-pc small{display:none}}
.fd-pz{text-align:left}
.fd-tgt{display:flex;gap:12px;align-items:center;background:#f6f3ff;border-radius:16px;padding:8px 12px;margin-bottom:10px}
.fd-tgt small{display:block;color:#6f6499;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.04em}.fd-tgt b{font-size:20px}
.fd-rec{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:2px}
.fd-rc{display:inline-flex;flex-direction:column;align-items:center;gap:0}.fd-rc>span{display:flex;align-items:flex-end}.fd-rc small{white-space:nowrap;font-size:11.5px;text-transform:none;letter-spacing:0;line-height:1.1}
.fd-rc b{font-size:16px;margin-right:2px}.fd-rsep{font-weight:800;font-size:18px;margin:0 4px 12px;align-self:center}
.fd-say{background:#fff9db;border-radius:14px;padding:8px 12px;margin:0 0 10px;font-size:16.5px;line-height:1.4;position:relative}
.fd-say::before{content:'🧙‍♀️ ';}
.fd-help{background:#fff3bf;border:2px dashed #fab005;border-radius:14px;padding:8px 12px;margin:0 0 10px;font-size:16px}
.fd-q{font-size:clamp(18px,2.6vw,21px);line-height:1.45;margin:4px 0 8px}
.fd-fr{font-size:1.15em}
.fd-ans{font-size:34px;font-weight:700;text-align:center;min-width:120px;margin:4px auto;border-bottom:4px solid #7c5cff;color:#7c5cff;width:max-content;padding:0 18px;font-variant-numeric:tabular-nums}
.fd-ans span{opacity:.35}.fd-ans.no{animation:fdshake .35s}
@keyframes fdshake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.fd-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:min(360px,100%);margin:8px auto 0}
.fd-pad button{font-size:26px;font-weight:700;padding:8px 0;border-radius:14px;background:#f1edff;color:#241a3d;box-shadow:0 4px 0 #b9b0d9}
.fd-pad button:active{transform:translateY(3px);box-shadow:0 1px 0 #b9b0d9}
.fd-pad .go{background:#2ecc71;color:#fff;box-shadow:0 4px 0 #1e9a53}.fd-pad .del{background:#ffe1e2}
.fd-work{background:#e6fcf5;border-radius:14px;padding:8px 12px;margin:8px 0;font-size:16px}.fd-work ol{margin:4px 0 0;padding-left:22px}.fd-reveal{margin-top:6px;font-size:18px}
.fd-fb{border-radius:12px;padding:8px 12px;margin:8px 0;font-weight:700;font-size:16px;text-align:center}.fd-fb.no{background:#fff0f0;color:#c92a2a}.fd-fb.ok{background:#ebfbee;color:#2b8a3e}
.fd-mixrow{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:nowrap;margin-top:18px}
.fd-bowlw{display:flex;flex-direction:column;align-items:center;gap:2px;font-weight:600;color:#6f6499;text-align:center;max-width:100%}.fd-bowl{width:min(250px,43vw);height:auto;overflow:visible}.fd-blab{font-size:13.5px;max-width:260px}.fd-muted{color:#9a91c4;font-weight:500}
.fd-bliq,.fd-liq{transition:transform .35s cubic-bezier(.3,1.4,.6,1)}.fd-bfill{transition:fill .35s}.fd-ripple{transform-box:fill-box;transform-origin:center}
.fd-sparkle{animation:fdspark 2.4s ease-in-out infinite}@keyframes fdspark{50%{opacity:.2}}
.fd-swirl{animation:fdswirl 3s linear infinite;transform-origin:60px 44px}@keyframes fdswirl{to{transform:rotate(360deg)}}
.fd-wheelw{display:flex;flex-direction:column;align-items:center;text-align:center;font-size:13px;color:#6f6499;flex:none}.fd-wheelw b{color:#241a3d;font-size:14.5px}.fd-wheelw .fd-wheel{width:min(150px,34vw);height:auto;overflow:visible}
.fd-hlp{animation:fdhl 1.1s ease-in-out infinite}@keyframes fdhl{50%{stroke:#ffe066;stroke-width:7}}
.fd-wheelw [data-slot]{transform-box:fill-box;transform-origin:center}
.fd-arrow{width:34px;height:52px;flex:none;align-self:center;margin:0 -4px}.fd-arrow path:first-child{animation:fdmarch 1s linear infinite}@keyframes fdmarch{to{stroke-dashoffset:-22}}
.fd-stream{position:fixed;left:0;top:0;z-index:64;pointer-events:none}
.fd-jars{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:10px 0 4px;align-items:flex-start}
.fd-jarw{display:flex;flex-direction:column;align-items:center;gap:4px}
.fd-jar{display:flex;flex-direction:column;align-items:center;background:#f8f9fa;border:3px solid #dee2e6;border-radius:16px;padding:6px 6px 5px;min-width:62px;box-shadow:0 3px 0 #ced4da;color:#241a3d;line-height:1.15}
.fd-jn{font-size:22px;font-weight:800;line-height:1;margin-top:2px}.fd-btl{display:block}
.fd-pour{background:#fff3bf;border:2px solid #fab005;color:#7a5200;border-radius:12px;padding:3px 12px;font-weight:800;font-size:15px;box-shadow:0 2px 0 #e0a800}.fd-pour:disabled{opacity:.4}
.fd-jar:active{transform:translateY(2px);box-shadow:none}.fd-jar b{font-size:15px}.fd-jar small{font-size:12px;color:#6f6499}.fd-jar.off{opacity:.45}
.fd-legend{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:center;font-size:12.5px;color:#6f6499;margin-top:8px}.fd-legend span{display:inline-flex;align-items:center;gap:4px}
.fd-need{margin:4px 0}.fd-needs{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;font-size:18px;margin:6px 0}.fd-needs span{display:inline-flex;align-items:center;gap:4px}.fd-need p{text-align:center;font-size:16px}
.fd-lights{display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap}.fd-light{width:min(170px,42vw);height:auto}
.fd-lsw{width:64px;height:64px;border-radius:14px;border:3px solid #2b2250;flex:none}.fd-lsw.big{width:84px;height:84px}.fd-lswc{display:flex;flex-direction:column;align-items:center;gap:2px;font-weight:700;font-size:13px;color:#6f6499}
.fd-lsw.fd-rbw,.fd-rbw.fd-lsw{background:conic-gradient(#e03131,#fd7e14,#fcc419,#37b24d,#1c7ed6,#3b3fae,#9c5bd6,#e03131)}
.fd-rbwrap{display:flex;justify-content:center}.fd-rbwrap svg{width:min(300px,80vw);height:auto}
.fd-rbb{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.fd-rbtn{display:flex;align-items:center;gap:6px;background:#f8f9fa;border:3px solid #dee2e6;border-radius:14px;padding:6px 8px;color:#241a3d;font-size:15px}.fd-rbtn.done{opacity:.3}.fd-rbtn.glow{border-color:#fab005;animation:fdglow 1s infinite}
.fd-yay{text-align:center}.fd-yay h3{font-size:24px;margin:8px 0 4px}.fd-yay-sw{display:flex;justify-content:center}.fd-stage{background:linear-gradient(90deg,#fff0f6,#fff9db,#ebfbee,#e7f5ff,#f3f0ff);border-radius:12px;padding:8px;font-weight:700;font-size:17px}
.fd-sw.pop{animation:fdpop .5s ease-out}
.fd-prisma.full .fd-orb{animation:fdorb 1.6s ease-in-out infinite;transform-origin:72px 54px}@keyframes fdorb{50%{transform:scale(1.4);opacity:.3}}
.fd-end{z-index:2}.fd-rainbowt{background:linear-gradient(90deg,#e03131,#fd7e14,#e0a800,#2f9e44,#1c7ed6,#3b3fae,#9c5bd6);-webkit-background-clip:text;background-clip:text;color:transparent}
.fd-prize{background:#f6f3ff;border-radius:18px;padding:10px;margin:8px 0}.fd-prize h3{margin:4px 0}.fd-prize p{margin:4px 0}.fd-prize small{color:#6f6499}
.fd-cham{font-size:74px;line-height:1;display:inline-block;animation:fdhue 4s linear infinite}.fd-cham.sm{font-size:40px}
@keyframes fdhue{to{filter:hue-rotate(360deg)}}
.fd-robe svg{width:110px;height:auto}.fd-robesw{width:90px;height:90px;border-radius:50%;margin:auto;background:linear-gradient(180deg,#e03131,#fd7e14,#fcc419,#37b24d,#1c7ed6,#3b3fae,#9c5bd6);}
.fd-confw{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1}
.fd-conf{position:absolute;top:-20px;width:10px;height:16px;border-radius:3px;animation:fdfall linear infinite}
@keyframes fdfall{to{transform:translateY(110vh) rotate(720deg)}}
.fd-fw{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
.fd-fw g{animation:fdboom 2.2s ease-out infinite;opacity:0;transform-box:fill-box;transform-origin:center}
@keyframes fdboom{0%{opacity:0;transform:scale(.1)}15%{opacity:1}70%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.2)}}
.fd-qcard .pav{font-size:40px}
@media(max-width:560px){.fd-jar{min-width:56px;padding:5px 2px 4px}.fd-jar small{display:none}.fd-jars{gap:4px}.fd-card{padding:14px}.fd-pad button{font-size:24px;padding:7px 0}.fd-q{font-size:18px}.fd-rbb{grid-template-columns:repeat(2,1fr)}.fd-say{font-size:15.5px}.fd-hud{padding:3px 10px 3px 5px}.fd-hd{font-size:15px}}
@media (prefers-reduced-motion:reduce){.fd-hlp,.fd-arrow path,.fd-bliq,.fd-liq,.fd-bfill{transition:none!important}.fd-sparkle,.fd-hud.ready,.fd-swirl,.fd-cham,.fd-robesw,.fd-orb,.fd-conf,.fd-fw g,.fd-sw.pop,#fdLay .fd-card,.fd-rbtn.glow{animation:none!important}}
`;
function css(){if(!document.getElementById('fdCSS')){const s=document.createElement('style');s.id='fdCSS';s.textContent=CSS;document.head.appendChild(s);}
 if(!document.getElementById('fdDefs')&&document.body)document.body.insertAdjacentHTML('beforeend',DEFS);}

/* ---------- hooks ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({
 answer(p,q,ok){if(!ok||!p||!active(p)||p!==me())return;if(Math.random()>.9)return;const k=giveDrop(p);if(!k)return;BT[k]++;
  hud(p,!NO_GRAY.includes(cur()));flyDrop(k);tn(1200+POT.indexOf(k)*150,.1,'sine',.05);},
 battle(p,r){if(!p||!r||!enabled())return;
  if(active(p)){const got=POT.filter(k=>BT[k]).map(k=>[k,BT[k]]);if(r.win&&got.length)setTimeout(()=>chip(`🎨 Found the Goblin's hidden paint: ${got.map(([k,n])=>`<span>${drop(k,18)} +${n} ${PRIM[k].n}</span>`).join('')}`),900);BT={r:0,y:0,b:0};sv();return;}
  BT={r:0,y:0,b:0};if(!r.win)return;if(whyNot(p,(p.battles||0)+1))return;PEND=p.id;PENDF=false;PEND_AT=0;},
 flee(){BT={r:0,y:0,b:0};},
 screen(name){if(!enabled()){if(name==='backpack'){const p=me();if(p)bagInject(p);}setTimeout(()=>{shimmer();chamHue();},60);return;}
  if(name!=='fade'){LAST=name;if(name!=='battle')RET=name;}
  if(name==='battle'){BT={r:0,y:0,b:0};}
  apply();const p=me();if(name==='backpack'&&p)bagInject(p);setTimeout(()=>{shimmer();chamHue();},60);
  if(PEND&&name!=='battle')setTimeout(tryFire,1200);},
 session(p){PEND=null;PENDF=false;BT={r:0,y:0,b:0};UI={key:null};closeLayer();if(!enabled()){if(OV||HUD)apply();return;}setTimeout(apply,50);
  if(p&&!whyNot(p)){PEND=p.id;PEND_AT=now()+LOGIN_WAIT;} /* a kid who has battled before: the Goblin strikes a little after they log in */
  if(p&&active(p)&&helpReady(p)&&p.fade.a.hs!==dnum()){p.fade.a.hs=dnum();setTimeout(()=>say('🎨 Prisma has an easier helper puzzle for you!'),4000);}}
});
let WAS_ON=false;
setInterval(()=>{try{if(!enabled()){if(WAS_ON){WAS_ON=false;PEND=null;closeLayer();apply();}return;} /* the event just ended: lift the gray, hide the pot */
 WAS_ON=true;apply();if(PEND)tryFire();}catch(e){}},2000);
/* the physical keyboard works on the mixing table too */
document.addEventListener('keydown',e=>{try{if(cur()!=='fade'||UI.ph!=='q'||LAY)return;if(/^[0-9]$/.test(e.key)){key(e.key);e.preventDefault();}else if(e.key==='Backspace'){key('del');e.preventDefault();}else if(e.key==='Enter'){key('go');e.preventDefault();}}catch(x){}});
/* screen registration (SCREENS may not exist yet) */
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.fade=()=>{if(!enabled()){try{go('world');}catch(e){}return;}css();draw();};}else setTimeout(reg,30);})();

/* ---------- public API ---------- */
window.Fade={
 enabled,active:p=>active(p||me()),trigger,open,hudHTML,level:p=>level(p||me()),
 _k:key,_mc:mcTap,_say:tapSpeak,_skip(){const p=me();if(!p||!p.fade.a)return;const pz=curPuzzle(p);if(!pz||!pz.bonus)return;UI.skipped=1;solve(p,pz);},_hint(){UI.hint++;snd('tap');redraw();},_cont(){UI.fb='';const p=me();const pz=UI.key==='help'?gen(p,p.fade.a,p.fade.a.s,0,true):curPuzzle(p);UI.ph=pz.kind==='mix'||pz.kind==='slot'?'mix':pz.kind==='light'?'light':pz.kind==='rainbow'?'rainbow':'solved';if(UI.ph==='solved')return solve(p,pz);redraw();},
 _add:k=>{addDrop(k);},_pour:pour,_empty:emptyBowl,_mix:doMix,_rb:rbTap,
 _lightOK(){const p=me();solve(p,curPuzzle(p));},
 _wear(el){const p=me();if(!p||!p.look)return;p.look.robe=ROBE.id;sv();snd('tap');if(el)el.outerHTML='<b style="color:#2b8a3e">✓ You\'re wearing it!</b>';},
 _buddy(el){const p=me();if(!p)return;p.pet=CHAM.id;sv();snd('tap');if(el)el.outerHTML='<b style="color:#2b8a3e">✓ Your new buddy!</b>';},
 _next(){UI={key:null};snd('tap');draw();try{window.scrollTo(0,0);}catch(e){}},_finish(){const p=me();if(p)finish(p);},_home:home,_back:back,
 _helper(){UI={key:'help',ph:'q',inp:'',miss:0,hint:0,bowl:{r:0,y:0,b:0,w:0,k:0},mm:0,fb:''};snd('tap');draw();},
 _intro(pg,inPage){if(inPage){UI.ipg=pg;draw();}else intro(pg);snd('tap');},
 _introDone(go2){const p=me();if(!p||!p.fade.a)return closeLayer();const a=p.fade.a;if(!a.in){a.in=1;POT.forEach(k=>potAdd(a,k,STARTER));}UI={key:null};sv();closeLayer();snd('tap');if(go2)open();else apply();},
 /* for the preview / parents */
 _dbg:{setSkew(ms){SKEW=ms;},force(on){FORCE=on!==false;apply();return enabled();},inWindow,window:y=>{y=y||new Date(now()).getFullYear();return [new Date(evStart(y)),new Date(evEnd(y))];},skew:()=>SKEW,mixRGB,mixHex,gen:(p,s,i,h)=>gen(p,p.fade.a,s,i,h),plan:p=>plan(p,p.fade.a),whyNot,level,
  status(p){const f=F(p),a=f.a;if(a){const z=SIZES(a.b);return {active:true,stage:a.s,i:a.i,of:z,done:totalDone(a),total:z.reduce((s,n)=>s+n,0),pot:pot(a),level:level(p),help:helpReady(p),daysIn:(now()-a.t)/DAY};}
   return {active:false,why:whyNot(p),next:f.n||0,c:f.c||0};},
  pend:()=>PEND,colors:p=>p&&p.fade&&p.fade.a?colorsDone(p,p.fade.a):0,defs,shimmer,apply,CHAM,ROBE,drop}
};
})();
