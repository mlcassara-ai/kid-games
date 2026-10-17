/* pondpets.js — two more floating pets drawn in the same style as pets.js:
   Dottie, the giant largemouth bass of Dixon Lake, swimming inside a round water bubble, and a baby Spinosaurus;
   plus the Spinosaurus egg, the 8 fossil bones and the museum skeleton they build.
   Seven more dinosaurs come the same way (baby pet, egg colours, 8 bones, skeleton): trex, trike, stego, brachio, ankylo, para, raptor.
   MQ_PONDPETS.dinos[id] = {name, baby(c,o), bone(c,x,y,s,kind,t), skeleton(c,x,y,w,have,t), egg:{colours}, parts:[8 names]};
   bone order for every dinosaur: 0 skull, 1 neck, 2 its special piece, 3 back & ribs, 4 arm/front leg, 5 leg, 6 hip, 7 tail.
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

/* ---------------- shared bits for the other baby dinosaurs ---------------- */
function hStar(c,o,x,y){if(!o.happy)return;const k=(o.t*1.4)%1;c.globalAlpha=Math.min(1,(1-k)*2);star(c,x,y,3+k*3,'#ffe066');c.globalAlpha=1;}
function toes(c,pts){line(c,1.2,INK,()=>pts.forEach(([x,y,dx,dy])=>{c.moveTo(x,y);c.lineTo(x+dx,y+dy);}));}
/* side-view mouth from the snout tip (x0,y0) back to the cheek (x1,y1); teeth are fractions along it */
function sMouth(c,o,x0,y0,x1,y1,teeth){const lo=Math.max(y0,y1);
 if(o.puff){const mx=(x0+x1)/2;fs(c,new Path2D(`M${x0} ${y0} Q${mx} ${lo-.6} ${x1} ${y1} Q${x1-.6} ${lo+5} ${mx} ${lo+5.5} Q${x0+.6} ${lo+4.4} ${x0} ${y0}Z`),'#7a3a3f',1.5);fs(c,ell(mx+1,lo+3.8,Math.abs(x1-x0)*.2,1.2),'#ff8fa3',0);return;}
 const dip=o.happy?2.4:1.2,cx=(x0+x1)/2,cy=(y0+y1)/2+dip;
 line(c,1.4,INK,()=>{c.moveTo(x0,y0);c.quadraticCurveTo(cx,cy,x1,y1);c.quadraticCurveTo(x1+1.3,y1-.3,x1+1.5,y1-(o.happy?2.2:1.4));});
 if(teeth){c.fillStyle='#fff';teeth.forEach(k=>{const x=x0+(x1-x0)*k,y=(1-k)*(1-k)*y0+2*k*(1-k)*cy+k*k*y1;c.beginPath();c.moveTo(x-.9,y+.2);c.lineTo(x+.9,y+.2);c.lineTo(x,y+2);c.closePath();c.fill();});}}
/* front-view mouth centred on (x,y), w wide */
function fMouth(c,o,x,y,w,teeth){if(o.puff){fs(c,ell(x,y+2,w*.28,w*.34),'#7a3a3f',1.4);fs(c,ell(x,y+2+w*.17,w*.16,w*.09),'#ff8fa3',0);return;}
 const d=o.happy?w*.55:w*.34;line(c,1.5,INK,()=>{c.moveTo(x-w/2,y);c.quadraticCurveTo(x,y+d,x+w/2,y);});
 if(teeth){c.fillStyle='#fff';teeth.forEach(k=>{const s=k+.5,xx=x-w/2+w*s,yy=y+2*s*(1-s)*d;c.beginPath();c.moveTo(xx-.9,yy+.1);c.lineTo(xx+.9,yy+.1);c.lineTo(xx,yy+1.9);c.closePath();c.fill();});}}
/* the tail seen from the front, swinging out behind */
function fTail(c,col,sw,nap){const tx=13+sw,ty=nap?20:28;fs(c,new Path2D(`M-7 14 Q-9 ${ty-2} ${tx-4} ${ty} Q${tx+4} ${ty} ${tx+2} ${ty-6} Q7 ${ty-10} 7 14Z`),col,1.8);return [tx,ty];}
function spotsOf(c,col,pts){pts.forEach(([x,y,r])=>fs(c,ell(x,y,r,r*.8),col,0));}
/* a feathery outline: an ellipse with soft scallops */
function fluff(cx,cy,rx,ry,n,a){const p=new Path2D(),pt=(th,k)=>[cx+Math.cos(th)*rx*k,cy+Math.sin(th)*ry*k];let q=pt(0,1);p.moveTo(q[0],q[1]);
 for(let i=1;i<=n;i++){const m=pt((i-.5)/n*Math.PI*2,1+a),e=pt(i/n*Math.PI*2,1);p.quadraticCurveTo(m[0],m[1],e[0],e[1]);}p.closePath();return p;}
function feather(c,x,y,len,wid,rot,col,col2){c.save();c.translate(x,y);c.rotate(rot);const p=new Path2D(`M0 0 Q${wid} ${-len*.45} 0 ${-len} Q${-wid} ${-len*.45} 0 0Z`);fs(c,p,col,1.4);
 if(col2)line(c,.9,col2,()=>{c.moveTo(0,-1);c.lineTo(0,-len*.8);});c.restore();}
/* a little stripe pointing down from the back */
function wedge(c,x,y,len,rot,col){c.save();c.translate(x,y);c.rotate(rot||0);fs(c,new Path2D(`M-2.2 0 Q0 ${len*.6} 0 ${len} Q0 ${len*.6} 2.2 0Z`),col,0);c.restore();}

/* ---------------- baby Tyrannosaurus rex: huge head, tiny arms ---------------- */
const TREX={b:'#ff9a52',d:'#e8590c',l:'#fff1d6',s:'#ffc58f'};
function drawTrex(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',P=TREX;c.save();if(o.puff)c.scale(1.15,1.15);
 if(o.view==='front'){
  fTail(c,P.b,sw,nap);
  [-1,1].forEach(s=>fs(c,ell(s*9,19,6.5,7.5),P.b,1.8));
  const neck=new Path2D('M-8 8 Q-9 0 -7 -6 L7 -6 Q9 0 8 8Z'),body=ell(0,13,15,12);fs(c,neck,P.b,2);fs(c,body,P.b,2);fs(c,neck,P.b,0);c.save();c.clip(body);fs(c,ell(0,17,9.5,7.5),P.l,0);[-11,-7,7,11].forEach((x,i)=>wedge(c,x,2.5,6,(i-1.5)*.25,P.d));c.restore();
  [-1,1].forEach(s=>{fs(c,ell(s*9,25,6.5,3.4),P.b,1.8);toes(c,[[s*6,27.6,-s*.4,1.4],[s*9,28.2,0,1.4],[s*12,27.6,s*.4,1.4]]);});
  /* the famous tiny arms */
  [-1,1].forEach(s=>{c.save();c.translate(s*6,5);c.rotate(s*(.2+Math.sin(t*4+(s>0?1:0))*.25));fs(c,new Path2D(`M0 0 Q${s*3} .5 ${s*3.4} 3.4 Q${s*1.6} 4 ${s*.6} 2.4Z`),P.b,1.4);toes(c,[[s*2.4,3.8,0,1.2],[s*3.6,3.2,s*.5,1]]);c.restore();});
  const hy=nap?-9:-14;
  const head=new Path2D(`M-12 ${hy-5} Q-12 ${hy-13} 0 ${hy-13} Q12 ${hy-13} 12 ${hy-5} Q16 ${hy+1} 16 ${hy+6} Q15 ${hy+12} 0 ${hy+12} Q-15 ${hy+12} -16 ${hy+6} Q-16 ${hy+1} -12 ${hy-5}Z`);
  fs(c,head,P.b,2.2);c.save();c.clip(head);fs(c,ell(0,hy+13,13,5.5),P.l,0);wedge(c,-3,hy-13,5,.15,P.d);wedge(c,3,hy-13,5,-.15,P.d);[-1,1].forEach(s=>fs(c,ell(s*7,hy-9.2,4,1.5),P.d,0));c.restore();
  fs(c,ell(-2.4,hy+1.5,1,.8),INK,0);fs(c,ell(2.4,hy+1.5,1,.8),INK,0);
  fMouth(c,o,0,hy+5.5,17,[-.32,-.12,.12,.32]);
  pEyes(c,[[-7,hy-4],[7,hy-4]],o,2.9,3.4);blush(c,[[-11.5,hy+2.5],[11.5,hy+2.5]]);
  hStar(c,o,-26,hy-12);
 }else{
  const tx=38+sw*.6,ty=(nap?17:3)+Math.sin(t*2)*2;
  fs(c,new Path2D(`M12 3 Q27 4 ${tx} ${ty} Q28 18 12 20Z`),P.b,1.8);
  fs(c,ell(1,23.5,5.5,3.2),P.d,1.6);
  const hx=nap?-10:-11,hy=nap?-2:-12;
  const neck=new Path2D(`M-6 8 Q-8 -2 ${hx+3} ${hy+5} L${hx+12} ${hy+1} Q3 -2 6 6Z`),body=ell(6,11,15,12);
  fs(c,neck,P.b,2);fs(c,body,P.b,2);fs(c,neck,P.b,0);
  c.save();c.clip(body);fs(c,ell(1,18,11,7),P.l,0);[[2,-1,.3],[8,-1,0],[14,0,-.3],[19,3,-.6]].forEach(([x,y,r])=>wedge(c,x,y,6,r,P.d));c.restore();
  /* big strong leg */
  fs(c,ell(13,15,8,8.5),P.b,2);fs(c,ell(9,24.5,7,3),P.b,1.8);toes(c,[[3,25.5,-1.2,1.4],[6,26.6,-1,1.4],[9,27,-.6,1.4]]);
  /* the head: big and boxy */
  fs(c,ell(hx-3,hy-12.5,4.6,3),P.d,1.6);
  const head=new Path2D(`M${hx+9} ${hy-4} Q${hx+8} ${hy-14} ${hx-3} ${hy-14} Q${hx-15} ${hy-14} ${hx-22} ${hy-9} Q${hx-27} ${hy-6} ${hx-27} ${hy} Q${hx-27} ${hy+4} ${hx-23} ${hy+5} Q${hx-20} ${hy+11} ${hx-10} ${hy+11} Q${hx+2} ${hy+11} ${hx+7} ${hy+6} Q${hx+10} ${hy+2} ${hx+9} ${hy-4}Z`);
  fs(c,head,P.b,2.2);c.save();c.clip(head);fs(c,ell(hx-10,hy+12,17,5),P.l,0);wedge(c,hx+3,hy-14,5,-.3,P.d);wedge(c,hx+7,hy-12,4.5,-.6,P.d);c.restore();
  fs(c,ell(hx-24,hy-3.5,1,.8),INK,0);
  sMouth(c,o,hx-26,hy+1.5,hx-6,hy+3,[.1,.28,.46,.64]);
  pEyes(c,[[hx-4,hy-6]],o,2.9,3.5);blush(c,[[hx+1,hy+2]]);
  /* the famous tiny arm */
  c.save();c.translate(-6,5);c.rotate(Math.sin(t*4)*.25);fs(c,new Path2D('M0 0 Q-3.4 0 -4.4 2.6 Q-3 3.6 -1.2 2.2 Q.6 1.6 .8 .6Z'),P.b,1.4);toes(c,[[-4.2,2.8,-1.2,.9],[-3,3.3,-.8,1.2]]);c.restore();
  hStar(c,o,-30,-28);
 }
 c.restore();}

