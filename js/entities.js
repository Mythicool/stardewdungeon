'use strict';
// ---------------------------------------------------------------------------
// Player, inventory, skills, NPCs, and the companions (Donut & Mongo).
// ---------------------------------------------------------------------------

const SKILL_XP = [100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];
const SKILL_NAMES = { farming: 'Farming', mining: 'Mining', combat: 'Combat', fishing: 'Fishing', foraging: 'Foraging' };

function createPlayer() {
  const inv = new Array(40).fill(null);
  const start = [['foot', 1], ['hoe', 1], ['can', 1], ['axe', 1], ['pick', 1], ['rod', 1], ['seed_radish', 15], ['sandwich', 3]];
  start.forEach(([id, n], i) => { inv[i] = { id, n }; });
  return {
    x: 8 * TILE + 8, y: 8 * TILE + 12, dir: DOWN, hw: 5, hh: 5, speed: 84,
    moving: false, animT: 0, frame: 0,
    energy: 270, maxEnergy: 270, hp: 100, maxHp: 100,
    inv, invSize: 20, sel: 0,
    tools: { hoe: 0, can: 0, axe: 0, pick: 0 }, water: 40,
    swingT: 0, swingDur: 0, swingItem: null, swingDir: DOWN, pendingAction: null,
    hurtT: 0, kx: 0, ky: 0, kickCd: 0,
    skills: { farming: { lv: 0, xp: 0 }, mining: { lv: 0, xp: 0 }, combat: { lv: 0, xp: 0 }, fishing: { lv: 0, xp: 0 }, foraging: { lv: 0, xp: 0 } },
    trail: [],
  };
}
function canCapacity() { return 40 + G.player.tools.can * 15; }

// --- inventory -------------------------------------------------------------
function invSlots() { return G.player.inv.slice(0, G.player.invSize); }
function countItem(id) {
  let n = 0;
  for (let i = 0; i < G.player.invSize; i++) { const s = G.player.inv[i]; if (s && s.id === id) n += s.n; }
  return n;
}
function playerOwns(id) { return countItem(id) > 0; }
function addItem(id, n = 1) {
  const inv = G.player.inv;
  if (itemStackable(id)) {
    for (let i = 0; i < G.player.invSize && n > 0; i++) {
      if (inv[i] && inv[i].id === id) { inv[i].n += n; n = 0; }
    }
  }
  for (let i = 0; i < G.player.invSize && n > 0; i++) {
    if (!inv[i]) {
      if (itemStackable(id)) { inv[i] = { id, n }; n = 0; }
      else { inv[i] = { id, n: 1 }; n--; }
    }
  }
  return n; // leftover
}
function removeItem(id, n = 1) {
  const inv = G.player.inv;
  for (let i = G.player.invSize - 1; i >= 0 && n > 0; i--) {
    if (inv[i] && inv[i].id === id) {
      const take = Math.min(n, inv[i].n);
      inv[i].n -= take; n -= take;
      if (inv[i].n <= 0) inv[i] = null;
    }
  }
  return n === 0;
}
function removeFromSlot(i, n = 1) {
  const s = G.player.inv[i];
  if (!s) return;
  s.n -= n;
  if (s.n <= 0) G.player.inv[i] = null;
}
function hasIngredients(ing) { return Object.entries(ing).every(([id, n]) => countItem(id) >= n); }
function selectedItem() { return G.player.inv[G.player.sel] || null; }
function giveItem(id, n, silent) {
  const left = addItem(id, n);
  if (left > 0) {
    spawnDrop(id, left, G.player.x, G.player.y - 4);
    if (!silent) UI.toast('Inventory full!', null, '#ff8080');
  }
  if (!silent) UI.toast(`+${n} ${ITEMS[id].name}`, id);
  return left;
}

