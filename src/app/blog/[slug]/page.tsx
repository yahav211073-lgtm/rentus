import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge } from "@/components/ui/Badge";
import { getArticleBySlug, getArticles } from "@/lib/repo/articles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-500"
      >
        <ArrowRight className="h-4 w-4" />
        לכל המדריכים
      </Link>

      {article.categoryName && (
        <Badge variant="accent" size="md" className="mb-4">{article.categoryName}</Badge>
      )}

      <h1 className="mb-4 font-display text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
        {article.title}
      </h1>

      <div className="mb-8 flex items-center gap-3 border-b border-ink-100 pb-8 text-sm text-ink-400">
        {article.authorName && <span>{article.authorName}</span>}
        {article.readingMin && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {article.readingMin} דקות קריאה
            </span>
          </>
        )}
      </div>

      <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-lg">
        <CoverArt seed={article.slug} className="h-full w-full" />
      </div>

      <div className="space-y-5 text-lg leading-relaxed text-ink-700">
        {(article.content ?? [article.excerpt].filter(Boolean) as string[]).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
