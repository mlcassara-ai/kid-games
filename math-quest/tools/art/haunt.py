"""Haunted Hollow art (Halloween event): a crooked haunted house, tombstones, twisty trees, pumpkins, a cauldron.
   Spooky-cute for ages 6-11: friendly faces, warm glows, orange / lime / bone white on the dark purple ground."""
from kit import *
import math

HI = 'stroke="#fff" stroke-opacity=".45" stroke-linecap="round" fill="none"'
GLOW = '<radialGradient id="{id}"><stop offset="0" stop-color="#ffe066" stop-opacity=".85"/><stop offset=".5" stop-color="#ffa94d" stop-opacity=".35"/><stop offset="1" stop-color="#ff922b" stop-opacity="0"/></radialGradient>'


def pumpkin(cx, cy, r, face=False, sw=3.5, gid='pk'):
    """a round orange pumpkin; face=True carves a friendly glowing face"""
    o = (f'<ellipse cx="{cx-r*.45:.1f}" cy="{cy:.1f}" rx="{r*.6:.1f}" ry="{r*.82:.1f}" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}"/>'
         f'<ellipse cx="{cx+r*.45:.1f}" cy="{cy:.1f}" rx="{r*.6:.1f}" ry="{r*.82:.1f}" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}"/>'
         f'<ellipse cx="{cx}" cy="{cy:.1f}" rx="{r*.58:.1f}" ry="{r*.86:.1f}" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}"/>'
         f'<path d="M{cx} {cy-r*.8:.1f} q{-r*.05:.1f} {-r*.3:.1f} {r*.2:.1f} {-r*.42:.1f}" stroke="#2b8a3e" stroke-width="{max(2.5,r*.22):.1f}" stroke-linecap="round" fill="none"/>'
         f'<path d="M{cx} {cy-r*.8:.1f} q{-r*.05:.1f} {-r*.3:.1f} {r*.2:.1f} {-r*.42:.1f}" stroke="{O}" stroke-width="{sw*.5:.1f}" stroke-linecap="round" fill="none" opacity=".5"/>'
         f'<path d="M{cx-r*.75:.1f} {cy-r*.25:.1f} q{r*.1:.1f} {-r*.35:.1f} {r*.35:.1f} {-r*.45:.1f}" stroke-width="{max(1.5,r*.12):.1f}" {HI}/>')
    if face:
        e = r * .2
        o += (f'<path d="M{cx-r*.42:.1f} {cy-r*.05:.1f} l{e:.1f} {-e*1.4:.1f} l{e:.1f} {e*1.4:.1f} Z M{cx+r*.02:.1f} {cy-r*.05:.1f} l{e:.1f} {-e*1.4:.1f} l{e:.1f} {e*1.4:.1f} Z" fill="#ffe066" stroke="{O}" stroke-width="{sw*.5:.1f}" stroke-linejoin="round"/>'
              f'<path d="M{cx-r*.5:.1f} {cy+r*.2:.1f} q{r*.5:.1f} {r*.45:.1f} {r:.1f} 0 l{-r*.18:.1f} {r*.1:.1f} l{-r*.14:.1f} {-r*.08:.1f} l{-r*.18:.1f} {r*.12:.1f} l{-r*.16:.1f} {-r*.1:.1f} l{-r*.16:.1f} {r*.08:.1f} Z" fill="#ffe066" stroke="{O}" stroke-width="{sw*.5:.1f}" stroke-linejoin="round"/>')
    return o


PKG = grad('pk', '#ffc078', '#e8590c', '#fd7e14')


