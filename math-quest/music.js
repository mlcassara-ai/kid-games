/* Map music — soft, wandering piano made live on the device (no audio files).
   Choices (per player, p.music): 'auto' = 🌿 Morning Meadow by day / 🌙 Quiet Dusk in the evening, 'stars' = ✨ Music-Box Stars, 'off'.
   Plays only on the world map; fades out when a battle or building opens and fades back in on return.
   The 🔊 top-bar button opens the Sound menu (sound effects on/off + music choice). */
(function(){
'use strict';
const TRACKS={
 meadow:{name:'🌿 Morning Meadow',bpm:62,root:60,scale:[0,2,4,7,9],prog:[[0,4,7],[5,9,12],[9,12,16],[7,11,14]],tone:'piano',rest:.38,padVol:.05,octave:12},
 dusk:{name:'🌙 Quiet Dusk',bpm:54,root:57,scale:[0,2,3,7,9,10],prog:[[0,3,7],[5,9,12],[3,7,10],[10,14,17]],tone:'felt',rest:.45,padVol:.07,octave:12},
 stars:{name:'✨ Music-Box Stars',bpm:70,root:64,scale:[0,2,4,7,9,11],prog:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],tone:'bell',rest:.32,padVol:.045,octave:12},
 /* Science Cave: mysterious (never scary) — slow glassy notes, a deep hum, water drips; changes as you go deeper */
 cave:{name:'🪨 Deep Cave',bpm:48,root:50,scale:[0,3,5,7,10],prog:[[0,7,12],[-4,3,8],[-2,5,10],[0,7,15]],tone:'glass',rest:.55,padVol:.09,octave:12,padCut:520,drips:.35},
 crystal:{name:'💎 Crystal Caverns',bpm:52,root:55,scale:[0,2,3,7,9],prog:[[0,7,14],[5,12,17],[3,10,15],[-2,7,14]],tone:'glass',rest:.48,padVol:.07,octave:12,padCut:800,drips:.2,shimmer:.3},
 magma:{name:'🌋 Magma Deep',bpm:44,root:45,scale:[0,1,5,7,8],prog:[[0,7,12],[1,8,13],[-4,3,8],[0,7,12]],tone:'glass',rest:.6,padVol:.1,octave:12,padCut:380,rumble:.3}};
const LEVEL=.34; // softer than sound effects
const DAY_FROM=6,DUSK_FROM=17; // 6am–5pm = Morning Meadow, 5pm–6am = Quiet Dusk
let AC=null,master=null,cur=null,timer=null,step=0,bar=0,mi=2,nextT=0,playing=false;
function init(){if(AC)return true;try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return false;}
 master=AC.createGain();master.gain.value=0;const verb=AC.createConvolver();const len=AC.sampleRate*3.6,ir=AC.createBuffer(2,len,AC.sampleRate);
 for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}verb.buffer=ir;
 const wet=AC.createGain();wet.gain.value=.55;const dry=AC.createGain();dry.gain.value=.75;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;
 master.connect(lp);lp.connect(dry);lp.connect(verb);verb.connect(wet);dry.connect(AC.destination);wet.connect(AC.destination);return true;}
const hz=m=>440*Math.pow(2,(m-69)/12),R=()=>Math.random();
function note(m,t,dur,vel,tone){const out=AC.createGain();out.connect(master);const f=hz(m);
 const parts=tone==='glass'?[[1,1],[2.01,.25],[3.98,.08]]:tone==='bell'?[[1,1],[2.76,.35],[5.4,.12]]:tone==='felt'?[[1,1],[2,.22],[3,.06]]:[[1,1],[2,.35],[3,.12],[4,.05]];
 parts.forEach(([mul,a])=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f*mul*(1+(R()-.5)*.0016);
  const dec=(tone==='glass'?3.6:tone==='bell'?2.6:tone==='felt'?2.2:2.8)/Math.sqrt(mul),end=t+Math.max(dur,dec);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a*vel,t+(tone==='felt'?.03:.008));g.gain.exponentialRampToValueAtTime(.0001,end);
  o.connect(g);g.connect(out);o.start(t);o.stop(end+.1);});}
