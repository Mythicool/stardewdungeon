'use strict';
// ---------------------------------------------------------------------------
// UI core: panels, text, toasts, announcements, dialogue modal, HUD.
// ---------------------------------------------------------------------------

const UI = {
  s: 3, W: 0, H: 0,
  toasts: [],
  announcements: [],
  hoverText: null,

  resize(W, H) {
    this.W = W; this.H = H;
    this.s = clamp(Math.floor(Math.min(W / 380, H / 230)), 2, 5);
  },
  font(size, bold, sys) { return `${bold ? '700 ' : ''}${Math.round(size * this.s)}px ${sys ? FONT_SYS : FONT_UI}`; },

  push(modal) { G.modals.push(modal); Input.consume(); },
  pop(modal) {
    const i = G.modals.indexOf(modal);
    if (i >= 0) G.modals.splice(i, 1);
    Input.consume();
  },
  top() { return G.modals[G.modals.length - 1]; },

  toast(text, icon, color) {
    const ex = this.toasts.find(t => t.icon && t.icon === icon && t.baseText && text.startsWith('+') && t.t < 2.5);
    if (ex && icon) {
      const n = parseInt(text.slice(1), 10);
      if (!isNaN(n)) { ex.n += n; ex.text = `+${ex.n} ${ITEMS[icon].name}`; ex.t = 0; return; }
    }
    const n = parseInt(String(text).slice(1), 10);
    this.toasts.push({ text, icon, color: color || '#ffffff', t: 0, n: isNaN(n) ? 0 : n, baseText: String(text).startsWith('+') });
    if (this.toasts.length > 6) this.toasts.shift();
  },
  announce(title, text, style = 'level', sound) {
    this.announcements.push({ title, text, style, t: 0, dur: 6 + text.length / 40 });
    if (sound) Audio2.play(sound);
  },

  dialog(lines, opts = {}) {
    const m = new DialogModal(lines, opts);
    this.push(m);
    return m;
  },
  say(who, text, onDone) { return this.dialog([{ who, text }], { onDone }); },
  system(text, onDone) {
    Audio2.play('system');
    const parts = Array.isArray(text) ? text : [text];
    return this.dialog(parts.map(t => ({ who: 'system', text: t })), { onDone });
  },
  ask(who, text, choices, opts = {}) {
    return this.dialog([{ who, text, choices }], opts);
  },

  update(dt) {
    for (const t of this.toasts) t.t += dt;
    this.toasts = this.toasts.filter(t => t.t < 3.2);
    if (this.announcements.length) {
      const a = this.announcements[0];
      a.t += dt;
      if (a.t > a.dur) this.announcements.shift();
    }
  },
};

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
function drawPanel(ctx, x, y, w, h, style = 'wood') {
  const s = UI.s;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (style === 'wood') {
    ctx.fillStyle = '#3a200e'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#9a6030'; ctx.fillRect(x + s, y + s, w - 2 * s, h - 2 * s);
    ctx.fillStyle = '#c8894a'; ctx.fillRect(x + 2 * s, y + 2 * s, w - 4 * s, h - 4 * s);
    ctx.fillStyle = '#f6e2b4'; ctx.fillRect(x + 3 * s, y + 3 * s, w - 6 * s, h - 6 * s);
  } else if (style === 'system') {
    ctx.fillStyle = 'rgba(8,6,14,0.94)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffb030'; ctx.lineWidth = s; ctx.strokeRect(x + s / 2, y + s / 2, w - s, h - s);
    ctx.strokeStyle = 'rgba(255,176,48,0.35)'; ctx.lineWidth = Math.max(1, s / 2); ctx.strokeRect(x + 2.5 * s, y + 2.5 * s, w - 5 * s, h - 5 * s);
  } else if (style === 'achievement') {
    ctx.fillStyle = 'rgba(20,8,30,0.95)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = s; ctx.strokeRect(x + s / 2, y + s / 2, w - s, h - s);
    ctx.strokeStyle = '#ff4fa8'; ctx.lineWidth = Math.max(1, s / 2); ctx.strokeRect(x + 2.5 * s, y + 2.5 * s, w - 5 * s, h - 5 * s);
  } else {
    ctx.fillStyle = 'rgba(20,12,24,0.88)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#8a6ab0'; ctx.lineWidth = Math.max(1, s / 2); ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

function drawText(ctx, text, x, y, o = {}) {
  ctx.font = UI.font(o.size || 6.5, o.bold, o.sys);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'top';
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(text, x + Math.max(1, UI.s / 2), y + Math.max(1, UI.s / 2)); }
  ctx.fillStyle = o.color || '#3a2210';
  ctx.fillText(text, x, y);
}

function drawItemIcon(ctx, id, x, y, size, n) {
  const d = ITEMS[id];
  if (!d) return;
  const lvl = d.cat === 'tool' && d.tool !== 'rod' ? G.player.tools[d.tool] || 0 : 0;
  ctx.drawImage(drawIcon(d.icon, lvl), Math.round(x), Math.round(y), size, size);
  if (n > 1) {
    ctx.font = UI.font(5, true);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#000';
    ctx.fillText(String(n), x + size + UI.s * 0.6, y + size + UI.s * 1.3);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(n), x + size, y + size + UI.s * 0.8);
  }
}

