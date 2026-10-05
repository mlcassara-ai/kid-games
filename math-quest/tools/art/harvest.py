"""Harvest Hollow art (Thanksgiving event, Nov 15-30): a cosy log lodge with an autumn tree, corn stalks, hay, pumpkins and a
   friendly turkey on the plaque. Warm browns, oranges and golds; same outline and doorway style as every other entrance."""
from kit import *
import math

HI = 'stroke="#fff" stroke-opacity=".45" stroke-linecap="round" fill="none"'


def pumpkin(cx, cy, r, gid='pk', sw=3):
    return (f'<ellipse cx="{cx-r*.45:.1f}" cy="{cy}" rx="{r*.6:.1f}" ry="{r*.8:.1f}" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}"/>'
            f'<ellipse cx="{cx+r*.45:.1f}" cy="{cy}" rx="{r*.6:.1f}" ry="{r*.8:.1f}" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}"/>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{r*.58:.1f}" ry="{r*.84:.1f}" fill="url(#{gid})" stroke="{O}" stroke-width="{sw}"/>'
            f'<path d="M{cx} {cy-r*.78:.1f} q-1 {-r*.3:.1f} {r*.22:.1f} {-r*.4:.1f}" stroke="#5c3d1e" stroke-width="{max(2.5,r*.22):.1f}" stroke-linecap="round" fill="none"/>'
            f'<path d="M{cx-r*.72:.1f} {cy-r*.2:.1f} q{r*.1:.1f} {-r*.35:.1f} {r*.32:.1f} {-r*.44:.1f}" stroke-width="{max(1.5,r*.12):.1f}" {HI}/>')


def leaf(x, y, s, rot, col):
    """a little maple-ish leaf"""
    return (f'<path transform="translate({x} {y}) rotate({rot}) scale({s})" d="M0 -10 L3 -4 L9 -6 L6 0 L10 3 L3 3 L2 9 L0 6 L-2 9 L-3 3 L-10 3 L-6 0 L-9 -6 L-3 -4 Z" '
            f'fill="{col}" stroke="{O}" stroke-width="{1.6/s:.2f}" stroke-linejoin="round"/>')


def corn(x, y, h, flip=1):
    """a bundle of dry corn stalks"""
    o = ''
    for i, dx in enumerate((-7, 0, 7)):
        tx = x + dx * flip
        o += f'<path d="M{tx} {y} L{tx+dx*.6:.1f} {y-h+abs(dx)*1.2:.1f}" stroke="{O}" stroke-width="6.5" stroke-linecap="round"/>'
        o += f'<path d="M{tx} {y} L{tx+dx*.6:.1f} {y-h+abs(dx)*1.2:.1f}" stroke="#e3c27a" stroke-width="3.5" stroke-linecap="round"/>'
    for k, (yy, d) in enumerate(((y-h*.35, 1), (y-h*.55, -1), (y-h*.75, 1))):
        o += f'<path d="M{x} {yy:.1f} q{d*14} -6 {d*22} 4 q{-d*12} -2 {-d*22} 2 Z" fill="#d9b25c" stroke="{O}" stroke-width="2.4" stroke-linejoin="round"/>'
    o += f'<path d="M{x-12} {y-h*.3:.1f} q12 5 24 0" stroke="#a5491f" stroke-width="5" fill="none" stroke-linecap="round"/>'
    o += f'<path d="M{x-12} {y-h*.3:.1f} q12 5 24 0" stroke="{O}" stroke-width="1.5" fill="none" opacity=".6"/>'
    return o


def turkey(s=1):
    """the plaque turkey: fanned tail, round body, little face (drawn around 0,0 at about +-11)"""
    cols = ['#c92a2a', '#e8590c', '#fab005', '#e8590c', '#c92a2a']
    o = ''
    for i, c in enumerate(cols):
        a = -150 + i * 30
        o += f'<ellipse cx="0" cy="-6" rx="3.6" ry="7.5" fill="{c}" stroke="{O}" stroke-width="1.3" transform="rotate({a+90} 0 2)"/>'
    o += f'<ellipse cx="0" cy="4" rx="6.5" ry="6.5" fill="#8a5a33" stroke="{O}" stroke-width="1.6"/>'
    o += f'<circle cx="0" cy="-2" r="4" fill="#a8703f" stroke="{O}" stroke-width="1.5"/>'
    o += f'<circle cx="-1.4" cy="-2.8" r=".9" fill="{O}"/><circle cx="1.4" cy="-2.8" r=".9" fill="{O}"/>'
    o += f'<path d="M-1.4 -1 L1.4 -1 L0 1.2 Z" fill="#fab005" stroke="{O}" stroke-width=".8" stroke-linejoin="round"/>'
    o += f'<path d="M.6 0 q1.6 2 .4 3.6" stroke="#e03131" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    return f'<g transform="scale({s})">{o}</g>'


