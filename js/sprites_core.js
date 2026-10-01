'use strict';
// ---------------------------------------------------------------------------
// Procedural pixel art: a tiny painter with auto-outline, plus ground tiles,
// world objects and buildings. Everything is generated once and cached.
// ---------------------------------------------------------------------------

const OUTLINE = '#20161c';
const SPR_CACHE = new Map();
function cached(key, fn) {
  let v = SPR_CACHE.get(key);
  if (!v) { v = fn(); SPR_CACHE.set(key, v); }
  return v;
}

function Pix(w, h) {
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  const p = {
    c, x, w, h,
    px(px, py, col) { x.fillStyle = col; x.fillRect(Math.floor(px), Math.floor(py), 1, 1); return p; },
    rect(px, py, rw, rh, col) { x.fillStyle = col; x.fillRect(Math.floor(px), Math.floor(py), Math.round(rw), Math.round(rh)); return p; },
    ell(cx, cy, rx, ry, col) {
      x.fillStyle = col;
      for (let yy = Math.floor(cy - ry - 1); yy <= Math.ceil(cy + ry); yy++) {
        for (let xx = Math.floor(cx - rx - 1); xx <= Math.ceil(cx + rx); xx++) {
          const dx = (xx + 0.5 - cx) / rx, dy = (yy + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) x.fillRect(xx, yy, 1, 1);
        }
      }
      return p;
    },
    line(x0, y0, x1, y1, col, th = 1) {
      x.fillStyle = col;
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        x.fillRect(x0, y0, th, th);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return p;
    },
    // Draws a 1px outline around all opaque pixels.
    outline(col = OUTLINE) {
      const d = x.getImageData(0, 0, w, h);
      const a = d.data;
      const [r, g, b] = hexToRgb(col);
      const mark = new Uint8Array(w * h);
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          if (a[(yy * w + xx) * 4 + 3] > 40) continue;
          const n = (xx > 0 && a[(yy * w + xx - 1) * 4 + 3] > 40) ||
                    (xx < w - 1 && a[(yy * w + xx + 1) * 4 + 3] > 40) ||
                    (yy > 0 && a[((yy - 1) * w + xx) * 4 + 3] > 40) ||
                    (yy < h - 1 && a[((yy + 1) * w + xx) * 4 + 3] > 40);
          if (n) mark[yy * w + xx] = 1;
        }
      }
      for (let i = 0; i < w * h; i++) {
        if (mark[i]) { a[i * 4] = r; a[i * 4 + 1] = g; a[i * 4 + 2] = b; a[i * 4 + 3] = 255; }
      }
      x.putImageData(d, 0, 0);
      return p;
    },
    noise(rx, ry, rw, rh, cols, density, seed) {
      const rng = mulberry32(seed);
      for (let yy = ry; yy < ry + rh; yy++) {
        for (let xx = rx; xx < rx + rw; xx++) {
          if (rng() < density) { x.fillStyle = cols[Math.floor(rng() * cols.length)]; x.fillRect(xx, yy, 1, 1); }
        }
      }
      return p;
    },
  };
  return p;
}

function flipCanvas(src) {
  const c = makeCanvas(src.width, src.height);
  const x = c.getContext('2d');
  x.translate(src.width, 0); x.scale(-1, 1);
  x.drawImage(src, 0, 0);
  return c;
}

// ---------------------------------------------------------------------------
// Ground tiles
// ---------------------------------------------------------------------------
const T = { GRASS: 0, DIRT: 1, WATER: 2, STONE: 3, WOOD: 4, WALL: 5, CAVE: 6, VOID: 7, SAND: 8, CARPET: 9, IWALL: 10, BRIDGE: 11, TILEF: 12 };
const SOLID_GROUND = new Set([T.WATER, T.WALL, T.VOID, T.IWALL]);

const GRASS_COLORS = [
  { base: '#5da84a', light: '#79c35c', dark: '#4a8f3a', flower: ['#ffffff', '#ffe05a', '#ff9ec7'] },
  { base: '#4c9a3c', light: '#66b34d', dark: '#3a7f2e', flower: ['#ffd23a', '#ff6a4a', '#ffffff'] },
  { base: '#a9923f', light: '#c2a84e', dark: '#8a7430', flower: ['#d9622a', '#b83a2a', '#e6a23a'] },
  { base: '#e6edf4', light: '#ffffff', dark: '#c6d2de', flower: ['#9fc4e8', '#ffffff', '#c6d2de'] },
];

const DUNGEON_THEMES = [
  { name: 'The Sewer Warrens', floor: '#6b5a48', floor2: '#5d4e3e', wall: '#33271f', wallFace: '#4f3e31', rock: '#8c7b69', tint: 'rgba(40,20,5,', light: '#ffb070' },
  { name: 'The Frozen Tangle', floor: '#5b6b80', floor2: '#4d5c70', wall: '#1f2839', wallFace: '#35445c', rock: '#a0b4ca', tint: 'rgba(5,15,40,', light: '#a8d8ff' },
  { name: 'The Hellfire Pits', floor: '#6c3b33', floor2: '#5c302a', wall: '#2a1115', wallFace: '#4a1d24', rock: '#94625a', tint: 'rgba(40,5,0,', light: '#ff8050' },
  { name: 'The Void Garden', floor: '#43405e', floor2: '#383550', wall: '#16132a', wallFace: '#2c2848', rock: '#8a84b0', tint: 'rgba(15,0,35,', light: '#d0a0ff' },
];

