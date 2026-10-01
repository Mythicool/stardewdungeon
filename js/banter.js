'use strict';
// ---------------------------------------------------------------------------
// Friend banter: friends remember what Carl did lately and bring it up when he
// talks to them, and chat with each other in speech bubbles when they're near
// each other and Carl.
// ---------------------------------------------------------------------------

const NEWS_DAYS = 3;        // how many days friends keep talking about something
const BANTER_RANGE = 128;   // px: speakers must be this close to Carl

function recentNews() {
  G.flags.news = (G.flags.news || []).filter(n => n.day > G.totalDays - NEWS_DAYS);
  return G.flags.news;
}

// Something worth gossiping about happened. A repeat of the same kind replaces
// the old entry, so friends who already reacted bring it up again.
function recordNews(kind, data) {
  const list = recentNews();
  const i = list.findIndex(n => n.kind === kind);
  if (i >= 0) list.splice(i, 1);
  list.push(Object.assign({ kind, day: G.totalDays, heard: {} }, data));
}

function fillNews(text, n) {
  return text.replace(/\{(\w+)\}/g, (_, k) => k === 'who' ? NPC_DEFS[n.who].name : typeof n[k] === 'number' ? fmtNum(n[k]) : n[k]);
}

// The newest piece of news this friend hasn't brought up yet, as a line of
// dialogue (or null). Friends don't gossip to Carl about a gift they received.
function newsReaction(id) {
  const lines = NEWS_REACTIONS[id];
  if (!lines) return null;
  const list = recentNews();
  for (let i = list.length - 1; i >= 0; i--) {
    const n = list[i];
    if (n.heard[id] || n.who === id || !lines[n.kind]) continue;
    n.heard[id] = true;
    return fillNews(lines[n.kind], n);
  }
  return null;
}

// --- speech-bubble scenes --------------------------------------------------------
const Banter = { cur: null, cd: 15 };

function banterEntity(id) {
  return id === 'donut' ? G.donut : id === 'mongo' ? G.mongo : G.npcs.find(n => n.id === id);
}

function banterSpeakers(sc) { return [...new Set(sc.lines.map(l => l[0]))]; }

function banterReady(sc, here) {
  const P = G.player;
  return banterSpeakers(sc).every(id => {
    const e = banterEntity(id);
    return e && here.includes(e) && dist(e.x, e.y, P.x, P.y) < BANTER_RANGE;
  });
}

function pickBanter() {
  const here = npcsHere();
  const news = recentNews();
  const seen = G.flags.banterSeen || (G.flags.banterSeen = {});
  const ok = BANTER_SCENES.filter(sc => (!sc.news || news.some(n => n.kind === sc.news)) && banterReady(sc, here));
  if (!ok.length) return null;
  // news first, then scenes the player hasn't seen, then anything
  const fresh = ok.filter(sc => !seen[sc.id]);
  const topical = fresh.filter(sc => sc.news);
  return choice(topical.length ? topical : fresh.length ? fresh : ok);
}

function updateBanter(dt) {
  const b = Banter;
  if (b.cur) {
    const sc = b.cur;
    sc.t -= dt;
    if (sc.t > 0) return;
    if (sc.i >= sc.lines.length || !banterReady(sc.def, npcsHere())) { b.cur = null; b.cd = rand(25, 50); return; }
    const [who, text] = sc.lines[sc.i++];
    const dur = 2 + text.length / 22;
    say(banterEntity(who), text, dur);
    sc.t = dur + 0.3;
    return;
  }
  b.cd -= dt;
  if (b.cd > 0) return;
  b.cd = 3; // nobody around: look again shortly
  const def = pickBanter();
  if (!def) return;
  G.flags.banterSeen[def.id] = true;
  const n = def.news && recentNews().find(x => x.kind === def.news);
  b.cur = { def, i: 0, t: 0, lines: def.lines.map(([who, text]) => [who, n ? fillNews(text, n) : text]) };
}
