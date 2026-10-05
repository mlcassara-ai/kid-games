from kit import *
# ---------------- Money Market ----------------
def dollar(s=1,c=O,w=2.4):
    return (f'<g transform="scale({s})"><path d="M5 -5 Q5 -8.5 0 -8.5 Q-5.5 -8.5 -5.5 -4.2 Q-5.5 -0.5 0 -0.2 Q5.5 0.2 5.5 4.2 Q5.5 8.5 0 8.5 Q-5 8.5 -5.2 5" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<path d="M0 -11.5 V11.5" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/></g>')
def cent(s=1,c=O,w=2.4):
    return (f'<g transform="scale({s})"><path d="M5 -4.5 A6.5 6.5 0 1 0 5 4.5" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<path d="M0 -10 V10" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/></g>')
def coin(cx,cy,r,sym='$',sw=2.5,gid='g'):
    m=dollar(r/15,'#a86b00',2.6) if sym=='$' else (cent(r/15,'#a86b00',2.6) if sym=='c' else '')
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*.74:.1f}" fill="none" stroke="#c98a0a" stroke-width="{max(1,r*.09):.1f}"/>'
            f'<g transform="translate({cx} {cy})">{m}</g>'
            f'<path d="M{cx-r*.6:.1f} {cy-r*.25:.1f} A{r*.65:.1f} {r*.65:.1f} 0 0 1 {cx-r*.1:.1f} {cy-r*.65:.1f}" stroke="#fff" stroke-opacity=".6" stroke-width="{max(1.2,r*.12):.1f}" fill="none" stroke-linecap="round"/>')
GOLD=grad('g','#fff3a0','#e0a100','#ffd43b')
_plq=f'<circle r="12" fill="url(#g)" stroke="{O}" stroke-width="2.4"/><circle r="9" fill="none" stroke="#c98a0a" stroke-width="1.5"/>'+dollar(.68,O,2.6)
_col=lambda x:(f'<rect x="{x-7}" y="96" width="14" height="78" fill="url(#c)" stroke="{O}" stroke-width="3.5"/>'
               f'<rect x="{x-10}" y="90" width="20" height="7" rx="2" fill="#f8f4ec" stroke="{O}" stroke-width="3"/>'
               f'<path d="M{x-2} 100 v70" stroke="#c9c2b4" stroke-width="2"/>')
_awn=''.join(f'<path d="M{x} 104 h10 v12 a5 5 0 0 1 -10 0 Z" fill="{c}"/>' for x,c in zip(range(90,150,10),['#e03131','#fff','#e03131','#fff','#e03131','#fff']))
ENTRANCE=svg('0 0 240 200',
  '<ellipse cx="120" cy="188" rx="108" ry="10" fill="rgba(0,0,0,.2)"/>'
  f'<rect x="54" y="86" width="132" height="92" fill="url(#w)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
  '<path d="M58 110 h36 M146 110 h36 M58 134 h36 M146 134 h36 M58 158 h36 M146 158 h36" stroke="#d6cdb8" stroke-width="2"/>'
  # steps
  f'<rect x="40" y="176" width="160" height="12" rx="2" fill="#d9d2c3" stroke="{O}" stroke-width="4"/>'
  f'<rect x="48" y="170" width="144" height="8" rx="2" fill="#ece6d8" stroke="{O}" stroke-width="3.5"/>'
  +_col(66)+_col(174)+
  # door + awning
  f'<path d="M93 170 L93 136 A27 27 0 0 1 147 136 L147 170 Z" fill="#2b8a7e" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
  +doorway(99,141,170,116,('#6b4a2e','#523621','#3a2616','#24170c','#140c05'))+
  f'<g>{_awn}</g><path d="M86 104 h68" stroke="{O}" stroke-width="4" stroke-linecap="round"/>'
  f'<path d="M90 104 v12 a5 5 0 0 0 10 0 a5 5 0 0 0 10 0 a5 5 0 0 0 10 0 a5 5 0 0 0 10 0 a5 5 0 0 0 10 0 a5 5 0 0 0 10 0 v-12" fill="none" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
  # entablature + pediment
  f'<rect x="44" y="78" width="152" height="12" rx="2" fill="#2b8a7e" stroke="{O}" stroke-width="4"/>'
  f'<path d="M38 80 L120 34 L202 80 Z" fill="url(#r)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
  '<path d="M50 74 L120 40" stroke="#fff" stroke-opacity=".45" stroke-width="3.5" stroke-linecap="round"/>'
  '<path d="M58 84 h124" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/>'
  # flag
  f'<path d="M120 34 V12" stroke="{O}" stroke-width="3"/><path d="M120 12 l16 5 l-16 6 Z" fill="#ffd43b" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
  +plaque(120,62,17,_plq)+
  # coin piles by the steps
  ''.join(f'<rect x="18" y="{y}" width="20" height="5" rx="2.5" fill="url(#g)" stroke="{O}" stroke-width="2.2"/>' for y in (182,177,172,167))
  +''.join(f'<rect x="{x}" y="{y}" width="20" height="5" rx="2.5" fill="url(#g)" stroke="{O}" stroke-width="2.2"/>' for x,y in ((204,182),(205,177)))
  +coin(212,166,8,'',2.2),
  GOLD+grad('w','#fbf7ee','#d8cfbc')+grad('c','#ffffff','#cfc7b6','#ece6d8',1,0)+grad('r','#3fb5a5','#1f6f65'))

