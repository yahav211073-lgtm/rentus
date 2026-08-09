import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { Partners } from "@/components/home/Partners";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { Section, SectionHeading } from "@/components/home/Section";
import { BusinessRail } from "@/components/home/BusinessRail";
import { StatsBand } from "@/components/home/StatsBand";
import { BusinessCta } from "@/components/home/BusinessCta";
import { Testimonials } from "@/components/home/Testimonials";
import { FaqSection } from "@/components/home/FaqSection";
import { BlogSection } from "@/components/home/BlogSection";
import { Newsletter } from "@/components/home/Newsletter";
import { seedBusinesses, seedFaq } from "@/data/seed";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "אינדקס — כל העסקים בישראל במקום אחד",
  description:
    "אלפי בעלי מקצוע מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר. מצאו את העסק הנכון בדקות, בכל תחום ובכל עיר.",
  alternates: { canonical: "/" },
};

/**
 * עמוד הבית.
 *
 * סדר הסקציות כאן קבוע בקוד לצורך העמוד הראשוני. בגרסה המחוברת
 * ל-Supabase הוא נקרא מטבלת homepage_sections לפי sort_order,
 * כך שהמנהל יכול לשנות סדר ולכבות סקציות בלי דיפלוי —
 * ראו את ההערה בקובץ המיגרציה 0005_content.sql.
 *
 * הקצב הוויזואלי מכוון: כהה (הירו) → לבן (שותפים) → אפור בהיר
 * (קטגוריות) → לבן (מומלצים) → כהה (מספרים) → לבן → אפור → כהה.
 * החלפת הרקע היא מה שמונע מעמוד באורך הזה להרגיש כמו גלילה אחת
 * ארוכה של אותו דבר.
 */
export default function HomePage() {
  const featured = seedBusinesses.filter((b) => b.isFeatured);
  const sponsored = seedBusinesses.filter((b) => b.isSponsored);
  const popular = [...seedBusinesses].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
  const latest = [...seedBusinesses].reverse().slice(0, 8);

  return (
    <>
      <JsonLd faqItems={seedFaq} />

      <Hero />
      <Partners />
      <CategoryShowcase />

      {/* מומלצים */}
      <Section className="bg-white">
        <SectionHeading
          eyebrow="נבחרת האינדקס"
          title="עסקים מומלצים החודש"
          subtitle="נבחרו לפי דירוג, כמות ביקורות ומהירות מענה לפניות — לא לפי תשלום."
          action={{ label: "לכל המומלצים", href: "/search?sort=rating" }}
        />
        <BusinessRail businesses={featured} emphasis />
      </Section>

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
      <BusinessCta />

      {/* ממומנים */}
      <Section className="bg-ink-50">
        <SectionHeading
          eyebrow="שיתופי פעולה"
          title="עסקים בקידום"
          subtitle="התוכן הזה ממומן. סימנו אותו כדי שתדעו — הדירוגים והביקורות עדיין אמיתיים."
        />
        <BusinessRail businesses={sponsored} />
      </Section>

      {/* חדשים */}
      <Section className="bg-white">
        <SectionHeading
          eyebrow="חדש באינדקס"
          title="הצטרפו החודש"
          subtitle="עסקים שעברו אימות והצטרפו לאחרונה. שווה להיות מהראשונים שממליצים."
          action={{ label: "לכל החדשים", href: "/search?sort=newest" }}
        />
        <BusinessRail businesses={latest} />
      </Section>

      <Testimonials />
      <BlogSection />
      <FaqSection items={seedFaq} />
      <Newsletter />
    </>
  );
}

/**
 * נתונים מובנים לעמוד הבית.
 *
 * שלושה סוגים: Organization (מי אנחנו), WebSite עם SearchAction
 * (מה שנותן לגוגל את תיבת החיפוש בתוך תוצאת החיפוש), ו-FAQPage
 * מאותם נתונים שמוצגים בסקציית השאלות — אסור שיהיה פער ביניהם,
 * זו הפרה של הנחיות גוגל.
 */
function JsonLd({ faqItems }: { faqItems: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${env.siteUrl}/#organization`,
        name: "אינדקס",
        url: env.siteUrl,
        description: "אינדקס העסקים המוביל בישראל",
        areaServed: { "@type": "Country", name: "ישראל" },
      },
      {
        "@type": "WebSite",
        "@id": `${env.siteUrl}/#website`,
        url: env.siteUrl,
        name: "אינדקס",
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
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
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
