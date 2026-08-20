import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import type { BusinessCard as BusinessCardType } from "@/types/domain";

/**
 * כרטיס חברה ברשת "חברות מומלצות" בעמוד הבית.
 *
 * הלוגו הוא הגיבור של הכרטיס — בדיוק כמו ברפרנס, שבו מזהים את
 * החברה לפי הסמל לפני שקוראים את השם. שתי נקודות שחשוב לשמור:
 *
 * · הלוגו הוא object-contain בתוך תיבה בגובה קבוע, לא object-cover.
 *   לוגו הוא לא תמונת נוף — חיתוך שלו הורס אותו, וזה מה שקרה כאן
 *   קודם (התיבה לא הגבילה גובה בכלל והלוגו התפרץ על כל הכרטיס).
 *
 * · הכפתור הירוק מציג את המספר האמיתי. "התקשרו" גנרי מסתיר בדיוק
 *   את המידע שמשווה בין ספקים.
 *
 * הכרטיס עצמו אינו רכיב לקוח: הקישור הראשי הוא שכבת ::after על כל
 * הכרטיס, וקישורי הטלפון/הפרטים יושבים מעליו ב-z-index. כך אין
 * צורך ב-onClick ובקינון קישורים לא חוקי.
 */
export function CompanyListCard({ business: b }: { business: BusinessCardType }) {
  const href = `/business/${b.slug}`;

  return (
    <article className="group relative flex min-h-[248px] flex-col rounded-lg border border-ink-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(12,29,64,0.06)] transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_38px_-18px_rgba(12,29,64,0.28)]">
      <div className="mb-3 grid h-14 place-items-center">
        {b.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.logoUrl}
            alt={`הלוגו של ${b.name}`}
            loading="lazy"
            className="max-h-14 max-w-[70%] object-contain"
          />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 font-display text-xl font-black text-brand-800">
            {b.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <h3 className="text-center text-md font-extrabold leading-tight text-ink-900">
        <Link href={href} className="after:absolute after:inset-0 after:content-['']">
          {b.name}
        </Link>
      </h3>

      {b.tagline && (
        <p className="mt-1.5 line-clamp-2 text-center text-xs leading-relaxed text-ink-500">
          {b.tagline}
        </p>
      )}

      <div className="mt-3 flex flex-col items-center gap-1.5">
        {b.city && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-400">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {b.city.name}
          </span>
        )}
        {b.reviewCount > 0 ? (
          <Rating value={b.ratingAvg} count={b.reviewCount} size="sm" />
        ) : (
          <span className="text-xs text-ink-400">חברה חדשה</span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-ink-100 pt-3.5">
        {b.phone ? (
          <a
            href={`tel:${b.phone}`}
            className="relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-xs border border-success-500/35 bg-success-50 px-3 py-2 text-xs font-bold text-success-700 transition-colors hover:bg-success-500 hover:text-white"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
            <span dir="ltr">{b.phone}</span>
          </a>
        ) : (
          <span className="flex-1" />
        )}
        <Link
          href={href}
          className="relative z-10 flex-1 rounded-xs border border-ink-200 px-3 py-2 text-center text-xs font-bold text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
        >
          הצג פרטים
        </Link>
      </div>
    </article>
  );
}
