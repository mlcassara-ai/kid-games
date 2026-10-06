/* ================= ambient life on the map (Oct 2026) =================
   A trick from other map games: a few tiny moving things make the board feel alive. Near the hero, at most MAX at a time, themed to the
   area they appear in: butterflies (forest, village, farm), bees (garden), bubbles (reef), embers (volcano), snowflakes (summit, vault),
   little bats (haunted hollow), twinkling stars (chaos tower), crystal sparkles (caves). Drawing only: nothing to bump into, no game change.
   Drawn through MQ_MAPDRAW (the same hook as the train), on top of everything else. */
(function(){
const MAX=18,KIND={forest:'fly',village:'fly',farm:'fly',garden:'bee',reef:'bubble',volcano:'ember',summit:'snow',vault:'snow',haunt:'bat',tower:'twinkle',caves:'sparkle'};
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
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);window.MQ_MAPDRAW.push(puffs);
window.MQ_AMBIENT={KIND,count:()=>P.length,puffs:()=>PUFF.length};
})();
