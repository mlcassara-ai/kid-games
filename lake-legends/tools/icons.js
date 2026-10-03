#!/usr/bin/env node
/* Draws the Lake Legends app icon with the game's own fish painter and writes icon-512.png, icon-192.png,
   apple-touch-icon.png (180) and icon-maskable-512.png (extra margin for Android/Chrome masks).
   Run from anywhere:  node lake-legends/tools/icons.js */
const path = require("path"), http = require("http"), fs = require("fs");
let pw; try { pw = require("playwright"); } catch (e) { pw = require("/opt/node22/lib/node_modules/playwright"); }
const ROOT = path.join(__dirname, "..", ".."), OUT = path.join(__dirname, "..");
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f.endsWith("/") ? f + "index.html" : f, (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200); r.end(d); }); });
(async () => {
  await new Promise(r => server.listen(0, r));
  let b; try { b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); } catch (e) { b = await pw.chromium.launch(); }
  const p = await b.newPage();
  await p.goto("http://localhost:" + server.address().port + "/lake-legends/"); await p.waitForTimeout(300);
  const out = await p.evaluate(() => {
    const draw = (N, pad) => {
      const c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d"), k = N / 360;
      const g = x.createLinearGradient(0, 0, 0, N); g.addColorStop(0, "#6cc4e0"); g.addColorStop(.55, "#2a83ad"); g.addColorStop(1, "#0d3a58");
      x.fillStyle = g; x.fillRect(0, 0, N, N);
      x.save(); x.globalAlpha = .12; x.fillStyle = "#fffbe6";                                     // light rays
      for (let i = 0; i < 4; i++){ x.beginPath(); x.moveTo((40 + i * 95) * k, 0); x.lineTo((70 + i * 95) * k, 0); x.lineTo((170 + i * 95) * k, N); x.lineTo((120 + i * 95) * k, N); x.fill(); }
      x.restore();
      x.save(); x.translate(N / 2, N / 2); x.scale(pad, pad); x.translate(-N / 2, -N / 2);
      x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 4 * k; x.beginPath(); x.moveTo(300 * k, 0); x.lineTo(288 * k, 200 * k); x.stroke();   // the line
      x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 4 * k;
      for (const [bx, by, r] of [[72, 90, 13], [93, 54, 9], [287, 288, 11]]){ x.beginPath(); x.arc(bx * k, by * k, r * k, 0, 7); x.stroke(); }
      x.save(); x.translate(184 * k, 198 * k); paintFish(x, SPECIES.largemouth, 255 * k, 0, false); x.restore();   // the bass
      x.restore();
      return c.toDataURL("image/png");
    };
    return { i512: draw(512, 1), i192: draw(192, 1), i180: draw(180, 1), m512: draw(512, .78) };
  });
  const save = (name, url) => fs.writeFileSync(path.join(OUT, name), Buffer.from(url.split(",")[1], "base64"));
  save("icon-512.png", out.i512); save("icon-192.png", out.i192); save("apple-touch-icon.png", out.i180); save("icon-maskable-512.png", out.m512);
  console.log("wrote icon-512.png, icon-192.png, apple-touch-icon.png, icon-maskable-512.png");
  await b.close(); server.close();
})();
