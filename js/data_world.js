'use strict';
// ---------------------------------------------------------------------------
// NPCs, dialogue, achievements, quests and the System AI's personality.
// ---------------------------------------------------------------------------

const NPC_DEFS = {
  donut: {
    name: 'Princess Donut', spr: 'donut', companion: true, voice: 'meow',
    love: ['kibble', 'catnip', 'sunglasses', 'tiara', 'ruby', 'diamond', 'tunamelt', 'trout'],
    like: ['minnow', 'carp', 'melon', 'mana', 'sandwich', 'icefish', 'sponsorfish'],
    hate: ['rat_tail', 'grub_goo', 'catfish', 'fiber', 'stone', 'ectoplasm', 'cat_collar', 'feralcat'],
    lines: [
      [0, "Carl, the viewers can see you. Have you considered pants? No? Fine. It's your brand."],
      [0, "I was a Grand Champion show cat, Carl. Now I'm a farmer. The Syndicate had better appreciate my range."],
      [0, "Mongo ate a radish and then looked at me like I'd poisoned him. He's so dramatic. I don't know where he gets it."],
      [0, "Do you think my followers prefer the tiara or the sunglasses? Don't answer that. Both. The answer is both."],
      [0, "If a Brindle Grub goes near my catnip I will Magic Missile it into next season."],
      [0, "Carl! I've decided we're famous now. Act accordingly."],
      [0, "The System AI called our farm 'quaint.' I have never been so insulted."],
      [0, "I don't dig, Carl. I supervise. There's a difference and it's called class."],
      [0, "In the Stairwell I handle the magic and you handle the kicking. It's called synergy."],
      [2, "The Plaza Bopca said I have 'star quality.' He's clearly very smart. You should buy more things from him."],
      [4, "You know... you're not bad at this farming thing. For a man without pants."],
      [6, "Bea never let me sleep on the good pillow. You do. I noticed, Carl. I notice everything."],
      [8, "If the season collapses tomorrow, I want you to know you're my favorite human. Don't make it weird."],
    ],
    react: {
      love: "Carl! This is EXACTLY what a princess deserves! The viewers are going to lose their minds!",
      like: "Oh, how thoughtful. I'll allow it.",
      neutral: "...Is this for me? I suppose I'll put it with the others.",
      hate: "Carl. CARL. What is this. Take it away before someone takes a picture.",
    },
  },
  mongo: {
    name: 'Mongo', spr: 'mongo', pet: true, voice: 'roar',
    love: ['rat_tail', 'tusk', 'skewer', 'eel', 'carp', 'minnow', 'catfish', 'hob_ear'],
    like: ['potato', 'melon', 'sandwich', 'tunamelt'],
    hate: ['catnip', 'radish', 'pepper', 'fiber', 'kibble'],
    lines: [
      [0, '*Mongo sniffs your boxer shorts suspiciously.*'],
      [0, '*Mongo does a little hop. He is a good boy.*'],
      [0, '*Mongo tries to eat your watering can. It does not go well.*'],
      [0, '*Mongo lies at your feet and makes a sound like a squeaky gate.*'],
      [0, '*Mongo screeches at a butterfly. The butterfly is unimpressed.*'],
      [3, '*Mongo brings you a stick. It is a rather large stick. It might be a small tree.*'],
      [6, '*Mongo headbutts your leg affectionately. You will have a bruise. Worth it.*'],
    ],
    react: {
      love: '*Mongo SCREECHES with pure joy and runs three laps around you!*',
      like: '*Mongo gobbles it up and wags his tail.*',
      neutral: '*Mongo sniffs it, then eats it anyway.*',
      hate: "*Mongo eats it. Mongo regrets it. Mongo's eyes are watering.*",
    },
  },
  mordecai: {
    name: 'Mordecai', spr: 'mordecai', voice: 'low',
    love: ['beer', 'hangover', 'glowshroom', 'mana', 'mandrake', 'ectoplasm', 'tentacle'],
    like: ['hp_potion', 'grub_goo', 'quartz', 'stew', 'yam', 'coal'],
    hate: ['kibble', 'catnip', 'fiber', 'tiara', 'stone'],
    schedule: [{ t: 0, map: 'guild', x: 5, y: 4 }],
    lines: [
      [0, "Crawler. You look like hell. Good. Means you're working."],
      [0, "Rule one: everything down there wants to kill you. Rule two: everything up here wants to sell you something."],
      [0, "Bring me Glowing Mushrooms and Grub Goo and learn to brew. I sell the recipe. I'm a guide, not a charity."],
      [0, "Deeper in the Stairwell the ore gets better. So do the monsters. That's what Borant calls 'balance.'"],
      [0, "Don't trust the System AI. It's not your friend. It's barely anyone's friend."],
      [0, "Hob-Lobbers are for rocks and monsters. Not fishing. I don't care what the goblins told you."],
      [0, "Every fifth level of the Stairwell has a safe room. Use them. Dead crawlers don't pay rent."],
      [0, "Bring me ore and gold and I'll enchant your tools. Copper, then iron, then gold. That's the order. Don't argue."],
      [2, "Level ten. The Hoarder. Bring bombs. Bring potions. Don't let the cats surround you."],
      [4, "You remind me of a crawler I guided a long time ago. Stubborn. Didn't wear pants either, oddly."],
      [6, "I've been doing this job longer than you've been alive, kid. You're one of the good ones. Don't let it go to your head."],
    ],
    react: {
      love: "...Well. Now THAT is a proper gift. Don't tell anyone I smiled.",
      like: "Useful. I'll put it to work.",
      neutral: 'Hm. Thanks, I guess.',
      hate: 'What am I supposed to do with this? Get it out of my guild.',
    },
  },
  katia: {
    name: 'Katia', spr: 'katia', voice: 'mid',
    love: ['melon', 'gourd', 'sandwich', 'tunamelt', 'stew', 'pie', 'ruby'],
    like: ['potato', 'corn', 'salad', 'wild_garlic', 'crystal_fruit', 'yam', 'blackberry'],
    hate: ['rat_tail', 'grub_goo', 'hob_ear', 'bomberry', 'ectoplasm'],
    schedule: [
      { t: 0, map: 'town', x: 22, y: 19 },
      { t: 700, map: 'farm', x: 29, y: 21 },
      { t: 1020, map: 'town', x: 32, y: 17 },
      { t: 1320, map: 'town', x: 6, y: 23 },
    ],
    lines: [
      [0, "Morning, Carl! Donut already told me you slept in. Twice."],
      [0, "I tried gardening once, before. My tomatoes got blight. Here, the crops can apparently fight back. Progress!"],
      [0, "Heading down the Stairwell? I'm great at standing in front of things that bite."],
      [0, "Mongo followed me home yesterday. Then he followed me back. Then he ate my boot."],
      [0, "I've been practicing my shapes. Don't be alarmed if I'm taller tomorrow."],
      [0, "The Desperado Club won't let me in. Level requirement. I'm starting to take it personally."],
      [0, "Your pond is really peaceful in the afternoon. I come here to think. And to watch Mongo fight ducks."],
      [2, "The Hoarder on level ten? I heard she keeps 'cats.' I heard they're not really cats. Be careful."],
      [4, "When everything ended, I thought I'd be alone down here. I'm glad I'm not."],
      [6, "You're a good friend, Carl. Even if you smell like goblin powder."],
      [8, "Whatever this season throws at us, we face it together. Deal? Deal."],
    ],
    react: {
      love: "Carl, this is amazing! You didn't have to. ...But I'm really glad you did.",
      like: 'Oh, nice! Thank you!',
      neutral: "Thanks, Carl. That's sweet.",
      hate: "Um. Wow. I'm going to pretend this didn't happen.",
    },
  },
  zev: {
    name: 'Zev', spr: 'zev', voice: 'high',
    love: ['mandrake', 'diamond', 'bloodberry', 'sunglasses', 'pie', 'crystal_fruit'],
    like: ['mana', 'ruby', 'gold_ore', 'melon', 'tiara', 'quartz'],
    hate: ['minnow', 'carp', 'catfish', 'trout', 'eel', 'icefish', 'sponsorfish', 'grub_goo'],
    schedule: [
      { t: 0, map: 'town', x: 34, y: 22 },
      { t: 720, map: 'town', x: 17, y: 17 },
      { t: 960, map: 'town', x: 34, y: 22 },
    ],
    lines: [
      [0, "Carl! The numbers on the mandrake scream were INCREDIBLE. Do it again. Then do it louder."],
      [0, "Remember: every crop is content. Every weed is content. Every... pants-less step... is content."],
      [0, "Our sponsors want more wholesome moments. Pet the cat. No, the OTHER cat. The one who won't claw you."],
      [0, "The Syndicate audience is split on the boxer shorts. And by 'split' I mean 'obsessed.'"],
      [0, "Please don't fish in front of me. It's a cultural thing."],
      [0, "If you hit a million followers I'm contractually required to throw you a party. I've pre-ordered the balloons."],
      [0, "Explosions test incredibly well with the 18-to-900 demographic. Just saying."],
      [3, "Off the record? Borant's execs watch your channel on their lunch break. ON the record, I said nothing."],
      [4, "Between you and me, I've never had clients as popular as you. Don't tell Donut. She'll want a raise."],
      [6, "I know Borant isn't... great. But I'm glad I'm on your side of the camera, Carl."],
    ],
    react: {
      love: "Carl! This is SO on-brand. I'm posting it. I'm posting it right now.",
      like: 'Aww, cute! Engagement bait, but cute.',
      neutral: "Oh! A gift. How... analog. Thank you!",
      hate: "Carl. That is a FISH. We have TALKED about this.",
    },
  },
  pook: {
    name: 'Pook', spr: 'pook', voice: 'high',
    love: ['gold_ore', 'diamond', 'quartz', 'tunamelt', 'corn', 'crystal_fruit'],
    like: ['potato', 'radish', 'wild_garlic', 'wood', 'copper', 'sandwich'],
    hate: ['grub_goo', 'ectoplasm', 'beer', 'rat_tail'],
    schedule: [{ t: 0, map: 'shop', x: 6, y: 3 }],
    lines: [
      [0, "Welcome, welcome! Pook has seeds, Pook has sandwiches, Pook has a strict no-refunds policy!"],
      [0, "Pook has worked in forty-two safe rooms. This is the first one with sunlight. Pook is getting a tan."],
      [0, "Customers who buy Rat Radish seeds also buy... more Rat Radish seeds. Pook has data."],
      [0, "Pook heard the Hoarder lives deep in the Stairwell. Pook heard she has many cats. Pook does not go there."],
      [0, "The Syndicate says Bopca are 'protected.' Pook says: then why is Pook still paying rent?"],
      [0, "Seeds change every season! Pook restocks at the collapse. Very exciting. Very stressful."],
      [3, "Pook's cousin runs the safe room on level five. Tell him Pook says hi. He will still charge you full price."],
      [5, "You are Pook's favorite customer. Pook says that to everyone, but this time Pook means it."],
    ],
    react: {
      love: "Oh! OH! Pook will treasure this! Pook will put it on the special shelf!",
      like: 'Pook thanks you! Very good gift! Pook would sell it, but Pook will not!',
      neutral: 'Pook accepts your offering.',
      hate: 'Pook... Pook will put this in the back. Far in the back.',
    },
  },
};

