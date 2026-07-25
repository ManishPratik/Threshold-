# THRESHOLD

Single-file HTML/CSS/JS PWA — smoking-cessation companion built around the science of nicotine clearance, peak withdrawal, and habit rewiring.

Deployed on Netlify (auto-publish from `main`). All app content is now user-editable — no personal / Zymo-specific text ships in defaults.

---

## Anatomy

- `index.html` — one file, ~5600 lines, contains:
  - CSS (top `<style>` block)
  - HTML (screens, tabs, overlays)
  - JS (bottom `<script>` block)
- `netlify.toml` — `publish = "."` (root deploy)
- No build step. No dependencies. No framework. Everything runs in the browser.

The single-file constraint is deliberate: PWA installability + offline via inline service worker + zero build friction.

---

## Storage

Everything lives in `localStorage`. The full key map is at the top of the JS section:

```js
const LS = {
  MISSION_START, QUIT_TIME, PACK_COST, SMOKING_START,
  TASK_PTS_TOTAL, TASK_LOG, CRAVING_LOG, BADGES_SHOWN,
  TASKS_CUSTOM, BLOCKS_CUSTOM, STREAK_TASKS,
  PEAK_CROSSED, PEAK_CROSSED_AT, HURDLES_ACKED,
  MANTRA, PERSONAL_BEST,
  FR_QUOTE, PLEDGE_BODY, LAPSE_BODY, DOPAMINE_BODY, DOPAMINE_TRUTH, OUTCOMES,
  LAUNCH_EYEBROW, LAUNCH_TAGLINE, LAUNCH_ASTRO, LAUNCH_DECL,
  DAY_START (per-day prefix),
};
```

### Key semantics
- **QUIT_TIME** — canonical "when the smoke-free counter started" (read by `getQuitTs()`). Every timer on-screen derives from this. If you write to `SMOKING_START` without touching `QUIT_TIME`, nothing visible changes (this bug was fixed in Batch 24).
- **MISSION_START** — when the 21-day cycle counter began. Reset on full relapse.
- **TASK_LOG** — `{ [YYYY-MM-DD]: { [taskId]: timestampMs, __max: pointsThatDay } }`. The `__max` snapshot preserves per-day analytics accuracy across task edits.
- **TASKS_CUSTOM** — array of `{id, name, pts, mins, block_id, order, priority, priorityIcon, archived, created_at}`. Deleted tasks are archived (not removed) so history keeps resolving them.
- **OUTCOMES** — shared between launch screen and Freedom tab. `[{id, icon, title, body}]`, unlimited count.
- **All `*_BODY` / `LAUNCH_*` / `FR_QUOTE` / `MANTRA`** — user-authored text. Blank by default. Rendered via `renderFreedomEditables()` and `renderLaunchScreen()` from `LS.getItem(key) || DEFAULT_KEY_or_placeholder`.

---

## Screens & tabs

- **`#s-launch`** — pre-ignition. Fully user-editable (Batch 27). Blank on fresh install; "Fill these to make it yours" hint auto-hides once populated.
- **`#s-app`** — post-ignition. Three tabs:
  - **Command** — Merged from old War Room + Log + Analytics (Batch 22). Success-probability orb, cycle pulse, streak hero, mission progress bar, 21-day heatmap, momentum SVG, key-metrics tiles with trend arrows, dynamic priority-task bars, time-of-day chart, editable mantra.
  - **Tasks** — Fully user-editable task/block system with drag reorder, undo snackbar, empty state, Task Settings ⚙ (Manage Blocks / Pick Streak Tasks / Reset / Clear All). Batches 14-16.
  - **Freedom** — Chamber (bloodstream vessel + live nicotine %), peak-withdrawal banner (H0-72), post-peak hurdles chain, vitals row, difficulty curve, editable quote/pledge/lapse/dopamine cards, shared outcomes list, health milestones + hourly timeline accordions. Batches 17-25.

---

## The chamber & the science

