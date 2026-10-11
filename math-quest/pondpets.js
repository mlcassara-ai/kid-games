/* pondpets.js — two more floating pets drawn in the same style as pets.js:
   Dottie, the giant largemouth bass of Dixon Lake, swimming inside a round water bubble, and a baby Spinosaurus;
   plus the Spinosaurus egg, the 8 fossil bones and the museum skeleton they build.
   Pets are centred on (0,0), about 92 units to a map square, side view facing left (the caller mirrors for right).
   o = {t, view:'front'|'side', mode, blink, happy, puff, lx, ly} — the same as drawPet in pets.js. */
(function(){
'use strict';
const INK='#2b2140';
function ell(cx,cy,rx,ry){const p=new Path2D();p.ellipse(cx,cy,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);return p;}
function fs(c,path,fill,w){c.fillStyle=fill;c.fill(path);if(w!==0){c.lineWidth=w||2.5;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';c.stroke(path);}}
function star(c,x,y,r,col){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=col;c.fill();c.lineWidth=1;c.strokeStyle=INK;c.stroke();}
function pEyes(c,pts,o,rx,ry){const lx=o.lx||0,ly=o.ly||0,big=o.puff?1.25:1;c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';
 pts.forEach(([x,y])=>{if(o.mode==='nap'||o.blink){c.beginPath();c.moveTo(x-rx,y);c.quadraticCurveTo(x,y+2,x+rx,y);c.stroke();}
  else if(o.happy){c.beginPath();c.moveTo(x-rx,y+1);c.quadraticCurveTo(x,y-3,x+rx,y+1);c.stroke();}
  else{fs(c,ell(x+lx*.6,y+ly*.6,rx*big,ry*big),INK,0);fs(c,ell(x+lx*.6+rx*.35,y+ly*.6-ry*.4,rx*.38,rx*.38),'#fff',0);}});}
function blush(c,pts){c.globalAlpha=.45;pts.forEach(([x,y])=>fs(c,ell(x,y,2.6,1.7),'#ff6f91',0));c.globalAlpha=1;}
function line(c,w,col,f){c.strokeStyle=col||INK;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();f();c.stroke();}
const awake=o=>o.mode!=='nap'&&!o.blink&&!o.happy;

/* ---------------- Dottie the largemouth bass, in her water bubble ---------------- */
const BASS='#6f8f2f',BASS_D='#56731f',BELLY='#f6efc0',FIN='#6a8a2a',BAND='rgba(40,55,15,.7)';
const BR=32; /* bubble radius */
function bubbleBack(c,t){const g=c.createRadialGradient(-8,-10,4,0,0,BR);g.addColorStop(0,'rgba(231,247,255,.55)');g.addColorStop(.75,'rgba(165,216,255,.45)');g.addColorStop(1,'rgba(116,192,252,.6)');
 c.fillStyle=g;c.beginPath();c.arc(0,0,BR,0,Math.PI*2);c.fill();
 /* a few weeds at the bottom of her bubble */
 c.save();c.beginPath();c.arc(0,0,BR-1,0,Math.PI*2);c.clip();
 c.fillStyle='rgba(77,171,247,.28)';c.fillRect(-BR,16,BR*2,BR);
 [[-18,1],[15,-1],[-8,-1]].forEach(([x,s],i)=>{const w=Math.sin(t*1.6+i)*2.5;line(c,2,'rgba(64,145,108,.55)',()=>{c.moveTo(x,BR);c.quadraticCurveTo(x+w+s*3,20,x+w*1.4,13+i*2);});});
 c.restore();}
function riseBubbles(c,t,nap){c.save();c.beginPath();c.arc(0,0,BR-2.5,0,Math.PI*2);c.clip();
 for(let i=0;i<3;i++){const sp=nap?4:8,k=((t*sp+i*14)%44),x=[-19,17,7][i]+Math.sin(t*2+i*2)*1.5,y=24-k,r=[1.6,1.2,2][i];
  c.globalAlpha=Math.min(1,k/6,(44-k)/6);c.fillStyle='rgba(255,255,255,.55)';c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=.8;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.stroke();}
 c.restore();c.globalAlpha=1;}
function bubbleFront(c,t){c.lineWidth=2.4;c.strokeStyle=INK;c.beginPath();c.arc(0,0,BR,0,Math.PI*2);c.stroke();
 c.globalAlpha=.55;c.strokeStyle='#d0ebff';c.lineWidth=1.6;c.beginPath();c.arc(0,0,BR-2.2,0,Math.PI*2);c.stroke();
 c.globalAlpha=.85;c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.arc(0,0,BR-5,3.55,4.45);c.stroke();
 fs(c,ell(-7.5,-24,1.8,1.8),'#fff',0);c.globalAlpha=1;}
/* sleepy little bubbles from her mouth */
function napBubbles(c,t,x,y){for(let i=0;i<3;i++){const k=(t*.5+i/3)%1;c.globalAlpha=Math.min(1,(1-k)*2);c.strokeStyle='#fff';c.lineWidth=1;c.fillStyle='rgba(255,255,255,.35)';
 c.beginPath();c.arc(x-k*4+Math.sin(k*9)*1.2,y-k*20,1+k*2.2,0,7);c.fill();c.stroke();}c.globalAlpha=1;}
function lashes(c,x,y,s){line(c,1.1,INK,()=>{c.moveTo(x+1*s,y-3);c.lineTo(x+2.2*s,y-5.4);c.moveTo(x+2.6*s,y-2.2);c.lineTo(x+4.4*s,y-3.8);c.moveTo(x+3.3*s,y-.6);c.lineTo(x+5.2*s,y-1.4);});}
function drawDottie(c,o){const t=o.t,nap=o.mode==='nap',sw=Math.sin(t*(nap?1.6:3.4));c.save();if(o.puff)c.scale(1.12,1.12);
 bubbleBack(c,t);
 c.save();c.beginPath();c.arc(0,0,BR-1.2,0,Math.PI*2);c.clip();
 const by=Math.sin(t*1.7)*1.4+(nap?2:0);c.translate(0,by);c.scale(.9,.9);
 if(o.view==='front'){
  /* tail peeking out behind, wagging */
  c.save();c.translate(0,4);c.rotate(sw*.25);fs(c,new Path2D('M0 0 Q14 -2 21 -9 Q19 0 22 9 Q14 4 0 4Z'),FIN,1.8);c.restore();
  /* dorsal fin (spiny, seen edge-on) */
  const df=new Path2D('M-4 -11 Q-4 -20 1 -23 Q4 -19 4 -11Z');fs(c,df,FIN,1.8);line(c,1,'rgba(40,55,15,.8)',()=>{c.moveTo(-1.5,-12);c.lineTo(-.5,-19);c.moveTo(1.5,-12);c.lineTo(2,-19);});
  /* pectoral fins at the sides, paddling */
  [[-1,-14],[1,14]].forEach(([s,x])=>{c.save();c.translate(x,6);c.rotate(s*(.35+Math.sin(t*4+(s>0?1:0))*.25));fs(c,new Path2D(`M0 0 Q${s*9} -3 ${s*10} 5 Q${s*5} 7 0 4Z`),FIN,1.6);c.restore();});
  const body=ell(0,2,17,15);fs(c,body,BASS,2.4);
  c.save();c.clip(body);fs(c,ell(0,-10,18,8),BASS_D,0);fs(c,ell(0,14,13,8),BELLY,0);
  c.fillStyle=BAND;[[-16,2,4,3],[-13,6,2.6,2],[16,2,4,3],[13,6,2.6,2]].forEach(([x,y,rx,ry])=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();});c.restore();
  c.globalAlpha=.4;fs(c,ell(-6,-7,5,2.4),'#fff',0);c.globalAlpha=1;
  /* the big largemouth */
  if(o.puff){fs(c,ell(0,8,4.2,4.6),'#5a2633',1.8);}
  else{const op=o.happy?5:2.4;fs(c,new Path2D(`M-12 5 Q0 ${5+op*1.6} 12 5 Q10 ${7+op*1.8} 0 ${8+op*2.1} Q-10 ${7+op*1.8} -12 5Z`),o.happy?'#c2414f':'#7a3a3f',1.8);
   if(o.happy)fs(c,ell(0,9.6+op,4,1.8),'#ff8fa3',0);
   line(c,1.6,INK,()=>{c.moveTo(-13,3.6);c.quadraticCurveTo(-13.6,5,-12,5.4);c.moveTo(13,3.6);c.quadraticCurveTo(13.6,5,12,5.4);});}
  pEyes(c,[[-8,-3],[8,-3]],o,3,3.5);
  if(awake(o)){lashes(c,-8,-3,-1);lashes(c,8,-3,1);}
  blush(c,[[-12.5,2],[12.5,2]]);
  if(nap)napBubbles(c,t,2,4);
 }else{
  /* side view, nose to the left */
  c.save();c.translate(15,1);c.rotate(sw*.28);fs(c,new Path2D('M-1 -3 Q6 -6 12 -12 Q14 -11 13.5 -8 Q11 0 13.5 9 Q14 12 12 12 Q6 6 -1 4Z'),FIN,1.8);c.restore();
  /* dorsal fin: spiny front, soft back */
  fs(c,new Path2D('M-8 -10 L-7 -17 L-4.5 -12.5 L-2.5 -19 L-.5 -13 L1.8 -18.5 L3.2 -13 L4.6 -16 Q10 -18 14 -8 L10 -6Z'),FIN,1.8);
  /* belly fins */
  fs(c,new Path2D('M4 8 Q8 16 13 13 Q12 9 11 6Z'),FIN,1.6);fs(c,new Path2D('M-7 9 Q-7 17 -2 15 Q-2 11 -1 9Z'),FIN,1.6);
  const body=new Path2D('M-23 1 Q-22 -8 -12 -11 Q2 -14.5 13 -7 Q17 -3.5 17 1 Q16.5 5.5 12 8 Q2 13.5 -10 11.5 Q-21 9.5 -23 1Z');
  fs(c,body,BASS,2.4);
  c.save();c.clip(body);fs(c,ell(0,-11,24,6.5),BASS_D,0);fs(c,ell(-4,11,19,6),BELLY,0);
  /* the blotchy dark stripe along her side */
  c.fillStyle=BAND;[[-7,1,3.2,2.2],[-2.5,2,3,2.6],[2,1,3.4,2.2],[6.5,2,3,2.6],[11,1,3,2.2],[15,1.2,2.4,2]].forEach(([x,y,rx,ry],i)=>{c.beginPath();c.ellipse(x,y,rx,ry,i*.5,0,7);c.fill();});
  c.restore();
  c.globalAlpha=.4;fs(c,ell(-9,-7,6,2.2),'#fff',0);c.globalAlpha=1;
  /* gill cover */
  line(c,1.4,INK,()=>{c.moveTo(-8.5,-7);c.quadraticCurveTo(-4.5,0,-8,8);});
  /* pectoral fin, flapping */
  c.save();c.translate(-4,3);c.rotate(-.2+Math.sin(t*4)*.3);fs(c,new Path2D('M0 0 Q6 -4 9 1 Q6 5 0 3Z'),FIN,1.5);c.restore();
  /* the big bass mouth: a long jaw running back under the eye, lower lip sticking out */
  if(o.puff){fs(c,ell(-21,2.5,2.6,3.4),'#5a2633',1.6);}
  else{const op=o.happy?3:1.2;fs(c,new Path2D(`M-23.5 1.5 Q-18 3 -12 2.6 Q-11 4.4 -12.5 5.2 Q-18 ${6+op} -24 ${3.4+op*.6}Z`),o.happy?'#c2414f':'#7a3a3f',1.7);
   line(c,1.6,INK,()=>{c.moveTo(-12.6,2.6);c.quadraticCurveTo(-10.6,2.6,-10.3,0.6);});}
  pEyes(c,[[-14,-4]],o,2.8,3.3);
  if(awake(o))lashes(c,-14,-4,1);
  blush(c,[[-10,4.5]]);
  if(nap)napBubbles(c,t,-23,0);
 }
 c.restore();
 riseBubbles(c,t,nap);
 bubbleFront(c,t);
 if(o.happy){const k=(t*1.4)%1;c.globalAlpha=Math.min(1,(1-k)*2);star(c,24,-26,3+k*3,'#ffe066');star(c,-29,-8,2+k*2,'#fff3bf');c.globalAlpha=1;}
 c.restore();}

/* ---------------- the baby Spinosaurus ---------------- */
const SM='#5ed3b5',SG='#3cc4a2',SG2='#23917a',SBL='#eaf8cf',SSP='#8fe3c8',SAIL='#ff8a4c',SAIL2='#e8590c',SAILT='#ffc078';
function sailPath(x0,x1,base,top,t,amp){const p=new Path2D(),n=8;p.moveTo(x0,base);
 for(let i=0;i<=n;i++){const q=i/n,x=x0+(x1-x0)*q,h=Math.sin(Math.PI*(.08+q*.84))*top,y=base-h+Math.sin(t*3+q*6)*amp*Math.sin(Math.PI*q);p.lineTo(x,y);}
 p.lineTo(x1,base);p.closePath();return p;}
function drawSail(c,p,x0,x1,base,top){fs(c,p,SAIL,2.2);c.save();c.clip(p);
 c.globalAlpha=.55;fs(c,new Path2D(`M${x0} ${base-top*.15} Q${(x0+x1)/2} ${base-top*1.05} ${x1} ${base-top*.15} L${x1} ${base-top*1.5} L${x0} ${base-top*1.5}Z`),SAILT,0);c.globalAlpha=1;
 c.strokeStyle=SAIL2;c.lineWidth=1.6;c.lineCap='round';for(let i=1;i<6;i++){const x=x0+(x1-x0)*i/6;c.beginPath();c.moveTo(x,base);c.lineTo(x+(i-3)*.6,base-top-4);c.stroke();}
 c.restore();c.lineWidth=2.2;c.strokeStyle=INK;c.stroke(p);}
function drawSpino(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap';c.save();if(o.puff)c.scale(1.15,1.15);
 const spots=pts=>pts.forEach(([x,y,r])=>fs(c,ell(x,y,r,r*.8),SSP,0));
 if(o.view==='front'){
  const tx=13+sw,ty=nap?20:29;
  fs(c,new Path2D(`M-7 14 Q-9 ${ty-2} ${tx-4} ${ty} Q${tx+4} ${ty} ${tx+2} ${ty-6} Q7 ${ty-10} 7 14Z`),SG,1.8);
  /* the sail standing up behind, a little to one side so it reads */
  c.save();c.translate(9,0);c.rotate(.3);const sp=sailPath(-9,9,6,nap?26:32,t,1.2);drawSail(c,sp,-9,9,6,nap?26:32);c.restore();
  const neck=new Path2D('M-6 8 Q-7 -6 -5 -15 L5 -15 Q7 -6 6 8Z'),body=ell(0,13,16,12);
  fs(c,neck,SG,2);fs(c,body,SG,2);fs(c,neck,SG,0);
  fs(c,ell(0,16,10,7),SBL,0);spots([[-11,8,2.6],[11,8,2.6],[-6,4,1.8],[7,3,1.6]]);
  /* short arms with tiny claws */
  [[-1,-9],[1,9]].forEach(([s,x])=>{fs(c,new Path2D(`M${x} 5 Q${x+s*6} 9 ${x+s*5} 13 Q${x+s*2} 13 ${x+s*1} 9Z`),SG,1.6);line(c,1.2,INK,()=>{c.moveTo(x+s*3,13);c.lineTo(x+s*3.4,15);c.moveTo(x+s*5.2,12.4);c.lineTo(x+s*6,14.2);});});
  const hy=nap?-12:-16;
  fs(c,ell(0,hy,13,10.5),SG,2.2);spots([[-5,hy-7,1.8],[4,hy-8,1.5]]);
  /* the long croc snout pointing at us: a round muzzle with nostrils on top */
  fs(c,ell(0,hy+7,7.5,6.2),SM,1.8);fs(c,ell(0,hy+10.5,5.5,2.4),SBL,0);
  fs(c,ell(-2.2,hy+4,1,.8),INK,0);fs(c,ell(2.2,hy+4,1,.8),INK,0);
  if(o.puff)fs(c,ell(0,hy+10.4,2,2.3),'#7a3a3f',1.4);
  else{line(c,1.5,INK,()=>{c.moveTo(-6.6,hy+8.6);c.quadraticCurveTo(0,hy+(o.happy?15:13),6.6,hy+8.6);});
   c.fillStyle='#fff';[-3.4,3.4].forEach(x=>{const y=hy+10.6-Math.abs(x)*.3;c.beginPath();c.moveTo(x-.8,y);c.lineTo(x+.8,y);c.lineTo(x,y+1.6);c.closePath();c.fill();});}
  pEyes(c,[[-6.5,hy-3.5],[6.5,hy-3.5]],o,2.8,3.4);blush(c,[[-10.5,hy+2],[10.5,hy+2]]);
 }else{
  /* side view, snout to the left */
  const tx=36+sw*.6,ty=(nap?16:2)+Math.sin(t*2)*2;
  fs(c,new Path2D(`M14 5 Q26 5 ${tx} ${ty} Q27 17 14 18Z`),SG,1.8);fs(c,ell(tx-1.5,ty+.6,2.4,1.8),SG2,0);
  const sp=sailPath(-3,19,6,nap?20:25,t,1.4);drawSail(c,sp,-3,19,6,nap?20:25);
  const hx=nap?-13:-12,hy=nap?-6:-13;
  const neck=new Path2D(`M-6 8 Q-8 -4 ${hx+3} ${hy+4} L${hx+9} ${hy+1} Q1 -6 6 5Z`),body=ell(6,12,15,11);
  fs(c,neck,SG,2);fs(c,body,SG,2);fs(c,neck,SG,0);
  fs(c,ell(3,16,10,6),SBL,0);spots([[12,8,2.4],[17,13,1.8],[-3,-1,1.5]]);
  /* chubby little hind leg */
  fs(c,ell(12,19,6.5,5),SG,1.8);line(c,1.2,INK,()=>{c.moveTo(7,23.6);c.lineTo(6,25);c.moveTo(9.5,24);c.lineTo(8.6,25.6);});
  /* the head: round baby head and a long croc snout with a little bump at the tip */
  const snout=new Path2D(`M${hx-2} ${hy-3} Q${hx-14} ${hy-3} ${hx-21} ${hy-2} Q${hx-25} ${hy-4} ${hx-26} ${hy} Q${hx-26} ${hy+4} ${hx-21} ${hy+5} Q${hx-12} ${hy+6} ${hx-2} ${hy+6}Z`);
  fs(c,snout,SG,2.2);fs(c,ell(hx,hy-1,9.5,8.5),SG,2.2);fs(c,new Path2D(`M${hx-4} ${hy-2.6} L${hx-4} ${hy+5.5} L${hx+2} ${hy+5.5} L${hx+2} ${hy-2.6}Z`),SG,0);
  c.save();c.clip(snout);fs(c,ell(hx-12,hy+6,16,3.2),SBL,0);c.restore();
  spots([[hx+3,hy-6,1.6],[hx-9,hy-1.5,1]]);
  fs(c,ell(hx-23.5,hy-.8,.9,.9),INK,0);
  if(o.puff){fs(c,new Path2D(`M${hx-23} ${hy+3} L${hx-4} ${hy+3} Q${hx-5} ${hy+8.5} ${hx-9} ${hy+8.5} L${hx-21} ${hy+6.5}Z`),'#7a3a3f',1.5);fs(c,ell(hx-11,hy+7,3.5,1.2),'#ff8fa3',0);}
  else{line(c,1.4,INK,()=>{c.moveTo(hx-24,hy+3);c.quadraticCurveTo(hx-14,hy+4.4,hx-5,hy+(o.happy?2:3));c.quadraticCurveTo(hx-3.6,hy+2.4,hx-3.4,hy+1);});
   c.fillStyle='#fff';[hx-20,hx-13].forEach(x=>{c.beginPath();c.moveTo(x-.8,hy+3.6);c.lineTo(x+.8,hy+3.7);c.lineTo(x,hy+5.2);c.closePath();c.fill();});}
  pEyes(c,[[hx,hy-2.5]],o,2.8,3.4);blush(c,[[hx+1,hy+3.4]]);
  /* short arm with tiny claws */
  c.save();c.translate(-5,6);c.rotate(Math.sin(t*3)*.15);fs(c,new Path2D('M0 0 Q-6 2 -7 7 Q-4 8 -2 5 Q1 4 2 2Z'),SG,1.6);line(c,1.1,INK,()=>{c.moveTo(-6.6,7);c.lineTo(-8,8.6);c.moveTo(-4.4,7.6);c.lineTo(-5.2,9.4);});c.restore();
 }
 if(o.happy){const k=(t*1.4)%1;c.globalAlpha=Math.min(1,(1-k)*2);star(c,-28,-26,3+k*3,'#ffe066');c.globalAlpha=1;}
 c.restore();}

/* ---------------- the egg ---------------- */
/* centred on (x,y), about s tall; crack 0..1 grows the cracks, at 1 a baby snout peeks out of the top */
function eggPath(){const p=new Path2D();p.moveTo(0,-.5);p.bezierCurveTo(.27,-.5,.38,-.06,.38,.13);p.bezierCurveTo(.38,.36,.21,.5,0,.5);p.bezierCurveTo(-.21,.5,-.38,.36,-.38,.13);p.bezierCurveTo(-.38,-.06,-.27,-.5,0,-.5);p.closePath();return p;}
const EGG='#f1ead2',EGG2='#d9cba2',SPECK=['#9c8257','#4fb39a','#b9975f'];
const CRACKS=[[[-.37,-.02],[-.28,.03],[-.22,-.06],[-.13,.02],[-.05,-.07],[.04,.01],[.12,-.07],[.21,.0],[.29,-.06],[.37,-.01]],
 [[-.02,-.48],[.03,-.38],[-.04,-.3],[.04,-.2],[-.02,-.12]],[[.2,.12],[.25,.2],[.19,.27],[.25,.35]]];
const SPECKS=[[-.2,-.22,.035],[.12,-.3,.03],[.22,-.12,.04],[-.27,.12,.04],[.05,.2,.05],[.26,.25,.03],[-.1,.36,.035],[-.06,-.38,.025],[.0,-.05,.03]];
function drawEgg(c,x,y,s,crack,t){crack=Math.max(0,Math.min(1,crack||0));t=t||0;c.save();c.translate(x,y+s/2);
 if(crack>.5&&crack<1){const k=Math.sin(t*16)*Math.max(0,Math.sin(t*2.2))*.09*(crack-.3);c.rotate(k);}
 if(crack>=1)c.rotate(Math.sin(t*3)*.03);
 c.translate(0,-s/2);c.scale(s,s);const lw=2.6/Math.max(30,s)*1.0,L=Math.max(.022,lw);
 const egg=eggPath();
 const speckle=()=>{SPECKS.forEach(([sx,sy,r],i)=>{c.fillStyle=SPECK[i%3];c.beginPath();c.ellipse(sx,sy,r,r*.8,i,0,7);c.fill();});};
 const shade=()=>{c.globalAlpha=.5;c.fillStyle=EGG2;c.beginPath();c.ellipse(.1,.24,.3,.26,0,0,7);c.fill();c.globalAlpha=.75;c.fillStyle='#fff';c.beginPath();c.ellipse(-.15,-.24,.07,.12,.4,0,7);c.fill();c.globalAlpha=1;};
 if(crack<1){
  c.fillStyle=EGG;c.fill(egg);c.save();c.clip(egg);shade();speckle();c.restore();
  c.lineWidth=L;c.strokeStyle=INK;c.lineJoin='round';c.stroke(egg);
  /* cracks grow: the big one around the middle first, then the top, then a small one */
  const total=CRACKS.reduce((a,cr)=>a+cr.length-1,0);let left=crack*total*1.0;c.lineWidth=L*.8;c.strokeStyle=INK;c.lineCap='round';
  for(const cr of CRACKS){if(left<=0)break;c.beginPath();c.moveTo(cr[0][0],cr[0][1]);for(let i=1;i<cr.length&&left>0;i++){const f=Math.min(1,left);const a=cr[i-1],b=cr[i];c.lineTo(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f);left-=1;}c.stroke();}
 }else{
  /* hatching: the bottom shell with a jagged rim, a baby snout peeking out, the cap lifted on its head */
  const zz=CRACKS[0];const bottom=new Path2D();bottom.moveTo(zz[0][0],zz[0][1]);for(let i=1;i<zz.length;i++)bottom.lineTo(zz[i][0],zz[i][1]);
  bottom.bezierCurveTo(.38,.36,.21,.5,0,.5);bottom.bezierCurveTo(-.21,.5,-.38,.36,-.38,.13);bottom.closePath();
  /* inside of the shell */
  c.fillStyle='#e4d7ae';c.beginPath();c.ellipse(0,-.03,.36,.07,0,0,7);c.fill();
  /* the baby: a round head and long snout pointing left, peeking over the rim */
  const bob=Math.sin(t*2.4)*.015,hy=-.16+bob;
  c.save();c.lineWidth=L;c.strokeStyle=INK;c.lineJoin='round';
  const sn=new Path2D();sn.moveTo(-.02,hy-.04);sn.quadraticCurveTo(-.2,hy-.05,-.3,hy-.03);sn.quadraticCurveTo(-.36,hy-.04,-.36,hy+.02);sn.quadraticCurveTo(-.36,hy+.07,-.28,hy+.08);sn.lineTo(-.02,hy+.1);sn.closePath();
  c.fillStyle=SG;c.fill(sn);c.stroke(sn);
  const hd=ell(.04,hy,.14,.13);c.fill(hd);c.stroke(hd);c.fillRect(-.06,hy-.035,.06,.13);
  c.restore();
  pEyesUnit(c,.02,hy-.03,.035,t);
  c.fillStyle=INK;c.beginPath();c.arc(-.32,hy-.005,.012,0,7);c.fill();
  c.lineWidth=L*.7;c.strokeStyle=INK;c.lineCap='round';c.beginPath();c.moveTo(-.33,hy+.045);c.quadraticCurveTo(-.2,hy+.07,-.1,hy+.05);c.stroke();
  c.globalAlpha=.45;c.fillStyle='#ff6f91';c.beginPath();c.ellipse(.05,hy+.06,.035,.022,0,0,7);c.fill();c.globalAlpha=1;
  /* the shell */
  c.fillStyle=EGG;c.fill(bottom);c.save();c.clip(bottom);shade();speckle();c.restore();c.lineWidth=L;c.strokeStyle=INK;c.lineJoin='round';c.stroke(bottom);
  /* the cap sitting on its head */
  c.save();c.translate(.06,hy-.1);c.rotate(.35+Math.sin(t*2.4)*.05);
  const cap=new Path2D();cap.moveTo(-.2,0);cap.lineTo(-.14,-.04);cap.lineTo(-.07,.03);cap.lineTo(0,-.05);cap.lineTo(.07,.02);cap.lineTo(.14,-.04);cap.lineTo(.2,0);cap.bezierCurveTo(.19,-.14,.11,-.24,0,-.24);cap.bezierCurveTo(-.11,-.24,-.19,-.14,-.2,0);cap.closePath();
  c.fillStyle=EGG;c.fill(cap);c.fillStyle=SPECK[1];c.beginPath();c.ellipse(.05,-.15,.03,.024,0,0,7);c.fill();c.fillStyle=SPECK[0];c.beginPath();c.ellipse(-.08,-.08,.025,.02,0,0,7);c.fill();
  c.lineWidth=L;c.strokeStyle=INK;c.stroke(cap);c.restore();
 }
 c.restore();}
/* an eye in egg units (blinks now and then) */
function pEyesUnit(c,x,y,r,t){const blink=(t%3.2)<.14;if(blink){c.lineWidth=r*.45;c.strokeStyle=INK;c.lineCap='round';c.beginPath();c.moveTo(x-r,y);c.quadraticCurveTo(x,y+r*.6,x+r,y);c.stroke();return;}
 c.fillStyle=INK;c.beginPath();c.ellipse(x,y,r,r*1.2,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+r*.35,y-r*.45,r*.4,0,7);c.fill();}

/* ---------------- fossil bones ---------------- */
/* All 8 pieces are laid out in one skeleton frame: facing left, feet at y=0, x from -100 to 100.
   Order: 0 skull, 1 neck, 2 sail spines, 3 back and ribs, 4 arm, 5 leg, 6 hip, 7 tail. */
const BONE='#f3ead2',BONE2='#dccca2';
function Bld(){const p=new Path2D(),bb=[1e9,1e9,-1e9,-1e9],det=[];
 const grow=(x,y,r)=>{bb[0]=Math.min(bb[0],x-r);bb[1]=Math.min(bb[1],y-r);bb[2]=Math.max(bb[2],x+r);bb[3]=Math.max(bb[3],y+r);};
 const circ=(x,y,r)=>{p.moveTo(x+r,y);p.arc(x,y,r,0,Math.PI*2);grow(x,y,r);};
 const b={p,bb,det,
  ell(x,y,rx,ry,rot){rot=rot||0;p.moveTo(x+Math.cos(rot)*rx,y+Math.sin(rot)*rx);p.ellipse(x,y,rx,ry,rot,0,Math.PI*2);grow(x,y,Math.max(rx,ry));return b;},
  rod(x1,y1,x2,y2,r){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,nx=-dy/l*r,ny=dx/l*r;p.moveTo(x1+nx,y1+ny);p.lineTo(x2+nx,y2+ny);p.lineTo(x2-nx,y2-ny);p.lineTo(x1-nx,y1-ny);p.closePath();circ(x1,y1,r);circ(x2,y2,r);return b;},
  /* a cartoon bone: a shaft with two knobs at each end */
  bone(x1,y1,x2,y2,r){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,nx=-uy*r,ny=ux*r;
   p.moveTo(x1+nx,y1+ny);p.lineTo(x2+nx,y2+ny);p.lineTo(x2-nx,y2-ny);p.lineTo(x1-nx,y1-ny);p.closePath();
   [[x1,y1,-1],[x2,y2,1]].forEach(([x,y,s])=>{circ(x+nx*.9+ux*s*r*.3,y+ny*.9+uy*s*r*.3,r*1.15);circ(x-nx*.9+ux*s*r*.3,y-ny*.9+uy*s*r*.3,r*1.15);});return b;},
  poly(pts){p.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(q=>p.lineTo(q[0],q[1]));p.closePath();pts.forEach(q=>grow(q[0],q[1],0));return b;},
  /* a curved claw from (x,y) hooking down */
  claw(x,y,len,dir){p.moveTo(x-1.3,y);p.quadraticCurveTo(x+dir*len*.7,y+len*.1,x+dir*len*.6,y+len);p.quadraticCurveTo(x+dir*len*.2,y+len*.4,x+1.3,y+.4);p.closePath();grow(x,y,len+1);return b;},
  detail(f){det.push(f);return b;}};
 return b;}
const PIECES=(function(){const A=[];
 /* 0 skull: a long croc snout, a crest bump, an eye hole and pointy teeth */
 A[0]=Bld().poly([[-43,-85],[-46,-93],[-55,-97],[-62,-94],[-68,-89],[-84,-87],[-93,-88],[-99,-86],[-100,-81],[-95,-78],[-70,-77],[-60,-73],[-50,-72],[-43,-78]])
  .poly([[-95,-77],[-80,-74],[-66,-72],[-56,-68],[-49,-69],[-52,-73],[-66,-76],[-94,-79]])
  .detail((c,lw)=>{c.fillStyle='#6b5a43';c.beginPath();c.ellipse(-56,-87,4,3.4,0,0,7);c.fill();c.fillStyle=BONE2;c.beginPath();c.ellipse(-73,-87,2.6,1.2,0,0,7);c.fill();
   c.fillStyle='#6b5a43';c.beginPath();c.ellipse(-48,-80,2.4,3.4,0,0,7);c.fill();
   c.fillStyle='#fff';c.strokeStyle='#6b5a43';c.lineWidth=lw*.5;for(let i=0;i<6;i++){const x=-93+i*5.2;c.beginPath();c.moveTo(x,-78.4);c.lineTo(x+2.6,-78.2);c.lineTo(x+1.2,-75.4);c.closePath();c.fill();c.stroke();}});
 /* 1 neck: three vertebrae curving up to the skull */
 const nk=Bld();[[-29,-68,.5],[-35.5,-73.5,.7],[-41.5,-79,.8]].forEach(([x,y,r])=>{nk.rod(x,y,x+2.4,y-6,1.5);nk.ell(x,y,5,3.9,r);});
 nk.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;[[-29,-68],[-35.5,-73.5],[-41.5,-79]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1.6,0,7);c.stroke();});});A[1]=nk;
 /* 2 the sail: tall spines rising from the back */
 const sl=Bld();for(let i=0;i<7;i++){const x=-21+i*6,h=12+52*Math.sin(Math.PI*(i+.6)/7.2);sl.rod(x,-68,x+2+i*.3,-68-h,1.9);}
 sl.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;for(let i=0;i<7;i++){const x=-21+i*6,h=12+52*Math.sin(Math.PI*(i+.6)/7.2);c.beginPath();c.moveTo(x+.6,-72);c.lineTo(x+1.4+i*.3,-62-h);c.stroke();}});A[2]=sl;
 /* 3 the back: a row of vertebrae and curved ribs */
 const bk=Bld();for(let i=0;i<5;i++){const x=-18+i*6.5;bk.rod(x,-62,x-5+i*.6,-42+i*1.4,1.5);}for(let i=0;i<7;i++)bk.ell(-22+i*6,-64.5,3.4,3);
 bk.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;for(let i=0;i<7;i++){c.beginPath();c.moveTo(-23.4+i*6,-64.5);c.lineTo(-20.6+i*6,-64.5);c.stroke();}});A[3]=bk;
 /* 4 the arm: short and strong with a big hooked thumb claw */
 A[4]=Bld().bone(-20,-55,-26,-44,2.1).bone(-26,-44,-35,-38.5,1.8).claw(-36,-38,8,-1).claw(-33.5,-37,5.5,-1).claw(-31.5,-36.5,4.5,-.4);
 /* 5 the leg: thigh, shin, foot and toes */
 A[5]=Bld().bone(22,-54,13,-31,3).bone(13,-31,20,-9,2.5).bone(20,-8,13,-2.5,1.8).rod(13,-2.5,3,-1.5,1.5).rod(14,-2.5,7,1,1.4).claw(3,-2.6,4,-1).claw(7,0,3.5,-1)
  .detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;c.beginPath();c.moveTo(19,-47);c.lineTo(15,-37);c.moveTo(14,-26);c.lineTo(17,-15);c.stroke();});
 /* 6 the hip */
 A[6]=Bld().ell(26,-62,12,6,-.08).bone(23,-58,16,-45,2.2).bone(29,-58,34,-46,1.9)
  .detail((c,lw)=>{c.fillStyle='#6b5a43';c.beginPath();c.arc(22,-59.5,2.2,0,7);c.fill();c.strokeStyle=BONE2;c.lineWidth=lw*.6;c.beginPath();c.moveTo(18,-63);c.quadraticCurveTo(26,-66,34,-63);c.stroke();});
 /* 7 the tail: shrinking vertebrae with tall spines (a paddle for swimming) */
 const tl=Bld();for(let i=0;i<9;i++){const x=40+i*7.4,y=-62+i*1.3+i*i*.06,r=4-i*.3,h=16-i*1.1;tl.rod(x,y,x+1.5,y-h,Math.max(1,1.6-i*.06));tl.rod(x,y,x+1,y+h*.5,1.1);tl.ell(x,y,r+.4,r*.85);}
 tl.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;for(let i=0;i<9;i++){const x=40+i*7.4,y=-62+i*1.3+i*i*.06;c.beginPath();c.arc(x,y,Math.max(.6,1.4-i*.08),0,7);c.stroke();}});A[7]=tl;
 return A;})();
