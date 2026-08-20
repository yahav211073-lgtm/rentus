import { cn, formatCompact } from "@/lib/utils";

/**
 * דירוג בכוכבים.
 *
 * המילוי החלקי נעשה בשכבת כוכבים מלאים חתוכה ב-clip-path מעל שכבת
 * כוכבים ריקים. זה מה שמאפשר להציג 4.3 באמת ולא לעגל ל-4 —
 * ההבדל בין 4.3 ל-4.0 הוא בדיוק מה שהמשתמש מסתכל עליו.
 *
 * ב-RTL המילוי מתחיל מימין, ולכן ה-inset מחושב מהצד הנכון.
 */

interface RatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  /**
   * "compact" — כוכב אחד, ציון, וספירה. ברירת המחדל, וזו הצורה
   * שנכונה כמעט בכל מקום: חמישה כוכבים בגודל 14px נקראים כרעש
   * ולא כמידע, והציון המספרי הוא מה שהעין באמת קוראת. "stars"
   * שמור לעמוד העסק, שם יש מקום ושם הדירוג הוא נתון ראשי.
   */
  variant?: "compact" | "stars";
}

const SIZES = {
  sm: { star: "h-3.5 w-3.5", text: "text-xs", gap: "gap-1" },
  md: { star: "h-4 w-4", text: "text-sm", gap: "gap-1.5" },
  lg: { star: "h-5 w-5", text: "text-base", gap: "gap-2" },
};

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.4l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.25l-5.81 3.05 1.11-6.47L2.6 9.25l6.5-.95L12 2.4z" />
    </svg>
  );
}

export function Rating({
  value, count, size = "md", showValue = true, className, variant = "compact",
}: RatingProps) {
  const s = SIZES[size];
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-gold-50 px-2 py-0.5 font-bold text-gold-700 tabular-nums",
          s.text,
          className,
        )}
        role="img"
        aria-label={`דירוג ${value.toFixed(1)} מתוך 5${count != null ? `, ${count} ביקורות` : ""}`}
      >
        <Star className={cn(s.star, "text-gold-500")} />
        {showValue && value.toFixed(1)}
        {count != null && (
          <span className="font-normal text-gold-700/70">({formatCompact(count)})</span>
        )}
      </span>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center", s.gap, className)}
      role="img"
      aria-label={`דירוג ${value.toFixed(1)} מתוך 5${count != null ? `, ${count} ביקורות` : ""}`}
    >
      <span className="relative inline-flex" aria-hidden="true">
        {/* שכבת בסיס — כוכבים ריקים */}
        <span className="inline-flex gap-0.5 text-ink-300">
          {Array.from({ length: 5 }, (_, i) => <Star key={i} className={s.star} />)}
        </span>
        {/* שכבת מילוי, חתוכה לפי האחוז. ב-RTL חותכים מהצד השמאלי. */}
        <span
          className="absolute inset-0 inline-flex gap-0.5 text-star-400 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${100 - pct}%)` }}
        >
          {Array.from({ length: 5 }, (_, i) => <Star key={i} className={s.star} />)}
        </span>
      </span>

      {showValue && (
        <span className={cn("font-bold text-ink-800 tabular-nums", s.text)}>
          {value.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span className={cn("text-ink-400 tabular-nums", s.text)}>
          ({formatCompact(count)})
        </span>
      )}
    </div>
  );
}
