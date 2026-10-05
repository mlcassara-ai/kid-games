from kit import *
import math
# Array Reef (arrays: rows and columns, equal groups) on aqua ground: warm corals, purples, sand and yellow so things stand out.
def ugrad(id,x1,y1,x2,y2,stops):
    return f'<linearGradient id="{id}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">'+''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o,c in stops)+'</linearGradient>'
def dots(rows=3,cols=4,gap=7,r=2.6,fill='#1864ab'):
    out='';x0=-(cols-1)*gap/2;y0=-(rows-1)*gap/2
    for i in range(rows):
        for j in range(cols):out+=f'<circle cx="{x0+j*gap:.1f}" cy="{y0+i*gap:.1f}" r="{r}" fill="{fill}"/>'
    return out
def bubble(x,y,r):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#e7fbff" fill-opacity=".55" stroke="{O}" stroke-width="{1.4 if r<5 else 2}"/><circle cx="{x-r*.35:.1f}" cy="{y-r*.35:.1f}" r="{r*.28:.1f}" fill="#fff"/>'
def starfish(cx,cy,r,col='#ff922b',sw=2.5,rot=-90):
    pts=[]
    for i in range(10):
        a=math.radians(rot+i*36);rr=r if i%2==0 else r*.45
        pts.append((cx+rr*math.cos(a),cy+rr*math.sin(a)))
    d='M'+' '.join(f'{"Q" if i%2 else ""}' for i in range(0))
    # rounded star: straight segments with round joins
    d='M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+' Z'
    out=f'<path d="{d}" fill="{col}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
    for i in range(0,10,2):
        x,y=pts[i];out+=f'<circle cx="{(x+cx)/2:.1f}" cy="{(y+cy)/2:.1f}" r="{r*.08:.1f}" fill="#fff3bf"/>'
    return out
def kelp(x,ybot,h,sw=1,flip=1):
    d=f'M{x} {ybot} Q{x-8*flip} {ybot-h*.25} {x} {ybot-h*.5} Q{x+8*flip} {ybot-h*.75} {x+2*flip} {ybot-h}'
    return (f'<path d="{d}" stroke="{O}" stroke-width="{9*sw}" fill="none" stroke-linecap="round"/><path d="{d}" stroke="#2f9e44" stroke-width="{5*sw}" fill="none" stroke-linecap="round"/>'
            f'<path d="M{x-1*flip} {ybot-h*.3} q-{10*flip} -2 -{12*flip} -10 q{9*flip} 0 {12*flip} 8 Z M{x+2*flip} {ybot-h*.62} q{10*flip} -2 {12*flip} -10 q-{9*flip} 0 -{12*flip} 8 Z" fill="#40c057" stroke="{O}" stroke-width="{2*sw}" stroke-linejoin="round"/>')
def branch(x,ybot,s,col,dark):
    # branching coral, antler shape
    d=(f'M{x} {ybot} L{x} {ybot-22*s} L{x-12*s} {ybot-34*s} L{x-12*s} {ybot-46*s} M{x} {ybot-22*s} L{x+4*s} {ybot-40*s} L{x-2*s} {ybot-54*s} '
       f'M{x+4*s} {ybot-40*s} L{x+14*s} {ybot-50*s} M{x} {ybot-12*s} L{x+14*s} {ybot-26*s} L{x+16*s} {ybot-36*s} M{x-12*s} {ybot-34*s} L{x-20*s} {ybot-40*s}')
    return (f'<path d="{d}" stroke="{O}" stroke-width="{11*s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" stroke="{col}" stroke-width="{6*s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="M{x-1.5*s} {ybot-4*s} L{x-1.5*s} {ybot-20*s} L{x-12*s} {ybot-31*s}" stroke="#fff" stroke-opacity=".45" stroke-width="{2*s}" fill="none" stroke-linecap="round"/>')

