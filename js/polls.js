'use strict';
// ---------------------------------------------------------------------------
// Audience polls: every regular Stairwell floor opens with a live viewer vote
// on a twist. The crowd loves chaos, so risky twists tend to win, and they pay
// more followers if Carl survives to the stairs down. Poll state lives on the
// floor's map, so leaving (ladder, death, passing out) simply drops it.
// ---------------------------------------------------------------------------

const POLL_TIME = 6;          // seconds the vote stays open
const POLL_OPTIONS = 3;
const POLL_TWISTS = {
  gold_rain:   { name: 'Gold Rain', risk: 1, desc: 'Kills and rocks drop bonus gold',
    donut: ["Gold rain! Don't just stand there, Carl. Catch it with your face if you have to.", "The viewers voted to make it rain. I have never respected them more."] },
  lights_out:  { name: 'Lights Out', risk: 2, desc: 'Carl can barely see',
    donut: ["Who turned off the lights? Carl, if something touches my tail I am casting at EVERYTHING.", "Lights out. Wonderful. I can't see my own fur. This is a crime against beauty."] },
  donut_strike:{ name: 'Donut on Strike', risk: 2, desc: 'Donut stops casting Magic Missile',
    donut: ["The people have spoken. I am on strike. Kick your own goblins, Carl.", "No missiles this floor. My union rep says I'm to lounge decoratively."] },
  hyper:       { name: 'Caffeinated Monsters', risk: 2, desc: 'Monsters move 50% faster',
    donut: ["Somebody fed the monsters espresso. Run, Carl. Run with dignity.", "Why are the rats so FAST? Who voted for this? I want names."] },
  double:      { name: 'Double Monsters', risk: 3, desc: 'Every monster on the floor gets a twin',
    donut: ["Double monsters! The audience wants us dead, Carl. It's honestly flattering.", "Twice the monsters. I'm going to need twice the treats after this."] },
  glass_cannon:{ name: 'Glass Cannon', risk: 3, desc: 'Carl deals and takes double damage',
    donut: ["Glass Cannon! You hit twice as hard and you're twice as squishy. So, normal Carl, but more.", "Try not to get hit, Carl. I mean it this time. Double it, actually."] },
};
const POLL_PAY = [0, 1, 2.5, 5];   // follower multiplier by risk tier

// Followers paid for surviving a twist: grows with depth, scales with risk.
function pollPayout(twist, level) { return Math.round(POLL_PAY[POLL_TWISTS[twist].risk] * (100 + level * 40)); }

function startPoll(m) {
  if (!m.level || m.safe || m.boss) return;
  // always one safe option and at least one risky one, so the vote is a real choice
  const by = r => shuffle(Object.keys(POLL_TWISTS).filter(k => POLL_TWISTS[k].risk === r));
  const opts = [by(1)[0], by(3)[0], by(2)[0]];
  shuffle(opts);
  // the crowd leans toward chaos, with enough noise that safe options sometimes win
  m.poll = { t: 0, opts, votes: opts.map(() => 0), pull: opts.map(k => POLL_TWISTS[k].risk * rand(0.5, 1.5)), twist: null };
  UI.toast('AUDIENCE POLL! The viewers are voting on a twist.', null, '#ff9ee0');
}

function curPoll() { const m = G.map; return m && m.poll; }
function pollTwist(id) { const p = curPoll(); return !!p && p.twist === id; }

function updatePoll(dt) {
  const p = curPoll();
  if (!p || p.twist) return;
  p.t += dt;
  // votes trickle in faster as the poll goes on
  const rate = (40 + G.followers / 200) * (0.5 + p.t / POLL_TIME) * dt;
  p.votes = p.votes.map((v, i) => v + rate * p.pull[i] * rand(0.4, 1.6));
  if (p.t >= POLL_TIME) closePoll(p);
}

function closePoll(p) {
  const win = p.votes.indexOf(Math.max(...p.votes));
  const id = p.opts[win], tw = POLL_TWISTS[id];
  p.twist = id;
  p.pay = pollPayout(id, G.map.level);
  applyTwist(id);
  Audio2.play('system');
  UI.toast(`The viewers chose ${tw.name}! Reach the stairs for +${fmtNum(p.pay)} fans.`, null, '#ff9ee0');
  if (G.donut) say(G.donut, choice(tw.donut), 4);
}

