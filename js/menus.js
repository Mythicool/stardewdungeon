'use strict';
// ---------------------------------------------------------------------------
// Modal screens: game menu (tabs), shop, day-end report, fishing minigame.
// ---------------------------------------------------------------------------

const MENU_TABS = ['Items', 'Crafting', 'Social', 'Skills', 'Trophies', 'Options'];
const SOCIAL_ORDER = ['donut', 'mongo', 'katia', 'mordecai', 'zev', 'pook'];

function menuRect() {
  const s = UI.s;
  const w = Math.min(UI.W - 16 * s, 300 * s), h = Math.min(UI.H - 30 * s, 196 * s);
  return { x: Math.round((UI.W - w) / 2), y: Math.round((UI.H - h) / 2 + 8 * s), w, h };
}

function button(ctx, r, label, o = {}) {
  const s = UI.s;
  const hov = pointInRect(Input.mouse.x, Input.mouse.y, r) && !o.disabled;
  ctx.fillStyle = o.disabled ? '#9a8a70' : hov ? '#e05030' : '#b85a2a';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = o.disabled ? '#c0b090' : hov ? '#ff8050' : '#e08040';
  ctx.fillRect(r.x + s * 0.5, r.y + s * 0.5, r.w - s, r.h - s * 2);
  drawText(ctx, label, r.x + r.w / 2, r.y + r.h / 2 - s * 0.5, { size: o.size || 6, bold: true, align: 'center', base: 'middle', color: '#fff8e8' });
  return hov && Input.mouse.leftPressed;
}

