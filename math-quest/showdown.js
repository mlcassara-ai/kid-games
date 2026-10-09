/* ================= ⚡ the Math Showdown: Gizmo, the Grey Goblin's Nephew (Oct 2026, the owner's idea and mockup) =================
   On the map Gizmo walks up and challenges the hero; Principal Wise hosts a Family-Feud-style face-off on a stage: both get the
   same question, the first right answer wins the round, first to 3 wins the match.
   - When: at most once a day (about 7 days in 10), 2–8 minutes into the map, through the MQ_VISIT queue (one visitor at a time),
     for heroes who have won 3 battles. "Not now" ends it for the day. Never by himself on the smoke-test page.
   - Questions: plain facts at the kid's own level, mostly their trickiest skill (weakOp), else a fair mix (pickOpFair).
   - Fair: Gizmo answers after p.sd.gt seconds (±25%), which follows the kid: faster after the kid wins a match, slower after a loss
     (2.5–14 s), so kids win about 2 in 3. About 1 in 7 of his buzzes is wrong, which gives the kid a free try (no clock).
     A wrong answer from the kid just shakes the pad: try again (his clock keeps running).
   - Cheating: about 1 match in 4 he sneaks out a calculator in one round; Principal Wise catches him and the kid gets the point.
   - Rewards: a win pays 🪙 50 and counts in p.sd.w (Me → Trophies; a milestone at 10); a loss or ✕ leaving takes nothing.
   Saved: p.sd = {day: last day he came, w: wins, l: losses, gt: his answer time}. Answers count in p.stats like any practice. */
