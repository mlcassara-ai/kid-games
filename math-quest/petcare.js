/* PET CARE — Nana Paws the pet sitter, lonely-pet warnings and the Pet Rescue.
   • Hearts drop one every 8 hours (index.html petMood). When a pet's tummy AND happy hearts are both at zero it gets lonely:
     day 1–2 at zero = 😢 lonely (yellow !), day 3–4 = 🧳 packing a suitcase (red !!), day 5 = it goes to the 🏡 Pet Rescue.
   • A pat, a snack or a game clears it right away. Pets at Adventure Camp, the battle buddy, and special prize/event/mythic pets never leave.
   • Nana Paws (hired in the Pet Home for coins) keeps every pet at 2+ hearts while she's hired (pd.sit, read by petMood).
   • Pet Rescue: feed + play + 🪙 100 brings a pet home at 3 hearts with all its levels.
   • Parent Corner: per-kid on/off switch (off by default for grades 2 and under) and a family Vacation mode.
   Saved per player in p.care and per pet in p.petData[id] (sit, cz, resc, rs). */
(function(){
'use strict';
const PRICE=8,RESCUE_FEE=100,H8=8*3600e3,DAY=864e5;
const PLANS=[{id:1,e:'🌙',n:'1 day',off:0},{id:5,e:'📅',n:'School week · 5 days',off:.2},{id:7,e:'🗓️',n:'Whole week · 7 days',off:.3}];
const C=p=>{p.care=p.care||{};const c=p.care;c.news=c.news||[];return c;};
const petById=id=>PETS.find(x=>x.id===id);
const nm=id=>esc((petById(id)||{}).name||'your pet');
const pe=id=>(petById(id)||{}).e||'🐾';
const pdOf=(p,id)=>petData(p,id);
const ruleOn=p=>{const c=C(p);return c.rule!=null?!!c.rule:!(!p.adult&&(+p.grade||3)<=2);};
const special=id=>{const x=petById(id);return !!(x&&(x.tier==='event'||x.tier==='mythic'||x.prize));};
const atCamp=(p,id)=>!!(window.Adv&&Adv.away(p,id));
const rescued=(p,id)=>!!(p.petData&&p.petData[id]&&p.petData[id].resc);
const owned=p=>(p.pets||[]).filter(id=>petById(id));
const homePets=p=>owned(p).filter(id=>!atCamp(p,id)&&!rescued(p,id));
const canLeave=(p,id)=>ruleOn(p)&&id!==p.pet&&!special(id)&&!atCamp(p,id)&&!rescued(p,id);
const sitUntil=p=>{const c=C(p);return c.sit&&c.sit>Date.now()?c.sit:0;};
const when=t=>new Date(t).toLocaleString([],{weekday:'short',hour:'numeric',minute:'2-digit'});

/* ---------- the daily check ---------- */
function stageOf(p,id){const pd=pdOf(p,id);return canLeave(p,id)?(pd.stg||0):0;}
function sweep(p,quiet){if(!p||!p.setup||!p.pets||!p.pets.length)return;const c=C(p),now=Date.now();let ch=false;
 if(!c.v){c.v=1;c.lastSeen=now;owned(p).forEach(id=>{const pd=petMood(pdOf(p,id));if(pd.food<3)pd.food=3;if(pd.joy<3)pd.joy=3;pd.t=now;});c.intro=1;ch=true;}
 const su=sitUntil(p);
 /* pets that went to Adventure Camp while Nana was paid to watch them: she gives back the unused days and takes them off her list */
 const cred=[];owned(p).filter(id=>atCamp(p,id)).forEach(id=>{const pd=pdOf(p,id);if(pd.sr&&pd.sit&&pd.sit>now){const cr=Math.round(pd.sr*(pd.sit-now)/DAY);if(cr>0){p.coins=(p.coins||0)+cr;c.spent=Math.max(0,(c.spent||0)-cr);c.credit=(c.credit||0)+cr;cred.push([id,cr]);}delete pd.sit;delete pd.sr;ch=true;}});
 if(cred.length)c.news.push({k:'credit',list:cred,t:now});
 /* during Vacation mode every pet is covered for free */
 const vac=c.vac&&c.vac>now?c.vac:0;
 homePets(p).forEach(id=>{const pd=pdOf(p,id);
  if(vac&&(pd.sit||0)<vac){petMood(pd);pd.sit=vac;pd.food=Math.max(2,pd.food);pd.joy=Math.max(2,pd.joy);ch=true;}
  petMood(pd);
  if(!canLeave(p,id)){if(pd.stg){pd.stg=0;ch=true;}return;}
  if(pd.food>0||pd.joy>0){let z=pd.t+Math.max(pd.food,pd.joy)*H8;if(pd.sit&&pd.sit>now)z=Math.max(z,pd.sit+2*H8);if(Math.abs((pd.cz||0)-z)>6e4||pd.stg){pd.cz=z;pd.stg=0;ch=true;}return;}
  if(!pd.cz||pd.cz>now){pd.cz=now;ch=true;}
  const d=(now-pd.cz)/DAY,stg=d>=4?3:d>=2?2:1;
  if(stg===3){pd.resc=now;pd.stg=0;pd.rs={};c.news.push({k:'left',id,t:now});c.left=(c.left||0)+1;
   try{if(p.adv&&p.adv.crew)p.adv.crew=p.adv.crew.filter(x=>x!==id);}catch(e){}ch=true;return;}
  if(pd.stg!==stg){pd.stg=stg;ch=true;}});
 /* pets at home that Nana isn't watching while she's hired (back from camp, just hatched): she offers, once per booking */
 if(su&&!c.news.some(n=>n.k==='offer')&&uncovered(p).length){c.news.push({k:'offer',t:now});ch=true;}
 // sitter report after an absence she covered
 if(c.lastSeen&&now-c.lastSeen>12*3600e3&&c.sit&&c.sit>c.lastSeen&&c.reported!==c.sit&&owned(p).length){c.news.push({k:'report',t:now});c.reported=c.sit;ch=true;}
 c.lastSeen=now;
 if(ch){try{save();}catch(e){}}
 if(!quiet)showNews(p);}
function uncovered(p){const su=sitUntil(p);if(!su)return [];return homePets(p).filter(id=>{const pd=pdOf(p,id);return (pd.sit||0)<su&&pd.sitNo!==su;});}
function offerCost(p,ids){const c=C(p),su=sitUntil(p);return Math.max(1,Math.ceil((c.rate||PRICE)*ids.length*(su-Date.now())/DAY));}
function counts(p){const o={lonely:[],packing:[],resc:owned(p).filter(id=>rescued(p,id))};homePets(p).forEach(id=>{const s=stageOf(p,id);if(s===1)o.lonely.push(id);if(s===2)o.packing.push(id);});return o;}

/* ---------- news popups (a pet left, the sitter's report, the intro) ---------- */
let showing=false;
function showNews(p){if(showing||document.querySelector('#modal.show')||typeof curScreen==='undefined'||!['world','map','pethome','backpack','camp'].includes(curScreen))return;const c=C(p);
 if(c.intro===1){c.intro=2;save();showing=true;return nanaCard(ruleOn(p)?[`Hello, dear! I'm <b>Nana Paws</b>, the village pet sitter. 🐾`,`Pets need love every few days: a pat, a snack or a game. If a pet goes too long with <b>no food and no fun</b>, it gets lonely, and after a few days it goes to stay at the <b>🏡 Pet Rescue</b>.`,`Busy week coming up? <b>Hire me in the Pet Home</b> and I'll keep everyone fed and happy while you're away. Pets on camp adventures and your battle buddy are always fine!`]:[`Hello, dear! I'm <b>Nana Paws</b>, the village pet sitter. 🐾`,`If you're going to be away for a while, <b>hire me in the Pet Home</b> and I'll keep your pets fed and happy until you're back!`],'Nice to meet you! 👋',()=>{showing=false;});}
 const n=c.news.shift();if(!n)return;save();showing=true;
 if(n.k==='left')return nanaCard([`<div style="font-size:54px;text-align:center">${pe(n.id)}🧳</div><b>${nm(n.id)}</b> felt lonely and went to stay at the <b>🏡 Pet Rescue</b> for a while.`,`Don't worry: ${nm(n.id)} is safe, warm and fed there. Ranger Juniper is taking good care of ${nm(n.id)}. You can bring ${nm(n.id)} home from the <b>Pet Home</b> any time!`],'Go to the Pet Home 🏠',()=>{showing=false;go('pethome');},'rescue');
 if(n.k==='credit'){const tot=n.list.reduce((a,x)=>a+x[1],0);const names=n.list.map(x=>`${pe(x[0])} <b>${nm(x[0])}</b>`).join(', ');
  return nanaCard([`I see ${names} ${n.list.length>1?'went':'went'} off to <b>Adventure Camp</b>! Since I won't need to look after ${n.list.length>1?'them':'that one'}, here's <b>🪙 ${tot}</b> back for the days you already paid for. 💛`,`When ${n.list.length>1?'they get':'it gets'} home, I'll ask if you want me to keep watching. If ${n.list.length>1?'they go':'it goes'} right back out to camp, I won't need to!`],'Thanks, Nana! 💛',()=>{showing=false;});}
 if(n.k==='offer'){const ids=uncovered(p);if(!ids.length){showing=false;return;}const su=sitUntil(p);const left=(su-Date.now())/DAY;const dl=left<1?'less than a day':`about ${Math.round(left)} day${Math.round(left)===1?'':'s'}`;const cost=offerCost(p,ids);
  modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${NANA}</div><div class="qz-bub pc-bub"><b>🐾 Nana Paws</b><div>Welcome home, ${ids.map(id=>`${pe(id)} <b>${nm(id)}</b>`).join(', ')}! 🏡<br><br>I'm still watching your other pets for <b>${dl}</b>. You can look after ${ids.length>1?'these ones':'this one'} yourself, or I'd be happy to watch ${ids.length>1?'them':'it'} too until then for <b>🪙 ${cost}</b>.${ids.length>1||true?`<br><small class="muted">If ${ids.length>1?'they head':'it heads'} back out to camp, you won't need me for ${ids.length>1?'them':'it'}.</small>`:''}</div></div></div>
   <div class="row"><button class="btn ghost dark" id="pcNo">No thanks, I'll care for ${ids.length>1?'them':'it'}</button><button class="btn gold big" id="pcYes">Yes, please · 🪙 ${cost}</button></div></div>`);
  document.getElementById('pcNo').onclick=()=>{ids.forEach(id=>{pdOf(p,id).sitNo=su;});save();closeModal();showing=false;toast('🐾 Nana Paws: "Okay, dear! Give them lots of pats."');};
  document.getElementById('pcYes').onclick=()=>{if(!cover(p,ids,cost)){toast(`🪙 You need ${cost-(p.coins||0)} more coins.`);return;}closeModal();showing=false;toast(`🧶 Nana Paws is watching ${ids.length} more pet${ids.length>1?'s':''} until ${when(su)}!`);if(typeof curScreen!=='undefined'&&curScreen==='pethome')redraw();};return;}
 if(n.k==='report'){const ids=owned(p).filter(id=>!rescued(p,id)).sort(()=>Math.random()-.5).slice(0,3);
  const lines=REPORT.slice().sort(()=>Math.random()-.5);
  return nanaCard([`<b>📋 Nana Paws' report</b><ul class="pc-rep">${ids.map((id,i)=>`<li>${pe(id)} ${lines[i].replace(/\{N\}/g,`<b>${nm(id)}</b>`)}</li>`).join('')}</ul>Everyone was fed and happy. Welcome home, dear!`],'Thanks, Nana! 💛',()=>{showing=false;});}
 showing=false;}
const REPORT=['{N} ate 4 carrots and barked at a leaf all Tuesday.','{N} napped in the sock drawer. Twice.','{N} learned to jump over a broom. Very proud.','{N} tried to eat the mail. We had a talk.','{N} chased a butterfly for an hour and never caught it. Still had a great time.','{N} sat by the window waiting for you every afternoon.','{N} and I did a puzzle. {N} ate one piece.','{N} found a sunny spot and did not move for a whole day.','{N} sang along to my radio. Loudly.','{N} made friends with a very polite snail.','{N} hid my knitting. I still can\'t find it.','{N} did 10 zoomies around the garden and then slept like a log.'];
const NANA=`<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="116" rx="26" ry="4" fill="rgba(0,0,0,.2)"/><path d="M26 60 Q50 50 74 60 L80 112 L20 112Z" fill="#e2567a"/><rect x="38" y="72" width="24" height="20" rx="4" fill="#fff" opacity=".85"/><text x="50" y="87" font-size="12" text-anchor="middle">🐾</text><circle cx="50" cy="36" r="18" fill="#f5d0a9"/><path d="M30 34 Q30 12 50 12 Q70 12 70 34 Q62 22 50 22 Q38 22 30 34Z" fill="#e9ecef"/><circle cx="50" cy="12" r="8" fill="#e9ecef"/><circle cx="43" cy="37" r="5" fill="none" stroke="#6b4f3f" stroke-width="2"/><circle cx="57" cy="37" r="5" fill="none" stroke="#6b4f3f" stroke-width="2"/><path d="M44 46 Q50 50 56 46" stroke="#a0522d" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="38" cy="44" r="3" fill="#ffc9c9"/><circle cx="62" cy="44" r="3" fill="#ffc9c9"/></svg>`;
const RANGER=`<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="116" rx="26" ry="4" fill="rgba(0,0,0,.2)"/><path d="M26 60 Q50 50 74 60 L78 112 L22 112Z" fill="#40c057"/><circle cx="50" cy="36" r="18" fill="#c68c5a"/><path d="M24 26 H76 L70 20 H30Z" fill="#2b8a3e"/><rect x="36" y="8" width="28" height="14" rx="4" fill="#2b8a3e"/><circle cx="44" cy="37" r="2.6" fill="#2f241d"/><circle cx="56" cy="37" r="2.6" fill="#2f241d"/><path d="M44 45 Q50 49 56 45" stroke="#2f241d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
function nanaCard(pages,lastBtn,done,who){let i=0;const show=()=>{const last=i>=pages.length-1;
 modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${who==='rescue'?RANGER:NANA}</div><div class="qz-bub pc-bub"><b>${who==='rescue'?'🏡 Ranger Juniper':'🐾 Nana Paws'}</b><div>${pages[i]}</div></div></div>
  <div class="row"><button class="btn ${last?'gold':'green'} big" id="pcNext">${last?lastBtn:'Next ➜'}</button></div></div>`);
 document.getElementById('pcNext').onclick=()=>{if(!last){i++;show();return;}closeModal();window.visitorQuiet=Date.now()+60e3;done&&done();};};show();}