/* ---------------- baby Triceratops: three horns and a frill ---------------- */
const TRIKE={b:'#74c0fc',d:'#339af0',l:'#e7f5ff',s:'#a5d8ff',f:'#ffd43b',f2:'#f08c00',fk:'#ff922b',h:'#fff4e0'};
function drawTrike(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',P=TRIKE;c.save();if(o.puff)c.scale(1.15,1.15);
 if(o.view==='front'){
  const hy=nap?-2:-6;
  fTail(c,P.b,sw*.7,true);
  /* the frill: a big fan behind the head with a bumpy edge */
  for(let i=0;i<9;i++){const a=Math.PI*(1.02+i*.12);fs(c,ell(Math.cos(a)*21.5,hy-5+Math.sin(a)*17,2.8,2.8),P.f2,1.4);}
  const fr=ell(0,hy-5,21,17);fs(c,fr,P.f,2.2);c.save();c.clip(fr);for(let i=0;i<7;i++){const a=Math.PI*(1.1+i*.133);fs(c,ell(Math.cos(a)*15,hy-5+Math.sin(a)*12,2.4,2),P.fk,0);}c.restore();
  [-1,1].forEach(s=>fs(c,ell(s*9,22,5.2,6),P.b,1.8));
  const body=ell(0,15,15,10.5);fs(c,body,P.b,2);c.save();c.clip(body);fs(c,ell(0,19,9,6),P.l,0);c.restore();
  [-1,1].forEach(s=>{fs(c,ell(s*9,25,5,2.6),P.b,1.6);toes(c,[[s*7,26.8,0,1.2],[s*10.5,26.8,0,1.2]]);});
  const head=ell(0,hy,11.5,10);fs(c,head,P.b,2.2);spotsOf(c,P.s,[[-6,hy-6,1.6],[6,hy-6.5,1.4]]);
  /* brow horns */
  [-1,1].forEach(s=>fs(c,new Path2D(`M${s*2.4} ${hy-6} Q${s*7} ${hy-16} ${s*11} ${hy-25} Q${s*10.5} ${hy-14} ${s*8.6} ${hy-5}Z`),P.h,1.8));
  /* the beak with its little nose horn */
  fs(c,ell(0,hy+6,6.2,5.4),P.b,1.8);fs(c,new Path2D(`M-3 ${hy+9} Q0 ${hy+14} 3 ${hy+9}Z`),P.h,1.4);
  fs(c,new Path2D(`M-2.2 ${hy+2} Q-.6 ${hy-4} 1 ${hy-6} Q2.4 ${hy-2} 2.2 ${hy+2}Z`),P.h,1.5);
  fs(c,ell(-1.6,hy+4.5,.8,.7),INK,0);fs(c,ell(1.6,hy+4.5,.8,.7),INK,0);
  if(o.puff)fs(c,ell(0,hy+9.6,2,2),'#7a3a3f',1.3);else line(c,1.4,INK,()=>{c.moveTo(-5,hy+7.8);c.quadraticCurveTo(0,hy+(o.happy?11:9.6),5,hy+7.8);});
  pEyes(c,[[-6,hy-1],[6,hy-1]],o,2.6,3.2);blush(c,[[-9.5,hy+4],[9.5,hy+4]]);
  hStar(c,o,-27,hy-18);
 }else{
  const hx=-19,hy=nap?6:1;
  fs(c,new Path2D(`M18 5 Q30 7 ${34+sw*.5} ${(nap?17:9)+Math.sin(t*2)*1.5} Q30 17 18 17Z`),P.b,1.8);
  fs(c,ell(19,22.5,4.6,3.6),P.d,1.6);fs(c,ell(-2,22.5,4.6,3.6),P.d,1.6);
  const body=ell(5,10,18.5,11.5);fs(c,body,P.b,2.2);c.save();c.clip(body);fs(c,ell(4,18,14,5.5),P.l,0);c.restore();
  spotsOf(c,P.s,[[8,2,2.4],[15,6,1.8],[1,4,1.6],[19,1,1.4]]);
  fs(c,ell(14,19,6,6.5),P.b,1.8);toes(c,[[10,24.5,-.8,1.3],[13,25.3,-.6,1.3]]);
  /* the frill behind the head */
  const fx=hx+9,fy=hy-6;for(let i=0;i<8;i++){const a=Math.PI*(.95+i*.17);fs(c,ell(fx+Math.cos(a)*12,fy+Math.sin(a)*14,2.6,2.6),P.f2,1.3);}
  const fr=ell(fx,fy,11.5,13.5);fs(c,fr,P.f,2.2);c.save();c.clip(fr);for(let i=0;i<6;i++){const a=Math.PI*(1.05+i*.18);fs(c,ell(fx+Math.cos(a)*7.5,fy+Math.sin(a)*9,2,1.7),P.fk,0);}c.restore();
  /* the far brow horn, then the head and beak */
  fs(c,new Path2D(`M${hx+1} ${hy-6} Q${hx-2} ${hy-16} ${hx-6} ${hy-22} Q${hx+1} ${hy-17} ${hx+6} ${hy-6}Z`),'#ecdcc4',1.8);
  fs(c,ell(-7,19.5,5,6),P.b,1.8);toes(c,[[-10,25,-.6,1.3],[-7,25.6,-.3,1.3]]);
  const beak=new Path2D(`M${hx-4} ${hy-5} Q${hx-14} ${hy-6} ${hx-18.5} ${hy+1} Q${hx-19.5} ${hy+5} ${hx-16} ${hy+6} Q${hx-10} ${hy+7.5} ${hx-3} ${hy+6.5}Z`);
  fs(c,beak,P.b,2.2);fs(c,ell(hx,hy,10,9),P.b,2.2);fs(c,ell(hx-4,hy+.5,3.5,5.6),P.b,0);
  fs(c,new Path2D(`M${hx-14.5} ${hy-2} Q${hx-19} ${hy-1.5} ${hx-19.5} ${hy+3} Q${hx-19} ${hy+6} ${hx-16} ${hy+6} Q${hx-17} ${hy+2.5} ${hx-14.5} ${hy-2}Z`),P.h,1.4);
  fs(c,new Path2D(`M${hx-13} ${hy-5} Q${hx-13.5} ${hy-10} ${hx-10.5} ${hy-12.5} Q${hx-9} ${hy-9} ${hx-8.5} ${hy-5.5}Z`),P.h,1.6);
  fs(c,new Path2D(`M${hx-2.5} ${hy-6.5} Q${hx-6} ${hy-16} ${hx-11} ${hy-23} Q${hx-3} ${hy-18} ${hx+3} ${hy-7.5}Z`),P.h,1.8);
  spotsOf(c,P.s,[[hx+4,hy-5,1.5]]);
  fs(c,ell(hx-15.5,hy-1.2,.9,.8),INK,0);
  sMouth(c,o,hx-16,hy+4,hx-4,hy+3.6);
  pEyes(c,[[hx-1,hy-1]],o,2.7,3.3);blush(c,[[hx+2.5,hy+3.5]]);
  hStar(c,o,-30,-24);
 }
 c.restore();}

/* ---------------- baby Stegosaurus: back plates and a spiky tail ---------------- */
const STEGO={b:'#8fd16a',d:'#5c9e3a',l:'#f4fce3',s:'#c0eb75',p:'#ff8fab',p2:'#e64980',pt:'#ffd6e0',k:'#fff4e0'};
function plate(c,x,y,h,w,rot,col,hi){c.save();c.translate(x,y);c.rotate(rot||0);const p=new Path2D(`M${-w} 0 Q${-w*1.25} ${-h*.62} 0 ${-h} Q${w*1.25} ${-h*.62} ${w} 0Z`);fs(c,p,col,1.8);
 if(hi){c.save();c.clip(p);c.globalAlpha=.6;fs(c,ell(-w*.35,-h*.55,w*.35,h*.25),hi,0);c.globalAlpha=1;c.restore();}c.restore();}
function spike(c,x,y,len,rot,col,w){w=w||2;c.save();c.translate(x,y);c.rotate(rot);fs(c,new Path2D(`M${-w} 0 Q${-w*.6} ${-len*.6} 0 ${-len} Q${w*.6} ${-len*.6} ${w} 0Z`),col,1.5);c.restore();}
function drawStego(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',P=STEGO;c.save();if(o.puff)c.scale(1.15,1.15);
 if(o.view==='front'){
  const hy=nap?4:-1;
  /* the spiky tail swinging out to the side */
  const tx=15+sw,ty=nap?19:24;[[-.9,0],[-.2,2],[.5,1]].forEach(([r,dx])=>spike(c,tx+dx-1,ty-1,7.5,r+.3,P.k,2.4));
  fs(c,new Path2D(`M-6 13 Q-8 ${ty+2} ${tx-3} ${ty+2} Q${tx+4} ${ty+1} ${tx+2} ${ty-4} Q7 ${ty-8} 7 13Z`),P.b,1.8);
  /* plates standing up behind, in two staggered rows */
  /* the plates run along the back and curve away to one side so they read from the front */
  [[17,9,9,1.05],[14,2,12,.75],[9,-4,14,.45],[2,hy-6,15,.15],[-5,hy-5,12,-.25],[-12,6,9,-.75]].forEach(([x,y,h,r],i)=>plate(c,x,y,h,4.4,r,i%2?P.p2:P.p,P.pt));
  [-1,1].forEach(s=>fs(c,ell(s*9,21,5.5,6.5),P.b,1.8));
  const body=ell(0,14,15.5,11);fs(c,body,P.b,2);c.save();c.clip(body);fs(c,ell(0,18,9,6.5),P.l,0);c.restore();
  spotsOf(c,P.s,[[-10,9,2.2],[10,10,2],[-5,6,1.4],[6,5,1.5]]);
  [-1,1].forEach(s=>{fs(c,ell(s*9,25,5.2,2.6),P.b,1.6);toes(c,[[s*7,26.8,0,1.2],[s*10.5,26.8,0,1.2]]);});
  const head=ell(0,hy,10.5,9);fs(c,head,P.b,2.2);spotsOf(c,P.s,[[-5,hy-5,1.5],[4,hy-6,1.3]]);
  fs(c,ell(0,hy+5.5,6.5,4.6),P.b,1.8);fs(c,ell(0,hy+7.6,4.6,2.2),P.l,0);
  fs(c,ell(-1.8,hy+3.6,.8,.7),INK,0);fs(c,ell(1.8,hy+3.6,.8,.7),INK,0);
  if(o.puff)fs(c,ell(0,hy+8.4,1.8,2),'#7a3a3f',1.3);else line(c,1.4,INK,()=>{c.moveTo(-4.6,hy+6.6);c.quadraticCurveTo(0,hy+(o.happy?10.6:9),4.6,hy+6.6);});
  pEyes(c,[[-5.5,hy-1.5],[5.5,hy-1.5]],o,2.6,3.2);blush(c,[[-8.6,hy+3.2],[8.6,hy+3.2]]);
  hStar(c,o,-26,hy-20);
 }else{
  const hx=nap?-24:-23,hy=nap?14:8,tx=37+sw*.5,ty=(nap?9:-3)+Math.sin(t*2)*1.5;
  /* thagomizer: four tail spikes, then the tail */
  [[-7,-.5,8,-.45],[-2,-.6,9,.45],[-7,1.6,7,-1.0],[-2,1.4,8,1.0]].forEach(([dx,dy,l,r])=>spike(c,tx+dx,ty+dy,l,r,P.k,2.4));
  fs(c,new Path2D(`M13 3 Q28 3 ${tx} ${ty} Q29 14 13 16Z`),P.b,1.8);
  fs(c,ell(18,22.5,4.6,3.6),P.d,1.6);fs(c,ell(-3,22.5,4.4,3.4),P.d,1.6);
  /* plates along the back, two rows */
  const bx=4,by=9,brx=18,bry=12,top=x=>by-bry*Math.sqrt(Math.max(0,1-((x-bx)/brx)**2));
  const H=[11,15.5,17.5,15,10.5];
  H.slice(0,4).forEach((h,i)=>{const x=-7.5+i*8.2;plate(c,x,top(x)+3.5,(h+H[i+1])*.4,4,(i-1.5)*.18,P.p2);});
  H.forEach((h,i)=>{const x=-12+i*8.2;plate(c,x,top(x)+3.5,h,4.8,(i-2)*.18,P.p,P.pt);});
  const neck=new Path2D(`M-6 3 Q-14 4 ${hx+3} ${hy-5} L${hx+4} ${hy+5} Q-12 15 -4 15Z`),body=ell(bx,by,brx,bry);
  fs(c,neck,P.b,2);fs(c,body,P.b,2.2);fs(c,neck,P.b,0);
  c.save();c.clip(body);fs(c,ell(2,18,13,6),P.l,0);c.restore();
  spotsOf(c,P.s,[[6,3,2.2],[13,6,1.8],[-1,6,1.6],[18,10,1.4]]);
  fs(c,ell(14,18.5,6.5,7.5),P.b,1.8);toes(c,[[10,25,-.8,1.3],[13,25.8,-.6,1.3]]);
  fs(c,ell(-6,20,5,5.5),P.b,1.8);toes(c,[[-9,24.7,-.6,1.3],[-6,25.4,-.3,1.3]]);
  fs(c,ell(hx-7,hy+2,5.6,4.4),P.b,2);fs(c,ell(hx,hy,8,7.2),P.b,2.2);fs(c,ell(hx-4,hy+1.8,3,3.6),P.b,0);
  c.save();c.clip(ell(hx-7,hy+2,5.6,4.4));fs(c,ell(hx-7,hy+6.5,7,2.6),P.l,0);c.restore();
  spotsOf(c,P.s,[[hx+3,hy-4.5,1.4]]);
  fs(c,ell(hx-11,hy,.8,.7),INK,0);
  sMouth(c,o,hx-12,hy+3,hx-3.5,hy+3.8);
  pEyes(c,[[hx-1,hy-1.5]],o,2.6,3.2);blush(c,[[hx+2.5,hy+3]]);
  hStar(c,o,-30,-16);
 }
 c.restore();}

