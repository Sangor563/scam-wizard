// ============================================================
// ui.js — All DOM rendering. Updates only what changed.
// ============================================================

// ── Gerald state machine ──────────────────────────────────────

let _geraldState     = 'idle';
let _geraldStateTime = Date.now();
let _lastClickTime   = Date.now();
let _geraldAnimTimer = null;

function setGeraldState(state) {
  _geraldState     = state;
  _geraldStateTime = Date.now();
  const img = document.getElementById('gerald-image');
  if (!img) return;

  // Clear all state classes
  img.className = img.className.replace(/gerald-\w+/g, '').trim();

  const classMap = {
    idle:      'gerald-idle',
    yawn:      'gerald-yawn',
    rubhands:  'gerald-rubhands',
    sweat:     'gerald-sweat',
    celebrate: 'gerald-celebrate',
    click:     'gerald-click',
    glow:      'gerald-glow',
  };

  if (classMap[state]) {
    img.classList.add(classMap[state]);
    // Auto-remove non-looping animations
    if (!['idle', 'yawn'].includes(state)) {
      if (_geraldAnimTimer) clearTimeout(_geraldAnimTimer);
      _geraldAnimTimer = setTimeout(() => {
        img.classList.remove(classMap[state]);
        updateGeraldIdleState();
      }, 1200);
    }
  }

  // Update label
  const labels = {
    idle:      'Ready to scam',
    yawn:      'Getting sleepy...',
    rubhands:  'Excellent choice!',
    sweat:     '...nothing to worry about',
    celebrate: 'Living the dream!',
    click:     'Got \'em!',
    glow:      'COMBO MODE!',
  };
  const labelEl = document.getElementById('gerald-state-label');
  if (labelEl) labelEl.textContent = labels[state] || 'Ready to scam';
}

function updateGeraldIdleState() {
  const now     = Date.now();
  const sinceClick = now - _lastClickTime;
  if (sinceClick > 15000)     setGeraldState('yawn');
  else if (sinceClick > 5000) setGeraldState('idle');
}

// ── Image swap (PNG vs emoji fallback) ───────────────────────

let _loadedImages = {};

function updateGeraldDisplay() {
  const imgEl    = document.getElementById('gerald-image');
  const nameEl   = document.getElementById('gerald-costume-name');
  const { emoji, imagePath } = getGeraldImage(STATE.costume);

  if (imagePath && _loadedImages[imagePath] === true) {
    imgEl.className = 'has-image';
    imgEl.style.backgroundImage = `url(${imagePath})`;
    imgEl.textContent = '';
  } else {
    imgEl.className = imgEl.className.replace('has-image', '');
    imgEl.style.backgroundImage = '';
    imgEl.textContent = emoji;

    // Lazy-probe for the image (only if not yet attempted or loading)
    if (imagePath && _loadedImages[imagePath] === undefined) {
      _loadedImages[imagePath] = 'loading'; // prevent duplicate probes
      const probe = new Image();
      probe.onload  = () => {
        _loadedImages[imagePath] = true;
        updateGeraldDisplay();
      };
      probe.onerror = () => { _loadedImages[imagePath] = false; };
      probe.src = imagePath;
    }
  }

  const costume = getCurrentCostume();
  if (nameEl) nameEl.textContent = costume.name;
}

// ── Spell charge bar ──────────────────────────────────────────

function renderSpellCharge() {
  const fill  = document.getElementById('spell-charge-fill');
  const label = document.getElementById('spell-charge-pct');
  const wrap  = document.getElementById('spell-charge-wrap');
  const gerald = document.getElementById('gerald-clickable');
  if (!fill) return;

  const pct = Math.floor(STATE.spellCharge);
  fill.style.width = pct + '%';
  if (label) label.textContent = pct + '%';

  const ready = STATE.spellCharge >= 100;
  fill.classList.toggle('spell-ready', ready);
  if (wrap)   wrap.classList.toggle('spell-ready-wrap', ready);
  if (gerald) gerald.classList.toggle('spell-aura', ready);
}

// ── Left panel ────────────────────────────────────────────────

let _lastTpDisplay   = -1;
let _lastHpsDisplay  = -1;