/* ---------- Pet Home panels ---------- */
function hearts(n,e){let s='';for(let i=0;i<5;i++)s+=i<n?e:`<span class="dimbulb">${e}</span>`;return s;}
function chip(p,id){if(atCamp(p,id))return '<span class="pc-chip camp">🎒 At camp</span>';if(id===p.pet)return '<span class="pc-chip buddy">⭐ Buddy</span>';
 const s=stageOf(p,id);const su=sitUntil(p);return s===2?'<span class="pc-chip red">🧳 Packing!</span>':s===1?'<span class="pc-chip yel">😢 Lonely</span>':su&&(pdOf(p,id).sit||0)>=su?'<span class="pc-chip nana">🧶 Nana</span>':special(id)?'<span class="pc-chip">✨ Special</span>':'';}
function listHTML(p){const ids=owned(p).filter(id=>!rescued(p,id));if(!ids.length)return '';const now=Date.now();
 const food=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];
 /* steady order (rows never jump around when you pat or feed): buddy, then A–Z, pets at camp last */
 const grp=id=>id===p.pet?0:atCamp(p,id)?2:1;ids.sort((a,b)=>grp(a)-grp(b)||String(petById(a).name).localeCompare(petById(b).name));
 return `<div class="panel pc-panel pc-pets"><h3>🐾 All your pets <small class="muted">(${ids.length})</small></h3><p class="muted" style="margin:0 0 8px">Every pet needs a little love every few days: a pat, a snack or a game.${ruleOn(p)?' Lonely pets can wander off to the Pet Rescue.':''}</p>
 <div class="pc-list"><div class="pc-hd"><span></span><span>Pet</span><span>Tummy · Happy</span><span></span></div>${ids.map(id=>{const pd=petMood(pdOf(p,id));const camp=atCamp(p,id);const patOk=!pd.patT||now-pd.patT>15*60e3;
  return `<div class="pc-row${camp?' dim':''}" data-pet="${id}"><span class="pc-e">${pe(id)}</span><div class="pc-nm"><b>${nm(id)}</b>${chip(p,id)}</div><div class="pc-h"><span title="Tummy">${hearts(pd.food,'🍗')}</span><span title="Happy">${hearts(pd.joy,'💖')}</span></div>
   ${camp?'':`<div class="pc-act"><button class="btn small ${patOk?'':'ghost dark'}" onclick="PetCare.pat('${id}')" aria-label="Pat">🤗<span class="pc-l"> Pat</span></button><button class="btn small ${food?'green':'pc-empty'}" onclick="PetCare.snack('${id}')" title="${food?food.name:'No snacks left'}" aria-label="Snack">${food?food.e:'🍽️'}<span class="pc-l"> Snack</span></button></div>`}</div>`;}).join('')}</div>
 ${food?'':'<p class="muted" style="margin:8px 0 0;font-size:14px">Out of snacks? Buy some in the Pet Shop below.</p>'}</div>`;}
