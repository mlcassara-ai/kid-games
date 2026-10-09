/* ================= Coach Flex from the Fact Gym (Oct 2026) =================
   The owner's idea: a muscle man from the Fact Gym who comes looking for you on the map. Very rare on purpose:
   - he first comes once the hero reaches level COACH_LV and has never been to the Fact Gym (the invitation);
   - after that only when the hero hasn't been to the gym for GAP days ("you look like you haven't been to the gym in a while!");
   - if the kid says "Maybe later" he stays away for at least AGAIN days.
   He jogs in from a few squares away, follows the hero, stops next to them, shouts, and opens his card
   (🏋️ Take me to the Fact Gym / Maybe later), then jogs off. One visitor at a time through MQ_VISIT.
   Saved: p.gym = {last: the day of the last gym visit, seen: the day Coach Flex last came}. Any visit to the
   Fact Gym (mastery screen) sets last. Drawn through MQ_MAPDRAW; never blocks walking. */
(function(){
const COACH_LV=5,GAP=14,AGAIN=7,STEP=300,O='#3b2a1e';
const FIRST=['Hey, champ! I\'m Coach Flex from the Fact Gym. Those math muscles need a workout!','You\'re level '+COACH_LV+' now? Then you\'re ready for the Fact Gym! Let\'s pump some facts!'];
const BACK=['You look like you haven\'t been to the gym in a while!','You gotta work out!!! Those times tables are getting floppy!','No pain, no brain! When did you last do a Fact Sprint?','I\'ve been looking EVERYWHERE for you! Gym time!','Feel the burn… of quick math! Come on, let\'s go!','Your brain is a muscle, and muscles need reps! Let\'s GO!'];
const SHOUT=['HEY! Champ!','Hup, hup, hup!','Wait up, champ!','HUP! HUP!','Coming through!'];
const LATER=['Okay, but I\'ll be back! 💪','Don\'t make me come find you again!','Stay strong, champ!','I\'ll be watching those muscles!'];
const SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96">
<ellipse cx="32" cy="92.5" rx="19" ry="3.5" fill="rgba(0,0,0,.22)"/>
<rect x="22" y="66" width="8" height="20" rx="3" fill="#d99a6c" stroke="${O}" stroke-width="2"/><rect x="34" y="66" width="8" height="20" rx="3" fill="#d99a6c" stroke="${O}" stroke-width="2"/>
<rect x="17.5" y="83.5" width="14" height="7" rx="3.2" fill="#fff" stroke="${O}" stroke-width="2"/><rect x="32.5" y="83.5" width="14" height="7" rx="3.2" fill="#fff" stroke="${O}" stroke-width="2"/>
<path d="M19 87.5 h11 M34 87.5 h11" stroke="#e03131" stroke-width="2"/>
<path d="M18 58 L46 58 L47 73 L35 73 L32 67 L29 73 L17 73 Z" fill="#364fc7" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
<path d="M18.5 63 h27" stroke="#fff" stroke-width="1.6" opacity=".7"/>
<path d="M15 35 Q32 27 49 35 L46 60 L18 60 Z" fill="#d99a6c" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M22 33.5 Q32 41 42 33.5 L45.5 60 L18.5 60 Z" fill="#e03131" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
<circle cx="32" cy="50" r="5.6" fill="#fff" stroke="${O}" stroke-width="1.4"/><path d="M28.6 50 h6.8" stroke="${O}" stroke-width="1.6"/><rect x="27.4" y="47.6" width="2" height="4.8" rx=".6" fill="${O}"/><rect x="34.6" y="47.6" width="2" height="4.8" rx=".6" fill="${O}"/>
<path d="M27.5 33 L32 43 L36.5 33" stroke="#868e96" stroke-width="1" fill="none"/><rect x="30" y="42" width="5" height="3" rx="1.2" fill="#adb5bd" stroke="${O}" stroke-width="1"/>
<path d="M18 37 L9 39 L8 24" stroke="${O}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 37 L9 39 L8 24" stroke="#d99a6c" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M46 37 L55 39 L56 24" stroke="${O}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 37 L55 39 L56 24" stroke="#d99a6c" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="12.5" cy="34.5" r="5" fill="#d99a6c" stroke="${O}" stroke-width="2"/><circle cx="51.5" cy="34.5" r="5" fill="#d99a6c" stroke="${O}" stroke-width="2"/>
<path d="M10 34 Q12 31.5 14.5 32.5 M49.5 32.5 Q52 31.5 54 34" stroke="#f3c19d" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<circle cx="8" cy="22" r="4.4" fill="#d99a6c" stroke="${O}" stroke-width="2"/><circle cx="56" cy="22" r="4.4" fill="#d99a6c" stroke="${O}" stroke-width="2"/>
<rect x="28" y="25" width="8" height="8" fill="#d99a6c"/>
<circle cx="32" cy="18" r="9.5" fill="#d99a6c" stroke="${O}" stroke-width="2.2"/>
<path d="M22.6 15.5 Q22.5 7.5 32 7.5 Q41.5 7.5 41.4 15.5 Z" fill="#3b2a1e"/>
<rect x="22.4" y="12" width="19.2" height="3.6" rx="1.6" fill="#ffd43b" stroke="${O}" stroke-width="1.6"/><path d="M41.4 13 L46 10.5 L45.5 15 Z" fill="#ffd43b" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M27 17.5 L30.5 18.2 M37 17.5 L33.5 18.2" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="29" cy="20" r="1.3" fill="${O}"/><circle cx="35" cy="20" r="1.3" fill="${O}"/>
<path d="M27.5 23 Q32 27.5 36.5 23 Z" fill="#fff" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;
const IMG=new Image();IMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SVG);
let C=null,ARMED=0,DONE_FOR=null;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const days=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const blocked=(W,a,b,c,d)=>!!(window.MQ_GROUND&&MQ_GROUND.blocked&&MQ_GROUND.blocked(W,a,b,c,d));
const walk=t=>!!t&&!t.block&&!t.water&&!t.rail;
/* is it time for Coach Flex? */
function due(p){if(!p||!p.setup||(p.level||0)<COACH_LV||!window.Mastery)return false;const g=p.gym||{},t=dayKey();
 if(g.seen&&days(g.seen,t)<AGAIN)return false;if(!g.last)return true;return days(g.last,t)>=GAP;}
function first(p){return !(p.gym&&p.gym.last);}
/* breadth-first search from the hero: distances and the next step toward the hero from any tile */
function field(W){const T=W.T,H=T.length,Wd=T[0].length,dist=new Int16Array(H*Wd).fill(-1),q=[W.hx+W.hy*Wd];dist[q[0]]=0;
 for(let i=0;i<q.length;i++){const k=q[i],x=k%Wd,y=(k-x)/Wd;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=Wd||ny>=H)continue;const n=nx+ny*Wd;
   if(dist[n]>=0||!walk(T[ny][nx])||blocked(W,x,y,nx,ny))continue;dist[n]=dist[k]+1;q.push(n);}}
 return {dist,Wd};}
