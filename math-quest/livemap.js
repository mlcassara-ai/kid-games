/* ================= 🌿 the living map (demo, Oct 2026) =================
   The owner's plan (workshopped to 90%): every area gets ONE living thing that moves on its own, and three tap surprises (two easy, one
   hidden that wakes only after a battle win in that world). Sound only on a tap; Calm motion stops the living things (taps still wiggle);
   Quiet taps keeps the wiggle and drops the sound. A surprise fires when it is within 3 squares of the wizard; a farther tap just walks
   next to it. An easy surprise you haven't found shimmers once, slowly, the first time you come near it on a visit.
   Batch 1: Number Village (the town clock, the fountain's coin slot, the station board, a pigeon on the Depot roof), Graph Garden (flower
   beds that grow into a bar chart through the day, settled bees, the watering can, the pie-chart sign, a gnome), Subtraction Caves (a mole,
   five crystals that play notes and snooze, the mine cart, a fossil), Division Castle (a marching guard, the catapult that shares equally,
   the knight statue, a shield on the tower) and the dragon egg by the volcano, which cracks with wins.
   Since 2026.10.11a it is on for everyone (?livemap=0 turns it off on a device, ?livemap=on back on; ?livemap=1 adds a demo panel
   that jumps between areas and fakes wins, and makes a demo hero on a device with none). Also Addition Forest (rabbit family, bouncy
   mushrooms, an owl in the treehouse window, a squirrel in the oak's knothole, the pet rolls in the leaves on arrival) and, in Division
   Castle, two tiny soldiers who lob bombs at each other and always miss (the pet explains them once per visit, only inside the castle).
   A hero's finds, the worlds they've won in and the egg's wins are in p.lm; Calm motion / Quiet taps are per device (Parent Corner);
   📖 Secrets of the map is a panel on the Me page's 🏆 tab. Batch 2 (Volcano hatching, Reef, Farm, …) is still to come.
   Hooks used: MQ_DECOR.draw (wrapped, to wobble/spin the real scenery while it reacts), MQ_MAPDRAW (living things and effects), MQ_TAP
   (a tap on a surprise). */
(function(){
/* On for everyone. ?livemap=0 turns it off on a device (?livemap=on back on); ?livemap=1 also shows the demo panel (jump between areas, fake wins). */
const Q=new URLSearchParams(location.search);
try{const v=Q.get('livemap');if(v==='1')localStorage.setItem('mq.livemap','1');if(v==='0')localStorage.setItem('mq.livemap','0');if(v==='on')localStorage.removeItem('mq.livemap');}catch(e){}
let MODE='';try{MODE=localStorage.getItem('mq.livemap')||'';}catch(e){}
if(MODE==='0')return;const DEMO=MODE==='1';

/* ---------- state: Calm motion and Quiet taps are per device (Parent Corner); what a hero found, the worlds they've won in and the egg's
   wins live in their own save (p.lm = {found:{id:time}, won:{biome:1}, wins, water:{day:[4]}}) ---------- */
const DEV='mq.livemap.dev';
let ST={calm:false,quiet:false,ring:0,won:{},wins:0,found:{},water:{}};
try{const d=JSON.parse(localStorage.getItem(DEV)||'{}');ST.calm=!!d.calm;ST.quiet=!!d.quiet;}catch(e){}
function heroLM(p){try{p=p||P();if(!p)return null;const L=p.lm=p.lm||{};L.found=L.found||{};L.won=L.won||{};L.wins=L.wins||0;L.water=L.water||{};return L;}catch(e){return null;}}
function syncST(){const L=heroLM();if(!L||ST._L===L)return;ST._L=L;ST.found=L.found;ST.won=L.won;ST.water=L.water;ST.wins=L.wins;}
const saveST=()=>{try{localStorage.setItem(DEV,JSON.stringify({calm:ST.calm,quiet:ST.quiet}));}catch(e){}const L=ST._L;if(L){L.wins=ST.wins;try{save();}catch(e){}}};
/* a battle win wakes that world's hidden surprise; wins in Multiplication Volcano (or anywhere, for a hero whose grade doesn't play it yet) crack the egg */
window.MQ_HOOKS=window.MQ_HOOKS||[];
window.MQ_HOOKS.push({battle:(p,r)=>{try{if(!r||!r.win)return;const L=heroLM(p);if(!L)return;const b=Object.keys(BIOMES).find(k=>BIOMES[k].zone===r.zone);if(b)L.won[b]=1;
 const vz=ZONES.find(z=>z.id===BIOMES.volcano.zone);let volc=r.zone===BIOMES.volcano.zone;try{if(!volc&&vz&&zoneLocked(vz,p))volc=true;}catch(e){}if(volc&&L.wins<15)L.wins++;if(ST._L===L)ST.wins=L.wins;}catch(e){}}});
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};

/* ---------- little helpers ---------- */
const OL='#3b2a1e';
const lw=ts=>Math.max(1.5,ts*.035);
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
const keyAt=(x,y)=>{try{return MQ_DECOR.key(W.T[y][x],x,y);}catch(e){return null;}};
const near=(x,y,r)=>W&&Math.max(Math.abs(W.hx-x),Math.abs(W.hy-y))<=(r||3);
const free=t=>t&&!t.o&&!t.block&&!t.path&&!t.plaza&&!t.water&&!t.gate&&!t.npc&&!t.chest&&!t.rail&&!t.deco;
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function tilesWith(b,keys){const out=[];if(!W)return out;const C=BIOMES[b].c;for(let y=0;y<WROWS;y++)for(let x=0;x<WCOLS;x++){const t=W.T[y][x];if(t.b!==b)continue;const k=keyAt(x,y);if(k&&keys.includes(k))out.push({x,y,k,d:Math.hypot(x-C[0],y-C[1])});}return out.sort((a,b)=>a.d-b.d);}
function freeSpot(b,dmin,dmax,w,taken,needUp){const C=BIOMES[b].c,c=[];for(let y=2;y<WROWS-2;y++)for(let x=2;x<WCOLS-2;x++){const d=Math.hypot(x-C[0],y-C[1]);if(d<dmin||d>dmax)continue;if(y<=C[1]+1&&y>=C[1]-3&&x+w-1>=C[0]-2&&x<=C[0]+2)continue; /* the entrance picture and its name stay clear */let ok=true;
 for(let i=0;i<w;i++){const t=W.T[y][x+i];if(!t||t.b!==b||!free(t)||taken.has((x+i)+','+y)){ok=false;break;}if(needUp){const u=W.T[y-1]&&W.T[y-1][x+i];if(!u||u.gate||u.npc)ok=false;}}
 if(ok)c.push({x,y,d});}c.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);return c[0]||null;}

/* ---------- sound (only ever on a tap) ---------- */
function ac(){try{if(!state.sound||ST.quiet)return null;AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state!=='running')AC.resume();return AC;}catch(e){return null;}}
function out(a){try{return fxOut(a);}catch(e){return a.destination;}}
function tone(f,dur,type,vol,delay,slide){const a=ac();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.12,t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(g);g.connect(out(a));o.start(t);o.stop(t+dur+.05);}
function noise(dur,freq,vol,delay,q){const a=ac();if(!a)return;const t=a.currentTime+(delay||0),n=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
 const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q||1;const g=a.createGain();g.gain.setValueAtTime(vol||.1,t);g.gain.exponentialRampToValueAtTime(.0005,t+dur);s.connect(f);f.connect(g);g.connect(out(a));s.start(t);}
const SFX={
 plink:()=>{tone(1568,.25,'sine',.12);tone(2093,.3,'sine',.07,.09);noise(.25,2500,.05,.35,2);},
 flap:()=>{for(let i=0;i<4;i++)noise(.06,900,.08,i*.09,1.5);},
 flip:()=>{for(let i=0;i<7;i++)noise(.03,3000,.08,i*.07,3);},
 note:n=>{const f=[523.25,587.33,659.25,783.99,880][n];tone(f,1.1,'sine',.14);tone(f*2,.6,'triangle',.04);tone(f*3.01,.4,'sine',.02);},
 snore:()=>{tone(110,.9,'sawtooth',.03,0,70);tone(95,.9,'sawtooth',.025,1.1,140);},
 cart:()=>{noise(1.2,300,.07,0,.7);tone(1800,.12,'square',.015,.3);tone(1700,.12,'square',.015,1.4);},
 boing:()=>{tone(260,.35,'triangle',.12,0,520);},
 dance:()=>{[0,1,2,3].forEach(i=>tone([392,494,587,494][i],.12,'square',.04,i*.16));noise(.08,1800,.1,.75,3);},
 thunk:()=>{tone(140,.25,'sine',.18,0,60);noise(.15,600,.12,0,1);},
 split:()=>{tone(700,.12,'triangle',.08);[0,1,2].forEach(i=>{tone(120,.18,'sine',.12,.55+i*.06,70);noise(.1,500,.08,.55+i*.06,1);});},
 creak:()=>{tone(320,.25,'sawtooth',.03,0,240);tone(900,.15,'sine',.06,.45);},
 clang:()=>{tone(1250,.7,'triangle',.07);tone(1870,.5,'sine',.05);},
 water:()=>{for(let i=0;i<10;i++)noise(.08,3500+Math.random()*1500,.04,i*.08,4);},
 spin:()=>{for(let i=0;i<9;i++)tone(900+i*30,.05,'square',.02,i*.09+i*i*.004);tone(1320,.25,'sine',.08,1.25);},
 cheer:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.25,'triangle',.07,i*.09));},
 wiggle:()=>{tone(200,.12,'sine',.08,0,260);tone(200,.12,'sine',.08,.15,260);},
 egg:()=>{tone(300,.08,'square',.03);tone(260,.08,'square',.03,.12);},
 knock:()=>{[0,.16,.32].forEach(d=>{tone(180,.08,'sine',.14,d,120);noise(.04,1200,.08,d,2);});tone(520,.5,'sine',.05,.9,480);tone(400,.6,'sine',.05,1.25,380);},
 chatter:()=>{for(let i=0;i<6;i++)tone(1700+Math.random()*500,.05,'square',.025,.15+i*.07);},
 found:()=>{tone(1319,.18,'sine',.05);tone(1760,.25,'sine',.05,.1);}
};
const snd=(k,a)=>{try{SFX[k]&&SFX[k](a);}catch(e){}};

/* ---------- surprises ---------- */
/* each: {id,b,name,hidden,x,y,hit:[x0,y0,x1,y1] in squares (relative to x,y), range, dur, fire(), wrap(ctx,k,sx,sy,ts,now) to move the
   real scenery while it reacts, fx(ctx,k,X,Y,ts,now) drawn on top} */
const SURP=[],LIVE=[],ANIM={};let BUILT=null,PICK=null;
const play=(id,dur)=>{ANIM[id]={t0:performance.now(),dur};};
const prog=(id,now)=>{const a=ANIM[id];if(!a)return -1;const k=(now-a.t0)/a.dur;if(k>=1){delete ANIM[id];return -1;}return k;};
function add(s){s.range=s.range||3;s.hit=s.hit||[0,0,1,1];SURP.push(s);return s;}
function found(s){if(ST.found[s.id])return;ST.found[s.id]=Date.now();saveST();s.pop=performance.now();setTimeout(()=>snd('found'),350);}