/* ---------------- baby Brachiosaurus: a long, long neck ---------------- */
const BRACHIO={b:'#b197fc',d:'#845ef7',l:'#f3f0ff',s:'#d0bfff'};
function drawBrachio(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',P=BRACHIO;c.save();if(o.puff)c.scale(1.12,1.12);
 if(o.view==='front'){
  const sx=Math.sin(t*1.3)*2,hy=nap?-6:-24;
  fTail(c,P.b,sw,true);
  [-1,1].forEach(s=>fs(c,ell(s*6,23,3.6,4.6),P.d,1.5));
  fs(c,new Path2D(`M-5.5 12 Q-6 ${hy+14} ${sx-4.6} ${hy+5} L${sx+4.6} ${hy+5} Q6 ${hy+14} 5.5 12Z`),P.b,2);
  const body=ell(0,17,15,10);fs(c,body,P.b,2);c.save();c.clip(body);fs(c,ell(0,21,9,5.5),P.l,0);c.restore();
  fs(c,new Path2D(`M-5.5 12 Q-6 ${hy+14} ${sx-4.6} ${hy+5} L${sx+4.6} ${hy+5} Q6 ${hy+14} 5.5 12Z`),P.b,0);
  spotsOf(c,P.s,[[-10,13,2.2],[10,13,2],[sx*.5-1.5,(hy+12)/2,1.5],[sx*.5+2,(hy+12)/2+5,1.3]]);
  [-1,1].forEach(s=>{fs(c,ell(s*8.5,22,5,6.5),P.b,1.8);toes(c,[[s*6.5,28,0,1.1],[s*10.5,28,0,1.1]]);});
  fs(c,ell(sx,hy-7.5,5,3.6),P.b,1.8);
  const head=ell(sx,hy,10,8.5);fs(c,head,P.b,2.2);fs(c,ell(sx,hy-8,1.4,.9),P.d,0);
  fs(c,ell(sx,hy+5,6.6,4.4),P.b,1.8);fs(c,ell(sx,hy+7,4.6,2),P.l,0);
  fs(c,ell(sx-1.7,hy+3.4,.8,.7),INK,0);fs(c,ell(sx+1.7,hy+3.4,.8,.7),INK,0);
  if(o.puff)fs(c,ell(sx,hy+8,1.8,2),'#7a3a3f',1.3);else line(c,1.4,INK,()=>{c.moveTo(sx-4.6,hy+6);c.quadraticCurveTo(sx,hy+(o.happy?10:8.6),sx+4.6,hy+6);});
  pEyes(c,[[sx-5.2,hy-1.5],[sx+5.2,hy-1.5]],o,2.5,3.1);blush(c,[[sx-8.4,hy+3],[sx+8.4,hy+3]]);
  hStar(c,o,-22,hy-8);
 }else{
  const tx=40+sw*.6,ty=(nap?19:12)+Math.sin(t*2)*1.5;
  fs(c,new Path2D(`M20 8 Q32 10 ${tx} ${ty} Q32 21 20 22Z`),P.b,1.8);
  fs(c,ell(20,23.5,4.2,3.2),P.d,1.5);fs(c,ell(1,23.5,4,3.2),P.d,1.5);
  const hx=nap?-24:-15+Math.sin(t*1.3)*1.2,hy=nap?11:-27;
  const neck=nap?new Path2D(`M-3 13 Q-14 15 ${hx+3} ${hy+5} L${hx+5} ${hy-4} Q-8 2 6 3Z`):new Path2D(`M-3 11 Q-12 -6 ${hx+1} ${hy+6} L${hx+8} ${hy+1} Q-1 -8 7 3Z`);
  const body=ell(10,13,15,11);fs(c,neck,P.b,2);fs(c,body,P.b,2.2);fs(c,neck,P.b,0);
  c.save();c.clip(body);fs(c,ell(8,20,11,5),P.l,0);c.restore();
  spotsOf(c,P.s,nap?[[13,7,2.4],[20,11,1.8],[-6,7,1.6],[-14,8,1.3]]:[[13,7,2.4],[20,11,1.8],[-6,-2,1.6],[-9,-11,1.4],[-11,-19,1.2]]);
  /* tall front leg, shorter back leg */
  fs(c,ell(-2.5,19,5.2,7.8),P.b,1.8);toes(c,[[-5.5,26.2,-.5,1.2],[-2.5,26.8,-.3,1.2]]);
  fs(c,ell(17,19.5,6,6.5),P.b,1.8);toes(c,[[13,25,-.6,1.2],[16,25.8,-.4,1.2]]);
  fs(c,ell(hx-1,hy-6.5,4.4,3.4),P.b,1.8);
  fs(c,ell(hx-7,hy+2,5.6,4.4),P.b,2);fs(c,ell(hx,hy,8,7.2),P.b,2.2);fs(c,ell(hx-4,hy+1.8,3,3.6),P.b,0);
  c.save();c.clip(ell(hx-7,hy+2,5.6,4.4));fs(c,ell(hx-7,hy+6.5,7,2.6),P.l,0);c.restore();
  fs(c,ell(hx-1,hy-8,1.3,.8),P.d,0);fs(c,ell(hx-11,hy,.8,.7),INK,0);
  sMouth(c,o,hx-12,hy+3,hx-3.5,hy+3.8);
  pEyes(c,[[hx-1,hy-1.5]],o,2.6,3.2);blush(c,[[hx+2.5,hy+3]]);
  hStar(c,o,8,-28);
 }
 c.restore();}

/* ---------------- baby Ankylosaurus: armour, spikes and a club tail ---------------- */
const ANKY={b:'#f2b84b',d:'#c98a2c',a:'#b5793a',al:'#dba15c',k:'#fff4e0',l:'#fff3d6'};
function bumps(c,clip,rows){c.save();c.clip(clip);rows.forEach(([x0,x1,y,step,r])=>{for(let x=x0;x<=x1+.01;x+=step){c.fillStyle=ANKY.a;c.strokeStyle='#8c5a26';c.lineWidth=1;c.beginPath();c.moveTo(x-r,y+r*.55);c.quadraticCurveTo(x-r*.9,y-r*.5,x,y-r*.95);c.quadraticCurveTo(x+r*.9,y-r*.5,x+r,y+r*.55);c.closePath();c.fill();c.stroke();fs(c,ell(x-r*.3,y-r*.25,r*.3,r*.22),'#e8b878',0);}});c.restore();}
function club(c,x,y,s){fs(c,ell(x-1,y,6*s,5*s),ANKY.a,2);fs(c,ell(x-2.5*s,y-1.8*s,2*s,1.4*s),ANKY.al,0);fs(c,ell(x+2*s,y+1*s,1.2*s,1*s),'#8c5a26',0);}
function drawAnky(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',P=ANKY;c.save();if(o.puff)c.scale(1.15,1.15);
 if(o.view==='front'){
  const hy=nap?11:6,tx=24+sw,ty=19;
  fs(c,new Path2D(`M8 16 Q16 20 ${tx-4} ${ty-1} L${tx-4} ${ty+2.5} Q16 24 6 21Z`),P.b,1.8);club(c,tx,ty+.5,1);
  /* side spikes */
  [[-1,3],[-1,9.5],[-1,16],[1,3],[1,9.5],[1,16]].forEach(([s,y])=>spike(c,s*18,y,9,s*(1.2+y*.025),P.k));
  [-1,1].forEach(s=>fs(c,ell(s*10,22,5.5,5.5),P.b,1.8));
  [-2.75,-2.2,-1.57,-.94,-.39].forEach((a,i)=>spike(c,Math.cos(a)*19,11+Math.sin(a)*11,i%2?6:7.5,a+Math.PI/2,P.k,2.3));
  const shell=ell(0,11,20,11.5);fs(c,shell,P.al,2.2);bumps(c,shell,[[-8,8,1.5,8,3.3],[-12,12,8,8,3.4],[-16,16,15,8,3.2]]);
  [-1,1].forEach(s=>{fs(c,ell(s*10,25.2,5.5,2.4),P.b,1.6);toes(c,[[s*7.5,26.8,0,1.2],[s*11.5,26.8,0,1.2]]);});
  [-1,1].forEach(s=>spike(c,s*7.5,hy-5,6,s*.85,P.k));
  const head=ell(0,hy,10.5,8.5);fs(c,head,P.b,2.2);fs(c,ell(0,hy-6,5,1.8),P.a,0);
  fs(c,ell(0,hy+4.6,6.2,4),P.b,1.8);fs(c,ell(0,hy+6.6,4.4,1.8),P.l,0);
  fs(c,ell(-1.7,hy+3,.8,.7),INK,0);fs(c,ell(1.7,hy+3,.8,.7),INK,0);
  if(o.puff)fs(c,ell(0,hy+7.4,1.8,1.8),'#7a3a3f',1.3);else line(c,1.4,INK,()=>{c.moveTo(-4.4,hy+5.6);c.quadraticCurveTo(0,hy+(o.happy?9.6:8),4.4,hy+5.6);});
  pEyes(c,[[-5.4,hy-1.5],[5.4,hy-1.5]],o,2.5,3);blush(c,[[-8.4,hy+3],[8.4,hy+3]]);
  hStar(c,o,-27,-12);
 }else{
  const hx=-25,hy=nap?15:9,tx=39+sw*.9,ty=12+Math.sin(t*2)*1.2;
  fs(c,new Path2D(`M18 8 Q31 10 ${tx-4} ${ty-1.4} L${tx-4} ${ty+2.2} Q31 17 18 16Z`),P.b,1.8);club(c,tx,ty+.4,1.05);
  fs(c,ell(17,22,4.4,3.4),P.d,1.6);fs(c,ell(-5,22,4.4,3.4),P.d,1.6);
  /* side spikes along the shell's edge */
  /* spikes all around the edge of its armour */
  [-2.85,-2.4,-1.95,-1.5,-1.05,-.6,-.2].forEach((a,i)=>spike(c,3+Math.cos(a)*20.5,13+Math.sin(a)*13.5,i%2?6.5:8,a+Math.PI/2,P.k,2.4));
  fs(c,ell(3,15,20,6.5),P.b,2);
  const shell=new Path2D();shell.ellipse(3,13,22,14,0,Math.PI,Math.PI*2);shell.quadraticCurveTo(3,17,-19,13);shell.closePath();fs(c,shell,P.al,2.2);
  bumps(c,shell,[[-3,9,2.5,6,3],[-10,16,8.5,6.5,3.2]]);
  fs(c,ell(14,19,5.5,5.5),P.b,1.8);toes(c,[[10.5,23.8,-.6,1.3],[13.5,24.5,-.4,1.3]]);
  fs(c,ell(-9,19,5,5),P.b,1.8);toes(c,[[-12,23.4,-.5,1.3],[-9,24,-.3,1.3]]);
  /* head with little horns at the back */
  spike(c,hx+5,hy-4.5,6,1.0,P.k);spike(c,hx+6,hy+3,5.5,1.9,P.k);
  fs(c,ell(hx-6.5,hy+2.4,5.4,4.2),P.b,2);fs(c,ell(hx,hy,8.6,7.2),P.b,2.2);fs(c,ell(hx-3.5,hy+2,3,3.6),P.b,0);
  fs(c,ell(hx+1,hy-6,4.4,1.6),P.a,0);
  c.save();c.clip(ell(hx-6.5,hy+2.4,5.4,4.2));fs(c,ell(hx-6.5,hy+6.6,7,2.4),P.l,0);c.restore();
  fs(c,ell(hx-10.6,hy+.6,.8,.7),INK,0);
  sMouth(c,o,hx-11.5,hy+3.6,hx-3.4,hy+4.2);
  pEyes(c,[[hx-1,hy-1.5]],o,2.6,3.1);blush(c,[[hx+2.6,hy+3.2]]);
  hStar(c,o,-30,-8);
 }
 c.restore();}