function start(W,now){const p=P();const F=field(W),c=[];for(let i=0;i<F.dist.length;i++){const d=F.dist[i];if(d>=7&&d<=10){const x=i%F.Wd,y=(i-x)/F.Wd,t=W.T[y][x];if(!t.gate&&!t.npc&&!t.chest)c.push([x,y]);}}
 if(!c.length)return false;const [x,y]=pick(c);
 C={x,y,fx:x,fy:y,mt:0,dir:x<=W.hx?1:-1,st:'come',t0:now,say:{t:pick(SHOUT),at:now},first:first(p),line:''};
 p.gym=Object.assign({},p.gym,{seen:dayKey()});try{save();}catch(e){}return true;}
function stepToward(W,now){const F=field(W),T=W.T;let best=null,bd=1e9;
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=C.x+dx,ny=C.y+dy,t=T[ny]&&T[ny][nx];if(!walk(t)||blocked(W,C.x,C.y,nx,ny))continue;if(nx===W.hx&&ny===W.hy)continue;const d=F.dist[nx+ny*F.Wd];if(d>=0&&d<bd){bd=d;best=[nx,ny];}}
 if(!best)return false;C.fx=C.x;C.fy=C.y;if(best[0]!==C.x)C.dir=best[0]>C.x?1:-1;C.x=best[0];C.y=best[1];C.mt=now;return true;}
