import type { Metadata } from "next";
import { Star } from "lucide-react";
import { SiteReviewForm } from "@/components/home/SiteReviewForm";
import { getCurrentUser } from "@/lib/auth";
import { getApprovedTestimonials } from "@/lib/repo/testimonials";
import { getBrandSettings } from "@/lib/repo/branding";

/**
 * "ביקורת על האתר" — עמוד ייעודי.
 *
 * הטופס ישב קודם בתוך סקציית ההמלצות בעמוד הבית. עמוד הבית שוחזר
 * לפי ההדמיה, ואין בה סקציית המלצות — כלומר הפיצ'ר נשאר בנוי אבל
 * בלתי נגיש. עמוד משלו פותר את שניהם: ההעתק של עמוד הבית נשאר נאמן,
 * והביקורת מקבלת כתובת שאפשר לקשר אליה מהפוטר, ממייל או מהודעה.
 *
 * הצנרת עצמה כבר קיימת ולא שונתה: הטופס פונה ל-/api/site-reviews,
 * שדורש חשבון מחובר ושומר תמיד status='pending', והביקורת מופיעה
 * לאישור ב-/admin/testimonials. אין דרך לפרסם ביקורת בלי מודרציה —
 * זה נאכף גם ב-API וגם ב-with check של המדיניות במסד.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: `ביקורת על ${brand.name}`,
    description: `ספרו לנו איך הייתה החוויה שלכם ב-${brand.name}. הביקורות עוברות אישור לפני פרסום.`,
    alternates: { canonical: "/review" },
  };
}

export default async function SiteReviewPage() {
  const [user, testimonials, brand] = await Promise.all([
    getCurrentUser(),
    getApprovedTestimonials(),
    getBrandSettings(),
  ]);

  return (
    <div className="bg-ink-50 py-10 sm:py-14">
      <div className="mx-auto max-w-[720px] px-4 sm:px-6">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
            <Star className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mb-2 font-display text-2xl text-ink-900 sm:text-3xl">
            ביקורת על {brand.name}
          </h1>
          <p className="mx-auto max-w-[46ch] text-base leading-relaxed text-ink-500">
            מצאתם מה שחיפשתם? משהו לא עבד? הביקורת נקראת על ידינו ועוברת אישור
            לפני שהיא מתפרסמת באתר.
          </p>
        </div>

        <SiteReviewForm
          currentUserName={user?.fullName ?? null}
          hasReviews={testimonials.length > 0}
        />
      </div>
    </div>
  );
}
