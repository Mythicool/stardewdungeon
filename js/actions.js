'use strict';
// ---------------------------------------------------------------------------
// Player actions: tools, farming, interaction, gifting, shipping, rewards.
// ---------------------------------------------------------------------------

function playerTile() { return tileOf(G.player); }

// Tile under the mouse if it's within reach, otherwise the tile being faced.
function targetTile(useMouse) {
  const P = G.player;
  const [px, py] = playerTile();
  if (useMouse && G.cam) {
    const wx = Input.mouse.x / G.zoom + G.cam.x, wy = Input.mouse.y / G.zoom + G.cam.y;
    const mx = Math.floor(wx / TILE), my = Math.floor(wy / TILE);
    if (Math.abs(mx - px) <= 1 && Math.abs(my - py) <= 1 && !(mx === px && my === py)) {
      const dx = mx - px, dy = my - py;
      P.dir = Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
      return [mx, my];
    }
  }
  return [px + DX[P.dir], py + DY[P.dir]];
}

function toolTiles(lvl, tx, ty, dir) {
  const out = [];
  const fx = DX[dir], fy = DY[dir], sx = fy, sy = fx; // side vector
  if (lvl === 0) out.push([tx, ty]);
  else if (lvl === 1) for (let i = 0; i < 3; i++) out.push([tx + fx * i, ty + fy * i]);
  else {
    const depth = lvl === 2 ? 3 : 5;
    for (let i = 0; i < depth; i++) for (let j = -1; j <= 1; j++) out.push([tx + fx * i + sx * j, ty + fy * i + sy * j]);
  }
  return out;
}

function startSwing(kind, dur = 0.26) {
  const P = G.player;
  P.swingT = dur; P.swingDur = dur; P.swingItem = kind; P.swingDir = P.dir;
}

// ---------------------------------------------------------------------------
function useSelected(useMouse) {
  const P = G.player;
  if (P.swingT > 0 || P.kickCd > 0) return;
  const it = selectedItem();
  const id = it ? it.id : null;
  const d = id ? ITEMS[id] : null;
  const [tx, ty] = targetTile(useMouse);
  if (!d || d.cat === 'weapon') return kick(tx, ty);
  switch (d.cat) {
    case 'tool': return useTool(d.tool, tx, ty);
    case 'seed': return plantSeed(id, tx, ty);
    case 'placeable': return placeItem(id, tx, ty);
    case 'bomb': return placeBombAt(id, tx, ty);
    case 'box': return openLootBox(P.sel);
    default:
      if (d.cat === 'food' || d.cat === 'potion') return eatItem(P.sel);
      if (itemEdible(id)) {
        const slot = P.sel;
        UI.ask(null, `Eat ${d.name}? (+${d.energy || 0} Energy)`, [{ label: 'Eat it', fn: () => eatItem(slot) }, { label: 'No', cancel: true }]);
        return;
      }
      return kick(tx, ty);
  }
}

function kick(tx, ty) {
  const P = G.player, m = G.map;
  startSwing('kick', 0.22);
  P.kickCd = 0.34;
  Audio2.play('swing');
  const hit = playerKick();
  const o = getObj(m, tx, ty);
  if (o && ['weed', 'crate', 'withered'].includes(o.type)) { hitObject(m, o, 1); }
  else if (o && o.type === 'bin' && chance(0.3)) UI.toast('You kick the Shipping Bin. It does not ship any faster.', null, '#ffd0a0');
  if (!hit && G.map.monsters && G.map.monsters.length === 0 && chance(0.02)) say(G.donut, 'Kicking the air, Carl? Bold choice.', 2);
}

