'use strict';
// ---------------------------------------------------------------------------
// Friend favors: each friend has a three-part personal favor. A part unlocks
// once Carl has enough hearts with them (2, 4, then 6) and talks to them. Parts
// are fetch, slay or "reach this depth" jobs, never expire, and end in a short
// scene with a reward. Finishing a friend's last part pays out something
// special. One part per friend per day.
// ---------------------------------------------------------------------------

const FAVOR_PTS = [150, 200, 300];
const FAVOR_FANS = [1500, 4000, 15000];

// Each step: hearts needed, the job (deliver item n / slay mon n / depth level),
// a one-line HUD goal, the scene that asks, the scene that thanks, a reward.
const FAVORS = {
  katia: {
    title: "Katia's Window Box",
    steps: [
      {
        hearts: 2, type: 'deliver', item: 'wood', n: 25, goal: 'Wood for planter boxes',
        ask: [
          ['katia', "Carl, can I ask you something kind of dumb? My tent in the Plaza has no color at all. Gray canvas, gray stones, gray sky."],
          ['katia', "Back home I had a window box. Petunias. I killed them constantly, but they were mine. I want to try again."],
          ['donut', 'Katia, you could just come live on our farm. We have DIRT. Carl hits it with a stick every day.'],
          ['katia', "I want my own. Could you bring me 25 Wood? I'll build the planters myself."],
        ],
        done: [
          ['katia', "Twenty-five planks! Carl, you're the best. I already know where every one of these is going."],
          ['katia', 'Here, take these. Pook gave them to me for "emotional support." I think they were expired.'],
        ],
        reward: { items: [['sandwich', 3]] },
      },
      {
        hearts: 4, type: 'deliver', item: 'glowshroom', n: 3, goal: 'Glowing Mushrooms for the planters',
        ask: [
          ['katia', "The planters are done! But nothing grows up here at night, and night is when I need it."],
          ['katia', "Those mushrooms in the Stairwell that glow? If I had three, I could see them from my bunk. Something soft to look at before I sleep."],
          ['carl', 'You want a night light made out of dungeon fungus.'],
          ['katia', "...When you say it like that it sounds sad. Yes. That's exactly what I want."],
        ],
        done: [
          ['katia', "Oh, look at them. They're breathing. Are they breathing? I don't care. They're perfect."],
          ['donut', 'I would like it on the record that I helped by supervising.'],
          ['katia', "Noted, Donut. Carl, here. I've been saving this for someone who'd use it."],
        ],
        reward: { items: [['hp_potion', 3]] },
      },
      {
        hearts: 6, type: 'slay', mon: 'goblin', n: 8, goal: 'Goblins who trashed the window box',
        ask: [
          ['katia', "Carl. Somebody tore up my window box last night. There were footprints. Little ones. And goblin powder everywhere."],
          ['katia', "I know it's just mushrooms in a box. It's not just mushrooms in a box."],
          ['donut', 'Carl, I am declaring war on the goblins. You will be doing the war part.'],
          ['katia', "Eight of them should get the message. I'll replant while you're down there."],
        ],
        done: [
          ['katia', "I replanted everything. And I added a fence. A small one. With spikes. Small spikes."],
          ['katia', "Thank you for taking it seriously, Carl. Most people down here would have laughed."],
          ['katia', "I wrote down my grandma's stew recipe for you. It's the only thing I could cook before all this. Make it for someone you like."],
          ['donut', "Carl does not like anyone. Except me. Make it for me, Carl."],
        ],
        reward: { recipe: 'stew', items: [['stew', 2]] },
      },
    ],
  },
  mordecai: {
    title: 'The Cold Forge',
    steps: [
      {
        hearts: 2, type: 'deliver', item: 'coal', n: 15, goal: 'Coal for the Guild forge',
        ask: [
          ['mordecai', "Kid. There's a forge in the back of the Guild Hall. It's been cold since before you got here."],
          ['mordecai', "I used to make things in it. Rings. Charms. Things that kept crawlers alive a little longer. Then I stopped seeing the point."],
          ['mordecai', 'Bring me 15 Coal. Not because I want to talk about it. Because I want the room warm.'],
        ],
        done: [
          ['mordecai', "Hm. Fifteen. You can count. That puts you ahead of most of my old students."],
          ['mordecai', "It's lit. Smells like the old days. Don't get sentimental, I'm doing enough of that for both of us. Take this."],
        ],
        reward: { items: [['hangover', 2]], gold: 300 },
      },
      {
        hearts: 4, type: 'deliver', item: 'mana', n: 2, goal: 'Mana Crystals to wake the anvil',
        ask: [
          ['mordecai', "The forge is hot, but the anvil's asleep. Enchantment anvils need feeding. Mana Crystals."],
          ['mordecai', "They show up around level eight. Two will do it. Don't die getting them, it'd ruin my week."],
          ['donut', 'Mordecai, are you making Carl something? Is it shoes? Please say it is shoes.'],
          ['mordecai', "He'd never wear them. I know my audience."],
        ],
        done: [
          ['mordecai', "Listen to that hum. That anvil hasn't sung in a long, long time."],
          ['mordecai', "I'm working on something. Can't finish it yet. The ring wants a bit of a hobgoblin's temper in it. Next time."],
        ],
        reward: { items: [['bomb', 4]], gold: 500 },
      },
      {
        hearts: 6, type: 'slay', mon: 'hobgoblin', n: 5, goal: 'Hobgoblins for the ring',
        ask: [
          ['mordecai', "Here's the last of it. Five hobgoblins. You kill them, the ring knows. Don't ask how, it's guild stuff."],
          ['mordecai', "Every crawler I've ever made a ring for is gone. Every one. I stopped making them because I stopped believing it helped."],
          ['carl', 'And now?'],
          ['mordecai', "Now some idiot in boxer shorts keeps coming back alive. Go on. Get out before I say something nice."],
        ],
        done: [
          ['mordecai', "There. The Guildmaster's Toe Ring. Only one I've made in years, and it's going on a toe. Of course it is."],
          ['mordecai', "It hits harder than anything I sell. Keep it on. Keep coming back. That's the deal."],
          ['donut', 'Mordecai, your eyes are wet.'],
          ['mordecai', "It's the forge. Get out of my Guild Hall, both of you."],
        ],
        reward: { items: [['guild_ring', 1]] },
      },
    ],
  },
  zev: {
    title: 'Ratings Emergency',
    steps: [
      {
        hearts: 2, type: 'slay', mon: 'rat', n: 12, goal: 'Rats for the "Rat Stomp Challenge"',
        ask: [
          ['zev', "Carl. Carl. I'm going to be honest with you because we're friends: my numbers are DOWN. Borant is reviewing my position."],
          ['zev', 'I need a viral moment. I\'m calling it the "Rat Stomp Challenge." Twelve rats. Big kicks. Big reactions.'],
          ['carl', 'I already kick rats.'],
          ['zev', 'Yes, but now you kick them for ME. Branding, Carl.'],
        ],
        done: [
          ['zev', "Twelve rats! The clips are EVERYWHERE. A Syndicate senator did the challenge. He kicked an intern. It's fine, it's trending."],
          ['zev', "Here, take this. Sponsors send me boxes and I don't have arms long enough to open them all."],
        ],
        reward: { box: 'box_silver' },
      },
      {
        hearts: 4, type: 'depth', level: 8, goal: 'Reach Stairwell level 8 for the documentary',
        ask: [
          ['zev', "The challenge worked! Too well. Now Borant wants a prestige documentary. Something with 'gravitas.'"],
          ['zev', '"Descent: One Crawler\'s Journey." Get to level eight of the Stairwell and look haunted on the way down.'],
          ['donut', 'I can look haunted. I am a natural. Watch. ...Was that haunted?'],
          ['zev', "That was hungry, Donut. But I'll take it."],
        ],
        done: [
          ['zev', "Level eight! The footage is gorgeous. You looked SO haunted, Carl. How do you do that?"],
          ['carl', 'I was being chased by a tuskling.'],
          ['zev', "Method acting. Love it. Here's a little something from the documentary budget."],
        ],
        reward: { gold: 1000, box: 'box_gold' },
      },
      {
        hearts: 6, type: 'slay', mon: 'hoarder', n: 1, goal: 'Defeat The Hoarder for the finale',
        ask: [
          ['zev', "Okay. Big one. The documentary needs an ending, and Borant says the ending is you beating The Hoarder on level ten."],
          ['zev', "...Carl, can I say something off the record? I don't actually want you to go. If it goes wrong, it goes wrong on my show."],
          ['carl', "Then make sure you get my good side."],
          ['zev', "You don't have a good side. You have a leather jacket. Come back, okay? That part's not for the show."],
        ],
        done: [
          ['zev', "CARL! Number one in forty-two systems! The Syndicate is calling it 'the most touching boss murder of the season.'"],
          ['zev', "I got promoted. Sort of. I have a desk now. It's very small. I wanted you to have this. It's from the top shelf."],
          ['donut', 'Zev, did you put me in the credits?'],
          ['zev', 'Donut, you ARE the credits.'],
        ],
        reward: { box: 'box_legendary' },
      },
    ],
  },
  pook: {
    title: "Pook's Special Shelf",
    steps: [
      {
        hearts: 2, type: 'deliver', item: 'copper', n: 10, goal: "Copper Ore for Pook's shelf",
        ask: [
          ['pook', "Crawler! Pook has a secret. Pook is building a Special Shelf. For special things. Pook has never had special things."],
          ['pook', "A shelf must be shiny or it is just a plank. Could Crawler bring Pook 10 Copper Ore? For the trim?"],
          ['donut', "Pook, what will you put on it?"],
          ['pook', "Pook does not know yet! That is the exciting part!"],
        ],
        done: [
          ['pook', 'So shiny! Pook polished it four times. Pook can see Pook in it!'],
          ['pook', 'Please take these, Crawler! Pook insists! Pook will be mad if you do not! Pook will not actually be mad.'],
        ],
        reward: { items: [['tunamelt', 2]] },
      },
      {
        hearts: 4, type: 'deliver', item: 'quartz', n: 3, goal: "Dungeon Quartz for Pook's shelf",
        ask: [
          ['pook', "The shelf is done. It is very empty. Pook stares at it at night. It stares back."],
          ['pook', 'Pook would like the first thing on it to be from Crawler. Three Dungeon Quartz? So it sparkles?'],
          ['carl', "Pook, that's... really nice."],
          ['pook', 'Pook knows! Pook is very nice! Pook works hard at it!'],
        ],
        done: [
          ['pook', 'Look, Crawler! The shelf sparkles! Customers are asking about it! Pook says "not for sale" now! It feels powerful!'],
          ['pook', 'Here. Pook made a tiny sign that says "From Crawler." It is on the shelf. And this is for you.'],
        ],
        reward: { gold: 800 },
      },
      {
        hearts: 6, type: 'deliver', item: 'ruby', n: 1, goal: "A Blood Ruby for the top of Pook's shelf",
        ask: [
          ['pook', "Crawler... Pook wants to tell you why the shelf matters. Before the dungeon, Pook had a little shop too. Pook lost all of it."],
          ['pook', "Everything on the new shelf is from friends. So if Pook loses it again, Pook remembers who the friends were."],
          ['pook', "The top needs one Blood Ruby. They are very deep down. Only if Crawler is going anyway. Only if it is safe. It is not safe. Never mind. But also, yes please."],
        ],
        done: [
          ['pook', "It's... Crawler, it is perfect. The shelf is finished. Pook has a finished thing."],
          ['donut', 'Pook, I will allow you to put a picture of me on it.'],
          ['pook', "Pook already did, Princess. It is in the middle."],
          ['pook', 'Crawler, take this. It is Pook\'s savings. Pook will save more. Pook is very good at saving.'],
        ],
        reward: { gold: 3000, box: 'box_gold' },
      },
    ],
  },
  donut: {
    title: 'The Royal Portrait',
    steps: [
      {
        hearts: 2, type: 'deliver', item: 'minnow', n: 3, goal: "Minnows for Donut's sushi platter",
        ask: [
          ['donut', "Carl. I have been thinking. A princess needs an official royal portrait. For the fans. And for history."],
          ['donut', "Every portrait needs a theme. Mine is 'Abundance.' I will be lying on a platter of three Kua-Tin Minnows."],
          ['carl', "You're going to eat them."],
          ['donut', "I will eat them AFTER, Carl. I am a professional."],
        ],
        done: [
          ['donut', "Perfect. They are glistening. Hold still, fish. ...Carl, one of them is looking at me."],
          ['donut', "Fine. I ate one. The portrait is now 'Abundance, Slightly Less.' Here, the fans sent this. I don't need it, I have fans."],
        ],
        reward: { box: 'box_bronze', items: [['kibble', 3]] },
      },
      {
        hearts: 4, type: 'slay', mon: 'tuskling', n: 6, goal: "Tusklings who 'looked at' Donut",
        ask: [
          ['donut', "Carl. Something happened in the Stairwell. A tuskling looked at me. Directly. During my portrait sitting."],
          ['donut', "Then five more looked at me. I counted. Six tusklings, Carl. Six disrespectful pigs."],
          ['carl', "So we're kicking six tusklings because they looked at you."],
          ['donut', "We are kicking six tusklings for JUSTICE, Carl. Also because they looked at me."],
        ],
        done: [
          ['donut', "Justice is served. I feel lighter. I feel regal. I may have a nap about it."],
          ['donut', "Carl, I want you to know that you are a very good bodyguard. You are also my best friend. Do not make it weird."],
        ],
        reward: { items: [['catnip', 5]], gold: 400 },
      },
      {
        hearts: 6, type: 'deliver', item: 'cat_collar', n: 1, goal: "The Hoarder's Cat Collar for the portrait",
        ask: [
          ['donut', "Carl, the portrait is almost done. But it needs something. A symbol. Of everything we've been through."],
          ['donut', "The Hoarder on level ten keeps those 'cats.' Bring me her collar. Proof that the real cat won."],
          ['donut', "...And Carl? Come back with it. The portrait has two people in it. I am not finishing it alone."],
        ],
        done: [
          ['donut', "It's done. Look, Carl. That's me, and that's you, and that's the collar. And that's Mongo, eating the frame."],
          ['donut', "I am going to give you something. Do not cry. I have a reputation."],
          ['donut', "It's the very first fan box I ever got. I never opened it. I was saving it for someone. That's you, Carl."],
        ],
        reward: { box: 'box_legendary', items: [['tiara', 1]] },
      },
    ],
  },
};
const FAVOR_ORDER = ['donut', 'katia', 'mordecai', 'zev', 'pook'];

