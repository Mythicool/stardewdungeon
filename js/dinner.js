'use strict';
// ---------------------------------------------------------------------------
// Dinner nights: at DINNER_HEARTS hearts Carl can invite Katia, Zev, Mordecai
// or Pook over. The guest waits at the cabin table from 6 PM, Carl serves a
// dish from his bag, and the guest reacts to it in a short scene. Dishes Carl
// cooked himself count double. Each friend comes at most once a week, and
// standing one up costs friendship.
// ---------------------------------------------------------------------------

const DINNER_HEARTS = 2;
const DINNER_GUESTS = ['katia', 'zev', 'mordecai', 'pook'];
const DINNER_START = 1080;        // 6 PM
const DINNER_LAST_INVITE = 1200;  // 8 PM
const DINNER_END = 1320;          // 10 PM
const DINNER_EVERY = 7;           // days before the same friend comes again
const DINNER_SEAT = { map: 'cabin', x: 8, y: 4 };
const DINNER_PTS = { love: 200, like: 130, neutral: 70, hate: -40 };
const DINNER_COOKED_MULT = 2;
const DINNER_STOOD_UP = -80;
const COOKED_DISHES = RECIPES.map(r => r.out).filter(id => ITEMS[id].cat === 'food');

function dinnerToday() {
  const d = G.flags.dinner;
  return d && d.day === G.totalDays ? d : null;
}

function dinnerLast() { return G.flags.dinnerLast || (G.flags.dinnerLast = {}); }

function canInviteToDinner(id) {
  return DINNER_GUESTS.includes(id) && heartsOf(id) >= DINNER_HEARTS && !dinnerToday();
}

function inviteToDinner(npc) {
  const lines = DINNER_LINES[npc.id];
  const last = dinnerLast()[npc.id];
  if (last && G.totalDays - last < DINNER_EVERY) return UI.say(npc.id, lines.tooSoon);
  if (G.time >= DINNER_LAST_INVITE) return UI.say(npc.id, lines.tooLate);
  G.flags.dinner = { id: npc.id, day: G.totalDays, served: false, greeted: false, over: false };
  Audio2.play('coin');
  UI.toast(`${NPC_DEFS[npc.id].name} is coming to dinner at your cabin at 6 PM.`, null, '#ffd0a0');
  return UI.say(npc.id, choice(lines.invite));
}

// Should this friend be at Carl's cabin right now? Guests wait there from 6 PM
// until they're fed, then stay for as long as Carl does.
function atDinner(id) {
  const d = dinnerToday();
  if (!d || d.id !== id || d.over || G.time < DINNER_START || G.time >= DINNER_END) return false;
  if (d.served && G.map.id !== 'cabin') { d.over = true; return false; }
  return true;
}

function dinnerWaiting(npc) {
  const d = dinnerToday();
  return !!d && d.id === npc.id && !d.served && !d.over && G.time >= DINNER_START && G.time < DINNER_END && npc.map === 'cabin' && G.map.id === 'cabin';
}

// One inventory slot per edible dish (crops, fish, forage, food; no seeds or potions).
function dinnerDishes() {
  const seen = new Set(), slots = [];
  G.player.inv.forEach((it, slot) => {
    if (!it || seen.has(it.id)) return;
    const cat = ITEMS[it.id].cat;
    if (!itemEdible(it.id) || cat === 'seed' || cat === 'potion') return;
    seen.add(it.id);
    slots.push(slot);
  });
  return slots;
}

function serveDinnerMenu(npc) {
  const name = NPC_DEFS[npc.id].name;
  const slots = dinnerDishes().slice(0, 7);
  if (!slots.length) return UI.say(null, `You have nothing to serve ${name}. Any food will do: crops, fish, or something you cooked.`);
  const choices = slots.map(slot => {
    const id = G.player.inv[slot].id;
    return { label: `Serve ${ITEMS[id].name}${COOKED_DISHES.includes(id) ? ' (homemade)' : ''}`, fn: () => serveDinner(npc, slot) };
  });
  choices.push({ label: 'Not yet', cancel: true });
  UI.ask(npc.id, `(What will you serve ${name}?)`, choices);
}

