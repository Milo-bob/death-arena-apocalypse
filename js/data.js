// Static game data: clans, heroes, perks, drawbacks, curses, synergies, enemies. Everything data-driven, so new content = new entries.
const W = 960, H = 540;
const ARENA = { x0: 26, y0: 58, x1: 934, y1: 514 };

// a run is a chain of levels (run.act counts them): 3 levels per area, the third is the boss level; after 3 areas the run loops
const AREAS = 6, LOOP_LEVELS = AREAS * 3;
const areaOf = a => Math.floor(a / 3) % AREAS, isBossLevel = a => a % 3 === 2;

const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function wpick(items, wf) {
  let t = 0; for (const i of items) t += wf(i);
  let r = Math.random() * t;
  for (const i of items) { r -= wf(i); if (r <= 0) return i; }
  return items[items.length - 1];
}

// ---------- Clans: one drawback and one advantage each, applied to the stat sheet P ----------
const CLANS = {
  bio: { name: 'Biopunk', color: '#7dff4a', dark: '#1d4a12', blurb: 'Living weapons. Poison, mutation and flesh that heals itself.',
    pro: 'Heal 1 HP every 5 kills. Poison hits harder.', con: '-10% max HP.',
    mod(P) { P.maxhp *= 0.9; P.killHeal += 0.2; P.poisonMul *= 1.25; } },
  steam: { name: 'Steampunk', color: '#ffb347', dark: '#4a2c08', blurb: 'Brass and pressure. Heavy hits, big blasts, slow bodies.',
    pro: '+20% damage. Kills cause small explosions.', con: '-10% move speed.',
    mod(P) { P.dmg *= 1.2; P.speed *= 0.9; P.killBlast += 10; } },
  solar: { name: 'Solarpunk', color: '#ffe94a', dark: '#4a4208', blurb: 'Light and growth. Sustain, control, patient play.',
    pro: 'Heal 12% max HP after every cleared room.', con: '-15% damage.',
    mod(P) { P.dmg *= 0.85; P.clearHeal += 0.12; } },
  cyber: { name: 'Cyberpunk', color: '#ff3de8', dark: '#4a0840', blurb: 'Implants and speed. Flexible builds, glass body.',
    pro: '-25% dash cooldown, +10% crit chance.', con: 'Take +15% damage.',
    mod(P) { P.dashCd *= 0.75; P.crit += 0.1; P.taken *= 1.15; } },
  void: { name: 'Voidpunk', color: '#a06bff', dark: '#1c0d3a', blurb: 'Rifts and shadow. Hit-and-run, collapsing space around you.',
    pro: 'Dashing damages enemies (+20), +10% crit damage.', con: '-10% attack speed.',
    mod(P) { P.dashDmg += 20; P.critMul += 0.1; P.rate *= 0.9; } },
};

// ---------- Clan mastery: collect N perks of your own clan for a bonus ----------
const CLAN_SET = {
  bio: { n: 3, name: 'Hive Mind', d: 'Poison +30% damage, heal 1 HP every 4 kills.', a: P => { P.poisonMul *= 1.3; P.killHeal += 0.25; } },
  steam: { n: 3, name: 'Foundry Master', d: 'Kill blasts +20 damage, +10% damage.', a: P => { P.killBlast += 20; P.dmg *= 1.1; } },
  solar: { n: 3, name: 'Eternal Day', d: 'Heal +10% after every cleared room, +1 regen.', a: P => { P.clearHeal += 0.1; P.regen += 1; } },
  cyber: { n: 3, name: 'Neural Net', d: '-20% dash cooldown, +10% crit.', a: P => { P.dashCd *= 0.8; P.crit += 0.1; } },
  void: { n: 3, name: 'Event Horizon', d: 'Dash damage +30, explosions 20% wider.', a: P => { P.dashDmg += 30; P.blastRad *= 1.2; } },
};
CLANS.aqua = { name: 'Aqua', color: '#4fe0d0', dark: '#0c3030', blurb: '', pro: '', con: '', mod() {} };
CLANS.iron = { name: 'Iron', color: '#b4bcc8', dark: '#1c2028', blurb: '', pro: '', con: '', mod() {} };
CLAN_SET.aqua = CLAN_SET.iron = CLAN_SET.void;
for (const k in CLANS) CLANS[k].mod = () => {};   // clans are gone, they only stay as colour palettes
const clanPerkCount = run => run.perks.filter(id => PERKS[id].clan === run.clan).length;

