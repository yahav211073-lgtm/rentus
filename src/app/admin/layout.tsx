import Link from "next/link";
import {
  Briefcase, LayoutGrid, LayoutDashboard, Megaphone, MessageSquareQuote, Settings, Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

/**
 * מעטפת האדמין. proxy.ts כבר חוסם גישה למי שאינו staff — כאן רק
 * מציגים סרגל ניווט. אין בדיקת הרשאה כפולה כי זו כבר אחריות ה-proxy.
 */
const NAV = [
  { href: "/admin", label: "דשבורד", icon: LayoutDashboard, exact: true },
  { href: "/admin/businesses", label: "עסקים", icon: Briefcase },
  { href: "/admin/reviews", label: "ביקורות", icon: MessageSquareQuote },
  { href: "/admin/categories", label: "קטגוריות", icon: LayoutGrid },
  { href: "/admin/ads", label: "מודעות ובאנרים", icon: Megaphone },
  { href: "/admin/settings", label: "הגדרות אתר", icon: Settings },
  { href: "/admin/users", label: "משתמשים", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="shrink-0 lg:w-56">
          <div className="mb-4 rounded-lg border border-ink-200/70 bg-white p-4">
            <p className="text-xs text-ink-400">מחובר כ־</p>
            <p className="truncate font-bold text-ink-800">{user?.fullName ?? user?.email}</p>
          </div>
          <nav className="rounded-lg border border-ink-200/70 bg-white p-2">
            <ul className="space-y-0.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xs px-3 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-800"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="/"
            className="mt-4 block px-3 text-xs font-semibold text-ink-400 hover:text-brand-600"
          >
            ← חזרה לאתר
          </Link>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
