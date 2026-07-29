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

// Update flow: waits for the client to send SKIP_WAITING before activating.
// See registerSW.ts for the prompt UI hook point.
self.addEventListener('message', (event) => {
  if (event.data && (event.data as { type?: string }).type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
