'use strict';
// ---------------------------------------------------------------------------
// Monsters, bosses, projectiles, bombs, item drops, particles, floaters.
// ---------------------------------------------------------------------------

function createMonster(type, x, y, level) {
  const d = MONSTERS[type];
  const hs = 1 + (level - 1) * 0.07, ds = 1 + (level - 1) * 0.045;
  const boss = !!d.boss;
  return {
    type, d, x, y, level,
    hp: Math.round(d.hp * (boss ? 1 : hs)), maxHp: Math.round(d.hp * (boss ? 1 : hs)),
    dmg: Math.round(d.dmg * (boss ? 1 : ds)), speed: d.speed,
    hw: boss ? (type === 'krakaren' ? 38 : 10) : 5, hh: boss ? (type === 'krakaren' ? 26 : 10) : 5,
    dir: RIGHT, state: 'idle', t: rand(0, 2), atk: rand(1, 3), vx: 0, vy: 0,
    hurtT: 0, kx: 0, ky: 0, animT: 0, frame: 0, moving: false, aggro: false,
    summonT: 5, throwT: 3, slamT: 2.5, spawnT: 8, bob: rand(0, 6),
  };
}

function monsterBox(mo) { return { x: mo.x - mo.hw, y: mo.y - mo.hh * 2, w: mo.hw * 2, h: mo.hh * 2 }; }
function boxesOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function updateMonsters(dt) {
  const m = G.map;
  if (!m.monsters) return;
  const P = G.player;
  for (const mo of m.monsters) {
    if (mo.dead) continue;
    mo.bob += dt;
    const dx = P.x - mo.x, dy = (P.y - 4) - (mo.y - 4);
    const d = Math.hypot(dx, dy) || 1;
    if (d < mo.d.aggro) mo.aggro = true;
    if (mo.hurtT > 0) {
      mo.hurtT -= dt;
      if (mo.d.boss) { /* bosses don't get knocked back */ }
      else moveEntity(mo, mo.kx * dt, mo.ky * dt, m, false);
      mo.kx *= 0.85; mo.ky *= 0.85;
      continue;
    }
    mo.moving = false;
    const ghost = mo.d.ghost;
    const step = (vx, vy) => {
      if (ghost) { mo.x = clamp(mo.x + vx, 16, m.w * TILE - 16); mo.y = clamp(mo.y + vy, 16, m.h * TILE - 8); return true; }
      return moveEntity(mo, vx, vy, m, true);
    };
    if (mo.type === 'krakaren') { updateKrakaren(mo, dt, d); continue; }
    if (mo.type === 'hoarder') updateHoarder(mo, dt, d);

    if (mo.type === 'tuskling' && mo.aggro) {
      if (mo.state === 'windup') {
        mo.t -= dt;
        if (mo.t <= 0) { mo.state = 'charge'; mo.t = 0.7; }
      } else if (mo.state === 'charge') {
        mo.t -= dt;
        mo.moving = true;
        if (!step(mo.vx * dt, mo.vy * dt) || mo.t <= 0) { mo.state = 'rest'; mo.t = 1.0; }
      } else if (mo.state === 'rest') {
        mo.t -= dt; if (mo.t <= 0) mo.state = 'idle';
      } else {
        if (d < 100) {
          mo.state = 'windup'; mo.t = 0.55;
          mo.vx = dx / d * mo.d.charge; mo.vy = dy / d * mo.d.charge;
          mo.dir = dx < 0 ? LEFT : RIGHT;
        } else { step(dx / d * mo.speed * dt, dy / d * mo.speed * dt); mo.moving = true; mo.dir = dx < 0 ? LEFT : RIGHT; }
      }
    } else if (mo.type === 'hobgoblin' && mo.aggro) {
      mo.atk -= dt;
      let mvx = 0, mvy = 0;
      if (d > 110) { mvx = dx / d; mvy = dy / d; }
      else if (d < 60) { mvx = -dx / d; mvy = -dy / d; }
      if (mvx || mvy) { step(mvx * mo.speed * dt, mvy * mo.speed * dt); mo.moving = true; }
      mo.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
      if (mo.atk <= 0 && d < 180) {
        mo.atk = rand(1.8, 2.8);
        const sp = 105;
        G.projectiles.push({ kind: 'bomblet', x: mo.x, y: mo.y - 10, vx: dx / d * sp, vy: dy / d * sp, dmg: mo.dmg, friendly: false, life: 2.2, spin: 0 });
        Audio2.play('shoot');
      }
    } else if (mo.aggro) {
      const sp = mo.speed * (mo.type === 'hoarder' && mo.hp < mo.maxHp / 2 ? 1.6 : 1);
      if (d > 6) { step(dx / d * sp * dt, dy / d * sp * dt); mo.moving = true; }
      mo.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
    } else {
      mo.t -= dt;
      if (mo.t <= 0) { mo.t = rand(1, 3); const a = rand(0, Math.PI * 2); mo.vx = Math.cos(a) * mo.speed * 0.4; mo.vy = Math.sin(a) * mo.speed * 0.4; if (chance(0.4)) { mo.vx = 0; mo.vy = 0; } }
      if (mo.vx || mo.vy) { step(mo.vx * dt, mo.vy * dt); mo.moving = true; mo.dir = mo.vx < 0 ? LEFT : RIGHT; }
    }
    animate(mo, dt);
    // contact damage
    const reach = mo.d.boss ? 22 : 11;
    if (Math.abs(dx) < reach && Math.abs(P.y - mo.y) < reach) hurtPlayer(mo.dmg, mo.x, mo.y);
  }
  m.monsters = m.monsters.filter(mo => !mo.dead);
}