function serveDinner(npc, slot) {
  const P = G.player, it = P.inv[slot], d = dinnerToday();
  if (!it || !d) return;
  const id = it.id, def = NPC_DEFS[npc.id], lines = DINNER_LINES[npc.id];
  const boom = id === 'bomberry';
  const kind = boom || def.hate.includes(id) ? 'hate' : def.love.includes(id) ? 'love' : def.like.includes(id) ? 'like' : 'neutral';
  const cooked = COOKED_DISHES.includes(id) && kind !== 'hate';
  const pts = DINNER_PTS[kind] * (cooked ? DINNER_COOKED_MULT : 1);
  removeFromSlot(slot, 1);
  d.served = true;
  d.dish = id;
  dinnerLast()[npc.id] = G.totalDays;
  const counts = G.flags.dinnerCount || (G.flags.dinnerCount = {});
  const n = counts[npc.id] = (counts[npc.id] || 0) + 1;
  const f = friendOf(npc.id);
  if (!f.talked) f.talked = true;
  G.met[npc.id] = true;
  // Carl eats too
  P.energy = Math.min(P.maxEnergy, P.energy + Math.max(0, Math.round((ITEMS[id].energy || 0) / 2)));
  if (boom) {
    burst(npc.x - 10, npc.y - 12, 24, ['#ffa020', '#ffe060', '#444'], 100);
    Audio2.play('boom');
    G.shake = 0.5;
    P.hp = Math.max(1, P.hp - 15);
  } else Audio2.play('eat');

  const scene = [{ who: npc.id, text: lines.dishes[id] || lines[kind] }];
  if (cooked) scene.push({ who: npc.id, text: lines.cooked });
  scene.push({ who: 'donut', text: choice(DINNER_DONUT[cooked ? 'cooked' : kind]) });
  if (kind !== 'hate') {
    const talks = lines.talk.filter(t => t[0] <= heartsOf(npc.id));
    for (const [who, text] of talks[(n - 1) % talks.length][1]) scene.push({ who, text });
  }
  scene.push({ who: npc.id, text: lines.bye });
  UI.dialog(scene, {
    noCancel: true,
    onDone: () => {
      addFriend(npc.id, pts);
      if (pts > 0) burst(npc.x, npc.y - 16, pts >= 260 ? 16 : 8, ['#ff4f8a', '#ffffff', '#ffd23a'], 60);
      Audio2.play(pts > 0 ? 'coin' : 'error');
      const fans = 300 + Math.max(0, pts) * 5 + (boom ? 2000 : 0);
      addFollowers(fans, true);
      UI.announce('EPISODE AIRED: Dinner with ' + def.name, `${ITEMS[id].name} was on the menu${boom ? ', and on the ceiling' : ''}. +${fmtNum(fans)} followers.`, 'level');
      unlock('dinner');
      if (kind === 'love' || cooked) mailOwe(npc.id, 'dinner', ITEMS[id].name);
      if (DINNER_GUESTS.every(g => dinnerLast()[g])) unlock('dinner_all');
    },
  });
}

// Called every ten game minutes: remind Carl when the guest arrives, and send
// them home at 10 PM if nobody fed them.
function dinnerTick(t) {
  const d = dinnerToday();
  if (!d || d.over) return;
  if (t === DINNER_START && !d.served) UI.toast(`${NPC_DEFS[d.id].name} is waiting at your cabin for dinner.`, null, '#ffd0a0');
  if (t >= DINNER_END) dinnerOver();
}

// End of the dinner window (10 PM or bedtime). An unfed guest was stood up.
function dinnerOver() {
  const d = dinnerToday();
  if (!d || d.over) return;
  d.over = true;
  if (d.served) return;
  addFriend(d.id, DINNER_STOOD_UP);
  (G.flags.dinnerGrudge || (G.flags.dinnerGrudge = {}))[d.id] = true;
  UI.toast(`${NPC_DEFS[d.id].name} gave up waiting for dinner and went home.`, null, '#ff9090');
  unlock('dinner_ghost');
}

// The next chat after being stood up is about that.
function dinnerGrudge(id) {
  const g = G.flags.dinnerGrudge;
  if (!g || !g[id]) return null;
  delete g[id];
  return DINNER_LINES[id].stoodUp;
}

// The guest says hello when Carl first walks in on them waiting.
function updateDinner() {
  const d = dinnerToday();
  if (!d || d.served || d.greeted || G.map.id !== 'cabin') return;
  const npc = G.npcs.find(n => n.id === d.id);
  if (!npc || !dinnerWaiting(npc)) return;
  d.greeted = true;
  say(npc, DINNER_LINES[d.id].arrive, 3.5);
}
