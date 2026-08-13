"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * כניסה מאוחדת — משתמשים רגילים ובעלי עסקים נכנסים מאותו טופס.
 * ההבדל היחיד הוא לאן חוזרים אחרי הכניסה (param `next`), וזה
 * מה שגם /business/login מנצל בלי לשכפל טופס.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    if (signInError) {
      setState("error");
      setError(
        signInError.message === "Invalid login credentials"
          ? "אימייל או סיסמה שגויים."
          : "משהו השתבש. נסו שוב.",
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="mb-1.5 font-display text-2xl font-extrabold text-ink-900">כניסה לחשבון</h1>
      <p className="mb-7 text-sm text-ink-500">
        עדיין אין לכם חשבון? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold text-brand-700 hover:text-brand-500">הרשמה</Link>
      </p>

      <GoogleSignInButton next={next} />

      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-200" />
        או
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <Field id="login-email" name="email" label="אימייל" type="email" required autoComplete="email" />
        <Field id="login-password" name="password" label="סיסמה" type="password" required autoComplete="current-password" />

        <Button
          type="submit" variant="primary" size="lg" fullWidth
          loading={state === "loading"}
          icon={<LogIn className="h-4.5 w-4.5" />}
        >
          כניסה
        </Button>

        {state === "error" && (
          <p role="alert" className="text-sm text-danger-500">{error}</p>
        )}
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
