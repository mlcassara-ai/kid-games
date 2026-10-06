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
/* when the hero comes close he stops, turns to them and says one of these (owner, Oct 2026): funny old-man lines, never mean */
const GREET=['Can I help you?','Ready to serve!','Yikes! Don\'t sneak up on me like that!','I thought I smelled cabbage…','Get off my lawn! …Oh, sorry, I thought you were someone else.','Eh? Speak up, young wizard!','Ah, it\'s you! I was just thinking about you. Or lunch.','Hello there! Have we met? …Of course we have.','Shh! I\'m counting clouds. …Now I\'ve lost count.','My knees say rain is coming. My knees are usually wrong.','Back in my day, we counted on our toes!','Oh! You gave my beard a fright.','Ah, a visitor! Quick, look busy… I mean, hello!','Have you seen my spectacles? …They\'re on my head, aren\'t they?','Greetings! I\'ve been walking for hours. Or minutes. Who knows?','Is it Tuesday? It feels like a Tuesday.','Mind the puddles, they\'re sneaky today.','Well, well! If it isn\'t my favourite math wizard!','Pardon me, I was having a little nap… standing up.','Hmm? Oh! Hello! I was just talking to this rock.'];
/* ...and when the hero walks away again he waves his wand, says one of these and vanishes in sparkles, popping up elsewhere later */
const BYE=['Math-ra-cadabra!','Abra-ca-divide!','Hocus pocus, multiply-ocus!','Sim-sala-subtract!','Abraca-fraction!','Alaka-zam… plus one!','By the power of Pi… away I go!','Now you see me, now you… carry the one!','Shazam times ten!','Divide and vanish!','Presto, place value!','Bibbidi-bobbidi-plus!','Poof! Like a remainder of zero!','Hocus pocus, keep your focus!'];
/* ...and once you've talked to him (his quest card) he's off: he either vanishes within 2 s or strolls far away; nobody can stop him
   or talk to him again until he gets there (owner, Oct 2026) */
const LEAVE=['Well, I must be off!','Places to go, numbers to count!','Toodle-oo, young wizard!','Time for my afternoon stroll!','Off I go! My tea is getting cold.','Busy, busy, busy! Goodbye!'];
const NEAR=2.2,AWAY=4,WAVE=1800,FAR=12;
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
function setTile(W,on){if(!E)return;if(on&&E.leaving)return;const t=W.T[E.y]&&W.T[E.y][E.x];if(!t)return;if(on){if(!t.npc)t.npc='elder';}else if(t.npc==='elder')delete t.npc;}
function plan(W,now){const R=reach(W);if(!R.length)return;let tgt=null,go=null;
 if(Math.random()<.25){const L=places(W);if(L.length){const s=L[Math.floor(Math.random()*L.length)];tgt=[s.x,s.y];go=s;}}
 if(!tgt){for(let i=0;i<30&&!tgt;i++){const c=R[Math.floor(Math.random()*R.length)];if(Math.abs(c[0]-E.x)+Math.abs(c[1]-E.y)<14&&free(W.T[c[1]][c[0]],W,c[0],c[1]))tgt=c;}}
 if(!tgt){E.wait=now+3000;return;}const p=pathTo(W,E.x,E.y,tgt[0],tgt[1]);if(!p){E.wait=now+2000;return;}E.path=p;E.goIn=go;}
function start(W,now){const R=reach(W);let s=null;try{s=[TOWN_X+2,TOWN_Y+4];}catch(e){}if(!s||!free(W.T[s[1]]&&W.T[s[1]][s[0]],W,s[0],s[1]))s=R[Math.floor(Math.random()*R.length)];if(!s)return;
 E={x:s[0],y:s[1],fx:s[0],fy:s[1],mt:0,path:[],dir:1,wait:now+4000,hidden:false,a:0,say:null,nextSay:now+(40+Math.random()*80)*1000};setTile(W,true);}
function sayLine(){let done=false;try{const p=P(),i=npcQuestIdx(p,'elder');done=i>=0&&qState(p).active[i].done;}catch(e){}
 const L=done&&Math.random()<.6?DONE:Math.random()<.4?QUEST:OTHER;return L[Math.floor(Math.random()*L.length)];}
/* the hero is close: stop, face them, greet once per visit (he greets again only after they've wandered off and come back a bit later) */
function greet(W,now){const d=Math.hypot(W.hx-E.x,W.hy-E.y);
 if(d>AWAY){if(E.greeted){E.greeted=false;poof(now);}return false;}if(d>NEAR)return false;
 if(!E.mt)E.dir=W.hx>=E.x?1:-1;
 if(!E.greeted&&now>=(E.greetAt||0)){E.greeted=true;E.greetAt=now+20000;E.recent=E.recent||[];let t,k=0;do{t=GREET[Math.floor(Math.random()*GREET.length)];}while(E.recent.includes(t)&&k++<20);
  E.recent.push(t);if(E.recent.length>8)E.recent.shift();E.say={t,at:now};E.nextSay=Math.max(E.nextSay,now+30000);}
 return true;}
