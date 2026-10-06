/* ================= fog days (Oct 2026) =================
   Now and then (owner: about once a week, and always if it has been two weeks) a hero's first visit to the map that day starts in front of
   the Wishing Fountain with the whole map under fog. The fog clears around the hero as they walk and stays cleared for that visit.
   Just for fun: walking, battles and everything else work as usual. Saved: p.fog = {last: the day of the last fog day}. Drawn through
   MQ_MAPDRAW on top of everything except the hero's own bubbles. */
(function(){
const R=3.2,SOFT=1.6,WEEK=7,MAX=14;
let ON=false,SEEN=null,DONE=false,FW=null;
const days=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
/* is today a fog day? never two days running; from day 7 a coin flip each day, sure by day 14 */
function due(p){const f=p.fog||{};if(!f.last)return Math.random()<.35;const d=days(f.last,dayKey());if(d<=0)return false;if(d>=MAX)return true;if(d<WEEK)return false;return Math.random()<.5;}
function begin(force){try{const p=P();if(!p||!p.setup||typeof W==='undefined'||!W||!W.T)return false;
  if(!force&&!due(p)){return false;}
  p.fog={last:dayKey()};save();ON=true;SEEN=new Set();FW=W;
  const n=NPCS.find(q=>q.id==='fountain'),fx=n?n.x:22,fy=n?n.y+1:18,t=W.T[fy]&&W.T[fy][fx];if(t&&!t.block){W.hx=fx;W.hy=fy;W.drawX=fx;W.drawY=fy;W.path=[];p.wpos={x:fx,y:fy};}
  setTimeout(()=>{try{toast('🌫️ A thick fog rolled in overnight! Walk around to clear it.');}catch(e){}},600);return true;}catch(e){return false;}}
function reveal(){const hx=Math.round(W.drawX!=null?W.drawX:W.hx),hy=Math.round(W.drawY!=null?W.drawY:W.hy),r=Math.ceil(R+SOFT);
 for(let y=hy-r;y<=hy+r;y++)for(let x=hx-r;x<=hx+r;x++){const d=Math.hypot(x-W.hx,y-W.hy);if(d<=R)SEEN.add(y*1000+x);}}
function frame(ctx,items,cx,cy,ts,now){if(!ON||typeof W==='undefined'||!W||!W.T)return;if(FW!==W){ON=false;return;}reveal();
 items.push({y:1e6-5,draw:()=>{const x0=Math.max(0,Math.floor(cx/ts)),y0=Math.max(0,Math.floor(cy/ts)),x1=Math.min(W.T[0].length-1,Math.floor((cx+W.vw)/ts)),y1=Math.min(W.T.length-1,Math.floor((cy+W.vh)/ts));
  const px=(W.drawX!=null?W.drawX:W.hx),py=(W.drawY!=null?W.drawY:W.hy);ctx.save();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(SEEN.has(y*1000+x))continue;const d=Math.hypot(x-px,y-py),edge=d<R+SOFT?Math.max(0,(d-R)/SOFT):1,drift=.04*Math.sin(now/1700+x*.7+y*.4);
   ctx.fillStyle=`rgba(232,236,242,${Math.min(.95,(.86+drift)*edge)})`;ctx.fillRect(x*ts-cx,y*ts-cy,ts+1,ts+1);}
  /* soft drifting puffs so it reads as fog, not a grid */
  for(let i=0;i<10;i++){const fx=((i*173+now/90)%(W.vw+300))-150,fy=(i*97%Math.max(1,W.vh))+Math.sin(now/2300+i)*18,r=ts*(1.6+(i%3)*.6),gx=Math.floor((fx+cx)/ts),gy=Math.floor((fy+cy)/ts);
   if(SEEN.has(gy*1000+gx))continue;const g=ctx.createRadialGradient(fx,fy,0,fx,fy,r);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(fx,fy,r,0,7);ctx.fill();}
  ctx.restore();}});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s!=='world'||DONE||/[?&]smoke=/.test(location.search))return; /* never by itself on the smoke-test page */DONE=true;setTimeout(()=>begin(false),50);}});
window.MQ_FOG={on:()=>ON,start:()=>begin(true),stop:()=>{ON=false;},seen:()=>SEEN?SEEN.size:0,due};
})();
