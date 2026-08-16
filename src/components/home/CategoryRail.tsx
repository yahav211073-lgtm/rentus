import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { businessCountLabel } from "@/lib/utils";

/**
 * רצועת הקטגוריות מתחת להירו.
 *
 * הקטגוריות מיוצגות בתמונה ולא באייקון. אייקון קווי גנרי לא מבדיל
 * בין "השכרת אוהלים" ל"ריהוט לאירועים" — התמונה כן, והיא זו שגורמת
 * לרצועה להיראות כמו מוצר ולא כמו תבנית.
 *
 * כרטיס בלי תמונה נופל לרקע צבעוני עם האות הראשונה. זה עדיין נקי,
 * וזה גם סימן ברור למנהל שחסרה שם תמונה.
 */
export async function CategoryRail() {
  const categories = (await getCategoriesWithCounts()).slice(0, 7);

  if (categories.length === 0) return null;

  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        {/* auto-fit ולא מספר עמודות קבוע: כשיש שלוש קטגוריות בלבד,
            רשת של שמונה עמודות משאירה חצי שורה ריקה שנראית כמו באג. */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
        >
          <Link
            href="/categories"
            className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-ink-200/70 bg-ink-50/60 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-[0_10px_24px_-12px_rgba(11,59,117,0.25)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand-800 text-white transition-transform duration-200 group-hover:scale-105">
              <LayoutGrid className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold leading-tight text-ink-900">כל הקטגוריות</span>
            <span className="inline-flex items-center gap-1 text-xs text-ink-400">
              לרשימה המלאה
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-ink-200/70 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_10px_24px_-12px_rgba(11,59,117,0.25)]"
            >
              <span className="relative block aspect-[3/2] w-full overflow-hidden bg-ink-100">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                ) : (
                  <span
                    className="grid h-full w-full place-items-center bg-brand-50 font-display text-2xl font-extrabold text-brand-700"
                    aria-hidden="true"
                  >
                    {cat.name.slice(0, 1)}
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-0.5 p-3 text-center">
                <span className="text-sm font-bold leading-tight text-ink-900 transition-colors group-hover:text-brand-700">
                  {cat.name}
                </span>
                <span className="text-xs text-ink-400">
                  {businessCountLabel(cat.businessCount ?? 0)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