# ---------------- entrance ----------------
def _entrance():
    defs = (grad('hw', '#ece2c8', '#a89c80', '#cfc3a6') + grad('hr', '#66c08f', '#2a6b55', x2=0, y2=1)
            + grad('ht', '#ddd2b6', '#988c70') + PKG + GLOW.format(id='gl'))
    b = shadow(120, 188, 108)
    # crooked tower on the right
    b += f'<path d="M158 188 L162 74 L198 70 L196 188 Z" fill="url(#ht)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M150 80 Q178 70 208 72 Q192 54 186 30 Q184 18 194 10 Q178 12 176 30 Q170 58 150 80 Z" fill="url(#hr)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M162 72 Q172 56 178 36" stroke-width="3" {HI}/>'
    b += f'<circle cx="180" cy="100" r="16" fill="url(#gl)"/><circle cx="180" cy="100" r="9" fill="#ffd43b" stroke="{O}" stroke-width="3.5"/>'
    b += f'<path d="M180 91 v18 M171 100 h18" stroke="{O}" stroke-width="2.5"/>'
    b += f'<path d="M166 130 h26 M166 156 h26" stroke="#8a7f66" stroke-width="2"/>'
    # crooked chimney
    b += f'<path d="M66 70 L64 40 L80 38 L84 62 Z" fill="#b9523a" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M60 40 L84 36 L85 30 L61 33 Z" fill="#6b5f86" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    # main house, leaning
    b += f'<path d="M50 188 L56 98 L166 92 L172 188 Z" fill="url(#hw)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M54 120 L168 114 M53 146 L170 142 M52 168 L171 166" stroke="#8a7f66" stroke-width="2"/>'
    b += f'<path d="M60 182 L63 104" stroke-width="3" {HI}/>'
    # gable wall under the roof
    b += f'<path d="M54 104 Q84 88 110 44 Q138 82 168 96 L168 100 L54 106 Z" fill="url(#hw)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    # roof, sagging
    b += f'<path d="M38 104 Q80 84 110 30 Q140 76 182 92 L176 100 Q140 92 110 50 Q86 92 44 112 Z" fill="url(#hr)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M54 100 Q86 80 106 46" stroke-width="3" {HI}/>'
    b += f'<path d="M110 30 q-4 -10 4 -16" stroke="{O}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    # windows: one glowing, one boarded
    b += f'<circle cx="76" cy="138" r="18" fill="url(#gl)"/>'
    b += f'<path d="M64 128 L86 126 L88 152 L66 154 Z" fill="#ffd43b" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M75.5 127 L77 153 M65 141 L87 139" stroke="{O}" stroke-width="2.5"/>'
    b += f'<path d="M134 128 L156 126 L157 152 L135 154 Z" fill="#2a1d40" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M131 134 L160 142 M131 148 L160 136" stroke="#a0703c" stroke-width="6" stroke-linecap="round"/>'
    b += f'<path d="M131 134 L160 142 M131 148 L160 136" stroke="{O}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>'
    # attic round window with a glow
    b += f'<circle cx="110" cy="76" r="8" fill="#ffd43b" stroke="{O}" stroke-width="3"/>'
    # door
    b += f'<path d="M94 188 L94 142 A20 20 0 0 1 134 140 L136 188 Z" fill="#7a4fb0" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += doorway(99, 131, 188, 126, cols=('#3d2a5c', '#2e1f47', '#211534', '#150d22', '#0a0612'))
    b += f'<path d="M88 188 L142 188 L140 182 L90 182 Z" fill="#988c70" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    # pumpkin by the door, a little bat
    b += pumpkin(30, 178, 12, face=True, sw=3)
    b += f'<path d="M206 108 q-8 -8 -16 -2 q4 2 4 6 q4 -3 6 0 q2 -4 6 -4 q2 -4 6 0 q2 -3 6 0 q0 -4 4 -6 q-8 -6 -16 2 Z" fill="#8a7fb0" stroke="{O}" stroke-width="2.5" stroke-linejoin="round" transform="translate(-164 -82)"/>'
    b += f'<circle cx="39.5" cy="23" r="1.4" fill="{O}"/><circle cx="44.5" cy="23" r="1.4" fill="{O}"/>'
    # plaque: a friendly jack-o'-lantern
    b += plaque(115, 110, 17, pumpkin(0, 2, 10, face=True, sw=2.2))
    return svg('0 0 240 200', b, defs)


ENTRANCE = _entrance()


