"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, LogIn, Send, Star } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  businessId: string;
  businessName: string;
  /** null = אורח. הטופס לא מוצג לו — ביקורת דורשת חשבון. */
  currentUserName: string | null;
  /** נתיב הדף הנוכחי, כדי לחזור אליו אחרי ההתחברות. */
  returnTo: string;
}

/**
 * כתיבת ביקורת על עסק.
 *
 * לאורח מוצגת הזמנה להתחבר ולא טופס. הצגת טופס שייכשל בשליחה היא
 * הדרך הבטוחה לאבד ביקורת שמישהו כבר טרח לכתוב.
 */
export function WriteReviewForm({ businessId, businessName, currentUserName, returnTo }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  if (!currentUserName) {
    return (
      <section id="write-review" className="rounded-lg border border-ink-200/70 bg-white p-6 text-center">
        <LogIn className="mx-auto mb-3 h-8 w-8 text-brand-600" aria-hidden="true" />
        <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">רוצים לכתוב ביקורת?</h2>
        <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-ink-600">
          ביקורות נכתבות מחשבון מזוהה בלבד. זה מה ששומר על הדירוגים אמינים — ומונע ביקורות
          מזויפות על חברות אמיתיות.
        </p>
        <ButtonLink href={`/login?next=${encodeURIComponent(returnTo)}`} variant="primary" size="md">
          התחברות וכתיבת ביקורת
        </ButtonLink>
      </section>
    );
  }

  if (state === "done") {
    return (
      <section id="write-review" className="rounded-lg border border-success-500/30 bg-success-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-success-500" aria-hidden="true" />
        <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">תודה על הביקורת</h2>
        <p className="text-sm text-ink-600">
          היא ממתינה לבדיקה קצרה ותתפרסם בעמוד החברה ברגע שתאושר.
        </p>
      </section>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (form.get("company")) { setState("done"); return; } // דבש
    if (rating === 0) { setError("בחרו דירוג בכוכבים."); return; }

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          rating,
          title: form.get("title") || undefined,
          body: form.get("body") || undefined,
          authorName: form.get("authorName"),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "השליחה נכשלה");
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "משהו השתבש. נסו שוב.");
    }
  }

  return (
    <section id="write-review" className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
      <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">כתיבת ביקורת</h2>
      <p className="mb-5 text-sm text-ink-500">
        ספרו לאחרים איך הייתה החוויה שלכם עם {businessName}. הביקורת מתפרסמת אחרי בדיקה.
      </p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <fieldset>
          <legend className="mb-1.5 block text-xs font-bold text-ink-600">
            דירוג <span className="text-danger-500">*</span>
          </legend>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`${n} כוכבים`}
                aria-pressed={rating === n}
                className="rounded-xs p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    (hoverRating || rating) >= n
                      ? "fill-star-400 text-star-400"
                      : "fill-transparent text-ink-300",
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </fieldset>

        <Field
          id="review-name" name="authorName" label="השם שיוצג"
          required autoComplete="name" defaultValue={currentUserName}
        />
        <Field id="review-title" name="title" label="כותרת (לא חובה)" />

        <div>
          <label htmlFor="review-body" className="mb-1.5 block text-xs font-bold text-ink-600">
            מה חוויתם?
          </label>
          <textarea
            id="review-body" name="body" rows={4}
            className="w-full rounded-xs border border-ink-200 px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
            placeholder="תארו את החוויה — מה עבד טוב, מה פחות"
          />
        </div>

        <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="review-company">אל תמלאו שדה זה</label>
          <input id="review-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Button
          type="submit" variant="accent" size="lg" fullWidth
          loading={state === "loading"}
          icon={<Send className="h-4.5 w-4.5" />}
        >
          שליחת ביקורת
        </Button>

        {error && <p role="alert" className="text-sm font-semibold text-danger-500">{error}</p>}

        <p className="text-2xs text-ink-400">
          בשליחה אתם מאשרים את <Link href="/review-policy" className="font-bold text-brand-700 hover:text-brand-500">מדיניות הביקורות</Link>.
        </p>
      </form>
    </section>
  );
}

function Field({
  id, name, label, required, ...rest
}: { id: string; name: string; label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-ink-600">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      <input
        id={id} name={name} type="text" required={required}
        className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
        {...rest}
      />
    </div>
  );
}
