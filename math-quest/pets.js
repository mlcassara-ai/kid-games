/* pets.js — the hero's pet on the world map as a floating pet (owner's mockup, Oct 2026; Castle Crashers style, no legs).
   Every pet is drawn here: Ember, Whiskers, Nova, Sparkle, Titan and Atlas have their own drawings, the rest are built from
   shared parts (CR, CRITTERS) so they look like one family. The pet tags along beside the hero (keeping pace as they walk),
   bobs, blinks, turns the way it flies, and reacts only to the hero's big moments: a happy loop for a cheer or level up,
   a startled puff at a sneeze or zap, a nap when the hero dozes. The map falls back to the pet's emoji if anything throws.
   Pet drawings are centred on (0,0), about 92 units to a map square. */
(function(){
'use strict';
const INK='#2b2140';
const cache={};const P=s=>cache[s]||(cache[s]=new Path2D(s));
function ell(cx,cy,rx,ry){const p=new Path2D();p.ellipse(cx,cy,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);return p;}
function fs(c,path,fill,w){c.fillStyle=fill;c.fill(path);if(w!==0){c.lineWidth=w||2.5;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';c.stroke(path);}}
function star(c,x,y,r,col){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=col;c.fill();c.lineWidth=1;c.strokeStyle=INK;c.stroke();}
const lerp=(a,b,k)=>a+(b-a)*k,clamp01=k=>Math.max(0,Math.min(1,k)),smooth=k=>k*k*(3-2*k);
/* ---------------- Ember the fox: a floating pet (no legs, a wispy flame-tipped tail) ---------------- */
const FOX='#ff8a3d',FOX2='#e5642a',CREAM='#fff3e0';
function heart(c,x,y,r,col){c.save();c.translate(x,y);c.scale(r/10,r/10);const p=new Path2D('M0 8 C-10 0 -9 -8 -4 -8 C-1 -8 0 -5 0 -4 C0 -5 1 -8 4 -8 C9 -8 10 0 0 8Z');fs(c,p,col,1.6);c.restore();}
/* the fox in its own units: body centre (0,0), about 44 wide and 64 tall. view 'front' or 'side' (facing left). */
function drawPet(c,o){if(CRITTERS[o.kind])return drawCritter(c,o);if(o.kind==='cat')return drawCat(c,o);if(o.kind==='nova')return drawNova(c,o);if(o.kind==='unicorn')return drawUnicorn(c,o);if(o.kind==='titan')return drawTitan(c,o);if(o.kind==='whale')return drawWhale(c,o);const t=o.t,sw=Math.sin(t*3)*3.2,nap=o.mode==='nap',lx=o.lx||0,ly=o.ly||0;
 c.save();if(o.puff){c.scale(1.18,1.18);}
 if(o.view==='front'){
  /* tail: a wisp curling down and round to one side, white tip */
  const tx=13+sw,ty=nap?20:31;
  fs(c,new Path2D(`M-7 12 Q-9 ${ty-3} ${tx-5} ${ty} Q${tx+5} ${ty+1} ${tx+2} ${ty-7} Q7 ${ty-11} 7 12Z`),FOX,2);
  fs(c,ell(tx-1,ty-2.5,4.6,3.6),CREAM,1.6);
  if(o.puff){c.save();c.fillStyle=FOX;c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=i%2?19:24;c.lineTo(Math.cos(a)*r*1.05,-8+Math.sin(a)*r*.95);}c.closePath();c.fill();c.stroke();c.restore();}
  fs(c,ell(0,12,14,12),FOX,2);fs(c,ell(0,14,8.5,7.5),CREAM,0);
  /* ears */
  const ed=nap?4:0;
  fs(c,P(`M-15 -14 L${-14-ed} ${-31+ed*2} L-3 -21Z`),FOX,2);fs(c,P(`M15 -14 L${14+ed} ${-31+ed*2} L3 -21Z`),FOX,2);
  fs(c,P(`M-12 -17 L${-12-ed} ${-27+ed*2} L-6 -21Z`),'#6b2f1a',0);fs(c,P(`M12 -17 L${12+ed} ${-27+ed*2} L6 -21Z`),'#6b2f1a',0);
  fs(c,P('M-15 -9 L-23 0 L-17 0 L-20 4 L-11 3Z'),CREAM,1.8);fs(c,P('M15 -9 L23 0 L17 0 L20 4 L11 3Z'),CREAM,1.8); /* fluffy fox cheeks */
  fs(c,ell(0,-8,17,15),FOX,2.2);
  fs(c,P('M-16 -6 Q-8 7 0 5 Q8 7 16 -6 Q8 0 0 -1 Q-8 0 -16 -6Z'),CREAM,0);
  /* eyes, nose, mouth */
  if(nap||o.blink){c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';[-6,6].forEach(x=>{c.beginPath();c.moveTo(x-3,-8);c.quadraticCurveTo(x,-6,x+3,-8);c.stroke();});}
  else if(o.happy){c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';[-6,6].forEach(x=>{c.beginPath();c.moveTo(x-3,-7);c.quadraticCurveTo(x,-11,x+3,-7);c.stroke();});}
  else [-6,6].forEach(x=>{fs(c,ell(x+lx,-9+ly,o.puff?3.6:3,o.puff?4.2:3.6),INK,0);fs(c,ell(x+lx+1,-10.4+ly,1.1,1.1),'#fff',0);});
  c.globalAlpha=.45;fs(c,ell(-11,-2,2.6,1.8),'#ff6f91',0);fs(c,ell(11,-2,2.6,1.8),'#ff6f91',0);c.globalAlpha=1;
  fs(c,ell(0,-1.5,2.3,1.6),INK,0);
  c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();if(o.puff){c.ellipse(0,3.2,1.6,1.9,0,0,Math.PI*2);}else{c.moveTo(-2.6,1.6);c.quadraticCurveTo(-1.3,3.2,0,1.8);c.quadraticCurveTo(1.3,3.2,2.6,1.6);}c.stroke();
 }else{
  /* side, facing left: tail streams out behind */
  const tx=29+sw*.6,ty=(nap?16:0)+Math.sin(t*2.2)*3;
  fs(c,new Path2D(`M11 6 Q21 4 ${tx-3} ${ty} Q${tx+5} ${ty-3} ${tx+2} ${ty+5} Q21 17 11 16Z`),FOX,2);
  fs(c,ell(tx+1,ty+1,4.2,3.6),CREAM,1.6);
  if(o.puff){c.save();c.fillStyle=FOX;c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=i%2?19:24;c.lineTo(2+Math.cos(a)*r,-6+Math.sin(a)*r*.95);}c.closePath();c.fill();c.stroke();c.restore();}
  fs(c,ell(4,12,14,11.5),FOX,2);fs(c,ell(-3,14,7,6.5),CREAM,0);
  const ed=nap?3:0;
  fs(c,P(`M6 -18 L${12+ed} ${-32+ed*2} L15 -15Z`),FOX2,2);
  fs(c,ell(2,-8,15,14),FOX,2.2);
  fs(c,P('M-9 -11 Q-21 -8 -21 -2 Q-19 3 -8 3Z'),FOX,2);fs(c,P('M-21 -2 Q-19 3 -8 3 Q-6 -2 -12 -3Z'),CREAM,0);
  fs(c,P(`M-1 -18 L${3-ed} ${-34+ed*2} L9 -19Z`),FOX,2);fs(c,P(`M1.5 -19 L${3.5-ed} ${-29+ed*2} L6.5 -19.5Z`),'#6b2f1a',0);
  fs(c,ell(-21,-4,2.3,1.9),INK,0);
  if(nap||o.blink){c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(-10,-9);c.quadraticCurveTo(-7,-7,-4,-9);c.stroke();}
  else if(o.happy){c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(-10,-8);c.quadraticCurveTo(-7,-12,-4,-8);c.stroke();}
  else{fs(c,ell(-7+lx*.5,-9+ly,o.puff?3.3:2.7,o.puff?4:3.4),INK,0);fs(c,ell(-6+lx*.5,-10.3+ly,1,1),'#fff',0);}
  c.globalAlpha=.45;fs(c,ell(-6,-1,2.6,1.8),'#ff6f91',0);c.globalAlpha=1;
 }
 c.restore();}


/* Whiskers the cat: grey tabby, green eyes, a thin wispy tail with a curl at the tip */
const GREY='#a7b0c2',STRIPE='#6f7a90',PINK='#ffb3c6';
function catSpikes(c,cx,cy){c.save();c.fillStyle=GREY;c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=i%2?18:24;c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.95);}c.closePath();c.fill();c.stroke();c.restore();}
function whiskers(c,pts){c.strokeStyle=INK;c.lineWidth=1;c.lineCap='round';c.beginPath();pts.forEach(([x0,y0,x1,y1])=>{c.moveTo(x0,y0);c.lineTo(x1,y1);});c.stroke();}
function catEyes(c,pts,o){const lx=o.lx||0,ly=o.ly||0;c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';
 pts.forEach(([x,y])=>{if(o.mode==='nap'||o.blink){c.beginPath();c.moveTo(x-3,y);c.quadraticCurveTo(x,y+2,x+3,y);c.stroke();}
  else if(o.happy){c.beginPath();c.moveTo(x-3,y+1);c.quadraticCurveTo(x,y-3,x+3,y+1);c.stroke();}
  else{const big=o.puff?1.2:1;fs(c,ell(x,y,3.3*big,3.9*big),'#8ce99a',1.4);fs(c,ell(x+lx*.6,y+ly*.6,o.puff?2:1.1,3*big),INK,0);fs(c,ell(x+lx*.6+1,y+ly*.6-1.4,.9,.9),'#fff',0);}});}
function drawCat(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap';c.save();if(o.puff)c.scale(1.15,1.15);
 if(o.view==='front'){
  const tx=12+sw,ty=nap?20:30;
  fs(c,new Path2D(`M-4 13 Q-6 ${ty} ${tx-3} ${ty+1} Q${tx+6} ${ty} ${tx+4} ${ty-6} Q${tx+1} ${ty-9} ${tx-1} ${ty-5} Q${tx-2} ${ty-3} ${tx-4} ${ty-3} Q4 ${ty-6} 4 13Z`),GREY,1.8);
  c.strokeStyle=STRIPE;c.lineWidth=1.6;c.beginPath();c.moveTo(tx+2,ty-6);c.lineTo(tx+5,ty-3);c.stroke();
  if(o.puff)catSpikes(c,0,-6);
  fs(c,ell(0,12,14,12),GREY,2);fs(c,ell(0,14,8,7),'#fff',0);
  const ed=nap?3:0;
  fs(c,P(`M-15 -11 L${-13-ed} ${-27+ed*2} L-4 -19Z`),GREY,2);fs(c,P(`M15 -11 L${13+ed} ${-27+ed*2} L4 -19Z`),GREY,2);
  fs(c,P(`M-12.5 -14 L${-12-ed} ${-23+ed*2} L-7 -18Z`),PINK,0);fs(c,P(`M12.5 -14 L${12+ed} ${-23+ed*2} L7 -18Z`),PINK,0);
  fs(c,ell(0,-7,17,14.5),GREY,2.2);
  c.strokeStyle=STRIPE;c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(-4,-20);c.lineTo(-3,-15);c.moveTo(0,-21.5);c.lineTo(0,-16);c.moveTo(4,-20);c.lineTo(3,-15);c.moveTo(-16,-7);c.lineTo(-12,-6);c.moveTo(16,-7);c.lineTo(12,-6);c.stroke();
  fs(c,ell(-3.6,0,5,3.6),'#fff',0);fs(c,ell(3.6,0,5,3.6),'#fff',0);
  catEyes(c,[[-6.5,-8],[6.5,-8]],o);
  c.globalAlpha=.4;fs(c,ell(-11,-1,2.4,1.6),'#ff6f91',0);fs(c,ell(11,-1,2.4,1.6),'#ff6f91',0);c.globalAlpha=1;
  fs(c,P('M-2 -2.6 L2 -2.6 L0 -.4Z'),'#ff8fab',1);
  c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();if(o.puff){c.ellipse(0,2.6,1.5,1.8,0,0,Math.PI*2);}else{c.moveTo(-2.6,1);c.quadraticCurveTo(-1.3,2.6,0,1.2);c.quadraticCurveTo(1.3,2.6,2.6,1);}c.stroke();
  whiskers(c,[[-8,0,-19,-2],[-8,1.5,-19,2.5],[8,0,19,-2],[8,1.5,19,2.5]]);
 }else{
  const tx=27+sw*.6,ty=(nap?14:-4)+Math.sin(t*2)*3;
  fs(c,new Path2D(`M11 7 Q21 5 ${tx-2} ${ty} Q${tx+1} ${ty-7} ${tx+5} ${ty-6} Q${tx+8} ${ty-2} ${tx+4} ${ty+1} Q${tx+3} ${ty+4} ${tx+1} ${ty+5} Q21 15 11 15Z`),GREY,1.8);
  c.strokeStyle=STRIPE;c.lineWidth=1.6;c.beginPath();c.moveTo(tx-4,ty+1);c.lineTo(tx-3,ty+5);c.stroke();
  if(o.puff)catSpikes(c,3,-5);
  fs(c,ell(4,12,14,11.5),GREY,2);fs(c,ell(-3,14,7,6),'#fff',0);
  const ed=nap?3:0;
  fs(c,P(`M6 -14 L${11+ed} ${-27+ed*2} L14 -12Z`),'#8d97aa',2);
  fs(c,ell(1,-7,15,13.5),GREY,2.2);
  fs(c,ell(-11,-2,6.5,5),GREY,0);fs(c,ell(-11,0.5,5.5,3.4),'#fff',0);
  c.strokeStyle=STRIPE;c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(3,-19.5);c.lineTo(4,-14);c.moveTo(8,-17);c.lineTo(8,-12);c.moveTo(12,-12);c.lineTo(10,-8);c.stroke();
  fs(c,P(`M-3 -15 L${0-ed} ${-28+ed*2} L6 -17Z`),GREY,2);fs(c,P(`M-.8 -16 L${.5-ed} ${-24+ed*2} L4 -17Z`),PINK,0);
  fs(c,ell(-17,-3.5,1.8,1.4),'#ff8fab',1);
  catEyes(c,[[-6,-8]],o);
  c.globalAlpha=.4;fs(c,ell(-5,-1,2.4,1.6),'#ff6f91',0);c.globalAlpha=1;
  whiskers(c,[[-12,-1,-24,-4],[-12,.5,-24,1.5]]);
 }
 c.restore();}


/* ---- four more floating pets: Nova the Star Jelly, Sparkle the unicorn, Titan the dinosaur, Atlas the whale ---- */
/* shared eyes: open (with a shine), closed (asleep or blinking), happy ^ ^ */
function pEyes(c,pts,o,rx,ry){const lx=o.lx||0,ly=o.ly||0,big=o.puff?1.25:1;c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';
 pts.forEach(([x,y])=>{if(o.mode==='nap'||o.blink){c.beginPath();c.moveTo(x-rx,y);c.quadraticCurveTo(x,y+2,x+rx,y);c.stroke();}
  else if(o.happy){c.beginPath();c.moveTo(x-rx,y+1);c.quadraticCurveTo(x,y-3,x+rx,y+1);c.stroke();}
  else{fs(c,ell(x+lx*.6,y+ly*.6,rx*big,ry*big),INK,0);fs(c,ell(x+lx*.6+rx*.35,y+ly*.6-ry*.4,rx*.38,rx*.38),'#fff',0);}});}
function smile(c,x,y,w,open){c.strokeStyle=INK;c.lineWidth=1.5;c.lineCap='round';c.beginPath();if(open){c.ellipse(x,y+.8,1.6,1.9,0,0,Math.PI*2);}else{c.moveTo(x-w,y);c.quadraticCurveTo(x,y+w*.9,x+w,y);}c.stroke();}
function blush(c,pts){c.globalAlpha=.45;pts.forEach(([x,y])=>fs(c,ell(x,y,2.6,1.7),'#ff6f91',0));c.globalAlpha=1;}

function drawNova(c,o){const t=o.t,nap=o.mode==='nap',side=o.view==='side';c.save();if(o.puff)c.scale(1.15,1.15);
 /* soft glow */
 c.save();c.globalAlpha=nap?.18:.32+.1*Math.sin(t*3);const g=c.createRadialGradient(0,-8,3,0,-8,36);g.addColorStop(0,'#e5dbff');g.addColorStop(1,'rgba(229,219,255,0)');c.fillStyle=g;c.beginPath();c.arc(0,-8,36,0,7);c.fill();c.restore();
 /* tentacles (they trail behind when she moves sideways, and curl up when she naps) */
 for(let i=0;i<5;i++){const x0=-12+i*6;c.beginPath();c.moveTo(x0,1);for(let j=1;j<=6;j++){const q=j/6,y=1+j*(nap?3.2:4.8);const x=x0+Math.sin(t*3.2+i*1.3+j*.8)*2.4*q+(side?9*q:0)+(nap?Math.sin(j*1.3+i)*3*q:0);c.lineTo(x,y);}
  c.lineCap='round';c.lineJoin='round';c.strokeStyle=INK;c.lineWidth=4.6;c.stroke();c.strokeStyle=i%2?'#d0bfff':'#a5d8ff';c.lineWidth=2.6;c.stroke();}
 /* the bell, breathing a little */
 const pz=1+Math.sin(t*3)*.04;c.save();c.translate(0,-8);c.scale(1/pz,pz);c.translate(0,8);
 const bell=new Path2D('M-20 2 Q-21 -25 0 -25 Q21 -25 20 2 Q15 6 10 2 Q5 6 0 2 Q-5 6 -10 2 Q-15 6 -20 2Z');
 const bg=c.createLinearGradient(0,-25,0,4);bg.addColorStop(0,'#d0bfff');bg.addColorStop(1,'#9775fa');fs(c,bell,bg,2.2);
 c.globalAlpha=.6;fs(c,ell(-9,-16,5,3),'#fff',0);c.globalAlpha=1;c.restore();
 /* her star, spinning and glowing on top */
 c.save();c.translate(side?-2:0,-31+Math.sin(t*2)*1.5);c.rotate(t*1.4);c.shadowColor='#ffd43b';c.shadowBlur=nap?2:10;star(c,0,0,7.5,'#ffd43b');c.restore();
 const ex=side?-5:0;pEyes(c,side?[[-12,-10],[-3,-10]]:[[-7,-10],[7,-10]],o,2.8,3.4);blush(c,side?[[-15,-4],[1,-4]]:[[-12,-4],[12,-4]]);smile(c,ex-1+(side?-2:1),-4,2.6,o.puff);
 if(!nap)for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;if(k<.3){c.globalAlpha=1-k/.3;star(c,[-25,24,-23][i],[-24,-20,4][i],2+k*6,'#fff3bf');c.globalAlpha=1;}}
 c.restore();}

function drawUnicorn(c,o){const t=o.t,sw=Math.sin(t*3)*3,nap=o.mode==='nap',W='#fffaf7',MZ='#ffd6e3';c.save();if(o.puff)c.scale(1.15,1.15);
 const rainbow=(x0,y0,x1,y1)=>{const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#ff8fc0');g.addColorStop(.5,'#b197fc');g.addColorStop(1,'#74c0fc');return g;};
 const horn=(path,lines)=>{fs(c,path,'#ffd43b',1.8);c.strokeStyle='#e8a600';c.lineWidth=1.2;c.beginPath();lines.forEach(([a,b,cc,d])=>{c.moveTo(a,b);c.lineTo(cc,d);});c.stroke();};
 if(o.view==='front'){
  const tx=12+sw,ty=nap?20:30;
  fs(c,new Path2D(`M-6 13 Q-8 ${ty-2} ${tx-5} ${ty} Q${tx+5} ${ty+1} ${tx+2} ${ty-7} Q6 ${ty-10} 6 13Z`),rainbow(-6,13,tx,ty),1.8);
  fs(c,ell(-15,-6,5.5,9),'#ff8fc0',1.8);fs(c,ell(15,-6,5.5,9),'#74c0fc',1.8);
  fs(c,ell(0,13,13,11),W,2);
  fs(c,P('M-13 -15 L-16 -28 L-6 -21Z'),W,2);fs(c,P('M13 -15 L16 -28 L6 -21Z'),W,2);fs(c,P('M-12 -17 L-14 -25 L-8 -20Z'),MZ,0);fs(c,P('M12 -17 L14 -25 L8 -20Z'),MZ,0);
  fs(c,ell(0,-8,16,15),W,2.2);
  fs(c,ell(-6,-21,6,5),'#ff8fc0',1.6);fs(c,ell(6,-21,6,5),'#74c0fc',1.6);fs(c,ell(0,-23,6,5),'#b197fc',1.6);
  horn(P('M-3.6 -23 L0 -42 L3.6 -23Z'),[[-2.6,-27,2.2,-29],[-1.8,-32,1.4,-34],[-1,-37,.8,-38]]);
  fs(c,ell(0,4,8.5,5.6),'#fff0f5',1.4);fs(c,ell(-2.8,4.2,.9,1.2),'#e88aa6',0);fs(c,ell(2.8,4.2,.9,1.2),'#e88aa6',0);smile(c,0,7.2,2.2,o.puff);
  pEyes(c,[[-7,-9],[7,-9]],o,3,3.8);
  if(!(nap||o.blink||o.happy)){c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.moveTo(-10,-12);c.lineTo(-12.5,-14);c.moveTo(10,-12);c.lineTo(12.5,-14);c.stroke();}
  blush(c,[[-12,-2],[12,-2]]);
 }else{
  const tx=29+sw*.6,ty=(nap?14:-2)+Math.sin(t*2.2)*3;
  fs(c,new Path2D(`M10 6 Q21 4 ${tx-3} ${ty} Q${tx+5} ${ty-3} ${tx+2} ${ty+5} Q21 16 10 15Z`),rainbow(10,6,tx,ty),1.8);
  fs(c,ell(5,12,13,10.5),W,2);
  fs(c,ell(10,-14,6,6),'#74c0fc',1.6);fs(c,ell(13,-5,5,7),'#b197fc',1.6);fs(c,ell(11,3,4.5,6),'#ff8fc0',1.6);
  fs(c,ell(-10,-1,9,7),W,2);fs(c,ell(2,-8,13,13),W,2.2);fs(c,ell(-10,-1,8,6),W,0);
  fs(c,ell(-15,0,4.4,5),MZ,0);fs(c,ell(-16.5,-1,1,1.3),INK,0);
  fs(c,P('M2 -18 L4 -30 L10 -19Z'),W,2);fs(c,P('M4 -19 L5 -26 L8 -19.5Z'),MZ,0);
  fs(c,ell(-2,-19,5,4),'#ff8fc0',1.5);fs(c,ell(4,-20,5,4),'#b197fc',1.5);
  horn(P('M-7 -18 L-13 -37 L-1 -20Z'),[[-6,-22,-2.5,-22],[-8.5,-27,-5,-27.5],[-10.5,-32,-8.5,-32.5]]);
  pEyes(c,[[-4,-10]],o,2.8,3.6);
  if(!(nap||o.blink||o.happy)){c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.moveTo(-1.5,-13);c.lineTo(.5,-15.5);c.stroke();}
  blush(c,[[-4,-2]]);
 }
 c.restore();}

function drawTitan(c,o){const t=o.t,sw=Math.sin(t*2.6)*3,nap=o.mode==='nap',G='#63c79a',G2='#3f9e78',BL='#e6f9c8',SP='#9be8c0';c.save();if(o.puff)c.scale(1.15,1.15);
 const spots=pts=>pts.forEach(([x,y,r])=>fs(c,ell(x,y,r,r*.8),SP,0));
 if(o.view==='front'){
  const tx=13+sw,ty=nap?20:29;
  fs(c,new Path2D(`M-7 14 Q-9 ${ty-2} ${tx-4} ${ty} Q${tx+4} ${ty} ${tx+2} ${ty-6} Q7 ${ty-10} 7 14Z`),G,1.8);
  const neck=P('M-6 8 Q-7 -6 -5 -15 L5 -15 Q7 -6 6 8Z'),body=ell(0,13,16,12);
  fs(c,neck,G,2);fs(c,body,G,2);fs(c,neck,G,0);
  fs(c,ell(0,16,10,7),BL,0);spots([[-11,8,2.6],[11,8,2.6],[-6,4,1.8],[7,3,1.6],[0,-6,1.6],[-1,-11,1.3]]);
  const hy=nap?-15:-20;fs(c,ell(0,hy,13,10.5),G,2.2);fs(c,ell(0,hy+5,8,4.4),BL,0);spots([[-5,hy-7,1.8],[4,hy-8,1.5]]);
  fs(c,ell(-3,hy+3.6,.9,.9),INK,0);fs(c,ell(3,hy+3.6,.9,.9),INK,0);
  pEyes(c,[[-6,hy-2],[6,hy-2]],o,2.6,3.2);blush(c,[[-10,hy+3],[10,hy+3]]);smile(c,0,hy+6.5,3,o.puff);
 }else{
  const tx=33+sw*.6,ty=(nap?16:2)+Math.sin(t*2)*2;
  fs(c,new Path2D(`M14 5 Q25 5 ${tx} ${ty} Q26 16 14 17Z`),G,1.8);fs(c,ell(tx-1,ty+.5,2.4,1.8),G2,0);
  const hx=nap?-14:-13,hy=nap?-12:-22;
  const neck=new Path2D(`M-4 7 Q-6 -6 ${hx+2} ${hy+4} L${hx+8} ${hy+1} Q2 -8 6 5Z`),body=ell(6,12,15,11);
  fs(c,neck,G,2);fs(c,body,G,2);fs(c,neck,G,0);
  fs(c,ell(3,16,10,6),BL,0);spots([[12,6,2.6],[4,4,1.8],[16,13,1.8],[-4,-4,1.5]]);
  fs(c,ell(hx-1,hy,11,8),G,2.2);fs(c,ell(hx-6,hy+3,6,3.2),BL,0);fs(c,ell(hx-10.5,hy-1,.9,.9),INK,0);spots([[hx+3,hy-5,1.6]]);
  pEyes(c,[[hx-3,hy-2.5]],o,2.4,3);blush(c,[[hx-3,hy+3]]);
  c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.moveTo(hx-10,hy+4.5);c.quadraticCurveTo(hx-7,hy+6.5,hx-4,hy+5);c.stroke();
 }
 c.restore();}

function drawWhale(c,o){const t=o.t,sw=Math.sin(t*2.4)*3,nap=o.mode==='nap',B=o.tint?'#74c0fc':'#4dabf7',B2=o.tint?'#339af0':'#1c7ed6',BL='#d0ebff';c.save();if(o.puff)c.scale(1.12,1.12);
 const spout=(x,y)=>{const k=(t%4.2)/1.1;if(nap||k>1)return;c.save();c.globalAlpha=Math.min(1,(1-k)*2);c.strokeStyle='#a5d8ff';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x,y-8-k*6);c.stroke();
  for(let i=0;i<6;i++){const a=-Math.PI/2+(i/5-.5)*1.8,r=6+k*12;fs(c,ell(x+Math.cos(a)*r,y-10-k*6+Math.sin(a)*r*.6+k*k*10,1.6,2),'#bfe7ff',0);}c.restore();};
 if(o.view==='front'){
  fs(c,new Path2D(`M8 -10 Q20 -14 ${21+sw*.5} -24 L${26+sw*.5} -22 Q24 -10 12 -4Z`),B,1.8);
  c.save();c.translate(23.5+sw*.5,-24);c.rotate(.35+Math.sin(t*2.4)*.15);fs(c,P('M0 0 Q-7 -8 -13 -7 Q-8 -3 -2 2Z M0 0 Q7 -8 13 -7 Q8 -3 2 2Z'),B2,1.6);c.restore();
  fs(c,P('M-18 6 Q-31 5 -31 14 Q-24 15 -16 11Z'),B2,1.8);fs(c,P('M18 6 Q31 5 31 14 Q24 15 16 11Z'),B2,1.8);
  const body=ell(0,0,22,19);fs(c,body,B,2.2);
  c.save();c.clip(body);fs(c,ell(0,12,17,11),BL,0);c.strokeStyle='#a5d8ff';c.lineWidth=1.2;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*5,6);c.lineTo(i*5.6,19);c.stroke();}c.restore();
  c.globalAlpha=.4;fs(c,ell(-8,-11,6,3),'#fff',0);c.globalAlpha=1;
  pEyes(c,[[-9,-3],[9,-3]],o,2.8,3.4);blush(c,[[-14,2],[14,2]]);
  c.strokeStyle=INK;c.lineWidth=1.6;c.lineCap='round';c.beginPath();if(o.puff){c.ellipse(0,5,2,2.4,0,0,Math.PI*2);}else{c.moveTo(-9,3.5);c.quadraticCurveTo(0,9,9,3.5);}c.stroke();
  spout(0,-19);
 }else{
  const fy=-1+sw;
  fs(c,new Path2D(`M12 -9 Q28 -7 35 ${fy-3} L36 ${fy+3} Q27 10 12 11Z`),B,2);
  fs(c,new Path2D(`M34 ${fy} Q38 ${fy-12} 45 ${fy-11} Q41 ${fy-4} 38 ${fy} Q41 ${fy+4} 45 ${fy+11} Q38 ${fy+12} 34 ${fy}Z`),B2,1.8);
  const body=ell(-1,0,22,15);fs(c,body,B,2.2);fs(c,new Path2D(`M12 -9 Q20 -6 22 0 Q20 7 12 11Z`),B,0);
  c.save();c.clip(body);fs(c,ell(-3,11,21,8),BL,0);c.strokeStyle='#a5d8ff';c.lineWidth=1.2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-18+i*7,5);c.lineTo(-16+i*7,14);c.stroke();}c.restore();
  fs(c,P('M-2 8 Q3 19 11 17 Q6 12 5 7Z'),B2,1.8);
  c.globalAlpha=.4;fs(c,ell(-6,-9,7,2.6),'#fff',0);c.globalAlpha=1;
  pEyes(c,[[-12,-3]],o,2.6,3.2);blush(c,[[-12,3]]);
  c.strokeStyle=INK;c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(-22,2);c.quadraticCurveTo(-16,7,-8,5);c.stroke();
  spout(-5,-14);
 }
 c.restore();}


