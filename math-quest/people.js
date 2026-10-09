/* people.js — the walking characters as puppets (owner's mockup, Oct 2026): Elder Wiz, Principal Wise, Dr. Quartz, Coach Flex, Gizmo, the Kind Teacher.
   Same frame as the hero puppet: 100 x 130, feet on y=124, the head about (50,40). Views: down (front), up (back), left, right
   (right = left mirrored, back = front layout mirrored like the hero). st = {view, walk, phase, t, mode, mt, blink, talk}. */
(function(){
const INK='#2b2140';
const cache={};const P=s=>cache[s]||(cache[s]=new Path2D(s));
function ell(cx,cy,rx,ry){const p=new Path2D();p.ellipse(cx,cy,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);return p;}
function fs(c,path,fill,w){c.fillStyle=fill;c.fill(path);if(w!==0){c.lineWidth=w||2.4;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';c.stroke(path);}}
function rr(x,y,w,h,r){const p=new Path2D();p.roundRect(x,y,w,h,r);return p;}
function limb(c,pts,w,col,dim){c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=INK;c.lineWidth=w+3.6;c.stroke();c.strokeStyle=col;c.lineWidth=w;c.stroke();if(dim){c.strokeStyle='rgba(0,0,0,.2)';c.stroke();}}
function arm(sx,sy,a1,a2,l1,l2){const ex=sx+Math.sin(a1)*l1,ey=sy+Math.cos(a1)*l1;return {sx,sy,ex,ey,hx:ex+Math.sin(a2)*l2,hy:ey+Math.cos(a2)*l2};}
function star(c,x,y,r,col){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}c.closePath();c.fillStyle=col;c.fill();c.lineWidth=1;c.strokeStyle=INK;c.stroke();}
const lerp=(a,b,k)=>a+(b-a)*k,clamp01=k=>Math.max(0,Math.min(1,k)),smooth=k=>k*k*(3-2*k);
const env=(mt,a,b,fin,fout)=>smooth(clamp01((mt-a)/fin))*(1-smooth(clamp01((mt-b)/fout)));
/* eyes: open dots (or closed lines when blinking); x,y centre */
function eyesAt(c,pts,o,r){r=r||2.3;pts.forEach(([x,y])=>{if(o.blink||o.sleep){c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(x-2.3,y);c.lineTo(x+2.3,y);c.stroke();}
 else{fs(c,ell(x+(o.lx||0),y+(o.ly||0),r,r*1.25),INK,0);fs(c,ell(x+(o.lx||0)+.8,y+(o.ly||0)-.9,r*.38,r*.38),'#fff',0);}});}
/* a mouth that opens and closes while talking */
function mouthAt(c,x,y,w,o,col){c.strokeStyle=INK;c.lineWidth=1.8;c.lineCap='round';
 if(o.talk&&Math.sin(o.t*15)>-.2){fs(c,ell(x,y+1,w*.42,1.4+Math.abs(Math.sin(o.t*15))*1.6),col||'#8a2c3b',1.5);return;}
 c.beginPath();c.moveTo(x-w/2,y);c.quadraticCurveTo(x,y+(o.smile===false?0:3.2),x+w/2,y);c.stroke();}

/* ---------- the shared body: legs, torso, arms, head, the thing in their hand ---------- */
/* spec: {legs:{col,shoe,w,gap}, float, arms:{col,w,hand}, torso(c,v,o), head(c,v,o), item(c,o) drawn at the item hand (0,0) = hand,
   itemHand: 'R' (the hand on the viewer's right in the front view), pose(o) special arm poses, h: height scale } */
function drawPerson(c,S,st){const v=st.view||'down',back=v==='up',side=v==='left'||v==='right',mirror=v==='up'||v==='right';
 const t=st.t||0,walk=!!st.walk,ph=st.phase||0,s=Math.sin(ph),mode=st.mode||'idle',mt=st.mt||0;
 const o={t,v,walk,s,mode,mt,blink:st.blink,talk:st.talk,side,back,lx:0,ly:0,sleep:false};
 let bob=walk?-Math.abs(s)*2.2:Math.sin(t*2.2)*.6;if(S.float){bob=Math.sin(t*2)*3-6;}
 c.save();
 if(!st.noShadow){c.globalAlpha=.2;c.fillStyle='#000';c.beginPath();c.ellipse(50,125,S.float?18:24,3.6,0,0,7);c.fill();c.globalAlpha=1;}
 if(mirror){c.translate(100,0);c.scale(-1,1);}
 c.translate(50,124);c.scale(S.h||1,S.h||1);c.translate(-50,-124);
 /* arm poses: default hanging, walking swing, then the special moves */
 const sw=walk?s*.4:0,L=S.arms.l1||14,L2=S.arms.l2||13,shY=S.arms.y||64,shX=S.arms.x||15;
 let aL=arm(50-shX,shY,-.18-sw*.6,-.1-sw*.7,L,L2),aR=arm(50+shX,shY,.18+sw*.6,.1+sw*.7,L,L2);
 if(mode==='wave'){const w=Math.sin(mt*13)*.45,r=env(mt,0,2,.2,.3);aL=arm(50-shX,shY,lerp(-.18,-2.6,r),lerp(-.1,-3+w,r),L,L2);}
 o.aL=aL;o.aR=aR;if(S.pose)S.pose(o,arm,L,L2,shX,shY);aL=o.aL;aR=o.aR;
 const itemNear=!side||v==='left'; /* the item hand is the hero-style "staff hand": near when facing left, behind when facing right */
 c.translate(0,bob);
 if(!side){
  if(S.float&&S.wings&&!back)S.wings(c,v,o);
  if(!S.float)legsFront(c,S,o);
  if(S.cape)S.cape(c,v,o);
  if(back){S.torso(c,v,o);S.head(c,v,o);drawArm(c,S,aL,o);drawArm(c,S,aR,o);if(S.item){c.save();c.translate(aR.hx,aR.hy);S.item(c,o,false);c.restore();}}
  else{S.torso(c,v,o);drawArm(c,S,aL,o);if(S.item&&S.itemBehindArm){c.save();c.translate(aR.hx,aR.hy);S.item(c,o,true);c.restore();}drawArm(c,S,aR,o);S.head(c,v,o);
   if(S.item&&!S.itemBehindArm){c.save();c.translate(aR.hx,aR.hy);S.item(c,o,true);c.restore();}}
 }else{
  /* side, facing left: far arm and leg first, then the body, then the near ones */
  const sx=walk?s*.55:0;const far=arm(50+2,shY,itemNear?-sx*.9:-.15+sx*.9,itemNear?-sx-.2:-.75+sx*.7,L,L2),near=arm(50-2,shY,itemNear?(S.sidePose?S.sidePose(o):-.15+sx*.5):sx*.9,itemNear?(S.sidePose2?S.sidePose2(o):-.75+sx*.4):sx-.2,L,L2);
  if(S.poseSide)S.poseSide(o,near,far,arm,L,L2,shY,itemNear);
  if(S.float&&S.wings)S.wings(c,v,o);
  if(!S.float)legsSide(c,S,o,'far');
  if(!itemNear&&S.item){c.save();c.translate(o.far2?o.far2.hx:far.hx,o.far2?o.far2.hy:far.hy);S.item(c,o,false);c.restore();}
  drawArm(c,S,o.far2||far,o,true);
  if(!S.float)legsSide(c,S,o,'near');
  if(S.cape)S.cape(c,v,o);
  S.torso(c,v,o);S.head(c,v,o);
  drawArm(c,S,o.near2||near,o);
  if(itemNear&&S.item){c.save();c.translate((o.near2||near).hx,(o.near2||near).hy);S.item(c,o,true);c.restore();}
 }
 if(S.float&&S.wings&&back)S.wings(c,v,o);
 if(S.fx)S.fx(c,o,aL,aR);
 c.restore();return o;}
function drawArm(c,S,g,o,dim){const A=S.arms;limb(c,[[g.sx,g.sy],[g.ex,g.ey],[g.hx,g.hy]],A.w||7,A.col,dim);
 if(A.cuff)fs(c,ell(lerp(g.ex,g.hx,.78),lerp(g.ey,g.hy,.78),3.4,3.4),A.cuff,1.4);fs(c,ell(g.hx,g.hy,A.hand||4.6,A.hand||4.6),A.skin,1.8);if(dim)fs(c,ell(g.hx,g.hy,A.hand||4.6,A.hand||4.6),'rgba(0,0,0,.18)',0);}
function legsFront(c,S,o){const Lg=S.legs,g=Lg.gap||6,hip=Lg.hip||94,lift=o.walk?5:0;
 [[-1,Math.max(0,o.s)*lift],[1,Math.max(0,-o.s)*lift]].forEach(([d,l])=>{const x=50+d*g;limb(c,[[x,hip],[x+d*.5,121-l]],Lg.w||8,Lg.col);
  if(Lg.sock)limb(c,[[x+d*.4,113-l],[x+d*.5,119-l]],(Lg.w||8)-1,Lg.sock);fs(c,ell(x+d*1.2,122.5-l,Lg.shoeW||6.6,3.6),Lg.shoe,1.8);if(Lg.shoe2)fs(c,ell(x+d*1.2,123.4-l,(Lg.shoeW||6.6)*.9,1.4),Lg.shoe2,0);});}
function legsSide(c,S,o,which){const Lg=S.legs,hip=Lg.hip||94,st=o.walk?o.s*9:0,far=which==='far',x=50+(far?-st:st),up=o.walk?Math.max(0,far?Math.cos(o.s*1.6+.1)*0:0,0):0;
 const lift=o.walk?Math.max(0,(far?1:-1)*Math.cos(Math.asin(Math.max(-1,Math.min(1,o.s)))))*0:0;
 const fl=o.walk?(far?Math.max(0,o.s):Math.max(0,-o.s))*4:0;
 limb(c,[[50,hip],[x,121-fl]],Lg.w||8,Lg.col,far);if(Lg.sock)limb(c,[[lerp(50,x,.8),113-fl],[x,119-fl]],(Lg.w||8)-1,Lg.sock,far);
 fs(c,ell(x-2.5,122.5-fl,(Lg.shoeW||6.6)+.8,3.4),far?shade(Lg.shoe):Lg.shoe,1.8);if(Lg.shoe2&&!far)fs(c,ell(x-2.5,123.4-fl,(Lg.shoeW||6.6)*.9,1.3),Lg.shoe2,0);}
function shade(col){return col==='#2b2140'||col==='#1d1a26'?'#16131c':'rgba(0,0,0,.0)'===col?col:col;}

/* ---------- the characters ---------- */
const SKIN={fair:'#f8d6bd',pink:'#f5c9a5',tan:'#c98a5a',grey:'#9aa1ad'};
/* 1. Principal Wise: bald with white sides, round glasses, white mustache, navy suit, red tie, gold pin, clipboard */
const PRINCIPAL={h:1.05,legs:{col:'#1b2f55',shoe:'#2b2140',w:8.4,gap:5.6},arms:{col:'#1f3a68',w:7.6,skin:SKIN.pink,cuff:'#ffffff'},itemHand:'R',
 torso(c,v,o){const suit='#1f3a68';
  if(v==='left'||v==='right'){fs(c,P('M40 59 Q52 55 61 61 L61 97 Q50 100 40 97 Z'),suit,2.4);fs(c,P('M40 60 L44 60 L43 74 Z'),'#fff',0);fs(c,P('M41 62 L43.5 62 L43.5 72 L41.5 74 Z'),'#d63939',1);c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1.4;c.beginPath();c.moveTo(44,61);c.lineTo(47,80);c.stroke();return;}
  fs(c,P('M33 60 Q50 54 67 60 L66 97 Q50 101 34 97 Z'),suit,2.4);
  if(v==='up'){c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1.4;c.beginPath();c.moveTo(50,62);c.lineTo(50,96);c.stroke();return;}
  fs(c,P('M43 57 L50 76 L57 57 Z'),'#fff',1.6);fs(c,P('M48.4 60 L51.6 60 L52.6 72 L50 77 L47.4 72 Z'),'#d63939',1.2);
  c.strokeStyle='#162b4f';c.lineWidth=1.6;c.beginPath();c.moveTo(43,58);c.lineTo(48,80);c.moveTo(57,58);c.lineTo(52,80);c.stroke();
  fs(c,ell(39.5,68,2.1,2.1),'#f5c400',1);fs(c,ell(50,86,1.3,1.3),'#0e1d38',0);fs(c,ell(50,92,1.3,1.3),'#0e1d38',0);},
 head(c,v,o){const sk=SKIN.pink,wh='#eef0f3';
  if(v==='left'||v==='right'){fs(c,ell(51,40,14.5,15.5),sk,2.4);fs(c,P('M53 42 Q66 36 63 50 Q58 54 54 50 Z'),wh,1.6);fs(c,ell(56,43,3,3.6),sk,1.6);
   fs(c,P('M37.4 41 Q32.8 44.5 37 47.5'),sk,0);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(37.6,40.6);c.quadraticCurveTo(32.6,44.5,37.2,48);c.stroke();
   c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.arc(42,40,4.2,0,7);c.moveTo(46.2,40);c.lineTo(55,41.5);c.stroke();eyesAt(c,[[41.5,40.5]],o,1.8);
   fs(c,P('M35 49.5 Q40 47 45 49.5 Q41 52 35 49.5Z'),wh,1.3);mouthAt(c,40,53.5,5,o);c.strokeStyle='#b8bec8';c.lineWidth=1.8;c.beginPath();c.moveTo(38,34);c.lineTo(45,33);c.stroke();return;}
  if(v==='up'){fs(c,ell(50,40,15.5,15.5),sk,2.4);fs(c,P('M35 40 Q35 52 50 55 Q65 52 65 40 Q66 50 58 48 Q50 52 42 48 Q34 50 35 40Z'),wh,1.6);fs(c,ell(35,43,3,3.8),sk,1.6);fs(c,ell(65,43,3,3.8),sk,1.6);return;}
  fs(c,ell(35,43,3,3.8),sk,1.6);fs(c,ell(65,43,3,3.8),sk,1.6);fs(c,ell(50,40,15.5,15.5),sk,2.4);
  fs(c,P('M34 38 Q31 45 36 49 Q37 43 37 38Z'),wh,1.4);fs(c,P('M66 38 Q69 45 64 49 Q63 43 63 38Z'),wh,1.4);
  c.globalAlpha=.25;fs(c,ell(45,30,4,2),'#fff',0);c.globalAlpha=1;
  c.strokeStyle='#b8bec8';c.lineWidth=1.8;c.lineCap='round';c.beginPath();c.moveTo(40.5,34.5);c.lineTo(46,34);c.moveTo(54,34);c.lineTo(59.5,34.5);c.stroke();
  c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.arc(44,40.5,4.3,0,7);c.moveTo(60.3,40.5);c.arc(56,40.5,4.3,0,7);c.moveTo(48.3,40.5);c.lineTo(51.7,40.5);c.stroke();
  eyesAt(c,[[44,40.8],[56,40.8]],o,1.8);fs(c,P('M42 49 Q50 45.5 58 49 Q55 52 50 50.5 Q45 52 42 49Z'),wh,1.3);mouthAt(c,50,53.5,6,o);
  c.globalAlpha=.3;fs(c,ell(39,48,2.4,1.6),'#ff8fa3',0);fs(c,ell(61,48,2.4,1.6),'#ff8fa3',0);c.globalAlpha=1;},
 item(c,o,front){c.save();c.rotate(front?-.12:-.05);fs(c,rr(-6,-4,13,17,1.5),'#a0673a',1.8);fs(c,rr(-4.2,-1.6,9.4,13,1),'#fff',0);fs(c,rr(-2.5,-5.6,6,3.2,1),'#c0c6cf',1.2);
  c.strokeStyle='#9aa4b1';c.lineWidth=.9;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-3,1.6+i*3);c.lineTo(3.8,1.6+i*3);c.stroke();}
  if(o.mode==='act'&&o.mt>.7&&o.mt<2.2){c.strokeStyle='#18794e';c.lineWidth=1.6;c.beginPath();c.moveTo(-3.6,3+Math.floor(o.mt*2)%3*3);c.lineTo(-2.4,4.2+Math.floor(o.mt*2)%3*3);c.lineTo(-.4,1.6+Math.floor(o.mt*2)%3*3);c.stroke();}c.restore();},
 /* special: lifts the clipboard to read it and ticks something off */
 pose(o,arm,L,L2,shX,shY){if(o.mode!=='act')return;const r=env(o.mt,0,2.4,.3,.35);o.aR=arm(50+shX,shY,lerp(.18,-.5,r),lerp(.1,-2.3,r),L,L2);o.aL=arm(50-shX,shY,lerp(-.18,.35,r),lerp(-.1,-1.9,r),L,L2);o.ly=r*1.4;},
 say:['Walk, don\'t run!','Splendid work!','Now where did I put my pencil?'],act:'Checking the clipboard 📋',actLen:2.6};

/* 2. Dr. Quartz: fluffy white hair, big round glasses, white lab coat with a blue tie, grey trousers, magnifying glass */
const QUARTZ={h:1.02,legs:{col:'#4a4f5c',shoe:'#2b2140',w:8,gap:5.4},arms:{col:'#fbfbfd',w:8,skin:SKIN.fair},itemHand:'R',
 cape(c,v,o){const sw=o.walk?Math.sin(o.t*7)*2:Math.sin(o.t*1.6)*.8;
  if(v==='left'||v==='right'){fs(c,new Path2D(`M42 60 Q60 58 62 64 L${67+sw} 108 Q55 112 42 108 Z`),'#f3f4f8',2.2);return;}
  fs(c,new Path2D(`M33 60 Q50 55 67 60 L${70+sw} 108 Q50 113 ${30-sw} 108 Z`),'#f3f4f8',2.2);},
 torso(c,v,o){const coat='#fbfbfd';
  if(v==='left'||v==='right'){fs(c,P('M41 59 Q52 55 61 61 L60 99 Q50 101 41 99 Z'),coat,2.3);fs(c,P('M41 60 L45 60 L44 72 Z'),'#7fb2ff',0);fs(c,rr(47,74,7,6,1),'#e9ecef',1.2);return;}
  fs(c,P('M34 60 Q50 55 66 60 L65 99 Q50 102 35 99 Z'),coat,2.3);
  if(v==='up'){c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1.4;c.beginPath();c.moveTo(50,62);c.lineTo(50,99);c.stroke();return;}
  fs(c,P('M44 58 L50 70 L56 58 Z'),'#7fb2ff',1.4);fs(c,P('M48.8 61 L51.2 61 L52 69 L50 72 L48 69 Z'),'#3b5bdb',1);
  c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=1.4;c.beginPath();c.moveTo(44,59);c.lineTo(48,99);c.moveTo(56,59);c.lineTo(52,99);c.stroke();
  fs(c,rr(55.5,66,7.5,7,1.2),'#e9ecef',1.2);fs(c,rr(57,63.5,1.6,6,.6),'#f03e3e',0);fs(c,rr(59.6,63.5,1.6,6,.6),'#4dabf7',0);},
 head(c,v,o){const sk=SKIN.fair,hr='#f1f3f5',puff=(pts)=>pts.forEach(([x,y,r])=>fs(c,ell(x,y,r,r),hr,1.6));
  if(v==='left'||v==='right'){puff([[54,28,7],[61,33,7],[63,42,6.5],[47,26,6]]);fs(c,ell(50,41,14,14.5),sk,2.3);puff([[56,30,6],[59,37,5]]);fs(c,ell(56,43,3,3.6),sk,1.5);
   fs(c,P('M36.6 42 Q31.8 45.5 36.3 48.6'),sk,0);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(36.8,41.6);c.quadraticCurveTo(31.6,45.5,36.5,49);c.stroke();
   fs(c,ell(41.5,40.5,5.2,5.2),'rgba(220,240,255,.75)',1.8);c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(46.7,40.5);c.lineTo(55,40);c.stroke();eyesAt(c,[[41.5,41]],o,2);mouthAt(c,40,52,5,o);return;}
  if(v==='up'){fs(c,ell(50,41,14.5,14.5),sk,2.3);puff([[38,30,7],[50,26,7.5],[62,30,7],[36,40,6.5],[64,40,6.5],[42,44,6.5],[58,44,6.5],[50,45,6.5]]);return;}
  fs(c,ell(36,44,3,3.6),sk,1.5);fs(c,ell(64,44,3,3.6),sk,1.5);fs(c,ell(50,41,14.5,14.5),sk,2.3);puff([[37,30,6.5],[44,26,6.5],[52,25,7],[60,28,6.5],[64,35,5.5],[35,36,5.5]]);
  c.strokeStyle='#d0d4da';c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(40,35.4);c.lineTo(46,34.6);c.moveTo(54,34.6);c.lineTo(60,35.4);c.stroke();
  const big=o.mode==='act'&&o.mt>.5&&o.mt<2.3?0:0;
  fs(c,ell(44,41,5.4,5.4),'rgba(220,240,255,.75)',1.8);fs(c,ell(56,41,5.4,5.4),'rgba(220,240,255,.75)',1.8);c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(49.4,41);c.lineTo(50.6,41);c.stroke();
  eyesAt(c,[[44,41.4],[56,41.4]],o,2.1);mouthAt(c,50,51.5,6,o);c.globalAlpha=.3;fs(c,ell(39,48,2.4,1.6),'#ff8fa3',0);fs(c,ell(61,48,2.4,1.6),'#ff8fa3',0);c.globalAlpha=1;},
 item(c,o,front){c.save();c.rotate(front?.5:.3);limb(c,[[0,2],[0,12]],3,'#a0673a');fs(c,ell(0,-6,7,7),'rgba(200,235,255,.55)',2.4);c.strokeStyle='#868e96';c.lineWidth=1.4;c.beginPath();c.arc(0,-6,7,0,7);c.stroke();
  c.globalAlpha=.8;c.strokeStyle='#fff';c.lineWidth=1.4;c.beginPath();c.arc(-1.5,-7.5,3.5,3.4,4.6);c.stroke();c.globalAlpha=1;c.restore();},
 /* special: holds the magnifying glass up to his eye; the eye looks HUGE through it */
 pose(o,arm,L,L2,shX,shY){if(o.mode!=='act')return;const r=env(o.mt,0,2.4,.35,.35);o.aR=arm(50+shX,shY,lerp(.18,3.2,r),lerp(.1,-2.0,r),L,L2);},
 /* through the glass his eye looks huge */
 fx(c,o,aL,aR){if(o.mode!=='act'||o.v!=='down')return;const r=env(o.mt,.3,2.2,.25,.3);if(r<.05)return;const x=aR.hx+Math.sin(.5)*6,y=aR.hy-Math.cos(.5)*6;
  c.save();c.globalAlpha=r;fs(c,ell(x,y,6.2,6.2),'#fff',0);fs(c,ell(x-.4,y+.4,4,4.8),INK,0);fs(c,ell(x+1,y-1.4,1.5,1.5),'#fff',0);c.strokeStyle='#868e96';c.lineWidth=1.6;c.beginPath();c.arc(x,y,7,0,7);c.stroke();c.restore();},
 say:['Fascinating!','Rocks rock!','Hmm… is that quartz?'],act:'Magnifying glass 🔍',actLen:2.6};

/* 3. Coach Flex: tan, short dark hair, yellow headband, red tank top with a whistle, big arms, blue shorts, red-white trainers */
const COACH={h:1.06,legs:{col:SKIN.tan,shoe:'#f1f3f5',shoe2:'#e03131',w:8.6,gap:6,hip:96,sock:'#ffffff'},arms:{col:SKIN.tan,w:9.4,skin:SKIN.tan,hand:5.2,l1:13,l2:13,x:17,y:63},
 torso(c,v,o){const top='#e03131';
  if(v==='left'||v==='right'){fs(c,P('M41 58 Q53 54 62 60 L60 92 Q50 95 42 92 Z'),top,2.3);fs(c,P('M42 90 L61 90 L62 102 Q51 105 41 102 Z'),'#2f6fed',2.2);
   fs(c,ell(43,70,2.4,3),'#ced4da',1.2);c.strokeStyle='#f1f3f5';c.lineWidth=1.2;c.beginPath();c.moveTo(45,60);c.lineTo(43,67);c.stroke();return;}
  fs(c,P('M34 59 Q50 53 66 59 Q65 75 63 92 Q50 95 37 92 Q35 75 34 59Z'),top,2.3);
  fs(c,P('M36 90 L64 90 L66 103 Q57 106 51 102 L49 102 Q43 106 34 103 Z'),'#2f6fed',2.2);
  if(v==='up'){return;}
  fs(c,P('M40 58 Q50 66 60 58'),'rgba(0,0,0,0)',0);c.strokeStyle='#f1f3f5';c.lineWidth=2.2;c.beginPath();c.moveTo(41,59);c.quadraticCurveTo(50,66,59,59);c.stroke();
  c.strokeStyle='#f1f3f5';c.lineWidth=1.2;c.beginPath();c.moveTo(44,60);c.lineTo(48,71);c.moveTo(56,60);c.lineTo(52,71);c.stroke();fs(c,ell(50,73,4.4,4),'#ced4da',1.4);fs(c,ell(50,73,1.6,1.4),'#868e96',0);
  c.strokeStyle='#fff';c.lineWidth=1.4;c.beginPath();c.moveTo(39,86);c.lineTo(61,86);c.stroke();},
 head(c,v,o){const sk=SKIN.tan,hair='#2b1d0e',band='#ffd43b';
  if(v==='left'||v==='right'){fs(c,ell(50,41,14,14.5),sk,2.3);fs(c,P('M37 35 Q40 25 52 26 Q63 27 64 38 Q62 33 52 33 Q42 32 37 35Z'),hair,1.5);fs(c,rr(36.5,32.5,27,5,2),band,1.4);fs(c,P('M62 33 L70 30 L68 37 Z'),band,1.2);
   fs(c,ell(56,43,3,3.6),sk,1.5);fs(c,P('M36.6 42 Q31.8 45.5 36.3 48.6'),sk,0);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(36.8,41.6);c.quadraticCurveTo(31.6,45.5,36.5,49);c.stroke();
   eyesAt(c,[[42,41.5]],o,2);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(39,37.6);c.lineTo(45,37);c.stroke();mouthAt(c,40,51.5,6,o);return;}
  if(v==='up'){fs(c,ell(50,41,14.5,14.5),sk,2.3);fs(c,P('M36 40 Q35 26 50 26 Q65 26 64 40 Q60 36 50 36 Q40 36 36 40Z'),hair,1.5);fs(c,rr(35.5,32.5,29,5,2),band,1.4);fs(c,P('M48 34 L44 44 L50 40 L55 45 L52 34Z'),band,1.2);return;}
  fs(c,ell(36,43,3,3.6),sk,1.5);fs(c,ell(64,43,3,3.6),sk,1.5);fs(c,ell(50,41,14.5,14.5),sk,2.3);
  fs(c,P('M36 38 Q35 26 50 26 Q65 26 64 38 Q60 33 50 33 Q40 33 36 38Z'),hair,1.5);fs(c,rr(35.5,32,29,5,2),band,1.4);fs(c,P('M63 33 L71 28 L70 36 Z'),band,1.2);
  eyesAt(c,[[44.5,42],[55.5,42]],o,2.1);c.strokeStyle=INK;c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(41,38.2);c.lineTo(47.5,37.6);c.moveTo(52.5,37.6);c.lineTo(59,38.2);c.stroke();
  if(o.mode==='act'&&!o.talk){c.lineWidth=1.8;c.beginPath();c.moveTo(45,50);c.quadraticCurveTo(50,54.5,55,50);c.stroke();fs(c,P('M46 50.4 Q50 53.6 54 50.4Z'),'#fff',0);}else mouthAt(c,50,51,7,o);},
 /* special: a double-biceps flex, with a little bounce */
 pose(o,arm,L,L2,shX,shY){if(o.mode!=='act')return;const r=env(o.mt,0,2.4,.25,.3),k=Math.sin(o.mt*10)*.08*r;
  o.aL=arm(50-shX,shY,lerp(-.18,-1.75,r),lerp(-.1,-3.0+k,r),L,L2);o.aR=arm(50+shX,shY,lerp(.18,1.75,r),lerp(.1,3.0-k,r),L,L2);},
 fx(c,o,aL,aR){if(o.mode!=='act'||o.v==='up')return;const r=env(o.mt,.2,2.3,.2,.3);if(r<.1)return;c.save();c.globalAlpha=r;
  [aL,aR].forEach((g,i)=>{if(o.side&&i===0)return;const bx=lerp(g.sx,g.ex,.6),by=lerp(g.sy,g.ey,.6)-2;fs(c,ell(bx,by,5.6+Math.sin(o.mt*10)*.6,4.6),SKIN.tan,1.6);});
  for(let i=0;i<3;i++){const a=o.mt*4+i*2.1;star(c,50+Math.cos(a)*30,52+Math.sin(a)*10,2.4,'#ffe066');}c.restore();},
 say:['Feel the burn!','One more rep!','Math muscles!'],act:'Flex! 💪',actLen:2.6};

/* 4. Gizmo: grey goblin, big pointy ears, backwards purple cap, black hoodie with a gold G, red and blue trainers */
const GIZMO={h:.92,legs:{col:'#3b3f4a',shoe:'#e03131',w:8,gap:5.6},arms:{col:'#2b2b35',w:8,skin:SKIN.grey},
 legsOdd:true,
 torso(c,v,o){const hd='#2b2b35';
  if(v==='left'||v==='right'){fs(c,P('M40 60 Q52 55 62 61 L62 97 Q51 100 40 97 Z'),hd,2.3);fs(c,P('M56 59 Q64 64 61 73 Q57 69 54 63 Z'),'#3a3a46',1.4);return;}
  fs(c,P('M33 60 Q50 54 67 60 L67 97 Q50 101 33 97 Z'),hd,2.3);
  if(v==='up'){fs(c,P('M38 58 Q50 70 62 58 Q60 66 50 70 Q40 66 38 58Z'),'#3a3a46',1.4);return;}
  fs(c,ell(50,76,7,7),'#f5c400',1.8);c.fillStyle=INK;c.font='800 10px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('G',50,76.6);
  fs(c,rr(41,88,18,6,2),'#3a3a46',1.2);c.strokeStyle='#ced4da';c.lineWidth=1.2;c.beginPath();c.moveTo(46,60);c.lineTo(45,68);c.moveTo(54,60);c.lineTo(55,68);c.stroke();},
 head(c,v,o){const sk=SKIN.grey,cap='#7048e8',ear=t=>Math.sin(o.t*2.2+t)*.06;
  const earL=(x,y,s)=>{c.save();c.translate(x,y);c.rotate(ear(0)*s);fs(c,P(`M0 0 L${-18*s} -9 L${-3*s} 7 Z`),sk,1.8);fs(c,P(`M${-3*s} 1 L${-13*s} -5 L${-4*s} 4 Z`),'#d6a5b5',0);c.restore();};
  if(v==='left'||v==='right'){c.save();c.translate(6,0);earL(55,40,-1);c.restore();fs(c,ell(50,41,14.5,14),sk,2.3);
   fs(c,P('M36 36 Q38 24 52 24 Q64 25 64 36 Z'),cap,1.8);fs(c,P('M62 33 Q73 33 75 38 Q68 39 62 37 Z'),'#5f3dc4',1.6);fs(c,ell(50,24.5,2.4,2.4),'#ffd43b',1.2);
   fs(c,P('M36.6 43 Q30.8 46 36.3 49.6'),sk,0);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(36.8,42.6);c.quadraticCurveTo(30.6,46.5,36.5,50);c.stroke();
   fs(c,ell(42,41.5,3.6,3.8),'#fff',1.3);eyesAt(c,[[41.4,42]],o,1.9);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(38,37.2);c.lineTo(46,38.6);c.stroke();
   mouthAt(c,40,51,6,o);fs(c,P('M38.6 51.2 L39.6 54 L40.6 51.2Z'),'#fff',1);return;}
  if(v==='up'){earL(36,40,1);earL(64,40,-1);fs(c,ell(50,41,15,14.5),sk,2.3);fs(c,P('M35 37 Q36 25 50 24 Q64 25 65 37 Z'),cap,1.8);fs(c,P('M43 36 Q50 48 57 36 Q57 41 50 43 Q43 41 43 36Z'),'#5f3dc4',1.6);fs(c,rr(46,30,8,4,1.5),'#5f3dc4',1);return;}
  earL(36,40,1);earL(64,40,-1);fs(c,ell(50,41,15,14.5),sk,2.3);
  fs(c,P('M35 37 Q36 25 50 24 Q64 25 65 37 Z'),cap,1.8);fs(c,P('M44 25 Q50 17 56 25 Q50 23 44 25Z'),'#5f3dc4',1.4);fs(c,ell(50,24,2.2,2.2),'#ffd43b',1.2);
  fs(c,ell(44.5,42,4.2,4.4),'#fff',1.3);fs(c,ell(55.5,42,4.2,4.4),'#fff',1.3);eyesAt(c,[[44.8,42.6],[55.2,42.6]],o,2.1);
  c.strokeStyle=INK;c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(40,37.6);c.lineTo(47.5,38.6);c.moveTo(52.5,38.6);c.lineTo(60,37.6);c.stroke();
  const grin=o.mode==='act';if(grin&&!o.talk){c.lineWidth=1.8;c.beginPath();c.moveTo(43,50);c.quadraticCurveTo(50,56,57,50);c.stroke();}else mouthAt(c,50,51,8,o);
  fs(c,P('M45.6 50.8 L46.6 54 L47.6 51.2Z'),'#fff',1);fs(c,P('M52.4 51.2 L53.4 54 L54.4 50.8Z'),'#fff',1);
  c.globalAlpha=.25;fs(c,ell(38,48,2.4,1.6),'#e64980',0);fs(c,ell(62,48,2.4,1.6),'#e64980',0);c.globalAlpha=1;},
 /* special: rubs his hands together and snickers, bouncing on his toes */
 pose(o,arm,L,L2,shX,shY){if(o.mode!=='act')return;const r=env(o.mt,0,2.4,.25,.3),rub=Math.sin(o.mt*18)*1.4*r;
  o.aL=arm(50-shX,shY,lerp(-.18,.25,r),lerp(-.1,1.35+rub*.06,r),L,L2);o.aR=arm(50+shX,shY,lerp(.18,-.25,r),lerp(.1,-1.35-rub*.06,r),L,L2);},
 fx(c,o){if(o.mode!=='act')return;const r=env(o.mt,.3,2.3,.2,.3);if(r<.1)return;c.save();c.globalAlpha=r;c.font='800 9px Fredoka, Trebuchet MS, sans-serif';c.textAlign='center';
  ['heh','heh'].forEach((w,i)=>{const k=((o.mt*.8+i*.5)%1);c.lineWidth=3;c.strokeStyle='#fff';c.strokeText(w,70+i*8,30-k*14);c.fillStyle='#7048e8';c.fillText(w,70+i*8,30-k*14);});c.restore();},
 say:['Heh heh heh…','Bet you can\'t beat me!','Uncle says hi.'],act:'Rubbing his hands 😈',actLen:2.6};

/* 5. Elder Wiz: a long starry purple robe, tall blue hat with a gold band and star, long white beard, blue-orb staff */
const ELDER={h:1.1,float:false,legs:{col:'#4b3a8c',shoe:'#5b3d2a',w:7,gap:5},arms:{col:'#6a4fd6',w:8.4,skin:SKIN.fair,hand:4.6},itemHand:'R',itemBehindArm:true,
 noLegs:true,
 cape(c,v,o){const sw=o.walk?Math.sin(o.t*7)*2.2:Math.sin(o.t*1.6)*.9,g=c.createLinearGradient(30,60,70,124);g.addColorStop(0,'#6a4fd6');g.addColorStop(1,'#4b33b8');
  if(v==='left'||v==='right'){fs(c,new Path2D(`M42 60 Q58 56 61 62 Q${66+sw} 92 ${68+sw} 121 Q52 125 38 121 Q40 92 42 60Z`),g,2.3);
   [[52,90],[58,108],[47,112]].forEach(([x,y])=>star(c,x,y,3,'#ffe066'));return;}
  fs(c,new Path2D(`M34 60 Q50 55 66 60 Q${70+sw} 92 ${72+sw} 121 Q50 126 ${28-sw} 121 Q30 92 34 60Z`),g,2.3);
  if(v!=='up')[[40,98],[60,110],[45,115],[62,88]].forEach(([x,y])=>star(c,x,y,3.2,'#ffe066'));else [[42,100],[58,112]].forEach(([x,y])=>star(c,x,y,3,'#ffe066'));},
 torso(c,v,o){if(v==='up'||v==='left'||v==='right'){fs(c,ell(51,121,7,3),'#5b3d2a',1.6);return;}const lift=o.walk?Math.max(0,o.s)*3:0;fs(c,ell(44,122-lift,6,3.2),'#5b3d2a',1.6);fs(c,ell(56,122-(o.walk?Math.max(0,-o.s)*3:0),6,3.2),'#5b3d2a',1.6);
  fs(c,new Path2D(`M34 60 Q50 55 66 60 Q70 92 72 121 Q50 126 28 121 Q30 92 34 60Z`),'rgba(0,0,0,0)',0);},
 head(c,v,o){const sk=SKIN.fair,bd='#f8f9fa',hat='#3b6fd6',band='#ffd43b',wig=Math.sin(o.t*2)*1+(o.mode==='act'?Math.sin(o.mt*10)*1.6:0);
  const hatF=(x0)=>{fs(c,P(`M${x0+33} 30 Q${x0+50} 34 ${x0+67} 30 L${x0+55} 4 Q${x0+50} -4 ${x0+46} 4 Z`),hat,2.3);fs(c,ell(x0+50,30.5,21,4.6),hat,2.3);fs(c,P(`M${x0+36} 27 Q${x0+50} 31 ${x0+64} 27 L${x0+63} 23 Q${x0+50} 27 ${x0+37} 23 Z`),band,1.4);};
  if(v==='left'||v==='right'){fs(c,ell(50,40,13.5,14.5),sk,2.3);fs(c,P('M52 36 Q63 36 63 48 Q60 54 55 50 Q54 42 52 36Z'),bd,1.6);
   fs(c,new Path2D(`M36 44 Q${33+wig} 62 ${40+wig} 76 Q46 70 47 60 Q49 50 47 44 Z`),bd,1.8);fs(c,P('M36.6 41 Q32 44.5 36.2 47.6'),sk,0);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(36.8,40.6);c.quadraticCurveTo(31.8,44.5,36.4,48);c.stroke();
   eyesAt(c,[[42,40]],o,1.9);fs(c,P('M37 36 Q42 33 47 36 Q42 35 37 36Z'),bd,1.4);
   c.save();c.translate(2,0);fs(c,P('M33 30 Q50 34 66 30 Q62 18 60 9 Q60 1 67 -2 Q56 -3 53 5 Q44 18 33 30Z'),hat,2.3);fs(c,ell(50,30.5,19,4),hat,2.3);fs(c,P('M35 27 Q50 31 64 27 L63 23 Q50 27 37 23 Z'),band,1.4);star(c,54,17,3.6,band);c.restore();return;}
  if(v==='up'){fs(c,ell(50,40,14.5,14.5),sk,2.3);fs(c,P('M36 40 Q36 54 50 58 Q64 54 64 40 Q60 48 50 48 Q40 48 36 40Z'),bd,1.6);fs(c,new Path2D(`M38 50 Q${40+wig} 66 50 72 Q${60+wig} 66 62 50 Z`),bd,1.4);hatF(0);return;}
  fs(c,ell(50,40,14.5,14.5),sk,2.3);fs(c,P('M35 38 Q33 50 38 56 Q37 46 38 40Z'),bd,1.4);fs(c,P('M65 38 Q67 50 62 56 Q63 46 62 40Z'),bd,1.4);
  fs(c,new Path2D(`M37 46 Q${35+wig} 64 ${46+wig*.5} 80 Q50 84 ${54+wig*.5} 80 Q${65+wig} 64 63 46 Q57 52 50 51 Q43 52 37 46Z`),bd,1.8);
  c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1.2;[[44,0],[50,0],[56,0]].forEach(([x])=>{c.beginPath();c.moveTo(x,54);c.quadraticCurveTo(x+wig*.3,66,x+(x-50)*.2+wig*.5,76);c.stroke();});
  fs(c,P('M40 47.6 Q45 44 50 47.4 Q55 44 60 47.6 Q55 50.4 50 49.2 Q45 50.4 40 47.6Z'),bd,1.4);
  eyesAt(c,[[44.5,40],[55.5,40]],o,2);fs(c,P('M39 35.6 Q44 32 48.6 35.4 Q44 34.6 39 35.6Z M61 35.6 Q56 32 51.4 35.4 Q56 34.6 61 35.6Z'),bd,1.3);
  if(o.talk&&Math.sin(o.t*15)>-.2)fs(c,ell(50,52,2.4,1.6+Math.abs(Math.sin(o.t*15))*1.3),'#8a2c3b',1.3);
  c.globalAlpha=.35;fs(c,ell(39.5,45,2.4,1.6),'#ff8fa3',0);fs(c,ell(60.5,45,2.4,1.6),'#ff8fa3',0);c.globalAlpha=1;
  hatF(0);star(c,51,17,4.2,band);},
 item(c,o,front){c.save();c.rotate(front?.04:-.04);limb(c,[[0,-34],[0,40]],3.6,'#a0673a');c.save();c.shadowColor='#74c0fc';c.shadowBlur=6+Math.sin(o.t*3)*3;fs(c,ell(0,-39,6.4,6.4),'#74c0fc',2);c.restore();
  c.globalAlpha=.85;fs(c,ell(-2,-41,1.9,1.9),'#fff',0);c.globalAlpha=1;c.restore();},
 /* special: strokes his long beard, thinking */
 pose(o,arm,L,L2,shX,shY){if(o.mode!=='act')return;const r=env(o.mt,0,2.4,.3,.35),k=Math.sin(o.mt*6)*.18*r;o.aL=arm(50-shX,shY,lerp(-.18,.35,r),lerp(-.1,-2.2+k,r),L,L2);o.ly=-1*r;o.lx=.8*r;},
 say:['Hmm, hmm, hmm…','Math-ra-cadabra!','In my day, numbers were bigger.'],act:'Stroking his beard 🧙',actLen:2.6};
ELDER.legs=null;

/* 6. the Kind Teacher: floats (no feet), a long glowing violet gown with sparkles, white hair in a bun with a little tiara, soft wings, a star wand */
const TEACHER={h:1.04,float:true,arms:{col:'#c7b8ff',w:6.4,skin:SKIN.fair,hand:4.2},itemHand:'R',
 wings(c,v,o){const f=Math.sin(o.t*(o.walk?9:4))*.18;c.save();c.globalAlpha=.55;
  const wing=(x,s)=>{c.save();c.translate(x,64);c.rotate(s*(.2+f));fs(c,P(`M0 0 Q${s*26} -22 ${s*30} -4 Q${s*24} 12 0 6Z`),'#e7f5ff',1.4);fs(c,P(`M0 8 Q${s*20} 10 ${s*22} 24 Q${s*10} 26 0 12Z`),'#f3e8ff',1.4);c.restore();};
  if(v==='left'||v==='right'){wing(58,1);}else{wing(42,-1);wing(58,1);}c.restore();},
 cape(c,v,o){const sw=o.walk?Math.sin(o.t*5)*3:Math.sin(o.t*1.6)*1.5,g=c.createLinearGradient(50,58,50,124);g.addColorStop(0,'#b197fc');g.addColorStop(1,'#7048e8');
  c.save();c.shadowColor='rgba(255,236,153,.9)';c.shadowBlur=14;
  if(v==='left'||v==='right')fs(c,new Path2D(`M42 60 Q56 56 60 62 Q${66+sw} 94 ${70+sw} 118 Q54 124 ${38} 118 Q38 92 42 60Z`),g,2.2);
  else fs(c,new Path2D(`M36 60 Q50 55 64 60 Q${70+sw} 94 ${74+sw} 118 Q50 124 ${26-sw} 118 Q30 94 36 60Z`),g,2.2);c.restore();
  for(let i=0;i<6;i++){const a=i*1.7+o.t*.6,x=50+Math.cos(a)*(10+i*2),y=80+((i*13+o.t*8)%36);c.globalAlpha=.5+.5*Math.sin(o.t*3+i);star(c,x,y,1.8,'#fff');c.globalAlpha=1;}},
 torso(c,v,o){if(v==='left'||v==='right'){fs(c,P('M42 59 Q52 55 59 61 L57 80 Q50 82 43 80 Z'),'#c7b8ff',2.2);return;}fs(c,P('M37 60 Q50 55 63 60 L61 80 Q50 83 39 80 Z'),'#c7b8ff',2.2);
  if(v!=='up'){c.strokeStyle='#fff3bf';c.lineWidth=1.4;c.beginPath();c.moveTo(42,60);c.quadraticCurveTo(50,67,58,60);c.stroke();fs(c,ell(50,79,9,2.6),'#ffe066',1.2);}},
 head(c,v,o){const sk=SKIN.fair,hr='#f8f9fa';
  if(v==='left'||v==='right'){fs(c,ell(57,30,6.5,6.5),hr,1.6);fs(c,ell(50,41,13.5,14),sk,2.3);fs(c,P('M37 38 Q38 26 50 26 Q63 27 63 40 Q63 50 58 54 Q56 44 52 38 Q44 34 37 38Z'),hr,1.6);
   fs(c,P('M45 25 L47 20 L50 24 L53 19 L55 25Z'),'#ffd43b',1.2);fs(c,P('M36.6 42 Q32.2 45.5 36.3 48.6'),sk,0);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(36.8,41.6);c.quadraticCurveTo(32,45.5,36.5,49);c.stroke();
   eyesAt(c,[[42,41.5]],o,1.9);c.globalAlpha=.5;fs(c,ell(43,47.5,2.4,1.6),'#ff8fa3',0);c.globalAlpha=1;mouthAt(c,40,51,4.6,o);return;}
  if(v==='up'){fs(c,ell(50,41,14.5,14.5),sk,2.3);fs(c,P('M35.5 41 Q35 26 50 26 Q65 26 64.5 41 Q66 54 50 56 Q34 54 35.5 41Z'),hr,1.6);fs(c,ell(50,27,7,6.6),hr,1.6);fs(c,P('M43 24 L45 18 L48 22 L50 16 L52 22 L55 18 L57 24Z'),'#ffd43b',1.2);return;}
  fs(c,ell(50,27,7,6.6),hr,1.6);fs(c,P('M43 24 L45 18 L48 22 L50 16 L52 22 L55 18 L57 24Z'),'#ffd43b',1.2);fs(c,ell(50,22.5,1.4,1.4),'#f06595',0);
  fs(c,ell(50,41,14.5,14.5),sk,2.3);fs(c,P('M35.5 41 Q35 28 50 28 Q65 28 64.5 41 Q60 33 50 34 Q40 33 35.5 41Z'),hr,1.6);fs(c,P('M35.5 40 Q33 48 36 53 Q38 47 37.5 42Z M64.5 40 Q67 48 64 53 Q62 47 62.5 42Z'),hr,1.4);
  eyesAt(c,[[44.5,42],[55.5,42]],o,2);c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.moveTo(41.6,38.6);c.lineTo(43.4,39.6);c.moveTo(58.4,38.6);c.lineTo(56.6,39.6);c.stroke();
  c.globalAlpha=.5;fs(c,ell(39.5,48,2.6,1.7),'#ff8fa3',0);fs(c,ell(60.5,48,2.6,1.7),'#ff8fa3',0);c.globalAlpha=1;mouthAt(c,50,51,6,o);},
 item(c,o,front){c.save();c.rotate(front?.35:.2);limb(c,[[0,4],[0,-18]],2.4,'#fff3bf');c.save();c.shadowColor='#ffe066';c.shadowBlur=8;star(c,0,-22,5.6,'#ffe066');c.restore();c.restore();},
 /* special: waves her wand and sparkles burst out */
 pose(o,arm,L,L2,shX,shY){if(o.mode!=='act')return;const r=env(o.mt,0,2.2,.25,.35),w=Math.sin(o.mt*9)*.5*r;o.aR=arm(50+shX,shY,lerp(.18,2.3,r),lerp(.1,2.9+w,r),L,L2);},
 fx(c,o,aL,aR){if(o.mode!=='act')return;const k=o.mt;if(k<.3||k>2.4)return;for(let i=0;i<10;i++){const a=i*.63+k*2,d=8+((k*30+i*7)%26);c.globalAlpha=Math.max(0,1-d/34);star(c,aR.hx+Math.cos(a)*d,aR.hy-14+Math.sin(a)*d,2.4,i%2?'#ffe066':'#fff');}c.globalAlpha=1;},
 say:['Welcome, little wizard!','You can do it!','Every mistake helps you learn.'],act:'Wand sparkles ✨',actLen:2.4};

/* the Elder Wiz has no legs showing: his robe reaches the ground and his boots peek out (drawn in torso) */
ELDER.legs=null;
const CAST={elder:{name:'Elder Wiz',S:ELDER},principal:{name:'Principal Wise',S:PRINCIPAL},quartz:{name:'Dr. Quartz',S:QUARTZ},coach:{name:'Coach Flex',S:COACH},gizmo:{name:'Gizmo',S:GIZMO},teacher:{name:'Kind Teacher',S:TEACHER}};
/* the Elder's boots: drawn by his "torso" (after the robe) in front view; side and back by a small helper */
const _drawPerson=drawPerson;
function draw(c,id,st){const C=CAST[id];if(!C)return;const S=C.S;
 if(id==='elder'){const S2=Object.assign({},S,{float:false});S2.legs=null;return drawRobed(c,S2,st);}return _drawPerson(c,S,st);}
/* robed (the Elder): like a person, but the robe hides the legs; boots peek out and shuffle when he walks */
function drawRobed(c,S,st){const S2=Object.assign({},S,{float:true,cape:(c,v,o)=>{const lift=o.walk?5:0;const bx=v==='left'||v==='right';
  if(bx){const st2=o.walk?o.s*7:0;fs(c,ell(48-st2-2,122-(o.walk?Math.max(0,o.s)*3:0)+6,7,3.2),'#3f2a1c',1.6);fs(c,ell(48+st2-2,122-(o.walk?Math.max(0,-o.s)*3:0)+6,7,3.2),'#5b3d2a',1.6);}
  else{fs(c,ell(44,122-Math.max(0,o.s)*lift*.6+6,6,3.2),'#5b3d2a',1.6);fs(c,ell(56,122-Math.max(0,-o.s)*lift*.6+6,6,3.2),'#5b3d2a',1.6);}
  S.cape(c,v,o);},torso:(c,v,o)=>{},wings:null});
 /* float:true removes the legs; undo the floating bob so he walks on the ground */
 const st2=Object.assign({},st);return drawPersonGrounded(c,S2,st2);}
function drawPersonGrounded(c,S,st){const t=st.t||0;const fake=Object.assign({},S,{float:true});
 c.save();c.translate(0,6-Math.sin(t*2)*3+(st.walk?-Math.abs(Math.sin(st.phase||0))*2.2:Math.sin(t*2.2)*.6));const o=_drawPerson(c,Object.assign(fake,{h:S.h}),Object.assign({},st,{noShadow:true}));c.restore();
 if(!st.noShadow){c.save();c.globalAlpha=.2;c.fillStyle='#000';c.beginPath();c.ellipse(50,125,24,3.6,0,0,7);c.fill();c.restore();}return o;}
window.CharPuppet={draw,CAST,ids:Object.keys(CAST)};
})();

