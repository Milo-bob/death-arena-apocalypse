// World: one connected map per act (5x4 screens, no map shown to the player). Walk freely between cells; arenas seal their gates while a fight runs.
// Loaded after game.js; replaces the old door-room flow of Game.
const COLS = 5, ROWS = 4, WORLD_W = COLS * 960, WORLD_H = ROWS * 540, NEED_CLEAR = 6;
const CELL_COL = { fight: '#ff6a6a', elite: '#ff8a1f', shop: '#ffd91f', camp: '#39ff6e', event: '#b24bff', curse: '#ff3de8', boss: '#ff2d3d' };
const CELL_NAME = { fight: 'ARENA', elite: 'ELITE ARENA', shop: 'BLACK MARKET', camp: 'CAMP', event: 'STRANGE ALTAR', curse: 'CURSED SHRINE', boss: 'BOSS LAIR' };
const CELL_LET = { fight: 'F', elite: 'E', shop: '$', camp: 'C', event: 'A', curse: 'X', boss: 'B' };

function genWorld(act, seed) {
  const R = rng(seed), cells = [], rects = [], regions = [], gates = [], pillars = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push({ id: r * COLS + c, c, r, x0: c * 960, y0: r * 540, type: 'fight', links: [], combat: true });
  const startId = Math.floor(R() * cells.length), nb = id => { const c = cells[id], o = []; if (c.c > 0) o.push(id - 1); if (c.c < COLS - 1) o.push(id + 1); if (c.r > 0) o.push(id - COLS); if (c.r < ROWS - 1) o.push(id + COLS); return o; };
  // boss lair: one of the cells farthest from the start, so you never begin next to it
  const dS = id => Math.abs(cells[id].c - cells[startId].c) + Math.abs(cells[id].r - cells[startId].r), far = Math.max(...cells.map(c => dS(c.id))), farIds = cells.map(c => c.id).filter(i => dS(i) >= far - 1);
  const bossId = farIds[Math.floor(R() * farIds.length)];
  const link = (a, b) => { if (!cells[a].links.includes(b)) { cells[a].links.push(b); cells[b].links.push(a); } };
  // spanning tree over all non-boss cells, then hang the boss on one neighbour
  const inTree = new Set([startId]);
  while (inTree.size < cells.length - 1) {
    const opts = []; for (const a of inTree) for (const b of nb(a)) if (b !== bossId && !inTree.has(b)) opts.push([a, b]);
    const [a, b] = opts[Math.floor(R() * opts.length)]; link(a, b); inTree.add(b);
  }
  const bn = nb(bossId); link(bossId, bn[Math.floor(R() * bn.length)]);
  // a few extra loops make it feel like a place, not a tree
  for (let i = 0; i < 8; i++) { const a = Math.floor(R() * cells.length); if (a === bossId) continue; const b = nb(a)[Math.floor(R() * nb(a).length)]; if (b !== bossId && !cells[a].links.includes(b)) link(a, b); }
  if (R() < 0.4) { const b2 = bn.find(x => !cells[bossId].links.includes(x)); if (b2 !== undefined) link(bossId, b2); }
  // fill types
  const ids = cells.map(c => c.id).filter(i => i !== startId && i !== bossId).sort(() => R() - 0.5);
  const types = ids.map((_, i) => i < 3 ? 'elite' : i < 5 ? 'shop' : i < 7 ? 'event' : i < 9 ? 'curse' : i < 10 ? 'camp' : 'fight').sort(() => R() - 0.5);
  ids.forEach((id, i) => { cells[id].type = types[i]; });
  cells[startId].type = 'camp'; cells[bossId].type = 'boss';
  for (const c of cells) {
    c.combat = ['fight', 'elite', 'boss'].includes(c.type); c.safe = ['camp', 'shop', 'event', 'curse'].includes(c.type);
    c.rewardKind = c.type === 'fight' ? (R() < 0.35 ? 'gold' : 'perk') : c.type === 'elite' ? 'rare' : c.type === 'curse' ? 'epic' : c.type === 'boss' ? 'rare' : '';
    c.ix = c.x0 + 26; c.iy = c.y0 + 58; c.iw = 908; c.ih = 456;
    rects.push({ x: c.ix, y: c.iy, w: c.iw, h: c.ih }); regions.push({ x: c.ix, y: c.iy, w: c.iw, h: c.ih, big: true });
    if (c.type === 'fight' || c.type === 'elite') {
      const k = 1 + Math.floor(R() * 2);
      for (let i = 0; i < k; i++) { const w = 40 + Math.floor(R() * 40), h = 40 + Math.floor(R() * 40), x = c.x0 + 150 + R() * (480 - 150 - 90 - w / 2), y = c.y0 + 130 + R() * 230; pillars.push({ x, y, w, h }, { x: c.x0 + 960 - x - w, y, w, h }); }
    }
  }
  // corridors = gates (open/closed per frame)
  const seen = new Set();
  for (const c of cells) for (const o of c.links) {
    const key = Math.min(c.id, o) + '-' + Math.max(c.id, o); if (seen.has(key)) continue; seen.add(key);
    const A = cells[Math.min(c.id, o)], B = cells[Math.max(c.id, o)];
    const g = A.r === B.r ? { x: A.x0 + 934, y: A.y0 + 226, w: 52, h: 120, dir: 'h' } : { x: A.x0 + 420, y: A.y0 + 514, w: 120, h: 84, dir: 'v' };
    g.a = A.id; g.b = B.id; g.boss = A.id === bossId || B.id === bossId; g.open = true; gates.push(g);
    regions.push({ x: g.x, y: g.y, w: g.w, h: g.h, big: false });
  }
  return { cells, rects, regions, gates, pillars, startId, bossId, need: NEED_CLEAR, w: WORLD_W, h: WORLD_H, total: cells.filter(c => c.combat && c.type !== 'boss').length + cells.filter(c => c.type === 'curse').length };
}

