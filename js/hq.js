// ============================================================
// hq.js — Headquarters levels data + upgrade logic
// ============================================================

const HQ_DATA = [
  {
    level:       0,
    name:        "Gerald's Tent",
    icon:        '⛺',
    cost:        0,
    bonusHps:    0,
    unlocksCostume: 'robe_torn',
    desc:        'Home. Sort of. The groundsheet is optimistic.',
  },
  {
    level:       1,
    name:        'Rickety Shack',
    icon:        '🛖',
    cost:        500,
    bonusHps:    0.5,
    unlocksCostume: 'robe_clean',
    desc:        'Four walls. One door. The door is a curtain.',
  },
  {
    level:       2,
    name:        'Dodgy Office',
    icon:        '🏚',
    cost:        3000,
    bonusHps:    2,
    unlocksCostume: 'suit',
    desc:        'Gerald has a desk now. And a rubber plant. He\'s serious.',
  },
  {
    level:       3,
    name:        "Scammer's Manor",
    icon:        '🏠',
    cost:        20000,
    bonusHps:    8,
    unlocksCostume: 'cape',
    desc:        'Two stories. One of them is mostly true.',
  },
  {
    level:       4,
    name:        'Mystic Tower',
    icon:        '🗼',
    cost:        120000,
    bonusHps:    30,
    unlocksCostume: 'archmage',
    desc:        'A tower! For a wizard! Gerald wept when he moved in.',
  },
  {
    level:       5,
    name:        'Con Cathedral HQ',
    icon:        '🏰',
    cost:        700000,
    bonusHps:    120,
    unlocksCostume: 'pope',
    desc:        'Blessed by Gerald himself. The congregation is very committed.',
  },
];

function getNextHq() {
  return HQ_DATA[STATE.hqLevel + 1] || null;
}

function canUpgradeHq() {
  const next = getNextHq();
  return next && canAfford(next.cost);
}

function doUpgradeHq() {
  const next = getNextHq();
  if (!next || !canAfford(next.cost)) return false;
  spendTp(next.cost);
  STATE.hqLevel = next.level;
  // Unlock the associated costume
  if (next.unlocksCostume && !STATE.purchasedCostumes.includes(next.unlocksCostume)) {
    STATE.purchasedCostumes.push(next.unlocksCostume);
  }
  recalcState();
  Audio.sfxBuy();
  showNotification(`HQ upgraded to ${next.icon} ${next.name}!`, 'event');
  return true;
}

function getCurrentHq() {
  return HQ_DATA[STATE.hqLevel];
}
