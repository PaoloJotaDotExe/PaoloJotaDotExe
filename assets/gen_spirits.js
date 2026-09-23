// Generates assets/majora.svg: a floating Majora's Mask pixel sprite on a transparent background.
// The sprite comes from assets/majora_grid.json (extracted from a pixel chart the owner provided).
// Run: node assets/gen_spirits.js
const fs = require('fs');

const MASK = JSON.parse(fs.readFileSync(__dirname + '/majora_grid.json', 'utf8'));
const COLORS = { k: '#10002b', y: '#ffd60a', o: '#ff8c1a', r: '#e5383b', b: '#3a47b8', l: '#7fb8f0' };
const P = 5;

const rects = [];
MASK.forEach((row, y) => [...row].forEach((c, x) => {
  if (c !== '.') rects.push(`<rect x="${x * P}" y="${y * P}" width="${P}" height="${P}" fill="${COLORS[c]}"/>`);
}));

const W = MASK[0].length * P, H = MASK.length * P + 6;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
<style>
  .float { animation: float 4s ease-in-out infinite; }
  @keyframes float { 0%,100% { transform: translateY(6px); } 50% { transform: translateY(0); } }
</style>
<g class="float">${rects.join('')}</g>
</svg>
`;
fs.writeFileSync(__dirname + '/majora.svg', svg);
console.log('majora.svg', W + 'x' + H);
