// ============================================================
// randomizer.js — Daily modifier, random tasks, description
//                 variants, Easter eggs, run seed
// ============================================================

const MODIFIERS = [
  { id: 'gullible',          icon: '🏘️', name: 'Gullible Town',        desc: 'All scam income ×1.5',               hpsMult: 1.5 },
  { id: 'inspector_holiday', icon: '🏖️', name: 'Inspector on Holiday',  desc: 'Inspector gives +500 TP instead',    hpsMult: 1 },
  { id: 'viral',             icon: '📱', name: 'Viral Moment',           desc: 'Click ×3, passive income ×0.5',      hpsMult: 0.5, clickMult: 3 },
  { id: 'gold_rush',         icon: '💰', name: 'Gold Rush',              desc: 'First 3 scams produce ×5',           hpsMult: 1 },
  { id: 'merlin_bad',        icon: '😤', name: "Merlin's Bad Day",       desc: 'Merlin runs at 20% speed',           hpsMult: 1 },
  { id: 'double_trouble',    icon: '👥', name: 'Double Trouble',         desc: 'Victims appear twice as often',      hpsMult: 1 },
  { id: 'conspiracy',        icon: '🧐', name: 'Conspiracy Theory',      desc: 'Random events 3× more frequent',    hpsMult: 1 },
  { id: 'lucky',             icon: '🍀', name: 'Lucky Gerald',           desc: 'Risky choices succeed 80% of time', hpsMult: 1 },
];

const TASK_POOL = [
  { id: 't1', desc: 'Sell 50 Lucky Pebbles',              type: 'tierCount',        tier: 'pebble', target: 50,   reward: 'tempClick2_10m', rewardDesc: '×2 click power 10min' },
  { id: 't2', desc: 'Trigger 3 random events',            type: 'eventsTriggered',  target: 3,     reward: 'tp1000',          rewardDesc: '+1,000 TP' },
  { id: 't3', desc: 'Click Gerald 200 times',             type: 'clicks',           target: 200,   reward: 'freeTier',         rewardDesc: 'Free cheapest tier' },
  { id: 't4', desc: 'Earn 5,000 TP from passive income',  type: 'passiveEarned',    target: 5000,  reward: 'tempHps2_5m',      rewardDesc: '×2 passive 5min' },
  { id: 't5', desc: 'Win 2 risky event choices',          type: 'riskyWins',        target: 2,     reward: 'permClick1',       rewardDesc: 'Permanent +1 click power' },
  { id: 't6', desc: 'Reach Combo ×5',                     type: 'combo5',           target: 1,     reward: 'permHps10pct',     rewardDesc: '+10% permanent passive' },
  { id: 't7', desc: 'Get 5 victims to click on you',      type: 'victimClicks',     target: 5,     reward: 'tempHps3_3m',      rewardDesc: '×3 income 3min' },
  { id: 't8', desc: 'Survive Inspector without bribing',  type: 'inspectorSurvived',target: 1,     reward: 'tp2000',           rewardDesc: '+2,000 TP' },
];

const TIER_DESCS = {
  pebble:    ['This one vibrates slightly — that\'s magic.',        'Found in Gerald\'s driveway. Spiritually charged.',         'Smooth. Round. Definitely enchanted. Trust me.'],
  fortune:   ['Challenges lie ahead... but also opportunities.',    'I see great things. Probably. Don\'t quote me.',            'The fishbowl never lies. Gerald sometimes does.'],
  potion:    ['Definitely not just tap water with food colouring.', 'May contain trace amounts of actual magic.',               'Side effects: mild optimism. No refunds.'],
  scroll:    ['Printed on Gerald\'s inkjet last Tuesday.',          'Ancient-looking. Smells like toner. Coincidence.',         'Each one unique. The template is not unique.'],
  spa:       ['Authentic dragon tears. (It\'s a humidifier.)',      'The robe has a dragon on it. Very official.',              'Guests leave relaxed. Nobody asks questions.'],
  moon:      ['Nobody has been to the moon recently to check.',     'Prime lunar real estate. Certificate included.',           'Gerald is the largest lunar landowner. By his own records.'],
  academy:   ['Very selective. 50 gold gets you in.',              'Curriculum: confident hand gestures and Latin.',           'Pass rate: 34%. Gerald gives everyone a gold star.'],
  cathedral: ['The holy relic is a particularly shiny pebble.',    'Gift shop opens at 9. Donations appreciated.',             'Gerald didn\'t plan this. It just happened.'],
};

