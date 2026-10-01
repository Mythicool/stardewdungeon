'use strict';
// ---------------------------------------------------------------------------
// Items, crops, recipes, shops, fish, monsters, loot tables.
// ---------------------------------------------------------------------------

const CROPS = {
  radish:     { name: 'Rat Radish',         seasons: [0],    days: 4,  regrow: 0, seedPrice: 20,  sell: 38,  shape: 'root',     color: '#e0405a', color2: '#ff9aa8', desc: 'Named for the rats that dig them up. Or for what they taste like.' },
  potato:     { name: 'Goblin Potato',      seasons: [0],    days: 6,  regrow: 0, seedPrice: 30,  sell: 75,  shape: 'root',     color: '#c8a060', color2: '#e0c080', desc: 'Lumpy, green-tinged, oddly smug.' },
  catnip:     { name: "Donut's Catnip",     seasons: [0],    days: 6,  regrow: 3, seedPrice: 45,  sell: 42,  shape: 'leafy',    color: '#6acf7a', color2: '#aaf0b0', desc: 'Keeps producing. Keeps a certain Princess calm. Mostly.' },
  mandrake:   { name: 'Screaming Mandrake', seasons: [0],    days: 9,  regrow: 0, seedPrice: 70,  sell: 170, shape: 'mandrake', color: '#d8b890', color2: '#f0d8b0', desc: 'Screams when harvested. The audience LOVES it.' },
  pepper:     { name: 'Hellfire Pepper',    seasons: [1],    days: 5,  regrow: 3, seedPrice: 40,  sell: 48,  shape: 'pepper',   color: '#e0301a', color2: '#ff8a60', desc: 'Rated 2 million Scovilles. Also a fire hazard.' },
  bomberry:   { name: 'Bomb Berry',         seasons: [1],    days: 7,  regrow: 4, seedPrice: 60,  sell: 55,  shape: 'bush',     color: '#2a2a38', color2: '#ff9020', desc: 'Volatile. Craft into Hob-Lobbers. Do NOT eat.' },
  melon:      { name: 'Mongo Melon',        seasons: [1],    days: 12, regrow: 0, seedPrice: 90,  sell: 290, shape: 'melon',    color: '#5aa04a', color2: '#3c7a30', desc: 'Roughly the size of a baby dinosaur. Mongo is jealous.' },
  corn:       { name: 'Crawler Corn',       seasons: [1, 2], days: 14, regrow: 4, seedPrice: 150, sell: 55,  shape: 'corn',     color: '#f0d040', color2: '#fff0a0', desc: 'Grows through two seasons. Stubborn, like a crawler.' },
  gourd:      { name: "Hoarder's Gourd",    seasons: [2],    days: 13, regrow: 0, seedPrice: 100, sell: 340, shape: 'gourd',    color: '#e07a2a', color2: '#f0a050', desc: 'Someone, somewhere, would keep forty of these in a bathtub.' },
  yam:        { name: 'Nightshade Yam',     seasons: [2],    days: 8,  regrow: 0, seedPrice: 60,  sell: 160, shape: 'root',     color: '#7a3a8a', color2: '#b070c0', desc: 'Purple, sweet, only slightly cursed.' },
  bloodberry: { name: 'Blood Berries',      seasons: [2],    days: 7,  regrow: 5, seedPrice: 240, sell: 80,  shape: 'bush',     color: '#b0102a', color2: '#ff5070', desc: 'Tart. Slightly warm. Try not to think about it.' },
  frostcap:   { name: 'Frostcap Mushroom',  seasons: [3],    days: 7,  regrow: 0, seedPrice: 80,  sell: 130, shape: 'mushroom', color: '#8ad0f0', color2: '#e0f8ff', desc: "Borant's Weather Department allows exactly one winter crop." },
};
const CROP_ICON_SHAPE = { root: 'root', mandrake: 'mandrake', bush: 'berry', pepper: 'pepper', melon: 'melon', gourd: 'gourd', corn: 'corn', leafy: 'leafy', mushroom: 'mushroom' };

