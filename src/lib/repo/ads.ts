import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { seedPopups } from "@/data/seed";
import type { AdTargeting, Banner, PopupBanner } from "@/types/domain";

/**
 * שכבת הנתונים לפרסום. שולפת רק is_active=true — סינון הזמנים/מיקוד
 * העדין (isWithinSchedule/matchesTargeting) נשאר בצד הלקוח כמו היום,
 * כי הוא צריך את הקשר הבקשה (נתיב, מכשיר) שאין לרכיב שרת.
 */

export interface AdsData {
  banners: Banner[];
  popups: PopupBanner[];
}

export async function getActiveAds(): Promise<AdsData> {
  if (!isSupabaseConfigured) {
    return { banners: [], popups: seedPopups };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { banners: [], popups: [] };

  const [{ data: bannerRows }, { data: popupRows }] = await Promise.all([
    supabase.from("banners").select("*").eq("is_active", true),
    supabase.from("popup_banners").select("*").eq("is_active", true),
  ]);

  const banners: Banner[] = (bannerRows ?? []).map((b) => ({
    id: b.id,
    placementKey: b.placement_key,
    title: b.title,
    kind: b.kind,
    assetUrl: b.asset_url,
    assetUrlMobile: b.asset_url_mobile,
    html: b.html,
    alt: b.alt ?? b.title,
    href: b.href,
    targeting: (b.targeting ?? {}) as AdTargeting,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    weight: b.weight,
    priority: b.priority,
    isActive: b.is_active,
  }));

  const popups: PopupBanner[] = (popupRows ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    kind: p.kind,
    layout: p.layout,
    heading: p.heading,
    body: p.body,
    assetUrl: p.asset_url,
    alt: p.alt,
    ctaLabel: p.cta_label,
    ctaHref: p.cta_href,
    secondaryLabel: p.secondary_label,
    triggerType: p.trigger_type,
    triggerDelaySec: p.trigger_delay_sec,
    triggerScrollPct: p.trigger_scroll_pct,
    targeting: (p.targeting ?? {}) as AdTargeting,
    startsAt: p.starts_at,
    endsAt: p.ends_at,
    maxShowsPerUser: p.max_shows_per_user,
    cooldownHours: p.cooldown_hours,
    dismissCooldownHours: p.dismiss_cooldown_hours,
    priority: p.priority,
    isActive: p.is_active,
  }));

  return { banners, popups };
}
