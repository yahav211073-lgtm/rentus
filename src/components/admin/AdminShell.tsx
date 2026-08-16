"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight, Briefcase, FileText, LayoutDashboard, LayoutGrid, LogOut, Megaphone,
  Menu, MessageCircle, MessageSquareQuote, Settings, Star, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * מעטפת התצוגה של הניהול.
 *
 * שני דברים שהמסך הקודם לא עשה ולכן היה קשה לעבודה:
 *
 * 1. אין סימון לעמוד הפעיל. סרגל ניווט שכל הפריטים בו נראים זהים
 *    מאלץ את המשתמש לקרוא את הכותרת כדי לדעת איפה הוא נמצא.
 *
 * 2. במובייל הסרגל תפס את כל רוחב המסך מעל התוכן. כאן הוא נפתח
 *    כמגירה, והתוכן מקבל את המסך המלא — ניהול מהטלפון הוא לא מקרה
 *    קצה, זה איך שמאשרים עסק בזמן אמת.
 */

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { href: "/admin", label: "דשבורד", icon: LayoutDashboard, exact: true },
  { href: "/admin/businesses", label: "עסקים ובקשות", icon: Briefcase },
  { href: "/admin/leads", label: "פניות", icon: MessageCircle },
  { href: "/admin/reviews", label: "ביקורות עסקים", icon: MessageSquareQuote },
  { href: "/admin/testimonials", label: "ביקורות על האתר", icon: Star },
  { href: "/admin/articles", label: "מאמרים", icon: FileText },
  { href: "/admin/categories", label: "קטגוריות וערים", icon: LayoutGrid },
  { href: "/admin/ads", label: "מודעות ובאנרים", icon: Megaphone },
  { href: "/admin/settings", label: "הגדרות אתר", icon: Settings },
  { href: "/admin/users", label: "משתמשים", icon: Users },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "מנהל ראשי",
  moderator: "מנהל תוכן",
  editor: "עורך",
};

export function AdminShell({
  children, userName, role,
}: { children: React.ReactNode; userName: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // סגירת המגירה במעבר עמוד, בזמן הרינדור ולא ב-effect — אחרת היא
  // נשארת פתוחה לפריים אחד מעל העמוד החדש.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const nav = (
    <nav aria-label="ניווט ניהול">
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xs px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-800 text-white"
                    : "text-ink-600 hover:bg-brand-50 hover:text-brand-800",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* סרגל עליון — במובייל בלבד */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="פתיחת תפריט ניהול"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-xs text-ink-700 transition-colors hover:bg-ink-100"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="font-display text-base font-extrabold text-brand-900">ניהול</span>
        <Link
          href="/"
          className="grid h-10 w-10 place-items-center rounded-xs text-ink-500 transition-colors hover:bg-ink-100"
          aria-label="חזרה לאתר"
        >
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        {/* סרגל צד — דסקטופ */}
        <aside className="hidden shrink-0 lg:block lg:w-60">
          <div className="sticky top-6">
            <div className="mb-4 rounded-lg border border-ink-200/70 bg-white p-4">
              <p className="text-2xs text-ink-400">מחובר כ־</p>
              <p className="truncate font-bold text-ink-800">{userName}</p>
              <p className="mt-0.5 text-2xs font-semibold text-brand-600">
                {ROLE_LABEL[role] ?? role}
              </p>
            </div>
            <div className="rounded-lg border border-ink-200/70 bg-white p-2">{nav}</div>
            <div className="mt-4 space-y-1 px-1">
              <Link
                href="/"
                className="flex items-center gap-2 px-2 text-xs font-semibold text-ink-400 transition-colors hover:text-brand-600"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                חזרה לאתר
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-ink-400 transition-colors hover:text-danger-500"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  התנתקות
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* מגירת ניווט — מובייל */}
        {open && (
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגירת התפריט"
              className="fixed inset-0 z-50 bg-brand-950/50 lg:hidden"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="תפריט ניהול"
              className="fixed inset-y-0 z-[51] flex w-[min(85vw,300px)] flex-col bg-white shadow-2xl lg:hidden"
              style={{ insetInlineStart: 0 }}
            >
              <div className="flex items-center justify-between border-b border-ink-100 p-4">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-800">{userName}</p>
                  <p className="text-2xs text-brand-600">{ROLE_LABEL[role] ?? role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="סגירת התפריט"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xs text-ink-500 hover:bg-ink-100"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">{nav}</div>
              <form action="/api/auth/signout" method="post" className="border-t border-ink-100 p-3">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xs px-3 py-2.5 text-sm font-semibold text-ink-600 hover:bg-danger-50 hover:text-danger-500"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  התנתקות
                </button>
              </form>
            </div>
          </>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