function renderLeftPanel() {
  // TP counter (only update if changed by >0.5)
  if (Math.abs(STATE.tp - _lastTpDisplay) >= 0.5) {
    _lastTpDisplay = STATE.tp;
    document.getElementById('tp-count').innerHTML =
      fmt(STATE.tp) + ' <span class="tp-label">TP</span>';
  }

  if (Math.abs(STATE.hps - _lastHpsDisplay) >= 0.01) {
    _lastHpsDisplay = STATE.hps;
    document.getElementById('tp-per-sec').textContent =
      fmt(STATE.hps) + ' per second';
  }

  // Temp multiplier label
  const now = Date.now();
  const activeMults = STATE.tempMults.filter(m => m.expires > now);
  const multEl = document.getElementById('temp-mult-display');
  if (multEl) {
    if (activeMults.length > 0) {
      const total = activeMults.reduce((acc, m) => acc * m.mult, 1);
      const secs  = Math.ceil((Math.max(...activeMults.map(m => m.expires)) - now) / 1000);
      multEl.textContent = `✨ ×${total.toFixed(1)} bonus (${secs}s)`;
    } else {
      multEl.textContent = '';
    }
  }

  // HQ display
  const hq = getCurrentHq();
  document.getElementById('hq-icon').textContent = hq.icon;
  document.getElementById('hq-name').textContent = hq.name;

  // Gerald display
  updateGeraldDisplay();

  // Stats
  document.getElementById('stat-clicks').textContent  = fmt(STATE.clicks);
  document.getElementById('stat-combo').textContent   = STATE.comboPeak;
  document.getElementById('stat-prestige').textContent = STATE.prestigeCount;

  // Town name
  document.getElementById('town-name').textContent = getTownName();

  // Milestone bar
  renderMilestoneBar();

  // Prestige button
  const pBtn = document.getElementById('prestige-btn');
  if (isPrestigeAvailable()) pBtn.classList.remove('hidden');
  else pBtn.classList.add('hidden');
}

const MILESTONES = [500, 2000, 8000, 30000, 100000, 500000, 2000000, 10000000, 50000000, 500000000, 2000000000];

function renderMilestoneBar() {
  const next = MILESTONES.find(m => m > STATE.total) || MILESTONES[MILESTONES.length - 1];
  const prev = MILESTONES[MILESTONES.indexOf(next) - 1] || 0;
  const pct  = Math.min(100, ((STATE.total - prev) / (next - prev)) * 100);

  document.getElementById('milestone-fill').style.width = pct + '%';
  document.getElementById('milestone-label').textContent = 'Next: ' + fmt(next) + ' TP';
  document.getElementById('milestone-text').textContent  = fmt(STATE.total) + ' / ' + fmt(next);
}

// ── Scams tab ─────────────────────────────────────────────────

let _tiersRendered = false;

