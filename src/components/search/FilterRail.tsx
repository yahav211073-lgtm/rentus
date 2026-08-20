"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, RotateCcw, SlidersHorizontal, Star, X } from "lucide-react";
import type { SearchResult } from "@/types/domain";
import { seedTags } from "@/data/seed";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { FlatCategory, SimpleCity } from "@/lib/repo/taxonomy";

/**
 * מסננים.
 *
 * מצב המסננים חי ב-URL ולא ב-state מקומי. זו החלטה מרכזית:
 *   · תוצאות מסוננות ניתנות לשיתוף ולסימניה
 *   · כפתור "אחורה" בדפדפן עובד כמו שמצפים
 *   · השרת מרנדר את התוצאות הנכונות מיד, בלי הבהוב
 *
 * הניווט עטוף ב-useTransition כך שהרשימה הקודמת נשארת על המסך
 * ומתעמעמת קלות בזמן הטעינה, במקום להיעלם ולהחליף את עצמה
 * בשלד. זה מה שגורם לסינון להרגיש מיידי גם כשהוא לא.
 *
 * במובייל הפאנל נפתח כמגירה תחתונה — שם האגודל נמצא.
 */

interface Props {
  facets: SearchResult["facets"];
  total: number;
  categories: FlatCategory[];
  cities: SimpleCity[];
  /** תוכן נוסף מתחת לתיבת המסננים בעמודת הצד — למשל מדריכים מומלצים. דסקטופ בלבד. */
  children?: React.ReactNode;
}

const RATING_OPTIONS = [4.5, 4, 3.5];
const PRICE_OPTIONS = [
  { value: 1, label: "₪" },
  { value: 2, label: "₪₪" },
  { value: 3, label: "₪₪₪" },
  { value: 4, label: "₪₪₪₪" },
];

