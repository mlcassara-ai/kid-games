/* ================= the map's ground (Oct 2026) =================
   The owner asked for a finer, more varied floor and real-looking trails. Every map tile is drawn as N×N smaller squares (N=4: a sixteenth of the
   size) in 4 shades of its area's colours, picked by a fixed hash so the floor never flickers; where two areas meet the small squares mix
   for a soft border; water gets shades and a light foam edge on the shore. Trails: see routes() below.
   Drawing only: walking is unchanged (the trail is still the same path tiles, and kids can still walk off the trail anywhere they could).
   The core map (index.html, wFrame) calls MQ_GROUND.draw for the ground when this file is loaded. About 16 fills per visible tile a frame. */
(function(){
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=c=>Math.max(0,Math.min(255,Math.round(k>0?c+(255-c)*k:c*(1+k))));return `rgb(${f(r)},${f(g)},${f(b)})`;};
const PAL={};
function pal(b){if(PAL[b])return PAL[b];const B=BIOMES[b]||BIOMES.village;return PAL[b]=[B.g,shade(B.g,-.018),shade(B.g,.03),B.g2];} /* close shades (owner: the floor must read as background, not noise) */
const PLAZA=['#e8dcc0','#e2d5b6'];
const pick=(p,h)=>h<.5?p[0]:h<.75?p[1]:h<.9?p[2]:p[3];
const land=t=>t&&!t.water&&!t.plaza;
/* colours of a tile's small squares, worked out once and kept (the ground never changes). Owner, Oct 2026: borders between areas should
   fade smoothly, not jag. Each small square blends its own shade with any different neighbouring area by how close it is to that side
   (half-and-half right at the edge, nothing by the middle), the same from both sides, so colours fade across about one tile each way. */
const rgbOf=c=>{if(c[0]==='#'){const n=parseInt(c.slice(1),16);return [n>>16,(n>>8)&255,n&255];}return c.match(/\d+/g).map(Number);};
const PRGB={};const palRGB=b=>PRGB[b]||(PRGB[b]=pal(b).map(rgbOf));
const ew=u=>Math.max(0,.5-u);
function tileCols(W,x,y){const G=W._gcol||(W._gcol={}),k=y*1000+x;if(G[k])return G[k];const T=W.T,own=T[y][x].b,P=palRGB(own),out=[],nb=[];
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const u=(dx||dy)&&T[y+dy]&&T[y+dy][x+dx];if(land(u)&&u.b!==own)nb.push([dx,dy,palRGB(u.b)[0]]);}
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const fx=(i+.5)/N,fy=(j+.5)/N,h=hash(x*N+i,y*N+j),c=P[h<.5?0:h<.75?1:h<.9?2:3];let r=0,g=0,bl=0,ws=0;
  for(const [dx,dy,m] of nb){const wx=dx<0?ew(fx):ew(1-fx),wy=dy<0?ew(fy):ew(1-fy),w=dx&&dy?2*wx*wy:dx?wx:wy;if(w<=0)continue;r+=m[0]*w;g+=m[1]*w;bl+=m[2]*w;ws+=w;}
  const a=Math.min(ws,.5),o=ws?a/ws:0;out.push(`rgb(${Math.round(c[0]*(1-a)+r*o)},${Math.round(c[1]*(1-a)+g*o)},${Math.round(c[2]*(1-a)+bl*o)})`);}
 return G[k]=out;}
const N=4; /* small squares per tile side: 4×4 per tile (owner, Oct 2026: a quarter of the earlier 2×2) */
function draw(ctx,W,x0,x1,y0,y1,cx,cy,ts,now){const T=W.T,h2=ts/2,q=ts/N;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=T[y][x],sx=x*ts-cx,sy=y*ts-cy;
  if(t.plaza){ctx.fillStyle=PLAZA[(x+y)%2];ctx.fillRect(sx,sy,ts+1,ts+1);continue;}
  const C=tileCols(W,x,y);for(let j=0;j<N;j++)for(let i=0;i<N;i++){ctx.fillStyle=C[j*N+i];ctx.fillRect(sx+i*q,sy+j*q,q+.6,q+.6);}
  }
 drawWater(ctx,T,x0,x1,y0,y1,cx,cy,ts,now);
 if(TRAILS)drawRoutes(ctx,W,cx,cy,ts,x0,x1,y0,y1);}
/* ponds and the sea (owner, Oct 2026: square ponds looked blocky): each water tile is a slightly wobbly round blob joined to its water
   neighbours, first a pale foam ring, then the water, so shorelines are rounded with land showing around them. Water still blocks the
   whole tile for walking, as before. */