function planPrice(p,pl){const n=Math.max(1,homePets(p).length);return Math.round(n*PRICE*pl.id*(1-pl.off));}
function sitterHTML(p){const c=C(p),su=sitUntil(p),n=homePets(p).length,camp=owned(p).filter(id=>atCamp(p,id)).length;
 return `<div class="panel pc-panel pc-sit"><div class="pc-sithead"><div class="pc-nana">${NANA}</div><div><h3 style="margin:0">🧶 Nana Paws, Pet Sitter</h3>
  <p class="muted" style="margin:2px 0 0">${su?`<b style="color:#1e9a53">Hired until ${when(su)}.</b> Everyone stays at 2+ hearts.`:`"Off to school all week? I'll make sure everyone gets breakfast and a good scratch behind the ears."`}</p></div></div>
  <div class="pc-plans" id="pcPlans">${PLANS.map(pl=>{const pr=planPrice(p,pl);return `<button class="pc-plan" onclick="PetCare.hire(${pl.id})"><span>${pl.e} ${pl.n}${pl.off?` <em>${Math.round(pl.off*100)}% off</em>`:''}</span><b>🪙 ${pr}</b></button>`;}).join('')}</div>
  <p class="muted" style="margin:6px 0 0;font-size:14px">🪙 ${PRICE} per pet per day · ${n} pet${n===1?'':'s'} at home${camp?` · ${camp} at camp (free)`:''}${su?' · Hiring again adds more days.':''} · You have 🪙 ${p.coins||0}</p><p class="muted" style="margin:4px 0 0;font-size:14px">🏕️ Sending a pet she's watching to camp? Nana gives back the unused days. When it gets home, she'll ask if you want her to watch it again.</p>${(()=>{const nc=su?homePets(p).filter(id=>(pdOf(p,id).sit||0)<su).length:0;return nc?`<button class="btn small gold" style="margin-top:6px" onclick="PetCare.offer()">🧶 Ask Nana to watch ${nc} more pet${nc>1?'s':''}</button>`:'';})()}</div>`;}
