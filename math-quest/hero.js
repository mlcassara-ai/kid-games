/* hero.js — the wizard on the world map as a moving puppet (Oct 2026).
   Head, body, arms, staff, boots and a flowing robe and cloak are drawn on joints in four directions, so he walks, turns to face
   the way he goes, blinks, breathes, turns back to face you when he stands still, and now and then waves or does a little something.
   Everything else in the game (shop, cards, battles) still uses heroSVG(); the map falls back to that picture if this file fails.
   Coordinates are heroSVG's: a 100 x 130 frame, the feet at (50,124), the head the circle at (50,46) r16. */
(function(){
'use strict';
const INK='#2b2140',BOOT='#5b3d2a',BOOT2='#3f2a1c',WOOD='#a0673a';
let look={hat:'wizard',robe:'purple',skin:'#ffe0c7',hair:'#2b1d0e',boy:true},ORB='#ffe066',BUBK=1,SHADOWS=true,FACE='down';
const hasHat=()=>!!look.hat&&look.hat!=='none';
function setLook(lk,spell){lk=lk||{};look={hat:lk.hat||'none',robe:lk.robe,skin:lk.skin||'#ffe0c7',hair:lk.hair||'#2b1d0e',boy:lk.kind==='boy'};
 const S=typeof SPELLS!=='undefined'?SPELLS:[],sp=S.find(s=>s.id===spell)||S[0];ORB=(sp&&sp.color)||'#ffe066';}
const cache={};const P=s=>cache[s]||(cache[s]=new Path2D(s));
function ell(cx,cy,rx,ry){const p=new Path2D();p.ellipse(cx,cy,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);return p;}
function fs(c,path,fill,w){c.fillStyle=fill;c.fill(path);if(w!==0){c.lineWidth=w||2.5;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';c.stroke(path);}}
function robeFill(c,x0,y0,x1,y1){const R=typeof ROBES!=='undefined'?ROBES:[{id:'purple',c:'#7c5cff'}],r=R.find(x=>x.id===look.robe)||R[0];if(!r.grad)return r.c;const g=c.createLinearGradient(x0,y0,x1,y1);r.grad.forEach((col,i,a)=>g.addColorStop(i/(a.length-1),col));return g;}
function geomArm(sx,sy,a1,a2,l1,l2){const ex=sx+Math.sin(a1)*l1,ey=sy+Math.cos(a1)*l1;return {sx,sy,ex,ey,hx:ex+Math.sin(a2)*l2,hy:ey+Math.cos(a2)*l2};}
function drawArm(c,g,fill,dim){c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(g.sx,g.sy);c.lineTo(g.ex,g.ey);c.lineTo(g.hx,g.hy);c.strokeStyle=INK;c.lineWidth=11;c.stroke();c.strokeStyle=fill;c.lineWidth=7;c.stroke();
 if(dim){c.strokeStyle='rgba(0,0,0,.22)';c.stroke();}fs(c,ell(g.hx,g.hy,5,5),look.skin,2);if(dim)fs(c,ell(g.hx,g.hy,5,5),'rgba(0,0,0,.18)',0);}
function drawStaff(c,hx,hy,tilt,glow){c.save();c.translate(hx,hy);c.rotate(tilt);c.lineCap='round';c.beginPath();c.moveTo(0,-38);c.lineTo(0,36);c.strokeStyle=INK;c.lineWidth=6;c.stroke();c.strokeStyle=WOOD;c.lineWidth=3.5;c.stroke();
 c.save();c.shadowColor=ORB;c.shadowBlur=SHADOWS?4+glow*10:0;fs(c,ell(0,-43,7.5,7.5),ORB,2);c.restore();c.globalAlpha=.85;fs(c,ell(-2.5,-45.5,2.2,2.2),'#fff',0);c.globalAlpha=1;c.restore();return [hx+Math.sin(tilt)*43,hy-Math.cos(tilt)*43];}
/* a robe or cloak outline whose sides sway and whose hem ripples */
function flowPath(xl,xr,hl,hr,top,bot,t,amp,spd,sway,wk){wk=wk*.45; /* soft, long ripples drawn as smooth curves through the wave points */
 const pts=[];const n=8;for(let i=0;i<=n;i++){const x=hr-(hr-hl)*i/n,y=bot+amp*Math.sin(x*wk+t*spd)+amp*.3*Math.sin(x*wk*1.7-t*spd*1.2);pts.push([x,y]);}
 let d=`M${xl} ${top} Q50 ${top-5} ${xr} ${top} Q${(xr+hr)/2+sway} ${(top+bot)/2} ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(2)}`;
 for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i],mx=(x0+x1)/2,my=(y0+y1)/2+1.6;d+=` Q${mx.toFixed(1)} ${my.toFixed(2)} ${x1.toFixed(1)} ${y1.toFixed(2)}`;}
 return new Path2D(d+` Q${(xl+hl)/2+sway} ${(top+bot)/2} ${xl} ${top} Z`);}
function cuff(c,g,fill){const a=Math.atan2(g.hy-g.ey,g.hx-g.ex);c.save();c.translate(g.hx-Math.cos(a)*3.5,g.hy-Math.sin(a)*3.5);c.rotate(a);const p=new Path2D('M-3 -4.5 L4 -7.5 Q6 0 4 7.5 L-3 4.5 Z');fs(c,p,fill,2);c.restore();}
function star(c,x,y,r,col){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=col;c.fill();c.lineWidth=1;c.strokeStyle=INK;c.stroke();}

/* every hat in the shop, drawn from the front, the side (facing left) and the back, in the hero's head space
   (head centre 50,46, radius 16; the same coordinates as heroSVG so the front views match the shop pictures) */
function drawHat(c,view){const h=look.hat,O=2.5,front=view==='front',side=view==='side',back=view==='back';if(!h||h==='none')return;
 const rr=(x,y,w,hh,r,fill,lw)=>{const p=new Path2D();p.roundRect(x,y,w,hh,r);fs(c,p,fill,lw);};
 switch(h){
 case 'wizard':{const rf=robeFill(c,30,0,70,40);
  if(side){fs(c,P('M35 35 Q50 39 65 35 Q62 23 61 13 Q61 5 67 2 Q57 0 54 8 Q45 22 35 35Z'),rf,O);fs(c,ell(50,35,20,3.8),rf,O);star(c,54,23,4.2,'#ffe066');return;}
  fs(c,P('M33 35 Q50 40 67 35 L56 8 Q52 1 48 8 Z'),rf,O);fs(c,ell(50,35,21,4.6),rf,O);if(front)star(c,51,22,5.2,'#ffe066');return;}
 case 'moonhat':{const M='#1c2e6b';
  if(side){fs(c,P('M35 35 Q50 39 65 35 Q62 23 61 13 Q61 5 67 2 Q57 0 54 8 Q45 22 35 35Z'),M,O);fs(c,ell(50,35,20,3.8),M,O);fs(c,P('M50 15 a5 5 0 1 0 4 8 a4 4 0 1 1 -4 -8z'),'#ffe066',0);fs(c,ell(44,27,1.2,1.2),'#fff',0);return;}
  fs(c,P('M33 35 Q50 40 67 35 L58 6 Q55 0 51 6 Z'),M,O);fs(c,ell(50,35,22,4.8),M,O);
  if(front)fs(c,P('M54 14 a6 6 0 1 0 5 9 a5 5 0 1 1 -5 -9z'),'#ffe066',0);[[44,24,1.3],[58,30,1.1],[48,12,1]].forEach(([x,y,r])=>fs(c,ell(x,y,r,r),'#fff',0));return;}
 case 'cap':{
  if(side){fs(c,P('M34 39 Q33 24 50 24 Q67 24 66 39 Z'),'#ef4444',O);fs(c,P('M38 37 Q22 36 18 41 Q30 44 40 41Z'),'#c92a2a',2);fs(c,ell(52,24,2.5,2.5),'#fff',1);return;}
  fs(c,P('M34 39 Q33 24 50 24 Q67 24 66 39 Z'),'#ef4444',O);
  if(front)fs(c,P('M60 37 Q76 36 80 41 Q68 44 58 41Z'),'#c92a2a',2);else{c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;c.beginPath();c.moveTo(44,36);c.lineTo(56,36);c.stroke();}
  fs(c,ell(50,24,2.5,2.5),'#fff',1);return;}
 case 'bow':{const bow=(x,y,k)=>{c.save();c.translate(x,y);c.scale(k,k);fs(c,P('M0 0 L-10 -8 L-10 6 Z M0 0 L10 -8 L10 8 Z'),'#ff5fa2',2);fs(c,ell(0,0,4,4),'#ff8fc0',2);c.restore();};
  if(side){bow(58,30,.85);return;}bow(front?60:40,30,1);return;}
 case 'catears':{const hair=look.hair;
  if(side){c.save();c.translate(4,-1.5);fs(c,P('M44 38 L46 18 L56 31 Z'),hair,2.2);c.restore();fs(c,P('M42 38 L44 18 L54 31 Z'),hair,2.5);fs(c,P('M45 32 L46 23 L51 29 Z'),'#ff9fbf',0);return;}
  fs(c,P('M33 38 L34 18 L46 30 Z M67 38 L66 18 L54 30 Z'),hair,2.5);if(front)fs(c,P('M36 32 L36.5 23 L42 29 Z M64 32 L63.5 23 L58 29 Z'),'#ff9fbf',0);return;}
 case 'helmet':{
  if(side){fs(c,P('M34 34 Q46 6 70 10 Q60 16 58 28Z'),'#ef4444',2);fs(c,P('M33 44 Q33 24 50 24 Q67 24 67 44 Z'),'#c9d1dc',O);fs(c,P('M33 38 L45 38 L45 44 L33 44Z'),'#a4adb8',0);return;}
  fs(c,P('M50 26 Q60 8 74 12 Q63 16 57 27Z'),'#ef4444',2);fs(c,P('M32 44 Q32 24 50 24 Q68 24 68 44 Z'),'#c9d1dc',O);rr(48,25,4,19,0,'#a4adb8',0);return;}
 case 'viking':{
  if(side){const horn='M45 33 Q43 22 48 13 Q50 9 53 10 Q49 18 52 31Z';c.save();c.translate(3.5,-2.5);fs(c,P(horn),'#d9cdac',2.2);c.restore();
   fs(c,P('M33 40 Q33 23 50 23 Q67 23 67 40 Z'),'#9aa4b1',O);rr(32,36,36,5,2,'#c68642',1.5);fs(c,P(horn),'#f4ead0',2.2);return;}
  fs(c,P('M35 36 Q20 32 21 14 Q27 27 38 29Z M65 36 Q80 32 79 14 Q73 27 62 29Z'),'#f4ead0',2.2);fs(c,P('M32 40 Q32 23 50 23 Q68 23 68 40 Z'),'#9aa4b1',O);
  rr(31,36,38,5,2,'#c68642',1.5);if(front)rr(48,26,4,10,0,'#b9c1cb',0);return;}
 case 'crown':{
  if(side){fs(c,P('M37 34 L36 19 L43 25 L50 14 L57 25 L64 19 L63 34 Z'),'#ffc83d',O); /* from the side: the red front gem at the front edge, turned away, and the gem on the side we see (his left side is green, his right blue) */
   fs(c,ell(38.6,28.6,1.1,2.4),'#ef4444',0);fs(c,ell(51,29.5,2.3,2.3),FACE==='right'?'#2f8cff':'#22b35e',0);return;}
  fs(c,P('M35 34 L34 18 L42 25 L50 13 L58 25 L66 18 L65 34 Z'),'#ffc83d',O);if(front){fs(c,ell(50,28,2.6,2.6),'#ef4444',0);fs(c,ell(41,30,2,2),'#2f8cff',0);fs(c,ell(59,30,2,2),'#22b35e',0);}return;}
 case 'astro':{c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(side?52:50,24);c.lineTo(side?54:50,12);c.stroke();fs(c,ell(side?54:50,11,3,3),'#ff5a5f',1.5);
  c.save();c.globalAlpha=.25;fs(c,ell(50,45,22,22),'#aae1ff',0);c.restore();c.strokeStyle='#dfe9f5';c.lineWidth=3.5;c.beginPath();c.arc(50,45,22,0,7);c.stroke();
  if(!back){c.save();c.globalAlpha=.8;c.strokeStyle='#fff';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(36,36);c.quadraticCurveTo(40,29,47,27);c.stroke();c.restore();}return;}
 case 'chef':{
  if(side){fs(c,P('M36 38 L37 26 Q30 20 36 13 Q42 6 50 10 Q58 5 64 13 Q70 21 63 26 L64 38 Z'),'#fff',2.4);rr(36,33,28,6,2,'#f1f3f5',1.6);return;}
  fs(c,P('M34 38 L35 26 Q28 20 34 14 Q38 6 46 11 Q50 4 56 10 Q64 6 67 14 Q72 21 65 26 L66 38 Z'),'#fff',2.4);rr(34,33,32,6,2,'#f1f3f5',1.6);return;}
 case 'pirate':{
  if(side){fs(c,P('M24 34 Q32 18 52 19 Q68 21 74 35 Q60 29 50 30 Q37 30 24 34Z'),'#212529',2.4);c.strokeStyle='#ffd43b';c.lineWidth=2;c.beginPath();c.moveTo(30,31);c.quadraticCurveTo(50,25,70,32);c.stroke();return;}
  fs(c,P('M24 36 Q30 20 50 18 Q70 20 76 36 Q63 30 50 33 Q37 30 24 36Z'),'#212529',2.4);c.strokeStyle='#ffd43b';c.lineWidth=2;c.beginPath();c.moveTo(30,33);c.quadraticCurveTo(50,27,70,33);c.stroke();
  if(front){fs(c,ell(50,25,3.4,3.4),'#fff',0);c.strokeStyle='#fff';c.lineWidth=1.4;c.beginPath();c.moveTo(46.5,29);c.lineTo(53.5,26);c.moveTo(46.5,26);c.lineTo(53.5,29);c.stroke();}return;}
 case 'tophat':{const w=side?22:26,x=50-w/2;rr(x,8,w,26,3,'#1f1235',2.4);const band=new Path2D();band.rect(x,26,w,5);fs(c,band,'#9775fa',0);fs(c,ell(50,35,side?19:21,4.5),'#1f1235',2.4);if(front)star(c,58,15,4,'#ffe066');return;}
 case 'dragon':{
  if(side){const horn='M42 30 Q34 20 34 6 Q40 16 48 24Z';c.save();c.translate(4,-2);fs(c,P(horn),'#e9dda4',2);c.restore();fs(c,P('M33 41 Q33 22 50 21 Q67 22 67 41 Z'),'#2f9e44',O);fs(c,P(horn),'#fff3bf',2);
   [[44,22],[52,21],[60,23]].forEach(([x,y])=>fs(c,P(`M${x-3} ${y+2} L${x} ${y-5} L${x+3} ${y+2}Z`),'#ffd43b',1.2));return;}
  fs(c,P('M36 30 Q26 22 24 8 Q33 18 40 24Z M64 30 Q74 22 76 8 Q67 18 60 24Z'),'#fff3bf',2);fs(c,P('M31 41 Q31 22 50 21 Q69 22 69 41 Z'),'#2f9e44',O);
  [[43,26],[50,23],[57,26]].forEach(([x,y])=>fs(c,P(`M${x-3} ${y} L${x} ${y-5} L${x+3} ${y}Z`),'#ffd43b',1.2));if(front)fs(c,ell(50,33,3,3),'#ff6b6b',1.3);return;}
 case 'halo':{const rx=side?14:18;c.strokeStyle='#ffe066';c.lineWidth=4;c.beginPath();c.ellipse(50,16,rx,5.5,0,0,7);c.stroke();c.strokeStyle='#fff9db';c.lineWidth=1.5;c.stroke();
  (side?[[38,16],[62,16]]:[[32,16],[68,16],[50,7]]).forEach(([x,y])=>star(c,x,y,3.4,'#fff3bf'));return;}
 case 'phoenix':{
  if(side){fs(c,P('M36 36 Q33 22 38 13 Q41 22 44 24 Q45 10 52 3 Q58 12 57 24 Q61 21 64 13 Q68 24 64 36 Z'),'#ff922b',2.3);fs(c,P('M42 34 Q41 27 45 23 Q47 29 51 14 Q54 28 57 23 Q60 27 59 34Z'),'#ffe066',0);rr(36,32,28,6,2,'#f59f00',1.6);return;}
  fs(c,P('M34 36 Q30 22 36 12 Q38 22 42 24 Q42 10 50 2 Q58 10 58 24 Q62 22 64 12 Q70 22 66 36 Z'),'#ff922b',2.3);fs(c,P('M40 34 Q39 26 43 22 Q46 29 50 12 Q54 29 57 22 Q61 26 60 34Z'),'#ffe066',0);
  rr(34,32,32,6,2,'#f59f00',1.6);if(front)fs(c,ell(50,35,2.4,2.4),'#e03131',0);return;}
 case 'pumpkin':{fs(c,ell(50,25,side?16:18,12),'#ff8c1a',O);c.strokeStyle='#d9480f';c.lineWidth=2;c.beginPath();
  if(side){c.moveTo(44,15);c.quadraticCurveTo(41,25,44,36);c.moveTo(54,14);c.lineTo(54,37);}else{c.moveTo(42,15);c.quadraticCurveTo(39,25,42,36);c.moveTo(58,15);c.quadraticCurveTo(61,25,58,36);c.moveTo(50,13);c.lineTo(50,37);}c.stroke();
  c.strokeStyle='#2f9e44';c.lineWidth=3.5;c.lineCap='round';c.beginPath();c.moveTo(50,13);c.quadraticCurveTo(51,6,56,5);c.stroke();fs(c,P('M52 9 Q60 6 63 11 Q56 13 52 9Z'),'#40c057',1.2);
  if(front){fs(c,P('M43 25 L46 22 L49 25Z M51 25 L54 22 L57 25Z'),'#5c2a00',0);c.strokeStyle='#5c2a00';c.lineWidth=1.6;c.beginPath();c.moveTo(44,30);c.quadraticCurveTo(50,34,56,30);c.stroke();}return;}
 case 'pilgrim':{const w=side?19:21.5;fs(c,P(`M${50-w/2-2.5} 34 L${50-w/2} 9 Q50 6 ${50+w/2} 9 L${50+w/2+2.5} 34 Z`),'#2b2622',2.4);
  const b=new Path2D();b.rect(50-w/2-1.4,24.5,w+2.8,6);fs(c,b,'#5c4a3d',0);if(front){c.strokeStyle='#fcc419';c.lineWidth=2.2;c.strokeRect(45.5,23.5,9,8);}
  fs(c,ell(50,35,side?20:23,4.8),'#2b2622',2.4);return;}
 case 'scout':{fs(c,ell(50,35,side?25:27,side?5:6),'#c8a165',2.4);fs(c,P('M36 35 Q37 22 43 15 L50 20 L57 15 Q63 22 64 35 Z'),'#b08447',2.4);
  c.strokeStyle='#8a6532';c.lineWidth=1.6;c.beginPath();c.moveTo(43,15);c.lineTo(50,26);c.lineTo(57,15);c.stroke();rr(36,29,28,5,1.5,'#2f9e44',1.4);
  fs(c,P(side?'M40 28 q-5 -7 -9 -4 q2 6 9 4z':back?'M42 28 q-5 -7 -9 -4 q2 6 9 4z':'M58 28 q5 -7 9 -4 q-2 6 -9 4z'),'#51cf66',1);return;}
 }}
/* long hair (girl wizard): it swings when she walks and drifts in the breeze when she stands */
let HF={t:0,walk:false,p:0};
function hairLocks(c,t,swing,col){const wl=swing*3+Math.sin(t*1.8)*1.5,wr=swing*3+Math.sin(t*1.8+1)*1.5;
 fs(c,new Path2D(`M36 40 Q28 46 29 60 Q27 78 ${26+wl} 94 Q31 97 36 92 Q38 76 41 58Z`),col,2);
 fs(c,new Path2D(`M64 40 Q72 46 71 60 Q73 78 ${74+wr} 94 Q69 97 64 92 Q62 76 59 58Z`),col,2);}
/* the head: front / side (facing left) / back */
function drawHead(c,view,face,o){o=o||{};const skin=look.skin,hair=look.hair,boy=look.boy,lx=o.lx||0,ly=o.ly||0;
 if(view==='front'){
  if(boy){fs(c,ell(34.5,48,3.6,3.6),skin,2);fs(c,ell(65.5,48,3.6,3.6),skin,2);fs(c,ell(50,40,16.5,12),hair,2);}
  else{fs(c,P('M33 44 Q31 30 50 28 Q69 30 67 44 L69 62 Q63 64 61 58 L39 58 Q37 64 31 62 Z'),hair,2);}
  fs(c,ell(50,46,16,16),skin,2.5);
  if(boy)fs(c,P('M34.5 42 L36 30 L41 35 L44 28 L48.5 34 L52 27.5 L55.5 34 L60 29 L62 35 L66 31 L65.5 42 Q58 36.5 50 37.5 Q42 36.5 34.5 42 Z'),hair,1.5);
  else fs(c,P('M34 44 Q33 28 50 28 Q67 28 66 44 Q60 35 50 36 Q40 35 34 44Z'),hair,1.5);
  eyes(c,[[44,47],[56,47]],face,lx,ly);
  c.globalAlpha=boy?.3:.55;fs(c,ell(39.5,52.5,2.6,2.6),'#ff8fa3',0);fs(c,ell(60.5,52.5,2.6,2.6),'#ff8fa3',0);c.globalAlpha=1;
  mouth(c,face,46,54,54,58);if(!o.noHat)drawHat(c,'front');return;}
 if(view==='back'){
  if(boy){fs(c,ell(34.5,48,3.6,3.6),skin,2);fs(c,ell(65.5,48,3.6,3.6),skin,2);}
  fs(c,ell(50,46,16,16),skin,2.5);
  if(boy){fs(c,P('M34 46 Q33 30 50 29 Q67 30 66 46 Q64 57 58 59 L60 54 L55 57 L52 52 L48 57 L45 52 L41 57 L42 53 Q36 54 34 46Z'),hair,1.8);}
  else{const w=HF.walk?Math.sin(HF.p)*3:Math.sin(HF.t*1.8)*1.2; /* long hair down her back */
   fs(c,new Path2D(`M34 44 Q31 29 50 28 Q69 29 66 44 Q69 66 ${66+w} 87 Q${60+w*.8} 92 ${55+w*.7} 88 Q${50+w*.6} 93 ${45+w*.5} 88 Q${40+w*.4} 92 ${34+w*.3} 87 Q31 66 34 44Z`),hair,2);
   c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=1.4;c.lineCap='round';[[42,-.6],[50,0],[58,.6]].forEach(([x0,k])=>{c.beginPath();c.moveTo(x0,48);c.quadraticCurveTo(x0+k*3,66,x0+k*4+w*.5,84);c.stroke();});}
  if(!o.noHat)drawHat(c,'back');return;}
 /* side, facing left */
 if(!boy){const tr=HF.walk?6+Math.sin(HF.t*7)*2:1.5+Math.sin(HF.t*1.8)*1.5; /* streams out behind her */
  fs(c,new Path2D(`M44 30 Q62 26 67 40 Q70 56 ${72+tr} 72 Q${76+tr*1.3} 86 ${74+tr*1.6} 94 Q${66+tr} 97 ${62+tr*.6} 88 Q60 74 57 60 Q60 48 54 40Z`),hair,2);}
 fs(c,ell(50,46,16,16),skin,2.5);
 fs(c,P('M35.2 45 Q30.4 49 35 52.6'),skin,0);c.lineWidth=2.2;c.strokeStyle=INK;c.beginPath();c.moveTo(35.4,44.6);c.quadraticCurveTo(30.2,49,35.2,53);c.stroke();
 fs(c,ell(55.5,48.5,3.2,3.6),skin,2);
 if(boy)fs(c,P('M37 38 L40 29 L44 33 L48 26 L52 32 L57 27 L59 33 L64 31 L66 41 Q67 51 62 57 Q62 47 57 42 Q48 37 37 38Z'),hair,1.6);
 else fs(c,P('M35 41 Q36 28 50 28 Q64 29 66.5 44 Q67.5 55 62 61 Q57 57 55.5 50 Q54 42 47 38.5 Q41 38 35 41Z'),hair,1.6); /* her hair covers the back of the head and the ear */
 eyes(c,[[42,46.5]],face,lx,ly);
 c.globalAlpha=boy?.3:.55;fs(c,ell(41.5,52.5,2.5,2.4),'#ff8fa3',0);c.globalAlpha=1;
 mouth(c,face,37,54.5,43,57.5,true);if(!o.noHat)drawHat(c,'side');}
function eyes(c,pts,face,lx,ly){pts.forEach(([x,y])=>{c.strokeStyle=INK;c.lineWidth=2;c.lineCap='round';
 if(face==='blink'||face==='ah'||face==='sleep'){c.beginPath();c.moveTo(x-2.4,y+.5);c.lineTo(x+2.4,y+.5);c.stroke();}
 else if(face==='happy'||face==='chewA'||face==='chewB'){c.beginPath();c.moveTo(x-2.6,y+1);c.quadraticCurveTo(x,y-2.6,x+2.6,y+1);c.stroke();}
 else if(face==='dizzy'){c.beginPath();c.moveTo(x-2.2,y-2.2);c.lineTo(x+2.2,y+2.2);c.moveTo(x+2.2,y-2.2);c.lineTo(x-2.2,y+2.2);c.stroke();}
 else if(face==='wow'){fs(c,ell(x,y-.4,3.1,3.9),'#fff',1.4);fs(c,ell(x+lx*.6,y-1.6,1.9,2.3),INK,0);fs(c,ell(x+lx*.6+.7,y-2.4,.7,.7),'#fff',0);}
 else if(face==='calm'){c.beginPath();c.moveTo(x-2.6,y);c.quadraticCurveTo(x,y+2,x+2.6,y);c.stroke();}
 else if(face==='cross'){const ix=x<50?1.3:-1.3;fs(c,ell(x+ix,y-1.4,2.4,3),INK,0);fs(c,ell(x+ix+.9,y-2.4,.95,.95),'#fff',0);}
 else{fs(c,ell(x+lx,y+ly,2.4,3),INK,0);fs(c,ell(x+lx+.9,y+ly-1,.95,.95),'#fff',0);}});}
function mouth(c,face,x0,y0,x1,y1,side){c.strokeStyle=INK;c.lineWidth=2;c.lineCap='round';c.beginPath();const mx=(x0+x1)/2;
 if(face==='dizzy'){c.ellipse(mx,y0+1.5,2,2.4,0,0,Math.PI*2);c.stroke();return;}
 if(face==='sleep'||face==='chewB'){c.ellipse(mx,y0+1.8,1.6,1.8,0,0,Math.PI*2);c.stroke();return;}
 if(face==='chewA'){c.moveTo(mx-2.5,y0+1.8);c.lineTo(mx+2.5,y0+1.8);c.stroke();return;}
 if(face==='wow'||face==='ah'){c.fillStyle='#7a2a3a';c.ellipse(mx,y0+2,2.4,3,0,0,Math.PI*2);c.fill();c.stroke();return;}
 if(face==='look'){c.moveTo(x0+1,y0+1.5);c.quadraticCurveTo(mx,y0+2.3,x1-1,y0+1);c.stroke();return;}
 const dip=face==='happy'?5:4;c.moveTo(x0,y0);c.quadraticCurveTo(mx,y0+dip,x1,side?y0+.5:y0);c.stroke();}

/* poses. st = {view, mode:'idle'|'walk'|'wave'|'fall'|'zap', phase, t, mt (time in the current mode), blink} */
/* a fall: stumble, drop, lie dizzy (the hat rolls off), get up, stare at the hat, swirl the staff, the hat floats back on */
const FALL={stumble:.22,drop:.5,land:.62,lie:1.55,up:1.95,stare:2.9,float:3.95,end:4.4};
/* a zap: out of nowhere his staff shoots lightning up and the shock jolts him, then "What was that?" */
const ZAP={raise:.05,bolt:.6,say0:.8,say1:2.7,end:2.9};
function fallRot(mt){const ease=k=>k*k,out=k=>1-(1-k)*(1-k);
 if(mt<FALL.stumble)return .35*out(mt/FALL.stumble);
 if(mt<FALL.drop)return .35+1.17*ease((mt-FALL.stumble)/(FALL.drop-FALL.stumble));
 if(mt<FALL.land){const k=(mt-FALL.drop)/(FALL.land-FALL.drop);return 1.52-Math.sin(k*Math.PI)*.12;}
 if(mt<FALL.lie)return 1.52;
 if(mt<FALL.up)return 1.52*(1-out((mt-FALL.lie)/(FALL.up-FALL.lie)));return 0;}
const EMO={wave:{len:2.4,label:'Waving 👋'},zap:{len:ZAP.end,label:'Zap! ⚡'},thanks:{len:1.5,label:'Thanks! 😊'},startled:{len:1.9,label:'Startled! 😱'},rescue:{len:4.2,label:'Zap the shark! ⚡🦈'},cheer:{len:1.9,label:'Right answer! ✅'},oops:{len:2.3,label:'Hmm, not quite 🤔'},
 level:{len:2.5,label:'Level up! ⭐'},sneeze:{len:3.1,label:'Ah… ACHOO! 🤧'},fly:{len:5.2,label:'A butterfly! 🦋'},snack:{len:3.6,label:'Snack time 🍎'},doze:{len:5.6,label:'Dozing off 😴'}};
const EMO_FRONT=['startled','thanks','zap','cheer','oops','level','sneeze','fly','snack','doze'];
/* tripping over a cord: he lifts a little into the air while his top half pitches forward (bent at the waist) and the caught foot stays back */
const fallLift=mt=>mt<FALL.drop?Math.sin(mt/FALL.drop*Math.PI)*14:0;
const fallBend=mt=>mt<FALL.stumble?.32*(1-(1-mt/FALL.stumble)**2):mt<FALL.drop?.32*(1-(mt-FALL.stumble)/(FALL.drop-FALL.stumble)):0;
const TRIPS_ON=false; /* tripping is off for now; the fall code below is kept so it can come back */
const lerp=(a,b,k)=>a+(b-a)*k,clamp01=k=>Math.max(0,Math.min(1,k)),smooth=k=>k*k*(3-2*k);
function drawHero(c,st){FACE=st.view;const v=st.view,mode=st.mode,p=st.phase||0,t=st.t||0,mt=st.mt||0;HF={t,walk:mode==='walk',p};
 const back=v==='up',side=v==='left'||v==='right',mirror=v==='up'||v==='right';
 const walking=mode==='walk',waving=mode==='wave',falling=mode==='fall',zapping=mode==='zap';
 const s=Math.sin(p);let bob=0,hem=0,tilt=0,liftA=0,liftB=0,stride=0,breath=Math.sin(t*2.4);
 if(walking){bob=-Math.abs(s)*2.2;hem=s*3;tilt=s*.04;liftA=Math.max(0,s)*5;liftB=Math.max(0,-s)*5;stride=s*8;}
 else bob=breath*.55;
 let face=st.blink?'blink':'open',lx=0,ly=0;if(waving)face='happy';
 let rot=0,lying=false,hatLoose=false,magic=0;
 /* where the hat lands: beside the head, on the side he fell (front: to the right; side view: ahead of him) */
  if(falling&&side&&mt<FALL.drop)stride=8*Math.sin(clamp01(mt/.18)*Math.PI/2); /* the caught foot stays behind */
  if(falling){rot=fallRot(mt);lying=mt>=FALL.drop&&mt<FALL.up;hatLoose=hasHat()&&mt>=FALL.land&&mt<FALL.float;
  if(mt<FALL.stumble)face='open';else if(lying)face='dizzy';
  else if(mt>=FALL.up&&mt<FALL.float){face='look';const k=clamp01((mt-FALL.stare)/(FALL.float-FALL.stare));lx=side?-1.1:1.3;ly=lerp(1.3,-1.4,k);tilt=(side?-.07:.07)*(1-k);}
  else if(mt>=FALL.float)face='happy';
  if(mt>=FALL.stare&&mt<FALL.float+.15)magic=1;}
 /* emotes: front view only (he turns to face you first) */
 const em=v==='down'&&EMO_FRONT.includes(mode)&&mode!=='zap'?mode:null;
 let sayX=50,jumpY=0,flare=0,headDy=0,hatPop=null,glowOv=null,tiltOv=null,fAo=null,sAo=null,say=null,fly=null;
 const env=(a,b,fin,fout)=>smooth(clamp01((mt-a)/fin))*(1-smooth(clamp01((mt-b)/fout)));
 if(em==='cheer'){const r=env(0,1.35,.18,.4);sAo=geomArm(62,66,lerp(.75,2.75,r)+(mt<1.3?Math.sin(mt*14)*.14*r:0),lerp(.35,3.05,r),15,13);
  jumpY=mt<1.05?-Math.abs(Math.sin(mt*9))*4:0;face='happy';glowOv=1;tiltOv=0;if(mt>.2&&mt<1.55)say='Yes!';}
 if(em==='oops'){const r=env(0,1.9,.25,.35);fAo=geomArm(38,66,lerp(-.45,-2.2,r),lerp(-.15,2.55+Math.sin(mt*22)*.16,r),15,13);
  tilt=.12*r;face='look';lx=-1*r;ly=-1.5*r;}
 if(em==='level'){const jk=clamp01((mt-.25)/.55),inAir=mt>=.25&&mt<.8;
  bob+=mt<.25?3*smooth(mt/.25):mt>=.8&&mt<1?2*Math.sin((mt-.8)/.2*Math.PI):0;jumpY=inAir?-Math.sin(jk*Math.PI)*24:0;flare=inAir?Math.sin(jk*Math.PI)*10:0;
  const r=env(.2,1.7,.12,.35);fAo=geomArm(38,66,lerp(-.45,-2.6,r),lerp(-.15,-2.95,r),15,13);sAo=geomArm(62,66,lerp(.75,2.7,r),lerp(.35,3.05,r),15,13);
  face=inAir?'wow':'happy';glowOv=1;tiltOv=0;if(mt>.9&&mt<2.3)say='Level up!';}
 if(em==='sneeze'){if(mt<.85){tilt=-.15*smooth(mt/.85);if(mt>.3)face='ah';}
  else if(mt<1.1){tilt=lerp(-.15,.2,smooth(clamp01((mt-.85)/.08)));face='ah';bob+=2;}
  else{tilt=.2*(1-smooth(clamp01((mt-1.1)/.4)));face=mt>2.75?'happy':'open';if(mt>1.85&&mt<2.75)ly=-1.4;}
  /* the helmet shoots straight up, drops back on a little crooked, and he reaches up and straightens it */
  if(hasHat()&&mt>.88&&mt<2.6){const k=clamp01((mt-.88)/.72),land=smooth(clamp01((k-.8)/.2)),fix=smooth(clamp01((mt-2.15)/.4));
   hatPop={dy:-Math.sin(k*Math.PI)*40,dx:-4*land*(1-fix),r:-.36*land*(1-fix)+(mt>2.15&&mt<2.55?Math.sin(mt*40)*.04:0)};}
  const reach=env(1.8,2.6,.3,.3);fAo=geomArm(38,66,lerp(-.45,-2.4,reach),lerp(-.15,2.86,reach),15,13);
  if(mt>.88&&mt<1.75){say='ACHOO!';sayX=92;}}
 if(em==='fly'){let bx,by;
  if(mt<1.8){const e=smooth(mt/1.8);bx=lerp(-34,50,e);by=lerp(6,17,e)-Math.sin(e*Math.PI*3)*9;}
  else if(mt<3.6){bx=50;by=17+bob;}
  else{const e=smooth(clamp01((mt-3.6)/1.5));bx=lerp(50,150,e);by=lerp(17,-34,e)+Math.sin(e*Math.PI*3)*8;}
  fly={x:bx,y:by,perched:mt>=1.8&&mt<3.6};
  if(fly.perched)face=mt>2.1?'cross':'open';else{lx=Math.max(-1.4,Math.min(1.4,(bx-50)/22));ly=Math.max(-1.6,Math.min(1.3,(by-47)/22));}
  tilt=lx*.05;if(mt>4.4)face='happy';}
 if(em==='snack'){const P0=[-.45,-.15],PP=[-.1,.3],PM=[-.3,2.7];let a;
  if(mt<.45){const k=smooth(mt/.45);a=[lerp(P0[0],PP[0],k),lerp(P0[1],PP[1],k)];}
  else if(mt<.9){const k=smooth((mt-.45)/.45);a=[lerp(PP[0],PM[0],k),lerp(PP[1],PM[1],k)];}
  else if(mt<2.75){const nb=[1.2,1.8,2.4].map(tb=>Math.max(0,1-Math.abs(mt-tb)/.12)).reduce((x,y)=>x+y,0);a=[PM[0],PM[1]+nb*.12];}
  else{const k=smooth(clamp01((mt-2.75)/.45));a=[lerp(PM[0],P0[0],k),lerp(PM[1],P0[1],k)];}
  fAo=geomArm(38,66,a[0],a[1],15,13);
  face=mt<.9?'open':mt<1.2?'wow':mt<2.75?(Math.sin(mt*16)>0?'chewA':'chewB'):'happy';if(mt>2.75&&mt<3.45)say='Yum!';}
 if(em==='doze'){const r=mt<4.3?smooth(clamp01(mt/.8)):0;headDy=3*r;tilt=(.1+Math.sin(t*1.1)*.03)*r;bob=Math.sin(t*1.4)*1.2*r+bob*(1-r);
  sAo=geomArm(62,66,lerp(.75,.55,r),lerp(.35,.15,r),15,13);glowOv=mt<4.3?(1-r)*.5:1;tiltOv=.2*r;
  if(mt>.6&&mt<4.3)face='sleep';else if(mt>=4.3&&mt<4.9){face='wow';jumpY=-Math.sin(clamp01((mt-4.3)/.3)*Math.PI)*7;}}
 let rsc=0;if(mode==='rescue'){rsc=env(0,1.45,.4,.45);face=mt<1.7?'open':'happy';if(mt<1.7)ly=-.6;glowOv=mt>=.4&&mt<1.15?1:null;
  if(!side){sAo=geomArm(62,66,lerp(.75,2.75,rsc),lerp(.35,3.05,rsc),15,13);tiltOv=0;}
  if(mt>2&&mt<4.1)say='Phew! That was a close one!';}
 if(!say&&st.say)say=st.say;
 if(em==='startled'){face='wow';ly=-.4;jumpY=mt<.35?-Math.sin(mt/.35*Math.PI)*10:0;const r=env(0,1.5,.12,.35);fAo=geomArm(38,66,lerp(-.45,-2.2,r),lerp(-.15,-2.7,r),15,13);sAo=geomArm(62,66,lerp(.75,1.6,r),lerp(.35,1.1,r),15,13);tiltOv=.25*r;}
 if(em==='thanks'){face='happy';if(mt<1.35)say=st.say||'Thanks!';}
 /* a fall where the pet fetches the helmet: no staff magic, he waits for it and says thanks */
 if(falling&&st.fetch){const F=st.fetch;hatLoose=hasHat()&&mt>=FALL.land&&!F.back;magic=0;
  if(mt>=FALL.up){face=F.back?'happy':'open';lx=0;ly=F.back?0:-1.3;tilt=0;}if(F.back&&mt-F.backAt<1.3)say='Thanks!';}
 const shock=zapping&&mt>=ZAP.raise&&mt<ZAP.bolt+.1;if(zapping&&mt>=ZAP.raise){face='wow';ly=-1;}
 c.save();
 /* shadow (stays on the ground) */
 const hop=walking?Math.abs(s)*5:0;
 if(!st.noShadow){c.globalAlpha=.22;c.fillStyle='#000';c.beginPath();c.ellipse(50+(falling?(side?-1:1)*Math.sin(rot)*30:0),125,30*(1+(falling?Math.sin(rot)*.6:0))*(1-hop*.03),4,0,0,Math.PI*2);c.fill();c.globalAlpha=1;}
 if(mirror){c.translate(100,0);c.scale(-1,1);}
 if(shock)c.translate(Math.sin(mt*97)*1.8,Math.cos(mt*83)*1.2);
 if(falling&&side)c.translate(0,-fallLift(mt));
 const dirSign=side?-1:1; /* side views fall forward (left before mirroring); front and back topple to one side */
 let orb=null;
 c.save();
 c.translate(50,124);c.rotate(dirSign*rot);c.translate(-50,-124);
 c.translate(0,-hop);
 if(falling&&side){const b=fallBend(mt);c.translate(0,92);c.transform(1,0,b,1,0,0);c.translate(0,-92);} /* lean the top forward and the legs back from the waist */
 const swirl=Math.sin(t*9);
 if(!side){
  /* ----- front / back ----- */
  c.translate(0,jumpY);
  const yk=st.yk!==undefined?st.yk:0;
  if(yk>0&&!back){const k=smooth(clamp01(yk)),br=Math.sin(t*1.1)*.9*k,D=18*k-br,hw=15*k,sk=smooth(clamp01(yk*1.5));
   /* the staff goes from his hand down to the ground beside him */
   orb=drawStaff(c,lerp(63,84,sk),lerp(91,88,sk)-Math.sin(sk*Math.PI)*5,lerp(0,.05,sk),.15); /* planted upright in the ground beside him */
   const rf=robeFill(c,24,57+D,76,128);
   if(k<.6){c.globalAlpha=1-k/.6;fs(c,ell(lerp(43,47,k),123,6.2,3.6),BOOT,2);fs(c,ell(lerp(57,53,k),123,6.2,3.6),BOOT,2);c.globalAlpha=1;}
   if(!look.boy){c.save();c.translate(0,D);hairLocks(c,t,0,look.hair);c.restore();}
   const cl=flowPath(39,61,18-hw*1.2,82+hw*1.2,63+D,123,t,.7,1.4,0,.35);fs(c,cl,rf,2.4);fs(c,cl,'rgba(0,0,0,.32)',0);
   fs(c,flowPath(36,64,24-hw,76+hw,62+D,122,t,.5,1.4,0,.42),rf,2.5);
   /* crossed boots peeking out at the front */
   /* lotus: shins crossed in front, each boot resting on the other thigh */
   if(k>.45){c.globalAlpha=clamp01((k-.45)*3);c.lineCap='round';const shin=(x0,y0,x1,y1)=>{c.strokeStyle=INK;c.lineWidth=13.5;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.strokeStyle=rf;c.lineWidth=10;c.stroke();};
    shin(23,114,58,105);c.save();c.translate(61,103);c.rotate(-.3);fs(c,ell(0,0,6.4,3.6),BOOT,1.8);c.restore();
    shin(77,114,42,105);c.save();c.translate(39,103);c.rotate(.3);fs(c,ell(0,0,6.4,3.6),BOOT,1.8);c.restore();c.globalAlpha=1;}
   c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=2;c.beginPath();c.moveTo(44,61+D);c.lineTo(50,78+D);c.lineTo(56,61+D);c.stroke();
   const belt=new Path2D();belt.roundRect(30,92+D,40,6,3);fs(c,belt,'rgba(0,0,0,.25)',0);fs(c,ell(50,95+D,3.6,3.6),'#ffc83d',1.5);
   const fA2=geomArm(38,66+D,lerp(-.45,-.55,k),lerp(-.15,-.15,k),15,13),sA2=geomArm(62,66+D,lerp(.75,.55,k),lerp(.35,.15,k),15,13);
   drawArm(c,fA2,rf);drawArm(c,sA2,rf);cuff(c,fA2,rf);cuff(c,sA2,rf);fs(c,ell(fA2.hx,fA2.hy,5,5),look.skin,2);fs(c,ell(sA2.hx,sA2.hy,5,5),look.skin,2);
   c.save();c.translate(0,D);drawHead(c,'front',k>.55?'calm':face,{lx:0,ly:0});c.restore();
  }else{
  let fA=geomArm(38,66,-.45,-.15,15,13),sA=geomArm(62,66,.75,.35,15,13);
  if(walking){fA=geomArm(38,66,-.4+s*.25,-.2+s*.35,15,13);sA=geomArm(62,66,.72-s*.12,.32-s*.1,15,13);}
  if(waving){const w=Math.sin(mt*14)*.45;fA=geomArm(38,66,-2.55,-2.95+w,15,13);}
  if(falling&&mt<FALL.lie){fA=geomArm(38,66,-2.1+Math.sin(mt*30)*.3,-2.6,15,13);sA=geomArm(62,66,2.0,2.5,15,13);}
  if(magic)sA=geomArm(62,66,2.35+swirl*.35,2.7+Math.sin(t*9+.7)*.4,15,13);
  if(fAo)fA=fAo;if(sAo)sA=sAo;
  c.translate(0,bob);
  const staffTilt=tiltOv!=null?tiltOv:magic?swirl*.35:zapping?0:walking?-s*.08:(falling&&mt<FALL.up?.5:0);
  orb=drawStaff(c,sA.hx+1,sA.hy,staffTilt,glowOv!=null?glowOv:magic||zapping?1:(Math.sin(t*3)+1)/2);
  /* feet under the robe */
  fs(c,ell(43,123-bob-liftA,6.2,3.6),back?BOOT2:BOOT,2);fs(c,ell(57,123-bob-liftB,6.2,3.6),back?BOOT2:BOOT,2);
  const rf=robeFill(c,24,57,76,128);
  const amp=walking?2.6:1.1,spd=walking?7:2.6,flut=walking?Math.sin(t*6)*3:Math.sin(t*1.8)*1.4;
  if(!look.boy&&!back)hairLocks(c,t,mode==='walk'?Math.sin(p):0,look.hair); /* her long locks fall behind her shoulders */
  if(!back){const cl=flowPath(39,61,18+hem*1.3-flut-flare*1.3,82+hem*1.3+flut+flare*1.3,63,123,t,amp*1.4,spd,hem*.6,.35);fs(c,cl,rf,2.4);fs(c,cl,'rgba(0,0,0,.32)',0);}
  fs(c,flowPath(36,64,24+hem-flare,76+hem+flare,62,122,t,amp,spd,hem*.5,.42),rf,2.5);
  if(!back){c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=2;c.beginPath();c.moveTo(44,61);c.lineTo(50,78);c.lineTo(56,61);c.stroke();}
  else{const cl=flowPath(38,62,22+hem*1.2-flut,78+hem*1.2+flut,62,124,t,amp*1.4,spd,hem*.6,.35);fs(c,cl,rf,2.4);fs(c,cl,'rgba(0,0,0,.16)',0);
   c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=2;[[44,-1],[50,0],[56,1]].forEach(([x,k])=>{c.beginPath();c.moveTo(x,66);c.quadraticCurveTo(x+k*4+hem*.4,95,x+k*8+hem*.8,121);c.stroke();});}
  const belt=new Path2D();belt.roundRect(30,92,40,6,3);fs(c,belt,'rgba(0,0,0,.25)',0);if(!back)fs(c,ell(50,95,3.6,3.6),'#ffc83d',1.5);
  drawArm(c,fA,rf);drawArm(c,sA,rf);cuff(c,fA,rf);cuff(c,sA,rf);fs(c,ell(fA.hx,fA.hy,5,5),look.skin,2);fs(c,ell(sA.hx,sA.hy,5,5),look.skin,2);
  c.save();c.translate(0,headDy);c.translate(50,60);c.rotate(tilt);c.translate(-50,-60);drawHead(c,back?'back':'front',face,{noHat:hatLoose||!!hatPop,lx,ly});c.restore();
  if(hatPop){c.save();c.translate(hatPop.dx||0,hatPop.dy);c.translate(50,40);c.rotate(hatPop.r);c.translate(-50,-40);drawHat(c,'front');c.restore();}
  if(lying&&mt>FALL.land)dizzy(c,50,24,mt);
  if(em)emoteFx(c,em,mt,t,fA,orb,fly);
  } /* end of the standing pose */
 }else{
  /* ----- side, facing left ----- */
  /* the staff is in his left hand: facing left that hand is nearest us (staff in front), facing right it is the far hand (staff behind) */
  const staffNear=v==='left',sx0=staffNear?47:53,fx0=staffNear?53:47,sg=staffNear?1:-1;
  let sArm=geomArm(sx0,66,-.15,-.75,15,13),fArm=geomArm(fx0,66,.12,0,15,13); /* staff arm: elbow bent forward */
  if(walking){sArm=geomArm(sx0,66,-.15+sg*s*.22,-.75+sg*s*.18,15,13);fArm=geomArm(fx0,66,-sg*s*.55,-sg*s*.55-.3,15,13);}
  if(waving){const w=Math.sin(mt*14)*.45;fArm=geomArm(fx0,66,-2.75,-3.05+w,15,13);}
  if(falling&&mt<FALL.lie){fArm=geomArm(fx0,66,-2.4+Math.sin(mt*30)*.3,-2.9,15,13);sArm=geomArm(sx0,66,-2.0,-2.6,15,13);}
  if(magic)sArm=geomArm(sx0,66,-2.35-swirl*.35,-2.7-Math.sin(t*9+.7)*.4,15,13);
  if(rsc>0)sArm=geomArm(sx0,66,lerp(-.55,-2.1,rsc),lerp(-.15,-2.5,rsc),15,13); /* staff pointed at the water */
  const far=staffNear?fArm:sArm,near=staffNear?sArm:fArm;
  const staffNow=()=>drawStaff(c,sArm.hx-1,sArm.hy,rsc>0?-.6*rsc:magic?-swirl*.35:zapping?0:walking?-.12-sg*s*.1:(falling&&mt<FALL.up?-.5:-.06),magic||zapping?1:(Math.sin(t*3)+1)/2);
  c.translate(0,bob);
  const rf=robeFill(c,30,57,70,128);
  const amp=walking?2.6:1.1,spd=walking?7:2.6,trail=walking?11+Math.sin(t*7)*3:3+Math.sin(t*1.8)*1.5;
  {let d=`M47 62 Q58 58 61 64 Q${64+trail*.55} 92 ${66+trail} ${118-trail*.25}`;{let px=66+trail,py=118-trail*.25;for(let k=1;k<=6;k++){const x=66+trail-(k/6)*(22+trail),y=118-trail*.25*(1-k/6)+4*(k/6)+amp*1.2*Math.sin(x*.18+t*spd);d+=` Q${((px+x)/2).toFixed(1)} ${((py+y)/2+1.6).toFixed(2)} ${x.toFixed(1)} ${y.toFixed(2)}`;px=x;py=y;}}
   const cl=new Path2D(d+' L44 122 Z');fs(c,cl,rf,2.4);fs(c,cl,'rgba(0,0,0,.32)',0);}
  /* far foot and far arm behind the body (with the staff when it is the far hand) */
  fs(c,ell(48-stride,123-bob-Math.max(0,Math.cos(p))*(walking?4:0),7,3.4),BOOT2,2);
  if(!staffNear)orb=staffNow();
  if((magic||rsc>0)&&!staffNear){drawArm(c,far,rf,true);cuff(c,far,rf);fs(c,ell(far.hx,far.hy,5,5),look.skin,2);fs(c,ell(far.hx,far.hy,5,5),'rgba(0,0,0,.18)',0);} /* the far arm stays hidden behind him, except lifting the staff for magic */
  fs(c,ell(48+stride,123-bob-Math.max(0,-Math.cos(p))*(walking?4:0),7,3.4),BOOT,2);
  fs(c,flowPath(41,59,31+hem,66+hem+(walking?3:0),62,122,t,amp,spd,hem*.5,.42),rf,2.5);
  c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=2;c.beginPath();c.moveTo(43,62);c.lineTo(46,74);c.stroke();
  const belt=new Path2D();belt.roundRect(36,92,28,6,3);fs(c,belt,'rgba(0,0,0,.25)',0);fs(c,ell(39.5,95,3,3),'#ffc83d',1.5);
  if(staffNear)orb=staffNow();
  drawArm(c,near,rf);cuff(c,near,rf);fs(c,ell(near.hx,near.hy,5,5),look.skin,2);
  c.save();c.translate(50,60);c.rotate(tilt);c.translate(-50,-60);drawHead(c,'side',face,{noHat:hatLoose,lx,ly});c.restore();
  if(lying&&mt>FALL.land)dizzy(c,50,24,mt);
 }
 c.restore(); /* end of the fall rotation */
 /* the loose hat: on the ground, then floating back up in an arc onto his head */
 if(hatLoose&&!(st.fetch&&st.fetch.held)){const view=back?'back':side?'side':'front';let k=0;if(!st.fetch&&mt>=FALL.stare+.35)k=smooth(clamp01((mt-FALL.stare-.35)/(FALL.float-FALL.stare-.35)));
  const rl=hatRoll(mt,dirSign);let dx=rl.dx,dy=rl.dy,r=rl.r;
  if(k>0){const up=smooth(clamp01(k/.45)),over=smooth(clamp01((k-.35)/.4)),down=smooth(clamp01((k-.75)/.25));
   dx=lerp(rl.dx,0,over);dy=lerp(lerp(rl.dy,bob-30,up),bob,down);r=lerp(rl.r,0,smooth(clamp01((k-.2)/.6)))+Math.sin(t*10)*.12*(k<1?1:0);}
  if(k>0&&k<1){for(let i=0;i<5;i++){const a=t*7+i*1.26;star(c,50+dx+Math.cos(a)*20,36+dy+Math.sin(a)*8,2.6,i%2?'#fff3bf':'#b197fc');}}
  c.save();c.translate(dx,dy);c.translate(50,40);c.rotate(r);c.translate(-50,-40);drawHat(c,view);c.restore();}
 /* sparkles from the staff while he does magic */
 if(magic&&orb){for(let i=0;i<6;i++){const a=t*6+i;star(c,orb[0]+Math.cos(a)*12,orb[1]+Math.sin(a)*12,2.4,i%2?'#ffe066':'#ffffff');}}
 /* lightning straight up from the staff */
 if(zapping&&orb&&mt>=ZAP.raise&&mt<ZAP.bolt){const seed=Math.floor(mt*24);bolt(c,orb[0],orb[1]-6,seed);}
 if(shock){const n=Math.floor(mt*20);for(let i=0;i<4;i++){const a=n*2.4+i*1.7;star(c,50+Math.cos(a)*24,80+Math.sin(a*1.3)*36,2.6,i%2?'#bfe9ff':'#fffbe6');}}
 c.restore();
 /* the speech bubble, never mirrored */
 if(zapping&&mt>=ZAP.say0&&mt<ZAP.say1)bubble(c,'What was that?',50,4);
 if(say)bubble(c,say,sayX,(sayX===50?4:30)+jumpY);
 return orb?[mirror?100-orb[0]:orb[0],orb[1]+bob]:null;}
/* what each emote adds around him: confetti, a question mark, a gold burst, the butterfly, the apple and crumbs, Zzz */
const CONF=['#ff6b6b','#ffd43b','#51cf66','#4dabf7','#cc5de8','#ff922b'];
function emoteFx(c,em,mt,t,fA,orb,fly){
 if(em==='startled'&&mt<1.5){c.save();c.font='800 22px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#fff';const y=10-Math.min(1,mt*4)*4;c.strokeText('!',74,y);c.fillStyle='#f03e3e';c.fillText('!',74,y);c.restore();}
 if(em==='cheer'&&orb&&mt>.15){const k=mt-.15;for(let i=0;i<14;i++){const a=-Math.PI/2+(i/13-.5)*2.6,sp=60+(i*37%5)*14;
   const x=orb[0]+Math.cos(a)*sp*k,y=orb[1]+Math.sin(a)*sp*k+70*k*k;c.save();c.globalAlpha=Math.max(0,1-k/1.6);c.translate(x,y);c.rotate(k*8+i);c.fillStyle=CONF[i%6];c.fillRect(-2.2,-1.2,4.4,2.4);c.restore();}}
 if(em==='oops'&&mt>.2&&mt<2.15){c.save();c.globalAlpha=Math.min(1,(mt-.2)/.2,(2.15-mt)/.25);c.font='800 22px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';
   c.lineWidth=4;c.strokeStyle='#fff';const y=12+Math.sin(mt*5)*2.5;c.strokeText('?',72,y);c.fillStyle='#7048e8';c.fillText('?',72,y);c.restore();}
 if(em==='level'&&mt>.8&&mt<1.7){const k=(mt-.8)/.9;c.save();c.globalAlpha=1-k;c.strokeStyle='#ffd43b';c.lineWidth=5*(1-k)+1;c.beginPath();c.ellipse(50,90,14+k*60,6+k*22,0,0,Math.PI*2);c.stroke();
   for(let i=0;i<8;i++){const a=i*Math.PI/4+.3;star(c,50+Math.cos(a)*(16+k*55),70+Math.sin(a)*(10+k*40),4,i%2?'#ffd43b':'#fff3bf');}c.restore();}
 if(em==='fly'&&fly){const flap=fly.perched?.35+.65*Math.abs(Math.sin(t*3)):.15+.85*Math.abs(Math.sin(t*22));c.save();c.translate(fly.x,fly.y);
   [[-1,'#ff8fc0'],[1,'#ff8fc0']].forEach(([sd,col])=>{fs(c,ell(sd*5.5*flap,-2.5,5.5*flap+.4,4.6),col,1.3);fs(c,ell(sd*4*flap,3,3.8*flap+.4,3),'#b197fc',1.3);});
   fs(c,ell(0,0,1.3,5),INK,0);c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(-.5,-4.5);c.quadraticCurveTo(-2,-8,-3.5,-9);c.moveTo(.5,-4.5);c.quadraticCurveTo(2,-8,3.5,-9);c.stroke();c.restore();}
 if(em==='snack'){if(mt>.4&&mt<2.4){const bites=[1.2,1.8,2.4].filter(tb=>mt>tb).length,ax=fA.hx+1,ay=fA.hy-5;c.save();
    c.beginPath();c.rect(ax-20,ay-24,40,44);[[6,-3,5.2],[-6,-2,6]].slice(0,bites).forEach(([bx,by,br])=>{c.moveTo(ax+bx+br,ay+by);c.arc(ax+bx,ay+by,br,0,Math.PI*2);});c.clip('evenodd');
    fs(c,ell(ax,ay-2,8,7.4),'#ef4444',2);fs(c,ell(ax-3,ay-5,2,1.4),'rgba(255,255,255,.6)',0);c.restore();
    c.strokeStyle='#6b4226';c.lineWidth=1.8;c.beginPath();c.moveTo(ax,ay-9);c.lineTo(ax+1,ay-13);c.stroke();fs(c,ell(ax+4,ay-12,3,1.5),'#51cf66',1);}
  [1.2,1.8,2.4].forEach(tb=>{const k=mt-tb;if(k<0||k>.7)return;for(let i=0;i<4;i++){fs(c,ell(48+(i-1.5)*3+k*(i-1.5)*8,58+k*30+130*k*k,1.1,1.1),'#f3d9a4',0);}});}
 if(em==='doze'){if(mt>.9&&mt<4.3){c.save();c.font='800 12px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';for(let i=0;i<3;i++){const q=((mt-.9)*.55+i/3)%1;
    c.globalAlpha=Math.min(1,(1-q)*1.5)*Math.min(1,(mt-.9)*2);c.font='800 '+(9+q*8).toFixed(1)+'px Fredoka, Trebuchet MS, sans-serif';c.lineWidth=3;c.strokeStyle='#fff';c.strokeText('z',64+q*20,36-q*32);c.fillStyle='#5c7cfa';c.fillText('z',64+q*20,36-q*32);}c.restore();}
  if(mt>4.3&&mt<5.1){c.save();c.font='800 22px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#fff';c.strokeText('!',70,12);c.fillStyle='#f03e3e';c.fillText('!',70,12);c.restore();}}}
/* lightning: a jagged white-hot line with a blue glow and two short branches */
function bolt(c,x,y,seed){let r=seed*9301+49297;const rnd=()=>((r=(r*9301+49297)%233280)/233280);
 const pts=[[x,y]];let cx=x,cy=y;for(let i=0;i<10;i++){cx+=(rnd()-.5)*18;cy-=26;pts.push([cx,cy]);}
 const line=(ps,w,col)=>{c.beginPath();ps.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();};
 c.save();c.shadowColor='#7fd3ff';c.shadowBlur=SHADOWS?18:0;line(pts,7,'rgba(127,211,255,.7)');c.shadowBlur=0;line(pts,3,'#fffbe6');
 [3,6].forEach(i=>{const [bx,by]=pts[i];const br=[[bx,by],[bx+(rnd()-.3)*30,by-14],[bx+(rnd()-.3)*44,by-30]];line(br,3,'rgba(127,211,255,.7)');line(br,1.5,'#fffbe6');});c.restore();}
/* a comic speech bubble centred on (x, y): the tail points down at the hero */
function bubble(c,text,x,y,fz,tc){fz=(fz||13)*BUBK;c.save();c.font='700 '+fz+'px Fredoka, Trebuchet MS, sans-serif';const w=c.measureText(text).width+fz*1.3,h=Math.round(fz*1.8),bx=x-w/2,by=y-h-8;
 const b=new Path2D();b.roundRect(bx,by,w,h,10);b.moveTo(x-6,by+h);b.lineTo(x,by+h+8);b.lineTo(x+6,by+h);
 c.fillStyle='#fff';c.fill(b);c.strokeStyle=INK;c.lineWidth=2;c.stroke(b);c.fillStyle='#fff';c.fillRect(x-5,by+h-2,10,3);
 c.fillStyle=tc||INK;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,by+h/2+1);c.restore();}
/* the helmet pops off when his head hits the ground, hops a short way, turns upright in the air and lands on its brim with a little bounce.
   Returns its offset and turn relative to where it sits on his head, turning about the middle of the dome (50,40). dir = the way he fell. */
function hatRoll(mt,dir){const a0=1.52,dx0=Math.sin(a0)*84,dy0=84-Math.cos(a0)*84,rest=84,t1=FALL.land,t2=t1+.38,t3=t2+.3;
 if(mt<t2){const k=clamp01((mt-t1)/(t2-t1));return {dx:dir*(dx0+12*k),dy:lerp(dy0,rest,k)-Math.sin(k*Math.PI)*18,r:dir*a0*(1-smooth(k))};}
 const k=clamp01((mt-t2)/(t3-t2));return {dx:dir*(dx0+12),dy:rest-Math.abs(Math.sin(k*Math.PI))*4*(1-k),r:0};}
function dizzy(c,x,y,mt){for(let i=0;i<3;i++){const a=mt*5+i*2.09;star(c,x+Math.cos(a)*16,y+Math.sin(a)*5,4,'#ffe066');}}


/* ---------- on the map ---------- */
/* M: his state on the map. Walking comes from the map's own steps (W.mt is when the last step started, W.fx/W.fy where it came from). */
const M={view:'down',mode:'idle',phase:0,t:0,mt:0,idle:0,still:0,blinkT:0,blinkAt:2,parts:[],last:0,lastStep:0,dozed:false,next:6};
const IDLE_PICK=['wave','wave','wave','sneeze','fly','snack'];
function setMode(m){if(M.mode!==m){M.mode=m;M.mt=0;}}
function emote(m,say){if(M.mode==='walk'||EMO[m]===undefined&&m!=='wave')return false;M.view='down';setMode(m);M.idle=0;M.say=say||null;try{if(window.PetPuppet)PetPuppet.react(m);}catch(e){}return true;} /* the pet reacts to the big moments */
/* pets.js: startled when a shark takes the pet, then the rescue zap facing the water (works even mid-step) */
function force(m,view){M.view=view||'down';M.mode=m;M.mt=0;M.idle=0;M.say=null;}
function dust(W,dx,dy){const x=W.drawX+.5-dx*.25,y=W.drawY+.9-dy*.15;
 for(let i=0;i<6;i++)M.parts.push({x:x+(Math.random()-.5)*.3,y:y+(Math.random()-.5)*.08,vx:-dx*.3+(Math.random()-.5)*.3,vy:-dy*.17-.12-Math.random()*.12,life:.45+Math.random()*.25,t:0,r:.042+Math.random()*.046});}
function update(dt,now,W){M.t+=dt;M.mt+=dt;
 M.blinkT-=dt;if(M.blinkT<=0&&M.t>M.blinkAt){M.blinkT=.13;M.blinkAt=M.t+2.2+Math.random()*2.5;}
 const walking=!!W.mt&&now-W.mt<210;
 if(walking){const dx=W.hx-(W.fx==null?W.hx:W.fx),dy=W.hy-(W.fy==null?W.hy:W.fy);
  if(dx||dy)M.view=dx<0?'left':dx>0?'right':dy<0?'up':'down';
  if(M.mode!=='walk')setMode('walk');M.idle=0;M.still=0;M.dozed=false;
  M.phase+=dt*Math.PI/.15; /* one footfall per square */
  const step=Math.floor(M.phase/Math.PI);if(step!==M.lastStep){M.lastStep=step;const D={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]}[M.view];dust(W,D[0],D[1]);}}
 else if(M.mode==='walk'){setMode('idle');M.idle=0;}
 else if(M.mode==='wave'||EMO[M.mode]){const len=M.mode==='wave'?2.4:EMO[M.mode].len;if(M.mt>len){setMode('idle');M.idle=0;}}
 else{M.idle+=dt;M.still+=dt;if(M.idle>2.5&&M.view!=='down')M.view='down'; /* stood still a while: turn and face you */
  const busy=(window.PetPuppet&&PetPuppet.away&&PetPuppet.away())||window.__heroLock||window.trollBusy||(typeof curScreen!=='undefined'&&curScreen!=='world')||document.querySelector('#modal.show');
  if(busy){M.idle=Math.min(M.idle,3);}
  else if(M.still>30&&!M.dozed){M.dozed=true;emote('doze');} /* left alone a long time: he nods off */
  else if(M.idle>M.next&&M.view==='down'){M.next=7+Math.random()*7;emote(IDLE_PICK[Math.floor(Math.random()*IDLE_PICK.length)]);}}
 M.parts=M.parts.filter(q=>(q.t+=dt)<q.life);M.parts.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=.25*dt;q.vx*=1-2*dt;});}