function build(){SURP.length=0;LIVE.length=0;const taken=new Set();
 /* ===== Number Village / town square ===== */
 {const fn=NPCS.find(n=>n.id==='fountain'),fx=fn.x,fy=fn.y;let slot=null;
  for(const [dx,dy] of [[-1,1],[1,1],[-2,0],[2,0]]){const t=W.T[fy+dy]&&W.T[fy+dy][fx+dx];if(t&&!t.block&&!t.npc&&!t.gate&&!t.rail&&!t.platform){slot=[fx+dx,fy+dy];break;}}
  if(slot){const t=W.T[slot[1]][slot[0]];t.block=true;t.nodecor=true;taken.add(slot.join(','));
   add({id:'v_coin',b:'village',name:'The fountain\'s coin slot',x:slot[0],y:slot[1],hit:[0,-.3,1,1],dur:1500,fx0:fx,fy0:fy,fire(){snd('plink');},
    still(ctx,X,Y,ts){coinPost(ctx,X+ts/2,Y+ts*.95,ts);},
    fx(ctx,k,X,Y,ts){const ex=(this.fx0-this.x)*ts,ey=(this.fy0-this.y)*ts-ts*.25,p=cl(k/.7,0,1),x0=X+ts/2,y0=Y+ts*.35,px=x0+ex*p,py=y0+ey*p-Math.sin(p*Math.PI)*ts*1.1;
     if(k<.7)coin(ctx,px,py,ts*.12,k*20);else{const r=(k-.7)/.3;ctx.strokeStyle=`rgba(255,255,255,${1-r})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x0+ex,y0+ey+ts*.1,ts*.15+r*ts*.35,(ts*.15+r*ts*.35)*.4,0,0,7);ctx.stroke();
      ctx.fillStyle=`rgba(255,240,150,${1-r})`;for(let i=0;i<4;i++){const a=i*Math.PI/2+r*2;ctx.beginPath();ctx.arc(x0+ex+Math.cos(a)*ts*.3*r,y0+ey-ts*.2*r+Math.sin(a)*ts*.15,ts*.03,0,7);ctx.fill();}}}});}
  add({id:'v_board',b:'village',name:'The station board',x:20,y:20,hit:[-.2,-.8,1.2,1],dur:1300,fire(){snd('flip');},
   fx(ctx,k,X,Y,ts){if(typeof W==='undefined')return;const mid=X+ts/2,bw=ts*1.3,bh=ts*.62,by=Y-ts*.42;const n=7,ch='0123456789:';ctx.save();rrect(ctx,mid-bw/2+3,by+3,bw-6,bh-6,ts*.06);ctx.clip();
    ctx.fillStyle='#212529';ctx.fillRect(mid-bw/2,by,bw,bh);const cells=5,cw=(bw-8)/cells;
    for(let i=0;i<cells;i++){const ph=cl(k*1.4-i*.08,0,1),fl=Math.abs(Math.cos(ph*Math.PI*6)),x=mid-bw/2+4+i*cw;ctx.fillStyle='#343a40';ctx.fillRect(x+1,by+bh/2-bh*.4*fl,cw-2,bh*.8*fl);
     ctx.fillStyle='#69db7c';ctx.font=`800 ${Math.round(ts*.26)}px ui-monospace,Menlo,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';if(fl>.3&&ph<1)ctx.fillText(ch[(Math.floor(ph*n*3)+i*3)%ch.length],x+cw/2,by+bh/2);
     ctx.fillStyle='#000';ctx.fillRect(x,by+bh/2-.5,cw,1);}ctx.restore();}});
  /* the pigeon on the Depot roof (hidden) */
  add({id:'v_pigeon',swap:true,b:'village',hidden:true,name:'The pigeon on the Depot roof',x:17,y:19,hit:[-.3,-.2,1,1.2],dur:2600,fire(){snd('flap');},
   still(ctx,X,Y,ts,now){pigeon(ctx,X+ts*.3,Y+ts*.42,ts,0,now);},
   fx(ctx,k,X,Y,ts,now){const up=Math.sin(Math.min(1,k)*Math.PI);pigeon(ctx,X+ts*.3+Math.sin(k*Math.PI*2)*ts*.4,Y+ts*.42-up*ts*1.2,ts,up>.05?1:0,now);}});
  /* the town clock (living thing): real hands; a bird pops out at the top of every hour */
  LIVE.push({id:'clock',b:'village',draw(ctx,cx,cy,ts,now,items){const w=ts*5,h=w*214/320,ax=TOWN_X*ts-cx,ay=TOWN_Y*ts-cy,top=ay+ts*3-h,X=ax+w*160/320,Y=top+h*29/214,r=w*12/320;
   items.push({y:TOWN_Y+2.01,draw:()=>{const d=new Date(),hr=d.getHours()%12+d.getMinutes()/60,mi=d.getMinutes()+d.getSeconds()/60;ctx.fillStyle='#fffbea';ctx.beginPath();ctx.arc(X,Y,r,0,7);ctx.fill();
    ctx.strokeStyle=OL;ctx.lineCap='round';ctx.lineWidth=Math.max(1.6,ts*.04);const hand=(a,l)=>{ctx.beginPath();ctx.moveTo(X,Y);ctx.lineTo(X+Math.sin(a)*l,Y-Math.cos(a)*l);ctx.stroke();};hand(hr/12*Math.PI*2,r*.5);ctx.lineWidth=Math.max(1.2,ts*.028);hand(mi/60*Math.PI*2,r*.8);
    ctx.fillStyle=OL;ctx.beginPath();ctx.arc(X,Y,Math.max(1.2,ts*.025),0,7);ctx.fill();
    /* the bird: the first 6 seconds of every hour (or when the demo rings the hour) */
    const since=(Date.now()-(ST.ring||0))/1000,s0=d.getMinutes()===0&&d.getSeconds()<6?d.getSeconds()+d.getMilliseconds()/1000:since<6?since:-1;
    if(s0>=0&&!ST.calm){const out=Math.min(1,s0/.6,(6-s0)/.6),bob=out>=1?Math.sin(s0*5)*r*.15:0;
     /* a little door opens in the clock face and the bird pops out, bobs and flaps, then goes back in */
     ctx.fillStyle='#5c3a1c';ctx.beginPath();ctx.arc(X,Y,r*.62*Math.min(1,s0/.3,(6-s0)/.3),0,7);ctx.fill();
     cuckoo(ctx,X,Y+bob,r*(.4+out*1.1),out>=1?Math.sin(s0*16):0,s0);}}});}});
 }
 /* ===== Graph Garden ===== */
 {const B='garden',bed=freeSpot(B,2.5,5,2,taken,true);
  if(bed){for(let i=0;i<2;i++){const t=W.T[bed.y][bed.x+i];t.block=true;t.nodecor=true;taken.add((bed.x+i)+','+bed.y);}
   const G={x:bed.x,y:bed.y,bees:[0,1,2,3,0,2].map((b,i)=>({bed:b,ph:i*1.7,fly:null}))};LIVE.push({id:'beds',b:B,G,draw(ctx,cx,cy,ts,now,items){items.push({y:G.y+.02,draw:()=>bedsDraw(ctx,G,G.x*ts-cx,G.y*ts-cy,ts,now)});}});
   /* the gnome beside the beds (hidden) */
   const gs=freeSpot(B,1.5,5,1,new Set([...taken]),false);let gx=bed.x+2,gy=bed.y;{const t=W.T[gy]&&W.T[gy][gx];if(!free(t)&&gs){gx=gs.x;gy=gs.y;}}
   {const t=W.T[gy][gx];t.block=true;t.nodecor=true;taken.add(gx+','+gy);}
   add({id:'g_gnome',swap:true,b:B,hidden:true,name:'The garden gnome',x:gx,y:gy,hit:[0,-.4,1,1],dur:2600,G,fire(){snd('cheer');},
    still(ctx,X,Y,ts,now){gnome(ctx,X+ts*.5,Y+ts*.95,ts,0,null);},
    fx(ctx,k,X,Y,ts,now){const t=tallest(G),bx=(G.x-this.x)*ts+X+ts*(.18+t*.42)/1,top=bedTop(G,t,Y+(G.y-this.y)*ts,ts);gnome(ctx,X+ts*.5,Y+ts*.95-Math.abs(Math.sin(k*Math.PI*3))*ts*.12*(k>.5?1:0),ts,k,{x:(G.x-this.x)*ts+X+ts*(.25+t*.5),top});}});
   /* the watering can: pick a bed and it grows a step */
   const can=tilesWith(B,['garden_can'])[0];
   if(can)add({id:'g_can',b:B,name:'The watering can',x:can.x,y:can.y,hit:[0,-.2,1,1],dur:1400,G,fire(){snd('water');PICK={G,t:performance.now()};},
    wrap(ctx,k,sx,sy,ts){const a=-Math.sin(Math.min(1,k*1.4)*Math.PI)*.5;ctx.translate(sx+ts*.5,sy+ts*.9);ctx.rotate(a);ctx.translate(-(sx+ts*.5),-(sy+ts*.9));},
    fx(ctx,k,X,Y,ts){ctx.fillStyle='rgba(116,192,252,.9)';for(let i=0;i<6;i++){const p=(k*3+i/6)%1;ctx.beginPath();ctx.arc(X+ts*.1-p*ts*.25,Y+ts*.45+p*ts*.4,ts*.03,0,7);ctx.fill();}}});
   const pie=tilesWith(B,['garden_piesign'])[0];
   if(pie)add({id:'g_pie',b:B,name:'The pie-chart sign',x:pie.x,y:pie.y,hit:[0,-.4,1,1],dur:2200,G,fire(){snd('spin');this.stop=Math.floor(Math.random()*4);G.wave={bed:this.stop,t:performance.now()+1500};},
    fx(ctx,k,X,Y,ts){const cx0=X+ts*.5,cy0=Y-ts*.15,r=ts*.32,spin=(1-Math.pow(1-Math.min(1,k/.7),3))*(Math.PI*2*3+this.stop*Math.PI/2+Math.PI/4);
     ctx.save();ctx.translate(cx0,cy0);ctx.rotate(spin);BEDC.forEach((c,i)=>{ctx.fillStyle=c[0];ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,i*Math.PI/2-Math.PI/2,(i+1)*Math.PI/2-Math.PI/2);ctx.closePath();ctx.fill();});
     ctx.restore();ctx.strokeStyle=OL;ctx.lineWidth=lw(ts);ctx.beginPath();ctx.arc(cx0,cy0,r,0,7);ctx.stroke();ctx.fillStyle=OL;ctx.beginPath();ctx.moveTo(cx0,cy0-r-ts*.02);ctx.lineTo(cx0-ts*.07,cy0-r-ts*.14);ctx.lineTo(cx0+ts*.07,cy0-r-ts*.14);ctx.closePath();ctx.fill();}});
  }}
 /* ===== Subtraction Caves ===== */
 {const B='caves';let cry=tilesWith(B,['caves_crys_purple','caves_crys_blue','caves_crys_small','caves_crys_small2']);if(cry.length){const f=cry[0];cry=cry.filter(c=>Math.hypot(c.x-f.x,c.y-f.y)<=4.5).slice(0,5);}
  /* fewer than five close together: grow small crystals on free squares beside them (drawn here, not part of the scenery) */
  for(let tries=0;cry.length&&cry.length<5&&tries<40;tries++){const base=cry[tries%cry.length];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[1,1],[-1,1],[2,0],[0,-1]]){const x=base.x+dx,y=base.y+dy,t=W.T[y]&&W.T[y][x];if(t&&t.b===B&&free(t)&&!taken.has(x+','+y)&&!cry.some(c=>c.x===x&&c.y===y)){t.block=true;t.nodecor=true;taken.add(x+','+y);cry.push({x,y,k:'caves_crys_small',own:true});break;}}if(cry.length>=5)break;}
  cry.sort((a,b)=>a.x-b.x||a.y-b.y);
  const C={notes:0,last:0,sleep:0,naps:0};
  cry.forEach((c,i)=>add({id:'c_crys'+i,group:'c_crys',b:B,name:'The singing crystals',x:c.x,y:c.y,hit:[0,-.3,1,1],dur:900,n:i,C,own:c.own,still:c.own?function(ctx,X,Y,ts,now){const k=prog(this.id,now);ctx.save();if(k>=0)this.wrap(ctx,k,X,Y,ts);art(ctx,'caves_crys_small',X,Y,ts);ctx.restore();}:null,
   fire(now){const n=performance.now();if(n<C.sleep){this.dur=700;snd('snore');return;}this.dur=900;if(n-C.last>6000)C.notes=0;C.last=n;C.notes++;snd('note',this.n);
    if(C.notes>=30){C.notes=0;C.naps++;C.sleep=n+(C.naps>=3?60000:20000);setTimeout(()=>snd('snore'),900);}},
   wrap(ctx,k,sx,sy,ts){const s=1+Math.sin(k*Math.PI)*.12*(1-k);ctx.translate(sx+ts/2,sy+ts*.98);ctx.scale(1/s,s);ctx.translate(-(sx+ts/2),-(sy+ts*.98));},
   fx(ctx,k,X,Y,ts){if(performance.now()<C.sleep)return;const g=ctx.createRadialGradient(X+ts/2,Y+ts*.45,0,X+ts/2,Y+ts*.45,ts*.7);g.addColorStop(0,`rgba(255,255,255,${.55*(1-k)})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(X-ts*.3,Y-ts*.3,ts*1.6,ts*1.5);
    ctx.fillStyle=`rgba(255,255,255,${1-k})`;ctx.font=`${Math.round(ts*.32)}px sans-serif`;ctx.textAlign='center';ctx.fillText('♪',X+ts*.5+Math.sin(k*6)*ts*.15,Y-ts*.1-k*ts*.6);}}));
  /* while the crystals snooze: a Zzz over each of them */
  LIVE.push({id:'zzz',b:B,draw(ctx,cx,cy,ts,now,items){const left=C.sleep-now;if(left<=0)return;cry.forEach((c,i)=>items.push({y:c.y+.5,draw:()=>{const X=c.x*ts-cx,Y=c.y*ts-cy;ctx.fillStyle='rgba(59,42,30,.18)';ctx.fillRect(0,0,0,0);
   const p=((now/1600)+i*.3)%1;ctx.fillStyle=`rgba(255,255,255,${.9-p*.7})`;ctx.strokeStyle='rgba(59,42,30,.6)';ctx.lineWidth=2;ctx.font=`800 ${Math.round(ts*(.2+p*.12))}px Fredoka,system-ui,sans-serif`;ctx.textAlign='center';
   const zx=X+ts*.7+p*ts*.25,zy=Y-ts*.2-p*ts*.5;ctx.strokeText('z',zx,zy);ctx.fillText('z',zx,zy);}}));}});
  const cart=tilesWith(B,['caves_cart'])[0];
  if(cart)add({id:'c_cart',b:B,name:'The mine cart',x:cart.x,y:cart.y,hit:[-.1,-.1,1.1,1],dur:2600,fire(){snd('cart');},
   wrap(ctx,k,sx,sy,ts){const d=Math.sin(ease(k)*Math.PI)*ts*.7;ctx.translate(d,0);},
   fx(ctx,k,X,Y,ts){/* little track under the wheels while it rolls */ctx.strokeStyle=`rgba(95,102,109,${Math.sin(k*Math.PI)})`;ctx.lineWidth=Math.max(2,ts*.05);ctx.beginPath();ctx.moveTo(X-ts*.1,Y+ts*.97);ctx.lineTo(X+ts*1.85,Y+ts*.97);ctx.stroke();}});
  const bo=tilesWith(B,['caves_boulder','caves_rocks','caves_stalags'])[0];
  if(bo)add({id:'c_fossil',b:B,hidden:true,name:'The fossil in the rock',x:bo.x,y:bo.y,hit:[0,-.3,1,1],dur:3000,fire(){snd('dance');},
   still(ctx,X,Y,ts){fossilMark(ctx,X+ts*.5,Y+ts*.55,ts);},
   fx(ctx,k,X,Y,ts,now){const out=k<.15?k/.15:k>.85?(1-k)/.15:1;dino(ctx,X+ts*.5+out*ts*.1,Y+ts*.85+out*ts*.35,ts*1.25,k,out);}});
  /* the mole (living thing): pops up from a hole, looks around, ducks, comes up somewhere else */
  const holes=[];for(let i=0;i<4;i++){const s=freeSpot(B,1.5+i,4+i,1,new Set([...taken,...holes.map(h=>h.x+','+h.y)]),false);if(s)holes.push(s);}
  if(holes.length)LIVE.push({id:'mole',b:B,draw(ctx,cx,cy,ts,now,items){const T=9000,c=Math.floor(now/T),k=(now%T)/T,h=holes[c%holes.length];if(ST.calm){/* calm: the mole just sits half up */const H=holes[0];items.push({y:H.y+.4,draw:()=>mole(ctx,H.x*ts-cx+ts/2,H.y*ts-cy+ts*.75,ts,.6,0)});return;}
   let up=0,look=0;if(k<.1)up=0;else if(k<.2)up=(k-.1)/.1;else if(k<.62){up=1;look=Math.sin((k-.2)/.42*Math.PI*2);}else if(k<.72)up=1-(k-.62)/.1;
   items.push({y:h.y+.4,draw:()=>mole(ctx,h.x*ts-cx+ts/2,h.y*ts-cy+ts*.75,ts,up,look)});}});
 }
 /* ===== Division Castle ===== */
 {const B='castle',cat=tilesWith(B,['catapult'])[0],balls=tilesWith(B,['balls'])[0];
  if(cat)add({id:'k_cat',b:B,name:'The catapult',x:cat.x,y:cat.y,hit:[-.1,-.2,1.1,1],dur:3000,tx:cat.x+2,ty:cat.y+1,fire(){snd('split');},
   wrap(ctx,k,sx,sy,ts){const r=k<.12?-k/.12*.12:k<.3?-.12+(k-.12)/.18*.2:k<.45?.08*(1-(k-.3)/.15):0;ctx.translate(sx+ts*.5,sy+ts*.95);ctx.rotate(r);ctx.translate(-(sx+ts*.5),-(sy+ts*.95));},
   fx(ctx,k,X,Y,ts){const x0=X+ts*.25,y0=Y+ts*.2,x1=X+(this.tx-this.x)*ts+ts*.5,y1=Y+(this.ty-this.y)*ts+ts*.75;if(k<.15)return;const p=cl((k-.15)/.5,0,1),px=x0+(x1-x0)*p,py=y0+(y1-y0)*p-Math.sin(p*Math.PI)*ts*1.1;
    if(p<.55)ball(ctx,px,py,ts*.14);else{const q=(p-.55)/.45;[-1,0,1].forEach(i=>{const ex=x1+i*ts*.42,ey=y1,bx=px+(ex-px)*q*0+i*ts*.42*q,by=py;ball(ctx,bx,by,ts*.09);});}
    if(k>.65){const a=k>.88?(1-k)/.12:1;ctx.globalAlpha=a;[-1,0,1].forEach(i=>{const ex=x1+i*ts*.42;pile(ctx,ex,y1+ts*.05,ts);});ctx.globalAlpha=1;}}});
  const kn=tilesWith(B,['knight'])[0];
  if(kn)add({id:'k_knight',b:B,name:'The knight statue',x:kn.x,y:kn.y,hit:[0,-.4,1,1],dur:2000,fire(){snd('creak');},
   fx(ctx,k,X,Y,ts){const o=k<.2?k/.2:k>.8?(1-k)/.2:1,hx=X+ts*.5,hy=Y+ts*.15;
    /* the visor lifts: two eyes peek out, one winks */ctx.fillStyle='#1d1d1d';rrect(ctx,hx-ts*.11,hy-ts*.02,ts*.22,ts*.09,ts*.03);ctx.globalAlpha=o;ctx.fill();
    ctx.fillStyle='#fff';const wink=k>.4&&k<.6;ctx.beginPath();ctx.arc(hx-ts*.05,hy+ts*.025,ts*.025,0,7);ctx.fill();if(wink){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx+ts*.025,hy+ts*.025);ctx.lineTo(hx+ts*.075,hy+ts*.025);ctx.stroke();}else{ctx.beginPath();ctx.arc(hx+ts*.05,hy+ts*.025,ts*.025,0,7);ctx.fill();}
    ctx.fillStyle='#adb5bd';ctx.strokeStyle=OL;ctx.lineWidth=lw(ts)*.7;rrect(ctx,hx-ts*.12,hy-ts*.04-o*ts*.14,ts*.24,ts*.08,ts*.03);ctx.fill();ctx.stroke();ctx.globalAlpha=1;}});
  const tw=tilesWith(B,['ctower'])[0];
  if(tw)add({id:'k_shield',swap:true,b:B,hidden:true,name:'The shield on the tower',x:tw.x,y:tw.y,hit:[0,-.6,1,1],dur:1600,fire(){snd('clang');},
   still(ctx,X,Y,ts){shield(ctx,X+ts*.5,Y+ts*.35,ts,1);},
   fx(ctx,k,X,Y,ts){shield(ctx,X+ts*.5,Y+ts*.35,ts,Math.cos(ease(k)*Math.PI*6));}});
  /* the two soldiers (living thing, owner Oct 2026): each behind a little wall with a tiny catapult, lobbing bombs at each other for
     years. The bombs never land on anyone; one calls, the other answers. Nothing to tap: the pet explains as you walk by. */
  let duel=null;for(let d=5;d>=3&&!duel;d--){const C=BIOMES[B].c,c=[];for(let y=C[1]-4;y<=C[1]+6;y++)for(let x=C[0]-7;x<=C[0]+7-d;x++){const ok=i=>{const t=W.T[y]&&W.T[y][x+i];return t&&t.b===B&&free(t)&&!taken.has((x+i)+','+y);};
    if(!ok(0)||!ok(d))continue;let open=0;for(let i=1;i<d;i++)if(ok(i))open++;if(open<d-1)continue; /* nothing standing between them (owner) */
    /* a free square behind each of them, inside the castle grounds, so neither is backed up against the wall (owner) */
    /* two squares of open castle ground behind each of them (a path is fine), so neither is backed up against the wall (owner) */
    const gr=i=>{const t=W.T[y]&&W.T[y][x+i];return t&&t.b===B&&!t.block&&!t.water&&!t.gate;};if(!gr(-1)||!gr(-2)||!gr(d+1)||!gr(d+2))continue;
    try{if(wWall(x-2,y,x-1,y)||wWall(x-1,y,x,y)||wWall(x+d,y,x+d+1,y)||wWall(x+d+1,y,x+d+2,y))continue;}catch(e){}
    let tall=false;for(let i=-1;i<=d+1;i++)for(const yy of [y-1,y+1]){const t=W.T[yy]&&W.T[yy][x+i];if(t&&t.o&&!t.deco&&t.b===B&&yy===y+1)tall=true;}if(tall)continue; /* no tower or wall right in front of them either */if(y<=C[1]+1&&y>=C[1]-3&&x+d>=C[0]-2&&x<=C[0]+2)continue;c.push({x,y,d,s:Math.abs(y-C[1]-2.5)+Math.abs(x+d/2-C[0])*.5});}
   c.sort((p,q)=>p.s-q.s);duel=c[0]||null;}
  if(duel){[0,duel.d].forEach(i=>{const t=W.T[duel.y][duel.x+i];t.block=true;t.nodecor=true;taken.add((duel.x+i)+','+duel.y);});
   const LINES=[['Fire!','Missed!'],['Take THAT!','Nope!'],['Seven times eight!','Fifty-six! And MISSED!'],['Divide and conquer!','You divided by zero!'],['Here comes a big one!','Still missed!'],['Ready... aim...','You forgot to aim!'],
    ['I\'m better at math!','Then why\'d you miss?'],['Bombs away!','Bombs... a-STRAY!'],['Half a bomb for you!','That\'s a fraction of a miss!'],['One... two... THREE!','Three misses!'],['Remainder ONE!','Remainder MISSED!'],['Bet you can\'t count this!','That\'s zero hits!'],
    ['Surrender!','Never! Lunch first!'],['This one has a bow on it!','Return to sender!'],['Take a number!','Is it a big number?']];
   const PET=['These two? They\'ve been at it for years. Something about who\'s better at math...','Don\'t worry. They\'ve never hit anything. Ever.','Last week they argued about whether zero is even. It is.','I think they forgot what they\'re fighting about.','Same time every day. You could set a clock by them.'];
   const D={said:-1e9,lastNear:false,line:-1};
   LIVE.push({id:'duel',b:B,D,draw(ctx,cx,cy,ts,now,items){const T=6200,cyc=Math.floor(now/T),k=(now%T)/T,shooter=cyc%2,L=LINES[(cyc*7)%LINES.length],
     lx=duel.x*ts-cx,rx=(duel.x+duel.d)*ts-cx,Yb=duel.y*ts-cy,still=ST.calm;
     const sx=shooter?rx:lx,tx=shooter?lx:rx,dir=shooter?-1:1;
     /* the miss: short of the wall, or sailing over and landing behind them */const long=(cyc*13)%3===0,land=long?tx+dir*ts*1.1:sx+(tx-sx)*(.45+((cyc*5)%3)*.08);
     const crouch=i=>!still&&i!==shooter&&k>.32&&k<.66;
     [0,1].forEach(i=>{const X=i?rx:lx,face=i?-1:1;items.push({y:duel.y+.04,draw:()=>soldier(ctx,X+ts/2,Yb+ts*.95,ts,face,i,crouch(i)?1:0,!still&&i===shooter&&k>.18&&k<.3?1:0,now)});});
     if(still)return;
     /* the bomb */if(k>.22&&k<.62){const p=(k-.22)/.4,bx=sx+ts/2+(land-(sx+ts/2)+ts/2)*p,by=Yb+ts*.45+(ts*.5)*p-Math.sin(p*Math.PI)*ts*1.6;items.push({y:duel.y+.5,draw:()=>bomb(ctx,bx,by,ts,now)});}
     if(k>=.62&&k<.8){const p=(k-.62)/.18;items.push({y:duel.y+.5,draw:()=>poof(ctx,land+ts/2,Yb+ts*.9,ts,p)});}
     /* call and answer */if(k<.42)items.push({y:1e6-5,draw:()=>talk(ctx,sx+ts/2,Yb-ts*.15,L[0],ts)});
     if(k>.66&&k<.98)items.push({y:1e6-5,draw:()=>talk(ctx,tx+ts/2,Yb-ts*.15,L[1],ts)});
     /* the pet explains, once per visit, when you first come near */
     const close=near(duel.x+duel.d/2|0,duel.y,4)&&W.T[W.hy][W.hx].b===B; /* only while you are in the castle grounds (owner) */if(close&&!D.lastNear&&now-D.said>20000){D.said=now;D.line=(D.line+1)%PET.length;}D.lastNear=close;
     if(now-D.said<4200&&window.PetPuppet){try{const P=PetPuppet.state();if(P&&!P.under&&P.x!==undefined){const px=(P.x+.5)*ts-cx,py=(P.y+.9-(P.alt||0))*ts-cy-ts*.62;items.push({y:1e6-4,draw:()=>talk(ctx,px,py,PET[D.line],ts,true)});}}catch(e){}}}});}
 }
 /* ===== Addition Forest ===== */
 {const B='forest',G=Object.entries(W.T).length&&(()=>{for(let y=0;y<WROWS;y++)for(let x=0;x<WCOLS;x++)if(W.T[y][x].gate==='forest'||(W.T[y][x].gate&&W.T[y][x].b===B))return [x,y];return BIOMES[B].c;})();
  /* tap the treehouse cabin (not its door, which still takes you in) to knock: an owl rises from behind the roof, blinks slowly, ducks back */
  {const gx=G[0],gy=G[1];add({id:'f_owl',b:B,name:'The owl in the treehouse',x:gx,y:gy,range:3,hit:[-.15,-.8,1.15,-.06],dur:3200,fire(){snd('knock');},
   fx(ctx,k,X,Y,ts){/* out of the round window under the roof */const up=k<.15?ease(k/.15):k>.85?ease((1-k)/.15):1,blink=(k>.4&&k<.5)||(k>.62&&k<.72),wx=X+ts*.5,wy=Y-ts*.432;
    ctx.fillStyle='#2b201c';ctx.beginPath();ctx.arc(wx,wy,ts*.12,0,7);ctx.fill();if(up>.05)owl(ctx,wx,wy-up*ts*.1,ts*(.35+up*.65),blink,k);},fxY:.2});}
  /* every mushroom boings */
  tilesWith(B,['toad','brown']).forEach((m,i)=>add({id:'f_mush'+i,group:'f_mush',b:B,name:'The bouncy mushrooms',x:m.x,y:m.y,hit:[-.1,-.1,1.1,1.1],dur:900,fire(){snd('boing');},
   wrap(ctx,k,sx,sy,ts){const q=Math.sin(k*Math.PI*3)*(1-k),sx2=1+q*.25,sy2=1-q*.3;ctx.translate(sx+ts/2,sy+ts*.98);ctx.scale(sx2,sy2);ctx.translate(-(sx+ts/2),-(sy+ts*.98));}}));
  /* the knothole high in the old oak (hidden): a squirrel pops out with an acorn */
  const oak=tilesWith(B,['oak'])[0];
  if(oak)add({id:'f_squirrel',b:B,hidden:true,name:'The squirrel in the old oak',x:oak.x,y:oak.y,hit:[0,-.5,1,1],dur:2800,fire(){snd('chatter');},
   after(ctx,k,sx,sy,ts,now){const hx=sx+ts*.5,hy=sy+ts*.5;knot(ctx,hx,hy,ts);if(k>=0){const o=k<.2?ease(k/.2):k>.8?ease((1-k)/.2):1;squirrel(ctx,hx,hy,ts,o,k);}}});
  /* the rabbit family (living thing): one, then two, then three hop out of the burrow, sit together, then all hop back in */
  const bur=freeSpot(B,2.5,4.5,1,taken,false);
  if(bur){const t=W.T[bur.y][bur.x];t.block=true;t.nodecor=true;taken.add(bur.x+','+bur.y);
   const seats=[[.95,.15],[1.55,-.05],[1.25,.45]].map(([dx,dy])=>{const side=(W.T[bur.y][bur.x+1]&&!W.T[bur.y][bur.x+1].block)?1:-1;return [dx*side,dy];});
   LIVE.push({id:'rabbits',b:B,draw(ctx,cx,cy,ts,now,items){const X=bur.x*ts-cx,Y=bur.y*ts-cy;items.push({y:bur.y+.3,draw:()=>burrow(ctx,X+ts/2,Y+ts*.8,ts)});
    if(ST.calm){items.push({y:bur.y+.4,draw:()=>bunny(ctx,X+ts/2+seats[0][0]*ts,Y+ts*.85+seats[0][1]*ts,ts,0,now,0,seats[0][0]<0)});return;}
    const T=15000,t=(now%T)/1000;
    seats.forEach((st,i)=>{const outAt=1+i*2.6,inAt=10+i*.7;let p=0,hop=0;if(t>=outAt&&t<outAt+.7){p=(t-outAt)/.7;hop=Math.sin(p*Math.PI);}else if(t>=outAt+.7&&t<inAt)p=1;else if(t>=inAt&&t<inAt+.7){p=1-(t-inAt)/.7;hop=Math.sin((t-inAt)/.7*Math.PI);}else return;
     const bx=X+ts/2+st[0]*ts*p,by=Y+ts*.85+st[1]*ts*p-hop*ts*.28;items.push({y:bur.y+.35+st[1]*p,draw:()=>bunny(ctx,bx,by,ts,hop,now+i*700,i,st[0]<0?p<1&&t>=inAt?false:true:p<1&&t>=inAt?true:false)});});}});}
 }
 /* ===== the dragon egg by the volcano ===== */
 {const egg=tilesWith('volcano',['volcano_egg'])[0];
  if(egg)add({id:'d_egg',b:'volcano',name:'The dragon egg',x:egg.x,y:egg.y,range:5,hit:[0,-.3,1,1],dur:1300,fire(){snd('egg');},
   wrap(ctx,k,sx,sy,ts){const a=Math.sin(k*Math.PI*5)*.14*(1-k);ctx.translate(sx+ts*.5,sy+ts*.97);ctx.rotate(a);ctx.translate(-(sx+ts*.5),-(sy+ts*.97));},
   after(ctx,k,sx,sy,ts,now){cracks(ctx,sx+ts*.5,sy+ts*.97,ts,ST.wins,now);}});}
 BUILT=W;}

const ARTI={};function art(c,k,X,Y,ts){try{let i=ARTI[k];if(!i){i=ARTI[k]=new Image();i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(MQ_DECOR.ART[k]);}if(!i.complete||!i.naturalWidth)return;const [w,h]=MQ_DECOR.SZ[k];c.drawImage(i,X+ts/2-w*ts/2,Y+ts*.98-h*ts,w*ts,h*ts);}catch(e){}}
/* ---------- drawings (same style as the drawn scenery: bold dark outline, flat colours) ---------- */
function coin(c,x,y,r,spin){c.save();c.translate(x,y);c.scale(Math.max(.15,Math.abs(Math.cos(spin))),1);c.fillStyle='#ffd43b';c.strokeStyle='#a87b00';c.lineWidth=Math.max(1.2,r*.25);c.beginPath();c.arc(0,0,r,0,7);c.fill();c.stroke();c.restore();}
function coinPost(c,x,y,ts){c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(x,y,ts*.22,ts*.06,0,0,7);c.fill();c.fillStyle='#8d99ae';c.strokeStyle=OL;c.lineWidth=lw(ts);c.fillRect(x-ts*.05,y-ts*.42,ts*.1,ts*.42);c.strokeRect(x-ts*.05,y-ts*.42,ts*.1,ts*.42);
 rrect(c,x-ts*.17,y-ts*.72,ts*.34,ts*.32,ts*.06);c.fillStyle='#4dabf7';c.fill();c.stroke();c.fillStyle='#1c3d5a';c.fillRect(x-ts*.08,y-ts*.62,ts*.16,ts*.035);coin(c,x,y-ts*.5,ts*.05,0);}
function pigeon(c,x,y,ts,flap,now){const s=ts*.28;c.save();c.translate(x,y);c.fillStyle='#adb5bd';c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;
 c.beginPath();c.ellipse(0,-s*.45,s*.5,s*.36,0,0,7);c.fill();c.stroke();c.fillStyle='#868e96';c.beginPath();c.arc(s*.38,-s*.82,s*.24,0,7);c.fill();c.stroke();
 c.fillStyle='#63e6be';c.beginPath();c.arc(s*.28,-s*.6,s*.12,0,7);c.fill();c.fillStyle=OL;c.beginPath();c.arc(s*.45,-s*.86,s*.05,0,7);c.fill();c.fillStyle='#ffa94d';c.beginPath();c.moveTo(s*.6,-s*.82);c.lineTo(s*.78,-s*.76);c.lineTo(s*.6,-s*.72);c.fill();
 const wa=flap?Math.sin(now/45)*.9:0;c.fillStyle='#ced4da';c.save();c.translate(-s*.05,-s*.55);c.rotate(-wa);c.beginPath();c.ellipse(-s*.2,0,s*.35,s*.15,-.2,0,7);c.fill();c.stroke();c.restore();
 if(!flap){c.strokeStyle='#e8590c';c.lineWidth=1.5;c.beginPath();c.moveTo(-s*.1,-s*.1);c.lineTo(-s*.1,0);c.moveTo(s*.1,-s*.1);c.lineTo(s*.1,0);c.stroke();}c.restore();}
function cuckoo(c,x,y,s,wing,t){c.save();c.translate(x,y);c.fillStyle='#ffd43b';c.strokeStyle=OL;c.lineWidth=Math.max(1,s*.12);c.beginPath();c.arc(0,0,s*.55,0,7);c.fill();c.stroke();
 c.fillStyle=OL;c.beginPath();c.arc(s*.18,-s*.12,s*.09,0,7);c.fill();c.fillStyle='#ff922b';c.beginPath();c.moveTo(s*.45,-s*.05);c.lineTo(s*.8,s*.05);c.lineTo(s*.45,s*.15);c.fill();
 c.fillStyle='#fab005';c.save();c.rotate(-.4-wing*.5);c.beginPath();c.ellipse(-s*.35,s*.05,s*.35,s*.16,0,0,7);c.fill();c.stroke();c.restore();c.restore();}
const BEDC=[['#ff6b6b','#c92a2a'],['#ffd43b','#e67700'],['#748ffc','#3b5bdb'],['#f783ac','#c2255c']];
function bedH(G,i){const d=new Date(),hrs=cl((d.getHours()+d.getMinutes()/60-7)/12,0,1),base=[.55,.8,.4,.65][i],w=(ST.water[today()]||[0,0,0,0])[i]||0;return cl(2+Math.round(hrs*base*5)+w,1,7);}
const tallest=G=>{let b=0;for(let i=1;i<4;i++)if(bedH(G,i)>bedH(G,b))b=i;return b;};
function bedTop(G,i,Y,ts){return Y+ts*.72-bedH(G,i)*ts*.2;}
function bedsDraw(c,G,X,Y,ts,now){const w=ts*2,bw=w/4;c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(X+ts,Y+ts*.93,ts*1.02,ts*.1,0,0,7);c.fill();
 /* the wooden planter */c.fillStyle='#8a5a2b';c.strokeStyle=OL;c.lineWidth=lw(ts);rrect(c,X+ts*.02,Y+ts*.64,w-ts*.04,ts*.32,ts*.06);c.fill();c.stroke();c.fillStyle='#6b4423';for(let i=1;i<4;i++)c.fillRect(X+i*bw-1,Y+ts*.7,2,ts*.22);
 const wave=G.wave&&now>G.wave.t&&now-G.wave.t<1600?G.wave:null;
 for(let i=0;i<4;i++){const h=bedH(G,i),x0=X+i*bw+bw*.18,ww=bw*.64,top=bedTop(G,i,Y,ts);const sk=wave&&wave.bed===i?Math.sin((now-wave.t)/90)*.12:0;
  c.save();c.translate(x0+ww/2,Y+ts*.7);c.transform(1,0,sk,1,0,0);c.translate(-(x0+ww/2),-(Y+ts*.7));
  c.fillStyle='#51cf66';c.strokeStyle=OL;c.lineWidth=lw(ts)*.6;c.fillRect(x0+ww*.44,top+ts*.08,ww*.12,Y+ts*.7-top-ts*.08);c.strokeRect(x0+ww*.44,top+ts*.08,ww*.12,Y+ts*.7-top-ts*.08);
  /* flowers up the stem: one per step, so the beds read as bars */
  for(let j=0;j<h;j++){const fy=Y+ts*.6-j*ts*.2,fx=x0+ww/2+(j%2?ww*.2:-ww*.2);c.fillStyle=BEDC[i][0];c.lineWidth=lw(ts)*.6;for(let p=0;p<5;p++){const a=p*Math.PI*2/5;c.beginPath();c.arc(fx+Math.cos(a)*ts*.05,fy+Math.sin(a)*ts*.05,ts*.045,0,7);c.fill();c.stroke();}c.fillStyle='#ffd43b';c.beginPath();c.arc(fx,fy,ts*.035,0,7);c.fill();c.stroke();}
  c.restore();}
 /* the settled bees (only their wings move); after a watering they fly to the tallest bed. The little flag beside each bed counts them. */
 const tb=tallest(G);G.bees.forEach((b,n)=>{if(b.fly&&now-b.fly.t>1600){b.bed=b.fly.to;b.fly=null;}const slot=G.bees.filter((q,m)=>m<n&&(q.fly?q.fly.to:q.bed)===(b.fly?b.fly.to:b.bed)).length;
  const at=i=>[X+i*bw+bw*.5+(slot%2?bw*.22:-bw*.22),bedTop(G,i,Y,ts)-ts*.02-Math.floor(slot/2)*ts*.12];let [bx,by]=at(b.bed);
  if(b.fly){const k=cl((now-b.fly.t-n*90)/1300,0,1),[ex,ey]=at(b.fly.to),[sx0,sy0]=at(b.fly.from);bx=sx0+(ex-sx0)*ease(k)+Math.sin(k*9+n)*ts*.12;by=sy0+(ey-sy0)*ease(k)-Math.sin(k*Math.PI)*ts*.6;}
  bee(c,bx,by-ts*.06,ts,ST.calm?0:now+b.ph*300);});
 for(let i=0;i<4;i++){const n=G.bees.filter(b=>!b.fly&&b.bed===i).length;if(!G.flags)continue;const fx=X+i*bw+bw*.9,fy=Y+ts*.64;c.strokeStyle=OL;c.lineWidth=1.5;c.beginPath();c.moveTo(fx,fy);c.lineTo(fx,fy-ts*.38);c.stroke();
  c.fillStyle='#fff';rrect(c,fx,fy-ts*.38,ts*.2,ts*.17,ts*.03);c.fill();c.stroke();c.fillStyle=OL;c.font=`800 ${Math.round(ts*.14)}px Fredoka,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),fx+ts*.1,fy-ts*.29);}
 /* picking a bed after tapping the watering can: a drop over each bed */
 if(PICK&&PICK.G===G){const a=.6+.4*Math.sin(now/200);for(let i=0;i<4;i++){const px=X+i*bw+bw*.5,py=bedTop(G,i,Y,ts)-ts*.32;c.globalAlpha=a;c.fillStyle='#4dabf7';c.strokeStyle=OL;c.lineWidth=1.5;c.beginPath();c.moveTo(px,py-ts*.12);c.quadraticCurveTo(px+ts*.1,py,px,py+ts*.06);c.quadraticCurveTo(px-ts*.1,py,px,py-ts*.12);c.fill();c.stroke();c.globalAlpha=1;}}
 if(G.rain&&now-G.rain.t<1400){const k=(now-G.rain.t)/1400,i=G.rain.bed,px=X+i*bw+bw*.5,top=bedTop(G,i,Y,ts)-ts*.55;c.globalAlpha=Math.sin(k*Math.PI);c.fillStyle='#e7f5ff';c.strokeStyle=OL;c.lineWidth=1.5;c.beginPath();c.arc(px-ts*.08,top,ts*.1,0,7);c.arc(px+ts*.08,top,ts*.12,0,7);c.fill();c.stroke();
  c.fillStyle='#4dabf7';for(let j=0;j<5;j++){const p=(k*3+j/5)%1;c.fillRect(px-ts*.12+j*ts*.06,top+ts*.1+p*ts*.3,2,ts*.06);}c.globalAlpha=1;}}
function bee(c,x,y,ts,now){const s=ts*.12;c.save();c.translate(x,y);const f=now?Math.abs(Math.sin(now/35)):.5;c.fillStyle='rgba(255,255,255,.85)';c.strokeStyle=OL;c.lineWidth=1;
 c.beginPath();c.ellipse(-s*.2,-s*.8,s*.45,s*.3*(.4+f*.6),-.5,0,7);c.fill();c.stroke();c.beginPath();c.ellipse(s*.3,-s*.8,s*.45,s*.3*(.4+f*.6),.5,0,7);c.fill();c.stroke();
 c.fillStyle='#ffd43b';c.beginPath();c.ellipse(0,0,s*.8,s*.55,0,0,7);c.fill();c.stroke();c.fillStyle=OL;c.fillRect(-s*.15,-s*.5,s*.22,s);c.fillRect(-s*.55,-s*.4,s*.18,s*.8);c.restore();}
function gnome(c,x,y,ts,k,ruler){const s=ts;c.save();const cheer=ruler&&k>.5;c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(x,y,s*.18,s*.05,0,0,7);c.fill();c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;
 c.fillStyle='#4263eb';rrect(c,x-s*.13,y-s*.32,s*.26,s*.3,s*.08);c.fill();c.stroke();
 c.fillStyle='#fff';c.beginPath();c.moveTo(x-s*.12,y-s*.3);c.quadraticCurveTo(x,y-s*.08,x+s*.12,y-s*.3);c.lineTo(x+s*.1,y-s*.4);c.lineTo(x-s*.1,y-s*.4);c.closePath();c.fill();c.stroke();
 c.fillStyle='#ffd8a8';c.beginPath();c.arc(x,y-s*.44,s*.09,0,7);c.fill();c.stroke();c.fillStyle='#ff8787';c.beginPath();c.arc(x,y-s*.42,s*.035,0,7);c.fill();
 c.fillStyle='#e03131';c.beginPath();c.moveTo(x-s*.11,y-s*.5);c.lineTo(x+s*.11,y-s*.5);c.lineTo(x+(cheer?s*.06:s*.02),y-s*.82);c.closePath();c.fill();c.stroke();
 if(ruler){/* a ruler held up beside the tallest bed */const rx=ruler.x,top=ruler.top,bot=y-s*.08,a=cl(k*3,0,1);c.globalAlpha=a;c.fillStyle='#ffe066';c.fillRect(rx-s*.04,top,s*.08,bot-top);c.strokeRect(rx-s*.04,top,s*.08,bot-top);c.fillStyle=OL;for(let yy=bot-s*.13;yy>top;yy-=s*.13)c.fillRect(rx-s*.04,yy,s*.05,1.5);c.globalAlpha=1;
  if(cheer){c.fillStyle='#fab005';c.font=`${Math.round(s*.25)}px sans-serif`;c.textAlign='center';c.fillText('★',x+s*.2,y-s*.8-Math.sin(k*20)*s*.05);}}
 c.restore();}
function mole(c,x,y,ts,up,look){const s=ts;c.fillStyle='#5c4033';c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;c.beginPath();c.ellipse(x,y,s*.3,s*.1,0,0,7);c.fill();c.stroke();
 c.fillStyle='#2b1d14';c.beginPath();c.ellipse(x,y-s*.01,s*.2,s*.06,0,0,7);c.fill();if(up<=0)return;
 c.save();c.beginPath();c.rect(x-s*.4,y-s*.8,s*.8,s*.8);c.clip();const h=up*s*.42,bx=x+look*s*.03;c.fillStyle='#6b5a52';c.beginPath();c.ellipse(bx,y-h+s*.2,s*.16,s*.22,0,0,7);c.fill();c.stroke();
 c.fillStyle='#f8a5c2';c.beginPath();c.ellipse(bx+look*s*.06,y-h+s*.14,s*.06,s*.045,0,0,7);c.fill();c.stroke();c.fillStyle=OL;[-1,1].forEach(e=>{c.beginPath();c.arc(bx+e*s*.06+look*s*.04,y-h+s*.06,s*.018,0,7);c.fill();});
 c.fillStyle='#f3d9fa';[-1,1].forEach(e=>{c.beginPath();c.ellipse(bx+e*s*.13,y-h+s*.32,s*.05,s*.03,0,0,7);c.fill();c.stroke();});c.restore();
 c.fillStyle='#5c4033';c.beginPath();c.ellipse(x,y+s*.02,s*.3,s*.06,0,0,Math.PI);c.fill();}
function fossilMark(c,x,y,ts){c.save();c.globalAlpha=.55;c.strokeStyle='#f1f3f5';c.lineWidth=Math.max(1.2,ts*.025);c.lineCap='round';const s=ts*.16;
 c.beginPath();c.moveTo(x-s,y);c.lineTo(x+s,y);for(let i=-2;i<=2;i++){c.moveTo(x+i*s*.4,y-s*.25);c.lineTo(x+i*s*.4,y+s*.25);}c.stroke();c.beginPath();c.arc(x+s*1.2,y-s*.15,s*.25,0,7);c.stroke();c.restore();}
function dino(c,x,y,ts,k,o){const s=ts*.75,b=Math.sin(k*Math.PI*8)*.5,tilt=Math.sin(k*Math.PI*4)*.18*o;c.save();c.globalAlpha=o;c.translate(x,y);c.rotate(tilt);c.translate(0,-Math.abs(b)*s*.08);c.strokeStyle='#495057';c.fillStyle='#f8f9fa';c.lineWidth=Math.max(1.5,ts*.03);c.lineCap='round';
 /* a cartoon fossil dino: bone body, smiling skull, little bone legs that dance */
 c.beginPath();c.moveTo(-s*.45,-s*.25);c.quadraticCurveTo(-s*.1,-s*.5,s*.25,-s*.35);c.stroke();for(let i=0;i<5;i++){const t=i/4,px=-s*.4+t*s*.6,py=-s*.28-Math.sin(t*Math.PI)*s*.13;c.beginPath();c.moveTo(px,py-s*.08);c.lineTo(px,py+s*.08);c.stroke();}
 c.beginPath();c.moveTo(-s*.45,-s*.25);c.lineTo(-s*.62,-s*.15+Math.sin(k*30)*s*.05);c.stroke();
 c.beginPath();c.ellipse(s*.38,-s*.45,s*.17,s*.12,0,0,7);c.fill();c.stroke();c.fillStyle='#343a40';c.beginPath();c.arc(s*.42,-s*.48,s*.03,0,7);c.fill();c.strokeStyle='#495057';c.beginPath();c.arc(s*.4,-s*.42,s*.07,.2,Math.PI-.4);c.stroke();
 [[-s*.25,1],[s*.08,-1]].forEach(([lx,ph])=>{const sw=Math.sin(k*Math.PI*8+ph)*s*.08;c.beginPath();c.moveTo(lx,-s*.3);c.lineTo(lx+sw,-s*.02);c.lineTo(lx+sw+s*.06,0);c.stroke();});c.restore();}
function ball(c,x,y,r){c.fillStyle='#495057';c.strokeStyle=OL;c.lineWidth=Math.max(1.2,r*.25);c.beginPath();c.arc(x,y,r,0,7);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.arc(x-r*.35,y-r*.35,r*.3,0,7);c.fill();}
function pile(c,x,y,ts){const r=ts*.07;[[-1,0],[1,0],[0,-1.6]].forEach(([i,j])=>ball(c,x+i*r,y+j*r*.9,r));}
function shield(c,x,y,ts,sc){c.save();c.translate(x,y);c.scale(sc,1);const s=ts*.2;c.fillStyle=sc>0?'#f03e3e':'#adb5bd';c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;c.beginPath();c.moveTo(-s,-s);c.lineTo(s,-s);c.lineTo(s,0);c.quadraticCurveTo(s*.8,s*.9,0,s*1.25);c.quadraticCurveTo(-s*.8,s*.9,-s,0);c.closePath();c.fill();c.stroke();
 if(sc>0){c.fillStyle='#ffd43b';c.fillRect(-s*.15,-s*.85,s*.3,s*1.8);c.fillRect(-s*.7,-s*.35,s*1.4,s*.3);}c.restore();}
function guard(c,x,y,ts,now,walking,face,sal){const s=ts,ph=walking?now/130:0;c.save();c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x,y,s*.18,s*.05,0,0,7);c.fill();c.translate(x,y);c.scale(face<0?-1:1,1);c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;
 const bob=walking?Math.abs(Math.sin(ph))*s*.02:0;c.translate(0,-bob);
 /* legs */[-1,1].forEach(e=>{const a=walking?Math.sin(ph+(e>0?Math.PI:0))*.4:0;c.save();c.translate(e*s*.05,-s*.2);c.rotate(a);c.fillStyle='#868e96';c.fillRect(-s*.035,0,s*.07,s*.19);c.strokeRect(-s*.035,0,s*.07,s*.19);c.restore();});
 /* body: purple tabard over armour */c.fillStyle='#ced4da';rrect(c,-s*.13,-s*.46,s*.26,s*.28,s*.05);c.fill();c.stroke();c.fillStyle='#7048e8';c.fillRect(-s*.08,-s*.44,s*.16,s*.25);c.fillStyle='#ffd43b';c.fillRect(-s*.02,-s*.4,s*.04,s*.15);
 /* head with helmet and plume */c.fillStyle='#adb5bd';c.beginPath();c.arc(0,-s*.57,s*.12,0,7);c.fill();c.stroke();c.fillStyle='#1d1d1d';c.fillRect(-s*.02,-s*.6,s*.12,s*.03);
 c.fillStyle='#f03e3e';c.beginPath();c.moveTo(-s*.02,-s*.68);c.quadraticCurveTo(-s*.18,-s*.86,-s*.2,-s*.62);c.quadraticCurveTo(-s*.08,-s*.74,-s*.02,-s*.66);c.fill();c.stroke();
 /* spear in the back hand; the front arm salutes */c.strokeStyle='#8a5a2b';c.lineWidth=Math.max(1.5,ts*.03);c.beginPath();c.moveTo(-s*.15,-s*.05);c.lineTo(-s*.15,-s*.82);c.stroke();c.fillStyle='#ced4da';c.strokeStyle=OL;c.lineWidth=1.2;c.beginPath();c.moveTo(-s*.15,-s*.92);c.lineTo(-s*.11,-s*.82);c.lineTo(-s*.19,-s*.82);c.closePath();c.fill();c.stroke();
 c.save();c.translate(s*.11,-s*.42);c.rotate(-sal*2.2+(walking?Math.sin(ph)*.3:0));c.fillStyle='#ced4da';c.strokeStyle=OL;c.lineWidth=lw(ts)*.7;c.fillRect(-s*.03,0,s*.06,s*.18);c.strokeRect(-s*.03,0,s*.06,s*.18);c.restore();c.restore();}
