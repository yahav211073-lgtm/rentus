"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { PopupBanner, PopupLayout } from "@/types/domain";
import { Button, ButtonLink } from "@/components/ui/Button";
import { detectDevice, isWithinSchedule, matchesTargeting } from "@/lib/ads/targeting";
import { cn } from "@/lib/utils";

/**
 * מנוע הפופאפים.
 *
 * המנוע מציג לכל היותר פופאפ אחד בכל רגע, ובוחר אותו לפי priority.
 * שני פופאפים במקביל הם לא באג בתצוגה — הם באג בעיצוב המוצר.
 *
 * הגבלת התדירות היא הלב של הרכיב הזה:
 *   · maxShowsPerUser — כמה פעמים בסך הכל
 *   · cooldownHours — כמה זמן בין הצגות
 *   · dismissCooldownHours — כמה זמן לכבד סגירה ידנית
 *
 * הכל נשמר ב-localStorage תחת מפתח אחד לכל פופאפ. גרסת הייצור
 * מסנכרנת גם לטבלת popup_views בשרת, כדי שניקוי דפדפן לא יאפס את
 * הספירה ויציף את הגולש מחדש.
 *
 * טריגר exit_intent מאזין ליציאת העכבר מהחלק העליון של החלון בלבד.
 * במובייל אין exit intent אמיתי — שם הוא נופל לטריגר השהיה, במקום
 * להאזין לתנועות גלילה מהירות שגורמות לפופאפ לקפוץ באמצע קריאה.
 */

const STORAGE_PREFIX = "index:popup:";

interface PopupMemory {
  shown: number;
  lastShownAt: number;
  dismissedAt?: number;
}

function readMemory(id: string): PopupMemory {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (raw) return JSON.parse(raw);
  } catch { /* חסום */ }
  return { shown: 0, lastShownAt: 0 };
}

function writeMemory(id: string, m: PopupMemory) {
  try { localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(m)); } catch { /* חסום */ }
}

const HOUR = 3600_000;

/** האם מותר להציג את הפופאפ הזה עכשיו, לפי הזיכרון המקומי. */
function isAllowedByFrequency(p: PopupBanner, m: PopupMemory, now: number): boolean {
  if (m.dismissedAt && now - m.dismissedAt < p.dismissCooldownHours * HOUR) return false;
  if (m.shown >= p.maxShowsPerUser) return false;
  if (m.lastShownAt && now - m.lastShownAt < p.cooldownHours * HOUR) return false;
  return true;
}

interface Props {
  popups: PopupBanner[];
  isLoggedIn?: boolean;
  isBusinessOwner?: boolean;
  categorySlugs?: string[];
  citySlug?: string;
}

