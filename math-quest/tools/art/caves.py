"""Subtraction Caves scenery: warm brown-grey stalagmites, dark boulders and rock piles, glowing blue and purple crystals,
a mine cart on track, a timber mine support; small gems, bones, crystals, a lantern, glowing mushrooms; pebbles and crystal chips.
The Cave Mouth entrance already exists (ENTRANCE = None)."""
from kit import *
ENTRANCE=None

def P(w,h,body,defs=''):return svg(f'0 0 {w*100:g} {h*100:g}',body,defs)
STONE=('#b3aca6','#5e5853','#857e78')     # warm stalagmite stone (stands out on the cool grey ground)
ROCK=('#8a8ea3','#3f4252','#636779')      # dark cool boulder stone
BLUE=('#c5f6fa','#1c7ed6','#4dabf7')
PURP=('#f3d9fa','#7048e8','#b197fc')
def hl(d,w=3):return f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="{w}" stroke-linecap="round"/>'
def crystal(x,y,w,h,ang,gid,sw=3.5):
    """one six-sided crystal standing at (x,y), leaning ang degrees, with a lit left face"""
    a=x-w/2;b=x+w/2;s=y-h*.78;t=y-h
    return (f'<g transform="rotate({ang} {x} {y})"><path d="M{a:.1f} {y} L{a:.1f} {s:.1f} L{x:.1f} {t:.1f} L{b:.1f} {s:.1f} L{b:.1f} {y} Z" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
            f'<path d="M{a+w*.12:.1f} {y-2} L{a+w*.12:.1f} {s+2:.1f} L{x-w*.05:.1f} {t+h*.08:.1f} L{x-w*.05:.1f} {y-2} Z" fill="#fff" opacity=".35"/>'
            f'<path d="M{x+w*.18:.1f} {y-3} L{x+w*.18:.1f} {s+h*.05:.1f}" stroke="#fff" stroke-opacity=".5" stroke-width="{sw*.6:.1f}" stroke-linecap="round"/></g>')
def glow(cx,cy,r,c):return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c}" opacity=".28"/><circle cx="{cx}" cy="{cy}" r="{r*.62:.1f}" fill="{c}" opacity=".3"/>'

# ---------------- BLOCK ----------------
stalag=P(.8,1.3,shadow(40,124,30)+
 f'<path d="M10 124 Q16 100 22 84 Q28 50 36 14 Q40 6 44 14 Q52 50 58 84 Q64 100 70 124 Z" fill="url(#s)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M24 92 q8 -3 16 1 M30 62 q6 -2 11 1 M50 104 q6 -2 12 2" stroke="#4a4541" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>'
 +hl('M37 22 Q30 60 22 110',3.5),grad('s',*STONE))

stalag3=P(1.1,1.2,shadow(55,114,46)+
 f'<path d="M58 114 Q62 70 70 40 Q74 30 78 40 Q86 74 96 114 Z" fill="url(#s)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M22 114 Q30 60 44 10 Q48 2 52 10 Q62 60 72 114 Z" fill="url(#s)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M6 114 Q10 86 18 64 Q21 58 24 64 Q32 86 36 114 Z" fill="url(#s)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M34 80 q8 -3 16 1 M40 46 q5 -2 9 1" stroke="#4a4541" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>'
 +hl('M45 18 Q38 60 32 104',3.5)+hl('M16 72 Q12 90 11 106',3)+hl('M71 46 Q66 76 64 104',3),grad('s',*STONE))

boulder=P(1.1,.9,shadow(55,84,48)+
 f'<path d="M8 84 Q4 56 20 40 Q32 18 58 16 Q86 16 98 42 Q108 62 102 84 Z" fill="url(#r)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M58 16 Q54 40 66 52 Q78 60 102 62 M40 84 Q42 66 66 52" stroke="{O}" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".55"/>'
 f'<path d="M84 84 Q92 72 106 74 L104 84 Z" fill="#4c5060" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
 +hl('M18 50 Q28 30 48 24',4),grad('r',*ROCK))

