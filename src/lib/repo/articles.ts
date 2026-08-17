import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Article } from "@/types/domain";

/**
 * מדריכים.
 *
 * עד עכשיו זו הייתה רשימה קשיחה ב-src/data/seed.ts, למרות שטבלת
 * `articles` קיימת במסד מאז 0005. זה בדיוק סוג הפער שגרם לתחושה
 * שהניהול והאתר לא מסונכרנים: לא היה שום מקום לערוך את התוכן הזה,
 * ולכן שום עריכה לא הופיעה. עכשיו המקור היחיד הוא המסד, והעריכה
 * נעשית ב-/admin/articles.
 *
 * גוף הכתבה נשמר כמערך פסקאות ב-jsonb. פורמט פשוט בכוונה — הוא
 * מרונדר כטקסט ולא כ-HTML, ולכן אין דרך להזריק סקריפט דרך עורך
 * התוכן.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const SELECT = `
  id, slug, title, excerpt, content, cover_url, cover_alt,
  reading_min, published_at, status, is_featured,
  category:article_categories(name),
  author:profiles(full_name)
`;

function toParagraphs(content: unknown): string[] {
  if (Array.isArray(content)) return content.map((p) => String(p)).filter(Boolean);
  if (typeof content === "string") return content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return [];
}

function mapArticle(row: Row): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: toParagraphs(row.content),
    coverUrl: row.cover_url,
    coverAlt: row.cover_alt ?? row.title,
    categoryName: row.category?.name ?? null,
    authorName: row.author?.full_name ?? null,
    readingMin: row.reading_min,
    publishedAt: row.published_at,
  };
}

/**
 * עטוף ב-cache(): נקרא גם מהעמוד שמארח את GuidesSidebar (כדי לדעת
 * אם להציג את הסקשן בכלל) וגם מ-GuidesSidebar עצמו — בלי דה-דופליקציה
 * זו אותה שאילתה רצה פעמיים ברצף.
 */
export const getArticles = cache(async (limit = 24): Promise<Article[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  return (data ?? []).map(mapArticle);
});

/**
 * עטוף ב-cache(): נקרא גם מ-generateMetadata וגם מגוף העמוד
 * ב-blog/[slug] עם אותו slug באותה בקשה — בלי דה-דופליקציה זו
 * שאילתת Supabase רצה פעמיים ברצף (ראו התיקון הזהה ב-getBusinessBySlug).
 */
export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data ? mapArticle(data) : null;
});

/**
 * זמן קריאה משוער.
 * מחושב פעם אחת בשמירה ולא בכל הצגה — 200 מילים לדקה זו ההערכה
 * המקובלת לעברית, ומשך של פחות מדקה מעוגל לדקה כי "0 דקות קריאה"
 * נראה כמו באג.
 */
export function estimateReadingMinutes(paragraphs: string[]): number {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