const ITEMS = {
  // tools
  hoe:   { name: 'Hoe', cat: 'tool', tool: 'hoe', icon: { s: 'hoe' }, desc: 'Tills soil. Also a decent back-scratcher.' },
  can:   { name: 'Watering Can', cat: 'tool', tool: 'can', icon: { s: 'watercan' }, desc: 'Waters crops. Refill at any water.' },
  axe:   { name: 'Axe', cat: 'tool', tool: 'axe', icon: { s: 'axe' }, desc: 'Chops trees, stumps and twigs.' },
  pick:  { name: 'Pickaxe', cat: 'tool', tool: 'pick', icon: { s: 'pick' }, desc: 'Breaks rocks. Finds ore. Un-tills soil.' },
  rod:   { name: 'Fishing Rod', cat: 'tool', tool: 'rod', icon: { s: 'rod' }, desc: 'Face water and use it. Wait for the bite!' },
  // weapons (kick upgrades — Carl refuses to wear shoes)
  foot:      { name: "Carl's Bare Foot", cat: 'weapon', dmg: 6, icon: { s: 'foot' }, desc: 'It has kicked more monsters than most swords have stabbed.' },
  toering:   { name: 'Enchanted Toe Ring', cat: 'weapon', dmg: 12, price: 400, icon: { s: 'foot', c: '#f4d03f' }, desc: '+Kick. Worn on the big toe. Fashion.' },
  steeltoe:  { name: 'Steel Toe Cap (Just The Cap)', cat: 'weapon', dmg: 20, price: 1200, icon: { s: 'foot', c: '#d8dde6' }, desc: 'Technically still barefoot.' },
  guild_ring: { name: "Guildmaster's Toe Ring", cat: 'weapon', dmg: 26, price: 3000, icon: { s: 'foot', c: '#e07a30' }, desc: 'Forged by Mordecai in a forge that had been cold for years. Keep coming back.' },
  celestial: { name: 'Celestial Toe Ring', cat: 'weapon', dmg: 34, price: 5000, icon: { s: 'foot', c: '#c050ff' }, desc: 'The gods are watching. Specifically, your toes.' },
  // resources
  wood:     { name: 'Wood', cat: 'resource', price: 2, icon: { s: 'wood' }, desc: 'Timber! Used in crafting.' },
  stone:    { name: 'Stone', cat: 'resource', price: 2, icon: { s: 'stone' }, desc: 'A rock. Crawlers have been hitting things with these for ages.' },
  fiber:    { name: 'Fiber', cat: 'resource', price: 1, icon: { s: 'fiber' }, desc: 'Plant fiber from weeds.' },
  coal:     { name: 'Coal', cat: 'resource', price: 15, icon: { s: 'coal' }, desc: 'Explosive-adjacent. Carl approves.' },
  copper:   { name: 'Copper Ore', cat: 'mineral', price: 5, icon: { s: 'ore', c: '#d9843b', c2: '#f0a860' }, desc: 'Used for sprinklers and tool upgrades.' },
  iron:     { name: 'Iron Ore', cat: 'mineral', price: 10, icon: { s: 'ore', c: '#d8dde6', c2: '#ffffff' }, desc: 'Found deeper in the Stairwell.' },
  gold_ore: { name: 'Gold Ore', cat: 'mineral', price: 25, icon: { s: 'ore', c: '#f4d03f', c2: '#fff2a0' }, desc: 'Shiny. The deep levels are full of it.' },
  quartz:   { name: 'Dungeon Quartz', cat: 'mineral', price: 25, icon: { s: 'gem', c: '#e8e8f4', c2: '#ffffff' }, desc: 'A clear crystal. Hums faintly.' },
  mana:     { name: 'Mana Crystal', cat: 'mineral', price: 100, icon: { s: 'gem', c: '#b05cff', c2: '#e0b0ff' }, desc: 'Crystallized magic. Mordecai goes weak at the knees.' },
  ruby:     { name: 'Blood Ruby', cat: 'mineral', price: 250, icon: { s: 'gem', c: '#e0284a', c2: '#ff8098' }, desc: 'Deep red. Donut says it matches her personality.' },
  diamond:  { name: 'Celestial Diamond', cat: 'mineral', price: 750, icon: { s: 'gem', c: '#8ff3ff', c2: '#ffffff' }, desc: 'The rarest thing in the Stairwell. Sparkles aggressively.' },
  // monster loot
  rat_tail:      { name: 'Rat Tail', cat: 'monster', price: 8, icon: { s: 'tail', c: '#d890a0' }, desc: 'Wiggles occasionally. Mongo loves these.' },
  goblin_powder: { name: 'Goblin Powder', cat: 'monster', price: 12, icon: { s: 'powder', c: '#7a6a4a', c2: '#a0906a' }, desc: 'Goblin engineers use it for explosives. So do you.' },
  tusk:          { name: 'Tuskling Tusk', cat: 'monster', price: 22, icon: { s: 'tusk', c: '#f4f0e0' }, desc: 'Small, sharp, slightly slobbery.' },
  grub_goo:      { name: 'Grub Goo', cat: 'monster', price: 10, icon: { s: 'goo', c: '#b0c060', c2: '#e0f090' }, desc: 'Brindle Grub residue. Great in potions. Terrible on socks.' },
  hob_ear:       { name: 'Hobgoblin Ear', cat: 'monster', price: 30, icon: { s: 'ear', c: '#c9733a' }, desc: "A trophy. It's still listening." },
  ectoplasm:     { name: 'Shade Ectoplasm', cat: 'monster', price: 45, icon: { s: 'goo', c: '#9a7ad8', c2: '#d8c8ff' }, desc: 'Cold, glowing, faintly judgmental.' },
  cat_collar:    { name: "Hoarder's Cat Collar", cat: 'monster', price: 600, icon: { s: 'collar', c: '#e05a8a' }, desc: 'Taken from the Hoarder. Donut refuses to look at it.' },
  tentacle:      { name: 'Krakaren Tentacle', cat: 'monster', price: 1500, icon: { s: 'tentacle', c: '#c04a7a', c2: '#ff9ac8' }, desc: 'Still twitching. Calamari for forty.' },
  // forage
  wild_garlic: { name: 'Wild Garlic', cat: 'forage', price: 30, energy: 15, hp: 5, icon: { s: 'leek' }, desc: 'Spring forage. Wards off vampires, probably.' },
  spice_berry: { name: 'Spice Berry', cat: 'forage', price: 45, energy: 20, hp: 8, icon: { s: 'berry', c: '#ff5a2a', c2: '#ffb080' }, desc: 'Summer forage. Tingly.' },
  blackberry:  { name: 'Blackberry', cat: 'forage', price: 20, energy: 15, hp: 5, icon: { s: 'berry', c: '#3a1a4a', c2: '#7a4a9a' }, desc: 'Fall forage. Stains everything.' },
  crystal_fruit: { name: 'Crystal Fruit', cat: 'forage', price: 60, energy: 30, hp: 12, icon: { s: 'gem', c: '#a0e0ff', c2: '#ffffff' }, desc: 'Winter forage. Crunchy like ice.' },
  glowshroom:  { name: 'Glowing Mushroom', cat: 'forage', price: 40, energy: 25, hp: 10, icon: { s: 'mushroom', c: '#7dff9a', c2: '#d0ffe0' }, desc: 'Grows in the Stairwell. Alchemists love it.' },
  // fish
  minnow:      { name: 'Kua-Tin Minnow', cat: 'fish', price: 30, energy: 20, hp: 10, icon: { s: 'fish', c: '#5fb0b8', c2: '#a8e0e8' }, desc: 'Absolutely not related to Zev. Do not ask Zev.' },
  carp:        { name: 'Dungeon Carp', cat: 'fish', price: 40, energy: 25, hp: 10, icon: { s: 'fish', c: '#8a8a4a', c2: '#c0c080' }, desc: 'Bottom feeder. Relatable.' },
  catfish:     { name: 'Cat-Fish', cat: 'fish', price: 95, energy: 40, hp: 20, icon: { s: 'fish', c: '#8a6a4a', c2: '#d0b090' }, desc: 'Has whiskers. Donut considers it a personal insult.' },
  trout:       { name: 'Boxer-Short Trout', cat: 'fish', price: 65, energy: 30, hp: 15, icon: { s: 'fish', c: '#e0e0f0', c2: '#ff8098' }, desc: 'Patterned with little hearts. Suspicious.' },
  eel:         { name: 'Rage Eel', cat: 'fish', price: 120, energy: 45, hp: 25, icon: { s: 'fish', c: '#3a4a2a', c2: '#e0402a' }, desc: 'Furious about everything.' },
  icefish:     { name: 'Frostfin', cat: 'fish', price: 85, energy: 35, hp: 15, icon: { s: 'fish', c: '#a0d0f0', c2: '#ffffff' }, desc: 'Winter only. Cold-blooded, literally.' },
  sponsorfish: { name: 'The Sponsor', cat: 'fish', price: 1500, energy: 100, hp: 50, icon: { s: 'fish', c: '#f4d03f', c2: '#ffffff' }, desc: 'Legendary. Only bites in the rain. Probably owns a moon.' },
  // food & drink
  sandwich: { name: 'Safe Room Sandwich', cat: 'food', price: 50, energy: 60, hp: 30, icon: { s: 'sandwich' }, desc: 'Every safe room makes the exact same sandwich. Comforting.' },
  tunamelt: { name: 'Bopca Tuna Melt', cat: 'food', price: 90, energy: 110, hp: 50, icon: { s: 'sandwich' }, desc: 'A Bopca specialty. Do not ask about the tuna.' },
  kibble:   { name: 'Premium Kibble', cat: 'food', price: 25, energy: 5, hp: 0, icon: { s: 'can', c: '#c0392b' }, desc: 'The good stuff. A Princess will accept nothing less.' },
  beer:     { name: 'Cheap Beer', cat: 'food', price: 15, energy: 20, hp: 0, icon: { s: 'mug' }, desc: 'Mordecai insists it is medicinal.' },
  skewer:   { name: 'Rat-on-a-Stick', cat: 'food', price: 40, energy: 35, hp: 15, icon: { s: 'skewer', c: '#8a6a5a', c2: '#b09080' }, desc: 'Crawler cuisine. Tastes like chicken. Chicken that lived in a sewer.' },
  salad:    { name: 'Crawler Salad', cat: 'food', price: 160, energy: 90, hp: 40, icon: { s: 'bowl', c: '#6ac05a', c2: '#e0405a' }, desc: 'Fresh from the Homestead.' },
  stew:     { name: 'Hobgoblin Stew', cat: 'food', price: 380, energy: 170, hp: 90, icon: { s: 'bowl', c: '#a0501a', c2: '#e0a040' }, desc: 'No hobgoblins were harmed. Several were involved.' },
  pie:      { name: "Hoarder's Gourd Pie", cat: 'food', price: 700, energy: 200, hp: 120, icon: { s: 'cake', c: '#e07a2a', c2: '#f4e0c0' }, desc: 'Sweet. Spiced. Serves one very hungry crawler.' },
  // potions
  hp_potion: { name: 'Healing Potion', cat: 'potion', price: 75, energy: 0, hp: 90, icon: { s: 'potion', c: '#e0284a', c2: '#ff8098' }, desc: 'Tastes like cherries and regret.' },
  hangover:  { name: "Mordecai's Hangover Cure", cat: 'potion', price: 90, energy: 150, hp: 20, icon: { s: 'potion', c: '#4aff7a', c2: '#b0ffc8' }, desc: 'Restores energy. Mordecai drinks four a day.' },
  // crafted
  sprinkler:  { name: 'Sprinkler', cat: 'placeable', price: 100, icon: { s: 'sprinkler', c: '#9aa4ae' }, desc: 'Waters the 4 adjacent tiles every morning.' },
  qsprinkler: { name: 'Quality Sprinkler', cat: 'placeable', price: 300, icon: { s: 'sprinkler', c: '#e0b030' }, desc: 'Waters all 8 surrounding tiles every morning.' },
  bomb:       { name: 'Hob-Lobber', cat: 'bomb', price: 50, radius: 2.5, dmg: 45, icon: { s: 'bomb', c: '#26262e' }, desc: 'A goblin-engineered bomb. Place it and RUN.' },
  megabomb:   { name: "Carl's Doomsday Scenario", cat: 'bomb', price: 300, radius: 4.5, dmg: 140, icon: { s: 'bomb', c: '#6a1a1a' }, desc: 'A bomb so big it has its own fan club.' },
  // gifts & specials
  sunglasses: { name: 'Enchanted Sunglasses', cat: 'gift', price: 400, icon: { s: 'sunglasses' }, desc: '+10 Charisma. +100 Attitude.' },
  tiara:      { name: 'Plastic Tiara', cat: 'gift', price: 150, icon: { s: 'tiara', c: '#f4d03f' }, desc: 'Not real gold. Do not tell the Princess.' },
  // loot boxes
  box_bronze:    { name: 'Bronze Adventurer Box', cat: 'box', tier: 'bronze', price: 0, icon: { s: 'box', c: '#b87333', c2: '#e0a060' }, desc: 'Use to open. Contents: probably disappointing!' },
  box_silver:    { name: 'Silver Adventurer Box', cat: 'box', tier: 'silver', price: 0, icon: { s: 'box', c: '#8a96a4', c2: '#e8eef4' }, desc: 'Use to open. Better than bronze. Barely.' },
  box_gold:      { name: 'Gold Adventurer Box', cat: 'box', tier: 'gold', price: 0, icon: { s: 'box', c: '#e8b830', c2: '#fff0a0' }, desc: 'Use to open. The good stuff.' },
  box_fan:       { name: 'Fan Box', cat: 'box', tier: 'fan', price: 0, icon: { s: 'box', c: '#ff6ab0', c2: '#ffc0e0' }, desc: 'Sent by your adoring viewers. May contain anything.' },
  box_legendary: { name: 'Legendary Box', cat: 'box', tier: 'legendary', price: 0, icon: { s: 'box', c: '#9a40e0', c2: '#e0b0ff' }, desc: 'Use to open. The Syndicate gasps.' },
};

