import type { BusinessCard, SearchFilters, SearchResult, SortOption } from "@/types/domain";
import { seedBusinesses, seedCategories, seedCities, seedTags } from "@/data/seed";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * שכבת החיפוש.
 *
 * היום היא מסננת בזיכרון מעל תוכן ההדגמה. כשיהיה Supabase, הסינון
 * עובר ל-SQL (websearch_to_tsquery על search_vector + מסננים) —
 * החתימה של searchBusinesses לא משתנה, ולכן שום רכיב לא צריך לדעת.
 *
 * הערה על המיון: המיון הוא תמיד דו-שלבי — קודם ממומנים, אחר כך
 * הקריטריון שהמשתמש ביקש. אבל **רק** ממומנים שעברו את הסינון.
 * עסק ממומן לא נדחף לתוצאות שהוא לא רלוונטי להן; זה מה שהופך
 * אינדקס לספאם.
 */

export const PAGE_SIZE = 12;

function norm(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * ניקוד רלוונטיות.
 * התאמה בשם שווה יותר מהתאמה בשורת התיאור, ששווה יותר מהתאמה
 * בקטגוריה. אותה היררכיה שמיושמת במשקלי ה-tsvector ב-DB —
 * חשוב שהשתיים לא יסתרו זו את זו.
 */
function relevanceScore(b: BusinessCard, q: string): number {
  const nq = norm(q);
  if (!nq) return 0;

  let score = 0;
  const name = norm(b.name);

  if (name === nq) score += 100;
  else if (name.startsWith(nq)) score += 60;
  else if (name.includes(nq)) score += 40;

  if (b.tagline && norm(b.tagline).includes(nq)) score += 18;
  if (b.primaryCategory && norm(b.primaryCategory.name).includes(nq)) score += 12;
  if (b.city && norm(b.city.name).includes(nq)) score += 8;
  if (b.tags?.some((t) => norm(t.name).includes(nq))) score += 5;

  return score;
}

function sortItems(items: BusinessCard[], sort: SortOption, q?: string): BusinessCard[] {
  const byRelevance = (a: BusinessCard, b: BusinessCard) =>
    relevanceScore(b, q ?? "") - relevanceScore(a, q ?? "");

  const comparators: Record<SortOption, (a: BusinessCard, b: BusinessCard) => number> = {
    relevance: q
      ? byRelevance
      // בלי מונח חיפוש "רלוונטיות" חסרת משמעות — נופלים לדירוג,
      // שהוא מה שהמשתמש למעשה מתכוון אליו
      : (a, b) => b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount,
    rating:   (a, b) => b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount,
    reviews:  (a, b) => b.reviewCount - a.reviewCount,
    newest:   (a, b) => b.id.localeCompare(a.id),
    name:     (a, b) => a.name.localeCompare(b.name, "he"),
    distance: (a, b) => a.name.localeCompare(b.name, "he"), // דורש מיקום — ממומש עם המפה
  };

  const sorted = [...items].sort(comparators[sort] ?? comparators.relevance);

  // ממומנים עולים לראש, אבל רק בתוך התוצאות הרלוונטיות
  return [
    ...sorted.filter((b) => b.isSponsored),
    ...sorted.filter((b) => !b.isSponsored),
  ];
}

function applyFilters(items: BusinessCard[], f: SearchFilters): BusinessCard[] {
  return items.filter((b) => {
    if (f.q) {
      const hay = [b.name, b.tagline, b.primaryCategory?.name, b.city?.name]
        .filter(Boolean).map((s) => norm(s as string)).join(" ");
      if (!hay.includes(norm(f.q))) return false;
    }

    if (f.city && b.city?.slug !== f.city) return false;

    if (f.category) {
      // התאמה גם לקטגוריית-על: חיפוש ב"אירועים והפקות" חייב להחזיר
      // גם עסקים שמסווגים תחת "אולמות" בלבד
      const parent = seedCategories.find((c) => c.slug === f.category);
      const childSlugs = parent?.children?.map((c) => c.slug) ?? [];
      const slugs = [f.category, ...childSlugs];
      if (!b.primaryCategory || !slugs.includes(b.primaryCategory.slug)) return false;
    }

    if (f.tags?.length) {
      const own = b.tags?.map((t) => t.slug) ?? [];
      // AND ולא OR: המשתמש שסימן "כשר" וגם "חניה" רוצה את שניהם
      if (!f.tags.every((t) => own.includes(t))) return false;
    }

    if (f.minRating && b.ratingAvg < f.minRating) return false;
    if (f.verifiedOnly && !b.isVerified) return false;
    if (f.priceRange?.length && (!b.priceRange || !f.priceRange.includes(b.priceRange))) return false;

    return true;
  });
}

/** מוני התוצאות ליד כל ערך מסנן. */
function buildFacets(items: BusinessCard[]) {
  const count = <T extends string>(get: (b: BusinessCard) => T[] | T | undefined) => {
    const map = new Map<string, number>();
    for (const b of items) {
      const v = get(b);
      const list = Array.isArray(v) ? v : v ? [v] : [];
      for (const key of list) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };

  const catCounts = count((b) => b.primaryCategory?.slug);
  const cityCounts = count((b) => b.city?.slug);
  const tagCounts = count((b) => b.tags?.map((t) => t.slug) ?? []);

  const allCats = seedCategories.flatMap((c) => [c, ...(c.children ?? [])]);

  return {
    categories: [...catCounts.entries()]
      .map(([slug, c]) => ({
        slug, count: c,
        name: allCats.find((x) => x.slug === slug)?.name ?? slug,
      }))
      .sort((a, b) => b.count - a.count),
    cities: [...cityCounts.entries()]
      .map(([slug, c]) => ({
        slug, count: c,
        name: seedCities.find((x) => x.slug === slug)?.name ?? slug,
      }))
      .sort((a, b) => b.count - a.count),
    tags: [...tagCounts.entries()]
      .map(([slug, c]) => ({
        slug, count: c,
        name: seedTags.find((x) => x.slug === slug)?.name ?? slug,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

const CARD_SELECT = `
  id, slug, name, tagline, logo_url, cover_url,
  rating_avg, review_count, is_verified, is_featured, is_sponsored,
  tier, price_range, phone, whatsapp,
  city:cities(name, slug),
  business_categories(is_primary, categories(name, slug)),
  business_tags(tags(name, slug))
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function mapCard(row: Row): BusinessCard {
  const primaryLink: Row =
    row.business_categories?.find((c: Row) => c.is_primary) ?? row.business_categories?.[0];

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
    city: row.city ? { name: row.city.name, slug: row.city.slug } : null,
    primaryCategory: primaryLink
      ? { name: primaryLink.categories.name, slug: primaryLink.categories.slug }
      : null,
    tags: (row.business_tags ?? []).map((t: Row) => ({ name: t.tags.name, slug: t.tags.slug })),
  };
}

const SORT_COLUMN: Record<SortOption, string | null> = {
  relevance: null, // בלי q נופל ל-rating, עם q הסינון עצמו כבר עשה את העבודה
  rating: "rating_avg",
  reviews: "review_count",
  newest: "created_at",
  name: "name",
  distance: "name", // דורש מיקום — ממומש עם המפה, בינתיים נופל לשם
};

async function searchBusinessesSupabase(filters: SearchFilters): Promise<SearchResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { items: [], total: 0, page: 1, pageSize: PAGE_SIZE, facets: { categories: [], cities: [], tags: [] } };
  }

  // עמודות ישירות על businesses (city_id) מסוננות ישירות. שיוך קטגוריה
  // הוא רבים-לרבים דרך business_categories, בלי FK ישיר על businesses —
  // פותרים לרשימת business_id דרך שאילתה נפרדת ולא embed-filter, כדי
  // לא להסתבך עם !inner מול עסקים בלי עיר/קטגוריה.
  let cityId: string | null = null;
  if (filters.city) {
    const { data: city } = await supabase
      .from("cities").select("id").eq("slug", filters.city).maybeSingle();
    cityId = city?.id ?? "__none__"; // עיר לא קיימת → אפס תוצאות, לא כל התוצאות
  }

  let matchingBusinessIds: string[] | null = null;
  if (filters.category) {
    const { data: cat } = await supabase
      .from("categories").select("id").eq("slug", filters.category).maybeSingle();
    if (cat) {
      const { data: children } = await supabase
        .from("categories").select("id").eq("parent_id", cat.id);
      const categoryIds = [cat.id, ...(children ?? []).map((c) => c.id)];
      const { data: links } = await supabase
        .from("business_categories").select("business_id").in("category_id", categoryIds);
      matchingBusinessIds = [...new Set((links ?? []).map((l) => l.business_id))];
    } else {
      matchingBusinessIds = [];
    }
  }

  if (matchingBusinessIds?.length === 0) {
    return { items: [], total: 0, page: Math.max(1, filters.page ?? 1), pageSize: PAGE_SIZE, facets: { categories: [], cities: [], tags: [] } };
  }

  let query = supabase
    .from("businesses")
    .select(CARD_SELECT, { count: "exact" })
    .eq("status", "published");

  if (filters.q) {
    query = query.textSearch("search_vector", filters.q, { type: "websearch", config: "simple" });
  }
  if (cityId) {
    query = query.eq("city_id", cityId);
  }
  if (matchingBusinessIds) {
    query = query.in("id", matchingBusinessIds);
  }
  if (filters.minRating) {
    query = query.gte("rating_avg", filters.minRating);
  }
  if (filters.verifiedOnly) {
    query = query.eq("is_verified", true);
  }
  if (filters.priceRange?.length) {
    query = query.in("price_range", filters.priceRange);
  }

  // ממומנים קודם, ותוך כך — עמודת המיון שנבחרה. תמיד אמת פוסטגרס
  // ולא באפליקציה, כדי שהעימוד (range) יתאים לסדר בפועל.
  query = query.order("is_sponsored", { ascending: false });
  const sortCol = SORT_COLUMN[filters.sort ?? "relevance"];
  if (sortCol) {
    query = query.order(sortCol, { ascending: filters.sort === "name" });
  } else {
    query = query.order("rating_avg", { ascending: false }).order("review_count", { ascending: false });
  }

  const page = Math.max(1, filters.page ?? 1);
  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const [{ data, count }, { data: facetsData }] = await Promise.all([
    query,
    supabase.rpc("search_business_facets", {
      p_query: filters.q ?? null,
      p_city: filters.city ?? null,
      p_min_rating: filters.minRating ?? null,
      p_verified_only: filters.verifiedOnly ?? false,
      p_price_range: filters.priceRange?.length ? filters.priceRange : null,
    }),
  ]);

  return {
    items: (data ?? []).map(mapCard),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    facets: facetsData ?? { categories: [], cities: [], tags: [] },
  };
}

export async function searchBusinesses(filters: SearchFilters): Promise<SearchResult> {
  if (isSupabaseConfigured) {
    return searchBusinessesSupabase(filters);
  }

  const filtered = applyFilters(seedBusinesses, filters);
  const sorted = sortItems(filtered, filters.sort ?? "relevance", filters.q);

  const page = Math.max(1, filters.page ?? 1);
  const start = (page - 1) * PAGE_SIZE;

  return {
    items: sorted.slice(start, start + PAGE_SIZE),
    total: sorted.length,
    page,
    pageSize: PAGE_SIZE,
    // ה-facets נבנים מהתוצאות **לפני** הדפדוף, אחרת המונים
    // היו משתנים בכל מעבר עמוד
    facets: buildFacets(filtered),
  };
}

/** המרת פרמטרי URL למסננים. מקור אמת יחיד לפענוח. */
export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchFilters {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const many = (k: string) => {
    const v = sp[k];
    if (!v) return undefined;
    return (Array.isArray(v) ? v : v.split(",")).filter(Boolean);
  };

  const sort = one("sort") as SortOption | undefined;
  const validSorts: SortOption[] = ["relevance", "rating", "reviews", "newest", "name", "distance"];

  return {
    q: one("q") || undefined,
    category: one("category") || undefined,
    city: one("city") || undefined,
    area: one("area") || undefined,
    tags: many("tags"),
    minRating: one("minRating") ? Number(one("minRating")) : undefined,
    priceRange: many("price")?.map(Number).filter((n) => n >= 1 && n <= 4),
    verifiedOnly: one("verified") === "1",
    openNow: one("openNow") === "1",
    sort: sort && validSorts.includes(sort) ? sort : "relevance",
    page: one("page") ? Math.max(1, Number(one("page"))) : 1,
  };
}