function grassTile(season, v) {
  return cached('grass' + season + '_' + v, () => {
    const gc = GRASS_COLORS[season];
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, gc.base);
    p.noise(0, 0, 16, 16, [gc.light, gc.dark], 0.12, v * 131 + season * 7 + 1);
    const rng = mulberry32(v * 977 + season);
    for (let i = 0; i < 3; i++) {
      const bx = Math.floor(rng() * 14) + 1, by = Math.floor(rng() * 12) + 3;
      p.px(bx, by, gc.dark).px(bx, by - 1, gc.light);
    }
    if (v === 3) {
      const fx = 4 + Math.floor(rng() * 8), fy = 4 + Math.floor(rng() * 8);
      const fc = gc.flower[Math.floor(rng() * gc.flower.length)];
      p.px(fx, fy - 1, fc).px(fx - 1, fy, fc).px(fx + 1, fy, fc).px(fx, fy + 1, fc).px(fx, fy, '#ffd23a');
    }
    return p.c;
  });
}

function dirtTile(v) {
  return cached('dirt' + v, () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, '#b48a56');
    p.noise(0, 0, 16, 16, ['#a07746', '#c49c66', '#9a7040'], 0.16, 55 + v);
    const rng = mulberry32(v * 31 + 9);
    for (let i = 0; i < 2; i++) { const x = Math.floor(rng() * 14) + 1, y = Math.floor(rng() * 14) + 1; p.px(x, y, '#8a8a8a').px(x + 1, y, '#a8a8a8'); }
    return p.c;
  });
}

function sandTile(v) {
  return cached('sand' + v, () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, '#e3cf95');
    p.noise(0, 0, 16, 16, ['#d4bd80', '#efe0ae'], 0.15, 77 + v);
    return p.c;
  });
}

function tilledTile(wet) {
  return cached('till' + wet, () => {
    const p = Pix(16, 16);
    const base = wet ? '#523a26' : '#7e5836';
    const dark = wet ? '#3e2b1b' : '#654428';
    const light = wet ? '#654a33' : '#946a42';
    p.rect(1, 1, 14, 14, base);
    for (let y = 3; y < 15; y += 4) { p.rect(2, y, 12, 1, dark); p.rect(2, y - 1, 12, 1, light); }
    p.rect(1, 1, 14, 1, light);
    p.noise(1, 1, 14, 14, [dark], 0.06, wet ? 3 : 4);
    return p.c;
  });
}

function waterTile(frame) {
  return cached('water' + frame, () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, '#3b78c8');
    p.noise(0, 0, 16, 16, ['#3570bb'], 0.2, 12);
    const o = frame * 4;
    p.rect((2 + o) % 16, 4, 4, 1, '#6aa6ec');
    p.rect((10 + o) % 16, 10, 3, 1, '#6aa6ec');
    p.rect((6 + o) % 16, 13, 2, 1, '#8cc0f4');
    return p.c;
  });
}

function stoneTile(v) {
  return cached('stone' + v, () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, '#a3a3ab');
    p.noise(0, 0, 16, 16, ['#b4b4bc', '#94949c'], 0.15, 90 + v);
    p.rect(0, 7, 16, 1, '#83838c');
    p.rect(0, 15, 16, 1, '#83838c');
    p.rect(v % 2 ? 4 : 11, 0, 1, 7, '#83838c');
    p.rect(v % 2 ? 11 : 4, 8, 1, 7, '#83838c');
    return p.c;
  });
}

function tileFloorTile(v) {
  return cached('tilef' + v, () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, (v % 2) ? '#d8d0c0' : '#c8bca8');
    p.rect(0, 15, 16, 1, '#a89c88').rect(15, 0, 1, 16, '#a89c88');
    return p.c;
  });
}

function woodTile(v) {
  return cached('wood' + v, () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, '#b27c4a');
    p.noise(0, 0, 16, 16, ['#a46f40', '#bd8756'], 0.12, 20 + v);
    for (let y = 3; y < 16; y += 4) p.rect(0, y, 16, 1, '#8a5a32');
    p.rect((v * 5) % 16, 0, 1, 3, '#8a5a32').rect((v * 5 + 7) % 16, 4, 1, 3, '#8a5a32').rect((v * 5 + 3) % 16, 8, 1, 3, '#8a5a32').rect((v * 5 + 11) % 16, 12, 1, 3, '#8a5a32');
    return p.c;
  });
}

function bridgeTile() {
  return cached('bridge', () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, '#9a6a3a');
    for (let x = 0; x < 16; x += 4) p.rect(x, 0, 1, 16, '#6e4824');
    p.rect(0, 0, 16, 2, '#5a3a1c').rect(0, 14, 16, 2, '#5a3a1c');
    return p.c;
  });
}

function carpetTile(v) {
  return cached('carpet' + v, () => {
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, '#8e3a4c');
    p.noise(0, 0, 16, 16, ['#9c4658', '#7e3242'], 0.2, 44 + v);
    if (v === 0) p.px(8, 8, '#e0b050').px(7, 8, '#c49030').px(9, 8, '#c49030').px(8, 7, '#c49030').px(8, 9, '#c49030');
    return p.c;
  });
}

function iwallTile(kind) {
  return cached('iwall' + kind, () => {
    const p = Pix(16, 16);
    const pal = kind === 'guild' ? ['#4a3a62', '#56466e', '#2e2240'] : kind === 'shop' ? ['#c9b48a', '#d6c299', '#6b4a2a'] : ['#d9c79c', '#e6d5ad', '#6b4a2a'];
    p.rect(0, 0, 16, 16, pal[0]);
    for (let x = 1; x < 16; x += 4) p.rect(x, 0, 2, 13, pal[1]);
    p.rect(0, 12, 16, 4, pal[2]);
    p.rect(0, 12, 16, 1, shade(pal[2], 0.3));
    return p.c;
  });
}

