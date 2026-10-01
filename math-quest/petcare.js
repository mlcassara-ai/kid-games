/* PET CARE — Nana Paws the pet sitter, lonely-pet warnings and the Pet Rescue.
   • Hearts drop one every 8 hours (index.html petMood). When a pet's tummy AND happy hearts are both at zero it gets lonely:
     counted in PLAY days (days the kid opens the game): play days 1–2 at zero = 😢 lonely (yellow !), day 3 = 🧳 packing (red !!), day 4 = the 🏡 Pet Rescue.
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
/* the pets Nana is paid to watch: not the battle buddy or special pets, which can never leave anyway */
const sitPets=p=>homePets(p).filter(id=>id!==p.pet&&!special(id));
const sitUntil=p=>{const c=C(p);return c.sit&&c.sit>Date.now()?c.sit:0;};
const when=t=>new Date(t).toLocaleString([],{weekday:'short',hour:'numeric',minute:'2-digit'});

/* ---------- the daily check ---------- */
function stageOf(p,id){const pd=pdOf(p,id);return canLeave(p,id)?(pd.stg||0):0;}
function sweep(p,quiet){if(!p||!p.setup||!p.pets||!p.pets.length)return;const c=C(p),now=Date.now();let ch=false;
 if(!c.v){c.v=1;c.lastSeen=now;owned(p).forEach(id=>{const pd=petMood(pdOf(p,id));if(pd.food<3)pd.food=3;if(pd.joy<3)pd.joy=3;pd.t=now;});c.intro=1;ch=true;}
 const su=sitUntil(p);
 /* pets that went to Adventure Camp while Nana was paid to watch them: she gives back the unused days and takes them off her list */
 const cred=[];owned(p).filter(id=>atCamp(p,id)).forEach(id=>{const pd=pdOf(p,id);const paid=Math.min(pd.sit||0,pd.spu||c.sit||0); /* only the days actually PAID for: free Vacation-mode days are never refunded */if(pd.sr&&pd.sit&&pd.sit>now){const cr=paid>now?Math.round(pd.sr*(paid-now)/DAY):0;if(cr>0){p.coins=(p.coins||0)+cr;c.spent=Math.max(0,(c.spent||0)-cr);c.credit=(c.credit||0)+cr;cred.push([id,cr]);}delete pd.sit;delete pd.sr;delete pd.spu;ch=true;}});
 if(cred.length)c.news.push({k:'credit',list:cred,t:now});
 /* during Vacation mode every pet is covered for free */
 const vac=c.vac&&c.vac>now?c.vac:0;
 homePets(p).forEach(id=>{const pd=pdOf(p,id);
  if(vac&&(pd.sit||0)<vac){petMood(pd);pd.sit=vac;pd.food=Math.max(2,pd.food);pd.joy=Math.max(2,pd.joy);ch=true;}
  petMood(pd);
  if(!canLeave(p,id)){if(pd.stg){pd.stg=0;ch=true;}return;}
  if(pd.food>0||pd.joy>0){let z=pd.t+Math.max(pd.food,pd.joy)*H8;if(pd.sit&&pd.sit>now)z=Math.max(z,pd.sit+2*H8);if(Math.abs((pd.cz||0)-z)>6e4||pd.stg||pd.lz){pd.cz=z;pd.stg=0;pd.lz=0;delete pd.lzd;ch=true;}return;}
  if(!pd.cz||pd.cz>now){pd.cz=now;ch=true;}
  /* loneliness counts the days the kid actually PLAYS, not calendar days, so a weekend-only player never comes back to an empty Pet Home.
     1st–2nd play day with no care = lonely, 3rd = packing, 4th play day ignored = off to the Rescue (and never within 4 real days). */
  const today=dayKey();if(pd.lzd!==today){pd.lz=(pd.lz||0)+1;pd.lzd=today;ch=true;}
  const d=(now-pd.cz)/DAY,stg=pd.lz>=4&&d>=4?3:pd.lz>=3?2:1;
  if(stg===3){pd.resc=now;pd.stg=0;pd.rs={};c.news.push({k:'left',id,t:now});c.left=(c.left||0)+1;
   try{if(p.adv&&p.adv.crew)p.adv.crew=p.adv.crew.filter(x=>x!==id);}catch(e){}ch=true;return;}
  if(pd.stg!==stg){pd.stg=stg;ch=true;}});
 /* Sunday evening: Nana offers (once a week) to watch the pets through the school week */
 if(weekAskOk(p)&&!c.news.some(n=>n.k==='week')){c.news.push({k:'week',t:now});ch=true;}
 /* pets at home that Nana isn't watching while she's hired (back from camp, just hatched): she offers, once per booking */
 if(su&&!c.news.some(n=>n.k==='offer')&&uncovered(p).length){c.news.push({k:'offer',t:now});ch=true;}
 // sitter report after an absence she covered
 if(c.lastSeen&&now-c.lastSeen>12*3600e3&&c.sit&&c.sit>c.lastSeen&&c.reported!==c.sit&&owned(p).length){
  /* only the pets she was really watching while the kid was away (not the buddy, special pets, or pets at camp) */
  const cov=owned(p).filter(id=>!rescued(p,id)&&!atCamp(p,id)&&(pdOf(p,id).sit||0)>c.lastSeen);
  if(cov.length){c.news.push({k:'report',t:now,ids:cov,until:c.sit});ch=true;}c.reported=c.sit;}
 c.lastSeen=now;
 if(ch){try{save();}catch(e){}}
 if(!quiet)showNews(p);}
function uncovered(p){const su=sitUntil(p);if(!su)return [];return sitPets(p).filter(id=>{const pd=pdOf(p,id);return (pd.sit||0)<su&&pd.sitNo!==su;});}
function offerCost(p,ids){const c=C(p),su=sitUntil(p);return Math.max(1,Math.ceil((c.rate||PRICE)*ids.length*(su-Date.now())/DAY));}
function counts(p){const o={lonely:[],packing:[],resc:owned(p).filter(id=>rescued(p,id))};homePets(p).forEach(id=>{const s=stageOf(p,id);if(s===1)o.lonely.push(id);if(s===2)o.packing.push(id);});return o;}

