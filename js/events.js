// ============================================================
// events.js — Random choice events + limited-time scam events
// ============================================================

// ── Random choice events (popup modal) ───────────────────────

const RANDOM_EVENTS = [
  {
    id:    'inspector',
    title: '🕵️ The Suspicious Inspector',
    body:  'A government inspector has arrived. He\'s asking very specific questions about your "enchanted" pebble business.',
    choices: [
      {
        label: '💸 Bribe him',
        risk:  'Risky — 50% chance ×3 TP for 30s / 50% lose 20% TP',
        action(resolve) {
          if (riskyRoll(0.5)) {
            addTempMult(3, 30000);
            recalcState();
            Randomizer.onRiskyWin();
            resolve('💸 He pockets it. Whistles. Leaves. ×3 TP for 30 seconds!', true);
          } else {
            const loss = Math.floor(STATE.tp * 0.2);
            spendTp(Math.min(loss, STATE.tp));
            resolve('😬 He reports you. You lose 20% of your TP. Ouch.', false);
          }
          setGeraldState('sweat');
        },
      },
      {
        label: '🎭 Perform a prophecy',
        risk:  'Safe — +800 TP guaranteed',
        action(resolve) {
          addTp(800);
          resolve('🔮 "I foresee... your promotion." He cried. Gave you a tip. +800 TP!', true);
          setGeraldState('rubhands');
        },
      },
      {
        label: '🏃 Run away',
        risk:  'Neutral — no reward, no penalty',
        action(resolve) {
          Randomizer.onInspectorSurvived();
          resolve('Gerald sprinted around the corner and waited 45 minutes. He\'s gone.', null);
          setGeraldState('sweat');
        },
      },
    ],
  },
  {
    id:    'circus',
    title: '🎪 The Travelling Circus',
    body:  'A circus has set up next to Gerald\'s operation. Double the footfall, double the chaos.',
    choices: [
      {
        label: '🤝 Partner up',
        risk:  'Good — ×2 all income for 60s',
        action(resolve) {
          addTempMult(2, 60000);
          recalcState();
          resolve('🤝 The ringmaster loves the vibe. ×2 income for 60 seconds!', true);
          setGeraldState('celebrate');
        },
      },
      {
        label: '🪄 Upstage them',
        risk:  'Risky — 60% ×5 TP for 20s / 40% zero income for 10s',
        action(resolve) {
          if (riskyRoll(0.6)) {
            addTempMult(5, 20000);
            recalcState();
            Randomizer.onRiskyWin();
            resolve('🎩 Gerald\'s magic act steals the show! ×5 TP for 20s!', true);
          } else {
            addTempMult(0.01, 10000);
            recalcState();
            resolve('🤡 The clowns upstaged Gerald. Audience boos. 0 income for 10s.', false);
          }
        },
      },
      {
        label: '💰 Charge them rent',
        risk:  'Safe — +500 TP flat',
        action(resolve) {
          addTp(500);
          resolve('📝 Gerald invented "footfall tax." Circus paid it. +500 TP!', true);
          setGeraldState('rubhands');
        },
      },
    ],
  },
  {
    id:    'journalist',
    title: '📰 Journalist Alert',
    body:  'A reporter from the Kingdom Gazette is sniffing around.',
    choices: [
      {
        label: '📸 Give an interview',
        risk:  'Risky — 60% ×4 TP for 40s / 40% -30% TP',
        action(resolve) {
          if (riskyRoll(0.6)) {
            addTempMult(4, 40000);
            recalcState();
            Randomizer.onRiskyWin();
            resolve('"Miracle Man or Marvel?" — Kingdom Gazette. ×4 TP for 40s!', true);
          } else {
            const loss = Math.floor(STATE.tp * 0.3);
            spendTp(Math.min(loss, STATE.tp));
            resolve('"Local Man Sells Rocks, Claims They\'re Magic." You lose 30% TP.', false);
          }
        },
      },
      {
        label: '🎁 Give her a free pebble',
        risk:  'Safe — +200 TP, crisis averted',
        action(resolve) {
          addTp(200);
          resolve('She reviewed it 5 stars: "smooth and lucky." +200 TP!', true);
          setGeraldState('rubhands');
        },
      },
      {
        label: '🔮 Predict her future',
        risk:  'Good — +1 permanent click power',
        action(resolve) {
          STATE.cp += 1;
          recalcState();
          resolve('"He knew about my cat." She never published the exposé. +1 permanent click power!', true);
          setGeraldState('celebrate');
        },
      },
    ],
  },
  {
    id:    'noble',
    title: '🎩 Noble Patron',
    body:  'Lord Fancypants III has heard of your powers.',
    choices: [
      {
        label: '🔮 Deluxe prophecy',
        risk:  'Good — ×5 click power for 25s',
        action(resolve) {
          addTempClickMult(5, 25000);
          recalcState();
          resolve('"You will prosper greatly, my lord." He wept. ×5 click power for 25s!', true);
          setGeraldState('celebrate');
        },
      },
      {
        label: '🧪 Premium potion',
        risk:  'Good — +2,000 TP',
        action(resolve) {
          addTp(2000);
          resolve('He bought the "Noble Edition." +2,000 TP!', true);
          setGeraldState('rubhands');
        },
      },
      {
        label: '📜 Sell moon land',
        risk:  'Risky — 70% ×8 TP for 15s / 30% -15% TP',
        action(resolve) {
          if (riskyRoll(0.7)) {
            addTempMult(8, 15000);
            recalcState();
            Randomizer.onRiskyWin();
            resolve('He bought an entire lunar district! ×8 TP for 15s!', true);
          } else {
            const loss = Math.floor(STATE.tp * 0.15);
            spendTp(Math.min(loss, STATE.tp));
            resolve('His solicitor checked. The moon already belongs to someone else. -15% TP.', false);
          }
        },
      },
    ],
  },
  {
    id:    'storm',
    title: '⛈️ The Great Storm',
    body:  'A massive thunderstorm. Dragon tears are literally falling from the sky.',
    choices: [
      {
        label: '🪣 Collect dragon tears',
        risk:  'Good — ×2 passive income for 45s',
        action(resolve) {
          addTempMult(2, 45000);
          recalcState();
          resolve('Gerald ran outside with a bucket. ×2 passive income for 45s!', true);
        },
      },
      {
        label: '⚡ Harness the lightning',
        risk:  'Very risky — 40% ×10 TP for 10s / 60% TP capped at 1K for 15s',
        action(resolve) {
          if (riskyRoll(0.4)) {
            addTempMult(10, 10000);
            recalcState();
            Randomizer.onRiskyWin();
            resolve('CRACKLE. Gerald vibrates at a frequency. ×10 TP for 10s!', true);
          } else {
            // Simulate cap by setting a very negative temp mult if over 1K
            resolve('The wand exploded. Gerald smells like a burnt sock. TP capped at 1K for 15s.', false);
            // Clamp tp
            const capTimer = Date.now() + 15000;
            const capCheck = setInterval(() => {
              if (Date.now() > capTimer) { clearInterval(capCheck); return; }
              if (STATE.tp > 1000) STATE.tp = 1000;
            }, 500);
          }
        },
      },
      {
        label: '🛖 Stay inside',
        risk:  'Safe — +100 TP',
        action(resolve) {
          addTp(100);
          resolve('Gerald made tea. +100 TP somehow.', true);
        },
      },
    ],
  },
  {
    id:    'realwizard',
    title: '🧙‍♂️ A Real Wizard Visits',
    body:  'An actual certified wizard has come to investigate.',
    choices: [
      {
        label: '🤝 Ask for lessons',
        risk:  'Good — permanent +50% HPS',
        action(resolve) {
          // Store as a permanent upgrade flag
          if (!STATE.upgrades.includes('_real_wizard_lesson')) {
            STATE.upgrades.push('_real_wizard_lesson');
          }
          recalcState();
          resolve('He showed Gerald one spell. Gerald can\'t do it. But his confidence increased 50%. +50% HPS permanently!', true);
          setGeraldState('celebrate');
        },
      },
      {
        label: '🃏 Try to scam him',
        risk:  'Very risky — 50% ×20 TP for 5s / 50% just laughter',
        action(resolve) {
          if (riskyRoll(0.5)) {
            addTempMult(20, 5000);
            recalcState();
            Randomizer.onRiskyWin();
            resolve('He bought EVERYTHING. "Fascinating folk magic!" ×20 TP for 5s!', true);
          } else {
            resolve('He stared. He laughed. He left. Nothing happened. Gerald is fine. Probably.', false);
          }
        },
      },
      {
        label: '📷 Take a photo together',
        risk:  'Good — +3,000 TP + permanent ×1.2 all income',
        action(resolve) {
          addTp(3000);
          if (!STATE.upgrades.includes('_real_wizard_photo')) {
            STATE.upgrades.push('_real_wizard_photo');
          }
          recalcState();
          resolve('"Me & a real wizard!" The post went viral. +3,000 TP + ×1.2 income forever!', true);
          setGeraldState('celebrate');
        },
      },
    ],
  },
];

