"""Graph Garden, closed (owner, Oct 2026): the entrance after a cartoon explosion. A scorched crater, the hedge blown into two charred
   halves, the arbor snapped, planks and pickets scattered, smoke rising, caution tape and a wooden CLOSED sign. Same outline style."""
from kit import *

_d=(grad('hgc','#8fb06a','#3d5a2c','#5f7f45',1,1)+grad('wdc','#a8774a','#5e3c1f')+grad('cr','#4a3a2c','#1e1712')
    +'<radialGradient id="sm"><stop offset="0" stop-color="#f1f0ee"/><stop offset="1" stop-color="#b9b6b1"/></radialGradient>')
b=shadow(120,190,108)
# scorched crater
b+=f'<ellipse cx="120" cy="184" rx="78" ry="14" fill="url(#cr)" stroke="{O}" stroke-width="3"/>'
b+=f'<ellipse cx="120" cy="181" rx="52" ry="8" fill="#120d0a" opacity=".7"/>'
b+=f'<path d="M48 186 l-14 4 M190 186 l16 3 M64 194 l-10 6 M176 194 l12 5" stroke="#2a201a" stroke-width="3" stroke-linecap="round"/>'
# smoke rising behind
for cx,cy,r in ((104,62,22),(128,46,26),(150,66,20),(118,24,18),(140,18,14),(96,36,15)):
    b+=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#sm)" stroke="{O}" stroke-width="3" opacity=".95"/>'
# left half of the hedge, blown back and charred
b+=f'<path d="M30 186 L34 104 Q36 78 60 74 Q70 58 86 64 L92 98 L78 112 L88 128 L74 150 L84 186 Z" fill="url(#hgc)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
b+=f'<path d="M86 64 L92 98 L78 112 L88 128 L74 150 L84 186" stroke="#2b2118" stroke-width="7" fill="none" stroke-linejoin="round" opacity=".55"/>'
# right half
b+=f'<path d="M210 186 L208 110 Q206 84 184 78 Q176 62 158 68 L152 100 L166 114 L154 132 L168 152 L158 186 Z" fill="url(#hgc)" stroke="{O}" stroke-width="4.5" stroke-linejoin="round"/>'
b+=f'<path d="M158 68 L152 100 L166 114 L154 132 L168 152 L158 186" stroke="#2b2118" stroke-width="7" fill="none" stroke-linejoin="round" opacity=".55"/>'
# a couple of singed flowers that survived
b+=f'<circle cx="48" cy="96" r="5" fill="#d8a0a0" stroke="{O}" stroke-width="2"/><circle cx="48" cy="96" r="2" fill="#c9a23a"/>'
b+=f'<circle cx="196" cy="120" r="5" fill="#d9c27a" stroke="{O}" stroke-width="2"/><circle cx="196" cy="120" r="2" fill="#8a6a2a"/>'
# snapped arbor posts and the fallen arch
b+=f'<path d="M92 188 L92 150 L96 144 L100 152 L104 146 L104 188 Z" fill="url(#wdc)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
b+=f'<path d="M136 188 L136 160 L140 154 L143 160 L148 152 L148 188 Z" fill="url(#wdc)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round"/>'
b+=f'<path d="M100 176 A34 34 0 0 1 166 168 L156 172 A24 24 0 0 0 110 178 Z" fill="url(#wdc)" stroke="{O}" stroke-width="3.5" stroke-linejoin="round" transform="rotate(14 132 172)"/>'
# scattered planks and pickets
b+=f'<rect x="20" y="170" width="30" height="7" rx="2" fill="#a8774a" stroke="{O}" stroke-width="2.5" transform="rotate(-22 35 173)"/>'
b+=f'<rect x="188" y="176" width="34" height="7" rx="2" fill="#a8774a" stroke="{O}" stroke-width="2.5" transform="rotate(18 205 179)"/>'
b+=f'<path d="M210 162 l6 -14 l6 2 l-6 14 Z M14 150 l4 -14 l5 1 l-4 14 Z" fill="#eee" stroke="{O}" stroke-width="2.2" stroke-linejoin="round"/>'
# the broken plaque with a cracked bar chart, lying on the ground
b+=f'<g transform="rotate(-18 172 182)"><circle cx="172" cy="182" r="11" fill="#d9ccaa" stroke="{O}" stroke-width="3"/><path d="M166 186 v-4 M171 186 v-8 M176 186 v-6" stroke="#6b6b6b" stroke-width="3"/><path d="M164 174 l8 6 l-2 6 l8 4" stroke="{O}" stroke-width="1.6" fill="none"/></g>'
# caution tape across the front
b+=(f'<g transform="rotate(-6 120 150)"><rect x="18" y="143" width="204" height="13" fill="#ffd43b" stroke="{O}" stroke-width="3"/>'
    +''.join(f'<path d="M{x} 156 l9 -13 h7 l-9 13 Z" fill="#2b2b2b"/>' for x in range(22,216,18))+'</g>')
# the CLOSED sign on a post
b+=f'<rect x="114" y="132" width="10" height="56" fill="url(#wdc)" stroke="{O}" stroke-width="3"/>'
b+=f'<rect x="72" y="96" width="94" height="40" rx="6" fill="#f3e3c0" stroke="{O}" stroke-width="4.5" transform="rotate(-4 119 116)"/>'
b+=f'<rect x="78" y="102" width="82" height="28" rx="3" fill="none" stroke="#c8a96a" stroke-width="2" transform="rotate(-4 119 116)"/>'
b+=(f'<text x="119" y="124" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="18" fill="#c92a2a" '
    f'stroke="#7a1414" stroke-width=".8" transform="rotate(-4 119 116)">CLOSED</text>')
b+=f'<circle cx="80" cy="104" r="2.4" fill="{O}" transform="rotate(-4 119 116)"/><circle cx="158" cy="104" r="2.4" fill="{O}" transform="rotate(-4 119 116)"/>'
ENTRANCE=svg('0 0 240 200',b,_d)
