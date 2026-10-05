from kit import *
import math
# Chaos Tower (mixed operations) on deep purple ground: light lavender stone, gold, cyan and pink so things stand out.
def star(cx,cy,r,ri=None,n=5,rot=-90):
    ri=ri or r*.45;pts=[]
    for i in range(n*2):
        a=math.radians(rot+i*180/n);rr=r if i%2==0 else ri
        pts.append(f'{cx+rr*math.cos(a):.1f} {cy+rr*math.sin(a):.1f}')
    return 'M'+' L'.join(pts)+' Z'
def gstar(cx,cy,r,sw=2.5,fill='#ffd43b'):
    return f'<path d="{star(cx,cy,r)}" fill="{fill}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
def sparkle(cx,cy,r,fill='#fff'):
    return f'<path d="M{cx} {cy-r} Q{cx+r*.18} {cy-r*.18} {cx+r} {cy} Q{cx+r*.18} {cy+r*.18} {cx} {cy+r} Q{cx-r*.18} {cy+r*.18} {cx-r} {cy} Q{cx-r*.18} {cy-r*.18} {cx} {cy-r} Z" fill="{fill}"/>'
def signs(s=1):
    # + - x / in a 2x2, centred on 0,0
    a=f'<g transform="translate({-6.5*s} {-6.5*s})"><rect x="{-4.5*s}" y="{-1.4*s}" width="{9*s}" height="{2.8*s}" rx="{1.4*s}" fill="#e8590c"/><rect x="{-1.4*s}" y="{-4.5*s}" width="{2.8*s}" height="{9*s}" rx="{1.4*s}" fill="#e8590c"/></g>'
    b=f'<g transform="translate({6.5*s} {-6.5*s})"><rect x="{-4.5*s}" y="{-1.4*s}" width="{9*s}" height="{2.8*s}" rx="{1.4*s}" fill="#1971c2"/></g>'
    c=f'<g transform="translate({-6.5*s} {6.5*s}) rotate(45)"><rect x="{-4.5*s}" y="{-1.4*s}" width="{9*s}" height="{2.8*s}" rx="{1.4*s}" fill="#c2255c"/><rect x="{-1.4*s}" y="{-4.5*s}" width="{2.8*s}" height="{9*s}" rx="{1.4*s}" fill="#c2255c"/></g>'
    d=f'<g transform="translate({6.5*s} {6.5*s})"><rect x="{-4.5*s}" y="{-1.3*s}" width="{9*s}" height="{2.6*s}" rx="{1.3*s}" fill="#2b8a3e"/><circle cx="0" cy="{-3.8*s}" r="{1.6*s}" fill="#2b8a3e"/><circle cx="0" cy="{3.8*s}" r="{1.6*s}" fill="#2b8a3e"/></g>'
    return f'<path d="M0 {-11*s} V{11*s} M{-11*s} 0 H{11*s}" stroke="{O}" stroke-opacity=".25" stroke-width="{1.2*s}"/>'+a+b+c+d

# ---------------- entrance: a crooked wizard's tower with a curly star hat ----------------
_ed=(grad('st','#f3eefc','#a796d6','#d3c8ef',1,0)+grad('hat','#ff8cc6','#a61e7a','#e64980',1,1)
     +grad('band','#ffe066','#e0a100'))
