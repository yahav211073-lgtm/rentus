"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { CategoryThumb } from "@/components/ui/CategoryThumb";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { businessCountLabel } from "@/lib/utils";
import type { CarouselCategory } from "@/components/categories/CategoryCarousel";

/**
 * חיפוש חופשי + רשת כל הקטגוריות (כולל תתי-קטגוריות, שטוחות).
 * הסינון מקומי לגמרי — 13 קטגוריות זה לא נפח שמצדיק בקשת שרת.
 */
export function CategoryGridSearch({ items }: { items: CarouselCategory[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items.filter((c) => c.name.includes(q));
  }, [items, query]);

  return (
    <div>
      <div className="relative mx-auto mb-8 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" style={{ insetInlineStart: "0.875rem" }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש קטגוריה..."
          className="h-12 w-full rounded-full border border-ink-200 bg-white text-base text-ink-900 outline-none transition-colors focus:border-brand-400"
          style={{ paddingInlineStart: "2.75rem", paddingInlineEnd: "1rem" }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white p-10 text-center">
          <SearchX className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="font-bold text-ink-800">לא נמצאה קטגוריה בשם &laquo;{query}&raquo;</p>
        </div>
      ) : (
        <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((cat) => (
            <RevealItem key={cat.id}>
              <Link
                href={`/category/${cat.slug}`}
                className="group flex min-h-44 flex-col justify-between overflow-hidden rounded-xl border border-ink-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_20px_45px_-24px_rgba(11,59,117,.4)]"
              >
                <CategoryThumb
                  imageUrl={cat.imageUrl}
                  icon={cat.icon}
                  name={cat.name}
                  sizes="48px"
                  className="h-12 w-12 rounded-lg transition-colors group-hover:bg-brand-800 group-hover:text-white"
                />
                <span>
                  <span className="block font-display text-lg font-extrabold text-ink-900">{cat.name}</span>
                  <span className="mt-1 block text-xs font-semibold text-ink-400">
                    {businessCountLabel(cat.businessCount)}
                  </span>
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      )}
    </div>
  );
}