export function PopupManager({
  popups, isLoggedIn = false, isBusinessOwner = false, categorySlugs, citySlug,
}: Props) {
  const pathname = usePathname();
  const [active, setActive] = useState<PopupBanner | null>(null);
  /* הנתיב שבו כבר הוצג פופאפ. שמירת הנתיב במקום דגל בוליאני מייתרת
     איפוס ידני — הבדיקה עצמה כבר יודעת שהעמוד התחלף. */
  const firedPathRef = useRef<string | null>(null);

  /** המועמדים: פעילים, בתוך חלון הזמן, ומתאימים למיקוד. ממוינים לפי עדיפות. */
  const candidates = useMemo(() => {
    if (typeof window === "undefined") return [];
    const device = detectDevice(window.innerWidth);
    const ctx = {
      path: pathname, device, isLoggedIn, isBusinessOwner, categorySlugs, citySlug,
    };

    return popups
      .filter((p) => p.isActive)
      .filter((p) => isWithinSchedule(p))
      .filter((p) => matchesTargeting(p.targeting, ctx))
      .sort((a, b) => b.priority - a.priority);
  }, [popups, pathname, isLoggedIn, isBusinessOwner, categorySlugs, citySlug]);

  const show = useCallback((p: PopupBanner) => {
    // פופאפ אחד לכל עמוד, לכל היותר
    if (firedPathRef.current === pathname) return;
    firedPathRef.current = pathname;

    const m = readMemory(p.id);
    writeMemory(p.id, { ...m, shown: m.shown + 1, lastShownAt: Date.now() });
    setActive(p);

    // דיווח חשיפה. keepalive כדי שהבקשה תשרוד ניווט מיידי.
    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ popupId: p.id, type: "impression", path: pathname }),
      keepalive: true,
    }).catch(() => { /* מדידה שנכשלה לא אמורה לשבור את החוויה */ });
  }, [pathname]);

  /*
   * סגירת הפופאפ במעבר עמוד.
   *
   * מבוצע בזמן הרינדור ולא ב-useEffect — זו התבנית ש-React ממליץ
   * עליה ל"התאמת state כשה-props משתנים". ב-effect זה היה גורם
   * לפופאפ הישן להיות מרונדר לפריים אחד בעמוד החדש לפני שהוא נעלם.
   */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setActive(null);
  }

  useEffect(() => {
    const now = Date.now();
    const eligible = candidates.filter((p) => isAllowedByFrequency(p, readMemory(p.id), now));
    const target = eligible[0];
    if (!target) return;

    const isMobile = window.innerWidth < 768;
    const cleanups: (() => void)[] = [];

    switch (target.triggerType) {
      case "immediate":
      case "first_visit":
      case "returning_visitor": {
        show(target);
        break;
      }

      case "delay": {
        const t = setTimeout(() => show(target), target.triggerDelaySec * 1000);
        cleanups.push(() => clearTimeout(t));
        break;
      }

      case "scroll": {
        const onScroll = () => {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          if (max <= 0) return;
          const pct = (window.scrollY / max) * 100;
          if (pct >= target.triggerScrollPct) show(target);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
        break;
      }

      case "exit_intent": {
        if (isMobile) {
          // אין exit intent אמיתי במגע — נופלים להשהיה
          const t = setTimeout(() => show(target), Math.max(target.triggerDelaySec, 20) * 1000);
          cleanups.push(() => clearTimeout(t));
        } else {
          const onLeave = (e: MouseEvent) => {
            // רק יציאה מהחלק העליון — לשם נעה העכבר בדרך לסגירת הטאב
            if (e.clientY <= 0) show(target);
          };
          document.addEventListener("mouseout", onLeave);
          cleanups.push(() => document.removeEventListener("mouseout", onLeave));
        }
        break;
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, [candidates, show]);

  const dismiss = useCallback((reason: "close" | "cta") => {
    if (!active) return;
    const m = readMemory(active.id);
    if (reason === "close") {
      writeMemory(active.id, { ...m, dismissedAt: Date.now() });
    }

    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        popupId: active.id,
        type: reason === "cta" ? "click" : "close",
        path: pathname,
      }),
      keepalive: true,
    }).catch(() => { /* התעלמות */ });

    setActive(null);
  }, [active, pathname]);

  return (
    <AnimatePresence>
      {active && <PopupView popup={active} onDismiss={dismiss} />}
    </AnimatePresence>
  );
}

/* ============================================================================
   תצוגת הפופאפ
   ============================================================================ */