function rescueHTML(p){const ids=owned(p).filter(id=>rescued(p,id));if(!ids.length)return '';
 const food=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];
 return `<div class="panel pc-panel pc-resc"><div class="pc-sithead"><div class="pc-nana">${RANGER}</div><div><h3 style="margin:0">🏡 Pet Rescue</h3><p class="muted" style="margin:2px 0 0">"${ids.length>1?'These pets are':nm(ids[0])+' is'} safe with me. Come bring ${ids.length>1?'them':'them'} home!" — Ranger Juniper</p></div></div>
  ${ids.map(id=>{const pd=pdOf(p,id);const rs=pd.rs||{};const ready=rs.fed&&rs.played;return `<div class="pc-row"><span class="pc-e">${pe(id)}</span><div class="pc-nm"><b>${nm(id)}</b><div class="pc-steps"><span>${rs.fed?'✅':'⬜'} Give a snack</span><span>${rs.played?'✅':'⬜'} Play a game</span><span>⬜ Adoption fee 🪙 ${RESCUE_FEE}</span></div></div>
   <div class="pc-act">${rs.fed?'':food?`<button class="btn small green" onclick="PetCare.rfeed('${id}')">${food.e} Snack</button>`:`<button class="btn small gold" onclick="PetCare.rbuy('${id}')">🍎 Buy a snack · 🪙 10</button>`}${rs.played?'':`<button class="btn small" onclick="PetCare.rplay('${id}')">🎾 Play fetch</button>`}${ready?`<button class="btn small gold" onclick="PetCare.home('${id}')">🏠 Bring home · 🪙 ${RESCUE_FEE}</button>`:''}</div></div>`;}).join('')}</div>`;}