// Birthdays. On a friend's birthday their first chat is `talk`, and gifts count
// for much more (see giveGift): `love` for a loved gift, `gift` for a liked or
// neutral one, `hate` for a hated one.
const BIRTHDAYS = {
  donut: {
    season: 0, day: 9,
    talk: "Carl. Do you know what day it is? It's MY day. The whole Syndicate knows. I made sure.",
    love: "A birthday gift worthy of a princess! Carl, I'm crying. Cats don't cry. This is allergies.",
    gift: "For my birthday? Oh, Carl. It's not a tiara, but it's the thought that counts. The thought should have been a tiara.",
    hate: "On my BIRTHDAY, Carl?! I'm telling the fans. All of them. Tonight.",
  },
  pook: {
    season: 0, day: 22,
    talk: "Today is Pook's birthday! Pook is giving everyone a birthday discount! ...Of zero percent. But with feeling!",
    love: "Pook's birthday is the best birthday! Pook will put this on the VERY special shelf!",
    gift: "Crawler remembered Pook's birthday! Pook is so happy Pook might give a real discount. Pook will not. But Pook might.",
    hate: "Pook... Pook will put this in the back. Even on Pook's birthday. Especially on Pook's birthday.",
  },
  mongo: {
    season: 1, day: 3,
    talk: '*Mongo is wearing a tiny party hat. Donut put it there. He is VERY proud of it.*',
    love: '*Mongo SCREECHES the birthday screech and runs a full birthday lap of the farm!*',
    gift: '*Mongo accepts his birthday present with a dignified chomp. His party hat wobbles.*',
    hate: "*Mongo eats it anyway, because it's his birthday and he refuses to be sad. His eyes are watering.*",
  },
  katia: {
    season: 1, day: 18,
    talk: "It's my birthday! Is it weird that I've never had one as a crawler before? Donut says it's a 'content opportunity.'",
    love: "Carl! For my birthday? This is perfect. You actually remembered. I'm going to be weird about this for days.",
    gift: "You remembered my birthday! That's honestly the best part. Thank you.",
    hate: "...Thanks? On my birthday? I'm choosing to believe this is a prank.",
  },
  mordecai: {
    season: 2, day: 12,
    talk: "Birthday? Who told you. Was it the cat? It was the cat.",
    love: "...Hm. Nobody's given me a birthday present in a very, very long time. Thank you, kid.",
    gift: "A gift. For my birthday. You're soft, crawler. ...Thanks.",
    hate: "Of all the days. Get out. Come back tomorrow and we'll pretend this didn't happen.",
  },
  zev: {
    season: 3, day: 7,
    talk: "It's my birthday, Carl! I've scheduled a surprise party for myself at four. Act surprised.",
    love: "Carl!!! Best birthday gift EVER! I'm posting it! I'm posting it with a birthday filter!",
    gift: 'A birthday gift! Analog, sincere, a little awkward. Very on-brand for you. Thank you!',
    hate: "Carl. On my BIRTHDAY. Is that a fish? Is it fish-adjacent? I'm not even going to look.",
  },
};

