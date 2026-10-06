/* ================= the Elder Wiz wanders the map (Oct 2026) =================
   The owner moved the Elder Wiz out of Number Town: he now strolls round the board (full body, not just a head), now and then walks into a
   place (an open world's entrance, the Number Town door or the train station), stays inside a little while and comes back out. Every so
   often he thinks out loud in a bubble: quest lines (and "your quest is done!" when one is) plus everyday ones. Bumping into him opens his
   usual quest dialog (wNpc('elder') in index.html); a gold ❗ over his head means his quest reward is ready.
   His tile carries t.npc='elder' while he stands on it; he never blocks walking, never stands on a gate, the town, a present or the hero.
   Drawing through MQ_MAPDRAW; nothing is saved. */
(function(){
const STEP=480,O='#3b2a1e';
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
const QUEST=['Do you want a quest?','How is the quest going?','Need a quest? Come and talk to me!','Have you checked the Quest Board?','A new quest is waiting…','Quests make you stronger!'];
const DONE=['Your quest is done! Come and see me!','I have a reward for you!'];
const OTHER=['I think I lost my pencil…','Where did I put my glasses?','What a lovely day for math!','Hmm… 7 × 8… 56!','My beard is itchy.','Has anyone seen my hat? Oh. It\'s on my head.','Numbers are a kind of magic!','Is it snack time yet?','I once counted to a million… almost.','Watch out for the Grey Goblin!','Walking is good for the brain!','I was a Bronze wizard once, too.'];
const SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96"><defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#845ef7"/><stop offset="1" stop-color="#5f3dc4"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5c7cfa"/><stop offset="1" stop-color="#364fc7"/></linearGradient><radialGradient id="o"><stop offset="0" stop-color="#e7f5ff"/><stop offset=".6" stop-color="#74c0fc"/><stop offset="1" stop-color="#339af0"/></radialGradient></defs>
<ellipse cx="31" cy="92" rx="18" ry="3.5" fill="rgba(0,0,0,.22)"/>
<path d="M53 30 L53 91" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M53 30 L53 91" stroke="#a0703c" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="53" cy="26" r="6" fill="url(#o)" stroke="${O}" stroke-width="2"/><circle cx="51.5" cy="24.5" r="1.6" fill="#fff"/>
<ellipse cx="24" cy="90" rx="6" ry="3" fill="#7a4a24" stroke="${O}" stroke-width="1.8"/><ellipse cx="38" cy="90" rx="6" ry="3" fill="#7a4a24" stroke="${O}" stroke-width="1.8"/>
<path d="M21 40 Q31 36 41 40 L48 88 Q31 92 14 88 Z" fill="url(#r)" stroke="${O}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M19 62 l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z M40 74 l1.2 2.4 2.6.3-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.3z" fill="#ffd43b"/>
<path d="M41 44 Q50 50 51 56" stroke="${O}" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="M41 44 Q50 50 51 56" stroke="#7048e8" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M21 44 Q14 54 18 62" stroke="${O}" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="M21 44 Q14 54 18 62" stroke="#7048e8" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="52" cy="57" r="3.6" fill="#ffd8b8" stroke="${O}" stroke-width="1.8"/><circle cx="18" cy="63" r="3.4" fill="#ffd8b8" stroke="${O}" stroke-width="1.8"/>
<circle cx="31" cy="31" r="9.5" fill="#ffd8b8" stroke="${O}" stroke-width="2"/>
<path d="M21.5 32 Q22 48 31 62 Q40 48 40.5 32 Q36 38 31 38 Q26 38 21.5 32 Z" fill="#fff" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>
<path d="M25 37 Q31 34 37 37" stroke="#dee2e6" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<circle cx="27.5" cy="30" r="1.4" fill="${O}"/><circle cx="34.5" cy="30" r="1.4" fill="${O}"/><circle cx="25" cy="33" r="1.6" fill="#ffa8a8" opacity=".7"/><circle cx="37" cy="33" r="1.6" fill="#ffa8a8" opacity=".7"/>
<path d="M24.5 26.5 h5 M32.5 26.5 h5" stroke="#f1f3f5" stroke-width="2.2" stroke-linecap="round"/>
<ellipse cx="31" cy="23" rx="16" ry="4" fill="url(#h)" stroke="${O}" stroke-width="2.2"/>
<path d="M19.5 22.5 L33 1.5 Q36 0 38 3 Q36 3 35.5 5 L42.5 22.5 Z" fill="url(#h)" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M29 13 l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#ffd43b"/><path d="M23 20 Q31 17 39 20" stroke="#ffd43b" stroke-width="2" fill="none"/></svg>`;
const IMG=new Image();IMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(SVG);
let E=null,EW=null,REACH=null;
const free=(t,W,x,y)=>!!t&&!t.block&&!t.water&&!t.gate&&!t.chest&&!t.rail&&!(t.npc&&t.npc!=='elder')&&!(x===W.hx&&y===W.hy);
const blocked=(W,a,b,c,d)=>!!(window.MQ_GROUND&&MQ_GROUND.blocked&&MQ_GROUND.blocked(W,a,b,c,d));
function reach(W){if(EW===W&&REACH)return REACH;const T=W.T;let st=null;for(let y=0;y<T.length&&!st;y++)for(let x=0;x<T[0].length;x++){const t=T[y][x];if(t.plaza&&!t.block){st=[x,y];break;}}
 const seen=new Set();if(st){seen.add(st+'');const q=[st];while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,t=T[ny]&&T[ny][nx],k=nx+','+ny;if(!t||t.block||t.water||seen.has(k)||blocked(W,x,y,nx,ny))continue;seen.add(k);q.push([nx,ny]);}}}
 REACH=[...seen].map(k=>k.split(',').map(Number));return REACH;}
