from kit import *
# ---------------- Fraction Farm ----------------
def _ring(n,rx,ry,dy,fill,sw=1.4):
    return ''.join(f'<ellipse cx="0" cy="{-dy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{O}" stroke-width="{sw}" transform="rotate({i*360/n:.0f})"/>' for i in range(n))
_pie=(f'<circle r="11.5" fill="#fff6dc" stroke="{O}" stroke-width="2.4"/>'
      f'<path d="M0 0 L0 -11.5 A11.5 11.5 0 0 1 11.5 0 Z" fill="#e8590c" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
      f'<path d="M0 -11.5 V11.5 M-11.5 0 H11.5" stroke="{O}" stroke-width="2.2"/>')
_barn_defs=grad('bw','#e8553f','#a8261a','#cc3a28')+grad('bh','#ffe28a','#d9a63a')
_leaf=lambda x,y:f'<rect x="{x}" y="112" width="24" height="74" fill="url(#bw)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/><path d="M{x+3} 115 L{x+21} 183 M{x+21} 115 L{x+3} 183 M{x} 149 h24" stroke="#fff4e6" stroke-width="4" stroke-linecap="round"/>'
ENTRANCE=svg('0 0 240 200',
  '<ellipse cx="120" cy="188" rx="108" ry="10" fill="rgba(0,0,0,.2)"/>'
  # facade
  f'<path d="M56 188 L56 94 L68 60 L120 36 L172 60 L184 94 L184 188 Z" fill="url(#bw)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
  '<path d="M60 112 h120 M60 132 h120 M60 152 h120 M60 172 h120 M68 80 h104" stroke="#9b2318" stroke-width="2" opacity=".55"/>'
  # roof band (outline then grey)
  f'<path d="M44 100 L62 56 L120 28 L178 56 L196 100" fill="none" stroke="{O}" stroke-width="19" stroke-linejoin="round" stroke-linecap="round"/>'
  '<path d="M44 100 L62 56 L120 28 L178 56 L196 100" fill="none" stroke="#6b6f80" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>'
  '<path d="M50 92 L64 58 L120 32" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
  # weathervane
  f'<path d="M120 20 V4" stroke="{O}" stroke-width="3"/><path d="M110 8 h20 l-5 -4 M130 8 l-5 4" stroke="{O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
  # white trim corners
  '<path d="M60 186 V96 M180 186 V96" stroke="#fff4e6" stroke-width="5" stroke-linecap="round"/>'
  # open door leaves
  +_leaf(62,0)+_leaf(154,0)+
  f'<path d="M86 188 L86 140 A34 34 0 0 1 154 140 L154 188 Z" fill="#fff4e6" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
  +doorway(91,149,188,111,('#8a5a32','#6b4325','#4c2f1a','#33200f','#1e1209'))+
  # hay peeking in the doorway
  f'<path d="M96 188 q4 -14 12 -12 q6 -10 14 -2 q8 -6 12 4 q6 0 8 10 Z" fill="url(#bh)" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
  +plaque(120,78,18,_pie)+
  # hay bale + tufts by the barn
  f'<rect x="188" y="164" width="38" height="24" rx="4" fill="url(#bh)" stroke="{O}" stroke-width="4"/><path d="M200 166 v20 M214 166 v20" stroke="#a0522d" stroke-width="2.5"/><path d="M192 172 h6 M218 178 h5" stroke="#b8862b" stroke-width="2"/>'
  f'<path d="M20 188 q4 -14 8 0 q3 -10 6 0 q4 -16 8 0" fill="#6fae3c" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>',
  _barn_defs)

