/* ================= Battle Pets scenery (Oct 2026) =================
   The battlefield's backdrop, drawn in code (no image files), in layers that slide at different speeds as the lane scrolls (parallax):
   sky (fixed) · far (25%) · mid (55%) · ground (moves with the fight) · foreground (130%, in front of the fighters).
   One world per stage: 🌳 forest (addition), 💎 crystal caves (subtraction), 🌋 volcano (multiplication), 🏰 castle (division),
   🦴 desert dig site (the Fossil Stage).
   - The crown sets the time: 👑 day, 👑👑 sunset, 👑👑👑 a stormy night with rain and lightning (in the caves: darker, with tremors).
   - When the Grey Goblin bursts out, the colour drains from the world (his Great Fade); when he is beaten it comes back in a rainbow wave.
   - Drawn bases: the Pet House (flag, chimney, glowing windows) and a critter den that matches the world; both crack as they are hurt.
   - The lane gets scuffed and trampled as the battle goes on.
   battlepets.js calls window.BPScene: build(field, scroller, stage, crown), parallax(scroller), base(kind, stage), baseState(el, hp),
   grey(on), rainbow(), scuff(x), stop(). Everything here is decoration: it never changes the battle. */
(function(){
'use strict';
const THEME={add:'forest',sub:'caves',mul:'volcano',div:'castle'};
const themeOf=st=>st&&st.id==='fossil'?'fossil':THEME[st&&st.op]||'forest';
const rngOf=seed=>{let x=0;for(const c of String(seed))x=(x*31+c.charCodeAt(0))>>>0;x=x||7;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return (x%1e6)/1e6;};};
const f1=n=>Math.round(n*10)/10;
/* a wavy hill line from x=0 to w, filled down to the bottom */
function hill(w,h,y0,amp,step,r,fill,extra){let d=`M0 ${h} L0 ${f1(y0)}`;let x=0,y=y0;while(x<w){const nx=Math.min(w,x+step*(.7+r()*.6)),ny=y0+(r()*2-1)*amp;d+=` Q${f1((x+nx)/2)} ${f1(Math.min(y,ny)-amp*.6*r())} ${f1(nx)} ${f1(ny)}`;x=nx;y=ny;}
 return `<path d="${d} L${w} ${h}Z" fill="${fill}" ${extra||''}/>`;}
/* jagged peaks */
function peaks(w,h,y0,amp,step,r,fill,extra){let d=`M0 ${h} L0 ${f1(y0)}`;let x=0;while(x<w){const nx=Math.min(w,x+step*(.6+r()*.8));d+=` L${f1((x+nx)/2)} ${f1(y0-amp*(.4+r()*.6))} L${f1(nx)} ${f1(y0+(r()*.3)*amp)}`;x=nx;}return `<path d="${d} L${w} ${h}Z" fill="${fill}" ${extra||''}/>`;}

/* ---------- palettes: sky by crown, plus the colours of each world ---------- */
const SKY={
 forest:[['#5fb8f5','#bfe9ff','#e6f8ff'],['#4b3f8f','#ff8a5c','#ffd38a'],['#060a1c','#16213f','#26365c']],
 volcano:[['#ff8a4c','#ffc27a','#ffe2b0'],['#6e1f2e','#d9483b','#ff9a4c'],['#12070a','#3a1210','#5a1f14']],
 castle:[['#6aa7ff','#bcd6ff','#e8f0ff'],['#3d3a8f','#e8728a','#ffc78a'],['#05081a','#141c3a','#232f55']],
 fossil:[['#7cc6ff','#cfeaff','#fff1c9'],['#5a3f8f','#ff8f5a','#ffd890'],['#0a0c1f','#1d2142','#33305a']],
 caves:[['#1d1236','#2e1f52','#46337a'],['#2a0f3a','#4a1f5a','#6a2f6e'],['#08040f','#140a22','#24133a']]};
const COL={
 forest:{far:'#9cc9bb',far2:'#b9dccf',mid:'#5ea852',mid2:'#4b9446',trunk:'#7a4f2a',leaf:['#3f9142','#4fa64f','#2f7d3a'],grass:'#74c94c',grass2:'#5fae3f',lane:'#c79c66',lane2:'#b1855a',fg:'#24572a'},
 caves:{far:'#3b2a5e',far2:'#2d2049',mid:'#4a3a6e',mid2:'#3a2c5a',grass:'#7a6f92',grass2:'#6a5f82',lane:'#5f5576',lane2:'#4f4566',fg:'#1c1430',crys:['#7af0ff','#c58cff','#ff8cf0']},
 volcano:{far:'#6a3a3a',far2:'#7d4a44',mid:'#3e2626',mid2:'#2e1c1c',grass:'#5a3d32',grass2:'#4a3028',lane:'#45352f',lane2:'#382a25',fg:'#1a0e0c',lava:'#ff6a00'},
 castle:{far:'#7d8aa8',far2:'#95a1bc',mid:'#8c90a3',mid2:'#767a8e',grass:'#6fb04c',grass2:'#5b973e',lane:'#a39c8e',lane2:'#8b8477',fg:'#2c3326'},
 fossil:{far:'#d99a5c',far2:'#e8b57a',mid:'#e9c37c',mid2:'#dcb06a',grass:'#e7c483',grass2:'#d8b06c',lane:'#e1bd7c',lane2:'#cfa765',fg:'#9a6a3a'}};

/* ---------- the layers of each world ---------- */
function far(t,w,h,r,c){const C=COL[t];let s='';
 if(t==='forest'){s+=peaks(w,h,h*.42,h*.2,170,r,C.far2,'opacity=".8"')+peaks(w,h,h*.5,h*.16,140,r,C.far);}
 else if(t==='caves'){s+=peaks(w,h,h*.45,h*.22,120,r,C.far2)+peaks(w,h,h*.55,h*.14,90,r,C.far);
  for(let i=0;i<9;i++){const x=r()*w,y=h*(.42+r()*.2),k=C.crys[i%3];s+=`<g class="bps-glow" style="animation-delay:${f1(-r()*3)}s"><path d="M${f1(x)} ${f1(y)} l6 -22 l6 22z M${f1(x+8)} ${f1(y)} l4 -14 l4 14z M${f1(x-7)} ${f1(y)} l3 -11 l3 11z" fill="${k}" opacity=".85"/><ellipse cx="${f1(x+5)}" cy="${f1(y-6)}" rx="18" ry="12" fill="${k}" opacity=".18"/></g>`;}}
 else if(t==='volcano'){s+=peaks(w,h,h*.55,h*.12,150,r,C.far2,'opacity=".8"');
  [[.3,1],[.75,.7]].forEach(([p,k])=>{const x=w*p,top=h*(.2+(1-k)*.12),bw=w*.16*k;s+=`<path d="M${f1(x-bw)} ${h} L${f1(x-bw*.18)} ${f1(top)} Q${f1(x)} ${f1(top-6)} ${f1(x+bw*.18)} ${f1(top)} L${f1(x+bw)} ${h}Z" fill="${C.far}"/>
   <ellipse class="bps-pulse" cx="${f1(x)}" cy="${f1(top+2)}" rx="${f1(bw*.2)}" ry="6" fill="#ffb347"/><path d="M${f1(x-bw*.12)} ${f1(top+4)} q${f1(bw*.05)} ${f1(h*.12)} ${f1(-bw*.03)} ${f1(h*.3)}" stroke="#ff6a00" stroke-width="5" fill="none" opacity=".8"/>`;});}
 else if(t==='castle'){s+=hill(w,h,h*.62,h*.05,200,r,C.far2,'opacity=".7"');
  const cx=w*.45,base=h*.62;let g='';[[-150,90,24],[-90,130,30],[-30,170,36],[30,150,30],[90,120,28],[150,95,24]].forEach(([dx,th,tw])=>{const x=cx+dx;g+=`<rect x="${f1(x-tw/2)}" y="${f1(base-th)}" width="${tw}" height="${th}" fill="${C.far}"/><path d="M${f1(x-tw/2-4)} ${f1(base-th)} L${f1(x)} ${f1(base-th-tw*1.1)} L${f1(x+tw/2+4)} ${f1(base-th)}Z" fill="#5d6a8a"/>`;
   for(let k=0;k<2;k++)g+=`<rect class="bps-win" style="animation-delay:${f1(-r()*4)}s" x="${f1(x-3)}" y="${f1(base-th+18+k*26)}" width="6" height="10" rx="3" fill="#ffd66b"/>`;});
  s+=`<rect x="${f1(cx-170)}" y="${f1(base-60)}" width="340" height="60" fill="${C.far}"/>`+g;}
 else{s+=`<path d="M${f1(w*.05)} ${h} L${f1(w*.08)} ${f1(h*.42)} L${f1(w*.24)} ${f1(h*.4)} L${f1(w*.27)} ${h}Z" fill="${C.far2}"/><path d="M${f1(w*.55)} ${h} L${f1(w*.6)} ${f1(h*.36)} L${f1(w*.82)} ${f1(h*.34)} L${f1(w*.86)} ${h}Z" fill="${C.far2}"/>`+hill(w,h,h*.6,h*.04,220,r,C.far);}
 return s;}
function mid(t,w,h,r){const C=COL[t];let s='';
 if(t==='forest'){s+=hill(w,h,h*.64,h*.05,240,r,C.mid2)+hill(w,h,h*.7,h*.04,200,r,C.mid);
  for(let x=60+r()*80;x<w-40;x+=150+r()*160){const sz=55+r()*55,y=h*.7+(r()*8);const lf=C.leaf;s+=`<rect x="${f1(x-5)}" y="${f1(y-sz*.9)}" width="10" height="${f1(sz*.9)}" rx="4" fill="${C.trunk}"/>
   <g class="bps-sway" style="transform-origin:${f1(x)}px ${f1(y-sz*.6)}px;animation-delay:${f1(-r()*4)}s"><circle cx="${f1(x)}" cy="${f1(y-sz)}" r="${f1(sz*.42)}" fill="${lf[0]}"/><circle cx="${f1(x-sz*.3)}" cy="${f1(y-sz*.8)}" r="${f1(sz*.32)}" fill="${lf[1]}"/><circle cx="${f1(x+sz*.32)}" cy="${f1(y-sz*.82)}" r="${f1(sz*.3)}" fill="${lf[2]}"/></g>`;}}
 else if(t==='caves'){s+=hill(w,h,h*.7,h*.04,160,r,C.mid);
  for(let x=r()*60;x<w;x+=40+r()*90){const len=20+r()*h*.22,bw=10+r()*18;s+=`<path d="M${f1(x-bw/2)} 0 L${f1(x)} ${f1(len)} L${f1(x+bw/2)} 0Z" fill="${C.mid2}"/>`;if(r()<.25)s+=`<circle class="bps-drip" style="animation-delay:${f1(-r()*3)}s;animation-duration:${f1(2+r()*2)}s" cx="${f1(x)}" cy="${f1(len)}" r="2.5" fill="#9fe8ff"/>`;}
  for(let x=r()*100;x<w;x+=120+r()*160){const hh=16+r()*36;s+=`<path d="M${f1(x-10)} ${f1(h*.72)} L${f1(x)} ${f1(h*.72-hh)} L${f1(x+10)} ${f1(h*.72)}Z" fill="${C.mid2}"/>`;}}
 else if(t==='volcano'){s+=peaks(w,h,h*.68,h*.08,110,r,C.mid2)+hill(w,h,h*.74,h*.03,180,r,C.mid);
  let d=`M0 ${f1(h*.77)}`;for(let x=0;x<=w;x+=120)d+=` Q${x+60} ${f1(h*.77+(r()*2-1)*6)} ${x+120} ${f1(h*.77)}`;s+=`<path class="bps-lava" d="${d}" stroke="${C.lava}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#ffd34a" stroke-width="2" fill="none" opacity=".8"/>`;}
 else if(t==='castle'){const top=h*.6;s+=`<rect x="0" y="${f1(top)}" width="${w}" height="${f1(h-top)}" fill="${C.mid}"/>`;
  for(let x=0;x<w;x+=36)s+=`<rect x="${x}" y="${f1(top-14)}" width="20" height="16" fill="${C.mid}"/>`;
  for(let y=top+10;y<h*.78;y+=18)for(let x=(y/18%2)*20;x<w;x+=40)s+=`<rect x="${x}" y="${f1(y)}" width="38" height="16" fill="none" stroke="${C.mid2}" stroke-width="1.5"/>`;
  for(let x=120+r()*80;x<w-60;x+=260+r()*120){const col=r()<.5?'#c92a2a':'#3b5bdb';s+=`<g class="bps-banner" style="transform-origin:${f1(x)}px ${f1(top+6)}px;animation-delay:${f1(-r()*3)}s"><path d="M${f1(x-14)} ${f1(top+6)} h28 v52 l-14 -10 l-14 10z" fill="${col}"/><circle cx="${f1(x)}" cy="${f1(top+26)}" r="6" fill="#ffd43b"/></g>`;
   const tx=x+130;s+=`<rect x="${f1(tx-3)}" y="${f1(top+18)}" width="6" height="22" fill="#5c4033"/><ellipse class="bps-flame" style="animation-delay:${f1(-r())}s" cx="${f1(tx)}" cy="${f1(top+12)}" rx="7" ry="11" fill="#ffa94d"/><ellipse cx="${f1(tx)}" cy="${f1(top+15)}" rx="3.5" ry="6" fill="#fff3bf"/>`;}}
 else{s+=hill(w,h,h*.7,h*.035,260,r,C.mid2)+hill(w,h,h*.75,h*.03,200,r,C.mid);
  const sk=(x,y,k)=>{let g=`<g opacity=".95" transform="translate(${f1(x)} ${f1(y)}) scale(${k})" fill="none" stroke="#f3ead2" stroke-width="7" stroke-linecap="round">`;g+=`<path d="M-120 -10 Q-40 -60 60 -40 Q110 -30 140 -6"/>`;
   for(let i=0;i<7;i++){const rx=-90+i*26;g+=`<path d="M${rx} ${f1(-40+Math.abs(i-3)*3)} q8 ${f1(26+i)} 0 ${f1(40-Math.abs(i-3)*4)}"/>`;}
   g+=`<path d="M140 -6 q30 -14 46 4 q-6 18 -40 12z" fill="#f3ead2" stroke-width="4"/><circle cx="168" cy="-4" r="4" fill="#6b4a2b" stroke="none"/></g>`;return g;};
  s+=sk(w*.3,h*.75,.9)+sk(w*.7,h*.76,.7);
  for(let x=200+r()*200;x<w;x+=420+r()*200)s+=`<line x1="${f1(x)}" y1="${f1(h*.75)}" x2="${f1(x)}" y2="${f1(h*.75-40)}" stroke="#6b4a2b" stroke-width="3"/><path class="bps-flag" style="transform-origin:${f1(x)}px ${f1(h*.75-40)}px" d="M${f1(x)} ${f1(h*.75-40)} l20 6 l-20 6z" fill="#e03131"/>`;
  s+=`<path d="M${f1(w*.52)} ${f1(h*.76)} l30 -38 l30 38z" fill="#f08c00"/><path d="M${f1(w*.52+30)} ${f1(h*.76)} l-9 0 l9 -20 l9 20z" fill="#7a4a10"/>`;}
 return s;}
function ground(t,w,h,r){const C=COL[t];const g0=h-60,l0=h-46;let s=hill(w,h,g0,4,90,r,C.grass2)+hill(w,h,g0+6,3,70,r,C.grass)+`<rect x="0" y="${l0}" width="${w}" height="${h-l0}" fill="${C.lane}"/><rect x="0" y="${l0}" width="${w}" height="4" fill="${C.lane2}"/>`;
 for(let i=0;i<w/40;i++){const x=r()*w,y=l0+8+r()*(h-l0-12);s+=`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(2+r()*4)}" ry="${f1(1.5+r()*2)}" fill="${C.lane2}" opacity=".7"/>`;}
 if(t==='forest'||t==='castle')for(let i=0;i<w/28;i++){const x=r()*w,y=g0+4+r()*10;s+=`<path d="M${f1(x)} ${f1(y)} l-3 -8 M${f1(x)} ${f1(y)} l0 -10 M${f1(x)} ${f1(y)} l3 -8" stroke="${C.grass2}" stroke-width="2" stroke-linecap="round"/>`;}
 if(t==='castle')for(let y=l0+6;y<h;y+=12)for(let x=((y-l0)/12%2)*14;x<w;x+=28)s+=`<rect x="${x}" y="${f1(y)}" width="26" height="10" rx="4" fill="none" stroke="${C.lane2}" stroke-width="1.5" opacity=".7"/>`;
 if(t==='volcano')for(let x=r()*120;x<w;x+=140+r()*200){let d=`M${f1(x)} ${f1(l0+6+r()*20)}`;for(let k=0;k<4;k++)d+=` l${f1(10+r()*16)} ${f1((r()*2-1)*8)}`;s+=`<path class="bps-lava" style="animation-delay:${f1(-r()*2)}s" d="${d}" stroke="#ff7b00" stroke-width="3" fill="none"/>`;}
 if(t==='caves')for(let x=r()*150;x<w;x+=180+r()*220)s+=`<path d="M${f1(x)} ${f1(g0+8)} l5 -16 l5 16z" fill="${COL.caves.crys[Math.floor(r()*3)]}" opacity=".8"/>`;
 if(t==='fossil')for(let x=r()*150;x<w;x+=200+r()*260)s+=`<path d="M${f1(x)} ${f1(l0+14)} h18" stroke="#f3ead2" stroke-width="4" stroke-linecap="round"/><circle cx="${f1(x)}" cy="${f1(l0+14)}" r="3.5" fill="#f3ead2"/><circle cx="${f1(x+18)}" cy="${f1(l0+14)}" r="3.5" fill="#f3ead2"/>`;
 return s;}
function fore(t,w,h,r){const C=COL[t];let s='';for(let x=r()*200;x<w;x+=260+r()*380){const k=.7+r()*.6;
 if(t==='forest'||t==='castle')s+=`<g fill="${C.fg}"><ellipse cx="${f1(x)}" cy="${h}" rx="${f1(34*k)}" ry="${f1(24*k)}"/><ellipse cx="${f1(x+26*k)}" cy="${h+2}" rx="${f1(26*k)}" ry="${f1(18*k)}"/><ellipse cx="${f1(x-24*k)}" cy="${h+3}" rx="${f1(22*k)}" ry="${f1(15*k)}"/></g>`;
 else if(t==='caves')s+=`<path d="M${f1(x-20*k)} ${h} l${f1(8*k)} ${f1(-34*k)} l${f1(8*k)} ${f1(34*k)} l${f1(6*k)} ${f1(-22*k)} l${f1(6*k)} ${f1(22*k)}z" fill="${C.fg}"/>`;
 else s+=`<path d="M${f1(x-30*k)} ${h} q${f1(10*k)} ${f1(-30*k)} ${f1(30*k)} ${f1(-26*k)} q${f1(24*k)} ${f1(2*k)} ${f1(30*k)} ${f1(26*k)}z" fill="${C.fg}"/>`;}
 return s;}
/* the sky layer stays put: clouds, birds, bats, embers, a moon */
function skyBits(t,crown,cw,h,r){let s='';
 if(t==='caves'){for(let i=0;i<3;i++)s+=`<div class="bps-bat" style="top:${f1(10+r()*25)}%;animation-delay:${f1(-r()*18)}s;animation-duration:${f1(14+r()*8)}s">🦇</div>`;return s;}
 if(t==='volcano'){for(let i=0;i<14;i++)s+=`<i class="bps-ember" style="left:${f1(r()*100)}%;animation-delay:${f1(-r()*6)}s;animation-duration:${f1(4+r()*4)}s"></i>`;}
 if(crown===3){s+=`<div class="bps-moon"></div>`;}
 if(t!=='volcano'||crown===1)for(let i=0;i<4;i++)s+=`<div class="bps-cloud${crown===3?' dark':''}" style="top:${f1(4+r()*26)}%;animation-delay:${f1(-r()*90)}s;animation-duration:${f1(70+r()*60)}s;scale:${f1(.6+r()*.8)}"></div>`;
 if(crown<3&&t!=='volcano')for(let i=0;i<2;i++)s+=`<div class="bps-bird" style="top:${f1(12+r()*20)}%;animation-delay:${f1(-r()*30)}s;animation-duration:${f1(22+r()*14)}s">〰</div>`;
 if(crown>=2&&(t==='forest'||t==='castle'||t==='fossil'))for(let i=0;i<8;i++)s+=`<i class="bps-fly" style="left:${f1(r()*100)}%;top:${f1(45+r()*30)}%;animation-delay:${f1(-r()*5)}s"></i>`;
 return s;}

/* ---------- drawn bases ---------- */
const CRACKS=(a,b,c)=>`<g class="crk crk1" stroke="#3b2a1a" stroke-width="2.5" fill="none" stroke-linecap="round">${a}</g><g class="crk crk2" stroke="#3b2a1a" stroke-width="2.5" fill="none" stroke-linecap="round">${b}</g><g class="crk crk3" stroke="#2b1d12" stroke-width="3" fill="none" stroke-linecap="round">${c}</g>`;
function house(){return `<svg class="bps-base" viewBox="0 -18 120 128" width="120" height="128" aria-hidden="true"><ellipse cx="60" cy="106" rx="54" ry="5" fill="rgba(0,0,0,.25)"/>
 <rect x="80" y="10" width="13" height="28" fill="#a0522d" stroke="#5c2e14" stroke-width="3"/><rect x="77" y="6" width="19" height="7" rx="2" fill="#7a3d1e" stroke="#5c2e14" stroke-width="2"/>
 <rect x="18" y="48" width="84" height="57" rx="3" fill="#f6d7a7" stroke="#8a5a2b" stroke-width="3"/>
 <path d="M6 54 L60 12 L114 54Z" fill="#e8590c" stroke="#7a2a08" stroke-width="3" stroke-linejoin="round"/><path d="M22 44 L98 44 M36 33 L84 33" stroke="#c2410c" stroke-width="2"/>
 <line x1="60" y1="12" x2="60" y2="-14" stroke="#5c2e14" stroke-width="3"/><path class="bps-wave" d="M60 -14 L84 -8 L60 -1Z" fill="#7048e8"/>
 <g fill="#fff"><circle cx="60" cy="38" r="5"/><circle cx="53" cy="31" r="2.4"/><circle cx="58" cy="28.5" r="2.4"/><circle cx="64" cy="29" r="2.4"/><circle cx="68" cy="32.5" r="2.4"/></g>
 <rect x="50" y="72" width="20" height="33" rx="9" fill="#8a5a2b" stroke="#5c2e14" stroke-width="2.5"/><circle cx="65" cy="90" r="2" fill="#ffd43b"/>
 <rect class="bps-win" x="25" y="60" width="17" height="15" rx="2" fill="#ffe08a" stroke="#8a5a2b" stroke-width="2.5"/><rect class="bps-win" x="78" y="60" width="17" height="15" rx="2" fill="#ffe08a" stroke="#8a5a2b" stroke-width="2.5"/>
 <path d="M33.5 60v15M25 67.5h17M86.5 60v15M78 67.5h17" stroke="#8a5a2b" stroke-width="2"/>
 ${CRACKS('<path d="M24 52 l8 10 l-4 8 l6 8"/>','<path d="M98 80 l-8 6 l4 8 l-6 10"/><path d="M40 22 l6 8 l-3 6"/>','<path d="M70 50 l-6 12 l8 6 l-4 12"/><path d="M90 30 l-10 10"/><path d="M20 90 l10 -4 l4 8"/>')}</svg>`;}
function den(t){let body='';
 if(t==='forest')body=`<path d="M10 106 Q8 50 30 26 Q65 4 100 26 Q122 50 120 106Z" fill="#7a4f2a" stroke="#4a2f17" stroke-width="3"/><path d="M30 26 Q65 14 100 26 Q65 36 30 26Z" fill="#c49a64" stroke="#4a2f17" stroke-width="2"/><path d="M45 23 q20 -6 40 0 M55 25 q10 -3 20 0" stroke="#8a6238" stroke-width="2" fill="none"/>
  <path d="M36 106 Q38 62 65 58 Q92 62 94 106Z" fill="#1a120a"/><path d="M14 80 q-10 6 -12 26 M116 78 q10 8 12 28" stroke="#4a2f17" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M22 40 q8 -6 14 2 q-6 2 -14 -2z M96 44 q8 -4 12 4 q-8 0 -12 -4z" fill="#3f9142"/>
  <g><circle cx="102" cy="60" r="6" fill="#e03131"/><circle cx="100" cy="58" r="1.5" fill="#fff"/><rect x="100" y="64" width="4" height="8" fill="#f1e3c8"/></g>`;
 else if(t==='caves')body=`<path d="M4 106 Q0 40 40 20 Q65 8 92 20 Q128 40 124 106Z" fill="#5c4f7a" stroke="#2d2049" stroke-width="3"/><path d="M30 40 l10 -6 l12 8 M84 30 l14 10" stroke="#2d2049" stroke-width="2.5" fill="none"/>
  <path d="M34 106 Q36 52 64 48 Q92 52 94 106Z" fill="#0d0818"/><g class="bps-glow"><path d="M50 22 l6 -20 l6 20z M62 20 l4 -14 l4 14z M76 24 l5 -18 l5 18z" fill="#7af0ff"/></g><path d="M100 50 l5 -14 l5 14z" fill="#c58cff"/>`;
 else if(t==='volcano')body=`<path d="M2 106 Q10 50 36 34 Q50 14 70 20 Q96 16 108 40 Q126 60 126 106Z" fill="#3a2a2a" stroke="#1a0e0c" stroke-width="3"/><path class="bps-lava" d="M20 70 l12 -8 l8 10 M96 50 l-10 14 l8 8 M60 30 l4 12" stroke="#ff7b00" stroke-width="3.5" fill="none"/>
  <path d="M38 106 Q40 60 64 56 Q88 60 90 106Z" fill="#120806"/><path d="M38 106 Q40 60 64 56 Q88 60 90 106" stroke="#ff6a00" stroke-width="2" fill="none" opacity=".7"/>`;
 else if(t==='castle')body=`<rect x="28" y="20" width="72" height="86" fill="#4d5266" stroke="#23263a" stroke-width="3"/><path d="M22 22 L64 -12 L106 22Z" fill="#2b2f45" stroke="#14172a" stroke-width="3"/><g fill="#4d5266" stroke="#23263a" stroke-width="2"><rect x="24" y="14" width="12" height="10"/><rect x="58" y="14" width="12" height="10"/><rect x="92" y="14" width="12" height="10"/></g>
  <path d="M44 106 V72 Q64 54 84 72 V106Z" fill="#0a0b14"/><path d="M48 106V74 M56 106V66 M64 106V63 M72 106V66 M80 106V74 M44 82h40 M44 94h40" stroke="#555a70" stroke-width="2.5"/><rect class="bps-win" x="58" y="32" width="12" height="16" rx="6" fill="#ff6b6b"/><path class="bps-banner" style="transform-origin:96px 40px" d="M90 40 h14 v30 l-7 -6 l-7 6z" fill="#5f3dc4"/>`;
 else body=`<path d="M6 104 Q2 60 26 40 Q50 18 84 26 Q118 34 124 64 Q126 90 110 104Z" fill="#f3ead2" stroke="#b8a77a" stroke-width="3"/><circle cx="84" cy="50" r="11" fill="#3a2c1a"/><path d="M22 70 Q60 58 112 80" stroke="#b8a77a" stroke-width="3" fill="none"/>
  <path d="M30 104 Q32 80 60 76 Q90 80 96 104Z" fill="#2a1e10"/><g fill="#fff8e6" stroke="#b8a77a" stroke-width="1.5"><path d="M36 82 l4 10 l4 -10z M48 79 l4 11 l4 -11z M62 78 l4 11 l4 -11z M76 80 l4 10 l4 -10z"/></g><path d="M20 40 q-6 -18 8 -26 M60 22 q2 -16 16 -18" stroke="#f3ead2" stroke-width="6" stroke-linecap="round" fill="none"/>`;
 return `<svg class="bps-base" viewBox="0 -18 130 128" width="130" height="128" aria-hidden="true"><ellipse cx="64" cy="106" rx="60" ry="5" fill="rgba(0,0,0,.3)"/>${body}
  <g class="bps-eyes"><circle cx="56" cy="88" r="3.2" fill="#ffe066"/><circle cx="72" cy="88" r="3.2" fill="#ffe066"/></g>
  ${CRACKS('<path d="M20 60 l10 8 l-4 8"/>','<path d="M104 70 l-8 8 l6 8"/><path d="M50 30 l6 10 l-4 6"/>','<path d="M84 34 l-6 14 l8 6 l-4 12"/><path d="M14 90 l12 -4 l4 10"/>')}</svg>`;}

/* ---------- CSS ---------- */
function css(){if(document.getElementById('bpsCSS'))return;const s=document.createElement('style');s.id='bpsCSS';s.textContent=`
.bps-scene{position:absolute;inset:0;z-index:0;overflow:hidden;transition:filter 3s ease}.bps-scene.drain{filter:grayscale(1) brightness(.92)}
.bps-l{position:absolute;left:0;top:0;height:100%;will-change:transform}.bps-l svg{display:block;width:100%;height:100%}
.bps-sky{z-index:0}.bps-far{z-index:1}.bps-mid{z-index:2}.bps-ground{z-index:3}.bps-tint{position:absolute;inset:0;z-index:2;pointer-events:none;mix-blend-mode:multiply}
.bps-fg{z-index:4;pointer-events:none}.bps-marks{position:absolute;inset:0;z-index:3;pointer-events:none}
.bps-mark{position:absolute;width:16px;height:6px;border-radius:50%;background:rgba(60,40,20,.22);transform:translateX(-50%)}
.bps-weather{position:absolute;inset:0;pointer-events:none;z-index:7;overflow:hidden}
.bps-rain{position:absolute;inset:-40px 0 0 0;background:repeating-linear-gradient(105deg,rgba(200,220,255,.0) 0 14px,rgba(200,220,255,.45) 14px 15px,rgba(200,220,255,0) 15px 32px);background-size:64px 64px;animation:bpsrain .35s linear infinite;opacity:.7}
@keyframes bpsrain{to{background-position:-18px 64px}}
.bps-bolt{position:absolute;inset:0;background:rgba(235,240,255,.85);opacity:0}.bps-bolt.on{animation:bpsbolt .55s ease-out}@keyframes bpsbolt{0%{opacity:0}8%{opacity:.85}18%{opacity:.1}30%{opacity:.7}100%{opacity:0}}
.bps-rainbow{position:absolute;top:0;bottom:0;width:60%;left:-60%;background:linear-gradient(90deg,transparent,rgba(255,0,0,.35),rgba(255,165,0,.35),rgba(255,255,0,.35),rgba(0,200,0,.35),rgba(0,120,255,.35),rgba(140,0,255,.35),transparent);animation:bpsrb 1.6s ease-in-out forwards;z-index:8;pointer-events:none}
@keyframes bpsrb{to{left:110%}}
.bps-cloud{position:absolute;left:-180px;width:150px;height:46px;background:#fff;border-radius:30px;opacity:.85;animation:bpscloud 90s linear infinite}
.bps-cloud::before,.bps-cloud::after{content:"";position:absolute;background:#fff;border-radius:50%}.bps-cloud::before{width:70px;height:60px;left:22px;top:-28px}.bps-cloud::after{width:56px;height:46px;left:72px;top:-18px}
.bps-cloud.dark,.bps-cloud.dark::before,.bps-cloud.dark::after{background:#3a4566}
@keyframes bpscloud{to{transform:translateX(calc(100vw + 400px))}}
.bps-bird{position:absolute;left:-40px;font-size:18px;color:#2b2340;animation:bpsfly 28s linear infinite}@keyframes bpsfly{0%{transform:translate(0,0)}50%{transform:translate(55vw,-14px)}100%{transform:translate(110vw,6px)}}
.bps-bat{position:absolute;left:-40px;font-size:20px;animation:bpsfly 18s linear infinite;filter:brightness(.6)}
.bps-moon{position:absolute;right:12%;top:8%;width:46px;height:46px;border-radius:50%;background:#f1f3f5;box-shadow:0 0 30px 8px rgba(241,243,245,.35)}
.bps-ember{position:absolute;bottom:0;width:4px;height:4px;border-radius:50%;background:#ffa94d;box-shadow:0 0 6px #ff6b00;animation:bpsember 6s linear infinite}
@keyframes bpsember{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(30px,-300px);opacity:0}}
.bps-fly{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff59d;box-shadow:0 0 8px 3px rgba(255,245,157,.7);animation:bpsfirefly 4s ease-in-out infinite alternate}
@keyframes bpsfirefly{0%{transform:translate(0,0);opacity:.2}50%{opacity:1}100%{transform:translate(24px,-18px);opacity:.3}}
.bps-sway{animation:bpssway 4s ease-in-out infinite alternate}@keyframes bpssway{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}
.bps-glow{animation:bpsglow 2.6s ease-in-out infinite alternate}@keyframes bpsglow{from{opacity:.55}to{opacity:1}}
.bps-pulse{animation:bpsglow 1.4s ease-in-out infinite alternate}.bps-lava{animation:bpslava 1.8s ease-in-out infinite alternate}@keyframes bpslava{from{opacity:.55}to{opacity:1}}
.bps-drip{animation:bpsdrip 3s ease-in infinite}@keyframes bpsdrip{0%,60%{transform:translateY(0);opacity:0}65%{opacity:1}100%{transform:translateY(160px);opacity:0}}
.bps-banner{animation:bpsbanner 2.4s ease-in-out infinite alternate}@keyframes bpsbanner{from{transform:skewX(-6deg)}to{transform:skewX(6deg)}}
.bps-flame{animation:bpsflame .35s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}@keyframes bpsflame{from{transform:scale(1,1)}to{transform:scale(.85,1.15)}}
.bps-flag,.bps-wave{animation:bpsflag 1s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:0 50%}@keyframes bpsflag{from{transform:skewY(-8deg)}to{transform:skewY(8deg)}}
.bps-win{animation:bpswin 3s ease-in-out infinite alternate}@keyframes bpswin{from{opacity:.75}to{opacity:1}}
.bps-eyes{animation:bpsblink 4s infinite}@keyframes bpsblink{0%,92%,100%{opacity:1}94%,97%{opacity:0}}
.bps-far.shimmer{animation:bpsshim 3s ease-in-out infinite alternate}@keyframes bpsshim{from{filter:none}to{filter:blur(.6px)}}
.bps-base{display:block;overflow:visible}.bps-base .crk{opacity:0;transition:opacity .4s}.d1 .bps-base .crk1,.d2 .bps-base .crk1,.d2 .bps-base .crk2,.d3 .bps-base .crk{opacity:1}
.bps-tremor{animation:bpstrem .5s linear}@keyframes bpstrem{25%{translate:-3px 1px}50%{translate:3px -1px}75%{translate:-2px 0}}
.bps-pebble{position:absolute;top:0;width:6px;height:6px;border-radius:2px;background:#7a6f92;animation:bpspeb 1.2s ease-in forwards}@keyframes bpspeb{to{transform:translateY(300px) rotate(200deg)}}
@media (prefers-reduced-motion:reduce){.bps-cloud,.bps-bird,.bps-bat,.bps-ember,.bps-fly,.bps-rain,.bps-sway,.bps-banner,.bps-drip{animation:none}}`;document.head.appendChild(s);}

/* ---------- build the scene into the battlefield ---------- */
let S=null;
function build(field,sc,stage,crown){stop();css();const t=themeOf(stage),r=rngOf((stage&&stage.id||'x')+'|'+crown);
 const W=field.clientWidth||2200,h=field.clientHeight||320,cw=sc.clientWidth||800,c=Math.max(1,Math.min(3,crown||1));
 const span=f=>Math.ceil(cw+(W-cw)*f)+2,sky=SKY[t][c-1];
 const L=(cls,w,inner,style)=>`<div class="bps-l ${cls}" style="width:${w}px;${style||''}">${inner}</div>`;
 const svg=(w,inner)=>`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;
 const tint=c===2?'linear-gradient(rgba(255,120,80,.32),rgba(255,170,90,.18))':c===3?'linear-gradient(rgba(25,30,80,.62),rgba(40,40,90,.5))':'';
 const old=field.querySelector('.bps-scene');if(old)old.remove();const oldW=field.querySelector('.bps-weather');if(oldW)oldW.remove();const oldF=field.querySelector('.bps-fgwrap');if(oldF)oldF.remove();
 const scene=document.createElement('div');scene.className='bps-scene';
 scene.innerHTML=L('bps-sky',cw,'',`background:linear-gradient(${sky[0]},${sky[1]} 55%,${sky[2]})`)+L('bps-far'+(t==='fossil'?' shimmer':''),span(.25),svg(span(.25),far(t,span(.25),h,r,c)))
  +L('bps-mid',span(.55),svg(span(.55),mid(t,span(.55),h,r)))+(tint?`<div class="bps-tint" style="background:${tint}"></div>`:'')+L('bps-ground',W,svg(W,ground(t,W,h,r)))+`<div class="bps-marks"></div>`;
 scene.querySelector('.bps-sky').innerHTML=skyBits(t,c,cw,h,r);
 field.insertBefore(scene,field.firstChild);
 const fg=document.createElement('div');fg.className='bps-fgwrap';fg.style.cssText='position:absolute;inset:0;z-index:6;pointer-events:none;overflow:hidden';fg.innerHTML=L('bps-fg',span(1.3),svg(span(1.3),fore(t,span(1.3),h,r)));field.appendChild(fg);
 const wx=document.createElement('div');wx.className='bps-weather';field.appendChild(wx);
 S={t,c,field,sc,scene,fg,wx,W,cw,marks:scene.querySelector('.bps-marks'),nMarks:0,timer:0,grey:false};
 if(c===3&&t!=='caves'){wx.innerHTML='<div class="bps-rain"></div><div class="bps-bolt"></div>';}
 if(c===3)S.timer=setInterval(storm,5200);
 parallax(sc);}
/* lightning and thunder outdoors; tremors and falling pebbles in the caves */
function storm(){if(!S||!document.body.contains(S.field)){stop();return;}if(Math.random()<.45)return;
 if(S.t==='caves'){S.scene.classList.remove('bps-tremor');void S.scene.offsetWidth;S.scene.classList.add('bps-tremor');
  for(let i=0;i<5;i++){const p=document.createElement('i');p.className='bps-pebble';p.style.left=(S.sc.scrollLeft+Math.random()*S.cw)+'px';p.style.animationDelay=(Math.random()*.4)+'s';S.wx.appendChild(p);setTimeout(()=>p.remove(),1800);}return;}
 const b=S.wx.querySelector('.bps-bolt');if(!b)return;b.style.left=S.sc.scrollLeft+'px';b.style.width=S.cw+'px';b.classList.remove('on');void b.offsetWidth;b.classList.add('on');
 try{if(typeof tone==='function'){tone(55,1.1,'sawtooth',.035,.25);tone(42,1.3,'sine',.06,.3);}}catch(e){}}
function parallax(sc){if(!S||!S.scene)return;const x=sc.scrollLeft;const q=(sel,f)=>{const e=S.scene.querySelector(sel);if(e)e.style.transform=`translateX(${f1(x*(1-f))}px)`;};
 q('.bps-sky',0);q('.bps-far',.25);q('.bps-mid',.55);const fg=S.fg&&S.fg.firstChild;if(fg)fg.style.transform=`translateX(${f1(-x*.3)}px)`;
 const rb=S.wx.querySelector('.bps-rain');if(rb){rb.style.left=x+'px';rb.style.width=S.cw+'px';}}
/* the Grey Goblin drains the colour; beating him brings it back with a rainbow wave */
function grey(on){if(!S||S.grey===on)return;S.grey=on;S.scene.classList.toggle('drain',on);S.fg.style.transition='filter 3s';S.fg.style.filter=on?'grayscale(1)':'';}
function rainbow(){if(!S)return;grey(false);const r=document.createElement('div');r.className='bps-rainbow';r.style.left=(S.sc.scrollLeft-S.cw*.6)+'px';r.style.width=(S.cw*.6)+'px';
 r.animate([{transform:'translateX(0)'},{transform:`translateX(${S.cw*1.7}px)`}],{duration:1600,easing:'ease-in-out'});r.style.animation='none';S.wx.appendChild(r);setTimeout(()=>r.remove(),1700);}
/* footprints and scuffs on the lane */
function scuff(x){if(!S||!S.marks)return;const m=document.createElement('i');m.className='bps-mark';m.style.left=x+'%';m.style.bottom=(14+Math.random()*24)+'px';m.style.rotate=(Math.random()*40-20)+'deg';
 S.marks.appendChild(m);if(++S.nMarks>110){S.marks.firstChild.remove();S.nMarks--;}}
/* bases: drawn pictures, cracking as they are hurt */
function base(kind,stage){css();return kind==='house'?house():den(themeOf(stage));}
function baseState(el,hp){if(!el)return;const d=hp<.25?3:hp<.5?2:hp<.75?1:0;if(el._d===d)return;el._d=d;el.classList.remove('d1','d2','d3');if(d)el.classList.add('d'+d);}
function stop(){if(S&&S.timer)clearInterval(S.timer);S=null;}
window.BPScene={build,parallax,grey,rainbow,scuff,base,baseState,stop,themeOf,_s:()=>S};
})();
