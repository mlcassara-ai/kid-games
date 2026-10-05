"""Fit art/<zone>.py files into a worktree's math-quest/gateart.js and decor.js.  usage: integrate.py <worktree> zone [zone...]"""
import sys,os,re,importlib
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
root=sys.argv[1];zones=sys.argv[2:]
G=os.path.join(root,'math-quest/gateart.js');D=os.path.join(root,'math-quest/decor.js')
g=open(G).read();d=open(D).read()
def clean(s):
    s=re.sub(r'\s*\n\s*',' ',s.strip())
    assert '`' not in s and '${' not in s and '<script' not in s.lower() and 'href=' not in s,'unsafe svg'
    assert s.startswith('<svg') and s.endswith('</svg>')
    return s
for z in zones:
    m=importlib.import_module(z)
    if getattr(m,'ENTRANCE',None):
        e=clean(m.ENTRANCE)
        g=re.sub(r"\n "+z+r":\{w:2\.6,ar:200/240,svg:`[^`]*`\},",'',g)  # replace an older one
        g=g.replace(" caves:{w:2.6,ar:200/240,svg:`"," "+z+":{w:2.6,ar:200/240,svg:`"+e+"`},\n caves:{w:2.6,ar:200/240,svg:`",1) if z!='caves' else g
    groups={}
    for grp in ('BLOCK','DECO','EXTRA'):
        items=getattr(m,grp,[])
        groups[grp]=[k for k,_,_,_ in items]
        for k,s,w,h in items:
            assert re.match(r'^[a-z][a-z0-9_]*$',k),k
            d=re.sub(r"(?<=[{,])"+k+r":`[^`]*`,",'',d);d=re.sub(r"(?<=[{,])"+k+r":\[[0-9.]+,[0-9.]+\],",'',d)
            d=d.replace("const ART={","const ART={"+k+":`"+clean(s)+"`,",1)
            d=d.replace("const SZ={",f"const SZ={{{k}:[{w},{h}],",1)
    if groups['BLOCK'] or groups['DECO']:
        entry=f"{z}:{{block:{groups['BLOCK']!r},deco:{groups['DECO']!r},extra:{groups['EXTRA']!r}}}".replace("'","'")
        d=re.sub(r"(?<=[{,])"+z+r":\{block:\[[^\]]*\],deco:\[[^\]]*\],extra:\[[^\]]*\]\},",'',d)
        d=d.replace("const SET={","const SET={"+entry+",",1)
open(G,'w').write(g);open(D,'w').write(d)
print('integrated',zones)
