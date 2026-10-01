'use strict';
// ---------------------------------------------------------------------------
// Sponsor deals: once Carl has been into the Stairwell, Zev has one sponsor
// challenge a day. Carl hears the pitch from Zev in town and takes it or
// passes; a taken deal shows in the HUD and pays out (followers, a loot box,
// a little friendship with Zev) the moment it's done. Deals last the day.
// ---------------------------------------------------------------------------

const SPONSOR_ZEV_PTS = 30;
const SPONSOR_GEMS = ['quartz', 'mana', 'ruby', 'diamond'];

function sponsorDealDef(id) { return SPONSOR_DEALS.find(d => d.id === id); }

// Today's deal record ({ day, id, n, progress, state }), if Carl heard one.
function sponsorToday() {
  const d = G.flags.sponsor;
  return d && d.day === G.totalDays ? d : null;
}

function activeSponsorDeal() {
  const d = sponsorToday();
  return d && d.state === 'active' ? d : null;
}

function sponsorAvailable() {
  return G.stats.deepest >= 1 && !sponsorToday();
}

function sponsorTask(def, n) { return def.task.replace('{n}', n); }

function sponsorReward(def) {
  const t = SPONSOR_TIERS[def.tier];
  return `${ITEMS[t.box].name} and ${fmtNum(t.followers)} followers`;
}

function pickSponsorDeal() {
  const pool = SPONSOR_DEALS.filter(d => !d.ok || d.ok());
  const def = choice(pool);
  return { def, n: def.goal(G.stats.deepest) };
}

function offerSponsorDeal() {
  const { def, n } = pickSponsorDeal();
  const take = state => {
    G.flags.sponsor = { day: G.totalDays, id: def.id, n, progress: 0, state };
    UI.say('zev', choice(state === 'active' ? ZEV_SPONSOR.yes : ZEV_SPONSOR.no));
  };
  UI.dialog([
    { who: 'zev', text: ZEV_SPONSOR.intro },
    { who: 'zev', text: def.pitch.replace('{n}', n) },
    {
      who: 'zev', text: `(${def.sponsor}: ${sponsorTask(def, n)}, today. Pays a ${sponsorReward(def)}.)`,
      choices: [{ label: 'Deal!', fn: () => take('active') }, { label: 'Not today', fn: () => take('declined') }],
    },
  ], { noCancel: true });
}

// Progress hooks. kind: 'kill' (data = what landed the blow), 'chest', 'gem',
// 'depth' (data = level), 'floorclear' (data = the map).
function sponsorEvent(kind, data) {
  const d = activeSponsorDeal();
  if (!d) return;
  let add = 0;
  switch (d.id) {
    case 'kicks': add = kind === 'kill' && data === 'kick' ? 1 : 0; break;
    case 'donut': add = kind === 'kill' && data === 'donut' ? 1 : 0; break;
    case 'bombs': add = kind === 'kill' && data === 'bomb' ? 1 : 0; break;
    case 'team': add = kind === 'kill' && (partyMember() || mongoAlong()) ? 1 : 0; break;
    case 'chests': add = kind === 'chest' ? 1 : 0; break;
    case 'gems': add = kind === 'gem' ? data || 1 : 0; break;
    // progress is the deepest level reached this morning
    case 'rush': if (kind === 'depth' && G.time < 720) add = Math.max(0, Math.min(d.n, data) - d.progress); break;
    case 'flawless': add = kind === 'floorclear' && !data.hitHere ? 1 : 0; break;
  }
  if (!add) return;
  d.progress = Math.min(d.n, d.progress + add);
  if (d.progress >= d.n) completeSponsorDeal(d);
}

function completeSponsorDeal(d) {
  const def = sponsorDealDef(d.id), tier = SPONSOR_TIERS[def.tier];
  d.state = 'done';
  G.stats.sponsorDeals = (G.stats.sponsorDeals || 0) + 1;
  giveItem(tier.box, 1, true);
  addFollowers(tier.followers, true);
  addFriend('zev', SPONSOR_ZEV_PTS);
  UI.announce('SPONSOR DEAL COMPLETE! ' + def.sponsor, `Zev: "${def.thanks}" Reward: ${sponsorReward(def)}.`, 'achievement', 'achievement');
  donutComment('sponsor');
  unlock('sponsored');
  if (G.stats.sponsorDeals >= 10) unlock('sponsor_10');
}

// HUD lines for the objectives panel.
function sponsorHudLines() {
  const d = activeSponsorDeal();
  if (!d) return [];
  const def = sponsorDealDef(d.id);
  const missed = d.id === 'rush' && G.time >= 720;
  return [
    { t: '◆ Sponsor: ' + def.sponsor, c: '#ff9ad0', b: true },
    { t: `${sponsorTask(def, d.n)} ` + (missed ? '(missed, try tomorrow)' : `(${d.progress}/${d.n})`), c: missed ? '#a090b0' : '#f0e8f8' },
  ];
}