/** גיאומטריה וכניסה לכל פריסה. */
const LAYOUTS: Record<PopupLayout, {
  wrapper: string;
  panel: string;
  from: Record<string, number | string>;
  backdrop: boolean;
}> = {
  modal: {
    wrapper: "inset-0 grid place-items-center p-4",
    panel: "w-full max-w-lg rounded-xl",
    from: { opacity: 0, scale: 0.94, y: 24 },
    backdrop: true,
  },
  fullscreen: {
    wrapper: "inset-0",
    panel: "h-full w-full rounded-none",
    from: { opacity: 0, scale: 1.02 },
    backdrop: false,
  },
  slide: {
    wrapper: "inset-y-0 end-0 p-4 flex items-center",
    panel: "w-[min(92vw,420px)] rounded-xl",
    from: { opacity: 0, x: "110%" },
    backdrop: true,
  },
  bottom_bar: {
    wrapper: "inset-x-0 bottom-0 p-3 sm:p-4",
    panel: "w-full rounded-lg",
    from: { opacity: 0, y: "110%" },
    backdrop: false,
  },
  corner: {
    wrapper: "bottom-4 end-4 max-w-full",
    panel: "w-[min(92vw,380px)] rounded-lg",
    from: { opacity: 0, y: 28, scale: 0.96 },
    backdrop: false,
  },
};

function PopupView({
  popup: p, onDismiss,
}: { popup: PopupBanner; onDismiss: (r: "close" | "cta") => void }) {
  const reduced = useReducedMotion();
  const layout = LAYOUTS[p.layout];
  const panelRef = useRef<HTMLDivElement>(null);
  const isBar = p.layout === "bottom_bar";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss("close"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <>
      {layout.backdrop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          onClick={() => onDismiss("close")}
          className="fixed inset-0 z-[100] bg-brand-950/55 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      <div className={cn("pointer-events-none fixed z-[101]", layout.wrapper)}>
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal={layout.backdrop}
          aria-labelledby={`popup-heading-${p.id}`}
          tabIndex={-1}
          initial={reduced ? { opacity: 0 } : layout.from}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={reduced ? { opacity: 0 } : layout.from}
          transition={{ duration: reduced ? 0.01 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "pointer-events-auto relative overflow-hidden bg-white shadow-[0_32px_80px_-20px_rgba(5,25,47,0.55)]",
            layout.panel,
          )}
        >
          <button
            type="button"
            onClick={() => onDismiss("close")}
            aria-label="סגירה"
            className="absolute top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-ink-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-ink-900"
            style={{ insetInlineEnd: "0.75rem" }}
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <div className={cn(isBar && "mx-auto flex max-w-[1480px] items-center gap-5 p-4")}>
            {/* תמונה — לא בפס תחתון (אין שם מקום), ולא כשאין תמונה.
                מסגרת ריקה במקום קריאייטיב היא בדיוק מה שגורם לפופאפ
                להיראות שבור; פופאפ טקסטואלי נקי עדיף על מלבן ריק. */}
            {!isBar && p.assetUrl && (
              <div className="relative aspect-[2/1] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.assetUrl} alt={p.alt ?? ""} className="h-full w-full object-cover" />
              </div>
            )}

            <div className={cn(isBar ? "flex flex-1 items-center gap-5" : "p-6")}>
              <div className={cn(isBar && "flex-1")}>
                {p.heading && (
                  <h2
                    id={`popup-heading-${p.id}`}
                    className={cn(
                      "font-display font-extrabold text-ink-900",
                      isBar ? "text-base" : "mb-2 text-xl sm:text-2xl",
                    )}
                  >
                    {p.heading}
                  </h2>
                )}
                {p.body && (
                  <p className={cn("leading-relaxed text-ink-500", isBar ? "text-sm" : "mb-6 text-base")}>
                    {p.body}
                  </p>
                )}
              </div>

              <div className={cn("flex gap-2", isBar ? "shrink-0" : "flex-col sm:flex-row")}>
                {p.ctaLabel && p.ctaHref && (
                  <ButtonLink
                    href={p.ctaHref}
                    variant="accent"
                    size={isBar ? "md" : "lg"}
                    onClick={() => onDismiss("cta")}
                    className={cn(!isBar && "flex-1")}
                  >
                    {p.ctaLabel}
                  </ButtonLink>
                )}
                {p.secondaryLabel && (
                  <Button
                    variant="ghost"
                    size={isBar ? "md" : "lg"}
                    onClick={() => onDismiss("close")}
                  >
                    {p.secondaryLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
