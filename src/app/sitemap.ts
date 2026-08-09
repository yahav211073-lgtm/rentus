import type { MetadataRoute } from "next";
import { seedArticles, seedBusinesses, seedCategories, seedCities } from "@/data/seed";
import { env } from "@/lib/env";

/**
 * מפת אתר.
 *
 * priority ו-changeFrequency נקבעים לפי הערך האמיתי של העמוד ולא
 * "1.0 לכל דבר" — סימון אחיד פשוט מתעלמים ממנו.
 *
 * מה שלא נכנס לכאן במכוון:
 *   · /search על כל צירופי המסננים — תוכן דק, וממילא noindex
 *   · עמודי אדמין ולוח בקרה של עסק
 *   · עסקים שאינם published
 *
 * כשמספר העסקים יעבור 50,000 (המגבלה של גוגל לקובץ יחיד) צריך
 * לפצל לאינדקס מפות אתר. הפיצול הטבעי הוא לפי קטגוריה ראשית.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.siteUrl;
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                    lastModified: now, changeFrequency: "daily",   priority: 1 },
    { url: `${base}/categories`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/blog`,          lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/pricing`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`,         lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/accessibility`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  // קטגוריות ראשיות ותתי-קטגוריות
  const categories: MetadataRoute.Sitemap = seedCategories
    .flatMap((c) => [c, ...(c.children ?? [])])
    .map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      // קטגוריית-על שווה יותר מתת-קטגוריה
      priority: c.parentId ? 0.6 : 0.8,
    }));

  // צירופי קטגוריה × עיר פופולרית — עמודי הנחיתה החזקים באינדקס עסקים
  const cityLandings: MetadataRoute.Sitemap = seedCities
    .filter((city) => city.isPopular)
    .flatMap((city) =>
      seedCategories.slice(0, 8).map((cat) => ({
        url: `${base}/category/${cat.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );

  const businesses: MetadataRoute.Sitemap = seedBusinesses.map((b) => ({
    url: `${base}/business/${b.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    // עסק מדורג היטב עם הרבה ביקורות ראוי לתדירות סריקה גבוהה יותר
    priority: b.reviewCount > 300 ? 0.8 : 0.6,
  }));

  const articles: MetadataRoute.Sitemap = seedArticles.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: a.publishedAt ? new Date(a.publishedAt) : now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...categories, ...cityLandings, ...businesses, ...articles];
}
