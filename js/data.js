// Static game data: clans, heroes, perks, drawbacks, curses, synergies, enemies. Everything data-driven, so new content = new entries.
const W = 960, H = 540;
const ARENA = { x0: 26, y0: 58, x1: 934, y1: 514 };

// a run is a chain of levels (run.act counts them): 3 levels per area, the third is the boss level; after 3 areas the run loops
const areaOf = a => Math.floor(a / 3) % 3, isBossLevel = a => a % 3 === 2;

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
const PERKS = {
  venom: { name: 'Venom Tips', tags: ['toxic'], r: 'common', d: 'Hits poison for 4 dmg/s.', a: P => { P.poison += 4; } },
  caustic: { name: 'Caustic Glands', tags: ['toxic'], r: 'common', d: 'Poison deals +50% damage.', a: P => { P.poisonMul *= 1.5; } },
  spore_burst: { name: 'Spore Burst', tags: ['toxic'], r: 'rare', lock: 200, d: 'Poisoned enemies spread poison when they die.', a: P => { P.poisonSpread = 1; } },
  blastcaps: { name: 'Blast Caps', tags: ['blast'], r: 'common', d: 'Kills explode for 18 damage.', a: P => { P.killBlast += 18; } },
  widebang: { name: 'Wide Bang', tags: ['blast'], r: 'rare', d: 'Explosions are 50% wider.', a: P => { P.blastRad *= 1.5; } },
  brand: { name: 'Fire Brand', tags: ['blast'], r: 'rare', d: 'Hits burn for 6 dmg/s.', a: P => { P.burn += 6; } },
  gravwell: { name: 'Impact Dash', tags: ['blast', 'swift'], r: 'epic', lock: 250, d: 'Dashing ends in a 40 damage blast.', a: P => { P.dashBlast = 1; } },
  quickfeet: { name: 'Quick Feet', tags: ['swift'], r: 'common', d: '+10% move speed.', a: P => { P.speed *= 1.1; } },
  adrenal: { name: 'Adrenal Gland', tags: ['swift'], r: 'common', d: '-20% dash cooldown.', a: P => { P.dashCd *= 0.8; } },
  phasedash: { name: 'Phase Dash', tags: ['swift'], r: 'rare', d: 'Dash damages everything you pass for 25.', a: P => { P.dashDmg += 25; } },
  tough: { name: 'Toughness', tags: ['vital'], r: 'common', d: '+20 max HP.', a: P => { P.maxhp += 20; } },
  regen: { name: 'Regeneration', tags: ['vital'], r: 'common', d: 'Regain 1 HP per second.', a: P => { P.regen += 1; } },
  bloodlust: { name: 'Bloodlust', tags: ['vital'], r: 'rare', d: 'Heal 1 HP every 4 kills.', a: P => { P.killHeal += 0.25; } },
  thornskin: { name: 'Thorn Skin', tags: ['vital'], r: 'rare', d: 'Attackers take 15 damage when they hit you.', a: P => { P.thorns += 15; } },
  phoenix: { name: 'Phoenix Core', tags: ['vital'], r: 'legendary', lock: 300, d: 'Once per run, revive with 50% HP.', a: P => { P.phoenix = 1; } },
  blade: { name: 'Extra Blade', tags: ['orbit'], r: 'common', d: '+1 orbiting blade (spawns one if you have none).', a: P => { P.blades += 1; } },
  spinup: { name: 'Spin-Up', tags: ['orbit'], r: 'common', d: 'Blades spin 30% faster and hit harder.', a: P => { P.spin *= 1.3; P.bladeDmg *= 1.15; } },
  storm: { name: 'Orbital Storm', tags: ['orbit'], r: 'epic', lock: 200, d: '+2 blades and a wider orbit.', a: P => { P.blades += 2; P.orbitR *= 1.2; } },
  razor: { name: 'Razor Edge', tags: ['crit'], r: 'common', d: '+10% crit chance.', a: P => { P.crit += 0.1; } },
  lethal: { name: 'Lethal Precision', tags: ['crit'], r: 'rare', d: 'Crits deal +50% more.', a: P => { P.critMul += 0.5; } },
  glass: { name: 'Glass Cannon', tags: ['crit'], r: 'epic', lock: 150, d: '+50% damage, -35% max HP.', a: P => { P.dmg *= 1.5; P.maxhp *= 0.65; } },
  critblast: { name: 'Overcharge', tags: ['crit', 'blast'], r: 'epic', lock: 250, d: 'Crits explode.', a: P => { P.critBlast = 1; } },
  multi: { name: 'Multishot', tags: ['tech'], r: 'rare', d: '+1 projectile / thrust / shell / wider claws.', a: P => { P.extra += 1; } },
  pierce: { name: 'Piercing Rounds', tags: ['tech'], r: 'common', d: '+1 pierce, bigger blasts, wider thrusts.', a: P => { P.pierce += 1; P.blastRad *= 1.1; } },
  overclock: { name: 'Overclock', tags: ['tech'], r: 'common', d: '+15% attack speed.', a: P => { P.rate *= 1.15; } },
  heavy: { name: 'Heavy Hitter', tags: ['tech'], r: 'common', d: '+15% damage.', a: P => { P.dmg *= 1.15; } },
  magnet: { name: 'Scavenger', tags: ['tech'], r: 'common', d: '+30% gold from enemies.', a: P => { P.goldMul *= 1.3; } },
  chain: { name: 'Chain Lightning', tags: ['tech'], r: 'rare', lock: 150, d: '25% chance for hits to arc to a nearby enemy.', a: P => { P.chain += 0.25; } },
  berserk: { name: 'Berserker', tags: ['swift', 'vital'], r: 'epic', lock: 200, d: 'Up to +60% damage as your HP drops.', a: P => { P.berserk = 1; } },
  // clan perks
  mutagen: { name: 'Mutagen', clan: 'bio', tags: ['toxic', 'vital'], r: 'epic', d: 'Every 10 kills: +2% damage for the rest of the run.', a: P => { P.mutagen = 1; } },
  symbiote: { name: 'Symbiote', clan: 'bio', tags: ['toxic', 'vital'], r: 'rare', d: 'Poison damage heals you for 8% of itself.', a: P => { P.poisonLeech = 0.08; } },
  boilerup: { name: 'Pressure Chamber', clan: 'steam', tags: ['blast', 'tech'], r: 'epic', d: 'Standing still for 0.6s: +50% damage.', a: P => { P.still = 1; } },
  vents: { name: 'Steam Vents', clan: 'steam', tags: ['blast'], r: 'rare', d: 'Kill blasts +12 damage and burn.', a: P => { P.killBlast += 12; P.burn += 4; } },
  bloom: { name: 'Bloom', clan: 'solar', tags: ['vital'], r: 'rare', d: 'Heal +20% max HP after every cleared room.', a: P => { P.clearHeal += 0.2; } },
  radiance: { name: 'Radiance', clan: 'solar', tags: ['vital', 'blast'], r: 'epic', d: 'Enemies close to you burn for 14 dmg/s.', a: P => { P.aura += 14; } },
  ghost: { name: 'Ghost Protocol', clan: 'cyber', tags: ['swift', 'crit'], r: 'epic', d: 'Dash cooldown halved and dashing damages for 25.', a: P => { P.dashCd *= 0.5; P.dashDmg += 25; } },
  overload: { name: 'Overload', clan: 'cyber', tags: ['tech', 'crit'], r: 'rare', d: '+25% attack speed, +15% damage taken.', a: P => { P.rate *= 1.25; P.taken *= 1.15; } },
  targeting: { name: 'Targeting AI', clan: 'cyber', tags: ['tech', 'crit'], r: 'rare', d: '+15% crit, projectiles home in.', a: P => { P.crit += 0.15; P.homing += 2; } },
  rotbloom: { name: 'Rot Bloom', clan: 'bio', tags: ['toxic', 'vital'], r: 'rare', d: 'Poison +3 and heals you for 4% of its damage.', a: P => { P.poison += 3; P.poisonLeech += 0.04; } },
  apexmut: { name: 'Apex Mutation', clan: 'bio', tags: ['toxic', 'crit'], r: 'epic', d: 'Poison +25% damage, +10% crit.', a: P => { P.poisonMul *= 1.25; P.crit += 0.1; } },
  carapace: { name: 'Chitin Carapace', clan: 'bio', tags: ['vital'], r: 'rare', d: '+30 max HP, +10 thorns, -5% move speed.', a: P => { P.maxhp += 30; P.thorns += 10; P.speed *= 0.95; } },
  furnace: { name: 'Furnace Heart', clan: 'steam', tags: ['blast'], r: 'rare', d: 'Hits burn for +5 dmg/s, explosions 25% wider.', a: P => { P.burn += 5; P.blastRad *= 1.25; } },
  pistonfist: { name: 'Piston Fists', clan: 'steam', tags: ['tech'], r: 'rare', d: '+25% damage, -10% attack speed.', a: P => { P.dmg *= 1.25; P.rate *= 0.9; } },
  overpressure: { name: 'Overpressure', clan: 'steam', tags: ['blast', 'tech'], r: 'epic', d: 'Kill blasts +25 damage and +1 pierce.', a: P => { P.killBlast += 25; P.pierce += 1; } },
  photosyn: { name: 'Photosynthesis', clan: 'solar', tags: ['vital'], r: 'rare', d: 'Regain 2 HP per second.', a: P => { P.regen += 2; } },
  prismlens: { name: 'Prism Lens', clan: 'solar', tags: ['tech', 'crit'], r: 'rare', d: '+1 projectile, +10% crit.', a: P => { P.extra += 1; P.crit += 0.1; } },
  dawncrown: { name: 'Dawn Crown', clan: 'solar', tags: ['vital', 'blast'], r: 'epic', d: 'Heal +10% after every cleared room, +20% damage.', a: P => { P.clearHeal += 0.1; P.dmg *= 1.2; } },
  chrome: { name: 'Chrome Plating', clan: 'cyber', tags: ['vital', 'tech'], r: 'rare', d: 'Take 15% less damage.', a: P => { P.taken *= 0.85; } },
  zeroday: { name: 'Zero Day', clan: 'cyber', tags: ['crit', 'tech'], r: 'epic', d: 'Crits deal +60% more, 20% chance to arc.', a: P => { P.critMul += 0.6; P.chain += 0.2; } },
  servo: { name: 'Servo Legs', clan: 'cyber', tags: ['swift'], r: 'rare', d: '+15% move speed, -15% dash cooldown.', a: P => { P.speed *= 1.15; P.dashCd *= 0.85; } },
  riftstep: { name: 'Rift Step', clan: 'void', tags: ['swift'], r: 'rare', d: 'Dash damage +30.', a: P => { P.dashDmg += 30; } },
  singularity: { name: 'Singularity', clan: 'void', tags: ['blast'], r: 'epic', d: 'Explosions 40% wider, kill blasts +15.', a: P => { P.blastRad *= 1.4; P.killBlast += 15; } },
  umbralcloak: { name: 'Umbral Cloak', clan: 'void', tags: ['vital', 'swift'], r: 'rare', d: 'Take 12% less damage, +8% move speed.', a: P => { P.taken *= 0.88; P.speed *= 1.08; } },
  eclipseperk: { name: 'Eclipse', clan: 'void', tags: ['crit'], r: 'epic', d: '+20% crit, crits deal +40% more.', a: P => { P.crit += 0.2; P.critMul += 0.4; } },
  darkmatter: { name: 'Dark Matter', clan: 'void', tags: ['tech'], r: 'rare', d: '+15% damage, projectiles home in.', a: P => { P.dmg *= 1.15; P.homing += 1; } },
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
  vit: { name: 'Vitality', d: '+8 max HP per level.', max: 5, cost: l => 60 * (l + 1), a: (P, l) => { P.maxhp += 8 * l; } },
  fort: { name: 'Fortune', d: '+25 starting gold per level.', max: 4, cost: l => 50 * (l + 1), a: () => {} },
  reflex: { name: 'Reflexes', d: '-4% dash cooldown per level.', max: 4, cost: l => 70 * (l + 1), a: (P, l) => { P.dashCd *= 1 - 0.04 * l; } },
  salvage: { name: 'Salvage', d: 'Keep +8% more cores when you die (per level).', max: 3, cost: l => 90 * (l + 1), a: () => {} },
};