// --- skills ------------------------------------------------------------------
function gainXP(skill, amt) {
  const s = G.player.skills[skill];
  if (!s || s.lv >= 10) return;
  s.xp += amt;
  while (s.lv < 10 && s.xp >= SKILL_XP[s.lv]) {
    s.lv++;
    onSkillLevel(skill, s.lv);
  }
}
function onSkillLevel(skill, lv) {
  Audio2.play('levelup');
  const P = G.player;
  let perk = '';
  if (skill === 'combat') { P.maxHp += 5; P.hp = Math.min(P.maxHp, P.hp + 5); perk = ' +5 Max Health, +1 kick damage.'; }
  if (skill === 'farming') perk = ' Hoe & watering can cost less energy.';
  if (skill === 'mining') perk = ' Pickaxe costs less energy. More ore.';
  if (skill === 'foraging') { P.maxEnergy += 5; perk = ' +5 Max Energy. Axe costs less energy.'; }
  if (skill === 'fishing') perk = ' Fish are easier to catch.';
  const snark = choice(['The audience is... mildly engaged.', 'Try not to let it go to your head.', 'A tiny golden star has been added to your file.', 'Several viewers clapped. One was sarcastic.']);
  UI.announce('LEVEL UP!', `Your ${SKILL_NAMES[skill]} skill is now level ${lv}.${perk} ${snark}`);
  addFollowers(150 * lv, true);
  checkRecipeUnlocks();
}
function checkRecipeUnlocks() {
  for (const r of RECIPES) {
    if (G.recipes.includes(r.id) || !r.unlock || !G.player.skills[r.unlock[0]]) continue;
    const [sk, lv] = r.unlock;
    if (G.player.skills[sk].lv >= lv) {
      G.recipes.push(r.id);
      UI.toast(`New recipe: ${ITEMS[r.out].name}!`, r.out, '#ffe070');
    }
  }
}
function energyCost(skill, base = 2) {
  const lv = G.player.skills[skill] ? G.player.skills[skill].lv : 0;
  return Math.max(0.5, base - lv * 0.12);
}
function useEnergy(n) {
  const P = G.player;
  P.energy = Math.max(-20, P.energy - n);
  if (P.energy <= 0 && !G.flags.exhaustedWarned) {
    G.flags.exhaustedWarned = true;
    UI.toast("You're exhausted! Eat something or go to bed.", null, '#ff8080');
  }
  if (P.energy <= -15) passOut();
}

// --- collision helpers ------------------------------------------------------
function boxBlocked(m, x, y, hw, hh) {
  const x0 = Math.floor((x - hw) / TILE), x1 = Math.floor((x + hw - 0.01) / TILE);
  const y0 = Math.floor((y - hh) / TILE), y1 = Math.floor((y - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isBlocked(m, tx, ty)) return true;
  return false;
}
function moveEntity(e, dx, dy, m, slide) {
  let moved = false;
  if (dx) {
    if (!boxBlocked(m, e.x + dx, e.y, e.hw, e.hh)) { e.x += dx; moved = true; }
    else if (slide && !dy) {
      for (const off of [3, 6]) {
        if (!boxBlocked(m, e.x + dx, e.y - off, e.hw, e.hh)) { e.y -= Math.min(1, off); moved = true; break; }
        if (!boxBlocked(m, e.x + dx, e.y + off, e.hw, e.hh)) { e.y += Math.min(1, off); moved = true; break; }
      }
    }
  }
  if (dy) {
    if (!boxBlocked(m, e.x, e.y + dy, e.hw, e.hh)) { e.y += dy; moved = true; }
    else if (slide && !dx) {
      for (const off of [3, 6]) {
        if (!boxBlocked(m, e.x - off, e.y + dy, e.hw, e.hh)) { e.x -= Math.min(1, off); moved = true; break; }
        if (!boxBlocked(m, e.x + off, e.y + dy, e.hw, e.hh)) { e.x += Math.min(1, off); moved = true; break; }
      }
    }
  }
  return moved;
}
function tileOf(e) { return [Math.floor(e.x / TILE), Math.floor((e.y - 3) / TILE)]; }

// BFS path on the tile grid. Returns list of [x,y] (excluding start) or null.
function findPath(m, sx, sy, tx, ty, limit = 4000) {
  if (sx === tx && sy === ty) return [];
  const W = m.w;
  const prev = new Int32Array(m.w * m.h).fill(-1);
  const start = sy * W + sx, goal = ty * W + tx;
  prev[start] = start;
  const q = [start];
  let qi = 0;
  while (qi < q.length && qi < limit) {
    const k = q[qi++];
    if (k === goal) break;
    const x = k % W, y = (k / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!inBounds(m, nx, ny)) continue;
      const nk = ny * W + nx;
      if (prev[nk] >= 0) continue;
      if (nk !== goal && isBlocked(m, nx, ny)) continue;
      prev[nk] = k; q.push(nk);
    }
  }
  if (prev[goal] < 0) return null;
  const path = [];
  for (let k = goal; k !== start; k = prev[k]) path.push([k % W, (k / W) | 0]);
  return path.reverse();
}
function nearestFree(m, x, y) {
  if (!isBlocked(m, x, y)) return [x, y];
  for (let r = 1; r < 6; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (!isBlocked(m, x + i, y + j)) return [x + i, y + j];
  }
  return [x, y];
}

