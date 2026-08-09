import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge } from "@/components/ui/Badge";
import { seedArticles } from "@/data/seed";

/**
 * מדריכים.
 *
 * הכתבה הראשונה מקבלת כרטיס גדול והשאר קטנים. רשת של שלושה
 * כרטיסים זהים לא אומרת למשתמש במה להתחיל; היררכיה כן.
 */
export function BlogSection() {
  const [lead, ...rest] = seedArticles;
  if (!lead) return null;

  return (
    <Section className="bg-white">
      <SectionHeading
        eyebrow="מדריכים"
        title="לפני שבוחרים — כדאי לקרוא"
        subtitle="מדריכים מעשיים שנכתבו עם בעלי מקצוע, בלי תוכן שיווקי."
        action={{ label: "לכל המדריכים", href: "/blog" }}
      />

      <RevealStagger className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* כתבה ראשית */}
        <RevealItem>
          <Link
            href={`/blog/${lead.slug}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-ink-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_24px_50px_-18px_rgba(11,59,117,0.24)]"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <div className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]">
                <CoverArt seed={lead.slug} className="h-full w-full" />
              </div>
              {lead.categoryName && (
                <span className="absolute top-4" style={{ insetInlineStart: "1rem" }}>
                  <Badge variant="accent" size="md">{lead.categoryName}</Badge>
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-6">
              <h3 className="font-display text-xl font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-700 sm:text-2xl">
                {lead.title}
              </h3>
              {lead.excerpt && (
                <p className="text-base leading-relaxed text-ink-500">{lead.excerpt}</p>
              )}
              <ArticleMeta readingMin={lead.readingMin} author={lead.authorName} />
            </div>
          </Link>
        </RevealItem>

        {/* כתבות משניות */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {rest.map((a) => (
            <RevealItem key={a.id}>
              <Link
                href={`/blog/${a.slug}`}
                className="group flex h-full gap-4 overflow-hidden rounded-lg border border-ink-200/70 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_40px_-16px_rgba(11,59,117,0.2)]"
              >
                <div className="relative w-28 shrink-0 overflow-hidden rounded-sm sm:w-32">
                  <CoverArt seed={a.slug} className="h-full w-full" compact />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
                  {a.categoryName && (
                    <span className="text-2xs font-bold uppercase tracking-wide text-brand-600">
                      {a.categoryName}
                    </span>
                  )}
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
                    {a.title}
                  </h3>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-xs text-ink-400">
                    <Clock className="h-3.5 w-3.5" />
                    {a.readingMin} דקות קריאה
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}

          <RevealItem>
            <Link
              href="/blog"
              className="group flex items-center justify-between gap-3 rounded-lg border border-dashed border-ink-300 p-5 transition-all duration-300 hover:border-brand-400 hover:bg-brand-50"
            >
              <span className="text-sm font-bold text-ink-600 group-hover:text-brand-700">
                עוד 48 מדריכים בארכיון
              </span>
              <ArrowLeft className="h-4 w-4 text-ink-400 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-brand-600" />
            </Link>
          </RevealItem>
        </div>
      </RevealStagger>
    </Section>
  );
}

function ArticleMeta({ readingMin, author }: { readingMin?: number | null; author?: string | null }) {
  return (
    <div className="mt-auto flex items-center gap-3 border-t border-ink-100 pt-4 text-xs text-ink-400">
      {author && <span>{author}</span>}
      {readingMin && (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {readingMin} דקות קריאה
          </span>
        </>
      )}
    </div>
  );
}
