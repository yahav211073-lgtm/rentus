import Link from "next/link";
import { ArrowLeft, PenLine, Quote, Star } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { getApprovedTestimonials, getTestimonialStats } from "@/lib/repo/testimonials";

/**
 * "מה אומרים על האתר" — ביקורות על הפלטפורמה, והמקום להוסיף ביקורת.
 *
 * הסקציה מרונדרת **תמיד**, גם כשאין עדיין ביקורות מאושרות. זה שינוי
 * מכוון מהגרסה הקודמת שהחזירה null: אם כניסת "כתבו ביקורת" יושבת
 * כאן, והסקציה נעלמת כשאין ביקורות, אז אף אחד לא יכול לכתוב את
 * הראשונה — האתר נעול במצב הריק שלו לנצח.
 *
 * במצב ריק מוצג רק כרטיס ההזמנה, בלי כותרת שמבטיחה תוכן שאינו קיים
 * ובלי ביקורות דמה. ביקורת בדויה בשם אדם שלא קיים היא בדיוק מה
 * שהופך המלצות לחסרות ערך.
 *
 * כרטיס ההוספה הוא תא ברשת ולא כפתור מעל הסקציה — כך הפעולה יושבת
 * פיזית ליד מה שהיא מייצרת, וזו הבקשה המפורשת.
 */
export async function ReviewsSection() {
  const [reviews, stats] = await Promise.all([
    getApprovedTestimonials(3),
    getTestimonialStats(),
  ]);

  const shown = reviews.slice(0, 3);
  const hasReviews = shown.length > 0;

  return (
    <section className="bg-ink-50 pt-4">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-ink-200/80 bg-white p-4 shadow-[0_10px_26px_-18px_rgba(5,25,47,0.45)] sm:p-5">

          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl text-ink-900 sm:text-3xl">
                מה אומרים על האתר
              </h2>
              {/* הציון הכולל מוצג רק כשהוא נשען על ביקורות אמיתיות. */}
              {stats.count > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-700">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {stats.avg.toFixed(1)} · {stats.count === 1 ? "ביקורת אחת" : `${stats.count} ביקורות`}
                </span>
              )}
            </div>

            {hasReviews && (
              <Link
                href="/review"
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
              >
                לכל הביקורות
                <ArrowLeft
                  className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            )}
          </div>

          <div className={`grid gap-3 ${GRID_COLS[shown.length] ?? GRID_COLS[3]}`}>
            {shown.map((r) => (
              <figure
                key={r.id}
                className="flex flex-col rounded-lg border border-ink-200/70 bg-ink-50 p-4"
              >
                <Quote className="mb-2 h-5 w-5 shrink-0 text-brand-300" strokeWidth={2} aria-hidden="true" />

                <blockquote className="flex-1 text-sm leading-relaxed text-ink-700">
                  {r.quote}
                </blockquote>

                <figcaption className="mt-3 flex items-center justify-between gap-3 border-t border-ink-200/70 pt-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-ink-900">{r.authorName}</span>
                    {r.authorRole && (
                      <span className="truncate text-xs text-ink-400">{r.authorRole}</span>
                    )}
                  </span>
                  {r.rating != null && <Rating value={r.rating} size="sm" />}
                </figcaption>
              </figure>
            ))}

            {/* כרטיס ההוספה — תמיד התא האחרון. */}
            <Link
              href="/review"
              className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/60 p-5 text-center transition-colors hover:border-brand-500 hover:bg-brand-50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-700 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                <PenLine className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold text-ink-900">
                {hasReviews ? "כתבו ביקורת על האתר" : "היו הראשונים לכתוב ביקורת"}
              </span>
              <span className="max-w-[30ch] text-xs leading-relaxed text-ink-500">
                השתמשתם ב-Rentus? ספרו איך הייתה החוויה. הביקורת עוברת אישור לפני פרסום.
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* מספר העמודות לפי מספר הביקורות + כרטיס ההוספה שתמיד נוסף.
   מחלקות מלאות — Tailwind סורק את הקוד כטקסט. */
const GRID_COLS: Record<number, string> = {
  0: "grid-cols-1",
  1: "grid-cols-1 sm:grid-cols-2",
  2: "grid-cols-1 sm:grid-cols-3",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
