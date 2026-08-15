import { seedArticles } from "@/data/seed";
import type { Article } from "@/types/domain";

/**
 * מדריכים.
 *
 * אין עדיין טבלת articles ב-Supabase — זה תוכן עורכי שנכתב ידנית,
 * לא נתון עסקי. עד שיוקם ממשק ניהול ייעודי, המקור היחיד הוא
 * src/data/seed.ts (ראו ar1/ar2/ar3 שם), בדיוק כמו שאר ה-seed שנופל
 * חזרה כשאין חיבור למסד נתונים.
 */
export async function getArticles(): Promise<Article[]> {
  return seedArticles;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return seedArticles.find((a) => a.slug === slug) ?? null;
}
