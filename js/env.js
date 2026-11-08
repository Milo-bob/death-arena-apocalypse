// Environments: dark ruined-world floors per act, obstacles, lighting, menu scene. All pixel-drawn on a 2px grid.
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const sn = v => Math.round(v / 2) * 2;

const BIOME = [
  { name: 'ruins', slabs: ['#3a3835', '#403d39', '#35332f', '#443f3a'], grout: '#232220', hi: '#57534c', crack: '#171615', puddle: '#1d2a34', wall: ['#2a2826', '#33302c', '#1d1c1a'], amb: 0.5, tint: '6,10,22' },
  { name: 'foundry', slabs: ['#3b2c25', '#43322a', '#372920', '#4a372d'], grout: '#1a110d', hi: '#6a4a38', crack: '#120b08', puddle: '#120e0c', wall: ['#2c1e18', '#38271f', '#1a110d'], amb: 0.44, tint: '24,8,2' },
  { name: 'core', slabs: ['#241a2e', '#2b1f36', '#20172a', '#30223c'], grout: '#100a16', hi: '#44305a', crack: '#0a0610', puddle: '#1a0f26', wall: ['#1c1226', '#271a33', '#120a1a'], amb: 0.56, tint: '14,2,20' },
];

function walk(g, R, x, y, len, col, halo) {
  let dx = R() < 0.5 ? 2 : -2, dy = 0;
  for (let i = 0; i < len; i++) {
    if (halo) { g.fillStyle = halo; g.fillRect(x - 3, y - 3, 8, 8); }
    g.fillStyle = col; g.fillRect(x, y, 2, 2);
    if (R() < 0.35) { const t = dx; dx = dy || (R() < 0.5 ? 2 : -2); dy = t === 0 ? 0 : (dy ? 0 : (R() < 0.5 ? 2 : -2)); if (!dx && !dy) dx = 2; }
    x += dx; y += dy;
  }
}

function paintRegion(g, R, B, a, rx, ry, rw, rh, big) {
  const T = 40;
  for (let sx = rx; sx < rx + rw; sx += T) for (let sy = ry; sy < ry + rh; sy += T) {
    const w = Math.min(T, rx + rw - sx), h = Math.min(T, ry + rh - sy);
    g.fillStyle = B.slabs[(R() * 4) | 0]; g.fillRect(sx, sy, w, h);
    for (let cx = 0; cx < w; cx += 2) for (let cy = 0; cy < h; cy += 2) { const r = R(); if (r < 0.1) { g.fillStyle = 'rgba(255,255,255,.045)'; g.fillRect(sx + cx, sy + cy, 2, 2); } else if (r < 0.22) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(sx + cx, sy + cy, 2, 2); } }
    g.fillStyle = B.hi; g.globalAlpha = 0.45; g.fillRect(sx, sy, w, 2); g.fillRect(sx, sy, 2, h); g.globalAlpha = 1;
    g.fillStyle = B.grout; g.fillRect(sx, sy + h - 2, w, 2); g.fillRect(sx + w - 2, sy, 2, h);
    if (w < 12 || h < 12) continue;
    const px = () => sx + 4 + sn(R() * (w - 10)), py = () => sy + 4 + sn(R() * (h - 10));
    if (R() < 0.35) walk(g, R, px(), py(), 5 + ((R() * 10) | 0), B.crack);
    if (a === 0) {
      if (R() < 0.12) { g.fillStyle = '#5a554d'; for (let i = 0; i < 4; i++) g.fillRect(px(), py(), 2 + 2 * ((R() * 2) | 0), 2); }
      if (R() < 0.07) { const x = px(), y = py(); g.fillStyle = B.puddle; g.fillRect(x, y, 14, 8); g.fillRect(x + 2, y - 2, 10, 12); g.fillStyle = 'rgba(160,190,220,.18)'; g.fillRect(x + 2, y + 2, 6, 2); }
      if (R() < 0.07) { const x = px(), y = py(); for (let i = 0; i < 5; i++) { g.fillStyle = R() < 0.5 ? '#3d4a2a' : '#4b5a33'; g.fillRect(x + i * 2, y - ((R() * 3) | 0) * 2, 2, 6); } }
    } else if (a === 1) {
      g.fillStyle = '#6a4a38'; for (const [qx, qy] of [[sx + 4, sy + 4], [sx + w - 8, sy + 4], [sx + 4, sy + h - 8], [sx + w - 8, sy + h - 8]]) g.fillRect(qx, qy, 2, 2);
      if (R() < 0.1) { const y = sy + 14; for (let i = 0; i < w; i += 8) { g.fillStyle = (i / 8) % 2 ? '#a07a1a' : '#1a1a1a'; g.fillRect(sx + i, y, 8, 6); } }
      if (R() < 0.14) walk(g, R, px(), py(), 9 + ((R() * 8) | 0), '#ffb347', 'rgba(255,106,31,.22)');
      if (R() < 0.08) { const x = px(), y = py(); g.fillStyle = B.puddle; g.fillRect(x, y, 12, 8); }
    } else {
      if (R() < 0.2) walk(g, R, px(), py(), 8 + ((R() * 10) | 0), '#c0306a', 'rgba(192,48,106,.16)');
      if (R() < 0.06) { const x = px(), y = py(); g.fillStyle = '#6a3ad0'; g.fillRect(x, y, 4, 8); g.fillRect(x + 4, y + 4, 2, 6); g.fillStyle = '#b898ff'; g.fillRect(x, y, 2, 4); }
      if (R() < 0.05) { const x = px(), y = py(); g.fillStyle = '#8a7a8a'; g.fillRect(x, y, 8, 2); g.fillRect(x + 2, y - 2, 2, 6); }
    }
  }
  if (big) for (let i = 0; i < 4; i++) {          // depth shadow under the walls
    g.fillStyle = 'rgba(0,0,0,' + (0.38 - i * 0.09) + ')'; const o = i * 4, s = 4;
    g.fillRect(rx, ry + o, rw, s); g.fillRect(rx, ry + rh - o - s, rw, s); g.fillRect(rx + o, ry, s, rh); g.fillRect(rx + rw - o - s, ry, s, rh);
  }
}

