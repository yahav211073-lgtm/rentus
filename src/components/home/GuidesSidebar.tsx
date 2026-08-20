import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleCover } from "@/components/home/BlogSection";
import { getArticles } from "@/lib/repo/articles";

/**
 * "מדריכים מומלצים" — פאנל צר לצד רשת החברות.
 *
 * גרסה מקוצרת: כותרת בלבד לכל מדריך, בלי תקציר. התקציר הכפיל את
 * גובה הפאנל וגרם לו לחרוג הרבה מתחת לרשת שלצידו, ובפועל אף אחד
 * לא קורא שתי שורות תקציר בפאנל צד — הכותרת היא ההחלטה. מה שנחסך
 * בגובה הופך למקום למשבצת הפרסום שמתחת.
 *
 * שלושה פריטים בדיוק, ככלל תוכן קבוע של הפרויקט.
 *
 * התמונה עוברת דרך ArticleCover ולא דרך CoverArt ישירות. זה נראה
 * כמו פרט טכני והוא היה באג גלוי: CoverArt מייצר גרפיקה מופשטת
 * מתוך ה-slug, כלומר הפאנל הציג ריבועים כחולים מומצאים בזמן שלכל
 * מאמר יש תמונת שער אמיתית ב-articles.cover_url. ArticleCover בודק
 * קודם את התמונה האמיתית ונופל לגרפיקה רק כשאין — וזו הנפילה
 * היחידה שצריכה להתקיים.
 */
export async function GuidesSidebar({ className }: { className?: string }) {
  const articles = (await getArticles()).slice(0, 3);
  if (articles.length === 0) return null;

  return (
    <aside
      className={`rounded-lg border border-ink-200/80 bg-white p-4 shadow-[0_10px_26px_-18px_rgba(5,25,47,0.45)] ${className ?? ""}`}
    >
      <h2 className="mb-3 font-display text-lg text-ink-900">מדריכים מומלצים</h2>

      <ul className="space-y-2.5">
        {articles.map((a) => (
          <li key={a.id} className="border-b border-ink-100 pb-2.5 last:border-0 last:pb-0">
            <Link href={`/blog/${a.slug}`} className="group flex items-center gap-2.5">
              <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-sm">
                <ArticleCover article={a} compact />
              </span>
              <span className="line-clamp-2 min-w-0 text-xs font-bold leading-[1.35] text-brand-700 transition-colors group-hover:text-brand-500">
                {a.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/blog"
        className="group mt-3 flex items-center justify-center gap-1.5 border-t border-ink-100 pt-3 text-xs font-bold text-brand-700 transition-colors hover:text-brand-500"
      >
        לכל המדריכים
        <ArrowLeft
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </aside>
  );
}
