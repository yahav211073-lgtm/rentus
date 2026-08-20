"use client";

import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

/**
 * הרשמה לניוזלטר.
 *
 * הטופס אמיתי: הוא שולח ל-/api/newsletter, שמכניס שורה
 * ל-newsletter_subscribers עם confirmed_at ריק ושולח מייל אישור.
 * אישור כפול הוא לא נחמדות — זו דרישה של חוק התקשורת.
 *
 * הודעת ההצלחה מנוסחת בהתאם: "שלחנו מייל אישור", לא "נרשמת".
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "שגיאה");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "משהו השתבש. נסו שוב.");
    }
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <Reveal scale>
          <div className="relative isolate overflow-hidden rounded-xl bg-brand-900 px-6 py-12 sm:px-12 sm:py-16">
            {/* רקע */}
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 90% at 85% 15%, rgba(255,193,7,0.2), transparent 62%)," +
                    "radial-gradient(55% 80% at 10% 90%, rgba(74,135,214,0.35), transparent 65%)",
                }}
              />
              <div className="bg-dots absolute inset-0 opacity-30" />
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-accent-300">
                  <Mail className="h-3.5 w-3.5" />
                  ניוזלטר
                </span>
                <h2 className="mb-3 font-display text-3xl text-white sm:text-4xl">
                  החברות הכי מומלצות, פעם בשבוע
                </h2>
                <p className="max-w-lg text-md leading-relaxed text-white/65">
                  מדריך אחד, שלוש חברות נבחרות ומבצע אחד שכדאי להכיר.
                  בלי ספאם, ואפשר לבטל בלחיצה אחת.
                </p>
              </div>

              <div>
                {state === "done" ? (
                  <div className="flex items-start gap-3 rounded-lg border border-success-500/30 bg-success-500/10 p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-500" />
                    <div>
                      <p className="font-bold text-white">כמעט סיימנו</p>
                      <p className="mt-1 text-sm text-white/65">
                        שלחנו מייל אישור ל-{email}. לחצו על הקישור שבו כדי להשלים את ההרשמה.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1">
                      <label htmlFor="newsletter-email" className="sr-only">
                        כתובת אימייל
                      </label>
                      <input
                        id="newsletter-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="האימייל שלכם"
                        aria-describedby={error ? "newsletter-error" : undefined}
                        aria-invalid={state === "error" || undefined}
                        className="h-13 w-full rounded-sm border border-white/15 bg-white/10 px-4 text-base text-white outline-none backdrop-blur-sm transition-colors placeholder:text-white/40 focus:border-accent-400/60 focus:bg-white/15"
                      />
                    </div>
                    <Button type="submit" variant="accent" size="lg" loading={state === "loading"}>
                      הרשמה
                    </Button>
                  </form>
                )}

                {state === "error" && (
                  <p id="newsletter-error" role="alert" className="mt-2 text-sm text-danger-500">
                    {error}
                  </p>
                )}

                {state !== "done" && (
                  <p className="mt-3 text-xs text-white/45">
                    בהרשמה אתם מאשרים קבלת דיוור. לא נעביר את הכתובת לאף גורם שלישי.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
