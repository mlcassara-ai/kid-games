/* Battle Pets — TEST ONLY (Oct 2026).
   A building on the village plaza that opens the Battle Pets prototype (battle-pets.html) in a frame.
   Playing it gives nothing: no coins, no prizes. The only thing saved is a small play log for the test (p.bp, see PLAY LOG below). The prototype uses its own made-up pets and shows no demo controls: the pace comes from the hero's grade, and its music is off when the hero's map music is off.
   Who sees it is one on/off switch on the hero (p.bpTest), set in Parent Corner, so it follows the hero to every device.
   (The first version kept the switch per device in localStorage 'mqBpTest'; that list is still honoured.)
   Uses Math Quest globals: P, state, W, SCREENS, go, topbar, toast, refreshParent, esc. */
(function(){
'use strict';
const KEY='mqBpTest',BP_X=28,BP_Y=20;
const ids=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}};
const on=p=>window.MQ_BP_BETA===true||(!!p&&(p.bpTest===1||(p.bpTest==null&&ids().includes(p.id))));
const me=()=>{try{return P();}catch(e){return null;}};
function set(id,v){try{const p=state.players.find(x=>x.id===id);if(!p)return;p.bpTest=v?1:0;save();}catch(e){}
 syncTile();try{if(typeof refreshParent==='function')refreshParent(null);else go('parent');}catch(e){}}
/* the building is only on the map for a hero in the test (same pattern as the Food Truck) */
function syncTile(){try{if(typeof W==='undefined'||!W||!W.T)return;const t=W.T[BP_Y]&&W.T[BP_Y][BP_X];if(!t||t.water)return;
 if(on(me())){if(t.npc!=='bp'&&!t.npc&&!t.chest){if(W.hx===BP_X&&W.hy===BP_Y)return;t.npc='bp';t.block=true;t.o=null;}}
 else if(t.npc==='bp'){delete t.npc;t.block=false;}}catch(e){}}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world')syncTile();},session:()=>syncTile()});
function draw(){const p=me();const v=typeof MQV!=='undefined'?MQV:'';
 const head=((typeof topbar==='function')?topbar():'')+`<div class="page"><div class="zhead"><button class="btn ghost small backbtn" onclick="go('world')">← Village</button><h2 class="title">🐾 Battle Pets <small style="font-size:13px;font-weight:600">test</small></h2></div>`;
 if(!p||!on(p)){document.getElementById('app').innerHTML=head+`<div class="panel" style="text-align:center"><div class="big-emoji">🔒</div><h3>Coming soon!</h3><p class="muted">Battle Pets is still being built.</p></div></div>`;return;}
 document.getElementById('app').innerHTML=head+`
 <iframe title="Battle Pets test" src="battle-pets.html?embed=1&g=${encodeURIComponent(p.grade||3)}${p.music==='off'?'&m=0':''}&v=${v}" style="width:100%;height:calc(100vh - 150px);min-height:620px;border:0;border-radius:16px;background:#e9f3e1"></iframe></div>`;}
function parentSection(){try{if(typeof state==='undefined'||!state.players)return '';const list=state.players.filter(p=>p.setup);if(!list.length)return '';
 return `<div class="panel"><h3>🐾 Battle Pets (test)</h3><p class="muted" style="margin-top:0">An early test of a new game. Turn it on for a hero and a 🐾 Battle Pets building appears in their village on every device they play on (it can take a minute to reach another device). It is a test: it gives no coins or prizes. It keeps a small play log (below) so we can see how much it is played and whether it is too easy.</p>
 ${list.map(p=>{const y=on(p);return `<div class="row" style="justify-content:flex-start;align-items:center;gap:10px;margin:6px 0"><b style="min-width:90px">${esc(p.name)}</b><small class="muted">${y?'✅ On':'Off'}</small><button class="btn small ghost dark" onclick="BattlePets._set('${p.id}',${y?'false':'true'})">${y?'Turn off':'Turn on'}</button></div>${y||p.bp?`<small class="muted" style="display:block;margin:-2px 0 8px">${esc(logLine(p))}</small>`:''}`;}).join('')}</div>`;}catch(e){return '';}}
/* ---------- PLAY LOG: how much the test is played and how hard it is ----------
   p.bp = {s: matches started, m: the last 40 finished matches}. One match = [unix seconds, stage, won 0/1, seconds, facts asked,
   facts right, pets sent, spells cast, Pet House % left, critter log % left]. Started minus finished = matches walked away from. */
const LOG_MAX=40;
window.addEventListener('message',e=>{try{if(e.origin!==location.origin)return;const d=e.data;if(!d||d.mq!=='bp')return;if(typeof curScreen==='undefined'||curScreen!=='bp')return;
 const p=me();if(!p||!on(p))return;const b=p.bp=p.bp||{s:0,m:[]};b.m=b.m||[];const n=x=>Math.max(0,Math.min(9999,Math.round(+x||0)));
 if(d.ev==='start')b.s=(b.s||0)+1;
 else if(d.ev==='end'){b.m.push([Math.floor(Date.now()/1000),n(d.stage),d.win?1:0,n(d.secs),n(d.asked),n(d.right),n(d.sent),n(d.cast),n(d.house),n(d.log)]);if(b.m.length>LOG_MAX)b.m=b.m.slice(-LOG_MAX);}
 else return;save();}catch(err){}});
function stats(p){const b=(p&&p.bp)||{},m=b.m||[];const w=m.filter(x=>x[2]).length,days=new Set(m.map(x=>new Date(x[0]*1000).toDateString())).size;
 const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;const asked=m.reduce((a,x)=>a+x[4],0),right=m.reduce((a,x)=>a+x[5],0);
 return {started:b.s||0,done:m.length,wins:w,days,mins:Math.round(m.reduce((a,x)=>a+x[3],0)/60),winSecs:avg(m.filter(x=>x[2]).map(x=>x[3])),houseLeft:avg(m.filter(x=>x[2]).map(x=>x[8])),asked,right,last:m.length?m[m.length-1][0]*1000:0,
  byStage:[1,3,5].map(s=>{const a=m.filter(x=>x[1]===s);return {s,n:a.length,w:a.filter(x=>x[2]).length};})};}
function logLine(p){const s=stats(p);if(!s.started&&!s.done)return 'Not played yet';
 return `${s.done} match${s.done===1?'':'es'} on ${s.days} day${s.days===1?'':'s'} (${s.mins} min) · won ${s.wins} of ${s.done}${s.done?` (${Math.round(s.wins/s.done*100)}%)`:''} · walked away from ${Math.max(0,s.started-s.done)}`+
  (s.wins?` · a win takes about ${s.winSecs}s with the Pet House at ${s.houseLeft}%`:'')+(s.asked?` · facts ${s.right}/${s.asked} right`:'')+` · ${s.byStage.filter(x=>x.n).map(x=>`Forest ${x.s}: ${x.w}/${x.n}`).join(', ')}`;}
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
window.BattlePets={on,stats,_set:set,_sync:syncTile};
(function reg(){if(typeof SCREENS!=='undefined'){SCREENS.bp=()=>draw();}else setTimeout(reg,30);})();
})();
