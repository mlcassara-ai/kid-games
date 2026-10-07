/* ================= ambient life on the map (Oct 2026) =================
   A trick from other map games: a few tiny moving things make the board feel alive. Near the hero, at most MAX at a time, themed to the
   area they appear in: butterflies (forest, village, farm), bees (garden), bubbles (reef), embers (volcano), snowflakes (summit, vault),
   little bats (haunted hollow), twinkling stars (chaos tower), crystal sparkles (caves). Drawing only: nothing to bump into, no game change.
   Drawn through MQ_MAPDRAW (the same hook as the train), on top of everything else. */
(function(){
const MAX=18,KIND={forest:'fly',village:'fly',farm:'fly',garden:'bee',reef:'bubble',island:'bubble',volcano:'ember',summit:'snow',vault:'snow',haunt:'bat',tower:'twinkle',caves:'sparkle'};
const FLY=['#ffd43b','#ff8787','#74c0fc','#b197fc','#ffa94d'];
let P=[],last=0,spawnAt=0;
function spawn(W,x0,x1,y0,y1){const x=x0+Math.random()*(x1-x0+1),y=y0+Math.random()*(y1-y0+1),t=W.T[Math.floor(y)]&&W.T[Math.floor(y)][Math.floor(x)];if(!t||t.plaza)return;
 const k=KIND[t.b];if(!k)return;P.push({k,x,y,t:0,life:k==='twinkle'||k==='sparkle'?1.6:6+Math.random()*4,vx:(Math.random()-.5)*.4,vy:k==='bubble'||k==='ember'?-.35-Math.random()*.2:k==='snow'?.25+Math.random()*.15:(Math.random()-.5)*.2,
  c:FLY[Math.floor(Math.random()*FLY.length)],ph:Math.random()*6});}
function draw1(ctx,p,cx,cy,ts,now){const sx=p.x*ts-cx,sy=p.y*ts-cy,a=Math.min(1,p.t*2,(p.life-p.t)*1.5);if(a<=0)return;ctx.globalAlpha=a;const s=ts*.09;
 if(p.k==='fly'||p.k==='bee'){const f=Math.abs(Math.sin(now/90+p.ph));ctx.fillStyle=p.k==='bee'?'#ffd43b':p.c;ctx.strokeStyle='#3b2a1e';ctx.lineWidth=1;
  for(const d of [-1,1]){ctx.beginPath();ctx.ellipse(sx+d*s*.7*f,sy,s*.8*f+1,s,0,0,7);ctx.fill();ctx.stroke();}if(p.k==='bee'){ctx.fillStyle='#3b2a1e';ctx.fillRect(sx-1,sy-s*.6,2,s*1.2);}}
 else if(p.k==='bubble'){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,sy,s*(.6+p.t*.08),0,7);ctx.stroke();}
 else if(p.k==='ember'){ctx.fillStyle=p.t%0.6<.3?'#ffd43b':'#ff922b';ctx.beginPath();ctx.arc(sx,sy,s*.45,0,7);ctx.fill();}
 else if(p.k==='snow'){ctx.fillStyle='#fff';ctx.strokeStyle='rgba(120,150,180,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sy,s*.5,0,7);ctx.fill();ctx.stroke();}
 else if(p.k==='bat'){const f=Math.sin(now/70+p.ph)*.6;ctx.fillStyle='#2b2140';ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx-s*1.2,sy-s*(1+f),sx-s*2,sy);ctx.quadraticCurveTo(sx-s,sy-s*.2,sx,sy+s*.3);ctx.quadraticCurveTo(sx+s,sy-s*.2,sx+s*2,sy);ctx.quadraticCurveTo(sx+s*1.2,sy-s*(1+f),sx,sy);ctx.fill();}
 else{const r=s*(.5+Math.sin(p.t/p.life*Math.PI)*.9);ctx.fillStyle=p.k==='twinkle'?'#ffe066':'#a5d8ff';ctx.beginPath();for(let i=0;i<8;i++){const a2=i*Math.PI/4,rr=i%2?r*.35:r;ctx.lineTo(sx+Math.cos(a2)*rr,sy+Math.sin(a2)*rr);}ctx.fill();}
 ctx.globalAlpha=1;}
function frame(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T||!W.vw)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
 const x0=Math.max(0,Math.floor(cx/ts)),y0=Math.max(0,Math.floor(cy/ts)),x1=Math.min(W.T[0].length-1,Math.floor((cx+W.vw)/ts)),y1=Math.min(W.T.length-1,Math.floor((cy+W.vh)/ts));
 if(now>spawnAt&&P.length<MAX){spawnAt=now+250;spawn(W,x0,x1,y0,y1);}
 P.forEach(p=>{p.t+=dt;p.x+=p.vx*dt+(p.k==='fly'||p.k==='bee'||p.k==='bat'?Math.sin(p.t*2+p.ph)*.3*dt:p.k==='snow'?Math.sin(p.t+p.ph)*.15*dt:0);p.y+=p.vy*dt+(p.k==='fly'?Math.cos(p.t*3+p.ph)*.25*dt:0);});
 P=P.filter(p=>p.t<p.life&&p.x>x0-2&&p.x<x1+3&&p.y>y0-2&&p.y<y1+3);
 if(P.length)items.push({y:1e6,draw:()=>P.forEach(p=>draw1(ctx,p,cx,cy,ts,now))});}