Object.assign(Game, {
  // ---------- run flow ----------
  startRun() {
    const s = Save.data, hero = HEROES[s.hero];
    const lo = (s.loadout && s.loadout[s.hero]) || {}, own = id => (id && s.heroes[id] && HEROES[id].clan === hero.clan ? id : s.hero);
    this.run = { hero: s.hero, wpn: own(lo.w), abl: own(lo.a), clan: hero.clan, act: 0, seed: (Math.random() * 1e9) | 0, cstate: {}, cleared: 0, perks: [], drawbacks: [], hp: 100, gold: 20 + 25 * (s.meta.fort || 0), cores: 0,
      heat: s.heat, kills: 0, rooms: 0, bonus: { mut: 0 }, mutKills: 0, killAcc: 0, phoenixUsed: false, t0: Date.now() };
    this.P = buildStats(this.run, s); this.run.hp = this.P.maxhp;
    this.enterAct();
  },
  resume() { this.run = Save.data.run; this.P = buildStats(this.run, Save.data); this.enterAct(); },
  descend() {
    const run = this.run; run.act++; run.seed = (Math.random() * 1e9) | 0; run.cstate = {}; run.cleared = 0;
    this.heal(0.35); this.frozen = false; this.enterAct();
  },
  enterAct() {
    const run = this.run, act = run.act, W = this.world = genWorld(act, run.seed);
    for (const c of W.cells) c.state = run.cstate[c.id] || (run.cstate[c.id] = {});
    const sc = W.cells[W.startId]; sc.state.visited = true;
    const P = this.P = buildStats(run, Save.data);
    const C = this.C = { world: W, t: 0, en: [], eb: [], pb: [], haz: [], zones: [], gold: [], parts: [], fl: [], turrets: [], beams: [], markers: [], fx: [], pillars: W.pillars,
      waves: [], waveIdx: 0, waveCd: 0, shake: 0, boss: null, bladeAng: 0, intro: 0, banner: 2.6, bannerText: ACT_NAMES[(act % 3)].toUpperCase(), enc: null, wdrops: [], hitstop: 0, curCell: sc, cam: { x: sc.x0, y: sc.y0 }, mx: 0, my: 0,
      noHit: true, hpS: 1, dmgS: 1, spdS: 1, curse: {}, clearMsg: 0, near: null,
      p: { x: sc.x0 + 480, y: sc.y0 + 430, lx: sc.x0 + 480, ly: sc.y0 + 430, r: 12, aim: -Math.PI / 2, fireT: 0.3, dashT: 0, dashCd: 0, dashDir: 0, dashHit: [], inv: 0.5, abT: 2, flash: 0, over: 0, overRate: 1, shield: 0, still: 0, trailT: 0, regenAcc: 0 },
      dust: Array.from({ length: 36 }, () => ({ x: rnd(0, W_), y: rnd(60, H), vx: rnd(-6, 6), vy: act === 1 ? rnd(-22, -8) : rnd(-4, 6) })) };
    for (const c of W.cells) {
      c.obj = null;
      if (c.type === 'camp') c.obj = { kind: 'rest', x: c.x0 + 480, y: c.y0 + 270 };
      else if (c.type === 'shop' || c.type === 'event' || c.type === 'curse') c.obj = { kind: c.type, x: c.x0 + 480, y: c.y0 + 260 };
    }
    C.floor = buildWorldFloor(act, run.seed, W.regions, W.w, W.h);
    this.mode = 'fight'; this.paused = false; this.frozen = false; this.fade = { t: 0.25, done: true, fn() {} }; document.body.classList.add('fight'); UI.hide();
    Music.play('menu'); this.persist();
  },
  persist() { Save.data.run = this.run; Save.write(); },

  // ---------- geometry ----------
  gatesUpdate() {
    const C = this.C, run = this.run;
    for (const g of C.world.gates) g.open = !(C.enc && (g.a === C.enc.id || g.b === C.enc.id)) && !(g.boss && run.cleared < C.world.need);
  },
  walkable(x, y) {
    const W = this.world;
    for (const r of W.rects) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
    for (const g of W.gates) if (g.open && x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) return true;
    return false;
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
    } else { const c = this.cellAt(o.x, o.y) || C.curCell; o.x = c.x0 + 480; o.y = c.y0 + 286; }
    for (const q of C.pillars) { const n = circRect(o.x, o.y, r, q); if (n) { o.x = n[0]; o.y = n[1]; } }
  },
  cellAt(x, y) { for (const c of this.world.cells) if (x >= c.ix && x <= c.ix + c.iw && y >= c.iy && y <= c.iy + c.ih) return c; return null; },
  arena() { const c = this.C.enc || this.C.curCell; return { x0: c.ix, y0: c.iy, x1: c.ix + c.iw, y1: c.iy + c.ih }; },
  spawnPos() {
    const C = this.C, A = this.arena();
    for (let i = 0; i < 40; i++) {
      const x = rnd(A.x0 + 40, A.x1 - 40), y = rnd(A.y0 + 40, A.y1 - 40);
      if (Math.hypot(x - C.p.x, y - C.p.y) < 230) continue;
      if (C.pillars.some(q => x > q.x - 30 && x < q.x + q.w + 30 && y > q.y - 30 && y < q.y + q.h + 30)) continue;
      return [x, y];
    }
    return [A.x0 + 80, A.y0 + 80];
  },
  camUpdate(dt) {
    const C = this.C, p = C.p, W = this.world, cam = C.cam; let tx, ty;
    const c = this.cellAt(p.x, p.y);
    if (c) { tx = c.x0; ty = c.y0; }
    else {   // in a corridor: slide between the two cells
      const g = W.gates.find(g => p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h);
      if (g) { const A = W.cells[g.a], B = W.cells[g.b], t = g.dir === 'h' ? clamp((p.x - g.x) / g.w, 0, 1) : clamp((p.y - g.y) / g.h, 0, 1); tx = A.x0 + (B.x0 - A.x0) * t; ty = A.y0 + (B.y0 - A.y0) * t; } else { tx = cam.x; ty = cam.y; }
    }
    const k = Math.min(1, dt * 9); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    if (Math.abs(tx - cam.x) < 0.5) cam.x = tx; if (Math.abs(ty - cam.y) < 0.5) cam.y = ty;
  },

  // ---------- encounters ----------
  startEncounter(cell, curse) {
    const C = this.C, run = this.run, P = this.P = buildStats(run, Save.data), act = run.act, row = run.cleared * 1.25, boss = cell.type === 'boss', elite = cell.type === 'elite';
    curse = curse || null;
    if (curse && curse.halfhp) { P.maxhp = Math.round(P.maxhp / 2); run.hp = Math.min(run.hp, P.maxhp); }
    C.enc = cell; C.curse = curse || {}; C.cellEnc = cell; C.intro = 1.0; C.waves = []; C.waveIdx = 0; C.waveCd = 0; C.boss = null; C.elitesLeft = elite ? 2 : 0;
    C.hpS = (1 + 0.35 * act) * (1 + 0.04 * row) * (1 + 0.15 * run.heat) * P.enemyHp * ((curse && curse.hp) || 1);
    C.dmgS = (1 + 0.3 * act) * (1 + 0.12 * run.heat) * ((curse && curse.dmg) || 1);
    C.spdS = (curse && curse.speed) || 1;
    if (boss) {
      const b = BOSSES[(act % 3)], hp = b.hp * (1 + 0.2 * run.heat) * (1 + 0.5 * Math.floor(act / 3)) * P.enemyHp, x = cell.x0 + 480, y = cell.y0 + 190;
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
    if (C.encT > 150 && !C.boss && C.en.length && C.en.length <= 3) { for (const e of C.en.slice()) this.kill(e); this.floatText(C.p.x, C.p.y - 40, 'THE ARENA COLLAPSES', '#ff8a1f', 1.2); }   // failsafe: nobody stays stuck
    if (!C.markers.length && !C.en.length && C.waveIdx >= C.waves.length && (!C.boss || C.boss.dead)) this.encClear();
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
    if (n === 'elite' || (n === 'fight' && Math.random() < 0.3)) this.spawnWeapon(cell.x0 + 480, cell.y0 + 400);
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
  orbPos(cell) { return { x: cell.x0 + 480, y: cell.y0 + (cell.type === 'boss' ? 340 : 300) }; },
  worldUpdate() {
    const C = this.C, p = C.p, W = this.world, run = this.run; C.near = null; C.nearW = null;
    for (const d of C.wdrops) if (dist(d, p) < 36) C.nearW = d;
    const cc = this.cellAt(p.x, p.y);
    if (cc && cc !== C.curCell) this.discover(cc);
    if (C.clearMsg > 0) C.clearMsg -= 1 / 60;
    if (cc && !C.enc && cc.combat && !cc.state.cleared && p.x > cc.ix + 70 && p.x < cc.ix + cc.iw - 70 && p.y > cc.iy + 70 && p.y < cc.iy + cc.ih - 70) this.startEncounter(cc, null);
    for (const c of W.cells) {
      const s = c.state;
      if (s.cleared && s.reward && !s.rewarded) { const o = this.orbPos(c); if (dist(o, p) < 30) { C.nodeCell = c; C.node = s; C.pendingOrb = true; C.pendingObj = false; this.frozen = true; Input.down = false; Input.keys = {}; UI.reward(s.reward, s.reward.cores); return; } }
      if (c.type === 'boss' && s.cleared && s.rewarded && dist({ x: c.x0 + 480, y: c.y0 + 190 }, p) < 40) { this.frozen = true; Input.keys = {}; UI.actClear(); return; }
      if (c.obj && !s.used && dist(c.obj, p) < 52) C.near = c;
    }
  },
  // ---------- weapons on the ground (swap with E) ----------
  spawnWeapon(x, y) {
    const C = this.C, cur = this.run.wpn || this.run.hero, ids = Object.keys(HEROES).filter(k => k !== cur && !C.wdrops.some(d => d.id === k));
    if (!ids.length) return;
    C.wdrops.push({ id: pick(ids), x, y }); this.floatText(x, y - 30, 'WEAPON DROP', '#ffd91f');
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
    const B = BIOME[(this.run.act % 3)], cam = C.cam, cx = Math.round(cam.x), cy = Math.round(cam.y), cur = this.cellAt(p.x, p.y);
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
      if (c.type === 'boss' && s.cleared) Light.add(c.x0 + 480, c.y0 + 190, 150, 0.3);
    }
    for (const g of this.world.gates) if (!g.open) Light.add(g.x + g.w / 2, g.y + g.h / 2, 90, 0.18);
    Light.end(ctx);
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, rgb, a) => { for (const k of [1, 0.66, 0.33]) { ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')'; ctx.beginPath(); ctx.arc(x, y, r * k, 0, 6.283); ctx.fill(); } };
    for (const g of glows) glow(...g);
    for (const e of C.en) if (e.boss) glow(e.x, e.y, 120, '255,60,40', 0.04);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = ['#b0a890', '#ff9a4a', '#c070ff'][(this.run.act % 3)]; ctx.globalAlpha = 0.35;
    for (const d of C.dust) ctx.fillRect(snap(cx + d.x), snap(cy + d.y), 2, 2); ctx.globalAlpha = 1;
  },
  drawWorldObjs(C) {
    const cam = C.cam, vx0 = cam.x - 80, vx1 = cam.x + W + 80, vy0 = cam.y - 80, vy1 = cam.y + H + 80, run = this.run;
    ctx.textAlign = 'center';
    for (const g of this.world.gates) {
      if (g.x > vx1 || g.x + g.w < vx0 || g.y > vy1 || g.y + g.h < vy0) continue;
      if (g.open) continue;
      const lockedBoss = g.boss && run.cleared < this.world.need && !(C.enc && (g.a === C.enc.id || g.b === C.enc.id)), col = lockedBoss ? '#ffd91f' : '#ff3a3a';
      ctx.fillStyle = '#0a0b0e'; ctx.fillRect(g.x, g.y, g.w, g.h);
      if (g.dir === 'h') { for (let y = g.y + 4; y < g.y + g.h - 2; y += 12) { ctx.fillStyle = '#4a4d55'; ctx.fillRect(g.x, y, g.w, 6); ctx.fillStyle = '#7a7f89'; ctx.fillRect(g.x, y, g.w, 2); } }
      else { for (let x = g.x + 4; x < g.x + g.w - 2; x += 12) { ctx.fillStyle = '#4a4d55'; ctx.fillRect(x, g.y, 6, g.h); ctx.fillStyle = '#7a7f89'; ctx.fillRect(x, g.y, 2, g.h); } }
      ctx.fillStyle = col; ctx.fillRect(g.x + g.w / 2 - 6, g.y + g.h / 2 - 4, 12, 10); ctx.fillRect(g.x + g.w / 2 - 3, g.y + g.h / 2 - 10, 6, 8);
      if (lockedBoss && dist({ x: g.x + g.w / 2, y: g.y + g.h / 2 }, C.p) < 320) { const t = 'SEALED: CLEAR ' + (this.world.need - run.cleared) + ' MORE'; ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText(t, g.x + g.w / 2 + 1, g.y - 7); ctx.fillStyle = col; ctx.fillText(t, g.x + g.w / 2, g.y - 8); }
    }
    for (const c of this.world.cells) {
      if (c.x0 > vx1 || c.x0 + 960 < vx0 || c.y0 > vy1 || c.y0 + 540 < vy0) continue;
      const s = c.state;
      if (s.cleared && s.reward && !s.rewarded) {
        const rc = { common: '#9fb4c8', rare: '#3d9bff', epic: '#b24bff' }[s.reward.min] || '#9fb4c8', o = this.orbPos(c), b = Math.sin(C.t * 3) * 3;
        pxRing(o.x, o.y + b, 22 + Math.sin(C.t * 5) * 2, rc, 2);
        const sp = Sprites.orb(5, rc); ctx.drawImage(sp, snap(o.x) - 22, snap(o.y + b) - 22, 44, 44);
        ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText('REWARD', snap(o.x) + 1, o.y - 31); ctx.fillStyle = rc; ctx.fillText('REWARD', snap(o.x), o.y - 32);
      }
      if (c.type === 'boss' && s.cleared) {
        const x = c.x0 + 480, y = c.y0 + 190; for (let i = 0; i < 3; i++) pxRing(x, y, 14 + i * 9 + Math.sin(C.t * 4 + i) * 2, ['#39ff6e', '#a0ffb0', '#39ff6e'][i], 2);
        ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#39ff6e'; ctx.fillText(s.rewarded ? 'EXIT / DESCEND' : 'TAKE THE REWARD FIRST', x, y - 40);
      }
      if (c.obj) this.drawObj(c, C.t);
    }
    for (const c of this.world.cells) if (c.type === 'boss' && c.state.cleared) {
      const x = c.x0 + 480, y = c.y0 + 190; if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
      for (let k = 0; k < 3; k++) { ctx.strokeStyle = ['#ffffff', '#3de8ff', '#a06bff'][k]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 12 + k * 8 + Math.sin(C.t * 5 + k) * 3, 0, 6.283); ctx.stroke(); }
      ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#fff'; ctx.fillText(c.state.rewarded ? 'PORTAL' : 'TAKE THE ORB', x, y + 44);
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
