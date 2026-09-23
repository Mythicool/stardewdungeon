'use strict';
// ---------------------------------------------------------------------------
// Character sprites. Frames: frames[dir][0..2] (0 = stand, 1/2 = walk).
// ---------------------------------------------------------------------------

const CHAR_DEFS = {
  carl:      { kind: 'human', skin: '#f0c090', hair: '#6b3e1f', hairStyle: 'short', top: '#5b3a22', top2: '#e8e0d0', bottom: '#f6f6f6', pattern: 'hearts', legs: '#f0c090', feet: '#f0c090', eye: '#2a1a14', stubble: true },
  katia:     { kind: 'human', skin: '#f2cfae', hair: '#e8c860', hairStyle: 'ponytail', top: '#6d7f93', top2: '#8fa3b8', bottom: '#3a4450', legs: '#3a4450', feet: '#4a3020', eye: '#2a4a8a' },
  mordecai:  { kind: 'human', skin: '#9cc07a', hair: '#3b2f55', hairStyle: 'hood', top: '#3b2f55', top2: '#c9a227', bottom: '#3b2f55', legs: '#3b2f55', feet: '#2a2a2a', eye: '#ffe14a', extra: 'flask' },
  zev:       { kind: 'human', skin: '#5fb0b8', hair: '#3f8f99', hairStyle: 'fish', top: '#e05a8a', top2: '#f4f4f4', bottom: '#2a2a40', legs: '#2a2a40', feet: '#222228', eye: '#111111', bigEyes: true, extra: 'tablet' },
  pook:      { kind: 'human', short: true, skin: '#c8a0d8', hair: '#a07ab8', hairStyle: 'bopca', top: '#f0ece0', top2: '#7a5a3a', bottom: '#7a5a3a', legs: '#c8a0d8', feet: '#6a4a8a', eye: '#1a1a1a' },
  bopca2:    { kind: 'human', short: true, skin: '#9fc8d8', hair: '#78a8bc', hairStyle: 'bopca', top: '#f0ece0', top2: '#3a5a7a', bottom: '#3a5a7a', legs: '#9fc8d8', feet: '#3a4a6a', eye: '#1a1a1a' },
  goblin:    { kind: 'human', short: true, skin: '#6aa84f', hair: '#6aa84f', hairStyle: 'goblin', top: '#7a5a3a', top2: '#7a5a3a', bottom: '#5a4a2a', legs: '#6aa84f', feet: '#3a2a1a', eye: '#e02020', extra: 'club' },
  hobgoblin: { kind: 'human', skin: '#c9733a', hair: '#2a1a10', hairStyle: 'goblin', top: '#4a2a2a', top2: '#6a3a3a', bottom: '#2a2a2a', legs: '#2a2a2a', feet: '#1a1a1a', eye: '#ffd000', extra: 'bomb' },
  hoarder:   { kind: 'human', skin: '#d8b0a0', hair: '#c8c8cc', hairStyle: 'long', top: '#c05a90', top2: '#e8a0c8', bottom: '#c05a90', legs: '#d8b0a0', feet: '#f0f0f0', eye: '#e02020', extra: 'bags' },
  donut:     { kind: 'cat', fur: '#e8a45c', fur2: '#fae0b8', eye: '#3a8a3a', tiara: true },
  feralcat:  { kind: 'cat', fur: '#6e6e76', fur2: '#9a9aa2', eye: '#e0e020' },
  mongo:     { kind: 'dino', body: '#5aa04a', dark: '#3c7a30', belly: '#d6e6a0' },
  rat:       { kind: 'rat' },
  tuskling:  { kind: 'tusk' },
  grub:      { kind: 'grub' },
  shade:     { kind: 'shade' },
};

