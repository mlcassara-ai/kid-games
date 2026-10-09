/* ================= 🗺️ the explore-fog (Oct 2026) =================
   Only for heroes made from Oct 2026 on (newPlayer sets p.nh=1; every older hero keeps the whole map, always). The map starts hidden except
   the town square; walking clears about 3 squares around the hero with a soft edge, so trees, water, entrances and visitors show up a
   couple of steps before you reach them. Entrances and their names, people's squares, chests and anyone in W.mobs on a hidden square are
   not drawn at all (core wFrame asks MQ_HID(x,y)); everything else is simply covered.
   Saved per hero: p.xfog = the explored squares as a base64 bitmap (WCOLS×WROWS bits, row by row, about 340 characters), every few seconds
   while new squares open, when leaving the map and when the page is hidden; a copy saved on another device is merged in (OR).
   Once 97% of the squares you can walk to are explored the fog is gone for good (p.xfogOff=1, p.xfog dropped); a grown-up can do that at
   once from the Parent Corner (Reveal the whole map). Nothing else changes: walking and tapping into the fog work as usual.
   Separate from fog days (fog.js), which skip a hero who still has this fog. Drawing: one pixel per square on a small canvas
   (opaque = hidden), drawn scaled up over the map with smoothing (that's the soft edge); it is only repainted when squares open. */
(function(){
const R0=3.2,DONE=.97,SAVE_MS=4000;let R=R0;
/* the clear circle grows with the screen (owner, Oct 2026: on a big iPad 3.2 squares looked tiny): a quarter of the squares that fit across the
   narrower side, never under R0 (phones and laptops keep 3.2) and never over 5 */
const radius=()=>{try{return W&&W.ts&&W.vw&&W.vh?Math.max(R0,Math.min(5,Math.min(W.vw,W.vh)/W.ts*.25)):R0;}catch(e){return R0;}};

let PID=null,SEEN=null,WREF=null,DIRTY=0,SAVED_AT=0,MASK=null,MDIRTY=1,REACH=null,RW=null,CHK=0,NEWN=0;
const ok=()=>typeof W!=='undefined'&&!!W&&!!W.T;
function has(p){return !!(p&&p.nh===1&&!p.xfogOff);}
function enc(b){let s='';for(let i=0;i<b.length;i+=8){let v=0;for(let j=0;j<8;j++)if(b[i+j])v|=1<<j;s+=String.fromCharCode(v);}return btoa(s);}
function decInto(b,str){if(!str||typeof str!=='string')return 0;let s='';try{s=atob(str);}catch(e){return 0;}let n=0;
 for(let i=0;i<s.length;i++){const v=s.charCodeAt(i);if(!v)continue;for(let j=0;j<8;j++)if(v&(1<<j)){const k=i*8+j;if(k<b.length&&!b[k]){b[k]=1;n++;}}}return n;}
function plaza(b){if(!ok())return;for(let y=0;y<WROWS;y++)for(let x=0;x<WCOLS;x++)if(W.T[y][x].plaza)b[y*WCOLS+x]=1;}
/* the current hero's explored squares, or null when they have no explore-fog */
function cur(){let p=null;try{p=state.cur?P():null;}catch(e){}
 if(!has(p)||!ok()){PID=null;SEEN=null;DIRTY=0;return null;}
 if(PID!==p.id||!SEEN||WREF!==W){PID=p.id;WREF=W;SEEN=new Uint8Array(WCOLS*WROWS);decInto(SEEN,p.xfog);plaza(SEEN);MDIRTY=1;DIRTY=0;NEWN=1;}
 return SEEN;}
function reveal(b){R=radius();const hx=W.hx,hy=W.hy,r=Math.ceil(R);let n=0;
 for(let y=hy-r;y<=hy+r;y++)for(let x=hx-r;x<=hx+r;x++){if(x<0||y<0||x>=WCOLS||y>=WROWS||Math.hypot(x-hx,y-hy)>R)continue;const i=y*WCOLS+x;if(!b[i]){b[i]=1;n++;}}
 if(n){DIRTY=1;MDIRTY=1;NEWN=1;}}
function persist(force){if(!DIRTY||!SEEN||!PID)return;const now=Date.now();if(!force&&now-SAVED_AT<SAVE_MS)return;
 try{const p=P();if(!p||p.id!==PID||!has(p))return;if(decInto(SEEN,p.xfog))MDIRTY=1; /* explored on another device too */p.xfog=enc(SEEN);DIRTY=0;SAVED_AT=now;save();}catch(e){}}
/* every square you can walk to from the town square (walls and water count), worked out once per map */
function reach(){if(RW===W&&REACH)return REACH;RW=W;const T=W.T,seen=new Uint8Array(WCOLS*WROWS),out=[];let s=null;
 try{const c=BIOMES.village.c;s=[c[0],c[1]+2];}catch(e){}if(!s||!T[s[1]]||T[s[1]][s[0]].block){for(let y=0;y<WROWS&&!s;y++)for(let x=0;x<WCOLS;x++)if(T[y][x].plaza&&!T[y][x].block){s=[x,y];break;}}
 if(!s){REACH=[];return REACH;}const q=[s];seen[s[1]*WCOLS+s[0]]=1;
 const wall=(a,b,c,d)=>{try{return typeof wWall==='function'&&wWall(a,b,c,d);}catch(e){return false;}};
 while(q.length){const [x,y]=q.shift();out.push(y*WCOLS+x);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=WCOLS||ny>=WROWS)continue;const i=ny*WCOLS+nx;if(seen[i])continue;const t=T[ny][nx];if(!t||t.block||wall(x,y,nx,ny))continue;seen[i]=1;q.push([nx,ny]);}}
 REACH=out;return REACH;}
