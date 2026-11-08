// Core: run state, node map, rooms, combat, rendering. Menus live in ui.js.
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const Input = { keys: {}, mx: W / 2, my: H / 2, down: false, rdown: false, auto: false };

// ---------- helpers ----------
const snap = v => Math.round(v / 2) * 2;
function pxLine(x1, y1, x2, y2, w, c) {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2)); ctx.fillStyle = c;
  for (let i = 0; i <= n; i++) { const t = i / n; ctx.fillRect(snap(x1 + (x2 - x1) * t - w / 2), snap(y1 + (y2 - y1) * t - w / 2), w, w); }
}
function pxRing(cx, cy, r, c, w) {
  w = w || 2; const n = Math.max(10, Math.ceil(Math.PI * 2 * r / w)); ctx.fillStyle = c;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ctx.fillRect(snap(cx + Math.cos(a) * r - w / 2), snap(cy + Math.sin(a) * r - w / 2), w, w); }
}
function pxArc(cx, cy, r, a0, a1, w, c) {
  const n = Math.max(6, Math.ceil((a1 - a0) * r / 2)); ctx.fillStyle = c;
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; ctx.fillRect(snap(cx + Math.cos(a) * r - w / 2), snap(cy + Math.sin(a) * r - w / 2), w, w); }
}
function pxBar(x, y, w, h, frac, col) {
  ctx.fillStyle = '#1f7fc8'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#05060f'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  const fw = Math.round((w - 4) * clamp(frac, 0, 1) / 2) * 2; ctx.fillStyle = col; ctx.fillRect(x + 2, y + 2, fw, h - 4); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 2, y + 2, fw, 2);
}
function circRect(x, y, r, q) {   // push circle out of rect, returns [nx, ny] or null
  const cx = clamp(x, q.x, q.x + q.w), cy = clamp(y, q.y, q.y + q.h);
  let dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
  if (d >= r) return null;
  if (d === 0) { dx = 1; dy = 0; d = 1; }
  return [cx + dx / d * r, cy + dy / d * r];
}
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy;
  const t = l ? clamp(((px - x1) * dx + (py - y1) * dy) / l, 0, 1) : 0;
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}
function poly(x, y, r, n, rot, fill, stroke, lw) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}
function circ(x, y, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}

const NODE_INFO = {
  fight: { label: 'FIGHT', col: '#ff6a6a' }, elite: { label: 'ELITE', col: '#ff8a1f' }, shop: { label: 'SHOP', col: '#ffd91f' }, rest: { label: 'REST', col: '#39ff6e' },
  event: { label: 'ALTAR', col: '#b24bff' }, curse: { label: 'CURSE', col: '#ff3de8' }, boss: { label: 'BOSS', col: '#ff2d3d' },
};

function genDoors(room) {
  if (room >= 5) return [{ type: 'boss', reward: '' }];
  const wt = { fight: 45, elite: 14, event: 12, shop: 11, rest: 8, curse: 11 };
  const n = room === 0 ? 2 : rndi(2, 3), types = [];
  for (let i = 0; i < n; i++) {
    let t, tries = 0;
    do { t = wpick(Object.keys(wt).filter(k => !(k === 'elite' && room < 1)), k => wt[k]); } while (types.includes(t) && ++tries < 8);
    types.push(t);
  }
  if (room === 2 && !types.some(t => t === 'shop' || t === 'rest')) types[0] = pick(['shop', 'rest']);
  if (room === 4 && !types.includes('rest')) types[n - 1] = 'rest';
  return types.map(type => ({ type, reward: type === 'fight' ? pick(['perk', 'perk', 'gold']) : type === 'elite' ? 'rare perk' : type === 'curse' ? 'epic perk' : '' }));
}

