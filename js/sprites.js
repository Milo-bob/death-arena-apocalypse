// Hero sprites: 24x24 pixel-art robots, drawn at load from shape lists (no image files).
// Evolution look: bright outer edge, dimmer inner edge, dark fill, cyan marker in the facing direction (sprites face RIGHT, the game rotates them).
const SPR = 24;
const SPAL = {
  bio:   { b: '#7dff4a', m: '#3fa31f', d: '#12300c', a: '#d0ff6a', x: '#ff5ad2' },
  steam: { b: '#ffb347', m: '#b8661a', d: '#3a2008', a: '#ffe08a', x: '#ff6a2a' },
  solar: { b: '#ffe94a', m: '#b8a31a', d: '#3a3408', a: '#39ff6e', x: '#ff9a3a' },
  cyber: { b: '#ff3de8', m: '#a01a90', d: '#2a0826', a: '#3de8ff', x: '#ffffff' },
  void:  { b: '#a06bff', m: '#6a3ad0', d: '#1c0d3a', a: '#e0b0ff', x: '#ffffff' },
};
for (const k in SPAL) SPAL[k].c = '#3de8ff';
const CY = '#3de8ff', ICE = '#e6fdff';

const sC = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) - r;
const sB = (cx, cy, hw, hh, r = 0) => (x, y) => {
  const qx = Math.abs(x - cx) - (hw - r), qy = Math.abs(y - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const sRing = (cx, cy, r, w, gap) => (x, y) => {
  const a = Math.atan2(y - cy, x - cx);
  if (gap && Math.sin(a * gap) > 0.55) return 1;
  return Math.abs(Math.hypot(x - cx, y - cy) - r) - w;
};
function segD(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)) : 0;
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}
const sP = pts => (x, y) => {
  let d = 1e9, ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
    d = Math.min(d, segD(x, y, xj, yj, xi, yi));
  }
  return ins ? -d : d;
};
const sStar = (cx, cy, n, r1, r2, rot = 0) => sP(Array.from({ length: n * 2 }, (_, i) => { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }));
const sLine = (ax, ay, bx, by, w) => (x, y) => segD(x, y, ax, ay, bx, by) - w;

// part(shape, kind): kind 'body' = bright edge + mid inner edge + dark fill, 'dark' = bright edge + dark fill, 'acc' = accent edge/fill, 'cy' = cyan weapon part
function part(d, kind, o) { return Object.assign({ d, kind: kind || 'body' }, o || {}); }
const dot = (x, y, c) => ({ dot: [x, y, c] });

