"use client";

import { useEffect } from "react";

/**
 * מרים את --spacing-bottom-inset כל עוד העמוד מציג סרגל פעולה קבוע
 * משלו בתחתית המסך.
 *
 * כל האלמנטים הצפים באתר (כפתור הנגישות, גלולת הסינון) נגזרים
 * מהטוקן הזה, והם מרונדרים ב-layout השורשי — כלומר מחוץ לעץ של
 * העמוד. לכן העמוד לא יכול פשוט להגדיר משתנה על עצמו: הוא כותב
 * אותו על <html> ומנקה בפירוק. זה הרכיב היחיד שנוגע בטוקן.
 */
export function BottomInset({ extra }: { extra: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--spacing-bottom-inset",
      `calc(var(--spacing-tabbar) + ${extra})`,
    );
    return () => {
      root.style.removeProperty("--spacing-bottom-inset");
    };
  }, [extra]);

  return null;
}
