"""Time Temple (telling time): warm sandstone, terracotta and teal on pale desert sand."""
from kit import *
def p(d,f,sw=4):return f'<path d="{d}" fill="{f}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"/>'
def hl(d,sw=3):return f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="{sw}" stroke-linecap="round"/>'
def ln(d,c,sw=2):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
SAND=('#efbd78','#c98a45','#dda25e')   # sandstone light, dark, mid
TERRA=('#e07a4f','#a8472a')
TEAL='#2a9d8f';TEALD='#1d6f66'
sd=lambda i:grad(i,SAND[0],SAND[1],SAND[2])

# ---------- entrance: sandstone temple, columns, steps, clock plaque in the pediment
clock=(f'<circle r="11" fill="#fffaf0" stroke="{TEAL}" stroke-width="2"/>'
 +''.join(f'<circle cx="{9*__import__("math").sin(a*0.5236):.2f}" cy="{-9*__import__("math").cos(a*0.5236):.2f}" r="{1.3 if a%3==0 else .7}" fill="{O}"/>' for a in range(12))
 +f'<path d="M0 0 V-8 M0 0 H6" stroke="{O}" stroke-width="2.2" stroke-linecap="round"/><circle r="1.6" fill="{TERRA[1]}"/>')
cols=''
for x in (56,80,146,170):
    cols+=p(f'M{x} 156 V80 H{x+14} V156 Z','url(#tcol)',3.5)+ln(f'M{x+5} 84 V152 M{x+9.5} 84 V152','#b07a3e',1.6)
    cols+=p(f'M{x-3} 82 V75 H{x+17} V82 Z','url(#tsd)',3)+p(f'M{x-3} 158 V151 H{x+17} V158 Z','url(#tsd)',3)
    cols+=hl(f'M{x+2.5} 86 V148',2.2)
ENTRANCE=svg('0 0 240 200',
 shadow(120,189,110)
 +p('M24 188 H216 V177 H24 Z','url(#tstep)',4)+p('M34 177 H206 V167 H34 Z','url(#tstep)',4)+p('M44 167 H196 V157 H44 Z','url(#tstep)',4)
 +hl('M30 180 H210 M40 170 H200',2)
 +p('M54 158 V74 H186 V158 Z','url(#twall)',4.5)
 +ln('M54 100 H96 M144 100 H186 M54 128 H96 M144 128 H186','#b78449',2)
 +p('M92 158 V112 A28 28 0 0 1 148 112 V158 Z','url(#tsd)',4)
 +doorway(100,140,158,92,('#8a5a33','#6b4226','#4d2e1a','#331d10','#1e1109'))
 +cols
 +p('M38 62 H202 V78 H38 Z','url(#tsd)',4)+f'<rect x="42" y="67" width="156" height="6" fill="{TEAL}" stroke="{O}" stroke-width="2"/>'
 +''.join(f'<rect x="{x}" y="68.5" width="3" height="3" fill="#f6e7b9"/>' for x in range(48,196,10))
 +p('M32 63 L120 18 L208 63 Z','url(#tterra)',4.5)+hl('M48 56 L120 25',3)
 +p('M28 66 L32 54 L42 62 Z',TEAL,2.5)+p('M212 66 L208 54 L198 62 Z',TEAL,2.5)+p('M114 20 L120 8 L126 20 Z','#f2b83a',2.5)
 +plaque(120,46,15,clock)
 +p('M14 188 q2 -14 8 -16 q7 3 6 16 Z',TERRA[0],2.5)+ln('M15 181 h13',TEAL,2.5)
 +p('M226 188 q-2 -14 -8 -16 q-7 3 -6 16 Z',TERRA[0],2.5)+ln('M225 181 h-13',TEAL,2.5),
 grad('tsd',SAND[0],SAND[1],SAND[2],1,0)+grad('tcol','#f6d39a','#c58844','#e3ab66',1,0)+grad('twall','#d79a57','#b27236',None,0,1)
 +grad('tstep','#e8b170','#b97b3a',None,0,1)+grad('tterra',TERRA[0],TERRA[1]))