// ---------- the 25 robots ----------
const HERO_ART = {
  spore: P => [
    part(sC(5, 12, 3.4), 'dark'), part(sC(6.5, 7, 2.7), 'dark'), part(sC(6.5, 17, 2.7), 'dark'),
    dot(5, 12, P.x), dot(6, 7, P.x), dot(6, 17, P.x), dot(4, 11, P.a), dot(7, 16, P.a), dot(5, 7, P.a),
    part(sC(11.5, 12, 6), 'body'), part(sC(15.5, 7.5, 2.6), 'dark'), part(sC(15.5, 16.5, 2.6), 'dark'), dot(17, 7, CY), dot(17, 17, CY),
    part(sC(14, 12, 3.2), 'body'), part(sB(15.5, 12, 0.7, 2), 'cy'), part(sB(19.5, 12, 3, 1.3), 'dark'), dot(22, 12, CY), dot(8, 11, P.a), dot(9, 14, P.a),
  ],
  brute: P => [
    part(sC(4.5, 8.5, 2), 'dark'), part(sC(4.5, 15.5, 2), 'dark'),
    part(sB(10, 12, 5, 8, 2), 'body'),
    part(sB(15, 5, 4, 2.4, 1), 'dark'), part(sB(15, 19, 4, 2.4, 1), 'dark'),
    part(sP([[18, 3.5], [23.5, 5], [18, 6.8]]), 'cy'), part(sP([[18, 20.5], [23.5, 19], [18, 17.2]]), 'cy'),
    part(sP([[18, 1.8], [22.5, 2.6], [18, 4]]), 'cy'), part(sP([[18, 22.2], [22.5, 21.4], [18, 20]]), 'cy'),
    part(sC(12.5, 12, 3.4), 'body'), part(sB(14.2, 12, 0.7, 2.2), 'cy'), dot(8, 9, P.a), dot(8, 15, P.a), dot(7, 12, P.x),
  ],
  vein: P => [
    part(sStar(11.5, 12, 8, 11, 7, 0.2), 'dark'),
    part(sC(11.5, 12, 5.4), 'body'), part(sC(11.5, 12, 2.2), 'dark'), dot(11, 11, P.x), dot(12, 12, P.x),
    part(sB(14.8, 12, 0.7, 2.4), 'cy'), part(sB(19.5, 12, 2.6, 0.9), 'dark'), dot(22, 12, CY), dot(8, 9, P.a), dot(8, 15, P.a),
  ],
  boiler: P => [
    part(sB(4.5, 7.5, 1.7, 2, 0.5), 'dark'), part(sB(4.5, 16.5, 1.7, 2, 0.5), 'dark'), dot(4, 6, P.a), dot(4, 15, P.a),
    part(sC(10, 12, 7.6), 'body'), part(sRing(10, 12, 4.6, 0.5, 8), 'acc'), part(sC(10, 12, 2.4), 'dark'), dot(9, 11, P.x),
    part(sB(18, 12, 5, 2.7, 0.5), 'dark'), part(sB(21.8, 12, 1.4, 3.2), 'acc'), part(sB(21.3, 12, 0.6, 1.2), 'cy'),
    part(sC(13.5, 12, 2.6), 'body'), part(sB(14.8, 12, 0.6, 1.5), 'cy'),
  ],
  gunner: P => [
    part(sC(4.5, 12, 3.2), 'dark'), dot(4, 12, P.x), part(sB(7, 12, 2, 0.8), 'acc'),
    part(sB(11, 12, 5.5, 6.8, 1.5), 'body'),
    part(sB(10.5, 4.8, 3.5, 2.2, 0.8), 'dark'), part(sB(10.5, 19.2, 3.5, 2.2, 0.8), 'dark'),
    part(sB(19, 12, 5, 1.4), 'dark'), part(sB(15.2, 12, 1.6, 2.6, 0.5), 'acc'), part(sB(22.2, 12, 1.2, 1.7), 'cy'),
    part(sB(12.5, 12, 3, 3.2, 1), 'body'), part(sB(14, 12, 0.7, 2.2), 'cy'), dot(8, 9, P.a), dot(8, 15, P.a),
  ],
  clock: P => [
    part(sStar(11, 12, 8, 11, 8.6, 0), 'body'), part(sC(11, 12, 6.2), 'dark'), part(sRing(11, 12, 4.6, 0.5), 'acc'),
    part(sC(11, 12, 2.4), 'body'), dot(10, 11, P.a),
    part(sLine(15, 12, 22.5, 12, 0.9), 'dark'), part(sP([[20.5, 9.8], [24, 12], [20.5, 14.2]]), 'cy'), part(sB(15.8, 12, 0.9, 3.2), 'acc'),
    part(sC(12.5, 12, 2.4), 'body'), part(sB(13.8, 12, 0.6, 1.4), 'cy'),
  ],
  sun: P => [
    part(sStar(11, 12, 10, 11.4, 8, 0), 'dark'), part(sB(5, 6.5, 2.6, 3.6, 0.6), 'dark'), part(sB(5, 17.5, 2.6, 3.6, 0.6), 'dark'),
    dot(4, 5, P.a), dot(6, 7, P.a), dot(4, 16, P.a), dot(6, 18, P.a),
    part(sC(11, 12, 5.8), 'body'), part(sC(11, 12, 2.6), 'acc'), dot(10, 11, ICE),
    part(sB(18.2, 12, 3.4, 1.5), 'dark'), part(sB(21.5, 12, 0.8, 1.2), 'cy'), part(sB(14.5, 12, 1.1, 2.6), 'cy'),
  ],
  weaver: P => [
    ...[0, 1, 2, 3, 4, 5].map(i => part(sC(11 + Math.cos(i * 1.047 + 0.52) * 6, 12 + Math.sin(i * 1.047 + 0.52) * 6, 3.4), 'dark')),
    part(sC(11, 12, 5.2), 'body'), part(sC(11, 12, 2), 'acc'), dot(10, 11, ICE),
    part(sC(16.5, 7.5, 1.9), 'acc'), part(sC(16.5, 16.5, 1.9), 'acc'), dot(18, 7, CY), dot(18, 17, CY),
    part(sC(14.5, 12, 2.5), 'body'), part(sB(15.5, 12, 0.6, 1.4), 'cy'),
  ],
  seed: P => [
    part(sC(6, 7.5, 2.6), 'acc'), part(sC(6, 16.5, 2.6), 'acc'), part(sC(3.8, 12, 2.4), 'acc'), dot(6, 7, ICE), dot(6, 17, ICE),
    part(sP([[6, 6], [17, 7.8], [17, 16.2], [6, 18]]), 'body'), part(sRing(11.5, 12, 3.6, 0.5, 6), 'acc'), dot(11, 11, P.a),
    part(sB(19, 12, 3.4, 2, 0.8), 'dark'), part(sC(22, 12, 1.6), 'cy'),
    part(sC(14, 12, 3), 'body'), part(sB(15.1, 12, 0.6, 1.5), 'cy'),
  ],
  runner: P => [
    part(sP([[2, 3.5], [9, 7], [4, 9.5]]), 'dark'), part(sP([[2, 20.5], [9, 17], [4, 14.5]]), 'dark'),
    part(sP([[3.5, 12], [8, 6.5], [16, 8.2], [19.2, 12], [16, 15.8], [8, 17.5]]), 'body'),
    part(sB(17.5, 12, 0.8, 3.4), 'acc'), part(sLine(18, 12, 23.2, 12, 0.7), 'cy'), dot(23, 12, ICE),
    part(sC(11.5, 12, 3), 'dark'), part(sB(13, 12, 0.7, 2), 'cy'), dot(7, 9, P.a), dot(7, 15, P.a), dot(5, 12, P.a),
  ],
  net: P => [
    part(sRing(11, 12, 10, 0.7, 6), 'acc'), dot(21, 12, P.a), dot(11, 2, P.a), dot(11, 22, P.a),
    part(sLine(4, 4.5, 8, 8, 0.6), 'acc'), part(sLine(4, 19.5, 8, 16, 0.6), 'acc'), dot(3, 4, CY), dot(3, 20, CY),
    part(sC(10, 12, 5.2), 'body'), part(sStar(10, 12, 6, 2.6, 1.4, 0.5), 'dark'),
    part(sB(17, 12, 3.2, 1.9), 'dark'), part(sB(20, 12, 0.8, 1.2), 'cy'),
    part(sC(13, 12, 2.6), 'body'), part(sB(14, 12, 0.6, 1.5), 'cy'),
  ],
  splicer: P => [
    part(sP([[2.5, 12], [8, 4], [16, 6.5], [13.5, 12], [16, 17.5], [8, 20]]), 'body'),
    part(sP([[6, 2], [12, 3.4], [8, 6]]), 'dark'), part(sP([[6, 22], [12, 20.6], [8, 18]]), 'dark'),
    part(sC(8.5, 12, 2.4), 'dark'), dot(8, 11, P.a), dot(9, 12, P.a),
    part(sLine(14, 10.6, 23.2, 10.6, 0.55), 'cy'), part(sLine(14, 13.4, 23.2, 13.4, 0.55), 'cy'), part(sB(15, 12, 0.9, 3), 'acc'),
    part(sC(12, 12, 2), 'body'), dot(13, 12, CY),
  ],

  hive: P => [
    part(sC(5.5, 12, 4.2), 'dark'), part(sC(9.5, 7.5, 3.4), 'body'), part(sC(9.5, 16.5, 3.4), 'body'), dot(8, 7, P.x), dot(8, 17, P.x), dot(4, 12, P.x),
    part(sC(13, 12, 5), 'body'), part(sC(13, 12, 2.2), 'dark'), dot(12, 11, P.a),
    part(sB(19, 12, 3, 2.4, 0.8), 'dark'), part(sB(21.8, 12, 0.9, 3.2), 'cy'), dot(19, 10, P.a), dot(19, 14, P.a),
  ],
  reaper: P => [
    part(sP([[2, 12], [8, 5], [14, 9], [14, 15], [8, 19]]), 'body'), part(sC(8.5, 12, 2.6), 'dark'), dot(8, 11, P.x), dot(5, 12, P.a),
    part(sB(14, 12, 2, 1.2), 'acc'), part(sLine(15, 12, 21, 12, 0.7), 'dark'),
    part(sP([[16, 7], [23.5, 2], [20, 10]]), 'cy'), part(sP([[16, 17], [23.5, 22], [20, 14]]), 'cy'), part(sB(12.5, 12, 0.7, 2), 'cy'),
  ],
  siege: P => [
    part(sB(4, 6, 2, 3, 0.6), 'dark'), part(sB(4, 18, 2, 3, 0.6), 'dark'),
    part(sB(10, 12, 6.5, 8.2, 1.5), 'body'), part(sB(9, 12, 3.2, 4.2, 1), 'dark'), dot(8, 10, P.a), dot(8, 14, P.a),
    part(sB(18.2, 12, 4.8, 3.6, 0.8), 'dark'), part(sB(22, 12, 1.5, 4.2), 'acc'), part(sC(22.8, 12, 1.4), 'cy'), part(sB(13.8, 12, 0.7, 2.4), 'cy'),
  ],
  tinker: P => [
    part(sB(5, 6, 2, 2.8, 0.6), 'dark'), part(sB(5, 18, 2, 2.8, 0.6), 'dark'),
    part(sC(10, 12, 6.2), 'body'), part(sRing(10, 12, 3.6, 0.5, 5), 'acc'), part(sC(10, 12, 1.6), 'dark'), dot(9, 11, P.x),
    part(sLine(13, 12, 21.5, 12, 0.9), 'dark'), part(sB(22, 12, 1.2, 2.2), 'cy'), part(sLine(12, 6, 17, 3.5, 0.7), 'acc'), part(sC(17, 3.5, 1.2), 'acc'),
  ],
  prism: P => [
    part(sP([[11, 1.5], [19, 12], [11, 22.5], [3.5, 12]]), 'body'), part(sP([[11, 6.5], [15, 12], [11, 17.5], [8, 12]]), 'dark'), part(sC(11, 12, 1.8), 'acc'), dot(10, 11, ICE),
    part(sLine(15, 12, 23, 12, 0.6), 'cy'), part(sLine(14, 9, 21.5, 6.5, 0.4), 'cy'), part(sLine(14, 15, 21.5, 17.5, 0.4), 'cy'), dot(6, 12, P.a),
  ],
  dawn: P => [
    part(sStar(10, 12, 8, 10.6, 7.4, 0), 'dark'), part(sC(10, 12, 5.6), 'body'), part(sC(10, 12, 2.6), 'acc'), dot(9, 11, ICE),
    part(sP([[14, 9.6], [23.5, 12], [14, 14.4]]), 'cy'), part(sB(14, 12, 1, 3.4), 'acc'),
  ],
  phantom: P => [
    part(sP([[2, 5], [10, 8.5], [5, 12], [10, 15.5], [2, 19]]), 'dark'), dot(5, 12, P.a),
    part(sC(11, 12, 5.4), 'body'), part(sRing(11, 12, 8.4, 0.5, 3), 'acc'), part(sC(11, 12, 2.4), 'dark'), dot(10, 11, P.x),
    part(sB(15.6, 12, 0.7, 2.2), 'cy'), part(sC(20, 4, 1.6), 'cy'), part(sC(20, 20, 1.6), 'cy'),
  ],
  sniper: P => [
    part(sP([[2.5, 4], [8, 7], [2.5, 9.5]]), 'dark'), part(sP([[2.5, 20], [8, 17], [2.5, 14.5]]), 'dark'),
    part(sB(8, 12, 5, 5.8, 1.4), 'body'), part(sC(6.5, 12, 2.2), 'dark'), dot(6, 11, P.x),
    part(sB(16.5, 12, 8, 1), 'dark'), part(sB(23, 12, 0.9, 1.5), 'cy'), part(sB(11, 8, 2.2, 1.2), 'acc'), dot(11, 8, CY), dot(14, 12, P.a),
  ],
  rift: P => [
    part(sP([[3, 12], [9, 4], [17, 8], [17, 16], [9, 20]]), 'body'), part(sRing(12, 12, 9.4, 0.5, 4), 'acc'),
    part(sC(10, 12, 3), 'dark'), dot(10, 12, P.a), dot(9, 11, ICE), part(sLine(16, 12, 22.5, 12, 0.8), 'cy'),
  ],
  warlock: P => [
    part(sP([[1.5, 7], [6, 12], [1.5, 17]]), 'dark'), part(sC(10, 12, 7), 'dark'), part(sRing(10, 12, 5, 0.6, 5), 'acc'), part(sC(10, 12, 2.4), 'body'), dot(10, 12, ICE),
    part(sC(19, 12, 3), 'acc'), part(sC(19, 12, 1.2), 'cy'), part(sB(15.2, 12, 1.2, 0.8), 'dark'),
  ],
  umbra: P => [
    ...[0, 1, 2].map(i => part(sC(11 + Math.cos(i * 2.094 + 0.3) * 8.4, 12 + Math.sin(i * 2.094 + 0.3) * 8.4, 2.6), 'dark')),
    part(sP([[3.5, 12], [8, 5], [16, 6], [19, 12], [16, 18], [8, 19]]), 'body'), part(sC(11, 12, 3), 'dark'), dot(12, 12, P.a), dot(10, 11, P.x),
    part(sB(15.4, 12, 0.7, 2), 'cy'),
  ],
  singular: P => [
    part(sC(10, 12, 8.2), 'dark'), part(sRing(10, 12, 6, 0.9), 'acc'), part(sC(10, 12, 3.4), 'body'), part(sC(10, 12, 1.4), 'dark'), dot(9, 11, ICE),
    part(sLine(14, 12, 23, 12, 0.8), 'cy'), part(sP([[15, 8], [19.5, 12], [15, 16]]), 'acc'),
  ],
  eclipse: P => [
    part(sRing(10, 12, 10, 0.5, 6), 'acc'), part(sC(10, 12, 7.6), 'body'), part(sC(12.6, 12, 6.4), 'dark'), dot(8, 9, P.a), dot(7, 12, P.a), dot(8, 15, P.a),
    part(sB(18.5, 12, 3, 1.4), 'dark'), part(sB(22, 12, 0.8, 1.3), 'cy'),
  ],
};