class GameMenu {
  constructor(tab = 0) { this.tab = tab; this.held = null; this.heldFrom = -1; this.scroll = 0; }
  close() {
    if (this.held) { const left = addItem(this.held.id, this.held.n); if (left) spawnDrop(this.held.id, left, G.player.x, G.player.y); this.held = null; }
    Audio2.play('close');
    UI.pop(this);
  }
  update() {
    if (Input.wasPressed(...KEY_CANCEL, ...KEY_MENU)) { this.close(); return; }
    if (Input.wasPressed('KeyQ')) { this.tab = (this.tab + MENU_TABS.length - 1) % MENU_TABS.length; this.scroll = 0; Audio2.play('menu'); }
    if (Input.wasPressed('KeyR')) { this.tab = (this.tab + 1) % MENU_TABS.length; this.scroll = 0; Audio2.play('menu'); }
    if (Input.mouse.wheel) this.scroll = Math.max(0, this.scroll + Input.mouse.wheel);
  }
  draw(ctx) {
    const s = UI.s, R = menuRect();
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, UI.W, UI.H);
    // tabs
    const tw = Math.min(46 * s, R.w / MENU_TABS.length - 2 * s);
    MENU_TABS.forEach((t, i) => {
      const r = { x: R.x + i * (tw + 2 * s), y: R.y - 13 * s, w: tw, h: 14 * s };
      drawPanel(ctx, r.x, r.y, r.w, r.h + (i === this.tab ? 3 * s : 0), 'wood');
      drawText(ctx, t, r.x + r.w / 2, r.y + 4 * s, { size: 5.5, bold: i === this.tab, align: 'center', color: i === this.tab ? '#a01818' : '#3a2210' });
      if (pointInRect(Input.mouse.x, Input.mouse.y, r) && Input.mouse.leftPressed) { this.tab = i; this.scroll = 0; Audio2.play('menu'); Input.mouse.leftPressed = false; }
    });
    drawPanel(ctx, R.x, R.y, R.w, R.h, 'wood');
    const inner = { x: R.x + 8 * s, y: R.y + 8 * s, w: R.w - 16 * s, h: R.h - 16 * s };
    this['draw' + MENU_TABS[this.tab]](ctx, inner);
    drawText(ctx, 'Q/R: switch tabs · Esc: close', R.x + R.w - 6 * s, R.y + R.h + 3 * s, { size: 5, align: 'right', color: '#ffffff', shadow: '#000' });
    if (this.held) drawItemIcon(ctx, this.held.id, Input.mouse.x - 8 * s, Input.mouse.y - 8 * s, 16 * s, this.held.n);
  }

  drawItems(ctx, r) {
    const s = UI.s, P = G.player;
    const sz = Math.min(19 * s, Math.floor((r.w - 30 * s) / 10));
    let hoverId = null;
    for (let i = 0; i < 40; i++) {
      const col = i % 10, row = Math.floor(i / 10);
      const x = r.x + col * sz, y = r.y + row * (sz + (row === 0 ? 3 * s : 0)) + (row > 0 ? 3 * s : 0);
      const locked = i >= P.invSize;
      const sr = { x, y, w: sz - s, h: sz - s };
      const hov = pointInRect(Input.mouse.x, Input.mouse.y, sr);
      if (locked) { ctx.fillStyle = 'rgba(90,60,30,0.25)'; ctx.fillRect(x, y, sz - s, sz - s); continue; }
      drawSlot(ctx, x, y, sz - s, i === P.sel, hov);
      const it = P.inv[i];
      if (it) drawItemIcon(ctx, it.id, x + s, y + s, sz - 3 * s, it.n);
      if (hov) {
        if (it && !this.held) hoverId = it.id;
        if (Input.mouse.leftPressed) {
          Audio2.play('menu');
          if (this.held) {
            const cur = P.inv[i];
            if (cur && cur.id === this.held.id && itemStackable(cur.id)) { cur.n += this.held.n; this.held = null; }
            else { P.inv[i] = this.held; this.held = cur; }
          } else if (it) {
            if (Input.isDown('ShiftLeft', 'ShiftRight') && it.n > 1) { const half = Math.ceil(it.n / 2); it.n -= half; this.held = { id: it.id, n: half }; }
            else { this.held = it; P.inv[i] = null; }
          }
        }
        if (Input.mouse.rightPressed && !this.held && it && P.sel !== i) { P.sel = i < 10 ? i : P.sel; }
      }
    }
    // trash
    const tr = { x: r.x + 10 * sz + 4 * s, y: r.y + 3 * sz + 6 * s, w: sz - s, h: sz - s };
    ctx.fillStyle = '#6a4a3a'; ctx.fillRect(tr.x, tr.y, tr.w, tr.h);
    drawText(ctx, '🗑', tr.x + tr.w / 2, tr.y + tr.h / 2, { size: 8, align: 'center', base: 'middle', color: '#fff' });
    if (pointInRect(Input.mouse.x, Input.mouse.y, tr)) {
      UI.hoverText = this.held ? 'Trash ' + ITEMS[this.held.id].name : 'Trash can';
      if (Input.mouse.leftPressed && this.held) {
        const d = ITEMS[this.held.id];
        if (d.cat === 'tool' || this.held.id === 'foot') { Audio2.play('error'); UI.toast("You can't trash that. Carl needs his foot.", null, '#ff8080'); }
        else { UI.toast(`Trashed ${this.held.n} ${d.name}`, null, '#ffb0b0'); this.held = null; Audio2.play('break'); }
      }
    }
    // stats
    const sy = r.y + 4 * (sz) + 12 * s;
    ctx.drawImage(getChar('carl').frames[DOWN][0], r.x, sy, 32 * s, 32 * s);
    drawText(ctx, 'Carl', r.x + 36 * s, sy + 2 * s, { size: 7, bold: true });
    drawText(ctx, 'Crawler · Homesteader · Pants: none', r.x + 36 * s, sy + 12 * s, { size: 5.5, color: '#6a4a2a' });
    drawText(ctx, `Gold: ${fmtNum(G.gold)}g   Earned: ${fmtNum(G.stats.earned)}g   Fans: ${fmtNum(G.followers)}`, r.x + 36 * s, sy + 21 * s, { size: 5.5 });
    drawText(ctx, `Kills: ${G.stats.totalKills}   Deepest level: ${G.stats.deepest}   Crops harvested: ${G.stats.harvested}`, r.x + 36 * s, sy + 29 * s, { size: 5.5 });
    drawText(ctx, 'Click to move items · Shift+click splits a stack', r.x, r.y + r.h - 6 * s, { size: 5, color: '#8a6a4a' });
    if (hoverId) itemTooltip(ctx, hoverId, Input.mouse.x, Input.mouse.y);
  }

  drawCrafting(ctx, r) {
    const s = UI.s;
    const rowH = 20 * s;
    const perPage = Math.floor((r.h - 4 * s) / rowH);
    this.scroll = Math.min(this.scroll, Math.max(0, RECIPES.length - perPage));
    let hoverId = null;
    RECIPES.slice(this.scroll, this.scroll + perPage).forEach((rc, i) => {
      const y = r.y + i * rowH;
      const known = G.recipes.includes(rc.id);
      const can = known && hasIngredients(rc.ing);
      const rr = { x: r.x, y, w: r.w, h: rowH - 2 * s };
      const hov = pointInRect(Input.mouse.x, Input.mouse.y, rr);
      ctx.fillStyle = hov && can ? 'rgba(224,90,48,0.2)' : 'rgba(120,80,40,0.12)';
      ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
      if (!known) {
        ctx.globalAlpha = 0.35; drawItemIcon(ctx, rc.out, r.x + 2 * s, y + 1 * s, 16 * s, 0); ctx.globalAlpha = 1;
        const how = rc.unlock[0] === 'buy' ? 'Recipe sold in town' : `Unlocks at ${SKILL_NAMES[rc.unlock[0]]} level ${rc.unlock[1]}`;
        drawText(ctx, '??? — ' + how, r.x + 22 * s, y + 5 * s, { size: 6, color: '#8a6a4a' });
        return;
      }
      drawItemIcon(ctx, rc.out, r.x + 2 * s, y + 1 * s, 16 * s, rc.n);
      drawText(ctx, ITEMS[rc.out].name, r.x + 22 * s, y + 1.5 * s, { size: 6, bold: true, color: can ? '#3a2210' : '#8a6a4a' });
      let ix = r.x + 22 * s;
      for (const [id, n] of Object.entries(rc.ing)) {
        drawItemIcon(ctx, id, ix, y + 9 * s, 8 * s, 0);
        const have = countItem(id);
        drawText(ctx, `${have}/${n}`, ix + 9 * s, y + 10 * s, { size: 5, color: have >= n ? '#2a7a2a' : '#c02020' });
        if (pointInRect(Input.mouse.x, Input.mouse.y, { x: ix, y: y + 9 * s, w: 8 * s, h: 8 * s })) hoverId = id;
        ix += 30 * s;
      }
      const br = { x: r.x + r.w - 42 * s, y: y + 3 * s, w: 40 * s, h: 12 * s };
      if (button(ctx, br, 'Craft', { disabled: !can })) {
        for (const [id, n] of Object.entries(rc.ing)) removeItem(id, n);
        giveItem(rc.out, rc.n);
        Audio2.play('pickup');
        unlock('first_craft');
      }
      if (pointInRect(Input.mouse.x, Input.mouse.y, { x: r.x, y, w: 18 * s, h: 18 * s })) hoverId = rc.out;
    });
    if (hoverId) itemTooltip(ctx, hoverId, Input.mouse.x, Input.mouse.y);
  }

  drawSocial(ctx, r) {
    const s = UI.s;
    const rowH = Math.min(26 * s, Math.floor(r.h / SOCIAL_ORDER.length));
    SOCIAL_ORDER.forEach((id, i) => {
      const y = r.y + i * rowH;
      const f = friendOf(id);
      ctx.fillStyle = 'rgba(120,80,40,0.12)'; ctx.fillRect(r.x, y, r.w, rowH - 2 * s);
      const met = id === 'donut' || id === 'mongo' || G.met[id];
      const img = getChar(NPC_DEFS[id].spr).portrait;
      const ps = rowH - 4 * s;
      if (!met) ctx.globalAlpha = 0.25;
      ctx.drawImage(img, r.x + 2 * s, y + s, ps * img.width / img.height, ps);
      ctx.globalAlpha = 1;
      drawText(ctx, met ? NPC_DEFS[id].name : '???', r.x + 26 * s, y + 3 * s, { size: 6.5, bold: true });
      const h = Math.floor(f.pts / 250);
      for (let k = 0; k < 10; k++) drawText(ctx, '♥', r.x + 26 * s + k * 8 * s, y + 11 * s, { size: 7, color: k < h ? '#e0305a' : '#c8b090' });
      const evs = HEART_EVENTS[id] ? `  ✦ ${heartEventCount(id)}/${HEART_EVENTS[id].length}` : '';
      drawText(ctx, (f.talked ? '✔ talked  ' : '· talk  ') + (f.gifted ? '✔ gift' : '· gift') + evs, r.x + r.w - 4 * s, y + 5 * s, { size: 5.5, align: 'right', color: '#6a4a2a' });
      const loves = NPC_DEFS[id].love.filter(it => G.knownLoves[id + ':' + it]);
      if (loves.length) {
        drawText(ctx, 'Loves:', r.x + r.w - 110 * s, y + 13 * s, { size: 5, color: '#a03050' });
        loves.slice(0, 8).forEach((it, k) => drawItemIcon(ctx, it, r.x + r.w - 88 * s + k * 10 * s, y + 12 * s, 9 * s, 0));
      }
    });
  }

  drawSkills(ctx, r) {
    const s = UI.s, P = G.player;
    const keys = Object.keys(SKILL_NAMES);
    keys.forEach((k, i) => {
      const y = r.y + i * 20 * s;
      const sk = P.skills[k];
      drawText(ctx, SKILL_NAMES[k], r.x, y + 3 * s, { size: 7, bold: true });
      for (let j = 0; j < 10; j++) {
        ctx.fillStyle = j < sk.lv ? '#e0a020' : '#c8b090';
        ctx.fillRect(r.x + 50 * s + j * 11 * s, y + 3 * s, 9 * s, 8 * s);
      }
      const next = sk.lv < 10 ? `${sk.xp}/${SKILL_XP[sk.lv]} xp` : 'MAX';
      drawText(ctx, `Lv ${sk.lv} · ${next}`, r.x + 50 * s + 112 * s, y + 3 * s, { size: 5.5, color: '#6a4a2a' });
    });
    const y = r.y + keys.length * 20 * s + 4 * s;
    const wpn = P.inv.find(it => it && ITEMS[it.id].cat === 'weapon');
    drawText(ctx, `Max Health ${P.maxHp} · Max Energy ${P.maxEnergy} · Best kick: ${bestWeapon().name}`, r.x, y, { size: 6 });
    drawText(ctx, `Tools: Hoe ${tierName('hoe')} · Can ${tierName('can')} · Axe ${tierName('axe')} · Pickaxe ${tierName('pick')}`, r.x, y + 10 * s, { size: 6 });
    drawText(ctx, `Backpack: ${P.invSize} slots · Stairwell Express: ${G.expressFloors.join(', ')}`, r.x, y + 20 * s, { size: 6 });
    void wpn;
  }

  drawTrophies(ctx, r) {
    const s = UI.s;
    const ids = Object.keys(ACHIEVEMENTS);
    const got = ids.filter(id => G.achievements[id]).length;
    drawText(ctx, `Achievements: ${got}/${ids.length}`, r.x, r.y, { size: 7, bold: true });
    const rowH = 15 * s;
    const perPage = Math.floor((r.h - 12 * s) / rowH);
    this.scroll = Math.min(this.scroll, Math.max(0, ids.length - perPage));
    ids.slice(this.scroll, this.scroll + perPage).forEach((id, i) => {
      const a = ACHIEVEMENTS[id], y = r.y + 11 * s + i * rowH;
      const has = G.achievements[id];
      ctx.fillStyle = has ? 'rgba(224,170,40,0.18)' : 'rgba(120,80,40,0.08)';
      ctx.fillRect(r.x, y, r.w, rowH - s);
      drawText(ctx, (has ? '★ ' : '☆ ') + (has ? a.name : '???'), r.x + 3 * s, y + 1 * s, { size: 6, bold: true, color: has ? '#8a5a00' : '#9a8a70' });
      ctx.font = UI.font(5);
      const desc = has ? a.desc : 'Keep playing to unlock.';
      const line = wrapText(ctx, desc, r.w - 8 * s)[0];
      drawText(ctx, line + (wrapText(ctx, desc, r.w - 8 * s).length > 1 ? '…' : ''), r.x + 3 * s, y + 8 * s, { size: 5, color: has ? '#5a3a1a' : '#b0a080' });
    });
    if (ids.length > perPage) drawText(ctx, 'Scroll for more', r.x + r.w, r.y, { size: 5, align: 'right', color: '#8a6a4a' });
  }

  drawOptions(ctx, r) {
    const s = UI.s;
    const bw = 110 * s, bh = 16 * s;
    if (button(ctx, { x: r.x, y: r.y, w: bw, h: bh }, 'Music: ' + (Audio2.musicOn ? 'ON' : 'OFF'))) { Audio2.setMusic(!Audio2.musicOn); saveSettings(); }
    if (button(ctx, { x: r.x, y: r.y + 20 * s, w: bw, h: bh }, 'Sound FX: ' + (Audio2.sfxOn ? 'ON' : 'OFF'))) { Audio2.sfxOn = !Audio2.sfxOn; saveSettings(); }
    if (button(ctx, { x: r.x, y: r.y + 40 * s, w: bw, h: bh }, 'Quit to Title')) {
      UI.ask('system', 'Quit to the title screen? Progress is saved each night when you sleep. Anything since this morning will be lost.', [
        { label: 'Quit to title', fn: () => { G.modals = []; toTitle(); } },
        { label: 'Keep playing', cancel: true },
      ]);
    }
    const help = [
      'CONTROLS',
      'WASD / Arrows — move',
      'Space / Left-click — use selected tool, kick, place, eat',
      'F / Right-click / Enter — interact: talk, gift, harvest, ship, open',
      '1-9, 0 / Mouse wheel — choose hotbar slot',
      'E / I / Tab — this menu · Esc — close',
      'M — toggle music',
      '',
      'TIPS',
      'Sleep in your bed to save and end the day.',
      'Crops need water every day (or rain). Out-of-season crops wither.',
      'The Stairwell is north in the Plaza. Safe rooms every 5 levels.',
      'Donut casts Magic Missile at anything that looks at you funny.',
    ];
    help.forEach((l, i) => drawText(ctx, l, r.x + bw + 12 * s, r.y + i * 7.5 * s, { size: 5.5, bold: i === 0 || i === 8, color: '#3a2210' }));
  }
}

