'use strict';
// ---------------------------------------------------------------------------
// Rival crawler: Brock Vantage shows up on some Stairwell cave floors, talks
// trash, and races Carl to the chests and the stairs (his sponsor sold him a
// map, so he knows which rock hides them). Reach the stairs first to win the
// race, or beat him down and he drops everything he grabbed. He lives in
// G.map.monsters as type 'rival', so Donut, Katia, Mongo and bombs can all
// hit him; his record against Carl is kept in G.stats.rival.
// ---------------------------------------------------------------------------

const RIVAL_MIN_LEVEL = 3;
const RIVAL_CHANCE = 0.3;     // per eligible cave floor
const RIVAL_PER_DAY = 2;
const RIVAL_TAUNT = 2.5;      // seconds of trash talk before he starts running
const RIVAL_DIG = 6;          // seconds to break the rock hiding the stairs
const RIVAL_LOOT = 1.2;       // seconds to crack open a chest
const RIVAL_ANGRY = 4;        // seconds he fights back after being hit

function rivalRecord() {
  if (!G.stats.rival) G.stats.rival = { met: 0, raceWins: 0, raceLosses: 0, beaten: 0 };
  return G.stats.rival;
}

function rivalOnFloor(m = G.map) {
  return m && m.monsters ? m.monsters.find(mo => mo.type === 'rival' && !mo.dead) || null : null;
}

function rivalLine(kind, data) {
  const line = choice(RIVAL_LINES[kind]);
  return line.replace(/\{(\w+)\}/g, (_, k) => data && data[k] != null ? data[k] : '');
}

// Called from enterDungeon with the freshly generated floor.
function maybeSpawnRival(m, level) {
  if (m.boss || m.safe || level < RIVAL_MIN_LEVEL) return;
  const f = G.flags;
  if (f.rivalDay !== G.totalDays) { f.rivalDay = G.totalDays; f.rivalToday = 0; }
  if (f.rivalToday >= RIVAL_PER_DAY || f.rivalLastLevel === level - 1 || !chance(RIVAL_CHANCE)) return;
  spawnRival(m, level);
}

function spawnRival(m, level) {
  const f = G.flags, rec = rivalRecord();
  f.rivalDay = G.totalDays;
  f.rivalToday = (f.rivalToday || 0) + 1;
  f.rivalLastLevel = level;
  // he comes down the ladder right behind Carl
  const [x, y] = nearestFree(m, m.spawn.x + 1, m.spawn.y + 1);
  const mo = createMonster('rival', x * TILE + 8, y * TILE + 12, level);
  Object.assign(mo, { state: 'taunt', t: RIVAL_TAUNT, hits: 0, loot: [], path: null, goal: null, repath: 0, stuck: 0, angry: 0, cd: 0 });
  m.monsters.push(mo);
  // a sponsor drop to fight over, if the floor didn't roll a chest
  let hasChest = false;
  for (const o of m.objs.values()) if (o.type === 'chest') { hasChest = true; break; }
  if (!hasChest) {
    const spots = [];
    for (let ty = 2; ty < m.h - 2; ty++) for (let tx = 2; tx < m.w - 2; tx++) {
      if (!isBlocked(m, tx, ty) && !getObj(m, tx, ty) && Math.abs(tx - m.spawn.x) + Math.abs(ty - m.spawn.y) > 9) spots.push([tx, ty]);
    }
    if (spots.length) {
      const [cx, cy] = choice(spots);
      addObj(m, { type: 'chest', x: cx, y: cy, tier: level > 12 && chance(0.5) ? 'silver' : 'bronze' });
    }
  }
  const kind = rec.beaten ? 'arrive_beaten' : rec.met ? 'arrive_again' : 'arrive';
  say(mo, rivalLine(kind, { w: rec.raceWins, l: rec.raceLosses }), RIVAL_TAUNT + 0.5);
  rec.met++;
  if (rec.met === 1) {
    setTimeout(() => UI.system(`ATTENTION CRAWLER! A rival crawler has entered the floor: ${MONSTERS.rival.name}, sponsored by Gnu-Wave Energy Slurry. He is after your chests and your stairs. First crawler down the stairs wins the floor. Beating him up is, technically, allowed.`), 500);
  } else {
    UI.toast(`Rival crawler ${MONSTERS.rival.name} is on this floor!`, null, '#ff9a5a');
  }
  setTimeout(() => donutComment('rival'), 3200);
}

