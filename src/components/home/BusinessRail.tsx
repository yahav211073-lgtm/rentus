"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BusinessCard as BusinessCardType } from "@/types/domain";
import { BusinessCard } from "@/components/business/BusinessCard";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * רצועת עסקים אופקית.
 *
 * · גלילה ילידית עם scroll-snap, לא טרנספורם ידני. גלילה ילידית
 *   נותנת אינרציה נכונה במגע, עובדת עם גלגלת, ונגישה למקלדת
 *   בחינם. קרוסלה שמזייפת גלילה מפסידה את שלושתם.
 *
 * · כפתורי החצים מסתתרים כשאין לאן לגלול — במקום להיות מושבתים
 *   ומבלבלים. הבדיקה רצה על scroll ועל resize.
 *
 * · ב-RTL scrollLeft הוא שלילי בדפדפנים מודרניים. הקוד מתייחס
 *   לערך מוחלט, אחרת החישוב נשבר בדיוק בכיוון שאנחנו צריכים.
 */

interface Props {
  businesses: BusinessCardType[];
  emphasis?: boolean;
  /** רשת במקום רצועה — לסקציות שבהן יש מספיק מקום אנכי */
  layout?: "rail" | "grid";
}

export function BusinessRail({ businesses, emphasis = false, layout = "rail" }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canStart, setCanStart] = useState(false);
  const [canEnd, setCanEnd] = useState(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || layout === "grid") return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      setCanStart(pos > 8);
      setCanEnd(pos < max - 8);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [layout, businesses.length]);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    // גוללים ברוחב כרטיס אחד + רווח, לא במסך מלא — כך המשתמש
    // לא מאבד את ההקשר של מה שראה
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  if (layout === "grid") {
    return (
      <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {businesses.map((b) => (
          <RevealItem key={b.id}>
            <BusinessCard business={b} emphasis={emphasis} />
          </RevealItem>
        ))}
      </RevealStagger>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
        role="region"
        aria-label="רשימת עסקים, ניתן לגלול"
        tabIndex={0}
      >
        {businesses.map((b) => (
          <div
            key={b.id}
            className="w-[280px] shrink-0 snap-start sm:w-[300px] lg:w-[320px]"
          >
            <BusinessCard business={b} emphasis={emphasis} />
          </div>
        ))}
      </div>

      <ScrollButton side="start" show={canStart} onClick={() => scrollBy(1)} />
      <ScrollButton side="end" show={canEnd} onClick={() => scrollBy(-1)} />
    </div>
  );
}

function ScrollButton({
  side, show, onClick,
}: { side: "start" | "end"; show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "start" ? "גלילה אחורה" : "גלילה קדימה"}
      tabIndex={show ? 0 : -1}
      className={cn(
        "absolute top-[38%] z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full",
        "border border-ink-200 bg-white text-brand-800 shadow-lg",
        "transition-all duration-300 hover:scale-110 hover:border-brand-300 lg:grid",
        show ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={side === "start" ? { insetInlineStart: "-18px" } : { insetInlineEnd: "-18px" }}
    >
      {side === "start"
        ? <ChevronRight className="h-5 w-5" />
        : <ChevronLeft className="h-5 w-5" />}
    </button>
  );
}
