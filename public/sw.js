const CACHE = "battery-v-app-v2";

// Workbox injecte ici la liste des assets au moment du build (npm run build)
// En dev (si __WB_MANIFEST absent), on replie sur un tableau vide
const CORE_ASSETS = self.__WB_MANIFEST || [];

// Assets optionnels : icônes — on tente, mais on ne bloque pas si absent
const OPTIONAL_ASSETS = ["icons/icon-192.png", "icons/batlife-512.png"];

// ── Installation : core en priorité, optionnels en best-effort ───────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      await Promise.allSettled(
        OPTIONAL_ASSETS.map(url =>
          cache.add(url).catch(() => {
            console.warn("[SW] Asset optionnel non mis en cache :", url);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activation : suppression des anciens caches ───────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : cache-first, fallback réseau ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        return new Response("", { status: 408, statusText: "Offline" });
      });
    })
  );
});

// ── Messages depuis la page (planification de notification) ──────────────────
let scheduled = [];

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "SCHEDULE_NOTIF") {
    const fireAt = Date.now() + data.delayMs;
    scheduled = scheduled.filter(n => n.tag !== data.tag);
    scheduled.push({ fireAt, title: data.title, body: data.body, tag: data.tag });
    startKeepAlive();
  }
  if (data.type === "CANCEL_NOTIF") {
    scheduled = scheduled.filter(n => n.tag !== data.tag);
  }
});

// ── Keepalive : vérifie les notifs planifiées toutes les 30 s ─────────────────
let keepAliveTimer = null;

function startKeepAlive() {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(checkScheduled, 30_000);
}

function checkScheduled() {
  const now = Date.now();
  const remaining = [];
  for (const notif of scheduled) {
    if (now >= notif.fireAt) {
      self.registration.showNotification(notif.title, {
        body: notif.body,
        icon: "icons/icon-192.png",
        badge: "icons/icon-192.png",
        tag: notif.tag,
        renotify: true,
        vibrate: [200, 100, 200],
      });
    } else {
      remaining.push(notif);
    }
  }
  scheduled = remaining;
  if (scheduled.length === 0) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// ── Clic sur notification → ouvre / focus l'appli ────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes("index.html") || c.url.endsWith("/"));
      if (existing) return existing.focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
