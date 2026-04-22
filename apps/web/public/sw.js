/**
 * Smart Nutrition Tracker — Service Worker
 *
 * Strategy:
 * - Hashed Next.js chunks (/_next/static/*) → cache-first (immutable, safe to keep)
 * - Everything else same-origin (HTML pages, manifest, RSC payloads) → network-first
 *   with cache fallback. This guarantees new deployments actually ship instead of
 *   users getting pinned to an old HTML shell that references gone-away chunks.
 * - API calls (Railway API, cross-origin /api) → network-first
 * - Images under /icons/ → cache-first with long TTL
 *
 * IMPORTANT: bump CACHE_NAME on every SW strategy change so the activate step
 * drops stale caches for existing users. The previous `snt-v2` cache was
 * pinning returning users to an older deployment that 404'd on /profile and
 * bounced them back to /onboarding forever.
 */

const CACHE_NAME = "snt-v3";
const APP_SHELL = ["/manifest.json", "/offline.html"];

// ── Install: pre-cache minimal app shell ─────────────────────────
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

  // Skip non-GET requests entirely
  if (request.method !== "GET") return;

  // Cross-origin requests: only intercept API calls under /api so offline
  // reads still work. Let everything else (fonts, CDNs, analytics) hit
  // the network directly.
  if (url.origin !== self.location.origin) {
    if (url.pathname.startsWith("/api")) {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  // Same-origin /api/* → network-first (fresh data, fall back to cache offline)
  if (url.pathname.startsWith("/api")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Immutable hashed assets → cache-first (filename hash changes on every
  // meaningful change, so stale cache can never serve mismatched content)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App icons → cache-first (rarely change, fine to keep long-term)
  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (HTML pages, RSC payloads, manifest) → network-first
  event.respondWith(networkFirst(request));
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
    if (cached) return cached;

    // Offline fallback for HTML navigations
    const accept = request.headers.get("Accept") || "";
    if (accept.includes("text/html")) {
      const offline = await caches.match("/offline.html");
      if (offline) return offline;
    }

    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
