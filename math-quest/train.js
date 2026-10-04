/* ================= 🚂 the Town Train (Oct 2026) =================
   A train line across the bottom of the village plaza, below the Wishing Fountain: a grassy hill at each end of the square, seen
   from the side with its tunnel's stone edge facing the station (the train slides out from behind one and into the other), the
   track between, the platform (sidewalk) right beside the rails and a departure board 🚉 above its west end.
   The train comes out of the west tunnel on its own every 4–5 minutes of time on the map, slows into the station, waits
   about 16 s ("All aboard!" near the end, then a whistle) and leaves through the east tunnel. The board counts down to the
   next train. Tapping the board: 🔔 ring the bell (free; the train comes within 1 minute) or 🪙 CALL_COST to call it right now.
   COMING SOON: the destination is not built yet. Walking onto the stopped train says so; everything else works.
   Visitors: now and then someone steps off and walks into Number Town, or comes out of Town to catch the train
   (the Kind Teacher, Dr. Quartz, Principal Wise, Ms. Rosa, Elder Wiz, the Pet Keeper). Riders just appear on the platform beside the
   stopped train; people catching it walk up to it and vanish (nobody is drawn inside). They are scenery: they don't stop the hero.
   Nothing is saved except the coins spent on a call. The clock only runs while the map is on screen.
   Core hooks (index.html): MQ_WORLD (lay the tiles after buildWorld), MQ_MAPDRAW (draw each frame), MQ_NPC (tap handlers),
   and plaza decor skips t.rail tiles. */