// --- where he's headed -----------------------------------------------------------
// The nearest unopened chest, else the stairs, else the rock hiding them.
function rivalGoal(mo, m) {
  const [rx, ry] = tileOf(mo);
  let best = null, bd = 1e9;
  for (const o of m.objs.values()) {
    if (o.type !== 'chest') continue;
    const d = Math.abs(o.x - rx) + Math.abs(o.y - ry);
    if (d < bd) { bd = d; best = o; }
  }
  if (best) return best;
  for (const o of m.objs.values()) if (o.type === 'stairs') return o;
  for (const o of m.objs.values()) if (o.type === 'boulder' && o.stairs) return o;
  return null;
}

function rivalStep(mo, m, tx, ty, speed, dt) {
  const dx = tx - mo.x, dy = ty - mo.y, d = Math.hypot(dx, dy);
  if (d < 1) return true;
  const sp = Math.min(d, speed * dt);
  const moved = moveEntity(mo, dx / d * sp, dy / d * sp, m, true);
  mo.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
  mo.moving = true;
  mo.stuck = moved ? 0 : mo.stuck + dt;
  return d < 3;
}

function updateRival(mo, dt, dCarl) {
  const m = G.map, P = G.player;
  mo.cd -= dt;
  mo.moving = false;
  if (mo.bubble == null && dCarl < 90 && chance(dt / 9)) say(mo, rivalLine('taunt'), 2);

  if (mo.state === 'taunt') {
    mo.t -= dt;
    mo.dir = P.x < mo.x ? LEFT : RIGHT;
    if (mo.t <= 0) mo.state = 'race';
    animate(mo, dt);
    return;
  }

  // fight back for a few seconds after being hit; otherwise only shove Carl when he's in the way
  if (mo.angry > 0) {
    mo.angry -= dt;
    if (dCarl > 10) rivalStep(mo, m, P.x, P.y, mo.speed * 1.1, dt);
    if (dCarl < 16 && mo.cd <= 0) { mo.cd = 1.1; hurtPlayer(mo.dmg, mo.x, mo.y); }
    animate(mo, dt);
    return;
  }
  if (dCarl < 14 && mo.cd <= 0) {
    mo.cd = 1.6;
    hurtPlayer(Math.max(1, Math.round(mo.dmg / 2)), mo.x, mo.y);
    if (!mo.bubble) say(mo, rivalLine('shove'), 1.6);
  }

  const goal = mo.goal;
  const goalGone = !goal || getObj(m, goal.x, goal.y) !== goal;
  if (goalGone) {
    if (goal && goal.type === 'chest' && dCarl < 100) { say(mo, rivalLine('carl_chest'), 2); donutComment('rival_chest_carl'); }
    mo.goal = rivalGoal(mo, m);
    mo.path = null; mo.state = 'race';
    if (!mo.goal) { animate(mo, dt); return; }
  }

  const o = mo.goal, ox = o.x * TILE + 8, oy = o.y * TILE + 12;
  if (mo.state === 'dig' || mo.state === 'loot') {
    mo.t -= dt;
    mo.dir = Math.abs(ox - mo.x) > Math.abs(oy - mo.y) ? (ox < mo.x ? LEFT : RIGHT) : (oy < mo.y ? UP : DOWN);
    if (mo.state === 'dig' && chance(dt * 6)) { o.shake = 0.2; burst(ox, oy - 4, 2, ['#9a9aa4', '#6a6a74'], 40); if (chance(0.3)) Audio2.play('pick'); }
    if (mo.t > 0) { animate(mo, dt); return; }
    if (mo.state === 'loot') rivalTakeChest(mo, m, o);
    else rivalBreakStairRock(mo, m, o);
    mo.state = 'race'; mo.goal = null; mo.path = null;
    animate(mo, dt);
    return;
  }

  // walking: stairs are stepped on, chests and the rock are worked from next door
  const near = Math.abs(mo.x - ox) + Math.abs(mo.y - oy);
  if (o.type === 'stairs' && near < 6) { rivalWinsRace(mo, m); return; }
  if (o.type !== 'stairs' && near < 20) {
    mo.state = o.type === 'chest' ? 'loot' : 'dig';
    mo.t = o.type === 'chest' ? RIVAL_LOOT : RIVAL_DIG;
    if (o.type !== 'chest') say(mo, rivalLine('dig'), 2.4);
    animate(mo, dt);
    return;
  }
  mo.repath -= dt;
  if (!mo.path || mo.repath <= 0 || mo.stuck > 0.6) {
    const [rx, ry] = tileOf(mo);
    mo.path = findPath(m, rx, ry, o.x, o.y, 6000);
    if (mo.path && o.type !== 'stairs') mo.path.pop(); // stop next to it
    mo.repath = 1.5; mo.stuck = 0;
    if (!mo.path) { // walled in: the sponsor's teleport scroll puts him next to it
      const [fx, fy] = nearestFree(m, o.x, o.y + 1);
      burst(mo.x, mo.y - 6, 8, ['#ff9a5a', '#ffffff'], 60);
      mo.x = fx * TILE + 8; mo.y = fy * TILE + 12;
      mo.path = [];
    }
  }
  const next = mo.path[0];
  if (next) {
    if (rivalStep(mo, m, next[0] * TILE + 8, next[1] * TILE + 12, mo.speed, dt)) mo.path.shift();
  } else rivalStep(mo, m, ox, oy, mo.speed, dt);
  animate(mo, dt);
}