function updateHoarder(mo, dt, d) {
  const m = G.map, P = G.player;
  mo.summonT -= dt; mo.throwT -= dt;
  const cats = m.monsters.filter(x => x.type === 'feralcat' && !x.dead).length;
  if (mo.summonT <= 0) {
    mo.summonT = mo.hp < mo.maxHp / 2 ? 5 : 7.5;
    if (cats < 8) {
      for (let i = 0; i < 3; i++) {
        const c = createMonster('feralcat', mo.x + rand(-20, 20), mo.y + rand(-6, 14), mo.level);
        c.aggro = true;
        if (!boxBlocked(m, c.x, c.y, c.hw, c.hh)) m.monsters.push(c);
      }
      say(mo, choice(['My babies!', 'Get him, sweeties!', 'MINE! All MINE!', "Don't touch my things!"]), 2);
      if (chance(0.5)) say(G.donut, choice(['Those are NOT real cats, Carl.', 'Ugh. Knockoffs.', 'I am OFFENDED.']), 2);
      Audio2.play('meow');
    }
  }
  if (mo.throwT <= 0 && d < 200) {
    mo.throwT = mo.hp < mo.maxHp / 2 ? 2 : 3;
    const a0 = Math.atan2(P.y - mo.y, P.x - mo.x);
    for (const off of [-0.35, 0, 0.35]) {
      G.projectiles.push({ kind: 'trash', x: mo.x, y: mo.y - 16, vx: Math.cos(a0 + off) * 95, vy: Math.sin(a0 + off) * 95, dmg: 9, friendly: false, life: 2.5, spin: 0 });
    }
    Audio2.play('shoot');
  }
}

function updateKrakaren(mo, dt, d) {
  const m = G.map, P = G.player;
  mo.aggro = true;
  mo.slamT -= dt; mo.spawnT -= dt;
  const enraged = mo.hp < mo.maxHp / 2;
  if (mo.slamT <= 0) {
    mo.slamT = enraged ? 1.6 : 2.3;
    const n = enraged ? 3 : 2;
    G.hazards.push({ x: P.x, y: P.y - 4, r: 20, t: 0.9, max: 0.9, dmg: mo.dmg });
    for (let i = 1; i < n; i++) G.hazards.push({ x: P.x + rand(-60, 60), y: P.y + rand(-40, 40), r: 20, t: 0.9 + i * 0.15, max: 0.9 + i * 0.15, dmg: mo.dmg });
  }
  if (mo.spawnT <= 0) {
    mo.spawnT = enraged ? 7 : 10;
    if (m.monsters.length < 7) {
      for (let i = 0; i < 2; i++) {
        const c = createMonster(chance(0.5) ? 'shade' : 'rat', mo.x + (i ? 50 : -50), mo.y + 30, mo.level);
        c.aggro = true; m.monsters.push(c);
      }
      say(mo, choice(['*GLORP*', '*wet tentacle noises*', 'SKREEEE!']), 1.8);
    }
  }
  if (Math.abs(P.x - mo.x) < mo.hw + 4 && P.y - 4 > mo.y - mo.hh * 2 && P.y - 4 < mo.y + 6) hurtPlayer(mo.dmg, mo.x, mo.y);
}