/* ---------------- baby Parasaurolophus: a duck bill and a long head crest ---------------- */
const PARA={b:'#ffa8c5',d:'#f06595',l:'#fff0f6',s:'#ffd0e0',c:'#cc5de8',c2:'#9c36b5',ct:'#eebefa'};
function drawPara(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',P=PARA;c.save();if(o.puff)c.scale(1.15,1.15);
 if(o.view==='front'){
  fTail(c,P.b,sw,nap);
  const neck=new Path2D('M-6 8 Q-7 -6 -5 -15 L5 -15 Q7 -6 6 8Z'),body=ell(0,13,15,12);
  fs(c,neck,P.b,2);fs(c,body,P.b,2);fs(c,neck,P.b,0);
  c.save();c.clip(body);fs(c,ell(0,17,9.5,7),P.l,0);c.restore();spotsOf(c,P.s,[[-10,8,2.4],[10,8,2.4],[-5,3,1.6]]);
  [-1,1].forEach(s=>{fs(c,new Path2D(`M${s*9} 5 Q${s*15} 9 ${s*14} 13 Q${s*11} 13.5 ${s*10} 9Z`),P.b,1.6);toes(c,[[s*12,13.4,0,1.4],[s*14,12.6,s*.6,1.4]]);});
  [-1,1].forEach(s=>{fs(c,ell(s*8,24.5,5.5,2.8),P.b,1.6);toes(c,[[s*6,26.6,0,1.2],[s*10,26.6,0,1.2]]);});
  const hy=nap?-11:-16;
  /* the crest sweeps up and back (seen from the front it leans to one side) */
  const cr=new Path2D(`M-3.5 ${hy-6} Q-3 ${hy-20} 7 ${hy-27} Q12.5 ${hy-30} 13.5 ${hy-25} Q8 ${hy-20} 4 ${hy-6}Z`);fs(c,cr,P.c,2);
  line(c,1.4,P.ct,()=>{c.moveTo(-.4,hy-9);c.quadraticCurveTo(0,hy-19,7.5,hy-24.5);});
  fs(c,ell(0,hy,12,10),P.b,2.2);spotsOf(c,P.s,[[-6,hy-6,1.6],[6,hy-5,1.4]]);
  /* the wide duck bill */
  fs(c,ell(0,hy+6.5,9.5,4.6),P.b,1.8);fs(c,ell(0,hy+8,7.5,2.6),P.l,0);
  fs(c,ell(-2.6,hy+4.4,.9,.7),INK,0);fs(c,ell(2.6,hy+4.4,.9,.7),INK,0);
  if(o.puff)fs(c,ell(0,hy+9,2.2,2),'#7a3a3f',1.3);else line(c,1.5,INK,()=>{c.moveTo(-7.6,hy+7);c.quadraticCurveTo(0,hy+(o.happy?11.4:9.6),7.6,hy+7);});
  pEyes(c,[[-6.5,hy-2],[6.5,hy-2]],o,2.8,3.4);blush(c,[[-10.5,hy+2],[10.5,hy+2]]);
  hStar(c,o,-24,hy-14);
 }else{
  const tx=36+sw*.6,ty=(nap?16:2)+Math.sin(t*2)*2;
  fs(c,new Path2D(`M14 5 Q26 5 ${tx} ${ty} Q27 17 14 18Z`),P.b,1.8);
  const hx=nap?-12:-11,hy=nap?-5:-14;
  const neck=new Path2D(`M-6 8 Q-8 -4 ${hx+3} ${hy+4} L${hx+9} ${hy+1} Q1 -6 6 5Z`),body=ell(6,12,15,11);
  fs(c,neck,P.b,2);fs(c,body,P.b,2);fs(c,neck,P.b,0);
  c.save();c.clip(body);fs(c,ell(3,17,10,6),P.l,0);c.restore();spotsOf(c,P.s,[[12,6,2.4],[17,12,1.8],[-3,-1,1.5],[6,3,1.4]]);
  fs(c,ell(12,19,6.5,5.4),P.b,1.8);toes(c,[[7,23.8,-1,1.3],[9.5,24.4,-.8,1.3]]);
  /* the long crest, swept back */
  const cr=new Path2D(`M${hx-2} ${hy-5} Q${hx+6} ${hy-19} ${hx+21} ${hy-22} Q${hx+27} ${hy-23} ${hx+26} ${hy-17.5} Q${hx+13} ${hy-14} ${hx+6} ${hy-1}Z`);
  fs(c,cr,P.c,2.2);c.save();c.clip(cr);fs(c,new Path2D(`M${hx-4} ${hy-6} Q${hx+6} ${hy-23} ${hx+28} ${hy-25} L${hx+28} ${hy-21} Q${hx+8} ${hy-18} ${hx} ${hy-4}Z`),P.ct,0);c.restore();c.lineWidth=2.2;c.strokeStyle=INK;c.stroke(cr);
  /* the duck bill */
  const bill=new Path2D(`M${hx-3} ${hy-3.4} Q${hx-12} ${hy-3.6} ${hx-19} ${hy-2.4} Q${hx-24} ${hy-.4} ${hx-23.4} ${hy+3.4} Q${hx-22} ${hy+6.6} ${hx-15} ${hy+6.2} L${hx-3} ${hy+6}Z`);
  fs(c,bill,P.b,2.2);fs(c,ell(hx,hy,9,8),P.b,2.2);fs(c,new Path2D(`M${hx-5} ${hy-3} L${hx-5} ${hy+5.5} L${hx+1} ${hy+5.5} L${hx+1} ${hy-3}Z`),P.b,0);
  c.save();c.clip(bill);fs(c,ell(hx-14,hy+7,12,3),P.l,0);c.restore();
  spotsOf(c,P.s,[[hx+4,hy-5,1.4]]);
  fs(c,ell(hx-20,hy-.6,.9,.8),INK,0);
  sMouth(c,o,hx-22.6,hy+2.8,hx-5,hy+3.4);
  pEyes(c,[[hx,hy-2]],o,2.8,3.4);blush(c,[[hx+1.4,hy+3.6]]);
  c.save();c.translate(-5,6);c.rotate(Math.sin(t*3)*.15);fs(c,new Path2D('M0 0 Q-5 2 -6 8 Q-3.5 8.6 -2 5.4 Q1 4 2 2Z'),P.b,1.6);toes(c,[[-5.6,8,-.8,1.4],[-3.6,8.4,-.4,1.4]]);c.restore();
  hStar(c,o,-30,-24);
 }
 c.restore();}

/* ---------------- baby Velociraptor: fluffy feathers and a big sickle claw ---------------- */
const RAPTOR={b:'#748ffc',d:'#4c6ef5',l:'#edf2ff',s:'#a5b4fc',f:'#ffa94d',f2:'#e8590c',ft:'#ffd8a8',k:'#fff4e0'};
/* the sickle claw, raised, at (x,y), pointing left (s=1) or right (s=-1) */
function sickle(c,x,y,sz,s){c.save();c.translate(x,y);c.scale(s*sz,sz);fs(c,new Path2D('M1.2 0 Q1.2 -6.5 -3.3 -6.5 Q-6.8 -6.3 -8.2 -1.9 Q-5.6 -4.1 -3.2 -3.7 Q-1.2 -3.1 -1 0Z'),RAPTOR.k,1.5/sz);c.restore();}
function drawRaptor(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',P=RAPTOR;c.save();if(o.puff)c.scale(1.15,1.15);
 if(o.view==='front'){
  const hy=nap?-10:-14,[tx,ty]=[13+sw,nap?20:27],neck=new Path2D(`M-6 8 Q-7 0 -5 ${hy+4} L5 ${hy+4} Q7 0 6 8Z`);
  [-.7,0,.7].forEach(r=>feather(c,tx+2,ty-2,10,3,r+.9,P.f,P.f2));
  fTail(c,P.b,sw,nap);
  /* feathered arms held out like little wings */
  [-1,1].forEach(s=>{c.save();c.translate(s*9,5);c.rotate(s*(.15+Math.sin(t*4+(s>0?1:0))*.15));
   [0,1,2,3].forEach(i=>feather(c,s*(4+i*2.6),2,9-i*.8,2.6,s*(2.7-i*.12),i%2?P.f2:P.f));
   fs(c,new Path2D(`M0 -2 Q${s*7} -3 ${s*13} 1 Q${s*12} 4 ${s*7} 4 Q${s*2} 4 0 3Z`),P.b,1.6);toes(c,[[s*12.6,1,s*1.4,1.2],[s*11.6,3,s*1,1.4]]);c.restore();});
  [-1,1].forEach(s=>fs(c,ell(s*7,20,5,6),P.b,1.8));
  const body=fluff(0,13,13.5,11.5,12,.1);fs(c,neck,P.b,2);fs(c,body,P.b,2);fs(c,neck,P.b,0);c.save();c.clip(body);fs(c,ell(0,17,8.5,7),P.l,0);c.restore();
  [-1,1].forEach(s=>{fs(c,ell(s*8,25.5,5,2.4),P.d,1.6);sickle(c,s*4.6,25,.8,s);toes(c,[[s*9.5,27.4,s*.6,1.2],[s*12,26.8,s*.8,1.2]]);});
  [[-5,-.5],[0,0],[5,.5]].forEach(([x,r])=>feather(c,x*.8,hy-8,10,3,r,P.f,P.f2));
  const head=ell(0,hy,11.5,10);fs(c,head,P.b,2.2);
  fs(c,ell(0,hy+6,6.4,5),P.b,1.8);fs(c,ell(0,hy+8.2,4.6,2.2),P.l,0);
  fs(c,ell(-1.8,hy+3.4,.8,.7),INK,0);fs(c,ell(1.8,hy+3.4,.8,.7),INK,0);
  fMouth(c,o,0,hy+7.4,9,[-.28,.28]);
  pEyes(c,[[-6,hy-2],[6,hy-2]],o,2.9,3.5);blush(c,[[-9.5,hy+3],[9.5,hy+3]]);
  hStar(c,o,-26,hy-12);
 }else{
  const tx=38+sw*.5,ty=(nap?13:-4)+Math.sin(t*2)*1.5;
  [-.5,0,.5].forEach(r=>feather(c,tx-2,ty,11,3,1.57+r,P.f,P.f2));
  fs(c,new Path2D(`M11 1 Q25 -1 ${tx} ${ty-1.6} L${tx} ${ty+1.6} Q26 13 11 15Z`),P.b,1.8);
  fs(c,ell(3,23.6,4.6,2.4),P.d,1.5);
  const hx=nap?-12:-11,hy=nap?-4:-13;
  const neck=new Path2D(`M-6 8 Q-8 -3 ${hx+3} ${hy+5} L${hx+9} ${hy+1} Q1 -4 6 5Z`);
  const body=fluff(5,9,13.5,10,12,.12);
  fs(c,neck,P.b,2);fs(c,body,P.b,2.2);fs(c,neck,P.b,0);
  c.save();c.clip(body);fs(c,ell(1,15,9,5.5),P.l,0);[[6,0],[11,1],[16,3]].forEach(([x,y])=>line(c,1.2,P.d,()=>{c.moveTo(x-2,y);c.lineTo(x,y+2);c.lineTo(x+2,y);}));c.restore();
  /* leg: fluffy thigh, slim foot, and the sickle claw held up */
  fs(c,new Path2D('M10 15 Q16 18 15 21 Q13 23.5 9 23.5 L8 21.5 Q11 20.5 11 18Z'),P.b,1.6);
  fs(c,fluff(12,12,6.5,7,8,.12),P.b,1.8);
  fs(c,ell(5.5,24.2,5.5,2.2),P.d,1.6);toes(c,[[.4,24.8,-1.3,1]]);sickle(c,8.6,23.2,1.45,1);
  /* the feathered arm */
  c.save();c.translate(-4,4);c.rotate(Math.sin(t*3)*.12);
  [0,1,2].forEach(i=>feather(c,-3+i*3,4+i*.5,8-i,2.6,2.6+i*.15,i%2?P.f2:P.f));
  fs(c,new Path2D('M2 -1 Q-4 0 -8 5 Q-6 7 -3 5 Q1 3 3 2Z'),P.b,1.6);toes(c,[[-7.6,5.4,-1.2,1.4],[-6,6.4,-.8,1.6]]);c.restore();
  /* head crest feathers */
  [[3,-7,-.2],[6,-5,.4],[8,-2,.9]].forEach(([x,y,r],i)=>feather(c,hx+x,hy+y,9,2.8,r,i%2?P.f2:P.f));
  const sn=new Path2D(`M${hx-3} ${hy-3.6} Q${hx-14} ${hy-3} ${hx-22} ${hy} Q${hx-25.5} ${hy+2.2} ${hx-22.6} ${hy+5} Q${hx-13} ${hy+6.4} ${hx-3} ${hy+6}Z`);
  fs(c,sn,P.b,2.2);fs(c,ell(hx,hy,9,8),P.b,2.2);fs(c,new Path2D(`M${hx-5} ${hy-3.2} L${hx-5} ${hy+5.6} L${hx+1} ${hy+5.6} L${hx+1} ${hy-3.2}Z`),P.b,0);
  c.save();c.clip(sn);fs(c,ell(hx-13,hy+6.6,13,2.6),P.l,0);c.restore();
  fs(c,ell(hx-21,hy+.3,.8,.7),INK,0);
  sMouth(c,o,hx-22.6,hy+3.2,hx-5,hy+3.8,[.18,.38,.58]);
  pEyes(c,[[hx,hy-2]],o,2.9,3.5);blush(c,[[hx+1.4,hy+3.6]]);
  hStar(c,o,-30,-24);
 }
 c.restore();}