function renderTiersTab() {
  const list = document.getElementById('scams-list');
  if (!list) return;

  if (!_tiersRendered) {
    // Build cards once, update content in-place
    list.innerHTML = '';
    for (const tier of TIERS_DATA) {
      const card = document.createElement('div');
      card.id        = 'tier-card-' + tier.id;
      card.className = 'tier-card';
      card.dataset.id = tier.id;
      card.innerHTML = `
        <div class="tier-icon">${tier.icon}</div>
        <div class="tier-info">
          <div class="tier-name">${tier.name}</div>
          <div class="tier-desc">${Randomizer.getTierDesc(tier.id) || tier.desc}</div>
          <div class="tier-stats" id="tier-stats-${tier.id}"></div>
        </div>
        <div class="tier-right">
          <div class="tier-count" id="tier-count-${tier.id}">0</div>
          <div class="tier-cost"  id="tier-cost-${tier.id}"></div>
          <div class="tier-hps"   id="tier-hps-${tier.id}"></div>
        </div>
        <div class="tier-burst-bar" id="tier-burst-${tier.id}" style="width:0%"></div>
      `;
      card.addEventListener('click', () => onTierClick(tier.id));
      list.appendChild(card);
    }
    _tiersRendered = true;
  }

  // Update dynamic values
  for (const tier of TIERS_DATA) {
    const card      = document.getElementById('tier-card-'  + tier.id);
    const countEl   = document.getElementById('tier-count-' + tier.id);
    const costEl    = document.getElementById('tier-cost-'  + tier.id);
    const hpsEl     = document.getElementById('tier-hps-'   + tier.id);
    const burstEl   = document.getElementById('tier-burst-' + tier.id);
    const statsEl   = document.getElementById('tier-stats-' + tier.id);
    if (!card) continue;

    const unlocked = isTierUnlocked(tier.id);
    const count    = getTierCount(tier.id);
    const cost     = getTierCost(tier.id);
    const canBuy   = canAfford(cost) && unlocked;
    const ts       = STATE.tiers[tier.id];

    // CSS classes
    card.classList.toggle('locked',      !unlocked);
    card.classList.toggle('cant-afford', unlocked && !canBuy);

    countEl.textContent = count;
    costEl.textContent  = unlocked ? fmt(cost) + ' TP' : 'Locked';

    const hps = getTierHps(tier.id);
    hpsEl.textContent = count > 0 ? fmt(hps) + '/s' : '';

    // Burst bar
    if (ts) {
      const burstPct = (ts.burstCount / ts.burstThreshold) * 100;
      burstEl.style.width = burstPct + '%';
      card.classList.toggle('burst-active', ts.burstActive && Date.now() < ts.burstTimer);
    }

    // Stats line
    if (statsEl && !unlocked) {
      statsEl.innerHTML = `<span class="tier-locked-msg">Unlock at ${fmt(tier.unlockAt)} TP earned</span>`;
    } else if (statsEl) {
      statsEl.textContent = count > 0 ? `${count} running · ${fmt(tier.baseHps * count)}/s base` : '';
    }
  }

  MiniGames.renderPlayButtons();
}

function onTierClick(tierId) {
  if (!isTierUnlocked(tierId)) return;
  const bought = buyTier(tierId, 1);
  if (bought) {
    // Flash card
    const card = document.getElementById('tier-card-' + tierId);
    if (card) {
      card.classList.add('just-bought');
      setTimeout(() => card.classList.remove('just-bought'), 500);
    }
    // Gerald rubs hands
    setGeraldState('rubhands');
    // Spawn victim
    Victims.onTierBought(tierId);
    checkAchievements();
    Diary.checkMilestones();
    saveGame();
    renderTiersTab();
  }
}

// ── Upgrades tab ──────────────────────────────────────────────

function renderUpgradesTab() {
  const list = document.getElementById('upgrades-list');
  if (!list) return;
  list.innerHTML = '';

  for (const upg of UPGRADES_DATA) {
    const purchased = isUpgradePurchased(upg.id);
    const canBuy    = canAfford(upg.cost) && !purchased;

    const card = document.createElement('div');
    card.className = 'upgrade-card' +
      (purchased ? ' purchased' : '') +
      (!purchased && !canBuy ? ' cant-afford' : '');

    card.innerHTML = `
      <div class="upgrade-icon">${upg.icon}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">${upg.name}</div>
        <div class="upgrade-effect">${upg.effect}</div>
        <div class="upgrade-cost">${purchased ? 'Purchased' : fmt(upg.cost) + ' TP'}</div>
      </div>
    `;

    if (!purchased) {
      card.addEventListener('click', () => {
        if (buyUpgrade(upg.id)) {
          renderUpgradesTab();
          checkAchievements();
          saveGame();
        }
      });
    }
    list.appendChild(card);
  }
}

// ── HQ tab ────────────────────────────────────────────────────

