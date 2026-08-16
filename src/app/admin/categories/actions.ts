"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { resolveImageField } from "@/lib/uploads";

/**
 * ניהול קטגוריות וערים.
 *
 * תמונת הקטגוריה היא לא קישוט — היא מה שמוצג בכל מקום שבו קטגוריה
 * מופיעה: רצועת עמוד הבית, תפריט הקטגוריות, עמוד /categories והתפריט
 * הנייד. לכן היא עוברת דרך אותו נתיב העלאה כמו כל תמונה אחרת באתר.
 *
 * revalidatePath("/", "layout") נדרש כי הקטגוריות נטענות ב-layout
 * השורשי (לתפריט העליון) — רענון של עמוד בודד לא היה מעדכן אותן.
 */
function refreshCategoryViews() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  revalidatePath("/categories");
}

export async function createCategory(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "שם הקטגוריה הוא שדה חובה." };

  const image = await resolveImageField(formData, {
    fileKey: "image", urlKey: "__none__", folder: "categories",
  });
  if (!image.ok) return { ok: false, error: image.error };

  const { error } = await supabase.from("categories").insert({
    name,
    slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
    parent_id: String(formData.get("parentId") ?? "") || null,
    image_url: image.url ?? null,
  });

  refreshCategoryViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** שינוי שם ותמונה לקטגוריה קיימת. */
export async function updateCategory(id: string, formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const image = await resolveImageField(formData, {
    fileKey: "image", urlKey: "__none__", clearKey: "imageClear", folder: "categories",
  });
  if (!image.ok) return { ok: false, error: image.error };

  const patch: Record<string, unknown> = {};

  const name = String(formData.get("name") ?? "").trim();
  if (name) patch.name = name;
  // undefined = לא נגעו בשדה התמונה; null = ביקשו להסיר אותה.
  if (image.url !== undefined) patch.image_url = image.url;

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("categories").update(patch).eq("id", id);

  refreshCategoryViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase.from("categories").update({ is_active: isActive }).eq("id", id);
  refreshCategoryViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteCategory(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  // בדיקה לפני מחיקה: קטגוריה עם עסקים משויכים היא מחיקה שמשנה את
  // האתר הציבורי בלי שהמנהל התכוון לכך. עדיף להשבית אותה.
  const { count } = await supabase
    .from("business_categories")
    .select("business_id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `לקטגוריה משויכים ${count} עסקים. הסירו את השיוך או השביתו אותה במקום למחוק.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  refreshCategoryViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function createCity(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "שם העיר הוא שדה חובה." };

  const { error } = await supabase.from("cities").insert({
    name,
    slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteCity(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { count } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("city_id", id);

  if ((count ?? 0) > 0) {
    return { ok: false, error: `${count} עסקים משויכים לעיר הזו. שנו את שיוכם לפני המחיקה.` };
  }

  const { error } = await supabase.from("cities").delete().eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return error ? { ok: false, error: error.message } : { ok: true };
}
