'use strict';
// ---------------------------------------------------------------------------
// Party: at PARTY_HEARTS hearts Katia will join Carl for the day. She follows
// him everywhere (behind Donut), punches monsters in the Stairwell, and
// sometimes throws up her shield arm to block half of a hit meant for Carl.
// Mongo has his own pet slot (G.pet), so he can come along with Katia; see the
// bottom of this file.
// ---------------------------------------------------------------------------

const PARTY_HEARTS = 4;
const PARTY_CAN_JOIN = ['katia'];
const PARTY_LAST_INVITE = 1260;  // 9 PM
const PARTY_GO_HOME = 1320;      // 10 PM
const PARTY_LAG = 36;            // trail points behind Carl (Donut uses 18)

function partyMember() {
  return G.party ? G.npcs.find(n => n.id === G.party) || null : null;
}

function canInvite(id) {
  return PARTY_CAN_JOIN.includes(id) && G.party !== id && heartsOf(id) >= PARTY_HEARTS;
}

function inviteToParty(npc) {
  const lines = PARTY_LINES[npc.id];
  if (G.time >= PARTY_LAST_INVITE) return UI.say(npc.id, lines.tooLate);
  G.party = npc.id;
  npc.path = null;
  npc.cd = 1;
  npc.map = G.map.id;
  unlock('party_up');
  Audio2.play('levelup');
  return UI.say(npc.id, choice(lines.join));
}

function leaveParty(say_) {
  const k = partyMember();
  G.party = null;
  if (!k) return;
  k.schedIdx = -1; // walk (or warp) back to wherever her schedule says
  if (say_) say(k, say_, 3);
}

function dismissParty(npc) {
  leaveParty();
  return UI.say(npc.id, choice(PARTY_LINES[npc.id].leave));
}

// Keep a party member next to Carl when he changes maps.
function partyFollowMap(m) {
  const k = partyMember();
  if (!k) return;
  const P = G.player;
  k.map = m.id;
  k.x = P.x - DX[P.dir] * 22; k.y = P.y - DY[P.dir] * 22 + 2;
  k.path = null;
  // the first floor of the day together is worth some friendship
  if (m.level && !G.flags.crawledWith) {
    G.flags.crawledWith = true;
    addFriend(k.id, 40);
  }
}

function nearestMonster(x, y, range) {
  let best = null, bd = range;
  for (const mo of G.map.monsters || []) {
    if (mo.dead) continue;
    const d = dist(x, y, mo.x, mo.y);
    if (d < bd) { bd = d; best = mo; }
  }
  return best;
}

function updatePartyMember(k, dt) {
  const P = G.player, lines = PARTY_LINES[k.id];
  if (G.time >= PARTY_GO_HOME) { leaveParty(lines.late); return; }
  k.map = G.map.id;
  k.cd = (k.cd || 0) - dt;
  // fight: go after whatever is closest to Carl, as long as it's close to him
  const target = G.map.monsters && G.map.monsters.length ? nearestMonster(P.x, P.y, 72) : null;
  let tx, ty;
  if (target) { tx = target.x; ty = target.y + 2; }
  else {
    const trail = P.trail;
    if (trail.length > PARTY_LAG) [tx, ty] = trail[trail.length - 1 - PARTY_LAG];
    else if (dist(k.x, k.y, P.x, P.y) > 34) { tx = P.x; ty = P.y + 10; }
    else { tx = k.x; ty = k.y; }
    if (dist(tx, ty, P.x, P.y) < 22) { // don't crowd Carl
      const ax = k.x - P.x, ay = k.y - P.y, al = Math.hypot(ax, ay) || 1;
      tx = P.x + ax / al * 22; ty = P.y + ay / al * 22;
    }
  }
  const dx = tx - k.x, dy = ty - k.y, dd = Math.hypot(dx, dy);
  k.moving = false;
  if (dist(k.x, k.y, P.x, P.y) > 200) { k.x = P.x; k.y = P.y + 10; }
  else if (dd > (target ? 12 : 3)) {
    const sp = Math.min(dd, (dd > 40 ? 120 : 80) * dt);
    k.x += dx / dd * sp; k.y += dy / dd * sp;
    k.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN);
    k.moving = dd > 5;
  }
  if (target && dd < 18 && k.cd <= 0) {
    k.cd = 1.2;
    hurtMonster(target, 6 + Math.floor(heartsOf(k.id) * 0.8) + Math.floor(P.skills.combat.lv / 2), k.x, k.y, false, k.id);
    if (chance(0.15) && !k.bubble) say(k, choice(lines.fight), 1.6);
  }
  if (!target && G.map.level && chance(dt / 50) && !k.bubble) say(k, choice(lines.idle), 2.2);
  animate(k, dt);
  if (k.bubble) { k.bubble.t -= dt; if (k.bubble.t <= 0) k.bubble = null; }
}