function rivalTakeChest(mo, m, o) {
  removeObj(m, o);
  mo.loot.push(o.tier);
  Audio2.play('lootbox');
  burst(o.x * TILE + 8, o.y * TILE + 6, 14, ['#ff9a5a', '#ffffff'], 80);
  say(mo, rivalLine('chest'), 2.2);
  donutComment('rival_chest');
}

function rivalBreakStairRock(mo, m, o) {
  removeObj(m, o);
  burst(o.x * TILE + 8, o.y * TILE + 10, 10, ['#aaaaaa', '#886644'], 70);
  Audio2.play('break');
  revealStairs(o.x, o.y);
  if (m.stairsFound) UI.toast(`${MONSTERS.rival.name} found the stairs! Beat him there!`, null, '#ff9a5a');
  say(mo, rivalLine('found'), 2.2);
}

function rivalLeave(mo) {
  mo.dead = true;
  burst(mo.x, mo.y - 8, 16, ['#ff9a5a', '#ffe070', '#ffffff'], 90);
}

function rivalWinsRace(mo, m) {
  const rec = rivalRecord();
  rec.raceLosses++;
  rivalLeave(mo);
  Audio2.play('stairs');
  UI.toast(`${MONSTERS.rival.name} beat you down the stairs. "${rivalLine('win')}"`, null, '#ff9a5a');
  donutComment('rival_win');
  recordNews('rival_won');
}

// Called from descend(), before the next floor loads.
function rivalOnCarlDescend() {
  const mo = rivalOnFloor();
  if (!mo) return;
  const rec = rivalRecord();
  rec.raceWins++;
  mo.dead = true;
  const fol = 150 + G.map.level * 20;
  addFollowers(fol, true);
  UI.toast(`You beat ${MONSTERS.rival.name} to the stairs! +${fmtNum(fol)} followers. "${rivalLine('lose')}"`, null, '#ffe070');
  unlock('rival_race');
}

// Called from hurtMonster instead of killMonster: he yields and pays up.
function rivalYield(mo) {
  const rec = rivalRecord();
  rec.beaten++;
  rivalLeave(mo);
  Audio2.play('kill');
  const g = 40 + mo.level * 12;
  G.gold += g;
  floater(mo.x, mo.y - 22, `+${g}g`, '#ffe070', true);
  Audio2.play('coin');
  for (const tier of mo.loot) spawnDrop('box_' + tier, 1, mo.x, mo.y - 4);
  spawnDrop(rec.beaten % 5 === 0 ? 'box_gold' : rec.beaten % 3 === 0 ? 'box_silver' : 'box_bronze', 1, mo.x, mo.y - 4);
  if (chance(0.5)) spawnDrop('hp_potion', 1, mo.x, mo.y - 4);
  gainXP('combat', mo.d.xp);
  addFollowers(300 + mo.level * 40, true);
  UI.toast(`${MONSTERS.rival.name} yields! "${rivalLine('yield', { n: rec.beaten })}"`, null, '#ffe070');
  setTimeout(() => donutComment('rival_beaten'), 1200);
  unlock('rival_beaten');
  if (rec.beaten >= 5) unlock('rival_nemesis');
  recordNews('rival');
}

// Called from hurtMonster when he takes a hit but stays up.
function rivalHurt(mo) {
  mo.hits++;
  mo.angry = RIVAL_ANGRY;
  if (mo.state === 'dig' || mo.state === 'loot') { mo.state = 'race'; mo.path = null; }
  if (!mo.bubble || chance(0.3)) say(mo, rivalLine(mo.hp < mo.maxHp * 0.35 ? 'hurt_low' : 'hurt'), 1.6);
}