- **`getWormStage(cleanHrs)`** returns 1-5 based on time since quit; stage 5 (nicotine fully cleared) fires at H72 per the app's own `HOURLY_MSGS`.
- **`getWormScale(cleanHrs)`** and **`nicotinePctRemaining(cleanHrs)`** both follow half-life `0.5^(t/2)`. The chamber's big number and the worm's visual size stay in lockstep with the "50% cleared at H2, gone by H72" narrative.
- **Peak withdrawal window** = H0-72 per `PEAK_END_HOURS` constant. Peak banner shows during; `ov-peak-crossed` celebration fires ONCE at H72 (guarded by `LS.PEAK_CROSSED`).
- **Hurdles chain** (post-peak) — 6 named milestones (`week1`, `week2`, `month1`, `month3`, `month6`, `year1`) in `HURDLES`. Each fires `ov-hurdle-cross` with ratchet-framed copy referencing the peak already crossed. Acked in `LS.HURDLES_ACKED`.

Full relapse (`confirmSmoked()`) wipes: `QUIT_TIME`, `SMOKING_START`, `MISSION_START`, `PEAK_CROSSED`, `PEAK_CROSSED_AT`, `HURDLES_ACKED`, `BADGES_SHOWN`, plus in-memory guards. Preserves: `TASK_LOG`, `TASK_PTS_TOTAL`, `PERSONAL_BEST`, `TASKS_CUSTOM`, `BLOCKS_CUSTOM`, `STREAK_TASKS`, `MANTRA`, `PACK_COST`, `CRAVING_LOG`, `th_quit_locked`, all editable text keys.

---

## Editable content — the pattern

Every user-visible text block on Freedom tab and launch screen is one of these:

1. **Single text slot** — `<div ... onclick="openEditText('KEY')"><span id="slot-id">…</span><span class="edit-pencil">✎</span></div>`. Config in `_EDIT_TEXT_CFG` (title, hint, default). Overlay `ov-edit-text` handles save/reset.

2. **Outcomes list** — `LS.OUTCOMES` array, unlimited. Rendered by `renderOutcomes()` into BOTH `#fr-outcomes-list` and `#launch-outcomes-list`. Managed via `ov-outcomes-manage`.

To add a new editable slot:
1. Add key to `LS` map.
2. Add `DEFAULT_KEY` constant (blank string `''` if you want it truly optional).
3. Add entry to `_EDIT_TEXT_CFG` with `lsKey`, `title`, `hint`, `def`.
4. Add HTML: `<div class="editable-card" onclick="openEditText('KEY')"><span id="new-slot-text"></span><span class="edit-pencil">✎</span></div>`.
5. Add setter in `renderFreedomEditables()` or `renderLaunchScreen()` depending on surface.

---

## Rendering pipeline

- `setInterval(updateWarRoom, 1000)` — every second: orb, task pts, today counts.
- `updateFreedom()` on tab activation + on every tick when Freedom is active: hero timer, cycle pill, worm, chamber, peak banner, hurdles, editables, difficulty curve, milestones, hourly timeline.
- `renderCommand()` (aliased as `renderLog` / `renderAnalytics` for back-compat) — heatmap, momentum SVG, key metrics with deltas, priority tasks, time-of-day chart, mantra.
- `renderTasks()` on Tasks tab activation and after any task/block mutation.
- `renderLaunchScreen()` on init + on any launch-slot save.

---

## The CSS-override trap (learn from Batches 23 + 26)

Because everything lives in one file with a single `<style>` block, CSS cascade is your enemy. Two class definitions with the same name → later wins.

If you introduce a new class name and it "silently doesn't apply", grep the CSS block for duplicate `.className {` and delete orphan copies. Batches 22-27 hit this twice (`.an-stats-grid` / `.an-stat` in Batch 23; `.an-calendar` / `.an-cal-*` in Batch 26).

The audit script pattern (see git log for `_audit.js` in the Bash commands) covers:
- JS parse (`new Function(js)`)
- Duplicate HTML ids
- Div balance (stripping scripts + styles)
- Overlay id uniqueness
- Tab-pane vs nav-btn count parity
- LS keys used vs declared
- Duplicate CSS class definitions
- `getElementById` targets missing from static HTML
- Stale references to removed tabs/elements

