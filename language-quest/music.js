/* Map music for Language Quest: a slow, oud-like melody in maqam Hijaz over a soft drone and a quiet hand drum.
   It is made live on the device with Web Audio (no audio files), so it never repeats exactly. Plays on the world map only.
   Its volume is remembered on the device. window.LQMusic = { start, setVol, vol, duck, mute }. */
(function(){
"use strict";
const KEY="languagequest.music";
let vol=0.6; try{ const v=parseFloat(localStorage.getItem(KEY)); if(!isNaN(v)) vol=Math.max(0,Math.min(1,v)); }catch(e){}
let ctx=null, master=null, duckG=null, noise=null, timer=null, barAt=0, bar=0, deg=0, muted=false;
const E=60/66/2;                         // one eighth note, at 66 beats a minute
const SCALE=[0,1,4,5,7,8,10];            // Hijaz on D: D E-flat F-sharp G A B-flat C
const hz=m=>440*Math.pow(2,(m-69)/12);
const pitch=d=>62+12*Math.floor(d/7)+SCALE[((d%7)+7)%7];      // melody degree -> note, starting from the D above middle C
const pick=a=>a[Math.random()*a.length|0];

function pluck(t,m,vol,len){              // a plucked string: bright at the start, quickly mellow
  const g=ctx.createGain(), f=ctx.createBiquadFilter(); f.type="lowpass"; f.Q.value=1.2;
  f.frequency.setValueAtTime(2400,t); f.frequency.exponentialRampToValueAtTime(600,t+Math.min(len,0.9));
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t+len);
  for(const [type,cents,k] of [["triangle",0,1],["sawtooth",5,0.28],["triangle",1200,0.12]]){
    const o=ctx.createOscillator(), og=ctx.createGain(); o.type=type; o.frequency.value=hz(m); o.detune.value=cents; og.gain.value=k;
    o.connect(og); og.connect(f); o.start(t); o.stop(t+len+0.05); }
  f.connect(g); g.connect(duckG);
}
function dum(t,vol){ const o=ctx.createOscillator(), g=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(58,t+0.18);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.32); o.connect(g); g.connect(duckG); o.start(t); o.stop(t+0.35); }
function tek(t,vol){ const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=noise; f.type="bandpass"; f.frequency.value=2600; f.Q.value=1.5;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.07); s.connect(f); f.connect(g); g.connect(duckG); s.start(t); s.stop(t+0.09); }
function drone(){ const f=ctx.createBiquadFilter(), g=ctx.createGain(), lfo=ctx.createOscillator(), lg=ctx.createGain(); f.type="lowpass"; f.frequency.value=420; g.gain.value=0.16;
  for(const [m,type,k] of [[38,"sine",1],[45,"sine",0.55],[50,"triangle",0.22]]){ const o=ctx.createOscillator(), og=ctx.createGain(); o.type=type; o.frequency.value=hz(m); og.gain.value=k; o.connect(og); og.connect(f); o.start(); }
  lfo.frequency.value=0.07; lg.gain.value=0.05; lfo.connect(lg); lg.connect(g.gain); lfo.start(); f.connect(g); g.connect(duckG); }

// one bar = eight eighth notes. The tune wanders by small steps, breathes with rests, and comes home to D every fourth bar.
const RHYTHMS=[[2,2,4],[2,1,1,4],[1,1,2,4],[4,4],[3,1,4],[2,2,2,2],[1,1,1,1,4],[6,2]];
function playBar(t){
  const home=bar%4===3, quiet=!home&&Math.random()<0.22;
  // hand drum, very soft: dum tek . tek dum . tek .
  if(bar%8>=2){ [[0,"d"],[1,"t"],[3,"t"],[4,"d"],[6,"t"]].forEach(([i,k])=>k==="d"?dum(t+i*E,0.13):tek(t+i*E,0.035)); }
  if(!quiet){ let at=0; const r=home?pick([[2,2,4],[2,6],[1,1,2,4]]):pick(RHYTHMS);
    r.forEach((len,i)=>{ const last=i===r.length-1;
      deg=home&&last?(deg>3?7:0):Math.max(-3,Math.min(9,deg+pick([-2,-1,-1,-1,0,1,1,1,2])));
      const m=pitch(deg), start=t+at*E;
      if(len>=4&&Math.random()<0.4){ for(let k=0;k<len*2;k++) pluck(start+k*E/2,m,k?0.10:0.2,0.3); }      // a long note played as a soft tremolo
      else pluck(start,m,0.22,Math.max(0.5,len*E*1.5));
      if(last&&home) pluck(start,m-12,0.14,len*E*1.8);
      at+=len; }); }
  bar++;
}
function tick(){ if(!ctx) return; while(barAt<ctx.currentTime+0.6){ playBar(Math.max(barAt,ctx.currentTime+0.05)); barAt+=8*E; } }
function level(){ if(master) master.gain.setTargetAtTime(muted?0:vol*0.8,ctx.currentTime,0.25); }
function start(){ if(!vol||muted) return;
  try{
    if(!ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC();
      master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination); duckG=ctx.createGain(); duckG.connect(master);
      noise=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate); const d=noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      drone(); barAt=ctx.currentTime+0.3; }
    if(ctx.state==="suspended") ctx.resume();
    level(); if(!timer){ if(barAt<ctx.currentTime) barAt=ctx.currentTime+0.2; timer=setInterval(tick,120); tick(); }
  }catch(e){}
}
function stop(){ if(timer){ clearInterval(timer); timer=null; } if(ctx) level(); }
document.addEventListener("visibilitychange",()=>{ if(!ctx) return; if(document.hidden){ stop(); ctx.suspend(); } else if(vol&&!muted) start(); });
window.LQMusic={ start, vol:()=>vol,
  setVol(v){ vol=Math.max(0,Math.min(1,+v||0)); try{ localStorage.setItem(KEY,String(vol)); }catch(e){} vol?start():stop(); },
  mute(v){ muted=!!v; muted?stop():start(); },                                   // follows the map's main sound button
  duck(v){ if(duckG) duckG.gain.setTargetAtTime(v?0.22:1,ctx.currentTime,0.12); }   // drop under the spoken Arabic
};
})();