function drawWater(ctx,T,x0,x1,y0,y1,cx,cy,ts,now){const Wt=(x,y)=>!!(T[y]&&T[y][x]&&T[y][x].water),X0=Math.max(0,x0-1),X1=Math.min(T[0].length-1,x1+1),Y0=Math.max(0,y0-1),Y1=Math.min(T.length-1,y1+1),h2=ts/2;
 for(const [k,col] of [[.64,'#d6f0ff'],[.53,'#4aa3df']]){ctx.fillStyle=col;
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){if(!Wt(x,y))continue;const r=ts*(k+(hash(x*3+1,y*5+2)-.5)*.1),mx=x*ts-cx+h2,my=y*ts-cy+h2;
   ctx.beginPath();ctx.arc(mx,my,r,0,7);ctx.fill();if(Wt(x+1,y))ctx.fillRect(mx,my-r,ts,2*r);if(Wt(x,y+1))ctx.fillRect(mx-r,my,2*r,ts);if(Wt(x+1,y)&&Wt(x,y+1)&&Wt(x+1,y+1))ctx.fillRect(mx,my,ts,ts);
   /* inside corners: where two water neighbours meet around a land corner, round it off so the pond reads as one soft shape */
   for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]])if(Wt(x+dx,y)&&Wt(x,y+dy)&&!Wt(x+dx,y+dy)){ctx.beginPath();ctx.arc(mx+dx*h2,my+dy*h2,r*.78,0,7);ctx.fill();}}}
 /* the moving wave marks */
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!Wt(x,y)||(x*13+y*7)%11)continue;ctx.globalAlpha=.5+.3*Math.sin(now/600+x);ctx.drawImage(wSprite('〰️',ts*.5),x*ts-cx+ts*.2,y*ts-cy+ts*.2,ts*.6,ts*.6);ctx.globalAlpha=1;}}
const TRAILS=false; /* owner, Oct 2026: no trails on the map (the routes code stays, switched off) */
/* trails (owner, Oct 2026: not all 90° turns, dirt only, with natural variety; some stop short of their entrance). Each world gets one
   route from the town square to its entrance, found along the old road tiles, then drawn as a smooth curve: corners rounded wide and long
   straight runs given a gentle wander. The dirt swells and narrows, has lighter and darker patches, faint wheel ruts in places, a slightly
   uneven edge and pebbles. A few routes stop about 4 tiles short, so the last steps are across open ground. Drawing only. */
const sh=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return hash(h,7);};
function routes(W){if(W._routes)return W._routes;const T=W.T,out=[];
 for(const [zid,c] of Object.entries(W.gates||{})){const key=(x,y)=>x+','+y,prev={},q=[[c[0],c[1]]];prev[key(c[0],c[1])]=null;let end=null;
  while(q.length){const [x,y]=q.shift(),t=T[y]&&T[y][x];if(t&&t.plaza){end=[x,y];break;}
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,u=T[ny]&&T[ny][nx];if(!u||(key(nx,ny) in prev)||!(u.path||u.plaza))continue;prev[key(nx,ny)]=[x,y];q.push([nx,ny]);}}
  if(!end)continue;const tl=[];for(let k=end;k;k=prev[key(k[0],k[1])])tl.push(k); /* town square → entrance */
  if(tl.length<3)continue;
  /* corner points, with a gentle sideways wander on long straight runs */
  /* the old roads are often 2 tiles wide: centre each route in its road, so routes sharing a road lie on top of each other */
  const pathAt=(x,y)=>!!(T[y]&&T[y][x]&&T[y][x].path),mid=(b,dx,dy)=>{let x=b[0]+.5,y=b[1]+.5;
   if(dx===0){if(pathAt(b[0]+1,b[1]))x+=.5;else if(pathAt(b[0]-1,b[1]))x-=.5;}if(dy===0){if(pathAt(b[0],b[1]+1))y+=.5;else if(pathAt(b[0],b[1]-1))y-=.5;}return [x,y];};
  const pts=[mid(tl[1],tl[1][0]-tl[0][0],tl[1][1]-tl[0][1])];
  for(let i=1;i<tl.length-1;i++){const a=tl[i-1],b=tl[i],n=tl[i+1];if(a[0]-b[0]!==b[0]-n[0]||a[1]-b[1]!==b[1]-n[1])pts.push(mid(b,b[0]-a[0],b[1]-a[1]));
   else if(i%4===2){const dx=n[0]-a[0],dy=n[1]-a[1],w=(hash(b[0]*13,b[1]*17)-.5)*.9,m=mid(b,dx,dy);pts.push([m[0]-dy/2*w,m[1]+dx/2*w]);}}
  pts.push([tl[tl.length-1][0]+.5,tl[tl.length-1][1]+.5]);
  /* round every corner with a curve, then sample the line every ~0.25 tile */
  const P=[pts[0]],lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t],len=(p,q)=>Math.hypot(q[0]-p[0],q[1]-p[1]);
  const seg=(p,q)=>{const n=Math.max(1,Math.ceil(len(p,q)/.25));for(let i=1;i<=n;i++)P.push(lerp(p,q,i/n));};
  let cur=pts[0];
  for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],n=pts[i+1],r=Math.min(2.6,len(a,b)/2,len(b,n)/2),s0=lerp(b,a,r/len(a,b)),s1=lerp(b,n,r/len(b,n));
   seg(cur,s0);const m=Math.max(4,Math.ceil(r*4));for(let k=1;k<=m;k++){const t=k/m,u=1-t;P.push([u*u*s0[0]+2*u*t*b[0]+t*t*s1[0],u*u*s0[1]+2*u*t*b[1]+t*t*s1[1]]);}cur=s1;}
  seg(cur,pts[pts.length-1]);
  const D=[0];for(let i=1;i<P.length;i++)D.push(D[i-1]+len(P[i-1],P[i]));
  let last=P.length;if(sh(zid)<.3){const tot=D[D.length-1];while(last>2&&tot-D[last-1]<4)last--;} /* stops short of the entrance */
  out.push({zid,P:P.slice(0,last),D:D.slice(0,last)});}
 return W._routes=out;}
