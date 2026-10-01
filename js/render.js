'use strict';
// ---------------------------------------------------------------------------
// World rendering: ground, y-sorted objects & entities, effects, lighting.
// ---------------------------------------------------------------------------

let lightCanvas = null;

function computeCamera(W, H) {
  const z = G.zoom, m = G.map, P = G.player;
  const vw = W / z, vh = H / z;
  const mw = m.w * TILE, mh = m.h * TILE;
  let cx = P.x - vw / 2, cy = P.y - 8 - vh / 2;
  cx = mw <= vw ? (mw - vw) / 2 : clamp(cx, 0, mw - vw);
  cy = mh <= vh ? (mh - vh) / 2 : clamp(cy, 0, mh - vh);
  if (G.shake > 0) { cx += rand(-1, 1) * G.shake * 3; cy += rand(-1, 1) * G.shake * 3; }
  G.cam = { x: Math.round(cx * z) / z, y: Math.round(cy * z) / z, w: vw, h: vh };
}

function renderWorld(ctx, W, H, dt) {
  const m = G.map, z = G.zoom, cam = G.cam, now = performance.now() / 1000;
  ctx.setTransform(z, 0, 0, z, -cam.x * z, -cam.y * z);
  ctx.imageSmoothingEnabled = false;

  // ground
  const base = renderBase(m);
  const sx = clamp(Math.floor(cam.x), 0, base.width), sy = clamp(Math.floor(cam.y), 0, base.height);
  const sw = Math.min(base.width - sx, Math.ceil(cam.w) + 2), sh = Math.min(base.height - sy, Math.ceil(cam.h) + 2);
  if (sw > 0 && sh > 0) ctx.drawImage(base, sx, sy, sw, sh, sx, sy, sw, sh);

  const tx0 = Math.max(0, Math.floor(cam.x / TILE)), ty0 = Math.max(0, Math.floor(cam.y / TILE));
  const tx1 = Math.min(m.w - 1, Math.ceil((cam.x + cam.w) / TILE)), ty1 = Math.min(m.h - 1, Math.ceil((cam.y + cam.h) / TILE));
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const i = ty * m.w + tx;
    if (m.till[i]) ctx.drawImage(tilledTile(m.wet[i] ? 1 : 0), tx * TILE, ty * TILE);
    else if (m.ground[i] === T.WATER) {
      const h = hash2(tx, ty, 5);
      const ox = Math.floor((now * 6 + h * 16) % 16);
      ctx.fillStyle = 'rgba(160,210,255,0.55)';
      ctx.fillRect(tx * TILE + ox, ty * TILE + 4 + Math.floor(h * 8), 3, 1);
      ctx.fillRect(tx * TILE + ((ox + 8) % 14), ty * TILE + 11 - Math.floor(h * 4), 2, 1);
    }
  }

  // flat objects + ground effects
  const seen = new Set();
  const drawables = [];
  for (let ty = ty0 - 1; ty <= ty1 + 3; ty++) for (let tx = tx0 - 2; tx <= tx1 + 2; tx++) {
    const o = getObj(m, tx, ty);
    if (!o || seen.has(o)) continue;
    seen.add(o);
    const def = OBJ[o.type] || {};
    if (def.flat) drawObject(ctx, o, m, dt);
    else drawables.push({ y: (o.y + (o.h || def.h || 1)) * TILE - (o.type === 'crop' ? 2 : 0), fn: () => drawObject(ctx, o, m, dt) });
  }
  for (const h of G.hazards) {
    const f = clamp(1 - h.t / h.max, 0, 1);
    ctx.fillStyle = `rgba(255,40,80,${0.15 + f * 0.3})`;
    ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,120,150,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * f, h.r * 0.6 * f, 0, 0, Math.PI * 2); ctx.stroke();
  }

  for (const b of m.buildings) {
    const spr = buildingSprite(b.kind, G.season);
    const bx = b.x * TILE, by = (b.y + b.fh) * TILE - spr.c.height;
    drawables.push({ y: (b.y + b.fh) * TILE - 1, fn: () => {
      ctx.drawImage(spr.c, bx, by);
      if (spr.label) {
        ctx.font = `700 5px ${FONT_UI}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lw = ctx.measureText(spr.label).width + 6;
        const lx = bx + spr.c.width / 2, ly = by + spr.labelY;
        ctx.fillStyle = 'rgba(40,20,10,0.85)'; ctx.fillRect(Math.round(lx - lw / 2), ly - 4, Math.round(lw), 8);
        ctx.fillStyle = spr.labelColor || '#ffe8b0';
        ctx.fillText(spr.label, lx, ly + 0.5);
      }
    } });
  }

  // entities
  const P = G.player;
  for (const n of npcsHere()) {
    if (n === G.mongo && n.map !== m.id) continue;
    drawables.push({ y: n.y, fn: () => drawCharacter(ctx, n, n.spr) });
  }
  drawables.push({ y: P.y + 0.1, fn: () => drawPlayer(ctx, dt) });
  if (m.monsters) for (const mo of m.monsters) drawables.push({ y: mo.y, fn: () => drawMonster(ctx, mo) });
  for (const d of G.drops) drawables.push({ y: d.y, fn: () => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(d.x - 3), Math.round(d.y - 1), 6, 2);
    const bob = d.z > 0 ? d.z : Math.sin(now * 4 + d.x) * 1;
    ctx.drawImage(drawIcon(ITEMS[d.id].icon), Math.round(d.x - 5), Math.round(d.y - 11 - bob), 10, 10);
  } });
  for (const b of G.bombs) drawables.push({ y: b.y + 4, fn: () => {
    const spr = bombSprite(b.mega);
    ctx.drawImage(spr.c, Math.round(b.x - 8), Math.round(b.y - 12));
    if (b.fuse < 0.8 && Math.floor(b.fuse * 12) % 2) { ctx.fillStyle = 'rgba(255,40,40,0.5)'; ctx.beginPath(); ctx.arc(b.x, b.y - 4, b.mega ? 7 : 5, 0, Math.PI * 2); ctx.fill(); }
  } });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.fn();

  // projectiles & particles
  for (const p of G.projectiles) {
    if (p.kind === 'missile') {
      ctx.fillStyle = 'rgba(200,120,255,0.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(p.x - 1), Math.round(p.y - 1), 2, 2);
    } else if (p.kind === 'bomblet') {
      ctx.fillStyle = '#26262e'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = Math.floor(p.spin) % 2 ? '#ffa020' : '#ffe060'; ctx.fillRect(Math.round(p.x), Math.round(p.y - 4), 1, 1);
    } else {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
      ctx.fillStyle = '#8a7a5a'; ctx.fillRect(-2, -2, 4, 4); ctx.fillStyle = '#c8b890'; ctx.fillRect(-1, -2, 2, 1);
      ctx.restore();
    }
  }
  for (const p of G.particles) {
    ctx.globalAlpha = clamp(p.life / (p.max || 0.5), 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size || 1, p.size || 1);
  }
  ctx.globalAlpha = 1;
  for (const f of G.flashes) {
    ctx.fillStyle = `rgba(255,220,120,${f.t * 2})`;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.2 - f.t), 0, Math.PI * 2); ctx.fill();
  }

  // fishing line & bobber
  if (G.fishing) {
    const f = G.fishing;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(P.x + DX[P.dir] * 6, P.y - 14); ctx.lineTo(f.x, f.y); ctx.stroke();
    const bob = f.bite ? Math.sin(now * 30) * 1.5 : Math.sin(now * 3) * 0.7;
    ctx.fillStyle = '#e03030'; ctx.fillRect(Math.round(f.x - 1), Math.round(f.y - 2 + bob), 3, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(f.x - 1), Math.round(f.y + bob), 3, 1);
    if (f.bite) { ctx.font = `700 10px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe040'; ctx.fillText('!', P.x, P.y - 22); }
  }

  // target highlight
  if (!G.modals.length && !G.transition) drawTargetHighlight(ctx);
}

function drawObject(ctx, o, m, dt) {
  const spr = objSprite(o, m);
  if (!spr) return;
  let ox = 0;
  if (o.shake > 0) { o.shake -= dt; ox = Math.sin(o.shake * 60) * 1.2; }
  ctx.drawImage(spr.c, Math.round(o.x * TILE + spr.ox + ox), o.y * TILE + spr.oy);
  if (o.sniffed) drawPawMark(ctx, o.x * TILE + 8, o.y * TILE - 4 + Math.sin(performance.now() / 180) * 1.5);
  if (o.type === 'fountain' && chance(0.5)) {
    G.particles.push({ x: o.x * TILE + 24 + rand(-2, 2), y: o.y * TILE + 4, vx: rand(-18, 18), vy: rand(-40, -20), life: 0.6, max: 0.6, color: choice(['#8cc0f4', '#ffffff']), size: 1, grav: 160 });
  }
}

// Mongo's mark over the rock he sniffed out: a little gold paw print.
function drawPawMark(ctx, x, y) {
  const dot = (dx, dy, r) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill(); };
  ctx.fillStyle = '#3a2410';
  dot(0, 1.5, 2.8); dot(-3, -2, 1.6); dot(0, -3.2, 1.6); dot(3, -2, 1.6);
  ctx.fillStyle = '#ffd23a';
  dot(0, 1.5, 2); dot(-3, -2, 1); dot(0, -3.2, 1); dot(3, -2, 1);
}

function drawShadow(ctx, x, y, rx) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x, y - 0.5, rx, rx * 0.4, 0, 0, Math.PI * 2); ctx.fill();
}

