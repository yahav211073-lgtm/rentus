"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown, LayoutDashboard, LogOut, Menu, Search, Store, User, X, Sparkles,
} from "lucide-react";
import { seedCategories } from "@/data/seed";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useScrolledPast } from "@/lib/hooks/browser-state";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";

const STAFF_ROLES = ["admin", "moderator", "editor"];

function dashboardHrefFor(role: string) {
  return STAFF_ROLES.includes(role) ? "/admin" : "/business/dashboard";
}

/**
 * ניווט עליון.
 *
 * · מתכווץ בגלילה: מ-76px ל-62px, והרקע עובר משקוף לזכוכית. השינוי
 *   מתרחש ב-24px גלילה — מספיק מוקדם כדי להרגיש מיידי, מספיק מאוחר
 *   כדי לא להבהב בגלילה מיקרוסקופית.
 *
 * · תפריט-על נפתח ב-hover בדסקטופ, אבל גם ב-focus וב-Enter — אחרת
 *   הוא לא נגיש למקלדת. סגירה ב-Escape.
 *
 * · במובייל: תפריט מסך מלא עם דירוג כניסה. הגלילה של הגוף ננעלת
 *   כשהוא פתוח, אחרת הרקע זז מתחת לאצבע.
 */

const NAV_LINKS = [
  { label: "עסקים מומלצים", href: "/search?sort=rating" },
  { label: "מדריכים", href: "/blog" },
  { label: "אודות", href: "/about" },
];

export function Header({ user }: { user: CurrentUser | null }) {
  // useSyncExternalStore ולא useEffect+setState: הערך נכון כבר
  // ברינדור הראשון בלקוח, בלי רינדור מדורג. ראו browser-state.ts.
  const scrolled = useScrolledPast(24);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const reduced = useReducedMotion();

  /* סגירת התפריטים במעבר עמוד. בזמן הרינדור ולא ב-useEffect,
     אחרת התפריט נשאר פתוח לפריים אחד מעל העמוד החדש. */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMegaOpen(false);
  }

  // נעילת גלילה כשהתפריט הנייד פתוח
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Escape סוגר הכל
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMegaOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "glass shadow-[0_4px_24px_-8px_rgba(11,59,117,0.18)] border-b border-white/60"
            : "bg-transparent border-b border-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[1480px] items-center gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8",
            scrolled ? "h-[62px]" : "h-[76px]",
          )}
        >
          {/* לוגו */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="לעמוד הבית">
            <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-brand-700 to-brand-900 shadow-[0_4px_12px_-2px_rgba(11,59,117,0.5)]">
              <Store className="h-4.5 w-4.5 text-white" strokeWidth={2.4} />
              <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-accent-400 ring-2 ring-white" />
            </span>
            <span className="flex flex-col leading-none">
              <span className={cn(
                "font-display text-lg font-extrabold tracking-tight transition-colors",
                scrolled ? "text-brand-900" : "text-white",
              )}>
                אינדקס
              </span>
              <span className={cn(
                "text-2xs font-medium transition-colors",
                scrolled ? "text-ink-400" : "text-white/65",
              )}>
                כל העסקים במקום אחד
              </span>
            </span>
          </Link>

          {/* ניווט דסקטופ */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="ניווט ראשי">
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMegaOpen((v) => !v)}
                aria-expanded={megaOpen}
                aria-haspopup="true"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xs px-3.5 py-2 text-base font-semibold transition-colors",
                  scrolled
                    ? "text-ink-700 hover:bg-brand-50 hover:text-brand-800"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                קטגוריות
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform duration-300", megaOpen && "rotate-180")}
                />
              </button>

              <AnimatePresence>
                {megaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: reduced ? 0 : 10, scale: reduced ? 1 : 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: reduced ? 0 : 6, scale: reduced ? 1 : 0.99 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full mt-2 w-[min(880px,90vw)] overflow-hidden rounded-lg border border-ink-200 bg-white p-5 shadow-[0_28px_60px_-16px_rgba(11,59,117,0.28)]"
                    style={{ insetInlineStart: 0 }}
                  >
                    <div className="grid grid-cols-4 gap-x-5 gap-y-1">
                      {seedCategories.map((cat) => (
                        <div key={cat.id} className="py-1.5">
                          <Link
                            href={`/category/${cat.slug}`}
                            className="group mb-1.5 flex items-center gap-2 rounded-xs p-1.5 transition-colors hover:bg-brand-50"
                          >
                            <span
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] transition-transform group-hover:scale-110"
                              style={{ background: `${cat.accentColor}14`, color: cat.accentColor ?? undefined }}
                            >
                              <CategoryIcon name={cat.icon} className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-bold text-ink-800 group-hover:text-brand-700">
                              {cat.name}
                            </span>
                          </Link>
                          <ul className="space-y-0.5 ps-1">
                            {cat.children?.slice(0, 4).map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={`/category/${sub.slug}`}
                                  className="block rounded-xs px-2 py-1 text-xs text-ink-500 transition-colors hover:text-brand-700"
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                      <p className="text-xs text-ink-400">
                        למעלה מ-14,000 עסקים מאומתים ב-340 ערים
                      </p>
                      <Link
                        href="/categories"
                        className="text-xs font-bold text-brand-700 hover:text-brand-500"
                      >
                        לכל הקטגוריות ←
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-xs px-3.5 py-2 text-base font-semibold transition-colors",
                  scrolled
                    ? "text-ink-700 hover:bg-brand-50 hover:text-brand-800"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* פעולות */}
          <div className="ms-auto flex items-center gap-2 lg:ms-0">
            <Link
              href="/search"
              aria-label="חיפוש"
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xs transition-colors lg:hidden",
                scrolled ? "text-ink-600 hover:bg-ink-100" : "text-white hover:bg-white/10",
              )}
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  href={dashboardHrefFor(user.role)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xs px-3 py-2 text-base font-semibold transition-colors",
                    scrolled
                      ? "text-ink-700 hover:bg-ink-100"
                      : "text-white/90 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {user.fullName ?? "האזור האישי"}
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    aria-label="התנתקות"
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xs transition-colors",
                      scrolled ? "text-ink-500 hover:bg-ink-100" : "text-white/80 hover:bg-white/10",
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "hidden items-center gap-1.5 rounded-xs px-3 py-2 text-base font-semibold transition-colors sm:inline-flex",
                  scrolled
                    ? "text-ink-700 hover:bg-ink-100"
                    : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <User className="h-4 w-4" />
                כניסה
              </Link>
            )}

            <ButtonLink
              href="/business/register"
              variant="accent"
              size="sm"
              className="hidden sm:inline-flex"
              icon={<Sparkles className="h-4 w-4" />}
            >
              רישום עסק
            </ButtonLink>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="פתיחת תפריט"
              aria-expanded={mobileOpen}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xs transition-colors lg:hidden",
                scrolled ? "text-ink-700 hover:bg-ink-100" : "text-white hover:bg-white/10",
              )}
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} user={user} />
    </>
  );
}

