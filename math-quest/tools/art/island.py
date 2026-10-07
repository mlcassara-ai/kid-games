# -*- coding: utf-8 -*-
from kit import *
import math
# Shape Island (geometry) on sandy ground ringed by water: a gate built from toy-block shapes, bright flat colours,
# a palm tree, and small beach things (shells, a starfish, shape pebbles) as scenery.
GROUND['island']=('#f3e3b4','#ecdaa6')
def star(cx,cy,r,col,sw=2.5,rot=-90):
    p=[]
    for i in range(10):
        a=math.radians(rot+i*36);rr=r if i%2==0 else r*.45
        p.append(f'{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}')
    return f'<polygon points="{" ".join(p)}" fill="{col}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
def cube(x,y,s,front,top,side,sw=4):
    """a block whose front face has its bottom-left corner at (x,y)"""
    d=s*.32
    return (f'<path d="M{x} {y-s} L{x+d} {y-s-d*.8} L{x+s+d} {y-s-d*.8} L{x+s} {y-s} Z" fill="{top}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
            f'<path d="M{x+s} {y} L{x+s} {y-s} L{x+s+d} {y-s-d*.8} L{x+s+d} {y-d*.8} Z" fill="{side}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
            f'<rect x="{x}" y="{y-s}" width="{s}" height="{s}" fill="{front}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>')
def cyl(cx,y,w,h,body,top,sw=4):
    rx=w/2;ry=w*.16
    return (f'<path d="M{cx-rx} {y-h} V{y} A{rx} {ry} 0 0 0 {cx+rx} {y} V{y-h}" fill="{body}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
            f'<ellipse cx="{cx}" cy="{y-h}" rx="{rx}" ry="{ry}" fill="{top}" stroke="{O}" stroke-width="{sw}"/>'
            f'<path d="M{cx-rx*.62} {y-h+ry+3} V{y-3}" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>')
def pyr(cx,y,w,h,col,dark,sw=4):
    return (f'<path d="M{cx-w/2} {y} L{cx} {y-h} L{cx+w/2} {y} Z" fill="{col}" stroke="{O}" stroke-width="{sw}" stroke-linejoin="round"/>'
            f'<path d="M{cx} {y-h} L{cx+w/2} {y} L{cx+w*.12} {y} Z" fill="{dark}" stroke="{O}" stroke-width="{sw*.6}" stroke-linejoin="round"/>')
def ball(cx,cy,r,col,sw=4):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{col}" stroke="{O}" stroke-width="{sw}"/>'
            f'<ellipse cx="{cx-r*.35:.1f}" cy="{cy-r*.38:.1f}" rx="{r*.3:.1f}" ry="{r*.2:.1f}" fill="#fff" opacity=".55"/>')
def palm(x,y,h,lean=1,sw=4):
    tx=x+lean*h*.22;ty=y-h
    out=(f'<path d="M{x} {y} Q{x+lean*h*.02:.1f} {y-h*.55:.1f} {tx:.1f} {ty:.1f}" stroke="{O}" stroke-width="{sw+9}" fill="none" stroke-linecap="round"/>'
         f'<path d="M{x} {y} Q{x+lean*h*.02:.1f} {y-h*.55:.1f} {tx:.1f} {ty:.1f}" stroke="#c08a52" stroke-width="9" fill="none" stroke-linecap="round"/>')
    for k in range(1,5):
        t=k/5;px=(1-t)**2*x+2*(1-t)*t*(x+lean*h*.02)+t*t*tx;py=(1-t)**2*y+2*(1-t)*t*(y-h*.55)+t*t*ty
        out+=f'<path d="M{px-5:.1f} {py+2:.1f} q5 -4 10 0" stroke="#8a5a2b" stroke-width="2.2" fill="none"/>'
    for dx,dy in ((-1,.15),(-.75,-.45),(-.1,-.7),(.6,-.5),(1,.12),(.45,.5),(-.5,.5)):
        ex=tx+dx*h*.38;ey=ty+dy*h*.34;mx=(tx+ex)/2;my=min(ty,ey)-h*.16
        leaf=f'M{tx:.1f} {ty:.1f} Q{mx:.1f} {my:.1f} {ex:.1f} {ey:.1f}'
        out+=f'<path d="{leaf}" stroke="{O}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="{leaf}" stroke="#40c057" stroke-width="9" fill="none" stroke-linecap="round"/>'
    out+=f'<circle cx="{tx-5:.1f}" cy="{ty+6:.1f}" r="6" fill="#8a5a2b" stroke="{O}" stroke-width="2.5"/><circle cx="{tx+6:.1f}" cy="{ty+7:.1f}" r="6" fill="#8a5a2b" stroke="{O}" stroke-width="2.5"/>'
    return out