function useTool(tool, tx, ty) {
  const P = G.player, m = G.map;
  const lvl = tool === 'rod' ? 0 : P.tools[tool];
  switch (tool) {
    case 'hoe': {
      startSwing('hoe');
      useEnergy(energyCost('farming') * (1 + lvl * 0.5));
      let n = 0;
      for (const [x, y] of toolTiles(lvl, tx, ty, P.dir)) {
        const i = y * m.w + x;
        if (!inBounds(m, x, y) || !m.farmable) continue;
        const g = m.ground[i];
        const o = m.objs.get(i);
        if (o && o.type === 'forage') continue;
        if ((g === T.GRASS || g === T.DIRT) && !o && !m.till[i] && !m.block[i] && !warpAt(m, x, y)) {
          m.till[i] = 1; n++;
          if (G.weather === 'rain') m.wet[i] = 1;
          burst(x * TILE + 8, y * TILE + 10, 4, ['#8a6040', '#6a4a2c'], 40);
        }
      }
      if (n) { Audio2.play('hoe'); unlock('dirt_farmer'); gainXP('farming', 0.5 * n); }
      else if (!m.farmable) { Audio2.play('error'); if (!G.flags.hoeTip) { G.flags.hoeTip = true; UI.toast('You can only till soil on the Homestead.', null, '#ffd0a0'); } }
      else Audio2.play('hoe');
      return;
    }
    case 'can': {
      startSwing('can', 0.34);
      const waterTile = isWater(m, tx, ty) ? [tx, ty] : null;
      if (waterTile) {
        P.water = canCapacity(); Audio2.play('refill');
        burst(tx * TILE + 8, ty * TILE + 8, 10, ['#6ab0ff', '#ffffff'], 60);
        UI.toast('Watering can refilled.', 'can', '#8fd0ff');
        return;
      }
      if (P.water <= 0) { Audio2.play('error'); UI.toast('Your watering can is empty. Refill it at the pond.', null, '#8fd0ff'); return; }
      useEnergy(energyCost('farming') * (1 + lvl * 0.5));
      P.water--;
      Audio2.play('water');
      let n = 0;
      for (const [x, y] of toolTiles(lvl, tx, ty, P.dir)) {
        if (!inBounds(m, x, y)) continue;
        const i = y * m.w + x;
        for (let k = 0; k < 3; k++) G.particles.push({ x: x * TILE + rand(3, 13), y: y * TILE + rand(2, 10), vx: rand(-8, 8), vy: rand(10, 30), life: 0.35, max: 0.35, color: '#6ab0ff', size: 1, grav: 200 });
        if (m.till[i] && !m.wet[i]) { m.wet[i] = 1; n++; }
      }
      G.stats.watered += n;
      return;
    }
    case 'axe':
    case 'pick': {
      startSwing(tool);
      const skill = tool === 'axe' ? 'foraging' : 'mining';
      useEnergy(energyCost(skill));
      const o = getObj(m, tx, ty);
      const i = ty * m.w + tx;
      if (o) {
        if (o.type === 'sprinkler' || o.type === 'qsprinkler') {
          removeObj(m, o); giveItem(o.type, 1); Audio2.play('pick'); return;
        }
        const axeOk = ['tree', 'stump', 'twig', 'weed', 'crate', 'withered'];
        const pickOk = ['stone', 'boulder', 'crate', 'weed', 'withered'];
        if ((tool === 'axe' ? axeOk : pickOk).includes(o.type)) {
          if (o.fixed) { Audio2.play('chop'); UI.toast('This tree is load-bearing scenery. Borant would sue.', null, '#ffd0a0'); return; }
          hitObject(m, o, 1 + lvl);
          return;
        }
        if (o.type === 'crop' && tool === 'pick') { Audio2.play('error'); return; }
      } else if (tool === 'pick' && inBounds(m, tx, ty) && m.till[i]) {
        m.till[i] = 0; m.wet[i] = 0; Audio2.play('hoe'); return;
      }
      Audio2.play(tool === 'axe' ? 'swing' : 'pick');
      return;
    }
    case 'rod': {
      const [px, py] = playerTile();
      let spot = null;
      for (let k = 1; k <= 4; k++) {
        const x = px + DX[P.dir] * k, y = py + DY[P.dir] * k;
        if (isWater(m, x, y)) { spot = [x, y]; if (k >= 2) break; }
        else if (spot) break;
      }
      if (!spot) { Audio2.play('error'); UI.toast('Face some water to fish.', null, '#8fd0ff'); return; }
      if (!m.fishTable) { UI.toast('Nothing is biting here.', null, '#8fd0ff'); return; }
      startSwing('rod', 0.3);
      useEnergy(energyCost('fishing', 3));
      Audio2.play('splash');
      UI.push(new FishingModal(spot[0] * TILE + 8, spot[1] * TILE + 8, m.fishTable));
      return;
    }
  }
}

function hitObject(m, o, dmg) {
  o.hp = (o.hp || 1) - dmg;
  o.shake = 0.25;
  const snd = { tree: 'chop', stump: 'chop', twig: 'chop', stone: 'pick', boulder: 'pick', crate: 'chop', weed: 'hoe', withered: 'hoe' }[o.type] || 'hit';
  Audio2.play(snd);
  const col = { tree: ['#8a5a2e', '#4a9a3e'], stump: ['#8a5a2e'], stone: ['#9a9aa4'], boulder: ['#9a9aa4', '#6a6a74'], weed: ['#4caa3c'], crate: ['#a0703a'] }[o.type] || ['#aaaaaa'];
  burst(o.x * TILE + 8, o.y * TILE + 8, 4, col, 50);
  if (o.hp <= 0) breakObject(m, o, false);
}

