import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArticlesManager, type AdminArticle } from "@/components/admin/ArticlesManager";

export const metadata = { title: "ניהול מאמרים", robots: { index: false, follow: false } };

export default async function AdminArticlesPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: articles }, { data: categories }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, slug, title, excerpt, content, cover_url, cover_alt, status, is_featured, reading_min, published_at, category_id")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("article_categories").select("id, name").order("sort_order"),
  ]);

  const items: AdminArticle[] = (articles ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: Array.isArray(a.content) ? (a.content as string[]) : [],
    coverUrl: a.cover_url,
    coverAlt: a.cover_alt,
    status: a.status,
    isFeatured: a.is_featured,
    readingMin: a.reading_min,
    publishedAt: a.published_at,
    categoryId: a.category_id,
  }));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink-900">מאמרים ומדריכים</h1>
      <p className="mb-6 text-sm text-ink-500">
        מאמר במצב ״מפורסם״ מופיע מיד ב-/blog ובעמוד הבית. טיוטה נשמרת אבל אינה גלויה לגולשים.
      </p>
      <ArticlesManager articles={items} categories={categories ?? []} />
    </div>
  );
}
