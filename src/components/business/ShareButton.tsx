"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * שיתוף.
 *
 * קודם ישב כאן קישור ל-wa.me עם שם החברה בלבד — כלומר "שיתוף"
 * ששיתף טקסט בלי קישור, מה שהפך אותו לחסר תועלת. עכשיו: Web Share API
 * במובייל (התפריט המקורי של מערכת ההפעלה), והעתקת כתובת בדסקטופ שבו
 * ה-API לרוב לא קיים.
 *
 * ה-fallback האחרון הוא prompt — כי clipboard חסום בהקשר לא-מאובטח,
 * ועדיף שהמשתמש יוכל לסמן ולהעתיק ידנית מאשר שכפתור לא יעשה כלום.
 */
export function ShareButton({
  title, className, label = "שיתוף",
}: { title: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* המשתמש ביטל — לא שגיאה, ולא נופלים להעתקה בעל כורחו */
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("העתיקו את הקישור:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`שיתוף ${title}`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xs border border-ink-200 bg-white",
        "px-4 font-semibold text-ink-700 transition-colors",
        "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-4.5 w-4.5 text-success-500" aria-hidden="true" />
          הועתק
        </>
      ) : (
        <>
          <Share2 className="h-4.5 w-4.5" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}