# ---- BLOCK ----
_stripes=lambda x0,x1,y0,y1,a,b,n:''.join(f'<rect x="{x0+i*(x1-x0)/n:.1f}" y="{y0}" width="{(x1-x0)/n:.1f}" height="{y1-y0}" fill="{a if i%2==0 else b}"/>' for i in range(n))
_fruit=lambda x,y,c,r=6:f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" stroke="{O}" stroke-width="2"/><path d="M{x-2} {y-3} l2 -1" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" stroke-linecap="round"/>'
market_stall=svg('0 0 110 110',shadow(55,104,48)
  +f'<path d="M18 46 V102 M92 46 V102" stroke="{O}" stroke-width="8" stroke-linecap="round"/><path d="M18 46 V102 M92 46 V102" stroke="#a0703c" stroke-width="3.5" stroke-linecap="round"/>'
  # counter
  f'<rect x="10" y="70" width="90" height="30" rx="3" fill="url(#wd)" stroke="{O}" stroke-width="4"/><path d="M14 84 h82" stroke="#7a5230" stroke-width="2"/>'
  # fruit on counter
  +''.join(_fruit(x,64,c) for x,c in ((22,'#e03131'),(34,'#e03131'),(28,'#fa5252')))
  +''.join(_fruit(x,64,c) for x,c in ((50,'#ff922b'),(62,'#ff922b')))
  +''.join(_fruit(x,64,c) for x,c in ((78,'#94d82d'),(90,'#94d82d')))
  +f'<path d="M10 70 h90" stroke="{O}" stroke-width="4"/>'
  # awning
  f'<clipPath id="ac"><path d="M6 18 L104 18 L104 44 L6 44 Z"/></clipPath>'
  f'<g clip-path="url(#ac)">{_stripes(6,104,18,44,"#e03131","#fff",7)}</g>'
  f'<path d="M6 18 L104 18 L104 44 L6 44 Z" fill="none" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
  +''.join(f'<path d="M{6+i*14} 44 a7 7 0 0 0 14 0" fill="{"#e03131" if i%2==0 else "#fff"}" stroke="{O}" stroke-width="3"/>' for i in range(7))
  +f'<path d="M14 10 L96 10 L104 18 L6 18 Z" fill="#c92a2a" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
  # price coin on the counter front
  +coin(55,86,9,'c',2.4),
  GOLD+grad('wd','#d9a46a','#9a6533'))
_crate=lambda x,y,w,h,f:(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="url(#wd)" stroke="{O}" stroke-width="3.5"/>'
                         f'<path d="M{x+3} {y+h/2} h{w-6}" stroke="#7a5230" stroke-width="2"/>'
                         f'<path d="M{x+4} {y+4} h{w-12}" stroke="#fff" stroke-opacity=".4" stroke-width="2.5" stroke-linecap="round"/>')
market_crates=svg('0 0 90 80',shadow(45,76,40)
  +''.join(_fruit(x,47,'#e03131',6) for x in (14,26,38))+''.join(_fruit(x,47,'#ff922b',6) for x in (52,64,76))
  +_crate(6,48,40,26,0)+_crate(46,48,40,26,0)
  +''.join(_fruit(x,21,'#ffd43b',6) for x in (34,46,58))
  +_crate(24,22,44,26,0),
  grad('wd','#d9a46a','#9a6533'))
