"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * כל הפעולות כאן משתמשות ב-admin client (service role) בכוונה —
 * status/tier/is_featured/boost_score נעולים ל-authenticated ברמת
 * העמודה (0009_rls.sql), וזה כולל אדמינים: profiles.role='admin'
 * לא הופך את חיבור ה-DB לתפקיד Postgres שונה. requireStaff() הוא
 * קו ההגנה בפועל כאן, ולכן הוא הדבר הראשון בכל פעולה.
 */

export async function approveBusiness(businessId: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!
    .from("businesses")
    .update({ status: "published" })
    .eq("id", businessId);

  revalidatePath("/admin/businesses");
  revalidatePath("/admin");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function rejectBusiness(businessId: string, reason: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!
    .from("businesses")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", businessId);

  revalidatePath("/admin/businesses");
  revalidatePath("/admin");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setBusinessArchived(businessId: string, archived: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!
    .from("businesses")
    .update({ status: archived ? "archived" : "published" })
    .eq("id", businessId);

  revalidatePath("/admin/businesses");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export interface BusinessAdminUpdate {
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  status: string;
  tier: string;
  isFeatured: boolean;
  isSponsored: boolean;
  isVerified: boolean;
  boostScore: number;
  categoryId: string | null;
}

export async function updateBusinessAdmin(businessId: string, update: BusinessAdminUpdate) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase!
    .from("businesses")
    .update({
      name: update.name,
      tagline: update.tagline,
      description: update.description,
      address: update.address,
      latitude: update.latitude,
      longitude: update.longitude,
      phone: update.phone,
      whatsapp: update.whatsapp,
      email: update.email,
      website: update.website,
      status: update.status,
      tier: update.tier,
      is_featured: update.isFeatured,
      is_sponsored: update.isSponsored,
      is_verified: update.isVerified,
      boost_score: update.boostScore,
    })
    .eq("id", businessId);

  if (error) return { ok: false, error: error.message };

  if (update.categoryId) {
    // מוודאים שיש בדיוק שיוך קטגוריה-ראשית אחד: מוחקים ומכניסים מחדש
    // במקום upsert, כי אין מפתח ייחודי יציב שמזהה "השורה הראשית הישנה".
    await supabase!.from("business_categories").delete().eq("business_id", businessId).eq("is_primary", true);
    await supabase!.from("business_categories").insert({
      business_id: businessId, category_id: update.categoryId, is_primary: true,
    });
  }

  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { ok: true };
}