function soldier(c,x,y,ts,face,side,crouch,pull,now){const s=ts*.82;c.save();c.translate(x,y);c.scale(face,1);c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;
 /* the tiny catapult behind him */c.save();c.translate(-s*.32,0);c.fillStyle='#8a5a2b';c.fillRect(-s*.16,-s*.1,s*.32,s*.08);c.strokeRect(-s*.16,-s*.1,s*.32,s*.08);[-1,1].forEach(e=>{c.fillStyle='#5c3a1c';c.beginPath();c.arc(e*s*.12,-s*.02,s*.05,0,7);c.fill();c.stroke();});
  c.save();c.translate(0,-s*.12);c.rotate(-.9+pull*1.6);c.fillStyle='#a0703c';c.fillRect(-s*.025,-s*.36,s*.05,s*.36);c.strokeRect(-s*.025,-s*.36,s*.05,s*.36);c.beginPath();c.arc(0,-s*.38,s*.06,0,7);c.fillStyle='#a0703c';c.fill();c.stroke();c.restore();c.restore();
 /* the soldier: red or blue tabard, round helmet with a plume */const dy=crouch*s*.22;c.translate(0,dy);
 c.fillStyle='#ced4da';rrect(c,-s*.12,-s*.42,s*.24,s*.3,s*.05);c.fill();c.stroke();c.fillStyle=side?'#4dabf7':'#ff6b6b';c.fillRect(-s*.075,-s*.4,s*.15,s*.26);
 c.fillStyle='#ffd8a8';c.beginPath();c.arc(0,-s*.53,s*.11,0,7);c.fill();c.stroke();c.fillStyle=OL;c.beginPath();c.arc(s*.05,-s*.54,s*.015,0,7);c.fill();
 c.fillStyle='#adb5bd';c.beginPath();c.arc(0,-s*.58,s*.12,Math.PI,0);c.closePath();c.fill();c.stroke();c.fillStyle=side?'#1c7ed6':'#e03131';c.beginPath();c.ellipse(-s*.04,-s*.72,s*.08,s*.04,-.4,0,7);c.fill();c.stroke();
 c.translate(0,-dy);
 /* the little wall in front of him (drawn last, so he hides behind it) */c.fillStyle='#adb5bd';c.strokeStyle=OL;rrect(c,s*.1,-s*.3,s*.26,s*.3,s*.03);c.fill();c.stroke();c.fillStyle='#868e96';c.fillRect(s*.1,-s*.16,s*.26,s*.02);c.fillRect(s*.22,-s*.3,s*.02,s*.14);c.fillRect(s*.16,-s*.15,s*.02,s*.15);
 c.restore();}
