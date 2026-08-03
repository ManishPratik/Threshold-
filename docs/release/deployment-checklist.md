# V1 Production Deployment Checklist

*Follow top-to-bottom. Every item must be confirmed before the deploy is promoted from staging to production.*

## Pre-deploy — local verification

- [ ] Working tree clean.
- [ ] `npm install` finishes without EBADENGINE or ERESOLVE errors.
- [ ] `npm run typecheck` — no output.
- [ ] `npm run lint` — no output.
- [ ] `npm test` — 335 tests / 23 files pass (baseline count; growth is fine, regression is not).
- [ ] `npm run build` — succeeds, produces `dist/`, PWA precache reported.
- [ ] Manifest version in package.json reflects the intended release.
- [ ] `dist/index.html` links the manifest + favicon.
- [ ] `dist/sw.js` and `dist/manifest.webmanifest` exist.

## Netlify configuration

- [ ] netlify.toml at repo root; publish dir set to `dist`; build command `npm run build`.
- [ ] Force HTTPS is on in the Netlify site settings.
- [ ] Custom domain configured (if applicable) with valid TLS.
- [ ] Environment variables: none required for V1 (no server, no keys).
- [ ] Deploy notifications wired to the reviewer's channel.

## Deploy to staging

- [ ] Push branch → Netlify deploy preview builds green.
- [ ] Open the deploy preview URL.
- [ ] Boot: page loads within 3 seconds on a mid-tier connection.
- [ ] No console errors visible in DevTools during boot (a single `[pwa] App is ready to work offline.` info line is expected).
- [ ] IndexedDB `personal-os` present at `DB_VERSION = 2` with the 8 v1 stores + 6 frozen v2 stores. No pre-seeded data.

## Smoke test — every shipped route

- [ ] **Today** — Greeting, Promise anchor (Day N of M), Self-Trust line, Daily Flow Summary line (when a Life Program is enabled), Intervention Queue (per phase), program ambient widget (when enabled), Current Focus card, anchor-grouped Routine, Reflect. invitation (evening) all render without console errors.
- [ ] Tap a routine block → glyph flips to done; Self-Trust re-derives.
- [ ] Tap "Edit routine." → block editor with anchor picker; add block with anchor = Morning; save; back on Today with the new block grouped under Morning.
- [ ] **Chain** — every day of the arc rendered with correct kept / broken / awaiting glyph; past-day tap opens read-only Reflection; today's tap opens the Question variant (when in the ritual window).
- [ ] **History** — every Promise listed with attempt number, dates, outcome text.
- [ ] Tap a Promise → Promise Detail loads.
- [ ] **Settings** — About shows app name + version; Life Programs toggle enables/disables Smoking; "Open Daily Flow Analytics." navigates to the analytics screen; "Erase all data." held-disabled 600 ms then confirms.
- [ ] **Daily Flow Analytics** — supportive summary + 30-day timeline newest-first; empty state renders "Your Daily Flow history will appear here." when no ack rows exist.

## Smoke test — Smoking program

- [ ] Enable Smoking in Settings → return to Today → ambient widget renders with quit-time CTA.
- [ ] Tap the CTA → stamp quit time → chamber, peak-withdrawal banner, hurdles chain populate.
- [ ] Craving SOS opens the 3-minute physiological sigh overlay.
- [ ] Log a slip → confirm slip modal closes; streak unchanged.
- [ ] Reflection modal in the ritual window declares kept / broken; Chain reflects the verdict.

## Smoke test — Daily Flow behaviour

- [ ] Morning: exactly one morning intervention fires (tier-matched to `ackRate`).
- [ ] Midday / Evening: exactly one intervention per phase.
- [ ] Night: one intervention when today's declaration is absent; hidden after declaration.
- [ ] Tap Done → card disappears; Daily Flow Summary updates immediately.
- [ ] Tap Dismiss → card disappears; ack row records `dismissed[]` alongside `acked[]`.
- [ ] Reload → acked / dismissed cards stay hidden.
- [ ] Next calendar day (or shifted-back ack rows) → morning intervention returns.
- [ ] Disable Smoking → Intervention Queue empty; Daily Flow Summary hidden; ambient widget hidden.
- [ ] Re-enable Smoking → intervention returns; ambient widget returns.

## PWA install + update

- [ ] Chrome/Edge → install prompt available; installed app opens in standalone.
- [ ] iOS Safari → Add to Home Screen appears. (Known: apple-touch-icon PNG is deferred; icon may be a browser default.)
- [ ] Offline: turn off the network, reload the installed app — Today still loads, all reads/writes still work.
- [ ] Deploy a trivial follow-up commit → confirm the Update prompt appears in a previously-loaded tab within ~30 seconds of the SW picking up the change; clicking Update reloads to the new version.

## Promote to production

- [ ] Merge to main → Netlify deploys production.
- [ ] Run the smoke test again against the production URL (five minutes).
- [ ] Announce deploy to the first-cohort channel.

## Post-deploy

- [ ] Watch for user-reported issues over the first 24h.
- [ ] Confirm the SW file (`/sw.js`) is served with `Cache-Control: max-age=0, must-revalidate` (verify with a browser network tab).
- [ ] Confirm hashed assets (`/assets/*`) are served with `Cache-Control: public, max-age=31536000, immutable`.
