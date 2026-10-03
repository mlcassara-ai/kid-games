#!/usr/bin/env python3
"""Show what a Math Quest family's online save holds: each hero's level, coins, Battle Pets play and the 🐞 reports.

  /usr/bin/python3 math-quest/tools/peek.py FAMILY-CODE

Read-only. The family code is the family's key, so pass it on the command line and never save it in a file.
"""
import datetime, json, os, re, sys, urllib.request

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    here = os.path.dirname(os.path.abspath(__file__))
    fb = re.search(r"const FB=\{[^}]*\}", open(os.path.join(here, "..", "index.html"), encoding="utf-8").read()).group(0)
    project, key = re.search(r"project:'([^']+)'", fb).group(1), re.search(r"key:'([^']+)'", fb).group(1)
    req = urllib.request.Request("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + key,
                                 data=b'{"returnSecureToken":true}', headers={"Content-Type": "application/json"})
    token = json.load(urllib.request.urlopen(req, timeout=20))["idToken"]
    doc_id = "f_" + re.sub("[^a-z0-9]", "", sys.argv[1].lower())
    url = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/families/%s" % (project, doc_id)
    doc = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Bearer " + token}), timeout=20))
    data = json.loads(doc["fields"]["data"]["stringValue"])
    when = lambda t: datetime.datetime.fromtimestamp(t / 1000).strftime("%b %d %H:%M") if t else "-"
    print("heroes:", len(data.get("players", [])))
    for p in data.get("players", []):
        bp = (p.get("bp") or {}).get("m") or []
        print("\n== %s | grade %s | level %s | coins %s | pets %d" % (p.get("name"), p.get("grade"), p.get("level"), p.get("coins"), len(p.get("pets") or [])))
        if bp:
            wins = sum(1 for m in bp if m[2])
            print("  Battle Pets: %d matches, %d won, crowns %s" % (len(bp), wins, (p.get("bp2") or {}).get("c")))
        for r in p.get("reports") or []:
            print("   REPORT %s  %s on \"%s\" (%s): %s" % (when(r.get("t")), "idea" if r.get("k") == "idea" else "problem", r.get("s"), r.get("v"), r.get("m")))

if __name__ == "__main__":
    main()
