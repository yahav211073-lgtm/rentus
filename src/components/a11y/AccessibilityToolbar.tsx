"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Accessibility, Contrast, Eye, Link2, Minus, MousePointer2,
  Pause, Plus, RotateCcw, Type, X,
} from "lucide-react";
import { useStoredJson, writeStored } from "@/lib/hooks/browser-state";
import { cn } from "@/lib/utils";

/**
 * סרגל נגישות — תקן ישראלי ת"י 5568 / WCAG 2.2 AA.
 *
 * העקרונות שהנחו את המימוש:
 *
 * · ההעדפות נשמרות ב-localStorage ומוחלות על <html> לפני הצביעה
 *   הראשונה, על ידי סקריפט חוסם קטן (ראו A11yInit ב-layout).
 *   בלי זה, גולש שבחר ניגודיות גבוהה רואה הבזק של האתר הרגיל
 *   בכל טעינה — וזה בדיוק המשתמש שהכי נפגע מהבזקים.
 *
 * · כל שינוי משנה data-attribute על <html> בלבד. ה-CSS שמגיב לו
 *   יושב ב-globals.css. אין כאן מניפולציית סגנון ישירה על אלמנטים.
 *
 * · הכפתור עצמו לעולם לא נעלם ולא מוסתר בגלילה. הוא הדבר האחרון
 *   שאמור להיות קשה למצוא.
 *
 * · המיקוד נלכד בתוך הפאנל כשהוא פתוח, ומוחזר לכפתור בסגירה.
 */

const STORAGE_KEY = "index:a11y";

interface A11yState {
  fontScale: number;
  contrast: "normal" | "high" | "invert" | "grayscale";
  links: "normal" | "highlight";
  motion: "auto" | "off";
  dyslexia: "off" | "on";
  cursor: "normal" | "big";
  readingGuide: boolean;
}

const DEFAULTS: A11yState = {
  fontScale: 1,
  contrast: "normal",
  links: "normal",
  motion: "auto",
  dyslexia: "off",
  cursor: "normal",
  readingGuide: false,
};

const FONT_MIN = 0.85;
const FONT_MAX = 1.6;
const FONT_STEP = 0.075;

/* קבוע ברמת המודול — ברירת מחדל חדשה בכל רינדור הייתה מבטלת memo. */
const EMPTY_PREFS: Partial<A11yState> = {};

