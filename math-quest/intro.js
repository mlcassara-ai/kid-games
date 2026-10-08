/* ================= ✨ the Kind Teacher's welcome (Oct 2026) =================
   The first time a NEW hero reaches the map (made from Oct 2026 on: newPlayer sets p.nh=1; no battles yet; older heroes never get it), the
   hero stands in the town square and can't move (window.__heroLock: wStep and wTap do nothing). The Town Train comes in right away
   (Train.introCome: nobody else on it, it waits while she talks), the Kind Teacher steps off, walks up to the hero and talks in a
   click-through card (her drawing, one line at a time, Next ➜ on each, no skip). After her last line the hero can move, p.intro=1 is
   saved, and she walks back onto the train, which leaves (Train.introGo). If the train can't come (no track, or it hasn't stopped
   within 12 s) she walks out of the Town door instead and goes back in there. Closing the game or leaving the map before the end
   means it plays again next time (the flag is only saved at the end). While it plays it holds the visitor slot (MQ_VISIT 'intro'),
   keeps visitorQuiet, keeps the Elder Wiz away (elder.js asks MQ_INTRO.busy()) and holds back the welcome card (welcomeIfNew), which
   comes right after her last line. Grades 1–2 hear lines 1 and 5 read aloud (kindSay); the rest is never read automatically.
   MQ_INTRO for tests. */