/* little clear puffs behind the hero's feet with each step (owner, Oct 2026): see-through bubbles rather than brown dust, so they look
   right on grass, sand, snow and water alike. Drawing only. */
let PUFF=[],LMT=0;
function puffs(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T||window.__hideHero)return;
 if(W.mt&&W.mt!==LMT&&now-W.mt<500){LMT=W.mt;const n=2+Math.floor(Math.random()*2);for(let i=0;i<n;i++)PUFF.push({x:W.fx+.5+(Math.random()-.5)*.35,y:W.fy+.88+(Math.random()-.5)*.1,t0:now+i*45,r:.1+Math.random()*.06,dx:(W.fx-W.hx)*.25+(Math.random()-.5)*.15,dy:-.12-Math.random()*.1});}
 PUFF=PUFF.filter(p=>now-p.t0<600);
 PUFF.forEach(p=>{const k=(now-p.t0)/600;if(k<0)return;items.push({y:Math.floor(p.y)-.01,draw:()=>{const x=(p.x+p.dx*k)*ts-cx,y=(p.y+p.dy*k)*ts-cy,r=ts*p.r*(.6+.9*k),a=.9*(1-k*k);
  ctx.globalAlpha=a;ctx.fillStyle='rgba(255,255,255,.5)';ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(1.2,ts*.025);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(x-r*.35,y-r*.35,r*.22,0,7);ctx.fill();ctx.globalAlpha=1;}});});}
/* the Wishing Fountain thinks out loud now and then (owner, Oct 2026): once every 2 to 8 minutes on the map a thought bubble pops up over
   it for a few seconds with a short line, to tempt kids over to see what it is. Drawing only. */
const SAYS=['Hi…','Hee hee hee!','That\'s funny!','Psst… over here!','I have a secret…','Make a wish!','Splish splash!','Bubbles tickle!','Anyone got a coin?','Is anyone there?','I just thought of a joke…','Ooh, what was that?'];
let SAY=null,SAYAT=0,SAYI=Math.floor(Math.random()*SAYS.length);const SAYLEN=6000,nextSay=now=>now+(2+Math.random()*6)*60000;
function fountainSay(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T)return;if(!SAYAT)SAYAT=nextSay(now);
 if(!SAY&&now>=SAYAT){SAYI=(SAYI+1+Math.floor(Math.random()*(SAYS.length-1)))%SAYS.length;SAY={t:SAYS[SAYI],at:now};SAYAT=nextSay(now);}
 if(!SAY)return;const k=(now-SAY.at)/SAYLEN;if(k>=1){SAY=null;return;}
 let fx=null;try{const n=NPCS.find(q=>q.id==='fountain');if(n)fx=[n.x,n.y];}catch(e){}if(!fx)return;
 const ax=(fx[0]+.82)*ts-cx,ay=(fx[1]-.2)*ts-cy,pop=Math.max(0,Math.min(1,(now-SAY.at)/250)),fade=k>.88?(1-k)/.12:1;
 items.push({y:1e6-1,draw:()=>{ctx.save();ctx.globalAlpha=fade;const fs=Math.max(12,ts*.24);ctx.font=`700 ${fs}px Fredoka, sans-serif`;const tw=ctx.measureText(SAY.t).width,w=(tw+fs*1.4)*pop,h=fs*2*pop,bx=ax+ts*.3+w/2,by=ay-ts*.62; /* up and to the right, clear of Number Town */
  ctx.fillStyle='#fff';ctx.strokeStyle='#3b2a1e';ctx.lineWidth=Math.max(1.5,ts*.03);
  [[ax,ay,ts*.06],[ax+ts*.14,ay-ts*.22,ts*.09]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r*pop,0,7);ctx.fill();ctx.stroke();});
  const x0=bx-w/2,y0=by-h/2,r=h/2;ctx.beginPath();ctx.moveTo(x0+r,y0);ctx.lineTo(x0+w-r,y0);ctx.arc(x0+w-r,y0+r,r,-Math.PI/2,Math.PI/2);ctx.lineTo(x0+r,y0+h);ctx.arc(x0+r,y0+r,r,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();ctx.stroke();
  if(pop>=1){ctx.fillStyle='#2b2250';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(SAY.t,bx,by+fs*.05);}ctx.restore();}});}
