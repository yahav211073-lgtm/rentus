import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApproveRejectButtons, ArchiveToggleButton } from "@/components/admin/BusinessActionButtons";
import type { BusinessStatus } from "@/types/domain";

export const metadata = { title: "ניהול עסקים", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<BusinessStatus, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  draft: { label: "טיוטה", variant: "neutral" },
  pending: { label: "ממתין", variant: "warning" },
  published: { label: "פורסם", variant: "success" },
  rejected: { label: "נדחה", variant: "danger" },
  suspended: { label: "מושעה", variant: "danger" },
  archived: { label: "בארכיון", variant: "neutral" },
};

const TABS: { key: string; label: string }[] = [
  { key: "pending", label: "ממתינים" },
  { key: "published", label: "פורסמו" },
  { key: "rejected", label: "נדחו" },
  { key: "all", label: "הכל" },
];

export default async function AdminBusinessesPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "pending", q } = await searchParams;

  const supabase = await createSupabaseServerClient();

  /**
   * החיפוש תופס גם שם עסק וגם שם בעלים.
   *
   * זה שתי שאילתות ולא אחת בכוונה: סינון על משאב מקונן ב-PostgREST
   * דורש ‎!inner‎, וברגע שמכריחים join פנימי כל עסק בלי בעלים (עסק
   * שהוזן ידנית מהניהול) נעלם מהתוצאות — כולל כשלא מחפשים כלום.
   * לכן קודם מאתרים את הפרופילים שמתאימים, ואז מחפשים לפי שם העסק
   * **או** לפי מזהי הבעלים שנמצאו.
   */
  let ownerIds: string[] = [];
  if (q) {
    const { data: owners } = await supabase!
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(50);
    ownerIds = (owners ?? []).map((o) => o.id);
  }

  let query = supabase!
    .from("businesses")
    .select("id, name, slug, status, city:cities(name), phone, created_at, owner_id, owner:profiles(full_name, email, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);
  if (q) {
    const clauses = [`name.ilike.%${q}%`];
    if (ownerIds.length > 0) clauses.push(`owner_id.in.(${ownerIds.join(",")})`);
    query = query.or(clauses.join(","));
  }

  const { data: businesses } = await query;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink-900">ניהול עסקים</h1>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex gap-2">
            <input type="hidden" name="status" value={status} />
            <input
              type="search" name="q" defaultValue={q}
              placeholder="חיפוש לפי שם עסק או שם בעלים..."
              className="h-10 w-64 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
            />
          </form>
          <ButtonLink href="/admin/businesses/new" variant="accent" size="md" icon={<Plus className="h-4 w-4" />}>
            הוספת עסק
          </ButtonLink>
        </div>
      </div>

      <div className="mb-5 flex gap-1 border-b border-ink-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/businesses?status=${t.key}`}
            className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              status === t.key
                ? "border-brand-700 text-brand-800"
                : "border-transparent text-ink-400 hover:text-ink-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-200/70 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-start text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 text-start font-bold">שם</th>
              <th className="px-4 py-3 text-start font-bold">בעל העסק</th>
              <th className="px-4 py-3 text-start font-bold">עיר</th>
              <th className="px-4 py-3 text-start font-bold">טלפון</th>
              <th className="px-4 py-3 text-start font-bold">סטטוס</th>
              <th className="px-4 py-3 text-start font-bold">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(businesses ?? []).map((b) => {
              const s = STATUS_LABEL[b.status as BusinessStatus];
              const owner = b.owner as unknown as
                { full_name: string | null; email: string | null; phone: string | null } | null;
              return (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/businesses/${b.id}`} className="font-bold text-ink-800 hover:text-brand-700">
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {/* עסק בלי owner_id הוא עסק שהוזן ידנית מהניהול ועוד
                        לא שויך לחשבון — מצב תקין ומתועד ב-createBusinessAdmin.
                        מסומן במפורש כדי שלא ייקרא כשדה חסר. */}
                    {owner ? (
                      <span className="flex flex-col">
                        <span className="font-semibold text-ink-800">{owner.full_name ?? "—"}</span>
                        <span className="text-2xs text-ink-400" dir="ltr">{owner.email ?? owner.phone ?? ""}</span>
                      </span>
                    ) : (
                      <span className="text-2xs text-ink-400">לא משויך לחשבון</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{(b.city as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{b.phone ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant={s.variant}>{s.label}</Badge></td>
                  <td className="px-4 py-3">
                    {b.status === "pending" ? (
                      <ApproveRejectButtons businessId={b.id} />
                    ) : (
                      <ArchiveToggleButton businessId={b.id} isArchived={b.status === "archived"} />
                    )}
                  </td>
                </tr>
              );
            })}
            {(businesses ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-400">אין עסקים בסטטוס הזה.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
