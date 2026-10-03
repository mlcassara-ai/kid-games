#!/usr/bin/env python3
"""Answer a player's 🐞 report or suggestion, or send a player a note. They get a popup in the game.

  /usr/bin/python3 reply.py FAMILY-CODE --list
        every report (numbered) with its reply and whether the player has seen it, then other notes
  /usr/bin/python3 reply.py FAMILY-CODE N "Message" [--status fixed|added|thanks] [--from "Sender"]
        answer report number N from --list. fixed = "We fixed it!" (default for problems),
        added = "Your idea is in the game!" (default for suggestions), thanks = "Thanks for telling us!"
  /usr/bin/python3 reply.py FAMILY-CODE --note "Player name" "Message" [--from "Sender"]
        a plain note

The popup shows the next time that player is signed in and not in the middle of a cast, and stays until they tap it.
Replies live in their own document next to the family save (families/llm_<code>).
The family code is the family's key: pass it on the command line and never save it in a file.
"""
import datetime, json, os, re, sys, time, urllib.error, urllib.request, uuid

def api():
    here = os.path.dirname(os.path.abspath(__file__))
    fb = re.search(r"const FB=\{[^}]*\}", open(os.path.join(here, "..", "ll-core.js"), encoding="utf-8").read()).group(0)
    project, key = re.search(r'project:"([^"]+)"', fb).group(1), re.search(r'key:"([^"]+)"', fb).group(1)
    req = urllib.request.Request("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + key,
                                 data=b'{"returnSecureToken":true}', headers={"Content-Type": "application/json"})
    token = json.load(urllib.request.urlopen(req, timeout=20))["idToken"]
    base = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/families/" % project
    def get(doc_id):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(base + doc_id, headers={"Authorization": "Bearer " + token}), timeout=20))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise
        return json.loads(d["fields"]["data"]["stringValue"])
    def put(doc_id, obj):
        body = {"fields": {"data": {"stringValue": json.dumps(obj, ensure_ascii=False)},
                           "updated": {"integerValue": str(int(time.time() * 1000))}, "v": {"integerValue": "1"}}}
        r = urllib.request.Request(base + doc_id, data=json.dumps(body).encode(), method="PATCH",
                                   headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
        urllib.request.urlopen(r, timeout=20)
    return get, put

def opt(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    slug = re.sub("[^a-z0-9]", "", sys.argv[1].lower())
    get, put = api()
    family = get("ll_" + slug)
    if not family:
        sys.exit("no Lake Legends save found for that code")
    names = {p["id"]: p["name"] for p in family["players"]}
    reports = [(p, r) for p in family["players"] for r in (p.get("reports") or [])]
    reports.sort(key=lambda x: x[1]["t"])
    notes = get("llm_" + slug) or {"v": 1, "msgs": []}
    when = lambda t: datetime.datetime.fromtimestamp(t / 1000).strftime("%b %d %H:%M") if t else "-"
    sender = opt("--from", "the Lake Legends team")
    if sys.argv[2] == "--list":
        for i, (p, r) in enumerate(reports, 1):
            a = next((m for m in notes["msgs"] if m.get("re") and m["to"] == p["id"] and m["re"]["t"] == r["t"]), None)
            print("#%d  %s  %s  %s on \"%s\" (%s): %s" % (i, when(r["t"]), p["name"], "idea" if r.get("k") == "idea" else "problem", r.get("s"), r.get("v"), r["m"]))
            if a:
                seen = (a.get("readBy") or {}).get(p["id"])
                print("     -> [%s] %s  (%s)" % (a.get("st"), a["m"], "seen " + when(seen) if seen else "NOT SEEN YET"))
            else:
                print("     -> not answered yet")
        for m in notes["msgs"]:
            if not m.get("re"):
                seen = ", ".join("%s read %s" % (names.get(k, k), when(v)) for k, v in (m.get("readBy") or {}).items()) or "NOT READ YET"
                print("note %s to %s: %s  -> %s" % (when(m["t"]), names.get(m["to"], m.get("toName", "?")), m["m"], seen))
        return
    if sys.argv[2] == "--note":
        if len(sys.argv) < 5:
            sys.exit(__doc__)
        name, message = sys.argv[3], sys.argv[4]
        match = [pid for pid, n in names.items() if n.strip().lower() == name.strip().lower()]
        if not match:
            sys.exit("no player called %r (players: %s)" % (name, ", ".join(names.values())))
        msg = {"id": uuid.uuid4().hex[:12], "t": int(time.time() * 1000), "to": match[0], "toName": names[match[0]], "from": sender, "m": message, "readBy": {}}
    else:
        if len(sys.argv) < 4 or not sys.argv[2].isdigit():
            sys.exit(__doc__)
        n, message = int(sys.argv[2]), sys.argv[3]
        if not 1 <= n <= len(reports):
            sys.exit("there is no report #%d; run --list" % n)
        p, r = reports[n - 1]
        st = opt("--status", "added" if r.get("k") == "idea" else "fixed")
        if st not in ("fixed", "added", "thanks"):
            sys.exit("--status must be fixed, added or thanks")
        notes["msgs"] = [m for m in notes["msgs"] if not (m.get("re") and m["to"] == p["id"] and m["re"]["t"] == r["t"])]   # a new answer replaces an old one
        msg = {"id": uuid.uuid4().hex[:12], "t": int(time.time() * 1000), "to": p["id"], "toName": p["name"], "from": sender, "m": message,
               "st": st, "re": {"t": r["t"], "k": r.get("k", "problem"), "m": r["m"]}, "readBy": {}}
    notes.setdefault("msgs", []).append(msg)
    notes["msgs"] = notes["msgs"][-60:]
    put("llm_" + slug, notes)
    print("saved for %s; they'll see it the next time they're signed in" % msg["toName"])

if __name__ == "__main__":
    main()
