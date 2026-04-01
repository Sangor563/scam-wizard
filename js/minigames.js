// ============================================================
// minigames.js — One mini-game per scam tier
// Unlock: tier count >= 10  |  Win: ×3 output for 2 min
// Cooldown: 5 min per tier
// ============================================================

const MiniGames = (() => {
  const COOLDOWN_MS  = 300000;  // 5 min
  const BOOST_MS     = 120000;  // 2 min
  const BOOST_MULT   = 3;
  const UNLOCK_COUNT = 10;

  const cooldowns = {}; // tierId → expiry ms

  // ── Public ─────────────────────────────────────────────────

  function canPlay(tierId) {
    return getTierCount(tierId) >= UNLOCK_COUNT &&
           (!cooldowns[tierId] || Date.now() > cooldowns[tierId]);
  }

  function getCooldownSec(tierId) {
    return Math.max(0, Math.floor(((cooldowns[tierId] || 0) - Date.now()) / 1000));
  }

  function getMiniGameMult(tierId) {
    const ts = STATE.tiers[tierId];
    if (!ts || !ts.miniGameBoost) return 1;
    if (Date.now() > ts.miniGameBoost) { ts.miniGameBoost = 0; return 1; }
    return BOOST_MULT;
  }

  function play(tierId) {
    if (!canPlay(tierId)) return;
    const tier = TIERS_DATA.find(t => t.id === tierId);
    if (!tier) return;

    const overlay = _createOverlay(tier);
    document.body.appendChild(overlay);
    Poki.onModalOpen();

    const gameFns = {
      pebble:           _gamePebble,
      fortune:          _gameFortune,
      potion:           _gamePotion,
      scroll:           _gameScroll,
      spa:              _gameSpa,
      moon:             _gameMoon,
      academy:          _gameAcademy,
      cathedral:        _gameCathedral,
      interdimensional: _gameInterdimensional,
      timeshare:        _gameTimeshare,
      religion:         _gameReligion,
    };

    const fn = gameFns[tierId];
    if (!fn) { overlay.remove(); Poki.onModalClose(); return; }

    fn(overlay.querySelector('.mg-content'), (success) => {
      _showResult(overlay, success, () => {
        overlay.remove();
        Poki.onModalClose();
        if (success) _applyBoost(tierId, tier);
      });
    });
  }

  function renderPlayButtons() {
    for (const tier of TIERS_DATA) {
      const card = document.getElementById('tier-card-' + tier.id);
      if (!card) continue;
      let btn = card.querySelector('.mg-play-btn');

      if (getTierCount(tier.id) < UNLOCK_COUNT) {
        if (btn) btn.remove();
        continue;
      }
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'mg-play-btn';
        btn.onclick = (e) => { e.stopPropagation(); play(tier.id); };
        card.querySelector('.tier-right').appendChild(btn);
      }

      const ts = STATE.tiers[tier.id];
      const boosting = ts && ts.miniGameBoost && Date.now() < ts.miniGameBoost;
      const cd = getCooldownSec(tier.id);
      if (boosting) {
        const rem = Math.ceil((ts.miniGameBoost - Date.now()) / 1000);
        btn.textContent = `×3 ⏳${rem}s`;
        btn.disabled = true;
      } else if (cd > 0) {
        btn.textContent = `⏳${Math.floor(cd/60)}:${String(cd%60).padStart(2,'0')}`;
        btn.disabled = true;
      } else {
        btn.textContent = '🎮 Play';
        btn.disabled = false;
      }
    }
  }

  // ── Internal helpers ───────────────────────────────────────

  function _applyBoost(tierId, tier) {
    ensureTierState(tierId);
    STATE.tiers[tierId].miniGameBoost = Date.now() + BOOST_MS;
    cooldowns[tierId] = Date.now() + COOLDOWN_MS;
    Audio.sfxAchievement();
    showNotification(`🎮 ${tier.icon} ${tier.name}: ×${BOOST_MULT} output for 2 min!`, 'achievement');
    recalcState();
  }

  function _createOverlay(tier) {
    const el = document.createElement('div');
    el.className = 'mg-overlay';
    el.innerHTML = `
      <div class="mg-modal">
        <div class="mg-header">
          <span>${tier.icon}</span>
          <div>
            <div class="mg-title">${tier.name}</div>
            <div class="mg-subtitle">Win = ×3 output for 2 minutes!</div>
          </div>
        </div>
        <div class="mg-content"></div>
      </div>`;
    return el;
  }

  function _showResult(overlay, success, cb) {
    overlay.querySelector('.mg-content').innerHTML = `
      <div class="mg-result ${success ? 'mg-win' : 'mg-lose'}">
        <div class="mg-result-icon">${success ? '🎉' : '😅'}</div>
        <div>${success ? '✨ Success! ×3 output for 2 minutes!' : 'So close... 5 minute cooldown.'}</div>
      </div>`;
    setTimeout(cb, 2500);
  }

  // Tick-based countdown; returns interval id
  function _countdown(secs, tickEl, onEnd) {
    if (tickEl) tickEl.textContent = secs + 's';
    let rem = secs;
    const id = setInterval(() => {
      rem--;
      if (tickEl) tickEl.textContent = rem + 's';
      if (rem <= 0) { clearInterval(id); onEnd(); }
    }, 1000);
    return id;
  }

  // Moving needle shared by several games
  function _makeNeedle(el, selector, speed, bounce) {
    let pos = 50, dir = 1;
    const node = el.querySelector(selector);
    const id = setInterval(() => {
      pos += dir * speed;
      if (pos > (bounce || 95)) dir = -1;
      if (pos < 5)              dir =  1;
      node.style.left = pos + '%';
    }, 16);
    return { getId: () => id, getPos: () => pos };
  }

  // ── 1. Lucky Pebble ── "Spot the Magic Stone" ──────────────
  function _gamePebble(el, resolve) {
    let done = false;
    const glow = Math.floor(Math.random() * 5);
    el.innerHTML = `
      <div class="mg-instr">Which stone is enchanted? 3 seconds!</div>
      <div class="mg-pebble-row" id="mg-pr"></div>
      <div class="mg-bar-wrap"><div class="mg-bar" id="mg-pb"></div></div>`;
    const row = el.querySelector('#mg-pr');
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('button');
      b.className = 'mg-stone' + (i === glow ? ' mg-glow' : '');
      b.textContent = '🪨';
      b.onclick = () => { if (!done) { done = true; clearInterval(tid); resolve(i === glow); } };
      row.appendChild(b);
    }
    let pct = 100;
    const bar = el.querySelector('#mg-pb');
    const tid = setInterval(() => {
      pct -= 100 / 30;
      bar.style.width = Math.max(0, pct) + '%';
      if (pct <= 0) { clearInterval(tid); if (!done) { done = true; resolve(false); } }
    }, 100);
  }

  // ── 2. Fortune Telling ── "Vague-O-Meter" ─────────────────
  function _gameFortune(el, resolve) {
    let done = false;
    const zs = 20 + Math.random() * 40, ze = zs + 28;
    el.innerHTML = `
      <div class="mg-instr">Stop the needle in the green zone!</div>
      <div class="mg-vago-labels"><span>TOO SPECIFIC</span><span>TOO ABSURD</span></div>
      <div class="mg-needle-track">
        <div class="mg-zone" style="left:${zs}%;width:${ze-zs}%"></div>
        <div class="mg-needle-pin" id="mg-np"></div>
      </div>
      <div class="mg-zone-label">JUST VAGUE ENOUGH</div>
      <button class="mg-btn" id="mg-lock">🔒 LOCK IT IN</button>`;
    const n = _makeNeedle(el, '#mg-np', 1.8);
    el.querySelector('#mg-lock').onclick = () => {
      if (!done) { done = true; clearInterval(n.getId()); resolve(n.getPos() >= zs && n.getPos() <= ze); }
    };
  }

  // ── 3. Potion Emporium ── "Match the Potion" ──────────────
  function _gamePotion(el, resolve) {
    let done = false;
    const cols = [
      [80 + Math.floor(Math.random()*100), 30 + Math.floor(Math.random()*80), 120 + Math.floor(Math.random()*100)],
      [200 + Math.floor(Math.random()*55), 20 + Math.floor(Math.random()*60), 30 + Math.floor(Math.random()*60)],
      [30 + Math.floor(Math.random()*60), 120 + Math.floor(Math.random()*100), 60 + Math.floor(Math.random()*100)],
      [150 + Math.floor(Math.random()*80), 150 + Math.floor(Math.random()*80), 30 + Math.floor(Math.random()*80)],
    ];
    const correctIdx = Math.floor(Math.random() * cols.length);
    const shuffled   = [...cols].sort(() => Math.random() - 0.5);
    const target     = cols[correctIdx];
    const correct    = target;

    el.innerHTML = `
      <div class="mg-instr">Which potion matches the target? 5 seconds!</div>
      <div class="mg-potion-target" style="background:rgb(${target.join(',')})"></div>
      <div class="mg-potion-label">TARGET COLOUR</div>
      <div class="mg-potion-options" id="mg-po"></div>
      <div class="mg-timer-txt" id="mg-pt">5s</div>`;
    const optsEl = el.querySelector('#mg-po');
    shuffled.forEach(col => {
      const b = document.createElement('button');
      b.className = 'mg-potion-swatch';
      b.style.background = `rgb(${col.join(',')})`;
      b.onclick = () => { if (!done) { done = true; clearInterval(tid); resolve(col === correct || col.toString() === correct.toString()); } };
      optsEl.appendChild(b);
    });
    const tid = _countdown(5, el.querySelector('#mg-pt'), () => { if (!done) { done = true; resolve(false); } });
  }

  // ── 4. Prophecy Scrolls ── "Perfect Seal" ─────────────────
  function _gameScroll(el, resolve) {
    let done = false, tries = 0;
    const zs = 35 + Math.random() * 20, ze = zs + 22;
    el.innerHTML = `
      <div class="mg-instr">Stamp in the green zone! (3 chances)</div>
      <div class="mg-needle-track">
        <div class="mg-zone" style="left:${zs}%;width:${ze-zs}%"></div>
        <div class="mg-needle-pin" id="mg-sp"></div>
      </div>
      <button class="mg-btn" id="mg-stamp">🔏 STAMP!</button>
      <div class="mg-tries-lbl" id="mg-st">Tries left: 3</div>`;
    const n = _makeNeedle(el, '#mg-sp', 2.2);
    el.querySelector('#mg-stamp').onclick = () => {
      if (done) return;
      tries++;
      const hit = n.getPos() >= zs && n.getPos() <= ze;
      if (hit || tries >= 3) { done = true; clearInterval(n.getId()); resolve(hit); }
      else el.querySelector('#mg-st').textContent = `Tries left: ${3 - tries}`;
    };
  }

  // ── 5. Dragon Tears Spa ── "Zen Zone" ─────────────────────
  function _gameSpa(el, resolve) {
    let done = false, tries = 0, phase = 0;
    el.innerHTML = `
      <div class="mg-instr">Click INHALE when the steam is calm! (3 chances)</div>
      <div class="mg-needle-track">
        <div class="mg-zone" style="left:35%;width:30%"></div>
        <div class="mg-needle-pin mg-steam-pin" id="mg-zen"></div>
        <div class="mg-needle-ends"><span>🔥 HOT</span><span>❄️ COLD</span></div>
      </div>
      <button class="mg-btn mg-btn-spa" id="mg-inhale">💨 INHALE</button>
      <div class="mg-tries-lbl" id="mg-zt">Tries left: 3</div>`;
    let pos = 50;
    const node = el.querySelector('#mg-zen');
    const id = setInterval(() => { phase += 0.022; pos = 50 + Math.sin(phase) * 44; node.style.left = pos + '%'; }, 16);
    el.querySelector('#mg-inhale').onclick = () => {
      if (done) return;
      tries++;
      const hit = pos >= 35 && pos <= 65;
      if (hit || tries >= 3) { done = true; clearInterval(id); resolve(hit); }
      else el.querySelector('#mg-zt').textContent = `Tries left: ${3 - tries}`;
    };
  }

  // ── 6. Moon Land Registry ── "Lunar Memory" ───────────────
  function _gameMoon(el, resolve) {
    let done = false;
    const SIZE = 12, GOLD = 3;
    const goldSet = new Set();
    while (goldSet.size < GOLD) goldSet.add(Math.floor(Math.random() * SIZE));

    el.innerHTML = `
      <div class="mg-instr">Remember the gold plots! (1.5s) Then click them!</div>
      <div class="mg-moon-grid" id="mg-mg"></div>
      <div class="mg-timer-txt" id="mg-mt">Memorising...</div>`;
    const grid = el.querySelector('#mg-mg');
    const cells = [];
    for (let i = 0; i < SIZE; i++) {
      const b = document.createElement('button');
      b.className = 'mg-moon-cell' + (goldSet.has(i) ? ' mg-moon-lit' : '');
      b.textContent = goldSet.has(i) ? '🌕' : '🌑';
      b.disabled = true;
      b.dataset.i = i;
      grid.appendChild(b);
      cells.push(b);
    }

    setTimeout(() => {
      cells.forEach(c => { c.classList.remove('mg-moon-lit'); c.textContent = '🌑'; c.disabled = false; });
      const timerEl = el.querySelector('#mg-mt');
      let selected = new Set();
      cells.forEach(c => {
        c.onclick = () => {
          if (done || c.dataset.sel) return;
          c.dataset.sel = 1; c.textContent = '⭐'; c.classList.add('mg-moon-sel');
          selected.add(+c.dataset.i);
          if (selected.size >= GOLD) { done = true; resolve([...selected].every(i => goldSet.has(i))); }
        };
      });
      const tid = _countdown(6, timerEl, () => { if (!done) { done = true; resolve(false); } });
    }, 1600);
  }

  // ── 7. Wizard Academy ── "Spell Check" ────────────────────
  function _gameAcademy(el, resolve) {
    let done = false;
    const words = ['FROBNICOR','ZYLVANTUS','MEPHISTREL','QUANDOREX','VRINDTHAL','SPLORGANUS','BLORBIFAX','CRUMBTHORN'];
    const correct = words[Math.floor(Math.random() * words.length)];
    const scramble = w => w.split('').sort(() => Math.random() - 0.5).join('');
    const options = [correct, scramble(correct), scramble(correct)].sort(() => Math.random() - 0.5);

    el.innerHTML = `
      <div class="mg-instr">Memorise this spell name! (2s)</div>
      <div class="mg-spell-word" id="mg-sw">${correct}</div>
      <div class="mg-spell-opts hidden" id="mg-so"></div>
      <div class="mg-timer-txt" id="mg-at">Memorising...</div>`;
    setTimeout(() => {
      el.querySelector('#mg-sw').textContent = '???';
      const optsEl = el.querySelector('#mg-so');
      optsEl.classList.remove('hidden');
      options.forEach(w => {
        const b = document.createElement('button');
        b.className = 'mg-spell-opt';
        b.textContent = w;
        b.onclick = () => { if (!done) { done = true; resolve(w === correct); } };
        optsEl.appendChild(b);
      });
      _countdown(5, el.querySelector('#mg-at'), () => { if (!done) { done = true; resolve(false); } });
    }, 2000);
  }

  // ── 8. Con Cathedral ── "Coin Rain" ───────────────────────
  function _gameCathedral(el, resolve) {
    let done = false, collected = 0;
    const GOAL = 8;
    el.innerHTML = `
      <div class="mg-instr">Click the falling coins! Collect ${GOAL} in 8s!</div>
      <div class="mg-coin-arena" id="mg-ca"></div>
      <div class="mg-coin-counter" id="mg-cc">0 / ${GOAL}</div>
      <div class="mg-timer-txt" id="mg-cat">8s</div>`;
    const arena = el.querySelector('#mg-ca');
    const countEl = el.querySelector('#mg-cc');

    function spawnCoin() {
      if (done) return;
      const coin = document.createElement('button');
      coin.className = 'mg-coin';
      coin.textContent = '💰';
      coin.style.left = (5 + Math.random() * 88) + '%';
      coin.style.top = '-36px';
      arena.appendChild(coin);
      let y = -36;
      const fid = setInterval(() => {
        y += 2.5;
        coin.style.top = y + 'px';
        if (y > 210) { clearInterval(fid); if (coin.parentNode) coin.remove(); }
      }, 16);
      coin.onclick = () => {
        clearInterval(fid);
        coin.remove();
        collected++;
        countEl.textContent = collected + ' / ' + GOAL;
        if (!done && collected >= GOAL) { done = true; clearInterval(spawnId); resolve(true); }
      };
    }

    const spawnId = setInterval(spawnCoin, 700);
    _countdown(8, el.querySelector('#mg-cat'), () => {
      if (!done) { done = true; clearInterval(spawnId); resolve(collected >= GOAL); }
    });
  }

  // ── 9. Interdimensional ── "Portal Timing" ────────────────
  function _gameInterdimensional(el, resolve) {
    let done = false, hits = 0, tries = 0;
    const NEED = 2;
    el.innerHTML = `
      <div class="mg-instr">Click the portal when it GLOWS! Need ${NEED}/3 hits!</div>
      <div class="mg-portal-wrap">
        <button class="mg-portal" id="mg-port">🌀</button>
      </div>
      <div class="mg-tries-lbl" id="mg-pi">Hits: 0 / ${NEED}</div>
      <div class="mg-timer-txt" id="mg-ptt">9s</div>`;
    const port = el.querySelector('#mg-port');
    let glowing = false;

    function pulse() {
      if (done) return;
      glowing = true;
      port.classList.add('mg-portal-glow');
      port.textContent = '✨';
      setTimeout(() => {
        if (!done) { glowing = false; port.classList.remove('mg-portal-glow'); port.textContent = '🌀'; }
        if (!done) setTimeout(pulse, 900 + Math.random() * 900);
      }, 550);
    }
    setTimeout(pulse, 400);

    port.onclick = () => {
      if (done) return;
      tries++;
      if (glowing) { hits++; }
      el.querySelector('#mg-pi').textContent = `Hits: ${hits}/${NEED} (${tries}/3 attempts)`;
      if (hits >= NEED || tries >= 3) { done = true; resolve(hits >= NEED); }
    };
    _countdown(9, el.querySelector('#mg-ptt'), () => { if (!done) { done = true; resolve(hits >= NEED); } });
  }

  // ── 10. Time Share ── "Find Tuesday" ──────────────────────
  function _gameTimeshare(el, resolve) {
    let done = false;
    const days = ['MON','TUE','WED','THU','FRI','SAT','SUN','MON','WED'];
    const shuffled = [...days].sort(() => Math.random() - 0.5);
    el.innerHTML = `
      <div class="mg-instr">Gerald owns "next Tuesday." Find it — 4 seconds!</div>
      <div class="mg-calendar" id="mg-cal"></div>
      <div class="mg-timer-txt" id="mg-tst">4s</div>`;
    const cal = el.querySelector('#mg-cal');
    shuffled.forEach(day => {
      const b = document.createElement('button');
      b.className = 'mg-cal-day';
      b.textContent = day;
      b.onclick = () => { if (!done) { done = true; resolve(day === 'TUE'); } };
      cal.appendChild(b);
    });
    _countdown(4, el.querySelector('#mg-tst'), () => { if (!done) { done = true; resolve(false); } });
  }

  // ── 11. The Gerald Religion ── "Sermon Power" ─────────────
  function _gameReligion(el, resolve) {
    let done = false, tries = 0, pct = 0, holding = false;
    const gs = 55, ge = 80;
    el.innerHTML = `
      <div class="mg-instr">Hold & release in the DIVINE zone! (2 tries)</div>
      <div class="mg-sermon-wrap">
        <div class="mg-sermon-track">
          <div class="mg-sermon-zone" style="bottom:${gs}%;height:${ge-gs}%"></div>
          <div class="mg-sermon-fill" id="mg-sf"></div>
        </div>
        <div class="mg-sermon-marks">
          <span style="bottom:${ge}%">✋ TOO MUCH</span>
          <span style="bottom:${gs}%" class="mg-divine-lbl">✨ DIVINE</span>
          <span style="bottom:2%">😑 TOO LITTLE</span>
        </div>
      </div>
      <button class="mg-btn mg-btn-hold" id="mg-hold">HOLD TO PREACH 👁️</button>
      <div class="mg-tries-lbl" id="mg-rt">Tries left: 2</div>`;
    const fill = el.querySelector('#mg-sf');
    const btn  = el.querySelector('#mg-hold');
    let fid = null;

    const start = () => {
      if (done || pct >= 100) return;
      holding = true;
      fid = setInterval(() => {
        pct = Math.min(100, pct + 1.1);
        fill.style.height = pct + '%';
        if (pct >= 100) stop();
      }, 30);
    };
    const stop = () => {
      if (!holding) return;
      holding = false;
      clearInterval(fid);
      tries++;
      const ok = pct >= gs && pct <= ge;
      if (ok || tries >= 2) { done = true; resolve(ok); }
      else { pct = 0; fill.style.height = '0%'; el.querySelector('#mg-rt').textContent = 'Tries left: ' + (2 - tries); }
    };

    btn.addEventListener('mousedown',   start);
    btn.addEventListener('touchstart',  (e) => { e.preventDefault(); start(); }, { passive: false });
    btn.addEventListener('mouseup',     stop);
    btn.addEventListener('mouseleave',  stop);
    btn.addEventListener('touchend',    stop);
  }

  return { canPlay, play, getMiniGameMult, renderPlayButtons };
})();
