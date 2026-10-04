/* ================= Number Town: Main Street (Oct 2026) =================
   The plaza's 13 buildings moved inside one Number Town building on the map (index.html places it: TOWN_X/TOWN_Y, 5x3 tiles).
   Walking into it opens Main Street: a street of drawn shopfronts in five colour blocks (Learning, Science, Pets, Shops, Fun).
   Every shop opens exactly what its old plaza building opened, through the same wNpc(id), so quests, quest marks and Builder
   stars work as before. Places that were hidden before stay hidden: the Lab (Lab Key), the Train (Discovery District switch) and the
   Food Truck (its switch). Red dots show what needs the kid (spin ready, a gift, a quest to hand in); the map building shows the total.
   Visitors (Dr. Quartz, Ozzy, the Troll, Skyla, Prisma) still find the hero out on the map.
   Uses Math Quest globals: P, go, SCREENS, topbar, esc, toast, wNpc, spinReady, pendingGifts, npcQuestMark, VIL, vLv, heroSVG, wLabel,
   Lab, Discovery, Truck, Mastery, curScreen, MQ_HOOKS. */
(function(){
'use strict';
const me=()=>{try{return P();}catch(e){return null;}};
const BLOCKS=[
 {id:'learn',n:'Learning',wall:'#d6efff',aw:'#4dabf7',ink:'#1864ab',shops:[
  {id:'gym',e:'🏋️',n:'Fact Gym',s:'Fact sprints and the Mastery Map',show:()=>!!window.Mastery},
  {id:'library',e:'📚',n:'Library',s:'Stories and books'},
  {id:'elder',e:'🧙',n:'Elder Wiz',s:'Quests and wise tips'}]},
 {id:'sci',n:'Science',wall:'#dcf7e0',aw:'#40c057',ink:'#2b8a3e',shops:[
  {id:'lab',e:'🔬',n:'Quartz Lab',s:'Ride down to the cave',show:p=>!!(window.Lab&&Lab.hasKey&&Lab.hasKey(p))},
  {id:'train',e:'🚂',n:'Train Station',s:'To Discovery District',show:()=>!!(window.Discovery&&Discovery.flag&&Discovery.flag())}],
  empty:{e:'🔬',n:'Science Center',s:'Dr. Quartz will find you out on the map'}},
 {id:'pets',n:'Pets',wall:'#ffe8e8',aw:'#ff8787',ink:'#c92a2a',shops:[
  {id:'pets',e:'🧑‍🌾',n:'Pet Keeper',s:'Your pets and eggs'}]},
 {id:'shops',n:'Shops',wall:'#fff6cc',aw:'#fcc419',ink:'#9c6b00',shops:[
  {id:'shop',e:'🏪',n:'Shop',s:'Hats, robes and more'},
  {id:'cafe',e:'🍱',n:'Cafeteria',s:'Lunch time math'},
  {id:'build',e:'🏗️',n:'Builder',s:'Upgrade the village'},
  {id:'mail',e:'📮',n:'Gifts',s:'Presents from family'},
  {id:'truck',e:'🚚',n:'Food Truck',s:'Cook up orders',show:()=>!!(window.Truck&&Truck.flag&&Truck.flag())}]},
 {id:'fun',n:'Fun',wall:'#f8e3fc',aw:'#da77f2',ink:'#862e9c',shops:[
  {id:'spin',e:'🎡',n:'Daily Spin',s:'One free spin a day'},
  {id:'fountain',e:'⛲',n:'Wishing Fountain',s:'Make a wish'}]}];
const shown=(p,s)=>!s.show||s.show(p);
/* what needs the kid: a quest to hand in (❗) or a new one to read (❔), the daily spin, a gift */
function need(p,id){try{const qm=npcQuestMark(p,id);if(qm)return qm==='❗'?'!':'?';}catch(e){}
 try{if(id==='spin'&&spinReady(p))return '!';}catch(e){}try{if(id==='mail'&&pendingGifts(p).length)return String(pendingGifts(p).length);}catch(e){}return '';}
function stars(p,id){try{const vb=VIL.find(v=>v.npc===id);const l=vb?vLv(p,vb.id):0;return l?` ★${l}`:'';}catch(e){return '';}}
function count(p){if(!p)return 0;let n=0;BLOCKS.forEach(b=>b.shops.forEach(s=>{if(shown(p,s)&&need(p,s.id))n++;}));return n;}

/* ---------- the building on the map ---------- */
const SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 214"><rect x="20" y="98" width="280" height="110" rx="10" fill="#fff4e0" stroke="#8a5a2b" stroke-width="5"/>
<path d="M8 104 L160 24 L312 104Z" fill="#e8590c" stroke="#7a2a08" stroke-width="5" stroke-linejoin="round"/><path d="M60 86 L260 86" stroke="#c2410c" stroke-width="3"/>
<rect x="132" y="2" width="56" height="42" rx="6" fill="#fff" stroke="#8a5a2b" stroke-width="4"/><circle cx="160" cy="23" r="13" fill="#fff9db" stroke="#8a5a2b" stroke-width="3"/><path d="M160 23 v-8 M160 23 h6" stroke="#2b2340" stroke-width="3" stroke-linecap="round"/>
<g stroke="#8a5a2b" stroke-width="3"><rect x="36" y="118" width="44" height="34" rx="5" fill="#d6efff"/><rect x="88" y="118" width="44" height="34" rx="5" fill="#dcf7e0"/><rect x="188" y="118" width="44" height="34" rx="5" fill="#fff6cc"/><rect x="240" y="118" width="44" height="34" rx="5" fill="#f8e3fc"/></g>
<g stroke-width="0"><path d="M30 112 h56 v8 h-56z" fill="#4dabf7"/><path d="M82 112 h56 v8 h-56z" fill="#40c057"/><path d="M182 112 h56 v8 h-56z" fill="#fcc419"/><path d="M234 112 h56 v8 h-56z" fill="#da77f2"/></g>
<path d="M128 208 V156 Q160 124 192 156 V208Z" fill="#7a4f2a" stroke="#4a2f17" stroke-width="4"/><circle cx="180" cy="182" r="4" fill="#ffd43b"/>
<g fill="#ffe08a" stroke="#8a5a2b" stroke-width="3"><rect x="40" y="166" width="34" height="28" rx="4"/><rect x="246" y="166" width="34" height="28" rx="4"/><rect x="92" y="166" width="30" height="28" rx="4"/><rect x="198" y="166" width="30" height="28" rx="4"/></g>
<path d="M98 98 l10 -14 l10 14 M202 98 l10 -14 l10 14" fill="#ffd43b" stroke="#8a5a2b" stroke-width="3"/></svg>`;
const IMG=new Image();IMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SVG);
function draw(ctx,ax,ay,ts,now){const w=ts*5,h=w*214/320,top=ay+ts*3-h;
 ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(ax+w/2,ay+ts*3-ts*.05,w*.48,ts*.22,0,0,7);ctx.fill();
 if(IMG.complete&&IMG.naturalWidth)ctx.drawImage(IMG,ax,top,w,h);
 const p=me(),n=count(p);wLabel(ctx,'🏡 Number Town',ax+w/2,top-ts*.12,'#3b2b6b','rgba(255,255,255,.95)');
 if(n){const r=ts*.3,bx=ax+w*.9,by=Math.max(r+3,ay+ts*1.15)+Math.sin((now||0)/300)*ts*.04; /* on the front wall, kept on screen */ctx.beginPath();ctx.arc(bx,by,r,0,7);ctx.fillStyle='#e03131';ctx.fill();ctx.lineWidth=Math.max(2,ts*.05);ctx.strokeStyle='#fff';ctx.stroke();
  ctx.fillStyle='#fff';ctx.font=`700 ${Math.round(ts*.3)}px Fredoka, system-ui, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(n),bx,by+1);}}

