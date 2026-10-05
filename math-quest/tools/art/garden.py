from kit import *
import math
# Graph Garden (graphs and charts) on light green ground: dark hedges, warm wood, bright flowers so things stand out.
def flower(cx,cy,r,petal,mid='#ffd43b',n=5,sw=2):
    out=''
    for i in range(n):
        a=math.radians(-90+i*360/n);x=cx+r*.62*math.cos(a);y=cy+r*.62*math.sin(a)
        out+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.5:.1f}" fill="{petal}" stroke="{O}" stroke-width="{sw}"/>'
    return out+f'<circle cx="{cx}" cy="{cy}" r="{r*.38:.1f}" fill="{mid}" stroke="{O}" stroke-width="{sw}"/>'
def tulip(x,y,col,h=18,sw=2.2):
    return (f'<path d="M{x} {y} q1 -{h*.5} 0 -{h}" stroke="#2f9e44" stroke-width="{sw+.8}" fill="none" stroke-linecap="round"/>'
            f'<path d="M{x-5} {y-h} l0 -8 l2.5 3 l2.5 -5 l2.5 5 l2.5 -3 l0 8 q-5 5 -10 0 Z" fill="{col}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>')
def bars(s=1):
    # a tiny bar chart centred on 0,0
    return (f'<path d="M{-10*s} {-10*s} V{9*s} H{11*s}" stroke="{O}" stroke-width="{2.4*s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<rect x="{-7*s}" y="{1*s}" width="{4.6*s}" height="{8*s}" fill="#4dabf7" stroke="{O}" stroke-width="{1.4*s}"/>'
            f'<rect x="{-1.2*s}" y="{-8*s}" width="{4.6*s}" height="{17*s}" fill="#ff6b6b" stroke="{O}" stroke-width="{1.4*s}"/>'
            f'<rect x="{4.6*s}" y="{-3*s}" width="{4.6*s}" height="{12*s}" fill="#fcc419" stroke="{O}" stroke-width="{1.4*s}"/>')
def fence(x0,x1,ytop,ybot):
    x1=x0+int((x1-x0)/11)*11
    out=f'<path d="M{x0} {ytop+8} H{x1} M{x0} {ybot-8} H{x1}" stroke="{O}" stroke-width="7" stroke-linecap="round"/><path d="M{x0} {ytop+8} H{x1} M{x0} {ybot-8} H{x1}" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'
    x=x0
    while x<=x1+.1:
        out+=f'<path d="M{x-4} {ybot} V{ytop+4} L{x} {ytop-2} L{x+4} {ytop+4} V{ybot} Z" fill="#fff" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
        x+=11
    return out

# ---------------- entrance: a hedge arch with a wooden arbor, flowers and picket fences ----------------
_ed=grad('hg','#7fd36b','#2b7a33','#4fa847',1,1)+grad('wd','#c98a54','#8b5a2b')
_e=(shadow(120,188,104)
 +fence(12,48,150,188)+fence(195,228,150,188)
 # the hedge: a big rounded green block
 +f'<path d="M50 188 L50 92 Q50 62 80 60 Q90 38 120 38 Q150 38 160 60 Q190 62 190 92 L190 188 Z" fill="url(#hg)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 +f'<path d="M58 120 Q56 80 82 70 M96 52 Q110 44 126 46" stroke="#c0eb75" stroke-opacity=".7" stroke-width="5" fill="none" stroke-linecap="round"/>'
 +f'<path d="M70 150 q6 -6 12 0 M166 132 q6 -6 12 0 M64 100 q6 -6 12 0 M170 170 q6 -6 12 0 M150 84 q6 -6 12 0" stroke="#2b7a33" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
 # wooden arbor posts and arch round the door
 +f'<path d="M80 188 L80 128 A40 40 0 0 1 160 128 L160 188 L148 188 L148 128 A28 28 0 0 0 92 128 L92 188 Z" fill="url(#wd)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 +doorway(92,148,188,100,('#3f8f3a','#2f7030','#215325','#15381a','#0b2210'))
 # flowers climbing the arbor
 +flower(84,132,9,'#ff6b6b')+flower(92,106,8,'#f783ac')+flower(108,92,8,'#fcc419','#e8590c')
 +flower(156,132,9,'#ff6b6b')+flower(148,106,8,'#f783ac')+flower(158,160,8,'#fcc419','#e8590c')+flower(82,162,8,'#fcc419','#e8590c')
 +flower(64,84,7,'#fff','#fcc419')+flower(176,96,7,'#fff','#fcc419')+flower(150,58,6.5,'#fff','#fcc419')+flower(68,176,6.5,'#f783ac')+flower(176,180,6.5,'#ff6b6b')
 # the plaque with a tiny bar chart
 +plaque(120,74,19,bars(1.05))
 # tulips in front of the fences
 +tulip(24,188,'#ff6b6b')+tulip(36,188,'#fcc419')+tulip(204,188,'#f783ac')+tulip(216,188,'#ff6b6b')
)
ENTRANCE=svg('0 0 240 200',_e,_ed)