function bomb(c,x,y,ts,now){const r=ts*.1;c.fillStyle='#343a40';c.strokeStyle=OL;c.lineWidth=lw(ts)*.7;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.arc(x-r*.35,y-r*.35,r*.28,0,7);c.fill();
 c.strokeStyle='#8a5a2b';c.lineWidth=2;c.beginPath();c.moveTo(x+r*.5,y-r*.8);c.quadraticCurveTo(x+r,y-r*1.5,x+r*1.3,y-r*1.4);c.stroke();const f=Math.sin(now/40);c.fillStyle=f>0?'#ffd43b':'#ff922b';c.beginPath();c.arc(x+r*1.35,y-r*1.45,r*(.25+.1*f),0,7);c.fill();}
function poof(c,x,y,ts,p){c.save();c.globalAlpha=1-p;for(let i=0;i<6;i++){const a=i*Math.PI/3+.3,d=ts*.12+p*ts*.3;c.fillStyle=i%2?'#dee2e6':'#f1f3f5';c.beginPath();c.arc(x+Math.cos(a)*d,y-ts*.1+Math.sin(a)*d*.5-p*ts*.15,ts*(.1+p*.08),0,7);c.fill();}
 c.fillStyle='#fff';c.strokeStyle=OL;c.lineWidth=2;c.font=`800 ${Math.round(ts*.2)}px Fredoka,system-ui,sans-serif`;c.textAlign='center';c.strokeText('poof',x,y-ts*.35-p*ts*.2);c.fillText('poof',x,y-ts*.35-p*ts*.2);c.restore();}
