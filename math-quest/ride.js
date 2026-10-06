/* ================= 🚂 the train ride to Dr. Quartz's Lab (Oct 2026, the owner's mockup) =================
   Getting on the stopped Town Train (train.js) plays a short full-screen ride and lands in the Lab (lab.js); the Lab's
   "🚂 Train home" plays it back to Number Town and puts the hero on the station platform.
     going:  the train slides into the hill tunnel → dark tunnel → inside the carriage (the hero holds the pole while hills, trees,
             poles and the odd cow go past at different speeds; the carriage rocks) → it slows, the platform sign
             "🔬 Dr. Quartz's Lab" stops in the window → "Ding! Doors opening…" → white → the Lab.
     home:   the carriage part only, ending at "🏡 Number Town".
   About 12 s (home 9 s). ⏩ Skip shows after a kid's first 3 rides (p.rides). Driven by setTimeout, not requestAnimationFrame,
   so it also runs where animation frames are paused. Drawing only; nothing else is saved. */
(function(){
const Wd=960,Ht=540,NEAR=520;
let R=null;
const hash=i=>{let h=(i*374761393)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
function times(out){const b=out?2700:600;return {tunnel:out?2200:0,black:b,ramp:b+1000,decel:b+5700,stop:b+7700,doors:b+8500,end:b+9200};}
function vAt(T,t){if(t<T.black)return 0;if(t<T.ramp)return (t-T.black)/(T.ramp-T.black);if(t<T.decel)return 1;if(t<T.stop)return 1-(t-T.decel)/(T.stop-T.decel);return 0;}
function rr(c,x,y,w,h,r,keep){if(!keep)c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function train(c,x,y){const car=cx=>{c.fillStyle='#4dabf7';rr(c,cx,y,150,64,10);c.fill();c.fillStyle='#ffffff88';for(let i=0;i<3;i++){rr(c,cx+16+i*44,y+12,30,22,5);c.fill();}c.fillStyle='#333';[cx+30,cx+120].forEach(w=>{c.beginPath();c.arc(w,y+68,12,0,7);c.fill();});};
 car(x-330);car(x-170);c.fillStyle='#e03131';rr(c,x,y-10,150,74,12);c.fill();c.fillStyle='#333';rr(c,x+100,y-40,24,34,4);c.fill();c.fillStyle='#ffe066';c.beginPath();c.arc(x+146,y+30,9,0,7);c.fill();c.fillStyle='#333';[x+35,x+110].forEach(w=>{c.beginPath();c.arc(w,y+68,14,0,7);c.fill();});}
function outside(c,t,T){const g=c.createLinearGradient(0,0,0,Ht);g.addColorStop(0,'#8fd0f5');g.addColorStop(1,'#d8f0ff');c.fillStyle=g;c.fillRect(0,0,Wd,Ht);
 c.fillStyle='#7cc95a';c.fillRect(0,380,Wd,160);c.fillStyle='#6b4a2e';c.fillRect(0,402,Wd,8);for(let x=0;x<Wd;x+=26){c.fillStyle='#8a6440';c.fillRect(x,398,14,16);}
 c.fillStyle='#5fae4b';c.beginPath();c.moveTo(560,400);c.quadraticCurveTo(760,40,980,400);c.fill();
 c.fillStyle='#9a8f84';c.beginPath();c.arc(720,400,92,Math.PI,0);c.fill();c.fillStyle='#111';c.beginPath();c.arc(720,400,70,Math.PI,0);c.fill();
 const x=-260+(t/T.tunnel)*1000;c.save();c.beginPath();c.rect(0,0,654,Ht);c.clip();train(c,x,330);c.restore();
 c.fillStyle='#5fae4b';c.beginPath();c.moveTo(792,400);c.lineTo(792,320);c.quadraticCurveTo(840,250,980,330);c.lineTo(980,400);c.fill();
 if(t>T.tunnel-400){c.fillStyle=`rgba(0,0,0,${Math.min(1,(t-(T.tunnel-400))/400)})`;c.fillRect(0,0,Wd,Ht);}}
function cow(c,x,y){c.fillStyle='#fff';c.beginPath();c.ellipse(x,y,34,20,0,0,7);c.fill();c.fillStyle='#222';c.beginPath();c.ellipse(x-10,y-4,10,7,0,0,7);c.ellipse(x+14,y+4,8,6,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.ellipse(x+36,y-10,14,11,0,0,7);c.fill();c.fillStyle='#f4a';c.beginPath();c.ellipse(x+44,y-6,6,5,0,0,7);c.fill();c.fillStyle='#fff';[x-20,x-6,x+12,x+24].forEach(l=>c.fillRect(l,y+14,6,16));}
function platform(c,cx,sign,lab){c.fillStyle='#c9c2b5';c.fillRect(cx-420,330,840,160);c.fillStyle='#e8c547';c.fillRect(cx-420,330,840,10);
 c.fillStyle=lab?'#dbe4ff':'#ffe8cc';rr(c,cx-260,130,520,200,8);c.fill();c.fillStyle=lab?'#4c6ef5':'#e8590c';c.fillRect(cx-280,110,560,30);
 c.fillStyle='#fff';rr(c,cx-210,160,420,70,14);c.fill();c.strokeStyle=lab?'#1971c2':'#c2410c';c.lineWidth=5;c.stroke();c.fillStyle=lab?'#1971c2':'#c2410c';c.font='700 34px Fredoka, system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(sign,cx,196);
 c.fillStyle=lab?'#74c0fc':'#ffc078';[-180,180].forEach(d=>{rr(c,cx+d-40,250,80,70,8);c.fill();});}
function scenery(c,dt,t,T){const v=vAt(T,t),o=R.off;o.c+=v*dt*NEAR*.04;o.h+=v*dt*NEAR*.15;o.t+=v*dt*NEAR*.45;o.p+=v*dt*NEAR;
 const g=c.createLinearGradient(0,0,0,Ht);g.addColorStop(0,'#7cc4f0');g.addColorStop(1,'#cfeeff');c.fillStyle=g;c.fillRect(0,0,Wd,Ht);
 c.fillStyle='#fff3b0';c.beginPath();c.arc(780,90,36,0,7);c.fill();
 c.fillStyle='#ffffffd0';for(let i=0;i<5;i++){const x=((i*260-o.c)%1300+1300)%1300-150,y=60+hash(i)*70;c.beginPath();c.ellipse(x,y,60,20,0,0,7);c.ellipse(x+40,y-10,40,18,0,0,7);c.fill();}
 c.fillStyle='#93c47d';c.beginPath();c.moveTo(0,Ht);for(let x=0;x<=Wd;x+=10)c.lineTo(x,300+Math.sin((x+o.h)/120)*30+Math.sin((x+o.h)/47)*12);c.lineTo(Wd,Ht);c.fill();
 c.fillStyle='#7cb35f';c.fillRect(0,360,Wd,Ht);
 for(let i=-1;i<9;i++){const idx=Math.floor(o.t/150)+i,x=idx*150-o.t,h=hash(idx+R.seed);if(h<.25)continue;const s=.7+h*.6;
  if(h>.92){cow(c,x+40,368);continue;}c.fillStyle='#7a5230';c.fillRect(x+40,330-30*s,10,60*s);c.fillStyle=h>.6?'#3f8f3a':'#4caf50';c.beginPath();c.arc(x+45,320-40*s,34*s,0,7);c.fill();}
 for(let i=-1;i<6;i++){const idx=Math.floor(o.p/260)+i,x=idx*260-o.p;c.fillStyle='#6b4a2e';c.fillRect(x,250,12,230);c.fillStyle='#333';c.fillRect(x-18,262,48,6);}
 c.strokeStyle='#333';c.lineWidth=2;c.beginPath();c.moveTo(0,266);c.lineTo(Wd,266);c.stroke();
 if(t>=T.decel){if(R.platX===null)R.platX=Wd/2+NEAR*((T.stop-T.decel)/1000)/2;else R.platX-=v*dt*NEAR;platform(c,R.platX,R.sign,R.to==='lab');}}
function carriage(c,t,T,dark){const v=vAt(T,t),bob=Math.sin(t/140)*2*v+Math.sin(t/57)*v;c.save();c.translate(0,bob);
 c.fillStyle=dark?'#3b3150':'#efe3cc';c.beginPath();c.rect(-20,-20,Wd+40,Ht+40);rr(c,70,60,820,300,40,1);c.fill('evenodd');
 c.strokeStyle='#8a6a4a';c.lineWidth=14;rr(c,70,60,820,300,40);c.stroke();c.fillStyle='#8a6a4a';c.fillRect(476,60,10,300);
 c.fillStyle=dark?'#2a2238':'#7a5c3e';c.fillRect(-20,380,Wd+40,200);c.fillStyle=dark?'#3a2f4d':'#b08a5e';c.fillRect(-20,372,Wd+40,12);
 c.fillStyle='#c0c0c8';c.fillRect(250,-20,12,Ht+40);c.fillStyle='#e9ecef';c.fillRect(252,-20,4,Ht+40);
 c.fillStyle=dark?'#5a4a78':'#7048e8';rr(c,620,400,250,90,16);c.fill();c.fillStyle=dark?'#4a3d66':'#5f3dc4';rr(c,620,370,250,40,14);c.fill();
 if(R.img&&R.img.complete&&R.img.naturalWidth)c.drawImage(R.img,170,250,200,260);c.restore();}
function tunnel(c,t,T){c.fillStyle='#0b0b10';c.fillRect(0,0,Wd,Ht);const k=(t-T.tunnel)/40;for(let i=0;i<6;i++){const x=((i*190-k*14)%1140+1140)%1140-90;c.fillStyle='rgba(255,220,120,.55)';c.fillRect(x,120,60,8);}carriage(c,t,T,true);}
function sfx(k){try{if(!state.sound||typeof tone!=='function')return;if(k==='whistle')[[0,.5],[.62,1.1]].forEach(([d,l])=>{tone(740,l,'sine',.05,d);tone(932,l,'sine',.045,d);});else if(k==='ding')[0,.32].forEach(d=>{tone(1320,.35,'sine',.05,d);tone(1760,.3,'sine',.025,d);});}catch(e){}}
function step(){if(!R)return;const now=performance.now(),t=now-R.t0,dt=R.last?Math.min(.05,(now-R.last)/1000):0;R.last=now;const T=R.T,c=R.ctx;
 if(R.out&&t<T.tunnel)outside(c,t,T);
 else if(R.out&&t<T.black)tunnel(c,t,T);
 else if(t<T.doors){scenery(c,dt,t,T);carriage(c,t,T,false);if(t<T.black+400){c.fillStyle=`rgba(0,0,0,${Math.max(0,1-(t-T.black)/400)})`;c.fillRect(0,0,Wd,Ht);}
  if(t>T.stop){if(!R.dinged){R.dinged=1;sfx('ding');}c.fillStyle='rgba(255,255,255,.95)';c.font='700 40px Fredoka, system-ui, sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.fillText('🔔 Ding! Doors opening…',Wd/2,44);}}
 else{scenery(c,0,t,T);carriage(c,t,T,false);c.fillStyle=`rgba(255,255,255,${Math.min(1,(t-T.doors)/600)})`;c.fillRect(0,0,Wd,Ht);}
 const cap=R.el.querySelector('.rd-cap');if(cap){const s=R.out&&t<T.tunnel?(R.to==='lab'?'Number Town station':''):R.out&&t<T.black?'In the tunnel…':t<T.decel?'Next stop: '+R.name:t<T.doors?R.name:'';if(cap.textContent!==s)cap.textContent=s;cap.style.display=s?'':'none';}
 if(t>=T.end){finish();return;}R.tm=setTimeout(step,16);}
function finish(){if(!R)return;const r=R;R=null;clearTimeout(r.tm);r.el.remove();try{r.done&&r.done();}catch(e){console.warn('ride',e);}}
/* to: 'lab' (from the Town Train) or 'home' (from the Lab) */
function go(to,done){if(R)return false;const p=typeof P==='function'?P():null;const n=p?(p.rides||0):0;if(p){p.rides=n+1;try{saveLocal();}catch(e){}}
 const out=to==='lab',el=document.createElement('div');el.id='rideOv';el.className='rd-ov';
 el.innerHTML=`<canvas width="${Wd}" height="${Ht}"></canvas><span class="rd-cap"></span>${n>=3?'<button class="rd-skip" type="button" onclick="Ride._skip()">⏩ Skip</button>':''}`;
 css();document.body.appendChild(el);const img=new Image();try{if(p&&typeof heroSVG==='function')img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(heroSVG(p.look,{spell:p.spell}));}catch(e){}
 R={to,out,done,el,ctx:el.querySelector('canvas').getContext('2d'),T:times(out),t0:performance.now(),last:0,off:{c:0,h:0,t:0,p:0},platX:null,img,seed:Math.floor(Math.random()*999),
  sign:out?"🔬 Dr. Quartz's Lab":'🏡 Number Town',name:out?"Dr. Quartz's Lab":'Number Town',dinged:0};
 sfx('whistle');step();return true;}
let CSSON=false;function css(){if(CSSON)return;CSSON=true;const s=document.createElement('style');s.textContent=`
.rd-ov{position:fixed;inset:0;z-index:200;background:#000;display:grid;place-items:center}
.rd-ov canvas{width:100vw;height:100vh;object-fit:contain;display:block}
.rd-cap{position:fixed;left:14px;top:calc(12px + env(safe-area-inset-top));background:rgba(0,0,0,.5);color:#fff;border-radius:12px;padding:6px 12px;font:600 16px Fredoka,system-ui,sans-serif}
.rd-skip{position:fixed;right:14px;top:calc(12px + env(safe-area-inset-top));background:rgba(0,0,0,.5);color:#fff;border:2px solid #fff8;border-radius:12px;padding:8px 14px;font:700 16px Fredoka,system-ui,sans-serif;cursor:pointer;min-height:44px}`;document.head.appendChild(s);}
window.Ride={go,_skip:finish,busy:()=>!!R};
})();
