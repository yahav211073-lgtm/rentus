"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquarePlus, Send, Star } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * כתיבת ביקורת על הפלטפורמה.
 *
 * ברירת המחדל היא כפתור ולא טופס פתוח: סקציית ביקורות שנגמרת בטופס
 * ארוך פתוח דוחפת את שאר עמוד הבית מטה בשביל פעולה שרוב הגולשים
 * לא יבצעו.
 */
export function SiteReviewForm({
  currentUserName, hasReviews,
}: { currentUserName: string | null; hasReviews: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <div className="rounded-lg border border-success-500/30 bg-success-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-success-500" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-ink-900">תודה על הביקורת</p>
        <p className="mt-1 text-sm text-ink-600">היא תופיע כאן ברגע שתאושר.</p>
      </div>
    );
  }

  if (!currentUserName) {
    return (
      <div className="rounded-lg border border-ink-200/70 bg-ink-50/60 p-6 text-center">
        <MessageSquarePlus className="mx-auto mb-3 h-8 w-8 text-brand-600" aria-hidden="true" />
        <p className="mb-1 font-display text-lg font-bold text-ink-900">
          {hasReviews ? "גם לכם יש מה לספר?" : "עדיין אין ביקורות על האתר"}
        </p>
        <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-ink-600">
          ביקורות נכתבות מחשבון מזוהה בלבד, ועוברות בדיקה לפני פרסום.
        </p>
        <ButtonLink href="/login?next=/" variant="secondary" size="md">
          התחברות וכתיבת ביקורת
        </ButtonLink>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        <Button type="button" variant="secondary" size="md" onClick={() => setOpen(true)}>
          כתיבת ביקורת על האתר
        </Button>
      </div>
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
      const res = await fetch("/api/site-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          quote: form.get("quote"),
          authorName: form.get("authorName"),
          authorRole: form.get("authorRole") || undefined,
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
    <form onSubmit={onSubmit} className="space-y-3.5 rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
      <h3 className=" text-base font-bold text-ink-900">כתיבת ביקורת על האתר</h3>

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

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="sr-name" className="mb-1.5 block text-xs font-bold text-ink-600">
            השם שיוצג <span className="text-danger-500">*</span>
          </label>
          <input
            id="sr-name" name="authorName" required defaultValue={currentUserName}
            className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
          />
        </div>
        <div>
          <label htmlFor="sr-role" className="mb-1.5 block text-xs font-bold text-ink-600">
            תפקיד או תיאור (לא חובה)
          </label>
          <input
            id="sr-role" name="authorRole" placeholder="למשל: מפיק אירועים"
            className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sr-quote" className="mb-1.5 block text-xs font-bold text-ink-600">
          הביקורת <span className="text-danger-500">*</span>
        </label>
        <textarea
          id="sr-quote" name="quote" rows={4} required minLength={10}
          placeholder="מה עבד לכם טוב באתר, ומה אפשר לשפר"
          className="w-full rounded-xs border border-ink-200 px-3.5 py-2.5 text-base outline-none focus:border-brand-400"
        />
      </div>

      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="sr-company">אל תמלאו שדה זה</label>
        <input id="sr-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit" variant="accent" size="md"
          loading={state === "loading"}
          icon={<Send className="h-4 w-4" />}
        >
          שליחה לאישור
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>ביטול</Button>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-danger-500">{error}</p>}
    </form>
  );
}
