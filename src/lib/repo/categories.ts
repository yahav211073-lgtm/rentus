import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { seedCategories } from "@/data/seed";
import type { Category } from "@/types/domain";

/**
 * קטגוריות עם ספירה אמיתית של עסקים פורסמים — לא המספרים הקבועים
 * מה-seed. קטגוריית-על סופרת גם את הילדים שלה, כמו שמצפים לראות
 * ב"מוסכים" שמכיל גם "פנצ'רייה" וגם "חשמלאי רכב".
 *
 * עטוף ב-cache(): נקרא גם מ-layout.tsx (ניווט) וגם מכל עמוד קטגוריה
 * (generateMetadata + גוף העמוד) באותה בקשה — בלי דה-דופליקציה זו
 * אותה שאילתה רצה כמה פעמים ברצף.
 */
export const getCategoriesWithCounts = cache(async (): Promise<Category[]> => {
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
      .select("category_id, businesses!inner(id, status)")
      .eq("businesses.status", "published"),
  ]);

  const businessesByCategory = new Map<string, Set<string>>();
  for (const link of links ?? []) {
    const ids = businessesByCategory.get(link.category_id) ?? new Set<string>();
    const business = Array.isArray(link.businesses) ? link.businesses[0] : link.businesses;
    if (business?.id) ids.add(String(business.id));
    businessesByCategory.set(link.category_id, ids);
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
    const parentBusinessIds = new Set(businessesByCategory.get(p.id) ?? []);
    for (const kid of kids) {
      for (const businessId of businessesByCategory.get(kid.id) ?? []) parentBusinessIds.add(businessId);
    }
    return {
      ...toDomain(p, parentBusinessIds.size),
      children: kids.map((k) => toDomain(k, businessesByCategory.get(k.id)?.size ?? 0)),
    };
  });
});
