/* ================= 🚂 the Town Train (Oct 2026) =================
   A train line across the bottom of the village plaza, below the Wishing Fountain: the brick Depot at the west end, where the train
   lives, and a grassy hill with a tunnel at the east end, both seen from the side (the train slides out of one and into the other), the
   track between (drawn from the side, like the train) and a departure board 🚉 near the middle,
   and signs on the hills: "Depot" (west) and "Discovery Zone" (east).
   The train comes out of the Depot on its own every 15 minutes of time on the map (the first one 1–15 minutes in), slows into the station, waits
   about 16 s ("All aboard!" near the end, then a whistle) and leaves through the east tunnel. The board counts down to the
   next train. The board's post has a small red crosswalk-style 🔔 button: walking into the sign presses it (free; the train comes within 1 minute; its light glows until the train arrives), then the card shows the 🪙 call option or 🪙 CALL_COST to call it right now.
   Oct 2026: it goes to Dr. Quartz's Lab. Walking onto the stopped train asks "All aboard!" and ride.js plays the trip into the Lab.
   Visitors: now and then someone steps off and walks into Number Town, or comes out of Town to catch the train
   (the Kind Teacher, Dr. Quartz, Principal Wise, Ms. Rosa, Elder Wiz, the Pet Keeper). Riders just appear beside the
   stopped train; people catching it walk up to it and vanish (nobody is drawn inside). They are scenery: they don't stop the hero.
   Nothing is saved except the coins spent on a call. The clock only runs while the map is on screen.
   Core hooks (index.html): MQ_WORLD (lay the tiles after buildWorld), MQ_MAPDRAW (draw each frame), MQ_NPC (tap handlers),
   and plaza decor skips t.rail tiles. */
(function(){
/* the line sits inside the town square: a hill with a tunnel at each end (tiles 15–17 and 27–29), the visible track between the
   tunnel faces (x 18 to 27) and the departure board near the middle */
const ROW=21,HL0=15,HL1=17,HR0=27,HR1=29,FL=18,FR=27,X0=HL1,X1=HR0,PL0=18,PL1=26,BOARD=[20,20],CALL_COST=10,BELL_WAIT=60,EVERY=[900,900],FIRST=[60,900]; /* a train every 15 minutes on the map (owner, Oct 2026); the first one 1–15 minutes after arriving */
const LEN=6.1,STOP=26.4,START=FL,END=FR+LEN+.2,T_IN=7,T_STOP=16,T_OUT=7;
const TR={ph:'away',wait:FIRST[0]+Math.random()*(FIRST[1]-FIRST[0]),t:0,front:START,last:0,smoke:[],walkers:[],aboard:[],said:0,called:''};
const rnd=(a,b)=>a+Math.random()*(b-a);
/* ---------- tiles ---------- */
function lay(T){const ok=t=>t&&!t.water&&!t.gate&&!t.chest&&!(t.npc&&t.npc!=='station');
 for(let x=HL0;x<=HR1;x++){const t=T[ROW]&&T[ROW][x];if(!ok(t))continue;t.o=null;t.deco=false;t.rail=true;if(x<=HL1||x>=HR0){t.tunnel=true;t.block=true;}else t.block=false;}
 for(const x of [HL0,HL0+1,HL1,HR0,HR0+1,HR1]){const t=T[ROW-1][x];if(ok(t)){t.o=null;t.deco=false;t.rail=true;t.hill=true;t.block=true;}} /* the hills are two tiles tall */
 const b=T[BOARD[1]][BOARD[0]];if(ok(b)){b.o=null;b.npc='station';b.block=true;}}
window.MQ_WORLD=window.MQ_WORLD||[];window.MQ_WORLD.push(lay);
/* ---------- the schedule ---------- */
function near(){return !!W&&Math.abs(W.hx-22)<=10&&Math.abs(W.hy-ROW)<=8;}
function tick(dt){TR.t+=dt;
 if(TR.ph==='away'){TR.wait-=dt;if(TR.wait<=0){TR.ph='in';TR.t=0;TR.front=START;TR.called='';spawnBoarder();if(near())bell();}}
 else if(TR.ph==='in'){const k=Math.min(1,TR.t/T_IN);TR.front=START+(STOP-START)*(1-(1-k)*(1-k));if(k>=1){TR.ph='stop';TR.t=0;TR.front=STOP;doors(true);TR.said=0;spawnRider();}}
 else if(TR.ph==='stop'){const left=T_STOP-TR.t;
  if(left<5&&TR.said<1){TR.said=1;TR.bubble='All aboard!';if(near()){try{if(voiceOn())say('All aboard!',.9);}catch(e){}}}
  if(left<1.6&&TR.said<2){TR.said=2;if(near())whistle();}
  if(left<=0){TR.ph='out';TR.t=0;TR.bubble='';doors(false);}}
 else if(TR.ph==='out'){const k=Math.min(1,TR.t*(TR.riding?2:1)/T_OUT);TR.front=STOP+(END-STOP)*k*k;if(k>=1){TR.ph='away';TR.t=0;TR.wait=rnd(EVERY[0],EVERY[1]);TR.aboard=[];if(TR.riding)rideNow();}}
 /* steam: puffs from the chimney, more when pulling away */
 const chim=TR.front-.55; /* no smoke while the chimney is inside the Depot or the tunnel */
 if(TR.ph!=='away'&&chim>FL+.1&&chim<FR-.1&&Math.random()<(TR.ph==='stop'?1.2:4)*dt*3)TR.smoke.push({x:TR.front-.55,y:ROW-.85,r:.18,a:.7,vx:TR.ph==='stop'?0:-.4,vy:-.6});
 TR.smoke.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=.35*dt;s.a-=.45*dt;});TR.smoke=TR.smoke.filter(s=>s.a>0);
 if(TR.ph!=='away'&&TR.ph!=='stop'&&near()){TR.chug=(TR.chug||0)+dt*(TR.ph==='in'?3.5-2.6*Math.min(1,TR.t/T_IN):1+3*Math.min(1,TR.t/T_OUT));if(TR.chug>=1){TR.chug=0;chug();}}
 walkTick(dt);}