def crystals(gid,cols):
    return P(1,1.15,glow(50,66,46,cols[0])+shadow(50,110,40)+
     f'<path d="M14 110 q4 -14 18 -14 q10 -10 26 -6 q16 -6 28 8 q8 4 6 12 Z" fill="#555a6b" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +crystal(26,104,16,52,-24,gid)+crystal(76,104,16,58,22,gid)+crystal(50,104,24,94,0,gid,4.5)+crystal(38,108,12,36,-8,gid)+crystal(64,108,12,40,10,gid),
     grad(gid,*cols))
crysb=crystals('cb',BLUE)
crysp=crystals('cp',PURP)

cart=P(1.15,.9,shadow(57,86,50)+
 # track: two rails and ties
 ''.join(f'<rect x="{x}" y="72" width="10" height="14" rx="2" fill="#8b5a2b" stroke="{O}" stroke-width="2.5"/>' for x in (6,28,52,76,98))+
 f'<path d="M2 78 h111" stroke="#495057" stroke-width="5" stroke-linecap="round"/><path d="M2 78 h111" stroke="{O}" stroke-width="1.5" opacity=".5"/>'
 # load of gold nuggets and crystals
 f'<path d="M24 34 q6 -14 18 -10 q8 -12 20 -4 q10 -10 22 0 q10 0 10 14 Z" fill="#fcc419" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
 f'<path d="M36 28 l4 -3 M58 22 l5 -2 M76 24 l4 2" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>'
 +crystal(64,34,10,24,14,'cc',3)+
 # body
 f'<path d="M14 32 h88 l-10 34 h-68 Z" fill="url(#m)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M14 32 h88" stroke="#adb5bd" stroke-width="6" stroke-linecap="round"/><path d="M12 32 h92" stroke="{O}" stroke-width="2" opacity=".5"/>'
 f'<path d="M40 36 v28 M76 36 v28" stroke="{O}" stroke-width="2.4" opacity=".45"/>'
 f'<circle cx="24" cy="40" r="2" fill="{O}"/><circle cx="92" cy="40" r="2" fill="{O}"/>'
 +hl('M22 42 L28 60',3)+
 f'<circle cx="36" cy="70" r="9" fill="#495057" stroke="{O}" stroke-width="3.5"/><circle cx="36" cy="70" r="3" fill="#ced4da"/>'
 f'<circle cx="80" cy="70" r="9" fill="#495057" stroke="{O}" stroke-width="3.5"/><circle cx="80" cy="70" r="3" fill="#ced4da"/>',
 grad('m','#c06a3e','#7a3b1d','#a0522d')+grad('cc',*BLUE))

beam=P(1,1.3,shadow(50,124,44)+
 f'<rect x="10" y="20" width="19" height="104" rx="2" fill="url(#w)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<rect x="71" y="20" width="19" height="104" rx="2" fill="url(#w)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<rect x="4" y="10" width="92" height="18" rx="2" fill="url(#w)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M28 30 L44 28 M72 30 L56 28" stroke="{O}" stroke-width="3"/>'
 f'<path d="M30 40 L42 28 M70 40 L58 28" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/><path d="M30 40 L42 28 M70 40 L58 28" stroke="{O}" stroke-width="1.6" opacity=".45"/>'
 f'<path d="M20 50 v18 M80 60 v22 M14 19 h30 M60 18 h28" stroke="{O}" stroke-width="1.8" opacity=".4" stroke-linecap="round"/>'
 f'<circle cx="20" cy="18" r="2" fill="{O}"/><circle cx="80" cy="18" r="2" fill="{O}"/>'
 +hl('M16 30 v86',3)+hl('M76 30 v86',3)+hl('M10 14 h30',3)+
 # hanging lantern
 glow(50,54,20,'#fff3bf')+f'<path d="M50 28 v14" stroke="{O}" stroke-width="2"/>'
 f'<path d="M43 44 h14 l-2 18 h-10 Z" fill="#ffe066" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/><path d="M42 42 h16 M43 63 h14" stroke="{O}" stroke-width="3" stroke-linecap="round"/>'
 f'<path d="M50 48 q3 5 0 10 q-3 -5 0 -10 Z" fill="#ff922b"/>'
 # rocks at the feet
 f'<path d="M6 124 q2 -10 10 -10 q8 0 8 10 Z M78 124 q2 -8 9 -8 q8 0 9 8 Z" fill="#636779" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>',
 grad('w','#c8945c','#7a4a22','#a0703c'))

