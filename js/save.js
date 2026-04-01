// ============================================================
// save.js — Save / load / offline earnings
// ============================================================

const SAVE_KEY = 'scam_wizard_v1';
const OFFLINE_MAX = 24 * 60 * 60 * 1000; // 24 hours cap

// Fields to persist (excludes runtime-only fields)
const SAVE_FIELDS = [
  'tp', 'total', 'totalSpent',
  'clicks', 'cp',
  'prestigeCount', 'prestigeMultiplier',
  'hqLevel', 'costume',
  'tiers', 'upgrades', 'achievements', 'diaryRead', 'purchasedCostumes',
  'rivalBeaten', 'victimClicks', 'comboPeak',
  'lastSaveTime',
];

function saveGame() {
  STATE.lastSaveTime = Date.now();
  const data = {};
  for (const k of SAVE_FIELDS) data[k] = STATE[k];
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Save] Could not save:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    for (const k of SAVE_FIELDS) {
      if (data[k] !== undefined) STATE[k] = data[k];
    }
    return true;
  } catch (e) {
    console.warn('[Save] Could not load:', e);
    return false;
  }
}

// Call after loadGame() to compute & apply offline earnings
function calcOfflineEarnings() {
  const now  = Date.now();
  const elapsed = Math.min(now - STATE.lastSaveTime, OFFLINE_MAX);
  if (elapsed < 10000) return null; // Less than 10s — ignore

  // Use the saved HPS (recalcState should have been called first)
  const hps = STATE.hps;
  if (hps <= 0) return null;

  const earned = Math.floor(hps * (elapsed / 1000));
  if (earned < 1) return null;

  addTp(earned);
  const mins = Math.floor(elapsed / 60000);
  const hrs  = Math.floor(mins / 60);
  const timeStr = hrs > 0
    ? `${hrs}h ${mins % 60}m`
    : `${mins}m`;
  return { earned, timeStr };
}

// Auto-save every 30s
let _saveInterval = null;
function startAutoSave() {
  if (_saveInterval) clearInterval(_saveInterval);
  _saveInterval = setInterval(saveGame, 30000);
}

function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn('[Save] Could not delete save:', e);
  }
}
