// ============================================================
// main.js — Game loop, init, recalcState, click handler
// Loaded last so all other modules are available.
// ============================================================

// ── recalcState: recompute all derived values ─────────────────
// Called after any purchase or state change.

function recalcState() {
  const now = Date.now();

  // Prune expired temp multipliers
  STATE.tempMults      = STATE.tempMults.filter(m => m.expires > now);
  STATE.tempClickMults = STATE.tempClickMults.filter(m => m.expires > now);

  // ── HPS ────────────────────────────────────────────────────
  let hps = 0;
  for (const tier of TIERS_DATA) {
    hps += getTierHps(tier.id);
  }
  // Gold Rush modifier: first 3 tiers get ×5
  for (const tier of TIERS_DATA) {
    const boost = Randomizer.getTierHpsMult(tier.id);
    if (boost !== 1) hps += getTierHps(tier.id) * (boost - 1); // add the extra
  }

  // HQ bonus
  const hq = getCurrentHq();
  hps += hq.bonusHps;

  // Permanent HPS bonus from Easter egg
  if (STATE._permHpsBonus) hps += STATE._permHpsBonus;

  // Prestige multiplier
  let globalMult = STATE.prestigeMultiplier;

  // Upgrade HPS mults
  globalMult *= getUpgradeHpsMult();

  // Hidden upgrade: real wizard lesson = +50% HPS
  if (STATE.upgrades.includes('_real_wizard_lesson')) globalMult *= 1.5;
  // Hidden upgrade: photo with wizard = ×1.2
  if (STATE.upgrades.includes('_real_wizard_photo'))  globalMult *= 1.2;

  // Temp multipliers
  for (const m of STATE.tempMults) globalMult *= m.mult;

  // Limited event global mult
  globalMult *= Events.getLimitedEventMult();

  // Modifier HPS mult
  globalMult *= Randomizer.getHpsMult();

  STATE.hps            = hps * globalMult;
  STATE.globalMultiplier = globalMult;

  // ── Click value ────────────────────────────────────────────
  let clickMult = 1;
  const costume = getCurrentCostume();
  clickMult *= costume.clickMult;

  clickMult *= getUpgradeClickMult();

  // Modifier click mult
  clickMult *= Randomizer.getClickMult();

  for (const m of STATE.tempClickMults) clickMult *= m.mult;

  STATE.clickMultiplier = clickMult;
}

function getClickValue() {
  const combo = Combo.getCurrentMultiplier();
  return STATE.cp * STATE.clickMultiplier * STATE.prestigeMultiplier * combo;
}

// ── Game loop ─────────────────────────────────────────────────

let _lastTick = performance.now();
let _frameCount = 0;

function gameLoop(now) {
  if (!STATE.paused) {
    const dt = Math.min((now - _lastTick) / 1000, 0.5); // seconds, capped
    _lastTick = now;

    // Passive income
    const passiveIncome = STATE.hps * dt;
    addTp(passiveIncome);
    Randomizer.addPassiveEarned(passiveIncome);

    // Recalc every ~10 frames (not every frame to save CPU)
    _frameCount++;
    if (_frameCount % 10 === 0) {
      recalcState();
      Diary.checkMilestones();
      checkAchievements();
      Randomizer.updateFromState();
      Randomizer.checkTaskCompletion();
    }
    if (_frameCount % 600 === 0) {   // ~10s: check ad costume expiry
      checkAdCostumeExpiry();
    }
    Randomizer.checkEasterEgg();

    // Rival update
    Rival.update(dt);

    // Render
    renderFrame();
  } else {
    _lastTick = now; // don't accumulate paused time
  }

  requestAnimationFrame(gameLoop);
}

// ── Gerald click handler ──────────────────────────────────────

let _idleCheckTimer = null;

