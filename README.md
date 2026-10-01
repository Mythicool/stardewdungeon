# CarlCraft: Dungeon Farmer World

A Stardew Valley–style farming/life sim set in the world of *Dungeon Crawler Carl*.

> **ATTENTION, CRAWLER!** Due to overwhelming demand from the Syndicate's "relaxing content"
> demographic, Borant Corporation has assigned you and your companion a Homestead on the
> Stairwell Plateau. Grow crops, ship crops, make friends, and descend the Stairwell to murder
> things for loot. The season collapses in 28 days. Now get out there and farm, farm, farm!

You play Carl — boxer shorts, leather jacket, no pants, bare feet — with Princess Donut
following you everywhere (and casting Magic Missile at anything that looks at you funny)
and Mongo roaming the farm.

## Running it

No build step and no dependencies. Open `index.html` in a modern browser (Chrome, Edge, Firefox).

To serve it locally instead:

```
npx serve .
```

Progress saves to the browser's `localStorage` each night when you sleep.

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrow keys | Move |
| Space / Left-click | Use selected item: tool, kick, plant, place, eat, open box (hold to repeat) |
| F / Right-click / Enter | Interact: talk, gift, pet, harvest, ship, shop, open chests |
| 1–9, 0 / Mouse wheel | Select hotbar slot |
| E / I / Tab / Esc | Menu: Items, Crafting, Social, Skills, Trophies, Options |
| Q / R (in menu) | Previous / next tab |
| M | Toggle music |

With the mouse, tools target the tile under the cursor when it's next to Carl; otherwise they
target the tile he's facing.

## What's in it

**Farming.** Till, plant, water, harvest. 12 crops across four seasons (Rat Radish, Screaming
Mandrake, Bomb Berries, Mongo Melon, Hoarder's Gourd, ...). Crops need water daily (rain does
it for you), regrowing crops keep producing, and anything out of season withers when the
season collapses. Sprinklers water crops automatically every morning.

**Days and seasons.** 6 AM to 2 AM. Sleep to save and see the shipping report. Stay up past
2 AM and you pass out, and Borant charges a retrieval fee. Each season lasts 28 days.

**The Safe Room Plaza** (east of the farm):
- **Pook's Provisions**: seeds, food, recipes, backpack upgrades
- **Mordecai's Guild Hall**: potions, bombs, recipes, kick upgrades, tool enchantments (copper → iron → gold)
- **The Request Board**: daily delivery and slaying jobs
- **Zev's Borant PR trailer**, the Desperado Club (members only), a fountain, and a river for fishing

**The Stairwell** (north end of the Plaza): procedurally generated cave levels with ore,
gems, crates, loot chests and monsters (rats, Brindle Grubs, goblins, charging tusklings,
bomb-lobbing hobgoblins, shades). Break rocks to find the hidden stairs, or clear every monster.
- A safe room with a Bopca shop every 5 levels, reachable later by the Stairwell Express
- **Level 10:** The Hoarder, Neighborhood Boss (summons "cats", throws trash)
- **Level 20:** The Krakaren Clone, Borough Boss (telegraphed tentacle slams, spawns minions)
- Four cave themes, going deeper indefinitely

**Combat.** Donut narrates the Stairwell live: new depths, bosses, low health, big hits,
loot, multi-kills and self-inflicted explosions (she gets sweeter about it at 6+ hearts). Carl kicks. Upgrade the kick with toe rings (he refuses to wear shoes). Craft
Hob-Lobbers and Carl's Doomsday Scenario to blow up rocks, monsters, and occasionally yourself.

**Rival crawler.** From level 3, Brock Vantage (sponsored by Gnu-Wave Energy Slurry) sometimes
follows Carl down the ladder. He talks trash, grabs any chest he can reach, and heads straight
for the rock hiding the stairs, because his sponsor sold him a map. Beat him down the stairs for
a follower bonus, or kick him (Donut, Katia and Mongo help) until he yields and hands over
everything he grabbed plus a loot box. Friends hear about it either way.

