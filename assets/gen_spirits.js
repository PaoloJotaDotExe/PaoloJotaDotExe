// Generates assets/spirits.svg: one floating pixel ghost and Majora's Mask.
// The ghost is original art; the mask comes from assets/majora_grid.json. Run: node assets/gen_spirits.js
const fs = require('fs');

const GHOST = [
  '....xxxxxx....',
  '..xxxxxxxxxx..',
  '.xxxxxxxxxxxx.',
  '.xxxxxxxxxxxx.',
  'xxeeexxxxeeexx',
  'xxeppxxxxeppxx',
  'xxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxx',
  'xxxxxxxxxxxxxx',
  'xx.xxx..xxx.xx',
  'x...xx..xx...x',
];

// Majora's Mask sprite, extracted from the pixel chart the owner provided (assets/majora_grid.json).
const MASK = JSON.parse(fs.readFileSync(__dirname + '/majora_grid.json', 'utf8'));

function sprite(rows, P, colors, eyeChars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    const cls = eyeChars.includes(c) ? ' class="eye"' : '';
    out.push(`<rect x="${x * P}" y="${y * P}" width="${P}" height="${P}" fill="${colors[c]}"${cls}/>`);
  }));
  return out.join('');
}

const GP = 7, MP = 5;
const gW = GHOST[0].length * GP, gH = GHOST.length * GP;
const mW = MASK[0].length * MP, mH = MASK.length * MP;
const gap = 90, W = gW + gap + mW + 80, H = Math.max(gH, mH) + 50;

const ghostColors = { x: '#b388eb', e: '#ffffff', p: '#10002b' };
// right edge shading for depth
const ghost = sprite(GHOST, GP, ghostColors, 'ep');
const mask = sprite(MASK, MP, { k: '#10002b', y: '#ffd60a', o: '#ff8c1a', r: '#e5383b', b: '#3a47b8', l: '#7fb8f0' }, '');

let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const flies = Array.from({ length: 14 }, () =>
  `<rect class="fly" style="animation-delay:${(rnd() * 4).toFixed(2)}s" x="${Math.floor(rnd() * W / 3) * 3}" y="${Math.floor(rnd() * (H - 10) / 3) * 3}" width="3" height="3" fill="#fff3b0"/>`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
<style>
  .float { animation: float 3.2s ease-in-out infinite; }
  .float2 { animation: float 4s ease-in-out infinite; animation-delay: 1s; }
  .eye { animation: blink 4.5s steps(1) infinite; }
  .fly { animation: fly 3.5s ease-in-out infinite; }
  .glow { animation: glow 2.6s ease-in-out infinite; }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
  @keyframes blink { 0%,92%,100% { opacity: 1; } 94%,98% { opacity: 0; } }
  @keyframes fly { 0%,100% { opacity: 0; } 50% { opacity: .95; } }
  @keyframes glow { 0%,100% { opacity: .25; } 50% { opacity: .55; } }
</style>
${flies}
<g transform="translate(40,14)"><g class="float">${ghost}</g>
  <ellipse cx="${gW / 2}" cy="${gH + 22}" rx="${gW / 3}" ry="3" fill="#7b2cbf" opacity=".3"/></g>
<g transform="translate(${40 + gW + gap},10)"><g class="float2">
  <ellipse class="glow" opacity=".3" cx="${mW / 2}" cy="${mH / 2}" rx="${mW / 1.4}" ry="${mH / 1.5}" fill="#c77dff"/>
  ${mask}</g></g>
</svg>
`;
fs.writeFileSync(__dirname + '/spirits.svg', svg);
console.log('spirits.svg', W + 'x' + H);