export function FilterRail({ facets, total, categories, cities, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  /** כותב ערך ל-URL. null מוחק את הפרמטר. תמיד מאפס לעמוד 1. */
  const setParam = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    // שינוי מסנן תמיד מחזיר לעמוד הראשון. בלי זה המשתמש מסנן
    // ונוחת על עמוד 4 של תוצאות שכבר לא קיימות.
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }, [params, pathname, router]);

  const toggleInList = useCallback((key: string, value: string) => {
    const current = params.get(key)?.split(",").filter(Boolean) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setParam(key, next.length ? next.join(",") : null);
  }, [params, setParam]);

  const activeTags = params.get("tags")?.split(",").filter(Boolean) ?? [];
  const activePrices = params.get("price")?.split(",").filter(Boolean) ?? [];
  const activeCity = params.get("city") ?? "";
  const activeCategory = params.get("category") ?? "";
  const activeRating = params.get("minRating") ?? "";
  const verifiedOnly = params.get("verified") === "1";

  const activeCount =
    activeTags.length + activePrices.length +
    (activeCity ? 1 : 0) + (activeCategory ? 1 : 0) +
    (activeRating ? 1 : 0) + (verifiedOnly ? 1 : 0);

  function clearAll() {
    const next = new URLSearchParams();
    const q = params.get("q");
    // מונח החיפוש נשאר. "ניקוי מסננים" הוא לא "התחל מחדש".
    if (q) next.set("q", q);
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const content = (
    <div className={cn("space-y-6", isPending && "opacity-60 transition-opacity")}>
      <FilterGroup title="קטגוריה">
        <ScrollList>
          <RadioRow
            label="כל הקטגוריות"
            checked={!activeCategory}
            onSelect={() => setParam("category", null)}
          />
          {categories.map((c) => (
            <RadioRow
              key={c.slug}
              label={c.parentId ? `— ${c.name}` : c.name}
              count={facets?.categories.find((f) => f.slug === c.slug)?.count}
              checked={activeCategory === c.slug}
              onSelect={() => setParam("category", c.slug)}
            />
          ))}
        </ScrollList>
      </FilterGroup>

      <FilterGroup title="עיר">
        <ScrollList>
          <RadioRow
            label="בכל הארץ"
            checked={!activeCity}
            onSelect={() => setParam("city", null)}
          />
          {cities.map((c) => (
            <RadioRow
              key={c.slug}
              label={c.name}
              count={facets?.cities.find((f) => f.slug === c.slug)?.count}
              checked={activeCity === c.slug}
              onSelect={() => setParam("city", c.slug)}
            />
          ))}
        </ScrollList>
      </FilterGroup>

      <FilterGroup title="דירוג מינימלי">
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((r) => (
            <Chip
              key={r}
              active={activeRating === String(r)}
              onClick={() => setParam("minRating", activeRating === String(r) ? null : String(r))}
            >
              <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
              {r}+
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="טווח מחירים">
        <div className="flex flex-wrap gap-2">
          {PRICE_OPTIONS.map((p) => (
            <Chip
              key={p.value}
              active={activePrices.includes(String(p.value))}
              onClick={() => toggleInList("price", String(p.value))}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="מאפיינים">
        <div className="space-y-1.5">
          {seedTags.map((t) => {
            const count = facets?.tags.find((f) => f.slug === t.slug)?.count;
            return (
              <CheckRow
                key={t.slug}
                label={t.name}
                count={count}
                checked={activeTags.includes(t.slug)}
                onToggle={() => toggleInList("tags", t.slug)}
              />
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="אמון">
        <CheckRow
          label="חברות מאומתות בלבד"
          icon={<BadgeCheck className="h-4 w-4 text-brand-600" />}
          checked={verifiedOnly}
          onToggle={() => setParam("verified", verifiedOnly ? null : "1")}
        />
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-ink-200 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:border-danger-500/40 hover:bg-danger-50 hover:text-danger-700"
        >
          <RotateCcw className="h-4 w-4" />
          ניקוי כל המסננים ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* דסקטופ — עמודה דביקה */}
      <aside
        className="hidden lg:block lg:w-[276px] lg:shrink-0"
        aria-label="מסנני חיפוש"
      >
        <div className="sticky top-[calc(var(--spacing-header)+16px)] max-h-[calc(100vh-var(--spacing-header)-32px)] overflow-y-auto rounded-lg border border-ink-200/70 bg-white p-5">
          <div className="mb-5 flex items-center gap-2 border-b border-ink-100 pb-4">
            <SlidersHorizontal className="h-4.5 w-4.5 text-brand-700" />
            <h2 className="text-sm text-ink-900">סינון תוצאות</h2>
            {activeCount > 0 && (
              <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-800 px-1.5 text-2xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </div>
          {content}
        </div>
        {children && <div className="mt-5">{children}</div>}
      </aside>

      {/* מובייל — כפתור צף + מגירה תחתונה */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-5 z-40 inline-flex items-center gap-2 rounded-full bg-brand-800 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_28px_-6px_rgba(11,59,117,0.6)] lg:hidden"
        style={{ insetInlineEnd: "1.25rem" }}
      >
        <SlidersHorizontal className="h-4 w-4" />
        סינון
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-400 px-1.5 text-2xs font-bold text-brand-950">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-brand-950/50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              role="dialog" aria-modal="true" aria-label="מסנני חיפוש"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[71] max-h-[86vh] overflow-hidden rounded-t-xl bg-white lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-ink-100 p-4">
                <h2 className="text-base text-ink-900">סינון תוצאות</h2>
                <button
                  type="button" onClick={() => setMobileOpen(false)}
                  aria-label="סגירת מסננים"
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[calc(86vh-140px)] overflow-y-auto p-4">{content}</div>
              <div className="border-t border-ink-100 p-4">
                <Button variant="primary" size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                  הצגת {total} תוצאות
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================================
   רכיבי עזר
   ============================================================================ */

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-2xs font-bold uppercase tracking-wide text-ink-400">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** רשימה גלילה עם גובה מוגבל — מונע מ-12 ערים לדחוף את כל השאר. */
function ScrollList({ children }: { children: React.ReactNode }) {
  return <div className="max-h-52 space-y-0.5 overflow-y-auto pe-1">{children}</div>;
}

function RadioRow({
  label, count, checked, onSelect,
}: { label: string; count?: number; checked: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xs px-2.5 py-2 text-start text-sm transition-colors",
        checked ? "bg-brand-50 font-bold text-brand-800" : "text-ink-600 hover:bg-ink-50",
      )}
    >
      <span className="truncate">{label}</span>
      {count != null && (
        <span className="shrink-0 text-2xs tabular-nums text-ink-400">{count}</span>
      )}
    </button>
  );
}

function CheckRow({
  label, count, checked, onToggle, icon,
}: {
  label: string; count?: number; checked: boolean;
  onToggle: () => void; icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-2 transition-colors hover:bg-ink-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 rounded border-ink-300 accent-brand-800"
      />
      {icon}
      <span className={cn("flex-1 truncate text-sm", checked ? "font-bold text-brand-800" : "text-ink-600")}>
        {label}
      </span>
      {count != null && (
        <span className="shrink-0 text-2xs tabular-nums text-ink-400">{count}</span>
      )}
    </label>
  );
}

function Chip({
  children, active, onClick,
}: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-brand-800 bg-brand-800 text-white"
          : "border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50",
      )}
    >
      {children}
    </button>
  );
}
