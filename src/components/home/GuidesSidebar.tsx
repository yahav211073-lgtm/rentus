import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoverArt } from "@/components/ui/CoverArt";
import { getArticles } from "@/lib/repo/articles";

/**
 * "מדריכים מומלצים" — פאנל צר לצד רשת העסקים המומלצים, בדיוק כמו
 * ברפרנס: כותרת, עד שלוש כתבות קומפקטיות עם תמונה ממוזערת, וקישור
 * ל"כל המדריכים" בתחתית. כל כתבה מובילה לעמוד ייעודי משלה ב-/blog/[slug].
 */
export async function GuidesSidebar({ className }: { className?: string }) {
  const articles = (await getArticles()).slice(0, 3);
  if (articles.length === 0) return null;
  const referenceCopy = [
    { title: "איך לבחור חברת השכרת ציוד", excerpt: "מדריך מקיף לבחירת החברה המתאימה" },
    { title: "השכרת מכשירי קשר — המדריך המלא", excerpt: "כל מה שצריך לדעת לפני שמזמינים" },
    { title: "ציוד לאירועים: מה חשוב לדעת?", excerpt: "טיפים לתכנון אירוע מושלם" },
  ];

  return (
    <aside className={`rounded-lg border border-ink-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(11,59,117,0.06)] ${className ?? ""}`}>
      <h3 className="mb-4 font-display text-lg font-extrabold text-ink-900">מדריכים מומלצים</h3>

      <ul className="space-y-4">
        {articles.map((a, index) => (
          <li key={a.id} className="border-b border-ink-100 pb-4 last:border-0 last:pb-0">
            <Link href={`/blog/${a.slug}`} className="group flex items-start gap-3">
              <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
                <CoverArt seed={a.slug} className="h-full w-full" compact />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-snug text-brand-700 line-clamp-2 group-hover:text-brand-500">
                  {referenceCopy[index]?.title ?? a.title}
                </span>
                {a.excerpt && (
                  <span className="mt-1 block text-xs leading-relaxed text-ink-400 line-clamp-2">
                    {referenceCopy[index]?.excerpt ?? a.excerpt}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/blog"
        className="mt-4 flex items-center justify-center gap-1.5 border-t border-ink-100 pt-4 text-sm font-bold text-brand-700 hover:text-brand-500"
      >
        לכל המדריכים
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
}
