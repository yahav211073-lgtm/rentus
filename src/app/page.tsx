import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { Section, SectionHeading } from "@/components/home/Section";
import { BusinessRail } from "@/components/home/BusinessRail";
import { BusinessCard } from "@/components/business/BusinessCard";
import { AdSlot } from "@/components/home/AdSlot";
import { OwnerCtaCard } from "@/components/home/OwnerCtaCard";
import { StatsBand } from "@/components/home/StatsBand";
import { env } from "@/lib/env";
import { getHomeBusinessSlices } from "@/lib/repo/businesses";
import { getActiveAds } from "@/lib/repo/ads";
import { getBrandSettings } from "@/lib/repo/branding";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getCities } from "@/lib/repo/taxonomy";

/**
 * עמוד הבית — נטו עסקים.
 *
 * בכוונה בלי Partners/Testimonials/Blog/Newsletter: אלה סקציות תוכן
 * שיווקי גנרי מהתבנית המקורית, ולא מה שהבקשה המפורשת הייתה ("בדף
 * הראשי צריך להיות נטו עסקים"). סקציית השכנוע לרישום עסק עברה
 * לגמרי ל-/business/register.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: { absolute: `${brand.name} — ${brand.tagline}` },
    description: `מאות עסקים מאומתים ב-${brand.name}, ביקורות אמיתיות והשוואת הצעות מחיר. מצאו בדיוק את מה שאתם צריכים להשכיר.`,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [{ featured, sponsored, popular, latest }, ads, brand, categories, cities] = await Promise.all([
    getHomeBusinessSlices(),
    getActiveAds(),
    getBrandSettings(),
    getCategoriesWithCounts(),
    getCities(),
  ]);

  const bannerStart = ads.banners.find((b) => b.placementKey === "side_start");
  const bannerEnd = ads.banners.find((b) => b.placementKey === "side_end");

  return (
    <>
      <JsonLd brandName={brand.name} />

      <Hero categories={categories} cities={cities} brandName={brand.name} />

      {/* מומלצים — ממש מתחת להירו, עם משבצות פרסום בזרימת העמוד משני
          הצדדים, כמו בהדמיה: עמודת ימין = כרטיס "בעל עסק" + משבצת
          פרסום, עמודת שמאל = משבצת פרסום. במובייל שתי העמודות יורדות
          מתחת לרשת העסקים במקום להיעלם. */}
      <Section className="bg-white">
        <SectionHeading
          eyebrow={`נבחרת ${brand.name}`}
          title="עסקים מומלצים"
          subtitle="נבחרו לפי דירוג, כמות ביקורות ומהירות מענה לפניות — לא לפי תשלום."
          action={{ label: "לכל העסקים", href: "/search" }}
        />
        <div className="grid gap-5 lg:grid-cols-[220px_1fr_220px]">
          <div className="hidden flex-col gap-5 lg:flex">
            <OwnerCtaCard />
            <AdSlot banner={bannerStart} className="flex-1" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featured.slice(0, 4).map((b) => <BusinessCard key={b.id} business={b} emphasis />)}
          </div>
          <AdSlot banner={bannerEnd} className="hidden lg:flex" />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:hidden">
          <OwnerCtaCard />
          <AdSlot banner={bannerEnd ?? bannerStart} />
        </div>
      </Section>

      <CategoryShowcase />

      {/* פופולריים */}
      <Section className="bg-ink-50">
        <SectionHeading
          eyebrow="הכי מבוקשים"
          title="העסקים עם הכי הרבה ביקורות"
          subtitle="כשמאות אנשים כבר טרחו לכתוב ביקורת, זה אומר משהו."
          action={{ label: "לכל התוצאות", href: "/search?sort=reviews" }}
        />
        <BusinessRail businesses={popular} layout="grid" />
      </Section>

      <StatsBand />

      {/* ממומנים */}
      {sponsored.length > 0 && (
        <Section className="bg-ink-50">
          <SectionHeading
            eyebrow="שיתופי פעולה"
            title="עסקים בקידום"
            subtitle="התוכן הזה ממומן. סימנו אותו כדי שתדעו — הדירוגים והביקורות עדיין אמיתיים."
          />
          <BusinessRail businesses={sponsored} />
        </Section>
      )}

      {/* חדשים */}
      <Section className="bg-white">
        <SectionHeading
          eyebrow={`חדש ב-${brand.name}`}
          title="הצטרפו לאחרונה"
          subtitle="עסקים שעברו אימות והצטרפו לאחרונה. שווה להיות מהראשונים שממליצים."
          action={{ label: "לכל החדשים", href: "/search?sort=newest" }}
        />
        <BusinessRail businesses={latest} />
      </Section>
    </>
  );
}

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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
