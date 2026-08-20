import { Quote, UserRound } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { Rating } from "@/components/ui/Rating";
import { SiteReviewForm } from "@/components/home/SiteReviewForm";
import { getApprovedTestimonials, getTestimonialStats } from "@/lib/repo/testimonials";
import { getCurrentUser } from "@/lib/auth";

/**
 * ביקורות על הפלטפורמה.
 *
 * המקור הוא טבלת testimonials, ומוצגות רק ביקורות שאושרו ב-
 * /admin/testimonials. אין כאן ציטוטים כתובים מראש: המלצה בדויה
 * בשם אדם שלא קיים היא בדיוק מה שהופך סקציית המלצות לחסרת ערך,
 * וכשאין עדיין ביקורות עדיף להזמין לכתוב אחת.
 *
 * פריסת masonry (עמודות CSS) ולא רשת שווה — ציטוטים באורכים שונים
 * ברשת שווה יוצרים שטח לבן מביך בתחתית הכרטיסים הקצרים.
 */
export async function Testimonials() {
  const [items, stats, user] = await Promise.all([
    getApprovedTestimonials(6),
    getTestimonialStats(),
    getCurrentUser(),
  ]);

  return (
    <Section className="bg-white">
      <SectionHeading
        eyebrow="מה אומרים עלינו"
        title={
          stats.count > 0
            ? `${stats.avg} מתוך 5 על סמך ${stats.count} ביקורות`
            : "ביקורות על הפלטפורמה"
        }
        subtitle="כל ביקורת נכתבת מחשבון מזוהה ועוברת בדיקה לפני שהיא מתפרסמת."
        align="center"
      />

      {items.length > 0 && (
        <RevealStagger className="mb-10 columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {items.map((t) => (
            <RevealItem key={t.id}>
              <figure className="group relative overflow-hidden rounded-lg border border-ink-200/70 bg-ink-50/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-[0_20px_44px_-16px_rgba(11,59,117,0.2)]">
                <Quote
                  className="absolute h-16 w-16 text-brand-100 transition-transform duration-500 group-hover:scale-110"
                  style={{ insetInlineEnd: "-8px", top: "-8px" }}
                  aria-hidden="true"
                />

                {t.rating && <Rating value={t.rating} size="sm" showValue={false} variant="stars" className="mb-4" />}

                <blockquote className="relative mb-5 text-base leading-relaxed text-ink-700">
                  {t.quote}
                </blockquote>

                <figcaption className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-400"
                  >
                    <UserRound className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-bold text-ink-800">{t.authorName}</span>
                    {t.authorRole && <span className="text-xs text-ink-400">{t.authorRole}</span>}
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealStagger>
      )}

      <div className="mx-auto max-w-xl">
        <SiteReviewForm
          currentUserName={user?.fullName ?? user?.email ?? null}
          hasReviews={items.length > 0}
        />
      </div>
    </Section>
  );
}
