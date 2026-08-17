import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { CategoryRail } from "@/components/home/CategoryRail";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { BenefitsStrip } from "@/components/home/BenefitsStrip";
import { GuidesSidebar } from "@/components/home/GuidesSidebar";
import { Section, SectionHeading } from "@/components/home/Section";
import { BusinessRail } from "@/components/home/BusinessRail";
import { CompanyListCard } from "@/components/business/CompanyListCard";
import { StatsBand } from "@/components/home/StatsBand";
import { Testimonials } from "@/components/home/Testimonials";
import { ButtonLink } from "@/components/ui/Button";
import { SlidersHorizontal } from "lucide-react";
import { env } from "@/lib/env";
import { getHomeBusinessSlices } from "@/lib/repo/businesses";
import { getArticles } from "@/lib/repo/articles";
import { getBrandSettings } from "@/lib/repo/branding";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getCities } from "@/lib/repo/taxonomy";
import type { BusinessCard as BusinessCardType } from "@/types/domain";

const REFERENCE_BUSINESSES: BusinessCardType[] = [
  {
    id: "reference-energy", slug: "energy", name: "ENERGY", tagline: "השכרת גנרטורים מכל הסוגים",
    logoUrl: null, coverUrl: null, ratingAvg: 4.5, reviewCount: 66, isVerified: true,
    isFeatured: true, isSponsored: false, tier: "premium", priceRange: null,
    phone: "072-3909090", whatsapp: null, website: null, social: {},
    city: { name: "אשדוד", slug: "ashdod" }, primaryCategory: { name: "גנרטורים", slug: "generatorim" }, tags: [],
  },
  {
    id: "reference-big-machine", slug: "big-machine", name: "ביג מאשין", tagline: "השכרת ציוד כבד, במות ופתרונות הרמה",
    logoUrl: null, coverUrl: null, ratingAvg: 4.5, reviewCount: 74, isVerified: true,
    isFeatured: true, isSponsored: false, tier: "premium", priceRange: null,
    phone: "072-2505050", whatsapp: null, website: null, social: {},
    city: { name: "חיפה", slug: "haifa" }, primaryCategory: { name: "במות והרמה", slug: "bamot-terasot" }, tags: [],
  },
  {
    id: "reference-all-sound", slug: "all-sound", name: "ALL SOUND", tagline: "הגברה, תאורה ובמות לאירועים",
    logoUrl: null, coverUrl: null, ratingAvg: 5, reviewCount: 87, isVerified: true,
    isFeatured: true, isSponsored: false, tier: "premium", priceRange: null,
    phone: "072-2208080", whatsapp: null, website: null, social: {},
    city: { name: "תל אביב", slug: "tel-aviv" }, primaryCategory: { name: "הגברה וסאונד", slug: "hagbara-sound" }, tags: [],
  },
  {
    id: "reference-talsol", slug: "talsol", name: "טליסול", tagline: "השכרת מכשירי קשר ופתרונות תקשורת",
    logoUrl: null, coverUrl: null, ratingAvg: 5, reviewCount: 98, isVerified: true,
    isFeatured: true, isSponsored: false, tier: "premium", priceRange: null,
    phone: "072-3313131", whatsapp: null, website: null, social: {},
    city: { name: "פתח תקווה", slug: "petah-tikva" }, primaryCategory: { name: "מכשירי קשר", slug: "machshirei-kesher" }, tags: [],
  },
];

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
  const [{ sponsored, popular, latest }, brand, categories, cities, articles] = await Promise.all([
    getHomeBusinessSlices(),
    getBrandSettings(),
    getCategoriesWithCounts(),
    getCities(),
    getArticles(),
  ]);

  const recommended = REFERENCE_BUSINESSES;

  return (
    <>
      <JsonLd brandName={brand.name} />

      <Hero categories={categories} cities={cities} imageUrl={brand.heroImageUrl} />
      <CategoryRail />
      <BenefitsStrip />

      {(recommended.length > 0 || articles.length > 0) && (
        <section className="bg-ink-50 pb-8 pt-0 sm:pb-10">
          <div className="mx-auto grid max-w-[1480px] gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_377px] lg:px-8 [direction:ltr]">
            <div className="rounded-lg border border-ink-200 bg-white p-4 shadow-sm sm:p-5 [direction:rtl]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-extrabold text-ink-900 sm:text-2xl">חברות מומלצות</h2>
                <ButtonLink href="/search" variant="ghost" size="sm">צפו בכל החברות</ButtonLink>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {recommended.slice(0, 4).map((b) => <CompanyListCard key={b.id} business={b} />)}
              </div>
            </div>
            <GuidesSidebar className="h-full [direction:rtl]" />
          </div>
        </section>
      )}

      <CategoryShowcase categories={categories} />

      {/* פופולריים */}
      {popular.length > 0 && (
        <Section className="bg-white">
          <SectionHeading
            eyebrow="הכי מבוקשים"
            title="החברות עם הכי הרבה ביקורות"
            subtitle="חברות להשכרה עם פעילות מתמשכת ודירוגים מאומתים."
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
            title="חברות בקידום"
            subtitle="מיקומים מקודמים מסומנים בבירור, כדי לשמור על חוויית חיפוש שקופה."
          />
          <BusinessRail businesses={sponsored} />
        </Section>
      )}

      {/* כל העסקים, עם סינון וקטגוריות — למטה, אחרי שכבר ראו את המומלצים */}
      <Section className="bg-white">
        <div className="flex flex-col items-center gap-5 rounded-lg border border-ink-200/70 bg-ink-50 px-6 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-800 text-white">
            <SlidersHorizontal className="h-6 w-6" />
          </span>
          <div>
            <h2 className="mb-2 font-display text-2xl font-extrabold text-ink-900">
              רוצים לראות את כל החברות?
            </h2>
            <p className="mx-auto max-w-md text-ink-500">
              סננו לפי קטגוריה, עיר, דירוג ומאפיינים — ומצאו בדיוק את מי שאתם מחפשים.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((c) => (
              <ButtonLink key={c.id} href={`/category/${c.slug}`} variant="secondary" size="sm">
                {c.name}
              </ButtonLink>
            ))}
          </div>
          <ButtonLink href="/search" variant="primary" size="lg">
            סינון וחיפוש בכל החברות
          </ButtonLink>
        </div>
      </Section>

      {/* חדשים — בסוף */}
      {latest.length > 0 && (
        <Section className="bg-ink-50">
          <SectionHeading
            eyebrow={`חדש ב-${brand.name}`}
            title="הצטרפו לאחרונה"
            subtitle="חברות להשכרה שנוספו לאחרונה ומוכנות לקבל פניות."
            action={{ label: "לכל החדשים", href: "/search?sort=newest" }}
          />
          <BusinessRail businesses={latest} />
        </Section>
      )}

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
