import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata = { title: "ניהול קטגוריות וערים", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: categories }, { data: cities }] = await Promise.all([
    supabase!.from("categories").select("id, name, parent_id, is_active").order("sort_order"),
    supabase!.from("cities").select("id, name").order("sort_order"),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink-900">קטגוריות וערים</h1>
      <CategoryManager
        categories={(categories ?? []).map((c) => ({
          id: c.id, name: c.name, parentId: c.parent_id, isActive: c.is_active,
        }))}
        cities={cities ?? []}
      />
    </div>
  );
}
