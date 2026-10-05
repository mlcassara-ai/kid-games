"""Estimation Station art: an old railway station, jelly-bean jars (guess how many!), luggage, signals, water tower."""
from kit import *
import random

HI = 'stroke="#fff" stroke-opacity=".45" stroke-linecap="round" fill="none"'
BEANS = ['#e03131', '#f08c00', '#fcc419', '#37b24d', '#1c7ed6', '#ae3ec9', '#f06595', '#fff']


def bean(x, y, rot, col, s=1.0, sw=1.4):
    return (f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{4.6*s:.1f}" ry="{3*s:.1f}" transform="rotate({rot} {x:.1f} {y:.1f})" fill="{col}" stroke="{O}" stroke-width="{sw}"/>'
            f'<ellipse cx="{x-1.2*s:.1f}" cy="{y-1*s:.1f}" rx="{1.6*s:.1f}" ry=".9" transform="rotate({rot} {x:.1f} {y:.1f})" fill="#fff" opacity=".6"/>')


def fill_beans(seed, x0, x1, y0, y1, step=7.2, s=1.0, clip=None):
    r = random.Random(seed); out = []
    y = y1
    row = 0
    while y > y0:
        x = x0 + (step / 2 if row % 2 else 0)
        while x < x1:
            if clip is None or clip(x, y):
                out.append(bean(x + r.uniform(-1.2, 1.2), y + r.uniform(-1, 1), r.randint(0, 179), r.choice(BEANS), s))
            x += step
        y -= step * .72; row += 1
    return ''.join(out)


def jar(cx, base, w, h, seed, lid='#e03131', s=1.0, sw=4):
    """a glass jar full of jelly beans: body from base-h to base, w wide, centred on cx"""
    x0 = cx - w / 2; x1 = cx + w / 2; top = base - h
    body = (f'M{x0+6} {top+10} Q{x0} {top+16} {x0} {top+28} L{x0} {base-8} Q{x0} {base} {x0+8} {base} L{x1-8} {base} '
            f'Q{x1} {base} {x1} {base-8} L{x1} {top+28} Q{x1} {top+16} {x1-6} {top+10} Z')
    o = f'<path d="{body}" fill="#e8f7ff" fill-opacity=".55"/>'
    o += fill_beans(seed, x0 + 5, x1 - 3, top + 22, base - 5, step=7.2 * s, s=s)
    o += f'<path d="{body}" fill="#fff" fill-opacity=".12" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
    o += f'<path d="M{x0+5} {base-12} L{x0+5} {top+28} Q{x0+5} {top+20} {x0+11} {top+16}" stroke="#fff" stroke-opacity=".75" stroke-width="{3*s:.1f}" stroke-linecap="round" fill="none"/>'
    o += f'<rect x="{x0+3}" y="{top}" width="{w-6}" height="11" rx="3" fill="{lid}" stroke="{O}" stroke-width="{sw*.85:.1f}"/>'
    o += f'<path d="M{x0+7} {top+4} h{w*.35:.1f}" stroke-width="2.5" {HI}/>'
    return o