function share(b){const L=reach();if(!L.length)return 1;let n=0;for(const i of L)if(b[i])n++;return n/L.length;}
function finish(silent){try{const p=P();if(!p||!has(p))return;p.xfogOff=1;delete p.xfog;save();}catch(e){}PID=null;SEEN=null;DIRTY=0;
 if(!silent){try{toast('🗺️ You explored the whole map! It stays uncovered now.');}catch(e){}}}
/* the mask: one pixel per square, a deep blue-grey with a little cloudy variation; explored squares are clear */
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
function paint(b){if(!MASK){MASK=document.createElement('canvas');MASK.width=WCOLS;MASK.height=WROWS;}const c=MASK.getContext('2d'),im=c.createImageData(WCOLS,WROWS),d=im.data;
 for(let i=0;i<b.length;i++){const x=i%WCOLS,y=(i-x)/WCOLS,h=hash(x,y),o=i*4;d[o]=36+h*16|0;d[o+1]=44+h*16|0;d[o+2]=72+h*20|0;d[o+3]=b[i]?0:255;}
 c.putImageData(im,0,0);MDIRTY=0;}
function frame(ctx,items,cx,cy,ts,now){if(!ok())return;const b=cur();if(!b)return;reveal(b);persist(false);
 if(NEWN&&now>CHK){CHK=now+1500;NEWN=0;if(share(b)>=DONE){finish(false);return;}}
 if(MDIRTY)paint(b);
 items.push({y:2e6,draw:()=>{ctx.save();ctx.imageSmoothingEnabled=true;try{ctx.imageSmoothingQuality='high';}catch(e){}ctx.drawImage(MASK,-cx,-cy,WCOLS*ts,WROWS*ts);ctx.restore();}});} /* on top of everything: bubbles of people hidden in the fog are covered too */
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
window.MQ_HID=(x,y)=>{const b=cur();return !!b&&x>=0&&y>=0&&x<WCOLS&&y<WROWS&&!b[y*WCOLS+x];};
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{if(s!=='world')persist(true);}});
addEventListener('pagehide',()=>persist(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)persist(true);});
/* Parent Corner (hero details): how much is explored, and a button to uncover the whole map */
function parentRow(p){if(!has(p))return '';let pc='';try{if(ok()){const b=new Uint8Array(WCOLS*WROWS);decInto(b,p.xfog);plaza(b);if(PID===p.id&&SEEN)SEEN.forEach((v,i)=>{if(v)b[i]=1;});pc=` (${Math.floor(share(b)*100)}% explored)`;}}catch(e){}
 return `<div class="row" style="justify-content:flex-start;margin:6px 0;align-items:center">🗺️ <b>Map:</b> <span class="muted">${esc(p.name)} is still uncovering it${pc}</span><button class="btn small" onclick="MQ_XFOG.askReveal('${p.id}')">Reveal the whole map</button></div>`;}
function askReveal(id){const p=state.players.find(x=>x.id===id);if(!p)return;modal(`<div class="mcard"><div class="big-emoji">🗺️</div><h2>Reveal the whole map for ${esc(p.name)}?</h2><p>The parts of the map ${esc(p.name)} hasn't walked to yet are hidden until they explore them. This uncovers everything for good.</p><div class="row"><button class="btn ghost dark" onclick="closeModal()">Cancel</button><button class="btn green" onclick="MQ_XFOG.revealFor('${p.id}')">Reveal it</button></div></div>`);}
function revealFor(id){const p=state.players.find(x=>x.id===id);if(!p)return;p.xfogOff=1;delete p.xfog;save();if(PID===id){PID=null;SEEN=null;DIRTY=0;}try{closeModal();}catch(e){}
 try{if(typeof curScreen!=='undefined'&&curScreen==='parent')refreshParent(`pp-${id}`,true);}catch(e){}try{toast(`🗺️ The whole map is uncovered for ${p.name}.`);}catch(e){}}
window.MQ_XFOG={has,on:()=>!!cur(),hid:(x,y)=>window.MQ_HID(x,y),seen:()=>{const b=cur();let n=0;if(b)for(const v of b)n+=v;return n;},share:()=>{const b=cur();return b?share(b):1;},reach:()=>ok()?reach().length:0,
 parentRow,askReveal,revealFor,DONE,R:R0,radius,_save:()=>{if(cur()){DIRTY=1;persist(true);}},_open:list=>{const b=cur();if(!b)return;list.forEach(i=>{b[i]=1;});DIRTY=1;MDIRTY=1;NEWN=1;CHK=0;},_reachList:()=>ok()?reach().slice():[],_enc:enc};
})();