const DONUT_BATTLE_QUIPS = [
  'Magic Missile!', 'Take THAT!', 'Carl! Did you see that?!', 'Nobody touches my Carl!',
  'Another one for the highlight reel!', 'Mongo would have liked that one.', 'Pew pew!', 'For the fans!',
];
const DONUT_IDLE_QUIPS = [
  'Carl, you missed a spot.', "I'm supervising.", 'This dirt is beneath me. Literally.', 'Is it lunch yet?',
  '*purrs*', 'Wave to the camera, Carl!', 'Mongo! Stop eating that!', 'My paws are getting dirty.',
  'Do I look majestic right now? Be honest.', 'Is that a butterfly? Ugh. Show-off.',
];

const ACHIEVEMENTS = {
  no_pants:     { name: 'No Pants, No Problem', desc: "You entered the Homestead in your boxer shorts. The Syndicate has voted this 'a bold look.'", box: 'box_bronze', followers: 500 },
  dirt_farmer:  { name: 'Dirt Farmer', desc: 'You hit the ground with a stick until it became farmland. Congratulations on inventing agriculture. Again.', followers: 100 },
  seedy:        { name: 'Seedy Business', desc: 'You put a seed in the dirt. Riveting television.', followers: 100 },
  first_harvest:{ name: "It's Alive!", desc: 'You grew a living thing and then ripped it out of the ground. Nature is beautiful.', box: 'box_bronze', followers: 300 },
  first_ship:   { name: 'Supply Chain Enthusiast', desc: 'You put vegetables in a box and trusted a faceless corporation to pay you. Adorable.', followers: 200 },
  first_kill:   { name: "Baby's First Murder", desc: 'You killed a monster! The audience cheered. Some of the audience are monsters. They cheered anyway.', box: 'box_bronze', followers: 500 },
  rat_10:       { name: 'Rat Race', desc: 'Ten rats dead. Rat mothers across the Stairwell are updating their wills.', followers: 400 },
  kills_100:    { name: 'Serial Crawler', desc: 'One hundred kills. The Stairwell has started a support group about you.', box: 'box_silver', followers: 3000 },
  bomb_first:   { name: 'Explosive Personality', desc: 'You set off a Hob-Lobber. The goblin engineers would be proud, if you had not just blown them up.', followers: 800 },
  self_own:     { name: 'Self-Own', desc: 'You were caught in your own explosion. This clip has been viewed nine billion times.', box: 'box_fan', followers: 5000 },
  pet_donut:    { name: 'Head Pats Are Content', desc: 'You petted a Princess. She allowed it. This time.', followers: 300 },
  pet_mongo:    { name: 'Good Boy Certified', desc: 'Mongo is a good boy. This has been independently verified.', followers: 300 },
  mandrake:     { name: 'Earplugs Not Included', desc: 'You harvested a Screaming Mandrake. Your ears will stop ringing in three to five business days.', followers: 1000 },
  level5:       { name: 'Stairwell Tourist', desc: 'You reached level 5 of the Stairwell. The gift shop is on level 6. There is no gift shop.', box: 'box_silver', followers: 1500 },
  safe_room:    { name: 'Safe and Sound', desc: 'You found a safe room. The Bopca inside has already overcharged you.', followers: 500 },
  hoarder:      { name: 'Neighborhood Watch', desc: 'You defeated The Hoarder. Her "cats" have been released into the wild. This is a problem for later.', box: 'box_gold', followers: 50000 },
  krakaren:     { name: 'Calamari Tonight', desc: 'You defeated the Krakaren Clone. The original has been notified and is VERY upset.', box: 'box_legendary', followers: 250000 },
  level25:      { name: 'Deep Diver', desc: 'Level 25. The sun is a rumor down here.', box: 'box_gold', followers: 20000 },
  pass_out:     { name: 'Crawler Down', desc: 'You passed out. Borant retrieval dragged you home by the ankle. They charged extra.', followers: 1000 },
  died:         { name: 'Respawn Not Included... Oh, Wait', desc: 'You died! Luckily this is the cozy spin-off. Death is merely a billing event.', followers: 10000 },
  gold_1k:      { name: 'Thousandaire', desc: "You've earned 1,000 gold. The System AI is mildly impressed. It will not say so twice.", followers: 500 },
  gold_10k:     { name: 'Landlord Approved', desc: "10,000 gold earned. Borant's accountants have started tracking you. That is not a compliment.", box: 'box_silver', followers: 5000 },
  gold_100k:    { name: 'Crawler Capitalist', desc: '100,000 gold. You are now legally a small economy.', box: 'box_gold', followers: 50000 },
  fish_first:   { name: 'Fish Out of Water', desc: 'You caught a fish. Zev would like a word.', followers: 300 },
  fish_legend:  { name: 'Sponsored Content', desc: 'You caught The Sponsor. Its lawyers will be in touch.', box: 'box_gold', followers: 30000 },
  gift_love:    { name: 'Professional Suck-Up', desc: 'You gave someone a gift they loved. Manipulation? No. Friendship. Probably.', followers: 400 },
  hearts_5:     { name: 'Friendship Is Magic Missile', desc: 'Five hearts with someone. The audience is shipping it.', box: 'box_silver', followers: 5000 },
  night_owl:    { name: 'Night Crawler', desc: 'Still awake at 1 AM. The System AI does not sleep either. Solidarity.', followers: 300 },
  quest_first:  { name: 'Gig Economy', desc: 'You completed a job from the Request Board. No benefits, no dental, no pants.', followers: 600 },
  followers_1m: { name: 'Syndicate Darling', desc: 'One million followers! Your face is on a lunchbox in three galaxies.', box: 'box_legendary' },
  tv:           { name: 'Couch Crawler', desc: "You watched Borant programming voluntarily. That's... worrying.", followers: 100 },
  fountain:     { name: 'Wishful Thinking', desc: 'You threw money into a fountain. Borant thanks you for your donation.', followers: 50 },
  harvest_100:  { name: 'Big Ag', desc: 'One hundred crops harvested. You are now a Faction. Please register.', box: 'box_silver', followers: 5000 },
  eat_bomberry: { name: 'Do NOT Eat', desc: 'The label said do not eat. You ate. The audience respects the commitment.', followers: 2000 },
  first_craft:  { name: 'Arts and Crafts', desc: 'You made something! Put it on the fridge. You do not have a fridge.', followers: 200 },
  box_open:     { name: 'Unboxing Video', desc: 'You opened a loot box. The dopamine is sponsored.', followers: 200 },
  upgrade:      { name: 'Enchanted Equipment', desc: "You upgraded a tool. Mordecai pretended not to be proud.", followers: 800 },
  season:       { name: 'Collapse Survivor', desc: 'You survived a seasonal collapse. The Homestead rebooted. You did not. Good job.', box: 'box_gold', followers: 10000 },
  birthday:     { name: 'Many Happy Returns', desc: "You gave a friend a gift on their birthday. Borant does not celebrate birthdays. Borant celebrates quarterly earnings.", box: 'box_silver', followers: 2500 },
};