# ---------------- entrance ----------------
def _entrance():
    defs = (grad('sb', '#e07a52', '#a8462c', '#c75b3c', x2=1, y2=1) + grad('sr', '#3f8f78', '#215446', x2=0, y2=1)
            + grad('sc', '#4d9e84', '#2b6656', x2=0, y2=1))
    b = shadow(120, 188, 112)
    # platform
    b += f'<rect x="4" y="176" width="232" height="12" rx="2" fill="#a7a197" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<path d="M6 176 h228" stroke="#fcc419" stroke-width="3"/>'
    b += f'<path d="M40 176 v12 M80 176 v12 M160 176 v12 M200 176 v12" stroke="#7d776d" stroke-width="2"/>'
    # side canopies on posts
    for (a, bb, p1, p2) in ((10, 74, 22, 58), (166, 230, 182, 218)):
        b += f'<path d="M{p1} 176 V116 M{p2} 176 V116" stroke="{O}" stroke-width="7" stroke-linecap="round"/>'
        b += f'<path d="M{p1} 176 V116 M{p2} 176 V116" stroke="#2b6656" stroke-width="3.5" stroke-linecap="round"/>'
        sl = 1 if a < 100 else -1
        y_out = 112; y_in = 100
        ya, yb = (y_out, y_in) if sl > 0 else (y_in, y_out)
        b += f'<path d="M{a} {ya} L{bb} {yb} L{bb} {yb+10} L{a} {ya+10} Z" fill="url(#sc)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
        # scalloped valance, cream and green
        n = 5; wv = (bb - a) / n; sc = ''
        for i in range(n):
            xa = a + i * wv; yy = ya + 10 + (yb - ya) * (i + .5) / n
            sc += f'<path d="M{xa:.1f} {yy-1:.1f} h{wv:.1f} v4 a{wv/2:.1f} {wv/2.4:.1f} 0 0 1 {-wv:.1f} 0 Z" fill="{"#f3e3b5" if i%2 else "#fcc419"}" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
        b += sc
    # main building walls (brick)
    b += f'<rect x="68" y="84" width="104" height="92" fill="url(#sb)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    br = ''.join(f'M68 {y} h104 ' for y in range(104, 176, 12))
    br += ''.join(f'M{x} {y} v12 ' for i, y in enumerate(range(80, 176, 12)) if y >= 92 for x in range(76 + (i % 2) * 8, 172, 16))
    b += f'<path d="{br}" stroke="#8f3b25" stroke-width="1.6" opacity=".7"/>'
    b += f'<rect x="68" y="84" width="104" height="92" fill="none" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    # chimney, roof and clock (raised a little)
    b += '<g transform="translate(0 -8)">'
    b += f'<rect x="146" y="42" width="14" height="30" fill="#b9523a" stroke="{O}" stroke-width="3.5"/><rect x="143" y="38" width="20" height="7" fill="#7d776d" stroke="{O}" stroke-width="3"/>'
    # roof with gable
    b += f'<path d="M58 98 L120 40 L182 98 Z" fill="url(#sr)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M70 90 L120 46" stroke-width="3" {HI}/>'
    b += f'<path d="M52 98 H188 V106 H52 Z" fill="#f3e3b5" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    # clock in the gable
    b += f'<circle cx="120" cy="74" r="15" fill="#fffaf0" stroke="{O}" stroke-width="4"/>'
    b += ''.join(f'<circle cx="{120+11*__import__("math").cos(a*3.14159/6):.1f}" cy="{74+11*__import__("math").sin(a*3.14159/6):.1f}" r="1.3" fill="{O}"/>' for a in range(12))
    b += f'<path d="M120 74 V65 M120 74 L127 78" stroke="{O}" stroke-width="2.8" stroke-linecap="round"/>'
    b += '</g>'
    # windows
    for x in (76, 146):
        b += f'<path d="M{x} 166 V138 a9 9 0 0 1 18 0 V166 Z" fill="#ffe8a3" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
        b += f'<path d="M{x+9} 129 V166 M{x} 150 h18" stroke="{O}" stroke-width="2.5"/>'
        b += f'<rect x="{x-3}" y="164" width="24" height="5" fill="#f3e3b5" stroke="{O}" stroke-width="2.5"/>'
    # doorway
    b += f'<path d="M98 176 L98 150 A22 22 0 0 1 142 150 L142 176 Z" fill="#f3e3b5" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += doorway(103, 137, 176, 134, cols=('#5c3d2e', '#47301f', '#342215', '#22160d', '#140c07'))
    # plaque with "approximately equal"
    wave = 'M-11 {y} q5.5 -6 11 0 t11 0'
    inner = (f'<path d="{wave.format(y=-4)}" stroke="{O}" stroke-width="4" fill="none" stroke-linecap="round"/>'
             f'<path d="{wave.format(y=5)}" stroke="{O}" stroke-width="4" fill="none" stroke-linecap="round"/>')
    b += plaque(120, 110, 16, inner)
    return svg('0 0 240 200', b, defs)