function inject(){try{if(typeof curScreen==='undefined'||curScreen!=='pethome')return;const p=P();if(!p)return;sweep(p,true);css();
 const page=document.querySelector('#app .page');if(!page||page.querySelector('.pc-wrap'))return;const w=document.createElement('div');w.className='pc-wrap';
 w.innerHTML=rescueHTML(p)+listHTML(p)+sitterHTML(p);const zh=page.querySelector('.zhead');if(zh)zh.after(w);else page.prepend(w);}catch(e){console.warn('petcare',e);}}
function redraw(){const y=window.scrollY;go('pethome');window.scrollTo(0,y);}
/* update just the pet list (no page redraw, no jump) unless the battle buddy's big card also needs to change */
function refresh(id){const p=P();const el=document.querySelector('.pc-pets');if(!el||id===p.pet){redraw();return;}const y=window.scrollY;const t=document.createElement('div');t.innerHTML=listHTML(p);if(t.firstElementChild)el.replaceWith(t.firstElementChild);window.scrollTo(0,y);}

/* ---------- actions ---------- */
function pat(id){const p=P();if(!p.pets.includes(id)||rescued(p,id))return;const pd=petMood(pdOf(p,id));const now=Date.now();
 if(pd.patT&&now-pd.patT<=15*60e3){toast(`${pe(id)} ${nm(id).replace(/<[^>]+>/g,'')} loved that! Pats recharge in a few minutes.`);return;}
 pd.patT=now;if(pd.joy<MOOD_MAX)pd.joy++;const x=petById(id);try{petGain(p,x,.5);}catch(e){}try{SFX.tap();}catch(e){}sweep(p,true);save();toast(`💕 ${pe(id)} ${x.name} is happy!`);refresh(id);}