/* ---------- news popups (a pet left, the sitter's report, the intro) ---------- */
let showing=false,retryT=0;
function busy(){try{return !!(document.querySelector('#modal.show')||window.trollBusy||document.querySelector('.tr-root')||document.querySelector('.adv-walker')||(window.Adv&&typeof Adv.busy==='function'&&Adv.busy()));}catch(e){return false;}}
/* something else is on screen: try again in a moment, once it's gone */
function later(p){if(retryT)return;retryT=setTimeout(()=>{retryT=0;try{const q=typeof P==='function'?P():null;if(q&&q.id===p.id)showNews(q);}catch(e){}},1000);}
/* 🚪 the game's visitor queue (index.html MQ_VISIT): Nana only takes a turn while her card is open, and gives it back when it closes */
const VQ=()=>{const v=window.MQ_VISIT;return v&&typeof v.claim==='function'?v:null;};
const standing=v=>{try{return ['principal','quartz','ozzy'].includes(v.who())&&!document.querySelector('#modal.show')&&!window.trollBusy;}catch(e){return false;}};
const nanaUp=()=>!!document.querySelector('#modal.show .pc-bub');
let NCL=false,ND=0; /* NCL: this call (or one it made) took the slot */
function showNews(p){if(!ND)NCL=false;ND++;try{return showNews0(p);}finally{ND--;if(!ND){try{const v=VQ();if(v&&NCL&&v.who()==='nana'){if(nanaUp())v.watch('nana',nanaUp,0);else v.release('nana');}}catch(e){}NCL=false;}}}
function showNews0(p){if(showing&&!document.querySelector('#modal.show'))showing=false; /* its card was closed some other way */
 if(showing||typeof curScreen==='undefined'||!['world','map','pethome','backpack','camp'].includes(curScreen))return;const c=C(p);
 if(busy()){if(c.news.length||c.intro===1)later(p);return;}
 if(!c.news.length&&c.intro!==1)return;
 {const v=VQ();if(v){if(v.claim('nana',10*60e3))NCL=true;
  /* someone only STANDING on the World map (Principal Wise waiting, Dr. Quartz / Ozzy on their way) isn't on this screen: Nana doesn't wait for them here */
  else if(!(curScreen!=='world'&&standing(v))){v.wait('nana',()=>{try{const q=P();if(q&&q.id===p.id)showNews(q);}catch(e){}});return;}}}
 if(c.intro===1){c.intro=2;save();showing=true;return nanaCard(ruleOn(p)?[`Hello, dear! I'm <b>Nana Paws</b>, the village pet sitter. 🐾`,`Pets need love every few days: a pat, a snack or a game. If a pet goes too long with <b>no food and no fun</b>, it gets lonely, and after a few days it goes to stay at the <b>🏡 Pet Rescue</b>.`,`Busy week coming up? <b>Hire me in the Pet Home</b> (tap my picture at the bottom) and I'll keep everyone fed and happy while you're away. Pets on camp adventures and your battle buddy are always fine!`]:[`Hello, dear! I'm <b>Nana Paws</b>, the village pet sitter. 🐾`,`If you're going to be away for a while, <b>hire me in the Pet Home</b> and I'll keep your pets fed and happy until you're back!`],'Nice to meet you! 👋',()=>{showing=false;});}
 const n=c.news.shift();if(!n)return;save();showing=true;
 if(n.k==='left')return nanaCard([`<div style="font-size:54px;text-align:center">${pe(n.id)}🧳</div><b>${nm(n.id)}</b> felt lonely and went to stay at the <b>🏡 Pet Rescue</b> for a while.`,`Don't worry: ${nm(n.id)} is safe, warm and fed there. Ranger Juniper is taking good care of ${nm(n.id)}. You can bring ${nm(n.id)} home from the <b>Pet Home</b> any time!`],'Go to the Pet Home 🏠',()=>{showing=false;go('pethome');},'rescue');
 if(n.k==='credit'){const tot=n.list.reduce((a,x)=>a+x[1],0);const names=n.list.map(x=>`${pe(x[0])} <b>${nm(x[0])}</b>`).join(', ');
  return nanaCard([`I see ${names} ${n.list.length>1?'went':'went'} off to <b>Adventure Camp</b>! Since I won't need to look after ${n.list.length>1?'them':'that one'}, here's <b>🪙 ${tot}</b> back for the days you already paid for. 💛`,`When ${n.list.length>1?'they get':'it gets'} home, I'll ask if you want me to keep watching. If ${n.list.length>1?'they go':'it goes'} right back out to camp, I won't need to!`],'Thanks, Nana! 💛',()=>{showing=false;});}
 if(n.k==='offer'){const ids=uncovered(p);if(!ids.length){showing=false;return;}const su=sitUntil(p);const left=(su-Date.now())/DAY;const dl=left<1?'less than a day':`about ${Math.round(left)} day${Math.round(left)===1?'':'s'}`;const cost=offerCost(p,ids);
  modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${NANA}</div><div class="qz-bub pc-bub"><b>🐾 Nana Paws</b><div>Welcome home, ${ids.map(id=>`${pe(id)} <b>${nm(id)}</b>`).join(', ')}! 🏡<br><br>I'm still watching your other pets for <b>${dl}</b>. You can look after ${ids.length>1?'these ones':'this one'} yourself, or I'd be happy to watch ${ids.length>1?'them':'it'} too until then for <b>🪙 ${cost}</b>.${ids.length>1||true?`<br><small class="muted">If ${ids.length>1?'they head':'it heads'} back out to camp, you won't need me for ${ids.length>1?'them':'it'}.</small>`:''}</div></div></div>
   <div class="row"><button class="btn ghost dark" id="pcNo">No thanks, I'll care for ${ids.length>1?'them':'it'}</button><button class="btn gold big" id="pcYes">Yes, please · 🪙 ${cost}</button></div></div>`);
  document.getElementById('pcNo').onclick=()=>{ids.forEach(id=>{pdOf(p,id).sitNo=su;});save();closeModal();showing=false;toast('🐾 Nana Paws: "Okay, dear! Give them lots of pats."');};
  document.getElementById('pcYes').onclick=()=>{if(!cover(p,ids,cost)){toast(`🪙 You need ${cost-(p.coins||0)} more coins.`);return;}closeModal();showing=false;toast(`🧶 Nana Paws is watching ${ids.length} more pet${ids.length>1?'s':''} until ${when(su)}!`);if(typeof curScreen!=='undefined'&&curScreen==='pethome')redraw();};return;}
 if(n.k==='report')return report(p,n);
 if(n.k==='week'){if(!weekAskOk(p)){showing=false;return showNews(p);}return weekAsk(p);}
 showing=false;}
/* ---------- "Going away?" Sunday evening, once a week: kids mostly play on weekends, so Nana offers to cover the school week ---------- */
const wkKey=()=>{try{return weekKey();}catch(e){return dayKey();}};
function weekAskOk(p,t){try{if(!p||!p.setup||!p.pets||!p.pets.length)return false;const d=new Date(t||Date.now());if(d.getDay()!==0||d.getHours()<16)return false;
 const c=C(p);if(c.wk===wkKey()||c.intro===1)return false;if(!ruleOn(p)||sitUntil(p)||(c.vac&&c.vac>Date.now()))return false;
 return sitPets(p).some(id=>canLeave(p,id));}catch(e){return false;}}
