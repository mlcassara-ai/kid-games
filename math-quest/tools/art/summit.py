"""Story Summit (word problems): log lodge under a snowy peak, dark greens, warm wood and blue-grey shading on snow."""
from kit import *
def p(d,f,sw=4):return f'<path d="{d}" fill="{f}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"/>'
def hl(d,sw=3):return f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="{sw}" stroke-linecap="round"/>'
def ln(d,c,sw=2):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
SNOW='#ffffff';SNOWS='#c9d6ea'   # snow and its blue-grey shade
sn=lambda i:grad(i,'#ffffff','#bccbe2','#e6edf8')
wood=lambda i:grad(i,'#b07a45','#6b4423','#8f5e34',1,0)
pine=lambda i:grad(i,'#3f8f5a','#1d4d34')

# ---------- entrance: log lodge in front of a snowy peak, open-book plaque in the gable
book=(p('M0 -4 Q-6 -8 -12 -6 V6 Q-6 4 0 7 Z','#ffffff',1.8)+p('M0 -4 Q6 -8 12 -6 V6 Q6 4 0 7 Z','#ffffff',1.8)
 +ln('M-9 -2.5 Q-5 -4 -3 -2.5 M-9 1 Q-5 -.5 -3 1 M3 -2.5 Q5 -4 9 -2.5 M3 1 Q5 -.5 9 1','#4a74b5',1.3)
 +p('M-13 6 Q-6 4 0 8 Q6 4 13 6 V8.5 Q6 6.5 0 10 Q-6 6.5 -13 8.5 Z','#c0392b',1.5))
logs=''.join(f'<path d="M58 {y} H182" stroke="#5c3a20" stroke-width="2"/>' for y in range(124,188,10))
logs+=''.join(f'<circle cx="{x}" cy="{y}" r="4.6" fill="#d9a066" stroke="{O}" stroke-width="2"/>' for x in (56,184) for y in range(124,184,10))
ENTRANCE=svg('0 0 240 200',
 shadow(120,189,112)
 +p('M4 188 L62 70 L86 92 L128 22 L182 104 L202 84 L238 188 Z','url(#smt)',4)
 +p('M50 94 L62 70 L86 92 L76 100 L68 92 L58 102 Z',SNOW,3.5)
 +p('M104 62 L128 22 L152 66 L142 60 L134 70 L124 58 L114 68 Z',SNOW,3.5)
 +p('M192 94 L202 84 L214 112 L206 106 L198 112 Z',SNOW,3)
 +hl('M60 80 L22 160 M124 32 L96 84',3)
 +p('M150 76 V48 H166 V92 Z','#8a6a5a',3.5)+p('M147 48 H169 V42 H147 Z','#6b4c3e',3)+p('M146 44 Q158 34 170 44 Q166 40 158 40 Q150 40 146 44 Z',SNOW,2.5)
 +f'<g fill="#fff" fill-opacity=".85" stroke="{SNOWS}" stroke-width="2"><circle cx="160" cy="30" r="6"/><circle cx="168" cy="20" r="7.5"/><circle cx="178" cy="10" r="6"/></g>'
 +p('M58 188 V116 H182 V188 Z','url(#mwd)',4.5)+logs
 +p('M36 122 L120 58 L204 122 L190 124 L120 72 L50 124 Z','url(#mrf)',4.5)
 +p('M34 124 L120 56 L206 124 Q200 132 192 126 Q184 132 176 124 L120 80 L64 124 Q56 132 48 126 Q40 132 34 124 Z',SNOW,4)
 +hl('M50 118 L118 64',3)+ln('M70 120 L120 84 L170 120',SNOWS,2.5)
 +p('M78 124 L120 90 L162 124 Z','url(#mgb)',3.5)
 +plaque(120,107,16,'<g transform="scale(1.2)">'+book+'</g>')
 +p('M98 188 V146 A22 22 0 0 1 142 146 V188 Z','#5c3a20',4)
 +doorway(102,138,188,128,('#5d4a5a','#45364a','#2f2638','#1e1828','#120e18'))
 +p('M98 140 L120 124 L142 140 Q130 130 120 130 Q110 130 98 140 Z',SNOW,2.5)
 +''.join(p(f'M{x} 136 H{x+22} V156 H{x} Z','#ffd77a',3.5)+ln(f'M{x+11} 136 V156 M{x} 146 H{x+22}',O,2)+p(f'M{x-3} 136 Q{x+11} 128 {x+25} 136 Z',SNOW,2.5) for x in (66,152))
 +p('M8 188 Q20 172 40 176 Q56 170 70 188 Z',SNOW,3.5)+p('M170 188 Q186 170 206 176 Q224 172 234 188 Z',SNOW,3.5)
 +ln('M20 184 Q34 178 50 182 M186 184 Q202 178 220 182',SNOWS,2.5)
 +p('M28 176 L36 150 L44 176 Z','url(#mpn)',3)+p('M196 172 L204 144 L212 172 Z','url(#mpn)',3)
 +p('M31 166 L36 152 L41 166 L36 162 Z',SNOW,2)+p('M199 162 L204 146 L209 162 L204 158 Z',SNOW,2),
 grad('smt','#9fb2cf','#4f6385','#7a8fb0')+wood('mwd')+grad('mrf','#b5452f','#7a2c1c')+grad('mgb','#c99560','#8a5a33',None,0,1)+pine('mpn'))

