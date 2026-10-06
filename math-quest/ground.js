/* ================= the map's ground (Oct 2026) =================
   The owner asked for a finer, more varied floor and real-looking trails. Every map tile is drawn as N×N smaller squares (N=4: a sixteenth of the
   size) in 4 shades of its area's colours, picked by a fixed hash so the floor never flickers; where two areas meet a low stone wall
   runs along the border (drawWalls); water gets shades and a light foam edge on the shore. Trails: see routes() below.
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
/* colours of a tile's small squares, worked out once and kept (the ground never changes) */
function tileCols(W,x,y){const G=W._gcol||(W._gcol={}),k=y*1000+x;if(G[k])return G[k];const p=pal(W.T[y][x].b),out=[];
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)out.push(pick(p,hash(x*N+i,y*N+j)));return G[k]=out;}
/* low dry-stone walls where two areas meet (owner, Oct 2026: "little rock walls" between areas). Since 2026.10.05x they BLOCK walking,
   except at gates: every stretch of border gets a gate (where the old road crosses if it does, else near its middle; long stretches get
   two), every pair of neighbouring areas gets at least one, and a last check opens an extra gate wherever a wall would cut off anything
   the hero could reach before (an entrance, a chest, a patch of ground). All worked out once per map (W._walls) from the map itself,
   with no randomness, so the gates are always in the same places. Core walking asks MQ_GROUND.blocked(W,x1,y1,x2,y2).
   Edge bits per tile: 1 = its right edge, 2 = its bottom edge. */
const ek=(x,y)=>y*1000+x;
function buildWalls(W){const T=W.T,H=T.length,Wd=T[0].length,raw={},gate={};
 const walk=t=>!!t&&!t.block,spec=t=>!!t&&t.block&&!!(t.gate||t.npc||t.chest);
 /* the town square counts as its own area, so it gets a wall around it too, with openings like any other border (owner, Oct 2026) */
 const zone=t=>t&&!t.water?(t.plaza?'town':t.b):null;
 const edges=[];for(let y=0;y<H;y++)for(let x=0;x<Wd;x++){const t=T[y][x],z=zone(t);if(!z)continue;
  const R=T[y][x+1],D=T[y+1]&&T[y+1][x],zr=zone(R),zd=zone(D);
  if(zr&&zr!==z){raw[ek(x,y)]=(raw[ek(x,y)]||0)|1;edges.push({x,y,d:1,p:[z,zr].sort().join('|'),a:t,b:R});}
  if(zd&&zd!==z){raw[ek(x,y)]=(raw[ek(x,y)]||0)|2;edges.push({x,y,d:2,p:[z,zd].sort().join('|'),a:t,b:D});}}
 const open=e=>{gate[ek(e.x,e.y)]=(gate[ek(e.x,e.y)]||0)|e.d;};
 /* stretches of border: edges of the same pair of areas that touch at a corner */
 const ends=e=>e.d===1?[[e.x+1,e.y],[e.x+1,e.y+1]]:[[e.x,e.y+1],[e.x+1,e.y+1]],par=edges.map((_,i)=>i),find=i=>par[i]===i?i:(par[i]=find(par[i]));
 const byPt={};edges.forEach((e,i)=>ends(e).forEach(([px,py])=>{const k=e.p+'@'+px+','+py;if(k in byPt)par[find(i)]=find(byPt[k]);else byPt[k]=i;}));
 const comp={};edges.forEach((e,i)=>{(comp[find(i)]=comp[find(i)]||[]).push(e);});
 const good=e=>walk(e.a)&&walk(e.b)&&!e.a.water&&!e.b.water,mid=e=>e.d===1?[e.x+1,e.y+.5]:[e.x+.5,e.y+1],pairGates={};
 Object.values(comp).forEach(L=>{const c=L.filter(good);if(L.length<3||!c.length)return;const roads=c.filter(e=>e.a.path||e.b.path),pool=roads.length?roads:c;
  const cx=L.reduce((s,e)=>s+mid(e)[0],0)/L.length,cy=L.reduce((s,e)=>s+mid(e)[1],0)/L.length,d2=(e,q)=>Math.hypot(mid(e)[0]-q[0],mid(e)[1]-q[1]);
  const g1=pool.reduce((a,e)=>d2(e,[cx,cy])<d2(a,[cx,cy])?e:a);open(g1);pairGates[L[0].p]=1;
  if(L.length>14){const g2=c.reduce((a,e)=>d2(e,mid(g1))>d2(a,mid(g1))?e:a);if(d2(g2,mid(g1))>7)open(g2);}});
 /* every pair of neighbouring areas: at least one gate */
 const pairs={};edges.forEach(e=>(pairs[e.p]=pairs[e.p]||[]).push(e));
 Object.entries(pairs).forEach(([p,L])=>{if(pairGates[p])return;const c=L.filter(good);if(c.length)open(c[Math.floor(c.length/2)]);});
 /* nothing the hero could reach before may be cut off */
 const wallAt=(x1,y1,x2,y2,useGates)=>{const [x,y,d]=x2>x1?[x1,y1,1]:x2<x1?[x2,y2,1]:y2>y1?[x1,y1,2]:[x2,y2,2];const m=(raw[ek(x,y)]||0)&d;return !!m&&!(useGates&&((gate[ek(x,y)]||0)&d));};
 let st=null;for(let y=0;y<H&&!st;y++)for(let x=0;x<Wd;x++){const t=T[y][x];if(t.plaza&&walk(t)){st=[x,y];break;}}
 if(!st){W._walls={wall:raw,gate};return;}
 const reach=walls=>{const seen=new Set([ek(st[0],st[1])]),q=[st];while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,t=T[ny]&&T[ny][nx],k=ek(nx,ny);
   if(!t||seen.has(k)||!(walk(t)||spec(t))||(walls&&wallAt(x,y,nx,ny,true)))continue;seen.add(k);if(walk(t))q.push([nx,ny]);}}return seen;};
 const before=reach(false);
 for(let n=0;n<400;n++){const now=reach(true);let fixed=false;
  for(const k of before){if(now.has(k))continue;const x=k%1000,y=Math.floor(k/1000);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,t=T[ny]&&T[ny][nx];if(!now.has(ek(nx,ny))||!walk(t)||!wallAt(nx,ny,x,y,true))continue;
    const [ex,ey,d]=x>nx?[nx,ny,1]:x<nx?[x,y,1]:y>ny?[nx,ny,2]:[x,y,2];gate[ek(ex,ey)]=(gate[ek(ex,ey)]||0)|d;fixed=true;break;}
   if(fixed)break;}
  if(!fixed)break;}
 /* nothing big may stand in an opening: clear blocking scenery (trees, rocks…) from the squares either side of every gate */
 for(const k in gate){const x=k%1000,y=Math.floor(k/1000),m=gate[k];for(const [ax,ay] of [[x,y]].concat(m&1?[[x+1,y]]:[]).concat(m&2?[[x,y+1]]:[])){const t=T[ay]&&T[ay][ax];if(t&&t.o&&t.block&&!t.gate&&!t.npc&&!t.chest&&!t.water){t.o=null;t.block=false;}}}
 const wall={};for(const k in raw){const m=raw[k]&~(gate[k]||0);if(m)wall[k]=m;}
 W._walls={wall,gate};}
