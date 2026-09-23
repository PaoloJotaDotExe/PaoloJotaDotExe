// Generates assets/header.svg and assets/footer.svg: pixel-art banner with a
// hand-made 5x7 bitmap font (GitHub blocks external fonts inside <img> SVGs).
// Run: node assets/gen_header.js
const fs = require('fs');

const FONT = {
  A: ['01110','10001','10001','11111','10001','10001','10001'], B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01110','10001','10000','10000','10000','10001','01110'], D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'], F: ['11111','10000','10000','11110','10000','10000','10000'],
  G: ['01110','10001','10000','10111','10001','10001','01111'], H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['01110','00100','00100','00100','00100','00100','01110'], J: ['00111','00010','00010','00010','00010','10010','01100'],
  K: ['10001','10010','10100','11000','10100','10010','10001'], L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'], N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'], P: ['11110','10001','10001','11110','10000','10000','10000'],
  Q: ['01110','10001','10001','10001','10101','10010','01101'], R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'], T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'], V: ['10001','10001','10001','10001','10001','01010','00100'],
  W: ['10001','10001','10001','10101','10101','10101','01010'], X: ['10001','10001','01010','00100','01010','10001','10001'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'], Z: ['11111','00001','00010','00100','01000','10000','11111'],
  '*': ['00000','00100','01110','11111','01110','00100','00000'], '&': ['01100','10010','10100','01000','10101','10010','01101'],
  ' ': ['000','000','000','000','000','000','000'],
};
const TILDE = ['01101', '10110']; // drawn above 'Ã'

// Returns rects for a string at scale s, plus its width.
function text(str, s) {
  const rects = []; let cx = 0;
  for (const ch of str) {
    const base = ch === 'Ã' ? 'A' : ch;
    const g = FONT[base];
    if (!g) throw new Error('missing glyph ' + ch);
    g.forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') rects.push([cx + x * s, y * s]); }));
    if (ch === 'Ã') TILDE.forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') rects.push([cx + x * s, (y - 3) * s]); }));
    cx += (g[0].length + 1) * s;
  }
  return { rects, width: cx - s };
}

function draw(t, ox, oy, s, fill, shadow) {
  const sh = shadow ? t.rects.map(([x, y]) => `<rect x="${ox + x + s / 2}" y="${oy + y + s / 2}" width="${s}" height="${s}" fill="${shadow}"/>`).join('') : '';
  return sh + t.rects.map(([x, y]) => `<rect x="${ox + x}" y="${oy + y}" width="${s}" height="${s}" fill="${fill}"/>`).join('');
}

// Stepped (pixelated) wave made of columns.
function wave(W, H, top, amp, step, color, phase, flip) {
  let out = '';
  for (let x = 0; x < W; x += step) {
    const h = Math.round((top + amp * Math.sin(x / 90 + phase)) / step) * step;
    out += flip ? `<rect x="${x}" y="0" width="${step}" height="${h}" fill="${color}"/>`
                : `<rect x="${x}" y="${H - h}" width="${step}" height="${h}" fill="${color}"/>`;
  }
  return out;
}

const W = 1000, H = 230;
const name = text('JOÃO PAOLO', 9);
const tags = text('DATA ENGINEERING * CYBERSECURITY * AI', 3);

// deterministic "stars"
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const stars = Array.from({ length: 34 }, (_, i) => {
  const x = Math.floor(rnd() * W / 4) * 4, y = Math.floor(rnd() * 150 / 4) * 4;
  return `<rect class="tw" style="animation-delay:${(rnd() * 3).toFixed(2)}s" x="${x}" y="${y}" width="4" height="4" fill="#e0aaff"/>`;
}).join('');

const header = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
<style>
  .tw { animation: tw 3s steps(2) infinite; }
  @keyframes tw { 0%,100% { opacity: .9; } 50% { opacity: .15; } }
  .glow { animation: glow 2.4s ease-in-out infinite; }
  @keyframes glow { 0%,100% { opacity: 1; } 50% { opacity: .82; } }
</style>
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10002b"/><stop offset=".55" stop-color="#240046"/><stop offset="1" stop-color="#3c096c"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${stars}
${wave(W, H, 44, 10, 10, '#5a189a', 0, false)}
${wave(W, H, 26, 8, 10, '#9d4edd', 1.7, false)}
<g class="glow">${draw(name, (W - name.width) / 2, 58, 9, '#ffffff', '#7b2cbf')}</g>
${draw(tags, (W - tags.width) / 2, 148, 3, '#e0aaff', null)}
</svg>
`;

const FH = 90;
const footer = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${FH}" viewBox="0 0 ${W} ${FH}" shape-rendering="crispEdges">
${wave(W, FH, 60, 12, 10, '#5a189a', 0.8, true)}
${wave(W, FH, 36, 10, 10, '#9d4edd', 2.3, true)}
</svg>
`;

fs.writeFileSync(__dirname + '/header.svg', header);
fs.writeFileSync(__dirname + '/footer.svg', footer);
console.log('header', name.width, tags.width);
