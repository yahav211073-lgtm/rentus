"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, ChevronDown, Clock, MapPin, Search, TrendingUp, X } from "lucide-react";
import { seedBusinesses, seedCategories, seedCities, seedTrendingSearches } from "@/data/seed";
import { Button } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useStoredJson, writeStored } from "@/lib/hooks/browser-state";
import { cn } from "@/lib/utils";

/**
 * שורת החיפוש הראשית.
 *
 * שלושה שדות: מה מחפשים, איפה, ובאיזו קטגוריה. בדסקטופ הם יושבים
 * בשורה אחת עם מפרידים; במובייל הם נערמים.
 *
 * ההשלמה האוטומטית:
 * · פותחת ברשימת "חיפושים חמים" + היסטוריה, עוד לפני שהוקלד תו.
 *   שדה חיפוש ריק שלא מציע כלום הוא הזדמנות מבוזבזת.
 * · ניווט מלא במקלדת: חצים, Enter, Escape. aria-activedescendant
 *   מדווח לקורא מסך על הפריט הפעיל בלי להזיז את הפוקוס מהשדה —
 *   זו התבנית הנכונה ל-combobox.
 * · ההיסטוריה ב-localStorage בלבד. חיפושים של גולש אנונימי לא
 *   נשמרים בשרת עם זיהוי.
 */

const HISTORY_KEY = "index:recent-searches";
const HISTORY_MAX = 6;

/* קבוע ברמת המודול: ברירת מחדל חדשה בכל רינדור הייתה מבטלת
   את ה-memo של useStoredJson. */
const EMPTY_HISTORY: string[] = [];

interface Suggestion {
  type: "business" | "category" | "city" | "term";
  label: string;
  sub?: string;
  href: string;
  icon?: string | null;
}

interface Props {
  variant?: "hero" | "compact";
  className?: string;
  defaultQuery?: string;
}

