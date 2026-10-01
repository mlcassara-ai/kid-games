#!/usr/bin/python3
"""Math Quest smoke test. Run before every release:

    /usr/bin/python3 math-quest/tools/smoke.py

Static checks on the files, then the real game is driven in a throwaway headless Chrome
(tools/smoke.html): boot, question generation, every screen, a battle, sync merges,
Today's Adventure, pets and camp. Exits non-zero if anything fails.
Uses a temporary browser profile and no family code, so it never touches a real save.
"""
import functools, http.server, json, os, re, shutil, socketserver, subprocess, sys, tempfile, threading, time

HERE = os.path.dirname(os.path.abspath(__file__))
MQ = os.path.dirname(HERE)
ROOT = os.path.dirname(MQ)
NOT_LOADED = set()  # files that exist but are deliberately left out of the loader
CHROME = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
]


def static_checks():
    bad = []
    index = open(os.path.join(MQ, "index.html"), encoding="utf-8").read()
    m = re.search(r"const APP_VER='([^']+)'", index)
    ver = json.load(open(os.path.join(MQ, "version.json")))["v"]
    if not m or m.group(1) != ver:
        bad.append(f"APP_VER {m.group(1) if m else None} does not match version.json {ver}")
    loaded = set(re.findall(r'<script src="([\w-]+\.js)\?v=', index))
    files = {f for f in os.listdir(MQ) if f.endswith(".js")}
    for f in sorted(files - loaded - NOT_LOADED):
        bad.append(f"{f} exists but the loader in index.html never loads it")
    for f in sorted(loaded - files):
        bad.append(f"index.html loads {f} but the file is missing")
    node = shutil.which("node")
    for f in sorted(files) + ["index.html"]:
        src = open(os.path.join(MQ, f), encoding="utf-8").read()
        if re.search(r"\(\?<[=!]", src):
            bad.append(f"{f} uses regex lookbehind, which breaks Safari older than 16.4")
        if node and f.endswith(".js"):
            r = subprocess.run([node, "--check", os.path.join(MQ, f)], capture_output=True, text=True)
            if r.returncode:
                bad.append(f"{f} has a syntax error: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ''}")
    return ver, bad


RESULT = {}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):  # the test page posts its results here when it finishes
        body = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        if self.path == "/__smoke_result":
            RESULT["data"] = json.loads(body.decode("utf-8"))
        self.send_response(204)
        self.end_headers()


def browser_checks():
    chrome = next((c for c in CHROME if os.path.exists(c)), None)
    if not chrome:
        return None, ["Chrome not found; browser checks were skipped"]
    handler = functools.partial(Quiet, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    prof = tempfile.mkdtemp(prefix="mq-smoke-")
    proc = subprocess.Popen(
        [chrome, "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--mute-audio",
         f"--user-data-dir={prof}", "--window-size=1180,820",
         f"http://127.0.0.1:{port}/math-quest/tools/smoke.html?run=1"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        end = time.time() + 180
        while time.time() < end and "data" not in RESULT and proc.poll() is None:
            time.sleep(0.25)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        srv.shutdown()
        shutil.rmtree(prof, ignore_errors=True)
    if "data" not in RESULT:
        return None, ["the test page produced no result within 3 minutes (it may have crashed before finishing)"]
    return RESULT["data"], []


def main():
    ver, bad = static_checks()
    print(f"Math Quest {ver}")
    for b in bad:
        print(f"  FAIL  {b}")
    if not bad:
        print("  pass  files: version, loader, syntax, Safari-safe regex")
    res, problems = browser_checks()
    for p in problems:
        print(f"  FAIL  {p}")
    failed = bool(bad or problems)
    if res:
        for t in res["results"]:
            print(f"  {'pass' if t['ok'] else 'FAIL'}  {t['name']}" + ("" if t["ok"] else f"\n        {t['err']}"))
        failed = failed or not res["pass"]
    print("RESULT:", "FAIL" if failed else "PASS")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
