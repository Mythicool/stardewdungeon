'use strict';
// ---------------------------------------------------------------------------
// Friend mail: the letters friends send to the mailbox outside Carl's cabin.
// See mail.js for when each kind is sent.
//   thanks: after a loved gift (gift), a birthday gift (bday) or a good dinner
//           (dinner). {item} is what Carl gave or served.
//   recipe: sent once, at `hearts`, and teaches recipe `id`.
//   news:   about something Carl did lately (same kinds as recordNews).
//           {n}, {g}, {who} and {item} are filled from the news.
//   gifts:  [minHearts, item, count, text] for the occasional care package.
// ---------------------------------------------------------------------------

const MAIL_LETTERS = {
  donut: {
    thanks: {
      gift: "Carl, I am putting this in writing so there is a permanent record: the {item} was PERFECT. I have told the viewers you have taste now. Do not make me retract it.",
      bday: "Dearest Carl, thank you for the {item}. Bea never once got me a birthday present. I'm not crying. The fur is just very reflective today. Enclosed: something for you. Don't get used to it.",
      dinner: "Carl. The {item} was acceptable. Better than acceptable. If anyone asks, I cooked it.",
    },
    recipe: {
      hearts: 5, id: 'royal_tartare',
      text: "Carl, I have decided to share my Royal Tartare recipe with you. It was served at the Grand Champion banquet. You will make it exactly as written. No substitutions. NO garlic.",
    },
    news: {
      hoarder: "Carl, I've drafted a press release about the Hoarder. It refers to you as 'my assistant.' Please sign at the bottom. With your foot, if you must.",
      krakaren: "Dear Carl, I am writing to formally request calamari for every meal until further notice. You know why.",
      died: "Carl. You died. I'm writing this down so you have it in writing: don't. Love, Donut. (The love part is also in writing. Don't make it weird.)",
      deep: "Level {n}, Carl! My fur has never been so damp. I'm writing to Borant to demand a blow-dryer on every floor.",
      selfown: "Carl, I've enclosed a list of things you're not allowed to stand next to anymore. It is one item long. It is your own bomb.",
      sponsor: "You caught The Sponsor. I've already written to its agent. We're doing a cross-promotion. You're welcome.",
    },
    gifts: [
      [2, 'tunamelt', 1, "Carl, a fan sent me eleven Tuna Melts. I only need ten. This one is yours. Share it and I'll know."],
      [3, 'box_fan', 1, "My fan mail has started including presents for YOU. I don't understand it either. Here."],
      [6, 'diamond', 1, "Carl, a viewer sent me a diamond. I have six. You can have one, because you're my favorite. Tell Mongo it was a rock."],
    ],
  },
  mongo: {
    thanks: {
      gift: "*The envelope is soggy. Inside, in Donut's handwriting:* Mongo wants you to know he LOVED the {item}. He has not stopped running in circles. Please come and stop him. *A muddy paw print.*",
      bday: "*A chewed envelope. Inside, in Donut's handwriting:* Mongo says thank you for the {item}. He also says SCREECH. He insisted I include the SCREECH. *A paw print, and something he dug up for you.*",
      dinner: "*A paw print. That's all. It's a very grateful paw print.*",
    },
    news: {
      hoarder: "*A paw print, and a single cat whisker. Mongo is very proud of you. And of the whisker.*",
      died: "*Donut wrote this one:* Mongo slept on your pillow all night to keep it warm in case you came back. You did. He's pretending he didn't.",
      deep: "*An envelope full of dirt. Mongo has dug his own Level {n} next to the hut. It goes down about a foot.*",
    },
    gifts: [
      [2, 'rat_tail', 3, "*A soggy envelope with three rat tails in it. A paw print. Mongo has given you the greatest gift he knows.*"],
      [4, 'tusk', 2, "*Two tusks, tied with Donut's ribbon. Donut has added a note: I did NOT give him the ribbon.*"],
      [6, 'ruby', 1, "*A very shiny rock, licked clean. It's a Blood Ruby. Mongo has no idea. He just thought you'd like it.*"],
    ],
  },
  katia: {
    thanks: {
      gift: "Carl, thank you for the {item}. I keep looking at it. It's silly, but nobody's given me something just because in a long time. See you in the Plaza. Katia",
      bday: "Carl! Thank you for remembering my birthday, and for the {item}. I made you something back. It's not much, but I made it with my own hands. Both of the ones I had that day. Love, Katia",
      dinner: "Thank you for dinner. The {item} was wonderful, but honestly the company was the best part. Same time next week? Katia",
    },
    recipe: {
      hearts: 3, id: 'katia_soup',
      text: "Carl, you always look like you're running on fumes. Here's my mom's soup recipe. It fixes everything except dungeons. Make a big pot and bring Donut a bowl. Katia",
    },
    news: {
      hoarder: "Carl, I heard about the Hoarder. I'm so proud of you I could burst. Not literally. That was a different crawler. Be careful down there. Katia",
      krakaren: "A Borough Boss! The whole Plaza is talking about you. Please come by so I can see you're in one piece. Katia",
      died: "Carl, I heard you died. I know Borant brings you back. It still scared me. Next time you go down, take me with you? Katia",
      deep: "Level {n}? That's deeper than I've ever been. Write me back from down there if they have mail. They probably don't. Katia",
      selfown: "I watched the clip of you blowing yourself up. Three times. I'm sorry. I was worried every time. Katia",
    },
    gifts: [
      [2, 'sandwich', 2, "Made too many sandwiches again. Two are yours. Eat something that isn't on a stick for once. Katia"],
      [4, 'hp_potion', 2, "I picked up a couple of potions from Mordecai. You need them more than I do. Don't argue. Katia"],
      [6, 'mana', 1, "I found this crystal on my morning walk and thought of you. I don't know why. Maybe because it's sturdy and doesn't wear pants. Katia"],
    ],
  },
  mordecai: {
    thanks: {
      gift: "Kid. Got the {item}. Didn't need it. Using it anyway. That's as close to 'thank you' as I get in writing. M.",
      bday: "Nobody's remembered my birthday in a long time. The {item} was more than you had to do. There's something in here for you. Don't tell anyone I'm soft. M.",
      dinner: "Good dinner. The {item} was better than anything in this cave. Next time I'm bringing the beer. M.",
    },
    recipe: {
      hearts: 4, id: 'guild_grog',
      text: "Kid, you keep showing up to my counter looking half dead. Here's the Guild Grog recipe. It's what kept me alive for six floors. Don't drink it before a boss. Or do. M.",
    },
    news: {
      hoarder: "So the Hoarder's dead. Good work. The next one's worse. They're always worse. Check your potions before you go. M.",
      krakaren: "A Borough Boss. I've buried crawlers who couldn't do that. I'm writing it down so I remember you did. M.",
      died: "You died yesterday. It happens. What matters is what you learned. If the answer is 'nothing', come see me. M.",
      deep: "Level {n}. The air gets thin down there and so does your luck. Come by for supplies. I'll knock a little off. M.",
      selfown: "Rocks and monsters, kid. ROCKS AND MONSTERS. Enclosed: nothing, because you'd probably blow it up. M.",
      sponsor: "You caught The Sponsor. I've been fishing that river for years. I'm writing this to say I'm not jealous. I'm a little jealous. M.",
    },
    gifts: [
      [2, 'hp_potion', 1, "Brewed one too many. Take it. Don't waste it on a rat. M."],
      [4, 'megabomb', 1, "Found this in the back of the Guild. Older than you. Point it AWAY from yourself. M."],
      [6, 'mana', 2, "Two mana crystals. Old stock, still good. You've earned them. M."],
    ],
  },
  zev: {
    thanks: {
      gift: "CARL!!! The {item}!!! I posted a picture and it got four million likes. The likes were for the {item}. Some were for me. Thank you!!! Zev",
      bday: "Carl, the {item} for my birthday? I'm so touched I've already scheduled three posts about it. Enclosed: a little something from our sponsors and from me. Zev",
      dinner: "Dinner at Carl's! The {item}! The ambience! The no-pants dress code! I've pitched it as a series. Thank you!!! Zev",
    },
    recipe: {
      hearts: 4, id: 'zev_sushi',
      text: "Carl, here is a recipe my people make back home. Promise you will never, EVER tell anyone it's sushi. Legally it's a 'Sponsored Roll.' Zev",
    },
    news: {
      hoarder: "THE HOARDER! Carl, the numbers are UNREAL. I'm writing this from under my desk because I fainted. Zev",
      krakaren: "Borough Boss DOWN! I've enclosed the press kit. It's mostly pictures of your feet. People love your feet, Carl. Zev",
      died: "Your death clip is trending! I'm torn between grief and engagement metrics. Mostly grief. Please be careful!!! Zev",
      deep: "Level {n}! The deep-dive audience sent you fan art. Most of it has pants drawn on. I removed them. Zev",
      selfown: "THE EXPLOSION. Carl. Nine billion views. Legal says I can't ask you to do it again. I'm not asking. I'm just saying. Zev",
      sponsor: "You caught The Sponsor!!! Do NOT eat it. Do NOT sell it on camera. Call me first. CALL ME. Zev",
    },
    gifts: [
      [2, 'box_bronze', 1, "A sponsor sent over promotional boxes! I kept the nice one. Kidding! This is the nice one. Zev"],
      [4, 'box_silver', 1, "You're trending, so the sponsors are getting generous. Enclosed: one box, unboxing on camera strongly encouraged. Zev"],
      [6, 'box_gold', 1, "Carl, I got a bonus for your ratings. It felt wrong not to share. Please open this where a camera can see it. Zev"],
    ],
  },
  pook: {
    thanks: {
      gift: "Pook got the {item}! Pook will not sell it. Pook thought about selling it. Pook will not. Thank you, crawler! (This letter is free.)",
      bday: "Pook's birthday present from crawler! Pook has enclosed a return gift. No receipt. Pook is very bad at gifts and very good at shops.",
      dinner: "Pook enjoyed the {item} at crawler's table! Pook would give it five stars. Pook would also like the recipe. Pook will pay. A little.",
    },
    recipe: {
      hearts: 3, id: 'pook_wrap',
      text: "Pook is sharing the secret Bopca Wrap recipe with crawler! Normally this costs nine hundred gold. For crawler, free. Please do not tell Pook's cousin.",
    },
    news: {
      hoarder: "Crawler beat the Hoarder! Pook has put a sign in the window: 'Crawler shops here.' Sales are up. Pook is grateful. Pook is also charging more.",
      krakaren: "Pook heard about the Krakaren Clone! Pook has started selling tentacle-shaped pretzels in crawler's honor. Crawler gets one free. Ask at counter.",
      died: "Pook heard crawler died. Pook was very sad. Pook kept crawler's shopping list just in case. Crawler came back! Pook is relieved. Pook still has the list.",
      deep: "Level {n}! If crawler sees Pook's cousin down there, tell him he still owes Pook a wheelbarrow.",
    },
    gifts: [
      [2, 'beer', 3, "Pook has too much beer. Pook does not drink beer. Pook does not know why Pook ordered beer. Crawler, take it."],
      [4, 'tunamelt', 1, "One Bopca Tuna Melt, free for crawler! Pook made it this morning. Mostly this morning."],
      [6, 'crystal_fruit', 3, "Pook's best customer gets Pook's best fruit. Pook does not say this to everyone. Pook says this to almost everyone, but means it this time."],
    ],
  },
};

// What the System AI says when the mailbox is empty.
const MAIL_EMPTY = [
  "The mailbox is empty. A Borant flyer offers 10% off pants. You throw it away.",
  "Nothing but a cobweb. The spider looks annoyed.",
  "Empty. The System AI reminds you that mail is delivered each morning, and that you have no pen pals.",
  "The mailbox is empty. Mongo has been licking the inside of it again.",
];
