"""Volume Vault art: ice-cube vault, cubes, crystals, frozen crates, a fish in an ice block."""
from kit import *

HI = 'stroke="#fff" stroke-opacity=".5" stroke-linecap="round" fill="none"'
ICE = ('#e4f6ff', '#5fafe2', '#2f74ad')      # top, front, side
TEAL = ('#c9fbf0', '#3cbfae', '#1f8a7e')


def cube(x, y, s, cols=ICE, sw=3.5, d=None, grid=0, hl=True):
    """an oblique 3D cube: front square at (x,y) size s, top and right faces going up-right by d"""
    d = s * .42 if d is None else d
    t, f, r = cols
    o = (f'<path d="M{x} {y} L{x+d:.1f} {y-d:.1f} L{x+s+d:.1f} {y-d:.1f} L{x+s} {y} Z" fill="{t}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
         f'<path d="M{x+s} {y} L{x+s+d:.1f} {y-d:.1f} L{x+s+d:.1f} {y+s-d:.1f} L{x+s} {y+s} Z" fill="{r}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
         f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="{f}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>')
    if grid:
        n = grid; g = []
        for i in range(1, n):
            a = s * i / n; b = d * i / n
            g.append(f'M{x+a:.1f} {y} v{s} M{x} {y+a:.1f} h{s}')                       # front
            g.append(f'M{x+b:.1f} {y-b:.1f} h{s} M{x+a:.1f} {y} l{d:.1f} {-d:.1f}')    # top
            g.append(f'M{x+s+b:.1f} {y-b:.1f} v{s} M{x+s} {y+a:.1f} l{d:.1f} {-d:.1f}')  # side
        o += f'<path d="{" ".join(g)}" stroke="{O}" stroke-width="{sw*.55:.1f}" fill="none"/>'
    if hl:
        o += f'<path d="M{x+s*.18:.1f} {y+s*.72:.1f} V{y+s*.2:.1f} H{x+s*.55:.1f}" stroke-width="{max(2,s*.08):.1f}" {HI}/>'
    return o


# ---------------- entrance ----------------
def _entrance():
    defs = grad('vd', '#a9c3cf', '#4f7686', '#7b9cab') + grad('vr', '#8fb2c1', '#3d5f6e')
    b = shadow(120, 188, 110)
    # back wall: big ice cubes stacked, stepped like a pyramid
    rows = [(186, 34, [14, 48, 158, 192]), (152, 34, [22, 56, 150, 184]), (118, 34, [36, 70, 136, 170]), (84, 34, [56, 88, 120, 152])]
    for y0, s, xs in rows:
        for x in xs:
            b += cube(x, y0 - s, s, ICE, sw=3.5, d=12)
    # the steel vault frame (round-topped) behind the doorway
    b += f'<path d="M78 188 L78 132 A42 42 0 0 1 162 132 L162 188 Z" fill="url(#vr)" stroke="{O}" stroke-width="5" stroke-linejoin="round"/>'
    for a in range(0, 181, 30):
        import math
        r = 36; cx = 120 + r * math.cos(math.radians(180 + a)); cy = 132 + r * math.sin(math.radians(180 + a))
        b += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="3.2" fill="#fcc419" stroke="{O}" stroke-width="1.8"/>'
    b += doorway(92, 148, 188, 104, cols=('#2f6e8f', '#245772', '#1a4157', '#122d3e', '#0b1c28'))
    b += f'<path d="M92 188 L92 132 A28 28 0 0 1 148 132 L148 188" fill="none" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<path d="M84 180 V134 A36 36 0 0 1 104 100" stroke-width="3" {HI}/>'
    # the heavy round vault door swung open to the right
    b += f'<ellipse cx="184" cy="146" rx="20" ry="38" fill="url(#vd)" stroke="{O}" stroke-width="5"/>'
    b += f'<ellipse cx="184" cy="146" rx="12" ry="25" fill="none" stroke="{O}" stroke-width="2.5"/>'
    b += f'<path d="M184 126 V166 M174 146 H194 M177 132 L191 160 M191 132 L177 160" stroke="{O}" stroke-width="3" stroke-linecap="round"/>'
    b += f'<ellipse cx="184" cy="146" rx="4.5" ry="7" fill="#fcc419" stroke="{O}" stroke-width="2.2"/>'
    b += f'<path d="M168 128 q4 -14 12 -16" stroke-width="3" {HI}/>'
    b += f'<rect x="160" y="128" width="8" height="10" rx="2" fill="#4f7686" stroke="{O}" stroke-width="2.5"/><rect x="160" y="156" width="8" height="10" rx="2" fill="#4f7686" stroke="{O}" stroke-width="2.5"/>'
    # snow on the ground and icicles
    b += f'<path d="M6 188 q10 -8 22 -2 q8 -6 16 0 L44 188 Z M196 188 q10 -9 20 -3 q10 -5 18 3 Z" fill="#fff" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
    # plaque: a 2x2x2 cube made of small cubes
    pc = cube(-13, -6, 19, ('#fff1b8', '#ffa94d', '#e8590c'), sw=2, d=8, grid=2, hl=False)
    b += plaque(120, 64, 22, pc)
    return svg('0 0 240 200', b, defs)


ENTRANCE = _entrance()


# ---------------- blocking scenery ----------------
def _stack():
    b = shadow(52, 94, 44)
    b += cube(8, 58, 34, sw=4, d=12) + cube(44, 58, 34, sw=4, d=12) + cube(26, 22, 34, TEAL, sw=4, d=12)
    return svg('0 0 100 100', b)


def _pillar():
    defs = grad('pa', '#e6fffb', '#20a090', '#63e6d2') + grad('pb', '#d0ebff', '#2f6fb0', '#74b8ef')
    b = shadow(36, 116, 30)
    b += f'<path d="M24 114 L24 30 L36 10 L48 30 L48 114 Z" fill="url(#pa)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M36 10 L36 114" stroke="{O}" stroke-width="2" opacity=".5"/>'
    b += f'<path d="M8 114 L8 66 L17 52 L26 66 L26 114 Z" fill="url(#pb)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<path d="M46 114 L46 78 L55 64 L64 78 L64 114 Z" fill="url(#pb)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<path d="M29 100 V34 L35 22" stroke-width="3.5" {HI}/><path d="M12 106 V70" stroke-width="2.5" {HI}/><path d="M50 106 V82" stroke-width="2.5" {HI}/>'
    b += f'<path d="M4 116 q8 -8 18 -3 q14 -8 26 0 q10 -6 20 3 Z" fill="#fff" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
    return svg('0 0 72 124', b, defs)


def _crate():
    defs = grad('cw', '#e0a96b', '#9a6234', '#c48448')
    b = shadow(50, 86, 42)
    # two wooden crates, frosted
    def box(x, y, s):
        d = s * .32
        return (f'<path d="M{x} {y} L{x+d:.1f} {y-d:.1f} L{x+s+d:.1f} {y-d:.1f} L{x+s} {y} Z" fill="#f6fbff" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
                f'<path d="M{x+s} {y} L{x+s+d:.1f} {y-d:.1f} L{x+s+d:.1f} {y+s-d:.1f} L{x+s} {y+s} Z" fill="#8a5a2e" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
                f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="url(#cw)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
                f'<path d="M{x+4} {y+4} L{x+s-4} {y+s-4} M{x+s-4} {y+4} L{x+4} {y+s-4}" stroke="#7a4a22" stroke-width="3.5" stroke-linecap="round"/>'
                f'<rect x="{x+3}" y="{y+3}" width="{s-6}" height="{s-6}" fill="none" stroke="#7a4a22" stroke-width="2.2"/>'
                f'<path d="M{x} {y} h{s} v6 l-5 7 l-4 -7 l-6 10 l-5 -10 l-5 6 l-4 -6 H{x} Z" fill="#dff4ff" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>')
    b += box(6, 46, 38) + box(48, 50, 34) + box(24, 14, 30)
    return svg('0 0 100 92', b, defs)


def _fish():
    defs = grad('ib', '#f2fbff', '#6fb4e0', '#a8dcf6')
    b = shadow(54, 84, 46)
    b += f'<path d="M10 80 L10 34 L30 18 L100 18 L100 64 L82 80 Z" fill="url(#ib)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M10 34 H82 L100 18 M82 34 V80" fill="none" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    # the fish inside (orange, a warm accent)
    b += f'<path d="M20 58 q16 -16 36 -6 q8 4 12 6 l12 -10 l-2 14 l2 14 l-12 -10 q-4 2 -12 6 q-20 10 -36 -6 Z" fill="#ff922b" stroke="{O}" stroke-width="3" stroke-linejoin="round" opacity=".92"/>'
    b += f'<circle cx="30" cy="56" r="3" fill="{O}"/><path d="M40 50 q4 8 0 16" stroke="{O}" stroke-width="2" fill="none"/>'
    b += f'<path d="M16 72 V40 M20 30 L34 22" stroke-width="3.5" {HI}/><path d="M88 66 L96 58" stroke-width="2.5" {HI}/>'
    b += f'<path d="M50 34 l10 10 M66 36 l4 4" stroke="#fff" stroke-width="2" stroke-opacity=".7" stroke-linecap="round"/>'
    return svg('0 0 110 92', b, defs)


def _rock():
    defs = grad('rk', '#9aa7bd', '#4e5a73', '#73809a')
    b = shadow(50, 76, 42)
    b += f'<path d="M10 74 L18 40 L42 22 L70 26 L90 48 L92 74 Z" fill="url(#rk)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M17 44 L42 22 L70 26 L88 46 q-8 6 -14 0 q-8 8 -16 2 q-10 8 -18 0 q-10 6 -22 -4 Z" fill="#fff" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M30 40 L44 30 L62 31" stroke="#bfe4f5" stroke-width="3" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M56 56 L66 70 M36 58 l-6 10" stroke="#3b4458" stroke-width="2.5" stroke-linecap="round"/>'
    return svg('0 0 100 82', b, defs)


BLOCK = [
    ('vault_cubes', _stack(), 1.0, 1.0),
    ('vault_pillar', _pillar(), .72, 1.24),
    ('vault_crates', _crate(), 1.05, .97),
    ('vault_fishice', _fish(), 1.1, .92),
    ('vault_rock', _rock(), 1.0, .82),
]


# ---------------- deco ----------------
def _minicubes():
    b = shadow(30, 50, 26)
    b += cube(6, 28, 22, sw=3, d=8) + cube(30, 32, 18, ('#fff1b8', '#ffa94d', '#e8590c'), sw=3, d=7)
    return svg('0 0 60 54', b)


def _shards():
    b = shadow(30, 56, 24)
    b += f'<path d="M14 56 L20 22 L28 56 Z" fill="#74c0fc" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M24 56 L34 8 L42 56 Z" fill="#3cbfae" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M38 56 L48 30 L52 56 Z" fill="#a5d8ff" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M30 50 L34 20" stroke-width="2.5" {HI}/><path d="M18 50 L20 32" stroke-width="2" {HI}/>'
    return svg('0 0 60 60', b)


def _jug():
    b = shadow(26, 60, 20)
    b += f'<path d="M12 18 L12 56 Q12 60 16 60 L38 60 Q42 60 42 56 L42 18 L46 12 L8 12 Z" fill="#f4fbff" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M14 34 L40 34 L40 56 Q40 58 38 58 L16 58 Q14 58 14 56 Z" fill="#339af0"/>'
    b += f'<path d="M14 34 q6 -3 13 0 t13 0" stroke="#d0ebff" stroke-width="2" fill="none"/>'
    b += f'<path d="M42 22 q10 0 10 10 q0 10 -10 10" stroke="{O}" stroke-width="3.5" fill="none"/>'
    b += f'<path d="M12 18 L12 56 Q12 60 16 60 L38 60 Q42 60 42 56 L42 18 L46 12 L8 12 Z" fill="none" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M12 24 h8 M12 32 h12 M12 40 h8 M12 48 h12" stroke="#e8590c" stroke-width="2.2" stroke-linecap="round"/>'
    b += f'<path d="M36 20 V30" stroke-width="2.5" {HI}/>'
    return svg('0 0 56 64', b)


def _snow():
    b = shadow(30, 38, 26)
    b += f'<path d="M4 38 q2 -14 14 -14 q4 -14 18 -12 q14 2 14 14 q10 2 8 12 Z" fill="#fff" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M7 36 q10 -6 22 -2 q12 -6 26 2 L56 36 Z" fill="#a5d8ff"/>'
    b += f'<path d="M4 38 q2 -14 14 -14 q4 -14 18 -12 q14 2 14 14 q10 2 8 12 Z" fill="none" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<path d="M12 36 q8 4 18 2 M30 20 q6 -4 12 0" stroke="#a5d8ff" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    b += f'<path d="M48 28 l2 -6" stroke="#ff922b" stroke-width="3" stroke-linecap="round"/>'
    return svg('0 0 62 42', b)


DECO = [
    ('vault_minicubes', _minicubes(), .55, .5),
    ('vault_shards', _shards(), .5, .5),
    ('vault_jug', _jug(), .45, .52),
    ('vault_snowpile', _snow(), .58, .4),
]


# ---------------- extra ----------------
def _chips():
    b = (f'<path d="M4 26 L8 16 L16 18 L14 26 Z" fill="#74c0fc" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'
         f'<path d="M20 26 L24 12 L32 16 L30 26 Z" fill="#e7f5ff" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'
         f'<path d="M30 28 L33 21 L38 23 L37 28 Z" fill="#3cbfae" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>')
    return svg('0 0 40 30', b)


def _flake():
    import math
    arms = ' '.join(f'M20 15 l{9*math.cos(math.radians(a)):.1f} {9*math.sin(math.radians(a)):.1f}' for a in range(0, 360, 60))
    b = f'<path d="{arms}" stroke="#2f6fb0" stroke-width="5" stroke-linecap="round"/><path d="{arms}" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'
    return svg('0 0 40 30', b)


EXTRA = [
    ('vault_chips', _chips(), .4, .3),
    ('vault_flake', _flake(), .4, .3),
]
