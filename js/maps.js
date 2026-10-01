'use strict';
// ---------------------------------------------------------------------------
// Maps: data structure, object registry, hand-built layouts, base rendering.
// ---------------------------------------------------------------------------

const OBJ = {
  tree: { solid: true }, stump: { solid: true }, weed: { solid: true }, stone: { solid: true }, twig: { solid: true },
  boulder: { solid: true }, crate: { solid: true }, crop: { solid: false }, withered: { solid: false },
  sprinkler: { solid: true }, qsprinkler: { solid: true }, bin: { solid: true }, bed: { solid: true, h: 2 },
  tv: { solid: true }, table: { solid: true }, counter: { solid: true }, shelf: { solid: true }, board: { solid: true },
  fountain: { solid: true, w: 3, h: 3 }, lamp: { solid: true, light: 60 }, bench: { solid: true }, bush: { solid: true },
  flowers: { solid: false, flat: true }, stairs: { solid: false, flat: true }, ladder: { solid: false, flat: true },
  chest: { solid: true }, rug: { solid: false, flat: true, w: 3, h: 2 }, cauldron: { solid: true, light: 34 },
  hut: { solid: true, w: 2, h: 2 }, sign: { solid: true }, forage: { solid: false }, toilet: { solid: true },
  mailbox: { solid: true },
};

function newMap(id, w, h, o = {}) {
  return {
    id, w, h,
    ground: new Uint8Array(w * h), till: new Uint8Array(w * h), wet: new Uint8Array(w * h), block: new Uint8Array(w * h),
    objs: new Map(), buildings: [], warps: [], triggers: [],
    outdoor: !!o.outdoor, farmable: !!o.farmable, dark: !!o.dark, theme: o.theme || 0, wallKind: o.wallKind || 'home',
    name: o.name || id, music: o.music || null, fishTable: o.fishTable || null, level: o.level || 0,
    baseCanvas: null, baseKey: null, spawn: o.spawn || null,
  };
}

function inBounds(m, x, y) { return x >= 0 && y >= 0 && x < m.w && y < m.h; }
function gAt(m, x, y) { return inBounds(m, x, y) ? m.ground[y * m.w + x] : T.VOID; }
function setG(m, x, y, t) { if (inBounds(m, x, y)) m.ground[y * m.w + x] = t; }
function fillG(m, x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setG(m, i, j, t); }
function getObj(m, x, y) { return inBounds(m, x, y) ? m.objs.get(y * m.w + x) : undefined; }

function addObj(m, o) {
  const def = OBJ[o.type] || {};
  const w = o.w || def.w || 1, h = o.h || def.h || 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (inBounds(m, o.x + i, o.y + j)) m.objs.set((o.y + j) * m.w + o.x + i, o);
  }
  return o;
}
function removeObj(m, o) {
  const def = OBJ[o.type] || {};
  const w = o.w || def.w || 1, h = o.h || def.h || 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (o.y + j) * m.w + o.x + i;
    if (m.objs.get(k) === o) m.objs.delete(k);
  }
}
function canPlace(m, x, y) {
  if (!inBounds(m, x, y)) return false;
  const i = y * m.w + x;
  return !SOLID_GROUND.has(m.ground[i]) && !m.block[i] && !m.objs.has(i);
}

function isBlocked(m, x, y) {
  if (!inBounds(m, x, y)) return true;
  const i = y * m.w + x;
  if (SOLID_GROUND.has(m.ground[i]) || m.block[i]) return true;
  const o = m.objs.get(i);
  return !!(o && OBJ[o.type] && OBJ[o.type].solid);
}
function isWater(m, x, y) { return gAt(m, x, y) === T.WATER; }

function addBuilding(m, kind, x, y, doors, season) {
  const b = buildingSprite(kind, season);
  const bd = { kind, x, y, fw: b.fw, fh: b.fh, doors: doors || [] };
  for (let j = 0; j < b.fh; j++) for (let i = 0; i < b.fw; i++) m.block[(y + j) * m.w + x + i] = 1;
  for (const d of bd.doors) m.block[d.y * m.w + d.x] = 0;
  m.buildings.push(bd);
  return bd;
}