function card(){const p=P();C.st='card';C.line=C.first?pick(FIRST):pick(BACK);
 modal(`<div class="mcard coachcard"><div class="cc-row"><div class="cc-av">${SVG}</div><div class="cc-bub"><b>💪 Coach Flex</b>${esc(C.line)}</div></div>
 <p class="muted" style="margin:10px 0 0">${C.first?'The 🏋️ Fact Gym is in Number Town: Fact Sprints and your Mastery Map.':`Your last workout was <b>${p.gym&&p.gym.last?days(p.gym.last,dayKey()):'?'} days</b> ago.`}</p>
 <div class="row"><button class="btn ghost dark" onclick="MQ_COACH._later()">Maybe later</button><button class="btn gold big" onclick="MQ_COACH._go()">🏋️ Take me to the Fact Gym!</button></div></div>`);}
function leave(now,t){if(!C)return;C.st='go';C.t0=now;C.say={t:t||pick(LATER),at:now};C.dir=C.x>=W.hx?1:-1;}
function done(){C=null;try{MQ_VISIT.release('coach');}catch(e){}}
function tick(W,now){if(!C)return;if(curScreen!=='world'){if(C.st!=='card')done();return;}
 if(C.mt&&now-C.mt<STEP)return;C.mt=0;
 if(C.st==='come'){const d=Math.max(Math.abs(C.x-W.hx),Math.abs(C.y-W.hy));
  if(d<=1&&!W.moving){C.dir=W.hx>=C.x?1:-1;C.st='stop';C.t0=now;C.say={t:C.first?'Hey there, champ! 💪':'THERE you are!',at:now};return;}
  if(now-C.t0>90e3){leave(now,'Phew! You\'re too fast for me!');return;}
  if(d>1)stepToward(W,now);return;}
 if(C.st==='stop'){if(now-C.t0>1100&&!document.querySelector('#modal.show'))card();return;}
 if(C.st==='go'){if(now-C.t0>2600){done();return;}const nx=C.x+C.dir,t=W.T[C.y]&&W.T[C.y][nx];if(walk(t)&&!blocked(W,C.x,C.y,nx,C.y)){C.fx=C.x;C.fy=C.y;C.x=nx;C.mt=now;}}}
/* arrives by himself: on the map for a while, nobody else visiting, nothing open */
function maybe(W,now){if(C||/[?&]smoke=/.test(location.search))return;const p=P();if(!p||DONE_FOR===p.id)return;if(!ARMED){ARMED=now+(25+Math.random()*35)*1000;return;}if(now<ARMED)return;
 if(!due(p)){DONE_FOR=p.id;return;}
 if(document.querySelector('#modal.show')||W.moving||window.__hideHero||(window.visitorQuiet||0)>Date.now()||(window.MQ_FOG&&MQ_FOG.on()))return;
 if(!window.MQ_VISIT||!MQ_VISIT.claim('coach',5*60e3)){ARMED=now+30e3;return;}
 if(!start(W,now)){MQ_VISIT.release('coach');ARMED=now+60e3;return;}DONE_FOR=p.id;}
function bubble(ctx,ax,ay,ts,text,age){if(age>3200)return;const fs=Math.max(12,ts*.22);ctx.save();ctx.font=`800 ${fs}px Fredoka, sans-serif`;const pop=Math.max(0,Math.min(1,age/200)),fade=age>2700?Math.max(0,1-(age-2700)/500):1,tw=ctx.measureText(text).width,w=(tw+fs*1.2)*pop,h=fs*1.9*pop,x0=Math.max(4,Math.min(W.vw-w-4,ax-w/2)),y0=ay-h,r=h/2;
 ctx.globalAlpha=fade;ctx.fillStyle='#fff3bf';ctx.strokeStyle=O;ctx.lineWidth=Math.max(1.5,ts*.03);ctx.beginPath();ctx.moveTo(x0+r,y0);ctx.lineTo(x0+w-r,y0);ctx.arc(x0+w-r,y0+r,r,-Math.PI/2,Math.PI/2);ctx.lineTo(x0+r,y0+h);ctx.arc(x0+r,y0+r,r,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();ctx.stroke();
 if(pop>=1){ctx.fillStyle='#2b2250';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x0+w/2,y0+h/2+fs*.05);}ctx.restore();}
