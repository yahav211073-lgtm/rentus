import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CategoryRail } from "@/components/home/CategoryRail";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { BenefitsStrip } from "@/components/home/BenefitsStrip";
import { GuidesSidebar } from "@/components/home/GuidesSidebar";
import { Section, SectionHeading } from "@/components/home/Section";
import { BusinessRail } from "@/components/home/BusinessRail";
import { CompanyListCard } from "@/components/business/CompanyListCard";
import { AdSlot } from "@/components/home/AdSlot";
import { OwnerCtaCard } from "@/components/home/OwnerCtaCard";
import { StatsBand } from "@/components/home/StatsBand";
import { BlogSection } from "@/components/home/BlogSection";
import { Testimonials } from "@/components/home/Testimonials";
import { env } from "@/lib/env";
import { getHomeBusinessSlices } from "@/lib/repo/businesses";
import { getActiveAds } from "@/lib/repo/ads";
import { getBrandSettings } from "@/lib/repo/branding";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getCities } from "@/lib/repo/taxonomy";

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

  const heroBanner = ads.banners.find((b) => b.placementKey === "home_hero" && b.assetUrl);
  const inlineBanner = ads.banners.find((b) => b.placementKey === "inline_results" && b.assetUrl);

  return (
    <>
      <JsonLd brandName={brand.name} />

      <Hero categories={categories} cities={cities} imageUrl={brand.heroImageUrl} />
      <CategoryRail />
      <BenefitsStrip />

      {/* מומלצים — רשת עסקים + פאנל המדריכים לצידה */}
      {featured.length > 0 && (
        <Section className="bg-white">
          <SectionHeading
            eyebrow={`נבחרת ${brand.name}`}
            title="חברות מומלצות"
            subtitle="עסקים שסומנו כמומלצים במערכת הניהול. הדירוג והביקורות מוצגים בפרופיל המלא."
            action={{ label: "לכל החברות", href: "/search" }}
          />
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featured.slice(0, 4).map((b) => <CompanyListCard key={b.id} business={b} />)}
            </div>
            <GuidesSidebar />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <OwnerCtaCard />
            <AdSlot banner={heroBanner} />
            <AdSlot banner={inlineBanner} className="hidden lg:block" />
          </div>
        </Section>
      )}

      <CategoryShowcase categories={categories} />

      {/* פופולריים */}
      {popular.length > 0 && (
        <Section className="bg-white">
          <SectionHeading
            eyebrow="הכי מבוקשים"
            title="העסקים עם הכי הרבה ביקורות"
            subtitle="עסקים להשכרה עם פעילות מתמשכת ודירוגים מאומתים."
            action={{ label: "לכל התוצאות", href: "/search?sort=reviews" }}
          />
          <BusinessRail businesses={popular} layout="grid" />
        </Section>
      )}

      <StatsBand />

      {/* ממומנים */}
      {sponsored.length > 0 && (
        <Section className="bg-ink-50">
          <SectionHeading
            eyebrow="שיתופי פעולה"
            title="עסקים בקידום"
            subtitle="מיקומים מקודמים מסומנים בבירור, כדי לשמור על חוויית חיפוש שקופה."
          />
          <BusinessRail businesses={sponsored} />
        </Section>
      )}

      {/* חדשים */}
      {latest.length > 0 && (
        <Section className="bg-white">
          <SectionHeading
            eyebrow={`חדש ב-${brand.name}`}
            title="הצטרפו לאחרונה"
            subtitle="עסקים להשכרה שנוספו לאחרונה ומוכנים לקבל פניות."
            action={{ label: "לכל החדשים", href: "/search?sort=newest" }}
          />
          <BusinessRail businesses={latest} />
        </Section>
      )}

      <BlogSection />
      <Testimonials />
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
