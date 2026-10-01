'use strict';
// ---------------------------------------------------------------------------
// Party: at PARTY_HEARTS hearts Katia will join Carl for the day. She follows
// him everywhere (behind Donut), punches monsters in the Stairwell, and
// sometimes throws up her shield arm to block half of a hit meant for Carl.
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
    hurtMonster(target, 6 + Math.floor(heartsOf(k.id) * 0.8) + Math.floor(P.skills.combat.lv / 2), k.x, k.y, false);
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
