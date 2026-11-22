// Top-down weapon sprites (seen from ABOVE, pointing right, left/right symmetric around the aim line) plus where the hands go.
// Canvas 56x28, the aim line is row 14. WEAPON_TOP_META[id] = { rear, fore, muz } in sprite pixels (x of the rear hand, the front hand and the muzzle).
const WEAPON_TOP_W = 56, WEAPON_TOP_H = 28, WEAPON_TOP_META = {};
function makeTopWeapon(id) {
  const wd = (HEROES['w_' + id] || HEROES.w_revolver).weapon, am = ammoOf(wd), A = am ? AMMO[am].col : '#c8ccd8', CY = 14;
  const c = document.createElement('canvas'); c.width = WEAPON_TOP_W; c.height = WEAPON_TOP_H; const g = c.getContext('2d');
  const M = '#9aa1b2', D = '#555a6a', K = '#2c2f3a', L = '#e4e8f2', W = '#a8713a', Wd = '#6b4423', BR = '#d9a441', RD = '#d6453d', GN = '#4fae3a', GL = '#eaffff', YL = '#ffd91f', OR = '#ff8a1f', BL = '#3d9bff', PU = '#b24bff', S = '#c4c9d6';
  const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const cr = (col, x, w, h) => r(col, x, CY - h / 2, w, h);                                  // centred on the aim line
  const sd = (col, x, o, w, h) => { r(col, x, CY - o - h, w, h); r(col, x, CY + o, w, h); }; // mirrored pair, o = gap from the centre line
  const po = (col, pts) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  const sp = (col, pts) => { po(col, pts); po(col, pts.map(p => [p[0], 2 * CY - p[1]])); };   // two mirrored pieces (give the upper piece)
  const sy = (col, pts) => po(col, pts.concat(pts.slice().reverse().map(p => [p[0], 2 * CY - p[1]])));   // ONE symmetric solid (give the upper half outline, front to back)
  const ci = (col, x, rad) => { g.fillStyle = col; g.beginPath(); g.arc(x, CY, rad, 0, 6.283); g.fill(); };
  const meta = { rear: 8, fore: null, muz: 50 };
  const stockW = (len, w0, w1) => { sy(W, [[0, CY - w0 / 2], [len, CY - w1 / 2]]); cr(Wd, 2, len - 2, 1); cr(BR, 0, 2, w0); sd(Wd, 4, 2, len - 8, 1); };
  const rails = (x, n) => { for (let i = 0; i < n; i++) cr(L, x + i * 3, 2, 2); };
  const slits = (x, n, h) => { for (let i = 0; i < n; i++) cr(K, x + i * 3, 1, h); };
  const bladeT = o => {   // melee blade, handle at the back
    const hl = o.hl || 12, bw = o.bw || 6, len = o.len || 52;
    cr(o.hc || Wd, 0, hl, 4); for (let i = 1; i < hl; i += 3) cr(K, i, 1, 4); cr(BR, 0, 2, 5);
    cr(BR, hl, 3, o.gw || 10); sd(D, hl, (o.gw || 10) / 2 - 1, 3, 2);
    sy(o.col || S, [[hl + 3, CY - bw / 2], [len - o.tip, CY - bw / 2], [len, CY - 0.5]]);
    cr(o.fuller || M, hl + 4, len - hl - o.tip - 4, 1); meta.rear = hl / 2; meta.muz = len;
  };
  const rifleT = o => {
    const Lx = o.len || 52;
    if (o.stock === 'wood') stockW(14, 6, 10); else if (o.stock === 'steel') { cr(D, 1, 13, 8); cr(K, 4, 6, 3); cr(L, 1, 1, 8); } else if (o.stock === 'wire') { sd(D, 0, 3, 14, 1); cr(D, 0, 1, 8); cr(M, 0, 3, 5); }
    cr(M, 14, 16, 8); cr(D, 16, 12, 2); cr(K, 20, 6, 2); rails(16, 4); cr(o.acc || K, 16, 6, 1);
    if (o.mag === 'box') sd(D, 20, 4, 10, 2); if (o.mag === 'drum') ci(D, 24, 6);
    const hgEnd = Math.min(Lx - 4, 30 + (o.hg || 14));
    if (o.guard === 'vent') { cr(D, 30, hgEnd - 30, 8); slits(32, Math.floor((hgEnd - 32) / 3), 6); } else if (o.guard === 'wood') { cr(W, 30, hgEnd - 30, 8); cr(Wd, 31, hgEnd - 32, 1); } else if (o.guard === 'rail') { cr(D, 30, hgEnd - 30, 6); rails(31, 5); }
    cr(M, hgEnd, Lx - hgEnd, 4);
    if (o.muzzle === 'brake') { cr(D, Lx - 5, 6, 8); cr(K, Lx - 4, 1, 4); } else if (o.muzzle === 'supp') { cr(D, Lx - 12, 14, 8); slits(Lx - 10, 4, 6); } else if (o.muzzle === 'flash') sy(D, [[Lx - 4, CY - 2], [Lx + 1, CY - 4]]); else cr(L, Lx - 1, 2, 4);
    if (o.optic === 'scope') { cr(D, 18, 18, 6); sd(M, 22, 3, 3, 1); sd(M, 32, 3, 3, 1); ci(BL, 36, 2.5); ci(GL, 36, 1.2); ci(K, 17, 2.5); } else if (o.optic === 'red') { cr(D, 24, 8, 6); cr(RD, 30, 1, 2); } else if (o.optic === 'iron') { cr(L, Lx - 4, 2, 4); cr(L, 20, 2, 5); }
    meta.rear = 12; meta.fore = hgEnd - 6; meta.muz = Lx;
    if (o.extra) o.extra();
  };
  const pistolT = o => {
    const Lx = o.len || 36;
    cr(W, 2, 12, 7); cr(Wd, 3, 10, 1); cr(BR, 2, 2, 7);
    cr(M, 12, Lx - 12, 6); cr(D, 14, Lx - 20, 2); cr(o.acc || YL, 16, Lx - 24, 1); cr(K, 18, 6, 2);
    cr(D, Lx - 4, 4, 4); cr(L, Lx - 2, 2, 2); cr(L, Lx - 6, 2, 3);
    meta.rear = 8; meta.muz = Lx;
    if (o.extra) o.extra();
  };
  const shotT = o => {
    const Lx = o.len || 54;
    if (!o.cut) stockW(14, 6, 10); else { stockW(6, 5, 7); }
    cr(M, 14, 14, 8); cr(D, 16, 10, 2); cr(BR, 14, 2, 8); cr(K, 20, 5, 2);
    const nb = o.barrels || 1;
    if (nb === 1) { cr(M, 28, Lx - 28, 4); cr(L, 28, Lx - 28, 1); cr(D, Lx - 4, 4, 6); } else { sd(M, 28, 0, Lx - 28, 4); cr(K, 28, Lx - 28, 1); sd(D, Lx - 4, 0, 4, 5); }
    if (o.pump) { cr(W, 32, 14, 9); cr(Wd, 34, 10, 1); for (let i = 0; i < 4; i++) cr(K, 34 + i * 3, 1, 8); } else if (o.wood) { cr(W, 32, 14, 8); cr(Wd, 33, 12, 1); }
    if (o.drum) sd(D, 20, 4, 12, 3);
    if (o.shells) { sd(RD, 2, 4, 2, 3); sd(RD, 6, 4, 2, 3); }
    meta.rear = 10; meta.fore = 38; meta.muz = Lx;
    if (o.extra) o.extra();
  };
  const tubeT = o => {
    const h = o.h || 10, Lx = o.len || 52;
    cr(M, 4, Lx - 4, h); cr(L, 6, Lx - 8, 2); cr(D, 4, 4, h + 4); cr(K, 2, 3, h - 2);
    for (const x of o.bands || [16, 30, 42]) cr(D, x, 3, h + 2);
    cr(o.acc || A, 12, 22, 2); sd(D, 12, h / 2 + 1, 6, 2);
    sy(o.nose || RD, [[Lx - 2, CY - h / 2], [Lx + 4, CY - 2]]); cr(K, Lx - 2, 2, h - 4);
    meta.rear = 18; meta.fore = 34; meta.muz = Lx + 2;
    if (o.extra) o.extra();
  };
  const energyT = o => {
    const Lx = o.len || 48;
    if (o.stock) { cr(D, 0, 8, 8); cr(o.acc || A, 1, 3, 1); }
    sy(o.paint || D, [[6, CY - 4], [Lx - 8, CY - 3]]); cr(M, 8, Lx - 18, 2); cr(o.acc || A, 10, Lx - 24, 2); cr(K, 12, 5, 2);
    if (o.coil) for (let i = 0; i < 4; i++) { sd(M, Lx - 22 + i * 3, 3, 2, 2); cr(o.acc || A, Lx - 22 + i * 3, 1, 6); }
    if (o.orb) { ci(K, Lx - 2, o.orb + 1.4); ci(o.acc || A, Lx - 2, o.orb); ci(GL, Lx - 2, o.orb * 0.5); cr(M, Lx - 9, 3, 8); }
    if (o.lens) { cr(D, Lx - 8, 6, 8); cr(GL, Lx - 2, 5, 2); sd(o.acc || A, Lx - 7, 3, 2, 2); }
    if (o.prongs) { sd(o.acc || A, Lx - 10, 3, 3, 6); sd(o.acc || A, Lx - 3, 5, 3, 3); cr(M, Lx - 10, 3, 6); cr(GL, Lx - 8, 7, 2); }
    meta.rear = 10; meta.fore = 26; meta.muz = Lx;
    if (o.extra) o.extra();
  };
  const xbowT = o => {
    const lh = o.limb || 11;
    po(W, [[0, CY - 3], [28, CY - 2], [28, CY + 2], [0, CY + 3]]); cr(Wd, 2, 24, 1); cr(BR, 0, 2, 6);
    cr(M, 24, 28, 4); cr(L, 24, 28, 1); cr(D, 22, 4, 6);
    sp(D, [[36, CY - 2], [40, CY - 2], [44, CY - lh], [41, CY - lh]]); cr(M, 34, 7, 5);
    const sg = (col, x0, y0, x1, y1) => { g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    sg(L, 42, CY - lh, 26, CY); sg(L, 42, CY + lh, 26, CY);
    const nb = o.bolts || 1;
    for (let i = 0; i < nb; i++) { const yy = (i - (nb - 1) / 2) * 2; r(BR, 28, CY + yy, 24, 1); po(A, [[52, CY + yy - 2], [56, CY + yy + 0.5], [52, CY + yy + 3]]); r(RD, 28, CY + yy - 1, 2, 3); }
    if (o.mag) cr(D, 14, 10, 8);
    if (o.winch) { ci(D, 12, 5); ci(M, 12, 3); }
    meta.rear = 8; meta.fore = 26; meta.muz = 54;
    if (o.extra) o.extra();
  };
  const art = {
    revolver() { pistolT({ len: 40, extra() { cr(D, 16, 9, 12); ci(M, 22, 5.5); for (let k = 0; k < 6; k++) { g.fillStyle = K; g.beginPath(); g.arc(22 + Math.cos(k * 1.047) * 3.2, CY + Math.sin(k * 1.047) * 3.2, 1.1, 0, 6.283); g.fill(); } sd(L, 30, 1, 8, 1); } }); },
    popgun() { pistolT({ len: 36, acc: RD, extra() { sy(OR, [[30, CY - 3], [38, CY - 7]]); cr(K, 36, 2, 8); } }); },
    machinegun() { rifleT({ len: 50, stock: 'wire', mag: 'box', guard: 'vent', muzzle: 'supp', optic: 'iron', acc: YL, hg: 10 }); },
    rifle() { rifleT({ len: 54, stock: 'steel', guard: 'vent', muzzle: 'brake', acc: GN, extra() { cr(D, 18, 10, 2); sd(M, 20, 3, 8, 2); } }); },
    smartgun() { rifleT({ len: 52, stock: 'steel', guard: 'rail', muzzle: 'brake', mag: 'box', acc: A, extra() { cr(K, 20, 12, 6); cr(GL, 22, 8, 1); cr(A, 22, 5, 1); } }); },
    heavyrevolver() { pistolT({ len: 44, extra() { cr(D, 14, 11, 14); ci(M, 21, 6.5); for (let k = 0; k < 6; k++) { g.fillStyle = K; g.beginPath(); g.arc(21 + Math.cos(k * 1.047) * 4, CY + Math.sin(k * 1.047) * 4, 1.4, 0, 6.283); g.fill(); } ci(BR, 21, 2); cr(BR, 30, 8, 1); } }); },
    bouncersmg() { rifleT({ len: 50, stock: 'wire', mag: 'box', muzzle: 'flash', optic: 'iron', acc: BL, extra() { for (let i = 0; i < 6; i++) { sd(BL, 32 + i * 3, 3, 2, 1); } cr(BL, 32, 17, 1); } }); },
    triplemg() { rifleT({ len: 48, stock: 'steel', mag: 'box', optic: 'iron', acc: OR, extra() { sd(M, 30, 3, 18, 3); cr(M, 30, 18, 3); cr(D, 30, 3, 12); cr(D, 44, 3, 12); } }); },
    heavymg() { rifleT({ len: 52, stock: 'steel', guard: 'vent', muzzle: 'brake', acc: YL, mag: 'box', extra() { sd(BR, 22, 6, 2, 3); sd(BR, 26, 6, 2, 3); sd(BR, 30, 6, 2, 3); sd(D, 42, 4, 2, 6); } }); },
    sniper() { rifleT({ len: 55, stock: 'wood', guard: 'wood', muzzle: 'brake', optic: 'scope', acc: GN, hg: 6, extra() { sd(D, 36, 4, 2, 4); } }); },
    minigun() {
      cr(D, 4, 12, 14); cr(M, 4, 12, 2); cr(RD, 6, 8, 2); cr(K, 6, 8, 2); ci(D, 20, 8); ci(M, 20, 6); ci(K, 20, 2);
      for (const dy of [-5, 0, 5]) { r(M, 26, CY + dy - 1.5, 28, 3); r(L, 26, CY + dy - 1.5, 28, 1); }
      cr(D, 34, 3, 16); cr(D, 46, 3, 16); cr(D, 52, 4, 16); sd(K, 53, 1, 2, 2); meta.rear = 12; meta.fore = 34; meta.muz = 54;
    },
    shotgun() { shotT({ len: 54, pump: true, shells: true }); },
    sawedoff() { shotT({ len: 40, barrels: 2, cut: true }); },
    doubleshotgun() { shotT({ len: 54, barrels: 2, wood: true, extra() { cr(BR, 14, 2, 8); } }); },
    slugger() { shotT({ len: 54, wood: true, shells: true, extra() { cr(D, 44, 8, 6); cr(RD, 44, 2, 6); } }); },
    autoshotgun() { shotT({ len: 52, drum: true, extra() { cr(D, 36, 14, 6); slits(38, 4, 4); } }); },
    superslugger() { shotT({ len: 54, extra() { cr(RD, 30, 18, 2); cr(D, 40, 4, 8); } }); },
    bouncershotgun() { shotT({ len: 52, pump: true, extra() { for (let i = 0; i < 6; i++) sd(BL, 30 + i * 3, 3, 2, 1); } }); },
    flak() { shotT({ len: 44, wood: true, extra() { sy(D, [[42, CY - 4], [54, CY - 11]]); cr(RD, 46, 2, 14); cr(RD, 51, 2, 18); cr(K, 52, 2, 10); } }); },
    eraser() {
      cr(D, 6, 38, 20); cr(M, 6, 38, 2); cr(K, 10, 18, 12); for (let i = 0; i < 4; i++) { cr(RD, 12, 14, 1); }
      sd(RD, 12, 1, 14, 1); sd(OR, 12, 4, 14, 1); cr(YL, 30, 12, 2); sd(M, 44, 5, 10, 4); cr(M, 44, 10, 4); sd(D, 44, 9, 10, 1); cr(L, 1, 4, 10); meta.rear = 12; meta.fore = 28; meta.muz = 54;
    },
    crossbow() { xbowT({}); },
    splinter() { xbowT({ bolts: 3, limb: 9 }); },
    autocrossbow() { xbowT({ mag: true, limb: 11 }); },
    disc() {
      cr(D, 2, 22, 8); cr(M, 2, 22, 2); cr(A, 8, 10, 2); sd(D, 20, 4, 8, 2);
      ci(K, 40, 13.5); ci(L, 40, 12.5); ci(M, 40, 10.5);
      for (let i = 0; i < 12; i++) { const a = i * 0.5236; po(M, [[40 + Math.cos(a - 0.14) * 12, CY + Math.sin(a - 0.14) * 12], [40 + Math.cos(a) * 14, CY + Math.sin(a) * 14], [40 + Math.cos(a + 0.2) * 12, CY + Math.sin(a + 0.2) * 12]]); }
      ci(D, 40, 5); ci(A, 40, 3.4); ci(K, 40, 1.6); meta.rear = 8; meta.fore = 20; meta.muz = 54;
    },
    supersplinter() { xbowT({ bolts: 5, limb: 11, mag: true }); },
    heavycrossbow() { xbowT({ limb: 13, winch: true, bolts: 2 }); },
    grenade() { tubeT({ len: 46, h: 12, acc: OR, bands: [12, 26, 38], extra() { sd(RD, 44, 3, 6, 5); ci(D, 20, 3); } }); },
    bazooka() { tubeT({ len: 52, h: 12, bands: [14, 28, 42], acc: RD, extra() { sy(D, [[0, CY - 5], [6, CY - 8]]); cr(K, 0, 2, 8); } }); },
    rocket() { tubeT({ len: 48, h: 10, bands: [14, 30], acc: OR }); },
    seeker() { tubeT({ len: 50, h: 10, bands: [18, 34], acc: A, nose: A, extra() { ci(D, 28, 4.5); ci(M, 28, 3); ci(A, 28, 1.4); sd(M, 22, 6, 12, 1); } }); },
    heavygrenade() { tubeT({ len: 50, h: 14, bands: [12, 28, 42], acc: RD, extra() { sd(D, 18, 7, 12, 3); cr(L, 44, 3, 12); } }); },
    hyper() {
      for (const dy of [-6, 0, 6]) { r(D, 6, CY + dy - 2.5, 44, 5); r(M, 6, CY + dy - 2.5, 44, 1); r(OR, 10, CY + dy - 0.5, 34, 1); r(K, 48, CY + dy - 1.5, 6, 3); }
      cr(M, 14, 3, 26); cr(M, 28, 3, 26); cr(M, 42, 3, 26); cr(RD, 0, 7, 14); meta.rear = 10; meta.fore = 32; meta.muz = 54;
    },
    nuke() {
      cr(D, 2, 16, 14); cr(K, 4, 10, 8); cr(RD, 5, 8, 2); cr(YL, 5, 8, 2);
      sy(M, [[18, CY - 7], [44, CY - 8], [54, CY - 1]]);
      for (let i = 0; i < 4; i++) po(YL, [[24 + i * 7, CY - 7], [27 + i * 7, CY - 7], [26 + i * 7, CY + 7], [23 + i * 7, CY + 7]]);
      ci(YL, 46, 4); ci(K, 46, 3); ci(YL, 46, 1); meta.rear = 10; meta.fore = 30; meta.muz = 54;
    },
    minelayer() { tubeT({ len: 44, h: 12, bands: [12, 26], acc: YL, nose: D, extra() { ci(D, 49, 6); ci(M, 49, 4.5); ci(K, 49, 2); sd(RD, 47, 3, 2, 2); } }); },
    laserpistol() { energyT({ len: 42, lens: true }); },
    plasmagun() { energyT({ len: 44, orb: 5, paint: '#4a4e66' }); },
    lightningpistol() { energyT({ len: 44, prongs: true }); },
    laserrifle() { energyT({ len: 54, lens: true, stock: true, extra() { cr(D, 18, 16, 5); cr(GL, 32, 3, 2); } }); },
    plasmarifle() { energyT({ len: 54, orb: 6, coil: true, stock: true, paint: '#4a4e66' }); },
    lightningrifle() { energyT({ len: 54, prongs: true, stock: true, extra() { cr(D, 18, 14, 5); cr(A, 20, 10, 1); } }); },
    plasmacannon() { energyT({ len: 54, orb: 8, coil: true, paint: '#4a4e66', extra() { sd(D, 8, 5, 20, 4); } }); },
    lightningcannon() { energyT({ len: 54, prongs: true, extra() { sd(D, 8, 5, 22, 4); sd(A, 26, 8, 2, 4); } }); },
    arcpistol() { energyT({ len: 38, prongs: true, paint: '#3a4a66' }); },
    ionbeam() { energyT({ len: 56, lens: true, stock: true, coil: true, extra() { cr(GL, 44, 10, 1); sd(A, 44, 1, 10, 1); } }); },
    pulseshotgun() { energyT({ len: 50, stock: true, paint: '#4a4e66', extra() { sd(M, 36, 2, 14, 3); sd(A, 36, 3, 14, 1); sd(GL, 50, 2, 3, 3); } }); },
    teslagun() { energyT({ len: 54, coil: true, prongs: true, extra() { ci(A, 32, 3); ci(GL, 32, 1.4); } }); },
    maw() {
      cr(K, 2, 14, 12); stockW(6, 6, 8);
      ci('#3a8a24', 22, 10); ci('#6cf03a', 22, 8); ci(K, 22, 4); ci('#d94a8a', 22, 2.2);
      po('#4aa82a', [[28, CY - 2], [54, CY - 11], [54, CY - 7], [34, CY - 1]]); po('#4aa82a', [[28, CY + 2], [54, CY + 11], [54, CY + 7], [34, CY + 1]]);
      for (let i = 0; i < 6; i++) { po(L, [[34 + i * 3.4, CY - 2 - i * 1.1], [36 + i * 3.4, CY - 3 - i * 1.2], [36 + i * 3.4, CY - 0.5]]); po(L, [[34 + i * 3.4, CY + 2 + i * 1.1], [36 + i * 3.4, CY + 3 + i * 1.2], [36 + i * 3.4, CY + 0.5]]); }
      meta.rear = 10; meta.fore = 26; meta.muz = 54;
    },
    needle() {
      cr(D, 2, 10, 20); cr(A, 4, 6, 2); sd(A, 4, 6, 6, 2);
      for (const dy of [-6, 0, 6]) { r(M, 12, CY + dy - 1.5, 42, 3); r(A, 14, CY + dy - 0.5, 34, 1); r(GL, 52, CY + dy - 1, 3, 2); }
      cr(D, 22, 2, 18); cr(D, 44, 2, 18); meta.rear = 8; meta.fore = 28; meta.muz = 54;
    },
    eggcannon() {
      ci(K, 16, 12.5); ci('#e8e2cc', 16, 11.5); ci('#f6f2e2', 14, 7); sd('#cbbd98', 16, 6, 3, 3); ci(BR, 16, 5); ci(K, 16, 3);
      cr(D, 28, 26, 14); cr(M, 28, 26, 2); cr(OR, 32, 16, 3); sd(D, 44, 7, 4, 3); cr(K, 52, 3, 10); meta.rear = 12; meta.fore = 34; meta.muz = 54;
    },
    boilercannon() {
      ci(K, 17, 13.5); ci('#b0603a', 17, 12.5); ci('#e08a50', 17, 9); for (let i = 0; i < 6; i++) { g.fillStyle = K; g.beginPath(); g.arc(17 + Math.cos(i * 1.05) * 10, CY + Math.sin(i * 1.05) * 10, 1, 0, 6.283); g.fill(); } ci(D, 17, 5); ci(OR, 17, 3.4); ci(YL, 17, 1.6);
      cr(D, 30, 24, 16); cr(M, 30, 24, 2); cr(OR, 34, 14, 3); cr(OR, 50, 3, 22); cr(K, 52, 3, 12); meta.rear = 12; meta.fore = 36; meta.muz = 54;
    },
    // ----- melee -----
    wrench() { cr(M, 4, 34, 4); cr(L, 4, 34, 1); cr(RD, 0, 6, 6); ci(M, 44, 8); ci(K, 49, 5); cr(K, 49, 7, 10); sd(M, 46, 6, 8, 2); meta.rear = 8; meta.muz = 54; },
    shovel() { cr(Wd, 2, 30, 3); cr(W, 2, 30, 1); cr(D, 30, 4, 8); sy(M, [[34, CY - 4], [46, CY - 6], [54, CY - 2]]); cr(D, 38, 14, 1); cr(L, 36, 2, 10); meta.rear = 10; meta.muz = 54; },
    bat() { sy(Wd, [[2, CY - 2], [30, CY - 3]]); sy(W, [[30, CY - 4], [46, CY - 5], [54, CY - 3]]); cr(BR, 3, 6, 5); sd(M, 36, 3, 2, 1); sd(M, 42, 3, 2, 1); cr(Wd, 6, 46, 1); meta.rear = 8; meta.muz = 54; },
    machete() { bladeT({ hl: 12, bw: 8, len: 54, tip: 8, hc: K, col: S }); },
    screwdriver() { cr(OR, 0, 16, 8); cr(RD, 0, 3, 8); for (let i = 0; i < 4; i++) cr(K, 4 + i * 3, 1, 8); cr(D, 16, 3, 4); cr(M, 18, 28, 2); cr(L, 18, 28, 1); sy(L, [[44, CY - 2], [54, CY - 0.5]]); meta.rear = 8; meta.muz = 54; },
    axe() { cr(Wd, 2, 44, 3); cr(W, 2, 44, 1); sy(M, [[34, CY - 5], [44, CY - 12], [52, CY - 10]]); cr(D, 34, 8, 6); cr(L, 50, 2, 20); cr(K, 40, 6, 1); meta.rear = 10; meta.muz = 54; },
    hammer() { cr(Wd, 2, 44, 3); cr(W, 2, 44, 1); cr(D, 40, 14, 22); cr(M, 40, 14, 2); cr(K, 44, 6, 14); cr(L, 52, 2, 22); cr(RD, 46, 2, 10); meta.rear = 10; meta.muz = 54; },
    chainsaw() { cr(RD, 2, 18, 14); cr(D, 2, 18, 2); cr(K, 6, 8, 6); cr(YL, 6, 8, 1); cr(M, 20, 34, 8); cr(K, 22, 30, 3); for (let x = 22; x < 54; x += 3) { sd(L, x, 4, 2, 1); } ci(D, 52, 4); ci(M, 52, 2); meta.rear = 10; meta.fore = 20; meta.muz = 54; },
    katana() { bladeT({ hl: 12, bw: 4, len: 56, tip: 6, hc: K, col: L, gw: 8, fuller: M }); sd(RD, 2, 2, 1, 1); },
    ebl() { bladeT({ hl: 10, bw: 8, len: 56, tip: 8, hc: K, col: A, fuller: GL }); cr(GL, 14, 38, 3); },
    ehammer() { cr(K, 2, 40, 3); cr(A, 8, 2, 3); cr(A, 20, 2, 3); cr(D, 38, 16, 24); cr(A, 40, 12, 20); cr(GL, 43, 6, 14); cr(D, 38, 16, 3); meta.rear = 10; meta.muz = 54; },
    crowbar() { cr(D, 2, 44, 4); cr(L, 2, 44, 1); cr(RD, 6, 10, 4); po(D, [[44, CY - 2], [54, CY - 6], [54, CY - 2]]); po(D, [[44, CY + 2], [54, CY + 6], [54, CY + 2]]); meta.rear = 10; meta.muz = 54; },
    pickaxe() { cr(Wd, 2, 50, 3); cr(W, 2, 50, 1); sy(L, [[32, CY - 2], [38, CY - 8], [52, CY - 12]]); cr(D, 32, 6, 8); sd(M, 40, 7, 6, 2); meta.rear = 10; meta.muz = 54; },
    spear() { cr(Wd, 2, 40, 3); cr(W, 2, 40, 1); cr(RD, 6, 2, 6); cr(RD, 34, 5, 6); sy(L, [[42, CY - 5], [48, CY - 4], [56, CY - 0.5]]); sy(M, [[44, CY - 2], [50, CY - 2]]); cr(BR, 40, 3, 8); meta.rear = 10; meta.muz = 55; },
    rapier() { cr(K, 0, 10, 4); cr(BR, 1, 8, 1); ci(BR, 14, 6); ci(K, 14, 4); ci(BR, 14, 2); cr(L, 18, 36, 2); cr(M, 18, 36, 1); sy(L, [[52, CY - 1.5], [56, CY - 0.5]]); cr(GL, 20, 30, 1); meta.rear = 5; meta.muz = 56; },
    halberd() { cr(Wd, 2, 44, 3); cr(W, 2, 44, 1); cr(BR, 6, 3, 6); cr(BR, 24, 3, 6); sy(M, [[38, CY - 4], [46, CY - 12], [54, CY - 8]]); sy(L, [[46, CY - 2], [50, CY - 2], [56, CY - 0.5]]); cr(M, 44, 6, 6); cr(D, 40, 6, 1); meta.rear = 10; meta.muz = 56; },
    fryingpan() { cr(K, 2, 22, 4); cr(RD, 2, 6, 5); ci(K, 40, 13.5); ci(D, 40, 12.5); ci(M, 40, 11); ci(K, 40, 8.5); ci('#3a3d4a', 40, 8); ci('#f0ead0', 40, 3.4); ci(YL, 40, 1.6); meta.rear = 8; meta.muz = 54; },
    // ----- new bullet / shell / bolt / explosive weapons -----
    twinpistols() { for (const s of [-1, 1]) { const y = CY + s * 6; r(W, 4, y - 2, 10, 4); r(M, 12, y - 2.5, 28, 5); r(L, 12, y - 2.5, 28, 1); r(D, 38, y - 1.5, 6, 3); r(A, 16, y - 0.5, 18, 1); } cr(D, 8, 4, 4); meta.rear = 10; meta.fore = null; meta.muz = 44; },
    burstpistol() { pistolT({ len: 40, acc: OR, extra() { cr(D, 20, 12, 8); rails(22, 3); } }); },
    marksman() { rifleT({ len: 56, stock: 'wood', guard: 'wood', muzzle: 'brake', optic: 'scope', acc: BL, hg: 8 }); },
    ricochet() { rifleT({ len: 52, stock: 'steel', guard: 'vent', muzzle: 'flash', optic: 'red', acc: PU, extra() { for (let i = 0; i < 4; i++) sd(PU, 34 + i * 4, 3, 3, 1); } }); },
    pump() { shotT({ len: 52, pump: true, wood: true }); },
    ripper() { shotT({ len: 52, drum: true, extra() { for (let i = 0; i < 5; i++) sd(L, 32 + i * 4, 2, 2, 2); cr(RD, 30, 18, 2); } }); },
    harpoon() { xbowT({ limb: 8, winch: true, extra() { cr(L, 30, 24, 1); po(L, [[48, CY - 3], [56, CY], [48, CY + 3]]); } }); },
    boltfan() { xbowT({ bolts: 5, limb: 10, extra() { sp(GN, [[34, CY - 3], [52, CY - 12], [52, CY - 8], [34, CY - 1]]); } }); },
    cluster() { tubeT({ len: 48, h: 13, bands: [14, 28, 40], acc: OR, extra() { sd(RD, 44, 3, 5, 5); } }); },
    rocketpods() {
      for (const dy of [-9, -3, 3, 9]) for (const dx of [0, 14]) { r(D, 6 + dx, CY + dy - 2.5, 12, 5); r(M, 6 + dx, CY + dy - 2.5, 12, 1); r(RD, 16 + dx, CY + dy - 1, 2, 2); }
      cr(M, 34, 4, 26); cr(D, 38, 14, 10); cr(OR, 42, 8, 2); cr(K, 50, 3, 8); cr(K, 2, 5, 12); meta.rear = 8; meta.fore = 30; meta.muz = 52;
    },
  };
  (art[{ sledge: 'hammer', energysword: 'ebl', energyhammer: 'ehammer' }[id] || id] || art.revolver)();
  WEAPON_TOP_META[id] = meta;
  // shading: lit from the centre line (symmetric), darker towards the edges, coloured outline
  const IW = WEAPON_TOP_W, IH = WEAPON_TOP_H, img = g.getImageData(0, 0, IW, IH), px = img.data;
  for (let i = 3; i < px.length; i += 4) px[i] = px[i] >= 110 ? 255 : 0;
  const out = new Uint8ClampedArray(px), has = (x, y) => x >= 0 && y >= 0 && x < IW && y < IH && px[(y * IW + x) * 4 + 3] > 0;
  const top = new Array(IW).fill(99), bot = new Array(IW).fill(-1);
  for (let x = 0; x < IW; x++) for (let y = 0; y < IH; y++) if (has(x, y)) { if (top[x] === 99) top[x] = y; bot[x] = y; }
  const aRGB = [parseInt(A.slice(1, 3), 16), parseInt(A.slice(3, 5), 16), parseInt(A.slice(5, 7), 16)];
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    if (!has(x, y)) continue;
    const k = (y * IW + x) * 4, mid = (top[x] + bot[x]) / 2, half = (bot[x] - top[x]) / 2 + 0.5, t = Math.abs(y - mid) / half;
    let d = (0.45 - t) * 40;
    if (!has(x, y - 1) || !has(x, y + 1)) d -= 14;
    if (!has(x - 1, y)) d += 10;
    if (Math.abs(px[k] - aRGB[0]) + Math.abs(px[k + 1] - aRGB[1]) + Math.abs(px[k + 2] - aRGB[2]) < 40) d += 24;
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
