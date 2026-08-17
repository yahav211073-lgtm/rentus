"use client";

import { useEffect } from "react";

/**
 * רישום ה-service worker. רכיב לקוח נפרד ולא סקריפט מוטבע —
 * navigator.serviceWorker לא קיים בזמן רינדור שרת, וניסיון לגעת בו
 * שם היה זורק. useEffect מבטיח שזה רץ רק בדפדפן, אחרי mount.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // רישום שנכשל לא אמור להפיל את האתר — PWA היא שיפור, לא דרישה
    });
  }, []);

  return null;
}