function caveFloorTile(theme, v) {
  return cached('cf' + theme + '_' + v, () => {
    const th = DUNGEON_THEMES[theme];
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, v % 3 === 0 ? th.floor2 : th.floor);
    p.noise(0, 0, 16, 16, [shade(th.floor, 0.12), shade(th.floor, -0.15)], 0.14, theme * 50 + v);
    if (v === 5) { p.px(5, 6, shade(th.floor, -0.3)).px(6, 7, shade(th.floor, -0.3)).px(7, 7, shade(th.floor, -0.3)); }
    return p.c;
  });
}

function caveWallTile(theme, face, v) {
  return cached('cw' + theme + '_' + face + '_' + v, () => {
    const th = DUNGEON_THEMES[theme];
    const p = Pix(16, 16);
    p.rect(0, 0, 16, 16, th.wall);
    p.noise(0, 0, 16, 16, [shade(th.wall, 0.12), shade(th.wall, -0.2)], 0.12, theme * 17 + v);
    if (face) {
      p.rect(0, 6, 16, 10, th.wallFace);
      p.noise(0, 6, 16, 10, [shade(th.wallFace, 0.15), shade(th.wallFace, -0.2)], 0.2, v + 3);
      p.rect(0, 6, 16, 1, shade(th.wallFace, 0.25));
      p.rect(0, 11, 16, 1, shade(th.wallFace, -0.25));
      p.rect((v * 3) % 12 + 2, 6, 1, 5, shade(th.wallFace, -0.25));
      p.rect((v * 7) % 12 + 2, 11, 1, 5, shade(th.wallFace, -0.25));
    }
    return p.c;
  });
}

// ---------------------------------------------------------------------------
// World objects. Each returns {c, ox, oy}: canvas plus draw offset from the
// top-left of the object's anchor tile.
// ---------------------------------------------------------------------------
function treeSprite(season, v = 0) {
  return cached('tree' + season + '_' + v, () => {
    const p = Pix(32, 48);
    p.rect(13, 30, 6, 17, '#6b4423');
    p.rect(13, 30, 2, 17, '#84552d');
    p.px(12, 46, '#6b4423').px(19, 46, '#6b4423');
    if (season === 3) {
      p.line(16, 32, 8, 18, '#6b4423', 2).line(16, 30, 24, 16, '#6b4423', 2).line(15, 26, 14, 10, '#6b4423', 2)
       .line(10, 22, 5, 17, '#6b4423').line(22, 21, 27, 18, '#6b4423');
      p.rect(7, 17, 4, 1, '#ffffff').rect(22, 15, 4, 1, '#ffffff').rect(12, 9, 4, 1, '#ffffff');
    } else {
      const cols = [
        ['#2f7a36', '#3f9443', '#63b85a'],
        ['#276b2c', '#347f37', '#4f9e45'],
        ['#b0522a', '#d27a34', '#eaa24a'],
      ][season];
      const off = v ? 1 : 0;
      p.ell(16, 20, 13, 12, cols[0]);
      p.ell(14 - off, 17, 11, 10, cols[1]);
      p.ell(19 + off, 13, 7, 6, cols[2]);
      p.ell(9, 22, 4, 3, cols[1]);
      p.noise(4, 6, 24, 24, [cols[0], cols[2]], 0.05, 5 + v + season * 3);
      if (season === 0 && v === 1) { p.px(10, 14, '#ffc0d8').px(20, 20, '#ffc0d8').px(15, 9, '#ffffff').px(24, 15, '#ffc0d8'); }
      if (season === 2) { p.px(8, 12, '#ffd060').px(22, 24, '#ffd060'); }
    }
    p.outline();
    return { c: p.c, ox: -8, oy: -32 };
  });
}