function addWarp(m, x, y, to, tx, ty, dir, extra) {
  m.warps.push(Object.assign({ x, y, to, tx, ty, dir }, extra || {}));
}
function warpAt(m, x, y) { return m.warps.find(w => w.x === x && w.y === y); }

function borderTrees(m, gaps) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const edge = x < 2 || y < 2 || x >= m.w - 2 || y >= m.h - 1;
    if (!edge) continue;
    if (gaps.some(g => x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h)) continue;
    if (gAt(m, x, y) === T.WATER) continue;
    if (!getObj(m, x, y)) addObj(m, { type: 'tree', x, y, fixed: true, v: (x * 7 + y * 3) % 2, hp: 999 });
  }
}

// ---------------------------------------------------------------------------
// The Homestead
// ---------------------------------------------------------------------------
const FARM_W = 46, FARM_H = 36;
const POND = { cx: 34, cy: 26, rx: 4.6, ry: 3.3 };

function buildFarm(fresh) {
  const m = newMap('farm', FARM_W, FARM_H, { outdoor: true, farmable: true, name: 'The Homestead', music: 'farm', fishTable: 'farm' });
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const dx = (x + 0.5 - POND.cx) / POND.rx, dy = (y + 0.5 - POND.cy) / POND.ry;
    if (dx * dx + dy * dy <= 1) setG(m, x, y, T.WATER);
  }
  fillG(m, 8, 8, 1, 3, T.DIRT);
  fillG(m, 8, 10, FARM_W - 8, 2, T.DIRT);
  addBuilding(m, 'cabin', 6, 5, [{ x: 8, y: 7 }], G.season);
  addWarp(m, 8, 7, 'cabin', 5, 7, UP);
  addWarp(m, FARM_W - 1, 10, 'town', 1, 14, RIGHT);
  addWarp(m, FARM_W - 1, 11, 'town', 1, 15, RIGHT);
  addObj(m, { type: 'bin', x: 11, y: 7 });
  addObj(m, { type: 'hut', x: 3, y: 7 });
  addObj(m, { type: 'mailbox', x: 9, y: 8 });
  addObj(m, { type: 'sign', x: 10, y: 9, text: "CARL & DONUT'S HOMESTEAD\nEst. Day 1. No pants required." });
  addObj(m, { type: 'bush', x: 5, y: 7, v: 1 });
  addObj(m, { type: 'bush', x: 13, y: 6, v: 0 });
  addObj(m, { type: 'flowers', x: 12, y: 8, v: 0 });
  addObj(m, { type: 'flowers', x: 4, y: 9, v: 1 });
  borderTrees(m, [{ x: FARM_W - 2, y: 10, w: 2, h: 2 }]);
  if (fresh) scatterDebris(m);
  return m;
}

function farmClearZone(x, y) {
  if (x >= 3 && x <= 15 && y >= 3 && y <= 9) return true;   // cabin yard
  if (y >= 9 && y <= 12) return true;                        // main path
  if (x >= 4 && x <= 17 && y >= 12 && y <= 17) return true;  // starter field
  const dx = (x + 0.5 - POND.cx) / (POND.rx + 1.2), dy = (y + 0.5 - POND.cy) / (POND.ry + 1.2);
  return dx * dx + dy * dy <= 1;
}

function scatterDebris(m) {
  for (let y = 2; y < m.h - 1; y++) for (let x = 2; x < m.w - 2; x++) {
    if (farmClearZone(x, y) || !canPlace(m, x, y)) continue;
    const r = Math.random();
    if (r < 0.055) addObj(m, { type: 'tree', x, y, hp: 10, v: randi(0, 1) });
    else if (r < 0.12) addObj(m, { type: 'weed', x, y, hp: 1, v: randi(0, 1) });
    else if (r < 0.165) addObj(m, { type: 'stone', x, y, hp: 2, v: randi(0, 1) });
    else if (r < 0.195) addObj(m, { type: 'twig', x, y, hp: 1, v: randi(0, 1) });
    else if (r < 0.2) addObj(m, { type: 'stump', x, y, hp: 4 });
  }
}