function hurtMonster(mo, dmg, fx, fy, crit) {
  if (mo.dead) return;
  mo.hp -= dmg;
  mo.aggro = true;
  const a = Math.atan2(mo.y - fy, mo.x - fx);
  mo.kx = Math.cos(a) * 220; mo.ky = Math.sin(a) * 220;
  mo.hurtT = mo.d.boss ? 0.08 : 0.22;
  if (mo.state === 'charge' || mo.state === 'windup') mo.state = 'rest', mo.t = 0.6;
  floater(mo.x, mo.y - (mo.d.boss ? 36 : 18), String(dmg), crit ? '#ffe040' : '#ffffff', crit);
  Audio2.play('hit');
  burst(mo.x, mo.y - 6, 5, ['#ffffff', '#ff6060'], 60);
  if (mo.hp <= 0) killMonster(mo);
}

function killMonster(mo) {
  mo.dead = true;
  const m = G.map;
  Audio2.play('kill');
  burst(mo.x, mo.y - 6, 14, ['#ffffff', '#ffd040', '#ff6060'], 90);
  for (const [id, p] of mo.d.drops) if (Math.random() < p) spawnDrop(id, 1, mo.x, mo.y - 4);
  if (!mo.d.boss && chance(0.08)) spawnDrop(chance(0.5) ? 'coal' : 'copper', 1, mo.x, mo.y - 4);
  gainXP('combat', mo.d.xp);
  G.stats.kills[mo.type] = (G.stats.kills[mo.type] || 0) + 1;
  G.stats.totalKills++;
  addFollowers(mo.d.boss ? 0 : 5 + mo.level * 2, true);
  unlock('first_kill');
  if ((G.stats.kills.rat || 0) >= 10) unlock('rat_10');
  if (G.stats.totalKills >= 100) unlock('kills_100');
  if (G.quest && G.quest.type === 'slay' && G.quest.mon === mo.type && G.quest.progress < G.quest.n) {
    G.quest.progress++;
    if (G.quest.progress >= G.quest.n) UI.toast('Request complete! Report to the board.', null, '#ffe070');
  }
  if (mo.d.boss) onBossKilled(mo);
  else if (!m.boss && !m.safe && m.monsters.every(x => x.dead) && !m.stairsFound) {
    revealStairs(Math.floor(mo.x / TILE), Math.floor((mo.y - 3) / TILE));
    UI.toast('The level is clear! A stairwell appears.', null, '#ffe070');
  }
}

function onBossKilled(mo) {
  const m = G.map;
  G.stats.bosses[mo.type] = true;
  for (const x of m.monsters) if (!x.d.boss && !x.dead) { x.dead = true; burst(x.x, x.y - 6, 8, ['#ffffff'], 60); }
  G.shake = 1.2;
  Audio2.play('boom');
  const cx = Math.floor(m.w / 2), cy = Math.floor(m.h / 2);
  const [sx, sy] = nearestFree(m, cx, cy + 1);
  addObj(m, { type: 'stairs', x: sx, y: sy });
  m.stairsFound = true;
  const [chx, chy] = nearestFree(m, cx + 2, cy + 1);
  addObj(m, { type: 'chest', x: chx, y: chy, tier: 'gold' });
  m.boss = null;
  unlock(mo.type);
  addFollowers(mo.type === 'hoarder' ? 25000 : 100000);
  Music.play('dungeon');
  setTimeout(() => {
    if (mo.type === 'hoarder') {
      UI.system(`ATTENTION CRAWLERS! The Neighborhood Boss known as THE HOARDER has been defeated by Crawler Carl and Princess Donut! Her 'cats' have been released. They're somebody else's problem now. Now get out there and kill, kill, kill!`);
    } else {
      UI.system(`ATTENTION CRAWLERS! The Borough Boss KRAKAREN CLONE has been defeated! The original Krakaren has been notified and is reportedly 'extremely moist with rage.' Well done, Crawler. Now get out there and kill, kill, kill!`);
    }
  }, 900);
}

function revealStairs(tx, ty) {
  const m = G.map;
  if (m.stairsFound) return;
  let spot = null;
  for (let r = 0; r < 8 && !spot; r++) for (let j = -r; j <= r && !spot; j++) for (let i = -r; i <= r && !spot; i++) {
    const x = tx + i, y = ty + j;
    if (!isBlocked(m, x, y) && !getObj(m, x, y)) spot = [x, y];
  }
  if (!spot) spot = nearestFree(m, tx, ty);
  const [x, y] = spot;
  const o = getObj(m, x, y);
  if (o && o.type !== 'ladder') removeObj(m, o);
  if (o && o.type === 'ladder') return;
  addObj(m, { type: 'stairs', x, y });
  m.stairsFound = true;
}