# ---------------- entrance: a bumpy coral-rock reef arch with kelp, coral and bubbles ----------------
_ed=ugrad('rk',40,40,200,190,[(0,'#ffc2a8'),(.5,'#ff8f73'),(1,'#d9573f')])+'<clipPath id="cb"><rect x="0" y="0" width="240" height="188"/></clipPath>'
_bumps=''
_pts=[(46,188),(47,172),(48,156),(49,140),(50,124),(50,110)]
for i in range(0,181,15):
    a=math.radians(180+i);_pts.append((120+70*math.cos(a),104+66*math.sin(a)))
_pts+=[(190,110),(191,124),(192,140),(193,156),(194,172),(194,188)]
for k,(x,y) in enumerate(_pts):
    r=13 if k%2 else 15
    _bumps+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#rk)" stroke="{O}" stroke-width="4.5"/>'
_e=(shadow(120,188,104)
 +kelp(22,188,74,1,1)+kelp(222,188,64,1,-1)
 +branch(66,62,1.0,'#cc5de8','#862e9c')+branch(176,58,.9,'#ffd43b','#e67700')
 +f'<g clip-path="url(#cb)">'+_bumps
 +f'<path d="M42 190 L45 104 A75 71 0 0 1 195 104 L198 190 Z" fill="url(#rk)"/></g>'
 +f'<path d="M34 188 H206" stroke="{O}" stroke-width="4.5" stroke-linecap="round"/>'
 # brain-coral grooves and little holes on the rock
 +f'<path d="M58 150 q6 -6 12 0 t12 0 M62 166 q5 -5 10 0 t10 0 M160 150 q6 -6 12 0 t12 0 M164 168 q5 -5 10 0 M72 118 q5 -5 10 0" stroke="#b8432c" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
 +f'<circle cx="160" cy="82" r="3" fill="#b8432c"/><circle cx="170" cy="92" r="2.4" fill="#b8432c"/><circle cx="74" cy="92" r="2.6" fill="#b8432c"/><circle cx="66" cy="136" r="2.2" fill="#b8432c"/>'
 +f'<path d="M58 120 Q60 70 100 50" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>'
 # the opening, going down into the deep blue
 +f'<path d="M84 188 L84 136 A36 36 0 0 1 156 136 L156 188 Z" fill="#c2553d" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 +doorway(90,150,188,106,('#1c7ed6','#1864ab','#0f4c81','#0a3560','#06213d'))
 # plaque with a 3 by 4 array of dots
 +plaque(120,78,20,dots(3,4,7.2,2.7))
 +starfish(176,128,11,'#ffd43b',2.5,-80)
 # shells and bubbles
 +f'<path d="M60 188 q0 -14 12 -14 q12 0 12 14 Z" fill="#fff0f6" stroke="{O}" stroke-width="3" stroke-linejoin="round"/><path d="M72 188 v-12 M66 188 l3 -11 M78 188 l-3 -11" stroke="#e599b8" stroke-width="1.8"/>'
 +bubble(208,92,7)+bubble(218,72,4.5)+bubble(204,58,3.5)+bubble(30,96,5.5)+bubble(40,78,3.5)+bubble(132,24,4)
)
ENTRANCE=svg('0 0 240 200',_e,_ed)

# ---------------- BLOCK ----------------
def braincoral():
    d=grad('br','#f9b8e0','#b8459a','#e57cc0',1,1)
    b=(shadow(50,76,44)
     +f'<path d="M6 76 Q4 22 50 18 Q96 22 94 76 Z" fill="url(#br)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
     +f'<path d="M16 66 q4 -10 10 -4 t10 -6 t10 4 t10 -4 t10 6 t10 -2 t8 4 M14 52 q6 -10 12 -4 t12 -6 t12 4 t12 -6 t12 4 t10 4 M22 38 q6 -8 12 -2 t12 -6 t12 4 t12 -4 t10 6 M36 26 q6 -4 12 0 t12 0"'
       f' stroke="#8f2d76" stroke-width="2.8" fill="none" stroke-linecap="round"/>'
     +f'<path d="M14 50 Q18 28 40 22" stroke="#fff" stroke-opacity=".5" stroke-width="4.5" fill="none" stroke-linecap="round"/>')
    return svg('0 0 100 80',b,d)
