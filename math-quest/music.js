/* Map music — soft, wandering piano made live on the device (no audio files).
   Choices (per player, p.music): 'auto' = 🌿 Morning Meadow by day / 🌙 Quiet Dusk in the evening, 'stars' = ✨ Music-Box Stars, 'off'.
   Plays only on the world map; fades out when a battle or building opens and fades back in on return.
   The 🔊 top-bar button opens the Sound menu (sound effects on/off + music choice). */
(function(){
'use strict';
const TRACKS={
 meadow:{name:'🌿 Morning Meadow',bpm:62,root:60,scale:[0,2,4,7,9],prog:[[0,4,7],[5,9,12],[9,12,16],[7,11,14]],tone:'piano',rest:.38,padVol:.05,octave:12},
 dusk:{name:'🌙 Quiet Dusk',bpm:54,root:57,scale:[0,2,3,7,9,10],prog:[[0,3,7],[5,9,12],[3,7,10],[10,14,17]],tone:'felt',rest:.45,padVol:.07,octave:12},
 stars:{name:'✨ Music-Box Stars',bpm:70,root:64,scale:[0,2,4,7,9,11],prog:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],tone:'bell',rest:.32,padVol:.045,octave:12}};
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
 const parts=tone==='bell'?[[1,1],[2.76,.35],[5.4,.12]]:tone==='felt'?[[1,1],[2,.22],[3,.06]]:[[1,1],[2,.35],[3,.12],[4,.05]];
 parts.forEach(([mul,a])=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f*mul*(1+(R()-.5)*.0016);
  const dec=(tone==='bell'?2.6:tone==='felt'?2.2:2.8)/Math.sqrt(mul),end=t+Math.max(dur,dec);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a*vel,t+(tone==='felt'?.03:.008));g.gain.exponentialRampToValueAtTime(.0001,end);
  o.connect(g);g.connect(out);o.start(t);o.stop(end+.1);});}
function pad(ms,t,dur,vol){ms.forEach(m=>{const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;
 o.type='triangle';o2.type='sine';o.frequency.value=hz(m-12);o2.frequency.value=hz(m-12)*1.003;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);
 o.connect(f);o2.connect(f);f.connect(g);g.connect(master);o.start(t);o2.start(t);o.stop(t+dur+.1);o2.stop(t+dur+.1);});}
function schedule(){if(!cur)return;const T=cur,beat=60/T.bpm;
 if(nextT<AC.currentTime)nextT=AC.currentTime+.05; // after the app was in the background
 while(nextT<AC.currentTime+1.2){const t=nextT,chord=T.prog[bar%T.prog.length],inBar=step%8,quiet=(Math.floor(bar/4)%3===2);
  if(inBar===0){pad(chord.map(c=>T.root+c),t,beat*8,T.padVol*(quiet?.6:1));if(!quiet)note(T.root-12+chord[0],t,beat*6,.16,T.tone==='bell'?'felt':T.tone);}
  if(!quiet){if(inBar===2||inBar===5)note(T.root+chord[inBar===2?1:2],t,beat*3,.09,T.tone==='bell'?'felt':T.tone);
   if(R()>T.rest&&(inBar%2===0||R()<.3)){mi=Math.max(0,Math.min(T.scale.length*2-1,mi+[-2,-1,-1,1,1,2,0][Math.floor(R()*7)]));
    const deg=T.scale[mi%T.scale.length]+12*Math.floor(mi/T.scale.length);note(T.root+T.octave+deg,t+(R()<.2?beat*.5:0),beat*2,.13+R()*.05,T.tone);
    if(T.tone==='bell'&&R()<.25)note(T.root+T.octave+deg+12,t+beat*.5,beat,.05,'bell');}}
  step++;if(step%8===0)bar++;nextT+=beat;}}
function choice(p){return (p&&p.music)||'auto';}
function trackFor(p){const c=choice(p);if(c==='off')return null;if(c==='stars')return 'stars';const h=new Date().getHours();return h>=DAY_FROM&&h<DUSK_FROM?'meadow':'dusk';}
function fadeTo(v,s){if(!AC)return;const now=AC.currentTime;master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(v,now+s);}
function start(id){if(!init())return;if(AC.state==='suspended')AC.resume();
 if(cur&&cur===TRACKS[id]&&playing)return;
 const go=()=>{cur=TRACKS[id];step=0;bar=0;mi=2;nextT=AC.currentTime+.1;clearInterval(timer);timer=setInterval(schedule,250);schedule();fadeTo(LEVEL,2.5);playing=true;};
 if(playing&&cur){fadeTo(0,2);playing=false;setTimeout(go,2100);}else go();}
