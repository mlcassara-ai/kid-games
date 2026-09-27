/* Grumbleroot the Troll — the trap door under the main map.
   Uses Math Quest globals: P(), save(), genQ, pickOp, lvl, heroSVG, PETS, HATS, ROBES, SPELLS, PET_TOYS, dayKey, SFX, tone, esc. */
(function(){
'use strict';
const TNAME='Grumbleroot';
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let root=null,skip=false,busy=false;
window.trollBusy=false;

/* ---------- state ---------- */
function T(p){p.troll=p.troll||{};const t=p.troll;t.visits=t.visits||0;t.hoard=t.hoard||[];t.play=t.play||0;return t;}
/* about a 1-in-3 chance per hour of play: each hour of play time gets one roll; if it hits, the trap waits at a random moment in that hour
   and springs on the next unmarked square you step on after that moment */
const HOUR=3600,CHANCE=1/3;
function roll(t){const w=Math.floor(t.play/HOUR);if(t.win!==w){t.win=w;t.at=Math.random()<CHANCE?w*HOUR+Math.random()*HOUR:null;}}
setInterval(()=>{try{const p=P();if(!p||document.hidden||!p.setup)return;const idle=typeof tbLastInput!=='undefined'?Date.now()-tbLastInput:0;if(idle>90000)return;const t=T(p);t.play+=10;roll(t);}catch(e){}},10000);
/* unmarked squares: plain ground or path in the wild — no decorations, buildings, gates, chests, water, village */
function unmarked(t){return t&&!t.block&&!t.water&&!t.deco&&!t.o&&!t.npc&&!t.gate&&!t.chest&&!t.plaza&&t.b!=='village';}
window.trollCheck=function(tile){
 const p=P();if(!p||busy||typeof curScreen==='undefined'||curScreen!=='world')return false;
 if(document.querySelector('#modal.show'))return false;
 if(!unmarked(tile))return false;
 const t=T(p);roll(t);
 if(!t.force&&(t.at==null||t.play<t.at))return false;
 t.at=null;t.force=0;save();start();return true;};
/* ?trolldemo in the URL: the next unmarked step drops you in, and afterwards everything is put back exactly as it was (for parents to preview) */
let DEMO=null;
if(/trolldemo/.test(location.search)){const iv=setInterval(()=>{try{const p=P();if(p&&p.setup){clearInterval(iv);DEMO=JSON.stringify({troll:p.troll||null,coins:p.coins,pets:p.pets,owned:p.owned,toys:p.toys,daily:p.daily});T(p).force=1;if(typeof toast==='function')toast('🧌 Troll preview: take a step on an empty square…');}}catch(e){}},500);}

/* ---------- things the troll can take / give back ---------- */
function takeable(p){const out=[];
 if((p.coins||0)>=30)out.push({k:'coins',v:Math.max(20,Math.min(400,Math.round(p.coins*.2)))});
 (p.pets||[]).filter(id=>id!==p.pet).forEach(id=>out.push({k:'pet',id}));
 const ow=p.owned||{};
 (ow.hats||[]).filter(id=>id!==(p.look&&p.look.hat)&&(HATS.find(h=>h.id===id)||{}).price>0).forEach(id=>out.push({k:'hat',id}));
 (ow.robes||[]).filter(id=>id!==(p.look&&p.look.robe)&&(ROBES.find(h=>h.id===id)||{}).price>0).forEach(id=>out.push({k:'robe',id}));
 (ow.spells||[]).filter(id=>id!==p.spell&&(SPELLS.find(h=>h.id===id)||{}).price>0).forEach(id=>out.push({k:'spell',id}));
 (p.toys||[]).forEach(id=>out.push({k:'toy',id}));
 return out;}
function label(it){
 if(it.k==='coins')return `🪙 ${it.v} gold coins`;
 if(it.k==='pet'){const x=PETS.find(q=>q.id===it.id)||{e:'🐾',name:'a pet'};return `${x.e} your pet ${x.name}`;}
 if(it.k==='hat'){const x=HATS.find(q=>q.id===it.id)||{name:'hat'};return `🎩 your ${x.name}`;}
 if(it.k==='robe'){const x=ROBES.find(q=>q.id===it.id)||{name:''};return `👘 your ${x.name} robe`;}
 if(it.k==='spell'){const x=SPELLS.find(q=>q.id===it.id)||{e:'✨',name:'spell'};return `${x.e} your ${x.name} spell`;}
 if(it.k==='toy'){const x=(typeof PET_TOYS!=='undefined'&&PET_TOYS.find(q=>q.id===it.id))||{e:'🧸',name:'toy'};return `${x.e} your ${x.name}`;}
 return 'something';}
function take(p){const opts=takeable(p);if(!opts.length)return null;
 // favour coins & toys a bit; pets are rarer so it doesn't sting too much
 const w=opts.map(o=>o.k==='coins'?4:o.k==='pet'?1:2);let r=Math.random()*w.reduce((a,b)=>a+b,0);let it=opts[0];for(let i=0;i<opts.length;i++){r-=w[i];if(r<=0){it=opts[i];break;}}
 if(it.k==='coins')p.coins-=it.v;
 else if(it.k==='pet')p.pets=p.pets.filter(x=>x!==it.id);
 else if(it.k==='toy')p.toys.splice(p.toys.indexOf(it.id),1);
 else{const key=it.k+'s';p.owned[key]=p.owned[key].filter(x=>x!==it.id);}
 T(p).hoard.push(it);return it;}
function giveBack(p){const t=T(p);const it=t.hoard.pop();if(!it)return null;
 if(it.k==='coins')p.coins=(p.coins||0)+it.v;
 else if(it.k==='pet'){if(!p.pets.includes(it.id))p.pets.push(it.id);}
 else if(it.k==='toy')p.toys.push(it.id);
 else{const key=it.k+'s';p.owned[key]=p.owned[key]||[];if(!p.owned[key].includes(it.id))p.owned[key].push(it.id);}
 return it;}
window.trollHoardHTML=function(p){const t=p.troll;if(!t||!t.hoard||!t.hoard.length)return '';
 return `<div class="tr-hoardbox"><b>🧌 ${TNAME} the Troll is holding:</b> ${t.hoard.map(label).map(esc).join(' · ')}<br><small>Answer his questions right next time he catches you to win them back!</small></div>`;};

/* ---------- art ---------- */
const TROLL=`<svg class="tr-troll" viewBox="0 0 420 540" preserveAspectRatio="xMidYMax meet">
<defs><radialGradient id="trSkin" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#7a8a46"/><stop offset=".55" stop-color="#4c5a28"/><stop offset="1" stop-color="#232b12"/></radialGradient>
<radialGradient id="trBelly" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#8f9a55"/><stop offset="1" stop-color="#57642c"/></radialGradient>
<filter id="trGlowF" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="trShade" x1="0" x2="1"><stop offset="0" stop-color="#ffd98a" stop-opacity=".18"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient><radialGradient id="trEye" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff7a0"/><stop offset=".5" stop-color="#ffd000"/><stop offset="1" stop-color="#ff7b00"/></radialGradient></defs>
<g class="tr-body">
 <!-- legs & feet -->
 <path d="M130 430 Q120 500 110 515 L190 515 Q185 470 190 430Z" fill="url(#trSkin)"/><path d="M240 430 Q245 480 238 515 L318 515 Q300 490 300 430Z" fill="url(#trSkin)"/>
 <path d="M92 515 Q95 495 125 495 L195 500 Q205 515 200 528 L90 530Z" fill="#4c5829"/><path d="M232 500 L300 495 Q332 497 334 515 L336 530 L228 528Z" fill="#4c5829"/>
 <g fill="#d9cf9a"><ellipse cx="102" cy="526" rx="9" ry="5"/><ellipse cx="124" cy="528" rx="9" ry="5"/><ellipse cx="310" cy="528" rx="9" ry="5"/><ellipse cx="328" cy="526" rx="8" ry="5"/></g>
 <!-- arms (behind) -->
 <path d="M70 200 Q20 300 40 420 Q46 470 60 490 L100 480 Q96 400 118 300Z" fill="url(#trSkin)"/>
 <path d="M350 200 Q405 300 385 420 Q380 470 366 490 L326 480 Q330 400 306 300Z" fill="url(#trSkin)"/>
 <!-- torso -->
 <path d="M70 190 Q60 120 150 110 L280 110 Q365 120 352 200 Q370 330 320 440 L110 440 Q55 330 70 190Z" fill="url(#trSkin)"/>
 <ellipse cx="212" cy="330" rx="105" ry="95" fill="url(#trBelly)"/>
 <path d="M205 330 q6 5 0 10" stroke="#4d5a26" stroke-width="3" fill="none"/>
 <!-- loincloth + belt with cage keys -->
 <path d="M104 405 L320 405 L316 450 L290 470 L270 448 L245 475 L220 450 L196 476 L172 450 L148 472 L128 446 L106 452Z" fill="#6b4a2b"/>
 <rect x="100" y="398" width="224" height="16" rx="6" fill="#3d2a17"/><circle cx="160" cy="406" r="7" fill="#b98a2e"/>
 <g stroke="#caa24a" stroke-width="3" fill="none"><circle cx="262" cy="422" r="9"/><path d="M258 430 l-4 22 m0 -6 h6 m-6 -6 h5"/><path d="M268 431 l6 20 m-2 -6 h6"/></g>
 <!-- hands -->
 <g fill="#5d6b34" stroke="#394221" stroke-width="2"><path d="M34 470 Q30 510 52 518 Q64 526 76 516 Q92 522 100 508 Q112 506 108 486 L96 470Z"/><path d="M386 470 Q392 510 370 518 Q358 526 346 516 Q330 522 322 508 Q310 506 314 486 L326 470Z"/></g>
 <!-- warts & moss -->
 <g fill="#4a5626"><circle cx="120" cy="230" r="5"/><circle cx="300" cy="260" r="6"/><circle cx="160" cy="300" r="4"/><circle cx="330" cy="330" r="4"/><circle cx="255" cy="380" r="4"/></g>
 <path d="M300 150 q20 -14 40 4 q-12 -2 -16 8 q-8 -8 -24 -12Z" fill="#3f6b2a"/><path d="M90 160 q18 -18 36 -6 q-10 2 -12 10 q-10 -6 -24 -4Z" fill="#3f6b2a"/>
</g>
<g class="tr-head">
 <!-- ears -->
 <path d="M112 118 Q48 70 30 122 Q70 120 104 150Z" fill="#6f7d3f" stroke="#394221" stroke-width="3"/><path d="M308 118 Q372 70 390 122 Q350 120 316 150Z" fill="#6f7d3f" stroke="#394221" stroke-width="3"/>
 <!-- head -->
 <path d="M110 150 Q96 40 210 30 Q324 40 310 150 Q318 210 262 226 L158 226 Q102 210 110 150Z" fill="url(#trSkin)" stroke="#394221" stroke-width="3"/>
 <!-- hair tufts -->
 <path d="M150 44 q-10 -30 14 -34 q-2 18 10 22 q0 -24 22 -28 q-4 20 8 26 q8 -24 30 -22 q-10 14 -4 28 q16 -16 34 -8 q-14 8 -14 20" fill="#2f3f1c"/>
 <!-- brow -->
 <path class="tr-brow-angry" d="M136 88 L206 116 L284 88 L288 104 L206 132 L132 104Z" fill="#1c230d"/><path class="tr-brow-kind" d="M140 96 Q172 74 200 94 L196 102 Q170 88 146 104Z M280 96 Q248 74 220 94 L224 102 Q250 88 274 104Z" fill="#1c230d"/>
 <!-- eyes -->
 <g class="tr-eyes" filter="url(#trGlowF)"><ellipse cx="175" cy="118" rx="14" ry="11" fill="url(#trEye)"/><ellipse cx="245" cy="118" rx="14" ry="11" fill="url(#trEye)"/><circle cx="177" cy="119" r="5" fill="#8b0000"/><circle cx="243" cy="119" r="5" fill="#8b0000"/></g>
 <!-- nose -->
 <path d="M196 116 Q168 150 176 172 Q190 192 210 186 Q232 192 244 172 Q252 150 224 116Z" fill="#7e8c46" stroke="#394221" stroke-width="3"/>
 <g fill="#566429"><circle cx="186" cy="160" r="5"/><circle cx="232" cy="150" r="4"/><circle cx="214" cy="140" r="3"/></g>
 <ellipse cx="196" cy="178" rx="6" ry="4" fill="#2a3016"/><ellipse cx="224" cy="178" rx="6" ry="4" fill="#2a3016"/>
 <!-- mouth -->
 <path class="tr-drool" d="M262 204 q4 10 0 20 q-4 -10 0 -20Z" fill="#9fd9ff" opacity=".8"/>
 <g class="tr-mclosed"><path d="M150 200 Q210 220 272 198" stroke="#2a3016" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M162 204 L168 180 L176 206Z" fill="#f2ead0"/><path d="M252 204 L258 178 L264 202Z" fill="#f2ead0"/></g>
 <g class="tr-mopen"><path d="M150 196 Q210 250 272 196 Q210 214 150 196Z" fill="#3a0d0d" stroke="#2a3016" stroke-width="4"/><path d="M162 200 L168 176 L176 204Z" fill="#f2ead0"/><path d="M252 202 L258 174 L264 200Z" fill="#f2ead0"/><path d="M196 226 Q210 236 226 226 Q212 222 196 226Z" fill="#c0392b"/></g>
</g></svg>`;
const CAVE=`<svg class="tr-cave" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="trGlow" cx="50%" cy="60%" r="65%"><stop offset="0" stop-color="#3b2f4a"/><stop offset=".6" stop-color="#1a1224"/><stop offset="1" stop-color="#07040c"/></radialGradient></defs>
<rect width="800" height="500" fill="url(#trGlow)"/>
<path d="M0 0 H800 V60 L760 40 L740 110 L715 45 L680 70 L660 30 L620 90 L600 40 L560 60 L540 20 L500 80 L470 35 L430 60 L400 25 L360 95 L330 40 L300 70 L270 30 L240 85 L210 40 L170 70 L140 30 L110 100 L80 45 L50 70 L20 35 L0 60Z" fill="#0d0912"/>
<path d="M0 500 V430 Q80 400 170 425 Q260 440 330 418 Q440 395 540 425 Q650 450 800 415 V500Z" fill="#120c18"/>
<g class="tr-mush"><ellipse cx="70" cy="428" rx="16" ry="8" fill="#6ff7c8"/><rect x="66" y="428" width="8" height="14" fill="#9ad"/><ellipse cx="96" cy="436" rx="10" ry="5" fill="#6ff7c8"/><ellipse cx="560" cy="428" rx="14" ry="7" fill="#b28dff"/><rect x="556" y="428" width="7" height="14" fill="#ccb"/><ellipse cx="760" cy="420" rx="12" ry="6" fill="#6ff7c8"/></g>
<g fill="#ffe25c" class="tr-bateyes"><circle cx="120" cy="120" r="2.5"/><circle cx="128" cy="120" r="2.5"/><circle cx="690" cy="150" r="2.5"/><circle cx="698" cy="150" r="2.5"/></g>
<g class="tr-drips" fill="#8fd3ff"><circle cx="300" cy="80" r="3"/><circle cx="610" cy="95" r="3"/></g>
<g fill="#e9e0c8" opacity=".6"><path d="M430 470 l30 -6 l2 5 l-30 6z"/><circle cx="428" cy="471" r="5"/><circle cx="464" cy="463" r="5"/></g></svg>`;
function heroHTML(p){try{return heroSVG(p.look,{spell:p.spell});}catch(e){return '<div style="font-size:60px">🧙</div>';}}

/* ---------- styles ---------- */
const CSS=`
.tr-root{position:fixed;inset:0;z-index:6000;background:#000;overflow:hidden;font-family:'Fredoka',system-ui,sans-serif;color:#fff;-webkit-user-select:none;user-select:none}
.tr-fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .8s;pointer-events:none;z-index:50}.tr-fade.on{opacity:1}
.tr-skip{position:absolute;right:12px;top:calc(10px + env(safe-area-inset-top));z-index:60;background:rgba(255,255,255,.18);color:#fff;border:none;border-radius:12px;padding:8px 12px;font:600 14px Fredoka,sans-serif}
.tr-scene{position:absolute;inset:0}
.tr-shaft{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#2b1d12 0 40px,#3a2718 40px 44px,#24170d 44px 90px,#4a331f 90px 94px);animation:trfall .35s linear infinite}
.tr-shaft::before,.tr-shaft::after{content:'';position:absolute;top:0;bottom:0;width:22%;background:linear-gradient(90deg,#000,transparent)}.tr-shaft::before{left:0}.tr-shaft::after{right:0;transform:scaleX(-1)}
@keyframes trfall{from{background-position:0 0}to{background-position:0 -188px}}
.tr-faller{position:absolute;left:50%;top:38%;width:120px;height:140px;margin-left:-60px;animation:trtumble .7s linear infinite}
.tr-faller svg{width:100%;height:100%}
@keyframes trtumble{0%{transform:rotate(0) translateY(0)}50%{transform:rotate(180deg) translateY(12px)}100%{transform:rotate(360deg) translateY(0)}}
.tr-rock{position:absolute;width:14px;height:10px;background:#6b5040;border-radius:40%;animation:trrock 1s linear infinite}
@keyframes trrock{from{transform:translateY(110vh)}to{transform:translateY(-20vh)}}
.tr-big{position:absolute;left:0;right:0;text-align:center;font-weight:700;text-shadow:0 4px 0 #000}
.tr-aah{top:14%;font-size:clamp(34px,8vw,64px);color:#ffd43b;animation:trwob .3s infinite alternate}
@keyframes trwob{to{transform:translateX(8px) rotate(2deg)}}
.tr-thump{top:40%;font-size:clamp(50px,13vw,110px);color:#fff;animation:trpop .5s ease-out}
@keyframes trpop{from{transform:scale(3);opacity:0}to{transform:scale(1);opacity:1}}
.tr-shake{animation:trshake .5s}@keyframes trshake{20%{transform:translate(-14px,8px)}40%{transform:translate(12px,-10px)}60%{transform:translate(-8px,6px)}80%{transform:translate(6px,-4px)}}
.tr-blink{position:absolute;left:50%;top:42%;width:180px;margin-left:-90px;display:flex;justify-content:space-between}
.tr-blink i{width:56px;height:32px;background:#fff;border-radius:50%;animation:trblink 2.2s infinite;box-shadow:0 0 18px rgba(255,255,255,.4)}
.tr-blink i::after{content:'';display:block;width:18px;height:18px;border-radius:50%;background:#2b2140;margin:7px auto}
@keyframes trblink{0%,40%,54%,100%{transform:scaleY(1)}45%,50%{transform:scaleY(.05)}}
.tr-text{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(20px + env(safe-area-inset-bottom));width:min(620px,92vw);background:rgba(20,12,30,.92);border:3px solid #6b5a8a;border-radius:18px;padding:14px 16px;font-size:clamp(16px,2.6vw,20px);line-height:1.4;z-index:20;text-align:center}
.tr-text .tr-btn{margin-top:10px}
.tr-btn{background:#7c5cff;color:#fff;border:none;border-radius:14px;padding:11px 20px;font:600 18px Fredoka,sans-serif;box-shadow:0 4px 0 #4a31c9;cursor:pointer}
.tr-btn.gold{background:#ffc83d;color:#5a3b00;box-shadow:0 4px 0 #c98f00}
.tr-wand{position:absolute;left:50%;top:30%;width:120px;margin-left:-60px;font-size:70px;text-align:center;animation:trwand 1.4s ease-in-out infinite alternate}
@keyframes trwand{to{transform:rotate(-14deg)}}
.tr-light{position:absolute;inset:0;background:radial-gradient(circle at 26% 70%,rgba(255,244,190,.0) 0,rgba(0,0,0,.0) 0);pointer-events:none;z-index:15}
.tr-flash{position:absolute;inset:0;background:radial-gradient(circle at 26% 72%,#fff8c8 0,rgba(255,240,170,.6) 18%,transparent 60%);opacity:0;z-index:16;pointer-events:none;transition:opacity .5s}.tr-flash.on{opacity:1}
.tr-stage{position:absolute;inset:0;overflow:hidden}
.tr-cave{position:absolute;inset:0;width:100%;height:100%}
.tr-dark{position:absolute;inset:0;background:radial-gradient(circle at 24% 78%,transparent 0,transparent 12%,rgba(0,0,0,.55) 30%,rgba(0,0,0,.92) 70%);z-index:8;pointer-events:none;transition:background 1.5s}
.tr-dark.lit{background:radial-gradient(ellipse at 45% 70%,transparent 0,transparent 35%,rgba(0,0,0,.5) 75%,rgba(0,0,0,.85) 100%)}
.tr-trollbox{position:absolute;right:2%;bottom:6%;height:86%;width:min(56%,560px);z-index:5;transform-origin:bottom center;transition:transform 1.2s,filter 1.2s}
.tr-trollbox.hidden{filter:brightness(0);transform:translateY(4%)}
.tr-troll{width:100%;height:100%;overflow:visible}
.tr-trollbox.tr-behind{right:auto;left:-8%;z-index:4}.tr-bleft .tr-bubble{right:auto;left:30%}
.tr-body{animation:trbreathe 3.2s ease-in-out infinite;transform-origin:210px 520px}@keyframes trbreathe{50%{transform:scaleY(1.025)}}
.tr-head{animation:trhead 4s ease-in-out infinite;transform-origin:210px 220px}@keyframes trhead{50%{transform:rotate(-2deg)}}
.tr-eyes{animation:trteyes 5s infinite;transform-origin:210px 118px}@keyframes trteyes{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.tr-brow-kind{display:none}.tr-kind .tr-brow-kind{display:inline}.tr-kind .tr-brow-angry{display:none}
.tr-drool{animation:trdrool 2.6s ease-in infinite;transform-origin:262px 204px}@keyframes trdrool{0%,40%{transform:scaleY(.2);opacity:0}70%{transform:scaleY(1.3);opacity:.9}100%{transform:translateY(40px) scaleY(.5);opacity:0}}
.tr-eyesdark{position:absolute;left:12%;top:14%;width:130px;display:flex;justify-content:space-between;z-index:3;animation:trteyes 4s infinite}.tr-eyesdark i{width:34px;height:22px;border-radius:50%;background:radial-gradient(#fff7a0,#ffb000 55%,#ff5a00);box-shadow:0 0 22px 6px rgba(255,160,0,.6)}
.tr-mopen{display:none}.tr-talk .tr-mopen{display:inline;animation:trjaw .22s infinite alternate}.tr-talk .tr-mclosed{display:none}
@keyframes trjaw{to{transform:translateY(4px)}}
.tr-roar .tr-trollbox{animation:trshake .6s 2}
.tr-herobox{position:absolute;left:10%;bottom:7%;height:17%;aspect-ratio:.8;z-index:6;transition:transform 1s,filter 1s}
.tr-herobox svg{width:100%;height:100%}.tr-herobox.faint{transform:rotate(-90deg) translateX(-30%);filter:brightness(.7)}
.tr-cage{position:absolute;left:5.5%;bottom:5.5%;height:26%;aspect-ratio:1.15;z-index:7;display:none;border-top:10px solid #4b4b55;border-bottom:10px solid #4b4b55;border-radius:10px;background:repeating-linear-gradient(90deg,transparent 0 14%,#6d6d78 14% 18%)}
.tr-cage.on{display:block}.tr-cage.open{animation:trcage 1s forwards}@keyframes trcage{to{transform:translateY(-140%);opacity:0}}
.tr-bubble{position:absolute;right:6%;top:6%;width:min(50%,430px);background:#fffaf0;color:#2b2140;border-radius:20px;padding:14px 16px;font-size:clamp(15px,2.4vw,20px);line-height:1.35;z-index:12;box-shadow:0 8px 24px rgba(0,0,0,.6);border:3px solid #6b4a2b}
.tr-bubble::after{content:'';position:absolute;right:30%;bottom:-18px;border:12px solid transparent;border-top:14px solid #fffaf0}
.tr-bubble b.tr-name{display:block;color:#6b4a2b;font-size:.8em;margin-bottom:2px}
.tr-q{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom));width:min(430px,94vw);background:rgba(20,12,30,.94);border:3px solid #6b5a8a;border-radius:18px;padding:10px;z-index:20;text-align:center}
.tr-qt{font-size:clamp(24px,5vw,36px);font-weight:700;margin:4px 0 8px}.tr-qt .ansbox{display:inline-block;min-width:70px;border-bottom:3px solid #ffd43b;color:#ffd43b}
.tr-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.tr-pad button.go{grid-column:span 3}.tr-pad button{background:#3a2d55;color:#fff;border:none;border-radius:12px;font:700 22px Fredoka,sans-serif;padding:9px 0}
.tr-pad button.go{background:#2ecc71}.tr-pad button.neg{visibility:hidden}.tr-pad.negon button.neg{visibility:visible}
.tr-dots{display:flex;gap:6px;justify-content:center;margin-bottom:4px}.tr-dots i{width:14px;height:14px;border-radius:50%;background:#555}.tr-dots i.ok{background:#2ecc71}.tr-dots i.no{background:#ff5a5f}.tr-dots i.cur{background:#ffd43b}
.tr-toss{animation:trtoss 1.9s cubic-bezier(.35,.1,.6,1) forwards}@keyframes trtoss{from{transform:translate(var(--sx),var(--sy)) rotate(0)}30%{transform:translate(calc(var(--sx) + 3vw),calc(var(--sy) - 25vh)) rotate(260deg)}to{transform:translate(calc(var(--sx) + 10vw),-130vh) rotate(900deg)}}
.tr-walk .tr-troll{animation:trbob .36s ease-in-out infinite alternate}@keyframes trbob{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-10px) rotate(2deg)}}
.tr-grab{top:34%;left:0;right:auto;width:50%;z-index:14;font-size:clamp(34px,8vw,60px);color:#ffd43b;animation:trpop .4s ease-out}
.tr-whee{top:12%;left:0;right:auto;width:55%;z-index:14;font-size:clamp(34px,8vw,64px);color:#8fd3ff;animation:trwob .3s infinite alternate}
.tr-next{display:block;margin:8px 0 0 auto;background:#6b4a2b;color:#fff;border:none;border-radius:12px;padding:7px 16px;font:700 16px Fredoka,sans-serif;cursor:pointer;animation:trnext 1.2s infinite}@keyframes trnext{50%{transform:translateX(4px)}}
.tr-hoardbox{background:#2b2140;color:#fff;border-radius:14px;padding:10px 12px;margin:10px 0;font-size:14px}.tr-hoardbox small{color:#cbbfe6}
.tr-stolen{position:absolute;left:18%;bottom:30%;z-index:13;font-size:clamp(18px,3vw,26px);font-weight:700;background:#ff5a5f;border-radius:14px;padding:6px 12px;animation:trsteal 1.6s ease-in forwards}
@keyframes trsteal{60%{transform:translate(0,-40px)}100%{transform:translate(55vw,-10vh) scale(.4);opacity:0}}
.tr-given{position:absolute;right:22%;bottom:40%;z-index:13;font-size:clamp(18px,3vw,26px);font-weight:700;background:#2ecc71;border-radius:14px;padding:6px 12px;animation:trgive 1.6s ease-in forwards}
@keyframes trgive{60%{transform:translate(0,-30px)}100%{transform:translate(-50vw,10vh) scale(.5);opacity:0}}
@media(max-width:600px){.tr-trollbox{width:86%;height:74%;bottom:18%;right:-30%}.tr-trollbox.tr-behind{left:-26%;right:auto}.tr-bubble{width:62%;right:3%;top:4%}.tr-herobox{height:13%;left:6%;bottom:18%}.tr-cage{left:2%;bottom:16.5%;height:20%}}
`;

/* ---------- helpers ---------- */
function el(html){const d=document.createElement('div');d.innerHTML=html;return d.firstElementChild;}
function snd(f,d,t,v,w){try{tone(f,d,t||'sine',v||.12,w||0);}catch(e){}}
function tapWait(btnText,box,cls){return new Promise(res=>{const t=el(`<div class="tr-text">${box}${btnText?`<div><button class="tr-btn ${cls||''}">${btnText}</button></div>`:''}</div>`);root.appendChild(t);
 const b=t.querySelector('button');const done=()=>{t.remove();res();};if(b)b.onclick=done;else{t.onclick=done;}
 if(skip)done();});}
/* the troll talks: text types out (tap to finish it), then a Next button waits for the kid — nothing rushes by */
async function say(bub,text,ms,noNext){bub.style.display='';bub.innerHTML=`<b class="tr-name">🧌 ${TNAME}</b>`;const span=document.createElement('span');bub.appendChild(span);const st=root.querySelector('.tr-stage');st.classList.add('tr-talk');
 let fast=false;bub.onclick=()=>{fast=true;};
 for(let i=0;i<text.length&&!fast;i+=2){span.textContent=text.slice(0,i+2);await sleep(30);}span.textContent=text;st.classList.remove('tr-talk');bub.onclick=null;
 if(noNext){if(ms)await sleep(ms);return;}
 await new Promise(res=>{const b=document.createElement('button');b.className='tr-next';b.textContent='Next ▸';bub.appendChild(b);
  const key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();done();}};const done=()=>{window.removeEventListener('keydown',key);b.remove();res();};
  b.onclick=e=>{e.stopPropagation();try{SFX.tap();}catch(x){}done();};window.addEventListener('keydown',key);});}
