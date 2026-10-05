"""Multiplication Volcano scenery: charcoal lava rocks with glowing cracks, smoking steam vents, black obsidian spikes, a charred
dead tree, a small lava pool ringed with rocks, a dragon egg in a rocky nest; embers, fire flowers, a small vent, cooled lava blobs;
ash pebbles and tiny sparks. The Volcano entrance already exists (ENTRANCE = None)."""
from kit import *
ENTRANCE=None

def P(w,h,body,defs=''):return svg(f'0 0 {w*100:g} {h*100:g}',body,defs)
CHAR=('#6b6d76','#1e1f24','#3a3b42')     # charcoal rock
OBS=('#5c4d7a','#120f1c','#2b2340')      # obsidian (purple-black glass)
LAVA=('#fff3bf','#e8590c','#ff922b')
def hl(d,w=3,o=.4):return f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity="{o}" stroke-width="{w}" stroke-linecap="round"/>'
def crack(d,w=5):
    """a glowing crack: orange with a yellow core"""
    return f'<path d="{d}" fill="none" stroke="#ff6b1a" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/><path d="{d}" fill="none" stroke="#ffe066" stroke-width="{w*.4:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
def glow(cx,cy,r,c='#ffa94d'):return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c}" opacity=".22"/><circle cx="{cx}" cy="{cy}" r="{r*.62:.1f}" fill="{c}" opacity=".25"/>'
def puff(cx,cy,r,o=.9):return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#dee2e6" stroke="{O}" stroke-width="2.6" opacity="{o}"/>'
def smoke(x,y,s=1):
    """a little column of grey puffs rising from (x,y)"""
    return (f'<circle cx="{x}" cy="{y-10*s:.1f}" r="{9*s:.1f}" fill="#dee2e6" stroke="{O}" stroke-width="{3.6*s:.1f}"/>'
            f'<circle cx="{x+5*s:.1f}" cy="{y-26*s:.1f}" r="{7.5*s:.1f}" fill="#e9ecef" stroke="{O}" stroke-width="{3.4*s:.1f}"/>'
            f'<circle cx="{x-2*s:.1f}" cy="{y-40*s:.1f}" r="{5.5*s:.1f}" fill="#f1f3f5" stroke="{O}" stroke-width="{3*s:.1f}"/>'
            f'<path d="M{x-5*s:.1f} {y-12*s:.1f} q1 -5 6 -6" stroke="#fff" stroke-width="{3*s:.1f}" fill="none" stroke-linecap="round"/>')

# ---------------- BLOCK ----------------
lavarock=P(1.1,.9,glow(56,60,40)+shadow(55,84,48)+
 f'<path d="M8 84 Q2 60 16 44 Q26 22 50 18 Q76 12 94 32 Q108 52 102 84 Z" fill="url(#c)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 +crack('M50 18 L46 36 L58 48 L52 64 L60 84')+crack('M58 48 L80 44 L94 32',4)+crack('M46 36 L28 46 L22 62',3.6)+
 hl('M16 50 Q24 30 44 24',4,.35),grad('c',*CHAR))

vent=P(1.05,1.25,shadow(52,120,46)+
 f'<path d="M8 120 Q12 92 30 84 Q40 78 52 80 Q66 78 76 84 Q96 92 98 120 Z" fill="url(#c)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<ellipse cx="53" cy="84" rx="18" ry="6" fill="#ff922b" stroke="{O}" stroke-width="3.5"/><ellipse cx="53" cy="85" rx="10" ry="3" fill="#ffe066"/>'
 +crack('M30 100 L40 108 L36 118',3.5)+crack('M76 98 L70 110',3)+hl('M18 104 Q22 92 34 88',3.5,.35)+
 f'<path d="M36 74 q-8 -14 4 -22 q-4 -16 12 -20 q4 -16 20 -10 q14 4 8 18 q12 8 2 20 q-4 8 -16 6 q-8 10 -18 4 q-10 6 -12 4 Z" fill="#dee2e6" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
 f'<circle cx="38" cy="18" r="9" fill="#e9ecef" stroke="{O}" stroke-width="3"/><circle cx="62" cy="10" r="6" fill="#f1f3f5" stroke="{O}" stroke-width="2.6"/>'
 +hl('M44 50 q2 -10 12 -12',3,.8)+hl('M60 28 q6 -6 14 -2',3,.8),grad('c',*CHAR))

