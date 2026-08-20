import Link from "next/link";
import {
  ArrowLeft, Building2, CalendarDays, Headphones, Heart, ShieldCheck, Star,
  TagsIcon, ThumbsUp, Users, Zap,
} from "lucide-react";
import { ReviewsCarousel } from "@/components/home/ReviewsCarousel";
import {
  getApprovedTestimonials, getRatingBreakdown, getTestimonialStats,
} from "@/lib/repo/testimonials";
import { formatNumber } from "@/lib/utils";

/**
 * "מה אומרים על Rentus?" — סקשן הביקורות המלא.
 *
 * הפריסה משוחזרת מהדמיה: כותרת ממורכזת, שורת סיכום בשלושה בלוקים
 * (ציון ענק · התפלגות דירוגים · הזמנה לכתוב), קרוסלת ביקורות,
 * ורצועת מספרים בתחתית. לצידם פאנל כהה עם ארבע סיבות.
 *
 * הסקשן מרונדר תמיד, גם בלי ביקורות מאושרות: כניסת "כתבו ביקורת"
 * יושבת בתוכו, ואם הוא נעלם כשאין ביקורות אף אחד לא יכול לכתוב את
 * הראשונה והאתר נעול במצב הריק שלו לנצח.
 *
 * כל מספר כאן נספר מהמסד. אין ערכי ראווה קבועים — הצהרה שקרית על
 * גודל האינדקס היא בדיוק מה שהורס אמון ברגע שמישהו סופר בעצמו.
 * דרגה בהתפלגות שאין בה ביקורות מוצגת כפס ריק ולא נעלמת, אחרת
 * חמש הדרגות מזיזות זו את זו ומשנות את משמעות התצוגה.
 */

const REASONS = [
  { Icon: ShieldCheck, title: "אלפי עסקים אמינים",     body: "מאומתים ומדורגים על ידי קהילת המשתמשים" },
  { Icon: Zap,         title: "תהליך פשוט ומהיר",       body: "מוצאים, משווים ומשכירים בקלות" },
  { Icon: TagsIcon,    title: "הצעות מחיר משתלמות",     body: "משווים בין ספקים ומקבלים את המחיר הטוב ביותר" },
  { Icon: Headphones,  title: "שירות לקוחות מעולה",     body: "צוות מקצועי זמין עבורכם בכל שאלה" },
];