/* ---------------- the egg ---------------- */
/* drawEgg(c,x,y,s,crack,t,colours,kind): centred on (x,y), about s tall; crack 0..1 grows the cracks, at 1 a baby peeks out of the top.
   colours (optional, default = the Spinosaurus egg) = {shell,shade,specks:[3 colours],inside,baby,accent,kind} — use MQ_PONDPETS.dinos[id].egg.
   kind (optional) picks the head that peeks out: 'spino','trex','trike','stego','brachio','ankylo','para','raptor';
   it defaults to colours.kind, then 'spino'. An unknown kind gets a plain round baby head. */
function eggPath(){const p=new Path2D();p.moveTo(0,-.5);p.bezierCurveTo(.27,-.5,.38,-.06,.38,.13);p.bezierCurveTo(.38,.36,.21,.5,0,.5);p.bezierCurveTo(-.21,.5,-.38,.36,-.38,.13);p.bezierCurveTo(-.38,-.06,-.27,-.5,0,-.5);p.closePath();return p;}
const EGG_SPINO={shell:'#f1ead2',shade:'#d9cba2',specks:['#9c8257','#4fb39a','#b9975f'],inside:'#e4d7ae',baby:SG,accent:SAIL,kind:'spino'};
const CRACKS=[[[-.37,-.02],[-.28,.03],[-.22,-.06],[-.13,.02],[-.05,-.07],[.04,.01],[.12,-.07],[.21,.0],[.29,-.06],[.37,-.01]],
 [[-.02,-.48],[.03,-.38],[-.04,-.3],[.04,-.2],[-.02,-.12]],[[.2,.12],[.25,.2],[.19,.27],[.25,.35]]];
const SPECKS=[[-.2,-.22,.035],[.12,-.3,.03],[.22,-.12,.04],[-.27,.12,.04],[.05,.2,.05],[.26,.25,.03],[-.1,.36,.035],[-.06,-.38,.025],[.0,-.05,.03]];
function drawEgg(c,x,y,s,crack,t,colours,kind){crack=Math.max(0,Math.min(1,crack||0));t=t||0;const E=Object.assign({},EGG_SPINO,colours||{});kind=kind||(colours&&colours.kind)||'spino';
 c.save();c.translate(x,y+s/2);
 if(crack>.5&&crack<1){const k=Math.sin(t*16)*Math.max(0,Math.sin(t*2.2))*.09*(crack-.3);c.rotate(k);}
 if(crack>=1)c.rotate(Math.sin(t*3)*.03);
 c.translate(0,-s/2);c.scale(s,s);const lw=2.6/Math.max(30,s)*1.0,L=Math.max(.022,lw);
 const egg=eggPath();
 const speckle=()=>{SPECKS.forEach(([sx,sy,r],i)=>{c.fillStyle=E.specks[i%3];c.beginPath();c.ellipse(sx,sy,r,r*.8,i,0,7);c.fill();});};
 const shade=()=>{c.globalAlpha=.5;c.fillStyle=E.shade;c.beginPath();c.ellipse(.1,.24,.3,.26,0,0,7);c.fill();c.globalAlpha=.75;c.fillStyle='#fff';c.beginPath();c.ellipse(-.15,-.24,.07,.12,.4,0,7);c.fill();c.globalAlpha=1;};
 if(crack<1){
  c.fillStyle=E.shell;c.fill(egg);c.save();c.clip(egg);shade();speckle();c.restore();
  c.lineWidth=L;c.strokeStyle=INK;c.lineJoin='round';c.stroke(egg);
  /* cracks grow: the big one around the middle first, then the top, then a small one */
  const total=CRACKS.reduce((a,cr)=>a+cr.length-1,0);let left=crack*total*1.0;c.lineWidth=L*.8;c.strokeStyle=INK;c.lineCap='round';
  for(const cr of CRACKS){if(left<=0)break;c.beginPath();c.moveTo(cr[0][0],cr[0][1]);for(let i=1;i<cr.length&&left>0;i++){const f=Math.min(1,left);const a=cr[i-1],b=cr[i];c.lineTo(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f);left-=1;}c.stroke();}
 }else{
  /* hatching: the bottom shell with a jagged rim, a baby peeking out, the cap lifted on its head */
  const zz=CRACKS[0];const bottom=new Path2D();bottom.moveTo(zz[0][0],zz[0][1]);for(let i=1;i<zz.length;i++)bottom.lineTo(zz[i][0],zz[i][1]);
  bottom.bezierCurveTo(.38,.36,.21,.5,0,.5);bottom.bezierCurveTo(-.21,.5,-.38,.36,-.38,.13);bottom.closePath();
  /* inside of the shell */
  c.fillStyle=E.inside;c.beginPath();c.ellipse(0,-.03,.36,.07,0,0,7);c.fill();
  const bob=Math.sin(t*2.4)*.015,hy=-.16+bob;
  const capY=eggBaby(c,kind,hy,L,t,E);
  /* the shell */
  c.fillStyle=E.shell;c.fill(bottom);c.save();c.clip(bottom);shade();speckle();c.restore();c.lineWidth=L;c.strokeStyle=INK;c.lineJoin='round';c.stroke(bottom);
  /* the cap sitting on its head */
  c.save();c.translate(.06,capY);c.rotate(.35+Math.sin(t*2.4)*.05);
  const cap=new Path2D();cap.moveTo(-.2,0);cap.lineTo(-.14,-.04);cap.lineTo(-.07,.03);cap.lineTo(0,-.05);cap.lineTo(.07,.02);cap.lineTo(.14,-.04);cap.lineTo(.2,0);cap.bezierCurveTo(.19,-.14,.11,-.24,0,-.24);cap.bezierCurveTo(-.11,-.24,-.19,-.14,-.2,0);cap.closePath();
  c.fillStyle=E.shell;c.fill(cap);c.fillStyle=E.specks[1];c.beginPath();c.ellipse(.05,-.15,.03,.024,0,0,7);c.fill();c.fillStyle=E.specks[0];c.beginPath();c.ellipse(-.08,-.08,.025,.02,0,0,7);c.fill();
  c.lineWidth=L;c.strokeStyle=INK;c.stroke(cap);c.restore();
 }
 c.restore();}
/* the baby peeking out of the egg (egg units, facing left); returns where the cap sits */
function eggBaby(c,kind,hy,L,t,E){const B=E.baby,A=E.accent||B,K='#fff4e0';
 c.save();c.lineWidth=L;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';
 const F=(p,f)=>{c.fillStyle=f;c.fill(p);c.stroke(p);},P=d=>new Path2D(d),E2=(x,y,rx,ry)=>ell(x,y,rx,ry);
 const horn=(x,y,len,rot,col)=>{c.save();c.translate(x,y);c.rotate(rot);F(P(`M${-.025} 0 Q${-.015} ${-len*.6} 0 ${-len} Q${.015} ${-len*.6} ${.025} 0Z`),col||K);c.restore();};
 let capY=hy-.1,tip=-.32,mouthY=hy+.045,teeth=0,nos=null;
 /* behind the head */
 if(kind==='trike'){for(let i=0;i<7;i++){const a=Math.PI*(1.0+i*.19);F(E2(.13+Math.cos(a)*.17,hy-.06+Math.sin(a)*.19,.028,.028),'#f08c00');}F(E2(.13,hy-.06,.165,.185),A);}
 if(kind==='stego'){[[.15,hy-.1,.5],[.22,hy-.0,1.1],[.06,hy-.13,-.1]].forEach(([x,y,r])=>{c.save();c.translate(x,y);c.rotate(r);F(P('M-.04 0 Q-.05 -.07 0 -.11 Q.05 -.07 .04 0Z'),A);c.restore();});}
 if(kind==='para')F(P(`M.02 ${hy-.09} Q.1 ${hy-.27} .29 ${hy-.3} Q.36 ${hy-.3} .34 ${hy-.23} Q.2 ${hy-.2} .13 ${hy-.03}Z`),A);
 if(kind==='raptor')[[.04,-.12,-.3],[.1,-.11,.2],[.15,-.07,.7]].forEach(([x,y,r])=>{c.save();c.translate(x,hy+y);c.rotate(r);F(P('M0 0 Q.035 -.06 0 -.13 Q-.035 -.06 0 0Z'),A);c.restore();});
 if(kind==='ankylo'){horn(.15,hy-.07,.08,.9);horn(.17,hy+.04,.07,1.8);}
 if(kind==='brachio')F(E2(.02,hy-.11,.06,.045),B);
 /* the snout */
 let sn;
 if(kind==='trex'){sn=P(`M-.02 ${hy-.09} Q-.16 ${hy-.11} -.24 ${hy-.05} Q-.28 ${hy} -.25 ${hy+.06} Q-.2 ${hy+.12} -.02 ${hy+.12}Z`);tip=-.24;mouthY=hy+.035;teeth=1;}
 else if(kind==='trike'){sn=P(`M-.02 ${hy-.06} Q-.15 ${hy-.07} -.21 ${hy+.02} Q-.22 ${hy+.08} -.17 ${hy+.09} L-.02 ${hy+.1}Z`);tip=-.19;mouthY=hy+.055;}
 else if(kind==='para'){sn=P(`M-.02 ${hy-.05} Q-.18 ${hy-.06} -.27 ${hy-.02} Q-.31 ${hy+.03} -.27 ${hy+.08} L-.02 ${hy+.09}Z`);tip=-.27;mouthY=hy+.04;}
 else if(kind==='raptor'){sn=P(`M-.02 ${hy-.05} Q-.2 ${hy-.04} -.3 ${hy+.01} Q-.33 ${hy+.04} -.3 ${hy+.07} L-.02 ${hy+.09}Z`);tip=-.29;mouthY=hy+.045;teeth=1;}
 else if(kind==='spino'){sn=P(`M-.02 ${hy-.04} Q-.2 ${hy-.05} -.3 ${hy-.03} Q-.36 ${hy-.04} -.36 ${hy+.02} Q-.36 ${hy+.07} -.28 ${hy+.08} L-.02 ${hy+.1}Z`);tip=-.33;nos=-.32;teeth=0;}
 else{sn=E2(-.1,hy+.035,.11,.075);tip=-.17;mouthY=hy+.05;}
 F(sn,B);const hd=E2(.04,hy,.14,.13);F(hd,B);c.fillStyle=B;c.fillRect(-.06,hy-.035,.06,.13);
 /* in front of the head */
 if(kind==='trike'){horn(-.13,hy-.05,.07,-.35);horn(-.01,hy-.1,.13,-.55);}
 if(kind==='ankylo'){c.fillStyle='#b5793a';c.beginPath();c.ellipse(.06,hy-.1,.07,.025,0,0,7);c.fill();}
 c.restore();
 pEyesUnit(c,.02,hy-.03,.035,t);
 c.fillStyle=INK;c.beginPath();c.arc(nos==null?tip+.025:nos,hy-.005,.012,0,7);c.fill();
 c.lineWidth=L*.7;c.strokeStyle=INK;c.lineCap='round';c.beginPath();c.moveTo(tip,mouthY);c.quadraticCurveTo(tip*.6,mouthY+.025,-.1,mouthY+.005);c.stroke();
 if(teeth){c.fillStyle='#fff';[tip*.8,tip*.55].forEach(x=>{c.beginPath();c.moveTo(x-.012,mouthY+.012);c.lineTo(x+.012,mouthY+.014);c.lineTo(x,mouthY+.04);c.closePath();c.fill();});}
 c.globalAlpha=.45;c.fillStyle='#ff6f91';c.beginPath();c.ellipse(.05,hy+.06,.035,.022,0,0,7);c.fill();c.globalAlpha=1;
 return capY;}
/* an eye in egg units (blinks now and then) */
function pEyesUnit(c,x,y,r,t){const blink=(t%3.2)<.14;if(blink){c.lineWidth=r*.45;c.strokeStyle=INK;c.lineCap='round';c.beginPath();c.moveTo(x-r,y);c.quadraticCurveTo(x,y+r*.6,x+r,y);c.stroke();return;}
 c.fillStyle=INK;c.beginPath();c.ellipse(x,y,r,r*1.2,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+r*.35,y-r*.45,r*.4,0,7);c.fill();}

