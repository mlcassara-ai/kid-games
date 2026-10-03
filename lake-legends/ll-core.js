/* Lake Legends core: players, secret-picture locks, parent PIN, Parent Corner, online save and auto-update.
   Modeled on Math Quest and Language Quest: one save per household ("family"), anonymous Firebase sign-in over REST,
   Firestore doc families/ll_<code>, newest-copy-of-each-kid-wins merge. Each player's game lives in player.game. */
(function(){
const FB={project:"kid-games-dc068", key:"AIzaSyDisxs0uEXvWrlOp8VchKOz0abxPDKIWpI"};
const SAVE_KEY="lakelegends.v1", AUTH_KEY="lakelegends.auth", FAM_KEY="lakelegends.family", PIN_KEY="lakelegends.pin";
const LEGACY_KEY="lakeLegendsDeepDrop_v1", LEGACY_DONE="lakelegends.legacyUsed";
const PICS=["🐟","🦆","🐢","🐸","🦦","🐙","🚤","🍕","⚓"];
const COLORS=["#2f7fb5","#e0607e","#2fa894","#7a5cd6","#e58a2b","#c2476a","#3f8f4a","#8a6a3a"];
const WORDS=("FALCON OLIVE RIVER MOON CEDAR DUNE CAMEL LEMON MANGO TIGER PANDA ROCKET COMET MAPLE OCEAN CANYON DESERT MEADOW FOREST PLANET "+
 "DRAGON CASTLE BRIDGE HARBOR ISLAND GLACIER THUNDER RAINBOW SUNSET PENGUIN DOLPHIN OTTER PARROT GIRAFFE ZEBRA KOALA LLAMA "+
 "PEPPER GINGER COCOA WAFFLE PICKLE MUFFIN NOODLE PEACH PLUM CHERRY ROBOT MAGNET PUZZLE MARBLE KITE DRUM FLUTE PIANO "+
 "SILVER GOLDEN COPPER VIOLET AMBER CORAL JADE RUBY PEARL TOPAZ").split(/\s+/).filter(Boolean);

const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);

/* ---------------- state ---------------- */
let state={v:1, players:[], cur:null, pin:null, pinUpd:0, deleted:{}};
try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"null"); if(s&&s.players) state=Object.assign(state,s); }catch(e){}
try{ if(!state.pin){ const p=localStorage.getItem(PIN_KEY); if(p) state.pin=p; } }catch(e){}
function blankPlayer(name,color){ return {id:uid(), name, color, lock:null, created:Date.now(), days:{}, last:0, upd:Date.now(), game:null}; }
function saveLocal(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); if(state.pin) localStorage.setItem(PIN_KEY,state.pin); }catch(e){} }

/* each player remembers when it last actually changed, so the newest copy of each kid wins a merge */
const HASH=new Map();
function stampChanges(init){ state.players.forEach(p=>{ const h=JSON.stringify(p,(k,v)=>k==="upd"?undefined:v);
  if(!init&&HASH.has(p.id)&&HASH.get(p.id)!==h) p.upd=Date.now(); HASH.set(p.id,h); }); }
function save(){ const p=cur(); if(p){ p.last=Date.now(); p.days=p.days||{}; p.days[today()]=1; } stampChanges(false); saveLocal(); scheduleSync(); }
stampChanges(true);
function today(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

/* ---------------- the save this device had before players existed ---------------- */
function legacySave(){ try{ if(localStorage.getItem(LEGACY_DONE)) return null; const s=JSON.parse(localStorage.getItem(LEGACY_KEY)||"null"); return s&&s.up?s:null; }catch(e){ return null; } }
function useLegacy(p){ const s=legacySave(); if(!s) return false; p.game=s; try{ localStorage.setItem(LEGACY_DONE,p.id); }catch(e){} return true; }   // the old key stays as a backup

/* ---------------- online save ---------------- */
const cloud={code:null,status:"",last:0,timer:null,busy:false,again:false};
try{ cloud.code=localStorage.getItem(FAM_KEY)||null; }catch(e){}
const famId=c=>"ll_"+String(c).toLowerCase().replace(/[^a-z0-9]/g,"");
const docUrl=c=>`https://firestore.googleapis.com/v1/projects/${FB.project}/databases/(default)/documents/families/${famId(c)}`;
function genCode(){ const r=()=>crypto.getRandomValues(new Uint32Array(1))[0]; const w=()=>WORDS[r()%WORDS.length];
  return `${w()}-${w()}-${w()}-${w()}-${String(r()%90+10)}`; }
function storeAuth(a){ try{ localStorage.setItem(AUTH_KEY,JSON.stringify(a)); }catch(e){} }
async function token(){
  let a=null; try{ a=JSON.parse(localStorage.getItem(AUTH_KEY)||"null"); }catch(e){}
  if(a&&a.exp>Date.now()+120000) return a.id;
  if(a&&a.refresh){ try{ const r=await fetch(`https://securetoken.googleapis.com/v1/token?key=${FB.key}`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(a.refresh)});
    if(r.ok){ const j=await r.json(); a={id:j.id_token,refresh:j.refresh_token,exp:Date.now()+(+j.expires_in)*1000}; storeAuth(a); return a.id; } }catch(e){} }
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FB.key}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({returnSecureToken:true})});
  if(!r.ok) throw new Error("auth "+r.status); const j=await r.json(); a={id:j.idToken,refresh:j.refreshToken,exp:Date.now()+(+j.expiresIn)*1000}; storeAuth(a); return a.id;
}
async function cloudGet(c){ const t=await token(); const r=await fetch(docUrl(c),{headers:{Authorization:"Bearer "+t},cache:"no-store"});
  if(r.status===404) return null; if(!r.ok) throw new Error("get "+r.status); const j=await r.json();
  const s=j.fields&&j.fields.data&&j.fields.data.stringValue; return s?JSON.parse(s):null; }
