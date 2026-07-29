# ADR 0005 — PWA via `vite-plugin-pwa` in `injectManifest` mode

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Personal OS must be installable, must load offline after first visit, and must offer explicit control over update behavior — a personal OS that silently reloads mid-focus session would break its own value proposition. The plugin choice must not bury the service worker behind generated glue.

## Decision

- Use `vite-plugin-pwa` in `strategies: 'injectManifest'` mode.
- The service worker source lives at `src/pwa/sw.ts` — we own it. The plugin only injects the precache manifest at build time.
- Runtime strategy:
  - Vite-emitted assets are precached (from `self.__WB_MANIFEST`).
  - Navigation requests fall back to `/index.html` from the precache (SPA offline routing).
  - Cross-origin assets use `StaleWhileRevalidate`.
- Update flow uses `registerType: 'prompt'`. A calm in-app "New version — reload?" dialog will be added when a feature milestone justifies it. Auto-reload is explicitly avoided.
- Dev mode has SW disabled (`devOptions.enabled: false`) so HMR is not interfered with; production build enables it.

## Consequences

- Offline-first works from first paint after initial load.
- Cache strategy is inspectable and editable — no black-box generated SW code.
- Netlify serves `/sw.js` with `Cache-Control: max-age=0, must-revalidate` and `Service-Worker-Allowed: /` so updates always ship (see `netlify.toml`).
- iOS Safari (non-installed PWAs) still evicts IndexedDB after ~7 days — this ADR does not solve that; ADR 0003 documents it.

## Alternatives considered

- **`generateSW` mode**: rejected — Workbox generates the SW; customising cache behavior requires configuration gymnastics. `injectManifest` is only marginally more setup and gives full control.
- **Bare Workbox without the Vite plugin**: rejected — we would rebuild the precache-manifest generation ourselves.
- **No PWA / plain SPA**: rejected — offline-first is a locked product requirement.