/* ---------------- fossil bones ---------------- */
/* All 8 pieces of a dinosaur are laid out in one skeleton frame: facing left, feet at y=0, x from -100 to 100.
   Order for every dinosaur: 0 skull, 1 neck, 2 its special piece, 3 back and ribs, 4 arm (front leg), 5 leg, 6 hip, 7 tail. */
const BONE='#f3ead2',BONE2='#dccca2',HOLE='#6b5a43';
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
  /* a pointed spike or horn from a base (x,y) of half-width w to the tip (tx,ty), slightly curved */
  horn(x,y,tx,ty,w,bend){const dx=tx-x,dy=ty-y,l=Math.hypot(dx,dy)||1,nx=-dy/l*w,ny=dx/l*w,mx=x+dx*.55-dy/l*(bend||0),my=y+dy*.55+dx/l*(bend||0);
   p.moveTo(x+nx,y+ny);p.quadraticCurveTo(mx+nx*.5,my+ny*.5,tx,ty);p.quadraticCurveTo(mx-nx*.5,my-ny*.5,x-nx,y-ny);p.closePath();grow(x,y,w);grow(tx,ty,0);return b;},
  detail(f){det.push(f);return b;}};
 return b;}
/* shared detail painters */
const dRings=pts=>(c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;pts.forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r||1.5,0,7);c.stroke();});};
const dHoles=hs=>(c,lw)=>{c.fillStyle=HOLE;hs.forEach(([x,y,rx,ry])=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();});};
const dLines=ls=>(c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;c.beginPath();ls.forEach(([x1,y1,x2,y2])=>{c.moveTo(x1,y1);c.lineTo(x2,y2);});c.stroke();};
const dTeeth=(ts,dn)=>(c,lw)=>{c.fillStyle='#fff';c.strokeStyle=HOLE;c.lineWidth=lw*.5;ts.forEach(([x,y,w,h])=>{c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w/2,y+(dn?h:-h));c.closePath();c.fill();c.stroke();});};
/* builders used by several skeletons */
function neckOf(pts){const b=Bld();pts.forEach(([x,y,r,rot])=>{b.rod(x,y,x+2.4,y-r*1.2,1.5);b.ell(x,y,r,r*.78,rot||0);});return b.detail(dRings(pts.map(([x,y])=>[x,y,1.6])));}
function backOf(n,x0,dx,yf,ribs,rr){const b=Bld();for(let i=0;i<ribs.length;i++){const x=x0+dx*(i+.5),y=yf(x);b.rod(x,y+1,x-4+i*.5,y+ribs[i],1.5);}
 const v=[];for(let i=0;i<n;i++){const x=x0+i*dx;v.push([x,yf(x)]);b.ell(x,yf(x),rr||3.4,(rr||3.4)*.88);}
 return b.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;v.forEach(([x,y])=>{c.beginPath();c.moveTo(x-1.4,y);c.lineTo(x+1.4,y);c.stroke();});});}
function tailOf(n,x0,dx,yf,r0,dr,up,dn){const b=Bld(),v=[];for(let i=0;i<n;i++){const x=x0+i*dx,y=yf(i),r=Math.max(1.2,r0-i*dr),h=Math.max(1.5,up-i*up/(n+2));
 if(up)b.rod(x,y,x+1.5,y-h,Math.max(1,1.6-i*.06));if(dn)b.rod(x,y,x+1,y+h*dn,1.1);b.ell(x,y,r+.4,r*.85);v.push([x,y,Math.max(.6,1.4-i*.08)]);}
 return b.detail(dRings(v));}

/* ---- Spinosaurus ---- */
const PIECES=(function(){const A=[];
 /* 0 skull: a long croc snout, a crest bump, an eye hole and pointy teeth */
 A[0]=Bld().poly([[-43,-85],[-46,-93],[-55,-97],[-62,-94],[-68,-89],[-84,-87],[-93,-88],[-99,-86],[-100,-81],[-95,-78],[-70,-77],[-60,-73],[-50,-72],[-43,-78]])
  .poly([[-95,-77],[-80,-74],[-66,-72],[-56,-68],[-49,-69],[-52,-73],[-66,-76],[-94,-79]])
  .detail((c,lw)=>{c.fillStyle=HOLE;c.beginPath();c.ellipse(-56,-87,4,3.4,0,0,7);c.fill();c.fillStyle=BONE2;c.beginPath();c.ellipse(-73,-87,2.6,1.2,0,0,7);c.fill();
   c.fillStyle=HOLE;c.beginPath();c.ellipse(-48,-80,2.4,3.4,0,0,7);c.fill();
   c.fillStyle='#fff';c.strokeStyle=HOLE;c.lineWidth=lw*.5;for(let i=0;i<6;i++){const x=-93+i*5.2;c.beginPath();c.moveTo(x,-78.4);c.lineTo(x+2.6,-78.2);c.lineTo(x+1.2,-75.4);c.closePath();c.fill();c.stroke();}});
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
  .detail((c,lw)=>{c.fillStyle=HOLE;c.beginPath();c.arc(22,-59.5,2.2,0,7);c.fill();c.strokeStyle=BONE2;c.lineWidth=lw*.6;c.beginPath();c.moveTo(18,-63);c.quadraticCurveTo(26,-66,34,-63);c.stroke();});
 /* 7 the tail: shrinking vertebrae with tall spines (a paddle for swimming) */
 const tl=Bld();for(let i=0;i<9;i++){const x=40+i*7.4,y=-62+i*1.3+i*i*.06,r=4-i*.3,h=16-i*1.1;tl.rod(x,y,x+1.5,y-h,Math.max(1,1.6-i*.06));tl.rod(x,y,x+1,y+h*.5,1.1);tl.ell(x,y,r+.4,r*.85);}
 tl.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;for(let i=0;i<9;i++){const x=40+i*7.4,y=-62+i*1.3+i*i*.06;c.beginPath();c.arc(x,y,Math.max(.6,1.4-i*.08),0,7);c.stroke();}});A[7]=tl;
 return A;})();
const BONE_NAMES=['skull','neck','sail','back','arm','leg','hip','tail'];
function drawPiece(c,b,found,lw,t){c.lineJoin='round';c.lineCap='round';
 if(found){c.save();c.setLineDash([]);c.lineWidth=lw*2;c.strokeStyle=INK;c.stroke(b.p);c.fillStyle=BONE;c.fill(b.p);b.det.forEach(f=>f(c,lw));c.restore();}
 else{const ga=window.PP_GHOST; /* the dig's museum draws missing bones fainter (PP_GHOST); the pond keeps its look */c.save();c.fillStyle=ga==null?'rgba(120,120,140,.13)':`rgba(120,120,140,${ga*.15})`;c.fill(b.p);c.setLineDash(ga==null?[lw*1.6,lw*1.3]:[lw*1.6,lw*1.6]);c.lineWidth=ga==null?lw*.75:lw*.6;c.strokeStyle=ga==null?'rgba(110,110,130,.75)':`rgba(110,110,130,${ga})`;c.stroke(b.p);c.restore();}}
/* one bone for a 'you found a fossil!' card, centred on (x,y) and fitting an s-by-s box */
function boneDrawer(PS){return function(c,x,y,s,kind,t){const b=PS[((kind|0)%8+8)%8];if(!b)return;t=t||0;const bw=b.bb[2]-b.bb[0],bh=b.bb[3]-b.bb[1],sc=s/Math.max(bw,bh)*.86;
 c.save();c.translate(x,y);c.rotate(Math.sin(t*1.8)*.04);c.scale(sc,sc);c.translate(-(b.bb[0]+b.bb[2])/2,-(b.bb[1]+b.bb[3])/2);
 drawPiece(c,b,true,Math.max(.8,s*.016)/sc,t);c.restore();
 const k=(t*.8)%1;if(k<.5){c.save();c.globalAlpha=Math.sin(k*2*Math.PI);star(c,x+s*.32,y-s*.3,s*.06,'#fff3bf');c.restore();}};}
/* the museum skeleton: width w centred at x, feet at y (the wooden stand sits under y, about w*0.08 deep) */
function skeletonDrawer(PS,label,order,posts,sparks){
 const bb=PS.reduce((a,b)=>[Math.min(a[0],b.bb[0]),Math.min(a[1],b.bb[1]),Math.max(a[2],b.bb[2]),Math.max(a[3],b.bb[3])],[1e9,1e9,-1e9,-1e9]);
 sparks=sparks||[[bb[0]+30,bb[1]+14],[(bb[0]+bb[2])/2,bb[1]-4],[bb[2]-40,bb[1]+(bb[3]-bb[1])*.4],[-30,-40]];
 return function(c,x,y,w,have,t){have=have||[];t=t||0;const sc=w/205;c.save();c.translate(x,y);c.scale(sc,sc);const lw=Math.max(.7,w*.0055)/sc;
 /* the stand: metal posts holding it up and a wooden base with a gold plaque */
 c.strokeStyle='#868e96';c.lineWidth=2.2;c.lineCap='round';c.beginPath();posts.forEach(([px,py])=>{c.moveTo(px,2);c.lineTo(px,py);});c.stroke();
 const base=new Path2D();base.roundRect(-92,1,184,14,3);fs(c,base,'#b07a45',lw*1.4);fs(c,P2(-88,1.6,176,3.4),'#cf9a62',0);
 c.strokeStyle='#8a5a2e';c.lineWidth=.8;c.beginPath();c.moveTo(-80,10);c.lineTo(-50,10);c.moveTo(55,8.5);c.lineTo(84,8.5);c.stroke();
 c.font='700 5.6px Fredoka, Trebuchet MS, sans-serif';const pw=Math.max(52,c.measureText(label).width+10);
 const pl=new Path2D();pl.roundRect(-pw/2,5,pw,8,2);fs(c,pl,'#f2c94c',lw);
 c.fillStyle='#7a5a12';c.font='700 5.6px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(label,0,9.3);
 const all=PS.every((_,i)=>have[i]);
 order.forEach(i=>drawPiece(c,PS[i],!!have[i],lw,t));
 if(all)for(let i=0;i<4;i++){const k=(t*.7+i/4)%1;c.globalAlpha=Math.sin(k*Math.PI);star(c,sparks[i][0],sparks[i][1],3+k*3,'#fff3bf');}
 c.globalAlpha=1;c.restore();};}
function P2(x,y,w,h){const p=new Path2D();p.rect(x,y,w,h);return p;}
const drawBone=boneDrawer(PIECES),drawSkeleton=skeletonDrawer(PIECES,'SPINOSAURUS',[7,5,3,2,6,1,0,4],[[-14,-60],[48,-60]],[[-70,-104],[0,-128],[60,-72],[-30,-40]]);

/* ---- Tyrannosaurus rex: 2 = the lower jaw with its big teeth ---- */
const P_TREX=(function(){const A=[];
 const up=[];for(let i=0;i<7;i++){const x=-95+i*5.6;up.push([x,-76.5,3.4,5+(i>1&&i<5?1.5:0)]);}
 const lo=[];for(let i=0;i<6;i++){const x=-91+i*6;lo.push([x,-66.5,3.2,4.6+(i>0&&i<4?1:0)]);}
 /* 0 skull: big and boxy with big windows (holes) in it and the top teeth */
 const sk=Bld().poly([[-44,-80],[-47,-90],[-56,-98],[-68,-99],[-80,-97],[-91,-92],[-98,-86],[-100,-79],[-97,-76],[-80,-76],[-62,-76],[-50,-75],[-44,-74]]);
 up.forEach(([x,y,w,h])=>sk.poly([[x-.4,y-1.5],[x+w+.4,y-1.5],[x+w/2,y+h]]));
 A[0]=sk.detail(dHoles([[-55,-88,4.2,4.6],[-70,-85,6.5,4.4],[-93,-85,2.2,1.6],[-48,-80,2,3]])).detail(dTeeth(up.map(([x,y,w,h])=>[x,y,w,h]),true))
  .detail(dLines([[-62,-96,-84,-93]]));
 /* 2 the lower jaw: a deep jaw full of big teeth (hinged a little open) */
 const jw=Bld().poly([[-96,-66],[-80,-65],[-62,-64],[-50,-66],[-43,-72],[-41,-68],[-46,-60],[-60,-57],[-78,-58],[-92,-61],[-98,-64]]);
 lo.forEach(([x,y,w,h])=>jw.poly([[x-.4,y+1.5],[x+w+.4,y+1.5],[x+w/2,y-h]]));
 A[2]=jw.detail(dTeeth(lo,false)).detail(dHoles([[-52,-62.5,3,1.6]])).detail(dLines([[-90,-61.5,-60,-60]]));
 /* 1 neck: a thick S-curve */
 A[1]=neckOf([[-29,-66,5.4,.4],[-35,-70.5,5.6,.7],[-39.5,-76,5.2,1]]);
 /* 3 back and a deep rib cage */
 A[3]=backOf(7,-24,6.3,x=>-63.5+x*.02,[15,21,25,26,24,19],3.6);
 /* 4 the famous tiny arm with two fingers */
 A[4]=Bld().bone(-15,-52,-18,-45,1.5).bone(-18,-45,-23,-42.5,1.3).claw(-24,-42.5,4,-1).claw(-22.4,-41.8,3.2,-.6);
 /* 5 the big strong leg */
 A[5]=Bld().bone(22,-56,13,-31,3.4).bone(13,-31,21,-9,2.8).bone(21,-8,14,-2.5,2).rod(14,-2.5,3,-1.5,1.7).rod(15,-2.5,7,1,1.5).claw(3,-2.8,4.5,-1).claw(7,0,3.6,-1)
  .detail(dLines([[19,-48,15,-37],[15,-26,18,-15]]));
 /* 6 the hip */
 A[6]=Bld().ell(25,-63,12.5,6,-.06).bone(21,-59,11,-42,2.3).ell(10,-40,4.5,2.6).bone(29,-59,34,-47,2)
  .detail((c,lw)=>{dHoles([[21,-60.5,2.3,2.3]])(c,lw);dLines([[17,-64,33,-64]])(c,lw);});
 /* 7 the long tail */
 A[7]=tailOf(10,39,6.8,i=>-61+i*1.6+i*i*.05,4.4,.3,10,.7);
 return A;})();

