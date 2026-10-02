#!/usr/bin/env python3
"""Bump the Language Quest version everywhere it appears.

  /usr/bin/python3 release.py            next version for today (2026.10.01f -> 2026.10.01g, or <today>a)
  /usr/bin/python3 release.py 2026.10.02a   set an exact version

Updates version.json plus the LQ_VER line and lq-core.js?v= URL in every page that loads lq-core.
"""
import datetime, json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PAGES = ["index.html", "alphabet/index.html", "letters/index.html", "falls/index.html", "souq/index.html", "harbor/index.html", "teacher/index.html"]

def next_version(cur):
    today = datetime.date.today().strftime("%Y.%m.%d")
    if cur.startswith(today):
        tail = cur[len(today):]                 # a, b ... z, then za, zb ... zz (still sorts after the earlier ones)
        if len(tail) == 1:
            return today + (chr(ord(tail) + 1) if tail < "z" else "za")
        if len(tail) == 2 and tail[0] == "z" and tail[1] < "z":
            return today + "z" + chr(ord(tail[1]) + 1)
        sys.exit("can't pick the next version after " + cur + "; pass one explicitly")
    return today + "a"

def main():
    vpath = os.path.join(ROOT, "version.json")
    cur = json.load(open(vpath))["v"]
    new = sys.argv[1] if len(sys.argv) > 1 else next_version(cur)
    if not re.fullmatch(r"\d{4}\.\d{2}\.\d{2}(?:[a-z]|z[a-z])", new):
        sys.exit("version must look like 2026.10.01a (after z comes za, zb...)")
    for page in PAGES:
        path = os.path.join(ROOT, page)
        s = open(path, encoding="utf-8").read()
        s, a = re.subn(r'window\.LQ_VER="[^"]*"', 'window.LQ_VER="%s"' % new, s)
        s, b = re.subn(r'(lq-core\.js)\?v=[^"]*"', r'\1?v=%s"' % new, s)
        if (a, b) != (1, 1):
            sys.exit("%s: expected one LQ_VER and one lq-core.js?v=, found %d and %d" % (page, a, b))
        open(path, "w", encoding="utf-8").write(s)
    open(vpath, "w").write(json.dumps({"v": new}))
    print(cur, "->", new)

if __name__ == "__main__":
    main()