# ---------- BLOCK
pinetree=svg('0 0 90 135',shadow(45,129,30)+'<defs>'+pine('a')+'</defs>'
 +p('M40 128 V108 H50 V128 Z','#6b4423',3.5)
 +p('M45 4 L66 40 L56 40 L76 72 L64 72 L84 108 L6 108 L26 72 L14 72 L34 40 L24 40 Z','url(#a)',4)
 +p('M45 4 L58 26 Q52 30 46 26 Q40 32 32 26 Z',SNOW,3)
 +p('M34 40 L24 40 L22 44 Q30 48 36 44 Q44 50 52 44 Q60 48 68 44 L66 40 L56 40 Z',SNOW,3)
 +p('M26 72 L14 72 L11 77 Q22 82 32 76 Q44 84 56 76 Q68 82 80 77 L76 72 L64 72 Z',SNOW,3)
 +p('M6 108 L84 108 L86 112 Q66 118 45 113 Q24 118 4 112 Z',SNOW,3)+hl('M40 14 L30 34 M30 50 L18 68',2.5))
rock=svg('0 0 100 75',shadow(50,70,44)+'<defs>'+grad('a','#a7b2c6','#56627a','#7d889e')+'</defs>'
 +p('M8 70 L16 40 L36 24 L62 20 L84 36 L94 70 Z','url(#a)',4)
 +p('M16 40 L36 24 L62 20 L84 36 L80 42 Q72 36 64 42 Q54 34 44 42 Q34 36 26 44 Q20 40 16 40 Z',SNOW,3.5)
 +ln('M44 52 L52 62 M68 50 l6 10','#3f4a5e',2.2)+hl('M22 50 L18 64',3))
snowman=svg('-3 -8 80 118',shadow(37,105,26)+'<defs>'+sn('a')+'</defs>'
 +f'<circle cx="37" cy="80" r="24" fill="url(#a)" stroke="{O}" stroke-width="4"/><circle cx="37" cy="44" r="17" fill="url(#a)" stroke="{O}" stroke-width="4"/>'
 +ln('M20 44 L4 32 M54 44 L70 30 M8 35 l-4 -6 M66 33 l4 -6','#6b4423',3)
 +f'<circle cx="37" cy="17" r="12" fill="url(#a)" stroke="{O}" stroke-width="3.5"/>'
 +p('M24 9 H50 V5 H44 V-6 H30 V5 H24 Z','#2b2533',3)
 +p('M22 27 Q37 34 52 27 L52 33 Q37 40 22 33 Z','#d64545',2.5)+p('M44 33 L50 50 L42 50 L40 35 Z','#d64545',2.5)
 +f'<circle cx="32" cy="15" r="2" fill="{O}"/><circle cx="42" cy="15" r="2" fill="{O}"/>'+p('M37 19 L48 21 L37 22 Z','#f08c2a',1.6)
 +''.join(f'<circle cx="37" cy="{y}" r="2.4" fill="{O}"/>' for y in (44,52,72,84))
 +hl('M26 36 Q24 44 28 52 M22 68 Q18 80 24 92',2.5))