// ── Limited-time scam events ──────────────────────────────────

const LIMITED_EVENTS = [
  {
    id:       'winter',
    title:    '❄️ WINTER SPECIAL!',
    desc:     'Ice Crystal Dragon Tears — limited season only! ×3 spa income!',
    duration: 60,
    tierId:   'spa',
    mult:     3,
  },
  {
    id:       'lunar',
    title:    '🌙 LUNAR ECLIPSE SALE!',
    desc:     'Moon plots at a celestial discount! Costs halved for 45s!',
    duration: 45,
    tierId:   'moon',
    costMult: 0.5,
  },
  {
    id:       'circus',
    title:    '🎪 CIRCUS IN TOWN!',
    desc:     'Perform alongside them — ×5 TP for 90 seconds!',
    duration: 90,
    globalMult: 5,
  },
  {
    id:       'prophet',
    title:    '📣 PROPHET OF THE YEAR AWARD!',
    desc:     'Vote for Gerald — click 20 times in 30s for a huge bonus!',
    duration: 30,
    challenge: { clicks: 20, reward: 5000 },
  },
];

// ── Events module ─────────────────────────────────────────────

const Events = (() => {
  let eventTimer       = null;
  let limitedTimer     = null;
  let limitedCountdown = null;
  let lastEventTime    = 0;
  let challengeClicks  = 0;
  let challengeActive  = false;

  function getEventDelay() {
    const base = Randomizer.isConspiracy() ? 15000 : 45000;
    const range = Randomizer.isConspiracy() ? 15000 : 45000;
    return base + Math.random() * range;
  }

  const EVENT_MIN = 45000;
  const EVENT_MAX = 90000;
  const LIMITED_MIN = 5 * 60 * 1000;
  const LIMITED_MAX = 8 * 60 * 1000;

  function init() {
    scheduleEvent();
    scheduleLimited();
  }

  function scheduleEvent() {
    const delay = getEventDelay();
    eventTimer = setTimeout(() => {
      // Only fire if not already showing a modal
      if (!document.getElementById('modal-overlay').classList.contains('hidden')) {
        scheduleEvent();
        return;
      }
      const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
      showEvent(ev);
      scheduleEvent();
    }, delay);
  }

  function scheduleLimited() {
    const delay = LIMITED_MIN + Math.random() * (LIMITED_MAX - LIMITED_MIN);
    limitedTimer = setTimeout(() => {
      if (!STATE.limitedEvent) {
        const ev = LIMITED_EVENTS[Math.floor(Math.random() * LIMITED_EVENTS.length)];
        startLimitedEvent(ev);
      }
      scheduleLimited();
    }, delay);
  }

  // Lucky Gerald modifier: risky rolls use 80% floor
  // Lucky Break spell: guaranteed success
  function riskyRoll(baseChance) {
    if (STATE.luckyBreak) return true;
    return Math.random() < (Randomizer.isLucky() ? Math.max(baseChance, 0.8) : baseChance);
  }

  // Clear Lucky Break after the first choice resolves
  function _consumeLuckyBreak() {
    if (STATE.luckyBreak) {
      STATE.luckyBreak = false;
      showNotification('🍀 Lucky Break used!', 'event');
    }
  }

  function showEvent(ev) {
    // Inspector on Holiday: skip modal, give +500 TP
    if (ev.id === 'inspector' && Randomizer.isInspectorHoliday()) {
      addTp(500);
      showNotification('🏖️ Inspector\'s on holiday! +500 TP bonus!', 'event');
      logEvent(ev.title, 'Inspector on holiday. +500 TP.');
      return;
    }

    Randomizer.onEvent();
    Audio.sfxEvent();
    setGeraldState('sweat');

    const overlay  = document.getElementById('modal-overlay');
    const title    = document.getElementById('modal-title');
    const body     = document.getElementById('modal-body');
    const choices  = document.getElementById('modal-choices');

    title.textContent   = ev.title;
    body.textContent    = ev.body;
    choices.innerHTML   = '';

    ev.choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'modal-choice';
      btn.innerHTML = `<strong>${ch.label}</strong><div class="choice-risk">${ch.risk}</div>`;
      btn.onclick = () => {
        overlay.classList.add('hidden');
        Poki.onModalClose();
        _consumeLuckyBreak();
        ch.action((msg, good) => {
          showNotification(msg, good === false ? 'warning' : 'event');
          logEvent(ev.title, msg);
        });
        checkAchievements();
        saveGame();
      };
      choices.appendChild(btn);
    });

    Poki.onModalOpen();
    overlay.classList.remove('hidden');

    // Log to events tab
    logEvent(ev.title, ev.body);
  }

  function startLimitedEvent(ev) {
    STATE.limitedEvent = ev;
    Audio.sfxLimited();

    const banner = document.getElementById('limited-event-banner');
    banner.classList.remove('hidden');
    renderLimitedBanner(ev);
    recalcState();

    let remaining = ev.duration;
    if (ev.challenge) {
      challengeClicks = 0;
      challengeActive = true;
    }

    limitedCountdown = setInterval(() => {
      remaining--;
      renderLimitedBanner(ev, remaining);
      if (remaining <= 0) endLimitedEvent();
    }, 1000);
  }

  function renderLimitedBanner(ev, remaining) {
    const banner = document.getElementById('limited-event-banner');
    let extra = '';
    if (ev.challenge && challengeActive) {
      extra = `<div style="color:#a78bfa;margin-top:4px">Clicks: ${challengeClicks}/${ev.challenge.clicks}</div>`;
    }
    banner.innerHTML = `
      <div class="limited-title">${ev.title}</div>
      <div class="limited-desc">${ev.desc}</div>
      ${extra}
      ${remaining !== undefined ? `<div class="limited-timer">${remaining}s</div>` : ''}
    `;
  }

  function onClickDuringChallenge() {
    if (!challengeActive || !STATE.limitedEvent || !STATE.limitedEvent.challenge) return;
    challengeClicks++;
    const ch = STATE.limitedEvent.challenge;
    renderLimitedBanner(STATE.limitedEvent);
    if (challengeClicks >= ch.clicks) {
      addTp(ch.reward);
      showNotification(`🏆 Challenge complete! +${fmt(ch.reward)} TP!`, 'event');
      challengeActive = false;
    }
  }

  function endLimitedEvent() {
    clearInterval(limitedCountdown);
    STATE.limitedEvent = null;
    challengeActive = false;
    document.getElementById('limited-event-banner').classList.add('hidden');
    recalcState();
  }

  function logEvent(title, body) {
    const log = document.getElementById('events-log');
    if (!log) return;
    const empty = log.querySelector('.events-empty');
    if (empty) empty.remove();

    const entry = document.createElement('div');
    entry.className = 'event-log-entry';
    const now = new Date();
    entry.innerHTML = `<div class="event-log-time">${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}</div><strong>${title}</strong><div>${body}</div>`;
    log.insertBefore(entry, log.firstChild);

    // Keep max 10 entries
    while (log.children.length > 10) log.removeChild(log.lastChild);
  }

  function getLimitedEventMult() {
    const ev = STATE.limitedEvent;
    if (!ev) return 1;
    return ev.globalMult || 1;
  }

  return { init, showEvent, onClickDuringChallenge, getLimitedEventMult };
})();
