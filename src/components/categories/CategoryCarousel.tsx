"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { businessCountLabel } from "@/lib/utils";

export interface CarouselCategory {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  icon?: string | null;
  businessCount: number;
}

/**
 * סליידר לופ בין כל הקטגוריות.
 *
 * "לופ" פירושו שאין קצה: מהאחרונה חוזרים לראשונה ולהפך, בדיוק כמו
 * שרואים ברפרנס. במקום לגלול תוכן אמיתי (שדורש רוחב תוכן שמשתנה
 * לפי כמות הקטגוריות), מחזיקים אינדקס התחלה ומציגים ממנו חלון קבוע
 * של פריטים — כך שהמעבר בין "אחרון" ל"ראשון" הוא באמת מיידי, לא
 * גלילה ארוכה חזרה להתחלה.
 */
export function CategoryCarousel({ items }: { items: CarouselCategory[] }) {
  const reduced = useReducedMotion();
  const [perView, setPerView] = useState(3);
  const [start, setStart] = useState(0);

  useEffect(() => {
    const update = () => setPerView(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    setStart((s) => (s + dir + items.length) % items.length);
  }, [items.length]);

  if (items.length === 0) return null;

  const visible = Array.from({ length: Math.min(perView, items.length) }, (_, i) => items[(start + i) % items.length]);

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={start}
            initial={{ opacity: 0, x: reduced ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-5"
            style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
          >
            {visible.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative flex aspect-[4/3] w-full overflow-hidden rounded-xl border border-brand-800/10 bg-brand-950"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(74,111,178,.6),transparent_38%),linear-gradient(145deg,#08132c,#142b5c)]" />
                <span className="absolute -left-10 -top-10 h-40 w-40 rounded-full border border-white/10 transition-transform duration-500 group-hover:scale-125" />
                <span className="relative flex w-full flex-col justify-between p-6">
                  <span className="grid h-14 w-14 place-items-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-sm">
                    <CategoryIcon name={cat.icon} className="h-7 w-7" strokeWidth={1.7} />
                  </span>
                  <span>
                  <span className="mb-1 block font-display text-xl font-extrabold text-white sm:text-2xl">
                    {cat.name}
                  </span>
                  <span className="block text-xs font-semibold text-accent-200">
                    {businessCountLabel(cat.businessCount)}
                  </span>
                  </span>
                </span>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="הקטגוריה הבאה"
          className="grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white text-brand-800 shadow-md transition-all hover:scale-105 hover:border-brand-300"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <span className="text-xs font-semibold text-ink-400 tabular-nums">
          {start + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="הקטגוריה הקודמת"
          className="grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white text-brand-800 shadow-md transition-all hover:scale-105 hover:border-brand-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
