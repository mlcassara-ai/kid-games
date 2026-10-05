// node heritage-night/tools/icons.js  — draws the app icons (Lebanon's flag colours with the cedar) into heritage-night/.
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const CEDAR = '<g fill="#1f9e5c"><path d="M50 14 L66 34 H58 L72 50 H62 L78 66 H22 L38 50 H28 L42 34 H34 Z"/><rect x="46" y="64" width="8" height="12" fill="#7a4a24"/></g>';
const svg = (pad, round) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
 <rect width="100" height="100" rx="${round}" fill="#e23b2e"/><rect y="25" width="100" height="50" fill="#fff"/>
 <g transform="translate(${pad} ${pad}) scale(${(100 - 2 * pad) / 100})">${CEDAR}</g></svg>`;
(async () => {
  const b = await pw.chromium.launch({ executablePath: require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  for (const [name, size, pad, round] of [['icon-192.png', 192, 10, 18], ['icon-512.png', 512, 10, 18], ['icon-maskable-512.png', 512, 22, 0], ['apple-touch-icon.png', 180, 10, 0]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg(pad, round)}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, '..', name), omitBackground: true });
  }
  await b.close();
})();