# ---------- BLOCK
sundial=svg('0 0 100 80',shadow(50,74,40)+'<defs>'+sd('a')+'</defs>'
 +p('M24 76 H76 V67 H24 Z','url(#a)',3.5)+p('M36 67 V46 H64 V67 Z','url(#a)',3.5)+hl('M40 50 V63',2)
 +p('M8 38 A42 13 0 0 1 92 38 L92 44 A42 13 0 0 1 8 44 Z',SAND[1],3.5)
 +f'<ellipse cx="50" cy="38" rx="42" ry="13" fill="#f6dba6" stroke="{O}" stroke-width="3.5"/>'
 +''.join(f'<path d="M{50+36*__import__("math").cos(a):.1f} {38+10.5*__import__("math").sin(a):.1f} L{50+30*__import__("math").cos(a):.1f} {38+8.6*__import__("math").sin(a):.1f}" stroke="{O}" stroke-width="2.2" stroke-linecap="round"/>' for a in [i*0.5236 for i in range(12)])
 +ln('M50 38 L22 44','rgba(59,42,30,.45)',4)
 +p('M50 39 L50 14 L74 39 Z',TEAL,3)+hl('M53 22 L53 34',2))
obelisk=svg('0 0 70 140',shadow(35,134,28)+'<defs>'+grad('a','#f2c587','#c07d3c','#dfa55f',1,0)+'</defs>'
 +p('M10 134 H60 V121 H10 Z','url(#a)',3.5)+p('M21 121 L26 32 L44 32 L49 121 Z','url(#a)',4)
 +p('M26 32 L35 12 L44 32 Z','#f2b83a',3.5)+hl('M29 30 L35 17',2)+hl('M27 40 L23.5 114',2.5)
 +f'<circle cx="35" cy="52" r="6.5" fill="{TEAL}" stroke="{O}" stroke-width="2"/><path d="M35 52 V48 M35 52 h3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'
 +p('M30 66 H40 L35 74 L40 82 H30 L35 74 Z',TEAL,2)
 +f'<path d="M28.5 92 h13 M29 98 h12 M28 104 h14" stroke="{TEALD}" stroke-width="2.4" stroke-linecap="round"/>')
broken=svg('0 0 100 100',shadow(50,94,44)+'<defs>'+grad('a','#f6d39a','#c58844','#e3ab66',1,0)+sd('b')+'</defs>'
 +p('M6 94 H94 V84 H6 Z','url(#b)',3.5)
 +p('M16 84 V30 L22 24 L27 31 L33 22 L38 29 V84 Z','url(#a)',4)+ln('M23 34 V80 M30 34 V80','#b07a3e',1.6)+hl('M19 36 V78',2)

 +p('M54 84 V58 L60 54 L65 60 L70 52 L76 58 V84 Z','url(#a)',4)+ln('M61 62 V80 M68 62 V80','#b07a3e',1.6)
 +p('M70 94 L74 80 H96 L94 94 Z','url(#b)',3)
 +f'<ellipse cx="45" cy="88" rx="6" ry="4" fill="{SAND[1]}" stroke="{O}" stroke-width="2.5"/>'
 +f'<rect x="14" y="45" width="26" height="5" fill="{TEAL}" stroke="{O}" stroke-width="2"/>')
palm=svg('0 0 100 135',shadow(46,129,30)+'<defs>'+grad('a','#b88452','#7a5230',None,1,0)+grad('l','#7cc35b','#2f7a32')+'</defs>'
 +p('M40 128 Q38 90 50 40 L58 42 Q48 90 52 128 Z','url(#a)',4)
 +ln('M41 116 h10 M41 104 h10 M42 92 h10 M44 80 h9 M46 68 h9 M48 56 h9','#5c3a20',2)
 +p('M52 36 Q30 12 4 30 Q28 30 52 44 Z','url(#l)',3.5)+p('M 52 36 Q 74 12 100 30 Q 76 30 52 44 Z','url(#l)',3.5)
 +p('M52 40 Q24 36 8 64 Q30 48 52 46 Z','url(#l)',3.5)+p('M 52 40 Q 80 36 96 64 Q 74 48 52 46 Z','url(#l)',3.5)
 +p('M52 36 Q40 6 18 4 Q36 18 50 42 Z','url(#l)',3.5)+p('M 52 36 Q 64 6 86 4 Q 68 18 54 42 Z','url(#l)',3.5)
 +p('M52 38 Q46 14 52 2 Q60 16 56 40 Z','url(#l)',3.5)
 +f'<circle cx="49" cy="44" r="5" fill="#8b5a2b" stroke="{O}" stroke-width="2.5"/><circle cx="58" cy="45" r="5" fill="#7a4a24" stroke="{O}" stroke-width="2.5"/>'
 +hl('M12 26 Q30 20 46 34 M24 8 Q38 14 46 30',2.2)+ln('M10 30 Q30 26 50 40 M96 30 Q76 26 56 40','#2a6a2c',1.5))