function tierName(t) { return ['Basic', 'Copper', 'Iron', 'Gold'][G.player.tools[t]]; }
function bestWeapon() {
  let best = ITEMS.foot;
  for (let i = 0; i < G.player.invSize; i++) {
    const it = G.player.inv[i];
    if (it && ITEMS[it.id].cat === 'weapon' && ITEMS[it.id].dmg > best.dmg) best = ITEMS[it.id];
  }
  return best;
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------
class ShopModal {
  constructor(id) { this.id = id; this.shop = SHOPS[id]; this.scroll = 0; this.flash = 0; }
  close() { Audio2.play('close'); UI.pop(this); }
  entryInfo(e) {
    if (e.item) return { icon: e.item, name: ITEMS[e.item].name, price: e.price, ok: true };
    if (e.recipe) {
      const known = G.recipes.includes(e.recipe);
      const rc = RECIPES.find(r => r.id === e.recipe);
      return { icon: rc.out, name: 'Recipe: ' + ITEMS[rc.out].name, price: e.price, ok: !known, note: known ? 'Known' : '' };
    }
    if (e.upgrade) {
      const lv = G.player.tools[e.upgrade];
      const up = TOOL_UPGRADES[lv + 1];
      const tn = ITEMS[e.upgrade].name;
      if (!up) return { icon: e.upgrade, name: tn + ' — fully upgraded', price: 0, ok: false, note: 'MAX' };
      return { icon: e.upgrade, name: `Enchant ${tn} → ${up.name}`, price: up.gold, ok: true, extra: [up.ore, up.n] };
    }
    if (e.backpack) {
      const P = G.player;
      if (P.invSize >= 40) return { icon: 'box_bronze', name: 'Backpack — maxed out', price: 0, ok: false, note: 'MAX' };
      return { icon: 'box_bronze', name: `Bigger Backpack (${P.invSize + 10} slots)`, price: P.invSize === 20 ? 2000 : 10000, ok: true };
    }
    return null;
  }
  buy(e, n) {
    const info = this.entryInfo(e);
    if (!info.ok) { Audio2.play('error'); return; }
    if (info.extra && countItem(info.extra[0]) < info.extra[1]) { Audio2.play('error'); UI.toast(`Need ${info.extra[1]} ${ITEMS[info.extra[0]].name}`, null, '#ff8080'); return; }
    const total = info.price * n;
    if (G.gold < total) { Audio2.play('error'); UI.toast('Not enough gold!', null, '#ff8080'); return; }
    if (e.item) {
      if (!itemStackable(e.item) && countItem(e.item) > 0) { Audio2.play('error'); UI.toast('You already own one.', null, '#ff8080'); return; }
      const left = addItem(e.item, n);
      if (left === n) { Audio2.play('error'); UI.toast('Inventory full!', null, '#ff8080'); return; }
      G.gold -= info.price * (n - left);
    } else if (e.recipe) {
      G.gold -= total; G.recipes.push(e.recipe); UI.toast('Learned a new recipe!', null, '#ffe070');
    } else if (e.upgrade) {
      G.gold -= total; removeItem(info.extra[0], info.extra[1]);
      G.player.tools[e.upgrade]++;
      if (e.upgrade === 'can') G.player.water = canCapacity();
      unlock('upgrade');
      UI.toast(`${ITEMS[e.upgrade].name} enchanted!`, e.upgrade, '#ffe070');
    } else if (e.backpack) {
      G.gold -= total; G.player.invSize += 10; UI.toast('Backpack upgraded!', null, '#ffe070');
    }
    Audio2.play('coin');
  }
  sell(i, all) {
    const it = G.player.inv[i];
    if (!it) return;
    const d = ITEMS[it.id];
    if (!d.price || d.cat === 'tool' || it.id === 'foot') { Audio2.play('error'); return; }
    const n = all ? it.n : 1;
    G.gold += d.price * n;
    G.stats.earned += d.price * n;
    removeFromSlot(i, n);
    Audio2.play('coin');
    checkGoldAchievements();
  }
  update() {
    if (Input.wasPressed(...KEY_CANCEL, ...KEY_MENU)) { this.close(); return; }
    if (Input.mouse.wheel) this.scroll = Math.max(0, this.scroll + Input.mouse.wheel);
  }
  draw(ctx) {
    const s = UI.s, R = menuRect();
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, UI.W, UI.H);
    drawPanel(ctx, R.x, R.y, R.w, R.h, 'wood');
    drawText(ctx, this.shop.name, R.x + 10 * s, R.y + 7 * s, { size: 8, bold: true, color: '#8a2a10' });
    drawText(ctx, `Gold: ${fmtNum(G.gold)}g`, R.x + R.w - 10 * s, R.y + 8 * s, { size: 7, bold: true, align: 'right' });
    const stock = this.shop.stock();
    const lw = Math.floor(R.w * 0.56);
    const rowH = 15 * s;
    const top = R.y + 22 * s;
    const perPage = Math.floor((R.h - 30 * s) / rowH);
    this.scroll = Math.min(this.scroll, Math.max(0, stock.length - perPage));
    let hoverId = null;
    stock.slice(this.scroll, this.scroll + perPage).forEach((e, i) => {
      const info = this.entryInfo(e);
      const y = top + i * rowH;
      const rr = { x: R.x + 8 * s, y, w: lw - 8 * s, h: rowH - s };
      const hov = pointInRect(Input.mouse.x, Input.mouse.y, rr);
      ctx.fillStyle = hov && info.ok ? 'rgba(224,90,48,0.22)' : 'rgba(120,80,40,0.12)';
      ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
      drawItemIcon(ctx, info.icon, rr.x + 2 * s, y + 0.5 * s, 13 * s, 0);
      drawText(ctx, info.name, rr.x + 18 * s, y + 3.5 * s, { size: 5.8, color: info.ok ? '#3a2210' : '#9a8a70' });
      const priceTxt = info.note ? info.note : info.price + 'g' + (info.extra ? ` + ${info.extra[1]} ore` : '');
      drawText(ctx, priceTxt, rr.x + rr.w - 4 * s, y + 3.5 * s, { size: 5.8, bold: true, align: 'right', color: G.gold >= info.price ? '#3a2210' : '#c02020' });
      if (hov) {
        if (e.item) hoverId = e.item;
        if (Input.mouse.leftPressed) this.buy(e, e.item && itemStackable(e.item) && Input.isDown('ShiftLeft', 'ShiftRight') ? 5 : 1);
      }
    });
    if (stock.length > perPage) drawText(ctx, 'Scroll for more ▼', R.x + lw, R.y + R.h - 9 * s, { size: 5, align: 'right', color: '#8a6a4a' });
    // inventory to sell
    const ix = R.x + lw + 6 * s, iw = R.w - lw - 14 * s;
    drawText(ctx, 'Sell (click · shift = stack)', ix, top - 2 * s, { size: 5.5, bold: true });
    const cols = 5, sz = Math.floor(iw / cols);
    for (let i = 0; i < G.player.invSize; i++) {
      const x = ix + (i % cols) * sz, y = top + 8 * s + Math.floor(i / cols) * sz;
      const r = { x, y, w: sz - s, h: sz - s };
      const hov = pointInRect(Input.mouse.x, Input.mouse.y, r);
      drawSlot(ctx, x, y, sz - s, false, hov);
      const it = G.player.inv[i];
      if (it) {
        drawItemIcon(ctx, it.id, x + s, y + s, sz - 3 * s, it.n);
        if (hov) {
          hoverId = it.id;
          if (Input.mouse.leftPressed) this.sell(i, Input.isDown('ShiftLeft', 'ShiftRight'));
        }
      }
    }
    drawText(ctx, 'Shift+click buys 5 · Esc to leave', R.x + 10 * s, R.y + R.h - 9 * s, { size: 5, color: '#8a6a4a' });
    if (hoverId) itemTooltip(ctx, hoverId, Input.mouse.x, Input.mouse.y);
  }
}

