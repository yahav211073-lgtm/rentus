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
  let query = supabase!
    .from("businesses")
    .select("id, name, slug, status, city:cities(name), phone, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: businesses } = await query;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">ניהול עסקים</h1>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex gap-2">
            <input type="hidden" name="status" value={status} />
            <input
              type="search" name="q" defaultValue={q}
              placeholder="חיפוש לפי שם..."
              className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
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
              <th className="px-4 py-3 text-start font-bold">עיר</th>
              <th className="px-4 py-3 text-start font-bold">טלפון</th>
              <th className="px-4 py-3 text-start font-bold">סטטוס</th>
              <th className="px-4 py-3 text-start font-bold">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(businesses ?? []).map((b) => {
              const s = STATUS_LABEL[b.status as BusinessStatus];
              return (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/businesses/${b.id}`} className="font-bold text-ink-800 hover:text-brand-700">
                      {b.name}
                    </Link>
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
              <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-400">אין עסקים בסטטוס הזה.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
