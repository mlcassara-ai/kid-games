/* Map music for Language Quest: three bright Arabic-style tunes plus one playful children's tune, each made live on the device with Web Audio (no audio
   files), so none of them repeats exactly. Each has a lead instrument, a plucked bass and a soft hand drum; there is no held
   background tone. The .5 steps in the scales are quarter tones. Plays on the world map only.
   Volume and tune are remembered on the device. window.LQMusic = { start, setVol, vol, tracks, track, setTrack, duck, mute }. */
(function(){
"use strict";
const KEY="languagequest.music", TKEY="languagequest.track";
const TRACKS=[
 // maqam Rast on D, oud lead, maqsum drum
 {id:"oasis", name:"Oasis Morning", bpm:94, base:62, scale:[0,2,3.5,5,7,9,10.5], lead:"oud", bass:[50,57,50,55],
  drum:[[0,"d"],[1,"t"],[3,"t"],[4,"d"],[6,"t"]], rest:0.1,
  rhythms:[[2,2,4],[2,1,1,4],[1,1,2,4],[1,1,2,2,2],[3,1,2,2],[2,2,2,2],[1,1,1,1,4],[2,1,1,2,2],[1,1,1,1,2,2]]},
 // maqam Bayati on D, bright qanun lead, quick malfuf drum
 {id:"souq", name:"Souq Dance", bpm:108, base:74, scale:[0,1.5,3,5,7,8,10], lead:"qanun", bass:[50,50,55,57],
  drum:[[0,"d"],[3,"t"],[6,"t"],[7,"t"]], rest:0.06, chords:true,
  rhythms:[[1,1,2,1,1,2],[2,1,1,2,2],[1,1,1,1,2,2],[2,2,1,1,2],[1,1,2,4],[3,1,1,1,2],[2,2,2,2]]},
 // maqam Nahawand on G, flute-like ney lead over an oud pattern, saidi drum
 {id:"breeze", name:"Evening Breeze", bpm:84, base:67, scale:[0,2,3,5,7,8,10], lead:"ney", bass:[43,50,43,48],
  drum:[[0,"d"],[1,"t"],[3,"d"],[4,"d"],[6,"t"]], rest:0.12, arp:[0,4,7,4],
  rhythms:[[4,4],[2,2,4],[3,1,4],[2,6],[4,2,2],[6,2],[2,2,2,2]]},
 // a children's tune: maqam Ajam (the plain major scale) on C, a music-box lead and a bouncy bass.
 // "motif" makes it singable: a short phrase is played, repeated, answered and played again, like a nursery rhyme.
 {id:"play", name:"Playtime", bpm:112, base:72, scale:[0,2,4,5,7,9,11], lead:"bell", bass:[48,55,53,55],
  drum:[[0,"d"],[2,"t"],[4,"d"],[6,"t"]], rest:0, motif:true,
  rhythms:[[2,2,2,2],[1,1,2,2,2],[2,1,1,2,2],[2,2,4],[1,1,1,1,2,2],[2,2,1,1,2]]}
];
let vol=0.6; try{ const v=parseFloat(localStorage.getItem(KEY)); if(!isNaN(v)) vol=Math.max(0,Math.min(1,v)); }catch(e){}
let T=TRACKS.find(t=>t.id==="play"); try{ T=TRACKS.find(t=>t.id===localStorage.getItem(TKEY))||T; }catch(e){}      // Playtime unless the player picked another
let ctx=null, master=null, duckG=null, noise=null, timer=null, barAt=0, bar=0, deg=0, muted=false;
const hz=m=>440*Math.pow(2,(m-69)/12);
const pitch=d=>T.base+12*Math.floor(d/7)+T.scale[((d%7)+7)%7];
const pick=a=>a[Math.random()*a.length|0];

function voice(t,m,vol,len,parts,cut0,cut1,attack){      // a note: a few oscillators through a filter that closes as it fades
  const g=ctx.createGain(), f=ctx.createBiquadFilter(); f.type="lowpass"; f.Q.value=1.1;
  f.frequency.setValueAtTime(cut0,t); f.frequency.exponentialRampToValueAtTime(cut1,t+Math.min(len,0.9));
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+attack); g.gain.exponentialRampToValueAtTime(0.0001,t+len);
  for(const [type,cents,k] of parts){ const o=ctx.createOscillator(), og=ctx.createGain(); o.type=type; o.frequency.value=hz(m); o.detune.value=cents; og.gain.value=k;
    o.connect(og); og.connect(f); o.start(t); o.stop(t+len+0.05); }
  f.connect(g); g.connect(duckG);
}
const oud=(t,m,v,len)=>voice(t,m,v,len,[["triangle",0,1],["sawtooth",5,0.28],["triangle",1200,0.12]],3600,1100,0.008);
const qanun=(t,m,v,len)=>voice(t,m,v*0.8,Math.min(len,0.9),[["triangle",0,1],["square",1200,0.1],["sawtooth",-6,0.22],["triangle",1900,0.08]],5200,1500,0.004);
function ney(t,m,v,len){                                   // breathy flute: slow start, a little vibrato, a puff of air
  const g=ctx.createGain(), o=ctx.createOscillator(), o2=ctx.createOscillator(), g2=ctx.createGain(), lfo=ctx.createOscillator(), lg=ctx.createGain();
  o.type="sine"; o.frequency.value=hz(m); o2.type="triangle"; o2.frequency.value=hz(m)*2; g2.gain.value=0.16;
  lfo.frequency.value=5.2; lg.gain.value=hz(m)*0.006; lfo.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v*0.9,t+0.07); g.gain.setValueAtTime(v*0.9,t+Math.max(0.08,len-0.12)); g.gain.exponentialRampToValueAtTime(0.0001,t+len);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(duckG); [o,o2,lfo].forEach(x=>{ x.start(t); x.stop(t+len+0.05); });
  const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), ng=ctx.createGain(); s.buffer=noise; s.loop=true; f.type="bandpass"; f.frequency.value=hz(m)*2; f.Q.value=4;
  ng.gain.setValueAtTime(v*0.12,t); ng.gain.exponentialRampToValueAtTime(0.0001,t+Math.min(len,0.25)); s.connect(f); f.connect(ng); ng.connect(duckG); s.start(t); s.stop(t+len);
}
const bell=(t,m,v,len)=>voice(t,m,v*0.9,Math.max(0.6,Math.min(len,1.2)),[["sine",0,1],["sine",1200,0.35],["sine",1902,0.12],["triangle",0,0.2]],6000,2200,0.003);
const LEAD={oud,qanun,ney,bell};
// a short singable phrase for the children's tune: small steps, staying inside one octave
let motif=null;
const phrase=()=>{ let d=pick([0,2,4]); return pick(T.rhythms).map(len=>{ const n={len,deg:d}; d=Math.max(0,Math.min(7,d+pick([-2,-1,-1,1,1,1,2,0]))); return n; }); };
function dum(t,v){ const o=ctx.createOscillator(), g=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(58,t+0.18);
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.32); o.connect(g); g.connect(duckG); o.start(t); o.stop(t+0.35); }
function tek(t,v){ const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=noise; f.type="bandpass"; f.frequency.value=2600; f.Q.value=1.5;
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.07); s.connect(f); f.connect(g); g.connect(duckG); s.start(t); s.stop(t+0.09); }

