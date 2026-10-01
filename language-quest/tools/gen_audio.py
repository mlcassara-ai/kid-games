#!/usr/bin/env python3
"""Generate and upload Language Quest audio clips.

Reads ../words.json, finds phrases with no clip in the bucket, records them with
Google Cloud Text-to-Speech and uploads them. Needs the Google Cloud CLI signed in
(gcloud auth login) with project kid-games-dc068.

Run with /usr/bin/python3: the python.org Python has no root certificates installed.

  /usr/bin/python3 gen_audio.py --check   list missing clips, change nothing
  /usr/bin/python3 gen_audio.py           record and upload missing clips
  /usr/bin/python3 gen_audio.py --all     re-record and upload every clip
"""
import base64, json, os, re, subprocess, sys, tempfile, urllib.error, urllib.request

PROJECT = "kid-games-dc068"
FOLDER = "lq/ar-XA-Chirp3-HD-Puck"
BUCKET = "gs://kid-games-dc068-voices/" + FOLDER + "/"
PUBLIC = "https://storage.googleapis.com/kid-games-dc068-voices/" + FOLDER + "/"
WORD_VOICE, WORD_RATE = "ar-XA-Chirp3-HD-Puck", 0.85
SHORT_VOICE, SHORT_RATE = "ar-XA-Wavenet-C", 0.8   # Chirp3-HD returns silent clips for single syllables
MARKS = re.compile("[ً-ْـ]")
SILENT_BYTES = 4000

def key(t):
    h = 0x811c9dc5
    for b in t.encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xffffffff
    return "%08x" % h

def exists(k):
    try:
        urllib.request.urlopen(urllib.request.Request(PUBLIC + k + ".mp3", method="HEAD"), timeout=15)
        return True
    except urllib.error.HTTPError as e:
        if e.code in (403, 404):
            return False
        raise

def synth(text, voice, rate, headers):
    cfg = {"audioEncoding": "MP3"}
    if rate:
        cfg["speakingRate"] = rate
    body = {"input": {"text": text}, "voice": {"languageCode": "ar-XA", "name": voice}, "audioConfig": cfg}
    req = urllib.request.Request("https://texttospeech.googleapis.com/v1/text:synthesize",
                                 data=json.dumps(body).encode(), headers=headers)
    return base64.b64decode(json.load(urllib.request.urlopen(req, timeout=60))["audioContent"])

def main():
    check, everything = "--check" in sys.argv, "--all" in sys.argv
    here = os.path.dirname(os.path.abspath(__file__))
    words = json.load(open(os.path.join(here, "..", "words.json"), encoding="utf-8"))
    bad = [w["t"] for w in words if key(w["t"]) != w["k"]]
    if bad:
        sys.exit("words.json keys don't match their text: " + ", ".join(bad))
    todo = words if everything else [w for w in words if not exists(w["k"])]
    print("%d phrases, %d to record" % (len(words), len(todo)))
    for w in todo:
        print("  ", w["k"], w["t"])
    if check or not todo:
        return
    token = subprocess.check_output(["gcloud", "auth", "print-access-token"]).decode().strip()
    headers = {"Authorization": "Bearer " + token, "x-goog-user-project": PROJECT,
               "Content-Type": "application/json"}
    out = tempfile.mkdtemp(prefix="lq-audio-")
    quiet = []
    for w in todo:
        if len(MARKS.sub("", w["t"])) <= 2:
            audio = synth(w["t"], SHORT_VOICE, SHORT_RATE, headers)
        else:
            try:
                audio = synth(w["t"], WORD_VOICE, WORD_RATE, headers)
            except urllib.error.HTTPError:
                audio = synth(w["t"], WORD_VOICE, None, headers)
        if len(audio) < SILENT_BYTES:
            quiet.append(w["t"])
        open(os.path.join(out, w["k"] + ".mp3"), "wb").write(audio)
    files = [os.path.join(out, f) for f in os.listdir(out)]
    subprocess.check_call(["gcloud", "storage", "cp", "-q"] + files + [BUCKET])
    print("uploaded %d clips to %s" % (len(files), BUCKET))
    if quiet:
        print("possibly silent (under %d bytes), listen to these: %s" % (SILENT_BYTES, ", ".join(quiet)))

if __name__ == "__main__":
    main()