function spriteDir(e, ch) {
  if (e.dir === LEFT || e.dir === RIGHT) e.lastH = e.dir;
  if (!ch.sideOnly) return e.dir;
  return e.lastH === LEFT ? LEFT : RIGHT;
}

function drawCharacter(ctx, e, sprId, scale = 1) {
  const ch = getChar(sprId);
  const img = ch.frames[spriteDir(e, ch)][e.frame || 0];
  drawShadow(ctx, e.x, e.y, 5 * scale);
  ctx.drawImage(img, Math.round(e.x - 8 * scale), Math.round(e.y - 15 * scale), 16 * scale, 16 * scale);
}

function drawPlayer(ctx) {
  const P = G.player;
  if (P.hurtT > 0 && Math.floor(P.hurtT * 14) % 2) return;
  const swinging = P.swingT > 0;
  const prog = swinging ? 1 - P.swingT / P.swingDur : 0;
  const tool = swinging ? P.swingItem : null;
  let ox = 0, oy = 0;
  if (tool === 'kick') { ox = DX[P.dir] * 2 * Math.sin(prog * Math.PI); oy = DY[P.dir] * 2 * Math.sin(prog * Math.PI); }
  const behind = tool && tool !== 'kick' && tool !== 'plant' && P.dir === UP;
  if (behind) drawSwingTool(ctx, P, tool, prog);
  const saveX = P.x, saveY = P.y;
  P.x += ox; P.y += oy;
  const f = tool === 'kick' ? 1 : (swinging ? 0 : P.frame);
  const keep = P.frame; P.frame = f;
  drawCharacter(ctx, P, 'carl');
  P.frame = keep; P.x = saveX; P.y = saveY;
  if (tool && !behind && tool !== 'plant') drawSwingTool(ctx, P, tool, prog);
}