// --- NPCs ----------------------------------------------------------------------
function createNPC(id, map, tx, ty, extra) {
  const def = NPC_DEFS[id] || {};
  return Object.assign({
    id, spr: def.spr || id, name: def.name || id, map,
    x: tx * TILE + 8, y: ty * TILE + 12, dir: DOWN, hw: 5, hh: 5,
    path: null, animT: 0, frame: 0, moving: false, bubble: null, schedIdx: -1, idleT: rand(2, 5),
  }, extra || {});
}

function initNPCs() {
  G.npcs = [];
  for (const id of ['mordecai', 'katia', 'zev', 'pook']) {
    const s = NPC_DEFS[id].schedule[0];
    G.npcs.push(createNPC(id, s.map, s.x, s.y));
  }
  G.donut = createNPC('donut', 'farm', 9, 9, { hw: 4, hh: 4, cd: 0 });
  G.mongo = createNPC('mongo', 'farm', 5, 10, { hw: 4, hh: 4, home: [5, 10], wanderT: 1 });
}

function currentSchedule(npc) {
  const sch = NPC_DEFS[npc.id].schedule;
  let idx = 0;
  for (let i = 0; i < sch.length; i++) if (G.time >= sch[i].t) idx = i;
  return idx;
}

function updateNPC(npc, dt) {
  if (npc.id === G.party) return updatePartyMember(npc, dt);
  const def = NPC_DEFS[npc.id];
  if (def && def.schedule) {
    const idx = atDinner(npc.id) ? -2 : currentSchedule(npc);
    if (idx !== npc.schedIdx) {
      npc.schedIdx = idx;
      const s = idx === -2 ? DINNER_SEAT : def.schedule[idx];
      const m = G.maps[s.map];
      const [fx, fy] = nearestFree(m, s.x, s.y);
      if (npc.map !== s.map || !m) {
        npc.map = s.map; npc.x = fx * TILE + 8; npc.y = fy * TILE + 12; npc.path = null;
      } else {
        const [sx, sy] = tileOf(npc);
        npc.path = findPath(m, sx, sy, fx, fy);
        if (!npc.path) { npc.x = fx * TILE + 8; npc.y = fy * TILE + 12; }
      }
    }
  }
  npc.moving = false;
  if (npc.path && npc.path.length) {
    const [px, py] = npc.path[0];
    const gx = px * TILE + 8, gy = py * TILE + 12;
    const dx = gx - npc.x, dy = gy - npc.y;
    const d = Math.hypot(dx, dy);
    const sp = 40 * dt;
    if (d <= sp) { npc.x = gx; npc.y = gy; npc.path.shift(); }
    else {
      npc.x += dx / d * sp; npc.y += dy / d * sp;
      npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
      npc.moving = true;
    }
    if (!npc.path.length) { npc.path = null; npc.dir = DOWN; }
  } else if (G.map.id === npc.map) {
    // idly face the player when near
    const d = dist(npc.x, npc.y, G.player.x, G.player.y);
    if (d < 40) {
      const dx = G.player.x - npc.x, dy = G.player.y - npc.y;
      npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
    }
  }
  animate(npc, dt);
  if (npc.bubble) { npc.bubble.t -= dt; if (npc.bubble.t <= 0) npc.bubble = null; }
}

function animate(e, dt) {
  if (e.moving) {
    e.animT += dt;
    e.frame = [1, 0, 2, 0][Math.floor(e.animT * 7) % 4];
  } else { e.frame = 0; e.animT = 0; }
}

function say(e, text, t = 2.6) { e.bubble = { text, t }; }