ENTRANCE = _entrance()


# ---------------- blocking scenery ----------------
def _bigjar():
    b = shadow(42, 104, 34)
    b += jar(42, 102, 64, 88, 7, '#e03131', s=1.3)
    # a question-mark tag
    b += f'<path d="M66 30 L74 44" stroke="{O}" stroke-width="2"/>'
    b += f'<circle cx="76" cy="52" r="10" fill="#fcc419" stroke="{O}" stroke-width="3"/>'
    b += f'<text x="76" y="57.5" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" fill="{O}">?</text>'
    return svg('0 0 90 110', b)


def _luggage():
    defs = grad('lt', '#7a4fb0', '#4b2c78', x2=0, y2=1) + grad('lb', '#c8864a', '#8a5528', x2=0, y2=1) + grad('lg', '#3f8f78', '#215446', x2=0, y2=1)
    b = shadow(50, 96, 44)
    # big trunk at the bottom
    b += f'<rect x="8" y="58" width="80" height="36" rx="4" fill="url(#lb)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M8 68 h80 M26 58 v36 M70 58 v36" stroke="{O}" stroke-width="2.5"/>'
    b += f'<rect x="43" y="64" width="10" height="8" rx="2" fill="#fcc419" stroke="{O}" stroke-width="2.2"/>'
    b += f'<path d="M14 62 h8" stroke-width="2.5" {HI}/>'
    # suitcase
    b += f'<rect x="16" y="30" width="62" height="28" rx="5" fill="url(#lg)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<path d="M38 30 q0 -8 9 -8 q9 0 9 8" stroke="{O}" stroke-width="3.5" fill="none"/>'
    b += f'<path d="M16 44 h62" stroke="#173d33" stroke-width="2"/>'
    b += f'<rect x="56" y="36" width="14" height="10" rx="1.5" fill="#f3e3b5" stroke="{O}" stroke-width="2" transform="rotate(-8 63 41)"/>'
    b += f'<path d="M22 36 h12" stroke-width="2.5" {HI}/>'
    # small purple case on top, a bit off
    b += f'<rect x="28" y="8" width="38" height="22" rx="4" fill="url(#lt)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round" transform="rotate(-6 47 19)"/>'
    b += f'<circle cx="40" cy="18" r="3.5" fill="#fcc419" stroke="{O}" stroke-width="1.6"/>'
    return svg('0 0 100 100', b, defs)


def _signal():
    b = shadow(30, 126, 18)
    b += f'<path d="M18 126 L22 116 H38 L42 126 Z" fill="#7d776d" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<rect x="26" y="20" width="8" height="98" fill="#2f3640" stroke="{O}" stroke-width="3.5"/>'
    b += f'<path d="M24 60 h12 M24 80 h12 M24 100 h12" stroke="{O}" stroke-width="2"/>'
    # semaphore arm (red with white stripe), raised a little
    b += f'<path d="M30 30 L58 22 L60 32 L32 40 Z" fill="#e03131" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M48 26 L50 35" stroke="#fff" stroke-width="4"/>'
    # lamp
    b += f'<rect x="12" y="34" width="14" height="22" rx="4" fill="#2f3640" stroke="{O}" stroke-width="3"/>'
    b += f'<circle cx="19" cy="41" r="4" fill="#ffd43b" stroke="{O}" stroke-width="1.8"/><circle cx="19" cy="50" r="3.2" fill="#51cf66" stroke="{O}" stroke-width="1.8"/>'
    b += f'<circle cx="30" cy="14" r="6" fill="#2f3640" stroke="{O}" stroke-width="3"/>'
    b += f'<path d="M28 30 V112" stroke-width="2" {HI}/>'
    return svg('0 0 64 130', b)


