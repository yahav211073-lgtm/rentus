"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

const SUBJECTS = [
  "שאלה כללית",
  "בעיה טכנית באתר",
  "רישום או עריכה של עסק",
  "פרסום ושיתופי פעולה",
  "תלונה על עסק",
];

/**
 * טופס יצירת קשר.
 *
 * לא היה טופס בעמוד הזה בכלל — רק קישורי טלפון ומייל. הפנייה נשמרת
 * כשורת leads עם kind='contact' ובלי business_id, וזה מה שדרש את
 * מיגרציה 0019: העמודה הייתה not null, כלומר פנייה כללית לא יכלה
 * להישמר במסד גם אם היה טופס.
 *
 * אותו נתיב API של פניות לעסק (/api/leads), ולכן אותה הגבלת קצב,
 * אותו שדה דבש ואותו אימות טלפון ישראלי. טופס ציבורי שני עם ולידציה
 * משלו הוא בדיוק המקום שבו אחד מהשניים נשאר מאחור.
 */
export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <div className="rounded-lg border border-success-500/30 bg-success-50 p-7 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success-500" aria-hidden="true" />
        <h3 className="mb-1.5 text-lg text-ink-900">הפנייה נשלחה</h3>
        <p className="text-sm leading-relaxed text-ink-600">
          קיבלנו את הפנייה ונחזור אליכם בדרך כלל תוך יום עסקים אחד.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    // שדה דבש — נבדק גם כאן וגם בשרת
    if (form.get("company")) { setState("done"); return; }

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "contact",
          subject: form.get("subject") || "שאלה כללית",
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email") || undefined,
          message: form.get("message") || undefined,
          sourcePage: window.location.pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "השליחה נכשלה");
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "משהו השתבש. נסו שוב.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-ink-200/80 bg-white p-5 sm:p-6">
      <h2 className="text-xl text-ink-900">שלחו לנו הודעה</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-name" name="name" label="שם מלא" required autoComplete="name" />
        <Field id="c-phone" name="phone" label="טלפון" type="tel" required
               inputMode="tel" autoComplete="tel" placeholder="050-0000000" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="c-email" name="email" label="אימייל" type="email" autoComplete="email" />
        <div>
          <label htmlFor="c-subject" className="mb-1.5 block text-xs font-bold text-ink-600">נושא</label>
          <select
            id="c-subject" name="subject"
            className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3.5 text-base outline-none focus:border-brand-400"
          >
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-xs font-bold text-ink-600">
          ההודעה <span className="text-danger-500">*</span>
        </label>
        <textarea
          id="c-message" name="message" rows={5} required maxLength={2000}
          className="w-full rounded-xs border border-ink-200 px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
          placeholder="במה נוכל לעזור?"
        />
      </div>

      {/* שדה דבש — מוסתר מבני אדם, נראה לבוטים.
          לא -left-[9999px]: ל-absolute כאן אין הורה ממוקם, ולכן הוא
          נמדד מול המסמך ומותח את הדף ל-10,374px רוחב. זה נצפה בפועל
          במובייל. דפוס ה-sr-only (1px + clip-path) מסתיר בלי לתפוס
          מקום ובלי להשפיע על רוחב הפריסה בכלל.
          aria-hidden ו-tabIndex מוציאים אותו ממסלול המקלדת ומקורא מסך. */}
      <div
        aria-hidden="true"
        className="absolute h-px w-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]"
      >
        <label htmlFor="c-company">אל תמלאו שדה זה</label>
        <input id="c-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button
        type="submit" variant="accent" size="lg" fullWidth
        loading={state === "loading"}
        icon={<Send className="h-4.5 w-4.5" />}
      >
        שליחת הפנייה
      </Button>

      {error && <p role="alert" className="text-sm font-semibold text-danger-500">{error}</p>}
    </form>
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
        id={id} name={name} type={type} required={required}
        className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
        {...rest}
      />
    </div>
  );
}