// one bar = eight eighth notes. The tune wanders by small steps, breathes with rests, and comes home every fourth bar.
function playBar(t){
  const E=60/T.bpm/2, home=bar%4===3, quiet=!home&&Math.random()<T.rest, play=LEAD[T.lead];
  T.drum.forEach(([i,k])=>k==="d"?dum(t+i*E,0.15):tek(t+i*E,0.05)); if(bar%2) tek(t+7*E,0.03);
  oud(t,T.bass[bar%4],0.16,0.7); oud(t+4*E,T.bass[(bar+1)%4],0.11,0.6);                        // plucked bass, no held tone
  if(T.arp) T.arp.forEach((st,i)=>oud(t+(i*2+1)*E,T.bass[bar%4]+12+st,0.07,0.5));                // light oud pattern under the flute
  if(T.chords&&bar%2===0) [0,2,4].forEach((d,i)=>qanun(t+i*0.03,pitch(d)-12,0.07,0.8));          // a soft strum to open the bar
  if(T.motif){ if(!motif||bar%16===0) motif={A:phrase(),B:phrase()};          // phrase, phrase again, an answer, phrase home
    const which=bar%4, notes=(which===2?motif.B:motif.A).map(n=>({len:n.len,deg:n.deg})); if(which===1) notes[notes.length-1].deg=4; if(which===3) notes[notes.length-1].deg=0;
    let at=0; notes.forEach(n=>{ play(t+at*E,pitch(n.deg),0.2,n.len*E*1.4); at+=n.len; }); if(which===3) play(t+at*E-notes[notes.length-1].len*E,pitch(7),0.1,0.9);
    oud(t+2*E,T.bass[bar%4]+12,0.07,0.3); oud(t+6*E,T.bass[(bar+1)%4]+12,0.07,0.3); }
  else if(!quiet){ let at=0; const r=home?pick([[2,2,4],[2,6],[1,1,2,4]]):pick(T.rhythms);
    r.forEach((len,i)=>{ const last=i===r.length-1;
      deg=home&&last?(deg>3?7:0):Math.max(-1,Math.min(11,deg+pick([-2,-1,-1,0,1,1,1,2,2])));
      const m=pitch(deg), start=t+at*E;
      if(T.lead==="ney") ney(start,m,0.2,len*E*0.96);
      else if(len>=4&&Math.random()<0.4){ for(let k=0;k<len*2;k++) play(start+k*E/2,m,k?0.10:0.2,0.3); }   // a long note as a soft tremolo
      else play(start,m,0.22,Math.max(0.5,len*E*1.5));
      if(last&&home&&T.lead!=="ney") play(start,m-12,0.14,len*E*1.8);
      at+=len; }); }
  bar++; return 8*E;
}
function tick(){ if(!ctx) return; while(barAt<ctx.currentTime+0.6){ barAt=Math.max(barAt,ctx.currentTime+0.05); barAt+=playBar(barAt); } }
function level(){ if(master) master.gain.setTargetAtTime(muted?0:vol*1.3,ctx.currentTime,0.25); }
function start(){ if(!vol||muted) return;
  try{
    if(!ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC();
      master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination); duckG=ctx.createGain(); duckG.connect(master);
      noise=ctx.createBuffer(1,ctx.sampleRate*0.3,ctx.sampleRate); const d=noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      barAt=ctx.currentTime+0.3; }
    if(ctx.state==="suspended") ctx.resume();
    level(); if(!timer){ if(barAt<ctx.currentTime) barAt=ctx.currentTime+0.2; timer=setInterval(tick,120); tick(); }
  }catch(e){}
}
function stop(){ if(timer){ clearInterval(timer); timer=null; } if(ctx) level(); }
document.addEventListener("visibilitychange",()=>{ if(!ctx) return; if(document.hidden){ stop(); ctx.suspend(); } else if(vol&&!muted) start(); });
window.LQMusic={ start, vol:()=>vol,
  setVol(v){ vol=Math.max(0,Math.min(1,+v||0)); try{ localStorage.setItem(KEY,String(vol)); }catch(e){} vol?start():stop(); },
  tracks:()=>TRACKS.map(t=>({id:t.id,name:t.name})), track:()=>T.id,
  setTrack(id){ const t=TRACKS.find(x=>x.id===id); if(!t) return; T=t; deg=0; bar=0; motif=null; try{ localStorage.setItem(TKEY,id); }catch(e){} if(ctx) barAt=ctx.currentTime+0.25; start(); },
  mute(v){ muted=!!v; muted?stop():start(); },                                   // follows the map's main sound setting
  duck(v){ if(duckG) duckG.gain.setTargetAtTime(v?0.22:1,ctx.currentTime,0.12); }   // drop under the spoken Arabic
};
})();
