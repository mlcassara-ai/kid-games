/* ================= 🎉 What's new (owner, Oct 2026) =================
   After an update that has notes, each hero sees one short card the next time the map opens: 3–5 kid-friendly lines, one tap to
   close. Updates without notes show nothing. A brand-new hero (no battles yet) is marked as having seen everything. The Parent
   Corner keeps every past note. To add notes for a release: put a new entry at the TOP of NEWS with the release's version string.
   Seen state: p.newsSeen = the newest version id the hero has seen (synced with the save; tiny). */
(function(){
'use strict';
const NEWS=[
 {v:'2026.10.09d',d:'October 2026',items:[
  '🌊 The sea around the map has a new look, with a stone edge and rippling water. Keep an eye out for fins!']},
 {v:'2026.10.09a',d:'October 2026',items:[
  '🪙 When your pet dives in the Wishing Fountain, the coin it brings back is yours to keep (up to 10 a day)!']},
 {v:'2026.10.08e',d:'October 2026',items:[
  '🌼 Stand still and your pet goes exploring: sniffing flowers, diving in ponds, hiding in apple trees, and bringing you presents!',
  '🌳 Trees, bushes and flowers sway in the breeze.',
  '🦈 Watch out for sharks in the sea… your wizard will zap to the rescue!',
  '🍂 Don\'t let your pet go in the bushes. Trust us.']},
 {v:'2026.10.08c',d:'October 2026',items:[
  '🐾 Your pet floats along beside you on the map now, all 43 of them!',
  '💕 Pets do happy loops, jump when you sneeze and nap when you doze off.',
  '🎨 New natural hair colours for your hero.']},
 {v:'2026.10.08b',d:'October 2026',items:[
  '⛲ The Wishing Fountain in the town square now splashes, spills and bubbles!']},
 {v:'2026.10.08a',d:'October 2026',items:[
  '🧙 Your wizard comes alive on the map! Watch them walk, turn, blink and wave.',
  '👀 Stand still and your wizard turns to face you, and sometimes sneezes, snacks or spots a butterfly.',
  '😴 Leave them alone long enough and they might doze off!']},
 {v:'2026.10.07c',d:'October 2026',items:[
  '🎓 Math that grows with you! Every world follows your school year, and you can earn your way up to harder grades.',
  '📖 Funny story problems with Dr. Quartz, Coach Flex, Grumbleroot and friends.',
  '🔷 A new world: <b>Shape Island</b>! And 📊 <b>Graph Garden</b> is open again.',
  '👆 New ways to answer: tap the number line, tap the grid, pick ALL that are true.',
  '🐾 Battle Pets: big heroes walk slowly, flyers fly lower, and the Grey Goblin steals the world\'s colour!']}];
const latest=()=>NEWS[0].v;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function due(p){if(!p||!p.setup)return false;if(!p.newsSeen){if(!(p.battles>0)){p.newsSeen=latest();return false;}return true;}return p.newsSeen<latest();}
function css(){if(document.getElementById('newsCss'))return;document.head.insertAdjacentHTML('beforeend',`<style id="newsCss">.nw-card{text-align:left;max-width:440px}.nw-card h2{text-align:center;margin:0 0 6px}.nw-card ul{margin:8px 0 14px;padding-left:4px;list-style:none}.nw-card li{margin:9px 0;font-size:17px;line-height:1.35}.nw-card .row{justify-content:center}</style>`);}
function show(force){const p=typeof P==='function'&&P();if(!p||(!force&&!due(p)))return false;css();
 const seen=p.newsSeen||'';const fresh=NEWS.filter(n=>!seen||n.v>seen).slice(0,2);if(!fresh.length)return false;
 modal(`<div class="mcard nw-card"><h2>🎉 What's new!</h2>${fresh.map(n=>`<ul>${n.items.map(i=>`<li>${i}</li>`).join('')}</ul>`).join('')}<div class="row"><button class="btn green big" onclick="MQ_NEWS.close()">Cool! ➜</button></div></div>`);
 return true;}
function close(){const p=typeof P==='function'&&P();if(p){p.newsSeen=latest();try{save();}catch(e){}}try{closeModal();}catch(e){}}
let waitT=0;
function tryShow(){clearTimeout(waitT);if(/[?&]smoke=1/.test(location.search))return; /* the smoke test calls show() itself */
 waitT=setTimeout(()=>{if(typeof curScreen==='undefined'||curScreen!=='world')return;if(document.querySelector('#modal.show')){waitT=setTimeout(tryShow,4000);return;}show();},1500);}
function parentSection(){try{return `<div class="panel"><h3>🎉 What's new in Math Quest</h3>${NEWS.map(n=>`<p style="margin:8px 0 2px"><b>${esc(n.d)}</b> <small class="muted">(${esc(n.v)})</small></p><ul style="margin:0 0 6px 18px;padding:0">${n.items.map(i=>`<li>${i}</li>`).join('')}</ul>`).join('')}</div>`;}catch(e){return '';}}
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s==='world')tryShow();}});
window.MQ_NEWS={NEWS,due,show,close,latest};
})();
