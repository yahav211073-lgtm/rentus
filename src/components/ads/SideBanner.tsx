"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Banner } from "@/types/domain";
import { detectDevice, isWithinSchedule, matchesTargeting } from "@/lib/ads/targeting";
import { pickWeighted } from "@/lib/utils";

/**
 * עמודת שוליים קבועה.
 *
 * לא באנר צף שמדביק את עצמו על התוכן ואפשר לסגור — זה בדיוק מה
 * שגרם לו להרגיש כמו פרסומת פולשנית. זו עמודת שוליים תמידית, צמודה
 * לקצה האמיתי של המסך, בלי מסגרת/צל/כפתור סגירה — חלק קבוע מהעמוד,
 * לא חלון קופץ. היא עדיין `fixed` מבחינה טכנית (כדי לא לגעת ברוחב
 * התוכן בכל עמוד באתר), אבל מוצגת רק כשיש שוליים אמיתיים ופנויים.
 *
 * · חשיפה נספרת פעם אחת, וברגע שהבאנר באמת נראה (IntersectionObserver),
 *   לא ברגע שהוא נוצר ב-DOM. חשיפה שלא נראתה היא לא חשיפה, וספירה
 *   שלה היא בדיוק מה שהופך דוחות CTR לחסרי ערך.
 *
 * · הבאנר מסומן כ"פרסומת" בטקסט גלוי — דרישה של הנחיות פרסום
 *   וגם של אמון בסיסי.
 */

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
  const [hasRoom, setHasRoom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  // מקום פנוי בשוליים. 1440px = רוחב לפטופ רגיל (למשל MacBook Air/Pro
  // בזום ברירת מחדל) — מתחת לזה השוליים צרים מדי לעמודה בלי לדחוק תוכן.
  useEffect(() => {
    const check = () => setHasRoom(window.innerWidth >= 1440);
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
  if (!banner || !banner.assetUrl || !hasRoom) return null;

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
    <aside
      ref={ref}
      aria-label="אזור פרסום"
      className="fixed top-1/2 z-30 hidden -translate-y-1/2 [@media(min-width:1440px)]:block"
      style={side === "start" ? { insetInlineStart: 0 } : { insetInlineEnd: 0 }}
    >
      <div className="relative w-[160px]">
        <span className="absolute top-2 z-10 rounded-xs bg-ink-950/55 px-1.5 py-0.5 text-2xs font-medium text-white/85" style={{ insetInlineStart: "0.5rem" }}>
          פרסומת
        </span>
        <div className="aspect-[160/500] overflow-hidden">
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
      </div>
    </aside>
  );
}