function pad(ms,t,dur,vol,cut){ms.forEach(m=>{const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=cut||900;
 o.type='triangle';o2.type='sine';o.frequency.value=hz(m-12);o2.frequency.value=hz(m-12)*1.003;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);
 o.connect(f);o2.connect(f);f.connect(g);g.connect(master);o.start(t);o2.start(t);o.stop(t+dur+.1);o2.stop(t+dur+.1);});}
function drip(t){const o=AC.createOscillator(),g=AC.createGain();const f=1400+R()*1400;o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.45,t+.09);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g);g.connect(master);o.start(t);o.stop(t+.3);}
function rumble(t){const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=120;o.type='sawtooth';o.frequency.value=38+R()*8;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+1.2);g.gain.linearRampToValueAtTime(0,t+3.5);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+3.6);}
function schedule(){if(!cur)return;const T=cur,beat=60/T.bpm;
 if(nextT<AC.currentTime)nextT=AC.currentTime+.05; // after the app was in the background
 while(nextT<AC.currentTime+1.2){const t=nextT,chord=T.prog[bar%T.prog.length],inBar=step%8,quiet=(Math.floor(bar/4)%3===2);
  if(T.drips&&R()<T.drips*.5)drip(t+R()*beat);if(T.shimmer&&R()<T.shimmer*.4)note(T.root+36+T.scale[Math.floor(R()*T.scale.length)],t+R()*beat,beat,.03,'bell');if(T.rumble&&inBar===4&&R()<T.rumble)rumble(t);
  if(inBar===0){pad(chord.map(c=>T.root+c),t,beat*8,T.padVol*(quiet?.6:1),T.padCut);if(!quiet)note(T.root-12+chord[0],t,beat*6,.16,T.tone==='bell'?'felt':T.tone);}
  if(!quiet){if(inBar===2||inBar===5)note(T.root+chord[inBar===2?1:2],t,beat*3,.09,T.tone==='bell'?'felt':T.tone);
   if(R()>T.rest&&(inBar%2===0||R()<.3)){mi=Math.max(0,Math.min(T.scale.length*2-1,mi+[-2,-1,-1,1,1,2,0][Math.floor(R()*7)]));
    const deg=T.scale[mi%T.scale.length]+12*Math.floor(mi/T.scale.length);note(T.root+T.octave+deg,t+(R()<.2?beat*.5:0),beat*2,.13+R()*.05,T.tone);
    if(T.tone==='bell'&&R()<.25)note(T.root+T.octave+deg+12,t+beat*.5,beat,.05,'bell');}}
  step++;if(step%8===0)bar++;nextT+=beat;}}
function choice(p){return (p&&p.music)||'auto';}
function trackFor(p){const c=choice(p);if(c==='off')return null;if(c==='stars')return 'stars';const h=new Date().getHours();return h>=DAY_FROM&&h<DUSK_FROM?'meadow':'dusk';}
function mVol(){try{return state.musicVol==null?70:state.musicVol;}catch(e){return 70;}}
function lvl(){const g=window.volGain?volGain(mVol()):mVol()/70;return LEVEL*g;}
function fadeTo(v,s){if(!AC)return;const now=AC.currentTime;master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(v,now+s);}
function start(id){if(!init())return;if(AC.state==='suspended')AC.resume();
 if(cur&&cur===TRACKS[id]&&playing)return;
 const go=()=>{cur=TRACKS[id];step=0;bar=0;mi=2;nextT=AC.currentTime+.1;clearInterval(timer);timer=setInterval(schedule,250);schedule();fadeTo(lvl(),2.5);playing=true;};
 if(playing&&cur){fadeTo(0,2);playing=false;setTimeout(go,2100);}else go();}