// Generate crop produce + seed items
for (const [id, cd] of Object.entries(CROPS)) {
  const eat = Math.min(90, Math.round(cd.sell * 0.35) + 10);
  ITEMS[id] = { name: cd.name, cat: 'crop', price: cd.sell, energy: id === 'bomberry' ? 0 : eat, hp: id === 'bomberry' ? -25 : Math.round(eat / 2), icon: { s: CROP_ICON_SHAPE[cd.shape], c: cd.color, c2: cd.color2 }, desc: cd.desc };
  ITEMS['seed_' + id] = { name: cd.name + ' Seeds', cat: 'seed', price: Math.floor(cd.seedPrice / 2), crop: id, icon: { s: 'seeds', c: cd.color, c2: cd.color2 }, desc: 'Plant in tilled soil. Grows in ' + cd.seasons.map(s => SEASON_NAMES[s]).join(' & ') + '. ' + cd.days + ' days' + (cd.regrow ? ', then regrows every ' + cd.regrow + '.' : '.') };
}

function itemDef(id) { return ITEMS[id]; }
function itemStackable(id) { const d = ITEMS[id]; return d && d.cat !== 'tool' && d.cat !== 'weapon'; }
function itemEdible(id) { const d = ITEMS[id]; return d && (d.energy != null || d.hp != null) && d.cat !== 'placeable'; }
function itemGiftable(id) { const d = ITEMS[id]; return d && d.cat !== 'tool' && d.cat !== 'weapon' && d.cat !== 'box'; }