_e=(shadow(120,188,100)
 # stone steps at the base
 +f'<path d="M62 188 L68 174 L172 174 L178 188 Z" fill="#c9bde8" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 # tower body: tapering and a little crooked
 +f'<path d="M74 176 Q78 120 84 76 Q86 62 92 52 L150 54 Q156 64 156 78 Q160 124 166 176 Z" fill="url(#st)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 +f'<path d="M80 150 h80 M82 120 h76 M86 92 h68" stroke="#9d8cc9" stroke-width="2.2"/>'
 +f'<path d="M100 150 v-30 M140 150 v-30 M120 120 v-28 M106 92 v-36 M136 92 v-36 M96 176 v-26 M146 176 v-26" stroke="#9d8cc9" stroke-width="2"/>'
 +f'<path d="M86 160 Q88 110 96 70" stroke="#fff" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>'
 # a gold swirl band wrapping round the tower
 +f'<path d="M78 136 Q120 116 160 104 L161 114 Q120 126 79 146 Z" fill="url(#band)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
 +gstar(98,133,4.2,2)+gstar(142,115,4.2,2)
 # round glowing window
 +f'<circle cx="122" cy="74" r="10" fill="#7ff0ff" stroke="{O}" stroke-width="3.5"/><path d="M122 64 v20 M112 74 h20" stroke="{O}" stroke-width="2"/><path d="M116 70 q2 -4 6 -5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>'
 # the brim and the crooked curly hat
 +f'<path d="M78 58 Q120 40 166 56 Q168 64 160 66 Q120 54 82 68 Q72 66 78 58 Z" fill="#7b2a8f" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 +f'<path d="M88 58 Q100 34 112 22 Q124 8 146 6 Q168 6 178 20 Q184 32 174 36 Q164 38 164 28 Q164 20 154 20 Q140 22 138 34 Q136 46 156 56 Q120 48 88 58 Z" fill="url(#hat)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 +f'<path d="M100 48 Q110 30 124 18" stroke="#fff" stroke-opacity=".45" stroke-width="4" fill="none" stroke-linecap="round"/>'
 +gstar(174,28,8,2.5)+gstar(118,40,5.5,2)+gstar(146,44,4,2)
 # doorway and the plaque with the four signs
 +f'<path d="M94 176 L94 140 A26 26 0 0 1 146 140 L146 176 Z" fill="#8a76c4" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 +doorway(99,141,176,119,('#5f3dc4','#4527a0','#321a7a','#211052','#140a33'))
 +plaque(120,100,17,signs(.95))
 # floating stars and sparkles around
 +gstar(40,72,10,3)+gstar(204,96,8,2.5)+gstar(30,138,6,2)+gstar(210,150,6.5,2)
 +sparkle(60,40,7,'#a5f3fc')+sparkle(196,62,6,'#ffd6f0')+sparkle(52,104,5,'#fff3bf')+sparkle(188,126,5,'#a5f3fc')
 # little crystals by the door
 +f'<path d="M50 188 L46 168 L54 156 L60 170 L58 188 Z" fill="#66e3f5" stroke="{O}" stroke-width="3" stroke-linejoin="round"/><path d="M58 188 L62 172 L70 178 L68 188 Z" fill="#f783c8" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
 +f'<path d="M182 188 L180 174 L188 162 L194 176 L192 188 Z" fill="#f783c8" stroke="{O}" stroke-width="3" stroke-linejoin="round"/><path d="M192 188 L196 176 L202 182 L200 188 Z" fill="#66e3f5" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
)
ENTRANCE=svg('0 0 240 200',_e,_ed)

# ---------------- BLOCK ----------------
def crystalball():
    d=grad('b','#e6fcff','#4fb6e8','#9be7ff',1,1)+grad('g','#ffe066','#c98a00')
    b=(shadow(45,104,30)
     +f'<path d="M22 104 L28 90 L62 90 L68 104 Z" fill="url(#g)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="M34 90 L38 74 L52 74 L56 90 Z" fill="url(#g)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="M24 66 Q45 84 66 66 L60 76 Q45 84 30 76 Z" fill="url(#g)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
     +f'<circle cx="45" cy="44" r="32" fill="url(#b)" stroke="{O}" stroke-width="4.5"/>'
     +f'<path d="M30 52 Q36 34 52 38 Q62 42 56 52 Q50 58 44 50" stroke="#e64980" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>'
     +f'<path d="M24 34 Q30 20 44 16" stroke="#fff" stroke-opacity=".75" stroke-width="5" fill="none" stroke-linecap="round"/>'
     +sparkle(60,26,5)+sparkle(36,60,3.5))
    return svg('0 0 90 110',b,d)
def crystals():
    d=grad('c','#e3fafc','#1098ad','#66d9e8',1,1)+grad('p','#ffdeeb','#c2255c','#f783ac',1,1)
    b=(shadow(50,94,40)
     +f'<path d="M14 94 L10 66 L20 50 L30 66 L30 94 Z" fill="url(#p)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="M70 94 L72 56 L82 40 L90 58 L86 94 Z" fill="url(#p)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="M30 94 L34 36 L48 8 L62 36 L66 94 Z" fill="url(#c)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
     +f'<path d="M48 8 L48 94" stroke="#0b7285" stroke-width="2" opacity=".5"/>'
     +f'<path d="M52 94 L60 62 L70 52 L76 68 L70 94 Z" fill="url(#c)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="M24 94 L26 72 L36 60 L42 74 L40 94 Z" fill="url(#c)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="M40 40 L46 18 M14 70 L19 56 M76 60 L81 46" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>'
     +f'<path d="M8 96 Q50 88 92 96" stroke="{O}" stroke-width="3" fill="none" stroke-linecap="round"/>'
     +sparkle(86,22,5,'#fff3bf'))
    return svg('0 0 100 100',b,d)