def shell(cx,cy,s,col='#ffc9c9',dark='#e03131'):
    return (f'<path d="M{cx} {cy} L{cx-9*s:.1f} {cy-8*s:.1f} Q{cx-8*s:.1f} {cy-16*s:.1f} {cx} {cy-16*s:.1f} Q{cx+8*s:.1f} {cy-16*s:.1f} {cx+9*s:.1f} {cy-8*s:.1f} Z" fill="{col}" stroke="{O}" stroke-width="{2.2*s:.1f}" stroke-linejoin="round"/>'
            f'<path d="M{cx} {cy} L{cx-5*s:.1f} {cy-14*s:.1f} M{cx} {cy} V{cy-16*s:.1f} M{cx} {cy} L{cx+5*s:.1f} {cy-14*s:.1f}" stroke="{dark}" stroke-width="{1.4*s:.1f}" opacity=".8"/>')

# ---------------- entrance: a gate of toy-block shapes on a little beach ----------------
_ed=grad('sd','#fbeec4','#e3c27a','#f3dca0',0,1)+grad('sea','#74d0ee','#2a8fc1',None,0,1)
_arch=''
# the arch: a ring of wedge stones in bright shape colours
cols=['#ff6b6b','#ffd43b','#4dabf7','#51cf66','#b197fc','#ff922b','#20c997']
cx,cy,R1,R2=120,112,58,36
n=7
for i in range(n):
    a0=math.radians(180+i*180/n);a1=math.radians(180+(i+1)*180/n)
    p=[(cx+R1*math.cos(a0),cy+R1*math.sin(a0)),(cx+R1*math.cos(a1),cy+R1*math.sin(a1)),(cx+R2*math.cos(a1),cy+R2*math.sin(a1)),(cx+R2*math.cos(a0),cy+R2*math.sin(a0))]
    _arch+=f'<path d="M{p[0][0]:.1f} {p[0][1]:.1f} A{R1} {R1} 0 0 1 {p[1][0]:.1f} {p[1][1]:.1f} L{p[2][0]:.1f} {p[2][1]:.1f} A{R2} {R2} 0 0 0 {p[3][0]:.1f} {p[3][1]:.1f} Z" fill="{cols[i]}" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
_mini=(f'<rect x="-10.5" y="-1" width="9" height="9" fill="#4dabf7" stroke="{O}" stroke-width="1.8"/>'
       f'<path d="M3 8 L8 -1 L13 8 Z" fill="#ff6b6b" stroke="{O}" stroke-width="1.8" stroke-linejoin="round"/>'
       f'<circle cx="1" cy="-7.5" r="5" fill="#ffd43b" stroke="{O}" stroke-width="1.8"/>')
