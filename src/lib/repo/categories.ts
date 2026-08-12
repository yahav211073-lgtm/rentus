import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { seedCategories } from "@/data/seed";
import type { Category } from "@/types/domain";

/**
 * קטגוריות עם ספירה אמיתית של עסקים פורסמים — לא המספרים הקבועים
 * מה-seed. קטגוריית-על סופרת גם את הילדים שלה, כמו שמצפים לראות
 * ב"מוסכים" שמכיל גם "פנצ'רייה" וגם "חשמלאי רכב".
 */
export async function getCategoriesWithCounts(): Promise<Category[]> {
  if (!isSupabaseConfigured) return seedCategories;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const [{ data: categories }, { data: links }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, parent_id, slug, name, description, icon, image_url, accent_color, is_featured")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("business_categories")
      .select("category_id, businesses!inner(status)")
      .eq("businesses.status", "published"),
  ]);

  const ownCount = new Map<string, number>();
  for (const link of links ?? []) {
    ownCount.set(link.category_id, (ownCount.get(link.category_id) ?? 0) + 1);
  }

  const all = categories ?? [];
  const children = all.filter((c) => c.parent_id);
  const parents = all.filter((c) => !c.parent_id);

  const toDomain = (c: (typeof all)[number], count: number): Category => ({
    id: c.id,
    parentId: c.parent_id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    icon: c.icon,
    imageUrl: c.image_url,
    accentColor: c.accent_color,
    isFeatured: c.is_featured,
    businessCount: count,
  });

  return parents.map((p) => {
    const kids = children.filter((c) => c.parent_id === p.id);
    const kidsCount = kids.reduce((sum, k) => sum + (ownCount.get(k.id) ?? 0), 0);
    const total = (ownCount.get(p.id) ?? 0) + kidsCount;
    return {
      ...toDomain(p, total),
      children: kids.map((k) => toDomain(k, ownCount.get(k.id) ?? 0)),
    };
  });
}