// Donut follows the player's trail; casts Magic Missile in the dungeon.
function updateDonut(dt) {
  const d = G.donut, P = G.player;
  d.map = G.map.id;
  const trail = P.trail;
  const lag = 18;
  let tx = d.x, ty = d.y;
  if (trail.length > lag) { tx = trail[trail.length - 1 - lag][0]; ty = trail[trail.length - 1 - lag][1]; }
  else if (dist(d.x, d.y, P.x, P.y) > 24) { tx = P.x; ty = P.y + 6; }
  // never stand on top of Carl: keep at least 18px away
  const pdx = tx - P.x, pdy = ty - P.y, pd = Math.hypot(pdx, pdy);
  if (pd < 18) {
    const ax = d.x - P.x, ay = d.y - P.y, al = Math.hypot(ax, ay) || 1;
    const bx = al > 0.5 ? ax / al : -DX[P.dir] || 0.7, by = al > 0.5 ? ay / al : -DY[P.dir] || 0.7;
    tx = P.x + bx * 18; ty = P.y + by * 18;
  }
  const dx = tx - d.x, dy = ty - d.y;
  const dd = Math.hypot(dx, dy);
  d.moving = false;
  if (dd > 160) { d.x = P.x; d.y = P.y + 8; }
  else if (dd > 3) {
    const sp = Math.min(dd, (dd > 40 ? 130 : 88) * dt);
    d.x += dx / dd * sp; d.y += dy / dd * sp;
    d.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
    d.moving = dd > 5;
  }
  animate(d, dt);
  if (d.bubble) { d.bubble.t -= dt; if (d.bubble.t <= 0) d.bubble = null; }

  if (G.map.monsters && G.map.monsters.length && !pollTwist('donut_strike')) {
    d.cd -= dt;
    if (d.cd <= 0) {
      let best = null, bd = 120;
      for (const mo of G.map.monsters) {
        if (mo.dead) continue;
        const md = dist(d.x, d.y, mo.x, mo.y);
        if (md < bd) { bd = md; best = mo; }
      }
      if (best) {
        const hearts = heartsOf('donut');
        const dmg = 5 + Math.floor(P.skills.combat.lv * 1.2) + Math.floor(hearts / 2);
        G.projectiles.push({ kind: 'missile', x: d.x, y: d.y - 8, vx: 0, vy: -60, target: best, dmg, friendly: true, life: 3 });
        Audio2.play('magic');
        if (chance(0.18) && !d.bubble) say(d, choice(DONUT_BATTLE_QUIPS), 1.6);
        d.cd = Math.max(1.1, 2.3 - hearts * 0.08);
      } else d.cd = 0.3;
    }
  } else if (G.map.outdoor && chance(dt / 40) && !d.bubble) {
    say(d, choice(DONUT_IDLE_QUIPS));
  }
}

function updateMongo(dt) {
  const m = G.mongo;
  if (mongoAlong()) return updateMongoCrawl(m, dt);
  if (G.map.id !== 'farm') return;
  const fm = G.maps.farm;
  m.wanderT -= dt;
  m.moving = false;
  if (m.target) {
    const dx = m.target[0] - m.x, dy = m.target[1] - m.y;
    const d = Math.hypot(dx, dy);
    if (d < 2 || m.stuck > 1) { m.target = null; m.stuck = 0; }
    else {
      const sp = 46 * dt;
      const moved = moveEntity(m, dx / d * sp, dy / d * sp, fm, false);
      if (!moved) m.stuck = (m.stuck || 0) + dt;
      m.dir = dx < 0 ? LEFT : RIGHT;
      m.moving = true;
    }
  } else if (m.wanderT <= 0) {
    m.wanderT = rand(2, 6);
    const P = G.player;
    if (dist(P.x, P.y, m.x, m.y) < 90 && chance(0.4)) m.target = [P.x + rand(-20, 20), P.y + rand(-10, 20)];
    else m.target = [m.home[0] * TILE + rand(-80, 120), m.home[1] * TILE + rand(-30, 90)];
    if (chance(0.15) && !m.bubble) { say(m, choice(['*screech!*', '*chirp*', '*sniff sniff*', '*RAWR*']), 1.5); }
  }
  animate(m, dt);
  if (m.bubble) { m.bubble.t -= dt; if (m.bubble.t <= 0) m.bubble = null; }
}

// Friendship ------------------------------------------------------------------
function friendOf(id) {
  if (!G.friends[id]) G.friends[id] = { pts: 0, talked: false, gifted: false };
  return G.friends[id];
}
function heartsOf(id) { return Math.floor(friendOf(id).pts / 250); }
function addFriend(id, pts) {
  const f = friendOf(id);
  const before = Math.floor(f.pts / 250);
  f.pts = clamp(f.pts + pts, 0, 2500);
  const after = Math.floor(f.pts / 250);
  if (after > before) {
    UI.toast(`${NPC_DEFS[id].name}: ${after} heart${after > 1 ? 's' : ''}!`, null, '#ff8fb0');
    if (after >= 5) unlock('hearts_5');
    const perk = FRIEND_PERKS[id];
    if (perk && perk.hearts > before && perk.hearts <= after) {
      UI.announce('FRIENDSHIP PERK UNLOCKED', `${NPC_DEFS[id].name}: ${perk.text}.`, 'level', 'levelup');
    }
  }
}

function hasPerk(id) {
  const perk = FRIEND_PERKS[id];
  return !!perk && heartsOf(id) >= perk.hearts;
}

// Fraction off at a shop whose keeper is a close enough friend (0 if none).
function shopDiscount(shopId) {
  const keeper = SHOPS[shopId] && SHOPS[shopId].keeper;
  return keeper && hasPerk(keeper) ? FRIEND_PERKS[keeper].discount || 0 : 0;
}

// Mongo's morning present, if he has one for Carl today.
function mongoPresent() {
  if (!hasPerk('mongo') || !chance(0.6)) return null;
  return chance(0.05) ? 'ruby' : choice(FRIEND_PERKS.mongo.presents);
}