async function cloudPut(c,obj){ const t=await token();
  const body={fields:{data:{stringValue:JSON.stringify(obj)},updated:{integerValue:String(Date.now())},v:{integerValue:"1"}}};
  const r=await fetch(docUrl(c),{method:"PATCH",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok) throw new Error("put "+r.status); }
/* ---------------- replies and notes to a player ----------------
   When a report or suggestion is dealt with, tools/reply.py writes a reply into a small document of its own next to the
   family save (families/llm_<family code>), so a copy of the game that doesn't know about replies can never overwrite it.
   The player sees a popup the next time they're signed in and not in the middle of a cast; tapping it records readBy. */
const noteUrl=c=>`https://firestore.googleapis.com/v1/projects/${FB.project}/databases/(default)/documents/families/llm_${String(c).toLowerCase().replace(/[^a-z0-9]/g,"")}`;
async function notesGet(c){ const t=await token(); const r=await fetch(noteUrl(c),{headers:{Authorization:"Bearer "+t},cache:"no-store"});
  if(r.status===404) return null; if(!r.ok) throw new Error("notes "+r.status); const j=await r.json(); const s=j.fields&&j.fields.data&&j.fields.data.stringValue; return s?JSON.parse(s):null; }
async function notesPut(c,obj){ const t=await token(); const body={fields:{data:{stringValue:JSON.stringify(obj)},updated:{integerValue:String(Date.now())},v:{integerValue:"1"}}};
  const r=await fetch(noteUrl(c),{method:"PATCH",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify(body)}); if(!r.ok) throw new Error("notes put "+r.status); }
let notes=null, noteOpen=false;
const unreadFor=p=>((notes&&notes.msgs)||[]).filter(m=>(m.to===p.id||m.to==="*")&&!(m.readBy&&m.readBy[p.id]));
async function fetchNotes(){ if(!cloud.code) return; try{ notes=await notesGet(cloud.code); }catch(e){ return; } showNote(); }
const REPLY_HEAD={ fixed:["🛠️","We fixed it!"], added:["💡","Your idea is in the game!"], thanks:["🙏","Thanks for telling us!"] };
function showNote(){ const p=cur(); if(!p||noteOpen||onProfiles||document.getElementById("llOv")) return;
  if(typeof window.LL_SAFE==="function"&&!window.LL_SAFE()) return;                     // never in the middle of a cast or a catch
  const m=unreadFor(p)[0]; if(!m) return;
  noteOpen=true; const hd=m.re?(REPLY_HEAD[m.st]||REPLY_HEAD.thanks):["📬","A message for "+p.name];
  overlay(`<div class="ll-card" style="max-width:480px;margin:30px auto;text-align:center"><div style="font-size:3.2rem">${hd[0]}</div>
    <h2 style="margin:4px 0">${esc(hd[1])}</h2><p class="ll-small" style="margin:0">From ${esc(m.from||"the Lake Legends team")} · ${agoText(m.t)}</p>
    ${m.re?`<p class="ll-small" style="text-align:left;margin:12px 0 4px">You ${m.re.k==="idea"?"suggested":"told us"} (${agoText(m.re.t)}):</p><p style="text-align:left;font-style:italic;background:#f1ece0;border-radius:12px;padding:8px 12px;margin:0">“${esc(m.re.m)}”</p>`:""}
    <p style="font-size:1.1rem;text-align:left;white-space:pre-wrap;background:#e6f3fa;border-radius:14px;padding:12px">${esc(m.m)}</p>
    <div class="ll-row"><button class="ll-btn g" id="llNoteRead">${m.re?"Yay! ✓":"Read ✓"}</button></div></div>`);
  document.getElementById("llNoteRead").onclick=async()=>{ const b=document.getElementById("llNoteRead"); b.disabled=true; b.textContent="Saving…";
    try{ const fresh=await notesGet(cloud.code)||{v:1,msgs:[]}; const x=(fresh.msgs||[]).find(y=>y.id===m.id); if(x){ x.readBy=x.readBy||{}; x.readBy[p.id]=Date.now(); await notesPut(cloud.code,fresh); } notes=fresh; }
    catch(e){ m.readBy=m.readBy||{}; m.readBy[p.id]=Date.now(); }            // offline: hide it now; it shows again next time and can be read then
    noteOpen=false; closeOverlay(); setTimeout(showNote,400); };
}
setInterval(()=>{ if(document.visibilityState==="visible") showNote(); },5000);      // a popup that waited for the end of a cast shows up soon after
const payload=()=>({v:1,players:state.players,pin:state.pin||null,pinUpd:state.pinUpd||0,deleted:state.deleted||{},upd:Date.now()});
function merge(remote,keepId){
  const del=Object.assign({},remote.deleted||{},state.deleted||{}); const map=new Map(), order=[];
  (remote.players||[]).forEach(p=>{ map.set(p.id,p); order.push(p.id); });
  state.players.forEach(p=>{ const r=map.get(p.id); if(!r){ map.set(p.id,p); order.push(p.id); return; }
    const win=(p.id===keepId||(p.upd||0)>(r.upd||0))?p:r, lose=win===p?r:p; mergePrizes(win,lose); map.set(p.id,win); });
  const sig=()=>JSON.stringify(state.players,(k,v)=>k==="upd"?undefined:v); const before=sig();
  state.players=order.map(id=>map.get(id)).filter(p=>!(del[p.id]&&del[p.id]>=(p.upd||0))); state.deleted=del;
  if(remote.pin&&(!state.pin||(remote.pinUpd||0)>(state.pinUpd||0))){ state.pin=remote.pin; state.pinUpd=remote.pinUpd||0; }
  if(state.cur&&!state.players.find(p=>p.id===state.cur)) state.cur=null;
  stampChanges(true); saveLocal(); return before!==sig();
}
/* prizes from home can be set on one device while the kid plays on another: combine both copies' lists */
function mergePrizes(a,b){ const del=Object.assign({},b.pdel||{},a.pdel||{}), m=new Map();
  for(const x of (b.pprizes||[]).concat(a.pprizes||[])){ const y=m.get(x.id); m.set(x.id,y?Object.assign({},y,x,{earned:Math.max(y.earned||0,x.earned||0)||undefined,given:Math.max(y.given||0,x.given||0)||undefined}):x); }
  const list=[...m.values()].filter(x=>!del[x.id]); if(list.length||a.pprizes) a.pprizes=list; if(Object.keys(del).length) a.pdel=del; }
function scheduleSync(){ if(!cloud.code) return; clearTimeout(cloud.timer); cloud.timer=setTimeout(syncNow,3000); }
async function syncNow(){
  if(!cloud.code) return; if(cloud.busy){ cloud.again=true; return; } cloud.busy=true; let changed=false;
  try{ const remote=await cloudGet(cloud.code); if(remote) changed=merge(remote,state.cur); await cloudPut(cloud.code,payload()); cloud.status="ok"; cloud.last=Date.now(); fetchNotes(); }
  catch(e){ cloud.status="offline"; }
  cloud.busy=false; badge(); if(changed) fire(); if(cloud.again){ cloud.again=false; scheduleSync(); }
}
setInterval(()=>{ if(cloud.code&&document.visibilityState==="visible") syncNow(); },45000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") syncNow(); else if(cloud.code){ clearTimeout(cloud.timer); syncNow(); } });
function cloudText(){ if(!cloud.code) return "Saved on this device only"; if(cloud.status==="ok"){ const s=Math.round((Date.now()-cloud.last)/1000); return "☁️ Saved online "+(s<60?"just now":Math.round(s/60)+" min ago"); }
  if(cloud.status==="offline") return "☁️ Offline. It will save online when connected."; return "☁️ Connecting…"; }
function badge(){ document.querySelectorAll(".ll-cloud").forEach(e=>e.textContent=cloudText()); }

/* ---------------- listeners ---------------- */
const listeners=[]; function fire(){ listeners.forEach(f=>{ try{ f(); }catch(e){} }); if(onProfiles&&document.querySelector("#llOv .ll-pro")&&!document.querySelector("#llOv input")) profiles(); }

/* ---------------- problems, for the Parent Corner ---------------- */
function logErr(m,at){ const p=cur(); if(!p) return; const er=p.errs=p.errs||[], msg=String(m||"error").slice(0,140), last=er[er.length-1];
  if(last&&last.m===msg&&Date.now()-last.t<60000) return;
  er.push({t:Date.now(),m:msg,at:String(at||"").slice(0,60),v:window.LL_VER||""}); if(er.length>10) er.splice(0,er.length-10); stampChanges(false); saveLocal(); scheduleSync(); }
addEventListener("error",e=>{ try{ logErr(e.message,(e.filename||"").split("/").slice(-1)[0]+":"+(e.lineno||"")); }catch(_){} });
addEventListener("unhandledrejection",e=>{ try{ const r=e.reason; logErr(r&&r.message||r,"promise"); }catch(_){} });

/* ---------------- UI ---------------- */
const CSS=`
#llOv{position:fixed;inset:0;z-index:80;background:linear-gradient(180deg,#9fd6ec 0%,#58b3d0 45%,#1d5a7a 100%);overflow:auto;font-family:"Trebuchet MS","Arial Rounded MT Bold",system-ui,sans-serif;color:#0f2a3d;-webkit-user-select:none;user-select:none}
#llOv .in{max-width:640px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 16px calc(env(safe-area-inset-bottom,0px) + 28px)}
#llOv h1{margin:0;font-size:2.2rem;text-align:center;color:#fff;text-shadow:0 3px 0 #0b3a57,0 6px 12px rgba(0,0,0,.35);line-height:1}
#llOv h1 small{display:block;font-size:.95rem;color:#f5b82e;letter-spacing:.15em;margin-top:6px}
#llOv h2{margin:14px 0 8px;font-size:1.4rem;text-align:center}
#llOv>.in>h2{color:#fff;text-shadow:0 2px 0 #0b3a57}
.ll-pro{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:10px}
.ll-pc{flex:0 1 150px;min-width:130px;background:#fffaf0;border:0;border-radius:22px;padding:12px 8px;cursor:pointer;font:inherit;color:#0f2a3d;box-shadow:0 5px 0 rgba(0,0,0,.2);text-align:center}
.ll-pc svg{width:72px;height:84px}
.ll-pc .n{font-weight:800;font-size:1.15rem}.ll-pc .s{font-size:.85rem;color:#5b6b76}.ll-pc .s.now{color:#2f8a4a;font-weight:800}
.ll-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.ll-btn{font:inherit;font-weight:800;font-size:1.05rem;border:0;border-radius:14px;padding:10px 18px;min-height:48px;cursor:pointer;background:#2f7fb5;color:#fff;box-shadow:0 4px 0 #1d5680}
.ll-btn.g{background:#3fa34d;box-shadow:0 4px 0 #22702f}.ll-btn.gh{background:#eaf2fb;color:#0f2a3d;box-shadow:0 4px 0 #b9c9d8}.ll-btn.r{background:#e0483a;box-shadow:0 4px 0 #9b2a20}
.ll-btn:focus-visible,.ll-pc:focus-visible{outline:3px solid #f5b82e;outline-offset:3px}
.ll-card{background:#fffaf0;border-radius:22px;padding:16px;margin-top:12px;box-shadow:0 4px 0 rgba(0,0,0,.18)}
.ll-card input{font:inherit;font-size:1.3rem;padding:10px 12px;border-radius:12px;border:2px solid #d5dfea;width:100%;box-sizing:border-box;color:#0f2a3d;background:#fff}
.ll-cols{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:10px 0}
.ll-cols button{width:46px;height:46px;border-radius:50%;border:4px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.ll-cols button.on{border-color:#0f2a3d}
.ll-grid{display:grid;grid-template-columns:repeat(3,72px);gap:10px;justify-content:center;margin:12px auto}
.ll-grid button{font-size:2.3rem;height:72px;border-radius:18px;border:0;background:#e6f3fa;cursor:pointer;box-shadow:0 3px 0 #9cc3d8}
.ll-dots{text-align:center;font-size:1.6rem;letter-spacing:.4rem}
.ll-shake{animation:llsh .35s}@keyframes llsh{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.ll-kid{border-top:1px solid #e6dfcf;padding-top:12px;margin-top:12px}.ll-kid:first-of-type{border-top:0;margin-top:0;padding-top:0}
.ll-kid h3{margin:0 0 4px;font-size:1.25rem}
.ll-card h2{color:#0f2a3d;text-shadow:none}
.ll-kid .ll-row{gap:6px}.ll-kid .ll-btn{font-size:.85rem;min-height:38px;padding:7px 11px;box-shadow:0 3px 0 #b9c9d8}
.ll-small{font-size:.9rem;color:#5b6b76}
.ll-cloud{font-size:.95rem;color:#e8f4fa;text-align:center;margin-top:12px}.ll-card .ll-cloud{color:#5b6b76;text-align:left}
.ll-kind{display:flex;gap:16px;flex-wrap:wrap;margin:6px 0 10px;font-weight:700}.ll-kind label{display:flex;gap:6px;align-items:center;cursor:pointer}.ll-kind input{width:20px;height:20px}
#llRep{width:100%;box-sizing:border-box;font:inherit;font-size:1.05rem;border:2px solid #d9e2ec;border-radius:14px;padding:10px;resize:vertical}
.ll-code{font-weight:800;font-size:1.2rem;letter-spacing:.05rem;background:#e6f3fa;border-radius:12px;padding:8px 12px;text-align:center;margin:8px 0;word-break:break-all}
@keyframes llPulse{50%{box-shadow:0 6px 18px rgba(0,0,0,.3),0 0 0 6px rgba(245,184,46,.35)}}
@media (prefers-reduced-motion:reduce){.ll-shake,#llUpd{animation:none!important}}`;
function ensureCss(){ if(document.getElementById("llCss")) return; const s=document.createElement("style"); s.id="llCss"; s.textContent=CSS; document.head.appendChild(s); }
function overlay(html){ ensureCss(); let o=document.getElementById("llOv"); if(!o){ o=document.createElement("div"); o.id="llOv"; document.body.appendChild(o); }
  o.innerHTML=`<div class="in">${html}</div>`; o.scrollTop=0; badge(); return o; }
function closeOverlay(){ const o=document.getElementById("llOv"); if(o) o.remove(); }
/* a little angler in the player's shirt color */
const avatar=(p,size)=>{ try{ if(typeof window.LL_AVATAR==="function") return window.LL_AVATAR(p,size); }catch(e){} return angler(p.color,size); };
function angler(color,size){ return `<svg viewBox="0 0 80 92" width="${size||72}" height="${(size||72)*1.15}" aria-hidden="true">
  <ellipse cx="40" cy="88" rx="20" ry="4" fill="rgba(0,0,0,.15)"/>
  <path d="M58 70 L74 8" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/><path d="M74 8 Q78 40 70 60" stroke="#fff" stroke-width="1.2" fill="none"/>
  <rect x="27" y="66" width="10" height="20" rx="5" fill="#34506e"/><rect x="43" y="66" width="10" height="20" rx="5" fill="#34506e"/>
  <rect x="20" y="40" width="40" height="32" rx="14" fill="${color}"/>
  <circle cx="40" cy="26" r="16" fill="#e9b98f"/><path d="M23 22a17 15 0 0 1 34 0z" fill="#c9302c"/><rect x="40" y="19" width="22" height="5" rx="2.5" fill="#c9302c"/>
  <circle cx="34" cy="28" r="2.6" fill="#0f2a3d"/><circle cx="46" cy="28" r="2.6" fill="#0f2a3d"/>
  <path d="M35 34q5 4 10 0" fill="none" stroke="#0f2a3d" stroke-width="2" stroke-linecap="round"/><circle cx="60" cy="62" r="4" fill="#e9b98f"/></svg>`; }

let enterCb=null, onProfiles=false;
const fishCount=p=>Object.keys((p.game&&p.game.dex)||{}).length;
function profiles(onEnter){ onProfiles=true;
  if(onEnter) enterCb=onEnter;
  const seen=p=>{ const t=Object.keys(p.days||{}).length?p.last:0; if(!t) return `<div class="s">hasn't fished yet</div>`; const m=(Date.now()-t)/60000;
    return m<4?`<div class="s now">🟢 fishing now</div>`:`<div class="s">fished ${m<60?Math.max(1,Math.round(m))+" min ago":m<1440&&new Date(t).getDate()===new Date().getDate()?Math.round(m/60)+" h ago":agoText(t)}</div>`; };
  const list=state.players.map(p=>`<button class="ll-pc" data-id="${p.id}">${avatar(p,72)}<div class="n">${esc(p.name)}</div>
    <div class="s">🪙 ${(p.game&&p.game.coins)||0} · 📖 ${fishCount(p)}${p.lock?" 🔒":""}</div>${seen(p)}</button>`).join("");
  overlay(`<h1>Lake Legends<small>DEEP DROP</small></h1>
    <h2>Who's fishing?</h2>
    ${state.players.length?`<div class="ll-pro">${list}</div>`:`<div class="ll-card" style="text-align:center"><div style="font-size:3rem">🎣</div><p style="font-size:1.1rem;margin:4px 0">No players yet.</p><p class="ll-small">A grown-up adds players in the Parent Corner.</p>
      <div class="ll-row"><button class="ll-btn g" id="llStart">👨‍👩‍👧 Set up players</button></div></div>`}
    <div class="ll-row"><button class="ll-btn gh" id="llParent">👨‍👩‍👧 Parents</button></div>
    <div class="ll-cloud"></div>`);
  document.querySelectorAll(".ll-pc[data-id]").forEach(b=>b.onclick=()=>choose(b.dataset.id));
  document.getElementById("llParent").onclick=()=>askPin(parentCorner);
  const st=document.getElementById("llStart"); if(st) st.onclick=()=>askPin(parentCorner);
}
setInterval(()=>{ if(!onProfiles||document.hidden||!document.querySelector("#llOv .ll-pro")) return; syncNow().then(()=>{ if(onProfiles&&document.querySelector("#llOv .ll-pro")) profiles(); }); },30000);
function choose(id){ const p=state.players.find(x=>x.id===id); if(!p) return; if(p.lock&&p.lock.length) askLock(p); else enter(p); }
function enter(p){ onProfiles=false; state.cur=p.id; p.last=Date.now(); try{ sessionStorage.setItem("ll.active",p.id); }catch(e){} saveLocal(); closeOverlay(); if(enterCb) enterCb(p); fire(); setTimeout(fetchNotes,800); }
function askLock(p){ let tries=[]; const pics=[...PICS].sort(()=>Math.random()-.5);
  overlay(`<div class="ll-card" style="max-width:380px;margin:40px auto;text-align:center">${avatar(p,64)}<h2>Hi ${esc(p.name)}! 🔒</h2>
    <p>Tap your ${p.lock.length} secret pictures in order.</p><div class="ll-dots" id="llDots">${p.lock.map(()=>"○").join(" ")}</div>
    <div class="ll-grid" id="llGrid">${pics.map(e=>`<button data-e="${e}">${e}</button>`).join("")}</div>
    <div class="ll-row"><button class="ll-btn gh" id="llNot">That's not me</button></div></div>`);
  document.getElementById("llNot").onclick=()=>profiles();
  document.querySelectorAll("#llGrid button").forEach(b=>b.onclick=()=>{ tries.push(b.dataset.e);
    document.getElementById("llDots").textContent=p.lock.map((_,i)=>i<tries.length?"●":"○").join(" ");
    if(tries.length<p.lock.length) return;
    if(tries.join("")===p.lock.join("")) return enter(p);
    tries=[]; const g=document.getElementById("llGrid"); g.classList.remove("ll-shake"); void g.offsetWidth; g.classList.add("ll-shake");
    document.getElementById("llDots").textContent=p.lock.map(()=>"○").join(" "); });
}
function createPlayer(){ let color=COLORS[state.players.length%COLORS.length];
  const draw=()=>{ const old=legacySave();
    overlay(`<div class="ll-card" style="max-width:460px;margin:20px auto;text-align:center">
    <h2>Add a player</h2><div>${angler(color,80)}</div>
    <input id="llName" maxlength="14" placeholder="First name" autocomplete="off">
    <div class="ll-small" style="margin-top:6px">First name only, please.</div><div id="llErr" style="color:#c2476a;font-weight:700;min-height:1.2rem;margin-top:4px"></div>
    <div class="ll-small">Shirt color</div>
    <div class="ll-cols">${COLORS.map(c=>`<button data-c="${c}" style="background:${c}" class="${c===color?"on":""}" aria-label="color"></button>`).join("")}</div>
    ${old?`<label class="ll-small" style="display:flex;gap:8px;align-items:center;justify-content:center;margin:6px 0"><input type="checkbox" id="llOld" checked style="width:22px;height:22px"> Give this player the progress already on this device (🪙 ${old.coins||0} · 📖 ${Object.keys(old.dex||{}).length} fish)</label>`:""}
    <div class="ll-row"><button class="ll-btn gh" id="llBack">Back</button><button class="ll-btn g" id="llNext">Next ▶</button></div></div>`);
    document.querySelectorAll(".ll-cols button").forEach(b=>b.onclick=()=>{ const n=document.getElementById("llName").value; color=b.dataset.c; draw(); document.getElementById("llName").value=n; });
    document.getElementById("llBack").onclick=()=>parentCorner();
    document.getElementById("llNext").onclick=()=>{ const n=document.getElementById("llName").value.trim(); if(!n){ document.getElementById("llName").focus(); return; }
      const norm=x=>x.trim().toLowerCase().replace(/\s+/g," ");
      if(state.players.some(x=>norm(x.name)===norm(n))){ const i=document.getElementById("llName"); i.style.borderColor="#e0483a"; document.getElementById("llErr").textContent=`There's already a player called ${n}. Try adding a last initial, like "${n} B".`; i.focus(); return; }
      const first=!state.players.length, p=blankPlayer(n,color), ob=document.getElementById("llOld");
      if(ob&&ob.checked) useLegacy(p);
      state.players.push(p); stampChanges(false); saveLocal(); scheduleSync(); chooseLock(p,false,first?()=>enter(p):null); }; };
  draw();
}
function chooseLock(p,isNew,done){ let pick=[]; const after=()=>done?done():isNew?enter(p):parentCorner();
  const draw=()=>{ overlay(`<div class="ll-card" style="max-width:420px;margin:20px auto;text-align:center">${avatar(p,64)}
    <h2>Pick 2 secret pictures</h2><p>They keep ${esc(p.name)}'s fishing safe. Remember the order!</p>
    <div class="ll-dots">${[0,1].map(i=>pick[i]||"○").join(" ")}</div>
    <div class="ll-grid">${PICS.map(e=>`<button data-e="${e}">${e}</button>`).join("")}</div>
    <div class="ll-row"><button class="ll-btn gh" id="llSkip">${(isNew||!p.lock)?"No secret pictures":"Remove lock"}</button>${pick.length===2?`<button class="ll-btn g" id="llOk">Save ✓</button>`:""}</div></div>`);
    document.querySelectorAll(".ll-grid button").forEach(b=>b.onclick=()=>{ if(pick.length<2&&!pick.includes(b.dataset.e)){ pick.push(b.dataset.e); draw(); } });
    document.getElementById("llSkip").onclick=()=>{ p.lock=null; stampChanges(false); saveLocal(); scheduleSync(); after(); };
    const ok=document.getElementById("llOk"); if(ok) ok.onclick=()=>{ p.lock=pick.slice(); stampChanges(false); saveLocal(); scheduleSync(); after(); }; };
  draw();
}

/* ---------------- parent PIN + Parent Corner ---------------- */
function askPin(next){ onProfiles=false;
  if(!state.pin){ let first=null;
    const setP=(msg)=>{ overlay(`<div class="ll-card" style="max-width:380px;margin:40px auto;text-align:center"><h2>${first?"Type it again":"Create a parent PIN"}</h2>
      <p class="ll-small">${msg||"4 digits. Grown-ups use it to open the Parent Corner."}</p>
      <input id="llPin" inputmode="numeric" maxlength="4" style="text-align:center;letter-spacing:.5rem" autocomplete="off">
      <div class="ll-row"><button class="ll-btn gh" id="llC">Cancel</button><button class="ll-btn g" id="llO">OK</button></div></div>`);
      const i=document.getElementById("llPin"); setTimeout(()=>i.focus(),50);
      const go=()=>{ const v=i.value.trim(); if(!/^\d{4}$/.test(v)) return setP("Please use exactly 4 digits.");
        if(!first){ first=v; return setP(); } if(v!==first){ first=null; return setP("Those didn't match. Let's try again."); }
        state.pin=v; state.pinUpd=Date.now(); saveLocal(); scheduleSync(); next(); };
      document.getElementById("llO").onclick=go; i.onkeydown=e=>{ if(e.key==="Enter") go(); }; document.getElementById("llC").onclick=()=>profiles(); };
    return setP(); }
  overlay(`<div class="ll-card" style="max-width:380px;margin:40px auto;text-align:center"><h2>Parent PIN</h2>
    <input id="llPin" inputmode="numeric" maxlength="4" type="password" style="text-align:center;letter-spacing:.5rem" autocomplete="off">
    <p class="ll-small" id="llMsg"> </p><div class="ll-row"><button class="ll-btn gh" id="llC">Cancel</button><button class="ll-btn g" id="llO">Open</button></div></div>`);
  const i=document.getElementById("llPin"); setTimeout(()=>i.focus(),50);
  const go=()=>{ if(i.value.trim()===state.pin) next(); else { document.getElementById("llMsg").textContent="That's not it. Try again."; i.value=""; } };
  document.getElementById("llO").onclick=go; i.onkeydown=e=>{ if(e.key==="Enter") go(); }; document.getElementById("llC").onclick=()=>profiles();
}
function agoText(t){ if(!t) return "never"; const d=Math.round((Date.now()-t)/86400000); return d===0?"today":d===1?"yesterday":d+" days ago"; }
function kidSummary(p){
  const extra=typeof window.LL_KID==="function"?(()=>{ try{ return window.LL_KID(p.game||{}); }catch(e){ return ""; } })():"";
  const errs=(p.errs||[]).slice().reverse();
  return `<div class="ll-kid"><h3>${esc(p.name)} <span class="ll-small">last fished ${agoText(Object.keys(p.days||{}).length?p.last:0)}</span></h3>
    <div class="ll-small">${extra||"Hasn't fished yet."}</div>
    ${(p.reports||[]).length?`<details class="ll-small" style="margin-top:6px" open><summary>🐞 Reports and suggestions (${p.reports.length})</summary>${p.reports.slice().reverse().map(r=>`<div style="margin:5px 0;padding:6px 8px;background:#f1ece0;border-radius:10px"><div>${r.k==="idea"?"💡 Suggestion":"🐞 Problem"} · ${agoText(r.t)} · ${esc(r.s||"")} · ${esc(r.v||"")}</div><div style="color:#0f2a3d">${esc(r.m)}</div>${(()=>{ const a=((notes&&notes.msgs)||[]).find(m=>m.re&&m.to===p.id&&m.re.t===r.t); return a?`<div style="margin-top:4px;color:#2f8a4a">↳ ${(REPLY_HEAD[a.st]||REPLY_HEAD.thanks)[0]} ${esc(a.m)} ${a.readBy&&a.readBy[p.id]?"(seen "+agoText(a.readBy[p.id])+")":"(not seen yet)"}</div>`:`<div style="margin-top:4px">⏳ not answered yet</div>`; })()}</div>`).join("")}</details>`:""}
    ${errs.length?`<details class="ll-small" style="margin-top:6px"><summary>Problems the game noticed (${errs.length})</summary>${errs.map(r=>`<div style="color:#b23a56;margin:3px 0">${agoText(r.t)} · ${esc(r.m)} · ${esc(r.at)} (${esc(r.v)})</div>`).join("")}</details>`:""}
    ${prizesHtml(p)}
    <div class="ll-row" style="justify-content:flex-start;margin-top:8px"><button class="ll-btn g" data-padd="${p.id}">🎁 Add a prize</button><button class="ll-btn gh" data-lock="${p.id}">🔒 Secret pictures</button><button class="ll-btn gh" data-reset="${p.id}">Start ${esc(p.name)} over</button><button class="ll-btn gh" data-del="${p.id}">Remove player</button></div></div>`;
}
/* prizes from home: a grown-up picks a goal and types a real-world reward; the game celebrates when it's earned */
const goalsFor=p=>typeof window.LL_GOALS==="function"?window.LL_GOALS(p.game||{}):[];
function prizesHtml(p){ const pp=p.pprizes||[]; if(!pp.length) return ""; const goals=goalsFor(p);
  return `<div class="ll-small" style="margin-top:8px"><b>🎁 Prizes from home</b>${pp.map(x=>{ const g=goals.find(y=>y.id===x.goal)||{name:"?",cur:0,need:1};
    return `<div style="margin:4px 0;padding:6px 8px;background:#eef6ec;border-radius:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between">
      <span><b>${esc(x.text)}</b> for: ${esc(g.name)} · ${x.earned?(x.given?"🎉 given":"🎁 <b style='color:#2f8a4a'>EARNED</b> "+agoText(x.earned)):g.cur+"/"+g.need}</span>
      <span>${x.earned&&!x.given?`<button class="ll-btn gh" data-given="${p.id}|${x.id}">Mark as given</button>`:""}<button class="ll-btn gh" data-pdel="${p.id}|${x.id}" aria-label="Remove">✕</button></span></div>`; }).join("")}</div>`; }
function prizeForm(p){ const goals=goalsFor(p).filter(g=>g.cur<g.need);
  overlay(`<div class="ll-card" style="max-width:480px;margin:20px auto">
    <h2 style="margin-top:0">🎁 A prize for ${esc(p.name)}</h2>
    <p class="ll-small">Pick a goal in the game and type the real-world prize. When ${esc(p.name)} reaches it, the game celebrates and tells them to come and get it.</p>
    <label class="ll-small">Goal</label>
    <select id="llPG" style="font:inherit;font-size:1.05rem;width:100%;padding:10px;border-radius:12px;border:2px solid #d5dfea;margin:4px 0 10px">${goals.map(g=>`<option value="${g.id}">${esc(g.name)} (now ${g.cur}/${g.need})</option>`).join("")}</select>
    <label class="ll-small">Prize</label><input id="llPT" maxlength="60" placeholder="e.g. Pizza night, a trip to the real Dixon Lake" autocomplete="off">
    <div id="llPE" style="color:#c2476a;font-weight:700;min-height:1.2rem;margin-top:4px"></div>
    <div class="ll-row"><button class="ll-btn gh" id="llPC">Cancel</button><button class="ll-btn g" id="llPS">Save prize ✓</button></div></div>`);
  document.getElementById("llPC").onclick=()=>parentCorner();
  document.getElementById("llPS").onclick=()=>{ const t=document.getElementById("llPT").value.trim(), g=document.getElementById("llPG").value;
    if(!t){ document.getElementById("llPE").textContent="Type the prize first."; return; } if(!g){ document.getElementById("llPE").textContent="Every goal is already reached!"; return; }
    p.pprizes=(p.pprizes||[]).concat({id:uid(),goal:g,text:t.slice(0,60),t:Date.now()}); stampChanges(false); saveLocal(); scheduleSync(); parentCorner(); };
}
function wireKidButtons(){
  document.querySelectorAll("[data-padd]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.padd); if(p) prizeForm(p); });
  const pick=v=>{ const [pid,xid]=v.split("|"), p=state.players.find(x=>x.id===pid); return p&&{p,x:(p.pprizes||[]).find(y=>y.id===xid)}; };
  document.querySelectorAll("[data-given]").forEach(b=>b.onclick=()=>{ const r=pick(b.dataset.given); if(!r||!r.x) return; r.x.given=Date.now(); stampChanges(false); saveLocal(); scheduleSync(); parentCorner(); });
  document.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=()=>{ const r=pick(b.dataset.pdel); if(!r||!r.x||!confirm("Remove this prize?")) return; r.p.pprizes=r.p.pprizes.filter(y=>y!==r.x); r.p.pdel=Object.assign({},r.p.pdel,{[r.x.id]:Date.now()}); stampChanges(false); saveLocal(); scheduleSync(); parentCorner(); });
  document.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.lock); if(p) chooseLock(p,false); });
  document.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.reset); if(!p) return;
    if(confirm(`Erase all of ${p.name}'s fish, coins, gear and lakes and start fresh? This can't be undone.`)){ p.game=null; stampChanges(false); saveLocal(); scheduleSync(); fire(); parentCorner(); } });
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.del); if(!p) return;
    if(confirm(`Remove ${p.name} and all their progress?`)){ state.deleted[p.id]=Date.now(); state.players=state.players.filter(x=>x.id!==p.id); if(state.cur===p.id) state.cur=null; saveLocal(); scheduleSync(); fire(); parentCorner(); } });
}
function parentCorner(){ onProfiles=false;
  const kids=state.players.length?state.players.map(kidSummary).join(""):`<p class="ll-small">No players yet.</p>`;
  overlay(`<h1>Parent Corner</h1>
    <div class="ll-card"><h2 style="text-align:left;margin-top:0">Players</h2>${kids}<div class="ll-row" style="justify-content:flex-start"><button class="ll-btn g" id="llAddKid">➕ Add a player</button></div></div>
    <div class="ll-card"><h2 style="text-align:left;margin-top:0">☁️ Online save</h2>
      ${cloud.code?`<p>This device saves online with your family code. Type it on another device to share the same players:</p><div class="ll-code">${esc(cloud.code)}</div>
        <div class="ll-row" style="justify-content:flex-start"><button class="ll-btn gh" id="llCopy">Copy code</button><button class="ll-btn gh" id="llOff">Stop saving online on this device</button></div>`
      :`<p>Turn this on so progress is backed up and the same players appear on every device in your home.</p>
        <div class="ll-row" style="justify-content:flex-start"><button class="ll-btn g" id="llOn">Turn on online save</button></div>
        <p class="ll-small" style="margin-top:12px">Already have a Lake Legends family code from another device?</p>
        <input id="llJoin" placeholder="e.g. FALCON-OLIVE-RIVER-MOON-17" autocomplete="off" autocapitalize="characters">
        <div class="ll-row" style="justify-content:flex-start"><button class="ll-btn" id="llJoinBtn">Join</button></div>`}
      <div class="ll-cloud"></div></div>
    <div class="ll-card"><h2 style="text-align:left;margin-top:0">Parent PIN</h2><div class="ll-row" style="justify-content:flex-start"><button class="ll-btn gh" id="llChPin">Change PIN</button></div></div>
    <div class="ll-row"><button class="ll-btn" id="llDone">◀ Back to players</button></div>`);
  document.getElementById("llDone").onclick=()=>profiles();
  document.getElementById("llChPin").onclick=()=>{ state.pin=null; askPin(parentCorner); };
  document.getElementById("llAddKid").onclick=()=>createPlayer();
  wireKidButtons();
  const on=document.getElementById("llOn"); if(on) on.onclick=async()=>{ cloud.code=genCode(); try{ localStorage.setItem(FAM_KEY,cloud.code); }catch(e){} cloud.status=""; parentCorner(); await syncNow(); parentCorner(); };
  const off=document.getElementById("llOff"); if(off) off.onclick=()=>{ if(!confirm("Stop saving online on this device? Players stay on this device.")) return; cloud.code=null; try{ localStorage.removeItem(FAM_KEY); }catch(e){} parentCorner(); };
  const cp=document.getElementById("llCopy"); if(cp) cp.onclick=async()=>{ try{ await navigator.clipboard.writeText(cloud.code); cp.textContent="Copied!"; }catch(e){ prompt("Copy this code:",cloud.code); } };
  const jb=document.getElementById("llJoinBtn"); if(jb) jb.onclick=async()=>{ const v=document.getElementById("llJoin").value.trim().toUpperCase(); if(v.replace(/[^A-Z0-9]/g,"").length<12){ alert("That code looks too short."); return; }
    jb.textContent="Joining…"; try{ const r=await cloudGet(v); if(!r){ alert("No Lake Legends save found for that code. Check the spelling."); jb.textContent="Join"; return; }
      cloud.code=v; try{ localStorage.setItem(FAM_KEY,v); }catch(e){} merge(r,null); await syncNow(); parentCorner(); } catch(e){ alert("Couldn't reach the internet. Try again in a moment."); jb.textContent="Join"; } };
}

