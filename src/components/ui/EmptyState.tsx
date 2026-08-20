import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * מצב ריק.
 *
 * הפרויקט הזה עדיין דליל בתוכן, ולכן מצב ריק הוא לא פינה נדירה אלא
 * מה שהגולש רואה בפועל ברוב הרשימות. הכלל: מצב ריק שמסביר מה קורה
 * ומציע צעד הבא נראה כמו מוצר; אזור לבן ריק נראה כמו תקלה.
 *
 * הרכיב לא מחליט לבד אם להופיע — סקציה שאין לה שום תוכן אמיתי לא
 * אמורה לרנדר כותרת ומצב ריק, אלא פשוט לא להיות. משתמשים בו רק
 * במקומות שבהם הסקציה עצמה היא חלק מהחוזה עם הגולש (תוצאות חיפוש,
 * ביקורות, רשימת חברות בקטגוריה).
 */
export function EmptyState({
  icon, title, description, action, className, tone = "card",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** "card" — קופסה מקווקוות בתוך פאנל. "bare" — בלי מסגרת, לתוך קופסה קיימת. */
  tone?: "card" | "bare";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-10 text-center",
        tone === "card" && "rounded-lg border border-dashed border-ink-300 bg-ink-50/60",
        className,
      )}
    >
      {icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-white text-ink-400 shadow-sm ring-1 ring-ink-200/70">
          {icon}
        </span>
      )}
      <p className="font-display text-md font-bold text-ink-800">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