/* while the train stands in the station, its track tiles are the train: bumping them asks to get on */
function doors(open){if(!W)return;for(let x=Math.floor(STOP-LEN);x<=Math.floor(STOP);x++){const t=W.T[ROW][x];if(!t||!t.rail)continue;if(open){t.npc='tride';t.block=true;}else{if(t.npc==='tride')t.npc=null;t.block=false;}}}
/* ---------- sounds (only near the station) ---------- */
function bell(){try{if(!state.sound)return;[0,.32,.64].forEach(d=>{tone(1320,.35,'sine',.05,d);tone(1760,.3,'sine',.025,d);});}catch(e){}}
function whistle(){try{if(!state.sound)return;[[0,.5],[.62,1.1]].forEach(([d,l])=>{tone(740,l,'sine',.05,d);tone(932,l,'sine',.045,d);tone(1109,l,'triangle',.02,d);});}catch(e){}}
function chug(){try{if(!state.sound)return;tone(68,.09,'square',.018);tone(140,.05,'triangle',.012,.02);}catch(e){}}
/* ---------- visitors ---------- */
const imgs={};const svgImg=(k,s)=>{if(!imgs[k]){const i=new Image();i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(/xmlns=/.test(s)?s:s.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '));imgs[k]=i;}return imgs[k];};
/* train visitors (owner, Oct 2026: no name tags, just what they say, with lots of funny lines; Ms. Rosa drawn full body; the Elder Wiz
   walks the map now, elder.js, so he isn't on the train) */
const ROSA_SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96"><ellipse cx="32" cy="92" rx="17" ry="3.5" fill="rgba(0,0,0,.22)"/>
<ellipse cx="25" cy="90" rx="6" ry="3" fill="#7a3b1a" stroke="#3b2a1e" stroke-width="1.8"/><ellipse cx="39" cy="90" rx="6" ry="3" fill="#7a3b1a" stroke="#3b2a1e" stroke-width="1.8"/>
<path d="M22 44 Q32 40 42 44 L47 87 Q32 91 17 87 Z" fill="#fff" stroke="#3b2a1e" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M24 52 H40 L43 86 Q32 89 21 86 Z" fill="#ff6b6b" stroke="#3b2a1e" stroke-width="2.2" stroke-linejoin="round"/><path d="M26 64 h12 v8 h-12 z" fill="#ffa8a8" stroke="#3b2a1e" stroke-width="1.6"/>
<path d="M24 52 Q32 46 40 52" stroke="#3b2a1e" stroke-width="2" fill="none"/><circle cx="29" cy="47" r="1.3" fill="#3b2a1e"/><circle cx="35" cy="47" r="1.3" fill="#3b2a1e"/>
<path d="M42 48 Q50 54 50 62" stroke="#3b2a1e" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="M42 48 Q50 54 50 62" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M22 48 Q14 56 16 64" stroke="#3b2a1e" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="M22 48 Q14 56 16 64" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M51 70 L56 40" stroke="#3b2a1e" stroke-width="5" stroke-linecap="round"/><path d="M51 70 L56 40" stroke="#c98a54" stroke-width="3" stroke-linecap="round"/><ellipse cx="56.5" cy="36" rx="4" ry="5.5" fill="#c98a54" stroke="#3b2a1e" stroke-width="2"/>
<circle cx="50" cy="64" r="3.6" fill="#c68642" stroke="#3b2a1e" stroke-width="1.8"/><circle cx="16" cy="66" r="3.4" fill="#c68642" stroke="#3b2a1e" stroke-width="1.8"/>
<path d="M21 34 Q19 24 25 21 Q32 16 39 21 Q45 24 43 34 Q44 40 39 41 L25 41 Q20 40 21 34 Z" fill="#3b2314" stroke="#3b2a1e" stroke-width="2"/>
<circle cx="32" cy="32" r="9.5" fill="#c68642" stroke="#3b2a1e" stroke-width="2"/><circle cx="28.5" cy="31" r="1.4" fill="#3b2a1e"/><circle cx="35.5" cy="31" r="1.4" fill="#3b2a1e"/>
<path d="M28 35.5 Q32 39 36 35.5" stroke="#3b2a1e" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="26" cy="34.5" r="1.7" fill="#ff8787" opacity=".7"/><circle cx="38" cy="34.5" r="1.7" fill="#ff8787" opacity=".7"/>
<circle cx="22" cy="30" r="3" fill="#3b2314" stroke="#3b2a1e" stroke-width="1.5"/><circle cx="42" cy="30" r="3" fill="#3b2314" stroke="#3b2a1e" stroke-width="1.5"/>
<path d="M22 22 Q20 10 27 9 Q29 3 34 5 Q39 2 42 8 Q48 9 44 22 Z" fill="#fff" stroke="#3b2a1e" stroke-width="2.2" stroke-linejoin="round"/><rect x="22" y="19" width="22" height="5" rx="2" fill="#fff" stroke="#3b2a1e" stroke-width="2"/></svg>`;
const WHO=[
 {id:'kind',n:'✨ The Kind Teacher',art:()=>typeof kindSVG==='function'&&svgImg('kind',kindSVG()),ar:240/330,h:1.5,
  off:['I helped 23 kids carry the ones today!','Someone forgot the 7s again. I\'m on my way!','So many kids, so many times tables!','A girl counted to 10 on her toes today. Clever!','Who needs a little help? Everybody, a little!','I\'ve told 50 kids today: mistakes grow your brain!'],
  on:['Off to another class! They need me!','Bye! Keep practising those facts!','I hear a fraction crying… must dash!','Don\'t give up! I\'ll be back!']},
 {id:'quartz',n:'🔬 Dr. Quartz',art:()=>window.Quartz&&Quartz.SVG&&svgImg('quartz',Quartz.SVG),ar:100/120,h:1.4,
  off:['4.6 billion years old… give or take a Tuesday.','Quartz is 7 on the hardness scale. Like 3 + 4!','If I split this rock in half… two rocks!','Igneous, sedimentary… where did I put my keys?','Mumble… magma… mumble… marshmallows.','Diamonds are just squished carbon, you know.'],
  on:['I must get back before my rocks get bored.','Science waits for no one!','If this train goes 60 km an hour… I\'m late!','Back to the lab! Something is bubbling…']},
 {id:'principal',n:'🎓 Principal Wise',art:()=>typeof principalMapSVG==='function'&&svgImg('principal',principalMapSVG()),ar:100/150,h:1.45,
  off:['Good morning, Number Town!','Just checking everyone is learning their facts.','Walking is good thinking time.','Has anyone seen my whistle?'],
  on:['Off to a very important meeting… about snacks.','Keep up the good work!','Remember: no running in the hallway!']},
 {id:'rosa',n:'Ms. Rosa',art:()=>svgImg('rosa',ROSA_SVG),ar:64/96,h:1.4,
  off:['Fresh carrots… and maybe a muffin.','Who wants spaghetti? Everybody wants spaghetti!','My soup needs exactly 3½ pinches of salt.','Did someone say pizza? I definitely said pizza.','Fruit is nature\'s candy!','1,000 cookies: that\'s 10 trays of 100!'],
  on:['My oven is calling me!','Lunch will not cook itself!','Eat your vegetables, everyone!','Back to the kitchen! Something smells… burnt?!']},
 {id:'keeper',n:'Pet Keeper',e:'🧑‍🌾',
  off:['I brought snacks for the pets!','A bunny learned to count to 3 today!','Has anyone seen a runaway hamster?','Pets love a pat on the head!'],
  on:['Time to feed the pets!','The goldfish are waiting for me!','See you soon! Pat your pet for me!']}];
const pickWho=skip=>{const busy=id=>!!W&&W.mobs.some(m=>id==='principal'&&m.principal||id==='quartz'&&m.quartz)||TR.walkers.some(v=>v.w.id===id);const c=WHO.filter(w=>w.id!==skip&&!busy(w.id));if(!c.length)return null;return c[Math.floor(Math.random()*c.length)];};
const DOOR=[22,15.35]; /* Number Town's front door */
function spawnRider(){if(Math.random()<.45)return;const w=pickWho(TR.aboard[0]&&TR.aboard[0].id);if(!w)return;const cx=STOP-LEN+1.4+Math.random()*2.5;
 TR.walkers.push({w,x:cx,y:ROW-1,path:[[23,ROW-1],[23,16],[DOOR[0],16],DOOR],sp:1.4,a:1,fade:'',say:w.off[Math.floor(Math.random()*w.off.length)],sayT:4.5,end:'town'});}
function spawnBoarder(){if(Math.random()<.45)return;const w=pickWho();if(!w)return;const px=STOP-LEN+1.2+Math.random()*3;
 TR.walkers.push({w,x:DOOR[0],y:DOOR[1],path:[[DOOR[0],16],[23,16],[23,ROW-1],[px,ROW-1]],sp:1.5,a:0,fade:'in',say:w.on[Math.floor(Math.random()*w.on.length)],sayT:4.5,end:'board'});}
function walkTick(dt){TR.walkers.forEach(v=>{
 if(v.fade==='in'){v.a=Math.min(1,v.a+dt*2.5);if(v.a>=1)v.fade='';}if(v.fade==='out'){v.a-=dt*2.5;if(v.a<=0)v.gone=true;}
 if(v.sayT>0)v.sayT-=dt;
 if(v.path.length){const [tx,ty]=v.path[0],dx=tx-v.x,dy=ty-v.y,d=Math.hypot(dx,dy),st=v.sp*dt;if(d<=st){v.x=tx;v.y=ty;v.path.shift();}else{v.x+=dx/d*st;v.y+=dy/d*st;}if(dx)v.dir=dx>0?1:-1;v.moving=true;}
 else{v.moving=false;
  if(v.end==='town'&&v.fade!=='out')v.fade='out';
  if(v.end==='board'&&TR.ph==='stop'&&TR.t>2&&!v.boarding){v.boarding=true;v.path=[[v.x,ROW-.4]];v.end='inside';}
  else if(v.end==='inside'){v.gone=true;TR.aboard.push(v.w);}
  else if(v.end==='board'&&TR.ph==='away'&&!v.boarding){v.end='town';v.path=[[23,ROW-1],[23,16],[DOOR[0],16],DOOR];} /* missed it: back to town */}});
 TR.walkers=TR.walkers.filter(v=>!v.gone);}
/* ---------- drawing ---------- */
function rr(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function wheel(ctx,x,y,r,ang){ctx.fillStyle='#212529';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.fillStyle='#868e96';ctx.beginPath();ctx.arc(x,y,r*.72,0,7);ctx.fill();
 ctx.strokeStyle='#343a40';ctx.lineWidth=Math.max(1,r*.18);for(let i=0;i<4;i++){const a=ang+i*Math.PI/4;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*r*.7,y-Math.sin(a)*r*.7);ctx.lineTo(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7);ctx.stroke();}
 ctx.fillStyle='#ffd43b';ctx.beginPath();ctx.arc(x,y,r*.2,0,7);ctx.fill();}
function drawTrain(ctx,cx,cy,ts,now){const f=TR.front*ts-cx,base=(ROW+.8)*ts-cy,ang=TR.front*3.2,u=ts;
 /* coaches (behind the engine); nobody is shown riding: visitors pop up beside the train and vanish into it */
 const cols=[['#2f9e44','#237a35'],['#f08c00','#c76f00']];
 for(let i=0;i<2;i++){const r=f-2.35*u-i*1.95*u,l=r-1.8*u;const [c1,c2]=cols[i];
  ctx.strokeStyle='#495057';ctx.lineWidth=u*.06;ctx.beginPath();ctx.moveTo(r,base-.45*u);ctx.lineTo(r+.15*u,base-.45*u);ctx.stroke();
  ctx.fillStyle=c1;rr(ctx,l,base-1.32*u,1.8*u,.98*u,.12*u);ctx.fill();ctx.fillStyle=c2;ctx.fillRect(l,base-.5*u,1.8*u,.14*u);
  ctx.fillStyle='#6b4423';rr(ctx,l-.06*u,base-1.45*u,1.92*u,.17*u,.08*u);ctx.fill();
  for(let w=0;w<3;w++){const wx=l+.2*u+w*.52*u,wy=base-1.17*u;ctx.fillStyle='#d0ebff';rr(ctx,wx,wy,.38*u,.38*u,.06*u);ctx.fill();
}
  wheel(ctx,l+.38*u,base-.17*u,.17*u,ang);wheel(ctx,r-.38*u,base-.17*u,.17*u,ang);}
 /* engine: cab at the back, boiler, chimney, dome, lamp, cowcatcher */
 const e0=f-2.2*u;ctx.fillStyle='#343a40';ctx.fillRect(e0,base-.5*u,2.1*u,.2*u);
 ctx.fillStyle='#1c7ed6';rr(ctx,e0,base-1.55*u,.8*u,1.1*u,.08*u);ctx.fill();ctx.fillStyle='#1864ab';rr(ctx,e0-.08*u,base-1.66*u,.96*u,.16*u,.06*u);ctx.fill();
 ctx.fillStyle='#fff3bf';rr(ctx,e0+.2*u,base-1.38*u,.42*u,.38*u,.06*u);ctx.fill();
 ctx.fillStyle='#e03131';rr(ctx,e0+.75*u,base-1.12*u,1.3*u,.66*u,.3*u);ctx.fill();ctx.fillStyle='#ffd43b';[1.05,1.45,1.8].forEach(b=>ctx.fillRect(e0+b*u,base-1.12*u,.07*u,.66*u));
 ctx.fillStyle='#212529';ctx.fillRect(f-.68*u,base-1.5*u,.26*u,.42*u);rr(ctx,f-.76*u,base-1.6*u,.42*u,.14*u,.05*u);ctx.fill();
 ctx.fillStyle='#ffd43b';ctx.beginPath();ctx.arc(e0+1.3*u,base-1.12*u,.17*u,Math.PI,0);ctx.fill();
 ctx.fillStyle=Math.sin(now/180)>-.2?'#fff9db':'#ffe066';ctx.beginPath();ctx.arc(f-.08*u,base-.88*u,.11*u,0,7);ctx.fill();
 ctx.fillStyle='#868e96';ctx.beginPath();ctx.moveTo(f-.12*u,base-.46*u);ctx.lineTo(f+.12*u,base-.08*u);ctx.lineTo(f-.4*u,base-.08*u);ctx.fill();
 wheel(ctx,e0+.45*u,base-.27*u,.27*u,ang);wheel(ctx,e0+1.1*u,base-.27*u,.27*u,ang);wheel(ctx,f-.5*u,base-.17*u,.17*u,ang);
 ctx.strokeStyle='#adb5bd';ctx.lineWidth=u*.05;ctx.beginPath();const ro=Math.sin(ang)*.1*u;ctx.moveTo(e0+.45*u,base-.27*u+ro);ctx.lineTo(e0+1.1*u,base-.27*u+ro);ctx.stroke();}
function drawSmoke(ctx,cx,cy,ts){TR.smoke.forEach(s=>{ctx.fillStyle=`rgba(255,255,255,${Math.max(0,s.a)})`;ctx.beginPath();ctx.arc(s.x*ts-cx,s.y*ts-cy,s.r*ts,0,7);ctx.fill();});}
function bubble(ctx,txt,x,y,ts){ctx.font=`700 ${Math.round(ts*.26)}px Fredoka, system-ui, sans-serif`;const w=ctx.measureText(txt).width+ts*.3,h=ts*.42;ctx.fillStyle='rgba(255,255,255,.95)';rr(ctx,x-w/2,y-h,w,h,h/2);ctx.fill();
 ctx.beginPath();ctx.moveTo(x-ts*.08,y-1);ctx.lineTo(x,y+ts*.12);ctx.lineTo(x+ts*.08,y-1);ctx.fill();ctx.fillStyle='#2b2340';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,x,y-h/2+1);}
function drawWalker(ctx,v,cx,cy,ts,now){const sx=v.x*ts-cx,sy=v.y*ts-cy,w=v.w,bob=v.moving?Math.abs(Math.sin(now/110))*2:0;ctx.save();ctx.globalAlpha=Math.max(0,v.a);
 ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(sx+ts/2,sy+ts*.9,ts*.3,ts*.09,0,0,7);ctx.fill();
 const im=w.art&&w.art();if(im&&im.complete&&im.naturalWidth){const hh=ts*w.h,ww=hh*w.ar;ctx.drawImage(im,sx+ts/2-ww/2,sy+ts*.95-hh-bob,ww,hh);}
 else{const s=ts*1.05;ctx.drawImage(wSprite(w.e||'🙂',Math.round(ts)),sx+ts/2-s/2,sy+ts*.95-s-bob,s,s);}
 ctx.restore();if(v.a>.6&&v.sayT>0)bubble(ctx,v.say,sx+ts/2,sy-ts*.62,ts);} /* no name tags, just what they say */
/* the board: time until the train comes, then ARRIVING, then a countdown to departure while it boards, then DEPARTING */
const mmss=s=>{s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
function boardText(){return TR.ph==='away'?mmss(TR.wait):TR.ph==='in'?'ARRIVING':TR.ph==='stop'?mmss(T_STOP-TR.t):'DEPARTING';}
/* one hill from the side: outer foot at xo, tunnel face at xf (d=1 when the face is on its right, -1 on its left) */
function hill(ctx,cx,cy,ts,xo,xf,d,sign){const X=x=>x*ts-cx,Y=y=>y*ts-cy,base=ROW+.98,top=ROW-1.12,face=ROW-.95,mid=xo+(xf-xo)*.42;
 const g=ctx.createLinearGradient(0,Y(top),0,Y(base));g.addColorStop(0,'#74c05a');g.addColorStop(1,'#4f8f3c');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(X(xo),Y(base));
 ctx.bezierCurveTo(X(xo+(mid-xo)*.35),Y(top+.3),X(mid-(mid-xo)*.3),Y(top),X(mid),Y(top));ctx.bezierCurveTo(X(mid+(xf-mid)*.55),Y(top),X(xf-.15*d),Y(face-.25),X(xf),Y(face));ctx.lineTo(X(xf),Y(base));ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(X(mid-.2*d),Y(top+.32),ts*.5,ts*.14,0,0,7);ctx.fill();
 [[.25,.55],[.6,.25]].forEach(([k,dy])=>{const bx=X(xo+(xf-xo)*k),by=Y(top+dy+.35);ctx.fillStyle='#3f7d31';ctx.beginPath();ctx.arc(bx,by,ts*.16,0,7);ctx.arc(bx+ts*.17,by+ts*.03,ts*.13,0,7);ctx.fill();});
 /* the portal's stone edge: blocks seen side-on, with a cap */
 const s0=Math.min(X(xf),X(xf-.36*d)),sw=ts*.36;ctx.fillStyle='#9a9a9a';ctx.fillRect(s0,Y(face),sw,Y(base)-Y(face));ctx.fillStyle='#7d7d7d';for(let y=face+.3;y<base;y+=.3)ctx.fillRect(s0,Y(y),sw,1.5);
 ctx.fillRect(s0+sw/2-.75,Y(face),1.5,Y(base)-Y(face));ctx.fillStyle='#b5b5b5';ctx.fillRect(s0-ts*.05,Y(face)-ts*.1,sw+ts*.1,ts*.12);
 /* a wooden sign on two posts over the tunnel */
 if(sign){const sxm=X(xo+(xf-xo)*.55),by=Y(top)-ts*.08;ctx.font=`800 ${Math.round(ts*.27)}px Fredoka, system-ui, sans-serif`;const w=ctx.measureText(sign).width+ts*.4,h=ts*.44;
  ctx.fillStyle='#6b4423';ctx.fillRect(sxm-w*.32,by-h*.4,ts*.08,h*.75);ctx.fillRect(sxm+w*.32-ts*.08,by-h*.4,ts*.08,h*.75);
  ctx.fillStyle='#a0703c';rr(ctx,sxm-w/2,by-h*1.25,w,h,ts*.07);ctx.fill();ctx.strokeStyle='#5c3a1c';ctx.lineWidth=Math.max(1.5,ts*.04);ctx.stroke();
  ctx.fillStyle='#fff8e7';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sign,sxm,by-h*.75+1);}}
/* the Depot (west end): a brick train shed seen from the side, where the train lives; it rolls out of the doorway at xf */
function depot(ctx,cx,cy,ts,xo,xf){const X=x=>x*ts-cx,Y=y=>y*ts-cy,l=X(xo+.1),r=X(xf),base=Y(ROW+.98),top=Y(ROW-1.2),face=ROW-.95;
 ctx.fillStyle='#b4553a';ctx.fillRect(l,top,r-l,base-top);ctx.fillStyle='#8f3f29';const bh=ts*.16;let row=0;
 for(let y=top+bh;y<base;y+=bh,row++){ctx.fillRect(l,y,r-l,1.2);for(let x=l+(row%2?ts*.16:0);x<r;x+=ts*.32)ctx.fillRect(x,y-bh,1.2,bh);}
 ctx.fillStyle='#d9c7a7';ctx.fillRect(l,base-ts*.12,r-l,ts*.12);
 /* roof with an overhang, and a brick chimney */
 ctx.fillStyle='#5c3a2a';ctx.beginPath();ctx.moveTo(l-ts*.15,top+ts*.04);ctx.lineTo(l+ts*.25,top-ts*.42);ctx.lineTo(r-ts*.2,top-ts*.42);ctx.lineTo(r+ts*.12,top+ts*.04);ctx.closePath();ctx.fill();
 ctx.fillStyle='#7a4a33';ctx.fillRect(l-ts*.15,top,r-l+ts*.27,ts*.06);ctx.fillStyle='#9c4630';ctx.fillRect(l+ts*.45,top-ts*.72,ts*.24,ts*.34);ctx.fillStyle='#5c3a2a';ctx.fillRect(l+ts*.41,top-ts*.76,ts*.32,ts*.07);
 /* two lit arched windows */
 [.22,.5].forEach(k=>{const wx=l+(r-l)*k,wy=Y(ROW-.75),ww=ts*.36,wh=ts*.42;ctx.fillStyle='#e9e2d0';rr(ctx,wx-ts*.04,wy-ts*.04,ww+ts*.08,wh+ts*.08,ts*.16);ctx.fill();ctx.fillStyle='#ffe8a3';rr(ctx,wx,wy,ww,wh,ts*.14);ctx.fill();ctx.fillStyle='#e9e2d0';ctx.fillRect(wx+ww/2-1,wy,2,wh);ctx.fillRect(wx,wy+wh*.55,ww,2);});
 /* the doorway's stone edge, where the train comes out, and the sign on the front */
 const s0=X(xf-.36),sw=ts*.36;ctx.fillStyle='#9a9a9a';ctx.fillRect(s0,Y(face),sw,base-Y(face));ctx.fillStyle='#7d7d7d';for(let y=face+.3;y<ROW+.98;y+=.3)ctx.fillRect(s0,Y(y),sw,1.5);ctx.fillStyle='#b5b5b5';ctx.fillRect(s0-ts*.05,Y(face)-ts*.1,sw+ts*.1,ts*.12);
 ctx.font=`800 ${Math.round(ts*.3)}px Fredoka, system-ui, sans-serif`;const tw=ctx.measureText('Depot').width+ts*.4,mx=(l+s0)/2,sy=top+ts*.08;ctx.fillStyle='#2b2340';rr(ctx,mx-tw/2,sy,tw,ts*.4,ts*.07);ctx.fill();ctx.strokeStyle='#ffd43b';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#ffd43b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Depot',mx,sy+ts*.2+1);}
function frame(ctx,items,cx,cy,ts,now){if(!W||!W.T[ROW]||!W.T[ROW][FL].rail)return;const dt=TR.last?Math.min(.1,(now-TR.last)/1000):0;TR.last=now;tick(dt);
 const L=HL0*ts-cx,R=(HR1+1)*ts-cx,ty=ROW*ts-cy;if(R<-ts*3||L>W.vw+ts*3||ty>W.vh+ts*3||ty<-ts*4)return;
 /* the track from the side: gravel bank, sleeper ends and the rail the wheels run on, from inside one hill to inside the other */
 items.push({y:ROW-1.5,draw:()=>{const Y=y=>y*ts-cy,l=HL0*ts-cx,r=(HR1+1)*ts-cx;
  ctx.fillStyle='#a89878';ctx.beginPath();ctx.moveTo(l,Y(ROW+.99));ctx.lineTo(l+ts*.1,Y(ROW+.86));ctx.lineTo(r-ts*.1,Y(ROW+.86));ctx.lineTo(r,Y(ROW+.99));ctx.closePath();ctx.fill();
  ctx.fillStyle='#8a7a5c';for(let x=l+ts*.07;x<r;x+=ts*.23)ctx.fillRect(x,Y(ROW+.91)+((x/ts*7|0)%3),2,2);
  ctx.fillStyle='#6b4423';for(let x=l+ts*.1;x<r-ts*.1;x+=ts*.42)ctx.fillRect(x,Y(ROW+.86),ts*.2,ts*.07);
  ctx.fillStyle='#5f666d';ctx.fillRect(l,Y(ROW+.8),r-l,ts*.06);ctx.fillStyle='#ced4da';ctx.fillRect(l,Y(ROW+.8),r-l,ts*.018);}});
 /* the train, clipped to between the tunnel faces so it slides out of one hill and into the other */
 if(TR.ph!=='away')items.push({y:ROW+.3,draw:()=>{ctx.save();ctx.beginPath();ctx.rect(FL*ts-cx,-1e4,(FR-FL)*ts,2e4);ctx.clip();drawTrain(ctx,cx,cy,ts,now);ctx.restore();drawSmoke(ctx,cx,cy,ts);
  if(TR.bubble&&TR.ph==='stop')bubble(ctx,'🔔 '+TR.bubble,(TR.front-1.8)*ts-cx,(ROW-1.75)*ts-cy,ts);}});
 /* the hills, seen from the side, in front of the train: a grassy mound with the tunnel's stone portal edge facing the station */
 items.push({y:ROW+.65,draw:()=>{depot(ctx,cx,cy,ts,HL0-.15,FL);hill(ctx,cx,cy,ts,HR1+1.15,FR,-1,'Discovery Zone');}});
 /* departure board */
 items.push({y:BOARD[1]+.02,draw:()=>{const sx=BOARD[0]*ts-cx,sy=BOARD[1]*ts-cy,mid=sx+ts/2,txt=boardText();
  ctx.font=`800 ${Math.round(ts*.28)}px ui-monospace, Menlo, monospace`;const bw=Math.max(ts*1.3,ctx.measureText(txt).width+ts*.4),bh=ts*.62; /* the frame grows to fit the time or the word */
  ctx.fillStyle='#495057';const py=(ROW+.86)*ts-cy;ctx.fillRect(mid-ts*.05,sy+ts*.15,ts*.1,py-sy-ts*.15);ctx.fillRect(mid-ts*.14,py-ts*.04,ts*.28,ts*.05); /* the post runs down to the track, with a little foot */ctx.fillStyle='#212529';rr(ctx,mid-bw/2,sy-ts*.42,bw,bh,ts*.08);ctx.fill();
  ctx.strokeStyle='#ffd43b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=TR.ph==='away'?'#ffd43b':TR.ph==='out'?'#ff922b':'#69db7c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,mid,sy-ts*.11);
  /* the bell button on the post (owner, Oct 2026): a small red crosswalk-style box; its light glows while the bell has called the train */
  {const bw2=ts*.22,bh2=ts*.3,bx=mid-bw2/2,by=((sy+ts*.2)+((ROW+.86)*ts-cy))/2-bh2/2, /* halfway between the clock and the ground (owner) */pr=TR.press&&now-TR.press<260,lit=TR.called==='bell'&&(TR.ph==='away'||TR.ph==='in');
   ctx.fillStyle='#c92a2a';rr(ctx,bx,by,bw2,bh2,ts*.04);ctx.fill();ctx.strokeStyle='#5c0f0f';ctx.lineWidth=1.5;ctx.stroke();
   ctx.fillStyle=lit?`rgba(255,212,59,${.65+.35*Math.sin(now/180)})`:'#4a1010';ctx.beginPath();ctx.arc(mid,by+bh2*.24,ts*.035,0,7);ctx.fill();
   ctx.fillStyle=pr?'#ced4da':'#f1f3f5';ctx.beginPath();ctx.arc(mid,by+bh2*.64+(pr?1:0),ts*(pr?.058:.066),0,7);ctx.fill();ctx.strokeStyle='#868e96';ctx.lineWidth=1;ctx.stroke();
   ctx.font=`${Math.round(ts*.075)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🔔',mid,by+bh2*.65+(pr?1:0));}
  try{wLabel(ctx,TR.ph==='stop'?'In station':'Next train',sx+ts/2,sy-ts*.66,'#fff','rgba(43,35,64,.85)');}catch(e){}}});
 TR.walkers.forEach(v=>items.push({y:v.y+.01,draw:()=>drawWalker(ctx,v,cx,cy,ts,now)}));}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