function drawHumanoid(d, dir, f) {
  const P = Pix(16, 16);
  const hy = d.short ? 3 : 1;
  const ty = hy + 7;
  const torsoH = d.short ? 2 : 3;
  const by = ty + torsoH;
  const bottomH = d.short ? 1 : 2;
  const ly = by + bottomH;
  const heart = '#e0405a';
  const skin = d.skin, hair = d.hair;

  if (dir === DOWN || dir === UP) {
    // legs + feet
    const legL = f === 1, legR = f === 2; // raised
    if (!legL) { P.rect(5, ly, 2, 14 - ly, d.legs); P.rect(5, 14, 2, 1, d.feet); } else P.rect(5, 13, 2, 1, d.feet);
    if (!legR) { P.rect(9, ly, 2, 14 - ly, d.legs); P.rect(9, 14, 2, 1, d.feet); } else P.rect(9, 13, 2, 1, d.feet);
    // bottom
    P.rect(4, by, 8, bottomH, d.bottom);
    if (d.pattern === 'hearts') {
      if (dir === DOWN) P.px(5, by, heart).px(10, by, heart).px(7, by + bottomH - 1, heart);
      else P.px(6, by + bottomH - 1, heart).px(10, by, heart);
    }
    // torso + arms
    P.rect(4, ty, 8, torsoH, d.top);
    if (dir === DOWN && d.top2) P.rect(7, ty, 2, torsoH, d.top2);
    const sw = f === 1 ? -1 : f === 2 ? 1 : 0;
    P.rect(3, ty, 1, torsoH, shade(d.top, -0.15)).rect(12, ty, 1, torsoH, shade(d.top, -0.15));
    P.px(3, ty + torsoH + (sw < 0 ? -1 : 0), skin).px(12, ty + torsoH + (sw > 0 ? -1 : 0), skin);
    // head
    P.rect(4, hy + 1, 8, 5, skin).rect(5, hy, 6, 1, skin).rect(5, hy + 6, 6, 1, skin);
    const st = d.hairStyle;
    if (dir === DOWN) {
      if (st === 'short' || st === 'ponytail' || st === 'long') {
        P.rect(5, hy, 6, 1, hair).rect(4, hy + 1, 8, 2, hair).px(4, hy + 3, hair).px(11, hy + 3, hair).px(5, hy + 3, hair).px(8, hy + 3, hair);
        if (st === 'long') P.rect(3, hy + 2, 1, 7, hair).rect(12, hy + 2, 1, 7, hair).rect(4, hy + 3, 1, 5, hair).rect(11, hy + 3, 1, 5, hair);
      } else if (st === 'hood') {
        P.rect(5, hy - 1 < 0 ? 0 : hy - 1, 6, 1, hair).rect(4, hy, 8, 3, hair).rect(3, hy + 1, 1, 7, hair).rect(12, hy + 1, 1, 7, hair).rect(4, hy + 3, 1, 4, hair).rect(11, hy + 3, 1, 4, hair);
        P.rect(5, hy + 3, 6, 1, shade(skin, -0.25));
      } else if (st === 'goblin') {
        P.px(3, hy + 3, skin).px(2, hy + 2, skin).px(12, hy + 3, skin).px(13, hy + 2, skin);
      } else if (st === 'bopca') {
        P.rect(2, hy + 1, 2, 3, hair).rect(12, hy + 1, 2, 3, hair).px(3, hy + 2, '#f0b0c8').px(12, hy + 2, '#f0b0c8');
        P.rect(5, hy, 6, 1, hair);
      } else if (st === 'fish') {
        P.rect(3, hy + 2, 1, 3, hair).rect(12, hy + 2, 1, 3, hair).rect(7, hy - 1 < 0 ? 0 : hy - 1, 2, 1, hair);
      }
      // face
      if (d.bigEyes) {
        P.rect(5, hy + 3, 2, 2, '#ffffff').rect(9, hy + 3, 2, 2, '#ffffff').px(6, hy + 4, d.eye).px(9, hy + 4, d.eye);
        P.rect(7, hy + 6, 2, 1, shade(skin, -0.35));
      } else {
        P.px(6, hy + 4, d.eye).px(9, hy + 4, d.eye);
        if (d.stubble) P.rect(6, hy + 6, 4, 1, shade(skin, -0.2));
        else P.px(7, hy + 6, shade(skin, -0.25)).px(8, hy + 6, shade(skin, -0.25));
      }
    } else {
      // back of head
      if (st === 'short' || st === 'ponytail' || st === 'long') {
        P.rect(4, hy + 1, 8, 5, hair).rect(5, hy, 6, 1, hair);
        if (st === 'long') P.rect(3, hy + 2, 10, 7, hair);
        if (st === 'ponytail') P.rect(7, hy + 6, 2, 4, hair).px(7, hy + 5, shade(hair, -0.2)).px(8, hy + 5, shade(hair, -0.2));
      } else if (st === 'hood') {
        P.rect(4, hy, 8, 7, hair).rect(3, hy + 1, 10, 7, hair).rect(5, hy - 1 < 0 ? 0 : hy - 1, 6, 1, hair);
      } else if (st === 'goblin') {
        P.px(3, hy + 3, skin).px(2, hy + 2, skin).px(12, hy + 3, skin).px(13, hy + 2, skin);
      } else if (st === 'bopca') {
        P.rect(2, hy + 1, 2, 3, hair).rect(12, hy + 1, 2, 3, hair).rect(5, hy, 6, 2, hair);
      } else if (st === 'fish') {
        P.rect(3, hy + 2, 1, 3, hair).rect(12, hy + 2, 1, 3, hair).rect(7, hy - 1 < 0 ? 0 : hy - 1, 2, 3, hair);
      }
    }
  } else {
    // side view facing right (left is mirrored later)
    if (f === 0) { P.rect(7, ly, 2, 14 - ly, d.legs); P.rect(7, 14, 3, 1, d.feet); }
    else if (f === 1) { P.rect(5, ly, 2, 14 - ly, d.legs).rect(5, 14, 2, 1, d.feet); P.rect(9, ly, 2, 14 - ly, d.legs).rect(9, 14, 3, 1, d.feet); }
    else { P.rect(6, ly, 2, 14 - ly, shade(d.legs, -0.1)).rect(6, 14, 2, 1, d.feet); P.rect(8, 13, 3, 1, d.feet); }
    P.rect(5, by, 6, bottomH, d.bottom);
    if (d.pattern === 'hearts') P.px(6, by, heart).px(9, by + bottomH - 1, heart);
    P.rect(5, ty, 6, torsoH, d.top);
    if (d.top2) P.rect(10, ty, 1, torsoH, d.top2);
    const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
    P.rect(7, ty, 2, torsoH, shade(d.top, -0.18));
    P.px(7 + sw, ty + torsoH, skin);
    P.rect(5, hy + 1, 7, 5, skin).rect(6, hy, 5, 1, skin).rect(6, hy + 6, 5, 1, skin);
    const st = d.hairStyle;
    if (st === 'short' || st === 'ponytail' || st === 'long') {
      P.rect(6, hy, 5, 1, hair).rect(5, hy + 1, 7, 2, hair).rect(5, hy + 3, 3, 2, hair);
      if (st === 'long') P.rect(4, hy + 2, 3, 7, hair);
      if (st === 'ponytail') P.rect(3, hy + 3, 2, 5, hair).px(4, hy + 2, hair);
    } else if (st === 'hood') {
      P.rect(5, hy - 1 < 0 ? 0 : hy - 1, 6, 1, hair).rect(5, hy, 7, 3, hair).rect(4, hy + 1, 3, 7, hair);
    } else if (st === 'goblin') {
      P.px(6, hy + 2, skin).px(5, hy + 1, skin).px(7, hy + 3, shade(skin, -0.2));
    } else if (st === 'bopca') {
      P.rect(4, hy, 3, 4, hair).px(5, hy + 1, '#f0b0c8');
    } else if (st === 'fish') {
      P.rect(5, hy + 2, 1, 3, hair).rect(6, hy - 1 < 0 ? 0 : hy - 1, 3, 1, hair);
    }
    if (d.bigEyes) P.rect(9, hy + 3, 2, 2, '#ffffff').px(10, hy + 4, d.eye);
    else P.px(10, hy + 4, d.eye);
    if (d.stubble) P.rect(9, hy + 6, 2, 1, shade(skin, -0.2));
  }

  // accessories
  const handX = dir === LEFT || dir === RIGHT ? 7 : 12;
  const handY = ty + torsoH;
  switch (d.extra) {
    case 'flask': if (dir !== UP) P.rect(handX, handY - 2, 2, 3, '#7dff9a').px(handX, handY - 3, '#e8e8e8'); break;
    case 'tablet': if (dir !== UP) P.rect(handX - 1, handY - 3, 3, 4, '#2a2a3a').px(handX, handY - 2, '#7ad0ff'); break;
    case 'club': if (dir !== UP) P.rect(handX, handY - 4, 2, 5, '#8a5a2e'); break;
    case 'bomb': if (dir !== UP) P.ell(handX + 0.5, handY - 1, 1.8, 1.8, '#26262e').px(handX, handY - 3, '#ffa020'); break;
    case 'bags': if (dir !== UP) P.rect(handX - 1, handY - 1, 3, 4, '#e8e0d0').rect(2, handY - 1, 3, 4, '#d0c090'); break;
  }
  P.outline();
  return P.c;
}