def branchcoral():
    b=shadow(45,112,32)+f'<path d="M24 112 q2 -10 20 -12 q20 2 22 12 Z" fill="#c9b18a" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b+=branch(36,106,1.45,'#ff6b6b','#c92a2a')+branch(62,108,1.0,'#ff8787','#c92a2a')
    return svg('0 0 90 115',b)
def clam():
    d=grad('cl','#e5dbff','#7048e8','#9775fa',0,1)
    b=(shadow(52,76,46)
     # top shell, open
     +f'<path d="M10 46 Q8 8 52 6 Q96 8 94 46 Q52 34 10 46 Z" fill="url(#cl)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
     +f'<path d="M28 40 Q26 20 34 10 M52 36 V8 M76 40 Q78 20 70 10" stroke="#5f3dc4" stroke-width="2.5" fill="none"/>'
     +f'<path d="M14 40 Q42 30 90 40 L90 48 Q52 40 14 48 Z" fill="#fcc2d7" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<circle cx="52" cy="46" r="10" fill="#fff" stroke="{O}" stroke-width="3.5"/><circle cx="48.5" cy="42.5" r="3" fill="#fff"/><path d="M46 50 a8 8 0 0 0 12 0" stroke="#dee2e6" stroke-width="2.5" fill="none"/>'
     # bottom shell with wavy lip
     +f'<path d="M6 50 q8 -8 16 0 q8 -8 16 0 q8 -8 14 0 q8 -8 14 0 q8 -8 16 0 q8 -8 16 0 Q96 78 52 78 Q8 78 6 50 Z" fill="url(#cl)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
     +f'<path d="M22 54 Q24 68 34 74 M52 54 V76 M82 54 Q80 68 70 74" stroke="#5f3dc4" stroke-width="2.5" fill="none"/>'
     +f'<path d="M20 18 Q30 10 44 9" stroke="#fff" stroke-opacity=".6" stroke-width="4" fill="none" stroke-linecap="round"/>')
    return svg('0 0 105 80',b,d)
def anemone():
    b=shadow(45,88,34)+f'<path d="M24 88 Q20 62 45 60 Q70 62 66 88 Z" fill="#e8590c" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b+=f'<path d="M30 80 Q30 68 40 66" stroke="#fff" stroke-opacity=".45" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    for i in range(9):
        a=math.radians(-160+i*17.5);x0=45+18*math.cos(a)*.9;y0=62+6*math.sin(a)
        x1=45+40*math.cos(a);y1=58+44*math.sin(a)
        mx=(x0+x1)/2+6*math.sin(a+i);my=(y0+y1)/2
        d=f'M{x0:.1f} {y0:.1f} Q{mx:.1f} {my:.1f} {x1:.1f} {y1:.1f}'
        b+=f'<path d="{d}" stroke="{O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="{d}" stroke="#f783ac" stroke-width="5" fill="none" stroke-linecap="round"/>'
        b+=f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="3.2" fill="#fff0f6"/>'
    # a little clownfish
    b+=(f'<g transform="translate(72 30)"><path d="M10 0 l8 -6 v12 Z" fill="#ff922b" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'
        f'<ellipse cx="0" cy="0" rx="11" ry="7" fill="#ff922b" stroke="{O}" stroke-width="2.5"/><path d="M-3 -6.5 v13 M4 -6 v12" stroke="#fff" stroke-width="2.5"/><circle cx="-6" cy="-1.5" r="1.5" fill="{O}"/></g>')
    return svg('0 0 90 90',b)
def barnaclerock():
    d=grad('rk','#d0c3b0','#7f725f','#a89a85',1,1)
    b=(shadow(50,72,46)
     +f'<path d="M6 72 L12 38 Q20 16 46 12 Q78 10 90 34 L96 72 Z" fill="url(#rk)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
     +f'<path d="M16 46 Q22 24 44 18" stroke="#fff" stroke-opacity=".45" stroke-width="4.5" fill="none" stroke-linecap="round"/>')
    for x,y,r in ((30,40,8),(52,30,9),(72,44,8),(42,58,7),(66,62,6.5),(84,56,6),(22,62,6)):
        b+=f'<path d="M{x-r} {y+r*.6} L{x-r*.55} {y-r*.7} L{x+r*.55} {y-r*.7} L{x+r} {y+r*.6} Z" fill="#f1ece2" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/>'
        b+=f'<ellipse cx="{x}" cy="{y-r*.6:.1f}" rx="{r*.42:.1f}" ry="{r*.2:.1f}" fill="#3b2a1e"/>'
    b+=f'<path d="M80 30 q4 -10 10 -12" stroke="#2f9e44" stroke-width="4" fill="none" stroke-linecap="round"/>'
    return svg('0 0 100 75',b,d)