function renderHqTab() {
  const list = document.getElementById('hq-list');
  if (!list) return;
  list.innerHTML = '';

  for (const hq of HQ_DATA) {
    const isCurrent = hq.level === STATE.hqLevel;
    const isLocked  = hq.level > STATE.hqLevel + 1;
    const canBuy    = hq.level === STATE.hqLevel + 1 && canAfford(hq.cost);
    const isPast    = hq.level < STATE.hqLevel;

    const card = document.createElement('div');
    card.className = 'hq-card' +
      (isCurrent ? ' current' : '') +
      (isLocked  ? ' locked'  : '') +
      (!isCurrent && !isLocked && !isPast && !canBuy ? ' cant-afford' : '');

    const costText = isPast ? 'Owned' : isCurrent ? 'Current HQ' : fmt(hq.cost) + ' TP';

    card.innerHTML = `
      <div class="hq-header">
        <div class="hq-icon">${hq.icon}</div>
        <div class="hq-info">
          <div class="hq-level-name">${hq.name}</div>
          <div class="hq-bonus">${hq.bonusHps > 0 ? '+' + hq.bonusHps + '/s bonus' : 'No bonus'}</div>
          <div class="hq-cost">${costText}</div>
        </div>
      </div>
      <div class="hq-unlocks">Unlocks: ${
        COSTUMES_DATA.find(c => c.id === hq.unlocksCostume)?.name || ''
      } costume</div>
      <div class="text-muted mt4" style="font-size:11px">${hq.desc}</div>
    `;

    if (hq.level === STATE.hqLevel + 1 && !isLocked) {
      card.addEventListener('click', () => {
        if (doUpgradeHq()) {
          card.classList.add('just-upgraded');
          setTimeout(() => card.classList.remove('just-upgraded'), 600);
          setGeraldState('celebrate');
          renderHqTab();
          renderCostumesTab();
          checkAchievements();
          saveGame();
        }
      });
    }
    list.appendChild(card);
  }
}

// ── Costumes tab ──────────────────────────────────────────────

function renderCostumesTab() {
  const list = document.getElementById('costumes-list');
  if (!list) return;
  list.innerHTML = '';

  for (const c of COSTUMES_DATA.filter(x => !x.unlockType)) {
    const owned    = isCostumeUnlocked(c.id);
    const equipped = STATE.costume === c.id;
    const hqOk     = STATE.hqLevel >= c.requiredHq;
    const canBuy   = hqOk && canAfford(c.cost) && !owned;

    const card = document.createElement('div');
    card.className = 'costume-card' +
      (equipped ? ' equipped' : '') +
      (!hqOk   ? ' locked'   : '') +
      (hqOk && !owned && !canBuy ? ' cant-afford' : '');

    const statusText = equipped ? 'Equipped' :
                       owned    ? fmt(0) + ' TP (owned)' :
                       !hqOk    ? `Requires ${HQ_DATA[c.requiredHq].name}` :
                                  fmt(c.cost) + ' TP';

    card.innerHTML = `
      <div class="costume-emoji">${c.emoji}</div>
      <div class="costume-info">
        <div class="costume-name">${c.name}</div>
        <div class="costume-bonus">Click ×${c.clickMult}</div>
        <div class="costume-cost">${statusText}</div>
        <div class="text-muted" style="font-size:10px;margin-top:2px">${c.desc}</div>
      </div>
    `;

    if (hqOk && !equipped) {
      card.addEventListener('click', () => {
        if (owned) {
          equipCostume(c.id);
        } else {
          buyCostume(c.id);
        }
        renderCostumesTab();
        updateGeraldDisplay();
        checkAchievements();
        saveGame();
      });
    }
    list.appendChild(card);
  }

  // ── Special (ad) costumes section ────────────────────────────
  const adCostumes = COSTUMES_DATA.filter(c => c.unlockType === 'ad');
  if (adCostumes.length) {
    const hdr = document.createElement('div');
    hdr.className = 'ad-costumes-header';
    hdr.textContent = '👀 Special Costumes';
    list.appendChild(hdr);

    for (const c of adCostumes) {
      const active   = isAdCostumeActive(c.id);
      const equipped = STATE.costume === c.id;
      const remaining = active ? getAdCostumeRemaining(c.id) : 0;

      const card = document.createElement('div');
      card.className = 'costume-card ad-costume' + (equipped ? ' equipped' : '');

      card.innerHTML = `
        <div class="ad-costume-preview">
          <img src="${c.imagePath}" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
          <span class="costume-emoji ad-emoji-fallback" style="display:none">${c.emoji}</span>
        </div>
        <div class="costume-info">
          <div class="costume-name">${c.emoji} ${c.name}</div>
          <div class="costume-bonus">Click ×${c.clickMult}</div>
          <div class="text-muted" style="font-size:10px;margin-top:2px">${c.desc}</div>
          ${active
            ? `<div class="ad-timer" id="ad-timer-${c.id}">⌛ ${formatAdTimer(remaining)} remaining</div>
               ${equipped
                 ? '<div class="costume-cost" style="color:var(--green);margin-top:4px">✓ Equipped</div>'
                 : `<button class="btn-equip-ad" data-id="${c.id}">Equip</button>`}`
            : `<div class="ad-costume-actions">
                 <button class="btn-watch-ad" data-id="${c.id}">🎬 Watch Ad → 24h</button>
                 <button class="btn-skip-ad">✓ Continue without</button>
               </div>`}
        </div>
      `;

      if (active && !equipped) {
        card.querySelector('.btn-equip-ad').addEventListener('click', (e) => {
          e.stopPropagation();
          equipCostume(c.id);
          renderCostumesTab();
          updateGeraldDisplay();
          saveGame();
        });
      } else if (!active) {
        card.querySelector('.btn-watch-ad').addEventListener('click', (e) => {
          e.stopPropagation();
          Poki.showRewardedAd('costume_' + c.id);
        });
        // "Continue without" is required by Poki — it's already visible, no action needed
        card.querySelector('.btn-skip-ad').addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }

      list.appendChild(card);
    }
  }
}