hourglass=svg('0 0 80 120',shadow(40,115,34)+'<defs>'+sd('a')+grad('g','#e9fbff','#9ad3e6')+'</defs>'
 +p('M8 116 H72 V104 H8 Z','url(#a)',3.5)
 +p('M18 22 Q18 52 38 60 Q18 68 18 98 H62 Q62 68 42 60 Q62 52 62 22 Z','url(#g)',3.5)
 +p('M22 98 Q24 80 40 76 Q56 80 58 98 Z','#e9a23b',2.5)+p('M27 34 Q32 52 40 56 Q48 52 53 34 Z','#e9a23b',2.5)
 +ln('M40 58 V78','#e9a23b',2.5)+hl('M24 28 Q25 46 33 54 M24 92 Q26 76 32 70',2.5)
 +p('M12 104 V96 H68 V104 Z',TERRA[1],3.5)+p('M12 24 V14 H68 V24 Z',TERRA[1],3.5)
 +f'<path d="M15 24 V96 M65 24 V96" stroke="{O}" stroke-width="7" stroke-linecap="round"/><path d="M15 24 V96 M65 24 V96" stroke="{TEAL}" stroke-width="3.5" stroke-linecap="round"/>'
 +p('M34 14 L40 6 L46 14 Z','#f2b83a',2.5))
pear=svg('0 0 80 110',shadow(40,105,30)+'<defs>'+grad('a','#8fce64','#3f8a3c')+'</defs>'
 +p('M28 104 Q14 80 24 64 Q36 52 46 66 Q56 84 48 104 Z','url(#a)',3.5)
 +p('M26 66 Q8 56 10 36 Q16 22 28 30 Q38 42 32 64 Z','url(#a)',3.5)
 +p('M44 66 Q46 44 58 38 Q72 34 74 50 Q72 66 50 70 Z','url(#a)',3.5)
 +p('M20 32 Q18 14 30 10 Q40 12 36 28 Z','url(#a)',3)
 +''.join(f'<path d="M{x} {y} l-3 -2 M{x} {y} l3 -2" stroke="{O}" stroke-width="1.4" stroke-linecap="round"/>' for x,y in [(30,82),(38,92),(20,46),(26,54),(56,52),(64,48),(36,74),(30,20)])
 +''.join(f'<ellipse cx="{x}" cy="{y}" rx="4.5" ry="5.5" fill="#e0457b" stroke="{O}" stroke-width="2.2"/>' for x,y in [(26,8),(36,12),(72,40),(14,30)])
 +hl('M18 44 Q18 36 24 34 M24 76 Q26 68 32 66',2.2))
BLOCK=[('temple_sundial',sundial,1.05,.84),('temple_obelisk',obelisk,.7,1.4),('temple_ruin',broken,1.0,1.0),
 ('temple_palm',palm,1.0,1.35),('temple_hourglass',hourglass,.8,1.2),('temple_cactus',pear,.8,1.1)]

# ---------- DECO
urn=svg('0 0 45 55',shadow(22.5,51,14)+'<defs>'+grad('a',TERRA[0],TERRA[1])+'</defs>'
 +p('M14 6 H31 L29 12 Q42 20 38 36 Q34 50 22.5 50 Q11 50 7 36 Q3 20 16 12 Z','url(#a)',3)
 +f'<path d="M8 28 H37" stroke="{O}" stroke-width="7"/><path d="M8 28 H37" stroke="{TEAL}" stroke-width="3.5"/>'+hl('M12 20 Q9 26 11 38',2))