export function SearchBar({ variant = "hero", className, defaultQuery = "" }: Props) {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [query, setQuery] = useState(defaultQuery);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // ההיסטוריה נקראת מ-localStorage דרך useSyncExternalStore.
  // אחסון חסום (מצב פרטי) פשוט מחזיר רשימה ריקה.
  const history = useStoredJson<string[]>("local", HISTORY_KEY, EMPTY_HISTORY);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // סגירה בלחיצה מחוץ לרכיב
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /**
   * ההצעות. בזמן פיתוח הן מסוננות מקומית מתוך תוכן ההדגמה;
   * כשיש Supabase הן מגיעות מ-/api/search/suggest עם debounce.
   */
  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim();
    if (q.length < 1) return [];

    const norm = (s: string) => s.toLowerCase();
    const match = (s: string) => norm(s).includes(norm(q));
    const out: Suggestion[] = [];

    for (const b of seedBusinesses) {
      if (match(b.name) || (b.tagline && match(b.tagline))) {
        out.push({
          type: "business", label: b.name,
          sub: [b.primaryCategory?.name, b.city?.name].filter(Boolean).join(" · "),
          href: `/business/${b.slug}`,
        });
      }
      if (out.length >= 4) break;
    }

    const allCats = seedCategories.flatMap((c) => [c, ...(c.children ?? [])]);
    for (const c of allCats) {
      if (match(c.name)) {
        out.push({
          type: "category", label: c.name,
          sub: c.businessCount ? `${c.businessCount} עסקים` : undefined,
          href: `/category/${c.slug}`, icon: c.icon,
        });
      }
      if (out.length >= 8) break;
    }

    for (const c of seedCities) {
      if (match(c.name)) {
        out.push({ type: "city", label: c.name, sub: "עיר", href: `/search?city=${c.slug}` });
      }
      if (out.length >= 10) break;
    }

    return out.slice(0, 8);
  }, [query]);

  const showEmptyState = open && query.trim().length === 0;
  const items = showEmptyState ? [] : suggestions;

  function saveToHistory(term: string) {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...history.filter((h) => h !== clean)].slice(0, HISTORY_MAX);
    writeStored("local", HISTORY_KEY, next);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    saveToHistory(query);

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city);
    if (category) params.set("category", category);

    setOpen(false);
    router.push(`/search?${params.toString()}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      saveToHistory(items[activeIndex].label);
      router.push(items[activeIndex].href);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const isHero = variant === "hero";

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={submit}
        role="search"
        aria-label="חיפוש עסקים"
        className={cn(
          "relative flex flex-col gap-2 rounded-lg bg-white p-2 md:flex-row md:items-center md:gap-0",
          isHero
            ? "shadow-[0_24px_60px_-16px_rgba(5,25,47,0.45)] ring-1 ring-white/60"
            : "border border-ink-200 shadow-md",
        )}
      >
        {/* מה מחפשים */}
        <div className="relative flex flex-1 items-center gap-2.5 px-3 py-1">
          <Search className="h-5 w-5 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="מה אתם מחפשים? עסק, שירות או בעל מקצוע"
            aria-label="מה מחפשים"
            role="combobox"
            aria-expanded={open}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            className="w-full bg-transparent py-2.5 text-base text-ink-900 outline-none placeholder:text-ink-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              aria-label="ניקוי החיפוש"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Divider />

        {/* עיר */}
        <SelectField
          icon={<MapPin className="h-4.5 w-4.5 text-ink-400" />}
          value={city}
          onChange={setCity}
          label="בכל הארץ"
          ariaLabel="בחירת עיר"
          options={seedCities.map((c) => ({ value: c.slug, label: c.name }))}
        />

        <Divider />

        {/* קטגוריה */}
        <SelectField
          icon={<Building2 className="h-4.5 w-4.5 text-ink-400" />}
          value={category}
          onChange={setCategory}
          label="כל הקטגוריות"
          ariaLabel="בחירת קטגוריה"
          options={seedCategories.map((c) => ({ value: c.slug, label: c.name }))}
        />

        <Button type="submit" variant="accent" size={isHero ? "lg" : "md"} className="md:min-w-[132px]">
          חיפוש
        </Button>
      </form>

      {/* --- חלונית ההצעות --- */}
      <AnimatePresence>
        {open && (items.length > 0 || showEmptyState) && (
          <motion.div
            id="search-suggestions"
            role="listbox"
            aria-label="הצעות חיפוש"
            initial={{ opacity: 0, y: reduced ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-ink-200 bg-white p-2 shadow-[0_28px_60px_-16px_rgba(11,59,117,0.3)]"
          >
            {showEmptyState ? (
              <div className="space-y-4 p-2">
                {history.length > 0 && (
                  <div>
                    <SectionLabel icon={<Clock className="h-3.5 w-3.5" />}>חיפושים אחרונים</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {history.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => { setQuery(h); inputRef.current?.focus(); }}
                          className="rounded-full border border-ink-200 px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <SectionLabel icon={<TrendingUp className="h-3.5 w-3.5" />}>חיפושים חמים</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {seedTrendingSearches.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                        className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <ul className="max-h-[min(60vh,420px)] overflow-y-auto">
                {items.map((s, i) => (
                  <li key={`${s.type}-${s.label}-${i}`}>
                    <button
                      type="button"
                      id={`suggestion-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => { saveToHistory(s.label); router.push(s.href); setOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-start transition-colors",
                        i === activeIndex ? "bg-brand-50" : "hover:bg-ink-50",
                      )}
                    >
                      <span className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-[9px]",
                        s.type === "business" ? "bg-brand-100 text-brand-700"
                          : s.type === "category" ? "bg-accent-100 text-accent-700"
                          : "bg-ink-100 text-ink-500",
                      )}>
                        {s.type === "business" ? <Building2 className="h-4 w-4" />
                          : s.type === "city" ? <MapPin className="h-4 w-4" />
                          : <CategoryIcon name={s.icon} className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-800">{s.label}</span>
                        {s.sub && <span className="block truncate text-xs text-ink-400">{s.sub}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-8 w-px shrink-0 bg-ink-200 md:block" aria-hidden="true" />;
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-ink-400">
      {icon}
      {children}
    </p>
  );
}

/**
 * select מעוצב.
 * ה-select עצמו נשאר במקומו ושקוף מעל התצוגה — כך התפריט הוא
 * התפריט המקורי של המערכת (נגיש, עובד במובייל), והמראה שלנו.
 */
function SelectField({
  icon, value, onChange, label, options, ariaLabel,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  label: string;
  ariaLabel: string;
  options: { value: string; label: string }[];
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative flex items-center gap-2.5 px-3 py-1 md:min-w-[168px]">
      {icon}
      <span className={cn("flex-1 truncate text-base", selected ? "text-ink-900" : "text-ink-400")}>
        {selected?.label ?? label}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
