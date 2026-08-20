import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { OwnerBusinessCard, type OwnerBusiness } from "@/components/business/OwnerBusinessCard";
import { NotificationsPanel, type OwnerNotification } from "@/components/business/NotificationsPanel";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAreas } from "@/lib/repo/taxonomy";

export const metadata: Metadata = { title: "אזור בעלי חברות", robots: { index: false, follow: false } };

/**
 * דשבורד בעל עסק. proxy.ts כבר חוסם גישה למי שלא מחובר, אבל בודקים
 * שוב כאן — דף שרת לא צריך לסמוך על הגנה חיצונית בלבד.
 *
 * הפניות נשלפות בשאילתה אחת לכל העסקים ולא בלולאה של שאילתה לעסק.
 * הגרסה הקודמת עשתה N+1: בעל עסק עם חמישה עסקים ייצר שש נסיעות
 * למסד בכל טעינת עמוד.
 */
export default async function BusinessDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/dashboard");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: businesses }, { data: notifications }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, slug, name, tagline, description, address, phone, whatsapp, email, website, status, rejection_reason, cover_url, logo_url")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const ids = (businesses ?? []).map((b) => b.id);
  const [{ data: allLeads }, { data: allHours }, { data: allServices }, { data: allAreas }] = ids.length
    ? await Promise.all([
        supabase
          .from("leads")
          .select("id, business_id, name, phone, message, created_at")
          .in("business_id", ids)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("business_hours")
          .select("business_id, day_of_week, opens_at, closes_at, is_closed")
          .in("business_id", ids),
        supabase
          .from("business_services")
          .select("business_id, id, name, description, price, price_unit")
          .in("business_id", ids)
          .order("sort_order", { ascending: true }),
        supabase
          .from("business_service_areas")
          .select("business_id, area_id")
          .in("business_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const leadsByBusiness = new Map<string, OwnerBusiness["leads"]>();
  for (const l of allLeads ?? []) {
    const list = leadsByBusiness.get(l.business_id) ?? [];
    if (list.length < 20) {
      list.push({ id: l.id, name: l.name, phone: l.phone, message: l.message, createdAt: l.created_at });
    }
    leadsByBusiness.set(l.business_id, list);
  }

  const hoursByBusiness = new Map<string, OwnerBusiness["hours"]>();
  for (const h of allHours ?? []) {
    const list = hoursByBusiness.get(h.business_id) ?? [];
    list.push({ dayOfWeek: h.day_of_week, opensAt: h.opens_at, closesAt: h.closes_at, isClosed: h.is_closed });
    hoursByBusiness.set(h.business_id, list);
  }

  const servicesByBusiness = new Map<string, OwnerBusiness["services"]>();
  for (const s of allServices ?? []) {
    const list = servicesByBusiness.get(s.business_id) ?? [];
    list.push({ id: s.id, name: s.name, description: s.description, price: s.price, priceUnit: s.price_unit });
    servicesByBusiness.set(s.business_id, list);
  }

  /* רשימת האזורים האפשריים נטענת פעם אחת לכל העסקים של הבעלים —
     היא זהה לכולם, ושאילתה לכל כרטיס היא בזבוז. */
  const areas = await getAreas();

  const areasByBusiness = new Map<string, string[]>();
  for (const a of allAreas ?? []) {
    const list = areasByBusiness.get(a.business_id) ?? [];
    list.push(a.area_id);
    areasByBusiness.set(a.business_id, list);
  }

  const ownerBusinesses: OwnerBusiness[] = (businesses ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    tagline: b.tagline,
    description: b.description,
    address: b.address,
    phone: b.phone,
    whatsapp: b.whatsapp,
    email: b.email,
    website: b.website,
    status: b.status,
    rejectionReason: b.rejection_reason,
    coverUrl: b.cover_url,
    logoUrl: b.logo_url,
    leads: leadsByBusiness.get(b.id) ?? [],
    hours: hoursByBusiness.get(b.id) ?? [],
    services: servicesByBusiness.get(b.id) ?? [],
    serviceAreaIds: areasByBusiness.get(b.id) ?? [],
  }));

  const notificationItems: OwnerNotification[] = (notifications ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 font-display text-2xl text-ink-900">
            שלום, {user.fullName ?? user.email}
          </h1>
          <p className="text-ink-500">אזור בעלי החברות שלכם</p>
        </div>
        <ButtonLink href="/business/register" variant="secondary" size="sm">
          הגשת בקשה לחברה נוספת
        </ButtonLink>
      </div>

      <NotificationsPanel notifications={notificationItems} />

      {ownerBusinesses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-14 text-center">
          <Briefcase className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="mb-1 font-display text-lg font-bold text-ink-800">עדיין לא הגשתם בקשה</p>
          <p className="mb-5 text-sm text-ink-500">
            מילוי הבקשה לוקח כמה דקות. הצוות בודק אותה ומאשר בדרך כלל תוך יום עסקים אחד.
          </p>
          <ButtonLink href="/business/register" variant="accent" size="md">
            הגשת בקשה להוספת חברה
          </ButtonLink>
        </div>
      ) : (
        <div className="space-y-5">
          {ownerBusinesses.map((b) => (
            <OwnerBusinessCard key={b.id} business={b} areas={areas} />
          ))}
        </div>
      )}
    </div>
  );
}