/* ---------- Main Street ---------- */
function css(){if(document.getElementById('mtCSS'))return;const s=document.createElement('style');s.id='mtCSS';s.textContent=`
.mt{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:10px}
.mt-today{display:flex;gap:8px;flex-wrap:wrap}.mt-chip{font:inherit;font-weight:700;border:2px solid #f2b705;background:#fff9db;color:#2b2340;border-radius:14px;padding:6px 12px;cursor:pointer;min-height:44px}
.mt-street{position:relative;overflow-x:auto;overflow-y:hidden;border-radius:18px;border:4px solid #2b2340;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;scrollbar-width:thin;background:linear-gradient(#bfe6ff 0 26%,#fff4e0 26% 78%,#c9b28a 78% 84%,#a8916a 84%)}
.mt-row{position:relative;display:inline-flex;align-items:flex-end;gap:34px;padding:58px 34px 17%;min-height:clamp(320px,52vh,470px);height:100%}
.mt-blk{position:relative;display:flex;gap:10px;align-items:flex-end;padding-top:6px}
.mt-sign{position:absolute;top:-44px;left:0;right:0;display:flex;justify-content:center}
.mt-sign span{background:var(--aw);color:#fff;font-weight:700;border-radius:12px;padding:4px 14px;font-size:18px;box-shadow:0 3px 0 rgba(0,0,0,.15);white-space:nowrap}
.mt-sign b{background:#e03131;border-radius:999px;padding:0 7px;margin-left:6px;font-size:14px}
.mt-shop{position:relative;width:150px;height:clamp(210px,34vh,280px);border:0;font:inherit;cursor:pointer;padding:0;background:var(--wall);border-radius:16px 16px 0 0;box-shadow:inset 0 -14px 0 rgba(0,0,0,.07),0 0 0 3px rgba(43,35,64,.15);display:flex;flex-direction:column;align-items:center;color:#2b2340;transition:transform .15s}
.mt-shop:hover{transform:translateY(-4px)}.mt-shop:focus-visible{outline:4px solid #f2b705;outline-offset:3px}
.mt-aw{width:112%;height:30px;margin-top:-6px;border-radius:12px;background:repeating-linear-gradient(90deg,#fff 0 14px,var(--aw) 14px 28px);box-shadow:0 5px 0 rgba(0,0,0,.12)}
.mt-name{margin-top:8px;background:#fff;border-radius:10px;padding:2px 10px;font-weight:700;font-size:15px;max-width:92%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 0 rgba(0,0,0,.12)}
.mt-win{margin-top:auto;width:62%;aspect-ratio:1.25;border-radius:12px;background:#e8f7ff;border:4px solid #8a5a2b;display:grid;place-items:center;font-size:44px}
.mt-door{width:44%;height:24%;margin-top:8px;background:#7a4f2a;border-radius:40px 40px 0 0;border:3px solid #4a2f17;border-bottom:0}
.mt-sub{position:absolute;bottom:-40px;left:-4px;right:-4px;text-align:center;font-size:11.5px;line-height:1.2;color:#2b2340;font-weight:600;background:rgba(255,255,255,.88);border-radius:8px;padding:2px 4px}
.mt-dot{position:absolute;top:22px;right:-8px;background:#e03131;color:#fff;border-radius:999px;min-width:26px;height:26px;display:grid;place-items:center;font-weight:700;font-size:15px;border:3px solid #fff;animation:mtpulse 1.6s ease-in-out infinite}
@keyframes mtpulse{50%{transform:scale(1.15)}}.mt-dot[hidden]{display:none}
.mt-shop.teaser{cursor:default;filter:grayscale(.7);opacity:.75}
.mt-walker{position:absolute;bottom:8%;width:58px;height:70px;transform:translateX(-50%);transition:left .45s ease-in-out;pointer-events:none;z-index:2}.mt-walker svg{width:100%;height:100%}
.mt-jump{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.mt-jump button{font:inherit;font-weight:700;border:0;border-radius:14px;padding:8px 14px;background:#fff;color:#2b2340;cursor:pointer;min-height:44px;box-shadow:0 3px 0 rgba(0,0,0,.15)}
.mt-jump button i{font-style:normal;background:#e03131;color:#fff;border-radius:999px;padding:0 6px;margin-left:6px;font-size:13px}
.mt-hint{color:#d8d0ff;text-align:center;font-size:14px;margin:0}
@media (prefers-reduced-motion:reduce){.mt-dot{animation:none}.mt-walker{transition:none}.mt-street{scroll-behavior:auto}}`;document.head.appendChild(s);}
let TICK=0;
function screen(){const p=me();if(!p){go('world');return;}css();clearInterval(TICK);
 const blocks=BLOCKS.map(b=>({b,list:b.shops.filter(s=>shown(p,s))}));
 const today=[];BLOCKS.forEach(b=>b.shops.forEach(s=>{if(!shown(p,s))return;const d=need(p,s.id);if(!d)return;today.push(`<button class="mt-chip" data-go="${s.id}">${s.e} ${s.id==='spin'?'Spin ready':s.id==='mail'?'Gift waiting':d==='!'?esc(s.n)+': quest done':esc(s.n)+': new quest'}</button>`);}));
 app.innerHTML=(typeof topbar==='function'?topbar():'')+`<div class="page"><div class="zhead"><button class="btn ghost small backbtn" onclick="go('world')">← World</button><h2 class="title">🏡 Number Town</h2></div>
  <div class="mt">${today.length?`<div class="mt-today">${today.slice(0,4).join('')}</div>`:''}
  <div class="mt-street" id="mtStreet"><div class="mt-row" id="mtRow">${blocks.map(({b,list})=>{const n=list.filter(s=>need(p,s.id)).length;
   const fronts=list.length?list.map(s=>{const d=need(p,s.id);return `<button class="mt-shop" style="--wall:${b.wall};--aw:${b.aw}" data-id="${s.id}" aria-label="${esc(s.n)}"><span class="mt-aw"></span><span class="mt-name">${esc(s.n)}${stars(p,s.id)}</span><span class="mt-win">${s.e}</span><span class="mt-door"></span><span class="mt-sub">${esc(s.s)}</span>${d?`<span class="mt-dot" data-dot="${s.id}">${d}</span>`:`<span class="mt-dot" data-dot="${s.id}" hidden></span>`}</button>`;}).join('')
    :`<button class="mt-shop teaser" style="--wall:${b.wall};--aw:${b.aw}" aria-label="${esc(b.empty.n)}" data-teaser="1"><span class="mt-aw"></span><span class="mt-name">${esc(b.empty.n)}</span><span class="mt-win">🔒</span><span class="mt-door"></span><span class="mt-sub">${esc(b.empty.s)}</span></button>`;
   return `<div class="mt-blk" id="mtB-${b.id}" style="--aw:${b.aw}"><div class="mt-sign"><span>${b.n}${n?`<b>${n}</b>`:''}</span></div>${fronts}</div>`;}).join('')}
   <div class="mt-walker" id="mtHero" style="left:30px">${(()=>{try{return heroSVG(p.look,{spell:p.spell});}catch(e){return '🧙';}})()}</div></div></div>
  <div class="mt-jump">${blocks.map(({b,list})=>{const n=list.filter(s=>need(p,s.id)).length;return `<button data-jump="${b.id}">${b.n}${n?`<i>${n}</i>`:''}</button>`;}).join('')}</div>
  <p class="mt-hint">Swipe along the street, or use the ← → keys. Tap a shop to go in.</p></div></div>`;
 app.querySelectorAll('.mt-shop').forEach(el=>el.onclick=()=>{if(el.dataset.teaser){toast('🔬 Dr. Quartz will find you out on the map. Keep exploring!');return;}walkTo(el,()=>wNpc(el.dataset.id));});
 app.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>{const s=app.querySelector(`.mt-shop[data-id="${el.dataset.go}"]`);if(s){s.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});walkTo(s,()=>wNpc(el.dataset.go));}else wNpc(el.dataset.go);});
 app.querySelectorAll('[data-jump]').forEach(el=>el.onclick=()=>{const b=document.getElementById('mtB-'+el.dataset.jump),st=document.getElementById('mtStreet');if(b&&st)st.scrollLeft=b.offsetLeft-24;});
 /* keep the red dots fresh after a spin, a gift or a quest */
 TICK=setInterval(()=>{if(typeof curScreen==='undefined'||curScreen!=='town'){clearInterval(TICK);return;}const q=me();if(!q)return;app.querySelectorAll('[data-dot]').forEach(d=>{const v=need(q,d.dataset.dot);d.hidden=!v;if(v)d.textContent=v;});},1500);}
function walkTo(el,done){const h=document.getElementById('mtHero'),row=document.getElementById('mtRow');if(!h||!row){done();return;}
 const r=el.getBoundingClientRect(),rr=row.getBoundingClientRect();h.style.left=(r.left-rr.left+r.width/2)+'px';setTimeout(()=>{if(typeof curScreen!=='undefined'&&curScreen==='town')done();},470);}
window.addEventListener('keydown',e=>{try{if(typeof curScreen==='undefined'||curScreen!=='town'||document.querySelector('#modal.show'))return;const st=document.getElementById('mtStreet');if(!st)return;
 if(e.key==='ArrowRight'){st.scrollLeft+=300;e.preventDefault();}else if(e.key==='ArrowLeft'){st.scrollLeft-=300;e.preventDefault();}}catch(x){}});
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.town=()=>screen();}else setTimeout(reg,30);})();
window.TownView={draw,count,need,BLOCKS,_screen:screen};
})();