const EASTER_EGGS = [
  { id: 'pebble_speaks',  name: 'The Pebble Speaks 🗣️',      desc: '"It only says one word: \'refund.\'"',  reward: 'permAll2x',   rewardDesc: 'Permanent ×2 all income' },
  { id: 'time_traveller', name: 'Time Traveller Customer ⌚', desc: '"They buy 47 bottles."',                 reward: 'tp50000',     rewardDesc: '+50,000 TP' },
  { id: 'viral_gerald',   name: 'Gerald Goes Viral 🌐',       desc: '"127 million views."',                   reward: 'permHps500',  rewardDesc: 'Permanent +500 TP/sec' },
];

const SAVE_KEY_RUN = 'scam_wizard_run_v1';

const Randomizer = (() => {
  let seed = 0;
  let modifier = null;
  let tasks = [];
  let taskProgress = {};
  let _eggCooldown = 0;
  let _eggCheckCounter = 0;

  // ── Seeded pseudo-random ──────────────────────────────────────
  function seededRnd(s) {
    const x = Math.sin(s + 1) * 10000;
    return x - Math.floor(x);
  }

  // ── Init / new run ────────────────────────────────────────────
  function init() {
    try {
      const raw = localStorage.getItem(SAVE_KEY_RUN);
      if (raw) {
        const data = JSON.parse(raw);
        seed         = data.seed         || 0;
        modifier     = MODIFIERS.find(m => m.id === data.modifierId) || null;
        tasks        = data.tasks        || [];
        taskProgress = data.taskProgress || {};
        // Ensure tasks have full data (in case pool changed)
        tasks = tasks.map(t => {
          const base = TASK_POOL.find(p => p.id === t.id);
          return base ? Object.assign({}, base, { completed: t.completed || false }) : null;
        }).filter(Boolean);
      }
    } catch(e) {}

    if (!seed || !modifier || tasks.length === 0) newRun();
    renderModifier();
    renderTasks();
  }

  function newRun() {
    seed = Math.floor(Math.random() * 9000) + 1000;
    const modIdx = Math.floor(seededRnd(seed) * MODIFIERS.length);
    modifier = MODIFIERS[modIdx];

    // Shuffle task pool deterministically, pick first 3
    const sorted = [...TASK_POOL].sort((a, b) => {
      const ai = TASK_POOL.indexOf(a);
      const bi = TASK_POOL.indexOf(b);
      return seededRnd(seed * 13 + ai) - seededRnd(seed * 13 + bi);
    });
    tasks = sorted.slice(0, 3).map(t => Object.assign({}, t, { completed: false }));
    taskProgress = {};
    tasks.forEach(t => { taskProgress[t.id] = 0; });
    saveRun();
  }

  function reset() {
    newRun();
    renderModifier();
    renderTasks();
  }

  function saveRun() {
    try {
      localStorage.setItem(SAVE_KEY_RUN, JSON.stringify({
        seed,
        modifierId:   modifier ? modifier.id : null,
        tasks:        tasks.map(t => ({ id: t.id, completed: t.completed })),
        taskProgress,
      }));
    } catch(e) {}
  }

  // ── Modifier accessors ────────────────────────────────────────
  function getModifier()  { return modifier; }
  function getSeed()      { return seed; }

  function getHpsMult()   { return modifier ? (modifier.hpsMult   || 1) : 1; }
  function getClickMult() { return modifier ? (modifier.clickMult || 1) : 1; }

  function isGoldRush()         { return modifier && modifier.id === 'gold_rush'; }
  function isInspectorHoliday() { return modifier && modifier.id === 'inspector_holiday'; }
  function isLucky()            { return modifier && modifier.id === 'lucky'; }
  function isDoubleVictims()    { return modifier && modifier.id === 'double_trouble'; }
  function isConspiracy()       { return modifier && modifier.id === 'conspiracy'; }
  function isMerlinBad()        { return modifier && modifier.id === 'merlin_bad'; }

  // Gold Rush: first 3 tiers (by index) get ×5
  function getTierHpsMult(tierId) {
    if (!isGoldRush()) return 1;
    const idx = TIERS_DATA.findIndex(t => t.id === tierId);
    return idx >= 0 && idx < 3 ? 5 : 1;
  }

  // ── Tier description variants ─────────────────────────────────
  function getTierDesc(tierId) {
    const descs = TIER_DESCS[tierId];
    if (!descs) return null;
    const idx = Math.floor(seededRnd(seed + tierId.length) * descs.length);
    return descs[idx];
  }

  // ── Task tracking callbacks ───────────────────────────────────
  function onEvent()             { _updateByType('eventsTriggered', 1); }
  function onRiskyWin()          { _updateByType('riskyWins', 1); }
  function onInspectorSurvived() { _updateByType('inspectorSurvived', 1); }

  function addPassiveEarned(amount) {
    tasks.forEach(t => {
      if (!t.completed && t.type === 'passiveEarned') {
        taskProgress[t.id] = (taskProgress[t.id] || 0) + amount;
      }
    });
  }

  function _updateByType(type, amount) {
    tasks.forEach(t => {
      if (!t.completed && t.type === type) {
        taskProgress[t.id] = (taskProgress[t.id] || 0) + amount;
      }
    });
  }

  // Sync state-derived progress (called from game loop)
  function updateFromState() {
    tasks.forEach(t => {
      if (t.completed) return;
      switch (t.type) {
        case 'clicks':       taskProgress[t.id] = STATE.clicks; break;
        case 'victimClicks': taskProgress[t.id] = STATE.victimClicks; break;
        case 'tierCount':    taskProgress[t.id] = getTierCount(t.tier); break;
        case 'combo5':       taskProgress[t.id] = STATE.comboPeak >= 5 ? 1 : 0; break;
      }
    });
  }

  function checkTaskCompletion() {
    let any = false;
    tasks.forEach(t => {
      if (t.completed) return;
      if ((taskProgress[t.id] || 0) >= t.target) {
        t.completed = true;
        any = true;
        _grantReward(t);
      }
    });
    if (any) { renderTasks(); saveRun(); }
  }

  function _grantReward(task) {
    Audio.sfxAchievement();
    showNotification(`✅ Task: ${task.desc} — ${task.rewardDesc}`, 'achievement');
    switch (task.reward) {
      case 'tempClick2_10m': addTempClickMult(2, 600000); break;
      case 'tp1000':         addTp(1000); break;
      case 'freeTier':       _grantFreeTier(); break;
      case 'tempHps2_5m':    addTempMult(2, 300000); break;
      case 'permClick1':     STATE.cp += 1; break;
      case 'permHps10pct':   STATE.prestigeMultiplier *= 1.1; break;
      case 'tempHps3_3m':    addTempMult(3, 180000); break;
      case 'tp2000':         addTp(2000); break;
    }
    recalcState();
  }

  function _grantFreeTier() {
    const cheapest = TIERS_DATA
      .filter(t => isTierUnlocked(t.id))
      .sort((a, b) => getTierCost(a.id) - getTierCost(b.id))[0];
    if (!cheapest) return;
    ensureTierState(cheapest.id);
    STATE.tiers[cheapest.id].count++;
    recalcState();
    showNotification(`🎁 Free ${cheapest.icon} ${cheapest.name} obtained!`, 'event');
  }

  // ── Easter eggs ───────────────────────────────────────────────
  function checkEasterEgg() {
    _eggCheckCounter++;
    if (_eggCheckCounter < 600) return; // check ~every 10s at 60fps
    _eggCheckCounter = 0;
    if (Date.now() < _eggCooldown) return;
    if (Math.random() > 0.01) return; // 1% chance per check
    _eggCooldown = Date.now() + 300000; // 5 min cooldown
    _showEgg(EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)]);
  }

  function _showEgg(egg) {
    Audio.sfxAchievement();
    const overlay = document.createElement('div');
    overlay.className = 'easter-egg-overlay';
    overlay.innerHTML = `
      <div class="easter-egg-box">
        <div class="easter-egg-star">✨ SECRET EVENT ✨</div>
        <div class="easter-egg-title">${egg.name}</div>
        <div class="easter-egg-desc">${egg.desc}</div>
        <div class="easter-egg-reward">Reward: ${egg.rewardDesc}</div>
        <button class="btn-primary" style="margin-top:16px">Incredible!</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('button').onclick = () => {
      _grantEggReward(egg.reward);
      overlay.remove();
    };
    setTimeout(() => { if (overlay.parentNode) { _grantEggReward(egg.reward); overlay.remove(); } }, 12000);
  }

  function _grantEggReward(reward) {
    switch (reward) {
      case 'permAll2x':  STATE.prestigeMultiplier *= 2; recalcState(); break;
      case 'tp50000':    addTp(50000); break;
      case 'permHps500': STATE._permHpsBonus = (STATE._permHpsBonus || 0) + 500; recalcState(); break;
    }
  }

  // ── UI rendering ──────────────────────────────────────────────
  function renderModifier() {
    const html = !modifier ? '' : `
      <div class="modifier-header">
        <span class="modifier-icon-lg">${modifier.icon}</span>
        <div>
          <div class="modifier-name">${modifier.name}</div>
          <div class="modifier-desc">${modifier.desc}</div>
        </div>
      </div>
    `;
    const el = document.getElementById('modifier-panel');
    if (el) el.innerHTML = html;
    const mel = document.getElementById('mobile-modifier-panel');
    if (mel) mel.innerHTML = html;

    const seedEls = document.querySelectorAll('.run-seed-label');
    seedEls.forEach(s => { s.textContent = 'Run #' + seed; });
  }

  function renderTasks() {
    const tasksHtml = tasks.map(t => {
      const prog = Math.min(taskProgress[t.id] || 0, t.target);
      const pct  = Math.floor((prog / t.target) * 100);
      const done = t.completed;
      return `<div class="task-item${done ? ' task-done' : ''}">
        <div class="task-desc">${done ? '✅' : '▸'} ${t.desc}</div>
        <div class="task-reward-label">${t.rewardDesc}</div>
        ${done ? '' : `
          <div class="task-progress-wrap"><div class="task-progress-fill" style="width:${pct}%"></div></div>
          <div class="task-progress-text">${fmt(prog)} / ${fmt(t.target)}</div>
        `}
      </div>`;
    }).join('');

    const el = document.getElementById('tasks-panel');
    if (el) el.innerHTML = '<div class="tasks-title">📋 Daily Tasks</div>' + tasksHtml;

    const mel = document.getElementById('mobile-tasks-panel');
    if (mel) mel.innerHTML = tasksHtml;
  }

  return {
    init, reset,
    getModifier, getSeed,
    getHpsMult, getClickMult, getTierHpsMult,
    isGoldRush, isInspectorHoliday, isLucky, isDoubleVictims, isConspiracy, isMerlinBad,
    getTierDesc,
    onEvent, onRiskyWin, onInspectorSurvived, addPassiveEarned,
    updateFromState, checkTaskCompletion, checkEasterEgg,
    renderTasks,
  };
})();