# ---------------- blocking scenery ----------------
def _tombs():
    defs = grad('ts', '#ece8f5', '#9a92b5', '#c9c3d9')
    b = shadow(52, 84, 44)
    b += f'<path d="M48 84 L48 30 Q48 10 68 10 Q88 10 88 30 L88 84 Z" fill="url(#ts)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round" transform="rotate(5 68 84)"/>'
    b += f'<path d="M70 28 v24 M60 38 h20" stroke="#6b6385" stroke-width="5" stroke-linecap="round" transform="rotate(5 68 84)"/>'
    b += f'<path d="M12 84 L12 46 Q12 32 26 32 L38 32 Q52 32 52 46 L52 84 Z" fill="url(#ts)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round" transform="rotate(-6 32 84)"/>'
    b += f'<path d="M20 52 h22 M20 62 h16" stroke="#6b6385" stroke-width="3.5" stroke-linecap="round" transform="rotate(-6 32 84)"/>'
    b += f'<path d="M54 70 V30 Q54 18 64 16" stroke-width="3" {HI} transform="rotate(5 68 84)"/>'
    b += f'<path d="M8 86 q4 -10 8 0 q3 -8 6 0 M78 86 q4 -12 8 0 q3 -8 6 0" stroke="#94d82d" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M4 86 h92" stroke="{O}" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>'
    return svg('0 0 100 92', b, defs)


def _tree():
    defs = grad('tb', '#b08a68', '#5e4434', '#8a6a52', x2=1, y2=0)
    b = shadow(50, 122, 36)
    trunk = ('M34 122 Q40 96 36 80 Q30 62 38 46 L46 48 Q40 64 48 78 Q54 64 52 50 Q50 40 42 28 L48 24 Q58 36 60 50 Q64 36 74 30 Q80 24 78 14 L84 14 '
             'Q88 30 76 40 Q66 50 62 66 Q58 84 62 100 Q66 114 74 122 Z')
    b += f'<path d="{trunk}" fill="url(#tb)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M36 80 Q22 74 14 58 L18 54 Q28 66 38 70 Z" fill="url(#tb)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M14 58 q-6 -6 -4 -14 M60 86 q14 -6 22 -2 q8 2 10 -6" stroke="{O}" stroke-width="4" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M60 86 q14 -6 22 -2 q8 2 10 -6" stroke="#8a6a52" stroke-width="2" fill="none" stroke-linecap="round"/>'
    # a hollow with two glowing eyes (friendly)
    b += f'<ellipse cx="50" cy="96" rx="7" ry="10" fill="#1a1028" stroke="{O}" stroke-width="3"/>'
    b += f'<circle cx="47.5" cy="94" r="1.8" fill="#ffd43b"/><circle cx="52.5" cy="94" r="1.8" fill="#ffd43b"/>'
    b += f'<path d="M40 112 Q44 92 40 80" stroke-width="3" {HI}/>'
    b += f'<path d="M28 122 q-10 2 -14 -2 M66 122 q10 2 16 -2" stroke="{O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    return svg('0 0 100 128', b, defs)


def _lamp():
    defs = GLOW.format(id='lg')
    b = shadow(34, 124, 18)
    b += f'<circle cx="60" cy="38" r="30" fill="url(#lg)"/><circle cx="60" cy="38" r="18" fill="url(#lg)"/>'
    b += f'<path d="M24 124 L30 118 H40 L44 124 Z" fill="#4a4060" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M35 118 Q30 80 36 50 Q40 26 52 18" stroke="{O}" stroke-width="10" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M35 118 Q30 80 36 50 Q40 26 52 18" stroke="#8a7fb0" stroke-width="5" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M52 18 q6 -4 8 4 v4" stroke="{O}" stroke-width="3" fill="none"/>'
    b += f'<path d="M50 28 h20 l-3 -6 h-14 Z" fill="#4a4060" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M52 28 h16 l-2 20 h-12 Z" fill="#ffe066" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M60 28 v20" stroke="{O}" stroke-width="2"/>'
    b += f'<circle cx="60" cy="38" r="3.5" fill="#fff9db"/>'
    b += f'<path d="M51 48 h18 v4 h-18 Z" fill="#4a4060" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
    return svg('0 0 80 128', b, defs)