/* ---- the rest of the roster as floating pets, built from shared parts so they look like one family ---- */
/* every pet: body centre (0,0); front view, or side view facing left; o = {t, mode, blink, happy, puff, lx, ly} */
const CR={
 body(c,f,col,belly){if(f){fs(c,ell(0,12,14,12),col,2);if(belly)fs(c,ell(0,14,8.5,7.5),belly,0);}else{fs(c,ell(4,12,14,11.5),col,2);if(belly)fs(c,ell(-3,14,7,6.5),belly,0);}},
 head(c,f,col,w,h){if(f)fs(c,ell(0,-8,w||17,h||15),col,2.2);else fs(c,ell(1,-8,(w||17)-2,(h||15)-1.5),col,2.2);},
 eyes(c,f,o,rx,ry,dx,y){rx=rx||3;ry=ry||3.6;y=y===undefined?-9:y;if(f)pEyes(c,[[-(dx||6.5),y],[dx||6.5,y]],o,rx,ry);else pEyes(c,[[-6,y]],o,rx*.92,ry*.92);},
 cheeks(c,f,y){blush(c,f?[[-11,y||-2],[11,y||-2]]:[[-5,y||-1.5]]);},
 mouth(c,f,o,y){smile(c,f?0:-11,y||1.8,2.6,o.puff);},
 /* a wispy tail: front curls down to one side, side streams out behind */
 tail(c,f,o,col,tip,len){const t=o.t,sw=Math.sin(t*3)*3,nap=o.mode==='nap';len=len||1;
  if(f){const tx=(12+sw)*len,ty=nap?20:28+2*len;fs(c,new Path2D(`M-6 14 Q-8 ${ty-3} ${tx-5} ${ty} Q${tx+5} ${ty+1} ${tx+2} ${ty-7} Q6 ${ty-10} 6 14Z`),col,1.8);if(tip)fs(c,ell(tx-1,ty-2.5,4,3.2),tip,1.4);}
  else{const tx=18+11*len+sw*.6,ty=(nap?14:0)+Math.sin(t*2.2)*3;fs(c,new Path2D(`M11 6 Q21 4 ${tx-3} ${ty} Q${tx+5} ${ty-3} ${tx+2} ${ty+5} Q21 16 11 16Z`),col,1.8);if(tip)fs(c,ell(tx+1,ty+1,3.8,3.2),tip,1.4);}},
 ears(c,f,type,col,inner){const E={
   round:()=>f?[[-13,-19,6],[13,-19,6]]:[[6,-19,6]],
   small:()=>f?[[-12,-19,4.5],[12,-19,4.5]]:[[6,-19,4.5]],
   big:()=>f?[[-15,-17,9],[15,-17,9]]:[[7,-17,9]]};
  if(type==='pointy'){if(f){fs(c,P('M-14 -15 L-14 -30 L-4 -21Z'),col,2);fs(c,P('M14 -15 L14 -30 L4 -21Z'),col,2);if(inner){fs(c,P('M-12 -17 L-12 -26 L-7 -20Z'),inner,0);fs(c,P('M12 -17 L12 -26 L7 -20Z'),inner,0);}}
   else{fs(c,P('M1 -18 L4 -32 L10 -18Z'),col,2);if(inner)fs(c,P('M3.5 -19 L5 -27 L8 -19Z'),inner,0);}return;}
  if(type==='long'){const fl=Math.sin(c.__t*2)*.08;if(f){[[-1,-7],[1,7]].forEach(([s,x])=>{c.save();c.translate(x,-20);c.rotate(s*.18+fl);fs(c,ell(0,-12,4.6,13),col,2);if(inner)fs(c,ell(0,-12,2.4,9.5),inner,0);c.restore();});}
   else{c.save();c.translate(6,-20);c.rotate(.55+fl);fs(c,ell(0,-12,4.6,13),col,2);if(inner)fs(c,ell(0,-12,2.4,9.5),inner,0);c.restore();}return;}
  if(type==='floppy'){if(f){fs(c,P('M-13 -18 Q-24 -16 -21 2 Q-15 4 -12 -8Z'),col,2);fs(c,P('M13 -18 Q24 -16 21 2 Q15 4 12 -8Z'),col,2);}else fs(c,P('M4 -18 Q16 -16 14 2 Q8 4 5 -8Z'),col,2);return;}
  if(!E[type])return;E[type]().forEach(([x,y,r])=>{fs(c,ell(x,y,r,r),col,2);if(inner)fs(c,ell(x,y,r*.55,r*.55),inner,0);});},
 /* small bird wings at the sides */
 wings(c,f,col,flap){const a=Math.sin(flap)*.35;if(f){[[-1,-14],[1,14]].forEach(([s,x])=>{c.save();c.translate(x,8);c.rotate(s*(.5+a));fs(c,P('M0 0 Q'+(s*12)+' -2 '+(s*13)+' 8 Q'+(s*6)+' 10 0 6Z'),col,1.8);c.restore();});}
  else{c.save();c.translate(6,6);c.rotate(-.3-a);fs(c,P('M0 0 Q14 -4 18 6 Q10 10 0 6Z'),col,1.8);c.restore();}},
 beak(c,f,col,kind){if(f){if(kind==='hook'){fs(c,P('M-4 -3 Q0 -6 4 -3 Q3 3 0 6 Q-3 3 -4 -3Z'),col,1.6);}else if(kind==='flat'){fs(c,ell(0,-1,7,3.4),col,1.6);c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(-5,-1);c.lineTo(5,-1);c.stroke();}else fs(c,P('M-3.6 -3 L3.6 -3 L0 3Z'),col,1.6);}
  else{if(kind==='hook')fs(c,P('M-12 -9 Q-21 -9 -20 -2 Q-18 -4 -15 -3 Q-12 -4 -12 -6Z'),col,1.6);else if(kind==='flat')fs(c,P('M-12 -8 Q-24 -8 -24 -4 Q-24 -1 -12 -2Z'),col,1.6);else fs(c,P('M-12 -9 L-21 -5 L-12 -2Z'),col,1.6);}},
 whiskers(c,f){whiskers(c,f?[[-7,0,-18,-2],[-7,1.5,-18,2.5],[7,0,18,-2],[7,1.5,18,2.5]]:[[-12,-1,-23,-4],[-12,.5,-23,1.5]]);},
 nose(c,f,col,r){fs(c,ell(f?0:-14.5,f?-2:-3,(r||2.2),(r||2.2)*.75),col||INK,0);}
};
/* the 37 pet designs */
const CRITTERS={
 chick(c,o,f){const Y='#ffe066';CR.tail(c,f,o,Y,null,.6);CR.wings(c,f,'#fcc419',o.t*6);CR.body(c,f,Y,'#fff3bf');CR.head(c,f,Y);
  fs(c,P(f?'M-2 -22 Q0 -30 2 -22 M1 -22 Q5 -29 5 -21':'M0 -21 Q2 -29 4 -21 M3 -21 Q7 -27 7 -20'),Y,1.4);CR.eyes(c,f,o);CR.beak(c,f,'#ff922b');CR.cheeks(c,f);},
 turtle(c,o,f){const G='#8ce99a',S='#5c940d';if(f){fs(c,ell(0,6,19,16),S,2);c.strokeStyle='#a9e34b';c.lineWidth=1.4;c.beginPath();c.ellipse(0,6,13,10,0,0,7);c.stroke();}
  CR.tail(c,f,o,G,null,.5);CR.body(c,f,G,'#ebfbee');if(!f){const sh=new Path2D('M-6 10 Q-4 -10 10 -9 Q24 -8 22 12Z');fs(c,sh,S,2);c.strokeStyle='#a9e34b';c.lineWidth=1.4;c.beginPath();c.moveTo(0,4);c.lineTo(7,-6);c.lineTo(15,4);c.moveTo(7,-6);c.lineTo(9,10);c.stroke();}
  CR.head(c,f,G,15,13);CR.eyes(c,f,o);CR.cheeks(c,f);CR.mouth(c,f,o);},
 pup(c,o,f){const T='#e0b080',D='#a0703f';CR.tail(c,f,o,T,'#fff4e6');CR.body(c,f,T,'#fff4e6');CR.head(c,f,T);CR.ears(c,f,'floppy',D);
  if(f){fs(c,ell(0,0,8,5.5),'#fff4e6',0);fs(c,ell(-7,-14,3.4,3),D,0);}else fs(c,ell(-10,-2,7,5),'#fff4e6',1.4);CR.eyes(c,f,o);CR.nose(c,f,INK,2.6);
  if(!o.puff&&!o.mode)fs(c,ell(f?0:-11,f?4.6:1.6,1.8,2.4),'#ff8fab',1);CR.cheeks(c,f);},
 penguin(c,o,f){const N='#2b3a55';CR.tail(c,f,o,N,null,.5);CR.wings(c,f,N,o.t*4);CR.body(c,f,N,'#f8f9fa');if(f)fs(c,ell(0,14,10.5,9.5),'#f8f9fa',0);CR.head(c,f,N);
  fs(c,f?P('M-11 -4 Q-12 -15 -4 -16 Q0 -11 4 -16 Q12 -15 11 -4 Q6 4 0 4 Q-6 4 -11 -4Z'):ell(-5,-6,9,8),'#f8f9fa',0);CR.eyes(c,f,o);CR.beak(c,f,'#ff922b');CR.cheeks(c,f);},
 bunny(c,o,f){const W='#e9ecef';c.__t=o.t;CR.ears(c,f,'long',W,'#ffc9d6');if(f)fs(c,ell(10,24,6,6),'#fff',1.6);else fs(c,ell(19,16,6,6),'#fff',1.6);CR.body(c,f,W,'#fff');CR.head(c,f,W);
  CR.eyes(c,f,o);CR.nose(c,f,'#ff8fab',1.8);fs(c,P(f?'M-1.8 1.5 L-1.8 5 L1.8 5 L1.8 1.5Z':'M-13 0 L-13 3.4 L-10.4 3.4 L-10.4 0Z'),'#fff',1);CR.whiskers(c,f);CR.cheeks(c,f);},
 hamster(c,o,f){const O='#f4c27a';CR.ears(c,f,'small',O,'#ffc9d6');CR.body(c,f,O,'#fff8ec');CR.head(c,f,O,18,15);
  if(f){fs(c,ell(-10,0,6.5,5.5),'#fff8ec',1.4);fs(c,ell(10,0,6.5,5.5),'#fff8ec',1.4);fs(c,ell(0,-1,6,5),'#fff8ec',0);}else{fs(c,ell(-5,0,7,5.5),'#fff8ec',1.4);}
  CR.eyes(c,f,o,2.6,3);CR.nose(c,f,'#ff8fab',1.5);CR.mouth(c,f,o,2.8);},
 frog(c,o,f){const G='#69db7c';CR.tail(c,f,o,G,null,.5);CR.body(c,f,G,'#d3f9d8');CR.head(c,f,G,19,13);
  if(f){fs(c,ell(-8,-18,6,5.5),G,2);fs(c,ell(8,-18,6,5.5),G,2);CR.eyes(c,f,o,2.8,3.2,8,-18);c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();if(o.puff)c.ellipse(0,0,2,2.4,0,0,7);else{c.moveTo(-9,-2);c.quadraticCurveTo(0,5,9,-2);}c.stroke();blush(c,[[-13,-4],[13,-4]]);}
  else{fs(c,ell(-4,-17,6,5.5),G,2);pEyes(c,[[-5,-17]],o,2.6,3);c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(-17,-3);c.quadraticCurveTo(-10,1,-3,-2);c.stroke();blush(c,[[-6,-4]]);}},
 pig(c,o,f){const K='#ffc9d6',D='#f783ac';if(f){const tx=11,ty=26;c.strokeStyle=INK;c.lineWidth=3.6;c.beginPath();c.arc(tx,ty,3.5,0,Math.PI*1.6);c.stroke();c.strokeStyle=K;c.lineWidth=2;c.stroke();}
  else{c.strokeStyle=INK;c.lineWidth=3.6;c.beginPath();c.arc(20,8,3.5,0,Math.PI*1.6);c.stroke();c.strokeStyle=K;c.lineWidth=2;c.stroke();}
  CR.body(c,f,K,'#fff0f6');CR.ears(c,f,'pointy',K,D);CR.head(c,f,K);CR.eyes(c,f,o);
  if(f){fs(c,ell(0,0,6.4,4.6),D,1.6);fs(c,ell(-2.2,0,1,1.4),INK,0);fs(c,ell(2.2,0,1,1.4),INK,0);}else{fs(c,ell(-14,-2,4,4.6),D,1.6);fs(c,ell(-15,-2,.9,1.3),INK,0);}CR.cheeks(c,f,3);},
 koala(c,o,f){const G='#adb5bd';CR.ears(c,f,'big',G,'#f8f9fa');CR.body(c,f,G,'#e9ecef');CR.head(c,f,G);CR.eyes(c,f,o,2.6,3.2);
  fs(c,f?ell(0,-1,4.4,5.6):ell(-13,-3,4,5),'#495057',1.4);CR.mouth(c,f,o,6);CR.cheeks(c,f);},
 duck(c,o,f){const W='#f8f9fa';CR.tail(c,f,o,W,null,.5);CR.wings(c,f,'#e9ecef',o.t*5);CR.body(c,f,W,'#fff');CR.head(c,f,W);
  fs(c,P(f?'M0 -22 Q4 -30 7 -26':'M2 -21 Q6 -29 9 -25'),'rgba(0,0,0,0)',1.6);CR.eyes(c,f,o);CR.beak(c,f,'#ff922b','flat');CR.cheeks(c,f,-3);},
 mouse(c,o,f){const G='#ced4da';if(f){c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.moveTo(6,20);c.quadraticCurveTo(18,30,22,18);c.quadraticCurveTo(24,12,19,12);c.stroke();c.strokeStyle='#ffc9d6';c.lineWidth=1.6;c.stroke();}
  else{c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.moveTo(16,14);c.quadraticCurveTo(30,18,32,6);c.stroke();c.strokeStyle='#ffc9d6';c.lineWidth=1.6;c.stroke();}
  CR.ears(c,f,'big',G,'#ffc9d6');CR.body(c,f,G,'#f1f3f5');CR.head(c,f,G,16,14);CR.eyes(c,f,o,2.6,3.2);CR.nose(c,f,'#ff8fab',1.8);CR.whiskers(c,f);CR.cheeks(c,f);},
 snail(c,o,f){const B='#ffd8a8',S='#d9480f';CR.tail(c,f,o,B,null,.5);CR.body(c,f,B,'#fff4e6');
  const shell=(x,y,r)=>{fs(c,ell(x,y,r,r),S,2);c.strokeStyle='#ffa94d';c.lineWidth=2;c.beginPath();for(let a=0;a<Math.PI*4;a+=.2){const rr=r*.85*(1-a/(Math.PI*4.4));const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;a?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();};
  if(f)shell(0,10,13);else shell(9,6,13);
  c.strokeStyle=INK;c.lineWidth=1.6;[f?[-6,-20,-9,-31]:[-4,-20,-8,-31],f?[6,-20,9,-31]:[2,-20,3,-31]].forEach(([a,b,cc,d])=>{c.beginPath();c.moveTo(a,b);c.lineTo(cc,d);c.stroke();fs(c,ell(cc,d,2.2,2.2),B,1.2);});
  CR.head(c,f,B,15,13);CR.eyes(c,f,o);CR.mouth(c,f,o);CR.cheeks(c,f);},
 owl(c,o,f){const B='#a0703f';CR.tail(c,f,o,B,null,.5);CR.wings(c,f,'#7a4a28',o.t*3);CR.body(c,f,B,'#f1d9b5');
  if(f){c.strokeStyle='#a0703f';c.lineWidth=1.2;[[-4,12],[4,12],[0,17]].forEach(([x,y])=>{c.beginPath();c.moveTo(x-2,y);c.lineTo(x,y+2);c.lineTo(x+2,y);c.stroke();});}
  CR.head(c,f,B);fs(c,P(f?'M-15 -15 L-16 -27 L-7 -20Z M15 -15 L16 -27 L7 -20Z':'M4 -18 L8 -30 L12 -17Z'),B,2);
  if(f){fs(c,ell(-7,-9,6.5,6.5),'#fff3bf',1.6);fs(c,ell(7,-9,6.5,6.5),'#fff3bf',1.6);}else fs(c,ell(-6,-9,6,6),'#fff3bf',1.6);
  CR.eyes(c,f,o,2.8,3.2,7);if(!o.mode&&!o.blink){c.strokeStyle=INK;c.lineWidth=1.3;if(f){c.beginPath();c.arc(-7,-9,7,0,7);c.moveTo(14,-9);c.arc(7,-9,7,0,7);c.moveTo(-.5,-9);c.lineTo(.5,-9);c.stroke();}else{c.beginPath();c.arc(-6,-9,6.5,0,7);c.stroke();}}
  CR.beak(c,f,'#fcc419','hook');},
 panda(c,o,f){const W='#f8f9fa',K='#343a40';CR.ears(c,f,'round',K);CR.tail(c,f,o,W,null,.4);CR.body(c,f,W,'#fff');if(f){fs(c,ell(-13,10,4,7),K,0);fs(c,ell(13,10,4,7),K,0);}CR.head(c,f,W);
  if(f){c.save();c.translate(-7,-8);c.rotate(.5);fs(c,ell(0,0,4.4,5.6),K,0);c.restore();c.save();c.translate(7,-8);c.rotate(-.5);fs(c,ell(0,0,4.4,5.6),K,0);c.restore();}else{c.save();c.translate(-6,-8);c.rotate(.4);fs(c,ell(0,0,4.2,5.4),K,0);c.restore();}
  const oo=Object.assign({},o);pEyes(c,f?[[-7,-9],[7,-9]]:[[-6,-9]],oo,2,2.4);if(!o.mode&&!o.blink&&!o.happy){fs(c,ell(f?-6.4:-5.4,-10,.8,.8),'#fff',0);if(f)fs(c,ell(7.6,-10,.8,.8),'#fff',0);}
  CR.nose(c,f,INK,2);CR.mouth(c,f,o,2.5);CR.cheeks(c,f,0);},
 octo(c,o,f){const R='#ff8787',t=o.t;for(let i=0;i<6;i++){const x0=-13+i*5.2;c.beginPath();c.moveTo(x0,6);for(let j=1;j<=6;j++){const q=j/6;c.lineTo(x0+Math.sin(t*3+i*1.1+j*.8)*3*q+(f?(i-2.5)*2*q:10*q),6+j*4.2);}
  c.lineCap='round';c.strokeStyle=INK;c.lineWidth=7;c.stroke();c.strokeStyle=R;c.lineWidth=4.6;c.stroke();}
  fs(c,f?P('M-17 8 Q-20 -25 0 -25 Q20 -25 17 8Z'):P('M-15 8 Q-20 -23 2 -25 Q22 -22 16 8Z'),R,2.2);c.globalAlpha=.5;fs(c,ell(f?-8:-6,-16,4,5),'#ffe3e3',0);c.globalAlpha=1;
  CR.eyes(c,f,o,3,3.8,6.5,-6);CR.cheeks(c,f,0);CR.mouth(c,f,o,3);},
 rex(c,o,f){const G='#82c91e',D='#5c940d';CR.tail(c,f,o,G,null,1.1);CR.body(c,f,G,'#e9fac8');
  if(f){fs(c,P('M-11 8 L-17 11 L-12 13Z M11 8 L17 11 L12 13Z'),G,1.4);}else fs(c,P('M-6 10 L-12 14 L-6 15Z'),G,1.4);
  if(!f){[[8,-21],[14,-17],[18,-11]].forEach(([x,y])=>fs(c,P(`M${x-3} ${y+3} L${x} ${y-4} L${x+3} ${y+3}Z`),D,1.2));}
  CR.head(c,f,G,17,14);if(f){fs(c,ell(0,-1,11,6),G,0);[[-6,-20],[0,-23],[6,-20]].forEach(([x,y])=>fs(c,P(`M${x-3} ${y+3} L${x} ${y-4} L${x+3} ${y+3}Z`),D,1.2));}else fs(c,ell(-12,-4,9,6.5),G,1.8);
  CR.eyes(c,f,o,2.8,3.4,7,-11);c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();if(f){c.moveTo(-8,1);c.quadraticCurveTo(0,6,8,1);}else{c.moveTo(-20,-1);c.quadraticCurveTo(-13,2,-6,0);}c.stroke();
  c.fillStyle='#fff';(f?[-4,0,4]:[-17,-13]).forEach(x=>{c.beginPath();c.moveTo(x-1.4,f?2.6:0);c.lineTo(x,f?5:2.6);c.lineTo(x+1.4,f?2.6:.4);c.fill();});CR.cheeks(c,f,-3);},
 hedgehog(c,o,f){const Q='#8b5a2b',F='#f3d9b1';const spikes=(cx,cy,r,a0,a1)=>{const p=new Path2D();const n=16;for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n,rr=i%2?r:r+7;i?p.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr):p.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}p.lineTo(cx,cy);p.closePath();fs(c,p,Q,1.6);};
  if(f)spikes(0,-2,20,Math.PI*.95,Math.PI*2.05);else spikes(6,-2,19,-Math.PI*.55,Math.PI*.6);
  CR.tail(c,f,o,Q,null,.4);CR.body(c,f,F,'#fff4e6');CR.ears(c,f,'small',F,'#e8b67a');CR.head(c,f,F,15,13);if(!f)fs(c,ell(-11,-3,7,4.5),F,1.4);
  CR.eyes(c,f,o,2.6,3.2);CR.nose(c,f,INK,2);CR.mouth(c,f,o,2.6);CR.cheeks(c,f);},
 raccoon(c,o,f){const G='#adb5bd',K='#343a40';const tail=()=>{CR.tail(c,f,o,G,K,1.1);c.save();c.strokeStyle=K;c.lineWidth=2.4;if(f){[[2,24],[7,26]].forEach(([x,y])=>{c.beginPath();c.moveTo(x-3,y-3);c.lineTo(x+2,y+3);c.stroke();});}else{[[24,2],[30,1]].forEach(([x,y])=>{c.beginPath();c.moveTo(x,y-4);c.lineTo(x-1,y+5);c.stroke();});}c.restore();};tail();
  CR.body(c,f,G,'#e9ecef');CR.ears(c,f,'pointy',G,K);CR.head(c,f,G);
  fs(c,f?P('M-15 -9 Q-8 -15 0 -10 Q8 -15 15 -9 Q10 -3 0 -5 Q-10 -3 -15 -9Z'):P('M-14 -11 Q-6 -15 2 -10 Q-2 -4 -14 -6Z'),K,0);fs(c,f?ell(0,0,7,5):ell(-11,-2,6.5,4.5),'#f8f9fa',0);
  const oo=Object.assign({},o);CR.eyes(c,f,oo,2.4,2.8);if(!o.mode&&!o.blink&&!o.happy){fs(c,ell(f?-5.8:-5.2,-10,.8,.8),'#fff',0);}CR.nose(c,f,INK,2);CR.mouth(c,f,o,3);},
 otter(c,o,f){const B='#a0703f',C='#f1d9b5';CR.tail(c,f,o,B,null,1);CR.body(c,f,B,C);CR.ears(c,f,'small',B,C);CR.head(c,f,B);fs(c,f?ell(0,-1,10,7.5):ell(-9,-3,8,6),C,0);
  CR.eyes(c,f,o,2.6,3.2);CR.nose(c,f,INK,2.4);CR.whiskers(c,f);CR.mouth(c,f,o,3);},
 sloth(c,o,f){const B='#c9a77c',L='#f1e3c8',D='#7a5a3a';CR.tail(c,f,o,B,null,.4);CR.body(c,f,B,L);CR.head(c,f,B);fs(c,f?ell(0,-5,13,11):ell(-5,-5,10,9),L,0);
  if(f){c.save();c.translate(-7,-8);c.rotate(.6);fs(c,ell(0,1,3,6),D,0);c.restore();c.save();c.translate(7,-8);c.rotate(-.6);fs(c,ell(0,1,3,6),D,0);c.restore();}else{c.save();c.translate(-6,-8);c.rotate(.5);fs(c,ell(0,1,3,6),D,0);c.restore();}
  const oo=Object.assign({},o);if(!o.happy&&!o.puff)oo.blink=true; /* always a bit sleepy */CR.eyes(c,f,oo,2.4,2.8);CR.nose(c,f,INK,2);CR.mouth(c,f,o,3.4);},
 parrot(c,o,f){const R='#fa5252';CR.tail(c,f,o,'#339af0','#fcc419',1.2);CR.wings(c,f,'#339af0',o.t*6);CR.body(c,f,R,'#ffe066');CR.head(c,f,R);
  fs(c,P(f?'M-3 -22 Q-6 -33 0 -36 Q2 -30 1 -22Z M1 -22 Q4 -32 9 -32 Q6 -26 4 -21Z':'M3 -20 Q6 -32 12 -33 Q10 -26 7 -19Z'),R,1.6);
  if(f){fs(c,ell(-7,-8,5.5,5.5),'#fff',0);fs(c,ell(7,-8,5.5,5.5),'#fff',0);}else fs(c,ell(-6,-8,5.5,5.5),'#fff',0);CR.eyes(c,f,o,2.4,2.8,7,-8);CR.beak(c,f,'#f1e3c8','hook');},
 dolphin(c,o,f){const B='#74c0fc',L='#e7f5ff',t=o.t,sw=Math.sin(t*2.4)*3;
  if(f){fs(c,P('M-3 -20 Q2 -32 8 -30 Q4 -24 4 -18Z'),'#4dabf7',1.6);fs(c,new Path2D(`M-6 10 Q${sw*.4-3} 23 ${sw-2} 28 L${sw+2} 28 Q${sw*.4+3} 23 6 10Z`),B,1.8);fs(c,new Path2D(`M${sw-10} 25 Q${sw} 32 ${sw+10} 25 Q${sw+6} 35 ${sw} 31 Q${sw-6} 35 ${sw-10} 25Z`),'#4dabf7',1.6);fs(c,ell(0,2,17,17),B,2.2);fs(c,ell(0,9,11,9),L,0);fs(c,ell(0,1,6,3.6),'#a5d8ff',1.4);fs(c,P('M-15 6 Q-26 8 -24 16 Q-18 14 -13 10Z M15 6 Q26 8 24 16 Q18 14 13 10Z'),'#4dabf7',1.6);
   CR.eyes(c,f,o,2.6,3.2,8,-6);CR.cheeks(c,f,2);smile(c,0,5.4,4,o.puff);}
  else{fs(c,new Path2D(`M8 -6 Q24 -6 30 ${-2+sw} L33 ${4+sw} Q24 10 8 10Z`),B,2);fs(c,new Path2D(`M30 ${sw} Q36 ${-10+sw} 41 ${-9+sw} Q37 ${-2+sw} 34 ${sw+1} Q37 ${4+sw} 41 ${11+sw} Q36 ${12+sw} 30 ${sw+2}Z`),'#4dabf7',1.6);
   fs(c,ell(0,0,17,13),B,2.2);fs(c,ell(-2,7,13,5.5),L,0);fs(c,P('M-15 0 Q-26 0 -26 4 Q-24 7 -14 6Z'),B,1.8);fs(c,P('M2 -12 Q8 -22 12 -20 Q9 -14 10 -9Z'),'#4dabf7',1.6);fs(c,P('M0 6 Q4 14 9 13 Q6 9 5 5Z'),'#4dabf7',1.4);
   pEyes(c,[[-8,-3]],o,2.4,3);blush(c,[[-8,2]]);c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.moveTo(-25,4);c.quadraticCurveTo(-19,7,-13,5);c.stroke();}},
 monkey(c,o,f){const B='#a0703f',F='#ffd8a8';const tl=f?new Path2D('M8 18 Q22 24 22 12 Q22 6 17 7 Q14 9 17 11'):new Path2D('M16 12 Q32 14 30 0 Q29 -5 25 -3');c.lineCap='round';c.strokeStyle=INK;c.lineWidth=4.2;c.stroke(tl);c.strokeStyle=B;c.lineWidth=2.4;c.stroke(tl);
  CR.ears(c,f,'round',B,F);CR.body(c,f,B,F);CR.head(c,f,B);fs(c,f?P('M-11 -2 Q-12 -15 -4 -14 Q0 -11 4 -14 Q12 -15 11 -2 Q8 6 0 6 Q-8 6 -11 -2Z'):ell(-7,-5,9,9),F,0);
  CR.eyes(c,f,o,2.6,3.2,5.5);CR.nose(c,f,'#7a4a28',1.4);CR.mouth(c,f,o,3);CR.cheeks(c,f,1);},
 bee(c,o,f){const Y='#ffd43b',K='#343a40',t=o.t;const wing=(x,y,r)=>{c.save();c.translate(x,y);c.rotate(r+Math.sin(t*40)*.25);c.globalAlpha=.75;fs(c,ell(0,-8,6,10),'#e7f5ff',1.4);c.globalAlpha=1;c.restore();};
  if(f){wing(-10,4,-.6);wing(10,4,.6);}else{wing(8,2,.3);}
  if(f)fs(c,P('M-3 22 L0 30 L3 22Z'),K,1.4);else fs(c,P('M16 14 L26 17 L16 19Z'),K,1.4);
  CR.body(c,f,Y);c.save();f?c.clip(ell(0,12,14,12)):c.clip(ell(4,12,14,11.5));c.fillStyle=K;[8,15,22].forEach(y=>c.fillRect(-20,y-1.6,50,3.2));c.restore();
  c.strokeStyle=INK;c.lineWidth=1.6;(f?[[-5,-21,-9,-31],[5,-21,9,-31]]:[[-3,-21,-8,-31]]).forEach(([a,b,cc,d])=>{c.beginPath();c.moveTo(a,b);c.quadraticCurveTo(a,d,cc,d);c.stroke();fs(c,ell(cc,d,2,2),K,0);});
  CR.head(c,f,Y);CR.eyes(c,f,o);CR.cheeks(c,f);CR.mouth(c,f,o);},
 lion(c,o,f){const G='#f4b942',M='#c96b1a';CR.tail(c,f,o,G,'#7a4a28',1.1);const mane=(cx,cy,r)=>{const p=new Path2D();for(let i=0;i<=20;i++){const a=i/20*Math.PI*2,rr=i%2?r:r+4;i?p.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr):p.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}p.closePath();fs(c,p,M,1.8);};
  mane(f?0:4,-7,22);CR.body(c,f,G,'#fff4e6');CR.ears(c,f,'small',G,'#e8a600');CR.head(c,f,G,16,14);fs(c,f?ell(0,0,8,5.5):ell(-10,-2,7,5),'#fff4e6',0);
  CR.eyes(c,f,o);CR.nose(c,f,'#7a4a28',2.4);CR.mouth(c,f,o,3.6);CR.cheeks(c,f);},
 tiger(c,o,f){const O='#ff922b',K='#343a40';CR.tail(c,f,o,O,K,1.1);CR.body(c,f,O,'#fff');CR.ears(c,f,'small',O,'#fff');CR.head(c,f,O);
  c.save();f?c.clip(ell(0,-8,17,15)):c.clip(ell(1,-8,15,13.5));c.strokeStyle=K;c.lineWidth=2.2;c.lineCap='round';[[-4,-23,-3,-17],[0,-24,0,-18],[4,-23,3,-17],[-17,-10,-12,-9],[17,-10,12,-9],[-17,-5,-13,-5],[17,-5,13,-5]].forEach(([a,b,cc,d])=>{c.beginPath();c.moveTo(a,b);c.lineTo(cc,d);c.stroke();});c.restore();
  c.save();f?c.clip(ell(0,12,14,12)):c.clip(ell(4,12,14,11.5));c.strokeStyle=K;c.lineWidth=2;[[-14,6,-8,8],[14,6,8,8],[-13,14,-8,15],[13,14,8,15]].forEach(([a,b,cc,d])=>{c.beginPath();c.moveTo(a,b);c.lineTo(cc,d);c.stroke();});c.restore();
  fs(c,f?P('M-10 -2 Q-6 -6 0 -3 Q6 -6 10 -2 Q6 5 0 5 Q-6 5 -10 -2Z'):ell(-10,-2,7,5),'#fff',0);CR.eyes(c,f,o);CR.nose(c,f,'#ff8fab',2);CR.mouth(c,f,o,2.6);},
 shark(c,o,f){const G='#8ea3b8',W='#f1f3f5',t=o.t,sw=Math.sin(t*2.4)*3;
  if(f){fs(c,P('M-4 -18 Q2 -34 10 -30 Q5 -24 6 -16Z'),'#7d8da1',1.6);fs(c,P('M-15 6 Q-28 8 -26 17 Q-18 14 -13 10Z M15 6 Q28 8 26 17 Q18 14 13 10Z'),'#7d8da1',1.6);fs(c,new Path2D(`M-7 10 Q${sw*.4-3} 24 ${sw-2} 29 L${sw+2} 29 Q${sw*.4+3} 24 7 10Z`),G,1.8);fs(c,new Path2D(`M${sw-11} 26 Q${sw} 33 ${sw+11} 26 Q${sw+7} 37 ${sw} 32 Q${sw-7} 37 ${sw-11} 26Z`),'#7d8da1',1.6); /* a tail that joins the body, then the fin */
   fs(c,ell(0,2,17,17),G,2.2);fs(c,ell(0,9,11,9),W,0);CR.eyes(c,f,o,2.6,3.2,8,-5);CR.cheeks(c,f,2);c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(-8,6);c.quadraticCurveTo(0,11,8,6);c.stroke();c.fillStyle='#fff';[-4,0,4].forEach(x=>{c.beginPath();c.moveTo(x-1.4,7.4+Math.abs(x)*.1);c.lineTo(x,10);c.lineTo(x+1.4,7.4+Math.abs(x)*.1);c.fill();});}
  else{fs(c,new Path2D(`M8 -7 Q24 -6 30 ${-2+sw} L33 ${4+sw} Q24 10 8 10Z`),G,2);fs(c,new Path2D(`M30 ${sw} Q35 ${-12+sw} 41 ${-11+sw} Q37 ${-2+sw} 34 ${sw+1} Q36 ${4+sw} 39 ${9+sw} Q34 ${10+sw} 30 ${sw+2}Z`),'#7d8da1',1.6);
   fs(c,ell(0,0,18,13),G,2.2);fs(c,ell(-2,7,14,5.5),W,0);fs(c,P('M-2 -11 Q4 -26 10 -24 Q7 -16 8 -9Z'),'#7d8da1',1.6);fs(c,P('M0 6 Q4 15 10 14 Q6 9 5 5Z'),'#7d8da1',1.4);
   pEyes(c,[[-8,-3]],o,2.4,3);blush(c,[[-8,2]]);c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(-17,3);c.quadraticCurveTo(-12,6,-6,4);c.stroke();}},
 wolf(c,o,f){const G='#868e96',L='#e9ecef';CR.tail(c,f,o,G,L,1.1);CR.body(c,f,G,L);CR.ears(c,f,'pointy',G,L);CR.head(c,f,G);
  fs(c,f?P('M-12 -4 Q-8 -12 0 -10 Q8 -12 12 -4 Q8 6 0 6 Q-8 6 -12 -4Z'):P('M-21 -4 Q-12 -10 -2 -6 Q-2 4 -12 3 Q-19 2 -21 -4Z'),L,f?0:1.4);
  c.save();c.translate(f?0:-2,-19);c.fillStyle='#fff3bf';c.beginPath();c.arc(0,0,3,0,7);c.fill();c.fillStyle=G;c.beginPath();c.arc(1.4,-.8,2.6,0,7);c.fill();c.restore(); /* a little moon mark: Luna */
  CR.eyes(c,f,o);CR.nose(c,f,INK,2.4);CR.mouth(c,f,o,3.4);CR.cheeks(c,f);},
 flamingo(c,o,f){const K='#faa2c1',D='#f06595';CR.tail(c,f,o,K,null,.6);CR.wings(c,f,D,o.t*3);CR.body(c,f,K,'#ffdeeb');
  const neck=f?new Path2D('M-5 4 Q-12 -6 -2 -14 L5 -12 Q-3 -4 5 4Z'):new Path2D('M-2 6 Q-8 -6 -2 -14 L5 -12 Q0 -4 6 4Z');fs(c,neck,K,2);CR.body(c,f,K);fs(c,neck,K,0);
  c.save();c.translate(0,-8);if(f){fs(c,ell(1,-12,11,9.5),K,2);pEyes(c,[[-3,-14],[5,-14]],o,2.2,2.8);blush(c,[[-6,-9],[8,-9]]);fs(c,P('M-3 -8 Q1 -10 5 -8 Q4 -2 1 0 Q0 -3 -3 -8Z'),'#fff',1.4);fs(c,P('M1 0 Q0 -3 -1 -4 Q2 -4 3 -3 Q2 -1 1 0Z'),INK,0);}
  else{fs(c,ell(0,-12,10,8.5),K,2);pEyes(c,[[-3,-14]],o,2.2,2.8);blush(c,[[-3,-9]]);fs(c,P('M-9 -13 Q-18 -12 -18 -4 Q-15 -7 -9 -9Z'),'#fff',1.4);fs(c,P('M-18 -4 Q-17 -7 -15 -7.5 L-14.5 -5Z'),INK,0);}c.restore();},
 peacock(c,o,f){const B='#1c7ed6',G='#2f9e44',t=o.t;const fan=(cx,cy,n,r,a0,a1)=>{for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/(n-1)+Math.sin(t*1.5)*.03,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;c.strokeStyle='#2b8a3e';c.lineWidth=1.4;c.beginPath();c.moveTo(cx,cy);c.lineTo(x,y);c.stroke();fs(c,ell(x,y,4.6,6),G,1.4);fs(c,ell(x,y,2.6,3.4),'#1098ad',0);fs(c,ell(x,y+.4,1.3,1.8),'#1864ab',0);}};
  if(f)fan(0,8,9,24,-Math.PI*.95,-Math.PI*.05);else fan(10,6,6,22,-Math.PI*.75,Math.PI*.05);
  CR.body(c,f,B,'#4dabf7');CR.head(c,f,B,15,13.5);[[-3,-21],[0,-23],[3,-21]].forEach(([x,y],i)=>{c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.moveTo(f?x*.6:x*.6+3,-19);c.lineTo(f?x:x+3,y-6);c.stroke();fs(c,ell(f?x:x+3,y-7,1.8,1.8),'#1098ad',1);});
  CR.eyes(c,f,o,2.6,3.2);CR.beak(c,f,'#ced4da');CR.cheeks(c,f);},
 bubbles(c,o,f){const oo=Object.assign({},o,{tint:'light'});drawWhale(c,oo);},
 eagle(c,o,f){const B='#7a4a28',W='#f8f9fa';CR.tail(c,f,o,W,null,.6);CR.wings(c,f,'#5c3d22',o.t*3);CR.body(c,f,B,'#a0703f');CR.head(c,f,W);
  c.strokeStyle=INK;c.lineWidth=2;c.lineCap='round';if(!o.mode&&!o.blink&&!o.happy){c.beginPath();if(f){c.moveTo(-10,-14);c.lineTo(-4,-12.5);c.moveTo(10,-14);c.lineTo(4,-12.5);}else{c.moveTo(-10,-13.5);c.lineTo(-3,-12.5);}c.stroke();}
  CR.eyes(c,f,o,2.6,3.2);CR.beak(c,f,'#fcc419','hook');},
 dragon(c,o,f){const R='#e03131',Y='#ffd43b',t=o.t;const wing=(s)=>{c.save();c.translate(s*11,2);c.rotate(s*(.3+Math.sin(t*4)*.2));fs(c,P(`M0 0 Q${s*16} -18 ${s*22} -8 Q${s*17} -6 ${s*16} 0 Q${s*12} -3 ${s*10} 4Z`),'#c92a2a',1.6);c.restore();};
  if(f){wing(-1);wing(1);}else{c.save();c.translate(10,2);c.rotate(-.2+Math.sin(t*4)*.2);fs(c,P('M0 0 Q12 -22 22 -12 Q17 -8 16 -2 Q12 -5 9 3Z'),'#c92a2a',1.6);c.restore();}
  CR.tail(c,f,o,R,null,1.2);if(f)fs(c,P('M14 30 L20 27 L17 34Z'),R,1.4);else fs(c,P('M33 -2 L39 -4 L36 3Z'),R,1.4);
  CR.body(c,f,R,Y);CR.head(c,f,R);fs(c,P(f?'M-9 -20 L-12 -31 L-5 -22Z M9 -20 L12 -31 L5 -22Z':'M3 -19 L6 -31 L9 -19Z'),'#fff3bf',1.6);
  if(!f)fs(c,ell(-12,-4,8,6),R,1.8);CR.eyes(c,f,o);fs(c,ell(f?-2.4:-17,f?-1:-4,.9,.9),INK,0);if(f)fs(c,ell(2.4,-1,.9,.9),INK,0);CR.mouth(c,f,o,3);CR.cheeks(c,f);
  const k=(t%5)/1.2;if(k<1&&o.mode!=='nap'){c.save();c.globalAlpha=(1-k)*.6;fs(c,ell(f?-6-k*6:-20-k*8,f?-2-k*8:-6-k*6,2+k*3,2+k*3),'#ced4da',0);c.restore();} /* a little puff of smoke */},
 skydragon(c,o,f){const T='#38d9a9',D='#0ca678',t=o.t;
  if(f){c.lineCap='round';const pth=new Path2D(`M-4 16 Q-14 26 0 30 Q16 34 ${10+Math.sin(t*2)*4} 40`);c.strokeStyle=INK;c.lineWidth=9;c.stroke(pth);c.strokeStyle=T;c.lineWidth=6.4;c.stroke(pth);}
  else{const pth=new Path2D(`M12 10 Q26 18 30 4 Q34 -8 ${44+Math.sin(t*2)*3} -4`);c.lineCap='round';c.strokeStyle=INK;c.lineWidth=9;c.stroke(pth);c.strokeStyle=T;c.lineWidth=6.4;c.stroke(pth);}
  CR.body(c,f,T,'#fff3bf');if(f){[[-15,-4],[15,-4]].forEach(([x,y],i)=>fs(c,P(i?'M12 -14 Q22 -12 20 -2 Q16 -8 12 -6Z':'M-12 -14 Q-22 -12 -20 -2 Q-16 -8 -12 -6Z'),D,1.4));}
  CR.head(c,f,T);c.strokeStyle='#fcc419';c.lineWidth=2.2;c.lineCap='round';(f?[[-6,-21,-10,-32,-14,-30],[6,-21,10,-32,14,-30]]:[[2,-20,4,-32,9,-32]]).forEach(([a,b,cc,d,e,g])=>{c.beginPath();c.moveTo(a,b);c.lineTo(cc,d);c.lineTo(e,g);c.moveTo(cc+(a<0?1:-1)*.5,d+4);c.lineTo(cc+(a<0?-4:4),d+3);c.stroke();});
  if(!f)fs(c,ell(-11,-3,8,6),T,1.8);CR.eyes(c,f,o);
  c.strokeStyle=INK;c.lineWidth=1.2;const wv=Math.sin(t*3)*2;(f?[[-5,1,-18,6+wv],[5,1,18,6-wv]]:[[-16,-1,-28,4+wv]]).forEach(([a,b,cc,d])=>{c.beginPath();c.moveTo(a,b);c.quadraticCurveTo((a+cc)/2,b+6,cc,d);c.stroke();}); /* long whiskers */
  CR.cheeks(c,f,2);CR.mouth(c,f,o,3);},
 butterfly(c,o,f){const t=o.t,fl=o.mode==='nap'?.95:.72+.28*Math.abs(Math.sin(t*5));const wing=(s,up)=>{c.save();c.scale(s*(f?fl:1),1);const g=c.createLinearGradient(0,-20,0,20);g.addColorStop(0,'#ff922b');g.addColorStop(1,'#cc5de8');
   if(up)fs(c,P('M3 -2 Q8 -30 30 -21 Q33 -4 5 4Z'),g,1.6);else fs(c,P('M3 4 Q26 6 24 23 Q9 27 3 9Z'),g,1.6);fs(c,ell(up?18:14,up?-13:13,3.4,3.4),'#fff3bf',1);c.restore();};
  if(f){wing(-1,true);wing(1,true);wing(-1,false);wing(1,false);}else{c.save();c.translate(4,4);c.scale(1,1);c.rotate(-.2);wing(1,true);wing(1,false);c.restore();}
  fs(c,f?ell(0,12,5,11):ell(4,10,5,10),'#5f3dc4',1.8);CR.head(c,f,'#7950f2',13,12);c.strokeStyle=INK;c.lineWidth=1.4;(f?[[-4,-19,-9,-30],[4,-19,9,-30]]:[[-1,-19,-6,-30]]).forEach(([a,b,cc,d])=>{c.beginPath();c.moveTo(a,b);c.quadraticCurveTo(a,d,cc,d);c.stroke();fs(c,ell(cc,d,1.8,1.8),'#fcc419',1);});
  CR.eyes(c,f,o,2.6,3.2,5);CR.cheeks(c,f,-2);CR.mouth(c,f,o,0);},
 /* the Color Chameleon (Grey Goblin prize): its colour slowly drifts through the rainbow; turret eyes and a curled tail */
 chameleon(c,o,f){const t=o.t,h=(t*35)%360,G=`hsl(${h},62%,52%)`,G2=`hsl(${h},55%,38%)`,BL=`hsl(${(h+40)%360},70%,80%)`;
  if(f){const sw=Math.sin(t*2.4)*2;c.lineCap='round';c.strokeStyle=INK;c.lineWidth=6.5;c.beginPath();c.moveTo(-4,20);c.quadraticCurveTo(-14,30,-6+sw,32);c.stroke();c.strokeStyle=G;c.lineWidth=3.8;c.stroke();fs(c,ell(-4+sw,29,4,4),G,1.6);fs(c,ell(-4+sw,29,1.8,1.8),G2,0);}
  else{const sw=Math.sin(t*2.4)*3;c.lineCap='round';c.strokeStyle=INK;c.lineWidth=6.5;c.beginPath();c.moveTo(12,12);c.quadraticCurveTo(26,10+sw,26,20);c.stroke();c.strokeStyle=G;c.lineWidth=3.8;c.stroke();fs(c,ell(21,21,4.6,4.6),G,1.6);fs(c,ell(21,21,2,2),G2,0);}
  CR.body(c,f,G,BL);CR.head(c,f,G,17,14);
  if(f){fs(c,P('M-8 -21 L-4 -27 L0 -22 L4 -27 L8 -21Z'),G2,1.6);
   [[-12,-11],[12,-11]].forEach(([x,y])=>{fs(c,ell(x,y,6.2,6.2),G,2);fs(c,ell(x,y,3.4,3.4),'#fff',1.2);if(!o.blink&&o.mode!=='nap')fs(c,ell(x+Math.sin(t*1.7+x)*1.4,y,1.8,1.8),INK,0);else{c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(x-3,y);c.lineTo(x+3,y);c.stroke();}});
   smile(c,0,1,3.2,o.puff);blush(c,[[-10,-1],[10,-1]]);}
  else{fs(c,P('M-2 -21 L2 -27 L6 -22 L10 -27 L13 -20Z'),G2,1.6);fs(c,ell(-5,-11,6.4,6.4),G,2);fs(c,ell(-6,-11,3.4,3.4),'#fff',1.2);
   if(!o.blink&&o.mode!=='nap')fs(c,ell(-7.4,-11,1.8,1.8),INK,0);else{c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(-9,-11);c.lineTo(-3,-11);c.stroke();}
   smile(c,-11,0,2.6,o.puff);blush(c,[[-3,-2]]);}},
 /* Sorty the Recycle Bot (Clean-Up prize): a little floating robot with an antenna, a screen face and a jet instead of legs */
 sorty(c,o,f){const t=o.t,V='#7048e8',M='#d0d4ff',fl=Math.sin(t*20);
  fs(c,P(f?`M-6 22 Q0 ${34+fl*3} 6 22Z`:`M-2 22 Q4 ${34+fl*3} 10 22Z`),'#ffd43b',1.4);fs(c,P(f?`M-3 22 Q0 ${29+fl*2} 3 22Z`:`M1 22 Q4 ${29+fl*2} 7 22Z`),'#fff3bf',0);
  {const b=new Path2D();if(f)b.roundRect(-14,2,28,21,7);else b.roundRect(-9,2,26,21,7);fs(c,b,M,2);}
  {const x=f?0:4,y=12;c.strokeStyle='#2f9e44';c.lineWidth=2.2;c.lineCap='round';for(let i=0;i<3;i++){const a=i*2.094-1.57+t*.6;c.beginPath();c.arc(x,y,5.2,a,a+1.5);c.stroke();}}
  if(f){[[-1,-17],[1,17]].forEach(([s,x])=>{c.save();c.translate(x,10);c.rotate(s*(.35+Math.sin(t*3)*.15));fs(c,ell(s*3,4,3.2,6.5),V,1.8);c.restore();});}
  else{c.save();c.translate(2,10);c.rotate(-.3+Math.sin(t*3)*.15);fs(c,ell(0,5,3.2,6.5),V,1.8);c.restore();}
  c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(f?0:3,-22);c.lineTo(f?0:5,-30);c.stroke();fs(c,ell(f?0:5,-31,3,3),(Math.floor(t*2)%2)?'#ff6b6b':'#ffd43b',1.4);
  {const h=new Path2D();if(f)h.roundRect(-16,-23,32,24,8);else h.roundRect(-12,-23,28,24,8);fs(c,h,V,2.2);
   const sc=new Path2D();if(f)sc.roundRect(-12,-19,24,16,5);else sc.roundRect(-11,-19,17,16,5);fs(c,sc,'#1b1446',1.4);}
  const ex=f?[[-5,-11],[5,-11]]:[[-6,-11]];c.fillStyle='#63e6be';
  ex.forEach(([x,y])=>{if(o.blink||o.mode==='nap'){c.fillRect(x-2.5,y,5,1.6);}else{c.beginPath();c.ellipse(x,y,2.4,o.puff?3.6:2.8,0,0,7);c.fill();}});
  c.strokeStyle='#63e6be';c.lineWidth=1.5;c.beginPath();const mx=f?0:-7;if(o.puff)c.ellipse(mx,-6,1.8,1.8,0,0,7);else{c.moveTo(mx-3.5,-7);c.quadraticCurveTo(mx,-4,mx+3.5,-7);}c.stroke();},
 boo(c,o,f){const t=o.t;c.save();c.globalAlpha=.92;let d=f?'M-17 -6 Q-18 -26 0 -26 Q18 -26 17 -6 L17 22':'M-16 -6 Q-17 -26 2 -26 Q20 -24 18 -4 L20 22';
  for(let i=0;i<=5;i++){const x=(f?17:20)-i*(f?34:36)/5,y=22+(i%2?-5:0)+Math.sin(t*4+i)*2;d+=` L${x.toFixed(1)} ${y.toFixed(1)}`;}d+='Z';
  if(!f){const sw=Math.sin(t*2)*3;d=`M-16 -6 Q-17 -26 2 -26 Q20 -24 20 -4 Q24 10 ${34+sw} 16 Q22 22 14 18 L10 24 L4 18 L-2 24 L-8 18 L-14 22Z`;}
  fs(c,new Path2D(d),'#f8f9fa',2.2);c.restore();CR.eyes(c,f,o,3,3.8,6.5,-10);blush(c,f?[[-11,-3],[11,-3]]:[[-5,-3]]);smile(c,f?0:-10,-1,2.6,o.puff);},
 gobble(c,o,f){const B='#8b5a2b',t=o.t;const fan=(cx,cy,n,r,a0,a1)=>{const cols=['#e8590c','#c92a2a','#8b5a2b','#fcc419'];for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/(n-1)+Math.sin(t*1.5)*.03;c.save();c.translate(cx,cy);c.rotate(a+Math.PI/2);fs(c,ell(0,-r*.6,4.6,r*.62),cols[i%4],1.4);fs(c,ell(0,-r*1.05,3.4,3),'#fff3bf',1);c.restore();}};
  if(f)fan(0,10,9,22,-Math.PI*.95,-Math.PI*.05);else fan(10,6,6,20,-Math.PI*.75,Math.PI*.05);
  CR.body(c,f,B,'#c08552');CR.head(c,f,'#c08552',14,13);CR.eyes(c,f,o,2.4,3);CR.beak(c,f,'#fcc419');
  fs(c,f?P('M1 1 Q4 6 1 10 Q-1 6 1 1Z'):P('M-14 -1 Q-12 6 -15 9 Q-17 4 -14 -1Z'),'#e03131',1.2); /* wattle */CR.cheeks(c,f,-3);}
};
function drawCritter(c,o){const fn=CRITTERS[o.kind];if(!fn)return;c.save();if(o.puff&&o.kind!=='bubbles')c.scale(1.15,1.15);c.__t=o.t;fn(c,o,o.view!=='side');c.restore();}

