'use strict';
// ---------------------------------------------------------------------------
// NPCs, dialogue, achievements, quests and the System AI's personality.
// ---------------------------------------------------------------------------

const NPC_DEFS = {
  donut: {
    name: 'Princess Donut', spr: 'donut', companion: true, voice: 'meow',
    love: ['royal_tartare', 'kibble', 'catnip', 'sunglasses', 'tiara', 'ruby', 'diamond', 'tunamelt', 'trout'],
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
    love: ['guild_grog', 'beer', 'hangover', 'glowshroom', 'mana', 'mandrake', 'ectoplasm', 'tentacle'],
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
    love: ['katia_soup', 'melon', 'gourd', 'sandwich', 'tunamelt', 'stew', 'pie', 'ruby'],
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
    love: ['zev_sushi', 'mandrake', 'diamond', 'bloodberry', 'sunglasses', 'pie', 'crystal_fruit'],
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
    love: ['pook_wrap', 'gold_ore', 'diamond', 'quartz', 'tunamelt', 'corn', 'crystal_fruit'],
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

// Heart events: short scenes that play the next time you talk to a friend after
// reaching the heart level. Carl picks a response; each choice changes friendship
// by `pts` and may come with a gift. `null` as the speaker is narration.
const HEART_EVENTS = {
  donut: [
    {
      id: 'donut_fanmail', hearts: 3, title: 'Fan Mail',
      scene: [
        ['donut', "Carl. CARL. Zev forwarded my fan mail. Four thousand messages. I read every single one. Twice."],
        ['donut', "Most of them say I'm perfect. Which, correct. But one of them..."],
        ['donut', "One says I'm 'just a cat riding a pantsless man's coattails.' Carl, you don't even OWN a coat with tails!"],
      ],
      ask: ['donut', "Tell me they're wrong, Carl. Tell me right now, and say it like you mean it."],
      choices: [
        { label: 'You carry this whole team.', pts: 120, followers: 500, reply: [['donut', "I KNEW it. I'm framing this moment. Mentally. In gold. With a little spotlight."]] },
        { label: "It's a team effort.", pts: 40, reply: [['donut', "A team effort where I am the captain. Yes. Fine. I accept your phrasing."]] },
        { label: 'Technically, I do the kicking.', pts: -60, reply: [['donut', "Wow. WOW. I am going to go sit in the sun and think about who my real friends are. It's Mongo."]] },
      ],
    },
    {
      id: 'donut_pillow', hearts: 6, title: 'The Good Pillow',
      scene: [
        [null, "*It's late. The cabin is dark. Something small and fluffy is standing on your chest.*"],
        ['donut', "Carl, are you awake? Don't answer. I can hear you breathing. You breathe very loudly for a man with no pants."],
        ['donut', "Before all this, Bea entered me in shows. I won. Every time. She still never let me on the good pillow."],
        ['donut', "I don't think about before very much. I'm too busy being famous. But sometimes I do."],
      ],
      ask: ['donut', "You're not going to leave, right? Like, if you find a better cat?"],
      choices: [
        { label: "There's no better cat.", pts: 150, gift: ['sunglasses', 1], reply: [
          ['donut', "...Obviously. I just needed to hear you say it out loud, for the recording."],
          ['donut', "Here. My spare sunglasses. You need them more than I do. Your face is very... exposed."],
        ] },
        { label: "I'm not going anywhere, Princess.", pts: 120, reply: [['donut', "Good. Scoot over. I'm taking the good pillow. You can have the other good pillow."]] },
        { label: 'Does the better cat cast spells?', pts: 10, reply: [['donut', "I'm going to pretend you said something nice. Goodnight, Carl. Sleep with one eye open."]] },
      ],
    },
  ],
  mongo: [
    {
      id: 'mongo_rat', hearts: 3, title: 'A Gift From Mongo',
      scene: [
        [null, "*Mongo trots up with something enormous dangling from his jaws.*"],
        [null, "*He drops it at your bare feet. It is a rat. It is, mostly, a rat.*"],
        [null, "*Mongo sits. Mongo waits. Mongo's tail thumps the ground like a war drum.*"],
      ],
      ask: ['mongo', "*He is looking at you. He is looking at you SO hard.*"],
      choices: [
        { label: 'Good boy! Best rat ever!', pts: 120, gift: ['rat_tail', 3], reply: [[null, "*Mongo SCREECHES with joy, then politely detaches three tails and nudges them toward you. A gift, from one hunter to another.*"]] },
        { label: 'Pet him. Quietly bury the rat.', pts: 50, reply: [[null, "*Mongo leans into the scratches. He watches you bury the rat, then digs it back up the moment you turn around.*"]] },
        { label: 'Mongo, no. Drop it.', pts: -40, reply: [[null, "*Mongo drops it. Mongo picks it back up. Mongo eats it. Message received, apparently.*"]] },
      ],
    },
    {
      id: 'mongo_storm', hearts: 6, title: 'Thunder',
      scene: [
        [null, "*Thunder rolls over the Homestead. Mongo has wedged himself under your bed. Most of him.*"],
        ['donut', "He's been like that since the first boom. I told him dinosaurs are supposed to be brave. It did not help."],
      ],
      ask: ['mongo', "*A small, sad squeak comes from under the bed.*"],
      choices: [
        { label: 'Crawl under there with him.', pts: 150, reply: [[null, "*You lie on the floor beside Mongo until the storm passes. At some point he rests his head on your chest. It weighs forty pounds. You don't move.*"]] },
        { label: 'Hum him a song.', pts: 80, reply: [[null, "*You hum. Badly. Mongo's tail starts to thump anyway.*"]] },
        { label: "He's a dinosaur. He'll be fine.", pts: -30, reply: [[null, "*Mongo squeaks again.*"], ['donut', "Carl. I am looking at you. I will be looking at you for a very long time."]] },
      ],
    },
  ],
  katia: [
    {
      id: 'katia_shapes', hearts: 3, title: 'Practicing Shapes',
      scene: [
        ['katia', "Carl, can I show you something? Promise you won't laugh."],
        [null, "*Katia's arm stretches, thickens, and folds into a very large, very lumpy shield.*"],
        ['katia', "Mordecai calls it a 'useful tanking build.' I still don't know how I feel about it."],
      ],
      ask: ['katia', 'Is it weird? You can tell me if it\'s weird.'],
      choices: [
        { label: "It's incredible. You're incredible.", pts: 120, reply: [['katia', "Really? ...Okay. Okay! Next time something bites, I'm standing in front. You stand behind me and kick."]] },
        { label: 'Can it hold a sandwich?', pts: 60, reply: [['katia', "...Actually? Yeah. Hold on. Oh, that's gross. That's so useful."]] },
        { label: "It's a little weird.", pts: -50, reply: [['katia', "Oh. Yeah. No, I get it. I'm just going to go stand behind something for a while."]] },
      ],
    },
    {
      id: 'katia_before', hearts: 6, title: 'Before',
      scene: [
        ['katia', "Do you ever miss it? Before? I worked at a bank. I hated it. I'd give anything to complain about it one more time."],
        ['katia', "Every time I change shape, I come back a little different. Taller. Stronger. Less... me, maybe."],
      ],
      ask: ['katia', "Carl, if I ever stop being me, will you tell me?"],
      choices: [
        { label: "I'll always tell you.", pts: 150, gift: ['stew', 1], reply: [
          ['katia', "Thank you. Really. That's all I needed."],
          ['katia', "I made too much stew. That's a lie, I made exactly enough for you. Take it."],
        ] },
        { label: "You'll always be you.", pts: 100, reply: [['katia', "You can't know that. ...But it's nice that you believe it."]] },
        { label: "Let's not get sappy.", pts: 10, reply: [['katia', "Right. Crawlers don't do sappy. ...You totally do, though. I've seen you talk to the radishes."]] },
      ],
    },
  ],
  mordecai: [
    {
      id: 'mordecai_ledger', hearts: 3, title: 'The Ledger',
      scene: [
        ['mordecai', "Sit down, crawler. No, not that one. That chair has opinions."],
        ['mordecai', "Every guide keeps a ledger. Every crawler I ever guided. Their names, what floor they reached, how far they got."],
        [null, "*He closes the book before you can count the pages. There are a lot of pages.*"],
      ],
      ask: ['mordecai', "You want to know how it ends for most of them? Go on. Ask."],
      choices: [
        { label: 'Write my name in pencil.', pts: 150, gift: ['hangover', 2], reply: [
          [null, "*Mordecai stares at you. Then he laughs, a short, surprised bark.*"],
          ['mordecai', "Pencil. Fine. You've earned pencil. Take these, you'll need them after what I'm about to pour."],
        ] },
        { label: 'Tell me.', pts: 40, reply: [['mordecai', "Mostly the same way. I stopped writing the endings a while back. Too much ink."]] },
        { label: 'Do you get a commission?', pts: -40, reply: [['mordecai', "Get out of my guild. ...Come back tomorrow. But get out."]] },
      ],
    },
    {
      id: 'mordecai_brew', hearts: 6, title: 'Brewing Lesson',
      scene: [
        ['mordecai', "Hold this. Stir it. Clockwise. CLOCKWISE, Carl."],
        [null, '*The cauldron belches a cloud of green smoke. Your eyebrows are now noticeably shorter.*'],
        ['mordecai', "You know why I bother teaching you? Because one day I won't be here, and you'll need to make your own mistakes."],
      ],
      ask: ['mordecai', "So. You going to listen this time, or just nod?"],
      choices: [
        { label: 'Teach me everything.', pts: 150, gift: ['hp_potion', 3], reply: [['mordecai', "Good answer. Take these. Brewed them myself. Don't drink them all at once, I'm not cleaning that up."]] },
        { label: "You'll always be here.", pts: 80, reply: [['mordecai', "Kid, nobody's always anywhere. But I'll stay as long as they let me."]] },
        { label: 'Can I keep the eyebrows off?', pts: 30, reply: [['mordecai', "It's a look, all right. Not a good one. Stir the pot."]] },
      ],
    },
  ],
  zev: [
    {
      id: 'zev_pitch', hearts: 3, title: 'The Pitch',
      scene: [
        ['zev', "Carl! I'm workshopping a spin-off. 'Carl and Donut: Farm Hard.' Gritty. Emotional. Mostly explosions."],
        ['zev', "The execs want a catchphrase. Something punchy. Something you'd say right before kicking a goblin into a pond."],
      ],
      ask: ['zev', 'Give me something! Anything! The pitch meeting is in four minutes!'],
      choices: [
        { label: '"Goblins are fertilizer."', pts: 120, followers: 3000, reply: [['zev', "Carl. CARL. That's going on a T-shirt. That's going on a THOUSAND T-shirts."]] },
        { label: '"I\'m just here to farm."', pts: 40, reply: [['zev', "Humble. Relatable. The 18-to-900 demographic will hate it, but I respect it."]] },
        { label: '"No."', pts: -30, reply: [['zev', "...Actually, the gruff refusal tests okay. I'm still disappointed in you personally."]] },
      ],
    },
    {
      id: 'zev_offcamera', hearts: 6, title: 'Off Camera',
      scene: [
        ['zev', "Can we talk somewhere the drones can't hear? Behind the trailer. Quick."],
        ['zev', "I'm not supposed to say this. Borant reviews my contract every season. If the numbers drop, I get... reassigned."],
        ['zev', "I don't want to be reassigned, Carl. I like this assignment. I like you guys."],
      ],
      ask: ['zev', "Is that dumb? It's dumb. Tell me it's dumb."],
      choices: [
        { label: "We'll keep the numbers up. Together.", pts: 150, gift: ['box_silver', 1], reply: [['zev', "Together. Okay. Here, a sponsor gift. I'm 'losing' it in your direction. Oops."]] },
        { label: 'Can Borant hear us right now?', pts: 60, reply: [[null, '*Zev looks up at the sky.*'], ['zev', "...Probably. Hi, Borant! Love the brand!"]] },
        { label: 'Sounds like a you problem.', pts: -60, reply: [['zev', "Right. Yeah. Of course. Content first. Forget I said anything."]] },
      ],
    },
  ],
  pook: [
    {
      id: 'pook_inventory', hearts: 3, title: 'Inventory Day',
      scene: [
        ['pook', "Pook is counting stock! One sandwich. Two sandwich. Three... Pook has lost count. Again."],
        ['pook', "Pook has been counting for four hours. Pook's eyes are doing a spiral."],
      ],
      ask: ['pook', 'Would crawler help Pook count?'],
      choices: [
        { label: "Sure, I'll help.", pts: 120, gift: ['sandwich', 3], reply: [
          [null, '*Together you count 212 sandwiches, 40 seed packets, and one sandwich that might be a seed packet.*'],
          ['pook', "Crawler is very good at counting! Pook will give discount! ...Pook will NOT give discount. But Pook will give these."],
        ] },
        { label: "Just write down 'a lot.'", pts: 40, reply: [['pook', "'A lot.' Pook likes this. Pook's accountant will not."]] },
        { label: "I'm busy.", pts: -30, reply: [['pook', 'Pook understands. Pook will count alone. In the dark. Probably forever.']] },
      ],
    },
    {
      id: 'pook_cousin', hearts: 6, title: "Pook's Cousin",
      scene: [
        ['pook', 'Pook got a letter from cousin on level five! He says crawlers down there are mean. And none of them ever say hi from Pook.'],
        ['pook', 'Pook wonders...'],
      ],
      ask: ['pook', 'Would crawler tell cousin that Pook is doing well? That Pook has a friend?'],
      choices: [
        { label: "I'll say you're the best Bopca around.", pts: 150, gift: ['tunamelt', 2], reply: [['pook', 'Pook will remember this forever. Here, from the special shelf. Pook was saving them for a friend.']] },
        { label: "I'll tell him you said hi.", pts: 60, reply: [['pook', 'Pook thanks you! Cousin will pretend not to care. Cousin will care.']] },
        { label: 'He still charges me full price.', pts: 10, reply: [['pook', 'Yes. That is family. Pook also charges full price.']] },
      ],
    },
  ],
};

// Friend banter. NEWS_REACTIONS: what each friend says the next time you talk to
// them after something notable happened (see recordNews in banter.js). {n}, {g},
// {who} and {item} are filled from the news. BANTER_SCENES: short exchanges two
// friends have in speech bubbles when they're near each other and Carl; scenes
// with `news` only play while that news is recent.
const NEWS_REACTIONS = {
  donut: {
    died: "Carl, you DIED. On camera. I had to do my sad face for the viewers for an entire hour. Do you know how exhausting that is?",
    passout: "You passed out in the dirt last night, Carl. Borant dragged you home by the ankle. I filmed it. For legal reasons.",
    hoarder: "We beat the Hoarder, Carl! Well, I beat the Hoarder. You were also there. Kicking.",
    krakaren: "Calamari, Carl! We're eating calamari tonight! ...Is it safe to eat a clone? Don't answer. I'm eating it.",
    deep: "Level {n}, Carl! The air down there is all damp and dramatic. My fur is NOT built for this.",
    mandrake: "Carl, that mandrake screamed so loudly I lost a whisker. I'm sending Borant the bill.",
    bigship: "{g} gold in one night! Carl, we're RICH. Buy me something sparkly before you spend it all on seeds.",
    selfown: "Carl. You blew YOURSELF up. The chat called it 'peak content.' I called it 'embarrassing for our brand.'",
    sponsor: "You caught The Sponsor?! Carl, do you know how many ad reads that fish owes us?",
    badgift: "I heard you gave {who} a {item}. Carl, I'm begging you. Let ME pick the gifts.",
    rival: "Did you see Brock's FACE when he yielded? I'm making it my profile picture. Forever.",
    rival_won: "Brock beat us down the stairs, Carl. He made a whole video about it. I watched it four times. Out of spite.",
  },
  mongo: {
    died: '*Mongo sniffs you all over, very carefully, as if checking that every part of you came back.*',
    passout: '*Mongo lies down on your feet and refuses to move. You are not going anywhere tonight.*',
    hoarder: '*Mongo smells cat on you and growls at nothing for a full minute.*',
    krakaren: '*Mongo smells the tentacle on you and tries to eat your leg. Lovingly.*',
    deep: '*Mongo sniffs the dungeon dust on your boxers and sneezes impressively.*',
    mandrake: '*Mongo has his head buried in a bush. He has not forgiven the mandrake.*',
    selfown: '*Mongo looks at your singed eyebrows and tilts his head. He is concerned. Mostly concerned.*',
  },
  katia: {
    died: "Carl! Donut told me you died yesterday. She was very calm about it. Too calm. Are you okay?",
    passout: "Did Borant really drag you home by the ankle? Carl, set an alarm. Or let me walk you home. Either one.",
    hoarder: "You beat the Hoarder! Everyone in the Plaza is talking about it. Zev hasn't stopped screaming.",
    krakaren: "The Krakaren Clone? Carl, that thing had more arms than this whole Plaza. I'm so proud of you.",
    deep: "Level {n}? Next time, take me. Someone needs to stand in front of the scary stuff, and you're barefoot.",
    mandrake: "Was that the mandrake I heard all the way from the Plaza? My ears are still ringing.",
    bigship: "Donut says you shipped {g} gold of stuff last night. Dinner's on you. I'm kidding. Mostly.",
    selfown: "I saw the replay of you blowing yourself up. I'm not laughing. I'm... okay, I laughed a little.",
    sponsor: "You caught The Sponsor! I didn't think it was real. Zev says it has a better contract than he does.",
    badgift: "So, um. {who} told me about the {item}. Maybe next time ask me first?",
    rival: "You beat up that Brock guy? Good. He tried to sell me energy slurry in the Plaza. Twice.",
    rival_won: "I heard that Brock guy beat you to the stairs. Next time take me. I'll hold the door. On his face.",
  },
  mordecai: {
    died: "Heard you died. Welcome to the club. The dues are terrible. Don't make a habit of it.",
    passout: "Passed out in the dirt and paid Borant for the privilege? Kid, even I go to bed eventually.",
    hoarder: "So the Hoarder's dead. Good. Don't celebrate too long. The deeper floors don't care what you killed yesterday.",
    krakaren: "A Borough Boss. Hm. You might actually survive this place. Don't quote me.",
    deep: "Level {n}. That's further than most. Pack more potions than you think you need. Then double it.",
    mandrake: "Bring me the next mandrake before it screams itself to death. They brew beautifully.",
    selfown: "You blew yourself up with your own Hob-Lobber. I told you. Rocks and monsters. Not your feet.",
    sponsor: "You caught The Sponsor. In all my years I've seen two crawlers do that. One of them was drunk.",
    badgift: "{who} is still muttering about some {item}. Even I know better than that, and I live in a cave.",
    rival: "Heard you put the Vantage kid on the ground. Sponsored crawlers are all flash. Don't get cocky. Flash kills people too.",
    rival_won: "The sponsor kid beat you down? He had a map, Carl. Borant sells those. Break more rocks.",
  },
  zev: {
    died: "Carl! Your death clip is our second most-watched moment EVER! Please don't do it again. ...Unless?",
    passout: "The 'Crawler Dragged Home By Ankle' clip is trending. I'm torn between worried and thrilled.",
    hoarder: "The Hoarder fight! Carl, the numbers! I need to sit down. Ideally on a pile of money.",
    krakaren: "Borough Boss DOWN! Legal just called to say the original Krakaren is 'considering its options.'",
    deep: "Level {n}! The deep-dive audience is SO loyal. They're like barnacles. Wonderful, money-shaped barnacles.",
    mandrake: "That mandrake scream! It's my ringtone now. I'll never answer the phone again. Worth it.",
    bigship: "{g} gold in one night?! Hustle culture is SO in right now.",
    selfown: "The self-explosion! Nine billion views! I'm not saying do it again, but I'm not NOT saying it.",
    sponsor: "You caught The Sponsor. Please, PLEASE don't eat it on camera. We have contracts.",
    badgift: "Carl, I heard about the {item} for {who}. As your PR rep: yikes. As your friend: also yikes.",
    rival: "Carl! The Brock beatdown is a RIVALRY ARC. The Syndicate LOVES a rivalry arc. Please never become friends.",
    rival_won: "Brock's 'GG no re' clip is everywhere. As your PR rep, I'm calling it a 'strategic loss.' Win the next one.",
  },
  pook: {
    died: "Pook heard crawler died! Pook was very sad. Pook also checked if crawler had store credit. Crawler did not.",
    passout: "Pook saw Borant drag crawler past the shop last night. Pook waved. Crawler did not wave back.",
    hoarder: "Crawler beat the Hoarder! Pook's cousin says the cats ran right past his shop. They did not buy anything.",
    krakaren: "Crawler beat the Krakaren Clone! Pook will put up a sign. 'Crawler shops here.' Free advertising!",
    deep: "Level {n}! Say hi to Pook's cousin if you see him. He will still charge you full price.",
    bigship: "Crawler made {g} gold! Pook is restocking the expensive shelf. No reason.",
    sponsor: "The Sponsor! Pook would buy it from you, but nobody can afford it. Not even Pook.",
    badgift: "Pook heard about the {item}. Next time crawler should ask Pook for gift advice. Pook charges a small fee.",
  },
};

const BANTER_SCENES = [
  { id: 'dm_sit', lines: [['donut', 'Mongo, sit.'], ['mongo', '*sits on Donut*'], ['donut', 'MONGO.']] },
  { id: 'dm_brains', lines: [['donut', "Mongo, I'm the brains of this operation."], ['mongo', '*chirp?*'], ['donut', "And you're the... teeth. Yes. Good boy."]] },
  { id: 'dm_died', news: 'died', lines: [['donut', 'Mongo, Carl died yesterday.'], ['mongo', '*sad squeak*'], ['donut', "He got better. Don't make a whole thing of it."]] },
  { id: 'dk_tiara', lines: [['katia', 'Donut, is that a new tiara?'], ['donut', "Same tiara. I simply wear it better every day."], ['katia', '...Fair.']] },
  { id: 'dk_pants', lines: [['donut', 'Katia, tell Carl pants are a sign of respect.'], ['katia', 'Carl, pants are a sign of respect.'], ['donut', 'See? Consensus.']] },
  { id: 'dk_selfown', news: 'selfown', lines: [['katia', 'Did he really blow himself up?'], ['donut', 'Twice, if you count his dignity.']] },
  { id: 'dk_hoarder', news: 'hoarder', lines: [['katia', "So how were the 'cats'?"], ['donut', 'Not cats. Nothing like cats. A disgrace to the name.']] },
  { id: 'dk_passout', news: 'passout', lines: [['katia', 'Is Carl okay? I heard Borant dragged him home.'], ['donut', 'By the ANKLE, Katia. In front of everyone.']] },
  { id: 'dz_smile', lines: [['zev', 'Donut! Smile for the drone!'], ['donut', "I'm always smiling. It's just very subtle and expensive."]] },
  { id: 'dz_font', lines: [['donut', 'Zev, I want a bigger font on my name.'], ['zev', "It's already our biggest font!"], ['donut', 'Then invent a bigger one.']] },
  { id: 'dz_bigship', news: 'bigship', lines: [['zev', '{g} gold! Donut, your cut is...'], ['donut', 'Everything, Zev. My cut is everything.']] },
  { id: 'dz_krakaren', news: 'krakaren', lines: [['zev', 'Donut! Krakaren highlights! Your best angle?'], ['donut', "All of them, Zev. Use all of them."]] },
  { id: 'dmo_table', lines: [['mordecai', 'Cat. Get off my potion table.'], ['donut', "I'm not sitting. I'm presiding."]] },
  { id: 'dmo_coat', lines: [['donut', 'Mordecai, brew me a shinier coat.'], ['mordecai', 'No.'], ['donut', 'Rude, but noted.']] },
  { id: 'dmo_deep', news: 'deep', lines: [['mordecai', 'How deep did he get?'], ['donut', 'Level {n}. I did most of it.'], ['mordecai', 'I believe that more than I should.']] },
  { id: 'dp_tiara', lines: [['pook', 'Princess! Pook has a new tiara in stock!'], ['donut', 'Carl. Carl. CARL.']] },
  { id: 'dp_discount', lines: [['donut', 'Pook, do I get a celebrity discount?'], ['pook', 'Pook gives princess the celebrity price!'], ['donut', 'Which is...?'], ['pook', 'Higher. Celebrities can afford it.']] },
  { id: 'km_boot', lines: [['katia', "Mongo, that's my boot."], ['mongo', '*chews faster*'], ['katia', "...It's your boot now."]] },
  { id: 'km_good', lines: [['katia', "Who's a good dinosaur?"], ['mongo', '*SCREECH of agreement*']] },
  { id: 'kz_stage', lines: [['zev', 'Katia! Thought about a stage name?'], ['katia', 'My name is Katia.'], ['zev', 'Bold. Authentic. Love it.']] },
  { id: 'kz_died', news: 'died', lines: [['zev', 'Katia, how do we spin Carl dying?'], ['katia', "We don't spin it, Zev. We bring him soup."]] },
];

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

// Dinner nights (see dinner.js). A guest's reaction to the dish is `dishes[item]`
// if there is one, else the line for how they feel about it (`love`, `like`,
// `neutral`, `hate`), plus `cooked` when Carl made it himself. `talk` scenes
// play after the meal, in order, gated by hearts.
const DINNER_LINES = {
  katia: {
    invite: ["Dinner? At your place? I'd love to! I'll be there at six.", "You're cooking? For me? ...Okay, yes. Six o'clock. I'm bringing my appetite."],
    tooSoon: "We just had dinner, Carl! Let's do it again next week. I'm still full.",
    tooLate: "It's too late for dinner tonight. Ask me earlier tomorrow?",
    arrive: 'Hi! Something smells... well, something smells. What are we having?',
    love: "Carl, this is amazing. I haven't had a meal like this since before. Thank you.",
    like: 'Mm! This is really good. You can cook! Who knew?',
    neutral: "It's... food! It's food, Carl. And honestly, the company is the good part.",
    hate: "I... okay. I'm going to be brave about this. For you. *chews heroically*",
    cooked: 'You made this yourself? That makes it taste twice as good.',
    dishes: {
      stew: "Hobgoblin Stew! My grandma made a stew like this. Minus the hobgoblins. I think.",
      pie: "Pie?! Carl, you made pie? I'm going to cry into it. Is that allowed?",
      bomberry: "Carl, did that plate just tick? CARL!",
    },
    talk: [
      [0, [['katia', "Before all this, I used to have people over every Sunday. I forgot how much I missed it."], ['donut', "Carl doesn't have people over. He has Mongo over. It's not the same."]]],
      [3, [['katia', 'Sometimes my body changes shape when I sleep. Last night I woke up as a door. Mongo tried to walk through me.'], ['donut', 'We have ALL been there, Katia.']]],
      [6, [['katia', "Can I say something cheesy? Whatever happens down there, this is what I'm fighting for. Dinners like this."], ['donut', "That's not cheesy. That's ratings."]]],
    ],
    bye: "Thanks for dinner, Carl. Same time next week? I'll bring dessert. Okay, Pook's dessert.",
    stoodUp: "I sat at your table until ten, Carl. Donut kept me company. She was very kind about you. Mostly.",
  },
  zev: {
    invite: ["A dinner episode? Carl, the sponsors are going to LOVE this. Six o'clock! I'll bring a ring light.", "Dinner! At the Homestead! Intimate, authentic, very relatable. See you at six!"],
    tooSoon: "We just did a dinner episode, Carl. Overexposure is a real thing. Next week!",
    tooLate: "Too late tonight, Carl. Prime time is over. Ask me tomorrow!",
    arrive: 'Okay, the lighting in here is terrible, but we can call it rustic. What are we eating?',
    love: "Carl! This is SO good. And it photographs beautifully. Hold still, I'm posting this.",
    like: "Ooh, cute plating! Very farm-to-table. Very 'crawler next door.'",
    neutral: "It's fine! It's fine. The audience doesn't watch for the food, they watch for your face.",
    hate: "Carl. CARL. Is this a fish? We have TALKED about fish. I'm going to eat the garnish.",
    cooked: "Homemade? Oh, the authenticity numbers on this are going to be off the charts.",
    dishes: {
      pie: "Hoarder's Gourd Pie! Carl, the comments are already calling you 'Chef Pantsless.' It's trending!",
      sponsorfish: "Is that... The Sponsor? On a plate? Carl, that is a LEGAL issue. Several sponsors are watching this.",
      bomberry: "Oh, a bomb dish? Very edgy. Very ... Carl, why is it smoking?",
    },
    talk: [
      [0, [['zev', "Fun fact: dinner episodes have a ninety percent completion rate. Breakfast episodes? Twelve. Nobody likes breakfast."], ['donut', 'I like breakfast. I have it six times a day.']]],
      [3, [['zev', "Off the record, Borant wanted me to slip you a sponsored hot sauce. I didn't. You're welcome."], ['donut', 'Was it a good hot sauce, Zev?'], ['zev', '...It was SUCH a good hot sauce.']]],
      [6, [['zev', "You know, nobody at Borant has ever invited me over for dinner. Not once. Thanks, Carl. I'm not filming this part."], ['donut', "He's filming this part."]]],
    ],
    bye: "That's a wrap! Great episode, Carl. Thank you for having me. Seriously.",
    stoodUp: "You invited me to dinner and then GHOSTED me, Carl. On camera. Do you know what that did to our engagement?",
  },
  mordecai: {
    invite: ["Dinner? I don't do dinners. ...Fine. Six o'clock. I'm closing the shop early, so it had better be worth it.", "You're feeding me? Hm. Six. Don't make a fuss."],
    tooSoon: 'We just had dinner, kid. Once a week is plenty of feelings for me.',
    tooLate: "It's late, crawler. Ask me tomorrow, and earlier.",
    arrive: "Nice place. Smaller than my last guild. Cleaner, too. Where's the food?",
    love: "...Now THAT is a meal. I'd forgotten food could taste like this.",
    like: "Not bad, kid. Not bad at all.",
    neutral: "Food's food. I've eaten worse. I've eaten a lot worse.",
    hate: "You fed me THIS? I've trained a hundred crawlers and not one of them tried to poison me at the table.",
    cooked: 'You cooked it yourself. Hm. Good. A crawler who can feed himself lasts longer.',
    dishes: {
      stew: 'Hobgoblin Stew. Real stew, with real hobgoblin. Takes me back. Way back.',
      beer: "Beer for dinner. Kid, I'm proud of you and worried about you in equal measure.",
      bomberry: 'Bomb Berries. On the table. Get down!',
    },
    talk: [
      [0, [['mordecai', "Rule one of crawling: eat when you can. Rule two: sit with your back to the wall. You've got me facing the door."], ['donut', "That's because you're the guest, Mordecai. The guest gets the view."]]],
      [3, [['mordecai', "I've had a lot of crawlers. Most of them never thought to feed their guide. You're an odd one, Carl."], ['donut', 'He gets it from me.']]],
      [6, [['mordecai', "A long time ago, I used to cook for my whole guild. Big pots. Loud tables. I'd forgotten that. Thanks for reminding me."], ['donut', "...Mordecai, that's lovely. I'm not crying. Cats don't cry."]]],
    ],
    bye: "Thanks for the meal, kid. Now go to sleep. You've got a Stairwell in the morning.",
    stoodUp: "I closed the guild early for you, crawler. Sat in your cabin like an idiot. Don't do that again.",
  },
  pook: {
    invite: ['Dinner?! Pook is invited to DINNER? Pook will close the shop at six! Pook will wear the good apron!', "Pook accepts! Pook has never been invited anywhere that wasn't a delivery!"],
    tooSoon: 'Pook already had dinner with Crawler this week! Pook does not want to be greedy. Next week!',
    tooLate: "It is too late for dinner! Pook is already in pajamas. Tomorrow, maybe!",
    arrive: "Pook is here! Pook brought nothing! Pook's apron is very clean! What does Crawler serve?",
    love: 'OH! Pook has never tasted something so good! Pook would sell it for a fortune, but Pook ate it!',
    like: "Very good! Pook gives this four Pooks out of five!",
    neutral: "Pook eats it all! Pook is a polite guest! ...Pook would add salt.",
    hate: "Pook... Pook will eat this to be polite. Pook will be very quiet for a while.",
    cooked: "Crawler made this himself?! Pook will tell every customer! Pook might charge them to hear it!",
    dishes: {
      tunamelt: "A Tuna Melt! From Pook's own shelf! Pook is eating Pook's own merchandise! It is wonderful!",
      corn: "Corn! Pook's favorite! Pook will eat it in a circle! Watch!",
      bomberry: "Pook does not know this dish. Pook thinks it is ticking.",
    },
    talk: [
      [0, [['pook', 'Pook sells food all day, but nobody ever cooks for Pook! This is a very new feeling.'], ['donut', 'Pook, sweetie, you have sauce on your ears.']]],
      [3, [['pook', 'Pook has a secret. Pook keeps one sandwich under the counter for crawlers who come in sad. Crawler has never come in sad. Pook is glad.'], ['donut', 'He comes in pantsless. That is a kind of sad.']]],
      [6, [['pook', "Pook was a shopkeeper for a very long time before Crawler came. Pook had customers. Now Pook has a friend."], ['donut', "Oh, Pook. Carl, give him the rest of the food. ALL of it."]]],
    ],
    bye: "Thank you for dinner, Crawler! Pook will remember it forever! Pook will remember it at work tomorrow!",
    stoodUp: "Pook closed the shop and waited at Crawler's table. Pook ate a napkin. Pook was very hungry.",
  },
};

// Donut's aside after the guest reacts, by how the dish went.
const DINNER_DONUT = {
  love: ['Carl! You fed a guest properly! I am so proud I could post about it.', "Look at that face. That's a five-star review, Carl. Frame it."],
  like: ["Not bad, Carl. I'd give it three paws. Four if you'd let me have some.", 'See? You CAN entertain. You just need a cat to supervise.'],
  neutral: ["The food's fine, Carl. It's the presentation. Next time, add a tiara.", 'I would have gone with kibble. Just saying. Premium kibble.'],
  hate: ["Carl, that's the worst thing you've ever served. And you once served me a rat.", "Oh no. Oh no no no. Carl, the viewers saw that."],
  cooked: ['Homemade, Carl! The Syndicate LOVES a homemade episode.'],
};

// Donut's live commentary in the Stairwell (see commentary.js). {n} is a level,
// {item} an item name. `lowhp_close` replaces `lowhp` once Donut has 6+ hearts.
const DONUT_COMMENTARY = {
  newdepth: [
    'Level {n}! New personal best, Carl. Wave to the drones!',
    "Level {n}. I can't believe they let us this deep without a stylist.",
    'Ooh, level {n}. It smells like adventure. And feet. Mostly feet.',
    'Level {n}! The viewers will LOVE this. Look heroic.',
  ],
  floor: [
    'Back down we go!', "This level again? Fine. I'll pretend it's new.",
    "Stay close, Carl. I'm not carrying you.", 'Find the stairs. My paws are cold.',
  ],
  safe: [
    'A safe room! I need a nap and a snack. In that order.',
    'Safe room! Buy me something from the Bopca. For morale.',
  ],
  boss_hoarder: ["Carl, those are NOT cats. I'm a cat. I would know."],
  boss_krakaren: ["It's a giant angry squid, Carl. Kick it in the face. All of the faces."],
  bosshalf: ["It's half dead, Carl! Keep kicking!", 'Look at it wobble! The fans are screaming!'],
  bosslow: ["It's almost dead! Don't you DARE die now!", 'Finish it! Finish it! FINISH IT!'],
  bosskill_hoarder: ['We killed the Hoarder! Somebody get me a microphone!'],
  bosskill_krakaren: ["CALAMARI! We're LEGENDS! Say something cool for the highlight reel!"],
  lowhp: [
    'Carl, you\'re bleeding! Drink a potion! Eat a sandwich! Do SOMETHING!',
    'Your health bar is a very ugly color right now, Carl!',
    "If you die, I'm keeping the farm. DRINK SOMETHING.",
  ],
  lowhp_close: [
    "Carl, please be okay. I can't do this without you. Eat something. Now.",
    "Don't you dare leave me down here. Heal up. That's an order from a princess.",
  ],
  bighit: [
    "Ouch! I felt that one, and I wasn't even the one who got hit!",
    'Hey! Nobody hits my Carl but me!', "Dodge, Carl! It's like dancing, but with less dying!",
  ],
  cleared: ['Floor cleared! Another flawless performance by me. And you.', "That's everyone! Take a bow, Carl. No, a deeper bow."],
  stairs: ['Stairs! Good job, Carl. I was about to find them.', 'The way down! Lead on, pantsless one.'],
  chest: ['Loot! Open it, open it, OPEN IT!', "A chest! If there's a tiara in there, it's mine."],
  gem: ['Ooh, sparkly! That {item} would look divine on me.', 'Is that a {item}? Give it to me. For safekeeping.'],
  multikill: ["Triple kill! That's going in the trailer!", "Look at you go! I'm almost impressed!", 'Combo! The viewers are SCREAMING!'],
  selfown: ['Carl! My FUR! You singed my FUR!', 'Did you just blow yourself up? On PURPOSE?'],
  sniff: [
    "Mongo found the stairs! Who's a good boy? Not you, Carl. Mongo.",
    'That rock, Carl. Mongo says that rock. Kick it.',
    'My baby is a GENIUS. I trained him, obviously.',
  ],
  rival: [
    "Carl, it's HIM. The orange jacket. Don't let him get to the stairs first.",
    "Ugh, Brock. His sponsor is an energy drink, Carl. An ENERGY DRINK.",
    "Brock is here. Kick him or beat him downstairs. Ideally both.",
  ],
  rival_chest: ["He took OUR chest, Carl! That was going to be my tiara!", 'Carl! Brock is stealing our loot! On camera!'],
  rival_chest_carl: ["Ha! Too slow, Brock! That chest is OURS.", 'Did you see his face, Carl? Screenshot it. Frame it.'],
  rival_win: ["He beat us down the stairs. Carl, I am going to be insufferable about this for DAYS.", "Lost to BROCK. The chat is merciless, Carl. Merciless."],
  rival_beaten: ["We beat Brock! Somebody clip that! Put it on a loop!", "Look at him run. Tell your sponsor we said hi, Brock!"],
  sponsor: [
    'Did we just get SPONSORED? I want a cut. A big cut.',
    'Brand deal complete! Tell Zev my rate just doubled.',
    "Smile for the sponsors, Carl. No, a real smile. That's worse. Stop.",
  ],
};

// Katia as a party member (see party.js). Invite her at PARTY_HEARTS hearts.
// Mongo has his own pet slot and comes along at MONGO_CRAWL_HEARTS hearts.
const PARTY_LINES = {
  katia: {
    join: [
      "Really? Yes! Let me grab my... I don't have anything. Let's go!",
      "Finally! I've been practicing my shield. Stand behind me.",
      'A crawl with you and Donut? I thought you would never ask.',
    ],
    tooLate: "It's late, Carl. Ask me again in the morning?",
    leave: [
      "Okay! Thanks for today, Carl. That was fun. Terrifying, but fun.",
      'Heading home. Wake me if you need someone to stand in front of things.',
    ],
    late: "It's getting late. I'm heading home, Carl. Same time tomorrow?",
    chat: [
      'You kick, I block, Donut takes the credit. Teamwork!',
      'My arm keeps wanting to turn into a shield. I think it likes you.',
      'Is it weird that this is the most fun I have had since the world ended?',
      "If anything bites you, it has to get through me first. That's the deal.",
    ],
    fight: ['Shield up!', 'Get behind me!', 'Hah! Take that!', 'Not today!', 'Carl, on your left!'],
    block: ['Got it!', "I've got you!", 'Blocked!', 'Nope!'],
    idle: ['Which way, Carl?', 'I could get used to this.', 'Mongo would love it down here.', 'Stay close. I mean it.'],
  },
  mongo: {
    join: [
      '*Mongo does a full-body wiggle and sprints for the gate. Then back to you. Then for the gate again.*',
      '*Mongo SCREECHES. You are fairly sure that was a yes.*',
      '*Mongo drops the stick he was chewing. This is more important than the stick.*',
    ],
    tooLate: '*Mongo yawns enormously and flops over. The Stairwell can wait until morning.*',
    leave: [
      '*Mongo gives you one long, wounded look, then trots back to the farm.*',
      '*Mongo headbutts your knee goodbye and lopes off home.*',
    ],
    late: 'Mongo yawned and trotted home to the farm for the night.',
    chat: [
      '*Mongo has something in his mouth. You decide not to ask what floor it came from.*',
      '*Mongo leans against your leg, panting happily. His breath smells like goblin.*',
      '*Mongo sniffs the air, growls at a shadow, then looks at you for praise.*',
    ],
    charge: ['*RAWR!*', '*SCREECH!*', '*CHOMP*', '*thunderous dinosaur noises*'],
    sniff: ['*sniff sniff... SNIFF*', '*snuffle snuffle*'],
    found: ['*SCREECH!* (He means: HERE, CARL.)', '*paws at the rock and wags*'],
    idle: ['*chirp*', '*sniffs a skull*', '*growls at the dark*', '*sneezes*'],
  },
};

// Friendship perks: what each friend does for Carl once he reaches `hearts`.
// The effect lives where it applies (shop prices, addFollowers, the morning).
const FRIEND_PERKS = {
  donut: { hearts: 0, text: 'Magic Missile hits harder and fires faster as her hearts grow' },
  mongo: {
    hearts: 5, text: 'Digs up a present for you most mornings',
    presents: ['wild_garlic', 'blackberry', 'spice_berry', 'crystal_fruit', 'copper', 'iron', 'quartz', 'rat_tail', 'tusk'],
  },
  katia: { hearts: 4, text: 'Will join your party for a day in the Stairwell' },
  mordecai: { hearts: 5, text: '15% off everything at the Guild Supply', discount: 0.15 },
  zev: { hearts: 5, text: '+20% followers from everything', followers: 0.2 },
  pook: { hearts: 5, text: "15% off everything at Pook's Provisions", discount: 0.15 },
};

// Zev's daily sponsor deals (see sponsors.js). {n} in a line is the deal's goal;
// goal(deepest) sets it and ok() says whether the deal can be offered today.
const SPONSOR_DEALS = [
  {
    id: 'kicks', sponsor: 'Sole Survivor Foot Cream', tier: 1, task: 'Kick {n} monsters to death',
    goal: deep => 8 + Math.min(8, Math.floor(deep / 3)),
    pitch: 'Sole Survivor Foot Cream wants those famous bare feet in action. Kick {n} monsters into oblivion. Moisturize after.',
    thanks: "Sole Survivor's sales are up 400%. Nobody knows who's buying it. Probably your fans. Your fans are weird, Carl.",
  },
  {
    id: 'donut', sponsor: 'Princess Kibble', tier: 1, task: 'Let Donut finish off {n} monsters',
    goal: deep => 5 + Math.min(5, Math.floor(deep / 4)),
    pitch: "Princess Kibble wants their brand ambassador on screen. That's Donut. Let her land {n} killing blows. Don't steal her kills, Carl.",
    thanks: "Princess Kibble sent Donut a lifetime supply. Donut sent it back. 'Too common.' They're thrilled anyway.",
  },
  {
    id: 'chests', sponsor: 'Loot Crate Weekly', tier: 1, task: 'Open {n} chests in the Stairwell',
    goal: deep => deep >= 10 ? 3 : 2,
    pitch: 'Loot Crate Weekly wants unboxing content. Find and open {n} chests down in the Stairwell. React big. Bigger. Good.',
    thanks: 'Loot Crate Weekly says the unboxing numbers broke their chart. They want to know if you would unbox a crate of their crates.',
  },
  {
    id: 'gems', sponsor: 'Sparkle Cola', tier: 2, task: 'Dig up {n} gems (quartz counts)',
    goal: deep => deep >= 14 ? 3 : 2, ok: () => G.stats.deepest >= 5,
    pitch: 'Sparkle Cola wants SPARKLE. Dig up {n} gems. Quartz counts. Sparkle Cola is not picky. Sparkle Cola is mostly sugar.',
    thanks: "Sparkle Cola is naming a flavor after you. It's called 'Carl.' It tastes like rocks. They say that's a compliment.",
  },
  {
    id: 'bombs', sponsor: 'Boom Juice Energy Drink', tier: 2, task: 'Kill {n} monsters with bombs',
    goal: deep => 3 + Math.min(2, Math.floor(deep / 10)),
    ok: () => G.stats.bombs > 0 || countItem('bomb') + countItem('megabomb') > 0,
    pitch: 'Boom Juice Energy Drink wants explosions. Specifically, monsters inside explosions. {n} of them. Can you do that? Of course you can.',
    thanks: "Boom Juice says, and I quote, 'KABOOM.' That's the whole note. They loved it.",
  },
  {
    id: 'team', sponsor: 'Friendship Is Magic Cereal', tier: 2, task: 'Kill {n} monsters with a friend in your party',
    goal: () => 8,
    ok: () => !!G.party || mongoAlong() || canInvite('katia') || canBringMongo(),
    pitch: "Friendship Is Magic Cereal wants teamwork! Bring a friend into the Stairwell and win {n} fights together. Katia, Mongo, whoever. The cereal doesn't care.",
    thanks: "Friendship Is Magic Cereal is putting you and your buddy on the box! Not Donut. Donut has her own box deal.",
  },
  {
    id: 'rush', sponsor: 'Early Bird Coffee', tier: 2, task: 'Reach level {n} of the Stairwell before noon',
    goal: deep => Math.max(3, deep + 1), ok: () => G.time < 660,
    pitch: "Early Bird Coffee wants a morning crawl! Get down to level {n} before noon. Coffee not included. Coffee is never included.",
    thanks: "Early Bird says that was the most caffeinated thing they've ever seen, and they've seen inside their own factory.",
  },
  {
    id: 'flawless', sponsor: 'Untouchable Insurance', tier: 3, task: 'Clear a Stairwell floor without getting hit',
    goal: () => 1,
    pitch: "Untouchable Insurance wants a flawless floor. Kill everything on one level without taking a single hit. They're very confident in you. Legally, they are not liable.",
    thanks: "Untouchable Insurance is running the footage in their ads. You're the face of not getting hurt. Given everything, that's hilarious.",
  },
];

const SPONSOR_TIERS = {
  1: { box: 'box_bronze', followers: 1000 },
  2: { box: 'box_silver', followers: 2500 },
  3: { box: 'box_gold', followers: 6000 },
};

const ZEV_SPONSOR = {
  intro: "Carl! Carl. I have a sponsor on the line. Here's the pitch:",
  yes: ["YES. I'll tell them you said yes. I already told them you said yes.", 'Love it. Love YOU. Go make content.'],
  no: ["Okay! No pressure! A little pressure. They'll call back tomorrow.", "Fine. I'll tell them you're 'creatively booked.'"],
};

const DONUT_BATTLE_QUIPS = [
  'Magic Missile!', 'Take THAT!', 'Carl! Did you see that?!', 'Nobody touches my Carl!',
  'Another one for the highlight reel!', 'Mongo would have liked that one.', 'Pew pew!', 'For the fans!',
];
// Brock Vantage, the rival crawler (see rival.js). {w}/{l} are Carl's race
// wins/losses against him, {n} how many times Carl has beaten him up.
const RIVAL_LINES = {
  arrive: [
    "Oh, cool, the no-pants guy. Hey chat, watch me beat a farmer to the stairs!",
    "Brock Vantage, Gnu-Wave Energy Slurry. Your chests are mine, barefoot. Nothing personal. It's content.",
  ],
  arrive_again: [
    "You again? Chat, it's the farmer. Somebody start a timer.",
    "Same floor, same no pants. Race you, Carl. Loser reads the sponsor ad.",
    "Record's {w} to {l}, Carl. I'm about to fix that.",
  ],
  arrive_beaten: [
    "Okay, so last time was a fluke. I've been doing leg day. Race me.",
    "Round two, Carl. Or three. Whatever. I don't count my losses on stream.",
    "My sponsor says I'm not allowed to lose to a farmer again. Don't make this weird.",
  ],
  taunt: [
    "Smash that follow button, chat!", 'Nice boxers. Did Borant lose your pants?', 'This floor is sponsored by me, winning.',
    "Is that cat narrating? I have a drone for that.", 'Drink Gnu-Wave! It tastes like lightning and regret!',
  ],
  shove: ['Out of the way, farmer!', 'Excuse me. Crawler coming through.', 'Move it, barefoot!'],
  dig: ["Sponsor map says it's this rock. Thanks, sponsor!", 'Stairs are right under here. Bye, Carl!'],
  found: ['Stairs! Chat, I am SO good at this.', 'And that, chat, is how a professional does it.'],
  chest: ['Mine! Chat, unboxing after the break!', 'Ooh, free loot. Thanks for holding it, Carl.'],
  carl_chest: ["Hey! I called that chest! In my head!", 'That was MY chest! Chat, are you seeing this?'],
  hurt: ['Ow! Not the face, I stream with this face!', "Hey! Chat, he's attacking me! Report him!", 'Rude!', 'Okay, okay, I get it!'],
  hurt_low: ["Fine! FINE! Truce?", "I'm calling my sponsor!", "Stop, my health bar is on camera!"],
  win: ['Smell ya later, farmer!', 'GG, no re!', 'First! Chat, clip that!'],
  lose: ["Whatever, my drone lagged.", 'This is so rigged.', "I let you win. For the algorithm."],
  yield: [
    "Okay! Okay! You win! Take the stuff and stop kicking!",
    "I yield! Chat, that never happened. Take it, Carl, just stop!",
    "That's {n} times now. My sponsor is going to drop me. Here, take it all!",
  ],
};

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
  crowd_pleaser:{ name: 'Crowd Pleaser', desc: 'The viewers voted to make your floor deadlier, and you survived it anyway. They are already voting on the next one.', box: 'box_silver', followers: 2000 },
  first_craft:  { name: 'Arts and Crafts', desc: 'You made something! Put it on the fridge. You do not have a fridge.', followers: 200 },
  box_open:     { name: 'Unboxing Video', desc: 'You opened a loot box. The dopamine is sponsored.', followers: 200 },
  upgrade:      { name: 'Enchanted Equipment', desc: "You upgraded a tool. Mordecai pretended not to be proud.", followers: 800 },
  season:       { name: 'Collapse Survivor', desc: 'You survived a seasonal collapse. The Homestead rebooted. You did not. Good job.', box: 'box_gold', followers: 10000 },
  heart_event:  { name: 'Very Special Episode', desc: 'You shared a heartfelt moment with a friend. The Syndicate wept. Then it asked for a sequel.', box: 'box_bronze', followers: 1500 },
  heart_all:    { name: 'Series Finale', desc: 'You saw every heart event. The writers room is out of ideas. Borant has ordered six more seasons anyway.', box: 'box_legendary', followers: 100000 },
  birthday:     { name: 'Many Happy Returns', desc: "You gave a friend a gift on their birthday. Borant does not celebrate birthdays. Borant celebrates quarterly earnings.", box: 'box_silver', followers: 2500 },
  party_up:     { name: 'Party of Three', desc: 'You invited Katia into the Stairwell. The audience finally has someone to root for who wears pants.', box: 'box_silver', followers: 2000 },
  dinner:       { name: 'Dinner Is Served', desc: "You had a friend over for dinner. The Syndicate rated it 'surprisingly wholesome' and asked where the explosions were.", box: 'box_silver', followers: 1500 },
  dinner_all:   { name: 'Dinner Party Circuit', desc: 'Katia, Zev, Mordecai and Pook have all eaten at your table. Borant is pitching a cooking show. You will not be paid.', box: 'box_gold', followers: 10000 },
  dinner_ghost: { name: 'Left on Read', desc: 'You invited a friend to dinner and never showed up. The audience gasped. Then they rewatched it four times.', followers: 300 },
  sponsored:    { name: 'Brought To You By', desc: 'You completed a sponsor deal. Somewhere, a brand manager wept with joy. Then billed Borant.', box: 'box_silver', followers: 2000 },
  sponsor_10:   { name: 'Brand Ambassador', desc: 'Ten sponsor deals done. Your face is on a cereal box, an energy drink and, inexplicably, a foot cream.', box: 'box_gold', followers: 10000 },
  mongo_crawl:  { name: 'Release the Dinosaur', desc: 'You took Mongo into the Stairwell. The monsters were not consulted.', box: 'box_silver', followers: 2000 },
  favor:        { name: 'Happy to Help', desc: 'You did a friend a personal favor. Borant has billed them for your time.', box: 'box_bronze', followers: 1000 },
  favor_story:  { name: 'Story Arc', desc: "You saw a friend's favor all the way through. The Syndicate is calling it 'character development.'", box: 'box_gold', followers: 10000 },
  favor_all:    { name: "Everybody's Hero", desc: 'You finished every friend favor. Five storylines, one pair of boxer shorts.', box: 'box_legendary', followers: 100000 },
  rival_race:   { name: 'Photo Finish', desc: 'You beat Brock Vantage down the stairs. His sponsor has issued a statement blaming the stairs.', box: 'box_bronze', followers: 1500 },
  rival_beaten: { name: 'Unsubscribed', desc: "You beat up a rival crawler until he handed over his loot. The Syndicate calls it 'competitive streaming.'", box: 'box_silver', followers: 3000 },
  rival_nemesis:{ name: 'Nemesis', desc: 'You have beaten Brock Vantage five times. He has started a podcast about it.', box: 'box_gold', followers: 15000 },
  mail_first:   { name: "You've Got Mail", desc: 'A friend wrote you a letter. On paper. In a dungeon. The Syndicate finds this unbearably quaint.', box: 'box_bronze', followers: 500 },
  pen_pals:     { name: 'Pen Pals', desc: "Letters from all six friends, including one from a dinosaur. Borant's mailroom has asked you to make fewer friends.", box: 'box_gold', followers: 8000 },
  good_nose:    { name: 'Good Nose', desc: 'Mongo sniffed out the stairs for you. He would like a treat. He would like ALL the treats.', box: 'box_bronze', followers: 1000 },
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