sign=svg('0 0 80 120',shadow(40,114,24)+'<defs>'+wood('w')+'</defs>'
 +p('M35 116 V40 H45 V116 Z','url(#w)',3.5)
 +p('M14 30 L58 30 L70 40 L58 50 L14 50 Z','url(#w)',3.5)+p('M12 30 Q36 22 58 30 L62 33 Q36 28 12 34 Z',SNOW,2.4)
 +ln('M22 40 H52','#5c3a20',2.4)
 +f'<g transform="translate(40 76)">'+p('M0 -9 Q-10 -14 -20 -11 V9 Q-10 6 0 11 Z','#ffffff',2.5)+p('M0 -9 Q10 -14 20 -11 V9 Q10 6 0 11 Z','#ffffff',2.5)
 +ln('M-16 -6 Q-9 -8 -4 -6 M-16 -1 Q-9 -3 -4 -1 M-16 4 Q-10 2 -4 4 M4 -6 Q9 -8 16 -6 M4 -1 Q9 -3 16 -1 M4 4 Q10 2 16 4','#4a74b5',1.6)
 +p('M-22 9 Q-10 6 0 12 Q10 6 22 9 V13 Q10 10 0 16 Q-10 10 -22 13 Z','#2f6fb3',2)+'</g>'
 +p('M22 116 Q30 104 40 108 Q50 104 58 116 Z',SNOW,3))
igloo=svg('0 0 110 80',shadow(55,75,50)+'<defs>'+sn('a')+'</defs>'
 +p('M8 74 Q8 18 55 16 Q102 18 102 74 Z','url(#a)',4)
 +ln('M12 58 H98 M20 40 H90 M34 26 H76 M30 74 V58 M56 58 V40 M78 74 V58 M40 40 V26 M70 40 V26 M54 26 V16 M88 58 V40 M24 58 V40','#9fb2cf',2)
 +p('M38 74 V58 Q38 44 55 44 Q72 44 72 58 V74 Z','url(#a)',3.5)
 +p('M44 74 V60 Q44 50 55 50 Q66 50 66 60 V74 Z','#3b4a66',3)+p('M48 74 V62 Q48 55 55 55 Q62 55 62 62 V74 Z','#1e2638',0)
 +hl('M18 50 Q22 30 40 22',3.5))
books=svg('0 0 90 90',shadow(45,85,38)
 +p('M10 84 V68 H80 V84 Z','#2f6fb3',3.5)+ln('M14 72 H76','#ffffff',2)+p('M74 69 h6 v14 h-6 Z','#f4e3c1',2)
 +p('M16 68 V54 H72 V68 Z','#c0392b',3.5)+ln('M20 61 H66','#f7c948',2.5)+p('M14 69 h6 V55 h-6 Z','#f4e3c1',2)
 +p('M14 54 V40 H76 V54 Z','#2e8b57',3.5)+ln('M18 47 H70','#f4e3c1',2)
 +p('M20 40 V28 H70 V40 Z','#f08c2a',3.5)+ln('M26 34 H62','#5c3a20',2)
 +p('M14 30 Q20 16 36 20 Q46 12 58 18 Q72 14 76 30 Q66 26 58 32 Q48 26 40 32 Q28 26 14 30 Z',SNOW,3.5)
 +p('M74 54 Q80 52 80 46 L78 54 Z',SNOW,2)+ln('M22 26 Q32 22 40 24',SNOWS,2))