(function(){
const O='#16151c',STEP=330,WIN_COINS=50,FIRST_TO=3;
const GIZMO=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><ellipse cx="60" cy="146" rx="30" ry="4" fill="rgba(0,0,0,.3)"/>
<path d="M44 118 L42 140 L56 140 L57 118Z M64 118 L64 140 L78 140 L76 118Z" fill="#5c5e66" stroke="#16151c" stroke-width="3" stroke-linejoin="round"/>
<path d="M36 138 h22 v6 h-24 Z" fill="#e03131" stroke="#16151c" stroke-width="2.5" stroke-linejoin="round"/><path d="M62 138 h22 l2 6 h-24 Z" fill="#4c6ef5" stroke="#16151c" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M30 78 Q28 112 38 122 Q60 128 82 122 Q92 112 90 78 Q60 68 30 78Z" fill="#3a3942" stroke="#16151c" stroke-width="3.2" stroke-linejoin="round"/>
<path d="M44 84 Q60 80 76 84 L74 104 Q60 108 46 104Z" fill="#4a4954"/><circle cx="60" cy="96" r="10" fill="#ffd43b" stroke="#16151c" stroke-width="2.5"/><text x="60" y="101" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="14" fill="#16151c">G</text>
<path d="M32 84 Q18 98 22 112" stroke="#16151c" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M32 84 Q18 98 22 112" stroke="#3a3942" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="22" cy="114" r="6" fill="#9a9ca5" stroke="#16151c" stroke-width="2.5"/>
<path d="M88 84 Q100 92 98 108" stroke="#16151c" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M88 84 Q100 92 98 108" stroke="#3a3942" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="98" cy="110" r="6" fill="#9a9ca5" stroke="#16151c" stroke-width="2.5"/>
<path d="M30 44 L6 30 L22 56 Z" fill="#9a9ca5" stroke="#16151c" stroke-width="3" stroke-linejoin="round"/><path d="M28 46 L14 38 L24 54Z" fill="#c9a4a4"/>
<path d="M90 44 L114 30 L98 56 Z" fill="#9a9ca5" stroke="#16151c" stroke-width="3" stroke-linejoin="round"/><path d="M92 46 L106 38 L96 54Z" fill="#c9a4a4"/>
<ellipse cx="60" cy="52" rx="32" ry="28" fill="#9a9ca5" stroke="#16151c" stroke-width="3.2"/><ellipse cx="50" cy="60" rx="22" ry="12" fill="#a3a5ad" opacity=".6"/>
<path d="M28 40 Q30 18 60 18 Q90 18 92 40 Q60 30 28 40Z" fill="#7048e8" stroke="#16151c" stroke-width="3" stroke-linejoin="round"/><path d="M28 40 Q16 40 10 46 Q22 48 32 44Z" fill="#5f3dc4" stroke="#16151c" stroke-width="2.5" stroke-linejoin="round"/><circle cx="60" cy="18" r="4" fill="#ffd43b" stroke="#16151c" stroke-width="2"/>
<path d="M42 44 l12 4 M78 44 l-12 4" stroke="#16151c" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="48" cy="54" rx="7" ry="8" fill="#ffe066" stroke="#16151c" stroke-width="2.5"/><ellipse cx="72" cy="54" rx="7" ry="8" fill="#ffe066" stroke="#16151c" stroke-width="2.5"/><circle cx="50" cy="56" r="3" fill="#16151c"/><circle cx="74" cy="56" r="3" fill="#16151c"/>
<path d="M44 66 Q60 78 78 64" stroke="#16151c" stroke-width="3" fill="#2b2a30" stroke-linejoin="round"/><path d="M52 69 l3 5 l3 -4" fill="#fff" stroke="#16151c" stroke-width="1.5" stroke-linejoin="round"/>
<circle cx="40" cy="64" r="3.5" fill="#c9a4a4" opacity=".7"/><circle cx="82" cy="62" r="3.5" fill="#c9a4a4" opacity=".7"/></svg>`;
const GIMG=new Image();GIMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(GIZMO);
const SAY={hi:['Oi! You! Uncle says I\'ve got the fastest brain in the whole land. Bet I can beat you at math. Principal Wise can be the judge!','Oi! Rematch! I\'ve been practising my times tables… with my eyes closed!','You again? Perfect. Today I\'m TWICE as fast. Uncle said so.','Psst! Want to lose a math race? I\'m very good at winning them!'],
 later:['Scared, huh? Fine. Tomorrow, then!','Chicken! Bok bok! …See you tomorrow.','Pfft. I\'ll be back!'],
 win:['WHAT?! Uncle\'s gonna hear about this… Rematch tomorrow. And this time I\'m stretching first!','No fair! My brain was still asleep! …Rematch!','Grr! Lucky guess! Lucky five guesses!'],
 lose:['Too slow! Too slow! *does a little goblin dance*','Ha! Gizmo wins! Uncle will be SO proud!','Better luck next time, slowpoke! Hee hee!'],
 round:['Hmph!','Lucky!','I let you have that one.','Grrr…'],
 mine:['Ha! Mine!','Too easy!','Gizmo scores!','Yesss!'],
 wrong:['Oops! I mean… that was a test!','Wait, that was wrong?','Nobody saw that.']};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const today=()=>dayKey();
function S(p){p.sd=p.sd||{};const s=p.sd;s.w=s.w||0;s.l=s.l||0;if(!(s.gt>0))s.gt=7;return s;}
function due(p){if(!p||!p.setup||(p.battles||0)<3)return false;const s=S(p);return s.day!==today();}
/* ---------- on the map: he walks up (same way as Coach Flex) ---------- */
let G=null,ARMED=0,DONE_FOR=null,ROLL=null;
const blocked=(W,a,b,c,d)=>!!(window.MQ_GROUND&&MQ_GROUND.blocked&&MQ_GROUND.blocked(W,a,b,c,d));
const walk=t=>!!t&&!t.block&&!t.water&&!t.rail;
function field(W){const T=W.T,H=T.length,Wd=T[0].length,dist=new Int16Array(H*Wd).fill(-1),q=[W.hx+W.hy*Wd];dist[q[0]]=0;
 for(let i=0;i<q.length;i++){const k=q[i],x=k%Wd,y=(k-x)/Wd;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=Wd||ny>=H)continue;const n=nx+ny*Wd;if(dist[n]>=0||!walk(T[ny][nx])||blocked(W,x,y,nx,ny))continue;dist[n]=dist[k]+1;q.push(n);}}return {dist,Wd};}
function start(W,now){const F=field(W),c=[];for(let i=0;i<F.dist.length;i++){const d=F.dist[i];if(d>=7&&d<=10){const x=i%F.Wd,y=(i-x)/F.Wd,t=W.T[y][x];if(!t.gate&&!t.npc&&!t.chest)c.push([x,y]);}}
 if(!c.length)return false;const [x,y]=pick(c);G={x,y,fx:x,fy:y,mt:0,dir:x<=W.hx?1:-1,st:'come',t0:now,say:{t:pick(['Oi!','Hey, you!','Wait up!','Oi! Oi!']),at:now}};
 const p=P();S(p).day=today();try{save();}catch(e){}return true;}
function stepToward(W,now){const F=field(W);let best=null,bd=1e9;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=G.x+dx,ny=G.y+dy,t=W.T[ny]&&W.T[ny][nx];if(!walk(t)||blocked(W,G.x,G.y,nx,ny)||(nx===W.hx&&ny===W.hy))continue;const d=F.dist[nx+ny*F.Wd];if(d>=0&&d<bd){bd=d;best=[nx,ny];}}
 if(!best)return;G.fx=G.x;G.fy=G.y;if(best[0]!==G.x)G.dir=best[0]>G.x?1:-1;G.x=best[0];G.y=best[1];G.mt=now;}
function leave(now,t){if(!G)return;G.st='go';G.t0=now;G.say=t?{t,at:now}:null;G.dir=G.x>=W.hx?1:-1;}
function gone(){G=null;try{MQ_VISIT.release('gizmo');}catch(e){}}
function challenge(){const p=P();G.st='card';const first=!(S(p).w+S(p).l);
 modal(`<div class="mcard sd-card"><div class="sd-talk"><div class="sd-av">${GIZMO}</div><div class="sd-bub"><b>😈 Gizmo, the Grey Goblin's Nephew</b>${esc(first?SAY.hi[0]:pick(SAY.hi.slice(1)))}</div></div>
 <p class="muted" style="margin:8px 0 0">⚡ A Math Showdown, hosted by Principal Wise: the same question for both of you, first right answer wins the round, first to ${FIRST_TO} wins.</p>
 <div class="row"><button class="btn ghost dark" onclick="MQ_SHOWDOWN._later()">Not now</button><button class="btn gold big" onclick="MQ_SHOWDOWN._go()">You're on! ⚡</button></div></div>`);}
function tick(W,now){if(!G)return;if(curScreen!=='world'){if(G.st!=='card'&&G.st!=='match')gone();return;}if(G.mt&&now-G.mt<STEP)return;G.mt=0;
 if(G.st==='come'){const d=Math.max(Math.abs(G.x-W.hx),Math.abs(G.y-W.hy));
  if(d<=1&&!W.moving){if(document.querySelector('#modal.show'))return;G.dir=W.hx>=G.x?1:-1;G.st='stop';G.t0=now;G.say={t:'Oi! You!',at:now};return;}
  if(now-G.t0>90e3){leave(now,'Pfft. Too slow to catch!');return;}if(d>1)stepToward(W,now);return;}
 if(G.st==='stop'){if(now-G.t0>900&&!document.querySelector('#modal.show'))challenge();return;}
 if(G.st==='go'){if(now-G.t0>2600){gone();return;}const nx=G.x+G.dir,t=W.T[G.y]&&W.T[G.y][nx];if(walk(t)&&!blocked(W,G.x,G.y,nx,G.y)){G.fx=G.x;G.fy=G.y;G.x=nx;G.mt=now;}}}
function maybe(W,now){if(G||/[?&]smoke=/.test(location.search))return;const p=P();if(!p||DONE_FOR===p.id)return;
 if(!ARMED){ARMED=now+(120+Math.random()*360)*1000;return;}if(now<ARMED)return;
 if(!due(p)){DONE_FOR=p.id;return;}if(ROLL===null)ROLL=Math.random()<.7;if(!ROLL){DONE_FOR=p.id;return;}
 if(document.querySelector('#modal.show')||W.moving||window.__hideHero||(window.visitorQuiet||0)>Date.now()||(window.MQ_FOG&&MQ_FOG.on()))return;
 if(!window.MQ_VISIT||!MQ_VISIT.claim('gizmo',10*60e3)){ARMED=now+30e3;return;}
 if(!start(W,now)){MQ_VISIT.release('gizmo');ARMED=now+60e3;return;}DONE_FOR=p.id;}
function bub(ctx,ax,ay,ts,text,age){if(age>3000)return;const fs=Math.max(12,ts*.22);ctx.save();ctx.font=`800 ${fs}px Fredoka, sans-serif`;const pop=Math.max(0,Math.min(1,age/200)),fade=age>2500?Math.max(0,1-(age-2500)/500):1,tw=ctx.measureText(text).width,w=(tw+fs*1.2)*pop,h=fs*1.9*pop,x0=Math.max(4,Math.min(W.vw-w-4,ax-w/2)),y0=ay-h,r=h/2;
 ctx.globalAlpha=fade;ctx.fillStyle='#f1f3f5';ctx.strokeStyle=O;ctx.lineWidth=Math.max(1.5,ts*.03);ctx.beginPath();ctx.moveTo(x0+r,y0);ctx.lineTo(x0+w-r,y0);ctx.arc(x0+w-r,y0+r,r,-Math.PI/2,Math.PI/2);ctx.lineTo(x0+r,y0+h);ctx.arc(x0+r,y0+r,r,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();ctx.stroke();
 if(pop>=1){ctx.fillStyle='#2b2250';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x0+w/2,y0+h/2+fs*.05);}ctx.restore();}
let PUP_OFF=0;const puppet=()=>!!window.People&&!PUP_OFF; /* people.js draws the moving puppet; the old picture if it ever fails */
function frame(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T||curScreen!=='world')return;maybe(W,now);tick(W,now);if(!G||!GIMG.complete)return;
 const k=G.mt?Math.min(1,(now-G.mt)/STEP):1,dx=G.fx+(G.x-G.fx)*k,dy=G.fy+(G.y-G.fy)*k,sx=dx*ts-cx,sy=dy*ts-cy,fade=G.st==='go'?Math.max(0,1-(now-G.t0-1800)/800):Math.min(1,(now-G.t0)/400+.2);
 if(sx<-ts*2||sy<-ts*3||sx>W.vw+ts||sy>W.vh+ts)return;
 items.push({y:dy+.03,draw:()=>{const h=ts*1.15,w=h*120/150,bob=G.mt&&k<1?Math.abs(Math.sin(now/70))*3:Math.abs(Math.sin(now/260))*1.5;ctx.save();ctx.globalAlpha=fade;let ok=false;if(puppet()){try{People.put(ctx,'gizmo','gizmo',sx+ts/2,sy+ts*.97,ts,now,{x:dx,y:dy,talk:!!G.say,face:G.mt&&k<1?undefined:(W.hx<G.x?'left':W.hx>G.x?'right':undefined),h:1.45});ok=true;}catch(e){PUP_OFF=1;}}
  if(!ok){ctx.translate(sx+ts/2,0);ctx.scale(G.dir<0?-1:1,1);ctx.drawImage(GIMG,-w/2,sy+ts*.97-h-bob,w,h);}ctx.restore();}});
 if(G.say)items.push({y:1e6-2,draw:()=>bub(ctx,sx+ts/2,sy-ts*.3,ts,G.say.t,now-G.say.at)});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
/* ---------- the match ---------- */
let M=null;
const plain=q=>!!q&&!q.tpl&&!q.rev&&typeof q.answer==='number'&&q.answer>=0&&!!q.text&&/^\d[\d,.]*( [+−×÷\-] \d[\d,.]*)+$/.test(q.text);
function newQ(p){for(let k=0;k<30;k++){let op;try{op=k<12&&Math.random()<.6?weakOp(p):pickOpFair(p);}catch(e){op='add';}let q=null;try{q=genQ(op,Math.max(1,Math.min(10,lvl(p,op))));}catch(e){}if(plain(q))return q;}return genQ('add',Math.max(1,Math.min(10,lvl(p,'add'))));}
function record(p,q,ok){try{p.stats[q.op]=p.stats[q.op]||{r:0,w:0};p.stats[q.op][ok?'r':'w']++;const dk=today();p.daily=p.daily||{};p.daily[dk]=p.daily[dk]||{r:0,w:0};p.daily[dk][ok?'r':'w']++;}catch(e){}}
function begin(){const p=P();if(!p)return false;closeModal();css();const s=S(p);s.day=today();
 const el=document.createElement('div');el.id='sdOv';el.className='sd-ov';document.body.appendChild(el);
 M={me:0,gz:0,round:0,el,cheat:Math.random()<.25?2+Math.floor(Math.random()*2):-1,busy:true,tm:[],over:false};
 paint();host('Welcome to the ⚡ Math Showdown! First to 3 wins. Ready… set…');M.tm.push(setTimeout(nextRound,2200));try{save();}catch(e){}return true;}
function clearT(){(M&&M.tm||[]).forEach(clearTimeout);if(M)M.tm=[];}
function nextRound(){if(!M||M.over)return;clearT();const p=P();M.round++;M.q=newQ(p);M.inp='';M.free=false;M.done=false;M.busy=false;M.first=true;M.t0=performance.now();
 const g=S(p).gt*(.75+Math.random()*.5);M.gt=g;host('');gz('');paint();
 if(M.round===M.cheat){M.tm.push(setTimeout(cheat,Math.max(1200,g*500)));return;}
 M.tm.push(setTimeout(gizmoBuzz,g*1000));}
function gizmoBuzz(){if(!M||M.done)return;if(Math.random()<1/7){gz(pick(SAY.wrong));host('Wrong! Free try for you, '+esc(P().name)+'! Take your time.');M.free=true;try{SFX.wrong();}catch(e){}paint(true);return;}
 roundOver('gz');}
function cheat(){if(!M||M.done)return;M.done=true;M.calc=true;paint(true);try{SFX.wrong();}catch(e){}host('Gizmo! Is that a CALCULATOR?! 🟥 No calculators! Point to '+esc(P().name)+'!');gz('Uh-oh…');M.me++;M.tm.push(setTimeout(()=>{if(M)M.calc=false;after();},2600));}
function roundOver(who){if(!M||M.done)return;M.done=true;clearT();const q=M.q;
 if(who==='me'){M.me++;host(`${esc(q.text)} = ${q.answer}! Point to ${esc(P().name)}!`);gz(pick(SAY.round));try{SFX.correct();}catch(e){}}
 else{M.gz++;host(`${esc(q.text)} = ${q.answer}. Point to Gizmo!`);gz(pick(SAY.mine));try{SFX.wrong();}catch(e){}}
 paint(true);M.tm.push(setTimeout(after,1900));}
function after(){if(!M)return;if(M.me>=FIRST_TO||M.gz>=FIRST_TO){end(M.me>=FIRST_TO);return;}nextRound();}
function key(k){if(!M||M.done||M.busy)return;if(k==='del'){M.inp=M.inp.slice(0,-1);paint(true);return;}
 if(k!=='go'){if(M.inp.length<7)M.inp+=k;try{SFX.tap();}catch(e){}paint(true);return;}
 if(!M.inp)return;const v=parseInt(M.inp,10),q=M.q,ok=v===q.answer||!!(q.alt&&q.alt.includes(v));const p=P();if(M.first){record(p,q,ok);M.first=false;}
 if(ok){roundOver('me');return;}M.inp='';try{SFX.wrong();}catch(e){}paint(true);const pad=M.el.querySelector('.sd-pad');if(pad)pad.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:300});}
