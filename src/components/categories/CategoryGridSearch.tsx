"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { CoverArt } from "@/components/ui/CoverArt";
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
                className="group relative flex aspect-[4/3] w-full overflow-hidden rounded-lg border border-ink-200/70 bg-ink-200"
              >
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imageUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                ) : (
                  <CoverArt seed={cat.slug} label={cat.name.charAt(0)} className="absolute inset-0 h-full w-full" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/25 to-transparent" />
                <span className="relative mt-auto w-full p-4">
                  <span className="block font-display text-lg font-extrabold text-white">{cat.name}</span>
                  <span className="block text-xs font-semibold text-accent-200">
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
