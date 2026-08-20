import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ArticleCover } from "@/components/home/BlogSection";
import { getBrandSettings } from "@/lib/repo/branding";
import { getArticles } from "@/lib/repo/articles";
import { InteriorHero } from "@/components/layout/InteriorHero";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: "מדריכים",
    description: `מדריכים מעשיים לפני שמזמינים ציוד או שוכרים חברה, מ-${brand.name}.`,
    alternates: { canonical: "/blog" },
  };
}

export default async function BlogIndexPage() {
  const articles = await getArticles();

  return (
    <div className="bg-ink-50 pb-20">
      <InteriorHero
        eyebrow="הידע של Rentus"
        title="מדריכים מקצועיים להשכרה חכמה"
        description="כל המאמרים שפורסמו במערכת — מידע מעשי שעוזר לבחור ציוד וחברה בלי טעויות יקרות."
        compact
      />
      <div className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-6">

      {articles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 px-6 py-16 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-ink-800">עדיין אין מדריכים מפורסמים</p>
          <p className="mt-1 text-sm text-ink-500">המדריכים הראשונים יעלו כאן בקרוב.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/blog/${a.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-ink-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_44px_-16px_rgba(11,59,117,0.2)]"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <div className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                  <ArticleCover article={a} />
                </div>
                {a.categoryName && (
                  <span className="absolute top-4" style={{ insetInlineStart: "1rem" }}>
                    <Badge variant="accent" size="md">{a.categoryName}</Badge>
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <h2 className="font-display text-lg leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
                  {a.title}
                </h2>
                {a.excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{a.excerpt}</p>}
                {a.readingMin && (
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs text-ink-400">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {a.readingMin} דקות קריאה
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