function stop(){if(!AC||!playing)return;playing=false;fadeTo(0,1.2);setTimeout(()=>{if(!playing){clearInterval(timer);cur=null;}},1300);}
let want=null;
function update(){try{const p=typeof P==='function'&&state&&state.cur?P():null;
 const onMap=typeof curScreen!=='undefined'&&curScreen==='world'&&!document.hidden&&!window.trollBusy&&!document.getElementById('isRoot')&&!document.getElementById('cvRoot');
 const inCave=typeof curScreen!=='undefined'&&curScreen==='cave'&&!document.hidden&&!!document.getElementById('cvRoot')&&window.Cave&&Cave._dbg;
 let id=onMap&&p?trackFor(p):null;
 if(inCave&&p&&p.caveMusic!==false){try{const d=Cave._dbg();const y=d.S.y;if(y===0)id=trackFor({music:'auto'});else{const L=d.layerOf(y);const lid=L&&L.id;id=['magma','mantle'].includes(lid)?'magma':['crystal','granite'].includes(lid)?'crystal':'cave';}}catch(e){id='cave';}}
 if(mVol()<=0)id=null;
 want=id;
 if(!id){stop();return;}
 if(!AC||AC.state!=='running'){if(AC)AC.resume();if(!AC||AC.state!=='running')return;} // waits for the first tap (iPad rule)
 if(!playing||cur!==TRACKS[id])start(id);}catch(e){}}
setInterval(update,1000);
// iPads only allow sound after a tap: unlock on the first touch
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>{if(!init())return;if(AC.state!=='running')AC.resume().then(update).catch(()=>{});},{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(AC&&playing){playing=false;master.gain.value=0;clearInterval(timer);cur=null;}}else update();});

/* ---------- the Sound menu (from the 🔊 button) ---------- */
function slider(k,title,sub,v){return `<div class="snd-sl"><div class="snd-slh"><b>${title}</b><span id="sv_${k}">${v===0?'Off':v+'%'}</span></div><small>${sub}</small><div class="snd-slr"><span aria-hidden="true">${v===0?'🔇':'🔈'}</span><input type="range" id="sl_${k}" min="0" max="100" step="5" value="${v}" aria-label="${title} volume" oninput="Music.vol('${k}',this.value,false)" onchange="Music.vol('${k}',this.value,true)"><span aria-hidden="true">🔊</span></div></div>`;}
let lastPing=0;
function vol(k,v,done){v=Math.round(+v/5)*5;const lab=document.getElementById('sv_'+k);if(lab)lab.textContent=v===0?'Off':v+'%';
 if(k==='fx'){const was=state.sound!==false;state.fxVol=v;state.sound=v>0;  if(v>0&&Date.now()-lastPing>180){lastPing=Date.now();try{SFX.tap();}catch(e){}}
  if(done&&was!==state.sound&&typeof curScreen!=='undefined'&&!['world','battle','cave','inner'].includes(curScreen)){const y=window.scrollY;go(curScreen,curArg);window.scrollTo(0,y);}}
 else{state.musicVol=v;if(AC&&playing){const now=AC.currentTime;master.gain.cancelScheduledValues(now);master.gain.setTargetAtTime(lvl(),now,.15);}if(done)update();}
 if(done)save();}