function pathTo(W,sx,sy,tx,ty){const key=(x,y)=>x+','+y,prev={},q=[[sx,sy]];prev[key(sx,sy)]=null;
 while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty)break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(k in prev)continue;const t=W.T[ny]&&W.T[ny][nx];
   if(!t||t.block||t.water||t.gate||t.rail||blocked(W,x,y,nx,ny))continue;prev[k]=[x,y];q.push([nx,ny]);}if(q.length>4000)break;}
 if(!(key(tx,ty) in prev))return null;const p=[];let c=[tx,ty];while(c&&!(c[0]===sx&&c[1]===sy)){p.unshift(c);c=prev[key(c[0],c[1])];}return p;}
/* the places he can step into: open worlds' entrances, the Number Town door, the train station board */
function places(W){const out=[],p=(()=>{try{return P();}catch(e){return null;}})();
 for(const [zid,c] of Object.entries(W.gates||{})){try{const z=ZONES.find(x=>x.id===zid);if(z&&p&&zoneLocked(z,p))continue;}catch(e){}const s=[[c[0],c[1]+1],[c[0]-1,c[1]],[c[0]+1,c[1]]].find(([x,y])=>{const t=W.T[y]&&W.T[y][x];return t&&!t.block&&!t.water;});if(s)out.push({x:s[0],y:s[1],door:[c[0],c[1]]});}
 try{out.push({x:TOWN_X+2,y:TOWN_Y+3,door:[TOWN_X+2,TOWN_Y+2]});}catch(e){}
 for(let y=0;y<W.T.length;y++)for(let x=0;x<W.T[0].length;x++)if(W.T[y][x].npc==='station'){const t=W.T[y-1]&&W.T[y-1][x];if(t&&!t.block)out.push({x,y:y-1,door:[x,y]});}
 return out;}
function setTile(W,on){if(!E)return;const t=W.T[E.y]&&W.T[E.y][E.x];if(!t)return;if(on){if(!t.npc)t.npc='elder';}else if(t.npc==='elder')delete t.npc;}
function plan(W,now){const R=reach(W);if(!R.length)return;let tgt=null,go=null;
 if(Math.random()<.25){const L=places(W);if(L.length){const s=L[Math.floor(Math.random()*L.length)];tgt=[s.x,s.y];go=s;}}
 if(!tgt){for(let i=0;i<30&&!tgt;i++){const c=R[Math.floor(Math.random()*R.length)];if(Math.abs(c[0]-E.x)+Math.abs(c[1]-E.y)<14&&free(W.T[c[1]][c[0]],W,c[0],c[1]))tgt=c;}}
 if(!tgt){E.wait=now+3000;return;}const p=pathTo(W,E.x,E.y,tgt[0],tgt[1]);if(!p){E.wait=now+2000;return;}E.path=p;E.goIn=go;}
function start(W,now){const R=reach(W);let s=null;try{s=[TOWN_X+2,TOWN_Y+4];}catch(e){}if(!s||!free(W.T[s[1]]&&W.T[s[1]][s[0]],W,s[0],s[1]))s=R[Math.floor(Math.random()*R.length)];if(!s)return;
 E={x:s[0],y:s[1],fx:s[0],fy:s[1],mt:0,path:[],dir:1,wait:now+4000,hidden:false,a:0,say:null,nextSay:now+(40+Math.random()*80)*1000};setTile(W,true);}
function sayLine(){let done=false;try{const p=P(),i=npcQuestIdx(p,'elder');done=i>=0&&qState(p).active[i].done;}catch(e){}
 const L=done&&Math.random()<.6?DONE:Math.random()<.4?QUEST:OTHER;return L[Math.floor(Math.random()*L.length)];}
