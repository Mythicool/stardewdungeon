'use strict';
// ---------------------------------------------------------------------------
// Friend mail: friends send letters to the mailbox outside Carl's cabin. Mail
// is sorted overnight and waits in the box (red flag up) until Carl reads it.
// Letters thank him for loved gifts, birthday gifts and good dinners, teach
// him a friend's own recipe once they're close, react to what he did in the
// Stairwell lately, and now and then carry a little care package.
// ---------------------------------------------------------------------------

const MAILBOX_SPOTS = [[9, 8], [12, 7], [13, 8], [7, 8], [5, 8]];
const MAIL_PER_DAY = 3;          // letters delivered per morning
const MAIL_BOX_MAX = 8;          // stop delivering while this many sit unread
const MAIL_GIFT_HEARTS = 2;
const MAIL_GIFT_CHANCE = 0.3;
const MAIL_GIFT_EVERY = 5;       // days before the same friend sends another package
const MAIL_NEWS_CHANCE = 0.6;
const MAIL_NEWS_HEARTS = 1;
const MAIL_FOLLOWERS = 40;       // per letter read: mail day is content

function mailState() {
  return G.flags.mail || (G.flags.mail = { box: [], owed: {}, recipes: {}, lastGift: {}, from: {}, read: 0 });
}

function mailWaiting() { return G.flags.mail ? G.flags.mail.box.length : 0; }

// The farm's mailbox goes by the cabin door. Older saves get one on load.
function ensureMailbox(m) {
  for (const o of m.objs.values()) if (o.type === 'mailbox') return o;
  for (const [x, y] of MAILBOX_SPOTS) {
    if (getObj(m, x, y) || m.block[y * m.w + x] || m.till[y * m.w + x] || gAt(m, x, y) === T.WATER) continue;
    return addObj(m, { type: 'mailbox', x, y });
  }
  return null;
}

// Something Carl did deserves a thank-you note tomorrow. One per friend; a
// newer reason replaces an older one.
function mailOwe(id, kind, item) {
  if (!MAIL_LETTERS[id] || !MAIL_LETTERS[id].thanks[kind]) return;
  mailState().owed[id] = { kind, item };
}

function fillLetter(text, data) {
  return text.replace(/\{(\w+)\}/g, (_, k) => k === 'who' ? NPC_DEFS[data.who].name : typeof data[k] === 'number' ? fmtNum(data[k]) : data[k]);
}

// The friend's best care package for their hearts (entries are in heart order).
function mailGiftFor(id) {
  const ok = MAIL_LETTERS[id].gifts.filter(g => g[0] <= heartsOf(id));
  return ok.length ? ok[ok.length - 1] : null;
}

// Overnight: put up to MAIL_PER_DAY new letters in the box, at most one per
// friend. Thank-yous first, then recipes, then news, then care packages.
function deliverMail() {
  const st = mailState();
  const out = [];
  const sent = new Set();
  const room = () => out.length < MAIL_PER_DAY && st.box.length + out.length < MAIL_BOX_MAX;
  const post = (from, text, extra) => { out.push(Object.assign({ from, text, day: G.totalDays }, extra)); sent.add(from); };

  for (const [id, o] of Object.entries(st.owed)) {
    if (!room()) break;
    if (sent.has(id)) continue;
    const L = MAIL_LETTERS[id];
    const extra = {};
    if (o.kind === 'bday') {
      const g = mailGiftFor(id) || L.gifts[0];
      extra.item = g[1]; extra.n = g[2];
    }
    post(id, fillLetter(L.thanks[o.kind], o), extra);
    delete st.owed[id];
  }

  for (const [id, L] of Object.entries(MAIL_LETTERS)) {
    if (!room()) break;
    const r = L.recipe;
    if (!r || st.recipes[id] || sent.has(id) || heartsOf(id) < r.hearts) continue;
    st.recipes[id] = true;
    post(id, r.text, { recipe: r.id });
  }

  if (room() && chance(MAIL_NEWS_CHANCE)) {
    const list = recentNews();
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.mailed) continue;
      const who = Object.keys(MAIL_LETTERS).filter(id => MAIL_LETTERS[id].news[n.kind] && !sent.has(id) && n.who !== id && !(n.heard && n.heard[id]) && heartsOf(id) >= MAIL_NEWS_HEARTS);
      if (!who.length) continue;
      const id = choice(who);
      n.mailed = true;
      if (n.heard) n.heard[id] = true; // they already said it in the letter
      post(id, fillLetter(MAIL_LETTERS[id].news[n.kind], n));
      break;
    }
  }

  if (room() && chance(MAIL_GIFT_CHANCE)) {
    const who = Object.keys(MAIL_LETTERS).filter(id => !sent.has(id) && heartsOf(id) >= MAIL_GIFT_HEARTS && !(G.totalDays - (st.lastGift[id] || -99) < MAIL_GIFT_EVERY));
    if (who.length) {
      const id = choice(who);
      const ok = MAIL_LETTERS[id].gifts.filter(g => g[0] <= heartsOf(id));
      const g = choice(ok);
      st.lastGift[id] = G.totalDays;
      post(id, g[3], { item: g[1], n: g[2] });
    }
  }

  st.box.push(...out);
  return out.length;
}

// The morning heads-up, called from startNewDay.
function mailMorning() {
  const n = mailWaiting();
  if (n) UI.toast(`You've got mail! ${n} letter${n > 1 ? 's' : ''} in the mailbox by the cabin.`, null, '#ffe0a0');
}

// Carl opens the mailbox: every letter plays as a page from its sender, and
// whatever came with it goes straight into his bag.
function readMail() {
  const st = mailState();
  if (!st.box.length) return UI.say(null, choice(MAIL_EMPTY));
  const letters = st.box.splice(0);
  const pages = [];
  Audio2.play('pickup');
  for (const L of letters) {
    const name = NPC_DEFS[L.from].name;
    pages.push({ who: L.from, text: /^(\*|Carl[,.!])/.test(L.text) ? L.text : `Dear Carl,\n${L.text}` });
    if (L.item) {
      giveItem(L.item, L.n || 1, true);
      pages.push({ who: null, text: `(Enclosed from ${name}: ${L.n > 1 ? L.n + 'x ' : ''}${ITEMS[L.item].name}. It's in your bag.)` });
    }
    if (L.recipe && !G.recipes.includes(L.recipe)) {
      G.recipes.push(L.recipe);
      const rc = RECIPES.find(r => r.id === L.recipe);
      pages.push({ who: null, text: `(You learned to cook ${ITEMS[rc.out].name}! Find it in the Crafting tab.)` });
    }
    st.from[L.from] = true;
    st.read++;
  }
  UI.dialog(pages, {
    onDone: () => {
      addFollowers(MAIL_FOLLOWERS * letters.length, true);
      unlock('mail_first');
      if (Object.keys(MAIL_LETTERS).every(id => st.from[id])) unlock('pen_pals');
    },
  });
}
