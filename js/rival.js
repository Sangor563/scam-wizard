// ============================================================
// rival.js — Merlin the Mediocre NPC rival system
// ============================================================

const Rival = (() => {
  const TAUNTS_LOSING  = [
    '"Real wizards don\'t need trust points."',
    '"I\'m doing this properly, you know."',
    '"Just wait. The tide will turn."',
    '"My spells are certified. CERTIFIED."',
  ];
  const TAUNTS_BEHIND  = [
    '"Ha! I knew it."',
    '"Numbers don\'t lie, Gerald."',
    '"You\'re all flash and no substance."',
    '"Pebbles. He\'s selling pebbles."',
  ];
  const TAUNTS_CRUSHED = [
    '"...how are you doing this?"',
    '"This is statistically improbable."',
    '"The pebble thing shouldn\'t work this well."',
    '"I went to wizard school for SEVEN years."',
  ];

  let wasAhead       = false;
  let tauntTimer     = null;
  let bubbleTimer    = null;

  function init() {
    STATE.rivalTp = 0;
    scheduleTaunt();
  }

  function update(dt) {
    // Merlin accumulates at 60% of player's HPS (20% if Merlin's Bad Day modifier)
    const merlinRate = STATE.hps * (Randomizer.isMerlinBad() ? 0.2 : 0.6);
    STATE.rivalTp += merlinRate * dt;

    const playerAhead = STATE.tp > STATE.rivalTp;

    // Detect overtake moment
    if (playerAhead && !wasAhead && STATE.rivalTp > 10) {
      onOvertake();
    }
    wasAhead = playerAhead;

    renderRival();
  }

  function onOvertake() {
    STATE.rivalBeaten++;
    Audio.sfxRival();
    showNotification('⚔️ OVERTAKEN! Gerald passes Merlin!', 'event');

    // Flash the rival panel
    const panel = document.getElementById('rival-panel');
    if (panel) {
      panel.style.borderColor = 'var(--gold)';
      setTimeout(() => panel.style.borderColor = '', 2000);
    }
    checkAchievements();
  }

  function renderRival() {
    const winning = STATE.tp > STATE.rivalTp;
    const merlinFmt = fmt(STATE.rivalTp);
    const youFmt    = fmt(STATE.tp);
    const statusText = winning ? 'Gerald is winning! 😏' : 'Merlin is ahead! Click faster! 😰';
    const statusColor = winning ? 'var(--green)' : 'var(--red)';

    // Desktop right panel
    const merlinEl = document.getElementById('rival-merlin-tp');
    if (merlinEl) {
      merlinEl.textContent = merlinFmt;
      document.getElementById('rival-you-tp').textContent = youFmt;
      const statusEl = document.getElementById('rival-status-label');
      const youRow   = document.getElementById('rival-you-row');
      statusEl.textContent = statusText;
      statusEl.style.color = statusColor;
      youRow.classList.toggle('losing', !winning);
    }

    // Mobile Stats tab
    const mMerlinEl = document.getElementById('mobile-rival-merlin-tp');
    if (mMerlinEl) {
      mMerlinEl.textContent = merlinFmt;
      document.getElementById('mobile-rival-you-tp').textContent = youFmt;
      const mStatus = document.getElementById('mobile-rival-status-label');
      const mYouRow = document.getElementById('mobile-rival-you-row');
      mStatus.textContent = statusText;
      mStatus.style.color = statusColor;
      mYouRow.classList.toggle('losing', !winning);
    }
  }

  function scheduleTaunt() {
    const delay = 20000 + Math.random() * 30000; // 20–50s
    tauntTimer = setTimeout(() => {
      showTaunt();
      scheduleTaunt();
    }, delay);
  }

  function showTaunt() {
    let pool;
    const ratio = STATE.tp / Math.max(STATE.rivalTp, 1);
    if (ratio > 5)       pool = TAUNTS_CRUSHED;
    else if (ratio >= 1) pool = TAUNTS_LOSING;
    else                 pool = TAUNTS_BEHIND;

    const line = '🧙‍♂️ ' + pool[Math.floor(Math.random() * pool.length)];

    for (const id of ['merlin-bubble', 'mobile-merlin-bubble']) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.textContent = line;
      el.classList.remove('hidden');
    }

    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      for (const id of ['merlin-bubble', 'mobile-merlin-bubble']) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      }
    }, 5000);
  }

  return { init, update };
})();