function paintWalls(g, R, B, w, h) {
  for (let y = 0; y < h; y += 10) for (let x = -(y / 10 % 2) * 10; x < w; x += 20) {
    g.fillStyle = B.wall[(R() * 3) | 0]; g.fillRect(x, y, 20, 10); g.fillStyle = B.wall[2]; g.fillRect(x, y + 8, 20, 2); g.fillRect(x + 18, y, 2, 10);
    if (R() < 0.2) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x, y, 18, 2); }
  }
}

// one big floor canvas for a whole act: regions = [{x,y,w,h,big}] of walkable ground
function buildWorldFloor(act, seed, regions, WW, HH) {
  const B = BIOME[(act % 3)], R = rng(seed), a = (act % 3), c = document.createElement('canvas'); c.width = WW; c.height = HH;
  const g = c.getContext('2d');
  paintWalls(g, R, B, WW, HH);
  for (const r of regions) paintRegion(g, R, B, a, r.x, r.y, r.w, r.h, r.big);
  g.fillStyle = B.hi;
  for (const r of regions) if (r.big) { g.fillRect(r.x - 2, r.y - 2, r.w + 4, 2); g.fillRect(r.x - 2, r.y + r.h, r.w + 4, 2); g.fillRect(r.x - 2, r.y, 2, r.h); g.fillRect(r.x + r.w, r.y, 2, r.h); }
  return c;
}

