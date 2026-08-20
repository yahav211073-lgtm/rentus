import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCities, getFlatCategories } from "@/lib/repo/taxonomy";
import { Badge } from "@/components/ui/Badge";
import { BusinessAdminForm, type AdminBusinessDetail } from "@/components/admin/BusinessAdminForm";

export const metadata = { title: "עריכת עסק", robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;

export default async function AdminBusinessEditPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: business }, categories, cities] = await Promise.all([
    supabase
      .from("businesses")
      .select(`
        id, slug, name, tagline, description, address, latitude, longitude,
        phone, whatsapp, email, website, social, city_id,
        status, tier, is_featured, is_sponsored, is_verified, boost_score,
        rejection_reason,
        business_categories(is_primary, category_id)
      `)
      .eq("id", id)
      .maybeSingle(),
    getFlatCategories(),
    getCities(),
  ]);

  if (!business) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const links = (business.business_categories as any[]) ?? [];
  const primaryLink = links.find((c) => c.is_primary) ?? links[0];

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

      <BusinessAdminForm business={detail} categories={categories} cities={cities} />
    </div>
  );
}