// ── Map tab ───────────────────────────────────────────────────

const MAP_DISTRICTS = [
  { id: 'market',    name: 'Market District',   tiers: ['pebble', 'fortune'],           pos: 0 },
  { id: 'mystery',   name: 'Mystery Lane',       tiers: ['potion', 'scroll'],            pos: 1 },
  { id: 'prestige',  name: 'Prestige District',  tiers: ['spa'],                         pos: 2 },
  { id: 'space',     name: 'Space Port',         tiers: ['moon'],                        pos: 3 },
  { id: 'academia',  name: 'Academia',           tiers: ['academy'],                     pos: 4 },
  { id: 'cathedral', name: 'Cathedral',          tiers: ['cathedral'],                   pos: 5 },
  { id: 'void',      name: 'Void Quarter',       tiers: ['interdimensional'],            pos: 6 },
  { id: 'temporal',  name: 'Temporal Office',    tiers: ['timeshare'],                   pos: 7 },
  { id: 'shrine',    name: "Gerald's Shrine",    tiers: ['religion'],                    pos: 8 },
];

function _districtVisual(totalCount) {
  if (totalCount === 0)   return { icon: '🌫️', label: 'Empty Lot',      cls: 'dist-empty'  };
  if (totalCount <= 5)    return { icon: '⛺',  label: 'Small Stall',    cls: 'dist-small'  };
  if (totalCount <= 15)   return { icon: '🏪',  label: 'Shop',           cls: 'dist-shop'   };
  return                         { icon: '🏰',  label: 'Grand Building', cls: 'dist-grand'  };
}

function renderMapTab() {
  const grid    = document.getElementById('map-grid');
  const seedEl  = document.getElementById('map-run-seed');
  if (!grid) return;

  if (seedEl) seedEl.textContent = 'Run #' + Randomizer.getSeed();

  grid.innerHTML = '';

  MAP_DISTRICTS.forEach(dist => {
    const totalCount = dist.tiers.reduce((sum, tid) => sum + getTierCount(tid), 0);
    const anyUnlocked = dist.tiers.some(tid => isTierUnlocked(tid));
    const vis = _districtVisual(anyUnlocked ? totalCount : -1);

    const cell = document.createElement('div');
    cell.className = 'map-district ' + (anyUnlocked ? vis.cls : 'dist-locked');
    cell.dataset.distId = dist.id;

    // Tier icons row
    const tierIcons = dist.tiers.map(tid => {
      const t = TIERS_DATA.find(x => x.id === tid);
      return t ? t.icon : '';
    }).join('');

    cell.innerHTML = `
      <div class="dist-visual">${anyUnlocked ? vis.icon : '🔒'}</div>
      <div class="dist-name">${dist.name}</div>
      <div class="dist-tiers">${tierIcons}</div>
      <div class="dist-count">${anyUnlocked ? (totalCount > 0 ? totalCount + ' units' : 'Empty') : 'Locked'}</div>
      <div class="dist-label">${anyUnlocked ? vis.label : ''}</div>
    `;

    if (anyUnlocked) {
      cell.addEventListener('click', () => _focusTier(dist.tiers[0]));
    }

    grid.appendChild(cell);
  });
}

