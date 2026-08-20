import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata = { title: "ניהול קטגוריות וערים", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: categories }, { data: cities }, { data: links }] = await Promise.all([
    supabase.from("categories").select("id, name, parent_id, is_active, image_url").order("sort_order"),
    supabase.from("cities").select("id, name").order("sort_order"),
    supabase.from("business_categories").select("category_id"),
  ]);

  // ספירת עסקים לכל קטגוריה — כדי שהמנהל יראה מה הוא עומד למחוק
  const counts = new Map<string, number>();
  for (const l of links ?? []) {
    counts.set(l.category_id, (counts.get(l.category_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink-900">קטגוריות וערים</h1>
      <p className="mb-6 text-sm text-ink-500">
        תמונת הקטגוריה מוצגת בעמוד הבית, בתפריט הקטגוריות ובעמוד ״כל הקטגוריות״.
      </p>
      <CategoryManager
        categories={(categories ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          parentId: c.parent_id,
          isActive: c.is_active,
          imageUrl: c.image_url,
          businessCount: counts.get(c.id) ?? 0,
        }))}
        cities={cities ?? []}
      />
    </div>
  );
}