_e=(shadow(120,190,106)
 # water lapping round the beach
 +f'<path d="M2 184 Q30 170 60 176 L180 176 Q212 170 238 184 Q238 198 200 198 L40 198 Q2 198 2 184 Z" fill="url(#sea)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
 +f'<path d="M14 188 q8 -5 16 0 M210 188 q8 -5 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>'
 # the sand
 +f'<path d="M22 188 Q26 166 62 162 Q120 154 178 162 Q214 166 218 188 Q120 198 22 188 Z" fill="url(#sd)" stroke="{O}" stroke-width="4" stroke-linejoin="round"/>'
 # a palm tree behind the right pillar
 +palm(186,176,112,1)
 # the door between the pillars, darker and darker like a sea cave
 +doorway(84,156,186,74,('#3c8fb6','#2c7299','#1f5878','#143f58','#0b283a'))
 +_arch
 # left pillar: a blue cube, a red cylinder, a yellow pyramid
 +cube(50,186,36,'#4dabf7','#a5d8ff','#1c7ed6')
 +cyl(68,150,34,30,'#ff6b6b','#ffa8a8')
 +pyr(68,120,38,34,'#ffd43b','#f59f00')
 # right pillar: a purple cube, an orange cylinder, a green ball
 +cube(154,186,36,'#b197fc','#e5dbff','#7950f2')
 +cyl(172,150,34,30,'#ff922b','#ffc078')
 +ball(172,104,15,'#51cf66')
 # the plaque with a square, a triangle and a circle
 +plaque(120,78,19,_mini)
 # beach things
 +star(36,182,8,'#ff922b')+shell(214,186,.75)+shell(100,192,.6,'#fff3bf','#f08c00')
)
ENTRANCE=svg('0 0 240 200',_e,_ed)

# ---------------- BLOCK (big pieces; Shape Island itself keeps them away from its entrance) ----------------
def b_palm():return svg('0 0 100 135',shadow(44,131,26)+palm(40,130,96,1))
def b_pyramid():return svg('0 0 100 90',shadow(50,86,44)+pyr(50,86,84,72,'#ffd43b','#f59f00'))
def b_blocks():return svg('0 0 100 100',shadow(50,96,44)+cube(10,96,40,'#4dabf7','#a5d8ff','#1c7ed6')+cyl(72,96,32,34,'#ff6b6b','#ffa8a8')+ball(36,40,15,'#51cf66'))
# ---------------- DECO (small, do not block) ----------------
def d_star():return svg('0 0 50 50',shadow(25,44,18)+star(25,26,19,'#ff922b',2.6,-80)+'<circle cx="25" cy="26" r="2.4" fill="#fff3bf"/>')
def d_shell():return svg('0 0 50 46',shadow(25,42,18)+shell(25,40,1.9))
def d_cube():return svg('0 0 50 50',shadow(24,46,20)+cube(9,46,26,'#4dabf7','#a5d8ff','#1c7ed6',3))
def d_cone():return svg('0 0 50 50',shadow(25,46,20)+pyr(25,46,36,38,'#b197fc','#7950f2',3))
def d_ball():return svg('0 0 50 50',shadow(25,46,16)+ball(25,32,13,'#ff6b6b',3))
# ---------------- EXTRA (tiny bits on open sand) ----------------
def e_pebbles():return svg('0 0 40 30',f'<ellipse cx="10" cy="20" rx="6" ry="4" fill="#ced4da" stroke="{O}" stroke-width="1.6"/><ellipse cx="26" cy="22" rx="5" ry="3.4" fill="#e9ecef" stroke="{O}" stroke-width="1.6"/><ellipse cx="19" cy="12" rx="4" ry="2.8" fill="#adb5bd" stroke="{O}" stroke-width="1.6"/>')
def e_tinyshapes():return svg('0 0 40 30',f'<rect x="4" y="14" width="8" height="8" fill="#4dabf7" stroke="{O}" stroke-width="1.6"/><path d="M18 22 L23 13 L28 22 Z" fill="#ff6b6b" stroke="{O}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="34" cy="17" r="4" fill="#ffd43b" stroke="{O}" stroke-width="1.6"/>')
def e_shells():return svg('0 0 40 30',shell(12,24,.7)+shell(28,22,.6,'#fff3bf','#f08c00'))
BLOCK=[('island_palm',b_palm(),.9,1.25),('island_pyramid',b_pyramid(),.95,.85),('island_blocks',b_blocks(),.95,.95)]
DECO=[('island_star',d_star(),.5,.5),('island_shell',d_shell(),.5,.46),('island_cube',d_cube(),.5,.5),('island_cone',d_cone(),.5,.5),('island_ball',d_ball(),.46,.46)]
EXTRA=[('island_pebbles',e_pebbles(),.4,.3),('island_tinyshapes',e_tinyshapes(),.4,.3),('island_shells',e_shells(),.4,.3)]