function drawObstacle(g, q, act) {
  const x = sn(q.x), y = sn(q.y), w = sn(q.w), h = sn(q.h), a = (act % 3), R = rng(x * 31 + y * 7), fh = 12;
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + 6, y + 8, w, h);
  if (a === 0) {
    g.fillStyle = '#3a3834'; g.fillRect(x, y + h - fh, w, fh); g.fillStyle = '#2a2826'; for (let i = 6; i < w - 4; i += 12) g.fillRect(x + i, y + h - fh, 2, fh);
    g.fillStyle = '#5a564f'; g.fillRect(x, y, w, h - fh); g.fillStyle = '#6e6a62'; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h - fh); g.fillStyle = '#2a2826'; g.fillRect(x + w - 2, y, 2, h - fh);
    for (let i = 0; i < 10; i++) { g.fillStyle = R() < 0.5 ? '#4a4640' : '#68645c'; g.fillRect(x + 4 + sn(R() * (w - 10)), y + 4 + sn(R() * (h - fh - 10)), 2, 2); }
    walk(g, R, x + 8 + sn(R() * (w - 20)), y + 4, 6, '#2a2826'); g.fillStyle = '#7a4a2a'; g.fillRect(x + 4, y + 2, 2, 4); g.fillRect(x + w - 8, y + 2, 2, 4);
  } else if (a === 1) {
    g.fillStyle = '#2a1c14'; g.fillRect(x, y + h - fh, w, fh);
    for (let i = 0; i < w; i += 8) { g.fillStyle = (i / 8) % 2 ? '#a07a1a' : '#1a1a1a'; g.fillRect(x + i, y + h - fh + 2, Math.min(8, w - i), fh - 4); }
    g.fillStyle = '#6a4a38'; g.fillRect(x, y, w, h - fh); g.fillStyle = '#8a6448'; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h - fh); g.fillStyle = '#3a2820'; g.fillRect(x + 4, y + 4, w - 8, h - fh - 8);
    g.fillStyle = '#6a4a38'; g.fillRect(x + 6, y + 6, w - 12, h - fh - 12); g.fillStyle = '#d0b090'; for (const [rx, ry] of [[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - fh - 5], [x + w - 5, y + h - fh - 5]]) g.fillRect(rx, ry, 2, 2);
  } else {
    g.fillStyle = '#1c1226'; g.fillRect(x, y + h - fh, w, fh); g.fillStyle = '#6a3ad0'; g.fillRect(x, y + h - fh, w, 2);
    g.fillStyle = '#3a2a52'; g.fillRect(x, y, w, h - fh); g.fillStyle = '#5a40a0'; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h - fh);
    g.fillStyle = '#6a3ad0'; for (let i = 0; i < w - 6; i += 2) { g.fillRect(x + 3 + i, y + 3 + (i >> 1) % (h - fh - 6), 2, 2); }
    g.fillStyle = '#b898ff'; g.fillRect(x + w / 2 - 2, y + (h - fh) / 2 - 2, 4, 4); g.fillStyle = 'rgba(184,152,255,.3)'; g.fillRect(x + w / 2 - 6, y + (h - fh) / 2 - 6, 12, 12);
  }
}

// ---------- lighting: dark ambient layer with stepped light holes ----------
const Light = {
  cv: null, g: null, ox: 0, oy: 0,
  begin(amb, tint, safe, ox, oy) {
    this.ox = ox || 0; this.oy = oy || 0;
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.width = W; this.cv.height = H; this.g = this.cv.getContext('2d'); }
    const g = this.g; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(' + tint + ',' + (safe ? amb * 0.75 : amb) + ')'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
  },
  add(x, y, r, a) { const g = this.g; a = a || 0.3; x -= this.ox; y -= this.oy; if (x < -r || y < -r || x > W + r || y > H + r) return; for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(0,0,0,' + a + ')'; g.beginPath(); g.arc(x, y, r * (1 - i * 0.24), 0, 6.283); g.fill(); } },
  end(ctx) { ctx.drawImage(this.cv, this.ox, this.oy); },
};