/* the school-week plan's price, but she stays until Saturday morning, when weekend players are back */
function satMorning(){const d=new Date();d.setDate(d.getDate()+((6-d.getDay()+7)%7||7));d.setHours(10,0,0,0);return d.getTime();}
function weekAsk(p,bye){css();const c=C(p);c.wk=wkKey();c.news=c.news.filter(n=>n.k!=='week');save();showing=true;
 const pl=PLANS.find(x=>x.id===5),pr=planPrice(p,pl),ids=sitPets(p).filter(id=>canLeave(p,id)),until=satMorning(),short=Math.max(0,pr-(p.coins||0));
 const first=esc(String(p.name||'').split(' ')[0]);
 modal(`<div class="mcard qz-card pc-week"><div class="qz-row"><div class="qz-av">${NANA}</div><div class="qz-bub pc-bub"><b>🐾 Nana Paws</b><div>${bye?`Before you go, ${first}! `:`Hello, ${first}! `}📚 Busy school week ahead?<br><br>Want me to watch your pets until <b>Saturday</b>? I'll make sure ${ids.length>1?`all ${ids.length} of them get`:`${nm(ids[0])} gets`} breakfast and a good scratch behind the ears.
  <div class="pc-wkpets">${ids.slice(0,12).map(pe).join('')}${ids.length>12?' …':''}</div>
  <small class="muted">📅 School week plan: <b>🪙 ${pr}</b> · until ${when(until)} · you have 🪙 ${p.coins||0}</small></div></div></div>
  <div class="row"><button class="btn ghost dark" id="pcWkNo">No thanks</button><button class="btn ${short?'pc-empty':'gold'} big" id="pcWkYes">Yes, please · 🪙 ${pr}</button></div></div>`);
 const end=()=>{showing=false;window.visitorQuiet=Date.now()+60e3;};
 document.getElementById('pcWkNo').onclick=()=>{closeModal();end();toast('🐾 Nana Paws: "Okay, dear! Remember a pat or a snack every few days."');};
 document.getElementById('pcWkYes').onclick=()=>{if((p.coins||0)<pr){toast(`🪙 You need ${pr-(p.coins||0)} more coins. You can hire Nana for 1 day in the Pet Home.`);return;}
  hireUntil(p,pr,until);c.wkYes=(c.wkYes||0)+1;closeModal();end();toast(`🧶 Nana Paws is watching your pets until ${when(until)}!`);if(typeof curScreen!=='undefined'&&curScreen==='pethome')redraw();};}
/* the report tells the truth: stories only about the pets she watched, then how everyone is doing RIGHT NOW */
function report(p,n){const now=Date.now();
 const cov=(n.ids||sitPets(p).filter(id=>(pdOf(p,id).sit||0)>(n.t-DAY))).filter(id=>owned(p).includes(id)&&!rescued(p,id)&&!atCamp(p,id));
 if(!cov.length){showing=false;return;}
 const pick=cov.slice().sort(()=>Math.random()-.5).slice(0,3),lines=REPORT.slice().sort(()=>Math.random()-.5);
 const low=id=>{const pd=petMood(pdOf(p,id));return stageOf(p,id)>0||(pd.food<=1&&pd.joy<=1);};
 const list=a=>{const b=a.map(id=>`${pe(id)} <b>${nm(id)}</b>`);return b.length>1?b.slice(0,-1).join(', ')+' and '+b[b.length-1]:b[0];};
 const sad=cov.filter(low),other=homePets(p).filter(id=>!cov.includes(id)&&stageOf(p,id)>0);
 const more=cov.length-pick.length;
 let end=sad.length?`${list(sad)} ${sad.length>1?'are':'is'} missing you already. A pat or a snack would help! 💛`:`Everyone I watched was fed and happy.${sitUntil(p)?` I'm still here until ${when(sitUntil(p))}.`:''}`;
 if(other.length)end+=`<br>I wasn't watching ${list(other)}, and ${other.length>1?'they are':'that one is'} feeling lonely. Some love, please!`;
 return nanaCard([`<b>📋 Nana Paws' report</b><ul class="pc-rep">${pick.map((id,i)=>`<li>${pe(id)} ${lines[i].replace(/\{N\}/g,`<b>${nm(id)}</b>`)}</li>`).join('')}${more?`<li>🐾 …and ${more} more ${more>1?'were':'was'} good as gold.</li>`:''}</ul>${end}<br>Welcome home, dear!`],'Thanks, Nana! 💛',()=>{showing=false;if(typeof curScreen!=='undefined'&&curScreen==='pethome')redraw();});}
const REPORT=['{N} ate 4 carrots and chased a leaf all afternoon.','{N} napped in the sock drawer. Twice.','{N} learned to jump over a broom. Very proud.','{N} tried to eat the mail. We had a talk.','{N} chased a butterfly for an hour and never caught it. Still had a great time.','{N} sat by the window waiting for you.','{N} and I did a puzzle. {N} ate one piece.','{N} found a sunny spot and did not move for hours.','{N} sang along to my radio. Loudly.','{N} made friends with a very polite snail.','{N} hid my knitting. I still can\'t find it.','{N} did 10 zoomies around the garden and then slept like a log.'];
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
/* outfits: every pet can wear any outfit the kid owns (they're just for looks). The pet's face in the list shows it; tap the face to dress up. */
const gearOf=(p,id)=>{try{const a=pdOf(p,id).acc;return a&&(p.petGear||[]).includes(a)?PET_GEAR.find(g=>g.id===a):null;}catch(e){return null;}};
function petFace(p,id,camp){const g=gearOf(p,id),has=(p.petGear||[]).length&&typeof PET_GEAR!=='undefined';
 const face=`<span class="pav pc-pav"><span class="pe">${pe(id)}</span>${g?`<span class="pacc ${g.pos}">${g.show||g.e}</span>`:''}</span>`;
 return has&&!camp?`<button class="pc-e pc-dress" onclick="PetCare.dress('${id}')" title="Dress up ${nm(id)}" aria-label="Dress up ${nm(id)}">${face}<i class="pc-dr">👗</i></button>`:`<span class="pc-e">${face}</span>`;}
function dress(id,gid){const p=P();if(!p||!owned(p).includes(id)||rescued(p,id)||atCamp(p,id))return;const gear=PET_GEAR.filter(g=>(p.petGear||[]).includes(g.id));const pd=pdOf(p,id);
 if(gid!==undefined){if(gid===''||gear.some(g=>g.id===gid)){pd.acc=gid||null;save();try{SFX.tap();}catch(e){}}closeModal();refresh(id);if(gid)toast(`${pe(id)} ${petById(id).name} looks great in the ${PET_GEAR.find(g=>g.id===gid).name}!`);return;}
 if(!gear.length){toast('👗 No outfits yet! Get one in the Pet Shop, from an egg or on a camp trip.');return;}
 const cur=gearOf(p,id);
 modal(`<div class="mcard pc-dressm"><h2>👗 Dress up ${nm(id)}</h2><div class="pc-dprev">${petFace(p,id,true).replace('pc-e','pc-e big')}</div><p class="muted" style="margin:4px 0 10px">Every pet can wear any outfit you own. Pick one!</p>
  <div class="items">${gear.map(g=>`<button class="item ${cur&&cur.id===g.id?'eq':''}" onclick="PetCare.dress('${id}','${g.id}')"><div class="ie">${g.e}</div><div>${esc(g.name)}</div><div class="ip">${cur&&cur.id===g.id?'✓ Wearing':'Wear'}</div></button>`).join('')}${cur?`<button class="item" onclick="PetCare.dress('${id}','')"><div class="ie">🚫</div><div>Nothing</div><div class="ip">Take off</div></button>`:''}</div>
  <div class="row"><button class="btn ghost dark" onclick="closeModal()">Done</button></div></div>`);}