function tick(W,now){if(EW!==W){EW=W;REACH=null;E=null;}if(!E){start(W,now);if(!E)return;}
 if(E.hidden){if(now>=E.backAt){E.hidden=false;E.a=0;E.wait=now+2500;setTile(W,true);}return;}
 E.a=Math.min(1,E.a+.05);
 if(E.mt&&now-E.mt<STEP)return;E.mt=0;
 if(now>=E.nextSay&&!E.say){E.say={t:sayLine(),at:now};E.nextSay=now+(45+Math.random()*105)*1000;}
 if(E.say&&now-E.say.at>5500)E.say=null;
 if(now<E.wait)return;
 if(!E.path.length){if(E.goIn){const g=E.goIn;E.goIn=null;E.dir=g.door[0]>=E.x?1:-1;E.hidden=true;E.backAt=now+(20+Math.random()*40)*1000;E.outT=now;setTile(W,false);return;}
  E.wait=now+1500+Math.random()*4000;plan(W,now);return;}
 const [nx,ny]=E.path[0],t=W.T[ny]&&W.T[ny][nx];if(!free(t,W,nx,ny)||blocked(W,E.x,E.y,nx,ny)){if(nx===W.hx&&ny===W.hy){E.wait=now+800;return;}E.path=[];return;}
 E.path.shift();setTile(W,false);E.fx=E.x;E.fy=E.y;if(nx!==E.x)E.dir=nx>E.x?1:-1;E.x=nx;E.y=ny;E.mt=now;setTile(W,true);}
function bubble(ctx,ax,ay,ts,text,age){const fs=Math.max(12,ts*.22);ctx.save();ctx.font=`700 ${fs}px Fredoka, sans-serif`;const pop=Math.min(1,age/250),fade=age>4800?Math.max(0,1-(age-4800)/700):1,tw=ctx.measureText(text).width,w=(tw+fs*1.4)*pop,h=fs*2*pop,bx=ax+ts*.25+w/2,by=ay-ts*.45;
 ctx.globalAlpha=fade;ctx.fillStyle='#fff';ctx.strokeStyle=O;ctx.lineWidth=Math.max(1.5,ts*.03);[[ax,ay,ts*.05],[ax+ts*.12,ay-ts*.17,ts*.08]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r*pop,0,7);ctx.fill();ctx.stroke();});
 const x0=bx-w/2,y0=by-h/2,r=h/2;ctx.beginPath();ctx.moveTo(x0+r,y0);ctx.lineTo(x0+w-r,y0);ctx.arc(x0+w-r,y0+r,r,-Math.PI/2,Math.PI/2);ctx.lineTo(x0+r,y0+h);ctx.arc(x0+r,y0+r,r,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();ctx.stroke();
 if(pop>=1){ctx.fillStyle='#2b2250';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,bx,by+fs*.05);}ctx.restore();}
function frame(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T)return;tick(W,now);if(!E||!IMG.complete||!IMG.naturalWidth)return;
 const out=E.hidden?Math.max(0,1-(now-E.outT)/500):E.a;if(out<=0)return;const k=E.mt?Math.min(1,(now-E.mt)/STEP):1,dx=E.fx+(E.x-E.fx)*k,dy=E.fy+(E.y-E.fy)*k,sx=dx*ts-cx,sy=dy*ts-cy;
 if(sx<-ts*2||sy<-ts*3||sx>W.vw+ts||sy>W.vh+ts)return;
 let done=false;try{const p=P(),i=npcQuestIdx(p,'elder');done=i>=0&&qState(p).active[i].done;}catch(e){}
 items.push({y:dy+.02,draw:()=>{const h=ts*1.4,w=h*64/96,bob=E.mt&&k<1?Math.abs(Math.sin(now/90))*2.5:Math.sin(now/600)*1.2;ctx.save();ctx.globalAlpha=out;ctx.translate(sx+ts/2,0);ctx.scale(E.dir<0?-1:1,1);ctx.drawImage(IMG,-w/2,sy+ts*.97-h-bob,w,h);ctx.restore();
  if(done&&!E.hidden){const r=ts*.16,bx=sx+ts/2,by=sy+ts*.97-h-r*1.3+Math.sin(now/300)*2;ctx.save();ctx.fillStyle='#ffd43b';ctx.strokeStyle=O;ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx,by,r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=O;ctx.font=`900 ${Math.round(r*1.5)}px Fredoka, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',bx,by+1);ctx.restore();}}});
 if(E.say&&!E.hidden)items.push({y:1e6-2,draw:()=>bubble(ctx,sx+ts*.75,sy-ts*.25,ts,E.say.t,now-E.say.at)});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
window.MQ_ELDER={state:()=>E,svg:SVG,say:t=>{if(E){E.say={t:t||sayLine(),at:performance.now()};}},LINES:{QUEST,DONE,OTHER},places:w=>places(w||W)};
})();
