#!/usr/bin/env python3
"""Show what a family's online save holds: each player's progress, recent screens and problems.

  /usr/bin/python3 peek.py FAMILY-CODE

Read-only. The family code is the family's key, so pass it on the command line and never save it in a file.
"""
import datetime, json, os, re, sys, urllib.request

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    here = os.path.dirname(os.path.abspath(__file__))
    fb = re.search(r"const FB=\{[^}]*\}", open(os.path.join(here, "..", "lq-core.js"), encoding="utf-8").read()).group(0)
    project, key = re.search(r'project:"([^"]+)"', fb).group(1), re.search(r'key:"([^"]+)"', fb).group(1)
    req = urllib.request.Request("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + key,
                                 data=b'{"returnSecureToken":true}', headers={"Content-Type": "application/json"})
    token = json.load(urllib.request.urlopen(req, timeout=20))["idToken"]
    doc_id = "lq_" + re.sub("[^a-z0-9]", "", sys.argv[1].lower())
    url = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/families/%s" % (project, doc_id)
    doc = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Bearer " + token}), timeout=20))
    data = json.loads(doc["fields"]["data"]["stringValue"])
    when = lambda t: datetime.datetime.fromtimestamp(t / 1000).strftime("%b %d %H:%M") if t else "-"
    print("saved", when(int(doc["fields"]["updated"]["integerValue"])), "| players:", len(data["players"]))
    for p in data["players"]:
        st = p.get("stats", {})
        tally = lambda k: "%d right, %d wrong" % (sum(e.get("r", 0) for e in st.get(k, {}).values()), sum(e.get("w", 0) for e in st.get(k, {}).values()))
        print("\n== %s | coins %s | last played %s | days %d" % (p["name"], p.get("coins"), when(p.get("last")), len(p.get("days", {}))))
        print("  letters caught:", "".join(p.get("letters", {})) or "-", "| camps:", p.get("camps") or {}, "| traced:", "".join(p.get("trace") or {}) or "-")
        print("  Sound Falls:", p.get("falls") or {}, "| Souq:", p.get("souq") or {}, "| friends:", len(p.get("friends") or {}), "| sayings:", len((p.get("well") or {}).get("got") or {}))
        print("  wearing:", p.get("wear") or {}, "| owns:", list(p.get("own") or {}))
        print("  letters:", tally("letters"), "| marks:", tally("marks"), "| words:", tally("words"))
        for e in (st.get("recent") or [])[:8]:
            print("   miss  %s  %-8s wanted %s, picked %s" % (when(e.get("t")), e.get("z"), e.get("a"), e.get("b")))
        for e in (p.get("trail") or [])[-15:]:
            print("   went  %s  %-8s %s  (%s)" % (when(e.get("t")), e.get("z"), e.get("s"), e.get("v")))
        for e in p.get("reports") or []:
            print("   REPORT %s  %s on \"%s\" (%s): %s" % (when(e.get("t")), "idea" if e.get("k") == "idea" else "problem", e.get("s") or e.get("z"), e.get("v"), e.get("m")))
        for e in p.get("errs") or []:
            print("   PROBLEM %s  %-8s on \"%s\": %s %s (%s)" % (when(e.get("t")), e.get("z"), e.get("s"), e.get("m"), e.get("at"), e.get("v")))

if __name__ == "__main__":
    main()
