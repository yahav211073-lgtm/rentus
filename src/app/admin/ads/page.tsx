import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdsManager } from "@/components/admin/AdsManager";

export const metadata = { title: "מודעות ובאנרים", robots: { index: false, follow: false } };

export default async function AdminAdsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: placements }, { data: banners }, { data: popups }] = await Promise.all([
    supabase!.from("ad_placements").select("key, label").eq("is_active", true),
    supabase!.from("banners").select("id, title, placement_key, asset_url, href, is_active").order("created_at", { ascending: false }),
    supabase!.from("popup_banners").select("id, title, heading, cta_label, is_active").order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink-900">מודעות ובאנרים</h1>
      <AdsManager
        placements={placements ?? []}
        banners={(banners ?? []).map((b) => ({
          id: b.id, title: b.title, placementKey: b.placement_key, assetUrl: b.asset_url, href: b.href, isActive: b.is_active,
        }))}
        popups={(popups ?? []).map((p) => ({
          id: p.id, title: p.title, heading: p.heading, ctaLabel: p.cta_label, isActive: p.is_active,
        }))}
      />
    </div>
  );
}
