// Hand-made 16x16 pixel icons, one per mutation. Drawn with tiny shape helpers, auto-outlined, shown scaled up with crisp pixels.
const MutIcon = (() => {
  const cache = {};
  const K = { sk: '#f0b890', rd: '#e8353a', dr: '#8a1620', gd: '#ffd91f', og: '#ff8a1f', gn: '#6cf03a', dg: '#2f8a2a', bl: '#3de8ff', db: '#2a6fd0', gy: '#b4bcc6', dk: '#5a6270', wh: '#ffffff', br: '#a06a3a', pk: '#ff8fb0', pu: '#a45ae0', bk: '#14161c' };
  const DRAW = {
    rhino: d => { d.c(8, 9, 6, 'gy'); d.r(2, 11, 3, 3, 'dk'); d.r(11, 11, 3, 3, 'dk'); d.t(8, 1, 3, 'wh'); d.p(5, 8, 'bk'); d.p(10, 8, 'bk'); d.r(6, 12, 4, 1, 'dk'); },
    extrafeet: d => { d.r(2, 6, 5, 6, 'br'); d.r(2, 11, 7, 3, 'br'); d.r(9, 3, 5, 6, 'br'); d.r(9, 8, 7, 3, 'br'); d.r(2, 13, 7, 1, 'dk'); d.r(9, 10, 7, 1, 'dk'); d.l(12, 1, 15, 1, 'wh'); d.l(0, 8, 1, 8, 'wh'); },
    plutonium: d => { d.r(2, 3, 4, 8, 'rd'); d.r(10, 3, 4, 8, 'rd'); d.r(2, 10, 12, 4, 'gy'); d.r(6, 10, 4, 4, 'bk'); d.r(2, 3, 4, 2, 'wh'); d.r(10, 3, 4, 2, 'wh'); d.p(8, 6, 'gn'); d.p(7, 5, 'gn'); d.p(9, 5, 'gn'); },
    rabbit: d => { d.c(8, 10, 5, 'wh'); d.c(3, 5, 2, 'wh'); d.c(7, 3, 2, 'wh'); d.c(11, 3, 2, 'wh'); d.c(14, 6, 1, 'wh'); d.c(8, 11, 2, 'pk'); d.p(4, 5, 'pk'); d.p(7, 3, 'pk'); d.p(11, 3, 'pk'); },
    thronebutt: d => { d.r(2, 9, 12, 5, 'gd'); d.t(2, 3, 4, 'gd'); d.t(8, 1, 5, 'gd'); d.t(14, 3, 4, 'gd'); d.r(2, 9, 12, 2, 'og'); d.p(4, 12, 'rd'); d.p(8, 12, 'bl'); d.p(12, 12, 'rd'); },
    lucky: d => { d.c(5, 5, 3, 'gn'); d.c(11, 5, 3, 'gn'); d.c(5, 11, 3, 'gn'); d.c(11, 11, 3, 'gn'); d.c(8, 8, 2, 'dg'); d.l(8, 10, 9, 15, 'dg'); },
    bloodlust: d => { d.t(8, 1, 5, 'rd'); d.c(8, 10, 5, 'rd'); d.r(5, 9, 2, 2, 'wh'); d.c(8, 11, 2, 'dr'); },
    gamma: d => { d.c(8, 8, 7, 'gn'); d.c(8, 8, 2, 'bk'); d.t(8, 2, 3, 'bk'); d.t(2, 11, 3, 'bk'); d.t(14, 11, 3, 'bk'); d.c(8, 8, 1, 'gn'); },
    stomach: d => { d.c(6, 9, 5, 'pk'); d.c(11, 8, 3, 'pk'); d.r(5, 2, 3, 4, 'pk'); d.r(6, 10, 4, 2, 'rd'); d.r(7, 9, 2, 4, 'rd'); },
    back: d => { d.r(3, 5, 10, 9, 'br'); d.r(4, 2, 8, 3, 'dk'); d.r(5, 8, 6, 5, 'gd'); d.r(6, 9, 1, 3, 'dr'); d.r(9, 9, 1, 3, 'dr'); },
    scarier: d => { d.c(8, 8, 7, 'sk'); d.r(3, 5, 4, 2, 'rd'); d.r(9, 5, 4, 2, 'rd'); d.r(4, 6, 2, 2, 'bk'); d.r(10, 6, 2, 2, 'bk'); d.r(4, 11, 8, 2, 'bk'); for (let x = 5; x < 12; x += 2) d.p(x, 11, 'wh'); d.p(6, 2, 'dk'); },
    euphoria: d => { d.c(8, 8, 7, 'gd'); d.r(4, 5, 2, 3, 'bk'); d.r(10, 5, 2, 3, 'bk'); d.l(4, 10, 6, 12, 'bk'); d.l(6, 12, 10, 12, 'bk'); d.l(10, 12, 12, 10, 'bk'); },
    longarms: d => { d.r(0, 7, 11, 3, 'sk'); d.c(13, 8, 3, 'sk'); d.r(11, 5, 4, 1, 'dk'); d.l(12, 6, 15, 6, 'dk'); d.r(0, 6, 2, 5, 'rd'); },
    boiling: d => { d.c(8, 10, 5, 'og'); d.c(8, 11, 3, 'gd'); d.t(8, 1, 4, 'og'); d.t(4, 5, 3, 'rd'); d.t(12, 5, 3, 'rd'); d.c(8, 12, 1, 'wh'); },
    shotgunsh: d => { d.r(4, 3, 8, 11, 'rd'); d.r(4, 11, 8, 3, 'gd'); d.r(4, 3, 8, 2, 'dr'); d.r(6, 6, 1, 4, 'dr'); d.r(9, 6, 1, 4, 'dr'); },
    recycle: d => { d.l(3, 4, 11, 4, 'gn'); d.l(11, 4, 13, 8, 'gn'); d.t(14, 8, 3, 'gn'); d.l(13, 12, 5, 12, 'gn'); d.l(5, 12, 3, 8, 'gn'); d.t(2, 8, 3, 'gn'); },
    laserbrain: d => { d.c(5, 7, 4, 'pk'); d.c(11, 7, 4, 'pk'); d.r(4, 9, 8, 4, 'pk'); d.l(8, 3, 8, 12, 'dr'); d.l(4, 6, 12, 6, 'bl'); d.l(5, 9, 11, 9, 'bl'); d.p(8, 6, 'wh'); },
    lastwish: d => { d.c(5, 6, 3, 'rd'); d.c(11, 6, 3, 'rd'); d.t(8, 14, -7, 'rd'); d.r(5, 6, 6, 3, 'rd'); d.p(4, 4, 'wh'); d.p(14, 2, 'gd'); d.p(13, 1, 'gd'); d.p(15, 1, 'gd'); d.p(14, 0, 'gd'); },
    eagle: d => { d.c(8, 8, 7, 'wh'); d.c(8, 8, 4, 'gd'); d.c(8, 8, 2, 'bk'); d.l(8, 0, 8, 3, 'rd'); d.l(8, 13, 8, 15, 'rd'); d.l(0, 8, 3, 8, 'rd'); d.l(13, 8, 15, 8, 'rd'); },
    impact: d => { d.c(5, 8, 4, 'sk'); d.r(2, 5, 6, 7, 'sk'); d.l(10, 3, 15, 1, 'wh'); d.l(10, 8, 15, 8, 'wh'); d.l(10, 13, 15, 15, 'wh'); d.l(9, 5, 12, 4, 'gd'); d.l(9, 11, 12, 12, 'gd'); },
    boltmarrow: d => { d.c(3, 3, 2, 'wh'); d.c(3, 6, 2, 'wh'); d.c(13, 10, 2, 'wh'); d.c(13, 13, 2, 'wh'); d.l(3, 5, 13, 11, 'wh'); d.l(4, 5, 14, 11, 'wh'); d.l(7, 6, 7, 6, 'bl'); d.l(6, 9, 9, 7, 'bl'); },
    stress: d => { d.c(8, 8, 7, 'rd'); d.r(3, 5, 4, 2, 'wh'); d.r(9, 5, 4, 2, 'wh'); d.p(5, 6, 'bk'); d.p(10, 6, 'bk'); d.l(3, 3, 7, 4, 'bk'); d.l(13, 3, 9, 4, 'bk'); d.r(4, 11, 8, 2, 'bk'); d.l(2, 9, 0, 6, 'dr'); d.l(14, 9, 15, 6, 'dr'); },
    trigger: d => { d.r(2, 8, 10, 4, 'dk'); d.r(2, 4, 4, 5, 'dk'); d.l(7, 12, 7, 14, 'dk'); d.c(9, 13, 2, 'sk'); d.r(8, 8, 2, 5, 'sk'); d.p(14, 9, 'gd'); d.p(15, 7, 'gd'); d.p(15, 11, 'gd'); },
    sharp: d => { d.r(1, 3, 14, 3, 'dr'); d.r(1, 11, 14, 3, 'dr'); for (let x = 1; x < 15; x += 3) { d.t(x + 1, 11, 2, 'wh'); } for (let x = 1; x < 15; x += 3) { d.t(x + 1, 8, 2, 'wh'); d.r(x, 5, 3, 3, 'wh'); } d.r(1, 5, 14, 1, 'wh'); },
    hammer: d => { d.r(1, 2, 10, 6, 'gy'); d.r(1, 2, 10, 2, 'wh'); d.r(10, 2, 2, 6, 'dk'); d.r(5, 7, 3, 8, 'br'); d.r(5, 12, 3, 3, 'dk'); },
    strong: d => { d.l(4, 2, 12, 2, 'gd'); d.l(3, 3, 13, 3, 'gd'); d.c(8, 10, 5, 'wh'); d.r(5, 9, 2, 2, 'bk'); d.r(9, 9, 2, 2, 'bk'); d.l(6, 12, 10, 12, 'bk'); d.t(2, 15, 3, 'wh'); d.t(14, 15, 3, 'wh'); },
    open: d => { d.c(8, 9, 6, 'sk'); d.r(2, 4, 12, 4, 'br'); d.r(5, 9, 1, 2, 'bk'); d.r(10, 9, 1, 2, 'bk'); d.l(5, 13, 10, 13, 'bk'); d.p(8, 1, 'gd'); d.p(7, 2, 'gd'); d.p(9, 2, 'gd'); d.p(8, 3, 'gd'); d.p(4, 2, 'gd'); d.p(12, 2, 'gd'); },
    heavy: d => { d.c(5, 5, 4, 'dr'); d.c(11, 5, 4, 'dr'); d.t(8, 15, -8, 'dr'); d.r(3, 5, 10, 3, 'dr'); d.c(8, 9, 3, 'og'); d.c(8, 9, 1, 'gd'); d.p(2, 2, 'og'); d.p(14, 2, 'og'); },
    patience: d => { d.r(2, 2, 12, 7, 'db'); d.t(8, 15, -6, 'db'); d.r(2, 2, 12, 2, 'bl'); d.l(8, 2, 8, 13, 'wh'); d.l(4, 7, 12, 7, 'wh'); },
  };
  const make = id => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d');
    const buf = new Array(256).fill(null);
    const p = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < 16 && y < 16) buf[y * 16 + x] = K[c] || c; };
    const d = {
      p, r: (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p(x + i, y + j, c); },
      c: (cx, cy, r, c) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) p(cx + i, cy + j, c); },
      l: (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) p(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); },
      t: (cx, ty, h, c) => { for (let j = 0; j < Math.abs(h); j++) { const w = Math.floor(j * 0.9); for (let i = -w; i <= w; i++) p(cx + i, h > 0 ? ty + j : ty - j, c); } },
    };
    if (DRAW[id]) DRAW[id](d); else if (typeof PERKS !== 'undefined' && PERKS[id] && PERKS[id].clan) { const cc = CLANS[PERKS[id].clan].color; d.c(8, 8, 7, cc); d.c(8, 8, 4, 'bk'); d.c(8, 8, 2, cc); } else { d.c(8, 8, 6, 'gy'); }
    const out = buf.slice();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (!buf[y * 16 + x]) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < 16 && ny < 16 && buf[ny * 16 + nx]) { out[y * 16 + x] = K.bk; break; } }
    }
    for (let i = 0; i < 256; i++) if (out[i]) { g.fillStyle = out[i]; g.fillRect(i % 16, Math.floor(i / 16), 1, 1); }
    return cv.toDataURL();
  };
  return { url: id => cache[id] || (cache[id] = make(id)), has: id => !!DRAW[id] };
})();