/* shark fins in the sea round the map (owner, Oct 2026; the alligators went: it's salt water): a few at a time near the hero; each one
   rises out of the water, swims along the coast for a few seconds and sinks back down. Drawing only.
   Shark jump: each time the hero walks within 2 squares of the sea there's a 1-in-5 chance a shark leaps out of the water near them,
   says one of SHARK and splashes back in (at most one every 15 s). */
let SEA=[],SEAAT=0;const SEAMAX=3;
const SHARK=['You look like lunch to me!','Mmm… is that a snack I smell?','Come on in, the water\'s lovely! Heh heh.','Chomp chomp! Just practising.','I\'m not hungry. …Okay, maybe a little hungry.','Nice shoes! Are they crunchy?','Don\'t mind me, just keeping my teeth shiny!'];
let JUMP=null,JUMPAT=0,NEARSEA=false,SHI=-1;const JLEN=1700,JSAY=3200;
function startJump(W,now,hx,hy){let best=null,bd=1e9;for(let y=hy-3;y<=hy+3;y++)for(let x=hx-3;x<=hx+3;x++)if(edgeSea(W,x,y)){const d=Math.hypot(x-hx,y-hy);if(d<bd){bd=d;best=[x,y];}}
 if(!best)return false;SHI=(SHI+1+Math.floor(Math.random()*(SHARK.length-1)))%SHARK.length;
 JUMP={x:best[0]+.5,y:best[1]+.6,t0:now,dir:best[0]+.5<=hx+.5?1:-1,t:SHARK[SHI]};JUMPAT=now+15000;return true;}
function sharkCheck(W,now){const hx=W.hx,hy=W.hy;let near=false;for(let y=hy-2;y<=hy+2&&!near;y++)for(let x=hx-2;x<=hx+2;x++)if(edgeSea(W,x,y)){near=true;break;}
 if(near&&!NEARSEA&&!JUMP&&now>JUMPAT&&Math.random()<.2)startJump(W,now,hx,hy);NEARSEA=near;}
/* the leaping shark: up out of the water in an arc, nose first, and back in with a splash */
function drawShark(ctx,s){ctx.lineWidth=Math.max(1.2,2*s);ctx.strokeStyle='#2b3440';
 ctx.fillStyle='#7d8b99';ctx.beginPath();ctx.moveTo(-30*s,0);ctx.lineTo(-40*s,-11*s);ctx.lineTo(-37*s,0);ctx.lineTo(-40*s,10*s);ctx.closePath();ctx.fill();ctx.stroke(); /* tail */
 ctx.beginPath();ctx.moveTo(-4*s,-8*s);ctx.quadraticCurveTo(0,-20*s,8*s,-23*s);ctx.quadraticCurveTo(7*s,-14*s,10*s,-7*s);ctx.closePath();ctx.fill();ctx.stroke(); /* dorsal fin */
 ctx.beginPath();ctx.ellipse(0,0,32*s,10*s,0,0,7);ctx.fill();ctx.stroke(); /* body */
 ctx.fillStyle='#eef2f5';ctx.beginPath();ctx.ellipse(6*s,4*s,22*s,5*s,0,0,Math.PI);ctx.fill(); /* belly */
 ctx.fillStyle='#7d8b99';ctx.beginPath();ctx.moveTo(2*s,5*s);ctx.lineTo(-6*s,15*s);ctx.lineTo(10*s,7*s);ctx.closePath();ctx.fill();ctx.stroke(); /* side fin */
 ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(21*s,-3*s,2.2*s,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(21.7*s,-3.7*s,.8*s,0,7);ctx.fill();
 ctx.strokeStyle='#2b3440';ctx.beginPath();ctx.moveTo(15*s,3*s);ctx.quadraticCurveTo(23*s,7*s,30*s,2*s);ctx.stroke(); /* grin */
 ctx.fillStyle='#fff';for(let i=0;i<4;i++){const tx=(17+i*3.3)*s,ty=(4.3+Math.sin(i/3*Math.PI)*.8)*s;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+1.6*s,ty);ctx.lineTo(tx+.8*s,ty+2.2*s);ctx.closePath();ctx.fill();}
 ctx.strokeStyle='rgba(43,52,64,.5)';ctx.lineWidth=Math.max(1,1.2*s);[9,12,15].forEach(gx=>{ctx.beginPath();ctx.moveTo(gx*s,-4*s);ctx.lineTo((gx-1)*s,1*s);ctx.stroke();});}
