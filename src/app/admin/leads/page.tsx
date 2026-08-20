import Link from "next/link";
import { Inbox } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsTable, type AdminLead } from "@/components/admin/LeadsTable";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/lead-status";

export const metadata = { title: "פניות", robots: { index: false, follow: false } };

/**
 * תיבת פניות גלובלית — כל הפניות מכל העסקים במקום אחד, כדי שאפשר
 * יהיה לעבוד עם הזרימה: פנייה מגיעה → לוקחים את הטלפון → מדברים עם
 * הלקוח → מסמנים סטטוס. פנייה בלי סטטוס היא פנייה שאף אחד לא יודע
 * אם טופלה.
 */
const TABS: { key: string; label: string }[] = [
  { key: "new", label: LEAD_STATUS_LABEL.new },
  { key: "contacted", label: LEAD_STATUS_LABEL.contacted },
  { key: "won", label: LEAD_STATUS_LABEL.won },
  { key: "all", label: "הכל" },
];

/* סינון לפי סוג בנפרד מהסינון לפי סטטוס: בקשת פרסום ופנייה לעסק
   עוברות את אותם סטטוסים, אבל מטופלות על ידי אנשים שונים ובזמנים
   שונים. שתי שורות טאבים עדיפות על מכפלה של שמונה טאבים. */
const KIND_TABS: { key: string; label: string }[] = [
  { key: "all", label: "כל הסוגים" },
  { key: "ad_request", label: "בקשות פרסום" },
  { key: "contact", label: "פניות כלליות" },
  { key: "business", label: "פניות לעסקים" },
];

export default async function AdminLeadsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  const { status = "new", kind = "all" } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  let query = supabase
    .from("leads")
    .select(`
      id, kind, subject, name, phone, email, message, channel, status, owner_note,
      source_page, contacted_at, created_at,
      business:businesses(id, name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") query = query.eq("status", status);
  if (kind !== "all") query = query.eq("kind", kind);

  const { data, error } = await query;

  const leads: AdminLead[] = (data ?? []).map((l) => ({
    id: l.id,
    kind: (l.kind ?? "business") as AdminLead["kind"],
    subject: l.subject,
    name: l.name,
    phone: l.phone,
    email: l.email,
    message: l.message,
    channel: l.channel,
    status: l.status as LeadStatus,
    ownerNote: l.owner_note,
    sourcePage: l.source_page,
    createdAt: l.created_at,
    business: (l.business as unknown as { name: string; slug: string } | null) ?? null,
  }));

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink-900">פניות</h1>
      </div>
      <p className="mb-6 text-sm text-ink-500">
        בקשות לפרסום באתר, פניות כלליות, והפניות ההיסטוריות לעסקים
        (הטופס בעמוד העסק בוטל — הגולש פונה ישירות בטלפון או בוואטסאפ).
      </p>

      <div className="mb-5 flex flex-wrap gap-1 border-b border-ink-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/leads?status=${t.key}&kind=${kind}`}
            aria-current={status === t.key ? "page" : undefined}
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

      <div className="mb-5 flex flex-wrap gap-1.5">
        {KIND_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/leads?status=${status}&kind=${t.key}`}
            aria-current={kind === t.key ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
              kind === t.key
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-ink-200 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-5 text-sm text-ink-700">
          טעינת הפניות נכשלה. נסו לרענן את העמוד.
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-ink-800">
            {status === "all" ? "עדיין לא התקבלו פניות" : "אין פניות בסטטוס הזה"}
          </p>
          <p className="mt-1 text-sm text-ink-500">
בקשות פרסום ופניות מהאתר יופיעו כאן מיד עם קבלתן.
          </p>
        </div>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