_barrel=lambda x,y,w,h:(f'<path d="M{x} {y+4} Q{x-4} {y+h/2} {x} {y+h-4} Q{x+w/2} {y+h+3} {x+w} {y+h-4} Q{x+w+4} {y+h/2} {x+w} {y+4} Q{x+w/2} {y-3} {x} {y+4} Z" fill="url(#bb)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
                        f'<path d="M{x-1} {y+h*.28:.0f} Q{x+w/2} {y+h*.28+5:.0f} {x+w+1} {y+h*.28:.0f} M{x-1} {y+h*.72:.0f} Q{x+w/2} {y+h*.72+5:.0f} {x+w+1} {y+h*.72:.0f}" stroke="#5b5f6b" stroke-width="3.5" fill="none"/>'
                        f'<ellipse cx="{x+w/2}" cy="{y+4}" rx="{w/2}" ry="4" fill="#c9915a" stroke="{O}" stroke-width="3"/>'
                        f'<path d="M{x+5} {y+12} v{h-24}" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>')
market_barrels=svg('0 0 90 80',shadow(45,76,40)+_barrel(8,26,36,48)+_barrel(46,30,36,44)
  +''.join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="3" fill="url(#g)" stroke="{O}" stroke-width="1.8"/>' for x,y in ((20,28),(30,27),(25,24))),
  GOLD+grad('bb','#c98a4f','#8a5a2b','#b07a42',1,0))
_wheel=lambda x:f'<circle cx="{x}" cy="64" r="13" fill="#8b5a2b" stroke="{O}" stroke-width="3.5"/><circle cx="{x}" cy="64" r="8" fill="none" stroke="#c9915a" stroke-width="2"/><path d="M{x-11} 64 h22 M{x} 53 v22" stroke="#c9915a" stroke-width="2"/><circle cx="{x}" cy="64" r="3" fill="{O}"/>'
market_cart=svg('0 0 115 80',shadow(56,76,50)
  +f'<path d="M86 50 L112 34" stroke="{O}" stroke-width="7" stroke-linecap="round"/><path d="M86 50 L112 34" stroke="#a0703c" stroke-width="3" stroke-linecap="round"/>'
  +''.join(_fruit(x,y,c,7) for x,y,c in ((22,34,'#e03131'),(36,32,'#ff922b'),(50,33,'#e03131'),(64,32,'#94d82d'),(76,35,'#ff922b'),(30,24,'#94d82d'),(44,22,'#e03131'),(58,23,'#ff922b'),(70,25,'#e03131')))
  +f'<path d="M8 36 L92 36 L86 60 L14 60 Z" fill="url(#wd)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
  '<path d="M12 46 h76" stroke="#7a5230" stroke-width="2"/><path d="M14 40 h50" stroke="#fff" stroke-opacity=".4" stroke-width="2.5" stroke-linecap="round"/>'
  +_wheel(28)+_wheel(72),
  grad('wd','#d9a46a','#9a6533'))
market_coinsign=svg('0 0 70 130',shadow(35,125,20)
  +f'<rect x="31" y="56" width="8" height="70" rx="2" fill="#8b5a2b" stroke="{O}" stroke-width="3.5"/>'
  f'<path d="M24 124 h22" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
  +coin(35,36,30,'$',4.5),
  GOLD)
_sack=lambda x,y,w,h,c:(f'<path d="M{x} {y+h} Q{x-4} {y+h*.4} {x+w*.25} {y+h*.15} L{x+w*.3} {y} L{x+w*.7} {y} L{x+w*.75} {y+h*.15} Q{x+w+4} {y+h*.4} {x+w} {y+h} Z" fill="{c}" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
                        f'<path d="M{x+w*.25} {y+h*.16} h{w*.5}" stroke="#a0522d" stroke-width="3"/>'
                        f'<path d="M{x+w*.3} {y} q{w*.2} -6 {w*.4} 0" fill="#f0c64a" stroke="{O}" stroke-width="2.4"/>'
                        f'<path d="M{x+6} {y+h*.45} q-2 {h*.25} 0 {h*.45}" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>')
market_sacks=svg('0 0 90 70',shadow(45,66,40)+_sack(44,14,36,50,'#e8d3a8')+_sack(10,18,38,46,'#dcc394')
  +f'<path d="M30 50 h8 M58 44 h8" stroke="#a88a5a" stroke-width="2" stroke-linecap="round"/>')
BLOCK=[('market_stall',market_stall,1.1,1.1),('market_crates',market_crates,.9,.8),('market_barrels',market_barrels,.9,.8),
       ('market_cart',market_cart,1.15,.8),('market_coinsign',market_coinsign,.7,1.3),('market_sacks',market_sacks,.9,.7)]