const MAIN_QUESTS = [
  { title: 'Welcome to the Homestead', desc: 'Till soil with your Hoe, then plant 5 seeds.', check: () => G.stats.planted >= 5, reward: { gold: 150 } },
  { title: 'Hydration Station', desc: 'Water 5 tilled tiles with the Watering Can.', check: () => G.stats.watered >= 5, reward: { gold: 100 } },
  { title: 'Ship It!', desc: 'Put an item in the Shipping Bin beside your cabin.', check: () => G.stats.shippedCount >= 1, reward: { box: 'box_bronze' } },
  { title: 'Meet the Locals', desc: 'Talk to Mordecai, Katia, Zev and Pook in the Safe Room Plaza (head east).', check: () => ['mordecai', 'katia', 'zev', 'pook'].every(n => G.met[n]), reward: { gold: 300 } },
  { title: 'Into the Stairwell', desc: 'Reach level 5 of the Stairwell (north end of the Plaza).', check: () => G.stats.deepest >= 5, reward: { box: 'box_silver' } },
  { title: 'Neighborhood Boss', desc: 'Defeat The Hoarder on level 10 of the Stairwell.', check: () => !!G.stats.bosses.hoarder, reward: { box: 'box_gold' } },
  { title: 'Rent Is Due', desc: 'Earn 10,000g in total.', check: () => G.stats.earned >= 10000, reward: { box: 'box_gold' } },
  { title: 'Borough Boss', desc: 'Defeat the Krakaren Clone on level 20 of the Stairwell.', check: () => !!G.stats.bosses.krakaren, reward: { box: 'box_legendary' } },
  { title: 'Syndicate Darling', desc: 'Reach 1,000,000 followers.', check: () => G.followers >= 1e6, reward: { gold: 25000 } },
];