/* ---- Triceratops: 2 = the frill and its two long brow horns ---- */
const P_TRIKE=(function(){const A=[];
 /* 0 skull: a parrot beak, a short nose horn and a big eye hole */
 A[0]=Bld().poly([[-48,-58],[-52,-68],[-62,-73],[-74,-70],[-84,-66],[-92,-61],[-97,-55],[-99,-48],[-96,-45],[-92,-48],[-88,-43],[-76,-38],[-62,-38],[-52,-42]])
  .horn(-84,-66,-88,-79,3.2,-1.5)
  .detail(dHoles([[-64,-60,4,4.2],[-87,-56,2.6,2.2],[-55,-50,2.4,3]])).detail(dLines([[-92,-48,-78,-46]]));
 /* 2 the frill with the two long brow horns */
 const fr=Bld().ell(-40,-79,15,23,-.55);
 for(let i=0;i<9;i++){const a=-Math.PI*.98+i*Math.PI*.15,ca=Math.cos(-.55),sa=Math.sin(-.55),ex=Math.cos(a)*15.5,ey=Math.sin(a)*23.5;fr.ell(-40+ex*ca-ey*sa,-79+ex*sa+ey*ca,2.6,2.6);}
 fr.horn(-60,-72,-90,-101,3.2,2).horn(-54,-76,-80,-110,3,2.4);
 A[2]=fr.detail(dLines([[-44,-74,-36,-96],[-44,-74,-26,-86],[-44,-74,-48,-95],[-44,-74,-28,-75]]));
 /* 1 neck: short and stout */
 A[1]=neckOf([[-37,-55,5,.4],[-42,-58,5,.6]]);
 /* 3 back: an arched row and ribs */
 A[3]=backOf(8,-32,7.2,x=>-56-5*Math.cos((x-0)/40),[16,20,22,22,21,18,14],3.6);
 /* 4 front leg */
 A[4]=Bld().bone(-26,-50,-31,-30,3).bone(-31,-30,-27,-10,2.6).bone(-27,-9,-32,-2.5,2).rod(-32,-2.5,-40,-1.5,1.6).rod(-31,-2,-36,1,1.4)
  .detail(dLines([[-28,-44,-30,-35],[-30,-25,-28,-15]]));
 /* 5 hind leg */
 A[5]=Bld().bone(26,-55,20,-30,3.4).bone(20,-30,25,-9,3).bone(25,-8,19,-2.5,2.2).rod(19,-2.5,9,-1.5,1.7).rod(20,-2,13,1,1.5)
  .detail(dLines([[24,-48,21,-37],[21,-25,24,-14]]));
 /* 6 the hip */
 A[6]=Bld().ell(28,-60,13,6,-.05).bone(24,-56,17,-44,2.2).bone(32,-56,37,-45,2)
  .detail((c,lw)=>{dHoles([[24,-57.5,2.3,2.3]])(c,lw);dLines([[19,-61,37,-61]])(c,lw);});
 /* 7 a short tail */
 A[7]=tailOf(8,42,6.2,i=>-57+i*2.6+i*i*.08,4.2,.35,8,.6);
 return A;})();

/* ---- Stegosaurus: 2 = the back plates; 7 = the tail with its four spikes (the thagomizer) ---- */
const P_STEGO=(function(){const A=[];
 const arch=x=>-52-17*Math.cos(x/36);
 /* 0 skull: small, long and low with a little beak */
 A[0]=Bld().poly([[-58,-44],[-63,-50],[-72,-51],[-82,-47],[-90,-42],[-94,-37],[-91,-34],[-80,-32],[-68,-32],[-60,-35]])
  .detail(dHoles([[-66,-44,3,3.2],[-88,-39,1.8,1.4]])).detail(dTeeth([[-86,-34.5,2,1.8],[-82,-33.8,2,1.8],[-78,-33.4,2,1.8],[-74,-33.2,2,1.8]],true));
 /* 2 the plates: two staggered rows of tall rounded plates */
 const pl=Bld(),PL=[[-36,13],[-23.5,20],[-11,26],[1.5,29],[14,25],[26.5,19],[39,12]];
 const plateAt=(x,h,w,lean)=>{const y=arch(Math.min(x,40))-1;pl.poly([[x-w,y],[x-w*1.15,y-h*.45],[x-w*.6+lean*.4,y-h*.85],[x+lean,y-h],[x+w*.7+lean*.6,y-h*.8],[x+w*1.15,y-h*.4],[x+w,y]]);return[x,y,h,lean];};
 const PL2=[[-29.5,15],[-17,21],[-4.5,26],[8,26],[20.5,21],[33,15]];const pp2=PL2.map(([x,h])=>plateAt(x,h,h*.15+1.2,1+h*.05)); /* the second row sits in the gaps, behind */
 const pp=PL.map(([x,h],i)=>plateAt(x,h,h*.16+1.4,1+h*.06)).concat(pp2);
 A[2]=pl.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.6;c.beginPath();pp.forEach(([x,y,h,l])=>{c.moveTo(x,y-1);c.lineTo(x+l*.8,y-h*.8);c.moveTo(x-h*.12,y-2);c.lineTo(x-h*.06+l*.4,y-h*.55);c.moveTo(x+h*.12,y-2);c.lineTo(x+h*.12+l*.4,y-h*.55);});c.stroke();});
 /* 1 neck: dipping down to the low head */
 A[1]=neckOf([[-42,-48,4.4,.2],[-48,-45,4.2,.1],[-54,-43,4,0]]);
 /* 3 the arched back and ribs */
 A[3]=backOf(9,-38,8.4,arch,[16,20,22,23,22,20,17,12],3.5);
 /* 4 the short front leg */
 A[4]=Bld().bone(-30,-48,-34,-27,2.8).bone(-34,-27,-31,-9,2.4).bone(-31,-8,-36,-2.5,1.8).rod(-36,-2.5,-43,-1.5,1.5).rod(-35,-2,-40,1,1.3)
  .detail(dLines([[-31,-42,-33,-33],[-33,-22,-32,-14]]));
 /* 5 the long hind leg */
 A[5]=Bld().bone(24,-60,18,-32,3.4).bone(18,-32,22,-9,2.9).bone(22,-8,16,-2.5,2.1).rod(16,-2.5,6,-1.5,1.7).rod(17,-2,10,1,1.5)
  .detail(dLines([[22,-53,19,-40],[19,-26,21,-15]]));
 /* 6 the hip */
 A[6]=Bld().ell(26,-63,12,6,.12).bone(22,-59,15,-46,2.2).bone(30,-58,36,-47,2)
  .detail((c,lw)=>{dHoles([[22,-60.5,2.3,2.3]])(c,lw);dLines([[17,-65,35,-61]])(c,lw);});
 /* 7 the tail and the thagomizer: four long spikes at the end */
 const tl=tailOf(8,40,6.4,i=>-58+i*2.6,4,.32,5,.5);
 tl.horn(78,-41,82,-63,2.6,-2).horn(84,-38,96,-56,2.4,-2).horn(80,-37,74,-56,2.2,2).horn(88,-36,100,-44,2.2,-1.5);
 A[7]=tl;
 return A;})();

/* ---- Brachiosaurus: 1 = the lower neck, 2 = the upper neck (it needs two pieces!) ---- */
const P_BRACHIO=(function(){const A=[];
 const nk=(k)=>{const x=-30-32*k-5*Math.sin(Math.PI*k),y=-90-38*k;return[x,y];};
 /* 0 skull: small, with a tall bump for the nose on top */
 A[0]=Bld().poly([[-64,-127],[-66,-135],[-71,-141],[-78,-143],[-83,-139],[-89,-134],[-95,-130],[-97,-125],[-92,-122],[-78,-121],[-67,-121]])
  .detail(dHoles([[-70,-131,3,3.3],[-79,-137.5,3,2]])).detail(dTeeth([[-94,-123,1.6,2],[-90.5,-122.4,1.6,2],[-87,-122,1.6,2],[-83.5,-121.8,1.6,2]],true));
 const neckPart=(k0,k1,n)=>{const b=Bld(),v=[];for(let i=0;i<n;i++){const k=k0+(k1-k0)*i/(n-1),[x,y]=nk(k);b.rod(x,y,x+3.4,y-5,1.5);b.ell(x,y,5.4-k*1.4,3.4,-.86);v.push([x,y,1.5]);}return b.detail(dRings(v));};
 A[1]=neckPart(0,.42,4);
 A[2]=neckPart(.56,.98,4);
 /* 3 back: high at the shoulders, sloping down to the hip, with long ribs */
 A[3]=backOf(8,-24,6.4,x=>-84+(x+24)*.32,[20,24,26,26,24,20,16],3.6);
 /* 4 the tall front leg */
 A[4]=Bld().bone(-22,-78,-26,-44,3.2).bone(-26,-44,-22,-10,2.8).bone(-22,-9,-27,-2.5,2.1).rod(-27,-2.5,-34,-1.5,1.6).rod(-26,-2,-31,1,1.4)
  .detail(dLines([[-23,-71,-25,-52],[-25,-38,-23,-17]]));
 /* 5 the shorter hind leg */
 A[5]=Bld().bone(24,-66,17,-38,3.4).bone(17,-38,21,-10,2.9).bone(21,-9,15,-2.5,2.1).rod(15,-2.5,6,-1.5,1.7).rod(16,-2,10,1,1.5)
  .detail(dLines([[22,-59,19,-46],[18,-32,20,-17]]));
 /* 6 the hip */
 A[6]=Bld().ell(25,-70,12,6,.12).bone(21,-66,14,-53,2.2).bone(29,-65,35,-54,2)
  .detail((c,lw)=>{dHoles([[21,-67.5,2.3,2.3]])(c,lw);dLines([[16,-72,34,-68]])(c,lw);});
 /* 7 the tail, sloping down */
 A[7]=tailOf(10,38,6.4,i=>-68+i*3+i*i*.12,4.2,.3,7,.6);
 return A;})();