function favorState(id) {
  const all = G.flags.favors || (G.flags.favors = {});
  return all[id] || (all[id] = { step: 0, active: false, progress: 0, day: -1 });
}

function favorStep(id) {
  return FAVORS[id] ? FAVORS[id].steps[favorState(id).step] || null : null;
}

function favorsDone(id) { return FAVORS[id] ? favorState(id).step : 0; }

// A friend has a new part to ask about: enough hearts, nothing in progress, and
// not the same day Carl finished the last part.
function favorOffered(id) {
  const st = favorState(id), step = favorStep(id);
  return !!step && !st.active && heartsOf(id) >= step.hearts && st.day !== G.totalDays;
}

function favorHave(id) {
  const st = favorState(id), step = favorStep(id);
  if (!step) return 0;
  if (step.type === 'deliver') return countItem(step.item);
  if (step.type === 'depth') return G.stats.deepest;
  return st.progress;
}

function favorNeed(step) { return step.type === 'depth' ? step.level : step.n; }

function favorReady(id) {
  const st = favorState(id), step = favorStep(id);
  return !!step && st.active && favorHave(id) >= favorNeed(step);
}

// The extra choice in a friend's interaction menu, if any.
function favorOption(npc) {
  if (!FAVORS[npc.id]) return null;
  const title = FAVORS[npc.id].title;
  if (favorReady(npc.id)) return { label: `Finish favor: ${title}`, fn: () => completeFavor(npc) };
  if (favorOffered(npc.id)) return { label: favorsDone(npc.id) ? `Ask about ${title} (${favorsDone(npc.id) + 1}/3)` : `${NPC_DEFS[npc.id].name} needs a favor`, fn: () => offerFavor(npc) };
  return null;
}