// ---------- menu scene: ruined skyline at dusk ----------
function buildMenuScene() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), R = rng(77);
  const bands = ['#0a0508', '#12080a', '#1c0b0c', '#2a100d', '#3d1810', '#5a2412', '#7a3414'];
  const hz = 340;
  bands.forEach((col, i) => { const y0 = Math.round(i * hz / bands.length), y1 = Math.round((i + 1) * hz / bands.length); g.fillStyle = col; g.fillRect(0, y0, W, y1 - y0 + 1); if (i < bands.length - 1) { g.fillStyle = bands[i + 1]; for (let x = 0; x < W; x += 4) for (let y = y1 - 8; y < y1; y += 4) if (((x + y) / 4) % 2) g.fillRect(x, y, 4, 4); } });
  g.fillStyle = '#0a0508'; g.fillRect(0, hz, W, H - hz);
  // sun
  const sx = 690, sy = 300;
  for (const [r, col] of [[120, '#4a1c10'], [92, '#7a2c14'], [64, '#a8421a'], [44, '#d0662a']]) { g.fillStyle = col; for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (Math.hypot(x, y) < r) g.fillRect(sx + x, sy + y, 2, 2); }
  // stars
  g.fillStyle = '#d8d2c0'; for (let i = 0; i < 40; i++) g.fillRect(sn(R() * W), sn(R() * 160), 2, 2);
  function skyline(col, base, minH, maxH, wmin, wmax, lit) {
    let x = -10; while (x < W) {
      const w = sn(wmin + R() * (wmax - wmin)), h = sn(minH + R() * (maxH - minH));
      g.fillStyle = col; g.fillRect(x, base - h, w, h + 200);
      // broken top notches
      for (let i = 0; i < w; i += 6) if (R() < 0.45) g.fillRect(x + i, base - h - 2 * ((R() * 5) | 0), 6, 12);
      if (R() < 0.3) g.fillRect(x + w / 2, base - h - 20 - sn(R() * 30), 2, 30);
      if (lit) for (let i = 0; i < 6; i++) if (R() < 0.5) { g.fillStyle = R() < 0.5 ? '#c98a2a' : '#7a5a1a'; g.fillRect(x + 4 + sn(R() * (w - 10)), base - h + 8 + sn(R() * (h - 20)), 2, 4); g.fillStyle = col; }
      x += w + sn(R() * 4);
    }
  }
  skyline('#1a0c0c', 360, 50, 170, 24, 60, false);
  skyline('#0d0709', 410, 40, 150, 30, 80, true);
  // foreground rubble
  g.fillStyle = '#050304'; g.fillRect(0, 430, W, H - 430);
  for (let i = 0; i < 40; i++) { const x = sn(R() * W), h = 6 + sn(R() * 24), w = 10 + sn(R() * 40); g.fillRect(x, 430 - h, w, h + 2); }
  return c;
}
const Menu = {
  scene: null, t: 0, embers: Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 12 + Math.random() * 30, ph: Math.random() * 6 })),
  draw(ctx) {
    if (!this.scene) this.scene = buildMenuScene();
    this.t += 0.016; ctx.drawImage(this.scene, 0, 0);
    // fog bands
    for (let i = 0; i < 4; i++) { const y = 300 + i * 34, off = (this.t * (6 + i * 3) + i * 200) % (W + 400); ctx.fillStyle = 'rgba(120,70,50,' + (0.07 + i * 0.015) + ')'; ctx.fillRect(off - 400, y, 400, 14); ctx.fillRect(off - 400 - W - 400, y, 400, 14); }
    for (const e of this.embers) { e.y -= e.v * 0.016; e.x += Math.sin(this.t + e.ph) * 0.3; if (e.y < -4) { e.y = H + 4; e.x = Math.random() * W; } ctx.fillStyle = Math.sin(this.t * 3 + e.ph) > 0 ? '#ff8a1f' : '#c0501a'; ctx.fillRect(sn(e.x), sn(e.y), 2, 2); }
  },
};