def seafan():
    F='M45 104 Q8 98 6 62 Q2 42 14 34 Q14 16 32 16 Q40 4 54 10 Q72 6 76 24 Q90 32 86 54 Q86 98 45 104 Z'
    b=shadow(45,118,26)+f'<path d="M33 118 q0 -9 12 -9 q12 0 12 9 Z" fill="#c9b18a" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b+=f'<path d="{F}" fill="#da77f2"/>'
    lat=''
    for i in range(-4,5):lat+=f'M45 104 Q{45+i*9} 70 {45+i*11} {16+abs(i)*5} '
    for y in (36,56,74,90):lat+=f'M4 {y} Q45 {y-16} 88 {y} '
    b+=f'<clipPath id="fc"><path d="{F}"/></clipPath><g clip-path="url(#fc)"><path d="{lat}" stroke="#9c36b5" stroke-width="2.4" fill="none"/>'
    b+=f'<path d="M45 108 L45 80 M45 92 L26 62 M45 92 L64 62" stroke="#862e9c" stroke-width="5" fill="none" stroke-linecap="round"/></g>'
    b+=f'<path d="{F}" fill="none" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b+=f'<path d="M45 102 V114" stroke="{O}" stroke-width="8" stroke-linecap="round"/><path d="M45 102 V113" stroke="#862e9c" stroke-width="3.5"/>'
    b+=f'<path d="M14 60 Q14 34 30 24" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/>'
    return svg('0 0 90 120',b)

# ---------------- DECO ----------------
def scallop():
    b=shadow(26,48,20)+f'<path d="M18 46 h16 l-3 6 h-10 Z" fill="#ffc9c9" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
    b+=f'<path d="M26 46 L6 24 Q8 6 26 4 Q44 6 46 24 Z" fill="#ffa8a8" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b+=f'<path d="M26 46 L12 10 M26 46 L20 6 M26 46 V4 M26 46 L32 6 M26 46 L40 10" stroke="#e03131" stroke-width="2" opacity=".8"/>'
    b+=f'<path d="M12 18 Q16 9 24 7" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    return svg('0 0 52 54',b)
def starfishdeco():
    return svg('0 0 52 52',shadow(26,46,20)+starfish(26,26,22,'#ff922b',3,-90))