function offerFavor(npc) {
  const id = npc.id, step = favorStep(id);
  G.met[id] = true;
  Audio2.play(id === 'donut' ? 'meow' : 'system');
  const lines = step.ask.slice(0, -1).map(([who, text]) => ({ who, text }));
  const last = step.ask[step.ask.length - 1];
  lines.push({
    who: last[0], text: last[1],
    choices: [
      { label: 'Count me in', fn: () => acceptFavor(npc) },
      { label: 'Not right now', fn: () => UI.say(id, FAVOR_LATER[id]) },
    ],
  });
  return UI.dialog(lines, { noCancel: true });
}

function acceptFavor(npc) {
  const st = favorState(npc.id);
  st.active = true;
  st.progress = 0;
  Audio2.play('open');
  UI.toast(`Favor accepted: ${favorGoalText(npc.id)}`, null, '#ffb0d0');
  if (favorReady(npc.id)) UI.toast(`You already have what ${NPC_DEFS[npc.id].name} needs. Talk to them again.`, null, '#ffe070');
}

function completeFavor(npc) {
  const id = npc.id, st = favorState(id), step = favorStep(id), k = st.step;
  if (!favorReady(id)) return;
  if (step.type === 'deliver') removeItem(step.item, step.n);
  st.active = false;
  st.progress = 0;
  st.step++;
  st.day = G.totalDays;
  const f = friendOf(id);
  if (!f.talked) f.talked = true;
  Audio2.play('coin');
  UI.dialog(step.done.map(([who, text]) => ({ who, text })), {
    noCancel: true,
    onDone: () => {
      const r = step.reward, got = [];
      if (r.gold) { G.gold += r.gold; G.stats.earned += r.gold; got.push(`${fmtNum(r.gold)}g`); }
      if (r.box) { giveItem(r.box, 1, true); got.push(ITEMS[r.box].name); }
      for (const [it, n] of r.items || []) { giveItem(it, n, true); got.push(n > 1 ? `${ITEMS[it].name} x${n}` : ITEMS[it].name); }
      if (r.recipe && !G.recipes.includes(r.recipe)) { G.recipes.push(r.recipe); got.push('a recipe'); }
      addFriend(id, FAVOR_PTS[k]);
      burst(npc.x, npc.y - 16, k === 2 ? 20 : 10, ['#ff4f8a', '#ffffff', '#ffd23a'], 70);
      addFollowers(FAVOR_FANS[k], true);
      const last = st.step >= FAVORS[id].steps.length;
      UI.announce(`EPISODE AIRED: ${FAVORS[id].title} (${st.step}/3)`,
        `${last ? 'Story complete! ' : ''}${got.length ? 'You got ' + got.join(', ') + '. ' : ''}+${fmtNum(FAVOR_FANS[k])} followers.`, 'level');
      if (r.gold) checkGoldAchievements();
      unlock('favor');
      if (last) unlock('favor_story');
      if (FAVOR_ORDER.every(fid => favorsDone(fid) >= FAVORS[fid].steps.length)) unlock('favor_all');
    },
  });
}