function applyTwist(id) {
  const m = G.map;
  const alive = (m.monsters || []).filter(mo => !mo.dead && !mo.d.boss && !mo.d.rival); // Brock is a crawler, not a monster
  if (id === 'hyper') for (const mo of alive) mo.speed *= 1.5;
  if (id === 'double') {
    for (const mo of alive) {
      const [tx, ty] = nearestFree(m, Math.floor(mo.x / TILE) + 1, Math.floor((mo.y - 3) / TILE));
      const twin = createMonster(mo.type, tx * TILE + 8, ty * TILE + 12, mo.level);
      m.monsters.push(twin);
      burst(twin.x, twin.y - 6, 8, ['#ff9ee0', '#ffffff'], 50);
    }
  }
}

// --- hooks ---------------------------------------------------------------------
function pollDamageTaken(dmg) { return pollTwist('glass_cannon') ? dmg * 2 : dmg; }
function pollDamageDealt(dmg) { return pollTwist('glass_cannon') ? dmg * 2 : dmg; }
function pollLight() { return pollTwist('lights_out') ? 0.4 : 1; }

function pollGold(x, y, n) {
  if (!pollTwist('gold_rain')) return;
  G.gold += n;
  floater(x, y - 14, `+${n}g`, '#ffe070');
  Audio2.play('coin');
}
function pollOnKill(mo) { pollGold(mo.x, mo.y, randi(4, 10) + mo.level * 2); }
function pollOnRock(x, y) { if (chance(0.5)) pollGold(x, y, randi(2, 6) + G.map.level); }

// Called as Carl takes the stairs down: surviving a twist pays out.
function payPoll() {
  const p = curPoll();
  if (!p || !p.twist) return;
  const tw = POLL_TWISTS[p.twist];
  addFollowers(p.pay, true);
  UI.toast(`Survived ${tw.name}! +${fmtNum(p.pay)} fans`, null, '#ff9ee0');
  G.stats.twists = (G.stats.twists || 0) + 1;
  if (tw.risk >= 3) unlock('crowd_pleaser');
  p.twist = null;
}

// HUD panel under the quest tracker: live tally while voting, then the active twist.
function drawPollHUD(ctx, ly) {
  const p = curPoll();
  if (!p || (p.twist === null && p.t >= POLL_TIME)) return ly;
  const s = UI.s, w = 120 * s, x = 4 * s;
  if (p.twist) {
    const tw = POLL_TWISTS[p.twist];
    drawPanel(ctx, x, ly, w, 22 * s, 'dark');
    drawText(ctx, `◉ TWIST: ${tw.name} ${'☠'.repeat(tw.risk - 1)}`, x + 4 * s, ly + 2.5 * s, { size: 5.5, bold: true, color: '#ff9ee0' });
    drawText(ctx, tw.desc, x + 4 * s, ly + 9 * s, { size: 4.5, color: '#f0e8f8' });
    drawText(ctx, `Reach the stairs: +${fmtNum(p.pay)} fans`, x + 4 * s, ly + 15 * s, { size: 4.5, color: '#ffe070' });
    return ly + 25 * s;
  }
  const total = p.votes.reduce((a, b) => a + b, 0) || 1;
  const h = (12 + p.opts.length * 9) * s;
  drawPanel(ctx, x, ly, w, h, 'dark');
  drawText(ctx, `◉ AUDIENCE POLL  ${Math.ceil(POLL_TIME - p.t)}s`, x + 4 * s, ly + 3 * s, { size: 5.5, bold: true, color: '#ff9ee0' });
  p.opts.forEach((id, i) => {
    const tw = POLL_TWISTS[id], y = ly + (11 + i * 9) * s, f = p.votes[i] / total;
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 4 * s, y, w - 8 * s, 7 * s);
    ctx.fillStyle = ['', '#4a9a5a', '#b08a2a', '#b03a4a'][tw.risk]; ctx.fillRect(x + 4 * s, y, (w - 8 * s) * f, 7 * s);
    drawText(ctx, `${tw.name} ${'☠'.repeat(tw.risk - 1)}`, x + 6 * s, y + 1.2 * s, { size: 4.8, color: '#ffffff' });
    drawText(ctx, Math.round(f * 100) + '%', x + w - 6 * s, y + 1.2 * s, { size: 4.8, align: 'right', color: '#ffffff' });
  });
  return ly + h + 3 * s;
}