rockpile=P(1.1,.95,shadow(55,90,48)+
 ''.join(f'<path d="{d}" fill="url(#r)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>' for d in (
 'M8 90 Q6 70 20 64 Q34 58 42 72 Q46 84 44 90 Z',
 'M66 90 Q64 72 80 66 Q98 62 104 78 Q106 86 104 90 Z',
 'M36 90 Q34 66 52 60 Q72 56 76 76 Q78 86 74 90 Z',
 'M26 64 Q26 44 42 40 Q56 38 60 54 Q62 64 56 68 Q40 72 26 64 Z',
 'M54 62 Q56 46 70 44 Q84 44 86 58 Q84 68 70 68 Z',
 'M40 40 Q42 24 56 22 Q70 24 70 38 Q68 48 56 48 Q44 48 40 40 Z'))+
 hl('M14 72 q6 -6 14 -6',3)+hl('M32 50 q4 -6 12 -6',3)+hl('M46 30 q4 -4 10 -4',3)+hl('M42 68 q4 -4 10 -4',3)+hl('M60 52 q4 -4 10 -4',3)+
 f'<path d="M76 72 l8 2 M52 30 l4 6" stroke="{O}" stroke-width="2" opacity=".5" stroke-linecap="round"/>',grad('r',*ROCK))

BLOCK=[('caves_stalag',stalag,.8,1.3),('caves_stalags',stalag3,1.1,1.2),('caves_boulder',boulder,1.1,.9),
 ('caves_crys_blue',crysb,1,1.15),('caves_crys_purple',crysp,1,1.15),('caves_cart',cart,1.15,.9),('caves_beam',beam,1,1.3),('caves_rocks',rockpile,1.1,.95)]

# ---------------- DECO ----------------
def gem(cx,cy,r,a,b,gid):
    return (f'<path d="M{cx-r} {cy-r*.35} L{cx-r*.55} {cy-r*.9} L{cx+r*.55} {cy-r*.9} L{cx+r} {cy-r*.35} L{cx} {cy+r} Z" fill="url(#{gid})" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/>'
            f'<path d="M{cx-r} {cy-r*.35} H{cx+r} M{cx-r*.35} {cy-r*.35} L{cx} {cy+r} L{cx+r*.35} {cy-r*.35} M{cx-r*.55} {cy-r*.9} L{cx-r*.35} {cy-r*.35} M{cx+r*.55} {cy-r*.9} L{cx+r*.35} {cy-r*.35}" stroke="{O}" stroke-width="1.3" fill="none" opacity=".55"/>'
            f'<path d="M{cx-r*.75} {cy-r*.45} L{cx-r*.45} {cy-r*.8}" stroke="#fff" stroke-width="2" stroke-opacity=".8" stroke-linecap="round"/>')
gems=P(.55,.45,shadow(27,41,22)+glow(22,24,17,'#ffe3e3')+gem(20,26,14,0,0,'g1')+gem(40,30,10,0,0,'g2')+gem(31,38,6,0,0,'g3'),
 grad('g1','#ffc9c9','#c92a2a','#fa5252')+grad('g2','#d3f9d8','#2b8a3e','#51cf66')+grad('g3','#fff3bf','#e67700','#fcc419'))

bones=P(.55,.4,shadow(27,36,22)+
 ''.join(f'<g transform="rotate({a} 27 24)"><path d="M10 24 H44" stroke="{O}" stroke-width="7.5" stroke-linecap="round"/><path d="M10 24 H44" stroke="#f8f0dc" stroke-width="3.5" stroke-linecap="round"/>'
         f'<circle cx="8" cy="20.5" r="4.2" fill="#f8f0dc" stroke="{O}" stroke-width="2.2"/><circle cx="8" cy="27.5" r="4.2" fill="#f8f0dc" stroke="{O}" stroke-width="2.2"/>'
         f'<circle cx="46" cy="20.5" r="4.2" fill="#f8f0dc" stroke="{O}" stroke-width="2.2"/><circle cx="46" cy="27.5" r="4.2" fill="#f8f0dc" stroke="{O}" stroke-width="2.2"/>'
         f'<path d="M12 24 H42" stroke="#f8f0dc" stroke-width="4" stroke-linecap="round"/></g>' for a in (-22,22)))

