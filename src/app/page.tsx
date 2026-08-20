import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { CategoryRail } from "@/components/home/CategoryRail";
import { BenefitsStrip } from "@/components/home/BenefitsStrip";
import { CompanyListCard } from "@/components/business/CompanyListCard";
import { StatsBand } from "@/components/home/StatsBand";
import { env } from "@/lib/env";
import { getHomeBusinessSlices } from "@/lib/repo/businesses";
import { getBrandSettings } from "@/lib/repo/branding";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getCities } from "@/lib/repo/taxonomy";
import { getActiveAds } from "@/lib/repo/ads";
import { GuidesSidebar } from "@/components/home/GuidesSidebar";
import { AdSlot } from "@/components/home/AdSlot";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { jsonLd } from "@/lib/utils";

/**
 * עמוד הבית.
 *
 * סדר הסקציות בנוי סביב שאלה אחת: מה הגולש צריך כדי להתקדם.
 *   חיפוש → קטגוריות → עסקים מומלצים → למה לסמוך עלינו →
 *   פופולריים → מדריכים → ביקורות על האתר.
 *
 * סקציה שאין לה תוכן אמיתי לא מרונדרת בכלל (מומלצים, ממומנים,
 * מדריכים, ביקורות). כותרת סקציה מעל אזור ריק גרועה מהיעדר הסקציה.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: { absolute: `${brand.name} — ${brand.tagline}` },
    description: `${brand.name} הוא מדריך ישראלי לחברות להשכרה. מצאו ציוד, רכב, חללים, כלים וטכנולוגיה להשכרה בכל הארץ.`,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [{ topRated, featured }, brand, categories, cities, ads] = await Promise.all([
    getHomeBusinessSlices(),
    getBrandSettings(),
    getCategoriesWithCounts(),
    getCities(),
    getActiveAds(),
  ]);

  /* "מומלצות" = מקודמות ידנית, ואחריהן המדורגות גבוה. הסינון מוודא
     שעסק שנמצא בשתי הרשימות לא ייספר פעמיים. ההדמיה מציגה ארבע. */
  const recommended = [...featured, ...topRated]
    .filter((b, i, all) => all.findIndex((c) => c.id === b.id) === i)
    .slice(0, 4);

  const adStart = ads.banners.find((b) => b.placementKey === "side_start" && b.isActive);
  const adEnd = ads.banners.find((b) => b.placementKey === "side_end" && b.isActive);
  const adSidebar = ads.banners.find((b) => b.placementKey === "home_sidebar" && b.isActive);

  return (
    <>
      <JsonLd brandName={brand.name} />

      <Hero
        categories={categories}
        cities={cities}
        imageUrl={brand.heroImageUrl}
        adStart={adStart}
        adEnd={adEnd}
      />
      <CategoryRail />
      <BenefitsStrip />

      {/* ---- חברות מומלצות + סיידבר מדריכים ----
          שורה אחת בהדמיה, ולכן רשת אחת ולא שתי סקציות: הסיידבר
          צריך להיות באותו גובה כמו העמודה שלצידו, וזה מה שרשת
          אחת נותנת בחינם. */}
      {recommended.length > 0 && (
        <section className="bg-ink-50 pt-4">
          <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              {/* עמודת הצד: מדריכים ומתחתיהם משבצת פרסום מרובעת.
                  קיצור המדריכים הוא מה שפינה את המקום לזה — קודם
                  הפאנל לבדו היה גבוה מהרשת שלצידו. */}
              <div className="flex flex-col gap-4">
                <GuidesSidebar />
                <AdSlot banner={adSidebar} />
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-ink-200/80 bg-white p-4 shadow-[0_10px_26px_-18px_rgba(5,25,47,0.45)] sm:p-5">
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <h2 className="font-display text-2xl text-ink-900 sm:text-3xl">
                      חברות מומלצות
                    </h2>
                    <Link
                      href="/search"
                      className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
                    >
                      צפו בכל החברות
                      <ArrowLeft
                        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>

                  {/* מספר העמודות נגזר ממספר הכרטיסים בפועל. רשת של
                      ארבע עם שני כרטיסים משאירה שני חורים לבנים, וזה
                      נקרא כתקלה ולא כאתר עם מעט תוכן. */}
                  <div className={`grid gap-3 ${RECOMMENDED_COLS[recommended.length] ?? RECOMMENDED_COLS[4]}`}>
                    {recommended.map((b) => (
                      <CompanyListCard key={b.id} business={b} />
                    ))}
                  </div>
                </div>

                {/* רצועת המספרים יושבת בתוך העמודה הראשית ומיושרת עם
                    רשת הכרטיסים שמעליה — כמו בהדמיה, ולא כפס שנוגע
                    בקצות המסך. */}
                <StatsBand />
              </div>
            </div>
          </div>
        </section>
      )}

      <ReviewsSection />

      {/* ריווח תחתון לפני הפוטר. יושב כאן ולא כ-padding על כל סקציה,
          כדי שהמרווח בין הרצועות יישאר אחיד לאורך כל העמוד. */}
      <div className="h-10 bg-ink-50 sm:h-12" />
    </>
  );
}

/* מחלקות מלאות ולא מחרוזת מורכבת: Tailwind סורק את הקוד כטקסט,
   ו-`lg:grid-cols-${n}` פשוט לא ייוצר. */
const RECOMMENDED_COLS: Record<number, string> = {
  1: "grid-cols-1 sm:max-w-xs",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

/**
 * נתונים מובנים לעמוד הבית: Organization ו-WebSite עם SearchAction
 * (מה שנותן לגוגל את תיבת החיפוש בתוך תוצאת החיפוש).
 */
function JsonLd({ brandName }: { brandName: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${env.siteUrl}/#organization`,
        name: brandName,
        url: env.siteUrl,
        description: `${brandName} — מדריך ההשכרות המוביל בישראל`,
        areaServed: { "@type": "Country", name: "ישראל" },
      },
      {
        "@type": "WebSite",
        "@id": `${env.siteUrl}/#website`,
        url: env.siteUrl,
        name: brandName,
        inLanguage: "he-IL",
        publisher: { "@id": `${env.siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${env.siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
    />
  );
}