function talk(c,x,y,txt,ts,wide){const fs=Math.round(ts*(wide?.2:.22));c.font=`700 ${fs}px Fredoka,system-ui,sans-serif`;const maxW=wide?ts*3.2:ts*2.6;const words=txt.split(' '),lines=[];let line='';
 words.forEach(w=>{const t=line?line+' '+w:w;if(c.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;});lines.push(line);const lh=fs*1.15,bw=Math.max(...lines.map(l=>c.measureText(l).width))+fs*.9,bh=lines.length*lh+fs*.5;
 let bx=x-bw/2,by=y-bh-fs*.5;if(W&&W.vw){bx=cl(bx,4,W.vw-bw-4);by=Math.max(4,by);}c.fillStyle='#fff';c.strokeStyle=OL;c.lineWidth=2;rrect(c,bx,by,bw,bh,fs*.45);c.fill();c.stroke();
 c.beginPath();c.moveTo(cl(x,bx+fs,bx+bw-fs)-fs*.3,by+bh-1);c.lineTo(cl(x,bx+fs,bx+bw-fs),by+bh+fs*.45);c.lineTo(cl(x,bx+fs,bx+bw-fs)+fs*.3,by+bh-1);c.fill();c.stroke();
 c.fillStyle='#2b2340';c.textAlign='center';c.textBaseline='middle';lines.forEach((l,i)=>c.fillText(l,bx+bw/2,by+fs*.25+lh*(i+.5)));}
function owl(c,x,y,ts,blink,k){const s=ts*.32;c.save();c.translate(x,y);c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;c.fillStyle='#a47148';c.beginPath();c.ellipse(0,0,s*.75,s*.85,0,0,7);c.fill();c.stroke();
 c.fillStyle='#e8c39e';c.beginPath();c.ellipse(0,s*.25,s*.45,s*.5,0,0,7);c.fill();c.fillStyle='#a47148';[-1,1].forEach(e=>{c.beginPath();c.moveTo(e*s*.35,-s*.6);c.lineTo(e*s*.6,-s*1.05);c.lineTo(e*s*.65,-s*.5);c.closePath();c.fill();c.stroke();});
 [-1,1].forEach(e=>{c.fillStyle='#fff';c.beginPath();c.arc(e*s*.3,-s*.2,s*.26,0,7);c.fill();c.stroke();if(blink){c.beginPath();c.moveTo(e*s*.3-s*.2,-s*.2);c.quadraticCurveTo(e*s*.3,-s*.08,e*s*.3+s*.2,-s*.2);c.stroke();}else{c.fillStyle=OL;c.beginPath();c.arc(e*s*.3,-s*.18,s*.11,0,7);c.fill();}});
 c.fillStyle='#ffa94d';c.beginPath();c.moveTo(-s*.08,-s*.02);c.lineTo(s*.08,-s*.02);c.lineTo(0,s*.14);c.closePath();c.fill();c.stroke();c.restore();}
function knot(c,x,y,ts){c.fillStyle='#3d2614';c.strokeStyle='#2a1a0e';c.lineWidth=Math.max(1.2,ts*.025);c.beginPath();c.ellipse(x,y,ts*.09,ts*.11,0,0,7);c.fill();c.stroke();}
function squirrel(c,x,y,ts,o,k){const s=ts*.22;c.save();c.beginPath();c.rect(x-ts,y-ts,ts*2,ts*1.1);c.clip();c.translate(x,y+(1-o)*s*1.2);c.strokeStyle=OL;c.lineWidth=lw(ts)*.7;
 c.fillStyle='#d9822b';c.beginPath();c.ellipse(0,-s*.35,s*.45,s*.4,0,0,7);c.fill();c.stroke();[-1,1].forEach(e=>{c.beginPath();c.moveTo(e*s*.18,-s*.7);c.lineTo(e*s*.32,-s*.98);c.lineTo(e*s*.38,-s*.62);c.fill();c.stroke();});
 c.fillStyle=OL;[-1,1].forEach(e=>{c.beginPath();c.arc(e*s*.17,-s*.42,s*.06,0,7);c.fill();});c.fillStyle='#fff3bf';c.beginPath();c.ellipse(0,-s*.2,s*.2,s*.12,0,0,7);c.fill();
 /* the acorn in its paws */const ch=Math.sin(k*40)*s*.03;c.fillStyle='#a0703c';c.beginPath();c.ellipse(0,s*.08+ch,s*.13,s*.16,0,0,7);c.fill();c.stroke();c.fillStyle='#6b4423';c.beginPath();c.ellipse(0,-s*.04+ch,s*.15,s*.07,0,0,7);c.fill();c.stroke();c.restore();}
function burrow(c,x,y,ts){c.fillStyle='#8a6a4a';c.strokeStyle=OL;c.lineWidth=lw(ts)*.8;c.beginPath();c.ellipse(x,y,ts*.36,ts*.16,0,0,7);c.fill();c.stroke();c.fillStyle='#2b1d14';c.beginPath();c.ellipse(x,y-ts*.02,ts*.2,ts*.09,0,0,7);c.fill();
 c.fillStyle='#69a84f';[[-.32,.02],[.3,.04]].forEach(([dx,dy])=>{c.beginPath();c.moveTo(x+dx*ts-ts*.05,y+dy*ts);c.lineTo(x+dx*ts,y+dy*ts-ts*.1);c.lineTo(x+dx*ts+ts*.05,y+dy*ts);c.fill();});}
function bunny(c,x,y,ts,hop,now,i,flip){const s=ts*.3,col=['#f1f3f5','#c8a27a','#e9d8c4'][i%3];c.save();c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.ellipse(x,y+hop*ts*.28,s*.5,s*.12,0,0,7);c.fill();c.translate(x,y);if(flip)c.scale(-1,1);c.strokeStyle=OL;c.lineWidth=lw(ts)*.7;
 const tw=Math.sin(now/260)>.92?.25:0;c.fillStyle=col;c.beginPath();c.ellipse(-s*.1,-s*.35,s*.5,s*.38,0,0,7);c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(-s*.58,-s*.38,s*.14,0,7);c.fill();c.stroke();
 c.fillStyle=col;c.beginPath();c.arc(s*.3,-s*.68,s*.28,0,7);c.fill();c.stroke();[[.18,-.2],[.4,tw]].forEach(([ex,r])=>{c.save();c.translate(s*ex,-s*.88);c.rotate(-.15+r);c.beginPath();c.ellipse(0,-s*.32,s*.09,s*.32,0,0,7);c.fill();c.stroke();c.fillStyle='#ffc9c9';c.beginPath();c.ellipse(0,-s*.32,s*.04,s*.22,0,0,7);c.fill();c.fillStyle=col;c.restore();});
 c.fillStyle=OL;c.beginPath();c.arc(s*.42,-s*.72,s*.05,0,7);c.fill();c.fillStyle='#ff8787';c.beginPath();c.arc(s*.57,-s*.62,s*.05,0,7);c.fill();c.restore();}
function cracks(c,x,y,ts,wins,now){const n=Math.min(15,wins|0);if(!n)return;const w=ts*.95,h=ts*1.15,ex=x,ey=y-h*.52;c.save();c.strokeStyle=OL;c.lineWidth=Math.max(1.4,ts*.03);c.lineCap='round';c.lineJoin='round';
 /* zig-zag cracks in egg coordinates (-1..1); one more crack every few wins and the newest one grows. Nothing is counted out loud. */
 const L=[[[-.45,-.15],[-.25,-.3],[-.12,-.1],[.05,-.28],[.2,-.12]],[[.42,.1],[.25,.2],[.32,.38],[.12,.45]],[[-.4,.3],[-.2,.18],[-.15,.4],[.02,.3]],[[.05,-.28],[.12,-.5],[.25,-.45],[.3,-.62]],[[-.12,-.1],[-.05,.1],[.1,.05],[.15,.22]]];
 const segs=Math.min(L.length,Math.ceil(n/3));for(let i=0;i<segs;i++){const pts=L[i],grow=i<segs-1?1:((n-1)%3+1)/3,m=1+Math.round((pts.length-1)*grow);c.beginPath();pts.slice(0,m).forEach(([px,py],j)=>{const X=ex+px*w*.5,Y=ey+py*h*.5;j?c.lineTo(X,Y):c.moveTo(X,Y);});c.stroke();}
 if(n>=15){/* ready to hatch (that is batch 2): two little eyes peek through the top crack */const k=Math.sin(now/500);c.fillStyle='#2b1d14';c.beginPath();c.ellipse(ex,ey-h*.2,ts*.12,ts*.07,0,0,7);c.fill();
  c.fillStyle='#fff';[-1,1].forEach(e=>{c.beginPath();c.arc(ex+e*ts*.045+k*ts*.01,ey-h*.2,ts*.022,0,7);c.fill();});}
 c.restore();}

/* ---------- hooks ---------- */
const D0=MQ_DECOR.draw.bind(MQ_DECOR);
MQ_DECOR.draw=(t,x,y)=>{const d=D0(t,x,y);if(!d||!BUILT)return d;const s=SURP.find(q=>q.x===x&&q.y===y&&(q.wrap||q.after));if(!s)return d;
 return (ctx,sx,sy,ts)=>{const now=performance.now(),k=prog(s.id,now);if(k>=0&&s.wrap){ctx.save();s.wrap(ctx,k,sx,sy,ts);const r=d(ctx,sx,sy,ts);ctx.restore();if(s.after)s.after(ctx,k,sx,sy,ts,now);return r;}const r=d(ctx,sx,sy,ts);if(s.after)s.after(ctx,k,sx,sy,ts,now);return r;};};
const active=s=>!s.hidden||ST.won[s.b];
let lastB=null,shimmered={};
window.MQ_MAPDRAW=window.MQ_MAPDRAW||[];
window.MQ_MAPDRAW.push((ctx,items,cx,cy,ts,now)=>{if(!W)return;syncST();if(BUILT!==W){try{build();}catch(e){console.warn('livemap',e);BUILT=W;}}
 const b=W.T[W.hy][W.hx].b;if(b!==lastB){lastB=b;shimmered={};const tr={forest:'roll'}[b];if(tr&&!ST.calm&&window.PetPuppet&&PetPuppet.trick)setTimeout(()=>{try{if(W.T[W.hy][W.hx].b===b)PetPuppet.trick(tr);}catch(e){}},700);} /* the pet's trick for this area, once per arrival */
 LIVE.forEach(L=>{try{L.draw(ctx,cx,cy,ts,now,items);}catch(e){}});
 SURP.forEach(s=>{const X=s.x*ts-cx,Y=s.y*ts-cy;if(X<-ts*3||Y<-ts*3||X>W.vw+ts*3||Y>W.vh+ts*3)return;const k=prog(s.id,now);
  if(s.still&&!(s.swap&&k>=0))items.push({y:s.y+.02,draw:()=>s.still(ctx,X,Y,ts,now)});
  if(s.fx&&k>=0)items.push({y:s.y+(s.fxY!==undefined?s.fxY:s.id==='k_cat'||s.id==='v_coin'?3:.6),draw:()=>s.fx(ctx,k,X,Y,ts,now)});
  /* one slow shimmer the first time you come near an easy surprise you haven't found (never for hidden ones) */
  if(!s.hidden&&!ST.found[s.id]&&!ST.calm&&near(s.x,s.y,3)&&!shimmered[s.group||s.id])shimmered[s.group||s.id]=now;
  const sh=shimmered[s.group||s.id];if(!s.hidden&&sh&&now-sh<1800&&!ST.found[s.id]){const p=(now-sh)/1800;items.push({y:s.y+.9,draw:()=>{ctx.save();ctx.globalAlpha=Math.sin(p*Math.PI)*.85;for(let i=0;i<3;i++){const a=p*Math.PI*1.2+i*2.1,r=ts*.38;const px=X+ts/2+Math.cos(a)*r,py=Y+ts*.35+Math.sin(a)*r*.6;star(ctx,px,py,ts*.07);}ctx.restore();}});}
  if(s.pop&&now-s.pop<1100){const p=(now-s.pop)/1100;items.push({y:1e6,draw:()=>{ctx.save();ctx.globalAlpha=1-p;star(ctx,X+ts/2,Y-ts*.3-p*ts*.6,ts*(.12+p*.06));ctx.restore();}});}});});
function star(c,x,y,r){c.fillStyle='#fff3bf';c.strokeStyle='#f59f00';c.lineWidth=1.5;c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();c.stroke();}
window.MQ_TAP=window.MQ_TAP||[];
window.MQ_TAP.unshift((wx,wy,ts)=>{if(!W||!BUILT)return;syncST();const tx=wx/ts,ty=wy/ts;
 /* choosing a bed after the watering can */
 if(PICK){const G=PICK.G;if(performance.now()-PICK.t>8000)PICK=null;else if(tx>=G.x&&tx<G.x+2&&ty>=G.y-1.2&&ty<G.y+1){const i=cl(Math.floor((tx-G.x)*2),0,3);Object.keys(ST.water).forEach(k=>{if(k!==today())delete ST.water[k];});const w=ST.water[today()]||(ST.water[today()]=[0,0,0,0]);
  if(bedH(G,i)<7)w[i]++;saveST();PICK=null;G.rain={bed:i,t:performance.now()};snd('water');setTimeout(()=>{const to=tallest(G);G.flags=true;G.bees.forEach(b=>{b.fly={from:b.bed,to,t:performance.now()};});snd('flap');},1300);return [W.hx,W.hy];}}
 for(const s of SURP){if(!active(s))continue;const [x0,y0,x1,y1]=s.hit;if(tx<s.x+x0||tx>s.x+x1||ty<s.y+y0||ty>s.y+y1)continue;
  if(!near(s.x,s.y,s.range)){/* too far: just walk next to it */for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1],[-1,1],[1,1]]){const t=W.T[s.y+dy]&&W.T[s.y+dy][s.x+dx];if(t&&!t.block)return [s.x+dx,s.y+dy];}return;}
  if(prog(s.id,performance.now())>=0)return [W.hx,W.hy];play(s.id,s.dur);try{s.fire();}catch(e){}found(s);return [W.hx,W.hy];}});

