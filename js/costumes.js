// ============================================================
// costumes.js — Gerald costume data + equip logic
// ============================================================

const COSTUMES_DATA = [
  {
    id:          'robe_torn',
    name:        'Torn Robe',
    emoji:       '😩',
    imagePath:   'assets/images/gerald/Gerald_01.png',
    cost:        0,
    clickMult:   1,
    requiredHq:  0,
    desc:        'The classic. Has character. Character being "mysterious stains."',
  },
  {
    id:          'robe_clean',
    name:        'Clean Robe',
    emoji:       '🧙',
    imagePath:   'assets/images/gerald/Gerald_02.png',
    cost:        500,
    clickMult:   1.2,
    requiredHq:  1,
    desc:        'Washed at least once. Gives off "certified" vibes.',
  },
  {
    id:          'suit',
    name:        'Business Suit',
    emoji:       '😎',
    imagePath:   'assets/images/gerald/Gerald_03.png',
    cost:        3000,
    clickMult:   1.5,
    requiredHq:  2,
    desc:        'A suit! People trust suits. Gerald trusts suits. Gerald is right.',
  },
  {
    id:          'cape',
    name:        'Villain Cape',
    emoji:       '🦸',
    imagePath:   'assets/images/gerald/Gerald_04.png',
    cost:        20000,
    clickMult:   2,
    requiredHq:  3,
    desc:        'Technically a tablecloth. Swishes magnificently.',
  },
  {
    id:          'archmage',
    name:        'Archmage Gear',
    emoji:       '🧙‍♂️',
    imagePath:   'assets/images/gerald/Gerald_05.png',
    cost:        120000,
    clickMult:   3,
    requiredHq:  4,
    desc:        'Full set. Staff, hat, boots. One staff is a curtain rod. Ignore that.',
  },
  {
    id:          'pope',
    name:        "Pope's Hat",
    emoji:       '👑',
    imagePath:   'assets/images/gerald/Gerald_06.png',
    cost:        700000,
    clickMult:   5,
    requiredHq:  5,
    desc:        'Blessed. Definitely. No further questions.',
  },
];

function isCostumeUnlocked(id) {
  return STATE.purchasedCostumes.includes(id);
}

function canEquipCostume(id) {
  const c = COSTUMES_DATA.find(x => x.id === id);
  if (!c) return false;
  if (STATE.hqLevel < c.requiredHq) return false;
  if (c.cost === 0) return true;
  return isCostumeUnlocked(id) || canAfford(c.cost);
}

function buyCostume(id) {
  const c = COSTUMES_DATA.find(x => x.id === id);
  if (!c || isCostumeUnlocked(id)) return false;
  if (STATE.hqLevel < c.requiredHq) return false;
  if (!canAfford(c.cost)) return false;
  spendTp(c.cost);
  STATE.purchasedCostumes.push(id);
  equipCostume(id);
  return true;
}

function equipCostume(id) {
  if (!isCostumeUnlocked(id)) return false;
  STATE.costume = id;
  recalcState();
  Audio.sfxBuy();
  const c = COSTUMES_DATA.find(x => x.id === id);
  showNotification(`Gerald is now wearing: ${c.emoji} ${c.name}!`);
  return true;
}

function getCurrentCostume() {
  return COSTUMES_DATA.find(c => c.id === STATE.costume) || COSTUMES_DATA[0];
}

// Returns the display emoji or null if real image should be used
function getGeraldImage(costumeId) {
  const c = COSTUMES_DATA.find(x => x.id === costumeId);
  if (!c) return { emoji: '😩', imagePath: null };
  return { emoji: c.emoji, imagePath: c.imagePath };
}
