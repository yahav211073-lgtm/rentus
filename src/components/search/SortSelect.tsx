"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * בורר מיון.
 *
 * select ילידי מוסתר מעל תצוגה מעוצבת — אותה תבנית כמו ב-SearchBar.
 * התפריט שנפתח הוא של מערכת ההפעלה, כלומר נגיש, נוח במגע, ותומך
 * בהקלדה לחיפוש. תפריט מותאם היה נראה זהה ועובד פחות טוב.
 */

const OPTIONS = [
  { value: "relevance", label: "הכי רלוונטי" },
  { value: "rating", label: "דירוג גבוה" },
  { value: "reviews", label: "הכי הרבה ביקורות" },
  { value: "newest", label: "הצטרפו לאחרונה" },
  { value: "name", label: "לפי שם א׳–ת׳" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = params.get("sort") ?? "relevance";
  const label = OPTIONS.find((o) => o.value === current)?.label ?? OPTIONS[0].label;

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "relevance") next.delete("sort");
    else next.set("sort", value);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  return (
    <div className={cn(
      "relative inline-flex items-center gap-2 rounded-xs border border-ink-200 bg-white px-3.5 py-2.5",
      isPending && "opacity-60",
    )}>
      <ArrowUpDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      <span className="text-sm text-ink-400">מיון:</span>
      <span className="text-sm font-bold text-ink-800">{label}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />

      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        aria-label="מיון תוצאות"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
