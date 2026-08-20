import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdsManager, type BannerRow } from "@/components/admin/AdsManager";

export const metadata = { title: "מודעות ובאנרים", robots: { index: false, follow: false } };

export default async function AdminAdsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: placements }, { data: banners }, { data: popups }] = await Promise.all([
    supabase.from("ad_placements").select("key, label, width, height").eq("is_active", true),
    supabase
      .from("banners")
      .select("id, title, placement_key, asset_url, alt, href, weight, priority, is_active")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("popup_banners")
      .select("id, title, heading, cta_label, is_active")
      .order("created_at", { ascending: false }),
  ]);

  const bannerRows: BannerRow[] = (banners ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    placementKey: b.placement_key,
    assetUrl: b.asset_url,
    alt: b.alt,
    href: b.href,
    weight: b.weight,
    priority: b.priority,
    isActive: b.is_active,
  }));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink-900">מודעות ובאנרים</h1>
      <p className="mb-6 text-sm text-ink-500">
        התמונות מועלות מהמכשיר ונשמרות באחסון של האתר. אין יותר שדה כתובת חופשי — נתיב מקומי מהמחשב
        לא ניתן להצגה לגולשים.
      </p>
      <AdsManager
        placements={placements ?? []}
        banners={bannerRows}
        popups={(popups ?? []).map((p) => ({
          id: p.id, title: p.title, heading: p.heading, ctaLabel: p.cta_label, isActive: p.is_active,
        }))}
      />
    </div>
  );
}