function hurtPlayer(dmg, fx, fy) {
  const P = G.player;
  if (P.hurtT > 0 || G.modals.length || G.transition) return;
  dmg = partyShield(dmg, fx, fy);
  P.hp -= dmg;
  P.hurtT = 1.0;
  const a = Math.atan2(P.y - fy, P.x - fx);
  P.kx = Math.cos(a) * 180; P.ky = Math.sin(a) * 180;
  floater(P.x, P.y - 20, '-' + dmg, '#ff5050');
  Audio2.play('hurt');
  G.shake = Math.max(G.shake, 0.25);
  if (P.hp <= 0) playerDie();
}

// --- player kick ---------------------------------------------------------------
function playerKick() {
  const P = G.player;
  const w = ITEMS[selectedItem() ? selectedItem().id : 'foot'];
  const base = (w && w.dmg) || 6;
  const cx = P.x + DX[P.dir] * 13, cy = P.y - 6 + DY[P.dir] * 12;
  const hb = { x: cx - 12, y: cy - 12, w: 24, h: 24 };
  let hit = false;
  if (G.map.monsters) {
    for (const mo of G.map.monsters) {
      if (mo.dead) continue;
      if (boxesOverlap(hb, monsterBox(mo))) {
        const crit = chance(0.08);
        const dmg = (base + P.skills.combat.lv + randi(0, 3)) * (crit ? 2 : 1);
        hurtMonster(mo, dmg, P.x, P.y, crit);
        hit = true;
      }
    }
  }
  return hit;
}

