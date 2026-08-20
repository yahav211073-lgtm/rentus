"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, CheckCircle2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * "הצעת מחיר / הזמנה" — הפנייה הישירה לעסק.
 *
 * ה-API‏ (/api/leads) ומסך הלידים באדמין היו קיימים מזמן, אבל שום
 * רכיב באתר לא קרא ל-API — כלומר הפעולה המרכזית של עמוד העסק לא
 * הייתה קיימת בפועל, וטבלת הלידים נשארה ריקה מסיבה טכנית ולא עסקית.
 *
 * הטופס הוא דיאלוג ולא פאנל בעמוד: הוא נפתח מכל אחד משלושת מקומות
 * ה-CTA (ההירו, העמודה הדביקה, הסרגל התחתון במובייל) בלי לשכפל את
 * הטופס שלוש פעמים ובלי לשלוח את הגולש לעמוד אחר באמצע ההשוואה.
 *
 * השדה `company` הוא שדה דבש — מוסתר מהעין אבל לא מ-JS או מבוט,
 * ונבדק גם בשרת.
 */
export function LeadForm({
  businessId, businessName, label = "הצעת מחיר / הזמנה", className,
}: {
  businessId: string;
  businessName: string;
  /** תווית כפתור הפתיחה */
  label?: string;
  /** מחלקות נוספות לכפתור הפתיחה — הכפתור עצמו מרונדר כאן ולא מבחוץ,
      כי פונקציית render-prop לא עוברת מרכיב שרת לרכיב לקוח. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    // מיקוד לשדה הראשון, אחרי אנימציית הפתיחה
    const t = setTimeout(() => firstFieldRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    // שדה דבש מלא: מציגים "נשלח" ולא שולחים כלום. בוט שמקבל שגיאה
    // מנסה שוב; בוט שמקבל הצלחה מפסיק.
    if (form.get("company")) { setState("done"); return; }

    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          name: String(form.get("name") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          email: String(form.get("email") ?? "").trim() || undefined,
          message: String(form.get("message") ?? "").trim() || undefined,
          sourcePage: window.location.pathname,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "משהו השתבש. נסו שוב.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("אין חיבור לרשת. נסו שוב.");
      setState("idle");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setState("idle"); setError(""); setOpen(true); }}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-xs px-6 font-bold text-white",
          "bg-[var(--accent-strong)] shadow-[0_8px_20px_-8px_var(--accent-strong)]",
          "transition-[background-color,transform] duration-200",
          "hover:-translate-y-px hover:bg-[var(--accent-stronger)] active:translate-y-0",
          className,
        )}
      >
        <CalendarCheck className="h-4.5 w-4.5" aria-hidden="true" />
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[80] bg-brand-950/55 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: reduced ? 0 : 24, scale: reduced ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : 0.99 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-[81] max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:inset-0 sm:m-auto sm:h-fit sm:max-w-[460px] sm:rounded-xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="סגירת הטופס"
                className="absolute top-4 grid h-10 w-10 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                style={{ insetInlineEnd: 16 }}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              {state === "done" ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" aria-hidden="true" />
                  <h2 id={titleId} className="mb-2 font-display text-xl text-ink-900">
                    הפנייה נשלחה
                  </h2>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink-600">
                    {businessName} קיבלו את הפרטים שלכם ויחזרו אליכם ישירות.
                  </p>
                  <Button variant="secondary" size="md" className="mt-6" onClick={() => setOpen(false)}>
                    סגירה
                  </Button>
                </div>
              ) : (
                <>
                  <span className="mb-4 inline-grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <CalendarCheck className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h2 id={titleId} className="font-display text-xl text-ink-900">
                    הצעת מחיר מ{businessName}
                  </h2>
                  <p className="mt-1.5 mb-5 text-sm leading-relaxed text-ink-500">
                    השאירו פרטים ומה אתם צריכים. הפנייה נשלחת ישירות לחברה — בלי עלות ובלי התחייבות.
                  </p>

                  <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
                    <Field label="שם מלא" name="name" required inputRef={firstFieldRef} autoComplete="name" />
                    <Field
                      label="טלפון" name="phone" type="tel" required
                      autoComplete="tel" dir="ltr" placeholder="050-0000000"
                    />
                    <Field label="אימייל (לא חובה)" name="email" type="email" autoComplete="email" dir="ltr" />

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                        מה אתם צריכים? (לא חובה)
                      </span>
                      <textarea
                        name="message"
                        rows={3}
                        maxLength={2000}
                        placeholder="לדוגמה: 8 מכשירי קשר לאירוע ב-12.9, אזור המרכז"
                        className="w-full resize-y rounded-xs border border-ink-200 bg-white px-3.5 py-2.5 text-base text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
                      />
                    </label>

                    {/* שדה דבש */}
                    <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
                      <label>
                        אל תמלאו שדה זה
                        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                      </label>
                    </div>

                    {error && (
                      <p role="alert" className="rounded-xs bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-700">
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      variant="accent"
                      size="lg"
                      fullWidth
                      loading={state === "loading"}
                      icon={<Send className="h-4.5 w-4.5" />}
                    >
                      שליחת הפנייה
                    </Button>

                    <p className="text-center text-xs leading-relaxed text-ink-400">
                      הפרטים מועברים ל{businessName} בלבד לצורך מענה לפנייה.
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({
  label, name, type = "text", required, inputRef, className, ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<"input">, "name" | "type" | "required" | "className">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </span>
      <input
        ref={inputRef}
        name={name}
        type={type}
        required={required}
        className={cn(
          "h-11 w-full rounded-xs border border-ink-200 bg-white px-3.5 text-base text-ink-800",
          "outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400",
          className,
        )}
        {...rest}
      />
    </label>
  );
}
