# V1 Production Deployment Checklist

*Follow top-to-bottom. Every item must be confirmed before the deploy is promoted from staging to production.*

## Pre-deploy — local verification

- [ ] Working tree clean.
- [ ] `npm install` finishes without EBADENGINE or ERESOLVE errors.
- [ ] `npm run typecheck` — no output.
- [ ] `npm run lint` — no output.
- [ ] `npm test` — 189 tests / 17 files pass (baseline count; growth is fine, regression is not).
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
- [ ] No console errors visible in DevTools during boot.
- [ ] Bootstrap example data appears (first-visit; DevTools → Application → IndexedDB → `personal-os` present with mission/routine/dayLog rows).

## Smoke test — all four routes

- [ ] **Today** — Mission Summary, Current Focus, Progress, End-of-day reflection all render.
- [ ] Click Start → button set flips to Pause + Complete. Click Complete → progress increments and a new PromiseEvent lands in DevTools (Application → IndexedDB → promiseEvents).
- [ ] Mission Summary → tap "Create your own contract" → CreateMissionFlow appears → complete the two-step flow → bootstrap purged, real mission active.
- [ ] Auto-guide → Routine Builder appears since the new mission has no routine → build a 2-block routine → save → back on Today with the new routine driving CurrentFocus.
- [ ] **Knowledge** — create a note, edit it, soft-delete, undo within 6s, soft-delete again, permanently delete via Settings → Trash.
- [ ] **Analytics** — Self-Trust score visible; consistency counts reflect the events written during the smoke test; Knowledge stats show note counts.
- [ ] Analytics → open Weekly Review, save answers, verify status pill flips to Submitted.
- [ ] **Settings** — Backup → Export downloads a JSON file with `personal-os-backup-<date>` filename; Restore → pick the exported file, preview shows counts, cancel; Reset → dismiss the danger-zone confirmation (do not actually reset in staging without a fresh IndexedDB).

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
