/// <reference lib="webworker" />
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// Precache all Vite-emitted assets. Manifest is injected by vite-plugin-pwa at build time.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback — any navigation request that isn't a precached
// asset returns the app shell (index.html) so client-side routes work offline.
// createHandlerBoundToURL resolves '/index.html' to its actual revisioned
// precache key via the internal PrecacheController, and reads from the
// origin-suffixed precache Workbox writes at install time.
const navigationHandler = new NavigationRoute(
  createHandlerBoundToURL('/index.html'),
  {
    denylist: [/^\/api\//, /\.[a-z0-9]{6,}\./i],
  },
);
registerRoute(navigationHandler);

// Runtime cache for cross-origin assets (icons, fonts if ever added).
registerRoute(
  ({ url }) => url.origin !== self.location.origin,
  new StaleWhileRevalidate({ cacheName: 'external-assets' }),
);

// v1.1.x hotfix — Automatic update activation. Pairs with
// `registerType: 'autoUpdate'` in vite.config.ts. The prior SKIP_WAITING
// message handler required a user click on UpdatePrompt to fire; that path
// left pre-Slice-G clients stuck on the old bundle because the click never
// happened. The new SW now skips waiting on install and claims all clients
// on activate so the module-independent build is served without user action.
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
