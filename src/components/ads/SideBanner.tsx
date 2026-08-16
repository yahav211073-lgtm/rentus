"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { Banner } from "@/types/domain";
import { detectDevice, isWithinSchedule, matchesTargeting } from "@/lib/ads/targeting";
import { useStoredFlag, writeStored } from "@/lib/hooks/browser-state";
import { cn, pickWeighted } from "@/lib/utils";

/**
 * באנר צדדי צף.
 *
 * מוצג רק ממסכים רחבים מאוד (‎≥1600px‎), בשוליים שממילא ריקים.
 * זו נקודה עקרונית: פרסום שדוחף את התוכן או מכסה אותו הוא הדבר
 * שהופך אתר לזול. אם אין מקום — הבאנר פשוט לא מוצג.
 *
 * · חשיפה נספרת פעם אחת, וברגע שהבאנר באמת נראה (IntersectionObserver),
 *   לא ברגע שהוא נוצר ב-DOM. חשיפה שלא נראתה היא לא חשיפה, וספירה
 *   שלה היא בדיוק מה שהופך דוחות CTR לחסרי ערך.
 *
 * · הסגירה נזכרת לכל הסשן. גולש שסגר לא צריך לסגור שוב בכל עמוד.
 *
 * · הבאנר מסומן כ"פרסומת" בטקסט גלוי — דרישה של הנחיות פרסום
 *   וגם של אמון בסיסי.
 */

const DISMISS_KEY = "index:side-banners-dismissed";

interface Props {
  banners: Banner[];
  side: "start" | "end";
  isLoggedIn?: boolean;
  isBusinessOwner?: boolean;
  categorySlugs?: string[];
  citySlug?: string;
}

export function SideBanner({
  banners, side, isLoggedIn = false, isBusinessOwner = false, categorySlugs, citySlug,
}: Props) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  // הסגירה נקראת מ-sessionStorage דרך useSyncExternalStore, כך
  // שהבאנר לא מהבהב לרגע אצל מי שכבר סגר אותו.
  const dismissed = useStoredFlag("session", DISMISS_KEY);
  const [hasRoom, setHasRoom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  // מקום פנוי בשוליים. 1600px = 1480 מיכל + 2×60 שוליים.
  // כאן setState בתוך effect הוא בסדר: המדידה חייבת לקרות אחרי
  // הפריסה, וממילא הבאנר נכנס עם השהיה של 0.8 שניות.
  useEffect(() => {
    const check = () => setHasRoom(window.innerWidth >= 1600);
    const frame = requestAnimationFrame(check);
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", check);
    };
  }, []);

  const banner = useMemo(() => {
    if (typeof window === "undefined") return null;
    const ctx = {
      path: pathname,
      device: detectDevice(window.innerWidth),
      isLoggedIn, isBusinessOwner, categorySlugs, citySlug,
    };

    const eligible = banners
      .filter((b) => b.isActive && b.placementKey === `side_${side}`)
      .filter((b) => isWithinSchedule(b))
      .filter((b) => matchesTargeting(b.targeting, ctx));

    if (eligible.length === 0) return null;

    // העדיפות הגבוהה ביותר קודמת; בתוכה — בחירה משוקללת אקראית
    const topPriority = Math.max(...eligible.map((b) => b.priority));
    return pickWeighted(eligible.filter((b) => b.priority === topPriority));
  }, [banners, side, pathname, isLoggedIn, isBusinessOwner, categorySlugs, citySlug]);

  // ספירת חשיפה רק כשהבאנר באמת נראה
  useEffect(() => {
    const el = ref.current;
    if (!el || !banner || trackedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !trackedRef.current) {
            trackedRef.current = true;
            void fetch("/api/ads/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bannerId: banner.id, type: "impression", path: pathname }),
              keepalive: true,
            }).catch(() => { /* התעלמות */ });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [banner, pathname]);

  function dismiss() {
    // הכתיבה מפיצה אירוע שמעדכן את כל הבאנרים בעמוד בבת אחת
    writeStored("session", DISMISS_KEY, "1");
  }

  function trackClick() {
    if (!banner) return;
    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId: banner.id, type: "click", path: pathname }),
      keepalive: true,
    }).catch(() => { /* התעלמות */ });
  }

  // באנר בלי קריאייטיב אינו באנר. מסגרת ריקה בשולי המסך היא בדיוק
  // מה שגורם לאתר להיראות לא גמור, ולכן במקרה כזה לא מוצג כלום.
  if (!banner || !banner.assetUrl || dismissed || !hasRoom) return null;

  const content =
    banner.kind === "video" ? (
      <video
        src={banner.assetUrl}
        autoPlay muted loop playsInline
        aria-label={banner.alt}
        className="h-full w-full object-cover"
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={banner.assetUrl} alt={banner.alt} className="h-full w-full object-cover" loading="lazy" />
    );

  return (
    <AnimatePresence>
      <motion.aside
        ref={ref}
        initial={{ opacity: 0, x: reduced ? 0 : side === "start" ? 40 : -40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        aria-label="אזור פרסום"
        className="fixed top-1/2 z-40 hidden -translate-y-1/2 [@media(min-width:1600px)]:block"
        style={side === "start" ? { insetInlineStart: "18px" } : { insetInlineEnd: "18px" }}
      >
        <div className="relative w-[160px] overflow-hidden rounded-lg border border-ink-200 bg-white shadow-[0_16px_40px_-14px_rgba(11,59,117,0.28)]">
          <button
            type="button"
            onClick={dismiss}
            aria-label="סגירת הפרסומת"
            className="absolute top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-white/85 text-ink-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-ink-800"
            style={{ insetInlineEnd: "0.375rem" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="aspect-[160/500]">
            {banner.href ? (
              <a
                href={banner.href}
                target={banner.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer sponsored"
                onClick={trackClick}
                className="block h-full w-full"
              >
                {content}
              </a>
            ) : content}
          </div>

          <p className={cn(
            "border-t border-ink-100 bg-ink-50 py-1 text-center text-2xs font-medium text-ink-400",
          )}>
            פרסומת
          </p>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