export async function ReviewsSection({
  businessCount, userCount, yearsActive,
}: {
  businessCount: number;
  userCount: number;
  yearsActive: number;
}) {
  const [reviews, stats, breakdown] = await Promise.all([
    getApprovedTestimonials(12),
    getTestimonialStats(),
    getRatingBreakdown(),
  ]);

  const total = breakdown.reduce((sum, b) => sum + b.count, 0);
  const positive = breakdown.filter((b) => b.stars >= 4).reduce((s, b) => s + b.count, 0);
  const recommendPct = total > 0 ? Math.round((positive / total) * 100) : 0;

  const bottomStats = [
    total > 0 && { Icon: ThumbsUp,     value: `${recommendPct}%`,             label: "ממליצים על Rentus" },
    total > 0 && { Icon: Star,         value: `${formatNumber(total)}`,        label: "ביקורות אמיתיות" },
    userCount > 0 && { Icon: Users,    value: `${formatNumber(userCount)}`,    label: "משתמשים רשומים" },
    businessCount > 0 && { Icon: Building2, value: `${formatNumber(businessCount)}`, label: "עסקים פעילים" },
    yearsActive > 0 && { Icon: CalendarDays, value: `${yearsActive}`,          label: "שנות פעילות" },
  ].filter(Boolean) as { Icon: typeof Star; value: string; label: string }[];

  return (
    <section className="bg-ink-50 pt-4">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* ================= לוח ראשי ================= */}
          <div className="rounded-2xl bg-gradient-to-b from-white to-ink-50 p-5 shadow-[0_2px_14px_rgba(12,29,64,0.06)] sm:p-7">

            <header className="text-center">
              <h2 className="text-2xl text-ink-900 sm:text-3xl">מה אומרים על Rentus?</h2>
              <p className="mx-auto mt-2 max-w-[56ch] text-sm leading-relaxed text-ink-500 sm:text-base">
                אלפי עסקים ולקוחות שכבר נהנים מהשכרת הציוד בקלות ובביטחון
              </p>
              <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-brand-600" aria-hidden="true" />
            </header>

            {/* ---- שורת הסיכום ---- */}
            <div className="mt-5 grid items-center gap-5 sm:mt-7 sm:gap-6 lg:grid-cols-[200px_minmax(0,1fr)_340px]">

              <div className="text-center">
                <p className="font-display text-5xl leading-none text-brand-600">
                  {stats.count > 0 ? stats.avg.toFixed(1) : "—"}
                </p>
                <span className="mt-2 flex justify-center gap-1" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} viewBox="0 0 24 24"
                      className={`h-5 w-5 ${i < Math.round(stats.avg) ? "fill-gold-400" : "fill-ink-200"}`}>
                      <path d="M12 2.4l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.25l-5.81 3.05 1.11-6.47L2.6 9.25l6.5-.95L12 2.4z" />
                    </svg>
                  ))}
                </span>
                <p className="mt-2 text-xs text-ink-400">
                  {stats.count > 0 ? `מבוסס על ${formatNumber(stats.count)} ביקורות` : "עדיין אין ביקורות"}
                </p>
              </div>

              <ul className="space-y-2">
                {breakdown.map(({ stars, count }) => (
                  <li key={stars} className="flex items-center gap-3">
                    <span className="flex w-9 shrink-0 items-center gap-1 text-xs text-ink-500">
                      {stars}
                      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-ink-400" aria-hidden="true">
                        <path d="M12 2.4l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.25l-5.81 3.05 1.11-6.47L2.6 9.25l6.5-.95L12 2.4z" />
                      </svg>
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-200/70">
                      <span
                        className="block h-full rounded-full bg-brand-600"
                        style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
                      />
                    </span>
                    <span className="w-12 shrink-0 text-start text-xs tabular-nums text-ink-500">
                      {formatNumber(count)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4 rounded-xl border border-ink-200/80 bg-white/70 p-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(12,29,64,0.12)]">
                  <Heart className="h-6 w-6 fill-brand-600 text-brand-600" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink-900">יש לכם חוויה לשתף?</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                    הביקורות שלכם עוזרות לאלפי אנשים
                  </span>
                  <Link
                    href="/review"
                    className="group mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    כתבו ביקורת
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
                  </Link>
                </span>
              </div>
            </div>

            {/* ---- קרוסלה ---- */}
            {reviews.length > 0 && (
              <div className="mt-5 sm:mt-7">
                <ReviewsCarousel reviews={reviews} />
              </div>
            )}

            {/* ---- רצועת מספרים ---- */}
            {bottomStats.length > 0 && (
              /* במובייל האייקון עובר מעל הטקסט ולא לצידו.
                 בפריסה האופקית נשארו כ-90px לתווית, ו"ביקורות אמיתיות"
                 נחתך ל-"ביקורות אמי…" בשלושה תאים מתוך חמישה. מספר בלי
                 התווית שלו הוא מספר בלי משמעות. */
              <div className="mt-5 rounded-xl bg-white/70 p-2 sm:mt-7">
                <dl className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5">
                  {bottomStats.map(({ Icon, value, label }, i) => (
                    <div
                      key={label}
                      className={`flex flex-col items-center justify-start gap-1.5 px-1.5 py-3 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-3 sm:py-4 sm:text-start ${i > 0 ? "lg:border-s lg:border-ink-200/70" : ""}`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 sm:h-11 sm:w-11">
                        <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <dd className="text-md font-bold tabular-nums text-ink-900 sm:text-lg">{value}</dd>
                        <dt className="text-2xs leading-tight text-ink-400 sm:truncate sm:text-xs">{label}</dt>
                      </span>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* ================= פאנל כהה ================= */}
          <aside className="flex flex-col rounded-2xl bg-brand-900 p-4 sm:p-6">
            <h3 className="mb-3.5 text-center text-xl text-white sm:mb-5">
              למה אוהבים את <span className="text-brand-300">Rentus</span>?
            </h3>

            <ul className="flex-1 space-y-2 sm:space-y-3">
              {REASONS.map(({ Icon, title, body }) => (
                <li key={title} className="flex items-center gap-3 rounded-xl bg-white/[0.07] p-3 sm:p-4">
                  <span className="min-w-0 flex-1 text-end">
                    <span className="block text-sm font-bold text-white">{title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-white/60">{body}</span>
                  </span>
                  <Icon className="h-6 w-6 shrink-0 text-brand-300" strokeWidth={1.8} aria-hidden="true" />
                </li>
              ))}
            </ul>


          </aside>
        </div>
      </div>
    </section>
  );
}