/* the trail's width at a point: swells and narrows slowly along its length */
const wid=(r,i)=>.72+.1*Math.sin(r.D[i]*.9+sh(r.zid)*6)+.05*Math.sin(r.D[i]*2.3);
function drawRoutes(ctx,W,cx,cy,ts,x0,x1,y0,y1){const RS=routes(W);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const vis=p=>p[0]>=x0-2&&p[0]<=x1+3&&p[1]>=y0-2&&p[1]<=y1+3,X=p=>p[0]*ts-cx,Y=p=>p[1]*ts-cy;
 const run=(extra,col)=>{ctx.strokeStyle=col;for(const r of RS)for(let i=1;i<r.P.length;i++){if(!vis(r.P[i]))continue;ctx.lineWidth=ts*(wid(r,i)+extra);ctx.beginPath();ctx.moveTo(X(r.P[i-1]),Y(r.P[i-1]));ctx.lineTo(X(r.P[i]),Y(r.P[i]));ctx.stroke();}};
 run(.16,'#b8975c');run(0,'#d9bf88'); /* the edge, then the dirt */
 for(const r of RS)for(let i=1;i<r.P.length-1;i++){const p=r.P[i];if(!vis(p))continue;const q=r.P[i+1],dx=q[0]-r.P[i-1][0],dy=q[1]-r.P[i-1][1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,h=hash(Math.round(p[0]*40),Math.round(p[1]*40)),w=wid(r,i)/2;
  if(i%3===0){ctx.fillStyle=h<.5?'rgba(255,240,200,.35)':'rgba(150,110,60,.18)';ctx.beginPath();ctx.ellipse(X([p[0]+nx*(h-.5)*w,p[1]+ny*(h-.5)*w]),Y([p[0]+nx*(h-.5)*w,p[1]+ny*(h-.5)*w]),ts*.18,ts*.1,Math.atan2(dy,dx),0,7);ctx.fill();} /* patches */
  if(i%4===2&&h>.55){const s=h>.78?1:-1;ctx.fillStyle='#b8975c';ctx.beginPath();ctx.arc(X([p[0]+nx*s*(w+.07),p[1]+ny*s*(w+.07)]),Y([p[0]+nx*s*(w+.07),p[1]+ny*s*(w+.07)]),ts*.07,0,7);ctx.fill();} /* uneven edge */
  if(i%5===1&&h<.4){ctx.fillStyle='#c4a46c';ctx.beginPath();ctx.arc(X([p[0]+nx*(h-.2)*w*1.4,p[1]+ny*(h-.2)*w*1.4]),Y([p[0]+nx*(h-.2)*w*1.4,p[1]+ny*(h-.2)*w*1.4]),Math.max(1.5,ts*.035),0,7);ctx.fill();}} /* pebbles */
 /* faint wheel ruts on some stretches */
 ctx.strokeStyle='rgba(150,115,65,.22)';ctx.lineWidth=Math.max(1,ts*.04);
 for(const r of RS)for(const o of [-.17,.17]){let on=false;ctx.beginPath();for(let i=1;i<r.P.length-1;i++){const p=r.P[i],use=Math.sin(r.D[i]*.45+sh(r.zid)*9)>.35&&vis(p);
   if(!use){on=false;continue;}const q=r.P[i+1],dx=q[0]-r.P[i-1][0],dy=q[1]-r.P[i-1][1],l=Math.hypot(dx,dy)||1,pt=[p[0]-dy/l*o,p[1]+dx/l*o];if(!on){ctx.moveTo(X(pt),Y(pt));on=true;}else ctx.lineTo(X(pt),Y(pt));}ctx.stroke();}
 ctx.restore();}
window.MQ_GROUND={draw,routes};
})();