const RECIPES = [
  { id: 'bomb',       out: 'bomb',       n: 1, ing: { goblin_powder: 1, coal: 1 }, known: true },
  { id: 'bomb2',      out: 'bomb',       n: 2, ing: { bomberry: 3, coal: 1 }, known: true },
  { id: 'skewer',     out: 'skewer',     n: 1, ing: { rat_tail: 2, wood: 1 }, known: true },
  { id: 'sprinkler',  out: 'sprinkler',  n: 1, ing: { copper: 3, iron: 2 }, unlock: ['farming', 2] },
  { id: 'salad',      out: 'salad',      n: 1, ing: { radish: 1, wild_garlic: 1, catnip: 1 }, unlock: ['farming', 3] },
  { id: 'megabomb',   out: 'megabomb',   n: 1, ing: { goblin_powder: 4, coal: 3, hob_ear: 1 }, unlock: ['mining', 4] },
  { id: 'qsprinkler', out: 'qsprinkler', n: 1, ing: { iron: 4, gold_ore: 2, quartz: 1 }, unlock: ['farming', 6] },
  { id: 'pie',        out: 'pie',        n: 1, ing: { gourd: 1, wood: 2, blackberry: 2 }, unlock: ['farming', 5] },
  { id: 'hp_potion',  out: 'hp_potion',  n: 1, ing: { glowshroom: 1, grub_goo: 1 }, unlock: ['buy'] },
  { id: 'hangover',   out: 'hangover',   n: 1, ing: { beer: 1, glowshroom: 1, catnip: 1 }, unlock: ['buy'] },
  { id: 'stew',       out: 'stew',       n: 1, ing: { potato: 1, pepper: 1, yam: 1 }, unlock: ['buy'] },
];