# ---------------- BLOCK ----------------
def beds():
    # three raised beds of different heights: a bar chart you can grow
    d=grad('wd','#d9a066','#9c6234')
    b=shadow(55,94,48)
    for x,h,col in ((8,26,'#ff6b6b'),(40,58,'#4dabf7'),(72,42,'#fcc419')):
        top=94-h
        b+=f'<rect x="{x}" y="{top}" width="30" height="{h}" rx="2" fill="url(#wd)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
        b+=f'<path d="M{x} {top+10} h30" stroke="#7a4a22" stroke-width="2"/>'
        b+=f'<path d="M{x+3} {top+4} h24" stroke="#fff" stroke-opacity=".4" stroke-width="2.5" stroke-linecap="round"/>'
        b+=f'<path d="M{x+2} {top} q4 -9 8 -1 q5 -10 10 -1 q4 -8 8 1 Z" fill="#51cf66" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
        b+=flower(x+8,top-8,7,col,'#fff3bf',5,2)+flower(x+22,top-6,6,col,'#fff3bf',5,2)
    return svg('0 0 110 100',b,d)
def sunflowers():
    b=(shadow(40,132,26)
     +f'<path d="M30 132 Q28 80 30 40 M54 132 Q56 96 54 64" stroke="{O}" stroke-width="7.5" fill="none" stroke-linecap="round"/>'
     +f'<path d="M30 132 Q28 80 30 40 M54 132 Q56 96 54 64" stroke="#40c057" stroke-width="4" fill="none" stroke-linecap="round"/>'
     +f'<path d="M30 96 q-20 -4 -22 -18 q16 0 22 14 Z M30 110 q16 -6 24 -2 q-10 10 -24 6 Z M55 104 q16 -6 20 -18 q-14 2 -20 14 Z" fill="#51cf66" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>')
    for cx,cy,r in ((30,34,22),(54,62,15)):
        for i in range(12):
            a=math.radians(i*30)
            x=cx+r*.82*math.cos(a);y=cy+r*.82*math.sin(a)
            b+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r*.42:.1f}" ry="{r*.2:.1f}" transform="rotate({i*30} {x:.1f} {y:.1f})" fill="#fcc419" stroke="{O}" stroke-width="2.2"/>'
        b+=f'<circle cx="{cx}" cy="{cy}" r="{r*.55:.1f}" fill="#8b5a2b" stroke="{O}" stroke-width="3"/><circle cx="{cx-r*.15:.1f}" cy="{cy-r*.15:.1f}" r="{r*.2:.1f}" fill="#a87543"/>'
    return svg('0 0 80 135',b)
def topiary():
    d=grad('hg','#8fe07a','#2b7a33','#51b04a',1,1)+grad('pt','#f08c5a','#b04a23')
    b=(shadow(40,108,26)
     +f'<path d="M22 84 L58 84 L54 108 L26 108 Z" fill="url(#pt)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<rect x="18" y="78" width="44" height="10" rx="3" fill="#e8743f" stroke="{O}" stroke-width="3.5"/>'
     +f'<rect x="37" y="58" width="6" height="22" fill="#8b5a2b" stroke="{O}" stroke-width="3"/>'
     +f'<circle cx="40" cy="62" r="13" fill="url(#hg)" stroke="{O}" stroke-width="3.5"/>'
     +f'<circle cx="40" cy="30" r="24" fill="url(#hg)" stroke="{O}" stroke-width="4.5"/>'
     +f'<path d="M24 26 Q28 12 40 10" stroke="#d3f9d8" stroke-opacity=".7" stroke-width="4" fill="none" stroke-linecap="round"/>'
     +flower(56,40,6,'#f783ac')+flower(28,48,5,'#fff'))
    return svg('0 0 80 110',b,d)