def _bench():
    defs = grad('bw', '#5fb08f', '#2b6656', x2=0, y2=1)
    b = shadow(55, 66, 48)
    b += f'<path d="M20 66 V44 M90 66 V44 M24 44 L16 66 M86 44 L94 66" stroke="{O}" stroke-width="6" stroke-linecap="round"/>'
    b += f'<path d="M20 66 V44 M90 66 V44" stroke="#2f3640" stroke-width="3" stroke-linecap="round"/>'
    for y in (12, 24):
        b += f'<rect x="8" y="{y}" width="94" height="9" rx="3" fill="url(#bw)" stroke="{O}" stroke-width="3.5"/>'
    b += f'<path d="M20 33 V12 M90 33 V12" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
    b += f'<path d="M6 40 h98 v8 h-98 Z" fill="url(#bw)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M14 15 h30 M14 43 h40" stroke-width="2.5" {HI}/>'
    # a little bean jar left on the bench
    b += jar(74, 40, 16, 24, 3, '#1c7ed6', s=.55, sw=2.5)
    return svg('0 0 110 72', b, defs)


def _tower():
    defs = grad('wt', '#d9a066', '#8a5528', '#b97a40', x2=1, y2=0)
    b = shadow(46, 126, 38)
    b += f'<path d="M22 126 L30 70 M70 126 L62 70 M24 112 L66 86 M68 112 L26 86" stroke="{O}" stroke-width="5.5" stroke-linecap="round"/>'
    b += f'<path d="M22 126 L30 70 M70 126 L62 70" stroke="#5c3a20" stroke-width="2.5" stroke-linecap="round"/>'
    b += f'<rect x="10" y="66" width="72" height="8" fill="#7d776d" stroke="{O}" stroke-width="3.5"/>'
    b += f'<path d="M14 66 L14 30 Q14 26 18 26 L74 26 Q78 26 78 30 L78 66 Z" fill="url(#wt)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
    b += f'<path d="M14 38 h64 M14 54 h64" stroke="#2f3640" stroke-width="3.5"/>'
    b += f'<path d="M26 26 v40 M40 26 v40 M54 26 v40 M66 26 v40" stroke="#7a4a22" stroke-width="1.6" opacity=".7"/>'
    b += f'<path d="M8 28 L46 6 L84 28 Z" fill="#3f8f78" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
    b += f'<path d="M20 60 V32" stroke-width="3" {HI}/>'
    # spout
    b += f'<path d="M78 48 h8 l4 18" stroke="{O}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
    b += f'<path d="M78 48 h8 l4 18" stroke="#2f3640" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
    return svg('0 0 92 130', b, defs)


def _buffer():
    b = shadow(55, 66, 48)
    # rails
    b += f'<path d="M4 64 L106 64 M4 56 L106 56" stroke="{O}" stroke-width="4" stroke-linecap="round"/>'
    b += f'<path d="M4 64 L106 64 M4 56 L106 56" stroke="#adb5bd" stroke-width="1.6" stroke-linecap="round"/>'
    # frame
    b += f'<path d="M22 60 L40 28 M88 60 L70 28" stroke="{O}" stroke-width="7" stroke-linecap="round"/>'
    b += f'<path d="M22 60 L40 28 M88 60 L70 28" stroke="#495057" stroke-width="3.5" stroke-linecap="round"/>'
    # beam (red and white)
    b += f'<rect x="14" y="20" width="82" height="18" rx="2" fill="#e03131" stroke="{O}" stroke-width="4"/>'
    b += f'<path d="M30 20 L22 38 M50 20 L42 38 M70 20 L62 38 M90 20 L82 38" stroke="#fff" stroke-width="5"/>'
    b += f'<rect x="14" y="20" width="82" height="18" rx="2" fill="none" stroke="{O}" stroke-width="4"/>'
    # buffers
    for x in (24, 86):
        b += f'<rect x="{x-5}" y="38" width="10" height="8" fill="#495057" stroke="{O}" stroke-width="2.5"/>'
        b += f'<ellipse cx="{x}" cy="50" rx="9" ry="5" fill="#ced4da" stroke="{O}" stroke-width="3"/>'
    b += f'<circle cx="55" cy="14" r="6" fill="#ffd43b" stroke="{O}" stroke-width="3"/><path d="M55 20 v0" stroke="{O}"/>'
    return svg('0 0 110 72', b)


