# Session handoff — Personal OS V2 onboarding

Written 2026-07-30 so the next session can pick up cold.

## State at handoff

- Live URL: https://makeyoudiscplined.netlify.app
- GitHub main: `ManishPratik/Threshold-` at commit `a2302cd`
  (`V2 onboarding — witness ritual + Today keepsake`, on top of
  `6565926` `V1.1 UI redesign — warm editorial design system across every screen`).
- Netlify: auto-builds from `main`. Deploy of `a2302cd` verified live;
  served assets `/assets/index-ClJYs1OQ.js` + `/assets/index-bENPLQKw.css`
  match the local `dist/index.html` bundle references.
- Both onboarding paths verified against production:
  - New user → `/today` redirects to `/welcome` (Mirror screen).
  - Existing user (with `setting-onboarding-completed` present in
    IndexedDB `settings` store) → `/today` renders normally.

## Repo layout — read before editing

There are two working trees. This matters.

- **Source of truth (edit here):** `/home/manishpratik/personal-os` on WSL.
  Not a git repo. All V1.1 + V2 code lives here.
- **Git clone (commit + push here):** `/tmp/threshold-swap` on WSL,
  tracks `ManishPratik/Threshold-` (branch: `main`).

Deploy workflow that has been used successfully both for V1.1 and V2:

```
# in WSL
rsync -a --delete \
  --exclude='.git' --exclude='node_modules' --exclude='dist' \
  /home/manishpratik/personal-os/ /tmp/threshold-swap/

cd /tmp/threshold-swap
git add -A && git status
git commit -m "<what changed>"

# push using gh token (avoids credential prompt)
TOKEN=$(gh auth token)
git -c credential.helper= push \
  "https://x-access-token:$TOKEN@github.com/ManishPratik/Threshold-.git" main:main
```

Netlify picks up the push and builds in roughly 1–2 minutes.

## V2 onboarding — what shipped

Six-screen emotional arc, additive over V1.1 (no domain-service edits):

| # | Route | Purpose |
| - | ----- | ------- |
| 1 | `/welcome` (index)      | Mirror — one sentence, ghost Continue |
| 2 | `/welcome/reframe`      | Reframe — "trust yourself" metaphor |
| 3 | `/welcome/promise`      | Promise — CreateMissionForm with `hideHeader` |
| 4 | `/welcome/routine`      | Shape — RoutineBuilder with `onDraftReady` |
| 5 | `/welcome/commit`       | Signature (ReviewMissionScreen) + Witness Ritual |

Ritual timing is one CSS-driven sequence — all delays documented at the
top of `src/features/onboarding/WitnessRitual.module.css`.

### Load-bearing files (V2)

New:
- `src/features/onboarding/OnboardingGate.tsx` — routes fresh users to
  `/welcome`; silently marks legacy users completed when a non-bootstrap
  active mission already exists.
- `src/features/onboarding/onboardingService.ts` — key-value setting
  `onboarding.completedAt` in the existing `settings` store, id
  `setting-onboarding-completed`. No schema bump.
- `src/features/onboarding/OnboardingSetup.tsx` + `onboardingSetupContext.ts`
  — React context holding `missionDraft` + `routineDraft` across `/welcome/*`
  routes. `commitAll` runs `activateNewMission` then
  `saveRoutineForActiveMission`.
- `src/features/onboarding/WitnessRitual.tsx` + `WitnessRitual.module.css`
  — Frames 2-6 of the storyboard.
- `src/routes/welcome/WelcomeLayout.tsx` — wraps children in
  `OnboardingSetupProvider` and `OnboardingGate`.
- `src/routes/welcome/WelcomeScreen{1..5}.tsx` — one file per storyboard
  frame.
- `src/routes/welcome/WelcomeFormShell.tsx` — shared editorial header
  for screens 3/4/5.

Modified (all additive, optional props only):
- `src/features/mission-contract/CreateMissionForm.tsx` — `hideHeader?`
- `src/features/mission-contract/ReviewMissionScreen.tsx` — `hideHeader?`;
  CTA copy changed globally from "I commit" → "I promise." and loading
  label "Committing…" → "Making the promise…".