let PUP_OFF=0;const puppet=()=>!!window.People&&!PUP_OFF; /* people.js draws the moving puppet; the old picture if it ever fails */
function frame(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T||curScreen!=='world')return;maybe(W,now);tick(W,now);if(!C||!IMG.complete)return;
 const k=C.mt?Math.min(1,(now-C.mt)/STEP):1,dx=C.fx+(C.x-C.fx)*k,dy=C.fy+(C.y-C.fy)*k,sx=dx*ts-cx,sy=dy*ts-cy,fade=C.st==='go'?Math.max(0,1-(now-C.t0-1800)/800):Math.min(1,(now-C.t0)/400+.2);
 if(sx<-ts*2||sy<-ts*3||sx>W.vw+ts||sy>W.vh+ts)return;
 items.push({y:dy+.03,draw:()=>{const h=ts*1.45,w=h*64/96,bob=C.mt&&k<1?Math.abs(Math.sin(now/70))*3:C.st==='stop'||C.st==='card'?Math.abs(Math.sin(now/260))*1.5:0;ctx.save();ctx.globalAlpha=fade;let ok=false;if(puppet()){try{const st=C.st==='stop'||C.st==='card';People.put(ctx,'coach','coach',sx+ts/2,sy+ts*.97,ts,now,{x:dx,y:dy,talk:!!C.say,face:st?(W.hx<C.x?'left':W.hx>C.x?'right':undefined):undefined,still:C.st==='card',h:1.5});ok=true;}catch(e){PUP_OFF=1;}}
  if(!ok){ctx.translate(sx+ts/2,0);ctx.scale(C.dir<0?-1:1,1);ctx.drawImage(IMG,-w/2,sy+ts*.97-h-bob,w,h);}ctx.restore();}});
 if(C.say)items.push({y:1e6-2,draw:()=>bubble(ctx,sx+ts/2,sy-ts*.55,ts,C.say.t,now-C.say.at)});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
/* any visit to the Fact Gym counts as a workout */
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{try{if(s==='mastery'){const p=P();if(p){p.gym=Object.assign({},p.gym,{last:dayKey()});save();}}if(s==='profiles'){if(C)done();ARMED=0;DONE_FOR=null;}else if(s!=='world'&&C&&C.st!=='card')done();}catch(e){}}});
const CSS=`.coachcard .cc-row{display:flex;gap:12px;align-items:center;text-align:left}.cc-av{flex:0 0 96px}.cc-av svg{width:96px;height:144px}
.cc-bub{flex:1;background:#fff9db;border:3px solid #fcc419;border-radius:18px;padding:10px 14px;font-size:18px;line-height:1.4;color:#1f2340}.cc-bub b{display:block;color:#e03131;font-size:15px;margin-bottom:2px}
@media(max-width:560px){.cc-av{flex-basis:70px}.cc-av svg{width:70px;height:105px}.cc-bub{font-size:16px}}`;
{const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);}
window.MQ_COACH={_tick:t=>tick(W,t||performance.now()),due,svg:SVG,LINES:{FIRST,BACK,SHOUT,LATER},state:()=>C,LV:COACH_LV,GAP,AGAIN,
 start:()=>{if(typeof W==='undefined'||!W)return false;C=null;return start(W,performance.now());},
 _go:()=>{closeModal();const p=P();if(C)leave(performance.now(),'Let\'s GO! 💪');setTimeout(()=>{if(window.Mastery)Mastery.open('world');},250);},
 _later:()=>{closeModal();leave(performance.now());}};
})();
