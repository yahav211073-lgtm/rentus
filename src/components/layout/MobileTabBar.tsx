"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutGrid, Home, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * סרגל ניווט תחתון — מובייל וטאבלט בלבד.
 *
 * למה בכלל:
 * בדסקטופ כל הניווט הראשי גלוי בשורה אחת בראש העמוד. במובייל הוא כולו
 * מוסתר מאחורי המבורגר, כלומר כל מעבר בין החלקים המרכזיים של האתר עולה
 * שתי נגיעות ופתיחת מגירה. הסרגל התחתון מחזיר את אותם ארבעה יעדים
 * לנגיעה אחת, באזור שהאגודל מגיע אליו — וזה מה שסוגר את הפער בין
 * "אותם רכיבים" לבין "אותה חוויה".
 *
 * החיפוש במרכז ובעיגול נייבי מורם, לא כתום: הכתום שמור לפעולת ההצטרפות
 * לפי מערכת העיצוב, והחיפוש בהירו הוא ממילא כפתור נייבי. עיגול מורם ולא
 * פריט שטוח כמו השאר כי זו הפעולה שכל האתר קיים בשבילה.
 *
 * הסרגל אינו מרונדר בעמודי הניהול — שם יש שלד ניווט משלו (AdminShell),
 * ושני סרגלים תחתונים זה על זה הם באג ולא פיצ'ר.
 */

const ITEMS = [
  { href: "/", label: "ראשי", Icon: Home },
  { href: "/categories", label: "קטגוריות", Icon: LayoutGrid },
  { href: "/search", label: "חיפוש", Icon: Search, primary: true },
  { href: "/blog", label: "מדריכים", Icon: BookOpen },
  { href: "/login", label: "אזור אישי", Icon: UserRound },
] as const;

export function MobileTabBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="ניווט מהיר"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[70] lg:hidden",
        "border-t border-ink-200/80 bg-white/92 backdrop-blur-xl",
        "shadow-[0_-8px_28px_-18px_rgba(11,59,117,0.5)]",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex h-[58px] max-w-md items-stretch justify-between px-1">
        {ITEMS.map(({ href, label, Icon, ...rest }) => {
          const primary = "primary" in rest && rest.primary;
          const target = href === "/login" && isLoggedIn ? "/business/dashboard" : href;
          const active = isActive(href);

          if (primary) {
            return (
              <li key={href} className="flex flex-1 items-center justify-center">
                <Link
                  href={target}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mt-5 grid h-13 w-13 place-items-center rounded-full bg-brand-800 text-white",
                    "shadow-[0_10px_24px_-8px_rgba(11,59,117,0.65)] ring-4 ring-white",
                    "transition-transform duration-200 active:scale-95",
                  )}
                >
                  <Icon className="h-5.5 w-5.5" strokeWidth={2.2} aria-hidden="true" />
                </Link>
              </li>
            );
          }

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={target}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1 rounded-sm text-2xs font-semibold transition-colors",
                  active ? "text-brand-800" : "text-ink-500",
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden="true"
                />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
