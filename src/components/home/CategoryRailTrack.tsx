"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { businessCountLabel, cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export interface CategoryRailItem {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  icon?: string | null;
  businessCount?: number | null;
}

/**
 * החלק האינטראקטיבי של רצועת הקטגוריות — הגלילה עצמה וחצי הדפדוף.
 *
 * חצים במובייל ולא רק בדסקטופ: הרצועה כאן נגללת אך ורק בגרירת אצבע,
 * ובלי רמז חזותי שיש עוד קטגוריות אחרי השש הגלויות. הדפוס (מעקב
 * atStart/atEnd + חץ שנעלם בקצה) מועתק מ-BusinessCarousel, שכבר פתר
 * בדיוק את אותה בעיה לרצועת העסקים. ב-lg הרצועה הופכת לרשת קבועה של
 * שבע ואין מה לדפדף, ולכן החצים נעלמים משם.
 */
export function CategoryRailTrack({ categories }: { categories: CategoryRailItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const step = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = (card?.offsetWidth ?? 186) + 12;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  return (
    <div className="relative">
      {/* במובייל רצועה נגללת עם snap; מ-lg רשת של שבע.
          [direction:ltr] על המכולה הופך את כיוון הגלילה לטבעי,
          והילדים מוחזרים ל-rtl בנפרד. */}
      <div
        ref={trackRef}
        className="flex snap-x gap-3 overflow-x-auto pb-2 [direction:ltr] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-7 lg:overflow-visible lg:pb-0"
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            data-card
            href={`/category/${cat.slug}`}
            className="group flex h-[104px] w-[186px] shrink-0 snap-start items-center gap-2 overflow-hidden rounded-lg border border-ink-200/80 bg-white p-2.5 shadow-[0_10px_26px_-18px_rgba(5,25,47,0.45)] transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_18px_34px_-18px_rgba(5,25,47,0.4)] lg:w-auto [direction:rtl]"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
              {/* line-clamp ולא truncate: ברשת של שבע עמודות
                  לשם יש כ-90px, ו-"מכשירי קשר" נחתך ל-"מכשירי ק...".
                  שם קטגוריה חתוך הוא כישלון של הרצועה — כל תפקידה
                  הוא לתת לסרוק שמות. שתי שורות עדיפות על שלוש נקודות. */}
              <span className="line-clamp-2 text-xs font-bold leading-[1.3] text-ink-900 transition-colors group-hover:text-brand-700">
                {cat.name}
              </span>
              {(cat.businessCount ?? 0) > 0 && (
                <span className="truncate text-2xs text-ink-400">
                  {businessCountLabel(cat.businessCount ?? 0)}
                </span>
              )}
            </span>

            {/* ריבוע ממוזער בתוך הכרטיס, לא רצועה שנוגעת בקצוות.
                ריבוע הוא היחס היחיד שנותן לכל שש הקטגוריות להיראות
                אחיד: התמונות במסד הן צילומים ביחסים שונים, ורצועה
                אנכית חתכה כל אחת מהן במקום אחר. */}
            <span className="relative block h-[84px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-ink-100">
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt=""
                  fill
                  sizes="84px"
                  className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-brand-50 text-brand-700">
                  <CategoryIcon name={cat.icon} className="h-9 w-9" />
                </span>
              )}
            </span>
          </Link>
        ))}

        {/* "כל הקטגוריות" סוגר את הרצועה ולא פותח אותה: מתחילים
            בתוכן אמיתי, והמוצא הכללי הוא מה שחותם. */}
        <Link
          href="/categories"
          className="group flex h-[104px] w-[186px] shrink-0 snap-start items-center gap-3 rounded-lg border border-dashed border-ink-300 bg-white px-3.5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 hover:border-brand-400 hover:bg-brand-50 lg:w-auto [direction:rtl]"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
            <span className="text-xs font-bold leading-[1.3] text-ink-900">כל הקטגוריות</span>
            <span className="truncate text-2xs text-ink-400">צפו בכל הקטגוריות</span>
          </span>
          <span className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-white">
            <LayoutGrid className="h-8 w-8" strokeWidth={1.9} aria-hidden="true" />
          </span>
        </Link>
      </div>

      <Arrow side="start" onClick={() => step(1)} disabled={atStart} />
      <Arrow side="end" onClick={() => step(-1)} disabled={atEnd} />
    </div>
  );
}

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
      className={cn(
        "absolute top-[42px] z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full",
        "border border-white/80 bg-brand-800 text-white shadow-lg",
        "transition-[opacity,background-color,transform] duration-200 hover:bg-brand-700 active:scale-95 lg:hidden",
        disabled ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