function listHTML(p){const ids=owned(p).filter(id=>!rescued(p,id));if(!ids.length)return '';const now=Date.now();
 const food=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];
 /* 🤗 Pat everyone / 🍎 Feed everyone: grey when there's nobody to pat or feed (or no snacks) */
 const hp=homePets(p),canPat=hp.filter(id=>{const pd=petMood(pdOf(p,id));return pd.joy<MOOD_MAX&&(!pd.patT||now-pd.patT>15*60e3);}).length,hungry=hp.filter(id=>petMood(pdOf(p,id)).food<MOOD_MAX).length;
 const allBtns=hp.length>1?`<div class="pc-all"><button class="btn small ${canPat?'':'ghost dark'}" onclick="PetCare.patAll()" title="${canPat?`Pat ${canPat} pet${canPat>1?'s':''}`:'Everyone is happy (or pats are recharging)'}">🤗 Pat everyone</button><button class="btn small ${food&&hungry?'green':'pc-empty'}" onclick="PetCare.feedAll()" title="${!food?'No snacks left':hungry?`Feed ${hungry} hungry pet${hungry>1?'s':''} the cheapest snacks`:'Everyone is full!'}">🍎 Feed everyone</button></div>`:'';
 /* steady order (rows never jump around when you pat or feed): buddy, then A–Z, pets at camp last */
 const grp=id=>id===p.pet?0:atCamp(p,id)?2:1;ids.sort((a,b)=>grp(a)-grp(b)||String(petById(a).name).localeCompare(petById(b).name));
 return `<div class="panel pc-panel pc-pets"><h3>🐾 All your pets <small class="muted">(${ids.length})</small></h3><p class="muted" style="margin:0 0 8px">Every pet needs a little love every few days: a pat, a snack or a game.${ruleOn(p)?' Lonely pets can wander off to the Pet Rescue.':''}</p>${allBtns}
 <div class="pc-list"><div class="pc-hd"><span></span><span>Pet</span><span>Tummy · Happy</span><span></span></div>${ids.map(id=>{const pd=petMood(pdOf(p,id));const camp=atCamp(p,id);const patOk=!pd.patT||now-pd.patT>15*60e3;
  return `<div class="pc-row${camp?' dim':''}" data-pet="${id}">${petFace(p,id,camp)}<div class="pc-nm"><b>${nm(id)}</b>${chip(p,id)}</div><div class="pc-h"><span title="Tummy">${hearts(pd.food,'🍗')}</span><span title="Happy">${hearts(pd.joy,'💖')}</span></div>
   ${camp?'':`<div class="pc-act"><button class="btn small ${patOk?'':'ghost dark'}" onclick="PetCare.pat('${id}')" aria-label="Pat">🤗<span class="pc-l"> Pat</span></button><button class="btn small ${!food||pd.food>=MOOD_MAX?'pc-empty':'green'}" onclick="PetCare.snack('${id}')" title="${pd.food>=MOOD_MAX?'Full!':food?food.name:'No snacks left'}" aria-label="Snack">${food?food.e:'🍽️'}<span class="pc-l"> Snack</span></button></div>`}</div>`;}).join('')}</div>
 ${food?'':'<p class="muted" style="margin:8px 0 0;font-size:14px">Out of snacks? Buy some in the Pet Shop below.</p>'}</div>`;}
function planPrice(p,pl){const n=Math.max(1,sitPets(p).length);return Math.round(n*PRICE*pl.id*(1-pl.off));}
let sitOpen=false;
function sitterHTML(p){const c=C(p),su=sitUntil(p),n=sitPets(p).length,camp=owned(p).filter(id=>atCamp(p,id)).length;
 const ask=su&&sitPets(p).some(id=>(pdOf(p,id).sit||0)<su); /* open by itself when there's a pet she could still watch */
 return `<details class="panel pc-panel pc-sit"${sitOpen||ask?' open':''} ontoggle="PetCare._sit(this.open)"><summary class="pc-sithead"><div class="pc-nana">${NANA}</div><div class="pc-sitt"><h3 style="margin:0">🧶 Nana Paws, Pet Sitter</h3>
  <p class="muted" style="margin:2px 0 0">${su?`<b style="color:#1e9a53">Hired until ${when(su)}.</b> Everyone stays at 2+ hearts.`:`Going away for a while? Tap to hire Nana to watch your pets.`}</p></div><span class="pc-caret" aria-hidden="true">▾</span></summary>
  ${su?'':`<p class="muted" style="margin:0 0 8px">"Off to school all week? I'll make sure everyone gets breakfast and a good scratch behind the ears."</p>`}
  <div class="pc-plans" id="pcPlans">${PLANS.map(pl=>{const pr=planPrice(p,pl);return `<button class="pc-plan" onclick="PetCare.hire(${pl.id})"><span>${pl.e} ${pl.n}${pl.off?` <em>${Math.round(pl.off*100)}% off</em>`:''}</span><b>🪙 ${pr}</b></button>`;}).join('')}</div>
  <p class="muted" style="margin:6px 0 0;font-size:14px">🪙 ${PRICE} per pet per day · ${n} pet${n===1?'':'s'} to watch (your battle buddy and special pets are always fine)${camp?` · ${camp} at camp (free)`:''}${su?' · Hiring again adds more days.':''} · You have 🪙 ${p.coins||0}</p><p class="muted" style="margin:4px 0 0;font-size:14px">🏕️ Sending a pet she's watching to camp? Nana gives back the unused days. When it gets home, she'll ask if you want her to watch it again.</p>${(()=>{const nc=su?sitPets(p).filter(id=>(pdOf(p,id).sit||0)<su).length:0;return nc?`<button class="btn small gold" style="margin-top:6px" onclick="PetCare.offer()">🧶 Ask Nana to watch ${nc} more pet${nc>1?'s':''}</button>`:'';})()}</details>`;}
