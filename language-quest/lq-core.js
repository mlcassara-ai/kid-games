/* Language Quest core: players, secret-picture locks, parent PIN, stats and online save.
   Modeled on Math Quest: one save per household ("family"), anonymous Firebase sign-in over REST,
   Firestore doc families/lq_<code>, newest-copy-of-each-kid-wins merge. Shared by the map and every zone page. */
(function(){
const FB={project:"kid-games-dc068", key:"AIzaSyDisxs0uEXvWrlOp8VchKOz0abxPDKIWpI"};
const SAVE_KEY="languagequest.v1", AUTH_KEY="languagequest.auth", FAM_KEY="languagequest.family", PIN_KEY="languagequest.pin";
const PICS=["🐶","🐱","🦊","🐸","🦄","🐙","🚀","🍕","⚽"];
const COLORS=["#1E5AA8","#E0607E","#2FA894","#7A5CD6","#E58A2B","#C2476A","#2E8FA8","#6B8E23"];
const WORDS=("FALCON OLIVE RIVER MOON CEDAR DUNE CAMEL LEMON MANGO TIGER PANDA ROCKET COMET MAPLE OCEAN CANYON DESERT MEADOW FOREST PLANET "+
 "DRAGON CASTLE BRIDGE HARBOR ISLAND GLACIER THUNDER RAINBOW SUNSET PENGUIN DOLPHIN OTTER PARROT GIRAFFE ZEBRA KOALA LLAMA "+
 "PEPPER GINGER COCOA WAFFLE PICKLE MUFFIN NOODLE PEACH PLUM CHERRY ROBOT MAGNET PUZZLE MARBLE KITE DRUM FLUTE PIANO "+
 "SILVER GOLDEN COPPER VIOLET AMBER CORAL JADE RUBY PEARL TOPAZ").split(/\s+/).filter(Boolean);

const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);

/* ---------------- state ---------------- */
let state={v:1, players:[], cur:null, pin:null, pinUpd:0, deleted:{}, cls:null};
try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"null"); if(s&&s.players) state=Object.assign(state,s); }catch(e){}
try{ if(!state.pin){ const p=localStorage.getItem(PIN_KEY); if(p) state.pin=p; } }catch(e){}
function blankPlayer(name,color){ return {id:uid(), name, color, lock:null, setup:true, coins:0, created:Date.now(),
  letters:{}, camps:{}, stats:{letters:{}, words:{}, mix:{}}, days:{}, last:0, upd:Date.now()}; }
function saveLocal(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); if(state.pin) localStorage.setItem(PIN_KEY,state.pin); }catch(e){} }

/* each player remembers when it last actually changed, so the newest copy of each kid wins a merge */
const HASH=new Map();
function stampChanges(init){ state.players.forEach(p=>{ const h=JSON.stringify(p,(k,v)=>k==="upd"?undefined:v);
  if(!init&&HASH.has(p.id)&&HASH.get(p.id)!==h) p.upd=Date.now(); HASH.set(p.id,h); }); }
function save(){ stampChanges(false); saveLocal(); scheduleSync(); fire(); }
stampChanges(true);