/* draws him standing on the square whose top-left corner is (sx,sy) on screen, ts pixels wide, the same size and spot as the old picture */
function mapDraw(ctx,sx,sy,ts,now,p,W){const dt=Math.min(.1,M.last?(now-M.last)/1000:0);M.last=now;
 setLook(p&&p.look,p&&p.spell);update(dt,now,W);
 const ox=sx-W.drawX*ts,oy=sy-W.drawY*ts; /* the camera, so dust stays where it was kicked up */
 M.parts.forEach(q=>{const a=1-q.t/q.life;ctx.fillStyle='rgba(222,205,170,'+(.55*a).toFixed(3)+')';ctx.beginPath();ctx.arc(ox+q.x*ts,oy+q.y*ts,q.r*ts*(1+q.t/q.life*.8),0,7);ctx.fill();});
 const h=ts*1.35,k=h/130;BUBK=Math.max(1,12/(13*k));SHADOWS=ts>=30;
 ctx.save();ctx.translate(sx+ts/2-50*k,sy+ts*.95-h);ctx.scale(k,k);
 const o=drawHero(ctx,{view:M.view,mode:M.mode,phase:M.phase,t:M.t,mt:M.mt,blink:M.blinkT>0,noShadow:true,say:M.mode==='thanks'?M.say:null});
 M.orbT=o?[W.drawX+.5+(o[0]-50)*k/ts,W.drawY+.95-1.35+o[1]*k/ts]:null; /* the staff's orb in map squares (the rescue bolt starts there) */
 ctx.restore();}
/* the picture at any size, for tests and other screens: draw(ctx, look, spell, {view, mode, t, mt, phase}) in the 100 x 130 frame */
function draw(ctx,lk,spell,st){setLook(lk,spell);BUBK=1;SHADOWS=true;return drawHero(ctx,Object.assign({view:'down',mode:'idle',t:0,mt:0,phase:0},st||{}));}
window.HeroPuppet={ok:true,mapDraw,draw,emote,force,state:()=>M,HATS_VIEWS:['down','left','right','up']};
})();