function stumpSprite() {
  return cached('stump', () => {
    const p = Pix(16, 16);
    p.ell(8, 11, 6, 4, '#6b4423');
    p.rect(2, 8, 12, 4, '#6b4423');
    p.ell(8, 8, 6, 3, '#b8854e');
    p.ell(8, 8, 3.5, 1.6, '#9a6a3a');
    p.px(8, 8, '#b8854e');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function weedSprite(season, v) {
  return cached('weed' + season + '_' + v, () => {
    const p = Pix(16, 16);
    const cols = [['#3f8f3a', '#6cc05a'], ['#347c30', '#5aa848'], ['#8a6a2a', '#c09a3a'], ['#8a9aa8', '#c8d4e0']][season];
    const blades = [[8, 3], [5, 6], [11, 5], [3, 9], [13, 8], [7, 5]];
    blades.forEach(([bx, by], i) => p.line(8 + (i % 3) - 1, 14, bx + (v % 2), by, i % 2 ? cols[0] : cols[1]));
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function stoneSprite(v) {
  return cached('stone_s' + v, () => {
    const p = Pix(16, 16);
    p.ell(8, 10.5, 5.5 + (v % 2), 4, '#8a8a94');
    p.ell(7, 9, 3.2, 2, '#b2b2bc');
    p.px(10, 12, '#6a6a74').px(11, 11, '#6a6a74');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function twigSprite(v) {
  return cached('twig' + v, () => {
    const p = Pix(16, 16);
    if (v % 2) p.line(3, 12, 13, 8, '#7a5230', 2).line(9, 10, 11, 5, '#7a5230');
    else p.line(2, 9, 13, 12, '#7a5230', 2).line(6, 10, 5, 5, '#7a5230');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

const ORE_COLORS = {
  copper: ['#d9843b', '#f0a860'], iron: ['#d8dde6', '#ffffff'], gold: ['#f4d03f', '#fff2a0'],
  coal: ['#141414', '#3a3a3a'], mana: ['#b05cff', '#e0b0ff'], ruby: ['#e0284a', '#ff8098'], diamond: ['#8ff3ff', '#ffffff'],
  quartz: ['#f0f0f8', '#ffffff'],
};

function boulderSprite(theme, ore, v) {
  return cached('bld' + theme + '_' + ore + '_' + v, () => {
    const th = DUNGEON_THEMES[theme];
    const p = Pix(16, 16);
    p.ell(8, 9.5, 7, 5.5 + (v % 2) * 0.5, th.rock);
    p.ell(7, 7.5, 4.5, 3, shade(th.rock, 0.2));
    p.ell(10, 12, 4, 1.6, shade(th.rock, -0.2));
    p.px(4, 10, shade(th.rock, -0.35)).px(5, 11, shade(th.rock, -0.35)).px(11, 7, shade(th.rock, -0.3));
    if (ore && ORE_COLORS[ore]) {
      const [a, b] = ORE_COLORS[ore];
      const spots = [[5, 7], [10, 9], [7, 11], [11, 6], [4, 10]];
      spots.forEach(([sx, sy], i) => { p.px(sx, sy, a).px(sx + 1, sy, i % 2 ? b : a); if (i % 2 === 0) p.px(sx, sy - 1, b); });
    }
    p.outline();
    return { c: p.c, ox: 0, oy: -2 };
  });
}

function crateSprite() {
  return cached('crate', () => {
    const p = Pix(16, 16);
    p.rect(2, 3, 12, 12, '#a0703a');
    p.rect(2, 3, 12, 2, '#c08a4a');
    p.line(3, 6, 12, 13, '#7a5028').line(12, 6, 3, 13, '#7a5028');
    p.rect(2, 8, 12, 1, '#7a5028');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

function sprinklerSprite(q) {
  return cached('sprk' + q, () => {
    const p = Pix(16, 16);
    const m = q ? '#e0b030' : '#9aa4ae', d = q ? '#a07818' : '#6a747e';
    p.rect(3, 8, 10, 2, m).rect(7, 4, 2, 10, m);
    p.ell(8, 9, 2.5, 2.5, d);
    p.rect(7, 3, 2, 2, '#4aa8e8');
    p.px(3, 8, d).px(12, 8, d).px(7, 13, d);
    p.outline();
    return { c: p.c, ox: 0, oy: -2 };
  });
}

function binSprite() {
  return cached('bin', () => {
    const p = Pix(16, 16);
    p.rect(1, 5, 14, 10, '#8e5a2e');
    p.rect(1, 3, 14, 3, '#b07440');
    p.rect(1, 8, 14, 1, '#6e4420').rect(1, 12, 14, 1, '#6e4420');
    p.rect(6, 6, 4, 3, '#f0c040');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

function bedSprite() {
  return cached('bed', () => {
    const p = Pix(16, 32);
    p.rect(1, 1, 14, 6, '#6e4420');
    p.rect(2, 7, 12, 22, '#8e5a2e');
    p.rect(3, 7, 10, 5, '#f4f0e6');
    p.rect(2, 12, 12, 16, '#c0392b');
    for (let y = 14; y < 28; y += 4) p.rect(2, y, 12, 1, '#962d22');
    p.rect(6, 12, 1, 16, '#962d22').rect(10, 12, 1, 16, '#962d22');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function tvSprite() {
  return cached('tv', () => {
    const p = Pix(16, 16);
    p.rect(1, 9, 14, 6, '#6e4420');
    p.rect(2, 2, 12, 8, '#2a2a30');
    p.rect(3, 3, 10, 6, '#6ec8f0');
    p.px(5, 4, '#bff0ff').px(6, 4, '#bff0ff');
    p.line(6, 0, 8, 2, '#555').line(11, 0, 9, 2, '#555');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

function tableSprite() {
  return cached('table', () => {
    const p = Pix(16, 16);
    p.rect(1, 4, 14, 6, '#a06a38');
    p.rect(1, 4, 14, 1, '#c08a50');
    p.rect(2, 10, 2, 5, '#7a4c26').rect(12, 10, 2, 5, '#7a4c26');
    p.rect(9, 1, 3, 4, '#e8e8e8').rect(12, 2, 1, 2, '#e8e8e8');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function counterSprite(kind) {
  return cached('counter' + kind, () => {
    const p = Pix(16, 16);
    const top = kind === 'guild' ? '#5a3a6a' : '#b07c48';
    p.rect(0, 2, 16, 13, shade(top, -0.25));
    p.rect(0, 2, 16, 4, top);
    p.rect(0, 2, 16, 1, shade(top, 0.25));
    p.rect(0, 10, 16, 1, shade(top, -0.4));
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function shelfSprite(kind) {
  return cached('shelf' + kind, () => {
    const p = Pix(16, 24);
    p.rect(1, 1, 14, 22, '#6e4420');
    p.rect(2, 2, 12, 20, '#4e2e14');
    const goods = kind === 'guild' ? ['#7dff9a', '#b05cff', '#ff6a6a', '#6ab0ff'] : ['#e05a3a', '#f0c040', '#6ac05a', '#e8e0d0'];
    for (let s = 0; s < 3; s++) {
      p.rect(2, 8 + s * 7, 12, 1, '#8e5a2e');
      for (let i = 0; i < 4; i++) p.rect(3 + i * 3, 4 + s * 7, 2, 4, goods[(i + s) % goods.length]);
    }
    p.outline();
    return { c: p.c, ox: 0, oy: -8 };
  });
}

function boardSprite() {
  return cached('board', () => {
    const p = Pix(16, 24);
    p.rect(2, 12, 2, 12, '#6e4420').rect(12, 12, 2, 12, '#6e4420');
    p.rect(0, 2, 16, 13, '#8e5a2e');
    p.rect(1, 3, 14, 11, '#c89a60');
    p.rect(2, 4, 5, 5, '#f4f0e0').rect(8, 5, 5, 6, '#fff8c8').rect(3, 10, 4, 3, '#f4d0d0');
    p.px(4, 4, '#e03030').px(10, 5, '#3060e0');
    p.outline();
    return { c: p.c, ox: 0, oy: -8 };
  });
}

function fountainSprite() {
  return cached('fountain', () => {
    const p = Pix(48, 48);
    p.ell(24, 30, 22, 14, '#9a9aa4');
    p.ell(24, 29, 19, 11, '#4a88d8');
    p.ell(24, 27, 17, 8, '#5c9ae8');
    p.rect(21, 8, 6, 22, '#b4b4bc');
    p.ell(24, 10, 7, 3, '#9a9aa4');
    p.ell(24, 9, 5, 2, '#5c9ae8');
    p.outline();
    return { c: p.c, ox: 0, oy: -4 };
  });
}

function lampSprite() {
  return cached('lamp', () => {
    const p = Pix(16, 32);
    p.rect(7, 8, 2, 23, '#33333a');
    p.rect(5, 29, 6, 2, '#33333a');
    p.rect(4, 2, 8, 7, '#33333a');
    p.rect(5, 3, 6, 5, '#ffe38a');
    p.rect(3, 1, 10, 1, '#33333a');
    p.outline();
    return { c: p.c, ox: 0, oy: -16 };
  });
}

function benchSprite() {
  return cached('bench', () => {
    const p = Pix(16, 16);
    p.rect(1, 4, 14, 3, '#9a6a3a').rect(1, 8, 14, 3, '#b07c48');
    p.rect(2, 11, 2, 4, '#4a4a50').rect(12, 11, 2, 4, '#4a4a50');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function bushSprite(season, v) {
  return cached('bush' + season + '_' + v, () => {
    const p = Pix(16, 16);
    const cols = [['#2f7a36', '#4f9e45'], ['#276b2c', '#3f8f3a'], ['#9a4a24', '#c8742e'], ['#7a8a96', '#e8eef4']][season];
    p.ell(8, 9, 7, 6, cols[0]);
    p.ell(7, 7.5, 5, 4, cols[1]);
    if (v === 1 && season < 2) p.px(5, 6, '#e03050').px(10, 9, '#e03050').px(8, 5, '#e03050');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

function flowersSprite(season, v) {
  return cached('flw' + season + '_' + v, () => {
    const p = Pix(16, 16);
    if (season === 3) return { c: p.c, ox: 0, oy: 0 };
    const cols = GRASS_COLORS[season].flower;
    const spots = [[3, 5], [9, 3], [12, 9], [5, 11], [8, 8]];
    spots.forEach(([x, y], i) => {
      p.px(x, y + 1, '#3f8f3a').px(x, y + 2, '#3f8f3a');
      const c = cols[(i + v) % cols.length];
      p.px(x, y, c).px(x - 1, y, c).px(x + 1, y, c).px(x, y - 1, c);
      p.px(x, y, '#ffd23a');
    });
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function stairsSprite(theme) {
  return cached('stairs' + theme, () => {
    const th = DUNGEON_THEMES[theme];
    const p = Pix(16, 16);
    p.rect(1, 1, 14, 14, '#0a0608');
    for (let i = 0; i < 4; i++) p.rect(2 + i, 2 + i * 3, 12 - i * 2, 2, shade(th.rock, -0.2 - i * 0.15));
    p.rect(0, 0, 16, 1, shade(th.rock, 0.1)).rect(0, 0, 1, 16, shade(th.rock, 0.1)).rect(15, 0, 1, 16, shade(th.rock, -0.3));
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function ladderSprite() {
  return cached('ladder', () => {
    const p = Pix(16, 24);
    p.rect(3, 0, 2, 24, '#8e5a2e').rect(11, 0, 2, 24, '#8e5a2e');
    for (let y = 3; y < 24; y += 5) p.rect(5, y, 6, 2, '#b07c48');
    p.outline();
    return { c: p.c, ox: 0, oy: -8 };
  });
}

const CHEST_COLORS = { bronze: ['#b87333', '#e0a060'], silver: ['#aab4c0', '#e8eef4'], gold: ['#e8b830', '#fff0a0'], legendary: ['#c050ff', '#ffb0ff'] };
function chestSprite(tier) {
  return cached('chest' + tier, () => {
    const [a, b] = CHEST_COLORS[tier] || CHEST_COLORS.bronze;
    const p = Pix(16, 16);
    p.rect(2, 6, 12, 8, shade(a, -0.2));
    p.rect(2, 3, 12, 4, a);
    p.rect(2, 3, 12, 1, b);
    p.rect(7, 6, 2, 3, '#2a2a2a');
    p.rect(2, 9, 12, 1, shade(a, -0.4));
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

function bombSprite(mega) {
  return cached('bombobj' + mega, () => {
    const p = Pix(16, 16);
    const r = mega ? 5.5 : 4;
    p.ell(8, 10, r, r, mega ? '#5a1a1a' : '#26262e');
    p.px(6, 8, '#888').px(7, 7, '#aaa');
    p.rect(8, 10 - r - 2, 1, 2, '#c8a060');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function cauldronSprite() {
  return cached('cauldron', () => {
    const p = Pix(16, 16);
    p.ell(8, 10, 6.5, 5, '#26262e');
    p.ell(8, 7, 6, 2, '#4aff7a');
    p.px(6, 6, '#b0ffc8').px(10, 7, '#b0ffc8');
    p.rect(3, 14, 2, 2, '#26262e').rect(11, 14, 2, 2, '#26262e');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

function hutSprite() {
  return cached('hut', () => {
    const p = Pix(32, 32);
    p.rect(3, 14, 26, 17, '#9a6a3a');
    for (let y = 17; y < 31; y += 4) p.rect(3, y, 26, 1, '#7a4c26');
    for (let y = 0; y < 14; y++) { const inset = 14 - y; p.rect(1 + inset, y + 2, 30 - inset * 2, 1, y % 3 === 0 ? '#3e7a4a' : '#4e9a5a'); }
    p.ell(16, 25, 5, 6, '#1a1210');
    p.rect(11, 25, 10, 6, '#1a1210');
    p.outline();
    return { c: p.c, ox: 0, oy: -16 };
  });
}

function signSprite() {
  return cached('sign', () => {
    const p = Pix(16, 16);
    p.rect(7, 9, 2, 7, '#6e4420');
    p.rect(1, 2, 14, 8, '#b07c48');
    p.rect(3, 4, 10, 1, '#6e4420').rect(3, 6, 7, 1, '#6e4420');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

// Red flag up when there's mail waiting.
function mailboxSprite(flag) {
  return cached('mailbox' + (flag ? 1 : 0), () => {
    const p = Pix(16, 16);
    p.rect(7, 9, 2, 7, '#6e4420');
    p.rect(3, 3, 10, 7, '#4a6a9a').rect(3, 3, 10, 2, '#6a8aba').rect(3, 9, 10, 1, '#3a5a8a');
    p.rect(3, 4, 1, 5, '#2a3a5a');
    if (flag) p.rect(12, 0, 1, 5, '#555').rect(13, 0, 3, 2, '#e03a3a');
    else p.rect(12, 6, 3, 1, '#555').rect(14, 5, 2, 2, '#a02a2a');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

function rugSprite() {
  return cached('rug', () => {
    const p = Pix(48, 32);
    p.rect(2, 2, 44, 28, '#3a6a8e');
    p.rect(5, 5, 38, 22, '#e0c070');
    p.rect(8, 8, 32, 16, '#3a6a8e');
    p.rect(16, 13, 16, 6, '#c0392b');
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function witheredSprite() {
  return cached('withered', () => {
    const p = Pix(16, 16);
    p.line(8, 14, 8, 6, '#6a5030').line(8, 9, 5, 6, '#6a5030').line(8, 8, 11, 5, '#6a5030');
    p.px(4, 5, '#8a6a3a').px(12, 4, '#8a6a3a');
    p.outline();
    return { c: p.c, ox: 0, oy: 0 };
  });
}

function toiletSprite() {
  return cached('toilet', () => {
    const p = Pix(16, 16);
    p.rect(4, 1, 8, 6, '#f0f0f4');
    p.ell(8, 10, 5, 4, '#f0f0f4');
    p.ell(8, 10, 3, 2, '#9ad0f0');
    p.outline();
    return { c: p.c, ox: 0, oy: -1 };
  });
}

// ---------------------------------------------------------------------------
// Crops: 4 growth stages. Stage 3 draws the produce.
// ---------------------------------------------------------------------------
function cropSprite(cropId, stage) {
  return cached('crop' + cropId + '_' + stage, () => {
    const cd = CROPS[cropId];
    const p = Pix(16, 24);
    const leaf = cd.leaf || '#4caa3c', leafD = shade(leaf, -0.25);
    const b = 22; // soil line
    if (stage === 0) {
      p.px(5, b - 1, '#d8c890').px(8, b - 2, '#d8c890').px(11, b - 1, '#d8c890');
      p.px(8, b - 3, leaf);
    } else if (stage === 1) {
      p.line(8, b, 8, b - 5, leafD);
      p.ell(6, b - 5, 2, 1.2, leaf).ell(10, b - 6, 2, 1.2, leaf);
    } else if (stage === 2) {
      p.line(8, b, 8, b - 9, leafD);
      p.ell(5, b - 5, 3, 1.5, leaf).ell(11, b - 6, 3, 1.5, leaf).ell(6, b - 9, 2.5, 1.3, leaf).ell(10, b - 10, 2.5, 1.3, leafD);
    } else {
      const c = cd.color, c2 = cd.color2 || shade(cd.color, 0.3);
      switch (cd.shape) {
        case 'root':
          p.ell(8, b - 2, 4, 3.5, c).px(7, b - 3, c2);
          p.line(8, b - 5, 5, b - 12, leaf).line(8, b - 5, 11, b - 12, leaf).line(8, b - 5, 8, b - 13, leafD);
          p.ell(5, b - 12, 1.5, 2, leaf).ell(11, b - 12, 1.5, 2, leaf);
          break;
        case 'mandrake':
          p.line(8, b, 8, b - 6, leafD);
          p.ell(8, b - 4, 4.5, 4, c);
          p.px(6, b - 5, '#1a1010').px(10, b - 5, '#1a1010').rect(7, b - 3, 3, 2, '#3a1010');
          p.line(8, b - 8, 4, b - 14, leaf).line(8, b - 8, 12, b - 14, leaf).line(8, b - 8, 8, b - 16, leafD);
          p.ell(4, b - 14, 2, 1.5, leaf).ell(12, b - 14, 2, 1.5, leaf).ell(8, b - 16, 1.5, 2, leaf);
          break;
        case 'bush':
          p.ell(8, b - 7, 6, 6, leaf).ell(7, b - 8, 4, 4, shade(leaf, 0.15));
          [[5, b - 9], [10, b - 10], [8, b - 5], [11, b - 6], [5, b - 5]].forEach(([x, y]) => { p.rect(x, y, 2, 2, c); p.px(x, y, c2); });
          break;
        case 'pepper':
          p.line(8, b, 8, b - 12, leafD);
          p.ell(5, b - 8, 3, 1.5, leaf).ell(11, b - 10, 3, 1.5, leaf).ell(8, b - 13, 2.5, 1.5, leaf);
          p.rect(4, b - 7, 2, 5, c).px(4, b - 7, c2).rect(10, b - 9, 2, 5, c).px(10, b - 9, c2);
          break;
        case 'melon':
          p.line(2, b - 2, 14, b - 3, leafD);
          p.ell(4, b - 5, 2.5, 1.5, leaf).ell(13, b - 6, 2.5, 1.5, leaf);
          p.ell(8, b - 5, 5.5, 4.5, c);
          p.line(5, b - 8, 5, b - 2, c2).line(8, b - 9, 8, b - 1, c2).line(11, b - 8, 11, b - 2, c2);
          break;
        case 'gourd':
          p.ell(8, b - 5, 6.5, 5, c);
          p.line(5, b - 9, 5, b - 1, shade(c, -0.2)).line(11, b - 9, 11, b - 1, shade(c, -0.2));
          p.rect(7, b - 12, 2, 3, '#6a4a20');
          p.ell(11, b - 11, 2.5, 1.5, leaf);
          break;
        case 'corn':
          p.line(8, b, 8, b - 18, leafD);
          p.line(8, b - 4, 3, b - 10, leaf).line(8, b - 7, 13, b - 13, leaf).line(8, b - 11, 4, b - 17, leaf);
          p.ell(10, b - 10, 1.5, 3.5, c).ell(6, b - 13, 1.5, 3, c);
          p.px(8, b - 19, '#e8d8a0');
          break;
        case 'leafy':
          p.ell(8, b - 5, 6, 4.5, c).ell(6, b - 7, 3, 3, c2).ell(11, b - 7, 3, 3, shade(c, -0.1));
          p.line(8, b - 2, 8, b - 9, shade(c, -0.3));
          break;
        case 'mushroom':
          p.rect(7, b - 6, 2, 6, '#e8e0d0');
          p.ell(8, b - 7, 5, 3, c).px(6, b - 8, c2).px(10, b - 8, c2).px(8, b - 9, c2);
          p.rect(3, b - 3, 1, 3, '#e8e0d0'); p.ell(3.5, b - 3.5, 2, 1.3, c);
          break;
        default:
          p.ell(8, b - 6, 5, 5, c);
      }
    }
    p.outline();
    return { c: p.c, ox: 0, oy: -8 };
  });
}

// ---------------------------------------------------------------------------
// Buildings. {c, fw, fh} fw/fh = footprint in tiles (bottom aligned).
// ---------------------------------------------------------------------------
function roof(p, top, bottom, x0top, x1top, x0bot, x1bot, col, line) {
  for (let y = top; y < bottom; y++) {
    const t = (y - top) / (bottom - top);
    const a = Math.round(lerp(x0top, x0bot, t)), b = Math.round(lerp(x1top, x1bot, t));
    p.rect(a, y, b - a, 1, (y - top) % 5 === 4 ? line : col);
  }
}

function buildingSprite(kind, season) {
  return cached('bld_' + kind + '_' + (season || 0), () => {
    let p;
    const snow = season === 3;
    switch (kind) {
      case 'cabin': {
        p = Pix(80, 80);
        p.rect(4, 36, 72, 44, '#a8703c');
        for (let y = 38; y < 80; y += 6) p.rect(4, y, 72, 1, '#8a5a2e');
        p.rect(2, 36, 4, 44, '#8a5a2e').rect(74, 36, 4, 44, '#8a5a2e');
        p.rect(56, 2, 8, 16, '#7a7a82').rect(55, 1, 10, 2, '#5a5a62');
        roof(p, 8, 42, 12, 68, 0, 80, '#b8443c', '#8e3028');
        if (snow) roof(p, 8, 14, 12, 68, 9, 71, '#f4f8ff', '#dfe8f2');
        p.rect(34, 52, 12, 28, '#5a3620').rect(35, 53, 10, 27, '#6e4428').px(43, 66, '#f0c040');
        p.rect(9, 52, 16, 13, '#5a3620').rect(10, 53, 14, 11, '#9fd8ff').rect(16, 53, 2, 11, '#5a3620').rect(10, 58, 14, 1, '#5a3620');
        p.rect(55, 52, 16, 13, '#5a3620').rect(56, 53, 14, 11, '#9fd8ff').rect(62, 53, 2, 11, '#5a3620').rect(56, 58, 14, 1, '#5a3620');
        p.outline();
        return { c: p.c, fw: 5, fh: 3, label: 'PERSONAL SPACE', labelY: 46 };
      }
      case 'shop': {
        p = Pix(96, 80);
        p.rect(4, 30, 88, 50, '#d8c8a8');
        for (let y = 34; y < 80; y += 6) { p.rect(4, y, 88, 1, '#bca888'); for (let x = 4 + ((y / 6) % 2) * 6; x < 92; x += 12) p.rect(x, y - 5, 1, 5, '#bca888'); }
        roof(p, 4, 34, 10, 86, 0, 96, '#3e8a5a', '#2e6a44');
        if (snow) roof(p, 4, 10, 10, 86, 8, 88, '#f4f8ff', '#dfe8f2');
        for (let x = 4; x < 92; x += 8) p.rect(x, 42, 8, 7, (x / 8) % 2 ? '#f4f0e6' : '#3e8a5a');
        p.rect(34, 54, 12, 26, '#5a3620').rect(35, 55, 10, 25, '#7a4a2a').px(43, 67, '#f0c040');
        p.rect(60, 54, 26, 16, '#5a3620').rect(61, 55, 24, 14, '#9fd8ff');
        p.rect(64, 62, 4, 6, '#e05a3a').rect(70, 60, 4, 8, '#f0c040').rect(76, 63, 5, 5, '#6ac05a');
        p.rect(8, 56, 20, 14, '#5a3620').rect(9, 57, 18, 12, '#9fd8ff');
        p.outline();
        return { c: p.c, fw: 6, fh: 3, label: "POOK'S PROVISIONS", labelY: 38 };
      }
      case 'guild': {
        p = Pix(96, 96);
        p.rect(6, 46, 84, 50, '#4a3a5a');
        for (let x = 6; x < 90; x += 6) p.rect(x, 46, 1, 50, '#3a2c48');
        roof(p, 0, 50, 30, 66, 0, 96, '#5e3a8e', '#472a6e');
        if (snow) roof(p, 0, 8, 30, 66, 26, 70, '#f4f8ff', '#dfe8f2');
        p.rect(44, 4, 8, 10, '#7dff9a');
        p.ell(40, 74, 8, 7, '#2a1c38'); p.rect(32, 74, 16, 22, '#2a1c38'); p.rect(34, 76, 12, 20, '#5a3a2a');
        p.px(43, 86, '#f0c040');
        p.rect(12, 62, 16, 14, '#2a1c38').rect(13, 63, 14, 12, '#7dff9a').rect(19, 63, 2, 12, '#2a1c38');
        p.rect(68, 62, 16, 14, '#2a1c38').rect(69, 63, 14, 12, '#7dff9a').rect(75, 63, 2, 12, '#2a1c38');
        p.outline();
        return { c: p.c, fw: 6, fh: 3, label: 'GUILD HALL', labelY: 56 };
      }
      case 'stairwell': {
        p = Pix(64, 64);
        p.rect(0, 10, 64, 54, '#6a6a74');
        for (let y = 14; y < 64; y += 7) { p.rect(0, y, 64, 1, '#55555e'); for (let x = ((y / 7) % 2) * 8; x < 64; x += 16) p.rect(x, y - 6, 1, 6, '#55555e'); }
        p.rect(0, 8, 64, 4, '#84848e');
        p.ell(32, 36, 15, 10, '#0a0608'); p.rect(17, 36, 30, 28, '#0a0608');
        for (let i = 0; i < 5; i++) p.rect(20 + i * 2, 44 + i * 4, 24 - i * 4, 2, shade('#6a6a74', -0.3 - i * 0.1));
        p.rect(28, 14, 8, 2, '#ff3040').rect(29, 16, 6, 2, '#ff3040').rect(30, 18, 4, 2, '#ff3040').rect(31, 20, 2, 2, '#ff3040');
        if (snow) p.rect(0, 8, 64, 3, '#f4f8ff');
        p.outline();
        return { c: p.c, fw: 4, fh: 2, label: 'THE STAIRWELL', labelY: 4 };
      }
      case 'trailer': {
        p = Pix(80, 48);
        p.rect(2, 6, 76, 34, '#c8ccd4');
        p.rect(2, 6, 76, 3, '#e8ecf4');
        p.rect(2, 22, 76, 4, '#e05a8a');
        p.rect(8, 11, 14, 9, '#2a3a5a').rect(28, 11, 14, 9, '#2a3a5a');
        p.rect(54, 11, 14, 28, '#8a8e96').px(56, 26, '#f0c040');
        p.ell(18, 42, 5, 5, '#1a1a1a').ell(62, 42, 5, 5, '#1a1a1a').ell(18, 42, 2, 2, '#888').ell(62, 42, 2, 2, '#888');
        if (snow) p.rect(2, 4, 76, 3, '#f4f8ff');
        p.outline();
        return { c: p.c, fw: 5, fh: 2, label: 'BORANT PR', labelY: 30 };
      }
      case 'club': {
        p = Pix(80, 80);
        p.rect(2, 20, 76, 60, '#2a2030');
        for (let y = 24; y < 80; y += 8) p.rect(2, y, 76, 1, '#221828');
        p.rect(0, 16, 80, 6, '#1a1420');
        p.rect(10, 26, 60, 14, '#ff4fa8').rect(12, 28, 56, 10, '#2a1030');
        p.rect(32, 52, 16, 28, '#0e0a12').rect(33, 53, 14, 27, '#1a1420').px(45, 66, '#f0c040');
        p.rect(8, 50, 16, 14, '#4a1a5a').rect(56, 50, 16, 14, '#4a1a5a');
        if (snow) p.rect(0, 14, 80, 3, '#f4f8ff');
        p.outline();
        return { c: p.c, fw: 5, fh: 3, label: 'DESPERADO CLUB', labelY: 34, labelColor: '#ff7fc8' };
      }
      case 'house2': {
        p = Pix(64, 64);
        p.rect(4, 28, 56, 36, '#c9a47a');
        for (let y = 30; y < 64; y += 5) p.rect(4, y, 56, 1, '#b08a60');
        roof(p, 4, 32, 12, 52, 0, 64, '#4a6a9a', '#3a5480');
        if (snow) roof(p, 4, 9, 12, 52, 9, 55, '#f4f8ff', '#dfe8f2');
        p.rect(18, 44, 12, 20, '#5a3620');
        p.rect(8, 42, 12, 10, '#5a3620').rect(9, 43, 10, 8, '#9fd8ff');
        p.rect(44, 42, 12, 10, '#5a3620').rect(45, 43, 10, 8, '#9fd8ff');
        p.outline();
        return { c: p.c, fw: 4, fh: 2, label: "KATIA'S", labelY: 36 };
      }
    }
    return null;
  });
}