function rescueHTML(p){const ids=owned(p).filter(id=>rescued(p,id));if(!ids.length)return '';
 const food=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];
 return `<div class="panel pc-panel pc-resc"><div class="pc-sithead"><div class="pc-nana">${RANGER}</div><div><h3 style="margin:0">🏡 Pet Rescue</h3><p class="muted" style="margin:2px 0 0">"${ids.length>1?'These pets are':nm(ids[0])+' is'} safe with me. Come bring ${ids.length>1?'them':'them'} home!" — Ranger Juniper</p></div></div>
  ${ids.map(id=>{const pd=pdOf(p,id);const rs=pd.rs||{};const ready=rs.fed&&rs.played;return `<div class="pc-row"><span class="pc-e">${pe(id)}</span><div class="pc-nm"><b>${nm(id)}</b><div class="pc-steps"><span>${rs.fed?'✅':'⬜'} Give a snack</span><span>${rs.played?'✅':'⬜'} Play a game</span><span>⬜ Adoption fee 🪙 ${RESCUE_FEE} <i class="muted" style="font-style:normal">or help Ranger Juniper with ${RM_N} math problems</i></span></div></div>
   <div class="pc-act">${rs.fed?'':food?`<button class="btn small green" onclick="PetCare.rfeed('${id}')">${food.e} Snack</button>`:`<button class="btn small gold" onclick="PetCare.rbuy('${id}')">🍎 Buy a snack · 🪙 10</button>`}${rs.played?'':`<button class="btn small" onclick="PetCare.rplay('${id}')">🎾 Play fetch</button>`}${ready?`<button class="btn small gold" onclick="PetCare.home('${id}')">🏠 Bring home · 🪙 ${RESCUE_FEE}</button>${(()=>{const t=rmTries(pd);return t<RM_TRIES?`<button class="btn small green" onclick="PetCare.rmath('${id}')">🧮 Help Juniper${t?' (1 more try today)':''} · free</button>`:`<button class="btn small ghost dark" onclick="PetCare.rmath('${id}')">🧮 Math help: try again tomorrow</button>`;})()}`:''}</div></div>`;}).join('')}</div>`;}
/* ---------- rescue by math: help Ranger Juniper with 5 problems at the kid's own level; 4 right brings the pet home for free.
   Two tries a day (a first go and one retry). Nothing is lost for a miss. ---------- */
const RM_N=5,RM_NEED=4,RM_TRIES=2;
const rmTries=pd=>pd.rm&&pd.rm.d===dayKey()?pd.rm.n:0;
function rmQ(p,seen){for(let k=0;k<25;k++){let op='add',L=1,q=null;try{op=typeof pickOpFair==='function'?pickOpFair(p):'add';L=Math.max(1,Math.min(typeof maxLv==='function'?maxLv(op):10,Math.floor(lvl(p,op))));}catch(e){}
  try{q=genQ(op,k>15?Math.min(L,10):L);}catch(e){q=null;}
  if(q&&q.text&&!q.tpl&&!q.story&&Number.isInteger(q.answer)&&Math.abs(q.answer)<1e7&&!seen.includes(q.text))return q;}
 const a=2+Math.floor(Math.random()*8),b=1+Math.floor(Math.random()*9);return {text:`${a} + ${b}`,answer:a+b,op:'add',L:1};}
