import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { CoverArt } from "@/components/ui/CoverArt";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "כל הקטגוריות",
  description: "כל תחומי ההשכרה — לפי קטגוריה ראשית ותת-קטגוריה.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-extrabold text-ink-900">כל הקטגוריות</h1>
      <p className="mb-10 text-ink-500">בחרו תחום כדי לראות את כל העסקים שלו.</p>

      <div className="space-y-10">
        {categories.map((cat) => (
          <section key={cat.id}>
            <Link href={`/category/${cat.slug}`} className="group mb-4 flex items-center gap-4">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <CoverArt seed={cat.slug} className="h-full w-full" />
                )}
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900 transition-colors group-hover:text-brand-700">
                  {cat.name}
                </h2>
                <p className="text-sm text-ink-500">{formatNumber(cat.businessCount ?? 0)} עסקים</p>
              </div>
              <ArrowLeft className="me-auto h-5 w-5 text-ink-300 transition-transform group-hover:-translate-x-1 group-hover:text-brand-700" />
            </Link>

            {cat.children && cat.children.length > 0 && (
              <div className="flex flex-wrap gap-2 ps-20">
                {cat.children.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/category/${sub.slug}`}
                    className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {sub.name} · {formatNumber(sub.businessCount ?? 0)}
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
