"""Measure Mesa (measuring length): deep red rock, cream strata, greens and browns on orange desert."""
from kit import *
def p(d,f,sw=4):return f'<path d="{d}" fill="{f}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"/>'
def hl(d,sw=3):return f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="{sw}" stroke-linecap="round"/>'
def ln(d,c,sw=2):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
RED=('#c0533a','#7a2c1c','#a03f2a')
CREAM='#f4e3c1';GREEN=('#7fc25a','#2f7a32')
rk=lambda i:grad(i,RED[0],RED[1],RED[2])
gr=lambda i:grad(i,GREEN[0],GREEN[1])

# ---------- entrance: flat-topped red mesa, carved doorway, ruler plaque
ruler=(f'<rect x="-12" y="-5" width="24" height="10" rx="1.5" fill="#f7c948" stroke="{O}" stroke-width="2"/>'
 +''.join(f'<path d="M{x} -5 v{4.5 if (x+12)%6==0 else 2.5}" stroke="{O}" stroke-width="1.3"/>' for x in range(-9,12,3))
 +f'<path d="M-6 -5 v4.5 M0 -5 v4.5 M6 -5 v4.5" stroke="{O}" stroke-width="1.5"/>')
ruler=f'<g transform="rotate(-20) scale(1.15)">'+ruler+'</g>'
ENTRANCE=svg('0 0 240 200',
 shadow(120,189,112)
 +p('M8 188 L26 132 L40 126 L48 64 L192 64 L200 122 L216 130 L232 188 Z','url(#mr)',4.5)
 +p('M44 96 L196 96 L198 106 L42 106 Z',CREAM,0)+p('M38 140 L203 140 L206 148 L35 148 Z',CREAM,0)
 +ln('M47 72 H192 M44 96 H197 M42 106 H198 M28 140 H210 M26 148 H212','#5e2014',2.2)
 +ln('M38 124 L44 120 M200 120 L206 124 M70 84 l8 -2 M160 82 l10 2 M60 120 l12 0 M168 124 l10 -2 M30 170 l10 0 M196 168 l12 2','#6a2416',2.2)
 +p('M44 64 Q48 56 62 58 Q72 50 86 58 L100 58 Q112 52 124 58 L150 58 Q162 52 174 58 Q188 56 196 64 Z','#6fae4a',3.5)
 +hl('M54 68 L46 126 M34 136 L20 180',4)
 +p('M92 188 V136 A28 28 0 0 1 148 136 V188 Z','#5e2014',3.5)
 +doorway(98,142,188,114,('#7a3a24','#5c2a1a','#421d12','#2c130c','#1a0b07'))
 +p('M98 114 h44','none',0)
 +plaque(120,92,16,ruler)
 +p('M18 174 H13 Q9 174 9 169 V162 Q9 158 12.5 158 Q16 158 16 162 V168 H18','url(#mg)',2.6)+p('M26 168 H30 Q33 168 33 164 V158 Q33 155 30.5 155 Q28 155 28 158 V163 H26','url(#mg)',2.6)+p('M18 188 V156 Q18 150 22 150 Q26 150 26 156 V188 Z','url(#mg)',3)
 +p('M206 188 Q205 176 213 172 Q222 174 222 188 Z','#8a6a4a',3)+p('M196 188 Q196 182 202 180 Q208 182 208 188 Z','#a3825e',2.5)
 +p('M60 188 q3 -10 6 0 q3 -8 5 0 M172 188 q3 -10 6 0 q3 -8 5 0','#a99a4a',2.2),
 grad('mr','#cf6244','#7a2c1c','#a8452e')+gr('mg'))

# ---------- BLOCK
def marks(x0,y0,y1,step=10):
    s=''
    for i,y in enumerate(range(y0,y1,step)):
        s+=f'<path d="M{x0} {y} h{9 if i%2==0 else 5}" stroke="#fff8e6" stroke-width="3" stroke-linecap="round"/>'
    return s
hoodoo=svg('0 0 75 135',shadow(37,129,28)+'<defs>'+rk('a')+grad('b','#e9b98a','#b0754a')+'</defs>'
 +p('M14 128 Q20 104 22 86 Q16 76 24 68 Q30 52 26 40 L50 40 Q46 56 52 68 Q60 78 52 88 Q54 106 62 128 Z','url(#a)',4)
 +p('M10 40 Q12 22 37 20 Q64 22 66 40 Q50 46 37 44 Q22 46 10 40 Z','url(#b)',4)
 +ln('M22 86 H52 M24 68 H51','#5e2014',2)+marks(42,54,124,10)
 +hl('M24 50 Q24 60 28 66 M20 92 Q20 110 18 122',2.5)+hl('M16 34 Q24 26 36 25',2.5))