const FORAGE_BY_SEASON = [['wild_garlic'], ['spice_berry'], ['blackberry'], ['crystal_fruit']];
function spawnForage(m, count) {
  for (let n = 0; n < count; n++) {
    for (let tries = 0; tries < 30; tries++) {
      const x = randi(3, m.w - 4), y = randi(3, m.h - 3);
      const g = gAt(m, x, y);
      if ((g === T.GRASS) && canPlace(m, x, y) && !m.till[y * m.w + x]) {
        addObj(m, { type: 'forage', x, y, item: choice(FORAGE_BY_SEASON[G.season]) });
        break;
      }
    }
  }
}
function regrowDebris(m, count) {
  for (let n = 0; n < count; n++) {
    const x = randi(3, m.w - 4), y = randi(12, m.h - 3);
    if (farmClearZone(x, y) || !canPlace(m, x, y) || m.till[y * m.w + x] || gAt(m, x, y) !== T.GRASS) continue;
    addObj(m, chance(0.7) ? { type: 'weed', x, y, hp: 1, v: randi(0, 1) } : { type: 'stone', x, y, hp: 2, v: randi(0, 1) });
  }
}

// ---------------------------------------------------------------------------
// The Safe Room Plaza (town)
// ---------------------------------------------------------------------------
function buildTown() {
  const W = 40, H = 32;
  const m = newMap('town', W, H, { outdoor: true, name: 'Safe Room Plaza', music: 'town', fishTable: 'town' });
  fillG(m, 9, 10, 22, 15, T.STONE);
  fillG(m, 0, 14, 10, 2, T.DIRT);
  fillG(m, 19, 5, 2, 5, T.DIRT);
  fillG(m, 7, 9, 3, 1, T.DIRT);
  fillG(m, 30, 9, 1, 1, T.DIRT);
  fillG(m, 35, 16, 1, 1, T.STONE); fillG(m, 31, 16, 5, 1, T.STONE);
  fillG(m, 4, 22, 5, 1, T.DIRT);
  fillG(m, 0, 26, W, 2, T.SAND);
  fillG(m, 0, 28, W, 4, T.WATER);
  addBuilding(m, 'stairwell', 18, 3, [{ x: 19, y: 4 }, { x: 20, y: 4 }], G.season);
  addWarp(m, 19, 4, 'dungeon', 0, 0, DOWN, { dungeon: true });
  addWarp(m, 20, 4, 'dungeon', 0, 0, DOWN, { dungeon: true });
  addBuilding(m, 'shop', 5, 6, [{ x: 7, y: 8 }], G.season);
  addWarp(m, 7, 8, 'shop', 5, 8, UP);
  addBuilding(m, 'guild', 28, 6, [{ x: 30, y: 8 }], G.season);
  addWarp(m, 30, 8, 'guild', 5, 8, UP);
  const club = addBuilding(m, 'club', 33, 13, [], G.season);
  club.message = "A velvet rope blocks the door. A sign reads: 'DESPERADO CLUB — Members only. Crawler level 10+. No exceptions. Especially you, Carl.'";
  const kh = addBuilding(m, 'house2', 3, 20, [], G.season);
  kh.message = "Katia's place. The door is locked. A note says: 'Out adventuring. Or napping. Probably napping.'";
  const tr = addBuilding(m, 'trailer', 29, 21, [], G.season);
  tr.message = "Zev's Production Trailer. Through the window you see seventeen monitors, all showing you. That's not creepy at all.";
  addWarp(m, 0, 14, 'farm', FARM_W - 2, 10, LEFT);
  addWarp(m, 0, 15, 'farm', FARM_W - 2, 11, LEFT);
  addObj(m, { type: 'fountain', x: 19, y: 15 });
  addObj(m, { type: 'board', x: 15, y: 11 });
  addObj(m, { type: 'sign', x: 17, y: 7, text: 'THE STAIRWELL\nMonsters: yes. Loot: yes. Refunds: no.\nSafe rooms every 5 levels.' });
  addObj(m, { type: 'sign', x: 3, y: 13, text: "WEST: The Homestead\nEAST: Nothing. There's nothing east. Stop asking." });
  for (const [x, y] of [[9, 11], [30, 11], [9, 24], [26, 24], [17, 6], [22, 6]]) addObj(m, { type: 'lamp', x, y });
  addObj(m, { type: 'bench', x: 16, y: 20 });
  addObj(m, { type: 'bench', x: 24, y: 20 });
  for (const [x, y, v] of [[12, 9, 0], [25, 9, 1], [4, 11, 0], [36, 10, 1], [2, 24, 0], [37, 24, 1], [13, 25, 0]]) addObj(m, { type: 'bush', x, y, v });
  for (const [x, y, v] of [[11, 9, 1], [26, 9, 0], [15, 25, 1], [23, 25, 0], [5, 17, 1], [36, 19, 0]]) addObj(m, { type: 'flowers', x, y, v });
  borderTrees(m, [{ x: 0, y: 14, w: 2, h: 2 }, { x: 0, y: 26, w: W, h: 6 }]);
  return m;
}