/* ---------- the station card ---------- */
let TICK=0;
function cardHTML(){const p=P(),coins=(p&&p.coins)||0,here=TR.ph==='stop',coming=TR.ph==='in',soon=TR.ph==='away'&&TR.wait<=BELL_WAIT;
 const when=here?'is here now! Walk onto the train to get on.':coming?'is pulling in!':TR.ph==='out'?'just left. The next one is on its way.':`comes in <b>${boardText()}</b>.`;
 return `<div class="tr-card"><div class="big-emoji">🚉</div><h2>Number Town Station</h2><p id="trWhen">The next train ${when}</p>
 <div class="row" style="flex-direction:column;align-items:stretch;gap:8px">
  <button class="btn green big" ${TR.ph!=='away'||soon?'disabled':''} onclick="Train._bell()">🔔 Ring the bell<small style="display:block;font-size:14px">Free · the train comes within 1 minute</small></button>
  <button class="btn ghost dark" ${TR.ph!=='away'||TR.wait<=5||coins<CALL_COST?'disabled':''} onclick="Train._call()">🪙 ${CALL_COST} · Call it right now${coins<CALL_COST?` (you have ${coins})`:''}</button>
 </div><p class="muted" style="font-size:15px;margin-top:10px">🔬 This train goes to <b>Dr. Quartz's Lab</b>. When it's here, walk onto it to get on!</p>
 <button class="btn ghost dark" onclick="closeModal()">Close</button></div>`;}
