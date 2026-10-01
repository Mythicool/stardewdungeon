'use strict';
// ---------------------------------------------------------------------------
// Core: global state, main loop, player control, time, days, save/load.
// ---------------------------------------------------------------------------

const SAVE_KEY = 'carlcraft_save_v1';
const SETTINGS_KEY = 'carlcraft_settings_v1';
const SEC_PER_TEN_MIN = 7;

let G = null;
let canvas, ctx;

function freshState() {
  return {
    screen: 'title',
    modals: [], transition: null,
    day: 1, season: 0, year: 1, time: DAY_START, timeAcc: 0, totalDays: 1,
    weather: 'sun', tomorrowWeather: 'sun',
    gold: 500, followers: 0,
    maps: {}, map: null, player: null, npcs: [], donut: null, mongo: null,
    projectiles: [], drops: [], particles: [], floaters: [], bombs: [], hazards: [], flashes: [],
    shipping: [],
    stats: { planted: 0, watered: 0, harvested: 0, shippedCount: 0, earned: 0, deepest: 0, kills: {}, totalKills: 0, bosses: {}, rocks: 0, fish: 0, bombs: 0, died: 0 },
    achievements: {}, friends: {}, met: {}, knownLoves: {}, seenLines: {}, lineIdx: {},
    heartEvents: {}, heartEventDay: 0,
    recipes: RECIPES.filter(r => r.known).map(r => r.id),
    quest: null, boardOffer: null, mainQuest: 0,
    expressFloors: [1],
    party: null, pet: null,
    flags: {},
    zoom: 4, cam: { x: 0, y: 0, w: 1, h: 1 }, shake: 0, locT: 0,
    mouseMode: false, ending: false, questCheckT: 0,
  };
}

// ---------------------------------------------------------------------------
function init() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  G = freshState();
  Input.init(canvas);
  loadSettings();
  resize();
  window.addEventListener('resize', resize);
  canvas.focus();
  Music.play('title');
  let last = performance.now();
  const frame = now => {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    try { tick(dt); }
    catch (e) { console.error(e); showError(e); }
    Input.endFrame();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

let lastError = null;
function showError(e) { lastError = String(e && e.stack || e).split('\n').slice(0, 3).join(' | '); }

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  UI.resize(canvas.width, canvas.height);
  G.zoom = clamp(Math.round(canvas.width / (22 * TILE)), 2, 6);
  if (canvas.height / G.zoom < 11 * TILE) G.zoom = Math.max(2, Math.floor(canvas.height / (11 * TILE)));
}

function tick(dt) {
  const W = canvas.width, H = canvas.height;
  UI.hoverText = null; UI.hoverItem = null;
  if (Input.wasPressed('KeyM') && !(UI.top() instanceof GameMenu)) { Audio2.unlock(); Audio2.setMusic(!Audio2.musicOn); saveSettings(); UI.toast('Music ' + (Audio2.musicOn ? 'on' : 'off'), null, '#c0b0ff'); }
  UI.update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (G.screen === 'title') {
    Title.update(dt);
    Title.draw(ctx, W, H);
    drawModals(ctx);
    drawAnnouncement(ctx);
    return;
  }
  update(dt);
  render(dt);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  if (G.transition) {
    const tr = G.transition;
    tr.t += dt;
    if (tr.phase === 'out' && tr.t >= tr.dur) { tr.phase = 'in'; tr.t = 0; tr.fn(); }
    else if (tr.phase === 'in' && tr.t >= tr.dur) G.transition = null;
    updateEffects(dt);
    return;
  }
  const top = UI.top();
  if (top) { top.update(dt); return; }

  // time
  G.timeAcc += dt;
  while (G.timeAcc >= SEC_PER_TEN_MIN) {
    G.timeAcc -= SEC_PER_TEN_MIN;
    G.time += 10;
    onTimeTick();
    if (G.ending) return;
  }
  G.locT = Math.max(0, G.locT - dt);

  updatePlayer(dt);
  if (G.ending || G.transition || G.modals.length) return;
  for (const n of G.npcs) updateNPC(n, dt);
  if (G.map.localNpcs) for (const n of G.map.localNpcs) updateNPC(n, dt);
  updateDonut(dt);
  updateMongo(dt);
  updateBanter(dt);
  updateCommentary(dt);
  updateDinner();
  updateMonsters(dt);
  updateProjectiles(dt);
  updateBombs(dt);
  updateDrops(dt);
  updateEffects(dt);

  G.questCheckT -= dt;
  if (G.questCheckT <= 0) { G.questCheckT = 0.5; checkMainQuest(); if (G.time >= 1500) unlock('night_owl'); }
}