// ---------- Heroes ----------
// weapon types: shot (projectiles), cone (melee arc, deflects bullets), blades (orbiting), lance (piercing thrust), mortar (lobbed blast at cursor)
// ability types: nova, zone, overdrive, turret, blink, shield, bloom
const HEROES = {
  spore: { clan: 'bio', name: 'Spore', cost: 0, blurb: 'Spore shotgun that poisons.',
    weapon: { type: 'shot', name: 'Spore Gun', rate: 1.7, dmg: 11, speed: 440, n: 3, spread: 0.28, pierce: 0, life: 0.9, size: 4 },
    ability: { type: 'zone', name: 'Toxic Cloud', cd: 12, r: 90, dur: 5, dps: 14, slow: 0.4, poison: 6 }, mod(P) { P.poison += 3; } },
  brute: { clan: 'bio', name: 'Brute', cost: 120, blurb: 'Claws. Heals through bloodshed.',
    weapon: { type: 'cone', name: 'Claws', rate: 2.8, dmg: 27, range: 88, arc: 1.8 },
    ability: { type: 'overdrive', name: 'Frenzy', cd: 14, dur: 4, rate: 1.7 }, mod(P) { P.killHeal += 0.15; P.maxhp += 15; P.speed *= 1.05; } },
  vein: { clan: 'bio', name: 'Vein', cost: 250, blurb: 'Thorn blades orbit and shred.',
    weapon: { type: 'blades', name: 'Thorn Ring', n: 3, dmg: 19, r: 66, spin: 3.6 },
    ability: { type: 'bloom', name: 'Bloom', cd: 16, heal: 22, r: 140, dmg: 30 }, mod(P) { P.thorns += 8; } },

  boiler: { clan: 'steam', name: 'Boilermaker', cost: 0, blurb: 'Lobs steam bombs at the cursor.',
    weapon: { type: 'mortar', name: 'Steam Bomb', rate: 0.9, dmg: 34, r: 62, delay: 0.55, reach: 360 },
    ability: { type: 'nova', name: 'Vent', cd: 11, r: 150, dmg: 45, knock: 260, burn: 6 }, mod(P) { P.burn += 2; } },
  gunner: { clan: 'steam', name: 'Gunner', cost: 120, blurb: 'Heavy rifle, pierces, slow rate.',
    weapon: { type: 'shot', name: 'Rivet Rifle', rate: 1.5, dmg: 30, speed: 560, n: 1, spread: 0, pierce: 2, life: 0.9, size: 5 },
    ability: { type: 'turret', name: 'Gatling Turret', cd: 15, dur: 8, rate: 7, dmg: 7 }, mod(P) { P.still += 0; } },
  clock: { clan: 'steam', name: 'Clockwork', cost: 250, blurb: 'Spear thrusts through whole lines.',
    weapon: { type: 'lance', name: 'Piston Spear', rate: 2.1, dmg: 28, reach: 150, width: 20 },
    ability: { type: 'overdrive', name: 'Full Steam', cd: 13, dur: 5, rate: 1.5 }, mod(P) { P.range *= 1.05; } },

  sun: { clan: 'solar', name: 'Sunwarden', cost: 0, blurb: 'Rapid light bolts.',
    weapon: { type: 'shot', name: 'Light Bolt', rate: 4.6, dmg: 9, speed: 520, n: 1, spread: 0.04, pierce: 0, life: 0.8, size: 3 },
    ability: { type: 'nova', name: 'Solar Flare', cd: 13, r: 220, dmg: 60, knock: 160, burn: 4 }, mod(P) { P.dmg *= 1.1; } },
  weaver: { clan: 'solar', name: 'Thornweaver', cost: 120, blurb: 'Vines orbit and root foes.',
    weapon: { type: 'blades', name: 'Living Vines', n: 3, dmg: 17, r: 72, spin: 3.0 },
    ability: { type: 'zone', name: 'Root Field', cd: 12, r: 110, dur: 5, dps: 9, slow: 0.75, poison: 0 }, mod(P) { P.regen += 0.5; } },
  seed: { clan: 'solar', name: 'Seedkeeper', cost: 250, blurb: 'Seed bombs, plus a barrier.',
    weapon: { type: 'mortar', name: 'Seed Bomb', rate: 1.2, dmg: 22, r: 52, delay: 0.4, reach: 330 },
    ability: { type: 'shield', name: 'Sun Barrier', cd: 14, dur: 2.5 }, mod(P) { P.clearHeal += 0.05; } },

  runner: { clan: 'cyber', name: 'Runner', cost: 0, blurb: 'Fast monoblade, blinks through danger.',
    weapon: { type: 'cone', name: 'Monoblade', rate: 3.8, dmg: 22, range: 78, arc: 1.6 },
    ability: { type: 'blink', name: 'Blink Strike', cd: 7, dist: 230, dmg: 55 }, mod(P) { P.speed *= 1.12; P.maxhp += 20; } },
  net: { clan: 'cyber', name: 'Netrunner', cost: 120, blurb: 'Homing data shards.',
    weapon: { type: 'shot', name: 'Data Shard', rate: 3.2, dmg: 10, speed: 330, n: 1, spread: 0.1, pierce: 0, life: 1.1, size: 4, homing: 3 },
    ability: { type: 'turret', name: 'Attack Drone', cd: 14, dur: 9, rate: 4, dmg: 10 }, mod(P) { P.chain += 0.1; } },
  splicer: { clan: 'cyber', name: 'Splicer', cost: 250, blurb: 'Rail spear, huge crit potential.',
    weapon: { type: 'lance', name: 'Rail Lance', rate: 1.5, dmg: 36, reach: 210, width: 12 },
    ability: { type: 'overdrive', name: 'Overclock', cd: 15, dur: 4, rate: 1.9 }, mod(P) { P.crit += 0.1; P.critMul += 0.25; } },

  hive: { clan: 'bio', name: 'Hivemind', cost: 400, blurb: 'Bursts of seed pods in a wide fan.',
    weapon: { type: 'shot', name: 'Pod Burst', rate: 1.3, dmg: 7, speed: 400, n: 5, spread: 0.5, pierce: 0, life: 0.7, size: 4 },
    ability: { type: 'nova', name: 'Spore Pop', cd: 9, r: 130, dmg: 30, knock: 120, burn: 0 }, mod(P) { P.poison += 2; P.maxhp += 10; } },
  reaper: { clan: 'bio', name: 'Reaper', cost: 600, blurb: 'Scythe thrusts and a lunge.',
    weapon: { type: 'lance', name: 'Bone Scythe', rate: 1.8, dmg: 32, reach: 130, width: 24 },
    ability: { type: 'blink', name: 'Lunge', cd: 8, dist: 190, dmg: 45 }, mod(P) { P.killHeal += 0.1; P.crit += 0.05; } },
  siege: { clan: 'steam', name: 'Siegebreaker', cost: 400, blurb: 'Slow, huge shells and a pressure valve.',
    weapon: { type: 'mortar', name: 'Siege Shell', rate: 0.7, dmg: 48, r: 80, delay: 0.7, reach: 420 },
    ability: { type: 'shield', name: 'Pressure Valve', cd: 15, dur: 3 }, mod(P) { P.blastRad *= 1.1; } },
  tinker: { clan: 'steam', name: 'Tinkerer', cost: 600, blurb: 'Piercing bolts and a deployable cannon.',
    weapon: { type: 'shot', name: 'Bolt Driver', rate: 2.4, dmg: 16, speed: 480, n: 1, spread: 0.02, pierce: 1, life: 0.9, size: 4 },
    ability: { type: 'turret', name: 'Auto Cannon', cd: 12, dur: 9, rate: 5, dmg: 9 }, mod(P) { P.goldMul *= 1.15; } },
  prism: { clan: 'solar', name: 'Prismkeeper', cost: 400, blurb: 'Twin piercing beams, splits light into a burst.',
    weapon: { type: 'shot', name: 'Prism Beam', rate: 3, dmg: 12, speed: 540, n: 2, spread: 0.12, pierce: 1, life: 0.8, size: 3 },
    ability: { type: 'nova', name: 'Prism Burst', cd: 10, r: 180, dmg: 40, knock: 200, burn: 3 }, mod(P) { P.crit += 0.05; } },
  dawn: { clan: 'solar', name: 'Dawnblade', cost: 600, blurb: 'Radiant sword that heals through daybreak.',
    weapon: { type: 'cone', name: 'Dawn Sword', rate: 3.2, dmg: 24, range: 92, arc: 2.0 },
    ability: { type: 'bloom', name: 'Daybreak', cd: 14, heal: 30, r: 160, dmg: 35 }, mod(P) { P.maxhp += 10; P.regen += 0.5; } },
  phantom: { clan: 'cyber', name: 'Phantom', cost: 400, blurb: 'Fast spinning drones and a phase shift.',
    weapon: { type: 'blades', name: 'Razor Drones', n: 2, dmg: 24, r: 58, spin: 4.8 },
    ability: { type: 'blink', name: 'Phase Shift', cd: 6, dist: 260, dmg: 30 }, mod(P) { P.speed *= 1.08; } },
  sniper: { clan: 'cyber', name: 'Sniper', cost: 600, blurb: 'Slow long-range rounds that pierce everything.',
    weapon: { type: 'shot', name: 'Rail Rifle', rate: 1.1, dmg: 48, speed: 760, n: 1, spread: 0, pierce: 3, life: 1.1, size: 4 },
    ability: { type: 'overdrive', name: 'Focus', cd: 13, dur: 4, rate: 1.8 }, mod(P) { P.crit += 0.15; P.critMul += 0.25; } },

  rift: { clan: 'void', name: 'Riftwalker', cost: 0, blurb: 'Blade of folded space, steps through rifts.',
    weapon: { type: 'cone', name: 'Rift Blade', rate: 3, dmg: 23, range: 82, arc: 1.7 },
    ability: { type: 'blink', name: 'Rift Step', cd: 6.5, dist: 240, dmg: 50 }, mod(P) { P.dashDmg += 10; P.speed *= 1.05; } },
  warlock: { clan: 'void', name: 'Voidcaller', cost: 120, blurb: 'Lobs collapsing orbs, opens a slowing horizon.',
    weapon: { type: 'mortar', name: 'Void Orb', rate: 1, dmg: 30, r: 66, delay: 0.45, reach: 380 },
    ability: { type: 'zone', name: 'Event Horizon', cd: 13, r: 100, dur: 5, dps: 16, slow: 0.6, poison: 0 }, mod(P) { P.blastRad *= 1.05; } },
  umbra: { clan: 'void', name: 'Umbral', cost: 250, blurb: 'Shadows orbit and shred, a veil blocks hits.',
    weapon: { type: 'blades', name: 'Shade Ring', n: 3, dmg: 20, r: 70, spin: 3.4 },
    ability: { type: 'shield', name: 'Shadow Veil', cd: 13, dur: 3 }, mod(P) { P.taken *= 0.95; } },
  singular: { clan: 'void', name: 'Collapser', cost: 400, blurb: 'Gravity lance and a crushing collapse.',
    weapon: { type: 'lance', name: 'Gravity Lance', rate: 1.7, dmg: 34, reach: 170, width: 18 },
    ability: { type: 'nova', name: 'Collapse', cd: 11, r: 200, dmg: 55, knock: 120, burn: 0 }, mod(P) { P.blastRad *= 1.1; } },
  eclipse: { clan: 'void', name: 'Eclipse', cost: 600, blurb: 'Homing dark matter, overcharges in totality.',
    weapon: { type: 'shot', name: 'Dark Matter', rate: 2.8, dmg: 14, speed: 420, n: 1, spread: 0.06, pierce: 1, life: 1.1, size: 4, homing: 2 },
    ability: { type: 'overdrive', name: 'Totality', cd: 14, dur: 4, rate: 1.8 }, mod(P) { P.crit += 0.08; } },
};