function breakObject(m, o, byBomb) {
  const cx = o.x * TILE + 8, cy = o.y * TILE + 10;
  const P = G.player;
  removeObj(m, o);
  switch (o.type) {
    case 'tree':
      spawnDrop('wood', randi(8, 12) + Math.floor(P.skills.foraging.lv / 2), cx, cy);
      if (chance(0.25)) {
        const opts = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(G.season));
        if (opts.length) spawnDrop('seed_' + choice(opts), 1, cx, cy);
      }
      addObj(m, { type: 'stump', x: o.x, y: o.y, hp: 4 });
      Audio2.play('treefall');
      gainXP('foraging', 12);
      burst(cx, cy - 16, 20, ['#4a9a3e', '#3a7a30', '#8a5a2e'], 90);
      break;
    case 'stump': spawnDrop('wood', randi(3, 5), cx, cy); gainXP('foraging', 5); Audio2.play('break'); break;
    case 'twig': spawnDrop('wood', randi(1, 2), cx, cy); gainXP('foraging', 1); break;
    case 'weed':
      if (chance(0.5)) spawnDrop('fiber', 1, cx, cy);
      if (chance(0.04) && m.farmable) { const opts = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(G.season)); if (opts.length) spawnDrop('seed_' + choice(opts), 1, cx, cy); }
      break;
    case 'stone': spawnDrop('stone', randi(1, 2), cx, cy); gainXP('mining', 2); Audio2.play('break'); break;
    case 'boulder': {
      spawnDrop('stone', randi(1, 2), cx, cy);
      const ml = P.skills.mining.lv;
      const oreMap = { copper: ['copper', 1, 3], iron: ['iron', 1, 2], gold: ['gold_ore', 1, 2], coal: ['coal', 1, 2], quartz: ['quartz', 1, 1], mana: ['mana', 1, 1], ruby: ['ruby', 1, 1], diamond: ['diamond', 1, 1] };
      if (o.ore && oreMap[o.ore]) {
        const [id, a, b] = oreMap[o.ore];
        spawnDrop(id, randi(a, b) + (chance(ml * 0.05) ? 1 : 0), cx, cy);
        gainXP('mining', 7);
      } else gainXP('mining', 3);
      if (chance(0.03)) spawnDrop('coal', 1, cx, cy);
      if (chance(0.006)) { spawnDrop('box_bronze', 1, cx, cy); UI.toast('Something shiny was in that rock!', null, '#ffe070'); }
      if (!byBomb) Audio2.play('break');
      G.stats.rocks++;
      pollOnRock(cx, cy);
      if (o.stairs) { revealStairs(o.x, o.y); UI.toast('You found the stairwell down!', null, '#ffe070'); Audio2.play('stairs'); donutComment('stairs'); }
      break;
    }
    case 'crate': {
      const loot = weighted([[['coal', 1], 3], [['copper', 2], 3], [['sandwich', 1], 2], [['hp_potion', 1], 1], [['goblin_powder', 1], 2], [['glowshroom', 1], 1], [null, 3]]);
      if (loot) spawnDrop(loot[0], loot[1], cx, cy);
      else { const g = randi(5, 30); G.gold += g; floater(cx, cy - 10, `+${g}g`, '#ffe070'); Audio2.play('coin'); }
      Audio2.play('break');
      gainXP('mining', 2);
      break;
    }
  }
  burst(cx, cy, 8, ['#aaaaaa', '#886644'], 70);
}

// ---------------------------------------------------------------------------
function plantSeed(id, tx, ty) {
  const m = G.map;
  const i = ty * m.w + tx;
  if (!m.farmable || !inBounds(m, tx, ty) || !m.till[i]) { Audio2.play('error'); UI.toast('Plant seeds in tilled soil (use your Hoe first).', null, '#ffd0a0'); return; }
  if (m.objs.has(i)) { Audio2.play('error'); return; }
  const cropId = ITEMS[id].crop;
  const cd = CROPS[cropId];
  if (!cd.seasons.includes(G.season)) {
    Audio2.play('error');
    UI.toast(`${cd.name} can't grow in ${SEASON_NAMES[G.season]}. The seed packet looks at you with pity.`, null, '#ffd0a0');
    return;
  }
  addObj(m, { type: 'crop', x: tx, y: ty, crop: cropId, grown: 0 });
  removeFromSlot(G.player.sel, 1);
  Audio2.play('plant');
  G.stats.planted++;
  unlock('seedy');
  startSwing('plant', 0.15);
}

function placeItem(id, tx, ty) {
  const m = G.map;
  if (m.id !== 'farm') { Audio2.play('error'); UI.toast('Place this on your Homestead.', null, '#ffd0a0'); return; }
  if (!canPlace(m, tx, ty) || warpAt(m, tx, ty)) { Audio2.play('error'); return; }
  addObj(m, { type: id, x: tx, y: ty });
  removeFromSlot(G.player.sel, 1);
  Audio2.play('plant');
}

function placeBombAt(id, tx, ty) {
  const m = G.map;
  if (m.id !== 'farm' && m.id !== 'dungeon') { Audio2.play('error'); UI.toast('Borant has disabled explosives here. Liability reasons.', null, '#ffd0a0'); return; }
  if (m.safe) { Audio2.play('error'); UI.toast('No explosives in the safe room. The Bopca is VERY clear on this.', null, '#ffd0a0'); return; }
  if (!inBounds(m, tx, ty) || SOLID_GROUND.has(gAt(m, tx, ty))) { Audio2.play('error'); return; }
  const o = getObj(m, tx, ty);
  if (o && OBJ[o.type].solid) { Audio2.play('error'); return; }
  placeBomb(tx, ty, id === 'megabomb');
  removeFromSlot(G.player.sel, 1);
  startSwing('plant', 0.15);
}

function eatItem(slot) {
  const P = G.player;
  const it = P.inv[slot];
  if (!it) return;
  const d = ITEMS[it.id];
  removeFromSlot(slot, 1);
  Audio2.play('eat');
  if (it.id === 'bomberry') {
    burst(P.x, P.y - 10, 20, ['#ffa020', '#ffe060', '#444'], 90);
    Audio2.play('boom');
    G.shake = 0.5;
    P.hp -= 25;
    floater(P.x, P.y - 20, '-25', '#ff5050');
    unlock('eat_bomberry');
    say(G.donut, "Carl! It said DO NOT EAT!", 2.5);
    if (P.hp <= 0) playerDie();
    return;
  }
  const e = d.energy || 0, h = d.hp || 0;
  P.energy = Math.min(P.maxEnergy, P.energy + e);
  P.hp = Math.min(P.maxHp, P.hp + h);
  if (P.energy > 0) G.flags.exhaustedWarned = false;
  floater(P.x, P.y - 20, `+${e}${h ? ' / +' + h + 'hp' : ''}`, '#80ff80');
  if (it.id === 'beer' && chance(0.3)) say(G.donut, 'Day drinking again, Carl?', 2);
}