const Game = {
  mode: 'menu',          // menu | fight | clear
  paused: false,
  run: null, P: null, C: null, bg: null,
  last: 0, menuT: 0,

  // ================= run management =================
  startRun() {
    const s = Save.data, hero = HEROES[s.hero];
    this.run = { hero: s.hero, clan: hero.clan, act: 0, room: 0, cur: { type: 'fight', reward: 'perk' }, doors: [], perks: [], drawbacks: [], hp: 100, gold: 20 + 25 * (s.meta.fort || 0), cores: 0,
      heat: s.heat, kills: 0, rooms: 0, bonus: { mut: 0 }, mutKills: 0, killAcc: 0, phoenixUsed: false, t0: Date.now() };
    this.P = buildStats(this.run, s); this.run.hp = this.P.maxhp;
    this.enterRoom();
  },
  resume() { this.run = Save.data.run; this.P = buildStats(this.run, Save.data); this.enterRoom(); },
  enterRoom() {
    const run = this.run; run.doors = genDoors(run.room); this.persist();
    this.startRoom({ type: run.cur.type, r: run.room, reward: run.cur.reward }, null);
  },
  persist() { Save.data.run = this.run; Save.write(); },
  recalc() {   // after perk / drawback changes: keep HP in step with max HP
    const old = this.P ? this.P.maxhp : 100;
    this.P = buildStats(this.run, Save.data);
    if (this.P.maxhp > old) this.run.hp += this.P.maxhp - old;
    this.run.hp = Math.min(this.run.hp, this.P.maxhp);
  },
  heal(frac, flat) {
    if (this.P.noHeal) return 0;
    const a = Math.min(this.P.maxhp - this.run.hp, this.P.maxhp * (frac || 0) + (flat || 0));
    this.run.hp += a; return a;
  },
  nextRoom(d) {
    const run = this.run;
    if (d.type === 'exit') { this.fadeTo(() => { this.frozen = true; UI.actClear(); }); return; }
    run.room++; run.cur = { type: d.type, reward: d.reward };
    this.fadeTo(() => this.enterRoom());
  },
  fadeTo(fn) { this.fade = { t: 0, fn, done: false }; },
  doorX(i, n) { return Math.round(W * (i + 1) / (n + 1)); },
  // called by the screens (reward, shop, altar...) when the player is done: back into the room, doors open
  nodeDone() {
    const C = this.C; this.frozen = false; UI.hide(); document.body.classList.add('fight');
    if (!C) return;
    C.orb = null;
    if (C.obj && C.obj.kind !== 'shop') C.obj.used = true;
    C.doorsOpen = true; this.persist();
  },
  interact() {
    const C = this.C; if (!C || !C.near || this.frozen || this.fade || this.paused) return;
    const o = C.near; this.frozen = true; Input.keys = {}; Input.down = false;
    if (o.kind === 'shop') UI.shop(C.node); else if (o.kind === 'rest') UI.rest(C.node); else if (o.kind === 'event') UI.event(C.node); else if (o.kind === 'curse') UI.curse(C.node);
  },
  worldUpdate() {
    const C = this.C, p = C.p; C.near = null;
    if (C.orb && dist(C.orb, p) < 30) { const o = C.orb; this.frozen = true; Input.down = false; Input.keys = {}; UI.reward(o.reward, o.cores); return; }
    if (C.obj && !C.obj.used && dist(C.obj, p) < 52) C.near = C.obj;
    if (C.doorsOpen && p.y < ARENA.y0 + 30 && !this.fade) {
      const ds = C.doors || [];
      for (let i = 0; i < ds.length; i++) if (Math.abs(p.x - this.doorX(i, ds.length)) < 34) { this.nextRoom(ds[i]); break; }
    }
  },
  perkPool(minR) {
    const run = this.run, order = ['common', 'rare', 'epic', 'legendary'], ownedTags = this.P.tags;
    const base = Object.keys(PERKS).filter(id => !run.perks.includes(id) && !PERKS[id].clan && (!PERKS[id].lock || Save.data.perks[id]));
    for (let m = order.indexOf(minR || 'common'); m >= 0; m--) {
      const pool = base.filter(id => order.indexOf(PERKS[id].r) >= m);
      if (pool.length >= 3 || m === 0) return pool;
    }
    return base;
  },
  offerPerks(n, minR) {
    let pool = this.perkPool(minR), out = [];
    const ownedTags = this.P.tags;
    while (out.length < n && pool.length) {
      const id = wpick(pool, i => RARITY[PERKS[i].r].w * (1 + 0.9 * PERKS[i].tags.reduce((s, t) => s + Math.min(2, ownedTags[t] || 0), 0)));
      out.push(id); pool = pool.filter(x => x !== id);
    }
    return out;
  },
  takePerk(id) { this.run.perks.push(id); this.recalc(); Sfx.good(); const pk = PERKS[id]; if (pk.full) this.run.hp = this.P.maxhp; else if (pk.heal) this.run.hp = Math.min(this.P.maxhp, this.run.hp + pk.heal); },
  takeDrawback(id) { this.run.drawbacks.push(id); this.recalc(); },
  bank(frac, why) {
    const run = this.run, s = Save.data;
    const got = Math.round(run.cores * frac);
    s.cores += got; s.stats.runs++; s.stats.kills += run.kills;
    s.stats.bestAct = Math.max(s.stats.bestAct, run.act + 1);
    s.stats.bestRooms = Math.max(s.stats.bestRooms, run.rooms);
    s.stats.bestPlv = Math.max(s.stats.bestPlv || 0, run.plv || 1); s.stats.bosses = (s.stats.bosses || 0) + (run.bosses || 0);
    if (why === 'win') { s.stats.wins++; if (run.heat >= s.heatMax && s.heatMax < 5) s.heatMax = run.heat + 1; }
    if (why === 'dead') s.stats.deaths++;
    const res = { why, got, lost: run.cores - got, run: Object.assign({}, run), unbanked: run.cores };
    s.run = null; Save.write(true);
    this.run = null; this.C = null; this.mode = 'menu';
    return res;
  },
  exitRun() { UI.summary(this.bank(1.25, 'exit')); },
  descend() {
    const run = this.run; run.act++; run.room = 0; run.cur = { type: 'fight', reward: 'perk' };
    this.heal(0.35); this.frozen = false; this.enterRoom();
  },
  winRun() { UI.summary(this.bank(1.6 + 0.25 * Math.floor(this.run.act / LOOP_LEVELS), 'win')); },
  abandon() { UI.summary(this.bank(0.25, 'dead')); },
  die() {
    const salv = (Save.data.meta.salvage || 0) * 0.08;
    UI.summary(this.bank(0.4 + salv, 'dead'));
  },

  // ================= room =================
  startRoom(node, curse) {
    const run = this.run, P = this.P = buildStats(run, Save.data), act = run.act, row = node.r;
    if (curse && curse.halfhp) { P.maxhp = Math.round(P.maxhp / 2); run.hp = Math.min(run.hp, P.maxhp); }
    const boss = node.type === 'boss', elite = node.type === 'elite', safe = ['shop', 'rest', 'event', 'curse'].includes(node.type) && !curse;
    const C = this.C = { node, curse: curse || {}, t: 0, intro: 1.2, en: [], eb: [], pb: [], haz: [], zones: [], gold: [], parts: [], fl: [], turrets: [], beams: [], markers: [], pillars: [], fx: [],
      waves: [], waveIdx: 0, waveCd: 0, shake: 0, cleared: false, clearT: 0, boss: null, bladeAng: 0, noHit: true, banner: 0, bannerText: '', roomMax: P.maxhp, elitesLeft: elite ? 2 : 0,
      p: { x: W / 2, y: 450, r: 12, aim: -Math.PI / 2, fireT: 0.3, dashT: 0, dashCd: 0, dashDir: 0, dashHit: [], inv: 0.5, abT: 2, flash: 0, over: 0, overRate: 1, shield: 0, still: 0, trailT: 0, regenAcc: 0, face: -Math.PI / 2 },
      hpS: (1 + 0.35 * act) * (1 + 0.04 * row) * (1 + 0.15 * run.heat) * P.enemyHp * ((curse && curse.hp) || 1),
      dmgS: (1 + 0.3 * act) * (1 + 0.12 * run.heat) * ((curse && curse.dmg) || 1), spdS: (curse && curse.speed) || 1 };
    // symmetric pillars give each room a readable shape
    if (!boss && !safe) {
      const k = rndi(1, 2);
      for (let i = 0; i < k; i++) {
        const w = rndi(40, 80), h = rndi(40, 80), x = rnd(150, W / 2 - 90), y = rnd(130, 360);
        C.pillars.push({ x, y, w, h }, { x: W - x - w, y, w, h });
      }
    }
    if (boss) {
      const b = BOSSES[areaOf(act)];
      const hp = b.hp * (1 + 0.2 * run.heat) * P.enemyHp;
      C.boss = { type: 'boss', boss: true, x: W / 2, y: 170, r: b.r, hp, maxhp: hp, sh: 0, flash: 0, phase: 1, pat: null, pt: 0, cd: 2, n: 0, sa: 0, atk: 0, col: b.col, name: b.name, vx: 0, vy: 0, slow: 0, slowT: 0, poison: 0, poisonT: 0, burn: 0, burnT: 0, spawnT: 0, bladeCd: 0, ang: 0, stage: 0 };
      C.en.push(C.boss);
      C.bannerText = b.name.toUpperCase();
    } else if (safe) {
      C.safe = true; C.cleared = true; C.done = true; C.doorsOpen = true; C.intro = 0; C.doors = run.doors;
      C.obj = { kind: node.type, x: W / 2, y: 250 };
      C.bannerText = { shop: 'THE BLACK MARKET', rest: 'CAMPFIRE', event: 'STRANGE ALTAR', curse: 'CURSED ROOM' }[node.type];
    } else {
      let budget = 7 + row * 2.2 + act * 7;
      if (elite) budget *= 1.2;
      if (curse && curse.count) budget *= curse.count;
      const parts = row < 3 ? [0.5, 0.5] : [0.35, 0.35, 0.3];
      C.waves = parts.map(f => this.compose(Math.max(2, Math.round(budget * f)), act, row));
      if (elite) { C.eliteLeft = 2; }
      C.bannerText = (elite ? 'ELITE ' : curse && curse.name ? curse.name.toUpperCase() + ' ' : '') + 'ROOM ' + (run.rooms + 1);
    }
    C.banner = 2.2;
    C.floor = buildFloor(act, (Math.random() * 1e9) | 0);
    C.dust = Array.from({ length: 30 }, () => ({ x: rnd(ARENA.x0, ARENA.x1), y: rnd(ARENA.y0, ARENA.y1), vx: rnd(-6, 6), vy: act === 1 ? rnd(-22, -8) : rnd(-4, 6) }));
    Music.play(boss ? 'boss' : safe ? 'menu' : 'fight');
    this.mode = 'fight'; this.paused = false; this.frozen = false; this.fade = this.fade && !this.fade.done ? this.fade : null; document.body.classList.add('fight'); UI.hide();
  },
  compose(budget, act, row) {
    let avail = ['grunt'];
    if (row >= 1 || act > 0) avail.push('shooter');
    if (row >= 2 || act > 0) avail.push('bomber', 'dasher');
    if (act >= 1 || row >= 4) avail.push('tank');
    if (row >= 1 || act > 0) avail.push('swarmer');
    if (act >= 1 || row >= 3) avail.push('spitter', 'blob');
    if (act >= 2 || row >= 5) avail.push('sniper');
    if (act >= 1 || row >= 2) avail.push('turret');
    if (row >= 2) avail.push('rat');
    const cast = AREA_ENEMIES[areaOf(act)].filter(t => avail.includes(t)); if (cast.length) avail = cast;
    const list = [];
    while (budget > 0) {
      const o = avail.filter(t => ENEMY[t].cost <= budget);
      if (!o.length) break;
      const t = wpick(o, x => x === 'grunt' ? 3 : x === 'tank' ? 0.8 : 1.4);
      list.push(t); budget -= ENEMY[t].cost;
    }
    return list;
  },
  spawnPos() {
    const C = this.C;
    for (let i = 0; i < 40; i++) {
      const x = rnd(ARENA.x0 + 40, ARENA.x1 - 40), y = rnd(ARENA.y0 + 40, ARENA.y1 - 40);
      if (Math.hypot(x - C.p.x, y - C.p.y) < 230) continue;
      if (C.pillars.some(q => x > q.x - 30 && x < q.x + q.w + 30 && y > q.y - 30 && y < q.y + q.h + 30)) continue;
      return [x, y];
    }
    return [rnd(100, 860), 120];
  },
  makeEnemy(type, x, y, elite) {
    const C = this.C, d = ENEMY[type];
    const e = { type, x, y, lx: x, ly: y, r: d.r, hp: d.hp * C.hpS, maxhp: d.hp * C.hpS, sh: 0, dmg: d.dmg * C.dmgS, speed: d.speed * C.spdS * 1.15, col: d.col, atk: 0, cd: rnd(0.5, 2), state: 'move', st: 0, flash: 0, vx: 0, vy: 0,
      slow: 0, slowT: 0, poison: 0, poisonT: 0, burn: 0, burnT: 0, bladeCd: 0, ang: 0, sd: Math.random() < 0.5 ? 1 : -1, wind: 0, fire: rnd(1, 2.2), spawnT: 0.4 };
    if (elite) {
      e.elite = elite; e.hp *= 2.2; e.maxhp = e.hp; e.dmg *= 1.2;
      if (elite === 'shield') e.sh = e.hp * 0.6;
      if (elite === 'swift') { e.speed *= 1.4; e.fire *= 0.6; }
    }
    this.C.en.push(e); return e;
  },

  // ================= damage =================
  dmgMul() {
    const P = this.P, run = this.run, p = this.C.p;
    let m = P.dmg * (1 + run.bonus.mut);
    if (P.berserk) m *= 1 + 0.6 * (1 - run.hp / P.maxhp);
    if (P.still && p.still > 0.6) m *= 1.5;
    return m;
  },
  hitEnemy(e, base, o) {
    o = o || {};
    if (e.dead || e.spawnT > 0.25) return;
    const P = this.P, C = this.C;
    let d = o.raw ? base : base * this.dmgMul(), crit = false;
    if (!o.raw && !o.noCrit && Math.random() < P.crit) { crit = true; d *= P.critMul; }
    if (crit && P.execute && !e.boss && e.hp < e.maxhp * 0.3) d = e.hp + e.sh + 1;
    this.dealDamage(e, d, crit);
    C.hitstop = Math.max(C.hitstop || 0, crit ? 0.05 : 0.018); C.shake = Math.max(C.shake, crit ? 3 : 1); if (this.bleed) this.bleed(e);
    Sfx.hit();
    if (o.noProc) return;
    if (P.poison > 0) { e.poison = Math.max(e.poison, P.poison * P.poisonMul); e.poisonT = 3; if (P.poisonSlow) { e.slow = 0.35; e.slowT = 1.5; } }
    if (P.burn > 0) { e.burn = Math.max(e.burn, P.burn); e.burnT = 2; }
    if (o.slow) { e.slow = Math.max(e.slow, o.slow); e.slowT = 1; }
    if (P.chain > 0 && Math.random() < P.chain) {
      let best = null, bd = 140;
      for (const q of C.en) if (q !== e && !q.dead) { const dd = dist(q, e); if (dd < bd) { bd = dd; best = q; } }
      if (best) { C.fx.push({ k: 'line', x1: e.x, y1: e.y, x2: best.x, y2: best.y, t: 0.15, col: '#3de8ff' }); this.hitEnemy(best, base * 0.6, { noProc: true, noCrit: true, raw: o.raw }); }
    }
    if (crit && P.critBlast) this.blast(e.x, e.y, 42, 30, true);
  },
  dealDamage(e, d, crit) {
    const C = this.C;
    if (e.sh > 0) { const a = Math.min(e.sh, d); e.sh -= a; d -= a; }
    e.hp -= d; if (d >= 2) e.flash = 0.08;
    if (d >= 1) this.floatText(e.x + rnd(-6, 6), e.y - e.r, Math.round(d), crit ? '#ffd91f' : '#fff', crit ? 1.35 : 1);
    if (e.hp <= 0 && !e.dead) this.kill(e);
  },
  floatText(x, y, txt, col, sc) { const C = this.C; if (C.fl.length < 60) C.fl.push({ x, y, txt, col, t: 0.7, sc: sc || 1 }); },
  burst(x, y, col, n, sp) { const C = this.C; for (let i = 0; i < n && C.parts.length < 400; i++) { const a = rnd(0, 6.28), v = rnd(30, sp || 140); C.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: rnd(0.25, 0.6), max: 0.6, col, s: rnd(1.5, 3.5) }); } },
  blast(x, y, r, dmg, friendly) {
    const C = this.C, P = this.P;
    r *= P.blastRad; dmg *= P.blastMul;
    C.fx.push({ k: 'ring', x, y, r, t: 0.25, max: 0.25, col: '#ff8a1f' });
    this.burst(x, y, '#ff8a1f', 8, 160); C.shake = Math.max(C.shake, 3); Sfx.boom();
    for (const e of C.en.slice()) if (!e.dead && dist(e, { x, y }) < r + e.r) this.hitEnemy(e, dmg, { raw: true, noProc: true, noCrit: true });
  },
  kill(e, quiet) {
    const C = this.C, P = this.P, run = this.run;
    e.dead = true;
    if (quiet) return;
    run.kills++; C.kills = (C.kills || 0) + 1;
    this.burst(e.x, e.y, e.col, e.boss ? 40 : 10, e.boss ? 260 : 150); Sfx.kill();
    C.hitstop = Math.max(C.hitstop || 0, e.boss ? 0.2 : e.elite ? 0.07 : 0.03); C.shake = Math.max(C.shake, e.boss ? 14 : e.elite ? 7 : 2.5);
    if (this.stain) this.stain(e);
    if (this.dropWeapon) this.dropWeapon(e);
    if (this.onKill) this.onKill(e);
    if (e.boss) { C.eb.length = 0; C.haz.length = 0; C.beams.length = 0; C.markers.length = 0; for (const q of C.en) if (q !== e) q.dead = true; C.shake = 14; }
    const gv = Math.max(1, Math.round((e.boss ? 40 : e.elite ? 12 : ENEMY[e.type].cost * rnd(1.5, 3)) * P.goldMul));
    C.gold.push({ x: e.x, y: e.y, v: gv, vx: rnd(-60, 60), vy: rnd(-60, 60), t: 0 });
    if (Math.random() < 0.04 && !P.noHeal) C.gold.push({ x: e.x, y: e.y, v: 0, heal: 8, vx: rnd(-40, 40), vy: rnd(-40, 40), t: 0 });
    run.killAcc += P.killHeal;
    if (run.killAcc >= 1) { run.killAcc -= 1; this.healP(1); }
    if (P.mutagen && ++run.mutKills % 10 === 0) { run.bonus.mut += 0.02; this.floatText(C.p.x, C.p.y - 24, 'MUTATION +2%', '#7dff4a'); }
    if (P.killBlast > 0) C.haz.push({ x: e.x, y: e.y, r: 42, t: 0.08, dmg: P.killBlast, friendly: true, quick: true });
    if (P.poisonSpread && e.poisonT > 0) for (const q of C.en) if (!q.dead && dist(q, e) < 100) { q.poison = Math.max(q.poison, e.poison); q.poisonT = 3; }
    if (e.elite === 'split' || (ENEMY[e.type] && ENEMY[e.type].splits)) for (let i = 0; i < 2; i++) { const g = this.makeEnemy('grunt', e.x + rnd(-14, 14), e.y + rnd(-14, 14)); g.hp = g.maxhp *= 0.6; g.spawnT = 0; g.free = e.free; g.awake = true; }
    if (e.elite === 'volatile') C.haz.push({ x: e.x, y: e.y, r: 75, t: 0.9, max: 0.9, dmg: 22 * C.dmgS, friendly: false });
  },
  healP(a) { if (this.run.hp < this.P.maxhp) { this.run.hp = Math.min(this.P.maxhp, this.run.hp + a); this.floatText(this.C.p.x, this.C.p.y - 20, '+' + (Math.round(a) / 10), '#39ff6e'); } },
  hurt(dmg, src) {
    const C = this.C, p = C.p, P = this.P, run = this.run;
    if (!C || p.inv > 0 || p.dashT > 0) return false;
    if (p.shield > 0) { C.fx.push({ k: 'ring', x: p.x, y: p.y, r: 30, t: 0.2, max: 0.2, col: '#ffe94a' }); return false; }
    const d = dmg * P.taken;
    run.hp -= d; p.inv = 0.7; p.flash = 0.2; C.shake = Math.max(C.shake, 8); C.noHit = false; Sfx.hurt();
    this.floatText(p.x, p.y - 20, '-' + (Math.round(d) / 10), '#ff2d3d', 1.2);
    this.burst(p.x, p.y, '#ff2d3d', 12, 200);
    if (P.thorns && src && src.hp !== undefined && !src.dead) this.hitEnemy(src, P.thorns, { raw: true, noProc: true, noCrit: true });
    if (run.hp <= 0) {
      if (P.phoenix && !run.phoenixUsed) { run.phoenixUsed = true; run.hp = P.maxhp * 0.5; p.inv = 2; this.blast(p.x, p.y, 170, 90, true); this.floatText(p.x, p.y - 30, 'PHOENIX!', '#ffd91f', 1.6); }
      else { run.hp = 0; C.dead = true; setTimeout(() => this.die(), 900); }
    }
    return true;
  },

  // ================= update =================
  update(dt) {
    const C = this.C, P = this.P, run = this.run, p = C.p;
    if (C.dead) { C.t += dt; this.updateFx(dt); return; }
    C.t += dt;
    if (C.banner > 0) C.banner -= dt;
    this.gatesUpdate(); C.mx = Input.mx + C.cam.x; C.my = Input.my + C.cam.y;
    // ---- player movement ----
    let mx = (Input.keys.d || Input.keys.arrowright ? 1 : 0) - (Input.keys.a || Input.keys.arrowleft ? 1 : 0), my = (Input.keys.s || Input.keys.arrowdown ? 1 : 0) - (Input.keys.w || Input.keys.arrowup ? 1 : 0);
    const ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; }
    p.aim = Math.atan2(C.my - p.y, C.mx - p.x);
    p.still = ml ? 0 : p.still + dt;
    let sp = 265 * P.speed;
    for (const z of C.zones) if (z.slowP && dist(z, p) < z.r) sp *= 0.6;
    if (p.dashT > 0) {
      p.dashT -= dt; sp = 780;
      mx = Math.cos(p.dashDir); my = Math.sin(p.dashDir);
      if (P.dashDmg || P.trail) for (const e of C.en) if (!e.dead && !p.dashHit.includes(e) && dist(e, p) < e.r + 20) { p.dashHit.push(e); if (P.dashDmg) this.hitEnemy(e, P.dashDmg, { noCrit: true }); }
      if (P.trail) { p.trailT -= dt; if (p.trailT <= 0) { p.trailT = 0.04; C.zones.push({ x: p.x, y: p.y, r: 20, dur: 1.8, dps: 20, col: '#ff8a1f', max: 1.8 }); } }
      if (p.dashT <= 0 && P.dashBlast) this.blast(p.x, p.y, 72, 40, true);
      if (Math.random() < 0.6) C.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.25, max: 0.25, col: CLANS[run.clan].color, s: 5 });
    } else if (ml && Math.random() < 0.0) { /* placeholder */ }
    p.x += mx * sp * dt; p.y += my * sp * dt;
    this.collide(p, p.r);
    if (p.dashCd > 0) p.dashCd -= dt;
    if (p.inv > 0) p.inv -= dt; if (p.flash > 0) p.flash -= dt; if (p.over > 0) p.over -= dt; if (p.shield > 0) p.shield -= dt; if (p.abT > 0) p.abT -= dt;
    if (Input.keys.shift && p.dashCd <= 0 && p.dashT <= 0) {
      p.dashDir = ml ? Math.atan2(my, mx) : p.aim; p.dashT = 0.17; p.dashCd = 1.0 * P.dashCd; p.dashHit = []; p.inv = Math.max(p.inv, 0.25); Sfx.dash();
    }
    if ((Input.keys.q || Input.rdown) && p.abT <= 0) this.useAbility();
    if (P.regen && run.hp < P.maxhp) run.hp = Math.min(P.maxhp, run.hp + P.regen * dt);
    // ---- attack ----
    const w = kitOf(run).weapon;
    if (p.fireT > 0) p.fireT -= dt;
    if ((Input.down || Input.auto) && p.fireT <= 0 && w.type !== 'blades' && C.intro < 1.0) {
      if (this.useAmmo(w)) { this.fire(w); if (P.dual && run.wpn2) { const w2 = HEROES[run.wpn2].weapon; if (w2.type !== 'blades' && this.useAmmo(w2)) this.fire(w2); } p.fireT = 1 / (w.rate * P.rate * (1 + P.stress * (1 - run.hp / P.maxhp)) * (p.over > 0 ? p.overRate : 1)); } else { p.fireT = 0.25; this.noAmmo(); }
    }
    this.updateBlades(w, dt);
    if (P.aura) for (const e of C.en) if (!e.dead && dist(e, p) < 105) this.dealDamage(e, P.aura * dt, false);
    // ---- spawns / waves ----
    if (C.enc) { if (C.intro > 0) C.intro -= dt; else this.updateWaves(dt); }
    for (const m of C.markers) m.t -= dt;
    for (const m of C.markers.filter(q => q.t <= 0)) { const e = this.makeEnemy(m.type, m.x, m.y, m.elite); this.burst(m.x, m.y, e.col, 8, 100); }
    C.markers = C.markers.filter(q => q.t > 0);
    // ---- entities ----
    for (const e of C.en) if (!e.dead && (!e.free || this.wake(e))) this.updateEnemy(e, dt);
    this.separate();
    this.updateBullets(dt);
    this.updateHazards(dt);
    this.updateMisc(dt);
    C.en = C.en.filter(e => !e.dead);
    this.updateFx(dt);
    this.encUpdate(dt);
    if (!C.enc) for (const gd of C.gold) gd.pull = true;
    this.worldUpdate(dt);
    this.camUpdate(dt);
  },
  roomCleared() {
    const run = this.run, C = this.C, n = C.node;
    run.rooms++;
    const base = { fight: 6, elite: 14, curse: 22, boss: 45 }[n.type] || 0;
    const got = Math.round(base * (1 + 0.35 * run.act) * (1 + 0.2 * run.heat));
    run.cores += got;
    this.P = buildStats(run, Save.data); run.hp = Math.min(run.hp, this.P.maxhp);
    if (this.P.clearHeal) this.heal(this.P.clearHeal);
    let reward;
    if (n.type === 'boss') reward = { kind: 'perk', min: 'rare' };
    else if (n.type === 'elite') reward = { kind: 'perk', min: 'rare' };
    else if (n.type === 'curse') reward = { kind: 'perk', min: 'epic' };
    else reward = n.reward === 'gold' ? { kind: 'gold', amount: Math.round(35 + 8 * n.r) } : { kind: 'perk', min: 'common' };
    this.floatText(C.p.x, C.p.y - 34, '+' + got + ' CORES', '#3de8ff', 1.1);
    C.doors = n.type === 'boss' ? [{ type: 'exit', reward: '' }] : run.doors;
    if (reward.kind === 'gold') { run.gold += reward.amount; this.floatText(C.p.x, C.p.y - 52, '+' + reward.amount + ' GOLD', '#ffd91f', 1.2); C.doorsOpen = true; }
    else { C.orb = { x: W / 2, y: 300, reward, cores: got }; C.doorsOpen = false; }
    this.persist();
  },
  updateWaves(dt) {
    const C = this.C;
    if (C.waveIdx >= C.waves.length) return;
    const alive = C.en.filter(e => !e.free).length + C.markers.length;
    if (alive <= (C.waveIdx === 0 ? 99 : 2)) {
      C.waveCd -= dt;
      if (C.waveCd <= 0 || C.waveIdx === 0) {
        const list = C.waves[C.waveIdx++];
        const eliteMods = Object.keys(ELITE_MODS);
        list.forEach((t) => {
          const [x, y] = this.spawnPos();
          let elite = null;
          if (C.elitesLeft > 0 && t !== 'grunt') { elite = pick(eliteMods); C.elitesLeft--; }
          C.markers.push({ type: t, x, y, t: 0.9, max: 0.9, elite });
        });
        C.waveCd = 1.2;
      }
    }
  },
  collide(o, r) {
    const C = this.C;
    o.x = clamp(o.x, ARENA.x0 + r, ARENA.x1 - r); o.y = clamp(o.y, ARENA.y0 + r, ARENA.y1 - r);
    for (const q of C.pillars) { const n = circRect(o.x, o.y, r, q); if (n) { o.x = n[0]; o.y = n[1]; } }
  },
  separate() {
    const en = this.C.en;
    for (let i = 0; i < en.length; i++) for (let j = i + 1; j < en.length; j++) {
      const a = en[i], b = en[j]; if (a.dead || b.dead || a.boss || b.boss) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
      if (d < m && d > 0.01) { const k = (m - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
    }
  },

  // ---------- weapons ----------
  fire(w, noq) {
    const C = this.C, P = this.P, p = C.p, hero = HEROES[this.run.hero], col = CLANS[hero.clan].color, a0 = p.aim = this.assistAim(w);
    C.shake = Math.max(C.shake, w.dmg >= 25 || w.type === 'mortar' ? 3 : 1);
    if (w.type === 'shot') {
      const n = w.n + P.extra; Sfx.shoot(ammoOf(w), w.rate >= 7);
      if (w.burst > 1 && !noq) { C.burstQ = C.burstQ || []; for (let i = 1; i < w.burst; i++) C.burstQ.push({ t: 0.07 * i, w }); }
      const rc = clamp(30 + w.dmg * n * 0.8, 30, 170); p.kvx = (p.kvx || 0) - Math.cos(a0) * rc; p.kvy = (p.kvy || 0) - Math.sin(a0) * rc;
      this.burst(p.x + Math.cos(a0) * 18, p.y + Math.sin(a0) * 18, '#fff3b0', 2, 130);
      for (let i = 0; i < n; i++) {
        const a = a0 + (n > 1 ? (((i + 0.5) / n - 0.5) * w.spread * 1.1 + rnd(-0.04, 0.04) * w.spread) * P.spreadMul : rnd(-w.spread, w.spread) * P.spreadMul / 2);   // w.spread of a multi-shot weapon = the whole cone
        C.pb.push({ x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14, vx: Math.cos(a) * w.speed * 1.2, vy: Math.sin(a) * w.speed * 1.2, r: w.size * 1.7, dmg: w.dmg * (w.ammo === 'shell' || ammoOf(w) === 'shell' ? P.shellMul : ammoOf(w) === 'energy' ? P.energyMul : 1), pierce: w.pierce + P.pierce, life: w.life * P.range, hit: [], homing: (w.homing || 0) + P.homing + (ammoOf(w) === 'bolt' ? P.boltHoming : 0), col, boom: w.boom || 0, boomDmg: w.boomDmg || 0, bounce: w.bounce || 0 });
      }
    } else if (w.type === 'cone') {
      Sfx.slash(); p.kvx = (p.kvx || 0) + Math.cos(a0) * 150; p.kvy = (p.kvy || 0) + Math.sin(a0) * 150;
      const range = w.range * P.range, arc = w.arc * (1 + 0.2 * P.extra);
      C.fx.push({ k: 'arc', x: p.x, y: p.y, a: a0, r: range, arc, t: 0.14, max: 0.14, col });
      for (const e of C.en) {
        if (e.dead) continue;
        const d = dist(e, p); if (d > range + e.r) continue;
        let da = Math.abs(Math.atan2(e.y - p.y, e.x - p.x) - a0); da = Math.min(da, 6.283 - da);
        if (da < arc / 2 + e.r / Math.max(d, 1)) { this.hitEnemy(e, w.dmg); this.knock(e, a0, 160); }
      }
      for (const pr of C.props) if (!pr.dead) { const d = dist(pr, p); if (d > range + pr.r) continue; let da = Math.abs(Math.atan2(pr.y - p.y, pr.x - p.x) - a0); da = Math.min(da, 6.283 - da); if (da < arc / 2 + 0.3) this.damageProp(pr, w.dmg); }
      C.eb = C.eb.filter(b => { const d = dist(b, p); if (d > range) return true; let da = Math.abs(Math.atan2(b.y - p.y, b.x - p.x) - a0); da = Math.min(da, 6.283 - da); if (da < arc / 2) { this.burst(b.x, b.y, '#fff', 3, 80); return false; } return true; });
    } else if (w.type === 'lance') {
      Sfx.slash();
      const n = 1 + P.extra, reach = w.reach * P.range, wd = w.width * (1 + 0.15 * P.pierce);
      for (let i = 0; i < n; i++) {
        const a = a0 + (n > 1 ? (i - (n - 1) / 2) * 0.4 : 0), x2 = p.x + Math.cos(a) * reach, y2 = p.y + Math.sin(a) * reach;
        C.fx.push({ k: 'lance', x1: p.x, y1: p.y, x2, y2, w: wd, t: 0.13, max: 0.13, col });
        for (const e of C.en) if (!e.dead && segDist(e.x, e.y, p.x, p.y, x2, y2) < wd / 2 + e.r) { this.hitEnemy(e, w.dmg); this.knock(e, a, 90); }
        for (const pr of C.props) if (!pr.dead && segDist(pr.x, pr.y, p.x, p.y, x2, y2) < wd / 2 + pr.r) this.damageProp(pr, w.dmg);
      }
    } else if (w.type === 'mortar') {
      Sfx.shoot();
      const n = 1 + P.extra, reach = w.reach * P.range;
      const d = Math.min(reach, Math.hypot(C.mx - p.x, C.my - p.y));
      for (let i = 0; i < n; i++) {
        const o = i ? 48 : 0, tx = p.x + Math.cos(p.aim) * d + rnd(-o, o), ty = p.y + Math.sin(p.aim) * d + rnd(-o, o);
        C.haz.push({ x: tx, y: ty, r: w.r * P.blastRad, t: w.delay, max: w.delay, dmg: w.dmg, friendly: true, col, shell: true });
      }
    }
  },
  knock(e, a, f) { if (e.boss) return; f *= this.P.knockMul; const k = e.type === 'tank' ? 0.25 : 1; e.vx += Math.cos(a) * f * k * 4; e.vy += Math.sin(a) * f * k * 4; },
  updateBlades(w, dt) {
    const C = this.C, P = this.P, p = C.p, isB = w.type === 'blades';
    const n = (isB ? w.n : 0) + P.blades; if (!n) return;
    const R = (isB ? w.r : 58) * P.orbitR, dmg = (isB ? w.dmg : 12) * P.bladeDmg;
    C.bladeAng += (isB ? w.spin : 3) * P.spin * dt;
    C.bladePos = [];
    for (let i = 0; i < n; i++) {
      const a = C.bladeAng + i / n * 6.283, bx = p.x + Math.cos(a) * R, by = p.y + Math.sin(a) * R;
      C.bladePos.push([bx, by, a]);
      for (const e of C.en) if (!e.dead && e.bladeCd <= 0 && dist(e, { x: bx, y: by }) < e.r + 10) {
        e.bladeCd = 0.35; this.hitEnemy(e, dmg, { slow: P.bladeKnock ? 0.3 : 0 }); if (P.bladeKnock) this.knock(e, Math.atan2(e.y - p.y, e.x - p.x), 120);
      }
      if (isB || P.bladeKnock) C.eb = C.eb.filter(b => dist(b, { x: bx, y: by }) > 14 + b.r);
    }
    for (const e of C.en) if (e.bladeCd > 0) e.bladeCd -= dt;
  },
  useAbility() {
    const C = this.C, P = this.P, p = C.p, a = kitOf(this.run).ability, col = CLANS[this.run.clan].color;
    p.abT = a.cd * P.abCd; Sfx.ability();
    if (a.type === 'eat') { this.eatWeapon(); return; }
    if (a.type === 'roll') { p.dashDir = p.aim; p.dashT = 0.2; p.dashHit = []; p.inv = Math.max(p.inv, 0.6); Sfx.dash(); return; }
    if (a.type === 'strike') { C.haz.push({ x: C.mx, y: C.my, r: a.r * P.blastRad, t: 0.7, max: 0.7, dmg: a.dmg, friendly: true }); return; }
    if (a.type === 'nova') {
      C.fx.push({ k: 'ring', x: p.x, y: p.y, r: a.r, t: 0.35, max: 0.35, col });
      for (const e of C.en) if (!e.dead && dist(e, p) < a.r + e.r) { this.hitEnemy(e, a.dmg, { raw: false }); if (a.burn) { e.burn = Math.max(e.burn, a.burn); e.burnT = 3; } this.knock(e, Math.atan2(e.y - p.y, e.x - p.x), a.knock / 4); }
      C.eb = C.eb.filter(b => dist(b, p) > a.r); C.shake = 8;
    } else if (a.type === 'zone') C.zones.push({ x: p.x, y: p.y, r: a.r, dur: a.dur, max: a.dur, dps: a.dps, slow: a.slow, poison: a.poison, col });
    else if (a.type === 'overdrive') { p.over = a.dur; p.overRate = a.rate; }
    else if (a.type === 'turret') C.turrets.push({ x: p.x, y: p.y, t: a.dur, fire: 0, rate: a.rate, dmg: a.dmg, col });
    else if (a.type === 'shield') p.shield = a.dur;
    else if (a.type === 'bloom') {
      this.healP(Math.min(a.heal, P.maxhp - this.run.hp)); C.fx.push({ k: 'ring', x: p.x, y: p.y, r: a.r, t: 0.4, max: 0.4, col: '#39ff6e' });
      for (const e of C.en) if (!e.dead && dist(e, p) < a.r + e.r) this.hitEnemy(e, a.dmg);
    } else if (a.type === 'blink') {
      const x0 = p.x, y0 = p.y, dx = Math.cos(p.aim), dy = Math.sin(p.aim);
      let d = 0; while (d < a.dist) { p.x += dx * 10; p.y += dy * 10; d += 10; const ox = p.x, oy = p.y; this.collide(p, p.r); if (Math.abs(ox - p.x) + Math.abs(oy - p.y) > 4) break; }
      C.fx.push({ k: 'line', x1: x0, y1: y0, x2: p.x, y2: p.y, t: 0.3, col, w: 8 }); p.inv = Math.max(p.inv, 0.35);
      for (const e of C.en) if (!e.dead && segDist(e.x, e.y, x0, y0, p.x, p.y) < e.r + 22) this.hitEnemy(e, a.dmg);
    }
  },

  // ---------- enemies ----------
  moveE(e, dx, dy, dt) { e.x += dx * dt; e.y += dy * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt); this.collide(e, e.r); },
  eShoot(e, a, sp, dmg, r) { this.C.eb.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: r || 5, dmg, life: 4, col: e.col }); },
  updateEnemy(e, dt) {
    const C = this.C, p = C.p, P = this.P;
    if (e.flash > 0) e.flash -= dt; if (e.spawnT > 0) e.spawnT -= dt; if (e.atk > 0) e.atk -= dt;
    // status effects
    if (e.poisonT > 0) { e.poisonT -= dt; const d = e.poison * dt; this.dealDamage(e, d, false); if (P.poisonLeech) this.run.hp = Math.min(P.maxhp, this.run.hp + d * P.poisonLeech); }
    if (e.burnT > 0) { e.burnT -= dt; this.dealDamage(e, e.burn * dt, false); }
    if (e.slowT > 0) e.slowT -= dt; else e.slow = 0;
    if (e.dead) return;
    for (const z of C.zones) if (dist(z, e) < z.r + e.r && z.slow) e.slow = Math.max(e.slow, z.slow), e.slowT = 0.2;
    const sm = (1 - Math.min(0.8, e.slow)) * P.foeSlow , d = dist(e, p), ang = Math.atan2(p.y - e.y, p.x - e.x), spd = e.speed * sm;
    if (e.boss) return this.updateBoss(e, dt, d, ang);
    if (e.spawnT > 0) return;
    if (e.freeze > 0) { e.freeze -= dt; this.moveE(e, 0, 0, dt); return; }
    const touch = d < e.r + p.r + 2;
    switch (ENEMY[e.type].ai || e.type) {
      case 'turret': {
        e.vx = e.vy = 0; this.moveE(e, 0, 0, dt);
        if (d < 560) { e.fire -= dt; if (e.fire <= 0) { for (const o of [-0.12, 0, 0.12]) this.eShoot(e, ang + o, 260, e.dmg); e.fire = 2.4 * rnd(0.8, 1.2); } }
        break;
      }
      case 'spitter': {
        const tx = Math.cos(ang), ty = Math.sin(ang); let vx = -ty * e.sd * spd * 0.5, vy = tx * e.sd * spd * 0.5;
        if (d > 260) { vx = tx * spd; vy = ty * spd; } else if (d < 150) { vx = -tx * spd; vy = -ty * spd; }
        this.moveE(e, vx, vy, dt);
        e.fire -= dt; if (e.fire <= 0) { for (const o of [-0.28, 0, 0.28]) this.eShoot(e, ang + o, 230, e.dmg); e.fire = 2.8 * rnd(0.8, 1.2); }
        if (touch && e.atk <= 0 && this.hurt(e.dmg, e)) e.atk = 0.8; break;
      }
      case 'sniper': {
        const tx = Math.cos(ang), ty = Math.sin(ang); let vx = -ty * e.sd * spd * 0.4, vy = tx * e.sd * spd * 0.4;
        if (d > 480) { vx = tx * spd; vy = ty * spd; } else if (d < 330) { vx = -tx * spd; vy = -ty * spd; }
        this.moveE(e, vx, vy, dt);
        if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { this.eShoot(e, ang, 430, e.dmg, 4); e.fire = 3.4 * rnd(0.8, 1.2); } }
        else { e.fire -= dt; if (e.fire <= 0) e.wind = 0.9; }
        if (touch && e.atk <= 0 && this.hurt(e.dmg, e)) e.atk = 0.8; break;
      }
      case 'grunt': this.moveE(e, Math.cos(ang) * spd, Math.sin(ang) * spd, dt); if (touch && e.atk <= 0) { if (this.hurt(e.dmg, e)) e.atk = 0.8; } break;
      case 'shooter': {
        const sd = e.sd, tx = Math.cos(ang), ty = Math.sin(ang);
        let vx = -ty * sd * spd * 0.6, vy = tx * sd * spd * 0.6;
        if (d > 290) { vx = tx * spd; vy = ty * spd; } else if (d < 190) { vx = -tx * spd; vy = -ty * spd; }
        this.moveE(e, vx, vy, dt);
        if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { this.eShoot(e, ang, 250, e.dmg); e.fire = 2.4 * rnd(0.8, 1.2) * (e.elite === 'swift' ? 0.6 : 1); } }
        else { e.fire -= dt; if (e.fire <= 0) e.wind = 0.45; }
        if (touch && e.atk <= 0 && this.hurt(e.dmg, e)) e.atk = 0.8; break;
      }
      case 'dasher':
        if (e.state === 'move') {
          const want = d > 230 ? 1 : d < 160 ? -1 : 0, tx = Math.cos(ang), ty = Math.sin(ang);
          this.moveE(e, tx * spd * want - ty * e.sd * spd * 0.5, ty * spd * want + tx * e.sd * spd * 0.5, dt);
          e.cd -= dt; if (e.cd <= 0 && d < 400) { e.state = 'aim'; e.st = 0.75; e.ang = ang; }
        } else if (e.state === 'aim') { this.moveE(e, 0, 0, dt); e.st -= dt; if (e.st > 0.3) e.ang = ang; if (e.st <= 0) { e.state = 'dash'; e.st = 0.34; e.hit = false; } }
        else if (e.state === 'dash') {
          this.moveE(e, Math.cos(e.ang) * 560 * sm, Math.sin(e.ang) * 560 * sm, dt); e.st -= dt;
          if (!e.hit && touch) { e.hit = this.hurt(e.dmg, e); }
          if (e.st <= 0) { e.state = 'rest'; e.st = 0.6; }
        } else { this.moveE(e, 0, 0, dt); e.st -= dt; if (e.st <= 0) { e.state = 'move'; e.cd = 2.2 * (e.elite === 'swift' ? 0.6 : 1); } }
        break;
      case 'bomber':
        if (e.state === 'move') { this.moveE(e, Math.cos(ang) * spd, Math.sin(ang) * spd, dt); if (d < 72) { e.state = 'fuse'; e.st = 0.8; } }
        else {
          this.moveE(e, 0, 0, dt); e.st -= dt;
          if (e.st <= 0) { C.fx.push({ k: 'ring', x: e.x, y: e.y, r: 76, t: 0.25, max: 0.25, col: '#ff9aa6' }); this.burst(e.x, e.y, '#ff9aa6', 14, 200); Sfx.boom(); if (dist(e, p) < 76 + p.r) this.hurt(e.dmg, e); C.shake = 6; this.kill(e, true); }
        }
        break;
      case 'tank':
        this.moveE(e, Math.cos(ang) * spd, Math.sin(ang) * spd, dt);
        e.cd -= dt; if (e.cd <= 0 && d < 170) { C.haz.push({ x: e.x, y: e.y, r: 100, t: 0.9, max: 0.9, dmg: e.dmg, friendly: false, ring: 8, col: '#a01828', owner: e }); e.freeze = 0.9; e.cd = 3.6; }
        if (touch && e.atk <= 0 && this.hurt(e.dmg, e)) e.atk = 1;
        break;
    }
  },
  updateBoss(b, dt, d, ang) {
    const C = this.C, p = C.p, def = BOSSES[areaOf(this.run.act)], sm = 1 - Math.min(0.5, b.slow);
    const ph = b.hp < b.maxhp * 0.33 ? 3 : b.hp < b.maxhp * 0.66 ? 2 : 1;
    if (ph > b.phase) {
      b.phase = ph; b.pat = null; b.cd = 1.4; C.eb.length = 0; C.haz = C.haz.filter(h => h.friendly); C.beams.length = 0;
      C.banner = 1.6; C.bannerText = 'PHASE ' + ph; C.shake = 12; this.burst(b.x, b.y, b.col, 30, 240);
    }
    const speedUp = 1 + 0.18 * (ph - 1);
    if (!b.pat) {
      this.moveE(b, d > 190 ? Math.cos(ang) * 46 : 0, d > 190 ? Math.sin(ang) * 46 : 0, dt);
      b.cd -= dt / speedUp;
      if (b.cd <= 0) { const opts = def.phases[ph - 1].filter(x => x !== b.last); b.pat = pick(opts); b.last = b.pat; b.pt = 0; b.n = 0; if (b.pat === 'slam' || b.pat === 'sweep' || b.pat === 'charge') b.n = 0; }
    } else {
      b.pt += dt * speedUp; const t = b.pt, n = b.phase;
      switch (b.pat) {
        case 'ring':
          if (t > 0.5 && b.n < 1) { b.n = 1; this.ring(b, 12 + 4 * n, 175, rnd(0, 6.28)); }
          if (t > 1.1 && n >= 2 && b.n < 2) { b.n = 2; this.ring(b, 12 + 4 * n, 175, rnd(0, 6.28)); }
          if (t > 1.8) this.endPat(b); break;
        case 'aimed': {
          const times = [0.5, 0.9, 1.3, 1.7, 2.1].slice(0, 2 + n);
          if (b.n < times.length && t > times[b.n]) { b.n++; const k = 2 + n; for (let i = 0; i < k; i++) this.eShoot(b, ang + (i - (k - 1) / 2) * 0.2, 270, 11 * C.dmgS, 5); }
          if (b.n >= times.length && t > times[times.length - 1] + 0.4) this.endPat(b); break;
        }
        case 'charge':
          if (t < 0.9) { b.ang = ang; this.moveE(b, 0, 0, dt); }
          else if (t < 1.5) { this.moveE(b, Math.cos(b.ang) * 600 * sm, Math.sin(b.ang) * 600 * sm, dt); if (d < b.r + p.r && b.atk <= 0 && this.hurt(22 * C.dmgS, b)) b.atk = 0.5; }
          else this.endPat(b); break;
        case 'spiral':
          if (t < 2.6) { b.sa = (b.sa || 0) + 0.42; if (Math.floor(t / 0.07) !== b.n) { b.n = Math.floor(t / 0.07); this.eShoot(b, b.sa, 160, 9 * C.dmgS, 4); if (n >= 3) this.eShoot(b, b.sa + 3.14, 160, 9 * C.dmgS, 4); } } else this.endPat(b); break;
        case 'summon':
          if (t > 0.4 && b.n < 1) { b.n = 1; for (let i = 0; i < 2 + n; i++) { const [x, y] = this.spawnPos(); C.markers.push({ type: pick(AREA_ENEMIES[areaOf(this.run.act)].filter(t => ENEMY[t].cost <= 3)), x, y, t: 0.9, max: 0.9 }); } }
          if (t > 1.2) this.endPat(b); break;
        case 'slam':
          if (b.n < 1) { b.n = 1; const k = n >= 2 ? 2 : 1; for (let i = 0; i < k; i++) C.haz.push({ x: clamp(p.x + (i ? rnd(-140, 140) : 0), this.arena().x0 + 40, this.arena().x1 - 40), y: clamp(p.y + (i ? rnd(-100, 100) : 0), this.arena().y0 + 40, this.arena().y1 - 40), r: 105, t: 1.0 + i * 0.35, max: 1.0 + i * 0.35, dmg: 24 * C.dmgS, friendly: false, ring: n >= 3 ? 10 : 0, col: b.col }); }
          if (t > 1.9) this.endPat(b); break;
        case 'sweep':
          if (b.n < 1) { b.n = 1; C.beams.push({ x: b.x, y: b.y, a: ang, len: 900, w: 15, tele: 0.9, t: 3.4, rot: (Math.random() < 0.5 ? -1 : 1) * (0.9 + 0.2 * n), dmg: 18 * C.dmgS, owner: b }); }
          if (t > 3.6) this.endPat(b); break;
      }
    }
    if (b.atk > 0) b.atk -= dt;
    if (d < b.r + p.r && b.atk <= 0 && this.hurt(16 * C.dmgS, b)) b.atk = 0.8;
  },
  endPat(b) { b.pat = null; b.cd = 1.5 - 0.25 * b.phase; },
  ring(e, n, sp, off) { for (let i = 0; i < n; i++) this.eShoot(e, off + i / n * 6.283, sp, 10 * this.C.dmgS, 5); },

  // ---------- projectiles & hazards ----------
  updateBullets(dt) {
    const C = this.C, p = C.p;
    if (C.burstQ && C.burstQ.length) { for (const q of C.burstQ) q.t -= dt; const due = C.burstQ.filter(q => q.t <= 0); C.burstQ = C.burstQ.filter(q => q.t > 0); for (const q of due) this.fire(q.w, true); }
    for (const b of C.pb) {
      if (b.homing) {
        let best = null, bd = 260; for (const e of C.en) if (!e.dead && !b.hit.includes(e)) { const d = dist(e, b); if (d < bd) { bd = d; best = e; } }
        if (best) { const sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx); let da = Math.atan2(best.y - b.y, best.x - b.x) - cur; da = Math.atan2(Math.sin(da), Math.cos(da)); const na = cur + clamp(da, -b.homing * dt, b.homing * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (!this.walkable(b.x, b.y)) {
        if (b.bounce > 0) {
          const px = b.x - b.vx * dt, py = b.y - b.vy * dt; let fx = !this.walkable(b.x, py), fy = !this.walkable(px, b.y); if (!fx && !fy) fx = fy = true;
          if (fx) b.vx = -b.vx; if (fy) b.vy = -b.vy; b.x = px; b.y = py; b.bounce--; b.hit = [];
        } else b.life = 0;
      } else if (C.pillars.some(q => b.x > q.x && b.x < q.x + q.w && b.y > q.y && b.y < q.y + q.h)) b.life = 0;
      if (b.life <= 0) { this.boomAt(b); continue; }
      for (const e of C.en) if (!e.dead && !b.hit.includes(e) && dist(e, b) < e.r + b.r) {
        b.hit.push(e); this.hitEnemy(e, b.dmg); this.knock(e, Math.atan2(b.vy, b.vx), clamp(b.dmg * 1.2, 12, 60)); this.burst(b.x, b.y, b.col, 3, 90);
        if (b.pierce-- <= 0) { b.life = 0; this.boomAt(b); break; }
      }
      if (b.life > 0) for (const pr of C.props) if (!pr.dead && dist(pr, b) < pr.r + b.r) { this.damageProp(pr, b.dmg); if (b.pierce-- <= 0) { b.life = 0; this.boomAt(b); break; } }
    }
    C.pb = C.pb.filter(b => b.life > 0);
    for (const b of C.eb) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (!this.walkable(b.x, b.y) || C.pillars.some(q => b.x > q.x && b.x < q.x + q.w && b.y > q.y && b.y < q.y + q.h)) b.life = 0;
      if (b.life > 0 && p.shield > 0 && dist(b, p) < 64) { C.pb.push({ x: b.x, y: b.y, vx: -b.vx, vy: -b.vy, r: 5, dmg: b.dmg * 2.5, pierce: 0, life: 1.2, hit: [], homing: 0, col: '#ffe94a', boom: 0, boomDmg: 0, bounce: 0 }); b.life = 0; this.burst(b.x, b.y, '#ffe94a', 4, 120); continue; }
      if (b.life > 0 && dist(b, p) < b.r + p.r - 1 && this.hurt(b.dmg, null)) b.life = 0;
    }
    C.eb = C.eb.filter(b => b.life > 0);
  },
  updateHazards(dt) {
    const C = this.C, p = C.p;
    for (const h of C.haz) {
      h.t -= dt;
      if (h.t > 0) continue;
      h.done = true;
      C.fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, t: 0.22, max: 0.22, col: h.friendly ? '#ff8a1f' : '#ff4a4a' });
      if (!h.quick) { this.burst(h.x, h.y, h.friendly ? '#ff8a1f' : '#ff4a4a', 10, 170); Sfx.boom(); C.shake = Math.max(C.shake, 5); }
      if (h.friendly) { for (const e of C.en.slice()) if (!e.dead && dist(e, h) < h.r + e.r) this.hitEnemy(e, h.dmg, { raw: !!h.quick, noProc: !!h.quick, noCrit: !!h.quick }); for (const pr of C.props) if (!pr.dead && dist(pr, h) < h.r + pr.r) this.damageProp(pr, h.dmg * 1.5 + 10); }
      else {
        if (dist(h, p) < h.r + p.r && !(this.P.blastImmune && !h.owner)) this.hurt(h.dmg, h.owner);
        if (h.ring) for (let i = 0; i < h.ring; i++) this.eShoot({ x: h.x, y: h.y, col: h.col || '#ff4a4a' }, i / h.ring * 6.283, 200, 8 * C.dmgS, 5);
      }
    }
    C.haz = C.haz.filter(h => !h.done);
    for (const bm of C.beams) {
      if (bm.owner && bm.owner.dead) { bm.t = 0; continue; }
      if (bm.owner) { bm.x = bm.owner.x; bm.y = bm.owner.y; }
      if (bm.tele > 0) { bm.tele -= dt; continue; }
      bm.t -= dt; bm.a += bm.rot * dt;
      const x2 = bm.x + Math.cos(bm.a) * bm.len, y2 = bm.y + Math.sin(bm.a) * bm.len;
      if (segDist(p.x, p.y, bm.x, bm.y, x2, y2) < bm.w / 2 + p.r) this.hurt(bm.dmg, null);
    }
    C.beams = C.beams.filter(b => b.t > 0);
  },
  updateMisc(dt) {
    const C = this.C, p = C.p, P = this.P;
    for (const z of C.zones) {
      z.dur -= dt;
      if (z.dps) for (const e of C.en) if (!e.dead && dist(e, z) < z.r + e.r) { this.dealDamage(e, z.dps * this.dmgMul() * dt * 0.9, false); if (z.poison) { e.poison = Math.max(e.poison, z.poison * P.poisonMul); e.poisonT = 2; } }
      if (z.slowP) {/* enemy-side zones unused */}
    }
    C.zones = C.zones.filter(z => z.dur > 0);
    for (const t of C.turrets) {
      t.t -= dt; t.fire -= dt;
      if (t.fire <= 0) {
        let best = null, bd = 380; for (const e of C.en) if (!e.dead) { const d = dist(e, t); if (d < bd) { bd = d; best = e; } }
        if (best) { const a = Math.atan2(best.y - t.y, best.x - t.x); t.a = a; t.fire = 1 / t.rate; C.pb.push({ x: t.x, y: t.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 3, dmg: t.dmg, pierce: P.pierce, life: 0.8, hit: [], homing: 0, col: t.col }); }
      }
    }
    C.turrets = C.turrets.filter(t => t.t > 0);
    for (const g of C.gold) {
      g.t += dt; const d = dist(g, p);
      if (g.pull || d < 110) { const a = Math.atan2(p.y - g.y, p.x - g.x), s = 360; g.vx = Math.cos(a) * s; g.vy = Math.sin(a) * s; }
      else { g.vx *= 0.95; g.vy *= 0.95; }
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (d < 16 && g.t > 0.15) {
        g.got = true; Sfx.pick();
        if (g.heal) this.healP(g.heal); else this.run.gold += g.v;
      }
    }
    C.gold = C.gold.filter(g => !g.got);
  },
  updateFx(dt) {
    const C = this.C;
    for (const q of C.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.94; q.vy *= 0.94; q.t -= dt; }
    C.parts = C.parts.filter(q => q.t > 0);
    for (const d of C.dust || []) { d.x += d.vx * dt; d.y += d.vy * dt; if (d.x < 0) d.x = W; if (d.x > W) d.x = 0; if (d.y < 58) d.y = H; if (d.y > H) d.y = 58; }
    for (const f of C.fl) { f.t -= dt; f.y -= 30 * dt; }
    C.fl = C.fl.filter(f => f.t > 0);
    for (const f of C.fx) f.t -= dt;
    C.fx = C.fx.filter(f => f.t > 0);
    C.shake *= Math.pow(0.001, dt);
  },

  // ================= render =================
  background(act) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), col = ACT_COL[areaOf(act)];
    const aw = ARENA.x1 - ARENA.x0, ah = ARENA.y1 - ARENA.y0;
    g.fillStyle = '#05060f'; g.fillRect(0, 0, W, H);
    g.fillStyle = col[0]; g.fillRect(ARENA.x0, ARENA.y0, aw, ah);
    // checker floor tiles + 2px grid
    g.fillStyle = 'rgba(255,255,255,.018)';
    for (let i = 0; i * 40 < aw; i++) for (let j = 0; j * 40 < ah; j++) if ((i + j) % 2) g.fillRect(ARENA.x0 + i * 40, ARENA.y0 + j * 40, 40, 40);
    g.fillStyle = col[1]; g.globalAlpha = 0.3;
    for (let x = ARENA.x0; x <= ARENA.x1; x += 40) g.fillRect(x, ARENA.y0, 2, ah);
    for (let y = ARENA.y0; y <= ARENA.y1; y += 40) g.fillRect(ARENA.x0, y, aw, 2);
    g.globalAlpha = 1;
    for (const [x, y] of [[ARENA.x0, ARENA.y0], [ARENA.x1 - 2, ARENA.y0], [ARENA.x0, ARENA.y1 - 2], [ARENA.x1 - 2, ARENA.y1 - 2]]) { g.fillStyle = '#fff'; g.fillRect(x - 2, y - 2, 6, 6); }
    // double-edge frame
    g.fillStyle = col[1]; g.fillRect(ARENA.x0 - 4, ARENA.y0 - 4, aw + 8, 4); g.fillRect(ARENA.x0 - 4, ARENA.y1, aw + 8, 4); g.fillRect(ARENA.x0 - 4, ARENA.y0, 4, ah); g.fillRect(ARENA.x1, ARENA.y0, 4, ah);
    g.fillStyle = '#ffffff55'; g.fillRect(ARENA.x0, ARENA.y0, aw, 2); g.fillRect(ARENA.x0, ARENA.y1 - 2, aw, 2); g.fillRect(ARENA.x0, ARENA.y0, 2, ah); g.fillRect(ARENA.x1 - 2, ARENA.y0, 2, ah);
    return c;
  },
  sprite(key, x, y, ang, scale, flash) {
    const c = Sprites.rot(key, ang || 0, flash), n = c.width * (scale || 2);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(c, snap(x) - n / 2, snap(y) - n / 2, n, n);
  },
  render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    if (this.mode !== 'fight' && this.mode !== 'clear' || !this.C) { this.renderIdle(); return; }
    const C = this.C, P = this.P, run = this.run, p = C.p, clan = CLANS[run.clan], ac = ACT_COL[areaOf(run.act)];
    const cx = snap(C.cam.x), cy = snap(C.cam.y);
    ctx.drawImage(C.floor, cx, cy, W, H, 0, 0, W, H);
    const sx = C.shake > 0.3 ? snap(rnd(-C.shake, C.shake)) : 0, sy = C.shake > 0.3 ? snap(rnd(-C.shake, C.shake)) : 0;
    ctx.translate(sx - cx, sy - cy);
    for (const q of C.pillars) drawObstacle(ctx, q, run.act);
    // zones
    for (const z of C.zones) { ctx.globalAlpha = 0.45; const d = Sprites.disc(Math.round(z.r / 4) * 4, z.col), o = d.width / 2; ctx.drawImage(d, snap(z.x - o), snap(z.y - o)); ctx.globalAlpha = 0.8; pxRing(z.x, z.y, z.r, z.col, 2); ctx.globalAlpha = 1; }
    // hazards (telegraphs)
    for (const h of C.haz) {
      if (h.quick) continue;
      const k = 1 - h.t / (h.max || 1), col = h.friendly ? '#ff8a1f' : '#ff2d3d', hl = h.friendly ? '#ffd91f' : '#ff9aa6';
      ctx.globalAlpha = 0.25 + 0.35 * k; const d = Sprites.disc(Math.round(h.r / 4) * 4, col), o = d.width / 2; ctx.drawImage(d, snap(h.x - o), snap(h.y - o));
      ctx.globalAlpha = 1; pxRing(h.x, h.y, h.r, col, 2); pxRing(h.x, h.y, Math.max(4, h.r * k), hl, 2);
    }
    for (const bm of C.beams) {
      const x2 = bm.x + Math.cos(bm.a) * bm.len, y2 = bm.y + Math.sin(bm.a) * bm.len;
      if (bm.tele > 0) { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(C.t * 30); pxLine(bm.x, bm.y, x2, y2, 2, '#ff4a6a'); ctx.globalAlpha = 1; }
      else { pxLine(bm.x, bm.y, x2, y2, 14, '#ff4a6a'); pxLine(bm.x, bm.y, x2, y2, 6, '#ffffff'); }
    }
    for (const m of C.markers) { const k = 1 - m.t / m.max; ctx.globalAlpha = 0.25 + 0.55 * k; this.sprite('e:' + m.type, m.x, m.y, k * 6, 2); ctx.globalAlpha = 1; pxRing(m.x, m.y, 18 * (1.4 - 0.4 * k), ENEMY[m.type].col, 2); }
    // pickups
    for (const g of C.gold) {
      const x = snap(g.x), y = snap(g.y);
      if (g.heal) { ctx.fillStyle = '#39ff6e'; ctx.fillRect(x - 6, y - 2, 12, 4); ctx.fillRect(x - 2, y - 6, 4, 12); ctx.fillStyle = '#e6fdff'; ctx.fillRect(x - 2, y - 2, 4, 4); }
      else { const s = g.v > 8 ? 4 : 3; ctx.fillStyle = '#ffd91f'; ctx.fillRect(x - s, y - s, s * 2, s * 2); ctx.fillStyle = '#fff3a0'; ctx.fillRect(x - s, y - s, s * 2, 2); ctx.fillRect(x - s, y - s, 2, s * 2); ctx.fillStyle = '#a07a00'; ctx.fillRect(x + s - 2, y - s + 2, 2, s * 2 - 2); ctx.fillRect(x - s + 2, y + s - 2, s * 2 - 2, 2); }
    }
    // turrets
    for (const t of C.turrets) { const x = snap(t.x), y = snap(t.y); pxLine(t.x, t.y, t.x + Math.cos(t.a || 0) * 16, t.y + Math.sin(t.a || 0) * 16, 6, t.col); ctx.fillStyle = t.col; ctx.fillRect(x - 8, y - 8, 16, 16); ctx.fillStyle = '#0a0f26'; ctx.fillRect(x - 6, y - 6, 12, 12); ctx.fillStyle = '#e6fdff'; ctx.fillRect(x - 2, y - 2, 4, 4); }
    this.drawWorldObjs(C);
    // enemies
    for (const e of C.en) this.drawEnemy(e, p);
    this.drawLight(C, p);
    // projectiles
    for (const b of C.pb) { const R = Math.max(2, Math.round(b.r / 2) + 1), o = Sprites.orb(R, b.col); ctx.drawImage(o, snap(b.x) - o.width, snap(b.y) - o.width, o.width * 2, o.width * 2); }
    for (const b of C.eb) { const R = Math.max(2, Math.round(b.r / 2) + 1), o = Sprites.orb(R, '#ff4a4a'); ctx.drawImage(o, snap(b.x) - o.width, snap(b.y) - o.width, o.width * 2, o.width * 2); }
    // blades
    if (C.bladePos) for (const [bx, by, a] of C.bladePos) { ctx.save(); ctx.translate(snap(bx), snap(by)); ctx.rotate(a * 2); ctx.drawImage(Sprites.blade(clan.color), -11, -11, 22, 22); ctx.restore(); }
    C.bladePos = null;
    this.drawPlayer(p, clan);
    // fx
    for (const f of C.fx) {
      const k = f.t / (f.max || 0.2); ctx.globalAlpha = Math.max(0.2, k);
      if (f.k === 'ring') pxRing(f.x, f.y, f.r * (1 - k * 0.3), f.col, k > 0.5 ? 4 : 2);
      else if (f.k === 'arc') pxArc(f.x, f.y, f.r * 0.85, f.a - f.arc / 2, f.a + f.arc / 2, k > 0.5 ? 6 : 4, f.col);
      else if (f.k === 'lance') pxLine(f.x1, f.y1, f.x2, f.y2, Math.max(2, Math.round(f.w * k / 2) * 2), f.col);
      else if (f.k === 'line') pxLine(f.x1, f.y1, f.x2, f.y2, f.w ? Math.round(f.w / 2) * 2 : 2, f.col);
      ctx.globalAlpha = 1;
    }
    for (const q of C.parts) { ctx.globalAlpha = clamp(q.t / q.max * 1.5, 0, 1); ctx.fillStyle = q.col; const s = q.s >= 2.6 ? 4 : 2; ctx.fillRect(snap(q.x), snap(q.y), s, s); }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const f of C.fl) { ctx.globalAlpha = clamp(f.t * 2, 0, 1); ctx.font = Math.round(14 * f.sc / 2) * 2 + 'px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText(f.txt, snap(f.x) + 2, snap(f.y) + 2); ctx.fillStyle = f.col; ctx.fillText(f.txt, snap(f.x), snap(f.y)); }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // crosshair
    { const x = snap(Input.mx), y = snap(Input.my); ctx.fillStyle = '#e6fdff'; ctx.fillRect(x - 12, y - 1, 8, 2); ctx.fillRect(x + 4, y - 1, 8, 2); ctx.fillRect(x - 1, y - 12, 2, 8); ctx.fillRect(x - 1, y + 4, 2, 8); ctx.fillStyle = '#3de8ff'; ctx.fillRect(x - 1, y - 1, 2, 2); }
    this.drawHud(clan);
    if (this.fade) { const t = this.fade.t, a = t < 0.25 ? t / 0.25 : Math.max(0, (0.5 - t) / 0.25); ctx.fillStyle = 'rgba(0,0,0,' + clamp(a, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
  },
  drawLight(C, p) {
    const B = BIOME[areaOf(this.run.act)];
    Light.begin(B.amb, B.tint, C.safe);
    Light.add(p.x, p.y, 250, 0.3);
    for (const b of C.pb) Light.add(b.x, b.y, 46, 0.25);
    for (const b of C.eb) Light.add(b.x, b.y, 40, 0.2);
    for (const t of C.turrets) Light.add(t.x, t.y, 80, 0.25);
    for (const f of C.fx) if (f.k === 'ring') Light.add(f.x, f.y, Math.min(f.r, 200) * 0.9, 0.25 * clamp(f.t / (f.max || 0.2), 0, 1));
    for (const e of C.en) { if (e.boss) Light.add(e.x, e.y, 160, 0.25); else if (e.elite) Light.add(e.x, e.y, 60, 0.2); }
    for (const z of C.zones) Light.add(z.x, z.y, z.r, 0.15);
    for (const h of C.haz) if (!h.quick) Light.add(h.x, h.y, h.r, 0.2);
    for (const m of C.markers) Light.add(m.x, m.y, 50, 0.2);
    if (C.orb) Light.add(C.orb.x, C.orb.y, 120, 0.3);
    if (C.doorsOpen) (C.doors || []).forEach((d, i) => Light.add(this.doorX(i, C.doors.length), ARENA.y0 + 10, 100, 0.3));
    if (C.obj) Light.add(C.obj.x, C.obj.y, C.obj.kind === 'rest' && !C.obj.used ? 240 : 130, 0.3);
    Light.end(ctx);
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, rgb, a) => { for (const k of [1, 0.66, 0.33]) { ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')'; ctx.beginPath(); ctx.arc(x, y, r * k, 0, 6.283); ctx.fill(); } };
    if (C.obj && C.obj.kind === 'rest' && !C.obj.used) glow(C.obj.x, C.obj.y, 200, '255,130,30', 0.05);
    if (C.obj && C.obj.kind === 'curse' && !C.obj.used) glow(C.obj.x, C.obj.y, 120, '255,61,232', 0.05);
    if (C.obj && C.obj.kind === 'event' && !C.obj.used) glow(C.obj.x, C.obj.y, 120, '178,75,255', 0.05);
    if (C.orb) glow(C.orb.x, C.orb.y, 90, '120,160,255', 0.06);
    for (const e of C.en) if (e.boss) glow(e.x, e.y, 120, '255,60,40', 0.04);
    ctx.globalCompositeOperation = 'source-over';
    // drifting dust / embers / spores
    ctx.fillStyle = DUST_COL[areaOf(this.run.act)];
    ctx.globalAlpha = 0.35; for (const d of C.dust) ctx.fillRect(snap(d.x), snap(d.y), 2, 2); ctx.globalAlpha = 1;
  },
  drawWorldObjs(C) {
    const DI = { fight: ['FIGHT', '#ff6a6a'], elite: ['ELITE', '#ff8a1f'], shop: ['SHOP', '#ffd91f'], rest: ['REST', '#39ff6e'], event: ['ALTAR', '#b24bff'], curse: ['CURSE', '#ff3de8'], boss: ['BOSS', '#ff2d3d'], exit: ['EXIT / DESCEND', '#39ff6e'] };
    const ds = C.doors || [];
    ctx.textAlign = 'center';
    ds.forEach((d, i) => {
      const x = snap(this.doorX(i, ds.length)), y = ARENA.y0 - 8, [label, col] = DI[d.type] || ['?', '#fff'], open = C.doorsOpen, c = open ? col : '#4a4d55';
      ctx.fillStyle = '#000'; ctx.fillRect(x - 36, y - 2, 72, 36);
      ctx.fillStyle = c; ctx.fillRect(x - 32, y, 64, 32); ctx.fillStyle = open ? '#05060f' : '#15171c'; ctx.fillRect(x - 28, y + 4, 56, 28);
      if (open) { ctx.fillStyle = col; ctx.globalAlpha = 0.25 + 0.15 * Math.sin(C.t * 4 + i); ctx.fillRect(x - 28, y + 4, 56, 28); ctx.globalAlpha = 1; for (let k = 0; k < 3; k++) ctx.fillRect(x - 20 + k * 14, y + 8, 2, 20); }
      else { ctx.fillStyle = '#4a4d55'; ctx.fillRect(x - 6, y + 14, 12, 10); ctx.fillRect(x - 3, y + 8, 6, 8); }
      ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText(label, x + 1, y + 49); ctx.fillStyle = open ? col : '#777'; ctx.fillText(label, x, y + 48);
      if (d.reward) { ctx.font = '8px Silk, monospace'; ctx.fillStyle = open ? '#e6fdff' : '#666'; ctx.fillText(d.reward.toUpperCase(), x, y + 60); }
    });
    if (C.orb) {
      const rc = { common: '#9fb4c8', rare: '#3d9bff', epic: '#b24bff' }[C.orb.reward.min] || '#9fb4c8', o = C.orb, b = Math.sin(C.t * 3) * 3;
      pxRing(o.x, o.y + b, 22 + Math.sin(C.t * 5) * 2, rc, 2);
      const sp = Sprites.orb(5, rc); ctx.drawImage(sp, snap(o.x) - 22, snap(o.y + b) - 22, 44, 44);
      ctx.font = '10px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText('REWARD', snap(o.x) + 1, o.y - 31); ctx.fillStyle = rc; ctx.fillText('REWARD', snap(o.x), o.y - 32);
    }
    const o = C.obj;
    if (o) {
      const x = snap(o.x), y = snap(o.y), t = C.t, used = o.used;
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 30, y + 18, 64, 10);
      if (o.kind === 'shop') { ctx.fillStyle = '#5a3a1c'; ctx.fillRect(x - 32, y - 6, 64, 28); ctx.fillStyle = '#8a5a2c'; ctx.fillRect(x - 32, y - 6, 64, 6); for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#c9302c' : '#e8e2d0'; ctx.fillRect(x - 32 + k * 8, y - 26, 8, 16); } ctx.fillStyle = '#ffd91f'; ctx.fillRect(x - 12, y, 6, 6); ctx.fillRect(x - 2, y + 2, 6, 6); ctx.fillRect(x + 8, y, 6, 6); }
      else if (o.kind === 'rest') { ctx.fillStyle = '#3a2410'; ctx.fillRect(x - 20, y + 8, 40, 8); ctx.fillRect(x - 14, y + 2, 28, 8); if (!used) { for (let k = 0; k < 5; k++) { const h = 14 + Math.sin(t * 9 + k * 2) * 6 - Math.abs(k - 2) * 4; ctx.fillStyle = k === 2 ? '#ffe08a' : '#ff8a1f'; ctx.fillRect(x - 10 + k * 4, y - h + 6, 4, h); } } else { ctx.fillStyle = '#555'; ctx.fillRect(x - 6, y, 12, 4); } }
      else if (o.kind === 'event') { ctx.fillStyle = '#2a2f3a'; ctx.fillRect(x - 16, y - 2, 32, 22); ctx.fillStyle = '#4a5060'; ctx.fillRect(x - 16, y - 2, 32, 4); ctx.fillRect(x - 20, y + 16, 40, 6); if (!used) { for (let k = 0; k < 3; k++) { const h = 12 + Math.sin(t * 8 + k * 2) * 5; ctx.fillStyle = k === 1 ? '#e0b0ff' : '#b24bff'; ctx.fillRect(x - 6 + k * 6, y - 2 - h, 6, h); } } }
      else if (o.kind === 'curse') { ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 12, y - 30, 24, 54); ctx.fillStyle = used ? '#444' : '#ff3de8'; ctx.fillRect(x - 12, y - 30, 24, 2); ctx.fillRect(x - 12, y - 30, 2, 54); ctx.fillRect(x - 4, y - 14, 8, 2); ctx.fillRect(x - 2, y - 18, 4, 14); ctx.fillRect(x - 6, y, 12, 2); }
      if (C.near === o) { const txt = '[E] ' + { shop: 'TRADE', rest: 'REST', event: 'PRAY', curse: 'TOUCH THE STONE' }[o.kind]; ctx.font = '12px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText(txt, x + 1, y - 41); ctx.fillStyle = '#ffd91f'; ctx.fillText(txt, x, y - 42); }
    }
    ctx.textAlign = 'left';
  },
  drawPlayer(p, clan) {
    const C = this.C;
    if (p.inv > 0 && Math.floor(C.t * 20) % 2 === 0 && p.dashT <= 0) ctx.globalAlpha = 0.45;
    if (p.shield > 0) pxRing(p.x, p.y, 22, '#ffe94a', 2);
    if (p.over > 0) pxRing(p.x, p.y, 19, '#ffd91f', 2);
    this.sprite(this.run.hero, p.x, p.y, p.aim, 2, p.flash > 0); if (kitOf(this.run).weapon.art) this.drawArtWeapon(p);
    ctx.globalAlpha = 1;
  },
  drawEnemy(e, p) {
    const C = this.C, ang = Math.atan2(p.y - e.y, p.x - e.x), fl = e.flash > 0;
    if (e.spawnT > 0) ctx.globalAlpha = 0.5;
    if (e.elite) pxRing(e.x, e.y, e.r + 7, ELITE_MODS[e.elite].col, 2);
    if (e.sh > 0) pxRing(e.x, e.y, e.r + 3, '#3de8ff', 2);
    if (e.slow > 0) pxRing(e.x, e.y, e.r + 1, '#6aa8ff', 2);
    if (e.poisonT > 0) { ctx.fillStyle = '#7dff4a'; ctx.fillRect(snap(e.x) - 4, snap(e.y - e.r - 10), 4, 4); }
    if (e.burnT > 0) { ctx.fillStyle = '#ff8a1f'; ctx.fillRect(snap(e.x) + 2, snap(e.y - e.r - 10), 4, 4); }
    if (e.type === 'boss') {
      const fa = e.pat === 'charge' && e.pt > 0.9 ? e.ang : ang;
      if (e.pat === 'charge' && e.pt < 0.9) { ctx.globalAlpha = 0.3 + 0.3 * Math.sin(C.t * 30); pxLine(e.x, e.y, e.x + Math.cos(e.ang) * 900, e.y + Math.sin(e.ang) * 900, Math.round(e.r / 2) * 2, '#ff3a3a'); ctx.globalAlpha = 1; }
      this.sprite('b:' + areaOf(this.run.act), e.x, e.y, fa, 2, fl);
    } else {
      let fa = ang;
      if (e.type === 'dasher' && e.state !== 'move') fa = e.ang;
      if (e.type === 'dasher' && e.state === 'aim') { ctx.globalAlpha = 0.3 + 0.3 * Math.sin(C.t * 30); pxLine(e.x, e.y, e.x + Math.cos(e.ang) * 330, e.y + Math.sin(e.ang) * 330, 12, '#ff8a1f'); ctx.globalAlpha = 1; }
      if (e.type === 'shooter' && e.wind > 0) { ctx.globalAlpha = 0.5; pxLine(e.x, e.y, e.x + Math.cos(ang) * 400, e.y + Math.sin(ang) * 400, 2, '#ffd91f'); ctx.globalAlpha = 1; }
      if (e.type === 'bomber' && e.state === 'fuse') { pxRing(e.x, e.y, 76, 'rgba(255,100,120,.7)', 2); if (Math.floor(C.t * 14) % 2) fa += 0; }
      const sc = e.type === 'bomber' && e.state === 'fuse' ? 2 : 2;
      this.sprite('e:' + e.type, e.x, e.y, fa, sc, fl || (e.type === 'bomber' && e.state === 'fuse' && Math.floor(C.t * 14) % 2 === 0));
    }
    ctx.globalAlpha = 1;
    if (!e.boss && e.hp < e.maxhp) { const x = snap(e.x) - 12, y = snap(e.y - e.r - 8); ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 2, 28, 6); ctx.fillStyle = e.elite ? ELITE_MODS[e.elite].col : '#ff5a5a'; ctx.fillRect(x, y, 24 * clamp(e.hp / e.maxhp, 0, 1), 2); }
  },
  drawHud(clan) {
    const C = this.C, P = this.P, run = this.run, p = C.p, w = kitOf(run);
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, 50);
    ctx.strokeStyle = '#1f7fc8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(W, 50); ctx.stroke();
    // HP
    const hp = clamp(run.hp / P.maxhp, 0, 1);
    this.drawHearts(14, 7, run.hp, P.maxhp);
    ctx.font = '12px Silk, monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; 
    // dash / ability pips
    const dk = p.dashCd > 0 ? 1 - p.dashCd / (1.0 * P.dashCd) : 1, ak = p.abT > 0 ? 1 - p.abT / (w.ability.cd * P.abCd) : 1;
    pxBar(14, 32, 110, 10, dk, dk >= 1 ? '#3de8ff' : '#2a6a80'); pxBar(134, 32, 110, 10, ak, ak >= 1 ? clan.color : '#555');
    ctx.font = '9px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillStyle = '#fff'; ctx.fillText('DASH', 20, 41); ctx.fillText(w.ability.name.toUpperCase().slice(0, 12), 140, 41);
    // center info
    ctx.textAlign = 'center'; ctx.font = '12px Silk, monospace'; ctx.fillStyle = '#9fc'; ctx.fillText(this.levelLabel ? this.levelLabel() : '', W / 2, 18);
    ctx.fillStyle = '#fff'; ctx.fillText(HEROES[run.hero].name.toUpperCase() + ' / ' + w.weapon.name.toUpperCase(), W / 2, 36);
    if (this.drawWeaponHud) this.drawWeaponHud();
    ctx.textAlign = 'right'; ctx.font = '14px Silk, monospace'; ctx.fillStyle = '#ffd91f'; ctx.fillText('GOLD ' + run.gold, W - 14, 20);
    ctx.fillStyle = '#3de8ff'; ctx.font = '11px Silk, monospace'; ctx.fillText('CORES ' + run.cores + ' (AT RISK)', W - 14, 38);
    // tags
    ctx.textAlign = 'left'; ctx.font = '10px Silk, monospace'; let tx = 14;
    for (const t of Object.keys(P.tags)) {
      const n = P.tags[t], act = SYN[t] && n >= SYN[t].n;
      ctx.fillStyle = TAGS[t]; ctx.globalAlpha = act ? 1 : 0.7; const s = t.toUpperCase() + ' ' + n + (SYN[t] ? '/' + SYN[t].n : ''); ctx.fillText(s + (act ? '*' : ''), tx, H - 8); tx += ctx.measureText(s).width + 20; ctx.globalAlpha = 1;
    }
    if (C.curse && C.curse.name) { ctx.textAlign = 'right'; ctx.fillStyle = '#ff3de8'; ctx.fillText('CURSE: ' + C.curse.name.toUpperCase(), W - 14, H - 8); }
    // boss bar
    if (C.boss && !C.boss.dead) {
      const b = C.boss; pxBar(220, 58, 520, 16, b.hp / b.maxhp, b.col); ctx.textAlign = 'center'; ctx.font = '11px Silk, monospace'; ctx.fillStyle = '#fff'; ctx.fillText(b.name.toUpperCase(), W / 2, 88);
    }
    if (C.banner > 0) { ctx.globalAlpha = clamp(C.banner, 0, 1); ctx.textAlign = 'center'; ctx.font = '30px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText(C.bannerText, W / 2 + 2, 262); ctx.fillStyle = '#fff'; ctx.fillText(C.bannerText, W / 2, 260); ctx.globalAlpha = 1; }
    if (C.clearMsg > 0) { ctx.textAlign = 'center'; ctx.font = '26px Silk, monospace'; ctx.fillStyle = '#000'; ctx.fillText('ARENA CLEARED', W / 2 + 2, 262); ctx.fillStyle = '#d8d2c0'; ctx.fillText('ARENA CLEARED', W / 2, 260); }
    if (C.dead) { ctx.fillStyle = 'rgba(80,0,0,.5)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.font = '40px Silk, monospace'; ctx.fillStyle = '#ff2d3d'; ctx.fillText('YOU DIED', W / 2, 270); }
    if (this.paused) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 50, W, H); ctx.textAlign = 'center'; ctx.font = '30px Silk, monospace'; ctx.fillStyle = '#fff'; ctx.fillText('PAUSED  [P]', W / 2, 270); }
    ctx.textAlign = 'left';
    ctx.font = '10px Silk, monospace'; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.textAlign = 'right'; if (C.t < 25) ctx.fillText('WASD MOVE  MOUSE SHOOT  SPACE SWAP WEAPON  RMB ABILITY  SHIFT DASH  E PICK UP', W - 10, H - 50);
    ctx.textAlign = 'left';
  },
  renderIdle() {
    Menu.draw(ctx); return;
    this.menuT += 0.016;
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#101d3d'; ctx.lineWidth = 1;
    const o = (this.menuT * 12) % 40;
    for (let x = -40 + o; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = -40 + o; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  },

  // ================= loop =================
  frame(now) {
    const dt = Math.min(0.033, (now - this.last) / 1000 || 0.016); this.last = now;
    if (this.fade) { const f = this.fade; f.t += dt; if (f.t >= 0.25 && !f.done) { f.done = true; f.fn(); } if (f.t >= 0.5) this.fade = null; }
    if (this.C && this.C.hitstop > 0) this.C.hitstop -= dt;
    else if (this.mode === 'fight' && this.C && !this.paused && !this.frozen) this.update(dt);
    this.render();
    requestAnimationFrame(t => this.frame(t));
  },
  togglePause() {
    if (this.mode !== 'fight' || !this.C || this.C.dead) return;
    this.paused = !this.paused;
    if (this.paused) UI.pause(); else { UI.hide(); document.body.classList.add('fight'); }
  },
};