const BONE_NAMES=['skull','neck','sail','back','arm','leg','hip','tail'];
function drawPiece(c,b,found,lw,t){c.lineJoin='round';c.lineCap='round';
 if(found){c.save();c.setLineDash([]);c.lineWidth=lw*2;c.strokeStyle=INK;c.stroke(b.p);c.fillStyle=BONE;c.fill(b.p);b.det.forEach(f=>f(c,lw));c.restore();}
 else{c.save();c.fillStyle='rgba(120,120,140,.13)';c.fill(b.p);c.setLineDash([lw*1.6,lw*1.3]);c.lineWidth=lw*.75;c.strokeStyle='rgba(110,110,130,.75)';c.stroke(b.p);c.restore();}}
/* one bone for a 'you found a fossil!' card, centred on (x,y) and fitting an s-by-s box */
function drawBone(c,x,y,s,kind,t){const b=PIECES[((kind|0)%8+8)%8];if(!b)return;t=t||0;const bw=b.bb[2]-b.bb[0],bh=b.bb[3]-b.bb[1],sc=s/Math.max(bw,bh)*.86;
 c.save();c.translate(x,y);c.rotate(Math.sin(t*1.8)*.04);c.scale(sc,sc);c.translate(-(b.bb[0]+b.bb[2])/2,-(b.bb[1]+b.bb[3])/2);
 drawPiece(c,b,true,Math.max(.8,s*.016)/sc,t);c.restore();
 const k=(t*.8)%1;if(k<.5){c.save();c.globalAlpha=Math.sin(k*2*Math.PI);star(c,x+s*.32,y-s*.3,s*.06,'#fff3bf');c.restore();}}
