// Generates assets/ghosts.svg: a row of animated pixel-art ghosts (original art).
// Run: node assets/gen_ghosts.js
const fs = require('fs');

const sprite = [
  '....xxxxxx....',
  '..xxxxxxxxxx..',
  '.xxxxxxxxxxxx.',
  '.xxxxxxxxxxxx.',
  'xxeeexxxxeeexx',
  'xxeppxxxxeppxx',
  'xxxxxxxxxxxxxx',
  'xxxmxxxxxxmxxx',
  'xxxxmmmmmmxxxx',
  'xxxxxxxxxxxxxx',
  'xx.xxx..xxx.xx',
  'x...xx..xx...x',
];
const P = 6; // pixel size
const W = sprite[0].length * P, H = sprite.length * P;

const ghosts = [
  { body: '#5a189a', shade: '#3c096c', delay: 0 },
  { body: '#9d4edd', shade: '#7b2cbf', delay: 0.6 },
  { body: '#c77dff', shade: '#9d4edd', delay: 1.2 },
  { body: '#9d4edd', shade: '#7b2cbf', delay: 1.8 },
  { body: '#5a189a', shade: '#3c096c', delay: 2.4 },
];

function ghost(g, i) {
  const rects = [];
  sprite.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    // shade the right edge of the body for a bit of depth
    const edge = c === 'x' && (x === row.length - 1 || row[x + 1] === '.' || x >= row.length - 2);
    const fill = { x: edge ? g.shade : g.body, e: '#ffffff', p: '#10002b', m: '#10002b' }[c];
    const cls = c === 'e' || c === 'p' ? ' class="eye"' : '';
    rects.push(`<rect x="${x * P}" y="${y * P}" width="${P}" height="${P}" fill="${fill}"${cls}/>`);
  }));
  const gap = 36;
  const tx = i * (W + gap);
  return `<g transform="translate(${tx},12)"><g class="float" style="animation-delay:${g.delay}s">${rects.join('')}</g>` +
    `<ellipse class="shadow" style="animation-delay:${g.delay}s" cx="${W / 2}" cy="${H + 14}" rx="${W / 3}" ry="3" fill="#7b2cbf" opacity="0.35"/></g>`;
}

const totalW = ghosts.length * W + (ghosts.length - 1) * 36;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${H + 30}" viewBox="0 0 ${totalW} ${H + 30}" shape-rendering="crispEdges">
<style>
  .float { animation: float 3s ease-in-out infinite; }
  .shadow { animation: shadow 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .eye { animation: blink 4s steps(1) infinite; }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes shadow { 0%,100% { transform: scaleX(1); opacity: .35; } 50% { transform: scaleX(.7); opacity: .15; } }
  @keyframes blink { 0%,92%,100% { opacity: 1; } 94%,98% { opacity: 0; } }
</style>
${ghosts.map(ghost).join('\n')}
</svg>
`;
fs.writeFileSync(__dirname + '/ghosts.svg', svg);
console.log('ghosts.svg', totalW + 'x' + (H + 30));
