import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CategoryRail } from "@/components/home/CategoryRail";
import { BenefitsStrip } from "@/components/home/BenefitsStrip";
import { GuidesSidebar } from "@/components/home/GuidesSidebar";
import { Section, SectionHeading } from "@/components/home/Section";
import { BusinessRail } from "@/components/home/BusinessRail";
import { CompanyListCard } from "@/components/business/CompanyListCard";
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
 * עמוד הבית.
 *
 * בכוונה בלי Partners/Testimonials/Newsletter: אלה סקציות תוכן שיווקי
 * גנרי מהתבנית המקורית. פאנל "מדריכים מומלצים" (GuidesSidebar) כן
 * נכלל — הוא ברפרנס העיצוב וקיים גם /blog אמיתי מאחוריו, לא רק קישוט.
 * סקציית השכנוע לרישום עסק עברה לגמרי ל-/business/register.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: { absolute: `${brand.name} — ${brand.tagline}` },
    description: `${brand.name} הוא מדריך ישראלי לעסקים להשכרה. מצאו ציוד, רכב, חללים, כלים וטכנולוגיה להשכרה בכל הארץ.`,
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

      <Hero categories={categories} cities={cities} />
      <CategoryRail />
      <BenefitsStrip />

      {/* מומלצים — רשת עסקים + פאנל "מדריכים מומלצים" לצידה, בדיוק
          כמו ברפרנס. */}
      <Section className="bg-white">
        <SectionHeading
          eyebrow={`נבחרת ${brand.name}`}
          title="חברות מומלצות"
          subtitle="עסקים שהוגדרו כמומלצים במערכת הניהול. פרטי העסק והדירוג מוצגים בפרופיל המלא."
          action={{ label: "לכל החברות", href: "/search" }}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featured.slice(0, 4).map((b) => <CompanyListCard key={b.id} business={b} />)}
          </div>
          <GuidesSidebar />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <OwnerCtaCard />
          <AdSlot banner={bannerStart} />
          <AdSlot banner={bannerEnd} className="hidden sm:flex" />
        </div>
      </Section>

      {/* פופולריים */}
      <Section className="bg-ink-50">
        <SectionHeading
          eyebrow="הכי מבוקשים"
          title="העסקים עם הכי הרבה ביקורות"
          subtitle="עסקים להשכרה עם פעילות ודירוגים שהוזנו למערכת."
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
            subtitle="מיקומים מקודמים מסומנים באופן ברור כדי לשמור על חוויית חיפוש שקופה."
          />
          <BusinessRail businesses={sponsored} />
        </Section>
      )}

      {/* חדשים */}
      <Section className="bg-white">
        <SectionHeading
          eyebrow={`חדש ב-${brand.name}`}
          title="הצטרפו לאחרונה"
          subtitle="עסקים להשכרה שנוספו לאחרונה ומוכנים לקבל פניות."
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
