// ============================================================
// state.js — Single source of truth for all game state
// All other modules read/write STATE directly.
// ============================================================

const STATE = {
  // ── Currency ──────────────────────────────────────────────
  tp:         0,
  total:      0,      // all-time TP earned (never decreases)
  totalSpent: 0,

  // ── Click system ──────────────────────────────────────────
  clicks:      0,
  cp:          5,     // base click power

  // ── Multipliers (recalculated each game tick) ──────────────
  clickMultiplier:  1,
  globalMultiplier: 1,

  // ── Prestige ──────────────────────────────────────────────
  prestigeCount:      0,
  prestigeMultiplier: 1,

  // ── HQ & Costume ──────────────────────────────────────────
  hqLevel: 0,
  costume: 'robe_torn',

  // ── Purchased items ───────────────────────────────────────
  tiers:       {},    // { id: { count, burstCount, burstThreshold } }
  upgrades:    [],    // array of purchased upgrade IDs
  achievements: [],   // array of unlocked achievement IDs
  diaryRead:   [],    // array of read diary IDs
  purchasedCostumes: ['robe_torn'],  // unlocked costumes

  // ── Tracking stats ────────────────────────────────────────
  rivalBeaten:  0,
  victimClicks: 0,
  comboPeak:    1,
  comboLevel:   0,    // current combo tier index (0 = none)

  // ── Save ──────────────────────────────────────────────────
  lastSaveTime: Date.now(),

  // ── Runtime (NOT saved to localStorage) ───────────────────
  hps:          0,    // per-second income, recalculated
  limitedEvent: null, // active limited-time event
  tempMults:    [],   // [{ mult, expires }]  — global HPS boosts
  tempClickMults: [], // [{ mult, expires }]  — click boosts
  gameStartTime:  Date.now(),
  paused:         false,
  rivalTp:        0,

  // ── Spell charge ────────────────────────────────────────────
  spellCharge: 0,     // 0–100
  luckyBreak:  false, // next event forced positive
};

// ── Helpers ───────────────────────────────────────────────────

function addTp(amount) {
  STATE.tp    += amount;
  STATE.total += amount;
}

function spendTp(amount) {
  STATE.tp         -= amount;
  STATE.totalSpent += amount;
}

function canAfford(cost) {
  return STATE.tp >= cost;
}

function getTierCount(tierId) {
  return (STATE.tiers[tierId] || {}).count || 0;
}

function addTempMult(mult, durationMs) {
  STATE.tempMults.push({ mult, expires: Date.now() + durationMs });
}

function addTempClickMult(mult, durationMs) {
  STATE.tempClickMults.push({ mult, expires: Date.now() + durationMs });
}

function isPrestigeAvailable() {
  return STATE.total >= 50000000 && STATE.prestigeCount < 10;
}

const TOWNS = [
  'Credulton', 'Naiveshire', 'Believingham',
  'Suckerford', 'Gullibleville', 'Trustington',
  'Foolsbury', 'Credulous Creek', 'Bamboozle Bay', 'Con Cove'
];

function getTownName() {
  return TOWNS[Math.min(STATE.prestigeCount, TOWNS.length - 1)];
}

// Number formatter used everywhere
function fmt(n) {
  if (n === undefined || n === null) return '0';
  if (n < 1000)   return Math.floor(n).toString();
  if (n < 1e6)    return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  if (n < 1e9)    return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n < 1e12)   return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  return (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
}