def planet():
    d=grad('pl','#ffd8a8','#d9480f','#ff922b',1,1)+grad('g','#ffe066','#c98a00')
    b=(shadow(48,110,26)
     +f'<path d="M28 110 L34 98 L62 98 L68 110 Z" fill="url(#g)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<rect x="44" y="62" width="8" height="38" fill="url(#g)" stroke="{O}" stroke-width="3.5"/>'
     +f'<g transform="translate(48 42) rotate(-18)"><ellipse cx="0" cy="0" rx="42" ry="11" fill="none" stroke="{O}" stroke-width="10"/><ellipse cx="0" cy="0" rx="42" ry="11" fill="none" stroke="#66d9e8" stroke-width="5"/></g>'
     +f'<circle cx="48" cy="40" r="26" fill="url(#pl)" stroke="{O}" stroke-width="4.5"/>'
     +f'<path d="M26 34 Q48 28 70 34 M24 46 Q48 42 72 48" stroke="#e8590c" stroke-width="3" fill="none"/>'
     +f'<path d="M30 26 Q38 18 50 17" stroke="#fff" stroke-opacity=".6" stroke-width="4" fill="none" stroke-linecap="round"/>'
     +f'<g transform="translate(48 42) rotate(-18)"><path d="M-42 0 A42 11 0 0 0 42 0" fill="none" stroke="{O}" stroke-width="10" stroke-linecap="round"/><path d="M-42 0 A42 11 0 0 0 42 0" fill="none" stroke="#66d9e8" stroke-width="5" stroke-linecap="round"/><path d="M-30 6 A42 11 0 0 0 0 11" fill="none" stroke="#e3fafc" stroke-width="2" stroke-linecap="round"/></g>'
     +f'<circle cx="84" cy="74" r="7" fill="#f1f3f5" stroke="{O}" stroke-width="3"/><circle cx="82" cy="72" r="2" fill="#ced4da"/>'
     +sparkle(14,16,5,'#fff3bf'))
    return svg('0 0 96 115',b,d)
def runestone():
    d=grad('s','#e5dbff','#8f7fcf','#c0b2ec',1,1)
    b=(shadow(40,116,24)
     +f'<path d="M14 116 L20 100 L60 100 L66 116 Z" fill="#b5a6e0" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<ellipse cx="40" cy="100" rx="16" ry="3.5" fill="#7ff0ff" opacity=".7"/>'
     +f'<path d="M30 92 Q40 86 50 92" stroke="#7ff0ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>'
     +f'<path d="M18 74 L14 26 Q16 10 40 6 Q64 10 66 26 L62 74 Q40 82 18 74 Z" fill="url(#s)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
     +f'<path d="M22 66 L19 28 Q22 16 36 12" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/>'
     # glowing rune: a times sign inside a ring
     +f'<circle cx="41" cy="42" r="15" fill="none" stroke="#22b8cf" stroke-width="4"/>'
     +f'<path d="M34 35 L48 49 M48 35 L34 49" stroke="#22b8cf" stroke-width="4" stroke-linecap="round"/>'
     +f'<path d="M34 35 L48 49 M48 35 L34 49" stroke="#c5f6fa" stroke-width="1.5" stroke-linecap="round"/>'
     +sparkle(70,14,5,'#a5f3fc')+sparkle(10,50,4,'#a5f3fc'))
    return svg('0 0 80 120',b,d)
def lantern():
    d=grad('g','#ffe066','#c98a00')
    b=(shadow(35,128,18)
     +f'<path d="M22 128 L26 118 L44 118 L48 128 Z" fill="url(#g)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
     +f'<rect x="31" y="50" width="8" height="70" fill="#e5dbff" stroke="{O}" stroke-width="3.5"/>'
     +f'<path d="M35 52 Q35 40 50 38" stroke="{O}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M35 52 Q35 40 50 38" stroke="#e5dbff" stroke-width="3" fill="none" stroke-linecap="round"/>'
     +f''+sparkle(8,12,5,'#fff3bf')+sparkle(62,56,4.5,'#a5f3fc')+sparkle(64,8,3.5,'#ffd6f0')+f''
     +f'<path d="{star(35,32,25,11.5)}" fill="url(#g)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
     +f'<path d="{star(35,33,11,5)}" fill="#fff9db"/>'
     +f'<path d="M26 18 L32 10" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>')
    return svg('0 0 70 130',b,d)