function drawCat(d, dir, f) {
  const P = Pix(16, 16);
  const fur = d.fur, fur2 = d.fur2, pink = '#e87890', gold = '#ffd23a', gem = '#ff3a6a';
  if (dir === RIGHT || dir === LEFT) {
    P.ell(2.5, 6.5, 1.6, 3.2, fur).ell(2.5, 4, 1.2, 1.2, fur2);
    P.ell(6.5, 10.5, 5, 3.2, fur).ell(7, 12.3, 3, 1.1, fur2);
    const lx = f === 1 ? [3, 9] : f === 2 ? [5, 7] : [4, 8];
    P.rect(lx[0], 13, 2, 2, fur).rect(lx[1], 13, 2, 2, fur);
    P.ell(10.5, 7, 3.6, 3.2, fur).ell(11.5, 8.3, 2, 1.3, fur2);
    P.px(8, 3, fur).px(8, 4, fur).px(9, 4, fur).px(13, 3, fur).px(13, 4, fur).px(12, 4, fur);
    P.px(12, 6, d.eye).px(14, 8, pink);
    if (d.tiara) P.rect(9, 3, 3, 1, gold).px(10, 2, gold).px(10, 3, gem);
  } else if (dir === UP) {
    const dark = shade(fur, -0.22);
    P.ell(12.5, 12, 1.5, 2.4, fur).ell(13, 9.6, 1.3, 1.3, fur2);
    P.ell(8, 11.5, 4.8, 3.2, fur);
    P.rect(7, 9, 2, 5, dark);
    P.rect(5, f === 1 ? 13 : 14, 2, 1, fur2).rect(9, f === 2 ? 13 : 14, 2, 1, fur2);
    P.ell(8, 6, 3.8, 3.3, fur);
    P.rect(5, 9, 6, 1, dark);
    P.px(5, 2, fur).px(5, 3, fur).px(6, 3, fur).px(10, 2, fur).px(10, 3, fur).px(9, 3, fur);
    P.px(7, 5, fur2).px(8, 5, fur2);
    if (d.tiara) P.rect(6, 2, 4, 1, gold).px(7, 1, gold).px(8, 1, gold);
  } else {
    P.ell(12.5, 9, 1.4, 3, fur);
    P.ell(8, 11.5, 4.5, 3, fur);
    P.ell(8, 11.5, 2.2, 2.2, fur2);
    const up1 = f === 1, up2 = f === 2;
    P.rect(5, up1 ? 12 : 13, 2, 2, fur2).rect(9, up2 ? 12 : 13, 2, 2, fur2);
    P.ell(8, 6.5, 4.3, 3.6, fur);
    P.px(4, 2, fur).px(4, 3, fur).px(5, 3, fur).px(11, 2, fur).px(11, 3, fur).px(10, 3, fur);
    {
      P.ell(8, 7.8, 2.6, 1.6, fur2);
      P.px(6, 6, d.eye).px(10, 6, d.eye).px(8, 8, pink);
    }
    if (d.tiara) P.rect(6, 2, 4, 1, gold).px(7, 1, gold).px(9, 1, gold).px(8, 2, gem);
  }
  P.outline();
  return P.c;
}