let RM=null;
function rmath(id,go){const p=P();if(!p||!rescued(p,id))return;const pd=pdOf(p,id);const t=rmTries(pd);if(!(pd.rs&&pd.rs.fed&&pd.rs.played)){toast(`🏡 First give ${petById(id).name} a snack and play a game!`);return;}
 if(t>=RM_TRIES){nanaCard([`Thank you for helping today, dear! My helpers need a rest now. Come back <b>tomorrow</b> and we'll try again. 💚<br><small class="muted">Or you can bring ${nm(id)} home with the adoption fee any time.</small>`],'Okay! 👍',null,'rescue');return;}
 if(!go){modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${RANGER}</div><div class="qz-bub pc-bub pc-rbub"><b>🏡 Ranger Juniper</b><div>Oh, you want to help? Wonderful! I'm counting food bowls for all the rescue animals and I've got my numbers all mixed up. 🥣<br><br>Help me with <b>${RM_N} math problems</b>. Get <b>${RM_NEED}</b> right and ${pe(id)} ${nm(id)} can come home for <b>free</b>!${t?`<br><small class="muted">This is your last try for today.</small>`:''}</div></div></div>
  <div class="row"><button class="btn ghost dark" onclick="closeModal()">Not now</button><button class="btn green big" onclick="PetCare.rmath('${id}',1)">Let's go! 🧮</button></div></div>`);return;}
 pd.rm={d:dayKey(),n:t+1};save();
 const qs=[];for(let i=0;i<RM_N;i++)qs.push(rmQ(p,qs.map(q=>q.text)));
 RM={id,qs,i:0,right:0,inp:'',res:[],lock:false,msg:`Question 1! Take your time. 😊`};rmShow();
 document.removeEventListener('keydown',rmKey);document.addEventListener('keydown',rmKey);}
function rmKey(e){if(!RM||!document.querySelector('#modal.show .pc-rm'))return;if(/^[0-9]$/.test(e.key))rmPress(e.key);else if(e.key==='Backspace')rmPress('del');else if(e.key==='-')rmPress('neg');else if(e.key==='Enter')rmPress(RM.lock?'next':'go');else return;e.preventDefault();}
function rmShow(){if(!RM)return;css();const q=RM.qs[RM.i];
 modal(`<div class="mcard qz-card pc-rm"><div class="qz-row"><div class="qz-av">${RANGER}</div><div class="qz-bub pc-bub pc-rbub"><b>🏡 Ranger Juniper</b><div id="rmSay">${RM.msg}</div></div></div>
  <div class="pc-rmdots">${RM.qs.map((_,k)=>`<i class="${k<RM.res.length?(RM.res[k]?'ok':'no'):k===RM.i?'cur':''}"></i>`).join('')}<span>${pe(RM.id)} needs ${RM_NEED} of ${RM_N}</span></div>
  <div class="pc-rmq" id="rmQ">${q.text} = <span class="ansbox">${esc(RM.inp)||'?'}</span></div>
  <div class="pc-pad">${['7','8','9','4','5','6','1','2','3','neg','0','del'].map(k=>`<button data-k="${k}" onclick="PetCare._rm('${k}')">${k==='del'?'⌫':k==='neg'?'±':k}</button>`).join('')}</div>
  <div class="row"><button class="btn ghost dark small" onclick="PetCare._rm('stop')">Stop</button>${RM.lock?`<button class="btn gold big" id="rmNext" onclick="PetCare._rm('next')">${RM.i>=RM_N-1?'See how we did ➜':'Next ➜'}</button>`:`<button class="btn green big" id="rmGo" onclick="PetCare._rm('go')">✓ Answer</button>`}</div></div>`);}
function rmPress(k){if(!RM)return;const q=RM.qs[RM.i];
 if(k==='stop'){RM=null;closeModal();toast('🏡 Ranger Juniper: "No worries! Come back when you\'re ready."');return;}
 if(k==='next'){if(!RM.lock)return;RM.lock=false;RM.inp='';RM.i++;if(RM.i>=RM_N)return rmEnd();RM.msg=RM.i===RM_N-1?'Last one!':pick2(['Next one!','Here comes another!','You\'re doing great. Next!','Okay, next bowl!']);rmShow();return;}
 if(RM.lock)return;
 if(k==='go'){if(!RM.inp||RM.inp==='-')return;const v=parseInt(RM.inp,10);const ok=v===q.answer||!!(q.alt&&q.alt.includes(v));RM.res.push(ok);if(ok)RM.right++;
  try{ok?SFX.coin():SFX.tap();}catch(e){}
  RM.msg=ok?pick2(['✅ Yes! That\'s it!','✅ Perfect! One more bowl filled.','✅ You got it!','✅ Wow, super fast!']):`Not quite! It's <b>${q.answer}</b>. That one was tricky. 💚`;RM.lock=true;
  if(ok&&RM.i<RM_N-1){rmShow();setTimeout(()=>{if(RM&&RM.lock&&RM.res.length===RM.i+1)rmPress('next');},900);return;}rmShow();return;}
 if(k==='del')RM.inp=RM.inp.slice(0,-1);else if(k==='neg')RM.inp=RM.inp.startsWith('-')?RM.inp.slice(1):'-'+RM.inp;else if(/^\d$/.test(k)&&RM.inp.replace('-','').length<7)RM.inp=RM.inp==='0'?k:RM.inp==='-0'?'-'+k:RM.inp+k;
 const a=document.querySelector('#rmQ .ansbox');if(a)a.textContent=RM.inp||'?';}
const pick2=a=>a[Math.floor(Math.random()*a.length)];
function rmEnd(){const r=RM;RM=null;document.removeEventListener('keydown',rmKey);const p=P();if(!p||!r)return;const id=r.id,pd=pdOf(p,id);
 if(r.right>=RM_NEED){const c=C(p);c.mathBack=(c.mathBack||0)+1;return home(id,true,r.right);}
 const left=RM_TRIES-rmTries(pd);
 modal(`<div class="mcard qz-card"><div class="qz-row"><div class="qz-av">${RANGER}</div><div class="qz-bub pc-bub pc-rbub"><b>🏡 Ranger Juniper</b><div>You got <b>${r.right} out of ${RM_N}</b>. ${r.right>=RM_NEED-1?'So close!':'Thank you for helping!'} 💚 ${pe(id)} ${nm(id)} is cheering for you.<br><br>${left>0?`Want to try <b>one more time</b> today? You'll get new problems.`:`Let's try again <b>tomorrow</b>. ${nm(id)} will be right here, safe and warm.`}</div></div></div>
  <div class="row">${left>0?`<button class="btn ghost dark" onclick="closeModal()">Maybe later</button><button class="btn green big" onclick="PetCare.rmath('${id}',1)">Try again 🔁</button>`:`<button class="btn green big" onclick="closeModal();PetCare.redraw()">Okay! 👍</button>`}</div></div>`);}
function inject(){try{if(typeof curScreen==='undefined'||curScreen!=='pethome')return;const p=P();if(!p)return;sweep(p,true);css();
 const page=document.querySelector('#app .page');if(!page||page.querySelector('.pc-wrap'))return;const w=document.createElement('div');w.className='pc-wrap';
 w.innerHTML=listHTML(p)+rescueHTML(p);const s=document.createElement('div');s.className='pc-wrap pc-wrap2';s.innerHTML=sitterHTML(p);
 /* the page leads with the battle buddy, then all your pets (top of the right-hand column; on phones, right under the buddy).
    Nana Paws and her prices sit at the very bottom, folded up until you tap her. */
 const ph=page.querySelector('.pethome'),col=ph&&ph.children[1];
 if(col)col.prepend(w);else if(ph)ph.after(w);else page.appendChild(w);
 page.appendChild(s);}catch(e){console.warn('petcare',e);}}
function redraw(){const y=window.scrollY;go('pethome');window.scrollTo(0,y);}
/* update just the pet list (no page redraw, no jump) unless the battle buddy's big card also needs to change */
function refresh(id){const p=P();const el=document.querySelector('.pc-pets');if(!el||id===p.pet){redraw();return;}const y=window.scrollY;const t=document.createElement('div');t.innerHTML=listHTML(p);if(t.firstElementChild)el.replaceWith(t.firstElementChild);window.scrollTo(0,y);}

/* ---------- actions ---------- */
function pat(id){const p=P();if(!p.pets.includes(id)||rescued(p,id))return;const pd=petMood(pdOf(p,id));const now=Date.now();
 if(pd.patT&&now-pd.patT<=15*60e3){toast(`${pe(id)} ${nm(id).replace(/<[^>]+>/g,'')} loved that! Pats recharge in a few minutes.`);return;}
 pd.patT=now;if(pd.joy<MOOD_MAX)pd.joy++;const x=petById(id);try{petGain(p,x,.5);}catch(e){}try{SFX.tap();}catch(e){}sweep(p,true);save();toast(`💕 ${pe(id)} ${x.name} is happy!`);refresh(id);}
function snack(id){const p=P();const f=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];if(rescued(p,id))return;
 {const pd0=petMood(pdOf(p,id));if(pd0.food>=MOOD_MAX){toast(`${pe(id)} ${petById(id).name} is full! No snack needed right now. Try a pat instead 🤗`);return;}}
 if(!f){toast('🍽️ You need more snacks! Buy some in the Pet Shop below. 👇');try{SFX.tap();}catch(e){}const shop=[...document.querySelectorAll('.pethome .panel h3')].find(h=>/Pet Shop/.test(h.textContent));if(shop)shop.scrollIntoView({behavior:'smooth',block:'start'});return;}const pd=petMood(pdOf(p,id));
 if(pd.food>=MOOD_MAX){toast(`${pe(id)} ${petById(id).name} is full! No snack needed right now. Try a pat instead 🤗`);return;}
 p.pantry[f.id]--;pd.food=Math.min(MOOD_MAX,pd.food+f.food);pd.joy=Math.min(MOOD_MAX,pd.joy+(f.joy||0));try{petGain(p,petById(id),f.xp);}catch(e){}try{questEvent(p,'petcare',1);}catch(e){}try{SFX.coin();}catch(e){}sweep(p,true);save();toast(`${f.e} ${petById(id).name}: yum!`);refresh(id);}
/* one pat each for the pets at home that aren't full of joy (same as tapping each Pat button: +1 happy heart, a little pet XP, 15-minute recharge) */
function patAll(){const p=P();if(!p)return;const now=Date.now(),hp=homePets(p);
 const ids=hp.filter(id=>{const pd=petMood(pdOf(p,id));return pd.joy<MOOD_MAX&&(!pd.patT||now-pd.patT>15*60e3);});
 if(!ids.length){toast(hp.some(id=>pdOf(p,id).joy<MOOD_MAX)?'🤗 They loved those pats! Pats recharge in a few minutes.':'💖 Everyone is already full of joy!');return;}
 ids.forEach(id=>{const pd=pdOf(p,id);pd.patT=now;if(pd.joy<MOOD_MAX)pd.joy++;try{petGain(p,petById(id),.5);}catch(e){}});
 try{SFX.tap();}catch(e){}sweep(p,true);save();toast(`💕 You patted ${ids.length} pet${ids.length>1?'s':''}! ${ids.slice(0,8).map(pe).join('')}`);steady(p);}