// ---------- Nuclear-Throne style: 8 playable characters, every other hero entry is just a weapon in the loot pool ----------
// ---------- Nuclear-Throne style roster: 12 playable characters, loot weapons are separate entries (w_*) ----------
const PLAYABLE = ['sun', 'gunner', 'net', 'boiler', 'weaver', 'runner', 'brute', 'hive'];   // Fish, Crystal, Eyes, Melting, Plant, Y.V., Robot, Chicken - all selectable from the start
const NO_ABILITY = { type: 'overdrive', name: '-', cd: 99, dur: 0, rate: 1 };
Object.assign(HEROES.sun, { name: 'Fish', cost: 0, start: 'w_revolver', blurb: 'Extra ammo from drops. Q: roll through danger.',
  ability: { type: 'roll', name: 'Roll', cd: 3.5 }, mod(P) { P.ammoMul *= 1.35; } });
Object.assign(HEROES.gunner, { name: 'Crystal', cost: 0, start: 'w_revolver', blurb: 'Tough shell. Q: shield that reflects bullets.',
  ability: { type: 'shield', name: 'Shield', cd: 9, dur: 2.5 }, mod(P) { P.maxhp -= 10; P.taken *= 0.95; } });
Object.assign(HEROES.runner, { name: 'Y.V.', cost: 150, start: 'w_machinegun', blurb: 'Gun god: shoots faster, ammo goes further. Q: pop pop.',
  ability: { type: 'overdrive', name: 'Pop Pop', cd: 11, dur: 4, rate: 1.8 }, mod(P) { P.rate *= 1.12; P.crit += 0.05; P.ammoCost *= 0.7; } });
Object.assign(HEROES.net, { name: 'Eyes', cost: 250, start: 'w_laserpistol', blurb: 'Loot flies to you. Q: telekinesis shove.',
  ability: { type: 'nova', name: 'Telekinesis', cd: 6, r: 210, dmg: 6, knock: 430, burn: 0 }, mod(P) { P.magnet *= 2.5; P.xpMul *= 1.1; } });
Object.assign(HEROES.boiler, { name: 'Melting', cost: 150, start: 'w_revolver', blurb: 'Fragile, but kills burst into flames. Q: rad burst.',
  ability: { type: 'nova', name: 'Rad Burst', cd: 9, r: 170, dmg: 70, knock: 240, burn: 6 }, mod(P) { P.maxhp -= 40; P.killBlast += 18; P.burn += 2; } });
Object.assign(HEROES.weaver, { name: 'Plant', cost: 350, start: 'w_crossbow', blurb: 'Fast and regenerating. Q: snare (slows enemies).',
  ability: { type: 'zone', name: 'Snare', cd: 10, r: 120, dur: 5, dps: 6, slow: 0.8, poison: 0 }, mod(P) { P.speed *= 1.12; P.regen += 0.6; } });
Object.assign(HEROES.clock, { name: 'Steroids', cost: 450, start: 'w_revolver', start2: 'w_revolver', blurb: 'Dual wields: both guns fire together. Q: berserk.',
  ability: { type: 'overdrive', name: 'Berserk', cd: 13, dur: 5, rate: 1.5 }, mod(P) { P.dual = 1; P.ammoMul *= 1.2; } });
Object.assign(HEROES.brute, { name: 'Robot', cost: 550, start: 'w_shotgun', blurb: 'Eats weapons for ammo and health with Q.',
  ability: { type: 'eat', name: 'Eat Weapon', cd: 3 }, mod(P) { P.ammoMul *= 1.1; P.dropMul *= 1.8; P.lootTier += 1; } });
Object.assign(HEROES.siege, { name: 'Rebel', cost: 650, start: 'w_popgun', blurb: 'Brings a drone ally. Q: call another.',
  ability: { type: 'turret', name: 'Ally Drone', cd: 8, dur: 14, rate: 4, dmg: 8 }, mod(P) { P.maxhp -= 20; P.regen += 0.3; } });
Object.assign(HEROES.hive, { name: 'Chicken', cost: 750, start: 'w_machete', blurb: 'Keeps going when it should be dead (revive). Q: flap dash.',
  ability: { type: 'roll', name: 'Flap', cd: 3 }, mod(P) { P.phoenix = 1; P.maxhp -= 40; P.speed *= 1.1; } });
Object.assign(HEROES.phantom, { name: 'Wraith', cost: 850, start: 'w_plasmagun', blurb: 'Feeds on radiation: more rads. Q: radiation pulse.',
  ability: { type: 'zone', name: 'Radiation', cd: 9, r: 140, dur: 3, dps: 45, slow: 0.2, poison: 0 }, mod(P) { P.xpMul *= 1.45; } });
Object.assign(HEROES.umbra, { name: 'Outlaw', cost: 950, start: 'w_rifle', blurb: 'Crits and ambushes. Q: call down a strike at the cursor.',
  ability: { type: 'strike', name: 'Strike', cd: 7, dmg: 110, r: 110 }, mod(P) { P.crit += 0.12; P.critMul += 0.3; P.maxhp -= 20; } });

Object.assign(HEROES.sun, { passive: 'More ammo from every pickup.', active: 'Roll: a quick dodge roll, you cannot be hit.' });
Object.assign(HEROES.gunner, { passive: 'Takes less damage.', active: 'Shield: reflects enemy bullets back for a short time.' });
Object.assign(HEROES.net, { passive: 'Loot is pulled to you from far away, a bit more rads.', active: 'Telekinesis: shoves enemies and bullets away.' });
Object.assign(HEROES.boiler, { passive: 'Only 4 hearts, but kills explode.', active: 'Rad Burst: a big radiation explosion around you.' });
Object.assign(HEROES.weaver, { passive: 'Walks faster and slowly regenerates.', active: 'Snare: slows every enemy in the area.' });
Object.assign(HEROES.runner, { passive: 'Shoots faster and ammo lasts longer.', active: 'Pop Pop: rapid fire for a few seconds.' });
Object.assign(HEROES.clock, { passive: 'Dual wield: both weapons fire at once.', active: 'Berserk: fire even faster for a few seconds.' });
Object.assign(HEROES.hive, { passive: 'Keeps going once when it should be dead.', active: 'Flap: a quick roll, you cannot be hit.' });
Object.assign(HEROES.brute, { passive: 'Better drop rates: more ammo, health and weapons, and better weapon loot.', active: 'Eat Weapon: turns a nearby weapon into ammo and health.' });
HEROES.sun.clan = 'aqua'; HEROES.gunner.clan = 'void'; HEROES.weaver.clan = 'bio'; HEROES.brute.clan = 'iron';
HEROES.sun.ultras = [
  { name: 'Gun Nut', d: '+60% ammo from pickups, +15% damage.', a: P => { P.ammoMul *= 1.6; P.dmg *= 1.15; } },
  { name: 'Quick Draw', d: '+25% attack speed, +10% crit chance.', a: P => { P.rate *= 1.25; P.crit += 0.1; } }];
HEROES.gunner.ultras = [
  { name: 'Diamond Skin', d: 'Take 25% less damage, +1 heart.', a: P => { P.taken *= 0.75; P.maxhp += 10; } },
  { name: 'Shatter', d: '+30% damage, attackers take 15 damage.', a: P => { P.dmg *= 1.3; P.thorns += 15; } }];