def crab():
    b=(shadow(28,48,22)
     +f'<path d="M14 40 l-8 8 M18 42 l-6 8 M38 42 l6 8 M42 40 l8 8" stroke="{O}" stroke-width="3.5" stroke-linecap="round"/>'
     +f'<path d="M14 30 Q6 24 8 14 M42 30 Q50 24 48 14" stroke="{O}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 30 Q6 24 8 14 M42 30 Q50 24 48 14" stroke="#fa5252" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
     +f'<path d="M2 12 Q4 2 12 4 L9 10 L14 12 Q10 18 2 12 Z M54 12 Q52 2 44 4 L47 10 L42 12 Q46 18 54 12 Z" fill="#fa5252" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
     +f'<ellipse cx="28" cy="36" rx="16" ry="11" fill="#fa5252" stroke="{O}" stroke-width="3.2"/>'
     +f'<path d="M24 26 v-6 M32 26 v-6" stroke="{O}" stroke-width="2.5"/><circle cx="24" cy="19" r="3.4" fill="#fff" stroke="{O}" stroke-width="2"/><circle cx="32" cy="19" r="3.4" fill="#fff" stroke="{O}" stroke-width="2"/>'
     +f'<circle cx="24.5" cy="19.5" r="1.4" fill="{O}"/><circle cx="32.5" cy="19.5" r="1.4" fill="{O}"/>'
     +f'<path d="M22 40 q6 4 12 0" stroke="{O}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M17 33 q4 -5 10 -6" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    return svg('0 0 56 54',b)
def urchin():
    b=shadow(26,48,18)
    sp=''
    for i in range(15):
        a=math.radians(180+i*12.86);sp+=f'M{26+10*math.cos(a):.1f} {38+10*math.sin(a):.1f} L{26+24*math.cos(a):.1f} {40+26*math.sin(a):.1f} '
    b+=f'<path d="{sp}" stroke="{O}" stroke-width="4.5" stroke-linecap="round"/><path d="{sp}" stroke="#7048e8" stroke-width="2" stroke-linecap="round"/>'
    b+=f'<path d="M10 46 Q10 26 26 26 Q42 26 42 46 Z" fill="#5f3dc4" stroke="{O}" stroke-width="3" stroke-linejoin="round"/><path d="M16 40 Q17 32 24 30" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    return svg('0 0 52 52',b)
def kelpdeco():
    b=shadow(24,56,16)+kelp(18,56,50,.7,1)+kelp(32,56,38,.6,-1)+bubble(40,10,3.5)
    return svg('0 0 48 58',b)

# ---------------- EXTRA ----------------
def sanddollar():
    b=(f'<ellipse cx="20" cy="26" rx="13" ry="2.2" fill="rgba(0,0,0,.15)"/><ellipse cx="20" cy="17" rx="13" ry="10" fill="#f1e3c8" stroke="{O}" stroke-width="2"/>'
       +''.join(f'<ellipse cx="{20+5.5*math.cos(math.radians(-90+i*72)):.1f}" cy="{17+4.2*math.sin(math.radians(-90+i*72)):.1f}" rx="1.4" ry="2.6" transform="rotate({i*72} {20+5.5*math.cos(math.radians(-90+i*72)):.1f} {17+4.2*math.sin(math.radians(-90+i*72)):.1f})" fill="#b89b6e"/>' for i in range(5)))
    return svg('0 0 40 30',b)
def pebbles():
    b=(f'<ellipse cx="12" cy="22" rx="8" ry="5.5" fill="#c9b18a" stroke="{O}" stroke-width="2"/><ellipse cx="26" cy="20" rx="6" ry="4.5" fill="#e9d8b4" stroke="{O}" stroke-width="2"/>'
       +f'<ellipse cx="33" cy="25" rx="4" ry="3" fill="#a89a85" stroke="{O}" stroke-width="1.8"/><path d="M8 20 q2 -2 5 -2" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" fill="none"/>')
    return svg('0 0 40 30',b)
def smallshells():
    b=(f'<path d="M6 26 q0 -12 9 -12 q9 0 9 12 Z" fill="#fcc2d7" stroke="{O}" stroke-width="2" stroke-linejoin="round"/><path d="M15 26 v-10 M11 26 l2 -9 M19 26 l-2 -9" stroke="#e64980" stroke-width="1.2"/>'
       +f'<path d="M28 26 q-6 0 -6 -6 q0 -6 7 -6 q5 1 5 6 q0 4 -4 4 q-3 0 -3 -3" fill="#ffe8cc" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>')
    return svg('0 0 40 30',b)

BLOCK=[('reef_brain',braincoral(),1.0,.8),('reef_branch',branchcoral(),.9,1.15),('reef_clam',clam(),1.05,.8),
       ('reef_anemone',anemone(),.9,.9),('reef_rock',barnaclerock(),1.0,.75),('reef_fan',seafan(),.9,1.2)]
DECO=[('reef_scallop',scallop(),.5,.52),('reef_star',starfishdeco(),.5,.5),('reef_crab',crab(),.56,.54),('reef_urchin',urchin(),.5,.5),('reef_kelp',kelpdeco(),.48,.58)]
EXTRA=[('reef_dollar',sanddollar(),.4,.3),('reef_pebbles',pebbles(),.4,.3),('reef_shells',smallshells(),.4,.3)]
