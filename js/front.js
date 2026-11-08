// Slanted front view (like the original): characters are drawn standing, seen from the side, flipped left/right; walls show their front face.
// Everything here is optional: View.front = false (key V, or the pause menu) brings the old top-down look back exactly as it was.
const View = {
  front: false,   // default: top-down
  init() { try { this.front = localStorage.getItem('apoc.view') === 'front'; } catch (e) { /* default */ } },
  set(f) {
    this.front = f; try { localStorage.setItem('apoc.view', f ? 'front' : 'top'); } catch (e) { /* ignore */ }
    if (typeof Game !== 'undefined' && Game.C && Game.world && Game.run) Game.C.floor = buildCaveFloor(Game.run.act, Game.run.seed, Game.world);   // walls change height
  },
  toggle() { this.set(!this.front); },
};
View.init();

// ---------- heroes (24x24, facing right, feet at the bottom) ----------
const FRONT_HERO = {
  sun: { pal: { b: '#5fe0d0', m: '#2f9a9a', d: '#1a5a66', a: '#f4ecc0', c: '#ffffff', x: '#ff8a3a' }, f: P => [   // Fish
    part(sP([[2, 9], [9, 11], [9, 16], [2, 18.5]]), 'ntx'), part(sB(9, 20.4, 1.8, 2.4, 0.5), 'ntd'), part(sB(15, 20.4, 1.8, 2.4, 0.5), 'ntd'),
    part(sE(12.5, 12, 7.4, 8.8), 'nt'), part(sE(14.2, 14.8, 3.8, 5), 'nta'), part(sP([[8, 4.5], [12, 0.8], [14, 5.5]]), 'ntx'),
    part(sC(15.5, 8, 3.1), 'nta'), dot(16, 8, '#0c0c12'), dot(17, 8, '#0c0c12'), dot(16, 9, '#0c0c12'), dot(17, 9, '#0c0c12'), dot(18, 12, '#0c0c12'), dot(19, 12, '#0c0c12'), dot(20, 12, '#0c0c12')] },
  gunner: { pal: { b: '#cfaaff', m: '#7a4ad0', d: '#2c1c5c', a: '#e8fdff', c: '#3de8ff', x: '#6a6e80' }, f: P => [   // Crystal
    part(sB(9, 20.4, 2, 2.4, 0.5), 'ntx'), part(sB(15, 20.4, 2, 2.4, 0.5), 'ntx'), part(sP([[12, 1], [19, 7], [18, 17], [12, 21.5], [6, 17], [5, 7]]), 'nt'),
    part(sLine(5.5, 7, 12, 9.5, 0.4), 'ntd'), part(sLine(18.5, 7, 12, 9.5, 0.4), 'ntd'), part(sLine(12, 9.5, 12, 21, 0.4), 'ntd'),
    part(sC(12, 14.5, 2.4), 'nta'), dot(12, 14, P.c), dot(12, 15, P.c), part(sB(9.2, 10.4, 1.4, 0.9), 'nta'), part(sB(15, 10.4, 1.4, 0.9), 'nta'), dot(9, 10, '#0c0c12'), dot(15, 10, '#0c0c12')] },
  weaver: { pal: { b: '#86e85a', m: '#3f9a30', d: '#18481c', a: '#fff4f6', c: '#ff4a6a', x: '#a8602a' }, f: P => [   // Plant
    part(sP([[7, 22.5], [12, 18], [17, 22.5]]), 'ntd'), part(sB(12, 17, 2, 3.5, 0.5), 'ntd'),
    part(sP([[2, 13.5], [9.5, 11], [10.5, 17]]), 'nt'), part(sP([[22, 13.5], [14.5, 11], [13.5, 17]]), 'nt'), part(sE(12, 8.5, 8.4, 6.6), 'nt'),
    part(sP([[5.5, 8.5], [18.5, 8.5], [16.5, 12.8], [7.5, 12.8]]), 'ntc'), dot(7, 9, P.a), dot(9, 10, P.a), dot(11, 9, P.a), dot(13, 10, P.a), dot(15, 9, P.a), dot(17, 10, P.a),
    part(sC(8.5, 4, 2.1), 'nta'), part(sC(15.5, 4, 2.1), 'nta'), dot(9, 4, '#0c0c12'), dot(16, 4, '#0c0c12')] },
  brute: { pal: { b: '#b4bcc8', m: '#5e6674', d: '#2a303c', a: '#ffd91f', c: '#3de8ff', x: '#d8603a' }, f: P => [   // Robot
    part(sB(9, 20.6, 2, 2.3, 0.4), 'ntd'), part(sB(15, 20.6, 2, 2.3, 0.4), 'ntd'), part(sB(4.8, 14.5, 1.8, 3.6, 0.5), 'nt'), part(sB(19.6, 14.8, 1.8, 2.2, 0.5), 'nt'),
    part(sB(12, 14.8, 6.6, 5.4, 1), 'nt'), part(sB(12, 15.4, 3.4, 2.6, 0.5), 'ntd'), dot(10, 14, P.a), dot(12, 14, P.x), dot(14, 14, P.a),
    part(sB(12, 6.8, 5.4, 4.2, 1), 'nt'), part(sB(13, 6.8, 4, 1.5, 0.4), 'ntc'), part(sB(12, 2, 0.5, 2), 'ntd'), dot(12, 0, '#ff4a2a')] },
  runner: { pal: { b: '#e8d070', m: '#a08a2a', d: '#3a3208', a: '#ffffff', c: '#3de8ff', x: '#c04a2a' }, f: P => [   // Y.V.
    part(sB(9.6, 20.6, 1.8, 2.4, 0.4), 'ntd'), part(sB(14.6, 20.6, 1.8, 2.4, 0.4), 'ntd'), part(sB(12, 14.6, 5, 5, 1.2), 'nt'), part(sB(12, 15.4, 2.4, 2, 0.5), 'nta'),
    part(sC(12, 8, 4.8), 'nt'), part(sB(11.6, 3.6, 5.6, 1.6, 0.6), 'ntx'), part(sB(17.4, 4.6, 3, 0.9, 0.3), 'ntx'), part(sC(14.4, 8.2, 1.6), 'nta'), dot(14, 8, '#0c0c12'), dot(15, 8, '#0c0c12')] },
  net: { pal: { b: '#b080ff', m: '#6a3ad0', d: '#24104a', a: '#ffffff', c: '#ff4a6a', x: '#3de8ff' }, f: P => [   // Eyes
    part(sB(8.6, 21, 1.8, 2, 0.4), 'ntd'), part(sB(15.4, 21, 1.8, 2, 0.4), 'ntd'), part(sE(12, 13, 8.6, 8), 'nt'),
    part(sC(12, 6.6, 2.6), 'nta'), part(sC(6.6, 9.6, 2.2), 'nta'), part(sC(17.6, 9.6, 2.2), 'nta'), part(sC(8.4, 15, 2), 'nta'), part(sC(16, 15, 2), 'nta'),
    dot(12, 6, '#0c0c12'), dot(13, 6, '#0c0c12'), dot(7, 9, '#0c0c12'), dot(18, 9, '#0c0c12'), dot(8, 15, '#0c0c12'), dot(16, 15, '#0c0c12')] },
  boiler: { pal: { b: '#d8f090', m: '#8ab030', d: '#2c3a0c', a: '#ffffff', c: '#7dff4a', x: '#ff8a1f' }, f: P => [   // Melting
    part(sP([[3, 22], [5, 12], [12, 9], [19, 12], [21, 22], [17, 20], [15, 23], [12, 20], [9, 23], [7, 20]]), 'nt'),
    part(sC(12, 7, 4.6), 'nt'), part(sB(10, 7.2, 1.4, 1.8, 0.4), 'ntd'), part(sB(14.6, 7.2, 1.4, 1.8, 0.4), 'ntd'), part(sB(12.4, 11, 2.4, 0.7), 'ntd'),
    dot(9, 16, P.c), dot(15, 14, P.c), dot(12, 18, P.c), dot(18, 17, P.x)] },
  clock: { pal: { b: '#e8a070', m: '#a05a30', d: '#3a1c0e', a: '#ffd91f', c: '#ff4a2a', x: '#2a2a34' }, f: P => [   // Steroids
    part(sB(8.6, 21.2, 2.4, 1.8, 0.4), 'ntd'), part(sB(15.4, 21.2, 2.4, 1.8, 0.4), 'ntd'), part(sB(12, 14, 8.2, 6.4, 2), 'nt'),
    part(sC(3.8, 13.6, 3.2), 'nt'), part(sC(20.2, 13.6, 3.2), 'nt'), part(sC(12, 5.6, 3.6), 'nt'), part(sB(12, 5.2, 3.8, 0.7), 'ntx'), dot(13, 5, P.c), dot(15, 5, P.c), part(sB(12, 16.4, 4, 1), 'ntd')] },
  siege: { pal: { b: '#9cc88a', m: '#58844a', d: '#1e3418', a: '#ffe08a', c: '#3de8ff', x: '#c04030' }, f: P => [   // Rebel
    part(sB(9.6, 20.6, 1.8, 2.4, 0.4), 'ntd'), part(sB(14.6, 20.6, 1.8, 2.4, 0.4), 'ntd'), part(sB(12, 14.4, 5.2, 5.4, 1.2), 'nt'), part(sLine(7.4, 10.6, 16.6, 18.4, 0.9), 'ntx'),
    part(sC(12, 7.4, 4.4), 'nta'), part(sB(11.6, 3.4, 5.2, 1.4, 0.6), 'ntx'), part(sB(11, 6.6, 4.4, 0.7), 'ntx'), dot(14, 7.8, '#0c0c12'), dot(15, 7.8, '#0c0c12')] },
  hive: { pal: { b: '#fffff0', m: '#c8c0a0', d: '#6a6850', a: '#ff4a3a', c: '#3de8ff', x: '#ffb020' }, f: P => [   // Chicken
    part(sLine(10, 18, 9.4, 22.6, 0.5), 'ntx'), part(sLine(14, 18, 14.6, 22.6, 0.5), 'ntx'), part(sE(11, 14, 7.6, 6.2), 'nt'), part(sE(8, 14, 4.2, 3), 'nta'),
    part(sC(16, 7, 3.8), 'nt'), part(sP([[18.6, 6], [23, 8], [18.6, 9.8]]), 'ntx'), part(sC(14.4, 2.8, 1.5), 'nta'), part(sC(16.6, 2.4, 1.5), 'nta'), part(sC(18, 3.8, 1.2), 'nta'), dot(17, 6, '#0c0c12')] },
  phantom: { pal: { b: '#a8c0ff', m: '#5a78d0', d: '#1c2650', a: '#ffffff', c: '#7affff', x: '#3a3a6a' }, f: P => [   // Wraith
    part(sP([[4, 22], [5, 10], [9, 3], [14, 3], [18, 10], [20, 22], [17, 19], [14, 23], [11, 19], [8, 23]]), 'nt'), part(sB(13, 8, 3.6, 2.4, 0.8), 'ntd'),
    dot(12, 8, P.c), dot(15, 8, P.c), part(sLine(17, 13, 21.4, 15, 0.9), 'nta')] },
  umbra: { pal: { b: '#d0a068', m: '#8a5a28', d: '#3a2410', a: '#ffe0a0', c: '#3de8ff', x: '#a03a2a' }, f: P => [   // Outlaw
    part(sB(9.6, 20.6, 1.8, 2.4, 0.4), 'ntd'), part(sB(14.6, 20.6, 1.8, 2.4, 0.4), 'ntd'), part(sB(12, 14.4, 5, 5.2, 1.2), 'nt'), part(sB(12, 12, 5, 1), 'ntx'),
    part(sC(12, 8.2, 3.9), 'nta'), part(sB(11.6, 6, 3.8, 1.2), 'ntx'), part(sB(11.6, 4.4, 8, 1.1, 0.4), 'ntd'), part(sB(11.6, 2.6, 3.8, 1.8, 0.6), 'ntd'), dot(14, 8.6, '#0c0c12'), dot(15, 8.6, '#0c0c12')] },
};