/* ---------- demo panel ---------- */
const AREAS=[['🏡','Village','village',[22,19]],['🌳','Forest','forest',null],['📊','Garden','garden',null],['💎','Caves','caves',null],['🏰','Castle','castle',null],['🥚','Egg','volcano',null]];
function jump(b,at){if(!W||curScreen!=='world')return;let x,y;if(at){[x,y]=at;}else{const s=SURP.filter(q=>q.b===b)[0],C=BIOMES[b].c;const tx=s?s.x:C[0],ty=s?s.y:C[1];let best=null;
  for(let yy=ty-4;yy<=ty+4;yy++)for(let xx=tx-4;xx<=tx+4;xx++){const t=W.T[yy]&&W.T[yy][xx];if(!t||t.block||t.b!==b||t.water)continue;const d=Math.hypot(xx-tx,yy-ty-1.5);if(!best||d<best.d)best={x:xx,y:yy,d};}if(!best)return;x=best.x;y=best.y;}
 W.hx=W.px=W.fx=x;W.hy=W.py=W.fy=y;W.drawX=x;W.drawY=y;W.path=[];W.moving=false;try{P().wpos={x,y};}catch(e){}}
function panel(){if(document.getElementById('lmPanel'))return;const d=document.createElement('div');d.id='lmPanel';
 d.innerHTML=`<style>#lmPanel{position:fixed;left:10px;bottom:10px;z-index:60;background:rgba(32,24,58,.94);color:#fff;border-radius:14px;padding:8px 10px;font:600 13px/1.3 Fredoka,system-ui,sans-serif;max-width:min(94vw,520px);box-shadow:0 6px 18px rgba(0,0,0,.3)}
#lmPanel b{color:#ffd43b}#lmPanel .r{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}#lmPanel button{font:inherit;border:0;border-radius:10px;padding:6px 9px;background:#4c3d8f;color:#fff;cursor:pointer;min-height:34px}
#lmPanel button.on{background:#ffd43b;color:#2b2340}#lmPanel .x{background:transparent;padding:2px 6px;min-height:0;float:right}#lmPanel.min .r,#lmPanel.min .n{display:none}#lmPanel .n{opacity:.85;font-weight:400;font-size:12px;margin-top:4px}</style>
 <button class="x" id="lmMin" type="button">–</button><b>🌿 Living Map demo</b>
 <div class="r" id="lmGo"></div><div class="r" id="lmOpt"></div><div class="n" id="lmNote"></div>`;document.body.appendChild(d);
 d.querySelector('#lmMin').onclick=()=>d.classList.toggle('min');render();}
