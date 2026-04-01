// ============================================================
// diary.js — Gerald's milestone diary popup system
// ============================================================

const DIARY_ENTRIES = [
  {
    id:        'd1',
    milestone: 100,
    date:      'Day 1',
    text:      'Sold my first enchanted pebble today. Mr. Henderson from next door bought it for 3 coins. He said it "felt lucky." It did not feel lucky. It felt like a rock. Because it is a rock.\n\nBut he seemed happy. I also seem happy. I don\'t know what this means.',
  },
  {
    id:        'd2',
    milestone: 1000,
    date:      'Day 12',
    text:      'Business is growing. I\'ve hired an assistant. His name is Dave. Dave cannot lie convincingly and sweats when nervous, which is always.\n\nHe is, unfortunately, perfect for this job.',
  },
  {
    id:        'd3',
    milestone: 10000,
    date:      'Day 31',
    text:      'A woman came to the fortune telling booth and cried because my prophecy was "so accurate." I told her "something will change soon."\n\nHer hat blew off in the wind immediately after. She called it a sign.\n\nI called it weather. We were both right.',
  },
  {
    id:        'd4',
    milestone: 100000,
    date:      'Day 89',
    text:      'I now own seventeen plots of land on the moon. I have never been to the moon. I don\'t think anyone has checked recently.\n\nThe certificates look very official. I printed them myself.\n\nThe moon sticker was my idea.',
  },
  {
    id:        'd5',
    milestone: 500000,
    date:      'Day 201',
    text:      'They\'ve finally caught up with me. Inspector Hargrove knows about the pebbles, the potions, the moon land. All of it.\n\nI should be worried. Instead I feel... ready.\n\nThere\'s another town over the hill. Fresh customers. Fresh possibilities.\n\nA wizard never truly retires. He merely relocates.',
  },
  {
    id:        'd6',
    milestone: 1000000,
    date:      'Day 347',
    text:      'The inspector came again today. Third time this month. I told him I was "a certified practitioner of probabilistic metaphysics."\n\nHe wrote it down.\n\nI don\'t know what it means either. He left.\n\nI think he\'s starting to believe.',
  },
  {
    id:        'd7',
    milestone: 10000000,
    date:      'Day 521',
    text:      'People are building shrines.\n\nI told them not to. They built more shrines.\n\nOne of them has my face on it. It\'s not a bad likeness. Dave did the painting. Dave cannot paint.\n\nIt\'s a very bad likeness. They love it.',
  },
  {
    id:        'd8',
    milestone: 100000000,
    date:      'Day 744',
    text:      'A government contacted me today.\n\nNot to arrest me.\n\nTo ask for advice.\n\nI don\'t know what I\'m doing. Neither do they. We get along very well.',
  },
  {
    id:        'd9',
    milestone: 1000000000,
    date:      'Day 1,001',
    text:      'I found one of my original pebbles today. One of Mr. Henderson\'s.\n\nI put it in a glass case. It is now insured for 3 million gold.\n\nIt is still just a pebble.\n\nThis is fine.',
  },
];

const Diary = (() => {
  let queue = [];      // entries waiting to be shown
  let showing = false;

  function checkMilestones() {
    for (const entry of DIARY_ENTRIES) {
      if (!STATE.diaryRead.includes(entry.id) && STATE.total >= entry.milestone) {
        if (!queue.find(e => e.id === entry.id)) {
          queue.push(entry);
        }
      }
    }
    if (queue.length > 0 && !showing) showNext();
  }

  function showNext() {
    if (queue.length === 0) { showing = false; return; }
    // Don't interrupt event modals
    if (!document.getElementById('modal-overlay').classList.contains('hidden')) {
      setTimeout(showNext, 2000);
      return;
    }

    showing = true;
    const entry = queue.shift();
    showEntry(entry);
  }

  function showEntry(entry) {
    const overlay = document.getElementById('diary-overlay');
    const dateEl  = document.getElementById('diary-date');
    const textEl  = document.getElementById('diary-text');
    const closeBtn = document.getElementById('diary-close');

    dateEl.textContent = entry.date;
    // Replace newlines with <br> for HTML rendering
    textEl.innerHTML   = entry.text.replace(/\n/g, '<br>');

    Poki.onModalOpen();
    overlay.classList.remove('hidden');
    Audio.sfxDiary();

    closeBtn.onclick = () => {
      overlay.classList.add('hidden');
      Poki.onModalClose();
      STATE.diaryRead.push(entry.id);
      checkAchievements();
      saveGame();
      showing = false;
      // Show next queued diary after a brief pause
      setTimeout(showNext, 500);
    };
  }

  return { checkMilestones };
})();