function end(won){const p=P(),s=S(p);M.over=true;clearT();
 if(won){s.w++;p.coins+=WIN_COINS;s.gt=Math.max(2.5,s.gt*.92);}else{s.l++;s.gt=Math.min(14,s.gt*1.1);}try{save();}catch(e){}try{won?SFX.win():SFX.wrong();}catch(e){}
 const body=won?`<div class="sd-rw"><div class="big">🏆</div><b>You win the Showdown!</b><small>🪙 ${WIN_COINS} · Showdown win #${s.w}</small></div><div class="row"><button class="btn gold big" onclick="MQ_SHOWDOWN._close()">Yes! 🎉</button></div>`
  :`<div class="sd-rw"><div class="big">🎓</div><small>Principal Wise: "Good try! Every round makes your brain faster. He'll be back for a rematch." Nothing is lost.</small></div><div class="row"><button class="btn ghost dark" onclick="MQ_SHOWDOWN._close()">Next time! 💪</button></div>`;
 M.el.querySelector('.sd-end').innerHTML=`<div class="mcard sd-card"><div class="sd-talk"><div class="sd-av">${GIZMO}</div><div class="sd-bub"><b>😈 Gizmo</b>${esc(pick(won?SAY.win:SAY.lose))}</div></div>${body}</div>`;M.el.querySelector('.sd-end').hidden=false;}