function setupClickHandler() {
  const gerald = document.getElementById('gerald-clickable');
  if (!gerald) return;

  const handler = (e) => {
    if (STATE.paused) return;
    Poki.onFirstClick();

    // ── Spell: fire if fully charged ──────────────────────────
    if (STATE.spellCharge >= 100) {
      STATE.spellCharge = 0;
      Spells.trigger();
      renderSpellCharge();
    } else {
      STATE.spellCharge = Math.min(100, STATE.spellCharge + 2);
      renderSpellCharge();
    }

    const val = getClickValue();
    addTp(val);

    // Audio after addTp — audio errors must never block game logic
    try { Audio.init(); Audio.sfxClick(); } catch (e) {}
    STATE.clicks++;
    _lastClickTime = Date.now();

    // Click animation
    setGeraldState(STATE.spellCharge >= 100 ? 'glow' : 'click');

    // Particle
    const rect = gerald.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top  + rect.height / 2);
    spawnClickParticle(x - 20, y - 20, val);

    // Combo
    Combo.recordClick();

    // Challenge clicks
    Events.onClickDuringChallenge();

    // Glow if combo active
    if (Combo.getCurrentMultiplier() > 1) {
      setTimeout(() => setGeraldState('glow'), 150);
    }

    // Reset idle timer
    if (_idleCheckTimer) clearTimeout(_idleCheckTimer);
    _idleCheckTimer = setTimeout(updateGeraldIdleState, 5500);

    recalcState();
    Diary.checkMilestones();
    checkAchievements();
  };

  gerald.addEventListener('click', handler);
  gerald.addEventListener('touchend', e => { e.preventDefault(); handler(e.touches[0] || e.changedTouches[0] || {}); });
  gerald.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler({}); });
}

// ── Prestige ──────────────────────────────────────────────────

function doPrestige() {
  Audio.sfxPrestige();

  const newMult = STATE.prestigeMultiplier * 2;
  const newCount = STATE.prestigeCount + 1;

  // Keep these across prestige
  const keep = {
    achievements: STATE.achievements,
    diaryRead:    STATE.diaryRead,
    rivalBeaten:  STATE.rivalBeaten,
    victimClicks: STATE.victimClicks,
    comboPeak:    STATE.comboPeak,
    clicks:       STATE.clicks,
  };

  // Reset
  Object.assign(STATE, {
    tp:            0,
    total:         0,
    totalSpent:    0,
    cp:            5,
    clickMultiplier:  1,
    globalMultiplier: 1,
    prestigeCount: newCount,
    prestigeMultiplier: newMult,
    hqLevel:       0,
    costume:       'robe_torn',
    tiers:         {},
    upgrades:      [],
    purchasedCostumes: ['robe_torn'],
    rivalTp:       0,
    tempMults:     [],
    tempClickMults: [],
  });

  // Restore kept fields
  Object.assign(STATE, keep);

  Randomizer.reset();
  recalcState();
  renderFrame();
  renderAchievements();
  _tiersRendered = false; // force re-render of tier cards

  showNotification(
    `✨ Relocated to ${getTownName()}! Permanent ×${newMult} income!`,
    'achievement'
  );
  saveGame();
}

// ── Init ──────────────────────────────────────────────────────

function init() {
  // Load save
  const hasSave = loadGame();

  // Recalculate state from loaded data
  recalcState();

  // Offline earnings
  if (hasSave) {
    const offline = calcOfflineEarnings();
    if (offline) {
      const overlay = document.getElementById('offline-overlay');
      const desc    = document.getElementById('offline-desc');
      desc.textContent =
        `Gerald ran the scams for ${offline.timeStr} while you were away. ` +
        `He earned ${fmt(offline.earned)} TP. Mostly legally.`;
      Poki.onModalOpen();
      overlay.classList.remove('hidden');
      document.getElementById('offline-ok').onclick = () => {
        overlay.classList.add('hidden');
        Poki.onModalClose();
      };
    }
  }

  // Initial UI renders
  initTabs();
  renderAchievements();
  renderTiersTab();
  renderUpgradesTab();
  renderHqTab();
  renderCostumesTab();
  renderMapTab();
  renderFrame();

  // Setup handlers
  setupClickHandler();

  // Prestige button
  document.getElementById('prestige-btn').addEventListener('click', () => {
    Poki.onModalOpen();
    showPrestigeModal();
  });
  document.getElementById('prestige-confirm').addEventListener('click', () => {
    hidePrestigeModal();
    Poki.onModalClose();
    doPrestige();
  });
  document.getElementById('prestige-cancel').addEventListener('click', () => {
    hidePrestigeModal();
    Poki.onModalClose();
  });

  // Systems init
  Randomizer.init();
  Combo.init();
  Victims.init();
  Events.init();
  Rival.init();

  // Poki SDK
  Poki.init();

  // Auto-save
  startAutoSave();

  // Check for pending diary/achievements
  Diary.checkMilestones();
  checkAchievements();

  // Start the loop
  _lastTick = performance.now();
  requestAnimationFrame(gameLoop);

  console.log('[Scam Wizard] Gerald is ready. Let the scamming begin.');
}

// ── Boot ──────────────────────────────────────────────────────

// Expose for debugging
window.SW = {
  STATE, addTp,
  save: saveGame,
  load: loadGame,
  reset: () => { deleteSave(); location.reload(); },
  prestige: doPrestige,
};

window.addEventListener('DOMContentLoaded', init);