function makeBoardQuest() {
  const seasonCrops = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(G.season));
  const opts = [
    () => { const it = choice(seasonCrops); const n = randi(3, 6); return { type: 'deliver', item: it, n, from: 'katia', text: `Katia wants ${n} ${ITEMS[it].name} for a "totally normal" dinner party.` }; },
    () => { const n = randi(20, 40); return { type: 'deliver', item: 'wood', n, from: 'pook', text: `Pook needs ${n} Wood to build a bigger counter. Pook's ambitions are growing.` }; },
    () => { const n = randi(20, 35); return { type: 'deliver', item: 'stone', n, from: 'mordecai', text: `Mordecai needs ${n} Stone. He won't say why. Don't ask.` }; },
    () => { const it = choice(['minnow', 'carp']); const n = randi(1, 3); return { type: 'deliver', item: it, n, from: 'donut', text: `Donut demands ${n} ${ITEMS[it].name}. "It's for the fans, Carl."` }; },
    () => { const n = randi(4, 8); return { type: 'slay', mon: 'rat', n, from: 'zev', text: `Zev says rat-stomping content is trending. Kill ${n} Rats in the Stairwell.` }; },
  ];
  if (G.stats.deepest >= 3) opts.push(() => { const n = randi(2, 4); return { type: 'deliver', item: 'glowshroom', n, from: 'mordecai', text: `Mordecai needs ${n} Glowing Mushrooms. "For science. And also for drinking."` }; });
  if (G.stats.deepest >= 3) opts.push(() => { const n = randi(5, 10); return { type: 'deliver', item: 'copper', n, from: 'pook', text: `Pook wants ${n} Copper Ore. Pook is making a very shiny sign.` }; });
  if (G.stats.deepest >= 5) opts.push(() => { const n = randi(5, 10); return { type: 'slay', mon: 'goblin', n, from: 'katia', text: `Katia has a grudge against goblins. Kill ${n} Goblins.` }; });
  if (G.stats.deepest >= 5) opts.push(() => { const n = randi(4, 8); return { type: 'slay', mon: 'tuskling', n, from: 'zev', text: `Zev needs "adorable-but-violent" footage. Kill ${n} Tusklings.` }; });
  if (G.stats.deepest >= 11) opts.push(() => { const n = randi(3, 6); return { type: 'slay', mon: 'hobgoblin', n, from: 'mordecai', text: `Mordecai wants ${n} Hobgoblins gone. "Personal reasons."` }; });
  const q = choice(opts)();
  q.progress = 0;
  q.expires = 3;
  q.reward = q.type === 'deliver' ? Math.round(q.n * (ITEMS[q.item].price || 5) * 3 + 150) : q.n * 60 + 150;
  return q;
}

