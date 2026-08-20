"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { CompanyListCard } from "@/components/business/CompanyListCard";
import type { BusinessCard } from "@/types/domain";

const AUTO_MS = 5000;

/**
 * רשת עסקים שהופכת לקרוסלה מעל ארבעה פריטים.
 *
 * עד ארבעה — רשת סטטית של ארבע עמודות. אין סיבה להוסיף חצים ותזמון
 * למשהו שנכנס במלואו למסך; קרוסלה עם ארבעה פריטים מתוך ארבעה רק
 * מסתירה תוכן שכבר היה גלוי.
 *
 * מעל ארבעה — אותם ארבעה בשורה, וחצים שמעבירים לקבוצה הבאה עד שכל
 * הכרטיסים נראו. זו הבקשה המפורשת: שורה נקייה של ארבעה, לא רשת
 * שממשיכה לגדול למטה.
 *
 * מעל ארבעה — גלילה אופקית עם snap, חצים, והתקדמות אוטומטית.
 * הגלילה היא scroll-snap אמיתי ולא transform: כך גם גרירה במגע
 * עובדת בחינם, וגם ניווט מקלדת מזיז את התצוגה לפריט שקיבל פוקוס.
 *
 * ההתקדמות האוטומטית נעצרת בכל סימן לכך שהמשתמש מעורב — hover,
 * פוקוס מקלדת, או גלילה ידנית. קרוסלה שממשיכה לזוז בזמן שמישהו
 * קורא כרטיס היא הסיבה שאנשים שונאים קרוסלות.
 *
 * ב-prefers-reduced-motion אין התקדמות אוטומטית כלל והחצים קופצים
 * בלי אנימציה. תנועה אוטומטית היא בדיוק מה שההעדפה הזו מבקשת למנוע.
 */
export function BusinessCarousel({
  businesses,
  className,
  ariaLabel = "רשימת חברות",
}: {
  businesses: BusinessCard[];
  className?: string;
  ariaLabel?: string;
}) {
  const reduced = useReducedMotion();
  const isCarousel = businesses.length > 4;

  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* RTL: scrollLeft שלילי בדפדפנים מודרניים. Math.abs מנרמל את זה
     כך שאותו חישוב עובד בשני הכיוונים. */
  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setAtStart(pos <= 8);
    setAtEnd(pos >= max - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !isCarousel) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [isCarousel, sync]);

  const step = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = (card?.offsetWidth ?? 340) + 16;
    el.scrollBy({ left: dir * amount, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  useEffect(() => {
    if (!isCarousel || paused || reduced) return;
    const id = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      // הגיע לסוף — חוזר להתחלה, כלומר לולאה ולא עצירה.
      if (Math.abs(el.scrollLeft) >= max - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        step(-1);
      }
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [isCarousel, paused, reduced, step]);

  if (!isCarousel) {
    return (
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className ?? ""}`}>
        {businesses.map((b) => <CompanyListCard key={b.id} business={b} />)}
      </div>
    );
  }

  return (
    <div
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [direction:rtl] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {businesses.map((b) => (
          <div
            key={b.id}
            data-card
            className="w-[72%] shrink-0 snap-start sm:w-[calc(47%-6px)] lg:w-[calc(31%-8px)] xl:w-[calc(23%-9px)]"
          >
            <CompanyListCard business={b} />
          </div>
        ))}
      </div>

      <Arrow side="start" onClick={() => step(1)} disabled={atStart} />
      <Arrow side="end" onClick={() => step(-1)} disabled={atEnd} />
    </div>
  );
}

/**
 * חץ ניווט. ממוקם ב-inset-inline כדי שיתהפך נכון ב-RTL בלי לוגיקה
 * נפרדת, ומוסתר מקורא מסך כשהוא בקצה — כפתור מושבת שמכריז על עצמו
 * הוא רעש.
 */
function Arrow({
  side, onClick, disabled,
}: { side: "start" | "end"; onClick: () => void; disabled: boolean }) {
  const Icon = side === "start" ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "start" ? "הקודם" : "הבא"}
      style={side === "start" ? { insetInlineStart: "8px" } : { insetInlineEnd: "8px" }}
      className="absolute top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-brand-800 text-white shadow-lg transition-[opacity,background-color,transform] duration-200 hover:bg-brand-700 active:scale-95 disabled:pointer-events-none disabled:opacity-25 sm:h-10 sm:w-10"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