function _focusTier(tierId) {
  // Switch to Scams tab
  const scamsBtn = document.querySelector('[data-tab="scams"]');
  if (scamsBtn) scamsBtn.click();
  // Scroll to tier card with a brief highlight
  setTimeout(() => {
    const card = document.getElementById('tier-card-' + tierId);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('map-highlight');
    setTimeout(() => card.classList.remove('map-highlight'), 1400);
  }, 80);
}

// ── Notification toasts ───────────────────────────────────────

function showNotification(msg, type) {
  const area = document.getElementById('notification-area');
  if (!area) return;

  const toast = document.createElement('div');
  toast.className = 'notification' + (type ? ' ' + type : '');
  toast.textContent = msg;
  area.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Click particles ───────────────────────────────────────────

function spawnClickParticle(x, y, value) {
  const p = document.createElement('div');
  p.className   = 'click-particle';
  p.textContent = '+' + fmt(value);
  p.style.left  = x + 'px';
  p.style.top   = y + 'px';
  p.style.position = 'fixed';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 800);
}

// ── Tab switching ─────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const tabEl = document.getElementById('tab-' + btn.dataset.tab);
      if (tabEl) tabEl.classList.add('active');

      // Re-render tabs on switch to keep them fresh
      if (btn.dataset.tab === 'upgrades') renderUpgradesTab();
      if (btn.dataset.tab === 'hq')       renderHqTab();
      if (btn.dataset.tab === 'gerald')   renderCostumesTab();
      if (btn.dataset.tab === 'map')      renderMapTab();
    });
  });
}

// ── Prestige UI ───────────────────────────────────────────────

function showPrestigeModal() {
  const overlay = document.getElementById('prestige-overlay');
  const desc    = document.getElementById('prestige-desc');
  desc.textContent =
    `You've earned ${fmt(STATE.total)} TP total. Relocating resets all TP, scams, upgrades, and HQ — ` +
    `but you keep achievements and gain a permanent ×2 income multiplier (currently ×${STATE.prestigeMultiplier}). ` +
    `Gerald will move to ${TOWNS[Math.min(STATE.prestigeCount + 1, TOWNS.length - 1)]}.`;
  overlay.classList.remove('hidden');
}

function hidePrestigeModal() {
  document.getElementById('prestige-overlay').classList.add('hidden');
}

// ── Full render pass (called each frame for cheap things) ──────

// Update mobile Stats tab numbers (only touches DOM if elements exist)
function renderMobileStats() {
  const total   = document.getElementById('mobile-stat-total');
  const clicks  = document.getElementById('mobile-stat-clicks');
  const combo   = document.getElementById('mobile-stat-combo');
  const prestige = document.getElementById('mobile-stat-prestige');
  if (!total) return;
  total.textContent    = fmt(STATE.total);
  clicks.textContent   = fmt(STATE.clicks);
  combo.textContent    = STATE.comboPeak;
  prestige.textContent = STATE.prestigeCount;
}

function updateAdTimers() {
  for (const c of COSTUMES_DATA.filter(x => x.unlockType === 'ad')) {
    const el = document.getElementById('ad-timer-' + c.id);
    if (!el) continue;
    const rem = getAdCostumeRemaining(c.id);
    if (rem > 0) {
      el.textContent = '⌛ ' + formatAdTimer(rem) + ' remaining';
    } else {
      // Timer hit zero — re-render the whole tab to show Watch Ad button
      renderCostumesTab();
      return;
    }
  }
}

function renderFrame() {
  renderLeftPanel();
  renderTiersTab(); // cheap because it updates in-place
  renderMobileStats();
  updateAdTimers();
}