// ---------------------------------------------------------------------------
// Interiors
// ---------------------------------------------------------------------------
function interiorShell(id, w, h, floor, wallKind, name, music) {
  const m = newMap(id, w, h, { wallKind, name, music });
  fillG(m, 0, 0, w, h, T.VOID);
  fillG(m, 1, 0, w - 2, 2, T.IWALL);
  fillG(m, 1, 2, w - 2, h - 3, floor);
  return m;
}

function buildCabin() {
  const m = interiorShell('cabin', 12, 9, T.WOOD, 'home', 'Personal Space', null);
  setG(m, 5, 8, T.WOOD);
  addWarp(m, 5, 8, 'farm', 8, 8, DOWN);
  addObj(m, { type: 'bed', x: 2, y: 2 });
  addObj(m, { type: 'tv', x: 8, y: 2 });
  addObj(m, { type: 'table', x: 7, y: 4 });
  addObj(m, { type: 'rug', x: 4, y: 4 });
  addObj(m, { type: 'toilet', x: 10, y: 2 });
  addObj(m, { type: 'shelf', x: 5, y: 2, kind: 'home' });
  return m;
}

function buildShop() {
  const m = interiorShell('shop', 12, 10, T.TILEF, 'shop', "Pook's Provisions", 'safe');
  setG(m, 5, 9, T.TILEF);
  addWarp(m, 5, 9, 'town', 7, 9, DOWN);
  for (let x = 3; x <= 8; x++) addObj(m, { type: 'counter', x, y: 4, shop: 'pook', kind: 'shop' });
  for (const x of [1, 2, 9, 10]) addObj(m, { type: 'shelf', x, y: 2, kind: 'shop' });
  addObj(m, { type: 'table', x: 9, y: 6 });
  addObj(m, { type: 'bush', x: 1, y: 7, v: 1 });
  return m;
}

function buildGuild() {
  const m = interiorShell('guild', 12, 10, T.CARPET, 'guild', 'Guild Hall', 'safe');
  setG(m, 5, 9, T.CARPET);
  addWarp(m, 5, 9, 'town', 30, 9, DOWN);
  for (let x = 2; x <= 8; x++) addObj(m, { type: 'counter', x, y: 5, shop: 'mordecai', kind: 'guild' });
  for (const x of [1, 2, 3, 10]) addObj(m, { type: 'shelf', x, y: 2, kind: 'guild' });
  addObj(m, { type: 'cauldron', x: 8, y: 3 });
  addObj(m, { type: 'table', x: 9, y: 7 });
  return m;
}

function buildWorld(fresh) {
  G.maps = {
    farm: buildFarm(fresh),
    town: buildTown(),
    cabin: buildCabin(),
    shop: buildShop(),
    guild: buildGuild(),
  };
}

// ---------------------------------------------------------------------------
// Base layer rendering (ground only), cached per map + season.
// ---------------------------------------------------------------------------
function tileCanvasFor(m, x, y) {
  const g = gAt(m, x, y);
  const v = Math.floor(hash2(x, y, 3) * 4);
  switch (g) {
    case T.GRASS: return grassTile(G.season, hash2(x, y, 9) < 0.08 ? 3 : v % 3);
    case T.DIRT: return dirtTile(v);
    case T.WATER: return waterTile(0);
    case T.STONE: return stoneTile((x + y) % 2);
    case T.WOOD: return woodTile(y % 3);
    case T.SAND: return sandTile(v);
    case T.CARPET: return carpetTile((x + y) % 2);
    case T.IWALL: return iwallTile(m.wallKind);
    case T.BRIDGE: return bridgeTile();
    case T.TILEF: return tileFloorTile((x + y) % 2);
    case T.CAVE: return caveFloorTile(m.theme, Math.floor(hash2(x, y, m.level) * 6));
    case T.WALL: return caveWallTile(m.theme, gAt(m, x, y + 1) !== T.WALL && inBounds(m, x, y + 1), Math.floor(hash2(x, y, 1) * 4));
    default: return null;
  }
}

