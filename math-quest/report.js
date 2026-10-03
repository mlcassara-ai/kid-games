/* ================= 🐞 Report a problem or a suggestion (testers, Oct 2026) =================
   The same idea as Language Quest's Report button. A 🐞 button in the top bar (and in a full-screen Battle Pets fight) opens a short
   form: "Something is wrong" or "A suggestion", plus a few words. It is saved in the hero's own save (p.reports, the last 30), with the
   screen it came from and the game version, so it syncs with the family. Parents read it in Parent Corner; tools/peek.py prints it.
   Nothing is sent anywhere else.
   Uses Math Quest globals: P, save, modal, closeModal, esc, curScreen, curArg, APP_VER, SFX, MQ_PARENT, state. */
(function(){
'use strict';
const MAX=30,LEN=600;
let onDone=null;
function where(){try{let s=typeof curScreen!=='undefined'?curScreen:'?';if(typeof curArg!=='undefined'&&curArg&&typeof curArg!=='object')s+=':'+curArg;
 if(s==='bp'&&window.BattlePets&&BattlePets._dbg){const v=BattlePets._dbg.view(),g=BattlePets._dbg.G();if(v&&v.k==='fight'&&g)s+=` fight ${g.stage.id} crown ${g.crown} at ${Math.floor(g.t)}s`;else if(v)s+=' '+v.k;}
 return s.slice(0,80);}catch(e){return '?';}}
function open(done){let p=null;try{p=P();}catch(e){}if(!p)return;onDone=done||null;const here=where();
 modal(`<div class="mcard" style="max-width:520px;text-align:left"><h2 style="margin-top:0;text-align:center">🐞 Tell us what you found</h2>
  <p class="muted" style="margin:0 0 10px">Math Quest is still being tested. Everything you send helps make it better.</p>
  <div class="mqr-kind"><label><input type="radio" name="mqrk" value="problem" checked> 🐞 Something is wrong</label><label><input type="radio" name="mqrk" value="idea"> 💡 A suggestion</label></div>
  <textarea id="mqrTxt" maxlength="${LEN}" rows="5" placeholder="What happened, or what would make it better?" style="width:100%;box-sizing:border-box;font:inherit;font-size:16px;border-radius:12px;border:2px solid #d0bfff;padding:10px"></textarea>
  <small class="muted">We also save which screen you were on (${esc(here)}) and the game version.</small>
  <div id="mqrErr" style="color:#c92a2a;font-weight:700;min-height:20px;margin-top:4px"></div>
  <div class="row"><button class="btn ghost dark" onclick="MQReport._cancel()">Cancel</button><button class="btn green" onclick="MQReport._send()">Send ✓</button></div></div>`);
 css();setTimeout(()=>{const t=document.getElementById('mqrTxt');if(t)t.focus();},60);open.here=here;}
function send(){const box=document.getElementById('mqrTxt');if(!box)return;const m=box.value.trim();
 if(m.length<3){const e=document.getElementById('mqrErr');if(e)e.textContent='Please write a few words first.';box.focus();return;}
 const k=(document.querySelector('input[name="mqrk"]:checked')||{}).value||'problem';
 const p=P();if(!p)return; /* fetch the hero again now: a sync may have replaced it while the form was open */
 const r=p.reports=Array.isArray(p.reports)?p.reports:[];r.push({t:Date.now(),k,m:m.slice(0,LEN),s:open.here||where(),v:typeof APP_VER!=='undefined'?APP_VER:'dev'});if(r.length>MAX)r.splice(0,r.length-MAX);
 save();try{SFX.coin();}catch(e){}
 modal(`<div class="mcard" style="max-width:420px"><div style="font-size:52px">🙏</div><h2>Thank you!</h2><p>We saved your ${k==='idea'?'suggestion':'report'}.</p><div class="row"><button class="btn green big" onclick="MQReport._cancel()">Back to the game</button></div></div>`);}
function cancel(){closeModal();const d=onDone;onDone=null;if(d)try{d();}catch(e){}}
function css(){if(document.getElementById('mqrCSS'))return;const s=document.createElement('style');s.id='mqrCSS';s.textContent=`.mqr-kind{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px}.mqr-kind label{display:flex;gap:6px;align-items:center;background:#f3f0ff;border-radius:12px;padding:8px 12px;font-weight:700;cursor:pointer}
.mqr-list div{margin:6px 0;padding:8px 10px;border-radius:10px;background:#f8f9fa}.mqr-list small{color:#6b6490}.tbi .tbe{font-size:22px;line-height:1}`;document.head.appendChild(s);}
/* Parent Corner: every hero's reports, newest first */
function parentSection(){try{if(typeof state==='undefined'||!state.players)return '';const list=state.players.filter(p=>p.setup&&(p.reports||[]).length);if(!list.length)return '';css();
 const when=t=>new Date(t).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 return `<div class="panel"><h3>🐞 Reports and suggestions</h3><p class="muted" style="margin-top:0">What the kids sent with the 🐞 button (the last ${MAX} per hero).</p>
  ${list.map(p=>`<div style="margin:8px 0"><b>${esc(p.name)}</b><div class="mqr-list">${p.reports.slice().reverse().map(r=>`<div>${r.k==='idea'?'💡':'🐞'} ${esc(r.m)}<br><small>${when(r.t)} · ${esc(r.s||'')} · ${esc(r.v||'')}</small></div>`).join('')}</div></div>`).join('')}</div>`;}catch(e){return '';}}
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
try{css();}catch(e){}
window.MQReport={open,_send:send,_cancel:cancel,where};
})();