const TOOL_UPGRADES = [
  null,
  { name: 'Copper', gold: 2000, ore: 'copper', n: 5 },
  { name: 'Iron', gold: 5000, ore: 'iron', n: 5 },
  { name: 'Gold', gold: 10000, ore: 'gold_ore', n: 5 },
];

// Shop stock. Each entry: {item, price} | {recipe, price} | {upgrade: 'hoe'} | {backpack: true}
const SHOPS = {
  pook: {
    name: "Pook's Provisions", keeper: 'pook', hours: [480, 1260],
    stock() {
      const s = [];
      for (const [id, cd] of Object.entries(CROPS)) if (cd.seasons.includes(G.season)) s.push({ item: 'seed_' + id, price: cd.seedPrice });
      s.push({ item: 'sandwich', price: 120 }, { item: 'tunamelt', price: 220 }, { item: 'kibble', price: 60 }, { item: 'beer', price: 40 });
      s.push({ recipe: 'stew', price: 900 });
      s.push({ backpack: true });
      return s;
    },
  },
  mordecai: {
    name: "Mordecai's Guild Supply", keeper: 'mordecai', hours: [480, 1500],
    stock() {
      const s = [{ item: 'hp_potion', price: 180 }, { item: 'hangover', price: 220 }, { item: 'bomb', price: 150 }, { item: 'rod', price: 400 }];
      s.push({ recipe: 'hp_potion', price: 700 }, { recipe: 'hangover', price: 1000 });
      s.push({ item: 'toering', price: 2500 }, { item: 'steeltoe', price: 8000 });
      for (const t of ['hoe', 'can', 'axe', 'pick']) s.push({ upgrade: t });
      return s;
    },
  },
  safe: {
    name: 'Safe Room Bopca', keeper: 'bopca2', hours: [0, 9999],
    stock() {
      return [{ item: 'sandwich', price: 150 }, { item: 'tunamelt', price: 260 }, { item: 'hp_potion', price: 220 }, { item: 'bomb', price: 180 }, { item: 'beer', price: 50 }];
    },
  },
};