BLOCK = [
    ('station_beanjar', _bigjar(), .85, 1.04),
    ('station_luggage', _luggage(), 1.0, 1.0),
    ('station_signal', _signal(), .64, 1.3),
    ('station_bench', _bench(), 1.1, .72),
    ('station_watertower', _tower(), .92, 1.3),
    ('station_buffer', _buffer(), 1.1, .72),
]


# ---------------- deco ----------------
def _tickets():
    b = shadow(30, 40, 24)
    for x, y, r, c in ((8, 14, -12, '#ffd8a8'), (24, 18, 10, '#c3fae8')):
        b += (f'<g transform="rotate({r} {x+14} {y+9})"><path d="M{x} {y} h28 v6 a3 3 0 0 0 0 6 v6 h-28 v-6 a3 3 0 0 0 0 -6 Z" fill="{c}" stroke="{O}" stroke-width="2.5" stroke-linejoin="round"/>'
              f'<path d="M{x+20} {y+2} v14" stroke="{O}" stroke-width="1.5" stroke-dasharray="2 2"/>'
              f'<path d="M{x+4} {y+6} h12 M{x+4} {y+11} h8" stroke="#e03131" stroke-width="2" stroke-linecap="round"/></g>')
    return svg('0 0 60 44', b)


def _smalljar():
    b = shadow(22, 52, 18)
    b += jar(22, 50, 30, 44, 11, '#37b24d', s=.75, sw=3)
    return svg('0 0 44 56', b)


def _lantern():
    b = shadow(22, 58, 16)
    b += f'<path d="M14 12 q8 -12 16 0" stroke="{O}" stroke-width="3" fill="none"/>'
    b += f'<path d="M10 16 h24 l-3 6 h-18 Z" fill="#e03131" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    b += f'<rect x="12" y="22" width="20" height="24" rx="3" fill="#ffe066" stroke="{O}" stroke-width="3"/>'
    b += f'<circle cx="22" cy="34" r="5" fill="#fff9db"/>'
    b += f'<path d="M17 22 v24 M27 22 v24" stroke="{O}" stroke-width="2"/>'
    b += f'<path d="M8 46 h28 v8 h-28 Z" fill="#e03131" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>'
    return svg('0 0 44 62', b)


def _beancrate():
    defs = grad('cw', '#d9a066', '#9a6234', x2=0, y2=1)
    b = shadow(30, 50, 26)
    b += fill_beans(5, 10, 52, 12, 24, step=6.5, s=.9)
    b += f'<rect x="6" y="22" width="48" height="26" rx="2" fill="url(#cw)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
    b += f'<path d="M6 35 h48 M18 22 v26 M42 22 v26" stroke="#7a4a22" stroke-width="2"/>'
    b += f'<path d="M10 27 h6" stroke-width="2.5" {HI}/>'
    return svg('0 0 60 54', b, defs)


DECO = [
    ('station_tickets', _tickets(), .55, .4),
    ('station_smalljar', _smalljar(), .42, .54),
    ('station_lantern', _lantern(), .42, .58),
    ('station_beancrate', _beancrate(), .56, .5),
]


# ---------------- extra ----------------
def _loose():
    b = bean(10, 20, 20, '#e03131', 1.1, 1.6) + bean(22, 14, 140, '#fcc419', 1.1, 1.6) + bean(30, 23, 70, '#1c7ed6', 1.1, 1.6)
    return svg('0 0 40 30', b)


def _pebbles():
    b = (f'<ellipse cx="11" cy="21" rx="7" ry="5" fill="#9c9488" stroke="{O}" stroke-width="2"/>'
         f'<ellipse cx="25" cy="17" rx="5" ry="4" fill="#bdb5a6" stroke="{O}" stroke-width="2"/>'
         f'<ellipse cx="33" cy="24" rx="4" ry="3" fill="#857d71" stroke="{O}" stroke-width="2"/>')
    return svg('0 0 40 30', b)


EXTRA = [
    ('station_beans', _loose(), .4, .3),
    ('station_pebbles', _pebbles(), .4, .3),
]
