"use client";

import Link from "next/link";
import { BadgeCheck, Globe, MapPin, MessageCircle, Phone, ArrowLeft } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/icons";
import { motion } from "framer-motion";
import type { BusinessCard as BusinessCardType } from "@/types/domain";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { cn, toWhatsAppNumber } from "@/lib/utils";

/**
 * כרטיס עסק.
 *
 * הכרטיס הוא היחידה שחוזרת הכי הרבה פעמים באתר, ולכן הוא מקבל את רוב
 * תשומת הלב:
 *
 * · הכיסוי מתקרב ב-hover (scale על התמונה, לא על הכרטיס). הגדלת הכרטיס
 *   כולו דוחפת את השכנים ויוצרת reflow; הגדלת התוכן הפנימי לא.
 *
 * · פעולות מהירות (טלפון/וואטסאפ) מופיעות ב-hover בדסקטופ, וקבועות
 *   במובייל — שם אין hover, ושם הן הכי חשובות.
 *
 * · כל הכרטיס הוא קישור אחד, והפעולות המהירות הן קישורים מקוננים.
 *   HTML לא מרשה <a> בתוך <a>, ולכן שכבת הקישור היא ::after מוחלט
 *   מתחת לפעולות, ולא עטיפה. זה גם שומר על עץ נגישות תקין.
 *
 * · ‎tabular-nums‎ על הדירוג — בלי זה, מספרים ברוחב משתנה גורמים
 *   לשורת הדירוג "לרקוד" ברשת של כרטיסים.
 */

interface Props {
  business: BusinessCardType;
  /** מדגיש כרטיס בתוך רצועה — משמש ב"מומלצים" */
  emphasis?: boolean;
  className?: string;
  priority?: boolean;
}

const PRICE_LABELS = ["₪", "₪₪", "₪₪₪", "₪₪₪₪"];

