"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * טקסט מתקפל עם "קרא עוד".
 *
 * הכפתור מוצג רק כשיש באמת מה לפתוח. הסף נמדד לפי אורך התוכן ולא
 * לפי גובה שנמדד ב-JS — מדידה כזו רצה אחרי הצביעה הראשונה וגורמת
 * לכפתור להבהב פנימה והחוצה בטעינה.
 */
export function ReadMore({
  text, clampAt = 320, className,
}: { text: string; clampAt?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const collapsible = text.length > clampAt;

  return (
    <div className={className}>
      <p
        className={cn(
          "whitespace-pre-line text-base leading-[1.85] text-ink-600",
          collapsible && !open && "line-clamp-4",
        )}
      >
        {text}
      </p>

      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2.5 inline-flex items-center gap-1 text-sm font-bold text-brand-700 transition-colors hover:text-brand-500"
        >
          {open ? "הצג פחות" : "קרא עוד"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