hoodoo2=svg('0 0 90 100',shadow(45,94,38)+'<defs>'+rk('a')+'</defs>'
 +p('M10 94 L16 54 L28 48 L30 22 L60 22 L64 46 L76 52 L82 94 Z','url(#a)',4)
 +p('M28 22 Q34 14 46 16 Q58 14 62 22 Z','#6fae4a',3)
 +ln('M30 34 H60 M16 66 H78','#5e2014',2)+f'<path d="M14 76 H80" stroke="{CREAM}" stroke-width="5"/>'
 +''.join(f'<path d="M{x} 76 v{-6 if i%2==0 else -3.5}" stroke="#fff8e6" stroke-width="2.5" stroke-linecap="round"/>' for i,x in enumerate(range(20,80,7)))
 +ln('M14 76 H80','#5e2014',1)+hl('M33 28 V44 M20 58 L16 86',2.5))
saguaro=svg('0 0 80 130',shadow(40,124,26)+'<defs>'+gr('a')+'</defs>'
 +p('M30 124 V24 Q30 10 40 10 Q50 10 50 24 V124 Z','url(#a)',4)
 +p('M30 78 H20 Q10 78 10 66 V40 Q10 32 17 32 Q24 32 24 40 V64 H30','url(#a)',4)
 +p('M50 62 H60 Q70 62 70 50 V30 Q70 22 63 22 Q56 22 56 30 V48 H50','url(#a)',4)
 +ln('M40 18 V120 M35 24 V120 M45 24 V120','#2a6a2c',1.6)
 +p('M34 12 L40 4 L46 12 Z','#ff8fb3',2.5)+hl('M34 30 V110 M14 42 V62',2.5))
post=svg('0 0 70 140',shadow(35,134,26)+'<defs>'+grad('s','#8a6a4a','#5e4630')+'</defs>'
 +p('M14 134 Q14 120 26 118 L44 118 Q56 120 56 134 Z','url(#s)',3.5)
 +p('M28 120 V14 H42 V120 Z','#fff8e6',4)
 +''.join(f'<rect x="28" y="{y}" width="14" height="13" fill="#d64545"/>' for y in range(14,120,26))
 +p('M28 120 V14 H42 V120 Z','none',4)
 +''.join(f'<path d="M42 {y} h{7 if (y-14)%13==0 else 4}" stroke="{O}" stroke-width="2.5" stroke-linecap="round"/>' for y in range(14,121,13) if True)
 +''.join(f'<path d="M42 {y+6.5} h3" stroke="{O}" stroke-width="1.6" stroke-linecap="round"/>' for y in range(14,114,13))
 +p('M24 14 L35 4 L46 14 Z','#f7c948',3)+hl('M31 20 V114',2))
wagon=svg('0 0 115 90',shadow(57,85,50)+'<defs>'+grad('c','#fdf5e2','#d9c7a3')+grad('w','#a0703c','#6b4423')+'</defs>'
 +p('M14 64 H96 V48 H14 Z','url(#w)',4)
 +p('M18 48 Q14 20 30 12 Q44 6 56 10 Q70 6 82 12 Q98 20 92 48 Z','url(#c)',4)
 +ln('M38 10 Q34 28 36 48 M56 10 V48 M74 10 Q78 28 76 48','#b8a27a',2.2)
 +p('M96 58 L112 64','none',4)
 +hl('M24 40 Q22 24 34 16',3)
 +''.join(f'<circle cx="{x}" cy="70" r="14" fill="none" stroke="{O}" stroke-width="7"/><circle cx="{x}" cy="70" r="14" fill="none" stroke="#a0703c" stroke-width="3.5"/><path d="M{x-12} 70 H{x+12} M{x} 58 V82 M{x-8.5} 61.5 L{x+8.5} 78.5 M{x+8.5} 61.5 L{x-8.5} 78.5" stroke="{O}" stroke-width="2"/><circle cx="{x}" cy="70" r="3.5" fill="#6b4423" stroke="{O}" stroke-width="2"/>' for x in (30,80)))