HEROES.runner.ultras = [
  { name: 'Sharpshooter', d: '+15% crit chance, crits hit +50% harder.', a: P => { P.crit += 0.15; P.critMul += 0.5; } },
  { name: 'Bullet Storm', d: '+35% attack speed.', a: P => { P.rate *= 1.35; } }];
HEROES.net.ultras = [
  { name: 'Hive Sight', d: 'Shots home in harder, +10% attack speed.', a: P => { P.homing += 2; P.rate *= 1.1; } },
  { name: 'Third Eye', d: '+1 projectile, +10% crit chance.', a: P => { P.extra += 1; P.crit += 0.1; } }];
HEROES.boiler.ultras = [
  { name: 'Supernova', d: 'Kill blasts +25 damage and 40% wider.', a: P => { P.killBlast += 25; P.blastRad *= 1.4; } },
  { name: 'Wildfire', d: 'Hits burn for +10 dmg/s, burning aura around you.', a: P => { P.burn += 10; P.aura += 12; } }];
HEROES.weaver.ultras = [
  { name: 'Overgrowth', d: '+2 regen, +1 heart.', a: P => { P.regen += 2; P.maxhp += 10; } },
  { name: 'Predator', d: '+15% move speed, +20% damage.', a: P => { P.speed *= 1.15; P.dmg *= 1.2; } }];
HEROES.clock.ultras = [
  { name: 'Twin Fury', d: '+25% attack speed, +15% damage.', a: P => { P.rate *= 1.25; P.dmg *= 1.15; } },
  { name: 'Ammo Hoarder', d: '+70% ammo from pickups, +1 heart.', a: P => { P.ammoMul *= 1.7; P.maxhp += 10; } }];
HEROES.brute.ultras = [
  { name: 'Overclock', d: '+20% attack speed, +10% damage.', a: P => { P.rate *= 1.2; P.dmg *= 1.1; } },
  { name: 'Scrap Armor', d: 'Take 15% less damage, +1 heart.', a: P => { P.taken *= 0.85; P.maxhp += 10; } }];
HEROES.siege.ultras = [
  { name: 'Squad Leader', d: '+20% damage, +1 regen.', a: P => { P.dmg *= 1.2; P.regen += 1; } },
  { name: 'Last Stand', d: 'Up to +60% damage as HP drops, +1 heart.', a: P => { P.berserk = 1; P.maxhp += 10; } }];
HEROES.hive.ultras = [
  { name: 'Phoenix Rising', d: '+1 heart, +25% damage.', a: P => { P.maxhp += 10; P.dmg *= 1.25; } },
  { name: 'Headless', d: '+25% move speed, +20% attack speed.', a: P => { P.speed *= 1.25; P.rate *= 1.2; } }];
HEROES.phantom.ultras = [
  { name: 'Meltdown', d: 'Burning aura, +1 heart.', a: P => { P.aura += 20; P.maxhp += 10; } },
  { name: 'Rad Feast', d: '+50% more rads, +15% damage.', a: P => { P.xpMul *= 1.5; P.dmg *= 1.15; } }];
HEROES.umbra.ultras = [
  { name: 'Assassin', d: '+15% crit chance, crits hit +60% harder.', a: P => { P.crit += 0.15; P.critMul += 0.6; } },
  { name: 'Bombardier', d: 'Explosions 40% wider and +25% blast damage.', a: P => { P.blastRad *= 1.4; P.blastMul *= 1.25; } }];

// characters are unlocked by achievements (stats are banked at the end of a run)
const UNLOCK = {
  net: { d: 'Reach level 2 in a run', ok: s => s.stats.bestAct >= 2, prog: s => Math.min(2, s.stats.bestAct) + '/2' },
  boiler: { d: 'Kill 100 enemies in total', ok: s => s.stats.kills >= 100, prog: s => Math.min(100, s.stats.kills) + '/100' },
  weaver: { d: 'Reach level 4 in a run', ok: s => s.stats.bestAct >= 4, prog: s => Math.min(4, s.stats.bestAct) + '/4' },
  runner: { d: 'Reach level 5 in a run', ok: s => s.stats.bestAct >= 5, prog: s => Math.min(5, s.stats.bestAct) + '/5' },
  clock: { d: 'Reach player level 6 in a run', ok: s => (s.stats.bestPlv || 0) >= 6, prog: s => Math.min(6, s.stats.bestPlv || 0) + '/6' },
  brute: { d: 'Defeat a boss', ok: s => (s.stats.bosses || 0) >= 1, prog: s => Math.min(1, s.stats.bosses || 0) + '/1' },
};