// ---------- enemies (red team, yellow marker) and bosses ----------
const EPAL = { b: '#ff2d3d', m: '#a01828', d: '#3a0810', a: '#ff9aa6', c: '#ffd91f', x: '#ff8a1f' };
const BPAL = [
  { b: '#ff2d3d', m: '#a01828', d: '#3a0810', a: '#ff9aa6', c: '#ffd91f', x: '#ff8a1f' },
  { b: '#7dff4a', m: '#3fa31f', d: '#12300c', a: '#d0ff6a', c: '#ffd91f', x: '#ff5ad2' },
  { b: '#ff8a1f', m: '#a05010', d: '#3a1c08', a: '#ffd091', c: '#ffd91f', x: '#ff2d3d' },
  { b: '#8ae8ff', m: '#3a8ab0', d: '#0e2a3a', a: '#e6fdff', c: '#ffd91f', x: '#ff2d3d' },
  { b: '#3de8c8', m: '#1a8a78', d: '#08302a', a: '#b0fff0', c: '#ffd91f', x: '#ff3de8' },
  { b: '#b24bff', m: '#6a1fd0', d: '#1c0d4a', a: '#e0b0ff', c: '#ffd91f', x: '#3de8ff' },
];
const ENEMY_ART = {
  grunt: { n: 16, f: P => [
    ...[[5, 4.5, 2, 1.5], [5, 11.5, 2, 14.5], [10.5, 4.5, 12.5, 1.8], [10.5, 11.5, 12.5, 14.2]].map(l => part(sLine(l[0], l[1], l[2], l[3], 0.6), 'dark')),
    part(sC(8, 8, 4.8), 'body'), dot(11, 6, P.c), dot(11, 10, P.c), dot(6, 8, P.a)] },
  shooter: { n: 16, f: P => [
    part(sP([[1.5, 8], [6, 2.5], [11, 4.5], [11, 11.5], [6, 13.5]]), 'body'), part(sB(13, 8, 2.6, 1.2), 'dark'), part(sB(15, 8, 0.9, 1), 'cy'),
    part(sB(8.5, 8, 0.8, 2), 'cy'), dot(4, 8, P.a)] },
  dasher: { n: 16, f: P => [
    part(sP([[0.5, 2], [6, 5], [3, 7]]), 'dark'), part(sP([[0.5, 14], [6, 11], [3, 9]]), 'dark'),
    part(sP([[1, 8], [5, 4.5], [10, 6], [13, 8], [10, 10], [5, 11.5]]), 'body'), part(sP([[10, 6.8], [15.6, 8], [10, 9.2]]), 'cy'), dot(5, 8, P.a)] },
  bomber: { n: 16, f: P => [
    part(sB(8, 1.6, 1.1, 1.1), 'dark'), part(sB(8, 14.4, 1.1, 1.1), 'dark'), part(sB(1.6, 8, 1.1, 1.1), 'dark'), part(sB(14.4, 8, 1.1, 1.1), 'dark'),
    part(sC(8, 8, 6), 'body'), part(sRing(8, 8, 3.7, 0.5, 6), 'acc'), part(sC(8, 8, 1.8), 'cy')] },
  tank: { n: 24, f: P => [
    part(sB(10, 3.5, 7, 2.2, 0.8), 'dark'), part(sB(10, 20.5, 7, 2.2, 0.8), 'dark'),
    part(sStar(12, 12, 6, 10.8, 9.2, 0), 'body'), part(sC(12, 12, 6), 'dark'), part(sRing(12, 12, 4, 0.5, 5), 'acc'),
    part(sB(19.5, 12, 4, 2.2), 'dark'), part(sB(22, 12, 1.6, 2.4), 'cy'), dot(7, 12, P.a)] },
};
ENEMY_ART.maggot = { n: 12, pal: { b: '#d8c070', m: '#8a7a2a', d: '#2a240a', a: '#fff0b0', c: '#ff4a2a', x: '#ff8a1f' }, f: P => [
  part(sB(6, 6, 5, 3.2, 1.2), 'body'), dot(9, 5, P.c), dot(9, 7, P.c), dot(3, 6, P.a)] };
