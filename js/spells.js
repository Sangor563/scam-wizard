// ============================================================
// spells.js — Gerald's spell charge system
// Triggered when spellCharge hits 100 and player clicks again.
// ============================================================

const SPELL_LIST = [
  {
    id:     'levitation',
    name:   'Accidental Levitation',
    icon:   '✨',
    desc:   'All income ×5 for 15 seconds.',
    color:  '#a78bfa',
    trigger() {
      addTempMult(5, 15000);
      recalcState();
    },
  },
  {
    id:     'mind_fog',
    name:   'Mind Fog',
    icon:   '🌫️',
    desc:   'Customers everywhere for 20 seconds.',
    color:  '#94a3b8',
    trigger() {
      Victims.spawnMany(4);
      Victims.setFloodMode(20000);
    },
  },
  {
    id:     'lucky_break',
    name:   'Lucky Break',
    icon:   '🍀',
    desc:   'Next random event is guaranteed positive.',
    color:  '#10b981',
    trigger() {
      STATE.luckyBreak = true;
    },
  },
  {
    id:     'gerald_wink',
    name:   "Gerald's Wink",
    icon:   '😉',
    desc:   'Free copy of your cheapest scam.',
    color:  '#f59e0b',
    trigger() {
      const cheapest = TIERS_DATA
        .filter(t => isTierUnlocked(t.id))
        .sort((a, b) => getTierCost(a.id) - getTierCost(b.id))[0];
      if (cheapest) {
        ensureTierState(cheapest.id);
        STATE.tiers[cheapest.id].count++;
        recalcState();
        showNotification(`😉 Free ${cheapest.icon} ${cheapest.name}!`, 'event');
      }
    },
  },
  {
    id:     'time_bubble',
    name:   'Time Bubble',
    icon:   '⏰',
    desc:   'Click power ×10 for 60 seconds.',
    color:  '#38bdf8',
    trigger() {
      addTempClickMult(10, 60000);
      recalcState();
    },
  },
  {
    id:     'phantom_customers',
    name:   'Phantom Customers',
    icon:   '👻',
    desc:   'Passive income ×8 for 30 seconds.',
    color:  '#818cf8',
    trigger() {
      addTempMult(8, 30000);
      recalcState();
    },
  },
];

const Spells = (() => {
  function trigger() {
    const spell = SPELL_LIST[Math.floor(Math.random() * SPELL_LIST.length)];

    // SFX
    try { Audio.sfxPrestige(); } catch(e) {}

    // Edge flash
    _flashEdge(spell.color);

    // Popup (like combo)
    _showPopup(spell);

    // Apply effect
    spell.trigger();
  }

  function _showPopup(spell) {
    const el = document.getElementById('spell-popup');
    if (!el) return;
    el.innerHTML = `
      <div class="spell-popup-inner" style="--spell-color:${spell.color}">
        <div class="spell-popup-icon">${spell.icon}</div>
        <div class="spell-popup-name">${spell.name}</div>
        <div class="spell-popup-desc">${spell.desc}</div>
      </div>`;
    el.classList.add('spell-popup-show');
    setTimeout(() => el.classList.remove('spell-popup-show'), 2500);
  }

  function _flashEdge(color) {
    const el = document.getElementById('spell-flash');
    if (!el) return;
    el.style.setProperty('--flash-color', color);
    el.classList.add('spell-flashing');
    setTimeout(() => el.classList.remove('spell-flashing'), 800);
  }

  return { trigger };
})();