function render(){syncST();const go=document.getElementById('lmGo'),op=document.getElementById('lmOpt'),nt=document.getElementById('lmNote');if(!go)return;
 go.innerHTML=AREAS.map((a,i)=>`<button type="button" data-a="${i}">${a[0]} ${a[1]}</button>`).join('');
 go.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=AREAS[+b.dataset.a];jump(a[2],a[3]);});
 const here=W&&W.T[W.hy]&&W.T[W.hy][W.hx]?W.T[W.hy][W.hx].b:'';const nm=(BIOMES[here]&&(BIOMES[here].name||(ZONES.find(z=>z.id===BIOMES[here].zone)||{}).name))||here;
 op.innerHTML=`<button type="button" id="lmCalm" class="${ST.calm?'on':''}">Calm motion</button><button type="button" id="lmQuiet" class="${ST.quiet?'on':''}">Quiet taps</button>
 <button type="button" id="lmWin">⚔️ Pretend I won here</button><button type="button" id="lmRing">🕐 Ring the hour</button><button type="button" id="lmSec">📖 Secrets</button><button type="button" id="lmReset">↺ Reset</button>`;
 const wonHere=!!ST.won[here];nt.innerHTML=`Here: <b>${nm.replace(/</g,'')}</b>${here?` · hidden surprise ${wonHere?'<b>awake</b>':'asleep (win a battle here)'}`:''} · egg wins: <b>${ST.wins}</b>/15`;
 op.querySelector('#lmCalm').onclick=()=>{ST.calm=!ST.calm;saveST();render();};op.querySelector('#lmQuiet').onclick=()=>{ST.quiet=!ST.quiet;saveST();render();};
 op.querySelector('#lmWin').onclick=()=>{if(!here)return;ST.won[here]=1;if(here==='volcano')ST.wins=Math.min(15,ST.wins+1);saveST();render();};
 op.querySelector('#lmRing').onclick=()=>{ST.ring=Date.now();saveST();jump('village',[24,16]);};
 op.querySelector('#lmSec').onclick=secrets;op.querySelector('#lmReset').onclick=()=>{const L=ST._L;if(L){L.found={};L.won={};L.wins=0;L.water={};}ST._L=null;syncST();saveST();render();};}