// --- projectiles ---------------------------------------------------------------
function updateProjectiles(dt) {
  const P = G.player, m = G.map;
  for (const p of G.projectiles) {
    p.life -= dt;
    if (p.kind === 'missile') {
      if (p.target && !p.target.dead) {
        const tx = p.target.x, ty = p.target.y - (p.target.d.boss ? 16 : 6);
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
        p.vx = lerp(p.vx, dx / d * 190, Math.min(1, dt * 7));
        p.vy = lerp(p.vy, dy / d * 190, Math.min(1, dt * 7));
        if (d < 8 + (p.target.d.boss ? p.target.hw * 0.6 : 0)) { hurtMonster(p.target, p.dmg, p.x, p.y, false); p.life = 0; burst(p.x, p.y, 8, ['#e080ff', '#ffffff'], 60); }
      } else p.life = Math.min(p.life, 0.2);
      if (chance(0.7)) G.particles.push({ x: p.x, y: p.y, vx: rand(-10, 10), vy: rand(-10, 10), life: 0.35, max: 0.35, color: choice(['#e080ff', '#b060ff', '#ffffff']), size: 1 });
    } else {
      p.spin += dt * 12;
      if (!p.friendly && Math.abs(p.x - P.x) < 7 && Math.abs(p.y - (P.y - 6)) < 9) {
        hurtPlayer(p.dmg, p.x, p.y); p.life = 0;
        if (p.kind === 'bomblet') { burst(p.x, p.y, 10, ['#ffa020', '#ffe060', '#444'], 70); Audio2.play('break'); }
      }
      const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
      if (gAt(m, tx, ty) === T.WALL) { p.life = 0; burst(p.x, p.y, 5, ['#888', '#aaa'], 40); }
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  G.projectiles = G.projectiles.filter(p => p.life > 0);

  for (const h of G.hazards) {
    h.t -= dt;
    if (h.t <= 0 && !h.done) {
      h.done = true;
      burst(h.x, h.y, 16, ['#c04a7a', '#ff9ac8', '#4a88d8'], 90);
      Audio2.play('break');
      G.shake = Math.max(G.shake, 0.35);
      if (dist(h.x, h.y, P.x, P.y - 4) < h.r + 4) hurtPlayer(h.dmg, h.x, h.y);
    }
  }
  G.hazards = G.hazards.filter(h => h.t > -0.3);
}

// --- bombs -------------------------------------------------------------------------
function placeBomb(tx, ty, mega) {
  G.bombs.push({ x: tx * TILE + 8, y: ty * TILE + 10, fuse: 1.8, mega, tx, ty });
  Audio2.play('fuse');
  if (!G.flags.bombTip) { G.flags.bombTip = true; UI.toast('RUN!', null, '#ff8040'); }
}
function updateBombs(dt) {
  for (const b of G.bombs) {
    b.fuse -= dt;
    if (Math.random() < 0.5) G.particles.push({ x: b.x + 1, y: b.y - (b.mega ? 14 : 11), vx: rand(-15, 15), vy: rand(-30, -5), life: 0.3, max: 0.3, color: choice(['#ffa020', '#ffe060']), size: 1 });
    if (b.fuse <= 0) explode(b);
  }
  G.bombs = G.bombs.filter(b => b.fuse > 0);
}
function explode(b) {
  const m = G.map, P = G.player;
  const def = ITEMS[b.mega ? 'megabomb' : 'bomb'];
  const R = def.radius;
  Audio2.play('boom');
  G.shake = b.mega ? 1.4 : 0.8;
  burst(b.x, b.y - 4, b.mega ? 70 : 36, ['#ffa020', '#ffe060', '#ff4020', '#444', '#888'], b.mega ? 220 : 150, 2);
  G.flashes.push({ x: b.x, y: b.y, r: R * TILE * 1.3, t: 0.3 });
  G.stats.bombs++;
  unlock('bomb_first');
  const r = Math.ceil(R);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (i * i + j * j > R * R) continue;
    const x = b.tx + i, y = b.ty + j;
    const o = getObj(m, x, y);
    if (!o) continue;
    if (['boulder', 'stone', 'weed', 'twig', 'crate', 'stump', 'withered'].includes(o.type)) breakObject(m, o, true);
  }
  if (m.monsters) for (const mo of m.monsters) {
    if (mo.dead) continue;
    const d = dist(mo.x, mo.y - 4, b.x, b.y);
    if (d < R * TILE + mo.hw) hurtMonster(mo, Math.round(def.dmg * (1 - 0.4 * d / (R * TILE + mo.hw))), b.x, b.y, false);
  }
  const pd = dist(P.x, P.y - 4, b.x, b.y);
  if (pd < R * TILE) {
    P.hurtT = 0;
    hurtPlayer(Math.round(def.dmg * 0.35), b.x, b.y);
    unlock('self_own');
  }
}

// --- item drops ---------------------------------------------------------------------
function spawnDrop(id, n, x, y) {
  G.drops.push({ id, n, x: x + rand(-4, 4), y: y + rand(-2, 4), z: 2, vz: rand(50, 80), vx: rand(-35, 35), vy: rand(-20, 25), t: 0 });
}
function updateDrops(dt) {
  const P = G.player;
  for (const d of G.drops) {
    d.t += dt;
    if (d.z > 0 || d.vz > 0) {
      d.vz -= 260 * dt; d.z += d.vz * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.z <= 0) { d.z = 0; d.vz = d.vz < -30 ? -d.vz * 0.35 : 0; d.vx *= 0.5; d.vy *= 0.5; }
    }
    if (d.t > 0.45) {
      const dd = dist(d.x, d.y, P.x, P.y - 4);
      if (dd < 44 && !d.full) {
        const sp = (160 + (44 - dd) * 6) * dt;
        d.x += (P.x - d.x) / dd * Math.min(sp, dd);
        d.y += (P.y - 4 - d.y) / dd * Math.min(sp, dd);
      }
      if (dd < 7) {
        const left = addItem(d.id, d.n);
        if (left < d.n) {
          UI.toast(`+${d.n - left} ${ITEMS[d.id].name}`, d.id);
          Audio2.play('pickup');
        }
        if (left > 0) { d.n = left; d.full = true; d.t = -2; if (!G.flags.fullWarn) { UI.toast('Inventory full!', null, '#ff8080'); } }
        else d.gone = true;
      }
    }
    if (d.full && d.t > 0) d.full = false;
  }
  G.drops = G.drops.filter(d => !d.gone);
}

// --- particles & floaters -------------------------------------------------------------
function burst(x, y, n, colors, speed, size = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(speed * 0.3, speed);
    G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rand(0.3, 0.7), max: 0.7, color: choice(colors), size: randi(1, size + 1), grav: 120 });
  }
}
function floater(x, y, text, color, big) {
  G.floaters.push({ x, y, text, color, t: 0, big: !!big });
}
function updateEffects(dt) {
  for (const p of G.particles) {
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.grav) p.vy += p.grav * dt;
    p.vx *= 0.97;
  }
  G.particles = G.particles.filter(p => p.life > 0);
  for (const f of G.floaters) { f.t += dt; f.y -= 22 * dt; }
  G.floaters = G.floaters.filter(f => f.t < 0.9);
  for (const f of G.flashes) f.t -= dt;
  G.flashes = G.flashes.filter(f => f.t > 0);
  G.shake = Math.max(0, G.shake - dt * 2.5);
}
