import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFlatCategories } from "@/lib/repo/taxonomy";
import { BusinessAdminForm, type AdminBusinessDetail } from "@/components/admin/BusinessAdminForm";

export const metadata = { title: "עריכת עסק", robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;

export default async function AdminBusinessEditPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: business }, categories] = await Promise.all([
    supabase!
      .from("businesses")
      .select(`
        id, name, tagline, description, address, latitude, longitude, phone, whatsapp, email, website,
        status, tier, is_featured, is_sponsored, is_verified, boost_score,
        business_categories(is_primary, category_id)
      `)
      .eq("id", id)
      .maybeSingle(),
    getFlatCategories(),
  ]);

  if (!business) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryLink = (business.business_categories as any[])?.find((c) => c.is_primary);

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
  };

  return (
    <div>
      <Link href="/admin/businesses" className="mb-4 inline-block text-sm font-bold text-ink-400 hover:text-brand-600">
        ← חזרה לרשימת העסקים
      </Link>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink-900">{business.name}</h1>
      <BusinessAdminForm business={detail} categories={categories} />
    </div>
  );
}
