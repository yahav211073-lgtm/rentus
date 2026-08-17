import type { BusinessHours } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * שעות פעילות.
 *
 * שני פרטים שהופכים את זה לשימושי:
 *
 * 1. היום הנוכחי מודגש. המשתמש שואל "פתוח עכשיו?", לא "מה השעות
 *    ביום רביעי" — ובלי הדגשה הוא צריך לספור שורות.
 *
 * 2. חישוב "פתוח עכשיו" נעשה בשרת לפי אזור הזמן של ישראל ולא לפי
 *    שעון המכשיר. תייר עם טלפון בשעון ניו-יורק היה מקבל תשובה שגויה.
 */

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

/** היום והשעה הנוכחיים בישראל, ללא תלות באזור הזמן של השרת. */
function nowInIsrael(): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  return {
    day: weekdayMap[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "09:00:00" (כפי ש-Postgres מחזיר עמודת time) -> "09:00". */
function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function OpeningHours({ hours }: { hours: BusinessHours[] }) {
  const { day: today, minutes: nowMin } = nowInIsrael();

  const todayHours = hours.find((h) => h.dayOfWeek === today);
  const isOpenNow = Boolean(
    todayHours &&
    !todayHours.isClosed &&
    todayHours.opensAt &&
    todayHours.closesAt &&
    nowMin >= toMinutes(todayHours.opensAt) &&
    nowMin < toMinutes(todayHours.closesAt),
  );

  const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div>
      <div className={cn(
        "mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
        isOpenNow ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-500",
      )}>
        <span className={cn(
          "h-2 w-2 rounded-full",
          isOpenNow ? "bg-success-500" : "bg-ink-400",
        )} />
        {isOpenNow ? "פתוח עכשיו" : "סגור כרגע"}
      </div>

      <ul className="space-y-1.5">
        {sorted.map((h) => {
          const isToday = h.dayOfWeek === today;
          return (
            <li
              key={h.dayOfWeek}
              className={cn(
                "flex items-center justify-between rounded-xs px-2 py-1.5 text-sm",
                isToday ? "bg-brand-50 font-bold text-brand-800" : "text-ink-600",
              )}
            >
              <span>{DAYS[h.dayOfWeek]}</span>
              <span className={cn("tabular-nums", h.isClosed && "text-ink-400")}>
                {h.isClosed
                  ? (h.note ?? "סגור")
                  : `${formatTime(h.opensAt!)} – ${formatTime(h.closesAt!)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