/* ---- Ankylosaurus: 2 = the armour plates; 7 = the tail club ---- */
const P_ANKY=(function(){const A=[];
 const bk=x=>-40-4*Math.cos(x/30);
 /* 0 skull: wide and short, with horns at the back corners */
 A[0]=Bld().poly([[-44,-46],[-48,-53],[-56,-54],[-66,-52],[-74,-48],[-80,-42],[-80,-36],[-73,-32],[-58,-31],[-47,-35]])
  .horn(-48,-51,-42,-58,2.8,1).horn(-47,-37,-40,-33,2.6,-1)
  .detail(dHoles([[-60,-44,3.2,3.2],[-75,-41,2,1.6]])).detail(dLines([[-52,-52,-70,-49]]));
 /* 1 neck: short */
 A[1]=neckOf([[-37,-42,4.4,.2],[-42,-44,4.2,.1]]);
 /* 2 the armour: rows of bony plates (and side spikes) that covered its back */
 const ar=Bld(),studs=[];
 for(let i=0;i<7;i++){const x=-27+i*8.6;studs.push([x,bk(x)-15,4.6]);}
 for(let i=0;i<8;i++){const x=-31+i*8.6;studs.push([x,bk(x)-7,4]);}
 studs.forEach(([x,y,s])=>ar.poly([[x-s,y+s*.55],[x-s*.85,y-s*.35],[x,y-s*1.25],[x+s*.85,y-s*.35],[x+s,y+s*.55]]));
 ar.horn(-31,-50,-43,-62,3,-1).horn(-23,-55,-29,-70,3,-1);
 A[2]=ar.detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.7;c.beginPath();studs.forEach(([x,y,s])=>{c.moveTo(x,y-s*1.05);c.lineTo(x,y+s*.4);});c.stroke();});
 /* 3 back: low, with short wide ribs */
 A[3]=backOf(8,-32,7.6,bk,[12,14,15,15,14,12,10],3.4);
 /* 4 front leg: short and stout */
 A[4]=Bld().bone(-24,-37,-28,-20,3).bone(-28,-20,-26,-8,2.7).bone(-26,-7,-31,-2.5,2).rod(-31,-2.5,-38,-1.5,1.6).rod(-30,-2,-35,1,1.4);
 /* 5 hind leg */
 A[5]=Bld().bone(20,-38,15,-21,3.4).bone(15,-21,19,-8,3).bone(19,-7,13,-2.5,2.1).rod(13,-2.5,4,-1.5,1.7).rod(14,-2,8,1,1.5);
 /* 6 the hip: very wide */
 A[6]=Bld().ell(20,-43,14,5.6,0).bone(16,-40,11,-30,2.2).bone(25,-40,30,-31,2)
  .detail((c,lw)=>{dHoles([[16,-41.5,2.2,2.2]])(c,lw);dLines([[9,-45,31,-45]])(c,lw);});
 /* 7 the tail and its big bony club */
 const tl=tailOf(8,36,6.2,i=>-41+i*1.2,3.8,.25,4,.5);
 tl.rod(36,-42,84,-32,1).ell(91,-31,8.5,6.5).ell(83,-31,5,4.6);
 A[7]=tl.detail((c,lw)=>{c.fillStyle=BONE2;[[89,-34,2.4,1.6],[94,-29,1.8,1.3],[83,-30,1.4,1.1]].forEach(([x,y,rx,ry])=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();});});
 return A;})();

/* ---- Parasaurolophus: 2 = the long hollow head crest ---- */
const P_PARA=(function(){const A=[];
 /* 0 skull: a duck-bill face */
 A[0]=Bld().poly([[-45,-94],[-50,-102],[-60,-104],[-70,-100],[-80,-98],[-90,-97],[-97,-95],[-99,-91],[-96,-88],[-84,-88],[-70,-87],[-56,-86],[-47,-89]])
  .detail(dHoles([[-56,-96,3.6,3.6],[-88,-94,2.4,1.6]])).detail(dLines([[-96,-90,-72,-89.5]]));
 /* 2 the crest: a long tube that swept back from the head (it worked like a trumpet!) */
 A[2]=Bld().poly([[-62,-101],[-55,-108],[-44,-116],[-32,-122],[-20,-126],[-12,-126],[-9,-122],[-13,-118],[-26,-115],[-40,-109],[-50,-102],[-54,-99]])
  .detail((c,lw)=>{c.strokeStyle=BONE2;c.lineWidth=lw*.9;c.beginPath();c.moveTo(-54,-104);c.quadraticCurveTo(-36,-117,-14,-122);c.stroke();});
 /* 1 neck: curving up to the head */
 A[1]=neckOf([[-29,-71,4.8,.4],[-34,-77,4.6,.8],[-38,-83.5,4.4,1.1],[-41,-90,4.2,1.3]]);
 /* 3 back and ribs */
 A[3]=backOf(7,-22,6.4,x=>-67,[16,20,22,21,19,15],3.4);
 /* 4 arm: slim, with a small hand */
 A[4]=Bld().bone(-17,-57,-22,-40,1.9).bone(-22,-40,-25,-24,1.7).rod(-25,-24,-29,-18,1.3).rod(-25,-24,-27,-17,1.2).claw(-29,-18,3,-1).claw(-27,-17,3,-.4);
 /* 5 leg */
 A[5]=Bld().bone(23,-58,15,-33,3.2).bone(15,-33,21,-9,2.7).bone(21,-8,15,-2.5,2).rod(15,-2.5,5,-1.5,1.6).rod(16,-2,9,1,1.4)
  .detail(dLines([[21,-51,17,-40],[16,-27,19,-15]]));
 /* 6 hip */
 A[6]=Bld().ell(26,-65,12,6,-.06).bone(22,-61,13,-50,2.1).bone(30,-61,35,-49,2)
  .detail((c,lw)=>{dHoles([[22,-62.5,2.2,2.2]])(c,lw);dLines([[17,-67,34,-66]])(c,lw);});
 /* 7 a deep tail with tall spines */
 A[7]=tailOf(9,40,7.2,i=>-63+i*1.6+i*i*.08,4.2,.3,14,.8);
 return A;})();

/* ---- Velociraptor: 2 = the big sickle claw on its foot ---- */
const P_RAPTOR=(function(){const A=[];
 /* 0 skull: long and low with lots of sharp teeth */
 const tt=[];for(let i=0;i<7;i++)tt.push([-95+i*5,-75.6,2.6,3.6]);
 const sk=Bld().poly([[-42,-79],[-46,-87],[-56,-90],[-70,-88],[-84,-84],[-95,-81],[-99,-78],[-96,-75],[-84,-75],[-66,-75],[-52,-75],[-44,-74]]);
 tt.forEach(([x,y,w,h])=>sk.poly([[x-.3,y-1.4],[x+w+.3,y-1.4],[x+w/2,y+h]]));
 A[0]=sk.detail(dHoles([[-52,-83,4,4],[-67,-81.5,5.5,2.6],[-92,-80,1.8,1.3]])).detail(dTeeth(tt,true));
 /* 1 neck: an S-curve */
 A[1]=neckOf([[-29,-60,4.2,.3],[-34,-65,4.2,.7],[-38,-71,4,1.1],[-40,-77,3.8,1.4]]);
 /* 2 the sickle claw: the big curved killing claw on the second toe, held up off the ground */
 A[2]=Bld().rod(10,-6,4,-9,1.6).rod(4,-9,-1,-8,1.4).poly([[0,-11],[-5,-15],[-11,-14.5],[-15,-10],[-17,-4],[-16.4,-1.6],[-14,-5.6],[-10,-9],[-5.6,-9.6],[-1.4,-6.6]])
  .detail(dLines([[-3,-12,-12,-11.6]]));
 /* 3 back and ribs */
 A[3]=backOf(7,-24,6.2,x=>-57,[13,16,17,16,14,11],3.2);
 /* 4 arm: long, with three long clawed fingers */
 A[4]=Bld().bone(-16,-52,-22,-40,1.8).bone(-22,-40,-32,-35,1.6).rod(-32,-35,-40,-31,1.1).rod(-32,-35,-41,-35,1.1).rod(-32,-34,-38,-28,1)
  .claw(-40,-31,4,-1).claw(-41,-35,4,-1).claw(-38,-28,3.6,-.6);
 /* 5 leg: long and slim, foot on two toes */
 A[5]=Bld().bone(12,-54,3,-32,2.7).bone(3,-32,13,-12,2.3).bone(13,-11,11,-3,1.8).rod(11,-2.5,0,-1.5,1.4).rod(12,-2,19,-.5,1.2).claw(0,-2.4,3.4,-1)
  .detail(dLines([[10,-48,5,-38],[6,-27,11,-17]]));
 /* 6 hip: the pubis points backwards, like a bird's */
 A[6]=Bld().ell(15,-59,10,5,-.05).bone(12,-55,22,-38,1.9).bone(19,-55,26,-47,1.7)
  .detail((c,lw)=>{dHoles([[12,-56.5,2.1,2.1]])(c,lw);dLines([[8,-61,23,-60]])(c,lw);});
 /* 7 a long, stiff tail */
 const tl=tailOf(10,28,7.6,i=>-59+i*.6,3.4,.2,5,.5);tl.rod(29,-61.6,98,-55.6,.9);
 A[7]=tl;
 return A;})();

/* ---------------- every dinosaur in one place ---------------- */
const EGGS={
 trex:{shell:'#f6e4cf',shade:'#e0c3a0',specks:['#c2622a','#8a5a2e','#e8590c'],inside:'#ead5b8',baby:TREX.b,accent:TREX.d,kind:'trex'},
 trike:{shell:'#e3f1fb',shade:'#b9d6ec',specks:['#339af0','#f08c00','#74c0fc'],inside:'#cfe3f1',baby:TRIKE.b,accent:TRIKE.f,kind:'trike'},
 stego:{shell:'#eef7dc',shade:'#cfe3a8',specks:['#e64980','#5c9e3a','#ff8fab'],inside:'#dbe9be',baby:STEGO.b,accent:STEGO.p,kind:'stego'},
 brachio:{shell:'#efeafc',shade:'#d3c8f2',specks:['#845ef7','#b197fc','#9c8257'],inside:'#ddd4f3',baby:BRACHIO.b,accent:BRACHIO.d,kind:'brachio'},
 ankylo:{shell:'#efe0c0',shade:'#d4b98a',specks:['#8c5a26','#b5793a','#6b4a1e'],inside:'#e2cfa6',baby:ANKY.b,accent:ANKY.a,kind:'ankylo'},
 para:{shell:'#fbe9f1',shade:'#eec5d6',specks:['#cc5de8','#f06595','#9c36b5'],inside:'#f0d3df',baby:PARA.b,accent:PARA.c,kind:'para'},
 raptor:{shell:'#e6eaf5',shade:'#c3cbe3',specks:['#4c6ef5','#ffa94d','#5c677d'],inside:'#d4dae9',baby:RAPTOR.b,accent:RAPTOR.f,kind:'raptor'}};
const dino=(name,baby,PS,label,order,posts,egg,parts)=>({name,baby,bone:boneDrawer(PS),skeleton:skeletonDrawer(PS,label,order,posts),egg,parts});
const DINOS={
 spino:{name:'Spinosaurus',baby:drawSpino,bone:drawBone,skeleton:drawSkeleton,egg:EGG_SPINO,parts:BONE_NAMES},
 trex:dino('Tyrannosaurus rex',drawTrex,P_TREX,'TYRANNOSAURUS REX',[7,5,3,6,1,2,0,4],[[-8,-58],[40,-58]],EGGS.trex,['skull','neck','jaw','back','arm','leg','hip','tail']),
 trike:dino('Triceratops',drawTrike,P_TRIKE,'TRICERATOPS',[7,5,3,6,2,1,0,4],[[-12,-54],[38,-55]],EGGS.trike,['skull','neck','frill','back','arm','leg','hip','tail']),
 stego:dino('Stegosaurus',drawStego,P_STEGO,'STEGOSAURUS',[2,7,5,3,6,1,0,4],[[-14,-66],[34,-60]],EGGS.stego,['skull','neck','plates','back','arm','leg','hip','tail']),
 brachio:dino('Brachiosaurus',drawBrachio,P_BRACHIO,'BRACHIOSAURUS',[7,5,3,6,1,2,0,4],[[-10,-80],[34,-68]],EGGS.brachio,['skull','neck','neck2','back','arm','leg','hip','tail']),
 ankylo:dino('Ankylosaurus',drawAnky,P_ANKY,'ANKYLOSAURUS',[7,5,3,6,1,0,4,2],[[-8,-38],[42,-40]],EGGS.ankylo,['skull','neck','armour','back','arm','leg','hip','tail']),
 para:dino('Parasaurolophus',drawPara,P_PARA,'PARASAUROLOPHUS',[7,5,3,6,1,0,2,4],[[-10,-64],[44,-60]],EGGS.para,['skull','neck','crest','back','arm','leg','hip','tail']),
 raptor:dino('Velociraptor',drawRaptor,P_RAPTOR,'VELOCIRAPTOR',[7,5,2,3,6,1,0,4],[[-10,-55],[34,-57]],EGGS.raptor,['skull','neck','claw','back','arm','leg','hip','tail']),
 dakota:dino('Dakotaraptor',drawRaptor,P_RAPTOR,'DAKOTARAPTOR',[7,5,2,3,6,1,0,4],[[-10,-55],[34,-57]],EGGS.raptor,['skull','neck','claw','back','arm','leg','hip','tail'])}; /* the dig site's North American raptor (same drawing, its own name) */

window.MQ_PONDPETS={dottie:drawDottie,spino:drawSpino,egg:drawEgg,bone:drawBone,skeleton:drawSkeleton,
 trex:drawTrex,trike:drawTrike,stego:drawStego,brachio:drawBrachio,ankylo:drawAnky,para:drawPara,raptor:drawRaptor,dinos:DINOS};
})();