function updatePlayer(dt) {
  const P = G.player, m = G.map;
  P.hurtT = Math.max(0, P.hurtT - dt);
  P.kickCd -= dt;
  if (P.swingT > 0) P.swingT -= dt;
  if (Math.abs(P.kx) + Math.abs(P.ky) > 4) {
    moveEntity(P, P.kx * dt, P.ky * dt, m, false);
    P.kx *= Math.pow(0.02, dt); P.ky *= Math.pow(0.02, dt);
  } else { P.kx = 0; P.ky = 0; }

  let mx = 0, my = 0;
  if (Input.isDown('KeyW', 'ArrowUp')) my -= 1;
  if (Input.isDown('KeyS', 'ArrowDown')) my += 1;
  if (Input.isDown('KeyA', 'ArrowLeft')) mx -= 1;
  if (Input.isDown('KeyD', 'ArrowRight')) mx += 1;
  if (mx || my) G.mouseMode = false;
  if (Input.mouse.moved) G.mouseMode = true;
  if (P.swingT > 0) { mx = 0; my = 0; }
  P.moving = false;
  if (mx || my) {
    const len = Math.hypot(mx, my);
    const sp = P.speed * (P.energy <= 0 ? 0.65 : 1) * dt;
    const ox = P.x, oy = P.y;
    moveEntity(P, mx / len * sp, my / len * sp, m, !(mx && my));
    if (my) P.dir = my < 0 ? UP : DOWN;
    if (mx) P.dir = mx < 0 ? LEFT : RIGHT;
    P.moving = true;
    if (Math.abs(P.x - ox) + Math.abs(P.y - oy) > 0.01) {
      const last = P.trail[P.trail.length - 1];
      if (!last || Math.abs(last[0] - P.x) + Math.abs(last[1] - P.y) > 1.5) {
        P.trail.push([P.x, P.y + 2]);
        if (P.trail.length > 60) P.trail.shift();
      }
    }
  }
  animate(P, dt);

  // hotbar
  for (let i = 0; i < 10; i++) if (Input.wasPressed('Digit' + ((i + 1) % 10))) P.sel = i;
  if (Input.mouse.wheel) P.sel = ((P.sel + Input.mouse.wheel) % 10 + 10) % 10;
  let hotbarClick = false;
  if (Input.mouse.leftPressed) {
    for (let i = 0; i < 10; i++) if (pointInRect(Input.mouse.x, Input.mouse.y, hotbarRect(i))) { P.sel = i; hotbarClick = true; Audio2.play('menu'); }
    G.hotbarHold = hotbarClick;
  }
  if (!Input.mouse.left) G.hotbarHold = false;

  if (Input.wasPressed(...KEY_MENU, 'Escape')) { Audio2.play('open'); UI.push(new GameMenu(0)); return; }
  if (Input.wasPressed('KeyF', 'Enter') || Input.mouse.rightPressed) { interact(Input.mouse.rightPressed); if (G.modals.length || G.transition) return; }
  const useKey = Input.wasPressed('Space');
  const useClick = Input.mouse.leftPressed && !hotbarClick;
  if (useKey || useClick) useSelected(useClick);
  else if ((Input.isDown('Space') || (Input.mouse.left && !G.hotbarHold)) && P.swingT <= 0 && P.kickCd <= 0) {
    const it = selectedItem();
    const d = it ? ITEMS[it.id] : null;
    if (!d || d.cat === 'weapon' || (d.cat === 'tool' && d.tool !== 'rod')) { P.repeatT = (P.repeatT || 0) - dt; if (P.repeatT <= 0) { P.repeatT = 0.12; useSelected(Input.mouse.left); } }
  }
  if (G.modals.length || G.transition) return;

  // warps & stairs
  const [tx, ty] = tileOf(P);
  const key = tx + ',' + ty;
  if (key !== P.lastTileKey) {
    P.lastTileKey = key;
    const w = warpAt(m, tx, ty);
    if (w) {
      if (w.dungeon) dungeonEntrance();
      else { Audio2.play('door'); warpTo(w.to, w.tx, w.ty, w.dir); }
    } else if (m.id === 'dungeon') {
      const o = getObj(m, tx, ty);
      if (o && o.type === 'stairs') descend();
    }
  }
}

