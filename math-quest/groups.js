/* Math Quest · names & class groups
   - nameProblem(): checks a name for unkind words, bad characters and duplicates
   - Class groups: a parent makes a class code; other parents join their kid's hero; each hero shares only a small score card.
   Stored in the same Firestore collection as family saves (doc id "c_" + code), same {data,updated,v} shape the rules allow. */
(function(){
/* ---------------- name checking ---------------- */
const BW=JSON.parse(atob('eyJzIjogWyJmdWNrIiwgImZ1ayIsICJmY2siLCAicGh1Y2siLCAic2hpdCIsICJiaXRjaCIsICJiaWF0Y2giLCAiY3VudCIsICJuaWdnIiwgIm5pZ2EiLCAiZmFnZyIsICJmYWdnb3QiLCAicmV0YXJkIiwgIndob3JlIiwgInNsdXQiLCAicHVzc3kiLCAicGVuaXMiLCAidmFnaW5hIiwgInBvcm4iLCAicmFwaXN0IiwgImRpbGRvIiwgImFzc2hvbGUiLCAiYXJzZWhvbGUiLCAiYmFzdGFyZCIsICJtb3RoZXJmIiwgIndhbmtlciIsICJ0d2F0IiwgImppenoiLCAiaG9ybnkiLCAibmF6aSIsICJoaXRsZXIiLCAid2V0YmFjayIsICJ0cmFubnkiLCAiYnV0dGhvbGUiLCAiYnV0dGhlYWQiLCAiZHVtYmFzcyIsICJqYWNrYXNzIiwgImRpcHNoaXQiLCAiYnVsbHNoaXQiLCAiYm9uZXIiLCAidGVzdGljbGUiLCAic2Nyb3R1bSIsICJtYXN0dXJiIiwgIm9yZ2FzbSIsICJlcm90aWMiLCAiaG9va2VyIiwgInN0cmlwcGVyIl0sICJ3IjogWyJhc3MiLCAiYXNzZXMiLCAiYXJzZSIsICJidXR0IiwgImJ1dHRzIiwgImRhbW4iLCAiZGFtbml0IiwgImhlbGwiLCAiY3JhcCIsICJjcmFwcHkiLCAicGlzcyIsICJwaXNzZWQiLCAicG9vcCIsICJwb29weSIsICJwb28iLCAicGVlIiwgInBlZXBlZSIsICJmYXJ0IiwgImZhcnRzIiwgImZhcnR5IiwgImRpY2siLCAiZGlja3MiLCAiY29jayIsICJjb2NrcyIsICJjdW0iLCAidGl0IiwgInRpdHMiLCAidGl0dHkiLCAiYm9vYiIsICJib29icyIsICJhbmFsIiwgImFudXMiLCAic2V4IiwgInNleHkiLCAibnVkZSIsICJuYWtlZCIsICJzdHVwaWQiLCAiZHVtYiIsICJkdW1teSIsICJpZGlvdCIsICJpZGlvdHMiLCAibG9zZXIiLCAibG9zZXJzIiwgInVnbHkiLCAiZmF0IiwgImZhdHR5IiwgImZhdHNvIiwgImhhdGUiLCAiaGF0ZXIiLCAia2lsbCIsICJraWxsZXIiLCAiZGllIiwgImRlYWQiLCAic3VjayIsICJzdWNrcyIsICJzdWNrZXIiLCAibW9yb24iLCAid2VpcmRvIiwgImplcmsiLCAidHVyZCIsICJyYXBlIiwgImZhZyIsICJob2UiLCAiaG9lcyIsICJjaGluayIsICJraWtlIiwgInNwaWMiLCAiZHlrZSIsICJxdWVlciIsICJob21vIiwgImtrayIsICJ3dGYiLCAic3RmdSIsICJvbWZnIiwgInRob3QiLCAicGltcCIsICJkcnVuayIsICJkcnVncyIsICJ3ZWVkIiwgImJlZXIiXX0='));
const LEET={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i','|':'l'};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[01345789@$!|]/g,c=>LEET[c]);
const squash=s=>norm(s).replace(/[^a-z]/g,'');
const collapse=s=>s.replace(/(.)\1+/g,'$1');
const SUBC=BW.s.map(collapse),WHR=new Set(BW.w),WHC=new Set(BW.w.map(collapse).filter(w=>w.length>=3));
const isWord=t=>WHR.has(t)||WHC.has(collapse(t));
function unkind(name){const sq=squash(name),sc=collapse(sq);
 if(SUBC.some(w=>sc.includes(w)))return true;
 if(isWord(sq))return true;
 return norm(name).split(/[^a-z]+/).filter(Boolean).some(isWord);}
const sameName=(a,b)=>squash(a)===squash(b)&&squash(a).length>0;
/* returns a kid-friendly problem message, or null if the name is fine */
function nameProblem(name,others){name=String(name||'').trim().replace(/\s+/g,' ');
 if(name.length<2)return 'That name is too short. Use at least 2 letters.';
 if(name.length>14)return 'That name is too long. Use 14 letters or fewer.';
 if(!/^[\p{L}][\p{L} .'\-]*$/u.test(name))return 'Names can only use letters, spaces, dots, dashes and apostrophes (no numbers or symbols).';
 if(unkind(name))return "Let's pick a kinder name. Try a first name, or a first name and last initial.";
 if((others||[]).some(o=>sameName(o,name)))return 'That name is already taken here. Try adding a last initial, like "Sam K."';
 return null;}
window.nameProblem=nameProblem;window.nameSame=sameName;window._unkind=unkind;

/* ---------------- class groups: storage ---------------- */
const GWORDS=['OTTER','MAPLE','COMET','PANDA','ROCKET','CEDAR','RIVER','TIGER','MANGO','LEMON','PLANET','WAFFLE','PENGUIN','FALCON','PARROT','KOALA','BISON','MOOSE','PEPPER','GINGER','COCOA','PICKLE','MUFFIN','NOODLE','MARBLE','PUZZLE','MAGNET','GUITAR','PIANO','VIOLIN','BANJO','CORAL','JADE','RUBY','PEARL','TOPAZ','SUNNY','BREEZY','LUCKY','JOLLY','BRAVE','CLEVER','SWIFT','GENTLE','ARCHER','SAILOR','RANGER','SCOUT','PILOT','CANYON','MEADOW','ISLAND','GLACIER','RAINBOW'];
const rnd=n=>Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*n);
function genGCode(){for(;;){const c=`${GWORDS[rnd(GWORDS.length)]}-${GWORDS[rnd(GWORDS.length)]}-${GWORDS[rnd(GWORDS.length)]}-${rnd(90)+10}`;if(gId(c).length>=18)return c;}}
const gNorm=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
const gId=c=>'c_'+gNorm(c).toLowerCase().replace(/[^a-z0-9]/g,'');
const gUrl=c=>`https://firestore.googleapis.com/v1/projects/${FB.project}/databases/(default)/documents/families/${gId(c)}`;
const hsh=s=>{let h=5381;for(const ch of String(s))h=((h*33)^ch.charCodeAt(0))>>>0;return h.toString(36);};
async function gGet(code){const t=await fbToken();const r=await fetch(gUrl(code),{headers:{Authorization:'Bearer '+t},cache:'no-store'});
 if(r.status===404)return null;if(!r.ok)throw new Error('get '+r.status);const j=await r.json();const s=j.fields&&j.fields.data&&j.fields.data.stringValue;
 let d=null;try{d=s?JSON.parse(s):null;}catch(e){}if(!d||d.type!=='class')return null;return {d,ut:j.updateTime};}
/* read-change-write with a "nobody else changed it" check, retried; mutate(d) returns false to skip writing */
async function gWrite(code,mutate,create){for(let i=0;i<5;i++){const cur=create?null:await gGet(code);if(!create&&!cur)throw new Error('missing');
  const d=create?create:JSON.parse(JSON.stringify(cur.d));if(!create&&mutate(d)===false)return d;
  const t=await fbToken();const pre=create?'currentDocument.exists=false':'currentDocument.updateTime='+encodeURIComponent(cur.ut);
  const body={fields:{data:{stringValue:JSON.stringify(d)},updated:{integerValue:String(Date.now())},v:{integerValue:'1'}}};
  const r=await fetch(gUrl(code)+'?'+pre,{method:'PATCH',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(r.ok){cache[gNorm(code)]={d,at:Date.now()};return d;}
  if(create&&(r.status===409||r.status===400))return null;
  if(r.status!==400&&r.status!==409)throw new Error('put '+r.status);
  await new Promise(z=>setTimeout(z,200+Math.random()*500));}
 throw new Error('busy');}
const cache={};
async function gLoad(code,maxAge){const k=gNorm(code),c=cache[k];if(c&&Date.now()-c.at<(maxAge==null?60000:maxAge))return c.d;const g=await gGet(code);if(g)cache[k]={d:g.d,at:Date.now()};return g?g.d:null;}

/* ---------------- membership & score cards ---------------- */
const mine=p=>(p.groups||[]).filter(g=>g&&g.code);
function card(p,nick){const wk=weekKey(),s=wkStats(p,wk);return {n:nick,look:p.look,lv:p.level||1,wk,pts:s.pts||0,days:s.days||0,rd:s.readPts||0,st:s.stories||0,sp:s.spPts||0,wd:s.words||0,upd:Date.now()};}
const sig=c=>JSON.stringify([c.n,c.lv,c.wk,c.pts,c.days,c.rd,c.sp,c.look]);
const lastSent={},lastTry={};
async function publish(p,force){if(!p||!p.setup)return;for(const g of mine(p)){const k=gNorm(g.code)+'|'+p.id;const c=card(p,g.nick||p.name);
  if(!force&&(lastSent[k]===sig(c)||Date.now()-(lastTry[k]||0)<90000))continue;lastTry[k]=Date.now();
  try{let gone=false,renamed=null;await gWrite(g.code,d=>{if(d.closed||(d.removed&&d.removed[p.id])){gone=true;return false;}
     const old=d.members[p.id];if(old&&old.lockN){c.n=old.n;if(old.n!==g.nick)renamed=old.n;}c.lockN=old&&old.lockN?1:0;
     if(old&&sig(old)===sig(c))return false;d.members[p.id]=c;});
   lastSent[k]=sig(c);
   if(gone){p.groups=mine(p).filter(x=>gNorm(x.code)!==gNorm(g.code));save();}
   if(renamed){g.nick=renamed;save();}}catch(e){}}}
function publishAll(force){try{(state.players||[]).forEach(p=>publish(p,force));}catch(e){}}
setInterval(()=>{if(!document.hidden&&state&&state.cur)publish(P());},60000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state&&state.cur)publish(P());});

/* ---------------- Parent Corner ---------------- */
const own=()=>state.ownGroups||(state.ownGroups={});
function allCodes(){const s=new Map();Object.keys(own()).forEach(c=>s.set(gNorm(c),c));state.players.forEach(p=>mine(p).forEach(g=>s.set(gNorm(g.code),g.code)));return [...s.values()];}
function section(){const codes=allCodes();
 return `<div class="pp" id="grpbox"><h3>👫 Class groups</h3>
 <p>Let classmates see each other on a weekly <b>class leaderboard</b>. Each hero shares only a small score card: a name you choose, their hero picture, level and this week's points. No chat, and nobody can see or change anyone else's game. Names are checked for unkind words and can't repeat in a group.</p>
 <div id="grplist">${codes.length?codes.map(c=>`<div class="grprow" data-code="${esc(c)}"><b>${esc(c)}</b> <span class="muted">loading…</span></div>`).join(''):'<p class="muted">No class groups yet.</p>'}</div>
 <div class="row" style="justify-content:flex-start"><button class="btn green small" onclick="Groups.createUI()">➕ Make a class group</button><button class="btn small" onclick="Groups.joinUI()">🔑 Join with a class code</button></div></div>`;}
async function fillSection(){const box=document.getElementById('grplist');if(!box)return;const codes=allCodes();if(!codes.length)return;
 const rows=await Promise.all(codes.map(async c=>{let d=null;try{d=await gLoad(c,15000);}catch(e){return `<div class="grprow"><b>${esc(c)}</b> <span class="muted">(offline, try later)</span></div>`;}
  if(!d)return `<div class="grprow"><b>${esc(c)}</b> <span class="muted">(this group no longer exists)</span> ${leaveBtns(c)}</div>`;
  const isOwn=own()[gNorm(c)]&&hsh(own()[gNorm(c)])===d.owner;const ours=state.players.filter(p=>mine(p).some(g=>gNorm(g.code)===gNorm(c)));
  return `<div class="grprow"><div class="grphead"><b>${esc(d.name)}</b>${d.closed?' <span class="grptag">closed</span>':''}${isOwn?' <span class="grptag own">you organize this</span>':''}</div>
   <div>Code: <b class="famcode small">${esc(c)}</b> · ${Object.keys(d.members||{}).length} in the group</div>
   <div>${ours.length?ours.map(p=>{const g=mine(p).find(x=>gNorm(x.code)===gNorm(c));return `<span class="grpkid">${esc(p.name)} as <b>${esc((d.members[p.id]||{}).n||g.nick)}</b> <button class="btn small ghost dark" onclick="Groups.leave('${esc(c)}','${p.id}')">Leave</button></span>`;}).join(' '):'<span class="muted">None of your heroes are in it yet.</span>'}</div>
   <div class="row" style="justify-content:flex-start">${d.closed?'':`<button class="btn small" onclick="Groups.addUI('${esc(c)}')">Add a hero</button>`}${isOwn?`<button class="btn small" onclick="Groups.manageUI('${esc(c)}')">Manage members</button>${d.closed?`<button class="btn small" onclick="Groups.close('${esc(c)}',false)">Reopen</button>`:`<button class="btn small ghost dark" onclick="Groups.close('${esc(c)}',true)">Close group</button>`}`:''}<button class="btn small ghost dark" onclick="Groups.forget('${esc(c)}')">Remove from this list</button></div></div>`;}));
 if(document.getElementById('grplist'))document.getElementById('grplist').innerHTML=rows.join('');}
const leaveBtns=c=>`<button class="btn small ghost dark" onclick="Groups.forget('${esc(c)}')">Remove from this list</button>`;
function createUI(){modal(`<div class="mcard"><h2>➕ Make a class group</h2><p>Give it a name the parents will recognize.</p>
 <input id="gName" class="inp" maxlength="30" placeholder="Room 12 · 3rd Grade"><div id="gErr" class="gerr"></div>
 <div class="row"><button class="btn ghost dark" onclick="closeModal()">Cancel</button><button class="btn green" onclick="Groups.create()">Make it</button></div></div>`);setTimeout(()=>{const i=$('#gName');i&&i.focus();},50);}
async function create(){const i=$('#gName');const name=(i.value||'').trim().replace(/\s+/g,' ');const err=$('#gErr');
 if(name.length<3){err.textContent='Please type a name (at least 3 letters).';return;}if(unkind(name)){err.textContent="Let's use a different name for the group.";return;}
 err.textContent='Making it…';const secret=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
 try{let code=null;for(let k=0;k<5&&!code;k++){const c=genGCode();const d=await gWrite(c,null,{v:1,type:'class',name,created:Date.now(),owner:hsh(secret),closed:0,members:{},removed:{}});if(d)code=c;}
  if(!code)throw 0;own()[gNorm(code)]=secret;save();
  modal(`<div class="mcard"><div class="big-emoji">👫</div><h2>${esc(name)}</h2><p>Your class code:</p><div class="famcode">${esc(code)}</div>
   <p>Share this code with <b>parents</b> (not kids), for example in a note home. They enter it in <b>Parent Corner → Class groups → Join with a class code</b>.</p>
   <p class="note">Your family's own save and your family code stay private. This code only shares the small score cards.</p>
   <div class="row"><button class="btn" onclick="Groups.addUI('${esc(code)}')">Add one of my heroes</button><button class="btn green" onclick="closeModal();go('parent')">Done</button></div></div>`);}
 catch(e){err.textContent="Couldn't reach the internet. Try again in a moment.";}}
function joinUI(){modal(`<div class="mcard"><h2>🔑 Join a class group</h2><p>Type the class code you were given.</p>
 <input id="gCode" class="inp" style="text-transform:uppercase" autocapitalize="characters" placeholder="OTTER-MAPLE-COMET-38"><div id="gErr" class="gerr"></div>
 <div class="row"><button class="btn ghost dark" onclick="closeModal()">Cancel</button><button class="btn green" onclick="Groups.lookup()">Next</button></div></div>`);}
async function lookup(){const code=gNorm($('#gCode').value);const err=$('#gErr');if(gId(code).length<18){err.textContent='That code looks too short.';return;}
 err.textContent='Looking…';let d=null;try{d=await gLoad(code,0);}catch(e){err.textContent="Couldn't reach the internet. Try again in a moment.";return;}
 if(!d){err.textContent="There's no class group with that code. Check the spelling.";return;}if(d.closed){err.textContent='That group is closed.';return;}addUI(code);}
function addUI(code){const k=gNorm(code);const d=(cache[k]||{}).d;const free=state.players.filter(p=>p.setup&&!mine(p).some(g=>gNorm(g.code)===k));
 if(!free.length){modal(`<div class="mcard"><h2>All set!</h2><p>All your heroes are already in this group.</p><div class="row"><button class="btn green" onclick="closeModal();go('parent')">OK</button></div></div>`);return;}
 modal(`<div class="mcard"><h2>👫 ${esc(d?d.name:code)}</h2><p>Which hero is joining?</p>
 <div class="grppick">${free.map((p,i)=>`<label><input type="radio" name="gHero" value="${p.id}" ${i?'':'checked'} onchange="$('#gNick').value=this.dataset.n" data-n="${esc(p.name)}"> ${esc(p.name)}</label>`).join('')}</div>
 <p style="margin-top:10px">Name to show the class:</p><input id="gNick" class="inp" maxlength="14" value="${esc(free[0].name)}"><p class="note">First name and last initial works well, like "Sam K." No numbers or nicknames that could upset anyone.</p><div id="gErr" class="gerr"></div>
 <div class="row"><button class="btn ghost dark" onclick="closeModal();go('parent')">Cancel</button><button class="btn green" onclick="Groups.join('${esc(code)}')">Join</button></div></div>`);}
async function join(code){const err=$('#gErr');const pid=(document.querySelector('input[name=gHero]:checked')||{}).value;const p=state.players.find(x=>x.id===pid);const nick=($('#gNick').value||'').trim().replace(/\s+/g,' ');
 if(!p)return;err.textContent='Checking…';let bad=null;
 try{const d=await gWrite(code,d=>{if(d.closed){bad='That group is closed.';return false;}
   const others=Object.entries(d.members||{}).filter(([id])=>id!==p.id).map(([,m])=>m.n);const pr=nameProblem(nick,others);if(pr){bad=pr;return false;}
   if(d.removed)delete d.removed[p.id];d.members[p.id]=card(p,nick);});
  if(bad){err.textContent=bad;return;}
  p.groups=mine(p).filter(g=>gNorm(g.code)!==gNorm(code));p.groups.push({code:gNorm(code),nick,joined:Date.now()});save();
  modal(`<div class="mcard"><div class="big-emoji">🎉</div><h2>${esc(p.name)} joined ${esc(d.name)}!</h2><p>The class board is in the 🏆 leaderboard under <b>👫 ${esc(d.name)}</b>. Scores update every few minutes while kids play.</p><div class="row"><button class="btn" onclick="Groups.addUI('${esc(code)}')">Add another hero</button><button class="btn green" onclick="closeModal();go('parent')">Done</button></div></div>`);}
 catch(e){err.textContent="Couldn't reach the internet. Try again in a moment.";}}
async function leave(code,pid){const p=state.players.find(x=>x.id===pid);if(!p)return;
 modal(`<div class="mcard"><h2>Leave the group?</h2><p>${esc(p.name)}'s score card will be removed from the class board. You can join again later with the code.</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Cancel</button><button class="btn danger" onclick="Groups.leaveNow('${esc(code)}','${pid}')">Leave</button></div></div>`);}
async function leaveNow(code,pid){const p=state.players.find(x=>x.id===pid);try{await gWrite(code,d=>{if(!d.members[pid])return false;delete d.members[pid];});}catch(e){}
 if(p){p.groups=mine(p).filter(g=>gNorm(g.code)!==gNorm(code));save();}closeModal();go('parent');}
function forget(code){const k=gNorm(code);state.players.forEach(p=>{if(mine(p).some(g=>gNorm(g.code)===k)){leaveNow(code,p.id);}});delete own()[k];save();go('parent');}
async function manageUI(code){let d=null;try{d=await gLoad(code,0);}catch(e){toast("Couldn't reach the internet.");return;}if(!d)return;
 const ms=Object.entries(d.members||{}).sort((a,b)=>String(a[1].n).localeCompare(b[1].n));
 modal(`<div class="mcard"><h2>👫 ${esc(d.name)}</h2><p>Rename or remove a score card. A removed hero can only come back if their parent joins again.</p>
 <div class="grpmembers">${ms.length?ms.map(([id,m])=>`<div class="grpm"><span class="lbface">${heroSVG(m.look,{head:true})}</span><b>${esc(m.n)}</b><button class="btn small ghost dark" onclick="Groups.renameUI('${esc(code)}','${id}')">Rename</button><button class="btn small danger" onclick="Groups.remove('${esc(code)}','${id}')">Remove</button></div>`).join(''):'<p class="muted">Nobody has joined yet.</p>'}</div>
 <div class="row"><button class="btn green" onclick="closeModal();go('parent')">Done</button></div></div>`);}
function renameUI(code,id){const d=cache[gNorm(code)].d;const m=d.members[id];if(!m)return;
 modal(`<div class="mcard"><h2>Rename</h2><input id="gNick" class="inp" maxlength="14" value="${esc(m.n)}"><div id="gErr" class="gerr"></div><div class="row"><button class="btn ghost dark" onclick="Groups.manageUI('${esc(code)}')">Cancel</button><button class="btn green" onclick="Groups.rename('${esc(code)}','${id}')">Save</button></div></div>`);}
async function rename(code,id){const nick=($('#gNick').value||'').trim().replace(/\s+/g,' ');const err=$('#gErr');let bad=null;
 try{await gWrite(code,d=>{const m=d.members[id];if(!m)return false;const pr=nameProblem(nick,Object.entries(d.members).filter(([k])=>k!==id).map(([,x])=>x.n));if(pr){bad=pr;return false;}m.n=nick;m.lockN=1;});
  if(bad){err.textContent=bad;return;}const p=state.players.find(x=>x.id===id);if(p){const g=mine(p).find(x=>gNorm(x.code)===gNorm(code));if(g){g.nick=nick;save();}}manageUI(code);}
 catch(e){err.textContent="Couldn't reach the internet.";}}
async function remove(code,id){try{await gWrite(code,d=>{delete d.members[id];d.removed=d.removed||{};d.removed[id]=Date.now();});}catch(e){toast("Couldn't reach the internet.");return;}
 const p=state.players.find(x=>x.id===id);if(p){p.groups=mine(p).filter(g=>gNorm(g.code)!==gNorm(code));save();}manageUI(code);}
async function close(code,yes){try{await gWrite(code,d=>{d.closed=yes?1:0;});}catch(e){toast("Couldn't reach the internet.");return;}go('parent');}

/* ---------------- leaderboard tab ---------------- */
function tabs(p){return mine(p).map(g=>['grp:'+gNorm(g.code),'👫 '+(((cache[gNorm(g.code)]||{}).d||{}).name||'Class')]);}
function board(tab,me,face,boardFn){const code=tab.slice(4);const c=cache[code];
 if(!c||Date.now()-c.at>60000){if(me)publish(me,true);gLoad(code,0).then(()=>{if(curScreen==='leaders'&&curArg===tab)go('leaders',tab);}).catch(()=>{const el=document.getElementById('grpwait');if(el)el.textContent="Couldn't load the class board. Check the internet and try again.";});}
 if(!c)return `<div class="panel"><p id="grpwait" style="text-align:center">Loading the class board…</p></div>`;
 const d=c.d;if(d.closed)return `<div class="panel"><p style="text-align:center">This class group is closed.</p></div>`;
 const wk=weekKey();const ms=Object.entries(d.members||{}).map(([id,m])=>({id,m,cur:m.wk===wk}));
 const rows=f=>ms.map(x=>({p:{id:x.id,name:x.m.n,look:x.m.look},v:x.cur?(x.m[f]||0):0})).sort((a,b)=>b.v-a.v);
 const ago=Math.max(0,Math.round((Date.now()-c.at)/60000));
 return `<div class="lbhero grphero"><div class="lbcrown">👫</div><div><div style="opacity:.9">Class board</div><b style="font-size:24px">${esc(d.name)}</b><div>${ms.length} classmate${ms.length===1?'':'s'} · updates every few minutes</div></div></div>
 <div class="lbgrid">${boardFn('👑','Math Champion','Points depend on how hard each problem is <b>for your grade</b>, so everyone has a fair chance.',rows('pts'),r=>String(r.v))}
 ${boardFn('📅','Practice Days','Showing up counts more than marathon sessions.',rows('days'),r=>pl_(r.v,'day'))}
 ${boardFn('📚','Reading Champion','Stories read in the Library this week.',rows('rd'),r=>String(r.v))}
 ${boardFn('✏️','Spelling Champion','Words spelled in Spelling Grove this week.',rows('sp'),r=>String(r.v))}</div>
 <p class="note" style="text-align:center">Only names, hero pictures and this week's points are shared with the class. ${ago?`Checked ${ago} min ago.`:''}</p>`;}

const css=document.createElement('style');css.textContent=`.grprow{border:2px solid #ece7ff;border-radius:16px;padding:12px;margin:10px 0}.grphead{font-size:18px}.grptag{display:inline-block;background:#eee;border-radius:999px;padding:1px 10px;font-size:13px;font-weight:700;margin-left:4px}.grptag.own{background:#d3f9d8;color:#2b8a3e}
.grpkid{display:inline-flex;align-items:center;gap:6px;background:#f8f5ff;border-radius:12px;padding:4px 4px 4px 10px;margin:6px 6px 0 0}.gerr{color:#c92a2a;font-weight:700;min-height:22px;margin-top:6px}
.grppick{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.grppick label{background:#f8f5ff;border:2px solid #ddd5ff;border-radius:12px;padding:8px 12px;font-weight:700;cursor:pointer}
.grpmembers{max-height:50vh;overflow:auto;text-align:left}.grpm{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee}.grpm b{flex:1}.grpm .lbface{width:34px;height:34px}`;
document.head.appendChild(css);
window.Groups={section,fillSection,createUI,create,joinUI,lookup,addUI,join,leave,leaveNow,forget,manageUI,renameUI,rename,remove,close,tabs,board,publish,publishAll,_cache:cache,_gNorm:gNorm};

/* ---------------- Suggestion Box (story ideas) ----------------
   Kids type an idea ("a book about rockets"). It's checked for unkind words, saved on the hero (so parents see it in Parent Corner)
   and added to one shared list for the game's builders to review. Only the idea, first name and grade are sent. */
const SUG_ID='s_mathquestsuggestionbox';
const sUrl=()=>`https://firestore.googleapis.com/v1/projects/${FB.project}/databases/(default)/documents/families/${SUG_ID}`;
async function sugPush(item){for(let i=0;i<5;i++){const t=await fbToken();const r=await fetch(sUrl(),{headers:{Authorization:'Bearer '+t},cache:'no-store'});
  let d={v:1,type:'sugg',list:[]},pre='currentDocument.exists=false';
  if(r.ok){const j=await r.json();try{d=JSON.parse(j.fields.data.stringValue);}catch(e){}if(!Array.isArray(d.list))d.list=[];pre='currentDocument.updateTime='+encodeURIComponent(j.updateTime);}else if(r.status!==404)throw new Error('get '+r.status);
  d.list.push(item);if(d.list.length>400)d.list=d.list.slice(-400);
  const body={fields:{data:{stringValue:JSON.stringify(d)},updated:{integerValue:String(Date.now())},v:{integerValue:'1'}}};
  const w=await fetch(sUrl()+'?'+pre,{method:'PATCH',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(w.ok)return true;if(w.status!==400&&w.status!==409)throw new Error('put '+w.status);await new Promise(z=>setTimeout(z,300+Math.random()*500));}
 throw new Error('busy');}
const SUG_IDEAS=['🚀 rockets','🦖 dinosaurs','⛸️ ice skating','⚽ soccer','🐶 puppies','🌊 the ocean','🏰 castles','🤖 robots','🌋 volcanoes','🐉 dragons'];
function sugUI(){const p=P();const today=(p.sugg||[]).filter(x=>x.d===dayKey()).length;
 if(today>=3){modal(`<div class="mcard"><div class="big-emoji">💡</div><h2>Thanks for all your ideas!</h2><p>You've shared 3 ideas today. Come back tomorrow with more!</p><div class="row"><button class="btn green" onclick="closeModal()">OK</button></div></div>`);return;}
 modal(`<div class="mcard sug"><div class="big-emoji">💡</div><h2>Suggestion Box</h2><p>What would you like a story about? Professor Hoot will pass your idea to the story builders!</p>
 <input id="sugIn" class="inp" maxlength="80" placeholder="I want a story about…"><div class="sugchips">${SUG_IDEAS.map(x=>`<button class="chip" onclick="$('#sugIn').value='A story about '+this.dataset.t" data-t="${esc(x.replace(/^\S+\s/,''))}">${x}</button>`).join('')}</div>
 <div id="sugErr" class="gerr"></div><div class="row"><button class="btn ghost dark" onclick="closeModal()">Cancel</button><button class="btn green" onclick="Groups.sugSend()">📮 Send my idea</button></div></div>`);setTimeout(()=>{const i=$('#sugIn');i&&i.focus();},60);}
async function sugSend(){const p=P();const t=($('#sugIn').value||'').trim().replace(/\s+/g,' ');const err=$('#sugErr');
 if(t.length<4){err.textContent='Tell Professor Hoot a little more about your idea!';return;}
 if(unkind(t)){err.textContent="Let's keep ideas kind. Try another one!";return;}
 if(/https?:|www\.|@|\d{4,}/i.test(t)){err.textContent='Just the idea, please (no links, emails or phone numbers).';return;}
 const item={t,n:String(p.name||'').split(' ')[0].slice(0,14),g:p.adult?'Adult':'Grade '+(p.grade||'?'),d:dayKey(),at:Date.now()};
 p.sugg=(p.sugg||[]).concat([{t,d:item.d,sent:false}]).slice(-30);save();const mine=p.sugg[p.sugg.length-1];
 err.textContent='Sending…';
 try{await sugPush(item);mine.sent=true;save();}catch(e){}
 modal(`<div class="mcard"><div class="big-emoji">📮</div><h2>Idea sent!</h2><p>"${esc(t)}"</p><p>Thank you, ${esc(p.name)}! Professor Hoot loves new ideas. Keep an eye on the shelf. Your story might show up one day!</p><div class="row"><button class="btn green" onclick="closeModal()">Yay!</button></div></div>`);}
async function sugRetry(){for(const p of state.players||[])for(const x of p.sugg||[])if(!x.sent){try{await sugPush({t:x.t,n:String(p.name||'').split(' ')[0].slice(0,14),g:p.adult?'Adult':'Grade '+(p.grade||'?'),d:x.d,at:Date.now()});x.sent=true;save();}catch(e){return;}}}
setTimeout(()=>{try{sugRetry();}catch(e){}},30000);
function sugSection(){const rows=[];(state.players||[]).forEach(p=>(p.sugg||[]).slice(-8).reverse().forEach(x=>rows.push(`<li><b>${esc(p.name)}</b> · ${esc(x.d)} · "${esc(x.t)}"</li>`)));
 return rows.length?`<div class="pp"><h3>💡 Story ideas from the Suggestion Box</h3><p class="note">Ideas your kids sent from the Library. They're collected for the story builders to review.</p><ul>${rows.join('')}</ul></div>`:'';}
window.Groups.sugUI=sugUI;window.Groups.sugSend=sugSend;window.Groups.sugSection=sugSection;
const css2=document.createElement('style');css2.textContent='.sugchips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px}.sugchips .chip{font-size:14px;padding:6px 10px}';document.head.appendChild(css2);
})();
