// Hero sprites: 24x24 pixel-art robots, drawn at load from shape lists (no image files).
// Evolution look: bright outer edge, dimmer inner edge, dark fill, cyan marker in the facing direction (sprites face RIGHT, the game rotates them).
const SPR = 24;
const SPAL = {
  bio:   { b: '#7dff4a', m: '#3fa31f', d: '#12300c', a: '#d0ff6a', x: '#ff5ad2' },
  steam: { b: '#ffb347', m: '#b8661a', d: '#3a2008', a: '#ffe08a', x: '#ff6a2a' },
  solar: { b: '#ffe94a', m: '#b8a31a', d: '#3a3408', a: '#39ff6e', x: '#ff9a3a' },
  cyber: { b: '#ff3de8', m: '#a01a90', d: '#2a0826', a: '#3de8ff', x: '#ffffff' },
  void:  { b: '#a06bff', m: '#6a3ad0', d: '#1c0d3a', a: '#e0b0ff', x: '#ffffff' },
  aqua:  { b: '#4fe0d0', m: '#2a8a86', d: '#0c3030', a: '#b0fff0', x: '#ff8a3a' },
  iron:  { b: '#b4bcc8', m: '#5e6674', d: '#1c2028', a: '#ffd91f', x: '#ff8a3a' },
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


// ---------- Fish, Crystal, Plant, Robot: same top-down look as the other heroes (bright edge, dark fill, cyan weapon marker, facing right) ----------
const sE = (cx, cy, rx, ry) => (x, y) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
const HERO_FRONT = {};   // no front-view heroes: everyone is drawn from above and turns towards the cursor
HERO_ART.sun = P => [   // fish, built like the plant: spiky fins instead of leaves, open jaws with teeth
  part(sP([[0.5, 6], [8.5, 10.5], [3, 12]]), 'dark'), part(sP([[0.5, 18], [8.5, 13.5], [3, 12]]), 'dark'),
  part(sP([[5, 2], [11.5, 8], [4, 10.5]]), 'dark'), part(sP([[5, 22], [11.5, 16], [4, 13.5]]), 'dark'),
  part(sE(10.5, 12, 7, 5.8), 'body'), part(sE(9.5, 12, 3.4, 2.6), 'dark'), dot(8, 11, P.a), dot(10, 13, P.a), dot(11, 11, P.x),
  part(sC(14.8, 7.6, 1.9), 'acc'), part(sC(14.8, 16.4, 1.9), 'acc'), dot(15, 7, '#ffffff'), dot(15, 17, '#ffffff'),
  part(sP([[14, 9.6], [22.5, 9], [17.4, 11.8]]), 'acc'), part(sP([[14, 14.4], [22.5, 15], [17.4, 12.2]]), 'acc'),
  dot(19, 10, P.a), dot(21, 10, P.a), dot(19, 14, P.a), dot(21, 14, P.a), part(sB(18.4, 12, 2.9, 0.7), 'cy'), dot(23, 12, CY),
];
HERO_ART.gunner = P => [   // crystal
  part(sStar(11.5, 12, 6, 11, 6.4, 0.3), 'dark'),
  part(sP([[3.5, 12], [8, 4.8], [15, 4.8], [19.5, 12], [15, 19.2], [8, 19.2]]), 'body'),
  part(sLine(8, 4.8, 11.5, 12, 0.45), 'acc'), part(sLine(15, 4.8, 11.5, 12, 0.45), 'acc'), part(sLine(11.5, 12, 8, 19.2, 0.45), 'acc'), part(sLine(11.5, 12, 15, 19.2, 0.45), 'acc'),
  part(sC(11.5, 12, 2.7), 'acc'), dot(10, 10, ICE), dot(11, 11, ICE),
  part(sB(18.6, 12, 2.6, 1.5), 'dark'), part(sB(22, 12, 1.3, 1), 'cy'), dot(23, 12, CY),
];
HERO_ART.weaver = P => [   // plant: leaves around a bulb with a flytrap mouth
  part(sP([[2.5, 3.5], [11.5, 8], [5, 11]]), 'dark'), part(sP([[2.5, 20.5], [11.5, 16], [5, 13]]), 'dark'),
  part(sP([[0.8, 8.5], [8, 10.5], [3, 12]]), 'dark'), part(sP([[0.8, 15.5], [8, 13.5], [3, 12]]), 'dark'),
  part(sC(10.5, 12, 6.2), 'body'), part(sC(10.5, 12, 2.6), 'dark'), dot(9, 11, P.x), dot(10, 13, P.x), dot(7, 12, P.a),
  part(sP([[13, 5.6], [22.5, 9.2], [17, 11.2]]), 'acc'), part(sP([[13, 18.4], [22.5, 14.8], [17, 12.8]]), 'acc'),
  dot(19, 10, P.a), dot(21, 10, P.a), dot(19, 14, P.a), dot(21, 14, P.a), part(sB(17.5, 12, 3.2, 0.7), 'cy'), dot(23, 12, CY),
];
HERO_ART.brute = P => [   // robot: four angular legs like leaves, a core, and a pincer jaw around the barrel (like the plant, but metal)
  part(sP([[2.5, 3], [11, 8], [5, 11]]), 'dark'), part(sP([[2.5, 21], [11, 16], [5, 13]]), 'dark'),
  part(sP([[10, 1.5], [14.8, 7.6], [8, 9]]), 'dark'), part(sP([[10, 22.5], [14.8, 16.4], [8, 15]]), 'dark'),
  part(sB(10, 12, 6.6, 5.2, 1.4), 'body'), part(sB(8.8, 12, 3, 3, 0.5), 'dark'), dot(7, 10, P.a), dot(7, 14, P.a), dot(9, 12, P.x),
  part(sP([[14, 6.8], [22.5, 9.8], [17.6, 11.2]]), 'acc'), part(sP([[14, 17.2], [22.5, 14.2], [17.6, 12.8]]), 'acc'),
  part(sB(16.4, 12, 2.2, 2.2, 0.6), 'dark'), dot(16, 12, P.x), dot(19, 10, P.a), dot(19, 14, P.a), part(sB(19.6, 12, 2, 0.7), 'cy'), dot(23, 12, CY),
];

const WEAPON_ART = {};   // (old hero-shaped weapon art removed: every weapon, also the late-game ones, has its own gun drawing below)

// ---------- weapon sprites: every weapon gets its own pixel drawing (32x16, pointing right, dark outline) ----------
const WEAPON_SHAPE = {
  revolver: 'revolver', popgun: 'pistol', machinegun: 'smg', rifle: 'rifle', smartgun: 'smart', heavyrevolver: 'bigrevolver', bouncersmg: 'smg', triplemg: 'smg3', heavymg: 'hmg', sniper: 'sniper', minigun: 'minigun',
  shotgun: 'shotgun', sawedoff: 'sawed', doubleshotgun: 'double', slugger: 'slug', autoshotgun: 'drum', superslugger: 'bigslug', bouncershotgun: 'shotgun', flak: 'flak', eraser: 'eraser',
  crossbow: 'crossbow', splinter: 'crossbow', autocrossbow: 'autocross', disc: 'disc', supersplinter: 'autocross', heavycrossbow: 'bigcross',
  grenade: 'launcher', bazooka: 'tube', rocket: 'smalltube', seeker: 'seeker', heavygrenade: 'biglauncher', hyper: 'hyper', nuke: 'nuke',
  laserpistol: 'laser', plasmagun: 'plasma', lightningpistol: 'lightning', laserrifle: 'laserrifle', plasmarifle: 'plasmarifle', lightningrifle: 'lightrifle', plasmacannon: 'cannon', lightningcannon: 'lightcannon',
  wrench: 'wrench', shovel: 'shovel', bat: 'bat', machete: 'machete', screwdriver: 'screwdriver', axe: 'axe', sledge: 'hammer', chainsaw: 'chainsaw', katana: 'katana', energysword: 'ebl', energyhammer: 'ehammer',
  maw: 'maw', needle: 'needle', eggcannon: 'eggcannon', boilercannon: 'boilercannon',
};
function makeWeaponSprite(id) {
  const w = (HEROES['w_' + id] || HEROES.w_revolver).weapon, shape = WEAPON_SHAPE[id] || 'pistol', am = ammoOf(w), A = am ? AMMO[am].col : '#c8ccd8';
  const c = document.createElement('canvas'); c.width = 34; c.height = 18; const g = c.getContext('2d');
  const M = '#8a909e', D = '#30323c', L = '#c8ccd8', W = '#8a5a2a', K = '#4a3220', G = '#e8ffff', S = '#d8dce8';
  const r = (col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x + 1, y + 1, ww, hh); };
  const ring = (col, cx, cy, rad) => { g.fillStyle = col; g.beginPath(); g.arc(cx + 1, cy + 1, rad, 0, 6.283); g.fill(); };
  const gun = (len, thick) => { r(D, 8, 6, len, thick); r(M, 8, 6, len, 1); };
  switch (shape) {
    case 'pistol': gun(13, 3); r(W, 9, 9, 4, 5); r(D, 20, 7, 3, 2); r(A, 12, 6, 3, 1); break;
    case 'revolver': gun(20, 3); ring(D, 14, 7, 4); ring(M, 14, 7, 3); ring(D, 14, 7, 1.2); r(W, 8, 9, 4, 5); r(L, 28, 6, 2, 1); r(A, 22, 6, 4, 1); break;
    case 'bigrevolver': gun(22, 4); ring(D, 15, 7, 5); ring(M, 15, 7, 4); ring(D, 15, 7, 1.6); r(W, 8, 10, 5, 5); r(A, 22, 6, 5, 1); break;
    case 'smg': gun(16, 4); r(D, 13, 10, 3, 5); r(A, 13, 10, 3, 1); r(D, 3, 7, 6, 2); r(W, 8, 10, 3, 4); r(L, 24, 6, 3, 2); break;
    case 'smg3': gun(15, 4); r(D, 23, 5, 5, 1); r(D, 23, 8, 5, 1); r(D, 13, 10, 3, 5); r(A, 13, 10, 3, 1); r(D, 3, 7, 6, 2); break;
    case 'rifle': gun(22, 4); r(W, 0, 7, 9, 4); r(D, 14, 10, 3, 5); r(A, 14, 10, 3, 1); r(D, 11, 3, 8, 2); r(L, 28, 7, 3, 2); break;
    case 'smart': gun(21, 4); r(W, 0, 7, 9, 4); r(D, 13, 3, 7, 3); r(A, 14, 4, 5, 1); r(D, 14, 10, 3, 5); r(L, 27, 7, 3, 2); break;
    case 'hmg': gun(21, 5); r(D, 4, 7, 6, 3); r(D, 14, 11, 7, 4); r(A, 14, 11, 7, 1); r(L, 27, 7, 4, 3); r(M, 10, 4, 6, 2); break;
    case 'sniper': gun(26, 3); r(W, 0, 7, 8, 4); r(D, 11, 2, 11, 3); r(L, 11, 2, 1, 3); r(L, 21, 2, 1, 3); r(D, 10, 9, 3, 5); r(D, 4, 11, 4, 2); r(L, 31, 6, 1, 3); break;
    case 'minigun': r(D, 4, 4, 5, 8); r(M, 4, 4, 5, 1); r(D, 9, 5, 21, 2); r(D, 9, 8, 21, 2); r(M, 9, 5, 21, 1); r(M, 9, 8, 21, 1); r(L, 28, 4, 3, 7); r(A, 12, 11, 5, 2); break;
    case 'shotgun': r(D, 12, 6, 19, 2); r(M, 12, 6, 19, 1); r(D, 12, 8, 14, 1); r(W, 15, 9, 8, 3); r(W, 1, 8, 12, 4); r(D, 11, 7, 3, 3); r(A, 28, 5, 3, 1); break;
    case 'sawed': r(D, 10, 6, 15, 2); r(D, 10, 8, 15, 2); r(M, 10, 6, 15, 1); r(W, 5, 8, 7, 4); r(W, 2, 10, 4, 3); r(A, 24, 5, 2, 1); break;
    case 'double': r(D, 8, 5, 22, 2); r(D, 8, 7, 22, 2); r(M, 8, 5, 22, 1); r(W, 12, 9, 9, 3); r(W, 0, 8, 10, 4); r(A, 28, 4, 3, 1); break;
    case 'slug': r(D, 9, 5, 22, 4); r(M, 9, 5, 22, 1); r(W, 1, 8, 10, 4); r(W, 14, 9, 8, 3); r(A, 26, 4, 4, 1); r(L, 30, 5, 1, 4); break;
    case 'bigslug': r(D, 8, 4, 23, 6); r(M, 8, 4, 23, 1); r(W, 0, 8, 10, 5); r(W, 14, 10, 9, 3); r(A, 24, 3, 6, 1); r(L, 30, 4, 1, 6); break;
    case 'drum': r(D, 10, 6, 20, 3); r(M, 10, 6, 20, 1); ring(D, 17, 12, 4); ring(M, 17, 12, 3); ring(D, 17, 12, 1); r(W, 1, 8, 10, 4); r(A, 27, 5, 3, 1); break;
    case 'flak': r(D, 8, 5, 18, 5); r(M, 8, 5, 18, 1); r(D, 26, 3, 5, 9); r(L, 26, 3, 5, 1); r(W, 1, 8, 8, 4); r(A, 12, 4, 6, 1); r(D, 12, 10, 4, 4); break;
    case 'eraser': r(D, 6, 3, 22, 9); r(M, 6, 3, 22, 1); r(D, 28, 2, 3, 11); r(A, 8, 5, 18, 2); r(A, 8, 9, 18, 2); r(W, 0, 7, 6, 4); r(D, 12, 12, 4, 3); break;
    case 'crossbow': r(W, 3, 7, 22, 3); r(M, 3, 7, 22, 1); r(D, 18, 1, 3, 14); r(M, 18, 1, 1, 14); r(L, 21, 3, 8, 1); r(L, 21, 12, 8, 1); r(A, 8, 5, 18, 1); r(D, 10, 10, 3, 4); break;
    case 'autocross': r(W, 2, 7, 22, 3); r(M, 2, 7, 22, 1); r(D, 19, 1, 3, 14); r(L, 22, 3, 8, 1); r(L, 22, 12, 8, 1); r(D, 9, 3, 8, 4); r(A, 10, 4, 6, 1); r(A, 8, 5, 18, 1); break;
    case 'bigcross': r(W, 2, 7, 26, 4); r(M, 2, 7, 26, 1); r(D, 20, 0, 4, 16); r(M, 20, 0, 1, 16); r(L, 24, 2, 8, 1); r(L, 24, 13, 8, 1); r(A, 6, 5, 24, 2); r(D, 9, 11, 3, 4); break;
    case 'disc': r(D, 4, 6, 14, 4); r(M, 4, 6, 14, 1); r(W, 2, 9, 5, 4); ring(S, 24, 8, 6); ring(D, 24, 8, 3); ring(A, 24, 8, 1.6); r(S, 29, 7, 3, 2); break;
    case 'launcher': r(D, 6, 5, 20, 6); r(M, 6, 5, 20, 1); ring(M, 14, 12, 4); ring(D, 14, 12, 2.4); r(W, 3, 8, 4, 6); r(L, 26, 4, 5, 8); r(A, 8, 6, 10, 1); break;
    case 'biglauncher': r(D, 4, 3, 24, 9); r(M, 4, 3, 24, 1); ring(M, 12, 13, 4.5); ring(D, 12, 13, 2.6); r(W, 1, 8, 4, 6); r(L, 28, 2, 4, 11); r(A, 7, 5, 14, 2); break;
    case 'tube': r(D, 0, 4, 30, 7); r(M, 0, 4, 30, 1); r(L, 28, 2, 4, 11); r(D, 10, 11, 3, 5); r(W, 9, 14, 5, 1); r(D, 12, 1, 8, 3); r(A, 3, 6, 10, 1); break;
    case 'smalltube': r(D, 4, 5, 24, 5); r(M, 4, 5, 24, 1); r(L, 26, 4, 5, 7); r(D, 10, 10, 3, 5); r(A, 6, 6, 9, 1); r(D, 1, 6, 4, 3); break;
    case 'seeker': r(D, 2, 5, 25, 6); r(M, 2, 5, 25, 1); r(L, 25, 3, 5, 10); ring(D, 12, 3, 3); ring(A, 12, 3, 1.6); r(D, 9, 11, 3, 4); r(A, 4, 7, 12, 1); break;
    case 'hyper': r(D, 2, 3, 26, 3); r(D, 2, 7, 26, 3); r(D, 2, 11, 26, 3); r(M, 2, 3, 26, 1); r(M, 2, 7, 26, 1); r(M, 2, 11, 26, 1); r(L, 28, 3, 3, 11); r(A, 4, 5, 20, 1); break;
    case 'nuke': r(D, 0, 3, 31, 10); r(M, 0, 3, 31, 1); r(A, 5, 4, 4, 8); r(A, 13, 4, 4, 8); r(A, 21, 4, 4, 8); r(L, 29, 1, 3, 14); r(D, 12, 13, 4, 3); ring(S, 6, 1, 2); break;
    case 'laser': r(D, 8, 5, 16, 4); r(M, 8, 5, 16, 1); r(G, 24, 6, 6, 2); r(A, 22, 5, 2, 4); r(W, 8, 9, 4, 5); r(A, 12, 6, 6, 1); break;
    case 'laserrifle': r(D, 4, 5, 24, 4); r(M, 4, 5, 24, 1); r(G, 28, 6, 4, 2); r(A, 25, 4, 3, 6); r(D, 0, 6, 5, 3); r(D, 12, 9, 3, 5); r(A, 8, 6, 12, 1); break;
    case 'plasma': r(D, 8, 5, 14, 5); r(M, 8, 5, 14, 1); ring(A, 25, 8, 4); ring(G, 25, 8, 2); r(W, 8, 10, 4, 4); break;
    case 'plasmarifle': r(D, 3, 5, 22, 5); r(M, 3, 5, 22, 1); ring(A, 27, 8, 4.5); ring(G, 27, 8, 2.2); r(D, 0, 6, 4, 3); r(D, 11, 10, 3, 5); r(A, 6, 7, 14, 1); break;
    case 'lightning': r(D, 8, 6, 12, 4); r(M, 8, 6, 12, 1); r(A, 20, 4, 2, 8); r(A, 26, 4, 2, 8); r(G, 22, 7, 4, 2); r(A, 23, 3, 2, 2); r(A, 23, 11, 2, 2); r(W, 8, 10, 4, 4); break;
    case 'lightrifle': r(D, 3, 6, 18, 4); r(M, 3, 6, 18, 1); r(A, 21, 3, 2, 10); r(A, 28, 3, 2, 10); r(G, 23, 7, 5, 2); r(A, 24, 1, 2, 2); r(A, 24, 13, 2, 2); r(D, 10, 10, 3, 5); r(D, 0, 7, 4, 3); break;
    case 'cannon': r(D, 2, 3, 24, 10); r(M, 2, 3, 24, 1); ring(A, 29, 8, 5); ring(G, 29, 8, 2.6); r(D, 8, 13, 4, 3); r(A, 5, 5, 16, 2); break;
    case 'lightcannon': r(D, 2, 4, 22, 8); r(M, 2, 4, 22, 1); r(A, 24, 1, 3, 14); r(A, 30, 1, 2, 14); r(G, 27, 7, 3, 2); r(D, 8, 12, 4, 4); r(A, 5, 6, 14, 2); break;
    case 'wrench': r(D, 4, 7, 20, 3); r(S, 4, 7, 20, 1); r(M, 22, 3, 8, 11); r(D, 25, 6, 5, 5); r(S, 22, 3, 8, 1); break;
    case 'shovel': r(W, 2, 7, 18, 3); r(D, 2, 7, 18, 1); r(M, 20, 3, 11, 11); r(S, 20, 3, 11, 1); r(D, 22, 7, 7, 1); break;
    case 'bat': r(W, 2, 7, 18, 3); r(K, 2, 9, 18, 1); r(W, 18, 5, 12, 7); r(K, 18, 11, 12, 1); r(L, 18, 5, 12, 1); break;
    case 'machete': r(K, 2, 7, 8, 3); r(D, 9, 5, 3, 7); r(S, 12, 5, 18, 5); r(L, 12, 5, 18, 1); r(M, 12, 9, 18, 1); break;
    case 'katana': r(K, 2, 7, 8, 3); r(D, 9, 5, 3, 7); r(S, 12, 7, 20, 2); r(L, 12, 7, 20, 1); break;
    case 'screwdriver': r(A, 2, 6, 10, 5); r(D, 2, 6, 10, 1); r(M, 12, 8, 17, 1); r(S, 12, 8, 17, 1); r(L, 29, 7, 3, 3); break;
    case 'axe': r(W, 3, 7, 22, 3); r(K, 3, 9, 22, 1); r(M, 20, 2, 10, 12); r(S, 20, 2, 10, 1); r(D, 22, 5, 3, 6); break;
    case 'hammer': r(W, 2, 7, 22, 3); r(K, 2, 9, 22, 1); r(M, 20, 2, 11, 12); r(S, 20, 2, 11, 1); r(D, 24, 4, 3, 8); break;
    case 'chainsaw': r(D, 2, 4, 12, 9); r(A, 3, 5, 5, 3); r(M, 13, 6, 18, 5); r(S, 13, 6, 18, 1); r(D, 13, 11, 18, 1); for (let x = 14; x < 31; x += 3) r(L, x, 5, 1, 1); break;
    case 'ebl': r(K, 2, 7, 7, 3); r(D, 8, 4, 3, 9); r(A, 11, 6, 20, 5); r(G, 11, 7, 20, 3); r(A, 11, 6, 20, 1); break;
    case 'ehammer': r(K, 2, 7, 18, 3); r(A, 18, 1, 13, 14); r(G, 20, 3, 9, 10); r(D, 18, 1, 13, 1); break;
    case 'maw': r(D, 2, 5, 12, 7); r(W, 0, 7, 4, 4); ring('#3fa31f', 14, 8, 6); ring('#6cf03a', 14, 7, 4); ring(D, 14, 8, 2.4); r('#6cf03a', 18, 2, 13, 3); r('#6cf03a', 18, 11, 13, 3); r('#3fa31f', 18, 4, 13, 1); r('#3fa31f', 18, 10, 13, 1); for (let x = 20; x < 30; x += 3) { r(S, x, 5, 1, 2); r(S, x + 1, 8, 1, 2); } break;
    case 'needle': r(D, 3, 5, 27, 2); r(D, 3, 8, 27, 2); r(D, 3, 11, 27, 2); r(M, 3, 5, 27, 1); r(A, 6, 6, 20, 1); r(A, 6, 9, 20, 1); r(A, 6, 12, 20, 1); r(L, 30, 5, 3, 1); r(L, 30, 8, 3, 1); r(L, 30, 11, 3, 1); r(D, 1, 4, 5, 10); r(W, 4, 13, 4, 4); break;
    case 'eggcannon': ring(S, 11, 8, 7); ring('#c8a050', 11, 9, 4); ring(D, 11, 8, 2); r(D, 17, 5, 14, 6); r(M, 17, 5, 14, 1); r(L, 30, 4, 3, 8); r(A, 20, 7, 8, 1); r(W, 1, 10, 5, 4); break;
    case 'boilercannon': ring('#b0603a', 10, 8, 8); ring('#e08a50', 10, 7, 5); ring(D, 10, 8, 2.6); r(D, 17, 4, 15, 8); r(M, 17, 4, 15, 1); r('#ff8a1f', 29, 2, 3, 12); r(A, 19, 7, 8, 2); r(D, 6, 15, 8, 2); r(L, 2, 6, 3, 4); break;
    default: gun(14, 3); r(W, 9, 9, 4, 5);
  }
  // dark outline around everything that was drawn
  const img = g.getImageData(0, 0, 34, 18), px = img.data, out = new Uint8ClampedArray(px);
  for (let y = 0; y < 18; y++) for (let x = 0; x < 34; x++) {
    if (px[(y * 34 + x) * 4 + 3]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < 34 && ny < 18 && px[(ny * 34 + nx) * 4 + 3]) { out.set([12, 12, 18, 255], (y * 34 + x) * 4); break; } }
  }
  g.putImageData(new ImageData(out, 34, 18), 0, 0);
  return c;
}

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
// ---------- enemies in the style of the original's wasteland creatures, seen from above like the heroes ----------
const ENEMY_ART = {
  raider: { n: 16, pal: { b: '#c05a3a', m: '#7a2a1a', d: '#2a1008', a: '#ffd0b0', c: '#ffd91f', x: '#3a3a44' }, f: P => [
    part(sLine(2.5, 5, 2.5, 11, 0.7), 'dark'), part(sE(6, 8, 3.4, 4.6), 'body'), part(sC(7.8, 8, 2.4), 'dark'), dot(9, 7, P.c), dot(9, 9, P.c),
    part(sB(11.6, 8.8, 4.6, 0.9, 0.3), 'acc'), part(sB(14.8, 8.8, 1.2, 0.7), 'cy')] },
  crab: { n: 18, pal: { b: '#d06a4a', m: '#8a3a28', d: '#2a1008', a: '#ffc0a0', c: '#ffd91f', x: '#6a3a2a' }, f: P => [
    part(sLine(4, 4.4, 1.6, 2, 0.55), 'dark'), part(sLine(7, 3.6, 5.6, 1, 0.55), 'dark'), part(sLine(4, 13.6, 1.6, 16, 0.55), 'dark'), part(sLine(7, 14.4, 5.6, 17, 0.55), 'dark'),
    part(sE(8, 9, 5.6, 5), 'body'), part(sE(8, 9, 3.2, 2.8), 'dark'), dot(6, 8, P.a), dot(9, 10, P.a),
    part(sP([[11, 3], [17, 3.4], [15.4, 6.8], [11.6, 6]]), 'acc'), part(sP([[11, 15], [17, 14.6], [15.4, 11.2], [11.6, 12]]), 'acc'), dot(13, 8, P.c), dot(13, 10, P.c)] },
  frostwolf: { n: 16, pal: { b: '#bfe6ff', m: '#6aa0cc', d: '#1a2c40', a: '#ffffff', c: '#ff4a4a', x: '#4a6a90' }, f: P => [
    part(sLine(1.6, 8, 0.3, 5.6, 0.8), 'acc'), part(sE(6, 8, 5, 2.8), 'body'), part(sP([[9.6, 5.6], [15.4, 7.2], [15.4, 8.8], [9.6, 10.4]]), 'body'),
    part(sP([[8.6, 5.4], [10, 2.8], [11.2, 5.6]]), 'dark'), part(sP([[8.6, 10.6], [10, 13.2], [11.2, 10.4]]), 'dark'), dot(12, 6.6, P.c), dot(12, 9.4, P.c), dot(15, 8, P.d)] },
  icetower: { n: 18, pal: { b: '#8ae8ff', m: '#3a8ab0', d: '#0e2a3a', a: '#e6fdff', c: '#ffffff', x: '#ff2d3d' }, f: P => [
    part(sStar(9, 9, 8.4, 5, 6, 0), 'body'), part(sStar(9, 9, 5.4, 3.2, 6, 0.5), 'acc'), part(sC(9, 9, 2.4), 'dark'), dot(9, 9, P.x)] },
  smelter: { n: 26, pal: { b: '#e0762a', m: '#903a10', d: '#2a1008', a: '#ffd0a0', c: '#ffd91f', x: '#3a3a44' }, f: P => [
    part(sE(11, 13, 9.4, 8), 'body'), part(sE(11, 13, 6, 5), 'dark'), part(sB(17, 5.6, 4, 2, 0.4), 'acc'), part(sB(17, 20.4, 4, 2, 0.4), 'acc'),
    part(sC(20, 13, 3.4), 'dark'), dot(21, 12, P.c), dot(21, 14, P.c), part(sB(23.4, 13, 2.2, 0.9), 'cy'), dot(8, 9, P.a), dot(8, 17, P.a), dot(13, 13, P.a)] },
  drone: { n: 14, pal: { b: '#3de8c8', m: '#1a8a78', d: '#08302a', a: '#b0fff0', c: '#ff3a3a', x: '#ffd91f' }, f: P => [
    part(sB(3, 2.4, 2.4, 0.8, 0.3), 'acc'), part(sB(3, 11.6, 2.4, 0.8, 0.3), 'acc'), part(sC(7, 7, 3.6), 'body'), part(sC(7, 7, 1.8), 'dark'), dot(9, 7, P.c), part(sB(11, 7, 1.6, 0.5), 'cy')] },
  laser: { n: 18, pal: { b: '#ff3de8', m: '#8a1a78', d: '#300a2a', a: '#ffc0f4', c: '#ffffff', x: '#3de8ff' }, f: P => [
    part(sP([[2, 4], [6, 3.6], [6, 7]]), 'dark'), part(sP([[2, 14], [6, 14.4], [6, 11]]), 'dark'), part(sC(8, 9, 6), 'body'), part(sC(10, 9, 3.8), 'acc'), part(sC(11, 9, 2), 'dark'), dot(11, 9, P.x), part(sB(15.4, 9, 2.4, 0.8, 0.2), 'cy')] },
  warden: { n: 22, pal: { b: '#b24bff', m: '#6a1fd0', d: '#1c0d4a', a: '#e0b0ff', c: '#ffd91f', x: '#3de8ff' }, f: P => [
    part(sStar(11, 11, 10, 6.5, 8, 0), 'dark'), part(sC(11, 11, 6.6), 'body'), part(sC(11, 11, 4), 'acc'), part(sC(11, 11, 2), 'dark'), dot(11, 11, P.c)] },
  wraith: { n: 16, pal: { b: '#c0a0ff', m: '#7a5ad0', d: '#22104a', a: '#f0e8ff', c: '#ffffff', x: '#3de8ff' }, f: P => [
    part(sP([[0.6, 5], [6, 6.6], [6, 9.4], [0.6, 11]]), 'acc'), part(sE(7.4, 8, 4.4, 3.6), 'body'), part(sP([[8, 3.4], [13, 5], [9, 6]]), 'acc'), part(sP([[8, 12.6], [13, 11], [9, 10]]), 'acc'), dot(10, 7, P.c), dot(10, 9, P.c)] },
  grunt: { n: 16, pal: { b: '#e8e0b0', m: '#a89870', d: '#3a3220', a: '#fff4c0', c: '#ff4a2a', x: '#c8a050' }, f: P => [   // maggot
    part(sE(3.6, 8, 3, 2.6), 'body'), part(sE(7.4, 8, 3.4, 3.1), 'body'), part(sE(11.6, 8, 3.1, 2.8), 'body'),
    part(sLine(5.6, 5.4, 5.6, 10.6, 0.3), 'dark'), part(sLine(9.4, 5.2, 9.4, 10.8, 0.3), 'dark'), dot(13, 7, P.c), dot(13, 9, P.c), dot(14, 8, P.x)] },
  shooter: { n: 16, pal: { b: '#e0a050', m: '#9a6a28', d: '#3a2410', a: '#ffe0b0', c: '#ff3a3a', x: '#4a4a52' }, f: P => [   // bandit
    part(sP([[1.5, 5], [5, 7], [5, 9], [1.5, 11]]), 'dark'),
    part(sE(7, 8, 3.2, 4.8), 'body'), part(sC(7.8, 8, 2.6), 'acc'), part(sB(7.8, 8, 1, 2.8, 0.3), 'dark'), dot(9, 7, P.c), dot(9, 9, P.c),
    part(sLine(8, 4.6, 12, 7.6, 0.55), 'acc'), part(sB(13, 8.8, 3.2, 0.9, 0.3), 'dark'), part(sB(15.2, 8.8, 0.8, 0.6), 'cy')] },
  dasher: { n: 16, pal: { b: '#e8b050', m: '#a07020', d: '#3a2808', a: '#ffe8a0', c: '#ff3a3a', x: '#5a3a18' }, f: P => [   // scorpion
    part(sLine(3, 8, 1, 5, 0.7), 'acc'), part(sLine(1, 5, 3.6, 2.4, 0.7), 'acc'), dot(4, 2, P.c),
    part(sE(7, 8, 4.4, 3), 'body'),
    part(sP([[10, 5.4], [14.8, 3.2], [13, 6.8]]), 'acc'), part(sP([[10, 10.6], [14.8, 12.8], [13, 9.2]]), 'acc'),
    dot(4, 4, P.a), dot(7, 3, P.a), dot(10, 4, P.a), dot(4, 12, P.a), dot(7, 13, P.a), dot(10, 12, P.a), dot(11, 7, P.c), dot(11, 9, P.c)] },
  bomber: { n: 16, pal: { b: '#ff7050', m: '#b83a20', d: '#4a1008', a: '#ffd0b0', c: '#ffd91f', x: '#2a2a30' }, f: P => [   // exploder
    part(sStar(8, 8, 8, 7.6, 5, 0), 'dark'), part(sC(8, 8, 5), 'body'), part(sC(8, 8, 2.4), 'dark'), dot(7, 7, P.c), dot(8, 8, P.c), dot(11, 6, P.a), dot(11, 10, P.a)] },
  tank: { n: 24, pal: { b: '#6fb050', m: '#3a7a28', d: '#12300c', a: '#d8f0b0', c: '#ffd91f', x: '#5a4a2a' }, f: P => [   // gator
    part(sP([[0.5, 12], [6, 9.4], [6, 14.6]]), 'dark'),
    part(sB(8.4, 5.4, 1.8, 1.4, 0.4), 'dark'), part(sB(14, 5.4, 1.8, 1.4, 0.4), 'dark'), part(sB(8.4, 18.6, 1.8, 1.4, 0.4), 'dark'), part(sB(14, 18.6, 1.8, 1.4, 0.4), 'dark'),
    part(sE(10.5, 12, 8.4, 4.8), 'body'), part(sLine(5, 12, 15, 12, 0.5), 'dark'),
    part(sP([[17, 9.2], [23.4, 10.8], [23.4, 13.2], [17, 14.8]]), 'body'), dot(20, 10, P.a), dot(22, 10, P.a), dot(20, 14, P.a), dot(22, 14, P.a),
    part(sC(16.4, 8.2, 1.4), 'acc'), part(sC(16.4, 15.8, 1.4), 'acc'), dot(17, 8, P.c), dot(17, 16, P.c)] },
  swarmer: { n: 12, pal: { b: '#8aa0b0', m: '#506070', d: '#182028', a: '#e8f4ff', c: '#ff4a2a', x: '#ffd91f' }, f: P => [   // fly
    part(sE(4.2, 2.8, 2.6, 1.4), 'acc'), part(sE(4.2, 9.2, 2.6, 1.4), 'acc'),
    part(sE(6, 6, 3.4, 2.4), 'body'), dot(8, 5, P.c), dot(8, 7, P.c)] },
  spitter: { n: 16, pal: { b: '#a0d840', m: '#5a8a1a', d: '#1c3008', a: '#f0ff98', c: '#ffd91f', x: '#ff6a8a' }, f: P => [   // toxic frog
    part(sP([[2.4, 2.4], [6.6, 5], [2, 6.6]]), 'dark'), part(sP([[2.4, 13.6], [6.6, 11], [2, 9.4]]), 'dark'),
    part(sE(7.4, 8, 5.2, 4.8), 'body'), part(sE(7, 8, 2.4, 2.2), 'dark'), dot(6, 7, P.x), dot(8, 9, P.x),
    part(sC(11.6, 4.8, 1.8), 'acc'), part(sC(11.6, 11.2, 1.8), 'acc'), dot(12, 4, P.c), dot(12, 11, P.c), part(sB(13.6, 8, 1.6, 0.8, 0.2), 'dark')] },
  blob: { n: 20, pal: { b: '#e8e0b0', m: '#a89870', d: '#3a3220', a: '#fff4c0', c: '#ff4a2a', x: '#c8a050' }, f: P => [   // big maggot
    part(sE(4.4, 10, 3.8, 4), 'body'), part(sE(9.4, 10, 4.6, 5), 'body'), part(sE(14.8, 10, 4.2, 4.4), 'body'),
    part(sLine(6.8, 6, 6.8, 14, 0.3), 'dark'), part(sLine(12, 5.6, 12, 14.4, 0.3), 'dark'), part(sC(18, 10, 1.9), 'dark'), dot(17, 7, P.c), dot(17, 13, P.c), dot(18, 10, P.c)] },
  sniper: { n: 16, pal: { b: '#a060e0', m: '#5a2a9a', d: '#1c0c36', a: '#f0d8ff', c: '#ffd91f', x: '#4a4a58' }, f: P => [   // hooded sniper
    part(sP([[0.8, 5], [5, 6.4], [5, 9.6], [0.8, 11]]), 'dark'),
    part(sE(6.6, 8, 3.6, 4.4), 'body'), part(sC(7.6, 8, 2.4), 'dark'), dot(9, 7, P.c),
    part(sB(12.6, 9.4, 5.4, 0.7, 0.2), 'dark'), part(sB(15.4, 9.4, 1, 0.5), 'cy')] },
  rat: { n: 14, pal: { b: '#b08a6a', m: '#6a4a2a', d: '#241810', a: '#f0d0b0', c: '#ffd91f', x: '#e0a0a0' }, f: P => [
    part(sLine(2.4, 7, 0.4, 4.6, 0.35), 'acc'),
    part(sE(6.4, 7, 4, 2.6), 'body'), part(sP([[9, 4.4], [13, 7], [9, 9.6]]), 'body'), part(sC(9.2, 4, 1), 'acc'), part(sC(9.2, 10, 1), 'acc'), dot(11, 6, P.c), dot(11, 8, P.c),
    dot(5, 4, '#0c0c12'), dot(7, 4, '#0c0c12'), dot(5, 10, '#0c0c12'), dot(7, 10, '#0c0c12')] },
  maggot: { n: 12, pal: { b: '#e8e0b0', m: '#a89870', d: '#3a3220', a: '#fff4c0', c: '#ff4a2a', x: '#c8a050' }, f: P => [
    part(sE(3, 6, 2.4, 2.1), 'body'), part(sE(6.2, 6, 2.8, 2.5), 'body'), part(sE(9.4, 6, 2.2, 2), 'body'), dot(10, 5, P.c), dot(10, 7, P.c)] },
  turret: { n: 20, pal: { b: '#a0a8b8', m: '#5a6272', d: '#1c2028', a: '#e0e4f0', c: '#ff3a3a', x: '#ffd91f' }, f: P => [
    part(sC(10, 10, 6.8), 'body'), part(sRing(10, 10, 4.2, 0.6, 6), 'acc'), part(sC(10, 10, 2.4), 'dark'), dot(9, 9, P.c),
    part(sB(15.6, 10, 4.2, 1.5, 0.4), 'dark'), part(sB(19, 10, 1, 1), 'cy')] },
};
const BOSS_ART_OF = [0, 1, 2, 3, 4, 5];   // one unique drawing per boss
const BOSS_ART = [
  { n: 40, f: P => [   // Big Bandit: hooded brute with a huge gun
    part(sP([[2, 9], [12, 7], [12, 33], [2, 31]]), 'dark'), part(sE(18, 20, 8.5, 13), 'body'), part(sLine(11, 13, 25, 28, 1.3), 'acc'),
    part(sC(17, 8.5, 5.2), 'acc'), part(sC(17, 31.5, 5.2), 'acc'), part(sC(22, 20, 6.4), 'dark'), part(sB(25, 20, 2, 4.6, 0.6), 'cy'), dot(26, 18, P.c), dot(26, 22, P.c),
    part(sB(31, 26, 9, 2.6, 0.6), 'dark'), part(sB(27, 26, 2.4, 3.6, 0.5), 'acc'), part(sB(38, 26, 1.8, 1.6), 'cy'), dot(10, 17, P.a), dot(10, 23, P.a)] },
  { n: 40, f: P => [   // Big Fish: a huge mutant fish
    part(sP([[1, 20], [10, 10], [10, 30]]), 'dark'), part(sP([[3, 20], [9, 14.4], [9, 25.6]]), 'acc'),
    part(sP([[16, 8], [25, 2], [25, 12]]), 'dark'), part(sP([[16, 32], [25, 38], [25, 28]]), 'dark'),
    part(sE(21, 20, 15.5, 10), 'body'), part(sLine(14, 12, 14, 28, 0.8), 'dark'), part(sLine(19, 11, 19, 29, 0.8), 'dark'), part(sLine(24, 11.4, 24, 28.6, 0.8), 'dark'),
    part(sC(31, 14.4, 3.4), 'acc'), part(sC(31, 25.6, 3.4), 'acc'), dot(32, 14, P.c), dot(32, 26, P.c),
    part(sP([[33, 16], [39.6, 20], [33, 24]]), 'dark'), dot(36, 18, P.a), dot(36, 22, P.a), dot(38, 20, P.a)] },
  { n: 40, f: P => [   // Big Dog: spiked war dog
    part(sLine(6, 20, 0.8, 14, 1.6), 'acc'), part(sE(15, 20, 11.5, 9.4), 'body'), part(sB(8, 8.4, 3.6, 2, 0.6), 'dark'), part(sB(8, 31.6, 3.6, 2, 0.6), 'dark'),
    part(sB(21, 7.6, 3.6, 2, 0.6), 'dark'), part(sB(21, 32.4, 3.6, 2, 0.6), 'dark'),
    part(sC(28, 20, 7.6), 'body'), part(sB(35.4, 20, 4.6, 3.6, 0.8), 'acc'), part(sC(39, 20, 1.5), 'dark'),
    part(sP([[24, 10.6], [31, 12], [27, 15.8]]), 'dark'), part(sP([[24, 29.4], [31, 28], [27, 24.2]]), 'dark'), dot(31, 16, P.c), dot(31, 24, P.c),
    part(sStar(21, 20, 4, 9.6, 8, 0), 'dark'), dot(22, 20, P.x), dot(14, 14, P.a), dot(14, 26, P.a), dot(10, 20, P.a)] },
  { n: 40, f: P => [   // Lil Hunter: jetpack mech
    part(sB(7, 20, 4.4, 8.4, 1), 'dark'), dot(3, 17, P.x), dot(3, 23, P.x), dot(2, 20, P.c), dot(4, 20, P.c),
    part(sC(19, 20, 10.4), 'body'), part(sRing(19, 20, 9.2, 0.8, 8), 'acc'), part(sC(17, 20, 5), 'dark'),
    part(sB(25, 20, 3.4, 6, 1), 'cy'), part(sB(24, 7.6, 7, 3.2, 0.8), 'dark'), part(sB(24, 32.4, 7, 3.2, 0.8), 'dark'),
    part(sB(33.4, 7.6, 4.2, 1.4), 'cy'), part(sB(33.4, 32.4, 4.2, 1.4), 'cy'), dot(18, 16, P.a), dot(18, 24, P.a)] },
  { n: 40, f: P => [   // Technomancer: floating crystal with four orbiting orbs
    part(sLine(20, 6, 20, 34, 0.5), 'acc'), part(sLine(6, 20, 34, 20, 0.5), 'acc'),
    part(sP([[20, 5], [33, 20], [20, 35], [7, 20]]), 'dark'), part(sP([[20, 9.4], [29, 20], [20, 30.6], [11, 20]]), 'body'),
    part(sC(22, 20, 4.2), 'acc'), part(sC(23, 20, 2.2), 'dark'), dot(23, 20, P.c),
    part(sC(20, 3.4, 3.2), 'cy'), part(sC(20, 36.6, 3.2), 'cy'), part(sC(3.4, 20, 3.2), 'cy'), part(sC(36.6, 20, 3.2), 'cy'), dot(20, 3, P.c), dot(20, 37, P.c)] },
  { n: 40, f: P => [   // Nuclear Throne: a spiked throne-crown with a glaring eye
    part(sStar(20, 20, 9, 19.4, 12, 0), 'dark'), part(sStar(20, 20, 10, 15.6, 12, 0.13), 'body'), part(sC(20, 20, 10.4), 'dark'), part(sRing(20, 20, 8.4, 0.8, 8), 'acc'),
    part(sC(21, 20, 6.2), 'body'), part(sC(22.4, 20, 3.4), 'dark'), dot(23, 20, P.c), part(sB(26, 20, 1.2, 5.6), 'cy'),
    part(sP([[32, 12], [39, 20], [32, 28]]), 'cy'), dot(14, 14, P.a), dot(14, 26, P.a), dot(12, 20, P.a)] },
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
        if (pt.kind.startsWith('nt')) col = d > -1.1 ? '#0c0c12' : pt.kind === 'nta' ? P.a : pt.kind === 'ntx' ? P.x : pt.kind === 'ntc' ? P.c : pt.kind === 'ntd' ? P.d : (((x + 0.5 - n * 0.5) * 0.4 + (y + 0.5 - n * 0.5)) < -1.5 ? P.b : P.m);
        else if (pt.kind === 'cy') col = P.c;
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
    if (HEROES[key]) { const PP = HERO_FRONT[key] || SPAL[HEROES[key].clan]; c = this.build(SPR, HERO_ART[key](PP), PP); }
    else if (key.startsWith('w:')) { const a = WEAPON_ART[key.slice(2)]; if (a) { const PP = SPAL[a.clan]; c = this.build(SPR, a.f(PP), PP); } else c = makeWeaponSprite(key.slice(2)); }
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