// Called from hurtPlayer: a nearby party member may block half the hit.
function partyShield(dmg, fx, fy) {
  const k = partyMember();
  if (!k || !G.map.level || dist(k.x, k.y, G.player.x, G.player.y) > 44) return dmg;
  if (!chance(0.25 + heartsOf(k.id) * 0.02)) return dmg;
  say(k, choice(PARTY_LINES[k.id].block), 1.4);
  burst((k.x + fx) / 2, (k.y + fy) / 2 - 6, 8, ['#a8d8ff', '#ffffff'], 60);
  floater(k.x, k.y - 22, 'Blocked!', '#a8d8ff');
  return Math.ceil(dmg / 2);
}

// ---------------------------------------------------------------------------
// Mongo: at MONGO_CRAWL_HEARTS hearts Carl can bring him along for the day.
// He trails behind Donut, charges monsters that get close to Carl, and after
// a while on a floor sniffs out the rock hiding the stairs and marks it.
// ---------------------------------------------------------------------------

const MONGO_CRAWL_HEARTS = 3;
const MONGO_LAG = 27;  // trail points behind Carl, between Donut and Katia

function mongoAlong() { return G.pet === 'mongo'; }

function canBringMongo() {
  return !mongoAlong() && heartsOf('mongo') >= MONGO_CRAWL_HEARTS;
}

function bringMongo() {
  const lines = PARTY_LINES.mongo, g = G.mongo;
  if (G.time >= PARTY_LAST_INVITE) return UI.say('mongo', lines.tooLate);
  G.pet = 'mongo';
  Object.assign(g, { map: G.map.id, target: null, cd: 1, charge: null, sniff: null, sniffT: 0 });
  Audio2.play('roar');
  return UI.say('mongo', choice(lines.join));
}

// Back to the farm; he's there waiting the next time Carl walks out.
function sendMongoHome() {
  const g = G.mongo;
  if (!g) return;
  G.pet = null;
  Object.assign(g, { charge: null, sniff: null, back: false, target: null, moving: false });
  // companions walk through things; if he's ended up inside one, pop him home
  const [tx, ty] = tileOf(g);
  if (g.map !== 'farm' || G.map.id !== 'farm' || isBlocked(G.maps.farm, tx, ty)) {
    g.map = 'farm';
    g.x = g.home[0] * TILE + 8; g.y = g.home[1] * TILE + 12;
  }
}

function dismissMongo() {
  sendMongoHome();
  return UI.say('mongo', choice(PARTY_LINES.mongo.leave));
}

// Keep Mongo next to Carl when he changes maps.
function petFollowMap(m) {
  if (!mongoAlong()) return;
  const g = G.mongo, P = G.player;
  Object.assign(g, { map: m.id, charge: null, sniff: null, back: false, sniffT: 0 });
  g.x = P.x - DX[P.dir] * 16 + (DX[P.dir] ? 0 : 8); g.y = P.y - DY[P.dir] * 16 + 4;
  if (m.level) {
    unlock('mongo_crawl');
    if (!G.flags.crawledWithMongo) { G.flags.crawledWithMongo = true; addFriend('mongo', 40); }
  }
}

// The unbroken rock on this floor that hides the stairs, if there is one.
function hiddenStairRock(m) {
  if (!m.level || m.boss || m.safe || m.stairsFound) return null;
  if (m.stairRock === undefined) {
    m.stairRock = null;
    for (const o of m.objs.values()) if (o.type === 'boulder' && o.stairs) { m.stairRock = o; break; }
  }
  const o = m.stairRock;
  return o && getObj(m, o.x, o.y) === o ? o : null;
}

function mongoSniffDelay() { return Math.max(12, 30 - heartsOf('mongo') * 2); }

