"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { RentusLogo } from "@/components/brand/RentusLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";
import type { Category } from "@/types/domain";

const STAFF_ROLES = ["admin", "moderator", "editor"];

function dashboardHrefFor(role: string) {
  return STAFF_ROLES.includes(role) ? "/admin" : "/business/dashboard";
}

/**
 * ההדר הלבן הראשי — לפי הרפרנס:
 * לוגו בימין, ניווט טקסטואלי במרכז, ושני כפתורים בשמאל
 * (כניסה לבעלי עסקים בקו-מתאר כחול, הצטרפות לחברות בכתום מלא).
 *
 * ההדר sticky ולא fixed: הוא יושב בזרימת העמוד מתחת לפס הכהה,
 * ונדבק לראש המסך בגלילה — בדיוק כמו באתרי אינדקס קלאסיים.
 */

const NAV_LINKS = [
  { label: "ראשי", href: "/" },
  { label: "חיפוש חברות", href: "/search" },
  { label: "קטגוריות ציוד", href: "/categories" },
  { label: "אודות", href: "/about" },
  { label: "צור קשר", href: "/contact" },
];

export function Header({
  user, brandName, logoUrl, categories,
}: { user: CurrentUser | null; brandName: string; logoUrl?: string | null; categories: Category[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  /* סגירת התפריט במעבר עמוד — בזמן הרינדור, לא ב-useEffect. */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  // נעילת גלילה כשהתפריט הנייד פתוח
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink-200/80 bg-white shadow-[0_2px_12px_-6px_rgba(12,29,64,0.12)]">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          {/* לוגו */}
          <Link href="/" className="shrink-0" aria-label="לעמוד הבית">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-10 w-auto" />
            ) : (
              <RentusLogo brandName={brandName} />
            )}
          </Link>

          {/* ניווט דסקטופ */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="ניווט ראשי">
            {NAV_LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-xs px-3 py-2 text-[15px] font-semibold transition-colors",
                    active
                      ? "text-brand-600"
                      : "text-ink-700 hover:bg-brand-50 hover:text-brand-700",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* פעולות */}
          <div className="ms-auto flex items-center gap-2.5 lg:ms-0">
            {user ? (
              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  href={dashboardHrefFor(user.role)}
                  className="inline-flex items-center gap-1.5 rounded-xs px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-100"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {user.fullName ?? "האזור האישי"}
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    aria-label="התנתקות"
                    className="grid h-10 w-10 place-items-center rounded-xs text-ink-500 transition-colors hover:bg-ink-100"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/business/login"
                className="hidden h-11 items-center rounded-sm border border-ink-300 bg-white px-4 text-sm font-bold text-ink-800 transition-colors hover:border-brand-400 hover:text-brand-700 md:inline-flex"
              >
                כניסה לבעלי עסקים
              </Link>
            )}

            <Link
              href="/business/register"
              className="hidden h-11 items-center rounded-sm bg-[#F4590C] px-5 text-sm font-bold text-white shadow-[0_6px_16px_-6px_rgba(244,89,12,0.55)] transition-all hover:-translate-y-px hover:bg-[#E04F08] sm:inline-flex"
            >
              הצטרפות לחברות
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="פתיחת תפריט"
              aria-expanded={mobileOpen}
              className="grid h-10 w-10 place-items-center rounded-xs text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} user={user} categories={categories} />
    </>
  );
}

/* ============================================================================
   תפריט מובייל
   ============================================================================ */

function MobileMenu({
  open, onClose, user, categories,
}: { open: boolean; onClose: () => void; user: CurrentUser | null; categories: Category[] }) {
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

              <div className="my-4 h-px bg-ink-100" />

              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="flex items-center gap-3 rounded-sm p-3 transition-colors hover:bg-brand-50"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-sm"
                        style={{ background: `${cat.accentColor}14`, color: cat.accentColor ?? undefined }}
                      >
                        <CategoryIcon name={cat.icon} className="h-5 w-5" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-base font-bold text-ink-800">{cat.name}</span>
                        <span className="text-xs text-ink-400">{cat.businessCount} חברות</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="grid gap-2 border-t border-ink-100 p-4">
              <Link
                href="/business/register"
                className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-[#F4590C] px-5 text-base font-bold text-white transition-colors hover:bg-[#E04F08]"
              >
                הצטרפות לחברות
              </Link>
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
                <ButtonLink href="/business/login" variant="secondary" size="lg" fullWidth>
                  כניסה לבעלי עסקים
                </ButtonLink>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