function growl(){snd(90,.5,'sawtooth',.09);snd(70,.6,'sawtooth',.08,.15);}

/* ---------- the sequence ---------- */
async function start(){
 const p=P();const t=T(p);busy=true;window.trollBusy=true;skip=false;
 if(!document.getElementById('trCSS')){const s=document.createElement('style');s.id='trCSS';s.textContent=CSS;document.head.appendChild(s);}
 root=el('<div class="tr-root"><div class="tr-fade on"></div></div>');document.body.appendChild(root);
 const first=!t.visits||!!DEMO;
 if(!first){const sk=el('<button class="tr-skip">Skip ▸▸</button>');sk.onclick=()=>{skip=true;sk.remove();};root.appendChild(sk);}
 const fade=root.querySelector('.tr-fade');
 // 1. trap door + fall
 snd(300,.15,'square',.06);await sleep(skip?0:500);
 const fall=el(`<div class="tr-scene"><div class="tr-shaft"></div>${Array.from({length:7},(_,i)=>`<i class="tr-rock" style="left:${20+i*9}%;animation-delay:${i*.13}s;animation-duration:${.6+i%3*.2}s"></i>`).join('')}<div class="tr-faller">${heroHTML(p)}</div><div class="tr-big tr-aah">${first?'AAAAAAHHH!':'NOT AGAIN!'}</div></div>`);
 root.appendChild(fall);fade.classList.remove('on');
 for(let i=0;i<8&&!skip;i++){snd(700-i*70,.25,'triangle',.05);await sleep(330);}
 fade.classList.add('on');await sleep(skip?0:500);fall.remove();
 // 2. THUMP
 snd(60,.5,'square',.2);snd(45,.6,'sine',.25,.05);
 const th=el('<div class="tr-scene"><div class="tr-big tr-thump">THUMP!</div></div>');root.appendChild(th);root.classList.add('tr-shake');fade.classList.remove('on');
 await sleep(skip?0:1300);root.classList.remove('tr-shake');fade.classList.add('on');await sleep(skip?0:600);th.remove();
 // build the cave stage (dark)
 const stage=el(`<div class="tr-stage">${CAVE}<div class="tr-trollbox hidden">${TROLL}</div><div class="tr-herobox">${heroHTML(p)}</div><div class="tr-cage"></div><div class="tr-dark"></div><div class="tr-flash"></div><div class="tr-bubble" style="display:none"></div></div>`);
 const bub=stage.querySelector('.tr-bubble'),dark=stage.querySelector('.tr-dark'),tbox=stage.querySelector('.tr-trollbox'),hbox=stage.querySelector('.tr-herobox'),cage=stage.querySelector('.tr-cage');
 if(first){
  // 3. dark & blinking
  const bl=el('<div class="tr-scene"><div class="tr-blink"><i></i><i></i></div></div>');root.appendChild(bl);fade.classList.remove('on');
  await tapWait('…','<p>Ow… 😵 Where am I?</p><p>It\'s so dark you can\'t see <b>anything</b>. You blink and blink…</p>');
  growl();const ed=el('<div class="tr-eyesdark"><i></i><i></i></div>');bl.appendChild(ed);
  await tapWait('😨','<p>Wait… something is <b>breathing</b> in the dark. Something <b>BIG</b>. Two glowing eyes blink open, way up high…</p>');
  await tapWait('🪄 Cast the light spell!','<p>Then you remember something. There is <b>one magic spell</b> you have never, ever used before…</p><p>A spell that makes <b>LIGHT!</b></p>','gold');
  bl.remove();
  // 4. light reveals the troll
  tbox.classList.add('tr-behind');stage.classList.add('tr-bleft');root.appendChild(stage);const fl=stage.querySelector('.tr-flash');snd(880,.4,'triangle',.1);snd(1320,.5,'triangle',.08,.1);fl.classList.add('on');await sleep(700);dark.classList.add('lit');tbox.classList.remove('hidden');await sleep(500);fl.classList.remove('on');
  await sleep(900);stage.classList.add('tr-roar','tr-talk');growl();bub.style.display='';bub.innerHTML=`<b class="tr-name">🧌 ???</b><span style="font-size:1.25em;word-break:break-all">GRRRAAAWWRR!!</span>`;await sleep(1800);stage.classList.remove('tr-roar','tr-talk');
  await tapWait('😱','<p>A <b>GIANT TROLL!</b> The biggest, ugliest troll you have ever seen!</p>');
  // 5. faint
  bub.style.display='none';hbox.classList.add('faint');await sleep(900);fade.classList.add('on');
  await sleep(1200);
  // 6. wake up in a cage
  tbox.style.transition='none';tbox.classList.remove('tr-behind');stage.classList.remove('tr-bleft');void tbox.offsetWidth;tbox.style.transition='';
  cage.classList.add('on');hbox.classList.remove('faint');fade.classList.remove('on');
  await tapWait('…','<p>You faint! 💫</p><p>When you wake up… you\'re locked in a <b>cage</b>!</p>');
  bub.style.display='';
  await say(bub,`HAR HAR! I am ${TNAME}, and you fell into MY cave! You're trapped, never to escape! You will never see the sky again…`,900);
  await say(bub,'…unless you can answer my THREE QUESTIONS! No spells, no help. Just YOU!',600);
 }else{
  root.appendChild(stage);dark.classList.add('lit');tbox.classList.remove('hidden');cage.classList.add('on');fade.classList.remove('on');bub.style.display='';
  const hi=[`Well, well! Back again? I KNEW you'd drop in! Hee hee.`,`Visitor! Oh, I mean… GRRR! You're trapped again!`,`My trap door never misses! Three questions, little one!`];
  await say(bub,hi[t.visits%hi.length]+(t.hoard.length?` I'm still keeping ${t.hoard.length===1?'something':'some things'} of yours… answer right and maybe you'll win ${t.hoard.length===1?'it':'them'} back!`:''),700);
 }
 // 7. three questions
 const res=[];const took=[],gave=[];
 for(let i=0;i<3;i++){
  const q=makeQ(p);
  const ok=await ask(stage,bub,q,i,res);res.push(ok);
  const dk=dayKey();p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][ok?'r':'w']++;
  if(ok){snd(660,.12,'triangle',.12);snd(990,.2,'triangle',.12,.08);
   let g=null;if(!first)g=giveBack(p);if(g){gave.push(g);stage.appendChild(el(`<div class="tr-given">${esc(label(g))} ↩</div>`));}
   await say(bub,g?`Hmph! Correct. Fine… here's ${label(g)} back.`:['Grrr… that is… CORRECT!','Right again?! Hmph.','Correct! How are you so SMART?'][i],900);}
  else{snd(240,.18,'sine',.1);snd(190,.25,'sine',.1,.12);
   let tk=null;if(!first)tk=take(p);if(tk){took.push(tk);stage.appendChild(el(`<div class="tr-stolen">${esc(label(tk))} ➜ 🧌</div>`));}
   await say(bub,`WRONG! It was ${q.answer}. ${tk?`I'll keep ${label(tk)}! HAR HAR!`:'…but I\'ll give you credit for trying.'}`,1100);}
  save();
 }
 // 8. release
 const right=res.filter(Boolean).length;
 if(first){
  await say(bub,right===3?'ALL THREE?! Nobody has ever done that! You are a very clever visitor.':right===0?'Hmm… none right. But you tried your best!':`${right} out of 3. You tried hard!`,700);
  stage.classList.add('tr-kind');
  await say(bub,'Oh, all right… I was only pretending to be scary. The truth is, nobody ever visits me down here. I was just glad to have a friend visit! 🥹',900);
  stage.classList.remove('tr-kind');
  await say(bub,'But next time, I WON\'T be so generous! I might take your GOLD… or some of your PETS… or your ITEMS or SPELLS! HAR!',900);
 }else{
  await say(bub,right===3?`All three right! You win! Off you go, clever one.`:took.length?`Remember — answer right next time and you can win your things back!`:`Off you go. Come visit again… I mean, WATCH YOUR STEP!`,800);
 }
 t.visits++;t.last=Date.now();t.best=Math.max(t.best||0,right);save();
 // the troll stomps over, grabs you and TOSSES you back up the hole
 await say(bub,'Now OFF you go! Hold on tight…');bub.style.display='none';
 const tr=tbox.getBoundingClientRect(),hr=hbox.getBoundingClientRect();const dx=Math.max(0,tr.left+tr.width*.2-(hr.right+hr.width*.2));
 tbox.classList.add('tr-walk');tbox.style.transition='transform 1.8s linear';tbox.style.transform=`translateX(-${dx}px)`;
 for(let i=0;i<5;i++){snd(70,.15,'square',.12);await sleep(360);}
 tbox.classList.remove('tr-walk');
 cage.classList.add('open');snd(300,.2,'square',.05);await sleep(700);
 const gy=-Math.round(window.innerHeight*.16);hbox.style.transition='transform .6s ease-out';hbox.style.transform=`translate(${Math.round(hr.width*.4)}px,${gy}px)`;snd(200,.2,'triangle',.08);
 const grab=el('<div class="tr-big tr-grab">GRAB!</div>');stage.appendChild(grab);await sleep(800);grab.remove();
 tbox.style.transition='transform .35s ease-in';tbox.style.transform=`translateX(-${dx}px) scaleY(.93)`;await sleep(380);
 tbox.style.transition='transform .25s ease-out';tbox.style.transform=`translateX(-${dx}px) scaleY(1.05)`;
 hbox.style.setProperty('--sx',Math.round(hr.width*.4)+'px');hbox.style.setProperty('--sy',gy+'px');hbox.style.transition='none';hbox.classList.add('tr-toss');
 const wh=el('<div class="tr-big tr-whee">WHEEEEE!</div>');stage.appendChild(wh);[400,550,700,900,1100].forEach((f,k)=>snd(f,.25,'triangle',.08,k*.12));
 await sleep(600);bub.style.display='';bub.innerHTML=`<b class="tr-name">🧌 ${TNAME}</b>Bye bye, little friend! 👋 Watch your step!`;tbox.style.transform=`translateX(-${dx}px)`;
 await sleep(1700);fade.classList.add('on');await sleep(700);
 root.remove();root=null;busy=false;window.trollBusy=false;
 if(DEMO){const s=JSON.parse(DEMO);DEMO=null;Object.assign(p,{coins:s.coins,pets:s.pets,owned:s.owned,toys:s.toys,daily:s.daily});if(s.troll)p.troll=s.troll;else delete p.troll;save();try{toast('🧌 That was a preview — nothing was changed.');go('world');}catch(e){}return;}
 const summary=[took.length?`🧌 The troll kept: ${took.map(label).join(', ')}`:'',gave.length?`↩ You won back: ${gave.map(label).join(', ')}`:''].filter(Boolean).join(' · ');
 try{if(typeof toast==='function')toast(`🧌 You escaped ${TNAME}'s cave! ${right}/3 right.${summary?' '+summary:''}`);}catch(e){}
 try{if(typeof go==='function'&&curScreen==='world')go('world');}catch(e){}
}
function makeQ(p){let q=null;for(let k=0;k<12;k++){const op=pickOp(p,'mix');q=genQ(op,lvl(p,op));if(q&&!q.tpl)break;}return q;}
function ask(stage,bub,q,i,res){return new Promise(async resolve=>{
 await say(bub,['Question ONE!','Question TWO!','Last question… THREE!'][i],200,true);
 let inp='';const box=el(`<div class="tr-q"><div class="tr-dots">${[0,1,2].map(k=>`<i class="${k<res.length?(res[k]?'ok':'no'):k===i?'cur':''}"></i>`).join('')}</div><div class="tr-qt"></div>
  <div class="tr-pad ${q.neg?'negon':''}">${['7','8','9','4','5','6','1','2','3','neg','0','del','go'].map(k=>`<button data-k="${k}" class="${k==='go'?'go':k==='neg'?'neg':''}">${k==='del'?'⌫':k==='go'?'✓ Answer':k==='neg'?'±':k}</button>`).join('')}</div></div>`);
 stage.appendChild(box);const qt=box.querySelector('.tr-qt');const show=()=>{qt.innerHTML=`${q.text} = <span class="ansbox">${inp||'?'}</span>`;};show();
 const press=k=>{if(k==='del')inp=inp.slice(0,-1);else if(k==='neg')inp=inp.startsWith('-')?inp.slice(1):'-'+inp;else if(k==='go'){if(!inp||inp==='-')return;finish();return;}else if(inp.length<7)inp=inp==='0'?k:inp+k;show();};
 const key=e=>{if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('del');else if(e.key==='-')press('neg');else if(e.key==='Enter')press('go');};
 window.addEventListener('keydown',key);
 box.querySelectorAll('button').forEach(b=>b.onclick=()=>{try{SFX.tap();}catch(e){}press(b.dataset.k);});
 const finish=()=>{window.removeEventListener('keydown',key);const v=parseInt(inp,10);const ok=v===q.answer||!!(q.alt&&q.alt.includes(v));box.remove();resolve(ok);};
});}
window.Troll={start,_T:T,_take:take,_give:giveBack,unmarked};
})();
