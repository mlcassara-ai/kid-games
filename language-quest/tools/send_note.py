#!/usr/bin/env python3
"""Send an in-game note to a player, or list a family's notes and whether they have been read.

  /usr/bin/python3 send_note.py FAMILY-CODE "Player name" "Message" [--from "Sender"]
  /usr/bin/python3 send_note.py FAMILY-CODE --list

The note appears in the game the next time that player is signed in (within about a minute if they are playing now),
and stays until they tap "Read". Notes live in their own document next to the family save (families/lqm_<code>).
The family code is the family's key: pass it on the command line and never save it in a file.
"""
import datetime, json, os, re, sys, time, urllib.error, urllib.request, uuid

def api():
    here = os.path.dirname(os.path.abspath(__file__))
    fb = re.search(r"const FB=\{[^}]*\}", open(os.path.join(here, "..", "lq-core.js"), encoding="utf-8").read()).group(0)
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

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    code = sys.argv[1]
    slug = re.sub("[^a-z0-9]", "", code.lower())
    get, put = api()
    family = get("lq_" + slug)
    if not family:
        sys.exit("no family save found for that code")
    names = {p["id"]: p["name"] for p in family["players"]}
    notes = get("lqm_" + slug) or {"v": 1, "msgs": []}
    when = lambda t: datetime.datetime.fromtimestamp(t / 1000).strftime("%b %d %H:%M") if t else "-"
    if sys.argv[2] == "--list":
        for m in notes["msgs"]:
            read = m.get("readBy") or {}
            who = "everyone" if m["to"] == "*" else names.get(m["to"], m.get("toName", "?"))
            status = ", ".join("%s read %s" % (names.get(k, k), when(v)) for k, v in read.items()) or "NOT READ YET"
            print("%s  to %s  from %s: %s\n    -> %s" % (when(m["t"]), who, m.get("from", ""), m["m"], status))
        return
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    name, message = sys.argv[2], sys.argv[3]
    sender = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else "the Language Quest team"
    match = [pid for pid, n in names.items() if n.strip().lower() == name.strip().lower()]
    if not match:
        sys.exit("no player called %r in that family (players: %s)" % (name, ", ".join(names.values())))
    notes.setdefault("msgs", []).append({"id": uuid.uuid4().hex[:12], "t": int(time.time() * 1000), "to": match[0],
                                         "toName": names[match[0]], "from": sender, "m": message, "readBy": {}})
    notes["msgs"] = notes["msgs"][-50:]
    put("lqm_" + slug, notes)
    print("note saved for %s; it shows the next time they are signed in" % names[match[0]])

if __name__ == "__main__":
    main()
