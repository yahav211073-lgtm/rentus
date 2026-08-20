import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAreas, getCities, getFlatCategories } from "@/lib/repo/taxonomy";
import { Badge } from "@/components/ui/Badge";
import { BusinessAdminForm, type AdminBusinessDetail } from "@/components/admin/BusinessAdminForm";
import { BusinessLogoField } from "@/components/admin/BusinessLogoField";
import { ServiceAreasEditor } from "@/components/business/ServiceAreasEditor";
import { OpeningHoursEditor } from "@/components/business/OpeningHoursEditor";
import { missingVerificationFields } from "@/lib/verification";

export const metadata = { title: "עריכת עסק", robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;

export default async function AdminBusinessEditPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: business }, categories, cities, areas] = await Promise.all([
    supabase
      .from("businesses")
      .select(`
        id, slug, name, tagline, description, address, latitude, longitude,
        phone, whatsapp, email, website, social, city_id, logo_url,
        status, tier, is_featured, is_sponsored, is_verified, boost_score,
        rejection_reason,
        business_categories(is_primary, category_id),
        business_hours(day_of_week, opens_at, closes_at, is_closed, note)
      `)
      .eq("id", id)
      .maybeSingle(),
    getFlatCategories(),
    getCities(),
    getAreas(),
  ]);

  if (!business) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const links = (business.business_categories as any[]) ?? [];
  const primaryLink = links.find((c) => c.is_primary) ?? links[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hourRows = ((business.business_hours as any[]) ?? []).map((h) => ({
    dayOfWeek: h.day_of_week,
    opensAt: h.opens_at,
    closesAt: h.closes_at,
    isClosed: h.is_closed,
    note: h.note,
  }));
  /* שאילתה נפרדת ולא embed — ראו ההסבר ב-repo/businesses.ts. */
  const { data: areaRows } = await supabase
    .from("business_service_areas")
    .select("area_id")
    .eq("business_id", business.id);
  const selectedAreas = (areaRows ?? []).map((a) => a.area_id);

  const missing = missingVerificationFields({
    ...business,
    business_service_areas: selectedAreas.map((id) => ({ id })),
  });

  const detail: AdminBusinessDetail = {
    id: business.id,
    name: business.name,
    tagline: business.tagline,
    description: business.description,
    address: business.address,
    latitude: business.latitude,
    longitude: business.longitude,
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    website: business.website,
    status: business.status,
    tier: business.tier,
    isFeatured: business.is_featured,
    isSponsored: business.is_sponsored,
    isVerified: business.is_verified,
    boostScore: business.boost_score,
    primaryCategoryId: primaryLink?.category_id ?? null,
    cityId: business.city_id,
    social: (business.social ?? {}) as Record<string, string>,
  };

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-400 hover:text-brand-600"
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
        חזרה לרשימת העסקים
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl text-ink-900">{business.name}</h1>
        {business.status === "published" && (
          <Link
            href={`/business/${business.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-500"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            צפייה בעמוד באתר
          </Link>
        )}
      </div>

      {business.status === "rejected" && business.rejection_reason && (
        <div className="mb-5 rounded-lg border border-danger-500/30 bg-danger-50 p-4">
          <p className="text-sm font-bold text-ink-900">סיבת הדחייה שנשלחה לבעל העסק</p>
          <p className="mt-0.5 text-sm text-ink-600">{business.rejection_reason}</p>
        </div>
      )}

      {business.status === "pending" && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-warning-500/35 bg-warning-50 p-4">
          <Badge variant="warning">ממתין לאישור</Badge>
          <p className="text-sm text-ink-700">
            אישור או דחייה נעשים מרשימת העסקים; בעל העסק יקבל התראה על ההחלטה.
          </p>
        </div>
      )}

      {/* מה חסר לאימות — בראש העמוד ולא בתחתיתו. זו רשימת המשימות
          של המנהל במסך הזה, והיא צריכה להיות הדבר הראשון שהוא רואה. */}
      {missing.length > 0 && (
        <div className="mb-5 rounded-lg border border-warning-500/35 bg-warning-50 p-4">
          <p className="text-sm font-bold text-ink-900">העסק אינו מאומת</p>
          <p className="mt-0.5 text-sm text-ink-700">
            חסר כדי לאמת: {missing.join(", ")}. אחרי ההשלמה אפשר לסמן אותו כמאומת
            מרשימת העסקים.
          </p>
        </div>
      )}

      <BusinessAdminForm business={detail} categories={categories} cities={cities} />

      <section className="mt-6 rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-base text-ink-900">לוגו</h2>
        <BusinessLogoField businessId={business.id} currentUrl={business.logo_url} />
      </section>

      <section className="mt-6 rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
        <h2 className="mb-1 font-display text-base text-ink-900">אזורי שירות</h2>
        <p className="mb-4 text-xs text-ink-400">
          היכן העסק נותן שירות — להבדיל מהעיר שבה הוא יושב.
        </p>
        <ServiceAreasEditor businessId={business.id} areas={areas} selected={selectedAreas} />
      </section>

      <section className="mt-6 rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-base text-ink-900">שעות פעילות</h2>
        <OpeningHoursEditor businessId={business.id} hours={hourRows} />
      </section>
    </div>
  );
}
