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

// deterministic randomness
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const stars = Array.from({ length: 26 }, () => {
  const x = Math.floor(rnd() * W / 4) * 4, y = Math.floor(rnd() * 90 / 4) * 4;
  return `<rect class="tw" style="animation-delay:${(rnd() * 3).toFixed(2)}s" x="${x}" y="${y}" width="3" height="3" fill="#f3e8ff"/>`;
}).join('');

// Pixel moon: filled circle with a soft halo.
function moon(cx, cy, r, s) {
  let out = '';
  for (let y = -r - 3; y <= r + 3; y++) for (let x = -r - 3; x <= r + 3; x++) {
    const d = Math.hypot(x, y);
    const fill = d <= r ? (x > r / 3 && y < -r / 4 ? '#ffffff' : '#fff3d6') : d <= r + 3 ? '#e0aaff' : null;
    const op = d <= r ? 1 : 0.12;
    if (fill) out += `<rect x="${cx + x * s}" y="${cy + y * s}" width="${s}" height="${s}" fill="${fill}" opacity="${op}"/>`;
  }
  return out;
}

// Soft pixel clouds that drift across the sky.
const CLOUD = ['....xxxx.......', '..xxxxxxxx.xxx.', '.xxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxx', '.xxxxxxxxxxxxx.'];
function cloud(y, s, dur, delay, op) {
  const r = [];
  CLOUD.forEach((row, cy) => [...row].forEach((c, cx) => { if (c === 'x') r.push(`<rect x="${cx * s}" y="${y + cy * s}" width="${s}" height="${s}"/>`); }));
  return `<g class="drift" fill="#f3e8ff" opacity="${op}" style="animation-duration:${dur}s;animation-delay:-${delay}s">${r.join('')}</g>`;
}

// Rolling pixel hills (stepped silhouettes).
function hills(top, amp, freq, phase, color, step = 8) {
  let out = '';
  for (let x = 0; x < W; x += step) {
    const h = Math.round((top + amp * Math.sin(x / freq + phase) + amp * 0.5 * Math.sin(x / (freq * 0.43) + phase * 2)) / step) * step;
    out += `<rect x="${x}" y="${H - h}" width="${step}" height="${h}" fill="${color}"/>`;
  }
  return out;
}

const flies = Array.from({ length: 16 }, () => {
  const x = Math.floor(rnd() * W / 3) * 3, y = H - 20 - Math.floor(rnd() * 30 / 3) * 3;
  return `<rect class="fly" style="animation-delay:${(rnd() * 4).toFixed(2)}s" x="${x}" y="${y}" width="3" height="3" fill="#fff3b0"/>`;
}).join('');

const header = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
<style>
  .tw { animation: tw 3s steps(2) infinite; }
  @keyframes tw { 0%,100% { opacity: .9; } 50% { opacity: .2; } }
  .drift { animation-name: drift; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes drift { from { transform: translateX(-260px); } to { transform: translateX(${W + 40}px); } }
  .fly { animation: fly 3.5s ease-in-out infinite; }
  @keyframes fly { 0%,100% { opacity: 0; } 50% { opacity: .95; } }
  .glow { animation: glow 2.6s ease-in-out infinite; }
  @keyframes glow { 0%,100% { opacity: 1; } 50% { opacity: .85; } }
</style>
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1b0f3a"/><stop offset=".45" stop-color="#3c1f6e"/><stop offset=".8" stop-color="#7b4fb5"/><stop offset="1" stop-color="#c9a7e8"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars}
${moon(880, 50, 6, 4)}
${cloud(18, 6, 70, 10, 0.55)}
${cloud(84, 5, 95, 60, 0.35)}
${cloud(40, 4, 120, 35, 0.3)}
${hills(46, 10, 140, 0.4, '#5a189a')}
${hills(28, 8, 110, 2.1, '#3c096c')}
${hills(12, 5, 70, 4.0, '#240046')}
${flies}
<g class="glow">${draw(name, (W - name.width) / 2, 50, 9, '#ffffff', '#5a189a')}</g>
${draw(tags, (W - tags.width) / 2 + 1, 141, 3, '#240046', null)}
${draw(tags, (W - tags.width) / 2, 140, 3, '#f3e8ff', null)}
</svg>
`;

const FH = 90;
const footer = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${FH}" viewBox="0 0 ${W} ${FH}" shape-rendering="crispEdges">
${wave(W, FH, 60, 12, 8, '#3c096c', 0.8, true)}
${wave(W, FH, 36, 10, 8, '#7b4fb5', 2.3, true)}
</svg>
`;

fs.writeFileSync(__dirname + '/header.svg', header);
fs.writeFileSync(__dirname + '/footer.svg', footer);
console.log('header', name.width, tags.width);