function drawDino(d, f) {
  const P = Pix(16, 16);
  P.ell(3, 9.5, 3, 1.4, d.body);
  P.ell(7.5, 10, 3.5, 2.8, d.body).ell(8, 11.3, 2.3, 1.2, d.belly);
  P.ell(11, 6.5, 2.2, 2.4, d.body).rect(12, 6, 3, 2, d.body).px(14, 8, d.body);
  P.px(11, 5, '#ffd23a').px(14, 8, '#ffffff');
  P.px(10, 9, d.dark).px(11, 10, d.dark);
  P.px(6, 7, d.dark).px(8, 7, d.dark).px(10, 4, d.dark);
  if (f === 0) P.rect(6, 12, 2, 2, d.body).rect(9, 12, 2, 2, d.body).rect(6, 14, 3, 1, d.dark).rect(9, 14, 3, 1, d.dark);
  else if (f === 1) P.rect(5, 12, 2, 2, d.body).rect(10, 12, 2, 2, d.body).rect(4, 14, 3, 1, d.dark).rect(10, 14, 3, 1, d.dark);
  else P.rect(7, 12, 2, 2, d.body).rect(8, 12, 2, 1, d.body).rect(7, 14, 4, 1, d.dark);
  P.outline();
  return P.c;
}

function drawRat(f) {
  const P = Pix(16, 16);
  P.line(3, 11, 0, 8 + (f % 2), '#d890a0');
  P.ell(7, 10.5, 4, 2.5, '#8a8a92').ell(7, 11.5, 2.5, 1, '#a8a8b0');
  P.ell(11.5, 10, 2.2, 1.8, '#8a8a92');
  P.px(10, 8, '#d0a0a8').px(12, 9, '#e02020').px(14, 10, '#e090a0');
  if (f === 1) P.px(5, 13, '#d890a0').px(10, 13, '#d890a0'); else P.px(6, 13, '#d890a0').px(9, 13, '#d890a0');
  P.outline();
  return P.c;
}