ENEMY_ART.rat = { n: 14, pal: { b: '#b08a6a', m: '#6a4a2a', d: '#241810', a: '#f0d0b0', c: '#ffd91f', x: '#ff8a1f' }, f: P => [
  part(sP([[1, 7], [5, 3], [10, 5], [13, 7], [10, 9], [5, 11]]), 'body'), part(sLine(1, 7, 0, 10, 0.5), 'dark'), dot(10, 6, P.c), dot(10, 8, P.c), dot(6, 7, P.a)] };
ENEMY_ART.turret = { n: 20, pal: { b: '#a0a0b0', m: '#60606e', d: '#1c1c24', a: '#e0e0f0', c: '#ffd91f', x: '#ff8a1f' }, f: P => [
  part(sB(10, 10, 7, 7, 1.5), 'body'), part(sC(10, 10, 3.5), 'dark'), dot(9, 9, P.a), part(sB(16, 10, 4.5, 1.6), 'dark'), part(sB(19.3, 10, 0.9, 2), 'cy')] };
const BOSS_ART_OF = [0, 1, 1, 0, 2, 2];   // which of the 3 boss drawings each area's boss uses (colours differ per area)
ENEMY_ART.swarmer = { n: 12, pal: { b: '#ff7a3a', m: '#a04a1a', d: '#3a1a08', a: '#ffd0a0', c: '#ffd91f', x: '#ff8a1f' }, f: P => [
  part(sC(6, 6, 4.4), 'body'), dot(8, 5, P.c), dot(8, 7, P.c), dot(4, 6, P.a)] };
