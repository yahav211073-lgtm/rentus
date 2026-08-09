"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * הוקים לקריאת מצב שחי בדפדפן (גלילה, אחסון מקומי).
 *
 * כולם בנויים על useSyncExternalStore ולא על useEffect + setState.
 * ההבדל הוא לא סגנוני:
 *
 *   · useEffect + setState מרנדר פעם אחת עם ערך שגוי, ואז שוב עם
 *     הנכון. זה רינדור מדורג — מהבהב, ופוגע בביצועים כשזה קורה
 *     בכמה רכיבים במקביל.
 *
 *   · useSyncExternalStore נותן ל-React את הערך הנכון כבר בקריאה
 *     הראשונה בלקוח, ומספק snapshot נפרד לשרת. זה בדיוק הפרימיטיב
 *     שנועד לסנכרון עם מצב חיצוני.
 *
 * getServerSnapshot חייב להחזיר ערך יציב — לכן הוא תמיד מחזיר את
 * ברירת המחדל, ולא מנסה לנחש מה יש בדפדפן.
 */

/* ============================================================================
   גלילה
   ============================================================================ */

const scrollListeners = new Set<() => void>();
let scrollAttached = false;

function subscribeScroll(onChange: () => void) {
  scrollListeners.add(onChange);

  if (!scrollAttached) {
    scrollAttached = true;
    // מאזין יחיד לכל הרכיבים, במקום אחד לכל שימוש בהוק
    window.addEventListener(
      "scroll",
      () => scrollListeners.forEach((fn) => fn()),
      { passive: true },
    );
  }

  return () => {
    scrollListeners.delete(onChange);
  };
}

/**
 * האם המשתמש גלל מעבר לסף. משמש את הניווט הדביק.
 * מחזיר boolean ולא מספר בכוונה — כך ה-snapshot משתנה רק כשהתשובה
 * משתנה, ולא בכל פיקסל של גלילה.
 */
export function useScrolledPast(threshold = 24): boolean {
  const getSnapshot = useCallback(
    () => window.scrollY > threshold,
    [threshold],
  );

  // בשרת אין גלילה. הערך ההתחלתי הוא תמיד "בראש העמוד".
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribeScroll, getSnapshot, getServerSnapshot);
}

/* ============================================================================
   אחסון מקומי
   ============================================================================ */

/**
 * מנוי לשינויים באחסון.
 *
 * אירוע storage הילידי נורה רק בלשוניות *אחרות*, ולכן יש גם אירוע
 * מותאם שהכותבים שלנו יורים. בלי זה, כתיבה ורענון באותה לשונית
 * לא היו מעדכנים את הרכיב.
 */
const STORAGE_EVENT = "index:storage";

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
}

/** מודיע לרכיבים שהאחסון השתנה בלשונית הנוכחית. */
export function notifyStorageChange() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/**
 * קריאת ערך מ-localStorage / sessionStorage.
 *
 * ה-snapshot חייב להיות יציב בין קריאות, אחרת React נכנס ללולאה
 * אינסופית — ‎JSON.parse‎ יוצר אובייקט חדש בכל פעם. לכן מוחזרת
 * המחרוזת הגולמית, והפענוח נעשה ב-useMemo מחוצה לה.
 */
function useRawStoredValue(
  storage: "local" | "session",
  key: string,
): string | null {
  const getSnapshot = useCallback(() => {
    try {
      const store = storage === "local" ? localStorage : sessionStorage;
      return store.getItem(key);
    } catch {
      return null;   // אחסון חסום (מצב פרטי / הגדרות דפדפן)
    }
  }, [storage, key]);

  const getServerSnapshot = useCallback(() => null, []);

  return useSyncExternalStore(subscribeStorage, getSnapshot, getServerSnapshot);
}

/**
 * ערך JSON מהאחסון, עם ברירת מחדל אם אין או אם הפענוח נכשל.
 *
 * הערך מוחזר כפי שהוא ולא ממוזג עם ברירת המחדל — מיזוג היה שובר
 * מערכים (spread של מערך לתוך אובייקט נותן אובייקט). מי שצריך
 * מיזוג עם ברירות מחדל עושה אותו אצלו, שם ידוע מה הצורה.
 *
 * הערך חייב להיות יציב בין רינדורים כדי לא להפיל את React ללולאה,
 * ולכן ה-useMemo תלוי במחרוזת הגולמית בלבד.
 */
export function useStoredJson<T>(
  storage: "local" | "session",
  key: string,
  fallback: T,
): T {
  const raw = useRawStoredValue(storage, key);

  return useMemo(() => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
}

/** האם קיים ערך כלשהו במפתח. לשימושי דגל פשוטים. */
export function useStoredFlag(storage: "local" | "session", key: string): boolean {
  return useRawStoredValue(storage, key) !== null;
}

/** כתיבה לאחסון + הודעה לרכיבים המנויים. */
export function writeStored(
  storage: "local" | "session",
  key: string,
  value: unknown | null,
) {
  try {
    const store = storage === "local" ? localStorage : sessionStorage;
    if (value === null) store.removeItem(key);
    else store.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    notifyStorageChange();
  } catch {
    // אחסון חסום — ההעדפה פשוט לא נשמרת בין ביקורים
  }
}