/* one snack each for the pets that aren't full, hungriest first, always using the cheapest snack in the pantry */
function feedAll(){const p=P();if(!p)return;p.pantry=p.pantry||{};const cheap=()=>PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];
 const ids=homePets(p).filter(id=>petMood(pdOf(p,id)).food<MOOD_MAX).sort((a,b)=>pdOf(p,a).food-pdOf(p,b).food);
 if(!ids.length){toast('😋 Everyone is full! Try pats instead 🤗');return;}
 if(!cheap()){toast('🍽️ You need more snacks! Buy some in the Pet Shop below. 👇');try{SFX.tap();}catch(e){}const shop=[...document.querySelectorAll('.pethome .panel h3')].find(h=>/Pet Shop/.test(h.textContent));if(shop)shop.scrollIntoView({behavior:'smooth',block:'start'});return;}
 const fed=[],used={};for(const id of ids){const f=cheap();if(!f)break;const pd=pdOf(p,id);p.pantry[f.id]--;pd.food=Math.min(MOOD_MAX,pd.food+f.food);pd.joy=Math.min(MOOD_MAX,pd.joy+(f.joy||0));
  try{petGain(p,petById(id),f.xp);}catch(e){}try{questEvent(p,'petcare',1);}catch(e){}fed.push(id);used[f.e]=(used[f.e]||0)+1;}
 try{SFX.coin();}catch(e){}sweep(p,true);save();const left=ids.length-fed.length;
 toast(`😋 Yum! Fed ${fed.length} pet${fed.length>1?'s':''} (${Object.entries(used).map(([e,n])=>n+'× '+e).join(' ')})${left?` · out of snacks for ${left} more`:''}`);steady(p);}
