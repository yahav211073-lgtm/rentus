"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { Testimonial } from "@/types/domain";

const AUTO_MS = 6000;

/**
 * קרוסלת הביקורות.
 *
 * גלילה עם scroll-snap ולא transform: כך גרירה במגע עובדת בחינם,
 * וניווט מקלדת מזיז את התצוגה לכרטיס שקיבל פוקוס. הנקודות למטה
 * נגזרות ממיקום הגלילה בפועל ולא ממונה נפרד — מונה נפרד מתנתק
 * מהמציאות ברגע שהמשתמש גורר ידנית.
 *
 * ההתקדמות האוטומטית נעצרת ב-hover, בפוקוס ובתנועה מופחתת.
 */
export function ReviewsCarousel({ reviews }: { reviews: Testimonial[] }) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rc]");
    const w = (card?.offsetWidth ?? 300) + 16;
    setActive(Math.round(Math.abs(el.scrollLeft) / w));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [sync]);

  const step = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rc]");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 16), behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  useEffect(() => {
    if (paused || reduced || reviews.length <= 4) return;
    const id = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (Math.abs(el.scrollLeft) >= max - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else step(-1);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, reduced, reviews.length, step]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [direction:ltr] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => (
          <div
            key={r.id}
            data-rc
            className="w-[86%] shrink-0 snap-start sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)] [direction:rtl]"
          >
            <ReviewCard review={r} />
          </div>
        ))}
      </div>

      {reviews.length > 4 && (
        <>
          <Arrow side="start" onClick={() => step(1)} />
          <Arrow side="end" onClick={() => step(-1)} />

          <div className="mt-5 flex items-center justify-center gap-2">
            {reviews.map((r, i) => (
              <span
                key={r.id}
                aria-hidden="true"
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? "w-6 bg-brand-600" : "w-2 bg-ink-300"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewCard({ review: r }: { review: Testimonial }) {
  /* שתי אותיות ולא אחת: "דני לוי" → "דנ". ראשי תיבות של שם ומשפחה
     היו נותנים "דל", שנקרא כמילה ולא כאווטאר. */
  const initials = r.authorName.trim().replace(/\s+/g, "").slice(0, 2);

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_2px_14px_rgba(12,29,64,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-end">
          <span className="block truncate text-base font-bold text-ink-900">{r.authorName}</span>
          {r.authorRole && (
            <span className="mt-0.5 block truncate text-xs text-ink-400">{r.authorRole}</span>
          )}
        </span>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
          {initials}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {r.rating != null && <Stars value={r.rating} />}
        {r.createdAt && <span className="text-xs text-ink-400">{timeAgo(r.createdAt)}</span>}
      </div>

      <p className="mt-3 line-clamp-4 flex-1 border-t border-ink-100 pt-3 text-sm leading-relaxed text-ink-600">
        {r.quote}
      </p>

      {r.categoryName && (
        <span className="mx-auto mt-4 inline-flex rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
          {r.categoryName}
        </span>
      )}
    </article>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`דירוג ${value} מתוך 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true"
          className={`h-3.5 w-3.5 ${i < Math.round(value) ? "fill-gold-400" : "fill-ink-200"}`}>
          <path d="M12 2.4l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.25l-5.81 3.05 1.11-6.47L2.6 9.25l6.5-.95L12 2.4z" />
        </svg>
      ))}
    </span>
  );
}

/* "לפני יומיים" ולא תאריך: בכרטיס ביקורת מה שרלוונטי הוא הטריות,
   לא היום המדויק. Intl.RelativeTimeFormat נותן את הצורות העבריות
   הנכונות כולל "יומיים" — צורת הזוגי שאי אפשר לקבל מחיבור מחרוזות. */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.round((then - Date.now()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("he", { numeric: "auto" });
  if (Math.abs(days) < 1) return "היום";
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
  return rtf.format(Math.round(days / 365), "year");
}

function Arrow({ side, onClick }: { side: "start" | "end"; onClick: () => void }) {
  const Icon = side === "start" ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "start" ? "הקודם" : "הבא"}
      style={side === "start" ? { insetInlineStart: "-18px" } : { insetInlineEnd: "-18px" }}
      className="absolute top-[42%] z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-600 shadow-[0_4px_16px_rgba(12,29,64,0.16)] transition-colors hover:text-brand-700 lg:grid"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
