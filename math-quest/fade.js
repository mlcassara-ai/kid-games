/* ================= The Great Fade, Chapter 1 (a one-time adventure per hero, level 10+) =================
   The Grey Goblin, who HATES colors, bursts in (comic-book entrance: dance, "I HATE colors!…"), steals every color from that
   kid's world and vanishes in a grey/black poof. Prisma the Color Wizard (he took hers too) teaches the kid to mix the colors
   back on her Color Wheel with paint drops they win in battles.

   WHEN: once a hero is level 10+ (adults too), a 14-day window opens (p.fade.w1). The Goblin strikes at a random battle win
   (WIN_P) or login (LOGIN_P) inside it, and for sure by day 14 (MAX_D). After it's beaten he never comes back by himself.
   A grown-up can REPLAY it from the Parent Corner (f.rp): it starts within a few seconds of the hero's next visit to the
   World / Quest Board (a merely-standing visitor doesn't block it; an open card or scene does). Replay prize: coins and a
   rare paint splotch (no second Chameleon). Preview / test: ?fade=1, window.FADE_FORCE=true, Fade._dbg.force(true),
   localStorage 'mqFadeBeta'==='1'. Fade.trigger(P(),{force:true}) starts one now.

   THE WORLD STAYS FULLY GREY until the finale (owner's call). Progress shows on the Color Wheel (x of 7 colors), the
   checklist, Prisma's robe stripes and the little village window inside her table.
   Paint: red/yellow/blue drops come from right answers in normal battles (~0.9 per right answer); white/black are Prisma's
   free jars. Starter: 5 of each primary for grades 1–2 and 7+, 4 for grades 3–6; grade 7+ right answers find a second drop 35% of the
   time (their batches are 4–6 drops and their battles longer).
   Puzzles (gen): stage 1 = the 3 primary slots, stage 2 = mix orange, green, indigo, violet, stage 3 = bonus puzzles
   (grade 6–8: one, grade 9+/adult: two; skippable) then the Rainbow Bridge (tap the 7 colors in order).
   Each puzzle is a math question pitched about one level BELOW the kid's battle level (levels snapshot at the start, a.L),
   in grade bands 1–2, 3–4, 5–6, 7–8, 9–10, 11–12/adult, then: put drops in the mixing bowl and pour into the slot. Number
   locks come from the game's own genQ at the REAL battle level (up to 25: keypad-friendly whole-number answers only); the
   story puzzles' numbers grow with the level too. Grades 1–6 get explicit drop counts for the bowl; grade 7+ get the ratio
   and a batch size ("1 red : 1 yellow, make a 6-drop batch") and must pour exactly that batch (pz.exact).
   Coins a puzzle: 12 (grades 1–6), 15 (7+); half when the answer had to be shown (2 misses). Leftover paint: 2 coins a drop (max 60).
   Mixing rules (like real paint): one color in the bowl can be poured back; a MIXED bowl can't be un-mixed, so dumping it
   uses that paint up (2-tap confirm). The fix for a wrong mix is to ADD paint: the advice says what's wrong in words first
   ("Too much red!"), then ALL the drops to add (smallest batch that matches the recipe, within the bowl), or which jar is
   short and by how much (then: Go collect paint / dump it), or says plainly when it can't be fixed.
   Paint leaves the pot as it goes into the bowl, and the bowl is saved (a.bw), so a reload never un-mixes anything.
   Stuck kids: after 3 wrong mixes or 2 dumps on one color, or 3 days in, Prisma offers an easy helper puzzle (her secret
   paint makes that color / finishes the stage). The finale says truthfully what the kid mixed by themself.
   Finale: Prisma rainbow-poofs in, dances, praises the kid by name, waves her wand (ALL the color comes back), the Goblin
   grumbles "No fair! You win this time… but I'll be back for your colors!", then the prize card: the Color Chameleon
   (the Prismatic robe is saved for Chapter 2), coins, and Prisma buys leftover paint. Holds MQ_VISIT from the finale to the
   prize card's close, then keeps visitors quiet ~1 minute. The finale always plays over the World (the Pet Home behind it
   would show the Chameleon before the prize card).
   Speech: everything goes through the game's say()/sayV() (ttsSpeak pauses between sentences); no sound-effect words are
   spoken. Grades 1–2 hear short functional lines once, automatically (questions, "Not quite! Try again", hints, the
   "Here's how… the answer is" reveal, mixing steps, feedback, "Red is back!", the rainbow instruction, the need-paint
   screen, Prisma's helper offer); Prisma's tips and longer story cards are 🔊-button only. Grade 9+ get plainer praise.

   Popups: never starts while #modal.show is up, while MQ_VISIT.busy('fade') or outside autoPopOK() (except a parent's
   Replay). Holds MQ_VISIT 'fade' while the Goblin and Prisma's intro are on screen, and while the mixing table is open
   (so no visitor card pops over it). Works without MQ_VISIT too.
   Uses Math Quest globals at run time only: P, save, go, SCREENS, curScreen, topbar, toast, tone, SFX, PETS, ROBES, petData,
   autoPopOK, autoPopUsed, heroSVG, state, lvl, gradeExp, genQ, addXP. Hooks via window.MQ_HOOKS: answer, battle, flee, screen, session.

   Saved per player in p.fade (compact):
     c completed fades  w1 level-10 window start  n/due next times  rp replay requested  sp rare paint splotches won
     h history [[startDay,endDay,helpersUsed], …] (last 6, day = days since 1970)
     a the active fade: {v 2, x 1 = batch puzzles for grade 7+, t start ms, sd seed, b grade band 0–5, nb bonus puzzles, L {op: level} snapshot, s stage,
        i puzzle in stage, d [red,yellow,blue] drops in the pot, in intro seen, bw {k puzzle key, ok answered, m bowl drops, rv answer was shown},
        st {k,f wrong mixes,d dumps} for the current puzzle, hp last helper ms, hu helpers used, pm slots Prisma's paint made,
        rt puzzle key we already said "you have enough paint" for}
*/
(function(){
'use strict';
const EV_MONTH=10,EV_DAY=1,EV_DAYS=16; /* (old yearly window, no longer used) */
/* Since Sep 30 2026: Chapter 1 is a ONE-TIME adventure per hero (level 10+). It comes at a random battle win (WIN_P) or login
   (LOGIN_P) within 14 days (MAX_D) of reaching level 10, and for sure by then. Prize: the Color Chameleon (the Prismatic robe
   is saved for Chapter 2). A grown-up can replay it from the Parent Corner (coins and a rare paint splotch). */
const MIN_LV=10,LIVE_FROM=new Date(2026,8,30).getTime(),MIN_D=10,MAX_D=14,WIN_P=.06,LOGIN_P=.03;
const FIRST_WINS=1,GAP=[21,28],HELP_DAYS=3,POT_CAP=30,LOGIN_WAIT=25e3,VISIT_GAP=10*60e3;
/* rewards: coins per puzzle by grade band (1–2, 3–4, 5–6, 7–8, 9+), the finale, a replay, leftover paint; a little XP.
   The whole event is worth roughly 4–6 battles. */
const PZ_COINS=[12,12,12,15,15,15],FIN_COINS=200,REPLAY_COINS=150,PAINT_COIN=2,PAINT_MAX=60,PZ_XP=10,FIN_XP=50; /* a puzzle whose answer was shown (2 misses) pays half */
const EXTRA_P=.35,HELP_FAILS=3,HELP_DUMPS=2,QUIET_AFTER=60e3;
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
function lastStart(){return LIVE_FROM;}
function enabled(){return now()>=LIVE_FROM||forced()||flag();}
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
function spText(el){if(!el)return '';const c=el.cloneNode(true);c.querySelectorAll('li').forEach(x=>x.prepend(' '));c.querySelectorAll('h2,h3,p,li,.fd-q').forEach(x=>x.append(/h\d/i.test(x.tagName)&&!/[.!?]\s*$/.test(x.textContent)?'. ':' '));c.querySelectorAll('button:not(.fd-mco),.fd-mcl,.fd-spk,[aria-hidden="true"]:not(.fd-sr)').forEach(x=>x.remove());
 c.querySelectorAll('.fd-mco').forEach((b,j)=>b.replaceWith(document.createTextNode(' '+'ABC'[j]+'. '+(b.textContent||'').trim()+'. ')));const t=(c.textContent||'').replace(/\s+/g,' ').trim();const sp=gfn('speakable');return sp?sp(t):t;}
function speakEl(el){const sy=gfn('say');if(!sy||!el)return;try{speechSynthesis.cancel();}catch(e){}const t=spText(el);if(t)sy(t,.85);}
function tapSpeak(btn){try{const busy=gfn('ttsBusy');if(busy&&busy()){const st=gfn('ttsStop');if(st)st();else speechSynthesis.cancel();return;}speakEl(btn.closest('[data-spk]'));}catch(e){}}
const SPK='<button class="qspk inl fd-spk" type="button" title="Read it to me" aria-label="Read it out loud" onclick="event.stopPropagation();Fade._say(this)">🔊</button>';
let SPOKE='',LASTPZ=null;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- state ---------- */
function F(p){if(!p.fade||typeof p.fade!=='object')p.fade={};const f=p.fade;if(f.a&&f.a.v!==2){f.a.v=2;f.a.s=0;f.a.i=0;} /* v1 beta fades restart on the 7-color plan */if(!Array.isArray(f.h))f.h=[];f.c=f.c||0;
 if(f.a&&!f.a.L)f.a.L=snapL(p); /* fades started before the level snapshot existed */
 if(f.a&&f.a.nb==null&&(f.a.s||0)<2){f.a.b=bandOf(p);f.a.nb=nbOf(p);} /* …and before the 5 grade bands: safe to update until the bonus stage */
 if(f.a&&enabled()&&(f.a.t||0)<lastStart()){f.a.t=now();f.a.in=0;delete f.a.hp;delete f.a.hs;} /* last year's unfinished Fade: keep its progress, Prisma says hello again */
 return f;}
const grade=p=>p&&p.adult?13:(+(p&&p.grade)||3);
/* grade bands: 0 = grades 1–2, 1 = 3–4, 2 = 5–6, 3 = 7–8, 4 = 9–10, 5 = 11–12 and grown-ups */
const bandOf=p=>{const g=grade(p);return g<=2?0:g<=4?1:g<=6?2:g<=8?3:g<=10?4:5;};
const teen=a=>!!a&&(a.b||0)>=4; /* grade 9+ and grown-ups: plainer praise */
const starter=p=>youngR(p)||bandOf(p)>=3?5:4; /* grade 7+ batches use more paint: 5 to start, like grades 1–2 */
const nbOf=p=>{const g=grade(p);return g>=9?2:g>=6?1:0;}; /* bonus puzzles before the rainbow */
const nbA=a=>a.nb!=null?a.nb:(a.b>=3?1:0);
/* the kid's level in an op (as battles see it), snapshot when the Fade starts so a puzzle never changes under them */
function lvNow(p,op){try{if(typeof lvl==='function'&&p.skill&&p.skill[op]!=null)return Math.max(1,lvl(p,op));}catch(e){}try{if(typeof gradeExp==='function')return Math.max(1,gradeExp(p));}catch(e){}return grade(p)+1;}
const LV_OPS=['add','sub','mul','div','frac'];
function snapL(p){const o={};LV_OPS.forEach(op=>o[op]=lvNow(p,op));return o;}
function active(p){p=p||me();return !!(enabled()&&p&&p.fade&&p.fade.a);}
const SIZES=a=>[3,4,1+nbA(a)];
/* Owner's call (Sep 30): the world stays fully grey for the whole Fade. Progress shows on the Color Wheel and Prisma's robe;
   ALL the color comes back at once in Prisma's finale. */
function level(p){const a=p&&p.fade&&p.fade.a;if(!a)return 0;return 1;}
function totalDone(a){const z=SIZES(a);let n=0;for(let s=0;s<a.s&&s<z.length;s++)n+=z[s];return n+(a.s<z.length?a.i:0);}

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
 if(k){if(!pT&&!w)return PRIM.k.rgb.slice();const f=1-Math.min(.86,k/T*2.6);c=c.map((v,i)=>v*f+PRIM.k.rgb[i]*(1-f)*.35);} /* indigo (3 blue + 1 black) comes out deep, not pale */
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
/* primaries (poured straight in) → 4 mixes → bonus puzzles (grade 6+) → the Rainbow Bridge finale */
const SEVEN=['r','o','y','g','b','i','v'];
const RBOW={r:'#e03131',o:'#fd7e14',y:'#fcc419',g:'#37b24d',b:'#1c7ed6',i:'#3b3fae',v:'#9c5bd6'};
const CNAME={r:'red',o:'orange',y:'yellow',g:'green',b:'blue',i:'indigo',v:'violet'};
const RECIPE={r:{r:1},y:{y:1},b:{b:1},o:{r:2,y:2},g:{y:2,b:2},i:{b:3,k:1},v:{r:1,b:1,w:1}};
const MIX_ORDER=['o','g','i','v'];
/* grade 7+: the simplest ratio and the batch sizes Prisma asks for (multiples of the ratio) */
const RATIO={o:{r:1,y:1},g:{y:1,b:1},i:{b:3,k:1},v:{r:1,b:1,w:1}},BATCH={o:[2,3],g:[2,3],i:[1],v:[1,2]}; /* batches of 4–6 drops: still worked out, but cheap in paint */
const pk2=(arr,R)=>arr[Math.floor(R()*arr.length)];
const PARTS={o:['r','y'],g:['y','b'],i:['b','k'],v:['r','b','w']};
const Cap=s=>s[0].toUpperCase()+s.slice(1);
const cwc=c=>`<b class="fd-cw" style="color:${c==='y'?'#b08800':RBOW[c]}">${CNAME[c]}</b>`;
/* Prisma's tip for each color, shown with its own puzzle (never talks about a color before its turn) */
const TIP={o:'Red and yellow make <b>orange</b>!',g:'Yellow and blue make <b>green</b>!',i:'<b>Indigo</b> is a deep, dark blue: blue with a little <b>black</b>.',
 v:'<b>Violet</b> is a bright, bluish purple. Red and blue make purple, and <b>white</b> makes it brighter: 1 red + 1 blue + 1 white.'};
/* recipes: "2 red + 2 yellow" for grades 1–4, ratio notation "2 red : 2 yellow" from grade 5 */
const sepOf=a=>a&&a.b>=2?':':'+';
const recTxt=(m,sep)=>KEYS.filter(k=>m[k]).map(k=>`<b>${m[k]}</b> ${PRIM[k].n}`).join(sep===':'?' : ':' + ');
/* Prisma's recipe book: other shades, for the ratio / percent puzzles (so the answers aren't always 1 : 1 or 50%) */
/* f = the rainbow color it's a cousin of, so the orange puzzle talks about orange-ish shades */
const SHADES=[{n:'red-orange',f:'o',m:{r:3,y:2}},{n:'yellow-orange',f:'o',m:{r:2,y:3}},{n:'yellow-green',f:'g',m:{y:3,b:1}},{n:'teal',f:'g',m:{y:2,b:3}},
 {n:'sky blue',f:'i',m:{b:1,w:4}},{n:'pink',f:'v',m:{r:1,w:3}},{n:'olive',f:'g',m:{y:4,k:1}},{n:'navy blue',f:'i',m:{b:4,k:1}},{n:'rose',f:'v',m:{r:7,w:3}},{n:'sea green',f:'g',m:{y:3,b:7}},
 {n:'sunshine',f:'o',m:{r:1,y:9}},{n:'lime',f:'g',m:{y:3,b:2}},{n:'spring green',f:'g',m:{y:9,b:11}},{n:'storm blue',f:'i',m:{b:3,k:2}},{n:'tangerine',f:'o',m:{r:13,y:12}}];
const SHADES3=[{n:'lavender',f:'v',m:{r:2,b:3,w:5}},{n:'mint',f:'g',m:{y:1,b:1,w:3}},{n:'coral',f:'o',m:{r:5,y:2,w:1}},{n:'peach',f:'o',m:{r:1,y:2,w:5}},{n:'lilac',f:'v',m:{r:3,b:2,w:5}}];
/* a shade that fits the puzzle's shape, from the target color's family when there is one */
function shade(list,c,pk,ok){const L=list.filter(ok||(()=>true)),F=L.filter(x=>x.f===c);return pk(F.length?F:L);}
const shTxt=sh=>recTxt(sh.m,':');
const gcd=(x,y)=>y?gcd(y,x%y):x;
const dropsPic=(k,n)=>`<span class="fd-dpic">${Array(n).fill(drop(k,20)).join('')}<span class="fd-sr"> ${n} ${PRIM[k].n} drop${n>1?'s':''} </span></span>`;
/* a visible "+" that reads as "plus"; END closes a picture sum with a period, so the question after it is its own sentence */
const PLUS='<b class="fd-plus" aria-hidden="true">+</b><span class="fd-sr"> plus </span>',END='<span class="fd-sr">. </span>';
const mcDrops=m=>Object.keys(m).filter(k=>m[k]).map(k=>dropsPic(k,m[k])).join(PLUS);
function mcOpts(R,correct,wrongs){const all=[correct,...wrongs.slice(0,2)];for(let j=all.length-1;j>0;j--){const q=Math.floor(R()*(j+1));[all[j],all[q]]=[all[q],all[j]];}return {mc:all,a:all.indexOf(correct)};}
/* which puzzle type, by grade band: [slot r, slot y, slot b], [orange, green, indigo, violet], rainbow.
   'lock:op' = a number-lock question from the game's own battle generator (genQ), one level below the kid's level in that op. */
function typeFor(a,s,i,T){const b=a.b;
 if(s===0)return [[T('add')<=1?'addpics':'lock:add','countup',T('add')<=1?'droppers':'lock:sub'],['lock:add','half','lock:mul'],['pctOf','lock:mul','lock:div'],['pctOf2','lock:mul','lock:div'],['pctOf2','lock:div','lock:mul'],['pctChange','lock:mul','lock:div']][b][i];
 if(s===1)return [['pick',T('add')<=1?'addpics':'lock:add','bowlpick','lock:sub'],['pick','scale','bowlpick','groups'],['ratioMC','scale','pctMC','scale'],['rscale','pctVar','batches','rscale3'],['rpart','pctBack','batches2','ratioSolve'],['propX','mixPct','system','hexMC']][b][i];
 return ['countup7','groups7','stripesLeft','pctLeft','arith','arith2'][b];}
/* numbers that grow with the kid's level T (already one below their battle level) */
const grow=(T,a)=>a[Math.max(0,Math.min(a.length-1,T-1))];
/* a battle-style question from the game itself, at the kid's REAL battle level (one below). genQ is random: it runs on Prisma's
   seeded dice so it never changes on redraw. Only questions with ONE whole-number answer the keypad can type (no minus sign, no
   two-box or picture questions); if a level only has those now and then, it tries a level lower, and finally the basic ones. */
const okLock=x=>x&&!x.rev&&!x.choices&&!x.vis&&x.kind!=='clock'&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<=99999&&(x.tpl?(x.tpl.match(/\{A\}/g)||[]).length===1&&!/\{[B-Z]\}/.test(x.tpl):typeof x.text==='string'&&x.text.length<40);
function lockQ(op,T,R){if(typeof genQ!=='function')return null;const MR=Math.random;let q=null;
 try{Math.random=R;const top=Math.max(1,Math.min(25,T));
  for(let L=top;L>=Math.max(1,top-4)&&!q;L--){let any=null;for(let n=0;n<16&&!q;n++){let x=null;try{x=genQ(op,L);}catch(e){x=null;}if(!okLock(x))continue;any=any||x;
   /* skip the dull ones (× 1, ÷ 1, 6 − 6) when the dice allow */if(!x.tpl&&((op==='mul'||op==='div')&&(x.a<=1||x.b<=1||x.answer<=1)||op==='sub'&&x.answer===0))continue;q=x;}q=q||any;}
  if(!q)for(let n=0;n<12&&!q;n++){const x=genQ(op,Math.min(10,top));if(okLock(x))q=x;}}catch(e){q=null;}finally{Math.random=MR;}return q;}
/* a hint that fits the question (never "tens and ones" for 672 × 3) */
const stripP=h=>String(h||'').replace(/<\/?p>/g,' ').replace(/\s+/g,' ').trim();
function lockWork(op,q){const t=E_(q.text);
 if(q.tpl){const n=stripP(q.nudge);const pr=q.prompt?stripP(q.prompt):'';return (n?[n]:[]).concat([`${pr?pr+(/[.?!:]$/.test(pr)?' ':': '):''}${q.tpl.replace('{A}','?')}`]);}
 const a=q.a,b=q.b;
 if(op==='add')return [q.c!=null?'Add two of the numbers first, then add the third.':Math.max(a,b)>=100?'Line them up. Add the ones, then the tens, then the hundreds (carry when a column makes 10 or more).':'Add the ones first, then the tens.',`${t} = ?`];
 if(op==='sub')return [Math.max(a,b)>=100?'Line them up. Subtract the ones, then the tens, then the hundreds (borrow when you need to).':'Take away the ones first, then the tens. Or count up from the smaller number.',`${t} = ?`];
 if(op==='mul'){const big=Math.max(a,b),sm=Math.min(a,b);
  if(big>=100&&sm<10){const h=Math.floor(big/100)*100,te=Math.floor(big%100/10)*10,o=big%10,ps=[h,te,o].filter(x=>x);
   return [`Split ${big} into ${ps.join(' + ')} and multiply each part by ${sm}, then add.`,`${ps.map(x=>`${x} × ${sm}`).join(' + ')} = ?`];}
  if(sm>=10){const te=Math.floor(sm/10)*10,o=sm%10;return [`Split ${sm} into ${te}${o?' + '+o:''}: ${big} × ${te}${o?`, plus ${big} × ${o}`:''}.`,`${big} × ${te}${o?` + ${big} × ${o}`:''} = ?`];}
  if(big>=10){const te=Math.floor(big/10)*10,o=big%10;return [`Split ${big} into ${te}${o?' + '+o:''}, multiply each part by ${sm}, then add.`,`${te} × ${sm}${o?` + ${o} × ${sm}`:''} = ?`];}
  return [`Skip-count by ${sm||big}.`,`${t} = ?`];}
 return [`Think: what number times ${b} makes ${a}?`,b>=10?`Try 10 × ${b} = ${10*b} first, then count on by ${b}s.`:`${b} × ? = ${a}`];}
/* one question: t = type, c = target color key (slot or mix), ctx = 'slot' | 'mix' | 'fin', E = {R,ri,pk,T,a} */
function question(t,c,ctx,E){const {R,ri,pk,T}=E;const nm=cwc(c),pr=PARTS[c]||[];const P1=pr[0];
 const pn=k=>`<b class="fd-cw fd-c-${k}">${PRIM[k].n}</b>`;
 if(t.startsWith('lock:')){const op=t.slice(5),q=lockQ(op,T(op),R);if(q){const what=ctx==='slot'?`the ${nm} paint`:ctx==='mix'?`my ${nm} recipe`:'my rainbow paint';
   const eq=q.tpl?`${q.prompt?`<span class="fd-lockp">${q.prompt}</span>`:''}<span class="fd-eq">${q.tpl.replace('{A}','?')}</span>`:`<span class="fd-eq">${E_(q.text)} = ?</span>`;
   return {q:`🔒 The Grey Goblin put a number lock on ${what}! What number opens it? ${eq}`,a:q.answer,alt:Array.isArray(q.alt)?q.alt.filter(Number.isInteger):null,lock:1,work:lockWork(op,q)};}
  t=ctx==='slot'?'countup':ctx==='mix'?'scale':'countup7';}
 switch(t){
 case 'addpics':{if(ctx==='mix'&&RECIPE[c]){const R0=RECIPE[c],ks=Object.keys(R0),tot=ks.reduce((s,k)=>s+R0[k],0);
   return {q:`For ${nm}, I put these in the mixing bowl: ${ks.map(k=>dropsPic(k,R0[k])).join(PLUS)}${END} How many drops in all?`,a:tot,work:['Count them one by one.',`${ks.map(k=>R0[k]).join(' + ')} = ?`]};}
  const x=ri(1,2),y=ri(1,2);return {q:`To fill the ${nm} slot, count my drops: ${dropsPic(c,x)}${PLUS}${dropsPic(c,y)}${END} How many drops in all?`,a:x+y,n:x+y,work:['Count them one by one.',`${x} + ${y} = ?`]};}
 case 'countup':{const L=T('add');let n,d;if(L<=1){n=ri(4,6);d=ri(2,Math.min(4,n-1));}else if(L<=2){n=ri(7,10);d=ri(2,6);}else if(L<=4){n=ri(12,19);d=ri(3,9);}else if(L<=6){n=ri(25,60);d=ri(6,19);}else{n=ri(120,400);d=ri(12,99);}const h=n-d;
  return {q:`My ${nm} slot holds <b>${n}</b> drops when it's full. <b>${h}</b> drop${h>1?'s are':' is'} already in it${n<=6?`: ${dropsPic(c,h)}${END}`:'.'} How many more drops will fill it up?`,a:d,n:d,pre:h,full:n,work:[`Count up from ${h} to ${n}.`,`${h} + ? = ${n}`]};}
 case 'droppers':{const e=ri(1,2);return {q:`I have <b>2</b> droppers. Each dropper holds <b>${e}</b> ${pn(c)} drop${e>1?'s':''}: ${dropsPic(c,e)}<span class="fd-sr"> and </span> ${dropsPic(c,e)}${END} How many drops in all?`,a:2*e,n:2*e,work:['Two droppers with the same number in each.',`${e} + ${e} = ?`]};}
 case 'half':{const L=Math.max(T('div'),T('mul')),h=L<=2?ri(2,5):L<=4?ri(4,10):L<=6?ri(8,25):ri(15,60);return {q:`I have <b>${2*h}</b> ${pn(c)} drops. <b>Half</b> of them go in the ${nm} slot. How many drops is half?`,a:h,n:h,work:h>=10&&(2*h)%10?['Half means 2 equal groups.',`Half of ${2*h-(2*h)%10} is ${(2*h-(2*h)%10)/2}, and half of ${(2*h)%10} is ${(2*h)%10/2}. So ${2*h} ÷ 2 = ?`]:['Half means 2 equal groups.',`${2*h} ÷ 2 = ?`]};}
 case 'pctOf':{const L=T('mul'),[pc,base]=pk([[10,10],[20,5],[25,4],[50,2],[75,4]]),m=L<=4?ri(2,6):L<=7?ri(3,12):ri(5,25),tot=base*m,n=Math.round(pc*tot/100);
  return {q:`My big paint vat holds <b>${tot}</b> ${pn(c)} drops. <b>${pc}%</b> of them are saved for the Rainbow Bridge. How many drops is that?`,a:n,work:[pc===50?'50% is half.':pc===25?'25% is a quarter: half of half.':pc===75?'75% is three quarters: find a quarter, then times 3.':pc===20?'20% is one fifth.':'10% is one tenth.',`${pc}% of ${tot} = ?`]};}
 case 'pctOf2':{const L=T('mul'),[pc,base]=pk([[15,20],[12.5,8],[37.5,8],[7.5,40],[60,5],[16,25],[2.5,40],[30,10],[40,5],[35,20],[45,20],[62.5,8],[87.5,8],[65,20],[8,25]]),m=L<=10?ri(2,8):ri(3,15),tot=base*m,n=Math.round(pc*tot/100);
  return {q:`My big paint vat holds <b>${tot}</b> ${pn(c)} drops. Exactly <b>${pc}%</b> of them are saved for the Rainbow Bridge. How many drops is that?`,a:n,work:[`${pc}% means ${pc} out of 100.`,`${tot} × ${pc} ÷ 100 = ?`]};}
 case 'pick':{const lab=ks=>`<span class="fd-dpic">${ks.map(k=>drop(k,22)).join('')}</span><span>${ks.map(k=>PRIM[k].n).join(' + ')}</span>`;const W=[['r','b'],['y','b'],['r','y'],['b','k'],['r','w'],['y','w'],['y','k']].filter(x=>!x.every(k=>pr.includes(k)));
  const o=mcOpts(R,lab(pr),[lab(W[ri(0,1)]),lab(W[ri(2,4)])]);
  return Object.assign(o,{q:`Which colors make ${nm}?`,work:[c==='v'?'Violet is a bright, bluish purple. Purple comes from red and blue, and something makes it brighter…':c==='i'?'Indigo is a deep, dark blue.':c==='o'?'Orange sits between red and yellow on the color wheel.':'Green sits between yellow and blue on the color wheel.']});}
 case 'bowlpick':{const R0=RECIPE[c];const alts=[{r:2,b:2},{y:2,b:2},{r:2,y:2},{b:3,w:1},{r:1,y:1,w:1}].filter(m=>JSON.stringify(m)!==JSON.stringify(R0));
  const o=mcOpts(R,`<span class="fd-mbowl">${mcDrops(R0)}</span>`,[`<span class="fd-mbowl">${mcDrops(alts[ri(0,1)])}</span>`,`<span class="fd-mbowl">${mcDrops(alts[ri(2,3)])}</span>`]);
  return Object.assign(o,{q:`Which mixing bowl makes ${nm}?`,work:[c==='i'?'Indigo is a deep, dark blue. What makes blue darker?':`Which colors sit next to ${CNAME[c]} on the color wheel?`]});}
 case 'groups':{const L=T('mul');const g=L<=3?ri(2,3):L<=5?ri(3,5):ri(6,9),k=L<=3?pk([2,5,10]):L<=5?ri(3,9):ri(6,12);
  return {q:`For ${nm}, I fill <b>${g}</b> little pots with <b>${k}</b> drops each. How many drops is that?`,a:g*k,work:[`${g} groups of ${k}.`,`${g} × ${k} = ?`]};}
 case 'scale':{const L=Math.max(T('add'),T('mul'));
  if(c==='i'){const m=L<=3?ri(2,4):L<=6?ri(5,9):ri(11,25);return {q:`Indigo is <b>3</b> ${pn('b')} drops for every <b>1</b> ${pn('k')} drop. You have <b>${m}</b> black drops. How many blue drops do you need?`,a:3*m,work:['3 blue for each black.',`3 × ${m} = ?`]};}
  if(c==='v'){const m=L<=3?ri(2,4):L<=6?ri(5,12):ri(13,40);return {q:`Violet is <b>1</b> ${pn('r')}, <b>1</b> ${pn('b')} and <b>1</b> ${pn('w')}, the same number of each. With <b>${m}</b> red drops, how many drops in all?`,a:3*m,work:[`${m} red, ${m} blue and ${m} white.`,`${m} + ${m} + ${m} = ?`]};}
  const P2=pr[1],m=L<=2?ri(2,5):L<=4?ri(6,15):L<=6?ri(16,45):ri(46,250);
  return {q:`${Cap(CNAME[c])} uses the <b>same</b> number of ${pn(P1)} and ${pn(P2)} drops. You put in <b>${m}</b> ${PRIM[P1].n} drops. How many drops in all?`,a:2*m,work:[`${m} ${PRIM[P1].n} and ${m} ${PRIM[P2].n}.`,`${m} + ${m} = ?`]};}
 case 'ratioMC':{const sh=shade(SHADES,c,pk,x=>Object.keys(x.m).length===2&&!x.m.w&&!x.m.k),[k1,k2]=Object.keys(sh.m),x=sh.m[k1],y=sh.m[k2],m=ri(2,5);
  const right=`${x} : ${y}`,W=[...new Set([`${y} : ${x}`,`${x+1} : ${y}`,`1 : 1`,`${x} : ${y+1}`].filter(s=>s!==right))];
  const o=mcOpts(R,right,[W[0],W[1]]);
  return Object.assign(o,{q:`From my recipe book: for <b>${sh.n}</b> I put <b>${x*m}</b> ${pn(k1)} and <b>${y*m}</b> ${pn(k2)} drops in the bowl. What's the ratio of ${PRIM[k1].n} to ${PRIM[k2].n}, in simplest form?`,work:[`Divide both numbers by ${m}.`,`${x*m} ÷ ${m} = ${x} and ${y*m} ÷ ${m} = ?`]});}
 case 'pctMC':{const sh=pk(SHADES.filter(x=>[4,5,10].includes(bowlN(x.m)))),ks=Object.keys(sh.m),k=pk(ks),T0=bowlN(sh.m),n=sh.m[k],pc=Math.round(n/T0*100);
  const pool=[20,25,30,40,60,70,75,80].filter(x=>x!==pc),w1=pool.splice(Math.floor(R()*pool.length),1)[0],w2=pool[Math.floor(R()*pool.length)];const o=mcOpts(R,pc+'%',[w1+'%',w2+'%']);
  return Object.assign(o,{q:`My recipe book says <b>${sh.n}</b> is ${shTxt(sh)}. What percent of the drops are ${PRIM[k].n}?`,work:[`${n} out of ${T0} drops.`,`${n} ÷ ${T0} × 100 = ?`]});}
 case 'rscale':{const sh=shade(SHADES,c,pk,x=>Object.keys(x.m).length===2),[k1,k2]=Object.keys(sh.m),T0=bowlN(sh.m),m=ri(3,9),k=pk([k1,k2]);
  return {q:`<b>${Cap(sh.n)}</b> is ${shTxt(sh)}. To make <b>${T0*m}</b> drops of ${sh.n}, how many ${pn(k)} drops do you need?`,a:sh.m[k]*m,work:[`One batch is ${T0} drops, so you need ${T0*m} ÷ ${T0} = ${m} batches.`,`${sh.m[k]} × ${m} = ?`]};}
 case 'pctVar':{const sh=pk(SHADES.filter(x=>[4,5,10,20,25].includes(bowlN(x.m)))),ks=Object.keys(sh.m),k=pk(ks),T0=bowlN(sh.m);
  return {q:`<b>${Cap(sh.n)}</b> is ${shTxt(sh)}. What percent of ${sh.n} is ${pn(k)}? (Type the number.)`,a:Math.round(sh.m[k]/T0*100),pct:1,work:[`${sh.m[k]} out of ${T0}.`,`${sh.m[k]} ÷ ${T0} × 100 = ?`]};}
 case 'batches':{const N=ri(7,23),q=Math.floor(N/3);return {q:`Indigo is <b>3</b> ${pn('b')} : <b>1</b> ${pn('k')}. You have <b>${N}</b> blue drops and plenty of black. How many drops of indigo can you make, in full batches only?`,a:q*4,work:[`${N} ÷ 3 = ${q} full batches${N%3?` (${N%3} blue left over)`:''}.`,`Each batch is 3 + 1 = 4 drops: ${q} × 4 = ?`]};}
 case 'rscale3':{const sh=shade(SHADES3,c,pk,x=>bowlN(x.m)===10),m=ri(2,9),ks=Object.keys(sh.m),k=pk(ks);
  return {q:`Violet's cousin <b>${sh.n}</b> is ${shTxt(sh)}. In a batch of <b>${10*m}</b> drops, how many ${pn(k)} drops are there?`,a:sh.m[k]*m,work:[`One batch is 10 drops, so this is ${m} batches.`,`${sh.m[k]} × ${m} = ?`]};}
 case 'rpart':{const sh=shade(SHADES3,c,pk),ks=Object.keys(sh.m),k=pk(ks.filter(x=>sh.m[x]>1)),m=ri(3,9),T0=bowlN(sh.m);
  return {q:`<b>${Cap(sh.n)}</b> is ${shTxt(sh)}. You use <b>${sh.m[k]*m}</b> ${pn(k)} drops. How many drops of ${sh.n} is that in all?`,a:T0*m,work:[`${sh.m[k]*m} ÷ ${sh.m[k]} = ${m} batches.`,`Each batch is ${T0} drops: ${T0} × ${m} = ?`]};}
 case 'pctBack':{const [pc,tot]=pk([[35,40],[15,60],[45,20],[12,25],[65,40],[28,25],[85,20],[24,75]]),part=pc*tot/100,k=pk(['r','y','b']);
  return {q:`A paint mix is <b>${pc}%</b> ${pn(k)}. It has <b>${part}</b> ${PRIM[k].n} drops. How many drops are in the whole mix?`,a:tot,work:[`${pc}% of the whole is ${part}.`,`${part} ÷ ${pc} × 100 = ?`]};}
 case 'batches2':{const sh=shade(SHADES,c,pk,x=>Object.keys(x.m).length===2&&!x.m.w),[k1,k2]=Object.keys(sh.m),a1=sh.m[k1],a2=sh.m[k2];let n1,n2,b1,b2;
  for(let g=0;g<20;g++){n1=ri(8,40);n2=ri(6,30);b1=Math.floor(n1/a1);b2=Math.floor(n2/a2);if(b1!==b2&&Math.min(b1,b2)>=2)break;}const bt=Math.min(b1,b2);
  return {q:`<b>${Cap(sh.n)}</b> is ${shTxt(sh)}. You have <b>${n1}</b> ${pn(k1)} and <b>${n2}</b> ${pn(k2)} drops. How many drops of ${sh.n} can you make, in full batches only?`,a:bt*(a1+a2),work:[`${PRIM[k1].n}: ${n1} ÷ ${a1} = ${b1} batches. ${Cap(PRIM[k2].n)}: ${n2} ÷ ${a2} = ${b2} batches. The smaller one wins: ${bt}.`,`Each batch is ${a1+a2} drops: ${bt} × ${a1+a2} = ?`]};}
 case 'ratioSolve':{const sh=shade(SHADES3,c,pk),ks=Object.keys(sh.m),k1=pk(ks.filter(x=>sh.m[x]>1)),k2=pk(ks.filter(x=>x!==k1)),m=ri(3,12);
  return {q:`<b>${Cap(sh.n)}</b> is ${shTxt(sh)}. You have <b>${sh.m[k1]*m}</b> ${pn(k1)} drops. How many ${pn(k2)} drops keep the same ratio?`,a:sh.m[k2]*m,work:[`${sh.m[k1]*m} ÷ ${sh.m[k1]} = ${m}, so the recipe is used ${m} times.`,`${sh.m[k2]} × ${m} = ?`]};}
/* grade 11–12 and grown-ups */
 case 'pctChange':{const pc=pk([15,20,25,35,40,45,60,75]),base=20*ri(2,9),up=R()<.7,d=base*pc/100,k=c==='r'||c==='y'||c==='b'?c:pk(['r','y','b']);
  return {q:`Prisma's recipe book: her big vat batch of ${pn(k)} uses <b>${base}</b> drops. For a new shade she ${up?'<b>increases</b>':'<b>decreases</b>'} the ${PRIM[k].n} by <b>${pc}%</b>. How many ${PRIM[k].n} drops does the new batch use?`,a:up?base+d:base-d,work:[`${pc}% of ${base} is ${base} × ${pc} ÷ 100 = ${d}.`,`${base} ${up?'+':'−'} ${d} = ?`]};}
 case 'propX':{const sh=pk(SHADES.filter(x=>Object.keys(x.m).length===2)),[k1,k2]=Object.keys(sh.m),a1=sh.m[k1],a2=sh.m[k2],T0=a1+a2,m=ri(4,15);
  if(R()<.5)return {q:`<b>${Cap(sh.n)}</b> is ${shTxt(sh)}. Prisma's vat holds <b>x</b> ${pn(k1)} drops and <b>${a2*m}</b> ${pn(k2)} drops, in the same ratio. Solve <span class="fd-eq">x / ${a2*m} = ${a1} / ${a2}</span> What is x?`,a:a1*m,work:[`Cross-multiply: ${a2} × x = ${a1} × ${a2*m} = ${a1*a2*m}.`,`x = ${a1*a2*m} ÷ ${a2} = ?`]};
  return {q:`<b>${Cap(sh.n)}</b> is ${shTxt(sh)}. A <b>${T0*m}</b>-drop batch has <b>x</b> ${pn(k1)} drops. Solve <span class="fd-eq">x / ${T0*m} = ${a1} / ${T0}</span> What is x?`,a:a1*m,work:[`Each ${T0} drops of ${sh.n} hold ${a1} ${PRIM[k1].n}. ${T0*m} ÷ ${T0} = ${m} batches.`,`x = ${a1} × ${m} = ?`]};}
 case 'mixPct':{let nA,nB,pA,pB,res;for(let g=0;g<60;g++){nA=10*ri(1,6);nB=10*ri(1,6);pA=10*ri(1,9);pB=10*ri(1,9);if(pA===pB)continue;const bl=nA*pA+nB*pB;if(bl%(nA+nB)===0&&(nA!==nB||g>40)){res=bl/(nA+nB);break;}}
  if(res==null){nA=20;nB=30;pA=30;pB=80;res=60;}const k=c==='g'||c==='i'?'b':c==='o'?'y':'r';
  return {q:`Batch A has <b>${nA}</b> drops and is <b>${pA}%</b> ${pn(k)}. Batch B has <b>${nB}</b> drops and is <b>${pB}%</b> ${pn(k)}. Prisma pours them together. What percent of the new mix is ${PRIM[k].n}? (Type the number.)`,a:res,pct:1,work:[`${PRIM[k].n} drops: ${pA}% of ${nA} = ${nA*pA/100}, and ${pB}% of ${nB} = ${nB*pB/100}. Together ${(nA*pA+nB*pB)/100} out of ${nA+nB}.`,`${(nA*pA+nB*pB)/100} ÷ ${nA+nB} × 100 = ?`]};}
 case 'system':{const x=ri(4,20);if(R()<.5){const k=ri(2,5),Tt=x*(1+k);return {q:`Prisma mixes <b>x</b> ${pn('r')} drops and <b>y</b> ${pn('b')} drops: <span class="fd-eq">x + y = ${Tt} &nbsp; and &nbsp; y = ${k}x</span> How many red drops (x)?`,a:x,work:[`Swap y for ${k}x: x + ${k}x = ${Tt}, so ${1+k}x = ${Tt}.`,`x = ${Tt} ÷ ${1+k} = ?`]};}
  const d=ri(2,12),Tt=2*x+d;return {q:`Prisma mixes <b>x</b> ${pn('y')} drops and <b>y</b> ${pn('b')} drops: <span class="fd-eq">x + y = ${Tt} &nbsp; and &nbsp; y = x + ${d}</span> How many yellow drops (x)?`,a:x,work:[`Swap y for x + ${d}: 2x + ${d} = ${Tt}, so 2x = ${Tt-d}.`,`x = ${Tt-d} ÷ 2 = ?`]};}
 case 'hexMC':{const [hx]=pk(HEX),rgb=[0,2,4].map(j=>parseInt(hx.slice(j,j+2),16)),sw=hx.slice(4,6)+hx.slice(2,4)+hx.slice(0,2),fl=hx.slice(0,2)+hx[3]+hx[2]+hx.slice(4,6);
  const W=[...new Set([sw,fl,hx.slice(2,4)+hx.slice(0,2)+hx.slice(4,6)].filter(x=>x!==hx))];const o=mcOpts(R,'#'+hx,['#'+W[0],'#'+W[1]]);
  return Object.assign(o,{q:`Screens write colors as <b>hex codes</b>, #RRGGBB: two base-16 digits each for red, green and blue (A = 10 … F = 15). Which hex code is the light color <b>(${rgb.join(', ')})</b>?`,work:['The pairs go in order: red first, then green, then blue.',`Red ${rgb[0]} = ${Math.floor(rgb[0]/16)} sixteens + ${rgb[0]%16} ones, so the red pair is ${hx.slice(0,2)}.`]});}
 case 'arith2':{const v=ri(3,9),d=pk([2,3,4,5]);return {q:`On the Rainbow Bridge each stripe is <b>${d} cm</b> wider than the stripe inside it. The inside stripe (violet) is <b>${v} cm</b> wide. What is the <b>total</b> width of all 7 stripes, in cm?`,a:7*(v+3*d),work:[`The widths make an arithmetic sequence: the 7th (red) is ${v} + 6 × ${d} = ${v+6*d}.`,`Sum = 7 × (${v} + ${v+6*d}) ÷ 2 = ?`]};}
 /* the rainbow (stage 3) */
 case 'countup7':{const L=T('add'),v=pk(L>=3?['left','left','prim','two']:['left','left','prim']);
  if(v==='prim')return {q:`A rainbow has <b>7</b> colors. <b>3</b> of them are painter's primary colors: red, yellow and blue. How many colors are <b>not</b> primary colors?`,a:4,work:['Count up from 3 to 7.','3 … 4, 5, 6, 7']};
  if(v==='two')return {q:`I'm painting <b>2</b> rainbows. Each rainbow has <b>7</b> stripes. How many stripes in all?`,a:14,work:['7 and 7 more.','7 + 7 = ?']};
  const k=ri(1,6);return {q:`My rainbow has <b>7</b> stripes. I painted <b>${k}</b> of them. How many stripes are left to paint?`,a:7-k,work:[`Count up from ${k} to 7.`,`${k} + ? = 7`]};}
 case 'groups7':{const L=T('mul'),k=L<=3?pk([2,5,10]):L<=5?ri(3,9):ri(11,15);return {q:`My rainbow has <b>7</b> stripes. Each stripe needs <b>${k}</b> drops of paint. How many drops in all?`,a:7*k,work:[`7 groups of ${k}.`,`7 × ${k} = ?`]};}
 case 'stripesLeft':{const k=ri(6,15),s=ri(2,5);return {q:`My rainbow has <b>7</b> stripes, and each stripe needs <b>${k}</b> drops. I've painted <b>${s}</b> stripes. How many drops do I still need?`,a:(7-s)*k,work:[`7 − ${s} = ${7-s} stripes left.`,`${7-s} × ${k} = ?`]};}
 case 'pctLeft':{const k=pk([8,9,11,12,13,14]);return {q:`Each of the <b>7</b> rainbow stripes uses <b>${k}%</b> of my paint. What percent of the paint is left after all 7 stripes? (Type the number.)`,a:100-7*k,pct:1,work:[`7 × ${k}% = ${7*k}%.`,`100 − ${7*k} = ?`]};}
 case 'arith':{const v=ri(3,8),d=pk([2,3,4,5]);return {q:`On the Rainbow Bridge, each stripe is <b>${d} cm</b> wider than the stripe inside it. The inside stripe (violet) is <b>${v} cm</b> wide. How wide is the outside stripe (red), the 7th one?`,a:v+6*d,work:[`From violet to red is 6 steps of ${d} cm.`,`${v} + 6 × ${d} = ?`]};}
 }
 return {q:'How many colors are in a rainbow?',a:7,work:['Red, orange, yellow, green, blue, indigo, violet.']};}
const E_=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
/* the bonus puzzles before the rainbow (grade 6–8: one, grade 9+: two). All skippable. */
const HEX=[['FF8000','80'],['3CB371','B3'],['8A2BE2','2B'],['FF6347','63'],['4682B4','82'],['DAA520','A5'],['20B2AA','B2'],['9ACD32','CD']];
function bonusQ(a,i,R,ri,pk,key){const g9=a.b>=4,v=g9?(i===0?'hex':pk(['angle','ink'])):pk(['light','ink','angle']);
 if(v==='hex'){const [hx,gg]=pk(HEX),rgb=[0,2,4].map(j=>parseInt(hx.slice(j,j+2),16)),hi=parseInt(gg[0],16);
  return {key,kind:'light',sub:'hex',bonus:1,slot:'c',name:'Hex color codes',light:rgb,hex:hx,q:`<b>Bonus:</b> screens write colors as <b>hex codes</b>, #RRGGBB: two base-16 digits each for red, green and blue (A = 10 … F = 15). In <b>#${hx}</b> the green part is <b>${gg}</b>. What is ${gg} in base 10?`,a:rgb[1],work:[`In base 16 the left digit counts sixteens and the right digit counts ones. ${/[A-F]/.test(gg)?`(${[...new Set(gg.split('').filter(x=>/[A-F]/.test(x)))].map(x=>`${x} = ${parseInt(x,16)}`).join(', ')}.) `:''}${gg} = ${hi} sixteens + ${parseInt(gg[1],16)} ones.`,`${hi} × 16 + ${parseInt(gg[1],16)} = ${hi*16} + ${parseInt(gg[1],16)} = ?`],after:`Yes! #${hx} is (${rgb.join(', ')}): ${rgb[0]} red, ${rgb[1]} green and ${rgb[2]} blue light.`};}
 if(v==='angle'){const r0=g9?pk([212,251,197,293,236]):pk([137,104,77,53,121]),ans=(r0+180)%360;
  return {key,kind:'angle',bonus:1,slot:'c',name:'Color-wheel angles',ang:r0,q:`<b>Bonus:</b> on a 360° color wheel, a color's <b>complement</b> sits straight across. A color sits at <b>${r0}°</b> on my wheel. At how many degrees is its complement?${g9?' (Answer between 0 and 359.)':''}`,a:ans,work:['Straight across is half a turn: 180°.',r0+180>=360?`${r0} + 180 = ${r0+180}, and a full turn is 360: ${r0+180} − 360 = ?`:`${r0} + 180 = ?`],after:'Yes! Complementary colors sit 180° apart, half a turn, like orange and blue.'};}
 if(v==='ink'){const r0=pk([55,105,155,200,73,188]);return {key,kind:'light',sub:'ink',bonus:1,slot:'c',name:'Light and ink',light:[r0,255,255],ink:1,q:`<b>Bonus:</b> screens use light (red, green, blue); printers use ink (cyan, magenta, yellow). Cyan ink = 255 − red light. If red is <b>${r0}</b>, how much cyan?`,a:255-r0,work:[`255 − ${r0} = ?`],after:`Yes! Cyan ${255-r0}: less red light means more cyan ink.`};}
 return {key,kind:'light',sub:'light',bonus:1,slot:'c',name:'Mixing light',light:[255,128,0],q:'<b>Bonus:</b> screens mix <b>light</b>. Orange light is <b>255</b> red, <b>half of 255</b> green (round up) and <b>0</b> blue. How much green?',a:128,work:['255 ÷ 2 = 127.5','Round up.'],after:'Yes! Orange light = (255, 128, 0).'};}
function gen(p,a,s,i,helper){
 const R=mulberry((a.sd|0)+s*101+i*13+(helper?777:0)),ri=(x,y)=>x+Math.floor(R()*(y-x+1)),pk=arr=>arr[Math.floor(R()*arr.length)];
 const Lv=a.L||{},T=op=>Math.max(1,(Lv[op]||lvNow(p,op))-1),E={R,ri,pk,T,a};
 if(helper){const x=ri(2,5),y=ri(1,3);return {key:'help',kind:'help',name:'Prisma\'s secret paint',mix:{r:1,y:1,b:1},q:`${teen(a)?'A quick one:':'Easy one!'} I have <b>${x}</b> drops of secret paint and find <b>${y}</b> more. How many drops now?`,a:x+y,work:[`Start at ${x}.`,`Count up ${y} more.`]};}
 const key=s+'.'+i;
 /* a second set of dice for the bowl, so the question itself never changes */
 const R2=mulberry((a.sd|0)+s*101+i*13+555),r2=(x,y)=>x+Math.floor(R2()*(y-x+1));
 if(s===0){const c=['r','y','b'][i],t=typeFor(a,s,i,T),Q=question(t,c,'slot',E);const own=Q.n>=2&&Q.n<=4,n=own?Q.n:r2(2,4);
  /* sec: the drop count IS the answer, so the need-paint screen must not show it */
  return Object.assign({key,kind:'slot',k:c,slot:c,type:t,name:Cap(CNAME[c]),mix:{[c]:n},sec:own&&Q.a===n?1:0},Q);}
 if(s===1){const c=MIX_ORDER[i],t=typeFor(a,s,i,T),Q=question(t,c,'mix',E);
  /* grade 7+: Prisma gives the ratio and a batch size; the kid works out the drops (exact = only that batch pours).
     a.x: only Fades started with this version, so a bowl mixed for the old recipe is never stranded */
  if((a.b||0)>=3&&a.x){const ra=RATIO[c],m=pk2(BATCH[c],R2),mix={};Object.keys(ra).forEach(k=>mix[k]=ra[k]*m);
   return Object.assign({key,kind:'mix',slot:c,type:t,name:Cap(CNAME[c]),mix,ratio:ra,batch:bowlN(mix),exact:1,hide:t==='pick'||t==='bowlpick'},Q);}
  return Object.assign({key,kind:'mix',slot:c,type:t,name:Cap(CNAME[c]),mix:Object.assign({},RECIPE[c]),hide:t==='pick'||t==='bowlpick'},Q);}
 const z=SIZES(a);if(i<z[2]-1)return bonusQ(a,i,R,ri,pk,key);
 const t=typeFor(a,2,0,T),Q=question(t,'r','fin',E);
 return Object.assign({key,kind:'rainbow',slot:'c',type:t,name:'The rainbow',mix:{r:1,y:1,b:1},after:'Now paint the rainbow! Tap the 7 colors in order, from the outside in.'},Q);}
const plan=(p,a)=>SIZES(a).map((n,s)=>Array.from({length:n},(_,i)=>gen(p,a,s,i)));
function curPuzzle(p){const a=p.fade.a;if(!a)return null;const z=SIZES(a);if(a.s>=z.length)return null;return gen(p,a,a.s,a.i);}
/* primaries the current (and next) puzzle's bowl needs */
function needs(p){const a=p.fade.a;const z=SIZES(a),out={r:0,y:0,b:0};let s=a.s,i=a.i;
 for(let n=0;n<2&&s<z.length;n++){const pz=gen(p,a,s,i);if(pz.kind==='mix'||pz.kind==='slot')['r','y','b'].forEach(k=>out[k]+=pz.mix[k]||0);i++;if(i>=z[s]){s++;i=0;}}return out;}
const POT=['r','y','b'];
const pot=a=>{if(!Array.isArray(a.d))a.d=[0,0,0];return {r:a.d[0],y:a.d[1],b:a.d[2]};};
function potAdd(a,k,n){pot(a);const j=POT.indexOf(k);if(j<0)return;a.d[j]=Math.max(0,Math.min(POT_CAP,a.d[j]+n));}
/* the mixing bowl is saved with the puzzle it belongs to (a.bw), and its paint has already left the pot */
const Z5=()=>({r:0,y:0,b:0,w:0,k:0});
const bowlFor=(a,key)=>a&&a.bw&&a.bw.k===key&&a.bw.m?a.bw.m:null;
/* paint still missing for a puzzle (pot + what's already in its bowl) */
function short(p,pz){if(!pz||!pz.mix||!(pz.kind==='slot'||pz.kind==='mix'))return null;const a=p.fade.a,pt=pot(a),bw=bowlFor(a,pz.key)||{},o={};let any=false;POT.forEach(k=>{const n=(pz.mix[k]||0)-pt[k]-(bw[k]||0);if(n>0){o[k]=n;any=true;}});return any?o:null;}

/* ---------- world color: a grayscale layer above the game (the paint pot HUD and Prisma sit above it, in color) ---------- */
let OV=null,HUD=null,LAY=null,TW=null,CUR_L=null;
function ov(){if(!OV||!OV.isConnected){OV=document.getElementById('fdGray')||document.createElement('div');OV.id='fdGray';OV.setAttribute('aria-hidden','true');document.body.appendChild(OV);}return OV;}
function setGray(l){const o=ov();CUR_L=l;if(l<=0.001){o.style.display='none';return;}o.style.display='block';const f=`grayscale(${l.toFixed(3)})`;o.style.backdropFilter=f;o.style.webkitBackdropFilter=f;}
function tween(from,to,ms,done,clip){if(TW)cancelAnimationFrame(TW.id);if(RM()||ms<=0){setGray(to);if(clip)ov().style.clipPath='';TW=null;if(done)done();return;}
 const t0=performance.now();TW={id:0};const step=t=>{const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  if(clip){setGray(from);ov().style.clipPath=`inset(0 0 0 ${(e*100).toFixed(1)}%)`;}else setGray(from+(to-from)*e);
  if(k<1)TW.id=requestAnimationFrame(step);else{TW=null;if(clip){ov().style.clipPath='';setGray(to);}if(done)done();}};TW.id=requestAnimationFrame(step);}
const NO_GRAY=['profiles','create','fade','rest','parent','lock'];
let HOLD=false; /* Prisma's finale: keep the world grey until her wand wave */
function apply(){try{const p=me(),on=active(p),scr=cur();document.documentElement.classList.toggle('fd-faded',!!((on&&!NO_GRAY.includes(scr)&&!PRE)||HOLD));
 if(!TW){if(HOLD)setGray(1);else if(!on||NO_GRAY.includes(scr)||PRE)setGray(0);else setGray(level(p));}
 hud(p,on&&!NO_GRAY.includes(scr)&&!DRAINING);}catch(e){}}
/* the game's own toasts sit just above the paint pot instead of on top of it */
function toastLift(on){try{const de=document.documentElement;if(on&&HUD&&HUD.style.display!=='none'){const r=HUD.getBoundingClientRect();if(r.height){let top=r.top;const c=document.querySelector('.fd-chip:not(.out)');if(c){const cr=c.getBoundingClientRect();if(cr.height&&cr.bottom<=r.top+1)top=cr.top;}de.style.setProperty('--fd-tb',Math.round(innerHeight-top+8)+'px');de.classList.add('fd-hudon');return;}}de.classList.remove('fd-hudon');}catch(e){}}
function hud(p,show){if(!show){if(HUD)HUD.style.display='none';toastLift(false);return;}css();
 if(!HUD||!HUD.isConnected){HUD=document.createElement('button');HUD.id='fdHud';HUD.type='button';HUD.onclick=()=>{if(cur()==='battle'){say('🎨 Finish the battle first, then visit Prisma!');return;}open();};document.body.appendChild(HUD);}
 const a=p.fade.a,pt=pot(a),pz=curPuzzle(p),help=helpReady(p),ready=help||(pz&&!short(p,pz));
 if(cur()==='battle'){toastLift(false);bchip(p,ready);return;}
 HUD.style.display='';HUD.className='fd-hud'+(ready?' ready':'');HUD.style.top='';HUD.style.left='';
 HUD.setAttribute('aria-label',`Paint pot: ${pt.r} red, ${pt.y} yellow, ${pt.b} blue. Open Prisma's mixing table.`);
 /* the World's walking pad sits bottom-left: park the pot just above it */
 const dp=document.querySelector('#app .dpad');const r=dp&&dp.offsetParent?dp.getBoundingClientRect():null;HUD.style.bottom=r&&r.height&&r.left<200?Math.round(innerHeight-r.top+8)+'px':'';
 HUD.innerHTML=`<span class="fd-h7">🌈 <b>${colorsDone(p,a)}/7</b></span><span class="fd-hpot">🎨</span>${POT.map(k=>`<span class="fd-hd" data-k="${k}">${drop(k,15)}<b>${pt[k]}</b></span>`).join('')}${help?'<span class="fd-hbang">!</span>':''}`;
 toastLift(true);wcard(p,ready);}
/* in a battle the pot is a small chip in the progress row (under the monster's name), so it never covers the spell buttons.
   A hidden twin holds its place in the row; the real chip floats above the grey layer at the same spot, so it stays in color. */
function bchip(p,ready){try{const row=document.getElementById('bprog');if(!row){HUD.style.display='none';return;}let c=document.getElementById('fdBchip');const pt=pot(p.fade.a);
 const inner=()=>POT.map(k=>`<span class="fd-hd" data-k="${k}">${drop(k,12)}<b>${pt[k]}</b></span>`).join(''); /* fresh ids each time: the twin's hidden clip paths must not be shared */
 if(!c||!row.contains(c)){if(c)c.remove();c=document.createElement('span');c.id='fdBchip';c.className='fd-bchip';c.setAttribute('aria-hidden','true');c.style.visibility='hidden';row.insertBefore(c,row.firstChild);}
 c.innerHTML=inner();HUD.className='fd-bchip fd-bfix';HUD.innerHTML=inner();HUD.setAttribute('aria-label',`Paint pot: ${pt.r} red, ${pt.y} yellow, ${pt.b} blue`);
 const r=c.getBoundingClientRect();if(!r.width){HUD.style.display='none';return;}HUD.style.display='';HUD.style.left=Math.round(r.left)+'px';HUD.style.top=Math.round(r.top)+'px';HUD.style.bottom='auto';}catch(e){}}
window.addEventListener('resize',()=>{try{if(cur()==='battle'&&HUD&&HUD.style.display!=='none'){const p=me();if(p&&active(p))bchip(p);}}catch(e){}});
/* a "Visit Prisma" button on the World (under the Quest Board button) and a card on the Quest Board while a Fade is on */
function wcard(p,ready){try{const s=cur();if(s==='world'){const top=document.querySelector('#world .wtop');if(top&&!document.getElementById('fdWchip')){const b=document.createElement('button');b.id='fdWchip';b.type='button';b.className='btn small fd-wchip';b.onclick=()=>open();top.appendChild(b);}
  const b=document.getElementById('fdWchip');if(b){b.classList.toggle('ready',!!ready);b.innerHTML=`🎨 Prisma's table${ready?' <b class="qdot">!</b>':''}`;b.style.top=document.getElementById('prChip')?'98px':'';}}
 if(s==='me'){const pg=document.querySelector('#app .mequests');if(pg){const old=pg.querySelector('.fd-qcard');const h=hudHTML(p);if(old&&old._fdh===h)return;if(old)old.remove();const zh=pg;if(zh&&h){zh.insertAdjacentHTML('afterbegin',h);const c=pg.querySelector('.fd-qcard');if(c)c._fdh=h;}}}}catch(e){}}
/* a drop flies from the battle to the pot */
function flyDrop(k){try{const box=HUD&&HUD.style.display!=='none'?HUD:null;if(!box)return;const tgt=box.querySelector(`[data-k="${k}"]`)||box;const tr=tgt.getBoundingClientRect();
 const src=document.getElementById('arena')||document.querySelector('.qcard')||document.body;const sr=src.getBoundingClientRect();
 const d=document.createElement('div');d.className='fd-fly';d.innerHTML=drop(k,26);document.body.appendChild(d);
 const x0=sr.left+sr.width/2-13,y0=sr.top+Math.min(sr.height/2,160),x1=tr.left+tr.width/2-13,y1=tr.top+tr.height/2-16;
 if(RM()){d.remove();bump(tgt);return;}
 const an=d.animate([{transform:`translate(${x0}px,${y0}px) scale(.4)`,opacity:0},{transform:`translate(${x0}px,${y0-40}px) scale(1.25)`,opacity:1,offset:.25},{transform:`translate(${x1}px,${y1}px) scale(.7)`,opacity:1}],{duration:900,easing:'cubic-bezier(.4,.1,.3,1)'});
 an.onfinish=()=>{d.remove();bump(tgt);};}catch(e){}}
function bump(el){try{el.animate([{transform:'scale(1)'},{transform:'scale(1.35)'},{transform:'scale(1)'}],{duration:350});}catch(e){}}
/* "found paint": a small one-line note that never takes a tap. It sits right next to the paint pot (where the drops go), or just
   above it when there's no room beside it; with no pot on screen, low in the middle. It follows the pot while it's up. */
function chip(html,label){try{document.querySelectorAll('.fd-chip').forEach(x=>x.remove());const c=document.createElement('div');c.className='fd-chip';c.setAttribute('role','status');c.innerHTML=html+(label?`<span class="fd-sr">${label}</span>`:'');document.body.appendChild(c);
 const place=()=>{const h=HUD&&HUD.isConnected&&HUD.style.display!=='none'&&!HUD.classList.contains('fd-bfix')?HUD.getBoundingClientRect():null,cw=c.offsetWidth,ch=c.offsetHeight;
  if(h&&h.width){if(h.right+6+cw<=innerWidth-6){c.style.left=Math.round(h.right+6)+'px';c.style.top=Math.round(h.top+(h.height-ch)/2)+'px';}else{c.style.left=Math.round(h.left)+'px';c.style.top=Math.round(h.top-ch-6)+'px';document.documentElement.style.setProperty('--fd-tb',Math.round(innerHeight-h.top+ch+14)+'px');} /* a toast goes above the chip */c.style.bottom='auto';c.style.transform='none';}
  else{const b=HUD&&HUD.isConnected&&HUD.style.display!=='none'&&HUD.classList.contains('fd-bfix')?HUD.getBoundingClientRect():null;
   if(b&&b.width){c.style.left=Math.round(Math.max(6,Math.min(b.left,innerWidth-cw-6)))+'px';c.style.top=Math.round(b.bottom+6)+'px';c.style.bottom='auto';c.style.transform='none';} /* in a battle: just under the little pot chip */
   else{c.style.left='50%';c.style.top='auto';c.style.bottom='calc(96px + env(safe-area-inset-bottom,0px))';c.style.transform='translateX(-50%)';}}};
 place();const iv=setInterval(place,250);setTimeout(()=>{c.classList.add('out');setTimeout(()=>{clearInterval(iv);c.remove();toastLift(!!HUD&&HUD.style.display!=='none'&&!HUD.classList.contains('fd-bfix'));},500);},3400);}catch(e){}}

/* ---------- paint drops from battles ---------- */
let BT={r:0,y:0,b:0};
function giveDrop(p){const a=p.fade.a,pt0=pot(a),pz=curPuzzle(p),bw=pz&&bowlFor(a,pz.key)||{},pt={r:pt0.r+(bw.r||0),y:pt0.y+(bw.y||0),b:pt0.b+(bw.b||0)},nd=needs(p);const w=POT.map(k=>pt[k]>=POT_CAP?0:1+4*Math.max(0,nd[k]-pt[k]));const T=w.reduce((s,x)=>s+x,0);if(!T)return null;
 let r=Math.random()*T,k='r';for(let j=0;j<3;j++){r-=w[j];if(r<=0){k=POT[j];break;}}potAdd(a,k,1);return k;}

/* ---------- when does the Fade come? ---------- */
function picnicOn(){try{return !!(window.Truck&&Truck._dbg&&Truck._dbg.picnicInfo&&Truck._dbg.picnicInfo().active&&Truck.enabled&&Truck.enabled(me()));}catch(e){return false;}}
/* due = the 14-day window is over (or a replay was asked for); otherwise one dice roll per chance (ROLL set by the caller) */
let ROLL=0;
/* Chapter 1 is a ONE-TIME adventure per kid: the first time a hero is level 10+, a 14-day window opens (f.w1); the Goblin strikes
   at a random battle win / login inside it and for sure by the end. After it's beaten he never returns, unless a grown-up taps
   "Replay" in the Parent Corner (f.rp), which brings him at the next chance. (Chapter 2 will get its own fields.) */
function due(p){const f=F(p);if(f.rp)return true;if(!f.w1){f.w1=now();try{sv();}catch(e){}}return now()>=f.w1+MAX_D*DAY;}
function lucky(p){if(!ROLL)return false;const r=Math.random()<ROLL;return r;}
function whyNot(p,wins){const f=F(p),t=now();if(!enabled())return 'off';if(f.a)return 'active';if(!p.setup)return 'setup';if((p.level||1)<MIN_LV)return 'level'; /* the Great Fade is for heroes at level 10 and up (everyone, adults too) */if((wins==null?p.battles||0:wins)<FIRST_WINS)return 'wins';if((f.c||0)>=1&&!f.rp)return 'done';if(!f.rp&&t<(f.n||0))return 'wait';if(!due(p)&&!lucky(p))return 'rare';
 if(picnicOn())return 'picnic';const tl=(p.troll&&p.troll.last)||0,el=(p.eagle&&p.eagle.last)||0;if(t-Math.max(tl,el)<VISIT_GAP)return 'visitor';return '';}
const CALM=['world','zone','map','quests','village','pethome','me','shop']; /* hub screens: never drain the colors in the middle of a mini-game */
let PEND_OK=false,PEND=null,PENDF=false,PENDR=false,PEND_AT=0,DRAINING=false,CLAIM=false;
const VQ=()=>{const v=window.MQ_VISIT;return v&&typeof v.busy==='function'?v:null;};
function quiet(){try{if(window.trollBusy)return false;if(document.getElementById('isRoot')||document.getElementById('cvRoot'))return false;if(document.querySelector('#modal.show'))return false;
 const v=VQ();if(v&&v.busy('fade'))return false;if(typeof autoPopOK==='function'&&!autoPopOK())return false;return true;}catch(e){return true;}}
/* hold the visitor queue while the drain + Prisma's intro are on screen */
function claim(){const v=VQ();if(!v||CLAIM)return true;try{const r=v.claim('fade',15*60e3);if(r===false)return false;CLAIM=true;}catch(e){}return true;}
function release(){if(!CLAIM)return;CLAIM=false;try{const v=window.MQ_VISIT;if(v&&typeof v.release==='function')v.release('fade');}catch(e){}tableHold();}
/* while the mixing table is open, no visitor (Dr. Quartz…) may pop a card over it: hold the visitor slot as 'fade' and give it
   back ~2 s after the kid leaves the table (MQ_VISIT.watch). If someone already holds the slot, nothing to do. */
function tableHold(){try{const v=VQ();if(!v||cur()!=='fade'||typeof v.claim!=='function')return;const mine=v.who&&v.who()==='fade';
 if(!v.claim('fade',30*60e3)||mine)return;if(typeof v.watch==='function')v.watch('fade',()=>cur()==='fade'||CLAIM||!!LAY||!!GOB||HOLD,1500);}catch(e){}}
/* a parent's Replay: starts a few seconds into the hero's next World / Quest Board visit. It may go ahead of a visitor who is
   merely standing on the map, but never over an open card, scene or popup. */
const REPLAY_AT=['world','map'];
function replayWanted(p){const f=p&&p.fade;return !!(f&&f.rp&&!f.a&&enabled()&&p.setup&&(p.level||1)>=MIN_LV);}
function overlayUp(){try{return !!(window.trollBusy||document.querySelector('#modal.show')||document.getElementById('isRoot')||document.getElementById('cvRoot')||document.getElementById('kindOv')||LAY||GOB||document.querySelector('.fd-gob'));}catch(e){return true;}}
function claimReplay(){const v=VQ();if(!v)return true;if(claim())return true;
 /* refused: fine only if the slot is taken by a visitor who is just standing on the map (nothing is open) */
 try{const who=v.who&&v.who();if(['quartz','ozzy','principal'].includes(who)&&!overlayUp())return true;}catch(e){}return false;}
function tryFire(){const p=me();if(!PEND||!p||p.id!==PEND)return;if(now()<PEND_AT)return;const s=cur();
 if(PENDR){if(!REPLAY_AT.includes(s)||overlayUp()||!replayWanted(p))return;if(!claimReplay())return;PEND=null;PENDR=false;try{if(typeof autoPopUsed==='function')autoPopUsed();}catch(e){}start(p,true);return;}
 if((PENDF?s==='battle'||NO_GRAY.includes(s):!CALM.includes(s))||LAY)return;if(!quiet())return;
 if(!PENDF){ROLL=PEND_OK?1:0;const w=whyNot(p);ROLL=0;if(w){PEND=null;PEND_OK=false;return;}}if(F(p).a){PEND=null;return;}if(!claim())return;PEND=null;PENDF=false;try{if(typeof autoPopUsed==='function')autoPopUsed();}catch(e){}start(p,true);}

/* ---------- start: the colors drain away ---------- */
function start(p,show){const f=F(p);if(f.a){release();return;}
 f.a={v:2,x:1,t:now(),sd:Math.floor(Math.random()*1e9),b:bandOf(p),nb:nbOf(p),L:snapL(p),s:0,i:0,d:[0,0,0]};sv();
 if(!show||p!==me()){release();apply();return;}
 DRAINING=true;css();hud(p,false);
 gobShow(p,()=>{whoosh();setTimeout(()=>say('Where did all the colors go?!'),600);
  tween(0,1,3000,()=>{gobRunOff(()=>{DRAINING=false;apply();setTimeout(()=>{if(me()===p&&p.fade.a&&!p.fade.a.in)intro(0);else release();},500);});});});}
/* ---------- the Grey Goblin's big entrance: runs in, dances, tells you WHY, sucks up the colors, runs off laughing ---------- */
const GOB_MOTIVE=["I HATE colors! I'm going to steal ALL your colors and make your world GREY!"];
const GOB_CRAZY=["Grey socks! Grey soup! Grey cupcakes! Grey is the BEST flavor!","Rainbows make my ears itch! Sunsets make my nose tickle!",
 "Red is too loud. Yellow is too bright. Blue is too… BLUE! Grey is just right!","I'll hide your colors where you'll NEVER find them! Probably under my bed. NO, wait, forget I said that!",
 "Purple? Yuck! Orange? Double yuck! Grey? Yummy yummy in my tummy!","My favorite color is grey. My second favorite color is… also grey!",
 "Colors are too happy! Everybody smiling all the time. Bleh! Grey is serious. Grey is FANCY!","Even my pet rock is grey. His name is Rocky. He agrees with me!"];
/* the dance and the laugh are SOUND EFFECTS, never read aloud: the bubble only shows music notes / ha-ha text */
const GOB_DANCE=["♪ ♫ ♪"];
const GOB_LAUGH=["Mwa-ha-ha! Hee hee hee!","Hee hee hee! Catch me if you can!","Mwa-ha-ha! All MINE!"];
const pickR=a=>a[Math.floor(Math.random()*a.length)];
const GOB_CAP=['Meanwhile, in Number Village…','Suddenly…!','Elsewhere, a sneaky shadow…','Oh no! Look who it is…'];
function fontLoad(){if(document.getElementById('fdBangers'))return;const l=document.createElement('link');l.id='fdBangers';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Bangers&display=swap';document.head.appendChild(l);}
/* comic-book sound-effect words: pictures of sounds, never read aloud */
function sfxWord(t,x,y,rot,col){if(!GOB)return;const L=GOB.querySelector('.fd-sfxl');if(!L)return;const e=document.createElement('div');e.className='fd-sfx';e.textContent=t;e.style.left=x+'%';e.style.top=y+'%';e.style.setProperty('--r',(rot||0)+'deg');e.style.setProperty('--c',col||'#ffd43b');L.appendChild(e);setTimeout(()=>{try{e.remove();}catch(x){}},2200);}
let GOB=null,PRE=false; /* PRE: the Goblin is still talking, colors not taken yet */
function gobVoice(t){try{const sv=gfn('sayV');if(!sv)return;const u=t.replace(/[♪…]/g,' ');sv(u,1.05);}catch(e){}}
/* wait until he has finished talking, then a short breath (never cut a sentence off); capped so a stuck voice can't stall the scene */
function afterTalk(minMs,fn){const t0=Date.now();let heard=false;const tick=()=>{let sp=false;try{const tb=gfn('ttsBusy');sp=tb?tb():(speechSynthesis.speaking||speechSynthesis.pending);}catch(e){}if(sp)heard=true;const el=Date.now()-t0;
 if(el>=12000||(el>=minMs&&!sp&&(heard||el>=minMs+400))){setTimeout(fn,heard?650:0);return;}GOBT=setTimeout(tick,120);};GOBT=setTimeout(tick,200);}
let GOBT=null;
/* sound effects (Web Audio via the game's tone()): scamper in, landing boing, dance beat, slurp into the sack, cackle */
/* the Goblin's sound effects play ~3x louder than normal game blips so they hold their own next to his voice */
const gt=(f,d,t,v,dl)=>tn(f,d,t,Math.min(.6,v*6),dl);
function sfxScamper(){for(let i=0;i<9;i++)gt(i%2?260:220,.05,'square',.03,i*.12);gt(180,.25,'sine',.06,1.15);gt(360,.3,'sine',.05,1.2);}
function sfxDance(){const B=[392,0,523,0,392,659,523,0,392,0,523,0,784,659,523,0];B.forEach((f,i)=>{if(f)gt(f,.11,'triangle',.05,i*.15);if(i%4===0)gt(90,.12,'sine',.08,i*.15);if(i%4===2)gt(1800,.03,'square',.015,i*.15);});}
function sfxSlurp(){for(let i=0;i<16;i++)gt(200+i*45,.12,'sawtooth',.02,i*.09);gt(160,.4,'sine',.07,1.5);}
function gobLaugh(){[[520,0],[470,.16],[430,.32],[560,.62],[500,.78],[450,.94],[620,1.24],[540,1.4],[470,1.56],[400,1.72]].forEach(([f,d])=>{gt(f,.12,'sawtooth',.035,d);gt(f*1.5,.1,'square',.015,d);});}
function gobBubble(t,quiet){if(!GOB)return;const b=GOB.querySelector('.fd-gsay');b.innerHTML=E(t);b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');if(!quiet)gobVoice(t);}
function gobShow(p,next){PRE=true;try{dropGob();css();const rm=RM();
 const d=document.createElement('div');d.className='fd-gob';d.setAttribute('role','dialog');d.setAttribute('aria-label','The Grey Goblin');
 d.classList.add('fd-comic');d.innerHTML=`<div class="fd-rays" aria-hidden="true"></div><div class="fd-dots" aria-hidden="true"></div><div class="fd-cap" aria-hidden="true">${pickR(GOB_CAP)}</div><div class="fd-sfxl" aria-hidden="true"></div><div class="fd-gsay" aria-live="polite"></div><div class="fd-gbody">${goblinVillainSVG()}</div><button class="fd-gskip" type="button">Tap to skip ➜</button>`;document.body.appendChild(d);GOB=d;fontLoad();
 const body=d.querySelector('.fd-gbody');let step=0,timer=null,done=false;
 const lines=[pickR(GOB_DANCE),GOB_MOTIVE[0],pickR(GOB_CRAZY)];
 const long=t=>Math.max(2600,Math.min(6500,900+t.length*55));
 const finish=()=>{if(done)return;done=true;clearTimeout(timer);PRE=false;document.documentElement.classList.add('fd-faded');next();};
 const seq=()=>{if(done||GOB!==d)return; /* a newer Goblin scene replaced this one: stop, so two never talk at once */
  if(step===0){body.className='fd-gbody in';sfxScamper();setTimeout(()=>sfxWord('BOING!',62,58,12,'#69db7c'),1100);timer=setTimeout(()=>{step=1;seq();},rm?0:1300);return;}
  if(step===1){body.className='fd-gbody dance';gobBubble(lines[0],true);sfxDance();[0,600,1200,1800].forEach((t,k)=>setTimeout(()=>sfxWord('STOMP!',k%2?54:6,k%2?68:62,k%2?10:-12,'#ffa94d'),t));timer=setTimeout(()=>{step=2;seq();},rm?1800:2400);return;}
  if(step===2){body.className='fd-gbody talk';d.classList.add('shout');gobBubble(lines[1]);afterTalk(long(lines[1])*.6,()=>{if(step===2){step=3;seq();}});return;}
  if(step===3){body.className='fd-gbody talk';d.classList.remove('shout');gobBubble(lines[2]);afterTalk(long(lines[2])*.6,()=>{if(step===3){step=4;seq();}});return;}
  if(step===4){body.className='fd-gbody grab';d.classList.add('steal');{const k=d.querySelector('.fd-gskip');if(k)k.remove();}sfxWord('SLUUURP!',58,30,-8,'#da77f2');gobBubble('Gimme gimme gimme! Into my sack, colors! You will NEVER get them back!');sfxSlurp();gobSuck(d);finish();}};
 d.querySelector('.fd-gskip').onclick=e=>{e.stopPropagation();if(step<4){clearTimeout(timer);clearTimeout(GOBT);try{speechSynthesis.cancel();}catch(x){}step=Math.max(step+1,2);seq();}};
 seq();}catch(e){PRE=false;next();}}
/* colored sparkles fly from the screen into his sack while the gray rolls in */
function gobSuck(d){if(RM())return;try{const r=d.querySelector('.fd-gbody').getBoundingClientRect();const tx=r.left+r.width*.75,ty=r.top+r.height*.55;const C=['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4dabf7','#7950f2','#da77f2'];
 for(let i=0;i<28;i++){const s=document.createElement('i');s.className='fd-spark';s.style.background=C[i%7];const x=Math.random()*innerWidth,y=Math.random()*innerHeight*.8;s.style.left=x+'px';s.style.top=y+'px';document.body.appendChild(s);
  s.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${tx-x}px,${ty-y}px) scale(.3)`,opacity:.9}],{duration:900+Math.random()*1400,delay:i*60,easing:'cubic-bezier(.5,0,.9,.6)',fill:'forwards'}).onfinish=()=>s.remove();
  setTimeout(()=>{try{s.remove();}catch(e){}},4000);}}catch(e){}}
function gobRunOff(done){if(!GOB){done();return;}if(!gobRunOff.w){gobRunOff.w=1;afterTalk(0,()=>{gobRunOff.w=0;gobRunOff2(done);});return;}gobRunOff.w=0;gobRunOff2(done);}
function gobRunOff2(done){if(!GOB){done();return;}const d=GOB;const body=d.querySelector('.fd-gbody');const sk=d.querySelector('.fd-gskip');if(sk)sk.remove();
 gobBubble(pickR(GOB_LAUGH),true);sfxWord('MWA-HA-HA!',8,30,-10,'#ff6b6b');try{speechSynthesis.cancel();}catch(e){}gobLaugh();body.className='fd-gbody dance';
 /* he vanishes in a puff of grey and black smoke */
 setTimeout(()=>{if(GOB!==d)return;sfxPoof();sfxWord('POOF!',30,40,-6,'#adb5bd');const b=d.querySelector('.fd-gsay');if(b)b.style.visibility='hidden';
  const r=body.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.5;
  if(!RM()){for(let k=0;k<16;k++){const c=document.createElement('i');c.className='fd-smoke';const sz=50+Math.random()*90;const a=k/16*Math.PI*2,dist=40+Math.random()*90;
   c.style.width=c.style.height=sz+'px';c.style.left=(cx-sz/2)+'px';c.style.top=(cy-sz/2)+'px';c.style.background=k%3===0?'#212529':k%3===1?'#6c757d':'#adb5bd';d.appendChild(c);
   c.animate([{transform:'translate(0,0) scale(.2)',opacity:.95},{transform:`translate(${Math.cos(a)*dist}px,${Math.sin(a)*dist-30}px) scale(1.4)`,opacity:.85,offset:.45},{transform:`translate(${Math.cos(a)*dist*1.4}px,${Math.sin(a)*dist*1.4-80}px) scale(1.9)`,opacity:0}],{duration:1500+Math.random()*500,easing:'ease-out',fill:'forwards'});}
   body.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.15) rotate(8deg)',opacity:.9,offset:.25},{transform:'scale(.1) rotate(-30deg)',opacity:0}],{duration:600,easing:'ease-in',fill:'forwards'});}
  else body.style.opacity='0';
  setTimeout(()=>{if(GOB===d){dropGob();done();}},RM()?600:2000);},1600);}
function sfxPoof(){for(let i=0;i<10;i++)gt(300-i*24,.18,'sawtooth',.05,i*.03);gt(70,.7,'triangle',.09,0);gt(1200,.08,'square',.03,.02);for(let i=0;i<6;i++)gt(180+Math.random()*120,.25,'sine',.04,.15+i*.07);}
/* ---------- Prisma's finale: the hero mirror of the Goblin's entrance ----------
   bright comic panel → rainbow poof (TA-DA!) → a happy twirl → kind words (by name) → wand wave: a rainbow wipe brings ALL the color
   back → the Grey Goblin peeks in, grumbles, and vanishes in a little grey poof → the prize card. */
const PRZ_CAP=['At last…!','And then…!','Hooray…!'];
function sfxChime(){[1047,1319,1568,2093,1568,2637].forEach((f,i)=>gt(f,.25,'sine',.03,i*.09));}
function sfxTwirl(){const M=[784,988,1175,1568,1175,988,1319,1568,1976,1568,1319,1047];M.forEach((f,i)=>{gt(f,.14,'triangle',.035,i*.17);if(i%3===0)gt(f/2,.2,'sine',.03,i*.17);});}
function sfxZing(){for(let i=0;i<18;i++)gt(500+i*90,.1,'sine',.025,i*.05);[1047,1319,1568,2093].forEach((f,i)=>gt(f,.6,'triangle',.03,.9+i*.12));}
function rainbowPoof(box){if(RM()||!box)return;try{const r=box.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.5;
 for(let k=0;k<18;k++){const c=document.createElement('i');c.className='fd-smoke';const sz=40+Math.random()*80,a=k/18*Math.PI*2,dist=30+Math.random()*90;c.style.width=c.style.height=sz+'px';c.style.left=(cx-sz/2)+'px';c.style.top=(cy-sz/2)+'px';c.style.background=PRISM[k%7];c.style.zIndex=1;GOB.appendChild(c);
  c.animate([{transform:'translate(0,0) scale(.2)',opacity:.95},{transform:`translate(${Math.cos(a)*dist}px,${Math.sin(a)*dist-20}px) scale(1.3)`,opacity:.8,offset:.4},{transform:`translate(${Math.cos(a)*dist*1.5}px,${Math.sin(a)*dist*1.5-70}px) scale(1.8)`,opacity:0}],{duration:1500+Math.random()*500,easing:'ease-out',fill:'forwards'});}}catch(e){}}
function greyPoof(el){if(RM()||!el)return;try{const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;for(let k=0;k<10;k++){const c=document.createElement('i');c.className='fd-smoke';const sz=30+Math.random()*50,a=k/10*Math.PI*2;c.style.width=c.style.height=sz+'px';c.style.left=(cx-sz/2)+'px';c.style.top=(cy-sz/2)+'px';c.style.background=k%2?'#495057':'#adb5bd';GOB.appendChild(c);
 c.animate([{transform:'scale(.2)',opacity:.9},{transform:`translate(${Math.cos(a)*50}px,${Math.sin(a)*50-40}px) scale(1.6)`,opacity:0}],{duration:1300,easing:'ease-out',fill:'forwards'});}}catch(e){}}
function prismaShow(p,next,line1){let done=false;const end=()=>{if(done)return;done=true;HOLD=false;try{setGray(0);ov().style.clipPath='';}catch(e){}apply();dropGob();next();};
 try{dropGob();css();fontLoad();const rm=RM();const nm=E(String(p.name||'friend').split(' ')[0]);
 const d=document.createElement('div');d.className='fd-gob fd-comic hero';d.setAttribute('role','dialog');d.setAttribute('aria-label','Prisma the Color Wizard');
 d.innerHTML=`<div class="fd-rays" aria-hidden="true"></div><div class="fd-dots" aria-hidden="true"></div><div class="fd-cap" aria-hidden="true">${pickR(PRZ_CAP)}</div><div class="fd-sfxl" aria-hidden="true"></div><div class="fd-gsay" aria-live="polite"></div><div class="fd-gbody fd-pbody" style="opacity:0">${prismaSVG({gray:.85,on:{}})}</div><button class="fd-gskip" type="button">Tap to skip ➜</button>`;
 document.body.appendChild(d);GOB=d;const body=d.querySelector('.fd-gbody');let step=0;
 const L1=`${nm}, you did it! ${line1||'You mixed orange, green, indigo and violet all by yourself!'}`,L2=`Your reward for being such a great helper? I'm giving your world its colors back!`;
 const seq=()=>{if(done||GOB!==d)return;
  if(step===0){sfxChime();rainbowPoof(body);sfxWord('TA-DA!',56,24,8,'#ffd43b');setTimeout(()=>{if(GOB!==d)return;body.style.opacity='1';body.className='fd-gbody fd-pbody pin';},rm?0:350);GOBT=setTimeout(()=>{step=1;seq();},rm?600:1700);return;}
  if(step===1){body.className='fd-gbody fd-pbody twirl';gobBubble('✨ ♪ ✨',true);sfxTwirl();sfxWord('TWIRL!',8,60,-10,'#f783ac');GOBT=setTimeout(()=>{step=2;seq();},rm?1200:2200);return;}
  if(step===2){body.className='fd-gbody fd-pbody talk';gobBubble(L1);afterTalk(2600,()=>{if(step===2){step=3;seq();}});return;}
  if(step===3){gobBubble(L2);afterTalk(2600,()=>{if(step===3){step=4;seq();}});return;}
  if(step===4){const sk=d.querySelector('.fd-gskip');if(sk)sk.remove();body.className='fd-gbody fd-pbody wave';gobBubble('Colors, come home!');sfxZing();sfxWord('ZING!',52,28,-8,'#69db7c');
   d.classList.add('steal');const w=document.createElement('div');w.className='fd-rbwave';d.appendChild(w);
   setTimeout(()=>{if(GOB!==d)return;body.innerHTML=prismaSVG({gray:0,on:ALL7()});},rm?0:900);
   HOLD=false;tween(1,0,rm?0:2600,()=>{apply();try{w.remove();}catch(e){}afterTalk(600,()=>{if(step===4){step=5;seq();}});},true);return;}
  if(step===5){/* the Goblin's last word */const g=document.createElement('div');g.className='fd-cameo';g.innerHTML=`<div class="fd-csay">No fair! You win this time… but I'll be back for your colors!</div>${goblinVillainSVG()}`;d.appendChild(g);
   try{const sv=gfn('sayV');if(sv)sv('No fair! You win this time. But I\'ll be back for your colors!',1.05);}catch(e){}
   afterTalk(2400,()=>{if(GOB!==d)return;sfxPoof();sfxWord('POOF!',66,58,6,'#adb5bd');greyPoof(g);g.style.transition='opacity .4s';g.style.opacity='0';setTimeout(end,rm?300:1500);});return;}};
 d.querySelector('.fd-gskip').onclick=e=>{e.stopPropagation();clearTimeout(GOBT);try{speechSynthesis.cancel();}catch(x){}if(step<4){step=4;seq();}};
 seq();setTimeout(()=>{if(!done&&GOB===d)end();},60000); /* safety: never strand the kid in the finale */
 }catch(e){end();}}
function dropGob(){if(GOB){try{GOB.remove();}catch(e){}GOB=null;}document.querySelectorAll('.fd-gob,.fd-spark').forEach(x=>x.remove());}
function whoosh(){for(let i=0;i<14;i++)gt(900-i*50,.22,'sine',.035,i*.1);gt(140,1.4,'triangle',.05,1.1);}
function trigger(p,o){p=p||me();if(!p)return false;o=o||{};if(!enabled()&&!o.force)return false;if(!o.force&&whyNot(p))return false;if(F(p).a)return false;
 if(p===me()&&cur()==='battle'){PEND=p.id;PENDF=!!o.force;PEND_AT=0;return true;}if(p===me())claim();start(p,p===me());return true;}

/* ---------- Prisma the Color Wizard ---------- */
const STR=[['r','#e03131'],['o','#fd7e14'],['y','#fcc419'],['g','#37b24d'],['b','#1c7ed6'],['i','#3b3fae'],['v','#9c5bd6']];
const GRY=c=>{const n=parseInt(c.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,l=Math.round(.3*r+.59*g+.11*b);return `rgb(${l},${l},${l})`;};
function prismaSVG(o){o=o||{};const u=++UID,on=o.on||{},gl=o.gray==null?1:o.gray,all=STR.every(([k])=>on[k]);
 /* Prisma the Color Wizard: a soft, rounded figure in the game's character style. Her robe's 7 stripes light up as colors come back. */
 const ROBE='M27 66 Q40 61 53 66 Q58 84 64 108 Q57 114 49 111 Q44 116 40 112 Q36 116 31 111 Q23 114 16 108 Q22 84 27 66Z';
 const band=(k,c,j)=>`<rect x="10" y="${64+j*7.2}" width="60" height="7.6" fill="${on[k]?c:GRY(c)}"/>`;
 const smile=gl>.6?'M35.5 55 Q40 57 44.5 55':'M35 54.5 Q40 59.5 45 54.5';
 return `<svg class="fd-prisma ${all?'full':''}" viewBox="-3 0 89 124" style="overflow:visible" aria-hidden="true"><defs><clipPath id="fpc${u}"><path d="${ROBE}"/></clipPath>
  <radialGradient id="fpf${u}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe3c4"/><stop offset="1" stop-color="#f4c08f"/></radialGradient>
  <linearGradient id="fph${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9775fa"/><stop offset="1" stop-color="#5f3dc4"/></linearGradient></defs>
 <ellipse cx="40" cy="118" rx="25" ry="4" fill="#0003"/>
 <g style="filter:grayscale(${gl})">
  <path d="M26 46 Q22 66 28 76 Q24 64 30 56Z M54 46 Q58 66 52 76 Q56 64 50 56Z" fill="#b197fc"/>
  <path d="M28 44 Q26 60 30 70 Q34 62 33 52 M52 44 Q54 60 50 70 Q46 62 47 52" fill="#d0bfff"/>
 </g>
 <g clip-path="url(#fpc${u})">${STR.map(([k,c],j)=>band(k,c,j)).join('')}</g>
 <path d="${ROBE}" fill="none" stroke="#3b2f6b" stroke-width="2" stroke-linejoin="round" opacity=".75"/>
 <path d="M30 66 Q40 74 50 66" fill="#fff" opacity=".85"/>
 <g style="filter:grayscale(${gl})">
  <path d="M28 70 Q20 80 22 92" stroke="#7048e8" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="22" cy="93" r="3.6" fill="url(#fpf${u})"/>
  <path d="M52 70 Q60 70 64 62" stroke="#7048e8" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M60 68 L71.5 55" stroke="#8a5a2b" stroke-width="3.2" stroke-linecap="round"/><path d="M60 68 L71.5 55" stroke="#c08a52" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="64.5" cy="61.5" r="3.6" fill="url(#fpf${u})"/>
  <circle cx="40" cy="48" r="12.5" fill="url(#fpf${u})"/>
  <path d="M28.5 46 Q30 36 40 36 Q50 36 51.5 46 Q47 41 42 42 Q36 40 32 44Z" fill="#9775fa"/>
  <ellipse cx="35.5" cy="49" rx="2.1" ry="2.6" fill="#2b2250"/><ellipse cx="44.5" cy="49" rx="2.1" ry="2.6" fill="#2b2250"/>
  <circle cx="36.3" cy="48" r=".8" fill="#fff"/><circle cx="45.3" cy="48" r=".8" fill="#fff"/>
  <path d="M33 45 Q35.5 43.5 38 45 M42 45 Q44.5 43.5 47 45" stroke="#5f3dc4" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <path d="${smile}" stroke="#a23b5a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="32.5" cy="53" rx="2.6" ry="1.6" fill="#ff8fab" opacity=".5"/><ellipse cx="47.5" cy="53" rx="2.6" ry="1.6" fill="#ff8fab" opacity=".5"/>
  <path d="M25 39 Q31 33 35 18 Q38 6 46 4 Q50 4 52 8 Q46 8 45 14 Q46 28 55 39Z" fill="url(#fph${u})"/>
  <ellipse cx="40" cy="39.5" rx="18" ry="4.2" fill="#5f3dc4"/><path d="M27 37.5 Q40 41 53 37.5" stroke="#ffd43b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M41 21 l1.4 3 3.2.35-2.4 2.15.7 3.2-2.9-1.7-2.9 1.7.7-3.2-2.4-2.15 3.2-.35Z" fill="#ffd43b"/>
  <circle cx="52" cy="8" r="2.2" fill="#ffd43b"/>
 </g>
 <circle cx="72" cy="54" r="5.5" fill="${all?'#fff':'#e9ecef'}" stroke="#6741d9" stroke-width="1.6"/><path d="M72 50.5 l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z" fill="${all?'#fab005':'#adb5bd'}"/>${all?'<circle class="fd-orb" cx="72" cy="54" r="10" fill="none" stroke="#ffe066" stroke-width="2"/>':''}
 </svg>`;}
/* the Color Wheel: 7 slots, the rainbow in order (red at the top, clockwise); a rainbow in the middle when it's all done */
/* pf: part of the highlighted slot that's already filled (a slot that 'already has 9 of 12 drops' shows it) */
function wheelSVG(p,a,sz,hl,pf){const done=doneSlots(p,a);const R=52,arc=(a0,a1,r0,r1)=>{const P=(ang,r)=>[(r*Math.cos(ang)).toFixed(2),(r*Math.sin(ang)).toFixed(2)];const[x0,y0]=P(a0,r1),[x1,y1]=P(a1,r1),[x2,y2]=P(a1,r0),[x3,y3]=P(a0,r0);return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;};
 const W=2*Math.PI/7;const seg=(k,j)=>{const a0=-Math.PI/2-W/2+j*W,d=arc(a0,a0+W,15,R),m=done[k]?RECIPE[k]:null,on=!!m;const mid=a0+W/2,lx=(R+7)*Math.cos(mid),ly=(R+7)*Math.sin(mid);
  const part=!on&&hl===k&&pf>0;return `<g data-slot="${k}"><path class="fd-sf" d="${d}" fill="${on?mixHex(m):part?RBOW[k]:'#f1f3f5'}" ${part?`fill-opacity="${(.2+.5*pf).toFixed(2)}"`:''} stroke="#2b2250" stroke-width="${on?2:1.5}" ${on?'':'stroke-dasharray="4 3"'}/><g class="fd-sp" opacity="${on?.8:0}">${on?pats(m).replace(/<rect width="100%" height="100%"/g,`<path d="${d}"`):''}</g>${hl===k?`<path class="fd-hlp" d="${d}" fill="none" stroke="#fab005" stroke-width="4" stroke-linejoin="round"/>`:''}<text x="${lx.toFixed(1)}" y="${(ly+3).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="800" fill="${on?'#2b2250':'#adb5bd'}">${CNAME[k][0].toUpperCase()}</text></g>`;};
 const c=done.c;return `<svg class="fd-wheel" viewBox="-66 -66 132 132" width="${sz}" height="${sz}" aria-hidden="true"><circle r="63" fill="#fff" opacity=".85"/>${SEVEN.map(seg).join('')}<circle r="15" fill="${c?'#fff':'#f8f9fa'}" stroke="#2b2250" stroke-width="2"/>${c?'<text y="6" text-anchor="middle" font-size="18">🌈</text>':''}</svg>`;}
function doneSlots(p,a){const o={};if(!a){SEVEN.forEach(k=>o[k]=1);o.c=1;return o;}const z=SIZES(a);for(let s=0;s<z.length;s++)for(let i=0;i<z[s];i++){if(s>a.s||(s===a.s&&i>=a.i))continue;if(s===0)o[['r','y','b'][i]]=1;else if(s===1)o[MIX_ORDER[i]]=1;else if(i===z[s]-1)o.c=1;}
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
<circle cx="-8" cy="-9" r="4" fill="#6b6d73"/><circle cx="1" cy="-12" r="4" fill="#c9c9cf"/><circle cx="9" cy="-9" r="4" fill="#9a9ca3"/><circle cx="-2" cy="14" r="2.4" fill="#6b6d73"/><circle cx="7" cy="20" r="2" fill="#6b6d73"/></g>
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
window.MQ_GOBLIN_SVG=()=>goblinVillainSVG(); /* Battle Pets uses the same Grey Goblin as the critters' boss */
/* comic-book villain version of the Grey Goblin for his big entrance: cape, sly grin, thick ink outlines */
function goblinVillainSVG(){const K='#16151c',W='3.6';return `<svg class="fd-goblin fd-vil" viewBox="0 0 170 190" aria-hidden="true">
<ellipse cx="85" cy="184" rx="52" ry="6" fill="rgba(0,0,0,.35)"/>
<path d="M50 78 Q20 120 14 176 Q50 166 85 172 Q120 166 156 176 Q150 120 120 78Z" fill="#3a3942" stroke="${K}" stroke-width="${W}" stroke-linejoin="round"/>
<path d="M58 84 Q38 124 34 166 Q60 160 85 164 Q110 160 136 166 Q132 124 112 84Z" fill="#5a5962" opacity=".7"/>
<path d="M44 78 Q60 66 85 70 Q110 66 126 78 L116 92 Q85 82 54 92Z" fill="#4a4954" stroke="${K}" stroke-width="${W}" stroke-linejoin="round"/>
<path d="M62 96 Q85 88 108 96 L114 150 Q85 158 56 150Z" fill="#7d7f88" stroke="${K}" stroke-width="${W}" stroke-linejoin="round"/>
<rect x="58" y="128" width="54" height="9" rx="3" fill="#2f2e36" stroke="${K}" stroke-width="2.5"/><rect x="78" y="126" width="14" height="13" rx="3" fill="#c9c9cf" stroke="${K}" stroke-width="2.5"/>
<path d="M66 150 L62 170 Q54 174 48 172 Q52 166 60 166 M104 150 L108 170 Q116 174 122 172 Q118 166 110 166" stroke="${K}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M66 150 L62 170 M104 150 L108 170" stroke="#5c5e66" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M108 102 Q128 92 138 70" stroke="${K}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M108 102 Q128 92 138 70" stroke="#9a9ca5" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M132 70 Q130 58 138 56 Q146 58 144 70 Q140 74 136 73Z" fill="#9a9ca5" stroke="${K}" stroke-width="3"/><path d="M139 56 L141 40" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M139 56 L141 40" stroke="#9a9ca5" stroke-width="3.5" stroke-linecap="round"/>
<g transform="translate(34 118) rotate(-10)"><path d="M-22 0 Q-28 36 0 40 Q28 36 22 0 Q12 -9 0 -7 Q-12 -9 -22 0Z" fill="#8d8f96" stroke="${K}" stroke-width="${W}"/><path d="M-11 -7 Q0 -16 11 -7" stroke="${K}" stroke-width="3.5" fill="none"/>
 <circle class="fd-sk1" cx="-9" cy="-11" r="4.5" fill="#6e7078" stroke="${K}" stroke-width="1.5"/><circle class="fd-sk2" cx="1" cy="-14" r="4.5" fill="#c9c9cf" stroke="${K}" stroke-width="1.5"/><circle class="fd-sk3" cx="10" cy="-11" r="4.5" fill="#9a9ca5" stroke="${K}" stroke-width="1.5"/></g>
<path d="M62 104 Q46 108 40 116" stroke="${K}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M62 104 Q46 108 40 116" stroke="#9a9ca5" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M44 42 L10 22 L40 62Z" fill="#a3a5ad" stroke="${K}" stroke-width="${W}" stroke-linejoin="round"/><path d="M38 44 L20 32 L38 56Z" fill="#7d7f88" opacity=".6"/>
<path d="M126 42 L160 22 L130 62Z" fill="#a3a5ad" stroke="${K}" stroke-width="${W}" stroke-linejoin="round"/><path d="M132 44 L150 32 L132 56Z" fill="#7d7f88" opacity=".6"/>
<path d="M85 14 Q122 14 128 50 Q130 82 85 84 Q40 82 42 50 Q48 14 85 14Z" fill="#aeb0b8" stroke="${K}" stroke-width="${W}"/>
<path d="M50 60 Q66 76 85 76 Q104 76 120 60 Q116 80 85 84 Q54 80 50 60Z" fill="#8e9099" opacity=".6"/>
<path d="M58 22 L62 6 L70 20 L78 2 L86 18 L96 4 L100 20 L110 8 L112 26" fill="#6e7078" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M56 40 L80 48 M114 40 L90 48" stroke="${K}" stroke-width="6" stroke-linecap="round"/>
<path d="M62 50 Q70 45 78 51 Q70 55 62 50Z M92 51 Q100 45 108 50 Q100 55 92 51Z" fill="#f1f3f5" stroke="${K}" stroke-width="2.4"/><circle cx="74" cy="51" r="2.6" fill="${K}"/><circle cx="104" cy="51" r="2.6" fill="${K}"/>
<path d="M85 50 Q96 62 90 70 Q84 70 82 64" fill="#9a9ca5" stroke="${K}" stroke-width="2.8" stroke-linejoin="round"/>
<path d="M60 66 Q85 86 112 64 Q100 74 85 75 Q70 75 60 66Z" fill="#2b2a30" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
<path d="M66 68 L70 73 L74 70 L78 75 L82 71 L86 75 L90 71 L94 75 L98 70 L102 73 L106 67" fill="#fff" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M56 30 Q64 26 72 30" stroke="#fff" stroke-width="3" opacity=".5" fill="none" stroke-linecap="round"/></svg>`;}
/* the Grey Goblin dashes across the screen with his sack while the color drains */
function gobDash(){try{if(RM())return;const d=document.createElement('div');d.className='fd-dash';d.innerHTML=goblinSVG({w:110})+'<div class="fd-hehe">Hee hee! No more color!</div>';document.body.appendChild(d);
 const a=d.animate([{transform:'translateX(-30vw)'},{transform:'translateX(40vw)',offset:.45},{transform:'translateX(45vw) translateY(-6px)',offset:.55},{transform:'translateX(130vw)'}],{duration:3000,easing:'ease-in-out'});a.onfinish=()=>d.remove();setTimeout(()=>{try{d.remove();}catch(e){}},3600);}catch(e){}}
/* ---------- the layer above the gray (Prisma's popups, celebrations) ---------- */
function layer(html,cls){dropLayer();css();LAY=document.createElement('div');LAY.id='fdLay';LAY.className=cls||'';LAY.innerHTML=html;document.body.appendChild(LAY);return LAY;}
function dropLayer(){if(LAY){LAY.remove();LAY=null;}const l=document.getElementById('fdLay');if(l)l.remove();}
function closeLayer(){dropLayer();release();}
const INTRO=[
 {t:'Oh no! The Grey Goblin!',b:'The <b>Grey Goblin</b> HATES colors. He snatched every color from your world and <b>hid them</b>. Even mine! I\'m <b>Prisma</b>, the Color Wizard.'},
 {t:'Fill all 7 colors',b:'To bring the colors back to your world, we need to fill all <b>7 colors of the rainbow</b> on my <b>Color Wheel</b>.'},
 {t:'Free paint, hidden paint',b:'Your world is already black and white, so I\'ll give you <b>white and black</b> paint for free. The Grey Goblin hid the <b>3 primary colors</b> (red, yellow, blue) inside the monsters! <b>Win battles</b> to find them. Every right answer can drop some paint!'},
 {t:'Then we mix!',b:'Then we\'ll <b>MIX</b> the other 4: <b>orange, green, indigo and violet</b>.'}];
const NI=INTRO.length;
const RECIPE_LINE=c=>`<div class="fd-recl">${PARTS[c].map(k=>drop(k,22)).join('<b class="fd-plus">+</b>')}<b class="fd-plus">=</b>${swatch(RECIPE[c],26)}<b>${Cap(CNAME[c])}</b></div>`;
function introCard(pg,inPage){const p=me(),a=p.fade.a,it=INTRO[pg];
 const art=pg===0?`${goblinVillainSVG()}${prismaSVG({gray:1})}`:pg===1?`<div class="fd-col">${wheelSVG(p,a,150)}${checklist(p,a)}</div>`
  :pg===2?`<div class="fd-col"><div class="fd-trio"><div>${drop('w',40)}<small>white · free</small></div><div>${drop('k',40)}<small>black · free</small></div></div><div class="fd-trio">${POT.map(k=>`<div>${drop(k,40)}<small>${PRIM[k].n}</small></div>`).join('')}</div><div class="fd-note">I saved ${starter(p)} of each for you to start 🎨</div></div>`
  :`<div class="fd-col fd-recipes">${MIX_ORDER.map(RECIPE_LINE).join('')}</div>`;
 const btn=pg<NI-1?`<button class="btn green big" onclick="Fade._intro(${pg+1},${inPage?1:0})">Next ➜</button>`:`<button class="btn gold big" onclick="Fade._introDone(1)">🎨 Let's start!</button>${inPage?'':'<button class="btn ghost dark" onclick="Fade._introDone(0)">Later, I\'ll battle first</button>'}`;
 return `<div class="fd-card fd-intro"><div class="fd-art">${art}</div><div data-spk="intro"><h2>${it.t}</h2><p class="fd-big">${it.b} ${SPK}</p></div><div class="fd-dots">${INTRO.map((_,j)=>`<i class="${j===pg?'on':''}"></i>`).join('')}</div><div class="row">${btn}</div></div>`;}
function intro(pg){layer(introCard(pg,false),'dim');snd('tap');}

/* ---------- the mixing table (screen 'fade') ---------- */
let UI={key:null},RET='world',LAST='world';
function resetUI(key,a,pz){UI={key,ph:'q',inp:'',miss:0,hint:0,bowl:Z5(),shown:null,mm:0,fb:'',rb:0,rbm:0};
 if(!a||key==='help')return;
 if(a.bw&&a.bw.k!==key)returnBowl(a); /* a bowl left from a puzzle that's done (Prisma's paint finished it): its paint goes back */
 /* already answered (saved): straight back to the mixing step, with the bowl exactly as it was */
 if(a.bw&&a.bw.k===key&&a.bw.ok&&pz){const ph=phaseAfter(pz);if(ph!=='solved'){UI.ph=ph;UI.bowl=Object.assign(Z5(),a.bw.m||{});UI.shown=Object.assign({},UI.bowl);UI.rev=a.bw.rv?1:0;}}}
/* a single color goes back in its jar; a mixed bowl can't be un-mixed, so that paint is gone */
function returnBowl(a){try{const m=a.bw&&a.bw.m||{};if(KEYS.filter(k=>m[k]>0).length<2)POT.forEach(k=>potAdd(a,k,m[k]||0));}catch(e){}delete a.bw;}
/* the question is answered: remember it, so a reload goes straight to mixing */
function markAnswered(p,pz){const a=p.fade.a;if(!a||pz.kind==='help')return;if(!(a.bw&&a.bw.k===pz.key))a.bw={k:pz.key,ok:1,m:Z5()};else a.bw.ok=1;if(UI.rev)a.bw.rv=1;sv();}
/* rv: the answer was shown (2 misses), so this puzzle pays half */
function saveBowl(a,key){a.bw={k:key,ok:1,m:Object.assign(Z5(),UI.bowl)};if(UI.rev)a.bw.rv=1;sv();}
const STAGES=[{n:'The primary colors',t:'<b>Red, yellow and blue</b> are the <b>painter\'s primary colors</b>: you can\'t mix them from the other paints on my table. I saved some for you, and every right answer in a battle can find more. Pour each one into its slot on my <b>Color Wheel</b>!'},
 {n:'Mix the other 4',t:''},
 {n:'The Rainbow Bridge',t:'All 7 colors are on the Color Wheel! Put them back in the rainbow and the Grey Goblin\'s trick is undone!'}];
/* Prisma's helper puzzle: 'days' (3 days in: her secret paint finishes this stage) or 'stuck' (3 wrong mixes or 2 dumps on
   this color: her secret paint makes just this color). Only for the paint stages. */
function helpReady(p){const a=p&&p.fade&&p.fade.a;if(!a||!a.in)return false;if(a.s>1)return false;
 if(now()-Math.max(a.t,a.hp||0)>=HELP_DAYS*DAY)return 'days';
 const pz=curPuzzle(p);if(pz&&a.st&&a.st.k===pz.key&&((a.st.f||0)>=HELP_FAILS||(a.st.d||0)>=HELP_DUMPS))return 'stuck';return false;}
function stuckNote(a,key,f,d){if(!a.st||a.st.k!==key)a.st={k:key,f:0,d:0};a.st.f+=f||0;a.st.d+=d||0;}
function helpBox(p,pz,mode){if(!mode)return '';const nm=pz&&pz.kind!=='help'?E(pz.name.toLowerCase()):'this color';
 return `<div class="fd-help" data-spk="help">🎁 ${mode==='stuck'?`This one is tricky! Want an <b>easy helper puzzle</b> instead? Solve it and my secret paint will make <b>${nm}</b> for you.`:`It's been a few days! Want an <b>easy helper puzzle</b>? Solve it and my secret paint will finish <b>this whole stage</b>.`}${SPK}<div class="row" style="margin-top:6px"><button class="btn gold small" onclick="Fade._helper('${mode}')">Yes please!</button></div></div>`;}
function page(p,inner){let tb='';try{tb=typeof topbar==='function'?topbar():'';}catch(e){tb='';}
 const app=document.getElementById('app');app.innerHTML=`<div class="fd-tb">${tb}</div><div class="page fd"><div class="zhead"><button class="btn ghost small backbtn" onclick="Fade._back()">← ${backName(RET&&RET!=='fade'&&typeof SCREENS!=='undefined'&&SCREENS[RET]?RET:'world')}</button><h2 class="title">🎨 Prisma's Mixing Table</h2></div>${inner}</div>`;
 const t=app.querySelector('.fd-tb');if(t)t.style.filter=`grayscale(${active(p)?level(p).toFixed(2):0})`;}
/* how grey Prisma's little village window is: it follows the Color Wheel (the real world stays grey until the finale) */
const winGray=(p,a)=>a?1-colorsDone(p,a)/7:0;
function draw(){const p=me();if(!p){goTo('profiles');return;}css();const f=F(p),a=f.a;
 if(!a||!enabled())return drawCalm(p,f);
 if(!a.in){page(p,`<div class="fd-solo">${introCard(UI.ipg||0,true)}</div>`);return;}
 const z=SIZES(a);const over=a.s>=z.length;if(over&&!(UI.ph==='solved'&&UI.solved)){finish(p);return;}
 const helper=UI.key==='help',done=UI.ph==='solved'&&UI.solved;const pz=over||done?UI.solved:helper?gen(p,a,a.s,0,true):curPuzzle(p);if(!over&&!done&&UI.key!==pz.key)resetUI(pz.key,a,pz);
 const st=STAGES[Math.min(a.s,z.length-1)],pt=pot(a),n7=colorsDone(p,a),G=winGray(p,a);
 const scene=`<div class="fd-scene"><div class="fd-win" style="filter:grayscale(${(UI.fx?UI.fx.from:G).toFixed(3)})">${villageSVG()}</div><div class="fd-pr">${prismaSVG({gray:Math.min(1,G*1.1),on:stripesOn(p,a)})}</div><div class="fd-wh">${wheelSVG(p,a,108)}</div>
  <div class="fd-prog"><b>Stage ${Math.min(a.s+1,z.length)} of ${z.length}</b> · ${st.n}<div class="fd-bar"><i style="width:${Math.round(n7/7*100)}%"></i></div><small><b>${n7} of 7</b> colors on the Color Wheel · ${over?'every puzzle solved!':`puzzle ${totalDone(a)+1} of ${z.reduce((s,n)=>s+n,0)}`}</small></div></div>
  ${checklist(p,a)}<div class="fd-pot"><span>🎨 Paint pot</span>${POT.map(k=>`<span class="fd-pc" data-k="${k}">${drop(k,20)}<b>${pt[k]}</b> <small>${PRIM[k].n}</small></span>`).join('')}</div>`;
 page(p,`<div class="fd-grid"><div class="fd-left">${scene}</div><div class="fd-right">${puzzleHTML(p,a,pz,st)}</div></div>`);
 autoRead(p,pz);
 if(UI.fx){const fx=UI.fx;UI.fx=null;setTimeout(()=>fxAfter(fx),30);}
 if(UI.fit){const sel=UI.fit;UI.fit=null;setTimeout(()=>fit(sel),60);}
 if(UI.view){const v=UI.view;UI.view=null;setTimeout(()=>frame(v.t,v.b,v.fb),60);}}
/* bring a new step into view. If everything from one of the `tops` down to `bot` fits on the screen, scroll the least that shows
   all of it (so on a laptop the Pour / Skip buttons are never just under the fold). Otherwise (phones) put the last top (the
   instruction line) at the top of the screen, unless fb is false. */
function frame(tops,bot,fb){try{if(cur()!=='fade')return;const vh=innerHeight,y0=scrollY,bs=bot?document.querySelectorAll(bot):[],b=bs.length?bs[bs.length-1]:null;
 const go2=y=>{y=Math.max(0,Math.round(y));if(Math.abs(y-scrollY)>4)scrollTo({top:y,behavior:'auto'});};
 for(const sel of tops){const t=document.querySelector(sel);if(!t)continue;const tt=t.getBoundingClientRect().top+y0-8;if(!b){go2(tt);return;}
  const bb=b.getBoundingClientRect().bottom+y0+12;if(bb-tt<=vh){go2(Math.min(tt,Math.max(bb-vh,y0)));return;}}
 if(fb===false)return;for(let j=tops.length-1;j>=0;j--){const t=document.querySelector(tops[j]);if(t){go2(t.getBoundingClientRect().top+y0-8);return;}}}catch(e){}}
/* phones and iPads: after a step changes, bring the buttons the kid needs next into view (never jump past the instructions) */
function fit(sel){try{if(cur()!=='fade')return;const el=document.querySelector(sel);if(!el)return;const r=el.getBoundingClientRect(),vh=innerHeight;if(r.bottom<=vh-8&&r.top>=0)return;
 const top=document.querySelector('.fd-pz [data-spk="mix"],.fd-pz [data-spk="rb"],.fd-pz .fd-yay,.fd-pz .fd-say');const lim=top?top.getBoundingClientRect().top+scrollY-70:0;
 let y=r.bottom+scrollY-vh+14;if(lim>0)y=Math.min(y,Math.max(lim,scrollY));if(r.top<0)y=r.top+scrollY-70;if(Math.abs(y-scrollY)>4)scrollTo({top:Math.max(0,y),behavior:RM()?'auto':'smooth'});}catch(e){}}
/* grades 1–2 hear short, useful lines once, automatically (at most two new ones at a time, in this order): feedback, the
   need-paint box, "Red is back!", "Not quite! Try again", the hint, the reveal, the question, the mixing step, the rainbow
   instruction and Prisma's helper offer. (Tips and stories stay 🔊-button only.) */
const HEARD=new Set();
const READ_ORDER=['fb','need','yay','try','work','shown','q','mix','rb','help'];
function autoRead(p,pz){try{if(!youngR(p)||!voiceOK()||!pz)return;const k0=(UI.key||pz.key),ph=UI.ph,said=[];
 for(const n of READ_ORDER){if(n==='rb'&&UI.rb)continue;const el=document.querySelector(`#app [data-spk="${n}"]`);if(!el)continue;const t=spText(el);if(!t)continue;
  const k=k0+'|'+n+'|'+t;if(HEARD.has(k))continue;HEARD.add(k);said.push(t);if(said.length>=2)break;}
 if(!said.length)return;const sy=gfn('say');if(!sy)return;
 setTimeout(()=>{if(UI.ph===ph&&cur()==='fade'&&!LAY){try{speechSynthesis.cancel();}catch(e){}sy(said.join(' '),.85);}},400);}catch(e){}}
function drawCalm(p,f){const n=f.c||0;
 page(p,`<div class="fd-solo"><div class="fd-card"><div class="fd-art">${prismaSVG({gray:0,on:ALL7()})}</div><h2>${n?'Your world is full of color!':'All quiet here'}</h2>
 <p class="fd-big">${n?`You have beaten the Grey Goblin <b>${n}</b> time${n>1?'s':''}. Prisma will call if he ever sneaks back!`:'Prisma is resting. If the colors ever disappear, come find her here!'}</p>
 ${f.sp?`<p>🎨 Rare paint splotches: <b>${f.sp}</b></p>`:''}<div class="row"><button class="btn green big" onclick="Fade._back()">OK</button></div></div></div>`);}
/* a tiny hue wheel for the angle bonus: a needle at the shade, a dashed one straight across */
function angleSVG(deg,sz,both){const R=40,pt=(d,r)=>{const t=(d-90)*Math.PI/180;return [(r*Math.cos(t)).toFixed(1),(r*Math.sin(t)).toFixed(1)];};const [x,y]=pt(deg,R-6),[x2,y2]=pt(deg+180,R-6);
 return `<svg class="fd-ang" viewBox="-52 -52 104 104" width="${sz}" height="${sz}" aria-hidden="true"><foreignObject x="-${R}" y="-${R}" width="${2*R}" height="${2*R}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;border-radius:50%;background:conic-gradient(#e03131,#fd7e14,#fcc419,#37b24d,#1c7ed6,#3b3fae,#9c5bd6,#e03131)"></div></foreignObject>
 <circle r="${R}" fill="none" stroke="#2b2250" stroke-width="2.5"/><circle r="12" fill="#fff" stroke="#2b2250" stroke-width="2"/><text y="-44" text-anchor="middle" font-size="8" font-weight="700" fill="#2b2250">0°</text>
 <line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#2b2250" stroke-width="3.5" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#2b2250" stroke-width="2"/>
 ${both?`<line x1="0" y1="0" x2="${x2}" y2="${y2}" stroke="#2b2250" stroke-width="3" stroke-dasharray="4 3" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="4.5" fill="#fff" stroke="#2b2250" stroke-width="2"/>`:''}</svg>`;}
function tgtHTML(p,a,pz){const sep=sepOf(a);
 if(pz.kind==='slot')return `<div class="fd-tgt">${swatch(pz.mix,64)}<div><small>Primary color</small><b>${E(pz.name)}</b><div class="fd-rec"><span class="fd-prim">${drop(pz.k,18)} a painter's primary: you can't mix it from the other paints</span></div></div></div>`;
 if(pz.kind==='rainbow')return `<div class="fd-tgt">${rainbowSVG(7,64)}<div><small>The finale</small><b>The Rainbow Bridge</b></div></div>`;
 if(pz.kind==='angle')return `<div class="fd-tgt">${angleSVG(pz.ang,64,false)}<div><small>⭐ Bonus puzzle (you can skip it)</small><b>${E(pz.name)}</b></div></div>`;
 if(pz.kind==='light')return `<div class="fd-tgt"><div class="fd-lsw" style="background:rgb(${pz.light.join(',')})"></div><div><small>⭐ Bonus puzzle (you can skip it)</small><b>${E(pz.name)}</b></div></div>`;
 if(pz.kind==='help')return `<div class="fd-tgt"><div class="fd-lsw fd-rbw"></div><div><small>Helper puzzle</small><b>Prisma's secret paint</b></div></div>`;
 const hide=pz.hide&&(UI.ph==='q'||UI.ph==='shown');
 return `<div class="fd-tgt">${swatch(pz.mix,64)}<div><small>Target color</small><b>${E(pz.name)}</b><div class="fd-rec">${hide?'<span class="fd-prim">❓ Solve the puzzle to see the recipe</span>':pz.exact?`<span class="fd-ratio">Ratio ${recTxt(pz.ratio,':')} <span class="fd-muted">·</span> batch: <b>${pz.batch}</b> drops</span>`:recipeHTML(pz.mix,sep)}</div></div></div>`;}
function puzzleHTML(p,a,pz,st){
 const helper=pz.kind==='help';
 if(!helper&&UI.ph==='q'){const sh=short(p,pz);if(sh&&(pz.kind==='mix'||pz.kind==='slot'))return needHTML(p,a,pz,sh);}
 const tgt=tgtHTML(p,a,pz),hm=helper?false:helpReady(p);
 /* Prisma's tip for the color: with the question, except when the question asks which colors make it (then it shows with the mixing step) */
 let tip='';if(!helper&&UI.ph==='q'){if(pz.kind==='slot'&&a.i===0)tip=STAGES[0].t;else if(pz.kind==='mix'&&!pz.hide)tip=TIP[pz.slot];else if(pz.kind==='rainbow')tip=STAGES[2].t;else if(pz.bonus)tip='A bonus puzzle before the rainbow, just for fun. You can skip it!';}
 else if(!helper&&UI.ph==='mix'&&pz.kind==='mix'&&pz.hide)tip=TIP[pz.slot];
 const lead=helper?`<div class="fd-help">🎁 Solve this <b>easy</b> one and my secret paint will ${UI.hm==='stuck'?'make this color':'finish <b>this whole stage</b>'}.</div>`:((UI.ph==='q'||UI.ph==='mix')&&hm?helpBox(p,pz,hm):'')+(tip?`<div class="fd-say fd-tip" data-spk="tip">${tip}${SPK}</div>`:'');
 let body='';
 const work=UI.hint?`<div class="fd-work" data-spk="work"><b>Let's work it out:</b><ol>${pz.work.slice(0,UI.hint).map(s=>`<li>${s}</li>`).join('')}</ol></div>`:'';
 const tryAgain=UI.miss===1?`<div class="fd-fb no" data-spk="try">${teen(a)?'Not quite. Try again.':'Not quite! Try again. 💪'}</div>`:'';
 const wk=tryAgain+work;
 const hintBtn=UI.hint<pz.work.length?`<div class="row" style="margin-top:6px"><button class="btn ghost dark small" onclick="Fade._hint()">💡 Work it out with me</button></div>`:'';
 if(UI.ph==='q'&&pz.mc){body=`<div data-spk="q"><div class="fd-q">${pz.q}${SPK}</div>
  <div class="fd-mc ${pz.mc.some(x=>x.length>60)?'pics':''}">${pz.mc.map((o,j)=>`<button class="fd-mco ${(UI.bad||[]).includes(j)?'bad':''}" ${(UI.bad||[]).includes(j)?'disabled':''} data-i="${j}" onclick="Fade._mc(${j})"><span class="fd-mcl">${'ABC'[j]}</span>${o}</button>`).join('')}</div></div>
  ${wk}${hintBtn}${pz.bonus?BONUS_SKIP:''}`;}
 else if(UI.ph==='q'){body=`<div class="fd-q" data-spk="q">${pz.q}${SPK}</div>
  <div class="fd-ans ${UI.shake?'no':''}" aria-live="polite">${UI.inp?E(UI.inp):'<span>?</span>'}${pz.pct?'<small>%</small>':''}</div>
  ${wk}
  <div class="fd-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="Fade._k('${n}')">${n}</button>`).join('')}<button class="del" onclick="Fade._k('del')" aria-label="Delete">⌫</button><button onclick="Fade._k('0')">0</button><button class="go" onclick="Fade._k('go')" aria-label="Check">✓</button></div>
  ${hintBtn}${pz.bonus?BONUS_SKIP:''}`;}
 else if(UI.ph==='shown'){body=`<div class="fd-q">${pz.q}</div><div class="fd-work" data-spk="shown"><b>Here's how:</b><ol>${pz.work.map(s=>`<li>${s}</li>`).join('')}</ol><div class="fd-reveal">The answer is <b class="fd-revv">${pz.mc?pz.mc[pz.a]:pz.a}${pz.pct?'%':''}</b>.${SPK}</div></div><div class="row"><button class="btn green big" onclick="Fade._cont()">Got it ➜</button></div>`;}
 else if(UI.ph==='mix'){body=mixHTML(p,a,pz);}
 else if(UI.ph==='light'){body=lightHTML(pz);}
 else if(UI.ph==='rainbow'){body=rbHTML(a);}
 else if(UI.ph==='solved'){body=solvedHTML(p,a,pz);}
 return `<div class="fd-card fd-pz">${tgt}${lead}${body}</div>`;}
function needHTML(p,a,pz,sh){const hm=helpReady(p),secret=pz.kind==='slot'&&pz.sec; /* don't give away the answer: there the drop count IS the answer */
 const ks=POT.filter(k=>sh[k]),list=ks.map((k,j)=>`<span>${drop(k,26)} ${secret?`a few more ${PRIM[k].n} drops`:`<b>${sh[k]}</b> more ${PRIM[k].n}`}<span class="fd-sr">${j<ks.length-1?',':'.'}</span></span>`).join('');
 return `<div class="fd-card fd-pz">${tgtHTML(p,a,pz).replace('<small>Primary color</small>','<small>Next color</small>').replace('<small>Target color</small>','<small>Next color</small>')}
 <div class="fd-need" data-spk="need"><div class="fd-say">We need a little more paint for ${E(pz.name.toLowerCase())}: ${SPK}</div><div class="fd-needs">${list}</div>
 <p>Win battles to collect paint! Every right answer can drop a paint drop. 🎨</p></div>
 ${helpBox(p,pz,hm)}
 <div class="row"><button class="btn green big fd-collect" onclick="Fade._collect()">⚔️ Go collect paint</button></div></div>`;}
const BONUS_SKIP=`<div class="row" style="margin-top:6px"><button class="btn ghost dark small fd-skip" onclick="Fade._skip()">Skip the bonus ➜</button></div>`;
const phaseAfter=pz=>pz.kind==='mix'||pz.kind==='slot'?'mix':pz.kind==='light'||pz.kind==='angle'?'light':pz.kind==='rainbow'?'rainbow':'solved';
function curPz(p){return UI.key==='help'?gen(p,p.fade.a,p.fade.a.s,0,true):curPuzzle(p);}
function answered(p,pz){snd('correct');UI.fb='';UI.shake=0;UI.ph=phaseAfter(pz);if(UI.ph==='solved')return solve(p,pz);markAnswered(p,pz);
 /* the next step starts with its instruction line on screen (phones: at the top; never scrolled off above) */
 UI.view=UI.ph==='mix'?{t:['.fd-pz .fd-tgt','.fd-pz .fd-tip','.fd-pz [data-spk="mix"]'],b:'.fd-pz .fd-actrow'}:UI.ph==='rainbow'?{t:['.fd-pz .fd-tgt','.fd-pz [data-spk="rb"]'],b:'.fd-pz .fd-rbb'}:UI.ph==='light'?{t:['.fd-pz .fd-tgt','.fd-pz .fd-say'],b:'.fd-pz .fd-lightok'}:null;redraw();}
function mcTap(j){const p=me();if(!p||!p.fade.a||UI.ph!=='q')return;const pz=curPz(p);if(!pz.mc)return;
 if(j===pz.a)return answered(p,pz);
 UI.miss++;snd('wrong');UI.bad=(UI.bad||[]).concat(j);if(UI.miss>=2){UI.ph='shown';UI.rev=1;UI.view=SHOWN_VIEW;}else UI.hint=Math.max(UI.hint,1);redraw();}
/* keypad */
function key(k){const p=me();if(!p||!p.fade.a)return;const pz=curPz(p);if(UI.ph!=='q'||pz.mc)return;
 if(k==='del'){UI.inp=UI.inp.slice(0,-1);UI.shake=0;snd('tap');return redraw();}
 if(k==='go'){if(!UI.inp)return;const v=parseInt(UI.inp,10);
  if(v===pz.a||(pz.alt&&pz.alt.includes(v)))return answered(p,pz);
  UI.miss++;snd('wrong');UI.inp='';UI.shake=1;if(UI.miss>=2){UI.ph='shown';UI.rev=1;UI.view=SHOWN_VIEW;}else UI.hint=Math.max(UI.hint,1);return redraw();}
 if(UI.inp.length<(pz.lock||pz.a>=1000?5:4)){UI.inp=UI.inp==='0'?k:UI.inp+k;UI.shake=0;snd('tap');redraw();}}
/* only ever redraw the mixing table while the kid is ON it (a late animation must never paint over the World) */
const SHOWN_VIEW={t:['.fd-pz .fd-tgt','.fd-pz .fd-q'],b:'.fd-pz .fd-work ~ .row'};
const NEW_VIEW={t:['.fd-pz .fd-tgt','.fd-pz .fd-q','.fd-pz .fd-need'],b:'.fd-pz .fd-skip,.fd-pz .fd-collect,.fd-pz .fd-pad,.fd-pz .fd-mc',fb:false};
function redraw(){if(cur()!=='fade')return;const y=window.scrollY;draw();try{window.scrollTo(0,y);}catch(e){}}
/* the mixing table: droppers with one mark per drop, and a measuring bowl of Prisma's magic mixing water */
const WATER=[223,241,251],JAR_EXTRA=20; /* white/black come from Prisma's jars: refilled for every puzzle */
/* room in the bowl: a slot takes its exact drops; a mix has room for two batches, so a wrong mix can usually be fixed by adding */
const bowlCap=pz=>{const T=KEYS.reduce((s,k)=>s+(pz.mix[k]||0),0);return pz.kind==='slot'?Math.max(4,Math.ceil(T/.75)):Math.max(6,2*T);};
const bowlN=b=>KEYS.reduce((s,k)=>s+(b[k]||0),0);
function jarsOf(a,pz){return pz.kind==='slot'?[pz.k]:['r','y','b','w','k'];}
const jarFull=(pz,k)=>Math.max(JAR_EXTRA,(pz.mix[k]||0)+8);
/* drops left in a jar right now (red/yellow/blue: the pot, since paint leaves the pot as it goes in the bowl) */
function leftOf(a,pz,k,bw){return k==='w'||k==='k'?jarFull(pz,k)-((bw||UI.bowl)[k]||0):pot(a)[k];}
/* how big the jar looks: what's left plus what's in the bowl */
function supply(a,pz,k){return k==='w'||k==='k'?jarFull(pz,k):pot(a)[k]+(UI.bowl[k]||0);}
/* the smallest set of drops to ADD so the bowl becomes an exact batch of the recipe (within the bowl and the jars).
   A slot, or a grade 7+ batch (pz.exact), must be exactly pz.mix. When a jar is short it still says what the full fix is (add). */
function fixPlan(a,pz,bw){const R=pz.mix,cap=bowlCap(pz);
 const shortOf=add=>{const need={};let any=false;Object.keys(add).forEach(k=>{const l=leftOf(a,pz,k,bw);if(add[k]>l){need[k]=add[k]-l;any=true;}});return any?need:null;};
 const bad=KEYS.find(x=>bw[x]&&!R[x]);if(bad)return {ok:false,why:'other',bad};
 if(pz.kind==='slot'||pz.exact){const over=KEYS.filter(k=>(bw[k]||0)>(R[k]||0));if(over.length)return {ok:false,why:'over',over};
  const add={};KEYS.forEach(k=>{const x=(R[k]||0)-(bw[k]||0);if(x>0)add[k]=x;});const need=shortOf(add);return need?{ok:false,why:'paint',need,add}:{ok:true,add};}
 let m=1;KEYS.forEach(k=>{if(R[k])m=Math.max(m,Math.ceil((bw[k]||0)/R[k]));});let first=null;
 for(;m*bowlN(R)<=cap;m++){const add={};KEYS.forEach(k=>{if(!R[k])return;const x=m*R[k]-(bw[k]||0);if(x>0)add[k]=x;});const need=shortOf(add);
  if(!need)return {ok:true,add,m};if(!first)first={need,add};}
 return first?{ok:false,why:'paint',need:first.need,add:first.add}:{ok:false,why:'cap'};}
const s_=n=>n===1?'':'s';
const artA=n=>/^(8|11|18)$|^8\d$/.test(String(n))?'an':'a'; /* "an 8-drop batch" */
const andList=a=>a.length<3?a.join(' and '):a.slice(0,-1).join(', ')+' and '+a[a.length-1]; /* "1 red, 1 blue and 2 white" */
const dropsTxt=m=>andList(KEYS.filter(k=>m[k]).map(k=>`<b>${m[k]}</b> ${PRIM[k].n}`));
/* "1 more red and 1 more blue" */
const moreTxt=m=>andList(KEYS.filter(k=>m[k]).map(k=>`<b>${m[k]}</b> more ${PRIM[k].n}`));
const namesTxt=ks=>andList(ks.map(k=>PRIM[k].n));
/* which jar is short, and by how much */
const shortTxt=need=>andList(KEYS.filter(k=>need[k]).map(k=>`your ${PRIM[k].n} ${k==='w'||k==='k'?'jar':'paint'} is <b>${need[k]}</b> drop${s_(need[k])} short`));
/* words first: what's wrong with this mix */
function wrongTxt(bw,tgt){const miss=KEYS.filter(k=>tgt[k]&&!bw[k]);if(miss.length)return `It needs ${namesTxt(miss)} too!`;
 const A=shares(bw),B=shares(tgt),too=KEYS.filter(k=>A[k]-B[k]>1e-9);return too.length?`Too much ${namesTxt(too)}!`:'Not quite!';}
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
function bowlColor(b){const n=bowlN(b);if(!n)return hex(WATER);const c=mixRGB(b),t=n/(n+.3);return hex(c.map((v,i)=>Math.round(WATER[i]*(1-t)+v*t)));}
function bowlSVG(b,cap){const n=bowlN(b),h=bLevel(n,cap);let ticks='';const every=cap>24?5:1;
 for(let i=every;i<=cap;i+=every){const y=(BW.bot-bLevel(i,cap)).toFixed(1),big=i%5===0;ticks+=`<line x1="${big?168:173}" x2="182" y1="${y}" y2="${y}" stroke="#2b2250" stroke-opacity="${big?.75:.4}" stroke-width="${big?1.6:1}"/>${big?`<text x="186" y="${(+y+3).toFixed(1)}" font-size="9" fill="#6f6499" font-weight="700">${i}</text>`:''}`;}
 return `<svg class="fd-bowl" viewBox="0 0 200 150" aria-hidden="true"><defs><clipPath id="fdbc"><path d="M22 26 H178 L166 124 Q100 140 34 124 Z"/></clipPath></defs>
 <path d="M22 26 H178 L166 124 Q100 140 34 124 Z" fill="#fbfdff"/>
 <g clip-path="url(#fdbc)"><g class="fd-bliq" style="transform:translateY(${(100-h).toFixed(2)}px)"><rect class="fd-bfill" x="0" y="28" width="200" height="130" fill="${bowlColor(b)}"/><g class="fd-bpat" opacity="${b.k?.4:.8}">${pats(b).replace(/width="100%" height="100%"/g,'x="0" y="28" width="200" height="130"')}</g>
  <ellipse cx="100" cy="28" rx="84" ry="4" fill="#fff" opacity=".55"/><g class="fd-sparkle"><circle cx="60" cy="33" r="1.8" fill="#fff"/><circle cx="118" cy="31" r="1.4" fill="#fff"/><circle cx="150" cy="34" r="1.6" fill="#fff"/></g>
  <ellipse class="fd-ripple" cx="100" cy="28" rx="10" ry="2.5" fill="none" stroke="#fff" stroke-width="1.5" opacity="0"/></g></g>
 ${ticks}<path d="M22 26 H178 L166 124 Q100 140 34 124 Z" fill="none" stroke="#2b2250" stroke-width="3" stroke-linejoin="round"/><path d="M34 34 L42 112" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
 <rect x="14" y="20" width="172" height="8" rx="4" fill="#fff" stroke="#2b2250" stroke-width="3"/></svg>`;}
function bowlLabel(b){const n=bowlN(b);return n?`${KEYS.filter(k=>b[k]).map(k=>`${b[k]} ${PRIM[k].n}`).join(' + ')} <span class="fd-muted">· ${n} drop${n>1?'s':''} in the mixing bowl</span>`:'✨ Prisma\'s <b>magic mixing water</b>: clear until paint drops in';}
const SLN=CNAME;
const slotName=pz=>SLN[pz.slot]||pz.name.replace(/\s*\(.*\)/,'').toLowerCase();
function sayMix(pz){const sn=slotName(pz);
 if(pz.kind==='slot'){const n=pz.mix[pz.k];return `${pz.pre?`The ${sn} slot already has <b>${pz.pre}</b> drop${s_(pz.pre)}. `:''}Put <b>${n}</b> ${cw(pz.k)} drop${n>1?'s':''} in the <b>mixing bowl</b>, then pour ${n>1?'them':'it'} into the <b>${sn} slot</b> on my <b>Color Wheel</b>.`;}
 const m=pz.mix;if(pz.exact)return `${Cap(sn)} is ${recTxt(pz.ratio,':')}. Make ${artA(pz.batch)} <b>${pz.batch}-drop batch</b>: work out how many drops of each color, put them in the <b>mixing bowl</b>, then pour it into the <b>${sn} slot</b>.`;
 return `Now put ${recTxt(m,'+')} in the <b>mixing bowl</b>, then pour it into the <b>${sn} slot</b> on my <b>Color Wheel</b>.${pz.slot==='v'?' The white makes it lighter, so it\'s violet, not dark purple!':pz.slot==='i'?' A little black makes the blue deep and dark: indigo!':''}`;}
const ARROW=`<svg class="fd-arrow" viewBox="0 0 40 60" aria-hidden="true"><path d="M2 40 Q20 6 34 24" fill="none" stroke="#7c5cff" stroke-width="3.5" stroke-dasharray="6 5" stroke-linecap="round"/><path d="M27 21 L36 27 L37 16" fill="none" stroke="#7c5cff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function slotLabel(pz){if(pz.kind!=='slot')return pz.exact?`needs ${artA(pz.batch)} ${pz.batch}-drop batch`:`needs ${E(pz.name.toLowerCase())}`;const n=pz.mix[pz.k];return pz.pre?`has ${pz.pre} · needs <b>${n}</b> more`:`needs ${n} drop${n>1?'s':''}`;}
/* the "can't finish this one yet" box: exactly what's missing, and the way out */
function stuckHTML(a,pz,plan){if(!plan||plan.ok)return '';let t='';
 if(plan.why==='paint')t=`To finish ${E(pz.name.toLowerCase())}, collect ${moreTxt(plan.need)}. ${bowlKinds(UI.bowl).length>=2?'Keep this bowl: it stays mixed while you go. ':''}Win battles to collect paint: every right answer can drop some!`;
 else return '';
 return `<div class="fd-need fd-needbox" data-spk="need"><div class="fd-say">${t}${SPK}</div><div class="row"><button class="btn green fd-collect" onclick="Fade._collect()">⚔️ Go collect paint</button></div></div>`;}
function mixHTML(p,a,pz){const bw=UI.bowl,sh=UI.shown||(UI.shown=Object.assign({},bw)),slot=pz.kind==='slot',cap=bowlCap(pz);const has=bowlN(bw)>0;
 const jars=jarsOf(a,pz),sn=slotName(pz),Sn=sn[0].toUpperCase()+sn.slice(1);const plan=fixPlan(a,pz,bw);UI.planOk=!!plan.ok;
 return `<div class="fd-say" data-spk="mix">${sayMix(pz)}${SPK}</div>
 <div class="fd-mixrow"><div class="fd-bowlw">${bowlSVG(sh,cap)}<small class="fd-blab">${bowlLabel(sh)}</small></div>${ARROW}
  <div class="fd-wheelw">${wheelSVG(p,a,130,pz.slot,pz.pre?pz.pre/(pz.full||1):0)}<small class="fd-slab"><b>${Sn} slot</b><br>${slotLabel(pz)}</small></div></div>
 <div class="fd-jars">${jars.map(k=>{const full=supply(a,pz,k),left=leftOf(a,pz,k),dis=left<=0;const nm=Cap(PRIM[k].n);
  return `<div class="fd-jarw" data-jar="${k}"><button class="fd-jar ${dis?'off':''}" ${dis?'disabled':''} onclick="Fade._add('${k}')" aria-label="Add a ${PRIM[k].n} drop">${bottleSVG(k,Math.max(full,1),left)}<span class="fd-jn">${left}</span><b>${nm}</b><small>${k==='w'||k==='k'?'Prisma\'s jar':'tap = 1 drop'}</small></button></div>`;}).join('')}</div>
 ${UI.fb?`<div class="fd-fb ${UI.fbok?'ok':'no'}" data-spk="fb">${UI.fb}${SPK}</div>`:''}
 <div class="row fd-actrow">${(()=>{const kk=bowlKinds(bw);if(kk.length>=2)return UI.dumpArm?`<button class="btn danger fd-empty" onclick="Fade._empty()">🗑️ Yes, dump it! (that paint is lost)</button>`:`<button class="btn ghost dark fd-empty" onclick="Fade._empty()">🗑️ Dump it out</button>`;return `<button class="btn ghost dark fd-empty" onclick="Fade._empty()" ${has?'':'disabled'}>↺ Pour it back</button>`;})()}<button class="btn green big fd-mixbtn" onclick="Fade._mix()" ${has?'':'disabled'}>✨ Pour into the ${E(sn)} slot</button></div>
 ${stuckHTML(a,pz,plan)}
 <div class="fd-legend">Patterns: ${['r','y','b','w','k'].filter(k=>jars.includes(k)).map(k=>`<span>${swatch({[k]:1},16)} ${k==='r'?'dots':k==='y'?'stripes':k==='b'?'waves':k==='w'?'plus signs':'criss-cross'} = ${PRIM[k].n}</span>`).join('')}</div>`;}
/* update the table in place, so the levels glide instead of jumping */
function updMix(){try{const p=me(),a=p&&p.fade.a;if(!a||UI.ph!=='mix'||cur()!=='fade')return;const pz=curPuzzle(p),cap=bowlCap(pz),bw=UI.bowl,sh=UI.shown;
 jarsOf(a,pz).forEach(k=>{const w=document.querySelector(`.fd-jarw[data-jar="${k}"]`);if(!w)return;const left=leftOf(a,pz,k);const lq=w.querySelector('.fd-liq');
  if(lq){const st=+lq.dataset.step,c=+lq.dataset.cap;lq.style.transform=`translateY(${((c-Math.min(left,c))*st).toFixed(2)}px)`;}
  const n=w.querySelector('.fd-jn');if(n)n.textContent=left;const b=w.querySelector('.fd-jar');if(b){b.disabled=left<=0;b.classList.toggle('off',left<=0);}});
 POT.forEach(k=>{const c=document.querySelector(`.fd-pc[data-k="${k}"] b`);if(c)c.textContent=pot(a)[k];});
 const n=bowlN(sh),bl=document.querySelector('.fd-bliq');if(bl)bl.style.transform=`translateY(${(100-bLevel(n,cap)).toFixed(2)}px)`;
 const f=document.querySelector('.fd-bfill');if(f)f.setAttribute('fill',bowlColor(sh));const pg=document.querySelector('.fd-bpat');if(pg)pg.setAttribute('opacity',sh.k?.4:.8);if(pg)pg.innerHTML=pats(sh).replace(/width="100%" height="100%"/g,'x="0" y="28" width="200" height="130"');
 const lab=document.querySelector('.fd-blab');if(lab)lab.innerHTML=bowlLabel(sh);
 const has=bowlN(bw)>0;document.querySelectorAll('.fd-empty,.fd-mixbtn').forEach(x=>x.disabled=!has);
 const eb=document.querySelector('.fd-empty');if(eb&&!UI.dumpArm){const mixed=bowlKinds(sh).length>=2;eb.textContent=mixed?'🗑️ Dump it out':'↺ Pour it back';}
 if(!POURING&&!UI.pouring&&bowlN(sh)===bowlN(bw)&&!!fixPlan(a,pz,bw).ok!==UI.planOk)redraw(); /* the "go collect paint" box comes or goes */
}catch(e){}}
function clearFb(){if(UI.fb){UI.fb='';const fb=document.querySelector('.fd-pz .fd-fb');if(fb)fb.remove();}}
function ripple(){try{const r=document.querySelector('.fd-ripple');if(r&&!RM())r.animate([{opacity:.9,transform:'scale(.3)'},{opacity:0,transform:'scale(2.4)'}],{duration:520,easing:'ease-out'});}catch(e){}}
/* one drop: out of the jar (and out of the pot) now, into the bowl when it lands; the bowl is saved right away */
function addDrop(k,quiet){const p=me(),a=p&&p.fade.a;if(!a||UI.ph!=='mix'||POURING)return false;const pz=curPuzzle(p),cap=bowlCap(pz);
 if(leftOf(a,pz,k)<=0){if(!quiet)say(k==='w'||k==='k'?`Prisma's ${PRIM[k].n} jar is empty!`:`No more ${PRIM[k].n} drops! Win battles for more.`);return false;}
 if(bowlN(UI.bowl)>=cap){if(!quiet)say('The mixing bowl is full! Pour it into the slot, or dump it out.');return false;}
 UI.shown=UI.shown||Object.assign({},UI.bowl);if(POT.includes(k))potAdd(a,k,-1);UI.bowl[k]++;saveBowl(a,pz.key);
 if(UI.dumpArm){UI.dumpArm=0;setTimeout(redraw,500);}clearFb();const first=bowlN(UI.bowl)===1;
 const land=()=>{UI.shown[k]++;updMix();ripple();tn(560+KEYS.indexOf(k)*80,.1,'sine',.06);if(first)fit('.fd-pz .fd-actrow');};
 updMix();const src=document.querySelector(`.fd-jarw[data-jar="${k}"] .fd-btl`),bowl=document.querySelector('.fd-bowl');
 if(RM()||!src||!bowl){land();return true;}
 try{const s=src.getBoundingClientRect(),bb=bowl.getBoundingClientRect(),n=bowlN(UI.shown);const x0=s.left+s.width*.54-9,y0=s.top+4,x1=bb.left+bb.width/2-9+(Math.random()*30-15),y1=bb.top+(BW.bot-bLevel(n+1,cap))/150*bb.height-20;
  const d=document.createElement('div');d.className='fd-fly';d.innerHTML=drop(k,18);document.body.appendChild(d);
  const an=d.animate([{transform:`translate(${x0}px,${y0}px) scale(.5)`,opacity:.3},{transform:`translate(${x0}px,${y0-22}px) scale(1)`,opacity:1,offset:.25},{transform:`translate(${x1}px,${y1}px) scale(.9)`,opacity:1}],{duration:430,easing:'cubic-bezier(.5,0,.8,.6)'});
  an.onfinish=()=>{d.remove();land();};}catch(e){land();}return true;}
function pour(k){let i=0;const t=()=>{if(i++>=5||!addDrop(k,i>1))return;setTimeout(t,RM()?0:110);};t();}
/* Like real paint: ONE color in the bowl can be poured back into its jar, but once two colors are mixed they can't be
   separated, so dumping a mixed bowl uses that paint up (two taps, so it never happens by accident). The fix for a wrong mix is
   usually to ADD paint: the advice names exactly what to add. (Owner's rule: no un-mixing, no refunds for a dumped mix.) */
const bowlKinds=bw=>KEYS.filter(k=>bw[k]>0);
function emptyBowl(){const p=me(),a=p&&p.fade.a;if(!a||POURING)return;const bw=UI.bowl,kinds=bowlKinds(bw),pz=curPuzzle(p);
 if(kinds.length>=2){if(!UI.dumpArm){UI.dumpArm=1;snd('tap');redraw();return;}
  UI.dumpArm=0;UI.bowl=Z5();UI.shown=Z5();saveBowl(a,pz.key);stuckNote(a,pz.key,0,1);sv();
  const plan=fixPlan(a,pz,UI.bowl);UI.fb=plan.ok||!plan.need?'The mixed paint is used up: mixed colors can\'t be un-mixed! Try again.':`The mixed paint is used up: mixed colors can't be un-mixed! To make ${E(pz.name.toLowerCase())}, collect ${moreTxt(plan.need)}.`;UI.fbok=false;
  gt(220,.35,'sawtooth',.03);UI.fit='.fd-pz .fd-actrow';redraw();return;}
 /* one color: back in its jar */
 POT.forEach(k=>potAdd(a,k,bw[k]||0));UI.dumpArm=0;UI.bowl=Z5();UI.shown=Z5();saveBowl(a,pz.key);clearFb();snd('tap');updMix();redraw();}
function doMix(){if(POURING)return;const p=me(),a=p&&p.fade.a;if(!a)return;if(UI.shown&&bowlN(UI.shown)<bowlN(UI.bowl)){setTimeout(doMix,120);return;} /* let the last drops land first */const pz=curPuzzle(p),bw=UI.bowl;if(!KEYS.some(k=>bw[k]))return;
 /* the words lead: what's wrong, then exactly which drops fix it (or which jar is short), then the way out */
 let ok=false,msg='';const plan=fixPlan(a,pz,bw),mixed=bowlKinds(bw).length>=2,n=bowlN(bw),nm=E(pz.name.toLowerCase());
 const out=mixed?'Mixed paint can\'t be un-mixed, so dump it out and start again.':'Pour it back in the jar and try again.';
 const goGet=mixed?' Go collect paint (this bowl stays mixed while you go), or dump it out and start again.':' Go collect paint, or pour it back in the jar.';
 if(pz.kind==='slot'){const k=pz.k,need=pz.mix[k],have=bw[k]||0;
  if(plan.why==='other')msg=`Only ${PRIM[k].n} goes in the ${PRIM[k].n} slot, but there's ${PRIM[plan.bad].n} in the bowl. Now it's mixed, so dump it out and start again.`;
  else if(have>need)msg=`Too many! The slot needs just ${need}. Pour it back in the jar and try again.`;
  else if(have<need)msg=plan.ok?`A little more! Add ${moreTxt(plan.add)}.`:`Add ${moreTxt(plan.add)}, but ${shortTxt(plan.need)}. Go collect paint, then come back!`;
  else ok=true;}
 else if(plan.why==='other')msg=`There's <b>${PRIM[plan.bad].n}</b> in the bowl, and ${nm} has no ${PRIM[plan.bad].n}. ${mixed?'Mixed paint can\'t be un-mixed, so dump it out and start again.':'Pour it back in the jar and try again.'}`;
 else if(pz.exact){const B=pz.batch,right=sameRatio(bw,pz.mix);
  if(KEYS.every(k=>(bw[k]||0)===(pz.mix[k]||0)))ok=true;
  else if(plan.why==='over')msg=right?`Right color, but that's <b>${n}</b> drops and the batch is <b>${B}</b>. ${out}`:`${wrongTxt(bw,pz.mix)} ${Cap(artA(B))} ${B}-drop batch has only ${dropsTxt(Object.fromEntries(plan.over.map(k=>[k,pz.mix[k]])))}. ${out}`;
  else{const lead=right?`Right color! But the batch is <b>${B}</b> drops and you have <b>${n}</b>.`:wrongTxt(bw,pz.mix);
   msg=plan.ok?`${lead} Add ${dropsTxt(plan.add)} to make the ${B}-drop batch.`:`${lead} To make the ${B}-drop batch you'd add ${dropsTxt(plan.add)}, but ${shortTxt(plan.need)}.${goGet}`;}}
 else if(sameRatio(bw,pz.mix))ok=true;
 else if(plan.ok)msg=`${wrongTxt(bw,pz.mix)} To make it just right, add ${dropsTxt(plan.add)}.`;
 else if(plan.why==='paint')msg=`${wrongTxt(bw,pz.mix)} To fix it, add ${dropsTxt(plan.add)}, but ${shortTxt(plan.need)}.${goGet}`;
 else msg=`${wrongTxt(bw,pz.mix)} The bowl is too full to fix it by adding. ${mixed?'Dump it out':'Pour it back'} and start again: ${recTxt(pz.mix,'+')}.`;
 if(ok){const same=KEYS.every(k=>(bw[k]||0)===(pz.mix[k]||0));UI.sameMsg=!same&&pz.kind==='mix'?`Same color! ${recTxt(bw,sepOf(a))} is the same mix as ${recTxt(pz.mix,sepOf(a))}.${teen(a)?'':' ✨'}`:'';UI.pouring=1;return pourAnim(pz,Object.assign({},bw),()=>solve(p,pz));}
 UI.mm++;stuckNote(a,pz.key,1,0);sv();snd('wrong');UI.fb=msg;UI.fbok=false;
 try{const b=document.querySelector('.fd-bowl');if(b&&!RM())b.animate([{transform:'rotate(0)'},{transform:'rotate(-6deg)'},{transform:'rotate(6deg)'},{transform:'rotate(0)'}],{duration:400});}catch(e){}
 UI.shown=Object.assign({},UI.bowl);UI.fit='.fd-pz .fd-actrow';setTimeout(redraw,RM()?0:380);}
/* the pour: bowl tips, a stream runs along the arrow into the glowing slot, the slot fills (color + pattern), the bowl empties */
let POURING=false;
function pourAnim(pz,bw,done){const g=document.querySelector(`.fd-wheelw [data-slot="${pz.slot}"]`),bowl=document.querySelector('.fd-bowl');
 const fill=()=>{if(!g)return;const f=g.querySelector('.fd-sf');if(f){f.setAttribute('fill',mixHex(pz.mix));f.removeAttribute('fill-opacity');f.setAttribute('stroke','#2b2250');f.removeAttribute('stroke-dasharray');}
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
/* grade 9+ and grown-ups get plainer buttons than "Wow! ✨" */
const okWord=()=>{const p=me();return teen(p&&p.fade&&p.fade.a)?'Got it ➜':'Wow! ✨';};
/* bonus puzzles: light (RGB), ink (CMY), hex codes, wheel angles */
function lightHTML(pz){
 if(pz.kind==='angle')return `<div class="fd-say">${pz.after}</div><div class="fd-lights">${angleSVG(pz.ang,150,true)}<div class="fd-lswc"><b>${pz.ang}° ↔ ${pz.a}°</b><small>half a turn apart</small></div></div>
 <p class="fd-small">Colors straight across the wheel are <b>complements</b>. Side by side they make each other look brighter!</p>
 <div class="row fd-lightok"><button class="btn green big" onclick="Fade._lightOK()">${okWord()}</button></div>`;
 const [r,g,b]=pz.light;
 const L=`<svg class="fd-light" viewBox="0 0 160 120" aria-label="Red, green and blue light overlapping. Where all three meet, it is white."><rect width="160" height="120" rx="14" fill="#111"/><g style="mix-blend-mode:screen;isolation:isolate"><circle cx="62" cy="48" r="32" fill="#ff0000" style="mix-blend-mode:screen"/><circle cx="98" cy="48" r="32" fill="#00ff00" style="mix-blend-mode:screen"/><circle cx="80" cy="78" r="32" fill="#0000ff" style="mix-blend-mode:screen"/></g><text x="80" y="116" text-anchor="middle" font-size="9" fill="#fff">light: R + G + B = white</text></svg>`;
 const I=`<svg class="fd-light" viewBox="0 0 160 120" aria-label="Cyan, magenta and yellow ink overlapping. Where all three meet, it is almost black."><rect width="160" height="120" rx="14" fill="#fff" stroke="#dee2e6"/><g style="isolation:isolate"><circle cx="62" cy="48" r="32" fill="#00ffff" style="mix-blend-mode:multiply"/><circle cx="98" cy="48" r="32" fill="#ff00ff" style="mix-blend-mode:multiply"/><circle cx="80" cy="78" r="32" fill="#ffff00" style="mix-blend-mode:multiply"/></g><text x="80" y="116" text-anchor="middle" font-size="9" fill="#333">ink: C + M + Y = dark</text></svg>`;
 return `<div class="fd-say">${pz.after}</div><div class="fd-lights">${pz.sub==='hex'?'':L}${pz.ink?I:''}<div class="fd-lswc"><div class="fd-lsw big" style="background:rgb(${r},${g},${b})"></div><small>${pz.hex?'#'+pz.hex+' = ':''}(${r}, ${g}, ${b})</small></div></div>
 <p class="fd-small">Paint <b>soaks up</b> light, so mixing paint gets darker. Screens <b>add</b> light: with light, the primaries are red, green and blue.${pz.ink?' Printers use cyan, magenta and yellow ink, the opposites of red, green and blue.':''}</p>
 <div class="row fd-lightok"><button class="btn green big" onclick="Fade._lightOK()">${okWord()}</button></div>`;}
/* rainbow bridge (the finale) */
const RB=SEVEN.map(k=>[k,RECIPE[k],Cap(CNAME[k])]);
function rainbowSVG(n,w){return `<svg class="fd-rbw" viewBox="0 0 120 64" width="${w}" aria-hidden="true">${RB.map(([k,m],j)=>{const r=56-j*6.2;const on=j<n;return `<path d="M${(60-r).toFixed(1)} 62 A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(60+r).toFixed(1)} 62" fill="none" stroke="${on?RBOW[k]:'#edf0f3'}" stroke-width="5.8"/>`;}).join('')}</svg>`;}
function rbHTML(a){const order=UI.rbo||(UI.rbo=[0,1,2,3,4,5,6].sort(()=>Math.random()-.5));const young=(a&&a.b||0)<=1;
 /* grades 1–4 see the order from the start; everyone gets the next one glowing after one wrong tap */
 const strip=young?`<div class="fd-rbstrip" aria-hidden="true">${RB.map(([k,m,n],j)=>`<span class="${j<UI.rb?'done':j===UI.rb?'next':''}">${swatch(m,18)}${n}</span>`).join('')}</div>`:'';
 return `<div class="fd-say" data-spk="rb">${UI.rb===0?'Paint the rainbow! Tap the colors in order, from the outside in. Red goes first!':UI.rb<7?`${teen(a)?'Next:':'Great!'} What comes after <b>${RB[UI.rb-1][2].toLowerCase()}</b>?`:''}${SPK}</div>${strip}
 <div class="fd-rbwrap">${rainbowSVG(UI.rb,280)}</div>
 <div class="fd-rbb">${order.map(j=>{const [k,m,n]=RB[j];const done=j<UI.rb;const glow=UI.rbm>=1&&j===UI.rb;return `<button class="fd-rbtn ${done?'done':''} ${glow?'glow':''}" ${done?'disabled':''} onclick="Fade._rb(${j})">${swatch(m,40)}<b>${n}</b></button>`;}).join('')}</div>
 ${UI.fb?`<div class="fd-fb no" data-spk="fb">${UI.fb}${SPK}</div>`:''}`;}
function rbTap(j){const p=me();if(!p||UI.ph!=='rainbow')return;if(j===UI.rb){UI.rb++;UI.rbm=0;UI.fb='';tn(520+j*80,.18,'triangle',.1);if(UI.rb>=7){snd('win');return solve(p,curPuzzle(p));}return redraw();}
 UI.rbm++;snd('wrong');UI.fb=`Not that one yet! Rainbows go red, orange, yellow, green, blue, indigo, violet. Look for the glowing one!`;redraw();}
/* solved */
function solve(p,pz){const a=p.fade.a;const g0=winGray(p,a),z=SIZES(a);
 if(pz.kind==='help'){if(a.bw)returnBowl(a);a.hu=(a.hu||0)+1;a.hp=now();a.pm=Array.isArray(a.pm)?a.pm:[];
  if(UI.hm==='stuck'){const c=curPuzzle(p);if(c&&c.slot&&!a.pm.includes(c.slot))a.pm.push(c.slot);a.i++;if(a.i>=z[a.s]){a.s++;a.i=0;UI.stageDone=a.s;}UI.solvedMsg=`Prisma's secret paint made ${E(c?c.name.toLowerCase():'that color')}!`;}
  else{for(let i=a.i;i<z[a.s];i++){const c=gen(p,a,a.s,i);if(c.slot&&c.slot!=='c'&&!a.pm.includes(c.slot))a.pm.push(c.slot);}a.s++;a.i=0;UI.stageDone=a.s;UI.solvedMsg=`Prisma used her secret paint! Stage ${a.s} is done.`;}}
 else{a.i++;if(a.i>=z[a.s]){a.s++;a.i=0;UI.stageDone=a.s;}}
 delete a.bw;delete a.st;
 const got={coins:0,xp:0};if(!UI.skipped){got.coins=PZ_COINS[Math.max(0,Math.min(5,a.b||0))];if(UI.rev){got.coins=Math.ceil(got.coins/2);got.half=1;}got.xp=PZ_XP;p.coins=(p.coins||0)+got.coins;try{if(typeof addXP==='function'&&addXP(p,PZ_XP))setTimeout(()=>say(`⭐ Level up! You're level ${p.level}!`),900);}catch(e){}}
 sv();UI.got=got;UI.ph='solved';UI.solved=pz;UI.fx={from:g0,to:winGray(p,a)};snd('correct');if(cur()==='fade'){UI.fit='.fd-pz .fd-yay .row';redraw();}}
function solvedHTML(p,a,pz){const z=SIZES(a),fin=a.s>=z.length,sd=UI.stageDone;
 const back=pz.kind==='help'?UI.solvedMsg:pz.kind==='slot'||pz.kind==='mix'?`${E(pz.name)} is back!`:pz.kind==='rainbow'?'The rainbow is back!':(UI.skipped?'On to the rainbow!':'Bonus solved! ⭐');
 const msg=sd&&!fin?[null,'Red, yellow and blue are on the Color Wheel: 3 of 7 colors!','All 7 colors are on the Color Wheel! Almost there!'][sd]||'':'';const cnt=pz.kind==='slot'||pz.kind==='mix'||pz.kind==='help'?`<p class="fd-cntl">🌈 <b>${colorsDone(p,a)} of 7</b> colors on the Color Wheel</p>`:'';
 const g=UI.got||{};
 return `<div class="fd-yay"><div class="fd-yay-sw">${pz.kind==='rainbow'?rainbowSVG(7,130):pz.kind==='angle'?angleSVG(pz.ang,84,true):pz.kind==='light'?`<div class="fd-lsw big" style="background:rgb(${pz.light.join(',')})"></div>`:pz.kind==='help'?'<div class="fd-lsw big fd-rbw"></div>':swatch(pz.mix,84,'pop')}</div><h3 data-spk="yay">${teen(a)?'':'✨ '}${back}${SPK}</h3>${UI.sameMsg?`<p>${UI.sameMsg}</p>`:''}${cnt}${msg?`<p class="fd-stage">🌈 ${msg}</p>`:''}<p class="fd-small">${pz.bonus&&UI.skipped?'Bonus skipped':`+${g.coins||0} 🪙${g.half?' (half: the answer was shown)':''} · +${g.xp||0} XP`}</p>
 <div class="row">${fin?'<button class="btn gold big" onclick="Fade._finish()">🎆 Bring back ALL the color!</button>':`<button class="btn green big" onclick="Fade._next()">Next color ➜</button>`}</div></div>`;}
function fxAfter(fx){const w=document.querySelector('.fd-win');if(!w||RM())return;w.style.filter=`grayscale(${fx.from})`;void w.offsetWidth;w.style.transition='filter 1.6s ease';w.style.filter=`grayscale(${fx.to})`;
 const pr=document.querySelector('.fd-pr');if(pr)bump(pr);}
/* "Go collect paint": off to the Quest Board, with a hint where paint comes from */
const COLLECT_MSG='⚔️ Win battles to find paint! 🎨';
function collect(){closeLayer();goTo('world');setTimeout(()=>{if(cur()!=='battle')say(COLLECT_MSG);},350);}
/* a paint toast must never sit on the battle keypad: hide it the moment a battle starts */
function toastOff(){try{const t=document.getElementById('toast');if(t&&t.classList.contains('show')&&/paint|Prisma/i.test(t.textContent||''))t.classList.remove('show');}catch(e){}}
/* the finale: color bursts back. What Prisma says is TRUE: if her secret paint helped, she says so. */
function finaleLine(a){const pm=Array.isArray(a.pm)?a.pm:[],mine=MIX_ORDER.filter(c=>!pm.includes(c));
 const list=x=>x.length<2?x.join(''):x.slice(0,-1).join(', ')+' and '+x[x.length-1];
 if(!pm.length&&!(a.hu>0))return 'You mixed orange, green, indigo and violet all by yourself!';
 if(!pm.length)return 'You mixed orange, green, indigo and violet, with a little help from my secret paint!';
 if(!mine.length)return 'We did it together, with a little help from my secret paint!';
 return `You mixed ${list(mine.map(c=>CNAME[c]))} yourself, with a little help from my secret paint!`;}
let QPREV=0;
let FBUSY=false;
function holdVisitors(){claim();try{if(!window.trollBusy){window.trollBusy=true;FBUSY=true;}}catch(e){}try{QPREV=window.visitorQuiet||0;window.visitorQuiet=Math.max(QPREV,Date.now()+20*60e3);}catch(e){}}
function quietAfter(){try{if(FBUSY){FBUSY=false;window.trollBusy=false;}}catch(e){}try{window.visitorQuiet=Math.max(QPREV,Date.now()+QUIET_AFTER);}catch(e){}}
function finish(p){const f=F(p),a=f.a;if(!a){drawCalm(p,f);return;}
 const line=finaleLine(a),left=POT.reduce((n,k)=>n+pot(a)[k],0);
 const rw=grant(p,f,left);f.h.push([dnum(a.t),dnum(),a.hu||0]);if(f.h.length>6)f.h=f.h.slice(-6);f.n=now()+MIN_D*DAY;f.due=now()+MAX_D*DAY;delete f.a;UI={key:null};SWEEP=false;sv();
 HOLD=true;closeLayer();holdVisitors(); /* no visitor may pop up from here until the prize card is closed (then ~1 more minute) */
 RET='world';goTo('world');setGray(1);try{hud(p,false);}catch(e){} /* the World is the backdrop: the Pet Home would show the prize too soon */
 setTimeout(()=>prismaShow(p,()=>celebrate(p,rw),line),500);}
let SWEEP=false;
function grant(p,f,left){f.c=(f.c||0)+1;delete f.rp;defs();const first=f.c===1&&!(p.pets||[]).includes(CHAM.id);
 const out={base:first?FIN_COINS:REPLAY_COINS,left:left||0,paint:Math.min(PAINT_MAX,(left||0)*PAINT_COIN),xp:FIN_XP};out.coins=out.base+out.paint;p.coins=(p.coins||0)+out.coins;
 /* Chapter 1 prize: the chameleon (the Prismatic robe is saved for Chapter 2); a replay gives a rare paint splotch instead */
 if(first){p.pets=p.pets||[];p.pets.push(CHAM.id);try{if(typeof petData==='function')petData(p,CHAM.id);}catch(e){}if(!p.pet)out.buddy=1; /* made the buddy on the prize card, not before */out.pet=1;}
 else{f.sp=(f.sp||0)+1;out.sp=1;try{if(window.Adv&&p.adv&&p.adv.shelf)p.adv.shelf.fdsplotch=(p.adv.shelf.fdsplotch||0)+1;}catch(e){}}
 try{if(typeof addXP==='function')out.up=addXP(p,FIN_XP);}catch(e){}
 return out;}
function celebrate(p,rw){const reduce=RM();
 if(rw.buddy&&!p.pet){p.pet=CHAM.id;sv();} /* no buddy yet: the chameleon becomes it now, on the prize card */
 const conf=reduce?'':Array.from({length:44},(_,j)=>`<i class="fd-conf" style="left:${(j*37)%100}%;background:${STR[j%6][1]};animation-delay:${(j%11)*.18}s;animation-duration:${2.6+(j%5)*.4}s"></i>`).join('');
 const fw=reduce?'':`<svg class="fd-fw" viewBox="0 0 400 300" aria-hidden="true">${[[90,90,'#ff6b6b'],[300,70,'#ffd43b'],[200,150,'#4dabf7'],[330,190,'#69db7c'],[70,210,'#cc5de8']].map(([x,y,c],j)=>`<g transform="translate(${x},${y})" style="animation-delay:${j*.45}s">${Array.from({length:12},(_,q)=>`<line x1="0" y1="0" x2="${(Math.cos(q*Math.PI/6)*34).toFixed(1)}" y2="${(Math.sin(q*Math.PI/6)*34).toFixed(1)}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`).join('')}</g>`).join('')}</svg>`;
 let prize='';
 if(rw.pet)prize=`<div class="fd-prize"><div class="fd-chamw"><div class="fd-cham">🦎</div></div><h3>Color Chameleon!</h3><p>"Real chameleons change color with their mood and to warm up. I'm magic: I match the world! Thanks for bringing the colors back!"</p><small>A new pet for your collection (Great Fade prize)</small>${p.pet!==CHAM.id?`<div class="row" style="margin-top:6px"><button class="btn green small" onclick="Fade._buddy(this)">🦎 Make it my buddy!</button></div>`:''}</div>`;
 else prize=`<div class="fd-prize"><div class="fd-spl">${splotchSVG()}</div><h3>A rare paint splotch!</h3><p>For beating the Grey Goblin again.</p></div>`;
 const coins=n=>`<b>+${n}</b> coin${n===1?'':'s'}`;const lines=[`🪙 ${coins(rw.base)}`];if(rw.left)lines.push(`🎨 Prisma buys your leftover paint (${rw.left} drop${rw.left>1?'s':''}): ${coins(rw.paint)}`);lines.push(`✨ <b>+${rw.xp}</b> XP${rw.up?' · ⭐ Level up!':''}`);
 layer(`${fw}<div class="fd-confw">${conf}</div><div class="fd-card fd-end"><div class="fd-art">${prismaSVG({gray:0,on:ALL7()})}</div><h2 class="fd-rainbowt">The colors are back!</h2><p class="fd-big">You beat the Grey Goblin! Your whole world is in color again.</p>${prize}<div class="fd-rw">${lines.map(x=>`<div>${x}</div>`).join('')}</div><div class="row"><button class="btn gold big" onclick="Fade._home()">🌍 See my world!</button></div></div>`,'party');
 snd('level');setTimeout(()=>snd('win'),700);setTimeout(shimmer,60);}
function splotchSVG(){return `<svg viewBox="0 0 100 80" width="110" aria-hidden="true"><path d="M20 40 Q10 20 30 18 Q40 4 55 14 Q72 6 78 24 Q96 30 84 48 Q92 66 70 64 Q58 78 44 66 Q24 74 22 58 Q6 52 20 40Z" fill="#cc5de8" stroke="#2b2250" stroke-width="2.5"/><circle cx="40" cy="36" r="8" fill="#ffd43b"/><circle cx="60" cy="46" r="7" fill="#4dabf7"/><circle cx="52" cy="28" r="5" fill="#ff6b6b"/><circle cx="86" cy="14" r="5" fill="#cc5de8"/><circle cx="10" cy="66" r="4" fill="#cc5de8"/></svg>`;}

/* ---------- prizes: registered at run time (inert unless owned) ---------- */
const CHAM={id:'chameleon',e:'🦎',name:'Color Chameleon',perk:'xp',tier:'event',rare:true,fade:1};
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
  sec.insertAdjacentHTML('beforeend',`<div class="fd-bag"><h4 class="tierh" style="color:#cc5de8">🌈 Great Fade <span class="muted">1 / 1</span></h4><div class="items"><button class="item ${eq?'eq':''}" onclick="shopClick('pet','${CHAM.id}')"><div class="ie fd-chamie"><span class="fd-cham sm">🦎</span></div><div>${CHAM.name}</div><small>Magic: changes color with the world${st?'<br>'+E(st):''}</small><div class="ip">${eq?'✓ Using':'Use'}</div></button></div></div>`);}
 const more=document.querySelector('.bpsec[data-t="more"]');if(more&&(f.c||0)>0&&!more.querySelector('.fd-more')){more.insertAdjacentHTML('afterbegin',`<div class="panel fd-more"><h3>🌈 The Great Fade</h3><p style="margin:0">You beat the Grey Goblin <b>${f.c}</b> time${f.c>1?'s':''}!${f.sp?` Rare paint splotches: <b>${f.sp}</b> 🎨`:''}</p></div>`);}}catch(e){}}

/* ---------- open / navigation ---------- */
function open(){LASTPZ=null;const s=cur();if(s&&s!=='fade'&&s!=='battle')RET=s;closeLayer();goTo('fade');}
const BACK_NAME={world:'World',map:'Map',village:'Village',quests:'Quest Board',pethome:'Pet Home',me:'Me',shop:'Shop',zone:'Zone',camp:'Camp',leaders:'Leaders',library:'Library',cafe:'Kitchen',market:'Market',truck:'My truck',fade:'Paint'};
const backName=s=>BACK_NAME[s]||'World'; /* the ← button names where it goes */
function back(){closeLayer();const r=RET&&RET!=='fade'&&typeof SCREENS!=='undefined'&&SCREENS[RET]?RET:'world';goTo(r);}
function home(){closeLayer();quietAfter();const r=RET&&RET!=='fade'&&typeof SCREENS!=='undefined'&&SCREENS[RET]?RET:'world';
 if(SWEEP){SWEEP=false;DRAINING=true;goTo(r);DRAINING=false;const p=me();setGray(.9);ov().style.display='block';tween(.9,0,2600,()=>{apply();},true);try{hud(p,false);}catch(e){}}else goTo(r);}
function hudHTML(p){p=p||me();if(!p||!active(p))return '';const a=p.fade.a;if(!a.in)return `<button class="hcard glow fd-qcard" onclick="Fade.open()"><span class="pav">🧙‍♀️</span><div><b>Where did the colors go?!</b><small>Prisma the Color Wizard needs your help</small></div></button>`;
 const pz=curPuzzle(p),ready=helpReady(p)||(pz&&!short(p,pz));
 return `<button class="hcard ${ready?'glow':''} fd-qcard" onclick="Fade.open()"><span class="pav">🎨</span><div><b>Visit Prisma's mixing table</b><small>🌈 ${colorsDone(p,a)} of 7 colors back · ${ready?'You have enough paint for the next color!':'Win battles: every right answer can drop paint!'}</small></div></button>`;}

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
.fd-chamw{position:relative;display:inline-block}.fd-chamw .fd-cham{position:static;transform:none;font-size:72px;line-height:1.25;display:block;margin-top:4px}.fd-chamw .fd-rbw{display:block}
.fd-chamie{background:#e6fcf5;border-radius:50%;width:60px;height:60px;margin:0 auto}
  .fd-dash{position:fixed;left:0;bottom:18vh;z-index:61;pointer-events:none;display:flex;align-items:flex-end;gap:6px}
.fd-gob{position:fixed;inset:0;z-index:66;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;pointer-events:auto;
 background:radial-gradient(ellipse at 50% 58%,rgba(20,16,40,.05) 0,rgba(20,16,40,.45) 45%,rgba(10,8,24,.82) 100%);transition:background .9s ease}
.fd-gob.fd-comic{background:#2b1d4e;overflow:hidden}
.fd-gob .fd-rays,.fd-gob .fd-dots{position:absolute;inset:-20%;pointer-events:none;transition:opacity .9s ease}
.fd-gob .fd-rays{background:repeating-conic-gradient(from 0deg at 50% 55%,#3d2a6e 0 9deg,#251846 9deg 18deg);animation:fdSpin 40s linear infinite}
.fd-gob .fd-dots{background:radial-gradient(circle,rgba(0,0,0,.35) 1.6px,transparent 2px) 0 0/12px 12px,radial-gradient(ellipse at 50% 55%,transparent 30%,rgba(8,4,20,.75) 85%)}
.fd-gob.shout .fd-rays{background:repeating-conic-gradient(from 0deg at 50% 55%,#5a1f4a 0 9deg,#2a0f2a 9deg 18deg)}
.fd-gob .fd-cap{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));left:14px;max-width:70%;background:#ffe066;color:#16151c;border:3px solid #16151c;box-shadow:4px 4px 0 #16151c;padding:6px 12px;font:400 clamp(18px,2.6vh,26px) 'Bangers','Fredoka',system-ui,sans-serif;letter-spacing:1.2px;transform:rotate(-2deg);z-index:2}
.fd-gob .fd-gsay{z-index:3;border:4px solid #16151c!important;border-radius:26px!important;box-shadow:6px 6px 0 #16151c!important;color:#16151c!important}
.fd-gob .fd-gsay::after{border-top-color:#16151c!important}
.fd-gob.shout .fd-gsay{background:#fff3bf;transform:rotate(-1.5deg);text-transform:uppercase;letter-spacing:.5px}
.fd-gob .fd-gbody{z-index:2;position:relative}
.fd-vil{width:104px;height:auto}
.fd-gob .fd-vil{width:min(80vw,52vh,440px)!important;height:auto}
.fd-smoke{position:fixed;border-radius:50%;z-index:5;pointer-events:none;filter:blur(3px)}
.fd-gob .fd-sfxl{position:absolute;inset:0;z-index:4;pointer-events:none}
.fd-sfx{position:absolute;font:400 clamp(28px,min(6vh,10vw),64px) 'Bangers','Fredoka',system-ui,sans-serif;letter-spacing:2px;color:var(--c);-webkit-text-stroke:3px #16151c;paint-order:stroke fill;text-shadow:4px 4px 0 #16151c;transform:rotate(var(--r));animation:fdSfx 1.6s ease-out forwards}
.fd-gob.steal .fd-rays,.fd-gob.steal .fd-dots,.fd-gob.steal .fd-cap{opacity:0}
.fd-gob.fd-comic.steal{background:transparent;transition:background .9s ease}
.fd-gob .fd-sk1,.fd-gob .fd-sk2,.fd-gob .fd-sk3{animation:fdTw 1s ease-in-out infinite}.fd-gob .fd-sk2{animation-delay:.3s}.fd-gob .fd-sk3{animation-delay:.6s}
@keyframes fdSfx{0%{transform:rotate(var(--r)) scale(.2);opacity:0}25%{transform:rotate(var(--r)) scale(1.15);opacity:1}70%{opacity:1}100%{transform:rotate(var(--r)) scale(1) translateY(-14px);opacity:0}}
@keyframes fdSpin{to{transform:rotate(360deg)}}
@keyframes fdTw{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@media (prefers-reduced-motion:reduce){.fd-gob .fd-rays,.fd-sfx{animation:none!important}}
.fd-gob.hero.fd-comic{background:#ffe8a3}
.fd-gob.hero .fd-rays{background:repeating-conic-gradient(from 0deg at 50% 55%,#ffd43b 0 9deg,#ffec99 9deg 18deg)}
.fd-gob.hero .fd-dots{background:radial-gradient(circle,rgba(255,255,255,.45) 1.6px,transparent 2px) 0 0/12px 12px,radial-gradient(ellipse at 50% 55%,transparent 35%,rgba(255,146,43,.45) 90%)}
.fd-gob.hero .fd-cap{background:#f783ac;color:#fff;text-shadow:2px 2px 0 #16151c}
.fd-gob .fd-pbody .fd-prisma{width:min(62vw,44vh,340px)!important;height:auto}
.fd-gob .fd-pbody.pin{animation:fdPIn .7s cubic-bezier(.3,1.6,.6,1) both}
.fd-gob .fd-pbody.twirl{animation:fdTwirl 1.1s ease-in-out 2}
.fd-gob .fd-pbody.talk{animation:fdGTalk 1.3s ease-in-out infinite}
.fd-gob .fd-pbody.wave{animation:fdWave .6s ease-in-out 3}
.fd-rbwave{position:fixed;top:0;bottom:0;left:-30vw;width:30vw;z-index:1;pointer-events:none;background:linear-gradient(90deg,transparent,#ff6b6b,#ffa94d,#ffd43b,#69db7c,#4dabf7,#5c7cfa,#cc5de8,transparent);opacity:.55;filter:blur(6px);animation:fdRb 2.6s ease-in-out forwards}
.fd-cameo{position:fixed;right:8px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:5;display:flex;flex-direction:column;align-items:flex-end;gap:4px;animation:fdPeek .6s ease-out both}
.fd-cameo .fd-vil{width:min(34vw,170px)!important}
.fd-cameo .fd-csay{background:#fff;border:3px solid #16151c;border-radius:16px;box-shadow:4px 4px 0 #16151c;padding:8px 12px;max-width:min(70vw,320px);font:600 17px/1.3 'Fredoka',system-ui,sans-serif;color:#16151c}
.fd-gob.hero.fd-comic.steal{background:transparent}
@keyframes fdPIn{0%{transform:scale(.2) rotate(-20deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes fdTwirl{0%{transform:rotateY(0)}50%{transform:rotateY(180deg) translateY(-14px)}100%{transform:rotateY(360deg)}}
@keyframes fdWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-8deg) translateY(-6px)}}
@keyframes fdRb{to{left:110vw}}
@keyframes fdPeek{from{transform:translateX(120%)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.fd-gob .fd-pbody,.fd-rbwave,.fd-cameo{animation:none!important}.fd-rbwave{display:none}}
.fd-gob.steal{background:radial-gradient(ellipse at 50% 58%,rgba(20,16,40,0) 0,rgba(20,16,40,0) 100%)}
.fd-gob .fd-goblin{width:min(72vw,46vh,380px);height:auto}
.fd-gob .fd-gsay{max-width:min(92vw,560px);font-size:clamp(19px,2.6vh,26px)!important}
.fd-gob .fd-gskip{position:absolute;bottom:calc(18px + env(safe-area-inset-bottom,0px))}
.fd-gob .fd-gsay{background:#fff;border:3px solid #868e96;border-radius:18px;padding:10px 14px;font:600 19px/1.3 'Fredoka',system-ui,sans-serif;color:#343a40;text-align:center;min-height:52px;position:relative;box-shadow:0 6px 16px rgba(0,0,0,.25);visibility:hidden}
.fd-gob .fd-gsay.pop{visibility:visible;animation:fdPop .35s ease-out}
.fd-gob .fd-gsay::after{content:'';position:absolute;left:50%;bottom:-14px;margin-left:-10px;border:10px solid transparent;border-top-color:#868e96}
.fd-gob .fd-gbody{filter:drop-shadow(0 8px 10px rgba(0,0,0,.35))}
.fd-gob .fd-gbody.in{animation:fdGIn 1.2s ease-out both}
.fd-gob .fd-gbody.dance{animation:fdGDance .6s ease-in-out infinite}
.fd-gob .fd-gbody.talk{animation:fdGTalk 1.1s ease-in-out infinite}
.fd-gob .fd-gbody.grab{animation:fdGGrab .5s ease-in-out infinite}
.fd-gob .fd-gbody.run{animation:fdGDance .3s ease-in-out infinite}
.fd-gob .fd-gskip{background:rgba(255,255,255,.9);color:#495057;border-radius:12px;padding:8px 14px;font:600 14px 'Fredoka',system-ui,sans-serif;min-height:40px}
.fd-spark{position:fixed;width:14px;height:14px;border-radius:50%;z-index:65;pointer-events:none;box-shadow:0 0 8px currentColor}
@keyframes fdPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
@keyframes fdGIn{0%{transform:translateX(-80vw) rotate(-8deg)}60%{transform:translateX(12px) rotate(4deg)}80%{transform:translateX(-6px)}100%{transform:none}}
@keyframes fdGDance{0%,100%{transform:translateY(0) rotate(-7deg)}50%{transform:translateY(-16px) rotate(7deg)}}
@keyframes fdGTalk{0%,100%{transform:rotate(-2deg) scale(1)}50%{transform:rotate(2deg) scale(1.03)}}
@keyframes fdGGrab{0%,100%{transform:scale(1)}50%{transform:scale(1.08) rotate(-4deg)}}
@media (prefers-reduced-motion:reduce){.fd-gob .fd-gbody{animation:none!important}}.fd-hehe{background:#fff;border:3px solid #868e96;border-radius:14px;padding:4px 10px;font:600 15px 'Fredoka',system-ui,sans-serif;color:#495057;margin-bottom:70px}
#fdGray{position:fixed;inset:0;z-index:59;pointer-events:none;display:none;background:rgba(0,0,0,.001)}
.fd-hud{position:fixed;left:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:61;display:flex;align-items:center;gap:6px;background:#fff;border:3px solid #2b2250;border-radius:999px;padding:4px 12px 4px 6px;box-shadow:0 4px 0 rgba(0,0,0,.3);font-family:inherit;color:#241a3d;cursor:pointer}
.fd-bchip{flex:none;display:inline-flex;align-items:center;gap:3px;background:#fff;border:2px solid #2b2250;border-radius:999px;padding:1px 7px 1px 4px;font:inherit;color:#241a3d;line-height:1;cursor:pointer}
.fd-bchip .fd-hd{font-size:12.5px;gap:0}.fd-bchip .fd-drop{display:block}
.fd-bchip.fd-bfix{position:fixed;z-index:61;box-sizing:border-box;margin:0}
.fd-wchip{position:absolute;right:0;top:46px;z-index:3;white-space:nowrap}.fd-wchip.ready{animation:glowbtn 1.2s ease-in-out infinite;box-shadow:0 0 14px #ffe066}
.fd-wchip .qdot{margin-left:2px}
.fd-hud.ready{animation:fdglow 1.4s ease-in-out infinite}
.fd-hpot{font-size:22px;line-height:1}
.fd-hd{display:flex;align-items:center;gap:1px;font-weight:700;font-size:16px}
.fd-hbang{background:#ff6b6b;color:#fff;border-radius:50%;width:20px;height:20px;display:grid;place-items:center;font-weight:800;font-size:14px}
@keyframes fdglow{50%{box-shadow:0 4px 0 rgba(0,0,0,.3),0 0 16px 4px #ffe066}}
.fd-fly{position:fixed;left:0;top:0;z-index:63;pointer-events:none}
.fd-chip{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:63;pointer-events:none;background:#fff;color:#241a3d;border:2px solid #2b2250;border-radius:999px;padding:3px 10px;font-weight:800;display:flex;align-items:center;gap:6px;box-shadow:0 3px 10px rgba(0,0,0,.3);transition:opacity .5s;white-space:nowrap;font-size:15px;line-height:1;animation:fdChipIn .3s ease-out}@keyframes fdChipIn{from{opacity:0}to{opacity:1}}
html.fd-hudon #toast:not(.top){bottom:var(--fd-tb,80px)}html.fd-hudon #toast:not(.top):not(.show){transform:translateX(-50%) translateY(calc(var(--fd-tb,80px) + 160px))}
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
/* one column (phones, iPad portrait): the puzzle comes FIRST, the scene and checklist below it */
@media(max-width:899px){.fd-grid{grid-template-columns:minmax(0,1fr)}.fd-right{order:-1}.fd-right .fd-card{max-width:none}}
@media(min-width:900px){.fd-left{position:sticky;top:8px}}
.fd-solo{max-width:560px;margin:0 auto}
.fd-scene{position:relative;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.25)}
.fd-win{aspect-ratio:400/170;overflow:hidden}.fd-win svg{display:block;width:100%;height:100%}
.fd-pr{position:absolute;left:8px;top:8px;width:21%;max-width:96px}.fd-pr svg{width:100%;height:auto;display:block}
.fd-wh{position:absolute;right:8px;top:8px;width:27%;max-width:118px;background:#fffc;border-radius:50%;padding:3px}.fd-wh svg{width:100%;height:auto;display:block}
.fd-prog{padding:10px 14px 12px;color:#241a3d;font-size:16px}.fd-prog small{color:#6f6499;font-size:13.5px}
.fd-bar{height:12px;border-radius:8px;background:#e9ecef;overflow:hidden;margin:6px 0 4px}.fd-bar i{display:block;height:100%;background:linear-gradient(90deg,#e03131,#fd7e14,#fcc419,#37b24d,#1c7ed6,#3b3fae,#9c5bd6);transition:width .8s}
.fd-pot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:#fff;border-radius:18px;margin-top:10px;padding:8px 12px;color:#241a3d;font-weight:700}
.fd-pot>span:first-child{margin-right:auto}.fd-pc{display:inline-flex;align-items:center;gap:3px;font-size:18px}.fd-pc small{font-size:13px;color:#6f6499;font-weight:600}
@media(max-width:899px){.fd-pot{margin-top:8px}.fd-pc small{display:none}}
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
.fd-eq{display:block;text-align:center;font-size:1.25em;font-weight:800;margin-top:6px;font-variant-numeric:tabular-nums}
.fd-ans small{font-size:.6em;opacity:.7;margin-left:2px}
.fd-lockp{display:block;margin-top:4px;font-weight:600}.fd-ratio{font-size:15px;font-weight:600;text-transform:none;letter-spacing:0}.fd-ratio b{font-size:17px}
.fd-tip .qspk.fd-spk{width:30px;height:30px}
.fd-cmp{display:inline-flex;align-items:center;gap:4px;vertical-align:middle;white-space:nowrap}.fd-swi{vertical-align:middle}
.fd-actrow{flex-wrap:nowrap!important;gap:8px;align-items:stretch}.fd-actrow .fd-empty{flex:0 1 auto;font-size:14px;padding:8px 10px;white-space:normal;line-height:1.15}.fd-actrow .fd-mixbtn{flex:1 1 auto;font-size:18px;padding:10px 12px;line-height:1.15}
.fd-tgtc{display:block;margin-top:4px;font-weight:600;color:#6f6499}
.fd-needbox{background:#fff9db;border-radius:14px;padding:6px 8px;margin-top:8px}.fd-needbox .fd-say{background:none;margin:0 0 4px;padding:2px 4px}
.fd-rw{display:flex;flex-direction:column;gap:2px;font-size:16px;margin:6px 0 10px}
.fd-rbstrip{display:flex;flex-wrap:wrap;justify-content:center;gap:3px 6px;font-size:13px;font-weight:700;color:#6f6499;margin:-4px 0 4px}
.fd-rbstrip span{display:inline-flex;align-items:center;gap:2px;padding:1px 5px 1px 2px;border-radius:999px;border:2px solid transparent}
.fd-rbstrip span.done{opacity:.35}.fd-rbstrip span.next{border-color:#fab005;background:#fff9db;color:#241a3d}
.fd-ang{flex:none}
.fd-fb .qspk.fd-spk,.fd-yay .qspk.fd-spk,.fd-help .qspk.fd-spk{width:30px;height:30px}
@media(max-width:560px){.fd-btl{width:36px;height:auto}.fd-jars .fd-jar{min-width:0;width:56px;padding:4px 1px}.fd-jars{gap:3px!important;flex-wrap:nowrap!important}.fd-jar b{font-size:13px}.fd-jn{font-size:19px}.fd-blab{font-size:12px!important}.fd-bowl{width:min(200px,42vw)}.fd-wheelw .fd-wheel{width:min(120px,30vw)}.fd-mixrow{margin-top:8px}.fd-legend{font-size:11.5px}.fd-tgt{padding:6px 10px;margin-bottom:8px}.fd-tgt .fd-sw{width:48px;height:48px}.fd-rbwrap svg{width:min(230px,64vw)}.fd-rbtn{padding:4px 6px}.fd-rbtn .fd-sw{width:32px;height:32px}}
@media(max-height:900px) and (min-width:561px){.fd-btl{width:42px;height:auto}.fd-mixrow{margin-top:8px}.fd-bowl{width:min(220px,40vw)}}
@media(max-width:560px){.fd-jar{min-width:56px;padding:5px 2px 4px}.fd-jar small{display:none}.fd-jars{gap:4px}.fd-card{padding:14px}.fd-pad button{font-size:24px;padding:7px 0}.fd-q{font-size:18px}.fd-rbb{grid-template-columns:repeat(2,1fr)}.fd-say{font-size:15.5px}.fd-hud{padding:3px 10px 3px 5px}.fd-hd{font-size:15px}}
@media (prefers-reduced-motion:reduce){.fd-hlp,.fd-arrow path,.fd-bliq,.fd-liq,.fd-bfill{transition:none!important}.fd-sparkle,.fd-hud.ready,.fd-swirl,.fd-cham,.fd-robesw,.fd-orb,.fd-conf,.fd-fw g,.fd-sw.pop,#fdLay .fd-card,.fd-rbtn.glow{animation:none!important}}
`;
function css(){if(!document.getElementById('fdCSS')){const s=document.createElement('style');s.id='fdCSS';s.textContent=CSS;document.head.appendChild(s);}
 if(!document.getElementById('fdDefs')&&document.body)document.body.insertAdjacentHTML('beforeend',DEFS);}

/* ---------- hooks ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({
 answer(p,q,ok){if(!ok||!p||!active(p)||p!==me())return;if(Math.random()>.9)return;const k=giveDrop(p);if(!k)return;BT[k]++;
  /* grade 7+: their battles are longer and harder, so a right answer sometimes finds a second drop */
  try{if((p.fade.a.b||0)>=3&&Math.random()<EXTRA_P){const k2=giveDrop(p);if(k2){BT[k2]++;setTimeout(()=>flyDrop(k2),250);}}}catch(e){}
  hud(p,!NO_GRAY.includes(cur()));flyDrop(k);tn(1200+POT.indexOf(k)*150,.1,'sine',.05);
  /* the moment the pot covers the next color: tell them once (after the battle) */
  try{const a=p.fade.a,pz=curPuzzle(p);if(a.in&&pz&&(pz.kind==='slot'||pz.kind==='mix')&&!short(p,pz)&&a.rt!==pz.key){a.rt=pz.key;READY=true;}}catch(e){}},
 battle(p,r){if(!p||!r||!enabled())return;
  if(replayWanted(p)){BT={r:0,y:0,b:0};PEND=p.id;PENDR=true;PEND_AT=now()+2500;return;}
  if(active(p)){const got=POT.filter(k=>BT[k]).map(k=>[k,BT[k]]);if(r.win&&got.length)setTimeout(()=>chip(`🎨 ${got.map(([k,n])=>`<span>+${n}${drop(k,16)}</span>`).join('')}`,`Found the Goblin's hidden paint: ${got.map(([k,n])=>`${n} ${PRIM[k].n}`).join(', ')}.`),900);BT={r:0,y:0,b:0};sv();return;}
  BT={r:0,y:0,b:0};if(!r.win)return;ROLL=WIN_P;const wn=whyNot(p,(p.battles||0)+1);ROLL=0;if(wn)return;PEND=p.id;PENDF=false;PEND_OK=true;PEND_AT=0;},
 flee(){BT={r:0,y:0,b:0};},
 screen(name){if(!enabled()){if(name==='pethome'||name==='me'){const p=me();if(p)bagInject(p);}setTimeout(()=>{shimmer();chamHue();},60);return;}
  if(name!=='fade'){LAST=name;if(name!=='battle')RET=name;}
  if(name==='battle'){BT={r:0,y:0,b:0};toastOff();}
  if(name==='fade')setTimeout(tableHold,0);
  apply();const p=me();if((name==='pethome'||name==='me')&&p)bagInject(p);setTimeout(()=>{shimmer();chamHue();},60);
  if(READY&&name!=='battle'&&name!=='fade'&&p&&active(p)){READY=false;setTimeout(()=>{if(cur()!=='battle'&&cur()!=='fade')say('🎨 You have enough paint! Visit Prisma\'s mixing table.');},1500);}
  if(REPLAY_AT.includes(name)&&replayWanted(p)&&!PENDR){PEND=p.id;PENDR=true;PEND_AT=now()+2500;}
  armIfDue(name);
  if(PEND&&name!=='battle')setTimeout(tryFire,PENDR?2700:1200);},
 session(p){PEND=null;PENDF=false;PENDR=false;READY=false;if(FBUSY){FBUSY=false;try{window.trollBusy=false;}catch(e){}}BT={r:0,y:0,b:0};UI={key:null};closeLayer();if(!enabled()){if(OV||HUD)apply();return;}setTimeout(apply,50);
  if(p&&replayWanted(p)){PEND=p.id;PENDR=true;PEND_AT=now()+4000;}
  else{ROLL=LOGIN_P;const wn=p?whyNot(p):'x';ROLL=0;if(p&&!wn){PEND=p.id;PENDF=false;PEND_OK=true;PEND_AT=now()+LOGIN_WAIT;}} /* a kid who has battled before: the Goblin strikes a little after they log in */
  if(p&&active(p)&&helpReady(p)&&p.fade.a.hs!==dnum()){p.fade.a.hs=dnum();setTimeout(()=>say('🎨 Prisma has an easier helper puzzle for you!'),4000);}}
});
/* A first Fade that is DUE (the two weeks are up, or a grown-up tapped "Bring him now") starts on the World or Quest Board
   without waiting for the next login or battle win. ROLL is 0 here, so the random chance plays no part: only a due Fade arms. */
function armIfDue(name){try{const p=me();if(!p||PEND||!REPLAY_AT.includes(name||cur())||active(p))return;if(whyNot(p))return;PEND=p.id;PENDF=false;PEND_OK=true;PEND_AT=now()+2500;}catch(e){}}
let WAS_ON=false,READY=false;
setInterval(()=>{try{if(!enabled()){if(WAS_ON){WAS_ON=false;PEND=null;closeLayer();apply();}return;} /* the event just ended: lift the gray, hide the pot */
 WAS_ON=true;apply();armIfDue();if(PEND)tryFire();}catch(e){}},2000);
/* some screens (battles) are entered without go(): notice the switch quickly, so the pot never sits on the battle's keypad */
let LASTSCR='';setInterval(()=>{try{const s=cur();if(s!==LASTSCR){LASTSCR=s;if(s==='battle')toastOff();if(enabled())apply();}}catch(e){}},250);
/* the physical keyboard works on the mixing table too */
document.addEventListener('keydown',e=>{try{if(cur()!=='fade'||UI.ph!=='q'||LAY)return;if(/^[0-9]$/.test(e.key)){key(e.key);e.preventDefault();}else if(e.key==='Backspace'){key('del');e.preventDefault();}else if(e.key==='Enter'){key('go');e.preventDefault();}}catch(x){}});
/* screen registration (SCREENS may not exist yet) */
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.fade=()=>{if(!enabled()){try{go('world');}catch(e){}return;}css();draw();};}else setTimeout(reg,30);})();


/* ---------- Parent Corner: who has beaten the Great Fade, and a Replay button ---------- */
function parentSection(){try{if(typeof state==='undefined'||!state.players||!state.players.filter(p=>p.setup).length)return '';
 return `<div class="panel"><h3>🌈 The Great Fade (Chapter 1)</h3><p class="muted" style="margin-top:0">A one-time adventure: once a hero reaches level 10, the Grey Goblin steals the colors one time and the kid mixes them back with Prisma. It normally comes at a random moment within two weeks; <b>Bring him now</b> makes it happen a few seconds into the hero's next visit to the World or Quest Board. Replay does the same for a hero who already beat him. A replay gives coins and a rare paint splotch (no second Chameleon).</p>
 ${state.players.filter(p=>p.setup).map(p=>{const f=p.fade||{};const ready=!f.a&&!(f.c||0)&&(p.level||1)>=MIN_LV,soon=ready&&f.w1&&now()>=f.w1+MAX_D*DAY;const st=f.a?'🎨 In progress':(f.c||0)>=1?(f.rp?'🔁 Replay coming':'✅ Beaten'):(p.level||1)<MIN_LV?`Unlocks at level ${MIN_LV} (now ${p.level||1})`:soon?'⚡ Coming on the next visit':'⏳ Coming soon';
  return `<div class="row" style="justify-content:flex-start;align-items:center;gap:10px;margin:6px 0"><b style="min-width:90px">${E(p.name)}</b><small class="muted">${st}</small>${(f.c||0)>=1&&!f.a&&!f.rp?`<button class="btn small ghost dark" onclick="Fade._replay('${p.id}')">🔁 Replay</button>`:''}${ready&&!soon?`<button class="btn small ghost dark" onclick="Fade._soon('${p.id}')">⚡ Bring him now</button>`:''}</div>`;}).join('')}</div>`;}catch(e){return '';}}
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
/* ---------- public API ---------- */
window.Fade={
 enabled,active:p=>active(p||me()),trigger,open,hudHTML,level:p=>level(p||me()),
 _k:key,_mc:mcTap,_say:tapSpeak,_skip(){const p=me();if(!p||!p.fade.a)return;const pz=curPuzzle(p);if(!pz||!pz.bonus)return;UI.skipped=1;solve(p,pz);},_hint(){UI.hint++;snd('tap');redraw();},_cont(){const p=me();if(!p||!p.fade.a||UI.ph!=='shown')return;answered(p,curPz(p));},
 _add:k=>{addDrop(k);},_pour:pour,_empty:emptyBowl,_mix:doMix,_rb:rbTap,_collect:collect,
 _lightOK(){const p=me();if(!p||!p.fade.a||UI.ph!=='light')return;solve(p,curPuzzle(p));},
 _wear(el){const p=me();if(!p||!p.look)return;p.look.robe=ROBE.id;sv();snd('tap');if(el)el.outerHTML='<b style="color:#2b8a3e">✓ You\'re wearing it!</b>';},
 _buddy(el){const p=me();if(!p)return;p.pet=CHAM.id;sv();snd('tap');if(el)el.outerHTML='<b style="color:#2b8a3e">✓ Your new buddy!</b>';},
 /* a grown-up skips the two-week wait: the first Fade becomes due right away (it still waits for a calm moment on the map) */
 _soon(id){try{const p=state.players.find(x=>x.id===id);if(!p)return;const f=F(p);if(f.a||(f.c||0)>=1)return;f.w1=now()-MAX_D*DAY-1000;f.n=0;save();if(typeof refreshParent==='function')refreshParent(null);else go('parent');toast('⚡ The Grey Goblin is on his way to '+p.name+'!');}catch(e){}},
 _replay(id){try{const p=state.players.find(x=>x.id===id);if(!p)return;F(p).rp=1;save();if(typeof refreshParent==='function')refreshParent(null);else go('parent');toast('🔁 The Grey Goblin will be back for '+p.name+'!');}catch(e){}},
 _next(){UI={key:null};snd('tap');try{window.scrollTo(0,0);}catch(e){}draw();setTimeout(()=>frame(NEW_VIEW.t,NEW_VIEW.b,false),80);},_finish(){const p=me();if(p)finish(p);},_home:home,_back:back,
 _helper(mode){const p=me();if(!p||!p.fade.a)return;UI={key:'help',hm:mode==='stuck'?'stuck':'days',ph:'q',inp:'',miss:0,hint:0,bowl:Z5(),mm:0,fb:''};snd('tap');draw();try{window.scrollTo(0,0);}catch(e){}},
 _intro(pg,inPage){if(inPage){UI.ipg=pg;draw();}else intro(pg);snd('tap');},
 _introDone(go2){const p=me();if(!p||!p.fade.a)return closeLayer();const a=p.fade.a;if(!a.in){a.in=1;POT.forEach(k=>potAdd(a,k,starter(p)));}UI={key:null};sv();closeLayer();snd('tap');if(go2)open();else apply();},
 /* for the preview / parents */
 _dbg:{vil:()=>goblinVillainSVG(),prisma:o=>prismaSVG(o),goblin:o=>goblinSVG(o),setSkew(ms){SKEW=ms;},force(on){FORCE=on!==false;apply();return enabled();},inWindow,window:y=>{y=y||new Date(now()).getFullYear();return [new Date(evStart(y)),new Date(evEnd(y))];},skew:()=>SKEW,mixRGB,mixHex,gen:(p,s,i,h)=>gen(p,p.fade.a,s,i,h),plan:p=>plan(p,p.fade.a),whyNot,level,
  status(p){const f=F(p),a=f.a;if(a){const z=SIZES(a);return {active:true,stage:a.s,i:a.i,of:z,done:totalDone(a),total:z.reduce((s,n)=>s+n,0),pot:pot(a),bowl:a.bw||null,band:a.b,nb:nbA(a),L:a.L,pm:a.pm||[],hu:a.hu||0,st:a.st||null,level:level(p),help:helpReady(p),colors:colorsDone(p,a),daysIn:(now()-a.t)/DAY};}
   return {active:false,why:whyNot(p),next:f.n||0,c:f.c||0};},
  start:p=>{p=p||me();if(F(p).a)return false;start(p,false);return true;},pend:()=>PEND,pendR:()=>PENDR,ui:()=>UI,fixPlan:(p,b)=>{const pz=curPuzzle(p);return fixPlan(p.fade.a,pz,Object.assign(Z5(),b||UI.bowl));},finaleLine,typeFor:(p,s,i)=>typeFor(p.fade.a,s,i,op=>Math.max(1,(p.fade.a.L[op]||1)-1)),colors:p=>p&&p.fade&&p.fade.a?colorsDone(p,p.fade.a):0,defs,shimmer,apply,CHAM,ROBE,drop}
};
})();
