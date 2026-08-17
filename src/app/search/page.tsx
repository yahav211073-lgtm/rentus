import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { parseSearchParams, searchBusinesses, PAGE_SIZE } from "@/lib/repo/search";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterRail } from "@/components/search/FilterRail";
import { GuidesSidebar } from "@/components/home/GuidesSidebar";
import { SortSelect } from "@/components/search/SortSelect";
import { BusinessCard } from "@/components/business/BusinessCard";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getFlatCategories, getCities } from "@/lib/repo/taxonomy";
import { formatNumber } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * מטא-דאטה דינמית.
 *
 * עמוד חיפוש מסונן הוא noindex בכוונה: אלפי צירופי מסננים יוצרים
 * אלפי עמודים כמעט-זהים, וזו בדיוק ההגדרה של תוכן דק. העמודים
 * שכן נועדו להיאנדקס הם /category/[slug] ו-/business/[slug],
 * שיש להם תוכן ייחודי.
 */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const f = parseSearchParams(await searchParams);

  const parts: string[] = [];
  if (f.q) parts.push(`"${f.q}"`);
  if (f.category) {
    const categories = await getFlatCategories();
    const cat = categories.find((c) => c.slug === f.category);
    if (cat) parts.push(cat.name);
  }
  if (f.city) {
    const cities = await getCities();
    const city = cities.find((c) => c.slug === f.city);
    if (city) parts.push(`ב${city.name}`);
  }

  const title = parts.length ? `חיפוש: ${parts.join(" ")}` : "חיפוש עסקים";
  const hasFilters = Boolean(f.category || f.city || f.tags?.length || f.minRating || f.verifiedOnly);

  return {
    title,
    description: "חיפוש מתקדם בין אלפי עסקים מאומתים — לפי קטגוריה, עיר, דירוג ומאפיינים.",
    robots: { index: !hasFilters && !f.q, follow: true },
    alternates: { canonical: "/search" },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const filters = parseSearchParams(raw);
  const [result, categories, cities] = await Promise.all([
    searchBusinesses(filters),
    getFlatCategories(),
    getCities(),
  ]);

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  return (
    <div className="bg-ink-50 pb-20">
      {/* --- כותרת וחיפוש --- */}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-brand-900 to-brand-700 pb-10 pt-8">
        <div className="bg-dots absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <h1 className="mb-5 font-display text-2xl font-extrabold text-white sm:text-3xl">
            {filters.q ? <>תוצאות עבור &laquo;{filters.q}&raquo;</> : "חיפוש עסקים"}
          </h1>
          <SearchBar variant="compact" defaultQuery={filters.q ?? ""} categories={categories} cities={cities} />
        </div>
      </div>

      <div className="mx-auto max-w-[1480px] px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex gap-7">
          <FilterRail facets={result.facets} total={result.total} categories={categories} cities={cities}>
            <GuidesSidebar />
          </FilterRail>

          <div className="min-w-0 flex-1">
            {/* שורת סיכום ומיון */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-500" aria-live="polite">
                נמצאו <strong className="font-bold text-ink-900">{formatNumber(result.total)}</strong> עסקים
                {result.total > PAGE_SIZE && (
                  <> · עמוד {result.page} מתוך {totalPages}</>
                )}
              </p>
              <SortSelect />
            </div>

            {result.items.length === 0 ? (
              <EmptyState query={filters.q} categories={categories} />
            ) : (
              <>
                <RevealStagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {result.items.map((b, i) => (
                    <RevealItem key={b.id}>
                      <BusinessCard business={b} priority={i === 0} />
                    </RevealItem>
                  ))}
                </RevealStagger>

                {totalPages > 1 && (
                  <Pagination current={result.page} total={totalPages} params={raw} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * מצב ריק.
 *
 * לא "לא נמצאו תוצאות" ותו לא. מצב ריק טוב מציע דרך החוצה —
 * כאן: הסרת מסננים, וקטגוריות פופולריות ללחיצה.
 */
function EmptyState({ query, categories }: { query?: string; categories: { slug: string; name: string; parentId: string | null }[] }) {
  const topLevel = categories.filter((c) => !c.parentId);
  return (
    <div className="rounded-lg border border-dashed border-ink-300 bg-white p-10 text-center sm:p-16">
      <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-ink-100 text-ink-400">
        <SearchX className="h-7 w-7" />
      </span>

      <h2 className="mb-2 font-display text-xl font-bold text-ink-900">
        {query ? <>לא מצאנו עסקים עבור &laquo;{query}&raquo;</> : "אין תוצאות עם המסננים האלה"}
      </h2>
      <p className="mx-auto mb-7 max-w-md text-base leading-relaxed text-ink-500">
        אפשר לנסות מונח כללי יותר, להסיר חלק מהמסננים, או להתחיל מאחת
        הקטגוריות המבוקשות.
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {topLevel.slice(0, 5).map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <ButtonLink href="/search" variant="secondary" size="md">
        ניקוי החיפוש
      </ButtonLink>
    </div>
  );
}

/**
 * דפדוף.
 *
 * קישורים אמיתיים (<a href>) ולא כפתורים — כדי שהם ייסרקו,
 * ייפתחו בטאב חדש, ויעבדו בלי JavaScript.
 */
function Pagination({
  current, total, params,
}: {
  current: number;
  total: number;
  params: Record<string, string | string[] | undefined>;
}) {
  const href = (page: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page" || v == null) continue;
      next.set(k, Array.isArray(v) ? v[0] : v);
    }
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  };

  // חלון של עד 5 עמודים סביב הנוכחי, תמיד עם הראשון והאחרון
  const pages = new Set<number>([1, total]);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const list = [...pages].sort((a, b) => a - b);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="דפדוף בתוצאות">
      {current > 1 && (
        <Link
          href={href(current - 1)}
          rel="prev"
          className="rounded-xs border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          הקודם
        </Link>
      )}

      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && list[i - 1] !== p - 1 && (
            <span className="px-1 text-ink-400" aria-hidden="true">…</span>
          )}
          <Link
            href={href(p)}
            aria-current={p === current ? "page" : undefined}
            className={
              p === current
                ? "grid h-10 min-w-10 place-items-center rounded-xs bg-brand-800 px-3 text-sm font-bold text-white"
                : "grid h-10 min-w-10 place-items-center rounded-xs border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            }
          >
            {p}
          </Link>
        </span>
      ))}

      {current < total && (
        <Link
          href={href(current + 1)}
          rel="next"
          className="rounded-xs border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          הבא
        </Link>
      )}
    </nav>
  );
}