(function(){
/* the line sits inside the town square: a hill with a tunnel at each end (tiles 15–17 and 27–29), the visible track between the
   tunnel faces (x 18 to 27), the platform right beside the rails and the departure board just above its west end */
const ROW=21,HL0=15,HL1=17,HR0=27,HR1=29,FL=18,FR=27,X0=HL1,X1=HR0,PL0=18,PL1=26,BOARD=[18,19],CALL_COST=10,BELL_WAIT=60,EVERY=[240,300],FIRST=[45,90];
const LEN=6.1,STOP=26.4,START=FL,END=FR+LEN+.2,T_IN=7,T_STOP=16,T_OUT=7;
const TR={ph:'away',wait:FIRST[0]+Math.random()*(FIRST[1]-FIRST[0]),t:0,front:START,last:0,smoke:[],walkers:[],aboard:[],said:0,called:''};
const rnd=(a,b)=>a+Math.random()*(b-a);
/* ---------- tiles ---------- */
function lay(T){const ok=t=>t&&!t.water&&!t.gate&&!t.chest&&!(t.npc&&t.npc!=='station');
 for(let x=HL0;x<=HR1;x++){const t=T[ROW]&&T[ROW][x];if(!ok(t))continue;t.o=null;t.deco=false;t.rail=true;if(x<=HL1||x>=HR0){t.tunnel=true;t.block=true;}else t.block=false;}
 for(const x of [HL0,HL0+1,HL1,HR0,HR0+1,HR1]){const t=T[ROW-1][x];if(ok(t)){t.o=null;t.deco=false;t.rail=true;t.hill=true;t.block=true;}} /* the hills are two tiles tall */
 for(let x=PL0;x<=PL1;x++){const t=T[ROW-1][x];if(ok(t)){t.platform=true;t.o=null;t.deco=false;}}
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
 else if(TR.ph==='out'){const k=Math.min(1,TR.t/T_OUT);TR.front=STOP+(END-STOP)*k*k;if(k>=1){TR.ph='away';TR.t=0;TR.wait=rnd(EVERY[0],EVERY[1]);TR.aboard=[];}}
 /* steam: puffs from the chimney, more when pulling away */
 if(TR.ph!=='away'&&Math.random()<(TR.ph==='stop'?1.2:4)*dt*3)TR.smoke.push({x:TR.front-.55,y:ROW-.85,r:.18,a:.7,vx:TR.ph==='stop'?0:-.4,vy:-.6});
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
const WHO=[
 {id:'kind',n:'✨ The Kind Teacher',art:()=>typeof kindSVG==='function'&&svgImg('kind',kindSVG()),ar:240/330,h:1.5,off:['Off to see who needs a little help today!','What a lovely little town.'],on:['Time to visit another class!','Keep trying, you are doing great!']},
 {id:'quartz',n:'🔬 Dr. Quartz',art:()=>window.Quartz&&Quartz.SVG&&svgImg('quartz',Quartz.SVG),ar:100/120,h:1.4,off:['Off to the rock shop!','I heard there are new crystals in town.'],on:['Back to my digging!','Rocks wait for no one!']},
 {id:'principal',n:'🎓 Principal Wise',art:()=>typeof principalMapSVG==='function'&&svgImg('principal',principalMapSVG()),ar:100/150,h:1.45,off:['Just checking on everyone in town.','Good morning, Number Town!'],on:['Off to a meeting!','Keep up the good work!']},
 {id:'rosa',n:'Ms. Rosa',e:'👩‍🍳',off:['Fresh ingredients for the cafeteria!','I smell muffins already.'],on:['Back to my kitchen!','Lunch will not cook itself!']},
 {id:'elder',n:'Elder Wiz',e:'🧙',off:['A fine day for a stroll.','Hmm, numbers everywhere!'],on:['Off on a wizard errand.','Farewell, young wizard!']},
 {id:'keeper',n:'Pet Keeper',e:'🧑‍🌾',off:['I brought snacks for the pets!','Hello, Number Town!'],on:['Time to feed the pets!','See you soon!']}];
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
 ctx.restore();if(v.a>.6){try{wLabel(ctx,w.n,sx+ts/2,sy-ts*.62,'#fff','rgba(43,35,64,.82)');}catch(e){}if(v.sayT>0)bubble(ctx,v.say,sx+ts/2,sy-ts*.9,ts);}}
function boardText(){if(TR.ph==='away'){const s=Math.max(0,Math.ceil(TR.wait));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}return TR.ph==='in'?'ARRIVING':TR.ph==='stop'?'BOARDING':'DEPARTED';}
/* one hill from the side: outer foot at xo, tunnel face at xf (d=1 when the face is on its right, -1 on its left) */
function hill(ctx,cx,cy,ts,xo,xf,d){const X=x=>x*ts-cx,Y=y=>y*ts-cy,base=ROW+.98,top=ROW-1.12,face=ROW-.95,mid=xo+(xf-xo)*.42;
 const g=ctx.createLinearGradient(0,Y(top),0,Y(base));g.addColorStop(0,'#74c05a');g.addColorStop(1,'#4f8f3c');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(X(xo),Y(base));
 ctx.bezierCurveTo(X(xo+(mid-xo)*.35),Y(top+.3),X(mid-(mid-xo)*.3),Y(top),X(mid),Y(top));ctx.bezierCurveTo(X(mid+(xf-mid)*.55),Y(top),X(xf-.15*d),Y(face-.25),X(xf),Y(face));ctx.lineTo(X(xf),Y(base));ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(X(mid-.2*d),Y(top+.32),ts*.5,ts*.14,0,0,7);ctx.fill();
 [[.25,.55],[.6,.25]].forEach(([k,dy])=>{const bx=X(xo+(xf-xo)*k),by=Y(top+dy+.35);ctx.fillStyle='#3f7d31';ctx.beginPath();ctx.arc(bx,by,ts*.16,0,7);ctx.arc(bx+ts*.17,by+ts*.03,ts*.13,0,7);ctx.fill();});
 /* the portal's stone edge: blocks seen side-on, with a cap */
 const s0=Math.min(X(xf),X(xf-.36*d)),sw=ts*.36;ctx.fillStyle='#9a9a9a';ctx.fillRect(s0,Y(face),sw,Y(base)-Y(face));ctx.fillStyle='#7d7d7d';for(let y=face+.3;y<base;y+=.3)ctx.fillRect(s0,Y(y),sw,1.5);
 ctx.fillRect(s0+sw/2-.75,Y(face),1.5,Y(base)-Y(face));ctx.fillStyle='#b5b5b5';ctx.fillRect(s0-ts*.05,Y(face)-ts*.1,sw+ts*.1,ts*.12);}
function frame(ctx,items,cx,cy,ts,now){if(!W||!W.T[ROW]||!W.T[ROW][FL].rail)return;const dt=TR.last?Math.min(.1,(now-TR.last)/1000):0;TR.last=now;tick(dt);
 const L=HL0*ts-cx,R=(HR1+1)*ts-cx,ty=ROW*ts-cy;if(R<-ts*3||L>W.vw+ts*3||ty>W.vh+ts*3||ty<-ts*4)return;
 /* platform (the sidewalk), running right up to the rails */
 items.push({y:ROW-1.6,draw:()=>{const x0=PL0*ts-cx,w=(PL1-PL0+1)*ts,y0=(ROW-1)*ts-cy+ts*.12,h=ts*1.3;ctx.fillStyle='#ced4da';ctx.fillRect(x0,y0,w,h);ctx.fillStyle='#adb5bd';for(let i=0;i<=PL1-PL0+1;i++)ctx.fillRect(x0+i*ts,y0,1.5,h);
  ctx.fillRect(x0,y0+ts*.62,w,1.5);ctx.fillStyle='#ffd43b';ctx.fillRect(x0,y0+h-ts*.13,w,ts*.07);ctx.fillStyle='#868e96';ctx.fillRect(x0,y0+h-ts*.06,w,ts*.06);}});
 /* the track, from inside one hill to inside the other */
 items.push({y:ROW-1.5,draw:()=>{const y0=ROW*ts-cy,l=HL0*ts-cx,r=(HR1+1)*ts-cx;ctx.fillStyle='#b8a68a';ctx.fillRect(l,y0+ts*.42,r-l,ts*.5);ctx.fillStyle='#7a5230';for(let x=l;x<r;x+=ts*.34)ctx.fillRect(x,y0+ts*.45,ts*.11,ts*.44);
  ctx.fillStyle='#868e96';ctx.fillRect(l,y0+ts*.53,r-l,ts*.06);ctx.fillRect(l,y0+ts*.78,r-l,ts*.06);}});
 /* the train, clipped to between the tunnel faces so it slides out of one hill and into the other */
 if(TR.ph!=='away')items.push({y:ROW+.3,draw:()=>{ctx.save();ctx.beginPath();ctx.rect(FL*ts-cx,-1e4,(FR-FL)*ts,2e4);ctx.clip();drawTrain(ctx,cx,cy,ts,now);ctx.restore();drawSmoke(ctx,cx,cy,ts);
  if(TR.bubble&&TR.ph==='stop')bubble(ctx,'🔔 '+TR.bubble,(TR.front-1.8)*ts-cx,(ROW-1.75)*ts-cy,ts);}});
 /* the hills, seen from the side, in front of the train: a grassy mound with the tunnel's stone portal edge facing the station */
 items.push({y:ROW+.65,draw:()=>{hill(ctx,cx,cy,ts,HL0-.15,FL,1);hill(ctx,cx,cy,ts,HR1+1.15,FR,-1);}});
 /* departure board */
 items.push({y:BOARD[1]+.02,draw:()=>{const sx=BOARD[0]*ts-cx,sy=BOARD[1]*ts-cy;ctx.fillStyle='#495057';ctx.fillRect(sx+ts*.45,sy+ts*.15,ts*.1,ts*.8);ctx.fillStyle='#212529';rr(ctx,sx-ts*.05,sy-ts*.42,ts*1.1,ts*.62,ts*.08);ctx.fill();
  ctx.strokeStyle='#ffd43b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=TR.ph==='away'?'#ffd43b':'#69db7c';ctx.font=`800 ${Math.round(ts*(TR.ph==='away'?.3:.2))}px ui-monospace, Menlo, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((TR.ph==='away'?'🚂 ':'')+boardText(),sx+ts/2,sy-ts*.11);
  try{wLabel(ctx,'🚉 Station',sx+ts/2,sy-ts*.66,'#fff','rgba(43,35,64,.85)');}catch(e){}}});
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
 </div><p class="muted" style="font-size:15px;margin-top:10px">🚧 Coming soon: we're still building where this train goes. You can watch it, call it and wave to visitors, but you can't ride it yet. Check again soon!</p>
 <button class="btn ghost dark" onclick="closeModal()">Close</button></div>`;}
function open(){modal(`<div class="mcard">${cardHTML()}</div>`);clearInterval(TICK);TICK=setInterval(()=>{const el=document.querySelector('#modal.show .tr-card');if(!el){clearInterval(TICK);return;}const w=document.getElementById('trWhen');if(w){const h=cardHTML().match(/<p id="trWhen">([\s\S]*?)<\/p>/);if(h&&w.innerHTML!==h[1])w.innerHTML=h[1];}},500);}
function ring(){if(TR.ph!=='away'||TR.wait<=BELL_WAIT)return;TR.wait=BELL_WAIT;TR.called='bell';bell();try{toast('🔔 Ding ding! The train will be here in 1 minute.');}catch(e){}open();}
function call(){const p=P();if(!p||TR.ph!=='away'||TR.wait<=5||(p.coins||0)<CALL_COST)return;p.coins-=CALL_COST;save();TR.wait=4;TR.called='paid';bell();try{closeModal();toast(`🚂 Here it comes! (−${CALL_COST} 🪙)`);}catch(e){}}
function ride(){modal(`<div class="mcard"><div class="big-emoji">🚂</div><h2>All aboard?</h2><p>The conductor says: "Sorry! We're still building where this train goes. Check again soon!"</p><p class="muted">🚧 Coming soon</p><button class="btn green big" onclick="closeModal()">OK</button></div>`);}
window.MQ_NPC=window.MQ_NPC||{};window.MQ_NPC.station=open;window.MQ_NPC.tride=ride;
window.Train={_bell:ring,_call:call,_open:open,_dbg:{TR,tick,ROW,X0,X1,STOP,BOARD,CALL_COST,BELL_WAIT,spawnRider,spawnBoarder,WHO}};
})();