ENEMY_ART.spitter = { n: 16, pal: { b: '#7dd04a', m: '#3f8a1f', d: '#122a0c', a: '#d0ff9a', c: '#ffd91f', x: '#ff8a1f' }, f: P => [
  part(sC(7, 8, 5.6), 'body'), part(sC(7, 8, 2.6), 'dark'), part(sB(12.5, 8, 3, 2.6, 0.8), 'dark'), part(sB(14.6, 8, 0.9, 2.8), 'cy'), dot(5, 7, P.a)] };
ENEMY_ART.blob = { n: 24, pal: { b: '#c0763a', m: '#7a4a1f', d: '#2a1a0a', a: '#f0c090', c: '#ffd91f', x: '#ff8a1f' }, f: P => [
  part(sC(12, 12, 10), 'body'), part(sC(12, 12, 6), 'dark'), part(sRing(12, 12, 8, 0.6, 5), 'acc'), dot(17, 10, P.c), dot(17, 14, P.c), dot(7, 12, P.a)] };
ENEMY_ART.sniper = { n: 16, pal: { b: '#c04aff', m: '#6a1fa0', d: '#200a38', a: '#e8b0ff', c: '#ffd91f', x: '#ff8a1f' }, f: P => [
  part(sP([[1, 8], [5, 3], [9, 5], [9, 11], [5, 13]]), 'body'), part(sB(12, 8, 4.5, 0.9), 'dark'), part(sB(15.5, 8, 0.7, 1.1), 'cy'), dot(4, 8, P.a)] };
