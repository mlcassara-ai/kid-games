/* ================= presents on the map (Oct 2026) =================
   The owner asked for drawn presents instead of the 🎁 emoji, and no empty 📦 box after opening. Each wild area still has at most one
   present a day (same rewards as before: wChest/wChestTry in index.html), but it moves: the day is cut into 45-minute windows (staggered
   per area so they don't all change at once); in most windows the area's present sits on a random open spot, in some it isn't there at
   all. Once opened it's gone until tomorrow. Spots and timing come from the clock and the map, never stored, so every device agrees.
   A present doesn't block walking (so it can never cut a path); stepping onto it opens it, like before. Drawn through MQ_MAPDRAW. */
(function(){
const WIN=45,ON=.7,O='#3b2a1e';
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
const hs=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return h;};
const COLS=[['#ff6b6b','#c92a2a','#ffd43b'],['#4dabf7','#1971c2','#ffffff'],['#b197fc','#6741d9','#ffd43b'],['#69db7c','#2b8a3e','#ff8787']];
const svg=([b,d,r])=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 62"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
<ellipse cx="30" cy="57" rx="22" ry="4" fill="rgba(0,0,0,.22)"/>
<rect x="9" y="27" width="42" height="28" rx="3" fill="url(#g)" stroke="${O}" stroke-width="3.5"/>
<rect x="6" y="19" width="48" height="11" rx="3" fill="${b}" stroke="${O}" stroke-width="3.5"/>
<rect x="25" y="19" width="10" height="36" fill="${r}" stroke="${O}" stroke-width="2.5"/>
<path d="M30 19 C22 6 10 10 16 17 C19 20 26 20 30 19 Z M30 19 C38 6 50 10 44 17 C41 20 34 20 30 19 Z" fill="${r}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
<circle cx="30" cy="19" r="4" fill="${r}" stroke="${O}" stroke-width="2.5"/>
<path d="M12 33 v12 M10 22 h10" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></svg>`;
const IMG=COLS.map(c=>{const i=new Image();i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(c));return i;});
let CW=null,CANDS=null,SHOWN={},NEXT=0;
function areas(){return Object.keys(BIOMES).filter(k=>k!=='village'&&!BIOMES[k].overlay);}
/* open spots in each area that the hero can walk to from the town square, away from the area's entrance */
function cands(W){if(CW===W&&CANDS)return CANDS;CW=W;CANDS={};const T=W.T,blk=(a,b,c,d)=>!!(window.MQ_GROUND&&MQ_GROUND.blocked&&MQ_GROUND.blocked(W,a,b,c,d));
 let st=null;for(let y=0;y<T.length&&!st;y++)for(let x=0;x<T[0].length;x++){const t=T[y][x];if(t.plaza&&!t.block){st=[x,y];break;}}
 const seen=new Set();if(st){seen.add(st+'');const q=[st];while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,t=T[ny]&&T[ny][nx];if(!t||t.block||seen.has(nx+','+ny)||blk(x,y,nx,ny))continue;seen.add(nx+','+ny);q.push([nx,ny]);}}}
 for(const k of areas()){const c=BIOMES[k].c,L=[];for(let y=1;y<T.length-1;y++)for(let x=1;x<T[0].length-1;x++){const t=T[y][x];
   if(t.b!==k||t.block||t.water||t.path||t.plaza||t.gate||t.npc||t.rail||t.o||t.deco||!seen.has(x+','+y))continue;if(Math.hypot(x-c[0],y-c[1])<2.5)continue;L.push([x,y]);}
  CANDS[k]=L;}
 return CANDS;}
function opened(k){try{const p=P();return !!(p&&p.chests&&p.chests.d===dayKey()&&p.chests.open.includes(k));}catch(e){return false;}}
/* where each area's present is right now (or nothing) */
function where(W,now){const C=cands(W),out={},m=(now||Date.now())/60000;
 for(const k of areas()){const L=C[k];if(!L||!L.length||opened(k))continue;const off=hash(hs(k),7)*WIN,slot=Math.floor((m+off)/WIN);
  if(hash(hs(k)+slot*13,slot)>=ON)continue;const s=L[Math.floor(hash(hs(k)*3+slot,slot*7+1)*L.length)];out[k]={x:s[0],y:s[1],v:Math.floor(hash(hs(k),slot+3)*IMG.length),slot};}
 return out;}
/* once a second: put the chest marks on the map tiles where the presents are */
function tick(W,now){if(now<NEXT&&CW===W)return;NEXT=now+1000;const cur=where(W);
 for(const k in SHOWN){const s=SHOWN[k],c=cur[k];if(!c||c.x!==s.x||c.y!==s.y){const t=W.T[s.y]&&W.T[s.y][s.x];if(t&&t.chest===k)delete t.chest;delete SHOWN[k];}}
 for(const k in cur){const c=cur[k],t=W.T[c.y][c.x];if(!SHOWN[k]){c.at=now;SHOWN[k]=c;}t.chest=k;}}
function frame(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T)return;tick(W,now);
 for(const k in SHOWN){const s=SHOWN[k],im=IMG[s.v];if(!im.complete||!im.naturalWidth)continue;const sx=s.x*ts-cx,sy=s.y*ts-cy;if(sx<-ts||sy<-ts||sx>W.vw+ts||sy>W.vh+ts)continue;
  items.push({y:s.y,draw:()=>{const a=Math.min(1,(now-s.at)/350),pop=a<1?(1-Math.pow(1-a,3))*1.12-(a>.8?(a-.8)*.6:0):1,bob=Math.sin(now/320+s.x)*ts*.03,w=ts*.8*pop,h=w*62/60;
   ctx.drawImage(im,sx+ts/2-w/2,sy+ts*.98-h+bob,w,h);
   if(Math.floor(now/450+s.x)%3===0){ctx.fillStyle='#fff8c4';const r=ts*.06,px=sx+ts*.82,py=sy+ts*.18;ctx.beginPath();for(let i=0;i<8;i++){const an=i*Math.PI/4,rr=i%2?r*.35:r;ctx.lineTo(px+Math.cos(an)*rr,py+Math.sin(an)*rr);}ctx.fill();}}});}}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
window.MQ_PRESENTS={where:(w,t)=>where(w||W,t),cands:w=>cands(w||W),shown:()=>SHOWN,svg:i=>svg(COLS[i%COLS.length]),WIN,ON};
})();
