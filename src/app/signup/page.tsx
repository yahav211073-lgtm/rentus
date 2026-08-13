"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

/**
 * הרשמה — רק דרך Google.
 *
 * הרשמה עם אימייל+סיסמה הוסרה בכוונה: כדי לאפשר כניסה מיידית בלי
 * לחכות למייל אישור, כיבינו את "Confirm email" ב-Supabase — אבל
 * זה אומר שטופס אימייל+סיסמה היה נותן לכל אחד להירשם עם כתובת
 * שלא בבעלותו, בלי שום אימות. Google כבר מאמת את המייל בעצמו,
 * אז זו הדרך היחידה להרשם שנשארה בטוחה. כניסה עם סיסמה (ל/login)
 * עדיין עובדת לחשבונות קיימים שנוצרו לפני השינוי.
 */
export default function SignupPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-1.5 font-display text-2xl font-extrabold text-ink-900">יצירת חשבון</h1>
      <p className="mb-7 text-sm text-ink-500">
        כבר יש לכם חשבון? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-brand-700 hover:text-brand-500">כניסה</Link>
      </p>

      <GoogleSignInButton next={next} />

      <p className="mt-5 text-2xs leading-relaxed text-ink-400">
        בהרשמה אתם מאשרים את תנאי השימוש ומדיניות הפרטיות.
      </p>
    </div>
  );
}