function open(){modal(`<div class="mcard">${cardHTML()}</div>`);clearInterval(TICK);TICK=setInterval(()=>{const el=document.querySelector('#modal.show .tr-card');if(!el){clearInterval(TICK);return;}const w=document.getElementById('trWhen');if(w){const h=cardHTML().match(/<p id="trWhen">([\s\S]*?)<\/p>/);if(h&&w.innerHTML!==h[1])w.innerHTML=h[1];}},500);}
function ring(){if(TR.ph!=='away'||TR.wait<=BELL_WAIT)return;TR.wait=BELL_WAIT;TR.called='bell';bell();try{toast('🔔 Ding ding! The train will be here in 1 minute.');}catch(e){}open();}
function call(){const p=P();if(!p||TR.ph!=='away'||TR.wait<=5||(p.coins||0)<CALL_COST)return;p.coins-=CALL_COST;save();TR.wait=4;TR.called='paid';bell();try{closeModal();toast(`🚂 Here it comes! (−${CALL_COST} 🪙)`);}catch(e){}}
function ride(){modal(`<div class="mcard"><div class="big-emoji">🚂</div><h2>All aboard!</h2><p>The conductor says: "Next stop: <b>🔬 Dr. Quartz's Lab</b>!"</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Stay here</button><button class="btn green big" onclick="Train._board()">Get on ➜</button></div></div>`);}
/* off to the Lab (ride.js plays the trip, lab.js is the Lab); the train on the map pulls out */
/* getting on: the hero disappears into the train, which pulls out (twice as fast) into the east tunnel; once it is inside, the
   ride (ride.js) starts in the carriage (owner, Oct 2026: no separate outside scene) */