/* ---------- on the map: People.put draws a character from where it is, working out the rest ----------
   Each character file keeps moving its character as before and calls People.put(ctx, id, key, footX, footY, ts, now, opts) where
   (footX, footY) is the middle of its feet on screen and opts.x/opts.y its position in squares (for walking and facing).
   opts: talk (mouth moves), wave (waves now), face ('left'|'right'|'down'|'up' to turn that way), still (no idle moves), h (height in squares). */
(function(){
const ST={},STEP=.16;
function put(ctx,id,key,fx,fy,ts,now,o){o=o||{};const C=CharPuppet.CAST[id];if(!C)throw new Error('no puppet '+id);
 let s=ST[key];if(!s||now-s.last>1500){s=ST[key]={x:o.x,y:o.y,last:now,t:Math.random()*5,phase:0,walkT:0,view:'down',idle:0,mode:'idle',mt:0,blink:0,blinkAt:1+Math.random()*3,next:10+Math.random()*12};}
 const dt=Math.min(.1,(now-s.last)/1000);s.last=now;s.t+=dt;s.mt+=dt;s.blink-=dt;if(s.blink<=0&&s.t>s.blinkAt){s.blink=.13;s.blinkAt=s.t+2.2+Math.random()*2.6;}
 const dx=(o.x??s.x)-s.x,dy=(o.y??s.y)-s.y;s.x=o.x??s.x;s.y=o.y??s.y;
 if(Math.abs(dx)+Math.abs(dy)>.0005){s.walkT=STEP;s.view=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}else s.walkT-=dt;
 const walking=s.walkT>0;if(walking){s.phase+=dt*9.5;s.idle=0;if(s.mode!=='idle'){s.mode='idle';s.mt=0;}}
 if(o.wave&&s.mode!=='wave'){s.mode='wave';s.mt=0;}
 if(s.mode!=='idle'){const len=s.mode==='wave'?(o.wave?99:2.2):(C.S.actLen||2.6);if(s.mt>len&&!(s.mode==='wave'&&o.wave)){s.mode='idle';s.mt=0;}}
 if(!walking){s.idle+=dt;if(o.face)s.view=o.face;else if(s.idle>2.5)s.view='down';
  /* now and then, standing about, a wave or their own move (facing you) */
  if(!o.still&&!o.talk&&s.mode==='idle'&&s.idle>s.next){s.next=s.idle+14+Math.random()*16;s.mode=Math.random()<.65?'act':'wave';s.mt=0;if(!o.face)s.view='down';}}
 const h=(o.h||1.45),k=ts*h/130;ctx.save();ctx.translate(fx-50*k,fy-124*k);ctx.scale(k,k);
 CharPuppet.draw(ctx,id,{view:s.mode!=='idle'&&!o.face?'down':s.view,walk:walking,phase:s.phase,t:s.t,mode:s.mode,mt:s.mt,blink:s.blink>0,talk:!!o.talk,noShadow:o.noShadow});
 ctx.restore();return s;}
window.People={ok:true,put,has:id=>!!CharPuppet.CAST[id],state:k=>ST[k],draw:(c,id,st)=>CharPuppet.draw(c,id,st||{view:'down',t:1})};
})();