function snack(id){const p=P();const f=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];if(rescued(p,id))return;
 if(!f){toast('🍽️ You need more snacks! Buy some in the Pet Shop below. 👇');try{SFX.tap();}catch(e){}const shop=[...document.querySelectorAll('.pethome .panel h3')].find(h=>/Pet Shop/.test(h.textContent));if(shop)shop.scrollIntoView({behavior:'smooth',block:'start'});return;}const pd=petMood(pdOf(p,id));
 if(pd.food>=MOOD_MAX){toast(`${pe(id)} ${petById(id).name} is full!`);return;}
 p.pantry[f.id]--;pd.food=Math.min(MOOD_MAX,pd.food+f.food);pd.joy=Math.min(MOOD_MAX,pd.joy+(f.joy||0));try{petGain(p,petById(id),f.xp);}catch(e){}try{questEvent(p,'petcare',1);}catch(e){}try{SFX.coin();}catch(e){}sweep(p,true);save();toast(`${f.e} ${petById(id).name}: yum!`);refresh(id);}
function cover(p,ids,cost){const c=C(p),su=sitUntil(p);if(!su||(p.coins||0)<cost)return false;p.coins-=cost;c.spent=(c.spent||0)+cost;const r=c.rate||PRICE;
 ids.forEach(id=>{const pd=petMood(pdOf(p,id));pd.sit=su;pd.sr=r;delete pd.sitNo;pd.food=Math.max(2,pd.food);pd.joy=Math.max(2,pd.joy);});sweep(p,true);save();try{SFX.coin();}catch(e){}return true;}
function hire(days,yes){const p=P(),pl=PLANS.find(x=>x.id===days);if(!pl)return;const pr=planPrice(p,pl);
 if((p.coins||0)<pr){toast(`🪙 You need ${pr-(p.coins||0)} more coins for that plan.`);return;}
 const box=document.getElementById('pcPlans');if(!yes&&box){box.innerHTML=`<div class="pc-confirm">Hire Nana Paws (<b>${pl.n}</b>) for 🪙 ${pr}?<div class="row" style="justify-content:flex-start;margin-top:6px"><button class="btn gold small" onclick="PetCare.hire(${days},1)">Yes, hire her</button><button class="btn ghost dark small" onclick="PetCare.redraw()">No</button></div></div>`;return;}
 const c=C(p),now=Date.now();p.coins-=pr;c.sit=Math.max(now,c.sit||0)+days*DAY;c.spent=(c.spent||0)+pr;c.hires=(c.hires||0)+1;
 const hp=homePets(p);c.rate=pr/Math.max(1,hp.length)/days;hp.forEach(id=>{const pd=petMood(pdOf(p,id));pd.sit=c.sit;pd.sr=c.rate;delete pd.sitNo;pd.food=Math.max(2,pd.food);pd.joy=Math.max(2,pd.joy);});
 sweep(p,true);save();try{SFX.coin();}catch(e){}toast(`🧶 Nana Paws is hired until ${when(c.sit)}!`);redraw();}
function rfeed(id){const p=P();const f=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];if(!f)return;const pd=pdOf(p,id);p.pantry[f.id]--;pd.rs=pd.rs||{};pd.rs.fed=1;save();try{SFX.coin();}catch(e){}toast(`${f.e} ${petById(id).name} gobbled it up!`);redraw();}
function rbuy(id){const p=P();if((p.coins||0)<10){toast('🪙 You need 10 coins.');return;}p.coins-=10;p.pantry.apple=(p.pantry.apple||0)+1;rfeed(id);}
function rplay(id){const p=P();const pd=pdOf(p,id);pd.rs=pd.rs||{};pd.rs.played=1;save();try{SFX.win();}catch(e){}toast(`🎾 ${petById(id).name} brought the ball back… and wagged the whole time!`);redraw();}
function home(id){const p=P(),c=C(p);const pd=pdOf(p,id);if(!(pd.rs&&pd.rs.fed&&pd.rs.played))return;if((p.coins||0)<RESCUE_FEE){toast(`🪙 You need ${RESCUE_FEE-(p.coins||0)} more coins.`);return;}
 p.coins-=RESCUE_FEE;delete pd.resc;delete pd.rs;pd.stg=0;pd.food=3;pd.joy=3;pd.t=Date.now();pd.cz=pd.t+3*H8;c.back=(c.back||0)+1;c.spent=(c.spent||0)+RESCUE_FEE;save();try{SFX.level();}catch(e){}
 nanaCard([`<div style="font-size:54px;text-align:center">${pe(id)}💛</div>${nm(id)} hasn't stopped wagging since you walked in. I think somebody missed you! Give ${nm(id)} a pat every few days and you'll be best friends forever.`],'Welcome home! 🏠',()=>redraw(),'rescue');}