/* ============================================================================
   תפריט מובייל
   ============================================================================ */

function MobileMenu({
  open, onClose, user,
}: { open: boolean; onClose: () => void; user: CurrentUser | null }) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-brand-950/50 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="תפריט ניווט"
            initial={{ x: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduced ? 0 : "100%", opacity: reduced ? 0 : 1 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 z-[61] flex w-[min(92vw,400px)] flex-col bg-white shadow-2xl lg:hidden"
            style={{ insetInlineEnd: 0 }}
          >
            <div className="flex items-center justify-between border-b border-ink-100 p-4">
              <span className="font-display text-lg font-extrabold text-brand-900">תפריט</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגירת תפריט"
                className="grid h-10 w-10 place-items-center rounded-xs text-ink-500 transition-colors hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4" aria-label="ניווט נייד">
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: reduced ? 0 : 0.045 } } }}
                className="space-y-1"
              >
                {seedCategories.map((cat) => (
                  <motion.li
                    key={cat.id}
                    variants={{
                      hidden: { opacity: 0, x: reduced ? 0 : 24 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    <Link
                      href={`/category/${cat.slug}`}
                      className="flex items-center gap-3 rounded-sm p-3 transition-colors hover:bg-brand-50"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px]"
                        style={{ background: `${cat.accentColor}14`, color: cat.accentColor ?? undefined }}
                      >
                        <CategoryIcon name={cat.icon} className="h-5 w-5" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-base font-bold text-ink-800">{cat.name}</span>
                        <span className="text-xs text-ink-400">{cat.businessCount} עסקים</span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="my-4 h-px bg-ink-100" />

              <ul className="space-y-1">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block rounded-sm p-3 text-base font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="grid gap-2 border-t border-ink-100 p-4">
              <ButtonLink href="/business/register" variant="accent" size="lg" fullWidth>
                רישום עסק חינם
              </ButtonLink>
              {user ? (
                <>
                  <ButtonLink href={dashboardHrefFor(user.role)} variant="secondary" size="lg" fullWidth>
                    {user.fullName ?? "האזור האישי"}
                  </ButtonLink>
                  <form action="/api/auth/signout" method="post">
                    <Button type="submit" variant="ghost" size="lg" fullWidth icon={<LogOut className="h-4.5 w-4.5" />}>
                      התנתקות
                    </Button>
                  </form>
                </>
              ) : (
                <ButtonLink href="/login" variant="secondary" size="lg" fullWidth>
                  כניסה לחשבון
                </ButtonLink>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