function board(){try{closeModal();}catch(e){}try{const p=P();if(p&&W)p.wpos={x:W.hx,y:W.hy};}catch(e){}
 if(TR.ph==='stop'&&W){TR.ph='out';TR.t=0;TR.bubble='';doors(false);TR.riding=true;window.__hideHero=true;window.__petAboard=true;W.path=[];whistle();return;}
 rideNow();}
function rideNow(){TR.riding=false;window.__hideHero=false;window.__petAboard=false;const arrive=()=>{go(window.Lab?'lab':'world');};if(!(window.Ride&&Ride.go('lab',arrive)))arrive();}
function press(){TR.press=performance.now();if(TR.ph==='away'&&TR.wait>BELL_WAIT){ring();return;}try{SFX.tap();}catch(e){}open();}
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s!=='world'&&TR.riding){TR.riding=false;window.__hideHero=false;window.__petAboard=false;}}}); /* never leave the hero hidden */
/* a tap on (or near) the bell button or the post counts as a tap on the sign: the hero walks over and presses it (owner: bigger hotspot) */
window.MQ_TAP=window.MQ_TAP||[];window.MQ_TAP.push((x,y,ts)=>{const mid=(BOARD[0]+.5)*ts,top=BOARD[1]*ts+ts*.15,bot=(ROW+.86)*ts;return Math.abs(x-mid)<ts*.5&&y>top&&y<bot+ts*.1?[BOARD[0],BOARD[1]]:null;});
window.MQ_NPC=window.MQ_NPC||{};window.MQ_NPC.station=press;window.MQ_NPC.tride=ride;
window.Train={_bell:ring,_call:call,_open:open,_board:board,_dbg:{TR,tick,ROW,X0,X1,STOP,BOARD,CALL_COST,BELL_WAIT,spawnRider,spawnBoarder,WHO}};
})();