# ---- BLOCK ----
_bale=lambda x,y,w,h:f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="url(#h)" stroke="{O}" stroke-width="4"/><path d="M{x+w*.3:.0f} {y+2} v{h-4} M{x+w*.7:.0f} {y+2} v{h-4}" stroke="#a0522d" stroke-width="3"/><path d="M{x+6} {y+8} h7 M{x+w*.45:.0f} {y+h*.6:.0f} h6 M{x+w-14} {y+h-8} h7" stroke="#b8862b" stroke-width="2" stroke-linecap="round"/><path d="M{x+5} {y+5} h{w-12}" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>'
farm_hay=svg('0 0 100 75',shadow(50,70,44)+_bale(6,44,44,26)+_bale(50,44,44,26)+_bale(27,18,46,26),grad('h','#ffe28a','#d9a63a'))
farm_silo=svg('0 0 80 140',shadow(40,134,30)
  +f'<rect x="16" y="40" width="48" height="92" fill="url(#s)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
  '<path d="M18 62 h44 M18 84 h44 M18 106 h44" stroke="#f4e6d6" stroke-width="3"/>'
  f'<path d="M12 42 Q12 10 40 8 Q68 10 68 42 Z" fill="url(#d)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
  f'<path d="M40 8 v-6" stroke="{O}" stroke-width="3"/>'
  '<path d="M22 34 Q24 18 38 14" stroke="#fff" stroke-opacity=".55" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
  '<path d="M23 48 v78" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>'
  f'<path d="M50 48 v80 M57 48 v80 M50 58 h7 M50 70 h7 M50 82 h7 M50 94 h7 M50 106 h7 M50 118 h7" stroke="{O}" stroke-width="2"/>',
  grad('s','#e8553f','#a8261a','#cc3a28',1,0)+grad('d','#e9eef5','#8f9bb0','#c3ccd9'))
_ap=lambda x,y:f'<circle cx="{x}" cy="{y}" r="5" fill="#e03131" stroke="{O}" stroke-width="2"/><path d="M{x-2} {y-2} l1.5 -1.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".7"/>'
farm_appletree=svg('0 0 110 130',shadow(55,124,36)
  +f'<rect x="47" y="82" width="16" height="42" rx="3" fill="#7f5230" stroke="{O}" stroke-width="4"/>'
  f'<path d="M47 92 q-8 -6 -14 -4 M63 88 q8 -8 14 -6" stroke="{O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
  +''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#o)" stroke="{O}" stroke-width="4"/>' for x,y,r in((28,62,22),(82,62,22),(40,36,25),(70,36,25),(55,56,26)))
  +'<path d="M24 50 q6 -10 16 -12 M56 18 q12 0 18 8" stroke="#fff" stroke-opacity=".45" stroke-width="4" fill="none" stroke-linecap="round"/>'
  +''.join(_ap(x,y) for x,y in((26,66),(44,30),(70,40),(84,64),(56,62),(38,52),(66,76)))
  +_ap(30,120)+_ap(76,121),
  grad('o','#b4e86f','#4f9a3d','#7cc84f'))
farm_scarecrow=svg('0 0 80 120',shadow(40,116,22)
  +f'<path d="M40 40 V114" stroke="{O}" stroke-width="9" stroke-linecap="round"/><path d="M40 40 V114" stroke="#a0703c" stroke-width="4.5" stroke-linecap="round"/>'
  f'<path d="M8 56 H72" stroke="{O}" stroke-width="9" stroke-linecap="round"/><path d="M8 56 H72" stroke="#a0703c" stroke-width="4.5" stroke-linecap="round"/>'
  # straw hands
  f'<path d="M8 56 l-6 -4 M8 56 l-7 2 M8 56 l-5 7 M72 56 l6 -4 M72 56 l7 2 M72 56 l5 7" stroke="#e8b931" stroke-width="3" stroke-linecap="round"/>'
  # shirt
  f'<path d="M14 50 L66 50 L66 62 L56 62 L58 92 L22 92 L24 62 L14 62 Z" fill="url(#sh)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
  '<path d="M33 50 v42 M47 50 v42 M24 72 h34" stroke="#2b5fa8" stroke-width="2.5"/>'
  f'<rect x="30" y="68" width="10" height="9" fill="#e8b931" stroke="{O}" stroke-width="2"/>'
  f'<path d="M24 92 l-2 8 M32 92 l0 9 M48 92 l1 9 M56 92 l3 8" stroke="#e8b931" stroke-width="3" stroke-linecap="round"/>'
  # head
  f'<circle cx="40" cy="36" r="13" fill="#e2c08a" stroke="{O}" stroke-width="3.5"/>'
  f'<circle cx="35" cy="34" r="2" fill="{O}"/><circle cx="45" cy="34" r="2" fill="{O}"/>'
  f'<path d="M33 41 q7 5 14 0" stroke="{O}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M35 41 v2 M40 43 v2 M45 41 v2" stroke="{O}" stroke-width="1.4"/>'
  # hat
  f'<ellipse cx="40" cy="25" rx="20" ry="5" fill="#d9a63a" stroke="{O}" stroke-width="3"/>'
  f'<path d="M30 25 Q30 8 40 8 Q50 8 50 25 Z" fill="#e8b931" stroke="{O}" stroke-width="3" stroke-linejoin="round"/><path d="M30 21 h20" stroke="#c92a2a" stroke-width="3.5"/>'
  # crow
  f'<path d="M62 52 q-2 -10 6 -12 q6 0 6 5 l5 1 l-5 2 q0 5 -6 6 Z" fill="#2b2533" stroke="{O}" stroke-width="2" stroke-linejoin="round"/><circle cx="70" cy="43" r="1.2" fill="#fff"/>',
  grad('sh','#74b0f0','#2f6fc4'))