**Friends.** Talk to and gift Donut, Mongo, Katia, Mordecai, Zev and Pook. Each has loves,
likes and hates, heart levels, and dialogue that unlocks as the hearts go up.
At 3 and 6 hearts, the next chat with each friend plays a **heart event**: a short scene that
ends with Carl picking how to respond. Good answers earn friendship, followers and sometimes a
gift; bad ones cost hearts. The Social tab tracks how many each friend has left (✦ 1/2).
Friends keep up with the news: for a few days after you beat a boss, die, pass out, reach a
new depth, blow yourself up or hand someone a gift they hate, they'll bring it up when you
talk to them. When two friends are near each other (and you), they banter in speech bubbles.
Every friend has a birthday (shown in the Social tab, with a reminder that morning). Gifts on
a birthday count four times as much, and hated ones twice as badly.
At 4 hearts you can invite Katia into your party for the day. She follows you everywhere,
punches whatever gets close in the Stairwell, and sometimes throws up her shield arm to block
half of a hit meant for you. She heads home at 10 PM.
At 3 hearts you can pet Mongo on the farm and bring him along too. He has his own slot, so he
can crawl alongside Katia. He charges monsters that get close to Carl, and after a while on a
quiet floor he sniffs out the rock hiding the stairs and marks it with a gold paw print.
Friendship pays off: at 5 hearts Pook and Mordecai give you 15% off, Mongo starts digging up
presents for you in the mornings, and Zev's promotion adds 20% to every follower gain. The
Social tab lists each friend's perk.
At 2 hearts you can invite Katia, Zev, Mordecai or Pook to **dinner**. They wait at your cabin
table from 6 PM; talk to them to serve a dish from your bag. They react to what you serve
(loved, liked, hated, or a line written for that dish), Donut weighs in, and you get a little
table talk that deepens with hearts. Dishes you cooked yourself earn double friendship. Each
friend comes once a week, and anyone you stand up remembers it.

**The System AI.** Snarky morning announcements, 50 achievements that pay out in loot boxes
(Bronze, Silver, Gold, Fan, Legendary), follower milestones, a TV with Borant programming, and
a main objective track from "Welcome to the Homestead" through "Syndicate Darling"
(1,000,000 followers).

**Also:** fishing minigame, crafting and cooking, five skills (Farming, Mining, Combat, Fishing,
Foraging) with perks, weather (rain and snow), day/night lighting, and procedural chiptune music
and sound effects.

## Project layout

Plain browser JavaScript (no modules, no bundler). All art is generated in code at startup:
pixel sprites are painted onto small canvases and auto-outlined.

```
index.html
css/style.css
js/
  util.js           helpers, input
  audio.js          WebAudio sound effects + procedural music sequencer
  sprites_core.js   pixel painter, tiles, world objects, crops, buildings
  sprites_chars.js  characters, companions, monsters
  sprites_items.js  item icons
  data_items.js     items, crops, recipes, shops, fish, monsters, loot tables
  data_world.js     NPCs, dialogue, achievements, quests, System AI lines
  maps.js           map model, Homestead / Plaza / interior layouts
  dungeon.js        Stairwell level generation, safe rooms, boss arenas
  entities.js       player, inventory, skills, NPCs, Donut & Mongo
  combat.js         monsters, bosses, projectiles, bombs, drops, particles
  ui.js             panels, toasts, announcements, dialogue, HUD
  menus.js          game menu tabs, shops, day-end report, fishing
  actions.js        tools, farming, interaction, gifting, rewards
  banter.js         friends' gossip about recent events, speech-bubble banter
  commentary.js     Donut's live commentary in the Stairwell
  party.js          Katia and Mongo as party members: follow, fight, shield, sniff
  rival.js          Brock Vantage, the rival crawler who races Carl to chests and stairs
  dinner.js         dinner nights: invites, the guest at the cabin table, the meal scene
  render.js         world rendering, lighting, weather, title screen
  game.js           main loop, time, days, transitions, save/load
```

## Credits

A non-commercial fan tribute to *Dungeon Crawler Carl* by Matt Dinniman, and to *Stardew Valley*
by ConcernedApe. Not affiliated with or endorsed by either. All code, pixel art, music and
dialogue in this project are original.
