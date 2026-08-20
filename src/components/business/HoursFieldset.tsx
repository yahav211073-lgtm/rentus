"use client";

import { useState } from "react";

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

interface DayRow {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
}

/**
 * שעות פעילות בתוך טופס יצירת עסק.
 *
 * זה לא OpeningHoursEditor: שם יש כבר businessId והשמירה היא קריאת
 * שרת בפני עצמה. כאן העסק עוד לא קיים, ולכן הערכים חייבים לנסוע
 * יחד עם שאר הטופס — הם מסודרים לשדה מוסתר אחד כ-JSON, וה-Server
 * Action מאמת אותו מחדש.
 *
 * למה בכלל כאן ולא רק בדשבורד: דף עסק בלי שעות פעילות מסתיר את
 * הסקציה, וכך נוצר פרופיל חלקי שאף אחד לא חוזר להשלים. לאסוף את
 * זה ברגע ההרשמה עולה למגיש חצי דקה, ומונע פרופילים ריקים.
 *
 * ברירת המחדל היא "סגור" בכל יום, ולא א׳–ה׳ פתוח: ניחוש שנראה
 * סביר הוא בדיוק מה שנשמר בלי שקראו אותו, ואז האתר מציג שעות
 * שהעסק לא התחייב אליהן.
 */
export function HoursFieldset({ name = "hours" }: { name?: string }) {
  const [rows, setRows] = useState<DayRow[]>(() =>
    DAYS.map((_, dayOfWeek) => ({ dayOfWeek, isClosed: true, opensAt: "09:00", closesAt: "18:00" })),
  );

  function update(day: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
  }

  function applyToAll() {
    const source = rows.find((r) => !r.isClosed);
    if (!source) return;
    setRows((prev) =>
      prev.map((r) =>
        r.dayOfWeek === 6 ? r : { ...r, isClosed: false, opensAt: source.opensAt, closesAt: source.closesAt },
      ),
    );
  }

  return (
    <fieldset className="rounded-sm border border-ink-200 p-4">
      <legend className="px-1.5 text-xs font-bold text-ink-600">שעות פעילות</legend>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-2xs text-ink-400">
          סמנו את הימים שבהם אתם פתוחים. יום שלא סומן יוצג כ״סגור״.
        </p>
        <button
          type="button"
          onClick={applyToAll}
          className="shrink-0 text-2xs font-bold text-brand-700 underline-offset-2 hover:underline"
        >
          החלת השעות על א׳–ו׳
        </button>
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.dayOfWeek} className="flex flex-wrap items-center gap-2">
            <label className="flex w-28 shrink-0 items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={!r.isClosed}
                onChange={(e) => update(r.dayOfWeek, { isClosed: !e.target.checked })}
                className="h-4 w-4 rounded-xs accent-[var(--color-brand-700)]"
              />
              {DAYS[r.dayOfWeek]}
            </label>

            {r.isClosed ? (
              <span className="text-xs text-ink-400">סגור</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={r.opensAt}
                  aria-label={`שעת פתיחה ביום ${DAYS[r.dayOfWeek]}`}
                  onChange={(e) => update(r.dayOfWeek, { opensAt: e.target.value })}
                  className="h-9 rounded-xs border border-ink-200 px-2 text-sm outline-none focus:border-brand-400"
                />
                <span className="text-xs text-ink-400">עד</span>
                <input
                  type="time"
                  value={r.closesAt}
                  aria-label={`שעת סגירה ביום ${DAYS[r.dayOfWeek]}`}
                  onChange={(e) => update(r.dayOfWeek, { closesAt: e.target.value })}
                  className="h-9 rounded-xs border border-ink-200 px-2 text-sm outline-none focus:border-brand-400"
                />
              </span>
            )}
          </div>
        ))}
      </div>

      <input type="hidden" name={name} value={JSON.stringify(rows)} />
    </fieldset>
  );
}
