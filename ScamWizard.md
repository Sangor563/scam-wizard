# Scam Wizard — Reference

Poki HTML5 clicker game. Vanilla JS/CSS/HTML, no framework, no build step.
Open `index.html` directly in browser.

**Status:** All code written. All 8 items + Gerald images integrated.
**Debug:** `SW.addTp(n)`, `SW.reset()`, `SW.prestige()` via browser console.

---

## Stack & Files

```
index.html
css/  main.css  animations.css  mobile.css
js/   state → audio → tiers → upgrades → hq → costumes → save → combo → victims → events
      → diary → rival → achievements → spells → randomizer → poki → minigames → ui → main
assets/images/   gerald/Gerald_01-06.png  tiers/  ui/
assets/audio/    assets/fonts/
poki-sdk/        (download from sdk.poki.com)
```

---

## Currency & Core Loop

- **Trust Points (TP)** — click Gerald to earn, scams auto-produce
- Click power: `STATE.cp` (starts 5) × `clickMultiplier` × `prestigeMultiplier` × combo
- `STATE.hps` = Σ tier outputs × upgrade mults × prestige × temp mults × randomizer modifier
- Cost scale: `baseCost × 1.18^count`

---

## Scam Tiers (11)

| ID | Name | Base Cost | Output/s | Unlock |
|----|------|-----------|----------|--------|
| pebble | Lucky Pebble | 12 | 0.1 | start |
| fortune | Fortune Telling | 60 | 0.5 | 50 TP |
| potion | Potion Emporium | 350 | 2 | 200 TP |
| scroll | Prophecy Scrolls | 1,600 | 7 | 1K TP |
| spa | Dragon Tears Spa | 7,000 | 25 | 5K TP |
| moon | Moon Land Registry | 35,000 | 100 | 20K TP |
| academy | Wizard Academy | 180,000 | 500 | 100K TP |
| cathedral | Con Cathedral | 900,000 | 2,500 | 500K TP |
| interdimensional | Interdimensional Real Estate | 50,000,000 | 10,000 | 5M TP |
| timeshare | Time Share Scam | 300,000,000 | 50,000 | 30M TP |
| religion | The Gerald Religion | 2,000,000,000 | 250,000 | 200M TP |

---

## Upgrades (10, one-time)

| ID | Effect | Cost |
|----|--------|------|
| u1 | click ×2 | 120 |
| u2 | all output ×1.5 | 700 |
| u3 | click ×5 | 5,000 |
| u4 | all output ×2 | 28,000 |
| u5 | click ×10 | 140,000 |
| u6 | all output ×3 | 500,000 |
| u7 | click ×5 + output ×5 | 2,000,000 |
| u8 | output ×4 | 5,000,000 |
| u9 | click ×20 | 20,000,000 |
| u10 | click ×10 + output ×10 | 500,000,000 |

Hidden upgrades: `_real_wizard_lesson` (+50% HPS), `_real_wizard_photo` (×1.2 HPS) — granted via events.

---

## HQ Levels (6)

| Lvl | Name | Cost | Bonus/s | Unlocks costume |
|-----|------|------|---------|-----------------|
| 0 | Gerald's Tent | free | +0 | robe_torn |
| 1 | Rickety Shack | 500 | +0.5 | robe_clean |
| 2 | Dodgy Office | 3,000 | +2 | suit |
| 3 | Scammer's Manor | 20,000 | +8 | cape |
| 4 | Mystic Tower | 120,000 | +30 | archmage |
| 5 | Con Cathedral HQ | 700,000 | +120 | pope |

---

## Costumes (6)

| ID | Click mult | Unlocked by |
|----|-----------|-------------|
| robe_torn | ×1 | start |
| robe_clean | ×1.2 | HQ 1 |
| suit | ×1.5 | HQ 2 |
| cape | ×2 | HQ 3 |
| archmage | ×3 | HQ 4 |
| pope | ×5 | HQ 5 |

Gerald image: `getGeraldImage(costumeId)` → `assets/images/gerald/Gerald_0N.png` (500×500).
Lazy-loaded; emoji fallback until image resolves. Desktop: 160×160px, mobile: 88×88px.
Costume → file: 01=robe_torn, 02=robe_clean, 03=suit, 04=cape, 05=archmage, 06=pope.

---

## Systems

**Combo** (`combo.js`) — 5 clicks within 3s → COMBO ×2→3→5→8. 3s idle resets.

