"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { InteriorHero } from "@/components/layout/InteriorHero";

/**
 * הרשמה — Google או אימייל+סיסמה.
 *
 * ⚠️ החלטת מוצר מכוונת, לא פשרה בשקט: כדי לאפשר כניסה מיידית בלי
 * לחכות למייל אישור, "Confirm email" כבוי ב-Supabase. המשמעות:
 * טופס אימייל+סיסמה מאפשר לכל אחד להירשם עם כל כתובת מייל, כולל
 * כתובת שהיא לא שלו, בלי שום אימות בעלות עליה. Google (למעלה)
 * הוא הדרך היחידה שבאמת מאמתת זהות/בעלות על המייל.
 *
 * ההגנה כאן (שדה דבש + הגבלת קצב דרך /api/auth/signup-guard) היא
 * הגנה בסיסית מפני ספאם אוטומטי בלבד — לא CAPTCHA ולא אימות זהות.
 * ראו תיעוד מלא של ההחלטה הזו ב-CLAUDE.md.
 */
export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const fullName = String(form.get("fullName") ?? "").trim();
    const company = String(form.get("company") ?? ""); // שדה דבש

    setState("loading");
    setError("");

    try {
      const guardRes = await fetch("/api/auth/signup-guard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      const guard = await guardRes.json();
      if (!guardRes.ok) {
        setState("error");
        setError(guard.error ?? "משהו השתבש. נסו שוב.");
        return;
      }
    } catch {
      setState("error");
      setError("משהו השתבש. נסו שוב.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setState("error");
      setError("החיבור למסד הנתונים לא הוגדר.");
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || undefined } },
    });

    if (signUpError) {
      setState("error");
      setError(
        signUpError.message === "User already registered"
          ? "כבר קיים חשבון עם כתובת המייל הזו."
          : signUpError.message.includes("Password")
            ? "הסיסמה קצרה מדי — נדרשים לפחות 8 תווים."
            : "משהו השתבש. נסו שוב.",
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="bg-ink-50 pb-20">
      <InteriorHero eyebrow="מצטרפים ל-Rentus" title="יצירת חשבון" description="חשבון אחד לחיפוש, ביקורות וניהול חברה." compact />
    <div className="mx-auto -mt-5 max-w-md px-4 sm:px-6">
      <div className="relative rounded-xl border border-ink-200 bg-white p-6 shadow-[0_24px_60px_-28px_rgba(11,59,117,.4)] sm:p-8">
      <h1 className="mb-1.5 font-display text-2xl font-extrabold text-ink-900">יצירת חשבון</h1>
      <p className="mb-7 text-sm text-ink-500">
        כבר יש לכם חשבון? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-brand-700 hover:text-brand-500">כניסה</Link>
      </p>

      <GoogleSignInButton next={next} />

      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-200" />
        או
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* שדה דבש — מוסתר ויזואלית ומהזרימה של קורא מסך, ולא רק display:none
            כדי שסקריפט שממלא כל שדה בטופס עדיין ייתפס */}
        <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="signup-company">חברה</label>
          <input id="signup-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Field id="signup-name" name="fullName" label="שם מלא" type="text" autoComplete="name" />
        <Field id="signup-email" name="email" label="אימייל" type="email" required autoComplete="email" />
        <Field
          id="signup-password" name="password" label="סיסמה" type="password" required
          autoComplete="new-password" minLength={8}
        />

        <Button
          type="submit" variant="primary" size="lg" fullWidth
          loading={state === "loading"}
          icon={<UserPlus className="h-4.5 w-4.5" />}
        >
          יצירת חשבון
        </Button>

        {state === "error" && (
          <p role="alert" className="text-sm text-danger-500">{error}</p>
        )}
      </form>

      <p className="mt-5 text-2xs leading-relaxed text-ink-400">
        בהרשמה אתם מאשרים את תנאי השימוש ומדיניות הפרטיות.
      </p>
      </div>
    </div>
    </div>
  );
}

function Field({
  id, name, label, type = "text", required, ...rest
}: {
  id: string; name: string; label: string; type?: string; required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-ink-600">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        className="h-11 w-full rounded-sm border border-ink-200 px-3.5 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
        {...rest}
      />
    </div>
  );
}
