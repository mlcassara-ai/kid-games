/* ================= 🚂 the train ride to Dr. Quartz's Lab (Oct 2026; art approved by the owner from still pictures) =================
   Getting on the stopped Town Train (train.js) plays a short full-screen ride and lands in the Lab (lab.js); the Lab's
   "🚂 Train home" plays it back to Number Town and puts the hero on the station platform.
     going:  the map's own train pulls out with the hero aboard (train.js) and, once it is in the tunnel, this starts:
             inside the carriage (wood panelling, riveted windows, lamps, a math poster; the hero stands with the pet on the floor beside them and the carriage
             rocks) while the countryside slides past the windows in layers (clouds, the real Castle/Volcano/Caves entrances far
             away, farms and a windmill, cows and trees, telegraph poles up close) → it slows and the Lab platform (brick and glass,
             a crystal, Dr. Quartz saying "Welcome!") stops in the windows → "Ding! Doors opening…" → white → the Lab.
     home:   the carriage part only, ending at the "🏡 Number Town" platform.
   Built from the game's own drawings (decor.js trees, gateart.js entrances and fountain, quartz.js, heroSVG), outlined in the map's
   brown. Every picture is an SVG turned into an image once per ride, then the canvas only slides images, so it stays smooth on
   iPads. ⏩ Skip from a kid's 4th ride (p.rides). Runs on setTimeout (not requestAnimationFrame) so it never stalls. */