function menu(){modal(`<div class="mcard snd-card">${panel('map')}<div class="row"><button class="btn green big" onclick="closeModal()">Done</button></div></div>`);}
/* the Sound panel. where='map' (main game) or 'cave' (Dr. Quartz's cave): same sliders, but the music choices match the place you're in */
function panel(where){const p=typeof P==='function'&&state&&state.cur?P():null;const c=choice(p);
 const opt=(on,click,title,sub)=>`<button class="snd-opt ${on?'on':''}" onclick="${click}"><b>${title}</b><small>${sub}</small></button>`;
 const h=new Date().getHours(),day=h>=DAY_FROM&&h<DUSK_FROM;const caveOnNow=!p||p.caveMusic!==false;
 return `<h2>🎵 Sound</h2>
  ${slider('fx','🔊 Sound effects','Footsteps, taps, cheers',state.sound!==false?(state.fxVol==null?70:state.fxVol):0)}
  ${slider('mu','🎵 Music','How loud the music plays',mVol())}
  ${!p?'':where==='cave'?`<div class="snd-lab">Music in the cave${p.name?` for ${esc(p.name)}`:''}</div>
  ${opt(caveOnNow,"Music.caveSet(true)",'⛏️ Cave music','Changes as you dig deeper')}
  ${opt(!caveOnNow,"Music.caveSet(false)",'🔇 No cave music','Quiet cave · the map music is not changed')}`:
  `<div class="snd-lab">Music on the map${p.name?` for ${esc(p.name)}`:''}</div>
  ${opt(c==='auto',"Music.set('auto')",'🌿🌙 Morning &amp; Dusk',`Changes with the time of day · now: ${day?'🌿 Morning Meadow':'🌙 Quiet Dusk'}`)}
  ${opt(c==='stars',"Music.set('stars')",'✨ Music-Box Stars','Twinkly and magical, all the time')}
  ${opt(c==='off',"Music.set('off')",'🔇 No music','Quiet map')}`}`;}
function caveSet(on){const p=P();if(!p)return;p.caveMusic=!!on;save();update();try{window.__cvSndRefresh&&__cvSndRefresh();}catch(e){}}
function muted(where){const p=typeof P==='function'&&state&&state.cur?P():null;const fxOff=state.sound===false;const mOff=mVol()<=0||!p||(where==='cave'?p.caveMusic===false:choice(p)==='off');return fxOff&&mOff;}
/* the cave has its own music switch (the 🎵 button in the cave) — it never changes the map music */
function caveToggle(){const p=P();if(!p)return false;p.caveMusic=p.caveMusic===false;save();update();return p.caveMusic!==false;}
function caveOn(){try{return P().caveMusic!==false;}catch(e){return true;}}
function set(v){const p=P();if(!p)return;p.music=v;save();menu();update();}
function fx(on){state.sound=!!on;save();menu();try{if(on)SFX.tap();}catch(e){}if(typeof curScreen!=='undefined'&&!['world','battle','cave','inner'].includes(curScreen)){const y=window.scrollY;go(curScreen,curArg);window.scrollTo(0,y);}}
const st=document.createElement('style');st.textContent=`.snd-card{max-width:440px}.snd-row{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:6px 0 14px;font-weight:700}
.snd-lab{font-weight:700;margin:4px 0 8px;text-align:left}.snd-opt{display:block;width:100%;text-align:left;border:3px solid #d0bfff;background:#f8f5ff;border-radius:16px;padding:10px 14px;margin:0 0 8px;font:inherit;cursor:pointer;color:#241a3d}
.snd-opt b{display:block;font-size:18px}.snd-opt small{color:#6b5fa0;font-size:14px}.snd-opt.on{border-color:#2ecc71;background:#ebfbee}.snd-opt.on b::after{content:' ✓';color:#2ecc71}
.snd-sl{text-align:left;background:#f8f5ff;border-radius:16px;padding:10px 14px;margin:0 0 10px}.snd-slh{display:flex;justify-content:space-between;font-size:18px}.snd-slh span{font-weight:800;color:#7048e8;font-variant-numeric:tabular-nums}.snd-sl small{color:#6b5fa0;font-size:14px}
.snd-slr{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:20px}.snd-slr input{flex:1;height:36px;accent-color:#7048e8}`;
document.head.appendChild(st);
window.Music={menu,panel,caveSet,muted,set,fx,vol,update,caveToggle,caveOn,trackFor,_state:()=>({playing,cur:cur&&cur.name,want,ac:AC&&AC.state})};
})();
