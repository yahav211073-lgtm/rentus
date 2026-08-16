import Link from "next/link";
import {
  Briefcase, CheckCircle2, Clock, FileText, LayoutGrid, Megaphone,
  MessageCircle, MessageSquareQuote, Star, Users,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "דשבורד ניהול", robots: { index: false, follow: false } };

/**
 * דשבורד הניהול.
 *
 * כל מספר כאן הוא ספירה אמיתית מהמסד (count exact, head) ולא הערכה
 * או ערך לדוגמה. הקלף היחיד שמותר לו להיות 0 הוא קלף שבאמת אין בו
 * כלום — וזה בדיוק המידע שמנהל צריך.
 *
 * הספירות רצות במקביל; זו שאילתת head בלי גוף, ולכן העלות שלהן
 * זניחה גם כשיש עשר מהן.
 */
async function getStats() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  /** ספירה בלבד — head:true לא מחזיר שורות, ולכן העלות זניחה. */
  const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });

  const [
    pending, published, rejected,
    leadsTotal, leadsNew, leadsToday,
    reviewsPending, reviewsApproved,
    testimonialsPending,
    usersTotal, categoriesTotal, articlesPublished,
    banners, popups,
    recentLeads, recentBusinesses,
  ] = await Promise.all([
    head("businesses").eq("status", "pending"),
    head("businesses").eq("status", "published"),
    head("businesses").eq("status", "rejected"),
    head("leads"),
    head("leads").eq("status", "new"),
    head("leads").gte("created_at", todayStart.toISOString()),
    head("reviews").eq("status", "pending"),
    head("reviews").eq("status", "approved"),
    head("testimonials").eq("status", "pending"),
    head("profiles"),
    head("categories").eq("is_active", true),
    head("articles").eq("status", "published"),
    head("banners").eq("is_active", true),
    head("popup_banners").eq("is_active", true),
    supabase.from("leads")
      .select("id, name, phone, created_at, business:businesses(name, slug)")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("businesses")
      .select("id, name, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    pending: pending.count ?? 0,
    published: published.count ?? 0,
    rejected: rejected.count ?? 0,
    leadsTotal: leadsTotal.count ?? 0,
    leadsNew: leadsNew.count ?? 0,
    leadsToday: leadsToday.count ?? 0,
    reviewsPending: reviewsPending.count ?? 0,
    reviewsApproved: reviewsApproved.count ?? 0,
    testimonialsPending: testimonialsPending.count ?? 0,
    usersTotal: usersTotal.count ?? 0,
    categoriesTotal: categoriesTotal.count ?? 0,
    articlesPublished: articlesPublished.count ?? 0,
    activeAds: (banners.count ?? 0) + (popups.count ?? 0),
    recentLeads: recentLeads.data ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentBusinesses: (recentBusinesses.data ?? []) as any[],
  };
}

export default async function AdminDashboardPage() {
  const s = await getStats();

  if (!s) {
    return (
      <EmptyPanel title="אין חיבור למסד הנתונים">
        בדקו את משתני הסביבה של Supabase.
      </EmptyPanel>
    );
  }

  const actionCards = [
    {
      label: "בקשות שממתינות לאישור", value: s.pending, icon: Clock,
      href: "/admin/businesses?status=pending", tone: "warning" as const,
    },
    {
      label: "ביקורות עסקים לאישור", value: s.reviewsPending, icon: MessageSquareQuote,
      href: "/admin/reviews", tone: "warning" as const,
    },
    {
      label: "ביקורות אתר לאישור", value: s.testimonialsPending, icon: Star,
      href: "/admin/testimonials", tone: "warning" as const,
    },
    {
      label: "פניות חדשות", value: s.leadsNew, icon: MessageCircle,
      href: "/admin/leads?status=new", tone: "brand" as const,
    },
  ];

  const statCards = [
    { label: "עסקים מפורסמים", value: s.published, icon: CheckCircle2, href: "/admin/businesses?status=published" },
    { label: "פניות היום", value: s.leadsToday, icon: MessageCircle, href: "/admin/leads" },
    { label: "פניות בסך הכל", value: s.leadsTotal, icon: MessageCircle, href: "/admin/leads" },
    { label: "ביקורות מאושרות", value: s.reviewsApproved, icon: MessageSquareQuote, href: "/admin/reviews?status=approved" },
    { label: "משתמשים רשומים", value: s.usersTotal, icon: Users, href: "/admin/users" },
    { label: "קטגוריות פעילות", value: s.categoriesTotal, icon: LayoutGrid, href: "/admin/categories" },
    { label: "מאמרים מפורסמים", value: s.articlesPublished, icon: FileText, href: "/admin/articles" },
    { label: "מודעות פעילות", value: s.activeAds, icon: Megaphone, href: "/admin/ads" },
    { label: "עסקים שנדחו", value: s.rejected, icon: Briefcase, href: "/admin/businesses?status=rejected" },
  ];

  const needsAttention = actionCards.filter((c) => c.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">דשבורד</h1>
        <p className="mt-1 text-sm text-ink-500">
          {needsAttention.length > 0
            ? `${needsAttention.length} סוגי פריטים ממתינים לטיפול.`
            : "אין פריטים שממתינים לטיפול. הכל מעודכן."}
        </p>
      </div>

      {/* דורש טיפול */}
      <section aria-labelledby="needs-action">
        <h2 id="needs-action" className="mb-3 text-xs font-bold tracking-wide text-ink-400">
          דורש טיפול
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actionCards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={cnCard(c.value > 0)}
            >
              <span
                className={`mb-3 grid h-9 w-9 place-items-center rounded-sm ${
                  c.value > 0
                    ? c.tone === "warning" ? "bg-warning-50 text-warning-700" : "bg-brand-50 text-brand-700"
                    : "bg-ink-100 text-ink-400"
                }`}
              >
                <c.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <p className={`font-display text-3xl font-extrabold ${c.value > 0 ? "text-ink-900" : "text-ink-300"}`}>
                {c.value}
              </p>
              <p className="text-sm text-ink-500">{c.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* מדדי הפלטפורמה */}
      <section aria-labelledby="platform-stats">
        <h2 id="platform-stats" className="mb-3 text-xs font-bold tracking-wide text-ink-400">
          מצב הפלטפורמה
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="flex items-center gap-3 rounded-lg border border-ink-200/70 bg-white p-4 transition-colors hover:border-brand-300"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-ink-100 text-ink-500">
                <c.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-xl font-extrabold text-ink-900">{c.value}</span>
                <span className="block truncate text-xs text-ink-500">{c.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* פעילות אחרונה */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="בקשות אחרונות" href="/admin/businesses?status=pending" linkLabel="לכל הבקשות">
          {s.recentBusinesses.length === 0 ? (
            <EmptyRow>אין בקשות שממתינות לאישור.</EmptyRow>
          ) : (
            <ul className="divide-y divide-ink-100">
              {s.recentBusinesses.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/admin/businesses/${b.id}`} className="min-w-0 font-bold text-ink-800 hover:text-brand-700">
                    <span className="block truncate">{b.name}</span>
                  </Link>
                  <span className="shrink-0 text-2xs text-ink-400">{formatRelative(b.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="פניות אחרונות" href="/admin/leads" linkLabel="לכל הפניות">
          {s.recentLeads.length === 0 ? (
            <EmptyRow>עדיין לא התקבלו פניות.</EmptyRow>
          ) : (
            <ul className="divide-y divide-ink-100">
              {s.recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink-800">{l.name ?? "ללא שם"}</span>
                    <span className="block truncate text-2xs text-ink-400">
                      {(l.business as unknown as { name: string } | null)?.name ?? "פנייה כללית"}
                    </span>
                  </span>
                  <span className="shrink-0 text-2xs text-ink-400">{formatRelative(l.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function cnCard(highlight: boolean) {
  return [
    "rounded-lg border bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-md",
    highlight ? "border-warning-500/35" : "border-ink-200/70",
  ].join(" ");
}

function Panel({
  title, href, linkLabel, children,
}: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink-200/70 bg-white p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-ink-900">{title}</h2>
        <Link href={href} className="text-xs font-bold text-brand-700 hover:text-brand-500">
          {linkLabel} ←
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink-400">{children}</p>;
}

function EmptyPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6">
      <p className="font-bold text-ink-900">{title}</p>
      <p className="text-sm text-ink-600">{children}</p>
    </div>
  );
}
