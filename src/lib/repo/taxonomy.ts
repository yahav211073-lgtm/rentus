import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { seedCategories, seedCities } from "@/data/seed";

export interface FlatCategory {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
}

export interface SimpleCity {
  id: string;
  slug: string;
  name: string;
}

/** רשימה שטוחה (הורים+ילדים) — לשימוש בתפריטי בחירה בטפסים. */
export async function getFlatCategories(): Promise<FlatCategory[]> {
  if (!isSupabaseConfigured) {
    return seedCategories.flatMap((c) => [
      { id: c.id, slug: c.slug, name: c.name, parentId: null },
      ...(c.children ?? []).map((s) => ({ id: s.id, slug: s.slug, name: s.name, parentId: c.id })),
    ]);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, parent_id")
    .eq("is_active", true)
    .order("sort_order");

  return (data ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name, parentId: c.parent_id }));
}

export async function getCities(): Promise<SimpleCity[]> {
  if (!isSupabaseConfigured) {
    return seedCities.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cities").select("id, slug, name").eq("is_active", true).order("sort_order");

  return data ?? [];
}

export interface SimpleArea {
  id: string;
  slug: string;
  name: string;
}

/**
 * אזורי הארץ — משמשים כקיצורי סינון בעמודי הקטגוריה ובחיפוש.
 *
 * מוחזרים ללא ספירת עסקים בכוונה: הספירה דורשת צירוף מול businesses,
 * ובעמוד קטגוריה הקישור ממילא מוביל ל-/search שמחשב שם את הפאסטים
 * המדויקים. ספירה כפולה כאן הייתה מוסיפה שאילתה לכל טעינת עמוד
 * בשביל מספר שמוצג לרגע.
 */
export async function getAreas(): Promise<SimpleArea[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("areas").select("id, slug, name").eq("is_active", true).order("sort_order");

  return data ?? [];
}
