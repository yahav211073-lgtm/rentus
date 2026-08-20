"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * שגיאה במסכי הניהול.
 *
 * כאן כן מוצגת הודעת השגיאה עצמה, בניגוד למסך השגיאה הציבורי: מי
 * שרואה את המסך הזה הוא מנהל, והמידע הטכני הוא בדיוק מה שיעזור לו
 * להבין אם מדובר בהרשאה חסרה, בטבלה שלא קיימת, או בנפילת רשת.
 */
export default function AdminError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <div className="rounded-lg border border-danger-500/30 bg-white p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-danger-50 text-danger-500">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="font-display text-lg text-ink-900">המסך לא נטען</h1>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-ink-600">
        אם ההודעה מזכירה הרשאה או מדיניות, סביר שהמיגרציה האחרונה טרם הורצה במסד הנתונים.
      </p>

      <pre
        dir="ltr"
        className="mb-5 max-h-40 overflow-auto rounded-sm bg-ink-50 p-3 text-2xs text-ink-600"
      >
        {error.message}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
      </pre>

      <div className="flex flex-wrap gap-2.5">
        <Button
          type="button" variant="primary" size="md" onClick={reset}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          ניסיון נוסף
        </Button>
        <ButtonLink href="/admin" variant="secondary" size="md">חזרה לדשבורד</ButtonLink>
      </div>
    </div>
  );
}
