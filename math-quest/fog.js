/* ================= fog days (Oct 2026) =================
   Now and then (owner: about once a week, and always if it has been two weeks) a hero's first visit to the map that day starts in front of
   the Wishing Fountain with the whole map under fog. The fog is solid (you can't see through it) and clears around the hero as they walk.
   It lasts the whole day: the cleared squares are saved, so leaving the game and coming back the same day brings back the same fog.
   Just for fun: walking, battles and everything else work as usual. Saved: p.fog = {last: the day of the last fog day, on: 1 while that day's
   fog is up, s: the cleared squares as a base64 bitmap (row by row)}. Drawn through MQ_MAPDRAW on top of everything except the hero's own bubbles. */
(function(){
const R0=3.2,SOFT=1.6,WEEK=7,MAX=14;let R=R0;
/* the clear circle grows with the screen (owner, Oct 2026: on a big iPad 3.2 squares looked tiny): a quarter of the squares that fit across the
   narrower side, never under R0 (phones and laptops keep 3.2) and never over 5 */
const radius=()=>{try{return W&&W.ts&&W.vw&&W.vh?Math.max(R0,Math.min(5,Math.min(W.vw,W.vh)/W.ts*.25)):R0;}catch(e){return R0;}};

let ON=false,SEEN=null,FPID=null,CHECKED=null,DIRTY=0,SAVED_AT=0;
const days=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
/* is today a fog day? never two days running; from day 7 a coin flip each day, sure by day 14 */
function due(p){const f=p.fog||{};if(!f.last)return Math.random()<.35;const d=days(f.last,dayKey());if(d<=0)return false;if(d>=MAX)return true;if(d<WEEK)return false;return Math.random()<.5;}
/* the cleared squares <-> a short string kept in the save */
function enc(W){const Wd=W.T[0].length,H=W.T.length,b=new Uint8Array(Math.ceil(Wd*H/8));SEEN.forEach(k=>{const x=k%1000,y=(k-x)/1000;if(x<Wd&&y<H){const i=y*Wd+x;b[i>>3]|=1<<(i&7);}});let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s);}
function dec(W,str){const out=new Set();if(!str)return out;let s='';try{s=atob(str);}catch(e){return out;}const Wd=W.T[0].length;for(let i=0;i<s.length;i++){const v=s.charCodeAt(i);if(!v)continue;for(let j=0;j<8;j++)if(v&(1<<j)){const n=i*8+j,x=n%Wd,y=(n-x)/Wd;out.add(y*1000+x);}}return out;}
function persist(force){if(!ON||!DIRTY||typeof W==='undefined'||!W||!W.T)return;const now=Date.now();if(!force&&now-SAVED_AT<4000)return;try{const p=P();if(!p||p.id!==FPID||!p.fog||p.fog.last!==dayKey())return;p.fog.s=enc(W);DIRTY=0;SAVED_AT=now;save();}catch(e){}}
function begin(force){try{const p=P();if(!p||!p.setup||typeof W==='undefined'||!W||!W.T)return false;
  if(window.MQ_XFOG&&MQ_XFOG.has(p))return false; /* a new hero still exploring under the explore-fog (xfog.js) gets no fog days until it's gone */
  if(!force&&!due(p)){return false;}
  p.fog={last:dayKey(),on:1,s:''};save();ON=true;SEEN=new Set();FPID=p.id;DIRTY=0;
  const n=NPCS.find(q=>q.id==='fountain'),fx=n?n.x:22,fy=n?n.y+1:18,t=W.T[fy]&&W.T[fy][fx];if(t&&!t.block){W.hx=fx;W.hy=fy;W.drawX=fx;W.drawY=fy;W.path=[];p.wpos={x:fx,y:fy};}
  setTimeout(()=>{try{toast('🌫️ A thick fog rolled in overnight! Walk around to clear it.');}catch(e){}},600);return true;}catch(e){return false;}}
/* coming back on the same fog day: the same fog, with the squares already cleared */
function resume(p){if(!p||!p.fog||!p.fog.on||p.fog.last!==dayKey()||typeof W==='undefined'||!W||!W.T)return false;ON=true;FPID=p.id;SEEN=dec(W,p.fog.s);DIRTY=0;return true;}
function reveal(){R=radius();const hx=Math.round(W.drawX!=null?W.drawX:W.hx),hy=Math.round(W.drawY!=null?W.drawY:W.hy),r=Math.ceil(R+SOFT);
 for(let y=hy-r;y<=hy+r;y++)for(let x=hx-r;x<=hx+r;x++){if(x<0||y<0)continue;const d=Math.hypot(x-W.hx,y-W.hy),k=y*1000+x;if(d<=R&&!SEEN.has(k)){SEEN.add(k);DIRTY=1;}}}
function frame(ctx,items,cx,cy,ts,now){if(!ON||typeof W==='undefined'||!W||!W.T)return;{const p=P();if(!p||p.id!==FPID||!p.fog||p.fog.last!==dayKey()){ON=false;return;}}reveal();persist(false);
 items.push({y:1e6-5,draw:()=>{const x0=Math.max(0,Math.floor(cx/ts)),y0=Math.max(0,Math.floor(cy/ts)),x1=Math.min(W.T[0].length-1,Math.floor((cx+W.vw)/ts)),y1=Math.min(W.T.length-1,Math.floor((cy+W.vh)/ts));
  const px=(W.drawX!=null?W.drawX:W.hx),py=(W.drawY!=null?W.drawY:W.hy);ctx.save();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(SEEN.has(y*1000+x))continue;const d=Math.hypot(x-px,y-py),edge=d<R+SOFT?Math.max(0,(d-R)/SOFT):1,sh=Math.round(4*Math.sin(now/1700+x*.7+y*.4));
   /* solid: nothing shows through except a soft rim right next to the hero */
   ctx.fillStyle=`rgba(${222+sh},${227+sh},${236+sh},${edge>=1?1:Math.min(1,.35+edge*.65)})`;ctx.fillRect(x*ts-cx,y*ts-cy,ts+1,ts+1);}
  /* soft drifting puffs so it reads as fog, not a grid */
  for(let i=0;i<10;i++){const fx=((i*173+now/90)%(W.vw+300))-150,fy=(i*97%Math.max(1,W.vh))+Math.sin(now/2300+i)*18,r=ts*(1.6+(i%3)*.6),gx=Math.floor((fx+cx)/ts),gy=Math.floor((fy+cy)/ts);
   if(SEEN.has(gy*1000+gx))continue;const g=ctx.createRadialGradient(fx,fy,0,fx,fy,r);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(fx,fy,r,0,7);ctx.fill();}
  ctx.restore();}});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{
 if(s!=='world'){persist(true);if(s==='profiles'){ON=false;CHECKED=null;}return;}
 if(/[?&]smoke=/.test(location.search))return; /* never by itself on the smoke-test page */
 const p=P();if(!p||CHECKED===p.id)return;CHECKED=p.id;setTimeout(()=>{if(!resume(p))begin(false);},50);}});
addEventListener('pagehide',()=>persist(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)persist(true);});
window.MQ_FOG={on:()=>ON,start:()=>begin(true),stop:()=>{ON=false;try{const p=P();if(p&&p.fog){p.fog.on=0;save();}}catch(e){}},seen:()=>SEEN?SEEN.size:0,due,
 resume:()=>{try{return resume(P());}catch(e){return false;}},_save:()=>{DIRTY=1;persist(true);},_off:()=>{ON=false;SEEN=null;}};
})();