spikes=P(1,1.3,shadow(50,124,44)+
 ''.join(f'<path d="{d}" fill="url(#o)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>' for d in (
 'M62 124 L70 50 L92 124 Z','M8 124 L22 70 L40 124 Z','M28 124 L46 8 L66 124 Z'))+
 f'<path d="M46 8 L50 124 M70 50 L76 124 M22 70 L28 124" stroke="#8c7ab8" stroke-width="2" opacity=".6"/>'
 +hl('M44 24 L36 110',3.5,.55)+hl('M69 64 L66 112',3,.5)+hl('M21 84 L16 116',3,.5)+
 f'<path d="M4 124 q4 -8 12 -8 q6 0 8 8 Z M80 124 q4 -10 12 -8 q6 2 6 8 Z" fill="#3a3b42" stroke="{O}" stroke-width="3" stroke-linejoin="round"/>',
 grad('o',*OBS))

tree=P(1,1.35,shadow(50,130,32)+
 f'<path d="M40 130 Q44 104 42 84 Q30 70 14 58 L10 44 M42 84 Q48 64 44 40 L34 18 M44 40 Q58 30 66 12 M46 66 Q64 58 80 42 L90 40 M80 42 L84 26"'
 f' fill="none" stroke="{O}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>'
 f'<path d="M40 130 Q44 104 42 84 Q30 70 14 58 L10 44 M42 84 Q48 64 44 40 L34 18 M44 40 Q58 30 66 12 M46 66 Q64 58 80 42 L90 40 M80 42 L84 26"'
 f' fill="none" stroke="#4a3b33" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
 f'<path d="M34 130 Q42 110 40 96 L52 96 Q52 112 60 130 Z" fill="#4a3b33" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 +crack('M46 104 L48 116 L44 124',3)+hl('M40 112 Q40 100 41 90',2.5,.3)+
 f'<path d="M24 130 q4 -8 12 -6 M58 130 q6 -8 14 -4" stroke="{O}" stroke-width="5" fill="none" stroke-linecap="round"/>'
 f'<circle cx="66" cy="12" r="3" fill="#ff922b"/><circle cx="10" cy="44" r="2.6" fill="#ff922b"/>')

pool=P(1.15,.8,glow(57,48,44)+shadow(57,74,52)+
 f'<path d="M12 50 Q10 30 34 26 Q58 18 84 26 Q106 32 104 50 Q104 68 80 70 Q56 74 32 70 Q12 66 12 50 Z" fill="url(#l)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<path d="M30 42 q10 -6 20 0 M62 54 q10 -6 22 0" stroke="#fff3bf" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
 f'<circle cx="74" cy="38" r="5" fill="#ffd43b" stroke="#e8590c" stroke-width="2"/><circle cx="44" cy="58" r="3.5" fill="#ffd43b" stroke="#e8590c" stroke-width="2"/>'
 +''.join(f'<path d="M{x-w} {y+4} q0 -{w*1.3:.0f} {w} -{w*1.3:.0f} q{w} 0 {w} {w*1.3:.0f} Z" fill="url(#c)" stroke="{O}" stroke-width="3.2" stroke-linejoin="round"/>'
          for x,y,w in ((14,58,9),(26,70,10),(48,76,9),(70,76,11),(92,70,10),(104,56,8),(98,34,8),(18,36,8),(40,28,6)))+
 hl('M20 62 q2 -4 6 -5',2,.35)+hl('M64 70 q2 -5 6 -6',2,.35),grad('l','#ffd43b','#e03131','#ff6b1a')+grad('c',*CHAR))

egg=P(.95,1.15,shadow(48,110,40)+
 f'<path d="M48 8 Q80 14 82 64 Q82 98 48 100 Q14 98 14 64 Q16 14 48 8 Z" fill="url(#e)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
 f'<g fill="#ffd43b" stroke="{O}" stroke-width="2"><circle cx="34" cy="36" r="4.5"/><circle cx="62" cy="32" r="5"/><circle cx="28" cy="68" r="5.5"/><circle cx="64" cy="64" r="6"/><circle cx="46" cy="84" r="4.5"/><circle cx="48" cy="52" r="4"/></g>'
 +hl('M28 34 Q34 20 46 16',4.5,.55)+
 f'<path d="M6 110 q0 -14 12 -16 q10 -2 14 8 q8 -8 18 -4 q12 -8 22 0 q10 -2 14 8 q4 4 2 4 Z" fill="url(#c)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 +crack('M32 102 l6 6',3)+crack('M70 100 l-4 8',3)+hl('M12 102 q4 -6 10 -6',2.5,.35),
 grad('e','#8ce99a','#2b8a3e','#40c057')+grad('c',*CHAR))