const FISH_TABLES = {
  farm: [
    { id: 'minnow', w: 40, diff: 0.25 }, { id: 'carp', w: 30, diff: 0.35 },
    { id: 'catfish', w: 10, diff: 0.6, bonusRain: 15 }, { id: 'icefish', w: 20, diff: 0.5, seasons: [3] },
    { id: 'sponsorfish', w: 2, diff: 0.88, rainOnly: true },
  ],
  town: [
    { id: 'minnow', w: 35, diff: 0.25 }, { id: 'trout', w: 25, diff: 0.4, seasons: [0, 1] },
    { id: 'eel', w: 15, diff: 0.65, seasons: [1, 2] }, { id: 'carp', w: 20, diff: 0.35 }, { id: 'icefish', w: 20, diff: 0.5, seasons: [3] },
  ],
};

const MONSTERS = {
  rat:       { name: 'Rat', spr: 'rat', hp: 14, dmg: 5, speed: 52, xp: 3, aggro: 110, drops: [['rat_tail', 0.45]] },
  grub:      { name: 'Brindle Grub', spr: 'grub', hp: 32, dmg: 7, speed: 18, xp: 5, aggro: 90, drops: [['grub_goo', 0.6]] },
  goblin:    { name: 'Goblin', spr: 'goblin', hp: 28, dmg: 8, speed: 44, xp: 7, aggro: 130, drops: [['goblin_powder', 0.55], ['coal', 0.15]] },
  tuskling:  { name: 'Tuskling', spr: 'tuskling', hp: 24, dmg: 10, speed: 36, charge: 175, xp: 8, aggro: 150, drops: [['tusk', 0.4]] },
  hobgoblin: { name: 'Hobgoblin', spr: 'hobgoblin', hp: 52, dmg: 12, speed: 34, ranged: true, xp: 14, aggro: 170, drops: [['goblin_powder', 0.7], ['hob_ear', 0.25]] },
  shade:     { name: 'Dungeon Shade', spr: 'shade', hp: 40, dmg: 14, speed: 30, ghost: true, xp: 16, aggro: 200, drops: [['ectoplasm', 0.4]] },
  feralcat:  { name: 'Feral Cat', spr: 'feralcat', hp: 12, dmg: 6, speed: 68, xp: 2, aggro: 400, drops: [] },
  rival:     { name: 'Brock Vantage', spr: 'rival', hp: 110, dmg: 8, speed: 60, rival: true, xp: 25, aggro: 0, drops: [] },
  hoarder:   { name: 'The Hoarder', spr: 'hoarder', hp: 480, dmg: 15, speed: 26, boss: true, scale: 2, xp: 200, aggro: 999, drops: [['cat_collar', 1]] },
  krakaren:  { name: 'Krakaren Clone', spr: null, hp: 1200, dmg: 20, speed: 0, boss: true, xp: 500, aggro: 999, drops: [['tentacle', 1]] },
};

