import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge } from "@/components/ui/Badge";
import { getBrandSettings } from "@/lib/repo/branding";
import { getArticles } from "@/lib/repo/articles";

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
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-3 font-display text-3xl font-extrabold text-ink-900">מדריכים</h1>
      <p className="mb-10 text-lg leading-relaxed text-ink-600">
        מדריכים מעשיים שנכתבו כדי לחסוך לכם טעויות יקרות — בלי תוכן שיווקי.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/blog/${a.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-ink-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_44px_-16px_rgba(11,59,117,0.2)]"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <CoverArt seed={a.slug} className="h-full w-full" />
              {a.categoryName && (
                <span className="absolute top-4" style={{ insetInlineStart: "1rem" }}>
                  <Badge variant="accent" size="md">{a.categoryName}</Badge>
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2.5 p-5">
              <h2 className="font-display text-lg font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
                {a.title}
              </h2>
              {a.excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">{a.excerpt}</p>}
              {a.readingMin && (
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs text-ink-400">
                  <Clock className="h-3.5 w-3.5" />
                  {a.readingMin} דקות קריאה
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
