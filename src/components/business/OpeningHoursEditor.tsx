"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateBusinessHours } from "@/app/business/dashboard/actions";
import type { BusinessHours } from "@/types/domain";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface DayRow {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
}

function toRows(hours: BusinessHours[]): DayRow[] {
  return DAYS.map((_, dayOfWeek) => {
    const existing = hours.find((h) => h.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isClosed: existing?.isClosed ?? true,
      opensAt: existing?.opensAt ?? "09:00",
      closesAt: existing?.closesAt ?? "18:00",
    };
  });
}

/**
 * עריכת שעות פעילות — שורה אחת ליום, בדיוק כמו התצוגה ב-OpeningHours.tsx.
 * שמירה שולחת את כל השבוע יחד (updateBusinessHours מוחקת ומכניסה מחדש),
 * ולכן אין צורך לעקוב אחרי מזהי שורות קיימים.
 */
export function OpeningHoursEditor({ businessId, hours }: { businessId: string; hours: BusinessHours[] }) {
  const [rows, setRows] = useState<DayRow[]>(() => toRows(hours));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update(day: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateBusinessHours(
        businessId,
        rows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          isClosed: r.isClosed,
          opensAt: r.isClosed ? null : r.opensAt,
          closesAt: r.isClosed ? null : r.closesAt,
        })),
      );
      if (result.ok) setSaved(true);
      else setError(result.error ?? "השמירה נכשלה.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {rows.map((row) => (
        <div key={row.dayOfWeek} className="flex flex-wrap items-center gap-3 rounded-xs border border-ink-100 px-3 py-2">
          <span className="w-14 shrink-0 text-sm font-bold text-ink-700">{DAYS[row.dayOfWeek]}</span>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <input
              type="checkbox"
              checked={row.isClosed}
              onChange={(e) => update(row.dayOfWeek, { isClosed: e.target.checked })}
              className="h-4 w-4 rounded-xs border-ink-300"
            />
            סגור
          </label>

          {!row.isClosed && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={row.opensAt}
                onChange={(e) => update(row.dayOfWeek, { opensAt: e.target.value })}
                className="h-9 rounded-xs border border-ink-200 px-2 text-sm outline-none focus:border-brand-400"
                aria-label={`שעת פתיחה, ${DAYS[row.dayOfWeek]}`}
              />
              <span className="text-ink-400">–</span>
              <input
                type="time"
                value={row.closesAt}
                onChange={(e) => update(row.dayOfWeek, { closesAt: e.target.value })}
                className="h-9 rounded-xs border border-ink-200 px-2 text-sm outline-none focus:border-brand-400"
                aria-label={`שעת סגירה, ${DAYS[row.dayOfWeek]}`}
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" variant="secondary" size="sm" loading={pending}>שמירת שעות</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-500">
            <CheckCircle2 className="h-4 w-4" /> נשמר
          </span>
        )}
        {error && <span role="alert" className="text-sm font-semibold text-danger-500">{error}</span>}
      </div>
    </form>
  );
}