function updateMongoCrawl(g, dt) {
  const P = G.player, lines = PARTY_LINES.mongo, m = G.map;
  if (G.time >= PARTY_GO_HOME) { sendMongoHome(); UI.toast(lines.late, null, '#ffb070'); return; }
  g.map = m.id;
  g.cd = (g.cd || 0) - dt;
  g.moving = false;

  // decide: charge a monster near Carl, or (when it's quiet) go sniff the stairs
  if (!g.charge) {
    const near = m.monsters && m.monsters.length ? nearestMonster(P.x, P.y, 80) : null;
    if (near && g.cd <= 0 && dist(g.x, g.y, near.x, near.y) < 120) {
      g.sniff = null;
      g.charge = { mo: near, t: 0.9 };
      if (!g.bubble && chance(0.35)) say(g, choice(lines.charge), 1.2);
      if (chance(0.4)) Audio2.play('roar');
    } else if (!near && !g.sniff) {
      const rock = hiddenStairRock(m);
      if (rock && !rock.sniffed) {
        g.sniffT = (g.sniffT || 0) + dt;
        if (g.sniffT >= mongoSniffDelay()) g.sniff = { o: rock, t: 0 };
      }
    }
  }

  let tx = g.x, ty = g.y, speed = 0;
  if (g.charge) {
    // a short, fast dash at one monster; the hit knocks it away from Mongo
    const mo = g.charge.mo;
    g.charge.t -= dt;
    if (mo.dead || g.charge.t <= 0) { g.charge = null; g.cd = 0.6; }
    else if (dist(g.x, g.y, mo.x, mo.y) < 12) {
      hurtMonster(mo, 7 + heartsOf('mongo') + Math.floor(P.skills.combat.lv / 2), g.x, g.y, false, 'mongo');
      burst(g.x, g.y - 2, 6, ['#c8b090', '#8a7050'], 50);
      g.charge = null;
      g.cd = Math.max(1.6, 3 - heartsOf('mongo') * 0.1);
    } else { tx = mo.x; ty = mo.y; speed = 190; }
  } else if (g.sniff) {
    const o = g.sniff.o, rx = o.x * TILE + 8, ry = o.y * TILE + 20;
    if (o.sniffed || m.stairsFound || getObj(m, o.x, o.y) !== o) g.sniff = null;
    else if (dist(g.x, g.y, rx, ry) > 4) { tx = rx; ty = ry; speed = 110; }
    else {
      if (!g.sniff.t) say(g, choice(lines.sniff), 1.4);
      g.sniff.t += dt;
      if (g.sniff.t >= 1.4) {
        o.sniffed = true;
        g.sniff = null;
        g.back = true; // run back to Carl instead of popping over to him
        say(g, choice(lines.found), 2);
        UI.toast('Mongo sniffed out the stairs! Look for the paw print.', null, '#ffd23a');
        Audio2.play('roar');
        burst(rx, ry - 18, 10, ['#ffd23a', '#ffffff'], 50);
        floater(rx, ry - 26, 'Sniff!', '#ffd23a');
        unlock('good_nose');
        donutComment('sniff');
      }
    }
  } else {
    // follow Carl's trail like Donut, a step further back
    const trail = P.trail;
    if (trail.length > MONGO_LAG) [tx, ty] = trail[trail.length - 1 - MONGO_LAG];
    else if (dist(g.x, g.y, P.x, P.y) > 30) { tx = P.x; ty = P.y + 8; }
    if (dist(tx, ty, P.x, P.y) < 20) { // don't crowd Carl
      const ax = g.x - P.x, ay = g.y - P.y, al = Math.hypot(ax, ay) || 1;
      tx = P.x + ax / al * 20; ty = P.y + ay / al * 20;
    }
    speed = g.back ? 150 : dist(g.x, g.y, tx, ty) > 40 ? 125 : 85;
    if (m.level && !g.bubble && chance(dt / 45)) say(g, choice(lines.idle), 1.6);
  }

  const dx = tx - g.x, dy = ty - g.y, dd = Math.hypot(dx, dy);
  const fromCarl = dist(g.x, g.y, P.x, P.y);
  if (g.back && fromCarl < 60) g.back = false;
  if (fromCarl > (g.sniff || g.back ? 480 : 200)) { g.x = P.x; g.y = P.y + 8; g.charge = g.sniff = null; g.back = false; }
  else if (speed && dd > 3) {
    const sp = Math.min(dd, speed * dt);
    g.x += dx / dd * sp; g.y += dy / dd * sp;
    if (Math.abs(dx) > 1) g.dir = dx < 0 ? LEFT : RIGHT;
    g.moving = dd > 5;
    if (g.charge && chance(dt * 20)) G.particles.push({ x: g.x + rand(-3, 3), y: g.y, vx: rand(-20, 20), vy: rand(-20, -5), life: 0.35, max: 0.35, color: '#a89070', size: 1, grav: 0 });
  }
  animate(g, dt);
  if (g.bubble) { g.bubble.t -= dt; if (g.bubble.t <= 0) g.bubble = null; }
}
