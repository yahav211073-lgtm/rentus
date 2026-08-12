"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * הרשמה אחת לכולם — משתמש רגיל או בעל עסק. התפקיד מתחיל כ-'user'
 * ומשתדרג ל-'business_owner' אוטומטית כשממלאים את טופס רישום העסק
 * (ראו migration 0011 ואת /business/register).
 */
export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [state, setState] = useState<"idle" | "loading" | "error" | "check-email">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setState("error");
      setError("החיבור למסד הנתונים לא הוגדר.");
      return;
    }

    setState("loading");
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: { data: { full_name: String(form.get("fullName")) } },
    });

    if (signUpError) {
      setState("error");
      setError(
        signUpError.message === "User already registered"
          ? "כבר קיים חשבון עם האימייל הזה."
          : "משהו השתבש. נסו שוב.",
      );
      return;
    }

    // אם אימות אימייל דלוק בפרויקט ה-Supabase, אין סשן עדיין — צריך
    // ללחוץ על הקישור שנשלח. אם כבוי, ההרשמה מחברת אוטומטית.
    if (!data.session) {
      setState("check-email");
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (state === "check-email") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 text-center sm:px-6">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" />
        <h1 className="mb-2 font-display text-xl font-extrabold text-ink-900">כמעט סיימנו</h1>
        <p className="text-sm leading-relaxed text-ink-600">
          שלחנו אליכם מייל אישור. לחצו על הקישור שבו כדי להשלים את ההרשמה ולהתחבר.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-1.5 font-display text-2xl font-extrabold text-ink-900">יצירת חשבון</h1>
      <p className="mb-7 text-sm text-ink-500">
        כבר יש לכם חשבון? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-brand-700 hover:text-brand-500">כניסה</Link>
      </p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <Field id="signup-name" name="fullName" label="שם מלא" required autoComplete="name" />
        <Field id="signup-email" name="email" label="אימייל" type="email" required autoComplete="email" />
        <Field
          id="signup-password" name="password" label="סיסמה" type="password" required
          autoComplete="new-password" minLength={6}
        />

        <Button
          type="submit" variant="primary" size="lg" fullWidth
          loading={state === "loading"}
          icon={<UserPlus className="h-4.5 w-4.5" />}
        >
          הרשמה
        </Button>

        {state === "error" && (
          <p role="alert" className="text-sm text-danger-500">{error}</p>
        )}

        <p className="text-2xs leading-relaxed text-ink-400">
          בהרשמה אתם מאשרים את תנאי השימוש ומדיניות הפרטיות.
        </p>
      </form>
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
