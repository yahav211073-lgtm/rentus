"use client";

import { useState } from "react";
import { CheckCircle2, Megaphone, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * בקשה לפרסם באתר.
 *
 * הבקשה נוחתת בתיבת הפניות בניהול (leads עם kind='ad_request'), ולא
 * במייל: פנייה שיושבת בתיבת מייל אישית לא ניתנת למעקב, ואי אפשר
 * לדעת מהניהול אילו בקשות טופלו ואילו לא.
 *
 * הטופס סגור כברירת מחדל ונפתח בלחיצה. משבצת פרסום שנגמרת בטופס
 * ארוך פתוח דוחפת את תוכן העמוד מטה עבור פעולה שרוב הגולשים —
 * שמחפשים ציוד להשכרה — לא יבצעו.
 */

const PLACEMENTS = [
  "באנר בעמוד הבית",
  "באנר בעמוד הקטגוריות",
  "סיידבר עמוד הבית",
  "באנרים צדדיים",
  "עוד לא החלטתי",
];

export function AdRequestForm({ defaultPlacement }: { defaultPlacement?: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <div className="rounded-lg border border-success-500/30 bg-success-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-success-500" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-ink-900">הבקשה נשלחה</p>
        <p className="mt-1 text-sm text-ink-600">נחזור אליכם עם האפשרויות והמחירים.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="text-center">
        <Button
          type="button"
          variant="secondary"
          size="md"
          icon={<Megaphone className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setOpen(true)}
        >
          בקשה לפרסום באתר
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (form.get("company")) { setState("done"); return; }  // דבש

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        /* businessName ו-placement אינם שדות בטבלת leads. קודם הם
           נשלחו כמפתחות עצמאיים ו-zod פשוט השמיט אותם בשקט — כלומר
           המנהל קיבל פנייה בלי לדעת על איזה מיקום מדובר. עכשיו הם
           נכנסים ל-subject ול-message, שני שדות אמיתיים שנשמרים. */
        body: JSON.stringify({
          kind: "ad_request",
          subject: [form.get("businessName"), form.get("placement")]
            .filter(Boolean).join(" · ") || "בקשה לפרסום באתר",
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email") || undefined,
          message: form.get("message") || undefined,
          sourcePage: window.location.pathname,
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
    <form
      onSubmit={onSubmit}
      className="space-y-3.5 rounded-lg border border-ink-200/70 bg-white p-5 text-start sm:p-6"
    >
      <h3 className="text-base font-bold text-ink-900">בקשה לפרסום באתר</h3>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id="ar-name" name="name" label="שם איש קשר" required />
        <Field id="ar-phone" name="phone" label="טלפון" type="tel" required dir="ltr" />
        <Field id="ar-business" name="businessName" label="שם העסק" />
        <Field id="ar-email" name="email" label="אימייל" type="email" dir="ltr" />
      </div>

      <div>
        <label htmlFor="ar-placement" className="mb-1.5 block text-xs font-bold text-ink-600">
          איפה תרצו לפרסם?
        </label>
        <select
          id="ar-placement"
          name="placement"
          defaultValue={defaultPlacement ?? PLACEMENTS[PLACEMENTS.length - 1]}
          className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3.5 text-base outline-none focus:border-brand-400"
        >
          {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="ar-message" className="mb-1.5 block text-xs font-bold text-ink-600">
          פרטים נוספים (לא חובה)
        </label>
        <textarea
          id="ar-message"
          name="message"
          rows={3}
          className="w-full rounded-xs border border-ink-200 p-3.5 text-base outline-none focus:border-brand-400"
        />
      </div>

      {/* שדה דבש — מוסתר מהעין ומקוראי מסך, ולכן רק בוט ימלא אותו. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
      />

      {error && (
        <p role="alert" className="text-sm font-semibold text-danger-500">{error}</p>
      )}

      <div className="flex flex-wrap gap-2.5 pt-1">
        <Button
          type="submit"
          variant="accent"
          size="md"
          disabled={state === "loading"}
          icon={<Send className="h-4 w-4" aria-hidden="true" />}
        >
          {state === "loading" ? "שולח…" : "שליחת הבקשה"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
          ביטול
        </Button>
      </div>
    </form>
  );
}

function Field({
  id, name, label, type = "text", required, dir,
}: {
  id: string; name: string; label: string;
  type?: string; required?: boolean; dir?: "ltr";
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-ink-600">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        dir={dir}
        required={required}
        className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
      />
    </div>
  );
}