function onTimeTick() {
  const t = G.time;
  if (t === 1200 && G.map.outdoor) Music.play(musicFor(G.map));
  if (t === 1440) UI.toast("It's midnight. Carl should really get to bed.", null, '#c0b0ff');
  if (t === 1500) UI.toast('1 AM. The System AI is judging you.', null, '#c0b0ff');
  dinnerTick(t);
  if (t >= DAY_END) passOut();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function render(dt) {
  const W = canvas.width, H = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (!G.map) return;
  computeCamera(W, H);
  renderWorld(ctx, W, H, dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  renderLighting(ctx, W, H);
  renderWeather(ctx, W, H, dt);
  renderBubbles(ctx);
  if (!(UI.top() instanceof DayEndModal)) drawHUD(ctx);
  drawModals(ctx);
  if (UI.hoverItem && !G.modals.length) itemTooltip(ctx, UI.hoverItem, Input.mouse.x, Input.mouse.y);
  else if (UI.hoverText) {
    const s = UI.s;
    ctx.font = UI.font(6);
    const w = ctx.measureText(UI.hoverText).width + 10 * s;
    drawPanel(ctx, Input.mouse.x - w - 4 * s, Input.mouse.y, w, 12 * s, 'dark');
    drawText(ctx, UI.hoverText, Input.mouse.x - w + 1 * s, Input.mouse.y + 3 * s, { size: 6, color: '#fff' });
  }
  if (G.transition) {
    const tr = G.transition;
    const a = tr.phase === 'out' ? tr.t / tr.dur : 1 - tr.t / tr.dur;
    ctx.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (lastError) drawText(ctx, 'Error: ' + lastError, 8, H - 20, { size: 4, color: '#ff6060', shadow: '#000' });
}

function drawModals(ctx) {
  const top = UI.top();
  for (const m of G.modals.slice()) {
    const isTop = m === top;
    const lp = Input.mouse.leftPressed, rp = Input.mouse.rightPressed;
    if (!isTop) { Input.mouse.leftPressed = false; Input.mouse.rightPressed = false; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    m.draw(ctx);
    if (!isTop) { Input.mouse.leftPressed = lp; Input.mouse.rightPressed = rp; }
  }
}

// ---------------------------------------------------------------------------
// Maps & transitions
// ---------------------------------------------------------------------------
function musicFor(m) {
  if (m.id === 'dungeon') return m.music || 'dungeon';
  if (m.outdoor && G.time >= 1200) return 'night';
  if (m.id === 'town') return 'town';
  if (m.id === 'shop' || m.id === 'guild') return 'safe';
  return ['farm', 'summer', 'fall', 'winter'][G.season];
}

function transitionTo(fn, dur = 0.22) {
  if (G.transition) return;
  G.transition = { t: 0, dur, phase: 'out', fn };
}

function setMap(m, tx, ty, dir) {
  const P = G.player;
  // auto-collect anything left on the ground
  for (const d of G.drops) addItem(d.id, d.n);
  G.drops = []; G.projectiles = []; G.bombs = []; G.hazards = []; G.particles = []; G.floaters = []; G.flashes = [];
  G.fishing = null;
  G.map = m;
  P.x = tx * TILE + 8; P.y = ty * TILE + 12; P.dir = dir;
  P.kx = 0; P.ky = 0;
  P.swingT = 0; P.kickCd = 0;
  P.trail = [];
  P.lastTileKey = tx + ',' + ty;
  G.donut.x = P.x - DX[dir] * 12; G.donut.y = P.y - DY[dir] * 12 + 2;
  G.donut.map = m.id;
  partyFollowMap(m);
  petFollowMap(m);
  G.locT = 3;
  Music.play(musicFor(m));
}

function warpTo(mapId, tx, ty, dir) {
  transitionTo(() => setMap(G.maps[mapId], tx, ty, dir));
}

function enterDungeon(level) {
  transitionTo(() => {
    const m = generateLevel(level);
    setMap(m, m.spawn.x, m.spawn.y, DOWN);
    G.locT = 4;
    maybeSpawnRival(m, level);
    commentOnFloor(m, level > G.stats.deepest);
    if (level > G.stats.deepest) {
      G.stats.deepest = level;
      if (level % 5 === 0) recordNews('deep', { n: level });
    }
    if (level % 5 === 0 && !G.expressFloors.includes(level)) {
      G.expressFloors.push(level);
      G.expressFloors.sort((a, b) => a - b);
      UI.toast(`Stairwell Express checkpoint unlocked: Level ${level}`, null, '#ffe070');
    }
    if (level >= 5) unlock('level5');
    if (level >= 25) unlock('level25');
    if (m.safe) unlock('safe_room');
    if (m.boss) {
      setTimeout(() => {
        if (m.boss === 'hoarder') UI.system('ATTENTION CRAWLER! You have entered the lair of THE HOARDER, Neighborhood Boss. She has been collecting things for a very long time. You are about to become one of her things.');
        else UI.system('ATTENTION CRAWLER! You have entered the grotto of the KRAKAREN CLONE, Borough Boss. It is wet, it is angry, and it has more arms than you have excuses. Watch the ground for tentacle strikes!');
      }, 400);
    } else if (level === 1 && !G.flags.dungeonIntro) {
      G.flags.dungeonIntro = true;
      setTimeout(() => UI.system(['Welcome to the Stairwell, Crawler! Break rocks with your Pickaxe to find ore and the hidden stairs down. Clearing every monster also reveals the way down.', 'Donut will cast Magic Missile at anything that gets close. Kick with Space. Climb the ladder to return to the Plaza. Good luck! Now get out there and kill, kill, kill!']), 400);
    }
  }, 0.3);
}

function descend() {
  Audio2.play('stairs');
  rivalOnCarlDescend();
  addFollowers(10 + G.map.level * 5, true);
  enterDungeon(G.map.level + 1);
}

function leaveDungeon() {
  transitionTo(() => setMap(G.maps.town, 19, 5, DOWN), 0.3);
}

// ---------------------------------------------------------------------------
// Death, passing out, days
// ---------------------------------------------------------------------------
function playerDie() {
  const P = G.player;
  if (G.dying) return;
  G.dying = true;
  Audio2.play('die');
  G.stats.died++;
  recordNews('died');
  const fee = Math.min(2000, Math.floor(G.gold * 0.1));
  G.gold -= fee;
  transitionTo(() => {
    G.dying = false;
    G.modals = [];
    P.hp = Math.round(P.maxHp * 0.5);
    P.energy = Math.max(P.energy, Math.round(P.maxEnergy * 0.4));
    P.hurtT = 2;
    G.time = Math.min(1500, G.time + 120);
    setMap(G.maps.cabin, 3, 4, DOWN);
    unlock('died');
    UI.system([`CRAWLER DOWN! Crawler Carl has died. Viewership spiked 400%.`, `Fortunately, this is the cozy spin-off. Borant has resurrected you at home and deducted a Resurrection Surcharge of ${fee}g. Please die responsibly.`]);
  }, 0.6);
}

function passOut() {
  if (G.ending) return;
  unlock('pass_out');
  recordNews('passout');
  endDay(true);
}

function rollWeather() {
  if (G.season === 3) return chance(0.35) ? 'snow' : 'sun';
  return chance([0.22, 0.15, 0.25][G.season]) ? 'rain' : 'sun';
}

const DAY_QUIPS = [
  'The System AI has reviewed your day and rated it: adequate.',
  'Ratings were up 3%. The executives have requested more screaming vegetables.',
  "Your shipping bin was emptied by a Borant intern. He's fine. Mostly.",
  "A viewer in the Nebula Quarter named their child after you. The child's name is 'Pants?'",
  'Donut received 14,000 fan letters today. You received a coupon.',
  'Tomorrow is another day. Borant guarantees it. Legally.',
  "The Syndicate thanks you for today's content. It was... content.",
];

function endDay(passedOut) {
  if (G.ending) return;
  G.ending = true;
  G.modals = [];
  Audio2.play('sleep');
  transitionTo(() => processNight(passedOut), 0.6);
}

function processNight(passedOut) {
  const P = G.player;
  dinnerOver();
  const agg = {};
  let total = 0;
  for (const s of G.shipping) { agg[s.id] = (agg[s.id] || 0) + s.n; total += s.n * ITEMS[s.id].price; }
  const items = Object.entries(agg).map(([id, n]) => ({ id, n }));
  G.gold += total;
  G.stats.earned += total;
  G.shipping = [];
  checkGoldAchievements();
  if (total >= 1000) recordNews('bigship', { g: total });
  let quip = choice(DAY_QUIPS);
  if (passedOut) {
    const fee = Math.min(1000, Math.floor(G.gold * 0.1));
    G.gold -= fee;
    quip = `You passed out! Borant's retrieval team dragged you home and charged a ${fee}g retrieval fee.`;
  }
  const report = { title: `${SEASON_NAMES[G.season]} ${G.day} — Shipping Report`, items, total, quip };
  const lateness = G.time;

  // advance the calendar
  G.day++; G.totalDays++;
  let seasonChanged = false;
  if (G.day > DAYS_PER_SEASON) {
    G.day = 1; G.season = (G.season + 1) % 4;
    if (G.season === 0) G.year++;
    seasonChanged = true;
  }
  G.weather = seasonChanged ? 'sun' : G.tomorrowWeather;
  G.tomorrowWeather = rollWeather();

  // crops
  const fm = G.maps.farm;
  const crops = new Set();
  for (const o of fm.objs.values()) if (o.type === 'crop') crops.add(o);
  let withered = 0;
  for (const o of crops) {
    const cd = CROPS[o.crop];
    if (seasonChanged && !cd.seasons.includes(G.season)) {
      removeObj(fm, o);
      addObj(fm, { type: 'withered', x: o.x, y: o.y, hp: 1 });
      withered++;
    } else if (fm.wet[o.y * fm.w + o.x]) o.grown = Math.min(cd.days, o.grown + 1);
  }
  fm.wet.fill(0);
  if (G.weather === 'rain') for (let i = 0; i < fm.till.length; i++) if (fm.till[i]) fm.wet[i] = 1;
  const sprs = new Set();
  for (const o of fm.objs.values()) if (o.type === 'sprinkler' || o.type === 'qsprinkler') sprs.add(o);
  for (const o of sprs) {
    const r = o.type === 'qsprinkler' ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] : [[0, -1], [-1, 0], [1, 0], [0, 1]];
    for (const [dx, dy] of r) { const x = o.x + dx, y = o.y + dy; if (inBounds(fm, x, y) && fm.till[y * fm.w + x]) fm.wet[y * fm.w + x] = 1; }
  }
  // untended soil occasionally reverts
  for (let i = 0; i < fm.till.length; i++) if (fm.till[i] && !fm.objs.has(i) && !fm.wet[i] && chance(0.04)) fm.till[i] = 0;
  spawnForage(fm, randi(1, 3));
  regrowDebris(fm, randi(0, 3));

  // daily resets
  for (const id of Object.keys(G.friends)) { G.friends[id].talked = false; G.friends[id].gifted = false; }
  G.flags.toiletToday = false;
  G.flags.crawledWith = false;
  G.flags.crawledWithMongo = false;
  leaveParty();
  sendMongoHome();
  G.flags.exhaustedWarned = false;
  if (G.quest) { G.quest.expires--; if (G.quest.expires <= 0) { G.quest = null; G.flags.questExpired = true; } }
  if (!G.quest) G.boardOffer = makeBoardQuest();

  P.energy = passedOut ? Math.round(P.maxEnergy * 0.6) : lateness > 1440 ? Math.round(P.maxEnergy * 0.85) : P.maxEnergy;
  P.hp = P.maxHp;
  P.water = canCapacity();
  G.time = DAY_START;
  G.timeAcc = 0;
  for (const n of G.npcs) n.schedIdx = -1;
  setMap(G.maps.cabin, 3, 4, DOWN);
  G.donut.x = 5 * TILE + 8; G.donut.y = 4 * TILE + 12;
  G.mongo.x = G.mongo.home[0] * TILE + 8; G.mongo.y = G.mongo.home[1] * TILE + 12;
  G.seasonChanged = seasonChanged;
  G.witheredCount = withered;
  saveGame();
  UI.push(new DayEndModal(report, startNewDay));
}

function startNewDay() {
  G.ending = false;
  Audio2.play('rooster');
  Music.play(musicFor(G.map));
  const msgs = [];
  if (G.seasonChanged) {
    msgs.push(`ATTENTION CRAWLER! The Homestead climate has COLLAPSED and rebooted. Welcome to ${SEASON_NAMES[G.season]}, Year ${G.year}!` + (G.witheredCount ? ` ${G.witheredCount} out-of-season crop(s) withered. Borant regrets nothing.` : '') + ' New seeds are available at Pook\'s Provisions.');
    unlock('season');
  }
  if (G.flags.questExpired) { G.flags.questExpired = false; UI.toast('Your board request expired.', null, '#ffd0a0'); }
  const daysLeft = DAYS_PER_SEASON - G.day;
  const collapse = daysLeft === 0 ? 'The season collapses TONIGHT. Harvest what you can!' : `The season collapses in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`;
  UI.announce(`${DAY_NAMES[(G.day - 1) % 7].toUpperCase()}, ${SEASON_NAMES[G.season].toUpperCase()} ${G.day}`, `${WEATHER_TEXT[G.weather]} ${collapse} ${choice(SYSTEM_MORNING)}`, 'level', 'system');
  const present = mongoPresent();
  if (present) {
    giveItem(present, 1, true);
    UI.toast(`Mongo dug up a present for you: ${ITEMS[present].name}!`, present, '#a0ffa0');
  }
  if (G.followers >= 10000 && chance(0.12)) {
    giveItem('box_fan', 1, true);
    UI.toast('A sponsor left a Fan Box on your doorstep!', 'box_fan', '#ff8fd0');
  }
  for (const id of Object.keys(BIRTHDAYS)) {
    if (isBirthday(id)) UI.toast(`It's ${NPC_DEFS[id].name}'s birthday today! Bring a gift.`, null, '#ff8fd0');
  }
  if (msgs.length) UI.system(msgs);
}

// ---------------------------------------------------------------------------
// Game start / save / load
// ---------------------------------------------------------------------------
function beginPlay() {
  G.screen = 'play';
  Title.howTo = false;
}

function newGame() {
  G = freshState();
  resize();
  G.player = createPlayer();
  buildWorld(true);
  initNPCs();
  G.boardOffer = makeBoardQuest();
  beginPlay();
  setMap(G.maps.cabin, 3, 4, DOWN);
  G.donut.x = 5 * TILE + 8; G.donut.y = 4 * TILE + 12;
  G.dying = false;
  UI.dialog(INTRO_SCRIPT.map(([who, text]) => ({ who, text })), {
    onDone: () => {
      unlock('no_pants');
      UI.toast('Tip: press E for your inventory & crafting.', null, '#c0f0a0');
      UI.toast('Tip: walk out the door, then till soil with the Hoe (slot 2).', null, '#c0f0a0');
    },
  });
}

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

function saveGame() {
  const P = G.player;
  const data = {
    v: 1,
    day: G.day, season: G.season, year: G.year, totalDays: G.totalDays,
    weather: G.weather, tomorrowWeather: G.tomorrowWeather,
    gold: G.gold, followers: G.followers,
    player: { inv: P.inv, invSize: P.invSize, sel: P.sel, tools: P.tools, water: P.water, maxEnergy: P.maxEnergy, maxHp: P.maxHp, skills: P.skills },
    farm: serializeMap(G.maps.farm),
    stats: G.stats, achievements: G.achievements, friends: G.friends, met: G.met, knownLoves: G.knownLoves, seenLines: G.seenLines,
    heartEvents: G.heartEvents,
    recipes: G.recipes, quest: G.quest, boardOffer: G.boardOffer, mainQuest: G.mainQuest, expressFloors: G.expressFloors, flags: G.flags,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    UI.toast('Game saved.', null, '#a0ffa0');
  } catch (e) {
    UI.toast('Could not save (storage unavailable).', null, '#ff8080');
  }
}

function continueGame() {
  let data;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { data = null; }
  if (!data) { newGame(); return; }
  G = freshState();
  resize();
  Object.assign(G, {
    day: data.day, season: data.season, year: data.year, totalDays: data.totalDays || 1,
    weather: data.weather, tomorrowWeather: data.tomorrowWeather, gold: data.gold, followers: data.followers,
    achievements: data.achievements || {}, friends: data.friends || {}, met: data.met || {}, knownLoves: data.knownLoves || {}, seenLines: data.seenLines || {},
    heartEvents: data.heartEvents || {},
    recipes: data.recipes || G.recipes, quest: data.quest, boardOffer: data.boardOffer, mainQuest: data.mainQuest || 0,
    expressFloors: data.expressFloors || [1], flags: data.flags || {},
  });
  G.stats = Object.assign(G.stats, data.stats || {});
  G.player = createPlayer();
  Object.assign(G.player, data.player);
  while (G.player.inv.length < 40) G.player.inv.push(null);
  buildWorld(false);
  applyMapState(G.maps.farm, data.farm);
  initNPCs();
  beginPlay();
  setMap(G.maps.cabin, 3, 4, DOWN);
  G.donut.x = 5 * TILE + 8; G.donut.y = 4 * TILE + 12;
  G.time = DAY_START;
  G.seasonChanged = false;
  startNewDay();
}

function toTitle() {
  G.screen = 'title';
  G.modals = [];
  G.transition = null;
  G.ending = false;
  Music.play('title');
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ music: Audio2.musicOn, sfx: Audio2.sfxOn })); } catch (e) { /* ignore */ }
}
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (s) { Audio2.musicOn = s.music !== false; Audio2.sfxOn = s.sfx !== false; }
  } catch (e) { /* ignore */ }
}

window.addEventListener('load', () => {
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init, init);
  else init();
});
