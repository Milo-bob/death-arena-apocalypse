// Weapon sprites: every weapon is drawn on a 68x36 canvas (pointing right), built from detailed parts (barrels with vents, wood grain, magazines with
// visible rounds, scopes with lens glints, coils, drums ...). A shading pass adds rim light, shadow and a coloured outline.
const WEAPON_W = 68, WEAPON_H = 36;
function makeWeaponSprite(id) {
  const wd = (HEROES['w_' + id] || HEROES.w_revolver).weapon, am = ammoOf(wd), A = am ? AMMO[am].col : '#c8ccd8';
  const c = document.createElement('canvas'); c.width = WEAPON_W; c.height = WEAPON_H; const g = c.getContext('2d');
  const M = '#9aa1b2', D = '#555a6a', K = '#2c2f3a', L = '#e4e8f2', W = '#a8713a', Wd = '#6b4423', BR = '#d9a441', RD = '#d6453d', GN = '#4fae3a', GL = '#eaffff', YL = '#ffd91f', OR = '#ff8a1f', BL = '#3d9bff', PU = '#b24bff';
  const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const po = (col, pts) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  const ci = (col, cx, cy, rad) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, rad, 0, 6.283); g.fill(); };
  const ln = (col, x0, y0, x1, y1, w) => { g.strokeStyle = col; g.lineWidth = w || 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const wood = (x, y, w, h) => { r(W, x, y, w, h); r(Wd, x, y + h - 2, w, 2); for (let i = 0; i < 3; i++) r(Wd, x + 2 + i * 3, y + 2 + i * 2, Math.max(2, w - 7), 1); };
  const vents = (x, y, w, h, n) => { for (let i = 0; i < n; i++) r(K, x + 1 + i * Math.floor(w / n), y + 1, 2, h - 2); };
  const teeth = (x, y, w) => { for (let i = 0; i < w; i += 3) r(L, x + i, y, 2, 1); };
  const bul = (x, y, n, col) => { for (let i = 0; i < n; i++) { r(BR, x + i * 3, y, 2, 3); r(col || A, x + i * 3, y - 1, 2, 1); } };
  const grid = (x, y, w, h) => { for (let i = 0; i < w; i += 2) for (let j = 0; j < h; j += 2) if ((i + j) % 4 === 0) r(Wd, x + i, y + j, 1, 1); };
  const coil = (x, y, w, h, col) => { for (let i = 0; i < w; i += 3) r(col, x + i, y, 2, h); };
  const bolt = (x, y, col) => { po(col, [[x, y], [x + 3, y - 1], [x + 1, y + 3], [x + 4, y + 2], [x - 1, y + 8], [x, y + 4], [x - 3, y + 5]]); };
  const grip = (x, y, col, len) => { len = len || 11; po(col || W, [[x, y], [x + 8, y], [x + 6, y + len], [x - 3, y + len - 1]]); if (!col || col === W) { r(Wd, x - 1, y + len - 3, 7, 2); grid(x, y + 2, 5, len - 5); } };
  const guard = (x, y, w) => { r(D, x, y, w, 1); r(D, x + w - 1, y, 1, 4); r(L, x + 3, y, 1, 3); };
  // generic ballistic gun built from options
  const gun = o => {
    const by = o.by || 10, bh = o.bh || 8, Lx = o.len || 60;
    if (o.stock === 'wood') { po(W, [[0, by + 3], [18, by], [18, by + bh + 1], [2, by + bh + 9]]); r(Wd, 2, by + bh + 6, 4, 2); r(BR, 0, by + 3, 2, bh + 4); grid(4, by + 3, 10, 6); }
    else if (o.stock === 'steel') { po(D, [[1, by + 2], [18, by], [18, by + bh], [6, by + bh + 6]]); r(K, 8, by + 4, 5, 2); r(L, 1, by + 2, 1, 6); }
    else if (o.stock === 'wire') { r(D, 0, by, 17, 1); r(D, 0, by + 7, 17, 1); r(D, 0, by, 1, 8); r(M, 0, by + 3, 4, 3); }
    r(M, 16, by, 24, bh); r(D, 16, by + bh - 2, 24, 2); r(K, 25, by + 2, 7, 2); r(L, 17, by + 1, 5, 1);
    r(o.acc || K, 34, by + 1, 5, 2);
    r(M, 40, by + 2, Lx - 40, 4); r(D, 40, by + 5, Lx - 40, 1);
    if (o.guard === 'vent') { r(D, 40, by + 1, Math.min(20, Lx - 44), 6); vents(40, by + 1, Math.min(20, Lx - 44), 6, 5); r(L, 40, by + 1, Math.min(20, Lx - 44), 1); }
    else if (o.guard === 'wood') wood(40, by + 3, 16, 5);
    else if (o.guard === 'rail') { r(D, 40, by + 1, 22, 2); teeth(41, by, 20); }
    if (o.muzzle === 'brake') { r(D, Lx - 3, by, 5, 8); r(K, Lx - 2, by + 1, 1, 2); r(K, Lx - 2, by + 5, 1, 2); r(L, Lx - 3, by, 5, 1); }
    else if (o.muzzle === 'flash') po(D, [[Lx - 2, by + 1], [Lx + 3, by - 1], [Lx + 3, by + 7], [Lx - 2, by + 5]]);
    else if (o.muzzle === 'supp') { r(D, Lx - 8, by, 14, 7); vents(Lx - 8, by, 14, 7, 4); r(L, Lx - 8, by, 14, 1); }
    else r(L, Lx - 1, by + 1, 2, 5);
    if (o.mag === 'straight') { r(D, 27, by + bh, 7, 11); r(K, 27, by + bh, 7, 1); bul(28, by + bh + 8, 2); }
    else if (o.mag === 'curve') { po(D, [[26, by + bh], [34, by + bh], [39, by + bh + 12], [32, by + bh + 12]]); r(A, 31, by + bh + 8, 4, 1); }
    else if (o.mag === 'drum') { ci(D, 31, by + bh + 8, 8); ci(M, 31, by + bh + 8, 6); ci(K, 31, by + bh + 8, 2); for (let i = 0; i < 6; i++) r(A, 31 + Math.cos(i * 1.05) * 4 - 0, by + bh + 8 + Math.sin(i * 1.05) * 4, 1, 1); }
    else if (o.mag === 'box') { r(D, 26, by + bh, 14, 8); r(M, 26, by + bh, 14, 1); r(o.acc || A, 28, by + bh + 4, 10, 1); }
    if (o.grip !== 'none') grip(17, by + bh, o.gripCol, 11);
    guard(26, by + bh, 9);
    if (o.optic === 'scope') { r(D, 20, by - 8, 28, 5); r(K, 20, by - 8, 28, 1); r(M, 23, by - 3, 3, 3); r(M, 42, by - 3, 3, 3); ci(GL, 48, by - 5, 3); ci(BL, 48, by - 5, 2); r(L, 24, by - 7, 16, 1); }
    else if (o.optic === 'red') { r(D, 26, by - 6, 10, 5); r(K, 28, by - 5, 6, 3); r(RD, 31, by - 4, 1, 1); r(M, 28, by - 1, 6, 1); }
    else if (o.optic === 'iron') { r(L, Lx - 5, by - 2, 2, 3); r(L, 20, by - 3, 2, 3); }
    else if (o.optic === 'handle') { r(D, 20, by - 4, 3, 4); r(D, 33, by - 4, 3, 4); r(M, 20, by - 5, 16, 2); }
    if (o.extra) o.extra();
  };
  // generic shotgun
  const sgun = o => {
    const by = o.by || 12, Lx = o.len || 62;
    if (!o.cut) { po(W, [[0, by + 2], [20, by - 1], [20, by + 7], [3, by + 12]]); r(BR, 0, by + 2, 2, 8); grid(4, by + 2, 11, 6); r(Wd, 3, by + 9, 14, 2); }
    r(M, 18, by - 2, 14, 9); r(D, 18, by + 5, 14, 2); r(L, 19, by - 1, 12, 1); r(K, 23, by, 5, 2);
    for (let i = 0; i < (o.barrels || 1); i++) { const yy = by - 1 + i * 4; r(M, 32, yy, Lx - 32, 4); r(L, 32, yy, Lx - 32, 1); r(D, 32, yy + 3, Lx - 32, 1); r(K, Lx - 2, yy + 1, 2, 2); r(D, Lx - 4, yy - 1, 5, 6); r(K, Lx - 1, yy + 1, 2, 2); }
    if (o.pump) { r(D, 32, by + 4, 20, 3); r(L, 32, by + 4, 20, 1); wood(36, by + 6, 15, 6); r(BR, 36, by + 6, 1, 6); }
    if (o.tube) { r(D, 32, by + 6, Lx - 34, 3); r(L, 32, by + 6, Lx - 34, 1); }
    if (o.drum) { ci(D, 30, by + 12, 9); ci(M, 30, by + 12, 7); ci(K, 30, by + 12, 2.5); for (let i = 0; i < 5; i++) r(RD, 30 + Math.cos(i * 1.26) * 5, by + 12 + Math.sin(i * 1.26) * 5, 2, 2); }
    if (o.wood) wood(34, by + 5, 14, 5);
    r(BR, 18, by - 2, 2, 9);
    grip(19, by + 7, o.cut ? W : K, 10);
    guard(24, by + 7, 9);
    if (o.shells) for (let i = 0; i < 4; i++) { r(RD, 10 + i * 3, by + 2 - 5 + 6, 2, 5); r(BR, 10 + i * 3, by + 2, 2, 2); }
    if (o.extra) o.extra();
  };
  // generic launcher / tube
  const tube = o => {
    const by = o.by || 8, th = o.th || 12, Lx = o.len || 64;
    r(M, 4, by, Lx - 4, th); r(L, 4, by, Lx - 4, 2); r(D, 4, by + th - 3, Lx - 4, 3);
    r(K, Lx - 4, by + 1, 5, th - 2); r(D, Lx - 6, by - 1, 3, th + 2);
    r(D, 4, by - 1, 4, th + 2); r(K, 2, by + 2, 3, th - 4);
    for (const x of o.bands || [14, 30, 46]) { r(D, x, by - 1, 3, th + 2); r(L, x, by - 1, 3, 1); }
    r(o.acc || A, 20, by + 3, 16, 2);
    grip(24, by + th, K, 10); guard(32, by + th, 9);
    r(D, 14, by - 5, 3, 5); r(L, 14, by - 6, 3, 1);
    if (o.extra) o.extra();
  };
  // generic energy gun
  const egun = o => {
    const by = o.by || 12, Lx = o.len || 50;
    po(o.paint || D, [[4, by + 1], [Lx - 8, by], [Lx - 8, by + 8], [8, by + 9]]); r(M, 6, by - 1, Lx - 16, 2); r(L, 8, by - 1, Lx - 20, 1);
    r(o.acc || A, 10, by + 3, Lx - 24, 2); r(K, 12, by + 6, 6, 2);
    grip(14, by + 9, o.paint || D, 10); guard(22, by + 9, 8);
    if (o.coil) { coil(Lx - 20, by - 2, 12, 12, M); r(A, Lx - 20, by + 4, 12, 2); }
    if (o.orb) { ci(K, Lx - 3, by + 4, o.orb + 1.5); ci(A, Lx - 3, by + 4, o.orb); ci(GL, Lx - 3, by + 4, o.orb * 0.5); r(M, Lx - 9, by + 1, 3, 7); }
    if (o.lens) { r(D, Lx - 8, by + 1, 6, 7); r(GL, Lx - 3, by + 3, 6, 2); r(A, Lx - 6, by + 1, 2, 7); }
    if (o.prongs) { r(A, Lx - 9, by - 5, 3, 7); r(A, Lx - 9, by + 7, 3, 7); r(M, Lx - 9, by + 1, 3, 6); r(A, Lx - 3, by - 3, 3, 3); r(A, Lx - 3, by + 9, 3, 3); bolt(Lx - 5, by + 1, GL); }
    if (o.stock) { po(D, [[0, by + 2], [8, by + 1], [8, by + 8], [1, by + 9]]); r(A, 1, by + 4, 3, 1); }
    if (o.extra) o.extra();
  };
  // generic crossbow
  const xbow = o => {
    const by = 14;
    po(W, [[0, by + 2], [30, by - 1], [30, by + 6], [4, by + 9]]); r(Wd, 3, by + 6, 24, 1); grid(6, by + 2, 12, 4); r(BR, 0, by + 2, 2, 6);
    r(M, 28, by - 1, 36, 4); r(L, 28, by - 1, 36, 1); r(D, 28, by + 2, 36, 1);
    const lh = o.limb || 15;
    po(D, [[40, by - 1], [44, by - 1], [48, by - lh], [44, by - lh + 1]]); po(D, [[40, by + 3], [44, by + 3], [48, by + lh + 1], [44, by + lh]]);
    r(M, 40, by - 1, 5, 5); r(L, 41, by, 3, 1);
    ln(L, 47, by - lh, 33, by + 1, 1); ln(L, 47, by + lh + 1, 33, by + 2, 1); ln(L, 33, by + 1, 33, by + 2, 1);
    for (let i = 0; i < (o.bolts || 1); i++) { const yy = by + 0 + (i - ((o.bolts || 1) - 1) / 2) * 2; r(BR, 34, yy, 26, 1); po(A, [[60, yy - 2], [66, yy + 0.5], [60, yy + 3]]); r(RD, 34, yy - 1, 2, 3); }
    r(K, 26, by + 6, 6, 5); r(M, 20, by + 3, 6, 1);
    if (o.mag) { r(D, 18, by - 8, 14, 7); r(M, 18, by - 8, 14, 1); r(A, 20, by - 5, 10, 1); r(K, 20, by - 3, 10, 1); }
    if (o.winch) { ci(D, 12, by + 5, 5); ci(M, 12, by + 5, 3); ci(K, 12, by + 5, 1); r(L, 12, by, 1, 3); }
    if (o.extra) o.extra();
  };
  // melee helpers
  const handle = (x, y, w, col) => { r(col || Wd, x, y, w, 5); r(W, x, y, w, 2); for (let i = 0; i < w; i += 3) r(K, x + i, y + 2, 1, 3); };
  const art = {
    // ---------- bullets ----------
    revolver() {
      po(W, [[8, 17], [20, 17], [17, 33], [4, 31]]); r(Wd, 7, 28, 10, 2); grid(8, 19, 7, 9); r(BR, 8, 17, 11, 2);
      r(M, 18, 8, 16, 10); r(L, 19, 9, 14, 1); r(D, 18, 15, 16, 3);
      r(M, 32, 9, 32, 5); r(L, 32, 9, 32, 1); r(D, 32, 13, 32, 1); r(K, 56, 10, 1, 3); r(A, 36, 11, 18, 1);
      r(D, 60, 7, 6, 9); r(K, 64, 10, 2, 3); r(L, 61, 7, 4, 1); r(L, 61, 4, 2, 3);
      ci(D, 25, 12, 8); ci(M, 25, 12, 6.5); for (let k = 0; k < 6; k++) ci(K, 25 + Math.cos(k * 1.047) * 4, 12 + Math.sin(k * 1.047) * 4, 1.4); ci(K, 25, 12, 1.5);
      po(D, [[14, 7], [19, 4], [20, 9]]); r(L, 17, 4, 2, 2);
      guard(22, 18, 12);
    },
    popgun() {
      grip(12, 15, W, 14); r(M, 14, 6, 30, 10); r(L, 15, 7, 28, 1); r(D, 14, 13, 30, 3); r(RD, 14, 6, 4, 10);
      po(OR, [[44, 4], [58, 0], [58, 20], [44, 17]]); r(L, 46, 5, 10, 1); r(K, 55, 4, 3, 12); ci(K, 56, 10, 4);
      r(K, 28, 8, 10, 2); r(YL, 20, 9, 6, 2); guard(22, 16, 10); r(D, 6, 8, 8, 4);
    },
    machinegun() { gun({ len: 58, stock: 'wire', mag: 'straight', guard: 'vent', muzzle: 'supp', optic: 'iron', acc: YL }); },
    rifle() { gun({ len: 64, stock: 'steel', mag: 'curve', guard: 'vent', muzzle: 'brake', optic: 'handle', acc: GN }); },
    smartgun() { gun({ len: 62, stock: 'steel', mag: 'box', guard: 'rail', muzzle: 'brake', optic: 'none', acc: A, extra() { r(K, 22, 3, 14, 7); r(GL, 24, 4, 10, 1); r(A, 24, 6, 7, 1); r(A, 24, 8, 4, 1); r(L, 22, 3, 14, 1); r(D, 36, 0, 1, 4); ci(A, 36, 0, 1.5); } }); },
    heavyrevolver() {
      po(W, [[6, 17], [22, 17], [19, 34], [2, 32]]); r(Wd, 5, 29, 12, 2); grid(7, 19, 9, 9); r(BR, 6, 17, 15, 3);
      r(M, 18, 6, 18, 12); r(L, 19, 7, 16, 1); r(D, 18, 15, 18, 3);
      r(M, 34, 8, 30, 7); r(L, 34, 8, 30, 1); r(D, 34, 14, 30, 1); r(BR, 34, 11, 14, 1); r(D, 58, 6, 8, 11); r(K, 63, 10, 3, 4); r(L, 59, 6, 6, 1); r(L, 62, 3, 3, 3);
      ci(D, 26, 12, 9); ci(M, 26, 12, 7.5); for (let k = 0; k < 6; k++) { ci(K, 26 + Math.cos(k * 1.047) * 4.6, 12 + Math.sin(k * 1.047) * 4.6, 1.8); } ci(BR, 26, 12, 2.2);
      po(D, [[13, 5], [19, 1], [20, 8]]); guard(24, 18, 12); r(RD, 38, 9, 8, 1);
    },
    bouncersmg() { gun({ len: 58, stock: 'wire', mag: 'straight', guard: 'none', muzzle: 'flash', optic: 'iron', acc: BL, extra() { for (let i = 0; i < 6; i++) { r(BL, 42 + i * 3, 9 + (i % 2) * 6, 2, 3); } r(BL, 42, 11, 18, 1); } }); },
    triplemg() { gun({ len: 56, stock: 'steel', mag: 'box', guard: 'none', muzzle: 'none', optic: 'iron', acc: OR, extra() { for (const dy of [-3, 3]) { r(M, 40, 12 + dy, 22, 3); r(L, 40, 12 + dy, 22, 1); r(K, 60, 13 + dy, 2, 1); } r(D, 38, 8, 4, 12); r(D, 56, 8, 4, 12); r(K, 58, 13, 3, 2); } }); },
    heavymg() { gun({ len: 60, stock: 'steel', mag: 'none', guard: 'vent', muzzle: 'brake', optic: 'handle', by: 9, bh: 9, acc: YL, extra() { r(D, 22, 18, 14, 9); r(M, 22, 18, 14, 1); r(K, 24, 20, 10, 2); bul(24, 22, 4); for (let i = 0; i < 5; i++) { r(BR, 22 + i * 3, 27 + i % 2, 2, 3); } r(D, 44, 19, 1, 8); r(D, 52, 19, 1, 8); ln(M, 44, 18, 48, 26, 2); ln(M, 52, 18, 48, 26, 2); } }); },
    sniper() { gun({ len: 66, stock: 'wood', mag: 'straight', guard: 'none', muzzle: 'brake', optic: 'scope', by: 12, bh: 6, acc: GN, extra() { r(D, 44, 20, 1, 8); r(D, 50, 20, 1, 8); ln(D, 44, 17, 40, 28, 2); ln(D, 50, 17, 54, 28, 2); r(M, 40, 14, 24, 2); } }); },
    minigun() {
      r(D, 6, 6, 12, 22); r(M, 6, 6, 12, 2); r(K, 8, 10, 8, 3); r(RD, 8, 16, 8, 2); r(L, 7, 8, 1, 16);
      r(M, 18, 9, 4, 16); ci(D, 24, 17, 9); ci(M, 24, 17, 7); ci(K, 24, 17, 2);
      for (const dy of [-5, 0, 5]) { r(M, 26, 12 + dy + 5, 36, 3); r(L, 26, 12 + dy + 5, 36, 1); r(D, 26, 14 + dy + 5, 36, 1); }
      r(D, 36, 8, 3, 18); r(D, 48, 8, 3, 18); r(D, 60, 8, 5, 18); r(K, 63, 11, 2, 3); r(K, 63, 16, 2, 3); r(K, 63, 21, 2, 3); r(L, 36, 8, 3, 1);
      r(D, 14, 28, 16, 3); r(BR, 15, 25, 12, 3); bul(17, 22, 3); r(Wd, 10, 2, 10, 4); r(W, 10, 2, 10, 2);
    },
    // ---------- shells ----------
    shotgun() { sgun({ len: 62, pump: true, tube: true, shells: true }); },
    sawedoff() { sgun({ len: 46, barrels: 2, cut: true, shells: false, extra() { po(W, [[2, 16], [16, 13], [16, 22], [3, 26]]); grid(5, 16, 8, 6); r(BR, 2, 16, 2, 8); } }); },
    doubleshotgun() { sgun({ len: 64, barrels: 2, wood: true, extra() { r(BR, 18, 8, 2, 4); r(BR, 34, 6, 20, 1); } }); },
    slugger() { sgun({ len: 66, tube: true, wood: true, shells: true, extra() { r(D, 52, 8, 10, 6); r(RD, 52, 8, 2, 6); } }); },
    autoshotgun() { sgun({ len: 62, drum: true, extra() { r(D, 40, 6, 20, 3); vents(40, 6, 20, 3, 6); } }); },
    superslugger() { sgun({ len: 66, tube: true, extra() { r(RD, 34, 10, 20, 2); r(D, 44, 4, 4, 5); r(L, 44, 4, 4, 1); r(RD, 56, 8, 8, 1); r(K, 40, 6, 10, 1); } }); },
    bouncershotgun() { sgun({ len: 62, pump: true, extra() { for (let i = 0; i < 7; i++) r(BL, 36 + i * 3, 8 + (i % 2) * 4, 2, 3); } }); },
    flak() {
      sgun({ len: 52, wood: true });
      po(D, [[50, 5], [64, 0], [64, 26], [50, 19]]); r(L, 52, 5, 10, 1); r(RD, 56, 7, 2, 14); r(RD, 60, 4, 2, 20); r(K, 62, 8, 2, 12); r(M, 48, 9, 4, 8);
    },
    eraser() {
      r(D, 6, 4, 46, 24); r(M, 6, 4, 46, 2); r(L, 7, 4, 44, 1); r(K, 10, 8, 22, 16);
      for (let i = 0; i < 4; i++) { r(RD, 12, 9 + i * 4, 18, 2); r(OR, 12, 9 + i * 4, 18, 1); }
      for (const dy of [0, 7, 14]) { r(M, 52, 6 + dy, 12, 4); r(K, 62, 7 + dy, 3, 2); r(L, 52, 6 + dy, 12, 1); }
      r(D, 50, 3, 4, 26); r(D, 62, 3, 4, 26); r(YL, 34, 10, 14, 2); r(YL, 34, 20, 14, 2); r(RD, 38, 14, 6, 4); r(L, 2, 12, 5, 8); grip(24, 28, K, 6);
    },
    // ---------- bolts ----------
    crossbow() { xbow({}); },
    splinter() { xbow({ bolts: 3, limb: 12 }); },
    autocrossbow() { xbow({ mag: true, limb: 14 }); },
    disc() {
      po(D, [[2, 14], [30, 10], [30, 22], [4, 25]]); r(M, 4, 14, 26, 2); grip(8, 22, W, 10); r(K, 14, 17, 12, 3); r(A, 14, 17, 12, 1); r(M, 28, 8, 10, 18);
      ci(K, 48, 16, 17); ci(M, 48, 16, 15); ci(L, 48, 16, 14); ci(M, 48, 16, 12);
      for (let i = 0; i < 12; i++) { const a = i * 0.5236; po(M, [[48 + Math.cos(a - 0.12) * 14, 16 + Math.sin(a - 0.12) * 14], [48 + Math.cos(a) * 18, 16 + Math.sin(a) * 18], [48 + Math.cos(a + 0.2) * 14, 16 + Math.sin(a + 0.2) * 14]]); }
      ci(D, 48, 16, 6); ci(A, 48, 16, 4); ci(K, 48, 16, 2); r(BR, 38, 12, 3, 8);
    },
    supersplinter() { xbow({ bolts: 5, limb: 14, mag: true, extra() { r(A, 34, 10, 26, 1); } }); },
    heavycrossbow() { xbow({ limb: 16, winch: true, bolts: 2, extra() { r(L, 41, 4, 4, 2); r(RD, 56, 10, 6, 1); } }); },
    // ---------- explosives ----------
    grenade() {
      tube({ len: 56, th: 12, by: 8, acc: OR, bands: [12, 26, 42] });
      ci(D, 30, 25, 8); ci(M, 30, 25, 6); ci(K, 30, 25, 2); for (let i = 0; i < 5; i++) ci(OR, 30 + Math.cos(i * 1.26) * 4, 25 + Math.sin(i * 1.26) * 4, 1.2);
      r(RD, 54, 6, 8, 16); r(K, 58, 9, 4, 10); r(L, 55, 6, 6, 1);
    },
    bazooka() {
      tube({ len: 64, th: 12, by: 10, acc: RD, bands: [16, 32, 48] });
      po(D, [[0, 8], [8, 10], [8, 24], [0, 26]]); r(L, 0, 8, 3, 1); r(K, 3, 12, 3, 10);
      po(RD, [[58, 11], [67, 16], [58, 21]]); r(L, 59, 12, 3, 1); r(OR, 24, 14, 2, 4); r(OR, 38, 14, 2, 4); po(D, [[16, 18], [28, 18], [24, 24], [14, 24]]);
    },
    rocket() {
      tube({ len: 58, th: 10, by: 10, acc: OR, bands: [18, 36] });
      po(RD, [[52, 11], [66, 15], [52, 19]]); r(OR, 52, 11, 4, 8); r(L, 54, 12, 8, 1); po(D, [[44, 6], [48, 0], [52, 6]]); r(K, 0, 12, 4, 6);
    },
    seeker() {
      tube({ len: 60, th: 11, by: 10, acc: A, bands: [20, 38] });
      ci(D, 26, 6, 6); ci(M, 26, 6, 4.5); ci(A, 26, 6, 2); ln(L, 26, 6, 31, 0, 1); r(L, 31, 0, 2, 2);
      po(RD, [[54, 11], [66, 15.5], [54, 20]]); r(A, 54, 11, 3, 9); r(A, 40, 4, 8, 1); r(K, 42, 2, 4, 2);
    },
    heavygrenade() {
      tube({ len: 60, th: 15, by: 6, acc: RD, bands: [12, 30, 48] });
      ci(D, 28, 28, 9); ci(M, 28, 28, 7); ci(K, 28, 28, 2.5); for (let i = 0; i < 6; i++) ci(RD, 28 + Math.cos(i * 1.047) * 5, 28 + Math.sin(i * 1.047) * 5, 1.5);
      r(L, 58, 5, 3, 17); r(RD, 62, 8, 4, 11); r(K, 63, 10, 2, 7);
    },
    hyper() {
      for (const dy of [0, 8, 16]) { r(D, 6, 4 + dy, 52, 7); r(M, 6, 4 + dy, 52, 1); r(OR, 10, 7 + dy, 40, 2); r(K, 56, 5 + dy, 9, 5); r(L, 58, 5 + dy, 6, 1); }
      r(M, 14, 2, 4, 28); r(M, 32, 2, 4, 28); r(M, 50, 2, 4, 28); r(L, 14, 2, 4, 1); r(RD, 0, 10, 8, 12); r(K, 1, 12, 5, 8);
      r(YL, 20, 15, 3, 2); r(YL, 26, 15, 3, 2); r(YL, 38, 15, 3, 2);
    },
    nuke() {
      r(D, 2, 6, 22, 18); r(M, 2, 6, 22, 1); r(K, 5, 10, 14, 10); r(RD, 6, 12, 12, 2); r(YL, 6, 16, 12, 2);
      po(M, [[24, 5], [50, 4], [66, 15], [50, 26], [24, 25]]); r(L, 26, 5, 22, 1);
      for (let i = 0; i < 4; i++) { po(YL, [[30 + i * 8, 5], [34 + i * 8, 5], [31 + i * 8, 25], [27 + i * 8, 25]]); }
      ci(YL, 58, 15, 5); ci(K, 58, 15, 4); for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; po(YL, [[58, 15], [58 + Math.cos(a) * 4, 15 + Math.sin(a) * 4], [58 + Math.cos(a + 0.9) * 4, 15 + Math.sin(a + 0.9) * 4]]); }
      grip(10, 24, K, 8); r(RD, 2, 4, 6, 3);
    },
    minelayer() {
      tube({ len: 50, th: 12, by: 8, acc: YL, bands: [14, 30] });
      ci(D, 56, 18, 9); ci(M, 56, 18, 7.5); ci(K, 56, 18, 3); for (let i = 0; i < 5; i++) r(RD, 56 + Math.cos(i * 1.256) * 8 - 1, 18 + Math.sin(i * 1.256) * 8 - 1, 2, 2); r(YL, 54, 16, 4, 4);
    },
    // ---------- energy ----------
    laserpistol() { egun({ len: 50, paint: D, acc: A, lens: true }); },
    plasmagun() { egun({ len: 52, paint: '#4a4e66', acc: A, orb: 6 }); },
    lightningpistol() { egun({ len: 52, paint: D, acc: A, prongs: true }); },
    laserrifle() { egun({ len: 64, paint: D, acc: A, lens: true, stock: true, extra() { r(D, 22, 4, 22, 5); r(M, 22, 4, 22, 1); r(GL, 40, 5, 4, 3); r(K, 24, 6, 12, 1); } }); },
    plasmarifle() { egun({ len: 64, paint: '#4a4e66', acc: A, orb: 7, stock: true, coil: true }); },
    lightningrifle() { egun({ len: 64, paint: D, acc: A, prongs: true, stock: true, extra() { r(D, 20, 4, 18, 5); r(A, 22, 6, 14, 1); } }); },
    plasmacannon() {
      egun({ len: 62, paint: '#4a4e66', acc: A, orb: 9, coil: true, extra() { r(D, 8, 18, 22, 8); r(M, 8, 18, 22, 1); r(A, 10, 21, 18, 2); } });
    },
    lightningcannon() {
      egun({ len: 62, paint: D, acc: A, prongs: true, extra() { r(D, 8, 18, 24, 8); r(A, 10, 21, 20, 2); bolt(40, 14, A); bolt(52, 2, GL); coil(26, 4, 12, 4, M); } });
    },
    arcpistol() { egun({ len: 46, paint: '#3a4a66', acc: A, prongs: true, extra() { bolt(24, 4, A); } }); },
    ionbeam() { egun({ len: 66, paint: D, acc: A, lens: true, stock: true, extra() { r(GL, 52, 14, 14, 2); r(A, 52, 12, 14, 1); r(A, 52, 17, 14, 1); coil(24, 5, 18, 3, A); } }); },
    pulseshotgun() { egun({ len: 58, paint: '#4a4e66', acc: A, stock: true, extra() { for (const dy of [-3, 3]) { r(M, 44, 12 + dy, 18, 3); r(A, 44, 13 + dy, 18, 1); r(GL, 61, 12 + dy, 3, 3); } r(D, 42, 8, 4, 16); } }); },
    teslagun() { egun({ len: 62, paint: D, acc: A, coil: true, prongs: true, extra() { ci(A, 40, 8, 3); ci(GL, 40, 8, 1.5); bolt(44, 2, GL); } }); },
    // ---------- special ----------
    maw() {
      r(K, 2, 8, 14, 16); po(W, [[0, 12], [6, 12], [6, 22], [0, 24]]); grid(1, 13, 4, 8);
      ci('#3a8a24', 24, 17, 12); ci('#6cf03a', 24, 15, 9); ci(K, 24, 17, 5); ci('#d94a8a', 24, 17, 3);
      po('#4aa82a', [[30, 2], [66, 3], [66, 14], [34, 15]]); po('#4aa82a', [[30, 32], [66, 31], [66, 20], [34, 19]]); r(K, 34, 14, 32, 6);
      for (let i = 0; i < 8; i++) { po(L, [[36 + i * 4, 14], [39 + i * 4, 14], [37.5 + i * 4, 10]]); po(L, [[36 + i * 4, 20], [39 + i * 4, 20], [37.5 + i * 4, 24]]); }
      ci(YL, 20, 12, 2); ci(K, 20, 12, 1);
    },
    needle() {
      r(D, 2, 6, 10, 22); r(M, 2, 6, 10, 1); r(A, 4, 10, 6, 2); r(A, 4, 15, 6, 2); r(A, 4, 20, 6, 2); r(L, 3, 8, 1, 18);
      for (const dy of [0, 8, 16]) { r(M, 12, 6 + dy, 50, 3); r(L, 12, 6 + dy, 50, 1); r(A, 16, 7 + dy, 40, 1); r(GL, 62, 6 + dy, 5, 3); r(D, 28, 5 + dy, 2, 5); r(D, 44, 5 + dy, 2, 5); }
      r(D, 12, 2, 4, 28); r(D, 56, 2, 4, 28); grip(18, 28, K, 6);
    },
    eggcannon() {
      ci(K, 20, 17, 16); ci('#e8e2cc', 20, 17, 14.5); ci('#f6f2e2', 17, 13, 8); for (const [x, y] of [[24, 22], [14, 24], [26, 12]]) ci('#cbbd98', x, y, 2.4);
      ci(BR, 20, 17, 6); ci(K, 20, 17, 3.5); r(L, 10, 9, 3, 1);
      r(D, 34, 10, 30, 14); r(M, 34, 10, 30, 2); r(K, 62, 12, 5, 10); r(D, 58, 8, 4, 18); r(OR, 38, 15, 18, 3); r(L, 35, 10, 28, 1);
      grip(38, 24, W, 8);
    },
    boilercannon() {
      ci(K, 20, 17, 17); ci('#b0603a', 20, 17, 15.5); ci('#e08a50', 20, 15, 11); for (let i = 0; i < 6; i++) ci(K, 20 + Math.cos(i * 1.05) * 12, 17 + Math.sin(i * 1.05) * 12, 1.2);
      ci(D, 20, 17, 6); ci(OR, 20, 17, 4); ci(YL, 20, 17, 2); r(M, 6, 30, 28, 3);
      r(D, 34, 8, 30, 18); r(M, 34, 8, 30, 2); r(K, 62, 10, 5, 14); r(OR, 58, 6, 3, 22); r(OR, 38, 14, 16, 4); r(L, 35, 8, 28, 1); r(D, 40, 2, 3, 6); r(L, 38, 0, 7, 2);
    },
    // ---------- melee ----------
    wrench() {
      r(M, 6, 14, 36, 5); r(L, 6, 14, 36, 1); r(D, 6, 18, 36, 1); r(BR, 10, 15, 2, 3);
      ci(M, 52, 16, 11); ci(K, 56, 16, 6); r(K, 56, 10, 10, 12); r(M, 56, 8, 10, 2); r(M, 56, 22, 10, 2); r(L, 46, 7, 8, 1); ci(D, 50, 16, 3); ci(M, 50, 16, 1.5); r(RD, 3, 13, 5, 7);
    },
    shovel() {
      handle(2, 14, 34); r(M, 34, 12, 4, 9); po(M, [[38, 6], [60, 7], [66, 16], [60, 26], [38, 27]]); po(L, [[40, 8], [58, 9], [62, 14], [40, 14]]); r(D, 40, 17, 20, 7); r(K, 42, 19, 14, 1);
      r(D, 36, 10, 3, 12); r(K, 50, 11, 1, 10);
    },
    bat() {
      po(Wd, [[2, 14], [34, 12], [34, 20], [2, 18]]); po(W, [[34, 10], [64, 7], [66, 14], [64, 23], [34, 21]]); r(Wd, 36, 19, 28, 3); r(L, 36, 10, 26, 1);
      r(BR, 4, 13, 8, 6); for (let i = 0; i < 4; i++) { r(M, 40 + i * 6, 13, 3, 3); r(L, 41 + i * 6, 13, 1, 1); } ln(M, 36, 18, 62, 12, 1); r(K, 2, 14, 2, 4);
    },
    machete() {
      handle(2, 15, 14, K); r(BR, 14, 12, 3, 11); r(M, 16, 12, 6, 3);
      po(S(), [[18, 12], [60, 9], [66, 17], [58, 24], [18, 20]]); po(L, [[20, 13], [58, 10], [62, 15], [20, 15]]); r(D, 22, 17, 36, 1); r(K, 24, 14, 20, 1);
    },
    screwdriver() {
      r(OR, 2, 10, 18, 12); r(RD, 2, 10, 18, 3); for (let i = 0; i < 5; i++) r(K, 4 + i * 3, 14, 1, 7); r(L, 3, 11, 16, 1); r(D, 20, 12, 3, 8);
      r(M, 22, 15, 30, 2); r(L, 22, 15, 30, 1); po(L, [[50, 12], [62, 15], [62, 18], [50, 20]]); r(K, 56, 15, 1, 3); r(D, 26, 14, 2, 4);
    },
    axe() {
      handle(2, 15, 52); po(M, [[40, 8], [52, 6], [52, 30], [40, 24]]); po(L, [[52, 6], [66, 3], [68, 15], [66, 28], [52, 30]]); po(S(), [[54, 8], [64, 6], [65, 15], [64, 25], [54, 27]]); r(D, 42, 11, 8, 11); r(K, 56, 10, 1, 10); r(L, 54, 6, 10, 1);
    },
    hammer() {
      handle(2, 15, 52); r(D, 44, 3, 22, 30); r(M, 44, 3, 22, 3); r(L, 45, 3, 20, 1); r(K, 44, 28, 22, 5); r(D, 62, 3, 4, 30); r(L, 46, 8, 3, 18); r(BR, 40, 14, 4, 7); r(RD, 52, 14, 8, 6);
    },
    chainsaw() {
      r(RD, 2, 8, 20, 18); r(D, 2, 8, 20, 3); r(L, 3, 8, 18, 1); r(K, 5, 14, 10, 6); r(YL, 5, 16, 10, 1); ci(K, 8, 26, 3); r(K, 22, 10, 4, 6); grip(6, 24, K, 8);
      r(M, 22, 12, 44, 10); r(L, 22, 12, 44, 1); r(K, 24, 16, 40, 3); for (let x = 24; x < 66; x += 3) { r(L, x, 11, 2, 2); r(L, x + 1, 21, 2, 2); } ci(D, 62, 17, 5); ci(M, 62, 17, 2.5);
    },
    katana() {
      r(K, 2, 16, 14, 4); for (let i = 0; i < 4; i++) r(RD, 4 + i * 3, 16, 1, 4); r(L, 3, 16, 12, 1);
      ci(BR, 18, 18, 5); ci(K, 18, 18, 3.6); r(BR, 17, 12, 3, 12);
      po(L, [[20, 15], [64, 12], [67, 15], [20, 20]]); r(M, 22, 18, 42, 1); r(D, 22, 19, 40, 1); r(GL, 22, 15, 38, 1);
    },
    ebl() {
      r(K, 2, 16, 12, 4); r(A, 4, 16, 2, 4); r(A, 8, 16, 2, 4); ci(D, 17, 18, 5); r(M, 15, 10, 4, 16); r(L, 15, 10, 4, 1);
      po(A, [[20, 13], [64, 10], [68, 16], [64, 22], [20, 21]]); po(GL, [[22, 15], [62, 13], [65, 16], [62, 19], [22, 19]]); r(A, 22, 14, 40, 1);
    },
    ehammer() {
      handle(2, 15, 44, K); r(A, 10, 16, 3, 3); r(A, 22, 16, 3, 3);
      r(D, 44, 2, 22, 32); r(A, 46, 4, 18, 28); r(GL, 49, 7, 12, 22); r(A, 56, 10, 1, 16); r(D, 44, 2, 22, 2); r(D, 44, 30, 22, 4); r(L, 46, 3, 18, 1);
    },
    crowbar() {
      r(D, 4, 14, 52, 4); r(L, 4, 14, 52, 1); r(K, 4, 17, 52, 1); po(D, [[52, 14], [62, 10], [66, 6], [66, 11], [58, 18], [52, 18]]); r(L, 60, 8, 4, 1);
      po(D, [[2, 14], [2, 21], [8, 22], [8, 17]]); r(RD, 8, 14, 12, 4); r(RD, 28, 14, 6, 4);
    },
    pickaxe() {
      handle(2, 15, 54); po(M, [[30, 14], [60, 14], [60, 18], [30, 18]]);
      po(L, [[34, 12], [56, 4], [67, 8], [67, 11], [56, 9], [34, 15]]); po(L, [[34, 21], [56, 29], [67, 25], [67, 22], [56, 24], [34, 18]]); r(D, 28, 11, 6, 11); r(K, 36, 13, 18, 1);
    },
    spear() {
      r(Wd, 2, 16, 46, 3); r(W, 2, 16, 46, 1); handle(2, 14, 12, K); r(RD, 12, 13, 2, 9); r(RD, 38, 13, 6, 9);
      po(L, [[46, 17.5], [52, 11], [66, 17.5], [52, 24]]); po(M, [[48, 17.5], [52, 14], [64, 17.5], [52, 21]]); r(D, 50, 17, 14, 1); r(BR, 45, 14, 3, 7);
    },
    rapier() {
      r(K, 2, 16, 10, 4); r(BR, 3, 16, 8, 1); ci(BR, 16, 18, 7); ci(K, 16, 18, 5); ci(BR, 16, 18, 3); ln(BR, 14, 10, 14, 26, 2);
      r(L, 22, 17, 44, 2); r(M, 22, 18, 44, 1); po(L, [[64, 16.5], [68, 18], [64, 19.5]]); r(GL, 24, 17, 38, 1);
    },
    halberd() {
      r(Wd, 2, 16, 52, 3); r(W, 2, 16, 52, 1); r(BR, 6, 14, 4, 7); r(BR, 30, 14, 3, 7);
      r(M, 50, 12, 8, 11); po(L, [[56, 15], [68, 17.5], [56, 21]]);
      po(M, [[40, 6], [56, 4], [62, 12], [50, 14], [44, 14]]); po(L, [[42, 6], [55, 5], [59, 11], [44, 11]]); r(D, 46, 9, 8, 1);
      po(D, [[40, 28], [56, 30], [58, 22], [48, 20], [44, 20]]); r(K, 48, 24, 6, 1);
    },
    fryingpan() {
      handle(2, 15, 22, K); r(RD, 3, 15, 6, 5); ci(K, 46, 17, 19); ci(D, 46, 17, 17.5); ci(M, 46, 17, 15); ci(K, 46, 17, 12); ci('#3a3d4a', 46, 18, 11); r(L, 32, 9, 8, 1); r(D, 22, 16, 6, 3); r(L, 36, 12, 6, 1); ci('#f0ead0', 44, 16, 4); ci(YL, 44, 16, 2);
    },
    // ---------- new bullet weapons ----------
    twinpistols() {
      for (const dy of [-5, 6]) {
        r(M, 6, 8 + dy, 32, 7); r(L, 7, 8 + dy, 30, 1); r(D, 6, 13 + dy, 32, 2); r(M, 36, 9 + dy, 26, 4); r(L, 36, 9 + dy, 26, 1); r(K, 60, 10 + dy, 2, 2); r(A, 12, 10 + dy, 14, 1);
        po(W, [[8, 14 + dy], [16, 14 + dy], [13, 24 + dy], [5, 23 + dy]]); r(BR, 8, 14 + dy, 9, 1);
      }
    },
    burstpistol() { gun({ len: 54, stock: 'none', mag: 'straight', guard: 'rail', muzzle: 'brake', optic: 'iron', acc: OR, by: 10, bh: 8 }); },
    marksman() { gun({ len: 66, stock: 'wood', mag: 'straight', guard: 'wood', muzzle: 'brake', optic: 'scope', acc: BL, by: 12, bh: 6 }); },
    ricochet() { gun({ len: 60, stock: 'steel', mag: 'curve', guard: 'vent', muzzle: 'flash', optic: 'red', acc: PU, extra() { for (let i = 0; i < 4; i++) { r(PU, 44 + i * 4, 12 + (i % 2) * 4, 3, 2); } } }); },
    // ---------- new shell / bolt / explosive ----------
    pump() { sgun({ len: 60, pump: true, tube: true, wood: true, extra() { r(BR, 40, 9, 12, 1); } }); },
    ripper() { sgun({ len: 62, drum: true, extra() { for (let i = 0; i < 5; i++) po(L, [[40 + i * 4, 16], [43 + i * 4, 16], [41.5 + i * 4, 21]]); r(RD, 36, 8, 24, 2); } }); },
    harpoon() { xbow({ limb: 9, bolts: 1, winch: true, extra() { r(L, 30, 12, 34, 1); r(RD, 56, 14, 6, 1); po(L, [[58, 11], [67, 14.5], [58, 18]]); r(BR, 46, 10, 6, 2); } }); },
    boltfan() { xbow({ bolts: 5, limb: 13, extra() { po(GN, [[38, 8], [60, 0], [60, 5], [38, 13]]); po(GN, [[38, 20], [60, 28], [60, 23], [38, 17]]); } }); },
    cluster() { tube({ len: 56, th: 13, by: 8, acc: OR, bands: [14, 30, 44], extra() { for (let i = 0; i < 4; i++) { ci(RD, 52 + (i % 2) * 5, 10 + Math.floor(i / 2) * 7, 3); ci(K, 52 + (i % 2) * 5, 10 + Math.floor(i / 2) * 7, 1.2); } } }); },
    rocketpods() {
      for (const dy of [0, 8, 16]) { for (const dx of [0, 14]) { r(D, 6 + dx, 4 + dy, 12, 7); r(L, 6 + dx, 4 + dy, 12, 1); ci(K, 17 + dx, 7.5 + dy, 3); ci(RD, 17 + dx, 7.5 + dy, 2); } }
      r(M, 34, 2, 4, 30); r(D, 38, 12, 28, 9); r(M, 38, 12, 28, 1); r(OR, 42, 15, 20, 2); r(K, 63, 14, 3, 5); r(L, 40, 12, 24, 1); r(K, 2, 10, 6, 14);
    },
  };
  function S() { return '#c4c9d6'; }
  (art[{ sledge: 'hammer', energysword: 'ebl', energyhammer: 'ehammer' }[id] || id] || art.revolver)();
  // shading pass: rim light on top edges, shadow below, soft vertical gradient per column, glowing ammo colour, then a coloured (not black) outline
  const IW = WEAPON_W, IH = WEAPON_H, img = g.getImageData(0, 0, IW, IH), px = img.data;
  for (let i = 3; i < px.length; i += 4) px[i] = px[i] >= 110 ? 255 : 0;
  const out = new Uint8ClampedArray(px), has = (x, y) => x >= 0 && y >= 0 && x < IW && y < IH && px[(y * IW + x) * 4 + 3] > 0;
  const aRGB = [parseInt(A.slice(1, 3), 16), parseInt(A.slice(3, 5), 16), parseInt(A.slice(5, 7), 16)];
  const top = new Array(IW).fill(99), bot = new Array(IW).fill(-1);
  for (let x = 0; x < IW; x++) for (let y = 0; y < IH; y++) if (has(x, y)) { if (top[x] === 99) top[x] = y; bot[x] = y; }
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    if (!has(x, y)) continue;
    const k = (y * IW + x) * 4, span = Math.max(1, bot[x] - top[x]), t = (y - top[x]) / span; let d = (0.5 - t) * 26;
    if (!has(x, y - 1)) d += 40; else if (!has(x, y + 1)) d -= 36;
    else if (!has(x, y - 2)) d += 14;
    if (!has(x - 1, y) && !has(x, y - 1)) d += 14;
    if (Math.abs(px[k] - aRGB[0]) + Math.abs(px[k + 1] - aRGB[1]) + Math.abs(px[k + 2] - aRGB[2]) < 40) d += 26;
    for (let q = 0; q < 3; q++) out[k + q] = Math.max(0, Math.min(255, px[k + q] + d));
  }
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    if (has(x, y)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (has(nx, ny)) { const q = (ny * IW + nx) * 4; out.set([out[q] * 0.18 + 6, out[q + 1] * 0.18 + 6, out[q + 2] * 0.2 + 12, 255], (y * IW + x) * 4); break; }
    }
  }
  g.putImageData(new ImageData(out, IW, IH), 0, 0);
  return c;
}
