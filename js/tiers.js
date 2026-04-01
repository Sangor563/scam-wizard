// ============================================================
// tiers.js — Scam tier data + purchase / burst logic
// ============================================================

const TIERS_DATA = [
  {
    id:        'pebble',
    name:      'Lucky Pebble',
    icon:      '🪨',
    desc:      'Sell rocks. Describe them as "spiritually charged." Done.',
    baseCost:  15,
    baseHps:   0.1,
    unlockAt:  0,
  },
  {
    id:        'fortune',
    name:      'Fortune Telling',
    icon:      '🔮',
    desc:      'Stare into a fishbowl. Charge accordingly.',
    baseCost:  100,
    baseHps:   0.5,
    unlockAt:  50,
  },
  {
    id:        'potion',
    name:      'Potion Emporium',
    icon:      '🧪',
    desc:      'Tap water. Blue food colouring. Mystical label. Profit.',
    baseCost:  600,
    baseHps:   2,
    unlockAt:  200,
  },
  {
    id:        'scroll',
    name:      'Prophecy Scrolls',
    icon:      '📜',
    desc:      '"Challenges lie ahead." Covers basically everything.',
    baseCost:  4000,
    baseHps:   7,
    unlockAt:  1000,
  },
  {
    id:        'spa',
    name:      'Dragon Tears Spa',
    icon:      '🐉',
    desc:      'Humidifier. Dragon poster. Suspiciously damp robe. Luxury.',
    baseCost:  20000,
    baseHps:   25,
    unlockAt:  5000,
  },
  {
    id:        'moon',
    name:      'Moon Land Registry',
    icon:      '🌕',
    desc:      'Prime lunar real estate. Gerald handles the paperwork personally.',
    baseCost:  150000,
    baseHps:   100,
    unlockAt:  20000,
  },
  {
    id:        'academy',
    name:      'Wizard Academy',
    icon:      '🏫',
    desc:      'Accredited by the International Bureau of Gerald. Very official.',
    baseCost:  1000000,
    baseHps:   500,
    unlockAt:  100000,
  },
  {
    id:        'cathedral',
    name:      'Con Cathedral',
    icon:      '⛪',
    desc:      'The congregation believes. That\'s all that matters.',
    baseCost:  10000000,
    baseHps:   2500,
    unlockAt:  500000,
  },
  {
    id:        'interdimensional',
    name:      'Interdimensional Real Estate',
    icon:      '🌀',
    desc:      'Gerald sells property in parallel universes. Nobody has complained yet.',
    baseCost:  50000000,
    baseHps:   10000,
    unlockAt:  5000000,
  },
  {
    id:        'timeshare',
    name:      'Time Share Scam',
    icon:      '⏰',
    desc:      'Own a week of next Tuesday. Gerald doesn\'t know how this works either.',
    baseCost:  300000000,
    baseHps:   50000,
    unlockAt:  30000000,
  },
  {
    id:        'religion',
    name:      'The Gerald Religion',
    icon:      '👁️',
    desc:      'It started as a joke. It is no longer a joke. Gerald is concerned.',
    baseCost:  2000000000,
    baseHps:   250000,
    unlockAt:  200000000,
  },
];

const COST_SCALE = 1.18;
const BURST_BASE = 100;

// Tier state initialiser — call on first purchase or load
function ensureTierState(id) {
  if (!STATE.tiers[id]) {
    STATE.tiers[id] = {
      count:          0,
      burstCount:     0,
      burstThreshold: BURST_BASE,
      burstActive:    false,
      burstTimer:     0,
    };
  }
}

function getTierCost(tierId) {
  const tier = TIERS_DATA.find(t => t.id === tierId);
  if (!tier) return Infinity;
  const count = getTierCount(tierId);
  return Math.ceil(tier.baseCost * Math.pow(COST_SCALE, count));
}

function isTierUnlocked(tierId) {
  const tier = TIERS_DATA.find(t => t.id === tierId);
  if (!tier) return false;
  return STATE.total >= tier.unlockAt;
}

// Returns how many of this tier we can buy at once
function getMaxBuy(tierId) {
  const tier = TIERS_DATA.find(t => t.id === tierId);
  if (!tier) return 0;
  let count = getTierCount(tierId);
  let total = 0;
  let n = 0;
  while (true) {
    const cost = Math.ceil(tier.baseCost * Math.pow(COST_SCALE, count + n));
    if (total + cost > STATE.tp) break;
    total += cost;
    n++;
    if (n > 500) break; // safety cap
  }
  return n;
}

function buyTier(tierId, amount) {
  amount = amount || 1;
  const tier = TIERS_DATA.find(t => t.id === tierId);
  if (!tier || !isTierUnlocked(tierId)) return false;

  ensureTierState(tierId);
  const ts = STATE.tiers[tierId];
  let totalCost = 0;
  for (let i = 0; i < amount; i++) {
    totalCost += Math.ceil(tier.baseCost * Math.pow(COST_SCALE, ts.count + i));
  }
  if (!canAfford(totalCost)) return false;

  spendTp(totalCost);
  ts.count += amount;

  // Burst progress
  ts.burstCount += amount;
  if (ts.burstCount >= ts.burstThreshold) {
    ts.burstCount = 0;
    ts.burstThreshold *= 2;
    triggerBurst(tierId);
  }

  recalcState();
  Audio.sfxBuy();
  return true;
}

// Burst: ×10 TP for 30s on that tier's HPS
function triggerBurst(tierId) {
  const ts = STATE.tiers[tierId];
  if (!ts) return;
  ts.burstActive = true;
  ts.burstTimer  = Date.now() + 30000;
  const tier = TIERS_DATA.find(t => t.id === tierId);
  showNotification(`BULK ORDER! ${tier.icon} ${tier.name} ×10 TP for 30s!`, 'event');
  Audio.sfxLimited();
  // Timed removal handled in game loop
}

function getBurstMultiplier(tierId) {
  const ts = STATE.tiers[tierId];
  if (!ts || !ts.burstActive) return 1;
  if (Date.now() > ts.burstTimer) {
    ts.burstActive = false;
    return 1;
  }
  return 10;
}

function getTierHps(tierId) {
  const tier = TIERS_DATA.find(t => t.id === tierId);
  if (!tier) return 0;
  const count = getTierCount(tierId);
  return tier.baseHps * count * getBurstMultiplier(tierId) * MiniGames.getMiniGameMult(tierId);
}