/* the museum skeleton: width w centred at x, feet at y (the wooden stand sits under y, about w*0.08 deep) */
function drawSkeleton(c,x,y,w,have,t){have=have||[];t=t||0;const sc=w/205;c.save();c.translate(x,y);c.scale(sc,sc);const lw=Math.max(.7,w*.0055)/sc;
 /* the stand: metal posts holding it up and a wooden base with a gold plaque */
 c.strokeStyle='#868e96';c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(-14,2);c.lineTo(-14,-60);c.moveTo(48,2);c.lineTo(48,-60);c.stroke();
 const base=new Path2D();base.roundRect(-92,1,184,14,3);fs(c,base,'#b07a45',lw*1.4);fs(c,P2(-88,1.6,176,3.4),'#cf9a62',0);
 c.strokeStyle='#8a5a2e';c.lineWidth=.8;c.beginPath();c.moveTo(-80,10);c.lineTo(-50,10);c.moveTo(55,8.5);c.lineTo(84,8.5);c.stroke();
 const pl=new Path2D();pl.roundRect(-26,5,52,8,2);fs(c,pl,'#f2c94c',lw);
 c.fillStyle='#7a5a12';c.font='700 5.6px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('SPINOSAURUS',0,9.3);
 const all=PIECES.every((_,i)=>have[i]);
 [7,5,3,2,6,1,0,4].forEach(i=>drawPiece(c,PIECES[i],!!have[i],lw,t));
 if(all)for(let i=0;i<4;i++){const k=(t*.7+i/4)%1;c.globalAlpha=Math.sin(k*Math.PI);star(c,[-70,0,60,-30][i],[-104,-128,-72,-40][i],3+k*3,'#fff3bf');}
 c.globalAlpha=1;c.restore();}
function P2(x,y,w,h){const p=new Path2D();p.rect(x,y,w,h);return p;}

window.MQ_PONDPETS={dottie:drawDottie,spino:drawSpino,egg:drawEgg,bone:drawBone,skeleton:drawSkeleton};
})();