function drawSwingTool(ctx, P, tool, prog) {
  if (tool === 'kick') {
    const cx = P.x + DX[P.dir] * 12, cy = P.y - 6 + DY[P.dir] * 10;
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - prog)})`;
    ctx.lineWidth = 1.5;
    const a = Math.atan2(DY[P.dir], DX[P.dir]);
    ctx.beginPath(); ctx.arc(P.x, P.y - 6, 12, a - 0.9 + prog * 0.6, a + 0.9 * prog); ctx.stroke();
    void cx; void cy;
    return;
  }
  const id = tool === 'can' ? 'can' : tool;
  const d = ITEMS[id];
  if (!d) return;
  const lvl = d.tool && d.tool !== 'rod' ? G.player.tools[d.tool] : 0;
  const icon = drawIcon(d.icon, lvl);
  const dir = P.dir;
  let px = P.x, py = P.y - 8, a0, a1;
  if (dir === RIGHT) { px += 3; a0 = -2.2; a1 = 0.3; }
  else if (dir === LEFT) { px -= 3; a0 = 2.2 + Math.PI; a1 = -0.3 + Math.PI; }
  else if (dir === DOWN) { py += 2; a0 = -1.2; a1 = 1.2; }
  else { py -= 2; a0 = -1.9; a1 = -1.2; }
  if (tool === 'can') { a0 = dir === LEFT ? Math.PI - 0.3 : 0.3; a1 = dir === LEFT ? Math.PI - 0.9 : 0.9; }
  const ang = lerp(a0, a1, prog);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(ang + Math.PI / 4);
  if (dir === LEFT) ctx.scale(1, -1);
  ctx.drawImage(icon, -2, -11, 11, 11);
  ctx.restore();
}

function drawMonster(ctx, mo) {
  if (mo.hurtT > 0 && Math.floor(mo.hurtT * 30) % 2) ctx.globalAlpha = 0.5;
  if (mo.type === 'krakaren') { drawKrakaren(ctx, mo); ctx.globalAlpha = 1; return; }
  const sc = mo.d.scale || 1;
  let yo = 0;
  if (mo.type === 'shade') { yo = Math.sin(mo.bob * 3) * 2; ctx.globalAlpha *= 0.8; }
  if (mo.state === 'windup') { mo.x += rand(-0.6, 0.6); }
  const save = mo.y; mo.y += yo;
  drawCharacter(ctx, mo, mo.d.spr, sc);
  mo.y = save;
  ctx.globalAlpha = 1;
  if (!mo.d.boss && mo.hp < mo.maxHp) {
    ctx.fillStyle = '#1a0a0a'; ctx.fillRect(Math.round(mo.x - 7), Math.round(mo.y - 19), 14, 2);
    ctx.fillStyle = '#e03a3a'; ctx.fillRect(Math.round(mo.x - 7), Math.round(mo.y - 19), Math.round(14 * mo.hp / mo.maxHp), 2);
  }
  if (mo.bubble) { mo.bubble.t -= 1 / 60; if (mo.bubble.t <= 0) mo.bubble = null; }
}

function drawKrakaren(ctx, mo) {
  const t = mo.bob;
  const x = mo.x, y = mo.y;
  for (let k = 0; k < 6; k++) {
    const base = -Math.PI + (k / 5) * Math.PI;
    for (let s = 0; s < 7; s++) {
      const a = base + Math.sin(t * 2 + k + s * 0.4) * 0.35;
      const r = 18 + s * 5;
      const px = x + Math.cos(a) * r * 1.2, py = y - 10 + Math.sin(a) * r * 0.55 + 18;
      ctx.fillStyle = s % 2 ? '#c04a7a' : '#a83a68';
      ctx.fillRect(Math.round(px - 3 + s * 0.2), Math.round(py - 3 + s * 0.2), Math.max(2, 6 - s * 0.6), Math.max(2, 6 - s * 0.6));
    }
  }
  ctx.fillStyle = '#2a0a1a';
  ctx.beginPath(); ctx.ellipse(x, y - 14, 28, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c04a7a';
  ctx.beginPath(); ctx.ellipse(x, y - 14, 27, 19, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e07aa8';
  ctx.beginPath(); ctx.ellipse(x - 6, y - 22, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
  const blink = Math.sin(t * 1.3) > 0.97;
  for (const ex of [-10, 10]) {
    ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.ellipse(x + ex, y - 14, 6, blink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();
    if (!blink) { ctx.fillStyle = '#1a0010'; ctx.fillRect(Math.round(x + ex - 1 + Math.sign(G.player.x - x)), Math.round(y - 15), 3, 4); }
  }
  ctx.fillStyle = '#3a0a1a'; ctx.fillRect(Math.round(x - 8), Math.round(y - 4), 16, 3);
}

function drawTargetHighlight(ctx) {
  const it = selectedItem();
  if (!it) return;
  const d = ITEMS[it.id];
  if (!['tool', 'seed', 'placeable', 'bomb'].includes(d.cat) || d.tool === 'rod') return;
  const [tx, ty] = peekTarget(G.mouseMode);
  const lvl = d.cat === 'tool' && (d.tool === 'hoe' || d.tool === 'can') ? G.player.tools[d.tool] : 0;
  const tiles = toolTiles(lvl, tx, ty, peekDir(G.mouseMode, tx, ty));
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  for (const [x, y] of tiles) ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
}

// Non-mutating version of targetTile() for highlighting.
function peekTarget(useMouse) {
  const P = G.player;
  const saved = P.dir;
  const r = targetTile(useMouse);
  G.peekDirV = P.dir;
  P.dir = saved;
  return r;
}
function peekDir() { return G.peekDirV != null ? G.peekDirV : G.player.dir; }

// ---------------------------------------------------------------------------
// Screen-space overlays: lighting, weather, bubbles
// ---------------------------------------------------------------------------
function darknessLevel() {
  const m = G.map;
  if (m.dark) return 0.94;
  if (!m.outdoor) return 0;
  const t = G.time;
  let d = 0;
  if (t >= 1080) d = clamp((t - 1080) / 180, 0, 1) * 0.62;
  if (G.weather !== 'sun') d = Math.max(d, 0.12);
  return d;
}

function renderLighting(ctx, W, H) {
  const d = darknessLevel();
  const m = G.map, z = G.zoom, cam = G.cam;
  const t = G.time;
  if (m.outdoor && t >= 990 && t < 1140) {
    ctx.fillStyle = `rgba(255,120,40,${0.1 * Math.sin((t - 990) / 150 * Math.PI)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (d <= 0.01) return;
  if (!lightCanvas || lightCanvas.width !== W || lightCanvas.height !== H) lightCanvas = makeCanvas(W, H);
  const lx = lightCanvas.getContext('2d');
  lx.globalCompositeOperation = 'source-over';
  lx.clearRect(0, 0, W, H);
  lx.fillStyle = m.dark ? `rgba(4,2,8,${d})` : `rgba(8,12,38,${d})`;
  lx.fillRect(0, 0, W, H);
  lx.globalCompositeOperation = 'destination-out';
  const light = (wx, wy, r, a = 1) => {
    const sx = (wx - cam.x) * z, sy = (wy - cam.y) * z, sr = r * z;
    if (sx < -sr || sy < -sr || sx > W + sr || sy > H + sr) return;
    const g = lx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.6, `rgba(0,0,0,${a * 0.6})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lx.fillStyle = g;
    lx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  };
  const P = G.player;
  const flick = 1 + Math.sin(performance.now() / 90) * 0.02;
  light(P.x, P.y - 8, (m.dark ? 88 : 46) * flick);
  if (G.donut && m.dark) light(G.donut.x, G.donut.y - 6, 26, 0.6);
  const pm = partyMember();
  if (pm && m.dark) light(pm.x, pm.y - 8, 30, 0.6);
  if (mongoAlong() && m.dark) light(G.mongo.x, G.mongo.y - 6, 24, 0.6);
  const seen = new Set();
  for (const o of m.objs.values()) {
    if (seen.has(o)) continue; seen.add(o);
    const def = OBJ[o.type];
    if (def && def.light) light(o.x * TILE + 8, o.y * TILE - (o.type === 'lamp' ? 10 : 2), def.light);
    else if (o.type === 'forage' && o.item === 'glowshroom') light(o.x * TILE + 8, o.y * TILE + 8, 30, 0.8);
    else if (o.type === 'stairs') light(o.x * TILE + 8, o.y * TILE + 8, 26, 0.7);
    else if (o.type === 'ladder') light(o.x * TILE + 8, o.y * TILE + 4, 30, 0.8);
    else if (o.type === 'chest') light(o.x * TILE + 8, o.y * TILE + 8, 22, 0.6);
    else if (o.type === 'boulder' && o.sniffed) light(o.x * TILE + 8, o.y * TILE + 4, 26, 0.8);
    else if (o.type === 'boulder' && ['mana', 'ruby', 'diamond', 'gold'].includes(o.ore)) light(o.x * TILE + 8, o.y * TILE + 8, 14, 0.5);
  }
  if (!m.dark) for (const b of m.buildings) light((b.x + b.fw / 2) * TILE, (b.y + b.fh) * TILE - 12, 44, 0.8);
  for (const p of G.projectiles) if (p.kind === 'missile') light(p.x, p.y, 20, 0.8);
  for (const b of G.bombs) light(b.x, b.y - 8, 24, 0.7);
  for (const f of G.flashes) light(f.x, f.y, f.r * 1.5, 1);
  if (m.monsters) for (const mo of m.monsters) if (mo.type === 'shade') light(mo.x, mo.y - 8, 16, 0.35);
  lx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0);
  if (m.dark) {
    const th = DUNGEON_THEMES[m.theme];
    ctx.globalCompositeOperation = 'lighter';
    const sx = (P.x - cam.x) * z, sy = (P.y - 8 - cam.y) * z, sr = 80 * z;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    const [r, gg, b] = hexToRgb(th.light);
    g.addColorStop(0, `rgba(${r},${gg},${b},0.10)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    ctx.globalCompositeOperation = 'source-over';
  }
}

const weatherDrops = [];
function renderWeather(ctx, W, H, dt) {
  if (!G.map.outdoor || G.weather === 'sun') return;
  const snow = G.weather === 'snow';
  const target = snow ? 120 : 220;
  while (weatherDrops.length < target) weatherDrops.push({ x: rand(0, W), y: rand(-H, H), s: rand(0.6, 1.2) });
  ctx.fillStyle = snow ? 'rgba(255,255,255,0.85)' : 'rgba(170,200,255,0.55)';
  const z = G.zoom;
  for (const d of weatherDrops) {
    if (snow) { d.y += 40 * d.s * dt * z; d.x += Math.sin(d.y / 40) * 0.5; ctx.fillRect(d.x, d.y, z * d.s, z * d.s); }
    else { d.y += 420 * d.s * dt * z / 3; d.x -= 80 * dt * z / 3; ctx.fillRect(d.x, d.y, Math.max(1, z / 3), z * 3 * d.s); }
    if (d.y > H) { d.y = rand(-40, 0); d.x = rand(0, W + 100); }
    if (d.x < -10) d.x = W + 5;
  }
}

function renderBubbles(ctx) {
  const z = G.zoom, cam = G.cam, s = UI.s;
  const list = [...npcsHere()];
  if (G.map.monsters) list.push(...G.map.monsters.filter(m => m.bubble));
  for (const e of list) {
    if (!e.bubble) continue;
    const lift = e.d && e.d.boss ? (e.type === 'krakaren' ? 44 : 34) : 19;
    const sx = (e.x - cam.x) * z, sy = (e.y - lift - cam.y) * z;
    ctx.font = UI.font(5.5, true);
    const tw = Math.min(ctx.measureText(e.bubble.text).width, 110 * s);
    const lines = wrapText(ctx, e.bubble.text, 110 * s);
    const bw = tw + 8 * s, bh = lines.length * 7 * s + 4 * s;
    const bx = sx - bw / 2, by = sy - bh;
    ctx.globalAlpha = clamp(e.bubble.t * 3, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillRect(sx - s, by + bh, 2 * s, 2 * s);
    ctx.strokeStyle = '#3a2210'; ctx.lineWidth = Math.max(1, s / 2); ctx.strokeRect(bx, by, bw, bh);
    lines.forEach((l, i) => drawText(ctx, l, sx, by + 2 * s + i * 7 * s, { size: 5.5, bold: true, align: 'center', color: '#3a2210' }));
    ctx.globalAlpha = 1;
  }
  for (const f of G.floaters) {
    const sx = (f.x - cam.x) * z, sy = (f.y - cam.y) * z;
    ctx.globalAlpha = clamp(1.4 - f.t * 1.4, 0, 1);
    drawText(ctx, f.text, sx, sy, { size: f.big ? 8 : 6, bold: true, align: 'center', color: f.color, shadow: 'rgba(0,0,0,0.8)' });
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Title screen
// ---------------------------------------------------------------------------
const Title = {
  sel: 0,
  t: 0,
  howTo: false,
  items() { return hasSave() ? ['Continue', 'New Game', 'How to Play'] : ['New Game', 'How to Play']; },
  update(dt) {
    this.t += dt;
    const items = this.items();
    if (this.howTo) {
      if (Input.wasPressed(...KEY_CONFIRM, ...KEY_CANCEL) || Input.mouse.leftPressed) { this.howTo = false; Audio2.play('menu'); }
      return;
    }
    if (G.modals.length) { UI.top().update(dt); return; }
    if (Input.wasPressed('ArrowUp', 'KeyW')) { this.sel = (this.sel + items.length - 1) % items.length; Audio2.play('menu'); }
    if (Input.wasPressed('ArrowDown', 'KeyS')) { this.sel = (this.sel + 1) % items.length; Audio2.play('menu'); }
    this.sel = Math.min(this.sel, items.length - 1);
    let chosen = Input.wasPressed('Enter', 'Space', 'KeyF') ? this.sel : -1;
    (this.rects || []).forEach((r, i) => {
      if (pointInRect(Input.mouse.x, Input.mouse.y, r)) { if (Input.mouse.moved) this.sel = i; if (Input.mouse.leftPressed) chosen = i; }
    });
    if (chosen < 0) return;
    Audio2.unlock();
    Audio2.play('open');
    const it = items[chosen];
    if (it === 'Continue') continueGame();
    else if (it === 'New Game') {
      if (hasSave()) UI.ask('system', 'Start a new game? Your existing save will be overwritten when you next sleep.', [
        { label: 'Start fresh', fn: newGame }, { label: 'Cancel', cancel: true }]);
      else newGame();
    } else this.howTo = true;
  },
  draw(ctx, W, H) {
    const s = UI.s, t = this.t;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const z = Math.max(3, UI.s + 1);
    const ts = TILE * z;
    const off = (t * 12 * z) % ts;
    for (let y = 0; y * ts < H + ts; y++) for (let x = -1; x * ts < W + ts; x++) {
      ctx.drawImage(grassTile(0, (x * 7 + y * 3 + 99) % 4 === 0 ? 3 : Math.abs(x + y) % 3), x * ts + off, y * ts, ts, ts);
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(10,6,20,0.85)'); g.addColorStop(0.5, 'rgba(10,6,20,0.35)'); g.addColorStop(1, 'rgba(10,6,20,0.9)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // characters strolling
    const cz = z * 2;
    const baseY = H * 0.62;
    const walk = Math.floor(t * 6) % 4;
    const fr = [1, 0, 2, 0][walk];
    const cx = W / 2;
    ctx.drawImage(getChar('mongo').frames[RIGHT][fr], cx - 16 * cz * 1.4, baseY - 16 * cz, 16 * cz, 16 * cz);
    ctx.drawImage(getChar('carl').frames[RIGHT][fr], cx - 8 * cz, baseY - 16 * cz, 16 * cz, 16 * cz);
    ctx.drawImage(getChar('donut').frames[RIGHT][fr], cx + 16 * cz * 0.5, baseY - 16 * cz, 16 * cz, 16 * cz);
    // title
    const bob = Math.sin(t * 2) * 2 * s;
    drawText(ctx, 'CARLCRAFT', W / 2, H * 0.12 + bob, { size: 26, bold: true, align: 'center', color: '#ffb030', shadow: '#5a1a08' });
    drawText(ctx, 'DUNGEON FARMER WORLD', W / 2, H * 0.12 + 34 * s, { size: 11, sys: true, align: 'center', color: '#ffe8c0' });
    drawText(ctx, 'A cozy farming spin-off, as ordered by the Syndicate', W / 2, H * 0.12 + 47 * s, { size: 6, align: 'center', color: '#c8b8e8' });
    // menu
    const items = this.items();
    this.rects = [];
    items.forEach((it, i) => {
      const bw = 90 * s, bh = 15 * s;
      const r = { x: W / 2 - bw / 2, y: H * 0.68 + i * (bh + 4 * s), w: bw, h: bh };
      this.rects.push(r);
      drawPanel(ctx, r.x, r.y, r.w, r.h, i === this.sel ? 'achievement' : 'system');
      drawText(ctx, it, W / 2, r.y + r.h / 2, { size: 8, sys: true, align: 'center', base: 'middle', color: i === this.sel ? '#ffd23a' : '#ffe2a8' });
    });
    drawText(ctx, 'Fan-made tribute to Dungeon Crawler Carl by Matt Dinniman · Not affiliated · M toggles music', W / 2, H - 10 * s, { size: 5, align: 'center', color: 'rgba(220,210,240,0.6)' });
    if (this.howTo) {
      const w = Math.min(W - 20 * s, 260 * s), h = Math.min(H - 20 * s, 170 * s);
      const x = (W - w) / 2, y = (H - h) / 2;
      drawPanel(ctx, x, y, w, h, 'system');
      const lines = [
        'HOW TO PLAY',
        '',
        'You are Carl: crawler, homesteader, and proudly pants-free.',
        'Borant has given you a farm. Grow crops, ship them for gold,',
        'befriend the locals, and raid the Stairwell for loot and followers.',
        '',
        'WASD / Arrows ........ move',
        'Space / Left-click ... use tool, kick, plant, place, eat',
        'F / Right-click ...... talk, gift, harvest, ship, open',
        '1-0 / Mouse wheel .... pick hotbar slot',
        'E / Tab .............. inventory, crafting, social, trophies',
        '',
        'Water crops daily. Sleep to save. Mind the season collapse.',
      ];
      lines.forEach((l, i) => drawText(ctx, l, x + 10 * s, y + 8 * s + i * 9.5 * s, { size: 8, sys: true, color: i === 0 ? '#ffb030' : '#ffe2a8' }));
    }
  },
};