def beehive():
    d=grad('sk','#ffe08a','#d99a1c','#f5c24c',1,0)
    b=(shadow(40,98,30)
     +f'<path d="M14 98 L14 84 L66 84 L66 98" fill="#9c6234" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<rect x="8" y="76" width="64" height="10" rx="2" fill="#c98a54" stroke="{O}" stroke-width="3.5"/>'
     +f'<path d="M16 76 Q10 50 22 34 Q30 18 40 18 Q50 18 58 34 Q70 50 64 76 Z" fill="url(#sk)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
     +f'<path d="M14 64 Q40 70 66 64 M16 50 Q40 56 64 50 M22 36 Q40 41 58 36 M30 25 Q40 28 50 25" stroke="#b07a14" stroke-width="2.5" fill="none"/>'
     +f'<path d="M30 76 L30 66 A10 10 0 0 1 50 66 L50 76 Z" fill="#3b2a1e"/>'
     +f'<path d="M24 60 Q22 42 32 30" stroke="#fff" stroke-opacity=".45" stroke-width="4" fill="none" stroke-linecap="round"/>'
     +bee(68,20,1)+bee(12,30,.8))
    return svg('0 0 80 100',b,d)
def bee(x,y,s):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="-2" cy="-7" rx="4" ry="5" fill="#e7f5ff" stroke="{O}" stroke-width="1.8"/><ellipse cx="4" cy="-7" rx="4" ry="5" fill="#e7f5ff" stroke="{O}" stroke-width="1.8"/>'
            f'<ellipse cx="0" cy="0" rx="8" ry="6" fill="#fcc419" stroke="{O}" stroke-width="2.2"/><path d="M-2 -5.5 v11 M3 -5 v10" stroke="{O}" stroke-width="2.2"/><circle cx="-6" cy="-1" r="1.2" fill="{O}"/></g>')
def wheelbarrow():
    d=grad('tb','#ff8787','#c92a2a')
    b=(shadow(55,74,46)
     +f'<path d="M70 56 L74 72 M74 72 h-8" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
     +f'<path d="M40 30 Q56 22 80 30 L84 50 Q60 60 24 52 Z" fill="#8b5a2b" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +flower(42,26,8,'#f783ac')+flower(58,22,8,'#fcc419','#e8590c')+flower(74,28,7,'#4dabf7','#fff3bf')
     +f'<path d="M16 32 L90 32 L80 58 L28 58 Z" fill="url(#tb)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="M24 38 L84 38" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>'
     +f'<path d="M82 40 L106 50" stroke="{O}" stroke-width="5.5" stroke-linecap="round"/><path d="M82 40 L106 50" stroke="#a0703c" stroke-width="2" stroke-linecap="round"/>'
     +f'<circle cx="26" cy="62" r="11" fill="#495057" stroke="{O}" stroke-width="3.5"/><circle cx="26" cy="62" r="4" fill="#ced4da" stroke="{O}" stroke-width="2"/>')
    return svg('0 0 110 78',b,d)

# ---------------- DECO ----------------
def tulips():
    b=shadow(28,54,20)+f'<path d="M14 54 q2 -10 6 -14 M40 54 q-2 -10 -6 -14" stroke="#2f9e44" stroke-width="3" fill="none"/>'
    b+=f'<path d="M12 54 q-2 -14 8 -20 q2 10 -2 20 Z M44 54 q2 -14 -8 -20 q-2 10 2 20 Z" fill="#51cf66" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
    b+=tulip(18,54,'#ff6b6b',26)+tulip(28,54,'#fcc419',34)+tulip(38,54,'#f783ac',22)
    return svg('0 0 56 56',b)
def daisies():
    b=(shadow(28,54,20)
     +f'<path d="M16 54 q-2 -12 2 -24 M30 54 q2 -16 -2 -34 M42 54 q2 -10 0 -16" stroke="#2f9e44" stroke-width="3" fill="none" stroke-linecap="round"/>'
     +f'<path d="M8 54 q2 -10 8 -12 q2 8 -2 12 Z M48 54 q-2 -10 -8 -12 q-2 8 2 12 Z" fill="#51cf66" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'
     +flower(18,30,12,'#fff','#fcc419',7,2)+flower(28,16,11,'#fff','#fcc419',7,2)+flower(42,36,10,'#fff','#fcc419',7,2))
    return svg('0 0 56 56',b)
def beedeco():
    b=(f'<ellipse cx="26" cy="50" rx="10" ry="2" fill="rgba(0,0,0,.18)"/>'
       +f'<path d="M4 34 q8 -14 16 -4 q6 8 -2 10" stroke="{O}" stroke-width="1.8" stroke-dasharray="3 3" fill="none" stroke-linecap="round"/>'
       +bee(32,26,1.9))
    return svg('0 0 52 52',b)
