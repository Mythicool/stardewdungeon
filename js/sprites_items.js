'use strict';
// ---------------------------------------------------------------------------
// Item icons (16x16), generated from a small shape spec {s, c, c2}.
// ---------------------------------------------------------------------------

const TOOL_METAL = ['#9aa4ae', '#d9843b', '#e4e8ee', '#f4d03f'];

function drawIcon(spec, lvl = 0) {
  const key = 'icon_' + spec.s + '_' + (spec.c || '') + '_' + (spec.c2 || '') + '_' + lvl;
  return cached(key, () => {
    const P = Pix(16, 16);
    const c = spec.c || '#cccccc', c2 = spec.c2 || shade(c, 0.35);
    const leaf = '#4caa3c', wood = '#8e5a2e', metal = TOOL_METAL[lvl] || TOOL_METAL[0];
    switch (spec.s) {
      case 'root':
        P.ell(8, 10, 4, 4, c).px(6, 8, c2).px(8, 14, shade(c, -0.2)).px(8, 15, shade(c, -0.3));
        P.line(8, 6, 5, 1, leaf).line(8, 6, 11, 1, leaf).line(8, 6, 8, 1, '#3a8a2c');
        break;
      case 'mandrake':
        P.ell(8, 10, 4.5, 4.5, c).px(6, 9, '#1a1010').px(10, 9, '#1a1010').rect(7, 11, 3, 2, '#3a1010');
        P.line(6, 14, 4, 15, c).line(10, 14, 12, 15, c);
        P.line(8, 5, 4, 1, leaf).line(8, 5, 12, 1, leaf).line(8, 5, 8, 1, '#3a8a2c');
        break;
      case 'berry':
        P.ell(6, 9, 3, 3, c).ell(10, 9, 3, 3, c).ell(8, 12, 3, 3, c).px(5, 8, c2).px(9, 8, c2).px(7, 11, c2);
        P.line(8, 6, 8, 3, '#3a8a2c').ell(10, 4, 2, 1, leaf);
        break;
      case 'pepper':
        P.ell(8, 9, 3, 5, c).ell(9, 13, 2, 2, c).px(7, 6, c2).px(7, 7, c2);
        P.rect(7, 2, 2, 3, '#3a8a2c');
        break;
      case 'melon':
        P.ell(8, 9, 6.5, 5.5, c);
        P.line(4, 5, 4, 13, c2).line(8, 4, 8, 14, c2).line(12, 5, 12, 13, c2);
        break;
      case 'gourd':
        P.ell(8, 10, 6.5, 5, c);
        P.line(5, 6, 5, 14, shade(c, -0.2)).line(11, 6, 11, 14, shade(c, -0.2));
        P.rect(7, 2, 2, 4, '#6a4a20');
        break;
      case 'corn':
        P.ell(8, 8, 3, 6, c);
        for (let y = 4; y < 14; y += 2) P.px(7, y, c2).px(9, y + 1, c2);
        P.line(5, 14, 3, 8, leaf).line(11, 14, 13, 8, leaf);
        break;
      case 'leafy':
        P.ell(8, 9, 5, 5, c).ell(6, 7, 3, 3, c2).ell(10, 7, 3, 3, shade(c, -0.1));
        P.line(8, 14, 8, 6, shade(c, -0.35));
        break;
      case 'mushroom':
        P.rect(7, 8, 3, 6, '#ece4d4');
        P.ell(8.5, 7, 6, 3.5, c).px(6, 5, c2).px(10, 6, c2).px(8, 4, c2);
        break;
      case 'seeds':
        P.rect(3, 2, 10, 12, '#e8dcc0').rect(3, 2, 10, 4, c).rect(3, 12, 10, 2, shade('#e8dcc0', -0.2));
        P.px(6, 8, '#6a4a2a').px(9, 9, '#6a4a2a').px(7, 10, '#6a4a2a').px(10, 7, '#6a4a2a');
        P.px(7, 3, c2).px(9, 4, c2);
        break;
      case 'fish':
        P.ell(7, 8, 5, 3, c).ell(7, 9, 3.5, 1.5, c2);
        P.line(12, 8, 15, 5, c).line(12, 8, 15, 11, c).line(13, 8, 15, 8, c);
        P.px(4, 7, '#111').px(8, 5, shade(c, -0.3)).px(9, 5, shade(c, -0.3));
        break;
      case 'ore':
        P.ell(8, 9, 6, 5, '#7a7a82').ell(7, 8, 3.5, 2.5, '#9a9aa2');
        P.rect(5, 7, 2, 2, c).rect(9, 10, 3, 2, c).px(10, 6, c).px(5, 7, c2).px(9, 10, c2);
        break;
      case 'gem':
        P.rect(5, 4, 6, 1, c2).rect(4, 5, 8, 2, c).rect(5, 7, 6, 2, c).rect(6, 9, 4, 2, c).rect(7, 11, 2, 2, c);
        P.px(6, 5, '#ffffff').px(5, 6, c2).px(7, 7, c2);
        break;
      case 'wood':
        P.rect(2, 6, 12, 6, '#8e5a2e').rect(2, 6, 12, 1, '#b07c48');
        P.ell(13, 9, 2, 3, '#c8965a').px(13, 9, '#8e5a2e');
        P.line(4, 9, 9, 9, '#6e4420');
        break;
      case 'stone':
        P.ell(8, 9, 6, 4.5, '#8e8e98').ell(7, 8, 3.5, 2.5, '#b4b4bc').px(10, 11, '#6a6a74');
        break;
      case 'fiber':
        for (let i = 0; i < 5; i++) P.line(4 + i * 2, 14, 3 + i * 2 + (i % 2) * 3, 3, i % 2 ? '#6ab04a' : '#8ac860');
        P.rect(4, 9, 9, 1, '#c8a060');
        break;
      case 'coal':
        P.ell(8, 9, 5.5, 4.5, '#1c1c20').ell(7, 8, 3, 2, '#3a3a42').px(6, 7, '#5a5a62');
        break;
      case 'powder':
        P.ell(8, 10, 5, 4.5, c).rect(6, 4, 4, 3, c).rect(5, 6, 6, 1, '#6a4a2a');
        P.px(6, 9, c2).px(10, 12, '#ff9020').px(8, 11, '#ffd020');
        break;
      case 'tail':
        P.line(3, 12, 6, 8, c, 2).line(6, 8, 11, 6, c, 2).line(11, 6, 13, 3, c);
        P.ell(3, 12, 1.5, 1.5, '#8a8a92');
        break;
      case 'tusk':
        P.line(4, 13, 7, 8, c, 2).line(7, 8, 11, 4, c, 2).line(11, 4, 13, 3, c);
        P.px(4, 13, '#a08060').px(5, 13, '#a08060');
        break;
      case 'goo':
        P.ell(8, 10, 5.5, 4, c).ell(8, 7, 3, 3, c).px(7, 6, c2).px(6, 9, c2);
        break;
      case 'ear':
        P.line(4, 12, 12, 3, c, 3).ell(6, 11, 3, 3, c).px(7, 10, shade(c, -0.3));
        break;
      case 'sandwich':
        P.rect(2, 5, 12, 3, '#e8c080').rect(2, 8, 12, 1, '#6ac05a').rect(2, 9, 12, 1, '#e05a3a').rect(2, 10, 12, 1, '#f0d060').rect(2, 11, 12, 3, '#e8c080');
        P.rect(2, 5, 12, 1, '#f4d8a0');
        break;
      case 'bowl':
        P.ell(8, 7, 5.5, 2.5, c).px(6, 6, c2).px(10, 7, c2);
        P.rect(2, 8, 12, 2, '#e8e0d0').rect(3, 10, 10, 2, '#e8e0d0').rect(5, 12, 6, 2, '#d0c8b8');
        break;
      case 'can':
        P.rect(4, 4, 8, 10, c).rect(4, 4, 8, 2, '#d8d8e0').rect(4, 12, 8, 2, '#d8d8e0');
        P.rect(5, 7, 6, 4, '#ffffff').px(7, 8, '#e8a45c').px(8, 9, '#e8a45c').px(8, 8, '#e8a45c');
        break;
      case 'mug':
        P.rect(3, 4, 8, 10, '#e8c040').rect(3, 3, 8, 2, '#ffffff').rect(11, 6, 3, 1, '#c8a030').rect(13, 6, 1, 5, '#c8a030').rect(11, 10, 3, 1, '#c8a030');
        P.px(5, 7, '#fff0a0').px(5, 8, '#fff0a0');
        break;
      case 'potion':
        P.rect(7, 2, 2, 3, '#d8d8e0').rect(6, 1, 4, 1, '#8e5a2e');
        P.ell(8, 10, 5, 4.5, '#d8e8f0').ell(8, 11, 4, 3, c).px(6, 9, c2).px(10, 8, '#ffffff');
        break;
      case 'box':
        P.rect(2, 5, 12, 10, c).rect(2, 5, 12, 3, c2);
        P.rect(7, 5, 2, 10, '#ffffff').rect(2, 9, 12, 1, shade(c, -0.3));
        P.px(5, 3, '#ffffff').px(6, 4, '#ffffff').px(10, 3, '#ffffff').px(9, 4, '#ffffff');
        break;
      case 'hoe':
        P.line(4, 14, 11, 4, wood, 2); P.rect(9, 2, 5, 2, metal).rect(12, 4, 2, 2, metal);
        break;
      case 'watercan':
        P.rect(3, 6, 8, 7, metal).rect(3, 6, 8, 1, shade(metal, 0.3));
        P.line(11, 9, 14, 5, metal).rect(5, 3, 4, 1, shade(metal, -0.3)).rect(4, 4, 1, 2, shade(metal, -0.3)).rect(9, 4, 1, 2, shade(metal, -0.3));
        P.px(14, 4, '#6ab0ff');
        break;
      case 'axe':
        P.line(4, 14, 10, 3, wood, 2); P.ell(11, 5, 3, 3.5, metal).px(13, 4, shade(metal, 0.4));
        break;
      case 'pick':
        P.line(5, 14, 10, 4, wood, 2); P.line(3, 5, 8, 2, metal, 2).line(8, 2, 14, 5, metal, 2);
        break;
      case 'rod':
        P.line(3, 14, 13, 2, '#6e4420', 1).line(4, 14, 13, 3, '#8e5a2e');
        P.line(13, 2, 13, 11, '#e8e8e8').ell(13, 12, 1.2, 1.2, '#e03030');
        P.ell(5, 12, 1.5, 1.5, '#9aa4ae');
        break;
      case 'foot': {
        const sk = '#f0c090', sd = '#d8a070';
        P.ell(8.5, 9.5, 3.6, 5.2, sk).ell(8, 13.2, 2.6, 1.8, sk);
        P.px(10, 10, sd).px(10, 11, sd).px(9, 12, sd);
        P.ell(6, 3.2, 1.6, 1.6, sk);
        P.ell(8.6, 2.6, 1.1, 1.1, sk).ell(10.5, 3.2, 1, 1, sk).ell(12, 4.4, 0.9, 0.9, sk).ell(12.8, 6, 0.8, 0.8, sk);
        if (c && c !== '#cccccc') P.px(5, 4, c).px(6, 5, c).px(7, 4, c);
        break;
      }
      case 'ring':
        P.ell(8, 9, 5, 5, c).ell(8, 9, 3, 3, '#00000000');
        P.x.clearRect(6, 7, 4, 4);
        P.rect(7, 2, 3, 3, c2).px(8, 3, '#ffffff');
        break;
      case 'knuckles':
        P.rect(2, 6, 12, 6, c).rect(3, 7, 2, 2, '#00000000');
        P.x.clearRect(3, 7, 2, 2); P.x.clearRect(6, 7, 2, 2); P.x.clearRect(9, 7, 2, 2);
        P.px(3, 4, c2).px(6, 4, c2).px(9, 4, c2).px(12, 4, c2).rect(3, 5, 10, 1, c2);
        break;
      case 'sprinkler':
        P.rect(3, 8, 10, 2, c).rect(7, 4, 2, 10, c).ell(8, 9, 2.5, 2.5, shade(c, -0.3)).rect(7, 3, 2, 2, '#4aa8e8');
        break;
      case 'bomb':
        P.ell(8, 10, 5, 5, c).px(6, 8, '#888').px(7, 7, '#aaa').line(9, 5, 11, 2, '#c8a060').px(12, 1, '#ffa020').px(12, 2, '#ffe060');
        break;
      case 'sunglasses':
        P.rect(1, 6, 14, 1, '#1a1a1a').ell(4.5, 8.5, 3, 2.3, '#1a1a1a').ell(11.5, 8.5, 3, 2.3, '#1a1a1a').px(3, 7, '#8a8aff').px(10, 7, '#8a8aff');
        break;
      case 'tiara':
        P.rect(2, 10, 12, 2, c).px(3, 8, c).px(3, 9, c).px(8, 5, c).rect(7, 6, 3, 4, c).px(12, 8, c).px(12, 9, c).px(8, 7, '#ff3a6a');
        break;
      case 'collar':
        P.ell(8, 8, 6, 5, c).ell(8, 8, 4, 3, '#00000000'); P.x.clearRect(5, 6, 7, 5);
        P.ell(8, 13, 1.8, 1.8, '#f4d03f');
        break;
      case 'tentacle':
        P.line(3, 14, 6, 9, c, 3).line(6, 9, 11, 7, c, 2).line(11, 7, 13, 3, c, 2);
        P.px(5, 11, c2).px(8, 8, c2).px(11, 6, c2);
        break;
      case 'skewer':
        P.line(2, 14, 13, 3, '#c8a060'); P.ell(8, 8, 3, 2, c).ell(11, 5, 2.5, 1.8, c).px(8, 7, c2);
        break;
      case 'leek':
        P.line(4, 14, 10, 4, '#f0f0e0', 2).line(10, 4, 13, 1, leaf).line(10, 4, 14, 4, leaf).line(9, 5, 11, 1, '#3a8a2c');
        break;
      case 'cake':
        P.rect(3, 7, 10, 7, c).rect(3, 6, 10, 2, c2).px(8, 4, '#ff4040').px(8, 5, '#6ac05a');
        break;
      default:
        P.ell(8, 8, 5, 5, c);
    }
    P.outline();
    return P.c;
  });
}
