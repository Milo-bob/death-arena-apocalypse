// Tiny synthesized sound effects (no files).
const Sfx = {
  ctx: null, on: true,
  init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.on = false; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); if (typeof Music !== 'undefined') Music.ensure(); },
  t(f, d, type, v, slide) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(f, n);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), n + d);
    g.gain.setValueAtTime(v || 0.06, n); g.gain.exponentialRampToValueAtTime(0.0001, n + d);
    o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + d);
  },
  shoot(kind, soft) {
    const v = soft ? 0.018 : 0.04;
    if (kind === 'shell') this.t(150, 0.15, 'sawtooth', v * 1.8, 0.35);
    else if (kind === 'bolt') this.t(760, 0.1, 'triangle', v * 1.3, 0.35);
    else if (kind === 'explosive') this.t(105, 0.25, 'square', v * 1.9, 0.4);
    else if (kind === 'energy') this.t(980, 0.13, 'sine', v * 1.2, 0.3);
    else this.t(520, soft ? 0.05 : 0.07, 'square', v, 0.5);
  },
  tick() { this.t(900 + Math.random() * 400, 0.04, 'triangle', 0.025); },
  slash() { this.t(260, 0.09, 'sawtooth', 0.04, 0.4); },
  noise(d, v, hp) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), q = buf.getChannelData(0);
    for (let i = 0; i < len; i++) q[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp || 800; g.gain.value = v;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  },
  later(ms, fn) { setTimeout(() => { if (this.on && this.ctx) fn(); }, ms); },
  hit(crit, big) { if (crit) { this.t(1100, 0.09, 'square', 0.05, 0.6); this.noise(0.05, 0.05, 3000); } else this.t(big ? 150 : 210, 0.06, 'square', 0.04, 0.6); },
  kill(k) { this.t(k ? 90 : 130, k ? 0.3 : 0.16, 'sawtooth', k ? 0.1 : 0.06, 0.35); this.noise(k ? 0.35 : 0.14, k ? 0.12 : 0.06, 400); if (k === 2) this.later(120, () => this.boom(200)); },
  hurt() { this.t(90, 0.28, 'sawtooth', 0.12, 0.45); this.noise(0.2, 0.1, 300); },
  dash() { this.t(300, 0.15, 'triangle', 0.06, 2.2); },
  pick() { this.t(660, 0.08, 'triangle', 0.05, 1.8); },
  boom(r) { const big = (r || 80) > 100; this.t(big ? 55 : 80, big ? 0.55 : 0.35, 'sawtooth', big ? 0.14 : 0.1, 0.25); this.noise(big ? 0.6 : 0.35, big ? 0.16 : 0.1, 150); },
  good() { this.t(440, 0.12, 'triangle', 0.06, 1.5); this.later(90, () => this.t(660, 0.15, 'triangle', 0.06, 1.5)); },
  levelup() { [440, 554, 659, 880].forEach((f, i) => this.later(i * 70, () => this.t(f, 0.16, 'triangle', 0.06, 1.2))); },
  chest(kind) { this.t(180, 0.12, 'square', 0.05, 1.8); this.later(90, () => this.t(kind === 'gold' ? 880 : 520, 0.2, 'triangle', 0.06, 1.5)); if (kind === 'gold') this.later(190, () => this.t(1175, 0.25, 'triangle', 0.06, 1.3)); },
  clunk() { this.t(120, 0.1, 'square', 0.06, 0.6); this.noise(0.05, 0.05, 1500); },
  swap() { this.t(300, 0.05, 'square', 0.04, 1.4); this.later(50, () => this.t(420, 0.05, 'square', 0.04, 1.2)); },
  empty() { this.t(150, 0.04, 'square', 0.05, 0.8); },
  ammo() { this.t(700, 0.05, 'square', 0.04, 1.4); this.noise(0.04, 0.03, 4000); },
  heal() { this.t(520, 0.12, 'triangle', 0.05, 1.6); this.later(80, () => this.t(780, 0.14, 'triangle', 0.05, 1.4)); },
  portal() { for (let i = 0; i < 6; i++) this.later(i * 60, () => this.t(300 + i * 90, 0.2, 'sine', 0.05, 1.5)); },
  bossIntro() { this.t(60, 0.9, 'sawtooth', 0.12, 0.5); this.noise(0.8, 0.08, 120); },
  heartbeat() { this.t(65, 0.12, 'sine', 0.12, 0.5); this.later(160, () => this.t(55, 0.14, 'sine', 0.1, 0.5)); },
  ability(type) {
    if (type === 'roll' || type === 'blink') { this.noise(0.18, 0.08, 1500); this.t(300, 0.15, 'triangle', 0.05, 2); }
    else if (type === 'shield') { this.t(500, 0.35, 'sine', 0.06, 2.2); this.t(750, 0.35, 'sine', 0.04, 2); }
    else if (type === 'nova') { this.t(90, 0.4, 'sawtooth', 0.1, 0.4); this.noise(0.3, 0.1, 300); }
    else if (type === 'zone') { this.noise(0.5, 0.07, 1200); this.t(180, 0.4, 'sine', 0.05, 0.8); }
    else if (type === 'overdrive') { this.t(180, 0.45, 'sawtooth', 0.07, 3.5); }
    else if (type === 'eat') { this.noise(0.18, 0.12, 200); this.t(110, 0.2, 'square', 0.08, 0.5); }
    else if (type === 'strike') { this.t(900, 0.5, 'sine', 0.06, 0.4); this.later(350, () => this.boom(150)); }
    else if (type === 'turret') { this.t(420, 0.08, 'square', 0.05, 1.5); this.later(90, () => this.t(630, 0.1, 'square', 0.05, 1.3)); }
    else this.t(200, 0.3, 'sawtooth', 0.07, 3);
  },
};

