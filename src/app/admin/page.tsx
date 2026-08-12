import Link from "next/link";
import { Briefcase, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "דשבורד ניהול", robots: { index: false, follow: false } };

async function getCounts() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { pending: 0, published: 0, leadsToday: 0, activeAds: 0 };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [pending, published, leadsToday, banners, popups] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    supabase.from("banners").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("popup_banners").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return {
    pending: pending.count ?? 0,
    published: published.count ?? 0,
    leadsToday: leadsToday.count ?? 0,
    activeAds: (banners.count ?? 0) + (popups.count ?? 0),
  };
}

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  const cards = [
    {
      label: "ממתינים לאישור", value: counts.pending, icon: Clock,
      href: "/admin/businesses?status=pending", tone: "warning" as const,
    },
    { label: "עסקים פורסמו", value: counts.published, icon: CheckCircle2, href: "/admin/businesses?status=published", tone: "success" as const },
    { label: "פניות היום", value: counts.leadsToday, icon: MessageSquare, href: "/admin/businesses", tone: "brand" as const },
    { label: "מודעות פעילות", value: counts.activeAds, icon: Briefcase, href: "/admin/ads", tone: "brand" as const },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink-900">דשבורד</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-ink-200/70 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-sm ${
              c.tone === "warning" ? "bg-warning-50 text-warning-500"
              : c.tone === "success" ? "bg-success-50 text-success-500"
              : "bg-brand-50 text-brand-700"
            }`}
            >
              <c.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-3xl font-extrabold text-ink-900">{c.value}</p>
            <p className="text-sm text-ink-500">{c.label}</p>
          </Link>
        ))}
      </div>

      {counts.pending > 0 && (
        <div className="mt-6 rounded-lg border border-warning-500/30 bg-warning-50 p-5">
          <p className="font-bold text-ink-900">
            {counts.pending} עסקים ממתינים לבדיקה שלך.
          </p>
          <Link href="/admin/businesses?status=pending" className="text-sm font-bold text-brand-700 hover:text-brand-500">
            למעבר לרשימת האישורים ←
          </Link>
        </div>
      )}
    </div>
  );
}