function splash(ctx,x,y,ts,k,seed){const s=ts/50;ctx.save();ctx.strokeStyle=`rgba(255,255,255,${1-k})`;ctx.lineWidth=Math.max(1.2,2*s);ctx.beginPath();ctx.ellipse(x,y,(10+26*k)*s,(3+7*k)*s,0,0,7);ctx.stroke();
 ctx.fillStyle=`rgba(225,245,255,${1-k})`;for(let i=0;i<9;i++){const a=Math.PI*(.1+.8*((i*37+seed)%9)/8),v=(18+((i*53)%7)*3)*s,px=x+Math.cos(a)*v*k*1.4*(i%2?1:-1),py=y-Math.sin(a)*v*k*2+30*s*k*k;ctx.beginPath();ctx.arc(px,py,(2.6-k*1.2)*s,0,7);ctx.fill();}ctx.restore();}
function sharkJump(ctx,items,cx,cy,ts,now){if(!JUMP)return;const age=now-JUMP.t0;if(age>Math.max(JLEN,JSAY)+300){JUMP=null;return;}
 const bx=JUMP.x*ts-cx,by=JUMP.y*ts-cy;if(bx<-ts*3||by<-ts*3||bx>W.vw+ts*3||by>W.vh+ts*3)return;const s=ts/50;
 items.push({y:Math.floor(JUMP.y)+.35,draw:()=>{const k=age/JLEN;
  if(k<1){const x=bx+(k-.5)*ts*1.3*JUMP.dir,y=by-Math.sin(k*Math.PI)*ts*1.5,ang=Math.atan2(-Math.cos(k*Math.PI)*1.5*Math.PI,1.3)*JUMP.dir;
   ctx.save();ctx.beginPath();ctx.rect(-1e4,-1e4,2e4,1e4+by+4*s);ctx.clip(); /* nothing below the water line */
   ctx.translate(x,y);ctx.rotate(ang);ctx.scale(JUMP.dir,1);drawShark(ctx,s);ctx.restore();}
  if(age<700)splash(ctx,bx-ts*.65*JUMP.dir,by,ts,age/700,3);
  if(k>.8&&age<JLEN+700)splash(ctx,bx+ts*.65*JUMP.dir,by,ts,Math.min(1,(age-JLEN*.8)/700),5);}});
 if(age<JSAY){const ax=bx+ts*.2,ay=by-ts*1.6,pop=Math.max(.01,Math.min(1,age/250)),fade=age>JSAY-400?(JSAY-age)/400:1;
  items.push({y:1e6-1,draw:()=>{ctx.save();ctx.globalAlpha=fade;const fs=Math.max(12,ts*.24);ctx.font=`700 ${fs}px Fredoka, sans-serif`;const tw=ctx.measureText(JUMP.t).width,w=(tw+fs*1.4)*pop,h=fs*2*pop,x0=Math.max(4,Math.min(W.vw-w-4,ax-w/2)),y0=ay-h,r=h/2;
   ctx.fillStyle='#fff';ctx.strokeStyle='#2b3440';ctx.lineWidth=Math.max(1.5,ts*.03);ctx.beginPath();ctx.moveTo(x0+r,y0);ctx.lineTo(x0+w-r,y0);ctx.arc(x0+w-r,y0+r,r,-Math.PI/2,Math.PI/2);ctx.lineTo(x0+r,y0+h);ctx.arc(x0+r,y0+r,r,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();ctx.stroke();
   if(pop>=1){ctx.fillStyle='#2b2250';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(JUMP.t,x0+w/2,y0+h/2+fs*.05);}ctx.restore();}});}}
const edgeSea=(W,x,y)=>{const t=W.T[y]&&W.T[y][x];return !!(t&&t.water)&&(x<=1||y<=1||x>=W.T[0].length-2||y>=W.T.length-2);};
function seaLife(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T||!W.vw)return;const dt=1/60;sharkCheck(W,now);sharkJump(ctx,items,cx,cy,ts,now);
 const x0=Math.max(0,Math.floor(cx/ts)-1),y0=Math.max(0,Math.floor(cy/ts)-1),x1=Math.min(W.T[0].length-1,Math.floor((cx+W.vw)/ts)+1),y1=Math.min(W.T.length-1,Math.floor((cy+W.vh)/ts)+1);
 if(now>SEAAT&&SEA.length<SEAMAX){SEAAT=now+1800+Math.random()*3500;const L=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(edgeSea(W,x,y))L.push([x,y]);
  if(L.length){const [x,y]=L[Math.floor(Math.random()*L.length)],H=W.T.length,Wd=W.T[0].length,horiz=y<=1||y>=H-2,d=Math.random()<.5?-1:1;
   SEA.push({k:'fin',x:x+.5,y:y+.55,vx:horiz?d*.45:0,vy:horiz?0:d*.45,t0:now,life:5000+Math.random()*3000,dir:horiz?d:(Math.random()<.5?-1:1)});}}
 SEA=SEA.filter(c=>now-c.t0<c.life);
 SEA.forEach(c=>{const age=now-c.t0,nx=c.x+c.vx*dt,ny=c.y+c.vy*dt;if(edgeSea(W,Math.floor(nx),Math.floor(ny))){c.x=nx;c.y=ny;}
  const up=Math.min(1,age/700,(c.life-age)/700);if(up<=0)return;const sx=c.x*ts-cx,sy=c.y*ts-cy;if(sx<-ts||sy<-ts||sx>W.vw+ts||sy>W.vh+ts)return;
  items.push({y:Math.floor(c.y)+.3,draw:()=>{ctx.save();ctx.translate(sx,sy);ctx.scale(c.dir,1);const s=ts/50;ctx.lineWidth=Math.max(1.2,2*s);
   /* ripples round it */ctx.strokeStyle=`rgba(255,255,255,${.75*up})`;ctx.beginPath();ctx.ellipse(0,4*s,(16+6*(1-up))*s,4.5*s,0,0,7);ctx.stroke();
   ctx.beginPath();ctx.moveTo(-26*s,5*s);ctx.quadraticCurveTo(-18*s,1*s,-12*s,5*s);ctx.stroke();
   ctx.beginPath();ctx.rect(-40*s,-40*s,80*s,44*s);ctx.clip();ctx.translate(0,(1-up)*16*s); /* only the part above the water shows */
   ctx.strokeStyle='#2b3a2a';
   {ctx.fillStyle='#7d8b99';ctx.beginPath();ctx.moveTo(-8*s,4*s);ctx.quadraticCurveTo(-4*s,-6*s,4*s,-18*s);ctx.quadraticCurveTo(5*s,-6*s,10*s,4*s);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.moveTo(-3*s,1*s);ctx.quadraticCurveTo(0,-6*s,3.5*s,-14*s);ctx.stroke();}
   ctx.restore();
   ctx.save();ctx.translate(sx,sy);ctx.scale(c.dir,1);ctx.strokeStyle=`rgba(255,255,255,${.9*up})`;ctx.lineWidth=Math.max(1.2,2*s);ctx.beginPath();ctx.moveTo(-14*s,4.5*s);ctx.lineTo(16*s,4.5*s);ctx.stroke();ctx.restore();}});});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);window.MQ_MAPDRAW.push(seaLife);window.MQ_MAPDRAW.push(puffs);window.MQ_MAPDRAW.push(fountainSay);
window.MQ_AMBIENT={SHARK,jump:()=>JUMP&&JUMP.t,jumpNow:()=>{JUMPAT=0;return typeof W!=='undefined'&&startJump(W,performance.now(),W.hx,W.hy);},sea:()=>SEA.length,KIND,count:()=>P.length,puffs:()=>PUFF.length,say:()=>SAY&&SAY.t,sayNow:()=>{SAYAT=1;},SAYS};
})();