// ---------- enemies (same size as the top-down drawing, standing on the bottom edge) ----------
const FRONT_ENEMY = {
  grunt: { n: 16, f: P => [part(sE(4, 12, 3.4, 2.8), 'body'), part(sE(8.2, 11.4, 3.8, 3.4), 'body'), part(sE(12.4, 12, 3.2, 2.9), 'body'), dot(13, 10, P.c), dot(14, 11, P.c), part(sLine(6.2, 8.8, 6.2, 14.6, 0.3), 'dark')] },
  maggot: { n: 16, f: P => [part(sE(5, 12.6, 2.8, 2.2), 'body'), part(sE(9, 12.2, 3, 2.6), 'body'), part(sE(12.6, 12.6, 2.4, 2.1), 'body'), dot(13, 11, P.c), dot(14, 12, P.c)] },
  shooter: { n: 16, f: P => [part(sB(6.6, 14.4, 1, 1.4, 0.3), 'dark'), part(sB(9.6, 14.4, 1, 1.4, 0.3), 'dark'), part(sB(8, 10, 3.4, 4.4, 1), 'body'), part(sC(8.6, 4.6, 2.8), 'acc'), dot(10, 4, P.c), part(sB(5.6, 3.4, 3.4, 0.8), 'dark'),
    part(sB(13, 9.2, 3.4, 0.9, 0.3), 'dark'), part(sB(15.2, 9.2, 0.8, 0.6), 'cy')] },
  dasher: { n: 16, f: P => [part(sLine(3.4, 10, 1.4, 6, 0.7), 'acc'), part(sLine(1.4, 6, 4, 2.8, 0.7), 'acc'), dot(4, 2, P.c), part(sE(7.6, 11, 5, 3), 'body'),
    part(sP([[11.4, 8.6], [15.6, 7.6], [15, 10.8], [11.6, 11.4]]), 'acc'), part(sLine(5, 13, 4, 15.4, 0.35), 'dark'), part(sLine(8, 13.4, 8, 15.6, 0.35), 'dark'), part(sLine(11, 13, 12, 15.4, 0.35), 'dark'), dot(11, 9, P.c)] },
  bomber: { n: 16, f: P => [part(sB(5.6, 14.4, 1.6, 1, 0.3), 'dark'), part(sB(10.4, 14.4, 1.6, 1, 0.3), 'dark'), part(sC(8, 9, 5.6), 'body'), part(sC(8, 9, 2.4), 'dark'), part(sLine(8, 3.6, 10.6, 1.2, 0.4), 'acc'), dot(11, 1, P.c), dot(6, 8, P.c)] },
  tank: { n: 24, f: P => [part(sP([[1.4, 17], [6.6, 13.4], [6.6, 18.6]]), 'dark'), part(sB(8, 21, 1.8, 2.2, 0.4), 'dark'), part(sB(16, 21, 1.8, 2.2, 0.4), 'dark'), part(sE(12.4, 15.4, 9.6, 5.6), 'body'),
    part(sP([[19.6, 12], [23.4, 13.6], [23.4, 17.4], [19.6, 18.2]]), 'body'), dot(21, 13, P.c), dot(22, 17, P.a), dot(20, 17, P.a), dot(8, 10, P.a), dot(11, 9, P.a), dot(14, 9, P.a), dot(17, 10, P.a)] },
  swarmer: { n: 12, f: P => [part(sE(4.2, 3, 2.6, 1.2), 'acc'), part(sE(7.6, 3.4, 2.2, 1), 'acc'), part(sE(6, 7, 3.4, 2.4), 'body'), dot(8, 6, P.c), dot(8, 7, P.c), dot(4, 10, P.d), dot(7, 10, P.d)] },
  spitter: { n: 16, f: P => [part(sP([[1.6, 14.6], [4.6, 9.4], [8, 14.6]]), 'dark'), part(sE(8.4, 10, 5.4, 4.4), 'body'), part(sC(11.4, 5.6, 1.9), 'acc'), dot(12, 5, P.c), part(sB(13, 10.6, 1.8, 0.6), 'dark'), dot(6, 9, P.x), dot(9, 11, P.x)] },
  blob: { n: 20, f: P => [part(sE(4.6, 14.4, 4, 3.8), 'body'), part(sE(10.4, 13.6, 5, 5), 'body'), part(sE(16, 14.4, 3.8, 3.8), 'body'), part(sLine(7.6, 9.6, 7.6, 18, 0.3), 'dark'), dot(16, 12, P.c), dot(17, 13, P.c), dot(18, 14, P.c)] },
  sniper: { n: 16, f: P => [part(sP([[3, 15], [4.6, 5.4], [8.4, 2.4], [11.6, 5.6], [12.6, 15]]), 'body'), part(sC(9.2, 5.8, 2), 'dark'), dot(10, 5, P.c), part(sB(12.6, 9.6, 3.6, 0.6, 0.2), 'dark'), part(sB(15.2, 9.6, 0.8, 0.5), 'cy')] },
  rat: { n: 14, f: P => [part(sLine(2.4, 9.4, 0.4, 6.4, 0.3), 'acc'), part(sE(6, 9.4, 4.4, 2.8), 'body'), part(sP([[9, 7.4], [13.2, 9.2], [9, 11]]), 'body'), part(sC(8.2, 6.2, 1.2), 'acc'), part(sB(4.6, 12.6, 0.8, 1, 0.2), 'dark'), part(sB(8, 12.6, 0.8, 1, 0.2), 'dark'), dot(11, 8, P.c)] },
  turret: { n: 16, f: P => [part(sB(8, 13, 5.6, 2.6, 0.6), 'dark'), part(sC(8, 8.2, 4.6), 'body'), part(sB(13, 8, 3.6, 1, 0.3), 'dark'), part(sB(15.4, 8, 0.8, 0.6), 'cy'), dot(8, 8, P.c)] },
  raider: { n: 16, f: P => [part(sB(6.6, 14.4, 1, 1.4, 0.3), 'dark'), part(sB(9.6, 14.4, 1, 1.4, 0.3), 'dark'), part(sB(8, 10, 3.6, 4.6, 1), 'body'), part(sC(8.6, 4.4, 2.9), 'dark'), dot(10, 4, P.c), dot(11, 5, P.c),
    part(sB(12.4, 9, 3.8, 0.9, 0.3), 'acc'), part(sB(15, 9, 0.9, 0.7), 'cy')] },
  crab: { n: 18, f: P => [part(sLine(4, 13, 2.4, 16.4, 0.4), 'dark'), part(sLine(7, 14, 6, 17, 0.4), 'dark'), part(sLine(12, 14, 12.4, 17, 0.4), 'dark'), part(sE(8.6, 11, 6.2, 4.4), 'body'),
    part(sC(15.4, 7.4, 2.5), 'acc'), part(sC(2.4, 7.4, 2.5), 'acc'), dot(10, 6, P.c), dot(12, 6, P.c), part(sE(8.6, 11, 3.4, 2.2), 'dark')] },
  frostwolf: { n: 16, f: P => [part(sLine(2.4, 8, 0.4, 5, 0.8), 'acc'), part(sE(7, 9.6, 5.6, 3), 'body'), part(sB(4, 13.4, 0.9, 1.7, 0.2), 'dark'), part(sB(10, 13.4, 0.9, 1.7, 0.2), 'dark'),
    part(sP([[11, 6.8], [15.4, 8.2], [15.4, 10.6], [11, 11]]), 'body'), part(sP([[10, 6.6], [11.2, 3.8], [12.6, 6.6]]), 'dark'), dot(13, 8, P.c), dot(15, 9, P.d)] },
  icetower: { n: 18, f: P => [part(sB(9, 16.4, 6.2, 1.4, 0.4), 'dark'), part(sP([[9, 0.8], [13.4, 8], [12.4, 16], [5.6, 16], [4.6, 8]]), 'body'), part(sP([[14.6, 6], [17, 11], [15.6, 15.8], [13.4, 15.8]]), 'acc'), part(sP([[2.6, 8], [4.4, 11], [3.6, 15.8], [1.4, 15.8]]), 'acc'), dot(9, 9, P.x), dot(9, 10, P.x)] },
  smelter: { n: 26, f: P => [part(sB(8.6, 23.4, 2.6, 2.2, 0.5), 'dark'), part(sB(16.4, 23.4, 2.6, 2.2, 0.5), 'dark'), part(sB(12, 15.4, 8.6, 7.6, 2), 'body'), part(sC(11, 15.4, 3.4), 'dark'), dot(11, 15, P.x), dot(11, 16, P.c),
    part(sC(19.2, 7, 3.8), 'dark'), dot(20, 6, P.c), dot(21, 7, P.c), part(sLine(21, 12, 24.6, 15.6, 1.5), 'acc'), part(sB(24, 19, 2.2, 2.4, 0.5), 'dark')] },
  drone: { n: 14, f: P => [part(sB(7, 1.8, 5, 0.8, 0.3), 'acc'), part(sC(7, 6.6, 3.8), 'body'), part(sC(7, 6.6, 1.8), 'dark'), dot(9, 6, P.c), part(sB(11.4, 9.6, 1.6, 0.5), 'cy'), part(sB(4, 11.4, 0.7, 1.2, 0.2), 'dark'), part(sB(10, 11.4, 0.7, 1.2, 0.2), 'dark')] },
  laser: { n: 18, f: P => [part(sB(5, 16.4, 1.5, 1.2, 0.3), 'dark'), part(sB(13, 16.4, 1.5, 1.2, 0.3), 'dark'), part(sC(9, 9, 7.2), 'body'), part(sC(11.2, 9, 4), 'acc'), part(sC(12.2, 9, 2.2), 'dark'), dot(12, 9, P.x), part(sB(16.4, 9, 1.6, 0.7, 0.2), 'cy')] },
  warden: { n: 22, f: P => [part(sB(11, 20.4, 8.4, 1.6, 0.5), 'body'), part(sB(11, 13, 5.6, 7.4, 1.4), 'dark'), part(sC(11, 8, 5.6), 'body'), part(sC(11, 8, 2.8), 'acc'), dot(11, 8, P.c), dot(11, 9, P.c), dot(7, 14, P.a), dot(15, 14, P.a), dot(11, 17, P.a)] },
  wraith: { n: 16, f: P => [part(sP([[3, 14.6], [3.6, 5.6], [7.6, 2], [11.6, 5], [12.4, 14.6], [10, 12.6], [8, 15], [5.6, 12.8]]), 'body'), dot(9, 5, P.c), dot(11, 5, P.c), part(sLine(12, 8, 15, 9.6, 0.6), 'acc')] },
};