// Procedural dark ambient music: drone + bass + bells, with drums for fights and bosses. M toggles.
const MUSIC = {
  menu:  { bpm: 66,  root: 55, scale: [0, 3, 5, 7, 10], bass: [0, -1, -1, -1, -1, -1, 3, -1, 0, -1, -1, -1, 5, -1, -1, -1], arp: 0.18, drums: 0, pad: [0, 3, -2, 5] },
  fight: { bpm: 108, root: 49, scale: [0, 3, 5, 6, 7, 10], bass: [0, -1, 0, -1, 0, -1, 3, -1, 0, -1, 0, -1, 5, -1, 3, -1], arp: 0.3, drums: 1, pad: [0, 0, 3, -2] },
  boss:  { bpm: 138, root: 46, scale: [0, 1, 3, 6, 7, 10], bass: [0, 0, -1, 0, 1, -1, 0, -1, 0, 0, -1, 3, 1, -1, 6, -1], arp: 0.45, drums: 2, pad: [0, 1, 0, 6] },
};
const Music = {
  on: (() => { try { return localStorage.getItem('apoc.music') !== '0'; } catch (e) { return true; } })(),
  cur: null, timer: null, step: 0, nextT: 0, vol: 0.5,
  play(name) { if (this.cur === name) return; this.cur = name; this.step = 0; this.nextT = 0; this.ensure(); },
  ensure() { if (!Sfx.ctx || this.timer) return; this.timer = setInterval(() => this.tick(), 100); },
  toggle() { this.on = !this.on; try { localStorage.setItem('apoc.music', this.on ? '1' : '0'); } catch (e) { /* ignore */ } },
  hz(tr, deg, oct) { const sc = tr.scale, n = sc.length, i = ((deg % n) + n) % n, o = Math.floor(deg / n); return tr.root * Math.pow(2, (sc[i] + 12 * (o + (oct || 0))) / 12); },
  tone(f, t, d, type, v, lp) {
    const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
    o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = lp || 1200;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * this.vol, t + Math.min(0.05, d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(fl); fl.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  },
  kick(t) { const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(0.16 * this.vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.22); },
  noise(t, d, v, hp) {
    const c = Sfx.ctx, len = Math.floor(c.sampleRate * d), b = c.createBuffer(1, len, c.sampleRate), x = b.getChannelData(0); for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = b; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(v * this.vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  },
  tick() {
    const c = Sfx.ctx; if (!c || !this.on || !this.cur || c.state !== 'running') return;
    const tr = MUSIC[this.cur], spb = 60 / tr.bpm / 4;
    if (!this.nextT || this.nextT < c.currentTime) this.nextT = c.currentTime + 0.05;
    while (this.nextT < c.currentTime + 0.35) {
      const t = this.nextT, s = this.step % 16, bar = Math.floor(this.step / 16) % tr.pad.length;
      if (s === 0) { const r = tr.pad[bar]; for (const d of [0, 2, 4]) this.tone(this.hz(tr, r + d, 1), t, spb * 16, 'sawtooth', 0.05, 500); }
      const b = tr.bass[s]; if (b >= 0) this.tone(this.hz(tr, b, 0), t, spb * (tr.drums ? 1.6 : 4), tr.drums > 1 ? 'square' : 'sawtooth', tr.drums ? 0.11 : 0.1, tr.drums ? 420 : 260);
      if (Math.random() < tr.arp && s % 2 === 0) this.tone(this.hz(tr, Math.floor(Math.random() * 7), 2), t, spb * 3, 'triangle', 0.05, 2400);
      if (tr.drums) { if (s % 4 === 0 || (tr.drums > 1 && s === 14)) this.kick(t); if (s === 4 || s === 12) this.noise(t, 0.12, 0.08, 1500); if (s % 2 === 1) this.noise(t, 0.03, tr.drums > 1 ? 0.04 : 0.025, 6000); }
      else if (s === 0) this.kick(t);
      this.nextT += spb; this.step++;
    }
  },
};
