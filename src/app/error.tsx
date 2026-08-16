"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * מסך שגיאה כללי.
 *
 * הודעת השגיאה הטכנית לא מוצגת לגולש — היא עלולה לכלול שמות טבלאות
 * או פרטי שאילתה. היא נרשמת לקונסולה, שם היא שימושית למי שמתחזק
 * את המערכת. מזהה התקלה (digest) כן מוצג, כי בלעדיו אי אפשר לקשר
 * בין דיווח של משתמש לבין רשומת השגיאה בשרת.
 */
export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-danger-50 text-danger-500">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>

      <h1 className="mb-2 font-display text-2xl font-extrabold text-ink-900">
        משהו השתבש בטעינת העמוד
      </h1>
      <p className="mb-6 text-base leading-relaxed text-ink-600">
        זו תקלה אצלנו, לא אצלכם. אפשר לנסות לטעון מחדש — ואם זה חוזר, נשמח שתעדכנו אותנו.
      </p>

      <div className="flex flex-wrap justify-center gap-2.5">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={reset}
          icon={<RotateCcw className="h-4.5 w-4.5" />}
        >
          ניסיון נוסף
        </Button>
        <ButtonLink href="/" variant="secondary" size="lg">חזרה לעמוד הבית</ButtonLink>
      </div>

      {error.digest && (
        <p className="mt-6 text-2xs text-ink-400">
          מזהה תקלה: <span dir="ltr" className="font-mono">{error.digest}</span>
        </p>
      )}

      <p className="mt-2 text-xs text-ink-400">
        <Link href="/contact" className="font-bold text-brand-700 hover:text-brand-500">
          יצירת קשר עם התמיכה
        </Link>
      </p>
    </div>
  );
}