_post=lambda x:f'<rect x="{x-6}" y="16" width="12" height="50" rx="2" fill="url(#w)" stroke="{O}" stroke-width="3.5"/><path d="M{x-6} 20 l6 -6 l6 6" fill="#c9915a" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
_rail=lambda y:f'<rect x="6" y="{y}" width="98" height="10" rx="2" fill="url(#w)" stroke="{O}" stroke-width="3.5"/><path d="M10 {y+3} h88" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>'
farm_fence=svg('0 0 110 70',shadow(55,66,48)+_rail(26)+_rail(44)+_post(14)+_post(55)+_post(96)
  +f'<path d="M24 66 q3 -10 6 0 q3 -8 5 0 M70 66 q3 -11 6 0 q3 -8 5 0" fill="#6fae3c" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>',
  grad('w','#d9a46a','#9a6533'))
farm_pie=svg('0 0 80 80',shadow(40,75,30)
  +f'<path d="M14 52 V70 Q40 80 66 70 V52 Z" fill="url(#bk)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
  f'<path d="M26 58 v14 M40 60 v16 M54 58 v14" stroke="#5c3a20" stroke-width="2"/>'
  f'<ellipse cx="40" cy="52" rx="26" ry="8" fill="#e6c08a" stroke="{O}" stroke-width="4"/>'
  # pie with one quarter gone: crust side, top, cherry filling where the slice was
  '<g transform="translate(0 7)">'
  f'<path d="M12 38 V45 Q40 58 68 45 V38" fill="#c9852f" stroke="{O}" stroke-width="3.2" stroke-linejoin="round"/>'
  f'<ellipse cx="40" cy="38" rx="28" ry="10" fill="url(#cr)" stroke="{O}" stroke-width="3.2"/>'
  f'<path d="M40 38 L68 38 V45 Q56 51 40 51 V48 Z" fill="#a51d1d" stroke="{O}" stroke-width="2.8" stroke-linejoin="round"/>'
  f'<path d="M40 38 L68 38 A28 10 0 0 1 40 48 Z" fill="#e03131" stroke="{O}" stroke-width="2.8" stroke-linejoin="round"/>'
  f'<path d="M40 38 L12 38 M40 38 L40 28" stroke="{O}" stroke-width="2.4"/>'
  '<path d="M48 42 l3 2 M56 40 l2 3" stroke="#ff8787" stroke-width="2" stroke-linecap="round"/>'
  '<path d="M20 34 q8 -4 16 -4" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
  '</g><path d="M30 24 q-4 -6 0 -10 q4 -4 0 -9 M48 24 q-4 -6 0 -10 q4 -4 0 -9" stroke="#fff" stroke-opacity=".85" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  grad('bk','#a0703f','#5c3a20','#7f5230',1,0)+grad('cr','#f7cf8a','#d99a48'))
BLOCK=[('farm_hay',farm_hay,1,.75),('farm_silo',farm_silo,.8,1.4),('farm_appletree',farm_appletree,1.1,1.3),
       ('farm_scarecrow',farm_scarecrow,.8,1.2),('farm_fence',farm_fence,1.1,.7),('farm_pie',farm_pie,.8,.8)]

# ---- DECO ----
farm_sunflower=svg('0 0 45 60',shadow(22,57,14)
  +'<path d="M22 57 V24" stroke="#3b7a31" stroke-width="3.5"/><path d="M22 46 q-10 -2 -14 -10 q10 0 14 8 M22 40 q10 -2 14 -10 q-10 0 -14 8" fill="#5aa94a" stroke="#3b2a1e" stroke-width="1.8" stroke-linejoin="round"/>'
  +'<g transform="translate(22 18)">'+_ring(10,3.4,6,8,'#ffd43b')+f'<circle r="7" fill="#7a4a1e" stroke="{O}" stroke-width="2"/><circle cx="-2" cy="-2" r="1.2" fill="#c08040"/><circle cx="2" cy="1" r="1.2" fill="#c08040"/></g>')
_carrot=lambda x,y:(f'<path d="M{x} {y} q-6 -10 -8 -16 M{x} {y} q0 -12 1 -18 M{x} {y} q6 -10 9 -15" stroke="#3b7a31" stroke-width="3" fill="none" stroke-linecap="round"/>'
  f'<path d="M{x-6} {y} L{x+6} {y} L{x} {y+11} Z" fill="#fd7e14" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/><path d="M{x-3} {y+3} h4" stroke="#c4560a" stroke-width="1.5"/>')
farm_carrots=svg('0 0 55 40',f'<ellipse cx="27" cy="31" rx="25" ry="8" fill="#8a5a32" stroke="{O}" stroke-width="2.5"/><path d="M8 31 q4 -2 8 0 M36 33 q4 -2 8 0" stroke="#5c3a20" stroke-width="1.8" fill="none"/>'
  +_carrot(14,26)+_carrot(28,24)+_carrot(42,26))
farm_pumpkin=svg('0 0 50 40',shadow(25,37,20)
  +f'<ellipse cx="15" cy="25" rx="11" ry="11" fill="url(#p)" stroke="{O}" stroke-width="2.6"/><ellipse cx="35" cy="25" rx="11" ry="11" fill="url(#p)" stroke="{O}" stroke-width="2.6"/><ellipse cx="25" cy="25" rx="10" ry="12" fill="url(#p)" stroke="{O}" stroke-width="2.6"/>'
  f'<path d="M25 13 q-1 -6 3 -9" stroke="#5c7a1e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M28 10 q8 -6 14 0 q-8 4 -14 0 Z" fill="#5aa94a" stroke="{O}" stroke-width="1.8"/>'
  '<path d="M9 20 q2 -4 5 -5 M21 18 q1 -3 4 -4" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>',
  grad('p','#ffa94d','#d9480f'))
farm_wheat=svg('0 0 45 60',shadow(22,57,14)
  +''.join(f'<path d="M22 54 L{x} 18" stroke="#c99a2e" stroke-width="2.5"/>' for x in (10,16,22,28,34))
  +''.join(f'<ellipse cx="{x}" cy="{y}" rx="3.6" ry="8" fill="#f0c64a" stroke="{O}" stroke-width="1.8" transform="rotate({r} {x} {y})"/>' for x,y,r in((9,14,-18),(16,10,-8),(22,8,0),(28,10,8),(35,14,18)))
  +f'<path d="M16 54 L22 36 L28 54 Z" fill="#e0b13c" stroke="{O}" stroke-width="2" stroke-linejoin="round"/><rect x="15" y="38" width="14" height="5" rx="2" fill="#c92a2a" stroke="{O}" stroke-width="1.8"/>')
DECO=[('farm_sunflower',farm_sunflower,.45,.6),('farm_carrots',farm_carrots,.55,.4),('farm_pumpkin',farm_pumpkin,.5,.4),('farm_wheat',farm_wheat,.45,.6)]

# ---- EXTRA ----
farm_tuft=svg('0 0 40 30',f'<path d="M6 28 q4 -16 8 0 q3 -12 6 0 q4 -18 8 0 q3 -10 6 0" fill="#6fae3c" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>')
farm_flowers=svg('0 0 40 30','<path d="M10 28 q4 -12 8 0 q3 -8 6 0" fill="#6fae3c" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/>'
  +''.join(f'<g transform="translate({x} {y})">'+_ring(5,2.2,3,3,c,1)+f'<circle r="1.8" fill="#ffd43b"/></g>' for x,y,c in((12,14,'#fff'),(26,10,'#f783ac'),(32,20,'#fff'))))
farm_straw=svg('0 0 40 30',f'<path d="M6 24 l14 -6 M10 26 l18 -4 M14 22 l20 2 M8 20 l12 6" stroke="{O}" stroke-width="4" stroke-linecap="round"/><path d="M6 24 l14 -6 M10 26 l18 -4 M14 22 l20 2 M8 20 l12 6" stroke="#f0c64a" stroke-width="2" stroke-linecap="round"/>')
EXTRA=[('farm_tuft',farm_tuft,.4,.3),('farm_flowers',farm_flowers,.4,.3),('farm_straw',farm_straw,.4,.3)]