function drawTusk(f) {
  const P = Pix(16, 16);
  P.ell(7.5, 10, 4.5, 3, '#8a5a3a');
  P.line(4, 7, 10, 7, '#5a3a22');
  P.ell(12, 10, 2.5, 2.2, '#8a5a3a');
  P.rect(13, 10, 2, 2, '#c89078');
  P.px(13, 12, '#ffffff').px(14, 11, '#ffffff').px(12, 8, '#111111').px(11, 7, '#6a4028');
  if (f === 1) P.rect(4, 12, 2, 2, '#5a3a22').rect(10, 12, 2, 2, '#5a3a22');
  else P.rect(5, 12, 2, 2, '#5a3a22').rect(9, 12, 2, 2, '#5a3a22');
  P.outline();
  return P.c;
}

function drawGrub(f) {
  const P = Pix(16, 16);
  const a = '#b08a5a', b = '#6a4a2a';
  const o = f === 1 ? 1 : 0;
  P.ell(3.5, 11 + o, 2.4, 2.4, b);
  P.ell(6.5, 10.5 - o, 2.8, 2.8, a);
  P.ell(10, 10.5 + o, 3, 3, b);
  P.ell(12.5, 10, 2.6, 2.8, a);
  P.px(13, 9, '#1a1010').px(14, 11, '#fff').px(15, 11, '#3a1010');
  P.outline();
  return P.c;
}

function drawShade(f) {
  const P = Pix(16, 16);
  const c = '#8a6ac8';
  P.ell(8, 7 + f * 0.5, 5, 5, c);
  P.rect(3, 7 + f, 10, 5, c);
  for (let i = 0; i < 5; i++) P.rect(3 + i * 2, 12 + ((i + f) % 2), 2, 1, c);
  P.rect(5, 6, 2, 2, '#ffffff').rect(9, 6, 2, 2, '#ffffff').px(6, 7, '#1a0a2a').px(10, 7, '#1a0a2a');
  P.outline('#2a1848');
  return P.c;
}

const CHAR_CACHE = {};
function getChar(id) {
  if (CHAR_CACHE[id]) return CHAR_CACHE[id];
  const d = CHAR_DEFS[id];
  const res = { frames: [[], [], [], []], sideOnly: false, portrait: null };
  if (d.kind === 'human' || d.kind === 'cat') {
    for (const dir of [DOWN, UP, RIGHT]) {
      for (let f = 0; f < 3; f++) res.frames[dir][f] = d.kind === 'cat' ? drawCat(d, dir, f) : drawHumanoid(d, dir, f);
    }
    res.frames[LEFT] = res.frames[RIGHT].map(flipCanvas);
  } else {
    res.sideOnly = true;
    const draw = { dino: f => drawDino(d, f), rat: drawRat, tusk: drawTusk, grub: drawGrub, shade: drawShade }[d.kind];
    for (let f = 0; f < 3; f++) res.frames[RIGHT][f] = draw(f % 2 === 0 && f > 0 ? 0 : f);
    res.frames[LEFT] = res.frames[RIGHT].map(flipCanvas);
    res.frames[DOWN] = res.frames[RIGHT];
    res.frames[UP] = res.frames[LEFT];
  }
  // Portrait: upper part of the front-facing sprite
  const src = res.frames[res.sideOnly ? RIGHT : DOWN][0];
  const pc = makeCanvas(16, 13);
  pc.getContext('2d').drawImage(src, 0, 0);
  res.portrait = res.sideOnly ? src : pc;
  CHAR_CACHE[id] = res;
  return res;
}