/* ---------------- online save ---------------- */
const cloud={code:null,status:"",last:0,timer:null,busy:false,again:false};
try{ cloud.code=localStorage.getItem(FAM_KEY)||null; }catch(e){}
const famId=c=>"lq_"+String(c).toLowerCase().replace(/[^a-z0-9]/g,"");
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
const payload=()=>({v:1,players:state.players,pin:state.pin||null,pinUpd:state.pinUpd||0,deleted:state.deleted||{},cls:state.cls||null,upd:Date.now()});
function merge(remote,keepId){
  const del=Object.assign({},remote.deleted||{},state.deleted||{}); const map=new Map(), order=[];
  (remote.players||[]).forEach(p=>{ map.set(p.id,p); order.push(p.id); });
  state.players.forEach(p=>{ const r=map.get(p.id); if(!r){ map.set(p.id,p); order.push(p.id); } else if(p.id===keepId||(p.upd||0)>(r.upd||0)) map.set(p.id,p); });
  const sig=()=>JSON.stringify(state.players,(k,v)=>k==="upd"?undefined:v); const before=sig();
  state.players=order.map(id=>map.get(id)).filter(p=>!(del[p.id]&&del[p.id]>=(p.upd||0))); state.deleted=del;
  if(remote.pin&&(!state.pin||(remote.pinUpd||0)>(state.pinUpd||0))){ state.pin=remote.pin; state.pinUpd=remote.pinUpd||0; }
  if(remote.cls) state.cls=remote.cls;
  if(state.cur&&!state.players.find(p=>p.id===state.cur)) state.cur=null;
  stampChanges(true); saveLocal(); return before!==sig();
}
function scheduleSync(){ if(!cloud.code) return; clearTimeout(cloud.timer); cloud.timer=setTimeout(syncNow,3000); }
async function syncNow(){
  if(!cloud.code) return; if(cloud.busy){ cloud.again=true; return; } cloud.busy=true; let changed=false;
  try{ const remote=await cloudGet(cloud.code); if(remote) changed=merge(remote,state.cur); await cloudPut(cloud.code,payload()); cloud.status="ok"; cloud.last=Date.now(); }
  catch(e){ cloud.status="offline"; }
  cloud.busy=false; badge(); if(changed) fire(); if(cloud.again){ cloud.again=false; scheduleSync(); }
}
setInterval(()=>{ if(cloud.code&&document.visibilityState==="visible") syncNow(); },45000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") syncNow(); });
function cloudText(){ if(!cloud.code) return "Saved on this device only"; if(cloud.status==="ok"){ const s=Math.round((Date.now()-cloud.last)/1000); return "☁️ Saved online "+(s<60?"just now":Math.round(s/60)+" min ago"); }
  if(cloud.status==="offline") return "☁️ Offline — will save online when connected"; return "☁️ Connecting…"; }
function badge(){ document.querySelectorAll(".lq-cloud").forEach(e=>e.textContent=cloudText()); }

/* ---------------- listeners ---------------- */
const listeners=[]; function fire(){ listeners.forEach(f=>{ try{ f(); }catch(e){} }); if(onProfiles&&document.getElementById("lqOv")&&document.querySelector("#lqOv .lq-pro, #lqOv #lqParent")&&!document.querySelector("#lqOv input")) profiles(); }

/* ---------------- stats (for the parent/teacher view) ---------------- */
function today(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function record(kind,key,ok,confusedWith){
  const p=cur(); if(!p) return; const st=p.stats=p.stats||{letters:{},words:{},mix:{}}; const bucket=st[kind]=st[kind]||{};
  const e=bucket[key]=bucket[key]||{r:0,w:0}; ok?e.r++:e.w++; e.t=Date.now();
  if(!ok&&confusedWith){ const k=key+"→"+confusedWith; st.mix=st.mix||{}; st.mix[k]=(st.mix[k]||0)+1; }
  if(!ok){ st.recent=st.recent||[]; st.recent.unshift({k:kind,a:key,b:confusedWith||"",t:Date.now(),z:location.pathname.split("/").filter(Boolean).pop()||"map"}); st.recent=st.recent.slice(0,25); }
  if(ok){ const d=today(), dr=p.dr=p.dr||{}; dr[d]=(dr[d]||0)+1; if(!p.best||dr[d]>p.best.n) p.best={d,n:dr[d]};
    const ks=Object.keys(dr); if(ks.length>21){ const ms=k=>{ const a=k.split("-"); return new Date(+a[0],a[1]-1,+a[2]).getTime(); }; ks.sort((a,b)=>ms(a)-ms(b)).slice(0,ks.length-21).forEach(k=>delete dr[k]); } }
  p.last=Date.now(); p.days=p.days||{}; p.days[today()]=1; save();
}
/* ---------------- diagnostics: kept inside the family's own save, sent nowhere else ----------------
   p.trail = the last 30 screens a player opened; p.errs = the last 10 problems (page errors and freezes).
   They exist so "she got stuck" can be answered from the save. No answers, names or typing are recorded here. */
const HANG_KEY="lqHang", zoneNow=()=>location.pathname.split("/").filter(Boolean).pop()||"map";
let lastScreen="";
function keepDiag(){ stampChanges(false); saveLocal(); scheduleSync(); }
function logErr(m,at,p,scr){ p=p||cur(); if(!p) return; const er=p.errs=p.errs||[], msg=String(m||"error").slice(0,140), last=er[er.length-1];
  if(last&&last.m===msg&&Date.now()-last.t<60000) return;                       // do not pile up a repeating error
  er.push({t:Date.now(),m:msg,at:String(at||"").slice(0,60),s:scr||lastScreen,z:zoneNow(),v:window.LQ_VER||"dev"}); if(er.length>10) er.splice(0,er.length-10); keepDiag(); }
function mark(scr){ const p=cur(); if(!p) return; lastScreen=String(scr).slice(0,40);
  const tr=p.trail=p.trail||[]; tr.push({t:Date.now(),s:lastScreen,z:zoneNow(),v:window.LQ_VER||"dev"}); if(tr.length>30) tr.splice(0,tr.length-30); p.last=Date.now(); p.days=p.days||{}; p.days[today()]=1; keepDiag();
  // freeze check: this note is wiped as soon as the screen finishes drawing; if the page hangs instead, the next visit finds it
  try{ localStorage.setItem(HANG_KEY,JSON.stringify({s:lastScreen,t:Date.now(),id:p.id})); setTimeout(()=>{ try{ localStorage.removeItem(HANG_KEY); }catch(e){} },0); }catch(e){} }
try{ const h=JSON.parse(localStorage.getItem(HANG_KEY)||"null"); localStorage.removeItem(HANG_KEY);
  if(h){ const hp=state.players.find(q=>q.id===h.id); if(hp){ logErr("The page froze and had to be reloaded","",hp,h.s); const e=hp.errs[hp.errs.length-1]; if(e) e.t=h.t; saveLocal(); } } }catch(e){}
addEventListener("pagehide",()=>{ try{ localStorage.removeItem(HANG_KEY); }catch(e){} });
addEventListener("error",e=>{ try{ logErr(e.message,(e.filename||"").split("/").slice(-2).join("/")+":"+(e.lineno||"")); }catch(_){} });
addEventListener("unhandledrejection",e=>{ try{ const r=e.reason; logErr(r&&r.message||r,"promise"); }catch(_){} });
/* ---------------- UI ---------------- */
const CSS=`
#lqOv{position:fixed;inset:0;z-index:50;background:linear-gradient(180deg,#8FC6F0,#F7DFA8);overflow:auto;font-family:"Baloo Bhaijaan 2","Geeza Pro",system-ui,sans-serif;color:#12233D;-webkit-user-select:none;user-select:none}
#lqOv .in{max-width:760px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 16px calc(env(safe-area-inset-bottom,0px) + 28px)}
#lqOv h1{margin:0;font-size:2rem;text-align:center;font-weight:800}
#lqOv h1 small{display:block;font-size:1.3rem;color:#1E5AA8;font-weight:500;line-height:1.9;margin-top:2px}
#lqOv h2{margin:14px 0 8px;font-size:1.4rem;text-align:center}
.lq-pro{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:10px}
.lq-pro .lq-pc{flex:0 1 160px;min-width:140px}
.lq-pc{background:#fff;border:0;border-radius:22px;padding:12px 8px;cursor:pointer;font:inherit;color:#12233D;box-shadow:0 4px 14px rgba(70,50,10,.18);text-align:center}
.lq-pc svg{width:80px;height:92px}
.lq-pc .n{font-weight:800;font-size:1.15rem}.lq-pc .s{font-size:.9rem;color:#5A6B82}.lq-pc .s.now{color:#1F7A68;font-weight:800}
.lq-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.lq-btn{font:inherit;font-weight:800;font-size:1.05rem;border:0;border-radius:14px;padding:10px 18px;min-height:48px;cursor:pointer;background:#1E5AA8;color:#fff}
.lq-btn.g{background:#2FA894}.lq-btn.gh{background:#EAF2FB;color:#12233D}.lq-btn.r{background:#E0607E}
.lq-btn:focus-visible,.lq-pc:focus-visible{outline:3px solid #F2B134;outline-offset:3px}
.lq-card{background:#fff;border-radius:22px;padding:16px;margin-top:12px;box-shadow:0 4px 14px rgba(70,50,10,.15)}
.lq-card input{font:inherit;font-size:1.3rem;padding:10px 12px;border-radius:12px;border:2px solid #D5DFEA;width:100%;color:#12233D;background:#fff}
.lq-cols{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:10px 0}
.lq-cols button{width:48px;height:48px;border-radius:50%;border:4px solid #fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.lq-cols button.on{border-color:#12233D}
.lq-grid{display:grid;grid-template-columns:repeat(3,72px);gap:10px;justify-content:center;margin:12px auto}
.lq-grid button{font-size:2.3rem;height:72px;border-radius:18px;border:0;background:#FFF8E6;cursor:pointer;box-shadow:0 3px 0 #D9BF85}
.lq-dots{text-align:center;font-size:1.6rem;letter-spacing:.4rem}
.lq-shake{animation:lqsh .35s}@keyframes lqsh{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.lq-kid{border-top:1px solid #E6EDF5;padding-top:12px;margin-top:12px}
.lq-kid h3{margin:0 0 4px;font-size:1.25rem}
.lq-bar{height:12px;background:#E6EDF5;border-radius:999px;overflow:hidden;margin:4px 0 8px}.lq-bar i{display:block;height:100%;background:#2FA894}
.lq-tags{direction:ltr;display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}
.lq-tags span{background:#EAF2FB;border-radius:999px;padding:3px 10px;font-size:1rem}
.lq-tags.bad span{background:#FFE3E8}.lq-tags.good span{background:#DDF5EC}
.lq-ar{font-size:1.35rem}
.lq-small{font-size:.9rem;color:#5A6B82}
.lq-top{display:flex;align-items:center;justify-content:space-between;gap:8px;max-width:760px;margin:0 auto}
.lq-top b{font-size:1.3rem;font-weight:800}.lq-top b span{font-size:1rem;color:#1E5AA8}
.lq-pill{background:#fff;color:#12233D;border:0;border-radius:999px;padding:6px 14px;font:inherit;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,.15);cursor:pointer;min-height:40px;display:inline-flex;align-items:center}
.lq-coin{background:#F2B134;cursor:default}
.lq-goto{display:block;width:100%;border:0;background:none;font:inherit;color:inherit;text-align:left;padding:6px 6px 0;margin:2px 0;border-radius:12px;cursor:pointer}
.lq-goto:hover,.lq-goto:focus-visible{background:#EEF4FB}
.lq-chip{display:inline-block;background:#1E5AA8;color:#fff;border-radius:999px;padding:1px 9px;font-size:.8rem;font-weight:800;margin-left:6px}
.lq-cloud{font-size:.95rem;color:#5A6B82;text-align:center;margin-top:10px}
.lq-code{font-weight:800;font-size:1.2rem;letter-spacing:.05rem;background:#FFF8E6;border-radius:12px;padding:8px 12px;text-align:center;margin:8px 0;word-break:break-all}
@media (prefers-reduced-motion:reduce){.lq-shake{animation:none}}`;
function ensureCss(){ if(document.getElementById("lqCss")) return; const s=document.createElement("style"); s.id="lqCss"; s.textContent=CSS; document.head.appendChild(s); }
function overlay(html){ ensureCss(); let o=document.getElementById("lqOv"); if(!o){ o=document.createElement("div"); o.id="lqOv"; document.body.appendChild(o); }
  o.innerHTML=`<div class="in">${html}</div>`; o.scrollTop=0; badge(); return o; }
function closeOverlay(){ const o=document.getElementById("lqOv"); if(o) o.remove(); }
function hero(color,size){ return `<svg viewBox="0 0 80 92" width="${size||80}" height="${(size||80)*1.15}" aria-hidden="true">
  <ellipse cx="40" cy="88" rx="20" ry="4" fill="rgba(0,0,0,.15)"/>
  <rect x="27" y="66" width="10" height="20" rx="5" fill="#12233D"/><rect x="43" y="66" width="10" height="20" rx="5" fill="#12233D"/>
  <rect x="20" y="40" width="40" height="32" rx="14" fill="${color}"/><rect x="20" y="54" width="40" height="6" fill="#F2B134"/>
  <circle cx="40" cy="26" r="17" fill="#E9B98E"/><path d="M23 24a17 17 0 0 1 34 0z" fill="#3B2A20"/>
  <circle cx="34" cy="28" r="2.6" fill="#12233D"/><circle cx="46" cy="28" r="2.6" fill="#12233D"/>
  <path d="M35 34q5 4 10 0" fill="none" stroke="#12233D" stroke-width="2" stroke-linecap="round"/></svg>`; }

let enterCb=null;
let onProfiles=false;
function profiles(onEnter){ onProfiles=true;
  if(onEnter) enterCb=onEnter;
  // who else is playing: a player counts as "playing now" if their save changed in the last few minutes (on any device)
  const seen=p=>{ const t=Object.keys(p.days||{}).length?p.last:0; if(!t) return `<div class="s">not played yet</div>`; const m=(Date.now()-t)/60000;
    return m<4?`<div class="s now">🟢 playing now</div>`:`<div class="s">played ${m<60?Math.max(1,Math.round(m))+" min ago":m<1440&&new Date(t).getDate()===new Date().getDate()?Math.round(m/60)+" h ago":agoText(t)}</div>`; };
  const list=state.players.map(p=>`<button class="lq-pc" data-id="${p.id}">${hero(p.color)}<div class="n">${esc(p.name)}</div>
    <div class="s">🪙 ${p.coins||0} · ${Object.keys(p.letters||{}).length}/28 letters${p.lock?" 🔒":""}</div>${seen(p)}</button>`).join("");
  overlay(`<h1>Language Quest<small lang="ar">رِحْلَةُ اللُّغَة</small></h1>
    <h2>Who's playing?</h2>
    ${state.players.length?`<div class="lq-pro">${list}</div>`:`<div class="lq-card" style="text-align:center"><div style="font-size:3rem">👋</div><p style="font-size:1.1rem;margin:4px 0">No players yet.</p><p class="lq-small">A grown-up can add players in the Parent Corner.</p></div>`}
    <div class="lq-row"><button class="lq-btn gh" id="lqParent">👨‍👩‍👧 Parents</button></div>
    <div class="lq-cloud"></div>`);
  document.querySelectorAll(".lq-pc[data-id]").forEach(b=>b.onclick=()=>choose(b.dataset.id));
  document.getElementById("lqParent").onclick=()=>askPin(parentCorner);
}
setInterval(()=>{ if(!onProfiles||document.hidden||!document.querySelector("#lqOv .lq-pro")) return; syncNow().then(()=>{ if(onProfiles&&document.querySelector("#lqOv .lq-pro")) profiles(); }); },30000);
function choose(id){ const p=state.players.find(x=>x.id===id); if(!p) return; if(p.lock&&p.lock.length) askLock(p); else enter(p); }
function enter(p){ onProfiles=false; state.cur=p.id; p.last=Date.now(); try{ sessionStorage.setItem("lq.active",p.id); }catch(e){} saveLocal(); closeOverlay(); fire(); if(enterCb) enterCb(p); }
function askLock(p){ let tries=[]; const pics=[...PICS].sort(()=>Math.random()-.5);
  overlay(`<div class="lq-card" style="max-width:380px;margin:40px auto;text-align:center">${hero(p.color,70)}<h2>Hi ${esc(p.name)}! 🔒</h2>
    <p>Tap your ${p.lock.length} secret pictures in order.</p><div class="lq-dots" id="lqDots">${p.lock.map(()=>"○").join(" ")}</div>
    <div class="lq-grid" id="lqGrid">${pics.map(e=>`<button data-e="${e}">${e}</button>`).join("")}</div>
    <div class="lq-row"><button class="lq-btn gh" id="lqNot">That's not me</button></div></div>`);
  document.getElementById("lqNot").onclick=()=>profiles();
  document.querySelectorAll("#lqGrid button").forEach(b=>b.onclick=()=>{ tries.push(b.dataset.e);
    document.getElementById("lqDots").textContent=p.lock.map((_,i)=>i<tries.length?"●":"○").join(" ");
    if(tries.length<p.lock.length) return;
    if(tries.join("")===p.lock.join("")) return enter(p);
    tries=[]; const g=document.getElementById("lqGrid"); g.classList.remove("lq-shake"); void g.offsetWidth; g.classList.add("lq-shake");
    document.getElementById("lqDots").textContent=p.lock.map(()=>"○").join(" "); });
}
function createPlayer(){ let color=COLORS[state.players.length%COLORS.length];
  const draw=()=>{ overlay(`<div class="lq-card" style="max-width:460px;margin:20px auto;text-align:center">
    <h2>Add a player</h2><div id="lqPrev">${hero(color,90)}</div>
    <input id="lqName" maxlength="14" placeholder="Your first name" autocomplete="off">
    <div class="lq-small" style="margin-top:6px">First name only, please.</div><div id="lqErr" style="color:#C2476A;font-weight:700;min-height:1.2rem;margin-top:4px"></div>
    <div class="lq-cols">${COLORS.map(c=>`<button data-c="${c}" style="background:${c}" class="${c===color?"on":""}" aria-label="color"></button>`).join("")}</div>
    <div class="lq-row"><button class="lq-btn gh" id="lqBack">Back</button><button class="lq-btn g" id="lqNext">Next ▶</button></div></div>`);
    document.querySelectorAll(".lq-cols button").forEach(b=>b.onclick=()=>{ const n=document.getElementById("lqName").value; color=b.dataset.c; draw(); document.getElementById("lqName").value=n; });
    document.getElementById("lqBack").onclick=()=>parentCorner();
    document.getElementById("lqNext").onclick=()=>{ const n=document.getElementById("lqName").value.trim(); if(!n){ document.getElementById("lqName").focus(); return; }
      const norm=x=>x.trim().toLowerCase().replace(/\s+/g," ");
      if(state.players.some(x=>norm(x.name)===norm(n))){ const i=document.getElementById("lqName"); i.style.borderColor="#E0607E"; document.getElementById("lqErr").textContent=`There's already a player called ${n}. Try adding a last initial, like "${n} B".`; i.focus(); return; }
      // the family's first player goes straight into the game; later players go back to the Parent Corner
      const first=!state.players.length, p=blankPlayer(n,color); state.players.push(p); save(); chooseLock(p,false,first?()=>enter(p):null); }; };
  draw();
}
function chooseLock(p,isNew,done){ let pick=[]; const after=()=>done?done():isNew?enter(p):parentCorner();
  const draw=()=>{ overlay(`<div class="lq-card" style="max-width:420px;margin:20px auto;text-align:center">${hero(p.color,70)}
    <h2>Pick 2 secret pictures</h2><p>They keep your hero safe. Remember the order!</p>
    <div class="lq-dots">${[0,1].map(i=>pick[i]||"○").join(" ")}</div>
    <div class="lq-grid">${PICS.map(e=>`<button data-e="${e}">${e}</button>`).join("")}</div>
    <div class="lq-row"><button class="lq-btn gh" id="lqSkip">${(isNew||!p.lock)?"No secret pictures":"Remove lock"}</button>${pick.length===2?`<button class="lq-btn g" id="lqOk">Save ✓</button>`:""}</div></div>`);
    document.querySelectorAll(".lq-grid button").forEach(b=>b.onclick=()=>{ if(pick.length<2&&!pick.includes(b.dataset.e)){ pick.push(b.dataset.e); draw(); } });
    document.getElementById("lqSkip").onclick=()=>{ p.lock=null; save(); after(); };
    const ok=document.getElementById("lqOk"); if(ok) ok.onclick=()=>{ p.lock=pick.slice(); save(); after(); }; };
  draw();
}

/* ---------------- parent PIN + Parent Corner ---------------- */
function askPin(next){ onProfiles=false;
  if(!state.pin){ let first=null;
    const setP=(msg)=>{ overlay(`<div class="lq-card" style="max-width:380px;margin:40px auto;text-align:center"><h2>${first?"Type it again":"Create a parent PIN"}</h2>
      <p class="lq-small">${msg||"4 digits. Grown-ups use it to open the Parent Corner."}</p>
      <input id="lqPin" inputmode="numeric" maxlength="4" style="text-align:center;letter-spacing:.5rem" autocomplete="off">
      <div class="lq-row"><button class="lq-btn gh" id="lqC">Cancel</button><button class="lq-btn g" id="lqO">OK</button></div></div>`);
      const i=document.getElementById("lqPin"); setTimeout(()=>i.focus(),50);
      const go=()=>{ const v=i.value.trim(); if(!/^\d{4}$/.test(v)) return setP("Please use exactly 4 digits.");
        if(!first){ first=v; return setP(); } if(v!==first){ first=null; return setP("Those didn't match. Let's try again."); }
        state.pin=v; state.pinUpd=Date.now(); save(); next(); };
      document.getElementById("lqO").onclick=go; i.onkeydown=e=>{ if(e.key==="Enter") go(); }; document.getElementById("lqC").onclick=()=>profiles(); };
    return setP(); }
  overlay(`<div class="lq-card" style="max-width:380px;margin:40px auto;text-align:center"><h2>Parent PIN</h2>
    <input id="lqPin" inputmode="numeric" maxlength="4" type="password" style="text-align:center;letter-spacing:.5rem" autocomplete="off">
    <p class="lq-small" id="lqMsg"> </p><div class="lq-row"><button class="lq-btn gh" id="lqC">Cancel</button><button class="lq-btn g" id="lqO">Open</button></div></div>`);
  const i=document.getElementById("lqPin"); setTimeout(()=>i.focus(),50);
  const go=()=>{ if(i.value.trim()===state.pin) next(); else { document.getElementById("lqMsg").textContent="That's not it. Try again."; i.value=""; } };
  document.getElementById("lqO").onclick=go; i.onkeydown=e=>{ if(e.key==="Enter") go(); }; document.getElementById("lqC").onclick=()=>profiles();
}
const ALPH=[..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"];
const MARK_ORDER=["Fatha","Kasra","Damma","Sukun","Shadda","Tanween fath","Tanween kasr","Tanween damm"];
const accOf=e=>e&&(e.r+e.w)?e.r/(e.r+e.w):null;
const level=e=>{ const a=accOf(e); if(a===null) return "none"; if(e.r+e.w<3) return "new"; return a>=0.85?"good":a>=0.6?"ok":"bad"; };
function agoText(t){ if(!t) return "never"; const d=Math.round((Date.now()-t)/86400000); return d===0?"today":d===1?"yesterday":d+" days ago"; }
function kidSummary(p){
  const st=p.stats||{}; const L=Object.values(st.letters||{}), M=Object.values(st.marks||{}), W=Object.values(st.words||{});
  const all=L.concat(M,W); const tot=all.reduce((s,e)=>s+e.r+e.w,0), right=all.reduce((s,e)=>s+e.r,0);
  const weak=[...Object.entries(st.letters||{}).filter(([k,e])=>level(e)==="bad").map(([k])=>`<bdi class="lq-ar" lang="ar">${esc(k)}</bdi>`),
              ...Object.entries(st.marks||{}).filter(([k,e])=>level(e)==="bad").map(([k])=>esc(k))].slice(0,6);
  const caught=Object.keys(p.letters||{}).length, camps=Object.keys(p.camps||{}).length, pools=Object.keys(p.falls||{}).length, friends=Object.keys(p.friends||{}).length, traced=Object.keys(p.trace||{}).length, stalls=Object.keys(p.souq||{}).length, tales=Object.keys(p.harbor||{}).length, abcN=Object.keys(p.abc||{}).length;
  return `<div class="lq-kid"><h3>${esc(p.name)} <span class="lq-small">🪙 ${p.coins||0} · last played ${agoText(Object.keys(p.days||{}).length?p.last:0)}</span></h3>
    <div class="lq-small">Alphabet School <b>${abcN}/28</b> met · Letter Dunes <b>${caught}/28</b> letters, <b>${camps}/7</b> camps · Sound Falls <b>${pools}/8</b> pools · Souq <b>${stalls}/5</b> stalls · Story Harbor <b>${tales}/5</b> stories · Letter Friends <b>${friends}/28</b> · Tracing <b>${traced}/28</b> · Overall <b>${tot?Math.round(right/tot*100)+"% right":"no answers yet"}</b></div>
    <div class="lq-bar"><i style="width:${(caught/28*50+pools/8*50)}%"></i></div>
    <div class="lq-small">Needs help with</div><div class="lq-tags bad">${weak.length?weak.map(x=>`<span>${x}</span>`).join(""):"<span>Nothing flagged yet 👍</span>"}</div>
    <div class="lq-row" style="justify-content:flex-start;margin-top:4px"><button class="lq-btn" data-detail="${p.id}">See details ▶</button></div></div>`;
}
function kidDetail(id){ const p=state.players.find(x=>x.id===id); if(!p) return parentCorner(); kidDetailFor(p,parentCorner,true); }
function kidDetailFor(p,back,family){ const st=p.stats||{};
  const LS=st.letters||{}, MS=st.marks||{}, WS=st.words||{};
  const COL={good:"#C9F0E3",ok:"#FFF0C2",bad:"#FFD6DE",new:"#EAF2FB",none:"#F4F6F8"};
  const cell=ch=>{ const e=LS[ch], lv=level(e), got=(p.letters||{})[ch];
    return `<div style="background:${COL[lv]};border-radius:12px;padding:4px 2px;text-align:center;border:2px solid ${got?"#2FA894":"transparent"}">
      <div class="lq-ar" lang="ar" style="font-size:1.7rem;line-height:1.3">${ch}</div><div class="lq-small" dir="ltr" style="font-size:.75rem">${e?`${e.r}✓ ${e.w}✗`:"—"}</div></div>`; };
  const markRow=m=>{ const e=MS[m]; const a=accOf(e); return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <div style="width:120px">${esc(m)}</div><div class="lq-bar" style="flex:1;margin:0"><i style="width:${a===null?0:Math.round(a*100)}%;background:${a===null?"#ccc":a>=.85?"#2FA894":a>=.6?"#F2B134":"#E0607E"}"></i></div>
      <div class="lq-small" style="width:90px;text-align:right">${e?`${e.r} right · ${e.w} wrong`:"not yet"}</div></div>`; };
  const words=Object.entries(WS).sort((a,b)=>(b[1].w-a[1].w)||(b[1].r-a[1].r));
  const mix=Object.entries(st.mix||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const recent=(st.recent||[]).slice(0,12);
  const ZN={letters:"Letter Dunes",falls:"Sound Falls",souq:"The Souq",harbor:"Story Harbor",alphabet:"Alphabet School",map:"Map","language-quest":"Map"};
  const trail=(p.trail||[]).slice(-15).reverse(), errs=(p.errs||[]).slice().reverse();
  overlay(`<h1>${esc(p.name)}</h1>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">Letters</h2>
      <p class="lq-small" style="margin:0 0 8px">Green = getting it right · yellow = getting there · pink = needs help · blue = just started · grey = not tried. A green outline means the letter has been caught in the Letter Dunes.</p>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;direction:rtl">${ALPH.map(cell).join("")}</div></div>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">Vowel marks (Sound Falls)</h2>${MARK_ORDER.map(markRow).join("")}</div>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">Reading words</h2>
      ${words.length?`<div class="lq-tags" style="direction:ltr">${words.map(([w,e])=>`<span style="background:${COL[level(e)]}"><bdi class="lq-ar" lang="ar">${esc(w)}</bdi> <span dir="ltr">${e.r}✓ ${e.w}✗</span></span>`).join("")}</div>`:`<p class="lq-small">Not tried yet. Words appear here after the Word River in Sound Falls.</p>`}</div>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">Mix-ups</h2>
      ${mix.length?`<div class="lq-tags bad">${mix.map(([k,n])=>{ const [a,b]=k.split("→"); const ar=t=>/[\u0600-\u06FF]/.test(t)?`<bdi class="lq-ar" lang="ar">${esc(t)}</bdi>`:`<b>${esc(t)}</b>`; return `<span>wanted ${ar(a)}, picked ${ar(b)} <span dir="ltr">(${n}×)</span></span>`; }).join("")}</div>`:`<p class="lq-small">No mix-ups yet.</p>`}</div>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">Most recent mistakes</h2>
      ${recent.length?recent.map(r=>`<div class="lq-small" style="margin:3px 0">${agoText(r.t)} · ${ZN[r.z]||esc(r.z)} · wanted <bdi style="font-size:1.15rem">${esc(r.a)}</bdi>${r.b?` · picked <bdi style="font-size:1.15rem">${esc(r.b)}</bdi>`:""}</div>`).join(""):`<p class="lq-small">None yet.</p>`}</div>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">Where they have been</h2>
      <p class="lq-small" style="margin:0 0 6px">The last screens opened, newest first. Useful if someone says they got stuck.</p>
      ${trail.length?trail.map(r=>`<div class="lq-small" style="margin:3px 0">${agoText(r.t)} · ${ZN[r.z]||esc(r.z)} · <bdi>${esc(r.s)}</bdi></div>`).join(""):`<p class="lq-small">Nothing recorded yet.</p>`}
      ${errs.length?`<h2 style="text-align:left;font-size:1.1rem">Problems</h2>${errs.map(r=>`<div class="lq-small" style="margin:3px 0;color:#B23A56">${agoText(r.t)} · ${ZN[r.z]||esc(r.z)} · <bdi>${esc(r.s||"")}</bdi> · ${esc(r.m)} <span dir="ltr">${esc(r.at||"")} (${esc(r.v||"")})</span></div>`).join("")}`:""}</div>
    <div class="lq-row">${family?`<button class="lq-btn gh" data-lock="${p.id}">🔒 Secret pictures</button>${state.cls?"":`<button class="lq-btn gh" data-del="${p.id}">Remove player</button>`}`:""}<button class="lq-btn" id="lqBackPC">◀ Back</button></div>`);
  document.getElementById("lqBackPC").onclick=back;
  wireKidButtons();
}
function wireKidButtons(){
  document.querySelectorAll("[data-detail]").forEach(b=>b.onclick=()=>kidDetail(b.dataset.detail));
  document.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.lock); if(p) chooseLock(p,false); });
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.del); if(!p) return;
    if(confirm(`Remove ${p.name} and all their progress?`)){ state.deleted[p.id]=Date.now(); state.players=state.players.filter(x=>x.id!==p.id); if(state.cur===p.id) state.cur=null; save(); parentCorner(); } });
}
function parentCorner(){
  const kids=state.players.length?state.players.map(kidSummary).join(""):`<p class="lq-small">No players yet.</p>`;
  overlay(`<h1>Parent Corner</h1>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">How the kids are doing</h2>${kids}${state.cls?`<p class="lq-small" style="margin-top:12px">🍎 You're in <b>${esc(state.cls.name)}</b>${state.cls.teacher?" with "+esc(state.cls.teacher):""}. Your teacher adds and removes students.</p>`:`<div class="lq-row" style="justify-content:flex-start"><button class="lq-btn g" id="lqAddKid">➕ Add a player</button></div>`}</div>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">☁️ Online save</h2>
      ${cloud.code?`<p>This device saves online with your family code. Type it on another device to share the same players:</p><div class="lq-code">${esc(cloud.code)}</div>
        <div class="lq-row" style="justify-content:flex-start"><button class="lq-btn gh" id="lqCopy">Copy code</button><button class="lq-btn gh" id="lqOff">Stop saving online on this device</button></div>`
      :`<p>Turn this on so progress is backed up and the same players appear on every device in your home.</p>
        <div class="lq-row" style="justify-content:flex-start"><button class="lq-btn g" id="lqOn">Turn on online save</button></div>
        <p class="lq-small" style="margin-top:12px">Already have a family code from another device?</p>
        <input id="lqJoin" placeholder="e.g. FALCON-OLIVE-RIVER-MOON-17" autocomplete="off" autocapitalize="characters">
        <div class="lq-row" style="justify-content:flex-start"><button class="lq-btn" id="lqJoinBtn">Join</button></div>`}
      <div class="lq-cloud" style="text-align:left"></div></div>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">Parent PIN</h2><div class="lq-row" style="justify-content:flex-start"><button class="lq-btn gh" id="lqChPin">Change PIN</button></div></div>
    <div class="lq-row"><button class="lq-btn" id="lqDone">◀ Back to players</button></div>`);
  document.getElementById("lqDone").onclick=()=>profiles();
  document.getElementById("lqChPin").onclick=()=>{ state.pin=null; askPin(parentCorner); };
  wireKidButtons();
  const ak=document.getElementById("lqAddKid"); if(ak) ak.onclick=()=>createPlayer();
  const on=document.getElementById("lqOn"); if(on) on.onclick=async()=>{ cloud.code=genCode(); try{ localStorage.setItem(FAM_KEY,cloud.code); }catch(e){} cloud.status=""; parentCorner(); await syncNow(); parentCorner(); };
  const off=document.getElementById("lqOff"); if(off) off.onclick=()=>{ if(!confirm("Stop saving online on this device? Players stay on this device.")) return; cloud.code=null; try{ localStorage.removeItem(FAM_KEY); }catch(e){} parentCorner(); };
  const cp=document.getElementById("lqCopy"); if(cp) cp.onclick=async()=>{ try{ await navigator.clipboard.writeText(cloud.code); cp.textContent="Copied!"; }catch(e){ prompt("Copy this code:",cloud.code); } };
  const jb=document.getElementById("lqJoinBtn"); if(jb) jb.onclick=async()=>{ const v=document.getElementById("lqJoin").value.trim().toUpperCase(); if(v.replace(/[^A-Z0-9]/g,"").length<12){ alert("That code looks too short."); return; }
    jb.textContent="Joining…"; try{ const r=await cloudGet(v); if(!r){ alert("No save found for that code. Check the spelling."); jb.textContent="Join"; return; }
      cloud.code=v; try{ localStorage.setItem(FAM_KEY,v); }catch(e){} merge(r,null); await syncNow(); parentCorner(); } catch(e){ alert("Couldn't reach the internet. Try again in a moment."); jb.textContent="Join"; } };
}

/* ---------------- public API ---------------- */
function cur(){ return state.players.find(p=>p.id===state.cur)||null; }
/* ---------------- "❓" read the instructions aloud ----------------
   Adds a ❓ button next to the sound button on every page. It reads the instructions on the current screen aloud in English,
   with the device's English voice, for children who cannot read them yet. A page can supply its own text with window.LQ_HELP. */
function helpText(){
  if(typeof window.LQ_HELP==="function"){ try{ const t=window.LQ_HELP(); if(t) return t; }catch(e){} }
  const app=document.getElementById("app"); if(!app) return "";
  const pick=sel=>{ const e=app.querySelector(sel); return e?e.innerText:""; };
  const parts=[pick("h2"), pick(".talk")||pick(".q")||pick(".panel p.muted")||pick(".panel p")];
  return parts.filter(Boolean).join(". ");
}
function readHelp(){ if(!("speechSynthesis" in window)) return;
  const t=helpText().replace(/[\u0600-\u06FF\u0640]+/g," ").replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu," ").replace(/_{2,}/g,"blank").replace(/\s+/g," ").trim();
  if(!t) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang="en-US"; u.rate=0.95;
  const v=speechSynthesis.getVoices().find(v=>/^en(-|_)(US|GB)/i.test(v.lang)&&/Samantha|Karen|Daniel|Google|Female|Natural/i.test(v.name))||speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang)); if(v) u.voice=v;
  speechSynthesis.speak(u); }
function addHelpButton(){ if(document.getElementById("lqHelp")) return; const snd=document.getElementById("snd")||document.getElementById("soundBtn"); if(!snd) return;
  const b=document.createElement("button"); b.id="lqHelp"; b.className="pill"; b.type="button"; b.innerHTML='❓ <span class="lbl">Help</span>'; b.setAttribute("aria-label","Read the instructions aloud");
  b.onclick=e=>{ e.stopPropagation(); readHelp(); }; snd.parentNode.insertBefore(b,snd); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",addHelpButton); else addHelpButton();
/* ---------------- drawn hero + costumes ----------------
   drawHero paints the player on any 2D canvas with the feet at (0,0), about 100 units tall, wearing p.wear.
   WEAR ids are saved in each player's wardrobe (p.own, p.wear), so never reuse or rename them. */
const COLOR_NAMES=["أَزْرَق","وَرْدِيّ","أَخْضَر","بَنَفْسَجِيّ","بُرْتُقَالِيّ","أَحْمَر","فَيْرُوزِيّ","زَيْتُونِيّ"];
const COLOR_EN=["Blue","Pink","Green","Purple","Orange","Red","Turquoise","Olive"];
const WEAR=[
 {id:"hat",slot:"head",ar:"قُبَّعَة",en:"Hat",price:40}, {id:"flower",slot:"head",ar:"زَهْرَة",en:"Flower",price:40},
 {id:"tarboosh",slot:"head",ar:"طَرْبُوش",en:"Tarboosh",price:80}, {id:"crown",slot:"head",ar:"تَاج",en:"Crown",price:150},
 {id:"glasses",slot:"face",ar:"نَظَّارَة",en:"Glasses",price:50}, {id:"shades",slot:"face",ar:"نَظَّارَةٌ شَمْسِيَّة",en:"Sunglasses",price:70},
 {id:"scarf",slot:"back",ar:"وِشَاح",en:"Scarf",price:60}, {id:"bag",slot:"back",ar:"حَقِيبَة",en:"Backpack",price:80}, {id:"cape",slot:"back",ar:"رِدَاء",en:"Cape",price:120}];
function drawHero(c,p,o){ o=o||{}; const wear=o.wear||(p&&p.wear)||{}, t=o.time||0, fx=(o.face||0)*3, sw=o.moving?Math.sin(t*12)*5:0;
  const R=(x,y,w,h,r)=>{ c.beginPath(); c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h); }, dot=(x,y,r,f)=>{ c.fillStyle=f; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); };
  if(wear.back==="cape"){ c.fillStyle="#C8402F"; c.beginPath(); c.moveTo(-15,-48); c.lineTo(15,-48); c.lineTo(24,-12); c.quadraticCurveTo(0,-5,-24,-12); c.closePath(); c.fill(); }
  if(wear.back==="bag"){ c.fillStyle="#8A5A33"; R(-23,-46,12,24,5); c.fill(); R(11,-46,12,24,5); c.fill(); }
  c.fillStyle="#12233D"; R(-11+sw,-18,8,18,4); c.fill(); R(3-sw,-18,8,18,4); c.fill();                                  // legs
  c.fillStyle=(p&&p.color)||"#1E5AA8"; R(-16,-50,32,36,12); c.fill(); c.fillStyle="#F2B134"; R(-16,-36,32,6,3); c.fill();   // body and belt
  if(wear.back==="bag"){ c.strokeStyle="#6B4423"; c.lineWidth=4; c.lineCap="round"; c.beginPath(); c.moveTo(-10,-48); c.lineTo(-10,-38); c.moveTo(10,-48); c.lineTo(10,-38); c.stroke(); }
  dot(0,-66,18,"#E9B98E"); c.fillStyle="#3B2A20"; c.beginPath(); c.arc(0,-72,18,Math.PI,0); c.fill();               // head and hair
  dot(-6+fx,-65,2.6,"#12233D"); dot(6+fx,-65,2.6,"#12233D");
  if(wear.back==="cape") dot(0,-48,4,"#F2B134");
  if(wear.back==="scarf"){ c.fillStyle="#2FA894"; R(-15,-52,30,8,4); c.fill(); R(5,-49,8,20,3); c.fill(); c.fillStyle="#fff"; c.fillRect(5,-35,8,3); }
  if(wear.face==="glasses"){ c.strokeStyle="#7A5230"; c.lineWidth=2; for(const k of [-6,6]){ c.beginPath(); c.arc(k+fx,-65,5.6,0,7); c.stroke(); } }
  if(wear.face==="shades"){ c.fillStyle="#12233D"; R(-13+fx,-70,11,9,3); c.fill(); R(2+fx,-70,11,9,3); c.fill(); c.fillRect(-3+fx,-68,6,2); }
  if(wear.head==="hat"){ c.fillStyle="#C9A66B"; c.beginPath(); c.ellipse(0,-82,26,6,0,0,7); c.fill(); c.beginPath(); c.arc(0,-83,14,Math.PI,0); c.fill(); c.fillStyle="#8A5A33"; c.fillRect(-14,-87,28,4); }
  if(wear.head==="flower"){ for(let i=0;i<5;i++){ const a=i*Math.PI*0.4; dot(13+Math.cos(a)*5,-84+Math.sin(a)*5,3.6,"#F7A8C4"); } dot(13,-84,3,"#F2B134"); }
  if(wear.head==="tarboosh"){ c.fillStyle="#C8402F"; c.beginPath(); c.moveTo(-13,-82); c.lineTo(13,-82); c.lineTo(10,-102); c.lineTo(-10,-102); c.closePath(); c.fill();
    c.strokeStyle="#12233D"; c.lineWidth=2; c.beginPath(); c.moveTo(0,-102); c.lineTo(12,-99); c.lineTo(13,-88); c.stroke(); }
  if(wear.head==="crown"){ c.fillStyle="#F2B134"; c.beginPath(); c.moveTo(-14,-82); c.lineTo(-14,-98); c.lineTo(-7,-90); c.lineTo(0,-101); c.lineTo(7,-90); c.lineTo(14,-98); c.lineTo(14,-82); c.closePath(); c.fill();
    dot(0,-87,2.6,"#E0607E"); dot(-8,-86,2,"#1E5AA8"); dot(8,-86,2,"#1E5AA8"); }
}
/* ---------------- "Me": the player's own page ---------------- */
function mePage(){
  const p=cur(); if(!p) return; mark("Me page"); const n=o=>Object.keys(o||{}).length, sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
  const L=n(p.letters), rows=[["🏫 Alphabet letters met",n(p.abc),28,"alphabet/"],["⛺ Letters caught",L,28,"letters/"],["✏️ Letters traced",n(p.trace),28,"letters/"],["💦 Sound Falls pools",n(p.falls),8,"falls/"],["🛍️ Souq stalls",n(p.souq),5,"souq/"],["⛵ Stories finished",n(p.harbor),5,"harbor/"],["📒 Letter Friends",n(p.friends),28,"#album"],["🧺 Grandmother's basket",n(p.basket),28,"#basket"],["⛲ Sayings found",n(p.well&&p.well.got),26,"#fountain"]];   // last item: where tapping the row goes
  const stars=sum(p.camps)+sum(p.falls)+sum(p.souq)+sum(p.harbor)+sum(p.abcStars), days=n(p.days), dr=p.dr||{}, td=dr[today()]||0, best=p.best||{n:0};
  const right=["letters","marks","words"].reduce((a,k)=>a+Object.values((p.stats||{})[k]||{}).reduce((x,e)=>x+(e.r||0),0),0);
  const week=[]; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*864e5); week.push([["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()],dr[d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()]||0]); }
  const top=Math.max(1,...week.map(w=>w[1]));
  // next step in the Letter Dunes: its seven camps hold four letters each, in alphabet order
  const NAMES=["One","Two","Three","Four","Five","Six","Seven"], ALPH=[..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"]; let dunes="";
  for(let c=0;c<7&&!dunes;c++){ const got=ALPH.slice(c*4,c*4+4).filter(ch=>(p.letters||{})[ch]).length;
    if(got<4) dunes=`Next: learn ${4-got} more letter${4-got===1?"":"s"} at Camp ${NAMES[c]} in the Letter Dunes ⛺`;
    else if(!(p.camps||{})[c]) dunes=`Next: beat the sand monster at Camp ${NAMES[c]} in the Letter Dunes 🦂`; }
  const cheer=td>0&&td>=best.n?"🎉 Today is your best day ever! Amazing work."
    :dunes?dunes
    :n(p.falls)<8?"Open the next pool at Sound Falls."
    :n(p.souq)<5?"Help the next shopkeeper in the Souq."
    :n(p.harbor)<5?"A new story is waiting at Story Harbor."
    :n(p.friends)<28?`${28-n(p.friends)} Letter Friends are still hiding on the map.`
    :"You have done everything! Play again to earn more stars.";
  overlay(`<div class="lq-top"><button class="lq-pill" id="lqMeOk">← Map</button><b>My page <span>${esc(p.name)}</span></b><span class="lq-pill lq-coin">🪙 ${p.coins||0}</span></div>
    <div class="lq-card" style="max-width:520px;margin:10px auto;text-align:center">
    <canvas id="lqMe" width="260" height="300" style="width:130px;height:150px"></canvas>
    <div class="lq-row" style="flex-wrap:wrap;margin:0 0 10px"><button class="lq-btn" id="lqMeWear">🧵 Colours and clothes</button><button class="lq-btn gh" id="lqMeLock">🔒 My secret pictures</button></div>
    <h2 style="margin:0">${esc(p.name)}</h2>
    <p style="margin:4px 0"><b>🪙 ${p.coins||0}</b> · <b>★ ${stars}</b> of 87 stars · played on <b>${days}</b> day${days===1?"":"s"}</p>
    <p style="margin:6px 0;font-weight:800;color:#1E5AA8">${cheer}</p>
    <p class="lq-small" style="margin:8px 0 0">Tap a row to go straight there.</p>
    <div style="text-align:left">${rows.map(r=>`<button class="lq-goto" data-go="${r[3]}"><div class="lq-small" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>${r[0]}</span><span><b>${r[1]} / ${r[2]}</b> <span class="lq-chip">Go ▶</span></span></div><div class="lq-bar"><i style="width:${Math.min(100,r[1]/r[2]*100)}%"></i></div></button>`).join("")}</div>
    <h2 style="font-size:1.15rem;margin:16px 0 2px">My right answers this week</h2>
    <div style="display:flex;gap:6px;align-items:flex-end;justify-content:center;height:96px">${week.map((w,i)=>`<div style="width:34px;text-align:center"><div class="lq-small">${w[1]||""}</div><div style="height:${Math.round(w[1]/top*60)+4}px;border-radius:6px 6px 0 0;background:${i===6?"#F2B134":"#2FA894"}"></div><div class="lq-small">${w[0]}</div></div>`).join("")}</div>
    <p class="lq-small" style="margin:4px 0">Today: <b>${td}</b> · My best day: <b>${best.n}</b> · All time: <b>${right}</b></p></div>`);
  const cv=document.getElementById("lqMe"), c=cv.getContext("2d"); c.translate(130,292); c.scale(2.6,2.6); drawHero(c,p);
  document.getElementById("lqMeOk").onclick=()=>{ closeOverlay(); fire(); };
  document.getElementById("lqMeLock").onclick=()=>chooseLock(p,false,mePage);
  const root=(location.pathname.match(/^(.*\/language-quest\/)/)||[])[1]||"./";
  document.querySelectorAll(".lq-goto").forEach(b=>b.onclick=()=>{ const go=b.dataset.go;
    if(go[0]!=="#") return void(location.href=root+go);
    closeOverlay(); fire(); dispatchEvent(new CustomEvent("lq:goto",{detail:go.slice(1)})); });      // the album and the fountain are on the map, which listens for this
  document.getElementById("lqMeWear").onclick=()=>{ location.href=((location.pathname.match(/^(.*\/language-quest\/)/)||[])[1]||"./")+"souq/?tailor=1"; };
}
window.LQ={
  player:cur, profiles, me:mePage, mark,
  /* after an answer, wait for the child to tap Next instead of moving on by itself (added to the screen's row of buttons) */
  nextButton(go,label){ const app=document.getElementById("app"); if(!app) return go(); const row=app.querySelector(".actions"), b=document.createElement("button");
    b.className="btn go"; b.type="button"; b.textContent=label||"Next ▶"; b.onclick=()=>{ b.remove(); go(); }; (row||app).appendChild(b); return b; },
  /* how loud the spoken Arabic is, 0 to 1, remembered on the device (set from the map's sound menu) */
  voiceVol(){ try{ const v=parseFloat(localStorage.getItem("languagequest.voice")); return isNaN(v)?1:Math.max(0,Math.min(1,v)); }catch(e){ return 1; } },
  setVoiceVol(v){ try{ localStorage.setItem("languagequest.voice",String(Math.max(0,Math.min(1,+v||0)))); }catch(e){} }, drawHero, WEAR, COLOR_NAMES, COLOR_EN,
  /* the player who is signed in on this tab right now (kept while moving between the map and the zones) */
  sessionPlayer(){ let id=null; try{ id=sessionStorage.getItem("lq.active"); }catch(e){} const p=cur(); return p&&p.id===id?p:null; },
  leave(){ state.cur=null; try{ sessionStorage.removeItem("lq.active"); }catch(e){} saveLocal(); fire(); }, parentCorner:()=>askPin(parentCorner), onChange:f=>listeners.push(f),
  update(fn){ const p=cur(); if(!p) return; fn(p); p.last=Date.now(); p.days=p.days||{}; p.days[today()]=1; save(); },
  addCoins(n){ const p=cur(); if(!p) return; p.coins=(p.coins||0)+n; save(); },
  record, syncNow, hero, esc,
  cloudApi:{ get:cloudGet, put:cloudPut, genCode, famId },
  report:{ summary:kidSummary, detail:kidDetailFor, close:closeOverlay, css:ensureCss },
  COLORS, blankPlayer
};
/* ?family=CODE link joins a household once */
try{ const q=(new URLSearchParams(location.search).get("family")||"").toUpperCase();
  if(q&&q!==cloud.code&&(!cloud.code||confirm("Switch this device to the family from this link? Players from the old family stay saved online under the old code."))){
    if(cloud.code){ state.players=[]; state.deleted={}; state.cur=null; state.pin=null; state.cls=null; }
    cloud.code=q; localStorage.setItem(FAM_KEY,q); saveLocal(); }
  if(q){ const u=new URLSearchParams(location.search); u.delete("family"); history.replaceState(null,"",location.pathname+(u.toString()?"?"+u:"")+location.hash); } }catch(e){}
if(cloud.code) syncNow();

/* ---------------- updates: like Math Quest, the game notices a new version and reloads itself ----------------
   Every page carries window.LQ_VER; language-quest/version.json holds the newest one. */
(function(){
  const VER=window.LQ_VER||"dev", ROOT=(location.pathname.match(/^(.*\/language-quest\/)/)||[])[1]||"./";
  const EVERY=5*60e3, AWAY_QUIET=15*60e3; let pending=null, busy=false;
  const onMap=()=>/\/language-quest\/(index\.html)?$/.test(location.pathname);
  const safeNow=()=>onMap()&&!document.getElementById("lqOv")&&!document.getElementById("start")&&!document.hidden&&!(document.getElementById("card")||{classList:{contains:()=>false}}).classList.contains("show");
  async function latest(){ if(location.protocol==="file:") return null; try{ const r=await fetch(ROOT+"version.json?t="+Date.now(),{cache:"no-store"}); if(!r.ok) return null; const j=await r.json(); return j&&j.v?String(j.v):null; }catch(e){ return null; } }
  function triedRecently(v){ try{ const t=JSON.parse(localStorage.getItem("lqUpdTry")||"null"); return t&&t.v===v&&Date.now()-t.t<20*60e3; }catch(e){ return false; } }
  async function check(){ const v=await latest(); if(v&&v!==VER&&!triedRecently(v)){ pending=v; return true; } return false; }
  function splash(msg){ const d=document.createElement("div"); d.style.cssText="position:fixed;inset:0;z-index:100;background:linear-gradient(180deg,#8FC6F0,#F7DFA8);display:flex;align-items:center;justify-content:center;font-family:'Baloo Bhaijaan 2',system-ui,sans-serif;color:#12233D;text-align:center";
    d.innerHTML=`<div><div style="font-size:3rem">✨</div><div style="font-size:1.5rem;font-weight:800">${msg}</div><div style="color:#1E5AA8;font-size:1.3rem" lang="ar">رِحْلَةُ اللُّغَة</div></div>`; document.body.appendChild(d); }
  async function reload(msg){ if(busy) return; busy=true; try{ saveLocal(); }catch(e){}
    splash(msg||"Updating Language Quest…");
    try{ if(cloud.code){ clearTimeout(cloud.timer); await Promise.race([syncNow(),new Promise(r=>setTimeout(r,4000))]); } }catch(e){}
    try{ if(pending) localStorage.setItem("lqUpdTry",JSON.stringify({v:pending,t:Date.now()})); sessionStorage.setItem("lq.updated","1"); }catch(e){}
    const q=new URLSearchParams(location.search); q.set("r",Date.now()); location.replace(location.pathname+"?"+q.toString()+location.hash); }
  function banner(){ if(document.getElementById("lqUpd")) return; const b=document.createElement("button"); b.id="lqUpd"; b.type="button";
    b.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:60;border:0;border-radius:999px;padding:12px 20px;font:800 1.05rem 'Baloo Bhaijaan 2',system-ui,sans-serif;background:#F2B134;color:#12233D;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer";
    b.innerHTML="✨ New stuff in Language Quest! <u>Tap to update</u>"; b.onclick=()=>reload(); document.body.appendChild(b); }
  function toast(t){ const d=document.createElement("div"); d.textContent=t; d.style.cssText="position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 70px);z-index:60;background:#fff;color:#12233D;border-radius:999px;padding:8px 16px;font:800 1rem 'Baloo Bhaijaan 2',system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.2)"; document.body.appendChild(d); setTimeout(()=>d.remove(),2600); }
  // just arrived on a page (nothing to lose yet): if it's out of date, update right away
  (async()=>{ try{ if(sessionStorage.getItem("lq.updated")){ sessionStorage.removeItem("lq.updated"); const q=new URLSearchParams(location.search); if(q.has("r")){ q.delete("r"); history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:"")+location.hash); } setTimeout(()=>toast("✨ Language Quest is up to date!"),600); return; } }catch(e){}
    if(await check()) reload(); })();
  // while playing: check every few minutes and tell the player with a button they can tap; never reload under them mid-play
  setInterval(async()=>{ if(document.hidden||busy) return; if(pending||await check()) banner(); },EVERY);
  document.addEventListener("visibilitychange",async()=>{ if(document.hidden){ try{ localStorage.setItem("lqHiddenAt",String(Date.now())); }catch(e){} return; }
    let hid=0; try{ hid=+localStorage.getItem("lqHiddenAt")||0; }catch(e){} const away=Date.now()-hid;
    if(await check()){ (away>=AWAY_QUIET&&safeNow())?reload():banner(); } });
  window.LQ_UPDATE={check,reload,version:VER};
})();
})();