def _pumpkins():
    defs = PKG
    b = shadow(50, 80, 44)
    b += pumpkin(28, 60, 20) + pumpkin(74, 62, 18) + pumpkin(52, 38, 18, face=True)
    b += f'<path d="M14 82 q6 -10 10 0 M82 82 q4 -10 8 0" stroke="#94d82d" stroke-width="3" fill="none" stroke-linecap="round"/>'
    return svg('0 0 100 88', b, defs)


def _fence():
    defs = grad('fp', '#ece8f5', '#9a92b5', x2=1, y2=0)
    b = shadow(55, 76, 50)
    b += f'<path d="M14 36 H96 M14 66 H96" stroke="{O}" stroke-width="7" stroke-linecap="round"/>'
    b += f'<path d="M14 36 H96 M14 66 H96" stroke="#7d74a0" stroke-width="3" stroke-linecap="round"/>'
    for i, x in enumerate(range(26, 92, 13)):
        top = 20 if i % 2 else 26
        b += f'<path d="M{x} 74 V{top}" stroke="{O}" stroke-width="7" stroke-linecap="round"/><path d="M{x} 74 V{top}" stroke="#7d74a0" stroke-width="3" stroke-linecap="round"/>'
        b += f'<path d="M{x-5} {top+2} L{x} {top-8} L{x+5} {top+2} Z" fill="#7d74a0" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
    b += f'<path d="M40 48 q6 -8 12 0 q6 8 12 0 q6 -8 12 0" stroke="#7d74a0" stroke-width="5" fill="none"/>'
    for x in (4, 92):
        b += f'<rect x="{x}" y="22" width="14" height="54" fill="url(#fp)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
        b += f'<rect x="{x-2}" y="16" width="18" height="8" fill="#ece8f5" stroke="{O}" stroke-width="3"/>'
        b += f'<circle cx="{x+7}" cy="11" r="5" fill="#ece8f5" stroke="{O}" stroke-width="3"/>'
    return svg('0 0 110 82', b, defs)


def _cauldron():
    defs = grad('cb', '#6b6385', '#241d33', '#3f3755') + grad('cg', '#d8f5a2', '#66a80f', x2=0, y2=1)
    b = shadow(50, 84, 42)
    # fire
    b += f'<path d="M30 82 Q28 66 38 58 Q38 70 46 64 Q48 52 56 48 Q56 62 64 60 Q74 66 70 82 Z" fill="#ff922b" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M24 84 L78 72 M22 72 L78 84" stroke="#8a6a52" stroke-width="7" stroke-linecap="round"/><path d="M24 84 L78 72 M22 72 L78 84" stroke="{O}" stroke-width="2" stroke-linecap="round" opacity=".5"/>'
    # pot
    b += f'<path d="M14 34 Q10 72 36 76 L64 76 Q90 72 86 34 Z" fill="url(#cb)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<ellipse cx="50" cy="34" rx="38" ry="9" fill="url(#cg)" stroke="{O}" stroke-width="4"/>'
    b += f'<path d="M10 30 h80 v6 h-80 Z" fill="none"/>'
    b += f'<path d="M20 44 Q20 62 32 68" stroke-width="3" {HI}/>'
    # bubbles
    b += f'<circle cx="38" cy="22" r="6" fill="#c0eb75" stroke="{O}" stroke-width="2.5"/><circle cx="58" cy="14" r="4.5" fill="#c0eb75" stroke="{O}" stroke-width="2.2"/><circle cx="66" cy="28" r="3.5" fill="#c0eb75" stroke="{O}" stroke-width="2"/>'
    b += f'<circle cx="36" cy="20" r="1.8" fill="#fff" opacity=".8"/>'
    return svg('0 0 100 90', b, defs)


BLOCK = [
    ('haunt_tombs', _tombs(), 1.0, .92),
    ('haunt_tree', _tree(), .95, 1.25),
    ('haunt_lamp', _lamp(), .7, 1.15),
    ('haunt_pumpkins', _pumpkins(), 1.0, .88),
    ('haunt_fence', _fence(), 1.1, .82),
    ('haunt_cauldron', _cauldron(), 1.0, .9),
]