// ---------- Enemies ----------
const ENEMY = {
  grunt:   { name: 'Crawler', hp: 26, speed: 92, r: 12, dmg: 9, cost: 1, col: '#ff2d3d' },
  shooter: { name: 'Gunner', hp: 22, speed: 70, r: 12, dmg: 10, cost: 2, col: '#ffd91f' },
  dasher:  { name: 'Lancer', hp: 34, speed: 80, r: 13, dmg: 16, cost: 2, col: '#ff8a1f' },
  bomber:  { name: 'Bomber', hp: 24, speed: 128, r: 13, dmg: 26, cost: 2, col: '#ff9aa6' },
  tank:    { name: 'Crusher', hp: 130, speed: 52, r: 20, dmg: 22, cost: 4, col: '#a01828' },
};
const ELITE_MODS = {
  shield: { name: 'Shielded', col: '#3de8ff' },
  swift: { name: 'Swift', col: '#39ff6e' },
  split: { name: 'Splitting', col: '#b24bff' },
  volatile: { name: 'Volatile', col: '#ff8a1f' },
};
const ACT_NAMES = ['The Ruins', 'The Foundry', 'Apocalypse Core'];
const ACT_COL = [['#0e1430', '#17407a'], ['#2a1208', '#7a3a17'], ['#1c0a2a', '#6a1fd0']];
const BOSSES = [
  { name: 'The Warden', hp: 2300, r: 32, col: '#ff2d3d', phases: [['ring', 'aimed', 'charge'], ['ring', 'aimed', 'charge', 'spiral'], ['ring', 'aimed', 'charge', 'spiral', 'summon']] },
  { name: 'Hive Engine', hp: 4200, r: 36, col: '#ff8a1f', phases: [['aimed', 'slam', 'summon'], ['aimed', 'slam', 'summon', 'sweep'], ['spiral', 'slam', 'sweep', 'summon']] },
  { name: 'Apocalypse Core', hp: 7000, r: 40, col: '#b24bff', phases: [['ring', 'slam', 'charge', 'sweep'], ['spiral', 'aimed', 'slam', 'sweep', 'summon'], ['ring', 'spiral', 'charge', 'sweep', 'slam', 'summon']] },
];

// ---------- Stat sheet ----------
function newStats() {
  return { dmg: 1, rate: 1, speed: 1, maxhp: 100, pierce: 0, extra: 0, crit: 0.05, critMul: 1.75, killHeal: 0, regen: 0, dashCd: 1, dashDmg: 0, range: 1,
    blades: 0, spin: 1, bladeDmg: 1, orbitR: 1, bladeKnock: 0, poison: 0, poisonMul: 1, poisonSlow: 0, poisonSpread: 0, poisonLeech: 0, burn: 0, killBlast: 0, blastRad: 1, blastMul: 1,
    chain: 0, thorns: 0, taken: 1, goldMul: 1, aura: 0, clearHeal: 0, enemyHp: 1, noHeal: 0, homing: 0, phoenix: 0, dashBlast: 0, critBlast: 0, berserk: 0, still: 0,
    mutagen: 0, trail: 0, execute: 0, abCd: 1, tags: {} };
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
  P.maxhp += (run.bonus && run.bonus.hp) || 0;
  P.maxhp = Math.round(P.maxhp);
  return P;
}
function activeSyn(P) { return Object.keys(SYN).filter(t => (P.tags[t] || 0) >= SYN[t].n); }