/* ---------------- 🐞 report a problem or make a suggestion (saved in the player's own save) ---------------- */
function reportForm(){ const p=cur(); if(!p) return;
  const scr=typeof window.LL_SCREEN==="function"?String(window.LL_SCREEN()||""):"";
  overlay(`<div class="ll-card" style="max-width:520px;margin:20px auto">
    <h2 style="margin-top:0">🐞 Tell us what you found</h2>
    <p class="ll-small" style="margin:0 0 10px">Everything you send helps make Lake Legends better.</p>
    <div class="ll-kind"><label><input type="radio" name="llk" value="problem" checked> 🐞 Something is wrong</label><label><input type="radio" name="llk" value="idea"> 💡 A suggestion</label></div>
    <textarea id="llRep" maxlength="600" rows="5" placeholder="What happened, or what would make it better?"></textarea>
    <div class="ll-small" style="margin-top:4px">We also save which screen you were on${scr?" ("+esc(scr)+")":""} and the game version.</div>
    <div id="llRepErr" style="color:#c2476a;font-weight:700;min-height:1.2rem;margin-top:4px"></div>
    <div class="ll-row"><button class="ll-btn gh" id="llRepNo">Cancel</button><button class="ll-btn g" id="llRepOk">Send ✓</button></div></div>`);
  const box=document.getElementById("llRep"); setTimeout(()=>box.focus(),50);
  document.getElementById("llRepNo").onclick=()=>closeOverlay();
  document.getElementById("llRepOk").onclick=()=>{ const m=box.value.trim(); if(m.length<3){ document.getElementById("llRepErr").textContent="Please write a few words first."; box.focus(); return; }
    const k=(document.querySelector('input[name="llk"]:checked')||{}).value||"problem";
    const q=cur(); if(!q) return; const r=q.reports=q.reports||[]; r.push({t:Date.now(),k,m:m.slice(0,600),s:scr,v:window.LL_VER||"dev"}); if(r.length>30) r.splice(0,r.length-30);
    stampChanges(false); saveLocal(); syncNow();
    overlay(`<div class="ll-card" style="max-width:420px;margin:30px auto;text-align:center"><div style="font-size:3rem">🙏</div><h2>Thank you!</h2><p>We saved your ${k==="idea"?"suggestion":"report"}.</p>
      <div class="ll-row"><button class="ll-btn g" id="llRepDone">Back to the game</button></div></div>`);
    document.getElementById("llRepDone").onclick=()=>closeOverlay(); };
}

