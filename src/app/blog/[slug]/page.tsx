import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ArticleCover } from "@/components/home/BlogSection";
import { env } from "@/lib/env";
import { getArticleBySlug, getArticles } from "@/lib/repo/articles";
import { decodeParam, jsonLd } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "המדריך לא נמצא" };

  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt ?? undefined,
      publishedTime: article.publishedAt ?? undefined,
      images: article.coverUrl ? [article.coverUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = (await getArticles(4)).filter((a) => a.slug !== slug).slice(0, 3);
  const paragraphs = article.content ?? [];

  return (
    <>
      <JsonLd
        title={article.title}
        excerpt={article.excerpt}
        coverUrl={article.coverUrl}
        publishedAt={article.publishedAt}
        slug={article.slug}
      />

      <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-500"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          לכל המדריכים
        </Link>

        {article.categoryName && (
          <Badge variant="accent" size="md" className="mb-4">{article.categoryName}</Badge>
        )}

        <h1 className="mb-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mb-6 text-lg leading-relaxed text-ink-500">{article.excerpt}</p>
        )}

        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-ink-100 pb-8 text-sm text-ink-400">
          {article.authorName && <span>{article.authorName}</span>}
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString("he-IL", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </time>
          )}
          {article.readingMin && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {article.readingMin} דקות קריאה
            </span>
          )}
        </div>

        <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-lg">
          <ArticleCover article={article} />
        </div>

        {/* התוכן מרונדר כטקסט ולא כ-HTML. זו לא מגבלה — זה מה שמונע
            הזרקת סקריפט דרך עורך התוכן בניהול. */}
        <div className="space-y-5 text-lg leading-relaxed text-ink-700">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </article>

      {related.length > 0 && (
        <div className="border-t border-ink-100 bg-ink-50">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="mb-5 font-display text-xl text-ink-900">מדריכים נוספים</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((a) => (
                <Link
                  key={a.id}
                  href={`/blog/${a.slug}`}
                  className="group overflow-hidden rounded-lg border border-ink-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <ArticleCover article={a} compact />
                  </div>
                  <p className="line-clamp-2 p-4 text-sm font-bold leading-snug text-ink-800 transition-colors group-hover:text-brand-700">
                    {a.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function JsonLd({
  title, excerpt, coverUrl, publishedAt, slug,
}: {
  title: string; excerpt?: string | null; coverUrl?: string | null;
  publishedAt?: string | null; slug: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt ?? undefined,
    image: coverUrl ?? undefined,
    datePublished: publishedAt ?? undefined,
    mainEntityOfPage: `${env.siteUrl}/blog/${slug}`,
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
  );
}
