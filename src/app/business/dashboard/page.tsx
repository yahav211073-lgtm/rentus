import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { OwnerBusinessCard, type OwnerBusiness } from "@/components/business/OwnerBusinessCard";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "אזור בעלי עסקים", robots: { index: false, follow: false } };

/**
 * דשבורד בעל עסק v1: עריכת פרטים + צפייה בפניות. proxy.ts כבר חוסם
 * גישה למי שלא מחובר, אבל בודקים שוב כאן כי דפי שרת לא צריכים
 * לסמוך על הגנה חיצונית בלבד.
 */
export default async function BusinessDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/business/dashboard");

  const supabase = await createSupabaseServerClient();
  const { data: businesses } = await supabase!
    .from("businesses")
    .select("id, name, tagline, description, address, phone, whatsapp, email, website, status, rejection_reason")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const ownerBusinesses: OwnerBusiness[] = await Promise.all(
    (businesses ?? []).map(async (b) => {
      const { data: leads } = await supabase!
        .from("leads")
        .select("id, name, phone, message, created_at")
        .eq("business_id", b.id)
        .order("created_at", { ascending: false })
        .limit(20);

      return {
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
        leads: (leads ?? []).map((l) => ({
          id: l.id, name: l.name, phone: l.phone, message: l.message, createdAt: l.created_at,
        })),
      };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 font-display text-2xl font-extrabold text-ink-900">
            שלום, {user.fullName ?? user.email}
          </h1>
          <p className="text-ink-500">אזור בעלי העסקים שלכם</p>
        </div>
        <ButtonLink href="/business/register" variant="accent" size="sm">רישום עסק נוסף</ButtonLink>
      </div>

      {ownerBusinesses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-200 bg-white p-10 text-center">
          <p className="mb-4 text-ink-600">עדיין לא רשמתם עסק.</p>
          <ButtonLink href="/business/register" variant="primary" size="md">רישום העסק הראשון</ButtonLink>
        </div>
      ) : (
        <div className="space-y-5">
          {ownerBusinesses.map((b) => <OwnerBusinessCard key={b.id} business={b} />)}
        </div>
      )}
    </div>
  );
}