// ---------------------------------------------------------------------------
// End of day report
// ---------------------------------------------------------------------------
class DayEndModal {
  constructor(report, onDone) { this.r = report; this.onDone = onDone; this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.t > 0.6 && (Input.wasPressed(...KEY_CONFIRM, ...KEY_CANCEL) || Input.mouse.leftPressed)) {
      UI.pop(this);
      this.onDone();
    }
  }
  draw(ctx) {
    const s = UI.s, W = UI.W, H = UI.H;
    ctx.fillStyle = '#0b0710'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(W - 20 * s, 240 * s), h = Math.min(H - 20 * s, 190 * s);
    const x = (W - w) / 2, y = (H - h) / 2;
    drawPanel(ctx, x, y, w, h, 'system');
    drawText(ctx, this.r.title, W / 2, y + 7 * s, { size: 11, sys: true, align: 'center', color: '#ffb030' });
    let yy = y + 22 * s;
    const items = this.r.items;
    if (!items.length) drawText(ctx, 'Nothing shipped today. The Syndicate is "disappointed but not surprised."', W / 2, yy, { size: 7.5, sys: true, align: 'center', color: '#e0d0ff' });
    const maxRows = Math.floor((h - 70 * s) / (10 * s));
    items.slice(0, maxRows).forEach((it, i) => {
      drawItemIcon(ctx, it.id, x + 14 * s, yy + i * 10 * s, 9 * s, 0);
      drawText(ctx, `${ITEMS[it.id].name} x${it.n}`, x + 26 * s, yy + i * 10 * s, { size: 7.5, sys: true, color: '#f4e8ff' });
      drawText(ctx, `${it.n * ITEMS[it.id].price}g`, x + w - 14 * s, yy + i * 10 * s, { size: 7.5, sys: true, align: 'right', color: '#ffe070' });
    });
    if (items.length > maxRows) drawText(ctx, `...and ${items.length - maxRows} more`, x + 26 * s, yy + maxRows * 10 * s, { size: 7, sys: true, color: '#a090c0' });
    const by = y + h - 42 * s;
    drawText(ctx, `Total: ${fmtNum(this.r.total)}g`, W / 2, by, { size: 10, sys: true, align: 'center', color: '#ffe070' });
    ctx.font = UI.font(7, false, true);
    wrapText(ctx, this.r.quip, w - 20 * s).slice(0, 2).forEach((l, i) => drawText(ctx, l, W / 2, by + (11 + i * 7) * s, { size: 7, sys: true, align: 'center', color: '#c0b0e0' }));
    if (this.t > 0.6 && Math.floor(this.t * 2) % 2) drawText(ctx, 'Press Space to continue', W / 2, y + h - 10 * s, { size: 6.5, sys: true, align: 'center', color: '#ffb030' });
  }
}