boulders=svg('0 0 100 75',shadow(50,70,44)+'<defs>'+rk('a')+grad('b','#d8774f','#8a3a22')+'</defs>'
 +p('M8 70 Q4 50 18 42 Q30 36 40 44 Q46 56 42 70 Z','url(#b)',4)
 +p('M58 70 Q56 50 68 42 Q82 38 92 50 Q98 62 92 70 Z','url(#a)',4)
 +p('M28 48 Q26 22 46 14 Q66 10 72 30 Q76 46 64 54 Q46 60 28 48 Z','url(#a)',4)
 +hl('M36 30 Q42 20 52 18 M14 50 Q18 44 24 44',3)+ln('M50 36 l8 4 M70 58 l8 -2','#5e2014',2))
BLOCK=[('mesa_hoodoo',hoodoo,.75,1.35),('mesa_butte',hoodoo2,.9,1.0),('mesa_saguaro',saguaro,.8,1.3),
 ('mesa_post',post,.7,1.4),('mesa_wagon',wagon,1.15,.9),('mesa_boulders',boulders,1.0,.75)]

# ---------- DECO
bone=svg('0 0 60 40',shadow(30,36,22)
 +p('M14 22 Q8 14 13 10 Q18 7 20 13 L40 13 Q42 7 47 10 Q52 14 46 22 Q52 30 47 33 Q42 36 40 29 L20 29 Q18 36 13 33 Q8 30 14 22 Z',CREAM,3)
 +hl('M22 17 H38',2)+ln('M24 25 H36','#c9b48c',1.6))
tumble=svg('0 0 55 50',shadow(27,46,20)
 +f'<circle cx="27" cy="25" r="19" fill="#c9a66b" fill-opacity=".55" stroke="{O}" stroke-width="3"/>'
 +ln('M12 18 Q26 6 42 18 Q30 40 14 32 Q12 22 24 16 Q38 20 36 32 Q26 38 20 28 M16 38 Q28 46 40 36 M10 26 Q20 12 32 8','#7a5a34',2)
 +ln('M27 6 Q40 14 44 28','#5e4630',2.2))
mini_cactus=svg('0 0 45 55',shadow(22,51,14)+'<defs>'+gr('a')+'</defs>'
 +p('M17 51 V18 Q17 10 22 10 Q27 10 27 18 V51 Z','url(#a)',3)
 +p('M17 36 H12 Q8 36 8 30 V24 Q8 20 11 20 Q14 20 14 24 V30 H17','url(#a)',2.6)
 +p('M27 30 H33 Q37 30 37 24 V18 Q37 14 34 14 Q31 14 31 18 V24 H27','url(#a)',2.6)
 +ln('M22 14 V48','#2a6a2c',1.4)+f'<circle cx="22" cy="10" r="2.6" fill="#ffd43b" stroke="{O}" stroke-width="1.2"/>')
tape=svg('0 0 55 45',shadow(27,41,22)
 +p('M30 36 H52 V30 H30 Z','#f7c948',2.4)+''.join(f'<path d="M{x} 30 v{3 if i%2 else 4.5}" stroke="{O}" stroke-width="1.2"/>' for i,x in enumerate(range(34,52,3)))
 +f'<circle cx="22" cy="22" r="16" fill="#e8453c" stroke="{O}" stroke-width="3"/><circle cx="22" cy="22" r="7" fill="#f4e3c1" stroke="{O}" stroke-width="2.4"/><circle cx="22" cy="22" r="2.2" fill="{O}"/>'
 +hl('M11 16 Q14 9 21 8',2.2)+p('M50 36 v4 h3 v-10 h-3 Z',O,1))
DECO=[('mesa_bone',bone,.6,.4),('mesa_tumbleweed',tumble,.55,.5),('mesa_minicactus',mini_cactus,.45,.55),('mesa_tape',tape,.55,.45)]

# ---------- EXTRA
pebbles=svg('0 0 40 30',f'<ellipse cx="12" cy="19" rx="6" ry="4.4" fill="#8a3a22" stroke="{O}" stroke-width="1.8"/><ellipse cx="26" cy="22" rx="4.2" ry="3.2" fill="#f4e3c1" stroke="{O}" stroke-width="1.6"/><ellipse cx="23" cy="12" rx="3.4" ry="2.7" fill="#6b4423" stroke="{O}" stroke-width="1.5"/>')
tuft=svg('0 0 40 30',p('M8 28 Q10 16 14 10 Q14 20 16 28 Q18 14 22 6 Q22 18 22 28 Q26 16 32 12 Q28 22 28 28 Z','#a99a4a',2))
EXTRA=[('mesa_pebbles',pebbles,.4,.3),('mesa_tuft',tuft,.4,.3)]
