/* ================= Milestones (Oct 2026) =================
   The big rewards of the old quest-givers' lists (Elder Wiz, Professor Hoot, the Pet Keeper, Ms. Rosa, Principal Wise) became
   automatic milestones: reach one and its reward is paid straight away with a toast; they are listed in Me → Trophies.
   Worked out from what the save already counts (battles won, best streak, medals, stories, spelling words, lunches, pets,
   days played), so nothing new is tracked. Saved: p.ms = {d:{id:1}} for the ones already paid.
   The first time a hero is seen, milestones they had ALREADY reached are marked done without paying (their old quests paid
   for that progress), so nobody gets a sudden pile of coins. */
(function(){
const M=[
 ['b10','⚔️','Battle Rookie','Win 10 battles',p=>p.battles||0,10,{coins:100}],
 ['b50','⚔️','Monster Hunter','Win 50 battles',p=>p.battles||0,50,{coins:200,eggs:1}],
 ['b100','⚔️','Hundred Hero','Win 100 battles',p=>p.battles||0,100,{coins:300}],
 ['b250','⚔️','Battle Legend','Win 250 battles',p=>p.battles||0,250,{coins:500,eggs:1}],
 ['s8','🔥','Combo Master','Get 8 right in a row',p=>p.bestStreak||0,8,{coins:150}],
 ['s12','🔥','Unstoppable','Get 12 right in a row',p=>p.bestStreak||0,12,{coins:250}],
 ['s20','🔥','On Fire','Get 20 right in a row',p=>p.bestStreak||0,20,{coins:300,eggs:1}],
 ['m2','🥈','Silver Seeker','Earn a Silver medal in any world',best,2,{coins:250,eggs:1}],
 ['m3','🥇','Golden Hero','Earn a Gold medal in any world',best,3,{coins:300,eggs:1}],
 ['m4','💎','Diamond Mind','Earn a Diamond medal in any world',best,4,{coins:400,legend:1}],
 ['m5','👑','Living Legend','Earn a Legend medal in any world',best,5,{coins:600,legend:1}],
 ['r1','📚','Open a Book','Read a story in the Library',p=>(p.readLog||[]).length,1,{coins:60}],
 ['r5','📚','Bookworm','Read 5 stories',p=>(p.readLog||[]).length,5,{coins:150,eggs:1}],
 ['r20','📚','Deep Reader','Read 20 stories',p=>(p.readLog||[]).length,20,{coins:250}],
 ['w3','🐝','Word Collector','Learn 3 spelling words',words,3,{coins:120}],
 ['w10','🐝','Spelling Bee','Learn 10 spelling words',words,10,{coins:200}],
 ['l1','🍱','Lunch Time','Make a lunch in the Cafeteria',p=>p.cafePlates||0,1,{coins:80}],
 ['l5','🍱','Regular Customer','Make 5 lunches',p=>p.cafePlates||0,5,{coins:200,food:'cake'}],
 ['pm','🐾','Mighty Bond','Grow a pet all the way to Mighty',mighty,1,{coins:300,eggs:1}],
 ['sd1','⚡','Goblin Buster','Beat Gizmo in a Math Showdown',p=>(p.sd&&p.sd.w)||0,1,{coins:100}],
 ['sd10','⚡','Showdown Champion','Win 10 Math Showdowns',p=>(p.sd&&p.sd.w)||0,10,{coins:300,eggs:1}],
 ['d7','📅','Steady Hero','Play on 7 different days',p=>(p.days||[]).length,7,{coins:150}],
 ['d30','📅','Faithful Wizard','Play on 30 different days',p=>(p.days||[]).length,30,{coins:300,eggs:1}]];
function best(p){let b=0;try{ZONES.forEach(z=>{if(!z.event)b=Math.max(b,medal(p,z.id)||0);});}catch(e){}return b;}
function words(p){try{return Object.values(p.spellStats||{}).filter(s=>(s.s||0)>=2).length;}catch(e){return 0;}}
function mighty(p){try{return (p.pets||[]).some(id=>petLv(petData(p,id))>0)?1:0;}catch(e){return 0;}}
const val=(p,m)=>{try{return m[4](p)||0;}catch(e){return 0;}};
function rwText(r){const out=[];if(r.coins)out.push('🪙 '+r.coins);if(r.eggs)out.push('🥚 egg');if(r.legend)out.push('🌟 Legend egg');if(r.food){let f=null;try{f=PET_FOODS.find(x=>x.id===r.food);}catch(e){}out.push(f?f.e+' '+f.name:'a treat');}return out.join(' · ');}
function check(p){try{if(!p||!p.setup)return;if(!p.ms){p.ms={d:{}};M.forEach(m=>{if(val(p,m)>=m[5])p.ms.d[m[0]]=1;});return;}
 const got=[];M.forEach(m=>{if(p.ms.d[m[0]]||val(p,m)<m[5])return;p.ms.d[m[0]]=1;const r=m[6];
  if(r.coins)p.coins+=r.coins;if(r.eggs)p.eggs=(p.eggs||0)+r.eggs;if(r.legend)p.legendEggs=(p.legendEggs||0)+r.legend;if(r.food){p.pantry=p.pantry||{};p.pantry[r.food]=(p.pantry[r.food]||0)+1;}got.push(m);});
 if(!got.length)return;try{save();}catch(e){}
 got.forEach((m,i)=>setTimeout(()=>{try{toast(`🏅 Milestone: ${m[1]} ${m[2]}! ${rwText(m[6])}`);SFX.coin();}catch(e){}},1200+i*3500));}catch(e){}}
function html(p){try{check(p);const d=(p.ms&&p.ms.d)||{};const n=M.filter(m=>d[m[0]]).length;
 return `<div class="panel"><h3>🏅 Milestones <small class="muted" style="font-size:14px">${n} of ${M.length}</small></h3><div class="ms-grid">${M.map(m=>{const ok=!!d[m[0]],v=Math.min(val(p,m),m[5]);
  return `<div class="ms ${ok?'ok':''}"><b>${ok?m[1]:'🔒'}</b><span><b>${m[2]}</b><small>${m[3]}${ok?'':` · ${v} / ${m[5]}`}</small><small class="ms-r">${ok?'✓ ':''}${rwText(m[6])}</small></span></div>`;}).join('')}</div></div>`;}catch(e){return '';}}
const CSS=`.ms-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}.ms{display:flex;gap:8px;align-items:center;background:#f8f6ff;border-radius:12px;padding:8px;opacity:.75}
.ms.ok{background:#ebfbee;opacity:1}.ms>b{font-size:26px;flex:none;width:34px;text-align:center}.ms span{min-width:0}.ms span b{display:block;font-size:15px}.ms small{display:block;color:#6a5fa0;font-size:12.5px}.ms .ms-r{color:#9c6b00}`;
{const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:()=>{try{const p=typeof P==='function'&&typeof state!=='undefined'&&state.cur?P():null;if(p)check(p);}catch(e){}},battle:p=>{try{setTimeout(()=>check(P()),2500);}catch(e){}}});
window.Milestones={list:M,check,html,val:(p,id)=>{const m=M.find(x=>x[0]===id);return m?val(p,m):0;}};
})();
