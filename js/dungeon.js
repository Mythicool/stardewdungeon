'use strict';
// ---------------------------------------------------------------------------
// The Stairwell: procedural cave levels, safe rooms and boss arenas.
// ---------------------------------------------------------------------------

function dungeonTheme(level) { return Math.min(3, Math.floor((level - 1) / 10)); }
function isSafeLevel(level) { return level % 5 === 0 && level % 10 !== 0; }
function bossForLevel(level) { return level === 10 ? 'hoarder' : level === 20 ? 'krakaren' : null; }
function dungeonMusic(level) { return bossForLevel(level) && !G.stats.bosses[bossForLevel(level)] ? 'boss' : isSafeLevel(level) ? 'safe' : level > 10 ? 'deep' : 'dungeon'; }

function generateLevel(level) {
  const theme = dungeonTheme(level);
  if (isSafeLevel(level)) return buildSafeRoom(level, theme);
  const boss = bossForLevel(level);
  if (boss) return buildBossArena(level, theme, boss);
  return buildCave(level, theme);
}

function levelName(level) {
  if (isSafeLevel(level)) return `Safe Room — Level ${level}`;
  const boss = bossForLevel(level);
  if (boss) return `${MONSTERS[boss].name}'s Lair — Level ${level}`;
  return `${DUNGEON_THEMES[dungeonTheme(level)].name} — Level ${level}`;
}

function caGrid(W, H) {
  for (let attempt = 0; attempt < 20; attempt++) {
    let g = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      g[y * W + x] = (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) ? 1 : (Math.random() < 0.44 ? 1 : 0);
    }
    for (let it = 0; it < 5; it++) {
      const n = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) { n[y * W + x] = 1; continue; }
        let c = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) c += g[(y + j) * W + x + i];
        n[y * W + x] = c >= 5 ? 1 : 0;
      }
      g = n;
    }
    // keep the largest open region
    const region = new Int32Array(W * H).fill(-1);
    let best = -1, bestSize = 0, rid = 0;
    for (let i = 0; i < W * H; i++) {
      if (g[i] || region[i] >= 0) continue;
      const stack = [i]; region[i] = rid; let size = 0;
      while (stack.length) {
        const k = stack.pop(); size++;
        const x = k % W, y = (k / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, nk = ny * W + nx;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || g[nk] || region[nk] >= 0) continue;
          region[nk] = rid; stack.push(nk);
        }
      }
      if (size > bestSize) { bestSize = size; best = rid; }
      rid++;
    }
    for (let i = 0; i < W * H; i++) if (!g[i] && region[i] !== best) g[i] = 1;
    if (bestSize > W * H * 0.33) return g;
  }
  // fallback: open room
  const g = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y * W + x] = (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) ? 1 : 0;
  return g;
}

function oreTable(level) {
  const t = [[null, 62], ['coal', 5]];
  t.push(['copper', level < 12 ? 9 : 4]);
  if (level >= 3) t.push(['quartz', 2]);
  if (level >= 6) t.push(['iron', level < 18 ? 6 : 8]);
  if (level >= 8) t.push(['mana', 1.2]);
  if (level >= 14) t.push(['ruby', 0.7]);
  if (level >= 16) t.push(['gold', 5]);
  if (level >= 22) t.push(['diamond', 0.35]);
  return t;
}

function monsterTable(level) {
  if (level < 5) return [['rat', 5], ['grub', 3]];
  if (level < 10) return [['rat', 3], ['goblin', 4], ['tuskling', 3], ['grub', 1]];
  if (level < 15) return [['goblin', 3], ['tuskling', 3], ['hobgoblin', 3], ['rat', 1]];
  if (level < 20) return [['goblin', 2], ['tuskling', 3], ['hobgoblin', 3], ['shade', 2]];
  return [['hobgoblin', 4], ['shade', 4], ['tuskling', 2], ['goblin', 2]];
}