# ---------------- deco ----------------
def _jack():
    defs = PKG + GLOW.format(id='jg')
    b = shadow(26, 48, 18)
    b += f'<circle cx="26" cy="32" r="24" fill="url(#jg)"/>'
    b += pumpkin(26, 34, 15, face=True, sw=3)
    return svg('0 0 52 52', b, defs)


def _candy():
    b = shadow(30, 40, 24)
    def wrap(x, y, r, c, s):
        return (f'<g transform="rotate({r} {x} {y})"><path d="M{x-14} {y-7} L{x-7} {y} L{x-14} {y+7} Z M{x+14} {y-7} L{x+7} {y} L{x+14} {y+7} Z" fill="{c}" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
                f'<ellipse cx="{x}" cy="{y}" rx="9" ry="7" fill="{c}" stroke="{O}" stroke-width="2.8"/>'
                f'<path d="M{x-4} {y-5} l6 10 M{x+2} {y-6} l5 9" stroke="{s}" stroke-width="2.5"/>'
                f'<path d="M{x-5} {y-3} q2 -2 5 -2" stroke-width="1.8" {HI}/></g>')
    b += wrap(20, 26, -15, '#ff922b', '#fff') + wrap(40, 30, 20, '#94d82d', '#ae3ec9')
    return svg('0 0 60 44', b)


def _ghost():
    b = '<ellipse cx="26" cy="54" rx="12" ry="2.6" fill="rgba(0,0,0,.22)"/>'
    b += f'<path d="M10 44 L10 24 Q10 6 26 6 Q42 6 42 24 L42 44 q-4 -4 -8 0 q-4 4 -8 0 q-4 -4 -8 0 q-4 4 -8 0 Z" fill="#f8f4ff" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<ellipse cx="20" cy="22" rx="2.6" ry="3.6" fill="{O}"/><ellipse cx="31" cy="22" rx="2.6" ry="3.6" fill="{O}"/>'
    b += f'<path d="M21 30 q4.5 4 9 0" stroke="{O}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    b += f'<circle cx="16" cy="29" r="2.4" fill="#ffa8c5"/><circle cx="35" cy="29" r="2.4" fill="#ffa8c5"/>'
    b += f'<path d="M10 22 q-6 6 -6 0 M42 22 q6 -8 6 -2" stroke="{O}" stroke-width="2.6" fill="#f8f4ff" stroke-linecap="round"/>'
    return svg('0 0 52 58', b)


def _web():
    b = shadow(30, 54, 22)
    b += f'<path d="M8 56 L10 6 M52 56 L50 10" stroke="#8a6a52" stroke-width="5" stroke-linecap="round"/><path d="M8 56 L10 6 M52 56 L50 10" stroke="{O}" stroke-width="1.5" opacity=".5"/>'
    cx, cy = 30, 26
    spokes = [(10, 8), (30, 4), (50, 12), (51, 30), (50, 48), (30, 50), (9, 46), (9, 26)]
    sp = ' '.join(f'M{cx} {cy} L{x} {y}' for x, y in spokes)
    b += f'<path d="{sp}" stroke="#f1ecff" stroke-width="1.6" opacity=".95"/>'
    for t in (.35, .65, .95):
        pts = [(cx + (x - cx) * t, cy + (y - cy) * t) for x, y in spokes]
        d = 'M' + ' Q'.join(f'{(pts[i-1][0]+p[0])/2+ (cx-(pts[i-1][0]+p[0])/2)*.12:.1f} {(pts[i-1][1]+p[1])/2+(cy-(pts[i-1][1]+p[1])/2)*.12:.1f} {p[0]:.1f} {p[1]:.1f}' if i else f'{p[0]:.1f} {p[1]:.1f}' for i, p in enumerate(pts + [pts[0]]))
        b += f'<path d="{d}" stroke="#f1ecff" stroke-width="1.6" fill="none" opacity=".95"/>'
    # a little friendly spider
    b += f'<path d="M38 34 v-6" stroke="#f1ecff" stroke-width="1.2"/><path d="M33 36 l-3 -3 M33 39 l-4 1 M43 36 l3 -3 M43 39 l4 1" stroke="{O}" stroke-width="1.8" stroke-linecap="round"/>'
    b += f'<circle cx="38" cy="38" r="5" fill="#ff922b" stroke="{O}" stroke-width="2"/><circle cx="36.5" cy="37" r="1" fill="{O}"/><circle cx="39.5" cy="37" r="1" fill="{O}"/>'
    return svg('0 0 60 60', b)