// ---------- loot weapons (names follow the classic arcade roguelite weapon list; dmg is normalised per tier by the balance pass) ----------
const POOL_WEAPONS = {
  revolver: ['Revolver', { type: 'shot', ammo: 'bullet', tier: 0, rate: 3.0, dmg: 8.7, speed: 560, n: 1, spread: 0.05, pierce: 0, life: 0.8, size: 3 }],
  popgun: ['Pop Gun', { type: 'shot', ammo: 'bullet', tier: 0, rate: 2.2, dmg: 11.8, speed: 500, n: 1, spread: 0.03, pierce: 0, life: 0.8, size: 4 }],
  machinegun: ['Machinegun', { type: 'shot', ammo: 'bullet', tier: 1, rate: 7, dmg: 5.4, speed: 580, n: 1, spread: 0.22, pierce: 0, life: 0.7, size: 3 }],
  rifle: ['Assault Rifle', { type: 'shot', ammo: 'bullet', tier: 2, rate: 2.4, dmg: 7.2, speed: 640, n: 1, spread: 0.05, pierce: 0, life: 0.9, size: 3, burst: 3 }],
  smartgun: ['Smart Gun', { type: 'shot', ammo: 'bullet', tier: 2, rate: 5, dmg: 10.4, speed: 520, n: 1, spread: 0.3, pierce: 0, life: 1.0, size: 3, homing: 3 }],
  heavyrevolver: ['Heavy Revolver', { type: 'shot', ammo: 'bullet', tier: 2, rate: 1.6, dmg: 29, speed: 640, n: 1, spread: 0.02, pierce: 1, life: 1, size: 5 }],
  bouncersmg: ['Bouncer SMG', { type: 'shot', ammo: 'bullet', tier: 2, rate: 6, dmg: 8.7, speed: 560, n: 1, spread: 0.2, pierce: 0, life: 1.8, size: 3, bounce: 3 }],
  triplemg: ['Triple Machinegun', { type: 'shot', ammo: 'bullet', tier: 3, rate: 6, dmg: 3.9, speed: 600, n: 3, spread: 0.5, pierce: 0, life: 0.8, size: 3 }],
  heavymg: ['Heavy Machinegun', { type: 'shot', ammo: 'bullet', tier: 3, rate: 6, dmg: 11.7, speed: 620, n: 1, spread: 0.15, pierce: 0, life: 0.9, size: 4 }],
  sniper: ['Sniper Rifle', { type: 'shot', ammo: 'bullet', tier: 3, rate: 1.2, dmg: 42.9, speed: 1000, n: 1, spread: 0, pierce: 3, life: 1.2, size: 4 }],
  minigun: ['Minigun', { type: 'shot', ammo: 'bullet', tier: 4, rate: 15, dmg: 6.3, speed: 620, n: 1, spread: 0.3, pierce: 0, life: 0.8, size: 3 }],
  shotgun: ['Shotgun', { type: 'shot', ammo: 'shell', tier: 1, rate: 1.1, dmg: 8.9, speed: 520, n: 6, spread: 0.5, pierce: 0, life: 0.35, size: 3 }],
  sawedoff: ['Sawed-off Shotgun', { type: 'shot', ammo: 'shell', tier: 1, rate: 1.0, dmg: 5.8, speed: 520, n: 10, spread: 0.75, pierce: 0, life: 0.25, size: 3 }],
  doubleshotgun: ['Double Shotgun', { type: 'shot', ammo: 'shell', tier: 2, rate: 1.4, dmg: 7.1, speed: 540, n: 8, spread: 0.6, pierce: 0, life: 0.3, size: 3 }],
  slugger: ['Slugger', { type: 'shot', ammo: 'shell', tier: 2, rate: 1.1, dmg: 58.7, speed: 700, n: 1, spread: 0.01, pierce: 2, life: 0.9, size: 6 }],
  autoshotgun: ['Auto Shotgun', { type: 'shot', ammo: 'shell', tier: 3, rate: 2.8, dmg: 7.7, speed: 540, n: 5, spread: 0.5, pierce: 0, life: 0.35, size: 3 }],
  superslugger: ['Super Slugger', { type: 'shot', ammo: 'shell', tier: 3, rate: 1.4, dmg: 56.6, speed: 720, n: 1, spread: 0.01, pierce: 3, life: 0.9, size: 7 }],
  bouncershotgun: ['Bouncer Shotgun', { type: 'shot', ammo: 'shell', tier: 3, rate: 1.3, dmg: 16.6, speed: 520, n: 5, spread: 0.5, pierce: 0, life: 1.4, size: 3, bounce: 3 }],
  flak: ['Flak Cannon', { type: 'shot', ammo: 'shell', tier: 3, rate: 1.1, dmg: 18.7, speed: 520, n: 4, spread: 0.5, pierce: 0, life: 0.5, size: 5, boom: 30, boomDmg: 18.7 }],
  eraser: ['Eraser', { type: 'shot', ammo: 'shell', tier: 5, rate: 2.2, dmg: 6.5, speed: 560, n: 14, spread: 0.55, pierce: 0, life: 0.4, size: 3 }],
  crossbow: ['Crossbow', { type: 'shot', ammo: 'bolt', tier: 2, rate: 1.4, dmg: 27.3, speed: 760, n: 1, spread: 0.01, pierce: 3, life: 1.2, size: 4 }],
  splinter: ['Splinter Gun', { type: 'shot', ammo: 'bolt', tier: 2, rate: 2.2, dmg: 6.4, speed: 640, n: 3, spread: 0.35, pierce: 2, life: 0.9, size: 3 }],
  autocrossbow: ['Auto Crossbow', { type: 'shot', ammo: 'bolt', tier: 3, rate: 3.4, dmg: 16.6, speed: 760, n: 1, spread: 0.06, pierce: 2, life: 1.1, size: 4 }],
  disc: ['Disc Gun', { type: 'shot', ammo: 'bolt', tier: 3, rate: 2.6, dmg: 26.9, speed: 560, n: 1, spread: 0.05, pierce: 0, life: 3, size: 5, bounce: 5 }],
  supersplinter: ['Super Splinter Gun', { type: 'shot', ammo: 'bolt', tier: 4, rate: 3, dmg: 5.1, speed: 660, n: 5, spread: 0.5, pierce: 2, life: 0.9, size: 3 }],
  heavycrossbow: ['Heavy Crossbow', { type: 'shot', ammo: 'bolt', tier: 4, rate: 1.0, dmg: 69.9, speed: 800, n: 1, spread: 0.01, pierce: 5, life: 1.2, size: 6 }],
  grenade: ['Grenade Launcher', { type: 'mortar', ammo: 'explosive', tier: 2, rate: 1.2, dmg: 43.3, r: 70, delay: 0.6, reach: 380 }],
  bazooka: ['Bazooka', { type: 'shot', ammo: 'explosive', tier: 3, rate: 0.9, dmg: 22.6, speed: 380, n: 1, spread: 0.02, pierce: 0, life: 1.6, size: 6, boom: 80, boomDmg: 69 }],
  rocket: ['Rocket Launcher', { type: 'shot', ammo: 'explosive', tier: 3, rate: 1.4, dmg: 14.7, speed: 460, n: 1, spread: 0.04, pierce: 0, life: 1.4, size: 5, boom: 62, boomDmg: 44.1 }],
  seeker: ['Seeker Launcher', { type: 'shot', ammo: 'explosive', tier: 4, rate: 1.2, dmg: 21.6, speed: 380, n: 1, spread: 0.1, pierce: 0, life: 1.8, size: 5, boom: 60, boomDmg: 72, homing: 4 }],
  heavygrenade: ['Heavy Grenade Launcher', { type: 'mortar', ammo: 'explosive', tier: 4, rate: 1.0, dmg: 95, r: 95, delay: 0.7, reach: 400 }],
  hyper: ['Hyper Launcher', { type: 'shot', ammo: 'explosive', tier: 5, rate: 6, dmg: 6.4, speed: 540, n: 1, spread: 0.1, pierce: 0, life: 1.0, size: 5, boom: 38, boomDmg: 19.1 }],
  nuke: ['Nuke Launcher', { type: 'shot', ammo: 'explosive', tier: 5, rate: 0.5, dmg: 86.7, speed: 300, n: 1, spread: 0.01, pierce: 0, life: 2.2, size: 8, boom: 140, boomDmg: 216.7, cost: 2 }],
  laserpistol: ['Laser Pistol', { type: 'shot', ammo: 'energy', tier: 1, rate: 3.5, dmg: 8, speed: 900, n: 1, spread: 0.02, pierce: 99, life: 0.5, size: 2 }],
  plasmagun: ['Plasma Gun', { type: 'shot', ammo: 'energy', tier: 2, rate: 2.4, dmg: 13, speed: 460, n: 1, spread: 0.05, pierce: 0, life: 1, size: 5, boom: 28, boomDmg: 10.8 }],
  lightningpistol: ['Lightning Pistol', { type: 'shot', ammo: 'energy', tier: 2, rate: 3.5, dmg: 10.9, speed: 800, n: 1, spread: 0.12, pierce: 3, life: 0.35, size: 3, homing: 6 }],
  laserrifle: ['Laser Rifle', { type: 'shot', ammo: 'energy', tier: 3, rate: 5, dmg: 10.3, speed: 1000, n: 1, spread: 0.02, pierce: 99, life: 0.5, size: 2 }],
  plasmarifle: ['Plasma Rifle', { type: 'shot', ammo: 'energy', tier: 3, rate: 3.4, dmg: 12.1, speed: 440, n: 1, spread: 0.05, pierce: 0, life: 1, size: 6, boom: 36, boomDmg: 10.6 }],
  lightningrifle: ['Lightning Rifle', { type: 'shot', ammo: 'energy', tier: 3, rate: 3, dmg: 8.6, speed: 800, n: 2, spread: 0.4, pierce: 3, life: 0.4, size: 3, homing: 6 }],
  plasmacannon: ['Plasma Cannon', { type: 'shot', ammo: 'energy', tier: 4, rate: 1.1, dmg: 33.2, speed: 420, n: 1, spread: 0.02, pierce: 0, life: 1.2, size: 9, boom: 90, boomDmg: 66.4, cost: 2 }],
  lightningcannon: ['Lightning Cannon', { type: 'shot', ammo: 'energy', tier: 4, rate: 1.3, dmg: 53.7, speed: 800, n: 1, spread: 0.1, pierce: 5, life: 0.6, size: 6, homing: 8, cost: 2 }],
  maw: ['Maw Gun', { type: 'shot', ammo: 'shell', tier: 5, art: 'maw', rate: 1.3, dmg: 10.4, speed: 540, n: 12, spread: 0.6, pierce: 2, life: 0.45, size: 4 }],
  needle: ['Needle Storm', { type: 'shot', ammo: 'energy', tier: 5, art: 'needle', rate: 10, dmg: 4.8, speed: 1000, n: 2, spread: 0.2, pierce: 99, life: 0.5, size: 2, cost: 0.5 }],
  eggcannon: ['Egg Cannon', { type: 'shot', ammo: 'explosive', tier: 5, art: 'egg', rate: 1.0, dmg: 38.2, speed: 340, n: 1, spread: 0.03, pierce: 0, life: 1.8, size: 7, bounce: 2, boom: 70, boomDmg: 114.6 }],
  boilercannon: ['Boiler Cannon', { type: 'shot', ammo: 'explosive', tier: 5, art: 'boiler', rate: 0.7, dmg: 66.4, speed: 360, n: 1, spread: 0.02, pierce: 0, life: 1.6, size: 9, boom: 120, boomDmg: 149.4, cost: 2 }],
  wrench: ['Wrench', { type: 'cone', tier: 0, rate: 3, dmg: 6.2, range: 70, arc: 1.6 }],
  shovel: ['Shovel', { type: 'cone', tier: 0, rate: 2.4, dmg: 7.7, range: 76, arc: 1.9 }],
  bat: ['Baseball Bat', { type: 'cone', tier: 1, rate: 2.2, dmg: 12.3, range: 80, arc: 1.8 }],
  machete: ['Machete', { type: 'cone', tier: 1, rate: 2.4, dmg: 11.3, range: 86, arc: 2 }],
  screwdriver: ['Screwdriver', { type: 'lance', tier: 1, rate: 4, dmg: 6.8, reach: 95, width: 14 }],
  axe: ['Axe', { type: 'cone', tier: 2, rate: 1.7, dmg: 21.8, range: 84, arc: 1.8 }],
  sledge: ['Sledgehammer', { type: 'cone', tier: 2, rate: 1.0, dmg: 37.1, range: 92, arc: 2.4 }],
  chainsaw: ['Chainsaw', { type: 'cone', tier: 3, rate: 12, dmg: 4.2, range: 60, arc: 1.5 }],
  katana: ['Katana', { type: 'cone', tier: 3, rate: 3.2, dmg: 15.6, range: 104, arc: 2.2 }],
  energysword: ['Energy Sword', { type: 'cone', tier: 4, rate: 3, dmg: 22.6, range: 112, arc: 2.4 }],
  energyhammer: ['Energy Hammer', { type: 'cone', tier: 5, rate: 1.4, dmg: 66.3, range: 100, arc: 2.6 }],
};
for (const [id, [name, w]] of Object.entries(POOL_WEAPONS)) HEROES['w_' + id] = { clan: 'steam', name, cost: 99999, blurb: '', weapon: Object.assign({ name }, w), ability: NO_ABILITY, mod() {}, pool: true };