/* ---------------- public API ---------------- */
function cur(){ return state.players.find(p=>p.id===state.cur)||null; }
window.LL={
  player:cur, players:()=>state.players.slice(), profiles, report:reportForm, parentCorner:()=>askPin(parentCorner), save, syncNow, esc, angler,
  sessionPlayer(){ let id=null; try{ id=sessionStorage.getItem("ll.active"); }catch(e){} const p=cur(); return p&&p.id===id?p:null; },
  leave(){ state.cur=null; try{ sessionStorage.removeItem("ll.active"); }catch(e){} saveLocal(); },
  onChange:f=>listeners.push(f), cloudText, COLORS
};
/* ?family=CODE link joins a household once */
try{ const q=(new URLSearchParams(location.search).get("family")||"").toUpperCase();
  if(q&&q!==cloud.code&&(!cloud.code||confirm("Switch this device to the family from this link? Players from the old family stay saved online under the old code."))){
    if(cloud.code){ state.players=[]; state.deleted={}; state.cur=null; state.pin=null; }
    cloud.code=q; localStorage.setItem(FAM_KEY,q); saveLocal(); }
  if(q){ const u=new URLSearchParams(location.search); u.delete("family"); history.replaceState(null,"",location.pathname+(u.toString()?"?"+u:"")+location.hash); } }catch(e){}