BLOCK=[('volcano_lavarock',lavarock,1.1,.9),('volcano_vent',vent,1.05,1.25),('volcano_spikes',spikes,1,1.3),
 ('volcano_tree',tree,1,1.35),('volcano_pool',pool,1.15,.8),('volcano_egg',egg,.95,1.15)]

# ---------------- DECO ----------------
embers=P(.55,.4,glow(27,26,20)+shadow(27,36,22)+
 ''.join(f'<path d="M{x-r} {y} q0 -{r*1.4:.1f} {r} -{r*1.4:.1f} q{r} 0 {r} {r*1.4:.1f} Z" fill="#2b2b30" stroke="{O}" stroke-width="2.4" stroke-linejoin="round"/>'+crack(f'M{x-r*.5:.1f} {y-r*.5:.1f} l{r*.5:.1f} {r*.3:.1f} l{r*.4:.1f} -{r*.4:.1f}',2.6) for x,y,r in ((16,36,10),(38,36,10),(27,30,9)))+
 f'<circle cx="18" cy="10" r="2.2" fill="#ffd43b"/><circle cx="34" cy="6" r="1.8" fill="#ff922b"/><circle cx="28" cy="14" r="1.5" fill="#ffd43b"/>')

def fflower(x,y,s):
    pts=' '.join(f'{x+dx*s:.1f},{y+dy*s:.1f}' for dx,dy in ((0,-10),(3,-4),(9,-6),(5,0),(9,6),(0,3),(-9,6),(-5,0),(-9,-6),(-3,-4)))
    return f'<polygon points="{pts}" fill="#ff6b1a" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="{x}" cy="{y-1*s}" r="{3*s:.1f}" fill="#ffe066"/>'
fireflower=P(.5,.55,shadow(25,52,18)+
 f'<path d="M16 52 q0 -14 -2 -26 M34 52 q2 -10 4 -18 M25 52 v-10" stroke="#2b2b30" stroke-width="3" fill="none" stroke-linecap="round"/>'
 f'<path d="M20 44 q-8 -2 -10 -8 q8 0 10 6 M30 46 q8 -4 10 -10 q-8 2 -10 8" fill="#495057" stroke="{O}" stroke-width="1.8"/>'
 +fflower(14,22,1.2)+fflower(38,30,1)+fflower(25,40,.8))

smallvent=P(.5,.55,shadow(25,52,20)+
 f'<path d="M6 52 q2 -12 12 -14 q7 -2 14 0 q12 2 12 14 Z" fill="url(#c)" stroke="{O}" stroke-width="2.8" stroke-linejoin="round"/>'
 f'<ellipse cx="25" cy="39" rx="7" ry="2.6" fill="#ff922b" stroke="{O}" stroke-width="2"/>'
 +smoke(25,40,.75)+hl('M12 48 q2 -5 6 -6',2,.35),grad('c',*CHAR))

blobs=P(.55,.4,shadow(27,36,24)+
 f'<path d="M4 36 q0 -12 10 -12 q4 -8 12 -4 q10 -2 10 8 q4 2 4 8 Z" fill="url(#c)" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/>'
 f'<path d="M36 36 q0 -10 8 -10 q8 0 8 10 Z" fill="url(#c)" stroke="{O}" stroke-width="2.6" stroke-linejoin="round"/>'
 f'<path d="M12 30 q6 -3 10 1 q5 -4 10 0 M40 32 q4 -3 8 0" stroke="#ff922b" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>'
 +hl('M10 28 q2 -3 5 -3',1.8,.4),grad('c','#5c4d55','#1e1f24','#35303a'))

DECO=[('volcano_embers',embers,.55,.4),('volcano_fireflower',fireflower,.5,.55),('volcano_smallvent',smallvent,.5,.55),('volcano_blobs',blobs,.55,.4)]

# ---------------- EXTRA ----------------
ash=P(.4,.3,f'<path d="M3 28 q1 -8 7 -8 q6 0 7 8 Z M19 28 q2 -11 9 -11 q8 0 9 11 Z M14 29 q1 -4 4 -4 q3 0 4 4 Z" fill="#3a3b42" stroke="{O}" stroke-width="2" stroke-linejoin="round"/>'
 f'<path d="M23 21 q3 -2 5 -2" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>')
sparks=P(.4,.3,''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ff922b" stroke="#c2410c" stroke-width="1"/><circle cx="{x}" cy="{y}" r="{r*.45:.1f}" fill="#fff3bf"/>' for x,y,r in ((10,24,3.2),(22,14,2.4),(30,26,2.8),(34,10,1.8))))
EXTRA=[('volcano_ash',ash,.4,.3),('volcano_sparks',sparks,.4,.3)]