/* ---------- top-bar dot, Quest Board card ---------- */
function dot(p){try{if(!p||!p.pets)return '';const o=counts(p);const k=o.packing.length?'pack':o.lonely.length?'lone':o.resc.length?'resc':'';return k?'care-'+k+dayKey():'';}catch(e){return '';}}
function homeCard(p){try{const o=counts(p);let t='',s='',e='';
 if(o.packing.length){e=pe(o.packing[0])+'🧳';t=`${petById(o.packing[0]).name} is packing a suitcase!`;s='Give a pat or a snack today 🥕';}
 else if(o.lonely.length){e='😢';t=o.lonely.length>1?`${o.lonely.length} pets are lonely`:`${petById(o.lonely[0]).name} is lonely`;s='Tap to visit the Pet Home';}
 else if(o.resc.length){e='🏡';t=o.resc.length>1?`${o.resc.length} pets at the Pet Rescue`:`${petById(o.resc[0]).name} is at the Pet Rescue`;s='Bring them home from the Pet Home';}
 if(!t)return '';return `<button class="hcard ${o.packing.length?'glow':''}" onclick="go('pethome')"><span class="pav"><span class="pe">${e}</span></span><div><b>${esc(t)}</b><small>${s}</small></div></button>`;}catch(ex){return '';}}