/* where things are on the little map, for the pet to visit */

/* ---------- on the map ---------- */
/* the game's pet ids that the mockup named differently */
const KIND={bigwhale:'whale',whale:'bubbles'};
const SIZE={bigwhale:1.2,dolphin:1.05,shark:1.1,peacock:1.05,dragon:1.1,skydragon:1.05,gobble:1.05};
const EMO_LEN={spin:1.2,puff:1.0,nap:5};
const PT={x:0,y:0,vx:0,vy:0,alt:.55,mode:'follow',mt:0,t:0,face:'front',blinkAt:1.5,blinkT:0,pend:null,fx:[],last:0,init:false,nextLoop:25};
function petDo(m){PT.mode=m;PT.mt=0;if(m==='spin'){PT.spinDir=Math.random()<.35?-1:1; /* now and then the loop goes the other way */
 for(let i=0;i<5;i++)PT.fx.push({k:'heart',x:(Math.random()-.5)*30,y:-10,vy:-30-Math.random()*20,t:0,life:1.2});}}
/* the hero's big moments (hero.js calls this when an emote starts) */
function react(m){if(m==='cheer'||m==='level')PT.pend={m:'spin',at:PT.t+.25};
 else if(m==='zap')PT.pend={m:'puff',at:PT.t+.1};
 else if(m==='sneeze')PT.pend={m:'puff',at:PT.t+.9};
 else if(m==='doze')PT.pend={m:'nap',at:PT.t+1.2};}