/* after Pat/Feed everyone: swap in the new table in place (no page redraw, no scroll jump) and update the battle buddy's hearts too */
function steady(p){const el=document.querySelector('.pc-pets');if(!el){redraw();return;}const y=window.scrollY;const t=document.createElement('div');t.innerHTML=listHTML(p);if(t.firstElementChild)el.replaceWith(t.firstElementChild);
 try{const bud=p.pet&&homePets(p).includes(p.pet)?petMood(pdOf(p,p.pet)):null;const m=document.querySelectorAll('.phcard .mood');if(bud&&m.length>=2&&typeof pips==='function'){m[0].lastElementChild.innerHTML=pips(bud.food,'🍗');m[1].lastElementChild.innerHTML=pips(bud.joy,'💖');}
  /* the buddy's "Feed" panel: snack counts (and "Full!") */
  const fb=[...document.querySelectorAll('.pethome button.item[onclick^="feedPet("]')];fb.forEach(b=>{const id=(/feedPet\('(\w+)'/.exec(b.getAttribute('onclick'))||[])[1];const n=p.pantry[id]||0;if(!n){b.remove();return;}const sm=b.querySelector('small');if(sm)sm.textContent=`You have ${n}`;
   const full=bud&&bud.food>=MOOD_MAX,ip=b.querySelector('.ip');b.classList.toggle('need',!!full);if(ip){ip.textContent=full?'Full!':'Feed';ip.style.color=full?'#999':'#1e9a53';}});
  if(fb.length){const box=document.querySelector('.pethome .panel .items button.item[onclick^="feedPet("]');if(!box){const it=[...document.querySelectorAll('.pethome .panel h3')].find(h=>/^🍽️/.test(h.textContent));const pn=it&&it.parentElement.querySelector('.items');if(pn)pn.outerHTML='<p class="muted">Your food bag is empty. Buy some snacks below! 👇</p>';}}}catch(e){}
 window.scrollTo(0,y);}
function cover(p,ids,cost){const c=C(p),su=sitUntil(p);if(!su||(p.coins||0)<cost)return false;p.coins-=cost;c.spent=(c.spent||0)+cost;const r=c.rate||PRICE;
 ids.forEach(id=>{const pd=petMood(pdOf(p,id));pd.sit=su;pd.spu=su;pd.sr=r;delete pd.sitNo;pd.food=Math.max(2,pd.food);pd.joy=Math.max(2,pd.joy);});sweep(p,true);save();try{SFX.coin();}catch(e){}return true;}
function hire(days,yes){const p=P(),pl=PLANS.find(x=>x.id===days);if(!pl)return;const pr=planPrice(p,pl);
 if((p.coins||0)<pr){toast(`🪙 You need ${pr-(p.coins||0)} more coins for that plan.`);return;}
 const box=document.getElementById('pcPlans');if(!yes&&box){box.innerHTML=`<div class="pc-confirm">Hire Nana Paws (<b>${pl.n}</b>) for 🪙 ${pr}?<div class="row" style="justify-content:flex-start;margin-top:6px"><button class="btn gold small" onclick="PetCare.hire(${days},1)">Yes, hire her</button><button class="btn ghost dark small" onclick="PetCare.redraw()">No</button></div></div>`;return;}
 const c=C(p),now=Date.now();hireUntil(p,pr,Math.max(now,c.sit||0)+days*DAY);toast(`🧶 Nana Paws is hired until ${when(c.sit)}!`);redraw();}
function hireUntil(p,pr,until){const c=C(p),now=Date.now();const days=Math.max(.25,(until-Math.max(now,sitUntil(p)||now))/DAY);p.coins-=pr;c.sit=Math.max(until,c.sit||0);c.spent=(c.spent||0)+pr;c.hires=(c.hires||0)+1;
 const hp=sitPets(p);c.rate=pr/Math.max(1,hp.length)/days;hp.forEach(id=>{const pd=petMood(pdOf(p,id));pd.sit=c.sit;pd.spu=c.sit;pd.sr=c.rate;delete pd.sitNo;pd.food=Math.max(2,pd.food);pd.joy=Math.max(2,pd.joy);});
 sweep(p,true);save();try{SFX.coin();}catch(e){}}
function rfeed(id){const p=P();const f=PET_FOODS.filter(f=>(p.pantry[f.id]||0)>0&&f.food>0).sort((a,b)=>a.price-b.price)[0];if(!f)return;const pd=pdOf(p,id);p.pantry[f.id]--;pd.rs=pd.rs||{};pd.rs.fed=1;save();try{SFX.coin();}catch(e){}toast(`${f.e} ${petById(id).name} gobbled it up!`);redraw();}
function rbuy(id){const p=P();if((p.coins||0)<10){toast('🪙 You need 10 coins.');return;}p.coins-=10;p.pantry.apple=(p.pantry.apple||0)+1;rfeed(id);}
function rplay(id){const p=P();const pd=pdOf(p,id);pd.rs=pd.rs||{};pd.rs.played=1;save();try{SFX.win();}catch(e){}toast(`🎾 ${petById(id).name} brought the ball back… and wagged the whole time!`);redraw();}
function home(id,free,right){const p=P(),c=C(p);const pd=pdOf(p,id);if(!(pd.rs&&pd.rs.fed&&pd.rs.played))return;if(!free&&(p.coins||0)<RESCUE_FEE){toast(`🪙 You need ${RESCUE_FEE-(p.coins||0)} more coins. Or help Ranger Juniper with some math!`);return;}
 if(!free){p.coins-=RESCUE_FEE;c.spent=(c.spent||0)+RESCUE_FEE;}delete pd.resc;delete pd.rs;delete pd.rm;pd.stg=0;pd.food=3;pd.joy=3;pd.t=Date.now();pd.cz=pd.t+3*H8;c.back=(c.back||0)+1;save();try{SFX.level();}catch(e){}
 nanaCard([`<div style="font-size:54px;text-align:center">${pe(id)}💛</div>${free?`<b>${right} out of ${RM_N}!</b> Thank you, math helper! Every bowl is filled. 🥣<br><br>`:''}${nm(id)} hasn't stopped wagging since you walked in. I think somebody missed you! Give ${nm(id)} a pat every few days and you'll be best friends forever.`],'Welcome home! 🏠',()=>redraw(),'rescue');}

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
details.pc-sit>summary{list-style:none;cursor:pointer;min-height:48px;margin-bottom:0}details.pc-sit>summary::-webkit-details-marker{display:none}details.pc-sit[open]>summary{margin-bottom:10px}
.pc-sitt{flex:1;min-width:0}.pc-caret{font-size:22px;color:var(--muted);transition:transform .2s;flex:none;padding:0 4px}details.pc-sit[open] .pc-caret{transform:rotate(180deg)}
details.pc-sit:not([open]) .pc-nana svg{width:48px;height:58px}
.pc-plans{display:grid;gap:6px}
.pc-plan{display:flex;justify-content:space-between;align-items:center;gap:10px;border:2px solid #ffd8a8;background:#fff9f0;border-radius:14px;padding:10px 12px;font:inherit;font-size:16px;color:var(--ink);cursor:pointer;text-align:left}
.pc-plan:hover{background:#fff4e6}.pc-plan b{white-space:nowrap}.pc-plan em{white-space:nowrap;font-style:normal;font-size:12px;font-weight:700;color:#1e9a53;background:#d3f9d8;border-radius:8px;padding:1px 6px;margin-left:4px}
.pc-confirm{background:#fff9f0;border-radius:14px;padding:10px 12px}
.pc-steps{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:14px;margin-top:2px}
.pc-resc{border:3px solid #8ce99a}
.qz-bub.pc-bub{background:#fff4e6;border-color:#ffc078}.qz-bub.pc-bub>b{color:#d9480f}
.pc-rep{margin:6px 0;padding-left:0;list-style:none;display:grid;gap:4px}
.pc-all{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 8px}.pc-all .btn{flex:1 1 140px;margin:0}.pc-all .btn.pc-empty{background:#ced4da;color:#495057;box-shadow:0 4px 0 #adb5bd}
.pc-e .pav.pc-pav{width:auto;height:auto;background:none;box-shadow:none;border:0;display:inline-block;position:relative;font-size:inherit;line-height:1}.pc-e .pav.pc-pav .pe{font-size:inherit;line-height:1}
.pc-dress{position:relative;background:none;border:0;padding:0;cursor:pointer;font:inherit;font-size:34px;line-height:1;color:inherit}
.pc-dress .pc-dr{position:absolute;right:-6px;bottom:-4px;font-style:normal;font-size:13px;background:#fff;border-radius:50%;width:19px;height:19px;display:grid;place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.pc-dressm .pc-dprev{font-size:76px;line-height:1.2;margin-top:16px}.pc-dressm .pc-dprev .pc-e{font-size:76px}.pc-dressm .items{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}.pc-dressm .item{cursor:pointer}
.qz-bub.pc-bub.pc-rbub{background:#ebfbee;border-color:#8ce99a}.qz-bub.pc-bub.pc-rbub>b{color:#2b8a3e}
.pc-rmdots{display:flex;gap:6px;justify-content:center;align-items:center;margin:10px 0 4px;flex-wrap:wrap}.pc-rmdots i{width:16px;height:16px;border-radius:50%;background:#e9ecef;display:inline-block}.pc-rmdots i.cur{background:#ffd43b;box-shadow:0 0 0 3px #fff3bf}.pc-rmdots i.ok{background:#40c057}.pc-rmdots i.no{background:#ffa8a8}.pc-rmdots span{font-size:13px;color:var(--muted);margin-left:6px}
.pc-rmq{font-size:clamp(26px,7vw,38px);font-weight:700;margin:6px 0 10px;color:var(--ink)}
.pc-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:300px;margin:0 auto 8px}.pc-pad button{font:inherit;font-size:24px;font-weight:700;padding:9px 0;border-radius:14px;border:0;background:#f1f3f5;box-shadow:0 3px 0 #ced4da;color:var(--ink);cursor:pointer}.pc-pad button:active{transform:translateY(2px);box-shadow:0 1px 0 #ced4da}
@media(max-height:760px){.pc-rm .qz-av svg{width:56px;height:68px}.pc-rm .qz-av{flex-basis:56px}.pc-rm .qz-bub{font-size:15px;padding:6px 10px}.pc-pad button{padding:6px 0;font-size:21px}.pc-rmq{margin:2px 0 6px}}
.pc-wkpets{font-size:28px;letter-spacing:2px;margin:8px 0 4px;line-height:1.2}`;document.head.appendChild(st);}

/* ---------- wiring ---------- */
window.MQ_HOOKS=window.MQ_HOOKS||[];
let lastPid=null;
window.MQ_HOOKS.push({screen:s=>{try{
 /* finishing a session: the kid tapped Players on a Sunday evening without having seen the offer yet */
 if(s==='profiles'){const q=lastPid&&state.players.find(x=>x.id===lastPid);lastPid=null;if(q&&weekAskOk(q)&&!showing&&!busy())setTimeout(()=>{try{if(curScreen==='profiles'&&!showing&&!busy()&&weekAskOk(q))weekAsk(q,true);}catch(e){}},500);return;}
 const p=typeof P==='function'?P():null;if(!p)return;lastPid=p.id;if(s==='pethome')inject(); /* synchronous, so goStay() keeps the scroll spot after the panels are in */else if(['world','map','backpack','camp'].includes(s)){sweep(p,true);setTimeout(()=>showNews(p),900);}}catch(e){}}});
setInterval(()=>{try{const p=typeof P==='function'&&typeof state!=='undefined'&&state&&state.cur?P():null;if(p)sweep(p);}catch(e){}},60e3);
window.MQ_PARENT=window.MQ_PARENT||[];window.MQ_PARENT.push(parentSection);
function offerNow(){const p=P(),su=sitUntil(p);if(!su)return;homePets(p).forEach(id=>{const pd=pdOf(p,id);if(pd.sitNo===su)delete pd.sitNo;});const c=C(p);c.news=c.news.filter(n=>n.k!=='offer');c.news.unshift({k:'offer',t:Date.now()});showing=false;showNews(p);}
window.PetCare={_sit:v=>{sitOpen=!!v;},_weekOk:weekAskOk,_weekAsk:weekAsk,_satMorning:satMorning,patAll,feedAll,dress,rmath,_rm:k=>rmPress(k),_rmState:()=>RM,_busy:busy,offer:offerNow,uncovered,sweep,counts,dot,homeCard,rescued,pat,snack,hire,rfeed,rbuy,rplay,home,setRule,vacation,redraw,ruleOn,canLeave,PRICE,RESCUE_FEE,_C:C};
})();