function favorGoalText(id) {
  const step = favorStep(id);
  if (!step) return '';
  const need = favorNeed(step), have = Math.min(favorHave(id), need);
  const what = step.type === 'deliver' ? ITEMS[step.item].name : step.type === 'slay' ? MONSTERS[step.mon].name + (need > 1 ? 's' : '') : 'deepest level';
  return step.type === 'depth' ? `${step.goal} (${have}/${need})` : `${have}/${need} ${what}`;
}

// Called from combat when a monster dies.
function favorKill(type) {
  for (const id of FAVOR_ORDER) {
    const st = favorState(id), step = favorStep(id);
    if (!st.active || !step || step.type !== 'slay' || step.mon !== type || st.progress >= step.n) continue;
    st.progress++;
    if (st.progress >= step.n) UI.toast(`Favor done! Go tell ${NPC_DEFS[id].name}.`, null, '#ffb0d0');
  }
}

// Morning heads-up for any friend with a new part waiting.
function favorMorning() {
  // `told` remembers which part was announced, so each one is mentioned once
  const fresh = FAVOR_ORDER.filter(id => favorOffered(id) && favorState(id).told !== favorState(id).step);
  for (const id of fresh) favorState(id).told = favorState(id).step;
  if (fresh.length) UI.toast(`${fresh.map(id => NPC_DEFS[id].name).join(' and ')} ${fresh.length > 1 ? 'have' : 'has'} a favor to ask you.`, null, '#ffb0d0');
}

// Active favors for the HUD tracker.
function favorHudLines() {
  const out = [];
  for (const id of FAVOR_ORDER) {
    const st = favorState(id);
    if (!st.active || !favorStep(id)) continue;
    out.push({ name: NPC_DEFS[id].name, text: favorGoalText(id), ready: favorReady(id) });
  }
  return out;
}

// Marker over a friend's head: '!' for a new favor, '★' when one is ready to hand in.
function favorMarker(id) {
  if (!FAVORS[id]) return null;
  if (favorReady(id)) return '★';
  if (favorOffered(id)) return '!';
  return null;
}

const FAVOR_LATER = {
  katia: "No rush, Carl. The tent's not going anywhere. Neither am I, apparently.",
  mordecai: "Fine. It's waited this long. It can wait a bit more.",
  zev: "Totally fine! Totally! My career is on fire, but take your time!",
  pook: 'Pook understands! Pook will wait! Pook is good at waiting! Pook has a chair!',
  donut: "Carl. A princess does not ask twice. ...I will ask again tomorrow.",
};
