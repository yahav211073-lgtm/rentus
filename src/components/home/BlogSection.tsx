import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoverArt } from "@/components/ui/CoverArt";
import { getArticles } from "@/lib/repo/articles";
import type { Article } from "@/types/domain";

/**
 * מודול המדריכים.
 *
 * שלושה כרטיסים שווים בשורה — לא כרטיס ראשי ושניים משניים. זה כלל
 * תוכן קבוע של הפרויקט ולא בחירת פריסה: אותו מודול חוזר בעמוד הבית,
 * בעמוד הקטגוריה ובעמוד העסק, ובכל אחד מהם בדיוק שלושה פריטים. פריסה
 * אחת לכולם היא מה שמאפשר לזה להיות מודול ולא שלוש וריאציות.
 *
 * הכרטיס אופקי: תמונה בצד וטקסט לצידה. אנכי היה דורש גובה כפול
 * לאותו מידע, והמודול הזה יושב תמיד ליד תוכן אחר ולא לבדו.
 *
 * כשאין מאמרים מפורסמים המודול לא מרונדר. כותרת מעל אזור ריק גרועה
 * מהיעדר הסקציה.
 */
export async function BlogSection() {
  const articles = await getArticles(3);
  if (articles.length === 0) return null;

  return (
    <section className="bg-ink-50 pt-8 sm:pt-10">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink-900 sm:text-3xl">
            מדריכים וטיפים
          </h2>
          <Link
            href="/blog"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
          >
            לכל המדריכים
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex gap-3 overflow-hidden rounded-lg border border-ink-200/80 bg-white p-3 shadow-[0_10px_26px_-18px_rgba(5,25,47,0.45)] transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_18px_34px_-18px_rgba(5,25,47,0.4)]"
    >
      <span className="relative block h-[104px] w-[124px] shrink-0 overflow-hidden rounded-md bg-ink-100">
        <span className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108">
          <ArticleCover article={article} compact />
        </span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col py-0.5">
        {article.categoryName && (
          <span className="mb-1 block text-2xs font-bold tracking-wide text-brand-600">
            {article.categoryName}
          </span>
        )}

        <span className="line-clamp-2 block text-sm font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-700">
          {article.title}
        </span>

        {article.excerpt && (
          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-ink-500">
            {article.excerpt}
          </span>
        )}

        <span className="mt-auto flex items-center gap-2 pt-2 text-2xs text-ink-400">
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          )}
          {article.publishedAt && article.readingMin && <span aria-hidden="true">·</span>}
          {article.readingMin && <span>{article.readingMin} דק׳ קריאה</span>}
          <span className="ms-auto inline-flex items-center gap-1 font-bold text-brand-700">
            קרא עוד
            <ArrowLeft
              className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </span>
      </span>
    </Link>
  );
}

/* תאריך מספרי קצר. בכרטיס ברוחב 124px טקסט כמו "12 במאי 2025" נשבר
   לשתי שורות ודוחף את שורת המטא — הפורמט הקצר נשאר בשורה אחת. */
function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** תמונת שער אמיתית כשיש; אחרת גרפיקה יציבה שנגזרת מה-slug. */
export function ArticleCover({ article, compact }: { article: Article; compact?: boolean }) {
  if (article.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={article.coverUrl}
        alt={article.coverAlt ?? ""}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }
  return <CoverArt seed={article.slug} className="h-full w-full" compact={compact} />;
}