const SYSTEM_MORNING = [
  'Reminder: Borant Corporation is not responsible for crop failure, crawler failure, or failure in general.',
  "Today's sponsor: absolutely nobody. Get your numbers up.",
  'The Syndicate audience has requested more farming. And more explosions. Ideally at the same time.',
  'Fun fact: 83% of crawlers who water their crops survive the season. The rest wandered into the Stairwell unprepared.',
  'The Stairwell is open 24 hours a day. The monsters inside are not open to negotiation.',
  'Please stop naming the monsters. It makes the audience sad when you kick them.',
  'Crawler morale is at an all-time high. This will be corrected.',
  "The System AI has reviewed your farm and rated it: 'Fine.' Congratulations.",
  'Please be advised that the Shipping Bin is not a portal. Do not attempt to climb inside.',
  'The Hoarder has been sighted on level 10 of the Stairwell. She has a lot of cats. Most of them are not cats.',
  'New policy: pants remain optional. The audience has spoken.',
  'Your Safe Room Sandwich has been recalled. Just kidding. They are all like that.',
  'The System AI would like to remind you that it loves you. That was a joke. The System AI does not love.',
  'Bombs are like crops: plant them, walk away, and hope for the best. Mostly walk away.',
  'Crawler tip: Mongo is not a lawnmower. Please stop letting him eat the weeds. He is getting ideas.',
  'Today is a great day to reach a new personal best. Or a new personal worst. Both drive engagement.',
];
const WEATHER_TEXT = {
  sun: 'Forecast: Sunny. Crops require manual watering, because this is a farming show and suffering is content.',
  rain: 'Forecast: Rain! Your crops will be watered automatically. Borant takes full credit.',
  snow: 'Forecast: Snow. Nothing grows. Except your despair. And Frostcap Mushrooms.',
};
const TV_SHOWS = [
  'DUNGEON CRAWLER WORLD RECAP: Last night a crawler on another floor tried to befriend a Brindle Grub. It went poorly. Ratings: excellent.',
  'COOKING WITH BOPCA: Today, the Safe Room Sandwich. Step one: make the Safe Room Sandwich. There is no step two.',
  'SPONSOR MESSAGE: Tired of dying? Try Borant Premium Respawn! Terms and conditions are mostly lies.',
  'HOMESTEAD TIPS: Sprinklers water nearby crops every morning. Crawlers who use sprinklers report 40% less back pain.',
  'THE SYNDICATE SHOPPING NETWORK: Today only, a Legendary Box for the low, low price of one (1) planet! Operators are standing by.',
  "HOMESTEAD TIPS: Seeds only grow in their season. When the season collapses, anything out of season withers. Plan ahead, crawler.",
  'MONSTER OF THE WEEK: The Tuskling. Small. Tusky. Charges in a straight line. Step aside and kick it in the ham.',
  'HOMESTEAD TIPS: Hob-Lobbers break rocks AND monsters in a wide radius. Also crawlers. Step back.',
  'CELEBRITY GOSSIP: Is Princess Donut the most famous cat in the universe? Sources (Princess Donut) say yes.',
];

const INTRO_SCRIPT = [
  ['system', 'ATTENTION, CRAWLER! Welcome to DUNGEON FARMER WORLD, the cozy spin-off nobody asked for, brought to you by Borant Corporation!'],
  ['system', "Due to overwhelming demand from the Syndicate's 'relaxing content' demographic, you and your companion have been assigned a Homestead on the Stairwell Plateau."],
  ['system', 'The rules are simple: grow crops, ship crops, make friends, and descend the Stairwell to murder things for loot. The audience expects all four.'],
  ['system', 'Each season lasts 28 days before the Homestead climate collapses and reboots. Crops out of season will wither. So will you, probably.'],
  ['system', 'Now get out there and farm, farm, farm!'],
  ['donut', 'Carl! CARL! They gave us a FARM! Do you know what this means?'],
  ['carl', '...Manual labor?'],
  ['donut', 'CONTENT, Carl. It means content. Now go hit the dirt with a stick. I will supervise.'],
];