function drawSlot(ctx, x, y, sz, selected, hover) {
  const s = UI.s;
  ctx.fillStyle = selected ? '#e03a3a' : '#8a5a2e';
  ctx.fillRect(x, y, sz, sz);
  ctx.fillStyle = hover ? '#fff4d8' : '#f0d8a4';
  ctx.fillRect(x + s * (selected ? 1 : 0.5), y + s * (selected ? 1 : 0.5), sz - s * (selected ? 2 : 1), sz - s * (selected ? 2 : 1));
  ctx.fillStyle = 'rgba(120,80,40,0.25)';
  ctx.fillRect(x + s, y + sz - s * 2, sz - 2 * s, s);
}

function itemTooltip(ctx, id, mx, my) {
  const d = ITEMS[id];
  if (!d) return;
  const s = UI.s;
  ctx.font = UI.font(5.5);
  const lines = wrapText(ctx, d.desc || '', 110 * s);
  const extra = [];
  if (d.energy != null && d.cat !== 'placeable' && (d.energy > 0 || d.hp)) extra.push(`+${d.energy} Energy${d.hp ? `  ${d.hp > 0 ? '+' : ''}${d.hp} Health` : ''}`);
  if (d.dmg) extra.push(`Kick damage: ${d.dmg}`);
  if (d.price) extra.push(`Sells for ${d.price}g`);
  if (d.cat === 'tool' && d.tool !== 'rod') extra.push(`Tier: ${['Basic', 'Copper', 'Iron', 'Gold'][G.player.tools[d.tool]]}`);
  const w = 120 * s, h = (10 + lines.length * 7 + extra.length * 7) * s + 6 * s;
  let x = mx + 8 * s, y = my + 8 * s;
  if (x + w > UI.W) x = mx - w - 4 * s;
  if (y + h > UI.H) y = UI.H - h - 2;
  drawPanel(ctx, x, y, w, h, 'dark');
  drawText(ctx, d.name + (d.cat === 'tool' && d.tool !== 'rod' && G.player.tools[d.tool] ? ` (${['', 'Copper', 'Iron', 'Gold'][G.player.tools[d.tool]]})` : ''), x + 5 * s, y + 4 * s, { size: 6.5, bold: true, color: '#ffe070' });
  lines.forEach((l, i) => drawText(ctx, l, x + 5 * s, y + (13 + i * 7) * s, { size: 5.5, color: '#e8e0f0' }));
  extra.forEach((l, i) => drawText(ctx, l, x + 5 * s, y + (13 + lines.length * 7 + i * 7) * s, { size: 5.5, color: '#8fe08f' }));
}

// ---------------------------------------------------------------------------
// Dialogue modal
// ---------------------------------------------------------------------------
const SPEAKER_NAMES = { system: 'SYSTEM AI', carl: 'Carl' };
function speakerName(who) {
  if (!who) return '';
  return SPEAKER_NAMES[who] || (NPC_DEFS[who] && NPC_DEFS[who].name) || (CHAR_DEFS[who] ? who : who);
}