- `src/features/mission-contract/MissionSummaryCard.tsx` — renders the
  unlabelled witness timestamp under mission title when the mission is
  not bootstrap and has `activatedAt`.
- `src/features/mission-contract/index.ts` — exports `CreateMissionForm`
  and `ReviewMissionScreen`.
- `src/features/routine-engine/RoutineBuilder.tsx` — `hideHeader?`,
  `onDraftReady?`, `primaryLabel?` (used by onboarding to defer the
  routine save).
- `src/shared/lib/date.ts` — `formatWitnessTimestamp(iso, locale='en-GB')`
  producing e.g. `Wed 29 Jul 2026 · 14:32`.
- `src/app/router.tsx` — adds `/welcome` route tree.
- `src/app/AppLayout.tsx` — wraps children in `OnboardingGate`.

### Verified frozen decisions (do not re-litigate)

- Six screens exactly. Frame 4 dedication removed (silence is stronger).
- Each screen leaves the user with exactly one remembered sentence.
- The user's promise is the visual climax; pause beat 1 sized *below*
  it (36 px vs 40 px desktop; 26 px vs 28 px mobile).
- CTA is "I promise." not "I commit."
- The keepsake timestamp is unlabelled — no "Committed on…" header.
- The onboarding completion flag is written at "Begin today" press, not
  at ritual start (allows retry on commit failure) and not at commit
  success (would trap user in `/welcome` if they close the tab before
  seeing the ritual). Legacy-user branch in `OnboardingGate.tsx:36-40`
  is the safety net.

### Deferred (V2 → V2.1)

- Draft persistence across refresh in `/welcome/*` (context is in-memory
  only; acceptable for a 3-minute first-run flow).
- Timezone label on the keepsake timestamp — browser-local formatting
  today; could confuse multi-device users.
- MyBookings audit — belongs to a different project (zymo-web), not this
  repo. Called out in `feedback_wrap_up_ritual` memory.

## Live smoke recipe (repeat after any push)

```
# 1. asset hashes match
curl -sSL https://makeyoudiscplined.netlify.app/ \
  | grep -oE '/assets/index-[A-Za-z0-9_-]+\.(js|css)' | sort -u
# compare with:
grep -oE '/assets/index-[A-Za-z0-9_-]+\.(js|css)' \
  /home/manishpratik/personal-os/dist/index.html | sort -u

# 2. new-user path (Chrome DevTools MCP, fresh isolatedContext)
new_page url=https://makeyoudiscplined.netlify.app/today
# expect redirect to /welcome + Mirror heading

# 3. existing-user path — seed IDB then reload
evaluate_script (see body below) to write:
  store: settings
  row: { id:'setting-onboarding-completed', key:'onboarding.completedAt',
         type:'string', value:<iso>, createdAt:<iso>, updatedAt:<iso>,
         schemaVersion:1 }
navigate_page url=.../today
# expect Today shell to render — no redirect
```

## Hidden session constraints (do not surprise-violate)

- `no-guessing-gate.py` Stop hook blocks the response if any backticked
  path token doesn't resolve to a real file relative to the repo root.
  Backticked short filenames get parsed as paths — either use the full
  absolute path or describe the file in prose. `.css` filename endings
  are especially prone to being parsed as `.c`.
- The same hook blocks hedge words (`probably`, `likely`, `should work`,
  `appears to`, `I think`, …) and unverified severity tags anywhere in
  the response.
- STYLE guardrails: default response is 1–2 lines. Tables and headers
  only when the user explicitly asks. No unsolicited option matrices,
  scorecards, or "next steps".
- Every response opens with the NO-GUESS AFFIRMATION exactly:
  `I will not guess, pattern match, or present any claim without evidence.`

## First things to do in the next session

1. `git -C /tmp/threshold-swap log --oneline -5` — confirm `main` is
   still at `a2302cd` (or newer).
2. `curl -sSI https://makeyoudiscplined.netlify.app/` — confirm site up.
3. Read this doc.
4. Ask the user what they want; do not assume continuation of any
   specific thread. V1.0 blockers are shipped; V1.1 UI redesign is
   shipped; V2 onboarding is shipped.