function renderBase(m) {
  const key = G.season + '_' + m.theme;
  if (m.baseCanvas && m.baseKey === key) return m.baseCanvas;
  const c = m.baseCanvas || makeCanvas(m.w * TILE, m.h * TILE);
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, c.width, c.height);
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const tc = tileCanvasFor(m, tx, ty);
    if (tc) x.drawImage(tc, tx * TILE, ty * TILE);
    if (gAt(m, tx, ty) === T.WATER) {
      const px = tx * TILE, py = ty * TILE;
      const land = (ax, ay) => inBounds(m, ax, ay) && gAt(m, ax, ay) !== T.WATER;
      x.fillStyle = '#9ccaf4';
      if (land(tx, ty - 1)) { x.fillRect(px, py, 16, 2); x.fillStyle = '#2a5a9a'; x.fillRect(px, py + 2, 16, 1); x.fillStyle = '#9ccaf4'; }
      if (land(tx, ty + 1)) x.fillRect(px, py + 15, 16, 1);
      if (land(tx - 1, ty)) x.fillRect(px, py, 1, 16);
      if (land(tx + 1, ty)) x.fillRect(px + 15, py, 1, 16);
    }
  }
  m.baseCanvas = c;
  m.baseKey = key;
  return c;
}

// Returns {c, ox, oy} for an object.
function objSprite(o, m) {
  const s = G.season;
  switch (o.type) {
    case 'tree': return treeSprite(s, o.v || 0);
    case 'stump': return stumpSprite();
    case 'weed': return weedSprite(s, o.v || 0);
    case 'stone': return stoneSprite(o.v || 0);
    case 'twig': return twigSprite(o.v || 0);
    case 'boulder': return boulderSprite(m.theme, o.ore || null, o.v || 0);
    case 'crate': return crateSprite();
    case 'crop': return cropSprite(o.crop, cropStage(o));
    case 'withered': return witheredSprite();
    case 'sprinkler': return sprinklerSprite(0);
    case 'qsprinkler': return sprinklerSprite(1);
    case 'bin': return binSprite();
    case 'bed': return bedSprite();
    case 'tv': return tvSprite();
    case 'table': return tableSprite();
    case 'counter': return counterSprite(o.kind);
    case 'shelf': return shelfSprite(o.kind);
    case 'board': return boardSprite();
    case 'fountain': return fountainSprite();
    case 'lamp': return lampSprite();
    case 'bench': return benchSprite();
    case 'bush': return bushSprite(s, o.v || 0);
    case 'flowers': return flowersSprite(s, o.v || 0);
    case 'stairs': return stairsSprite(m.theme);
    case 'ladder': return ladderSprite();
    case 'chest': return chestSprite(o.tier);
    case 'rug': return rugSprite();
    case 'cauldron': return cauldronSprite();
    case 'hut': return hutSprite();
    case 'sign': return signSprite();
    case 'toilet': return toiletSprite();
    case 'mailbox': return mailboxSprite(mailWaiting() > 0);
    case 'forage': return { c: drawIcon(ITEMS[o.item].icon), ox: 0, oy: -2 };
  }
  return null;
}

function cropStage(o) {
  const cd = CROPS[o.crop];
  if (o.grown >= cd.days) return 3;
  return Math.min(2, Math.floor((o.grown / cd.days) * 3));
}
function cropReady(o) { return o.type === 'crop' && o.grown >= CROPS[o.crop].days; }

// Serialization of the farm (the only persistent outdoor state)
function serializeMap(m) {
  const seen = new Set();
  const objs = [];
  for (const o of m.objs.values()) { if (seen.has(o)) continue; seen.add(o); objs.push(o); }
  return { till: Array.from(m.till), wet: Array.from(m.wet), objs };
}
function applyMapState(m, st) {
  m.objs.clear();
  st.till.forEach((v, i) => { m.till[i] = v; });
  st.wet.forEach((v, i) => { m.wet[i] = v; });
  for (const o of st.objs) addObj(m, o);
}