function buildCave(level, theme) {
  const W = 34 + Math.min(12, level), H = 26 + Math.min(8, level >> 1);
  const m = newMap('dungeon', W, H, { dark: true, theme, level, name: levelName(level), music: dungeonMusic(level) });
  m.monsters = []; m.localNpcs = [];
  const g = caGrid(W, H);
  for (let i = 0; i < W * H; i++) m.ground[i] = g[i] ? T.WALL : T.CAVE;
  const open = (x, y) => inBounds(m, x, y) && m.ground[y * W + x] === T.CAVE;

  // spawn: an open spot whose 3x3 neighbourhood is open
  const opens = [];
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (open(x, y)) opens.push([x, y]);
  shuffle(opens);
  let sp = opens.find(([x, y]) => { for (let j = -1; j <= 2; j++) for (let i = -1; i <= 1; i++) if (!open(x + i, y + j)) return false; return true; }) || opens[0];
  addObj(m, { type: 'ladder', x: sp[0], y: sp[1] });
  m.spawn = { x: sp[0], y: sp[1] + 1 };
  const far = (x, y, d) => Math.abs(x - sp[0]) + Math.abs(y - sp[1]) > d;

  // rocks
  const ores = oreTable(level);
  const hp = 2 + Math.floor(level / 6);
  const density = rand(0.14, 0.22);
  const rocks = [];
  for (const [x, y] of opens) {
    if (!far(x, y, 3) || m.objs.has(y * W + x)) continue;
    if (Math.random() < density) {
      const ore = weighted(ores);
      rocks.push(addObj(m, { type: 'boulder', x, y, ore, hp: ore ? hp + 1 : hp, v: randi(0, 1) }));
    }
  }
  const farRocks = rocks.filter(r => far(r.x, r.y, 10));
  const stairRock = choice(farRocks.length ? farRocks : rocks);
  if (stairRock) stairRock.stairs = true;
  else addObj(m, { type: 'stairs', x: sp[0] + 2, y: sp[1] + 1 });

  // crates, mushrooms, chests
  const free = opens.filter(([x, y]) => far(x, y, 4) && !m.objs.has(y * W + x));
  shuffle(free);
  let fi = 0;
  const take = () => free[fi++];
  for (let n = randi(1, 3); n > 0 && fi < free.length; n--) { const [x, y] = take(); addObj(m, { type: 'crate', x, y, hp: 1 }); }
  for (let n = randi(0, 2) + (level >= 3 ? 1 : 0); n > 0 && fi < free.length; n--) { const [x, y] = take(); addObj(m, { type: 'forage', x, y, item: 'glowshroom' }); }
  if (Math.random() < 0.14 && fi < free.length) {
    const [x, y] = take();
    addObj(m, { type: 'chest', x, y, tier: level > 12 && chance(0.5) ? 'silver' : 'bronze' });
  }

  // monsters
  const mt = monsterTable(level);
  const count = Math.min(18, 3 + Math.floor(level * 0.7));
  const spots = free.slice(fi).filter(([x, y]) => far(x, y, 7));
  for (let n = 0; n < count && n < spots.length; n++) {
    const [x, y] = spots[n];
    m.monsters.push(createMonster(weighted(mt), x * TILE + 8, y * TILE + 12, level));
  }
  return m;
}

function buildSafeRoom(level, theme) {
  const W = 16, H = 12;
  const m = newMap('dungeon', W, H, { dark: false, theme, level, name: levelName(level), music: 'safe' });
  m.monsters = []; m.localNpcs = []; m.safe = true;
  fillG(m, 0, 0, W, H, T.WALL);
  fillG(m, 1, 2, W - 2, H - 3, T.TILEF);
  addObj(m, { type: 'ladder', x: 2, y: 2 });
  m.spawn = { x: 2, y: 3 };
  for (let x = 6; x <= 9; x++) addObj(m, { type: 'counter', x, y: 4, shop: 'safe', kind: 'shop' });
  m.localNpcs.push(createNPC('bopca2', 'dungeon', 7, 3, { name: 'Safe Room Bopca', shop: 'safe', lines: [
    "Welcome to the safe room! No monsters allowed. Crawlers only. Pants optional, apparently.",
    "My cousin Pook runs a shop topside. I'm the handsome one.",
    "Rest, eat, buy things. Mostly buy things.",
  ] }));
  addObj(m, { type: 'rug', x: 6, y: 6 });
  addObj(m, { type: 'bench', x: 3, y: 7 });
  addObj(m, { type: 'bench', x: 11, y: 7 });
  addObj(m, { type: 'lamp', x: 1, y: 5 });
  addObj(m, { type: 'lamp', x: 14, y: 5 });
  addObj(m, { type: 'toilet', x: 13, y: 2 });
  addObj(m, { type: 'sign', x: 4, y: 2, text: 'SAFE ROOM\nNo fighting. No monsters. No refunds.\nThe toilet works. Mostly.' });
  addObj(m, { type: 'stairs', x: 12, y: 9 });
  return m;
}

function buildBossArena(level, theme, boss) {
  const W = 26, H = 21;
  const defeated = !!G.stats.bosses[boss];
  const m = newMap('dungeon', W, H, { dark: true, theme, level, name: levelName(level), music: defeated ? 'dungeon' : 'boss' });
  m.monsters = []; m.localNpcs = [];
  fillG(m, 0, 0, W, H, T.WALL);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    const dx = (x + 0.5 - W / 2) / (W / 2 - 2), dy = (y + 0.5 - H / 2) / (H / 2 - 2);
    if (dx * dx + dy * dy <= 1.15) setG(m, x, y, T.CAVE);
  }
  for (const [px, py] of [[7, 6], [17, 6], [7, 13], [17, 13]]) fillG(m, px, py, 2, 2, T.WALL);
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  addObj(m, { type: 'ladder', x: cx, y: H - 4 });
  m.spawn = { x: cx, y: H - 5 };
  if (boss === 'krakaren') {
    fillG(m, cx - 2, cy - 3, 5, 3, T.WATER);
  }
  if (defeated) {
    addObj(m, { type: 'stairs', x: cx, y: cy + 1 });
  } else {
    m.boss = boss;
    const bx = boss === 'krakaren' ? cx * TILE + 8 : cx * TILE + 8;
    const by = boss === 'krakaren' ? cy * TILE - 2 : (cy - 2) * TILE;
    m.monsters.push(createMonster(boss, bx, by, level));
    for (const [x, y] of [[4, 10], [W - 5, 10]]) addObj(m, { type: 'forage', x, y, item: 'glowshroom' });
  }
  return m;
}
