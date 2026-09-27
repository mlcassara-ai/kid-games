/* Skyla the Giant Eagle — swoops down in the open-sky biomes, carries you to her nest,
   and asks three "flight-school homework" story problems. Shares the dialog/pad engine with troll.js (window.Surprise). */
(function(){
'use strict';
const ENAME='Skyla',WHO='🦅 '+ENAME;
const SH=()=>window.Surprise;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let root=null,busy=false,DEMO=null;
const SHINY=['coins','hat','robe','toy']; // eagles only take shiny things — never pets or spells

function E(p){p.eagle=p.eagle||{};const e=p.eagle;e.visits=e.visits||0;e.hoard=e.hoard||[];return e;}
window.eagleHoardHTML=function(p){const e=p.eagle;const f=p.feathers||0;let s='';
 if(f)s+=`<div class="tr-hoardbox" style="background:#5a3b00"><b>🪶 Golden Feathers: ${f}</b><br><small>Use one when the Troll or the Eagle asks a question that's too hard — it makes the question easier.</small></div>`;
 if(e&&e.hoard&&e.hoard.length)s+=`<div class="tr-hoardbox"><b>🦅 ${ENAME} the Eagle keeps in her nest:</b> ${e.hoard.map(SH().label).map(esc).join(' · ')}<br><small>Answer her questions right next time she grabs you to win them back!</small></div>`;
 return s;};

/* ---------- story problems for the chicks' flight-school homework ---------- */
const N=(n,one,many)=>`${n} ${n===1?one:many}`;
const T_ADD=[(a,b)=>`Chick Pip caught ${N(a,'fish','fish')} and chick Fluff caught ${N(b,'fish','fish')}. How many fish did they catch altogether?`,(a,b)=>`I found ${N(a,'shiny pebble','shiny pebbles')} in the morning and ${b} more in the afternoon. How many pebbles did I find?`,(a,b)=>`${N(a,'cloud','clouds')} floated by the nest, then ${b} more came. How many clouds floated by?`];
const T_ADD3=[(a,b,c)=>`Pip ate ${N(a,'worm','worms')}, Fluff ate ${b} and Squeak ate ${c}. How many worms did they eat in all?`];
const T_SUB=[(a,b)=>`There were ${N(a,'feather','feathers')} in the nest. The wind blew ${b} away. How many feathers are left?`,(a,b)=>`I flew ${N(a,'mile','miles')} today. ${b} of those miles ${b===1?'was':'were'} over the lake. How many miles were NOT over the lake?`,(a,b)=>`My chicks had ${N(a,'berry','berries')}. They ate ${b}. How many berries are left?`];
const T_MUL=[(a,b)=>`${N(a,'chick','chicks')} each ate ${N(b,'worm','worms')}. How many worms did they eat in all?`,(a,b)=>`There ${a===1?'is':'are'} ${N(a,'nest','nests')} on the mountain and each nest has ${N(b,'egg','eggs')}. How many eggs altogether?`,(a,b)=>`I flap my wings ${N(b,'time','times')} every minute. How many flaps do I make in ${N(a,'minute','minutes')}?`];
const T_DIV=[(a,b)=>b===1?`I found ${N(a,'berry','berries')} and gave them all to one chick. How many berries did that chick get?`:`${N(a,'berry','berries')} are shared equally between ${b} chicks. How many berries does each chick get?`,(a,b)=>b===1?`I put ${N(a,'twig','twigs')} into one big pile. How many twigs are in the pile?`:`I put ${N(a,'twig','twigs')} into ${b} equal piles. How many twigs are in each pile?`];
const pick=a=>a[Math.floor(Math.random()*a.length)];
function storyQ(p,up){let q=null;for(let k=0;k<12;k++){const op=pickOp(p,'mix');const L=Math.max(1,Math.min(maxLv(op),lvl(p,op)+(up||0)));q=genQ(op,L);if(q)break;}
 if(q&&!q.tpl&&q.a!=null&&q.L<=10){
  if(q.op==='add')q.story=q.c!==undefined?pick(T_ADD3)(q.a,q.b,q.c):pick(T_ADD)(q.a,q.b);
  else if(q.op==='sub')q.story=pick(T_SUB)(q.a,q.b);
  else if(q.op==='mul')q.story=pick(T_MUL)(q.a,q.b);
  else if(q.op==='div')q.story=pick(T_DIV)(q.a,q.b);}
 if(q&&!q.story&&!q.tpl)q.prompt='Flight School\'s HARDEST homework:';
 return q;}

/* ---------- art ---------- */
const EYE=`<radialGradient id="egEye"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#e0a100"/></radialGradient>`;
const FLY=(talons)=>`<svg viewBox="0 0 640 380" class="eg-flysvg"><defs>${EYE}<linearGradient id="egWing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a22"/><stop offset="1" stop-color="#3b220f"/></linearGradient></defs>
<g class="eg-wingL"><path d="M300 150 Q200 60 20 40 Q60 80 40 110 Q90 110 70 150 Q120 150 110 185 Q170 175 170 205 Q230 190 300 200Z" fill="url(#egWing)"/><path d="M40 110 L10 118 M70 150 L36 162 M110 185 L80 200 M170 205 L150 224" stroke="#2a170a" stroke-width="10" stroke-linecap="round"/></g>
<g class="eg-wingR"><path d="M340 150 Q440 60 620 40 Q580 80 600 110 Q550 110 570 150 Q520 150 530 185 Q470 175 470 205 Q410 190 340 200Z" fill="url(#egWing)"/><path d="M600 110 L630 118 M570 150 L604 162 M530 185 L560 200 M470 205 L490 224" stroke="#2a170a" stroke-width="10" stroke-linecap="round"/></g>
<path d="M280 250 L320 330 L360 250Z" fill="#f4f1ea"/><path d="M296 262 L320 318 L344 262" stroke="#d9d2c2" stroke-width="3" fill="none"/>
<ellipse cx="320" cy="200" rx="58" ry="78" fill="#5a3517"/><ellipse cx="320" cy="215" rx="36" ry="52" fill="#6d4420"/>
<g class="eg-head"><ellipse cx="320" cy="118" rx="44" ry="42" fill="#f7f4ee"/><path d="M300 120 Q320 175 342 122 Q330 150 320 152 Q310 150 300 120Z" fill="#f2b705" stroke="#8a5b00" stroke-width="3"/>
<ellipse cx="302" cy="106" rx="8" ry="7" fill="url(#egEye)"/><ellipse cx="338" cy="106" rx="8" ry="7" fill="url(#egEye)"/><circle cx="303" cy="107" r="3" fill="#1a1a1a"/><circle cx="337" cy="107" r="3" fill="#1a1a1a"/>
<path d="M290 96 L314 102 M350 96 L326 102" stroke="#6b5a45" stroke-width="5" stroke-linecap="round"/></g>
<g stroke="#e8b400" stroke-width="9" stroke-linecap="round" fill="none">${talons?'<path d="M296 262 Q280 300 292 318 M344 262 Q360 300 348 318"/><path d="M286 312 l-8 10 M292 318 l0 12 M298 312 l8 10 M354 312 l8 10 M348 318 l0 12 M342 312 l-8 10" stroke="#3a2a10" stroke-width="5"/>':'<path d="M300 262 L300 290 M340 262 L340 290"/>'}</g></svg>`;
const PERCH=`<svg viewBox="0 0 360 520" class="eg-perch" preserveAspectRatio="xMidYMax meet"><defs>${EYE}<linearGradient id="egBody" x1="0" x2="1"><stop offset="0" stop-color="#6d4420"/><stop offset="1" stop-color="#3a220e"/></linearGradient></defs>
<path d="M200 380 L300 500 L250 500 L180 420Z" fill="#f4f1ea"/>
<path d="M120 190 Q90 300 150 420 Q210 460 260 400 Q300 300 250 190Z" fill="url(#egBody)"/>
<path d="M230 200 Q320 260 300 420 Q280 440 250 420 Q270 330 210 250Z" fill="#3b220f"/>
<g stroke="#2a170a" stroke-width="4" fill="none" opacity=".6"><path d="M240 260 Q270 300 262 360"/><path d="M252 250 Q288 300 280 380"/></g>
<g stroke="#e8b400" stroke-width="12" stroke-linecap="round"><path d="M160 420 L150 478"/><path d="M215 425 L215 480"/></g><g stroke="#3a2a10" stroke-width="6" stroke-linecap="round"><path d="M150 478 l-18 10 M150 478 l4 16 M150 478 l18 8 M215 480 l-18 10 M215 480 l4 16 M215 480 l18 8"/></g>
<g class="eg-phead"><path d="M100 120 Q110 60 175 55 Q240 60 245 125 Q250 190 200 205 L140 205 Q95 185 100 120Z" fill="#f7f4ee"/>
<g class="eg-beak"><path d="M112 118 Q60 118 48 150 Q70 138 96 146 Q108 146 118 138Z" fill="#f2b705" stroke="#8a5b00" stroke-width="3"/></g>
<path class="eg-jaw" d="M100 142 Q80 150 70 158 Q92 160 112 150Z" fill="#d99a00"/>
<ellipse cx="140" cy="106" rx="13" ry="11" fill="url(#egEye)"/><circle cx="136" cy="107" r="5" fill="#111"/>
<path class="eg-brow" d="M118 88 L162 98" stroke="#6b5a45" stroke-width="7" stroke-linecap="round"/><path class="eg-browk" d="M120 92 Q140 80 162 90" stroke="#6b5a45" stroke-width="6" fill="none" stroke-linecap="round"/></g></svg>`;
const CHICK=`<svg viewBox="0 0 80 80"><ellipse cx="40" cy="48" rx="30" ry="28" fill="#c9c4bd"/><g fill="#dcd7d0"><circle cx="18" cy="30" r="10"/><circle cx="30" cy="22" r="10"/><circle cx="46" cy="21" r="10"/><circle cx="60" cy="30" r="10"/></g><circle cx="30" cy="42" r="6" fill="#fff"/><circle cx="50" cy="42" r="6" fill="#fff"/><circle cx="31" cy="43" r="3.4" fill="#222"/><circle cx="49" cy="43" r="3.4" fill="#222"/><path d="M34 52 L46 52 L40 62Z" fill="#f2b705"/></svg>`;
const PEAK=`<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" class="eg-peak"><defs><linearGradient id="egSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86c6"/><stop offset=".7" stop-color="#a9d3f5"/><stop offset="1" stop-color="#e8f4ff"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#egSky)"/><g fill="#fff" opacity=".85"><ellipse cx="120" cy="90" rx="70" ry="18"/><ellipse cx="170" cy="80" rx="45" ry="20"/><ellipse cx="460" cy="60" rx="80" ry="18"/><ellipse cx="410" cy="52" rx="40" ry="14"/></g>
<path d="M0 500 L0 330 L120 260 L200 300 L330 180 L420 250 L520 150 L640 260 L800 220 L800 500Z" fill="#8a9bb3"/><path d="M330 180 L300 215 L345 205 L360 225 L375 200Z M520 150 L495 185 L530 175 L545 195 L560 170Z" fill="#fff"/>
<path d="M0 500 L0 440 Q200 400 360 430 Q520 460 800 410 L800 500Z" fill="#6f6152"/></svg>`;

/* ---------- styles ---------- */
const CSS=`
.eg-root{position:fixed;inset:0;z-index:6000;overflow:hidden;font-family:'Fredoka',system-ui,sans-serif;color:#fff;-webkit-user-select:none;user-select:none}
.eg-shadow{position:absolute;top:18%;left:110%;width:130vw;max-width:1400px;opacity:.45;filter:brightness(0) blur(3px);animation:egshadow 1.6s ease-in forwards;pointer-events:none}
@keyframes egshadow{to{left:-140%;top:8%}}
.eg-dark{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .7s}.eg-dark.on{opacity:1}
.eg-sky{position:absolute;inset:0;background:linear-gradient(#27456e,#6fa8dc 60%,#bfe0ff);overflow:hidden}
.eg-ground{position:absolute;left:50%;top:50%;width:100vw;height:100vh;transform:translate(-50%,-50%) scale(1);transform-origin:center;background-size:cover;background-position:center;border-radius:8px;transition:transform 3.2s ease-in,opacity 3.2s,top 3.2s}
.eg-ground.small{transform:translate(-50%,-50%) scale(.18);opacity:.55;top:80%}
.eg-cloud{position:absolute;width:190px;height:60px;background:#fff;border-radius:40px;opacity:.9;animation:egcloud 1.6s linear infinite}
.eg-cloud::before{content:'';position:absolute;width:90px;height:70px;border-radius:50%;background:#fff;left:40px;top:-30px}
@keyframes egcloud{from{transform:translateY(-30vh)}to{transform:translateY(130vh)}}
.eg-down .eg-cloud{animation-name:egcloudup}@keyframes egcloudup{from{transform:translateY(130vh)}to{transform:translateY(-30vh)}}
.eg-flier{position:absolute;left:50%;top:22%;width:min(90vw,760px);transform:translateX(-50%);z-index:5;transition:top 1s,width 1s}
.eg-flysvg{width:100%;height:auto;overflow:visible}
.eg-wingL{animation:egflapL .5s ease-in-out infinite alternate;transform-origin:300px 170px}.eg-wingR{animation:egflapR .5s ease-in-out infinite alternate;transform-origin:340px 170px}
@keyframes egflapL{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}@keyframes egflapR{from{transform:rotate(14deg)}to{transform:rotate(-12deg)}}
.eg-dive{animation:egdive 1.1s ease-in forwards}@keyframes egdive{from{transform:translateX(-50%) translateY(-120%) scale(1.8)}to{transform:translateX(-50%) translateY(0) scale(1)}}
.eg-carried{position:absolute;left:50%;top:calc(22% + min(90vw,760px)*.56);width:min(15vw,110px);transform:translateX(-50%) rotate(8deg);z-index:6}
.eg-rider{position:absolute;left:50%;top:calc(22% + min(90vw,760px)*.1);width:min(13vw,96px);transform:translateX(-50%);z-index:4}
.eg-carried svg,.eg-rider svg{width:100%;height:auto}
.eg-flier{position:absolute}.eg-onback{position:absolute;left:50%;top:-14%;width:17%;transform:translateX(-50%);z-index:2}.eg-onback svg{width:100%;height:auto}
.eg-bob{animation:egbob .5s ease-in-out infinite alternate}@keyframes egbob{to{margin-top:-10px}}
.eg-scene{position:absolute;inset:0}
.eg-peak{position:absolute;inset:0;width:100%;height:100%}
.eg-nest{position:absolute;left:2%;bottom:3%;width:min(62%,560px);height:22%;z-index:6}
.eg-nest .twigs{position:absolute;left:0;right:0;bottom:0;height:62%;border-radius:50% 50% 40% 40%/60% 60% 40% 40%;background:repeating-linear-gradient(20deg,#7a5230 0 6px,#5d3c1f 6px 12px,#8f6338 12px 16px);box-shadow:inset 0 10px 20px rgba(0,0,0,.4)}
.eg-hero{position:absolute;left:8%;bottom:34%;height:110%;aspect-ratio:.8;z-index:2}.eg-hero svg{width:100%;height:100%}
.eg-chicks{position:absolute;left:44%;bottom:44%;display:flex;gap:2%;width:52%;z-index:2}.eg-chicks i{display:block;width:32%;aspect-ratio:1}.eg-chicks i svg{width:100%;height:100%}
.eg-cheer .eg-chicks i{animation:eghop .35s ease-out 3 alternate}.eg-cheer .eg-chicks i:nth-child(2){animation-delay:.1s}.eg-cheer .eg-chicks i:nth-child(3){animation-delay:.2s}
@keyframes eghop{to{transform:translateY(-30%)}}
.eg-sad .eg-chicks i{transform:rotate(-14deg)}
.eg-mama{position:absolute;right:1%;bottom:6%;height:78%;width:min(46%,420px);z-index:5}.eg-perch{width:100%;height:100%;overflow:visible}
.eg-phead{animation:eghead 3.5s ease-in-out infinite;transform-origin:175px 205px}@keyframes eghead{50%{transform:rotate(-4deg)}}
.eg-jaw{display:none}.tr-talk .eg-jaw{display:inline;animation:trjaw .2s infinite alternate}
.eg-browk{display:none}.eg-kind .eg-browk{display:inline}.eg-kind .eg-brow{display:none}
.eg-bubble{position:absolute;right:4%;top:5%;width:min(58%,460px)}
.eg-feather{position:absolute;left:50%;top:40%;font-size:90px;transform:translate(-50%,-50%);z-index:30;animation:egfeather 2.2s ease-out forwards;filter:drop-shadow(0 0 20px #ffd43b)}
@keyframes egfeather{0%{transform:translate(-50%,-50%) scale(.2) rotate(-40deg);opacity:0}30%{transform:translate(-50%,-50%) scale(1.3) rotate(10deg);opacity:1}100%{transform:translate(-50%,120%) scale(.5) rotate(0);opacity:0}}
.eg-screech{position:absolute;left:0;right:0;top:8%;text-align:center;font-weight:700;font-size:clamp(34px,8vw,70px);color:#fff;text-shadow:0 4px 0 #000;animation:trwob .25s infinite alternate;z-index:8}
.eg-stolen{position:absolute;left:18%;bottom:34%;z-index:13;font-size:clamp(18px,3vw,26px);font-weight:700;background:#ff5a5f;border-radius:14px;padding:6px 12px;animation:trsteal 1.6s ease-in forwards}
@media(max-width:600px){.eg-mama{height:62%;width:62%;right:-8%;bottom:14%}.eg-nest{width:86%;height:18%;bottom:14%}.eg-bubble{width:70%;right:3%}}
`;

/* ---------- main sequence ---------- */
async function start(){
 const p=P();const e=E(p);busy=true;window.trollBusy=true;const S=SH();
 if(!document.getElementById('egCSS')){const s=document.createElement('style');s.id='egCSS';s.textContent=CSS;document.head.appendChild(s);}
 const first=!e.visits||!!DEMO;
 // snapshot the map WITHOUT the hero (the eagle is carrying you, so you shouldn't also be standing down there)
 window.__hideHero=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 let snap='';try{const c=document.getElementById('wcv');if(c)snap=c.toDataURL('image/jpeg',.7);}catch(x){}
 window.__hideHero=false;
 root=S.el('<div class="eg-root"></div>');document.body.appendChild(root);
 const tone=(a,b,c,d,f)=>S.snd(a,b,c,d,f);
 // 1. a huge shadow sweeps over the map… SKREEE!
 root.appendChild(S.el(`<div class="eg-shadow">${FLY(false)}</div>`));
 [1500,1300,1100,900].forEach((f,k)=>tone(f,.25,'sawtooth',.05,k*.08));
 await sleep(1500);const dark=S.el('<div class="eg-dark"></div>');root.appendChild(dark);await sleep(30);dark.classList.add('on');await sleep(800);
 // 2. sky: the eagle dives and grabs you
 const sky=S.el(`<div class="eg-sky">${snap?`<div class="eg-ground" style="background-image:url(${snap})"></div>`:'<div class="eg-ground" style="background:linear-gradient(#9ccf66,#5fae4b)"></div>'}<div class="eg-flier eg-dive">${FLY(true)}</div><div class="eg-screech">SKREEEEE!</div></div>`);
 root.insertBefore(sky,dark);dark.classList.remove('on');tone(1400,.5,'sawtooth',.06);tone(1000,.5,'sawtooth',.05,.2);
 await sleep(1300);sky.querySelector('.eg-screech').remove();
 const hero=S.el(`<div class="eg-carried eg-bob">${S.heroHTML(p)}</div>`);sky.appendChild(hero);tone(300,.15,'square',.08);
 if(first)await S.tapWait('😱','<p>GIANT TALONS grab you! A <b>huge eagle</b> is carrying you up into the sky!</p>',null,root);
 // 3. fly up — the map shrinks away below
 sky.querySelector('.eg-flier').classList.remove('eg-dive');sky.querySelector('.eg-ground').classList.add('small');
 for(let i=0;i<4;i++)sky.appendChild(S.el(`<i class="eg-cloud" style="left:${5+i*24}%;animation-delay:${i*.4}s"></i>`));
 [500,600,700,800].forEach((f,k)=>tone(f,.4,'triangle',.04,k*.3));
 if(first)await S.tapWait('…','<p>Higher and higher… Number Village looks <b>tiny</b> down there!</p>',null,root);else await sleep(2600);
 dark.classList.add('on');await sleep(700);sky.remove();
 // 4. the nest on the mountain peak
 const stage=S.el(`<div class="eg-scene tr-stage">${PEAK}<div class="eg-mama">${PERCH}</div>
  <div class="eg-nest"><div class="eg-hero">${S.heroHTML(p)}</div><div class="eg-chicks"><i>${CHICK}</i><i>${CHICK}</i><i>${CHICK}</i></div><div class="twigs"></div></div>
  <div class="tr-bubble eg-bubble" style="display:none"></div></div>`);
 root.insertBefore(stage,dark);dark.classList.remove('on');
 const bub=stage.querySelector('.tr-bubble');const say=(t,nn)=>S.say(bub,t,nn?300:0,!!nn,WHO);
 if(first){
  await S.tapWait('🐣','<p>She drops you into a <b>giant nest</b> on top of a mountain — right next to three fuzzy eaglets!</p>',null,root);
  await say(`SKREEE! An EGG THIEF! I saw you sneaking around down there! I am ${ENAME}, and these are MY chicks!`);
  await say('My chicks start Flight School tomorrow, and they need help with their homework. Solve THREE problems for them… and maybe I\'ll believe you\'re not a thief!');
 }else{
  const hi=['You again! My chicks have NEW homework for you!','Peep peep! The chicks asked for YOU! Homework time!','Back in my nest! Three problems, clever one!'];
  await say(hi[e.visits%hi.length]+(e.hoard.length?` I'm still keeping ${e.hoard.length===1?'something shiny':'some shiny things'} of yours… get them right and you can win ${e.hoard.length===1?'it':'them'} back!`:''));
 }
 // 5. three story problems
 const res=[],took=[],gave=[];
 for(let i=0;i<3;i++){
  let q=storyQ(p,0);
  const ans=await S.ask(stage,bub,q,i,res,{who:WHO,intro:['Homework problem ONE!','Problem TWO!','Last one… problem THREE!'],story:true,easier:()=>storyQ(p,-1)});
  const ok=ans.ok;q=ans.q;res.push(ok);
  const dk=dayKey();p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][ok?'r':'w']++;
  if(ok){tone(880,.1,'triangle',.1);tone(1320,.15,'triangle',.1,.08);stage.classList.add('eg-cheer');
   let g=null;if(!first)g=S.giveBack(p,e);if(g){gave.push(g);stage.appendChild(S.el(`<div class="tr-given">${esc(S.label(g))} ↩</div>`));}
   await say(g?`Correct! PEEP PEEP! Here — have ${S.label(g)} back.`:['Correct! PEEP PEEP! 🎉','Right again! The chicks are cheering!','Correct! What a smart human!'][i]);stage.classList.remove('eg-cheer');}
  else{tone(300,.2,'sine',.08);stage.classList.add('eg-sad');
   let tk=null;if(!first)tk=S.take(p,e,SHINY);if(tk){took.push(tk);stage.appendChild(S.el(`<div class="eg-stolen">${esc(S.label(tk))} ➜ 🪺</div>`));}
   const a=q.tpl&&typeof xAnsStr==='function'?xAnsStr(q):q.answer;
   await say(`Peep? Not quite — it was ${a}. ${tk?`Ooh, SHINY! I'll keep ${S.label(tk)} in my nest!`:'But thank you for trying!'}`);stage.classList.remove('eg-sad');}
  save();
 }
 const right=res.filter(Boolean).length;
 if(right===3){p.feathers=(p.feathers||0)+1;tone(1046,.3,'triangle',.1);tone(1318,.3,'triangle',.1,.12);tone(1568,.4,'triangle',.1,.24);
  stage.appendChild(S.el('<div class="eg-feather">🪶</div>'));
  await say('ALL THREE! You earned a GOLDEN FEATHER! 🪶 When the Troll or I ask a question that\'s too hard, use it to make the question easier.');}
 if(first){
  stage.classList.add('eg-kind');
  await say('You\'re no egg thief… you\'re a FRIEND! My chicks love you already. 💛');
  await say('But be careful! Next time, if you miss a problem, I\'ll keep something SHINY for my nest. Eagles LOVE shiny things!');
 }else await say(took.length?'Remember — get them right next time and you can win your shiny things back!':'Great job, friend!');
 e.visits++;e.last=Date.now();e.best=Math.max(e.best||0,right);save();
 // 6. ride home on her back — friends now
 stage.classList.add('eg-kind');await say('Hop on my back — I\'ll fly you home, friend!');
 dark.classList.add('on');await sleep(700);stage.remove();
 const ride=S.el(`<div class="eg-sky eg-down">${snap?`<div class="eg-ground small" style="background-image:url(${snap})"></div>`:'<div class="eg-ground small" style="background:linear-gradient(#9ccf66,#5fae4b)"></div>'}<div class="eg-flier eg-bob">${FLY(false)}<div class="eg-onback">${S.heroHTML(p)}</div></div><div class="eg-screech" style="color:#ffe066;top:auto;bottom:12%">WOO-HOO!</div></div>`);
 for(let i=0;i<4;i++)ride.appendChild(S.el(`<i class="eg-cloud" style="left:${8+i*22}%;animation-delay:${i*.35}s"></i>`));
 root.insertBefore(ride,dark);dark.classList.remove('on');[600,800,1000,1200,1000,800].forEach((f,k)=>tone(f,.3,'triangle',.05,k*.18));
 await sleep(600);ride.querySelector('.eg-ground').classList.remove('small');
 await sleep(3300);dark.classList.add('on');await sleep(700);
 root.remove();root=null;busy=false;window.trollBusy=false;
 if(DEMO){const s=JSON.parse(DEMO);DEMO=null;Object.assign(p,{coins:s.coins,pets:s.pets,owned:s.owned,toys:s.toys,daily:s.daily,feathers:s.feathers});if(s.eagle)p.eagle=s.eagle;else delete p.eagle;if(s.troll)p.troll=s.troll;save();try{toast('🦅 That was a preview — nothing was changed.');go('world');}catch(x){}return;}
 const summary=[took.length?`🦅 ${ENAME} kept: ${took.map(S.label).join(', ')}`:'',gave.length?`↩ You won back: ${gave.map(S.label).join(', ')}`:'',right===3?'🪶 +1 Golden Feather':''].filter(Boolean).join(' · ');
 try{toast(`🦅 ${ENAME} flew you home! ${right}/3 right.${summary?' '+summary:''}`);}catch(x){}
 try{if(curScreen==='world')go('world');}catch(x){}
}
/* ?eagledemo — parents can preview; everything is put back afterwards */
if(/eagledemo/.test(location.search)){const iv=setInterval(()=>{try{const p=P();if(p&&p.setup&&window.Troll){clearInterval(iv);DEMO=JSON.stringify({eagle:p.eagle||null,troll:p.troll||null,coins:p.coins,pets:p.pets,owned:p.owned,toys:p.toys,daily:p.daily,feathers:p.feathers||0});const t=Troll._T(p);t.force=1;t.forceEagle=1;toast('🦅 Eagle preview: take a step on an empty square…');}}catch(x){}},500);}
window.Eagle={start,_E:E,_q:storyQ};
})();