// ammo types (like the original: bullets, shells, bolts, explosives, energy); melee weapons need none
const AMMO = {
  bullet: { name: 'BULLETS', col: '#ffd91f', max: 200, amt: 50, L: 'B' },
  shell: { name: 'SHELLS', col: '#ff6a6a', max: 60, amt: 10, L: 'S' },
  bolt: { name: 'BOLTS', col: '#39ff6e', max: 60, amt: 10, L: 'T' },
  explosive: { name: 'EXPLOSIVES', col: '#ff8a1f', max: 60, amt: 8, L: 'X' },
  energy: { name: 'ENERGY', col: '#3de8ff', max: 90, amt: 15, L: 'E' },
};
const startAmmo = () => ({ bullet: 150, shell: 24, bolt: 24, explosive: 20, energy: 40 });
function ammoOf(w) {
  if (w.ammo !== undefined) return w.ammo;
  if (w.type === 'mortar') return 'explosive';
  if (w.type !== 'shot') return null;
  return w.n >= 3 ? 'shell' : w.pierce >= 2 ? 'bolt' : w.homing ? 'energy' : 'bullet';
}
function weaponTier(id) {
  const w = HEROES[id].weapon; if (w.tier !== undefined) return w.tier;
  const dps = w.dmg * (w.rate || 2) * (w.type === 'blades' ? w.n * 0.7 : w.n || 1) * (w.type === 'mortar' ? 1.3 : 1) * (w.pierce ? 1 + 0.25 * Math.min(w.pierce, 4) : 1);
  return clamp(Math.floor((dps - 20) / 12), 0, 5);
}

// Loadout: a hero can borrow the weapon and/or ability of any unlocked hero of the same clan
function kitOf(run) {
  const h = HEROES[run.hero], w = HEROES[run.wpn], a = HEROES[run.abl];
  return { weapon: (w || h).weapon, ability: (a || h).ability };
}

// ---------- Perks ----------
// rarity: common / rare / epic / legendary. tags feed the synergies below. lock = core cost to unlock in the Armory (omit = available from the start).
// clan = only offered to that clan.
const RARITY = { common: { w: 60, c: '#9fb4c8', price: 40 }, rare: { w: 28, c: '#3d9bff', price: 75 }, epic: { w: 10, c: '#b24bff', price: 130 }, legendary: { w: 3, c: '#ffd91f', price: 200 } };
const TAGS = { toxic: '#7dff4a', blast: '#ff8a1f', swift: '#3de8ff', vital: '#ff6a8a', orbit: '#b24bff', crit: '#ffd91f', tech: '#9fb4c8' };
// ---------- Mutations (the level-up upgrades): pick 1 of 4 at every level, each only once per run, like the original ----------
const PERKS = {
  rhino: { name: 'Rhino Skin', tags: [], r: 'common', d: '+4 hearts and heal 4 hearts.', heal: 40, a: P => { P.maxhp += 40; } },
  extrafeet: { name: 'Extra Feet', tags: [], r: 'common', d: 'You move 18% faster.', a: P => { P.speed *= 1.18; } },
  plutonium: { name: 'Plutonium Hunger', tags: [], r: 'common', d: 'Rads and loot fly to you from much further away.', a: P => { P.magnet *= 1.7; } },
  rabbit: { name: 'Rabbit Paw', tags: [], r: 'common', d: 'Enemies drop more ammo, health and weapons.', a: P => { P.dropMul *= 1.4; } },
  thronebutt: { name: 'Throne Butt', tags: [], r: 'common', d: 'Your active ability recharges 30% faster.', a: P => { P.abCd *= 0.7; } },
  lucky: { name: 'Lucky Shot', tags: [], r: 'common', d: '+10% chance for critical hits.', a: P => { P.crit += 0.1; } },
  bloodlust: { name: 'Bloodlust', tags: [], r: 'common', d: '12% chance to heal a heart when you kill something.', a: P => { P.bloodlust += 0.12; } },
  gamma: { name: 'Gamma Guts', tags: [], r: 'common', d: 'Enemies close to you take radiation damage.', a: P => { P.aura += 14; } },
  stomach: { name: 'Second Stomach', tags: [], r: 'common', d: 'Health pickups heal 60% more.', a: P => { P.healMul *= 1.6; } },
  back: { name: 'Back Muscle', tags: [], r: 'common', d: 'You can carry 40% more ammo.', a: P => { P.ammoCap *= 1.4; } },
  scarier: { name: 'Scarier Face', tags: [], r: 'common', d: 'Enemies have 15% less health.', a: P => { P.dmg *= 1.18; } },
  euphoria: { name: 'Euphoria', tags: [], r: 'common', d: 'Enemies move 15% slower.', a: P => { P.foeSlow *= 0.85; } },
  longarms: { name: 'Long Arms', tags: [], r: 'common', d: 'Melee reach and bullet range +30%.', a: P => { P.range *= 1.3; } },
  boiling: { name: 'Boiling Veins', tags: [], r: 'common', d: 'Explosions cannot hurt you. Your blasts are 10% wider.', a: P => { P.blastImmune = 1; P.blastRad *= 1.1; } },
  shotgunsh: { name: 'Shotgun Shoulders', tags: [], r: 'common', d: 'Shells hit 30% harder.', a: P => { P.shellMul *= 1.3; } },
  recycle: { name: 'Recycle Gland', tags: [], r: 'common', d: '25% chance that a shot costs no ammo.', a: P => { P.refund += 0.25; } },
  laserbrain: { name: 'Laser Brain', tags: [], r: 'common', d: 'Energy weapons hit 35% harder.', a: P => { P.energyMul *= 1.35; } },
  lastwish: { name: 'Last Wish', tags: [], r: 'common', d: 'Fully heal right now.', full: true, a: P => { } },
  eagle: { name: 'Eagle Eyes', tags: [], r: 'common', d: 'Your shots are much more accurate and fly further.', a: P => { P.spreadMul *= 0.4; P.range *= 1.15; } },
  impact: { name: 'Impact Wrists', tags: [], r: 'common', d: 'Your shots knock enemies back much harder.', a: P => { P.knockMul *= 2.2; } },
  boltmarrow: { name: 'Bolt Marrow', tags: [], r: 'common', d: 'Bolts home in on enemies.', a: P => { P.boltHoming += 4; } },
  stress: { name: 'Stress', tags: [], r: 'common', d: 'The lower your health, the faster you shoot (up to +60%).', a: P => { P.stress += 0.6; } },
  trigger: { name: 'Trigger Fingers', tags: [], r: 'common', d: 'You shoot 25% faster.', a: P => { P.rate *= 1.25; } },
  sharp: { name: 'Sharp Teeth', tags: [], r: 'common', d: 'All your weapons hit 15% harder.', a: P => { P.dmg *= 1.15; } },
  hammer: { name: 'Hammerhead', tags: [], r: 'common', d: 'Dashing through enemies hurts them.', a: P => { P.dashDmg += 35; } },
  strong: { name: 'Strong Spirit', tags: [], r: 'common', d: 'A second life: once, you come back with half health.', a: P => { P.phoenix = 1; } },
  open: { name: 'Open Mind', tags: [], r: 'common', d: 'One more mutation to choose from at every level.', a: P => { P.choices += 1; } },
  heavy: { name: 'Heavy Heart', tags: [], r: 'common', d: 'Explosions are 20% wider, +10% damage.', a: P => { P.blastRad *= 1.2; P.dmg *= 1.1; } },
  patience: { name: 'Patience', tags: [], r: 'common', d: 'You take 15% less damage.', a: P => { P.taken *= 0.85; } },
};

