// World: one connected map per act (a big organic cave, no map shown to the player, Nuclear Throne style). No rooms: enemies lie scattered through the whole cave, kill enough of them and a portal opens.
// Loaded after game.js; replaces the old door-room flow of Game.
const TILE = 40, COLS = 40, ROWS = 28, WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE, NEED_CLEAR = 6;
const CELL_COL = { fight: '#ff6a6a', elite: '#ff8a1f', shop: '#ffd91f', camp: '#39ff6e', event: '#b24bff', curse: '#ff3de8', boss: '#ff2d3d' };
const CELL_NAME = { start: 'START', fight: 'ARENA', elite: 'ELITE ARENA', shop: 'BLACK MARKET', camp: 'CAMP', event: 'STRANGE ALTAR', curse: 'CURSED SHRINE', boss: 'BOSS LAIR' };
const CELL_LET = { fight: 'F', elite: 'E', shop: '$', camp: 'C', event: 'A', curse: 'X', boss: 'B' };

function genWorld(act, seed) {
  const R = rng(seed), grid = new Uint8Array(COLS * ROWS), cells = [], pillars = [], bossLevel = isBossLevel(act);
  const carve = (tx, ty, rad) => {
    for (let y = Math.max(2, Math.floor(ty - rad)); y <= Math.min(ROWS - 3, Math.ceil(ty + rad)); y++)
      for (let x = Math.max(2, Math.floor(tx - rad)); x <= Math.min(COLS - 3, Math.ceil(tx + rad)); x++)
        if ((x - tx) * (x - tx) + (y - ty) * (y - ty) <= rad * rad) grid[y * COLS + x] = 1;
  };
  const floorAt = (px, py) => { const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE); return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS && grid[ty * COLS + tx] === 1; };
  const open = (px, py, rad) => { if (!floorAt(px, py)) return false; for (let a = 0; a < 6.3; a += 0.8) if (!floorAt(px + Math.cos(a) * rad, py + Math.sin(a) * rad)) return false; return true; };
  // 1) cavern centres, spread over the whole map (just caves, not rooms: nothing happens in them)
  const pts = [];
  for (let tries = 0; pts.length < 7 && tries < 5000; tries++) {
    const x = 5 + R() * (COLS - 10), y = 5 + R() * (ROWS - 10);
    if (pts.every(q => Math.hypot(q[0] - x, q[1] - y) > 7.5)) pts.push([x, y]);
  }
  const n = pts.length, startId = Math.floor(R() * n);
  const dS = i => Math.hypot(pts[i][0] - pts[startId][0], pts[i][1] - pts[startId][1]);
  const far = pts.map((_, i) => i).filter(i => i !== startId).sort((a, b) => dS(b) - dS(a));
  const bossId = bossLevel ? far[Math.floor(R() * 2)] : -1;
  const rest = pts.map((_, i) => i).filter(i => i !== startId && i !== bossId).sort(() => R() - 0.5);
  const special = new Map();   // node -> type of the small thing standing in it
  if (rest[0] !== undefined) special.set(rest[0], 'camp'); if (rest[1] !== undefined) special.set(rest[1], 'shop'); if (rest[2] !== undefined && R() < 0.5) special.set(rest[2], 'shop'); if (rest[3] !== undefined) special.set(rest[3], 'event');
  // 2) carve each cavern as an irregular blob
  pts.forEach((q, id) => {
    const rt = id === bossId ? 5.2 : id === startId ? 3 : special.has(id) ? 2.6 : 2.4 + R() * 1.8; q.push(rt);
    carve(q[0], q[1], rt * 0.7);
    for (let k = 0; k < 7; k++) { const a = R() * 6.283, d = rt * (0.35 + R() * 0.5); carve(q[0] + Math.cos(a) * d, q[1] + Math.sin(a) * d, rt * (0.3 + R() * 0.3)); }
  });
  // 3) wandering tunnels: spanning tree plus a few extra loops
  const tunnel = (a, b) => {
    let x = pts[a][0], y = pts[a][1], ang = Math.atan2(pts[b][1] - y, pts[b][0] - x);
    const tx = pts[b][0], ty = pts[b][1];
    for (let s = 0; s < 500 && Math.hypot(tx - x, ty - y) > 2.5; s++) {
      let diff = Math.atan2(ty - y, tx - x) - ang; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      ang += diff * 0.16 + (R() - 0.5) * 1.3; x += Math.cos(ang); y += Math.sin(ang); carve(x, y, 1.1 + R() * 0.6);
    }
    const len = Math.hypot(tx - x, ty - y); for (let t = 0; t <= len; t += 0.7) carve(x + (tx - x) * t / len, y + (ty - y) * t / len, 1.2);
  };
  const edges = [], linked = new Set([startId]), has = (a, b) => edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
  while (linked.size < n) {
    let best = null;
    for (const a of linked) for (let b = 0; b < n; b++) if (!linked.has(b)) { const d = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]); if (!best || d < best[2]) best = [a, b, d]; }
    edges.push(best); linked.add(best[1]);
  }
  for (let i = 0; i < 2; i++) {
    const a = Math.floor(R() * n), near = pts.map((_, b) => b).filter(b => b !== a).sort((u, v) => Math.hypot(pts[u][0] - pts[a][0], pts[u][1] - pts[a][1]) - Math.hypot(pts[v][0] - pts[a][0], pts[v][1] - pts[a][1])).slice(0, 3);
    const b = near[Math.floor(R() * near.length)]; if (!has(a, b)) edges.push([a, b]);
  }
  for (const [a, b] of edges) tunnel(a, b);
  // 4) drunkard-walk side caves and dead ends
  for (let w = 0; w < 3; w++) {
    let x = pts[Math.floor(R() * n)][0], y = pts[Math.floor(R() * n)][1], ang = R() * 6.283;
    for (let s = 0; s < 55; s++) {
      if (R() < 0.15) ang += (R() - 0.5) * 2.4;
      x = clamp(x + Math.cos(ang), 6, COLS - 7); y = clamp(y + Math.sin(ang), 6, ROWS - 7); carve(x, y, 1.0 + R() * 0.8);
    }
  }
  // 5) the few places that matter: start, boss arena, campfire, shops, altar
  const mk = (id, type) => {
    const q = pts[id], r = q[2] * TILE * 0.85, cx = q[0] * TILE, cy = q[1] * TILE;
    const c = { id: cells.length, type, cx, cy, r, x0: cx - r, y0: cy - r, ix: cx - r, iy: cy - r, iw: 2 * r, ih: 2 * r, links: [], combat: type === 'boss', safe: ['camp', 'shop', 'event'].includes(type), rewardKind: type === 'boss' ? 'rare' : '' };
    cells.push(c); return c;
  };
  mk(startId, 'start');
  if (bossLevel) mk(bossId, 'boss');
  for (const [id, type] of special) mk(id, type);
  const bossCell = cells.find(c => c.type === 'boss');
  if (bossCell) for (let i = 0, k = 5; i < 40 && k > 0; i++) {
    const a = R() * 6.283, d = bossCell.r * (0.35 + R() * 0.45), w = 44 + Math.floor(R() * 30), h = 44 + Math.floor(R() * 30), x = bossCell.cx + Math.cos(a) * d, y = bossCell.cy + Math.sin(a) * d;
    if (open(x, y, 80)) { pillars.push({ x: x - w / 2, y: y - h / 2, w, h }); k--; }
  }
  for (let i = 0; i < 12; i++) {   // loose rocks in the open caves
    const x = (4 + R() * (COLS - 8)) * TILE, y = (4 + R() * (ROWS - 8)) * TILE, w = 36 + Math.floor(R() * 30), h = 36 + Math.floor(R() * 30);
    if (open(x, y, 100) && cells.every(c => Math.hypot(c.cx - x, c.cy - y) > 130)) pillars.push({ x: x - w / 2, y: y - h / 2, w, h });
  }
  return { cells, grid, pillars, startId: 0, bossId: bossCell ? bossCell.id : -1, need: 0, w: WORLD_W, h: WORLD_H, total: 0 };
}