smallcrys=P(.5,.55,glow(25,32,22,'#d0ebff')+shadow(25,51,18)+crystal(17,50,9,26,-20,'c',2.6)+crystal(33,50,9,22,22,'c',2.6)+crystal(25,51,12,40,0,'c',2.8),grad('c',*BLUE))
smallcrysp=P(.5,.55,glow(25,32,22,'#e5dbff')+shadow(25,51,18)+crystal(17,50,9,22,-18,'c',2.6)+crystal(33,50,9,28,20,'c',2.6)+crystal(26,51,12,36,4,'c',2.8),grad('c',*PURP))

lantern=P(.4,.6,glow(20,32,19,'#fff3bf')+shadow(20,57,14)+
 f'<path d="M20 4 q-8 0 -8 8" stroke="{O}" stroke-width="2.4" fill="none"/><path d="M20 4 q8 0 8 8" stroke="{O}" stroke-width="2.4" fill="none"/>'
 f'<path d="M10 14 h20 l-3 4 h-14 Z" fill="#495057" stroke="{O}" stroke-width="2.4" stroke-linejoin="round"/>'
 f'<rect x="12" y="18" width="16" height="28" rx="3" fill="#ffe066" stroke="{O}" stroke-width="2.6"/>'
 f'<path d="M20 24 q5 7 0 15 q-5 -8 0 -15 Z" fill="#ff922b" stroke="#e8590c" stroke-width="1"/>'
 f'<path d="M20 18 v28" stroke="{O}" stroke-width="1.4" opacity=".4"/><path d="M15 22 v18" stroke="#fff" stroke-width="2" stroke-opacity=".7" stroke-linecap="round"/>'
 f'<path d="M9 46 h22 l-2 8 h-18 Z" fill="#495057" stroke="{O}" stroke-width="2.4" stroke-linejoin="round"/>')

mush=P(.5,.5,glow(25,28,23,'#c3fae8')+shadow(25,46,18)+
 f'<path d="M14 46 v-12 h6 v12 Z M30 46 v-16 h7 v16 Z" fill="#e6fcf5" stroke="{O}" stroke-width="2.4"/>'
 f'<path d="M24 32 q2 -18 9.5 -18 q9 0 11 18 Z" fill="url(#m)" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/>'
 f'<path d="M6 36 q1 -12 11 -12 q10 0 11 12 Z" fill="url(#m)" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/>'
 f'<circle cx="30" cy="22" r="1.8" fill="#fff"/><circle cx="37" cy="26" r="1.5" fill="#fff"/><circle cx="13" cy="30" r="1.6" fill="#fff"/><circle cx="20" cy="29" r="1.3" fill="#fff"/>',
 grad('m','#c3fae8','#0ca678','#38d9a9'))

DECO=[('caves_gems',gems,.55,.45),('caves_bones',bones,.55,.4),('caves_crys_small',smallcrys,.5,.55),('caves_crys_small2',smallcrysp,.5,.55),
 ('caves_lantern',lantern,.4,.6),('caves_glowshroom',mush,.5,.5)]

# ---------------- EXTRA ----------------
pebbles=P(.4,.3,f'<path d="M3 28 q1 -8 7 -8 q6 0 7 8 Z M19 28 q2 -12 9 -12 q8 0 9 12 Z M14 29 q1 -4 4 -4 q3 0 4 4 Z" fill="#636779" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'
 f'<path d="M23 20 q3 -2 5 -2" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>')
chips=P(.4,.3,crystal(14,29,6,16,-14,'c',2)+crystal(24,29,6,22,8,'c',2)+crystal(32,29,5,12,24,'d',2),grad('c',*BLUE)+grad('d',*PURP))
EXTRA=[('caves_pebbles',pebbles,.4,.3),('caves_chips',chips,.4,.3)]
