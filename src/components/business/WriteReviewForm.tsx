"use client";

import { useState } from "react";
import { Star, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  businessId: string;
  businessName: string;
}

export function WriteReviewForm({ businessId, businessName }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (form.get("company")) { setState("done"); return; } // honeypot
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
          authorEmail: form.get("authorEmail") || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "השליחה נכשלה");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "משהו השתבש. נסו שוב.");
    }
  }

  if (state === "done") {
    return (
      <section id="write-review" className="rounded-lg border border-success-500/30 bg-success-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-success-500" />
        <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">תודה על הביקורת</h2>
        <p className="text-sm text-ink-600">היא תפורסם לאחר בדיקה קצרה.</p>
      </section>
    );
  }

  return (
    <section id="write-review" className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
      <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">כתיבת ביקורת</h2>
      <p className="mb-5 text-sm text-ink-500">ספרו לאחרים איך הייתה החוויה שלכם עם {businessName}.</p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <div>
          <span className="mb-1.5 block text-xs font-bold text-ink-600">דירוג <span className="text-danger-500">*</span></span>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`${n} כוכבים`}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    (hoverRating || rating) >= n ? "fill-accent-400 text-accent-400" : "fill-transparent text-ink-300",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <Field id="review-name" name="authorName" label="שם" required autoComplete="name" />
        <Field id="review-title" name="title" label="כותרת (לא חובה)" />

        <div>
          <label htmlFor="review-body" className="mb-1.5 block text-xs font-bold text-ink-600">מה חוויתם?</label>
          <textarea
            id="review-body" name="body" rows={4}
            className="w-full rounded-sm border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
            placeholder="תארו את החוויה שלכם — מה עבד טוב, מה פחות"
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

        {error && <p role="alert" className="text-sm text-danger-500">{error}</p>}
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
        className="h-11 w-full rounded-sm border border-ink-200 px-3.5 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
        {...rest}
      />
    </div>
  );
}