function update(dt,W,now){PT.t+=dt;PT.mt+=dt;
 const HS=window.HeroPuppet&&HeroPuppet.state?HeroPuppet.state():{view:'down',mode:'idle'},hx=W.drawX,hy=W.drawY;
 if(!PT.init){PT.init=true;PT.x=hx-.7;PT.y=hy-.3;PT.hpx=hx;PT.hpy=hy;}
 if(Math.hypot(hx-PT.x,hy-PT.y)>6){PT.x=hx-.7;PT.y=hy-.3;PT.vx=PT.vy=0;PT.hpx=hx;PT.hpy=hy;} /* the hero jumped somewhere (train, door): the pet comes along */
 PT.blinkT-=dt;if(PT.blinkT<=0&&PT.t>PT.blinkAt){PT.blinkT=.12;PT.blinkAt=PT.t+2+Math.random()*3;}
 if(PT.pend&&PT.t>=PT.pend.at){const m=PT.pend.m;PT.pend=null;petDo(m);}
 if((PT.mode==='spin'||PT.mode==='puff')&&PT.mt>EMO_LEN[PT.mode]){PT.mode='follow';PT.mt=0;}
 if(PT.mode==='nap'&&PT.mt>1.5&&HS.mode!=='doze'){PT.mode='follow';PT.mt=0;}
 /* now and then, while the hero stands about, a happy loop of its own */
 if(PT.mode==='follow'&&HS.mode==='idle'&&PT.t>PT.nextLoop){PT.nextLoop=PT.t+25+Math.random()*25;petDo('spin');}
 if(HS.mode==='walk')PT.nextLoop=Math.max(PT.nextLoop,PT.t+8);
 /* where it wants to be: beside and a little behind the hero */
 const bh={left:[.75,-.12],right:[-.75,-.12],down:[-.7,-.3],up:[.65,.3]}[HS.view]||[-.7,-.25];
 /* the hero's speed, so the pet keeps pace instead of lagging behind */
 const hvx=(hx-PT.hpx)/Math.max(dt,1e-3),hvy=(hy-PT.hpy)/Math.max(dt,1e-3);PT.hpx=hx;PT.hpy=hy;const vcap=v=>Math.max(-9,Math.min(9,v));
 const tx=hx+bh[0],ty=hy+bh[1],talt=PT.mode==='nap'?.28:.55,k=16,fvx=vcap(hvx),fvy=vcap(hvy),c2=2*Math.sqrt(k);
 PT.vx+=((tx-PT.x)*k+(fvx-PT.vx)*c2)*dt;PT.vy+=((ty-PT.y)*k+(fvy-PT.vy)*c2)*dt;PT.x+=PT.vx*dt;PT.y+=PT.vy*dt;
 PT.alt+=(talt-PT.alt)*Math.min(1,dt*4);
 if(Math.abs(PT.vx)>.6)PT.face=PT.vx<0?'left':'right';else if(Math.abs(PT.vx)<.25&&Math.abs(PT.vy)<.6)PT.face='front';
 PT.fx=PT.fx.filter(q=>(q.t+=dt)<q.life);}