const BOSS_ART = [
  { n: 40, f: P => [
    part(sP([[2, 8], [10, 4], [10, 12]]), 'dark'), part(sP([[2, 32], [10, 36], [10, 28]]), 'dark'),
    part(sB(20, 6, 10, 4.5, 1.5), 'dark'), part(sB(20, 34, 10, 4.5, 1.5), 'dark'),
    part(sStar(19, 20, 8, 17, 14.5, 0.2), 'body'), part(sC(19, 20, 11), 'dark'), part(sRing(19, 20, 8, 0.8, 8), 'acc'),
    part(sC(19, 20, 5), 'body'), part(sC(19, 20, 2.6), 'cy'),
    part(sB(32, 12, 6, 1.9), 'dark'), part(sB(32, 28, 6, 1.9), 'dark'), part(sB(37.5, 12, 1.5, 2.6), 'cy'), part(sB(37.5, 28, 1.5, 2.6), 'cy'),
    part(sB(30, 20, 1, 7), 'cy'), dot(8, 20, P.a), dot(10, 15, P.a), dot(10, 25, P.a)] },
  { n: 40, f: P => [
    ...[[14, 10, 4, 3], [16, 6, 10, 1.5], [22, 7, 24, 2], [14, 30, 4, 37], [16, 34, 10, 38.5], [22, 33, 24, 38]].map(l => part(sLine(l[0], l[1], l[2], l[3], 0.9), 'dark')),
    part(sC(10, 20, 9.5), 'dark'), part(sRing(10, 20, 6, 0.6, 6), 'acc'), dot(8, 18, P.x), dot(11, 22, P.x), dot(7, 22, P.a), dot(12, 17, P.a),
    part(sC(22, 20, 8.5), 'body'), part(sC(22, 20, 4.5), 'dark'), part(sB(24, 20, 1, 4), 'cy'),
    part(sP([[28, 11], [38, 15], [30, 16]]), 'cy'), part(sP([[28, 29], [38, 25], [30, 24]]), 'cy'),
    part(sC(29, 15, 1.8), 'acc'), part(sC(29, 25, 1.8), 'acc'), dot(29, 15, P.c), dot(29, 25, P.c)] },
  { n: 40, f: P => [
    part(sStar(20, 20, 6, 19, 11, 0.3), 'dark'), part(sStar(20, 20, 6, 17, 10, 0), 'body'), part(sC(20, 20, 11), 'dark'), part(sRing(20, 20, 8, 0.7, 7), 'acc'),
    part(sC(21, 20, 6), 'body'), part(sC(22, 20, 3.2), 'dark'), part(sB(25, 20, 1.2, 5), 'cy'),
    part(sP([[34, 4], [38, 8], [34, 10]]), 'cy'), part(sP([[34, 36], [38, 32], [34, 30]]), 'cy'), dot(18, 18, P.a), dot(17, 22, P.a)] },
];