function talked(m){if(!E||E.hidden||E.poof)return;E.talked=m||(Math.random()<.5?'poof':'walk');E.greeted=true;E.path=[];E.goIn=null;if(EW)setTile(EW,false);}
/* walk far away: a reachable spot at least FAR squares from the hero */
function leaveWalk(W,now){const R=reach(W);for(let i=0;i<40;i++){const c=R[Math.floor(Math.random()*R.length)];if(!c||Math.hypot(c[0]-W.hx,c[1]-W.hy)<FAR||!free(W.T[c[1]][c[0]],W,c[0],c[1]))continue;const p=pathTo(W,E.x,E.y,c[0],c[1]);if(!p||p.length<FAR)continue;
  E.path=p;E.leaving=true;E.wait=0;E.say={t:LEAVE[Math.floor(Math.random()*LEAVE.length)],at:now};E.nextSay=Math.max(E.nextSay,now+40000);return true;}return false;}
function poof(now){if(E.poof||E.hidden)return;E.path=[];E.goIn=null;E.poof={at:now,vanish:now+WAVE};E.say={t:BYE[Math.floor(Math.random()*BYE.length)],at:now};E.nextSay=Math.max(E.nextSay,now+40000);}
/* after vanishing he comes back somewhere well away from the hero */
function relocate(W){const R=reach(W);for(let i=0;i<60;i++){const c=R[Math.floor(Math.random()*R.length)];if(c&&Math.hypot(c[0]-W.hx,c[1]-W.hy)>8&&free(W.T[c[1]][c[0]],W,c[0],c[1])){E.x=E.fx=c[0];E.y=E.fy=c[1];return;}}}
function tick(W,now){if(EW!==W){EW=W;REACH=null;E=null;}if(!E){start(W,now);if(!E)return;}
 if(E.hidden){if(E.poof&&now>E.poof.at+6000)E.poof=null;if(now>=E.backAt){if(E.moved){E.moved=false;relocate(W);}E.poof=null;E.hidden=false;E.a=0;E.wait=now+2500;setTile(W,true);}return;}
 E.a=Math.min(1,E.a+.05);
 if(E.poof){if(now>=E.poof.vanish){E.hidden=true;E.moved=true;E.outT=now;E.backAt=now+(15+Math.random()*30)*1000;setTile(W,false);}return;}
 if(E.mt&&now-E.mt<STEP)return;E.mt=0;
 if(now>=E.nextSay&&!E.say){E.say={t:sayLine(),at:now};E.nextSay=now+(45+Math.random()*105)*1000;}
 if(E.say&&now-E.say.at>5500)E.say=null;
 if(E.talked){if(document.querySelector('#modal.show'))return;const m=E.talked;E.talked=null;if(m==='walk'&&leaveWalk(W,now))return;poof(now);if(E.poof)E.poof.vanish=now+1300;return;} /* his card just closed: off he goes */
 if(E.leaving&&!E.path.length){E.leaving=false;setTile(W,true);} /* got there: he can be met again */
 if(!E.hidden&&!E.leaving&&greet(W,now)){E.wait=Math.max(E.wait,now+400);return;} /* he waits while the hero is close */
 if(now<E.wait)return;
 if(!E.path.length){if(E.goIn){const g=E.goIn;E.goIn=null;E.dir=g.door[0]>=E.x?1:-1;E.hidden=true;E.backAt=now+(20+Math.random()*40)*1000;E.outT=now;setTile(W,false);return;}
  E.wait=now+1500+Math.random()*4000;plan(W,now);return;}
 const [nx,ny]=E.path[0],t=W.T[ny]&&W.T[ny][nx];if(!free(t,W,nx,ny)||blocked(W,E.x,E.y,nx,ny)){if(nx===W.hx&&ny===W.hy){E.wait=now+800;return;}E.path=[];return;}
 E.path.shift();setTile(W,false);E.fx=E.x;E.fy=E.y;if(nx!==E.x)E.dir=nx>E.x?1:-1;E.x=nx;E.y=ny;E.mt=now;setTile(W,true);}
function bubble(ctx,ax,ay,ts,text,age){const fs=Math.max(12,ts*.22);ctx.save();ctx.font=`700 ${fs}px Fredoka, sans-serif`;const pop=Math.max(0,Math.min(1,age/250)),fade=age>4800?Math.max(0,1-(age-4800)/700):1,tw=ctx.measureText(text).width,w=(tw+fs*1.4)*pop,h=fs*2*pop,bx=ax+ts*.25+w/2,by=ay-ts*.45;
 ctx.globalAlpha=fade;ctx.fillStyle='#fff';ctx.strokeStyle=O;ctx.lineWidth=Math.max(1.5,ts*.03);[[ax,ay,ts*.05],[ax+ts*.12,ay-ts*.17,ts*.08]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r*pop,0,7);ctx.fill();ctx.stroke();});
 const x0=bx-w/2,y0=by-h/2,r=h/2;ctx.beginPath();ctx.moveTo(x0+r,y0);ctx.lineTo(x0+w-r,y0);ctx.arc(x0+w-r,y0+r,r,-Math.PI/2,Math.PI/2);ctx.lineTo(x0+r,y0+h);ctx.arc(x0+r,y0+r,r,Math.PI/2,Math.PI*1.5);ctx.closePath();ctx.fill();ctx.stroke();
 if(pop>=1){ctx.fillStyle='#2b2250';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,bx,by+fs*.05);}ctx.restore();}
