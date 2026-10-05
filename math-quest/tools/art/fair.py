from kit import *
# ---------------- The Average Shoppe ----------------
_bars=(''.join(f'<rect x="{x}" y="{9-h}" width="6" height="{h}" fill="{c}" stroke="{O}" stroke-width="1.8"/>' for x,h,c in ((-11,6,'#4dabf7'),(-3,16,'#51cf66'),(5,8,'#ff922b')))
       +f'<path d="M-13 9 H13" stroke="{O}" stroke-width="2.2" stroke-linecap="round"/>'
       +'<path d="M-14 -1 H14" stroke="#e03131" stroke-width="2.4" stroke-dasharray="3.2 2.4"/>')
_can=lambda x,y,w,h,c:(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="1.2" fill="{c}" stroke="{O}" stroke-width="1.6"/>'
                       f'<rect x="{x}" y="{y+h*.35:.1f}" width="{w}" height="{h*.3:.1f}" fill="#fff" opacity=".75"/>')
def _window(x0,x1,y0,y1):
    w=x1-x0;o=f'<rect x="{x0}" y="{y0}" width="{w}" height="{y1-y0}" rx="2" fill="#bfe6f2" stroke="{O}" stroke-width="3.5"/>'
    cols=['#e03131','#4dabf7','#fab005','#51cf66','#ae3ec9','#ff922b']
    for r,yy in enumerate((y0+16,y1-6)):
        o+=f'<path d="M{x0+2} {yy} h{w-4}" stroke="#9a6533" stroke-width="3"/>'
        n=int((w-6)//8)
        for i in range(n):o+=_can(x0+4+i*8,yy-11,6,10,cols[(i+r*2)%6])
    o+=f'<path d="M{x0+5} {y0+4} l10 0 M{x0+5} {y0+4} l0 8" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>'
    o+=f'<path d="M{(x0+x1)/2} {y0} V{y1}" stroke="{O}" stroke-width="2.5"/>'
    return o
_awn=''.join(f'<rect x="{40+i*16}" y="92" width="16" height="16" fill="{"#e8590c" if i%2==0 else "#fff4e6"}"/>' for i in range(10))
_scal=''.join(f'<path d="M{40+i*16} 108 a8 8 0 0 0 16 0" fill="{"#e8590c" if i%2==0 else "#fff4e6"}" stroke="{O}" stroke-width="3"/>' for i in range(10))
ENTRANCE=svg('0 0 240 200',
  '<ellipse cx="120" cy="188" rx="108" ry="10" fill="rgba(0,0,0,.2)"/>'
  f'<rect x="44" y="74" width="152" height="114" fill="url(#w)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
  # gable roof
  f'<path d="M30 82 L120 22 L210 82 Z" fill="url(#r)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
  '<path d="M60 70 h120 M82 56 h76 M102 42 h36" stroke="#4a2a5a" stroke-width="2.2"/>'
  '<path d="M42 74 L118 26" stroke="#fff" stroke-opacity=".4" stroke-width="3.5" stroke-linecap="round"/>'
  f'<path d="M120 22 v-12" stroke="{O}" stroke-width="3"/><circle cx="120" cy="9" r="4" fill="#ffd43b" stroke="{O}" stroke-width="2.4"/>'
  # windows
  +_window(52,94,118,170)+_window(146,188,118,170)+
  # planter boxes
  ''.join(f'<rect x="{x}" y="170" width="46" height="10" rx="2" fill="#9a6533" stroke="{O}" stroke-width="3"/><path d="M{x+4} 170 q4 -8 8 0 q4 -9 8 0 q4 -8 8 0 q4 -9 8 0" fill="#51cf66" stroke="{O}" stroke-width="2" stroke-linejoin="round"/><circle cx="{x+12}" cy="165" r="2.6" fill="#f783ac" stroke="{O}" stroke-width="1.2"/><circle cx="{x+30}" cy="164" r="2.6" fill="#ffd43b" stroke="{O}" stroke-width="1.2"/>' for x in (50,144))
  # door
  +f'<path d="M98 188 L98 134 A22 22 0 0 1 142 134 L142 188 Z" fill="#2f6f9a" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
  +doorway(103,137,188,117,('#7a4e2c','#5c3a20','#422915','#2b1a0c','#170d05'))+
  f'<rect x="92" y="184" width="56" height="6" rx="2" fill="#d6cdb8" stroke="{O}" stroke-width="3"/>'
  # awning
  f'<g>{_awn}</g>{_scal}<path d="M38 92 h164" stroke="{O}" stroke-width="4.5" stroke-linecap="round"/><path d="M40 92 v16 M200 92 v16" stroke="{O}" stroke-width="3"/>'
  +plaque(120,58,18,'<g transform="translate(0 1) scale(1.18)">'+_bars+'</g>'),
  grad('w','#ffd08a','#e8a24c')+grad('r','#8e5aa8','#5a3270'))

# ---- BLOCK ----
WD=grad('wd','#d9a46a','#9a6533')
_cols=['#e03131','#4dabf7','#fab005','#51cf66','#ae3ec9','#ff922b']
fair_shelf=svg('0 0 100 110',shadow(50,104,44)
  +f'<rect x="10" y="10" width="80" height="92" rx="3" fill="url(#wd)" stroke="{O}" stroke-width="4.5"/><rect x="16" y="16" width="68" height="80" fill="#7a5230"/>'
  +''.join(''.join(_can(18+i*13,y-17,11,17,_cols[(i+r)%6]) for i in range(5))+f'<rect x="14" y="{y}" width="72" height="5" fill="#c9915a" stroke="{O}" stroke-width="2"/>' for r,y in enumerate((38,64,90)))
  +f'<path d="M14 14 h30" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>'
  # little sign on top
  f'<rect x="30" y="2" width="40" height="12" rx="3" fill="#fff4e6" stroke="{O}" stroke-width="2.6"/>'
  +''.join(f'<rect x="{x}" y="{13-h}" width="5" height="{h}" fill="{c}"/>' for x,h,c in ((38,4,'#4dabf7'),(46,9,'#51cf66'),(54,6,'#ff922b')))
  +'<path d="M34 7.5 h32" stroke="#e03131" stroke-width="1.5" stroke-dasharray="2 1.5"/>',WD)
_box=lambda x,y,w,h:(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="url(#cb)" stroke="{O}" stroke-width="3.5"/>'
                     f'<path d="M{x+w/2} {y} v{h*.4:.0f}" stroke="#d9c08a" stroke-width="5"/><path d="M{x+w/2} {y} v{h*.4:.0f}" stroke="#9a6d3a" stroke-width="1.5" opacity=".5"/>'
                     f'<path d="M{x+4} {y+5} h{w*.3:.0f}" stroke="#fff" stroke-opacity=".45" stroke-width="2.5" stroke-linecap="round"/>')
fair_boxes=svg('0 0 90 80',shadow(45,76,40)+_box(6,42,40,32)+_box(46,46,38,28)+_box(22,12,40,32)
  +f'<path d="M30 58 l5 5 l5 -5 M64 58 l5 5 l5 -5" stroke="{O}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  grad('cb','#e8bf84','#b9864c'))
fair_cart=svg('0 0 100 85',shadow(50,81,42)
  +''.join(_can(x,y,10,14,c) for x,y,c in ((24,20,'#e03131'),(36,18,'#4dabf7'),(48,20,'#fab005'),(60,18,'#51cf66')))
  +f'<path d="M64 22 l6 -6 l6 6" fill="#51cf66" stroke="{O}" stroke-width="2"/>'
  +f'<path d="M4 14 L16 14 L26 60 L80 60" fill="none" stroke="{O}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 14 L16 14 L26 60 L80 60" fill="none" stroke="#c3ccd9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
  f'<path d="M18 30 L88 30 L80 54 L24 54 Z" fill="#dfe6ef" fill-opacity=".85" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
  '<path d="M30 30 l3 24 M44 30 l1 24 M58 30 v24 M72 30 l-2 24 M21 42 h63" stroke="#8f9bb0" stroke-width="2"/>'
  f'<path d="M4 14 h8" stroke="#e03131" stroke-width="6" stroke-linecap="round"/>'
  +''.join(f'<circle cx="{x}" cy="72" r="7" fill="#5b5f6b" stroke="{O}" stroke-width="3"/><circle cx="{x}" cy="72" r="2.2" fill="#c3ccd9"/>' for x in (32,74)))
fair_sign=svg('0 0 70 120',shadow(35,115,20)
  +f'<rect x="31" y="40" width="8" height="76" rx="2" fill="#8b5a2b" stroke="{O}" stroke-width="3.5"/>'
  f'<path d="M6 12 L56 12 L66 28 L56 44 L6 44 Z" fill="url(#sg)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
  +''.join(f'<rect x="{x}" y="{38-h}" width="8" height="{h}" fill="{c}" stroke="{O}" stroke-width="2"/>' for x,h,c in ((14,8,'#4dabf7'),(26,20,'#51cf66'),(38,11,'#ff922b')))
  +'<path d="M10 25 H54" stroke="#e03131" stroke-width="2.6" stroke-dasharray="4 3"/>'
  '<path d="M10 17 h30" stroke="#fff" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round"/>',
  grad('sg','#fff8e8','#ead7b0'))
_sack=lambda x,y,w,h,c,band:(f'<path d="M{x} {y+h} Q{x-4} {y+h*.4} {x+w*.2} {y+h*.08} L{x+w*.8} {y+h*.08} Q{x+w+4} {y+h*.4} {x+w} {y+h} Z" fill="{c}" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
                        f'<ellipse cx="{x+w/2}" cy="{y+h*.1:.1f}" rx="{w*.32:.1f}" ry="4" fill="#fffaf0" stroke="{O}" stroke-width="2.4"/>'
                        f'<rect x="{x+w*.15:.1f}" y="{y+h*.45:.1f}" width="{w*.7:.1f}" height="9" fill="{band}" stroke="{O}" stroke-width="2"/>'
                        f'<path d="M{x+5} {y+h*.3:.0f} q-2 {h*.25:.0f} 0 {h*.45:.0f}" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>')
fair_sacks=svg('0 0 90 70',shadow(45,66,40)+_sack(46,16,36,48,'#f3ead6','#4dabf7')+_sack(8,10,40,54,'#efe2c4','#e03131')
  +f'<path d="M30 12 l14 -10" stroke="{O}" stroke-width="5" stroke-linecap="round"/><path d="M30 12 l14 -10" stroke="#c3ccd9" stroke-width="2.5" stroke-linecap="round"/>')
_wh=lambda x:f'<circle cx="{x}" cy="60" r="15" fill="none" stroke="{O}" stroke-width="5"/><circle cx="{x}" cy="60" r="15" fill="none" stroke="#5b5f6b" stroke-width="2.5"/><path d="M{x-12} 60 h24 M{x} 48 v24" stroke="#c3ccd9" stroke-width="1.3"/><circle cx="{x}" cy="60" r="2.5" fill="{O}"/>'
fair_bike=svg('0 0 115 80',shadow(57,76,50)+_wh(24)+_wh(90)
  +f'<path d="M24 60 L48 60 L72 34 L38 34 Z M48 60 L36 26 M72 34 L90 60 M72 34 L68 22" fill="none" stroke="{O}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>'
  '<path d="M24 60 L48 60 L72 34 L38 34 Z M48 60 L36 26 M72 34 L90 60 M72 34 L68 22" fill="none" stroke="#e03131" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'
  f'<path d="M28 24 h16" stroke="{O}" stroke-width="6" stroke-linecap="round"/><path d="M62 20 h12" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
  # front basket with bread + cans
  f'<path d="M80 12 q4 -10 14 -8 q6 2 4 8" fill="#e0a95e" stroke="{O}" stroke-width="2.4"/>'
  +_can(96,8,8,12,'#4dabf7')+
  f'<path d="M74 14 L108 14 L104 32 L78 32 Z" fill="url(#bk)" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
  '<path d="M76 21 h30 M77 27 h28 M84 14 v18 M92 14 v18 M100 14 v18" stroke="#8a5a2b" stroke-width="1.5"/>'
  f'<path d="M74 32 L80 40" stroke="{O}" stroke-width="2.5"/>',
  grad('bk','#e2b277','#a8733c'))
BLOCK=[('fair_shelf',fair_shelf,1,1.1),('fair_boxes',fair_boxes,.9,.8),('fair_cart',fair_cart,1,.85),
       ('fair_sign',fair_sign,.7,1.2),('fair_sacks',fair_sacks,.9,.7),('fair_bike',fair_bike,1.15,.8)]

# ---- DECO ----
_bcan=lambda x,y,c:(f'<rect x="{x}" y="{y}" width="14" height="16" rx="2" fill="{c}" stroke="{O}" stroke-width="2.2"/><rect x="{x}" y="{y+5}" width="14" height="6" fill="#fff" opacity=".8"/>'
                    f'<path d="M{x+2.5} {y+2} v12" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>')
fair_cans=svg('0 0 50 50',shadow(25,47,22)+_bcan(4,30,'#e03131')+_bcan(18,30,'#4dabf7')+_bcan(32,30,'#fab005')
  +_bcan(11,14,'#51cf66')+_bcan(25,14,'#ae3ec9'))
fair_tag=svg('0 0 45 55',shadow(22,52,12)
  +f'<path d="M22 52 V28" stroke="{O}" stroke-width="5" stroke-linecap="round"/><path d="M22 52 V28" stroke="#a0703c" stroke-width="2.2" stroke-linecap="round"/>'
  f'<path d="M6 10 L28 4 L40 16 L34 32 L12 34 Z" fill="#ffd43b" stroke="{O}" stroke-width="3" stroke-linejoin="round" transform="rotate(-8 22 18)"/>'
  f'<circle cx="31" cy="11" r="2.6" fill="#fff" stroke="{O}" stroke-width="1.6"/>'
  +f'<path d="M13 15 v12 M11 17 l2 -2 M17 27 h0" stroke="{O}" stroke-width="2.4" stroke-linecap="round"/>'
  '<path d="M19 15 q5 -2 6 2 q0 3 -6 9 h7" stroke="#3b2a1e" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
fair_pot=svg('0 0 45 55',shadow(22,52,14)
  +f'<path d="M22 34 q-14 -6 -16 -20 q12 2 16 16 M22 34 q14 -8 16 -24 q-12 4 -16 20 M22 34 q-2 -16 2 -28 q6 12 -2 28" fill="#51cf66" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
  f'<path d="M10 32 L34 32 L31 52 L13 52 Z" fill="url(#tc)" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
  f'<rect x="8" y="30" width="28" height="7" rx="2" fill="#e8784a" stroke="{O}" stroke-width="2.6"/>'
  '<path d="M15 40 v8" stroke="#fff" stroke-opacity=".45" stroke-width="2.5" stroke-linecap="round"/>',
  grad('tc','#f08c5a','#c4552a'))
fair_scale=svg('0 0 55 50',shadow(27,47,20)
  +f'<path d="M27 10 V42" stroke="{O}" stroke-width="6" stroke-linecap="round"/><path d="M27 10 V42" stroke="#fab005" stroke-width="3" stroke-linecap="round"/>'
  f'<path d="M17 46 h20" stroke="{O}" stroke-width="5" stroke-linecap="round"/><path d="M17 46 h20" stroke="#fab005" stroke-width="2.2" stroke-linecap="round"/>'
  f'<path d="M7 14 H47" stroke="{O}" stroke-width="5" stroke-linecap="round"/><path d="M7 14 H47" stroke="#fab005" stroke-width="2.2" stroke-linecap="round"/>'
  f'<path d="M8 14 L3 28 M8 14 L13 28 M46 14 L41 28 M46 14 L51 28" stroke="{O}" stroke-width="1.5"/>'
  f'<path d="M1 28 h14 q-7 8 -14 0 Z M39 28 h14 q-7 8 -14 0 Z" fill="#ffd43b" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
  f'<circle cx="27" cy="9" r="3.5" fill="#ffd43b" stroke="{O}" stroke-width="2"/>'
  f'<circle cx="5" cy="25" r="3" fill="#e03131" stroke="{O}" stroke-width="1.4"/><circle cx="11" cy="25" r="3" fill="#e03131" stroke="{O}" stroke-width="1.4"/><circle cx="46" cy="25" r="3" fill="#e03131" stroke="{O}" stroke-width="1.4"/>'
  f'<circle cx="49" cy="25" r="3" fill="#e03131" stroke="{O}" stroke-width="1.4"/>')
DECO=[('fair_cans',fair_cans,.5,.5),('fair_tag',fair_tag,.45,.55),('fair_pot',fair_pot,.45,.55),('fair_scale',fair_scale,.55,.5)]

# ---- EXTRA ----
def _fl(x,y,c):return ''.join(f'<ellipse cx="0" cy="-3" rx="2.2" ry="3" fill="{c}" stroke="{O}" stroke-width="1" transform="translate({x} {y}) rotate({i*72})"/>' for i in range(5))+f'<circle cx="{x}" cy="{y}" r="1.8" fill="#ffd43b"/>'
fair_flowers=svg('0 0 40 30',f'<path d="M10 28 q4 -12 8 0 q3 -8 6 0 q3 -10 6 0" fill="#51cf66" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'+_fl(12,14,'#f783ac')+_fl(26,10,'#748ffc')+_fl(32,20,'#fff'))
fair_pebbles=svg('0 0 40 30',f'<ellipse cx="13" cy="21" rx="8" ry="5.5" fill="#a9b8b0" stroke="{O}" stroke-width="2"/><ellipse cx="28" cy="23" rx="6" ry="4" fill="#c3cfc8" stroke="{O}" stroke-width="2"/><ellipse cx="22" cy="14" rx="4" ry="3" fill="#94a49b" stroke="{O}" stroke-width="1.8"/><path d="M9 19 q3 -2 6 -2" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
fair_tuft=svg('0 0 40 30',f'<path d="M6 28 q4 -16 8 0 q3 -12 6 0 q4 -18 8 0 q3 -10 6 0" fill="#69c97a" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>')
EXTRA=[('fair_flowers',fair_flowers,.4,.3),('fair_pebbles',fair_pebbles,.4,.3),('fair_tuft',fair_tuft,.4,.3)]
