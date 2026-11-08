// Menus and between-room screens (DOM overlay on top of the canvas).
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const UI = {
  el: document.getElementById('ui'),
  keyActs: [],
  tab: 'run',
  show(html, cls) {
    this.navMode = null;
    document.body.classList.remove('fight'); Music.play('menu');
    if (Save.data) this.el.style.setProperty('--acc', CLANS[Save.data.clan].color);
    else this.el.style.setProperty('--acc', '#d89a3a');
    this.el.innerHTML = '<div class="screen ' + (cls || '') + (Game.mode === 'fight' ? '' : ' scene') + '">' + html + '</div>';
  },
  hide() { this.el.innerHTML = ''; this.keyActs = []; },
  hotkey(i) { if (this.keyActs[i]) this.keyActs[i](); },
  acts(...fns) { this.keyActs = fns; },

  // ---------- title / account ----------
  title(msg) {
    Menu.set('title');
    Save.data = null; Save.slot = -1;
    const on = Account.on, conf = Account.configured;
    let h = '<div class="logo"><div class="l1">DEATH ARENA</div><div class="l2">APOCALYPSE</div><div class="dim sm" style="margin-top:8px">The world burned. The arenas did not.</div></div><div class="menu">';
    if (on) h += '<button class="mbtn" data-nav onclick="UI.slots()">PLAY</button>';
    else if (conf) h += '<div><input id="an" placeholder="Name" maxlength="20" autocomplete="username"><input id="ap" type="password" placeholder="Password" autocomplete="current-password"></div><div class="row"><button class="btn" onclick="UI.auth(false)">LOG IN</button><button class="btn" onclick="UI.auth(true)">CREATE ACCOUNT</button></div><button class="mbtn" data-nav onclick="Account.guest=true;UI.slots()">PLAY AS GUEST</button>';
    else h += '<button class="mbtn" data-nav onclick="Account.guest=true;UI.slots()">PLAY</button>';
    h += '<button class="mbtn" data-nav onclick="UI.controls()">CONTROLS</button>';
    h += '<button class="mbtn" data-nav onclick="Music.toggle();UI.title()">MUSIC: ' + (Music.on ? 'ON' : 'OFF') + '</button>';
    if (on) h += '<button class="mbtn" data-nav onclick="Account.signOut();UI.title()">LOG OUT (' + esc(Account.meta.name) + ')</button>';
    h += '</div><div class="err" id="aerr">' + esc(msg || '') + '</div>';
    h += '<div class="lineup">' + PLAYABLE.map((id, i) => '<img src="' + Sprites.url(id) + '" style="animation-delay:' + (i * 0.25) + 's">').join('') + '</div>';
    this.show(h); this.navMode = 'menu'; this.focusFirst();
  },
  controls() {
    Menu.set('title');
    const rows = [['WASD', 'Move'], ['Mouse', 'Aim, hold to shoot'], ['Space / X', 'Swap weapon'], ['Right mouse / Q', 'Character ability'], ['E', 'Pick up weapon / use'], ['F', 'Auto-fire'], ['P / Backspace', 'Pause'], ['M', 'Music']];
    this.show('<div class="logo"><div class="l1" style="font-size:26px">CONTROLS</div></div><table style="font-size:16px;margin-top:14px">' + rows.map(r => '<tr><td style="color:var(--amber);font-family:Silk;text-align:right;padding-right:18px">' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table><div class="menu"><button class="mbtn" data-nav onclick="UI.title()">BACK</button></div>');
    this.navMode = 'menu'; this.focusFirst();
  },
  focusFirst() { const b = this.el.querySelector('[data-nav]'); if (b) b.focus(); },
  nav(k) {
    if (this.navMode === 'select') {
      const i = PLAYABLE.indexOf(this.selId);
      if (k === 'arrowright' || k === 'd') this.selectChar(PLAYABLE[(i + 1) % PLAYABLE.length]);
      else if (k === 'arrowleft' || k === 'a') this.selectChar(PLAYABLE[(i + PLAYABLE.length - 1) % PLAYABLE.length]);
      else if (k === 'enter') this.startFromSelect();
      return;
    }
    if (this.navMode !== 'menu') return;
    const items = [...this.el.querySelectorAll('[data-nav]')]; if (!items.length) return;
    let i = items.indexOf(document.activeElement);
    if (k === 'arrowdown' || k === 's') i = (i + 1) % items.length; else if (k === 'arrowup' || k === 'w') i = (i - 1 + items.length) % items.length; else return;
    items[i].focus();
  },
  async auth(create) {
    const n = document.getElementById('an').value.trim(), p = document.getElementById('ap').value, e = document.getElementById('aerr');
    e.textContent = 'Please wait...';
    const r = create ? await Account.signUp(n, p) : await Account.signIn(n, p);
    if (!r.ok) { e.textContent = r.error; return; }
    this.slots();
  },

  // ---------- slots ----------
  async slots() {
    Menu.set('slots');
    Save.data = null; Save.slot = -1; this.hide();
    this.show('<h2>LOADING...</h2>');
    await Save.sync();
    let h = '<h2>CHOOSE A SAVE SLOT</h2><div class="row" style="margin-top:20px">';
    for (let i = 0; i < 3; i++) {
      const d = Save.readLocal(i);
      if (!d) h += '<div class="card slot" onclick="UI.clanSelect(' + i + ')" style="--c:#345"><h3>SLOT ' + (i + 1) + '</h3><p class="dim">Empty</p><p style="margin-top:50px;text-align:center"><span class="btn">NEW GAME</span></p></div>';
      else {
        const c = CLANS[d.clan];
        h += '<div class="card slot" style="--c:' + c.color + '" onclick="UI.openSlot(' + i + ')"><h3 style="color:' + c.color + '">WASTELAND</h3><p class="sm dim">Slot ' + (i + 1) + '</p><table>'
          + '<tr><td>Cores</td><td>' + d.cores + '</td></tr><tr><td>Runs</td><td>' + d.stats.runs + ' (' + d.stats.wins + ' won)</td></tr><tr><td>Best act</td><td>' + (d.stats.bestAct || '-') + '</td></tr><tr><td>Max heat</td><td>' + d.heatMax + '</td></tr></table>'
          + (d.run ? '<p class="pro sm">Run in progress</p>' : '') + '<p style="text-align:center;margin-top:10px"><span class="btn">PLAY</span> <span class="btn red" onclick="event.stopPropagation();UI.delSlot(' + i + ')">DELETE</span></p></div>';
      }
    }
    h += '</div><div class="row" style="margin-top:20px"><button class="btn" onclick="UI.title()">BACK</button></div>';
    this.show(h);
  },
  delSlot(i) { if (confirm('Delete this save slot permanently?')) Save.remove(i).then(() => this.slots()); },
  openSlot(i) { Save.open(i); this.hub(); },
  clanSelect(slot) {
    Menu.set('slots');
    let h = '<h2>CHOOSE YOUR CLAN</h2><p class="dim sm">This decides your heroes for this save slot.</p><div class="row" style="margin-top:10px">';
    for (const [id, c] of Object.entries(CLANS)) {
      const hs = Object.values(HEROES).filter(x => x.clan === id).map(x => x.name).join(', ');
      h += '<div class="card" style="--c:' + c.color + ';width:172px;min-height:300px" onclick="UI.newGame(' + slot + ",'" + id + '\')"><h3 style="color:' + c.color + '">' + c.name.toUpperCase() + '</h3><p class="sm">' + c.blurb + '</p><p class="pro sm">+ ' + c.pro + '</p><p class="con sm">- ' + c.con + '</p><div style="margin-top:6px">' + Object.keys(HEROES).filter(k => HEROES[k].clan === id).map(k => '<img src="' + Sprites.url(k) + '" style="width:32px;height:32px;image-rendering:pixelated">').join('') + '</div><p class="sm dim">Heroes: ' + hs + '</p></div>';
    }
    h += '</div><div class="row"><button class="btn" onclick="UI.slots()">BACK</button></div>';
    this.show(h);
  },
  newGame(slot, clan) { Save.create(slot, clan); this.tab = 'run'; this.hub(); },

  // ---------- hub ----------
  hub(tab) {
    if (tab) this.tab = tab;
    const s = Save.data, c = CLANS[s.clan];
    for (const id of PLAYABLE) if (!s.heroes[id]) { s.heroes[id] = 1; Save.write(true); }   // every hero is selectable from the start Menu.set('hub', s.clan, s.hero);
    let h = '<div class="row" style="justify-content:space-between;align-items:center"><div><h1 style="margin:0;font-size:26px">WASTELAND CAMP</h1><span class="sm dim">Slot ' + (Save.slot + 1) + '</span></div>'
      + '<div style="text-align:right"><div style="font-family:Silk;color:#3de8ff">CORES ' + s.cores + '</div><button class="btn" onclick="UI.slots()">SAVE SLOTS</button></div></div>';
    h += '<div class="tabs">' + [].map(t => '<button class="btn ' + (this.tab === t[0] ? 'sel' : '') + '" onclick="UI.hub(\'' + t[0] + '\')">' + t[1] + '</button>').join('') + '</div>';
    if (this.tab === 'run') {
      h += this.selectHtml(s);
    } else if (this.tab === 'hero') {
      h += this.heroTab(s, c);
    } else if (this.tab === 'armory') {
      h += '<p class="sm dim">Unlock new perks. They join the pool of rewards for every run of this slot.</p><div class="row">';
      const ids = Object.keys(PERKS).filter(id => PERKS[id].lock && (!PERKS[id].clan || PERKS[id].clan === s.clan));
      for (const id of ids) {
        const pk = PERKS[id], own = !!s.perks[id];
        h += '<div class="card rar-' + pk.r + ' ' + (own ? '' : 'locked') + '" style="width:200px;min-height:130px" onclick="UI.unlockPerk(\'' + id + '\')"><h3>' + pk.name + '</h3>' + this.tags(pk.tags) + '<p class="sm">' + pk.d + '</p><p class="sm ' + (own ? 'pro' : '') + '">' + (own ? 'Unlocked' : 'Unlock: ' + pk.lock + ' cores') + '</p></div>';
      }
      h += '</div>';
    } else if (this.tab === 'upgrades') {
      h += '<p class="sm dim">Small permanent bonuses with a hard cap. New options matter more than raw numbers.</p><div class="row">';
      for (const [id, u] of Object.entries(META_UPS)) {
        const l = s.meta[id] || 0, max = l >= u.max;
        h += '<div class="card" style="width:200px;min-height:130px" onclick="UI.buyMeta(\'' + id + '\')"><h3>' + u.name + '</h3><p class="sm">' + u.d + '</p><p class="sm">Level ' + l + ' / ' + u.max + '</p><p class="sm">' + (max ? '<span class="pro">Maxed</span>' : 'Upgrade: ' + u.cost(l) + ' cores') + '</p></div>';
      }
      h += '</div>';
    } else {
      h += '<p style="margin-top:30px;text-align:center">The shared hub is coming:<br>see other players between runs, leaderboards and clan progress.</p><p class="dim sm">Needs the Supabase project (presence + leaderboard tables).</p>';
    }
    this.show(h); if (this.tab === 'run') this.selectInit();
  },
  // ---------- character select ----------
  heartSvg(on) {
    const pat = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    let r = ''; pat.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') r += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; }));
    return '<svg width="21" height="18" viewBox="0 0 7 6" shape-rendering="crispEdges" fill="' + (on ? '#ff3a4a' : '#3a1018') + '">' + r + '</svg>';
  },
  charHearts(id) { const s = Save.data, run = { hero: id, clan: HEROES[id].clan, perks: [], drawbacks: [], bonus: {} }; return Math.round(buildStats(run, s).maxhp / 10); },
  selectHtml(s) {
    if (!s.heroes[s.hero]) s.hero = PLAYABLE.find(id => s.heroes[id]) || PLAYABLE[0];
    let h = '<div class="cs-main"><div class="cs-stage" id="csStage"></div><div class="cs-info" id="csInfo"></div></div><div class="cs-row">';
    for (const id of PLAYABLE) h += '<div class="cs-tile" id="tile_' + id + '" data-id="' + id + '" onclick="UI.selectChar(this.dataset.id)"><img src="' + Sprites.url(id) + '"><span class="lk">?</span></div>';
    return h + '</div><div class="cs-actions" id="csActions"></div>';
  },
  selectInit() { this.navMode = 'select'; this.selectChar(Save.data.hero); },
  selectChar(id) {
    const s = Save.data, hero = HEROES[id], own = !!s.heroes[id], sw = HEROES[hero.start || id].weapon, a = ammoOf(sw), n = this.charHearts(id), u = UNLOCK[id];
    this.selId = id;
    if (own) { s.hero = id; Save.write(); Menu.set('hub', s.clan, id); }
    for (const t of PLAYABLE) { const el = document.getElementById('tile_' + t); if (el) { el.classList.toggle('sel', t === id); el.classList.toggle('locked', !s.heroes[t]); } }
    document.getElementById('csStage').innerHTML = '<div class="cs-glow"></div><img class="cs-big" src="' + Sprites.url(id) + '" style="' + (own ? '' : 'filter:brightness(0) opacity(.55)') + '"><div class="cs-name">' + esc(hero.name.toUpperCase()) + '</div>';
    let hearts = ''; for (let i = 0; i < n; i++) hearts += this.heartSvg(true);
    document.getElementById('csInfo').innerHTML = '<div class="cs-hearts">' + hearts + '</div>'
      + '<div class="cs-lab">PASSIVE</div><p>' + esc(hero.passive || '') + '</p>'
      + '<div class="cs-lab">ACTIVE [Q] ' + esc(hero.ability.name.toUpperCase()) + '</div><p>' + esc(hero.active || '') + '</p>'
      + '<div class="cs-lab">WEAPON</div><p>' + esc(sw.name) + (hero.start2 ? ' x2' : '') + ' <span style="color:' + (a ? AMMO[a].col : '#9fc') + '">(' + (a ? AMMO[a].name.toLowerCase() : 'melee') + ')</span></p>'
      + (own ? '' : '<div class="cs-lab" style="color:#ff6a6a">LOCKED</div><p>' + esc(u ? u.d + ' (' + u.prog(s) + ')' : '') + '</p>');
    let act = '';
    if (!own) act = '<button class="btn big" disabled>LOCKED</button>';
    else if (s.run) act = '<button class="btn big" onclick="Game.resume()">RESUME RUN</button><button class="btn red" onclick="if(confirm(\'Abandon the current run? You keep 25% of its cores.\')){UI.summary(Game.abandonSaved())}">ABANDON</button>';
    else act = '<button class="btn big" onclick="Game.startRun()">START</button>';
    act += '<span class="sm" style="margin-left:14px">HEAT</span>';
    for (let i = 0; i <= 5; i++) act += '<button class="btn ' + (s.heat === i ? 'sel' : '') + '" style="padding:5px 10px" ' + (i > s.heatMax ? 'disabled' : '') + ' onclick="Save.data.heat=' + i + ';UI.selectChar(UI.selId)">' + i + '</button>';
    document.getElementById('csActions').innerHTML = act;
  },
  startFromSelect() { const s = Save.data; if (!s || !s.heroes[this.selId]) return; if (s.run) Game.resume(); else Game.startRun(); },
  heroTab(s, c) {
    s.loadout = s.loadout || {}; s.tree = s.tree || {};
    const hero = HEROES[s.hero], lo = s.loadout[s.hero] || {}, wId = this.kitId(s, lo.w), aId = this.kitId(s, lo.a), tr = s.tree[s.hero] || {}, rank = treeRank(tr);
    const owned = Object.keys(HEROES).filter(k => HEROES[k].clan === s.clan && s.heroes[k]);
    let h = '<div class="row" style="margin-bottom:6px">' + owned.map(k => '<img src="' + Sprites.url(k) + '" title="' + HEROES[k].name + '" data-k="' + k + '" onclick="UI.pickHero(this.dataset.k)" style="width:44px;height:44px;image-rendering:pixelated;cursor:pointer;border:3px solid ' + (k === s.hero ? c.color : '#345') + ';padding:2px">').join('') + '</div>';
    h += '<h3 style="text-align:center;margin:4px">' + hero.name.toUpperCase() + ' <span class="dim sm">rank ' + rank + ' / ' + RANK_CAP + '</span></h3>';
    h += '<p class="sm dim" style="text-align:center;margin:2px">Loadout: mix the weapon and ability of any unlocked ' + c.name + ' hero. Your hero keeps its own passive and skill tree.</p>';
    const kit = (kind, cur) => '<div class="row" style="margin:4px 0"><span class="sm" style="width:70px;align-self:center">' + (kind === 'w' ? 'WEAPON' : 'ABILITY') + '</span>' + owned.map(k => {
      const it = kind === 'w' ? HEROES[k].weapon : HEROES[k].ability;
      return '<span class="btn ' + (k === cur ? 'sel' : '') + '" title="' + esc(HEROES[k].name) + '" data-kind="' + kind + '" data-k="' + k + '" onclick="UI.setKit(this.dataset.kind,this.dataset.k)" style="font-size:10px;padding:4px 7px">' + esc(it.name) + (kind === 'w' ? ' (' + it.type + ')' : ' (' + it.cd + 's)') + '</span>';
    }).join('') + '</div>';
    h += kit('w', wId) + kit('a', aId);
    h += '<div class="row" style="margin-top:10px;align-items:flex-start">';
    for (const br of ['Offense', 'Defense', 'Utility']) {
      h += '<div style="width:270px"><div class="sm" style="text-align:center;color:' + c.color + '">' + br.toUpperCase() + '</div>';
      for (const [id, t] of Object.entries(TREE)) {
        if (t.branch !== br) continue;
        const l = tr[id] || 0, maxed = l >= t.max, can = !maxed && rank < RANK_CAP && s.cores >= treeCost(l);
        h += '<div class="card ' + (can ? '' : 'locked') + '" style="width:auto;min-height:0;margin:4px 0;padding:8px" data-id="' + id + '" onclick="UI.treeUp(this.dataset.id)"><b>' + t.name + '</b> <span class="sm">' + '■'.repeat(l) + '□'.repeat(t.max - l) + '</span><div class="sm dim">' + t.d + '</div><div class="sm ' + (maxed ? 'pro' : '') + '">' + (maxed ? 'Maxed' : rank >= RANK_CAP ? 'Rank cap reached' : treeCost(l) + ' cores') + '</div></div>';
      }
      h += '</div>';
    }
    h += '</div><div class="row" style="margin-top:8px"><button class="btn red" ' + (rank ? '' : 'disabled') + ' onclick="UI.respec()">RESPEC (free, refunds cores)</button></div>';
    return h;
  },
  kitId(s, id) { return id && s.heroes[id] && HEROES[id].clan === s.clan ? id : s.hero; },
  setKit(kind, id) { const s = Save.data; s.loadout = s.loadout || {}; const lo = s.loadout[s.hero] = s.loadout[s.hero] || {}; lo[kind] = id; Save.write(); this.hub(); },
  treeUp(id) {
    const s = Save.data, t = TREE[id]; s.tree = s.tree || {}; const tr = s.tree[s.hero] = s.tree[s.hero] || {}, l = tr[id] || 0;
    if (l < t.max && treeRank(tr) < RANK_CAP && s.cores >= treeCost(l)) { s.cores -= treeCost(l); tr[id] = l + 1; Save.write(true); }
    this.hub();
  },
  respec() {
    const s = Save.data, tr = (s.tree || {})[s.hero] || {};
    for (const [id, l] of Object.entries(tr)) for (let i = 0; i < l; i++) s.cores += treeCost(i);
    s.tree[s.hero] = {}; Save.write(true); this.hub();
  },
  pickHero(id) {
    const s = Save.data, hero = HEROES[id];
    if (s.heroes[id]) { s.hero = id; Save.write(); }
    this.hub();
  },
  unlockPerk(id) { const s = Save.data, pk = PERKS[id]; if (!s.perks[id] && s.cores >= pk.lock) { s.cores -= pk.lock; s.perks[id] = 1; Save.write(true); } this.hub(); },
  buyMeta(id) { const s = Save.data, u = META_UPS[id], l = s.meta[id] || 0; if (l < u.max && s.cores >= u.cost(l)) { s.cores -= u.cost(l); s.meta[id] = l + 1; Save.write(true); } this.hub(); },

  // ---------- shared bits ----------
  tags(list) { return list.map(t => '<span class="tag" style="color:' + TAGS[t] + '">' + t.toUpperCase() + '</span>').join(''); },
  perkCard(id, onclick, extra, key) {
    const pk = PERKS[id], P = Game.P, hints = [];
    for (const t of pk.tags) { const n = (P.tags[t] || 0), nn = n + 1; if (SYN[t]) hints.push(t.toUpperCase() + ' ' + Math.min(nn, SYN[t].n) + '/' + SYN[t].n + (nn === SYN[t].n ? ' = ' + SYN[t].name.toUpperCase() + '!' : '')); }
    if (pk.clan) { const cn = clanPerkCount(Game.run) + 1; hints.push(pk.clan.toUpperCase() + ' MASTERY ' + Math.min(cn, CLAN_SET[pk.clan].n) + '/' + CLAN_SET[pk.clan].n + (cn === CLAN_SET[pk.clan].n ? ' = ' + CLAN_SET[pk.clan].name.toUpperCase() + '!' : '')); }
    return '<div class="card rar-' + pk.r + '" onclick="' + onclick + '">' + (key ? '<span class="dim sm" style="position:absolute;right:8px;top:6px">[' + key + ']</span>' : '') + '<h3>' + pk.name + '</h3>' + this.tags(pk.tags)
      + '<p>' + pk.d + '</p><p class="sm dim">' + hints.join(' | ') + '</p>' + (extra || '') + '</div>';
  },
  status() {
    const run = Game.run, P = Game.P;
    let h = '<div class="sm" style="width:100%;display:flex;justify-content:space-between;margin-bottom:6px"><span>HEARTS ' + Math.ceil(run.hp / 10) + '/' + Math.round(P.maxhp / 10) + '</span><span style="color:#ffd91f">GOLD ' + run.gold + '</span><span style="color:#3de8ff">CORES AT RISK ' + run.cores + '</span></div>';
    return h;
  },
  buildList() {
    const run = Game.run, P = Game.P;
    let h = '<div class="sm" style="width:100%;text-align:center;margin-top:4px">';
    for (const id of run.perks) h += '<span class="tag" title="' + esc(PERKS[id].d) + '" style="color:' + RARITY[PERKS[id].r].c + ';border:1px solid;padding:1px 5px;margin:2px;display:inline-block">' + PERKS[id].name + '</span>';
    for (const id of run.drawbacks) h += '<span class="tag con" title="' + esc(DRAWBACKS[id].d) + '" style="border:1px solid;padding:1px 5px;margin:2px;display:inline-block">' + DRAWBACKS[id].name + '</span>';
    const cs = CLAN_SET[run.clan], cn = clanPerkCount(run), syn = activeSyn(P).map(t => SYN[t].name + ': ' + SYN[t].d);
    if (cn >= cs.n) syn.push(CLANS[run.clan].name + ' mastery - ' + cs.name + ': ' + cs.d); else if (cn) h += '<div class="dim">' + CLANS[run.clan].name + ' mastery ' + cn + '/' + cs.n + '</div>';
    if (syn.length) h += '<div class="pro">Set bonus: ' + syn.join(' | ') + '</div>';
    return h + '</div>';
  },

  // ---------- rewards ----------
  reward(rw, cores) {
    let h = '<h2>ROOM CLEARED</h2><p class="dim sm">+' + cores + ' cores (at risk until you exit)</p>' + this.status();
    if (rw.kind === 'gold') {
      Game.run.gold += rw.amount;
      h += '<p style="margin:20px;color:#ffd91f;font-family:Silk;font-size:22px">+' + rw.amount + ' GOLD</p><button class="btn big" onclick="Game.nodeDone()">CONTINUE</button>';
      this.show(h); this.acts(() => Game.nodeDone()); return;
    }
    const offers = Game.offerPerks(3, rw.min);
    if (!offers.length) { h += '<p>No perks left to find.</p><button class="btn" onclick="Game.nodeDone()">CONTINUE</button>'; this.show(h); return; }
    h += '<p>Choose a perk</p><div class="row">' + offers.map((id, i) => this.perkCard(id, 'UI.take(\'' + id + '\')', '', i + 1)).join('') + '</div>'
      + '<div class="row"><button class="btn" onclick="Game.run.gold+=25;Game.nodeDone()">SKIP (+25 GOLD)</button></div>' + this.buildList();
    this.show(h); this.acts(...offers.map(id => () => this.take(id)));
  },
  take(id) { Game.takePerk(id); Game.nodeDone(); },
  takeUltra(i) { Game.run.ultra = i; Game.recalc(); Game.nodeDone(); },
  levelUp() {
    const run = Game.run, hero = HEROES[run.hero]; Sfx.good();
    if (run.plv >= 10 && run.ultra == null && hero.ultras) {
      this.show('<h2>ULTRA MUTATION</h2><p class="dim sm">Level ' + run.plv + ': choose your final form</p>' + this.status() + '<div class="row">' + hero.ultras.map((u, i) => '<div class="card rar-legendary" onclick="UI.takeUltra(' + i + ')"><span class="dim sm" style="position:absolute;right:8px;top:6px">[' + (i + 1) + ']</span><h3>' + u.name + '</h3><p>' + u.d + '</p></div>').join('') + '</div>');
      this.acts(() => this.takeUltra(0), () => this.takeUltra(1)); return;
    }
    const offers = Game.offerPerks(4 + (Game.P.choices || 0), 'common');
    if (!offers.length) { Game.nodeDone(); return; }
    this.show('<h2>LEVEL UP</h2><p class="dim sm">Level ' + run.plv + ': choose a mutation</p>' + this.status() + '<div class="row">' + offers.map((id, i) => this.perkCard(id, "UI.take('" + id + "')", '', i + 1)).join('') + '</div>' + this.buildList());
    this.acts(...offers.map(id => () => this.take(id)));
  },

  // ---------- shop ----------
  shop(n) {
    const run = Game.run;
    if (!n.shop) n.shop = { offers: Game.offerPerks(3), bought: [], healed: false, rerolls: 0 };
    const sh = n.shop, price = id => Math.round(RARITY[PERKS[id].r].price * (1 + 0.1 * run.act));
    let h = '<h2>BLACK MARKET</h2>' + this.status() + '<div class="row">';
    sh.offers.forEach((id, i) => {
      const bought = sh.bought.includes(id), pr = price(id);
      h += bought ? '<div class="card nopick locked"><h3>' + PERKS[id].name + '</h3><p>Sold</p></div>' : this.perkCard(id, run.gold >= pr ? 'UI.buy(\'' + id + '\')' : '', '<p style="margin-top:6px;color:' + (run.gold >= pr ? '#ffd91f' : '#ff7a85') + '">' + pr + ' GOLD</p>');
    });
    const healCost = 30, canHeal = !sh.healed && run.gold >= healCost && !Game.P.noHeal && run.hp < Game.P.maxhp;
    h += '</div><div class="row"><button class="btn" ' + (canHeal ? '' : 'disabled') + ' onclick="UI.buyHeal()">HEAL 35% (' + healCost + 'G)</button><button class="btn" ' + (run.gold >= 20 ? '' : 'disabled') + ' onclick="UI.reroll()">REROLL (20G)</button><button class="btn big" onclick="Game.nodeDone()">LEAVE</button></div>' + this.buildList();
    this.show(h);
  },
  buy(id) {
    const run = Game.run, n = Game.C.node, pr = Math.round(RARITY[PERKS[id].r].price * (1 + 0.1 * run.act));
    if (run.gold < pr) return; run.gold -= pr; n.shop.bought.push(id); Game.takePerk(id); Game.persist(); this.shop(n);
  },
  buyHeal() { const run = Game.run, n = Game.C.node; if (run.gold < 30) return; run.gold -= 30; n.shop.healed = true; Game.heal(0.35); Game.persist(); this.shop(n); },
  reroll() { const run = Game.run, n = Game.C.node; if (run.gold < 20) return; run.gold -= 20; n.shop.offers = Game.offerPerks(3); n.shop.bought = []; Game.persist(); this.shop(n); },

  // ---------- rest ----------
  rest(n) {
    const P = Game.P, run = Game.run, healAmt = Math.round(P.maxhp * 0.45);
    this.show('<h2>CAMPFIRE</h2>' + this.status() + '<p class="dim">A quiet moment in a dead world.</p><div class="row" style="margin-top:20px">'
      + '<div class="card ' + (P.noHeal ? 'locked' : '') + '" onclick="UI.restHeal()"><h3>REST</h3><p>Heal ' + healAmt + ' HP.</p>' + (P.noHeal ? '<p class="con sm">Hexed: no healing.</p>' : '') + '</div>'
      + '<div class="card" onclick="UI.restTrain()"><h3>TRAIN</h3><p>+1 heart for the rest of the run.</p></div></div>');
    this.acts(() => this.restHeal(), () => this.restTrain());
  },
  restHeal() { Game.heal(0.45); Game.nodeDone(); },
  restTrain() { Game.run.bonus.hp = (Game.run.bonus.hp || 0) + 10; Game.recalc(); Game.nodeDone(); },

  // ---------- altar / events ----------
  event(n) {
    const run = Game.run;
    if (!n.ev) {
      if (Math.random() < 0.65) {
        const perks = Game.offerPerks(3, 'rare'), pool = Object.keys(DRAWBACKS).filter(d => !run.drawbacks.includes(d)).sort(() => Math.random() - 0.5);
        n.ev = !perks.length ? { kind: 'blood' } : { kind: 'altar', offers: perks.map((p, i) => ({ perk: p, draw: pool[i % pool.length] })) };
      } else n.ev = { kind: 'blood' };
    }
    let h;
    if (n.ev.kind === 'altar') {
      h = '<h2>STRANGE ALTAR</h2>' + this.status() + '<p class="dim">Power has a price. Choose a trade, or walk away.</p><div class="row">';
      n.ev.offers.forEach((o, i) => { h += this.perkCard(o.perk, 'UI.trade(' + i + ')', '<p class="con" style="margin-top:6px">PRICE: ' + DRAWBACKS[o.draw].name + '<br><span class="sm">' + DRAWBACKS[o.draw].d + '</span></p>', i + 1); });
      h += '</div><div class="row"><button class="btn big" onclick="Game.nodeDone()">WALK AWAY</button></div>' + this.buildList();
      this.show(h); this.acts(...n.ev.offers.map((o, i) => () => this.trade(i)));
    } else {
      const cost = Math.round(Game.P.maxhp * 0.25);
      this.show('<h2>BLOOD FOUNT</h2>' + this.status() + '<p class="dim">The fount offers riches for blood.</p><div class="row" style="margin-top:16px"><div class="card" onclick="UI.blood()"><h3>SACRIFICE</h3><p>Lose ' + cost + ' HP.</p><p class="pro">+90 gold, +12 cores</p></div></div><div class="row"><button class="btn big" onclick="Game.nodeDone()">WALK AWAY</button></div>');
      this.acts(() => this.blood());
    }
  },
  trade(i) { const run = Game.run, n = Game.C.node, o = n.ev.offers[i]; Game.takeDrawback(o.draw); Game.takePerk(o.perk); Game.nodeDone(); },
  blood() { const run = Game.run, P = Game.P; run.hp = Math.max(1, run.hp - Math.round(P.maxhp * 0.25)); run.gold += 90; run.cores += 12; Game.nodeDone(); },

  // ---------- curse room ----------
  curse(n) {
    if (!n.cu) n.cu = Object.keys(CURSES).sort(() => Math.random() - 0.5).slice(0, 3);
    let h = '<h2>CURSED ROOM</h2>' + this.status() + '<p class="dim">Pick a curse for this fight. Win to claim an <b style="color:#b24bff">EPIC</b> perk choice and +22 cores.</p><div class="row" style="margin-top:14px">';
    n.cu.forEach((id, i) => { h += '<div class="card" style="--c:#ff3de8" onclick="UI.takeCurse(\'' + id + '\')"><span class="dim sm" style="position:absolute;right:8px;top:6px">[' + (i + 1) + ']</span><h3 style="color:#ff3de8">' + CURSES[id].name.toUpperCase() + '</h3><p>' + CURSES[id].d + '</p></div>'; });
    h += '</div><div class="row"><button class="btn" onclick="Game.nodeDone()">WALK AWAY</button></div>';
    this.show(h); this.acts(...n.cu.map(id => () => this.takeCurse(id)));
  },
  takeCurse(id) { Game.beginCurse(Object.assign({ name: CURSES[id].name }, CURSES[id])); },

  // ---------- act clear / end ----------
  actClear() {
    const run = Game.run, last = run.act % LOOP_LEVELS === LOOP_LEVELS - 1, loops = Math.floor(run.act / LOOP_LEVELS);
    Game.persist();
    if (last) {
      this.show('<h1>THE APOCALYPSE ENDS</h1><p>You beat ' + BOSSES[areaOf(run.act)].name + '.</p>' + this.status() + '<p class="dim" style="max-width:560px;text-align:center">Claim victory now, or loop back to the ruins. Enemies and bosses come back much tougher, victory pays more with every loop.</p><div class="row" style="margin-top:20px">'
        + '<div class="card" onclick="Game.winRun()" style="--c:#39ff6e"><h3 class="pro">CLAIM VICTORY</h3><p>x' + (1.6 + 0.25 * loops).toFixed(2) + ' cores.</p></div>'
        + '<div class="card" onclick="Game.descend()" style="--c:#ff2d3d"><h3 class="con">LOOP ' + (loops + 1) + '</h3><p>Back to the ruins, much tougher. Heal 35%. Keep all perks and weapons.</p></div></div>');
      return;
    }
    const ex = Math.round(run.cores * 1.25);
    this.show('<h1>AREA ' + (areaOf(run.act) + 1) + ' CLEARED</h1>' + this.status() + '<p class="dim" style="max-width:560px;text-align:center">Exit now and bank your cores with a 25% bonus, or descend. Deeper acts pay more, but if you die you only keep 40% of everything unbanked.</p><div class="row" style="margin-top:20px">'
      + '<div class="card" onclick="Game.exitRun()" style="--c:#39ff6e"><h3 class="pro">EXIT WITH LOOT</h3><p>Bank <b>' + ex + '</b> cores now.</p></div>'
      + '<div class="card" onclick="Game.descend()" style="--c:#ff2d3d"><h3 class="con">DESCEND</h3><p>Area ' + (areaOf(run.act + 1) + 1) + ': ' + ACT_NAMES[areaOf(run.act + 1)] + '. Heal 35%. Enemies are tougher, rewards bigger.</p></div></div>');
  },
  summary(res) {
    const head = res.why === 'win' ? 'VICTORY' : res.why === 'exit' ? 'ESCAPED' : 'RUN OVER';
    const col = res.why === 'dead' ? '#ff2d3d' : '#39ff6e';
    this.show('<h1 style="color:' + col + ';text-shadow:0 0 14px ' + col + '">' + head + '</h1><table><tr><td>Levels cleared</td><td>' + res.run.rooms + '</td></tr><tr><td>Enemies defeated</td><td>' + res.run.kills + '</td></tr><tr><td>Act reached</td><td>' + (res.run.act + 1) + '</td></tr><tr><td>Cores earned</td><td>' + res.unbanked + '</td></tr><tr><td>Cores banked</td><td style="color:#3de8ff">' + res.got + '</td></tr>'
      + (res.lost > 0 ? '<tr><td>Lost</td><td class="con">' + res.lost + '</td></tr>' : '') + '</table><div class="row" style="margin-top:20px"><button class="btn big" onclick="UI.hub(\'run\')">BACK TO HQ</button></div>');
    try { window.parent !== window && window.parent.postMessage({ type: 'gameOver', score: res.run.rooms }, '*'); } catch (e) { /* ignore */ }
  },
  pause() {
    this.show('<h1 style="margin-top:120px">PAUSED</h1><div class="row"><button class="btn big" onclick="Game.togglePause()">RESUME</button></div><div class="row"><button class="btn red" onclick="if(confirm(\'Abandon the run? You keep 25% of its cores.\')){Game.paused=false;UI.summary(Game.bank(0.25,\'dead\'))}">ABANDON RUN</button></div><p class="dim sm">P or Backspace also resumes.</p>', 'clear');
  },
};

UI.clanSelect = function (slot) { this.newGame(slot, 'steam'); };   // no clans any more
Game.abandonSaved = function () { if (!this.run) { this.run = Save.data.run; this.P = buildStats(this.run, Save.data); } return this.bank(0.25, 'dead'); };
Account.load();
UI.title();
