// ============================================================
// combo.js — Click combo multiplier system
// ============================================================

const Combo = (() => {
  const THRESHOLDS   = [5, 10, 20, 40];   // cumulative clicks to hit each level
  const MULTIPLIERS  = [2, 3, 5, 8];
  const COLORS       = ['#60a5fa', '#34d399', '#f59e0b', '#ef4444'];
  const LABELS       = ['×2', '×3', '×5', '×8'];
  const RESET_DELAY  = 3000; // ms of inactivity before reset

  let clickCount   = 0;  // clicks since last reset
  let comboLevel   = 0;  // current tier (0 = no combo, 1..4 = active)
  let resetTimer   = null;
  let displayEl    = null;

  function init() {
    displayEl = document.getElementById('combo-display');
  }

  function recordClick() {
    clickCount++;
    scheduleReset();

    // Check if we crossed a new threshold
    const threshIdx = THRESHOLDS.findIndex((t, i) => clickCount === t && i >= comboLevel);
    if (threshIdx !== -1 && threshIdx >= comboLevel) {
      comboLevel = threshIdx + 1;
      showCombo(comboLevel);
      Audio.sfxCombo(threshIdx);
      if (comboLevel > STATE.comboPeak) STATE.comboPeak = comboLevel;
      STATE.comboLevel = comboLevel;
    }
  }

  function showCombo(level) {
    if (!displayEl) return;
    const idx = level - 1;
    displayEl.textContent  = 'COMBO ' + LABELS[idx] + '!';
    displayEl.style.color  = COLORS[idx];
    displayEl.className    = 'combo-animate';
    // Re-trigger animation
    void displayEl.offsetWidth;
    displayEl.className = 'combo-animate';
  }

  function scheduleReset() {
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(resetCombo, RESET_DELAY);
  }

  function resetCombo() {
    clickCount  = 0;
    comboLevel  = 0;
    STATE.comboLevel = 0;
    if (displayEl) displayEl.className = '';
  }

  function getCurrentMultiplier() {
    if (comboLevel === 0) return 1;
    return MULTIPLIERS[comboLevel - 1];
  }

  return { init, recordClick, resetCombo, getCurrentMultiplier };
})();