(function(){
const LINES=[
 n=>`Hello, ${n}! Welcome to Math Quest. I'm the Kind Teacher, and I came on the train to meet you.`,
 ()=>'Explore! The map is hidden. Walk around to discover the math worlds, a treasure chest in each area every day, and visitors and secrets.',
 ()=>"Battle to grow stronger. Walk into a world's entrance and answer math to beat its monsters. Wins earn coins, a boss win earns a medal, and medals unlock Battle Pets battles.",
 ()=>'Hatch an egg to get a pet. Pets give hints when a problem is tricky, grow as you play, and join you in Battle Pets. Spend your coins in Number Town.',
 ()=>'The whole world is waiting. Go explore!'];
const READ=[0,4],SPOT=[22,18],DOOR=[22,15.35],SP=1.3,TRAIN_MAX=12000,NO_TRAIN=2500,GAP=350;
let I=null,ORIG=null,IMG=null;
function due(p){return !!(p&&p.setup&&p.nh===1&&!p.intro&&!(p.battles>0));}
function first(p){return String(p&&p.name||'').trim().split(/\s+/)[0]||'friend';}
function img(){if(!IMG&&typeof kindSVG==='function'){let s=kindSVG();if(!/xmlns=/.test(s))s=s.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');IMG=new Image();IMG.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);}return IMG;}
/* the welcome card (skill check / egg) waits until she has finished */
function wrap(){if(ORIG||typeof welcomeIfNew!=='function')return;ORIG=welcomeIfNew;window.welcomeIfNew=function(p){if(due(p))return;return ORIG.apply(this,arguments);};}
document.addEventListener('DOMContentLoaded',wrap);
function css(){if(document.getElementById('mqiCSS'))return;const st=document.createElement('style');st.id='mqiCSS';st.textContent=
 '#modal.mqi-on{background:rgba(10,5,30,.25);place-items:end center;padding-bottom:max(16px,env(safe-area-inset-bottom))}'+
 '.mqi-card{max-width:560px;text-align:left;background:linear-gradient(180deg,#fffdf5,#fff3d6);box-shadow:0 0 0 4px #ffe066,0 8px 30px rgba(0,0,0,.3)}'+
 '.mqi-row{display:flex;gap:14px;align-items:center}.mqi-fig{width:min(118px,28vw);flex:none}.mqi-fig .kind-svg{width:100%;height:auto;display:block}'+
 '.mqi-txt{flex:1;min-width:0}.mqi-txt .kind-name{text-align:left;font-size:19px}.mqi-say{font-size:19px;line-height:1.4;margin:6px 0 0;color:var(--ink)}'+
 '.mqi-foot{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:10px}.mqi-dots{letter-spacing:4px;color:#b197fc;font-size:14px}';
 document.head.appendChild(st);}
function card(i){const p=P();return `<div class="mcard mqi-card"><div class="mqi-row"><div class="mqi-fig">${kindSVG()}</div><div class="mqi-txt"><div class="kind-name">✨ The Kind Teacher</div><p class="mqi-say">${esc(LINES[i](first(p)))}</p></div></div>
 <div class="mqi-foot"><span class="mqi-dots">${LINES.map((_,k)=>k<=i?'●':'○').join('')}</span><button class="btn green big" id="mqiNext" onclick="MQ_INTRO.next()">Next ➜</button></div></div>`;}
function mine(){return !!document.querySelector('#modal.show .mqi-card');}
function show(i){css();modal(card(i));const m=document.getElementById('modal');if(m)m.classList.add('mqi-on');I.shownAt=performance.now();
 if(I.read!==i&&READ.includes(i)){I.read=i;try{const p=P();if(p&&!p.adult&&(p.grade||3)<=2){try{speechSynthesis.cancel();}catch(e){}kindSay(LINES[i](first(p)));}}catch(e){}}
 try{const b=document.getElementById('mqiNext');if(b)b.focus({preventScroll:true});}catch(e){}}
function unshow(){const m=document.getElementById('modal');if(mine())closeModal();if(m)m.classList.remove('mqi-on');}
function hero(s){W.hx=s[0];W.hy=s[1];W.px=s[0];W.py=s[1];W.fx=s[0];W.fy=s[1];W.drawX=s[0];W.drawY=s[1];W.path=[];W.moving=false;W.dir=1;try{const p=P();if(p)p.wpos={x:s[0],y:s[1]};}catch(e){}}
function start(p){if(I||!due(p)||typeof W==='undefined'||!W||!W.T)return false;
 const free=(x,y)=>{const t=W.T[y]&&W.T[y][x];return !!t&&!t.block;};let s=SPOT;if(!free(s[0],s[1]))s=[W.hx,W.hy];hero(s);
 window.__heroLock=true;try{MQ_VISIT.claim('intro',15*60e3);}catch(e){}window.visitorQuiet=Math.max(window.visitorQuiet||0,Date.now()+15*60e3);
 const tg=[s[0]+1,s[1]];I={pid:p.id,ph:'come',t0:performance.now(),spot:s,tg,x:0,y:0,a:0,path:[],dir:-1,i:0,read:-1,mode:'train',shownAt:0,last:0,ct:0,st:0};
 let ok=false;try{ok=!!(window.Train&&Train.introCome&&Train.introCome());}catch(e){}if(!ok){I.mode='door';I.wait=NO_TRAIN;}
 return true;}
/* she appears: stepping off the train onto the platform, or out of the Town door */
function appear(now){const tg=I.tg;if(I.mode==='train'){const sp=Train.introSpot();I.x=sp[0];I.y=sp[1];I.path=[[tg[0],sp[1]],[tg[0],tg[1]]];}
 else{I.x=DOOR[0];I.y=DOOR[1];I.path=[[tg[0],DOOR[1]+.65],[tg[0],tg[1]]];}
 I.a=0;I.fade='in';I.ph='walk';I.dir=tg[0]>=I.x?1:-1;}
function walk(dt){if(!I.path.length)return true;const [tx,ty]=I.path[0],dx=tx-I.x,dy=ty-I.y,d=Math.hypot(dx,dy),st=SP*dt;if(d<=st){I.x=tx;I.y=ty;I.path.shift();}else{I.x+=dx/d*st;I.y+=dy/d*st;}if(Math.abs(dx)>.05)I.dir=dx>0?1:-1;I.moving=true;return !I.path.length;}
function talk(){I.ph='talk';I.moving=false;I.dir=I.spot[0]<I.x?-1:1;W.dir=I.x>W.hx?1:-1;try{kindChime();}catch(e){}I.i=0;show(0);}
function next(){if(!I||I.ph!=='talk')return;if(performance.now()-I.shownAt<GAP)return;try{SFX.tap();}catch(e){}try{speechSynthesis.cancel();}catch(e){}
 I.i++;if(I.i<LINES.length){show(I.i);return;}finish();}
/* after her last line: the hero is free, the flag is saved, she goes back the way she came, then the welcome card */
function finish(){unshow();const id=I.pid;try{const p=P();if(p&&p.id===id){p.intro=1;save();}}catch(e){}
 window.__heroLock=false;try{MQ_VISIT.release('intro');}catch(e){}window.visitorQuiet=Date.now()+90e3;
 const tg=I.tg;I.ph='leave';I.moving=true;
 if(I.mode==='train'&&window.Train&&Train.introStopped()){const sp=Train.introSpot();I.path=[[tg[0],sp[1]],[sp[0],sp[1]],[sp[0],sp[1]+.55]];}else{I.mode='door';I.path=[[tg[0],DOOR[1]+.65],[DOOR[0],DOOR[1]+.65],[DOOR[0],DOOR[1]]];}
 setTimeout(()=>{try{const q=P();if(q&&q.id===id&&!q.welcomed&&ORIG)ORIG(q);}catch(e){}},1300);}
/* left the map (or switched hero) before the end: tidy up; it plays again next time */
function abort(){if(!I)return;const leaving=I.ph==='leave';I=null;try{if(window.Train&&Train.introGo)Train.introGo();}catch(e){}if(leaving)return;
 window.__heroLock=false;try{MQ_VISIT.release('intro');}catch(e){}window.visitorQuiet=Date.now()+30e3;unshow();}
function tick(now){const dt=I.last?Math.min(.1,(now-I.last)/1000):0;I.last=now;
 if(I.fade==='in'){I.a=Math.min(1,I.a+dt*2.5);if(I.a>=1)I.fade='';}
 if(I.ph==='come'){
  I.ct+=dt*1000; /* map time, like the train's own clock (a slow device just takes longer, it doesn't give up early) */
  if(I.mode==='train'){if(Train.introStopped()&&I.ct>600){I.st+=dt*1000;if(I.st>500)appear(now);}else if(I.ct>TRAIN_MAX){try{Train.introGo();}catch(e){}I.mode='door';appear(now);}}
  else if(I.ct>=(I.wait||0))appear(now);return;}
 if(I.ph==='walk'){if(walk(dt))talk();return;}
 if(I.ph==='talk'){I.moving=false;if(!document.querySelector('#modal.show')){if(now-I.shownAt>300)show(I.i);}else if(!mine()){const m=document.getElementById('modal');if(m)m.classList.remove('mqi-on');}return;} /* something closed her card: bring it back */
 if(I.ph==='leave'){if(walk(dt)){I.moving=false;I.a-=dt*2.5;if(I.a<=0){if(I.mode==='train'){try{Train.introGo();}catch(e){}}I=null;}}}}
function frame(ctx,items,cx,cy,ts,now){if(!I||typeof W==='undefined'||!W)return;
 {let p=null;try{p=P();}catch(e){}if(!p||p.id!==I.pid){abort();return;}}
 tick(now);if(!I)return;
 if(I.ph==='come'){ /* a little bubble over the waiting hero: someone is coming */
  const hx=(W.drawX+.5)*ts-cx,hy=W.drawY*ts-cy-ts*.62,r=ts*.27,bob=Math.sin(now/260)*2;
  items.push({y:1e6-3,draw:()=>{ctx.save();ctx.fillStyle='rgba(255,255,255,.95)';ctx.strokeStyle='#3b2a1e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(hx+ts*.3,hy+bob,r,0,7);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.arc(hx+ts*.12,hy+r*.9+bob,ts*.05,0,7);ctx.fill();ctx.stroke();try{const e=wSprite(I.mode==='train'?'🚂':'✨',Math.round(ts*.3));ctx.drawImage(e,hx+ts*.3-ts*.19,hy-ts*.19+bob,ts*.38,ts*.38);}catch(e){}ctx.restore();}});return;}
 const im=img();if(!im||!im.complete||!im.naturalWidth)return;
 const sx=I.x*ts-cx,sy=I.y*ts-cy,a=Math.max(0,Math.min(1,I.a)),hh=ts*1.5,ww=hh*240/330,bob=I.moving?Math.abs(Math.sin(now/110))*2:Math.sin(now/500)*1.5;
 items.push({y:I.y+.03,draw:()=>{ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(sx+ts/2,sy+ts*.9,ts*.3,ts*.09,0,0,7);ctx.fill();
  ctx.translate(sx+ts/2,0);ctx.scale(I.dir<0?-1:1,1);ctx.drawImage(im,-ww/2,sy+ts*.95-hh-bob,ww,hh);ctx.restore();}});}
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];window.MQ_MAPDRAW.push(frame);
window.MQ_HOOKS=window.MQ_HOOKS||[];window.MQ_HOOKS.push({screen:s=>{wrap();
 if(s!=='world'){if(I)abort();return;}
 let p=null;try{p=P();}catch(e){}if(I&&(!p||p.id!==I.pid))abort();if(I||!due(p))return;
 setTimeout(()=>{try{if(curScreen!=='world'||I)return;const q=P();if(due(q))start(q);}catch(e){}},60);}});
addEventListener('pagehide',()=>{try{speechSynthesis.cancel();}catch(e){}});
window.MQ_INTRO={due,next,busy:()=>!!I&&I.ph!=='leave',state:()=>I&&{ph:I.ph,i:I.i,mode:I.mode,x:I.x,y:I.y},LINES,
 start:()=>{try{return start(P());}catch(e){return false;}},_arrive:()=>{if(!I)return;if(I.ph==='come')appear(performance.now());if(I.ph==='walk'){I.x=I.tg[0];I.y=I.tg[1];I.path=[];talk();}},_abort:abort,_door:()=>{if(I&&I.ph==='come'){try{Train.introGo();}catch(e){}I.mode='door';I.wait=0;}}};
})();