Object.assign(Game, {
  // ---------- run flow ----------
  startRun() {
    const s = Save.data, hero = HEROES[s.hero];
    const lo = (s.loadout && s.loadout[s.hero]) || {}, own = id => (id && s.heroes[id] && HEROES[id].clan === hero.clan ? id : s.hero);
    this.run = { hero: s.hero, wpn: hero.start || s.hero, abl: s.hero, clan: hero.clan, act: 0, seed: (Math.random() * 1e9) | 0, cstate: {}, cleared: 0, perks: [], drawbacks: [], hp: 100, gold: 20 + 25 * (s.meta.fort || 0), cores: 0,
      heat: s.heat, kills: 0, rooms: 0, xp: 0, plv: 1, coreAcc: 0, ammo: startAmmo(), wpn2: hero.start2 || null, bonus: { mut: 0 }, mutKills: 0, killAcc: 0, phoenixUsed: false, t0: Date.now() };
    this.P = buildStats(this.run, s); this.run.hp = this.P.maxhp;
    this.enterAct();
  },
  resume() { this.run = Save.data.run; this.P = buildStats(this.run, Save.data); this.enterAct(); },
  descend(h) {
    const run = this.run; run.act++; run.seed = (Math.random() * 1e9) | 0; run.cstate = {}; run.cleared = 0;
    this.heal(h === undefined ? 0.35 : h); this.frozen = false; this.enterAct();
  },
  enterAct() {
    const run = this.run, act = run.act, W = this.world = genWorld(act, run.seed);
    for (const c of W.cells) c.state = run.cstate[c.id] || (run.cstate[c.id] = {});
    const sc = W.cells[W.startId]; sc.state.visited = true;
    const P = this.P = buildStats(run, Save.data);
    const C = this.C = { world: W, t: 0, en: [], eb: [], pb: [], haz: [], zones: [], gold: [], parts: [], fl: [], turrets: [], beams: [], markers: [], fx: [], pillars: W.pillars,
      waves: [], waveIdx: 0, waveCd: 0, shake: 0, boss: null, bladeAng: 0, intro: 0, banner: 2.6, bannerText: ACT_NAMES[areaOf(act)].toUpperCase() + ' ' + (areaOf(act) + 1) + '-' + (act % 3 + 1), enc: null, props: [], burstQ: [], items: [], chests: [], lvlKills: 0, levelTotal: 0, portal: null, levelUps: 0, wdrops: [], hitstop: 0, curCell: sc, cam: { x: clamp(sc.cx - W_ / 2, 0, W.w - W_), y: clamp(sc.cy + 70 - H / 2, 0, W.h - H) }, mx: 0, my: 0,
      noHit: true, hpS: 1, dmgS: 1, spdS: 1, curse: {}, clearMsg: 0, near: null,
      p: { x: sc.cx, y: sc.cy + 70, lx: sc.cx, ly: sc.cy + 70, r: 12, aim: -Math.PI / 2, fireT: 0.3, dashT: 0, dashCd: 0, dashDir: 0, dashHit: [], inv: 0.5, abT: 2, flash: 0, over: 0, overRate: 1, shield: 0, still: 0, trailT: 0, regenAcc: 0 },
      dust: Array.from({ length: 36 }, () => ({ x: rnd(0, W_), y: rnd(60, H), vx: rnd(-6, 6), vy: areaOf(act) === 1 ? rnd(-22, -8) : rnd(-4, 6) })) };
    for (const c of W.cells) {
      c.obj = null;
      if (c.type === 'camp') c.obj = { kind: 'rest', x: c.cx, y: c.cy };
      else if (c.type === 'shop' || c.type === 'event' || c.type === 'curse') c.obj = { kind: c.type, x: c.cx, y: c.cy };
    }
    C.floor = buildCaveFloor(act, run.seed, W); this.spawnRoamers(W);
    this.mode = 'fight'; this.paused = false; this.frozen = false; this.fade = { t: 0.25, done: true, fn() {} }; document.body.classList.add('fight'); UI.hide();
    Music.play('menu'); this.persist();
  },
  persist() { Save.data.run = this.run; Save.write(); },

  // ---------- geometry ----------
  gatesUpdate() {},
  walkable(x, y) {
    const W = this.world, tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS && W.grid[ty * COLS + tx] === 1;
  },
  fits(x, y, r) {
    const d = r * 0.72;
    return this.walkable(x, y) && this.walkable(x + r, y) && this.walkable(x - r, y) && this.walkable(x, y + r) && this.walkable(x, y - r) &&
      this.walkable(x + d, y + d) && this.walkable(x - d, y + d) && this.walkable(x + d, y - d) && this.walkable(x - d, y - d);
  },
  collide(o, r) {
    const C = this.C;
    if (this.fits(o.x, o.y, r)) { o.lx = o.x; o.ly = o.y; }
    else if (o.lx !== undefined) {
      if (this.fits(o.x, o.ly, r)) { o.y = o.ly; o.lx = o.x; }
      else if (this.fits(o.lx, o.y, r)) { o.x = o.lx; o.ly = o.y; }
      else { o.x = o.lx; o.y = o.ly; }
    } else { const c = this.cellAt(o.x, o.y) || C.curCell; o.x = c.cx; o.y = c.cy; }
    for (const q of C.pillars) { const n = circRect(o.x, o.y, r, q); if (n) { o.x = n[0]; o.y = n[1]; } }
  },
  cellAt(x, y) { let best = null, bd = 1e9; for (const c of this.world.cells) { const d = Math.hypot(x - c.cx, y - c.cy); if (d < c.r && d < bd) { bd = d; best = c; } } return best; },
  arena() { const c = this.C.enc || this.C.curCell; return { x0: c.ix, y0: c.iy, x1: c.ix + c.iw, y1: c.iy + c.ih }; },
  spawnPos() {
    const C = this.C, A = this.arena();
    for (let i = 0; i < 40; i++) {
      const x = rnd(A.x0 + 40, A.x1 - 40), y = rnd(A.y0 + 40, A.y1 - 40);
      if (Math.hypot(x - C.p.x, y - C.p.y) < 230 || !this.fits(x, y, 18)) continue;
      if (C.pillars.some(q => x > q.x - 30 && x < q.x + q.w + 30 && y > q.y - 30 && y < q.y + q.h + 30)) continue;
      return [x, y];
    }
    return [(A.x0 + A.x1) / 2, (A.y0 + A.y1) / 2];
  },
  camUpdate(dt) {
    const C = this.C, p = C.p, Wd = this.world, cam = C.cam;
    const tx = clamp(p.x - W_ / 2 + (Input.mx - W_ / 2) * 0.28, 0, Wd.w - W_), ty = clamp(p.y - H / 2 + (Input.my - H / 2) * 0.28, 0, Wd.h - H), k = Math.min(1, dt * 9);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  },
  portalPos(c) { return { x: c.cx, y: c.cy - 70 }; },
  wake(e) {   // roaming enemies sleep until you come close (or hurt them); they give up when you get far away
    const d = dist(e, this.C.p);
    if (e.awake) { if (d > 1100 && e.hp >= e.maxhp) e.awake = false; return e.awake; }
    if (d < 430 || e.hp < e.maxhp) { e.awake = true; return true; }
    return false;
  },
  spawnRoamers(Wd) {
    const C = this.C, run = this.run, act = run.act, R = rng(run.seed + 99), sc = Wd.cells[Wd.startId], boss = Wd.cells.find(c => c.type === 'boss');
    C.hpS = (1 + 0.12 * act) * (1 + 0.15 * run.heat) * this.P.enemyHp * 0.9; C.dmgS = (1 + 0.03 * act) * (1 + 0.12 * run.heat); C.spdS = 1;
    let budget = (26 + act * 3) * (boss ? 0.55 : 1);
    for (let guard = 0; budget > 0 && guard < 300; guard++) {
      const x = (3 + R() * (COLS - 6)) * TILE, y = (3 + R() * (ROWS - 6)) * TILE, cz = this.cellAt(x, y);
      if (!this.fits(x, y, 24) || Math.hypot(x - sc.cx, y - sc.cy) < 380 || (cz && (cz.safe || cz.type === 'boss'))) continue;
      const cost = 4 + Math.min(act, 6), list = R() < 0.16 && AREA_ENEMIES[areaOf(act)].includes('maggot') ? Array(5 + Math.floor(R() * 3)).fill('maggot') : this.compose(Math.min(budget, cost), act, Math.min(4, 1 + act)); budget -= cost;
      for (const t of list) {
        const ex = x + (R() - 0.5) * 90, ey = y + (R() - 0.5) * 90;
        if (!this.fits(ex, ey, 20)) continue;
        const elite = t !== 'grunt' && t !== 'maggot' && R() < 0.05 + 0.02 * act ? Object.keys(ELITE_MODS)[Math.floor(R() * 4)] : null;
        const e = this.makeEnemy(t, ex, ey, elite); e.free = true; e.spawnT = 0;
      }
    }
    C.levelTotal = C.en.filter(e => e.free).length;
    for (let i = 0, k = 5; i < 500 && k > 0; i++) {   // explosive barrels
      const x = (4 + R() * (COLS - 8)) * TILE, y = (4 + R() * (ROWS - 8)) * TILE;
      if (this.fits(x, y, 22) && Math.hypot(x - sc.cx, y - sc.cy) > 250) { C.props.push({ x, y, r: 13, hp: 22, maxhp: 22, flash: 0 }); k--; }
    }
    for (let i = 0, k = 3; i < 400 && k > 0; i++) {   // chests: ammo, weapons, health
      const x = (4 + R() * (COLS - 8)) * TILE, y = (4 + R() * (ROWS - 8)) * TILE;
      if (this.fits(x, y, 20) && Math.hypot(x - sc.cx, y - sc.cy) > 250) { const q = R(); C.chests.push({ x, y, kind: q < 0.45 ? 'ammo' : q < 0.72 ? 'weapon' : 'heal', open: false }); k--; }
    }
    for (let i = 0, k = 1; i < 200 && k > 0; i++) {   // and a weapon on the floor
      const x = (4 + R() * (COLS - 8)) * TILE, y = (4 + R() * (ROWS - 8)) * TILE;
      if (this.fits(x, y, 20) && Math.hypot(x - sc.cx, y - sc.cy) > 500) { this.spawnWeapon(x, y, true); k--; }
    }
  },
  onKill(e) {
    const C = this.C, run = this.run, P = this.P; if (!C || !C.world) return;
    const xp = e.boss ? 60 : e.elite ? 14 : ENEMY[e.type].cost * 2, n = Math.min(8, Math.max(1, Math.round(xp / 2)));
    for (let i = 0; i < n; i++) this.spawnItem(e.x, e.y, 'rad', { amt: xp / n });
    run.ammo = run.ammo || startAmmo();
    const want = this.ammoWanted(), low = run.ammo[want] / AMMO[want].max < 0.35;
    if (!e.boss && Math.random() < Math.min(0.85, (low ? 0.34 : 0.17) * P.dropMul)) this.spawnItem(e.x, e.y, 'ammo', { type: want, amt: AMMO[want].amt });
    if (!e.boss && !P.noHeal && Math.random() < (run.hp < P.maxhp * 0.5 ? 0.09 : 0.03) * Math.min(P.dropMul, 1.8)) this.spawnItem(e.x, e.y, 'heal', { amt: 10 });
    run.coreAcc = (run.coreAcc || 0) + (e.boss ? 0 : e.elite ? 3 : ENEMY[e.type].cost * 0.4) * (1 + 0.15 * run.act) * (1 + 0.2 * run.heat);
    if (run.coreAcc >= 1) { const g = Math.floor(run.coreAcc); run.coreAcc -= g; run.cores += g; }
    if (e.free) {
      C.lvlKills++;
      if (!C.portal && !isBossLevel(run.act) && C.lvlKills >= Math.ceil(C.levelTotal * 0.9)) { C.portal = { x: e.x, y: e.y }; this.floatText(e.x, e.y - 40, 'THE PORTAL OPENS', '#a06bff', 1.4); Sfx.good(); }
    }
  },
  drawHearts(x, y, hp, max) {   // 1 heart = 10 HP, like the original's 8 starting hearts
    const n = Math.ceil(max / 10), cell = n > 12 ? 1 : 2, step = cell * 7 + 4, ox = n > 12 ? 230 / n - step : 0;
    const pat = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    for (let i = 0; i < n; i++) {
      const f = clamp((hp - i * 10) / 10, 0, 1), hx = x + i * (step + ox);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
        if (pat[r][c] !== 'X') continue;
        ctx.fillStyle = c < f * 7 - 0.01 ? (r === 1 && c < 3 ? '#ff9aa6' : '#ff3a4a') : '#3a1018';
        ctx.fillRect(hx + c * cell, y + r * cell, cell, cell);
      }
    }
  },
  // ---------- the hero: front view, flips left/right, the gun turns towards the cursor ----------
  drawHero(p) {
    const run = this.run, id = run.hero, C = this.C;
    if (!HERO_FRONT[id]) { this.sprite(id, p.x, p.y, p.aim, 2, p.flash > 0); return; }
    const face = Math.cos(p.aim) >= 0 ? 1 : -1, moving = Math.hypot(p.x - (p.dpx === undefined ? p.x : p.dpx), p.y - (p.dpy === undefined ? p.y : p.dpy)) > 0.4;
    p.dpx = p.x; p.dpy = p.y;
    const bob = moving ? -Math.abs(Math.sin(C.t * 14)) * 3 : -Math.sin(C.t * 2.6) * 1.2, sq = moving ? 1 + Math.sin(C.t * 28) * 0.04 : 1;
    const spr = p.flash > 0 ? Sprites.white(id) : Sprites.get(id), fx = snap(p.x), fy = snap(p.y + 15);
    ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(fx, fy, 15, 5, 0, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.imageSmoothingEnabled = false; ctx.save(); ctx.translate(fx, fy + snap(bob)); ctx.scale(face, sq); ctx.drawImage(spr, -24, -48, 48, 48); ctx.restore();
    this.drawHeldWeapon(p, fx + face * 9, fy + snap(bob) - 20, face);
  },
  drawHeldWeapon(p, x, y, face) {
    const w = kitOf(this.run).weapon, O = '#0c0c12', M = '#5a5e6a', L = '#9aa0ae';
    ctx.save(); ctx.translate(x, y); ctx.rotate(p.aim); if (face < 0) ctx.scale(1, -1);
    if (w.type === 'cone') {
      ctx.fillStyle = O; ctx.fillRect(-2, -4, 12, 8); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-1, -3, 10, 6);
      ctx.fillStyle = O; ctx.fillRect(8, -5, 26, 10); ctx.fillStyle = L; ctx.fillRect(9, -4, 24, 8); ctx.fillStyle = '#eef2fa'; ctx.fillRect(9, -4, 24, 2);
    } else if (w.type === 'lance') {
      ctx.fillStyle = O; ctx.fillRect(-4, -3, 40, 6); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-3, -2, 30, 4); ctx.fillStyle = L; ctx.fillRect(26, -3, 10, 6);
    } else if (w.type !== 'blades') {
      ctx.fillStyle = O; ctx.fillRect(-3, -4, 26, 8); ctx.fillStyle = M; ctx.fillRect(-2, -3, 24, 6); ctx.fillStyle = L; ctx.fillRect(-2, -3, 24, 2);
      ctx.fillStyle = O; ctx.fillRect(0, 3, 7, 8); ctx.fillStyle = '#4a3220'; ctx.fillRect(1, 3, 5, 6);
      ctx.fillStyle = O; ctx.fillRect(20, -3, 6, 6);
    }
    ctx.restore();
  },
  // ---------- light aim assist: when an enemy is close to your aim line the shot bends towards it ----------
  assistAim(w) {
    const C = this.C, p = C.p, a = p.aim;
    if (w.type === 'mortar' || w.type === 'blades') return a;
    const spd = (w.speed || 500) * 1.2, reach = w.type === 'cone' ? w.range * 1.5 : w.type === 'lance' ? w.reach * 1.4 : spd * (w.life || 1);
    let best = null, bs = 1;
    for (const e of C.en) {
      if (e.dead || e.spawnT > 0.25) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > reach || d < 4) continue;
      let da = Math.atan2(dy, dx) - a; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
      const tol = 0.09 + Math.atan2(e.r + 10, d) * 1.5;
      if (da > tol || da / tol >= bs) continue;
      let clear = true; for (let t = 24; t < d; t += 24) if (!this.walkable(p.x + dx * t / d, p.y + dy * t / d)) { clear = false; break; }
      if (clear) { bs = da / tol; best = e; }
    }
    if (!best) return a;
    const d = dist(best, p), lead = w.type === 'shot' ? Math.min(0.45, d / spd) : 0;
    const tx = best.x + (best.mvx || 0) * lead, ty = best.y + (best.mvy || 0) * lead;
    let da = Math.atan2(ty - p.y, tx - p.x) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
    return a + da * 0.75;
  },
  // ---------- props: explosive barrels ----------
  damageProp(pr, dmg) {
    if (pr.dead) return;
    pr.hp -= dmg; pr.flash = 0.1; Sfx.hit();
    if (pr.hp > 0) return;
    pr.dead = true; const C = this.C;
    C.haz.push({ x: pr.x, y: pr.y, r: 92, t: 0.05, max: 0.05, dmg: 44, friendly: true });
    C.haz.push({ x: pr.x, y: pr.y, r: 92, t: 0.05, max: 0.05, dmg: 22 * (C.dmgS || 1), friendly: false, owner: null });
    C.shake = Math.max(C.shake, 8); C.hitstop = Math.max(C.hitstop || 0, 0.05);
    if (C.floor) { const g = C.floorCtx || (C.floorCtx = C.floor.getContext('2d')); g.save(); g.globalAlpha = 0.5; g.fillStyle = '#0a0a0a'; for (let i = 0; i < 30; i++) { const a = rnd(0, 6.283), d = Math.abs(rnd(-1, 1)) * 44; g.fillRect(snap(pr.x + Math.cos(a) * d), snap(pr.y + Math.sin(a) * d), 2 * rndi(1, 3), 2 * rndi(1, 3)); } g.restore(); }
  },
  // ---------- gore: bodies and blood stay on the floor ----------
  stain(e) {
    const C = this.C, run = this.run; if (!C.floor) return;
    const g = C.floorCtx || (C.floorCtx = C.floor.getContext('2d')), def = ENEMY[e.type], col = e.boss ? '#8a1020' : ((def && def.blood) || '#7a1018'), big = e.boss ? 2.4 : e.r > 15 ? 1.5 : 1;
    g.save(); g.fillStyle = col;
    for (let i = 0, n = Math.round(16 * big * big); i < n; i++) { const a = rnd(0, 6.283), d = Math.abs(rnd(-1, 1)) * 34 * big, s = 2 * rndi(1, 3); g.globalAlpha = rnd(0.45, 0.9); g.fillRect(snap(e.x + Math.cos(a) * d), snap(e.y + Math.sin(a) * d), s, s); }
    const cs = Sprites.corpse(e.boss ? 'b:' + areaOf(run.act) : 'e:' + e.type);
    g.globalAlpha = 0.9; g.translate(e.x, e.y); g.rotate(rnd(0, 6.283)); g.imageSmoothingEnabled = false; g.drawImage(cs, -cs.width, -cs.height, cs.width * 2, cs.height * 2);
    g.restore();
  },
  bleed(e) {
    const C = this.C; if (!C.floor || Math.random() < 0.4) return;
    const g = C.floorCtx || (C.floorCtx = C.floor.getContext('2d')), def = ENEMY[e.type]; g.fillStyle = e.boss ? '#8a1020' : ((def && def.blood) || '#7a1018');
    for (let i = 0; i < 3; i++) { g.globalAlpha = rnd(0.4, 0.8); g.fillRect(snap(e.x + rnd(-14, 14)), snap(e.y + rnd(-14, 14)), 2 * rndi(1, 2), 2 * rndi(1, 2)); }
    g.globalAlpha = 1;
  },
  boomAt(b) { if (b.boom) { this.C.haz.push({ x: b.x, y: b.y, r: b.boom * this.P.blastRad, t: 0.05, max: 0.05, dmg: b.boomDmg, friendly: true }); } },
  // ---------- pickups: rads (xp), ammo, health; chests ----------
  spawnItem(x, y, kind, o) { const C = this.C; if (C.items.length > 220) return; C.items.push(Object.assign({ x, y, kind, vx: rnd(-110, 110), vy: rnd(-110, 110), t: 0 }, o || {})); },
  addXp(n) {
    const run = this.run, C = this.C; run.plv = run.plv || 1; run.xp = (run.xp || 0) + n * (this.P.xpMul || 1);
    while (run.xp >= 10 + 6 * run.plv) { run.xp -= 10 + 6 * run.plv; run.plv++; C.levelUps++; }
  },
  addAmmo(type, amt) { const run = this.run; run.ammo = run.ammo || startAmmo(); run.ammo[type] = Math.min(AMMO[type].max, (run.ammo[type] || 0) + Math.round(amt * this.P.ammoMul)); },
  ammoWanted() {   // mostly the ammo your weapons use
    const run = this.run, types = [run.wpn || run.hero, run.wpn2].filter(Boolean).map(id => ammoOf(HEROES[id].weapon)).filter(Boolean);
    return types.length && Math.random() < 0.75 ? pick(types) : pick(Object.keys(AMMO));
  },
  updatePickups(dt) {
    const C = this.C, p = C.p, P = this.P;
    for (const it of C.items) {
      it.t += dt; const ox = it.x, oy = it.y;
      it.x += it.vx * dt; it.y += it.vy * dt; it.vx *= Math.pow(0.04, dt); it.vy *= Math.pow(0.04, dt);
      if (!this.walkable(it.x, it.y)) { it.x = ox; it.y = oy; it.vx = it.vy = 0; }
      const d = dist(it, p), mag = (it.kind === 'rad' ? 150 : 100) * P.magnet;
      if (it.t > 0.35 && d < mag) { const a = Math.atan2(p.y - it.y, p.x - it.x), sp = 360 * (1 - d / mag * 0.5), nx = it.x + Math.cos(a) * sp * dt, ny = it.y + Math.sin(a) * sp * dt; if (this.walkable(nx, ny)) { it.x = nx; it.y = ny; } }
      if (d < 22 && it.t > 0.2) { it.dead = true; this.collectItem(it); }
      if (it.kind !== 'rad' && it.t > 45) it.dead = true;
    }
    C.items = C.items.filter(i => !i.dead);
    for (const pr of C.props) if (pr.flash > 0) pr.flash -= dt;
    if (C.props.some(q => q.dead)) C.props = C.props.filter(q => !q.dead);
    for (const ch of C.chests) if (!ch.open && dist(ch, p) < 30) { ch.open = true; this.openChest(ch); }
  },
  collectItem(it) {
    const p = this.C.p;
    if (it.kind === 'rad') { this.addXp(it.amt); const C = this.C; if (!C.radSnd || C.t - C.radSnd > 0.06) { Sfx.tick(); C.radSnd = C.t; } }
    else if (it.kind === 'ammo') { this.addAmmo(it.type, it.amt); this.floatText(p.x, p.y - 22, '+' + AMMO[it.type].name, AMMO[it.type].col); Sfx.good(); }
    else if (it.kind === 'heal') { if (!this.P.noHeal) this.healP(it.amt); }
  },
  openChest(ch) {
    const C = this.C; Sfx.good(); C.shake = Math.max(C.shake, 3);
    if (ch.kind === 'ammo') for (let i = 0, k = Math.round(4 * this.P.dropMul); i < k; i++) { const t = this.ammoWanted(); this.spawnItem(ch.x, ch.y, 'ammo', { type: t, amt: AMMO[t].amt }); }
    else if (ch.kind === 'weapon') this.spawnWeapon(ch.x, ch.y + 30, false, true);
    else for (let i = 0; i < 2; i++) this.spawnItem(ch.x, ch.y, 'heal', { amt: 10 });
  },
  useAmmo(w) {
    const t = ammoOf(w); if (!t) return true;
    const run = this.run; run.ammo = run.ammo || startAmmo();
    const c = (w.cost || 1) * (this.P.ammoCost || 1); if (run.ammo[t] < c) return false;
    run.ammo[t] -= c; return true;
  },
  noAmmo() { const C = this.C; if (!C.noAmmoT || C.t - C.noAmmoT > 1) { this.floatText(C.p.x, C.p.y - 28, 'NO AMMO', '#ff6a6a', 1.1); C.noAmmoT = C.t; } },
  swapWeapons() {
    const run = this.run, C = this.C; if (!run || !C || !run.wpn2 || this.frozen || this.paused) return;
    const a = run.wpn || run.hero; run.wpn = run.wpn2; run.wpn2 = a; C.bladePos = []; Sfx.good(); this.floatText(C.p.x, C.p.y - 28, HEROES[run.wpn].weapon.name.toUpperCase(), '#fff'); this.persist();
  },
  eatWeapon() {
    const C = this.C, p = C.p; let best = null, bd = 170;
    for (const d of C.wdrops) { const q = dist(d, p); if (q < bd) { bd = q; best = d; } }
    if (!best) { p.abT = 0.5; this.floatText(p.x, p.y - 28, 'NOTHING TO EAT', '#ff6a6a'); return; }
    C.wdrops = C.wdrops.filter(x => x !== best);
    const t = ammoOf(HEROES[best.id].weapon) || 'bullet'; this.addAmmo(t, AMMO[t].amt * 2); this.healP(8);
    this.floatText(p.x, p.y - 28, 'MUNCH +' + AMMO[t].name, AMMO[t].col, 1.1); C.shake = Math.max(C.shake, 4);
  },
  // two weapon slots and all five ammo types, like the original's HUD (the ammo of the weapon in your hands is lit up)
  drawWeaponHud() {
    const run = this.run, y0 = H - 42; run.ammo = run.ammo || startAmmo();
    const cur = ammoOf(HEROES[run.wpn || run.hero].weapon);
    const frame = (x, w, on, col) => {
      ctx.fillStyle = on ? 'rgba(10,12,16,.92)' : 'rgba(10,12,16,.66)'; ctx.fillRect(x, y0, w, 36);
      ctx.fillStyle = col; ctx.fillRect(x, y0, w, 2); ctx.fillRect(x, y0 + 34, w, 2); ctx.fillRect(x, y0, 2, 36); ctx.fillRect(x + w - 2, y0, 2, 36);
    };
    const slot = (x, id, on, key) => {
      frame(x, 118, on, on ? '#ffd91f' : '#3a3e46');
      ctx.textAlign = 'left'; ctx.font = '9px Silk, monospace';
      if (!id) { ctx.fillStyle = '#555a64'; ctx.fillText('EMPTY', x + 44, y0 + 22); ctx.fillText(key, x + 6, y0 + 13); return; }
      const w = HEROES[id].weapon, a = ammoOf(w);
      ctx.save(); ctx.translate(x + 24, y0 + 19); ctx.globalAlpha = on ? 1 : 0.6; this.weaponIcon(w, a ? AMMO[a].col : '#c8ccd6'); ctx.restore();
      ctx.fillStyle = on ? '#fff' : '#8a8e98'; ctx.fillText(w.name.toUpperCase().slice(0, 12), x + 44, y0 + 15);
      ctx.fillStyle = a ? AMMO[a].col : '#9fc'; ctx.fillText(a ? AMMO[a].name.toLowerCase() : 'melee', x + 44, y0 + 28);
      ctx.fillStyle = on ? '#ffd91f' : '#5a5e68'; ctx.fillText(key, x + 6, y0 + 13);
    };
    slot(8, run.wpn || run.hero, true, '1'); slot(130, run.wpn2, false, '2');
    let x = 254;
    for (const t of Object.keys(AMMO)) {
      const A = AMMO[t], n = Math.floor(run.ammo[t] || 0), on = t === cur, f = clamp(n / A.max, 0, 1);
      frame(x, 52, on, on ? A.col : '#2a2d34');
      ctx.globalAlpha = on ? 1 : 0.7; this.ammoIcon(t, x + 13, y0 + 15); ctx.globalAlpha = 1;
      ctx.font = '11px Silk, monospace'; ctx.textAlign = 'left'; ctx.fillStyle = n < 1 ? '#ff6a6a' : on ? '#fff' : '#9a9ea8'; ctx.fillText(String(n), x + 25, y0 + 19);
      ctx.fillStyle = '#1a1c22'; ctx.fillRect(x + 6, y0 + 27, 40, 4); ctx.fillStyle = A.col; ctx.fillRect(x + 6, y0 + 27, Math.round(40 * f), 4);
      x += 56;
    }
    ctx.textAlign = 'left';
  },
  weaponIcon(w, col) {
    const O = '#0c0c12', M = '#9aa0ae';
    if (w.type === 'cone') { ctx.fillStyle = O; ctx.fillRect(-16, -3, 9, 7); ctx.fillRect(-9, -5, 25, 10); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-15, -2, 7, 5); ctx.fillStyle = '#d8dce8'; ctx.fillRect(-8, -4, 23, 8); ctx.fillStyle = col; ctx.fillRect(-8, 1, 23, 2); }
    else if (w.type === 'lance') { ctx.fillStyle = O; ctx.fillRect(-16, -2, 32, 5); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-15, -1, 22, 3); ctx.fillStyle = '#d8dce8'; ctx.fillRect(7, -1, 9, 3); }
    else if (w.type === 'blades') { ctx.fillStyle = col; ctx.fillRect(-4, -4, 8, 8); ctx.fillStyle = O; ctx.fillRect(-2, -2, 4, 4); }
    else if (w.type === 'mortar') { ctx.fillStyle = O; ctx.fillRect(-15, -6, 30, 11); ctx.fillStyle = M; ctx.fillRect(-14, -5, 28, 9); ctx.fillStyle = col; ctx.fillRect(-14, -1, 28, 3); ctx.fillStyle = O; ctx.fillRect(-9, 4, 6, 6); }
    else { ctx.fillStyle = O; ctx.fillRect(-15, -5, 31, 9); ctx.fillStyle = M; ctx.fillRect(-14, -4, 29, 7); ctx.fillStyle = col; ctx.fillRect(-14, -1, 29, 2); ctx.fillStyle = O; ctx.fillRect(-11, 4, 6, 7); ctx.fillStyle = '#4a3220'; ctx.fillRect(-10, 4, 4, 5); }
  },
  ammoIcon(t, x, y) {
    const A = AMMO[t], O = '#0c0c12';
    ctx.fillStyle = O;
    if (t === 'bullet') { for (const dx of [-5, -1, 3]) { ctx.fillRect(x + dx - 1, y - 6, 4, 13); } ctx.fillStyle = A.col; for (const dx of [-5, -1, 3]) { ctx.fillRect(x + dx, y - 4, 2, 10); ctx.fillStyle = '#fff3b0'; ctx.fillRect(x + dx, y - 5, 2, 2); ctx.fillStyle = A.col; } }
    else if (t === 'shell') { ctx.fillRect(x - 6, y - 6, 12, 13); ctx.fillStyle = A.col; ctx.fillRect(x - 5, y - 5, 10, 8); ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 5, y + 3, 10, 3); }
    else if (t === 'bolt') { ctx.fillRect(x - 2, y - 7, 5, 15); ctx.fillRect(x - 6, y - 7, 13, 5); ctx.fillStyle = A.col; ctx.fillRect(x - 1, y - 5, 3, 12); ctx.fillRect(x - 5, y - 6, 11, 3); }
    else if (t === 'explosive') { ctx.beginPath(); ctx.arc(x, y + 1, 7, 0, 6.283); ctx.fill(); ctx.fillStyle = A.col; ctx.beginPath(); ctx.arc(x, y + 1, 5.5, 0, 6.283); ctx.fill(); ctx.fillStyle = O; ctx.fillRect(x - 1, y - 8, 3, 4); ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - 1, y - 9, 2, 2); }
    else { ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 8); ctx.lineTo(x - 6, y); ctx.fill(); ctx.fillStyle = A.col; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 4, y); ctx.fill(); ctx.fillStyle = '#e8ffff'; ctx.fillRect(x - 1, y - 2, 2, 4); }
  },
  levelLabel() {
    const run = this.run, C = this.C, a = areaOf(run.act), loop = Math.floor(run.act / LOOP_LEVELS);
    return (loop ? 'LOOP ' + loop + '  ' : '') + ACT_NAMES[a].toUpperCase() + ' ' + (a + 1) + '-' + (run.act % 3 + 1) + (isBossLevel(run.act) ? '  BOSS' : '  KILLS ' + C.lvlKills + '/' + Math.ceil(C.levelTotal * 0.9)) + '  LV ' + (run.plv || 1) + (run.heat ? '  HEAT ' + run.heat : '');
  },

  // ---------- encounters ----------
  startEncounter(cell, curse) {
    const C = this.C, run = this.run, P = this.P = buildStats(run, Save.data), act = run.act, row = run.cleared * 1.25, boss = cell.type === 'boss', elite = cell.type === 'elite';
    curse = curse || null;
    if (curse && curse.halfhp) { P.maxhp = Math.round(P.maxhp / 2); run.hp = Math.min(run.hp, P.maxhp); }
    C.enc = cell; C.curse = curse || {}; C.cellEnc = cell; C.intro = 1.0; C.waves = []; C.waveIdx = 0; C.waveCd = 0; C.boss = null; C.elitesLeft = elite ? 2 : 0;
    C.hpS = (1 + 0.12 * act) * (1 + 0.04 * row) * (1 + 0.15 * run.heat) * P.enemyHp * ((curse && curse.hp) || 1);
    C.dmgS = (1 + 0.03 * act) * (1 + 0.12 * run.heat) * ((curse && curse.dmg) || 1);
    C.spdS = (curse && curse.speed) || 1;
    if (boss) {
      const b = BOSSES[areaOf(act)], hp = b.hp * (1 + 0.2 * run.heat) * (1 + 0.5 * Math.floor(act / LOOP_LEVELS)) * P.enemyHp, x = cell.cx, y = cell.cy - 80;
      C.boss = { type: 'boss', boss: true, x, y, lx: x, ly: y, r: b.r, hp, maxhp: hp, sh: 0, flash: 0, phase: 1, pat: null, pt: 0, cd: 2, n: 0, sa: 0, atk: 0, col: b.col, name: b.name, vx: 0, vy: 0, slow: 0, slowT: 0, poison: 0, poisonT: 0, burn: 0, burnT: 0, spawnT: 0, bladeCd: 0, ang: 0, stage: 0 };
      C.en.push(C.boss); C.bannerText = b.name.toUpperCase();
    } else {
      let budget = 7 + row * 2.2 + act * 7;
      if (elite) budget *= 1.2;
      if (curse && curse.count) budget *= curse.count;
      const parts = row < 3 ? [0.5, 0.5] : [0.35, 0.35, 0.3];
      C.waves = parts.map(f => this.compose(Math.max(2, Math.round(budget * f)), act, row));
      C.bannerText = (elite ? 'ELITE ' : curse && curse.name ? curse.name.toUpperCase() + ' ' : '') + 'ARENA';
    }
    C.encT = 0; C.banner = 2.2; Music.play(boss ? 'boss' : 'fight'); this.gatesUpdate();
  },
  encUpdate() {
    const C = this.C;
    if (!C.enc || C.dead || C.intro > 0) return;
    C.encT += 1 / 60;
    const live = C.en.filter(e => !e.free);
    if (C.encT > 150 && !C.boss && live.length && live.length <= 3) { for (const e of live) this.kill(e); this.floatText(C.p.x, C.p.y - 40, 'THE ARENA COLLAPSES', '#ff8a1f', 1.2); }   // failsafe: nobody stays stuck
    if (!C.markers.length && !live.length && C.waveIdx >= C.waves.length && (!C.boss || C.boss.dead)) this.encClear();
  },
  encClear() {
    const C = this.C, run = this.run, cell = C.enc, n = cell.type, p = C.p;
    cell.state.cleared = true; run.rooms++; run.cleared++; if (n === 'boss') run.bosses = (run.bosses || 0) + 1;
    const base = { fight: 6, elite: 14, curse: 22, boss: 45 }[n] || 0, got = Math.round(base * (1 + 0.35 * run.act) * (1 + 0.2 * run.heat));
    run.cores += got;
    C.eb.length = 0; C.beams.length = 0; C.haz = C.haz.filter(h => h.friendly); C.enc = null; C.boss = null; C.clearMsg = 2;
    this.P = buildStats(run, Save.data); run.hp = Math.min(run.hp, this.P.maxhp);
    if (this.P.clearHeal) this.heal(this.P.clearHeal);
    this.floatText(p.x, p.y - 34, '+' + got + ' CORES', '#3de8ff', 1.1);
    if (n === 'elite' || (n === 'fight' && Math.random() < 0.3)) this.spawnWeapon(cell.cx, cell.cy + 90);
    const kind = cell.rewardKind;
    if (n === 'curse' || kind === 'epic') cell.state.reward = { kind: 'perk', min: 'epic', cores: got };
    else if (n === 'boss' || n === 'elite') cell.state.reward = { kind: 'perk', min: 'rare', cores: got };
    else if (kind === 'gold') { const g = Math.round(35 + 10 * run.cleared + 20 * run.act); run.gold += g; this.floatText(p.x, p.y - 52, '+' + g + ' GOLD', '#ffd91f', 1.2); cell.state.rewarded = true; }
    else cell.state.reward = { kind: 'perk', min: 'common', cores: got };
    this.gatesUpdate(); Music.play('menu'); this.persist();
  },
  discover(cell) {
    cell.state.visited = true;
    const C = this.C; C.curCell = cell;
    if (cell.safe || cell.type === 'boss') { C.banner = 2; C.bannerText = CELL_NAME[cell.type]; }
  },
  orbPos(cell) { return { x: cell.cx, y: cell.cy + (cell.type === 'boss' ? 90 : 50) }; },
  worldUpdate() {
    const C = this.C, p = C.p, W = this.world, run = this.run; C.near = null; C.nearW = null;
    for (const d of C.wdrops) if (dist(d, p) < 36) C.nearW = d;
    this.updatePickups(1 / 60);
    for (const e of C.en) { e.mvx = (e.x - (e.px === undefined ? e.x : e.px)) * 60; e.mvy = (e.y - (e.py === undefined ? e.y : e.py)) * 60; e.px = e.x; e.py = e.y; }
    if (p.kvx || p.kvy) {   // weapon recoil / melee lunge
      p.x += p.kvx / 60; p.y += p.kvy / 60; const kd = Math.pow(0.0005, 1 / 60); p.kvx *= kd; p.kvy *= kd;
      if (Math.abs(p.kvx) + Math.abs(p.kvy) < 4) p.kvx = p.kvy = 0;
      this.collide(p, p.r);
    }
    if (C.enc && C.boss && !C.boss.dead && !C.dead) {   // keep the boss fight supplied with ammo
      C.bossAmmoT = (C.bossAmmoT || 0) + 1 / 60;
      if (C.bossAmmoT > 9) { C.bossAmmoT = 0; for (let i = 0; i < 2; i++) { const t = this.ammoWanted(), an = rnd(0, 6.28), x = p.x + Math.cos(an) * 140, y = p.y + Math.sin(an) * 140; if (this.walkable(x, y)) this.spawnItem(x, y, 'ammo', { type: t, amt: AMMO[t].amt }); } }
    }
    if (C.levelUps > 0 && !this.frozen && !C.dead) { C.levelUps--; this.frozen = true; Input.down = false; Input.keys = {}; C.nodeCell = null; C.pendingOrb = C.pendingObj = false; UI.levelUp(); return; }
    if (C.portal && !C.dead && dist(C.portal, p) < 34) { run.rooms++; Input.keys = {}; this.descend(0.15); return; }
    const cc = this.cellAt(p.x, p.y);
    if (cc && cc !== C.curCell) this.discover(cc);
    if (C.clearMsg > 0) C.clearMsg -= 1 / 60;
    if (cc && !C.enc && cc.type === 'boss' && !cc.state.cleared && dist(p, { x: cc.cx, y: cc.cy }) < cc.r * 0.55) this.startEncounter(cc, null);
    for (const c of W.cells) {
      const s = c.state;
      if (s.cleared && s.reward && !s.rewarded) { const o = this.orbPos(c); if (dist(o, p) < 30) { C.nodeCell = c; C.node = s; C.pendingOrb = true; C.pendingObj = false; this.frozen = true; Input.down = false; Input.keys = {}; UI.reward(s.reward, s.reward.cores); return; } }
      if (c.type === 'boss' && s.cleared && s.rewarded && dist(this.portalPos(c), p) < 40) { this.frozen = true; Input.keys = {}; UI.actClear(); return; }
      if (c.obj && !s.used && dist(c.obj, p) < 52) C.near = c;
    }
  },
  // ---------- weapons on the ground (swap with E) ----------
  spawnWeapon(x, y, quiet, better) {
    const C = this.C, run = this.run, mine = [run.wpn || run.hero, run.wpn2], cap = 1 + Math.floor(run.act * 0.8) + (better ? 1 : 0) + this.P.lootTier;
    let ids = Object.keys(HEROES).filter(k => HEROES[k].pool && !mine.includes(k) && !C.wdrops.some(d => d.id === k) && weaponTier(k) <= cap);
    if (!ids.length) ids = Object.keys(HEROES).filter(k => HEROES[k].pool && !mine.includes(k));
    if (!ids.length) return;
    C.wdrops.push({ id: pick(ids), x, y }); if (!quiet) this.floatText(x, y - 30, 'WEAPON', '#ffd91f');
  },
  dropWeapon(e) { if (Math.random() < Math.min(1, (e.boss ? 1 : e.elite ? 0.4 : 0.02) * this.P.dropMul)) this.spawnWeapon(e.x, e.y); },
  pickWeapon(d) {
    const C = this.C, run = this.run, cur = run.wpn || run.hero;
    C.wdrops = C.wdrops.filter(x => x !== d);
    if (!run.wpn2) { run.wpn2 = d.id; this.floatText(C.p.x, C.p.y - 44, '[X] SWITCH WEAPON', '#ffd91f'); }
    else { C.wdrops.push({ id: cur, x: C.p.x, y: C.p.y + 48 }); run.wpn = d.id; }
    C.bladePos = []; Sfx.good(); this.floatText(C.p.x, C.p.y - 30, HEROES[d.id].weapon.name.toUpperCase(), CLANS[HEROES[d.id].clan].color, 1.2); this.persist();
  },
  interact() {
    const C = this.C;
    if (C && !C.near && C.nearW && !this.frozen && !this.paused) { this.pickWeapon(C.nearW); return; }
    if (!C || !C.near || this.frozen || this.fade && this.fade.t < 0.5 && !this.fade.done || this.paused) return;
    const c = C.near, o = c.obj; C.nodeCell = c; C.node = c.state; C.pendingObj = true; C.pendingOrb = false; this.frozen = true; Input.keys = {}; Input.down = false;
    if (o.kind === 'shop') UI.shop(c.state); else if (o.kind === 'rest') UI.rest(c.state); else if (o.kind === 'event') UI.event(c.state); else if (o.kind === 'curse') UI.curse(c.state);
  },
  nodeDone() {
    const C = this.C; this.frozen = false; UI.hide(); document.body.classList.add('fight');
    if (!C) return;
    const c = C.nodeCell;
    if (c) { if (C.pendingOrb) c.state.rewarded = true; if (C.pendingObj && c.obj && c.obj.kind !== 'shop') c.state.used = true; }
    C.pendingOrb = C.pendingObj = false; this.persist();
  },
  beginCurse(curse) { const c = this.C.nodeCell; this.frozen = false; UI.hide(); document.body.classList.add('fight'); c.state.used = true; this.startEncounter(c, curse); },

  // ---------- drawing ----------
  drawLight(C, p) {
    const B = BIOME[areaOf(this.run.act)], cam = C.cam, cx = Math.round(cam.x), cy = Math.round(cam.y), cur = this.cellAt(p.x, p.y);
    Light.begin(B.amb, B.tint, cur && cur.safe, cx, cy);
    Light.add(p.x, p.y, 250, 0.3);
    for (const b of C.pb) Light.add(b.x, b.y, 46, 0.25);
    for (const b of C.eb) Light.add(b.x, b.y, 40, 0.2);
    for (const t of C.turrets) Light.add(t.x, t.y, 80, 0.25);
    for (const f of C.fx) if (f.k === 'ring') Light.add(f.x, f.y, Math.min(f.r, 200) * 0.9, 0.25 * clamp(f.t / (f.max || 0.2), 0, 1));
    for (const e of C.en) { if (e.boss) Light.add(e.x, e.y, 160, 0.25); else if (e.elite) Light.add(e.x, e.y, 60, 0.2); }
    for (const z of C.zones) Light.add(z.x, z.y, z.r, 0.15);
    for (const h of C.haz) if (!h.quick) Light.add(h.x, h.y, h.r, 0.2);
    for (const m of C.markers) Light.add(m.x, m.y, 50, 0.2);
    const glows = [];
    for (const c of this.world.cells) {
      const s = c.state;
      if (c.obj) { Light.add(c.obj.x, c.obj.y, c.obj.kind === 'rest' && !s.used ? 250 : 140, 0.3); if (!s.used) glows.push([c.obj.x, c.obj.y, c.obj.kind === 'rest' ? 200 : 120, { rest: '255,130,30', curse: '255,61,232', event: '178,75,255', shop: '255,200,80' }[c.obj.kind], 0.05]); }
      if (s.cleared && s.reward && !s.rewarded) { const o = this.orbPos(c); Light.add(o.x, o.y, 130, 0.3); glows.push([o.x, o.y, 90, '120,160,255', 0.06]); }
      if (c.type === 'boss' && s.cleared) { const q = this.portalPos(c); Light.add(q.x, q.y, 150, 0.3); }
    }

    if (C.portal) Light.add(C.portal.x, C.portal.y, 170, 0.35);
    Light.end(ctx);
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, rgb, a) => { for (const k of [1, 0.66, 0.33]) { ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')'; ctx.beginPath(); ctx.arc(x, y, r * k, 0, 6.283); ctx.fill(); } };
    for (const g of glows) glow(...g);
    for (const e of C.en) if (e.boss) glow(e.x, e.y, 120, '255,60,40', 0.04);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = DUST_COL[areaOf(this.run.act)]; ctx.globalAlpha = 0.35;
    for (const d of C.dust) ctx.fillRect(snap(cx + d.x), snap(cy + d.y), 2, 2); ctx.globalAlpha = 1;
  },
  drawWorldObjs(C) {
    const cam = C.cam, vx0 = cam.x - 80, vx1 = cam.x + W + 80, vy0 = cam.y - 80, vy1 = cam.y + H + 80, run = this.run;
    ctx.textAlign = 'center';
    for (const c of this.world.cells) {
      if (c.cx + c.r < vx0 || c.cx - c.r > vx1 || c.cy + c.r < vy0 || c.cy - c.r > vy1) continue;
      const s = c.state;
      if (s.cleared && s.reward && !s.rewarded) {
        const rc = { common: '#9fb4c8', rare: '#3d9bff', epic: '#b24bff' }[s.reward.min] || '#9fb4c8', o = this.orbPos(c), b = Math.sin(C.t * 3) * 3;
        pxRing(o.x, o.y + b, 22 + Math.sin(C.t * 5) * 2, rc, 2);
        const sp = Sprites.orb(5, rc); ctx.drawImage(sp, snap(o.x) - 22, snap(o.y + b) - 22, 44, 44);
        ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText('REWARD', snap(o.x) + 1, o.y - 31); ctx.fillStyle = rc; ctx.fillText('REWARD', snap(o.x), o.y - 32);
      }
      if (c.type === 'boss' && s.cleared) {
        const q = this.portalPos(c), x = q.x, y = q.y; for (let i = 0; i < 3; i++) pxRing(x, y, 14 + i * 9 + Math.sin(C.t * 4 + i) * 2, ['#39ff6e', '#a0ffb0', '#39ff6e'][i], 2);
        ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#39ff6e'; ctx.fillText(s.rewarded ? 'EXIT / DESCEND' : 'TAKE THE REWARD FIRST', x, y - 40);
      }

      if (c.obj) this.drawObj(c, C.t);
    }
    for (const pr of C.props) {
      if (pr.x < vx0 || pr.x > vx1 || pr.y < vy0 || pr.y > vy1) continue;
      const x = snap(pr.x), y = snap(pr.y), f = pr.flash > 0;
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 12, y + 10, 26, 6);
      ctx.fillStyle = f ? '#fff' : '#a02a24'; ctx.fillRect(x - 10, y - 14, 20, 26); ctx.fillStyle = f ? '#fff' : '#c9382e'; ctx.fillRect(x - 10, y - 14, 20, 3);
      ctx.fillStyle = f ? '#fff' : '#2a1210'; ctx.fillRect(x - 10, y - 6, 20, 3); ctx.fillRect(x - 10, y + 4, 20, 3);
      ctx.fillStyle = f ? '#fff' : '#ffd91f'; ctx.fillRect(x - 3, y - 2, 6, 5);
    }
    for (const ch of C.chests) {
      if (ch.x < vx0 || ch.x > vx1 || ch.y < vy0 || ch.y > vy1) continue;
      const col = { ammo: '#ffd91f', weapon: '#3d9bff', heal: '#39ff6e' }[ch.kind], x = snap(ch.x), y = snap(ch.y);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 16, y + 10, 32, 6);
      ctx.fillStyle = '#15171c'; ctx.fillRect(x - 15, y - 11, 30, 22); ctx.fillStyle = ch.open ? '#444' : col; ctx.fillRect(x - 15, y - 11, 30, 3); ctx.fillRect(x - 15, y - 11, 3, 22); ctx.fillRect(x + 12, y - 11, 3, 22); ctx.fillRect(x - 15, y + 8, 30, 3);
      if (!ch.open) { ctx.fillStyle = col; ctx.fillRect(x - 3, y - 5, 6, 8); }
    }
    for (const it of C.items) {
      if (it.x < vx0 || it.x > vx1 || it.y < vy0 || it.y > vy1) continue;
      const x = snap(it.x), y = snap(it.y + Math.sin(C.t * 6 + it.x) * 1.5);
      if (it.kind === 'rad') { ctx.fillStyle = 'rgba(80,255,80,.25)'; ctx.fillRect(x - 6, y - 6, 12, 12); ctx.fillStyle = '#7dff4a'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#e6ffd0'; ctx.fillRect(x - 1, y - 1, 2, 2); }
      else if (it.kind === 'ammo') { const A = AMMO[it.type]; ctx.fillStyle = '#0a0b0e'; ctx.fillRect(x - 8, y - 6, 16, 12); ctx.fillStyle = A.col; ctx.fillRect(x - 8, y - 6, 16, 2); ctx.fillRect(x - 8, y + 4, 16, 2); ctx.font = '9px Silk, monospace'; ctx.fillText(A.L, x, y + 3); }
      else { ctx.fillStyle = '#ff3a5a'; ctx.fillRect(x - 3, y - 7, 6, 14); ctx.fillRect(x - 7, y - 3, 14, 6); ctx.fillStyle = '#ffd0d8'; ctx.fillRect(x - 1, y - 5, 2, 10); }
    }
    if (C.portal) {
      const q = C.portal;
      for (let k = 0; k < 3; k++) { ctx.strokeStyle = ['#ffffff', '#3de8ff', '#a06bff'][k]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, 12 + k * 8 + Math.sin(C.t * 5 + k) * 3, 0, 6.283); ctx.stroke(); }
      ctx.font = '12px Silk, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('PORTAL', q.x, q.y - 42);
    }
    for (const d of C.wdrops) {
      if (d.x < vx0 || d.x > vx1 || d.y < vy0 || d.y > vy1) continue;
      const h = HEROES[d.id], col = CLANS[h.clan].color, x = snap(d.x), y = snap(d.y + Math.sin(C.t * 4 + d.x) * 2);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 12, y + 12, 24, 6);
      ctx.fillStyle = '#0a0b0e'; ctx.fillRect(x - 12, y - 12, 24, 24); ctx.fillStyle = col; ctx.fillRect(x - 12, y - 12, 24, 2); ctx.fillRect(x - 12, y + 10, 24, 2); ctx.fillRect(x - 12, y - 12, 2, 24); ctx.fillRect(x + 10, y - 12, 2, 24);
      ctx.font = '12px Silk, monospace'; ctx.fillText({ shot: 'S', cone: 'C', blades: 'B', lance: 'L', mortar: 'M' }[h.weapon.type], x, y + 5);
    }
    if (C.nearW && !C.near) { const h = HEROES[C.nearW.id], t = '[E] ' + h.weapon.name.toUpperCase() + ' (' + h.weapon.type + ')', x = snap(C.nearW.x), y = snap(C.nearW.y); ctx.font = '12px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText(t, x + 1, y - 23); ctx.fillStyle = '#ffd91f'; ctx.fillText(t, x, y - 24); }
    if (C.near) { const o = C.near.obj, txt = '[E] ' + { shop: 'TRADE', rest: 'REST', event: 'PRAY', curse: 'TOUCH THE STONE' }[o.kind]; ctx.font = '12px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText(txt, snap(o.x) + 1, o.y - 51); ctx.fillStyle = '#ffd91f'; ctx.fillText(txt, snap(o.x), o.y - 52); }
    ctx.textAlign = 'left';
  },
  drawObj(c, t) {
    const o = c.obj, used = c.state.used, x = snap(o.x), y = snap(o.y);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 30, y + 18, 64, 10);
    const key = 'o:' + o.kind + (used ? '_used' : ''), spr = Sprites.get(key);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, x - spr.width, y - spr.height + 14, spr.width * 2, spr.height * 2);
    if (!used) {   // animated flames / flicker on top of the sprite
      if (o.kind === 'rest') for (let k = 0; k < 5; k++) { const h = 14 + Math.sin(t * 9 + k * 2) * 6 - Math.abs(k - 2) * 4; ctx.fillStyle = k === 2 ? '#ffe08a' : '#ff8a1f'; ctx.fillRect(x - 10 + k * 4, y - h + 2, 4, h); }
      if (o.kind === 'event') for (let k = 0; k < 3; k++) { const h = 10 + Math.sin(t * 8 + k * 2) * 5; ctx.fillStyle = k === 1 ? '#e0b0ff' : '#b24bff'; ctx.fillRect(x - 6 + k * 6, y - 26 - h, 6, h); }
      if (o.kind === 'curse') { ctx.fillStyle = 'rgba(255,61,232,' + (0.4 + 0.3 * Math.sin(t * 5)) + ')'; ctx.fillRect(x - 2, y - 26, 4, 14); ctx.fillRect(x - 6, y - 14, 12, 2); }
    }
  },
});
const W_ = W;
