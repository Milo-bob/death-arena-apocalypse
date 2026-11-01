// Accounts (Supabase REST, no library) + 3 save slots. Local first, cloud sync on top.
// Fill URL and KEY with the values of the NEW Supabase project (Project Settings > API) and run tools/supabase_setup.sql.
// Without them the game runs as guest, saves stay in this browser.
const Account = {
  URL: '',
  KEY: '',
  DOMAIN: 'players.holiday-games.com',
  META: 'apoc.account',
  meta: null,          // { name, uid, tok, ref, exp } or null
  guest: false,
  get configured() { return !!(this.URL && this.KEY); },
  get on() { return !!(this.meta && this.meta.uid); },
  load() { try { this.meta = JSON.parse(localStorage.getItem(this.META)); } catch (e) { this.meta = null; } },
  store() { try { this.meta ? localStorage.setItem(this.META, JSON.stringify(this.meta)) : localStorage.removeItem(this.META); } catch (e) { /* ignore */ } },
  async http(method, path, body, token, extra) {
    try {
      const h = Object.assign({ apikey: this.KEY, 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || this.KEY) }, extra || {});
      const res = await fetch(this.URL + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
      let json = null; try { json = await res.json(); } catch (e) { /* 204 */ }
      return { ok: res.ok, status: res.status, json };
    } catch (e) { return { ok: false, status: 0, offline: true, json: null }; }
  },
  err(r) {
    if (r.offline) return 'No connection.';
    const m = String((r.json && (r.json.msg || r.json.error_description || r.json.message || r.json.error)) || '');
    if (/already registered|already exists/i.test(m)) return 'This name is already taken.';
    if (/invalid login/i.test(m)) return 'Wrong name or password.';
    if (/password/i.test(m)) return 'Password too short (6+ characters).';
    return m ? m.slice(0, 80) : 'Error ' + r.status;
  },
  setSession(j, name) {
    this.meta = { name: name || (this.meta && this.meta.name) || '', uid: j.user.id, tok: j.access_token, ref: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
    this.guest = false; this.store();
  },
  async signUp(name, pw) {
    if (!/^[a-z0-9_]{3,20}$/i.test(name)) return { ok: false, error: 'Name: 3-20 letters, numbers or _' };
    const r = await this.http('POST', '/auth/v1/signup', { email: name.toLowerCase() + '@' + this.DOMAIN, password: pw });
    if (!r.ok) return { ok: false, error: this.err(r) };
    if (!r.json || !r.json.access_token) return { ok: false, error: 'Account created, but e-mail confirmation is still on in Supabase.' };
    this.setSession(r.json, name); return { ok: true };
  },
  async signIn(name, pw) {
    const r = await this.http('POST', '/auth/v1/token?grant_type=password', { email: name.toLowerCase() + '@' + this.DOMAIN, password: pw });
    if (!r.ok || !r.json || !r.json.access_token) return { ok: false, error: this.err(r) };
    this.setSession(r.json, name); return { ok: true };
  },
  async token() {
    if (!this.on) return null;
    if (Date.now() < this.meta.exp - 60000) return this.meta.tok;
    const r = await this.http('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: this.meta.ref });
    if (!r.ok || !r.json || !r.json.access_token) return null;
    this.setSession(r.json); return this.meta.tok;
  },
  signOut() { this.meta = null; this.guest = false; this.store(); },
};

const Save = {
  slot: -1,
  data: null,       // current slot data
  timer: null,
  key(i) { return 'apoc.slot.' + (Account.on ? Account.meta.uid : 'guest') + '.' + i; },
  blank(clan) {
    const heroes = {}; for (const [id, h] of Object.entries(HEROES)) if (h.clan === clan && h.cost === 0) heroes[id] = 1;
    return { v: 1, clan, created: Date.now(), updated: Date.now(), cores: 0, heroes, perks: {}, meta: {}, loadout: {}, tree: {}, heat: 0, heatMax: 0, hero: Object.keys(heroes)[0],
      stats: { runs: 0, wins: 0, deaths: 0, kills: 0, bestAct: 0, bestRooms: 0 }, run: null };
  },
  readLocal(i) { try { return JSON.parse(localStorage.getItem(this.key(i))); } catch (e) { return null; } },
  writeLocal(i, d) { try { d ? localStorage.setItem(this.key(i), JSON.stringify(d)) : localStorage.removeItem(this.key(i)); } catch (e) { /* ignore */ } },
  // Pull the 3 slots from the cloud and keep whichever copy is newer; push local-only ones up.
  async sync() {
    if (!Account.on || !Account.configured) return;
    const tok = await Account.token(); if (!tok) return;
    const r = await Account.http('GET', '/rest/v1/apoc_saves?select=slot,data,updated_at&user_id=eq.' + Account.meta.uid, undefined, tok);
    if (!r.ok || !Array.isArray(r.json)) return;
    const cloud = {}; for (const row of r.json) cloud[row.slot] = row.data;
    for (let i = 0; i < 3; i++) {
      const loc = this.readLocal(i), c = cloud[i];
      if (c && (!loc || (c.updated || 0) > (loc.updated || 0))) this.writeLocal(i, c);
      else if (loc && (!c || (loc.updated || 0) > (c.updated || 0))) this.push(i, loc);
    }
  },
  async push(i, d) {
    if (!Account.on || !Account.configured) return;
    const tok = await Account.token(); if (!tok) return;
    await Account.http('POST', '/rest/v1/apoc_saves?on_conflict=user_id,slot', { user_id: Account.meta.uid, slot: i, data: d, updated_at: new Date().toISOString() }, tok,
      { Prefer: 'resolution=merge-duplicates,return=minimal' });
  },
  async remove(i) {
    this.writeLocal(i, null);
    if (!Account.on || !Account.configured) return;
    const tok = await Account.token(); if (!tok) return;
    await Account.http('DELETE', '/rest/v1/apoc_saves?user_id=eq.' + Account.meta.uid + '&slot=eq.' + i, undefined, tok);
  },
  open(i) { this.slot = i; this.data = this.readLocal(i); return this.data; },
  create(i, clan) { this.slot = i; this.data = this.blank(clan); this.write(true); return this.data; },
  write(now) {
    if (!this.data) return;
    this.data.updated = Date.now();
    this.writeLocal(this.slot, this.data);
    clearTimeout(this.timer);
    const i = this.slot, d = this.data;
    if (now) this.push(i, d); else this.timer = setTimeout(() => this.push(i, d), 4000);
  },
};
