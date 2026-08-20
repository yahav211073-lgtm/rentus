import Link from "next/link";
import Image from "next/image";
import { Globe, Heart, MapPin, Phone, Sparkles } from "lucide-react";
import { InstagramIcon, WazeIcon, WhatsAppIcon } from "@/components/ui/icons";
import { toWhatsAppNumber, formatCompact } from "@/lib/utils";
import type { BusinessCard as BusinessCardType } from "@/types/domain";

/**
 * כרטיס עסק — הרכיב המשותף לכל רשימה באתר.
 *
 * הפריסה משוחזרת מהדמיה: תמונת נושא במלוא רוחב הכרטיס למעלה, ומתחתיה
 * גוש מרכוז — שם, תיאור, מיקום, דירוג, ושורת עיגולי רשתות צבעוניים.
 *
 * שתי החלטות שקובעות את המראה:
 *
 * · התמונה היא coverUrl ולא logoUrl. לוגו הוא סימן מסחרי ביחס שרירותי,
 *   ומילוי מלבן 3:2 בלוגו מותח אותו. תמונת נושא היא בדיוק מה שנועד
 *   למלא מלבן. כשאין coverUrl נופלים ללוגו על רקע בהיר עם object-contain,
 *   שם החיתוך לא הורס אותו.
 *
 * · עיגולי הרשתות צבועים בצבע המותג של כל רשת ולא בצבע אחיד. זו
 *   הצורה בהדמיה, והיא גם נכונה: המשתמש מזהה ירוק=וואטסאפ מהר יותר
 *   משהוא קורא tooltip. הצבעים ליטרליים ולא טוקנים — הם שייכים
 *   לוואטסאפ ולאינסטגרם, לא למותג של האתר.
 *
 * כל אייקון מרונדר רק כשהעסק באמת מילא את השדה בטופס ההרשמה.
 * עיגול שמוביל לשומקום גרוע מהיעדרו.
 *
 * הקישור הראשי הוא שכבת ::after על כל הכרטיס; הפעולות יושבות מעליו
 * ב-z-index, כך שאין קינון קישורים לא חוקי.
 */
