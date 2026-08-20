import Link from "next/link";
import { Megaphone, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * קריאייטיב ברירת המחדל של רנטוס — מה שמוצג במשבצת פרסום שאין בה
 * מפרסם משלם.
 *
 * ההחלטה כאן היא הפוכה ממה שהיה קודם (משבצת ריקה שלא מרונדרת בכלל):
 * שטח פרסומי ריק הוא שטח מכירה מבוזבז, והמשבצת עצמה היא הפרסומת
 * הטובה ביותר לשטח הפרסומי. חשוב לא פחות — המשבצת שומרת על הגובה
 * שלה, כך שהפריסה לא קופצת ברגע שמנהל מעלה קריאייטיב אמיתי.
 *
 * שני יחסים: square לסיידבר (300×250), wide לרצועות הרוחב.
 */
export function HouseAd({
  variant = "square",
  className,
}: {
  variant?: "square" | "wide" | "compact";
  className?: string;
}) {
  const wide = variant === "wide";
  const compact = variant === "compact";

  return (
    <Link
      href="/advertise"
      data-house-ad={variant}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden rounded-lg bg-brand-800 text-center text-white transition-colors duration-200 hover:bg-brand-700 active:scale-[0.99]",
        /* במובייל כל הווריאנטים אופקיים.
           הריבוע (240px) והרחב (168px) תוכננו לעמודת צד ולרצועת
           רוחב בדסקטופ. במובייל הם נמתחים לרוחב מלא, כלומר
           מלבן כמעט ריק בגובה רבע מסך — בשביל שטח שעדיין לא נמכר.
           אותה הודעה בדיוק בפריסה אופקית היא 96px. */
        compact
          ? "min-h-[84px] flex-row gap-3 px-4 py-3 text-start"
          : cn(
              "min-h-[96px] flex-row gap-3 px-4 py-3 text-start",
              wide
                ? "sm:min-h-[168px] sm:flex-col sm:gap-3 sm:px-7 sm:py-7 sm:text-center"
                : "sm:min-h-[240px] sm:flex-col sm:gap-3 sm:px-6 sm:py-8 sm:text-center",
            ),
        className,
      )}
    >
      {/* רשת עדינה ברקע במקום גרדיאנט: היא נותנת למשבצת מרקם שמבדיל
          אותה מפאנל תוכן רגיל, בלי להתחרות בקריאייטיב אמיתי שיחליף
          אותה בהמשך. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(var(--color-brand-300)_1px,transparent_1px),linear-gradient(90deg,var(--color-brand-300)_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <span className={cn(
        "relative grid shrink-0 place-items-center rounded-lg bg-white/10 text-accent-300",
        compact ? "hidden" : "h-9 w-9 sm:h-11 sm:w-11",
      )}>
        <Megaphone className={compact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5"} strokeWidth={2} aria-hidden="true" />
      </span>

      <span className="relative min-w-0 flex-1 sm:flex-none">
        <span className={cn("block font-display font-extrabold leading-tight", compact ? "text-sm" : "text-sm sm:text-xl")}>
          יש לכם מודעה לפרסם?
        </span>
        <span className={cn("mt-1 text-sm leading-snug text-white/70", compact ? "hidden" : "hidden sm:block")}>
          השטח הזה יכול להיות שלכם — מול גולשים שכבר מחפשים ציוד להשכרה
        </span>
      </span>

      <span className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/60 font-bold transition-colors group-hover:border-white group-hover:bg-white group-hover:text-brand-800",
        compact ? "px-3 py-1.5 text-xs" : "px-3 py-1.5 text-xs sm:gap-2 sm:border-2 sm:px-5 sm:py-2 sm:text-sm",
      )}>
        {compact ? "פרסום באתר" : <><span className="sm:hidden">פרסום באתר</span><span className="hidden sm:inline">לפרטים על פרסום</span></>}
        <ArrowLeft
          className={cn("transition-transform duration-200 group-hover:-translate-x-1", compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5 sm:h-4 sm:w-4")}
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