def chartsign():
    b=(shadow(26,56,14)
     +f'<rect x="23" y="30" width="6" height="26" fill="#8b5a2b" stroke="{O}" stroke-width="2.5"/>'
     +f'<rect x="4" y="6" width="44" height="30" rx="3" fill="#fff9e6" stroke="{O}" stroke-width="3"/>'
     +f'<path d="M10 11 V31 H43" stroke="{O}" stroke-width="2" fill="none"/>'
     +f'<path d="M12 27 L20 20 L28 24 L40 13" stroke="#e03131" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
     +f'<circle cx="20" cy="20" r="2" fill="#1971c2"/><circle cx="28" cy="24" r="2" fill="#1971c2"/><circle cx="40" cy="13" r="2" fill="#1971c2"/>')
    return svg('0 0 52 58',b)
def piesign():
    b=(shadow(26,56,14)
     +f'<rect x="23" y="34" width="6" height="22" fill="#8b5a2b" stroke="{O}" stroke-width="2.5"/>'
     +f'<circle cx="26" cy="22" r="18" fill="#4dabf7" stroke="{O}" stroke-width="3"/>'
     +f'<path d="M26 22 L26 4 A18 18 0 0 1 43 28 Z" fill="#ff6b6b" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
     +f'<path d="M26 22 L43 28 A18 18 0 0 1 20 39 Z" fill="#fcc419" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
     +f'<path d="M14 12 Q18 7 24 6" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    return svg('0 0 52 58',b)
def wateringcan():
    d=grad('cn','#a5d8ff','#1c7ed6','#4dabf7',1,1)
    b=(shadow(28,52,22)
     +f'<path d="M40 30 L54 14 L58 18 L44 40" fill="#4dabf7" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/>'
     +f'<path d="M52 12 l8 8" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
     +f'<path d="M14 20 Q26 6 38 20" stroke="{O}" stroke-width="4" fill="none"/>'
     +f'<path d="M10 22 L42 22 L40 50 L12 50 Z" fill="url(#cn)" stroke="{O}" stroke-width="3.2" stroke-linejoin="round"/>'
     +f'<path d="M15 28 v16" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>'
     +f'<circle cx="60" cy="26" r="1.6" fill="#4dabf7"/><circle cx="62" cy="32" r="1.6" fill="#4dabf7"/>')
    return svg('0 0 64 56',b,d)

# ---------------- EXTRA ----------------
def clover():
    b=f'<ellipse cx="20" cy="27" rx="12" ry="2" fill="rgba(0,0,0,.15)"/><path d="M20 27 q1 -6 -1 -10" stroke="#2b8a3e" stroke-width="2" fill="none"/>'
    for a in (-90,30,150):
        r=math.radians(a);x=20+5*math.cos(r);y=13+5*math.sin(r)
        b+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="#40c057" stroke="{O}" stroke-width="1.8"/>'
    b+=f'<circle cx="32" cy="22" r="3" fill="#40c057" stroke="{O}" stroke-width="1.5"/><circle cx="8" cy="23" r="2.6" fill="#40c057" stroke="{O}" stroke-width="1.5"/>'
    return svg('0 0 40 30',b)
def tinyflowers():
    b=(f'<path d="M10 28 v-8 M22 28 v-12 M32 28 v-6" stroke="#2b8a3e" stroke-width="2"/>'
       +flower(10,18,6,'#f783ac','#fff3bf',5,1.4)+flower(22,12,6.5,'#fff','#fcc419',5,1.4)+flower(32,20,5.5,'#748ffc','#fff3bf',5,1.4))
    return svg('0 0 40 30',b)
def tuft():
    b=(f'<path d="M8 28 q-2 -10 2 -16 q2 8 2 16 M14 28 q0 -12 6 -18 q-2 10 -2 18 M22 28 q2 -10 8 -14 q-4 8 -4 14" fill="#51cf66" stroke="{O}" stroke-width="1.8" stroke-linejoin="round"/>'
       +flower(31,14,5,'#ff6b6b','#fff3bf',5,1.3))
    return svg('0 0 40 30',b)

BLOCK=[('garden_beds',beds(),1.1,1.0),('garden_sunflower',sunflowers(),.8,1.35),('garden_topiary',topiary(),.8,1.1),
       ('garden_hive',beehive(),.8,1.0),('garden_barrow',wheelbarrow(),1.1,.78)]
DECO=[('garden_tulips',tulips(),.56,.56),('garden_daisies',daisies(),.56,.56),('garden_bee',beedeco(),.5,.5),
      ('garden_linesign',chartsign(),.5,.56),('garden_piesign',piesign(),.5,.56),('garden_can',wateringcan(),.6,.52)]
EXTRA=[('garden_clover',clover(),.4,.3),('garden_buds',tinyflowers(),.4,.3),('garden_tuft',tuft(),.4,.3)]