function close(){clearT();if(M&&M.el)M.el.remove();M=null;if(G){leave(performance.now(),'');}try{if(typeof curScreen!=='undefined'&&curScreen==='world')goStay('world');}catch(e){}}
function quit(){if(!M)return;if(M.over){close();return;}modal(`<div class="mcard"><h2>Leave the Showdown?</h2><p>Gizmo wins this one, but nothing is lost.</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Keep playing</button><button class="btn danger" onclick="closeModal();MQ_SHOWDOWN._forfeit()">Leave</button></div></div>`);}
function forfeit(){const p=P();if(p){const s=S(p);s.l++;try{save();}catch(e){}}close();}
let HOST='',GZ='';function host(t){HOST=t;const e=M&&M.el.querySelector('.sd-host');if(e){e.innerHTML=t;e.hidden=!t;}}function gz(t){GZ=t;const e=M&&M.el.querySelector('.sd-gzsay');if(e){e.textContent=t;e.hidden=!t;}}
function lights(n){return [0,1,2].map(i=>`<i class="${i<n?'on':''}"></i>`).join('');}
function paint(soft){if(!M)return;const p=P();const el=M.el;const hero=typeof heroSVG==='function'?heroSVG(p.look,{spell:p.spell}):'';const pw=typeof principalMapSVG==='function'?principalMapSVG():'🎓';
 if(!soft||!el.querySelector('.sd-stage')){el.innerHTML=`<div class="sd-stage"><div class="sd-val"></div><div class="sd-curt l"></div><div class="sd-curt r"></div><div class="sd-banner">⚡ MATH SHOWDOWN ⚡</div><div class="sd-floor"></div>
  <div class="sd-fig" style="left:12%;width:15%">${hero}</div><div class="sd-fig" style="left:50%;transform:translateX(-50%);width:12%;bottom:23%">${pw}</div><div class="sd-fig gz" style="right:12%;width:14%">${GIZMO}</div><span class="sd-calc" hidden>🧮</span>
  <div class="sd-pod me"><div class="nm">${esc(p.name)}</div><div class="sd-lights" data-k="me"></div></div><div class="sd-host-pod"></div><div class="sd-pod gzp"><div class="nm">Gizmo</div><div class="sd-lights" data-k="gz"></div></div>
  <div class="sd-q"><small></small><b></b></div><div class="sd-think"><span>Gizmo is thinking…</span><div class="bar"><i></i></div></div><div class="sd-gzsay" hidden></div><div class="sd-host" hidden></div>
  <button class="sd-x" type="button" onclick="MQ_SHOWDOWN._quit()" title="Leave">✕</button></div>
  <div class="sd-padwrap"><div class="sd-in"></div><div class="sd-pad">${['1','2','3','4','5','6','7','8','9','del','0','go'].map(k=>`<button type="button" class="${k==='go'?'ok':k==='del'?'del':''}" onpointerdown="event.preventDefault();MQ_SHOWDOWN._k('${k}')">${k==='del'?'⌫':k==='go'?'✓':k}</button>`).join('')}</div></div><div class="sd-end" hidden></div>`;host(HOST);gz(GZ);}
 el.querySelector('[data-k="me"]').innerHTML=lights(M.me);el.querySelector('[data-k="gz"]').innerHTML=lights(M.gz);
 const q=M.q;el.querySelector('.sd-q small').textContent=M.round?`Round ${M.round} · first to ${FIRST_TO} wins`:'Get ready!';el.querySelector('.sd-q b').textContent=q?`${q.text} = ?`:'⚡';
 el.querySelector('.sd-in').textContent=M.inp||'?';el.querySelector('.sd-calc').hidden=!M.calc;
 const th=el.querySelector('.sd-think');th.hidden=!(q&&!M.done&&!M.free&&M.cheat!==M.round);if(!th.hidden){const b=th.querySelector('.bar i');b.style.transition='none';b.style.width='0%';void b.offsetWidth;b.style.transition=`width ${M.gt}s linear`;b.style.width='100%';}}