// ---------- Set bonuses: collect N perks of a tag ----------
const SYN = {
  toxic: { n: 3, name: 'Plague', d: 'Poison ticks 50% faster and slows enemies.', a: P => { P.poisonMul *= 1.5; P.poisonSlow = 1; } },
  blast: { n: 3, name: 'Demolition', d: 'All explosions deal +40% damage.', a: P => { P.blastMul *= 1.4; } },
  swift: { n: 3, name: 'Slipstream', d: 'Dashing leaves a trail that burns enemies.', a: P => { P.trail = 1; } },
  vital: { n: 3, name: 'Lifeblood', d: '+30 max HP and +1 regen.', a: P => { P.maxhp += 30; P.regen += 1; } },
  orbit: { n: 3, name: 'Gyroscope', d: 'Blades knock enemies back and deflect bullets.', a: P => { P.bladeKnock = 1; P.blades += 1; } },
  crit: { n: 3, name: 'Executioner', d: 'Crits against weakened enemies (<30% HP) kill instantly.', a: P => { P.execute = 1; } },
  tech: { n: 3, name: 'Overdrive', d: '+20% attack speed and +1 pierce.', a: P => { P.rate *= 1.2; P.pierce += 1; } },
};

// ---------- Drawbacks (altar trades, persist for the run) ----------
const DRAWBACKS = {
  frail: { name: 'Frail', d: '-20% max HP.', a: P => { P.maxhp *= 0.8; } },
  sluggish: { name: 'Sluggish', d: '-12% move speed.', a: P => { P.speed *= 0.88; } },
  exposed: { name: 'Exposed', d: 'Take +20% damage.', a: P => { P.taken *= 1.2; } },
  dull: { name: 'Dull Edge', d: '-12% damage.', a: P => { P.dmg *= 0.88; } },
  hunted: { name: 'Hunted', d: 'All enemies have +15% HP.', a: P => { P.enemyHp *= 1.15; } },
  hexed: { name: 'Hexed', d: 'No healing from clearing rooms or resting.', a: P => { P.noHeal = 1; } },
  slowhand: { name: 'Heavy Hands', d: '-12% attack speed.', a: P => { P.rate *= 0.88; } },
};

// ---------- Room curses (risk rooms): worse fight, better reward ----------
const CURSES = {
  frenzy: { name: 'Frenzy', d: 'Enemies move 40% faster.', speed: 1.4 },
  ironhide: { name: 'Ironhide', d: 'Enemies have +60% HP.', hp: 1.6 },
  swarm: { name: 'Swarm', d: '+50% more enemies.', count: 1.5 },
  deadly: { name: 'Deadly', d: 'Enemies deal +60% damage.', dmg: 1.6 },
  fragile: { name: 'Blood Pact', d: 'Your max HP is halved during this room.', halfhp: true },
};

// ---------- Hero skill tree: spend cores per hero. Every hero has the same budget of RANK_CAP levels, so you have to choose. ----------
const RANK_CAP = 8;
const TREE = {
  power: { name: 'Power', branch: 'Offense', d: '+6% damage per level.', max: 3, a: (P, l) => { P.dmg *= 1 + 0.06 * l; } },
  tempo: { name: 'Tempo', branch: 'Offense', d: '+6% attack speed per level.', max: 3, a: (P, l) => { P.rate *= 1 + 0.06 * l; } },
  precision: { name: 'Precision', branch: 'Offense', d: '+3% crit chance per level.', max: 3, a: (P, l) => { P.crit += 0.03 * l; } },
  hull: { name: 'Hull', branch: 'Defense', d: '+10 max HP per level.', max: 3, a: (P, l) => { P.maxhp += 10 * l; } },
  ward: { name: 'Ward', branch: 'Defense', d: '-4% damage taken per level.', max: 3, a: (P, l) => { P.taken *= 1 - 0.04 * l; } },
  mend: { name: 'Mend', branch: 'Defense', d: '+0.4 HP regen per level.', max: 3, a: (P, l) => { P.regen += 0.4 * l; } },
  agility: { name: 'Agility', branch: 'Utility', d: '+4% move speed per level.', max: 3, a: (P, l) => { P.speed *= 1 + 0.04 * l; } },
  focus: { name: 'Focus', branch: 'Utility', d: '-7% ability cooldown per level.', max: 3, a: (P, l) => { P.abCd *= 1 - 0.07 * l; } },
  greed: { name: 'Greed', branch: 'Utility', d: '+10% gold from enemies per level.', max: 3, a: (P, l) => { P.goldMul *= 1 + 0.1 * l; } },
};
const treeCost = l => 50 * (l + 1);
const treeRank = t => Object.values(t || {}).reduce((a, b) => a + b, 0);

// ---------- Meta upgrades (small, capped) ----------
const META_UPS = {
  vit: { name: 'Vitality', d: '+0.5 heart per level.', max: 4, cost: l => 60 * (l + 1), a: (P, l) => { P.maxhp += 5 * l; } },
  fort: { name: 'Fortune', d: '+25 starting gold per level.', max: 4, cost: l => 50 * (l + 1), a: () => {} },
  reflex: { name: 'Reflexes', d: '-4% dash cooldown per level.', max: 4, cost: l => 70 * (l + 1), a: (P, l) => { P.dashCd *= 1 - 0.04 * l; } },
  salvage: { name: 'Salvage', d: 'Keep +8% more cores when you die (per level).', max: 3, cost: l => 90 * (l + 1), a: () => {} },
};