// ---------- bosses (40x40, side view) ----------
const FRONT_BOSS = [
  P => [part(sB(14, 35, 3.6, 3.6, 0.8), 'dark'), part(sB(24, 35, 3.6, 3.6, 0.8), 'dark'), part(sB(19, 22.4, 9.4, 10.6, 2.4), 'body'), part(sLine(10, 15, 28, 28, 1), 'acc'),
    part(sC(11, 15, 4.6), 'acc'), part(sC(21, 8.6, 5.8), 'dark'), part(sB(24.4, 9, 3.2, 1.5, 0.5), 'cy'), dot(25, 8, P.c), part(sB(32, 23, 8, 2.3, 0.6), 'dark'), part(sB(38, 23, 1.6, 1.8), 'cy'), part(sB(5, 18, 3, 6, 1), 'dark')],
  P => [part(sP([[1, 20], [9, 9], [9, 31]]), 'dark'), part(sP([[2.6, 20], [8, 14], [8, 26]]), 'acc'), part(sP([[14, 10], [22, 1.6], [27, 10]]), 'dark'), part(sE(21, 20, 16.4, 11), 'body'),
    part(sP([[17, 25], [22, 34], [26, 25]]), 'acc'), part(sLine(14, 13, 14, 27, 0.8), 'dark'), part(sLine(19, 11, 19, 29, 0.8), 'dark'), part(sLine(24, 11.6, 24, 28.4, 0.8), 'dark'),
    part(sC(31, 15.6, 3.2), 'acc'), dot(32, 15, P.c), part(sP([[33.6, 21], [39.6, 24], [33.6, 27.4]]), 'dark'), dot(36, 23, P.a), dot(38, 24, P.a)],
  P => [part(sB(8.4, 34, 2.4, 4.6, 0.6), 'dark'), part(sB(13.4, 34, 2.4, 4.6, 0.6), 'dark'), part(sB(23.4, 34, 2.4, 4.6, 0.6), 'dark'), part(sB(28, 34, 2.4, 4.6, 0.6), 'dark'),
    part(sLine(4, 20, 0.8, 11, 1.6), 'acc'), part(sE(16.6, 23, 12.6, 8.4), 'body'), part(sC(30, 15, 6.6), 'body'), part(sB(36.2, 17, 3.8, 3, 0.8), 'acc'), part(sP([[25.6, 9.6], [29.6, 6.6], [31.4, 11.6]]), 'dark'),
    dot(32, 13, P.c), dot(39, 16, P.d), dot(10, 16, P.x), dot(15, 15, P.x), dot(20, 15, P.x), dot(25, 16, P.x)],
  P => [part(sB(14, 35, 3.2, 4.2, 0.8), 'dark'), part(sB(25, 35, 3.2, 4.2, 0.8), 'dark'), part(sB(7.6, 20, 3.4, 8.4, 1), 'dark'), dot(4, 28, P.x), dot(5, 30, P.c), dot(4, 31, P.x),
    part(sB(19, 22.6, 9.4, 9.4, 2.4), 'body'), part(sC(23, 15.4, 5.6), 'dark'), part(sB(26.6, 14.6, 3, 2, 0.5), 'cy'), part(sB(31, 25, 7.6, 2.5, 0.8), 'dark'), part(sB(37.6, 25, 1.6, 2), 'cy'), dot(17, 24, P.a), dot(20, 28, P.a)],
  P => [part(sP([[7, 35], [12, 15], [20, 8], [28, 15], [32, 35], [26, 31], [20, 36], [14, 31]]), 'body'), part(sC(21, 15.4, 5.2), 'dark'), dot(23, 15, P.c), dot(25, 15, P.c),
    part(sC(5.6, 12, 3.2), 'cy'), part(sC(37, 12, 3.2), 'cy'), part(sC(4.6, 26, 2.8), 'cy'), part(sC(37.4, 27, 2.8), 'cy'), part(sLine(33.4, 11, 35.6, 37, 0.6), 'acc'), part(sC(33, 9.4, 2.6), 'cy')],
  P => [part(sB(14, 18, 8.4, 14.6, 2), 'dark'), part(sP([[7, 5], [10, 0.6], [13, 5]]), 'acc'), part(sP([[15, 5], [19, 0.6], [23, 5]]), 'acc'), part(sB(22, 31, 14, 5.4, 1.4), 'body'), part(sB(8, 35.8, 4, 3.6, 0.8), 'dark'), part(sB(36, 35.8, 4, 3.6, 0.8), 'dark'),
    part(sC(24, 19, 7.4), 'body'), part(sC(25.4, 19, 4), 'dark'), dot(26, 19, P.c), dot(26, 20, P.c), part(sB(33.4, 26, 3.4, 1.6, 0.6), 'acc'), part(sB(8, 26, 3.2, 1.6, 0.6), 'acc')],
];

// ---------- hook into the sprite cache: key + ':f' is the front-view version, falling back to the top-down one ----------
const _spriteGetTop = Sprites.get.bind(Sprites);
Sprites.get = function (key) {
  if (!key.endsWith(':f')) return _spriteGetTop(key);
  if (this.cache[key]) return this.cache[key];
  const k = key.slice(0, -2); let c = null;
  if (FRONT_HERO[k]) c = this.build(SPR, FRONT_HERO[k].f(FRONT_HERO[k].pal), FRONT_HERO[k].pal);
  else if (k.startsWith('e:') && FRONT_ENEMY[k.slice(2)]) { const t = k.slice(2), a = FRONT_ENEMY[t], pal = (ENEMY_ART[t] && ENEMY_ART[t].pal) || (ENEMY_ART.grunt && t === 'maggot' && ENEMY_ART.grunt.pal) || EPAL; c = this.build(a.n, a.f(pal), pal); }
  else if (k.startsWith('b:') && FRONT_BOSS[+k.slice(2)]) { const i = +k.slice(2); c = this.build(40, FRONT_BOSS[i](BPAL[i]), BPAL[i]); }
  return this.cache[key] = c || _spriteGetTop(k);
};
