import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { seedBusinesses, seedBusinessDetail, seedReviews } from "@/data/seed";
import type { Business, BusinessCard, Review } from "@/types/domain";

/**
 * שכבת הנתונים לעסקים בודדים ולרצועות עמוד הבית.
 *
 * אותו עיקרון כמו src/lib/repo/search.ts: כשאין Supabase, נופלים
 * לתוכן ההדגמה. כשיש, שואלים ישירות דרך supabase-js — אין צורך
 * ב-RPC כאן כי אין ניקוד/פאסטים לחשב, רק שליפה וקישורים.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const CARD_SELECT = `
  id, slug, name, tagline, logo_url, cover_url,
  rating_avg, review_count, is_verified, is_featured, is_sponsored,
  tier, price_range, phone, whatsapp, website, social,
  city:cities(name, slug),
  business_categories(is_primary, categories(name, slug)),
  business_tags(tags(name, slug))
`;

const DETAIL_SELECT = `
  id, slug, name, tagline, description, status, tier,
  is_verified, is_featured, is_sponsored,
  address, address_note, latitude, longitude,
  phone, phone_secondary, whatsapp, email, website, social,
  logo_url, cover_url, video_url,
  price_range, price_note, accepts_online_booking,
  rating_avg, review_count, view_count,
  seo_title, seo_description, seo_noindex,
  published_at, created_at,
  city:cities(id, slug, name),
  area:areas(id, slug, name),
  business_categories(is_primary, categories(id, slug, name)),
  business_tags(tags(id, slug, name)),
  business_hours(day_of_week, opens_at, closes_at, is_closed, note),
  business_services(id, name, description, price, price_unit, is_featured)
`;

function primaryCategoryOf(row: Row) {
  const link = row.business_categories?.find((c: Row) => c.is_primary) ?? row.business_categories?.[0];
  return link ? { name: link.categories.name, slug: link.categories.slug } : null;
}

function mapCard(row: Row): BusinessCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    ratingAvg: Number(row.rating_avg ?? 0),
    reviewCount: row.review_count ?? 0,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    isSponsored: row.is_sponsored,
    tier: row.tier,
    priceRange: row.price_range,
    phone: row.phone,
    whatsapp: row.whatsapp,
    website: row.website,
    social: row.social ?? {},
    city: row.city ? { name: row.city.name, slug: row.city.slug } : null,
    primaryCategory: primaryCategoryOf(row),
    tags: (row.business_tags ?? []).map((t: Row) => ({ name: t.tags.name, slug: t.tags.slug })),
  };
}

function mapDetail(row: Row): Business {
  const primaryLink =
    row.business_categories?.find((c: Row) => c.is_primary) ?? row.business_categories?.[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    status: row.status,
    tier: row.tier,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    isSponsored: row.is_sponsored,
    city: row.city ? { id: row.city.id, slug: row.city.slug, name: row.city.name } : null,
    area: row.area ? { id: row.area.id, slug: row.area.slug, name: row.area.name } : null,
    address: row.address,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    social: row.social ?? {},
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    videoUrl: row.video_url,
    categories: (row.business_categories ?? []).map((c: Row) => ({
      id: c.categories.id, slug: c.categories.slug, name: c.categories.name,
    })),
    primaryCategory: primaryLink
      ? { id: primaryLink.categories.id, slug: primaryLink.categories.slug, name: primaryLink.categories.name }
      : null,
    tags: (row.business_tags ?? []).map((t: Row) => ({ id: t.tags.id, slug: t.tags.slug, name: t.tags.name })),
    priceRange: row.price_range,
    ratingAvg: Number(row.rating_avg ?? 0),
    reviewCount: row.review_count ?? 0,
    viewCount: row.view_count,
    hours: (row.business_hours ?? []).map((h: Row) => ({
      dayOfWeek: h.day_of_week, opensAt: h.opens_at, closesAt: h.closes_at,
      isClosed: h.is_closed, note: h.note,
    })),
    services: (row.business_services ?? []).map((s: Row) => ({
      id: s.id, name: s.name, description: s.description,
      price: s.price != null ? Number(s.price) : null, priceUnit: s.price_unit, isFeatured: s.is_featured,
    })),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoNoindex: row.seo_noindex,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  if (!isSupabaseConfigured) {
    return slug === seedBusinessDetail.slug ? seedBusinessDetail : null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("businesses")
    .select(DETAIL_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return mapDetail(data);
}

export async function getRelatedBusinesses(business: Business, limit = 4): Promise<BusinessCard[]> {
  if (!isSupabaseConfigured) {
    return seedBusinesses
      .filter((x) => x.slug !== business.slug && x.primaryCategory?.slug === business.primaryCategory?.slug)
      .slice(0, limit);
  }
  if (!business.primaryCategory) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("businesses")
    .select(CARD_SELECT)
    .eq("status", "published")
    .neq("slug", business.slug)
    .eq("business_categories.category_id", business.primaryCategory.id)
    .limit(limit);

  return (data ?? []).map(mapCard);
}

export async function getApprovedReviews(businessId: string): Promise<Review[]> {
  if (!isSupabaseConfigured) {
    return seedReviews.filter((r) => r.businessId === businessId);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("reviews")
    .select(`
      id, business_id, author_name, rating,
      rating_quality, rating_service, rating_value,
      title, body, owner_reply, owner_replied_at,
      helpful_count, created_at
    `)
    .eq("business_id", businessId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r: Row) => ({
    id: r.id,
    businessId: r.business_id,
    authorName: r.author_name,
    rating: r.rating,
    ratingQuality: r.rating_quality,
    ratingService: r.rating_service,
    ratingValue: r.rating_value,
    title: r.title,
    body: r.body,
    ownerReply: r.owner_reply,
    ownerRepliedAt: r.owner_replied_at,
    helpfulCount: r.helpful_count ?? 0,
    createdAt: r.created_at,
  }));
}

export interface HomeBusinessSlices {
  featured: BusinessCard[];
  popular: BusinessCard[];
  sponsored: BusinessCard[];
  latest: BusinessCard[];
}

export async function getHomeBusinessSlices(): Promise<HomeBusinessSlices> {
  if (!isSupabaseConfigured) {
    return {
      featured: seedBusinesses.filter((b) => b.isFeatured),
      sponsored: seedBusinesses.filter((b) => b.isSponsored),
      popular: [...seedBusinesses].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8),
      latest: [...seedBusinesses].reverse().slice(0, 8),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { featured: [], popular: [], sponsored: [], latest: [] };

  const base = () => supabase.from("businesses").select(CARD_SELECT).eq("status", "published");

  const [featured, sponsored, popular, latest] = await Promise.all([
    base().eq("is_featured", true).order("boost_score", { ascending: false }).limit(8),
    base().eq("is_sponsored", true).order("boost_score", { ascending: false }).limit(8),
    base().order("review_count", { ascending: false }).limit(8),
    base().order("published_at", { ascending: false, nullsFirst: false }).limit(8),
  ]);

  return {
    featured: (featured.data ?? []).map(mapCard),
    sponsored: (sponsored.data ?? []).map(mapCard),
    popular: (popular.data ?? []).map(mapCard),
    latest: (latest.data ?? []).map(mapCard),
  };
}