export function BusinessCard({ business: b, emphasis = false, className, priority = false }: Props) {
  const href = `/business/${b.slug}`;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg bg-white",
        "border border-ink-200/70",
        "shadow-[0_1px_3px_rgba(11,59,117,0.06)]",
        "transition-shadow duration-300",
        "hover:shadow-[0_20px_44px_-14px_rgba(11,59,117,0.22)] hover:border-brand-200",
        // כרטיס מודגש מקבל מסגרת זהב עדינה בלבד. לא רקע צהוב — זה זועק.
        emphasis && "ring-1 ring-accent-300/60",
        className,
      )}
    >
      {/* --- כיסוי --- */}
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
        <div className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
          {b.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.coverUrl}
              alt={`תמונת רקע של ${b.name}`}
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
            />
          ) : (
            <CoverArt seed={b.slug} label={b.name.charAt(0)} className="h-full w-full" />
          )}
        </div>

        {/* תגיות פינה */}
        <div className="absolute top-3 flex flex-wrap gap-1.5" style={{ insetInlineStart: "0.75rem" }}>
          {b.isSponsored && <Badge variant="sponsored">ממומן</Badge>}
          {b.isFeatured && !b.isSponsored && <Badge variant="accent">מומלץ</Badge>}
        </div>

        {b.priceRange && (
          <div className="absolute top-3" style={{ insetInlineEnd: "0.75rem" }}>
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-2xs font-bold text-white backdrop-blur-sm">
              {PRICE_LABELS[b.priceRange - 1]}
            </span>
          </div>
        )}

        {/* פעולות מהירות — נסתרות עד hover בדסקטופ, תמיד גלויות במובייל */}
        <div
          className={cn(
            "absolute bottom-3 z-20 flex gap-2",
            "opacity-100 translate-y-0",
            "md:opacity-0 md:translate-y-2",
            "md:group-hover:opacity-100 md:group-hover:translate-y-0",
            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          )}
          style={{ insetInlineEnd: "0.75rem" }}
        >
          {b.whatsapp && (
            <a
              href={`https://wa.me/${toWhatsAppNumber(b.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`שליחת הודעת וואטסאפ ל${b.name}`}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#25D366] shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <MessageCircle className="h-4.5 w-4.5" strokeWidth={2.2} />
            </a>
          )}
          {b.phone && (
            <a
              href={`tel:${b.phone}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`התקשרות ל${b.name}`}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-700 shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <Phone className="h-4.5 w-4.5" strokeWidth={2.2} />
            </a>
          )}
        </div>
      </div>

      {/* --- גוף --- */}
      <div className="flex flex-1 flex-col gap-2.5 p-4 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-md font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
            <Link href={href} className="after:absolute after:inset-0 after:z-10 after:content-['']">
              {b.name}
            </Link>
          </h3>
          {b.isVerified && (
            <BadgeCheck
              className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-600"
              aria-label="עסק מאומת"
            />
          )}
        </div>

        {b.tagline && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{b.tagline}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-400">
          {b.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {b.city.name}
            </span>
          )}
          {b.primaryCategory && (
            <span className="truncate text-ink-500">{b.primaryCategory.name}</span>
          )}
        </div>

        {b.tags && b.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {b.tags.slice(0, 2).map((t) => (
              <Badge key={t.slug} variant="neutral">{t.name}</Badge>
            ))}
          </div>
        )}

        {/* כף רגל — נדחף לתחתית כדי שכרטיסים ברשת יסתיימו באותו קו */}
        <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3">
          <Rating value={b.ratingAvg} count={b.reviewCount} size="sm" />
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          >
            לפרופיל
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* שורת יצירת קשר — אתר/אינסטגרם/וואטסאפ/פייסבוק/טלפון, כמו בכרטיסי הרפרנס */}
        {(b.website || b.social?.instagram || b.social?.facebook || b.whatsapp || b.phone) && (
          <div className="flex items-center gap-1.5 border-t border-ink-100 pt-3">
            {b.website && (
              <a
                href={b.website} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`אתר האינטרנט של ${b.name}`}
                className="relative z-20 grid h-8 w-8 place-items-center bg-ink-50 text-ink-500 transition-colors hover:bg-brand-800 hover:text-white"
              >
                <Globe className="h-4 w-4" strokeWidth={2} />
              </a>
            )}
            {b.social?.instagram && (
              <a
                href={b.social.instagram} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`האינסטגרם של ${b.name}`}
                className="relative z-20 grid h-8 w-8 place-items-center bg-ink-50 text-ink-500 transition-colors hover:bg-[#E1306C] hover:text-white"
              >
                <InstagramIcon className="h-4 w-4" strokeWidth={2} />
              </a>
            )}
            {b.social?.facebook && (
              <a
                href={b.social.facebook} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`הפייסבוק של ${b.name}`}
                className="relative z-20 grid h-8 w-8 place-items-center bg-ink-50 text-ink-500 transition-colors hover:bg-[#1877F2] hover:text-white"
              >
                <FacebookIcon className="h-4 w-4" strokeWidth={2} />
              </a>
            )}
            {b.whatsapp && (
              <a
                href={`https://wa.me/${toWhatsAppNumber(b.whatsapp)}`} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`וואטסאפ ל${b.name}`}
                className="relative z-20 grid h-8 w-8 place-items-center bg-ink-50 text-ink-500 transition-colors hover:bg-[#25D366] hover:text-white"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
              </a>
            )}
            {b.phone && (
              <a
                href={`tel:${b.phone}`}
                onClick={(e) => e.stopPropagation()}
                aria-label={`התקשרות ל${b.name}`}
                className="relative z-20 grid h-8 w-8 place-items-center bg-ink-50 text-ink-500 transition-colors hover:bg-brand-800 hover:text-white"
              >
                <Phone className="h-4 w-4" strokeWidth={2} />
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/** שלד טעינה בעל אותה גיאומטריה — מונע קפיצת פריסה. */
export function BusinessCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-200/70 bg-white">
      <div className="skeleton aspect-[16/10] rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="skeleton h-4 w-3/5" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
        <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-3">
          <div className="skeleton h-3.5 w-24" />
        </div>
      </div>
    </div>
  );
}