// ---------- input ----------
addEventListener('keydown', e => {
  Sfx.init();
  const k = e.key.toLowerCase();
  if (e.target && e.target.tagName === 'INPUT') return;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'backspace'].includes(k)) e.preventDefault();
  Input.keys[k] = true;
  if (k === 'p' || k === 'backspace') Game.togglePause();
  if (k === 'f' && Game.mode === 'fight') Input.auto = !Input.auto;
  if (k === 'e') Game.interact();
  if (k === 'm') Music.toggle();
  if ((k === 'x' || k === ' ') && !e.repeat && Game.swapWeapons) Game.swapWeapons();
  if (Game.mode !== 'fight' && UI.nav) UI.nav(k);
  if (['1', '2', '3', '4', '5'].includes(k) && UI.hotkey) UI.hotkey(+k - 1);
});
addEventListener('keyup', e => { Input.keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { Input.keys = {}; Input.down = false; });
function mapMouse(e) { const r = cv.getBoundingClientRect(); Input.mx = (e.clientX - r.left) / r.width * W; Input.my = (e.clientY - r.top) / r.height * H; }
addEventListener('mousemove', mapMouse);
addEventListener('mousedown', e => { Sfx.init(); mapMouse(e); if (e.target === cv || e.target.id === 'ui' || e.target.id === 'stage') { if (e.button === 0) Input.down = true; if (e.button === 2) Input.rdown = true; } });
addEventListener('mouseup', e => { if (e.button === 0) Input.down = false; if (e.button === 2) Input.rdown = false; });
addEventListener('contextmenu', e => { if (Game.mode === 'fight') e.preventDefault(); });
function fit() { const s = Math.min(innerWidth / W, innerHeight / H); document.getElementById('stage').style.transform = 'translate(-50%,-50%) scale(' + s + ')'; }
addEventListener('resize', fit); fit();
requestAnimationFrame(t => { Game.last = t; Game.frame(t); });
try { window.parent !== window && window.parent.postMessage({ type: 'ready' }, '*'); } catch (e) { /* ignore */ }