const wallsOf=(W,x,y)=>{if(!W._walls)buildWalls(W);return W._walls.wall[ek(x,y)]||0;};
/* is there a wall (not a gate) between two side-by-side tiles? */
function blocked(W,x1,y1,x2,y2){if(!W||!W.T)return false;if(Math.abs(x2-x1)+Math.abs(y2-y1)!==1)return false;
 const [x,y,d]=x2>x1?[x1,y1,1]:x2<x1?[x2,y2,1]:y2>y1?[x1,y1,2]:[x2,y2,2];return !!(wallsOf(W,x,y)&d);}
const WS={};
const rr=(g,x,y,w,h,r)=>{g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}; /* roundRect is missing on older iPads */
/* age: 0 = clean, 1 = weathered (dirt stains, a crack), 2 = old and mossy (owner, Oct 2026: walls should look a little old). Chosen by
   stretch of wall, so whole runs look mossy or dusty rather than every stone being different. */
function wallSprite(ts,dir,v,age){const key=Math.round(ts)+dir+v+'a'+age;if(WS[key])return WS[key];const L=ts*1.14,Th=ts*.34,c=document.createElement('canvas');
 c.width=Math.ceil(dir==='h'?L:Th);c.height=Math.ceil(dir==='h'?Th:L);const g=c.getContext('2d'),n=4,GREY=['#a8a29a','#b5afa6','#9d968c','#bdb7ae','#a39d93'],OLD=['#9d978c','#a49d90','#938c80','#aaa396','#968f84'];
 for(let i=0;i<n;i++){const hv=hash(v*17+i,dir==='h'?3:9),len=L/n*(1.02+hv*.12),u=(i+.5)*L/n+(hv-.5)*ts*.04,w=Th*(.78+hash(i,v*5)*.18);
  const [x,y,ww,hh]=dir==='h'?[u-len/2,(Th-w)/2,len,w]:[(Th-w)/2,u-len/2,w,len],r=Math.min(ww,hh)*.42,hs=hash(i*7+v*13,age*31+(dir==='h'?1:2));
  g.fillStyle='rgba(40,30,20,.22)';g.beginPath();rr(g,x+1,y+2.5,ww,hh,r);g.fill();
  g.fillStyle=(age?OLD:GREY)[Math.floor(hash(i*3+v,7)*GREY.length)];g.strokeStyle='#5c544b';g.lineWidth=Math.max(1,ts*.025);g.beginPath();rr(g,x,y,ww,hh,r);g.fill();g.stroke();
  g.save();g.beginPath();rr(g,x,y,ww,hh,r);g.clip();
  if(age&&hs<.75){g.fillStyle='rgba(96,72,44,.28)';g.beginPath();g.ellipse(x+ww*(.3+hs*.4),y+hh*.78,ww*.4,hh*.3,0,0,7);g.fill();} /* dirt along the bottom */
  if(age===1&&hs>.6){g.strokeStyle='rgba(70,60,50,.55)';g.lineWidth=Math.max(1,ts*.018);g.beginPath();g.moveTo(x+ww*.55,y+hh*.12);g.lineTo(x+ww*.45,y+hh*.5);g.lineTo(x+ww*.6,y+hh*.85);g.stroke();} /* a crack */
  if(age===2&&hs<.8){const m=2+Math.floor(hs*3);for(let k=0;k<m;k++){const mx=x+ww*hash(i*5+k,v+age*3),my=y+hh*(.05+.4*hash(k*3+i,v*7+1)),mr=Math.min(ww,hh)*(.18+.2*hash(k,i+v));
    g.fillStyle=k%2?'rgba(104,148,62,.9)':'rgba(78,124,48,.9)';g.beginPath();g.arc(mx,my,mr,0,7);g.fill();}} /* moss on top */
  g.restore();
  if(age<2||hs>=.8){g.fillStyle='rgba(255,255,255,'+(age?.22:.35)+')';g.beginPath();rr(g,x+ww*.18,y+hh*.14,ww*.5,hh*.28,r*.5);g.fill();}}
 return WS[key]=c;}
