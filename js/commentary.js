'use strict';
// ---------------------------------------------------------------------------
// Donut's live commentary in the Stairwell: she reacts out loud (in a speech
// bubble) to new depths, bosses, Carl getting hurt, loot and big plays.
// ---------------------------------------------------------------------------

// Big moments always get a line; everything else waits out a short global
// cooldown and a longer per-kind one so Donut doesn't narrate every kick.
const COMMENT_PRIORITY = ['newdepth', 'boss_hoarder', 'boss_krakaren', 'bosskill_hoarder', 'bosskill_krakaren', 'bosslow'];
const COMMENT_GAP = 5;        // seconds between ordinary comments
const COMMENT_REPEAT = 20;    // seconds before the same kind of comment again
const Commentary = { t: 0, last: -99, kinds: {}, lastLine: '', kills: [] };

function donutComment(kind, data) {
  const d = G.donut, C = Commentary;
  if (!d || !G.map || !G.map.level) return false;
  const priority = COMMENT_PRIORITY.includes(kind);
  if (!priority && (C.t - C.last < COMMENT_GAP || C.t - (C.kinds[kind] ?? -99) < COMMENT_REPEAT)) return false;
  const key = kind === 'lowhp' && heartsOf('donut') >= 6 ? 'lowhp_close' : kind;
  const lines = DONUT_COMMENTARY[key];
  if (!lines) return false;
  const pool = lines.length > 1 ? lines.filter(l => l !== C.lastLine) : lines;
  const line = choice(pool);
  C.lastLine = line;
  C.last = C.kinds[kind] = C.t;
  say(d, line.replace(/\{(\w+)\}/g, (_, k) => data && data[k] != null ? data[k] : ''), 2.2 + line.length / 30);
  return true;
}

function updateCommentary(dt) {
  Commentary.t += dt;
  const P = G.player;
  if (G.map.level && P.hp > 0 && P.hp < P.maxHp * 0.3) donutComment('lowhp');
}

// --- hooks ---------------------------------------------------------------------
function commentOnFloor(m, firstVisit) {
  if (m.boss) donutComment('boss_' + m.boss);
  else if (m.safe) donutComment('safe');
  else if (firstVisit) donutComment('newdepth', { n: m.level });
  else if (chance(0.35)) donutComment('floor');
}

function commentOnBossHit(mo) {
  const f = mo.hp / mo.d.hp;
  if (f <= 0) return;
  if (f < 0.2 && !mo.saidLow) { mo.saidLow = mo.saidHalf = true; donutComment('bosslow'); }
  else if (f < 0.5 && !mo.saidHalf) { mo.saidHalf = true; donutComment('bosshalf'); }
}

function commentOnKill() {
  const C = Commentary;
  C.kills = C.kills.filter(t => C.t - t < 2.5);
  C.kills.push(C.t);
  if (C.kills.length >= 3) { C.kills = []; donutComment('multikill'); }
}