**Victims** (`victims.js`) — Emoji figure + quote floats in every 10-20s (Double Trouble: 5-10s). Click for TP. 3 clicks in 3s = "Hard Sell" ×3 bonus. Every 30 spawns → VIP (5 clicks = HPS×30). Max 2 on screen (4 in flood mode).

**Spell Charge** (`spells.js`) — +2% per Gerald click. At 100%: random spell fires, charge resets. 6 spells: gold rush (×3 HPS 1min), mind fog (15 victims), lucky break, time warp (passive burst), crowd frenzy (×5 click 30s), divine favour (free tier).

**Events** (`events.js`) — Modal every 45-90s (Conspiracy modifier: 15-30s). 3 choices. Inspector Holiday modifier skips inspector + gives +500 TP. Lucky modifier: risky choices succeed 80%.

**Diary** (`diary.js`) — Parchment modal at: 100 / 1K / 10K / 100K / 500K / 1M / 10M / 100M / 1B TP.

**Rival** (`rival.js`) — Merlin at 60% HPS (Merlin's Bad Day modifier: 20%).

**Randomizer** (`randomizer.js`) — On each prestige: new 4-digit seed, one modifier, 3 tasks from pool. Separate save key `scam_wizard_run_v1`. Easter eggs: 1% every ~10s, 5min cooldown.

**Mini-games** (`minigames.js`) — Each tier unlocks a mini-game at count ≥10. Win = ×3 output 2min, 5min cooldown. All 11 tiers have unique games.

**Save** (`save.js`) — localStorage `scam_wizard_v1`. Auto-save 30s + on purchase. Offline earnings up to 24h.

**Prestige** — Unlocks at 50M total TP. Resets TP/scams/upgrades/HQ. Permanent ×2 multiplier. Up to 10 prestiges.

---

## Randomizer Modifiers (8)

| ID | Effect |
|----|--------|
| gullible | HPS ×1.5 |
| inspector_holiday | Inspector skipped, gives +500 TP |
| viral | Click ×3, HPS ×0.5 |
| gold_rush | First 3 tiers ×5 output |
| merlin_bad | Merlin runs at 20% speed |
| double_trouble | Victims 2× as frequent |
| conspiracy | Events 3× more frequent |
| lucky | Risky choices succeed 80% |

---

## Task Pool (3 per run)

t1 Sell 50 pebbles → ×2 click 10min · t2 Trigger 3 events → +1K TP · t3 Click 200× → free tier · t4 Earn 5K passive → ×2 HPS 5min · t5 Win 2 risky choices → perm +1 click · t6 Reach combo ×5 → +10% perm passive · t7 5 victim clicks → ×3 income 3min · t8 Survive inspector → +2K TP

---

## Achievements (15)

a1–a15 same as before. Displayed in right panel (desktop) / Stats tab (mobile).

---

## Milestones

Progress bar: 500 → 2K → 8K → 30K → 100K → 500K → 2M → 10M → 50M → 500M → 2B TP

---

## Map Tab (9 districts)

3×3 grid. Each district maps to a tier. Visual states by count: 0=🌫️ fog, 1-5=⛺ camp, 6-15=🏪 shop, 16+=🏰 grand. Click district → focus tier tab.

---

## Poki SDK (`poki.js`)

- `gameLoadingFinished()` on load
- `gameplayStart()` on first click (not on load)
- `gameplayStop()` / `gameplayStart()` around all modals (events, diary, prestige, mini-games)
- `commercialBreak()` midroll every 5min after modal close; on complete → re-shows ad offer UI
- `rewardedBreak()` for opt-in ad → ×2 income 2min
- Ad offer UI (`#ad-reward-container` / `#mobile-ad-container`): hidden by default, shown after each commercial break; Continue dismisses, Watch Ad grants reward
- All localStorage ops wrapped in try/catch

---

## Visual & Layout

Colors: bg `#0a0914` · panel `#110e2a` · accent purple `#8b5cf6` · gold `#f59e0b`

**Desktop** (>1024px): 3-column — Left 260px · Middle flex · Right 210px
**Tablet** (768-1024px): 2-column, right panel hidden, Stats tab visible
**Mobile** (<768px): 1-column, Gerald + info hero top, tabs middle, nav bottom. Stats tab has modifier + tasks + achievements + rival + ad buttons.

Assets: `assets/images/gerald/` · `assets/images/tiers/` · `assets/images/ui/`
