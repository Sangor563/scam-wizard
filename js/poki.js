// ============================================================
// poki.js — Poki SDK wrapper with graceful fallback
// ============================================================

const Poki = (() => {
  const sdk = window.PokiSDK || null;

  let gameplayStarted  = false;   // true after first gameplayStart()
  let firstClickDone   = false;   // true after first Gerald click
  let lastCommercial   = 0;
  const COMMERCIAL_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between midrolls

  // ── SDK init ────────────────────────────────────────────────
  function init() {
    if (sdk) {
      sdk.init()
        .then(() => {
          console.log('[Poki] SDK initialized');
          sdk.gameLoadingFinished();
          // Do NOT call gameplayStart() here — wait for first click
        })
        .catch(err => {
          console.warn('[Poki] SDK init failed:', err);
        });
    } else {
      console.log('[Poki] SDK not present, running in dev mode');
    }
  }

  function _startGameplay() {
    if (sdk && !gameplayStarted) {
      sdk.gameplayStart();
      gameplayStarted = true;
    }
  }

  function _stopGameplay() {
    if (sdk && gameplayStarted) {
      sdk.gameplayStop();
      gameplayStarted = false;
    }
  }

  // ── Called on the very first Gerald click ────────────────────
  function onFirstClick() {
    if (firstClickDone) return;
    firstClickDone = true;
    _startGameplay();
  }

  // ── Call when any modal/overlay opens ────────────────────────
  function onModalOpen() {
    STATE.paused = true;
    _stopGameplay();
  }

  // ── Call when any modal/overlay closes ───────────────────────
  function onModalClose() {
    STATE.paused = false;
    _startGameplay();

    // Midroll: fire a commercial break if enough time has passed
    const now = Date.now();
    if (now - lastCommercial >= COMMERCIAL_INTERVAL) {
      lastCommercial = now;
      if (sdk) {
        sdk.commercialBreak()
          .then(() => { _showRewardOffer(); })
          .catch(() => {});
      } else {
        // Dev mode: still refresh the offer
        _showRewardOffer();
      }
    }
  }

  // ── Rewarded ad — player-initiated ───────────────────────────
  function showRewardedAd(reason) {
    Audio.init();

    if (sdk) {
      _stopGameplay();
      sdk.rewardedBreak()
        .then(rewarded => {
          _startGameplay();
          if (rewarded) applyReward(reason);
        })
        .catch(() => {
          _startGameplay();
        });
    } else {
      // Dev mode: always reward
      applyReward(reason);
    }
  }

  function applyReward(reason) {
    if (reason === 'income') {
      addTempMult(2, 2 * 60 * 1000);
      recalcState();
      showNotification('📺 Ad watched! ×2 income for 2 minutes!', 'event');
    } else if (reason === 'combo') {
      addTempMult(2, 3 * 60 * 1000);
      recalcState();
      showNotification('📺 Ad watched! ×2 income for 3 minutes!', 'event');
    } else if (reason === 'retry') {
      addTp(Math.floor(STATE.hps * 30));
      showNotification('📺 Ad watched! Retry bonus: 30s income added!', 'event');
    }
  }

  // ── Show rewarded ad offer after each commercial break ───────
  function _showRewardOffer() {
    const el = document.getElementById('ad-reward-container');
    if (el) el.classList.remove('hidden');
    const mel = document.getElementById('mobile-ad-container');
    if (mel) mel.classList.remove('hidden');
  }

  return { init, onFirstClick, onModalOpen, onModalClose, showRewardedAd };
})();

// Expose globally so HTML onclick can reach it
function showRewardedAd(reason) { Poki.showRewardedAd(reason); }