// ---------- extra menu scenes: slot selection (arena gate) and hub (camp at night) ----------
function buildSlotScene() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), R = rng(21);
  const bands = ['#05060c', '#090b16', '#0e1222', '#151a2e', '#1c2238'];
  bands.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 80, W, 82); });
  g.fillStyle = '#d8d2c0'; for (let i = 0; i < 60; i++) g.fillRect(sn(R() * W), sn(R() * 260), 2, 2);
  g.fillStyle = '#c8c0a8'; for (let y = -34; y <= 34; y += 2) for (let x = -34; x <= 34; x += 2) if (Math.hypot(x, y) < 34) g.fillRect(120 + x, 90 + y, 2, 2);   // moon
  g.fillStyle = '#0e1222'; for (let y = -30; y <= 30; y += 2) for (let x = -30; x <= 30; x += 2) if (Math.hypot(x - 14, y - 6) < 30 && Math.hypot(x, y) < 34) g.fillRect(120 + x, 90 + y, 2, 2);
  // the great gate: two towers and a broken arch
  const dark = '#07080d', mid = '#10121c';
  for (const tx of [90, 770]) { g.fillStyle = dark; g.fillRect(tx, 130, 100, 420); g.fillStyle = mid; for (let y = 130; y < 420; y += 20) for (let x = tx + 4; x < tx + 96; x += 20) if (R() < 0.4) g.fillRect(x, y + 4, 14, 8); for (let i = 0; i < 5; i++) { g.fillStyle = dark; g.fillRect(tx + i * 22, 118 + (R() < 0.4 ? 8 : 0), 14, 16); } }
  g.fillStyle = dark; for (let a = 0; a < 3.14; a += 0.02) { const x = 480 + Math.cos(a) * 300, y = 300 - Math.sin(a) * 200; if (R() < 0.97) g.fillRect(sn(x) - 14, sn(y) - 12, 28, 26); }
  g.fillStyle = '#05060c'; for (let a = 0; a < 3.14; a += 0.02) { const x = 480 + Math.cos(a) * 300, y = 300 - Math.sin(a) * 200; g.fillRect(sn(x) - 2, sn(y) - 2, 2, 2); }
  g.fillStyle = '#0a0c14'; g.fillRect(0, 440, W, H - 440); g.fillStyle = dark; for (let i = 0; i < 30; i++) { const x = sn(R() * W), h = 6 + sn(R() * 22); g.fillRect(x, 440 - h, 10 + sn(R() * 30), h + 2); }
  return c;
}
function buildHubScene(col) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), R = rng(55);
  const bands = ['#05060c', '#0a0c18', '#10142a', '#171c38', '#1d2342'];
  bands.forEach((b, i) => { g.fillStyle = b; g.fillRect(0, i * 88, W, 90); });
  g.fillStyle = '#d8d2c0'; for (let i = 0; i < 50; i++) g.fillRect(sn(R() * W), sn(R() * 240), 2, 2);
  // broken arena wall behind the camp
  g.fillStyle = '#080a12'; for (let x = 0; x < W; x += 20) { const h = 130 + Math.sin(x / 90) * 40 + (R() < 0.25 ? -40 : 0); g.fillRect(x, 400 - h, 20, h + 80); }
  g.fillStyle = '#0c0f1a'; for (let x = 0; x < W; x += 40) for (let y = 300; y < 440; y += 20) if (R() < 0.3) g.fillRect(x + 4, y, 22, 8);
  // tents
  for (const [tx, ty, s] of [[360, 430, 1.2], [620, 440, 1]]) { g.fillStyle = '#10121c'; for (let i = 0; i < 60 * s; i += 2) { const w = (60 * s - i) * 1.2; g.fillRect(tx - w / 2, ty - i, w, 2); } g.fillStyle = col; g.fillRect(tx - 2, ty - 62 * s, 4, 10); }
  g.fillStyle = '#05060c'; g.fillRect(0, 440, W, H - 440); g.fillStyle = '#0a0c16'; for (let i = 0; i < 26; i++) { const x = sn(R() * W), h = 4 + sn(R() * 12); g.fillRect(x, 440 - h + 8, 10 + sn(R() * 24), h); }
  // clan banner
  g.fillStyle = '#1a1c22'; g.fillRect(868, 300, 4, 160); g.fillStyle = col; g.globalAlpha = 0.85; g.fillRect(836, 308, 36, 70); g.fillRect(844, 378, 20, 8); g.fillRect(852, 386, 4, 6); g.globalAlpha = 1;
  return c;
}
Object.assign(Menu, {
  mode: 'title', clan: null, hero: null, cache: {},
  set(mode, clan, hero) { this.mode = mode; this.clan = clan; this.hero = hero; },
  draw(ctx) {
    this.t += 0.016;
    let scene;
    if (this.mode === 'slots') scene = this.cache.slots || (this.cache.slots = buildSlotScene());
    else if (this.mode === 'hub') { const col = CLANS[this.clan].color; scene = this.cache['h' + col] || (this.cache['h' + col] = buildHubScene(col)); }
    else scene = this.scene || (this.scene = buildMenuScene());
    ctx.drawImage(scene, 0, 0);
    if (this.mode === 'hub') {
      // campfire + the selected hero standing by it
      const fx = 215, fy = 500, t = this.t;
      for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,130,30,' + (0.05 + 0.01 * Math.sin(t * 7 + i)) + ')'; ctx.beginPath(); ctx.arc(fx, fy - 10, 230 - i * 50, 0, 6.283); ctx.fill(); }
      ctx.fillStyle = '#5a3a1c'; ctx.fillRect(fx - 24, fy + 2, 48, 8); ctx.fillStyle = '#7a5a2c'; ctx.fillRect(fx - 18, fy - 4, 36, 8);
      for (let k = 0; k < 7; k++) { const h = 26 + Math.sin(t * 9 + k * 1.7) * 9 - Math.abs(k - 3) * 6; ctx.fillStyle = k === 3 ? '#ffe08a' : k % 2 ? '#ff8a1f' : '#ff6a1f'; ctx.fillRect(fx - 14 + k * 4, fy - h, 4, h); }
      if (this.hero) { const spr = Sprites.rot(this.hero, 0), n = spr.width * 3, bob = Math.round(Math.sin(t * 2) * 2) * 2; ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, 56, 420 + bob, n, n); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(56 + n / 2 - 36, 528, 72, 4); }
    }
    for (let i = 0; i < 4; i++) { const y = 300 + i * 34, off = (this.t * (6 + i * 3) + i * 200) % (W + 400); ctx.fillStyle = 'rgba(120,90,80,' + (0.05 + i * 0.012) + ')'; ctx.fillRect(off - 400, y, 400, 14); ctx.fillRect(off - 400 - W - 400, y, 400, 14); }
    for (const e of this.embers) { e.y -= e.v * 0.016; e.x += Math.sin(this.t + e.ph) * 0.3; if (e.y < -4) { e.y = H + 4; e.x = Math.random() * W; } ctx.fillStyle = Math.sin(this.t * 3 + e.ph) > 0 ? '#ff8a1f' : '#c0501a'; ctx.fillRect(sn(e.x), sn(e.y), 2, 2); }
  },
});