/* draws the pet at its own spot; (ox,oy) = the screen position of map square (0,0), ts = square size */
function drawAt(c,id,ox,oy,ts){const kind=KIND[id]||id,gx=ox+(PT.x+.5)*ts,gy=oy+(PT.y+.9)*ts,bob=Math.sin(PT.t*2.6)*(PT.mode==='nap'?1.5:3.5)*ts/48;
 /* the shadow stays on the ground and gets smaller the higher it floats */
 c.globalAlpha=.2;c.fillStyle='#000';c.beginPath();c.ellipse(gx,gy,(13-PT.alt*4)*ts/48,(3.6-PT.alt)*ts/48,0,0,7);c.fill();c.globalAlpha=1;
 const sc=ts/92*(SIZE[id]||1),cy=gy-PT.alt*ts+bob-ts*.25;c.save();c.translate(gx,cy);c.scale(sc,sc);
 c.rotate(Math.max(-.25,Math.min(.25,PT.vx*.08)));
 if(PT.mode==='spin'){const k=clamp01(PT.mt/.9);c.translate(0,-Math.sin(k*Math.PI)*16);c.rotate(smooth(k)*Math.PI*2*(PT.spinDir||1));}
 if(PT.mode==='puff'&&PT.mt<.5)c.translate(Math.sin(PT.mt*90)*1.5,0);
 if(PT.face==='right')c.scale(-1,1);
 drawPet(c,{kind,view:PT.face==='front'?'front':'side',t:PT.t,mode:PT.mode,blink:PT.blinkT>0,happy:PT.mode==='spin',puff:PT.mode==='puff'&&PT.mt<.8,lx:0,ly:0});
 c.restore();
 /* little extras: hearts, Zzz, the startled "!" */
 const hx=gx,hy=cy-ts*.35,fz=ts/48;
 PT.fx.forEach(q=>{if(q.k==='heart'){c.globalAlpha=Math.max(0,1-q.t/q.life);heart(c,hx+q.x*sc,hy+(q.y+q.vy*q.t)*sc,5*fz,'#ff6f91');c.globalAlpha=1;}});
 if(PT.mode==='nap'&&PT.mt>.8){c.save();c.textAlign='center';for(let i=0;i<2;i++){const q=((PT.mt-.8)*.5+i/2)%1;c.globalAlpha=Math.min(1,(1-q)*1.5);c.font='800 '+((7+q*5)*fz).toFixed(1)+'px Fredoka, Trebuchet MS, sans-serif';c.lineWidth=2.5;c.strokeStyle='#fff';c.strokeText('z',hx+(8+q*12)*fz,hy-q*16*fz);c.fillStyle='#5c7cfa';c.fillText('z',hx+(8+q*12)*fz,hy-q*16*fz);}c.restore();}
 if(PT.mode==='puff'&&PT.mt<.9){c.save();c.font='800 '+Math.round(15*fz)+'px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#fff';c.strokeText('!',hx+10*fz,hy-6*fz);c.fillStyle='#f03e3e';c.fillText('!',hx+10*fz,hy-6*fz);c.restore();}}
/* called from the map each frame: moves the pet and returns {y, draw} for the map's depth sort, or null */
function mapItem(c,id,W,cx,cy,ts,now){const dt=Math.min(.1,PT.last?(now-PT.last)/1000:0);PT.last=now;update(dt,W,now);
 return {y:PT.y-.02,draw:()=>drawAt(c,id,-cx,-cy,ts)};}
/* the picture at any size, for tests and the gallery: draw(ctx, petId, {view:'front'|'side', t, mode}) centred on (0,0) */
function draw(c,id,o){return drawPet(c,Object.assign({kind:KIND[id]||id,view:'front',t:0,mode:'follow'},o||{}));}
const has=id=>{const k=KIND[id]||id;return !!(CRITTERS[k]||['fox','cat','nova','unicorn','titan','whale'].includes(k));};
window.PetPuppet={ok:true,mapItem,draw,react,has,state:()=>PT};
})();