// ---------- world objects (32x32, drawn at 2x): market stall, campfire, altar, cursed stone ----------
const rdots = (x, y, w, h, col) => { const a = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) a.push(dot(x + i, y + j, col)); return a; };
const ldots = (x1, y1, x2, y2, col) => { const a = [], n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); for (let i = 0; i <= n; i++) { const x = Math.round(x1 + (x2 - x1) * i / n), y = Math.round(y1 + (y2 - y1) * i / n); a.push(dot(x, y, col), dot(x, y + 1, col)); } return a; };
const OPAL = {
  shop: { b: '#b07a3a', m: '#7a5028', d: '#3a2412', a: '#ffd91f', c: '#ffe08a' },
  rest: { b: '#8a8f99', m: '#5a5f69', d: '#26292f', a: '#ff8a1f', c: '#ffe08a' },
  event: { b: '#9aa0b0', m: '#5a6070', d: '#22252e', a: '#b24bff', c: '#e0b0ff' },
  curse: { b: '#ff3de8', m: '#a01a90', d: '#1a1020', a: '#ff9af0', c: '#ffffff' },
};
const OPAL_USED = { b: '#6a6f79', m: '#4a4e57', d: '#1a1c20', a: '#4a4d55', c: '#7a7d85' };
const OBJ_ART = {
  shop: (P, u) => {
    const L = [];
    for (let i = 0; i < 7; i++) L.push(...rdots(2 + i * 4, 5, 4, 9, i % 2 ? '#c9302c' : '#e8e2d0'));
    L.push(...rdots(2, 14, 28, 1, '#7a1a18'), ...rdots(2, 4, 28, 1, '#a02420'));
    L.push(...rdots(3, 15, 2, 12, '#3a2412'), ...rdots(27, 15, 2, 12, '#3a2412'));
    L.push(part(sB(16, 24, 13, 4, 1), 'body'), ...rdots(5, 21, 22, 1, '#d8a860'));
    L.push(...rdots(7, 18, 3, 3, '#ff5a5a'), ...rdots(12, 18, 3, 3, '#39ff6e'), ...rdots(17, 18, 3, 3, '#3de8ff'), ...rdots(22, 18, 3, 3, '#ffd91f'));
    L.push(part(sB(16, 17, 3, 2.4, 1), 'dark'), dot(15, 17, '#3de8ff'), dot(17, 17, '#3de8ff'), ...rdots(15, 1, 3, 3, '#ffd91f'), dot(16, 0, '#fff3a0'));
    return L;
  },
  rest: (P, u) => {
    const L = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, x = 16 + Math.cos(a) * 11, y = 20 + Math.sin(a) * 6; L.push(part(sC(x, y, 2.6), 'body')); }
    L.push(...ldots(9, 17, 23, 23, u ? '#222' : '#5a3a1c'), ...ldots(9, 23, 23, 17, u ? '#2a2a2a' : '#6a4a2c'), ...rdots(11, 20, 10, 2, u ? '#444' : '#2a1a10'));
    if (!u) L.push(dot(13, 18, '#ff8a1f'), dot(19, 19, '#ffd91f'), dot(16, 21, '#ff6a1f'));
    return L;
  },
  event: (P, u) => {
    const L = [part(sB(5, 22, 2.2, 7), 'dark'), part(sB(27, 22, 2.2, 7), 'dark'), part(sB(16, 26, 13, 3, 1), 'body'), part(sB(16, 21, 10, 3, 1), 'body'), part(sB(16, 16, 7, 3, 1), 'dark'), part(sC(16, 11, 4.2), 'body'), part(sC(16, 11, 2.2), 'dark')];
    if (!u) L.push(...rdots(15, 19, 2, 5, P.a), ...rdots(9, 22, 2, 2, P.a), ...rdots(21, 22, 2, 2, P.a), dot(16, 11, P.c));
    return L;
  },
  curse: (P, u) => {
    const L = [part(sB(16, 29, 10, 2.5, 0.5), 'body'), part(sP([[11, 4], [21, 4], [24, 28], [8, 28]]), 'dark')];
    L.push(...ldots(13, 8, 12, 16, P.d), ...ldots(20, 10, 21, 20, P.d));
    if (!u) L.push(...rdots(15, 7, 2, 16, P.a), ...rdots(12, 12, 8, 2, P.a), ...rdots(13, 18, 6, 2, P.a), dot(16, 14, P.c), dot(15, 14, P.c));
    return L;
  },
};

