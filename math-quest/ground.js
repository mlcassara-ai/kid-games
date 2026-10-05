/* ================= the map's ground (Oct 2026) =================
   The owner asked for a finer, more varied floor and real-looking trails. Every map tile is drawn as 2×2 smaller squares (a quarter of the
   size) in 4 shades of its area's colours, picked by a fixed hash so the floor never flickers; where two areas meet the small squares mix
   for a soft border; water gets shades and a light foam edge on the shore. Paths are drawn as rounded dirt trails (a darker edge, a lighter
   middle, a few pebbles) joined to their neighbours, into the town square and up to each world's gate.
   Drawing only: walking is unchanged (the trail is still the same path tiles, and kids can still walk off the trail anywhere they could).
   The core map (index.html, wFrame) calls MQ_GROUND.draw for the ground when this file is loaded. About 4 fills per visible tile a frame. */
(function(){
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=c=>Math.max(0,Math.min(255,Math.round(k>0?c+(255-c)*k:c*(1+k))));return `rgb(${f(r)},${f(g)},${f(b)})`;};
const PAL={};
function pal(b){if(PAL[b])return PAL[b];const B=BIOMES[b]||BIOMES.village;return PAL[b]=[B.g,B.g2,shade(B.g,.09),shade(B.g2,-.08)];}
const WATER=['#4aa3df','#459bd6','#52abe6','#3f93cc'],PLAZA=['#e8dcc0','#e2d5b6'];
const pick=(p,h)=>h<.38?p[0]:h<.68?p[1]:h<.86?p[2]:p[3];
const land=t=>t&&!t.water&&!t.plaza;
function draw(ctx,W,x0,x1,y0,y1,cx,cy,ts,now){const T=W.T,h2=ts/2;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=T[y][x],sx=x*ts-cx,sy=y*ts-cy;
  if(t.plaza){ctx.fillStyle=PLAZA[(x+y)%2];ctx.fillRect(sx,sy,ts+1,ts+1);continue;}
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){const hx=x*2+i,hy=y*2+j,h=hash(hx,hy);let col;
   if(t.water)col=WATER[h<.4?0:h<.75?1:h<.9?2:3];
   else{let b=t.b;const nx=T[y][x+(i?1:-1)],ny=T[y+(j?1:-1)]&&T[y+(j?1:-1)][x];
    if(land(nx)&&nx.b!==b&&hash(hx+91,hy)<.4)b=nx.b;else if(land(ny)&&ny.b!==b&&hash(hx,hy+57)<.4)b=ny.b; /* soft borders between areas */
    col=pick(pal(b),h);}
   ctx.fillStyle=col;ctx.fillRect(sx+i*h2,sy+j*h2,h2+1,h2+1);
   if(!t.water&&h>.9){ctx.fillStyle='rgba(0,0,0,.09)';ctx.fillRect(sx+i*h2+h2*.3,sy+j*h2+h2*.45,Math.max(2,ts*.05),Math.max(2,ts*.05));}} /* tiny specks */
  if(t.water){ctx.fillStyle='rgba(214,240,255,.75)';const e=Math.max(2,ts*.05);
   if(land(T[y-1]&&T[y-1][x]))ctx.fillRect(sx,sy,ts,e);if(land(T[y+1]&&T[y+1][x]))ctx.fillRect(sx,sy+ts-e,ts,e);if(land(T[y][x-1]))ctx.fillRect(sx,sy,e,ts);if(land(T[y][x+1]))ctx.fillRect(sx+ts-e,sy,e,ts);
   if((x*13+y*7)%11===0){ctx.globalAlpha=.5+.3*Math.sin(now/600+x);ctx.drawImage(wSprite('〰️',ts*.5),sx+ts*.2,sy+ts*.2,ts*.6,ts*.6);ctx.globalAlpha=1;}}}
 /* trails: a darker edge then a lighter middle, each a dot per path tile joined to its path, gate and plaza neighbours */
 const X0=Math.max(0,x0-1),X1=Math.min(T[0].length-1,x1+1),Y0=Math.max(0,y0-1),Y1=Math.min(T.length-1,y1+1);
 const link=u=>u&&(u.path||u.gate||u.plaza);
 for(const [w,col] of [[.66,'#b8975c'],[.5,'#dcc38d']]){ctx.fillStyle=col;const r=ts*w/2;
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const t=T[y][x];if(!t.path)continue;const mx=x*ts-cx+h2,my=y*ts-cy+h2;
   ctx.beginPath();ctx.arc(mx,my,r,0,7);ctx.fill();
   const R=T[y][x+1],D=T[y+1]&&T[y+1][x],L=T[y][x-1],U=T[y-1]&&T[y-1][x];
   if(link(R))ctx.fillRect(mx,my-r,R.path?ts:h2,2*r);if(link(D))ctx.fillRect(mx-r,my,2*r,D.path?ts:h2);
   if(R&&R.path&&D&&D.path&&T[y+1][x+1]&&T[y+1][x+1].path)ctx.fillRect(mx,my,ts,ts); /* a 2-wide road: fill the middle of each 2×2 block */
   if(L&&(L.gate||L.plaza))ctx.fillRect(mx-h2,my-r,h2,2*r);if(U&&(U.gate||U.plaza))ctx.fillRect(mx-r,my-h2,2*r,h2);}}
 ctx.fillStyle='#c4a46c';for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!T[y][x].path)continue;const h=hash(x*5+3,y*5+1);if(h<.55){const px=x*ts-cx+ts*(.3+h*.5),py=y*ts-cy+ts*(.35+hash(x,y*3)*.35);ctx.beginPath();ctx.arc(px,py,Math.max(1.5,ts*.035),0,7);ctx.fill();}}}
window.MQ_GROUND={draw};
})();