/* ---------- Parent Corner ---------- */
function parentSection(){if(typeof state==='undefined'||!state.players||!state.players.length)return '';const now=Date.now();
 const vac=Math.max(0,...state.players.map(p=>C(p).vac||0));
 return `<div class="panel pc-parent"><h3>🐾 Pet care</h3><p class="muted" style="margin-top:0">Pets that get no food and no play for about 5 days go to the Pet Rescue (they can always be brought home). Kids can hire Nana Paws, the pet sitter, for coins. Pets at Adventure Camp, the current battle buddy, and special prize pets never leave.</p>
 ${state.players.filter(p=>p.setup).map(p=>{const c=C(p),o=counts(p),on=ruleOn(p);return `<div class="row" style="justify-content:flex-start;align-items:center;gap:10px;margin:6px 0"><b style="min-width:90px">${esc(p.name)}</b><button class="btn small ${on?'green':'ghost dark'}" onclick="PetCare.setRule('${p.id}',${on?0:1})">${on?'✅ Pets can wander off':'⛔ Pets never leave'}</button><small class="muted">${o.lonely.length+o.packing.length?`${o.lonely.length+o.packing.length} lonely · `:''}${o.resc.length?`${o.resc.length} at Rescue · `:''}${sitUntil(p)?`sitter until ${when(sitUntil(p))} · `:''}spent 🪙 ${c.spent||0} on pet care${c.left?` · ${c.left} rescue${c.left>1?'s':''} so far`:''}</small></div>`;}).join('')}
 <div class="row" style="justify-content:flex-start;align-items:center;gap:8px;margin-top:10px"><b>🏖️ Vacation mode</b>${vac>now?`<span>Pets are paused until <b>${when(vac)}</b>.</span><button class="btn small ghost dark" onclick="PetCare.vacation(0)">End now</button>`:`<span class="muted">Family trip? Pause every kid's pets:</span>${[3,7,14].map(d=>`<button class="btn small" onclick="PetCare.vacation(${d})">${d} days</button>`).join('')}`}</div></div>`;}
function setRule(pid,on){const p=state.players.find(x=>x.id===pid);if(!p)return;C(p).rule=on?1:0;if(!on)owned(p).forEach(id=>{const pd=pdOf(p,id);pd.stg=0;});save();go('parent');}
function vacation(days){const now=Date.now(),until=days?now+days*DAY:0;
 state.players.forEach(p=>{if(!p.pets)return;const c=C(p);
  if(days){c.vac=until;owned(p).forEach(id=>{const pd=petMood(pdOf(p,id));pd.sit=Math.max(pd.sit||0,until);pd.food=Math.max(2,pd.food);pd.joy=Math.max(2,pd.joy);pd.stg=0;});}
  else{c.vac=0;const keep=sitUntil(p);owned(p).forEach(id=>{const pd=petMood(pdOf(p,id));if(pd.sit&&pd.sit>now)pd.sit=keep||now;});}});
 save();go('parent');toast(days?`🏖️ Vacation mode on for ${days} days.`:'Vacation mode ended.');}

/* ---------- styles ---------- */
let CSS=false;function css(){if(CSS)return;CSS=true;const st=document.createElement('style');st.textContent=`
.pc-wrap{display:grid;gap:0}.pc-panel{color:var(--ink)}.pc-panel h3{margin:0 0 6px}
.pc-list{display:grid;gap:4px}
.pc-hd,.pc-row{display:grid;grid-template-columns:44px minmax(110px,1fr) auto auto;align-items:center;gap:10px}
.pc-hd{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;padding:0 10px}
.pc-row{background:#f8f5ff;border-radius:12px;padding:6px 10px}
.pc-row .pc-h{display:flex;flex-direction:column;gap:1px;white-space:nowrap}
@media(max-width:560px){.pc-hd{display:none}.pc-pets .pc-row{grid-template-columns:38px 1fr auto;grid-template-areas:'e nm act' 'e h act';row-gap:0}.pc-pets .pc-e{grid-area:e}.pc-pets .pc-nm{grid-area:nm}.pc-pets .pc-h{grid-area:h;flex-direction:row;gap:6px}.pc-pets .pc-act{grid-area:act;flex-wrap:nowrap}.pc-pets .pc-l{display:none}.pc-pets .pc-act .btn{padding:8px 11px;font-size:18px}}
.pc-row.dim{opacity:.6}.pc-e{font-size:34px;line-height:1}
.pc-nm{min-width:0}.pc-nm b{margin-right:6px}.pc-h{font-size:13px;letter-spacing:-1px;margin-top:2px}
.pc-act{display:flex;gap:6px;flex-wrap:wrap}.pc-act .btn.pc-empty{background:#ced4da;color:#495057;box-shadow:0 4px 0 #adb5bd}.pc-act .btn[disabled]{opacity:.45}
.pc-chip{display:inline-block;font-size:12px;font-weight:700;border-radius:10px;padding:2px 8px;background:#eee9ff;color:#5f3dc4;vertical-align:2px}
.pc-chip.yel{background:#fff3bf;color:#8a6100}.pc-chip.red{background:#ffe3e3;color:#c92a2a}.pc-chip.camp{background:#e7f5ff;color:#1971c2}.pc-chip.nana{background:#fff0e0;color:#d9480f}.pc-chip.buddy{background:#fff0f6;color:#c2255c}
.pc-sithead{display:flex;gap:12px;align-items:center;margin-bottom:10px}.pc-nana svg{width:64px;height:78px}
.pc-plans{display:grid;gap:6px}
.pc-plan{display:flex;justify-content:space-between;align-items:center;gap:10px;border:2px solid #ffd8a8;background:#fff9f0;border-radius:14px;padding:10px 12px;font:inherit;font-size:16px;color:var(--ink);cursor:pointer;text-align:left}
.pc-plan:hover{background:#fff4e6}.pc-plan b{white-space:nowrap}.pc-plan em{white-space:nowrap;font-style:normal;font-size:12px;font-weight:700;color:#1e9a53;background:#d3f9d8;border-radius:8px;padding:1px 6px;margin-left:4px}
.pc-confirm{background:#fff9f0;border-radius:14px;padding:10px 12px}
.pc-steps{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:14px;margin-top:2px}
.pc-resc{border:3px solid #8ce99a}
.pc-bub{background:#fff4e6;border-color:#ffc078}.pc-bub>b{color:#d9480f}
.pc-rep{margin:6px 0;padding-left:0;list-style:none;display:grid;gap:4px}`;document.head.appendChild(st);}

/* ---------- wiring ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({screen:s=>{try{const p=typeof P==='function'?P():null;if(!p)return;if(s==='pethome')inject(); /* synchronous, so goStay() keeps the scroll spot after the panels are in */else if(['world','map','backpack','camp'].includes(s)){sweep(p,true);setTimeout(()=>showNews(p),900);}}catch(e){}}});
setInterval(()=>{try{const p=typeof P==='function'&&typeof state!=='undefined'&&state&&state.cur?P():null;if(p)sweep(p);}catch(e){}},60e3);
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
function offerNow(){const p=P(),su=sitUntil(p);if(!su)return;homePets(p).forEach(id=>{const pd=pdOf(p,id);if(pd.sitNo===su)delete pd.sitNo;});const c=C(p);c.news=c.news.filter(n=>n.k!=='offer');c.news.unshift({k:'offer',t:Date.now()});showing=false;showNews(p);}
window.PetCare={offer:offerNow,uncovered,sweep,counts,dot,homeCard,rescued,pat,snack,hire,rfeed,rbuy,rplay,home,setRule,vacation,redraw,ruleOn,canLeave,PRICE,RESCUE_FEE,_C:C};
})();
