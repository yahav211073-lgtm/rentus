import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { businessCountLabel } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

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
    <div className="relative z-20 -mt-12 bg-transparent pb-4">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="flex snap-x gap-3 overflow-x-auto pb-2 [direction:ltr] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-7 lg:overflow-visible">
          <Link
            href="/categories"
            className="group flex min-h-24 min-w-[176px] snap-start items-center justify-center gap-3 rounded-lg border border-ink-200/70 bg-white px-4 py-4 text-center shadow-[0_8px_22px_-12px_rgba(5,25,47,.35)] transition-all hover:-translate-y-1 hover:border-brand-300 lg:min-w-0 [direction:rtl]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-transform duration-200 group-hover:scale-105">
              <LayoutGrid className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="flex flex-col text-start">
              <span className="text-sm font-bold leading-tight text-ink-900">כל הקטגוריות</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400">
                צפו בכל הקטגוריות
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              </span>
            </span>
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex min-h-24 min-w-[176px] snap-start items-center gap-3 overflow-hidden rounded-lg border border-ink-200/70 bg-white px-4 py-3 shadow-[0_8px_22px_-12px_rgba(5,25,47,.35)] transition-all hover:-translate-y-1 hover:border-brand-300 lg:min-w-0 [direction:rtl]"
            >
              <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-ink-50 to-brand-50 text-brand-700">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain p-1 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                  />
                ) : (
                  <CategoryIcon name={cat.icon} className="h-7 w-7" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1 text-start">
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
