"""Math Quest map art kit (Oct 2026). One file per area: art/<zone>.py defining
   ENTRANCE = an SVG string, viewBox "0 0 240 200" (drawn 2.6 tiles wide on the map, bottom on the gate tile), or None to keep the current one
   BLOCK = [(key, svg, w, h), ...]  big scenery that blocks walking (trees, rocks, stalls...), >= 3 kinds; w,h in tiles, about 0.7-1.15 x 0.6-1.4
   DECO  = [(key, svg, w, h), ...]  small ground pieces that do not block (plants, shells...), >= 3 kinds; about 0.4-0.6 tiles
   EXTRA = [(key, svg, w, h), ...]  tiny bits scattered on open ground (tufts, pebbles...), >= 2 kinds; about 0.4 x 0.3 tiles
   Keys must be unique across all areas: prefix them with the zone id (e.g. reef_coral).
   Each svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="...">...</svg>', no width/height, no text that needs a font except simple
   symbols (use font-family="Fredoka, sans-serif" if you must), no external images, no scripts, gradient ids unique inside that svg.
   Preview: python3 kit.py <zone>  -> art/<zone>.png (look at it!).
"""
import sys,os,importlib,subprocess,base64,json
O='#3b2a1e'  # the outline colour everything uses
GROUND={'village':('#a4d86e','#9ccf66'),'forest':('#5fae4b','#58a545'),'caves':('#8f93a6','#878b9e'),'castle':('#a296bd','#9a8eb5'),'tower':('#5f4fa6','#58489e'),
 'volcano':('#a45a42','#9a523b'),'farm':('#bddc6e','#b4d466'),'market':('#e6c48f','#dfbd87'),'temple':('#f0d49c','#e9cd94'),'vault':('#bfe4f5','#b4dbee'),
 'mesa':('#e0a070','#d89868'),'summit':('#eef4fb','#e4ecf6'),'garden':('#b8e39a','#afdb90'),'reef':('#9fe0e8','#94d6df'),'station':('#d8c9a8','#d0c1a0'),
 'fair':('#d3f9d8','#c3f0cc'),'haunt':('#5a4a7e','#524373')}
def shadow(cx,cy,rx):return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{rx*.18:.1f}" fill="rgba(0,0,0,.22)"/>'
def grad(id,a,b,c=None,x2=1,y2=1):
    return f'<linearGradient id="{id}" x1="0" y1="0" x2="{x2}" y2="{y2}"><stop offset="0" stop-color="{a}"/>'+(f'<stop offset=".55" stop-color="{c}"/>' if c else '')+f'<stop offset="1" stop-color="{b}"/></linearGradient>'
def doorway(x0,x1,ybot,ytop,cols=('#5b5f6b','#41444e','#2e3038','#1e1f25','#111216')):
    """an arched doorway whose inside is darker and darker bands (the house style for every entrance)"""
    out=[];w=x1-x0;n=len(cols)
    for i,c in enumerate(cols):
        inset=i*w*.5/(n+.6);a=x0+inset;b=x1-inset;rx=(b-a)/2;top=ytop+i*w*.5/(n+.6)
        out.append(f'<path d="M{a:.1f} {ybot} L{a:.1f} {top+rx:.1f} A{rx:.1f} {rx:.1f} 0 0 1 {b:.1f} {top+rx:.1f} L{b:.1f} {ybot} Z" fill="{c}"/>')
    return ''.join(out)
def plaque(cx,cy,r,inner):
    """the round cream sign over every entrance; inner = svg drawn centred on (0,0) at about +-r*.6"""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#efe3c2" stroke="{O}" stroke-width="3.5"/><g transform="translate({cx} {cy})">{inner}</g>'
def svg(vb,body,defs=''):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'+(f'<defs>{defs}</defs>' if defs else '')+body+'</svg>'
def b64(s):return 'data:image/svg+xml;base64,'+base64.b64encode(s.encode()).decode()
def preview(zone):
    sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));m=importlib.import_module(zone)
    g1,g2=GROUND.get(zone,('#a4d86e','#9ccf66'));ts=58
    items=[]
    if getattr(m,'ENTRANCE',None):items.append(('ENTRANCE',m.ENTRANCE,2.6,2.6*200/240))
    for grp in ('BLOCK','DECO','EXTRA'):
        for k,s,w,h in getattr(m,grp,[]):items.append((k,s,w,h))
    big=''.join(f'<div class="c"><div class="a" style="width:{w*110}px;height:{h*110}px;background-image:url({b64(s)})"></div><b>{k}</b></div>' for k,s,w,h in items)
    # a little map patch at real size: 12x6 tiles of checker ground, the entrance in the middle, scenery scattered on a grid
    tiles=''.join(f'<div style="left:{x*ts}px;top:{y*ts}px;width:{ts}px;height:{ts}px;background:{g1 if (x*7+y*3)%5 else g2}"></div>' for y in range(6) for x in range(12))
    sp=[];slots=[(1,1),(3,4),(9,1),(10,4),(2,3),(8,3),(0,5),(11,2),(4,1),(7,5),(5,5),(6,0)];i=0
    for k,s,w,h in items[1:] if items and items[0][0]=='ENTRANCE' else items:
        if i>=len(slots):break
        x,y=slots[i];i+=1;sp.append(f'<div class="a" style="left:{x*ts+ts/2-w*ts/2}px;top:{y*ts+ts*.98-h*ts}px;width:{w*ts}px;height:{h*ts}px;background-image:url({b64(s)})"></div>')
    if items and items[0][0]=='ENTRANCE':
        w,h=items[0][2],items[0][3];sp.append(f'<div class="a" style="left:{6*ts-w*ts/2}px;top:{3*ts+ts*1.02-h*ts}px;width:{w*ts}px;height:{h*ts}px;background-image:url({b64(items[0][1])})"></div>')
    html=f'''<!doctype html><meta charset="utf-8"><style>body{{margin:0;font-family:sans-serif;background:{g1};}}.c{{display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-end;width:300px;height:330px;margin:6px;vertical-align:bottom}}
.a{{background-size:100% 100%;background-repeat:no-repeat}}.map{{position:relative;width:{12*ts}px;height:{6*ts}px;margin:10px;outline:3px solid #333}}.map div{{position:absolute}}b{{background:#fff;padding:2px 6px;border-radius:6px}}</style>
<div>{big}</div><div class="map">{tiles}{''.join(sp)}</div>'''
    out=os.path.join(os.path.dirname(os.path.abspath(__file__)),zone)
    open(out+'.html','w').write(html)
    chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    subprocess.run([chrome,'--headless=new','--disable-gpu','--hide-scrollbars',f'--screenshot={out}.png','--window-size=1300,1150','file://'+out+'.html'],capture_output=True,timeout=60)
    print('wrote',out+'.png')
if __name__=='__main__':preview(sys.argv[1])
