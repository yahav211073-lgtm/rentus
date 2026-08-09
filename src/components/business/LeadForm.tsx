"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * טופס פנייה.
 *
 * זה המוצר. כל השאר בעמוד קיים כדי להביא את המשתמש לכאן, ולכן:
 *
 * · שלושה שדות בלבד. כל שדה נוסף מוריד השלמה. שם וטלפון חובה,
 *   הודעה אופציונלית — בעל עסק יכול להתקשר בלי לדעת מה רצו,
 *   אבל לא בלי מספר.
 *
 * · אין reCAPTCHA. במקומו יש שדה דבש (honeypot) והגבלת קצב בשרת.
 *   CAPTCHA פוגע בשיעור ההמרה, בנגישות, ובעיקר — מדובר בטופס
 *   ליצירת קשר, לא בכניסה לחשבון בנק.
 *
 * · הודעת ההצלחה אומרת מה קורה עכשיו ("העסק יחזור אליכם"), לא
 *   "נשלח בהצלחה". המשתמש רוצה לדעת מה השלב הבא.
 */

interface Props {
  businessId: string;
  businessName: string;
}

export function LeadForm({ businessId, businessName }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    // שדה דבש: בוטים ממלאים כל שדה. אדם לא רואה אותו.
    if (form.get("company")) {
      setState("done");
      return;
    }

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          name: form.get("name"),
          phone: form.get("phone"),
          message: form.get("message") || undefined,
          sourcePage: window.location.pathname,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? "שליחה נכשלה");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "משהו השתבש. נסו שוב.");
    }
  }

  if (state === "done") {
    return (
      <section className="rounded-lg border border-success-500/30 bg-success-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success-500" />
        <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">הפנייה נשלחה</h2>
        <p className="text-sm leading-relaxed text-ink-600">
          {businessName} קיבלו את הפרטים שלכם ויחזרו אליכם בדרך כלל
          תוך יום עסקים אחד.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
      <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">
        קבלת הצעת מחיר
      </h2>
      <p className="mb-5 text-sm text-ink-500">
        השאירו פרטים ו{businessName} יחזרו אליכם. הפנייה ללא עלות וללא התחייבות.
      </p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <Field id="lead-name" name="name" label="שם מלא" required autoComplete="name" />
        <Field
          id="lead-phone" name="phone" label="טלפון" type="tel" required
          autoComplete="tel" inputMode="tel" placeholder="050-0000000"
        />

        <div>
          <label htmlFor="lead-message" className="mb-1.5 block text-xs font-bold text-ink-600">
            במה נוכל לעזור? <span className="font-normal text-ink-400">(לא חובה)</span>
          </label>
          <textarea
            id="lead-message"
            name="message"
            rows={3}
            className="w-full rounded-sm border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
            placeholder="תיאור קצר של מה שאתם צריכים"
          />
        </div>

        {/* שדה דבש — מוסתר מבני אדם ומקוראי מסך, גלוי לבוטים */}
        <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="lead-company">אל תמלאו שדה זה</label>
          <input id="lead-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Button
          type="submit" variant="accent" size="lg" fullWidth
          loading={state === "loading"}
          icon={<Send className="h-4.5 w-4.5" />}
        >
          שליחת פנייה
        </Button>

        {state === "error" && (
          <p role="alert" className="text-sm text-danger-500">{error}</p>
        )}

        <p className="text-2xs leading-relaxed text-ink-400">
          בשליחה אתם מאשרים שהפרטים יועברו לעסק לצורך יצירת קשר בלבד.
        </p>
      </form>
    </section>
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