function drawWalls(ctx,W,x0,x1,y0,y1,cx,cy,ts){const o=ts*.07,Th=ts*.34,up=ts*.42;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const m=wallsOf(W,x,y);if(!m)continue;const v=Math.floor(hash(x,y*3)*4),ag=hash(Math.floor(x/4)*7+1,Math.floor(y/4)*5+3),age=ag<.35?0:ag<.65?1:2;
  if(m&1)ctx.drawImage(wallSprite(ts,'v',v,age),(x+1)*ts-cx-Th/2,y*ts-cy-o);
  if(m&2)ctx.drawImage(wallSprite(ts,'h',v,age),x*ts-cx-o,(y+1)*ts-cy-Th/2);}
 /* gates are plain openings in the wall (owner, Oct 2026: nothing drawn, so kids aren't confused) */}
const N=4; /* small squares per tile side: 4×4 per tile (owner, Oct 2026: a quarter of the earlier 2×2) */
function draw(ctx,W,x0,x1,y0,y1,cx,cy,ts,now){const T=W.T,h2=ts/2,q=ts/N;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=T[y][x],sx=x*ts-cx,sy=y*ts-cy;
  if(t.plaza){const h=ts/2;for(let j=0;j<2;j++)for(let i=0;i<2;i++){ctx.fillStyle=PLAZA[(i+j)%2];ctx.fillRect(sx+i*h,sy+j*h,h+.6,h+.6);}continue;} /* town paving: half-size squares (owner, Oct 2026) */
  const C=tileCols(W,x,y);for(let j=0;j<N;j++)for(let i=0;i<N;i++){ctx.fillStyle=C[j*N+i];ctx.fillRect(sx+i*q,sy+j*q,q+.6,q+.6);}
  }
 drawWater(ctx,T,x0,x1,y0,y1,cx,cy,ts,now);
 drawWalls(ctx,W,Math.max(0,x0-1),x1,Math.max(0,y0-1),y1,cx,cy,ts);
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
/* the thin ring of village ground left round the town square made a maze of walls (owner, Oct 2026): each of those squares joins the
   nearest neighbouring area instead, so the town wall runs straight along the square's edge. Runs when the map is built, before decor. */
window.MQ_WORLD=window.MQ_WORLD||[];window.MQ_WORLD.push(T=>{const H=T.length,Wd=T[0].length,q=[],src={};
 const vil=t=>t&&t.b==='village'&&!t.plaza&&!t.water;
 for(let y=0;y<H;y++)for(let x=0;x<Wd;x++){const t=T[y][x];if(t&&!t.plaza&&!t.water&&t.b!=='village')q.push([x,y]);}
 for(let i=0;i<q.length;i++){const [x,y]=q[i],b=src[y*1000+x]||T[y][x].b;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,u=T[ny]&&T[ny][nx],k=ny*1000+nx;if(!vil(u)||(k in src))continue;src[k]=b;q.push([nx,ny]);}}
 for(const k in src){const t=T[Math.floor(k/1000)][k%1000];t.b=src[k];}});
/* a wider sea round the edge of the map (owner, Oct 2026: two tiles instead of one, room for the alligators and shark fins in
   ambient.js). Laid after the map is built, so nothing else on the map moves. */
window.MQ_WORLD.push(T=>{const H=T.length,Wd=T[0].length;for(let y=0;y<H;y++)for(let x=0;x<Wd;x++){if(!(x<=1||y<=1||x>=Wd-2||y>=H-2))continue;const t=T[y][x];
 if(t.water||t.gate||t.npc||t.plaza)continue;t.water=true;t.block=true;t.o=null;t.deco=false;t.path=false;}});
window.MQ_GROUND={draw,routes,blocked,walls:W=>{if(!W._walls)buildWalls(W);return W._walls;}};
})();