// organic cave floor: every floor tile is one painted slab, walls get shaded edges and a front face
function buildCaveFloor(act, seed, Wd) {
  const B = BIOME[act % 3], a = act % 3, R = rng(seed + 7), c = document.createElement('canvas'); c.width = Wd.w; c.height = Wd.h;
  const g = c.getContext('2d'), fl = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && Wd.grid[y * COLS + x] === 1;
  paintWalls(g, R, B, Wd.w, Wd.h);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (fl(x, y)) paintRegion(g, R, B, a, x * TILE, y * TILE, TILE, TILE, false);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const px = x * TILE, py = y * TILE;
    if (fl(x, y)) {
      g.fillStyle = 'rgba(0,0,0,.38)';
      if (!fl(x, y - 1)) g.fillRect(px, py, TILE, 10);
      if (!fl(x - 1, y)) g.fillRect(px, py, 8, TILE);
      if (!fl(x + 1, y)) g.fillRect(px + TILE - 8, py, 8, TILE);
      if (!fl(x, y + 1)) g.fillRect(px, py + TILE - 6, TILE, 6);
    } else if (fl(x, y + 1)) {
      g.fillStyle = B.wall[1]; g.fillRect(px, py + TILE - 16, TILE, 16);
      g.globalAlpha = 0.5; g.fillStyle = B.hi; g.fillRect(px, py + TILE - 16, TILE, 2); g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px, py + TILE - 6, TILE, 6);
    }
  }
  return c;
}