if(cloud.code) syncNow();

/* ---------------- updates: the game notices a new version and reloads itself ----------------
   index.html carries window.LL_VER; lake-legends/version.json holds the newest one. */
(function(){
  const VER=window.LL_VER||"dev", ROOT=(location.pathname.match(/^(.*\/lake-legends\/)/)||[])[1]||"./";
  const EVERY=5*60e3, AWAY_QUIET=15*60e3; let pending=null, busy=false;
  const safeNow=()=>!document.hidden&&(typeof window.LL_SAFE!=="function"||window.LL_SAFE());
  async function latest(){ if(location.protocol==="file:") return null; try{ const r=await fetch(ROOT+"version.json?t="+Date.now(),{cache:"no-store"}); if(!r.ok) return null; const j=await r.json(); return j&&j.v?String(j.v):null; }catch(e){ return null; } }
  function triedRecently(v){ try{ const t=JSON.parse(localStorage.getItem("llUpdTry")||"null"); return t&&t.v===v&&Date.now()-t.t<20*60e3; }catch(e){ return false; } }
  async function check(){ const v=await latest(); if(v&&v!==VER&&!triedRecently(v)){ pending=v; return true; } return false; }
  function splash(msg){ const d=document.createElement("div"); d.style.cssText="position:fixed;inset:0;z-index:100;background:linear-gradient(180deg,#9fd6ec,#1d5a7a);display:flex;align-items:center;justify-content:center;font-family:'Trebuchet MS',system-ui,sans-serif;color:#fff;text-align:center";
    d.innerHTML=`<div><div style="font-size:3rem">🎣</div><div style="font-size:1.5rem;font-weight:800">${msg}</div></div>`; document.body.appendChild(d); }
  async function reload(msg){ if(busy) return; busy=true; try{ saveLocal(); }catch(e){}
    splash(msg||"Updating Lake Legends…");
    try{ if(cloud.code){ clearTimeout(cloud.timer); await Promise.race([syncNow(),new Promise(r=>setTimeout(r,4000))]); } }catch(e){}
    try{ if(pending) localStorage.setItem("llUpdTry",JSON.stringify({v:pending,t:Date.now()})); sessionStorage.setItem("ll.updated","1"); }catch(e){}
    const q=new URLSearchParams(location.search); q.set("r",Date.now()); location.replace(location.pathname+"?"+q.toString()+location.hash); }
  function banner(){ if(document.getElementById("llUpd")) return; const b=document.createElement("button"); b.id="llUpd"; b.type="button";
    const box=document.getElementById("wrap");   // inside the game, just above the big reel button
    b.style.cssText=(box?"position:absolute;bottom:7.6em;font-size:1em;":"position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);font-size:16px;")+"left:50%;transform:translateX(-50%);z-index:90;border:0;border-radius:999px;padding:.6em 1.1em;font-family:'Trebuchet MS',system-ui,sans-serif;font-weight:800;white-space:nowrap;background:#f5b82e;color:#3a2600;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer;animation:llPulse 1.6s ease-in-out infinite";
    ensureCss(); b.innerHTML="✨ New stuff in Lake Legends! <u>Tap to update</u>"; b.onclick=()=>reload(); (box||document.body).appendChild(b); }
  function toast(t){ const d=document.createElement("div"); d.textContent=t; d.style.cssText="position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 70px);z-index:90;background:#fff;color:#0f2a3d;border-radius:999px;padding:8px 16px;font:800 1rem 'Trebuchet MS',system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.2)"; document.body.appendChild(d); setTimeout(()=>d.remove(),2600); }
  (async()=>{ try{ if(sessionStorage.getItem("ll.updated")){ sessionStorage.removeItem("ll.updated"); const q=new URLSearchParams(location.search); if(q.has("r")){ q.delete("r"); history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:"")+location.hash); } setTimeout(()=>toast("✨ Lake Legends is up to date!"),600); return; } }catch(e){}
    if(await check()) reload(); })();
  setInterval(async()=>{ if(document.hidden||busy) return; if(pending||await check()) banner(); },EVERY);
  document.addEventListener("visibilitychange",async()=>{ if(document.hidden){ try{ localStorage.setItem("llHiddenAt",String(Date.now())); }catch(e){} return; }
    let hid=0; try{ hid=+localStorage.getItem("llHiddenAt")||0; }catch(e){} const away=Date.now()-hid;
    if(await check()){ (away>=AWAY_QUIET&&safeNow())?reload():banner(); } });
  window.LL_UPDATE={check,reload,banner,version:VER};
})();
})();
