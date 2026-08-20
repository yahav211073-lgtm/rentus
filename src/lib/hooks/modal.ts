"use client";

import { useEffect } from "react";

/**
 * מסמן ל-CSS ש"פתוח עכשיו חלון מודאלי", ונועל את גלילת הרקע.
 *
 * מונה ולא דגל בוליאני: אפשר שיהיו שני מודאלים פתוחים זה מעל זה
 * (מגירת מסננים ומעליה תפריט), וסגירת הפנימי לא אמורה לשחרר את
 * הנעילה של החיצוני. הדגל יורד רק כשהמונה חוזר לאפס.
 *
 * ה-data-attribute הוא כל הממשק: globals.css מסתיר דרכו את האלמנטים
 * הצפים (data-floating-ui), בלי שאף רכיב מודאלי יכיר אותם.
 */
let openCount = 0;

export function useModalLock(open: boolean) {
  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    openCount += 1;
    root.dataset.modal = "open";
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      openCount -= 1;
      if (openCount <= 0) {
        openCount = 0;
        delete root.dataset.modal;
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [open]);
}