class DialogModal {
  constructor(lines, opts) {
    this.lines = lines;
    this.opts = opts;
    this.i = 0;
    this.chars = 0;
    this.ci = 0;
    this.blipT = 0;
    this.choiceRects = [];
  }
  get cur() { return this.lines[this.i]; }
  update(dt) {
    const L = this.cur;
    const len = L.text.length;
    if (this.chars < len) {
      this.chars = Math.min(len, this.chars + dt * (L.who === 'system' ? 70 : 55));
      this.blipT -= dt;
      if (this.blipT <= 0) { Audio2.play('blip'); this.blipT = 0.07; }
    }
    const done = this.chars >= len;
    if (L.choices && done) {
      if (Input.wasPressed('ArrowUp', 'KeyW')) { this.ci = (this.ci + L.choices.length - 1) % L.choices.length; Audio2.play('menu'); }
      if (Input.wasPressed('ArrowDown', 'KeyS')) { this.ci = (this.ci + 1) % L.choices.length; Audio2.play('menu'); }
      if (Input.mouse.moved) this.choiceRects.forEach((r, i) => { if (pointInRect(Input.mouse.x, Input.mouse.y, r)) this.ci = i; });
      for (let k = 0; k < Math.min(9, L.choices.length); k++) if (Input.wasPressed('Digit' + (k + 1))) { this.ci = k; this.choose(); return; }
    }
    const clicked = Input.mouse.leftPressed;
    if (Input.wasPressed(...KEY_CONFIRM) || clicked) {
      if (!done) { this.chars = len; return; }
      if (L.choices) {
        if (clicked && !this.choiceRects.some(r => pointInRect(Input.mouse.x, Input.mouse.y, r))) return;
        this.choose();
      } else this.next();
    } else if (Input.wasPressed(...KEY_CANCEL)) {
      if (L.choices) { const c = L.choices.find(c => c.cancel) || L.choices[L.choices.length - 1]; this.close(); if (c.fn) c.fn(); }
      else if (!done) this.chars = len;
      else this.next();
    }
  }
  choose() {
    const c = this.cur.choices[this.ci];
    Audio2.play('menu');
    this.close();
    if (c && c.fn) c.fn();
  }
  next() {
    this.i++;
    this.chars = 0;
    if (this.i >= this.lines.length) { this.close(); if (this.opts.onDone) this.opts.onDone(); }
    else if (this.cur.who === 'system') Audio2.play('system');
  }
  close() { UI.pop(this); }
  draw(ctx) {
    const s = UI.s, W = UI.W, H = UI.H;
    const L = this.cur;
    const sys = L.who === 'system';
    const bw = Math.min(W - 16 * s, 300 * s), bh = 62 * s;
    const bx = Math.round((W - bw) / 2), by = H - bh - 8 * s;
    drawPanel(ctx, bx, by, bw, bh, sys ? 'system' : 'wood');
    const hasPortrait = L.who && L.who !== 'system' && CHAR_DEFS[NPC_DEFS[L.who] ? NPC_DEFS[L.who].spr : L.who];
    const pw = hasPortrait ? 56 * s : 0;
    if (hasPortrait) {
      const px = bx + bw - pw - 4 * s, py = by + 5 * s;
      ctx.fillStyle = '#e8cc90'; ctx.fillRect(px, py, pw - 2 * s, 44 * s);
      ctx.fillStyle = '#b89060'; ctx.fillRect(px, py + 40 * s, pw - 2 * s, 4 * s);
      const ch = getChar(NPC_DEFS[L.who] ? NPC_DEFS[L.who].spr : L.who);
      const img = ch.portrait;
      const sc = Math.floor(Math.min((pw - 8 * s) / img.width, (40 * s) / img.height));
      ctx.drawImage(img, Math.round(px + (pw - 2 * s - img.width * sc) / 2), Math.round(py + 40 * s - img.height * sc), img.width * sc, img.height * sc);
      drawText(ctx, speakerName(L.who), px + (pw - 2 * s) / 2, py + 46 * s, { size: 6, bold: true, align: 'center', color: '#5a2a10' });
    }
    const tx = bx + 8 * s, ty = by + 7 * s;
    const tw = bw - pw - 16 * s;
    if (sys) {
      drawText(ctx, '[ SYSTEM AI ]', tx, ty - 1 * s, { size: 7, sys: true, color: '#ffb030' });
    } else if (L.who && !hasPortrait) {
      drawText(ctx, speakerName(L.who), tx, ty - 1 * s, { size: 6, bold: true, color: '#8a3a10' });
    }
    const shown = L.text.slice(0, Math.floor(this.chars));
    ctx.font = UI.font(sys ? 8 : 6.5, false, sys);
    if (!this.wrapCache || this.wrapCache.i !== this.i || this.wrapCache.w !== tw) {
      this.wrapCache = { i: this.i, w: tw, lines: wrapText(ctx, L.text, tw) };
    }
    let remaining = shown.length;
    const lh = (sys ? 7.2 : 8.5) * s;
    const top = ty + ((sys || (L.who && !hasPortrait)) ? 9 * s : 0);
    this.wrapCache.lines.forEach((line, i) => {
      if (remaining <= 0) return;
      const part = line.slice(0, remaining);
      remaining -= line.length + 1;
      drawText(ctx, part, tx, top + i * lh, { size: sys ? 8 : 6.5, sys, color: sys ? '#ffe2a8' : '#3a2210' });
    });
    if (this.chars >= L.text.length && !L.choices && Math.floor(performance.now() / 400) % 2) {
      drawText(ctx, '▼', bx + bw - pw - 10 * s, by + bh - 12 * s, { size: 6, color: sys ? '#ffb030' : '#8a3a10' });
    }
    this.choiceRects = [];
    if (L.choices && this.chars >= L.text.length) {
      ctx.font = UI.font(6.5);
      const cw = Math.max(90 * s, ...L.choices.map(c => ctx.measureText(c.label).width + 24 * s));
      const ch = L.choices.length * 11 * s + 8 * s;
      const cx = bx + bw - cw, cy = by - ch - 3 * s;
      drawPanel(ctx, cx, cy, cw, ch, 'wood');
      L.choices.forEach((c, i) => {
        const r = { x: cx + 4 * s, y: cy + 4 * s + i * 11 * s, w: cw - 8 * s, h: 11 * s };
        this.choiceRects.push(r);
        if (i === this.ci) { ctx.fillStyle = 'rgba(224,58,58,0.18)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
        drawText(ctx, (i === this.ci ? '▶ ' : '   ') + c.label, r.x + 3 * s, r.y + 2 * s, { size: 6.5, color: i === this.ci ? '#a01818' : '#3a2210' });
      });
    }
  }
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function hotbarRect(i) {
  const s = UI.s, sz = 19 * s, gap = 1 * s;
  const total = 10 * sz + 9 * gap + 8 * s;
  const x0 = Math.round((UI.W - total) / 2) + 4 * s;
  return { x: x0 + i * (sz + gap), y: UI.H - sz - 6 * s, w: sz, h: sz };
}

function drawHUD(ctx) {
  const s = UI.s, W = UI.W, H = UI.H, P = G.player;
  // --- clock box
  const cw = 76 * s, ch = 52 * s, cx = W - cw - 4 * s, cy = 4 * s;
  drawPanel(ctx, cx, cy, cw, ch, 'wood');
  drawText(ctx, `${DAY_NAMES[(G.day - 1) % 7]}. ${SEASON_NAMES[G.season]} ${G.day}`, cx + cw / 2, cy + 5 * s, { size: 6.5, bold: true, align: 'center' });
  const late = G.time >= 1440;
  drawText(ctx, fmtTime(G.time), cx + cw / 2, cy + 14 * s, { size: 7, bold: true, align: 'center', color: late ? '#c02020' : '#3a2210' });
  const wx = cx + 7 * s, wy = cy + 15 * s;
  if (G.map.outdoor) drawWeatherIcon(ctx, wx, wy, 7 * s);
  ctx.fillStyle = '#e8b830';
  ctx.beginPath(); ctx.arc(cx + 10 * s, cy + 30 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff0a0'; ctx.fillRect(cx + 9 * s, cy + 28.5 * s, s, s);
  drawText(ctx, fmtNum(G.gold) + 'g', cx + cw - 7 * s, cy + 26 * s, { size: 7, bold: true, align: 'right' });
  drawText(ctx, '◉ ' + fmtNum(G.followers) + ' fans', cx + cw - 7 * s, cy + 37 * s, { size: 5.5, align: 'right', color: '#8a2a6a' });

  // --- energy/health bars
  const bw = 9 * s, bh = 56 * s;
  const ex = W - bw - 6 * s, ey = H - bh - 8 * s;
  drawBar(ctx, ex, ey, bw, bh, clamp(P.energy / P.maxEnergy, 0, 1), P.energy / P.maxEnergy > 0.3 ? '#5ad040' : P.energy > 0 ? '#e0c030' : '#e04030', 'E');
  if (G.map.id === 'dungeon' || P.hp < P.maxHp) drawBar(ctx, ex - bw - 4 * s, ey, bw, bh, clamp(P.hp / P.maxHp, 0, 1), '#e03a3a', 'H');
  const mr = { x: ex - 2 * s, y: ey, w: bw + 4 * s, h: bh };
  if (pointInRect(Input.mouse.x, Input.mouse.y, mr)) UI.hoverText = `Energy ${Math.max(0, Math.round(P.energy))}/${P.maxEnergy}`;
  const hr = { x: ex - bw - 4 * s, y: ey, w: bw, h: bh };
  if ((G.map.id === 'dungeon' || P.hp < P.maxHp) && pointInRect(Input.mouse.x, Input.mouse.y, hr)) UI.hoverText = `Health ${Math.max(0, Math.round(P.hp))}/${P.maxHp}`;

  // --- hotbar
  const r0 = hotbarRect(0), r9 = hotbarRect(9);
  drawPanel(ctx, r0.x - 4 * s, r0.y - 4 * s, r9.x + r9.w - r0.x + 8 * s, r0.h + 8 * s, 'wood');
  for (let i = 0; i < 10; i++) {
    const r = hotbarRect(i);
    const hov = pointInRect(Input.mouse.x, Input.mouse.y, r);
    drawSlot(ctx, r.x, r.y, r.w, i === P.sel, hov);
    const it = P.inv[i];
    if (it) {
      drawItemIcon(ctx, it.id, r.x + 1.5 * s, r.y + 1.5 * s, 16 * s, it.n);
      if (it.id === 'can') {
        ctx.fillStyle = '#2a4a8a'; ctx.fillRect(r.x + 2 * s, r.y + r.h - 3 * s, r.w - 4 * s, 1.5 * s);
        ctx.fillStyle = '#6ab0ff'; ctx.fillRect(r.x + 2 * s, r.y + r.h - 3 * s, (r.w - 4 * s) * P.water / canCapacity(), 1.5 * s);
      }
      if (hov) UI.hoverItem = it.id;
    }
    drawText(ctx, String((i + 1) % 10), r.x + 2 * s, r.y + 1 * s, { size: 4, color: 'rgba(90,50,20,0.7)' });
  }
  const sel = selectedItem();
  if (sel && !UI.hoverItem) {
    drawText(ctx, ITEMS[sel.id].name, W / 2, r0.y - 14 * s, { size: 6, bold: true, align: 'center', color: '#ffffff', shadow: 'rgba(0,0,0,0.7)' });
  }

  // --- location + quest tracker
  let ly = 4 * s;
  if (G.locT > 0) {
    ctx.globalAlpha = clamp(G.locT, 0, 1);
    drawText(ctx, G.map.name, 6 * s, ly, { size: 8, bold: true, color: '#ffffff', shadow: 'rgba(0,0,0,0.8)' });
    ctx.globalAlpha = 1;
    ly += 12 * s;
  }
  const mq = MAIN_QUESTS[G.mainQuest];
  const qw = 120 * s;
  if (mq || G.quest) {
    let lines = [];
    ctx.font = UI.font(5.5);
    if (mq) { lines.push({ t: '★ ' + mq.title, c: '#ffe070', b: true }); wrapText(ctx, mq.desc, qw - 10 * s).forEach(l => lines.push({ t: l, c: '#f0e8f8' })); }
    if (G.quest) {
      const q = G.quest;
      lines.push({ t: '✉ Request (' + q.expires + 'd left)', c: '#8fe0ff', b: true });
      const prog = q.type === 'deliver' ? `${Math.min(countItem(q.item), q.n)}/${q.n} ${ITEMS[q.item].name}` : `${q.progress}/${q.n} ${MONSTERS[q.mon].name}s`;
      lines.push({ t: prog + ((q.type === 'deliver' ? countItem(q.item) >= q.n : q.progress >= q.n) ? ' ✔ Turn in at board' : ''), c: '#f0e8f8' });
    }
    const qh = lines.length * 7 * s + 6 * s;
    drawPanel(ctx, 4 * s, ly, qw, qh, 'dark');
    lines.forEach((l, i) => drawText(ctx, l.t, 8 * s, ly + 3 * s + i * 7 * s, { size: 5.5, bold: l.b, color: l.c }));
    ly += qh + 3 * s;
  }

  // --- boss bar
  const boss = G.map.monsters && G.map.monsters.find(m => m.d.boss && !m.dead);
  if (boss) {
    const bbw = Math.min(W * 0.5, 200 * s), bbx = (W - bbw) / 2, bby = 8 * s;
    drawText(ctx, boss.d.name.toUpperCase(), W / 2, bby, { size: 7, bold: true, align: 'center', color: '#ffd0d0', shadow: '#000' });
    ctx.fillStyle = '#1a0a0a'; ctx.fillRect(bbx, bby + 10 * s, bbw, 5 * s);
    ctx.fillStyle = '#c02030'; ctx.fillRect(bbx + s, bby + 11 * s, (bbw - 2 * s) * clamp(boss.hp / boss.maxHp, 0, 1), 3 * s);
  }

  // --- toasts
  let ty = r0.y - 22 * s;
  for (let i = UI.toasts.length - 1; i >= 0; i--) {
    const t = UI.toasts[i];
    const a = t.t < 2.6 ? 1 : 1 - (t.t - 2.6) / 0.6;
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.font = UI.font(6);
    const tw = ctx.measureText(t.text).width + (t.icon ? 16 * s : 8 * s);
    drawPanel(ctx, 4 * s, ty, tw + 4 * s, 12 * s, 'dark');
    if (t.icon && ITEMS[t.icon]) drawItemIcon(ctx, t.icon, 6 * s, ty + 1.5 * s, 9 * s, 0);
    drawText(ctx, t.text, (t.icon ? 17 : 8) * s, ty + 2.5 * s, { size: 6, color: t.color });
    ty -= 14 * s;
    ctx.globalAlpha = 1;
  }

  // --- interaction hint
  const hint = G.modals.length ? null : getInteractHint();
  if (hint) drawText(ctx, hint, W / 2, r0.y - (sel ? 24 : 14) * s, { size: 6, align: 'center', color: '#ffe070', shadow: 'rgba(0,0,0,0.8)' });

  drawAnnouncement(ctx);
}

function drawBar(ctx, x, y, w, h, f, color, label) {
  const s = UI.s;
  drawPanel(ctx, x - s, y - s, w + 2 * s, h + 2 * s, 'wood');
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(x + 2 * s, y + 8 * s, w - 4 * s, h - 11 * s);
  const fh = (h - 11 * s) * f;
  ctx.fillStyle = color; ctx.fillRect(x + 2 * s, y + 8 * s + (h - 11 * s) - fh, w - 4 * s, fh);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 2 * s, y + 8 * s + (h - 11 * s) - fh, s, fh);
  drawText(ctx, label, x + w / 2, y + 1.5 * s, { size: 5.5, bold: true, align: 'center', color: '#5a2a10' });
}

function drawWeatherIcon(ctx, x, y, sz) {
  const w = G.weather;
  if (w === 'sun') {
    ctx.fillStyle = '#ffc830'; ctx.beginPath(); ctx.arc(x, y, sz * 0.35, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#a0a8b8'; ctx.beginPath(); ctx.arc(x - sz * 0.15, y, sz * 0.28, 0, Math.PI * 2); ctx.arc(x + sz * 0.15, y - sz * 0.05, sz * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = w === 'rain' ? '#4a90e0' : '#ffffff';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - sz * 0.3 + i * sz * 0.25, y + sz * 0.3, UI.s * 0.8, UI.s * 1.5);
  }
}

function drawAnnouncement(ctx) {
  const a = UI.announcements[0];
  if (!a) return;
  const s = UI.s, W = UI.W;
  const alpha = a.t < 0.3 ? a.t / 0.3 : a.t > a.dur - 0.5 ? (a.dur - a.t) / 0.5 : 1;
  ctx.globalAlpha = clamp(alpha, 0, 1);
  const bw = Math.min(W - 20 * s, 220 * s);
  ctx.font = UI.font(7.5, false, true);
  const lines = wrapText(ctx, a.text, bw - 16 * s);
  const bh = (22 + lines.length * 7) * s;
  const bx = (W - bw) / 2, by = 30 * s + (a.t < 0.3 ? -(1 - a.t / 0.3) * 10 * s : 0);
  drawPanel(ctx, bx, by, bw, bh, a.style === 'achievement' ? 'achievement' : 'system');
  drawText(ctx, a.title, W / 2, by + 5 * s, { size: 9, sys: true, align: 'center', color: a.style === 'achievement' ? '#ffd23a' : '#ffb030' });
  lines.forEach((l, i) => drawText(ctx, l, W / 2, by + (16 + i * 7) * s, { size: 7.5, sys: true, align: 'center', color: '#f4e8ff' }));
  ctx.globalAlpha = 1;
}
