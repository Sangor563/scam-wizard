// ============================================================
// audio.js — Web Audio API synthesized sound effects
// Zero external files, zero bytes of assets.
// ============================================================

const Audio = (() => {
  let ctx = null;
  let muted = false;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    // Resume on user interaction (browser autoplay policy)
    // Wrapped in try/catch because Safari can throw synchronously from resume()
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    return ctx;
  }

  // Generic tone helper: freq, type, attack, sustain, release, vol
  function tone(freq, type, attack, sustain, release, vol = 0.25, startTime) {
    const c = getCtx();
    if (!c || muted) return;
    try {
      const t = startTime || c.currentTime;
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + attack);
      gain.gain.setValueAtTime(vol, t + attack + sustain);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + sustain + release);
      osc.start(t);
      osc.stop(t + attack + sustain + release + 0.05);
    } catch (e) { /* ignore audio errors — never break game logic */ }
  }

  // Short high click "ding"
  function sfxClick() {
    tone(880, 'sine', 0.005, 0.02, 0.08, 0.18);
  }

  // Upward 3-note buy jingle
  function sfxBuy() {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(440, 'triangle', 0.01, 0.04, 0.1, 0.2, t);
    tone(550, 'triangle', 0.01, 0.04, 0.1, 0.2, t + 0.1);
    tone(660, 'triangle', 0.01, 0.08, 0.2, 0.25, t + 0.2);
  }

  // Combo — pitch rises with level (0=low…3=high)
  function sfxCombo(level) {
    const freqs = [330, 440, 550, 880];
    const f = freqs[Math.min(level, 3)];
    const c = getCtx();
    if (!c || muted) return;
    const t = c.currentTime;
    tone(f,       'sawtooth', 0.01, 0.05, 0.15, 0.3, t);
    tone(f * 1.5, 'sine',     0.01, 0.05, 0.15, 0.2, t + 0.07);
  }

  // Mysterious event three-note chord
  function sfxEvent() {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(220, 'sine', 0.02, 0.1, 0.4, 0.15, t);
    tone(277, 'sine', 0.02, 0.1, 0.4, 0.12, t + 0.05);
    tone(330, 'sine', 0.02, 0.15, 0.5, 0.1, t + 0.1);
  }

  // Achievement fanfare — 4 notes rising
  function sfxAchievement() {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    [262, 330, 392, 523].forEach((f, i) => {
      tone(f, 'triangle', 0.01, 0.08, 0.15, 0.22, t + i * 0.1);
    });
  }

  // Prestige — dramatic 5-note descend then rise
  function sfxPrestige() {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    [523, 440, 330, 220, 440].forEach((f, i) => {
      tone(f, 'sawtooth', 0.01, 0.12, 0.2, 0.3, t + i * 0.15);
    });
  }

  // Soft bell for victim appearance
  function sfxVictim() {
    tone(1047, 'sine', 0.005, 0.01, 0.3, 0.1);
  }

  // Victory over Merlin
  function sfxRival() {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    [392, 494, 587, 784].forEach((f, i) => {
      tone(f, 'triangle', 0.01, 0.1, 0.18, 0.25, t + i * 0.08);
    });
  }

  // Diary page rustle
  function sfxDiary() {
    const c = getCtx();
    if (!c || muted) return;
    try {
    const t = c.currentTime;
    // White noise burst
    const bufSize = c.sampleRate * 0.15;
    const buf  = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src  = c.createBufferSource();
    const gain = c.createGain();
    const filt = c.createBiquadFilter();
    src.buffer = buf;
    filt.type = 'bandpass';
    filt.frequency.value = 2000;
    filt.Q.value = 0.5;
    src.connect(filt);
    filt.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.start(t);
    } catch (e) { /* ignore audio errors */ }
  }

  // Tense short beep for limited event
  function sfxLimited() {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(660, 'square', 0.005, 0.05, 0.08, 0.2, t);
    tone(880, 'square', 0.005, 0.05, 0.1,  0.2, t + 0.12);
  }

  function setMuted(val) { muted = val; }
  function isMuted() { return muted; }

  return {
    sfxClick, sfxBuy, sfxCombo, sfxEvent, sfxAchievement,
    sfxPrestige, sfxVictim, sfxRival, sfxDiary, sfxLimited,
    setMuted, isMuted,
    // Warm up audio context on first user interaction
    init() { getCtx(); }
  };
})();
