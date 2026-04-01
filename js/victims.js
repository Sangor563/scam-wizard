// ============================================================
// victims.js — Floating victim reaction popup system
// ============================================================

const Victims = (() => {
  const MAX_VISIBLE  = 2;
  const AUTO_REMOVE  = 5000;   // ms before auto-dismiss
  const VIP_INTERVAL = 30;     // every N normal spawns → VIP
  const VIP_WINDOW   = 10000;  // VIP stays for 10s
  const VIP_CLICKS   = 5;      // clicks needed for VIP payout

  const VICTIM_EMOJIS = ['🧑', '👩', '🧔', '👴', '👵', '🧒', '👨', '🧕'];

  const VIP_LINES = [
    'Lord Fancypants has arrived. He brought his wallet.',
    'The Duchess heard about the potions. She brought friends.',
    'A celebrity endorsement? By accident? This is fine.',
  ];

  const LINES = {
    pebble: [
      'This stone cured my back pain!!',
      'My pebble vibrated last night. Scared but grateful.',
      'Bought 3. One for each of my enemies.',
      'The rock told me to buy more rocks.',
      'My wife thinks I\'m an idiot. My rock disagrees.',
      'Changed my life. Cannot explain how.',
      'It\'s heavy and smooth. 10/10.',
      'Gerald is a genius or I am a fool. Possibly both.',
    ],
    fortune: [
      'He said "challenges ahead." My bus was late. HE KNEW.',
      'Eerily accurate. He said "things will happen." They did.',
      '10/10 would not question.',
      'He stared at a fishbowl for 4 minutes. Worth every coin.',
      'My future is "promising but uncertain." I felt seen.',
      '"Doors will open." A bird flew into my window. Sign??',
      'He described my aura as "beige." Very honest.',
      '"Something will change soon." My socks did. Goosebumps.',
    ],
    potion: [
      'Tasted like tap water. Felt magical.',
      'My cat drank some. She seems fine. Maybe better.',
      'The blue one smells like blueberries. Coincidence?',
      'Doctor said "what is this." Gerald said "magic." I trust Gerald.',
      'Side effects: mild optimism. Worth it.',
      'Cured my Tuesday. How? Gerald knows.',
      'It sparkles when I shake it. Bought twelve.',
      '"Not for internal use" but I used it internally anyway.',
    ],
    scroll: [
      '"Beware the number 7." I avoided it all week. Nothing bad happened.',
      'The scroll smells like Gerald\'s lunch. Adds authenticity.',
      '"Great fortune awaits." Still waiting. Still hopeful.',
      'I can\'t read it. Gerald said that\'s intentional.',
      '"Written by ancients." Very crooked handwriting.',
    ],
    spa: [
      'The humidifier was very soothing.',
      'I asked if those were real dragon tears. Gerald winked. I took that as a yes.',
      'Best spa in the kingdom. 6/7 stars.',
      'The robe had a dragon on it. Very official.',
      'Came for the tears, stayed for the ambience.',
      'Gerald sang a chant. I think it was a pop song in Latin.',
    ],
    moon: [
      'I own plot C-47. Can\'t visit. But it\'s mine.',
      'Gerald gave me a certificate. It has a moon sticker.',
      'Prime lunar real estate. Waiting for the right time to develop.',
      'Bought as an investment. Gerald says values are "astronomical."',
      'My plot is near the Sea of Tranquility. Very upmarket.',
      'Told my neighbour. He\'s jealous. Gerald was right.',
    ],
    academy: [
      'Enrolled in Advanced Prophecy. Week 1: we stared at clouds.',
      'The diploma arrived. Gerald signed it himself. Three times.',
      'Now I\'m a Certified Mystical Practitioner. Mum is proud.',
      'The coursework was a pamphlet. A very thorough pamphlet.',
    ],
    cathedral: [
      'The stained glass depicts Gerald in a very flattering light.',
      'Services are every Sunday. Attendance is "encouraged."',
      'I donated. The collection plate had Gerald\'s face on it.',
      'The choir sings Gerald\'s original hymns. He wrote them last Tuesday.',
    ],
    generic: [
      'Gerald is simply the best.',
      'No regrets. Zero.',
      'Unbelievable value.',
      'I came back for more.',
      'My family is worried. I am not.',
      '5 stars. Would be scammed again.',
      'Recommended by a friend. Friend is also a customer.',
    ],
  };

  let activeVictims   = 0;
  let layer           = null;
  let spawnTimer      = null;
  let normalSpawnCount = 0;
  let _maxVisible     = MAX_VISIBLE;
  let _floodTimer     = null;

  // ── Init ────────────────────────────────────────────────────

  function init() {
    layer = document.getElementById('victim-layer');
    scheduleNext();
  }

  function scheduleNext() {
    const base  = Randomizer.isDoubleVictims() ? 5000 : 10000;
    const range = Randomizer.isDoubleVictims() ? 5000 : 10000;
    const delay = base + Math.random() * range;
    spawnTimer = setTimeout(() => {
      spawnVictim(null);
      scheduleNext();
    }, delay);
  }

  function onTierBought(tierId) {
    if (Math.random() < 0.6) spawnVictim(tierId);
  }

  // Spell: Mind Fog
  function spawnMany(count) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => spawnVictim(null, true), i * 200);
    }
  }

  function setFloodMode(durationMs) {
    _maxVisible = 4;
    if (_floodTimer) clearTimeout(_floodTimer);
    _floodTimer = setTimeout(() => { _maxVisible = MAX_VISIBLE; _floodTimer = null; }, durationMs);
  }

  // ── Normal victim ────────────────────────────────────────────

  function spawnVictim(tierId, force) {
    if (!layer || activeVictims >= _maxVisible) return;

    // Every VIP_INTERVAL normal spawns, trigger a VIP instead
    normalSpawnCount++;
    if (!force && normalSpawnCount % VIP_INTERVAL === 0) {
      spawnVip();
      return;
    }

    const fromRight = Math.random() < 0.5;
    const lines     = tierId && LINES[tierId] ? LINES[tierId] : LINES.generic;
    const line      = lines[Math.floor(Math.random() * lines.length)];
    const emoji     = VICTIM_EMOJIS[Math.floor(Math.random() * VICTIM_EMOJIS.length)];

    const el = document.createElement('div');
    el.className = 'victim-popup ' + (fromRight ? 'from-right' : 'from-left');
    el.style.top = (20 + Math.random() * 55) + 'vh';
    if (fromRight) { el.style.right = '12px'; el.style.flexDirection = 'row-reverse'; }
    else           { el.style.left  = '12px'; }

    el.innerHTML = `
      <span class="victim-emoji">${emoji}</span>
      <div class="victim-bubble">
        ${line}
        <div class="victim-hint">click me!</div>
      </div>`;

    layer.appendChild(el);
    activeVictims++;
    Audio.sfxVictim();

    // ── Hard sell: track rapid clicks ───────────────────────
    let clickCount  = 0;
    let windowTimer = null;
    let removed     = false;

    el.addEventListener('click', () => {
      if (removed) return;
      clickCount++;
      STATE.victimClicks++;

      const singleBonus = Math.ceil(STATE.hps * 0.5 + 5);
      addTp(singleBonus);
      Audio.sfxVictim();
      _showFloat(el, '+' + fmt(singleBonus) + ' TP');

      if (clickCount === 1) {
        // Start 3s window
        windowTimer = setTimeout(() => { windowTimer = null; }, 3000);
      }

      if (clickCount >= 3 && windowTimer) {
        // Hard sell!
        clearTimeout(windowTimer);
        windowTimer = null;
        removed = true;
        const hardBonus = singleBonus * 3;
        addTp(hardBonus);
        _showFloat(el, '💥 HARD SELL! +' + fmt(hardBonus));
        try { Audio.sfxCombo(2); } catch(e) {}
        showNotification('💥 Hard sell! ×3 victim bonus!', 'event');
        removeVictim(el, fromRight);
        return;
      }

      // Single click remove after first tap (don't remove, let them build up clicks)
      // Only remove on third click or timeout
    });

    // Auto-remove: if never clicked, give tiny passive TP
    const autoTimer = setTimeout(() => {
      if (!removed) {
        removed = true;
        if (windowTimer) clearTimeout(windowTimer);
        if (clickCount === 0) {
          const passiveBonus = Math.ceil(STATE.hps * 0.1 + 1);
          addTp(passiveBonus);
        }
        removeVictim(el, fromRight);
      }
    }, AUTO_REMOVE);
  }

  // ── VIP victim ───────────────────────────────────────────────

  function spawnVip() {
    if (!layer || activeVictims >= _maxVisible) return;

    const fromRight = Math.random() < 0.5;
    const line      = VIP_LINES[Math.floor(Math.random() * VIP_LINES.length)];

    const el = document.createElement('div');
    el.className = 'victim-popup victim-vip ' + (fromRight ? 'from-right' : 'from-left');
    el.style.top = (25 + Math.random() * 45) + 'vh';
    if (fromRight) { el.style.right = '12px'; el.style.flexDirection = 'row-reverse'; }
    else           { el.style.left  = '12px'; }

    el.innerHTML = `
      <span class="victim-emoji">👑</span>
      <div class="victim-bubble victim-vip-bubble">
        <div class="victim-vip-badge">VIP!</div>
        ${line}
        <div class="victim-vip-progress" id="vip-prog-${Date.now()}">
          <div class="victim-vip-bar"></div>
        </div>
        <div class="victim-hint">Click ${VIP_CLICKS}× for big reward!</div>
      </div>`;

    layer.appendChild(el);
    activeVictims++;
    Audio.sfxVictim();

    let clicks  = 0;
    let removed = false;
    const barEl = el.querySelector('.victim-vip-bar');

    el.addEventListener('click', () => {
      if (removed) return;
      clicks++;
      STATE.victimClicks++;

      const perClick = Math.ceil(STATE.hps * 2 + 20);
      addTp(perClick);
      Audio.sfxVictim();
      _showFloat(el, '+' + fmt(perClick) + ' TP');

      // Update progress bar
      if (barEl) barEl.style.width = Math.min(100, (clicks / VIP_CLICKS) * 100) + '%';

      if (clicks >= VIP_CLICKS) {
        removed = true;
        const reward = Math.ceil(STATE.hps * 30);
        addTp(reward);
        try { Audio.sfxAchievement(); } catch(e) {}
        _showFloat(el, '👑 +' + fmt(reward) + ' TP!');
        showNotification(`👑 VIP payout! +${fmt(reward)} TP!`, 'achievement');
        setGeraldState('celebrate');
        removeVictim(el, fromRight);
      }
    });

    // VIP auto-remove after 10s
    setTimeout(() => {
      if (!removed) { removed = true; removeVictim(el, fromRight); }
    }, VIP_WINDOW);
  }

  // ── Helpers ──────────────────────────────────────────────────

  function removeVictim(el, fromRight) {
    if (!el.parentNode) return;
    el.classList.add('leaving');
    if (fromRight) el.classList.add('from-right'); else el.classList.add('from-left');
    setTimeout(() => {
      el.remove();
      activeVictims = Math.max(0, activeVictims - 1);
    }, 400);
  }

  function _showFloat(anchor, text) {
    const fl = document.createElement('div');
    fl.className = 'click-particle';
    fl.textContent = text;
    fl.style.position = 'absolute';
    fl.style.top = '-24px';
    fl.style.left = '50%';
    fl.style.whiteSpace = 'nowrap';
    anchor.style.position = 'relative';
    anchor.appendChild(fl);
    setTimeout(() => fl.remove(), 900);
  }

  return { init, onTierBought, spawnVictim, spawnMany, setFloodMode };
})();