/* the wand wave (little stars round his raised hand) and the vanishing burst */
function star(ctx,x,y,r,c){ctx.fillStyle=c;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,q=i%2?r*.38:r;ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}ctx.closePath();ctx.fill();}
const SPK=['#ffd43b','#fff3b0','#ff8fd8','#8fe6ff','#ffffff','#b197fc'];
function sparkles(ctx,x,y,ts,h,now,pf){ctx.save();
 if(now<pf.vanish){const hx=x+E.dir*h*.32,hy=y-h*.28;for(let i=0;i<6;i++){const a=now/220+i*1.05,r=ts*(.22+.08*Math.sin(now/150+i));ctx.globalAlpha=.6+.4*Math.sin(now/80+i);star(ctx,hx+Math.cos(a)*r,hy+Math.sin(a)*r,ts*.1,SPK[i%SPK.length]);}}
 const t=(now-pf.vanish+150)/1200;if(t>0&&t<1){for(let i=0;i<36;i++){const a=hash(i,7)*6.283,sp=.5+hash(i,3),d=ts*2*sp*(1-Math.pow(1-t,2)),r=ts*(.11+.11*hash(i,5))*(1-t*.5);
   ctx.globalAlpha=Math.max(0,1-t)*(.7+.3*Math.sin(now/60+i));star(ctx,x+Math.cos(a)*d,y+Math.sin(a)*d*.8-ts*.3*t,r,SPK[i%SPK.length]);}
  ctx.globalAlpha=Math.max(0,.6-t);const g=ctx.createRadialGradient(x,y,0,x,y,ts*.9);g.addColorStop(0,'rgba(255,250,210,.9)');g.addColorStop(1,'rgba(255,250,210,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,ts*.9,0,7);ctx.fill();}
 ctx.restore();}
function frame(ctx,items,cx,cy,ts,now){if(typeof W==='undefined'||!W||!W.T)return;tick(W,now);if(!E||!IMG.complete||!IMG.naturalWidth)return;
 const pf=E.poof,out=E.hidden?Math.max(0,1-(now-E.outT)/(pf?300:500)):E.a;if(out<=0&&!pf)return;const k=E.mt?Math.min(1,(now-E.mt)/STEP):1,dx=E.fx+(E.x-E.fx)*k,dy=E.fy+(E.y-E.fy)*k,sx=dx*ts-cx,sy=dy*ts-cy;
 if(sx<-ts*2||sy<-ts*3||sx>W.vw+ts||sy>W.vh+ts)return;
 let done=false;try{const p=P(),i=npcQuestIdx(p,'elder');done=i>=0&&qState(p).active[i].done;}catch(e){}
 items.push({y:dy+.02,draw:()=>{const h=ts*1.4,w=h*64/96,bob=E.mt&&k<1?Math.abs(Math.sin(now/90))*2.5:Math.sin(now/600)*1.2;if(out>0){const fy=sy+ts*.97,sc=pf&&E.hidden?out:1,rot=pf&&!E.hidden?Math.sin(now/90)*.09:0;ctx.save();ctx.globalAlpha=out;ctx.translate(sx+ts/2,fy);ctx.rotate(rot);ctx.scale((E.dir<0?-1:1)*sc,sc);ctx.drawImage(IMG,-w/2,-h-bob,w,h);ctx.restore();}
  if(pf)sparkles(ctx,sx+ts/2,sy+ts*.97-h*.55,ts,h,now,pf);
  if(done&&!E.hidden){const r=ts*.16,bx=sx+ts/2,by=sy+ts*.97-h-r*1.3+Math.sin(now/300)*2;ctx.save();ctx.fillStyle='#ffd43b';ctx.strokeStyle=O;ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx,by,r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=O;ctx.font=`900 ${Math.round(r*1.5)}px Fredoka, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',bx,by+1);ctx.restore();}}});
 if(E.say&&(!E.hidden||pf))items.push({y:1e6-2,draw:()=>bubble(ctx,sx+ts*.75,sy-ts*.25,ts,E.say.t,now-E.say.at)});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
window.MQ_ELDER={GREET,BYE,LEAVE,talked,tick:t=>tick(W,t),greet:(w,t)=>E&&greet(w||W,t||performance.now()),state:()=>E,svg:SVG,say:t=>{if(E){E.say={t:t||sayLine(),at:performance.now()};}},LINES:{QUEST,DONE,OTHER},places:w=>places(w||W)};
})();