Run it whenever you add or refactor a chunk.

---

## Deploying

- Push to `main` → Netlify auto-publishes (root of repo → deploy target per `netlify.toml`).
- Service worker (inline, `V='v11'` at bottom of JS) is network-first with cache fallback.
- Mobile users caching stale HTML: Chrome mobile → Site settings → threshold-nu.netlify.app → Clear & reset. Or uninstall/reinstall the PWA. Bumping `V` in the SW string forces cache invalidation.

---

## Batch history (Batches 14-27)

- **14-16** — Fully user-editable Tasks + Blocks. Storage rewrite from `{id:{name,mins}}` object → array with `archived` flag. CRUD overlays, drag-reorder, undo snackbar, empty state, streak-task picker, "Clear all tasks" button.
- **17** — Worm shrinks in lockstep with actual nicotine clearance (matches HOURLY_MSGS wording).
- **18** — The Chamber — bloodstream vessel + live nicotine % on Freedom tab.
- **19** — Peak-withdrawal banner (H0-72) with 4 sub-zones + chamber throb.
- **20** — Peak-Crossed celebration overlay + permanent badge at H72.
- **21** — Post-peak hurdles chain (6 milestones) + ratchet framing.
- **22** — Command tab (merged War Room + Log + Analytics) with motivating visuals.
- **23, 26** — Audit fixes for orphan CSS overriding new styles.
- **24** — Full-Relapse reset actually resets everything smoking-related (was writing to a dead key).
- **25** — Every Freedom-tab card user-editable (mantra, quote, pledge, lapse, dopamine body + truth, outcomes).
- **27** — Launch screen every slot user-editable, blank by default with placeholder hints, outcomes unlimited and shared with Freedom.
- **28** — Add `README.md` (this file) as handoff doc for next contributor.
- **29** — Audit fixes: removed orphan `.launch-outcomes` + `.oc-1/2/3` CSS; fixed `wu-text` override bug (Command tab's `updateWarRoom` was overwriting the user-edited motivational quote every second with `phase.urgency`).
- **30** — Deleted dead `VISIONS` and `URGENCY` arrays (declared but zero consumers) + orphan `S.visionIdx` state field. Personal Zymo/Manish/Jupiter content no longer lives in source at all.
- **31** — Genericised the last two personal-astrology strings that actually rendered: MILESTONES 1-Month body and one of the 5 orb-caption rotations. Grep confirms no personal strings remain in executable JS.

Full commit history: `git log --oneline`.

---

## Current audit status (as of Batch 31)

Running the 12-check audit script (see `## The CSS-override trap` above for what it covers) returns clean on every check:

- JS parses without error
- Zero duplicate HTML ids
- Div balance 347 opens = 347 closes
- 13 unique overlays
- 3 tab-panes ↔ 3 switchTab branches (`command` / `tasks` / `fr`)
- Zero onclick handlers reference undefined functions
- 27 LS keys declared, all 27 used, none undeclared, none unused
- Zero CSS class definitions duplicated outside `@media` blocks
- Zero personal-content strings (Jupiter / Manish / Wire Lands / Magnetic Force / Peak Presence) remain in executable JS after stripping comments
- Only "Zymo" references are the 4 owner-tagged science-anchor strings in PHASES + HOURLY_MSGS + the DEFAULT_TASKS seed entry

Two false-positive missing DOM targets — `getElementById('tab-'+name)` and `getElementById('cs-stage-'+n)` — are dynamic-id concatenations, not real bugs.

---

## Conventions

- **No emojis in code comments** (they land in commit diffs and are noisy).
- **File paths in commit messages use line numbers** — makes future audits faster.
- **Every batch ends with a `Batch N: <one-line summary>` commit + descriptive body**. Follow the pattern; it doubles as the changelog.
- **Verify before pushing** — write a `_audit.js` or `_verify.js` (delete after) for anything touching data flow or CSS class collisions.
- **Never bypass hooks** — the repo's git hooks are the safety net.
