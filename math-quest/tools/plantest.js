/* Checks every grade-plan question maker in plan.js: node math-quest/tools/plantest.js [op] [grade]   (RUNS=1000 for a deep check). Must print RESULT: PASS. */
const fs=require('fs'),vm=require('vm');
const files=process.argv.slice(2).filter(f=>f.endsWith('.js'));const onlyOp=process.argv.find(a=>/^[a-z]+$/.test(a)&&!a.endsWith('.js'));const onlyG=+(process.argv.find(a=>/^\d$/.test(a))||0);
const ctx={window:{},console,Math,Number,String,Array,Object,JSON,Set,Map,Error,
 genQ:(op,L)=>({tpl:'{A}',answer:L,text:`old ${op} L${L}`,explain:'<p>old</p>',nudge:'<p>old</p>'}),petOf:()=>({name:'Peep'})};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../plan.js','utf8'),ctx);
for(const f of files)vm.runInContext(fs.readFileSync(require('path').resolve(f),'utf8'),ctx);
const PLAN=ctx.PLAN.PLAN;const RUNS=+(process.env.RUNS||200);const RN=['Bronze','Silver','Gold','Diamond','Legend'];let errs=0;
const strip=s=>String(s||'').replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g,'$1/$2').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const ans=q=>q.kind==='clock'?Math.floor(q.answer/100)+':'+String(q.answer%100).padStart(2,'0'):q.pick?q.pick[q.answer]:q.dp?(q.answer/Math.pow(10,q.dp)).toFixed(q.dp):q.answer;
for(const op of Object.keys(PLAN)){if(onlyOp&&op!==onlyOp)continue;
 for(const g of Object.keys(PLAN[op])){if(onlyG&&+g!==onlyG)continue;console.log(`\n== ${op} grade ${g} ==`);
  PLAN[op][g].forEach((list,r)=>{const seen=new Set();let dup=0;
   list.forEach((mk,k)=>{for(let i=0;i<RUNS;i++){let q;try{q=mk({p:{id:'t',name:'Sam',grade:+g},name:'Sam',pet:'your pet Peep',grade:+g,round:r+1});}catch(e){console.log(`  ERROR ${RN[r]} maker ${k}: ${e.message}`);errs++;break;}
     const bad=[];if(!q||typeof q!=='object')bad.push('no object');else{
      if(!Number.isInteger(q.answer))bad.push('answer not integer: '+q.answer);
      if(!String(q.tpl||'{A}').includes('{A}'))bad.push('tpl lacks {A}');
      if(q.pick&&!(q.answer>=0&&q.answer<q.pick.length))bad.push('pick answer out of range');
      if(q.pick&&new Set(q.pick).size!==q.pick.length)bad.push('duplicate pick labels');
      if(q.pick&&q.pick.length<2)bad.push('pick has <2 labels');
      if(q.answer<0&&!q.neg)bad.push('negative answer without neg');if(q.answer===0&&/how many more|how many fewer|how much more|how much less/i.test(String(q.prompt)))bad.push('zero answer to a how-many-more question');
      if(q.multi){if(!Array.isArray(q.ans)||q.ans.length<1)bad.push('multi needs ans');else if(q.ans.some(i=>!(Number.isInteger(i)&&i>=0&&i<q.multi.length)))bad.push('multi ans out of range');if(q.multi.length<3||q.multi.length>5)bad.push('multi needs 3-5 labels');if(q.answer!==1)bad.push('multi answer must be 1');}
      if(q.tf){if(!Array.isArray(q.tf)||q.tf.length<2||q.tf.length>4)bad.push('tf needs 2-4 rows');else if(q.tf.some(r=>typeof r.t!=='boolean'||!r.s))bad.push('tf row needs s and boolean t');if(q.answer!==1)bad.push('tf answer must be 1');}
      if(q.nlt){const L=q.nlt;const top=(L.hi-L.lo)*(L.den||1);if(!(Number.isInteger(L.lo)&&Number.isInteger(L.hi)&&L.hi>L.lo))bad.push('nlt lo/hi');if(!(Number.isInteger(L.ans)&&L.ans>=0&&L.ans<=top))bad.push('nlt ans out of range');if(q.answer!==1)bad.push('nlt answer must be 1');}
      if(q.plot){const P=q.plot;if(!(P.max>0&&P.max<=10))bad.push('plot max');if(!(Array.isArray(P.ans)&&P.ans.length===2&&P.ans.every(v=>Number.isInteger(v)&&v>=0&&v<=P.max)))bad.push('plot ans out of range');if(q.answer!==1)bad.push('plot answer must be 1');}
      if(!q.explain)bad.push('no explain');if(!q.nudge)bad.push('no nudge');
      if(/NaN|undefined|Infinity/.test(JSON.stringify(q)))bad.push('NaN/undefined in text');
      {const t=strip(q.prompt)+' '+strip(q.tpl);if(/(^|[.?!] )(the|your|a|an|he|she) [a-z]/.test(t.replace(/\{A\}/g,'')))bad.push('sentence starts lowercase: '+t.match(/(^|[.?!] )(the|your|a|an|he|she) [a-z]+/)[0]);
       if(/\b(\d*[02-9]|1\d)?(1th|2th|3th)\b/.test(t)||/\b(11st|12nd|13rd)\b/.test(t))bad.push('bad ordinal');
       if(/Coach Flex|Dr\. Quartz|Grumbleroot|the Elder Wiz|Gizmo|Ozzy|Grey Goblin/.test(t)&&!/Ms\. Rosa|Skyla|Nana Paws|Kind Teacher|Sam/.test(t)&&/\b(she|her)\b/.test(t))bad.push('she/her with a male character');
       if(/Ms\. Rosa|Skyla|Nana Paws|Kind Teacher/.test(t)&&!/Coach Flex|Dr\. Quartz|Grumbleroot|Elder Wiz|Gizmo|Ozzy|Grey Goblin|Sam/.test(t)&&/\b(he|his|him)\b/.test(t))bad.push('he/his with a female character');}}
     if(bad.length){console.log(`  BAD ${RN[r]} maker ${k}: ${bad.join('; ')} :: ${JSON.stringify(q).slice(0,300)}`);errs++;break;}
     const key=strip(q.prompt)+'|'+strip(q.tpl)+'|'+q.answer;if(i<40){if(seen.has(key))dup++;seen.add(key);}
    }});
   console.log(` ${RN[r]} (${list.length} kinds; ${dup} dup in first 40/kind):`);
   list.forEach((mk,k)=>{for(let i=0;i<2;i++){try{const q=mk({p:{id:'t',name:'Sam',grade:+g},name:'Sam',pet:'your pet Peep',grade:+g,round:r+1});console.log(`   [${k}${q.wp?' story':''}${q.pick?' pick':''}${q.dp?' dp':''}] ${strip(q.prompt)}  ${strip(q.tpl).replace('{A}','__')}${q.pick?'  ('+q.pick.map(strip).join(' | ')+')':''}   → ${strip(String(ans(q)))}`);}catch(e){}}});});}}
console.log(`\nRESULT: ${errs?'FAIL '+errs:'PASS'}`);
