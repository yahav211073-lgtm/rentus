import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { formatNumber } from "@/lib/utils";

/**
 * רצועת קטגוריות קומפקטית מיד מתחת להירו — כרטיסים שווי-רוחב בשורה
 * אחת, כל אחד עם אייקון, שם ומספר חברות, בדיוק כמו ברפרנס. הכרטיס
 * הראשון הוא תמיד "כל הקטגוריות".
 */
export async function CategoryRail() {
  const categories = (await getCategoriesWithCounts()).slice(0, 7);

  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <Link
            href="/categories"
            className="group flex flex-col items-center gap-2.5 rounded-lg border border-ink-200/70 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_10px_24px_-12px_rgba(11,59,117,0.25)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
              <LayoutGrid className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-sm font-bold leading-tight text-ink-900">כל הקטגוריות</span>
            <span className="text-xs text-ink-400">צפה בכל החברות</span>
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col items-center gap-2.5 rounded-lg border border-ink-200/70 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_10px_24px_-12px_rgba(11,59,117,0.25)]"
            >
              <span className="h-11 w-11 overflow-hidden rounded-lg bg-ink-100">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full bg-brand-50 text-xs font-extrabold text-brand-700" aria-hidden="true">
                    {cat.name.slice(0, 1)}
                  </span>
                )}
              </span>
              <span className="text-sm font-bold leading-tight text-ink-900">{cat.name}</span>
              <span className="text-xs text-ink-400">{formatNumber(cat.businessCount ?? 0)} חברות</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