document.addEventListener('keydown',e=>{if(!M||M.over||document.querySelector('#modal.show'))return;if(/^[0-9]$/.test(e.key)){key(e.key);e.preventDefault();e.stopPropagation();}else if(e.key==='Backspace'){key('del');e.preventDefault();e.stopPropagation();}else if(e.key==='Enter'){key('go');e.preventDefault();e.stopPropagation();}},true);
let CSSON=false;function css(){if(CSSON)return;CSSON=true;const st=document.createElement('style');st.textContent=`
.sd-card .sd-talk{display:flex;gap:12px;align-items:flex-end;text-align:left}.sd-av{flex:0 0 96px}.sd-av svg{width:96px;height:120px;display:block}
.sd-bub{flex:1;background:#f1f3f5;border:3px solid #5c5e66;border-radius:18px;padding:10px 14px;font-size:17px;line-height:1.4;color:#1f2340}.sd-bub b{display:block;color:#3a3942;font-size:14px}
.sd-rw{text-align:center;margin:10px 0 0}.sd-rw .big{font-size:52px}.sd-rw b{display:block;font-size:20px}.sd-rw small{color:#6a5fa0;display:block}
.sd-ov{position:fixed;inset:0;z-index:150;background:#1b1030;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:10px;overflow:auto}
.sd-stage{position:relative;width:min(100%,960px,calc((100vh - 230px)*1.6));aspect-ratio:16/10;border-radius:22px;overflow:hidden;border:4px solid #8fd3ff;background:linear-gradient(#5b2c83,#3b1d5c 60%,#2a1545);color:#fff;flex:none}
.sd-curt{position:absolute;top:0;bottom:0;width:13%;background:repeating-linear-gradient(90deg,#c92a2a 0 18px,#a51f1f 18px 36px);border:3px solid #16151c}.sd-curt.l{left:0;border-radius:0 0 40% 0}.sd-curt.r{right:0;border-radius:0 0 0 40%}
.sd-val{position:absolute;left:0;right:0;top:0;height:9%;background:repeating-linear-gradient(90deg,#e03131 0 40px,#c92a2a 40px 80px);border-bottom:4px solid #ffd43b;z-index:1}
.sd-banner{position:absolute;left:50%;top:10%;transform:translateX(-50%);background:#ffd43b;color:#3d2a00;border:4px solid #16151c;border-radius:14px;padding:2px 16px;font-weight:800;font-size:clamp(13px,2.4vw,22px);white-space:nowrap}
.sd-floor{position:absolute;left:0;right:0;bottom:0;height:22%;background:repeating-linear-gradient(90deg,#b07a46 0 60px,#9c6a3a 60px 120px);border-top:4px solid #16151c}
.sd-fig{position:absolute;bottom:21%}.sd-fig svg{display:block;width:100%;height:auto}
.sd-pod{position:absolute;bottom:4%;width:20%;height:24%;border:4px solid #16151c;border-radius:12px 12px 4px 4px;text-align:center;padding-top:6px}.sd-pod.me{left:9.5%;background:linear-gradient(#4c6ef5,#364fc7)}.sd-pod.gzp{right:9.5%;background:linear-gradient(#7d7f88,#5c5e66)}
.sd-pod .nm{font-weight:700;font-size:clamp(11px,1.8vw,17px)}.sd-lights{display:flex;gap:6px;justify-content:center;margin-top:6px}.sd-lights i{width:clamp(10px,1.8vw,18px);height:clamp(10px,1.8vw,18px);border-radius:50%;background:#1b1b2a;border:2px solid #16151c}.sd-lights i.on{background:#ffd43b;box-shadow:0 0 10px #ffd43b}
.sd-host-pod{position:absolute;left:50%;transform:translateX(-50%);bottom:4%;width:18%;height:16%;background:linear-gradient(#ffd43b,#f59f00);border:4px solid #16151c;border-radius:10px 10px 4px 4px}
.sd-q{position:absolute;left:50%;top:22%;transform:translateX(-50%);background:#fff;color:#2b2250;border:4px solid #16151c;border-radius:18px;padding:4px 22px;text-align:center;white-space:nowrap}.sd-q small{display:block;color:#6a5fa0;font-size:clamp(10px,1.5vw,14px)}.sd-q b{font-size:clamp(26px,5.5vw,52px)}
.sd-think{position:absolute;right:18%;top:24%;background:#f1f3f5;color:#3a3942;border:3px solid #16151c;border-radius:14px;padding:3px 10px;font-weight:700;font-size:clamp(10px,1.6vw,15px);min-width:22%}.sd-think .bar{height:6px;background:#0003;border-radius:4px;margin-top:3px;overflow:hidden}.sd-think .bar i{display:block;height:100%;width:0;background:#ff922b}
.sd-gzsay{position:absolute;right:6%;top:40%;background:#f1f3f5;color:#3a3942;border:3px solid #16151c;border-radius:14px;padding:3px 10px;font-weight:700;font-size:clamp(11px,1.7vw,16px);max-width:30%}
.sd-host{position:absolute;left:50%;top:42%;transform:translateX(-50%);background:#fff;color:#2b2250;border:4px solid #16151c;border-radius:16px;padding:4px 14px;font-weight:700;font-size:clamp(12px,1.9vw,18px);text-align:center;max-width:56%}
.sd-calc{position:absolute;z-index:3;right:13%;bottom:38%;font-size:clamp(20px,4vw,36px);transform:rotate(-12deg)}
.sd-x{position:absolute;right:10px;top:12%;z-index:2;background:rgba(0,0,0,.45);color:#fff;border:2px solid #fff8;border-radius:12px;min-width:44px;min-height:44px;font-size:18px;cursor:pointer}
.sd-padwrap{width:min(100%,520px);background:#fff;border-radius:18px;padding:8px 10px;flex:none}.sd-in{text-align:center;font-weight:800;font-size:26px;color:#7048e8;min-height:32px}
.sd-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}.sd-pad button{border:0;border-radius:12px;background:#f1edff;color:#2b2250;font:700 22px Fredoka,sans-serif;min-height:48px;box-shadow:0 3px 0 #d7cff5;cursor:pointer}.sd-pad .ok{background:#1a8049;color:#fff;box-shadow:0 3px 0 #0f5c33}.sd-pad .del{background:#ffe3e3}
.sd-end{position:fixed;inset:0;z-index:160;background:rgba(10,5,30,.7);display:grid;place-items:center;padding:12px}.sd-end[hidden]{display:none}
@media(max-width:600px){.sd-pad{grid-template-columns:repeat(4,1fr)}.sd-pad button{min-height:44px}}`;document.head.appendChild(st);}
css();
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{try{if(s==='profiles'){if(G)gone();ARMED=0;DONE_FOR=null;ROLL=null;}else if(s!=='world'&&G&&G.st!=='card'&&G.st!=='match')gone();}catch(e){}}});
window.MQ_SHOWDOWN={due,svg:GIZMO,SAY,state:()=>M,map:()=>G,
 visit:()=>{if(typeof W==='undefined'||!W)return false;G=null;return start(W,performance.now());},_tick:t=>tick(W,t||performance.now()),
 start:begin,_go:()=>{if(G)G.st='match';begin();},_later:()=>{closeModal();const p=P();if(p){S(p).day=today();try{save();}catch(e){}}leave(performance.now(),pick(SAY.later));},
 _k:key,_quit:quit,_forfeit:forfeit,_close:close,_next:nextRound,_gizmo:()=>{if(M&&!M.done)roundOver('gz');},_cheat:()=>{if(M){M.cheat=M.round;clearT();cheat();}}};
})();
