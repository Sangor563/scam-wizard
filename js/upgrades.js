// ============================================================
// upgrades.js — One-time upgrade data + purchase logic
// ============================================================

const UPGRADES_DATA = [
  {
    id:        'u1',
    name:      'Extra Bold Confidence',
    icon:      '💪',
    desc:      'Speak louder. Charge more. Works every time.',
    effect:    'Click power ×2',
    cost:      120,
    clickMult: 2,
  },
  {
    id:        'u2',
    name:      'Bigger Words Dictionary',
    icon:      '📚',
    desc:      '"Synergistic metaphysical resonance." They\'ll pay for anything now.',
    effect:    'All income ×1.5',
    cost:      700,
    hpsMult:   1.5,
  },
  {
    id:        'u3',
    name:      'Drama School Certificate',
    icon:      '🎭',
    desc:      'Certificate printed on Gerald\'s personal printer. Very official.',
    effect:    'Click power ×5',
    cost:      5000,
    clickMult: 5,
  },
  {
    id:        'u4',
    name:      'Wand Polish Premium',
    icon:      '✨',
    desc:      'A wand that shines must surely work. Probably.',
    effect:    'All income ×2',
    cost:      28000,
    hpsMult:   2,
  },
  {
    id:        'u5',
    name:      'Believe In Yourself',
    icon:      '🌟',
    desc:      'Gerald read a self-help book. One paragraph. Transformative.',
    effect:    'Click power ×10',
    cost:      140000,
    clickMult: 10,
  },
  {
    id:        'u6',
    name:      'Legitimate Business™',
    icon:      '📋',
    desc:      'Registered in three countries. Two of them exist.',
    effect:    'All income ×3',
    cost:      500000,
    hpsMult:   3,
  },
  {
    id:        'u7',
    name:      'True Wizard Mode',
    icon:      '🧙',
    desc:      'Against all available evidence, it\'s all real. It has to be.',
    effect:    'Click ×5 AND income ×5',
    cost:      2000000,
    clickMult: 5,
    hpsMult:   5,
  },
  {
    id:        'u8',
    name:      'Become The Algorithm',
    icon:      '🤖',
    desc:      'Gerald has optimised himself for engagement. He doesn\'t sleep anymore.',
    effect:    'All income ×4',
    cost:      5000000,
    hpsMult:   4,
  },
  {
    id:        'u9',
    name:      'Gerald NFT Collection',
    icon:      '🖼️',
    desc:      'Limited edition. Each one is Gerald making a slightly different face.',
    effect:    'Click power ×20',
    cost:      20000000,
    clickMult: 20,
  },
  {
    id:        'u10',
    name:      'Ascended Consciousness',
    icon:      '✨',
    desc:      'Gerald has transcended. He exists everywhere. He sells everywhere.',
    effect:    'Everything ×10',
    cost:      500000000,
    clickMult: 10,
    hpsMult:   10,
  },
];

function isUpgradePurchased(id) {
  return STATE.upgrades.includes(id);
}

function buyUpgrade(id) {
  const upg = UPGRADES_DATA.find(u => u.id === id);
  if (!upg || isUpgradePurchased(id)) return false;
  if (!canAfford(upg.cost)) return false;
  spendTp(upg.cost);
  STATE.upgrades.push(id);
  recalcState();
  Audio.sfxBuy();
  showNotification(`Upgrade purchased: ${upg.name}!`, 'event');
  return true;
}

// Combined click multiplier from all owned upgrades
function getUpgradeClickMult() {
  let m = 1;
  for (const id of STATE.upgrades) {
    const u = UPGRADES_DATA.find(x => x.id === id);
    if (u && u.clickMult) m *= u.clickMult;
  }
  return m;
}

// Combined HPS multiplier from all owned upgrades
function getUpgradeHpsMult() {
  let m = 1;
  for (const id of STATE.upgrades) {
    const u = UPGRADES_DATA.find(x => x.id === id);
    if (u && u.hpsMult) m *= u.hpsMult;
  }
  return m;
}
