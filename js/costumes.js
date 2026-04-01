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

  // ── Ad-unlocked special costumes ──────────────────────────
  {
    id:          'diamond',
    name:        'Diamond Gerald',
    emoji:       '💎',
    unlockType:  'ad',
    adDuration:  24 * 60 * 60 * 1000,
    imagePath:   'assets/images/gerald/Gerald_Diamond.png',
    clickMult:   4,
    desc:        'Every pebble is now a diamond. Allegedly.',
  },
  {
    id:          'villain',
    name:        'Villain Arc',
    emoji:       '😈',
    unlockType:  'ad',
    adDuration:  24 * 60 * 60 * 1000,
    imagePath:   'assets/images/gerald/Gerald_Villain.png',
    clickMult:   4,
    desc:        'Gerald has embraced his destiny. Sort of.',
  },
  {
    id:          'pixel',
    name:        'Pixel Gerald',
    emoji:       '👾',
    unlockType:  'ad',
    adDuration:  24 * 60 * 60 * 1000,
    imagePath:   'assets/images/gerald/Gerald_Pixel.png',
    clickMult:   3,
    desc:        'Retro scamming. 8-bit trust issues.',
  },
  {
    id:          'rainbow',
    name:        'Rainbow Mode',
    emoji:       '🌈',
    unlockType:  'ad',
    adDuration:  24 * 60 * 60 * 1000,
    imagePath:   'assets/images/gerald/Gerald_Rainbow.png',
    clickMult:   3.5,
    desc:        'Too magical. Gerald is blinding people.',
  },
  {
    id:          'ghost',
    name:        'Ghost Gerald',
    emoji:       '👻',
    unlockType:  'ad',
    adDuration:  24 * 60 * 60 * 1000,
    imagePath:   'assets/images/gerald/Gerald_Ghost.png',
    clickMult:   3.5,
    desc:        'Still scamming. Even from beyond.',
  },
  {
    id:          'baby',
    name:        'Baby Gerald',
    emoji:       '👶',
    unlockType:  'ad',
    adDuration:  24 * 60 * 60 * 1000,
    imagePath:   'assets/images/gerald/Gerald_Baby.png',
    clickMult:   5,
    desc:        'The scamming started early. Very early.',
  },
];

// ── Ad costume unlock system ──────────────────────────────────

const AD_COSTUMES_KEY = 'scam_wizard_ad_costumes';

function _loadAdData() {
  try { return JSON.parse(localStorage.getItem(AD_COSTUMES_KEY) || '{}'); }
  catch (e) { return {}; }
}

function _saveAdData(data) {
  try { localStorage.setItem(AD_COSTUMES_KEY, JSON.stringify(data)); }
  catch (e) {}
}

function isAdCostumeActive(id) {
  const d = _loadAdData();
  return !!d[id] && d[id] > Date.now();
}

function getAdCostumeRemaining(id) {
  const d = _loadAdData();
  return d[id] ? Math.max(0, d[id] - Date.now()) : 0;
}

function unlockAdCostume(id) {
  const c = COSTUMES_DATA.find(x => x.id === id);
  if (!c || c.unlockType !== 'ad') return false;
  const d = _loadAdData();
  d[id] = Date.now() + c.adDuration;
  _saveAdData(d);
  return true;
}

function formatAdTimer(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Called periodically from the game loop; reverts expired ad costume if equipped
function checkAdCostumeExpiry() {
  const c = COSTUMES_DATA.find(x => x.id === STATE.costume);
  if (!c || c.unlockType !== 'ad') return;
  if (isAdCostumeActive(STATE.costume)) return;

  const fallback = [...STATE.purchasedCostumes].reverse().find(id => {
    const x = COSTUMES_DATA.find(d => d.id === id);
    return x && x.unlockType !== 'ad';
  }) || 'robe_torn';

  STATE.costume = fallback;
  recalcState();
  showNotification('⌛ Ad costume expired. Back to the old look.', 'warning');
  if (typeof renderCostumesTab === 'function') renderCostumesTab();
  if (typeof updateGeraldDisplay === 'function') updateGeraldDisplay();
}

// ── Costume unlock helpers ────────────────────────────────────

function isCostumeUnlocked(id) {
  if (STATE.purchasedCostumes.includes(id)) return true;
  const c = COSTUMES_DATA.find(x => x.id === id);
  if (c && c.unlockType === 'ad') return isAdCostumeActive(id);
  return false;
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