def _mush():
    b = shadow(28, 46, 22)
    b += f'<path d="M14 46 q0 -14 2 -20 h8 q2 6 2 20 Z" fill="#f3ead2" stroke="{O}" stroke-width="2.8" stroke-linejoin="round"/>'
    b += f'<path d="M4 28 Q4 10 20 10 Q36 10 36 28 Z" fill="#94d82d" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<circle cx="14" cy="20" r="3" fill="#ebfbcf"/><circle cx="26" cy="17" r="2.4" fill="#ebfbcf"/><circle cx="29" cy="25" r="2" fill="#ebfbcf"/>'
    b += f'<path d="M36 46 q0 -8 1 -12 h6 q1 4 1 12 Z" fill="#f3ead2" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
    b += f'<path d="M30 35 Q30 22 40 22 Q50 22 50 35 Z" fill="#da77f2" stroke="{O}" stroke-width="2.8" stroke-linejoin="round"/>'
    b += f'<circle cx="37" cy="28" r="2" fill="#f8e3ff"/><circle cx="44" cy="30" r="1.6" fill="#f8e3ff"/>'
    return svg('0 0 56 50', b)


DECO = [
    ('haunt_jack', _jack(), .5, .5),
    ('haunt_candy', _candy(), .55, .4),
    ('haunt_ghost', _ghost(), .45, .5),
    ('haunt_web', _web(), .5, .5),
    ('haunt_mush', _mush(), .52, .46),
]


# ---------------- extra ----------------
def _leaves():
    def leaf(x, y, r, c):
        return (f'<g transform="rotate({r} {x} {y})"><path d="M{x-8} {y} Q{x} {y-7} {x+8} {y} Q{x} {y+7} {x-8} {y} Z" fill="{c}" stroke="{O}" stroke-width="1.8" stroke-linejoin="round"/>'
                f'<path d="M{x-8} {y} H{x+6}" stroke="{O}" stroke-width="1.2" opacity=".6"/></g>')
    return svg('0 0 40 30', leaf(11, 18, -20, '#ff922b') + leaf(27, 13, 25, '#c2702e') + leaf(28, 24, -5, '#fcc419'))


def _corn():
    def corn(x, y, r):
        return (f'<g transform="rotate({r} {x} {y})"><path d="M{x-6} {y+6} L{x} {y-9} L{x+6} {y+6} Q{x} {y+9} {x-6} {y+6} Z" fill="#fff" stroke="{O}" stroke-width="1.8" stroke-linejoin="round"/>'
                f'<path d="M{x-4.6} {y+2.5} L{x+4.6} {y+2.5} L{x+2.6} {y-2.6} L{x-2.6} {y-2.6} Z" fill="#ff922b"/>'
                f'<path d="M{x-6} {y+6} Q{x} {y+9} {x+6} {y+6} L{x+4.6} {y+2.5} H{x-4.6} Z" fill="#fcc419"/>'
                f'<path d="M{x-6} {y+6} L{x} {y-9} L{x+6} {y+6} Q{x} {y+9} {x-6} {y+6} Z" fill="none" stroke="{O}" stroke-width="1.8" stroke-linejoin="round"/></g>')
    return svg('0 0 40 30', corn(12, 17, -25) + corn(28, 15, 20))


EXTRA = [
    ('haunt_leaves', _leaves(), .4, .3),
    ('haunt_candycorn', _corn(), .4, .3),
]