pots=svg('0 0 60 45',shadow(30,42,24)+'<defs>'+grad('a',TERRA[0],TERRA[1])+grad('b','#f0c27c','#c48745')+'</defs>'
 +p('M8 18 H30 L28 22 Q34 30 30 38 Q26 42 19 42 Q12 42 8 38 Q4 30 10 22 Z','url(#a)',2.6)+ln('M7 30 H32',TEAL,2.5)
 +p('M34 24 H52 L51 28 Q57 34 53 40 Q49 43 43 43 Q37 43 34 40 Q30 34 35 28 Z','url(#b)',2.6)+ln('M37 33 h2 M42 33 h2 M47 33 h2',TERRA[1],2.2))
small_cactus=svg('0 0 40 50',shadow(20,46,13)+'<defs>'+grad('a','#8fce64','#3f8a3c')+'</defs>'
 +p('M8 46 Q4 28 12 18 Q20 12 28 18 Q36 28 32 46 Z','url(#a)',3)+ln('M20 16 V45 M14 20 Q11 32 13 45 M26 20 Q29 32 27 45','#2f6a2c',1.6)
 +p('M14 14 L20 6 L26 14 L20 18 Z','#ff8fb3',2.2)+f'<circle cx="20" cy="13" r="2" fill="#ffd43b"/>')
mini_hg=svg('0 0 40 50',shadow(20,46,13)+'<defs>'+grad('g','#e9fbff','#9ad3e6')+'</defs>'
 +p('M10 12 Q10 22 19 25 Q10 28 10 40 H30 Q30 28 21 25 Q30 22 30 12 Z','url(#g)',2.5)
 +p('M13 40 Q14 32 20 30 Q26 32 27 40 Z','#e9a23b',1.6)+p('M15 16 Q17 21 20 22 Q23 21 25 16 Z','#e9a23b',1.6)
 +p('M7 46 V40 H33 V46 Z',TERRA[1],2.5)+p('M7 12 V6 H33 V12 Z',TERRA[1],2.5))
scarab=svg('0 0 50 40',shadow(25,36,15)+'<defs>'+grad('a','#45c4b4','#1d6f66')+'</defs>'
 +f'<path d="M14 16 l-8 -4 M14 24 l-9 2 M16 31 l-7 6 M36 16 l8 -4 M36 24 l9 2 M34 31 l7 6" stroke="{O}" stroke-width="2.4" stroke-linecap="round"/>'
 +p('M25 12 Q38 13 38 26 Q37 37 25 37 Q13 37 12 26 Q12 13 25 12 Z','url(#a)',2.8)+ln('M25 15 V36','#123f3a',1.8)
 +p('M18 12 Q25 2 32 12 Z','#1d6f66',2.4)+hl('M17 20 Q16 26 18 31',2)
 +f'<circle cx="25" cy="6" r="3.2" fill="#f2b83a" stroke="{O}" stroke-width="1.6"/>')
DECO=[('temple_urn',urn,.45,.55),('temple_pots',pots,.6,.45),('temple_minicactus',small_cactus,.4,.5),
 ('temple_minihourglass',mini_hg,.4,.5),('temple_scarab',scarab,.5,.4)]

# ---------- EXTRA
ripple=svg('0 0 40 20',ln('M3 9 Q11 4 19 9 T35 9 M8 16 Q15 12 22 16 T36 16','#b98945',2.4))
pebbles=svg('0 0 40 30',f'<ellipse cx="13" cy="19" rx="6" ry="4.2" fill="#c98a45" stroke="{O}" stroke-width="1.8"/><ellipse cx="26" cy="22" rx="4" ry="3" fill="#e07a4f" stroke="{O}" stroke-width="1.6"/><ellipse cx="22" cy="12" rx="3.3" ry="2.6" fill="#b88452" stroke="{O}" stroke-width="1.5"/>')
EXTRA=[('temple_ripple',ripple,.4,.2),('temple_pebbles',pebbles,.4,.3)]
