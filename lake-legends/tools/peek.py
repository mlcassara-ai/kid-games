#!/usr/bin/env python3
"""Show what a Lake Legends family save holds: each player's progress, reports and problems.

  /usr/bin/python3 peek.py FAMILY-CODE

Read-only. The family code is the family's key, so pass it on the command line and never save it in a file.
"""
import datetime, json, os, re, sys, urllib.error, urllib.request

OCEAN = {"sardine","topsmelt","mackerel","croaker","opaleye","sandbass","kelpbass","halibut","bonito","leopard","batray","guitarfish","yellowtail","wsb"}

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    here = os.path.dirname(os.path.abspath(__file__))
    fb = re.search(r"const FB=\{[^}]*\}", open(os.path.join(here, "..", "ll-core.js"), encoding="utf-8").read()).group(0)
    project, key = re.search(r'project:"([^"]+)"', fb).group(1), re.search(r'key:"([^"]+)"', fb).group(1)
    req = urllib.request.Request("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + key,
                                 data=b'{"returnSecureToken":true}', headers={"Content-Type": "application/json"})
    token = json.load(urllib.request.urlopen(req, timeout=20))["idToken"]
    doc_id = "ll_" + re.sub("[^a-z0-9]", "", sys.argv[1].lower())
    url = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/families/%s" % (project, doc_id)
    try:
        doc = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Bearer " + token}), timeout=20))
    except urllib.error.HTTPError as e:
        if e.code in (403, 404):
            sys.exit("No Lake Legends save found for that code. Use the family's real code (the one in the Parent Corner), not the words FAMILY-CODE.")
        raise
    data = json.loads(doc["fields"]["data"]["stringValue"])
    when = lambda t: datetime.datetime.fromtimestamp(t / 1000).strftime("%b %d %H:%M") if t else "-"
    print("saved", when(int(doc["fields"]["updated"]["integerValue"])), "| players:", len(data["players"]))
    for p in data["players"]:
        g = p.get("game") or {}
        print("\n== %s | coins %s | last played %s | days %d" % (p["name"], g.get("coins"), when(p.get("last")), len(p.get("days", {}))))
        print("  gear:", g.get("up"), "| boat:", g.get("boatOwn"), "| salt rod:", bool(g.get("saltRod")), "| ocean fish:", len([k for k in (g.get("dex") or {}) if k in OCEAN]))
        print("  Fishdex:", len(g.get("dex") or {}), "| landed:", g.get("landed"), "| lakes:", ",".join(g.get("lakes") or []),
              "| bosses:", ",".join(g.get("bosses") or {}), "| legends:", ",".join(g.get("legends") or {}))
        for e in p.get("reports") or []:
            print('   REPORT %s  %s on "%s" (%s): %s' % (when(e.get("t")), "idea" if e.get("k") == "idea" else "problem", e.get("s"), e.get("v"), e.get("m")))
        for e in p.get("errs") or []:
            print("   PROBLEM %s  %s %s (%s)" % (when(e.get("t")), e.get("m"), e.get("at"), e.get("v")))

if __name__ == "__main__":
    main()
