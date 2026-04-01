// ============================================================
// achievements.js — 15 achievements, check + unlock
// ============================================================

const ACHIEVEMENTS_DATA = [
  {
    id:   'a1',
    name: 'First Sucker',
    icon: '🪨',
    desc: 'Everyone starts somewhere.',
    check: () => STATE.total >= 1,
  },
  {
    id:   'a2',
    name: 'Technically Legal',
    icon: '🤞',
    desc: 'May contain magic. Probably doesn\'t.',
    check: () => STATE.total >= 500,
  },
  {
    id:   'a3',
    name: 'Potion Dealer',
    icon: '🧪',
    desc: 'No refunds policy is genius.',
    check: () => getTierCount('potion') >= 5,
  },
  {
    id:   'a4',
    name: 'Click Maniac',
    icon: '👆',
    desc: 'Your finger filed a complaint.',
    check: () => STATE.clicks >= 500,
  },
  {
    id:   'a5',
    name: 'Interior Decorator',
    icon: '🛖',
    desc: 'Four walls. Big improvement.',
    check: () => STATE.hqLevel >= 1,
  },
  {
    id:   'a6',
    name: 'Lunar Landlord',
    icon: '🌕',
    desc: 'You own the moon now.',
    check: () => getTierCount('moon') >= 1,
  },
  {
    id:   'a7',
    name: 'Sharp Dressed Con',
    icon: '😎',
    desc: 'The suit makes the man.',
    check: () => STATE.costume === 'suit',
  },
  {
    id:   'a8',
    name: 'Combo King',
    icon: '💥',
    desc: 'Unstoppable. Literally.',
    check: () => STATE.comboPeak >= 4,   // reached ×8 (level 4)
  },
  {
    id:   'a9',
    name: 'Beloved Scammer',
    icon: '🤝',
    desc: 'They keep coming back.',
    check: () => STATE.victimClicks >= 10,
  },
  {
    id:   'a10',
    name: 'Millionaire',
    icon: '💰',
    desc: 'Even you can\'t explain this.',
    check: () => STATE.total >= 1000000,
  },
  {
    id:   'a11',
    name: 'Merlin Slayer',
    icon: '⚔️',
    desc: 'The real wizard lost.',
    check: () => STATE.rivalBeaten >= 3,
  },
  {
    id:   'a12',
    name: 'Diary Keeper',
    icon: '📖',
    desc: 'Gerald is surprisingly deep.',
    check: () => STATE.diaryRead.length >= 5,
  },
  {
    id:   'a13',
    name: 'Reborn Scammer',
    icon: '✨',
    desc: 'Reset. Wiser. Broker. Wiser.',
    check: () => STATE.prestigeCount >= 1,
  },
  {
    id:   'a14',
    name: 'Grand Con Master',
    icon: '👑',
    desc: 'Empire of pebbles and audacity.',
    check: () => STATE.hqLevel >= 5,
  },
  {
    id:   'a15',
    name: 'True Believer',
    icon: '🌟',
    desc: 'Something real happened.',
    check: () => STATE.upgrades.includes('u7'),
  },
];

function checkAchievements() {
  for (const ach of ACHIEVEMENTS_DATA) {
    if (!STATE.achievements.includes(ach.id)) {
      try {
        if (ach.check()) unlockAchievement(ach.id);
      } catch (e) { /* guard against missing data */ }
    }
  }
}

function unlockAchievement(id) {
  if (STATE.achievements.includes(id)) return;
  STATE.achievements.push(id);
  const ach = ACHIEVEMENTS_DATA.find(a => a.id === id);
  if (!ach) return;

  Audio.sfxAchievement();
  showNotification(`🏆 Achievement: ${ach.icon} ${ach.name} — "${ach.desc}"`, 'achievement');

  // Animate the achievement item in both desktop and mobile lists
  for (const elId of ['ach-' + id, 'mach-' + id]) {
    const el = document.getElementById(elId);
    if (el) {
      el.classList.remove('locked');
      el.classList.add('unlocked', 'just-unlocked');
      setTimeout(() => el.classList.remove('just-unlocked'), 600);
    }
  }
}

function renderAchievements() {
  // Render into whichever containers exist (desktop right panel + mobile Stats tab)
  for (const containerId of ['achievements-list', 'mobile-ach-list']) {
    const list = document.getElementById(containerId);
    if (!list) continue;
    list.innerHTML = '';
    for (const ach of ACHIEVEMENTS_DATA) {
      const unlocked = STATE.achievements.includes(ach.id);
      const el = document.createElement('div');
      // Use unique IDs per container so both can animate independently
      el.id        = containerId === 'achievements-list' ? 'ach-' + ach.id : 'mach-' + ach.id;
      el.className = 'achievement-item ' + (unlocked ? 'unlocked' : 'locked');
      el.innerHTML = `
        <span class="ach-icon">${ach.icon}</span>
        <div class="ach-info">
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${unlocked ? ach.desc : '???'}</div>
        </div>
      `;
      list.appendChild(el);
    }
  }
}
