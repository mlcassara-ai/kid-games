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
let state={v:1, players:[], cur:null, pin:null, pinUpd:0, deleted:{}};
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
const payload=()=>({v:1,players:state.players,pin:state.pin||null,pinUpd:state.pinUpd||0,deleted:state.deleted||{},upd:Date.now()});
function merge(remote,keepId){
  const del=Object.assign({},remote.deleted||{},state.deleted||{}); const map=new Map(), order=[];
  (remote.players||[]).forEach(p=>{ map.set(p.id,p); order.push(p.id); });
  state.players.forEach(p=>{ const r=map.get(p.id); if(!r){ map.set(p.id,p); order.push(p.id); } else if(p.id===keepId||(p.upd||0)>(r.upd||0)) map.set(p.id,p); });
  const sig=()=>JSON.stringify(state.players,(k,v)=>k==="upd"?undefined:v); const before=sig();
  state.players=order.map(id=>map.get(id)).filter(p=>!(del[p.id]&&del[p.id]>=(p.upd||0))); state.deleted=del;
  if(remote.pin&&(!state.pin||(remote.pinUpd||0)>(state.pinUpd||0))){ state.pin=remote.pin; state.pinUpd=remote.pinUpd||0; }
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
const listeners=[]; function fire(){ listeners.forEach(f=>{ try{ f(); }catch(e){} }); }

/* ---------------- stats (for the parent/teacher view) ---------------- */
function today(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function record(kind,key,ok,confusedWith){
  const p=cur(); if(!p) return; const st=p.stats=p.stats||{letters:{},words:{},mix:{}}; const bucket=st[kind]=st[kind]||{};
  const e=bucket[key]=bucket[key]||{r:0,w:0}; ok?e.r++:e.w++;
  if(!ok&&confusedWith){ const k=key+"→"+confusedWith; st.mix[k]=(st.mix[k]||0)+1; }
  p.last=Date.now(); p.days=p.days||{}; p.days[today()]=1; save();
}

/* ---------------- UI ---------------- */
const CSS=`
#lqOv{position:fixed;inset:0;z-index:50;background:linear-gradient(180deg,#8FC6F0,#F7DFA8);overflow:auto;font-family:"Baloo Bhaijaan 2","Geeza Pro",system-ui,sans-serif;color:#12233D;-webkit-user-select:none;user-select:none}
#lqOv .in{max-width:760px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 16px calc(env(safe-area-inset-bottom,0px) + 28px)}
#lqOv h1{margin:0;font-size:2rem;text-align:center;font-weight:800}
#lqOv h1 small{display:block;font-size:1.3rem;color:#1E5AA8;font-weight:500}
#lqOv h2{margin:14px 0 8px;font-size:1.4rem;text-align:center}
.lq-pro{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:10px}
.lq-pc{background:#fff;border:0;border-radius:22px;padding:12px 8px;cursor:pointer;font:inherit;color:#12233D;box-shadow:0 4px 14px rgba(70,50,10,.18);text-align:center}
.lq-pc svg{width:80px;height:92px}
.lq-pc .n{font-weight:800;font-size:1.15rem}.lq-pc .s{font-size:.9rem;color:#5A6B82}
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
function profiles(onEnter){
  if(onEnter) enterCb=onEnter;
  const list=state.players.map(p=>`<button class="lq-pc" data-id="${p.id}">${hero(p.color)}<div class="n">${esc(p.name)}</div>
    <div class="s">🪙 ${p.coins||0} · ${Object.keys(p.letters||{}).length}/28 letters${p.lock?" 🔒":""}</div></button>`).join("");
  overlay(`<h1>Language Quest<small lang="ar">رِحْلَةُ اللُّغَة</small></h1>
    <h2>Who's playing?</h2>
    <div class="lq-pro">${list}<button class="lq-pc" id="lqNew"><div style="font-size:3.2rem;line-height:92px">➕</div><div class="n">New player</div><div class="s">Make your hero</div></button></div>
    <div class="lq-row"><button class="lq-btn gh" id="lqParent">👨‍👩‍👧 Parents</button></div>
    <div class="lq-cloud"></div>`);
  document.querySelectorAll(".lq-pc[data-id]").forEach(b=>b.onclick=()=>choose(b.dataset.id));
  document.getElementById("lqNew").onclick=()=>createPlayer();
  document.getElementById("lqParent").onclick=()=>askPin(parentCorner);
}
function choose(id){ const p=state.players.find(x=>x.id===id); if(!p) return; if(p.lock&&p.lock.length) askLock(p); else enter(p); }
function enter(p){ state.cur=p.id; p.last=Date.now(); saveLocal(); closeOverlay(); fire(); if(enterCb) enterCb(p); }
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
    <h2>Make your hero</h2><div id="lqPrev">${hero(color,90)}</div>
    <input id="lqName" maxlength="14" placeholder="Your first name" autocomplete="off">
    <div class="lq-small" style="margin-top:6px">First name only, please.</div>
    <div class="lq-cols">${COLORS.map(c=>`<button data-c="${c}" style="background:${c}" class="${c===color?"on":""}" aria-label="color"></button>`).join("")}</div>
    <div class="lq-row"><button class="lq-btn gh" id="lqBack">Back</button><button class="lq-btn g" id="lqNext">Next ▶</button></div></div>`);
    document.querySelectorAll(".lq-cols button").forEach(b=>b.onclick=()=>{ const n=document.getElementById("lqName").value; color=b.dataset.c; draw(); document.getElementById("lqName").value=n; });
    document.getElementById("lqBack").onclick=()=>profiles();
    document.getElementById("lqNext").onclick=()=>{ const n=document.getElementById("lqName").value.trim(); if(!n){ document.getElementById("lqName").focus(); return; }
      const p=blankPlayer(n,color); state.players.push(p); save(); chooseLock(p,true); }; };
  draw();
}
function chooseLock(p,isNew){ let pick=[];
  const draw=()=>{ overlay(`<div class="lq-card" style="max-width:420px;margin:20px auto;text-align:center">${hero(p.color,70)}
    <h2>Pick 2 secret pictures</h2><p>They keep your hero safe. Remember the order!</p>
    <div class="lq-dots">${[0,1].map(i=>pick[i]||"○").join(" ")}</div>
    <div class="lq-grid">${PICS.map(e=>`<button data-e="${e}">${e}</button>`).join("")}</div>
    <div class="lq-row"><button class="lq-btn gh" id="lqSkip">${isNew?"Skip for now":"Remove lock"}</button>${pick.length===2?`<button class="lq-btn g" id="lqOk">Save ✓</button>`:""}</div></div>`);
    document.querySelectorAll(".lq-grid button").forEach(b=>b.onclick=()=>{ if(pick.length<2&&!pick.includes(b.dataset.e)){ pick.push(b.dataset.e); draw(); } });
    document.getElementById("lqSkip").onclick=()=>{ p.lock=null; save(); isNew?enter(p):parentCorner(); };
    const ok=document.getElementById("lqOk"); if(ok) ok.onclick=()=>{ p.lock=pick.slice(); save(); isNew?enter(p):parentCorner(); }; };
  draw();
}

