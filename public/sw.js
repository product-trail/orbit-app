// Minimal service worker for PWA installability (spec: Android "Add to Home
// Screen" requires a registered service worker with a fetch handler).
// Intentionally does no offline caching yet — the app relies on live,
// authenticated data from Supabase, so aggressively caching responses would
// risk serving stale/private data. This just satisfies the install
// criteria and passes network requests straight through.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle the request normally.
});