# ---- DECO ----
market_basket=svg('0 0 55 45',shadow(27,42,22)
  +''.join(_fruit(x,y,c,5.5) for x,y,c in ((16,20,'#e03131'),(27,17,'#e03131'),(38,20,'#fa5252'),(22,13,'#94d82d'),(33,12,'#e03131')))
  +f'<path d="M14 18 Q27 -4 41 18" fill="none" stroke="{O}" stroke-width="5"/><path d="M14 18 Q27 -4 41 18" fill="none" stroke="#c9915a" stroke-width="2.5"/>'
  f'<path d="M6 22 L49 22 L43 41 L12 41 Z" fill="url(#bk)" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
  '<path d="M9 29 h37 M11 35 h33 M18 22 l2 19 M27 22 v19 M36 22 l-2 19" stroke="#8a5a2b" stroke-width="1.6"/>',
  grad('bk','#e2b277','#a8733c'))
market_coins=svg('0 0 50 45',shadow(25,42,21)
  +''.join(f'<rect x="{x}" y="{y}" width="18" height="5" rx="2.5" fill="url(#g)" stroke="{O}" stroke-width="2"/>' for x,y in ((6,36),(7,31),(6,26),(7,21),(6,16)))
  +''.join(f'<rect x="{x}" y="{y}" width="18" height="5" rx="2.5" fill="url(#g)" stroke="{O}" stroke-width="2"/>' for x,y in ((26,36),(27,31),(26,26)))
  +coin(38,18,8,'',2),GOLD)
market_price=svg('0 0 45 55',shadow(22,52,16)
  +f'<path d="M12 52 L18 18 M33 52 L27 18" stroke="{O}" stroke-width="5" stroke-linecap="round"/><path d="M12 52 L18 18 M33 52 L27 18" stroke="#a0703c" stroke-width="2.2" stroke-linecap="round"/>'
  f'<rect x="5" y="6" width="35" height="26" rx="3" fill="#2f3a35" stroke="{O}" stroke-width="3"/><rect x="5" y="6" width="35" height="26" rx="3" fill="none" stroke="#c9915a" stroke-width="1.2" transform="translate(0 0)"/>'
  +f'<g transform="translate(16 19)">{cent(.7,"#fff",2.6)}</g><path d="M26 15 l3 -2 v12 M26 25 h6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
market_piggy=svg('0 0 55 45',shadow(27,42,20)
  +f'<path d="M14 36 v6 M22 38 v5 M34 38 v5 M42 36 v6" stroke="{O}" stroke-width="6" stroke-linecap="round"/><path d="M14 36 v6 M22 38 v5 M34 38 v5 M42 36 v6" stroke="#f783ac" stroke-width="3" stroke-linecap="round"/>'
  f'<ellipse cx="28" cy="26" rx="20" ry="14" fill="url(#pg)" stroke="{O}" stroke-width="3"/>'
  f'<path d="M14 15 l-2 -8 l8 4 Z" fill="#f783ac" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
  f'<ellipse cx="9" cy="27" rx="4.5" ry="5.5" fill="#faa2c1" stroke="{O}" stroke-width="2.2"/><circle cx="8" cy="25.5" r=".9" fill="{O}"/><circle cx="8" cy="28.5" r=".9" fill="{O}"/>'
  f'<circle cx="16" cy="21" r="1.8" fill="{O}"/><path d="M48 24 q5 -2 3 -6 q-3 -2 -2 2" stroke="{O}" stroke-width="2" fill="none" stroke-linecap="round"/>'
  f'<rect x="24" y="12" width="10" height="3" rx="1.5" fill="{O}"/>'
  '<path d="M20 18 q6 -4 14 -4" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
  +coin(29,6,5,'',1.6),
  GOLD+grad('pg','#ffc9de','#e86a9a'))
DECO=[('market_basket',market_basket,.55,.45),('market_coins',market_coins,.5,.45),('market_price',market_price,.45,.55),('market_piggy',market_piggy,.55,.45)]

# ---- EXTRA ----
market_coin=svg('0 0 40 30',f'<ellipse cx="20" cy="25" rx="10" ry="2.5" fill="rgba(0,0,0,.2)"/>'+coin(20,15,9,'',2.2)+coin(31,22,5,'',1.6),GOLD)
market_pebbles=svg('0 0 40 30',f'<ellipse cx="13" cy="21" rx="8" ry="5.5" fill="#b5a68c" stroke="{O}" stroke-width="2"/><ellipse cx="28" cy="23" rx="6" ry="4" fill="#cbbd9f" stroke="{O}" stroke-width="2"/><ellipse cx="22" cy="14" rx="4" ry="3" fill="#a8987c" stroke="{O}" stroke-width="1.8"/><path d="M9 19 q3 -2 6 -2" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
EXTRA=[('market_coin',market_coin,.4,.3),('market_pebbles',market_pebbles,.4,.3)]