function secretsHTML(){syncST();const by={};SURP.forEach(s=>{const g=s.group||s.id;(by[s.b]=by[s.b]||{})[g]=by[s.b][g]||s;});
 const names={village:'🏡 Number Village',forest:'🌳 Addition Forest',garden:'📊 Graph Garden',caves:'💎 Subtraction Caves',castle:'🏰 Division Castle',volcano:'🌋 Multiplication Volcano'};
 const got=s=>SURP.some(q=>(q.group||q.id)===(s.group||s.id)&&ST.found[q.id]);
 return Object.keys(by).map(b=>{const list=Object.values(by[b]),n=list.filter(got).length;return `<div class="lmsec"><b>${names[b]||b}</b> · ${n} of ${list.length}${n===list.length&&list.length>=3?' ⭐':''}<div class="lmcards">${list.map(s=>{const f=got(s);
  return `<span class="lmcard ${f?'f':''}">${f?'✨ '+s.name:(s.hidden?(ST.won[s.b]?'🔍 A hidden one is awake here!':'🔒 Win a battle here to wake a hidden one'):'❔ Not found yet')}</span>`;}).join('')}</div></div>`;}).join('');}
function secrets(){const by={};SURP.forEach(s=>{const g=s.group||s.id;(by[s.b]=by[s.b]||{})[g]=by[s.b][g]||s;});
 const names={village:'🏡 Number Village',forest:'🌳 Addition Forest',garden:'📊 Graph Garden',caves:'💎 Subtraction Caves',castle:'🏰 Division Castle',volcano:'🌋 Multiplication Volcano'};
 const html=Object.keys(by).map(b=>{const list=Object.values(by[b]),got=list.filter(s=>SURP.some(q=>(q.group||q.id)===(s.group||s.id)&&ST.found[q.id]));
  return `<div style="margin:10px 0"><b>${names[b]}</b> · ${got.length} of ${list.length}${got.length===list.length&&list.length===3?' ⭐':''}<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${list.map(s=>{const f=SURP.some(q=>(q.group||q.id)===(s.group||s.id)&&ST.found[q.id]);
   return `<span style="border-radius:10px;padding:8px 10px;background:${f?'#fff9db':'#f1f3f5'};border:2px solid ${f?'#f2b705':'#dee2e6'};color:${f?'#2b2340':'#adb5bd'}">${f?'✨ '+s.name:(s.hidden?'🔒 hidden':'❔ not found yet')}</span>`;}).join('')}</div></div>`;}).join('');
 try{modal(`<h2>📖 Secrets</h2><p style="margin:4px 0 0;color:#666">Demo: the cards you have found. In the game these are big pictures, read aloud.</p>${html}<button class="btn" onclick="closeModal()">Close</button>`);}catch(e){alert(html.replace(/<[^>]+>/g,' '));}}

/* ---------- demo hero: on a device with no heroes (the demo server), make one and go straight to the map ---------- */
function demoHero(){try{if(state.players&&state.players.length)return false;const p=newPlayer('Explorer',3);p.id='pDemo';p.setup=true;p.welcomed=true;p.skillChecked=true;p.tbOn=false;p.xplace=1;p.xp2=1;p.battles=20;p.level=8;
 p.pets=['fox'];p.pet='fox';p.newsSeen='2099';p.xfogOff=1;p.nh=0;p.fog={last:'2099-01-01',on:0};p.principalLast=new Date().toISOString().slice(0,10);state.players=[p];state.cur=p.id;saveLocal();return true;}catch(e){console.warn('livemap demo hero',e);return false;}}
window.addEventListener('load',()=>{if(!DEMO)return;setTimeout(()=>{const made=demoHero();if(made){try{go('world');}catch(e){}}panel();setInterval(()=>{const pn=document.getElementById('lmPanel');if(pn)pn.style.display=curScreen==='world'?'':'none';render();},1000);},600);});
/* the kid's Secrets: a panel on the Me page's 🏆 trophies tab */
(function reg(n){if(typeof SCREENS!=='undefined'&&SCREENS.me){const m0=SCREENS.me;SCREENS.me=tab=>{m0(tab);try{if(meTab()==='tro'&&W&&SURP.length){const pg=document.querySelector('.page')||document.getElementById('app');
 pg.insertAdjacentHTML('beforeend',`<style>.lmsec{margin:8px 0}.lmcards{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.lmcard{border-radius:10px;padding:8px 10px;background:#f1f3f5;border:2px solid #dee2e6;color:#868e96;font-size:14px}.lmcard.f{background:#fff9db;border-color:#f2b705;color:#2b2340}</style><div class="panel"><h3>📖 Secrets of the map</h3><p class="muted">Tap things on the map to find surprises. Some are hidden until you win a battle in that world.</p>${secretsHTML()}</div>`);}}catch(e){}};return;}if((n||0)<400)setTimeout(()=>reg((n||0)+1),50);})(0);
/* Parent Corner: Calm motion and Quiet taps for this device */
(function reg2(n){if(typeof parentSchool==='function'){const ps0=parentSchool;parentSchool=function(p){let h=ps0(p);try{h+=`<h4>🌿 Living map (this device)</h4><label style="display:block;margin:6px 0"><input type="checkbox" ${ST.calm?'checked':''} onchange="LiveMap.set('calm',this.checked)"> <b>Calm motion</b>: the animals and moving scenery stay still. Taps still wiggle.</label><label style="display:block;margin:6px 0"><input type="checkbox" ${ST.quiet?'checked':''} onchange="LiveMap.set('quiet',this.checked)"> <b>Quiet taps</b>: things still move when tapped, but make no sound.</label>`;}catch(e){}return h;};return;}if((n||0)<400)setTimeout(()=>reg2((n||0)+1),50);})(0);
window.LiveMap={ST,SURP,LIVE,ANIM,build:()=>build(),jump,set:(k,v)=>{ST[k]=!!v;saveST();}};
})();