(function(){
const Wd=960,Ht=540,O='#3b2a1e',STRIP=1920;
const SPEED={cloud:14,far:55,mid:120,field:260,near:640,plat:1000}; /* px per second at full speed */
let R=null;
const uri=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
const A=k=>{try{return (window.MQ_DECOR&&MQ_DECOR.ART&&MQ_DECOR.ART[k])||'';}catch(e){return '';}};
const G=k=>{try{return (window.MQ_GATE_ART&&MQ_GATE_ART[k]&&MQ_GATE_ART[k].svg)||'';}catch(e){return '';}};
const im=(svg,x,y,w,h)=>svg?`<image href="${uri(svg)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet"/>`:'';
const doc=(w,h,body,defs='')=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w*2}" height="${h*2}" viewBox="0 0 ${w} ${h}">${defs?`<defs>${defs}</defs>`:''}${body}</svg>`;
const cloud=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="60" ry="24" fill="#fff"/><ellipse cx="38" cy="-14" rx="40" ry="26" fill="#fff"/><ellipse cx="-34" cy="-8" rx="30" ry="20" fill="#fff"/><ellipse cx="6" cy="10" rx="64" ry="10" fill="#d6ecfb"/></g>`;
/* a hill line that repeats every STRIP px, so a strip can be tiled */
function ridge(y,c,c2,amp,seed,w){let d=`M0 540 L0 ${y}`;for(let x=0;x<=w;x+=40){const a=2*Math.PI*x/STRIP;d+=` L${x} ${(y-Math.sin(a*3+seed)*amp-Math.sin(a*7+seed*2)*amp*.35).toFixed(1)}`;}return `<path d="${d} L${w} 540 Z" fill="${c}" stroke="${c2}" stroke-width="3"/>`;}
function bricks(x0,y0,x1,y1,c){let b='';for(let y=y0;y<y1;y+=18)for(let x=x0+((Math.round((y-y0)/18))%2)*14;x<x1-20;x+=28)b+=`<rect x="${x}" y="${y}" width="26" height="16" fill="none" stroke="${c}" stroke-width="1.5"/>`;return b;}
/* ---------- the pictures (built once per ride) ---------- */
/* countryside strips: STRIP px wide, repeating, see-through above their own layer */
function skySVG(){return doc(960,540,`<rect width="960" height="540" fill="url(#k)"/><circle cx="820" cy="110" r="70" fill="#fff3bf" opacity=".25"/><circle cx="820" cy="110" r="44" fill="#fff3bf"/>`,`<linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78c2ef"/><stop offset="1" stop-color="#e3f6ff"/></linearGradient>`);}
function cloudSVG(){return doc(STRIP,540,[[200,110,.9],[620,80,.7],[1050,130,.8],[1500,95,.65],[1800,140,.55]].map(c=>cloud(...c)).join(''));}
function farSVG(){return doc(STRIP,540,`${ridge(250,'#b9dca1','#a5cc8b',18,2,STRIP)}${im(G('castle'),110,150,130,108)}${im(G('volcano'),760,140,140,116)}${im(G('caves'),1400,158,120,100)}${im(A('pine'),520,200,40,54)}${im(A('pine2'),1180,206,36,48)}`);}
const barn=(x)=>`<rect x="${x}" y="235" width="70" height="60" fill="#e03131" stroke="${O}" stroke-width="3"/><path d="M${x-7} 238 L${x+35} 205 L${x+77} 238 Z" fill="#a61e1e" stroke="${O}" stroke-width="3"/><rect x="${x+25}" y="262" width="20" height="33" fill="#fff" stroke="${O}" stroke-width="2"/>`;
const mill=(x)=>`<g transform="translate(${x} 200)"><path d="M-14 100 L-8 0 L8 0 L14 100 Z" fill="#f1e3c6" stroke="${O}" stroke-width="3"/>${[0,90,180,270].map(a=>`<rect x="-5" y="-60" width="10" height="60" fill="#ced4da" stroke="${O}" stroke-width="2.5" transform="rotate(${a+20})"/>`).join('')}<circle r="7" fill="#868e96" stroke="${O}" stroke-width="2"/></g>`;
function midSVG(){return doc(STRIP,540,`${ridge(300,'#9ccc7a','#86b866',26,4,STRIP)}${im(A('farm_silo'),380,210,60,90)}${barn(455)}${mill(900)}${barn(1330)}${im(A('farm_silo'),1430,214,56,84)}${im(A('oak'),1700,230,70,80)}`);}
const cow=(x,y)=>`<g transform="translate(${x} ${y}) scale(.8)"><ellipse cx="0" cy="0" rx="34" ry="20" fill="#fff" stroke="${O}" stroke-width="3"/><ellipse cx="-10" cy="-4" rx="10" ry="7" fill="${O}"/><ellipse cx="14" cy="5" rx="8" ry="6" fill="${O}"/><ellipse cx="38" cy="-12" rx="15" ry="12" fill="#fff" stroke="${O}" stroke-width="3"/><ellipse cx="47" cy="-7" rx="7" ry="6" fill="#ffa8a8" stroke="${O}" stroke-width="2"/>${[-20,-6,12,24].map(l=>`<rect x="${l}" y="14" width="7" height="18" fill="#fff" stroke="${O}" stroke-width="2"/>`).join('')}</g>`;
function fieldSVG(){return doc(STRIP,540,`<rect x="0" y="320" width="${STRIP}" height="220" fill="#7cb35f"/>${im(A('farm_hay'),100,300,70,50)}${im(A('farm_hay'),300,306,60,44)}${cow(560,330)}${cow(640,336)}
 ${im(A('farm_appletree'),40,200,110,130)}${im(A('oak'),230,215,100,120)}${im(A('pine'),760,230,70,95)}${im(A('farm_appletree'),900,205,110,130)}${im(A('birch'),1120,225,70,100)}${im(A('farm_hay'),1250,304,64,46)}${cow(1400,334)}${im(A('oak'),1560,212,100,120)}${im(A('farm_scarecrow'),1720,250,60,80)}
 <path d="M300 140 q8 -8 16 0 q8 -8 16 0 M360 120 q6 -6 12 0 q6 -6 12 0 M1300 110 q8 -8 16 0 q8 -8 16 0" stroke="${O}" stroke-width="3" fill="none"/><rect x="0" y="400" width="${STRIP}" height="140" fill="#6aa34f"/>`);}
function nearSVG(){let s='';for(let x=150;x<STRIP;x+=480)s+=`<rect x="${x}" y="150" width="14" height="330" fill="#7a5230" stroke="${O}" stroke-width="3"/><rect x="${x-26}" y="168" width="66" height="9" rx="3" fill="#5c3d22" stroke="${O}" stroke-width="2"/>`;
 let w='';for(let x=150;x<STRIP+480;x+=480)w+=`M${x+7} 172 Q${x+247} 196 ${x+487} 172 `;
 return doc(STRIP,540,`<path d="${w}" stroke="#343a40" stroke-width="2.5" fill="none"/>${s}${im(A('bush'),380,360,90,70)}${im(A('fern'),760,380,60,50)}${im(A('bush'),1240,366,80,62)}${im(A('fern'),1600,384,56,46)}`);}
/* the carriage: everything except the windows, which stay see-through */
function carriageSVG(){const win=x=>`<rect x="${x}" y="70" width="330" height="230" rx="34" fill="none" stroke="#6b4423" stroke-width="22"/><rect x="${x}" y="70" width="330" height="230" rx="34" fill="none" stroke="${O}" stroke-width="3"/><rect x="${x-11}" y="59" width="352" height="252" rx="44" fill="none" stroke="${O}" stroke-width="3"/>
  ${[0,1,2,3,4,5].map(i=>`<circle cx="${x+30+i*54}" cy="64" r="3.5" fill="#d4a95b" stroke="${O}" stroke-width="1"/><circle cx="${x+30+i*54}" cy="306" r="3.5" fill="#d4a95b" stroke="${O}" stroke-width="1"/>`).join('')}
  <path d="M${x+40} 270 L${x+120} 100" stroke="#fff" stroke-width="16" opacity=".14"/><path d="M${x+80} 270 L${x+150} 120" stroke="#fff" stroke-width="7" opacity=".12"/>`;
 const hole=x=>`M${x+34} 70 h262 a34 34 0 0 1 34 34 v162 a34 34 0 0 1 -34 34 h-262 a34 34 0 0 1 -34 -34 v-162 a34 34 0 0 1 34 -34 Z`;
 let planks='';for(let x=0;x<960;x+=48)planks+=`<path d="M${x} 26 V70 M${x} 300 V330" stroke="#8a5a32" stroke-width="2" opacity=".35"/>`;for(const x of [24,432,504,912])planks+=`<path d="M${x} 70 V300" stroke="#8a5a32" stroke-width="2" opacity=".35"/>`;
 let pan='';for(let x=10;x<960;x+=96)pan+=`<rect x="${x}" y="356" width="80" height="54" rx="6" fill="none" stroke="#4e3119" stroke-width="3"/>`;let fl='';for(let y=430;y<540;y+=22)fl+=`<path d="M0 ${y} H960" stroke="#8a5a32" stroke-width="2" opacity=".5"/>`;
 return doc(960,540,`<path fill-rule="evenodd" d="M0 0 H960 V540 H0 Z ${hole(70)} ${hole(530)}" fill="url(#wood)"/>${planks}${win(70)}${win(530)}
 <rect x="0" y="0" width="960" height="26" fill="#8a5a32" stroke="${O}" stroke-width="3"/>
 ${[235,695].map(x=>`<circle cx="${x}" cy="40" r="70" fill="url(#lamp)"/><path d="M${x-22} 26 h44 l-8 26 h-28 Z" fill="#ffd43b" stroke="${O}" stroke-width="3"/><circle cx="${x}" cy="54" r="7" fill="#fff9db" stroke="${O}" stroke-width="2"/>`).join('')}
 <rect x="418" y="98" width="94" height="128" rx="6" fill="#fff9db" stroke="${O}" stroke-width="4"/><rect x="426" y="106" width="78" height="112" fill="#e7f5ff"/>
 <g font-family="Fredoka, Arial Rounded MT Bold, Helvetica, sans-serif" font-weight="700" text-anchor="middle"><text x="465" y="128" font-size="13" fill="#1864ab">MIND THE</text><text x="465" y="145" font-size="13" fill="#1864ab">GAP…</text><text x="465" y="172" font-size="22" fill="#e03131">7+5</text><text x="465" y="196" font-size="11" fill="#1864ab">…and carry</text><text x="465" y="210" font-size="11" fill="#1864ab">the one!</text></g>
 <rect x="0" y="330" width="960" height="18" fill="#8a5a32" stroke="${O}" stroke-width="3"/><rect x="0" y="348" width="960" height="70" fill="#6b4423"/>${pan}
 <rect x="0" y="418" width="960" height="122" fill="#a87346"/>${fl}<path d="M160 430 L300 430 L340 540 L180 540 Z" fill="#fff3bf" opacity=".3"/><path d="M620 430 L760 430 L800 540 L640 540 Z" fill="#fff3bf" opacity=".3"/>
 <rect x="575" y="300" width="300" height="24" rx="6" fill="#d4a95b" stroke="${O}" stroke-width="3"/>${im(A('station_luggage'),700,262,60,42)}
`,
 `<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a066"/><stop offset="1" stop-color="#c48548"/></linearGradient><radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3bf" stop-opacity=".9"/><stop offset="1" stop-color="#fff3bf" stop-opacity="0"/></radialGradient><linearGradient id="seat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9775fa"/><stop offset="1" stop-color="#6741d9"/></linearGradient>`);}
/* the platforms, see-through above the roofs; drawn at the place where they stop (sign in the left window, the greeter in the right one) */
function labSVG(){let gl='';[90,380,670].forEach(x=>{gl+=`<rect x="${x}" y="150" width="200" height="130" rx="10" fill="#c5f6fa" stroke="${O}" stroke-width="4"/><path d="M${x+100} 150 V280 M${x} 215 H${x+200}" stroke="${O}" stroke-width="3"/><path d="M${x+30} 270 L${x+42} 236 V226 H${x+58} V236 L${x+70} 270 Z" fill="#69db7c" stroke="${O}" stroke-width="2.5"/><circle cx="${x+50}" cy="220" r="4" fill="#fff"/><circle cx="${x+56}" cy="208" r="3" fill="#fff"/><path d="M${x+130} 270 a22 22 0 1 1 30 0 Z" fill="#748ffc" stroke="${O}" stroke-width="2.5"/><rect x="${x+139}" y="232" width="12" height="16" fill="#748ffc" stroke="${O}" stroke-width="2.5"/>`;});
 const q=window.QUARTZ_SVG||'';
 return doc(960,540,`<rect x="-200" y="250" width="1360" height="290" fill="#9ccc7a"/><rect x="40" y="110" width="880" height="200" fill="#c96f4a" stroke="${O}" stroke-width="4"/>${bricks(40,118,920,310,'#a65537')}${gl}
 <rect x="20" y="92" width="920" height="28" rx="8" fill="#4c6ef5" stroke="${O}" stroke-width="4"/>
 <g transform="translate(235 98) scale(.42)"><path d="M0 -70 L34 -30 L22 40 L-22 40 L-34 -30 Z" fill="#b197fc" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M0 -70 L10 -30 L0 40 L-22 40 L-34 -30 Z" fill="#9775fa"/><path d="M0 -70 L34 -30 L22 40 L-22 40 L-34 -30 Z" fill="none" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M-8 -48 L-16 -20" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/></g>
 <rect x="90" y="120" width="290" height="58" rx="14" fill="#fff" stroke="#1971c2" stroke-width="5"/><text x="235" y="158" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, Helvetica, sans-serif" font-weight="700" font-size="30" fill="#1971c2">Dr. Quartz's Lab</text>
 <rect x="-200" y="300" width="1360" height="140" fill="#cfc6b6"/><rect x="-200" y="300" width="1360" height="12" fill="#ffd43b" stroke="${O}" stroke-width="2"/>${im(A('station_lantern'),60,190,60,120)}${im(A('station_bench'),780,240,130,70)}${im(A('station_luggage'),880,262,60,50)}
 ${q?`<image href="${uri(q)}" x="640" y="150" width="130" height="156"/>`:''}<g transform="translate(34 0)"><path d="M612 150 h-70 a16 16 0 0 1 -16 -16 v-10 a16 16 0 0 1 16 -16 h96 a16 16 0 0 1 16 16 v10 a16 16 0 0 1 -16 16 h-6 l10 16 l-22 -16 Z" fill="#fff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><text x="590" y="137" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, Helvetica, sans-serif" font-weight="700" font-size="20" fill="#1971c2">Welcome! 👋</text></g>`);}
function homeSVG(){const f=(window.MQ_FOUNTAIN_ART&&MQ_FOUNTAIN_ART.svg)||'';
 return doc(960,540,`<rect x="-200" y="250" width="1360" height="290" fill="#e8dcc0"/><rect x="40" y="120" width="880" height="190" fill="#b5523b" stroke="${O}" stroke-width="4"/>${bricks(40,128,920,310,'#8f3d2b')}
 ${[100,690].map(x=>`<rect x="${x}" y="190" width="170" height="90" rx="10" fill="#fff3bf" stroke="${O}" stroke-width="4"/><path d="M${x+85} 190 V280" stroke="${O}" stroke-width="3"/>`).join('')}
 <path d="M20 124 L480 60 L940 124 Z" fill="#6b4a2e" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
 <rect x="80" y="120" width="310" height="58" rx="14" fill="#ffd43b" stroke="${O}" stroke-width="5"/><text x="235" y="158" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, Helvetica, sans-serif" font-weight="700" font-size="30" fill="${O}">🏡 Number Town</text>
 <rect x="-200" y="300" width="1360" height="140" fill="#cfc6b6"/><rect x="-200" y="300" width="1360" height="12" fill="#ffd43b" stroke="${O}" stroke-width="2"/>${im(A('station_lantern'),60,190,60,120)}${im(A('station_bench'),780,240,130,70)}
 ${f?`<image href="${uri(f)}" x="620" y="160" width="140" height="140"/>`:''}`);}
/* ---------- the timeline ---------- */
function times(){const b=600;return {tunnel:0,black:b,ramp:b+1000,decel:b+5700,stop:b+7700,doors:b+8500,end:b+9200};}
function vAt(T,t){if(t<T.black)return 0;if(t<T.ramp)return (t-T.black)/(T.ramp-T.black);if(t<T.decel)return 1;if(t<T.stop)return 1-(t-T.decel)/(T.stop-T.decel);return 0;}
function ok(i){return i&&i.complete&&i.naturalWidth;}
function draw(i,x,y,w,h){if(ok(i))R.ctx.drawImage(i,x,y,w,h);}
function tile(i,off){if(!ok(i))return;const x=-((off%STRIP)+STRIP)%STRIP;draw(i,x,0,STRIP,Ht);draw(i,x+STRIP,0,STRIP,Ht);}
function smoke(c,x,y,t){for(let k=0;k<6;k++){const age=((t/650)+k/6)%1,px=x-age*170,py=y-age*80,r=12+age*30;c.globalAlpha=.9*(1-age);c.fillStyle='#f1f3f5';c.beginPath();c.arc(px,py,r,0,7);c.arc(px+r*.7,py+r*.25,r*.7,0,7);c.arc(px-r*.7,py+r*.3,r*.65,0,7);c.fill();}c.globalAlpha=1;}
function countryside(c,dt,t,T){const v=vAt(T,t),o=R.off;for(const k in SPEED)o[k]=(o[k]||0)+v*dt*SPEED[k];
 draw(R.img.sky,0,0,Wd,Ht);tile(R.img.cloud,o.cloud);tile(R.img.far,o.far);tile(R.img.mid,o.mid);tile(R.img.field,o.field);tile(R.img.near,o.near);
 if(t>=T.decel){const r=Math.max(0,(T.stop-t)/1000),d=(T.stop-T.decel)/1000;R.platX=SPEED.plat*r*r/(2*d); /* the distance still to go, so it stops exactly in place */draw(R.out?R.img.lab:R.img.home,R.platX,0,Wd,Ht);}}
function inside(c,t,T,dark){const v=vAt(T,t),bob=Math.sin(t/140)*2*v+Math.sin(t/57)*v;c.save();c.translate(0,bob);draw(R.img.car,0,-2,Wd,Ht+4);draw(R.img.hero,210,250,170,221);
 if(R.pet){const hop=Math.max(0,Math.sin(t/260))**8*14;c.font='64px "Apple Color Emoji","Segoe UI Emoji",sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(420,472,30,7,0,0,7);c.fill();c.fillStyle='#000';c.fillText(R.pet,420,466-hop);} /* your pet rides along, on the floor next to you (owner: no bench) */c.restore();
 if(dark){c.fillStyle='rgba(10,8,20,.72)';c.fillRect(0,0,Wd,Ht);}}
function sfx(k){try{if(!state.sound||typeof tone!=='function')return;if(k==='whistle')[[0,.5],[.62,1.1]].forEach(([d,l])=>{tone(740,l,'sine',.05,d);tone(932,l,'sine',.045,d);});else if(k==='ding')[0,.32].forEach(d=>{tone(1320,.35,'sine',.05,d);tone(1760,.3,'sine',.025,d);});}catch(e){}}
function bubble(c,txt){c.font='700 30px Fredoka, system-ui, sans-serif';const w=c.measureText(txt).width+48;c.fillStyle='#fff';c.strokeStyle=O;c.lineWidth=4;c.beginPath();if(c.roundRect)c.roundRect(Wd/2-w/2,10,w,54,27);else c.rect(Wd/2-w/2,10,w,54);c.fill();c.stroke();c.fillStyle=O;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,Wd/2,38);}
function step(){if(!R)return;const now=performance.now(),dt=R.last?Math.min(.05,(now-R.last)/1000):0;R.last=now;
 if(!R.t0){/* wait (at most 1.5 s) for the pictures to be ready */const ready=Object.values(R.img).every(ok);if(!ready&&now-R.made<1500){R.tm=setTimeout(step,30);return;}R.t0=now;sfx('whistle');}
 const t=now-R.t0,T=R.T,c=R.ctx;
 if(t<T.doors){countryside(c,dt,t,T);inside(c,t,T,false);if(t<T.black+400){c.fillStyle=`rgba(0,0,0,${Math.max(0,1-(t-T.black)/400)})`;c.fillRect(0,0,Wd,Ht);}
  if(t>T.stop){if(!R.dinged){R.dinged=1;sfx('ding');}bubble(c,'🔔 Ding! Doors opening…');}}
 else{countryside(c,0,t,T);inside(c,t,T,false);c.fillStyle=`rgba(255,255,255,${Math.min(1,(t-T.doors)/600)})`;c.fillRect(0,0,Wd,Ht);}
 const cap=R.el.querySelector('.rd-cap');if(cap){const s=t<T.decel?'Next stop: '+R.name:t<T.doors?R.name:'';if(cap.textContent!==s)cap.textContent=s;cap.style.display=s?'':'none';}
 if(t>=T.end){finish();return;}R.tm=setTimeout(step,16);}
function finish(){if(!R)return;const r=R;R=null;clearTimeout(r.tm);r.el.remove();try{r.done&&r.done();}catch(e){console.warn('ride',e);}}
const pic=s=>{const i=new Image();i.src=uri(s);return i;};
/* to: 'lab' (from the Town Train) or 'home' (from the Lab) */
function go(to,done){if(R)return false;const p=typeof P==='function'?P():null;const n=p?(p.rides||0):0;if(p){p.rides=n+1;try{saveLocal();}catch(e){}}
 const out=to==='lab',el=document.createElement('div');el.id='rideOv';el.className='rd-ov';
 el.innerHTML=`<canvas width="${Wd*2}" height="${Ht*2}"></canvas><span class="rd-cap"></span>${n>=3?'<button class="rd-skip" type="button" onclick="Ride._skip()">⏩ Skip</button>':''}`;
 css();document.body.appendChild(el);const ctx=el.querySelector('canvas').getContext('2d');ctx.scale(2,2);ctx.fillStyle='#000';ctx.fillRect(0,0,Wd,Ht);
 let hero='';try{if(p&&typeof heroSVG==='function')hero=heroSVG(p.look,{spell:p.spell});}catch(e){}
 const img={sky:pic(skySVG()),cloud:pic(cloudSVG()),far:pic(farSVG()),mid:pic(midSVG()),field:pic(fieldSVG()),near:pic(nearSVG()),car:pic(carriageSVG())};
 if(hero)img.hero=pic(hero);if(out)img.lab=pic(labSVG());else img.home=pic(homeSVG());
 let pe='';try{const pt=p&&typeof petOf==='function'&&petOf(p);if(pt)pe=pt.e;}catch(e){}
 R={pet:pe,to,out,done,el,ctx,img,T:times(),t0:0,made:performance.now(),last:0,off:{},platX:null,name:out?"Dr. Quartz's Lab":'Number Town',dinged:0};
 step();return true;}
let CSSON=false;function css(){if(CSSON)return;CSSON=true;const s=document.createElement('style');s.textContent=`
.rd-ov{position:fixed;inset:0;z-index:200;background:#000;display:grid;place-items:center}
.rd-ov canvas{width:100vw;height:100vh;object-fit:contain;display:block}
.rd-cap{position:fixed;left:14px;top:calc(12px + env(safe-area-inset-top));background:rgba(0,0,0,.5);color:#fff;border-radius:12px;padding:6px 12px;font:600 16px Fredoka,system-ui,sans-serif}
.rd-skip{position:fixed;right:14px;top:calc(12px + env(safe-area-inset-top));background:rgba(0,0,0,.5);color:#fff;border:2px solid #fff8;border-radius:12px;padding:8px 14px;font:700 16px Fredoka,system-ui,sans-serif;cursor:pointer;min-height:44px}`;document.head.appendChild(s);}
window.Ride={go,_skip:finish,busy:()=>!!R,_seek:ms=>{if(R&&R.t0){R.t0=performance.now()-ms;R.last=0;}},_ready:()=>!!(R&&R.t0),_svg:{carriageSVG,labSVG,homeSVG,farSVG,midSVG,fieldSVG,nearSVG}};
})();
