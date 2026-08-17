"use client";

import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import type { BusinessCard as BusinessCardType } from "@/types/domain";

/**
 * כרטיס חברה קומפקטי — משמש רק ברצועת "עסקים מומלצים" בדף הבית, כדי
 * להתאים בדיוק לכרטיסי הרפרנס (לוגו + שם + תיאור + מיקום + דירוג +
 * כפתור טלפון ירוק + "הצג פרטים"). BusinessCard הרגיל (עם תמונת כיסוי
 * גדולה) ממשיך לשמש בכל שאר האתר — לא נגעתי בו.
 */
export function CompanyListCard({ business: b }: { business: BusinessCardType }) {
  const href = `/business/${b.slug}`;

  return (
    <article className="group relative flex min-h-[222px] flex-col rounded-lg border border-ink-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(11,59,117,0.06)] transition-shadow duration-300 hover:shadow-[0_16px_36px_-16px_rgba(11,59,117,0.2)]">
      <div className="mb-2 flex min-h-12 items-center justify-center gap-2 text-center">
        <span className="grid min-h-10 min-w-10 shrink-0 place-items-center overflow-hidden rounded-md">
          {b.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-50 font-display text-lg font-black text-brand-800">{b.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-md font-bold text-ink-900">
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">{b.name}</Link>
          </h3>
          {b.city && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-400">
              <MapPin className="h-3.5 w-3.5" />
              {b.city.name}
            </span>
          )}
        </div>
      </div>

      {b.tagline && <p className="mb-2 line-clamp-2 text-center text-xs leading-relaxed text-ink-500">{b.tagline}</p>}

      <div className="mb-3 text-center">
        <Rating value={b.ratingAvg} count={b.reviewCount} size="sm" />
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-ink-100 pt-3">
        {b.phone ? (
          <a
            href={`tel:${b.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-success-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-success-700"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2.4} />
            <span dir="ltr">{b.phone}</span>
          </a>
        ) : <span className="flex-1" />}
        <Link
          href={href}
          className="relative z-10 flex-1 rounded-md border border-ink-200 px-3 py-2 text-center text-xs font-bold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          הצג פרטים
        </Link>
      </div>
    </article>
  );
}
