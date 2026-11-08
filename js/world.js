// World: one connected map per act (a big organic cave, no map shown to the player, Nuclear Throne style). No rooms: enemies lie scattered through the whole cave, kill enough of them and a portal opens.
// Loaded after game.js; replaces the old door-room flow of Game.
const TILE = 40, COLS = 110, ROWS = 70, WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE, NEED_CLEAR = 6;
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
  for (let tries = 0; pts.length < 17 && tries < 5000; tries++) {
    const x = 9 + R() * (COLS - 18), y = 9 + R() * (ROWS - 18);
    if (pts.every(q => Math.hypot(q[0] - x, q[1] - y) > 14)) pts.push([x, y]);
  }
  const n = pts.length, startId = Math.floor(R() * n);
  const dS = i => Math.hypot(pts[i][0] - pts[startId][0], pts[i][1] - pts[startId][1]);
  const far = pts.map((_, i) => i).filter(i => i !== startId).sort((a, b) => dS(b) - dS(a));
  const bossId = bossLevel ? far[Math.floor(R() * 2)] : -1;
  const rest = pts.map((_, i) => i).filter(i => i !== startId && i !== bossId).sort(() => R() - 0.5);
  const special = new Map();   // node -> type of the small thing standing in it
  special.set(rest[0], 'camp'); special.set(rest[1], 'shop'); if (R() < 0.5) special.set(rest[2], 'shop'); special.set(rest[3], 'event');
  // 2) carve each cavern as an irregular blob
  pts.forEach((q, id) => {
    const rt = id === bossId ? 8 : id === startId ? 3.8 : special.has(id) ? 3.2 : 2.8 + R() * 2.6; q.push(rt);
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
  for (let i = 0; i < 5; i++) {
    const a = Math.floor(R() * n), near = pts.map((_, b) => b).filter(b => b !== a).sort((u, v) => Math.hypot(pts[u][0] - pts[a][0], pts[u][1] - pts[a][1]) - Math.hypot(pts[v][0] - pts[a][0], pts[v][1] - pts[a][1])).slice(0, 3);
    const b = near[Math.floor(R() * near.length)]; if (!has(a, b)) edges.push([a, b]);
  }
  for (const [a, b] of edges) tunnel(a, b);
  // 4) drunkard-walk side caves and dead ends
  for (let w = 0; w < 8; w++) {
    let x = pts[Math.floor(R() * n)][0], y = pts[Math.floor(R() * n)][1], ang = R() * 6.283;
    for (let s = 0; s < 110; s++) {
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
  for (let i = 0; i < 50; i++) {   // loose rocks in the open caves
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
    this.run = { hero: s.hero, wpn: own(lo.w), abl: own(lo.a), clan: hero.clan, act: 0, seed: (Math.random() * 1e9) | 0, cstate: {}, cleared: 0, perks: [], drawbacks: [], hp: 100, gold: 20 + 25 * (s.meta.fort || 0), cores: 0,
      heat: s.heat, kills: 0, rooms: 0, xp: 0, plv: 1, coreAcc: 0, bonus: { mut: 0 }, mutKills: 0, killAcc: 0, phoenixUsed: false, t0: Date.now() };
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
      waves: [], waveIdx: 0, waveCd: 0, shake: 0, boss: null, bladeAng: 0, intro: 0, banner: 2.6, bannerText: ACT_NAMES[areaOf(act)].toUpperCase() + ' ' + (areaOf(act) + 1) + '-' + (act % 3 + 1), enc: null, lvlKills: 0, levelTotal: 0, portal: null, levelUps: 0, wdrops: [], hitstop: 0, curCell: sc, cam: { x: clamp(sc.cx - W_ / 2, 0, W.w - W_), y: clamp(sc.cy + 70 - H / 2, 0, W.h - H) }, mx: 0, my: 0,
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
    const tx = clamp(p.x - W_ / 2 + (Input.mx - W_ / 2) * 0.28, 0, Wd.w - W_), ty = clamp(p.y - H / 2 + (Input.my - H / 2) * 0.28, 0, Wd.h - H), k = Math.min(1, dt * 7);
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
    C.hpS = (1 + 0.16 * act) * (1 + 0.15 * run.heat) * this.P.enemyHp * 0.9; C.dmgS = (1 + 0.12 * act) * (1 + 0.12 * run.heat); C.spdS = 1;
    let budget = (120 + act * 12) * (boss ? 0.55 : 1);
    for (let guard = 0; budget > 0 && guard < 300; guard++) {
      const x = (3 + R() * (COLS - 6)) * TILE, y = (3 + R() * (ROWS - 6)) * TILE, cz = this.cellAt(x, y);
      if (!this.fits(x, y, 24) || Math.hypot(x - sc.cx, y - sc.cy) < 650 || (cz && (cz.safe || cz.type === 'boss'))) continue;
      const cost = 4 + Math.min(act, 6), list = this.compose(Math.min(budget, cost), act, Math.min(4, 1 + act)); budget -= cost;
      for (const t of list) {
        const ex = x + (R() - 0.5) * 90, ey = y + (R() - 0.5) * 90;
        if (!this.fits(ex, ey, 20)) continue;
        const elite = t !== 'grunt' && R() < 0.05 + 0.02 * act ? Object.keys(ELITE_MODS)[Math.floor(R() * 4)] : null;
        const e = this.makeEnemy(t, ex, ey, elite); e.free = true; e.spawnT = 0;
      }
    }
    C.levelTotal = C.en.filter(e => e.free).length;
    for (let i = 0, k = 4; i < 200 && k > 0; i++) {   // weapons lying around, like in Nuclear Throne
      const x = (4 + R() * (COLS - 8)) * TILE, y = (4 + R() * (ROWS - 8)) * TILE;
      if (this.fits(x, y, 20) && Math.hypot(x - sc.cx, y - sc.cy) > 500) { this.spawnWeapon(x, y, true); k--; }
    }
  },
  onKill(e) {
    const C = this.C, run = this.run; if (!C || !C.world) return;
    const xp = e.boss ? 60 : e.elite ? 14 : ENEMY[e.type].cost * 2;
    run.plv = run.plv || 1; run.xp = (run.xp || 0) + xp;
    while (run.xp >= 10 + 6 * run.plv) { run.xp -= 10 + 6 * run.plv; run.plv++; C.levelUps++; }
    run.coreAcc = (run.coreAcc || 0) + (e.boss ? 0 : e.elite ? 3 : ENEMY[e.type].cost * 0.4) * (1 + 0.15 * run.act) * (1 + 0.2 * run.heat);
    if (run.coreAcc >= 1) { const g = Math.floor(run.coreAcc); run.coreAcc -= g; run.cores += g; }
    if (e.free) {
      C.lvlKills++;
      if (!C.portal && !isBossLevel(run.act) && C.lvlKills >= Math.ceil(C.levelTotal * 0.8)) { C.portal = { x: e.x, y: e.y }; this.floatText(e.x, e.y - 40, 'THE PORTAL OPENS', '#a06bff', 1.4); Sfx.good(); }
    }
  },
  levelLabel() {
    const run = this.run, C = this.C, a = areaOf(run.act), loop = Math.floor(run.act / 9);
    return (loop ? 'LOOP ' + loop + '  ' : '') + ACT_NAMES[a].toUpperCase() + ' ' + (a + 1) + '-' + (run.act % 3 + 1) + (isBossLevel(run.act) ? '  BOSS' : '  KILLS ' + C.lvlKills + '/' + Math.ceil(C.levelTotal * 0.8)) + '  LV ' + (run.plv || 1) + (run.heat ? '  HEAT ' + run.heat : '');
  },

  // ---------- encounters ----------
  startEncounter(cell, curse) {
    const C = this.C, run = this.run, P = this.P = buildStats(run, Save.data), act = run.act, row = run.cleared * 1.25, boss = cell.type === 'boss', elite = cell.type === 'elite';
    curse = curse || null;
    if (curse && curse.halfhp) { P.maxhp = Math.round(P.maxhp / 2); run.hp = Math.min(run.hp, P.maxhp); }
    C.enc = cell; C.curse = curse || {}; C.cellEnc = cell; C.intro = 1.0; C.waves = []; C.waveIdx = 0; C.waveCd = 0; C.boss = null; C.elitesLeft = elite ? 2 : 0;
    C.hpS = (1 + 0.16 * act) * (1 + 0.04 * row) * (1 + 0.15 * run.heat) * P.enemyHp * ((curse && curse.hp) || 1);
    C.dmgS = (1 + 0.12 * act) * (1 + 0.12 * run.heat) * ((curse && curse.dmg) || 1);
    C.spdS = (curse && curse.speed) || 1;
    if (boss) {
      const b = BOSSES[areaOf(act)], hp = b.hp * (1 + 0.2 * run.heat) * (1 + 0.5 * Math.floor(act / 9)) * P.enemyHp, x = cell.cx, y = cell.cy - 80;
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
    cell.state.cleared = true; run.rooms++; run.cleared++;
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
  spawnWeapon(x, y, quiet) {
    const C = this.C, cur = this.run.wpn || this.run.hero, ids = Object.keys(HEROES).filter(k => k !== cur && !C.wdrops.some(d => d.id === k));
    if (!ids.length) return;
    C.wdrops.push({ id: pick(ids), x, y }); if (!quiet) this.floatText(x, y - 30, 'WEAPON DROP', '#ffd91f');
  },
  dropWeapon(e) { if (Math.random() < (e.boss ? 1 : e.elite ? 0.4 : 0.02)) this.spawnWeapon(e.x, e.y); },
  pickWeapon(d) {
    const C = this.C, run = this.run, old = run.wpn || run.hero;
    C.wdrops = C.wdrops.filter(x => x !== d); run.wpn = d.id; C.bladePos = [];
    if (old !== d.id) C.wdrops.push({ id: old, x: C.p.x, y: C.p.y + 48 });
    Sfx.good(); this.floatText(C.p.x, C.p.y - 30, HEROES[d.id].weapon.name.toUpperCase(), CLANS[HEROES[d.id].clan].color, 1.2); this.persist();
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
    ctx.fillStyle = ['#b0a890', '#ff9a4a', '#c070ff'][areaOf(this.run.act)]; ctx.globalAlpha = 0.35;
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
