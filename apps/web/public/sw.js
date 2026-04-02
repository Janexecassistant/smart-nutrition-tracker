/**
 * Smart Nutrition Tracker — Service Worker
 *
 * Strategy:
 * - App shell (HTML, CSS, JS) → Cache-first, refresh in background
 * - API calls → Network-first, fall back to cache for offline reads
 * - Images → Cache-first with long TTL
 */

const CACHE_NAME = "snt-v2";
const APP_SHELL = ["/", "/manifest.json", "/offline.html"];

// ── Install: pre-cache app shell ─────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: route-based caching strategy ──────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith("/api"))
    return;

  // API calls → network-first
  if (url.pathname.startsWith("/api") || url.hostname !== self.location.hostname) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets and pages → cache-first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback — return the offline page for navigation requests
    const accept = request.headers.get("Accept") || "";
    if (accept.includes("text/html")) {
      return caches.match("/offline.html");
    }
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
