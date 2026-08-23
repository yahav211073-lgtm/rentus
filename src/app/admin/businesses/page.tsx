import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ApproveRejectButtons, ArchiveToggleButton, DeleteBusinessButton, FeatureVerifyToggles,
} from "@/components/admin/BusinessActionButtons";
import { missingVerificationFields } from "@/lib/verification";
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
  { key: "featured", label: "מומלצות בעמוד הבית" },
  { key: "rejected", label: "נדחו" },
  { key: "all", label: "הכל" },
];

export default async function AdminBusinessesPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "pending", q } = await searchParams;

  const [supabase, me] = await Promise.all([createSupabaseServerClient(), getCurrentUser()]);
  const isAdmin = me?.role === "admin";

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

  /* ‎!businesses_owner_id_fkey‎ בשאילתה למטה הוא חובה ולא קישוט: בין
     businesses ל-profiles יש שני קשרים (owner_id, ודרך favorites),
     ובלי ציון המפתח PostgREST מחזיר PGRST201 — כלומר כל השאילתה
     נכשלת והרשימה יוצאת ריקה בלי שום הודעה בממשק. זו הייתה הסיבה
     שרשימת העסקים בניהול הופיעה ריקה.

     ההערה יושבת כאן ולא בתוך המחרוזת: מה שבתוך התבנית נשלח לשרת
     כחלק מ-select, ולא נחשב הערה. */
  let query = supabase!
    .from("businesses")
    .select(`
      id, name, slug, status, phone, address, city_id, logo_url,
      is_featured, is_verified, created_at, owner_id,
      city:cities(name),
      owner:profiles!businesses_owner_id_fkey(full_name, email, phone),
      business_hours(day_of_week)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  /* "מומלצות" אינו סטטוס אלא דגל, ולכן הוא טאב שמסנן על is_featured
     ולא על status. הוא מוגבל לעסקים שפורסמו — עסק מקודם שאינו חי
     באתר לא מופיע בעמוד הבית בכל מקרה, והצגתו כאן מטעה. */
  if (status === "featured") {
    query = query.eq("is_featured", true).eq("status", "published");
  } else if (status !== "all") {
    query = query.eq("status", status);
  }
  if (q) {
    const clauses = [`name.ilike.%${q}%`];
    if (ownerIds.length > 0) clauses.push(`owner_id.in.(${ownerIds.join(",")})`);
    query = query.or(clauses.join(","));
  }

  const { data: businesses, error: listError } = await query;

  /* אזורי השירות בשאילתה נפרדת ולא כ-embed: embed שנכשל מפיל את כל
     השאילתה, כלומר טבלה חסרה הייתה מרוקנת את רשימת העסקים כולה
     במקום להשמיט עמודה אחת. */
  const areaIds = new Set<string>();
  if (businesses?.length) {
    const { data: areaRows } = await supabase!
      .from("business_service_areas")
      .select("business_id")
      .in("business_id", businesses.map((b) => b.id));
    for (const r of areaRows ?? []) areaIds.add(r.business_id);
  }

  const rows = (businesses ?? []).map((business) => {
    const statusMeta = STATUS_LABEL[business.status as BusinessStatus];
    const owner = business.owner as unknown as
      { full_name: string | null; email: string | null; phone: string | null } | null;
    const missing = missingVerificationFields({
      ...business,
      business_service_areas: areaIds.has(business.id) ? [{}] : [],
    });
    return { business, statusMeta, owner, missing };
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink-900">ניהול עסקים</h1>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <form className="min-w-0 flex-1 sm:flex-none">
            <input type="hidden" name="status" value={status} />
            <input
              type="search" name="q" defaultValue={q}
              placeholder="חיפוש לפי שם עסק או שם בעלים..."
              aria-label="חיפוש עסקים"
              className="h-11 w-full rounded-sm border border-ink-200 px-3 text-base outline-none focus:border-brand-400 sm:h-10 sm:w-64 sm:text-sm"
            />
          </form>
          <ButtonLink href="/admin/businesses/new" variant="accent" size="md" icon={<Plus className="h-4 w-4" />}>
            הוספת עסק
          </ButtonLink>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-ink-200 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/businesses?status=${t.key}`}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              status === t.key
                ? "border-brand-700 text-brand-800"
                : "border-transparent text-ink-400 hover:text-ink-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {listError && (
        <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-ink-700">
          טעינת רשימת העסקים נכשלה: {listError.message}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white px-5 py-12 text-center text-sm text-ink-400">
          {status === "featured"
            ? "עדיין לא סומנה אף חברה כמומלצת. סמנו חברות בטאב \"פורסמו\"."
            : "אין עסקים בסטטוס הזה."}
        </div>
      ) : (
        <>
          {/* במובייל כל עסק הופך לכרטיס פעולה. הנתונים שהמנהל צריך
              להחלטה נשארים גלויים, והפעולות אינן עמודה שביעית מחוץ
              למסך. */}
          <ul className="space-y-3 lg:hidden" aria-label="רשימת עסקים">
            {rows.map(({ business: b, statusMeta: s, owner, missing }) => (
              <li key={b.id} className="rounded-lg border border-ink-200/70 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/businesses/${b.id}`} className="block truncate text-base font-bold text-ink-900">
                      {b.name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-500">
                      {(b.city as unknown as { name: string } | null)?.name ?? "ללא עיר"}
                      {b.phone && <span dir="ltr"> · {b.phone}</span>}
                    </p>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>

                <div className="mt-3 rounded-sm bg-ink-50 px-3 py-2.5">
                  {owner ? (
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-700">{owner.full_name ?? "ללא שם בעלים"}</p>
                      <p className="mt-0.5 break-all text-2xs text-ink-400" dir="ltr">
                        {owner.email ?? owner.phone ?? ""}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-400">נוסף מהניהול</p>
                  )}
                </div>

                {missing.length > 0 && (
                  <p className="mt-2 text-2xs leading-relaxed text-ink-500">חסר לאימות: {missing.join(", ")}</p>
                )}

                <div className="mt-3 space-y-3 border-t border-ink-100 pt-3">
                  <FeatureVerifyToggles
                    businessId={b.id}
                    isFeatured={Boolean(b.is_featured)}
                    isVerified={Boolean(b.is_verified)}
                  />
                  <BusinessRowActions
                    businessId={b.id}
                    status={b.status as BusinessStatus}
                    businessName={b.name}
                    isAdmin={isAdmin}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-lg border border-ink-200/70 bg-white lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-start text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-start font-bold">שם</th>
                  <th className="px-4 py-3 text-start font-bold">בעל העסק</th>
                  <th className="px-4 py-3 text-start font-bold">עיר</th>
                  <th className="px-4 py-3 text-start font-bold">טלפון</th>
                  <th className="px-4 py-3 text-start font-bold">סטטוס</th>
                  <th className="px-4 py-3 text-start font-bold">קידום ואימות</th>
                  <th className="px-4 py-3 text-start font-bold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map(({ business: b, statusMeta: s, owner, missing }) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/businesses/${b.id}`} className="font-bold text-ink-800 hover:text-brand-700">
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {owner ? (
                        <span className="flex flex-col">
                          <span className="font-semibold text-ink-800">{owner.full_name ?? "—"}</span>
                          <span className="text-2xs text-ink-400" dir="ltr">{owner.email ?? owner.phone ?? ""}</span>
                        </span>
                      ) : (
                        <span className="text-2xs text-ink-400">נוסף מהניהול</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{(b.city as unknown as { name: string } | null)?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-500">{b.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.variant}>{s.label}</Badge>
                      {missing.length > 0 && (
                        <span className="mt-1 block text-2xs text-ink-400">חסר: {missing.join(", ")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <FeatureVerifyToggles
                        businessId={b.id}
                        isFeatured={Boolean(b.is_featured)}
                        isVerified={Boolean(b.is_verified)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <BusinessRowActions
                        businessId={b.id}
                        status={b.status as BusinessStatus}
                        businessName={b.name}
                        isAdmin={isAdmin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function BusinessRowActions({
  businessId, status, businessName, isAdmin,
}: {
  businessId: string;
  status: BusinessStatus;
  businessName: string;
  isAdmin: boolean;
}) {
  return (
    <span className="flex flex-wrap items-start gap-1.5">
      {status === "pending" ? (
        <ApproveRejectButtons businessId={businessId} />
      ) : (
        <ArchiveToggleButton businessId={businessId} isArchived={status === "archived"} />
      )}
      <DeleteBusinessButton
        businessId={businessId}
        businessName={businessName}
        isAdmin={isAdmin}
      />
    </span>
  );
}