BLOCK=[('summit_pine',pinetree,.9,1.35),('summit_rock',rock,1.0,.75),('summit_snowman',snowman,.75,1.1),
 ('summit_sign',sign,.8,1.2),('summit_igloo',igloo,1.1,.8),('summit_books',books,.9,.9)]

# ---------- DECO
scroll=svg('0 0 60 40',shadow(30,36,24)
 +p('M12 10 H48 V30 H12 Z','#f4e3c1',2.8)+ln('M18 16 H42 M18 21 H40 M18 26 H36','#4a74b5',1.6)
 +p('M8 8 Q8 4 12 4 Q16 4 16 8 V32 Q16 36 12 36 Q8 36 8 32 Z','#e2c991',2.6)
 +p('M44 8 Q44 4 48 4 Q52 4 52 8 V32 Q52 36 48 36 Q44 36 44 32 Z','#e2c991',2.6)+ln('M30 30 v7','#c0392b',2.6))
crystal=svg('0 0 45 55',shadow(22,51,16)+'<defs>'+grad('a','#e6faff','#5fb4e0','#a9e2f7')+'</defs>'
 +p('M22 50 L14 20 L22 4 L30 20 Z','url(#a)',2.8)+p('M14 50 L6 32 L10 22 L18 34 Z','url(#a)',2.4)+p('M30 50 L28 30 L36 22 L40 36 Z','url(#a)',2.4)
 +ln('M22 6 V48','#5f9cc4',1.4)+hl('M18 20 L20 40',1.8))
mound=svg('0 0 60 35',shadow(30,32,26)+'<defs>'+sn('a')+'</defs>'
 +p('M4 32 Q8 16 22 14 Q30 6 40 12 Q54 14 56 32 Z','url(#a)',2.8)+ln('M14 26 Q26 20 40 24','#9fb2cf',2)+hl('M14 20 Q20 14 28 14',2.2))
lantern=svg('0 0 40 55',shadow(20,51,13)
 +p('M12 18 H28 V44 H12 Z','#ffd77a',2.8)+f'<circle cx="20" cy="31" r="5" fill="#fff4c2"/>'+ln('M12 31 H28','#e0a020',1.4)
 +p('M9 46 H31 V42 H9 Z','#2b2533',2.4)+p('M8 18 L20 9 L32 18 Z','#2b2533',2.4)
 +ln('M20 9 V4 M16 4 Q20 0 24 4','#3b2a1e',2)+p('M6 18 Q20 10 34 18 Q20 15 6 18 Z',SNOW,1.6))
DECO=[('summit_scroll',scroll,.6,.4),('summit_crystal',crystal,.45,.55),('summit_mound',mound,.6,.35),('summit_lantern',lantern,.4,.55)]

# ---------- EXTRA
flake=svg('0 0 40 30',f'<g transform="translate(20 15)" stroke="#6f8fbf" stroke-width="2.2" stroke-linecap="round">'
 +''.join(f'<g transform="rotate({a})"><path d="M0 0 V-10 M0 -6 l-3 -3 M0 -6 l3 -3"/></g>' for a in range(0,360,60))+'</g>')
icepeb=svg('0 0 40 30',f'<ellipse cx="13" cy="19" rx="6" ry="4.2" fill="#a9d4ee" stroke="#5a7aa6" stroke-width="1.8"/><ellipse cx="26" cy="22" rx="4" ry="3" fill="#8ea0bc" stroke="#4f6385" stroke-width="1.6"/><ellipse cx="23" cy="12" rx="3.2" ry="2.5" fill="#c6e6f7" stroke="#5a7aa6" stroke-width="1.5"/>')
EXTRA=[('summit_flake',flake,.4,.3),('summit_icepebbles',icepeb,.4,.3)]