// Loot box contents. Returns [{id, n}] plus optional gold.
function rollLootBox(tier) {
  const out = [];
  let gold = 0;
  const seasonSeeds = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(G.season));
  const seed = () => ({ id: 'seed_' + choice(seasonSeeds.length ? seasonSeeds : ['radish']), n: randi(5, 10) });
  switch (tier) {
    case 'bronze':
      gold = randi(50, 200);
      out.push(weighted([[seed(), 3], [{ id: 'sandwich', n: 2 }, 2], [{ id: 'bomb', n: 2 }, 2], [{ id: 'hp_potion', n: 1 }, 2], [{ id: 'coal', n: 5 }, 1], [{ id: 'kibble', n: 3 }, 1]]));
      if (chance(0.35)) out.push({ id: 'copper', n: randi(3, 8) });
      break;
    case 'silver':
      gold = randi(200, 600);
      out.push(seed());
      out.push(weighted([[{ id: 'bomb', n: 4 }, 3], [{ id: 'iron', n: 6 }, 2], [{ id: 'hp_potion', n: 3 }, 2], [{ id: 'tunamelt', n: 2 }, 2], [{ id: 'sunglasses', n: 1 }, 1], [{ id: 'sprinkler', n: 1 }, 2]]));
      if (chance(0.3)) out.push({ id: 'quartz', n: 2 });
      break;
    case 'gold':
      gold = randi(800, 2000);
      out.push(weighted([[{ id: 'sprinkler', n: 3 }, 3], [{ id: 'qsprinkler', n: 1 }, 2], [{ id: 'mana', n: 2 }, 2], [{ id: 'ruby', n: 1 }, 2], [{ id: 'megabomb', n: 1 }, 2]]));
      out.push(weighted([[{ id: 'tiara', n: 1 }, 2], [{ id: 'sunglasses', n: 1 }, 2], [{ id: 'stew', n: 2 }, 2], [{ id: 'gold_ore', n: 8 }, 2]]));
      if (!playerOwns('toering') && !playerOwns('steeltoe') && !playerOwns('celestial') && chance(0.5)) out.push({ id: 'toering', n: 1 });
      break;
    case 'fan':
      gold = randi(100, 500);
      out.push(weighted([[{ id: 'tiara', n: 1 }, 2], [{ id: 'sunglasses', n: 1 }, 2], [{ id: 'kibble', n: 5 }, 3], [{ id: 'beer', n: 6 }, 3], [{ id: 'tunamelt', n: 3 }, 2], [{ id: 'bomb', n: 5 }, 2], [{ id: 'mana', n: 1 }, 1]]));
      out.push(seed());
      break;
    case 'legendary':
      gold = randi(4000, 8000);
      out.push({ id: 'diamond', n: 2 }, { id: 'qsprinkler', n: 4 }, { id: 'megabomb', n: 2 });
      if (!playerOwns('celestial')) out.push({ id: 'celestial', n: 1 });
      break;
  }
  return { items: out, gold };
}
