from kit import *
def town():
    defs=grad('tw','#fff6e6','#f1d9b5','#fbe9cf')+grad('rf','#f0663a','#b8401f','#d9542e')+grad('tower','#fffaf0','#eadbc2')
    awn=lambda x,c1:f'<path d="M{x} 110 h52 v10 '+''.join(f'q{-3.25} 7 {-6.5} 0 ' for _ in range(8))+'Z" fill="'+c1+f'" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'+''.join(f'<rect x="{x+i*13}" y="110" width="6.5" height="10" fill="#fff" opacity=".55"/>' for i in range(4))
    win=lambda x,c:f'<rect x="{x}" y="122" width="44" height="32" rx="5" fill="{c}" stroke="{O}" stroke-width="3.5"/><path d="M{x+22} 122 v32 M{x} 138 h44" stroke="{O}" stroke-width="2" opacity=".5"/><path d="M{x+5} 127 l8 -0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
    low=lambda x,w:f'<rect x="{x}" y="166" width="{w}" height="26" rx="4" fill="#ffe08a" stroke="{O}" stroke-width="3.5"/><path d="M{x+w/2} 166 v26" stroke="{O}" stroke-width="2" opacity=".45"/><rect x="{x-3}" y="192" width="{w+6}" height="7" rx="2" fill="#a0703c" stroke="{O}" stroke-width="2.5"/>'+''.join(f'<circle cx="{x+4+i*(w-8)/3}" cy="190" r="3.6" fill="{c}" stroke="{O}" stroke-width="1.2"/>' for i,c in enumerate(['#ff6b6b','#ffd43b','#ff8fd0','#74c0fc']))
    door=doorway(130,190,208,150,cols=('#7a4f2a','#5c3a1e','#3f2714','#26170c'))
    body=f'''<ellipse cx="160" cy="209" rx="152" ry="5" fill="rgba(0,0,0,.18)"/>
<rect x="20" y="96" width="280" height="112" rx="8" fill="url(#tw)" stroke="{O}" stroke-width="5"/>
<path d="M24 160 h272" stroke="#e2c79c" stroke-width="2.5"/>
<path d="M6 104 L160 26 L314 104 Z" fill="url(#rf)" stroke="{O}" stroke-width="5" stroke-linejoin="round"/>
<path d="M40 88 h240 M74 70 h172 M108 52 h104" stroke="#a83a1c" stroke-width="2.5" opacity=".75"/>
<path d="M26 102 L160 34" stroke="#ff9a76" stroke-width="4" stroke-linecap="round" opacity=".6"/>
<rect x="132" y="6" width="56" height="44" rx="6" fill="url(#tower)" stroke="{O}" stroke-width="4"/>
<path d="M126 10 L160 -6 L194 10 Z" fill="url(#rf)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round" transform="translate(0 2)"/>
<circle cx="160" cy="29" r="14" fill="#fffbea" stroke="{O}" stroke-width="3.5"/>
{''.join(f'<path d="M{160+12*__import__("math").cos(a)} {29+12*__import__("math").sin(a)} L{160+9.5*__import__("math").cos(a)} {29+9.5*__import__("math").sin(a)}" stroke="{O}" stroke-width="2"/>' for a in [i*3.14159/6 for i in range(12)])}
<path d="M160 29 v-9 M160 29 h7" stroke="{O}" stroke-width="3" stroke-linecap="round"/>
{awn(30,'#4dabf7')}{awn(82,'#40c057')}{awn(186,'#fcc419')}{awn(238,'#da77f2')}
{win(34,'#d6efff')}{win(86,'#dcf7e0')}{win(190,'#fff6cc')}{win(242,'#f8e3fc')}
<path d="M122 208 L122 150 A38 38 0 0 1 198 150 L198 208 Z" fill="#b5835a" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>
{door}
<path d="M130 208 L130 180 A30 30 0 0 1 190 180 L190 208" fill="none" stroke="{O}" stroke-width="3.5"/>
{plaque(160,124,14,f'<text x="0" y="5.5" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, Arial, sans-serif" font-weight="800" font-size="14" fill="{O}">123</text>')}
{low(40,34)}{low(246,34)}
<path d="M98 96 l10 -14 l10 14 M202 96 l10 -14 l10 14" fill="#ffd43b" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'''
    return svg('0 0 320 214',body,defs)
def fountain():
    defs=grad('st','#ece6d6','#b9ae98','#d6cdb8')+grad('wt','#a5d8ff','#4dabf7','#74c0fc',0,1)
    body=f'''{shadow(60,113,50)}
<path d="M10 92 q0 -14 50 -14 q50 0 50 14 v12 q0 12 -50 12 q-50 0 -50 -12 Z" fill="url(#st)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>
<ellipse cx="60" cy="92" rx="44" ry="10" fill="url(#wt)" stroke="{O}" stroke-width="3"/>
<ellipse cx="44" cy="93" rx="3.2" ry="1.8" fill="#ffd43b" stroke="{O}" stroke-width="1"/><ellipse cx="78" cy="95" rx="3.2" ry="1.8" fill="#ffd43b" stroke="{O}" stroke-width="1"/><ellipse cx="66" cy="90" rx="2.6" ry="1.5" fill="#ffe066" stroke="{O}" stroke-width="1"/>
<path d="M22 100 h76" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>
<rect x="53" y="52" width="14" height="40" rx="3" fill="url(#st)" stroke="{O}" stroke-width="3.5"/>
<path d="M32 58 q0 -9 28 -9 q28 0 28 9 v4 q0 8 -28 8 q-28 0 -28 -8 Z" fill="url(#st)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>
<ellipse cx="60" cy="58" rx="24" ry="5.5" fill="url(#wt)" stroke="{O}" stroke-width="2.5"/>
<rect x="56" y="30" width="8" height="26" rx="3" fill="url(#st)" stroke="{O}" stroke-width="3"/>
<path d="M60 30 q-14 -14 -26 4 M60 30 q14 -14 26 4 M60 30 v-14" fill="none" stroke="#74c0fc" stroke-width="4.5" stroke-linecap="round"/>
<path d="M60 30 q-14 -14 -26 4 M60 30 q14 -14 26 4 M60 30 v-14" fill="none" stroke="#e7f5ff" stroke-width="1.6" stroke-linecap="round"/>
<path d="M34 60 q-10 6 -16 26 M86 60 q10 6 16 26" fill="none" stroke="#74c0fc" stroke-width="3.5" stroke-linecap="round" opacity=".9"/>
<circle cx="60" cy="14" r="3" fill="#e7f5ff" stroke="#4dabf7" stroke-width="1.5"/>'''
    return svg('0 0 120 120',body,defs)
ENTRANCE=None;BLOCK=[('town_hall',town(),5,5*214/320),('town_fountain',fountain(),1.8,1.8)];DECO=[];EXTRA=[]