def _entrance():
    defs = (grad('lg', '#c98b52', '#7a4a24', '#a8693a') + grad('rf', '#b5502a', '#6e2a14', x2=0, y2=1) + grad('pk', '#ffc078', '#e8590c', '#fd7e14')
            + grad('hy', '#ffe28a', '#d9a63a') + grad('tr', '#ffb347', '#d9480f', '#f08c00', x2=0, y2=1))
    b = shadow(120, 188, 110)
    # autumn tree behind, on the left
    b += f'<path d="M38 188 L42 120 Q40 104 30 96 M42 124 Q52 110 62 106" stroke="{O}" stroke-width="10" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M38 188 L42 120 Q40 104 30 96 M42 124 Q52 110 62 106" stroke="#7a4a24" stroke-width="6" fill="none" stroke-linecap="round"/>'
    for cx, cy, r in ((26, 88, 22), (52, 76, 26), (74, 94, 18), (36, 64, 20)):
        b += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#tr)" stroke="{O}" stroke-width="4"/>'
    b += f'<path d="M30 62 q8 -8 18 -6 M44 66 q8 -10 20 -6" stroke-width="3" {HI}/>'
    # log lodge walls
    b += f'<path d="M56 188 L56 104 L196 104 L196 188 Z" fill="url(#lg)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    for yy in range(114, 188, 13):
        b += f'<path d="M56 {yy} H196" stroke="#5c3418" stroke-width="2.4"/>'
    for yy in range(108, 186, 13):
        b += f'<circle cx="56" cy="{yy+6}" r="5" fill="#d9a066" stroke="{O}" stroke-width="2.4"/><circle cx="196" cy="{yy+6}" r="5" fill="#d9a066" stroke="{O}" stroke-width="2.4"/>'
    # chimney with a curl of smoke
    b += f'<path d="M166 72 L166 44 L184 44 L184 84 Z" fill="#9c6b4a" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M166 54 H184 M166 64 H184 M175 44 V54 M171 54 V64 M179 64 V74" stroke="#6b4428" stroke-width="2"/>'
    b += f'<path d="M175 38 q-8 -8 0 -14 q8 -6 2 -14" stroke="#e9ecef" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>'
    # roof
    b += f'<path d="M44 108 L126 46 L208 108 L196 114 L126 62 L56 114 Z" fill="url(#rf)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M62 100 L122 56" stroke-width="3" {HI}/>'
    # gable (log ends) under the roof
    b += f'<path d="M62 106 L126 60 L190 106 Z" fill="url(#lg)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M80 94 H172 M98 81 H154 M114 69 H138" stroke="#5c3418" stroke-width="2.2"/>'
    # leaf garland across the front
    b += f'<path d="M60 116 Q126 134 192 116" stroke="#5c3d1e" stroke-width="2.5" fill="none"/>'
    for i in range(9):
        t = i / 8
        x = 60 + t * 132
        y = 116 + math.sin(t * math.pi) * 13
        b += leaf(round(x, 1), round(y + 3, 1), .8, i * 37 % 90 - 45, ['#e8590c', '#fab005', '#c92a2a'][i % 3])
    # windows with warm light
    for wx in (61, 169):
        b += f'<rect x="{wx}" y="134" width="24" height="22" rx="2" fill="#ffd43b" stroke="{O}" stroke-width="3.5"/>'
        b += f'<path d="M{wx+12} 134 V156 M{wx} 145 H{wx+24}" stroke="{O}" stroke-width="2.4"/>'
        b += f'<rect x="{wx-3}" y="155" width="30" height="6" rx="2" fill="#7a4a24" stroke="{O}" stroke-width="2.4"/>'
    # door
    b += f'<path d="M104 188 L104 150 A22 22 0 0 1 148 150 L148 188 Z" fill="#e8590c" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += doorway(110, 142, 188, 134, cols=('#6b3a1a', '#552c13', '#40200d', '#2c1508', '#180b04'))
    b += f'<path d="M98 188 L154 188 L152 182 L100 182 Z" fill="#9c6b4a" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    # corn stalks either side of the door, hay bale and pumpkins in front
    b += corn(100, 186, 46, -1) + corn(152, 186, 46, 1)
    b += f'<rect x="196" y="160" width="36" height="26" rx="4" fill="url(#hy)" stroke="{O}" stroke-width="3.5"/>'
    b += f'<path d="M198 168 H230 M198 177 H230" stroke="#b8862b" stroke-width="2"/><path d="M206 160 V186 M222 160 V186" stroke="#a5491f" stroke-width="3"/>'
    b += pumpkin(214, 152, 10) + pumpkin(16, 178, 11) + pumpkin(36, 182, 7)
    b += leaf(60, 190, .7, 20, '#c92a2a') + leaf(186, 192, .7, -30, '#fab005')
    # plaque: a friendly turkey
    b += plaque(126, 86, 17, turkey(1.15))
    return svg('0 0 240 200', b, defs)


ENTRANCE = _entrance()