# ---------------- DECO ----------------
def mushrooms():
    b=(shadow(28,54,22)
     +f'<rect x="34" y="34" width="8" height="20" rx="3" fill="#e5dbff" stroke="{O}" stroke-width="3"/>'
     +f'<path d="M24 36 Q24 18 38 18 Q52 18 52 36 Z" fill="#3bc9db" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<circle cx="33" cy="27" r="2.5" fill="#e3fafc"/><circle cx="43" cy="25" r="2" fill="#e3fafc"/>'
     +f'<rect x="13" y="40" width="7" height="14" rx="3" fill="#e5dbff" stroke="{O}" stroke-width="3"/>'
     +f'<path d="M6 42 Q6 28 16.5 28 Q27 28 27 42 Z" fill="#f06595" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<circle cx="13" cy="35" r="2" fill="#ffdeeb"/><circle cx="20" cy="34" r="1.6" fill="#ffdeeb"/>'
     +sparkle(50,10,4,'#a5f3fc'))
    return svg('0 0 56 56',b)
def smallcrystal():
    b=(shadow(24,52,18)
     +f'<path d="M14 52 L12 30 L20 14 L28 30 L28 52 Z" fill="#ffd43b" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<path d="M26 52 L30 32 L38 26 L40 38 L36 52 Z" fill="#f783ac" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<path d="M6 52 L8 40 L14 38 L16 52 Z" fill="#66d9e8" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<path d="M17 30 L20 20" stroke="#fff" stroke-opacity=".8" stroke-width="2.5" stroke-linecap="round"/>')
    return svg('0 0 46 56',b)
def moon():
    d=grad('g','#ffe066','#c98a00')
    b=(shadow(26,56,14)
     +f'<path d="M16 56 L19 49 L33 49 L36 56 Z" fill="url(#g)" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<rect x="23.5" y="34" width="5" height="16" fill="url(#g)" stroke="{O}" stroke-width="2.5"/>'
     +f'<path d="M28 3 A17 17 0 1 0 44 30 A14 14 0 1 1 28 3 Z" fill="#fff3bf" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<circle cx="18" cy="22" r="2.2" fill="#ffe066"/><circle cx="22" cy="30" r="1.6" fill="#ffe066"/>'
     +gstar(42,14,4.5,1.8))
    return svg('0 0 52 58',b,d)
def runepebble():
    b=(shadow(24,44,14)
     +f'<ellipse cx="24" cy="44" rx="9" ry="2" fill="#7ff0ff" opacity=".6"/>'
     +f'<path d="M10 30 Q8 12 24 8 Q40 10 38 28 Q36 38 24 38 Q12 38 10 30 Z" fill="#d0c4f2" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
     +f'<path d="M18 23 h12 M24 17 v12" stroke="#f06595" stroke-width="3.5" stroke-linecap="round"/>'
     +f'<path d="M14 26 Q14 16 20 12" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    return svg('0 0 48 48',b)

# ---------------- EXTRA ----------------
def groundstar():
    b=f'<ellipse cx="20" cy="27" rx="12" ry="2" fill="rgba(0,0,0,.2)"/>'+gstar(20,16,11,2.2)+sparkle(34,7,4,'#a5f3fc')
    return svg('0 0 40 30',b)
def sparkles():
    b=(sparkle(10,20,6,'#fff3bf')+sparkle(26,10,5,'#a5f3fc')+sparkle(32,24,4,'#ffd6f0')
       +f'<circle cx="18" cy="8" r="1.8" fill="#fff"/><circle cx="6" cy="8" r="1.4" fill="#ffd6f0"/>')
    return svg('0 0 40 30',b)
def tinycrystals():
    b=(f'<ellipse cx="20" cy="27" rx="14" ry="2.2" fill="rgba(0,0,0,.2)"/>'
       +f'<path d="M12 27 L12 15 L17 8 L21 16 L20 27 Z" fill="#66d9e8" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'
       +f'<path d="M20 27 L23 17 L29 14 L30 22 L28 27 Z" fill="#f783ac" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>')
    return svg('0 0 40 30',b)

BLOCK=[('tower_ball',crystalball(),.9,1.1),('tower_crystals',crystals(),1.0,1.0),('tower_planet',planet(),.96,1.15),
       ('tower_rune',runestone(),.8,1.2),('tower_lantern',lantern(),.7,1.3)]
DECO=[('tower_shrooms',mushrooms(),.56,.56),('tower_gem',smallcrystal(),.46,.56),('tower_moon',moon(),.52,.58),('tower_pebble',runepebble(),.48,.48)]
EXTRA=[('tower_star',groundstar(),.4,.3),('tower_sparkle',sparkles(),.4,.3),('tower_bits',tinycrystals(),.4,.3)]
