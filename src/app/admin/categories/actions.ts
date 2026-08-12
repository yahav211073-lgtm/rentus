"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function createCategory(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();

  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;
  if (!name) return { ok: false, error: "שם חסר." };

  const { error } = await supabase!.from("categories").insert({
    name,
    slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
    parent_id: parentId,
  });

  revalidatePath("/admin/categories");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.from("categories").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/categories");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteCategory(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function createCity(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "שם חסר." };

  const { error } = await supabase!.from("cities").insert({
    name,
    slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
  });

  revalidatePath("/admin/categories");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteCity(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.from("cities").delete().eq("id", id);
  revalidatePath("/admin/categories");
  return error ? { ok: false, error: error.message } : { ok: true };
}