export function CompanyListCard({ business: b }: { business: BusinessCardType }) {
  const href = `/business/${b.slug}`;
  const social = b.social ?? {};
  const isPremium = b.isFeatured || b.isSponsored || b.tier === "enterprise";

  const wazeHref = b.latitude != null && b.longitude != null
    ? `https://waze.com/ul?ll=${b.latitude},${b.longitude}&navigate=yes`
    : b.address
      ? `https://waze.com/ul?q=${encodeURIComponent(`${b.address} ${b.city?.name ?? ""}`)}`
      : null;

  return (
    /*
      מובייל אופקי, דסקטופ אנכי — אותו כרטיס, שתי קומפוזיציות.

      הכרטיס האנכי הוא הצורה הנכונה ברשת: הוא רחב 340px, והתמונה
      ביחס 2:1 היא 170px. במובייל אותו כרטיס נמתח לרוחב מלא, התמונה
      קפצה ל-195px, והכרטיס כולו עבר 350px — כלומר כרטיס אחד לכל
      מסך. אותו מידע בדיוק בפריסה אופקית תופס 116px.

      זו לא "גרסה מוקטנת" אלא הפריסה שמתאימה לפרופורציה: במסך צר יש
      עודף רוחב וחוסר גובה, ולכן התמונה עוברת לצד.
    */
    <article className="group relative flex h-full min-h-[7.25rem] flex-row overflow-hidden sm:min-h-0 rounded-lg border border-brand-100/80 bg-[#edf3f9] shadow-[0_2px_8px_rgba(12,29,64,0.06)] transition-[box-shadow,transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_14px_28px_-18px_rgba(12,29,64,0.28)] sm:flex-col">

      {/* ---------- תמונת נושא ---------- */}
      {/* בלי aspect-ratio במובייל.
          aspect-square יחד עם self-stretch יצר תלות מעגלית — הגובה
          נגזר מהרוחב, והרוחב נמתח לגובה השורה — והכרטיס קרס לגובה
          אפס. כאן הגובה מגיע מ-min-h של הכרטיס ומהתוכן, והתמונה רק
          נמתחת אליו. מ-sm הכרטיס אנכי ואז 2:1 חוקי לגמרי. */}
      <div className="relative w-[38%] max-w-[128px] shrink-0 self-stretch overflow-hidden bg-ink-100 sm:aspect-[2/1] sm:w-full sm:max-w-none sm:self-auto">
        {b.coverUrl ? (
          <Image
            src={b.coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 340px"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        ) : b.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.logoUrl}
            alt={`הלוגו של ${b.name}`}
            loading="lazy"
            className="h-full w-full bg-white/85 object-contain p-4"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-100 to-brand-300 text-3xl text-brand-800">
            {b.name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* מועדפים — פינה מתחילת השורה. כרגע מוביל להתחברות; שמירה
            אמיתית דורשת סשן, וטבלת favorites כבר מוכנה לזה. */}
        <Link
          href="/login?next=/search"
          aria-label={`הוספת ${b.name} למועדפים`}
          /* מוסתר במובייל: התמונה שם רחבה 122px, ועיגול מועדפים
             ותג פרימיום יחד כיסו אותה כמעט לגמרי. המועדפים הוא
             פעולה משנית שקיימת גם בעמוד העסק עצמו. */
          className="absolute top-2 z-10 hidden h-8 w-8 place-items-center rounded-full bg-brand-950/25 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-danger-500 sm:grid"
          style={{ insetInlineStart: "0.5rem" }}
        >
          <Heart className="h-4.5 w-4.5" strokeWidth={2.2} aria-hidden="true" />
        </Link>

        {isPremium && (
          <span
            className="absolute top-1.5 z-10 inline-flex items-center gap-1 rounded-md bg-gold-400 px-1.5 py-0.5 text-[0.625rem] font-bold text-brand-950 shadow-sm sm:top-2 sm:px-2 sm:text-2xs"
            style={{ insetInlineEnd: "0.375rem" }}
          >
            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
            פרימיום
          </span>
        )}
      </div>

      {/* ---------- גוף ---------- */}
      <div className="flex min-w-0 flex-1 flex-col items-start px-3 pb-2 pt-2 text-start sm:items-center sm:pb-2.5 sm:pt-2.5 sm:text-center">
        <h3 className="line-clamp-1 text-md font-bold leading-tight text-ink-900">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {b.name}
          </Link>
        </h3>

        {b.tagline && (
          <p className="mt-0.5 line-clamp-2 text-2xs leading-snug text-ink-500 sm:mt-1 sm:line-clamp-1 sm:text-xs">{b.tagline}</p>
        )}

        {b.city && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500 sm:mt-1.5">
            {b.city.name}
            <MapPin className="h-3.5 w-3.5 shrink-0 text-danger-500" strokeWidth={2} aria-hidden="true" />
          </p>
        )}

        {b.reviewCount > 0 && (
          <p className="mt-1 inline-flex items-center gap-1.5 sm:mt-1.5">
            <span className="text-2xs text-ink-500 tabular-nums">({formatCompact(b.reviewCount)})</span>
            <span className="inline-flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} viewBox="0 0 24 24"
                  className={`h-3.5 w-3.5 ${i < Math.round(b.ratingAvg) ? "fill-gold-400" : "fill-ink-300"}`}>
                  <path d="M12 2.4l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.25l-5.81 3.05 1.11-6.47L2.6 9.25l6.5-.95L12 2.4z" />
                </svg>
              ))}
            </span>
            <span className="text-sm font-bold text-ink-900 tabular-nums">
              {b.ratingAvg.toFixed(1)}
            </span>
          </p>
        )}

        {/* ---------- רשתות ---------- */}
        <div className="mt-auto flex flex-wrap items-center justify-start gap-1.5 pt-2 sm:justify-center sm:pt-2.5">
          {b.website && (
            <Social href={b.website} label="אתר החברה" bg="#1E3A5F" external>
              <Globe className="h-3.5 w-3.5" strokeWidth={2} />
            </Social>
          )}
          {wazeHref && (
            <Social href={wazeHref} label="ניווט ב-Waze" bg="#33CCFF" external>
              <WazeIcon className="h-3.5 w-3.5" />
            </Social>
          )}
          {social.instagram && (
            <Social href={social.instagram} label="אינסטגרם" bg="linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" external>
              <InstagramIcon className="h-3.5 w-3.5" />
            </Social>
          )}
          {b.whatsapp && (
            <Social href={`https://wa.me/${toWhatsAppNumber(b.whatsapp)}`} label="וואטסאפ" bg="#25D366" external>
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </Social>
          )}
          {b.phone && (
            <Social href={`tel:${b.phone}`} label={`חיוג ל-${b.name}`} bg="#1D6FE0">
              <Phone className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Social>
          )}
        </div>
      </div>
    </article>
  );
}

/** עיגול רשת. z-10 כדי לשבת מעל שכבת הקישור של הכרטיס כולו. */
function Social({
  href, label, bg, external, children,
}: { href: string; label: string; bg: string; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{ background: bg }}
      className="relative z-10 grid h-7 w-7 place-items-center rounded-full text-white shadow-[0_2px_6px_rgba(12,29,64,0.18)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
    >
      {children}
    </a>
  );
}