function stop(){if(!AC||!playing)return;playing=false;fadeTo(0,1.2);setTimeout(()=>{if(!playing){clearInterval(timer);cur=null;}},1300);}
let want=null;
function update(){try{const p=typeof P==='function'&&state&&state.cur?P():null;
 const onMap=typeof curScreen!=='undefined'&&curScreen==='world'&&!document.hidden&&!window.trollBusy&&!document.getElementById('isRoot')&&!document.getElementById('cvRoot');
 const id=onMap&&p?trackFor(p):null;want=id;
 if(!id){stop();return;}
 if(!AC||AC.state!=='running'){if(AC)AC.resume();if(!AC||AC.state!=='running')return;} // waits for the first tap (iPad rule)
 if(!playing||cur!==TRACKS[id])start(id);}catch(e){}}
setInterval(update,1000);
// iPads only allow sound after a tap: unlock on the first touch
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>{if(!init())return;if(AC.state!=='running')AC.resume().then(update).catch(()=>{});},{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(AC&&playing){playing=false;master.gain.value=0;clearInterval(timer);cur=null;}}else update();});

/* ---------- the Sound menu (from the 🔊 button) ---------- */
function menu(){const p=typeof P==='function'&&state&&state.cur?P():null;const c=choice(p);
 const opt=(v,title,sub)=>`<button class="snd-opt ${c===v?'on':''}" onclick="Music.set('${v}')"><b>${title}</b><small>${sub}</small></button>`;
 const h=new Date().getHours(),day=h>=DAY_FROM&&h<DUSK_FROM;
 modal(`<div class="mcard snd-card"><h2>🎵 Sound</h2>
  <div class="snd-row"><span>Sound effects</span><button class="btn small ${state.sound?'green':'ghost dark'}" onclick="Music.fx(true)">🔊 On</button><button class="btn small ${state.sound?'ghost dark':'green'}" onclick="Music.fx(false)">🔇 Off</button></div>
  ${p?`<div class="snd-lab">Music on the map${p.name?` for ${esc(p.name)}`:''}</div>
  ${opt('auto','🌿🌙 Morning &amp; Dusk',`Changes with the time of day · now: ${day?'🌿 Morning Meadow':'🌙 Quiet Dusk'}`)}
  ${opt('stars','✨ Music-Box Stars','Twinkly and magical, all the time')}
  ${opt('off','🔇 No music','Quiet map')}`:''}
  <div class="row"><button class="btn green big" onclick="closeModal()">Done</button></div></div>`);}
function set(v){const p=P();if(!p)return;p.music=v;save();menu();update();}
function fx(on){state.sound=!!on;save();menu();try{if(on)SFX.tap();}catch(e){}if(typeof curScreen!=='undefined'&&curScreen!=='world'&&curScreen!=='battle'){const y=window.scrollY;go(curScreen,curArg);window.scrollTo(0,y);}}
const st=document.createElement('style');st.textContent=`.snd-card{max-width:440px}.snd-row{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:6px 0 14px;font-weight:700}
.snd-lab{font-weight:700;margin:4px 0 8px;text-align:left}.snd-opt{display:block;width:100%;text-align:left;border:3px solid #d0bfff;background:#f8f5ff;border-radius:16px;padding:10px 14px;margin:0 0 8px;font:inherit;cursor:pointer;color:#241a3d}
.snd-opt b{display:block;font-size:18px}.snd-opt small{color:#6b5fa0;font-size:14px}.snd-opt.on{border-color:#2ecc71;background:#ebfbee}.snd-opt.on b::after{content:' ✓';color:#2ecc71}`;
document.head.appendChild(st);
window.Music={menu,set,fx,update,trackFor,_state:()=>({playing,cur:cur&&cur.name,want,ac:AC&&AC.state})};
})();