// ---------------------------------------------------------------------------
// Fishing minigame
// ---------------------------------------------------------------------------
class FishingModal {
  constructor(bx, by, table) {
    this.bx = bx; this.by = by;
    this.state = 'wait';
    this.t = rand(1.5, 5);
    this.fish = pickFish(table);
    const lv = G.player.skills.fishing.lv;
    this.zone = clamp(0.34 - this.fish.diff * 0.24 + lv * 0.015, 0.08, 0.4);
    this.speed = 0.7 + this.fish.diff * 1.6;
    this.need = this.fish.diff > 0.55 ? 2 : 1;
    this.hits = 0; this.misses = 0;
    this.pos = 0; this.phase = 0; this.zoneStart = rand(0.1, 0.9 - this.zone);
    this.msg = '';
    G.fishing = { x: bx, y: by, bite: false };
  }
  end(msg) { this.state = 'result'; this.msg = msg; this.t = 1.2; G.fishing.bite = false; }
  update(dt) {
    const press = Input.wasPressed('Space', 'Enter', 'KeyF') || Input.mouse.leftPressed;
    if (Input.wasPressed('Escape')) { this.finish(); return; }
    if (this.state === 'wait') {
      this.t -= dt;
      if (press) { this.end('Too early! The fish swam off.'); Audio2.play('splash'); }
      else if (this.t <= 0) { this.state = 'bite'; this.t = 0.95; G.fishing.bite = true; Audio2.play('bite'); }
    } else if (this.state === 'bite') {
      this.t -= dt;
      if (press) { this.state = 'reel'; G.fishing.bite = false; }
      else if (this.t <= 0) { this.end('It got away...'); }
    } else if (this.state === 'reel') {
      this.phase += dt * this.speed;
      this.pos = (Math.sin(this.phase * Math.PI) + 1) / 2;
      if (press) {
        if (this.pos >= this.zoneStart && this.pos <= this.zoneStart + this.zone) {
          this.hits++;
          Audio2.play('pickup');
          if (this.hits >= this.need) this.catchFish();
          else { this.zoneStart = rand(0.05, 0.95 - this.zone); }
        } else {
          this.misses++;
          Audio2.play('error');
          if (this.misses > 1) this.end('The line snapped! It got away.');
        }
      }
    } else if (this.state === 'result') {
      this.t -= dt;
      if (this.t <= 0 || (press && this.t < 0.9)) this.finish();
    }
  }
  catchFish() {
    const id = this.fish.id;
    giveItem(id, 1);
    Audio2.play('coin');
    gainXP('fishing', 8 + Math.round(this.fish.diff * 30));
    G.stats.fish++;
    unlock('fish_first');
    if (id === 'sponsorfish') { unlock('fish_legend'); recordNews('sponsor'); }
    addFollowers(20 + Math.round(this.fish.diff * 200), true);
    this.end(`Caught a ${ITEMS[id].name}!`);
    if (id === 'catfish') setTimeout(() => say(G.donut, 'Carl. That is a MOCKERY.', 2.5), 300);
  }
  finish() { G.fishing = null; UI.pop(this); }
  draw(ctx) {
    const s = UI.s, W = UI.W, H = UI.H;
    const w = 150 * s, h = 34 * s, x = (W - w) / 2, y = H - h - 40 * s;
    if (this.state === 'wait') drawText(ctx, 'Waiting for a bite...', W / 2, y + 12 * s, { size: 7, align: 'center', color: '#fff', shadow: '#000' });
    if (this.state === 'bite') drawText(ctx, '!!! PRESS SPACE !!!', W / 2, y + 10 * s, { size: 10, bold: true, align: 'center', color: '#ffe040', shadow: '#000' });
    if (this.state === 'reel') {
      drawPanel(ctx, x, y, w, h, 'wood');
      drawText(ctx, `Stop the marker in the green! (${this.hits}/${this.need})`, W / 2, y + 5 * s, { size: 5.5, align: 'center' });
      const bx = x + 8 * s, bw = w - 16 * s, by = y + 16 * s, bh = 10 * s;
      ctx.fillStyle = '#3a5a8a'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#4ad060'; ctx.fillRect(bx + bw * this.zoneStart, by, bw * this.zone, bh);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + bw * this.pos - s, by - 2 * s, 2 * s, bh + 4 * s);
    }
    if (this.state === 'result') drawText(ctx, this.msg, W / 2, y + 12 * s, { size: 8, bold: true, align: 'center', color: '#fff', shadow: '#000' });
  }
}

function pickFish(table) {
  const list = FISH_TABLES[table || 'farm'].filter(f => (!f.seasons || f.seasons.includes(G.season)) && (!f.rainOnly || G.weather === 'rain'));
  return weighted(list.map(f => [f, f.w + (f.bonusRain && G.weather === 'rain' ? f.bonusRain : 0)]));
}