/* ---------------- parent PIN + Parent Corner ---------------- */
function askPin(next){
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
const LETTER_NAMES={}; // filled by pages that know letter names (optional)
function kidReport(p){
  const st=p.stats||{letters:{},words:{},mix:{}}; const L=Object.entries(st.letters||{});
  const acc=([k,e])=>e.r/(e.r+e.w);
  const weak=L.filter(([k,e])=>e.w>=2&&acc([k,e])<0.75).sort((a,b)=>b[1].w-a[1].w).slice(0,6);
  const strong=L.filter(([k,e])=>e.r>=4&&acc([k,e])>=0.9).sort((a,b)=>b[1].r-a[1].r).slice(0,8);
  const mix=Object.entries(st.mix||{}).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const tot=L.reduce((s,[k,e])=>s+e.r+e.w,0), right=L.reduce((s,[k,e])=>s+e.r,0);
  const caught=Object.keys(p.letters||{}).length, camps=Object.keys(p.camps||{}).length;
  const days=Object.keys(p.days||{}).length;
  const ago=(days&&p.last)?Math.round((Date.now()-p.last)/86400000):null;
  return `<div class="lq-kid"><h3>${esc(p.name)} <span class="lq-small">🪙 ${p.coins||0}</span></h3>
    <div class="lq-small">Letters caught: <b>${caught}/28</b> · Camps beaten: <b>${camps}/7</b> · Accuracy: <b>${tot?Math.round(right/tot*100)+"%":"—"}</b> · Days played: <b>${days}</b> · Last played: <b>${ago===null?"never":ago===0?"today":ago+" day"+(ago>1?"s":"")+" ago"}</b></div>
    <div class="lq-bar"><i style="width:${caught/28*100}%"></i></div>
    <div class="lq-small">Doing well</div><div class="lq-tags good">${strong.length?strong.map(([k])=>`<span><bdi class="lq-ar" lang="ar">${esc(k)}</bdi></span>`).join(""):"<span>Not enough play yet</span>"}</div>
    <div class="lq-small">Needs help</div><div class="lq-tags bad">${weak.length?weak.map(([k,e])=>`<span><bdi class="lq-ar" lang="ar">${esc(k)}</bdi>&nbsp; ${e.r} right · ${e.w} wrong</span>`).join(""):"<span>Nothing yet 👍</span>"}</div>
    ${mix.length?`<div class="lq-small">Mixes up</div><div class="lq-tags bad">${mix.map(([k,n])=>{ const [a,b]=k.split("→"); return `<span><bdi class="lq-ar" lang="ar">${esc(a)}</bdi> with <bdi class="lq-ar" lang="ar">${esc(b)}</bdi> (${n}×)</span>`; }).join("")}</div>`:""}
    <div class="lq-row" style="justify-content:flex-start;margin-top:4px"><button class="lq-btn gh" data-lock="${p.id}">🔒 Secret pictures</button><button class="lq-btn gh" data-del="${p.id}">Remove</button></div></div>`;
}
function parentCorner(){
  const kids=state.players.length?state.players.map(kidReport).join(""):`<p class="lq-small">No players yet.</p>`;
  overlay(`<h1>Parent Corner</h1>
    <div class="lq-card"><h2 style="text-align:left;margin-top:0">How the kids are doing</h2>${kids}</div>
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
  document.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.lock); if(p) chooseLock(p,false); });
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ const p=state.players.find(x=>x.id===b.dataset.del); if(!p) return;
    if(confirm(`Remove ${p.name} and all their progress?`)){ state.deleted[p.id]=Date.now(); state.players=state.players.filter(x=>x.id!==p.id); if(state.cur===p.id) state.cur=null; save(); parentCorner(); } });
  const on=document.getElementById("lqOn"); if(on) on.onclick=async()=>{ cloud.code=genCode(); try{ localStorage.setItem(FAM_KEY,cloud.code); }catch(e){} cloud.status=""; parentCorner(); await syncNow(); parentCorner(); };
  const off=document.getElementById("lqOff"); if(off) off.onclick=()=>{ if(!confirm("Stop saving online on this device? Players stay on this device.")) return; cloud.code=null; try{ localStorage.removeItem(FAM_KEY); }catch(e){} parentCorner(); };
  const cp=document.getElementById("lqCopy"); if(cp) cp.onclick=async()=>{ try{ await navigator.clipboard.writeText(cloud.code); cp.textContent="Copied!"; }catch(e){ prompt("Copy this code:",cloud.code); } };
  const jb=document.getElementById("lqJoinBtn"); if(jb) jb.onclick=async()=>{ const v=document.getElementById("lqJoin").value.trim().toUpperCase(); if(v.replace(/[^A-Z0-9]/g,"").length<12){ alert("That code looks too short."); return; }
    jb.textContent="Joining…"; try{ const r=await cloudGet(v); if(!r){ alert("No save found for that code. Check the spelling."); jb.textContent="Join"; return; }
      cloud.code=v; try{ localStorage.setItem(FAM_KEY,v); }catch(e){} merge(r,null); await syncNow(); parentCorner(); } catch(e){ alert("Couldn't reach the internet. Try again in a moment."); jb.textContent="Join"; } };
}

/* ---------------- public API ---------------- */
function cur(){ return state.players.find(p=>p.id===state.cur)||null; }
window.LQ={
  player:cur, profiles, parentCorner:()=>askPin(parentCorner), onChange:f=>listeners.push(f),
  update(fn){ const p=cur(); if(!p) return; fn(p); p.last=Date.now(); p.days=p.days||{}; p.days[today()]=1; save(); },
  addCoins(n){ const p=cur(); if(!p) return; p.coins=(p.coins||0)+n; save(); },
  record, syncNow, hero, esc
};
/* ?family=CODE link joins a household once */
try{ const q=new URLSearchParams(location.search).get("family"); if(q&&!cloud.code){ cloud.code=q.toUpperCase(); localStorage.setItem(FAM_KEY,cloud.code); } }catch(e){}
if(cloud.code) syncNow();
})();