function openLootBox(slot) {
  const it = G.player.inv[slot];
  if (!it) return;
  const d = ITEMS[it.id];
  removeFromSlot(slot, 1);
  const res = rollLootBox(d.tier);
  Audio2.play('lootbox');
  burst(G.player.x, G.player.y - 16, 30, ['#ffd23a', '#ff6ab0', '#ffffff', '#8ff3ff'], 120);
  const parts = [];
  if (res.gold) { G.gold += res.gold; parts.push(`${res.gold} gold`); }
  for (const r of res.items) { giveItem(r.id, r.n, true); parts.push(`${r.n > 1 ? r.n + 'x ' : ''}${ITEMS[r.id].name}`); }
  unlock('box_open');
  UI.system(`You opened the ${d.name}! Contents: ${parts.join(', ')}. ${choice(['The audience cheers politely.', 'Try not to spend it all in one place.', 'Some viewers are jealous. Most are not.', 'Borant thanks you for engaging with our loot ecosystem.'])}`);
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
function npcsHere() {
  const list = G.npcs.filter(n => n.map === G.map.id);
  if (G.donut) list.push(G.donut);
  if (G.map.id === 'farm' || mongoAlong()) list.push(G.mongo);
  if (G.map.localNpcs) list.push(...G.map.localNpcs);
  return list;
}

function findNPCNear(tx, ty) {
  const P = G.player;
  const fx = P.x + DX[P.dir] * 14, fy = P.y - 4 + DY[P.dir] * 14;
  let best = null, bd = 18;
  for (const n of npcsHere()) {
    const d1 = dist(n.x, n.y - 4, tx * TILE + 8, ty * TILE + 8);
    const d2 = dist(n.x, n.y - 4, fx, fy);
    const d = Math.min(d1, d2);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

function interactTarget(useMouse) {
  const [tx, ty] = targetTile(useMouse);
  const m = G.map;
  let o = getObj(m, tx, ty);
  if (!o || !OBJ[o.type]) o = null;
  // shop counters take priority over the shopkeeper standing behind them
  if (o && o.type === 'counter') return { o, tx, ty };
  const npc = findNPCNear(tx, ty);
  if (npc) return { npc };
  if (o) return { o, tx, ty };
  const b = m.buildings.find(b => b.message && tx >= b.x && tx < b.x + b.fw && ty >= b.y && ty < b.y + b.fh);
  if (b) return { b };
  return { tx, ty };
}

function getInteractHint() {
  if (!G.map || G.player.swingT > 0) return null;
  const t = interactTarget(false);
  const it = selectedItem();
  if (t.npc) {
    const n = t.npc;
    const def = NPC_DEFS[n.id];
    if (def && it && itemGiftable(it.id) && !friendOf(n.id).gifted) return `F: Give ${ITEMS[it.id].name} to ${def.name}`;
    if (dinnerWaiting(n)) return `F: Serve dinner to ${n.name}`;
    if (n.id === 'donut' || n.id === 'mongo') return `F: Pet ${n.name}`;
    return `F: Talk to ${n.name}`;
  }
  if (t.o) {
    const o = t.o;
    switch (o.type) {
      case 'crop': return cropReady(o) ? `F: Harvest ${CROPS[o.crop].name}` : `F: Check ${CROPS[o.crop].name}`;
      case 'bin': return it && ITEMS[it.id].price && ITEMS[it.id].cat !== 'tool' ? `F: Ship ${ITEMS[it.id].name} x${it.n}` : 'Shipping Bin (hold an item to ship)';
      case 'bed': return 'F: Sleep';
      case 'tv': return 'F: Watch TV';
      case 'counter': return 'F: Shop';
      case 'board': return 'F: Request Board';
      case 'sign': return 'F: Read sign';
      case 'chest': return 'F: Open loot chest';
      case 'forage': return `F: Pick up ${ITEMS[o.item].name}`;
      case 'ladder': return 'F: Climb up';
      case 'stairs': return 'Step on to descend';
      case 'fountain': return 'F: Toss a coin';
      case 'toilet': return 'F: Use toilet';
    }
  }
  if (t.b) return 'F: Inspect';
  return null;
}

function interact(useMouse) {
  const P = G.player;
  if (P.swingT > 0) return;
  const t = interactTarget(useMouse);
  if (t.npc) return interactNPC(t.npc);
  if (t.b) { UI.say(null, t.b.message); return; }
  if (t.o) {
    const o = t.o, m = G.map;
    switch (o.type) {
      case 'crop':
        if (cropReady(o)) return harvestCrop(o);
        UI.toast(`${CROPS[o.crop].name}: ${CROPS[o.crop].days - o.grown} day(s) to go${m.wet[o.y * m.w + o.x] ? ' · watered' : ' · needs water!'}`, null, '#c0f0a0');
        return;
      case 'withered': UI.toast("It's dead, Carl. Clear it with a tool.", null, '#ffd0a0'); return;
      case 'bin': return shipHeld();
      case 'bed': return sleepPrompt();
      case 'tv': return watchTV();
      case 'counter': return counterInteract(o);
      case 'board': return questBoard();
      case 'sign': UI.say(null, o.text); return;
      case 'chest': {
        removeObj(m, o);
        Audio2.play('lootbox');
        burst(o.x * TILE + 8, o.y * TILE + 6, 20, ['#ffd23a', '#ffffff'], 90);
        giveItem('box_' + o.tier, 1);
        donutComment('chest');
        if (m.level) sponsorEvent('chest');
        UI.toast('Use the box from your hotbar to open it!', null, '#ffe070');
        return;
      }
      case 'forage':
        removeObj(m, o);
        giveItem(o.item, 1);
        Audio2.play('pickup');
        gainXP('foraging', 5);
        return;
      case 'ladder':
        UI.ask('system', 'Climb back up the Stairwell to the Plaza?', [
          { label: 'Climb up', fn: leaveDungeon },
          { label: 'Stay', cancel: true },
        ]);
        return;
      case 'stairs': return descend();
      case 'fountain':
        if (G.gold < 1) { UI.say(null, "You check your pockets. You don't have pockets. You're in boxer shorts."); return; }
        G.gold -= 1; addFollowers(1, true); unlock('fountain'); Audio2.play('coin');
        UI.say(null, choice(["You toss a coin in and make a wish. The fountain gurgles: 'Wish denied.'", 'Plink. Somewhere, a Borant accountant smiles.', 'You wish for pants. Then you un-wish it. Freedom.']));
        return;
      case 'toilet':
        if (!G.flags.toiletToday) { G.flags.toiletToday = true; P.energy = Math.min(P.maxEnergy, P.energy + 10); }
        UI.say(null, "You use the toilet. Honestly, it's the nicest thing in the whole dungeon. (+10 Energy)");
        return;
      case 'hut': UI.say(null, "Mongo's hut. It smells like lizard and victory."); return;
    }
  }
  // Nothing to interact with — eat/open the held item as a convenience
  const it = selectedItem();
  if (it && ITEMS[it.id].cat === 'box') return openLootBox(P.sel);
  if (it && itemEdible(it.id) && ITEMS[it.id].cat !== 'seed') {
    UI.ask(null, `Eat ${ITEMS[it.id].name}?`, [{ label: 'Eat it', fn: () => eatItem(P.sel) }, { label: 'No', cancel: true }]);
  }
}

function counterInteract(o) {
  const keeperId = SHOPS[o.shop].keeper;
  const def = NPC_DEFS[keeperId];
  const npc = def && G.npcs.find(n => n.id === keeperId && n.map === G.map.id);
  if (!npc) return openShop(o.shop);
  const f = friendOf(keeperId);
  const it = selectedItem();
  const sh = SHOPS[o.shop];
  if (G.time < sh.hours[0] || G.time > sh.hours[1]) return openShop(o.shop);
  if (it && itemGiftable(it.id) && !f.gifted) {
    const slot = G.player.sel;
    UI.ask(keeperId, `(Give ${ITEMS[it.id].name} to ${def.name}?)`, [
      { label: `Give ${ITEMS[it.id].name}`, fn: () => giveGift(npc, slot) },
      { label: 'Shop', fn: () => openShop(o.shop) },
      { label: 'Never mind', cancel: true },
    ]);
    return;
  }
  const shop = () => !f.talked || pendingHeartEvent(keeperId) ? talkTo(npc, () => openShop(o.shop)) : openShop(o.shop);
  const extra = [];
  if (canInviteToDinner(keeperId)) extra.push({ label: 'Invite to dinner tonight', fn: () => inviteToDinner(npc) });
  const favor = favorOption(npc);
  if (favor) extra.push(favor);
  if (extra.length) {
    UI.ask(keeperId, `(What do you need from ${def.name}?)`, [{ label: 'Shop', fn: shop }, ...extra, { label: 'Never mind', cancel: true }]);
    return;
  }
  shop();
}

function interactNPC(npc) {
  const def = NPC_DEFS[npc.id];
  npc.dir = DX[G.player.dir] ? (G.player.dir === LEFT ? RIGHT : LEFT) : (G.player.dir === UP ? DOWN : UP);
  if (!def) { // local NPC (safe room)
    UI.say(npc.spr, choice(npc.lines));
    return;
  }
  if (dinnerWaiting(npc)) return serveDinnerMenu(npc);
  const it = selectedItem();
  const f = friendOf(npc.id);
  const gift = it && itemGiftable(it.id) && !f.gifted;
  const slot = G.player.sel;
  const opts = [];
  if (gift) opts.push({ label: `Give ${ITEMS[it.id].name}`, fn: () => giveGift(npc, slot) });
  if (canInvite(npc.id)) opts.push({ label: 'Invite to the Stairwell', fn: () => inviteToParty(npc) });
  if (G.party === npc.id) opts.push({ label: 'Send home for today', fn: () => dismissParty(npc) });
  if (npc.id === 'mongo' && canBringMongo()) opts.push({ label: 'Bring to the Stairwell', fn: () => bringMongo() });
  if (npc.id === 'mongo' && mongoAlong()) opts.push({ label: 'Send home for today', fn: () => dismissMongo() });
  if (canInviteToDinner(npc.id)) opts.push({ label: 'Invite to dinner tonight', fn: () => inviteToDinner(npc) });
  if (npc.id === 'zev' && sponsorAvailable()) opts.push({ label: "Hear today's sponsor deal", fn: () => offerSponsorDeal() });
  const favor = favorOption(npc);
  if (favor) opts.push(favor);
  if (!opts.length) return talkTo(npc);
  opts.splice(gift ? 1 : 0, 0, { label: npc.id === 'donut' || npc.id === 'mongo' ? 'Just pet' : 'Just talk', fn: () => talkTo(npc) });
  opts.push({ label: 'Never mind', cancel: true });
  const prompt = gift
    ? (npc.id === 'donut' ? `Is that for ME, Carl? (${ITEMS[it.id].name})` : `(Give ${ITEMS[it.id].name} to ${def.name}?)`)
    : `(What do you want to do with ${def.name}?)`;
  UI.ask(npc.id, prompt, opts);
}

function talkTo(npc, onDone) {
  const def = NPC_DEFS[npc.id];
  const f = friendOf(npc.id);
  const ev = pendingHeartEvent(npc.id);
  if (ev) return playHeartEvent(npc, ev, onDone);
  const hearts = heartsOf(npc.id);
  const bday = !f.talked && isBirthday(npc.id) && BIRTHDAYS[npc.id].talk;
  const pool = def.lines.filter(l => l[0] <= hearts).map(l => l[1]);
  G.lineIdx[npc.id] = (G.lineIdx[npc.id] || 0) + 1;
  // prefer heart-gated lines the first time they unlock
  const special = def.lines.filter(l => l[0] > 0 && l[0] <= hearts && !G.seenLines[npc.id + ':' + l[1].slice(0, 20)]);
  const gossip = !bday && newsReaction(npc.id);
  const partyChat = (G.party === npc.id || G.pet === npc.id) && f.talked && PARTY_LINES[npc.id];
  const grudge = dinnerGrudge(npc.id);
  const line = grudge || bday || gossip || (partyChat ? choice(partyChat.chat) : special.length ? special[special.length - 1][1] : pool[(G.day * 7 + G.lineIdx[npc.id] + npc.id.length) % pool.length]);
  G.seenLines[npc.id + ':' + line.slice(0, 20)] = true;
  if (!f.talked) {
    f.talked = true;
    addFriend(npc.id, 20);
    addFollowers(npc.id === 'donut' || npc.id === 'mongo' ? 25 : 10, true);
  }
  if (npc.id === 'donut') { Audio2.play('meow'); unlock('pet_donut'); burst(npc.x, npc.y - 14, 6, ['#ff8fb0', '#ffffff'], 30); }
  else if (npc.id === 'mongo') { Audio2.play('roar'); unlock('pet_mongo'); burst(npc.x, npc.y - 14, 6, ['#ff8fb0', '#ffffff'], 30); }
  else if (!G.met[npc.id]) G.met[npc.id] = true;
  return UI.say(npc.id, line, onDone);
}

// Heart events ------------------------------------------------------------------
// At most one per day, so a friend who jumps several hearts at once still gets
// each scene on its own day.
function pendingHeartEvent(id) {
  const evs = HEART_EVENTS[id];
  if (!evs || G.heartEventDay === G.totalDays) return null;
  const hearts = heartsOf(id);
  return evs.find(ev => ev.hearts <= hearts && !(ev.id in G.heartEvents)) || null;
}

function heartEventCount(id) {
  return (HEART_EVENTS[id] || []).filter(ev => ev.id in G.heartEvents).length;
}

function playHeartEvent(npc, ev, onDone) {
  const f = friendOf(npc.id);
  G.heartEventDay = G.totalDays;
  G.met[npc.id] = true;
  if (!f.talked) f.talked = true; // the scene counts as today's chat; its friendship comes from the choice
  Audio2.play(npc.id === 'donut' ? 'meow' : npc.id === 'mongo' ? 'roar' : 'system');
  const lines = ev.scene.map(([who, text]) => ({ who, text }));
  lines.push({
    who: ev.ask[0], text: ev.ask[1],
    choices: ev.choices.map((c, i) => ({ label: c.label, fn: () => resolveHeartEvent(npc, ev, i, onDone) })),
  });
  return UI.dialog(lines, { noCancel: true });
}

function resolveHeartEvent(npc, ev, i, onDone) {
  const c = ev.choices[i];
  G.heartEvents[ev.id] = i;
  addFriend(npc.id, c.pts);
  if (c.pts > 0) burst(npc.x, npc.y - 16, c.pts >= 120 ? 16 : 8, ['#ff4f8a', '#ffffff', '#ffd23a'], 60);
  Audio2.play(c.pts > 0 ? 'coin' : 'error');
  UI.dialog(c.reply.map(([who, text]) => ({ who, text })), {
    onDone: () => {
      if (c.gift) giveItem(c.gift[0], c.gift[1]);
      const fans = 200 + Math.max(0, c.pts) * 10 + (c.followers || 0);
      addFollowers(fans, true);
      UI.announce('EPISODE AIRED: ' + ev.title, `The Syndicate watched you and ${NPC_DEFS[npc.id].name} share a moment. +${fmtNum(fans)} followers.`, 'level');
      unlock('heart_event');
      if (Object.keys(HEART_EVENTS).every(id => heartEventCount(id) === HEART_EVENTS[id].length)) unlock('heart_all');
      if (onDone) onDone();
    },
  });
}

function giveGift(npc, slot) {
  const def = NPC_DEFS[npc.id];
  const it = G.player.inv[slot];
  if (!it) return;
  const id = it.id;
  const f = friendOf(npc.id);
  let kind = 'neutral';
  if (def.love.includes(id)) kind = 'love';
  else if (def.like.includes(id)) kind = 'like';
  else if (def.hate.includes(id)) kind = 'hate';
  const bday = isBirthday(npc.id);
  let pts = { love: 80, like: 45, neutral: 20, hate: -40 }[kind];
  if (bday) pts *= kind === 'hate' ? 2 : 4;
  removeFromSlot(slot, 1);
  f.gifted = true;
  if (!f.talked) f.talked = true;
  if (!G.met[npc.id]) G.met[npc.id] = true;
  addFriend(npc.id, pts);
  if (kind === 'love') {
    G.knownLoves[npc.id + ':' + id] = true;
    unlock('gift_love');
    addFollowers(80, true);
    burst(npc.x, npc.y - 16, 16, ['#ff4f8a', '#ffffff', '#ffd23a'], 70);
    Audio2.play('coin');
  } else if (kind === 'hate') {
    Audio2.play('error');
    recordNews('badgift', { who: npc.id, item: ITEMS[id].name });
  }
  else Audio2.play('pickup');
  if (bday && kind !== 'hate') {
    unlock('birthday');
    addFollowers(kind === 'love' ? 1000 : 300, true);
    burst(npc.x, npc.y - 16, 20, ['#ff8fd0', '#8fd0ff', '#ffd23a', '#a0ffa0'], 80);
  }
  UI.say(npc.id, bday ? BIRTHDAYS[npc.id][kind === 'love' ? 'love' : kind === 'hate' ? 'hate' : 'gift'] : def.react[kind]);
}

// Birthdays --------------------------------------------------------------------
function isBirthday(id) {
  const b = BIRTHDAYS[id];
  return !!b && b.season === G.season && b.day === G.day;
}

function birthdayText(id) {
  const b = BIRTHDAYS[id];
  return b ? `${SEASON_NAMES[b.season]} ${b.day}` : '';
}

function harvestCrop(o) {
  const m = G.map, P = G.player;
  const cd = CROPS[o.crop];
  const n = 1 + (chance(0.08 + P.skills.farming.lv * 0.03) ? 1 : 0);
  spawnDrop(o.crop, n, o.x * TILE + 8, o.y * TILE + 8);
  Audio2.play('harvest');
  burst(o.x * TILE + 8, o.y * TILE + 6, 8, [cd.color, '#4caa3c'], 50);
  gainXP('farming', Math.round(cd.sell / 9) + 2);
  G.stats.harvested++;
  unlock('first_harvest');
  if (G.stats.harvested >= 100) unlock('harvest_100');
  if (cd.regrow) o.grown = cd.days - cd.regrow;
  else removeObj(m, o);
  if (o.crop === 'mandrake') {
    Audio2.play('scream');
    G.shake = 0.6;
    unlock('mandrake');
    recordNews('mandrake');
    addFollowers(300);
    say(G.donut, choice(['My EARS, Carl!', 'Do NOT do that again. Actually, do. The fans loved it.', 'AAAAAH! Oh. It was the plant.']), 2.5);
  }
}

function shipHeld() {
  const P = G.player;
  const it = selectedItem();
  if (!it) { UI.toast('Hold an item in your hotbar to ship it.', null, '#ffd0a0'); return; }
  const d = ITEMS[it.id];
  if (!d.price || d.cat === 'tool' || d.cat === 'weapon' || d.cat === 'box') { Audio2.play('error'); UI.toast(`You can't ship ${d.name}.`, null, '#ffd0a0'); return; }
  G.shipping.push({ id: it.id, n: it.n });
  UI.toast(`Shipped ${it.n} ${d.name} (${it.n * d.price}g tonight)`, it.id, '#ffe070');
  G.stats.shippedCount += it.n;
  P.inv[P.sel] = null;
  Audio2.play('ship');
  unlock('first_ship');
}

function sleepPrompt() {
  UI.ask('system', 'Go to sleep for the night? The game saves while you sleep.', [
    { label: 'Sleep', fn: () => endDay(false) },
    { label: 'Not yet', cancel: true },
  ]);
}

function watchTV() {
  unlock('tv');
  const w = G.tomorrowWeather;
  const fc = w === 'rain' ? "Tomorrow: RAIN. Leave the watering can at home." : w === 'snow' ? 'Tomorrow: SNOW. Bundle up. Or don\'t. You never do.' : 'Tomorrow: SUNNY. Your crops will need water.';
  UI.system([`BORANT WEATHER DEPARTMENT: ${fc}`, choice(TV_SHOWS)]);
}

function openShop(id) {
  const sh = SHOPS[id];
  if (sh.keeper && atDinner(sh.keeper)) {
    UI.say(null, `A note on the counter: "Gone to dinner at Carl's. Back after dessert!"`);
    return;
  }
  if (G.time < sh.hours[0] || G.time > sh.hours[1]) {
    UI.say(null, id === 'pook' ? `A sign on the counter: "CLOSED. Pook is napping. Open ${fmtTime(sh.hours[0])} - ${fmtTime(sh.hours[1])}."` : `Mordecai waves you off. "Guild supply is closed. Come back after ${fmtTime(sh.hours[0])}."`);
    return;
  }
  Audio2.play('open');
  if (id === 'pook') G.met.pook = true;
  UI.push(new ShopModal(id));
}

function questBoard() {
  const q = G.quest;
  if (q) {
    const have = q.type === 'deliver' ? countItem(q.item) : q.progress;
    const done = have >= q.n;
    if (done) {
      UI.ask('system', `REQUEST: ${q.text} Complete! Reward: ${q.reward}g.`, [
        { label: 'Turn in', fn: completeQuest },
        { label: 'Later', cancel: true },
      ]);
    } else {
      UI.ask('system', `CURRENT REQUEST: ${q.text} Progress: ${Math.min(have, q.n)}/${q.n}. ${q.expires} day(s) left. Reward: ${q.reward}g.`, [
        { label: 'Keep working', cancel: true },
        { label: 'Abandon request', fn: () => { G.quest = null; UI.toast('Request abandoned.', null, '#ffd0a0'); } },
      ]);
    }
  } else if (G.boardOffer) {
    const o = G.boardOffer;
    UI.ask('system', `REQUEST BOARD: ${o.text} Reward: ${o.reward}g + friendship. You have ${o.expires} days.`, [
      { label: 'Accept', fn: () => { G.quest = G.boardOffer; G.boardOffer = null; Audio2.play('open'); } },
      { label: 'Not now', cancel: true },
    ]);
  } else UI.system('The Request Board is empty. New requests are posted each morning.');
}

function completeQuest() {
  const q = G.quest;
  if (!q) return;
  if (q.type === 'deliver') removeItem(q.item, q.n);
  G.gold += q.reward;
  G.stats.earned += q.reward;
  addFriend(q.from, 150);
  addFollowers(500);
  G.quest = null;
  Audio2.play('coin');
  unlock('quest_first');
  checkGoldAchievements();
  const thanks = { katia: "Katia: 'You're a lifesaver, Carl! Dinner party is ON.'", pook: "Pook: 'Pook is grateful! Pook will remember this at checkout!'", mordecai: "Mordecai: 'Good work. Don't make it weird.'", donut: "Donut: 'Finally. The fans were getting restless.'", zev: "Zev: 'Engagement is UP! You're a natural, Carl.'" };
  UI.system(`Request complete! +${q.reward}g. ${thanks[q.from] || ''}`);
}

function dungeonEntrance() {
  const floors = G.expressFloors;
  if (floors.length <= 1) { enterDungeon(1); return; }
  const choices = floors.slice(-8).map(l => ({ label: l === 1 ? 'Level 1 (the top)' : `Level ${l}${isSafeLevel(l) ? ' — Safe Room' : bossForLevel(l) ? ' — Boss Lair' : ''}`, fn: () => enterDungeon(l) }));
  choices.push({ label: 'Cancel', cancel: true });
  UI.ask('system', 'STAIRWELL EXPRESS. Now serving every checkpoint you have reached. Select a level:', choices);
}

// ---------------------------------------------------------------------------
// Rewards & progression
// ---------------------------------------------------------------------------
function unlock(id) {
  if (G.achievements[id] || !ACHIEVEMENTS[id]) return;
  G.achievements[id] = G.totalDays || 1;
  const a = ACHIEVEMENTS[id];
  const rw = [];
  if (a.box) { giveItem(a.box, 1, true); rw.push(ITEMS[a.box].name); }
  if (a.followers) { addFollowers(a.followers, true); rw.push(`${fmtNum(a.followers)} followers`); }
  UI.announce('NEW ACHIEVEMENT! ' + a.name, a.desc + (rw.length ? ' Reward: ' + rw.join(' + ') + '.' : ''), 'achievement', 'achievement');
}

const FOLLOWER_MILESTONES = [1000, 10000, 100000, 1000000, 10000000];
function addFollowers(n, silent) {
  if (n > 0 && hasPerk('zev')) n = Math.round(n * (1 + FRIEND_PERKS.zev.followers));
  const before = G.followers;
  G.followers += n;
  if (!silent && n > 0) floater(G.player.x, G.player.y - 26, `+${fmtNum(n)} fans`, '#ff8fd0');
  for (const ms of FOLLOWER_MILESTONES) {
    if (before < ms && G.followers >= ms) {
      giveItem('box_fan', 1, true);
      UI.announce('FOLLOWER MILESTONE!', `You now have ${fmtNum(ms)} followers! Your fans sent you a Fan Box. Zev is screaming into a pillow.`, 'achievement', 'achievement');
    }
  }
  if (G.followers >= 1e6) unlock('followers_1m');
}

function checkGoldAchievements() {
  if (G.stats.earned >= 1000) unlock('gold_1k');
  if (G.stats.earned >= 10000) unlock('gold_10k');
  if (G.stats.earned >= 100000) unlock('gold_100k');
}

function checkMainQuest() {
  const q = MAIN_QUESTS[G.mainQuest];
  if (!q || !q.check()) return;
  G.mainQuest++;
  const rw = [];
  if (q.reward.gold) { G.gold += q.reward.gold; rw.push(q.reward.gold + 'g'); }
  if (q.reward.box) { giveItem(q.reward.box, 1, true); rw.push(ITEMS[q.reward.box].name); }
  Audio2.play('levelup');
  const next = MAIN_QUESTS[G.mainQuest];
  UI.announce('OBJECTIVE COMPLETE: ' + q.title, `Reward: ${rw.join(', ')}.` + (next ? ` Next objective: ${next.title}.` : ' You have completed every objective! Borant is renewing the show for another season. Forever.'), 'level');
}