/** מחיל מצב על <html>. משותף עם סקריפט האתחול. */
function applyState(s: A11yState) {
  const root = document.documentElement;
  root.style.setProperty("--font-scale", String(s.fontScale));
  root.dataset.contrast = s.contrast;
  root.dataset.links = s.links;
  root.dataset.motion = s.motion === "off" ? "off" : "on";
  root.dataset.dyslexia = s.dyslexia;
  root.dataset.cursor = s.cursor;
}

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  /*
   * המצב נקרא ישירות מ-localStorage ולא מוחזק ב-useState.
   *
   * localStorage הוא מקור האמת היחיד כאן — הסקריפט ב-<head> כבר
   * קרא ממנו והחיל את ההעדפות לפני הצביעה. עותק שני ב-state היה
   * רק מקור לאי-התאמה, ודורש useEffect שגורם לרינדור מדורג.
   */
  const stored = useStoredJson<Partial<A11yState>>("local", STORAGE_KEY, EMPTY_PREFS);
  const state = useMemo<A11yState>(() => ({ ...DEFAULTS, ...stored }), [stored]);

  const update = useCallback((patch: Partial<A11yState>) => {
    const next = { ...DEFAULTS, ...stored, ...patch };
    applyState(next);
    writeStored("local", STORAGE_KEY, next);
  }, [stored]);

  const reset = useCallback(() => {
    applyState(DEFAULTS);
    writeStored("local", STORAGE_KEY, null);
  }, []);

  // Escape סוגר, והמיקוד חוזר לכפתור
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // לכידת מיקוד בתוך הפאנל
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKey);
    return () => panel.removeEventListener("keydown", onKey);
  }, [open]);

  const activeCount = countActive(state);

  return (
    <>
      {state.readingGuide && <ReadingGuide />}

      {/* כפתור פתיחה */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`הגדרות נגישות${activeCount ? `, ${activeCount} הגדרות פעילות` : ""}`}
        data-floating-ui
        className={cn(
          /* הכפתור מרחף מעל סרגל הניווט התחתון ולא עליו. bottom נגזר
             מהטוקן, כך שהוא יורד אוטומטית ל-20px בדסקטופ שבו אין סרגל. */
          "fixed z-[90] grid h-13 w-13 place-items-center rounded-full",
          "bg-brand-800 text-white shadow-[0_10px_28px_-6px_rgba(11,59,117,0.6)]",
          "transition-transform duration-200 hover:scale-105 active:scale-95",
        )}
        style={{ insetInlineStart: "1.25rem", bottom: "calc(var(--spacing-bottom-inset) + 1.25rem)" }}
      >
        <Accessibility className="h-6 w-6" strokeWidth={2.2} />
        {activeCount > 0 && (
          <span className="absolute -top-1 grid h-5 w-5 place-items-center rounded-full bg-accent-400 text-2xs font-bold text-brand-950"
                style={{ insetInlineEnd: "-0.25rem" }}>
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label="הגדרות נגישות"
            initial={{ opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[91] max-h-[min(70vh,560px)] w-[min(92vw,340px)] overflow-y-auto overscroll-contain rounded-lg border border-ink-200 bg-white shadow-[0_28px_64px_-16px_rgba(11,59,117,0.35)]"
            style={{ insetInlineStart: "1.25rem", bottom: "calc(var(--spacing-bottom-inset) + 5.25rem)" }}
          >
            <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-3">
              <h2 className="text-sm text-ink-900">הגדרות נגישות</h2>
              <button
                type="button"
                onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
                aria-label="סגירת הגדרות נגישות"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-500 transition-colors hover:bg-ink-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(70vh,540px)] space-y-4 overflow-y-auto p-4">
              {/* גודל טקסט */}
              <Group label="גודל טקסט" icon={<Type className="h-3.5 w-3.5" />}>
                <div className="flex items-center gap-2">
                  <StepButton
                    onClick={() => update({ fontScale: Math.max(FONT_MIN, +(state.fontScale - FONT_STEP).toFixed(3)) })}
                    disabled={state.fontScale <= FONT_MIN}
                    label="הקטנת טקסט"
                  >
                    <Minus className="h-4 w-4" />
                  </StepButton>

                  <div className="flex-1 text-center">
                    <span className="text-sm font-bold tabular-nums text-ink-800">
                      {Math.round(state.fontScale * 100)}%
                    </span>
                  </div>

                  <StepButton
                    onClick={() => update({ fontScale: Math.min(FONT_MAX, +(state.fontScale + FONT_STEP).toFixed(3)) })}
                    disabled={state.fontScale >= FONT_MAX}
                    label="הגדלת טקסט"
                  >
                    <Plus className="h-4 w-4" />
                  </StepButton>
                </div>
              </Group>

              {/* ניגודיות */}
              <Group label="ניגודיות וצבע" icon={<Contrast className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-2 gap-2">
                  <Toggle active={state.contrast === "normal"} onClick={() => update({ contrast: "normal" })}>רגיל</Toggle>
                  <Toggle active={state.contrast === "high"} onClick={() => update({ contrast: "high" })}>ניגודיות גבוהה</Toggle>
                  <Toggle active={state.contrast === "invert"} onClick={() => update({ contrast: "invert" })}>היפוך צבעים</Toggle>
                  <Toggle active={state.contrast === "grayscale"} onClick={() => update({ contrast: "grayscale" })}>גווני אפור</Toggle>
                </div>
              </Group>

              {/* עזרי קריאה */}
              <Group label="עזרי קריאה" icon={<Eye className="h-3.5 w-3.5" />}>
                <div className="space-y-2">
                  <SwitchRow
                    icon={<Link2 className="h-4 w-4" />}
                    label="הדגשת קישורים"
                    checked={state.links === "highlight"}
                    onChange={(v) => update({ links: v ? "highlight" : "normal" })}
                  />
                  <SwitchRow
                    icon={<Type className="h-4 w-4" />}
                    label="גופן ידידותי לדיסלקציה"
                    hint="מרווח אותיות ושורות מוגדל"
                    checked={state.dyslexia === "on"}
                    onChange={(v) => update({ dyslexia: v ? "on" : "off" })}
                  />
                  <SwitchRow
                    icon={<Eye className="h-4 w-4" />}
                    label="מדריך קריאה"
                    hint="פס אופקי שעוקב אחרי הסמן"
                    checked={state.readingGuide}
                    onChange={(v) => update({ readingGuide: v })}
                  />
                </div>
              </Group>

              {/* תנועה וניווט */}
              <Group label="תנועה וניווט" icon={<Pause className="h-3.5 w-3.5" />}>
                <div className="space-y-2">
                  <SwitchRow
                    icon={<Pause className="h-4 w-4" />}
                    label="עצירת אנימציות"
                    checked={state.motion === "off"}
                    onChange={(v) => update({ motion: v ? "off" : "auto" })}
                  />
                  <SwitchRow
                    icon={<MousePointer2 className="h-4 w-4" />}
                    label="סמן עכבר גדול"
                    checked={state.cursor === "big"}
                    onChange={(v) => update({ cursor: v ? "big" : "normal" })}
                  />
                </div>
              </Group>

              <button
                type="button"
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-ink-200 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:border-danger-500/40 hover:bg-danger-50 hover:text-danger-700"
              >
                <RotateCcw className="h-4 w-4" />
                איפוס כל ההגדרות
              </button>

              <p className="text-center text-2xs leading-relaxed text-ink-400">
                האתר עומד בתקן WCAG 2.2 ברמה AA.{" "}
                <a href="/accessibility" className="font-semibold text-brand-600 underline">
                  להצהרת הנגישות המלאה
                </a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function countActive(s: A11yState): number {
  let n = 0;
  if (s.fontScale !== 1) n++;
  if (s.contrast !== "normal") n++;
  if (s.links !== "normal") n++;
  if (s.motion !== "auto") n++;
  if (s.dyslexia !== "off") n++;
  if (s.cursor !== "normal") n++;
  if (s.readingGuide) n++;
  return n;
}

/* ============================================================================
   מדריך קריאה
   ============================================================================ */

/**
 * פס אופקי שעוקב אחרי הסמן ומאפיל על שאר העמוד.
 * מיושם בשני אלמנטים עם pointer-events:none, ומעודכן ב-rAF
 * כדי לא לירות עדכון state על כל אירוע עכבר.
 */
function ReadingGuide() {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let y = window.innerHeight / 2;

    const onMove = (e: MouseEvent) => {
      y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const band = 56;
        if (topRef.current) topRef.current.style.height = `${Math.max(0, y - band / 2)}px`;
        if (bottomRef.current) bottomRef.current.style.top = `${y + band / 2}px`;
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
      <div ref={topRef} className="absolute inset-x-0 top-0 bg-brand-950/45" style={{ height: "50%" }} />
      <div ref={bottomRef} className="absolute inset-x-0 bottom-0 bg-brand-950/45" style={{ top: "calc(50% + 28px)" }} />
    </div>
  );
}

/* ============================================================================
   רכיבי עזר
   ============================================================================ */

function Group({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-ink-400">
        {icon}
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

function StepButton({
  children, onClick, disabled, label,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-xs border border-ink-200 text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-ink-200 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Toggle({
  children, active, onClick,
}: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xs border px-3 py-2 text-xs font-semibold transition-colors",
        active
          ? "border-brand-800 bg-brand-800 text-white"
          : "border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50",
      )}
    >
      {children}
    </button>
  );
}

function SwitchRow({
  icon, label, hint, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xs border border-ink-200 px-3 py-2.5 text-start transition-colors hover:border-brand-300 hover:bg-brand-50"
    >
      <span className={cn("shrink-0 transition-colors", checked ? "text-brand-700" : "text-ink-400")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-ink-800">{label}</span>
        {hint && <span className="block text-2xs text-ink-400">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-700" : "bg-ink-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
            // ב-RTL הידית מתחילה מימין ונעה שמאלה
            checked ? "start-4.5" : "start-0.5",
          )}
        />
      </span>
    </button>
  );
}
