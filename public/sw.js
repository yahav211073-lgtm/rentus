/**
 * Service worker בסיסי — לא Workbox מלא, מספיק כדי ש-Lighthouse
 * יזהה את האתר כ-installable ושתהיה חוויית offline עדינה.
 *
 * לא שומרים בקאש עמודי HTML של האתר עצמו (הם דינמיים ותלויי-סשן) —
 * רק את מעטפת ה-app shell (אייקונים, manifest) ואת עמוד ה-offline.
 * ניווט שנכשל ברשת נופל לעמוד ה-offline, לא נשאר תקוע.
 */

const CACHE_NAME = "rentus-shell-v1";
const SHELL_ASSETS = ["/offline.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // ניווט בין עמודים — רשת קודם, ונפילה לעמוד offline רק אם הרשת נכשלה לגמרי
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html")),
    );
    return;
  }

  // נכסי מעטפת סטטיים — קאש קודם, רשת כגיבוי
  if (SHELL_ASSETS.some((asset) => request.url.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
  }
});