// ---------- Enemies ----------
const ENEMY = {
  grunt:   { name: 'Crawler', hp: 26, speed: 92, r: 12, dmg: 10, cost: 1, col: '#ff2d3d' },
  shooter: { name: 'Gunner', hp: 22, speed: 70, r: 12, dmg: 10, cost: 2, col: '#ffd91f' },
  dasher:  { name: 'Lancer', hp: 34, speed: 80, r: 13, dmg: 20, cost: 2, col: '#ff8a1f' },
  bomber:  { name: 'Bomber', hp: 24, speed: 128, r: 13, dmg: 30, cost: 2, col: '#ff9aa6' },
  tank:    { name: 'Crusher', hp: 130, speed: 52, r: 20, dmg: 20, cost: 4, col: '#a01828' },
  swarmer: { name: 'Swarmer', hp: 11, speed: 150, r: 9, dmg: 10, cost: 1, col: '#ff7a3a', ai: 'grunt' },
  spitter: { name: 'Spitter', hp: 30, speed: 66, r: 12, dmg: 7, cost: 3, col: '#7dd04a' },
  blob:    { name: 'Blob', hp: 70, speed: 60, r: 17, dmg: 15, cost: 3, col: '#c0763a', ai: 'grunt', splits: true },
  sniper:  { name: 'Sniper', hp: 26, speed: 60, r: 12, dmg: 20, cost: 4, col: '#c04aff' },
  rat:     { name: 'Rat', hp: 18, speed: 130, r: 10, dmg: 10, cost: 2, col: '#b08a6a', ai: 'dasher', blood: '#6a3a1a' },
  maggot:  { name: 'Maggot', hp: 9, speed: 48, r: 8, dmg: 10, cost: 1, col: '#d8c070', ai: 'grunt', blood: '#a08a2a' },
  turret:  { name: 'Turret', hp: 60, speed: 0, r: 14, dmg: 8, cost: 3, col: '#a0a0b0', blood: '#555a66' },
};
Object.assign(ENEMY.spitter, { blood: '#3f7a1f' }); Object.assign(ENEMY.swarmer, { blood: '#a04a1a' }); Object.assign(ENEMY.blob, { blood: '#7a4a1f' }); Object.assign(ENEMY.sniper, { blood: '#6a1fa0' });
// every area has its own cast (like the original), the boss summons from the same list
const AREA_ENEMIES = [
  ['grunt', 'shooter', 'rat', 'swarmer', 'maggot'],
  ['swarmer', 'spitter', 'blob', 'grunt', 'maggot'],
  ['tank', 'dasher', 'bomber', 'turret', 'shooter', 'grunt'],
  ['sniper', 'shooter', 'rat', 'blob', 'dasher', 'tank'],
  ['turret', 'sniper', 'spitter', 'swarmer', 'bomber', 'dasher'],
  ['grunt', 'shooter', 'dasher', 'bomber', 'tank', 'swarmer', 'spitter', 'blob', 'sniper', 'turret', 'rat'],
];
const ELITE_MODS = {
  shield: { name: 'Shielded', col: '#3de8ff' },
  swift: { name: 'Swift', col: '#39ff6e' },
  split: { name: 'Splitting', col: '#b24bff' },
  volatile: { name: 'Volatile', col: '#ff8a1f' },
};
const ACT_NAMES = ['The Ruins', 'The Sewers', 'The Foundry', 'The Frozen Wastes', 'The Glass Labs', 'Apocalypse Core'];
const ACT_COL = [['#0e1430', '#17407a'], ['#0e2a14', '#2a7a3a'], ['#2a1208', '#7a3a17'], ['#10202e', '#5aa0d0'], ['#0a2828', '#2ac0b0'], ['#1c0a2a', '#6a1fd0']];
const DUST_COL = ['#b0a890', '#9aff7a', '#ff9a4a', '#e0f4ff', '#7affe0', '#c070ff'];
const BOSSES = [
  { name: 'The Warden', hp: 2300, r: 32, col: '#ff2d3d', phases: [['ring', 'aimed', 'charge'], ['ring', 'aimed', 'charge', 'spiral'], ['ring', 'aimed', 'charge', 'spiral', 'summon']] },
  { name: 'Sludge Mother', hp: 3300, r: 36, col: '#7dff4a', phases: [['aimed', 'slam', 'summon'], ['aimed', 'slam', 'summon', 'spiral'], ['spiral', 'slam', 'summon', 'sweep']] },
  { name: 'Hive Engine', hp: 4200, r: 36, col: '#ff8a1f', phases: [['aimed', 'slam', 'summon'], ['aimed', 'slam', 'summon', 'sweep'], ['spiral', 'slam', 'sweep', 'summon']] },
  { name: 'Frost Colossus', hp: 5400, r: 38, col: '#8ae8ff', phases: [['ring', 'charge', 'aimed'], ['ring', 'charge', 'sweep', 'spiral'], ['ring', 'spiral', 'charge', 'sweep', 'slam']] },
  { name: 'Glass Warden', hp: 6400, r: 36, col: '#3de8c8', phases: [['aimed', 'sweep', 'spiral'], ['aimed', 'sweep', 'spiral', 'summon'], ['spiral', 'sweep', 'summon', 'charge']] },
  { name: 'Apocalypse Core', hp: 8000, r: 40, col: '#b24bff', phases: [['ring', 'slam', 'charge', 'sweep'], ['spiral', 'aimed', 'slam', 'sweep', 'summon'], ['ring', 'spiral', 'charge', 'sweep', 'slam', 'summon']] },
];

// ---------- Stat sheet ----------
function newStats() {
  return { dmg: 1, rate: 1.3, speed: 1, maxhp: 80, pierce: 0, extra: 0, crit: 0.05, critMul: 1.75, killHeal: 0, regen: 0, dashCd: 1, dashDmg: 0, range: 1,
    blades: 0, spin: 1, bladeDmg: 1, orbitR: 1, bladeKnock: 0, poison: 0, poisonMul: 1, poisonSlow: 0, poisonSpread: 0, poisonLeech: 0, burn: 0, killBlast: 0, blastRad: 1, blastMul: 1,
    chain: 0, thorns: 0, taken: 1, goldMul: 1, aura: 0, clearHeal: 0, enemyHp: 1, noHeal: 0, homing: 0, phoenix: 0, dashBlast: 0, critBlast: 0, berserk: 0, still: 0,
    mutagen: 0, trail: 0, execute: 0, abCd: 1, ammoMul: 1, magnet: 1, dual: 0, xpMul: 1, ammoCost: 1, dropMul: 1, lootTier: 0, choices: 0, healMul: 1, ammoCap: 1, foeSlow: 1, refund: 0, shellMul: 1, energyMul: 1, spreadMul: 1, knockMul: 1, stress: 0, blastImmune: 0, bloodlust: 0, boltHoming: 0, tags: {} };
}
function buildStats(run, save) {
  const hero = HEROES[run.hero], P = newStats();
  CLANS[hero.clan].mod(P);
  if (hero.mod) hero.mod(P);
  for (const [k, l] of Object.entries(save.meta || {})) if (META_UPS[k] && l) META_UPS[k].a(P, l);
  for (const id of run.perks) { const pk = PERKS[id]; pk.a(P); for (const t of pk.tags) P.tags[t] = (P.tags[t] || 0) + 1; }
  if (clanPerkCount(run) >= CLAN_SET[run.clan].n) CLAN_SET[run.clan].a(P);
  for (const [k, l] of Object.entries((save.tree && save.tree[run.hero]) || {})) if (TREE[k] && l) TREE[k].a(P, l);
  for (const id in P.tags) if (SYN[id] && P.tags[id] >= SYN[id].n) SYN[id].a(P);
  for (const id of run.drawbacks) DRAWBACKS[id].a(P);
  if (run.ultra != null && hero.ultras && hero.ultras[run.ultra]) hero.ultras[run.ultra].a(P);
  P.maxhp += (run.bonus && run.bonus.hp) || 0;
  P.maxhp = Math.round(P.maxhp);
  return P;
}
function activeSyn(P) { return Object.keys(SYN).filter(t => (P.tags[t] || 0) >= SYN[t].n); }
