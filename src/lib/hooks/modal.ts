"use client";

import { useEffect, useRef, type RefObject } from "react";

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

/**
 * לוכד פוקוס בתוך dialog ומחזיר אותו ל-trigger בסגירה.
 *
 * role="dialog" לבדו לא מנהל פוקוס. בלי המלכודת, Tab ממשיך אל
 * הקישורים שמאחורי המגירה למרות שהם מכוסים, ובסגירה המשתמש נשאר
 * בנקודה לא צפויה במסמך. ה-hook משותף לכל ה-dialogs האדפטיביים כדי
 * שההתנהגות לא תתפצל בין התפריט, המסננים, האדמין והפרסומות.
 */
export function useDialogFocus(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onDismiss?: () => void,
) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!open) return;

    const container = containerRef.current;
    if (!container) return;

    const previous = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const selector = [
      "a[href]", "button:not([disabled])", "input:not([disabled])",
      "select:not([disabled])", "textarea:not([disabled])", "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(selector))
      .filter((el) => !el.hidden && el.getAttribute("aria-hidden") !== "true");

    const first = container.querySelector<HTMLElement>("[data-dialog-autofocus]")
      ?? focusables()[0]
      ?? container;
    first.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onDismissRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onDismissRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus({ preventScroll: true });
    };
  }, [containerRef, open]);
}