const Sprites = {
  cache: {},
  build(n, list, P) {
    const c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'), img = g.createImageData(n, n), px = new Array(n * n).fill(null);
    for (const pt of list) {
      if (pt.dot) { const [x, y, col] = pt.dot; px[y * n + x] = col; continue; }
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const d = pt.d(x + 0.5, y + 0.5);
        if (d > 0) continue;
        let col;
        if (pt.kind === 'cy') col = P.c;
        else if (pt.kind === 'acc') col = d > -1 ? P.a : P.m;
        else if (d > -1) col = P.b;
        else if (pt.kind === 'body' && d > -2) col = P.m;
        else col = P.d;
        px[y * n + x] = col;
      }
    }
    for (let i = 0; i < px.length; i++) if (px[i]) { const v = parseInt(px[i].slice(1), 16); img.data.set([v >> 16 & 255, v >> 8 & 255, v & 255, 255], i * 4); }
    g.putImageData(img, 0, 0);
    return c;
  },
  // key: hero id, 'e:<type>' or 'b:<act>'
  get(key) {
    if (this.cache[key]) return this.cache[key];
    let c;
    if (HEROES[key]) c = this.build(SPR, HERO_ART[key](SPAL[HEROES[key].clan]), SPAL[HEROES[key].clan]);
    else if (key[0] === 'o') { const [nm, used] = key.slice(2).split('_'), PP = used ? OPAL_USED : OPAL[nm]; c = this.build(32, OBJ_ART[nm](PP, !!used), PP); }
    else if (key[0] === 'e') { const a = ENEMY_ART[key.slice(2)], pal = a.pal || EPAL; c = this.build(a.n, a.f(pal), pal); }
    else { const k = +key.slice(2), a = BOSS_ART[BOSS_ART_OF[k]]; c = this.build(a.n, a.f(BPAL[k]), BPAL[k]); }
    return this.cache[key] = c;
  },
  corpse(key) {   // darkened copy for bodies lying on the floor
    const k = key + '#c'; if (this.cache[k]) return this.cache[k];
    const sp = this.get(key), c = document.createElement('canvas'); c.width = sp.width; c.height = sp.height; const g = c.getContext('2d');
    g.drawImage(sp, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, c.width, c.height);
    return this.cache[k] = c;
  },
  white(key) {
    if (this.cache[key + '#w']) return this.cache[key + '#w'];
    const s = this.get(key), c = document.createElement('canvas'); c.width = s.width; c.height = s.height; const g = c.getContext('2d');
    g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    return this.cache[key + '#w'] = c;
  },
  url(id) { return this.get(id).toDataURL(); },
  // 16 fixed facing directions, rotated at native resolution (clean pixels, no shimmer)
  rot(key, ang, flash) {
    const N = 16, idx = ((Math.round(ang / (Math.PI * 2) * N) % N) + N) % N, k = key + (flash ? '#w@' : '@') + idx;
    if (this.cache[k]) return this.cache[k];
    const src = flash ? this.white(key) : this.get(key), n = src.width, m = 2 * Math.ceil(n * 0.75);
    const c = document.createElement('canvas'); c.width = c.height = m; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.translate(m / 2, m / 2); g.rotate(idx * Math.PI * 2 / N); g.drawImage(src, -n / 2, -n / 2);
    return this.cache[k] = c;
  },
  // Small stepped glow ball: core ice, mid colour, dim edge
  orb(R, col) {
    const k = 'o' + R + col; if (this.cache[k]) return this.cache[k];
    const n = R * 2 + 1, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - R, y - R);
      if (d > R + 0.3) continue;
      g.fillStyle = d <= R * 0.45 ? ICE : d <= R * 0.8 ? col : col + '99'; g.fillRect(x, y, 1, 1);
    }
    return this.cache[k] = c;
  },
  // Checkerboard-dithered disc (telegraph areas, zones); r in stage pixels, drawn on a 2px grid
  disc(r, col) {
    const k = 'd' + r + col; if (this.cache[k]) return this.cache[k];
    const n = Math.ceil(r / 2) * 2 + 2, c = document.createElement('canvas'); c.width = c.height = n * 2; const g = c.getContext('2d'); g.fillStyle = col;
    for (let y = 0; y < n * 2; y += 2) for (let x = 0; x < n * 2; x += 2) { if (((x + y) / 2) % 2) continue; if (Math.hypot(x + 1 - n, y + 1 - n) < r) g.fillRect(x, y, 2, 2); }
    return this.cache[k] = c;
  },
  blade(col) {
    const k = 'bl' + col; if (this.cache[k]) return this.cache[k];
    const P = { b: col, m: col, d: '#0a0f26', a: ICE, c: ICE };
    return this.cache[k] = this.build(11, [part(sStar(5.5, 5.5, 4, 5.4, 1.8, 0.4), 'dark'), part(sC(5.5, 5.5, 1.3), 'acc')], P);
  },
};
